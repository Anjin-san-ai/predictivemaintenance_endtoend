"use client";
import React from "react";
import "./partsMaintenanceTaskListPopup.style.css";
import type { GanttMaintenanceTask } from "../../../lib/scheduler/types";

interface PartsMaintenanceTaskListProps {
  aircraftTailNumber?: string;
  maintenanceId?: string;
  maintenanceType?: string;
  aircraftStatus?: string;
  scheduleStartDate?: string;
  scheduleEndDate?: string;
  scheduleStartTime?: string;
  scheduleEndTime?: string;
  durationHours?: number;
  currentHours?: number;
  tasks?: GanttMaintenanceTask[];
  onClose?: () => void;
}

/** Derive a task status from the block's UTC datetime range relative to now. */
export function deriveStatus(
  scheduleStartDate?: string,
  scheduleEndDate?: string,
  scheduleStartTime?: string,
  scheduleEndTime?: string,
): 'Started' | 'Completed' | 'Not-started' {
  if (!scheduleStartDate) return 'Not-started';
  const now = new Date();
  const startISO = `${scheduleStartDate}T${scheduleStartTime ?? '00:00'}Z`;
  const endDate = scheduleEndDate ?? scheduleStartDate;
  const endISO = `${endDate}T${scheduleEndTime ?? '23:59'}Z`;
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (now < start) return 'Not-started';
  if (now >= end) return 'Completed';
  return 'Started';
}

const STATUS_STYLES = {
  Started:       { bg: 'bg-[#ffecc8]', text: 'text-[#a0700e]' },
  Completed:     { bg: 'bg-[#bffbc6]', text: 'text-[#48802b]' },
  'Not-started': { bg: 'bg-[#ffdddb]', text: 'text-[#c35c56]' },
};

// Keyed by the exact strings returned by getDynamicStatusForAircraft()
const AIRCRAFT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'Serviceable':       { bg: '#49a02c', text: '#ffffff' },
  'In-maintenance':    { bg: '#fe9f4d', text: '#1a1a1a' },
  'Depth maintenance': { bg: '#8a94ab', text: '#ffffff' },
  'Un-serviceable':    { bg: '#fe4d4d', text: '#ffffff' },
  'In flight':         { bg: '#769dff', text: '#ffffff' },
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}.${m}.${y}`;
}

function formatDuration(hours?: number): string {
  if (hours == null) return '—';
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days} day${days !== 1 ? 's' : ''}`;
  return `${Math.round(hours)}h`;
}

