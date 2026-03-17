import { describe, it, expect } from 'vitest';
import {
  computeDueEvents,
  groupDueEvents,
  buildMaintenanceBlock,
  resolveMaintenanceOverlaps,
} from '../maintenanceEngine';
import type { MaintTask, TailStatus, FlightLeg, MaintenanceBlock } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function utc(year: number, month: number, day: number, hour = 0, min = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, min));
}

function makeLeg(
  flightNumber: number,
  legNumber: number,
  departure: Date,
  arrival: Date,
): FlightLeg {
  return { flightNumber, legNumber, origin: 'AAA', destination: 'BBB', departure, arrival };
}

function makeTask(
  overrides: Partial<MaintTask> & Pick<MaintTask, 'taskId' | 'intervalType' | 'interval'>,
): MaintTask {
  return {
    tailNumber: 'ZZ001',
    maintType: 'Planned Maintenance',
    maintName: 'Test Task',
    durationHours: 4,
    crewCount: 2,
    lastCompletedDate: utc(2026, 1, 1),
    impliedLastCompletedHours: 0,
    impliedLastCompletedLandings: 0,
    taskDetails: '',
    trade: '',
    ...overrides,
  };
}

function makeTailStatus(
  currentHours = 0,
  currentLandings = 0,
): TailStatus {
  return { tailNumber: 'ZZ001', currentHours, currentLandings };
}

function makeMaintenanceBlock(
  start: Date,
  durationHours: number,
  blockId = 'MAINT-ZZ001-0001',
): MaintenanceBlock {
  return {
    tailNumber: 'ZZ001',
    blockId,
    startDateTime: start,
    endDateTime: new Date(start.getTime() + durationHours * 3_600_000),
    durationHours,
    includedTasks: ['T1'],
    maintTypes: ['Planned Maintenance'],
  };
}

// ─── computeDueEvents — HOURS ────────────────────────────────────────────────

describe('computeDueEvents — Hours interval', () => {
  it('fires before the leg where cumulative hours crosses the threshold', () => {
    const task = makeTask({ taskId: 'T1', intervalType: 'Hours', interval: 5 });
    const legs = [
      makeLeg(1, 1, utc(2026, 3, 1, 8), utc(2026, 3, 1, 11)),  // 3h
      makeLeg(1, 2, utc(2026, 3, 2, 8), utc(2026, 3, 2, 13)),  // 5h — total 8h, crosses 5h threshold
    ];
    const events = computeDueEvents([task], legs, makeTailStatus(0, 0));
    expect(events).toHaveLength(1);
    expect(events[0].dueBeforeLegIndex).toBe(1);
  });

  it('fires multiple times when multiple thresholds are crossed', () => {
    const task = makeTask({ taskId: 'T1', intervalType: 'Hours', interval: 3 });
    const legs = [
      makeLeg(1, 1, utc(2026, 3, 1, 8), utc(2026, 3, 1, 11)),  // 3h — crosses 3h
      makeLeg(1, 2, utc(2026, 3, 2, 8), utc(2026, 3, 2, 11)),  // 3h — crosses 6h
    ];
    const events = computeDueEvents([task], legs, makeTailStatus(0, 0));
    expect(events).toHaveLength(2);
    expect(events[0].dueBeforeLegIndex).toBe(0);
    expect(events[1].dueBeforeLegIndex).toBe(1);
  });

  it('fires before leg 0 when already overdue at start', () => {
    const task = makeTask({
      taskId: 'T1',
      intervalType: 'Hours',
      interval: 5,
      impliedLastCompletedHours: 0,
    });
    const legs = [makeLeg(1, 1, utc(2026, 3, 1, 8), utc(2026, 3, 1, 11))];
    // 7 hours already elapsed (currentHours - impliedLastCompletedHours = 7)
    const events = computeDueEvents([task], legs, makeTailStatus(7, 0));
    expect(events.some(e => e.dueBeforeLegIndex === 0)).toBe(true);
  });

  it('produces no events when no legs are present and task is not overdue', () => {
    const task = makeTask({ taskId: 'T1', intervalType: 'Hours', interval: 100 });
    const events = computeDueEvents([task], [], makeTailStatus(0, 0));
    expect(events).toHaveLength(0);
  });

  it('fires exactly at the boundary — cumulative hours equal to interval', () => {
    const task = makeTask({ taskId: 'T1', intervalType: 'Hours', interval: 4 });
    const legs = [makeLeg(1, 1, utc(2026, 3, 1, 8), utc(2026, 3, 1, 12))]; // exactly 4h
    const events = computeDueEvents([task], legs, makeTailStatus(0, 0));
    expect(events).toHaveLength(1);
    expect(events[0].dueBeforeLegIndex).toBe(0);
  });
});

