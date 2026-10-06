# ADR 0004 — Recherche de produit par code-barres via Open Food Facts

- **Statut :** Proposé
- **Date :** 2026-10-05

## Contexte et problème

L’ajout d’un produit peut être accéléré en scannant son code-barres puis en préremplissant le formulaire depuis Open Food Facts (OFF). FrigoMalin reste une application statique, sans backend ni secret, et doit fonctionner **hors ligne d’abord** (`.github/copilot-instructions.md`) : OFF est le seul appel réseau autorisé, toujours avec repli.

Le scan et la fiche existaient déjà, mais sans délai maximal, sans distinction entre « hors ligne » et « erreur », avec la marque concaténée au nom et la quantité ignorée. La documentation utile de l’API est regroupée dans le skill `.github/skills/looking-up-open-food-facts/`.

## Facteurs de décision

- L’utilisateur ne doit jamais être bloqué : la saisie manuelle reste toujours possible.
- Aucune attente indéfinie sur un réseau lent.
- Messages distincts et compréhensibles pour chaque cas.
- Volume de données minimal (mobile, budget).
- Aucune nouvelle dépendance.

## Décision proposée

1. **Point d’accès :** `GET https://world.openfoodfacts.org/api/v2/product/{code}.json?fields=code,product_name_fr,product_name,brands,quantity`. Le filtre `fields` réduit la réponse aux seuls champs utilisés.
2. **Contrat de `lookupBarcode`** (`src/data/openFoodFacts.ts`) : cinq résultats, à savoir `found` (`name`, `brand?`, `packageQuantity?`), `not-found`, `offline`, `timeout` et `error`.
   - `navigator.onLine` est vérifié avant la requête et produit `offline`.
   - Un délai de 5 s est appliqué via `AbortController`. Son dépassement produit `timeout`.
   - Un `TypeError` réseau produit `offline`.
   - Une réponse 404 ou `status: 0` produit `not-found`.
3. **Nom sans marque :** le nom vient de `product_name_fr`, sinon de `product_name`. La marque est exposée séparément.
4. **Quantité :** `parsePackageQuantity` (`src/domain/quantity.ts`) reconnaît des formats comme `500 g`, `1,5 L`, `33 cl` (converti en 330 ml) ou `4 x 125 g`. Les autres formats renvoient `undefined`, et rien n’est alors prérempli.
5. **Interface :** hors ligne, le bouton « Vérifier » est désactivé et un message invite à saisir le produit à la main. Chaque résultat affiche un message dédié.
6. **Détection :** le `BarcodeDetector` natif est utilisé s’il existe. Sinon, le ponyfill `barcode-detector` (zxing-wasm, déjà installé) est chargé à la demande, avec un wasm servi localement et non depuis un CDN.

## Options écartées

| Option | Raison du rejet |
|---|---|
| Réponse complète sans `fields` | Plusieurs dizaines de Ko inutiles par requête. |
| Pas de délai (laisser `fetch` attendre) | Expérience bloquée sur un réseau lent. |
| Bibliothèque de scan supplémentaire (Quagga, html5-qrcode…) | Nouvelle dépendance, alors que le ponyfill existant suffit. |
| Cache local des produits OFF | Utile plus tard, mais hors du périmètre du MVP. |

## Conséquences

### Positives

- Les cinq cas sont testés : unitaires dans `tests/openFoodFacts.test.ts` et `tests/quantity.test.ts`, et e2e dans `e2e/product-lookup.spec.ts` (trouvé, inconnu, lent, hors ligne).
- La saisie manuelle fonctionne dans tous les cas.

### Négatives

- Sans `BarcodeDetector` natif, le premier scan télécharge le wasm, d’environ 1,09 Mo.
- La qualité du préremplissage dépend des données communautaires d’OFF.

## Risques et vérifications

| Risque | Probabilité / impact | Signal | Réduction |
|---|---|---|---|
| Wasm du lecteur non préchargé : `build/service-worker.ts` l’exclut volontairement et le met en cache au premier usage. Sans API native, le scan est donc indisponible lors d’une première utilisation hors ligne. | Moyenne / modéré | Le scanner échoue hors ligne sur Firefox ou Safari avant tout scan en ligne | Saisie manuelle du code toujours disponible. Si le besoin se confirme, précharger le wasm, au prix d’environ 1,09 Mo à l’installation. |
| Limitation de débit ou indisponibilité d’OFF | Faible / faible | Réponses 429 ou 5xx, délais dépassés | Délai de 5 s et message `error` ou `timeout`, puis repli sur la saisie manuelle. |
| Données incomplètes ou erronées | Élevée / faible | Nom vide, quantité non reconnue | Les champs restent modifiables. Rien n’est prérempli si la donnée est absente ou non reconnue. |
| Changement d’API ou de CORS | Faible / modéré | Échec systématique des recherches | Version `v2` figée dans l’URL et tests e2e qui simulent la réponse. Surveiller la documentation OFF (skill). |
| Permission caméra refusée | Moyenne / faible | Erreur à l’ouverture du scanner | Message explicite et saisie manuelle du code. |
