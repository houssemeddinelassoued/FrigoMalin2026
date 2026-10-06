import { useState } from "preact/hooks";
import { Icon, type IconName } from "../components/Icon.tsx";
import { AppHeader, Notice } from "../components/Layout.tsx";
import type { StockState } from "../data/hooks.ts";
import { createBackup, importBackup, InvalidBackupError } from "../data/stock.ts";
import { formatLongDate, formatMonth, isISODate } from "../domain/dates.ts";
import { monthlyImpact } from "../domain/impact.ts";
import type { ISODate } from "../domain/types.ts";
import type { ThemePreference } from "../theme.ts";

const LAST_EXPORT_KEY = "frigomalin:last-export";

type BackupStatus =
  { tone: "success"; message: string } | { tone: "danger"; message: string } | undefined;

function readLastExport(): ISODate | undefined {
  try {
    const value = localStorage.getItem(LAST_EXPORT_KEY);
    return isISODate(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

const themeOptions: { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: "system", label: "Système", icon: "monitor" },
  { value: "light", label: "Clair", icon: "sun" },
  { value: "dark", label: "Sombre", icon: "moon" },
];

export function BilanScreen({
  stock,
  today,
  theme,
  onThemeChange,
}: {
  stock: StockState;
  today: ISODate;
  theme: ThemePreference;
  onThemeChange: (value: ThemePreference) => void;
}) {
  const impact = monthlyImpact(stock.status === "ready" ? stock.items : [], today);
  const [lastExport, setLastExport] = useState(readLastExport);
  const [status, setStatus] = useState<BackupStatus>();

  async function exportBackup() {
    const backup = await createBackup(today);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `frigomalin-sauvegarde-${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
    try {
      localStorage.setItem(LAST_EXPORT_KEY, today);
    } catch {
      // Simple confort d'affichage : l'export reste valide sans cette mémorisation.
    }
    setLastExport(today);
    setStatus({
      tone: "success",
      message: `Sauvegarde exportée : ${backup.items.length} aliment(s).`,
    });
  }

  async function onImport(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      const count = await importBackup(await file.text());
      setStatus({
        tone: "success",
        message: `Sauvegarde importée : ${count} aliment(s) fusionné(s).`,
      });
    } catch (error) {
      setStatus({
        tone: "danger",
        message:
          error instanceof InvalidBackupError
            ? `Fichier refusé. ${error.message}`
            : "L'import a échoué : le stockage local est indisponible.",
      });
    }
  }

  return (
    <>
      <AppHeader subtitle="Mon bilan" />
      <main class="screen" id="contenu">
        <span class="chip chip-success">
          <Icon name="leaf" size={14} />
          Rapport mensuel local
        </span>
        <h1 class="screen-title">Mon bilan</h1>
        <p class="screen-lead">Le récapitulatif de vos aliments consommés ou préservés à temps.</p>

        <section class="card" aria-labelledby="bilan-mois">
          <div class="bilan-head">
            <span class="stat-icon stat-icon-primary">
              <Icon name="badge" />
            </span>
            <div>
              <p class="overline">Activité mensuelle</p>
              <h2 id="bilan-mois" class="card-title">
                Bilan de préservation
              </h2>
            </div>
            <span class="chip chip-success">{formatMonth(today)}</span>
          </div>
          <p class="bilan-count">
            <strong>{impact.total}</strong> aliment{impact.total > 1 ? "s" : ""} sauvé
            {impact.total > 1 ? "s" : ""}
            <span>ce mois-ci</span>
          </p>
          <Notice tone="info" icon="info">
            <p>Produits déclarés consommés ou congelés au plus tard à leur date de péremption.</p>
            <p>Ce compteur repose sur vos déclarations, pas sur une mesure du gaspillage évité.</p>
            <p class="small">
              Un produit ne compte qu'une seule fois. Une action effectuée après la date limite
              n'augmente pas ce compteur.
            </p>
          </Notice>
          <h3 class="overline">Répartition par geste</h3>
          <ul class="breakdown">
            <li>
              <span class="stat-icon stat-icon-consume">
                <Icon name="utensils" />
              </span>
              <span class="breakdown-text">
                <strong>Consommés à temps</strong>
                Repas préparés et dégustés
              </span>
              <span class="breakdown-value">
                <strong>{impact.consumed}</strong> produits
              </span>
            </li>
            <li>
              <span class="stat-icon stat-icon-freeze">
                <Icon name="snow" />
              </span>
              <span class="breakdown-text">
                <strong>Mis au congélateur à temps</strong>
                Durée de vie prolongée
              </span>
              <span class="breakdown-value">
                <strong>{impact.frozen}</strong> produits
              </span>
            </li>
          </ul>
        </section>

        <section class="card" aria-labelledby="donnees">
          <div class="bilan-head">
            <span class="stat-icon stat-icon-freeze">
              <Icon name="lock" />
            </span>
            <div>
              <h2 id="donnees" class="card-title">
                Mes données & confidentialité
              </h2>
              <p class="overline">100 % hors ligne</p>
            </div>
          </div>
          <Notice tone="info" icon="shield">
            Vos données sont stockées exclusivement dans ce navigateur (IndexedDB). Aucun compte,
            aucun traçage, aucune transmission vers un serveur.
          </Notice>
          <Notice tone="warning" icon="alert">
            <strong>Attention au nettoyage du navigateur</strong>
            <p>
              Vider le cache ou l'historique peut effacer votre stock. Pensez à faire une sauvegarde
              régulière.
            </p>
          </Notice>
          <button type="button" class="btn btn-primary btn-block" onClick={exportBackup}>
            <Icon name="download" />
            Exporter une sauvegarde (JSON)
          </button>
          <label class="btn btn-tonal btn-block file-button">
            <Icon name="upload" />
            Importer une sauvegarde
            <input type="file" accept="application/json,.json" onChange={onImport} />
          </label>
          <div aria-live="polite">
            {status && (
              <Notice
                tone={status.tone}
                icon={status.tone === "success" ? "checkCircle" : "xCircle"}
              >
                {status.message}
              </Notice>
            )}
          </div>
          {lastExport && (
            <p class="small muted">Dernière sauvegarde exportée le {formatLongDate(lastExport)}.</p>
          )}
        </section>

        <fieldset class="card">
          <legend class="card-title">Apparence</legend>
          <div class="segmented">
            {themeOptions.map((option) => (
              <label key={option.value} class="segment">
                <input
                  type="radio"
                  name="theme"
                  value={option.value}
                  checked={theme === option.value}
                  onChange={() => onThemeChange(option.value)}
                />
                <span class="segment-body">
                  <Icon name={option.icon} />
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </main>
    </>
  );
}