// ─── computeDueEvents — LANDINGS ─────────────────────────────────────────────

describe('computeDueEvents — Landings interval', () => {
  it('fires before the leg that causes the nth landing', () => {
    const task = makeTask({ taskId: 'T1', intervalType: 'Landings', interval: 2 });
    const legs = [
      makeLeg(1, 1, utc(2026, 3, 1, 8), utc(2026, 3, 1, 10)),
      makeLeg(1, 2, utc(2026, 3, 2, 8), utc(2026, 3, 2, 10)),
    ];
    const events = computeDueEvents([task], legs, makeTailStatus(0, 0));
    expect(events).toHaveLength(1);
    expect(events[0].dueBeforeLegIndex).toBe(1);
  });

  it('fires before leg 0 when already overdue on landings', () => {
    const task = makeTask({
      taskId: 'T1',
      intervalType: 'Landings',
      interval: 3,
      impliedLastCompletedLandings: 0,
    });
    const legs = [makeLeg(1, 1, utc(2026, 3, 1, 8), utc(2026, 3, 1, 10))];
    const events = computeDueEvents([task], legs, makeTailStatus(0, 5)); // 5 landings already
    expect(events.some(e => e.dueBeforeLegIndex === 0)).toBe(true);
  });

  it('produces no events when landings are well below threshold', () => {
    const task = makeTask({ taskId: 'T1', intervalType: 'Landings', interval: 50 });
    const legs = [makeLeg(1, 1, utc(2026, 3, 1, 8), utc(2026, 3, 1, 10))];
    const events = computeDueEvents([task], legs, makeTailStatus(0, 0));
    expect(events).toHaveLength(0);
  });
});

// ─── computeDueEvents — DAYS ─────────────────────────────────────────────────

describe('computeDueEvents — Days interval', () => {
  it('fires before the first leg on or after the due date', () => {
    // lastCompletedDate = 2026-02-01, interval = 30 days → due 2026-03-03
    const task = makeTask({
      taskId: 'T1',
      intervalType: 'Days',
      interval: 30,
      lastCompletedDate: utc(2026, 2, 1),
    });
    const legs = [
      makeLeg(1, 1, utc(2026, 3, 1, 8), utc(2026, 3, 1, 10)), // before due date
      makeLeg(1, 2, utc(2026, 3, 4, 8), utc(2026, 3, 4, 10)), // on/after due date
    ];
    const horizon = utc(2026, 4, 1);
    const events = computeDueEvents([task], legs, makeTailStatus(0, 0), horizon);
    expect(events.length).toBeGreaterThanOrEqual(1);
    // First occurrence should reference the leg on/after due date
    const firstEvent = events[0];
    expect(firstEvent.dueBeforeLegIndex).toBe(1);
  });

  it('recurs multiple times within the horizon', () => {
    // interval = 10 days, lastCompleted = Mar 1, horizon = Apr 30 → ~6 occurrences
    const task = makeTask({
      taskId: 'T1',
      intervalType: 'Days',
      interval: 10,
      lastCompletedDate: utc(2026, 3, 1),
    });
    const legs = [
      makeLeg(1, 1, utc(2026, 3, 15, 8), utc(2026, 3, 15, 10)),
    ];
    const horizon = utc(2026, 4, 30);
    const events = computeDueEvents([task], legs, makeTailStatus(0, 0), horizon);
    // Should generate multiple occurrences through the horizon
    expect(events.length).toBeGreaterThan(1);
  });

  it('generates exactly one event when no legs and no horizon', () => {
    const task = makeTask({
      taskId: 'T1',
      intervalType: 'Days',
      interval: 30,
      lastCompletedDate: utc(2026, 1, 1),
    });
    const events = computeDueEvents([task], [], makeTailStatus(0, 0), null);
    expect(events).toHaveLength(1);
    expect(events[0].dueBeforeLegIndex).toBeNull();
  });

  it('stops recurring once the next due date exceeds the horizon', () => {
    const task = makeTask({
      taskId: 'T1',
      intervalType: 'Days',
      interval: 30,
      lastCompletedDate: utc(2026, 1, 1),
    });
    const legs = [makeLeg(1, 1, utc(2026, 2, 5, 8), utc(2026, 2, 5, 10))];
    const horizon = utc(2026, 2, 15); // only one occurrence fits (Feb 1 + 30 = Mar 3, past horizon)
    const events = computeDueEvents([task], legs, makeTailStatus(0, 0), horizon);
    expect(events).toHaveLength(1);
  });
});

