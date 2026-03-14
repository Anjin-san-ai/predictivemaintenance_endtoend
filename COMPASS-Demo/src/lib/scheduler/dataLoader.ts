// =============================================================================
// COMPASS Scheduling Engine — Excel Data Loader
// =============================================================================
// Implements the DataProvider interface using the xlsx package to read
// aircraft-data.xlsx. The engine only depends on the DataProvider interface,
// so this file is the only one that needs to change when the backend
// data source is replaced with a database.
// =============================================================================

import * as XLSX from 'xlsx';
import * as path from 'path';
import { readFileSync } from 'fs';
import type {
  DataProvider,
  RawScheduleData,
  RawMaintTask,
  RawTailStatus,
  RawFlightLeg,
  MaintTypeRaw,
  IntervalType,
} from './types';

// Path resolved relative to the Next.js project root (process.cwd()).
const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'aircraft-data.xlsx');

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Extracts an "HH:MM" string from a Date object produced by xlsx when parsing
 * an Excel time cell (base date is 1899-12-30, only the time portion is valid).
 */
function timeToHHMM(d: Date): string {
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Returns a Date at UTC midnight for a given date.
 * Handles both Date objects (from xlsx cellDates) and strings.
 */
function toUTCDate(value: Date | string): Date {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  // Fallback: parse a "YYYY-MM-DD" string
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Validates that a value is a recognised MaintTypeRaw. */
function assertMaintType(value: string, row: number): MaintTypeRaw {
  if (value === 'Planned Maintenance' || value === 'In-Depth Maintenance') {
    return value;
  }
  throw new Error(`Unknown MaintType "${value}" on Maint Task row ${row + 2}`);
}

/** Validates that a value is a recognised IntervalType. */
function assertIntervalType(value: string, row: number): IntervalType {
  if (value === 'Hours' || value === 'Days' || value === 'Landings') {
    return value;
  }
  throw new Error(`Unknown IntervalType "${value}" on Maint Task row ${row + 2}`);
}

// -----------------------------------------------------------------------------
// Sheet parsers
// -----------------------------------------------------------------------------

function parseMaintTasks(ws: XLSX.WorkSheet): RawMaintTask[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { raw: true });
  return rows.map((row, i) => {
    const tailNumber: string = String(row['Tail Number'] ?? '').trim();
    const taskId: string = String(row['Task'] ?? '').trim();
    const maintType = assertMaintType(String(row['Maint Type'] ?? '').trim(), i);
    const maintName: string = String(row['Maint Name'] ?? '').trim();
    const durationHours = Number(row['Estimate Duration (Man-Hours)']);
    const crewCount = Number(row['Estimate no of people'] ?? 1);
    const interval = Number(row['Interval']);
    const intervalType = assertIntervalType(String(row['Interval Type'] ?? '').trim(), i);

    const rawLastCompleted = row['Last Completed'];
    const lastCompletedDate: Date | null =
      rawLastCompleted instanceof Date ? toUTCDate(rawLastCompleted) : null;

    const taskDetails: string = String(row['Task Details'] ?? '').trim();
    const trade: string = String(row['Trade'] ?? '').trim();

    if (!tailNumber) throw new Error(`Missing Tail Number on Maint Task row ${i + 2}`);
    if (!taskId) throw new Error(`Missing Task ID on Maint Task row ${i + 2}`);
    if (isNaN(durationHours) || durationHours <= 0)
      throw new Error(`Invalid DurationHours on Maint Task row ${i + 2}`);
    if (isNaN(interval) || interval <= 0)
      throw new Error(`Invalid Interval on Maint Task row ${i + 2}`);

    return {
      tailNumber,
      taskId,
      maintType,
      maintName,
      durationHours,
      crewCount,
      interval,
      intervalType,
      lastCompletedDate,
      taskDetails,
      trade,
    };
  });
}

function parseTailStatuses(ws: XLSX.WorkSheet): RawTailStatus[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { raw: true });
  return rows.map((row, i) => {
    const tailNumber: string = String(row['Tail Number'] ?? '').trim();
    if (!tailNumber) throw new Error(`Missing Tail Number on Aircraft Hours row ${i + 2}`);

    const rawHours = row['Current Hours'];
    const rawLandings = row['No of Landings'];

    const currentHours: number | null =
      rawHours != null && !isNaN(Number(rawHours)) ? Number(rawHours) : null;
    const currentLandings: number | null =
      rawLandings != null && !isNaN(Number(rawLandings)) ? Number(rawLandings) : null;

    return { tailNumber, currentHours, currentLandings };
  });
}

