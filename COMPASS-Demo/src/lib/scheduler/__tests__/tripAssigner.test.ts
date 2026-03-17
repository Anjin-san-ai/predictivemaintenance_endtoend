import { describe, it, expect } from 'vitest';
import { checkTripFeasibility, buildTrips, assignTrips } from '../tripAssigner';
import type { Trip, MaintenanceBlock, FlightBlock, FlightLeg } from '../types';
import type { TailState } from '../tripAssigner';

// ─── Helpers ────────────────────────────────────────────────────────────────

function utc(year: number, month: number, day: number, hour = 0, min = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, min));
}

function makeTrip(
  tripId: number,
  departure: Date,
  arrival: Date,
  legs?: FlightLeg[],
): Trip {
  const defaultLegs: FlightLeg[] = legs ?? [
    { flightNumber: tripId, legNumber: 1, origin: 'AAA', destination: 'BBB', departure, arrival },
  ];
  return { tripId, legs: defaultLegs, earliestDeparture: departure, latestArrival: arrival };
}

function makeMaintenanceBlock(
  blockId: string,
  start: Date,
  end: Date,
): MaintenanceBlock {
  return {
    tailNumber: 'ZZ001',
    blockId,
    startDateTime: start,
    endDateTime: end,
    durationHours: (end.getTime() - start.getTime()) / 3_600_000,
    includedTasks: [],
    maintTypes: ['Planned Maintenance'],
  };
}

function makeFlightBlock(
  tripId: number,
  start: Date,
  end: Date,
): FlightBlock {
  return {
    tailNumber: 'ZZ001',
    tripId,
    legs: [],
    start,
    end,
  };
}

function makeEmptyTailState(): TailState {
  return {
    tailNumber: 'ZZ001',
    flightBlocks: [],
    maintBlocks: [],
    accumulatedFlightHours: 0,
    totalHours: 0,
  };
}

// ─── checkTripFeasibility ────────────────────────────────────────────────────

