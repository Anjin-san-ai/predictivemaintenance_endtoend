import { describe, it, expect } from 'vitest';
import { diffSchedule } from '../scheduleDiff';
import type { GanttAircraft, GanttMaintenanceItem } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeAircraft(
  tailNumber: string,
  routes: { fn: number; from: string; to: string }[][],
  maintenance: Partial<GanttMaintenanceItem>[] = [],
): GanttAircraft {
  return {
    tailNumber,
    status: '',
    currentHours: 0,
    routes: routes.map(trip =>
      trip.map(leg => ({
        flightNumber: leg.fn,
        from: leg.from,
        to: leg.to,
        departureDate: '2026-03-10',
        departureTime: '08:00',
        arrivalDate: '2026-03-10',
        arrivalTime: '12:00',
      })),
    ),
    maintenance: maintenance.map((m, i) => ({
      id: `MAINT-${tailNumber}-${String(i + 1).padStart(4, '0')}`,
      type: 'Planned' as const,
      scheduleStartDate: '2026-04-01',
      scheduleEndDate: '2026-04-01',
      scheduleStartTime: '08:00',
      scheduleEndTime: '16:00',
      durationHours: 8,
      tasks: [],
      ...m,
    })),
  };
}

function makeMaintenanceItem(
  id: string,
  taskIds: string[],
  taskNames: string[],
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
): GanttMaintenanceItem {
  return {
    id,
    type: 'Planned',
    scheduleStartDate: startDate,
    scheduleStartTime: startTime,
    scheduleEndDate: endDate,
    scheduleEndTime: endTime,
    durationHours: 8,
    tasks: taskIds.map((taskId, i) => ({
      taskId,
      taskName: taskNames[i] ?? taskId,
      taskDetails: '',
      trade: '',
      durationHours: 4,
      crewCount: 1,
      assignedPerson: 'Test Person',
    })),
  };
}

// ─── addedFlight ─────────────────────────────────────────────────────────────

describe('diffSchedule — addedFlight', () => {
  it('identifies the new flight, its tail, route, and hours', () => {
    const before = [makeAircraft('ZZ100', [])];
    const after  = [makeAircraft('ZZ100', [[{ fn: 999, from: 'LHR', to: 'JFK' }]])];

    const result = diffSchedule(before, after, 999, 7.5);

    expect(result.addedFlight.flightNumber).toBe(999);
    expect(result.addedFlight.tailNumber).toBe('ZZ100');
    expect(result.addedFlight.route).toBe('LHR → JFK');
    expect(result.addedFlight.durationHours).toBe(7.5);
  });

  it('sets tailNumber null when the flight is unschedulable (not in any after routes)', () => {
    const before = [makeAircraft('ZZ100', [])];
    const after  = [makeAircraft('ZZ100', [])]; // flight 999 not scheduled

    const result = diffSchedule(before, after, 999, 5);

    expect(result.addedFlight.tailNumber).toBeNull();
  });
});

// ─── reassignedFlights ───────────────────────────────────────────────────────

describe('diffSchedule — reassignedFlights', () => {
  it('detects a flight that moved from one tail to another', () => {
    const before = [
      makeAircraft('ZZ100', [[{ fn: 1, from: 'LHR', to: 'JFK' }]]),
      makeAircraft('ZZ200', []),
    ];
    const after = [
      makeAircraft('ZZ100', []),
      makeAircraft('ZZ200', [[{ fn: 1, from: 'LHR', to: 'JFK' }]]),
    ];

    const result = diffSchedule(before, after, 999, 0);

    expect(result.reassignedFlights).toHaveLength(1);
    expect(result.reassignedFlights[0].flightNumber).toBe(1);
    expect(result.reassignedFlights[0].fromTail).toBe('ZZ100');
    expect(result.reassignedFlights[0].toTail).toBe('ZZ200');
  });

  it('does not report the newly-added flight as reassigned', () => {
    const before = [makeAircraft('ZZ100', [])];
    const after  = [makeAircraft('ZZ100', [[{ fn: 999, from: 'LHR', to: 'JFK' }]])];

    const result = diffSchedule(before, after, 999, 5);

    expect(result.reassignedFlights).toHaveLength(0);
  });

  it('does not report flights that stayed on the same tail', () => {
    const before = [makeAircraft('ZZ100', [[{ fn: 1, from: 'LHR', to: 'JFK' }]])];
    const after  = [makeAircraft('ZZ100', [[{ fn: 1, from: 'LHR', to: 'JFK' }]])];

    const result = diffSchedule(before, after, 999, 0);

    expect(result.reassignedFlights).toHaveLength(0);
  });
});

// ─── shiftedMaintenance ──────────────────────────────────────────────────────

