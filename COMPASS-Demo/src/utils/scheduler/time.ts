import { RouteLeg } from "./types";

export const MINIMUM_FLIGHT_GAP_HOURS = 4;

export function parseDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function overlaps(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && startB < endA;
}

export function getRouteStart(route: RouteLeg[]): Date {
  return parseDateTime(route[0].departureDate, route[0].departureTime);
}

export function getRouteEnd(route: RouteLeg[]): Date {
  const lastLeg = route[route.length - 1];
  return parseDateTime(lastLeg.arrivalDate, lastLeg.arrivalTime);
}

export function calculateEstimatedHours(route: RouteLeg[]): number {
  const start = getRouteStart(route);
  const end = getRouteEnd(route);
  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return Number(Math.max(diff, 0.5).toFixed(2));
}

export function calculateEstimatedDays(route: RouteLeg[]): number {
  const start = getRouteStart(route);
  const end = getRouteEnd(route);
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 1);
}

export function normalizeMaintenanceType(type: string): string {
  if (type.toLowerCase().includes("depth")) {
    return "In-Depth";
  }
  return "Planned";
}
