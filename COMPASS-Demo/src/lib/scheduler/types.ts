// =============================================================================
// COMPASS Scheduling Engine — Type Definitions
// =============================================================================
// All types used by the scheduling engine, data loader, and Gantt adapter.
// The engine treats the data-access layer as a replaceable component: these
// types are the contract between the data source (currently Excel, future DB)
// and the scheduling logic.
// =============================================================================

// -----------------------------------------------------------------------------
// Raw types — direct output from the data source, before imputation
// -----------------------------------------------------------------------------

export type IntervalType = 'Hours' | 'Days' | 'Landings';
export type MaintTypeRaw = 'Planned Maintenance' | 'In-Depth Maintenance';

/** A single maintenance task row as parsed from the data source. */
export interface RawMaintTask {
  tailNumber: string;
  taskId: string;
  maintType: MaintTypeRaw;
  maintName: string;
  /** Estimated man-hours for this task. Must be > 0. */
  durationHours: number;
  crewCount: number;
  interval: number;
  intervalType: IntervalType;
  /** Null when not provided — will be imputed by the engine. */
  lastCompletedDate: Date | null;
  /** Short description of the work involved (from Excel). */
  taskDetails: string;
  /** Trade responsible for this task (e.g. Mechanical, Avionics). */
  trade: string;
}

/** Aircraft hours/landings row as parsed from the data source. */
export interface RawTailStatus {
  tailNumber: string;
  /** Null when not provided — will be imputed by the engine. */
  currentHours: number | null;
  /** Null when not provided — will be imputed by the engine. */
  currentLandings: number | null;
}

/** A single flight leg row as parsed from the data source. */
export interface RawFlightLeg {
  flightNumber: number;
  legNumber: number;
  origin: string;
  destination: string;
  /** Date portion only (time is in departureTime). */
  departureDate: Date;
  departureTime: string; // "HH:MM"
  /** Date portion only (time is in arrivalTime). */
  arrivalDate: Date;
  arrivalTime: string; // "HH:MM"
}

/** All raw data from the data source, as returned by the data loader. */
export interface RawScheduleData {
  maintTasks: RawMaintTask[];
  tailStatuses: RawTailStatus[];
  flightLegs: RawFlightLeg[];
}

// -----------------------------------------------------------------------------
// Imputed types — after deterministic value generation has been applied
// -----------------------------------------------------------------------------

/** A maintenance task with all blank values filled via deterministic imputation. */
export interface MaintTask {
  tailNumber: string;
  taskId: string;
  maintType: MaintTypeRaw;
  maintName: string;
  durationHours: number;
  crewCount: number;
  interval: number;
  intervalType: IntervalType;
  lastCompletedDate: Date;
  /** Hours at last completion (used for HOURS-based due tracking). */
  impliedLastCompletedHours: number;
  /** Landings at last completion (used for LANDINGS-based due tracking). */
  impliedLastCompletedLandings: number;
  taskDetails: string;
  trade: string;
}

/** Tail status with all blank values filled via deterministic imputation. */
export interface TailStatus {
  tailNumber: string;
  currentHours: number;
  currentLandings: number;
}

/** A single flight leg with departure and arrival as combined Date objects (UTC). */
export interface FlightLeg {
  flightNumber: number;
  legNumber: number;
  origin: string;
  destination: string;
  /** Full ISO timestamp: date + time combined. */
  departure: Date;
  /** Full ISO timestamp: date + time combined. */
  arrival: Date;
}

/**
 * A trip is all legs sharing the same flightNumber.
 * Trips must stay on the same tail and maintenance cannot be inserted between legs.
 */
export interface Trip {
  tripId: number;
  legs: FlightLeg[];
  earliestDeparture: Date;
  latestArrival: Date;
}

// -----------------------------------------------------------------------------
// Engine output — schedule blocks
// -----------------------------------------------------------------------------

