// =============================================================================
// COMPASS Scheduling Engine — Trip Assigner
// =============================================================================
// Assigns multi-leg trips to tail numbers using a deterministic scoring model.
// Rules:
//   1. Trips are processed in chronological order (earliest departure first).
//   2. A trip can only go on a tail where every leg fits without:
//      - Overlapping a maintenance block.
//      - A <4h gap after any maintenance block ending before the trip.
//      - A <4h gap before the previous flight block on that tail.
//      - Maintenance being inserted between legs of the same trip.
//   3. Among feasible tails, pick the one that keeps fleet utilisation
//      (hours) most balanced. Tie-break: lowest current hours.
// =============================================================================

import type {
  FlightLeg,
  Trip,
  MaintenanceBlock,
  FlightBlock,
  TailStatus,
  RawFlightLeg,
} from './types';
import { legDurationHours } from './imputation';

const MS_PER_HOUR = 3_600_000;
const MIN_GAP_BETWEEN_FLIGHTS_MS = 4 * MS_PER_HOUR;

// -----------------------------------------------------------------------------
// Flight leg helpers
// -----------------------------------------------------------------------------

/**
 * Combine a UTC-midnight Date and "HH:MM" string into a full UTC datetime.
 */
function combineDateAndTime(date: Date, hhMM: string): Date {
  const [h, m] = hhMM.split(':').map(Number);
  return new Date(Date.UTC(
    date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), h, m,
  ));
}

/**
 * Convert raw flight legs into FlightLeg objects with combined departure/arrival
 * Date objects, grouped into Trip structures.
 */
export function buildTrips(rawLegs: RawFlightLeg[]): Trip[] {
  // Combine date + time into single Date objects
  const legs: FlightLeg[] = rawLegs.map(raw => ({
    flightNumber: raw.flightNumber,
    legNumber: raw.legNumber,
    origin: raw.origin,
    destination: raw.destination,
    departure: combineDateAndTime(raw.departureDate, raw.departureTime),
    arrival: combineDateAndTime(raw.arrivalDate, raw.arrivalTime),
  }));

  // Group by flightNumber and sort legs within each trip
  const tripMap = new Map<number, FlightLeg[]>();
  for (const leg of legs) {
    if (!tripMap.has(leg.flightNumber)) tripMap.set(leg.flightNumber, []);
    tripMap.get(leg.flightNumber)!.push(leg);
  }

  const trips: Trip[] = [];
  for (const [tripId, tripLegs] of tripMap.entries()) {
    tripLegs.sort((a, b) => a.legNumber - b.legNumber);
    trips.push({
      tripId,
      legs: tripLegs,
      earliestDeparture: tripLegs[0].departure,
      latestArrival: tripLegs[tripLegs.length - 1].arrival,
    });
  }

  // Process trips in chronological order
  trips.sort((a, b) => a.earliestDeparture.getTime() - b.earliestDeparture.getTime());
  return trips;
}

// -----------------------------------------------------------------------------
// Tail state tracker
// -----------------------------------------------------------------------------

/** Mutable state for a single tail during assignment. */
export interface TailState {
  tailNumber: string;
  flightBlocks: FlightBlock[];
  maintBlocks: MaintenanceBlock[];
  /** Running total of accumulated flight hours. */
  accumulatedFlightHours: number;
  /** Total hours for utilisation balancing (base + accumulated). */
  totalHours: number;
}

// -----------------------------------------------------------------------------
// Feasibility checks
// -----------------------------------------------------------------------------

/**
 * Check whether a trip can be placed on a tail without violating any rules.
 * Returns null if feasible, or a reason string if not.
 */
