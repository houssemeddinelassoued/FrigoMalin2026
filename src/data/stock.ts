import { isISODate } from "../domain/dates.ts";
import { isExpiredDlcInStock } from "../domain/expiry.ts";
import type { ISODate, StockItem } from "../domain/types.ts";
import { db } from "./db.ts";
import { generateSeedItems } from "./seed.ts";

export type NewStockItem = Omit<StockItem, "id" | "addedOn" | "status" | "closedOn">;

export async function addItem(input: NewStockItem, today: ISODate): Promise<StockItem> {
  const item: StockItem = {
    ...input,
    id: globalThis.crypto.randomUUID(),
    addedOn: today,
    status: "en-stock",
  };
  await db.stockItems.add(item);
  return item;
}

/**
 * Retire un aliment du stock actif. Renvoie `false` s'il l'a déjà quitté : une
 * même déclaration répétée ne compte donc qu'une fois.
 */
export async function closeItem(
  id: StockItem["id"],
  status: Exclude<StockItem["status"], "en-stock">,
  today: ISODate,
): Promise<boolean> {
  return db.transaction("rw", db.stockItems, async () => {
    const item = await db.stockItems.get(id);
    if (!item || item.status !== "en-stock") return false;
    await db.stockItems.update(id, { status, closedOn: today });
    return true;
  });
}

/**
 * Marque comme jetés, en une seule transaction, tous les aliments en stock dont la
 * DLC est dépassée. Les enregistrements sont conservés ; renvoie le nombre traité.
 */
export async function discardExpiredItems(today: ISODate): Promise<number> {
  return db.transaction("rw", db.stockItems, async () => {
    const active = await db.stockItems.where("status").equals("en-stock").toArray();
    const expired = active.filter((item) => isExpiredDlcInStock(item, today));
    for (const item of expired) {
      await db.stockItems.update(item.id, { status: "jeté", closedOn: today });
    }
    return expired.length;
  });
}

export async function loadDemoData(today: Date = new Date()): Promise<void> {
  await db.stockItems.bulkAdd(generateSeedItems(today));
}

const BACKUP_APP = "frigomalin";
const BACKUP_VERSION = 1;

export interface Backup {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedOn: ISODate;
  items: StockItem[];
}

export async function createBackup(today: ISODate): Promise<Backup> {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedOn: today,
    items: await db.stockItems.toArray(),
  };
}

export class InvalidBackupError extends Error {}

const units = new Set(["pièce", "g", "kg", "ml", "l"]);
const locations = new Set(["réfrigérateur", "congélateur", "placard"]);
const statuses = new Set(["en-stock", "consommé", "congelé", "jeté"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseItem(value: unknown, index: number): StockItem {
  const fail = (field: string): never => {
    throw new InvalidBackupError(`Aliment n° ${index + 1} : champ « ${field} » invalide.`);
  };
  if (!isRecord(value)) return fail("aliment");
  const { id, name, barcode, quantity, unit, expiresOn, dateKind, location, addedOn, status } =
    value;
  const closedOn = value["closedOn"];
  if (typeof id !== "string" || id === "") fail("id");
  if (typeof name !== "string" || name.trim() === "") fail("name");
  if (barcode !== undefined && typeof barcode !== "string") fail("barcode");
  if (typeof quantity !== "number" || !(quantity > 0)) fail("quantity");
  if (typeof unit !== "string" || !units.has(unit)) fail("unit");
  if (!isISODate(expiresOn)) fail("expiresOn");
  if (dateKind !== "DLC" && dateKind !== "DDM") fail("dateKind");
  if (typeof location !== "string" || !locations.has(location)) fail("location");
  if (!isISODate(addedOn)) fail("addedOn");
  if (typeof status !== "string" || !statuses.has(status)) fail("status");
  if (closedOn !== undefined && !isISODate(closedOn)) fail("closedOn");

  // Les vérifications ci-dessus garantissent la forme d'un StockItem.
  const item = {
    id,
    name,
    quantity,
    unit,
    expiresOn,
    dateKind,
    location,
    addedOn,
    status,
    ...(barcode === undefined ? {} : { barcode }),
    ...(closedOn === undefined ? {} : { closedOn }),
  } as StockItem;
  return item;
}

/** Valide le contenu d'un fichier de sauvegarde, sans rien écrire. */
export function parseBackup(text: string): StockItem[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new InvalidBackupError("Le fichier n'est pas un JSON valide.");
  }
  if (!isRecord(data) || data["app"] !== BACKUP_APP) {
    throw new InvalidBackupError("Ce fichier n'est pas une sauvegarde FrigoMalin.");
  }
  if (data["version"] !== BACKUP_VERSION) {
    throw new InvalidBackupError("Version de sauvegarde non prise en charge.");
  }
  const items = data["items"];
  if (!Array.isArray(items)) throw new InvalidBackupError("La liste des aliments est absente.");
  return items.map(parseItem);
}

/** Fusionne la sauvegarde dans le stock : un aliment de même id est remplacé. */
export async function importBackup(text: string): Promise<number> {
  const items = parseBackup(text);
  await db.stockItems.bulkPut(items);
  return items.length;
}
