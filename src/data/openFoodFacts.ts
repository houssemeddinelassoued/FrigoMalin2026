import { parsePackageQuantity, type PackageQuantity } from "../domain/quantity.ts";

export type LookupResult =
  | { status: "found"; name: string; brand?: string; packageQuantity?: PackageQuantity }
  | { status: "not-found" }
  | { status: "offline" }
  | { status: "timeout" }
  | { status: "error" };

export interface LookupOptions {
  fetchFn?: (url: string, init: RequestInit) => Promise<Response>;
  isOnline?: () => boolean;
  timeoutMs?: number;
}

const FIELDS = "code,product_name_fr,product_name,brands,quantity";

/** EAN-8, UPC-A, EAN-13 ou GTIN-14. */
export function isBarcode(code: string): boolean {
  return /^\d{8}$|^\d{12,14}$/.test(code);
}

function nonEmpty(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

/**
 * Recherche un produit dans Open Food Facts. Seule fonctionnalité qui nécessite
 * Internet : chaque échec renvoie un statut distinct et l'interface bascule vers la
 * saisie manuelle, qui reste complète hors ligne.
 */
export async function lookupBarcode(
  code: string,
  {
    fetchFn = (url, init) => fetch(url, init),
    isOnline = () => navigator.onLine,
    timeoutMs = 5000,
  }: LookupOptions = {},
): Promise<LookupResult> {
  if (!isBarcode(code)) return { status: "not-found" };
  if (!isOnline()) return { status: "offline" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchFn(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${FIELDS}`,
      { signal: controller.signal },
    );
    if (response.status === 404) return { status: "not-found" };
    if (!response.ok) return { status: "error" };

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return { status: "error" };
    }
    if (typeof data !== "object" || data === null) return { status: "error" };
    const body = data as Record<string, unknown>;
    if (body["status"] === 0) return { status: "not-found" };
    const product = body["product"];
    if (typeof product !== "object" || product === null) return { status: "not-found" };

    const fields = product as Record<string, unknown>;
    const name = nonEmpty(fields["product_name_fr"]) ?? nonEmpty(fields["product_name"]);
    if (!name) return { status: "not-found" };

    const result: LookupResult = { status: "found", name };
    const brand =
      typeof fields["brands"] === "string" ? nonEmpty(fields["brands"].split(",")[0]) : undefined;
    if (brand) result.brand = brand;
    const quantity = nonEmpty(fields["quantity"]);
    const packageQuantity = quantity ? parsePackageQuantity(quantity) : undefined;
    if (packageQuantity) result.packageQuantity = packageQuantity;
    return result;
  } catch (error) {
    if (controller.signal.aborted) return { status: "timeout" };
    if (error instanceof TypeError) return { status: "offline" };
    return { status: "error" };
  } finally {
    clearTimeout(timer);
  }
}
