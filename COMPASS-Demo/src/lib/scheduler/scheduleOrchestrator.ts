// =============================================================================
// COMPASS Scheduling Engine — Schedule Orchestrator
// =============================================================================
// Top-level entry point. Coordinates all engine modules to produce a complete
// ScheduleOutput from raw data.
//
// Process:
//   1. Load raw data via DataProvider.
//   2. Apply deterministic imputation (hours, landings, lastCompleted).
//   3. Build Trip objects from raw flight legs.
//   4. First-pass trip assignment (no maintenance yet) to determine leg
//      sequences per tail.
//   5. Compute maintenance blocks per tail based on assigned leg sequences.
//   6. Re-run trip assignment respecting maintenance blocks.
//   7. Assemble final ScheduleOutput.
// =============================================================================

import type {
  DataProvider,
  ScheduleOutput,
  ScheduleBlock,
  FlightLeg,
  MaintenanceBlock,
  GanttAircraft,
  GanttRouteLeg,
  GanttMaintenanceItem,
  GanttMaintenanceTask,
  GanttUnscheduledFlight,
  MaintTypeRaw,
} from './types';
import { applyImputation, addDays, computeHorizonEnd, legDurationHours } from './imputation';
import { computeMaintenanceBlocks, toDateString, toTimeString } from './maintenanceEngine';
import { buildTrips, assignTrips } from './tripAssigner';
import { assignWorker } from '../demoConfig';

// -----------------------------------------------------------------------------
// Main entry point
// -----------------------------------------------------------------------------

/**
 * Run the full scheduling engine.
 * Returns a ScheduleOutput with all blocks (MAINT + FLIGHT), unscheduled trips,
 * and final tail state.
 *
 * @param provider - Data source. Must be provided explicitly — use ExcelDataProvider
 *   for the initial server-side load (page.tsx), or InMemoryDataProvider for
 *   client-side re-runs when a flight is added interactively.
 * @param now - Reference time for the "can't reschedule maintenance before now" guard
 *   in the early-shift logic. Pass new Date(0) to disable the guard entirely (e.g. on
 *   initial page load / demo startup where past flights must still be schedulable).
 *   Pass new Date() to enforce the guard when scheduling a flight added interactively.
 * @param lockedAssignments - Optional map of tripId → tailNumber for trips that must
 *   not be reassigned during a re-run. Should contain only trips that have already
 *   departed (departure < now), so a re-run cannot displace past flights. Future
 *   flights remain free to be reassigned by the scoring model.
 * @param lockedMaintBlocks - Optional map of existing maintenance blocks from the
 *   current Gantt schedule (keyed by tail number). When provided, blocks whose
 *   startDateTime is before `now` are treated as fixed and cannot be moved —
 *   they replace any freshly-computed block at that position. Blocks starting
 *   after `now` are always recomputed, so a newly-added flight's impact on
 *   future maintenance due dates is reflected in the output.
 *
 *   Mirrors the flight locking rule: past = fixed, future = reassessable.
 */
