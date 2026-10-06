import { afterEach, describe, expect, test, vi } from "vitest";
import { addDays, addMonths, daysBetween, isISODate, toISODate } from "../src/domain/dates.ts";
import {
  byExpiry,
  freshness,
  freshnessLabel,
  isExpiredDlcInStock,
  isPriority,
  PRIORITY_DAYS,
} from "../src/domain/expiry.ts";
import type { DateKind, ISODate, StockItem } from "../src/domain/types.ts";

const today = "2026-10-05";

const initialTimeZone = process.env.TZ;

function stocked(
  dateKind: DateKind,
  expiresOn: ISODate,
): Pick<StockItem, "status" | "dateKind" | "expiresOn"> {
  return { status: "en-stock", dateKind, expiresOn };
}

function setTimeZone(timeZone: string) {
  process.env.TZ = timeZone;
}

/** Jour courant tel que l'application le calcule à un instant figé. */
function dayAt(instant: string) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(instant));
  return toISODate(new Date());
}

afterEach(() => {
  vi.useRealTimers();
  if (initialTimeZone === undefined) delete process.env.TZ;
  else process.env.TZ = initialTimeZone;
});

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

describe("freshness : seuils identiques pour DLC et DDM", () => {
  const ref: ISODate = "2026-10-06";
  test.each<[DateKind, string]>([
    ["DLC", "dlc-depassee"],
    ["DDM", "ddm-depassee"],
  ])("%s : dépassée, aujourd'hui, proche (1 à 3 jours) puis fraîche", (dateKind, expired) => {
    const at = (offset: number) => freshness({ expiresOn: addDays(ref, offset), dateKind }, ref);
    expect(at(-365)).toEqual({ level: expired, days: -365 });
    expect(at(-1)).toEqual({ level: expired, days: -1 });
    expect(at(0)).toEqual({ level: "aujourdhui", days: 0 });
    expect(at(1)).toEqual({ level: "proche", days: 1 });
    expect(at(PRIORITY_DAYS)).toEqual({ level: "proche", days: 3 });
    expect(at(PRIORITY_DAYS + 1)).toEqual({ level: "frais", days: 4 });
  });
});

describe("DDM dépassée contre DLC dépassée", () => {
  const ref: ISODate = "2026-10-06";
  const dlc = stocked("DLC", "2026-10-05");
  const ddm = stocked("DDM", "2026-10-05");

  test("une DLC dépassée d'un jour est à jeter", () => {
    expect(freshnessLabel(dlc, ref)).toBe("DLC dépassée (05/10/2026) — à jeter");
    expect(isExpiredDlcInStock(dlc, ref)).toBe(true);
    expect(isPriority(dlc, ref)).toBe(false);
  });

  test("une DDM dépassée d'un jour reste consommable et n'est jamais à jeter", () => {
    const label = freshnessLabel(ddm, ref);
    expect(label).toBe("DDM dépassée (05/10/2026) — peut encore être consommé");
    expect(label).not.toMatch(/jeter/i);
    expect(isExpiredDlcInStock(ddm, ref)).toBe(false);
    expect(isPriority(ddm, ref)).toBe(false);
  });

  test("une DDM dépassée depuis un an reste consommable", () => {
    const old = stocked("DDM", "2025-10-06");
    expect(freshness(old, ref)).toEqual({ level: "ddm-depassee", days: -365 });
    expect(freshnessLabel(old, ref)).toMatch(/peut encore être consommé$/);
    expect(isExpiredDlcInStock(old, ref)).toBe(false);
  });

  test("le jour même de la date, une DLC n'est pas encore à jeter", () => {
    const sameDay = stocked("DLC", ref);
    expect(freshnessLabel(sameDay, ref)).toBe("À consommer aujourd'hui (DLC 06/10/2026)");
    expect(isExpiredDlcInStock(sameDay, ref)).toBe(false);
    expect(isPriority(sameDay, ref)).toBe(true);
  });
});

describe("freshnessLabel : libellés de chaque état", () => {
  const ref: ISODate = "2026-10-06";
  test.each<[DateKind, ISODate, string]>([
    ["DLC", "2026-10-06", "À consommer aujourd'hui (DLC 06/10/2026)"],
    ["DDM", "2026-10-06", "De préférence aujourd'hui (DDM 06/10/2026)"],
    ["DLC", "2026-10-07", "À consommer sous 1 jour (DLC 07/10/2026)"],
    ["DLC", "2026-10-09", "À consommer sous 3 jours (DLC 09/10/2026)"],
    ["DDM", "2026-10-07", "De préférence sous 1 jour (DDM 07/10/2026)"],
    ["DDM", "2026-10-08", "De préférence sous 2 jours (DDM 08/10/2026)"],
    ["DLC", "2026-10-10", "DLC 10/10/2026"],
    ["DDM", "2026-10-10", "DDM 10/10/2026"],
  ])("%s au %s : « %s »", (dateKind, expiresOn, label) => {
    expect(freshnessLabel({ dateKind, expiresOn }, ref)).toBe(label);
  });
});

