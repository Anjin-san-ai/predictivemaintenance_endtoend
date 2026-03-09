"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as HoverCard from "@radix-ui/react-hover-card";

import AddFlightDetailsConfirmationPopup from "../AddFlightDetailsConfirmationPopup";
import AddFlightPopup from "../AddFlightPopup";
import FlightDetailsPopup from "../FlightDetailsTootlip";
import PartsMaintenanceTaskList from "../PartsMaintenanceTaskListPopup";
import {
  FlightDemand,
  MaintenanceBlock,
  SchedulerAircraft,
  UnscheduledFlight,
  createFlightDemandFromRoute,
  getRouteStart,
  normalizeMaintenanceType,
} from "@/utils/scheduler";
import { getDynamicStatusForAircraft, getStatusColor } from "@/utils/aircraftUtils";

interface RuleBasedFlightMaintenanceScheduleProps {
  flightScheduleData: SchedulerAircraft[];
  unscheduledFlights: UnscheduledFlight[];
  onAddFlightDemand: (flightDemand: FlightDemand) => void;
}

type DateCell = {
  fullDate: Date;
  dateString: string;
  isToday: boolean;
};

function getStartOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeToPosition(timeString: string): number {
  const [hours, minutes] = timeString.split(":").map(Number);
  return ((hours * 60 + minutes) / (24 * 60)) * 100;
}

function buildDateRange(weekOffset: number): DateCell[] {
  const weekStart = getStartOfWeek(new Date());
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(weekStart);
    current.setDate(weekStart.getDate() + index);

    return {
      fullDate: current,
      dateString: formatDate(current),
      isToday: formatDate(current) === formatDate(new Date()),
    };
  });
}

function getWeekLabel(days: DateCell[]): string {
  if (days.length === 0) {
    return "";
  }

  const start = days[0].fullDate;
  const end = days[days.length - 1].fullDate;

  return `${start.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  })} - ${end.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  })}`;
}

