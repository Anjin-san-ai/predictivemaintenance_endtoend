
"use client";

import { useEffect, useMemo, useState } from "react";

import { Header } from "@/components";
import FleetOverview from "@/components/Landing/FleetOverview";
import SchedulerInputsPanel from "@/components/Landing/SchedulerInputsPanel";
import RuleBasedFlightMaintenanceSchedule from "@/components/Landing/RuleBasedFlightMaintenanceSchedule";
import { flightScheduleData as existingScheduleData } from "@/utils/aircraftUtils";
import {
  AircraftLandingsRecord,
  AircraftMetricRecord,
  FlightDemand,
  MaintenanceTask,
  buildSchedule,
  buildTailNumberSet,
  createFlightDemandsFromSchedule,
} from "@/utils/scheduler";

const initialFlightDemand = createFlightDemandsFromSchedule(existingScheduleData);

export default function LandingPage() {
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [aircraftHours, setAircraftHours] = useState<AircraftMetricRecord[]>([]);
  const [aircraftLandings, setAircraftLandings] = useState<AircraftLandingsRecord[]>([]);
  const [flightDemands, setFlightDemands] = useState<FlightDemand[]>(initialFlightDemand);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/scheduler-inputs")
      .then((response) => response.json())
      .then((payload) => {
        if (!isMounted || payload.error) {
          return;
        }

        setMaintenanceTasks(payload.maintenanceTasks ?? []);
        setAircraftHours(payload.aircraftHours ?? []);
        setAircraftLandings(payload.aircraftLandings ?? []);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const tailNumbers = useMemo(
    () =>
      buildTailNumberSet({
        maintenanceTasks,
        hours: aircraftHours,
        landings: aircraftLandings,
        existingSchedule: existingScheduleData,
      }),
    [maintenanceTasks, aircraftHours, aircraftLandings],
  );

  const scheduleResult = useMemo(
    () =>
      buildSchedule({
        tailNumbers,
        maintenanceTasks,
        aircraftHours,
        aircraftLandings,
        flightDemands,
      }),
    [tailNumbers, maintenanceTasks, aircraftHours, aircraftLandings, flightDemands],
  );

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <Header />
      <FleetOverview flightScheduleData={scheduleResult.aircraft} />
      <SchedulerInputsPanel
        aircraftHours={aircraftHours}
        aircraftLandings={aircraftLandings}
        onLandingsChange={(tailNumber, value) => {
          setAircraftLandings((current) =>
            current.map((record) =>
              record.tailNumber === tailNumber
                ? { ...record, currentLandings: value }
                : record,
            ),
          );
        }}
        onResetFlights={() => setFlightDemands(initialFlightDemand)}
        totalFlightDemands={flightDemands.length}
      />
      <RuleBasedFlightMaintenanceSchedule
        flightScheduleData={scheduleResult.aircraft}
        unscheduledFlights={scheduleResult.unscheduledFlights}
        onAddFlightDemand={(flightDemand) =>
          setFlightDemands((current) =>
            [...current, flightDemand].sort((left, right) =>
              left.requestedStart.localeCompare(right.requestedStart),
            ),
          )
        }
      />
    </div>
  );
}
