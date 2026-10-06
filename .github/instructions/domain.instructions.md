---
applyTo: "src/domain/**/*.ts"
---

# Domaine métier FrigoMalin

- Garder `src/domain/` en TypeScript strict et pur : aucun import React/Preact, Dexie, DOM, stockage, accès réseau ou autre effet de bord.
- Représenter les concepts métier avec des types explicites et des unions littérales ; ne pas introduire `any` ni remplacer un type connu par `string`.
- Les dates métier sont des jours calendaires ISO `AAAA-MM-JJ`, sans heure. Toute comparaison ou opération de dates passe par `src/domain/dates.ts` ; ne pas les analyser ou comparer directement avec `Date`, `Date.parse` ou l'ordre lexicographique.
- Respecter le glossaire de `PRODUCT.md` : une DLC dépassée signifie que le produit doit être jeté ; une DDM dépassée ne signifie pas à elle seule que le produit est impropre à la consommation.
- Un aliment n'est compté comme sauvé que sur déclaration de l'utilisateur après consommation ou congélation avant sa date. Ne pas présenter les quantités ou économies déclarées comme des mesures vérifiées.
- Ne pas intégrer dans les règles métier les fonctions explicitement exclues du POC dans `PRODUCT.md`, notamment les comptes, la synchronisation, les rappels système et les recommandations personnalisées.
- Pour toute règle ajoutée ou modifiée, écrire d'abord des tests Vitest dans `tests/`, avec dates fixes, cas limites et résultats attendus indépendamment de l'implémentation.
- Signaler explicitement les entrées invalides conformément aux conventions du projet ; ne pas retourner une valeur par défaut qui ferait passer silencieusement une erreur pour un résultat valide.
