"use client";
import React from "react";
import "./partsMaintenanceTaskListPopup.style.css";

interface PartsMaintenanceTaskListProps {
  aircraftTailNumber?: string;
  maintenanceId?: string;
  onClose?: () => void;
}

export default function PartsMaintenanceTaskList({ 
  aircraftTailNumber = "ZZ182", 
  maintenanceId = "1234",
  onClose 
}: Readonly<PartsMaintenanceTaskListProps>) {
  return (
    <div
      id="parts-maintenance-task-list-wrapper"
      className="flex flex-col w-full mx-auto bg-[var(--color-bg-elevated)] rounded-lg font-roboto"
    >
      <div className="flex flex-col">
        <div className="flight-info-section-bg px-7 py-4">
          <div className="flex flex-wrap items-center gap-4 xl:gap-5 w-full">
            {/* Flight Number Card */}
            <div className="flex items-center gap-2 px-7 py-4 bg-[var(--color-bg-elevated)] rounded-lg border border-[rgba(42,245,86,0.25)] shadow-md min-w-fit">
              <span className="text-white text-shadow text-[17px] font-normal">
                Flight Number:
              </span>
              <span className="text-white text-shadow text-[17px] font-bold">{aircraftTailNumber}</span>
            </div>

            {/* Serviceable Status Card */}
            <div className="flex bg-[var(--color-bg-elevated)] rounded-lg border border-[rgba(42,245,86,0.25)] shadow-md">
              <div className="flex items-center px-7 py-4">
                <span className="text-white text-shadow text-[17px] font-normal">
                  Serviceable Status:
                </span>
              </div>
              <div className="flex px-1 py-1">
                <div className="flex items-center justify-center px-4 bg-[#C76D41] rounded-r-md">
                  <span className="text-white text-shadow text-[17px] font-bold">
                    In-maintenance
                  </span>
                </div>
              </div>
            </div>

            {/* Total Flying Hours Card */}
            <div className="flex items-center gap-2 px-7 py-4 bg-[var(--color-bg-elevated)] rounded-lg border border-[rgba(42,245,86,0.25)] shadow-md min-w-fit">
              <span className="text-white text-shadow text-[17px] font-normal">
                Total flying Hours:
              </span>
              <span className="text-white text-shadow text-[17px] font-bold">4250</span>
            </div>

            {/* Maintenance ID Card */}
            <div className="flex items-center gap-2 px-7 py-4 bg-[var(--color-bg-elevated)] rounded-lg border border-[rgba(42,245,86,0.25)] shadow-md min-w-fit">
              <span className="text-white text-shadow text-[17px] font-normal">
                Maintenance ID:
              </span>
              <span className="text-white text-shadow text-[17px] font-bold">{maintenanceId}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-7 px-7 py-4">
          <div className="flex items-center gap-5">
            <h2 className="text-[26px] font-bold text-white text-shadow leading-normal">
              Maintenance scope
            </h2>
          </div>

          <div className="w-full">
            <div className="bg-[var(--color-bg-elevated)] rounded-lg border border-[rgba(42,245,86,0.2)] shadow-lg overflow-hidden">
              <div className="bg-[var(--color-bg-elevated)] border-b border-[rgba(42,245,86,0.2)] px-6 py-4">
                <div className="grid grid-cols-12 gap-6 text-[17px] font-semibold text-white text-shadow">
                  <div className="col-span-1">Task ID</div>
                  <div className="col-span-3">Task Name</div>
                  <div className="col-span-2">Task details</div>
                  <div className="col-span-1">Trade</div>
                  <div className="col-span-2">Assigned person</div>
                  <div className="col-span-1">Start date</div>
                  <div className="col-span-2">Status</div>
                </div>
              </div>

              <div className="divide-y divide-[rgba(42,245,86,0.1)]">
                <div className="px-6 py-4">
                  <div className="grid grid-cols-12 gap-6 items-center">
                    <div className="col-span-1">
                      <a
                        href="#"
                        className="text-[#2AF556] text-shadow text-[17px] font-semibold underline hover:text-[#50f972]"
                      >
                        12456
                      </a>
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center justify-between">
                        <p className="text-white text-shadow text-[17px] font-normal">
                          Internal Cabin and Cockpit Inspection
                        </p>
                        <img
                          className="w-[26px] h-[26px] ml-2 cursor-pointer"
                          src="/images/parts-maintenance-task-list/arrow-drop-down-2.png"
                          alt="Expand"
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-white text-shadow text-[17px] font-normal leading-normal">
                        Check and top up oil, hydraulic,
                        <br />
                        brake, and coolant fluids.
                      </p>
                    </div>
                    <div className="col-span-1">
                      <span className="text-white text-shadow text-[17px] font-normal">
                        Mechanical
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-white text-shadow text-[17px] font-normal">
                        Antonio Hoeger
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-white text-shadow text-[17px] font-normal">
                        03.11.2025
                      </span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center justify-between px-2 py-1 bg-[rgba(199,109,65,0.25)] rounded text-white text-shadow text-[17px] font-normal w-fit min-w-[130px]">
                        <span>Started</span>
                        <img
                          className="w-[26px] h-[26px] ml-2"
                          src="/images/parts-maintenance-task-list/arrow-drop-down.png"
                          alt="Dropdown"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-[var(--color-bg-primary)]">
                  <div className="grid grid-cols-12 gap-6 items-center">
                    <div className="col-span-1">
                      <a
                        href="#"
                        className="text-[#2AF556] text-shadow text-[17px] font-semibold underline hover:text-[#50f972]"
                      >
                        344456
                      </a>
                    </div>
                    <div className="col-span-3">
                      <span className="text-white text-shadow text-[17px] font-normal">
                        External Visual Inspection
                      </span>
                    </div>
                    <div className="col-span-2">
                      <p className="text-white text-shadow text-[17px] font-normal leading-normal">
                        Check and top up oil, hydraulic, brake, and coolant
                        fluids.
                      </p>
                    </div>
                    <div className="col-span-1">
                      <span className="text-white text-shadow text-[17px] font-normal">
                        Avionic
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-white text-shadow text-[17px] font-normal">
                        Christina Beer
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-white text-shadow text-[17px] font-normal">
                        09.12.2025
                      </span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2 px-2 py-1 bg-[rgba(42,245,86,0.2)] rounded text-white text-shadow text-[17px] font-normal w-fit min-w-[130px]">
                        <span>Completed</span>
                        <img
                          className="w-[26px] h-[26px]"
                          src="/images/parts-maintenance-task-list/arrow-drop-down-1.png"
                          alt="Dropdown"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4">
                  <div className="grid grid-cols-12 gap-6 items-center">
                    <div className="col-span-1">
                      <a
                        href="#"
                        className="text-[#2AF556] text-shadow text-[17px] font-semibold underline hover:text-[#50f972]"
                      >
                        65321
                      </a>
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-shadow text-[17px] font-normal">
                          Engine System Checks
                        </span>
                        <img
                          className="w-[26px] h-[26px] ml-2 cursor-pointer"
                          src="/images/parts-maintenance-task-list/arrow-drop-down-2.png"
                          alt="Expand"
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-white text-shadow text-[17px] font-normal leading-normal">
                        BITE tests, verify radios, GPS, radar, calibrate
                        instruments.
                      </p>
                    </div>
                    <div className="col-span-1">
                      <span className="text-white text-shadow text-[17px] font-normal">
                        Mechanical
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-white text-shadow text-[17px] font-normal">
                        Jody Roberts
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-white text-shadow text-[17px] font-normal">
                        _
                      </span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2 px-2 py-1 bg-[rgba(255,71,87,0.2)] rounded text-white text-shadow text-[17px] font-normal w-fit min-w-[130px]">
                        <span>Not-started</span>
                        <img
                          className="w-[26px] h-[26px]"
                          src="/images/parts-maintenance-task-list/arrow-drop-down-2.png"
                          alt="Dropdown"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-7">
            <div className="flex flex-col items-start justify-center gap-2">
              <h3 className="text-[17px] font-bold text-white text-shadow leading-normal">
                Date creation date
              </h3>
              <span className="text-white text-shadow text-[17px] font-normal">
                03.11.2025
              </span>
            </div>
            <div className="w-px h-10 bg-[rgba(42,245,86,0.25)]"></div>
            <div className="flex flex-col items-start justify-center gap-2">
              <h3 className="text-[17px] font-bold text-white text-shadow leading-normal">
                Estimated time calculated for the tasks listed for maintenance
              </h3>
              <span className="text-white text-shadow text-[17px] font-normal">
                3 day
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-7">
          <div className="w-full h-px bg-[rgba(42,245,86,0.2)]"></div>
          <div className="flex items-center justify-between px-7">
            <div className="w-80 h-8"></div>
            <div className="flex items-center gap-4">
              <button className="flex items-center justify-center gap-1 px-11 py-4 border border-[#2AF556] text-[#2AF556] text-shadow bg-transparent rounded-full font-bold text-[15px] hover:bg-[rgba(42,245,86,0.08)] transition-colors min-w-[200px]">
                View Flight Details
              </button>
              <button 
                onClick={onClose}
                className="flex items-center justify-center gap-3 px-11 py-4 bg-gradient-to-b from-[#349ce6] to-[#2974a9] border border-[#1165a2] text-white text-shadow rounded-full font-bold text-[15px] hover:from-[#2b8bc7] hover:to-[#235f8a] transition-all min-w-[120px]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