/** A scheduled maintenance block on a tail. */
export interface MaintenanceBlock {
  tailNumber: string;
  blockId: string;
  startDateTime: Date;
  endDateTime: Date;
  durationHours: number;
  includedTasks: string[];
  maintTypes: MaintTypeRaw[];
}

/** A scheduled flight block on a tail. */
export interface FlightBlock {
  tailNumber: string;
  tripId: number;
  legs: FlightLeg[];
  start: Date;
  end: Date;
}

/** A unified schedule block as output by the engine (Gantt-ready). */
export interface ScheduleBlock {
  tailNumber: string;
  type: 'MAINT' | 'FLIGHT';
  blockId: string;
  start: Date;
  end: Date;
  durationHours: number;
  /** Task IDs included (MAINT blocks only). */
  tasks?: string[];
  /** Maintenance types present (MAINT blocks only). */
  maintTypes?: MaintTypeRaw[];
  /** Legs in this trip (FLIGHT blocks only). */
  legs?: FlightLeg[];
  /** Trip ID (FLIGHT blocks only). */
  tripId?: number;
}

/** Full output from the scheduling engine. */
export interface ScheduleOutput {
  scheduledBlocks: ScheduleBlock[];
  unscheduled: Array<{
    flightNumber: number;
    reason: string;
    /** UTC departure time of the first leg. */
    departure: Date;
    /** UTC arrival time of the last leg. */
    arrival: Date;
    /** All legs in this trip, for route display. */
    legs: FlightLeg[];
  }>;
  tailState: Array<{ tailNumber: string; finalHours: number; finalLandings: number }>;
  /**
   * Lookup map for task details, keyed by `${tailNumber}-${taskId}`.
   * Used by toGanttFormat() to enrich GanttMaintenanceItem.tasks.
   */
  maintTaskLookup: Map<string, MaintTask>;
}

// -----------------------------------------------------------------------------
// Gantt unscheduled adapter type — serialisable form for the UI
// -----------------------------------------------------------------------------

/** An unscheduled flight as output by toUnscheduledFormat(), ready for the UI. */
export interface GanttUnscheduledFlight {
  flightNumber: number;
  /** Human-readable reason (first 3 blocking tails). */
  reason: string;
  /** "YYYY-MM-DD HH:MM" UTC */
  departure: string;
  /** "YYYY-MM-DD HH:MM" UTC */
  arrival: string;
  /** Legs in serialisable form, for route display and hover popup. */
  legs: GanttRouteLeg[];
}

// -----------------------------------------------------------------------------
// Gantt adapter types — match the existing Aircraft[] interface consumed by UI
// -----------------------------------------------------------------------------

/** A single route leg as expected by the Gantt component. */
export interface GanttRouteLeg {
  flightNumber?: number;
  from: string;
  to: string;
  departureDate: string;   // "YYYY-MM-DD"
  departureTime: string;   // "HH:MM"
  arrivalDate: string;     // "YYYY-MM-DD"
  arrivalTime: string;     // "HH:MM"
}

/** A single task within a maintenance block, as passed to the popup. */
export interface GanttMaintenanceTask {
  taskId: string;
  taskName: string;
  taskDetails: string;
  trade: string;
  durationHours: number;
  crewCount: number;
  /** Deterministically assigned person from the demo workforce list. */
  assignedPerson: string;
}

/**
 * A maintenance item as expected by the Gantt component.
 * Note: type uses shorthand values ('Planned' | 'In-Depth'), not the full
 * Excel values ('Planned Maintenance' | 'In-Depth Maintenance').
 */
export interface GanttMaintenanceItem {
  id: string;
  type: 'Planned' | 'In-Depth';
  scheduleStartDate: string;  // "YYYY-MM-DD"
  scheduleEndDate: string;    // "YYYY-MM-DD"
  scheduleStartTime: string;  // "HH:MM"
  scheduleEndTime: string;    // "HH:MM"
  /** Total block duration in hours. */
  durationHours: number;
  /** Individual tasks included in this block. */
  tasks: GanttMaintenanceTask[];
}

