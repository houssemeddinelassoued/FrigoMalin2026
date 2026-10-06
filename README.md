# FrigoMalin

POC en cours d'une application web qui vise à aider les foyers à suivre leurs
aliments et à repérer ceux à utiliser en priorité.

> **État actuel :** le projet contient encore l'écran de démarrage Vite + Preact.
> Les parcours décrits ci-dessous sont des objectifs du POC, pas des
> fonctionnalités déjà disponibles.

## Objectif du produit

FrigoMalin a pour objectif de permettre à un foyer de :

- suivre les aliments présents dans son réfrigérateur et ses placards ;
- repérer les produits à utiliser en priorité selon leur DLC ou leur DDM ;
- rechercher une fiche produit par code-barres avec Open Food Facts, avec
  possibilité de compléter les informations manuellement ;
- découvrir des suggestions de recettes à partir du stock ;
- déclarer un produit consommé ou congelé avant sa date.

Ces éléments décrivent la cible produit ; ils ne sont pas encore implémentés
dans l'interface actuelle.

## Fonctionnalités disponibles aujourd'hui

- Écran de démarrage Vite + Preact.
- Compteur de démonstration incrémenté par un bouton.

## Données et fonctionnement prévus

La cible est une application statique, sans backend ni compte utilisateur, où
les données du stock sont enregistrées dans le navigateur avec IndexedDB.
L'utilisation quotidienne doit fonctionner hors ligne. La recherche de fiches
Open Food Facts nécessitera une connexion ; la saisie manuelle restera
disponible en cas d'absence de réseau ou de fiche.

Ces comportements sont prévus et ne sont pas encore disponibles. Les données
enregistrées localement ne seront pas synchronisées entre appareils ; effacer
les données du navigateur pourra les rendre indisponibles.

## Technologies

- [Preact](https://preactjs.com/) et TypeScript
- [Vite](https://vite.dev/) pour le développement et la compilation
- Dexie / IndexedDB prévu pour le stockage local
- Vitest et Testing Library pour les tests unitaires
- Playwright pour les tests de parcours

## Prérequis

- Node.js `>=24.12.0` (voir `engines` dans `package.json`)
- npm

## Installation et démarrage

```bash
npm ci
npm run dev
```

Vite affiche l'adresse locale à ouvrir dans le navigateur.

## Commandes

| Commande | Description |
| --- | --- |
| `npm run dev` | Démarre le serveur de développement Vite. |
| `npm run build` | Vérifie les types puis compile l'application. |
| `npm run preview` | Sert localement la compilation de production. |
| `npm test` | Exécute les tests Vitest. |
| `npm run test:e2e` | Exécute les tests de parcours Playwright. |
| `npm run lint` | Exécute ESLint et vérifie le formatage Prettier. |
| `npm run typecheck` | Vérifie les types TypeScript. |

## Documentation

- [Cadrage produit](./PRODUCT.md)
- [Décisions d'architecture](./docs/adr/)

## Statut

Ce dépôt est un prototype en cours de développement. Les fonctionnalités
présentées comme objectifs ne doivent pas être considérées comme livrées.
