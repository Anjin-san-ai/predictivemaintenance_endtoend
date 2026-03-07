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
import {
  getDynamicStatusForAircraft,
  getStatusColor,
  flightScheduleData as initialFlightScheduleData,
} from "../../../utils/aircraftUtils";
import { getA400IndexForTail } from "../../../utils/a400Bridge";

interface Aircraft {
  tailNumber: string;
  status: string;
  routes: RouteLeg[][];
  maintenance: MaintenanceItem[];
}

interface RouteLeg {
  from: string;
  to: string;
  departureDate: string;
  arrivalDate: string;
  departureTime: string;
  arrivalTime: string;
}

interface MaintenanceItem {
  id: string;
  type: string;
  scheduleStartDate: string;
  scheduleEndDate: string;
  scheduleStartTime: string;
  scheduleEndTime: string;
}

export default function FlightMaintenanceSchedule(
  { flightScheduleData, setFlightScheduleData }: Readonly<{ flightScheduleData: Aircraft[]; setFlightScheduleData: (data: Aircraft[]) => void }>
) {
  const [liveTimeTick, setLiveTimeTick] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTimeTick(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fleet health from A400 predictive monitor
  interface A400HealthEntry { id: string; displayName: string; worstStatus: string; }
  const [fleetHealth, setFleetHealth] = useState<A400HealthEntry[]>([]);
  const [fleetHealthError, setFleetHealthError] = useState(false);
  useEffect(() => {
    fetch('/api/fleet-health')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setFleetHealthError(true); return; }
        setFleetHealth(data.aircraft || []);
      })
      .catch(() => setFleetHealthError(true));
  }, []);

  const getA400HealthForAircraft = useCallback((tailNumber: string): A400HealthEntry | null => {
    if (fleetHealth.length === 0) return null;
    const idx = getA400IndexForTail(tailNumber) % fleetHealth.length;
    return fleetHealth[idx] || null;
  }, [fleetHealth]);
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null);
  const [isAddFlightModalOpen, setIsAddFlightModalOpen] = useState(false);
  const [isConfirmationPopupOpen, setIsConfirmationPopupOpen] = useState(false);
  const [pendingFlightData, setPendingFlightData] = useState<any>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [lastAddedFlight, setLastAddedFlight] = useState<string | null>(null);
  const [autoScrollTarget, setAutoScrollTarget] = useState<string | null>(null);
  const [showMaintenanceToast, setShowMaintenanceToast] = useState(false);
  const [maintenanceAircraftNumber, setMaintenanceAircraftNumber] = useState<string>('');
  const [maintenanceTimeoutId, setMaintenanceTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [reschedulingCompleted, setReschedulingCompleted] = useState<string[]>([]);

  const resetToOriginalData = () => {
    setFlightScheduleData(JSON.parse(JSON.stringify(initialFlightScheduleData)));

    setShowSuccessToast(false);
    setShowMaintenanceToast(false);

    setLastAddedFlight(null);
    setMaintenanceAircraftNumber('');
    setAutoScrollTarget(null);
    setReschedulingCompleted([]);
    setPendingFlightData(null);

    if (maintenanceTimeoutId) {
      clearTimeout(maintenanceTimeoutId);
      setMaintenanceTimeoutId(null);
    }
  };

  const handleFlightSubmit = (flightData: any) => {
    setPendingFlightData(flightData);
    setIsAddFlightModalOpen(false);
    setIsConfirmationPopupOpen(true);
  };

  const handleConfirmFlight = () => {
    const aircraftIndex = flightScheduleData.findIndex((aircraft: Aircraft) => aircraft.tailNumber === 'ZZ198');

    if (aircraftIndex !== -1 && pendingFlightData) {
      const updatedFlightScheduleData = [...flightScheduleData];

      if (!updatedFlightScheduleData[aircraftIndex].routes) {
        updatedFlightScheduleData[aircraftIndex].routes = [];
      }

      updatedFlightScheduleData[aircraftIndex].routes.push(pendingFlightData.route);

      updatedFlightScheduleData[aircraftIndex].status = 'Serviceable';

      setFlightScheduleData(updatedFlightScheduleData);
    }

    setIsConfirmationPopupOpen(false);
    setPendingFlightData(null);

    setShowSuccessToast(true);
    setLastAddedFlight('ZZ198');
    setAutoScrollTarget('ZZ198');
  };

  const handleCancelConfirmation = () => {
    setIsConfirmationPopupOpen(false);
    setPendingFlightData(null);
  };

  const handleSuccessToastClose = () => {
    setShowSuccessToast(false);
    setLastAddedFlight(null);

    const today = new Date();
    const currentDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const specialCases = {
      'ZZ153': '2025-09-08',
      'ZZ165': '2025-09-09',
      'ZZ190': '2025-09-10',
      'ZZ175': '2025-09-11',
      'ZZ145': '2025-09-12'
    };

    let affectedAircraft = null;
    for (const [aircraft, date] of Object.entries(specialCases)) {
      if (date === currentDateString) {
        affectedAircraft = aircraft;
        break;
      }
    }

    if (affectedAircraft) {
      const timeoutId = setTimeout(() => {
        setMaintenanceAircraftNumber(affectedAircraft);
        setShowMaintenanceToast(true);
        setAutoScrollTarget(affectedAircraft);

        if (!reschedulingCompleted.includes(affectedAircraft)) {
          handleMaintenanceRescheduling(affectedAircraft);
        }
      }, 10000);

      setMaintenanceTimeoutId(timeoutId);
    }
  };

  const handleMaintenanceRescheduling = (aircraftNumber: string) => {
    const today = new Date();
    const currentDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const specialCases = {
      'ZZ153': '2025-09-08',
      'ZZ165': '2025-09-09',
      'ZZ190': '2025-09-10',
      'ZZ175': '2025-09-11',
      'ZZ145': '2025-09-12'
    };

    if (specialCases[aircraftNumber as keyof typeof specialCases] === currentDateString) {
      const updatedFlightScheduleData = [...flightScheduleData];

      const sourceAircraftIndex = updatedFlightScheduleData.findIndex(aircraft => aircraft.tailNumber === aircraftNumber);
      const zz199Index = updatedFlightScheduleData.findIndex(aircraft => aircraft.tailNumber === 'ZZ199');

      if (sourceAircraftIndex !== -1 && zz199Index !== -1) {
        const sourceAircraft = updatedFlightScheduleData[sourceAircraftIndex];

        let nextFlightRouteIndex = -1;
        for (let i = 0; i < sourceAircraft.routes.length; i++) {
          const route = sourceAircraft.routes[i];
          if (route.length > 0 && route[0].departureDate >= currentDateString) {
            nextFlightRouteIndex = i;
            break;
          }
        }

        if (nextFlightRouteIndex !== -1) {
          const flightRoute = sourceAircraft.routes[nextFlightRouteIndex];
          updatedFlightScheduleData[zz199Index].routes.push(flightRoute);

          updatedFlightScheduleData[sourceAircraftIndex].routes.splice(nextFlightRouteIndex, 1);

          const currentTime = new Date();
          const maintenanceStartTime = new Date(currentTime.getTime());

          const daysToAdd = {
            'ZZ153': 5,
            'ZZ165': 4,
            'ZZ190': 4,
            'ZZ175': 4,
            'ZZ145': 4
          };

          const maintenanceEndDate = new Date(today);
          maintenanceEndDate.setDate(today.getDate() + daysToAdd[aircraftNumber as keyof typeof daysToAdd]);

          const currentDate = new Date();
          const currentDateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

          updatedFlightScheduleData[sourceAircraftIndex].maintenance.forEach(maintenance => {
            if (maintenance.type === 'Planned' && maintenance.scheduleStartDate >= currentDateString) {
              const originalStartDate = new Date(maintenance.scheduleStartDate);
              const originalEndDate = new Date(maintenance.scheduleEndDate);

              originalStartDate.setDate(originalStartDate.getDate() + 10);
              originalEndDate.setDate(originalEndDate.getDate() + 10);

              maintenance.scheduleStartDate = `${originalStartDate.getFullYear()}-${String(originalStartDate.getMonth() + 1).padStart(2, "0")}-${String(originalStartDate.getDate()).padStart(2, "0")}`;
              maintenance.scheduleEndDate = `${originalEndDate.getFullYear()}-${String(originalEndDate.getMonth() + 1).padStart(2, "0")}-${String(originalEndDate.getDate()).padStart(2, "0")}`;
            }
          });

          updatedFlightScheduleData[sourceAircraftIndex].maintenance.push({
            id: `${Math.floor(Math.random() * 90000) + 10000}`,
            type: 'Planned',
            scheduleStartDate: `${maintenanceStartTime.getFullYear()}-${String(maintenanceStartTime.getMonth() + 1).padStart(2, "0")}-${String(maintenanceStartTime.getDate()).padStart(2, "0")}`,
            scheduleEndDate: `${maintenanceEndDate.getFullYear()}-${String(maintenanceEndDate.getMonth() + 1).padStart(2, "0")}-${String(maintenanceEndDate.getDate()).padStart(2, "0")}`,
            scheduleStartTime: `${String(maintenanceStartTime.getHours()).padStart(2, "0")}:${String(maintenanceStartTime.getMinutes()).padStart(2, "0")}`,
            scheduleEndTime: '23:59'
          });

          setFlightScheduleData(updatedFlightScheduleData);

          setReschedulingCompleted(prev => [...prev, aircraftNumber]);
        }
      }
    }
  };

  useEffect(() => {
    return () => {
      if (maintenanceTimeoutId) {
        clearTimeout(maintenanceTimeoutId);
      }
    };
  }, [maintenanceTimeoutId]);

  const handleEditFlightDetails = () => {
    setIsConfirmationPopupOpen(false);
    setIsAddFlightModalOpen(true);
  };

  const getFlashingDotColor = (aircraftNumber: string) => {
    const today = new Date();
    const currentDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const specialCases = {
      'ZZ153': '2025-09-08',
      'ZZ165': '2025-09-09',
      'ZZ190': '2025-09-10',
      'ZZ175': '2025-09-11',
      'ZZ145': '2025-09-12'
    };

    if (specialCases[aircraftNumber as keyof typeof specialCases] === currentDateString &&
      reschedulingCompleted.includes(aircraftNumber)) {
      return 'red';
    }

    if (aircraftNumber === 'ZZ199') {
      const isAnyAircraftAffectedToday = Object.values(specialCases).includes(currentDateString);
      const isAnyReschedulingDone = Object.keys(specialCases).some(aircraft =>
        specialCases[aircraft as keyof typeof specialCases] === currentDateString &&
        reschedulingCompleted.includes(aircraft)
      );
      if (isAnyAircraftAffectedToday && isAnyReschedulingDone) {
        return 'green';
      }
    }

    return null;
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
  }, [weekOffset]);

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
        const cellWidth = 181;
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

  const filteredAircraftData = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return flightScheduleData;

    const query = debouncedSearchQuery.toLowerCase();
    return flightScheduleData.filter(
      (aircraft: Aircraft) =>
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

  const getMaintenanceSchedulesForAircraft = useCallback(
    (aircraft: Aircraft) => {
      const maintenanceItems: any[] = [];
      aircraft.maintenance.forEach(
        (maintenance: MaintenanceItem, maintenanceIndex: number) => {
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
    routes: RouteLeg[];
    type: "flight";
  };

  const getJourneySegments = useCallback(
    (aircraft: Aircraft): JourneySegment[] => {
      const segments: JourneySegment[] = [];
      if (!Array.isArray(aircraft.routes)) return segments;

      aircraft.routes.forEach((segmentArr: RouteLeg[]) => {
        if (!segmentArr || segmentArr.length === 0) return;
        const firstLeg = segmentArr[0];
        const lastLeg = segmentArr[segmentArr.length - 1];

        const cities: string[] = [firstLeg.from];
        segmentArr.forEach((r: RouteLeg) => {
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

  const handlePlannedMaintenanceClick = (maintenance: any, aircraft: Aircraft) => {
    setSelectedMaintenance({
      ...maintenance,
      aircraftTailNumber: aircraft.tailNumber,
      aircraftStatus: getDynamicStatusForAircraft(aircraft),
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
        <div className="bg-white rounded-t-[11px] shadow-[0px_5px_45px_rgba(0,0,0,0.25)] py-2">
          <div className="flex items-center justify-between px-6">
            <div className="flex items-center">
              <h1 className="text-lg font-bold text-black">
                Smart scheduling
              </h1>
              <div className="flex items-center pl-8">
                <button
                  type="button"
                  className="flex items-center gap-2 cursor-pointer bg-transparent border-none p-0"
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
                  <div className="flex items-center h-7">
                    <img
                      className="w-5 h-5"
                      src="/images/landing/icon-1.png"
                      alt="Today"
                    />
                  </div>
                  <span className="text-[13px] font-medium text-[#393939]">
                    Today
                  </span>
                </button>

                <div className="flex items-center gap-1 ml-4">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="flex items-center justify-center w-8 h-8 p-2 cursor-pointer transform rotate-180"
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
                        className="w-3 h-4 transform rotate-180"
                        src="/images/landing/vector-5.png"
                        alt="Previous"
                      />
                    </button>

                    <button
                      type="button"
                      className="flex items-center justify-center w-8 h-8 p-2 cursor-pointer"
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
                        className="w-3 h-4"
                        src="/images/landing/vector-5-1.png"
                        alt="Next"
                      />
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-gray-700">
                        {getWeekRangeText}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div
                className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-[45px] w-64"
                style={{ border: "1px solid #b8b8b8" }}
              >
                <img
                  className="w-5 h-5"
                  src="/images/landing/icon-left.png"
                  alt="Search"
                />
                <input
                  type="text"
                  placeholder="Search flights"
                  className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-500 text-sm"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>

              <button
                className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-b from-[rgba(52,156,230,1)] to-[rgba(41,116,169,1)] border border-[#1165a2] rounded-full"
                onClick={() => {
                  resetToOriginalData();
                  setIsAddFlightModalOpen(true);
                }}
              >
                <span className="text-sm font-bold text-white">Add flight</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-3 min-h-0">
        <div className="h-full bg-white rounded-lg shadow-lg border overflow-hidden">
          <div ref={scrollContainerRef} className="h-full overflow-auto">
            <div className="min-w-max">
              <div className="flex text-white border-b-2 sticky top-0 z-20 gap-1">
                <div className="w-[180px] h-[44px] flex items-center justify-center bg-[#15213d] sticky left-0 z-30 text-[13px] text-white ">
                  Aircraft tail numbers
                </div>

                {fullDateRange.map((date) => (
                  <div
                    key={date.fullDate.toISOString()}
                    className={`w-[180px] h-[44px] flex items-center justify-between px-3 flex-shrink-0 text-white rounded-t-lg ${date.isToday ? "bg-[#4b67a7]" : "bg-[#52596a]"
                      }`}
                  >
                    <div className="flex gap-1 items-center">
                      <span className="text-lg font-bold">
                        {date.fullDate.getDate()}
                      </span>
                      <span className="text-[12px] font-medium text-[#ffffff99]">
                        {date.fullDate.toLocaleString("en-US", {
                          month: "short",
                        })}
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

              {filteredAircraftData.map((aircraft: Aircraft) => {
                const journeySegments = getJourneySegments(aircraft);
                const maintenanceSchedules =
                  getMaintenanceSchedulesForAircraft(aircraft);

                return (
                  <div
                    key={aircraft.tailNumber}
                    className="flex gap-1 relative overflow-hidden"
                    data-tail-number={aircraft.tailNumber}
                  >
                    <button
                      type="button"
                      className="mt-1 cursor-pointer w-[180px] h-[54px] flex gap-2 items-center justify-center sticky left-0 z-10"
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
                      <div className="w-[16px] h-[16px]">
                        <img
                          src="/images/landing/airport-13.png"
                          alt="Airport"
                        />
                      </div>
                      <div className="flex flex-col flex-1 items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-white text-[15px]">
                            {aircraft.tailNumber}
                          </div>
                          {aircraft.tailNumber === 'ZZ198' && lastAddedFlight === 'ZZ198' && (
                            <div className="relative">
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                              <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                            </div>
                          )}
                          {(() => {
                            const flashingColor = getFlashingDotColor(aircraft.tailNumber);
                            if (flashingColor) {
                              return (
                                <div className="relative">
                                  <div className={`w-3 h-3 ${flashingColor === 'red' ? 'bg-red-500' : 'bg-green-500'} rounded-full animate-pulse`}></div>
                                  <div className={`absolute inset-0 w-3 h-3 ${flashingColor === 'red' ? 'bg-red-500' : 'bg-green-500'} rounded-full animate-ping opacity-75`}></div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                          {/* Fleet Monitor health badge */}
                          {(() => {
                            const health = getA400HealthForAircraft(aircraft.tailNumber);
                            if (!health || health.worstStatus === 'Good') return null;
                            const isCritical = health.worstStatus === 'Critical';
                            return (
                              <span
                                title={`Fleet Monitor: ${health.worstStatus} — ${health.displayName}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  padding: '1px 5px',
                                  borderRadius: '8px',
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  letterSpacing: '0.5px',
                                  border: `1px solid ${isCritical ? 'rgba(255,71,87,0.5)' : 'rgba(255,165,2,0.5)'}`,
                                  background: isCritical ? 'rgba(255,71,87,0.12)' : 'rgba(255,165,2,0.12)',
                                  color: isCritical ? '#ff4757' : '#ffa502',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {isCritical ? '⚠ CRIT' : '⚠ WARN'}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex gap-1 items-center text-sm text-muted-foreground">
                          <div className="text-wrapper-20">
                            {getDynamicStatusForAircraft(aircraft)}
                          </div>
                          <div className="w-[11px] h-[11px]">
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
                        className={`mt-1 w-[180px] h-[54px] relative flex-shrink-0 overflow-hidden ${date.isToday
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
                            {aircraft === filteredAircraftData[0] && (
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
                      const cellWidth = 181;
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
                              <div className="flex items-center w-full justify-between px-2">
                                <div className="flex items-center gap-1">
                                  <img
                                    className=" w-[16px] h-[16px]"
                                    src="/images/landing/airplane-take-off-8.png"
                                    alt="Takeoff"
                                  />
                                  <span className="text-[#91c9ff] font-bold text-[11px] min-w-[36px] text-left">
                                    {segment.routes[0].departureTime}
                                  </span>
                                </div>
                                <div className="text-[11px] text-white font-bold px-1 flex-1 text-center">
                                  {segment.routeText}
                                </div>
                                <div className="flex items-center gap-1">
                                  <img
                                    className="w-[16px] h-[16px]"
                                    src="/images/landing/airplane-landing-15.png"
                                    alt="Landing"
                                  />
                                  <span className="text-[#91c9ff] font-bold text-[11px] min-w-[36px] text-right">
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
                              <FlightDetailsPopup routes={segment.routes} />
                            </HoverCard.Content>
                          </HoverCard.Portal>
                        </HoverCard.Root>
                      );
                    })}

                    {maintenanceSchedules.map(
                      (maintenance, maintenanceIndex) => {
                        const cellWidth = 181;
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
                            className={`absolute transform -translate-y-1/2 h-[45px] rounded-lg z-0 flex items-center justify-center border cursor-pointer hover:opacity-80`}
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
                            <span className="text-[11px] text-white font-bold px-1 flex items-center">
                              <img
                                src="/images/landing/open-end-wrench-5.png"
                                alt="Spanner"
                                style={{
                                  width: "14px",
                                  height: "14px",
                                  marginRight: "4px",
                                }}
                              />
                              {`Planned Maintenance [${maintenance.id}]`}
                            </span>
                          </button>
                        ) : (
                          <div
                            key={`maintenance-${maintenance.id}`}
                            className="absolute transform -translate-y-1/2 h-[32px] rounded-lg z-0 flex items-center justify-center border"
                            style={{
                              left: `${leftOffset}px`,
                              width: `${lineWidth}px`,
                              backgroundColor: maintenanceColors.backgroundColor,
                              border: `1px solid ${maintenanceColors.borderColor}`,
                              top: "50%",
                            }}
                            title={`Maintenance: ${maintenance.maintenanceType}`}
                          >
                            <span className="text-[11px] text-white font-bold px-1 flex items-center">
                              <img
                                src="/images/landing/open-end-wrench-5.png"
                                alt="Spanner"
                                style={{
                                  width: "14px",
                                  height: "14px",
                                  marginRight: "4px",
                                }}
                              />
                              {maintenance.maintenanceType === "In-Depth"
                                ? `In-Depth Maintenance [${maintenance.id}]`
                                : maintenance.maintenanceType}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <AlertDialog.Content className="fixed inset-10 z-50 overflow-auto">
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
            {pendingFlightData && (
              <AddFlightDetailsConfirmationPopup
                flightData={pendingFlightData}
                onCancel={handleCancelConfirmation}
                onConfirm={handleConfirmFlight}
                onEdit={handleEditFlightDetails}
              />
            )}
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

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
              Flight Route successfully added to aircraft ZZ198
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

        <Toast.Root
          className="fixed top-16 left-1/2 transform -translate-x-1/2 rounded-lg p-5 flex items-center gap-4 z-[100] min-w-[400px] 
                     data-[state=open]:animate-in data-[state=closed]:animate-out 
                     data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 
                     data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 
                     data-[state=closed]:slide-out-to-top-48 data-[state=open]:slide-in-from-top-48
                     data-[state=open]:duration-500 data-[state=closed]:duration-300
                     data-[state=open]:ease-out data-[state=closed]:ease-in"
          style={{
            backgroundColor: '#ffeec3',
            border: '1.33px solid #be6a2b',
            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(190, 106, 43, 0.1)'
          }}
          open={showMaintenanceToast}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md relative" style={{ backgroundColor: '#ff8c00' }}>
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 16v2h2v-2h-2zm0-6v4h2v-4h-2z" />
            </svg>
          </div>

          <div className="flex-1">
            <Toast.Title className="text-gray-800 font-extrabold text-2xl leading-tight">
              Maintenance required for aircraft {maintenanceAircraftNumber}
            </Toast.Title>

            <Toast.Description className="pt-2 text-gray-800 text-xl leading-tight">
              All <strong>{maintenanceAircraftNumber}</strong> flights within the maintenance window have been rescheduled to aircraft <strong>ZZ199</strong>.
            </Toast.Description>
          </div>

          <Toast.Close
            className="ml-2 text-gray-500 hover:text-gray-700 flex-shrink-0 p-2 hover:bg-white/50 rounded-lg transition-all duration-200 ease-in-out hover:shadow-sm border border-transparent hover:border-gray-300"
            onClick={() => {
              setShowMaintenanceToast(false);
              setMaintenanceAircraftNumber('');
              setReschedulingCompleted([]);
            }}
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