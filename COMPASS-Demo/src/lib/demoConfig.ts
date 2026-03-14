// =============================================================================
// COMPASS Demo — Configuration Constants
// =============================================================================
// Centralises all hardcoded demo-specific values so they can be updated in
// one place when refreshing the demo scenario.
// =============================================================================

/** Tail number of the aircraft used for the "Add Flight" demo workflow. */
export const DEMO_TAIL_NUMBER = 'ZZ198';

/** ICAO code of the demo fleet's home airport (used as default origin/destination). */
export const DEMO_HOME_AIRPORT = 'LHR';

/**
 * Simulated maintenance workforce.
 * Used to deterministically assign an engineer to each task so the same
 * task on the same tail always shows the same person across page loads.
 */
export const DEMO_WORKFORCE = [
  'Antonio Hoeger',
  'Christina Beer',
  'Jody Roberts',
  'Marcus Chen',
  'Priya Nair',
  'Stefan Wolff',
  'Leila Ahmadi',
  'Thomas Hartmann',
  'Sophie Laurent',
  'Raj Patel',
  'Emma Johansson',
  'Carlos Mendoza',
  'Yuki Tanaka',
  'David Okonkwo',
  'Anna Kowalski',
  "James O'Brien",
  'Fatima Al-Rashidi',
  'Luca Ferretti',
  'Sarah Mitchell',
  'Henrik Sorensen',
];

/**
 * Deterministically assign a workforce member to a task.
 * Given the same tailNumber + taskId, always returns the same name.
 */
export function assignWorker(tailNumber: string, taskId: string): string {
  const key = tailNumber + taskId;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return DEMO_WORKFORCE[hash % DEMO_WORKFORCE.length];
}

/**
 * Maintenance rescheduling demo triggers.
 * Maps tail number → date string ("YYYY-MM-DD") on which a simulated
 * maintenance reschedule event fires for that aircraft in the Gantt.
 * Update these dates when refreshing the demo scenario.
 */
export const DEMO_MAINTENANCE_RESCHEDULE_TRIGGERS: Record<string, string> = {
  'ZZ153': '2025-09-08',
  'ZZ165': '2025-09-09',
  'ZZ190': '2025-09-10',
  'ZZ175': '2025-09-11',
  'ZZ145': '2025-09-12',
};
