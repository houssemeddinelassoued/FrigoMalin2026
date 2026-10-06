# FrigoMalin — instructions pour Copilot
Produit : voir PRODUCT.md. Décisions : docs/adr/. Backlog : GitHub Issues (critères Gherkin).

## Stack
Vite + TypeScript strict + Preact · Dexie (IndexedDB) · Vitest + Testing Library · Playwright.
Application 100 % statique publiée sur GitHub Pages sous /FrigoMalin/.

## Commandes
npm run dev · npm test · npm run lint · npm run build · npm run test:e2e

## Structure
src/domain/  logique métier pure (aucun import React ni Dexie)
src/data/    accès IndexedDB (Dexie) et données de départ
src/ui/      composants (un dossier par composant)
e2e/         Playwright

## Principes non négociables
1. Zéro backend, zéro secret : tout s'exécute dans le navigateur (IndexedDB).
2. Hors ligne d'abord : chaque fonctionnalité essentielle marche sans réseau.
3. Tests d'abord : toute règle métier a son test Vitest ; chaque parcours clé, son test Playwright.
4. Accessibilité AA, mobile d'abord (360 px).
5. Budget : JavaScript initial < 200 Ko gzip ; Lighthouse ≥ 90.

Si une demande contredit un de ces principes, ne pas l'implémenter : expliquer le conflit et proposer une alternative conforme.

## Règles du projet
- Dates au format ISO AAAA-MM-JJ ; comparer uniquement via src/domain/dates.ts.
- DLC dépassée = à jeter ; DDM dépassée = encore consommable (voir le glossaire dans PRODUCT.md, section « Glossaire »).
- Aucun appel réseau sauf Open Food Facts (src/data/openFoodFacts.ts), toujours avec repli hors ligne.
- Textes d'interface en français.
- Identifiants de code, noms de fichiers et commits en anglais ; commentaires et noms de tests en français.

## Interdits
- Pas de backend, pas de secret, pas de clé d'API dans le code.
- Ne jamais lire .env* ni exports/.
- Pas de nouvelle dépendance sans le signaler dans la réponse

## Journalisation systématique des demandes

- À la fin de chaque demande utilisateur, avant la réponse finale, ajouter une ligne dans `docs/usage-log.md`, sans attendre une demande de journalisation. Cela inclut les questions, analyses et changements de documentation, pas seulement les modifications de code.
- Lire le journal avant de le modifier, conserver son en-tête et toutes les lignes existantes, puis ajouter la nouvelle entrée à la fin. Ne pas remplacer l'historique.
- Une entrée correspond à une demande utilisateur, pas à un appel d'outil ni à un message de progression. Si une entrée a déjà été créée pour la demande en cours, la mettre à jour plutôt que la dupliquer.
- Renseigner les colonnes : `Date`, `Agent`, `Modèle`, `Tours`, `Crédits`, `Contexte (Tokens)`, `Résultat (OK / à reprendre)` et `Remarque`.
- Utiliser une date et une heure ISO 8601 avec fuseau horaire lorsqu'elles sont disponibles. `Tours` désigne le nombre de demandes utilisateur couvertes par la ligne ; écrire `1` pour une entrée par demande.
- Indiquer le nom réel de l'agent et le modèle uniquement s'ils sont connus. Écrire `non communiqué` pour un modèle indisponible et `non mesuré` pour les crédits ou tokens non exposés par l'outil. Ne jamais inventer ces valeurs ni les déduire du nombre d'appels d'outils.
- Écrire `OK` lorsque la demande est traitée ; écrire `à reprendre` si elle reste bloquée, incomplète ou en attente d'une décision. Pour une modification de code, ne déclarer `OK` qu'après les vérifications adaptées, ou indiquer explicitement dans la remarque celles qui n'ont pas pu être exécutées.
- Résumer la tâche dans une remarque courte, sans recopier le prompt, le code, des secrets ou des données personnelles. Remplacer les retours à la ligne par des espaces et échapper les caractères `|` pour préserver le tableau Markdown.
- Si l'écriture du journal échoue, le signaler dans la réponse finale ; ne pas annoncer que l'entrée a été enregistrée.
- Cette règle automatise le geste de journalisation par l'assistant lorsqu'il peut modifier les fichiers. Elle ne constitue ni un hook de l'outil ni une mesure automatique de la consommation.