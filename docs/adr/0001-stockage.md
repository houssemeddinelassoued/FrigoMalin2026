# ADR 0001 — Où stocker les données du foyer ?

- **Statut :** Proposé
- **Date :** 2026-10-05

## Contexte et problème

Le POC est une application statique, utilisable hors ligne après son premier chargement. Le stock doit rester disponible dans le navigateur après rechargement, être triable par date et pouvoir être exporté et réimporté en JSON. Le périmètre impose IndexedDB pour les données métier (`PRODUCT.md`, `docs/mvp.md`).

Il faut donc choisir entre `localStorage`, IndexedDB avec Dexie.js et IndexedDB avec `idb`. Le tri indexé par date suppose, avec IndexedDB, de déclarer un index correspondant au champ de date. La capacité réelle de stockage dépend du navigateur ; les données locales peuvent être effacées, d’où l’importance de l’export JSON.

## Facteurs de décision

- Respect du choix produit d’IndexedDB et simplicité du POC de cinq jours.
- Tri et recherches utiles au stock, notamment par date.
- Taille ajoutée au bundle de l’application hors ligne.
- Facilité de tester les opérations et la persistance réelle.

## Options considérées

Les tailles ci-dessous sont des **ordres de grandeur indicatifs minifiés et gzippés** ; elles varient selon la version, les imports et le bundler. Elles restent à mesurer sur le bundle du projet.

| Option | Limite de stockage | Requêtes et tri par date | Taille ajoutée au bundle | Facilité de test |
|---|---|---|---|---|
| `localStorage` | Environ **5 Mio par origine** dans les navigateurs courants ; limite et comportement à confirmer selon le navigateur. | Aucune requête ni aucun index structurés. Il faut sérialiser les données, puis filtrer et trier en mémoire. | **0** pour une bibliothèque. | Simple à simuler dans des tests unitaires ; les limites de capacité et la persistance nécessitent des tests dans un navigateur réel. |
| IndexedDB via **Dexie.js** | Quota géré par le navigateur, sans plafond universel fixe ; généralement plus adapté que Web Storage à des données structurées. | API de plus haut niveau pour déclarer des index, filtrer et parcourir les résultats dans l’ordre d’un index. Le tri par date requiert l’index correspondant. | Environ **16 Ko**. | Tests d’intégration possibles sur IndexedDB ; une base simulée peut faciliter les tests, mais ne remplace pas un test navigateur de persistance. |
| IndexedDB via **`idb`** | Même quota navigateur qu’IndexedDB via Dexie.js. | Enveloppe légère autour d’IndexedDB ; accès aux index et parcours ordonnés, mais davantage de code applicatif pour composer les requêtes. | Environ **1–2 Ko**. | Même besoin de tests d’intégration ; abstraction plus proche de l’API native, donc davantage de détails de requête à gérer dans le code et les tests. |

