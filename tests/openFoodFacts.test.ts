import { afterEach, describe, expect, test, vi } from "vitest";
import { lookupBarcode } from "../src/data/openFoodFacts.ts";

const CODE = "3017620422003";
const online = () => true;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("lookupBarcode", () => {
  test("produit trouvé : nom sans marque, marque et contenance séparées", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({
        code: CODE,
        status: 1,
        product: {
          product_name_fr: " Pâte à tartiner ",
          product_name: "Hazelnut spread",
          brands: "Marque, Autre",
          quantity: "400 g ℮",
        },
      }),
    );
    expect(await lookupBarcode(CODE, { fetchFn, isOnline: online })).toEqual({
      status: "found",
      name: "Pâte à tartiner",
      brand: "Marque",
      packageQuantity: { quantity: 400, unit: "g" },
    });
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe(
      `https://world.openfoodfacts.org/api/v2/product/${CODE}.json?fields=code,product_name_fr,product_name,brands,quantity`,
    );
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  test("produit trouvé sans marque ni contenance exploitable", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ status: 1, product: { product_name: "Lait", quantity: "1 brique" } }),
      );
    expect(await lookupBarcode(CODE, { fetchFn, isOnline: online })).toEqual({
      status: "found",
      name: "Lait",
    });
  });

  test("produit inconnu : 404, status 0 ou nom vide", async () => {
    const notFound = vi
      .fn()
      .mockResolvedValue(jsonResponse({ status: 0, status_verbose: "product not found" }, 404));
    expect(await lookupBarcode(CODE, { fetchFn: notFound, isOnline: online })).toEqual({
      status: "not-found",
    });

    const statusZero = vi.fn().mockResolvedValue(jsonResponse({ status: 0 }));
    expect(await lookupBarcode(CODE, { fetchFn: statusZero, isOnline: online })).toEqual({
      status: "not-found",
    });

    const emptyName = vi
      .fn()
      .mockResolvedValue(jsonResponse({ status: 1, product: { product_name: "  " } }));
    expect(await lookupBarcode(CODE, { fetchFn: emptyName, isOnline: online })).toEqual({
      status: "not-found",
    });
  });

  test("code-barres invalide : inconnu sans appel réseau", async () => {
    const fetchFn = vi.fn();
    expect(await lookupBarcode("123", { fetchFn, isOnline: online })).toEqual({
      status: "not-found",
    });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  test("navigateur hors ligne : aucun appel réseau", async () => {
    const fetchFn = vi.fn();
    expect(await lookupBarcode(CODE, { fetchFn, isOnline: () => false })).toEqual({
      status: "offline",
    });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  test("échec réseau (TypeError) : considéré comme hors ligne", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await lookupBarcode(CODE, { fetchFn, isOnline: online })).toEqual({
      status: "offline",
    });
  });

  test("réponse lente : abandon après le délai", async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );
    const pending = lookupBarcode(CODE, { fetchFn, isOnline: online, timeoutMs: 5000 });
    await vi.advanceTimersByTimeAsync(4999);
    expect(fetchFn.mock.calls[0]![1].signal!.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toEqual({ status: "timeout" });
  });

  test("erreur serveur ou JSON invalide : erreur", async () => {
    const serverError = vi.fn().mockResolvedValue(new Response("oops", { status: 500 }));
    expect(await lookupBarcode(CODE, { fetchFn: serverError, isOnline: online })).toEqual({
      status: "error",
    });

    const invalidJson = vi.fn().mockResolvedValue(new Response("<html>", { status: 200 }));
    expect(await lookupBarcode(CODE, { fetchFn: invalidJson, isOnline: online })).toEqual({
      status: "error",
    });
  });
});
