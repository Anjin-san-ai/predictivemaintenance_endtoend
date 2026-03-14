// =============================================================================
// COMPASS Scheduling Engine — Schedule Diff
// =============================================================================
// Compares two GanttAircraft[] snapshots (before/after adding a flight) and
// returns the set of changes: reassigned flights and maintenance adjustments.
//
// Maintenance matching strategy
// ─────────────────────────────
// Block IDs are re-stamped on every re-run (fresh future blocks always get new
// IDs), so ID-based matching will miss every moved future block. Instead we
// match by TASK FINGERPRINT — the sorted, comma-joined set of taskIds in each
// block. Two blocks on the same tail containing the same tasks are the same
// logical maintenance event, regardless of their block ID.
//
// Recurring maintenance (same tasks, multiple windows):
// When two or more blocks on the same tail share the same fingerprint (e.g.
// two scheduled "oil check" windows), we collect them into an array and pair
// them positionally (1st before ↔ 1st after, 2nd before ↔ 2nd after, etc.).
// Any "after" blocks beyond the count of "before" blocks are treated as new.
// =============================================================================

import type { GanttAircraft, GanttMaintenanceItem } from './types';

export interface ReassignedFlight {
  flightNumber: number;
  fromTail: string;
  toTail: string;
  /** Human-readable route string, e.g. "LHR → JFK → LAX" */
  route: string;
}

/** A maintenance block whose scheduled time changed between runs. */
export interface ShiftedMaintenanceBlock {
  tailNumber: string;
  taskNames: string[];
  fromStart: string; // "YYYY-MM-DD HH:MM"
  toStart: string;
  /** Negative = pulled earlier (hours impact). Positive = pushed later. */
  daysDelta: number;
}

/** A maintenance block that was not scheduled before but appears after the re-run. */
export interface NewMaintenanceBlock {
  tailNumber: string;
  taskNames: string[];
  scheduledStart: string; // "YYYY-MM-DD HH:MM"
  scheduledEnd: string;
}

