import { freshness, freshnessLabel, type Freshness } from "../domain/expiry.ts";
import type { ISODate, StockItem } from "../domain/types.ts";
import { Icon, type IconName } from "./Icon.tsx";

const badgeIcons: Record<Freshness, IconName> = {
  "dlc-depassee": "xCircle",
  "ddm-depassee": "info",
  aujourdhui: "clock",
  proche: "hourglass",
  frais: "checkCircle",
};

const locationIcons: Record<StockItem["location"], IconName> = {
  réfrigérateur: "fridge",
  congélateur: "snow",
  placard: "box",
};

export function StatusBadge({ item, today }: { item: StockItem; today: ISODate }) {
  const { level } = freshness(item, today);
  return (
    <span class={`badge badge-${level}`}>
      <Icon name={badgeIcons[level]} size={16} />
      {freshnessLabel(item, today)}
    </span>
  );
}

export type ItemAction = "consommé" | "congelé" | "jeté";

export function ItemCard({
  item,
  today,
  onAction,
}: {
  item: StockItem;
  today: ISODate;
  onAction: (item: StockItem, action: ItemAction) => void;
}) {
  const { level } = freshness(item, today);
  // Une DLC dépassée ne se consomme pas : seule l'action « jeter » est proposée.
  const expiredDLC = level === "dlc-depassee";
  const canFreeze = !expiredDLC && item.location !== "congélateur";
  const quantity = `${item.quantity.toLocaleString("fr-FR")} ${item.unit === "pièce" ? (item.quantity > 1 ? "pièces" : "pièce") : item.unit}`;

  return (
    <article class="card item-card" aria-labelledby={`item-${item.id}`}>
      <div class="item-main">
        <span class={`item-thumb thumb-${expiredDLC ? "danger" : item.location}`}>
          <Icon name={expiredDLC ? "alert" : locationIcons[item.location]} size={26} />
        </span>
        <div class="item-text">
          <h3 id={`item-${item.id}`} class="item-name">
            {item.name}
          </h3>
          <p class="item-meta">
            {quantity} • {item.location.charAt(0).toUpperCase() + item.location.slice(1)}
          </p>
          <StatusBadge item={item} today={today} />
        </div>
        {!expiredDLC && (
          <details class="item-menu">
            <summary class="icon-button" aria-label={`Plus d'actions pour ${item.name}`}>
              <Icon name="more" />
            </summary>
            <div class="item-menu-panel">
              <button type="button" class="btn btn-ghost" onClick={() => onAction(item, "jeté")}>
                <Icon name="trash" size={18} />
                Retirer du stock (jeté)
              </button>
            </div>
          </details>
        )}
      </div>
      <div class="item-actions">
        {expiredDLC ? (
          <button type="button" class="btn btn-danger" onClick={() => onAction(item, "jeté")}>
            <Icon name="trash" size={18} />
            Retirer du stock
          </button>
        ) : (
          <>
            <button
              type="button"
              class="btn btn-consume"
              onClick={() => onAction(item, "consommé")}
            >
              <Icon name="utensils" size={18} />
              Consommé
            </button>
            {canFreeze && (
              <button
                type="button"
                class="btn btn-freeze"
                onClick={() => onAction(item, "congelé")}
              >
                <Icon name="snow" size={18} />
                Congelé
              </button>
            )}
          </>
        )}
      </div>
    </article>
  );
}
