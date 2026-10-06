import { useRef, useState } from "preact/hooks";
import { ConfirmDialog } from "../components/ConfirmDialog.tsx";
import { Icon } from "../components/Icon.tsx";
import { ItemCard, type ItemAction } from "../components/ItemCard.tsx";
import { AppHeader, Notice } from "../components/Layout.tsx";
import type { StockState } from "../data/hooks.ts";
import { loadDemoData } from "../data/stock.ts";
import { formatLongDate } from "../domain/dates.ts";
import { isExpiredDlcInStock, isPriority } from "../domain/expiry.ts";
import type { ISODate, StockItem } from "../domain/types.ts";
import { href } from "../router.ts";

export function StockScreen({
  stock,
  today,
  onAction,
  onDiscardExpired,
}: {
  stock: StockState;
  today: ISODate;
  onAction: (item: StockItem, action: ItemAction) => void;
  onDiscardExpired: () => Promise<number>;
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
        <DiscardExpired stock={stock} today={today} onDiscardExpired={onDiscardExpired} />
        <StockContent stock={stock} today={today} onAction={onAction} />
      </main>
    </>
  );
}

function discardedMessage(count: number): string {
  return count > 1
    ? `${count} produits marqués comme jetés.`
    : `${count} produit marqué comme jeté.`;
}

function DiscardExpired({
  stock,
  today,
  onDiscardExpired,
}: {
  stock: StockState;
  today: ISODate;
  onDiscardExpired: () => Promise<number>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const busyRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const count =
    stock.status === "ready"
      ? stock.items.filter((item) => isExpiredDlcInStock(item, today)).length
      : 0;
  const showDialog = confirming && count > 0 && !busy;

  function cancel() {
    setConfirming(false);
    triggerRef.current?.focus();
  }

  async function confirm() {
    if (busyRef.current) return;
    busyRef.current = true;
    setConfirming(false);
    setBusy(true);
    setMessage(undefined);
    setError(undefined);
    // Le bouton déclencheur est désactivé pendant le traitement : le focus va aux messages.
    feedbackRef.current?.focus();
    try {
      setMessage(discardedMessage(await onDiscardExpired()));
    } catch {
      setError(
        "Impossible de vider les produits périmés : le stockage local a refusé la modification. Aucun produit n'a été modifié.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <div class="discard-expired">
      <button
        ref={triggerRef}
        type="button"
        class="btn btn-secondary btn-block"
        disabled={count === 0 || busy}
        aria-describedby="vider-perimes-aide"
        onClick={() => {
          setMessage(undefined);
          setError(undefined);
          setConfirming(true);
        }}
      >
        <Icon name="trash" />
        Vider les produits périmés
      </button>
      <p id="vider-perimes-aide" class="discard-expired-hint">
        {count === 0
          ? "Aucun produit à DLC dépassée en stock."
          : `${count} produit${count > 1 ? "s" : ""} à DLC dépassée. Les DDM dépassées sont conservées.`}
      </p>
      <div ref={feedbackRef} tabIndex={-1} class="discard-expired-feedback">
        <div role="status" aria-live="polite">
          {busy && <p>Vidage des produits périmés en cours…</p>}
          {message && (
            <Notice tone="success" icon="checkCircle">
              {message}
            </Notice>
          )}
        </div>
        {error && (
          <div role="alert">
            <Notice tone="danger" icon="alert">
              {error}
            </Notice>
          </div>
        )}
      </div>
      {showDialog && (
        <ConfirmDialog
          title={
            count > 1
              ? `Marquer ces ${count} produits comme jetés ?`
              : "Marquer ce produit comme jeté ?"
          }
          confirmLabel={count > 1 ? "Marquer comme jetés" : "Marquer comme jeté"}
          onConfirm={() => void confirm()}
          onCancel={cancel}
        >
          <p>
            Seuls les produits en stock dont la DLC est dépassée sont concernés. Ils sont conservés
            avec le statut « jeté » et ne comptent pas comme sauvés.
          </p>
        </ConfirmDialog>
      )}
    </div>
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
