export interface RouteLeg {
  from: string;
  to: string;
  departureDate: string;
  arrivalDate: string;
  departureTime: string;
  arrivalTime: string;
}

export interface ExistingAircraftSchedule {
  tailNumber: string;
  status: string;
  routes: RouteLeg[][];
  maintenance: MaintenanceBlock[];
}

export interface FlightDemand {
  id: string;
  flightNumber: string;
  category: string;
  route: RouteLeg[];
  estimatedHours: number;
  estimatedDays: number;
  requestedStart: string;
  requestedEnd: string;
}

export type MaintenanceIntervalType = "Days" | "Hours" | "Landings";

export interface MaintenanceTask {
  id: string;
  tailNumber: string;
  taskCode: string;
  maintenanceType: string;
  maintenanceName: string;
  estimatedDurationHours: number;
  estimatedPeople: number;
  interval: number;
  intervalType: MaintenanceIntervalType;
  lastCompletedRaw?: string | number | null;
  dueAtRaw?: string | number | null;
}

export interface AircraftMetricRecord {
  tailNumber: string;
  currentHours: number;
}

export interface AircraftLandingsRecord {
  tailNumber: string;
  currentLandings: number;
}

export interface AircraftStateMetrics {
  tailNumber: string;
  currentHours: number;
  currentLandings: number;
}

export interface ScheduledFlightBlock {
  id: string;
  type: "flight";
  start: Date;
  end: Date;
  flight: FlightDemand;
}

export interface ScheduledMaintenanceBlock {
  id: string;
  type: "maintenance";
  start: Date;
  end: Date;
  maintenanceType: string;
  taskIds: string[];
  taskCodes: string[];
  taskNames: string[];
}

export type ScheduledBlock = ScheduledFlightBlock | ScheduledMaintenanceBlock;

export interface MaintenanceBlock {
  id: string;
  type: string;
  scheduleStartDate: string;
  scheduleEndDate: string;
  scheduleStartTime: string;
  scheduleEndTime: string;
  taskIds?: string[];
  taskCodes?: string[];
  taskNames?: string[];
}

export interface SchedulerAircraft {
  tailNumber: string;
  status: string;
  routes: RouteLeg[][];
  maintenance: MaintenanceBlock[];
  currentHours: number;
  currentLandings: number;
}

export interface UnscheduledFlight {
  flight: FlightDemand;
  reason: string;
}

export interface SchedulerResult {
  aircraft: SchedulerAircraft[];
  unscheduledFlights: UnscheduledFlight[];
}

export interface SchedulerInputs {
  maintenanceTasks: MaintenanceTask[];
  aircraftHours: AircraftMetricRecord[];
  aircraftLandings: AircraftLandingsRecord[];
  flightDemands: FlightDemand[];
}
