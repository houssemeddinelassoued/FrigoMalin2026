import { liveQuery } from "dexie";
import { useEffect, useState } from "preact/hooks";
import { toISODate } from "../domain/dates.ts";
import type { ISODate, StockItem } from "../domain/types.ts";
import { db } from "./db.ts";

export type StockState =
  { status: "loading" } | { status: "ready"; items: StockItem[] } | { status: "error" };

/** Tous les aliments (actifs et clos), triés par date, mis à jour en direct. */
export function useStock(): StockState {
  const [state, setState] = useState<StockState>({ status: "loading" });
  useEffect(() => {
    const subscription = liveQuery(() => db.stockItems.orderBy("expiresOn").toArray()).subscribe({
      next: (items) => setState({ status: "ready", items }),
      error: () => setState({ status: "error" }),
    });
    return () => subscription.unsubscribe();
  }, []);
  return state;
}

export function useToday(): ISODate {
  return toISODate(new Date());
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}
