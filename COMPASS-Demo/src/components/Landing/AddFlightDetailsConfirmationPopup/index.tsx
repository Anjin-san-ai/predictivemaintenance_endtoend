"use client";
import React from "react";
import { DEMO_HOME_AIRPORT } from "../../../lib/demoConfig";

type DateTimeType = Date | string | null;

interface FlightLeg {
  id: string;
  airport: string;
  arrivalDate: Date | null;
  arrivalTime: Date | null;
  departureDate: Date | null;
  departureTime: Date | null;
}

interface AddFlightDetailsConfirmationPopupProps {
  flightData: {
    category: string;
    fromAirport: string;
    toAirport: string;
    fromDate: DateTimeType;
    fromTime: DateTimeType;
    returnDate: DateTimeType;
    returnTime: DateTimeType;
    route: Array<{
      from: string;
      to: string;
      departureDate: string;
      departureTime: string;
      arrivalDate: string;
      arrivalTime: string;
    }>;
    legs: FlightLeg[];
  };
  /** Tail number assigned by the scheduler. Null if the flight is unschedulable. */
  assignedTailNumber: string | null;
  /** True if the scheduler could not fit this flight on any tail. */
  isUnschedulable: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onEdit: () => void;
}

const formatDateTime = (date: DateTimeType) => {
  if (!date) return "";

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return "";

  return dateObj.toLocaleDateString('en-GB', {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const formatTimeOnly = (time: DateTimeType) => {
  if (!time) return "";

  let timeObj: Date;
  if (typeof time === 'string' && time.includes(':') && !time.includes('T')) {
    timeObj = new Date(`1970-01-01T${time}`);
  } else {
    timeObj = new Date(time);
  }

  if (isNaN(timeObj.getTime())) return "";

  return timeObj.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const parseDateTime = (date: DateTimeType, time: DateTimeType) => {
  if (!date || !time) return null;

  const dateObj = new Date(date);
  let timeObj: Date;

  if (typeof time === 'string' && time.includes(':') && !time.includes('T')) {
    timeObj = new Date(`1970-01-01T${time}`);
  } else {
    timeObj = new Date(time);
  }

  if (isNaN(dateObj.getTime()) || isNaN(timeObj.getTime())) return null;

  const result = new Date(dateObj);
  result.setHours(timeObj.getHours(), timeObj.getMinutes());
  return result;
};

const calculateFlightTime = (fromDate: DateTimeType, fromTime: DateTimeType, returnDate: DateTimeType, returnTime: DateTimeType) => {
  const departureDateTime = parseDateTime(fromDate, fromTime);
  const returnDateTime = parseDateTime(returnDate, returnTime);

  if (!departureDateTime || !returnDateTime) return "30 Hrs";

  const diffInMs = returnDateTime.getTime() - departureDateTime.getTime();
  const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));

  return `${diffInHours} Hrs`;
};

const buildPlaneRoute = (fromAirport: string, legs: FlightLeg[], toAirport: string) => {
  const route = [fromAirport];
  legs.forEach(leg => route.push(leg.airport));
  route.push(toAirport);
  return route.join('-');
};

const getAirportName = (code: string) => {
  const airports: { [key: string]: string } = {
    'LHR': 'Heathrow Airport (LHR)',
    'JFK': 'John F. Kennedy International Airport (JFK)',
    'LAX': 'Los Angeles International Airport (LAX)',
    'DXB': 'Dubai International Airport (DXB)',
    'NRT': 'Narita International Airport (NRT)',
    'CDG': 'Charles de Gaulle Airport (CDG)',
    'SIN': 'Singapore Changi Airport (SIN)',
    'HKG': 'Hong Kong International Airport (HKG)',
    'FRA': 'Frankfurt Airport (FRA)',
    'AMS': 'Amsterdam Airport Schiphol (AMS)',
    'CCU': 'Kolkata Airport (CCU)',
    'MEL': 'Melbourne Airport (MEL)',
    'FCO': 'Rome Fiumicino Airport (FCO)',
    'BOM': 'Chhatrapati Shivaji Maharaj International Airport (BOM)',
    'DEL': 'Indira Gandhi International Airport (DEL)',
    'MAA': 'Chennai International Airport (MAA)',
    'BLR': 'Kempegowda International Airport (BLR)',
    'HYD': 'Rajiv Gandhi International Airport (HYD)',
    'AMD': 'Sardar Vallabhbhai Patel International Airport (AMD)',
    'COK': 'Cochin International Airport (COK)',
    'ICN': 'Incheon International Airport (ICN)',
    'BKK': 'Suvarnabhumi Airport (BKK)',
    'SYD': 'Sydney Kingsford Smith Airport (SYD)',
    'YYZ': 'Toronto Pearson International Airport (YYZ)',
    'GRU': 'São Paulo–Guarulhos International Airport (GRU)',
    'JNB': 'O.R. Tambo International Airport (JNB)',
    'CAI': 'Cairo International Airport (CAI)',
    'PEK': 'Beijing Capital International Airport (PEK)',
    'PVG': 'Shanghai Pudong International Airport (PVG)',
    'IST': 'Istanbul Airport (IST)',
    'DOH': 'Hamad International Airport (DOH)'
  };
  return airports[code] || `${code} Airport (${code})`;
};

export default function AddFlightDetailsConfirmationPopup({
  flightData,
  assignedTailNumber,
  isUnschedulable,
  onCancel,
  onConfirm,
  onEdit,
}: AddFlightDetailsConfirmationPopupProps) {
  const legsToDisplay = flightData.legs && flightData.legs.length > 0
    ? flightData.legs
    : [];

  const planeRoute = buildPlaneRoute(
    flightData.fromAirport || DEMO_HOME_AIRPORT,
    legsToDisplay,
    flightData.toAirport || DEMO_HOME_AIRPORT
  );

  const totalFlightTime = calculateFlightTime(
    flightData.fromDate,
    flightData.fromTime,
    flightData.returnDate,
    flightData.returnTime
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[95vw] max-w-[1400px] h-[95vh] flex flex-col">
        <div className="flex flex-col items-center gap-6 pt-6 pb-0 w-full">
          <div className="flex w-full items-center justify-between px-6">
            <div className="flex items-start gap-5">
              <div className="text-black font-bold text-2xl">Add Flight Details</div>
            </div>
            <div className="flex items-center gap-7">
              <button onClick={onCancel} className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 6L18 18" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
          <div className="w-full h-px bg-gray-300"></div>
        </div>

        <div className="flex-1 flex justify-center overflow-y-auto">
          <div className="w-full flex flex-col">

            <div className="flex flex-col gap-6 px-6 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-black font-bold text-xl">Flight Route Overview</div>
                  <img className="w-5 h-5" src="/images/add-flight-popup/24px---ic-info-5@2x.png" alt="Info" />
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={onEdit}
                    className="flex items-center justify-center gap-1 px-11 py-4 border border-[#4270e0] text-[#4270e0] bg-transparent rounded-full font-bold text-base hover:bg-blue-50 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#4270e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#4270e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Edit Details
                  </button>
                </div>
              </div>

              <div
                className="flex items-center gap-16 p-6 rounded-lg overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, rgba(34, 56, 106, 1) 25%, rgba(67, 110, 208, 1) 100%)'
                }}
              >
                <div className="flex flex-col gap-3">
                  <div className="text-white font-bold text-base">Assigned Tail</div>
                  <div className="text-white font-bold text-xl">
                    {isUnschedulable ? (
                      <span className="text-red-300">Unschedulable</span>
                    ) : (
                      assignedTailNumber ?? '—'
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="text-white font-bold text-base">Plane Route</div>
                  <div className="text-white font-bold text-xl">{planeRoute}</div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="text-white font-bold text-base">Category</div>
                  <div className="text-white font-bold text-xl">{flightData.category || 'Cargo'}</div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="text-white font-bold text-base">Total Estimated Flying Time</div>
                  <div className="text-white font-bold text-xl">{totalFlightTime}</div>
                </div>
              </div>

              {isUnschedulable && (
                <div className="flex items-center gap-3 px-4 py-3 mt-2 bg-red-50 border border-red-300 rounded-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="2"/>
                    <path d="M12 8v4M12 16h.01" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span className="text-red-700 text-sm font-medium">
                    No tail available for this flight window. This flight will be added to the Unable to Schedule list.
                  </span>
                </div>
              )}

              <div className="w-full h-px bg-gray-300 mt-4"></div>
            </div>

            <div className="flex flex-col p-6">

              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-2">
                <div className="flex flex-col items-center">
                  <div className="relative flex flex-col items-center h-22">
                    <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center relative z-10">
                      <img className="w-5 h-5" src="/images/add-flight-popup/airplane-take-off-2@2x.png" alt="Takeoff" />
                    </div>
                    <div className="absolute top-7 w-px h-20 bg-gray-300 z-0"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-end gap-8">
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col gap-2 w-52">
                        <div className="text-black font-medium text-lg">From</div>
                        <div className="text-gray-600 font-normal text-lg">{getAirportName(flightData.fromAirport || DEMO_HOME_AIRPORT)}</div>
                      </div>
                      <div className="flex gap-14">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <img className="w-5 h-5" src="/images/add-flight-popup/calendar-18@2x.png" alt="Calendar" />
                            <div className="text-black font-medium text-lg">Departure date</div>
                          </div>
                          <div className="text-gray-600 font-normal text-lg">
                            {flightData.fromDate ? formatDateTime(flightData.fromDate) : '16 Aug 2025'}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <img className="w-5 h-5" src="/images/add-flight-popup/airplane-take-off-2@2x.png" alt="Takeoff" />
                            <div className="text-black font-medium text-lg">Departure time</div>
                          </div>
                          <div className="text-gray-600 font-normal text-lg">
                            {flightData.fromTime ? `${formatTimeOnly(flightData.fromTime)} hrs` : '08:30 hrs'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-px bg-gray-300 mt-4"></div>
                </div>
              </div>

              {legsToDisplay.map((leg, index) => (
                <div key={leg.id} className="flex items-start gap-8 py-4">
                  <div className="flex flex-col items-center">

                    <div className="relative w-7 flex flex-col items-center h-22">
                      <div className="absolute top-0 w-7 h-7 bg-white rounded-full flex items-center justify-center" style={{ border: '2px solid #4270e0' }}>
                        <span className="text-black font-medium text-sm tracking-wide">{index + 1}</span>
                      </div>
                      <div className="absolute top-7 w-px h-28 bg-gray-300 z-0"></div>

                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-end gap-8">
                      <div className="flex items-center gap-8">
                        <div className="flex flex-col gap-2 w-52">
                          <div className="text-black font-medium text-lg">To ({index === 0 ? 'First' : 'Second'} leg)</div>
                          <div className="text-gray-600 font-normal text-lg">{getAirportName(leg.airport)}</div>
                        </div>
                        <div className="flex gap-11">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <img className="w-5 h-5" src="/images/add-flight-popup/calendar-19@2x.png" alt="Calendar" />
                              <div className="text-black font-medium text-lg">Estimated arriving date</div>
                            </div>
                            <div className="text-gray-600 font-normal text-lg">{leg.arrivalDate ? formatDateTime(leg.arrivalDate) : '16 Aug 2025'}</div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <img className="w-5 h-5" src="/images/add-flight-popup/airplane-landing-2@2x.png" alt="Landing" />
                              <div className="text-black font-medium text-lg">Estimated arriving time</div>
                            </div>
                            <div className="text-gray-600 font-normal text-lg">{leg.arrivalTime ? formatTimeOnly(leg.arrivalTime) : '15:00'} hrs</div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <img className="w-5 h-5" src="/images/add-flight-popup/calendar-20@2x.png" alt="Calendar" />
                              <div className="text-black font-medium text-lg">Estimated departure date</div>
                            </div>
                            <div className="text-gray-600 font-normal text-lg">{leg.departureDate ? formatDateTime(leg.departureDate) : '17 Aug 2025'}</div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <img className="w-5 h-5" src="/images/add-flight-popup/airplane-take-off-2@2x.png" alt="Takeoff" />
                              <div className="text-black font-medium text-lg">Estimated departure time</div>
                            </div>
                            <div className="text-gray-600 font-normal text-lg">{leg.departureTime ? formatTimeOnly(leg.departureTime) : '10:00'} hrs</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-px bg-gray-300 mt-4"></div>
                  </div>
                </div>
              ))}

              <div className="flex items-start gap-8 py-4">
                <div className="relative w-7 h-8">
                  <div className="absolute top-0 w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center">
                    <img className="w-5 h-5" src="/images/add-flight-popup/airplane-landing-2@2x.png" alt="Landing" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-end gap-8">
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col gap-2 w-52">
                        <div className="text-black font-medium text-lg">Return</div>
                        <div className="text-gray-600 font-normal text-lg">{getAirportName(flightData.toAirport || DEMO_HOME_AIRPORT)}</div>
                      </div>
                      <div className="flex gap-11">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <img className="w-5 h-5" src="/images/add-flight-popup/calendar-21@2x.png" alt="Calendar" />
                            <div className="text-black font-medium text-lg">Estimated return date</div>
                          </div>
                          <div className="text-gray-600 font-normal text-lg">
                            {flightData.returnDate ? formatDateTime(flightData.returnDate) : '19 Aug 2025'}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <img className="w-5 h-5" src="/images/add-flight-popup/airplane-landing-2@2x.png" alt="Landing" />
                            <div className="text-black font-medium text-lg">Estimated return time</div>
                          </div>
                          <div className="text-gray-600 font-normal text-lg">
                            {flightData.returnTime ? `${formatTimeOnly(flightData.returnTime)} hrs` : '08:35 hrs'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-px bg-gray-300 mt-4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 pb-6">
          <div className="w-full h-px bg-gray-300"></div>
          <div className="flex items-center justify-between px-6">
            <div className="w-90"></div>
            <div className="flex items-center gap-4">
              <button
                onClick={onCancel}
                className="flex items-center justify-center gap-1 px-11 py-4 border border-[#4270e0] text-[#4270e0] bg-transparent rounded-full font-bold text-base hover:bg-blue-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex items-center justify-center gap-3 px-11 py-4 rounded-full font-bold text-base text-white border border-[#1165a2] hover:opacity-90 transition-all"
                style={{
                  background: 'linear-gradient(180deg, rgba(52, 156, 230, 1) 0%, rgba(41, 116, 169, 1) 100%)'
                }}
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