export const dynamic = 'force-dynamic';

import { runScheduler, toGanttFormat, toUnscheduledFormat } from "../lib/scheduler/scheduleOrchestrator";
import { ExcelDataProvider } from "../lib/scheduler/dataLoader";
import { serializeRawScheduleData } from "../lib/scheduler/types";
import LandingClient from "../components/Landing/LandingClient";

export default async function LandingPage() {
  // NOTE (DEMO): The raw schedule data is loaded here at SSR time and passed
  // to LandingClient as serialised props so the client can re-run the scheduler
  // in-memory when a flight is added interactively (without a server round-trip).
  // Dates are serialised to ISO strings to cross the RSC boundary safely.
  //
  // FUTURE: When a real database is in place, the client should fetch raw data
  // directly from an API endpoint instead of receiving it as RSC props. This
  // approach is a demo-only optimisation for a static Excel data source.
  const provider = new ExcelDataProvider();
  const rawData = await provider.load();
  const serializedRawData = serializeRawScheduleData(rawData);

  // Pass new Date(0) to disable the "can't reschedule before now" guard on startup —
  // the demo dataset contains past flights that must still be fully schedulable.
  // When adding flights interactively, callers should pass new Date() instead.
  const scheduleOutput = await runScheduler(provider, new Date(0));
  const initialData = toGanttFormat(scheduleOutput);
  const unscheduledFlights = toUnscheduledFormat(scheduleOutput);

  return (
    <LandingClient
      initialData={initialData}
      unscheduledFlights={unscheduledFlights}
      serializedRawData={serializedRawData}
    />
  );
}
