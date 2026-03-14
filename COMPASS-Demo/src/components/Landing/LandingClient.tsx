"use client";
import { useState, useRef } from "react";
import { Header } from "@/components";
import FleetOverview from "@/components/Landing/FleetOverview";
import FlightMaintenanceSchedule from "@/components/Landing/FlightMaintenanceSchedule";
import type {
  GanttAircraft,
  GanttUnscheduledFlight,
  SerializedRawScheduleData,
} from "@/lib/scheduler/types";

interface Props {
  initialData: GanttAircraft[];
  unscheduledFlights: GanttUnscheduledFlight[];
  // NOTE (DEMO): The raw schedule data is passed from the server so the client
  // can re-run the scheduler in-memory when a flight is added interactively.
  // See page.tsx for the full rationale. In a future DB-backed implementation
  // this prop should be removed and the client should fetch from an API instead.
  serializedRawData: SerializedRawScheduleData;
}

export default function LandingClient({
  initialData,
  unscheduledFlights: initialUnscheduledFlights,
  serializedRawData,
}: Readonly<Props>) {
  const [flightScheduleData, setFlightScheduleData] = useState<GanttAircraft[]>(
    () => JSON.parse(JSON.stringify(initialData)),
  );

  // Unscheduled flights is now state so it can be updated after a scheduler re-run.
  const [unscheduledFlights, setUnscheduledFlights] = useState<GanttUnscheduledFlight[]>(
    initialUnscheduledFlights,
  );

  // Hold the serialised raw data in a ref — it never changes after page load,
  // so it does not need to be state. The FlightMaintenanceSchedule component
  // reads it when constructing an InMemoryDataProvider for the scheduler re-run.
  const rawDataRef = useRef<SerializedRawScheduleData>(serializedRawData);

  // The Gantt component's local Aircraft type uses type: string for maintenance,
  // while GanttAircraft uses the narrower 'Planned' | 'In-Depth'. This wrapper
  // bridges that structural difference at the boundary.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSetFlightScheduleData = (data: any[]) => {
    setFlightScheduleData(data as GanttAircraft[]);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <Header />
      <div style={{ zoom: 0.8, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }} className="min-h-0">
        <FleetOverview flightScheduleData={flightScheduleData} />
        <div className="flex-1 min-h-0 flex flex-col">
          <FlightMaintenanceSchedule
            flightScheduleData={flightScheduleData}
            setFlightScheduleData={handleSetFlightScheduleData}
            initialFlightScheduleData={initialData}
            unscheduledFlights={unscheduledFlights}
            setUnscheduledFlights={setUnscheduledFlights}
            rawData={rawDataRef.current}
          />
        </div>
      </div>
    </div>
  );
}
