"use client";
import React from "react";
import type { ScheduleImpact } from "../../../lib/scheduler/scheduleDiff";

interface ScheduleImpactPopupProps {
  impact: ScheduleImpact;
  onClose: () => void;
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <span className="font-bold text-base text-[#22386a]">{title}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-gray-400 italic">{message}</p>;
}

function DeltaBadge({ days }: { days: number }) {
  const earlier = days < 0;
  const label = earlier
    ? `${Math.abs(days)}d earlier`
    : `${days}d later`;
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        earlier
          ? 'bg-orange-100 text-orange-700'
          : 'bg-blue-100 text-blue-700'
      }`}
    >
      {label}
    </span>
  );
}

export default function ScheduleImpactPopup({ impact, onClose }: ScheduleImpactPopupProps) {
  const { addedFlight, reassignedFlights, shiftedMaintenance, newMaintenance } = impact;

  const totalMaintenanceChanges = shiftedMaintenance.length + newMaintenance.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[95vw] max-w-[700px] flex flex-col max-h-[88vh]">

        {/* Header */}
        <div className="flex flex-col gap-4 pt-6 pb-0">
          <div className="flex items-center justify-between px-6">
            <div className="text-black font-bold text-2xl">Schedule Impact</div>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded"
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 6L18 18" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="w-full h-px bg-gray-300" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8">

          {/* 1 — New flight */}
          <div>
            <SectionHeader
              title="New Flight Added"
              icon={
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #349CE6 0%, #2974A9 100%)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="11 21 16 16 21 21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              }
            />
            <div
              className="flex flex-wrap items-center gap-8 px-5 py-4 rounded-lg"
              style={{ background: 'linear-gradient(180deg, rgba(34,56,106,1) 25%, rgba(67,110,208,1) 100%)' }}
            >
              <div className="flex flex-col gap-1">
                <span className="text-white text-xs font-medium opacity-70">Flight Number</span>
                <span className="text-white font-bold text-lg">FN {addedFlight.flightNumber}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-white text-xs font-medium opacity-70">Assigned Tail</span>
                <span className="text-white font-bold text-lg">
                  {addedFlight.tailNumber ?? <span className="text-red-300">Unschedulable</span>}
                </span>
              </div>
              {addedFlight.route && (
                <div className="flex flex-col gap-1">
                  <span className="text-white text-xs font-medium opacity-70">Route</span>
                  <span className="text-white font-bold text-lg">{addedFlight.route}</span>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-white text-xs font-medium opacity-70">Hours Added</span>
                <span className="text-white font-bold text-lg">
                  {addedFlight.durationHours > 0
                    ? `+${addedFlight.durationHours.toFixed(1)} hrs`
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-gray-200" />

          {/* 2 — Maintenance impact */}
          <div>
            <SectionHeader
              title={`Maintenance Impact (${totalMaintenanceChanges})`}
              icon={
                <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              }
            />

            {totalMaintenanceChanges === 0 ? (
              <EmptyState message="No maintenance blocks were affected by this flight." />
            ) : (
              <div className="flex flex-col gap-2">

                {/* Shifted — existing blocks pulled earlier or pushed later */}
                {shiftedMaintenance.map((sm, i) => (
                  <div key={`shifted-${i}`} className="px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm text-gray-800">
                        {sm.taskNames.length > 0 ? sm.taskNames.join(', ') : 'Maintenance block'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-mono">{sm.tailNumber}</span>
                        <DeltaBadge days={sm.daysDelta} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="w-14 text-gray-400 flex-shrink-0">Before</span>
                        <span className="font-mono">{sm.fromStart}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-14 text-gray-400 flex-shrink-0">After</span>
                        <span className={`font-mono font-semibold ${sm.daysDelta < 0 ? 'text-orange-700' : 'text-blue-700'}`}>
                          {sm.toStart}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* New — blocks triggered by the accumulated hours of this flight */}
                {newMaintenance.map((nm, i) => (
                  <div key={`new-${i}`} className="px-4 py-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm text-gray-800">
                        {nm.taskNames.length > 0 ? nm.taskNames.join(', ') : 'Maintenance block'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-mono">{nm.tailNumber}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                          New
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      <span className="text-gray-400 mr-2">Scheduled</span>
                      <span className="font-mono font-semibold text-yellow-800">
                        {nm.scheduledStart} – {nm.scheduledEnd}
                      </span>
                    </div>
                  </div>
                ))}

              </div>
            )}
          </div>

          <div className="w-full h-px bg-gray-200" />

          {/* 3 — Reassigned flights */}
          <div>
            <SectionHeader
              title={`Reassigned Flights (${reassignedFlights.length})`}
              icon={
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12h6M12 9l3 3-3 3" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="#3b82f6" strokeWidth="2" />
                    <rect x="14" y="14" width="7" height="7" rx="1" stroke="#3b82f6" strokeWidth="2" />
                  </svg>
                </div>
              }
            />
            {reassignedFlights.length === 0 ? (
              <EmptyState message="No flights were reassigned." />
            ) : (
              <div className="flex flex-col gap-2">
                {reassignedFlights.map(rf => (
                  <div key={rf.flightNumber} className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-sm text-gray-800">FN {rf.flightNumber}</span>
                      {rf.route && <span className="text-xs text-gray-500">{rf.route}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono font-semibold text-gray-700">{rf.fromTail}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="font-mono font-semibold text-gray-700">{rf.toTail}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex flex-col gap-4 pb-6">
          <div className="w-full h-px bg-gray-300" />
          <div className="flex justify-end px-6">
            <button
              onClick={onClose}
              className="flex items-center justify-center px-11 py-4 rounded-full font-bold text-base text-white border border-[#1165a2] hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(180deg, rgba(52,156,230,1) 0%, rgba(41,116,169,1) 100%)' }}
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
