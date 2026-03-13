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
      className="flex flex-col w-full mx-auto bg-white rounded-lg font-roboto"
    >
      <div className="flex flex-col">
        <div className="flight-info-section-bg px-7 py-4">
          <div className="flex flex-wrap items-center gap-4 xl:gap-5 w-full">
            {/* Flight Number Card */}
            <div className="flex items-center gap-2 px-7 py-4 bg-white rounded-lg border border-gray-300 shadow-md min-w-fit">
              <span className="text-gray-600 text-[17px] font-normal">
                Flight Number:
              </span>
              <span className="text-gray-900 text-[17px] font-bold">{aircraftTailNumber}</span>
            </div>

            {/* Serviceable Status Card */}
            <div className="flex bg-white rounded-lg border border-gray-300 shadow-md">
              <div className="flex items-center px-7 py-4">
                <span className="text-gray-600 text-[17px] font-normal">
                  Serviceable Status:
                </span>
              </div>
              <div className="flex px-1 py-1">
                <div className="flex items-center justify-center px-4 bg-[#fe9f4d] rounded-r-md">
                  <span className="text-gray-900 text-[17px] font-bold">
                    In-maintenance
                  </span>
                </div>
              </div>
            </div>

            {/* Total Flying Hours Card */}
            <div className="flex items-center gap-2 px-7 py-4 bg-white rounded-lg border border-gray-300 shadow-md min-w-fit">
              <span className="text-gray-600 text-[17px] font-normal">
                Total flying Hours:
              </span>
              <span className="text-gray-900 text-[17px] font-bold">4250</span>
            </div>

            {/* Maintenance ID Card */}
            <div className="flex items-center gap-2 px-7 py-4 bg-white rounded-lg border border-gray-300 shadow-md min-w-fit">
              <span className="text-gray-600 text-[17px] font-normal">
                Maintenance ID:
              </span>
              <span className="text-gray-900 text-[17px] font-bold">{maintenanceId}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-7 px-7 py-4">
          <div className="flex items-center gap-5">
            <h2 className="text-[26px] font-bold text-black leading-normal">
              Maintenance scope
            </h2>
          </div>

          <div className="w-full">
            <div className="bg-white rounded-lg border border-[#dad9e4] shadow-lg overflow-hidden">
              <div className="bg-[#e8e6ff] px-6 py-4">
                <div className="grid grid-cols-12 gap-6 text-[17px] font-semibold text-[#101b34]">
                  <div className="col-span-1">Task ID</div>
                  <div className="col-span-3">Task Name</div>
                  <div className="col-span-2">Task details</div>
                  <div className="col-span-1">Trade</div>
                  <div className="col-span-2">Assigned person</div>
                  <div className="col-span-1">Start date</div>
                  <div className="col-span-2">Status</div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                <div className="px-6 py-4">
                  <div className="grid grid-cols-12 gap-6 items-center">
                    <div className="col-span-1">
                      <a
                        href="#"
                        className="text-[#5990ff] text-[17px] font-semibold underline hover:text-blue-700"
                      >
                        12456
                      </a>
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[#101b34] text-[17px] font-normal">
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
                      <p className="text-[#101b34] text-[17px] font-normal leading-normal">
                        Check and top up oil, hydraulic,
                        <br />
                        brake, and coolant fluids.
                      </p>
                    </div>
                    <div className="col-span-1">
                      <span className="text-[#101b34] text-[17px] font-normal">
                        Mechanical
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[#101b34] text-[17px] font-normal">
                        Antonio Hoeger
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-[#101b34] text-[17px] font-normal">
                        03.11.2025
                      </span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center justify-between px-2 py-1 bg-[#ffecc8] rounded text-[#a0700e] text-[17px] font-normal w-fit min-w-[130px]">
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

                <div className="px-6 py-4 bg-[#f5f5f5]">
                  <div className="grid grid-cols-12 gap-6 items-center">
                    <div className="col-span-1">
                      <a
                        href="#"
                        className="text-[#5990ff] text-[17px] font-semibold underline hover:text-blue-700"
                      >
                        344456
                      </a>
                    </div>
                    <div className="col-span-3">
                      <span className="text-[#101b34] text-[17px] font-normal">
                        External Visual Inspection
                      </span>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[#101b34] text-[17px] font-normal leading-normal">
                        Check and top up oil, hydraulic, brake, and coolant
                        fluids.
                      </p>
                    </div>
                    <div className="col-span-1">
                      <span className="text-[#101b34] text-[17px] font-normal">
                        Avionic
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[#101b34] text-[17px] font-normal">
                        Christina Beer
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-[#101b34] text-[17px] font-normal">
                        09.12.2025
                      </span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2 px-2 py-1 bg-[#bffbc6] rounded text-[#48802b] text-[17px] font-normal w-fit min-w-[130px]">
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
                        className="text-[#5990ff] text-[17px] font-semibold underline hover:text-blue-700"
                      >
                        65321
                      </a>
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[#101b34] text-[17px] font-normal">
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
                      <p className="text-[#101b34] text-[17px] font-normal leading-normal">
                        BITE tests, verify radios, GPS, radar, calibrate
                        instruments.
                      </p>
                    </div>
                    <div className="col-span-1">
                      <span className="text-[#101b34] text-[17px] font-normal">
                        Mechanical
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[#101b34] text-[17px] font-normal">
                        Jody Roberts
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-[#101b34] text-[17px] font-normal">
                        _
                      </span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2 px-2 py-1 bg-[#ffdddb] rounded text-[#c35c56] text-[17px] font-normal w-fit min-w-[130px]">
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
              <h3 className="text-[17px] font-bold text-black leading-normal">
                Date creation date
              </h3>
              <span className="text-[#101b34] text-[17px] font-normal">
                03.11.2025
              </span>
            </div>
            <div className="w-px h-10 bg-gray-400"></div>
            <div className="flex flex-col items-start justify-center gap-2">
              <h3 className="text-[17px] font-bold text-black leading-normal">
                Estimated time calculated for the tasks listed for maintenance
              </h3>
              <span className="text-[#101b34] text-[17px] font-normal">
                3 day
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-7">
          <div className="w-full h-px bg-gray-300"></div>
          <div className="flex items-center justify-between px-7">
            <div className="w-80 h-8"></div>
            <div className="flex items-center gap-4">
              <button className="flex items-center justify-center gap-1 px-11 py-4 border border-[#4270e0] text-[#4270e0] bg-transparent rounded-full font-bold text-[15px] hover:bg-blue-50 transition-colors min-w-[200px]">
                View Flight Details
              </button>
              <button 
                onClick={onClose}
                className="flex items-center justify-center gap-3 px-11 py-4 bg-gradient-to-b from-[#349ce6] to-[#2974a9] border border-[#1165a2] text-white rounded-full font-bold text-[15px] hover:from-[#2b8bc7] hover:to-[#235f8a] transition-all min-w-[120px]"
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