export default function PartsMaintenanceTaskList({
  aircraftTailNumber = '—',
  maintenanceId = '—',
  maintenanceType,
  aircraftStatus,
  scheduleStartDate,
  scheduleEndDate,
  scheduleStartTime,
  scheduleEndTime,
  durationHours,
  currentHours,
  tasks = [],
  onClose,
}: Readonly<PartsMaintenanceTaskListProps>) {
  const status = deriveStatus(scheduleStartDate, scheduleEndDate, scheduleStartTime, scheduleEndTime);
  // Only use aircraftStatus for the badge — maintenanceType ('Planned'/'In-Depth') is not a valid
  // status display value and has no entry in AIRCRAFT_STATUS_COLORS.
  const displayStatus = aircraftStatus ?? 'In-maintenance';
  const statusColors = AIRCRAFT_STATUS_COLORS[displayStatus] ?? { bg: '#fe9f4d', text: '#1a1a1a' };

  return (
    <div
      id="parts-maintenance-task-list-wrapper"
      className="flex flex-col w-full mx-auto bg-white rounded-lg font-roboto"
    >
      <div className="flex flex-col">
        <div className="flight-info-section-bg px-7 py-4">
          <div className="flex flex-wrap items-center gap-4 xl:gap-5 w-full">
            {/* Tail Number */}
            <div className="flex items-center gap-2 px-7 py-4 bg-white rounded-lg border border-gray-300 shadow-md min-w-fit">
              <span className="text-gray-600 text-[17px] font-normal">Tail Number:</span>
              <span className="text-gray-900 text-[17px] font-bold">{aircraftTailNumber}</span>
            </div>

            {/* Aircraft Status */}
            <div className="flex bg-white rounded-lg border border-gray-300 shadow-md">
              <div className="flex items-center px-7 py-4">
                <span className="text-gray-600 text-[17px] font-normal">Status:</span>
              </div>
              <div className="flex px-1 py-1">
                <div
                  className="flex items-center justify-center px-4 rounded-r-md"
                  style={{ backgroundColor: statusColors.bg }}
                >
                  <span className="text-[17px] font-bold" style={{ color: statusColors.text }}>
                    {displayStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Flying Hours */}
            <div className="flex items-center gap-2 px-7 py-4 bg-white rounded-lg border border-gray-300 shadow-md min-w-fit">
              <span className="text-gray-600 text-[17px] font-normal">Total Flying Hours:</span>
              <span className="text-gray-900 text-[17px] font-bold">
                {currentHours != null ? Math.round(currentHours).toLocaleString() : '—'}
              </span>
            </div>

            {/* Maintenance ID */}
            <div className="flex items-center gap-2 px-7 py-4 bg-white rounded-lg border border-gray-300 shadow-md min-w-fit">
              <span className="text-gray-600 text-[17px] font-normal">Maintenance ID:</span>
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
                  <div className="col-span-2">Task Details</div>
                  <div className="col-span-1">Trade</div>
                  <div className="col-span-2">Assigned Person</div>
                  <div className="col-span-1">Start Date</div>
                  <div className="col-span-2">Status</div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {tasks.length === 0 ? (
                  <div className="px-6 py-4 text-gray-500 text-[17px]">No tasks found for this block.</div>
                ) : (
                  tasks.map((task, idx) => {
                    const styles = STATUS_STYLES[status];
                    return (
                      <div key={task.taskId} className={`px-6 py-4${idx % 2 === 1 ? ' bg-[#f5f5f5]' : ''}`}>
                        <div className="grid grid-cols-12 gap-6 items-center">
                          <div className="col-span-1">
                            <span className="text-[#5990ff] text-[17px] font-semibold">
                              {task.taskId}
                            </span>
                          </div>
                          <div className="col-span-3">
                            <span className="text-[#101b34] text-[17px] font-normal">
                              {task.taskName}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[#101b34] text-[17px] font-normal leading-normal">
                              {task.taskDetails || '—'}
                            </p>
                          </div>
                          <div className="col-span-1">
                            <span className="text-[#101b34] text-[17px] font-normal">
                              {task.trade || '—'}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[#101b34] text-[17px] font-normal">
                              {task.assignedPerson || '—'}
                            </span>
                          </div>
                          <div className="col-span-1">
                            <span className="text-[#101b34] text-[17px] font-normal">
                              {formatDate(scheduleStartDate)}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <div className={`flex items-center gap-2 px-2 py-1 ${styles.bg} rounded ${styles.text} text-[17px] font-normal w-fit min-w-[130px]`}>
                              <span>{status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-7">
            <div className="flex flex-col items-start justify-center gap-2">
              <h3 className="text-[17px] font-bold text-black leading-normal">
                Scheduled start date
              </h3>
              <span className="text-[#101b34] text-[17px] font-normal">
                {formatDate(scheduleStartDate)}
              </span>
            </div>
            <div className="w-px h-10 bg-gray-400"></div>
            <div className="flex flex-col items-start justify-center gap-2">
              <h3 className="text-[17px] font-bold text-black leading-normal">
                Scheduled end date
              </h3>
              <span className="text-[#101b34] text-[17px] font-normal">
                {formatDate(scheduleEndDate)}
              </span>
            </div>
            <div className="w-px h-10 bg-gray-400"></div>
            <div className="flex flex-col items-start justify-center gap-2">
              <h3 className="text-[17px] font-bold text-black leading-normal">
                Estimated time for maintenance
              </h3>
              <span className="text-[#101b34] text-[17px] font-normal">
                {formatDuration(durationHours)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-7">
          <div className="w-full h-px bg-gray-300"></div>
          <div className="flex items-center justify-end gap-4 px-7 pb-6">
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
  );
}