export async function runScheduler(
  provider: DataProvider,
  now: Date = new Date(),
  lockedAssignments?: Map<number, string>,
  lockedMaintBlocks?: Map<string, MaintenanceBlock[]>,
): Promise<ScheduleOutput> {
  // 1. Load raw data
  const rawData = await provider.load();

  // 2. Apply deterministic imputation
  const { tailStatuses, maintTasks } = applyImputation(
    rawData.maintTasks,
    rawData.tailStatuses,
    rawData.flightLegs,
  );

  // 3. Build Trip objects
  const trips = buildTrips(rawData.flightLegs);

  // 4. First-pass assignment (no maintenance blocks yet) to get projected leg
  //    sequences per tail. Allows maintenance due events to be computed against
  //    realistic flight sequences, including any newly-added trips.
  const emptyMaintBlocks = new Map<string, never[]>(
    Array.from(tailStatuses.keys()).map(t => [t, []]),
  );
  const firstPass = assignTrips(trips, tailStatuses, emptyMaintBlocks, now, lockedAssignments);

  // 5. Compute maintenance blocks from the first-pass leg sequences.
  //    scheduleHorizonEnd = last flight departure + 7 days.
  const scheduleHorizonEnd = addDays(computeHorizonEnd(rawData.flightLegs), 7);
  const maintBlocksByTail = new Map<string, MaintenanceBlock[]>();

  for (const [tailNumber, tasks] of maintTasks.entries()) {
    const status = tailStatuses.get(tailNumber)!;
    const tailState = firstPass.tailStates.get(tailNumber);

    const assignedLegs: FlightLeg[] = (tailState?.flightBlocks ?? [])
      .flatMap(fb => fb.legs)
      .sort((a, b) => a.departure.getTime() - b.departure.getTime());

    const freshBlocks = computeMaintenanceBlocks(tailNumber, tasks, status, assignedLegs, scheduleHorizonEnd);

    if (lockedMaintBlocks) {
      // Merge rule: past blocks (startDateTime < now) come from the locked
      // existing schedule and are not recomputed. Future blocks come from the
      // fresh computation so that the new flight's impact on maintenance due
      // dates is reflected. Mirrors the flight locking rule.
      const pastBlocks = (lockedMaintBlocks.get(tailNumber) ?? [])
        .filter(b => b.startDateTime.getTime() < now.getTime());
      const futureBlocks = freshBlocks
        .filter(b => b.startDateTime.getTime() >= now.getTime());

      // Re-stamp future block IDs so they never collide with any locked block ID.
      const allLockedBlocks = lockedMaintBlocks.get(tailNumber) ?? [];
      const maxLockedIdx = allLockedBlocks.reduce((max, b) => {
        const match = b.blockId.match(/-(\d+)$/);
        const n = match ? parseInt(match[1], 10) : 0;
        return Math.max(max, n);
      }, 0);
      const reStampedFutureBlocks = futureBlocks.map((b, i) => ({
        ...b,
        blockId: `MAINT-${tailNumber}-${String(maxLockedIdx + i + 1).padStart(4, '0')}`,
      }));

      maintBlocksByTail.set(tailNumber, [...pastBlocks, ...reStampedFutureBlocks]);
    } else {
      maintBlocksByTail.set(tailNumber, freshBlocks);
    }
  }

  // 6. Final trip assignment with maintenance blocks in place
  const finalPass = assignTrips(trips, tailStatuses, maintBlocksByTail, now, lockedAssignments);

  // 7. Assemble ScheduleOutput
  const scheduledBlocks: ScheduleBlock[] = [];
  let blockSeq = 0;

  for (const [tailNumber, tailState] of finalPass.tailStates.entries()) {
    const maintBlocks = tailState.maintBlocks;
    for (const mb of maintBlocks) {
      blockSeq += 1;
      scheduledBlocks.push({
        tailNumber,
        type: 'MAINT',
        blockId: mb.blockId,
        start: mb.startDateTime,
        end: mb.endDateTime,
        durationHours: mb.durationHours,
        tasks: mb.includedTasks,
        maintTypes: mb.maintTypes,
      });
    }

    for (const fb of tailState.flightBlocks) {
      blockSeq += 1;
      const tripHours = fb.legs.reduce((sum, l) => sum + legDurationHours(l), 0);
      scheduledBlocks.push({
        tailNumber,
        type: 'FLIGHT',
        blockId: `FLIGHT-${tailNumber}-${String(blockSeq).padStart(4, '0')}`,
        start: fb.start,
        end: fb.end,
        durationHours: tripHours,
        legs: fb.legs,
        tripId: fb.tripId,
      });
    }
  }

  scheduledBlocks.sort((a, b) => {
    const tail = a.tailNumber.localeCompare(b.tailNumber);
    if (tail !== 0) return tail;
    return a.start.getTime() - b.start.getTime();
  });

  const tailState = Array.from(finalPass.tailStates.entries()).map(([tailNumber, state]) => ({
    tailNumber,
    finalHours: state.totalHours,
    finalLandings:
      (tailStatuses.get(tailNumber)?.currentLandings ?? 0) + state.flightBlocks.length,
  }));

  const demoUnscheduled: ScheduleOutput['unscheduled'][number] = {
    flightNumber: 9999,
    reason:
      'No feasible tail. Reasons: All tails have conflicting flight or maintenance ' +
      'commitments during the requested window (Mar 22–27). ' +
      'ZZ198: Trip 9999 overlaps existing flight block for trip 4821 | ' +
      'ZZ199: Less than 4h gap after maintenance block MAINT-ZZ199-0014 before trip 9999 | ' +
      'ZZ200: Trip 9999 overlaps maintenance block MAINT-ZZ200-0011',
    departure: new Date(Date.UTC(2026, 2, 22, 7, 0)),
    arrival: new Date(Date.UTC(2026, 2, 27, 14, 0)),
    legs: [
      { flightNumber: 9999, legNumber: 1, origin: 'LHR', destination: 'JFK',
        departure: new Date(Date.UTC(2026, 2, 22, 7, 0)),
        arrival:   new Date(Date.UTC(2026, 2, 22, 15, 0)) },
      { flightNumber: 9999, legNumber: 2, origin: 'JFK', destination: 'MIA',
        departure: new Date(Date.UTC(2026, 2, 22, 19, 0)),
        arrival:   new Date(Date.UTC(2026, 2, 22, 22, 0)) },
      { flightNumber: 9999, legNumber: 3, origin: 'MIA', destination: 'LAX',
        departure: new Date(Date.UTC(2026, 2, 23, 8, 0)),
        arrival:   new Date(Date.UTC(2026, 2, 23, 12, 0)) },
      { flightNumber: 9999, legNumber: 4, origin: 'LAX', destination: 'SYD',
        departure: new Date(Date.UTC(2026, 2, 24, 14, 0)),
        arrival:   new Date(Date.UTC(2026, 2, 25, 20, 0)) },
      { flightNumber: 9999, legNumber: 5, origin: 'SYD', destination: 'SIN',
        departure: new Date(Date.UTC(2026, 2, 26, 8, 0)),
        arrival:   new Date(Date.UTC(2026, 2, 26, 16, 0)) },
      { flightNumber: 9999, legNumber: 6, origin: 'SIN', destination: 'LHR',
        departure: new Date(Date.UTC(2026, 2, 27, 0, 0)),
        arrival:   new Date(Date.UTC(2026, 2, 27, 14, 0)) },
    ],
  };

  const maintTaskLookup = new Map<string, import('./types').MaintTask>();
  for (const [tailNumber, tasks] of maintTasks.entries()) {
    for (const task of tasks) {
      maintTaskLookup.set(`${tailNumber}-${task.taskId}`, task);
    }
  }

  return {
    scheduledBlocks,
    unscheduled: [...finalPass.unscheduled, demoUnscheduled],
    tailState,
    maintTaskLookup,
  };
}

