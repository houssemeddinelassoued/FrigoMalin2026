# ADR 0003 — Routage : hash ou repli `404.html` ?

- **Statut :** Proposé
- **Date :** 2026-10-05

## Contexte et problème

FrigoMalin est une application statique servie par GitHub Pages sous `/FrigoMalin2026/`. Le choix du framework proposé est Preact 11 + Vite + TypeScript (`ADR 0002`). Il faut choisir comment représenter les vues de l’application dans l’URL et permettre leur chargement direct ou après rechargement.

Le dépôt consulté ne contient pas encore de configuration Vite ni de stratégie de routage. Le MVP exige que l’application puisse être rechargée et utilisée hors ligne après son premier chargement ; le routage seul ne satisfait pas cette exigence (`docs/mvp.md`).

## Facteurs de décision

- Fonctionnement sous le chemin de publication `/FrigoMalin2026/`.
- Rechargement et ouverture directe d’une vue.
- Compatibilité avec GitHub Pages sans réécriture serveur configurable.
- Simplicité de mise en œuvre et de test pour le POC.
- Comportement cohérent avec le service worker hors ligne.

## Options considérées

| Option | Avantages | Compromis |
|---|---|---|
| **Routage par hash** — par exemple `/FrigoMalin2026/#/stock` | Le fragment après `#` n’est pas envoyé au serveur ; les vues partagent donc le document `/FrigoMalin2026/` et les rechargements n’exigent pas de fichier serveur par route. Ne requiert pas de page de secours dédiée. | Le fragment fait partie de l’URL et les liens sont moins propres. Le routage et la gestion du fragment restent à prendre en charge côté client. |
| **Routage par chemin avec repli `404.html`** — par exemple `/FrigoMalin2026/stock` | URLs lisibles et sans fragment ; chemins adaptés aux vues distinctes. | GitHub Pages sert `404.html` pour un chemin sans fichier correspondant, avec un statut HTTP 404. Le repli doit préserver le chemin demandé et permettre à l’application de se rétablir. Il faut tester les accès directs, les rechargements et le déploiement sous le préfixe du projet. |

Un service worker peut contribuer à servir la coquille de l’application lors des navigations hors ligne, mais il doit être configuré et testé séparément. Aucune des deux stratégies ne garantit à elle seule le fonctionnement hors ligne.

## Décision proposée

Choisir le **routage par hash** pour le POC, et conserver le document de l’application sous `/FrigoMalin2026/`.

Cette option évite de dépendre du mécanisme de repli `404.html` de GitHub Pages et réduit les risques liés aux accès directs sous le chemin de publication du projet. Elle répond au besoin de naviguer entre les vues du POC sans ajouter de complexité de déploiement.

## Conséquences

### Positives

- Les vues peuvent être rechargées sans demander au serveur un fichier correspondant à chaque chemin.
- La publication reste centrée sur la coquille statique sous `/FrigoMalin2026/`.
- Pas de page `404.html` dédiée ni de logique de restauration d’URL après une réponse 404.

### Négatives

- Les URLs comportent un fragment, par exemple `#/stock`.
- Le routage côté client doit interpréter le fragment et réagir à sa modification.
- Le service worker doit toujours être vérifié pour assurer la navigation hors ligne et les chemins de ressources corrects.

## Conditions de réexamen

Réexaminer ce choix si le produit nécessite des URLs sans fragment, si les vues doivent être adressables par des chemins propres, ou si le déploiement évolue vers un hébergement offrant des règles de réécriture adaptées. Dans ce cas, le repli `404.html` devra préserver le chemin `/FrigoMalin2026/` et faire l’objet de tests dédiés.

## Risques et vérifications

| Risque | Probabilité / impact | Signal | Réduction |
|---|---|---|---|
| Échec du chargement de la coquille sous le préfixe du projet | Probabilité incertaine / impact élevé | Ressources introuvables après publication sous `/FrigoMalin2026/` | Vérifier les chemins d’assets et les URLs de navigation dans le build publié. |
| Navigation hors ligne incorrecte, indépendamment du type de route | Probabilité incertaine / impact élevé | Rechargement hors réseau qui affiche une erreur ou une page absente | Tester un premier chargement en ligne, puis navigation et rechargement hors ligne après activation du service worker. |
| Besoin ultérieur d’URLs sans fragment | Probabilité faible pour le POC / impact modéré | Demande de liens directs avec chemins lisibles | Réexaminer la stratégie avec le besoin produit et les capacités de l’hébergement. |