export function checkTripFeasibility(
  trip: Trip,
  state: TailState,
): string | null {
  const tripStart = trip.earliestDeparture;
  const tripEnd = trip.latestArrival;

  // 1. Check overlap with existing maintenance blocks
  for (const mb of state.maintBlocks) {
    // Check between-legs first (more specific than overall overlap)
    for (let i = 0; i < trip.legs.length - 1; i++) {
      const legEnd = trip.legs[i].arrival;
      const nextLegStart = trip.legs[i + 1].departure;
      const maintInGap =
        mb.startDateTime.getTime() < nextLegStart.getTime() &&
        mb.endDateTime.getTime() > legEnd.getTime();
      if (maintInGap) {
        return `Maintenance block ${mb.blockId} falls between legs of trip ${trip.tripId}`;
      }
    }
    const overlapWithTrip =
      tripStart.getTime() < mb.endDateTime.getTime() &&
      tripEnd.getTime() > mb.startDateTime.getTime();
    if (overlapWithTrip) {
      return `Trip ${trip.tripId} overlaps maintenance block ${mb.blockId}`;
    }
  }

  // 2. Check 4h gap after any maintenance block that ends before this trip starts
  for (const mb of state.maintBlocks) {
    if (mb.endDateTime.getTime() <= tripStart.getTime()) {
      const gap = tripStart.getTime() - mb.endDateTime.getTime();
      if (gap < MIN_GAP_BETWEEN_FLIGHTS_MS) {
        return `Less than 4h gap after maintenance block ${mb.blockId} before trip ${trip.tripId} (gap: ${(gap / MS_PER_HOUR).toFixed(1)}h)`;
      }
    }
  }

  // 3. Check 4h gap before the trip start relative to the last flight block
  if (state.flightBlocks.length > 0) {
    // Find the last flight block that ends before this trip starts
    const blocksBefore = state.flightBlocks
      .filter(fb => fb.end.getTime() <= tripStart.getTime())
      .sort((a, b) => b.end.getTime() - a.end.getTime());

    if (blocksBefore.length > 0) {
      const lastEnd = blocksBefore[0].end;
      const gap = tripStart.getTime() - lastEnd.getTime();
      if (gap < MIN_GAP_BETWEEN_FLIGHTS_MS) {
        return `Less than 4h gap before trip ${trip.tripId} (gap: ${(gap / MS_PER_HOUR).toFixed(1)}h)`;
      }
    }

    // 4. Check that no existing flight block overlaps this trip
    for (const fb of state.flightBlocks) {
      const overlap =
        tripStart.getTime() < fb.end.getTime() &&
        tripEnd.getTime() > fb.start.getTime();
      if (overlap) {
        return `Trip ${trip.tripId} overlaps existing flight block for trip ${fb.tripId}`;
      }
    }
  }

  return null; // Feasible
}

// -----------------------------------------------------------------------------
// Scoring
// -----------------------------------------------------------------------------

/**
 * Score a tail for a given trip. Lower score = better.
 * score = projectedTotalHours + 0.1 * idleGapPenalty
 *
 * Primary: fewest projected total hours (most underutilised tail gets priority).
 * This ensures tails far below the fleet mean are assigned flights first rather
 * than being starved by a "closest to mean" model.
 *
 * idleGapPenalty: idle time (hours) between last block and trip start (excess
 *   beyond the mandatory 4h; penalises wasted capacity at equal utilisation).
 */
export function scoreTail(
  trip: Trip,
  state: TailState,
  _allStates: TailState[],
): number {
  const tripHours = trip.legs.reduce((sum, l) => sum + legDurationHours(l), 0);
  const projectedHours = state.totalHours + tripHours;

  // Idle gap penalty: excess wait time above the mandatory 4h
  let idleGapPenalty = 0;
  const blocksBefore = state.flightBlocks
    .filter(fb => fb.end.getTime() <= trip.earliestDeparture.getTime())
    .sort((a, b) => b.end.getTime() - a.end.getTime());

  if (blocksBefore.length > 0) {
    const lastEnd = blocksBefore[0].end;
    const gap = (trip.earliestDeparture.getTime() - lastEnd.getTime()) / MS_PER_HOUR;
    idleGapPenalty = Math.max(0, gap - 4);
  }

  return projectedHours + 0.1 * idleGapPenalty;
}

