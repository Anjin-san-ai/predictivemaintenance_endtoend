import {
  AircraftLandingsRecord,
  AircraftMetricRecord,
  FlightDemand,
  MaintenanceBlock,
  MaintenanceTask,
  ScheduledBlock,
  ScheduledFlightBlock,
  ScheduledMaintenanceBlock,
  SchedulerAircraft,
  SchedulerResult,
  UnscheduledFlight,
} from "./types";
import {
  MINIMUM_FLIGHT_GAP_HOURS,
  addDays,
  addHours,
  formatDate,
  formatTime,
  getRouteEnd,
  getRouteStart,
  normalizeMaintenanceType,
  overlaps,
  parseDateTime,
} from "./time";

type TaskRuntimeState = {
  task: MaintenanceTask;
  lastCompletedDate?: string;
  lastCompletedMetric?: number;
  dueDate?: string;
  dueMetric?: number;
};

type AircraftRuntimeState = {
  tailNumber: string;
  currentHours: number;
  currentLandings: number;
  routes: FlightDemand["route"][];
  maintenance: MaintenanceBlock[];
  blocks: ScheduledBlock[];
  tasks: TaskRuntimeState[];
  maintenanceCounter: number;
};

export interface BuildSchedulerArgs {
  tailNumbers: string[];
  maintenanceTasks: MaintenanceTask[];
  aircraftHours: AircraftMetricRecord[];
  aircraftLandings: AircraftLandingsRecord[];
  flightDemands: FlightDemand[];
  scheduleStart?: Date;
}

function toNumber(value: string | number | null | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function toDateString(value: string | number | null | undefined): string | undefined {
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return formatDate(parsed);
    }
  }

  return undefined;
}

function createTaskRuntimeState(task: MaintenanceTask): TaskRuntimeState {
  const dueMetric = toNumber(task.dueAtRaw);
  const lastCompletedMetric = toNumber(task.lastCompletedRaw);
  const dueDate = toDateString(task.dueAtRaw);
  const lastCompletedDate = toDateString(task.lastCompletedRaw);

  if (task.intervalType === "Days") {
    const resolvedDueDate =
      dueDate ??
      (lastCompletedDate
        ? formatDate(addDays(parseDateTime(lastCompletedDate, "00:00"), task.interval))
        : undefined);

    return {
      task,
      lastCompletedDate,
      dueDate: resolvedDueDate,
    };
  }

  const resolvedDueMetric =
    dueMetric ??
    (typeof lastCompletedMetric === "number"
      ? lastCompletedMetric + task.interval
      : undefined);

  return {
    task,
    lastCompletedMetric,
    dueMetric: resolvedDueMetric,
  };
}

function getCurrentMetric(
  aircraft: AircraftRuntimeState,
  intervalType: MaintenanceTask["intervalType"],
): number {
  return intervalType === "Landings" ? aircraft.currentLandings : aircraft.currentHours;
}

function isTaskDue(
  taskState: TaskRuntimeState,
  aircraft: AircraftRuntimeState,
  upTo: Date,
): boolean {
  if (taskState.task.intervalType === "Days") {
    if (!taskState.dueDate) {
      return true;
    }
    return parseDateTime(taskState.dueDate, "00:00") <= upTo;
  }

  if (typeof taskState.dueMetric !== "number") {
    return true;
  }

  return getCurrentMetric(aircraft, taskState.task.intervalType) >= taskState.dueMetric;
}

function getBlockEnd(block: ScheduledBlock): Date {
  return block.end;
}

function getLastBlockEnd(aircraft: AircraftRuntimeState, fallback: Date): Date {
  if (aircraft.blocks.length === 0) {
    return fallback;
  }

  const lastBlock = aircraft.blocks.reduce((latest, candidate) =>
    getBlockEnd(candidate) > getBlockEnd(latest) ? candidate : latest,
  );
  return new Date(lastBlock.end);
}

