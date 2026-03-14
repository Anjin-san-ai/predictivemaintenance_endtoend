"use client";
import React, { useState } from "react";
import { DEMO_TAIL_NUMBER, DEMO_HOME_AIRPORT } from "../../../lib/demoConfig";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import * as Select from '@radix-ui/react-select';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { ChevronDownIcon, ChevronUpIcon, CheckIcon, CalendarIcon } from '@radix-ui/react-icons';

const selectTriggerClass = "w-full h-14 px-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between data-[state=open]:ring-2 data-[state=open]:ring-blue-500";
const selectContentClass = "bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto";
const selectItemClass = "px-3 py-2 rounded cursor-pointer hover:bg-blue-50 focus:bg-blue-50 focus:outline-none flex items-center data-[highlighted]:bg-blue-50";
const radioItemClass = "w-5 h-5 rounded-full border-2 border-gray-300 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500 relative focus:outline-none focus:ring-2 focus:ring-blue-300";

const fieldContainerClass = "flex flex-col gap-2 w-60";
const labelClass = "text-base lg:text-lg text-black font-roboto tracking-wide";
const inputClass = "w-60 h-14 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";

const TextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    variant?: 'default' | 'disabled';
  }
>(({ className, variant = 'default', ...props }, ref) => {
  const baseClasses = inputClass;
  const variantClasses = {
    default: "bg-white",
    disabled: "bg-gray-100 text-gray-500 cursor-not-allowed"
  };

  return (
    <input
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`}
      {...props}
    />
  );
});

TextInput.displayName = "TextInput";

const DatePickerWithIcon = ({ selected, onChange, placeholder, showTimeSelect = false, showTimeSelectOnly = false, dateFormat = "dd/MM/yyyy", timeIntervals = 15, timeCaption = "Time", fieldType = "date" }: any) => {
  const getIcon = () => {
    if (!showTimeSelect && !showTimeSelectOnly) {
      return <CalendarIcon className="w-4 h-4 text-gray-500" />;
    }

    if (fieldType === "arrival" || fieldType === "arriving") {
      return <img src="/images/add-flight-popup/airplane-landing-2@2x.png" alt="Landing" className="w-4 h-4" />;
    } else {
      return <img src="/images/add-flight-popup/airplane-take-off-2@2x.png" alt="Takeoff" className="w-4 h-4" />;
    }
  };

  const CustomTimeInput = React.forwardRef<HTMLInputElement, any>(({ value, onClick, onChange, ...props }, ref) => (
    <input
      ref={ref}
      value={value ? `${value} hrs` : ''}
      onClick={onClick}
      onChange={onChange}
      className={`${inputClass} pl-10`}
      placeholder={placeholder}
      readOnly
      style={{
        width: '240px',
        height: '56px',
        padding: '0 12px',
        paddingLeft: '40px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '16px',
        backgroundColor: 'white',
        cursor: 'pointer'
      }}
      {...props}
    />
  ));

  CustomTimeInput.displayName = "CustomTimeInput";

  if (showTimeSelectOnly) {
    return (
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-[1]">
          {getIcon()}
        </div>
        <DatePicker
          selected={selected}
          onChange={onChange}
          showTimeSelect
          showTimeSelectOnly
          timeIntervals={15}
          timeCaption="Time"
          dateFormat="HH:mm"
          timeFormat="HH:mm"
          customInput={<CustomTimeInput />}
          placeholderText={placeholder}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-[1]">
        {getIcon()}
      </div>
      <DatePicker
        selected={selected}
        onChange={onChange}
        showTimeSelect={showTimeSelect}
        showTimeSelectOnly={showTimeSelectOnly}
        timeIntervals={timeIntervals}
        timeCaption={timeCaption}
        dateFormat={showTimeSelectOnly ? "h:mm aa" : dateFormat}
        timeFormat="h:mm aa"
        className={`${inputClass} pl-10`}
        placeholderText={placeholder}
        popperClassName="z-[9999]"
        popperPlacement="bottom-start"
      />
    </div>
  );
};

const airports = [
  { code: 'LHR', name: 'Heathrow Airport (LHR)' },
  { code: 'JFK', name: 'John F. Kennedy International Airport (JFK)' },
  { code: 'LAX', name: 'Los Angeles International Airport (LAX)' },
  { code: 'CDG', name: 'Charles de Gaulle Airport (CDG)' },
  { code: 'NRT', name: 'Narita International Airport (NRT)' },
  { code: 'DXB', name: 'Dubai International Airport (DXB)' },
  { code: 'SIN', name: 'Singapore Changi Airport (SIN)' },
  { code: 'HKG', name: 'Hong Kong International Airport (HKG)' },
  { code: 'FRA', name: 'Frankfurt Airport (FRA)' },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol (AMS)' },
  { code: 'ICN', name: 'Incheon International Airport (ICN)' },
  { code: 'BKK', name: 'Suvarnabhumi Airport (BKK)' },
  { code: 'SYD', name: 'Sydney Kingsford Smith Airport (SYD)' },
  { code: 'MEL', name: 'Melbourne Airport (MEL)' },
  { code: 'YYZ', name: 'Toronto Pearson International Airport (YYZ)' },
  { code: 'GRU', name: 'São Paulo–Guarulhos International Airport (GRU)' },
  { code: 'JNB', name: 'O.R. Tambo International Airport (JNB)' },
  { code: 'CAI', name: 'Cairo International Airport (CAI)' },
  { code: 'DEL', name: 'Indira Gandhi International Airport (DEL)' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport (BOM)' },
  { code: 'PEK', name: 'Beijing Capital International Airport (PEK)' },
  { code: 'PVG', name: 'Shanghai Pudong International Airport (PVG)' },
  { code: 'IST', name: 'Istanbul Airport (IST)' },
  { code: 'CCU', name: 'Kolkata Airport (CCU)' },
  { code: 'DOH', name: 'Hamad International Airport (DOH)' }
];

interface FlightLeg {
  id: string;
  airport: string;
  arrivalDate: Date | null;
  arrivalTime: Date | null;
  departureDate: Date | null;
  departureTime: Date | null;
}

interface AddFlightPopupProps {
  onSubmit?: (flightData: any) => void;
  initialData?: {
    tailNumber?: string;
    flightNumber?: string;
    category?: string;
    fromAirport?: string;
    toAirport?: string;
    fromDate?: Date | string | null;
    fromTime?: Date | string | null;
    returnDate?: Date | string | null;
    returnTime?: Date | string | null;
    legs?: any[];
  };
}

export default function AddFlightPopup({ onSubmit, initialData }: Readonly<AddFlightPopupProps>) {
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || 'Cargo');

  const currentDate = new Date();

  const getLocalDateString = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateTime = (date: Date | string | null, time: Date | string | null) => {
    if (!date || !time) return null;

    let dateObj = typeof date === 'string' ? new Date(date) : date;
    let timeObj: Date;

    if (typeof time === 'string' && time.includes(':') && !time.includes('T')) {
      timeObj = new Date(`1970-01-01T${time}`);
    } else {
      timeObj = typeof time === 'string' ? new Date(time) : time;
    }

    if (isNaN(dateObj.getTime()) || isNaN(timeObj.getTime())) return null;

    const result = new Date(dateObj);
    result.setHours(timeObj.getHours(), timeObj.getMinutes());
    return result;
  };

  const departureDateTime = initialData?.fromDate && initialData?.fromTime
    ? parseDateTime(initialData.fromDate, initialData.fromTime) || new Date(currentDate.getTime() + 6 * 60 * 60 * 1000)
    : new Date(currentDate.getTime() + 6 * 60 * 60 * 1000);

  const returnDateTime = initialData?.returnDate && initialData?.returnTime
    ? parseDateTime(initialData.returnDate, initialData.returnTime) || new Date(departureDateTime.getTime() + 2 * 24 * 60 * 60 * 1000)
    : new Date(departureDateTime.getTime() + 3 * 24 * 60 * 60 * 1000);

  const [fromDate, setFromDate] = useState<Date | null>(departureDateTime);
  const [fromTime, setFromTime] = useState<Date | null>(departureDateTime);
  const [returnDate, setReturnDate] = useState<Date | null>(returnDateTime);
  const [returnTime, setReturnTime] = useState<Date | null>(returnDateTime);

  const [legs, setLegs] = useState<FlightLeg[]>(() => {
    if (initialData?.legs && initialData.legs.length > 0) {
      return initialData.legs;
    } else {
      const oneDayLater = new Date();
      oneDayLater.setDate(oneDayLater.getDate() + 1);

      return [{
        id: 'first-leg',
        airport: 'FRA',
        arrivalDate: new Date(oneDayLater),
        arrivalTime: new Date(oneDayLater.getFullYear(), oneDayLater.getMonth(), oneDayLater.getDate(), 10, 20),
        departureDate: new Date(oneDayLater),
        departureTime: new Date(oneDayLater.getFullYear(), oneDayLater.getMonth(), oneDayLater.getDate(), 17, 45)
      }];
    }
  });

  const handleSubmit = () => {
    const scheduleDate = new Date();
    scheduleDate.setDate(scheduleDate.getDate() + 3);
    scheduleDate.setHours(scheduleDate.getHours() + 6);
    const route = [];

    route.push({
      from: DEMO_HOME_AIRPORT,
      to: legs.length > 0 && legs[0].airport ? legs[0].airport : DEMO_HOME_AIRPORT,
      departureDate: getLocalDateString(fromDate),
      departureTime: fromTime?.toTimeString().slice(0, 5),
      arrivalDate: legs.length > 0 ? getLocalDateString(legs[0].arrivalDate) : getLocalDateString(returnDate),
      arrivalTime: legs.length > 0 ? legs[0].arrivalTime?.toTimeString().slice(0, 5) : returnTime?.toTimeString().slice(0, 5)
    });

    for (let i = 0; i < legs.length - 1; i++) {
      route.push({
        from: legs[i].airport,
        to: legs[i + 1].airport,
        departureDate: getLocalDateString(legs[i].departureDate),
        departureTime: legs[i].departureTime?.toTimeString().slice(0, 5),
        arrivalDate: getLocalDateString(legs[i + 1].arrivalDate),
        arrivalTime: legs[i + 1].arrivalTime?.toTimeString().slice(0, 5)
      });
    }

    if (legs.length > 0) {
      const lastLeg = legs[legs.length - 1];
      route.push({
        from: lastLeg.airport,
        to: DEMO_HOME_AIRPORT,
        departureDate: getLocalDateString(lastLeg.departureDate),
        departureTime: lastLeg.departureTime?.toTimeString().slice(0, 5),
        arrivalDate: getLocalDateString(returnDate),
        arrivalTime: returnTime?.toTimeString().slice(0, 5)
      });
    }

    // tailNumber and flightNumber are assigned by the scheduler on confirmation —
    // they are not set here.
    const flightData = {
      category: selectedCategory,
      fromAirport: DEMO_HOME_AIRPORT,
      toAirport: DEMO_HOME_AIRPORT,
      fromDate: fromDate,
      fromTime: fromTime,
      returnDate: returnDate,
      returnTime: returnTime,
      route: route,
      legs: legs
    };

    if (onSubmit) {
      onSubmit(flightData);
    }
  };

  const addSecondLeg = () => {
    const twoDaysLater = new Date();
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);

    const newLeg: FlightLeg = {
      id: 'second-leg',
      airport: 'MEL',
      arrivalDate: new Date(twoDaysLater),
      arrivalTime: new Date(twoDaysLater.getFullYear(), twoDaysLater.getMonth(), twoDaysLater.getDate(), 9, 0), // 9:00 AM
      departureDate: new Date(twoDaysLater),
      departureTime: new Date(twoDaysLater.getFullYear(), twoDaysLater.getMonth(), twoDaysLater.getDate(), 16, 0) // 4:00 PM (16:00)
    };
    setLegs([...legs, newLeg]);
  };

  const removeSecondLeg = () => {
    setLegs(legs.filter(leg => leg.id !== 'second-leg'));
  };

  const updateLeg = (legId: string, field: string, value: any) => {
    setLegs(legs.map(leg =>
      leg.id === legId ? { ...leg, [field]: value } : leg
    ));
  };

  const hasSecondLeg = legs.some(leg => leg.id === 'second-leg');
  const firstLeg = legs.find(leg => leg.id === 'first-leg');
  const secondLeg = legs.find(leg => leg.id === 'second-leg');

  return (
    <div className="w-full bg-white overflow-hidden h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="w-full mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg lg:text-xl font-bold text-black font-roboto">
                Selected Category
              </h3>
              <img
                className="w-4 h-4"
                src="/images/add-flight-popup/24px---ic-info-5@2x.png"
                alt="Info"
              />
            </div>

            <RadioGroup.Root
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="flex flex-wrap gap-4 lg:gap-6"
            >
              {['Cargo', 'Passengers', 'Training'].map((category) => (
                <div key={category} className="flex items-center gap-3">
                  <RadioGroup.Item
                    value={category}
                    className={radioItemClass}
                  >
                    <RadioGroup.Indicator className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </RadioGroup.Indicator>
                  </RadioGroup.Item>
                  <label className="text-base lg:text-lg text-black font-roboto tracking-wide cursor-pointer">
                    {category}
                  </label>
                </div>
              ))}
            </RadioGroup.Root>
          </div>
        </div>

        <div className="w-full">
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg lg:text-xl font-bold text-black font-roboto">
                  Selected Route
                </h3>
                <img
                  className="w-4 h-4"
                  src="/images/add-flight-popup/24px---ic-info-5@2x.png"
                  alt="Info"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 relative">

              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-2">
                <div className="flex flex-col items-center">
                  <div className="relative flex flex-col items-center h-22">
                    <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center relative z-10">
                      <img
                        className="w-4 h-4"
                        src="/images/add-flight-popup/airplane-take-off-2@2x.png"
                        alt="Takeoff"
                      />
                    </div>
                    <div className="absolute top-7 w-0.5 h-32 bg-gray-300 z-0"></div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex flex-col lg:flex-row gap-4 items-end">
                    <div className={fieldContainerClass}>
                      <label className={labelClass}>
                        From
                      </label>
                      <TextInput
                        value="Heathrow Airport (LHR)"
                        disabled
                        variant="disabled"
                      />
                    </div>

                    <div className={fieldContainerClass}>
                      <label className={labelClass}>
                        Departure date
                      </label>
                      <DatePickerWithIcon
                        selected={fromDate}
                        onChange={(date: Date) => setFromDate(date)}
                        placeholder="Select departure date"
                      />
                    </div>

                    <div className={fieldContainerClass}>
                      <label className={labelClass}>
                        Departure time
                      </label>
                      <DatePickerWithIcon
                        selected={fromTime}
                        onChange={(date: Date) => setFromTime(date)}
                        showTimeSelectOnly={true}
                        timeIntervals={15}
                        timeCaption="Time"
                        dateFormat="HH:mm"
                        fieldType="departure"
                        placeholder="Select departure time"
                      />
                    </div>

                    <div className="flex flex-row gap-2 items-end ml-4">
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                <div className="w-7"></div>
                <div className="w-[85%] h-px bg-gray-300 my-2"></div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-2">
                <div className="flex flex-col items-center">
                  <div className="relative flex flex-col items-center h-24">
                    <div className="absolute top-0 w-0.5 h-12 bg-gray-300 z-0"></div>
                    <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center relative z-10">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    </div>
                    <div className="absolute top-7 w-0.5 h-32 bg-gray-300 z-0"></div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex flex-col lg:flex-row gap-4 items-end">
                    <div className={fieldContainerClass}>
                      <label className={labelClass}>
                        To (First leg)
                      </label>
                      <Select.Root
                        value={firstLeg?.airport || ''}
                        onValueChange={(value) => updateLeg('first-leg', 'airport', value)}
                      >
                        <Select.Trigger className={selectTriggerClass}>
                          <Select.Value placeholder="Select Airport">
                            {firstLeg?.airport &&
                              airports.find(a => a.code === firstLeg.airport)?.name || ''
                            }
                          </Select.Value>
                          <Select.Icon>
                            <ChevronDownIcon />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className={selectContentClass}>
                            <Select.ScrollUpButton className="flex items-center justify-center h-6">
                              <ChevronUpIcon />
                            </Select.ScrollUpButton>
                            <Select.Viewport className="p-1">
                              {airports.filter(airport => airport.code !== DEMO_HOME_AIRPORT).map((airport) => (
                                <Select.Item
                                  key={airport.code}
                                  value={airport.code}
                                  className={selectItemClass}
                                >
                                  <Select.ItemText>{airport.name}</Select.ItemText>
                                  <Select.ItemIndicator className="ml-auto">
                                    <CheckIcon />
                                  </Select.ItemIndicator>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                            <Select.ScrollDownButton className="flex items-center justify-center h-6">
                              <ChevronDownIcon />
                            </Select.ScrollDownButton>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </div>

                    <div className={fieldContainerClass}>
                      <label className={labelClass}>
                        Estimated arriving date
                      </label>
                      <DatePickerWithIcon
                        selected={firstLeg?.arrivalDate}
                        onChange={(date: Date) => updateLeg('first-leg', 'arrivalDate', date)}
                        placeholder="Select arrival date"
                      />
                    </div>

                    <div className={fieldContainerClass}>
                      <label className={labelClass}>
                        Estimated arriving time
                      </label>
                      <DatePickerWithIcon
                        selected={firstLeg?.arrivalTime}
                        onChange={(date: Date) => updateLeg('first-leg', 'arrivalTime', date)}
                        showTimeSelectOnly={true}
                        timeIntervals={15}
                        timeCaption="Time"
                        dateFormat="HH:mm"
                        fieldType="arrival"
                        placeholder="Select arrival time"
                      />
                    </div>

                    <div className={fieldContainerClass}>
                      <label className={labelClass}>
                        Estimated departure date
                      </label>
                      <DatePickerWithIcon
                        selected={firstLeg?.departureDate}
                        onChange={(date: Date) => updateLeg('first-leg', 'departureDate', date)}
                        placeholder="Select departure date"
                      />
                    </div>

                    <div className={fieldContainerClass}>
                      <label className={labelClass}>
                        Estimated departure time
                      </label>
                      <DatePickerWithIcon
                        selected={firstLeg?.departureTime}
                        onChange={(date: Date) => updateLeg('first-leg', 'departureTime', date)}
                        showTimeSelectOnly={true}
                        timeIntervals={15}
                        timeCaption="Time"
                        dateFormat="HH:mm"
                        fieldType="departure"
                        placeholder="Select departure time"
                      />
                    </div>

                    <div className="flex flex-row gap-2 items-end ml-4">
                      {!hasSecondLeg && (
                        <button
                          onClick={addSecondLeg}
                          className="border-2 border-blue-600 rounded-full p-4 hover:bg-blue-50 transition-colors h-13"
                          title="Add second leg"
                        >
                          <img
                            className="w-4 h-4"
                            src="/images/add-flight-popup/content-add-24px-10@2x.png"
                            alt="Add"
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {hasSecondLeg && (
                <>
                  <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    <div className="w-7"></div>
                    <div className="w-[85%] h-px bg-gray-300 my-2"></div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-2">
                    <div className="flex flex-col items-center">
                      <div className="relative flex flex-col items-center h-24">
                        <div className="absolute top-7 w-0.5 h-32 bg-gray-300 z-0"></div>
                        <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center relative z-10">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-4">
                      <div className="flex flex-col lg:flex-row gap-4">
                        <div className={fieldContainerClass}>
                          <label className={labelClass}>
                            To (Second leg)
                          </label>
                          <Select.Root
                            value={secondLeg?.airport || ''}
                            onValueChange={(value) => updateLeg('second-leg', 'airport', value)}
                          >
                            <Select.Trigger className={selectTriggerClass}>
                              <Select.Value placeholder="Select Airport" />
                              <Select.Icon>
                                <ChevronDownIcon />
                              </Select.Icon>
                            </Select.Trigger>
                            <Select.Portal>
                              <Select.Content className={selectContentClass}>
                                <Select.ScrollUpButton className="flex items-center justify-center h-6">
                                  <ChevronUpIcon />
                                </Select.ScrollUpButton>
                                <Select.Viewport className="p-1">
                                  {airports.filter(airport => airport.code !== DEMO_HOME_AIRPORT).map((airport) => (
                                    <Select.Item
                                      key={airport.code}
                                      value={airport.code}
                                      className={selectItemClass}
                                    >
                                      <Select.ItemText>{airport.name}</Select.ItemText>
                                      <Select.ItemIndicator className="ml-auto">
                                        <CheckIcon />
                                      </Select.ItemIndicator>
                                    </Select.Item>
                                  ))}
                                </Select.Viewport>
                                <Select.ScrollDownButton className="flex items-center justify-center h-6">
                                  <ChevronDownIcon />
                                </Select.ScrollDownButton>
                              </Select.Content>
                            </Select.Portal>
                          </Select.Root>
                        </div>

                        <div className={fieldContainerClass}>
                          <label className={labelClass}>
                            Estimated arriving date
                          </label>
                          <DatePickerWithIcon
                            selected={secondLeg?.arrivalDate}
                            onChange={(date: Date) => updateLeg('second-leg', 'arrivalDate', date)}
                            placeholder="Select arrival date"
                          />
                        </div>

                        <div className={fieldContainerClass}>
                          <label className={labelClass}>
                            Estimated arriving time
                          </label>
                          <DatePickerWithIcon
                            selected={secondLeg?.arrivalTime}
                            onChange={(date: Date) => updateLeg('second-leg', 'arrivalTime', date)}
                            showTimeSelectOnly={true}
                            timeIntervals={15}
                            timeCaption="Time"
                            dateFormat="HH:mm"
                            fieldType="arrival"
                            placeholder="Select arrival time"
                          />
                        </div>

                        <div className={fieldContainerClass}>
                          <label className={labelClass}>
                            Estimated departure date
                          </label>
                          <DatePickerWithIcon
                            selected={secondLeg?.departureDate}
                            onChange={(date: Date) => updateLeg('second-leg', 'departureDate', date)}
                            placeholder="Select departure date"
                          />
                        </div>

                        <div className={fieldContainerClass}>
                          <label className={labelClass}>
                            Estimated departure time
                          </label>
                          <DatePickerWithIcon
                            selected={secondLeg?.departureTime}
                            onChange={(date: Date) => updateLeg('second-leg', 'departureTime', date)}
                            showTimeSelectOnly={true}
                            timeIntervals={15}
                            timeCaption="Time"
                            dateFormat="HH:mm"
                            fieldType="departure"
                            placeholder="Select departure time"
                          />
                        </div>

                        <div className="flex flex-row gap-2 items-end ml-4">
                          <button
                            onClick={removeSecondLeg}
                            className="p-4 hover:bg-gray-100 rounded transition-colors h-13"
                            title="Delete second leg"
                          >
                            <img
                              className="w-8 h-8"
                              src="/images/add-flight-popup/delete-11@2x.png"
                              alt="Delete"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                <div className="w-7"></div>
                <div className="w-[85%] h-px bg-gray-300 my-2"></div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-2">
                <div className="flex flex-col items-center">
                  <div className="relative flex flex-col items-center h-22">
                    <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center relative z-10">
                      <img
                        className="w-4 h-4"
                        src="/images/add-flight-popup/airplane-landing-2@2x.png"
                        alt="Landing"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className={fieldContainerClass}>
                      <label className={labelClass}>
                        Return
                      </label>
                      <TextInput
                        value="Heathrow Airport (LHR)"
                        disabled
                        variant="disabled"
                      />
                    </div>

                    <div className={fieldContainerClass}>
                      <label className={labelClass}>
                        Estimated return date
                      </label>
                      <DatePickerWithIcon
                        selected={returnDate}
                        onChange={(date: Date) => setReturnDate(date)}
                        placeholder="Select return date"
                      />
                    </div>

                    <div className={fieldContainerClass}>
                      <label className={labelClass}>
                        Estimated return time
                      </label>
                      <DatePickerWithIcon
                        selected={returnTime}
                        onChange={(date: Date) => setReturnTime(date)}
                        showTimeSelectOnly={true}
                        timeIntervals={15}
                        timeCaption="Time"
                        dateFormat="HH:mm"
                        fieldType="arrival"
                        placeholder="Select return time"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-7 pb-6">
        <div className="w-full h-px bg-gray-300"></div>
        <div className="flex items-center justify-between px-7">
          <div className="w-80 h-8"></div>
          <div className="flex items-center gap-4">
            <button className="flex items-center justify-center gap-1 px-11 py-4 border border-[#4270e0] text-[#4270e0] bg-transparent rounded-full font-bold text-[15px] hover:bg-blue-50 transition-colors min-w-[200px]">
              Clear All
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center justify-center gap-3 px-11 py-4 bg-gradient-to-b from-[#349ce6] to-[#2974a9] border border-[#1165a2] text-white rounded-full font-bold text-[15px] hover:from-[#2b8bc7] hover:to-[#235f8a] transition-all min-w-[120px]"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}