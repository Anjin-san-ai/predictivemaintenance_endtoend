"use client";

import Header from "@/components/Header/index";
import "./maintenance-overview.css";
import "./styleguide.css";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getA400IndexForTail } from "@/utils/a400Bridge";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import type { GanttAircraft, GanttMaintenanceItem, GanttRouteLeg } from "@/lib/scheduler/types";
import { getDynamicStatusForAircraft, getStatusColor } from "@/utils/aircraftUtils";
import PartsMaintenanceTaskList from "@/components/Landing/PartsMaintenanceTaskListPopup";

interface ComponentHealth {
  componentName: string;
  status: string;
  maintenanceDue: string;
  priorityLevel: string;
  descriptionText: string;
}

interface Props {
  aircraft: GanttAircraft;
}

// Status text colour — white on most backgrounds, dark on the orange "In-maintenance" badge
const STATUS_TEXT_COLOR: Record<string, string> = {
  "Serviceable":       "#ffffff",
  "In-maintenance":    "#1a1a1a",
  "Depth maintenance": "#ffffff",
  "Un-serviceable":    "#ffffff",
  "In flight":         "#ffffff",
};

// "YYYY-MM-DD" → "DD MMM YY (Day)"
function formatBlockDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(day).padStart(2, "0")} ${MONTHS[month - 1]} ${String(year).slice(2)} (${DAYS[date.getUTCDay()]})`;
}

// "YYYY-MM-DD" → "DD MMM YYYY"
function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(day).padStart(2, "0")} ${MONTHS[month - 1]} ${year}`;
}