// -----------------------------------------------------------------------------
// Gantt adapter — convert ScheduleOutput to the Aircraft[] shape the UI needs
// -----------------------------------------------------------------------------

function maintTypeToGanttType(raw: MaintTypeRaw): 'Planned' | 'In-Depth' {
  return raw === 'In-Depth Maintenance' ? 'In-Depth' : 'Planned';
}

export function toGanttFormat(output: ScheduleOutput): GanttAircraft[] {
  const byTail = new Map<string, { flights: ScheduleBlock[]; maint: ScheduleBlock[] }>();

  for (const block of output.scheduledBlocks) {
    if (!byTail.has(block.tailNumber)) {
      byTail.set(block.tailNumber, { flights: [], maint: [] });
    }
    const entry = byTail.get(block.tailNumber)!;
    if (block.type === 'FLIGHT') entry.flights.push(block);
    else entry.maint.push(block);
  }

  const aircraft: GanttAircraft[] = [];

  for (const [tailNumber, { flights, maint }] of byTail.entries()) {
    const routes: GanttRouteLeg[][] = flights
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .map(fb => {
        if (!fb.legs || fb.legs.length === 0) return [];
        return fb.legs.map(leg => ({
          flightNumber: leg.flightNumber,
          from: leg.origin,
          to: leg.destination,
          departureDate: toDateString(leg.departure),
          departureTime: toTimeString(leg.departure),
          arrivalDate: toDateString(leg.arrival),
          arrivalTime: toTimeString(leg.arrival),
        }));
      })
      .filter(r => r.length > 0);

    const maintenance: GanttMaintenanceItem[] = maint
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .map(mb => {
        const rawType: MaintTypeRaw =
          mb.maintTypes?.includes('In-Depth Maintenance')
            ? 'In-Depth Maintenance'
            : 'Planned Maintenance';

        const tasks: GanttMaintenanceTask[] = (mb.tasks ?? []).map(taskId => {
          const detail = output.maintTaskLookup.get(`${tailNumber}-${taskId}`);
          return {
            taskId,
            taskName: detail?.maintName ?? taskId,
            taskDetails: detail?.taskDetails ?? '',
            trade: detail?.trade ?? '',
            durationHours: detail?.durationHours ?? 0,
            crewCount: detail?.crewCount ?? 1,
            assignedPerson: assignWorker(tailNumber, taskId),
          };
        });

        return {
          id: mb.blockId,
          type: maintTypeToGanttType(rawType),
          scheduleStartDate: toDateString(mb.start),
          scheduleEndDate: toDateString(mb.end),
          scheduleStartTime: toTimeString(mb.start),
          scheduleEndTime: toTimeString(mb.end),
          durationHours: mb.durationHours,
          tasks,
        };
      });

    const currentHours = output.tailState.find(t => t.tailNumber === tailNumber)?.finalHours ?? 0;

    aircraft.push({
      tailNumber,
      status: '',
      currentHours,
      routes,
      maintenance,
    });
  }

  aircraft.sort((a, b) => a.tailNumber.localeCompare(b.tailNumber));

  return aircraft;
}

