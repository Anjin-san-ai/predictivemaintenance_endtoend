import { describe, it, expect } from 'vitest';
import { InMemoryDataProvider, nextFlightNumber } from '../inMemoryDataProvider';
import type { RawFlightLeg, RawScheduleData } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeEmptyData(): RawScheduleData {
  return { flightLegs: [], maintTasks: [], tailStatuses: [] };
}

function makeLeg(flightNumber: number, legNumber = 1): RawFlightLeg {
  const d = new Date('2026-01-01');
  return {
    flightNumber,
    legNumber,
    origin: 'LHR',
    destination: 'JFK',
    departureDate: d,
    departureTime: '10:00',
    arrivalDate: d,
    arrivalTime: '14:00',
  };
}

// ─── nextFlightNumber ────────────────────────────────────────────────────────

describe('nextFlightNumber', () => {
  it('returns 1 when the legs array is empty', () => {
    expect(nextFlightNumber([])).toBe(1);
  });

  it('returns max + 1 for a single-leg dataset', () => {
    expect(nextFlightNumber([makeLeg(5)])).toBe(6);
  });

  it('returns max + 1 for a multi-leg dataset', () => {
    const legs = [makeLeg(10), makeLeg(3), makeLeg(7), makeLeg(10, 2)];
    expect(nextFlightNumber(legs)).toBe(11);
  });

  it('handles a single leg with flight number 0', () => {
    expect(nextFlightNumber([makeLeg(0)])).toBe(1);
  });
});

// ─── InMemoryDataProvider ────────────────────────────────────────────────────

describe('InMemoryDataProvider', () => {
  it('returns base legs when no additional legs are provided', async () => {
    const base = makeEmptyData();
    base.flightLegs = [makeLeg(1), makeLeg(2)];
    const provider = new InMemoryDataProvider(base, []);
    const result = await provider.load();
    expect(result.flightLegs).toHaveLength(2);
    expect(result.flightLegs.map(l => l.flightNumber)).toEqual([1, 2]);
  });

  it('appends additional legs to the base legs', async () => {
    const base = makeEmptyData();
    base.flightLegs = [makeLeg(1), makeLeg(2)];
    const extra = [makeLeg(3), makeLeg(4)];
    const provider = new InMemoryDataProvider(base, extra);
    const result = await provider.load();
    expect(result.flightLegs).toHaveLength(4);
    expect(result.flightLegs.map(l => l.flightNumber)).toEqual([1, 2, 3, 4]);
  });

  it('preserves maintTasks and tailStatuses from base unchanged', async () => {
    const base = makeEmptyData();
    base.maintTasks = [
      {
        tailNumber: 'ZZ100',
        taskId: 'T1',
        maintType: 'Planned Maintenance',
        maintName: 'Oil check',
        durationHours: 4,
        crewCount: 2,
        interval: 200,
        intervalType: 'Hours',
        lastCompletedDate: null,
        taskDetails: '',
        trade: 'Mechanical',
      },
    ];
    base.tailStatuses = [{ tailNumber: 'ZZ100', currentHours: 500, currentLandings: 200 }];

    const provider = new InMemoryDataProvider(base, [makeLeg(99)]);
    const result = await provider.load();

    expect(result.maintTasks).toBe(base.maintTasks);
    expect(result.tailStatuses).toBe(base.tailStatuses);
  });

  it('does not mutate the base flightLegs array', async () => {
    const base = makeEmptyData();
    base.flightLegs = [makeLeg(1)];
    const originalLength = base.flightLegs.length;

    const provider = new InMemoryDataProvider(base, [makeLeg(2)]);
    await provider.load();

    expect(base.flightLegs).toHaveLength(originalLength);
  });

  it('works correctly when both base and additional legs are empty', async () => {
    const provider = new InMemoryDataProvider(makeEmptyData(), []);
    const result = await provider.load();
    expect(result.flightLegs).toHaveLength(0);
  });
});
