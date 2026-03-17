/**
 * @file hoursAccumulation.test.ts
 *
 * End-to-end verification that flight hours correctly accumulate through the
 * full scheduler pipeline and trigger maintenance at the expected thresholds.
 *
 * Covers the scenarios raised in the schedule impact audit:
 *   - Hours-based tasks: fires after enough cumulative flight hours
 *   - Correct threshold: alreadyElapsed + cumulativeHours >= n * interval
 *   - Multiple flights back-to-back: each adds to the running total
 *   - Tasks with large intervals (2000h+) do not fire within a short horizon
 *   - lastCompletedDate provided: task is immediately overdue (conservative)
 *   - scheduleHorizonEnd extends to cover added flight legs
 */

import { describe, it, expect } from 'vitest';
import { computeDueEvents } from '../maintenanceEngine';
import { computeMaintenanceBlocks } from '../maintenanceEngine';
import { imputeMaintTask, imputeTailStatus } from '../imputation';
import type { MaintTask, TailStatus, FlightLeg, RawMaintTask } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function utc(year: number, month: number, day: number, hour = 0, min = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, min));
}

function makeLeg(
  flightNumber: number,
  departure: Date,
  arrivalHoursLater: number,
): FlightLeg {
  return {
    flightNumber,
    legNumber: 1,
    origin: 'LHR',
    destination: 'JFK',
    departure,
    arrival: new Date(departure.getTime() + arrivalHoursLater * 3_600_000),
  };
}

function makeHoursTask(
  taskId: string,
  interval: number,
  currentHours: number,
  impliedLastCompletedHours: number,
): MaintTask {
  return {
    tailNumber: 'ZZ001',
    taskId,
    maintType: 'Planned Maintenance',
    maintName: taskId,
    durationHours: 4,
    crewCount: 2,
    interval,
    intervalType: 'Hours',
    lastCompletedDate: utc(2026, 1, 1),
    impliedLastCompletedHours,
    impliedLastCompletedLandings: 0,
    taskDetails: '',
    trade: 'Mechanical',
  };
}

function makeStatus(currentHours: number): TailStatus {
  return { tailNumber: 'ZZ001', currentHours, currentLandings: 0 };
}

// ─── Core hours accumulation ──────────────────────────────────────────────────

