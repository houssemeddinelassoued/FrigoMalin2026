# ADR 0002 — Choix du framework

- **Statut :** Proposé
- **Date :** 2026-10-05

## Contexte et problème

Le POC est une application statique publiée sur GitHub Pages sous `/FrigoMalin2026/`. Elle doit rester utilisable hors ligne après son premier chargement. La recherche Open Food Facts nécessite une connexion, mais ne doit pas être indispensable à la consultation ou à la gestion du stock. Le cadrage ne prescrit pas de framework (`PRODUCT.md`, `docs/mvp.md`).

## Facteurs de décision

- Développer les écrans et formulaires du POC sans multiplier les dépendances.
- Générer des ressources statiques pour GitHub Pages, en tenant compte du préfixe `/FrigoMalin2026/`.
- Maintenir la compatibilité avec IndexedDB et le fonctionnement hors ligne.
- Bénéficier de vérifications TypeScript sans complexifier inutilement le POC.

## Options considérées

| Option | Atouts | Compromis |
|---|---|---|
| **Preact 11 + Vite + TypeScript** | Interface à composants, chaîne de build pour produire des fichiers statiques et typage statique ; runtime choisi comme alternative légère à React. | Certaines bibliothèques conçues pour React peuvent nécessiter `preact/compat` ou ne pas être directement compatibles. Le bundle réel reste à mesurer. |
| **Vue 3 + Vite** | Modèle déclaratif et composants à fichier unique adaptés aux écrans et formulaires. | Runtime et chaîne de build supplémentaires ; familiarité de l’équipe inconnue. |
| **React + Vite** | Écosystème et ressources étendus. | Runtime supplémentaire et risque d’ajouter des bibliothèques de routage ou d’état avant qu’elles soient nécessaires. |

Les tailles de bundle ne sont pas mesurées dans ce dépôt. Le service worker et la mise en cache hors ligne restent des préoccupations séparées du framework choisi.

## Décision proposée

Utiliser **Preact 11 + Vite + TypeScript**. Garder l’architecture et les dépendances aussi simples que possible ; n’ajouter `preact/compat` ou une bibliothèque complémentaire que si un besoin concret du POC le justifie.

Configurer Vite pour servir les ressources sous `/FrigoMalin2026/`. Le choix du routage et sa gestion de ce préfixe seront précisés dans l’ADR 0003. Le hors-ligne devra être validé sur les fichiers statiques générés ; Open Food Facts restera une dépendance en ligne facultative pour l’ajout manuel.

## Conséquences

### Positives

- Fournit un modèle à composants et le typage TypeScript pour les écrans et les données manipulées par l’interface.
- Produit une application statique adaptée à GitHub Pages, sans backend ni service distant supplémentaire.
- Évite de retenir React comme dépendance par défaut tout en laissant ouverte l’utilisation ciblée de bibliothèques compatibles.

### Négatives

- Il faudra vérifier la compatibilité de toute bibliothèque d’interface ou de routage choisie ultérieurement ; certaines pourront nécessiter `preact/compat`.
- Vite et TypeScript ajoutent une chaîne de build et des dépendances au projet.
- Le poids final n’est pas établi et devra être mesuré sur le build de production.
- TypeScript vérifie les types à la compilation, mais ne valide pas à lui seul les données JSON importées à l’exécution.

## Conditions de réexamen

Réexaminer ce choix si une bibliothèque indispensable au POC est incompatible ou impose un surcoût disproportionné, si l’équipe rencontre des difficultés de maintenance liées à Preact, ou si la mesure du build révèle un coût incompatible avec les objectifs de chargement. La décision finale revient à l’humain.