Références des bibliothèques : [Dexie.js](https://github.com/dexie/Dexie.js) et [`idb`](https://github.com/jakearchibald/idb). Les tailles sont à confirmer pour les versions retenues.

## Options écartées

- **`localStorage`** : écarté car il contredit le choix IndexedDB établi pour le POC. Sa limite réduite et l’absence d’index obligeraient en outre à charger et trier les données en mémoire.
- **`idb`** : reste compatible, mais sa plus petite taille ne compense pas nécessairement le code de requête supplémentaire pour le périmètre actuel.

## Décision proposée

Utiliser **IndexedDB via Dexie.js**, avec un index explicite sur le champ de date utilisé pour l’ordre de consommation.

Cette option respecte le choix produit, tout en offrant une API plus pratique pour le tri et les requêtes du stock que l’accès plus bas niveau d’`idb`. Le surcoût de bundle est un compromis acceptable pour le POC ; il devra être vérifié sur le build final.

## Conséquences

### Positives

- Respecte l’exigence de stockage local IndexedDB et fonctionne sans dépendre d’une API distante pour consulter ou gérer le stock.
- Permet d’exprimer le tri par date à partir d’un index, plutôt que de charger systématiquement tout le stock pour le trier.
- Réduit le code de plomberie par rapport à une enveloppe plus proche de l’API native.
- L’export et l’import JSON restent une responsabilité applicative distincte du choix de bibliothèque.

### Négatives

- Ajoute une dépendance et un coût de bundle supérieur à `idb`.
- Le quota est décidé par le navigateur et n’offre pas de garantie de conservation : l’utilisateur peut perdre ses données en effaçant le stockage du navigateur.
- Un index de date doit être entretenu dans le schéma, et les migrations IndexedDB nécessitent des tests.

## Conditions de réexamen

Revenir sur ce choix si :

- la mesure du bundle final montre que Dexie dépasse le budget retenu pour la PWA ;
- les requêtes restent assez simples pour que le surcoût de code d’`idb` soit préférable à celui de Dexie ;
- les besoins de requêtes ou de schéma évoluent au-delà de ce que le POC justifie ;
- les tests révèlent des difficultés de migration, de compatibilité ou de maintenance avec Dexie.

## Risques à valider

| Risque | Probabilité / impact | Signal | Réduction |
|---|---|---|---|
| Données effacées par l’utilisateur ou le navigateur | Probabilité incertaine / impact élevé | Stock absent après nettoyage du navigateur ou éviction | Rendre l’export JSON accessible et expliquer que les données ne sont pas sauvegardées côté serveur. |
| Taille réelle de Dexie supérieure à l’estimation | Probabilité incertaine / impact faible à modéré | Analyse du bundle final au-dessus du budget | Mesurer le build de production avant de figer la dépendance. |
| Tri incorrect si l’index ou le format de date ne correspond pas aux données | Probabilité modérée / impact modéré | Ordre erroné avec des dates de test déterministes | Définir le format de date et couvrir les requêtes ordonnées par des tests. |

**Prochaine vérification suggérée :** comparer la taille minifiée et gzippée des versions effectivement retenues dans le build, puis valider le tri indexé par date et la persistance dans un navigateur après rechargement hors ligne.

## Implémentation du POC

- [Modèle métier](../../src/domain/types.ts) : unités, emplacements, DLC/DDM et statuts en unions littérales ; dates calendaires locales ISO `YYYY-MM-DD`, sans heure. Le type de date impose la notation, pas la validité calendaire d'une saisie externe ; celle-ci devra être validée lors de l'ajout ou de l'import.
- [Base Dexie](../../src/data/db.ts) : base `frigomalin`, version 1, table `stockItems`, clé primaire `id` fournie par l'application, index non uniques `expiresOn`, `status` et `barcode` (facultatif). Aucun remplissage automatique.
- [Données de démonstration](../../src/data/seed.ts) : `generateSeedItems(today = new Date())` retourne 40 produits avec des identifiants UUID nouveaux à chaque appel. Les dates sont calculées en jours calendaires locaux, sans conversion UTC : 3 DLC dépassées, 3 DLC aujourd'hui, 2 DDM dépassées et 32 produits entre J+1 et J+30. Une date de référence invalide est rejetée explicitement.
- Le générateur n'écrit pas en base. Pour insérer volontairement le jeu de démonstration, appeler `await db.stockItems.bulkAdd(generateSeedItems())` ; chaque appel ajoute un nouveau jeu.
- `ImpactEntry` définit uniquement une structure d'estimation (kg, euros), pas une mesure vérifiée ni une fonctionnalité de calcul ; le hors-périmètre produit reste inchangé.
- Vérifications : `npm install`, `npm run typecheck` et `npm test` avec Node.js 24.12 ou ultérieur. Les tests utilisent IndexedDB simulé pour le schéma, les recherches indexées et la conservation après réouverture ; la persistance réelle hors ligne et le budget de bundle restent à vérifier dans un navigateur.