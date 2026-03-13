/**
 * Intelligent Scheduling Engine
 *
 * Assigns new flights to the best available aircraft, computes flight hours,
 * evaluates maintenance thresholds, inserts maintenance blocks, and resolves
 * any downstream schedule conflicts — all without mutating existing data
 * structures or touching the UI layer.
 */

// ---------------------------------------------------------------------------
// Types (mirror the interfaces in FlightMaintenanceSchedule/index.tsx)
// ---------------------------------------------------------------------------

interface RouteLeg {
  from: string;
  to: string;
  departureDate: string;
  arrivalDate: string;
  departureTime: string;
  arrivalTime: string;
}

interface MaintenanceItem {
  id: string;
  type: string;
  scheduleStartDate: string;
  scheduleEndDate: string;
  scheduleStartTime: string;
  scheduleEndTime: string;
}

interface Aircraft {
  tailNumber: string;
  status: string;
  routes: RouteLeg[][];
  maintenance: MaintenanceItem[];
}

// ---------------------------------------------------------------------------
// Maintenance rules
// ---------------------------------------------------------------------------

interface FlightHourRule {
  type: 'Planned' | 'In-Depth';
  everyHours: number;
  durationDays: number;
}

const FLIGHT_HOUR_RULES: FlightHourRule[] = [
  { type: 'Planned',  everyHours: 1000, durationDays: 2 },
  { type: 'In-Depth', everyHours: 3000, durationDays: 7 },
];

/**
 * Demo baseline hours.  ZZ198 is seeded at 980 hours so that any new flight
 * longer than ~20 hours crosses the 1,000-hour Planned maintenance threshold
 * and triggers an automatic maintenance block insertion on every demo run.
 */
const BASE_FLIGHT_HOURS: Record<string, number> = {
  'ZZ198': 980,
  'ZZ199': 2950,
};

// ---------------------------------------------------------------------------
// Date / time helpers
// ---------------------------------------------------------------------------

/** Parse "YYYY-MM-DD" + "HH:MM" into a Date. */
function parseDateTime(dateStr: string, timeStr: string): Date {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = timeStr.split(':').map(Number);
  return new Date(y, mo - 1, d, h, mi, 0, 0);
}

/** Format a Date as "YYYY-MM-DD". */
function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Format a Date as "HH:MM". */
function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Add N calendar days to a Date, returning a new Date. */
function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

/** Return decimal hours between two Date objects (handles negative by abs). */
function hoursBetween(start: Date, end: Date): number {
  return Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

// ---------------------------------------------------------------------------
// Flight-hour computation
// ---------------------------------------------------------------------------

/**
 * Compute total historical flight hours for an aircraft.
 * Sums the wall-clock duration of every leg across all journeys,
 * then adds the aircraft's base demo hours (if any).
 */
export function computeFlightHours(aircraft: Aircraft): number {
  const base = BASE_FLIGHT_HOURS[aircraft.tailNumber] ?? 0;
  let accumulated = 0;

  for (const journey of aircraft.routes) {
    for (const leg of journey) {
      const dep = parseDateTime(leg.departureDate, leg.departureTime);
      const arr = parseDateTime(leg.arrivalDate, leg.arrivalTime);
      accumulated += hoursBetween(dep, arr);
    }
  }

  return base + accumulated;
}

/**
 * Compute the total flight duration (hours) for a single proposed route
 * (first departure → last arrival).
 */
export function computeRouteDuration(route: RouteLeg[]): number {
  if (route.length === 0) return 0;
  const first = route[0];
  const last  = route[route.length - 1];
  const dep = parseDateTime(first.departureDate, first.departureTime);
  const arr = parseDateTime(last.arrivalDate, last.arrivalTime);
  return hoursBetween(dep, arr);
}

// ---------------------------------------------------------------------------
// Conflict detection
// ---------------------------------------------------------------------------

/** Returns true if [startA, endA] and [startB, endB] overlap (inclusive). */
function windowsOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA <= endB && endA >= startB;
}

/**
 * Returns true if the given window overlaps any existing flight journey or
 * maintenance block on the aircraft.
 */
