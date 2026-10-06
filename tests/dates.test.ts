import { afterEach, describe, expect, test, vi } from "vitest";
import {
  addDays,
  addMonths,
  daysBetween,
  formatLongDate,
  formatMonth,
  formatShortDate,
  isISODate,
  toISODate,
} from "../src/domain/dates.ts";

const initialTimeZone = process.env.TZ;

function setTimeZone(timeZone: string) {
  process.env.TZ = timeZone;
}

/** Fige l'horloge sur un instant absolu (avec décalage explicite). */
function freezeAt(instant: string) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(instant));
}

/** Jour courant calculé comme dans l'application (useToday). */
function currentDay() {
  return toISODate(new Date());
}

afterEach(() => {
  vi.useRealTimers();
  if (initialTimeZone === undefined) delete process.env.TZ;
  else process.env.TZ = initialTimeZone;
});

describe("isISODate", () => {
  test("accepte les dates calendaires existantes au format AAAA-MM-JJ", () => {
    for (const value of ["2026-10-06", "2026-01-01", "2026-12-31", "2026-04-30"]) {
      expect(isISODate(value)).toBe(true);
    }
  });

  test("n'accepte le 29 février que les années bissextiles", () => {
    expect(isISODate("2028-02-29")).toBe(true);
    expect(isISODate("2000-02-29")).toBe(true);
    expect(isISODate("2026-02-29")).toBe(false);
    expect(isISODate("2100-02-29")).toBe(false);
    expect(isISODate("1900-02-29")).toBe(false);
  });

  test("refuse les jours ou mois inexistants et les formats non ISO", () => {
    for (const value of [
      "2026-13-01",
      "2026-00-10",
      "2026-04-31",
      "2026-10-00",
      "2026-1-5",
      "06/10/2026",
      "2026-10-06T00:00",
      " 2026-10-06",
      "",
    ]) {
      expect(isISODate(value), value).toBe(false);
    }
  });

  test("refuse les valeurs qui ne sont pas des chaînes", () => {
    for (const value of [null, undefined, 20261006, new Date(2026, 9, 6), {}]) {
      expect(isISODate(value)).toBe(false);
    }
  });
});

describe("toISODate", () => {
  test("complète mois et jour avec des zéros", () => {
    setTimeZone("Europe/Paris");
    expect(toISODate(new Date("2026-01-05T12:00:00+01:00"))).toBe("2026-01-05");
  });

  test("lève une RangeError pour une date invalide", () => {
    expect(() => toISODate(new Date("pas une date"))).toThrow(RangeError);
  });
});

describe("Europe/Paris contre UTC", () => {
  test("un même instant du soir donne le lendemain à Paris (heure d'été)", () => {
    const instant = new Date("2026-10-05T22:30:00Z");
    setTimeZone("UTC");
    expect(toISODate(instant)).toBe("2026-10-05");
    setTimeZone("Europe/Paris");
    expect(toISODate(instant)).toBe("2026-10-06");
  });

  test("un même instant de la Saint-Sylvestre change d'année à Paris (heure d'hiver)", () => {
    const instant = new Date("2026-12-31T23:30:00Z");
    setTimeZone("UTC");
    expect(toISODate(instant)).toBe("2026-12-31");
    setTimeZone("Europe/Paris");
    expect(toISODate(instant)).toBe("2027-01-01");
  });

  test("ajout à 23 h 59 et consultation à 0 h 01 (Paris) restent le même jour en UTC", () => {
    setTimeZone("UTC");
    freezeAt("2026-10-05T23:59:00+02:00");
    const added = currentDay();
    vi.setSystemTime(new Date("2026-10-06T00:01:00+02:00"));
    expect([added, currentDay()]).toEqual(["2026-10-05", "2026-10-05"]);
  });

  test.each(["Europe/Paris", "UTC", "Pacific/Kiritimati", "Pacific/Pago_Pago"])(
    "les calculs et formats sur dates ISO ne dépendent pas du fuseau (%s)",
    (timeZone) => {
      setTimeZone(timeZone);
      expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
      expect(daysBetween("2026-10-01", "2026-10-31")).toBe(30);
      expect(formatShortDate("2026-10-06")).toBe("06/10/2026");
      expect(formatLongDate("2026-10-06")).toBe("6 octobre 2026");
      expect(formatMonth("2026-10-06")).toBe("Octobre 2026");
    },
  );
});

describe("ajout à 23 h 59 puis consultation à 0 h 01 (Europe/Paris)", () => {
  test("le jour courant change à minuit local", () => {
    setTimeZone("Europe/Paris");
    freezeAt("2026-10-05T23:59:00+02:00");
    const added = currentDay();
    vi.setSystemTime(new Date("2026-10-06T00:01:00+02:00"));
    const consulted = currentDay();
    expect(added).toBe("2026-10-05");
    expect(consulted).toBe("2026-10-06");
    expect(daysBetween(added, consulted)).toBe(1);
  });

  test("le passage au 31 décembre puis au 1er janvier change d'année", () => {
    setTimeZone("Europe/Paris");
    freezeAt("2026-12-31T23:59:00+01:00");
    expect(currentDay()).toBe("2026-12-31");
    vi.setSystemTime(new Date("2027-01-01T00:01:00+01:00"));
    expect(currentDay()).toBe("2027-01-01");
  });

  test("le 28 février à 23 h 59 puis 0 h 01 mène au 29 février d'une année bissextile", () => {
    setTimeZone("Europe/Paris");
    freezeAt("2028-02-28T23:59:00+01:00");
    expect(currentDay()).toBe("2028-02-28");
    vi.setSystemTime(new Date("2028-02-29T00:01:00+01:00"));
    expect(currentDay()).toBe("2028-02-29");
    vi.setSystemTime(new Date("2028-02-29T23:59:00+01:00"));
    expect(currentDay()).toBe("2028-02-29");
    vi.setSystemTime(new Date("2028-03-01T00:01:00+01:00"));
    expect(currentDay()).toBe("2028-03-01");
  });

  test("le 28 février à 0 h 01 mène au 1er mars d'une année non bissextile", () => {
    setTimeZone("Europe/Paris");
    freezeAt("2027-02-28T23:59:00+01:00");
    expect(currentDay()).toBe("2027-02-28");
    vi.setSystemTime(new Date("2027-03-01T00:01:00+01:00"));
    expect(currentDay()).toBe("2027-03-01");
  });
});

