import Dexie from "dexie";
import type { Table } from "dexie";
import type { StockItem } from "../domain/types.ts";

export class FrigoMalinDB extends Dexie {
  stockItems!: Table<StockItem, StockItem["id"]>;

  constructor() {
    super("frigomalin");
    this.version(1).stores({
      stockItems: "id, expiresOn, status, barcode",
    });
  }
}

export const db = new FrigoMalinDB();
