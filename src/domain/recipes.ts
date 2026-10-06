import { daysBetween } from "./dates.ts";
import { byExpiry, freshness } from "./expiry.ts";
import type { ISODate, Recipe, StockItem } from "./types.ts";

/** Un produit qui expire dans 0 à 2 jours est urgent (+3), dans 3 à 5 jours proche (+2). */
const URGENT_DAYS = 2;
const SOON_DAYS = 5;
const MAX_SUGGESTIONS = 5;

export interface CatalogRecipe extends Recipe {
  difficulty: "Facile" | "Moyen";
  steps: string[];
}

export interface RecipeSuggestion<R extends Recipe = Recipe> {
  recipe: R;
  score: number;
  /** Produits du stock utilisés, dans l'ordre des ingrédients. */
  used: StockItem[];
  /** Nombre de produits utilisés qui expirent dans 0 à 2 jours. */
  urgent: number;
}

/** Catalogue local : fonctionne hors ligne, sans IA ni profilage. */
export const catalog: readonly CatalogRecipe[] = [
  {
    id: "omelette-poulet",
    title: "Omelette paysanne au poulet et herbes",
    minutes: 15,
    difficulty: "Facile",
    ingredients: [
      { name: "Poulet", quantity: 200, unit: "g" },
      { name: "Crème fraîche", quantity: 50, unit: "ml" },
      { name: "Œufs", quantity: 3, unit: "pièce" },
    ],
    steps: [
      "Émincez le poulet et faites-le dorer 4 minutes à la poêle avec une noisette de beurre.",
      "Fouettez les œufs avec la crème fraîche, salez, poivrez et ajoutez des herbes.",
      "Versez sur le poulet chaud et laissez prendre 5 à 6 minutes à feu doux.",
    ],
  },
  {
    id: "poelee-petits-pois",
    title: "Poêlée de petits pois et haricots verts",
    minutes: 20,
    difficulty: "Facile",
    ingredients: [
      { name: "Petits pois", quantity: 200, unit: "g" },
      { name: "Haricots verts", quantity: 200, unit: "g" },
      { name: "Beurre", quantity: 20, unit: "g" },
    ],
    steps: [
      "Faites fondre le beurre dans une poêle.",
      "Ajoutez les petits pois surgelés et les haricots égouttés.",
      "Laissez cuire 10 minutes à feu moyen en remuant, puis assaisonnez.",
    ],
  },
  {
    id: "croque-monsieur",
    title: "Croque-monsieur maison",
    minutes: 15,
    difficulty: "Facile",
    ingredients: [
      { name: "Pain de mie", quantity: 4, unit: "pièce" },
      { name: "Jambon", quantity: 2, unit: "pièce" },
      { name: "Emmental", quantity: 60, unit: "g" },
      { name: "Beurre", quantity: 20, unit: "g" },
    ],
    steps: [
      "Beurrez les tranches de pain de mie sur une face.",
      "Garnissez de jambon et d'emmental, puis refermez.",
      "Faites dorer 4 minutes de chaque côté à la poêle.",
    ],
  },
  {
    id: "saumon-epinards",
    title: "Saumon à la crème et aux épinards",
    minutes: 25,
    difficulty: "Moyen",
    ingredients: [
      { name: "Saumon", quantity: 250, unit: "g" },
      { name: "Épinards", quantity: 300, unit: "g" },
      { name: "Crème fraîche", quantity: 100, unit: "ml" },
    ],
    steps: [
      "Faites revenir les épinards 5 minutes dans une sauteuse.",
      "Ajoutez la crème fraîche, puis déposez le saumon par-dessus.",
      "Couvrez et laissez cuire 10 à 12 minutes à feu doux.",
    ],
  },
  {
    id: "riz-crevettes",
    title: "Riz sauté aux crevettes et petits pois",
    minutes: 25,
    difficulty: "Facile",
    ingredients: [
      { name: "Riz", quantity: 200, unit: "g" },
      { name: "Crevettes", quantity: 200, unit: "g" },
      { name: "Petits pois", quantity: 150, unit: "g" },
      { name: "Œufs", quantity: 2, unit: "pièce" },
    ],
    steps: [
      "Faites cuire le riz, puis laissez-le refroidir.",
      "Brouillez les œufs dans une poêle chaude et réservez-les.",
      "Faites sauter le riz avec les crevettes et les petits pois, puis ajoutez les œufs.",
    ],
  },
  {
    id: "pain-perdu",
    title: "Pain perdu",
    minutes: 15,
    difficulty: "Facile",
    ingredients: [
      { name: "Pain de mie", quantity: 4, unit: "pièce" },
      { name: "Lait", quantity: 200, unit: "ml" },
      { name: "Œufs", quantity: 2, unit: "pièce" },
      { name: "Beurre", quantity: 20, unit: "g" },
    ],
    steps: [
      "Battez les œufs avec le lait.",
      "Trempez les tranches de pain dans le mélange.",
      "Faites-les dorer dans le beurre 2 à 3 minutes de chaque côté.",
    ],
  },
];

