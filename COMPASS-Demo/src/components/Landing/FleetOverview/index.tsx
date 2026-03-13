"use client";
import React, { useState, useEffect, useMemo } from "react";
import CircularProgress from "./CircularProgress";
import { calculateFleetData } from "../../../utils/aircraftUtils";


export default function FleetOverview({ flightScheduleData }: { readonly flightScheduleData: readonly any[] }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [liveTimeTick, setLiveTimeTick] = useState(Date.now());
  const fleetData = useMemo(() => calculateFleetData([...flightScheduleData]), [flightScheduleData, liveTimeTick]);
  const totalAircraft = useMemo(() => Object.values(fleetData).reduce((sum: number, value: number) => sum + value, 0), [fleetData]);
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTimeTick(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const StatCard = ({
    value,
    label,
    progressColor,
    total = totalAircraft,
  }: {
    value: number;
    label: string;
    progressColor: string;
    total?: number;
  }) => (
    <div className="w-full flex-1 h-[78px] bg-white rounded-[8px] border border-[#c7c7c7] shadow-[0px_3px_12px_-1px_rgba(0,0,0,0.1)] hover:shadow-[0px_5px_16px_-1px_rgba(0,0,0,0.15)] transition-shadow duration-200 p-3 flex items-center gap-3">
      <div className="flex-shrink-0">
        <CircularProgress
          value={value}
          total={total}
          color={progressColor}
          size={50}
          strokeWidth={6}
        />
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <h3 className="font-roboto font-bold text-[#101b34] text-[12px] lg:text-[13px] leading-tight pr-1">
          {label}
        </h3>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-gray-50 relative overflow-hidden">
      <div
        className={`absolute inset-0 opacity-60 transition-all duration-500 ease-in-out`}
        style={{
          background:
            "linear-gradient(0deg, rgba(236, 236, 236, 1) 0%, rgba(133, 137, 150, 1) 100%)",
          transform: "rotate(180deg)",
        }}
      />

      <div className="relative z-10">
        <div className="flex justify-between items-center px-6 py-2">
          <h2 className="font-roboto font-bold text-[18px] leading-normal">
            <span className="text-[#101b34]">Fleet overview</span>
            <span className="text-[#575f72] text-[16px] ml-1">
              ({totalAircraft} Aircraft)
            </span>
          </h2>

          <div className="flex items-center gap-[10px]">
            <button
              type="button"
              className="font-roboto font-medium text-[#4270e0] text-[14px] leading-normal cursor-pointer hover:text-[#3562d4] hover:underline transition-colors duration-150 select-none bg-transparent border-none p-0"
              onClick={toggleCollapse}
            >
              {isCollapsed ? "Expand All" : "Collapse All"}
            </button>
            <button
              type="button"
              aria-label={isCollapsed ? "Expand All" : "Collapse All"}
              onClick={toggleCollapse}
              className="bg-transparent border-none p-0 flex items-center"
              tabIndex={0}
            >
              <img
                className="w-[12px] h-[7px] transition-transform duration-500 ease-in-out"
                src="images/landing/vector-1-1.png"
                alt=""
                style={{
                  transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
                }}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <div
          className={`px-4 md:px-6 lg:px-8 transition-all duration-700 ease-in-out ${
            isCollapsed
              ? "max-h-0 opacity-0 overflow-hidden pb-0 transform scale-y-0 origin-top"
              : "max-h-[300px] opacity-100 pb-3 transform scale-y-100 origin-top"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            <StatCard
              value={fleetData.serviceable}
              label="Total serviceable aircraft"
              progressColor="#49a02c"
            />

            <StatCard
              value={fleetData.inMaintenance}
              label="Total in-maintenance aircraft"
              progressColor="#fe9f4d"
            />

            <StatCard
              value={fleetData.unServiceable}
              label="Total un-serviceable aircraft"
              progressColor="#fe4d4d"
            />

            <StatCard
              value={fleetData.inFlight}
              label="Total in-flight aircraft"
              progressColor="#769dff"
            />

            <StatCard
              value={fleetData.depthMaintenance}
              label="Total depth maintenance aircraft"
              progressColor="#8a94ab"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
