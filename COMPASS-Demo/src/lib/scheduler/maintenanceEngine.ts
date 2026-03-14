// =============================================================================
// COMPASS Scheduling Engine — Maintenance Engine
// =============================================================================
// Computes when each maintenance task becomes due, groups tasks that fall due
// within the same window, and produces non-overlapping MaintenanceBlocks.
// =============================================================================

import type { MaintTask, TailStatus, FlightLeg, MaintenanceBlock } from './types';
import { addDays, legDurationHours } from './imputation';

const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = MS_PER_HOUR * 24;

/** Formats a Date as "YYYY-MM-DD" in UTC. */
export function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Formats a Date as "HH:MM" in UTC. */
export function toTimeString(d: Date): string {
  return d.toISOString().slice(11, 16);
}

// -----------------------------------------------------------------------------
// Due-event computation
// -----------------------------------------------------------------------------

/**
 * A DueEvent describes a single maintenance task becoming due at or before
 * a specific point in time.
 * - HOURS/LANDINGS: before a specific leg index in the ordered sequence.
 * - DAYS: before or on the due calendar date.
 */
export interface DueEvent {
  task: MaintTask;
  /** The latest DateTime by which the maintenance must START. */
  dueByDateTime: Date;
  /** The leg index before which this must occur (null = date-driven, no specific leg). */
  dueBeforeLegIndex: number | null;
}

/**
 * Compute all due events for a tail's maintenance tasks against the flight
 * legs ordered chronologically for that tail.
 *
 * All tasks are RECURRING — each task fires every time its interval elapses,
 * generating one DueEvent per occurrence within the flight horizon.
 *
 * - HOURS/LANDINGS: occurrence n fires when cumulative flight hours/landings
 *   since last completion reaches n × interval.
 * - DAYS: occurrence n fires at lastCompletedDate + n × interval days;
 *   recurrences stop once the next due date exceeds scheduleHorizonEnd (or the
 *   last assigned flight if scheduleHorizonEnd is not provided).
 *
 * tailStatus carries the current hours/landings at the start of the schedule horizon.
 * scheduleHorizonEnd is the full schedule window end (e.g. horizonStart + 90 days),
 * used so Days-based tasks continue recurring past the tail's last assigned flight.
 */
export function computeDueEvents(
  tasks: MaintTask[],
  legs: FlightLeg[],
  tailStatus: TailStatus,
  scheduleHorizonEnd: Date | null = null,
): DueEvent[] {
  const events: DueEvent[] = [];

  // Upper bound for Days-based recurrence: prefer the full schedule horizon so
  // recurring tasks are not cut short when a tail has few assigned flights.
  // Fall back to the last assigned leg's arrival if no horizon is supplied.
  const horizonEnd =
    scheduleHorizonEnd ?? (legs.length > 0 ? legs[legs.length - 1].arrival : null);

  for (const task of tasks) {
    if (task.intervalType === 'Hours') {
      const alreadyElapsed = tailStatus.currentHours - task.impliedLastCompletedHours;

      // n tracks which occurrence we're looking for next (1-based).
      // Occurrence n is due when cumulative flight hours reaches n*interval - alreadyElapsed.
      let n = 1;

      // Handle overdue occurrences: fire before the first flight.
      while (alreadyElapsed >= n * task.interval) {
        const dueByDateTime = legs.length > 0 ? legs[0].departure : new Date();
        events.push({ task, dueByDateTime, dueBeforeLegIndex: legs.length > 0 ? 0 : null });
        n++;
      }

      // Walk legs, firing each time accumulated hours crosses the next threshold.
      let cumulativeHours = 0;
      for (let i = 0; i < legs.length; i++) {
        cumulativeHours += legDurationHours(legs[i]);
        while (alreadyElapsed + cumulativeHours >= n * task.interval) {
          events.push({ task, dueByDateTime: legs[i].departure, dueBeforeLegIndex: i });
          n++;
        }
      }

    } else if (task.intervalType === 'Landings') {
      const alreadyElapsed = tailStatus.currentLandings - task.impliedLastCompletedLandings;

      let n = 1;

      // Handle overdue occurrences.
      while (alreadyElapsed >= n * task.interval) {
        const dueByDateTime = legs.length > 0 ? legs[0].departure : new Date();
        events.push({ task, dueByDateTime, dueBeforeLegIndex: legs.length > 0 ? 0 : null });
        n++;
      }

      // Walk legs (each leg arrival = 1 landing).
      let cumulativeLandings = 0;
      for (let i = 0; i < legs.length; i++) {
        cumulativeLandings += 1;
        while (alreadyElapsed + cumulativeLandings >= n * task.interval) {
          events.push({ task, dueByDateTime: legs[i].departure, dueBeforeLegIndex: i });
          n++;
        }
      }

    } else {
      // DAYS-based: recurring at lastCompletedDate + n * interval.
      let dueDate = addDays(task.lastCompletedDate, task.interval);

      if (horizonEnd === null) {
        // No flights — generate one occurrence only (anchors the block to the due date).
        events.push({ task, dueByDateTime: addDays(dueDate, 1), dueBeforeLegIndex: null });
      } else {
        while (dueDate.getTime() <= horizonEnd.getTime()) {
          // Find the first leg departing on or after this due date.
          let dueByDateTime: Date = addDays(dueDate, 1);
          let dueBeforeLegIndex: number | null = null;

          for (let i = 0; i < legs.length; i++) {
            if (toDateString(legs[i].departure) >= toDateString(dueDate)) {
              dueByDateTime = legs[i].departure;
              dueBeforeLegIndex = i;
              break;
            }
          }

          events.push({ task, dueByDateTime, dueBeforeLegIndex });
          dueDate = addDays(dueDate, task.interval);
        }
      }
    }
  }

  return events;
}

