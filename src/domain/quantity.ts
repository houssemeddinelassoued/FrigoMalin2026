import type { Unit } from "./types.ts";

export interface PackageQuantity {
  quantity: number;
  unit: Exclude<Unit, "pièce">;
}

const PATTERN = /^(?:(\d+)\s*[x×]\s*)?(\d+(?:[.,]\d+)?)\s*(kg|g|cl|ml|l)\s*(?:℮|e)?$/i;

const CONVERSIONS: Record<string, { factor: number; unit: PackageQuantity["unit"] }> = {
  g: { factor: 1, unit: "g" },
  kg: { factor: 1, unit: "kg" },
  ml: { factor: 1, unit: "ml" },
  cl: { factor: 10, unit: "ml" },
  l: { factor: 1, unit: "l" },
};

/**
 * Convertit la contenance libre d'Open Food Facts (« 400 g ℮ », « 6 x 125 g », « 50 cl »)
 * en quantité exploitable. Renvoie `undefined` quand le texte n'est pas reconnu :
 * c'est un signal explicite « ne rien préremplir », l'utilisateur saisit alors à la main.
 */
export function parsePackageQuantity(text: string): PackageQuantity | undefined {
  const match = PATTERN.exec(text.trim());
  if (!match) return undefined;
  const [, multiplier, amount, rawUnit] = match;
  if (amount === undefined || rawUnit === undefined) return undefined;
  const conversion = CONVERSIONS[rawUnit.toLowerCase()];
  if (!conversion) return undefined;
  const value = Number(amount.replace(",", ".")) * Number(multiplier ?? 1) * conversion.factor;
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return { quantity: Math.round(value * 1000) / 1000, unit: conversion.unit };
}
