import {
  AircraftLandingsRecord,
  AircraftMetricRecord,
  ExistingAircraftSchedule,
  FlightDemand,
  MaintenanceIntervalType,
  MaintenanceTask,
  RouteLeg,
} from "./types";
import {
  calculateEstimatedDays,
  calculateEstimatedHours,
  getRouteEnd,
  getRouteStart,
} from "./time";

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeMaintenanceTaskRow(
  row: Record<string, string | number | null | undefined>,
  index: number,
): MaintenanceTask | null {
  const tailNumber = String(row["Tail Number"] ?? "").trim();
  const taskCode = String(row["Task"] ?? "").trim();
  const intervalTypeValue = String(row["Interval Type"] ?? "").trim();

  if (!tailNumber || !taskCode || !intervalTypeValue) {
    return null;
  }

  const intervalType = intervalTypeValue as MaintenanceIntervalType;
  if (!["Days", "Hours", "Landings"].includes(intervalType)) {
    return null;
  }

  return {
    id: `${tailNumber}-${taskCode}-${index}`,
    tailNumber,
    taskCode,
    maintenanceType: String(row["Maint Type"] ?? "Planned Maintenance").trim(),
    maintenanceName: String(row["Maint Name"] ?? taskCode).trim(),
    estimatedDurationHours: Math.max(toNumber(row["Estimate Duration (Man-Hours)"]), 0.5),
    estimatedPeople: Math.max(toNumber(row["Estimate no of people"]), 1),
    interval: Math.max(toNumber(row["Interval"]), 0),
    intervalType,
    lastCompletedRaw: row["Last Completed"] ?? null,
    dueAtRaw: row["Due at"] ?? null,
  };
}

export function normalizeHoursRow(
  row: Record<string, string | number | null | undefined>,
): AircraftMetricRecord | null {
  const tailNumber = String(row["Tail Number"] ?? "").trim();
  if (!tailNumber) {
    return null;
  }

  return {
    tailNumber,
    currentHours: toNumber(row["Current Hours"]),
  };
}

export function normalizeLandingsRow(
  row: Record<string, string | number | null | undefined>,
): AircraftLandingsRecord | null {
  const tailNumber = String(row["Tail Number"] ?? "").trim();
  if (!tailNumber) {
    return null;
  }

  return {
    tailNumber,
    currentLandings: toNumber(row["Current Landings"]),
  };
}

export function createFlightDemandFromRoute(
  route: RouteLeg[],
  seed: { id: string; flightNumber?: string; category?: string },
): FlightDemand {
  const start = getRouteStart(route);
  const end = getRouteEnd(route);

  return {
    id: seed.id,
    flightNumber: seed.flightNumber ?? seed.id.toUpperCase(),
    category: seed.category ?? "Cargo",
    route,
    estimatedHours: calculateEstimatedHours(route),
    estimatedDays: calculateEstimatedDays(route),
    requestedStart: start.toISOString(),
    requestedEnd: end.toISOString(),
  };
}

export function createFlightDemandsFromSchedule(
  scheduleData: ExistingAircraftSchedule[],
): FlightDemand[] {
  const demands: FlightDemand[] = [];
  let counter = 1;

  scheduleData.forEach((aircraft) => {
    aircraft.routes.forEach((route) => {
      if (!route || route.length === 0) {
        return;
      }

      demands.push(
        createFlightDemandFromRoute(route, {
          id: `flight-demand-${counter}`,
          flightNumber: `${aircraft.tailNumber}-${counter}`,
        }),
      );
      counter += 1;
    });
  });

  return demands.sort((a, b) => a.requestedStart.localeCompare(b.requestedStart));
}

export function buildTailNumberSet(args: {
  maintenanceTasks: MaintenanceTask[];
  hours: AircraftMetricRecord[];
  landings: AircraftLandingsRecord[];
  existingSchedule: ExistingAircraftSchedule[];
}): string[] {
  const tailNumbers = new Set<string>();

  args.maintenanceTasks.forEach((task) => tailNumbers.add(task.tailNumber));
  args.hours.forEach((record) => tailNumbers.add(record.tailNumber));
  args.landings.forEach((record) => tailNumbers.add(record.tailNumber));
  args.existingSchedule.forEach((record) => tailNumbers.add(record.tailNumber));

  return [...tailNumbers].sort();
}
