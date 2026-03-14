"use client";
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as HoverCard from "@radix-ui/react-hover-card";
import * as Toast from "@radix-ui/react-toast";
import PartsMaintenanceTaskList from "../PartsMaintenanceTaskListPopup";
import FlightDetailsPopup from "../FlightDetailsTootlip";
import AddFlightPopup from "../AddFlightPopup";
import AddFlightDetailsConfirmationPopup from "../AddFlightDetailsConfirmationPopup";
import ScheduleImpactPopup from "../ScheduleImpactPopup";
import {
  getDynamicStatusForAircraft,
  getStatusColor,
} from "../../../utils/aircraftUtils";
import type {
  GanttAircraft,
  GanttRouteLeg,
  GanttMaintenanceItem,
  GanttMaintenanceTask,
  GanttUnscheduledFlight,
  SerializedRawScheduleData,
  RawFlightLeg,
} from "../../../lib/scheduler/types";
import { deserializeRawScheduleData } from "../../../lib/scheduler/types";
import { InMemoryDataProvider, nextFlightNumber } from "../../../lib/scheduler/inMemoryDataProvider";
import { runScheduler, toGanttFormat, toUnscheduledFormat, extractExistingMaintBlocks } from "../../../lib/scheduler/scheduleOrchestrator";
import { diffSchedule } from "../../../lib/scheduler/scheduleDiff";
import type { ScheduleImpact } from "../../../lib/scheduler/scheduleDiff";

/** Result of a scheduler pre-run, stored until the user confirms. */
interface PendingSchedulerResult {
  ganttData: GanttAircraft[];
  unscheduledFlights: GanttUnscheduledFlight[];
  /** The tail assigned to the new flight, or null if it was unschedulable. */
  assignedTailNumber: string | null;
  flightNumber: number;
  /** Raw legs for the new flight — appended to addedFlightLegsRef on confirm. */
  newLegs: RawFlightLeg[];
}

interface SelectedMaintenance {
  id: string;
  maintenanceType: GanttMaintenanceItem['type'];
  maintenanceIndex: number;
  scheduleStartDate: string;
  scheduleEndDate: string;
  scheduleStartTime: string;
  scheduleEndTime: string;
  durationHours: number;
  tasks: GanttMaintenanceTask[];
  aircraftTailNumber: string;
  aircraftStatus: string;
  currentHours: number;
}

/** Condense the engine's verbose reason string into a short UI-friendly label. */
function parseShortReason(reason: string): string {
  if (reason.includes('between legs')) return 'Maintenance between legs';
  if (reason.includes('overlaps maintenance')) return 'Conflicts with maintenance';
  if (reason.includes('gap after maintenance')) return 'Insufficient post-maintenance gap';
  if (reason.includes('gap before trip')) return 'Insufficient turnaround';
  if (reason.includes('overlaps existing flight')) return 'Conflicts with scheduled flight';
  return 'No available tail';
}