// ─── groupDueEvents ──────────────────────────────────────────────────────────

describe('groupDueEvents', () => {
  it('returns empty array for empty input', () => {
    expect(groupDueEvents([])).toHaveLength(0);
  });

  it('groups Hours tasks triggered before the same leg', () => {
    const taskA = makeTask({ taskId: 'A', intervalType: 'Hours', interval: 5 });
    const taskB = makeTask({ taskId: 'B', intervalType: 'Hours', interval: 5 });
    const due = utc(2026, 3, 10, 8);
    const events = [
      { task: taskA, dueByDateTime: due, dueBeforeLegIndex: 2 },
      { task: taskB, dueByDateTime: due, dueBeforeLegIndex: 2 },
    ];
    const groups = groupDueEvents(events);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(2);
  });

  it('does NOT group Hours tasks triggered before different legs', () => {
    const taskA = makeTask({ taskId: 'A', intervalType: 'Hours', interval: 5 });
    const taskB = makeTask({ taskId: 'B', intervalType: 'Hours', interval: 5 });
    const due = utc(2026, 3, 10, 8);
    const events = [
      { task: taskA, dueByDateTime: due, dueBeforeLegIndex: 1 },
      { task: taskB, dueByDateTime: due, dueBeforeLegIndex: 2 },
    ];
    const groups = groupDueEvents(events);
    expect(groups).toHaveLength(2);
  });

  it('groups Days tasks whose due dates are within 1 day of each other', () => {
    const taskA = makeTask({ taskId: 'A', intervalType: 'Days', interval: 30 });
    const taskB = makeTask({ taskId: 'B', intervalType: 'Days', interval: 30 });
    const events = [
      { task: taskA, dueByDateTime: utc(2026, 3, 10), dueBeforeLegIndex: null },
      { task: taskB, dueByDateTime: utc(2026, 3, 11), dueBeforeLegIndex: null },
    ];
    const groups = groupDueEvents(events);
    expect(groups).toHaveLength(1);
  });

  it('does NOT group Days tasks more than 1 day apart', () => {
    const taskA = makeTask({ taskId: 'A', intervalType: 'Days', interval: 30 });
    const taskB = makeTask({ taskId: 'B', intervalType: 'Days', interval: 30 });
    const events = [
      { task: taskA, dueByDateTime: utc(2026, 3, 10), dueBeforeLegIndex: null },
      { task: taskB, dueByDateTime: utc(2026, 3, 12), dueBeforeLegIndex: null },
    ];
    const groups = groupDueEvents(events);
    expect(groups).toHaveLength(2);
  });

  it('does NOT group Planned and In-Depth tasks together', () => {
    const planned = makeTask({ taskId: 'A', intervalType: 'Days', interval: 30, maintType: 'Planned Maintenance' });
    const inDepth = makeTask({ taskId: 'B', intervalType: 'Days', interval: 30, maintType: 'In-Depth Maintenance' });
    const due = utc(2026, 3, 10);
    const events = [
      { task: planned, dueByDateTime: due, dueBeforeLegIndex: null },
      { task: inDepth, dueByDateTime: due, dueBeforeLegIndex: null },
    ];
    const groups = groupDueEvents(events);
    expect(groups).toHaveLength(2);
  });

  it('does NOT put two occurrences of the same task in the same group', () => {
    const task = makeTask({ taskId: 'A', intervalType: 'Hours', interval: 5 });
    const due = utc(2026, 3, 10, 8);
    // Two occurrences of the same task, same leg index
    const events = [
      { task, dueByDateTime: due, dueBeforeLegIndex: 2 },
      { task, dueByDateTime: due, dueBeforeLegIndex: 2 },
    ];
    const groups = groupDueEvents(events);
    expect(groups).toHaveLength(2);
  });
});

