// =============================================================================
// COMPASS Scheduling Engine — Deterministic Imputation
// =============================================================================
// Generates reproducible values for any blank fields in the raw data.
// Rules must match exactly across all data sources (Excel today, DB later).
// All outputs are deterministic given the same input — no randomness.
// =============================================================================

import type {
  RawMaintTask,
  RawTailStatus,
  RawFlightLeg,
  MaintTask,
  TailStatus,
  FlightLeg,
} from './types';

const MS_PER_HOUR = 3_600_000;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Returns the duration of a flight leg in fractional hours. */
export function legDurationHours(leg: FlightLeg): number {
  return (leg.arrival.getTime() - leg.departure.getTime()) / MS_PER_HOUR;
}

/** Adds `days` calendar days to a UTC date. */
export function addDays(date: Date, days: number): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + days,
  ));
}

/** Subtracts `days` calendar days from a UTC date. */
export function subDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

/** Returns the earliest UTC date across all flight legs. */
export function computeHorizonStart(legs: RawFlightLeg[]): Date {
  if (legs.length === 0) throw new Error('Cannot compute horizonStart: no flight legs provided');
  const dates = legs.map(l => l.departureDate.getTime());
  const minMs = Math.min(...dates);
  return new Date(minMs);
}

/** Returns the latest departure UTC date across all flight legs. */
export function computeHorizonEnd(legs: RawFlightLeg[]): Date {
  if (legs.length === 0) throw new Error('Cannot compute horizonEnd: no flight legs provided');
  const dates = legs.map(l => l.departureDate.getTime());
  const maxMs = Math.max(...dates);
  return new Date(maxMs);
}

/** Returns a sorted (ascending) unique list of all tail numbers. */
export function buildSortedFleet(
  maintTasks: RawMaintTask[],
  tailStatuses: RawTailStatus[],
): string[] {
  const set = new Set<string>();
  for (const t of maintTasks) set.add(t.tailNumber);
  for (const t of tailStatuses) set.add(t.tailNumber);
  return Array.from(set).sort();
}

// -----------------------------------------------------------------------------
// Step A: Impute currentHours and currentLandings
// -----------------------------------------------------------------------------

/**
 * For a given tail, compute imputed currentHours and currentLandings
 * following the deterministic rules in the master prompt.
 */
export function imputeTailStatus(
  tailNumber: string,
  tailIndex: number,
  rawStatus: RawTailStatus | undefined,
  tasksForTail: RawMaintTask[],
): TailStatus {
  const hoursBase = 1675 + 10 * tailIndex;
  const landingsBase = 180 + 12 * tailIndex;

  // --- currentHours ---
  let currentHours: number;
  if (rawStatus?.currentHours != null && rawStatus.currentHours > 0) {
    currentHours = rawStatus.currentHours;
  } else {
    const hoursTasks = tasksForTail.filter(t => t.intervalType === 'Hours');
    if (hoursTasks.length > 0) {
      const hoursAnchor = Math.min(...hoursTasks.map(t => t.interval));
      currentHours = Math.max(Math.round(0.6 * hoursAnchor), hoursBase);
    } else {
      currentHours = hoursBase;
    }
  }

  // --- currentLandings ---
  let currentLandings: number;
  if (rawStatus?.currentLandings != null && rawStatus.currentLandings > 0) {
    currentLandings = rawStatus.currentLandings;
  } else {
    const landingsTasks = tasksForTail.filter(t => t.intervalType === 'Landings');
    if (landingsTasks.length > 0) {
      const landingsAnchor = Math.min(...landingsTasks.map(t => t.interval));
      currentLandings = Math.max(Math.round(0.6 * landingsAnchor), landingsBase);
    } else {
      currentLandings = landingsBase;
    }
  }

  return { tailNumber, currentHours, currentLandings };
}

// -----------------------------------------------------------------------------
// Step B: Impute lastCompletedDate (and implied hours/landings at last completion)
// -----------------------------------------------------------------------------

/**
 * For a single maintenance task, compute the imputed lastCompletedDate and
 * the implied hours/landings at that last completion.
 * Returns the fully populated MaintTask (all fields present, no nulls).
 */
