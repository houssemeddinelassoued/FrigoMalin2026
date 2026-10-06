import { daysBetween, formatShortDate } from "./dates.ts";
import type { ISODate, StockItem } from "./types.ts";

/** Seuil du POC : une date dans 0 à 3 jours inclus est « à utiliser en priorité ». */
export const PRIORITY_DAYS = 3;

export type Freshness = "dlc-depassee" | "ddm-depassee" | "aujourdhui" | "proche" | "frais";

export interface FreshnessInfo {
  level: Freshness;
  /** Jours restants avant la date (négatif si dépassée). */
  days: number;
}

type DatedItem = Pick<StockItem, "expiresOn" | "dateKind">;

export function freshness(item: DatedItem, today: ISODate): FreshnessInfo {
  const days = daysBetween(today, item.expiresOn);
  if (days < 0) return { level: item.dateKind === "DLC" ? "dlc-depassee" : "ddm-depassee", days };
  if (days === 0) return { level: "aujourdhui", days };
  if (days <= PRIORITY_DAYS) return { level: "proche", days };
  return { level: "frais", days };
}

export function isPriority(item: DatedItem, today: ISODate): boolean {
  const { level } = freshness(item, today);
  return level === "aujourdhui" || level === "proche";
}

/**
 * Libellé de l'état de fraîcheur. Une DDM dépassée n'est jamais présentée comme
 * une interdiction de consommer, contrairement à une DLC dépassée.
 */
export function freshnessLabel(item: DatedItem, today: ISODate): string {
  const { level, days } = freshness(item, today);
  const date = formatShortDate(item.expiresOn);
  const isDLC = item.dateKind === "DLC";
  switch (level) {
    case "dlc-depassee":
      return `DLC dépassée (${date}) — à jeter`;
    case "ddm-depassee":
      return `DDM dépassée (${date}) — peut encore être consommé`;
    case "aujourdhui":
      return isDLC
        ? `À consommer aujourd'hui (DLC ${date})`
        : `De préférence aujourd'hui (DDM ${date})`;
    case "proche": {
      const delay = `${days} jour${days > 1 ? "s" : ""}`;
      return isDLC
        ? `À consommer sous ${delay} (DLC ${date})`
        : `De préférence sous ${delay} (DDM ${date})`;
    }
    case "frais":
      return `${item.dateKind} ${date}`;
  }
}

/** Aliment encore en stock dont la DLC est strictement antérieure à 	oday : il est à jeter. */
export function isExpiredDlcInStock(
  item: Pick<StockItem, "status" | "expiresOn" | "dateKind">,
  today: ISODate,
): boolean {
  return item.status === "en-stock" && freshness(item, today).level === "dlc-depassee";
}

export function byExpiry(a: DatedItem, b: DatedItem): number {
  return a.expiresOn.localeCompare(b.expiresOn);
}
