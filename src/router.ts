import { useEffect, useState } from "preact/hooks";

// Routage par hash (ADR 0003) : #/stock, #/ajouter, #/recettes, #/bilan.
export const routes = ["stock", "ajouter", "recettes", "bilan"] as const;
export type Route = (typeof routes)[number];

export function parseRoute(hash: string): Route {
  const name = hash.replace(/^#\/?/, "");
  return routes.find((route) => route === name) ?? "stock";
}

export function href(route: Route): string {
  return `#/${route}`;
}

export function navigate(route: Route): void {
  window.location.hash = href(route);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const update = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return route;
}