export function hasConflict(
  aircraft: Aircraft,
  windowStart: Date,
  windowEnd: Date,
): boolean {
  // Check existing flight journeys
  for (const journey of aircraft.routes) {
    if (journey.length === 0) continue;
    const first = journey[0];
    const last  = journey[journey.length - 1];
    const jStart = parseDateTime(first.departureDate, first.departureTime);
    const jEnd   = parseDateTime(last.arrivalDate, last.arrivalTime);
    if (windowsOverlap(windowStart, windowEnd, jStart, jEnd)) return true;
  }

  // Check maintenance blocks (Planned and In-Depth both block)
  for (const m of aircraft.maintenance) {
    const mStart = parseDateTime(m.scheduleStartDate, m.scheduleStartTime);
    const mEnd   = parseDateTime(m.scheduleEndDate, m.scheduleEndTime);
    if (windowsOverlap(windowStart, windowEnd, mStart, mEnd)) return true;
  }

  return false;
}

/**
 * Returns true if any In-Depth maintenance block on the aircraft overlaps
 * the given window (full aircraft lock during depth maintenance).
 */
function isLockedByDepthMaintenance(
  aircraft: Aircraft,
  windowStart: Date,
  windowEnd: Date,
): boolean {
  for (const m of aircraft.maintenance) {
    if (m.type !== 'In-Depth' && m.type !== 'Depth') continue;
    const mStart = parseDateTime(m.scheduleStartDate, m.scheduleStartTime);
    const mEnd   = parseDateTime(m.scheduleEndDate, m.scheduleEndTime);
    if (windowsOverlap(windowStart, windowEnd, mStart, mEnd)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Aircraft selection
// ---------------------------------------------------------------------------

/**
 * Find the best available aircraft for the proposed route.
 *
 * Eligibility:
 *   1. Not locked by In-Depth maintenance during the flight window.
 *   2. No schedule conflict with any existing flight or maintenance.
 *
 * Among eligible aircraft, prefers those with the fewest future routes
 * (least busy).  Falls back to 'ZZ198' if no aircraft is free.
 */
export function findBestAircraft(
  fleetData: Aircraft[],
  proposedRoute: RouteLeg[],
): string {
  if (proposedRoute.length === 0) return 'ZZ198';

  const first = proposedRoute[0];
  const last  = proposedRoute[proposedRoute.length - 1];
  const windowStart = parseDateTime(first.departureDate, first.departureTime);
  const windowEnd   = parseDateTime(last.arrivalDate, last.arrivalTime);
  const nowString   = formatDate(new Date());

  const candidates: { tailNumber: string; futureFligths: number }[] = [];

  for (const aircraft of fleetData) {
    if (isLockedByDepthMaintenance(aircraft, windowStart, windowEnd)) continue;
    if (hasConflict(aircraft, windowStart, windowEnd)) continue;

    // Count future routes (for tie-breaking)
    const futureRoutes = aircraft.routes.filter(
      j => j.length > 0 && j[0].departureDate >= nowString,
    ).length;

    candidates.push({ tailNumber: aircraft.tailNumber, futureFligths: futureRoutes });
  }

  if (candidates.length === 0) return 'ZZ198';

  // Sort by least busy (fewest future routes)
  candidates.sort((a, b) => a.futureFligths - b.futureFligths);

  // Prefer ZZ198 if it is among the least-busy candidates (demo consistency)
  const zz198 = candidates.find(c => c.tailNumber === 'ZZ198');
  if (zz198 && zz198.futureFligths === candidates[0].futureFligths) {
    return 'ZZ198';
  }

  return candidates[0].tailNumber;
}

// ---------------------------------------------------------------------------
// Maintenance requirement computation
// ---------------------------------------------------------------------------

/**
 * After assigning a new route to an aircraft, determine which maintenance
 * blocks need to be inserted.
 *
 * For each FLIGHT_HOUR_RULE:
 *   - previousHours = computeFlightHours(aircraft) - newFlightHours
 *   - currentHours  = computeFlightHours(aircraft)   (route already pushed)
 *   - If floor(currentHours / everyHours) > floor(previousHours / everyHours),
 *     the threshold has been crossed → schedule maintenance.
 *
 * Maintenance starts the day after the route's last arrival at 06:00.
 * If multiple rules fire simultaneously, the longer duration wins for the
 * shared start date (tasks are grouped into one maintenance window).
 */
export function computeRequiredMaintenance(
  aircraft: Aircraft,
  newRoute: RouteLeg[],
): MaintenanceItem[] {
  if (newRoute.length === 0) return [];

  const newFlightHours = computeRouteDuration(newRoute);
  const currentHours   = computeFlightHours(aircraft); // route already pushed
  const previousHours  = currentHours - newFlightHours;

  const lastLeg    = newRoute[newRoute.length - 1];
  const arrivalDt  = parseDateTime(lastLeg.arrivalDate, lastLeg.arrivalTime);
  const maintStart = addDays(arrivalDt, 1);
  maintStart.setHours(6, 0, 0, 0);

  const triggered: { type: 'Planned' | 'In-Depth'; durationDays: number }[] = [];

  for (const rule of FLIGHT_HOUR_RULES) {
    const prevBucket = Math.floor(previousHours / rule.everyHours);
    const currBucket = Math.floor(currentHours  / rule.everyHours);
    if (currBucket > prevBucket) {
      triggered.push({ type: rule.type, durationDays: rule.durationDays });
    }
  }

  if (triggered.length === 0) return [];

  // Use the longest duration among all triggered rules
  const maxDuration = Math.max(...triggered.map(t => t.durationDays));
  // Use the highest-severity type (In-Depth > Planned)
  const severity = triggered.some(t => t.type === 'In-Depth') ? 'In-Depth' : 'Planned';

  const maintEnd = addDays(maintStart, maxDuration);
  maintEnd.setHours(18, 0, 0, 0);

  const id = `${Math.floor(Math.random() * 90000) + 10000}`;

  return [
    {
      id,
      type: severity,
      scheduleStartDate: formatDate(maintStart),
      scheduleEndDate:   formatDate(maintEnd),
      scheduleStartTime: formatTime(maintStart),
      scheduleEndTime:   formatTime(maintEnd),
    },
  ];
}

// ---------------------------------------------------------------------------
// Conflict resolution
// ---------------------------------------------------------------------------

/**
 * After inserting maintenance blocks on `affectedTail`, find any existing
 * future routes on that aircraft that now conflict with those blocks and
 * either:
 *   a) Move them to the best available alternative aircraft, or
 *   b) Shift their dates to begin the day after the maintenance window ends.
 */
function resolveConflicts(
  fleetData: Aircraft[],
  affectedTail: string,
  maintenanceBlocks: MaintenanceItem[],
): Aircraft[] {
  if (maintenanceBlocks.length === 0) return fleetData;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const updatedFleet = fleetData.map(a => ({
    ...a,
    routes:      a.routes.map(j => [...j]),
    maintenance: [...a.maintenance],
  }));

  const affected = updatedFleet.find(a => a.tailNumber === affectedTail);
  if (!affected) return updatedFleet;

  // Find the outermost maintenance window across all inserted blocks
  let maintWindowStart = parseDateTime(
    maintenanceBlocks[0].scheduleStartDate,
    maintenanceBlocks[0].scheduleStartTime,
  );
  let maintWindowEnd = parseDateTime(
    maintenanceBlocks[0].scheduleEndDate,
    maintenanceBlocks[0].scheduleEndTime,
  );
  for (const blk of maintenanceBlocks) {
    const s = parseDateTime(blk.scheduleStartDate, blk.scheduleStartTime);
    const e = parseDateTime(blk.scheduleEndDate, blk.scheduleEndTime);
    if (s < maintWindowStart) maintWindowStart = s;
    if (e > maintWindowEnd)   maintWindowEnd   = e;
  }

  // Identify conflicting future routes on the affected aircraft
  const conflictingIndices: number[] = [];
  for (let i = 0; i < affected.routes.length; i++) {
    const journey = affected.routes[i];
    if (journey.length === 0) continue;
    const first    = journey[0];
    const last     = journey[journey.length - 1];
    const jStart   = parseDateTime(first.departureDate, first.departureTime);
    const jEnd     = parseDateTime(last.arrivalDate, last.arrivalTime);
    // Only consider future routes
    if (jEnd < now) continue;
    if (windowsOverlap(jStart, jEnd, maintWindowStart, maintWindowEnd)) {
      conflictingIndices.push(i);
    }
  }

  // Process in reverse so splice indices stay valid
  for (let idx = conflictingIndices.length - 1; idx >= 0; idx--) {
    const routeIdx = conflictingIndices[idx];
    const journey  = affected.routes[routeIdx];
    const jStart   = parseDateTime(journey[0].departureDate, journey[0].departureTime);
    const jEnd     = parseDateTime(
      journey[journey.length - 1].arrivalDate,
      journey[journey.length - 1].arrivalTime,
    );

    // Try to find an alternative aircraft
    const altAircraft = updatedFleet.find(
      a =>
        a.tailNumber !== affectedTail &&
        !isLockedByDepthMaintenance(a, jStart, jEnd) &&
        !hasConflict(a, jStart, jEnd),
    );

    if (altAircraft) {
      // Move route to alternative aircraft
      altAircraft.routes.push(journey);
      affected.routes.splice(routeIdx, 1);
    } else {
      // Shift route to begin the day after maintenance ends
      const shiftStart  = addDays(maintWindowEnd, 1);
      shiftStart.setHours(journey[0].departureTime.split(':').map(Number)[0], 0, 0, 0);
      const durationMs  = jEnd.getTime() - jStart.getTime();
      const shiftEnd    = new Date(shiftStart.getTime() + durationMs);
      const daysShifted = Math.round(
        (shiftStart.getTime() - jStart.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Shift every leg in the journey by the same number of days
      affected.routes[routeIdx] = journey.map(leg => {
        const depDt = parseDateTime(leg.departureDate, leg.departureTime);
        const arrDt = parseDateTime(leg.arrivalDate, leg.arrivalTime);
        depDt.setDate(depDt.getDate() + daysShifted);
        arrDt.setDate(arrDt.getDate() + daysShifted);
        return {
          ...leg,
          departureDate: formatDate(depDt),
          arrivalDate:   formatDate(arrDt),
        };
      });
      void shiftEnd; // used only for reference
    }
  }

  return updatedFleet;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export interface SchedulingResult {
  updatedFleetData: Aircraft[];
  assignedTailNumber: string;
  maintenanceInserted: MaintenanceItem[];
}

/**
 * Process a newly confirmed flight:
 *   1. Find the best available aircraft.
 *   2. Assign the flight to that aircraft.
 *   3. Evaluate maintenance thresholds.
 *   4. Insert any required maintenance blocks.
 *   5. Resolve conflicts caused by the new maintenance.
 *   6. Return the updated fleet state.
 */
export function processNewFlight(
  fleetData: Aircraft[],
  pendingFlightData: any,
): SchedulingResult {
  const proposedRoute: RouteLeg[] = pendingFlightData?.route ?? [];

  // Deep-clone to avoid mutating React state directly
  const clonedFleet: Aircraft[] = fleetData.map(a => ({
    ...a,
    routes:      a.routes.map(j => j.map(leg => ({ ...leg }))),
    maintenance: a.maintenance.map(m => ({ ...m })),
  }));

  const assignedTailNumber = findBestAircraft(clonedFleet, proposedRoute);
  const assignedAircraft   = clonedFleet.find(a => a.tailNumber === assignedTailNumber);

  if (!assignedAircraft) {
    return { updatedFleetData: clonedFleet, assignedTailNumber: 'ZZ198', maintenanceInserted: [] };
  }

  // 1. Assign the new flight
  assignedAircraft.routes.push(proposedRoute);

  // 2. Evaluate maintenance requirements (uses currentHours which now includes new route)
  const maintenanceInserted = computeRequiredMaintenance(assignedAircraft, proposedRoute);

  // 3. Insert maintenance blocks
  for (const block of maintenanceInserted) {
    assignedAircraft.maintenance.push(block);
  }

  // 4. Resolve conflicts caused by the new maintenance
  const updatedFleetData = resolveConflicts(clonedFleet, assignedTailNumber, maintenanceInserted);

  return { updatedFleetData, assignedTailNumber, maintenanceInserted };
}