// "YYYY-MM-DD" → "DD MMM YY"  (UTC-safe: split string directly to avoid local-timezone offset)
function formatLegDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${String(day).padStart(2, "0")} ${MONTHS[month - 1]} ${String(year).slice(2)}`;
}

function FlightCard({ legs }: { legs: GanttRouteLeg[] }) {
  if (legs.length === 0) return null;
  const flightNumber = legs[0].flightNumber;
  const segmentSpacing = 68;
  const connectorHeight = segmentSpacing - 21; // 47px

  return (
    <div style={{
      backgroundColor: "#ffffff",
      borderRadius: "12.87px",
      boxShadow: "0px 4.29px 47.18px rgba(0,0,0,0.25)",
      width: "360px",
      padding: "20px 16px",
      boxSizing: "border-box",
    }}>
      {flightNumber != null && (
        <div style={{
          fontFamily: "Roboto, sans-serif",
          fontWeight: 700,
          color: "#314e96",
          fontSize: "26px",
          lineHeight: "normal",
          marginBottom: "12px",
        }}>
          Flight {flightNumber}
        </div>
      )}

      {legs.map((leg, index) => (
        <div
          key={`${leg.from}-${leg.to}-${index}`}
          style={{
            display: "flex",
            minHeight: index < legs.length - 1 ? `${segmentSpacing}px` : undefined,
          }}
        >
          {/* Left column: circle icon + dashed connector */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "37px", flexShrink: 0 }}>
            <div style={{ position: "relative", width: "21px", height: "21px" }}>
              <div style={{ width: "21px", height: "21px", backgroundColor: "#d1d5db", borderRadius: "50%" }} />
              <div style={{ position: "absolute", top: "4.5px", left: "4.5px", width: "12px", height: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  src={
                    index === 0
                      ? "/images/flight-details-popup/airplane-take-off.png"
                      : index === legs.length - 1
                      ? "/images/flight-details-popup/airplane-landing-1.png"
                      : "/images/flight-details-popup/airplane-landing.png"
                  }
                  alt={index === 0 ? "Take off" : index === legs.length - 1 ? "Landing" : "Transit"}
                  style={{ width: "12px", height: "12px" }}
                />
              </div>
            </div>
            {index < legs.length - 1 && (
              <div style={{
                width: "1px",
                height: `${connectorHeight}px`,
                marginLeft: "10.5px",
                borderLeft: "1px dashed #6b7280",
              }} />
            )}
          </div>

          {/* Right column: route + times */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "Roboto, sans-serif",
              fontWeight: 700,
              color: "#314e96",
              fontSize: "19.3px",
              lineHeight: "normal",
              marginTop: "-1px",
            }}>
              {leg.from} – {leg.to}
            </div>
            <div style={{ display: "flex", alignItems: "center", marginTop: "2px" }}>
              <span style={{ fontFamily: "Roboto, sans-serif", fontWeight: 400, color: "#414141", fontSize: "13px", lineHeight: "normal", whiteSpace: "nowrap" }}>
                {formatLegDate(leg.departureDate)}, {leg.departureTime}
              </span>
              <div style={{ position: "relative", width: "41px", height: "5px", flexShrink: 0, marginLeft: "8px", marginRight: "8px" }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: "5px", height: "5px", backgroundColor: "#d1d5db", borderRadius: "2.68px" }} />
                <div style={{ position: "absolute", top: "2px", left: "2px", width: "35px", height: "1px", backgroundColor: "#d1d5db" }} />
                <div style={{ position: "absolute", top: 0, right: 0, width: "5px", height: "5px", backgroundColor: "#d1d5db", borderRadius: "2.68px" }} />
              </div>
              <span style={{ fontFamily: "Roboto, sans-serif", fontWeight: 400, color: "#414141", fontSize: "13px", lineHeight: "normal", whiteSpace: "nowrap" }}>
                {formatLegDate(leg.arrivalDate)}, {leg.arrivalTime}
              </span>
            </div>
          </div>

        </div>
      ))}
    </div>
  );
}

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}


export default function MaintenanceOverviewClient({ aircraft }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<GanttMaintenanceItem | null>(null);
  const [aircraftHealth, setAircraftHealth] = useState<ComponentHealth[]>([]);
  const [worstStatus, setWorstStatus] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    if (!aircraft.tailNumber) return;
    fetch('/api/fleet-health')
      .then(r => r.json())
      .then(data => {
        if (data.error || !data.aircraft) return;
        const idx = getA400IndexForTail(aircraft.tailNumber) % data.aircraft.length;
        const ac = data.aircraft[idx];
        if (ac) {
          setAircraftHealth(ac.components || []);
          setWorstStatus(ac.worstStatus || 'Good');
        }
      })
      .catch(() => {});
  }, [aircraft.tailNumber]);

  const today = getTodayString();
  const status = getDynamicStatusForAircraft(aircraft);
  const statusBg = getStatusColor(status);
  const statusTextColor = STATUS_TEXT_COLOR[status] ?? "#ffffff";

  // The single block that is currently active (start ≤ today ≤ end)
  const activeBlock: GanttMaintenanceItem | null =
    aircraft.maintenance.find(
      (m) => m.scheduleStartDate <= today && m.scheduleEndDate >= today
    ) ?? null;

  // Future maintenance blocks, sorted by start date, capped at 8
  const upcomingBlocks: GanttMaintenanceItem[] = aircraft.maintenance
    .filter((m) => m.scheduleStartDate > today)
    .sort((a, b) => a.scheduleStartDate.localeCompare(b.scheduleStartDate))
    .slice(0, 8);

  // Upcoming routes: trips whose first leg departs today or later, sorted, capped at 6
  const upcomingRoutes: GanttRouteLeg[][] = aircraft.routes
    .filter((legs) => legs.length > 0 && legs[0].departureDate >= today)
    .sort((a, b) => {
      const da = `${a[0].departureDate}T${a[0].departureTime}`;
      const db = `${b[0].departureDate}T${b[0].departureTime}`;
      return da.localeCompare(db);
    })
    .slice(0, 6);

  const activeTasks = activeBlock?.tasks ?? [];
  // Up to 3 tasks shown on the 3D panel overlay
  const panelTasks = activeTasks.slice(0, 3);

  // Progress bar proportions — completed and not-started are static (demo)
  const totalTasks = activeTasks.length;
  const completedTasks = 0;
  const startedTasks = totalTasks;
  const notStartedTasks = 0;
  const completedPct  = totalTasks > 0 ? (completedTasks  / totalTasks) * 100 : 0;
  const startedPct    = totalTasks > 0 ? (startedTasks    / totalTasks) * 100 : 0;
  const notStartedPct = totalTasks > 0 ? (notStartedTasks / totalTasks) * 100 : 0;

  return (
    <>
      <Header />
      <div style={{ zoom: 0.8, width: 'calc(100vw / 0.8)' }}>
      <div className="flex w-full h-full">
        <div className="maintenance-overview screen">

          {/* ── Page header ─────────────────────────────────────────────── */}
          <div className="frame-5124">
            <button className="group-1047" onClick={() => router.push("/")}>
              <img src="/images/maintenance-overview/arrow-back-1@2x.png" alt="Back" />
            </button>
            <div className="group-1047-1">
              <div className="frame-2">
                <h1 className="title roboto-bold-mirage-21-3px">
                  Aircraft Details : {aircraft.tailNumber}
                </h1>
              </div>
            </div>
          </div>

          {/* ── Aircraft info card ───────────────────────────────────────── */}
          <div className="overlap-group16">
            <div className="frame-512">
              <div className="frame-124">

                {/* Tail Number */}
                <div className="frame-1">
                  <div className="group-1">
                    <div className="flight-number roboto-normal-chicago-21-3px">Tail Number:</div>
                  </div>
                  <div className="group-46">
                    <div className="zz182 roboto-bold-mirage-21-3px">{aircraft.tailNumber}</div>
                  </div>
                </div>

                {/* Serviceable Status — coloured badge matching fleet overview */}
                <div className="frame-119" style={{ alignItems: "center" }}>
                  <div className="group-1-1">
                    <div className="serviceable-status roboto-normal-chicago-21-3px">
                      Serviceable Status:
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      alignSelf: "stretch",
                      paddingLeft: "16px",
                      paddingRight: "16px",
                      borderTopRightRadius: "0.7rem",
                      borderBottomRightRadius: "0.7rem",
                      backgroundColor: statusBg,
                    }}
                  >
                    <span
                      className="roboto-bold-mirage-21-3px font-bold"
                      style={{ color: statusTextColor }}
                    >
                      {status}
                    </span>
                  </div>
                </div>

                {/* Total Flying Hours */}
                <div className="frame-1">
                  <div className="group-1-2">
                    <div className="total-flying-hours roboto-normal-chicago-21-3px">
                      Total flying Hours:
                    </div>
                  </div>
                  <div className="group-46-1">
                    <div className="number roboto-bold-mirage-21-3px">
                      {Math.round(aircraft.currentHours)}
                    </div>
                  </div>
                </div>

                {/* Servicing status — static demo content, forced to its own row */}
                <div className="flex w-full">
                  <div className="servicing-status roboto-normal-chicago-21-3px">
                    Servicing status:
                  </div>
                  <div className="component-1">
                    <div className="overlap-group8">
                      <p className="after-flight-af-2200-013224">
                        <span className="span0">After Flight:</span>
                        <span className="roboto-bold-mirage-21-3px"> AF 22:00 </span>
                        <span className="span2">(01:32:24)</span>
                      </p>
                    </div>
                    <div className="before-flight roboto-normal-mirage-21-3px">Before Flight</div>
                    <div className="turn-around roboto-normal-mirage-21-3px">Turn Around</div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ── Maintenance overview summary + 3D panel ──────────────────── */}
          <div className="overlap-group14">
            <div className="group-1065">
              <div className="frame-container">
                <div className="frame-2-1">
                  <div className="maintenance-overview-1 roboto-bold-black-32px">Maintenance overview</div>
                </div>
                <div className="frame-123-1">
                  <div className="rectangle-151"></div>
                  <div className="group-1-5">
                    <div className="total-tasks roboto-normal-chicago-21-3px">Total tasks:</div>
                  </div>
                  <div className="group-46-5">
                    <div className="number-4 number-17 roboto-bold-mirage-21-3px">
                      {activeTasks.length}
                    </div>
                  </div>
                </div>
                <div className="frame-12">
                  <div className="rectangle-151-1 rectangle-151-4"></div>
                  <div className="group-1-6">
                    <div className="tasks-completed tasks roboto-normal-chicago-21-3px">
                      Tasks completed:
                    </div>
                  </div>
                  <div className="group-46-3">
                    <div className="number-1 number-17 roboto-bold-mirage-21-3px">0</div>
                  </div>
                </div>
                <div className="frame-12">
                  <div className="rectangle-151-2 rectangle-151-4"></div>
                  <div className="group-1-7">
                    <div className="tasks-started tasks roboto-normal-chicago-21-3px">
                      Tasks started:
                    </div>
                  </div>
                  <div className="group-46-3">
                    <div className="number-1 number-17 roboto-bold-mirage-21-3px">
                      {activeTasks.length}
                    </div>
                  </div>
                </div>
                <div className="frame-130">
                  <div className="rectangle-151-3 rectangle-151-4"></div>
                  <div className="group-1-8">
                    <div className="tasks-not-started roboto-normal-chicago-21-3px">
                      Tasks not started:
                    </div>
                  </div>
                  <div className="group-46-3">
                    <div className="number-1 number-17 roboto-bold-mirage-21-3px">0</div>
                  </div>
                </div>
              </div>
              <div className="flex-row-4">
                <div className="task-progress-bar">Task progress bar</div>
                <div className="flex-col-2 flex-col-5">
                  <div className="overlap-group-8">
                    <div className="number-5 number-17">{totalTasks}</div>
                    <div className="rectangle-172"></div>
                    <div className="rectangle-173" style={{ width: `${notStartedPct}%` }}></div>
                    <div className="rectangle-174" style={{ width: `${startedPct}%` }}></div>
                    <img
                      className="line-19"
                      src="/images/maintenance-overview/line-19-4@2x.png"
                      alt="Line 19"
                    />
                    <div className="rectangle-175" style={{ width: `${completedPct}%` }}></div>
                    <div className="number-6 number-17">{completedTasks}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Component Health ─────────────────────────────────────────── */}
            {aircraftHealth.length > 0 && (
              <div style={{ width: '100%', marginTop: '1.5rem', background: '#fdfdfd', borderRadius: '0.7rem', boxShadow: '0px 10px 21px #00000014, 0px 0px 5px #0000000a', padding: '1.2rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                  <span className="roboto-bold-black-32px">Component Health</span>
                </div>
                <div className="overflow-x-auto">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--cloud)' }}>
                        <th className="roboto-normal-mirage-21-3px" style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Component</th>
                        <th className="roboto-normal-mirage-21-3px" style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Status</th>
                        <th className="roboto-normal-mirage-21-3px" style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Maintenance Due</th>
                        <th className="roboto-normal-mirage-21-3px" style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aircraftHealth.map((c, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--cultured-pearl)' }} className="odd:bg-white even:bg-gray-50">
                          <td className="roboto-normal-mirage-21-3px" style={{ padding: '10px 12px', fontWeight: 500 }}>{c.componentName}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              padding: '6px 14px', borderRadius: '5px', fontFamily: 'var(--font-family-roboto)', fontSize: 'var(--font-size-xxl)', fontWeight: 600,
                              background: c.status === 'Critical' ? 'var(--peach-schnapps)' : c.status === 'Warning' ? 'var(--sandy-beach)' : 'var(--madang)',
                              color: c.status === 'Critical' ? 'var(--fuzzy-wuzzy-brown)' : c.status === 'Warning' ? 'var(--buttered-rum)' : 'var(--fern-green)',
                            }}>{c.status}</span>
                          </td>
                          <td className="roboto-normal-chicago-21-3px" style={{ padding: '10px 12px' }}>{c.maintenanceDue}</td>
                          <td className="roboto-normal-chicago-21-3px" style={{ padding: '10px 12px' }}>{c.priorityLevel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="frame-5104-1">
              <div className="bg-white w-6"></div>
              <div className="group-1075">
                <div className="frame-5104-2">
                  <div className="airbus-a400-m-atlas">Airbus A400M Atlas</div>
                </div>
                <div className="real-time-video-maintenance-monitor roboto-normal-white-13-3px">
                  Real-Time Video Maintenance Monitor
                </div>
              </div>
              <div
                className="frame-5021 cursor-pointer"
                onClick={() => setCollapsed((prev) => !prev)}
                role="button"
                tabIndex={0}
                aria-pressed={collapsed}
              >
                <div className="font-medium whitespace-nowrap roboto-normal-white-13-10px relative text-right">
                  {collapsed ? "Expand" : "Collapse"}
                </div>
                <img
                  className="arrow_drop_down"
                  src="/images/maintenance-overview/arrow-drop-down-13@2x.png"
                  alt="arrow_drop_down"
                  style={{
                    transform: collapsed ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                />
              </div>
              <div className="bg-white w-6"></div>
            </div>

            {!collapsed && (
              <div className="frame-5111">
                <div className="frame-5109">
                  <div className="frame-5108">
                    <div className="overlap-group3 roboto-normal-white-13-3px rectangle-2924">
                      <div className="rectangle-2957">
                        <iframe
                          src={typeof window !== 'undefined' && window.location.hostname !== 'localhost'
                            ? 'https://a400-webapp-ercscuhvf3h7ftdw.uksouth-01.azurewebsites.net'
                            : 'http://localhost:3000'}
                          frameBorder="0"
                          width="100%"
                          height="100%"
                          title="Fleet Monitor"
                          allow="accelerometer; gyroscope"
                        />
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="section-divider"></div>

          {/* ── Maintenance scope ────────────────────────────────────────── */}
          <div className="group-1036">
            <div className="wide-flex-row">
              <div className="flex-col-3 flex-col-5">
                <div className="frame-131">
                  <div className="maintenance-scope maintenance roboto-bold-black-32px">
                    Maintenance scope
                  </div>
                </div>
              </div>
              <button className="frame-5105-1" onClick={() => ""}>
                <div className="add-task roboto-bold-white-16px">Add Task</div>
              </button>
            </div>
            <div className="wide-flex-row">
              <div className="overlap-group-10">
                <div className="search">Search</div>
              </div>
              <div className="frame-50">
                <img
                  className="filter_list"
                  src="/images/maintenance-overview/filter-list-1@2x.png"
                  alt="filter_list"
                />
                <div className="filter">Filter</div>
              </div>
              <div className="frame-container-1">
                <div className="frame-51">
                  <img
                    className="format_line_spacing"
                    src="/images/maintenance-overview/format-line-spacing-1@2x.png"
                    alt="format_line_spacing"
                  />
                  <p className="sort-by-latest-task-added">
                    <span className="span0-1">Sort by </span>
                    <span className="span1-1">latest task added</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 w-full pl-6 pr-6">
            {activeBlock ? (
              <table className="min-w-full text-sm w-full table-auto">
                <thead className="group-54-1 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 pt-4 text-black font-bold text-left roboto-normal-mirage-21-3px">
                      Task ID
                    </th>
                    <th className="px-4 pt-4 text-black font-bold text-left roboto-normal-mirage-21-3px">
                      Task Name
                    </th>
                    <th className="px-4 pt-4 text-black font-bold text-left roboto-normal-mirage-21-3px w-1/4 max-w-xs truncate">
                      Task details
                    </th>
                    <th className="px-4 pt-4 text-black font-bold text-left roboto-normal-mirage-21-3px">
                      Trade
                    </th>
                    <th className="px-4 pt-4 text-black font-bold text-left roboto-normal-mirage-21-3px">
                      Assigned person
                    </th>
                    <th className="px-4 pt-4 text-black font-bold text-left roboto-normal-mirage-21-3px">
                      Start date
                    </th>
                    <th className="px-4 pt-4 text-black font-bold text-left roboto-normal-mirage-21-3px">
                      Status
                    </th>
                    <th className="px-2 pt-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {activeBlock.tasks.map((task) => (
                    <tr key={task.taskId} className="odd:bg-white even:bg-gray-50 py-4 w-full">
                      <td className="px-4 py-6 roboto-semi-bold-blueberry-21-3px underline cursor-pointer">
                        {task.taskId}
                      </td>
                      <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                        {task.taskName}
                      </td>
                      <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                        {task.taskDetails}
                      </td>
                      <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                        {task.trade}
                      </td>
                      <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                        {task.assignedPerson}
                      </td>
                      <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                        {formatDateShort(activeBlock.scheduleStartDate)}
                      </td>
                      <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                        <div className="frame-237">
                          <div className="started">Started</div>
                        </div>
                      </td>
                      <td>
                        <button className="hover:bg-gray-200 rounded p-1">
                          <img
                            alt="menu"
                            height={30}
                            width={30}
                            src="/images/maintenance-overview/more_vert.svg"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center roboto-normal-mirage-21-3px text-gray-500">
                No active maintenance block — this aircraft is not currently in maintenance.
              </div>
            )}
          </div>

          {/* ── Upcoming maintenance + Scheduled flights ─────────────────── */}
          <div className="frame-5120">
            <div className="frame-5119">

              {/* Upcoming maintenance — Tailwind cards with popup on click */}
              <div className="frame-511">
                <div className="frame-5112">
                  <div className="upcoming-maintenance roboto-bold-black-32px">
                    Upcoming maintenance
                  </div>
                </div>

                <AlertDialog.Root
                  open={selectedBlock !== null}
                  onOpenChange={(open) => { if (!open) setSelectedBlock(null); }}
                >
                  <div className="flex flex-wrap gap-4 py-2">
                    {upcomingBlocks.length > 0 ? (
                      upcomingBlocks.map((block) => (
                        <AlertDialog.Trigger asChild key={block.id}>
                          <button
                            onClick={() => setSelectedBlock(block)}
                            className="flex flex-col gap-2 bg-white rounded-xl shadow-md border border-gray-200 px-5 py-4 min-w-[260px] max-w-xs text-left hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative w-9 h-9 rounded-full bg-gray-200 flex-shrink-0">
                                <img
                                  src="/images/maintenance-overview/wrench-1@2x.png"
                                  alt="Wrench"
                                  className="absolute inset-0 m-auto w-5 h-5 object-contain"
                                />
                              </div>
                              <span className="roboto-bold-sapphire-24px text-[15px] font-bold text-[#1b2e6e] break-all leading-tight">
                                {block.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 pl-1">
                              <span
                                className="text-[13px] font-semibold px-2 py-0.5 rounded"
                                style={{
                                  backgroundColor: block.type === "In-Depth" ? "#e8e6ff" : "#fff3e0",
                                  color: block.type === "In-Depth" ? "#4a3fb5" : "#a0700e",
                                }}
                              >
                                {block.type}
                              </span>
                              <span className="roboto-normal-cape-cod-18-7px text-[14px] text-gray-600">
                                {formatBlockDate(block.scheduleStartDate)}
                              </span>
                            </div>
                          </button>
                        </AlertDialog.Trigger>
                      ))
                    ) : (
                      <p className="roboto-normal-cape-cod-18-7px text-gray-500 py-4">
                        No upcoming maintenance scheduled.
                      </p>
                    )}
                  </div>

                  <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
                    <AlertDialog.Content className="fixed inset-10 z-50 overflow-hidden">
                      <AlertDialog.Title className="sr-only">Task Details</AlertDialog.Title>
                      <div className="bg-white rounded-lg shadow-lg w-full h-full flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                          <h2 className="text-[26px] pl-3 font-bold text-black leading-normal">
                            Task Details
                          </h2>
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
                                <path d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </AlertDialog.Cancel>
                        </div>
                        <hr className="border-t" />
                        <div className="pt-6 overflow-y-auto flex-1">
                          {selectedBlock && (
                            <PartsMaintenanceTaskList
                              aircraftTailNumber={aircraft.tailNumber}
                              maintenanceId={selectedBlock.id}
                              maintenanceType={selectedBlock.type}
                              aircraftStatus={status}
                              scheduleStartDate={selectedBlock.scheduleStartDate}
                              scheduleEndDate={selectedBlock.scheduleEndDate}
                              scheduleStartTime={selectedBlock.scheduleStartTime}
                              scheduleEndTime={selectedBlock.scheduleEndTime}
                              durationHours={selectedBlock.durationHours}
                              currentHours={aircraft.currentHours}
                              tasks={selectedBlock.tasks}
                              onClose={() => setSelectedBlock(null)}
                            />
                          )}
                        </div>
                      </div>
                    </AlertDialog.Content>
                  </AlertDialog.Portal>
                </AlertDialog.Root>
              </div>

              {/* Scheduled flights — Tailwind cards with real route data */}
              <div className="frame-511">
                <div className="frame-5112">
                  <div className="scheduled-flights roboto-bold-black-32px">Scheduled flights</div>
                </div>
                <div className="flex flex-wrap gap-6 py-2">
                  {upcomingRoutes.length > 0 ? (
                    upcomingRoutes.map((legs, i) => (
                      <FlightCard key={`route-${i}`} legs={legs} />
                    ))
                  ) : (
                    <p className="roboto-normal-cape-cod-18-7px text-gray-500 py-4">
                      No upcoming flights scheduled.
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
      </div>
    </>
  );
}