describe("changement d'heure de mars (29/03/2026, 2 h → 3 h à Paris)", () => {
  test("le jour courant ne saute pas pendant la journée de 23 heures", () => {
    setTimeZone("Europe/Paris");
    freezeAt("2026-03-28T23:59:00+01:00");
    expect(currentDay()).toBe("2026-03-28");
    vi.setSystemTime(new Date("2026-03-29T00:01:00+01:00"));
    expect(currentDay()).toBe("2026-03-29");
    vi.setSystemTime(new Date("2026-03-29T01:59:00+01:00"));
    expect(currentDay()).toBe("2026-03-29");
    vi.setSystemTime(new Date("2026-03-29T03:00:00+02:00"));
    expect(currentDay()).toBe("2026-03-29");
    vi.setSystemTime(new Date("2026-03-29T23:59:00+02:00"));
    expect(currentDay()).toBe("2026-03-29");
    vi.setSystemTime(new Date("2026-03-30T00:01:00+02:00"));
    expect(currentDay()).toBe("2026-03-30");
  });

  test.each(["Europe/Paris", "UTC"])("les calculs de jours restent exacts (%s)", (timeZone) => {
    setTimeZone(timeZone);
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
    expect(daysBetween("2026-03-29", "2026-03-30")).toBe(1);
    expect(daysBetween("2026-03-30", "2026-03-28")).toBe(-2);
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
    expect(addDays("2026-03-30", -2)).toBe("2026-03-28");
    expect(addMonths("2026-03-15", 1)).toBe("2026-04-15");
    expect(addMonths("2026-02-28", 1)).toBe("2026-03-28");
  });
});

describe("changement d'heure d'octobre (25/10/2026, 3 h → 2 h à Paris)", () => {
  test("le jour courant ne change qu'une fois pendant la journée de 25 heures", () => {
    setTimeZone("Europe/Paris");
    freezeAt("2026-10-24T23:59:00+02:00");
    expect(currentDay()).toBe("2026-10-24");
    vi.setSystemTime(new Date("2026-10-25T00:01:00+02:00"));
    expect(currentDay()).toBe("2026-10-25");
    // 2 h 30 existe deux fois : avant (UTC+2) puis après (UTC+1) le recul.
    vi.setSystemTime(new Date("2026-10-25T02:30:00+02:00"));
    expect(currentDay()).toBe("2026-10-25");
    vi.setSystemTime(new Date("2026-10-25T02:30:00+01:00"));
    expect(currentDay()).toBe("2026-10-25");
    vi.setSystemTime(new Date("2026-10-25T23:59:00+01:00"));
    expect(currentDay()).toBe("2026-10-25");
    vi.setSystemTime(new Date("2026-10-26T00:01:00+01:00"));
    expect(currentDay()).toBe("2026-10-26");
  });

  test.each(["Europe/Paris", "UTC"])("les calculs de jours restent exacts (%s)", (timeZone) => {
    setTimeZone(timeZone);
    expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2);
    expect(daysBetween("2026-10-25", "2026-10-26")).toBe(1);
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
    expect(addDays("2026-10-26", -2)).toBe("2026-10-24");
    expect(addMonths("2026-10-15", 1)).toBe("2026-11-15");
    expect(addMonths("2026-09-25", 1)).toBe("2026-10-25");
  });

  test.each(["Europe/Paris", "UTC"])(
    "les deux changements d'heure s'annulent sur une saison (%s)",
    (timeZone) => {
      setTimeZone(timeZone);
      expect(daysBetween("2026-03-01", "2026-11-01")).toBe(245);
      expect(addDays("2026-03-01", 245)).toBe("2026-11-01");
      expect(daysBetween("2026-01-01", "2027-01-01")).toBe(365);
    },
  );
});

describe("29 février", () => {
  test.each(["Europe/Paris", "UTC"])("addDays et daysBetween traversent février (%s)", (tz) => {
    setTimeZone(tz);
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-02-29", 1)).toBe("2028-03-01");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
    expect(daysBetween("2028-02-01", "2028-03-01")).toBe(29);
    expect(daysBetween("2027-02-01", "2027-03-01")).toBe(28);
    expect(daysBetween("2028-01-01", "2029-01-01")).toBe(366);
  });

  test.each(["Europe/Paris", "UTC"])("addMonths aboutit au 29 février (%s)", (timeZone) => {
    setTimeZone(timeZone);
    expect(addMonths("2028-01-29", 1)).toBe("2028-02-29");
    expect(addMonths("2028-02-29", -1)).toBe("2028-01-29");
    expect(addMonths("2028-03-29", -1)).toBe("2028-02-29");
  });

  test.each(["Europe/Paris", "UTC", "Pacific/Kiritimati", "Pacific/Pago_Pago"])(
    "le 29 février s'affiche en français sans décalage (%s)",
    (timeZone) => {
      setTimeZone(timeZone);
      expect(formatShortDate("2028-02-29")).toBe("29/02/2028");
      expect(formatLongDate("2028-02-29")).toBe("29 février 2028");
      expect(formatMonth("2028-02-29")).toBe("Février 2028");
    },
  );
});
