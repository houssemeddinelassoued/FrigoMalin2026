---
applyTo: "src/ui/*.tsx"
---

# Interface utilisateur FrigoMalin

- Suivre la stack produit Vite, TypeScript strict et React, ainsi que les commandes et règles communes de `.github/copilot-instructions.md`.
- Le squelette actuel importe Preact dans `src/app.tsx` alors que la stack produit spécifie React. Ne mélange pas les API React et Preact et ne modifie pas les dépendances ou la configuration du framework sans demande explicite ; signale cette divergence lorsqu'elle affecte le travail.
- Garder l'interface en français et concevoir d'abord pour un écran mobile de 360 px ; assurer l'accessibilité WCAG AA, notamment la navigation clavier, les libellés explicites, le contraste et les états de focus.
- Faire fonctionner chaque parcours essentiel sans réseau après le chargement de l'application. Ne pas ajouter d'appel réseau dans l'interface ; toute recherche Open Food Facts passe par la couche `src/data/` et prévoit un repli manuel.
- Garder les composants d'interface dans `src/ui/`, dans un dossier par composant, et déléguer les règles métier à `src/domain/` et la persistance à `src/data/`.
- Représenter explicitement les états de chargement, vide, erreur et hors ligne quand ils s'appliquent. Ne pas masquer une erreur derrière un état de succès ou un contenu factice.
- Utiliser des éléments HTML sémantiques et les API accessibles du framework configuré. Éviter `any`, les accès directs au stockage persistant depuis les composants et la logique métier dans le JSX.
- Pour chaque parcours d'interface ajouté ou modifié, couvrir le comportement avec Testing Library ; ajouter un test Playwright pour tout parcours clé.
- Respecter le budget JavaScript initial de moins de 200 Ko gzip et viser un score Lighthouse d'au moins 90 ; éviter d'ajouter une dépendance sans l'expliquer.
