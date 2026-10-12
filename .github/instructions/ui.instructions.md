---
description: "Use when building FrigoMalin UI: composants et pages Preact, JSX/TSX, routage preact-iso, état (hooks, contexte), accessibilité, formulaires, styles CSS, invite de mise à jour PWA."
applyTo: "src/**/*.tsx, src/**/*.css"
---
# Interface — FrigoMalin

Référence : [ADR 0002 — framework UI](../../docs/adrs/0002-framework-ui.md).

## Preact

- Preact 11 + TypeScript strict, `@preact/preset-vite`. Pas de `preact/compat` sans justification et test.
- Attribut `class` (et non `className`) dans le JSX.
- Champs texte : utiliser `onInput` (en Preact, `onChange` ne se déclenche qu'à la perte de focus).
- État : `useState`, `useReducer` et contexte. Pas de bibliothèque d'état globale ni de `@preact/signals`.
- Données : passer par `InventaireRepository`, fourni par un contexte Preact ; jamais d'accès direct à IndexedDB.
- Afficher les erreurs de stockage ; ne confirmer une sauvegarde qu'après résolution de l'appel au dépôt.

## Routage et organisation

- Routage `preact-iso` ; chemins déclarés uniquement dans `src/navigation.ts`.
- Écrans routés dans `src/pages/`, composants réutilisables dans `src/composants/`.
- Invite de mise à jour PWA (`registerType: 'prompt'`) : `src/composants/MiseAJour.tsx`.

## Textes et dates

- Textes d'interface en français ; dates affichées au format local.
- Une DDM dépassée n'est jamais présentée comme une impropriété à la consommation.
- Aucune notification navigateur.

## Accessibilité

- Éléments HTML natifs (`form`, `label`, `button`, `dialog`) ; pas de kit UI.
- Libellés explicites, navigation clavier complète.
- Un état n'est jamais porté par la seule couleur.
- `eslint-plugin-jsx-a11y` doit passer sans erreur.
