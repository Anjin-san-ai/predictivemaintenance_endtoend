"use client";

import Header from "@/components/Header/index";

import "./maintenance-overview.css";
import "./styleguide.css";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getA400IndexForTail } from "@/utils/a400Bridge";

interface ComponentHealth {
  componentName: string;
  status: string;
  maintenanceDue: string;
  priorityLevel: string;
  descriptionText: string;
}

function AircraftMaintenanceContent() {
  const [collapsed, setCollapsed] = useState(false);
  const [aircraftHealth, setAircraftHealth] = useState<ComponentHealth[]>([]);
  const [worstStatus, setWorstStatus] = useState<string>('');
  const router = useRouter();
  const tailNumber = useSearchParams().get('tailNumber');

  useEffect(() => {
    if (!tailNumber) return;
    fetch('/api/fleet-health')
      .then(r => r.json())
      .then(data => {
        if (data.error || !data.aircraft) return;
        const idx = getA400IndexForTail(tailNumber) % data.aircraft.length;
        const ac = data.aircraft[idx];
        if (ac) {
          setAircraftHealth(ac.components || []);
          setWorstStatus(ac.worstStatus || 'Good');
        }
      })
      .catch(() => {});
  }, [tailNumber]);

  return (
     <>
      <Header />
      <div className="flex w-full h-full">
        <div className="maintenance-overview screen">
          <div className="frame-5124">
            <button className="group-1047" onClick={() => router.push("/")}>
              <img src="/images/maintenance-overview/arrow-back-1@2x.png" />
            </button>
            <div className="group-1047-1">
              <div className="frame-2">
                <h1 className="title roboto-bold-mirage-21-3px">
                  Aircraft Details : {tailNumber}
                </h1>
              </div>
            </div>
          </div>

          <div className="overlap-group16">
            <div className="frame-512">
              <div className="frame-124">
                <div className="frame-1">
                  <div className="group-1">
                    <div className="flight-number roboto-normal-chicago-21-3px">
                      Tail Number:
                    </div>
                  </div>
                  <div className="group-46">
                    <div className="zz182 roboto-bold-mirage-21-3px">{tailNumber}</div>
                  </div>
                </div>
                <div className="frame-119">
                  <div className="group-1-1">
                    <div className="serviceable-status roboto-normal-chicago-21-3px">
                      Serviceable Status:
                    </div>
                  </div>
                  <div className="frame-123">
                    <div className="in-maintenance roboto-bold-mirage-21-3px">
                      In-maintenance
                    </div>
                  </div>
                </div>
                <div className="frame-1">
                  <div className="group-1-2">
                    <div className="total-flying-hours roboto-normal-chicago-21-3px">
                      Total flying Hours:
                    </div>
                  </div>
                  <div className="group-46-1">
                    <div className="number roboto-bold-mirage-21-3px">4250</div>
                  </div>
                </div>
                <div className="frame-1">
                  <div className="group-1-3">
                    <div className="maintenance-id maintenance roboto-normal-chicago-21-3px">
                      Maintenance ID:
                    </div>
                  </div>
                  <div className="group-46-1">
                    <div className="number roboto-bold-mirage-21-3px">1234</div>
                  </div>
                </div>
                <div className="frame-1">
                  <div className="group-1-4">
                    <div className="date-created date-2 roboto-normal-chicago-21-3px">
                      Date created:
                    </div>
                  </div>
                  <div className="group-46-2">
                    <div className="address roboto-bold-mirage-21-3px">
                      06 Aug, 2025
                    </div>
                  </div>
                </div>

                <div className="flex">
                  <div className="servicing-status roboto-normal-chicago-21-3px">
                    Servicing status:
                  </div>
                  <div className="component-1">
                    <div className="overlap-group8">
                      <p className="after-flight-af-2200-013224">
                        <span className="span0">After Flight:</span>
                        <span className="roboto-bold-mirage-21-3px">
                          {" "}
                          AF 22:00{" "}
                        </span>
                        <span className="span2">(01:32:24)</span>
                      </p>
                    </div>
                    <div className="before-flight roboto-normal-mirage-21-3px">
                      Before Flight
                    </div>
                    <div className="turn-around roboto-normal-mirage-21-3px">
                      Turn Around
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Dynamic Fleet Health for this aircraft */}
          {aircraftHealth.length > 0 && (
            <div style={{ margin: '0 20px 16px', padding: '14px 18px', background: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#101b34' }}>Component Health — {tailNumber}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700,
                  background: worstStatus === 'Critical' ? 'rgba(255,71,87,0.12)' : worstStatus === 'Warning' ? 'rgba(255,165,2,0.12)' : 'rgba(46,213,115,0.12)',
                  color: worstStatus === 'Critical' ? '#ff4757' : worstStatus === 'Warning' ? '#ffa502' : '#2ed573',
                  border: `1px solid ${worstStatus === 'Critical' ? 'rgba(255,71,87,0.4)' : worstStatus === 'Warning' ? 'rgba(255,165,2,0.4)' : 'rgba(46,213,115,0.4)'}`,
                }}>{worstStatus}</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f5f7fa', borderBottom: '1px solid #e0e0e0' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Component</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Status</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Maintenance Due</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aircraftHealth.map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>{c.componentName}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                            background: c.status === 'Critical' ? 'rgba(255,71,87,0.1)' : c.status === 'Warning' ? 'rgba(255,165,2,0.1)' : 'rgba(46,213,115,0.1)',
                            color: c.status === 'Critical' ? '#ff4757' : c.status === 'Warning' ? '#ffa502' : '#2ed573',
                          }}>{c.status}</span>
                        </td>
                        <td style={{ padding: '8px 12px', color: '#666' }}>{c.maintenanceDue}</td>
                        <td style={{ padding: '8px 12px', color: '#666' }}>{c.priorityLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="overlap-group14">
            <div className="group-1065">
              <div className="frame-container">
                <div className="frame-2-1">
                  <div className="maintenance-overview-1 roboto-bold-black-32px">
                    Maintenance overview
                  </div>
                </div>
                <div className="frame-123-1">
                  <div className="rectangle-151"></div>
                  <div className="group-1-5">
                    <div className="total-tasks roboto-normal-chicago-21-3px">
                      Total tasks:
                    </div>
                  </div>
                  <div className="group-46-5">
                    <div className="number-4 number-17 roboto-bold-mirage-21-3px">
                      10
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
                    <div className="number-1 number-17 roboto-bold-mirage-21-3px">
                      2
                    </div>
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
                      4
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
                    <div className="number-1 number-17 roboto-bold-mirage-21-3px">
                      4
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-row-4">
                <div className="task-progress-bar">Task progress bar</div>
                <div className="flex-col-2 flex-col-5">
                  <div className="overlap-group-8">
                    <div className="number-5 number-17">10</div>
                    <div className="rectangle-172"></div>
                    <div className="rectangle-173"></div>
                    <div className="rectangle-174"></div>
                    <img
                      className="line-19"
                      src="/images/maintenance-overview/line-19-4@2x.png"
                      alt="Line 19"
                    />
                    <div className="rectangle-175"></div>
                    <div className="number-6 number-17">0</div>
                  </div>
                </div>
              </div>
            </div>
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
                onMouseOver={() => {}}
                role="button"
                tabIndex={0}
                aria-pressed={collapsed}
              >
                <div className="font-medium whitespace-nowrap roboto-normal-white-13-10px relative text-right ">
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
                        ></iframe>
                      </div>

                      <div className="frame-5102">
                        <div className="frame-5112-1 roboto-bold-white-18-7px">
                          <div className="tasks-03 tasks">Tasks (03)</div>
                          <p className="port-out-engine-oil">
                            <span className="roboto-bold-white-18-7px">
                              Port Out Engine{" "}
                            </span>
                            <span className="span1">
                              Oil pressure slightly below optimal range.
                              Scheduled maintenance required for filter
                              replacement and oil analysis.
                            </span>
                          </p>
                          <div className="frame-5103 roboto-normal-white-13-3px">
                            <div className="frame-5104">
                              <div className="exeral-visual-inspection-12456 roboto-bold-neon-carrot-18-7px">
                                Exeral Visual Inspection <br />
                                (12456)
                              </div>
                            </div>
                            <div className="frame-5105">
                              <div className="frame-5089">
                                <img
                                  className="x24px-ic_warning"
                                  src="/images/maintenance-overview/24px---ic-warning-4@2x.png"
                                  alt="24px/ic_warning"
                                />
                              </div>
                              <div className="critical-high roboto-bold-white-16px">
                                Critical: High
                              </div>
                            </div>
                            <div className="component-turboprop-engine-2">
                              <span className="roboto-normal-white-13-3px">
                                Component:{" "}
                              </span>
                              <span className="roboto-bold-white-13-3px">
                                Turboprop Engine #2
                              </span>
                            </div>
                            <div className="next-maintenance-15-days">
                              <span className="roboto-normal-white-13-3px">
                                Next Maintenance:{" "}
                              </span>
                              <span className="roboto-bold-white-13-3px">
                                15 Days
                              </span>
                            </div>
                            <div className="priority-medium">
                              <span className="roboto-normal-white-13-3px">
                                Priority:{" "}
                              </span>
                              <span className="roboto-bold-white-13-3px">
                                Medium
                              </span>
                            </div>
                            <p className="check-and-top-up-cil-1 check-and-top-up-cil-4">
                              Check and top up cil, hydraulic, brake, and
                              coolant luids.
                            </p>
                          </div>
                          <div className="frame-510 roboto-normal-white-13-3px">
                            <div className="frame-5104">
                              <p className="internal-cabin-and-c roboto-bold-neon-carrot-18-7px">
                                Internal Cabin and Cockpit Inspection (344456)
                              </p>
                            </div>
                            <div className="frame-5105">
                              <div className="frame-5089">
                                <img
                                  className="x24px-ic_warning"
                                  src="/images/maintenance-overview/24px---ic-warning-5@2x.png"
                                  alt="24px / ic_warning"
                                />
                              </div>
                              <div className="critical-high roboto-bold-white-16px">
                                Critical: High
                              </div>
                            </div>
                            <div className="component-turboprop-engine-2-5">
                              <span className="roboto-normal-white-13-3px">
                                Component:{" "}
                              </span>
                              <span className="roboto-bold-white-13-3px">
                                Turboprop Engine #2
                              </span>
                            </div>
                            <div className="next-maintenance-15-days-5">
                              <span className="roboto-normal-white-13-3px">
                                Next Maintenance:{" "}
                              </span>
                              <span className="roboto-bold-white-13-3px">
                                15 Days
                              </span>
                            </div>
                            <div className="priority-medium-5">
                              <span className="roboto-normal-white-13-3px">
                                Priority:{" "}
                              </span>
                              <span className="roboto-bold-white-13-3px">
                                Medium
                              </span>
                            </div>
                            <p className="oil-pressure-slightl">
                              Oil pressure slightly below optimal range.
                              Scheduled maintenance required for filter
                              replacement and oil analysis.
                            </p>
                          </div>
                          <div className="frame-510 roboto-normal-white-13-3px">
                            <div className="frame-5104">
                              <div className="engine-system-checks-65321 roboto-bold-neon-carrot-18-7px">
                                Engine System Checks (65321)
                              </div>
                            </div>
                            <div className="frame-5105">
                              <div className="frame-5089">
                                <img
                                  className="x24px-ic_warning-3"
                                  src="/images/maintenance-overview/24px---ic-warning-6@2x.png"
                                  alt="24px / ic_warning"
                                />
                              </div>
                              <div className="critical-high roboto-bold-white-16px">
                                Critical: High
                              </div>
                            </div>
                            <div className="component-turboprop-engine-2-5">
                              <span className="roboto-normal-white-13-3px">
                                Component:{" "}
                              </span>
                              <span className="roboto-bold-white-13-3px">
                                Turboprop Engine #2
                              </span>
                            </div>
                            <div className="next-maintenance-15-days-5">
                              <span className="roboto-normal-white-13-3px">
                                Next Maintenance:{" "}
                              </span>
                              <span className="roboto-bold-white-13-3px">
                                15 Days
                              </span>
                            </div>
                            <div className="priority-medium-5">
                              <span className="roboto-normal-white-13-3px">
                                Priority:{" "}
                              </span>
                              <span className="roboto-bold-white-13-3px">
                                Medium
                              </span>
                            </div>
                            <p className="oil-pressure-slightl-4">
                              Oil pressure slightly below optimal range.
                              Scheduled maintenance required for filter
                              replacement and oil analysis.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="section-divider"></div>
          <div className="group-1036">
            <div className="wide-flex-row">
              <div className="flex-col-3 flex-col-5">
                <div className="frame-131">
                  <div className="maintenance-scope maintenance roboto-bold-black-32px">
                    Maintenance scope
                  </div>
                </div>
              </div>
              <button
                className="frame-5105-1"
                onClick={() => ""}
                onMouseOver={() => ""}
              >
                <div className="add-task roboto-bold-white-18-7px">
                  Add Task
                </div>
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
                {/* Example row, repeat for each task */}
                <tr className="odd:bg-white even:bg-gray-50 py-4 w-full">
                  <td className="px-4 py-6 roboto-semi-bold-blueberry-21-3px underline cursor-pointer">
                    12456
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    Exeral Visual Inspection
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    Check and top up oil, hydraulic, brake, and coolant luids.
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Mechanical
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Antonio Hoeger
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    03.11.2025
                  </td>
                  <td className="py-2 mt-2 text-black absolute roboto-normal-mirage-21-3px">
                    <div className="frame-248">
                      <div className="completed">Completed</div>
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
                <tr className="odd:bg-white even:bg-gray-100 w-full">
                  <td className="px-4 py-6 roboto-semi-bold-blueberry-21-3px underline cursor-pointer">
                    344456
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    Internal Cabin and Cockpit Inspection
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    Check and top up oil, hydraulic, brake, and coolant luids.
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Avionic
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Christina Beer
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    09.12.2025
                  </td>
                  <td className=" text-black absolute roboto-normal-mirage-21-3px">
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
                <tr className="odd:bg-white even:bg-gray-100 w-full">
                  <td className="px-4 py-6 roboto-semi-bold-blueberry-21-3px underline cursor-pointer">
                    65321
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    Engine System Checks
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    BITE tests, verly radios, GPS, radar, calbrate instruments.
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Mechanical
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Jody Roberts
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px"></td>
                  <td className=" text-black absolute roboto-normal-mirage-21-3px">
                    <div className="frame-249">
                      <div className="not-started">Not-started</div>
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
                <tr className="odd:bg-white even:bg-gray-100 w-full">
                  <td className="px-4 py-6 roboto-semi-bold-blueberry-21-3px underline cursor-pointer">
                    344456
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    Internal Cabin and Cockpit Inspection
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    Check and top up oil, hydraulic, brake, and coolant luids.
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Avionic
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Christina Beer
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px"></td>
                  <td className=" text-black absolute roboto-normal-mirage-21-3px">
                    <div className="frame-249">
                      <div className="not-started">Not-started</div>
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
                <tr className="odd:bg-white even:bg-gray-100 w-full">
                  <td className="px-4 py-6 roboto-semi-bold-blueberry-21-3px underline cursor-pointer">
                    65321
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    Engine System Checks
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    BITE tests, verly radios, GPS, radar, calbrate instruments.
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Mechanical
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Jody Roberts
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px"></td>
                  <td className=" text-black absolute roboto-normal-mirage-21-3px">
                    <div className="frame-249">
                      <div className="not-started">Not-started</div>
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
                <tr className="odd:bg-white even:bg-gray-100 w-full">
                  <td className="px-4 py-6 roboto-semi-bold-blueberry-21-3px underline cursor-pointer">
                    344456
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    Internal Cabin and Cockpit Inspection
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    Check and top up oil, hydraulic, brake, and coolant luids.
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Avionic
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Christina Beer
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px"></td>
                  <td className=" text-black absolute roboto-normal-mirage-21-3px">
                    <div className="frame-249">
                      <div className="not-started">Not-started</div>
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
                <tr className="odd:bg-white even:bg-gray-100 w-full">
                  <td className="px-4 py-6 roboto-semi-bold-blueberry-21-3px underline cursor-pointer">
                    65321
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    Engine System Checks
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    BITE tests, verly radios, GPS, radar, calbrate instruments.
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Mechanical
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Jody Roberts
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px"></td>
                  <td className=" text-black absolute roboto-normal-mirage-21-3px">
                    <div className="frame-249">
                      <div className="not-started">Not-started</div>
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
                <tr className="odd:bg-white even:bg-gray-100 w-full">
                  <td className="px-4 py-6 roboto-semi-bold-blueberry-21-3px underline cursor-pointer">
                    344456
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    Internal Cabin and Cockpit Inspection
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    Check and top up oil, hydraulic, brake, and coolant luids.
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Avionic
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Christina Beer
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px"></td>
                  <td className=" text-black absolute roboto-normal-mirage-21-3px">
                    <div className="frame-249">
                      <div className="not-started">Not-started</div>
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
                <tr className="odd:bg-white even:bg-gray-100 w-full">
                  <td className="px-4 py-6 roboto-semi-bold-blueberry-21-3px underline cursor-pointer">
                    65321
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    Engine System Checks
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    BITE tests, verly radios, GPS, radar, calbrate instruments.
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Mechanical
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Jody Roberts
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px"></td>
                  <td className=" text-black absolute roboto-normal-mirage-21-3px">
                    <div className="frame-249">
                      <div className="not-started">Not-started</div>
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
                <tr className="odd:bg-white even:bg-gray-100 w-full">
                  <td className="px-4 py-6 roboto-semi-bold-blueberry-21-3px underline cursor-pointer">
                    344456
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    Internal Cabin and Cockpit Inspection
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    Check and top up oil, hydraulic, brake, and coolant luids.
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Avionic
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Christina Beer
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px"></td>
                  <td className=" text-black absolute roboto-normal-mirage-21-3px">
                    <div className="frame-249">
                      <div className="not-started">Not-started</div>
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
                <tr className="odd:bg-white even:bg-gray-100 w-full">
                  <td className="px-4 py-6 roboto-semi-bold-blueberry-21-3px underline cursor-pointer">
                    65321
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    Engine System Checks
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    BITE tests, verly radios, GPS, radar, calbrate instruments.
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Mechanical
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Jody Roberts
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px"></td>
                  <td className=" text-black absolute roboto-normal-mirage-21-3px">
                    <div className="frame-249">
                      <div className="not-started">Not-started</div>
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
                <tr className="odd:bg-white even:bg-gray-100 w-full">
                  <td className="px-4 py-6 roboto-semi-bold-blueberry-21-3px underline cursor-pointer">
                    344456
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    Internal Cabin and Cockpit Inspection
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px w-1/6 max-w-xs">
                    Check and top up oil, hydraulic, brake, and coolant luids.
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Avionic
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px">
                    Christina Beer
                  </td>
                  <td className="px-4 py-2 text-black roboto-normal-mirage-21-3px"></td>
                  <td className=" text-black absolute roboto-normal-mirage-21-3px">
                    <div className="frame-249">
                      <div className="not-started">Not-started</div>
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
              </tbody>
            </table>
          </div>
          <div className="frame-5120">
            <div className="frame-5119">
              <div className="frame-511">
                <div className="frame-5112">
                  <div className="upcoming-maintenance roboto-bold-black-32px">
                    Upcoming maintenance
                  </div>
                </div>
                <div className="frame-5116">
                  <div className="group-104">
                    <div className="overlap-group">
                      <div className="flex-row flex">
                        <div className="group-1041">
                          <img
                            className="wrench"
                            src="/images/maintenance-overview/wrench-1@2x.png"
                            alt="Wrench"
                          />
                        </div>
                        <div className="number-8 number-17 roboto-bold-sapphire-24px">
                          12345
                        </div>
                      </div>
                      <div className="address-1 address-11 roboto-normal-cape-cod-18-7px">
                        15 Sep 25 (Mon)
                      </div>
                    </div>
                  </div>
                  <div className="group-104">
                    <div className="overlap-group-1">
                      <div className="flex-row-1">
                        <div className="group-1041">
                          <img
                            className="wrench-1 wrench-5"
                            src="/images/maintenance-overview/wrench-1@2x.png"
                            alt="Wrench"
                          />
                        </div>
                        <div className="number-9 number-17 roboto-bold-sapphire-24px">
                          12346
                        </div>
                      </div>
                      <div className="address-2 address-11 roboto-normal-cape-cod-18-7px">
                        17 Nov 25 (Mon)
                      </div>
                    </div>
                  </div>
                  <div className="group-104">
                    <div className="overlap-group-2">
                      <div className="flex-row-2">
                        <div className="group-1041">
                          <img
                            className="wrench-2 wrench-5"
                            src="/images/maintenance-overview/wrench-1@2x.png"
                            alt="Wrench"
                          />
                        </div>
                        <div className="number-10 number-17 roboto-bold-sapphire-24px">
                          12347
                        </div>
                      </div>
                      <div className="address-7 address-11 roboto-normal-cape-cod-18-7px">
                        19 Jan 26 (Mon)
                      </div>
                    </div>
                  </div>
                  <div className="group-104">
                    <div className="overlap-group-1">
                      <div className="flex-row-1">
                        <div className="group-1041">
                          <img
                            className="wrench-2 wrench-5"
                            src="/images/maintenance-overview/wrench-1@2x.png"
                            alt="Wrench"
                          />
                        </div>
                        <div className="number-11 number-17 roboto-bold-sapphire-24px">
                          12348
                        </div>
                      </div>
                      <div className="address-2 address-11 roboto-normal-cape-cod-18-7px">
                        16 Mar 26 (Mon)
                      </div>
                    </div>
                  </div>
                  <div className="group-104">
                    <div className="overlap-group4-1">
                      <div className="flex-row-7">
                        <div className="group-1041">
                          <img
                            className="wrench-1 wrench-5"
                            src="/images/maintenance-overview/wrench-1@2x.png"
                            alt="Wrench"
                          />
                        </div>
                        <div className="number-12 number-17 roboto-bold-sapphire-24px">
                          12349
                        </div>
                      </div>
                      <div className="address-8 address-11 roboto-normal-cape-cod-18-7px">
                        18 May 26 (Mon)
                      </div>
                    </div>
                  </div>
                  <div className="group-104">
                    <div className="overlap-group-2">
                      <div className="flex-row-2">
                        <div className="group-1041">
                          <img
                            className="wrench"
                            src="/images/maintenance-overview/wrench-1@2x.png"
                            alt="Wrench"
                          />
                        </div>
                        <div className="number-13 number-17 roboto-bold-sapphire-24px">
                          12350
                        </div>
                      </div>
                      <div className="address-9 address-11 roboto-normal-cape-cod-18-7px">
                        13 Jul 26 (Mon)
                      </div>
                    </div>
                  </div>
                  <div className="group-104">
                    <div className="overlap-group">
                      <div className="flex-row flex">
                        <div className="group-1041">
                          <img
                            className="wrench"
                            src="/images/maintenance-overview/wrench-1@2x.png"
                            alt="Wrench"
                          />
                        </div>
                        <div className="number-14 number-17 roboto-bold-sapphire-24px">
                          12351
                        </div>
                      </div>
                      <div className="address-1 address-11 roboto-normal-cape-cod-18-7px">
                        14 Sep 26 (Mon)
                      </div>
                    </div>
                  </div>
                  <div className="group-104">
                    <div className="overlap-group-1">
                      <div className="flex-row-1">
                        <div className="group-1041">
                          <img
                            className="wrench-3 wrench-5"
                            src="/images/maintenance-overview/wrench-1@2x.png"
                            alt="Wrench"
                          />
                        </div>
                        <div className="number-15 number-17 roboto-bold-sapphire-24px">
                          12355
                        </div>
                      </div>
                      <div className="address-2 address-11 roboto-normal-cape-cod-18-7px">
                        16 Nov 26 (Mon)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="frame-511">
                <div className="frame-5112">
                  <div className="scheduled-flights roboto-bold-black-32px">
                    Scheduled flights
                  </div>
                </div>
                <div className="frame-5116">
                  <div className="group-10">
                    <div className="group-1050-1 group-1050-6">
                      <div className="overlap-group1-1">
                        <img
                          className="line-15"
                          src="/images/maintenance-overview/line-15-7@2x.png"
                          alt="Line 15"
                        />
                        <div className="ellipse-8"></div>
                        <div className="ellipse-9"></div>
                        <img
                          className="airplane-landing"
                          src="/images/maintenance-overview/airplane-landing-1@2x.png"
                          alt="Airplane Landing"
                        />
                        <img
                          className="airplane-take-off"
                          src="/images/maintenance-overview/airplane-take-off-1@2x.png"
                          alt="Airplane Take Off"
                        />
                      </div>
                      <div className="flex-col-4 flex-col-5 roboto-bold-sapphire-24px">
                        <div className="bzn-akt">BZN-AKT</div>
                        <div className="group-272-1 roboto-normal-cape-cod-18-7px">
                          <div className="address-3 address-11">
                            01 Sep 25, 18:00
                          </div>
                          <div className="group-267-3 group-267-5">
                            <div className="overlap-group-3">
                              <img
                                className="line-16"
                                src="/images/maintenance-overview/line-16-14@2x.png"
                                alt="Line 16"
                              />
                              <div className="ellipse-13"></div>
                              <div className="ellipse-14"></div>
                            </div>
                          </div>
                          <div className="address-4 address-11">
                            01 Sep 25, 20:00
                          </div>
                        </div>
                        <div className="akt-bzn">AKT - BZN</div>
                        <div className="group-271-1 roboto-normal-cape-cod-18-7px">
                          <div className="address-3 address-11">
                            03 Sep 25, 11:00
                          </div>
                          <div className="group-267-4 group-267-5">
                            <div className="overlap-group-4">
                              <img
                                className="line-16"
                                src="/images/maintenance-overview/line-16-15@2x.png"
                                alt="Line 16"
                              />
                              <div className="ellipse-13"></div>
                              <div className="ellipse-14"></div>
                            </div>
                          </div>
                          <div className="address-4 address-11">
                            03 Sep 25, 13:00
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="group-10">
                    <div className="group-1050">
                      <div className="overlap-group1-1">
                        <img
                          className="line-15"
                          src="/images/maintenance-overview/line-15-7@2x.png"
                          alt="Line 15"
                        />
                        <div className="ellipse-8"></div>
                        <div className="ellipse-9"></div>
                        <img
                          className="airplane-landing"
                          src="/images/maintenance-overview/airplane-landing-1@2x.png"
                          alt="Airplane Landing"
                        />
                        <img
                          className="airplane-take-off"
                          src="/images/maintenance-overview/airplane-take-off-1@2x.png"
                          alt="Airplane Take Off"
                        />
                      </div>
                      <div className="flex-col flex roboto-bold-sapphire-24px">
                        <div className="bzn-akt-7">BZN-AKT</div>
                        <div className="group-272 roboto-normal-cape-cod-18-7px">
                          <div className="address-5 address-11">
                            14 Aug 25, 18:00
                          </div>
                          <div className="group-267">
                            <div className="overlap-group-3">
                              <img
                                className="line-16"
                                src="/images/maintenance-overview/line-16-14@2x.png"
                                alt="Line 16"
                              />
                              <div className="ellipse-13"></div>
                              <div className="ellipse-14"></div>
                            </div>
                          </div>
                          <div className="address-6 address-11">
                            14 Aug 25, 20:00
                          </div>
                        </div>
                        <div className="akt-bzn">AKT - BZN</div>
                        <div className="group-271 roboto-normal-cape-cod-18-7px">
                          <div className="address-5 address-11">
                            15 Aug 25, 11:00
                          </div>
                          <div className="group-267-1 group-267-5">
                            <div className="overlap-group-4">
                              <img
                                className="line-16"
                                src="/images/maintenance-overview/line-16-15@2x.png"
                                alt="Line 16"
                              />
                              <div className="ellipse-13"></div>
                              <div className="ellipse-14"></div>
                            </div>
                          </div>
                          <div className="address-6 address-11">
                            15 Aug 25, 13:00
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="group-10">
                    <div className="group-1050">
                      <div className="overlap-group1-1">
                        <img
                          className="line-15"
                          src="/images/maintenance-overview/line-15-7@2x.png"
                          alt="Line 15"
                        />
                        <div className="ellipse-8"></div>
                        <div className="ellipse-9"></div>
                        <img
                          className="airplane-landing"
                          src="/images/maintenance-overview/airplane-landing-1@2x.png"
                          alt="Airplane Landing"
                        />
                        <img
                          className="airplane-take-off"
                          src="/images/maintenance-overview/airplane-take-off-1@2x.png"
                          alt="Airplane Take Off"
                        />
                      </div>
                      <div className="flex-col flex roboto-bold-sapphire-24px">
                        <div className="bzn-akt-7">BZN-AKT</div>
                        <div className="group-272 roboto-normal-cape-cod-18-7px">
                          <div className="address-5 address-11">
                            14 Aug 25, 18:00
                          </div>
                          <div className="group-267">
                            <div className="overlap-group-3">
                              <img
                                className="line-16"
                                src="/images/maintenance-overview/line-16-14@2x.png"
                                alt="Line 16"
                              />
                              <div className="ellipse-13"></div>
                              <div className="ellipse-14"></div>
                            </div>
                          </div>
                          <div className="address-6 address-11">
                            14 Aug 25, 20:00
                          </div>
                        </div>
                        <div className="akt-bzn">AKT - BZN</div>
                        <div className="group-271 roboto-normal-cape-cod-18-7px">
                          <div className="address-5 address-11">
                            15 Aug 25, 11:00
                          </div>
                          <div className="group-267-1 group-267-5">
                            <div className="overlap-group-4">
                              <img
                                className="line-16"
                                src="/images/maintenance-overview/line-16-15@2x.png"
                                alt="Line 16"
                              />
                              <div className="ellipse-13"></div>
                              <div className="ellipse-14"></div>
                            </div>
                          </div>
                          <div className="address-6 address-11">
                            15 Aug 25, 13:00
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="group-10">
                    <div className="group-1050-2 group-1050-6">
                      <div className="overlap-group1-1">
                        <img
                          className="line-15"
                          src="/images/maintenance-overview/line-15-7@2x.png"
                          alt="Line 15"
                        />
                        <div className="ellipse-8"></div>
                        <div className="ellipse-9"></div>
                        <img
                          className="airplane-landing"
                          src="/images/maintenance-overview/airplane-landing-1@2x.png"
                          alt="Airplane Landing"
                        />
                        <img
                          className="airplane-take-off"
                          src="/images/maintenance-overview/airplane-take-off-1@2x.png"
                          alt="Airplane Take Off"
                        />
                      </div>
                      <div className="flex-col flex roboto-bold-sapphire-24px">
                        <div className="bzn-akt-7">BZN-AKT</div>
                        <div className="group-272 roboto-normal-cape-cod-18-7px">
                          <div className="address-5 address-11">
                            14 Aug 25, 18:00
                          </div>
                          <div className="group-267">
                            <div className="overlap-group-3">
                              <img
                                className="line-16"
                                src="/images/maintenance-overview/line-16-14@2x.png"
                                alt="Line 16"
                              />
                              <div className="ellipse-13"></div>
                              <div className="ellipse-14"></div>
                            </div>
                          </div>
                          <div className="address-6 address-11">
                            14 Aug 25, 20:00
                          </div>
                        </div>
                        <div className="akt-bzn">AKT - BZN</div>
                        <div className="group-271 roboto-normal-cape-cod-18-7px">
                          <div className="address-5 address-11">
                            15 Aug 25, 11:00
                          </div>
                          <div className="group-267-1 group-267-5">
                            <div className="overlap-group-4">
                              <img
                                className="line-16"
                                src="/images/maintenance-overview/line-16-15@2x.png"
                                alt="Line 16"
                              />
                              <div className="ellipse-13"></div>
                              <div className="ellipse-14"></div>
                            </div>
                          </div>
                          <div className="address-6 address-11">
                            15 Aug 25, 13:00
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="group-10">
                    <div className="group-1050">
                      <div className="overlap-group1-1">
                        <img
                          className="line-15"
                          src="/images/maintenance-overview/line-15-7@2x.png"
                          alt="Line 15"
                        />
                        <div className="ellipse-8"></div>
                        <div className="ellipse-9"></div>
                        <img
                          className="airplane-landing"
                          src="/images/maintenance-overview/airplane-landing-1@2x.png"
                          alt="Airplane Landing"
                        />
                        <img
                          className="airplane-take-off"
                          src="/images/maintenance-overview/airplane-take-off-1@2x.png"
                          alt="Airplane Take Off"
                        />
                      </div>
                      <div className="flex-col flex roboto-bold-sapphire-24px">
                        <div className="bzn-akt-7">BZN-AKT</div>
                        <div className="group-272 roboto-normal-cape-cod-18-7px">
                          <div className="address-5 address-11">
                            14 Aug 25, 18:00
                          </div>
                          <div className="group-267">
                            <div className="overlap-group-3">
                              <img
                                className="line-16"
                                src="/images/maintenance-overview/line-16-14@2x.png"
                                alt="Line 16"
                              />
                              <div className="ellipse-13"></div>
                              <div className="ellipse-14"></div>
                            </div>
                          </div>
                          <div className="address-6 address-11">
                            14 Aug 25, 20:00
                          </div>
                        </div>
                        <div className="akt-bzn">AKT - BZN</div>
                        <div className="group-271 roboto-normal-cape-cod-18-7px">
                          <div className="address-5 address-11">
                            15 Aug 25, 11:00
                          </div>
                          <div className="group-267-1 group-267-5">
                            <div className="overlap-group-4">
                              <img
                                className="line-16"
                                src="/images/maintenance-overview/line-16-15@2x.png"
                                alt="Line 16"
                              />
                              <div className="ellipse-13"></div>
                              <div className="ellipse-14"></div>
                            </div>
                          </div>
                          <div className="address-6 address-11">
                            15 Aug 25, 13:00
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="group-10">
                    <div className="group-1050">
                      <div className="overlap-group1-1">
                        <img
                          className="line-15"
                          src="/images/maintenance-overview/line-15-7@2x.png"
                          alt="Line 15"
                        />
                        <div className="ellipse-8"></div>
                        <div className="ellipse-9"></div>
                        <img
                          className="airplane-landing"
                          src="/images/maintenance-overview/airplane-landing-1@2x.png"
                          alt="Airplane Landing"
                        />
                        <img
                          className="airplane-take-off"
                          src="/images/maintenance-overview/airplane-take-off-1@2x.png"
                          alt="Airplane Take Off"
                        />
                      </div>
                      <div className="flex-col flex roboto-bold-sapphire-24px">
                        <div className="bzn-akt-7">BZN-AKT</div>
                        <div className="group-272 roboto-normal-cape-cod-18-7px">
                          <div className="address-5 address-11">
                            14 Aug 25, 18:00
                          </div>
                          <div className="group-267">
                            <div className="overlap-group-3">
                              <img
                                className="line-16"
                                src="/images/maintenance-overview/line-16-14@2x.png"
                                alt="Line 16"
                              />
                              <div className="ellipse-13"></div>
                              <div className="ellipse-14"></div>
                            </div>
                          </div>
                          <div className="address-6 address-11">
                            14 Aug 25, 20:00
                          </div>
                        </div>
                        <div className="akt-bzn">AKT - BZN</div>
                        <div className="group-271 roboto-normal-cape-cod-18-7px">
                          <div className="address-5 address-11">
                            15 Aug 25, 11:00
                          </div>
                          <div className="group-267-1 group-267-5">
                            <div className="overlap-group-4">
                              <img
                                className="line-16"
                                src="/images/maintenance-overview/line-16-15@2x.png"
                                alt="Line 16"
                              />
                              <div className="ellipse-13"></div>
                              <div className="ellipse-14"></div>
                            </div>
                          </div>
                          <div className="address-6 address-11">
                            15 Aug 25, 13:00
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="group-10">
                    <div className="group-1050">
                      <div className="overlap-group1-1">
                        <img
                          className="line-15"
                          src="/images/maintenance-overview/line-15-7@2x.png"
                          alt="Line 15"
                        />
                        <div className="ellipse-8"></div>
                        <div className="ellipse-9"></div>
                        <img
                          className="airplane-landing"
                          src="/images/maintenance-overview/airplane-landing-1@2x.png"
                          alt="Airplane Landing"
                        />
                        <img
                          className="airplane-take-off"
                          src="/images/maintenance-overview/airplane-take-off-1@2x.png"
                          alt="Airplane Take Off"
                        />
                      </div>
                      <div className="flex-col flex roboto-bold-sapphire-24px">
                        <div className="bzn-akt-7">BZN-AKT</div>
                        <div className="group-272 roboto-normal-cape-cod-18-7px">
                          <div className="address-5 address-11">
                            14 Aug 25, 18:00
                          </div>
                          <div className="group-267">
                            <div className="overlap-group-3">
                              <img
                                className="line-16"
                                src="/images/maintenance-overview/line-16-14@2x.png"
                                alt="Line 16"
                              />
                              <div className="ellipse-13"></div>
                              <div className="ellipse-14"></div>
                            </div>
                          </div>
                          <div className="address-6 address-11">
                            14 Aug 25, 20:00
                          </div>
                        </div>
                        <div className="akt-bzn">AKT - BZN</div>
                        <div className="group-271 roboto-normal-cape-cod-18-7px">
                          <div className="address-5 address-11">
                            15 Aug 25, 11:00
                          </div>
                          <div className="group-267-1 group-267-5">
                            <div className="overlap-group-4">
                              <img
                                className="line-16"
                                src="/images/maintenance-overview/line-16-15@2x.png"
                                alt="Line 16"
                              />
                              <div className="ellipse-13"></div>
                              <div className="ellipse-14"></div>
                            </div>
                          </div>
                          <div className="address-6 address-11">
                            15 Aug 25, 13:00
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="group-10">
                    <div className="group-1050">
                      <div className="overlap-group1-1">
                        <img
                          className="line-15"
                          src="/images/maintenance-overview/line-15-7@2x.png"
                          alt="Line 15"
                        />
                        <div className="ellipse-8"></div>
                        <div className="ellipse-9"></div>
                        <img
                          className="airplane-landing"
                          src="/images/maintenance-overview/airplane-landing-1@2x.png"
                          alt="Airplane Landing"
                        />
                        <img
                          className="airplane-take-off"
                          src="/images/maintenance-overview/airplane-take-off-1@2x.png"
                          alt="Airplane Take Off"
                        />
                      </div>
                      <div className="flex-col flex roboto-bold-sapphire-24px">
                        <div className="bzn-akt-7">BZN-AKT</div>
                        <div className="group-272 roboto-normal-cape-cod-18-7px">
                          <div className="address-5 address-11">
                            14 Aug 25, 18:00
                          </div>
                          <div className="group-267">
                            <div className="overlap-group-3">
                              <img
                                className="line-16"
                                src="/images/maintenance-overview/line-16-14@2x.png"
                                alt="Line 16"
                              />
                              <div className="ellipse-13"></div>
                              <div className="ellipse-14"></div>
                            </div>
                          </div>
                          <div className="address-6 address-11">
                            14 Aug 25, 20:00
                          </div>
                        </div>
                        <div className="akt-bzn">AKT - BZN</div>
                        <div className="group-271 roboto-normal-cape-cod-18-7px">
                          <div className="address-5 address-11">
                            15 Aug 25, 11:00
                          </div>
                          <div className="group-267-1 group-267-5">
                            <div className="overlap-group-4">
                              <img
                                className="line-16"
                                src="/images/maintenance-overview/line-16-15@2x.png"
                                alt="Line 16"
                              />
                              <div className="ellipse-13"></div>
                              <div className="ellipse-14"></div>
                            </div>
                          </div>
                          <div className="address-6 address-11">
                            15 Aug 25, 13:00
                          </div>
                        </div>
                      </div>
                    </div>
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

export default function AircraftMaintenance() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl mb-4">Loading Aircraft Maintenance</div>
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    }>
      <AircraftMaintenanceContent />
    </Suspense>
  );
}