export default function FlightMaintenanceSchedule(
  { flightScheduleData, setFlightScheduleData, initialFlightScheduleData, unscheduledFlights, setUnscheduledFlights, rawData }: Readonly<{
    flightScheduleData: GanttAircraft[];
    setFlightScheduleData: (data: GanttAircraft[]) => void;
    initialFlightScheduleData: GanttAircraft[];
    unscheduledFlights?: GanttUnscheduledFlight[];
    setUnscheduledFlights?: (flights: GanttUnscheduledFlight[]) => void;
    rawData?: import('../../../lib/scheduler/types').SerializedRawScheduleData;
  }>
) {
  const [liveTimeTick, setLiveTimeTick] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTimeTick(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<SelectedMaintenance | null>(null);
  const [isAddFlightModalOpen, setIsAddFlightModalOpen] = useState(false);
  const [pendingSchedulerResult, setPendingSchedulerResult] = useState<PendingSchedulerResult | null>(null);
  const [isConfirmationPopupOpen, setIsConfirmationPopupOpen] = useState(false);
  const [pendingFlightData, setPendingFlightData] = useState<any>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [lastAddedFlight, setLastAddedFlight] = useState<string | null>(null);
  const [autoScrollTarget, setAutoScrollTarget] = useState<string | null>(null);
  const [scheduleImpact, setScheduleImpact] = useState<ScheduleImpact | null>(null);

  // Accumulates raw legs for every interactively-added flight that has been
  // confirmed. Included in InMemoryDataProvider on each subsequent add so that
  // all previously-added flights remain visible in the schedule.
  const addedFlightLegsRef = useRef<RawFlightLeg[]>([]);

  // Maps confirmed added flight numbers → assigned tail number.
  // Used to lock previously-confirmed added flights on subsequent scheduler
  // re-runs, preventing them from being displaced by the new flight.
  const confirmedAddedFlightsRef = useRef<Map<number, string>>(new Map());

  const resetToOriginalData = () => {
    setFlightScheduleData(JSON.parse(JSON.stringify(initialFlightScheduleData)));
    addedFlightLegsRef.current = [];
    confirmedAddedFlightsRef.current = new Map();
    setShowSuccessToast(false);
    setLastAddedFlight(null);
    setAutoScrollTarget(null);
    setPendingFlightData(null);
    setPendingSchedulerResult(null);
  };

  const handleFlightSubmit = async (flightData: any) => {
    setPendingFlightData(flightData);
    setIsAddFlightModalOpen(false);

    // Run the full scheduler in-memory with the new flight legs appended.
    // NOTE (DEMO): rawData is the base dataset passed from the server at page load.
    // In a future DB-backed implementation this should fetch from an API instead.
    if (rawData) {
      const baseData = deserializeRawScheduleData(rawData);

      // Derive the next flight number from both the original base data AND any
      // flights added in this session, so numbers don't collide across multiple
      // sequential adds.
      const flightNumber = nextFlightNumber([
        ...baseData.flightLegs,
        ...addedFlightLegsRef.current,
      ]);

      // Convert the form's route legs to RawFlightLeg format for the scheduler.
      const newLegs: RawFlightLeg[] = (flightData.route as Array<{
        from: string; to: string;
        departureDate: string; departureTime: string;
        arrivalDate: string; arrivalTime: string;
      }>).map((leg, idx) => ({
        flightNumber,
        legNumber: idx + 1,
        origin: leg.from,
        destination: leg.to,
        departureDate: new Date(leg.departureDate + 'T00:00:00Z'),
        departureTime: leg.departureTime ?? '00:00',
        arrivalDate: new Date(leg.arrivalDate + 'T00:00:00Z'),
        arrivalTime: leg.arrivalTime ?? '00:00',
      }));

      // Build locked assignments:
      //   1. Past flights (departed before now) — cannot be displaced.
      //   2. Previously-confirmed added flights — locked to their assigned tail
      //      so subsequent adds do not displace them.
      const nowMs = Date.now();
      const lockedAssignments = new Map<number, string>(confirmedAddedFlightsRef.current);
      for (const aircraft of flightScheduleData) {
        for (const route of aircraft.routes) {
          if (route.length === 0) continue;
          const firstLeg = route[0];
          const depMs = new Date(`${firstLeg.departureDate}T${firstLeg.departureTime}Z`).getTime();
          if (firstLeg.flightNumber !== undefined && depMs < nowMs) {
            lockedAssignments.set(firstLeg.flightNumber, aircraft.tailNumber);
          }
        }
      }

      // Pass current schedule's maintenance blocks as lockedMaintBlocks.
      // The scheduler keeps past blocks (startDateTime < now) fixed and
      // recomputes future blocks, so the new flight's impact on maintenance
      // due dates is reflected without disrupting in-progress maintenance.
      const lockedMaintBlocks = extractExistingMaintBlocks(flightScheduleData);

      // Include all previously-confirmed added flights so they remain in the
      // schedule alongside the new one.
      const allAdditionalLegs = [...addedFlightLegsRef.current, ...newLegs];
      const provider = new InMemoryDataProvider(baseData, allAdditionalLegs);
      const output = await runScheduler(provider, new Date(), lockedAssignments, lockedMaintBlocks);
      const ganttData = toGanttFormat(output);
      const newUnscheduled = toUnscheduledFormat(output);

      // Find which tail the scheduler assigned the new flight to.
      const assignedBlock = output.scheduledBlocks.find(
        b => b.type === 'FLIGHT' && b.legs?.some(l => l.flightNumber === flightNumber)
      );
      const assignedTailNumber = assignedBlock?.tailNumber ?? null;

      setPendingSchedulerResult({ ganttData, unscheduledFlights: newUnscheduled, assignedTailNumber, flightNumber, newLegs });
    }

    setIsConfirmationPopupOpen(true);
  };

  const handleConfirmFlight = () => {
    if (pendingSchedulerResult) {
      // Compute total flight hours for the new trip from its raw legs so the
      // impact popup can show how many hours were added to the assigned tail.
      const newFlightHours = pendingSchedulerResult.newLegs.reduce((sum, leg) => {
        const dep = new Date(`${leg.departureDate.toISOString().slice(0, 10)}T${leg.departureTime}:00Z`);
        const arr = new Date(`${leg.arrivalDate.toISOString().slice(0, 10)}T${leg.arrivalTime}:00Z`);
        return sum + Math.max(0, (arr.getTime() - dep.getTime()) / 3_600_000);
      }, 0);

      // Compute the schedule impact before applying the new data so we still
      // have the current (before) snapshot in flightScheduleData.
      const impact = diffSchedule(
        flightScheduleData,
        pendingSchedulerResult.ganttData,
        pendingSchedulerResult.flightNumber,
        newFlightHours,
      );

      // Persist this flight's raw legs so the next add includes it.
      addedFlightLegsRef.current = [
        ...addedFlightLegsRef.current,
        ...pendingSchedulerResult.newLegs,
      ];

      // Lock this flight to its assigned tail for all future re-runs.
      if (pendingSchedulerResult.assignedTailNumber !== null) {
        confirmedAddedFlightsRef.current = new Map(confirmedAddedFlightsRef.current);
        confirmedAddedFlightsRef.current.set(
          pendingSchedulerResult.flightNumber,
          pendingSchedulerResult.assignedTailNumber,
        );
      }

      setFlightScheduleData(pendingSchedulerResult.ganttData);
      if (setUnscheduledFlights) {
        setUnscheduledFlights(pendingSchedulerResult.unscheduledFlights);
      }

      const tailToHighlight = pendingSchedulerResult.assignedTailNumber;
      if (tailToHighlight) {
        setShowSuccessToast(true);
        setLastAddedFlight(tailToHighlight);
        setAutoScrollTarget(tailToHighlight);
      }

      // Show the schedule impact popup after closing the confirmation popup.
      setScheduleImpact(impact);
    }

    setIsConfirmationPopupOpen(false);
    setPendingFlightData(null);
    setPendingSchedulerResult(null);
  };

  const handleCancelConfirmation = () => {
    setIsConfirmationPopupOpen(false);
    setPendingFlightData(null);
  };

  const handleSuccessToastClose = () => {
    setShowSuccessToast(false);
    setLastAddedFlight(null);
  };

  const handleEditFlightDetails = () => {
    setIsConfirmationPopupOpen(false);
    setIsAddFlightModalOpen(true);
  };
  const today = useMemo(() => new Date(liveTimeTick), [liveTimeTick]);

  const minDate = new Date(today);
  minDate.setDate(today.getDate() - 30);

  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 90);

  const currentDay = today.getDay();
  const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() + daysToMonday);

  const MIN_OFFSET = Math.floor(
    (minDate.getTime() - currentMonday.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );

  const maxDateDay = maxDate.getDay();
  const maxDateDaysToMonday = maxDateDay === 0 ? -6 : 1 - maxDateDay;
  const maxDateMonday = new Date(maxDate);
  maxDateMonday.setDate(maxDate.getDate() + maxDateDaysToMonday);
  const MAX_OFFSET = Math.floor(
    (maxDateMonday.getTime() - currentMonday.getTime()) /
    (1000 * 60 * 60 * 24 * 7)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [cellOffsets, setCellOffsets] = useState<number[]>([]);

  const [timerLinePosition, setTimerLinePosition] = useState(0);

  const fullDateRange = useMemo(() => {
    const minDate = new Date(today);
    minDate.setDate(today.getDate() - 30);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 90);
    const dates = [];
    for (
      let d = new Date(minDate.getTime());
      d.getTime() <= maxDate.getTime();
      d.setDate(d.getDate() + 1)
    ) {
      const date = new Date(d.getTime());
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const isToday = date.toDateString() === today.toDateString();
      dates.push({
        fullDate: date,
        monthDay: date.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
        }),
        dateString: dateString,
        isToday: isToday,
      });
    }
    return dates;
  }, [today]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (cellRefs.current.length === fullDateRange.length) {
      const offsets = cellRefs.current.map((ref) => (ref ? ref.offsetLeft : 0));
      setCellOffsets(offsets);
    }
  }, [fullDateRange.length, weekOffset]);

  const canGoBack = useMemo(() => {
    return weekOffset > MIN_OFFSET;
  }, [weekOffset, MIN_OFFSET]);

  const canGoForward = useMemo(() => {
    return weekOffset < MAX_OFFSET;
  }, [weekOffset, MAX_OFFSET]);

  const getWeekRangeText = useMemo(() => {
    const currentDay = today.getDay();
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() + daysToMonday + weekOffset * 7);

    const minDate = new Date(today);
    minDate.setDate(today.getDate() - 30);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 90);

    if (currentMonday < minDate) currentMonday.setTime(minDate.getTime());
    if (currentMonday > maxDate) currentMonday.setTime(maxDate.getTime());

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentMonday);
      date.setDate(currentMonday.getDate() + i);
      if (date > maxDate) break;
      weekDates.push(date);
    }

    if (weekDates.length === 0) return "";

    const startDate = weekDates[0];
    const endDate = weekDates[weekDates.length - 1];
    const startMonth = startDate.toLocaleDateString("en-US", { month: "long" });
    const endMonth = endDate.toLocaleDateString("en-US", { month: "long" });
    const year = startDate.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDate.getDate()} - ${endDate.getDate()}, ${year}`;
    } else {
      return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${year}`;
    }
  }, [weekOffset, today]);

  const scrollToWeek = useCallback((weekOffset: number) => {
    if (scrollContainerRef.current) {
      let targetIndex;
      if (weekOffset === MIN_OFFSET) {
        targetIndex = 0;
      } else {
        const today = new Date();
        const currentDay = today.getDay();
        const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        const targetMonday = new Date(today);
        targetMonday.setDate(today.getDate() + daysToMonday + weekOffset * 7);
        const targetDateString = targetMonday.toISOString().split("T")[0];
        targetIndex = fullDateRange.findIndex(
          (date) => date.dateString === targetDateString
        );
      }
      if (targetIndex >= 0) {
        const cellWidth = 241;
        const scrollPosition = targetIndex * cellWidth;
        scrollContainerRef.current.scrollTo({
          left: scrollPosition,
          behavior: "smooth",
        });
      }
    }
  }, [fullDateRange, MIN_OFFSET]);

  const goToPreviousWeek = () => {
    if (canGoBack) {
      const newOffset = Math.max(weekOffset - 1, MIN_OFFSET);
      setWeekOffset(newOffset);
      scrollToWeek(newOffset);
    }
  };

  const goToNextWeek = () => {
    if (canGoForward) {
      const newOffset = Math.min(weekOffset + 1, MAX_OFFSET);
      setWeekOffset(newOffset);
      scrollToWeek(newOffset);
    }
  };

  const goToToday = () => {
    setWeekOffset(0);
    scrollToWeek(0);
  };

  useEffect(() => {
    if (autoScrollTarget) {
      const flightRow = document.querySelector(`[data-tail-number="${autoScrollTarget}"]`);
      if (flightRow) {
        flightRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setAutoScrollTarget(null);
    }
  }, [autoScrollTarget]);

  const filteredGanttAircraftData = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return flightScheduleData;

    const query = debouncedSearchQuery.toLowerCase();
    return flightScheduleData.filter(
      (aircraft: GanttAircraft) =>
        aircraft.tailNumber.toLowerCase().includes(query) ||
        getDynamicStatusForAircraft(aircraft).toLowerCase() === query
    );
  }, [debouncedSearchQuery, flightScheduleData, liveTimeTick]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const timeToPosition = (timeString: string) => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;
    return (totalMinutes / (24 * 60)) * 100;
  };

  const getMaintenanceSchedulesForGanttAircraft = useCallback(
    (aircraft: GanttAircraft) => {
      const maintenanceItems: any[] = [];
      aircraft.maintenance.forEach(
        (maintenance: GanttMaintenanceItem, maintenanceIndex: number) => {
          const startDate = maintenance.scheduleStartDate;
          const endDate = maintenance.scheduleEndDate;
          const startDateIndex = fullDateRange.findIndex(
            (date: any) => date.dateString >= startDate && date.dateString <= endDate
          );
          const endDateIndex = (() => {
            let idx = -1;
            for (let i = fullDateRange.length - 1; i >= 0; i--) {
              if (fullDateRange[i].dateString >= startDate && fullDateRange[i].dateString <= endDate) {
                idx = i;
                break;
              }
            }
            return idx;
          })();
          if (startDateIndex !== -1 && endDateIndex !== -1) {
            const startPosition = timeToPosition(maintenance.scheduleStartTime);
            const endPosition = timeToPosition(maintenance.scheduleEndTime);
            maintenanceItems.push({
              id: maintenance.id,
              startDateIndex,
              endDateIndex,
              startPosition,
              endPosition,
              maintenanceType: maintenance.type,
              maintenanceIndex,
              type: "maintenance",
            });
          }
        }
      );
      return maintenanceItems;
    },
    [fullDateRange, liveTimeTick]
  );

  type JourneySegment = {
    startDateIndex: number;
    endDateIndex: number;
    startPosition: number;
    endPosition: number;
    routeText: string;
    routes: GanttRouteLeg[];
    flightNumber?: number;
    type: "flight";
  };

  const getJourneySegments = useCallback(
    (aircraft: GanttAircraft): JourneySegment[] => {
      const segments: JourneySegment[] = [];
      if (!Array.isArray(aircraft.routes)) return segments;

      aircraft.routes.forEach((segmentArr: GanttRouteLeg[]) => {
        if (!segmentArr || segmentArr.length === 0) return;
        const firstLeg = segmentArr[0];
        const lastLeg = segmentArr[segmentArr.length - 1];

        const cities: string[] = [firstLeg.from];
        segmentArr.forEach((r: GanttRouteLeg) => {
          cities.push(r.to);
        });
        const routeText = cities.join("-");

        const startDateIndex = fullDateRange.findIndex(
          (date) => date.dateString >= firstLeg.departureDate && date.dateString <= lastLeg.arrivalDate
        );
        const endDateIndex = (() => {
          let idx = -1;
          for (let i = fullDateRange.length - 1; i >= 0; i--) {
            if (fullDateRange[i].dateString >= firstLeg.departureDate && fullDateRange[i].dateString <= lastLeg.arrivalDate) {
              idx = i;
              break;
            }
          }
          return idx;
        })();
        const startPosition = timeToPosition(firstLeg.departureTime);
        const endPosition = timeToPosition(lastLeg.arrivalTime);

        segments.push({
          startDateIndex,
          endDateIndex,
          startPosition,
          endPosition,
          routeText,
          routes: segmentArr,
          flightNumber: firstLeg.flightNumber,
          type: "flight",
        });
      });

      return segments;
    },
    [fullDateRange, liveTimeTick]
  );

  const getFlightStatusColor = (
    startDate: string,
    endDate: string,
    startTime: string,
    endTime: string
  ) => {
    if (!startDate || !endDate || !startTime || !endTime) return "#314e96";
    const now = new Date();
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:59`);
    if (now >= start && now <= end) {
      return "#4371e0";
    }
    return "#314e96";
  };

  const getMaintenanceColor = (type: string) => {
    if (type === "In-Depth") {
      return {
        backgroundColor: "#8993aa",
        borderColor: "#6b7589",
      };
    } else {
      return {
        backgroundColor: "#ac5555",
        borderColor: "#773a3a",
      };
    }
  };

  const handlePlannedMaintenanceClick = (maintenance: { id: string; maintenanceType: GanttMaintenanceItem['type']; maintenanceIndex: number }, aircraft: GanttAircraft) => {
    const item = aircraft.maintenance[maintenance.maintenanceIndex];
    setSelectedMaintenance({
      id: item.id,
      maintenanceType: item.type,
      maintenanceIndex: maintenance.maintenanceIndex,
      scheduleStartDate: item.scheduleStartDate,
      scheduleEndDate: item.scheduleEndDate,
      scheduleStartTime: item.scheduleStartTime,
      scheduleEndTime: item.scheduleEndTime,
      durationHours: item.durationHours,
      tasks: item.tasks,
      aircraftTailNumber: aircraft.tailNumber,
      aircraftStatus: getDynamicStatusForAircraft(aircraft),
      currentHours: aircraft.currentHours,
    });
    setIsModalOpen(true);
  };

  const handleTailNumberClick = (tailNumber: string) => {
    router.push(
      `/maintenance-overview?tailNumber=${encodeURIComponent(tailNumber)}`
    );
  };

  useEffect(() => {
    const minutes = today.getHours() * 60 + today.getMinutes();
    const position = (minutes / (24 * 60)) * 241;
    setTimerLinePosition(position);
  }, [today]);

  useEffect(() => {
    scrollToWeek(0);
  }, []);


  return (
    <>
      <div className="w-full">
        <div className="bg-white rounded-t-[11px] shadow-[0px_5px_45px_rgba(0,0,0,0.25)] py-4">
          <div className="flex items-center justify-between px-8">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-black">
                Smart scheduling
              </h1>
              <div className="flex items-center pl-16">
                <button
                  type="button"
                  className="flex items-center gap-3 cursor-pointer bg-transparent border-none p-0"
                  onClick={goToToday}
                  aria-label="Go to today"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goToToday();
                    }
                  }}
                >
                  <div className="flex items-center h-10 ">
                    <img
                      className="w-7 h-7"
                      src="/images/landing/icon-1.png"
                      alt="Today"
                    />
                  </div>
                  <span className="text-[18px] font-medium text-[#393939]">
                    Today
                  </span>
                </button>

                <div className="flex items-center gap-2 ml-8">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex items-center justify-center w-11 h-11 p-3 cursor-pointer transform rotate-180"
                      onClick={goToPreviousWeek}
                      aria-label="Go to previous week"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          goToPreviousWeek();
                        }
                      }}
                    >
                      <img
                        className="w-4 h-5 transform rotate-180"
                        src="/images/landing/vector-5.png"
                        alt="Previous"
                      />
                    </button>

                    <button
                      type="button"
                      className="flex items-center justify-center w-11 h-11 p-3 cursor-pointer"
                      onClick={goToNextWeek}
                      aria-label="Go to next week"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          goToNextWeek();
                        }
                      }}
                    >
                      <img
                        className="w-4 h-5"
                        src="/images/landing/vector-5-1.png"
                        alt="Next"
                      />
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="text-xl font-medium text-gray-700">
                        {getWeekRangeText}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-9">
              <div
                className="flex items-center gap-3 px-3 py-3 bg-white rounded-[45px] w-96"
                style={{ border: "1px solid #b8b8b8" }}
              >
                <img
                  className="w-8 h-8"
                  src="/images/landing/icon-left.png"
                  alt="Search"
                />
                <input
                  type="text"
                  placeholder="Search flights"
                  className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-500 text-lg"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>

              <button
                className="flex items-center justify-center gap-3 px-10 py-3.5 bg-gradient-to-b from-[rgba(52,156,230,1)] to-[rgba(41,116,169,1)] border border-[#1165a2] rounded-full"
                onClick={() => {
                  setIsAddFlightModalOpen(true);
                }}
              >
                <span className="text-lg font-bold text-white">Add flight</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 min-h-0 flex flex-col gap-2">
        <div className="flex-1 min-h-0 bg-white rounded-lg shadow-lg border overflow-hidden">
          <div ref={scrollContainerRef} className="h-full overflow-auto">
            <div className="min-w-max">
              <div className="flex text-white border-b-2 sticky top-0 z-20 gap-1">
                <div className="w-[240px] h-[65px] flex items-center justify-center bg-[#15213d] sticky left-0 z-30 text-[21.3px] text-white ">
                  Aircraft tail numbers
                </div>

                {fullDateRange.map((date) => (
                  <div
                    key={date.fullDate.toISOString()}
                    className={`w-[240px] h-[65px] flex items-center justify-between p-4 flex-shrink-0 text-white rounded-t-lg ${date.isToday ? "bg-[#4b67a7]" : "bg-[#52596a]"
                      }`}
                  >
                    <div className="flex gap-2 items-center">
                      <span className="text-3xl font-bold">
                        {date.fullDate.getDate()}
                      </span>
                      <span className="text-[21px] font-medium text-[#ffffff99]">
                        {date.fullDate.toLocaleString("en-US", {
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className="text-[21px]">
                      {date.fullDate
                        .toLocaleDateString("en-US", { weekday: "short" })
                        .toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>

              {filteredGanttAircraftData.map((aircraft: GanttAircraft) => {
                const journeySegments = getJourneySegments(aircraft);
                const maintenanceSchedules =
                  getMaintenanceSchedulesForGanttAircraft(aircraft);

                return (
                  <div
                    key={aircraft.tailNumber}
                    className="flex gap-1 relative"
                    data-tail-number={aircraft.tailNumber}
                  >
                    <button
                      type="button"
                      className="mt-1 cursor-pointer w-[240px] h-[77px] flex gap-3 items-center justify-center sticky left-0 z-10"
                      style={{
                        background:
                          "linear-gradient(270deg, rgba(21, 46, 102, 1) 0%, rgba(16, 27, 52, 1) 100%)",
                      }}
                      onClick={() => handleTailNumberClick(aircraft.tailNumber)}
                      aria-label={`View maintenance overview for ${aircraft.tailNumber}`}
                    >
                      <div
                        className="w-[15px] h-full"
                        style={{
                          backgroundColor: getStatusColor(
                            getDynamicStatusForAircraft(aircraft)
                          ),
                        }}
                      ></div>
                      <div className="w-[24px] h-[24px]">
                        <img
                          src="/images/landing/airport-13.png"
                          alt="Airport"
                        />
                      </div>
                      <div className="flex flex-col flex-1 items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-white text-[24px]">
                            {aircraft.tailNumber}
                          </div>
                          {lastAddedFlight !== null && aircraft.tailNumber === lastAddedFlight && (
                            <div className="relative">
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                              <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 items-center text-sm text-muted-foreground">
                          <div className="text-wrapper-20">
                            {getDynamicStatusForAircraft(aircraft)}
                          </div>
                          <div className="w-[13.3px] h-[13.3px]">
                            <img src="/images/landing/open-end-wrench-24.png" />
                          </div>
                        </div>
                      </div>
                    </button>

                    {fullDateRange.map((date, colIndex) => (
                      <div
                        key={`${aircraft.tailNumber}-${date.dateString}`}
                        ref={(el) => {
                          cellRefs.current[colIndex] = el;
                        }}
                        className={`mt-1 w-[240px] h-[77px] relative flex-shrink-0 ${date.isToday
                          ? "bg-[#e9b7b575]"
                          : colIndex % 2 !== 0
                            ? "bg-[#e1e0e0]"
                            : "bg-[#ebebeb]"
                          }`}
                      >
                        <div className="absolute inset-0 flex">
                          {Array.from({ length: 24 }, (_, hour) => (
                            <div
                              key={hour}
                              className="flex-1 border-r border-gray-300 opacity-20"
                              style={{ width: `${100 / 24}%` }}
                            />
                          ))}
                        </div>

                        {date.isToday && (
                          <div
                            className="absolute top-0 bottom-[-4px] pointer-events-none z-[5]"
                            style={{
                              left: `${timerLinePosition}px`,
                              width: "3px",
                              backgroundColor: "#1e35b9",
                            }}
                          >
                            {aircraft === filteredGanttAircraftData[0] && (
                              <div
                                className="absolute w-4 h-4 bg-black border-2 border-white rounded-full shadow-lg"
                                style={{
                                  left: "-6px",
                                  zIndex: 5,
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {journeySegments.map((segment, segmentIndex) => {
                      const firstLeg = segment.routes[0];
                      const lastLeg = segment.routes[segment.routes.length - 1];
                      const toUTCString = (d: string) =>
                        new Date(d + "T00:00:00Z").toISOString().split("T")[0];
                      const startDateIndex = fullDateRange.findIndex(
                        (date) =>
                          date.dateString ===
                          toUTCString(firstLeg.departureDate)
                      );
                      const endDateIndex = fullDateRange.findIndex(
                        (date) =>
                          date.dateString === toUTCString(lastLeg.arrivalDate)
                      );
                      const cellWidth = 241;
                      const nameColumnWidth = 241;
                      const startOffsetInCell =
                        (timeToPosition(firstLeg.departureTime) / 100) *
                        cellWidth;
                      const endOffsetInCell =
                        (timeToPosition(lastLeg.arrivalTime) / 100) * cellWidth;
                      const leftOffset =
                        (cellOffsets[startDateIndex] ??
                          nameColumnWidth + startDateIndex * cellWidth) +
                        startOffsetInCell;
                      const endOffset =
                        (cellOffsets[endDateIndex] ??
                          nameColumnWidth + endDateIndex * cellWidth) +
                        endOffsetInCell;
                      const lineWidth = Math.max(endOffset - leftOffset, 10);

                      if (
                        lineWidth <= 0 ||
                        leftOffset < 0 ||
                        startDateIndex < 0 ||
                        endDateIndex < 0
                      ) {
                        return null;
                      }

                      const startDate = fullDateRange[startDateIndex]?.dateString;
                      const endDate = fullDateRange[endDateIndex]?.dateString;
                      const startTime = firstLeg.departureTime;
                      const endTime = lastLeg.arrivalTime;
                      const flightColor = getFlightStatusColor(
                        startDate,
                        endDate,
                        startTime,
                        endTime
                      );

                      return (
                        <HoverCard.Root
                          key={`hovercard-${segmentIndex}`}
                          openDelay={0}
                          closeDelay={0}
                        >
                          <HoverCard.Trigger asChild>
                            <div
                              key={`flight-${segmentIndex}`}
                              className="absolute h-[45px] rounded-lg z-0 flex items-center justify-center border cursor-pointer hover:opacity-90 transition-opacity"
                              style={{
                                left: `${leftOffset}px`,
                                width: `${lineWidth}px`,
                                backgroundColor: flightColor,
                                border: `1px solid ${flightColor}`,
                                top: "50%",
                                transform: "translateY(-50%)",
                              }}
                              title={`${segment.routeText} (${segment.routes[0].departureTime
                                } - ${segment.routes[segment.routes.length - 1]
                                  .arrivalTime
                                })`}
                            >
                              <div className="flex items-center w-full justify-between px-2 overflow-hidden">
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <img
                                    className="w-[17px] h-[17px]"
                                    src="/images/landing/airplane-take-off-8.png"
                                    alt="Takeoff"
                                  />
                                  <span className="text-[#91c9ff] font-bold text-[14px] min-w-[42px] text-left">
                                    {segment.routes[0].departureTime}
                                  </span>
                                </div>
                                <div className="flex items-center flex-1 overflow-hidden px-1 justify-center gap-2">
                                  {segment.flightNumber && (
                                    <span className="text-[#91c9ff] font-bold text-[17px] flex-shrink-0">
                                      FN {segment.flightNumber}
                                    </span>
                                  )}
                                  <span className="text-[14px] text-white font-bold overflow-hidden whitespace-nowrap">
                                    {segment.routeText}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <img
                                    className="w-[17px] h-[17px]"
                                    src="/images/landing/airplane-landing-15.png"
                                    alt="Landing"
                                  />
                                  <span className="text-[#91c9ff] font-bold text-[14px] min-w-[42px] text-right">
                                    {
                                      segment.routes[segment.routes.length - 1]
                                        .arrivalTime
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          </HoverCard.Trigger>
                          <HoverCard.Portal>
                            <HoverCard.Content
                              className="z-50 w-auto bg-transparent"
                              side="top"
                              align="start"
                              sideOffset={2}
                            >
                              <FlightDetailsPopup routes={segment.routes} flightNumber={segment.flightNumber} />
                            </HoverCard.Content>
                          </HoverCard.Portal>
                        </HoverCard.Root>
                      );
                    })}

                    {maintenanceSchedules.map(
                      (maintenance) => {
                        const cellWidth = 241;
                        const nameColumnWidth = 241;

                        const startOffsetInCell =
                          (maintenance.startPosition / 100) * cellWidth;
                        const endOffsetInCell =
                          (maintenance.endPosition / 100) * cellWidth;
                        const leftOffset =
                          (cellOffsets[maintenance.startDateIndex] ??
                            nameColumnWidth +
                            maintenance.startDateIndex * cellWidth) +
                          startOffsetInCell;
                        const endOffset =
                          (cellOffsets[maintenance.endDateIndex] ??
                            nameColumnWidth +
                            maintenance.endDateIndex * cellWidth) +
                          endOffsetInCell;
                        const lineWidth = Math.max(endOffset - leftOffset, 10);

                        if (
                          lineWidth <= 0 ||
                          leftOffset < 0 ||
                          maintenance.startDateIndex < 0 ||
                          maintenance.endDateIndex < 0
                        ) {
                          return null;
                        }

                        const maintenanceColors = getMaintenanceColor(
                          maintenance.maintenanceType
                        );

                        const isPlannedMaintenance =
                          maintenance.maintenanceType === "Planned";

                        return isPlannedMaintenance ? (
                          <button
                            key={`maintenance-${maintenance.id}`}
                            className={`absolute transform -translate-y-1/2 h-[45px] rounded-lg z-0 flex items-center justify-center border cursor-pointer hover:opacity-80 overflow-hidden`}
                            style={{
                              left: `${leftOffset}px`,
                              width: `${lineWidth}px`,
                              backgroundColor: maintenanceColors.backgroundColor,
                              border: `1px solid ${maintenanceColors.borderColor}`,
                              top: "50%",
                            }}
                            title={`Maintenance: ${maintenance.maintenanceType}`}
                            tabIndex={0}
                            aria-label={`View planned maintenance details for ${maintenance.id}`}
                            onClick={() =>
                              handlePlannedMaintenanceClick(maintenance, aircraft)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handlePlannedMaintenanceClick(maintenance, aircraft);
                              }
                            }}
                            type="button"
                          >
                            <span className="text-[14px] text-white font-bold px-1 flex items-center whitespace-nowrap overflow-hidden">
                              <img
                                src="/images/landing/open-end-wrench-5.png"
                                alt="Spanner"
                                style={{
                                  width: "17px",
                                  height: "17px",
                                  marginRight: "5px",
                                  flexShrink: 0,
                                }}
                              />
                              {`Planned Maintenance`}
                            </span>
                          </button>
                        ) : (
                          <div
                            key={`maintenance-${maintenance.id}`}
                            className="absolute transform -translate-y-1/2 h-[45px] rounded-lg z-0 flex items-center justify-center border overflow-hidden"
                            style={{
                              left: `${leftOffset}px`,
                              width: `${lineWidth}px`,
                              backgroundColor: maintenanceColors.backgroundColor,
                              border: `1px solid ${maintenanceColors.borderColor}`,
                              top: "50%",
                            }}
                            title={`Maintenance: ${maintenance.maintenanceType}`}
                          >
                            <span className="text-[14px] text-white font-bold px-1 flex items-center whitespace-nowrap overflow-hidden">
                              <img
                                src="/images/landing/open-end-wrench-5.png"
                                alt="Spanner"
                                style={{
                                  width: "17px",
                                  height: "17px",
                                  marginRight: "5px",
                                  flexShrink: 0,
                                }}
                              />
                              {maintenance.maintenanceType === "In-Depth"
                                ? `In-Depth Maintenance`
                                : maintenance.maintenanceType}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                );
              })}

              {/* ── Unable to Schedule rows — inside the Gantt grid ── */}
              {unscheduledFlights && unscheduledFlights.length > 0 && (
                <>
                  {/* Section divider header */}
                  <div className="flex gap-1 sticky left-0 z-20">
                    <div
                      className="w-full flex items-center gap-3 px-5 py-2"
                      style={{ background: "linear-gradient(270deg, rgba(120, 20, 40, 1) 0%, rgba(70, 10, 20, 1) 100%)" }}
                    >
                      <svg className="w-4 h-4 text-red-300 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 16v2h2v-2h-2zm0-6v4h2v-4h-2z" />
                      </svg>
                      <span className="text-white font-bold text-[15px] tracking-wide">
                        Unable to Schedule — {unscheduledFlights.length} flight{unscheduledFlights.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* One Gantt row per unscheduled flight */}
                  {unscheduledFlights.map((flight) => {
                    const [depDate, depTime] = flight.departure.split(" ");
                    const [arrDate, arrTime] = flight.arrival.split(" ");

                    const cellWidth = 241;
                    const nameColumnWidth = 241;

                    const startDateIndex = fullDateRange.findIndex(d => d.dateString === depDate);
                    const endDateIndex = (() => {
                      let idx = fullDateRange.findIndex(d => d.dateString === arrDate);
                      // If arrival is same day as departure or not found, use departure day
                      return idx >= 0 ? idx : startDateIndex;
                    })();

                    const startOffsetInCell = (timeToPosition(depTime) / 100) * cellWidth;
                    const endOffsetInCell = (timeToPosition(arrTime) / 100) * cellWidth;
                    const leftOffset =
                      (cellOffsets[startDateIndex] ?? nameColumnWidth + startDateIndex * cellWidth) +
                      startOffsetInCell;
                    const endOffset =
                      (cellOffsets[endDateIndex] ?? nameColumnWidth + endDateIndex * cellWidth) +
                      endOffsetInCell;
                    const lineWidth = Math.max(endOffset - leftOffset, 10);
                    const showBlock = lineWidth > 0 && leftOffset >= 0 && startDateIndex >= 0;

                    return (
                      <div
                        key={`unscheduled-${flight.flightNumber}`}
                        className="flex gap-1 relative"
                      >
                        {/* Left label — generic, matches aircraft row style */}
                        <div
                          className="mt-1 w-[240px] h-[77px] flex gap-3 items-center justify-center sticky left-0 z-10"
                          style={{ background: "linear-gradient(270deg, rgba(21, 46, 102, 1) 0%, rgba(16, 27, 52, 1) 100%)" }}
                        >
                          <div className="w-[15px] h-full bg-red-500 flex-shrink-0" />
                          <div className="w-[24px] h-[24px] flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 16v2h2v-2h-2zm0-6v4h2v-4h-2z" />
                            </svg>
                          </div>
                          <div className="flex flex-col flex-1 items-start justify-between overflow-hidden pr-1">
                            <div className="flex items-baseline gap-2">
                              <div className="font-bold text-white text-[15px]">Unscheduled</div>
                              <div className="text-[#91c9ff] text-[11px] font-semibold">FN {flight.flightNumber}</div>
                            </div>
                            <div className="text-red-300 text-[11px] leading-tight whitespace-normal">{parseShortReason(flight.reason)}</div>
                          </div>
                        </div>

                        {/* Grid cells */}
                        {fullDateRange.map((date, colIndex) => (
                          <div
                            key={`unscheduled-${flight.flightNumber}-${date.dateString}`}
                            className={`mt-1 w-[240px] h-[77px] relative flex-shrink-0 ${
                              date.isToday
                                ? "bg-[#f5d5d575]"
                                : colIndex % 2 !== 0
                                  ? "bg-[#f0d8d8]"
                                  : "bg-[#f5e0e0]"
                            }`}
                          >
                            <div className="absolute inset-0 flex">
                              {Array.from({ length: 24 }, (_, hour) => (
                                <div
                                  key={hour}
                                  className="flex-1 border-r border-red-300 opacity-20"
                                  style={{ width: `${100 / 24}%` }}
                                />
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* Flight block positioned on the timeline */}
                        {showBlock && (
                          <HoverCard.Root openDelay={0} closeDelay={0}>
                            <HoverCard.Trigger asChild>
                              <div
                                className="absolute transform -translate-y-1/2 h-[45px] rounded-lg z-0 flex items-center justify-center border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                style={{
                                  left: `${leftOffset}px`,
                                  width: `${lineWidth}px`,
                                  top: "50%",
                                  backgroundColor: "#b91c1c",
                                  border: "1px solid #991b1b",
                                }}
                              >
                                <div className="flex items-center w-full justify-between px-2 overflow-hidden">
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <img className="w-[17px] h-[17px]" src="/images/landing/airplane-take-off-8.png" alt="Takeoff" />
                                    <span className="text-red-200 font-bold text-[14px] min-w-[42px] text-left">{depTime}</span>
                                  </div>
                                  <div className="flex items-center flex-1 overflow-hidden px-1 justify-center gap-2">
                                    <span className="text-red-200 font-bold text-[17px] flex-shrink-0">
                                      FN {flight.flightNumber}
                                    </span>
                                    <span className="text-[14px] text-white font-bold overflow-hidden whitespace-nowrap">
                                      {flight.legs.length > 0
                                        ? [flight.legs[0].from, ...flight.legs.map(l => l.to)].join('-')
                                        : ''}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <img className="w-[17px] h-[17px]" src="/images/landing/airplane-landing-15.png" alt="Landing" />
                                    <span className="text-red-200 font-bold text-[14px] min-w-[42px] text-right">{arrTime}</span>
                                  </div>
                                </div>
                              </div>
                            </HoverCard.Trigger>
                            <HoverCard.Portal>
                              <HoverCard.Content
                                className="z-50 w-auto bg-transparent"
                                side="top"
                                align="start"
                                sideOffset={2}
                              >
                                <div className="flex flex-col gap-2">
                                  <div className="bg-[#1a0a0a] border border-red-700 rounded-xl shadow-2xl px-5 py-4 w-[360px] lg:w-[400px] xl:w-[440px] 2xl:w-[480px]">
                                    <div className="text-red-400 font-bold text-base uppercase tracking-widest mb-2">Unable to Schedule</div>
                                    <div className="text-red-100 text-base leading-relaxed">{flight.reason}</div>
                                  </div>
                                  <FlightDetailsPopup routes={flight.legs} flightNumber={flight.flightNumber} />
                                </div>
                              </HoverCard.Content>
                            </HoverCard.Portal>
                          </HoverCard.Root>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <AlertDialog.Content className="fixed inset-10 z-50 overflow-auto">
            <AlertDialog.Title className="sr-only">Task Details</AlertDialog.Title>
            <div className="bg-white rounded-lg shadow-lg w-full h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h2 className="text-[26px] pl-3 font-bold text-black leading-normal">
                    Task Details
                  </h2>
                </div>
                <AlertDialog.Cancel asChild>
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </AlertDialog.Cancel>
              </div>
              <hr className="border-t" />

              <div className="pt-6">
                <PartsMaintenanceTaskList
                  aircraftTailNumber={selectedMaintenance?.aircraftTailNumber}
                  maintenanceId={selectedMaintenance?.id}
                  maintenanceType={selectedMaintenance?.maintenanceType}
                  aircraftStatus={selectedMaintenance?.aircraftStatus}
                  scheduleStartDate={selectedMaintenance?.scheduleStartDate}
                  scheduleEndDate={selectedMaintenance?.scheduleEndDate}
                  scheduleStartTime={selectedMaintenance?.scheduleStartTime}
                  scheduleEndTime={selectedMaintenance?.scheduleEndTime}
                  durationHours={selectedMaintenance?.durationHours}
                  currentHours={selectedMaintenance?.currentHours}
                  tasks={selectedMaintenance?.tasks}
                  onClose={() => setIsModalOpen(false)}
                />
              </div>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      <AlertDialog.Root
        open={isAddFlightModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setPendingFlightData(null);
          }
          setIsAddFlightModalOpen(open);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <AlertDialog.Content className="fixed inset-10 z-50 overflow-hidden">
            <AlertDialog.Title className="sr-only">Add Flight Details</AlertDialog.Title>
            <div className="bg-white rounded-lg shadow-lg w-full h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                <div>
                  <h2 className="text-[26px] pl-3 font-bold text-black leading-normal">
                    Add Flight Details
                  </h2>
                </div>
                <AlertDialog.Cancel asChild>
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </AlertDialog.Cancel>
              </div>
              <hr className="border-t" />

              <div className="flex-1 overflow-auto">
                <AddFlightPopup
                  onSubmit={handleFlightSubmit}
                  initialData={pendingFlightData}
                />
              </div>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      <AlertDialog.Root open={isConfirmationPopupOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-[9998]" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[9999] max-h-[85vh] w-[90vw] max-w-[1400px] -translate-x-1/2 -translate-y-1/2 flex flex-col">
            <AlertDialog.Title className="sr-only">Confirm Flight Details</AlertDialog.Title>
            {pendingFlightData && (
              <AddFlightDetailsConfirmationPopup
                flightData={pendingFlightData}
                assignedTailNumber={pendingSchedulerResult?.assignedTailNumber ?? null}
                isUnschedulable={pendingSchedulerResult?.assignedTailNumber === null && pendingSchedulerResult !== null}
                onCancel={handleCancelConfirmation}
                onConfirm={handleConfirmFlight}
                onEdit={handleEditFlightDetails}
              />
            )}
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>


      {scheduleImpact && (
        <ScheduleImpactPopup
          impact={scheduleImpact}
          onClose={() => setScheduleImpact(null)}
        />
      )}

      <Toast.Provider duration={Infinity}>
        <Toast.Root
          className="fixed top-16 left-1/2 transform -translate-x-1/2 rounded-lg p-5 flex items-center gap-4 z-[100] min-w-[400px] 
                     data-[state=open]:animate-in data-[state=closed]:animate-out 
                     data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 
                     data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 
                     data-[state=closed]:slide-out-to-top-48 data-[state=open]:slide-in-from-top-48
                     data-[state=open]:duration-500 data-[state=closed]:duration-300
                     data-[state=open]:ease-out data-[state=closed]:ease-in"
          style={{
            backgroundColor: '#d1ffdc',
            border: '1.33px solid #67a566',
            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(103, 165, 102, 0.1)'
          }}
          open={showSuccessToast}
        >
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7"></path>
            </svg>
          </div>

          <div className="flex-1">
            <Toast.Title className="text-gray-800 font-semibold text-2xl leading-tight">
              Flight Route successfully added to aircraft {lastAddedFlight}
            </Toast.Title>
          </div>

          <Toast.Close
            className="ml-2 text-gray-500 hover:text-gray-700 flex-shrink-0 p-2 hover:bg-white/50 rounded-lg transition-all duration-200 ease-in-out hover:shadow-sm border border-transparent hover:border-gray-300"
            onClick={handleSuccessToastClose}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </Toast.Close>
        </Toast.Root>

        <Toast.Viewport className="fixed top-0 left-0 right-0 flex flex-col p-6 gap-2 w-full max-w-screen z-[2147483647] outline-none" />
      </Toast.Provider>
    </>
  );
}