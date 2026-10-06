# FrigoMalin — cadrage produit du POC

## Problème

Les foyers perdent la trace des aliments présents dans le réfrigérateur et les placards.
Ils ne repèrent pas toujours les produits à consommer en priorité, qu’ils soient soumis à une DLC ou à une DDM.
Ils disposent de peu d’éléments pour identifier les aliments qu’ils ont effectivement consommés ou congelés à temps.

## Personas

| Persona | Objectif | Frustration | Moment d’usage |
|---|---|---|---|
| Parent d’un foyer avec enfants | Voir ce qui est disponible et utiliser les produits avant leur date. | Le contenu du réfrigérateur est réparti entre plusieurs espaces et chacun ne sait pas toujours ce qu’il reste. | En rangeant les courses, puis au moment de préparer un repas. |
| Adulte qui organise les repas du foyer | Choisir quoi cuisiner en fonction des produits à consommer en priorité. | Les dates sont difficiles à suivre et les idées de repas ne tiennent pas compte du stock. | Lors de la planification ou juste avant de cuisiner. |
| Membre du foyer qui participe ponctuellement aux courses ou à la cuisine | Ajouter ou mettre à jour les produits sans devoir reconstituer tout le stock de mémoire. | La saisie manuelle est fastidieuse et les informations sont parfois inconnues. | En rangeant un produit, en scannant son code-barres ou en signalant qu’il a été consommé ou congelé. |

## Proposition de valeur

FrigoMalin permet à un foyer de suivre localement ses aliments, de repérer ceux à utiliser en priorité et d’enregistrer ceux consommés ou congelés avant leur date.

### Parcours clés

1. **Ajouter un produit** — Saisir ses informations manuellement ou scanner son code-barres pour rechercher une fiche dans Open Food Facts ; compléter ou corriger les informations si nécessaire.
2. **Décider quoi utiliser** — Consulter le stock et les dates, repérer les produits à utiliser en priorité et obtenir des suggestions de recettes simples à partir du stock.
3. **Mettre à jour le stock et mesurer** — Déclarer un produit consommé ou congelé avant sa date ; consulter le nombre d’aliments ainsi déclarés comme sauvés.

## Hors périmètre du POC

- Comptes, serveur applicatif, synchronisation entre appareils ou partage de stock entre plusieurs navigateurs.
- Notifications système ou rappels lorsque l’application est fermée ; les alertes sont consultables dans l’application lorsqu’elle est ouverte.
- Mesure vérifiée du gaspillage évité, de quantités ou d’économies en euros : le compteur repose sur les déclarations de l’utilisateur.
- Reconnaissance automatique des aliments, des dates ou des quantités à partir de photos.
- Recettes personnalisées selon les régimes, allergies, objectifs nutritionnels ou préférences ; les suggestions restent simples et liées au stock.
- Garantie de disponibilité d’Open Food Facts : si une fiche est absente ou que le service est inaccessible, l’ajout manuel reste possible. La recherche de fiche nécessite une connexion Internet.

Les données de stock sont enregistrées dans le navigateur de l’utilisateur. Elles ne sont pas synchronisées ni sauvegardées par un serveur ; l’effacement des données du navigateur peut les rendre indisponibles.

## Glossaire

- **DLC — Date limite de consommation** : date indiquée pour les denrées très périssables, généralement précédée de « À consommer jusqu’au ». Le produit ne doit pas être consommé après cette date.
- **DDM — Date de durabilité minimale** : date précédée de « À consommer de préférence avant ». Une fois cette date passée, le produit peut avoir perdu certaines qualités ; cela ne signifie pas à lui seul qu’il est impropre à la consommation.
- **Recette** : proposition de préparation composée d’ingrédients et d’instructions. Dans le POC, les recettes suggérées sont simples et sélectionnées en fonction des aliments du stock.
- **Aliment sauvé** : produit que l’utilisateur déclare avoir consommé ou congelé avant sa date. Le compteur reflète ces déclarations, pas une mesure indépendante du gaspillage.