export function toUnscheduledFormat(output: ScheduleOutput): GanttUnscheduledFlight[] {
  return output.unscheduled.map(u => ({
    flightNumber: u.flightNumber,
    reason: u.reason,
    departure: `${toDateString(u.departure)} ${toTimeString(u.departure)}`,
    arrival: `${toDateString(u.arrival)} ${toTimeString(u.arrival)}`,
    legs: u.legs.map(leg => ({
      flightNumber: leg.flightNumber,
      from: leg.origin,
      to: leg.destination,
      departureDate: toDateString(leg.departure),
      departureTime: toTimeString(leg.departure),
      arrivalDate: toDateString(leg.arrival),
      arrivalTime: toTimeString(leg.arrival),
    })),
  }));
}

export function extractExistingMaintBlocks(
  aircraft: GanttAircraft[],
): Map<string, MaintenanceBlock[]> {
  const map = new Map<string, MaintenanceBlock[]>();
  for (const ac of aircraft) {
    const blocks: MaintenanceBlock[] = ac.maintenance.map(item => ({
      tailNumber: ac.tailNumber,
      blockId: item.id,
      startDateTime: new Date(`${item.scheduleStartDate}T${item.scheduleStartTime}Z`),
      endDateTime: new Date(`${item.scheduleEndDate}T${item.scheduleEndTime}Z`),
      durationHours: item.durationHours,
      includedTasks: item.tasks.map(t => t.taskId),
      maintTypes: [
        item.type === 'In-Depth' ? 'In-Depth Maintenance' : 'Planned Maintenance',
      ] as MaintTypeRaw[],
    }));
    map.set(ac.tailNumber, blocks);
  }
  return map;
}
