import { useEffect, useState } from "preact/hooks";

export type ThemePreference = "system" | "light" | "dark";

// Même clé que le script en ligne de index.html, qui applique le thème avant le premier rendu.
export const THEME_KEY = "frigomalin:theme";

const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): "light" | "dark" {
  if (preference === "system") return systemDark ? "dark" : "light";
  return preference;
}

function applyTheme(preference: ThemePreference): void {
  document.documentElement.dataset["theme"] = resolveTheme(preference, darkQuery().matches);
}

/** Préférence de thème mémorisée dans le navigateur ; « system » suit le réglage de l'appareil. */
export function useThemePreference(): [ThemePreference, (value: ThemePreference) => void] {
  const [preference, setPreference] = useState(readThemePreference);

  useEffect(() => {
    applyTheme(preference);
    if (preference !== "system") return;
    const query = darkQuery();
    const update = () => applyTheme("system");
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [preference]);

  function choose(value: ThemePreference) {
    try {
      if (value === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, value);
    } catch {
      // Le thème s'applique quand même pour cette session.
    }
    setPreference(value);
  }

  return [preference, choose];
}