export default function RuleBasedFlightMaintenanceSchedule({
  flightScheduleData,
  unscheduledFlights,
  onAddFlightDemand,
}: Readonly<RuleBasedFlightMaintenanceScheduleProps>) {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddFlightModalOpen, setIsAddFlightModalOpen] = useState(false);
  const [isConfirmationPopupOpen, setIsConfirmationPopupOpen] = useState(false);
  const [pendingFlightData, setPendingFlightData] = useState<any>(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState<
    (MaintenanceBlock & { aircraftTailNumber: string }) | null
  >(null);
  const [lastQueuedFlight, setLastQueuedFlight] = useState<string | null>(null);

  const fullDateRange = useMemo(() => buildDateRange(weekOffset), [weekOffset]);
  const weekLabel = useMemo(() => getWeekLabel(fullDateRange), [fullDateRange]);

  const filteredAircraftData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return flightScheduleData;
    }

    return flightScheduleData.filter(
      (aircraft) =>
        aircraft.tailNumber.toLowerCase().includes(query) ||
        getDynamicStatusForAircraft(aircraft).toLowerCase().includes(query),
    );
  }, [flightScheduleData, searchQuery]);

  const handleFlightSubmit = useCallback((flightData: any) => {
    setPendingFlightData(flightData);
    setIsAddFlightModalOpen(false);
    setIsConfirmationPopupOpen(true);
  }, []);

  const handleConfirmFlight = useCallback(() => {
    if (!pendingFlightData?.route?.length) {
      return;
    }

    const flightDemand = createFlightDemandFromRoute(pendingFlightData.route, {
      id: `manual-flight-${Date.now()}`,
      flightNumber: pendingFlightData.flightNumber,
      category: pendingFlightData.category,
    });

    onAddFlightDemand(flightDemand);
    setLastQueuedFlight(flightDemand.flightNumber);
    setPendingFlightData(null);
    setIsConfirmationPopupOpen(false);
  }, [onAddFlightDemand, pendingFlightData]);

  const renderFlightBar = (
    route: FlightDemand["route"],
    rowKey: string,
  ) => {
    const firstLeg = route[0];
    const lastLeg = route[route.length - 1];
    const startDateIndex = fullDateRange.findIndex(
      (date) => date.dateString === firstLeg.departureDate,
    );
    const endDateIndex = fullDateRange.findIndex(
      (date) => date.dateString === lastLeg.arrivalDate,
    );

    if (startDateIndex === -1 || endDateIndex === -1) {
      return null;
    }

    const left = 180 + startDateIndex * 180 + (timeToPosition(firstLeg.departureTime) / 100) * 180;
    const right =
      180 + endDateIndex * 180 + (timeToPosition(lastLeg.arrivalTime) / 100) * 180;
    const width = Math.max(right - left, 14);
    const routeText = [firstLeg.from, ...route.map((leg) => leg.to)].join("-");

    return (
      <HoverCard.Root key={`${rowKey}-${routeText}-${firstLeg.departureDate}`}>
        <HoverCard.Trigger asChild>
          <button
            type="button"
            className="absolute top-[9px] z-10 h-9 rounded-md border px-3 text-left text-xs font-semibold text-white shadow-sm"
            style={{
              left,
              width,
              backgroundColor: "#314e96",
              borderColor: "#203a77",
            }}
          >
            <div className="truncate">{routeText}</div>
          </button>
        </HoverCard.Trigger>
        <HoverCard.Portal>
          <HoverCard.Content side="top" align="start" className="z-50">
            <FlightDetailsPopup routes={route} />
          </HoverCard.Content>
        </HoverCard.Portal>
      </HoverCard.Root>
    );
  };

  const renderMaintenanceBar = (
    maintenance: MaintenanceBlock,
    tailNumber: string,
    index: number,
  ) => {
    const startDateIndex = fullDateRange.findIndex(
      (date) => date.dateString === maintenance.scheduleStartDate,
    );
    const endDateIndex = fullDateRange.findIndex(
      (date) => date.dateString === maintenance.scheduleEndDate,
    );

    if (startDateIndex === -1 || endDateIndex === -1) {
      return null;
    }

    const left =
      180 +
      startDateIndex * 180 +
      (timeToPosition(maintenance.scheduleStartTime) / 100) * 180;
    const right =
      180 +
      endDateIndex * 180 +
      (timeToPosition(maintenance.scheduleEndTime) / 100) * 180;
    const width = Math.max(right - left, 14);
    const isInDepth = normalizeMaintenanceType(maintenance.type) === "In-Depth";

    return (
      <button
        key={`${tailNumber}-${maintenance.id}-${index}`}
        type="button"
        className="absolute top-[9px] z-20 h-9 rounded-md border px-3 text-left text-xs font-semibold text-white shadow-sm"
        style={{
          left,
          width,
          backgroundColor: isInDepth ? "#8993aa" : "#ac5555",
          borderColor: isInDepth ? "#6b7589" : "#773a3a",
        }}
        onClick={() =>
          setSelectedMaintenance({
            ...maintenance,
            aircraftTailNumber: tailNumber,
          })
        }
      >
        <div className="truncate">
          {maintenance.type}
          {maintenance.taskNames?.length ? `: ${maintenance.taskNames.join(", ")}` : ""}
        </div>
      </button>
    );
  };

  return (
    <>
      <div className="w-full">
        <div className="bg-white rounded-t-[11px] shadow-[0px_5px_45px_rgba(0,0,0,0.15)] py-2">
          <div className="flex items-center justify-between px-6">
            <div className="flex items-center gap-6">
              <h1 className="text-lg font-bold text-black">Smart scheduling</h1>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <button
                  type="button"
                  className="rounded-full border border-gray-300 px-3 py-1 hover:bg-gray-50"
                  onClick={() => setWeekOffset(0)}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="rounded-full border border-gray-300 px-3 py-1 hover:bg-gray-50"
                  onClick={() => setWeekOffset((current) => current - 1)}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="rounded-full border border-gray-300 px-3 py-1 hover:bg-gray-50"
                  onClick={() => setWeekOffset((current) => current + 1)}
                >
                  Next
                </button>
                <span className="font-medium text-[#101b34]">{weekLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full border border-[#b8b8b8] px-3 py-1.5">
                <input
                  type="text"
                  placeholder="Search aircraft"
                  className="w-56 border-none bg-transparent text-sm outline-none"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
              <button
                className="flex items-center justify-center gap-2 rounded-full border border-[#1165a2] bg-gradient-to-b from-[rgba(52,156,230,1)] to-[rgba(41,116,169,1)] px-6 py-2"
                onClick={() => setIsAddFlightModalOpen(true)}
              >
                <span className="text-sm font-bold text-white">Add flight demand</span>
              </button>
            </div>
          </div>

          {lastQueuedFlight ? (
            <div className="px-6 pt-2 text-sm text-[#3562d4]">
              Flight demand queued for auto-assignment: <span className="font-semibold">{lastQueuedFlight}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex-1 p-3 min-h-0">
        <div className="h-full overflow-auto rounded-lg border bg-white shadow-lg">
          <div className="min-w-max">
            <div className="sticky top-0 z-30 flex border-b-2 bg-white">
              <div className="sticky left-0 z-30 flex h-[44px] w-[180px] items-center justify-center bg-[#15213d] text-[13px] text-white">
                Aircraft tail numbers
              </div>
              {fullDateRange.map((date) => (
                <div
                  key={date.dateString}
                  className={`flex h-[44px] w-[180px] flex-shrink-0 items-center justify-between rounded-t-lg px-3 text-white ${
                    date.isToday ? "bg-[#4b67a7]" : "bg-[#52596a]"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold">{date.fullDate.getDate()}</span>
                    <span className="text-[12px] font-medium text-[#ffffff99]">
                      {date.fullDate.toLocaleString("en-US", { month: "short" })}
                    </span>
                  </div>
                  <div className="text-[12px]">
                    {date.fullDate
                      .toLocaleDateString("en-US", { weekday: "short" })
                      .toUpperCase()}
                  </div>
                </div>
              ))}
            </div>

            {filteredAircraftData.map((aircraft) => (
              <div
                key={aircraft.tailNumber}
                className="relative flex"
                data-tail-number={aircraft.tailNumber}
              >
                <button
                  type="button"
                  className="sticky left-0 z-20 mt-1 flex h-[54px] w-[180px] items-center gap-3 bg-[#101b34] px-3 text-left"
                  onClick={() =>
                    router.push(
                      `/maintenance-overview?tailNumber=${encodeURIComponent(aircraft.tailNumber)}`,
                    )
                  }
                >
                  <div
                    className="h-full w-[12px]"
                    style={{
                      backgroundColor: getStatusColor(getDynamicStatusForAircraft(aircraft)),
                    }}
                  />
                  <div>
                    <div className="text-[15px] font-bold text-white">{aircraft.tailNumber}</div>
                    <div className="text-[11px] text-[#d9e1ff]">
                      {aircraft.currentHours} hrs | {aircraft.currentLandings} landings
                    </div>
                    <div className="text-[11px] text-[#ffffff99]">
                      {getDynamicStatusForAircraft(aircraft)}
                    </div>
                  </div>
                </button>

                {fullDateRange.map((date, colIndex) => (
                  <div
                    key={`${aircraft.tailNumber}-${date.dateString}`}
                    className={`relative mt-1 h-[54px] w-[180px] flex-shrink-0 overflow-hidden ${
                      date.isToday
                        ? "bg-[#e9b7b575]"
                        : colIndex % 2 === 0
                          ? "bg-[#ebebeb]"
                          : "bg-[#e1e0e0]"
                    }`}
                  >
                    <div className="absolute inset-0 flex">
                      {Array.from({ length: 24 }, (_, hour) => (
                        <div
                          key={hour}
                          className="flex-1 border-r border-gray-300 opacity-20"
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {aircraft.routes.map((route, index) =>
                  renderFlightBar(route, `${aircraft.tailNumber}-${index}`),
                )}
                {aircraft.maintenance.map((maintenance, index) =>
                  renderMaintenanceBar(maintenance, aircraft.tailNumber, index),
                )}
              </div>
            ))}

            <div className="relative flex">
              <div className="sticky left-0 z-20 mt-1 flex h-[72px] w-[180px] items-center bg-[#5d4b2f] px-3 text-left">
                <div>
                  <div className="text-[15px] font-bold text-white">Unscheduled flights</div>
                  <div className="text-[11px] text-[#fff0d1]">
                    Flights requiring user intervention
                  </div>
                </div>
              </div>
              <div className="mt-1 flex h-[72px] min-w-[1260px] flex-1 items-start gap-2 overflow-x-auto bg-[#faf4e8] px-3 py-3">
                {unscheduledFlights.length === 0 ? (
                  <div className="text-sm text-[#7b6140]">
                    All current flight demands were assigned successfully.
                  </div>
                ) : (
                  unscheduledFlights.map(({ flight, reason }) => (
                    <div
                      key={flight.id}
                      className="min-w-[260px] rounded-md border border-[#d7b37c] bg-white px-3 py-2 shadow-sm"
                    >
                      <div className="text-sm font-semibold text-[#5a3f17]">
                        {flight.flightNumber}
                      </div>
                      <div className="text-xs text-gray-600">
                        {[flight.route[0].from, ...flight.route.map((leg) => leg.to)].join("-")}
                      </div>
                      <div className="mt-1 text-xs text-[#7b6140]">{reason}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAddFlightModalOpen ? <AddFlightPopup onSubmit={handleFlightSubmit} /> : null}
      {isConfirmationPopupOpen && pendingFlightData ? (
        <AddFlightDetailsConfirmationPopup
          flightData={pendingFlightData}
          onCancel={() => {
            setPendingFlightData(null);
            setIsConfirmationPopupOpen(false);
          }}
          onEdit={() => {
            setIsConfirmationPopupOpen(false);
            setIsAddFlightModalOpen(true);
          }}
          onConfirm={handleConfirmFlight}
        />
      ) : null}

      <AlertDialog.Root
        open={Boolean(selectedMaintenance)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMaintenance(null);
          }
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[90vw] max-w-6xl -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-lg bg-white p-4 shadow-2xl">
            {selectedMaintenance ? (
              <>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#101b34]">
                      {selectedMaintenance.type} scope for {selectedMaintenance.aircraftTailNumber}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedMaintenance.taskNames?.join(", ") || "Grouped maintenance tasks"}
                    </p>
                  </div>
                  <AlertDialog.Cancel asChild>
                    <button
                      type="button"
                      className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
                    >
                      Close
                    </button>
                  </AlertDialog.Cancel>
                </div>
                <PartsMaintenanceTaskList
                  aircraftTailNumber={selectedMaintenance.aircraftTailNumber}
                  maintenanceId={selectedMaintenance.id}
                />
              </>
            ) : null}
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
