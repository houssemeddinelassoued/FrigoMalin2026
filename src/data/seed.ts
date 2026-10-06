import type { ISODate, StockItem } from "../domain/types.ts";

type Product = readonly [
  name: StockItem["name"],
  quantity: StockItem["quantity"],
  unit: StockItem["unit"],
  location: StockItem["location"],
  dateKind: StockItem["dateKind"],
];

const products = [
  ["Filets de poulet", 400, "g", "réfrigérateur", "DLC"],
  ["Saumon frais", 250, "g", "réfrigérateur", "DLC"],
  ["Steaks hachés", 2, "pièce", "réfrigérateur", "DLC"],
  ["Jambon blanc", 150, "g", "réfrigérateur", "DLC"],
  ["Salade en sachet", 125, "g", "réfrigérateur", "DLC"],
  ["Fromage blanc", 500, "g", "réfrigérateur", "DLC"],
  ["Biscuits secs", 200, "g", "placard", "DDM"],
  ["Riz basmati", 1, "kg", "placard", "DDM"],
  ["Crevettes cuites", 200, "g", "réfrigérateur", "DLC"],
  ["Escalopes de dinde", 300, "g", "réfrigérateur", "DLC"],
  ["Raviolis frais", 250, "g", "réfrigérateur", "DLC"],
  ["Soupe fraîche", 500, "ml", "réfrigérateur", "DLC"],
  ["Tofu frais", 200, "g", "réfrigérateur", "DLC"],
  ["Mozzarella", 125, "g", "réfrigérateur", "DLC"],
  ["Crème fraîche", 200, "ml", "réfrigérateur", "DLC"],
  ["Yaourts nature", 4, "pièce", "réfrigérateur", "DLC"],
  ["Fromage de chèvre", 180, "g", "réfrigérateur", "DLC"],
  ["Lait pasteurisé", 1, "l", "réfrigérateur", "DLC"],
  ["Œufs", 6, "pièce", "réfrigérateur", "DDM"],
  ["Emmental", 250, "g", "réfrigérateur", "DDM"],
  ["Beurre doux", 250, "g", "réfrigérateur", "DDM"],
  ["Compote de pommes", 4, "pièce", "placard", "DDM"],
  ["Pain de mie", 500, "g", "placard", "DDM"],
  ["Jus de pomme", 1, "l", "placard", "DDM"],
  ["Lait UHT", 1, "l", "placard", "DDM"],
  ["Petits pois surgelés", 600, "g", "congélateur", "DDM"],
  ["Épinards surgelés", 450, "g", "congélateur", "DDM"],
  ["Filets de colin surgelés", 400, "g", "congélateur", "DDM"],
  ["Haricots verts en conserve", 400, "g", "placard", "DDM"],
  ["Pois chiches en conserve", 400, "g", "placard", "DDM"],
  ["Lentilles sèches", 500, "g", "placard", "DDM"],
  ["Pâtes complètes", 500, "g", "placard", "DDM"],
  ["Semoule de couscous", 500, "g", "placard", "DDM"],
  ["Farine de blé", 1, "kg", "placard", "DDM"],
  ["Flocons d'avoine", 500, "g", "placard", "DDM"],
  ["Noix décortiquées", 150, "g", "placard", "DDM"],
  ["Chocolat noir", 100, "g", "placard", "DDM"],
  ["Café moulu", 250, "g", "placard", "DDM"],
  ["Sauce tomate", 350, "g", "placard", "DDM"],
  ["Thon en conserve", 160, "g", "placard", "DDM"],
] as const satisfies readonly Product[];

function isISODate(value: string): value is ISODate {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function calendarDate(reference: Date, offset: number): ISODate {
  const date = new Date(reference);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  const formatted = `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  if (!isISODate(formatted)) {
    throw new RangeError("La date calculée doit être comprise entre les années 0000 et 9999.");
  }
  return formatted;
}

/** Génère des données de démonstration sans modifier le stock persistant. */
export function generateSeedItems(today: Date = new Date()): StockItem[] {
  if (!Number.isFinite(today.getTime())) {
    throw new RangeError("La date de référence doit être valide.");
  }

  const addedOn = calendarDate(today, -7);
  return products.map(([name, quantity, unit, location, dateKind], index) => {
    let offset: number;
    if (index < 3) {
      offset = index - 3;
    } else if (index < 6) {
      offset = 0;
    } else if (index < 8) {
      offset = index - 8;
    } else {
      offset = 1 + Math.floor(((index - 8) * 29) / 31);
    }

    return {
      id: globalThis.crypto.randomUUID(),
      name,
      quantity,
      unit,
      expiresOn: calendarDate(today, offset),
      dateKind,
      location,
      addedOn,
      status: "en-stock",
    };
  });
}
