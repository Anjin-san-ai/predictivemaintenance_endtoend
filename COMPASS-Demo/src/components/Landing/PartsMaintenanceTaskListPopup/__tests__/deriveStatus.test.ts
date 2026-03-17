import { describe, it, expect, vi, afterEach } from 'vitest';
import { deriveStatus } from '../index';

// Pin "now" to a known UTC instant: 2026-03-14T10:00:00Z
const FIXED_NOW = new Date('2026-03-14T10:00:00Z');

afterEach(() => {
  vi.useRealTimers();
});

function withNow(fn: () => void) {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
  fn();
  vi.useRealTimers();
}

describe('deriveStatus', () => {
  it('returns Not-started when scheduleStartDate is undefined', () => {
    expect(deriveStatus(undefined, undefined, undefined, undefined)).toBe('Not-started');
  });

  it('returns Not-started when block is entirely in the future', () => {
    withNow(() => {
      expect(deriveStatus('2026-03-15', '2026-03-20', '08:00', '17:00')).toBe('Not-started');
    });
  });

  it('returns Completed when block is entirely in the past', () => {
    withNow(() => {
      expect(deriveStatus('2026-03-10', '2026-03-13', '08:00', '17:00')).toBe('Completed');
    });
  });

  it('returns Started when now is within the block', () => {
    withNow(() => {
      // Block: 2026-03-14T08:00Z → 2026-03-14T17:00Z, now = 10:00Z
      expect(deriveStatus('2026-03-14', '2026-03-14', '08:00', '17:00')).toBe('Started');
    });
  });

  it('returns Not-started when now is before block start on the same date', () => {
    withNow(() => {
      // Block starts at 11:00Z, now is 10:00Z
      expect(deriveStatus('2026-03-14', '2026-03-14', '11:00', '17:00')).toBe('Not-started');
    });
  });

  it('returns Completed when now is after block end on the same date', () => {
    withNow(() => {
      // Block ends at 09:00Z, now is 10:00Z
      expect(deriveStatus('2026-03-14', '2026-03-14', '08:00', '09:00')).toBe('Completed');
    });
  });

  it('falls back to start-of-day when scheduleStartTime is undefined', () => {
    withNow(() => {
      // No start time → defaults to 00:00Z; now (10:00Z) is after that → Started
      expect(deriveStatus('2026-03-14', '2026-03-14', undefined, '23:59')).toBe('Started');
    });
  });

  it('falls back to end-of-day when scheduleEndTime is undefined', () => {
    withNow(() => {
      // No end time → defaults to 23:59Z; now (10:00Z) is before that → Started
      expect(deriveStatus('2026-03-14', '2026-03-14', '08:00', undefined)).toBe('Started');
    });
  });

  it('falls back to scheduleStartDate as end when scheduleEndDate is undefined', () => {
    withNow(() => {
      // Single-date block, now is within it
      expect(deriveStatus('2026-03-14', undefined, '08:00', '17:00')).toBe('Started');
    });
  });

  it('does not produce Invalid Date from HH:MM time strings', () => {
    withNow(() => {
      // Regression: previously `:00Z` was appended to an already-complete HH:MM string,
      // producing "HH:MM:00Z" → malformed ISO → Invalid Date → always returned 'Started'.
      const result = deriveStatus('2026-03-15', '2026-03-20', '08:30', '17:45');
      expect(result).toBe('Not-started'); // block is in the future
    });
  });

  it('returns Started at the exact start boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-14T08:00:00Z'));
    expect(deriveStatus('2026-03-14', '2026-03-14', '08:00', '17:00')).toBe('Started');
    vi.useRealTimers();
  });

  it('returns Completed after the exact end boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-14T17:01:00Z'));
    expect(deriveStatus('2026-03-14', '2026-03-14', '08:00', '17:00')).toBe('Completed');
    vi.useRealTimers();
  });
});
