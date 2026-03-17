import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getDynamicStatusForAircraft,
  calculateFleetData,
  getStatusColor,
} from '../aircraftUtils';

// Fixed reference datetime: 2024-06-15 12:00
const FIXED_DATE = new Date('2024-06-15T12:00:00');
const TODAY = '2024-06-15';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeAircraft(
  routes: Array<Array<{
    departureDate: string;
    departureTime: string;
    arrivalDate: string;
    arrivalTime: string;
  }>>,
  maintenance: Array<{
    type: string;
    scheduleStartDate: string;
    scheduleStartTime: string;
    scheduleEndDate: string;
    scheduleEndTime: string;
  }> = [],
) {
  return { routes, maintenance };
}

function makeSegment(
  departureDate: string,
  departureTime: string,
  arrivalDate: string,
  arrivalTime: string,
) {
  return { departureDate, departureTime, arrivalDate, arrivalTime };
}

function makeMaintenance(
  type: string,
  scheduleStartDate: string,
  scheduleStartTime: string,
  scheduleEndDate: string,
  scheduleEndTime: string,
) {
  return { type, scheduleStartDate, scheduleStartTime, scheduleEndDate, scheduleEndTime };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('getDynamicStatusForAircraft', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Serviceable ────────────────────────────────────────────────────────────

  describe('Serviceable', () => {
    it('returns Serviceable when routes and maintenance are both empty', () => {
      const aircraft = makeAircraft([], []);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Serviceable');
    });

    it('returns Serviceable when all routes are in the past', () => {
      const aircraft = makeAircraft([
        [makeSegment('2024-06-10', '08:00', '2024-06-10', '10:00')],
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Serviceable');
    });

    it('returns Serviceable when all routes are in the future', () => {
      const aircraft = makeAircraft([
        [makeSegment('2024-06-20', '08:00', '2024-06-20', '10:00')],
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Serviceable');
    });

    it('returns Serviceable when maintenance has ended before today', () => {
      const aircraft = makeAircraft([], [
        makeMaintenance('Planned', '2024-06-01', '08:00', '2024-06-10', '17:00'),
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Serviceable');
    });

    it('returns Serviceable when maintenance starts after today', () => {
      const aircraft = makeAircraft([], [
        makeMaintenance('Planned', '2024-06-20', '08:00', '2024-06-25', '17:00'),
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Serviceable');
    });
  });

  // ── In flight ──────────────────────────────────────────────────────────────

  describe('In flight', () => {
    it('returns In flight when today is between journey start and end dates', () => {
      const aircraft = makeAircraft([
        [
          makeSegment('2024-06-14', '08:00', '2024-06-14', '12:00'),
          makeSegment('2024-06-14', '14:00', '2024-06-16', '09:00'),
        ],
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('In flight');
    });

    it('returns In flight when a same-day segment spans the current time', () => {
      // segment runs 10:00–14:00, current time is 12:00
      const aircraft = makeAircraft([
        [makeSegment(TODAY, '10:00', TODAY, '14:00')],
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('In flight');
    });

    it('returns Serviceable when a same-day segment has not yet departed', () => {
      // segment departs 14:00, current time is 12:00
      const aircraft = makeAircraft([
        [makeSegment(TODAY, '14:00', TODAY, '16:00')],
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Serviceable');
    });

    it('returns Serviceable when a same-day segment has already arrived', () => {
      // segment 08:00–10:00, current time is 12:00
      const aircraft = makeAircraft([
        [makeSegment(TODAY, '08:00', TODAY, '10:00')],
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Serviceable');
    });

    it('returns In flight when segment departs today and arrives tomorrow', () => {
      // departed at 10:00, current time is 12:00
      const aircraft = makeAircraft([
        [makeSegment(TODAY, '10:00', '2024-06-16', '06:00')],
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('In flight');
    });

    it('returns Serviceable when same-day multi-day segment has not yet departed', () => {
      // departs at 14:00, current time is 12:00
      const aircraft = makeAircraft([
        [makeSegment(TODAY, '14:00', '2024-06-16', '06:00')],
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Serviceable');
    });

    it('returns In flight when segment departed yesterday and arrives today after current time', () => {
      // arrives today at 14:00, current time is 12:00
      const aircraft = makeAircraft([
        [makeSegment('2024-06-14', '20:00', TODAY, '14:00')],
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('In flight');
    });

    it('returns Serviceable when segment arrived today before current time', () => {
      // arrived today at 10:00, current time is 12:00
      const aircraft = makeAircraft([
        [makeSegment('2024-06-14', '20:00', TODAY, '10:00')],
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Serviceable');
    });
  });

  // ── In-maintenance ─────────────────────────────────────────────────────────

  describe('In-maintenance', () => {
    it('returns In-maintenance for active Planned maintenance spanning today (< 30 days)', () => {
      const aircraft = makeAircraft([], [
        makeMaintenance('Planned', '2024-06-13', '08:00', '2024-06-20', '17:00'),
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('In-maintenance');
    });

    it('returns In-maintenance when maintenance starts today and current time is after start', () => {
      // starts today at 10:00, current time is 12:00
      const aircraft = makeAircraft([], [
        makeMaintenance('Planned', TODAY, '10:00', '2024-06-20', '17:00'),
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('In-maintenance');
    });

    it('returns Serviceable when maintenance starts today but has not yet started', () => {
      // starts today at 14:00, current time is 12:00
      const aircraft = makeAircraft([], [
        makeMaintenance('Planned', TODAY, '14:00', '2024-06-20', '17:00'),
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Serviceable');
    });

    it('returns In-maintenance when maintenance ends today and current time is before end', () => {
      // ends today at 14:00, current time is 12:00
      const aircraft = makeAircraft([], [
        makeMaintenance('Planned', '2024-06-13', '08:00', TODAY, '14:00'),
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('In-maintenance');
    });

    it('returns Serviceable when maintenance ended today before current time', () => {
      // ended today at 10:00, current time is 12:00
      const aircraft = makeAircraft([], [
        makeMaintenance('Planned', '2024-06-13', '08:00', TODAY, '10:00'),
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Serviceable');
    });
  });

  // ── Un-serviceable ─────────────────────────────────────────────────────────

  describe('Un-serviceable', () => {
    it('returns Un-serviceable for active Planned maintenance >= 30 days', () => {
      const aircraft = makeAircraft([], [
        makeMaintenance('Planned', '2024-06-01', '08:00', '2024-07-05', '17:00'),
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Un-serviceable');
    });

    it('returns Un-serviceable when Planned maintenance is exactly 30 days', () => {
      const aircraft = makeAircraft([], [
        makeMaintenance('Planned', '2024-06-01', '08:00', '2024-07-01', '17:00'),
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Un-serviceable');
    });

    it('returns In-maintenance when Planned maintenance is 29 days', () => {
      const aircraft = makeAircraft([], [
        makeMaintenance('Planned', '2024-06-01', '08:00', '2024-06-30', '17:00'),
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('In-maintenance');
    });
  });

  // ── Depth maintenance ──────────────────────────────────────────────────────

  describe('Depth maintenance', () => {
    it('returns Depth maintenance for active In-Depth maintenance', () => {
      const aircraft = makeAircraft([], [
        makeMaintenance('In-Depth', '2024-06-01', '08:00', '2024-07-31', '17:00'),
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Depth maintenance');
    });

    it('returns Depth maintenance for active Depth maintenance', () => {
      const aircraft = makeAircraft([], [
        makeMaintenance('Depth', '2024-06-01', '08:00', '2024-07-31', '17:00'),
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Depth maintenance');
    });

    it('returns Depth maintenance when both Planned and Depth maintenance are active', () => {
      const aircraft = makeAircraft([], [
        makeMaintenance('Planned', '2024-06-13', '08:00', '2024-06-20', '17:00'),
        makeMaintenance('Depth', '2024-06-01', '08:00', '2024-07-31', '17:00'),
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Depth maintenance');
    });
  });

  // ── Same-day start and end ─────────────────────────────────────────────────

  describe('same-day maintenance window', () => {
    it('returns In-maintenance when current time is within same-day Planned window', () => {
      // window 10:00–14:00, current time 12:00
      const aircraft = makeAircraft([], [
        makeMaintenance('Planned', TODAY, '10:00', TODAY, '14:00'),
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('In-maintenance');
    });

    it('returns Serviceable when current time is before same-day maintenance window', () => {
      // window 14:00–16:00, current time 12:00
      const aircraft = makeAircraft([], [
        makeMaintenance('Planned', TODAY, '14:00', TODAY, '16:00'),
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Serviceable');
    });

    it('returns Serviceable when current time is after same-day maintenance window', () => {
      // window 08:00–10:00, current time 12:00
      const aircraft = makeAircraft([], [
        makeMaintenance('Planned', TODAY, '08:00', TODAY, '10:00'),
      ]);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Serviceable');
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles missing routes property gracefully', () => {
      const aircraft = { maintenance: [] };
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Serviceable');
    });

    it('handles missing maintenance property gracefully', () => {
      const aircraft = { routes: [] };
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Serviceable');
    });

    it('handles an empty journey segment array within routes', () => {
      const aircraft = makeAircraft([[]], []);
      expect(getDynamicStatusForAircraft(aircraft)).toBe('Serviceable');
    });
  });
});

// ─── calculateFleetData ───────────────────────────────────────────────────────

describe('calculateFleetData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns zero counts for an empty fleet', () => {
    const result = calculateFleetData([]);
    expect(result).toEqual({
      serviceable: 0,
      inMaintenance: 0,
      unServiceable: 0,
      inFlight: 0,
      depthMaintenance: 0,
    });
  });

  it('counts a serviceable aircraft correctly', () => {
    const fleet = [makeAircraft([], [])];
    const result = calculateFleetData(fleet);
    expect(result.serviceable).toBe(1);
    expect(result.inFlight).toBe(0);
  });

  it('counts an in-flight aircraft correctly', () => {
    const fleet = [
      makeAircraft([
        [makeSegment(TODAY, '10:00', TODAY, '14:00')],
      ]),
    ];
    const result = calculateFleetData(fleet);
    expect(result.inFlight).toBe(1);
    expect(result.serviceable).toBe(0);
  });

  it('counts an in-maintenance aircraft correctly', () => {
    const fleet = [
      makeAircraft([], [
        makeMaintenance('Planned', '2024-06-13', '08:00', '2024-06-20', '17:00'),
      ]),
    ];
    const result = calculateFleetData(fleet);
    expect(result.inMaintenance).toBe(1);
  });

  it('counts an un-serviceable aircraft correctly', () => {
    const fleet = [
      makeAircraft([], [
        makeMaintenance('Planned', '2024-06-01', '08:00', '2024-07-05', '17:00'),
      ]),
    ];
    const result = calculateFleetData(fleet);
    expect(result.unServiceable).toBe(1);
  });

  it('counts a depth-maintenance aircraft correctly', () => {
    const fleet = [
      makeAircraft([], [
        makeMaintenance('In-Depth', '2024-06-01', '08:00', '2024-07-31', '17:00'),
      ]),
    ];
    const result = calculateFleetData(fleet);
    expect(result.depthMaintenance).toBe(1);
  });

  it('counts a mixed fleet correctly', () => {
    const fleet = [
      makeAircraft([], []),                                                                          // Serviceable
      makeAircraft([[makeSegment(TODAY, '10:00', TODAY, '14:00')]], []),                            // In flight
      makeAircraft([], [makeMaintenance('Planned', '2024-06-13', '08:00', '2024-06-20', '17:00')]), // In-maintenance
      makeAircraft([], [makeMaintenance('Planned', '2024-06-01', '08:00', '2024-07-05', '17:00')]), // Un-serviceable
      makeAircraft([], [makeMaintenance('In-Depth', '2024-06-01', '08:00', '2024-07-31', '17:00')]), // Depth maintenance
    ];
    const result = calculateFleetData(fleet);
    expect(result).toEqual({
      serviceable: 1,
      inFlight: 1,
      inMaintenance: 1,
      unServiceable: 1,
      depthMaintenance: 1,
    });
  });

  it('accumulates counts across multiple aircraft of the same status', () => {
    const fleet = [
      makeAircraft([], []),
      makeAircraft([], []),
      makeAircraft([], []),
    ];
    const result = calculateFleetData(fleet);
    expect(result.serviceable).toBe(3);
  });
});

// ─── getStatusColor ───────────────────────────────────────────────────────────

describe('getStatusColor', () => {
  it('returns green for Serviceable', () => {
    expect(getStatusColor('Serviceable')).toBe('#49a02c');
  });

  it('returns orange for In-maintenance', () => {
    expect(getStatusColor('In-maintenance')).toBe('#fe9f4d');
  });

  it('returns grey for Depth maintenance', () => {
    expect(getStatusColor('Depth maintenance')).toBe('#8a94ab');
  });

  it('returns red for Un-serviceable', () => {
    expect(getStatusColor('Un-serviceable')).toBe('#fe4d4d');
  });

  it('returns blue for In flight', () => {
    expect(getStatusColor('In flight')).toBe('#769dff');
  });

  it('returns the default green for an unknown status', () => {
    expect(getStatusColor('unknown')).toBe('#49a02c');
  });

  it('is case-sensitive — wrong case returns default', () => {
    expect(getStatusColor('serviceable')).toBe('#49a02c');
    expect(getStatusColor('IN FLIGHT')).toBe('#49a02c');
  });
});