function scheduleMaintenanceUpTo(
  aircraft: AircraftRuntimeState,
  upTo: Date,
  scheduleStart: Date,
): void {
  let hasDueTasks = true;

  while (hasDueTasks) {
    const dueTasks = aircraft.tasks.filter((taskState) => isTaskDue(taskState, aircraft, upTo));
    hasDueTasks = dueTasks.length > 0;

    if (!hasDueTasks) {
      break;
    }

    const tasksByType = new Map<string, TaskRuntimeState[]>();
    dueTasks.forEach((taskState) => {
      const key = normalizeMaintenanceType(taskState.task.maintenanceType);
      const existing = tasksByType.get(key) ?? [];
      existing.push(taskState);
      tasksByType.set(key, existing);
    });

    for (const [maintenanceType, groupedTasks] of tasksByType.entries()) {
      const start = getLastBlockEnd(aircraft, scheduleStart);
      const durationHours = Math.max(
        groupedTasks.reduce(
          (total, taskState) =>
            total +
            taskState.task.estimatedDurationHours /
              Math.max(taskState.task.estimatedPeople, 1),
          0,
        ),
        1,
      );
      const end = addHours(start, durationHours);

      const block: ScheduledMaintenanceBlock = {
        id: `${aircraft.tailNumber}-maint-${aircraft.maintenanceCounter}`,
        type: "maintenance",
        start,
        end,
        maintenanceType,
        taskIds: groupedTasks.map((taskState) => taskState.task.id),
        taskCodes: groupedTasks.map((taskState) => taskState.task.taskCode),
        taskNames: groupedTasks.map((taskState) => taskState.task.maintenanceName),
      };

      aircraft.maintenanceCounter += 1;
      aircraft.blocks.push(block);
      aircraft.maintenance.push({
        id: block.id,
        type: maintenanceType,
        scheduleStartDate: formatDate(start),
        scheduleEndDate: formatDate(end),
        scheduleStartTime: formatTime(start),
        scheduleEndTime: formatTime(end),
        taskIds: block.taskIds,
        taskCodes: block.taskCodes,
        taskNames: block.taskNames,
      });

      groupedTasks.forEach((taskState) => {
        if (taskState.task.intervalType === "Days") {
          taskState.lastCompletedDate = formatDate(end);
          taskState.dueDate = formatDate(
            addDays(parseDateTime(taskState.lastCompletedDate, "00:00"), taskState.task.interval),
          );
          return;
        }

        const completionMetric = getCurrentMetric(aircraft, taskState.task.intervalType);
        taskState.lastCompletedMetric = completionMetric;
        taskState.dueMetric = completionMetric + taskState.task.interval;
      });
    }
  }
}

function hasOverlapWithBlocks(
  aircraft: AircraftRuntimeState,
  flightStart: Date,
  flightEnd: Date,
): boolean {
  return aircraft.blocks.some((block) =>
    overlaps(flightStart, flightEnd, block.start, block.end),
  );
}

function hasRequiredFlightGap(
  aircraft: AircraftRuntimeState,
  flightStart: Date,
  flightEnd: Date,
): boolean {
  return aircraft.blocks
    .filter((block): block is ScheduledFlightBlock => block.type === "flight")
    .every((block) => {
      const gapBefore = (flightStart.getTime() - block.end.getTime()) / (1000 * 60 * 60);
      const gapAfter = (block.start.getTime() - flightEnd.getTime()) / (1000 * 60 * 60);
      return gapBefore >= MINIMUM_FLIGHT_GAP_HOURS || gapAfter >= MINIMUM_FLIGHT_GAP_HOURS;
    });
}

