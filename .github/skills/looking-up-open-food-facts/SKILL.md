---
name: looking-up-open-food-facts
description: Use when scanning a barcode, looking up a product by EAN/GTIN, prefilling a product form, or calling or testing the Open Food Facts API (world.openfoodfacts.org) in a browser app that must keep working offline, on slow networks or with unknown products.
---

# Interroger Open Food Facts (hors ligne d'abord)

## Vue d'ensemble

Open Food Facts (OFF) est une **aide facultative** : il préremplit un formulaire, il ne le conditionne jamais.
Toute réponse a **cinq issues** à traiter explicitement ; la saisie manuelle reste toujours possible.

## Contrat de recherche

```
GET https://world.openfoodfacts.org/api/v2/product/{code}.json?fields=code,product_name_fr,product_name,brands,quantity
```

| Issue | Détection | Interface |
|---|---|---|
| `found` | HTTP 200, `status: 1`, nom non vide | préremplir nom (+ quantité si analysable), tout reste modifiable |
| `not-found` | HTTP 404 **ou** `status: 0` **ou** nom vide | « introuvable », saisie manuelle |
| `offline` | `navigator.onLine === false` (sans appel) ou `TypeError` de `fetch` | « hors ligne », saisie manuelle |
| `timeout` | `AbortController` déclenché (≈ 5 s) | « réponse trop lente », saisie manuelle |
| `error` | autre HTTP (429, 5xx), JSON invalide | « recherche indisponible », saisie manuelle |

Code invalide (`/^\d{8}$|^\d{12,14}$/` non respecté) : refuser **avant** tout appel réseau.

## Règles

- Un seul module réseau (ici `src/data/openFoodFacts.ts`), `fetch` injectable pour les tests.
- Demander uniquement les champs utiles (`fields=`) : réponse ~200 octets au lieu de ~100 Ko.
- Ne **jamais** préremplir la DLC/DDM depuis OFF ; ne jamais afficher d'image distante (hors ligne + vie privée).
- `quantity` est du texte libre (`"400 g ℮"`, `"6 x 125 g"`, `"1,5 L"`) : l'analyser dans le domaine pur, `undefined` si doute.
- Garder la marque dans un champ séparé, ne pas la fusionner au nom.
- Le service worker ne met pas OFF en cache : pas de résultat périmé, pas de quota.
- Scan : `BarcodeDetector` natif si présent, sinon ponyfill `barcode-detector` + `zxing-wasm` chargé à la demande et **servi localement** (wasm précaché).

## Tests

- Unitaires : `fetchFn` simulé (`new Response(...)`), `vi.useFakeTimers()` pour le délai, état en ligne simulé.
- E2E Playwright : `page.route("**/world.openfoodfacts.org/**", …)` pour 200 / 404 / réponse retardée, `context.setOffline(true)` pour le hors-ligne.
- Aucun appel réel à OFF dans les tests.

## Erreurs fréquentes

| Erreur | Correction |
|---|---|
| Tout `catch` renvoie « erreur » | distinguer `offline` / `timeout` / `error` |
| Pas de délai maximal | `AbortController` + `setTimeout`, nettoyer le timer |
| Seul le 404 = inconnu | `status: 0` aussi |
| La recherche bloque le formulaire | le formulaire reste soumissible pendant la recherche |
| `quantity` copiée telle quelle | analyser, sinon ne rien préremplir |

Réponses réelles réduites, détails du scan et motifs de test : voir [reference.md](reference.md).