// ─── resolveMaintenanceOverlaps ──────────────────────────────────────────────

describe('resolveMaintenanceOverlaps', () => {
  it('returns a single block unchanged', () => {
    const block = makeMaintenanceBlock(utc(2026, 3, 10, 8), 4);
    const result = resolveMaintenanceOverlaps([block]);
    expect(result).toHaveLength(1);
    expect(result[0].blockId).toBe(block.blockId);
  });

  it('merges two overlapping blocks', () => {
    const a = makeMaintenanceBlock(utc(2026, 3, 10, 8), 6, 'MAINT-ZZ001-0001');
    const b = makeMaintenanceBlock(utc(2026, 3, 10, 12), 4, 'MAINT-ZZ001-0002'); // starts before a ends
    const result = resolveMaintenanceOverlaps([a, b]);
    expect(result).toHaveLength(1);
    // Merged block should span from a.start to max(a.end, b.end)
    expect(result[0].startDateTime).toEqual(a.startDateTime);
    expect(result[0].endDateTime).toEqual(b.endDateTime);
  });

  it('merges blocks with a gap of exactly 4 hours (boundary — should merge)', () => {
    const a = makeMaintenanceBlock(utc(2026, 3, 10, 8), 4, 'MAINT-ZZ001-0001'); // ends 12:00
    const b = makeMaintenanceBlock(utc(2026, 3, 10, 16), 2, 'MAINT-ZZ001-0002'); // starts 16:00 — 4h gap
    const result = resolveMaintenanceOverlaps([a, b]);
    expect(result).toHaveLength(1);
  });

  it('does NOT merge blocks with a gap greater than 4 hours', () => {
    const a = makeMaintenanceBlock(utc(2026, 3, 10, 8), 4, 'MAINT-ZZ001-0001'); // ends 12:00
    const b = makeMaintenanceBlock(utc(2026, 3, 10, 17), 2, 'MAINT-ZZ001-0002'); // starts 17:00 — 5h gap
    const result = resolveMaintenanceOverlaps([a, b]);
    expect(result).toHaveLength(2);
  });

  it('merges a chain of three consecutive blocks into one', () => {
    const a = makeMaintenanceBlock(utc(2026, 3, 10, 8), 4, 'MAINT-ZZ001-0001'); // ends 12:00
    const b = makeMaintenanceBlock(utc(2026, 3, 10, 14), 2, 'MAINT-ZZ001-0002'); // 2h gap — merges
    const c = makeMaintenanceBlock(utc(2026, 3, 10, 18), 3, 'MAINT-ZZ001-0003'); // 2h gap — merges
    const result = resolveMaintenanceOverlaps([a, b, c]);
    expect(result).toHaveLength(1);
  });

  it('preserves separate blocks that are far apart', () => {
    const a = makeMaintenanceBlock(utc(2026, 3, 10, 8), 4, 'MAINT-ZZ001-0001'); // ends 12:00
    const b = makeMaintenanceBlock(utc(2026, 3, 15, 8), 4, 'MAINT-ZZ001-0002'); // 5 days later
    const result = resolveMaintenanceOverlaps([a, b]);
    expect(result).toHaveLength(2);
  });

  it('keeps the first block ID when merging', () => {
    const a = makeMaintenanceBlock(utc(2026, 3, 10, 8), 4, 'MAINT-ZZ001-FIRST');
    const b = makeMaintenanceBlock(utc(2026, 3, 10, 10), 4, 'MAINT-ZZ001-SECOND');
    const result = resolveMaintenanceOverlaps([a, b]);
    expect(result[0].blockId).toBe('MAINT-ZZ001-FIRST');
  });

  it('deduplicates task IDs when merging blocks with shared tasks', () => {
    const a = { ...makeMaintenanceBlock(utc(2026, 3, 10, 8), 4, 'MAINT-ZZ001-0001'), includedTasks: ['T1', 'T2'] };
    const b = { ...makeMaintenanceBlock(utc(2026, 3, 10, 10), 4, 'MAINT-ZZ001-0002'), includedTasks: ['T2', 'T3'] };
    const result = resolveMaintenanceOverlaps([a, b]);
    expect(result[0].includedTasks).toEqual(expect.arrayContaining(['T1', 'T2', 'T3']));
    expect(result[0].includedTasks).toHaveLength(3);
  });
});

