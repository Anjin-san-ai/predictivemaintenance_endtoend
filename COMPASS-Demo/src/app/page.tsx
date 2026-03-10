
"use client";
import { Header } from "@/components";

import FleetOverview from "@/components/Landing/FleetOverview";
import FlightMaintenanceSchedule from "@/components/Landing/FlightMaintenanceSchedule";
import { useState } from "react";
import { flightScheduleData as initialFlightScheduleData } from "../utils/aircraftUtils";

export default function LandingPage() {
  const [flightScheduleData, setFlightScheduleData] = useState(() => JSON.parse(JSON.stringify(initialFlightScheduleData)));
  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <Header />
      <FleetOverview flightScheduleData={flightScheduleData} />
      <FlightMaintenanceSchedule flightScheduleData={flightScheduleData} setFlightScheduleData={setFlightScheduleData} />
    </div>
  );
}
