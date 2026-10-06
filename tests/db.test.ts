import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { test } from "vitest";
import { db } from "../src/data/db.ts";
import { generateSeedItems } from "../src/data/seed.ts";

test("persists stock and supports the three declared indexes after reopening", async () => {
  try {
    await db.delete();
    await db.open();
    assert.equal(db.name, "frigomalin");
    assert.equal(db.verno, 1);
    assert.equal(db.stockItems.schema.primKey.name, "id");
    assert.deepEqual(db.stockItems.schema.indexes.map((index) => index.name).sort(), [
      "barcode",
      "expiresOn",
      "status",
    ]);
    assert.equal(await db.stockItems.count(), 0);
    const items = generateSeedItems(new Date(2026, 9, 5));
    const first = items[0];
    assert.ok(first);
    first.barcode = "3017620422003";
    await db.stockItems.bulkAdd(items);
    db.close();
    await db.open();
    assert.equal(await db.stockItems.count(), 40);
    assert.deepEqual(await db.stockItems.get(first.id), first);
    assert.equal(await db.stockItems.where("barcode").equals(first.barcode).count(), 1);
    assert.equal(await db.stockItems.where("status").equals("en-stock").count(), 40);
    assert.equal(await db.stockItems.where("expiresOn").equals("2026-10-05").count(), 3);
    const ordered = await db.stockItems.orderBy("expiresOn").toArray();
    assert.deepEqual(
      ordered.map((item) => item.expiresOn),
      items.map((item) => item.expiresOn).sort(),
    );
  } finally {
    await db.delete();
  }
});