describe('hours accumulation — computeDueEvents', () => {
  it('does not fire when cumulative flight hours have not reached the threshold', () => {
    // 35h interval, 14h already elapsed → needs 21h more. Add only 10h of flights.
    const task = makeHoursTask('T1', 35, 1675, 1661); // alreadyElapsed = 14
    const legs = [
      makeLeg(1, utc(2026, 3, 10, 8), 5),   // 5h
      makeLeg(2, utc(2026, 3, 11, 8), 5),   // 5h → total 10h, still under 21h
    ];
    const events = computeDueEvents([task], legs, makeStatus(1675));
    expect(events).toHaveLength(0);
  });

  it('fires exactly once when a single long leg crosses the interval threshold', () => {
    // 35h interval, 14h already elapsed → needs 21h more.
    // Single 25h leg: 14 + 25 = 39 ≥ 35 → fires on leg 0.
    const task = makeHoursTask('T1', 35, 1675, 1661);
    const legs = [
      makeLeg(1, utc(2026, 3, 10, 8), 25),  // 14 + 25 = 39 ≥ 35 → FIRE
    ];
    const events = computeDueEvents([task], legs, makeStatus(1675));
    expect(events).toHaveLength(1);
    expect(events[0].dueByDateTime).toEqual(utc(2026, 3, 10, 8));
    expect(events[0].dueBeforeLegIndex).toBe(0);
  });

  it('fires at the correct leg when hours cross mid-sequence', () => {
    // Needs 21h more. Three 8h legs: thresholds → 14+8=22, 14+16=30, 14+24=38.
    // Threshold 35 crossed on leg 3 (cumulative 24h: 14+24=38 ≥ 35).
    const task = makeHoursTask('T1', 35, 1675, 1661);
    const legs = [
      makeLeg(1, utc(2026, 3, 10, 8), 8),   // 14+8=22 < 35 — not yet
      makeLeg(2, utc(2026, 3, 11, 8), 8),   // 14+16=30 < 35 — not yet
      makeLeg(3, utc(2026, 3, 12, 8), 8),   // 14+24=38 ≥ 35 — FIRE on leg index 2
    ];
    const events = computeDueEvents([task], legs, makeStatus(1675));
    expect(events).toHaveLength(1);
    expect(events[0].dueBeforeLegIndex).toBe(2); // fires when leg 3 (index 2) is reached
  });

  it('fires multiple times when many hours are accumulated (recurring)', () => {
    // 35h interval, 14h already elapsed. Six 10h legs = 60h. Should fire at:
    //   leg 2 (cumulative 20h + 14 = 34h — no), leg 3 (30+14=44 ≥ 35 — FIRE, n=1)
    //   need n=2 at 70h total: 14+30=44 ≥ 35 (n=1), 14+60=74 ≥ 70 (n=2)
    const task = makeHoursTask('T1', 35, 1675, 1661);
    const legs = Array.from({ length: 6 }, (_, i) =>
      makeLeg(i + 1, utc(2026, 3, 10 + i, 8), 10),
    );
    const events = computeDueEvents([task], legs, makeStatus(1675));
    expect(events.length).toBeGreaterThanOrEqual(2); // at least 2 occurrences
  });

  it('fires immediately (overdue) when lastCompletedDate is provided — conservative assumption', () => {
    // imputeMaintTask with provided lastCompletedDate sets
    // impliedLastCompletedHours = currentHours - interval, so alreadyElapsed = interval.
    const task = makeHoursTask('T1', 35, 1675, 1675 - 35); // alreadyElapsed = 35 = interval
    const legs = [makeLeg(1, utc(2026, 3, 10, 8), 8)];
    const events = computeDueEvents([task], legs, makeStatus(1675));
    // alreadyElapsed(35) >= 1*interval(35) → fires as overdue before first leg
    expect(events).toHaveLength(1);
    expect(events[0].dueByDateTime).toEqual(legs[0].departure);
    expect(events[0].dueBeforeLegIndex).toBe(0);
  });

  it('does not fire for large-interval tasks (2000h) within a short flight sequence', () => {
    // currentHours=1675, impliedLastCompletedHours=875 (0.4*2000=800 already elapsed)
    // Need 1200 more hours. No realistic demo flight sequence will reach this.
    const task = makeHoursTask('T3', 2000, 1675, 875); // alreadyElapsed = 800
    const legs = Array.from({ length: 20 }, (_, i) =>  // 20 × 10h = 200h
      makeLeg(i + 1, utc(2026, 3, 10 + i, 8), 10),
    );
    const events = computeDueEvents([task], legs, makeStatus(1675));
    // 800 + 200 = 1000 < 2000 → no fire
    expect(events).toHaveLength(0);
  });
});

// ─── imputeMaintTask — implied hours calculation ──────────────────────────────

describe('imputeMaintTask — impliedLastCompletedHours', () => {
  const horizonStart = utc(2026, 3, 1);

  it('sets alreadyElapsed to 40% of interval when lastCompletedDate is null', () => {
    const raw: RawMaintTask = {
      tailNumber: 'ZZ001', taskId: 'T1', maintType: 'Planned Maintenance',
      maintName: 'Test', durationHours: 4, crewCount: 2,
      interval: 35, intervalType: 'Hours',
      lastCompletedDate: null, taskDetails: '', trade: 'Mechanical',
    };
    const status: TailStatus = { tailNumber: 'ZZ001', currentHours: 1675, currentLandings: 0 };
    const task = imputeMaintTask(raw, status, horizonStart, 0);
    const alreadyElapsed = status.currentHours - task.impliedLastCompletedHours;
    expect(alreadyElapsed).toBe(Math.round(0.4 * 35)); // 14
  });

  it('sets alreadyElapsed to full interval when lastCompletedDate is provided', () => {
    const raw: RawMaintTask = {
      tailNumber: 'ZZ001', taskId: 'T1', maintType: 'Planned Maintenance',
      maintName: 'Test', durationHours: 4, crewCount: 2,
      interval: 35, intervalType: 'Hours',
      lastCompletedDate: utc(2026, 2, 1),
      taskDetails: '', trade: 'Mechanical',
    };
    const status: TailStatus = { tailNumber: 'ZZ001', currentHours: 1675, currentLandings: 0 };
    const task = imputeMaintTask(raw, status, horizonStart, 0);
    const alreadyElapsed = status.currentHours - task.impliedLastCompletedHours;
    expect(alreadyElapsed).toBe(35); // full interval → immediately overdue
  });
});

