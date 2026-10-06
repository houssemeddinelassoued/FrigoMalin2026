import { useCallback, useState } from "preact/hooks";
import { BarcodeScanner, canScan } from "../components/BarcodeScanner.tsx";
import { Icon, type IconName } from "../components/Icon.tsx";
import { AppHeader, Notice } from "../components/Layout.tsx";
import { useOnline } from "../data/hooks.ts";
import { isBarcode, lookupBarcode } from "../data/openFoodFacts.ts";
import { addItem } from "../data/stock.ts";
import { addDays, addMonths, isISODate } from "../domain/dates.ts";
import type { DateKind, ISODate, Location, StockItem, Unit } from "../domain/types.ts";

const locations: { value: Location; label: string; icon: IconName }[] = [
  { value: "réfrigérateur", label: "Réfrigérateur", icon: "fridge" },
  { value: "placard", label: "Placard", icon: "box" },
  { value: "congélateur", label: "Congélateur", icon: "snow" },
];

const units: Unit[] = ["pièce", "g", "kg", "ml", "l"];

type Lookup = "idle" | "loading" | "found" | "not-found" | "offline" | "timeout" | "error";
type Errors = Partial<Record<"name" | "quantity" | "expiresOn" | "barcode", string | undefined>>;

export function AddProductScreen({
  today,
  onSaved,
}: {
  today: ISODate;
  onSaved: (item: StockItem) => void;
}) {
  const online = useOnline();
  const [scanning, setScanning] = useState(false);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [lookup, setLookup] = useState<Lookup>("idle");
  const [quantityPrefilled, setQuantityPrefilled] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<Unit>("pièce");
  const [location, setLocation] = useState<Location>("réfrigérateur");
  const [dateKind, setDateKind] = useState<DateKind>("DLC");
  const [expiresOn, setExpiresOn] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  async function verify(code: string) {
    if (!isBarcode(code)) {
      setErrors((e) => ({ ...e, barcode: "Un code-barres contient 8, 12, 13 ou 14 chiffres." }));
      return;
    }
    setErrors((e) => ({ ...e, barcode: undefined }));
    setLookup("loading");
    setQuantityPrefilled(false);
    const result = await lookupBarcode(code);
    setLookup(result.status);
    if (result.status === "found") {
      setName(result.name);
      if (result.packageQuantity) {
        setQuantity(String(result.packageQuantity.quantity));
        setUnit(result.packageQuantity.unit);
        setQuantityPrefilled(true);
      }
    }
  }

  const onDetected = useCallback((code: string) => {
    setScanning(false);
    setBarcode(code);
    void verify(code);
  }, []);
  const onUnavailable = useCallback(() => {
    setScanning(false);
    setCameraUnavailable(true);
  }, []);

  function startScan() {
    if (canScan()) {
      setCameraUnavailable(false);
      setScanning(true);
    } else {
      setCameraUnavailable(true);
    }
  }

  async function submit(event: Event) {
    event.preventDefault();
    const amount = Number(quantity.replace(",", "."));
    const found: Errors = {};
    if (name.trim() === "") found.name = "Indiquez le nom de l'aliment.";
    if (!(amount > 0)) found.quantity = "La quantité doit être supérieure à 0.";
    if (!isISODate(expiresOn)) found.expiresOn = "Indiquez une date de péremption valide.";
    if (barcode !== "" && !isBarcode(barcode)) {
      found.barcode = "Un code-barres contient 8, 12, 13 ou 14 chiffres.";
    }
    setErrors(found);
    // Les clés d'erreur sont les id des champs : le focus va au premier invalide.
    const firstInvalid = (["barcode", "name", "quantity", "expiresOn"] as const).find(
      (field) => found[field],
    );
    if (firstInvalid) document.getElementById(firstInvalid)?.focus();
    if (firstInvalid || !isISODate(expiresOn)) return;

    setSaving(true);
    setSaveFailed(false);
    try {
      const item = await addItem(
        {
          name: name.trim(),
          quantity: amount,
          unit,
          location,
          dateKind,
          expiresOn,
          ...(barcode === "" ? {} : { barcode }),
        },
        today,
      );
      onSaved(item);
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  }

  const describe = (field: keyof Errors, hint?: string) =>
    [errors[field] ? `${field}-erreur` : "", hint ?? ""].join(" ").trim() || undefined;

  return (
    <>
      <AppHeader subtitle="Ajouter un produit" back="stock" />
      <main class="screen" id="contenu">
        <h1 class="screen-title">Ajouter un produit</h1>
        <Notice tone="success" icon={online ? "checkCircle" : "cloudOff"}>
          {online
            ? "Fonctionne aussi hors ligne : seule la recherche par code-barres nécessite Internet."
            : "Hors ligne : la saisie manuelle reste complète et l'aliment est enregistré localement."}
        </Notice>

        <form class="form" noValidate onSubmit={submit}>
          <section class="card" aria-labelledby="reconnaissance">
            <h2 id="reconnaissance" class="card-title with-icon">
              <Icon name="barcode" />
              Reconnaissance du produit
            </h2>
            {scanning ? (
              <>
                <BarcodeScanner onDetected={onDetected} onUnavailable={onUnavailable} />
                <button
                  type="button"
                  class="btn btn-secondary btn-block"
                  onClick={() => setScanning(false)}
                >
                  Arrêter le scan
                </button>
              </>
            ) : (
              <button type="button" class="btn btn-tonal btn-block btn-tall" onClick={startScan}>
                <Icon name="camera" />
                Scanner un code-barres
              </button>
            )}
            <div aria-live="polite">
              {lookup === "loading" && (
                <Notice tone="info" icon="search">
                  Recherche dans Open Food Facts…
                </Notice>
              )}
              {lookup === "found" && (
                <Notice tone="success" icon="checkCircle">
                  {quantityPrefilled
                    ? "Produit identifié : nom et quantité préremplis, vous pouvez les corriger."
                    : "Produit identifié : nom prérempli, vous pouvez le corriger."}
                </Notice>
              )}
              {lookup === "not-found" && (
                <Notice tone="warning" icon="info">
                  Produit introuvable dans Open Food Facts : saisissez-le manuellement.
                </Notice>
              )}
              {lookup === "offline" && (
                <Notice tone="warning" icon="cloudOff">
                  Hors ligne : recherche impossible, la saisie manuelle reste complète.
                </Notice>
              )}
              {lookup === "timeout" && (
                <Notice tone="warning" icon="cloudOff">
                  Open Food Facts ne répond pas assez vite : continuez la saisie manuelle.
                </Notice>
              )}
              {lookup === "error" && (
                <Notice tone="warning" icon="cloudOff">
                  Recherche indisponible pour le moment : continuez la saisie manuelle.
                </Notice>
              )}
            </div>
            <Notice tone="info" icon="info">
              Le scan Open Food Facts préremplit le nom et, si elle est connue, la quantité quand
              une connexion est disponible. La date doit toujours être vérifiée et renseignée par
              vos soins.
            </Notice>

            <label class="field-label" for="barcode">
              Saisie manuelle du code-barres <span class="optional">(facultatif)</span>
            </label>
            <div class="input-row">
              <input
                id="barcode"
                class="input"
                inputMode="numeric"
                autoComplete="off"
                value={barcode}
                aria-invalid={!!errors.barcode}
                aria-describedby={describe("barcode")}
                onInput={(e) => setBarcode(e.currentTarget.value.replace(/\D/g, ""))}
              />
              <button
                type="button"
                class="btn btn-secondary-solid"
                disabled={!online || barcode === "" || lookup === "loading"}
                onClick={() => verify(barcode)}
              >
                <Icon name="search" />
                Vérifier
              </button>
            </div>
            {errors.barcode && (
              <p id="barcode-erreur" class="field-error">
                {errors.barcode}
              </p>
            )}
          </section>

          {cameraUnavailable && (
            <Notice tone="danger" icon="cameraOff">
              <strong>Scan indisponible.</strong>
              <p>
                Caméra absente ou refusée, ou lecteur de codes pas encore chargé hors ligne. La
                saisie manuelle reste complète.
              </p>
            </Notice>
          )}

          <section class="card">
            <label class="card-title field-title" for="name">
              Nom de l'aliment <span class="required">Requis</span>
            </label>
            <input
              id="name"
              class="input"
              value={name}
              required
              aria-invalid={!!errors.name}
              aria-describedby={describe("name")}
              onInput={(e) => setName(e.currentTarget.value)}
            />
            {errors.name && (
              <p id="name-erreur" class="field-error">
                {errors.name}
              </p>
            )}
            <div class="input-row">
              <div class="field-grow">
                <label class="field-label" for="quantity">
                  Quantité
                </label>
                <input
                  id="quantity"
                  class="input"
                  inputMode="decimal"
                  value={quantity}
                  aria-invalid={!!errors.quantity}
                  aria-describedby={describe("quantity")}
                  onInput={(e) => setQuantity(e.currentTarget.value)}
                />
              </div>
              <div>
                <label class="field-label" for="unit">
                  Unité
                </label>
                <select
                  id="unit"
                  class="input"
                  value={unit}
                  onChange={(e) => setUnit(e.currentTarget.value as Unit)}
                >
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {errors.quantity && (
              <p id="quantity-erreur" class="field-error">
                {errors.quantity}
              </p>
            )}
          </section>

          <fieldset class="card">
            <legend class="card-title">Lieu de stockage</legend>
            <div class="segmented">
              {locations.map((option) => (
                <label key={option.value} class="segment">
                  <input
                    type="radio"
                    name="location"
                    value={option.value}
                    checked={location === option.value}
                    onChange={() => setLocation(option.value)}
                  />
                  <span class="segment-body">
                    <Icon name={option.icon} />
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset class="card">
            <legend class="card-title">Type d'échéance</legend>
            <div class="choice-list">
              <label class="choice">
                <input
                  type="radio"
                  name="dateKind"
                  value="DLC"
                  checked={dateKind === "DLC"}
                  onChange={() => setDateKind("DLC")}
                />
                <span>
                  <strong>DLC • Date limite de consommation</strong>
                  Mention stricte « À consommer jusqu'au »
                </span>
              </label>
              <label class="choice">
                <input
                  type="radio"
                  name="dateKind"
                  value="DDM"
                  checked={dateKind === "DDM"}
                  onChange={() => setDateKind("DDM")}
                />
                <span>
                  <strong>DDM • Date de durabilité minimale</strong>
                  Mention souple « À consommer de préférence avant »
                </span>
              </label>
            </div>
            <Notice tone="info" icon="info">
              <p>
                <strong>DLC :</strong> sécurité sanitaire (viandes, laitages frais). Ne pas
                consommer après la date.
              </p>
              <p>
                <strong>DDM :</strong> qualité optimale (épicerie, conserves). Reste consommable
                après la date si l'emballage est intact.
              </p>
            </Notice>
          </fieldset>

          <section class="card">
            <label class="card-title field-title" for="expiresOn">
              Date de péremption <span class="required">Requis</span>
            </label>
            <input
              id="expiresOn"
              class="input"
              type="date"
              value={expiresOn}
              aria-invalid={!!errors.expiresOn}
              aria-describedby={describe("expiresOn", "date-aide")}
              onInput={(e) => setExpiresOn(e.currentTarget.value)}
            />
            {errors.expiresOn && (
              <p id="expiresOn-erreur" class="field-error">
                {errors.expiresOn}
              </p>
            )}
            <p
              id="date-aide"
              class={`field-hint ${isISODate(expiresOn) && expiresOn < today ? "is-warning" : ""}`}
            >
              <Icon name="alert" size={16} />
              {isISODate(expiresOn) && expiresOn < today
                ? "Cette date est déjà passée : vérifiez-la avant de valider."
                : "Vérifiez la date imprimée sur l'emballage avant de valider."}
            </p>
            <p class="overline">Ajustement rapide</p>
            <div class="quick-dates">
              <button
                type="button"
                class="btn btn-tonal"
                onClick={() => setExpiresOn(addDays(today, 2))}
              >
                +2 jours
              </button>
              <button
                type="button"
                class="btn btn-tonal"
                onClick={() => setExpiresOn(addDays(today, 7))}
              >
                +1 sem.
              </button>
              <button
                type="button"
                class="btn btn-tonal"
                onClick={() => setExpiresOn(addMonths(today, 1))}
              >
                +1 mois
              </button>
            </div>
          </section>

          {saveFailed && (
            <Notice tone="danger" icon="xCircle">
              L'enregistrement a échoué : le stockage local est indisponible.
            </Notice>
          )}
          <button type="submit" class="btn btn-primary btn-block btn-tall" disabled={saving}>
            <Icon name="save" />
            Enregistrer le produit
          </button>
          <p class="small muted center">
            <Icon name="lock" size={14} /> Sauvegardé dans la mémoire locale de ce navigateur.
            Aucune connexion requise.
          </p>
        </form>
      </main>
    </>
  );
}