export interface ScheduleImpact {
  addedFlight: {
    flightNumber: number;
    tailNumber: string | null;
    route: string;
    /** Duration of the new flight in hours (computed from its legs). */
    durationHours: number;
  };
  reassignedFlights: ReassignedFlight[];
  /** Existing maintenance blocks whose schedule time changed due to the re-run. */
  shiftedMaintenance: ShiftedMaintenanceBlock[];
  /** New maintenance blocks triggered (tasks that weren't due before are now due). */
  newMaintenance: NewMaintenanceBlock[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Stable fingerprint for a maintenance block based on its task content. */
function taskFingerprint(m: GanttMaintenanceItem): string {
  return m.tasks
    .map(t => t.taskId)
    .sort()
    .join(',');
}

function blockStart(m: GanttMaintenanceItem): string {
  return `${m.scheduleStartDate} ${m.scheduleStartTime}`;
}

function blockEnd(m: GanttMaintenanceItem): string {
  return `${m.scheduleEndDate} ${m.scheduleEndTime}`;
}

function parseBlockDate(dateStr: string): Date {
  // dateStr format: "YYYY-MM-DD HH:MM"
  return new Date(dateStr.replace(' ', 'T') + ':00Z');
}

function daysDelta(fromStr: string, toStr: string): number {
  const diff = parseBlockDate(toStr).getTime() - parseBlockDate(fromStr).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Diff two schedule snapshots to produce a ScheduleImpact summary.
 *
 * @param before           - GanttAircraft[] before the new flight was applied.
 * @param after            - GanttAircraft[] after the new flight was applied.
 * @param newFlightNumber  - The flight number that was just added.
 * @param newFlightHours   - Total flight hours of the new trip (sum of leg durations).
 */
export function diffSchedule(
  before: GanttAircraft[],
  after: GanttAircraft[],
  newFlightNumber: number,
  newFlightHours: number,
): ScheduleImpact {
  // ── Build before lookups ──────────────────────────────────────────────────

  const beforeFlightTail = new Map<number, string>();
  for (const aircraft of before) {
    for (const route of aircraft.routes) {
      if (route.length === 0) continue;
      const fn = route[0].flightNumber;
      if (fn !== undefined) beforeFlightTail.set(fn, aircraft.tailNumber);
    }
  }

  // Per-tail map: task fingerprint → ordered list of blocks (for before maintenance).
  // Using arrays so recurring blocks with the same task set are preserved in order
  // rather than the second silently overwriting the first (F1 fingerprint collision fix).
  const beforeMaintByTail = new Map<string, Map<string, GanttMaintenanceItem[]>>();
  for (const aircraft of before) {
    const fp = new Map<string, GanttMaintenanceItem[]>();
    for (const m of aircraft.maintenance) {
      const key = taskFingerprint(m);
      const existing = fp.get(key);
      if (existing) {
        existing.push(m);
      } else {
        fp.set(key, [m]);
      }
    }
    beforeMaintByTail.set(aircraft.tailNumber, fp);
  }

  // ── Build after lookups ───────────────────────────────────────────────────

  const afterFlightTail   = new Map<number, string>();
  const afterFlightRoutes = new Map<number, string>();
  for (const aircraft of after) {
    for (const route of aircraft.routes) {
      if (route.length === 0) continue;
      const fn = route[0].flightNumber;
      if (fn !== undefined) {
        afterFlightTail.set(fn, aircraft.tailNumber);
        const stops = route.map(l => l.from).concat(route[route.length - 1].to);
        afterFlightRoutes.set(fn, stops.join(' → '));
      }
    }
  }

  // ── Added flight ──────────────────────────────────────────────────────────

  const addedFlight = {
    flightNumber:  newFlightNumber,
    tailNumber:    afterFlightTail.get(newFlightNumber) ?? null,
    route:         afterFlightRoutes.get(newFlightNumber) ?? '',
    durationHours: newFlightHours,
  };

  // ── Reassigned flights ────────────────────────────────────────────────────

  const reassignedFlights: ReassignedFlight[] = [];
  for (const [fn, afterTail] of afterFlightTail.entries()) {
    if (fn === newFlightNumber) continue;
    const beforeTail = beforeFlightTail.get(fn);
    if (beforeTail !== undefined && beforeTail !== afterTail) {
      reassignedFlights.push({
        flightNumber: fn,
        fromTail:     beforeTail,
        toTail:       afterTail,
        route:        afterFlightRoutes.get(fn) ?? '',
      });
    }
  }

  // ── Maintenance diff (fingerprint-based) ─────────────────────────────────
  //
  // For each tail, group "after" blocks by fingerprint and pair them positionally
  // with the corresponding "before" group. This correctly handles recurring
  // maintenance where multiple blocks share the same task fingerprint.

  const shiftedMaintenance: ShiftedMaintenanceBlock[] = [];
  const newMaintenance: NewMaintenanceBlock[] = [];

  for (const aircraft of after) {
    const beforeFpMap = beforeMaintByTail.get(aircraft.tailNumber) ?? new Map<string, GanttMaintenanceItem[]>();

    // Group "after" blocks by fingerprint, preserving encounter order within each group.
    const afterByFp = new Map<string, GanttMaintenanceItem[]>();
    for (const m of aircraft.maintenance) {
      const key = taskFingerprint(m);
      const existing = afterByFp.get(key);
      if (existing) {
        existing.push(m);
      } else {
        afterByFp.set(key, [m]);
      }
    }

    // Pair each "after" group positionally with the corresponding "before" group.
    for (const [fp, afterBlocks] of afterByFp.entries()) {
      const beforeBlocks = beforeFpMap.get(fp) ?? [];

      for (let i = 0; i < afterBlocks.length; i++) {
        const m = afterBlocks[i];
        const prev = beforeBlocks[i]; // undefined when "after" has more than "before"

        if (prev === undefined) {
          // No matching "before" block at this position — this is a new block.
          newMaintenance.push({
            tailNumber:     aircraft.tailNumber,
            taskNames:      m.tasks.map(t => t.taskName),
            scheduledStart: blockStart(m),
            scheduledEnd:   blockEnd(m),
          });
        } else {
          // Matched — check if the scheduled time changed.
          const fromStart = blockStart(prev);
          const toStart   = blockStart(m);
          if (fromStart !== toStart) {
            shiftedMaintenance.push({
              tailNumber: aircraft.tailNumber,
              taskNames:  m.tasks.map(t => t.taskName),
              fromStart,
              toStart,
              daysDelta: daysDelta(fromStart, toStart),
            });
          }
        }
      }
    }
  }

  return { addedFlight, reassignedFlights, shiftedMaintenance, newMaintenance };
}
