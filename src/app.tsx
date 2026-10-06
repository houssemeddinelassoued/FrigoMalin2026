import { useEffect, useState } from "preact/hooks";
import type { ItemAction } from "./components/ItemCard.tsx";
import { BottomNav } from "./components/Layout.tsx";
import { useStock, useToday } from "./data/hooks.ts";
import { closeItem } from "./data/stock.ts";
import { isSaved } from "./domain/impact.ts";
import type { StockItem } from "./domain/types.ts";
import { navigate, useRoute } from "./router.ts";
import { AddProductScreen } from "./screens/AddProductScreen.tsx";
import { BilanScreen } from "./screens/BilanScreen.tsx";
import { RecipesScreen } from "./screens/RecipesScreen.tsx";
import { StockScreen } from "./screens/StockScreen.tsx";
import { useThemePreference } from "./theme.ts";

const actionLabels: Record<ItemAction, string> = {
  consommé: "déclaré consommé",
  congelé: "déclaré congelé",
  jeté: "retiré du stock",
};

export function App() {
  const route = useRoute();
  const stock = useStock();
  const today = useToday();
  const [theme, setTheme] = useThemePreference();
  const [notice, setNotice] = useState<string>();

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(undefined), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  async function onAction(item: StockItem, action: ItemAction) {
    const changed = await closeItem(item.id, action, today);
    if (!changed) return;
    const saved = action !== "jeté" && isSaved({ ...item, status: action, closedOn: today });
    setNotice(`« ${item.name} » ${actionLabels[action]}.${saved ? " +1 aliment sauvé !" : ""}`);
  }

  async function onCooked(items: StockItem[], title: string) {
    let count = 0;
    for (const item of items) {
      if (await closeItem(item.id, "consommé", today)) count += 1;
    }
    setNotice(`${title} : ${count} ingrédient(s) déclaré(s) consommé(s).`);
  }

  function onSaved(item: StockItem) {
    setNotice(`« ${item.name} » ajouté au stock.`);
    navigate("stock");
  }

  return (
    <div class="app">
      <a class="skip-link" href="#contenu">
        Aller au contenu
      </a>
      {route === "stock" && <StockScreen stock={stock} today={today} onAction={onAction} />}
      {route === "ajouter" && <AddProductScreen today={today} onSaved={onSaved} />}
      {route === "recettes" && <RecipesScreen stock={stock} today={today} onCooked={onCooked} />}
      {route === "bilan" && (
        <BilanScreen stock={stock} today={today} theme={theme} onThemeChange={setTheme} />
      )}
      <div class="toast-region" role="status" aria-live="polite">
        {notice && <p class="toast">{notice}</p>}
      </div>
      {route !== "ajouter" && <BottomNav current={route} />}
    </div>
  );
}