// -----------------------------------------------------------------------------
// Early-maintenance helpers
// -----------------------------------------------------------------------------

/**
 * Try to shift a single maintenance block earlier so that a trip can depart
 * at least 4h after the block ends.
 *
 * Returns the shifted block, or null if:
 *   - The block already ends early enough (no shift needed / caller error).
 *   - The new start would fall before `now` (can't schedule maintenance in the past).
 *   - The new start would overlap `precedingEnd` (no room before a prior block).
 */
function tryShiftMaintBlockEarly(
  mb: MaintenanceBlock,
  tripStart: Date,
  now: Date,
  precedingEnd: Date | null,
): MaintenanceBlock | null {
  // Block must end at least 4h before the trip departs
  const newEnd = new Date(tripStart.getTime() - MIN_GAP_BETWEEN_FLIGHTS_MS);

  // Already ends in time — nothing to do
  if (mb.endDateTime.getTime() <= newEnd.getTime()) return null;

  const newStart = new Date(newEnd.getTime() - mb.durationHours * MS_PER_HOUR);

  // Can't move maintenance before the current moment
  if (newStart.getTime() < now.getTime()) return null;

  // Can't overlap the preceding block (flight or maintenance)
  if (precedingEnd !== null && newStart.getTime() < precedingEnd.getTime()) return null;

  return { ...mb, startDateTime: newStart, endDateTime: newEnd };
}

/**
 * Attempt to shift every maintenance block on a tail that conflicts with a trip
 * earlier, so the trip can be assigned.  Blocks are adjusted in chronological
 * order so each shift respects the (possibly already-shifted) preceding block.
 *
 * Returns the full adjusted block list if ALL conflicting blocks can be shifted,
 * or null if any conflict cannot be resolved (e.g. new start < now).
 */
function tryEarlyMaintenanceForTrip(
  trip: Trip,
  state: TailState,
  now: Date,
): MaintenanceBlock[] | null {
  // Work on a shallow copy so we don't mutate state until we're sure it works
  const blocks = state.maintBlocks.map(b => ({ ...b }));
  let anyShifted = false;

  for (let i = 0; i < blocks.length; i++) {
    const mb = blocks[i];

    // Is this block conflicting with the trip?
    const overlapsTrip =
      trip.earliestDeparture.getTime() < mb.endDateTime.getTime() &&
      trip.latestArrival.getTime() > mb.startDateTime.getTime();

    const tooCloseBeforeTrip =
      mb.endDateTime.getTime() <= trip.earliestDeparture.getTime() &&
      trip.earliestDeparture.getTime() - mb.endDateTime.getTime() < MIN_GAP_BETWEEN_FLIGHTS_MS;

    // Also check if it falls between any two legs of the same trip
    let betweenLegs = false;
    for (let j = 0; j < trip.legs.length - 1; j++) {
      const legEnd = trip.legs[j].arrival;
      const nextLegStart = trip.legs[j + 1].departure;
      if (
        mb.startDateTime.getTime() < nextLegStart.getTime() &&
        mb.endDateTime.getTime() > legEnd.getTime()
      ) {
        betweenLegs = true;
        break;
      }
    }

    if (!overlapsTrip && !tooCloseBeforeTrip && !betweenLegs) continue;

    // Compute the end of the last block (flight or maintenance) that precedes mb
    const precedingMaintEnd: Date | null = i > 0 ? blocks[i - 1].endDateTime : null;
    const precedingFlightEnd: Date | null = state.flightBlocks
      .filter(fb => fb.end.getTime() <= mb.startDateTime.getTime())
      .reduce<Date | null>(
        (max, fb) => (max === null || fb.end.getTime() > max.getTime() ? fb.end : max),
        null,
      );

    let precedingEnd: Date | null = null;
    if (precedingMaintEnd && precedingFlightEnd) {
      precedingEnd =
        precedingMaintEnd.getTime() > precedingFlightEnd.getTime()
          ? precedingMaintEnd
          : precedingFlightEnd;
    } else {
      precedingEnd = precedingMaintEnd ?? precedingFlightEnd;
    }

    const shifted = tryShiftMaintBlockEarly(mb, trip.earliestDeparture, now, precedingEnd);
    if (shifted === null) return null; // Can't resolve — tail is not viable

    blocks[i] = shifted;
    anyShifted = true;
  }

  return anyShifted ? blocks : null;
}

