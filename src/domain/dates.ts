import type { ISODate } from "./types.ts";

const DAY_MS = 86_400_000;

/** Vérifie qu'une valeur est une date calendaire YYYY-MM-DD existante. */
export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year ?? NaN, (month ?? NaN) - 1, day ?? NaN);
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
}

/** Date locale (et non UTC) du jour calendaire, au format ISO. */
export function toISODate(date: Date): ISODate {
  const formatted = `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  if (!isISODate(formatted)) throw new RangeError("Date invalide.");
  return formatted;
}

/** Midi local, pour neutraliser les changements d'heure dans les calculs de jours. */
function toNoon(iso: ISODate): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year ?? NaN, (month ?? NaN) - 1, day ?? NaN, 12);
}

export function addDays(iso: ISODate, days: number): ISODate {
  const date = toNoon(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function addMonths(iso: ISODate, months: number): ISODate {
  const date = toNoon(iso);
  date.setMonth(date.getMonth() + months);
  return toISODate(date);
}

/** Nombre de jours calendaires de `from` à `to` (négatif si `to` est passé). */
export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((toNoon(to).getTime() - toNoon(from).getTime()) / DAY_MS);
}

/** 24/05/2024 */
export function formatShortDate(iso: ISODate): string {
  return toNoon(iso).toLocaleDateString("fr-FR");
}

/** 24 mai 2024 */
export function formatLongDate(iso: ISODate): string {
  return toNoon(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Mai 2024 */
export function formatMonth(iso: ISODate): string {
  const label = toNoon(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
