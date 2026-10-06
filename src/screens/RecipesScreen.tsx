import { useState } from "preact/hooks";
import { Icon } from "../components/Icon.tsx";
import { AppHeader, Notice } from "../components/Layout.tsx";
import type { StockState } from "../data/hooks.ts";
import { formatLongDate } from "../domain/dates.ts";
import { freshness } from "../domain/expiry.ts";
import {
  catalog,
  matchesIngredient,
  suggestRecipes,
  type CatalogRecipe,
  type RecipeSuggestion,
} from "../domain/recipes.ts";
import type { ISODate, StockItem } from "../domain/types.ts";

type Filter = "priorite" | "complet" | "toutes";

export function RecipesScreen({
  stock,
  today,
  onCooked,
}: {
  stock: StockState;
  today: ISODate;
  onCooked: (items: StockItem[], title: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("toutes");
  const suggestions = stock.status === "ready" ? suggestRecipes(stock.items, catalog, today) : [];
  const isComplete = (s: RecipeSuggestion) => s.used.length === s.recipe.ingredients.length;
  const counts = {
    priorite: suggestions.filter((s) => s.urgent > 0).length,
    complet: suggestions.filter(isComplete).length,
    toutes: suggestions.length,
  };
  const visible = suggestions.filter(
    (s) => filter === "toutes" || (filter === "priorite" ? s.urgent > 0 : isComplete(s)),
  );

  return (
    <>
      <AppHeader subtitle="Recettes" />
      <main class="screen" id="contenu">
        <div class="title-row">
          <h1 class="screen-title">Idées recettes</h1>
          <span class="chip chip-success">
            <Icon name="calendar" size={14} />
            {formatLongDate(today)}
          </span>
        </div>
        <p class="screen-lead">
          Des idées simples avec ce que vous avez déjà dans vos placards et votre frigo.
        </p>
        <Notice tone="info" icon="shield">
          <p>Suggestions issues du catalogue local, hors ligne. Sans IA ni profilage.</p>
          <p>
            <strong>Aucun ingrédient à DLC dépassée n'est proposé.</strong>
          </p>
        </Notice>

        <div class="filter-row" role="group" aria-label="Filtrer les recettes">
          {(
            [
              ["toutes", "Toutes"],
              ["priorite", "Anti-gaspi prioritaire"],
              ["complet", "100 % complet"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              class="filter-chip"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label} ({counts[value]})
            </button>
          ))}
        </div>

        {stock.status === "loading" && <p class="placeholder">Chargement…</p>}
        <div class="card-list">
          {visible.map((suggestion) => (
            <RecipeCard
              key={suggestion.recipe.id}
              suggestion={suggestion}
              today={today}
              onCooked={onCooked}
            />
          ))}
        </div>

        {stock.status === "ready" && visible.length === 0 && (
          <div class="card empty">
            <span class="empty-icon">
              <Icon name="book" size={32} />
            </span>
            <h2 class="section-title">Pas de recette pour ce filtre</h2>
            <p>Aucune recette ne correspond à votre stock pour le moment. Ajoutez des basiques !</p>
          </div>
        )}
      </main>
    </>
  );
}

function RecipeCard({
  suggestion,
  today,
  onCooked,
}: {
  suggestion: RecipeSuggestion<CatalogRecipe>;
  today: ISODate;
  onCooked: (items: StockItem[], title: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { recipe, used, urgent } = suggestion;
  const matches = recipe.ingredients.map((ingredient) => ({
    ingredient,
    item: used.find((candidate) => matchesIngredient(candidate.name, ingredient.name)),
  }));
  const complete = used.length === matches.length;
  const stepsId = `etapes-${recipe.id}`;

  return (
    <article class="card recipe-card" aria-labelledby={`recette-${recipe.id}`}>
      <div class="recipe-head">
        {urgent > 0 && (
          <span class="chip chip-tertiary">
            <Icon name="alert" size={14} />
            Sauvetage prioritaire
          </span>
        )}
        <span class="chip chip-neutral">
          {used.length}/{matches.length} en stock
        </span>
      </div>
      <h2 id={`recette-${recipe.id}`} class="recipe-title">
        {recipe.title}
      </h2>
      <p class="recipe-meta">
        <span>
          <Icon name="clock" size={16} /> {recipe.minutes} min
        </span>
        <span>
          <Icon name="pan" size={16} /> {recipe.difficulty}
        </span>
        {complete && (
          <span class="recipe-zero">
            <Icon name="leaf" size={16} /> Zéro déchet
          </span>
        )}
      </p>

      <h3 class="recipe-subtitle">Ingrédients</h3>
      <ul class="ingredient-list">
        {matches.map(({ ingredient, item }) => {
          const level = item ? freshness(item, today).level : undefined;
          return (
            <li key={ingredient.name} class={item ? "ingredient" : "ingredient is-missing"}>
              <Icon name={item ? "checkCircle" : "xCircle"} size={18} />
              <span class="ingredient-name">{item ? item.name : ingredient.name}</span>
              {!item && <span class="ingredient-tag">Manquant</span>}
              {level === "aujourdhui" && (
                <span class="ingredient-tag tag-warning">À consommer aujourd'hui</span>
              )}
              {level === "proche" && item && (
                <span class="ingredient-tag tag-warning">Sous {freshness(item, today).days} j</span>
              )}
              {(level === "frais" || level === "ddm-depassee") && item && (
                <span class="ingredient-tag">
                  {item.location.charAt(0).toUpperCase() + item.location.slice(1)}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        class="btn btn-tonal btn-block"
        aria-expanded={open}
        aria-controls={stepsId}
        onClick={() => setOpen(!open)}
      >
        {open ? "Masquer les étapes" : "Voir les étapes"}
        <Icon name={open ? "chevronUp" : "chevronDown"} size={18} />
      </button>
      {open && (
        <div id={stepsId} class="recipe-steps">
          <h3 class="recipe-subtitle">
            Préparation en {recipe.steps.length} étapes · prêt en {recipe.minutes} minutes
          </h3>
          <ol>
            {recipe.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <button
            type="button"
            class="btn btn-primary btn-block"
            onClick={() => onCooked(used, recipe.title)}
          >
            <Icon name="pan" />
            Cuisiné ! Déclarer les ingrédients consommés
          </button>
        </div>
      )}
    </article>
  );
}