/** Minuscules, sans accents ni ligatures, pour comparer des noms d'aliments. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replaceAll("œ", "oe")
    .replaceAll("æ", "ae")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** « Oeufs bio » convient pour l'ingrédient « Œufs ». */
export function matchesIngredient(itemName: string, ingredientName: string): boolean {
  return normalizeName(itemName).includes(normalizeName(ingredientName));
}

/**
 * Les meilleures recettes pour le stock actif. Score : +1 par ingrédient
 * disponible, +3 s'il expire dans 0 à 2 jours, +2 dans 3 à 5 jours. Un produit
 * à DLC dépassée n'est pas disponible ; une DDM dépassée compte normalement.
 * À score égal : le plus de produits urgents, puis l'ordre alphabétique.
 */
export function suggestRecipes<R extends Recipe>(
  stock: readonly StockItem[],
  recipes: readonly R[],
  today: ISODate,
): RecipeSuggestion<R>[] {
  const usable = stock
    .filter(
      (item) =>
        item.status === "en-stock" &&
        item.quantity > 0 &&
        freshness(item, today).level !== "dlc-depassee",
    )
    .sort(byExpiry);

  return recipes
    .map((recipe): RecipeSuggestion<R> => {
      const used = recipe.ingredients.flatMap((ingredient) => {
        const item = usable.find((candidate) => matchesIngredient(candidate.name, ingredient.name));
        return item ? [item] : [];
      });
      let score = 0;
      let urgent = 0;
      for (const item of used) {
        const days = daysBetween(today, item.expiresOn);
        score += 1;
        if (days < 0) continue;
        if (days <= URGENT_DAYS) {
          score += 3;
          urgent += 1;
        } else if (days <= SOON_DAYS) {
          score += 2;
        }
      }
      return { recipe, score, used, urgent };
    })
    .filter((suggestion) => suggestion.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.urgent - a.urgent ||
        a.recipe.title.localeCompare(b.recipe.title, "fr"),
    )
    .slice(0, MAX_SUGGESTIONS);
}

export interface ScoredRecipe {
  recipe: Recipe;
  score: number;
  /** Aliments du stock utilisés, dans l'ordre des ingrédients de la recette. */
  usedItems: StockItem[];
}

/** Bonus d'urgence : +3 sous 2 jours, +2 de 3 à 5 jours, 0 sinon (y compris date dépassée). */
function urgencyBonus(item: StockItem, today: ISODate): number {
  const days = daysBetween(today, item.expiresOn);
  if (days < 0) return 0;
  if (days <= URGENT_DAYS) return 3;
  return days <= SOON_DAYS ? 2 : 0;
}

/**
 * Classe les recettes selon le stock : +1 par ingrédient disponible, plus un
 * bonus d'urgence. Un aliment consommé, jeté, congelé, en quantité nulle ou à
 * DLC dépassée n'est pas disponible ; une DDM dépassée compte normalement.
 * Égalité : produits urgents puis ordre alphabétique. Renvoie les 5 meilleures.
 */
export function scoreRecipes(
  stock: readonly StockItem[],
  recipes: readonly Recipe[],
  today: ISODate,
): ScoredRecipe[] {
  const usable = stock
    .filter(
      (item) =>
        item.status === "en-stock" &&
        item.quantity > 0 &&
        freshness(item, today).level !== "dlc-depassee",
    )
    .sort(byExpiry);

  return recipes
    .map((recipe) => {
      const usedItems: StockItem[] = [];
      let score = 0;
      let urgent = 0;
      for (const ingredient of recipe.ingredients) {
        const key = normalizeName(ingredient.name);
        const item = usable.find((candidate) => normalizeName(candidate.name).includes(key));
        if (!item) continue;
        const bonus = urgencyBonus(item, today);
        usedItems.push(item);
        score += 1 + bonus;
        if (bonus > 0) urgent += 1;
      }
      return { recipe, score, usedItems, urgent };
    })
    .filter((entry) => entry.usedItems.length > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.urgent - a.urgent ||
        a.recipe.title.localeCompare(b.recipe.title, "fr"),
    )
    .slice(0, MAX_SUGGESTIONS)
    .map(({ recipe, score, usedItems }) => ({ recipe, score, usedItems }));
}