describe("ajout à 23 h 59 puis consultation à 0 h 01 (Europe/Paris)", () => {
  test("une DLC du jour devient à jeter une minute après minuit", () => {
    setTimeZone("Europe/Paris");
    const item = stocked("DLC", "2026-10-05");
    const added = dayAt("2026-10-05T23:59:00+02:00");
    expect(freshness(item, added)).toEqual({ level: "aujourdhui", days: 0 });
    expect(isExpiredDlcInStock(item, added)).toBe(false);

    const consulted = dayAt("2026-10-06T00:01:00+02:00");
    expect(freshness(item, consulted)).toEqual({ level: "dlc-depassee", days: -1 });
    expect(freshnessLabel(item, consulted)).toMatch(/à jeter$/);
    expect(isExpiredDlcInStock(item, consulted)).toBe(true);
  });

  test("une DDM du jour devient dépassée mais reste consommable après minuit", () => {
    setTimeZone("Europe/Paris");
    const item = stocked("DDM", "2026-10-05");
    expect(freshness(item, dayAt("2026-10-05T23:59:00+02:00")).level).toBe("aujourdhui");
    const consulted = dayAt("2026-10-06T00:01:00+02:00");
    expect(freshness(item, consulted)).toEqual({ level: "ddm-depassee", days: -1 });
    expect(freshnessLabel(item, consulted)).toMatch(/peut encore être consommé$/);
    expect(isExpiredDlcInStock(item, consulted)).toBe(false);
  });

  test("une DLC du lendemain passe de « sous 1 jour » à « aujourd'hui »", () => {
    setTimeZone("Europe/Paris");
    const item = stocked("DLC", "2026-10-06");
    expect(freshnessLabel(item, dayAt("2026-10-05T23:59:00+02:00"))).toBe(
      "À consommer sous 1 jour (DLC 06/10/2026)",
    );
    expect(freshnessLabel(item, dayAt("2026-10-06T00:01:00+02:00"))).toBe(
      "À consommer aujourd'hui (DLC 06/10/2026)",
    );
  });
});

describe("changements d'heure (Europe/Paris)", () => {
  test("mars : le décompte perd exactement un jour par minuit malgré la journée de 23 h", () => {
    setTimeZone("Europe/Paris");
    const item = stocked("DLC", "2026-03-31");
    const days = [
      "2026-03-28T23:59:00+01:00",
      "2026-03-29T00:01:00+01:00",
      "2026-03-29T03:00:00+02:00",
      "2026-03-29T23:59:00+02:00",
      "2026-03-30T00:01:00+02:00",
      "2026-03-31T00:01:00+02:00",
      "2026-04-01T00:01:00+02:00",
    ].map((instant) => freshness(item, dayAt(instant)).days);
    expect(days).toEqual([3, 2, 2, 2, 1, 0, -1]);
  });

  test("octobre : le décompte ne perd qu'un jour pendant la journée de 25 h", () => {
    setTimeZone("Europe/Paris");
    const item = stocked("DLC", "2026-10-26");
    const levels = [
      "2026-10-24T23:59:00+02:00",
      "2026-10-25T00:01:00+02:00",
      "2026-10-25T02:30:00+02:00",
      "2026-10-25T02:30:00+01:00",
      "2026-10-25T23:59:00+01:00",
      "2026-10-26T00:01:00+01:00",
      "2026-10-27T00:01:00+01:00",
    ].map((instant) => freshness(item, dayAt(instant)));
    expect(levels.map(({ days }) => days)).toEqual([2, 1, 1, 1, 1, 0, -1]);
    expect(levels.at(-1)?.level).toBe("dlc-depassee");
  });

  test.each(["Europe/Paris", "UTC"])(
    "le seuil de priorité de 3 jours franchit les deux changements d'heure (%s)",
    (timeZone) => {
      setTimeZone(timeZone);
      expect(freshness({ dateKind: "DLC", expiresOn: "2026-03-31" }, "2026-03-28").days).toBe(3);
      expect(isPriority({ dateKind: "DLC", expiresOn: "2026-04-01" }, "2026-03-28")).toBe(false);
      expect(freshness({ dateKind: "DDM", expiresOn: "2026-10-27" }, "2026-10-24").days).toBe(3);
      expect(isPriority({ dateKind: "DDM", expiresOn: "2026-10-28" }, "2026-10-24")).toBe(false);
    },
  );
});