export function imputeMaintTask(
  raw: RawMaintTask,
  tailStatus: TailStatus,
  horizonStart: Date,
  tailIndex: number,
): MaintTask {
  let lastCompletedDate: Date;
  let impliedLastCompletedHours = 0;
  let impliedLastCompletedLandings = 0;

  if (raw.lastCompletedDate !== null) {
    // Use provided value; still compute implied values for tracking
    lastCompletedDate = raw.lastCompletedDate;
    if (raw.intervalType === 'Hours') {
      impliedLastCompletedHours = Math.max(0, tailStatus.currentHours - raw.interval);
      impliedLastCompletedLandings = tailStatus.currentLandings;
    } else if (raw.intervalType === 'Landings') {
      impliedLastCompletedLandings = Math.max(0, tailStatus.currentLandings - raw.interval);
      impliedLastCompletedHours = tailStatus.currentHours;
    } else {
      impliedLastCompletedHours = tailStatus.currentHours;
      impliedLastCompletedLandings = tailStatus.currentLandings;
    }
  } else {
    // Impute per master prompt rules
    if (raw.intervalType === 'Hours') {
      impliedLastCompletedHours = Math.max(0, tailStatus.currentHours - Math.round(0.4 * raw.interval));
      impliedLastCompletedLandings = tailStatus.currentLandings;
      const daysBack = Math.max(1, Math.ceil(0.4 * raw.interval / 8));
      lastCompletedDate = subDays(horizonStart, daysBack);

    } else if (raw.intervalType === 'Landings') {
      impliedLastCompletedLandings = Math.max(0, tailStatus.currentLandings - Math.round(0.4 * raw.interval));
      impliedLastCompletedHours = tailStatus.currentHours;
      const daysBack = Math.max(1, Math.ceil(0.4 * raw.interval / 4));
      lastCompletedDate = subDays(horizonStart, daysBack);

    } else {
      // DAYS-based
      impliedLastCompletedHours = tailStatus.currentHours;
      impliedLastCompletedLandings = tailStatus.currentLandings;
      // LastCompletedDate = (horizonStart - interval days) + (tailIndex mod 3) days
      lastCompletedDate = addDays(
        subDays(horizonStart, raw.interval),
        tailIndex % 3,
      );
    }
  }

  return {
    tailNumber: raw.tailNumber,
    taskId: raw.taskId,
    maintType: raw.maintType,
    maintName: raw.maintName,
    durationHours: raw.durationHours,
    crewCount: raw.crewCount,
    interval: raw.interval,
    intervalType: raw.intervalType,
    lastCompletedDate,
    impliedLastCompletedHours,
    impliedLastCompletedLandings,
    taskDetails: raw.taskDetails,
    trade: raw.trade,
  };
}

// -----------------------------------------------------------------------------
// Public entry point
// -----------------------------------------------------------------------------

export interface ImputationResult {
  tailStatuses: Map<string, TailStatus>;
  maintTasks: Map<string, MaintTask[]>; // keyed by tailNumber
}

/**
 * Apply all deterministic imputation rules to the raw data.
 * Returns fully populated TailStatus and MaintTask records — no nulls.
 */
export function applyImputation(
  rawMaintTasks: RawMaintTask[],
  rawTailStatuses: RawTailStatus[],
  rawFlightLegs: RawFlightLeg[],
): ImputationResult {
  const horizonStart = computeHorizonStart(rawFlightLegs);
  const sortedFleet = buildSortedFleet(rawMaintTasks, rawTailStatuses);

  const tailStatusIndex = new Map<string, RawTailStatus>(
    rawTailStatuses.map(t => [t.tailNumber, t]),
  );

  const tasksByTail = new Map<string, RawMaintTask[]>();
  for (const task of rawMaintTasks) {
    if (!tasksByTail.has(task.tailNumber)) tasksByTail.set(task.tailNumber, []);
    tasksByTail.get(task.tailNumber)!.push(task);
  }

  const tailStatuses = new Map<string, TailStatus>();
  const maintTasks = new Map<string, MaintTask[]>();

  for (const [tailIndex, tailNumber] of sortedFleet.entries()) {
    const rawStatus = tailStatusIndex.get(tailNumber);
    const tasksForTail = tasksByTail.get(tailNumber) ?? [];

    const tailStatus = imputeTailStatus(tailNumber, tailIndex, rawStatus, tasksForTail);
    tailStatuses.set(tailNumber, tailStatus);

    const imputed = tasksForTail.map(raw =>
      imputeMaintTask(raw, tailStatus, horizonStart, tailIndex),
    );
    maintTasks.set(tailNumber, imputed);
  }

  return { tailStatuses, maintTasks };
}
