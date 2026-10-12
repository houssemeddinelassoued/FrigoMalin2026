---
description: "Use when working on FrigoMalin domain logic: aliments, DLC/DDM, dates limites, stockage IndexedDB, idb, schéma, migrations, InventaireRepository, validation des données, recettes JSON, export JSON."
applyTo: "src/stockage/**, src/**/*.json"
---
# Domaine et stockage — FrigoMalin

Référence : [ADR 0001 — stockage](../../docs/adrs/001-stockage.md).

## Règles métier

- Une **DDM** dépassée n'est **jamais** présentée comme une impropriété à la consommation (contrairement à une DLC).
- Dates stockées au format `AAAA-MM-JJ` (date locale, sans fuseau) ; l'affichage au format local relève de l'interface.
- Noms du domaine en français (`aliment`, `dateLimite`, `ouvrirBase`).

## Stockage IndexedDB

- IndexedDB via `idb` uniquement (Dexie écarté).
- Schéma et migrations dans `src/stockage/base.ts` (`upgrade` / `onupgradeneeded`, version numérotée et incrémentée à chaque changement de schéma).
- Tout accès passe par le dépôt `InventaireRepository` ; l'interface n'accède jamais directement à IndexedDB.
- Ne jamais annoncer une sauvegarde réussie avant la confirmation de la transaction (`await tx.done`).
- Toute erreur de stockage est propagée pour être remontée à l'interface (aucune erreur avalée).
- Valider les données lues depuis IndexedDB avant usage.

## Recettes et export

- Les recettes sont un fichier JSON importé comme module (intégré au build et au pré-cache) ; aucun chargement réseau.
- Export des données au format JSON, généré dans le navigateur.
