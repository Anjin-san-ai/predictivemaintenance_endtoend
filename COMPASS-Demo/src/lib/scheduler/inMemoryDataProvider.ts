// =============================================================================
// COMPASS Scheduling Engine — In-Memory Data Provider
// =============================================================================
// DEMO ONLY — This provider exists solely to support the interactive "Add Flight"
// demo workflow, where a new flight must be scheduled in-memory without writing
// to the Excel data source.
//
// How it works:
//   - Receives the base raw dataset (loaded from Excel at page.tsx SSR time)
//     and a set of new flight legs to append.
//   - load() returns the combined dataset in memory, leaving the Excel file
//     untouched.
//   - The result is held in React state and reset on page refresh.
//
// FUTURE: When a real database is in place, the "Add Flight" flow should
// persist the new legs via an API call instead of using this provider.
// This file can be removed once that transition is made.
// =============================================================================

import type { DataProvider, RawScheduleData, RawFlightLeg } from './types';

export class InMemoryDataProvider implements DataProvider {
  private readonly baseData: RawScheduleData;
  private readonly additionalLegs: RawFlightLeg[];

  constructor(baseData: RawScheduleData, additionalLegs: RawFlightLeg[]) {
    this.baseData = baseData;
    this.additionalLegs = additionalLegs;
  }

  async load(): Promise<RawScheduleData> {
    return {
      flightLegs: [...this.baseData.flightLegs, ...this.additionalLegs],
      maintTasks: this.baseData.maintTasks,
      tailStatuses: this.baseData.tailStatuses,
    };
  }
}

/**
 * Derive the next available flight number from the base dataset.
 * Finds the highest existing flight number and increments by 1.
 * Note: FN 9999 is reserved for the demo unschedulable flight (injected
 * post-engine in scheduleOrchestrator.ts) and will never appear in
 * baseData.flightLegs, so no collision is possible for normal datasets.
 */
export function nextFlightNumber(baseLegs: RawFlightLeg[]): number {
  if (baseLegs.length === 0) return 1;
  return Math.max(...baseLegs.map(l => l.flightNumber)) + 1;
}