describe('checkTripFeasibility', () => {
  it('returns null (feasible) for an empty tail with no constraints', () => {
    const trip = makeTrip(1, utc(2026, 3, 10, 8), utc(2026, 3, 10, 12));
    const state = makeEmptyTailState();
    expect(checkTripFeasibility(trip, state)).toBeNull();
  });

  it('returns a reason when trip overlaps a maintenance block', () => {
    const trip = makeTrip(1, utc(2026, 3, 10, 10), utc(2026, 3, 10, 14));
    const state = {
      ...makeEmptyTailState(),
      maintBlocks: [
        makeMaintenanceBlock('MB-001', utc(2026, 3, 10, 8), utc(2026, 3, 10, 12)),
      ],
    };
    const result = checkTripFeasibility(trip, state);
    expect(result).not.toBeNull();
    expect(result).toContain('overlaps maintenance block');
  });

  it('returns a reason when maintenance falls between trip legs', () => {
    const legs: FlightLeg[] = [
      { flightNumber: 1, legNumber: 1, origin: 'A', destination: 'B', departure: utc(2026, 3, 10, 8), arrival: utc(2026, 3, 10, 10) },
      { flightNumber: 1, legNumber: 2, origin: 'B', destination: 'C', departure: utc(2026, 3, 10, 14), arrival: utc(2026, 3, 10, 16) },
    ];
    const trip = makeTrip(1, utc(2026, 3, 10, 8), utc(2026, 3, 10, 16), legs);
    const state = {
      ...makeEmptyTailState(),
      maintBlocks: [
        makeMaintenanceBlock('MB-001', utc(2026, 3, 10, 11), utc(2026, 3, 10, 13)), // in the gap between legs
      ],
    };
    const result = checkTripFeasibility(trip, state);
    expect(result).not.toBeNull();
    expect(result).toContain('between legs');
  });

  it('returns a reason when gap after maintenance is less than 4 hours', () => {
    const trip = makeTrip(1, utc(2026, 3, 10, 14), utc(2026, 3, 10, 18));
    const state = {
      ...makeEmptyTailState(),
      maintBlocks: [
        makeMaintenanceBlock('MB-001', utc(2026, 3, 10, 8), utc(2026, 3, 10, 12)), // ends 12:00, trip starts 14:00 — only 2h gap
      ],
    };
    const result = checkTripFeasibility(trip, state);
    expect(result).not.toBeNull();
    expect(result).toContain('gap after maintenance');
  });

  it('returns null when gap after maintenance is exactly 4 hours (boundary)', () => {
    const trip = makeTrip(1, utc(2026, 3, 10, 16), utc(2026, 3, 10, 20));
    const state = {
      ...makeEmptyTailState(),
      maintBlocks: [
        makeMaintenanceBlock('MB-001', utc(2026, 3, 10, 8), utc(2026, 3, 10, 12)), // ends 12:00, trip 16:00 — exactly 4h
      ],
    };
    expect(checkTripFeasibility(trip, state)).toBeNull();
  });

  it('returns a reason when gap before trip is less than 4 hours after the last flight', () => {
    const trip = makeTrip(2, utc(2026, 3, 10, 14), utc(2026, 3, 10, 18));
    const state = {
      ...makeEmptyTailState(),
      flightBlocks: [
        makeFlightBlock(1, utc(2026, 3, 10, 8), utc(2026, 3, 10, 12)), // ends 12:00, trip 2 starts 14:00 — 2h gap
      ],
    };
    const result = checkTripFeasibility(trip, state);
    expect(result).not.toBeNull();
    expect(result).toContain('gap before trip');
  });

  it('returns null when gap between flights is exactly 4 hours', () => {
    const trip = makeTrip(2, utc(2026, 3, 10, 16), utc(2026, 3, 10, 20));
    const state = {
      ...makeEmptyTailState(),
      flightBlocks: [
        makeFlightBlock(1, utc(2026, 3, 10, 8), utc(2026, 3, 10, 12)), // ends 12:00, trip 2 starts 16:00 — exactly 4h
      ],
    };
    expect(checkTripFeasibility(trip, state)).toBeNull();
  });

  it('returns a reason when trip overlaps an existing flight block', () => {
    const trip = makeTrip(2, utc(2026, 3, 10, 10), utc(2026, 3, 10, 14));
    const state = {
      ...makeEmptyTailState(),
      flightBlocks: [
        makeFlightBlock(1, utc(2026, 3, 10, 8), utc(2026, 3, 10, 16)), // overlaps
      ],
    };
    const result = checkTripFeasibility(trip, state);
    expect(result).not.toBeNull();
    expect(result).toContain('overlaps existing flight block');
  });

  it('returns null when trip is well-separated from both maintenance and flights', () => {
    const trip = makeTrip(3, utc(2026, 3, 15, 8), utc(2026, 3, 15, 12));
    const state = {
      ...makeEmptyTailState(),
      maintBlocks: [makeMaintenanceBlock('MB-001', utc(2026, 3, 10, 8), utc(2026, 3, 10, 12))],
      flightBlocks: [makeFlightBlock(1, utc(2026, 3, 11, 8), utc(2026, 3, 11, 12))],
    };
    expect(checkTripFeasibility(trip, state)).toBeNull();
  });
});

// ─── buildTrips ──────────────────────────────────────────────────────────────

describe('buildTrips', () => {
  it('groups legs by flightNumber into trips', () => {
    const rawLegs = [
      { flightNumber: 1, legNumber: 1, origin: 'A', destination: 'B', departureDate: utc(2026, 3, 10), departureTime: '08:00', arrivalDate: utc(2026, 3, 10), arrivalTime: '10:00' },
      { flightNumber: 1, legNumber: 2, origin: 'B', destination: 'C', departureDate: utc(2026, 3, 10), departureTime: '14:00', arrivalDate: utc(2026, 3, 10), arrivalTime: '16:00' },
      { flightNumber: 2, legNumber: 1, origin: 'D', destination: 'E', departureDate: utc(2026, 3, 11), departureTime: '09:00', arrivalDate: utc(2026, 3, 11), arrivalTime: '11:00' },
    ];
    const trips = buildTrips(rawLegs);
    expect(trips).toHaveLength(2);
    const trip1 = trips.find(t => t.tripId === 1);
    expect(trip1?.legs).toHaveLength(2);
  });

  it('sorts legs within a trip by legNumber', () => {
    const rawLegs = [
      { flightNumber: 1, legNumber: 2, origin: 'B', destination: 'C', departureDate: utc(2026, 3, 10), departureTime: '14:00', arrivalDate: utc(2026, 3, 10), arrivalTime: '16:00' },
      { flightNumber: 1, legNumber: 1, origin: 'A', destination: 'B', departureDate: utc(2026, 3, 10), departureTime: '08:00', arrivalDate: utc(2026, 3, 10), arrivalTime: '10:00' },
    ];
    const trips = buildTrips(rawLegs);
    expect(trips[0].legs[0].legNumber).toBe(1);
    expect(trips[0].legs[1].legNumber).toBe(2);
  });

  it('sorts trips chronologically by earliest departure', () => {
    const rawLegs = [
      { flightNumber: 2, legNumber: 1, origin: 'D', destination: 'E', departureDate: utc(2026, 3, 15), departureTime: '09:00', arrivalDate: utc(2026, 3, 15), arrivalTime: '11:00' },
      { flightNumber: 1, legNumber: 1, origin: 'A', destination: 'B', departureDate: utc(2026, 3, 10), departureTime: '08:00', arrivalDate: utc(2026, 3, 10), arrivalTime: '10:00' },
    ];
    const trips = buildTrips(rawLegs);
    expect(trips[0].tripId).toBe(1);
    expect(trips[1].tripId).toBe(2);
  });

  it('sets earliestDeparture and latestArrival correctly from combined date+time', () => {
    const rawLegs = [
      { flightNumber: 1, legNumber: 1, origin: 'A', destination: 'B', departureDate: utc(2026, 3, 10), departureTime: '08:30', arrivalDate: utc(2026, 3, 10), arrivalTime: '11:45' },
    ];
    const trips = buildTrips(rawLegs);
    expect(trips[0].earliestDeparture).toEqual(utc(2026, 3, 10, 8, 30));
    expect(trips[0].latestArrival).toEqual(utc(2026, 3, 10, 11, 45));
  });

  it('returns an empty array for empty input', () => {
    expect(buildTrips([])).toHaveLength(0);
  });
});