/** An aircraft record as expected by the Gantt component and FleetOverview. */
export interface GanttAircraft {
  tailNumber: string;
  /** Computed dynamically at runtime by getDynamicStatusForAircraft(). */
  status: string;
  /** Outer array = separate trips; inner array = legs of that trip. */
  routes: GanttRouteLeg[][];
  maintenance: GanttMaintenanceItem[];
  /** Current flight hours at the start of the schedule horizon. */
  currentHours: number;
}

// -----------------------------------------------------------------------------
// Data provider interface — allows the data-access layer to be swapped
// -----------------------------------------------------------------------------

/**
 * A DataProvider is the abstraction between the scheduling engine and the
 * data source. The current implementation reads from Excel; a future DB-backed
 * implementation must satisfy the same interface without any engine changes.
 */
export interface DataProvider {
  load(): Promise<RawScheduleData>;
}

// -----------------------------------------------------------------------------
// Serialised raw data — for passing base dataset across the server/client boundary
// -----------------------------------------------------------------------------
// NOTE (DEMO): Next.js serialises RSC props via JSON.stringify, which converts
// Date objects to ISO strings. These serialised types are used to safely pass
// the raw schedule dataset from page.tsx (server) to LandingClient (client).
// The client deserialises back to Date objects before constructing
// InMemoryDataProvider. In a future DB-backed implementation this boundary
// would not exist — data would be fetched client-side directly from the API.
// -----------------------------------------------------------------------------

/** `RawFlightLeg` with Date fields serialised to ISO strings for RSC prop passing. */
export interface SerializedRawFlightLeg {
  flightNumber: number;
  legNumber: number;
  origin: string;
  destination: string;
  departureDate: string; // ISO string — deserialise with new Date()
  departureTime: string;
  arrivalDate: string;   // ISO string — deserialise with new Date()
  arrivalTime: string;
}

/** `RawMaintTask` with Date fields serialised to ISO strings for RSC prop passing. */
export interface SerializedRawMaintTask {
  tailNumber: string;
  taskId: string;
  maintType: MaintTypeRaw;
  maintName: string;
  durationHours: number;
  crewCount: number;
  interval: number;
  intervalType: IntervalType;
  lastCompletedDate: string | null; // ISO string or null — deserialise with new Date()
  taskDetails: string;
  trade: string;
}

/** Full serialised dataset for passing from server to client as RSC props. */
export interface SerializedRawScheduleData {
  flightLegs: SerializedRawFlightLeg[];
  maintTasks: SerializedRawMaintTask[];
  tailStatuses: RawTailStatus[]; // No Date fields — safe to pass as-is
}

/** Serialise RawScheduleData for safe JSON prop passing across the RSC boundary. */
export function serializeRawScheduleData(data: RawScheduleData): SerializedRawScheduleData {
  return {
    flightLegs: data.flightLegs.map(leg => ({
      ...leg,
      departureDate: leg.departureDate.toISOString(),
      arrivalDate: leg.arrivalDate.toISOString(),
    })),
    maintTasks: data.maintTasks.map(task => ({
      ...task,
      lastCompletedDate: task.lastCompletedDate?.toISOString() ?? null,
    })),
    tailStatuses: data.tailStatuses,
  };
}

/** Deserialise back to RawScheduleData with proper Date objects on the client. */
export function deserializeRawScheduleData(data: SerializedRawScheduleData): RawScheduleData {
  return {
    flightLegs: data.flightLegs.map(leg => ({
      ...leg,
      departureDate: new Date(leg.departureDate),
      arrivalDate: new Date(leg.arrivalDate),
    })),
    maintTasks: data.maintTasks.map(task => ({
      ...task,
      lastCompletedDate: task.lastCompletedDate ? new Date(task.lastCompletedDate) : null,
    })),
    tailStatuses: data.tailStatuses,
  };
}