// -----------------------------------------------------------------------------
// Assignment engine
// -----------------------------------------------------------------------------

export interface AssignmentResult {
  tailStates: Map<string, TailState>;
  unscheduled: Array<{
    flightNumber: number;
    reason: string;
    departure: Date;
    arrival: Date;
    legs: FlightLeg[];
  }>;
}

/**
 * Assign all trips to tails.
 *
 * @param trips - Trips in chronological order (from buildTrips).
 * @param tailStatuses - Base hours/landings for each tail.
 * @param maintBlocksByTail - Pre-computed maintenance blocks per tail.
 * @param now - Reference time for the maintenance early-shift guard.
 * @param lockedAssignments - Optional map of tripId → tailNumber for trips that
 *   must not be reassigned (e.g. flights that have already departed). These are
 *   pre-seeded onto their designated tail without scoring or feasibility checks,
 *   ensuring a re-run does not displace already-scheduled past flights.
 */
export function assignTrips(
  trips: Trip[],
  tailStatuses: Map<string, TailStatus>,
  maintBlocksByTail: Map<string, MaintenanceBlock[]>,
  now: Date = new Date(),
  lockedAssignments?: Map<number, string>,
): AssignmentResult {
  // Initialise mutable state for every tail
  const tailStates = new Map<string, TailState>();
  for (const [tailNumber, status] of tailStatuses.entries()) {
    tailStates.set(tailNumber, {
      tailNumber,
      flightBlocks: [],
      maintBlocks: maintBlocksByTail.get(tailNumber) ?? [],
      accumulatedFlightHours: 0,
      totalHours: status.currentHours,
    });
  }

  const unscheduled: Array<{ flightNumber: number; reason: string; departure: Date; arrival: Date; legs: FlightLeg[] }> = [];

  for (const trip of trips) {
    // Pre-seed locked trips directly onto their designated tail without scoring.
    // This prevents a re-run from displacing flights that have already departed.
    const lockedTail = lockedAssignments?.get(trip.tripId);
    if (lockedTail !== undefined) {
      const state = tailStates.get(lockedTail);
      if (state) {
        // Shift any future maintenance blocks that conflict with this locked trip.
        // Locked trips bypass feasibility checks, so without this step freshly
        // computed future maintenance can land directly on a locked flight window.
        //
        // Primary strategy: shift conflicting blocks earlier (before the trip).
        // Fallback: if an early shift is blocked (e.g. newStart < now), shift the
        // block to start after the trip ends + the minimum gap. This ensures locked
        // trips — including future flights added interactively — never clash with
        // freshly computed maintenance regardless of when the trip departs.
        const earlyShifted = tryEarlyMaintenanceForTrip(trip, state, now);
        if (earlyShifted !== null) {
          state.maintBlocks = earlyShifted;
        } else {
          // Late-shift fallback: push any conflicting block to after the trip.
          const tripEnd = trip.latestArrival;
          state.maintBlocks = state.maintBlocks.map(mb => {
            const overlapsTrip =
              trip.earliestDeparture.getTime() < mb.endDateTime.getTime() &&
              trip.latestArrival.getTime() > mb.startDateTime.getTime();
            const tooClose =
              mb.endDateTime.getTime() <= trip.earliestDeparture.getTime() &&
              trip.earliestDeparture.getTime() - mb.endDateTime.getTime() < MIN_GAP_BETWEEN_FLIGHTS_MS;
            if (!overlapsTrip && !tooClose) return mb;
            // Shift to start at tripEnd + 4h
            const newStart = new Date(tripEnd.getTime() + MIN_GAP_BETWEEN_FLIGHTS_MS);
            const newEnd = new Date(newStart.getTime() + mb.durationHours * MS_PER_HOUR);
            return { ...mb, startDateTime: newStart, endDateTime: newEnd };
          });
        }

        const tripHours = trip.legs.reduce((sum, l) => sum + legDurationHours(l), 0);
        state.flightBlocks.push({
          tailNumber: lockedTail,
          tripId: trip.tripId,
          legs: trip.legs,
          start: trip.earliestDeparture,
          end: trip.latestArrival,
        });
        state.accumulatedFlightHours += tripHours;
        state.totalHours += tripHours;
        continue;
      }
      // If the locked tail is not in tailStates (unexpected), fall through to
      // normal assignment rather than silently dropping the trip.
    }
    const allStates = Array.from(tailStates.values());

    // Find all feasible tails
    const feasible: Array<{ state: TailState; score: number }> = [];
    const reasons: string[] = [];

    for (const state of allStates) {
      const reason = checkTripFeasibility(trip, state);
      if (reason === null) {
        const score = scoreTail(trip, state, allStates);
        feasible.push({ state, score });
      } else {
        reasons.push(`${state.tailNumber}: ${reason}`);
      }
    }

    // No normally-feasible tail — try scheduling maintenance early to make room
    if (feasible.length === 0) {
      const earlyMaintCandidates: Array<{
        state: TailState;
        score: number;
        adjustedBlocks: MaintenanceBlock[];
      }> = [];

      for (const state of allStates) {
        const adjustedBlocks = tryEarlyMaintenanceForTrip(trip, state, now);
        if (adjustedBlocks === null) continue;

        // Check feasibility against the adjusted block list without mutating state yet
        const tempState: TailState = { ...state, maintBlocks: adjustedBlocks };
        const reason = checkTripFeasibility(trip, tempState);
        if (reason === null) {
          earlyMaintCandidates.push({
            state,
            score: scoreTail(trip, tempState, allStates),
            adjustedBlocks,
          });
        }
      }

      if (earlyMaintCandidates.length > 0) {
        // Pick best candidate using the same sort as normal feasibility
        earlyMaintCandidates.sort((a, b) => {
          const scoreDiff = a.score - b.score;
          if (Math.abs(scoreDiff) > 0.001) return scoreDiff;
          const aHours = tailStatuses.get(a.state.tailNumber)?.currentHours ?? 0;
          const bHours = tailStatuses.get(b.state.tailNumber)?.currentHours ?? 0;
          return aHours - bHours;
        });
        const best = earlyMaintCandidates[0];
        // Commit the maintenance shift for the chosen tail
        best.state.maintBlocks = best.adjustedBlocks;
        feasible.push({ state: best.state, score: best.score });
      }
    }

    if (feasible.length === 0) {
      unscheduled.push({
        flightNumber: trip.tripId,
        reason: `No feasible tail. Reasons: ${reasons.slice(0, 3).join(' | ')}`,
        departure: trip.earliestDeparture,
        arrival: trip.latestArrival,
        legs: trip.legs,
      });
      continue;
    }

    // Sort: lowest score first, tie-break by lowest currentHours
    feasible.sort((a, b) => {
      const scoreDiff = a.score - b.score;
      if (Math.abs(scoreDiff) > 0.001) return scoreDiff;
      const aHours = tailStatuses.get(a.state.tailNumber)?.currentHours ?? 0;
      const bHours = tailStatuses.get(b.state.tailNumber)?.currentHours ?? 0;
      return aHours - bHours;
    });

    const chosen = feasible[0].state;
    const tripHours = trip.legs.reduce((sum, l) => sum + legDurationHours(l), 0);

    const block: FlightBlock = {
      tailNumber: chosen.tailNumber,
      tripId: trip.tripId,
      legs: trip.legs,
      start: trip.earliestDeparture,
      end: trip.latestArrival,
    };

    chosen.flightBlocks.push(block);
    chosen.accumulatedFlightHours += tripHours;
    chosen.totalHours += tripHours;
  }

  return { tailStates, unscheduled };
}