// ─── assignTrips — lockedAssignments ────────────────────────────────────────

describe('assignTrips — lockedAssignments', () => {
  /** Minimal TailStatus map for two tails. */
  function makeTailStatuses(): Map<string, import('../types').TailStatus> {
    return new Map([
      ['ZZ100', { tailNumber: 'ZZ100', currentHours: 100, currentLandings: 50 }],
      ['ZZ200', { tailNumber: 'ZZ200', currentHours: 50,  currentLandings: 25 }],
    ]);
  }

  const emptyMaint = new Map([['ZZ100', []], ['ZZ200', []]]);
  const distantPast = new Date(0); // new Date(0) disables the "before now" guard

  it('assigns a locked trip to its designated tail regardless of scoring', () => {
    // ZZ200 has fewer hours so scoring would normally pick it. With a lock,
    // trip 1 must go to ZZ100.
    const trip1 = makeTrip(1, utc(2026, 1, 1, 8), utc(2026, 1, 1, 12));
    const locked = new Map([[1, 'ZZ100']]);

    const result = assignTrips([trip1], makeTailStatuses(), emptyMaint, distantPast, locked);

    const zz100 = result.tailStates.get('ZZ100')!;
    const zz200 = result.tailStates.get('ZZ200')!;

    expect(zz100.flightBlocks).toHaveLength(1);
    expect(zz100.flightBlocks[0].tripId).toBe(1);
    expect(zz200.flightBlocks).toHaveLength(0);
    expect(result.unscheduled).toHaveLength(0);
  });

  it('assigns unlocked trips normally when locked trips are also present', () => {
    const trip1 = makeTrip(1, utc(2026, 1, 1, 8),  utc(2026, 1, 1, 12)); // locked to ZZ100
    const trip2 = makeTrip(2, utc(2026, 1, 2, 8),  utc(2026, 1, 2, 12)); // free — scoring picks ZZ200 (lower hours)
    const locked = new Map([[1, 'ZZ100']]);

    const result = assignTrips([trip1, trip2], makeTailStatuses(), emptyMaint, distantPast, locked);

    const zz100 = result.tailStates.get('ZZ100')!;
    const zz200 = result.tailStates.get('ZZ200')!;

    expect(zz100.flightBlocks.map(b => b.tripId)).toContain(1);
    expect(zz200.flightBlocks.map(b => b.tripId)).toContain(2);
    expect(result.unscheduled).toHaveLength(0);
  });

  it('behaves identically to no-lock when lockedAssignments is undefined', () => {
    const trip1 = makeTrip(1, utc(2026, 1, 1, 8), utc(2026, 1, 1, 12));

    const withLock    = assignTrips([trip1], makeTailStatuses(), emptyMaint, distantPast, new Map());
    const withoutLock = assignTrips([trip1], makeTailStatuses(), emptyMaint, distantPast, undefined);

    const tailWithLock    = [...withLock.tailStates.values()].find(s => s.flightBlocks.length > 0)!;
    const tailWithoutLock = [...withoutLock.tailStates.values()].find(s => s.flightBlocks.length > 0)!;

    expect(tailWithLock.tailNumber).toBe(tailWithoutLock.tailNumber);
  });

  it('falls through to normal assignment if the locked tail is not in tailStatuses', () => {
    // Locking to an unknown tail should not drop the trip — it should still be scheduled.
    const trip1 = makeTrip(1, utc(2026, 1, 1, 8), utc(2026, 1, 1, 12));
    const locked = new Map([[1, 'ZZ999']]); // ZZ999 does not exist

    const result = assignTrips([trip1], makeTailStatuses(), emptyMaint, distantPast, locked);

    const totalBlocks = [...result.tailStates.values()].reduce((sum, s) => sum + s.flightBlocks.length, 0);
    expect(totalBlocks).toBe(1);
    expect(result.unscheduled).toHaveLength(0);
  });
});

