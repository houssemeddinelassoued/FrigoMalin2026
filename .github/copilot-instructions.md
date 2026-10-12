# Instructions Copilot — FrigoMalin

PWA en français, sans backend ni compte, installable et utilisable hors ligne : suivi des aliments (DLC/DDM), alertes sur les dates proches ou dépassées, recettes embarquées adaptées au stock.

Contexte à lire avant toute évolution : [PRODUCT.md](../PRODUCT.md), [docs/mvp.md](../docs/mvp.md), [ADR](../docs/adrs/). Toute décision d'architecture nouvelle ou révisée passe par un ADR (agent `Architecte`).

Instructions détaillées (chargées selon les fichiers) :

- [Domaine et stockage](instructions/domain.instructions.md) — DLC/DDM, IndexedDB, migrations, recettes, export.
- [Interface](instructions/ui.instructions.md) — Preact, routage, état, accessibilité.
- [Tests](instructions/tests.instructions.md) — Vitest, Testing Library, fake-indexeddb.

## Contraintes non négociables

- Aucun backend, aucun appel réseau à l'exécution, aucun suivi analytique, aucune notification navigateur.
- Données uniquement dans le navigateur (IndexedDB via `idb`) ; export JSON prévu.
- Jamais de sauvegarde annoncée avant confirmation de la transaction (`tx.done`) ; toute erreur de stockage est remontée à l'interface.
- Une DDM dépassée n'est jamais présentée comme une impropriété à la consommation.

## Pile technique

Preact 11 + TypeScript strict + Vite 8, routage `preact-iso`, PWA `vite-plugin-pwa` (Workbox), IndexedDB via `idb`, état par hooks et contexte.

## Conventions générales

- Code, noms de domaine, textes d'interface et tests en **français**.
- Commentaires uniquement pour clarifier une intention non évidente.

## Structure

```
src/
  main.tsx, App.tsx   point d'entrée, mise en page et routeur
  navigation.ts       chemins des routes
  pages/              écrans routés
  composants/         composants réutilisables
  stockage/           IndexedDB (schéma, migrations, dépôt)
  test/setup.ts       configuration Vitest
public/               ressources statiques (icônes)
docs/                 périmètre MVP et ADR
reports/              rapports de feature rédigés par l'agent Lead
.githooks/            hooks Git versionnés (activés par npm run hooks:install)
```

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` / `npm run preview` | Serveur de dev / build servi localement (test hors ligne) |
| `npm run build` | `tsc -b` puis build de production avec service worker |
| `npm run lint` / `npm run lint:fix` | ESLint (TypeScript, jsx-a11y, hooks) |
| `npm run format` / `npm run format:check` | Prettier (Markdown exclu) |
| `npm test` / `npm run test:run` / `npm run test:coverage` | Vitest watch / unique / couverture |
| `npm run hooks:install` | Active les hooks Git de `.githooks/` (pre-commit : prompt de revue de sécurité copié dans le presse-papiers, puis confirmation y/n) |

Une tâche n'est terminée que si `npm run lint`, `npm run format:check`, `npm run test:run` et `npm run build` réussissent.
