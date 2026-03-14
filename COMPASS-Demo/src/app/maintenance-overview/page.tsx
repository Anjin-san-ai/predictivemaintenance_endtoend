export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { runScheduler, toGanttFormat } from "@/lib/scheduler/scheduleOrchestrator";
import { ExcelDataProvider } from "@/lib/scheduler/dataLoader";
import MaintenanceOverviewClient from "./MaintenanceOverviewClient";

export default async function MaintenanceOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tailNumber?: string }>;
}) {
  const { tailNumber } = await searchParams;

  if (!tailNumber) redirect("/");

  const provider = new ExcelDataProvider();
  const scheduleOutput = await runScheduler(provider, new Date(0));
  const allAircraft = toGanttFormat(scheduleOutput);

  const aircraft = allAircraft.find((a) => a.tailNumber === tailNumber);

  if (!aircraft) {
    return (
      <div className="p-8 roboto-normal-mirage-21-3px">
        <p>Aircraft <strong>{tailNumber}</strong> not found in the schedule.</p>
      </div>
    );
  }

  return <MaintenanceOverviewClient aircraft={aircraft} />;
}