// ─── assignTrips — locked trip maintenance conflict resolution ───────────────

describe('assignTrips — locked trip maintenance conflict resolution', () => {
  function makeTailStatuses(): Map<string, import('../types').TailStatus> {
    return new Map([
      ['ZZ100', { tailNumber: 'ZZ100', currentHours: 100, currentLandings: 50 }],
    ]);
  }

  it('shifts maintenance earlier when a locked trip conflicts and an early shift is possible', () => {
    // Maintenance: 08:00–12:00. Locked trip departs 10:00. Early shift should move
    // maintenance to end at tripStart - 4h = 06:00, start at 02:00.
    const now = utc(2026, 1, 1, 0); // midnight — early shift is allowed
    const maint = new Map<string, MaintenanceBlock[]>([
      ['ZZ100', [makeMaintenanceBlock('MB-001', utc(2026, 1, 1, 8), utc(2026, 1, 1, 12))]],
    ]);
    const trip = makeTrip(1, utc(2026, 1, 1, 10), utc(2026, 1, 1, 14));
    const locked = new Map([[1, 'ZZ100']]);

    const result = assignTrips([trip], makeTailStatuses(), maint, now, locked);

    const state = result.tailStates.get('ZZ100')!;
    expect(state.flightBlocks).toHaveLength(1);
    // Maintenance must end at least 4h before trip departure (10:00), so by 06:00
    expect(state.maintBlocks[0].endDateTime.getTime()).toBeLessThanOrEqual(utc(2026, 1, 1, 6).getTime());
  });

  it('shifts maintenance later (fallback) when early shift would go before now', () => {
    // now = 10:00. Maintenance: 08:00–12:00 overlaps locked trip 10:00–14:00.
    // Early shift would put newStart before now → fallback: shift to after trip ends + 4h = 18:00.
    const now = utc(2026, 1, 1, 10);
    const maint = new Map<string, MaintenanceBlock[]>([
      ['ZZ100', [makeMaintenanceBlock('MB-001', utc(2026, 1, 1, 8), utc(2026, 1, 1, 12))]],
    ]);
    const trip = makeTrip(1, utc(2026, 1, 1, 10), utc(2026, 1, 1, 14));
    const locked = new Map([[1, 'ZZ100']]);

    const result = assignTrips([trip], makeTailStatuses(), maint, now, locked);

    const state = result.tailStates.get('ZZ100')!;
    expect(state.flightBlocks).toHaveLength(1);
    // Maintenance must start at or after tripEnd + 4h = 18:00
    expect(state.maintBlocks[0].startDateTime.getTime()).toBeGreaterThanOrEqual(utc(2026, 1, 1, 18).getTime());
  });

  it('does not move maintenance that does not conflict with the locked trip', () => {
    // Maintenance is 5 days before the trip — should be untouched.
    const now = utc(2026, 1, 1, 0);
    const maint = new Map<string, MaintenanceBlock[]>([
      ['ZZ100', [makeMaintenanceBlock('MB-001', utc(2025, 12, 25, 8), utc(2025, 12, 25, 12))]],
    ]);
    const trip = makeTrip(1, utc(2026, 1, 1, 8), utc(2026, 1, 1, 12));
    const locked = new Map([[1, 'ZZ100']]);

    const result = assignTrips([trip], makeTailStatuses(), maint, now, locked);

    const state = result.tailStates.get('ZZ100')!;
    expect(state.maintBlocks[0].startDateTime).toEqual(utc(2025, 12, 25, 8));
  });
});
