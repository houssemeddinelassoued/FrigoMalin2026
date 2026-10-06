import "fake-indexeddb/auto";
import { render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { lookupBarcode, type LookupResult } from "../src/data/openFoodFacts.ts";
import { AddProductScreen } from "../src/screens/AddProductScreen.tsx";

vi.mock("../src/data/openFoodFacts.ts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/data/openFoodFacts.ts")>()),
  lookupBarcode: vi.fn(),
}));

const lookup = vi.mocked(lookupBarcode);

beforeEach(() => {
  lookup.mockReset();
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
});

async function verifyBarcode(result: LookupResult) {
  lookup.mockResolvedValue(result);
  const user = userEvent.setup();
  render(<AddProductScreen today="2026-10-05" onSaved={vi.fn()} />);
  await user.type(screen.getByLabelText(/Saisie manuelle du code-barres/), "3017620422003");
  await user.click(screen.getByRole("button", { name: "Vérifier" }));
}

test("préremplit le nom sans la marque, la quantité et l'unité d'un produit trouvé", async () => {
  await verifyBarcode({
    status: "found",
    name: "Nutella",
    brand: "Ferrero",
    packageQuantity: { quantity: 400, unit: "g" },
  });
  expect(
    await screen.findByText(/Produit identifié : nom et quantité préremplis/),
  ).toBeInTheDocument();
  expect(screen.getByLabelText(/Nom de l'aliment/)).toHaveValue("Nutella");
  expect(screen.getByLabelText(/Quantité/)).toHaveValue("400");
  expect(screen.getByLabelText(/Unité/)).toHaveValue("g");
});

test("garde la quantité par défaut quand Open Food Facts n'en fournit pas", async () => {
  await verifyBarcode({ status: "found", name: "Pain de mie" });
  expect(await screen.findByText(/Produit identifié : nom prérempli/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Quantité/)).toHaveValue("1");
  expect(screen.getByLabelText(/Unité/)).toHaveValue("pièce");
});

test.each<[LookupResult["status"], string]>([
  ["not-found", "Produit introuvable dans Open Food Facts : saisissez-le manuellement."],
  ["offline", "Hors ligne : recherche impossible, la saisie manuelle reste complète."],
  ["timeout", "Open Food Facts ne répond pas assez vite : continuez la saisie manuelle."],
  ["error", "Recherche indisponible pour le moment : continuez la saisie manuelle."],
])("affiche un message adapté au statut %s et laisse le nom vide", async (status, message) => {
  await verifyBarcode({ status } as LookupResult);
  expect(await screen.findByText(message)).toBeInTheDocument();
  expect(screen.getByLabelText(/Nom de l'aliment/)).toHaveValue("");
});
