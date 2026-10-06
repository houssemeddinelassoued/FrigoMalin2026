import type {
  DateKind,
  ImpactEntry,
  ISODate,
  Location,
  Recipe,
  StockItem,
  StockStatus,
  Unit,
} from "../src/domain/types.ts";

// @ts-expect-error Les unités sont une union fermée.
const invalidUnit: Unit = "litres";
// @ts-expect-error Les emplacements sont une union fermée.
const invalidLocation: Location = "garage";
// @ts-expect-error Le statut ne doit pas accepter une chaîne arbitraire.
const invalidStatus: StockStatus = "disponible";
// @ts-expect-error La distinction DLC/DDM est obligatoire.
const invalidKind: DateKind = "expiration";
// @ts-expect-error Une date doit utiliser la notation ISO.
const invalidDate: ISODate = "05/10/2026";

const item: StockItem = {
  id: "test-stock",
  name: "Lait",
  quantity: 1,
  unit: "l",
  expiresOn: "2026-10-05",
  dateKind: "DLC",
  location: "réfrigérateur",
  addedOn: "2026-10-01",
  status: "en-stock",
};

const recipe: Recipe = {
  id: "test-recipe",
  title: "Riz au lait",
  ingredients: [{ name: item.name, quantity: 500, unit: "ml" }],
  minutes: 30,
};

const impact: ImpactEntry = {
  itemId: item.id,
  kg: 1,
  euros: 1.5,
  date: "2026-10-05",
};

void [invalidUnit, invalidLocation, invalidStatus, invalidKind, invalidDate, recipe, impact];