// ─── buildMaintenanceBlock ───────────────────────────────────────────────────

describe('buildMaintenanceBlock', () => {
  it('sets duration to the longest task in the group', () => {
    const short = makeTask({ taskId: 'A', intervalType: 'Hours', interval: 5, durationHours: 3 });
    const long = makeTask({ taskId: 'B', intervalType: 'Hours', interval: 5, durationHours: 8 });
    const due = utc(2026, 3, 10, 14);
    const group = [
      { task: short, dueByDateTime: due, dueBeforeLegIndex: 1 },
      { task: long, dueByDateTime: due, dueBeforeLegIndex: 1 },
    ];
    const block = buildMaintenanceBlock('ZZ001', group);
    expect(block.durationHours).toBe(8);
  });

  it('start time is aligned to the hour boundary', () => {
    const task = makeTask({ taskId: 'A', intervalType: 'Hours', interval: 5, durationHours: 2 });
    const due = utc(2026, 3, 10, 14, 30); // 14:30
    const group = [{ task, dueByDateTime: due, dueBeforeLegIndex: 1 }];
    const block = buildMaintenanceBlock('ZZ001', group);
    expect(block.startDateTime.getUTCMinutes()).toBe(0);
  });

  it('generates sequential block IDs when sharing a counter', () => {
    const task = makeTask({ taskId: 'A', intervalType: 'Hours', interval: 5, durationHours: 2 });
    const due = utc(2026, 3, 10, 14);
    const group = [{ task, dueByDateTime: due, dueBeforeLegIndex: 1 }];
    const counter = { n: 0 };
    const block1 = buildMaintenanceBlock('ZZ001', group, counter);
    const block2 = buildMaintenanceBlock('ZZ001', group, counter);
    expect(block1.blockId).toBe('MAINT-ZZ001-0001');
    expect(block2.blockId).toBe('MAINT-ZZ001-0002');
  });

  it('re-stamping future blocks after a past/future merge produces no duplicate IDs', () => {
    // Simulates the scheduleOrchestrator merge: 2 past blocks (IDs 0001, 0002)
    // + 3 fresh future blocks that also start numbering from 0001.
    // After re-stamping, all 5 IDs must be unique.
    const task = makeTask({ taskId: 'A', intervalType: 'Hours', interval: 5, durationHours: 2 });
    const due = utc(2026, 3, 10, 14);
    const group = [{ task, dueByDateTime: due, dueBeforeLegIndex: 1 }];

    // Simulate past blocks (kept as-is from the existing schedule)
    const pastCounter = { n: 0 };
    const pastBlocks = [
      buildMaintenanceBlock('ZZ001', group, pastCounter),
      buildMaintenanceBlock('ZZ001', group, pastCounter),
    ];

    // Simulate fresh future blocks (counter always restarts at 0 in computeMaintenanceBlocks)
    const futureCounter = { n: 0 };
    const freshFutureBlocks = [
      buildMaintenanceBlock('ZZ001', group, futureCounter),
      buildMaintenanceBlock('ZZ001', group, futureCounter),
      buildMaintenanceBlock('ZZ001', group, futureCounter),
    ];

    // Apply the re-stamping logic from scheduleOrchestrator:
    // offset from the MAX ID across ALL locked blocks (not just past count).
    const allLockedBlocks = [...pastBlocks]; // in real code this is lockedMaintBlocks.get(tail)
    const maxLockedIdx = allLockedBlocks.reduce((max, b) => {
      const match = b.blockId.match(/-(\d+)$/);
      const n = match ? parseInt(match[1], 10) : 0;
      return Math.max(max, n);
    }, 0);
    const reStamped = freshFutureBlocks.map((b, i) => ({
      ...b,
      blockId: `MAINT-ZZ001-${String(maxLockedIdx + i + 1).padStart(4, '0')}`,
    }));

    const merged = [...pastBlocks, ...reStamped];
    const ids = merged.map(b => b.blockId);

    expect(ids).toEqual([
      'MAINT-ZZ001-0001',
      'MAINT-ZZ001-0002',
      'MAINT-ZZ001-0003',
      'MAINT-ZZ001-0004',
      'MAINT-ZZ001-0005',
    ]);
    // All IDs must be unique
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('re-stamping avoids collisions when locked block IDs are non-contiguous', () => {
    // Simulates the real failure: original run had 10 blocks (IDs 0001–0010).
    // Past blocks are date-filtered and may not be the first N — here blocks
    // 0001, 0003, 0007 are past. Using pastBlocks.length (3) as the offset
    // would stamp fresh blocks as 0004, 0005, 0006 — colliding with 0003 from
    // locked and not clearing 0007. The correct fix is to offset from maxLockedIdx.
    const task = makeTask({ taskId: 'A', intervalType: 'Hours', interval: 5, durationHours: 2 });
    const due = utc(2026, 3, 10, 14);
    const group = [{ task, dueByDateTime: due, dueBeforeLegIndex: 1 }];

    // Simulate all locked blocks for this tail (from extractExistingMaintBlocks)
    const allLockedCounter = { n: 0 };
    const allLockedBlocks = Array.from({ length: 10 }, () =>
      buildMaintenanceBlock('ZZ001', group, allLockedCounter),
    ); // IDs: 0001–0010

    // "Past" blocks: non-contiguous subset — indices 0, 2, 6 (IDs 0001, 0003, 0007)
    const pastBlocks = [allLockedBlocks[0], allLockedBlocks[2], allLockedBlocks[6]];

    // Fresh future blocks
    const freshCounter = { n: 0 };
    const freshFutureBlocks = [
      buildMaintenanceBlock('ZZ001', group, freshCounter),
      buildMaintenanceBlock('ZZ001', group, freshCounter),
    ]; // IDs: 0001, 0002 before re-stamp

    // Apply correct re-stamping: offset from max across ALL locked blocks
    const maxLockedIdx = allLockedBlocks.reduce((max, b) => {
      const match = b.blockId.match(/-(\d+)$/);
      const n = match ? parseInt(match[1], 10) : 0;
      return Math.max(max, n);
    }, 0); // maxLockedIdx = 10

    const reStamped = freshFutureBlocks.map((b, i) => ({
      ...b,
      blockId: `MAINT-ZZ001-${String(maxLockedIdx + i + 1).padStart(4, '0')}`,
    })); // IDs: 0011, 0012

    const merged = [...pastBlocks, ...reStamped];
    const ids = merged.map(b => b.blockId);

    expect(ids).toContain('MAINT-ZZ001-0011');
    expect(ids).toContain('MAINT-ZZ001-0012');
    expect(new Set(ids).size).toBe(ids.length); // no duplicates
  });
});
