import { useState } from "preact/hooks";
import { Icon } from "../components/Icon.tsx";
import { ItemCard, type ItemAction } from "../components/ItemCard.tsx";
import { AppHeader, Notice } from "../components/Layout.tsx";
import type { StockState } from "../data/hooks.ts";
import { loadDemoData } from "../data/stock.ts";
import { formatLongDate } from "../domain/dates.ts";
import { isPriority } from "../domain/expiry.ts";
import type { ISODate, StockItem } from "../domain/types.ts";
import { href } from "../router.ts";

export function StockScreen({
  stock,
  today,
  onAction,
}: {
  stock: StockState;
  today: ISODate;
  onAction: (item: StockItem, action: ItemAction) => void;
}) {
  return (
    <>
      <AppHeader subtitle="Mon stock" />
      <main class="screen" id="contenu">
        <h1 class="screen-title">Mon stock</h1>
        <p class="screen-meta">
          <Icon name="calendar" size={16} />
          Date de référence : {formatLongDate(today)}
        </p>
        <StockContent stock={stock} today={today} onAction={onAction} />
      </main>
    </>
  );
}

function StockContent({
  stock,
  today,
  onAction,
}: {
  stock: StockState;
  today: ISODate;
  onAction: (item: StockItem, action: ItemAction) => void;
}) {
  if (stock.status === "loading") {
    return <p class="placeholder">Chargement du stock local…</p>;
  }
  if (stock.status === "error") {
    return (
      <Notice tone="danger" icon="alert">
        <strong>Impossible de lire les données locales.</strong>
        <p>Le stockage du navigateur est peut-être bloqué (navigation privée, quota atteint).</p>
        <button type="button" class="btn btn-secondary" onClick={() => window.location.reload()}>
          Réessayer
        </button>
      </Notice>
    );
  }

  const active = stock.items.filter((item) => item.status === "en-stock");
  if (active.length === 0) return <EmptyStock />;

  const priority = active.filter((item) => isPriority(item, today));
  const others = active.filter((item) => !isPriority(item, today));

  return (
    <>
      <Notice tone="info" icon="lock">
        Données locales sauvegardées sur cet appareil.
      </Notice>
      <div class="stat-grid">
        <div class="card stat">
          <span class="stat-icon stat-icon-primary">
            <Icon name="box" />
          </span>
          <span class="stat-value">{active.length}</span>
          <span class="stat-label">produits en stock</span>
        </div>
        <div class="card stat">
          <span class="stat-icon stat-icon-warning">
            <Icon name="hourglass" />
          </span>
          <span class="stat-value stat-value-warning">{priority.length}</span>
          <span class="stat-label">dates proches</span>
        </div>
      </div>
      <a class="btn btn-primary btn-block" href={href("ajouter")}>
        <Icon name="plusCircle" />
        Ajouter un produit
      </a>

      {priority.length > 0 && (
        <section class="section" aria-labelledby="priorite">
          <div class="section-head">
            <h2 id="priorite" class="section-title">
              <span class="section-title-alert">
                <Icon name="priority" />
              </span>
              À utiliser en priorité
            </h2>
            <span class="chip chip-warning">
              {priority.length} urgent{priority.length > 1 ? "s" : ""}
            </span>
          </div>
          <div class="card-list">
            {priority.map((item) => (
              <ItemCard key={item.id} item={item} today={today} onAction={onAction} />
            ))}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section class="section" aria-labelledby="tout-le-stock">
          <div class="section-head">
            <h2 id="tout-le-stock" class="section-title">
              <Icon name="sort" />
              {priority.length > 0 ? "Reste du stock actif" : "Tout le stock actif"}
            </h2>
            <span class="section-hint">Trié par date croissante</span>
          </div>
          <div class="card-list">
            {others.map((item) => (
              <ItemCard key={item.id} item={item} today={today} onAction={onAction} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function EmptyStock() {
  const [loading, setLoading] = useState(false);
  return (
    <div class="card empty">
      <span class="empty-icon">
        <Icon name="fridge" size={32} />
      </span>
      <h2 class="section-title">Votre stock est vide</h2>
      <p>Ajoutez vos premiers aliments pour suivre leurs dates de consommation.</p>
      <a class="btn btn-primary btn-block" href={href("ajouter")}>
        <Icon name="plusCircle" />
        Ajouter un produit
      </a>
      <button
        type="button"
        class="btn btn-secondary btn-block"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          try {
            await loadDemoData();
          } finally {
            setLoading(false);
          }
        }}
      >
        Charger des données de démonstration
      </button>
    </div>
  );
}
