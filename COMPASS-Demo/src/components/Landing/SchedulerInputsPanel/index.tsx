"use client";

import { AircraftLandingsRecord, AircraftMetricRecord } from "@/utils/scheduler";

interface SchedulerInputsPanelProps {
  aircraftHours: AircraftMetricRecord[];
  aircraftLandings: AircraftLandingsRecord[];
  onLandingsChange: (tailNumber: string, value: number) => void;
  onResetFlights: () => void;
  totalFlightDemands: number;
}

export default function SchedulerInputsPanel({
  aircraftHours,
  aircraftLandings,
  onLandingsChange,
  onResetFlights,
  totalFlightDemands,
}: Readonly<SchedulerInputsPanelProps>) {
  const hoursByTail = new Map(
    aircraftHours.map((record) => [record.tailNumber, record.currentHours]),
  );

  return (
    <div className="w-full bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-[#101b34]">Scheduler inputs</h3>
          <p className="text-xs text-gray-600">
            Maintenance and hours are loaded from the workbook. Landings are editable and
            flights are scheduled from the reusable unassigned demand list.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-[#c7d3f1] bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#3357a2]">
            {totalFlightDemands} flight demands
          </div>
          <button
            type="button"
            className="rounded-full border border-[#4270e0] px-4 py-2 text-xs font-semibold text-[#4270e0] transition-colors hover:bg-blue-50"
            onClick={onResetFlights}
          >
            Reset flight demand
          </button>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="border-b border-gray-200 px-3 py-2">Tail</th>
              <th className="border-b border-gray-200 px-3 py-2">Current hours</th>
              <th className="border-b border-gray-200 px-3 py-2">Current landings</th>
            </tr>
          </thead>
          <tbody>
            {aircraftLandings.map((record) => (
              <tr key={record.tailNumber}>
                <td className="border-b border-gray-100 px-3 py-2 font-semibold text-[#101b34]">
                  {record.tailNumber}
                </td>
                <td className="border-b border-gray-100 px-3 py-2 text-gray-700">
                  {hoursByTail.get(record.tailNumber) ?? 0}
                </td>
                <td className="border-b border-gray-100 px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    value={record.currentLandings}
                    onChange={(event) =>
                      onLandingsChange(record.tailNumber, Number(event.target.value) || 0)
                    }
                    className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-[#4270e0] focus:outline-none focus:ring-2 focus:ring-[#d6e3ff]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
