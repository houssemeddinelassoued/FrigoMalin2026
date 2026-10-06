# Référence Open Food Facts — FrigoMalin

Documentation officielle : <https://openfoodfacts.github.io/openfoodfacts-server/api/>.
Lecture publique sans authentification ni clé. Données sous licence ODbL.

## Requête

```
GET https://world.openfoodfacts.org/api/v2/product/{code}.json?fields=code,product_name_fr,product_name,brands,quantity
```

- `{code}` : EAN-8, UPC-A (12), EAN-13 ou GTIN-14, chiffres uniquement.
- `fields` : liste séparée par des virgules ; sans elle la réponse dépasse souvent 100 Ko.
- Limite de débit indicative : ~100 requêtes produit/minute/IP. Une recherche par action utilisateur suffit.
- Pas d'en-tête personnalisé depuis le navigateur (évite une requête CORS préalable).

## Réponses réelles (récupérées en 2026, réduites)

Produit trouvé — HTTP 200 :

```json
{
  "code": "3017620422003",
  "product": {
    "brands": "Nutella, Ferrero",
    "code": "3017620422003",
    "product_name": "Nutella",
    "product_name_fr": "Nutella",
    "quantity": "400 g ℮"
  },
  "status": 1,
  "status_verbose": "product found"
}
```

Produit inconnu — HTTP **404** (le corps est tout de même du JSON) :

```json
{ "code": "3017620422999", "status": 0, "status_verbose": "product not found" }
```

Remarques :
- `brands` : liste séparée par des virgules ; la première est la marque principale.
- `product_name_fr` peut être vide : se rabattre sur `product_name`.
- `quantity` : texte libre saisi par des contributeurs (`"400 g ℮"`, `"1 kg"`, `"50 cl"`, `"1,5 L"`, `"6 x 125 g"`, `"environ 300g"`).

## Analyse de `quantity` (domaine pur, `src/domain/quantity.ts`)

| Texte | Résultat |
|---|---|
| `400 g ℮` | 400 g |
| `1 kg` | 1 kg |
| `50 cl` | 500 ml |
| `1,5 L` | 1,5 l |
| `33 cL` | 330 ml |
| `6 x 125 g` | 750 g |
| vide / `environ…` / inconnu | `undefined` (ne rien préremplir) |

## Les cinq issues

| Cas | Signal | Message (français) |
|---|---|---|
| trouvé | 200 + `status: 1` + nom | « Produit identifié : nom (et quantité) préremplis, vous pouvez les corriger. » |
| inconnu | 404, `status: 0`, nom vide | « Produit introuvable dans Open Food Facts : saisissez-le manuellement. » |
| hors ligne | `navigator.onLine === false` ou `TypeError` | « Hors ligne : recherche impossible, la saisie manuelle reste complète. » |
| lent | abandon après ~5 s | « Open Food Facts ne répond pas assez vite : continuez la saisie manuelle. » |
| erreur | 429, 5xx, JSON invalide | « Recherche indisponible pour le moment : continuez la saisie manuelle. » |

## Détection de code-barres dans le navigateur

- `BarcodeDetector` (Shape Detection API) : Chrome/Edge Android, Safari partiel ; absent de Firefox et de nombreux bureaux.
- Repli : paquet `barcode-detector` (ponyfill même API) qui s'appuie sur `zxing-wasm`.
  - Importer dynamiquement pour respecter le budget JS initial.
  - Servir le `.wasm` depuis l'application (pas de CDN) et le précacher dans le service worker, sinon le scan échoue hors ligne.
- Formats utiles : `ean_13`, `ean_8`, `upc_a`, `upc_e`.
- Caméra : `getUserMedia({ video: { facingMode: "environment" } })`, HTTPS requis, toujours libérer les pistes (`track.stop()`).
- Refus de caméra ou absence → message et saisie manuelle du code.

## Hors ligne d'abord

1. Le formulaire manuel est complet sans réseau.
2. Pas d'appel si le navigateur se déclare hors ligne.
3. Délai maximal ; jamais d'attente infinie.
4. Aucun résultat OFF n'est mis en cache ni requis pour enregistrer.
5. Aucune image distante, aucune date de péremption préremplie.

## Motifs de test

Vitest :

```ts
const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
await lookupBarcode("3017620422003", { fetchFn, isOnline: () => true });

// Réponse lente : fetch qui ne se résout qu'à l'abandon
const slow = vi.fn((_url: string, init?: RequestInit) =>
  new Promise<Response>((_, reject) =>
    init?.signal?.addEventListener("abort", () => reject(new DOMException("", "AbortError"))),
  ),
);
vi.useFakeTimers();
const pending = lookupBarcode(code, { fetchFn: slow, timeoutMs: 5000 });
await vi.advanceTimersByTimeAsync(5000);
expect(await pending).toEqual({ status: "timeout" });
```

Playwright :

```ts
await page.route("**/world.openfoodfacts.org/**", (route) =>
  route.fulfill({ status: 404, contentType: "application/json", body: '{"status":0}' }),
);
await context.setOffline(true);
```