function createRuntimeState(args: BuildSchedulerArgs): AircraftRuntimeState[] {
  const hoursMap = new Map(args.aircraftHours.map((row) => [row.tailNumber, row.currentHours]));
  const landingsMap = new Map(
    args.aircraftLandings.map((row) => [row.tailNumber, row.currentLandings]),
  );
  const tasksByTail = new Map<string, MaintenanceTask[]>();

  args.maintenanceTasks.forEach((task) => {
    const tasks = tasksByTail.get(task.tailNumber) ?? [];
    tasks.push(task);
    tasksByTail.set(task.tailNumber, tasks);
  });

  return args.tailNumbers.map((tailNumber) => ({
    tailNumber,
    currentHours: hoursMap.get(tailNumber) ?? 0,
    currentLandings: landingsMap.get(tailNumber) ?? 0,
    routes: [],
    maintenance: [],
    blocks: [],
    tasks: (tasksByTail.get(tailNumber) ?? []).map(createTaskRuntimeState),
    maintenanceCounter: 1,
  }));
}

function buildStatus(aircraft: SchedulerAircraft): SchedulerAircraft["status"] {
  if (aircraft.routes.length > 0) {
    return "In flight";
  }
  if (aircraft.maintenance.some((item) => item.type === "In-Depth")) {
    return "Depth maintenance";
  }
  if (aircraft.maintenance.length > 0) {
    return "In-maintenance";
  }
  return "Serviceable";
}

export function buildSchedule(args: BuildSchedulerArgs): SchedulerResult {
  const scheduleStart = args.scheduleStart ?? new Date();
  const aircraftStates = createRuntimeState(args);
  const unscheduledFlights: UnscheduledFlight[] = [];
  const sortedFlights = [...args.flightDemands].sort((a, b) =>
    a.requestedStart.localeCompare(b.requestedStart),
  );

  aircraftStates.forEach((aircraft) => {
    scheduleMaintenanceUpTo(aircraft, scheduleStart, scheduleStart);
  });

  sortedFlights.forEach((flight) => {
    const flightStart = getRouteStart(flight.route);
    const flightEnd = getRouteEnd(flight.route);
    const candidates = [...aircraftStates].sort(
      (left, right) => left.currentHours - right.currentHours,
    );

    let assigned = false;
    let failureReason = "No aircraft available";

    for (const aircraft of candidates) {
      scheduleMaintenanceUpTo(aircraft, flightStart, scheduleStart);

      if (hasOverlapWithBlocks(aircraft, flightStart, flightEnd)) {
        failureReason = "Conflicts with an existing maintenance or flight block";
        continue;
      }

      if (!hasRequiredFlightGap(aircraft, flightStart, flightEnd)) {
        failureReason = "Requires at least 4 hours between flights on the same aircraft";
        continue;
      }

      const block: ScheduledFlightBlock = {
        id: flight.id,
        type: "flight",
        start: flightStart,
        end: flightEnd,
        flight,
      };

      aircraft.blocks.push(block);
      aircraft.routes.push(flight.route);
      aircraft.currentHours = Number((aircraft.currentHours + flight.estimatedHours).toFixed(2));
      aircraft.currentLandings += Math.max(flight.route.length, 1);
      assigned = true;
      break;
    }

    if (!assigned) {
      unscheduledFlights.push({
        flight,
        reason: failureReason,
      });
    }
  });

  const aircraft: SchedulerAircraft[] = aircraftStates
    .map((aircraftState) => {
      const entry: SchedulerAircraft = {
        tailNumber: aircraftState.tailNumber,
        status: "Serviceable",
        routes: aircraftState.routes.sort(
          (left, right) => getRouteStart(left).getTime() - getRouteStart(right).getTime(),
        ),
        maintenance: aircraftState.maintenance.sort(
          (left, right) =>
            parseDateTime(left.scheduleStartDate, left.scheduleStartTime).getTime() -
            parseDateTime(right.scheduleStartDate, right.scheduleStartTime).getTime(),
        ),
        currentHours: aircraftState.currentHours,
        currentLandings: aircraftState.currentLandings,
      };

      entry.status = buildStatus(entry);
      return entry;
    })
    .sort((left, right) => left.tailNumber.localeCompare(right.tailNumber));

  return {
    aircraft,
    unscheduledFlights,
  };
}
