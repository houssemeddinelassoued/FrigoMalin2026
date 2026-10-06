import { expect, test } from "vitest";
import { addDays, addMonths, daysBetween, isISODate } from "../src/domain/dates.ts";
import {
  freshness,
  freshnessLabel,
  isExpiredDlcInStock,
  isPriority,
} from "../src/domain/expiry.ts";

const today = "2026-10-05";

test("classifies dates relative to today", () => {
  expect(freshness({ expiresOn: "2026-10-04", dateKind: "DLC" }, today).level).toBe("dlc-depassee");
  expect(freshness({ expiresOn: "2026-10-04", dateKind: "DDM" }, today).level).toBe("ddm-depassee");
  expect(freshness({ expiresOn: today, dateKind: "DLC" }, today).level).toBe("aujourdhui");
  expect(freshness({ expiresOn: "2026-10-08", dateKind: "DLC" }, today)).toEqual({
    level: "proche",
    days: 3,
  });
  expect(freshness({ expiresOn: "2026-10-09", dateKind: "DLC" }, today).level).toBe("frais");
});

test("prioritizes items expiring within 0 to 3 days inclusive", () => {
  expect(isPriority({ expiresOn: today, dateKind: "DDM" }, today)).toBe(true);
  expect(isPriority({ expiresOn: "2026-10-08", dateKind: "DLC" }, today)).toBe(true);
  expect(isPriority({ expiresOn: "2026-10-09", dateKind: "DLC" }, today)).toBe(false);
  expect(isPriority({ expiresOn: "2026-10-04", dateKind: "DLC" }, today)).toBe(false);
});

test("never presents an exceeded DDM as a ban on consumption", () => {
  expect(freshnessLabel({ expiresOn: "2026-10-01", dateKind: "DLC" }, today)).toMatch(/à jeter/);
  const ddm = freshnessLabel({ expiresOn: "2026-10-01", dateKind: "DDM" }, today);
  expect(ddm).toMatch(/peut encore être consommé/);
  expect(ddm).not.toMatch(/jeter/);
  expect(freshnessLabel({ expiresOn: today, dateKind: "DLC" }, today)).toBe(
    "À consommer aujourd'hui (DLC 05/10/2026)",
  );
});

test("ne sélectionne que les DLC dépassées encore en stock", () => {
  expect(
    isExpiredDlcInStock({ status: "en-stock", dateKind: "DLC", expiresOn: "2026-10-04" }, today),
  ).toBe(true);
  expect(
    isExpiredDlcInStock({ status: "en-stock", dateKind: "DDM", expiresOn: "2026-10-04" }, today),
  ).toBe(false);
  expect(
    isExpiredDlcInStock({ status: "en-stock", dateKind: "DLC", expiresOn: today }, today),
  ).toBe(false);
  expect(
    isExpiredDlcInStock({ status: "en-stock", dateKind: "DLC", expiresOn: "2026-10-06" }, today),
  ).toBe(false);
  for (const status of ["consommé", "congelé", "jeté"] as const) {
    expect(isExpiredDlcInStock({ status, dateKind: "DLC", expiresOn: "2026-10-04" }, today)).toBe(
      false,
    );
  }
});

test("computes calendar dates across month and DST boundaries", () => {
  expect(addDays("2026-10-30", 2)).toBe("2026-11-01");
  expect(addMonths("2026-01-15", 1)).toBe("2026-02-15");
  expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2);
  expect(isISODate("2026-02-30")).toBe(false);
  expect(isISODate("05/10/2026")).toBe(false);
});
