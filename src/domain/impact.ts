import type { ISODate, StockItem } from "./types.ts";

/**
 * Un aliment est « sauvé » s'il a été déclaré consommé ou congelé au plus tard
 * le jour de sa date. Il s'agit d'une déclaration, pas d'une mesure vérifiée.
 */
export function isSaved(item: StockItem): boolean {
  return (
    (item.status === "consommé" || item.status === "congelé") &&
    item.closedOn !== undefined &&
    item.closedOn <= item.expiresOn
  );
}

export interface MonthlyImpact {
  consumed: number;
  frozen: number;
  total: number;
}

/** Aliments sauvés pendant le mois calendaire de `today`. */
export function monthlyImpact(items: readonly StockItem[], today: ISODate): MonthlyImpact {
  const month = today.slice(0, 7);
  const saved = items.filter((item) => isSaved(item) && item.closedOn?.startsWith(month));
  const consumed = saved.filter((item) => item.status === "consommé").length;
  return { consumed, frozen: saved.length - consumed, total: saved.length };
}
