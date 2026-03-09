import { describe, expect, it } from "vitest";

import { buildSchedule, createFlightDemandFromRoute, MaintenanceTask } from "./index";

function makeRoute(
  departureDate: string,
  departureTime: string,
  arrivalDate: string,
  arrivalTime: string,
  via: { from?: string; to?: string } = {},
) {
  return [
    {
      from: via.from ?? "LHR",
      to: via.to ?? "FRA",
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
    },
  ];
}

function makeDemand(
  id: string,
  flightNumber: string,
  route: ReturnType<typeof makeRoute>,
) {
  return createFlightDemandFromRoute(route, {
    id,
    flightNumber,
    category: "Cargo",
  });
}

function makeTask(overrides: Partial<MaintenanceTask>): MaintenanceTask {
  return {
    id: "task-1",
    tailNumber: "ZZ132",
    taskCode: "Task 1",
    maintenanceType: "Planned Maintenance",
    maintenanceName: "Inspection",
    estimatedDurationHours: 6,
    estimatedPeople: 3,
    interval: 50,
    intervalType: "Hours",
    lastCompletedRaw: null,
    dueAtRaw: null,
    ...overrides,
  };
}

describe("buildSchedule", () => {
  it("groups due maintenance by type before assigning flights", () => {
    const result = buildSchedule({
      tailNumbers: ["ZZ132"],
      maintenanceTasks: [
        makeTask({ id: "t1", taskCode: "Task 1", maintenanceName: "Slat Inspection" }),
        makeTask({ id: "t2", taskCode: "Task 2", maintenanceName: "Flap Inspection" }),
        makeTask({
          id: "t3",
          taskCode: "Task 3",
          maintenanceType: "In-Depth Maintenance",
          maintenanceName: "A Check",
          intervalType: "Landings",
        }),
      ],
      aircraftHours: [{ tailNumber: "ZZ132", currentHours: 100 }],
      aircraftLandings: [{ tailNumber: "ZZ132", currentLandings: 300 }],
      flightDemands: [
        makeDemand(
          "flight-1",
          "FL-1",
          makeRoute("2026-03-12", "12:00", "2026-03-12", "15:00"),
        ),
      ],
      scheduleStart: new Date("2026-03-12T00:00:00"),
    });

    expect(result.aircraft[0].maintenance).toHaveLength(2);
    expect(result.aircraft[0].maintenance[0].taskNames).toEqual([
      "Slat Inspection",
      "Flap Inspection",
    ]);
    expect(result.aircraft[0].maintenance[1].type).toBe("In-Depth");
  });

  it("assigns flights to the first available aircraft with the lowest hours", () => {
    const result = buildSchedule({
      tailNumbers: ["ZZ132", "ZZ153"],
      maintenanceTasks: [],
      aircraftHours: [
        { tailNumber: "ZZ132", currentHours: 25 },
        { tailNumber: "ZZ153", currentHours: 10 },
      ],
      aircraftLandings: [
        { tailNumber: "ZZ132", currentLandings: 10 },
        { tailNumber: "ZZ153", currentLandings: 10 },
      ],
      flightDemands: [
        makeDemand(
          "flight-1",
          "FL-1",
          makeRoute("2026-03-12", "09:00", "2026-03-12", "12:00"),
        ),
      ],
      scheduleStart: new Date("2026-03-12T00:00:00"),
    });

    expect(result.aircraft.find((aircraft) => aircraft.tailNumber === "ZZ153")?.routes).toHaveLength(1);
    expect(result.aircraft.find((aircraft) => aircraft.tailNumber === "ZZ132")?.routes).toHaveLength(0);
  });

  it("rejects flights when the 4-hour gap rule cannot be met", () => {
    const result = buildSchedule({
      tailNumbers: ["ZZ132"],
      maintenanceTasks: [],
      aircraftHours: [{ tailNumber: "ZZ132", currentHours: 10 }],
      aircraftLandings: [{ tailNumber: "ZZ132", currentLandings: 10 }],
      flightDemands: [
        makeDemand(
          "flight-1",
          "FL-1",
          makeRoute("2026-03-12", "08:00", "2026-03-12", "10:00"),
        ),
        makeDemand(
          "flight-2",
          "FL-2",
          makeRoute("2026-03-12", "12:30", "2026-03-12", "14:00"),
        ),
      ],
      scheduleStart: new Date("2026-03-12T00:00:00"),
    });

    expect(result.aircraft[0].routes).toHaveLength(1);
    expect(result.unscheduledFlights).toHaveLength(1);
    expect(result.unscheduledFlights[0].reason).toContain("4 hours");
  });

  it("does not schedule flights over maintenance", () => {
    const result = buildSchedule({
      tailNumbers: ["ZZ132"],
      maintenanceTasks: [
        makeTask({
          id: "t1",
          estimatedDurationHours: 12,
          estimatedPeople: 1,
        }),
      ],
      aircraftHours: [{ tailNumber: "ZZ132", currentHours: 100 }],
      aircraftLandings: [{ tailNumber: "ZZ132", currentLandings: 50 }],
      flightDemands: [
        makeDemand(
          "flight-1",
          "FL-1",
          makeRoute("2026-03-12", "08:00", "2026-03-12", "10:00"),
        ),
      ],
      scheduleStart: new Date("2026-03-12T00:00:00"),
    });

    expect(result.aircraft[0].maintenance).toHaveLength(1);
    expect(result.aircraft[0].routes).toHaveLength(0);
    expect(result.unscheduledFlights).toHaveLength(1);
  });

  it("triggers landing-based maintenance after flights increase landing counts", () => {
    const result = buildSchedule({
      tailNumbers: ["ZZ132"],
      maintenanceTasks: [
        makeTask({
          id: "landing-task",
          maintenanceType: "In-Depth Maintenance",
          intervalType: "Landings",
          interval: 2,
          lastCompletedRaw: 0,
        }),
      ],
      aircraftHours: [{ tailNumber: "ZZ132", currentHours: 10 }],
      aircraftLandings: [{ tailNumber: "ZZ132", currentLandings: 0 }],
      flightDemands: [
        makeDemand(
          "flight-1",
          "FL-1",
          [
            {
              from: "LHR",
              to: "FRA",
              departureDate: "2026-03-12",
              departureTime: "08:00",
              arrivalDate: "2026-03-12",
              arrivalTime: "10:00",
            },
            {
              from: "FRA",
              to: "LHR",
              departureDate: "2026-03-12",
              departureTime: "15:00",
              arrivalDate: "2026-03-12",
              arrivalTime: "17:00",
            },
          ],
        ),
        makeDemand(
          "flight-2",
          "FL-2",
          makeRoute("2026-03-13", "12:00", "2026-03-13", "14:00"),
        ),
      ],
      scheduleStart: new Date("2026-03-12T00:00:00"),
    });

    expect(result.aircraft[0].routes).toHaveLength(2);
    expect(result.aircraft[0].maintenance).toHaveLength(1);
    expect(result.aircraft[0].maintenance[0].type).toBe("In-Depth");
  });
});