function parseFlightLegs(ws: XLSX.WorkSheet): RawFlightLeg[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { raw: true });
  return rows.map((row, i) => {
    const flightNumber = Number(row['flightNumber']);
    const legNumber = Number(row['leg']);
    const origin: string = String(row['from'] ?? '').trim();
    const destination: string = String(row['to'] ?? '').trim();

    if (isNaN(flightNumber)) throw new Error(`Missing flightNumber on Flights row ${i + 2}`);
    if (isNaN(legNumber)) throw new Error(`Missing leg on Flights row ${i + 2}`);
    if (!origin) throw new Error(`Missing origin on Flights row ${i + 2}`);
    if (!destination) throw new Error(`Missing destination on Flights row ${i + 2}`);

    // Dates arrive as Date objects (UTC midnight) via cellDates: true
    const rawDepDate = row['departureDate'];
    const rawArrDate = row['arrivalDate'];
    if (!(rawDepDate instanceof Date))
      throw new Error(`Invalid departureDate on Flights row ${i + 2}`);
    if (!(rawArrDate instanceof Date))
      throw new Error(`Invalid arrivalDate on Flights row ${i + 2}`);

    const departureDate = toUTCDate(rawDepDate);
    const arrivalDate = toUTCDate(rawArrDate);

    // Times arrive as Date objects with 1899-12-30 as base (xlsx behaviour)
    const rawDepTime = row['departureTime'];
    const rawArrTime = row['arrivalTime'];
    if (!(rawDepTime instanceof Date))
      throw new Error(`Invalid departureTime on Flights row ${i + 2}`);
    if (!(rawArrTime instanceof Date))
      throw new Error(`Invalid arrivalTime on Flights row ${i + 2}`);

    const departureTime = timeToHHMM(rawDepTime);
    const arrivalTime = timeToHHMM(rawArrTime);

    return {
      flightNumber,
      legNumber,
      origin,
      destination,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
    };
  });
}

// -----------------------------------------------------------------------------
// Excel DataProvider implementation
// -----------------------------------------------------------------------------

/**
 * ExcelDataProvider reads aircraft scheduling data from aircraft-data.xlsx.
 * It implements the DataProvider interface so it can be swapped for a
 * database-backed provider without any changes to the scheduling engine.
 */
export class ExcelDataProvider implements DataProvider {
  private readonly filePath: string;

  constructor(filePath: string = DATA_FILE_PATH) {
    this.filePath = filePath;
  }

  async load(): Promise<RawScheduleData> {
    // Use Node.js fs directly so Next.js server components can access the file.
    // XLSX.readFile uses its own internal fs wrapper which Turbopack blocks.
    const buffer = readFileSync(this.filePath);
    const workbook = XLSX.read(buffer, { cellDates: true });

    const requiredSheets = ['Maint Task', 'Aircraft Hours', 'Flights'];
    for (const name of requiredSheets) {
      if (!workbook.Sheets[name]) {
        throw new Error(`Required sheet "${name}" not found in ${this.filePath}`);
      }
    }

    const maintTasks = parseMaintTasks(workbook.Sheets['Maint Task']);
    const tailStatuses = parseTailStatuses(workbook.Sheets['Aircraft Hours']);
    const flightLegs = parseFlightLegs(workbook.Sheets['Flights']);

    return { maintTasks, tailStatuses, flightLegs };
  }
}

/**
 * Convenience function: load raw schedule data from the default Excel file.
 * Use this in server components and API routes.
 */
export async function loadRawScheduleData(): Promise<RawScheduleData> {
  const provider = new ExcelDataProvider();
  return provider.load();
}
