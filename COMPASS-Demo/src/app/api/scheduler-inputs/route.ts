import { NextResponse } from "next/server";
import path from "path";
import * as XLSX from "xlsx";

import { aircraftLandingsData } from "@/mock/aircraftLandings.data";
import {
  normalizeHoursRow,
  normalizeMaintenanceTaskRow,
} from "@/utils/scheduler";

function readSheetRows(filePath: string, sheetName: string) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json<Record<string, string | number | null>>(worksheet, {
    defval: null,
  });
}

export async function GET() {
  try {
    const workbookPath = path.resolve(process.cwd(), "../Draft Aircraft Data 1.xlsx");
    const maintenanceRows = readSheetRows(workbookPath, "Maint Task");
    const hoursRows = readSheetRows(workbookPath, "Aircraft Hours");

    const maintenanceTasks = maintenanceRows
      .map((row, index) => normalizeMaintenanceTaskRow(row, index))
      .filter(Boolean);

    const aircraftHours = hoursRows.map(normalizeHoursRow).filter(Boolean);

    return NextResponse.json({
      maintenanceTasks,
      aircraftHours,
      aircraftLandings: aircraftLandingsData,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load scheduler inputs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
