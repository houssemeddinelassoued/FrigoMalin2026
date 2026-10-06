import assert from "node:assert/strict";
import { test } from "vitest";
import { generateSeedItems } from "../src/data/seed.ts";

test("generates exactly 40 unique, usable stock items with the requested date distribution", () => {
  const reference = new Date(2026, 9, 5, 23, 30);
  const originalTime = reference.getTime();
  const items = generateSeedItems(reference);
  assert.equal(items.length, 40);
  assert.equal(new Set(items.map((item) => item.id)).size, 40);
  assert.equal(new Set(items.map((item) => item.name)).size, 40);
  assert.equal(
    items.filter((item) => item.dateKind === "DLC" && item.expiresOn < "2026-10-05").length,
    3,
  );
  assert.equal(items.filter((item) => item.expiresOn === "2026-10-05").length, 3);
  assert.equal(
    items.filter((item) => item.dateKind === "DDM" && item.expiresOn < "2026-10-05").length,
    2,
  );
  const future = items.filter((item) => item.expiresOn > "2026-10-05");
  assert.equal(future.length, 32);
  assert.equal(future[0]?.expiresOn, "2026-10-06");
  assert.equal(future.at(-1)?.expiresOn, "2026-11-04");
  assert.equal(new Set(future.map((item) => item.expiresOn)).size, 30);
  for (const item of items) {
    assert.match(item.expiresOn, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(item.addedOn, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(item.addedOn <= item.expiresOn);
    assert.ok(item.name.trim().length > 0);
    assert.ok(item.quantity > 0);
    assert.equal(item.status, "en-stock");
  }
  assert.equal(reference.getTime(), originalTime);
});

test("uses local calendar days across month, year, leap-day and DST boundaries", () => {
  for (const [reference, today, tomorrow, lastDay] of [
    [new Date(2026, 11, 31), "2026-12-31", "2027-01-01", "2027-01-30"],
    [new Date(2028, 1, 28), "2028-02-28", "2028-02-29", "2028-03-29"],
    [new Date(2026, 9, 24, 23, 30), "2026-10-24", "2026-10-25", "2026-11-23"],
    [new Date(2026, 2, 28, 0, 30), "2026-03-28", "2026-03-29", "2026-04-27"],
  ] as const) {
    const items = generateSeedItems(reference);
    assert.equal(items.filter((item) => item.expiresOn === today).length, 3);
    assert.equal(items[8]?.expiresOn, tomorrow);
    assert.equal(items.at(-1)?.expiresOn, lastDay);
  }
});

test("defaults to today and creates independent results on every invocation", () => {
  const before = new Date();
  const items = generateSeedItems();
  const after = new Date();
  const localDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const dates = [localDate(before), localDate(after)];
  assert.ok(dates.includes(items[3]?.expiresOn ?? ""));
  const nextItems = generateSeedItems(before);
  assert.ok(nextItems.every((item) => !items.some((previous) => previous.id === item.id)));
});

test("rejects invalid reference dates explicitly", () => {
  assert.throws(() => generateSeedItems(new Date(Number.NaN)), RangeError);
});
