/**
 * A400 Bridge — fetches and normalises data from the a400-webapp Express backend.
 *
 * The a400-webapp runs on port 3000 (configurable via A400_API_URL env var).
 * This module is used server-side only (Next.js API routes and server components).
 */

const A400_API_URL = process.env.A400_API_URL || 'http://localhost:3000';

/**
 * Formal mapping between COMPASS ZZ tail numbers and A400 fleet positions.
 * The A400 backend has 20 aircraft (A400-01 through A400-20).
 * COMPASS has 16 ZZ tail numbers. We map by fleet position index.
 */
export const TAIL_NUMBER_MAP: Record<string, number> = {
  'ZZ132': 0, 'ZZ153': 1, 'ZZ165': 2, 'ZZ190': 3,
  'ZZ175': 4, 'ZZ145': 5, 'ZZ198': 6, 'ZZ199': 7,
  'ZZ210': 8, 'ZZ134': 9, 'ZZ220': 10, 'ZZ240': 11,
  'ZZ230': 12, 'ZZ250': 13, 'ZZ156': 14, 'ZZ160': 15,
};

export function getA400IndexForTail(tailNumber: string): number {
  if (tailNumber in TAIL_NUMBER_MAP) return TAIL_NUMBER_MAP[tailNumber];
  const digits = tailNumber.replace(/\D/g, '');
  return (parseInt(digits, 10) || 0) % 20;
}

export interface A400Component {
  id: string;
  displayName: string;
  componentName: string;
  status: 'Good' | 'Warning' | 'Critical';
  maintenanceDue: string;
  priorityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  descriptionText: string;
  faultCode?: string;
}

export interface A400Aircraft {
  id: string;
  displayName: string;
  worstStatus: 'Good' | 'Warning' | 'Critical';
  components: A400Component[];
}

export interface A400SquadronSummary {
  totalFlights: number;
  flightsAllGood: number;
  flightsWithWarnings: number;
  flightsWithCritical: number;
  deployableCount: number;
  deployablePct: number;
  inServiceCount: number;
  perFlight: { id: string; displayName: string; worstStatus: string }[];
}

export interface FleetHealthData {
  summary: A400SquadronSummary;
  aircraft: A400Aircraft[];
  criticalComponents: Array<A400Component & { aircraftId: string; aircraftName: string }>;
  warningComponents: Array<A400Component & { aircraftId: string; aircraftName: string }>;
  fetchedAt: string;
}

/** Fetches the squadron summary from the a400-webapp backend. */
export async function fetchSquadronSummary(): Promise<A400SquadronSummary> {
  const res = await fetch(`${A400_API_URL}/api/squadron-summary`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`a400 squadron-summary ${res.status}`);
  return res.json();
}

/** Fetches all flights (with components) from the a400-webapp backend. */
export async function fetchAllFlights(): Promise<A400Aircraft[]> {
  const res = await fetch(`${A400_API_URL}/api/flights`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`a400 flights ${res.status}`);
  const data = await res.json();
  const flights: any[] = data.flights || data || [];
  return flights.map((f: any) => {
    const components: A400Component[] = (f.components || []).map((c: any) => ({
      id: c.id,
      displayName: c.displayName,
      componentName: c.componentName,
      status: c.status as 'Good' | 'Warning' | 'Critical',
      maintenanceDue: c.maintenanceDue,
      priorityLevel: c.priorityLevel as 'LOW' | 'MEDIUM' | 'HIGH',
      descriptionText: c.descriptionText || '',
      faultCode: c.faultCode,
    }));
    const statusRank = (s: string) => (s === 'Critical' ? 2 : s === 'Warning' ? 1 : 0);
    const worst = components.reduce((acc, c) => Math.max(acc, statusRank(c.status)), 0);
    return {
      id: f.id,
      displayName: f.displayName,
      worstStatus: worst === 2 ? 'Critical' : worst === 1 ? 'Warning' : ('Good' as 'Good' | 'Warning' | 'Critical'),
      components,
    };
  });
}

/**
 * Returns full fleet health snapshot including flattened lists of
 * critical and warning components across all aircraft.
 */
export async function fetchFleetHealth(): Promise<FleetHealthData> {
  const [summary, aircraft] = await Promise.all([
    fetchSquadronSummary(),
    fetchAllFlights(),
  ]);

  const criticalComponents: FleetHealthData['criticalComponents'] = [];
  const warningComponents: FleetHealthData['warningComponents'] = [];

  for (const a of aircraft) {
    for (const c of a.components) {
      const base = { ...c, aircraftId: a.id, aircraftName: a.displayName };
      if (c.status === 'Critical') criticalComponents.push(base);
      else if (c.status === 'Warning') warningComponents.push(base);
    }
  }

  return { summary, aircraft, criticalComponents, warningComponents, fetchedAt: new Date().toISOString() };
}

/**
 * Maps A400 component names to COMPASS parts inventory search terms.
 * Returns a list of keywords that should highlight parts in the repository.
 */
export function componentToPartsKeywords(componentName: string): string[] {
  const name = componentName.toLowerCase();
  const keywords: string[] = [componentName];

  if (name.includes('engine') || name.includes('turboprop')) {
    keywords.push('engine', 'turboprop', 'propeller', 'fuel filter', 'oil filter');
  }
  if (name.includes('aileron') || name.includes('actuator')) {
    keywords.push('actuator', 'aileron', 'control surface', 'hydraulic actuator');
  }
  if (name.includes('landing gear') || name.includes('gear')) {
    keywords.push('landing gear', 'hydraulic', 'gear strut', 'tire', 'wheel');
  }
  if (name.includes('canopy') || name.includes('seal')) {
    keywords.push('seal', 'canopy', 'gasket', 'pressure seal');
  }
  if (name.includes('rudder') || name.includes('stabilizer')) {
    keywords.push('rudder', 'stabilizer', 'hydraulic', 'actuator');
  }
  if (name.includes('avionics') || name.includes('telemetry')) {
    keywords.push('avionics', 'electronics', 'sensor', 'circuit board');
  }
  if (name.includes('hydraulic')) {
    keywords.push('hydraulic fluid', 'hydraulic pump', 'hydraulic line', 'hydraulic seal');
  }

  return [...new Set(keywords)];
}