describe("Europe/Paris contre UTC", () => {
  test("à 0 h 30 à Paris, une DLC de la veille est à jeter alors qu'en UTC c'est encore le jour même", () => {
    const item = stocked("DLC", "2026-10-05");
    setTimeZone("UTC");
    const utcDay = dayAt("2026-10-05T22:30:00Z");
    expect(freshness(item, utcDay).level).toBe("aujourdhui");
    expect(isExpiredDlcInStock(item, utcDay)).toBe(false);

    setTimeZone("Europe/Paris");
    const parisDay = dayAt("2026-10-05T22:30:00Z");
    expect(freshness(item, parisDay).level).toBe("dlc-depassee");
    expect(isExpiredDlcInStock(item, parisDay)).toBe(true);
  });

  test("au Nouvel An à Paris, une DDM du 31 décembre est dépassée mais reste consommable", () => {
    const item = stocked("DDM", "2026-12-31");
    setTimeZone("UTC");
    expect(freshness(item, dayAt("2026-12-31T23:30:00Z")).level).toBe("aujourdhui");
    setTimeZone("Europe/Paris");
    const parisDay = dayAt("2026-12-31T23:30:00Z");
    expect(freshness(item, parisDay)).toEqual({ level: "ddm-depassee", days: -1 });
    expect(freshnessLabel(item, parisDay)).toBe(
      "DDM dépassée (31/12/2026) — peut encore être consommé",
    );
  });
});

describe("29 février", () => {
  test("le 29 février 2028 compte comme un jour à part entière", () => {
    const ref: ISODate = "2028-02-29";
    expect(freshness({ dateKind: "DLC", expiresOn: "2028-02-28" }, ref)).toEqual({
      level: "dlc-depassee",
      days: -1,
    });
    expect(freshness({ dateKind: "DLC", expiresOn: ref }, ref).level).toBe("aujourdhui");
    expect(freshness({ dateKind: "DDM", expiresOn: "2028-03-03" }, ref)).toEqual({
      level: "proche",
      days: 3,
    });
    expect(freshness({ dateKind: "DDM", expiresOn: "2028-03-04" }, ref).level).toBe("frais");
  });

  test("une DLC au 29 février affiche le bon délai et la bonne date", () => {
    expect(freshnessLabel({ dateKind: "DLC", expiresOn: "2028-02-29" }, "2028-02-26")).toBe(
      "À consommer sous 3 jours (DLC 29/02/2028)",
    );
    expect(freshness({ dateKind: "DLC", expiresOn: "2027-03-01" }, "2027-02-26").days).toBe(3);
    expect(freshness({ dateKind: "DLC", expiresOn: "2028-03-01" }, "2028-02-26").days).toBe(4);
  });

  test("ajoutée le 28 février à 23 h 59, une DLC du 28 est à jeter le 29 à 0 h 01", () => {
    setTimeZone("Europe/Paris");
    const item = stocked("DLC", "2028-02-28");
    expect(isExpiredDlcInStock(item, dayAt("2028-02-28T23:59:00+01:00"))).toBe(false);
    const consulted = dayAt("2028-02-29T00:01:00+01:00");
    expect(consulted).toBe("2028-02-29");
    expect(isExpiredDlcInStock(item, consulted)).toBe(true);
    expect(freshnessLabel(item, consulted)).toBe("DLC dépassée (28/02/2028) — à jeter");
  });
});

describe("byExpiry", () => {
  test("trie par date croissante quel que soit le type de date", () => {
    const items = [
      stocked("DLC", "2028-03-01"),
      stocked("DDM", "2027-12-31"),
      stocked("DLC", "2028-02-29"),
      stocked("DDM", "2026-10-06"),
      stocked("DLC", "2026-10-25"),
    ];
    expect([...items].sort(byExpiry).map((item) => item.expiresOn)).toEqual([
      "2026-10-06",
      "2026-10-25",
      "2027-12-31",
      "2028-02-29",
      "2028-03-01",
    ]);
  });

  test("renvoie 0 pour deux dates identiques et un signe cohérent sinon", () => {
    const a = stocked("DLC", "2026-10-06");
    const b = stocked("DDM", "2026-10-07");
    expect(byExpiry(a, stocked("DDM", "2026-10-06"))).toBe(0);
    expect(byExpiry(a, b)).toBeLessThan(0);
    expect(byExpiry(b, a)).toBeGreaterThan(0);
  });
});
