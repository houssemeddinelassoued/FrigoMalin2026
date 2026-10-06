/** Date calendaire locale ISO 8601 au format YYYY-MM-DD, sans heure. */
export type ISODate = `${number}-${number}-${number}`;

export type Unit = "pièce" | "g" | "kg" | "ml" | "l";
export type DateKind = "DLC" | "DDM";
export type Location = "réfrigérateur" | "congélateur" | "placard";
export type StockStatus = "en-stock" | "consommé" | "congelé" | "jeté";

export interface StockItem {
  id: string;
  name: string;
  barcode?: string;
  quantity: number;
  unit: Unit;
  expiresOn: ISODate;
  dateKind: DateKind;
  location: Location;
  addedOn: ISODate;
  status: StockStatus;
  /** Jour où l'aliment a quitté le stock actif (consommé, congelé ou jeté). */
  closedOn?: ISODate;
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: Unit;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: Ingredient[];
  minutes: number;
}

export interface ImpactEntry {
  itemId: StockItem["id"];
  kg: number;
  euros: number;
  date: ISODate;
}