// -----------------------------------------------------------------------------
// Task grouping
// -----------------------------------------------------------------------------

/**
 * Groups DueEvents that should be performed in the same maintenance block.
 *
 * Grouping rules:
 * - Tasks of different maintType (Planned vs In-Depth) are NEVER grouped together.
 * - HOURS/LANDINGS: tasks of the same maintType triggered before the same leg index.
 * - DAYS-based: tasks of the same maintType whose dueByDateTime falls within ±1 day.
 */
export function groupDueEvents(events: DueEvent[]): DueEvent[][] {
  if (events.length === 0) return [];

  const sorted = [...events].sort(
    (a, b) => a.dueByDateTime.getTime() - b.dueByDateTime.getTime(),
  );

  const grouped: DueEvent[][] = [];
  const used = new Set<number>();

  for (let anchorIdx = 0; anchorIdx < sorted.length; anchorIdx++) {
    if (used.has(anchorIdx)) continue;

    const anchor = sorted[anchorIdx];
    const group: DueEvent[] = [anchor];
    used.add(anchorIdx);

    for (let candidateIdx = anchorIdx + 1; candidateIdx < sorted.length; candidateIdx++) {
      if (used.has(candidateIdx)) continue;

      const candidate = sorted[candidateIdx];
      let shouldGroup = false;

      // Never mix Planned Maintenance and In-Depth Maintenance in the same block.
      if (anchor.task.maintType !== candidate.task.maintType) {
        shouldGroup = false;
      } else if (
        (anchor.task.intervalType === 'Hours' || anchor.task.intervalType === 'Landings') &&
        (candidate.task.intervalType === 'Hours' || candidate.task.intervalType === 'Landings')
      ) {
        // Group if both triggered before the same leg
        if (
          anchor.dueBeforeLegIndex !== null &&
          candidate.dueBeforeLegIndex !== null &&
          anchor.dueBeforeLegIndex === candidate.dueBeforeLegIndex
        ) {
          shouldGroup = true;
        }
      } else if (
        anchor.task.intervalType === 'Days' &&
        candidate.task.intervalType === 'Days'
      ) {
        // Group if within ±1 day
        const diffDays =
          Math.abs(anchor.dueByDateTime.getTime() - candidate.dueByDateTime.getTime()) /
          MS_PER_DAY;
        if (diffDays <= 1) {
          shouldGroup = true;
        }
      }

      // Never put two occurrences of the same task in the same block —
      // each recurring occurrence must be its own maintenance stop.
      if (shouldGroup && group.some(e => e.task.taskId === candidate.task.taskId)) {
        shouldGroup = false;
      }

      if (shouldGroup) {
        group.push(candidate);
        used.add(candidateIdx);
      }
    }

    grouped.push(group);
  }

  return grouped;
}

// -----------------------------------------------------------------------------
// Block generation
// -----------------------------------------------------------------------------

function nextBlockId(tailNumber: string, counter: { n: number }): string {
  counter.n += 1;
  return `MAINT-${tailNumber}-${String(counter.n).padStart(4, '0')}`;
}

/**
 * Convert a group of due events into a MaintenanceBlock.
 * Tasks in the same group are performed concurrently, so the block duration
 * equals the LONGEST individual task (not the sum). The block starts just
 * before the earliest dueByDateTime in the group, aligned to the hour boundary.
 *
 * @param counter - Optional shared counter for sequential block IDs. When
 *   omitted a fresh counter is created, giving this block ID `…-0001`.
 */
