---
applyTo: "tests/**/*.{ts,tsx}"
---

# Tests FrigoMalin

- Utiliser Vitest pour les tests unitaires et d'intégration, Testing Library pour les interactions d'interface, et Playwright pour les parcours de bout en bout dans `tests/e2e/`.
- Écrire ou modifier le test avant le code qu'il spécifie. Vérifier qu'un nouveau test échoue pour la raison attendue avant de corriger l'implémentation.
- Tester le comportement observable et les contrats publics, pas les détails internes, le texte source ou la présence d'un mock.
- Tester chaque règle métier dans `src/domain/` avec des cas nominaux et des limites. Contrôler séparément DLC et DDM, y compris la date du jour.
- Utiliser des dates de référence et des données déterministes ; ne pas rendre les tests dépendants de l'heure du système, du fuseau horaire ou de l'ordre d'exécution.
- Isoler IndexedDB dans les tests qui en ont besoin avec `fake-indexeddb` et nettoyer la base après chaque scénario concerné.
- Ne pas appeler le réseau dans les tests ordinaires. Simuler explicitement la réponse et l'indisponibilité d'Open Food Facts lorsque son intégration est testée.
- Pour les interfaces, privilégier les rôles, noms accessibles et interactions réelles avec Testing Library ; éviter les sélecteurs d'implémentation et les snapshots fragiles.
- Chaque parcours clé doit avoir un test Playwright dans `tests/e2e/`. Vérifier au minimum les états pertinents hors ligne et les messages d'erreur utilisateur.
- Écrire les noms de tests en français. Lancer le test ciblé, puis `npm test` après les changements qui peuvent affecter plusieurs scénarios.