describe('diffSchedule — shiftedMaintenance (fingerprint-based)', () => {
  it('detects a maintenance block pulled earlier by its task fingerprint', () => {
    const taskItem = (startDate: string, startTime: string) =>
      makeMaintenanceItem('MAINT-ZZ100-0001', ['T1'], ['Oil Check'], startDate, startTime, startDate, '16:00');

    const before = [makeAircraft('ZZ100', [], [taskItem('2026-04-10', '08:00')])];
    const after  = [makeAircraft('ZZ100', [], [taskItem('2026-04-07', '08:00')])];
    // Note: after block gets re-stamped ID but same task content

    const result = diffSchedule(before, after, 999, 8);

    expect(result.shiftedMaintenance).toHaveLength(1);
    expect(result.shiftedMaintenance[0].taskNames).toContain('Oil Check');
    expect(result.shiftedMaintenance[0].fromStart).toBe('2026-04-10 08:00');
    expect(result.shiftedMaintenance[0].toStart).toBe('2026-04-07 08:00');
    expect(result.shiftedMaintenance[0].daysDelta).toBe(-3);
  });

  it('does not report blocks whose time did not change', () => {
    const taskItem = (id: string) =>
      makeMaintenanceItem(id, ['T1'], ['Oil Check'], '2026-04-10', '08:00', '2026-04-10', '16:00');

    const before = [makeAircraft('ZZ100', [], [taskItem('MAINT-ZZ100-0001')])];
    const after  = [makeAircraft('ZZ100', [], [taskItem('MAINT-ZZ100-0001')])];

    const result = diffSchedule(before, after, 999, 0);

    expect(result.shiftedMaintenance).toHaveLength(0);
  });

  it('correctly handles two recurring blocks sharing the same fingerprint (F1 regression)', () => {
    // Two "Oil Check" windows on the same tail — identical task fingerprint.
    // Before: window 1 = Apr 10, window 2 = May 10.
    // After:  window 1 pulled to Apr 07 (shifted), window 2 stays May 10 (unchanged).
    // Without the fix the second "before" block overwrites the first in the map,
    // causing window 1's "after" counterpart to be classified as newMaintenance
    // instead of shiftedMaintenance.
    const block1Before = makeMaintenanceItem('MAINT-ZZ100-0001', ['T1'], ['Oil Check'], '2026-04-10', '08:00', '2026-04-10', '16:00');
    const block2Before = makeMaintenanceItem('MAINT-ZZ100-0002', ['T1'], ['Oil Check'], '2026-05-10', '08:00', '2026-05-10', '16:00');

    const block1After  = makeMaintenanceItem('MAINT-ZZ100-0001', ['T1'], ['Oil Check'], '2026-04-07', '08:00', '2026-04-07', '16:00');
    const block2After  = makeMaintenanceItem('MAINT-ZZ100-0002', ['T1'], ['Oil Check'], '2026-05-10', '08:00', '2026-05-10', '16:00');

    const before = [makeAircraft('ZZ100', [], [block1Before, block2Before])];
    const after  = [makeAircraft('ZZ100', [], [block1After,  block2After])];

    const result = diffSchedule(before, after, 999, 8);

    // Window 1 shifted, window 2 unchanged — no new blocks.
    expect(result.shiftedMaintenance).toHaveLength(1);
    expect(result.shiftedMaintenance[0].fromStart).toBe('2026-04-10 08:00');
    expect(result.shiftedMaintenance[0].toStart).toBe('2026-04-07 08:00');
    expect(result.newMaintenance).toHaveLength(0);
  });
});

// ─── newMaintenance ───────────────────────────────────────────────────────────

describe('diffSchedule — newMaintenance', () => {
  it('reports a block that was not present before (new task triggered by hours)', () => {
    const newBlock = makeMaintenanceItem(
      'MAINT-ZZ100-0003', ['T2'], ['Engine Inspection'], '2026-05-01', '08:00', '2026-05-02', '16:00',
    );

    const before = [makeAircraft('ZZ100', [], [])];
    const after  = [makeAircraft('ZZ100', [], [newBlock])];

    const result = diffSchedule(before, after, 999, 12);

    expect(result.newMaintenance).toHaveLength(1);
    expect(result.newMaintenance[0].tailNumber).toBe('ZZ100');
    expect(result.newMaintenance[0].taskNames).toContain('Engine Inspection');
    expect(result.newMaintenance[0].scheduledStart).toBe('2026-05-01 08:00');
  });

  it('does not report blocks that existed before with the same tasks', () => {
    const block = makeMaintenanceItem(
      'MAINT-ZZ100-0001', ['T1'], ['Oil Check'], '2026-04-01', '08:00', '2026-04-01', '16:00',
    );

    const before = [makeAircraft('ZZ100', [], [block])];
    const after  = [makeAircraft('ZZ100', [], [block])];

    const result = diffSchedule(before, after, 999, 0);

    expect(result.newMaintenance).toHaveLength(0);
  });
});