export function buildMaintenanceBlock(
  tailNumber: string,
  group: DueEvent[],
  counter: { n: number } = { n: 0 },
): MaintenanceBlock {
  const earliest = group.reduce(
    (min, e) => e.dueByDateTime.getTime() < min.getTime() ? e.dueByDateTime : min,
    group[0].dueByDateTime,
  );

  // Truncate to hour boundary so the block starts on a clean hour
  const startDateTime = new Date(Date.UTC(
    earliest.getUTCFullYear(),
    earliest.getUTCMonth(),
    earliest.getUTCDate(),
    earliest.getUTCHours(),
    0,
  ));

  // Tasks run concurrently — block duration is the longest single task.
  const totalDuration = Math.max(...group.map(e => e.task.durationHours));
  const tentativeEnd = new Date(startDateTime.getTime() + totalDuration * MS_PER_HOUR);

  // If block would run past the earliest due-by time, start earlier
  let finalStart = startDateTime;
  if (tentativeEnd.getTime() > earliest.getTime()) {
    finalStart = new Date(earliest.getTime() - totalDuration * MS_PER_HOUR);
    // Align to hour
    finalStart = new Date(Date.UTC(
      finalStart.getUTCFullYear(),
      finalStart.getUTCMonth(),
      finalStart.getUTCDate(),
      finalStart.getUTCHours(),
      0,
    ));
  }

  const endDateTime = new Date(finalStart.getTime() + totalDuration * MS_PER_HOUR);
  const maintTypes = [...new Set(group.map(e => e.task.maintType))];

  return {
    tailNumber,
    blockId: nextBlockId(tailNumber, counter),
    startDateTime: finalStart,
    endDateTime,
    durationHours: totalDuration,
    includedTasks: group.map(e => e.task.taskId),
    maintTypes,
  };
}

/**
 * Ensure no two MaintenanceBlocks on the same tail overlap.
 * Overlapping or near-contiguous blocks (gap < 4h) are merged into a single
 * block whose duration is the sum of both, preventing scheduling gaps that
 * are too short for a flight to fit between maintenance events.
 * Input blocks must be sorted by startDateTime ascending.
 */
export function resolveMaintenanceOverlaps(blocks: MaintenanceBlock[]): MaintenanceBlock[] {
  if (blocks.length <= 1) return blocks;

  const resolved: MaintenanceBlock[] = [];
  let current: MaintenanceBlock = {
    ...blocks[0],
    includedTasks: [...blocks[0].includedTasks],
    maintTypes: [...blocks[0].maintTypes],
  };

  for (let i = 1; i < blocks.length; i++) {
    const next = blocks[i];
    if (next.startDateTime.getTime() <= current.endDateTime.getTime() + 4 * MS_PER_HOUR) {
      // Merge: tasks run concurrently, so the merged block ends when the LAST task
      // in either block finishes (not sum of durations). Keep current's start and block ID.
      const nextEnd = new Date(next.startDateTime.getTime() + next.durationHours * MS_PER_HOUR);
      const mergedEnd = new Date(Math.max(current.endDateTime.getTime(), nextEnd.getTime()));
      const mergedDuration = (mergedEnd.getTime() - current.startDateTime.getTime()) / MS_PER_HOUR;
      // Deduplicate task IDs — same task may appear in both blocks if recurring occurrences merged.
      const mergedTasks = [...new Set([...current.includedTasks, ...next.includedTasks])];
      current = {
        ...current,
        endDateTime: mergedEnd,
        durationHours: mergedDuration,
        includedTasks: mergedTasks,
        maintTypes: [...new Set([...current.maintTypes, ...next.maintTypes])],
      };
    } else {
      resolved.push(current);
      current = {
        ...next,
        includedTasks: [...next.includedTasks],
        maintTypes: [...next.maintTypes],
      };
    }
  }

  resolved.push(current);
  return resolved;
}

// -----------------------------------------------------------------------------
// Public entry point
// -----------------------------------------------------------------------------

/**
 * Compute all maintenance blocks for a single tail.
 * legs should be the ordered flight legs already assigned to this tail.
 * scheduleHorizonEnd is the full schedule window end — passed through to
 * computeDueEvents so Days-based recurring tasks are not cut short by the
 * tail's last assigned flight.
 */
export function computeMaintenanceBlocks(
  tailNumber: string,
  tasks: MaintTask[],
  tailStatus: TailStatus,
  legs: FlightLeg[],
  scheduleHorizonEnd: Date | null = null,
): MaintenanceBlock[] {
  if (tasks.length === 0) return [];

  const dueEvents = computeDueEvents(tasks, legs, tailStatus, scheduleHorizonEnd);
  if (dueEvents.length === 0) return [];

  const groups = groupDueEvents(dueEvents);
  const counter = { n: 0 };
  const blocks = groups.map(group => buildMaintenanceBlock(tailNumber, group, counter));

  blocks.sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());
  return resolveMaintenanceOverlaps(blocks);
}