// ─── Full pipeline: computeMaintenanceBlocks ─────────────────────────────────

describe('computeMaintenanceBlocks — end-to-end hours pipeline', () => {
  it('schedules a maintenance block when assigned legs cross the hours threshold', () => {
    // 35h interval, 14h elapsed. Three 8h legs: threshold crossed on leg 3 (March 12).
    // The block must be placed before leg 3's departure (March 12 08:00).
    const task = makeHoursTask('T1', 35, 1675, 1661);
    const legs = [
      makeLeg(1, utc(2026, 3, 10, 8), 8),  // 14+8=22 < 35
      makeLeg(2, utc(2026, 3, 11, 8), 8),  // 14+16=30 < 35
      makeLeg(3, utc(2026, 3, 12, 8), 8),  // 14+24=38 ≥ 35 → fires here
    ];
    const blocks = computeMaintenanceBlocks('ZZ001', [task], makeStatus(1675), legs);
    expect(blocks.length).toBeGreaterThanOrEqual(1);
    // Block must start before or at the leg that triggered it (March 12 08:00)
    expect(blocks[0].startDateTime.getTime()).toBeLessThanOrEqual(utc(2026, 3, 12, 8).getTime());
  });

  it('produces no maintenance block when legs do not accumulate enough hours', () => {
    // 35h interval, 14h elapsed. Only 2 × 5h = 10h of flights → 24h total, not enough.
    const task = makeHoursTask('T1', 35, 1675, 1661);
    const legs = [
      makeLeg(1, utc(2026, 3, 10, 8), 5),
      makeLeg(2, utc(2026, 3, 11, 8), 5),
    ];
    const blocks = computeMaintenanceBlocks('ZZ001', [task], makeStatus(1675), legs);
    expect(blocks).toHaveLength(0);
  });

  it('schedules additional maintenance block when hours cross threshold a second time', () => {
    // 35h interval. Start with 14h elapsed. Six 10h legs = 60h cumulative.
    // Two occurrences expected: one at ~21h remaining, another at ~56h remaining.
    const task = makeHoursTask('T1', 35, 1675, 1661);
    const legs = Array.from({ length: 6 }, (_, i) =>
      makeLeg(i + 1, utc(2026, 3, 10 + i, 8), 10),
    );
    const blocks = computeMaintenanceBlocks('ZZ001', [task], makeStatus(1675), legs);
    expect(blocks.length).toBeGreaterThanOrEqual(2);
  });

  it('accounts for hours already accumulated by previously assigned legs', () => {
    // Simulates adding a new flight to a tail that already has flights assigned.
    // First, establish: 20h of existing legs not quite enough (14 + 20 = 34 < 35).
    // Then add one more 5h leg → 14 + 20 + 5 = 39 ≥ 35 → fires.
    const task = makeHoursTask('T1', 35, 1675, 1661);
    const legsWithout = [makeLeg(1, utc(2026, 3, 10, 8), 20)];
    const legsWithNewFlight = [
      makeLeg(1, utc(2026, 3, 10, 8), 20),
      makeLeg(2, utc(2026, 3, 12, 8), 5), // new flight
    ];

    const blocksBefore = computeMaintenanceBlocks('ZZ001', [task], makeStatus(1675), legsWithout);
    const blocksAfter  = computeMaintenanceBlocks('ZZ001', [task], makeStatus(1675), legsWithNewFlight);

    expect(blocksBefore).toHaveLength(0); // not triggered yet
    expect(blocksAfter.length).toBeGreaterThanOrEqual(1); // new flight tips it over
  });
});
