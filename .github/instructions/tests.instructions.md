---
description: "Use when writing or fixing FrigoMalin tests: Vitest, Testing Library, user-event, jsdom, fake-indexeddb, tests de migration IndexedDB, accessibilité et parcours clavier."
applyTo: "**/*.test.ts, **/*.test.tsx, src/test/**"
---
# Tests — FrigoMalin

## Outils

- Vitest + `@testing-library/preact` + `@testing-library/user-event`, environnement jsdom.
- Configuration globale : `src/test/setup.ts` (jest-dom, `fake-indexeddb`, nettoyage).
- `fake-indexeddb` est chargé globalement ; chaque test démarre avec une base vierge.

## Conventions

- Fichiers `*.test.ts(x)` à côté du code testé, rédigés en français.
- Interroger le DOM par rôle et nom accessible (`getByRole`).
- Simuler les interactions avec `user-event` et tester les parcours au clavier.
- Remplacer `InventaireRepository` via son contexte Preact pour isoler l'interface du stockage.
- Toute migration de schéma IndexedDB est couverte par un test.

## Commandes

- `npm test` (watch), `npm run test:run` (exécution unique), `npm run test:coverage` (couverture v8).
