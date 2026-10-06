import { render, screen, within } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import type { StockState } from "../src/data/hooks.ts";
import type { StockItem } from "../src/domain/types.ts";
import { StockScreen } from "../src/screens/StockScreen.tsx";

const today = "2026-10-05";

function item(overrides: Partial<StockItem> = {}): StockItem {
  return {
    id: "item",
    name: "Produit",
    quantity: 1,
    unit: "pièce",
    expiresOn: "2026-10-04",
    dateKind: "DLC",
    location: "réfrigérateur",
    addedOn: "2026-09-28",
    status: "en-stock",
    ...overrides,
  };
}

function afficherStock(items: StockItem[], onDiscardExpired: () => Promise<number>) {
  const stock: StockState = { status: "ready", items };
  return render(
    <StockScreen
      stock={stock}
      today={today}
      onAction={vi.fn()}
      onDiscardExpired={onDiscardExpired}
    />,
  );
}

test("affiche toujours le bouton et le désactive quand aucun produit n'est concerné", () => {
  afficherStock(
    [
      item({ id: "ddm", dateKind: "DDM" }),
      item({ id: "dlc-aujourdhui", expiresOn: today }),
      item({ id: "dlc-future", expiresOn: "2026-10-06" }),
      item({ id: "clos", status: "jeté" }),
    ],
    vi.fn(),
  );

  expect(screen.getByRole("button", { name: "Vider les produits périmés" })).toBeDisabled();
});

test("garde le bouton visible sur un stock vide", () => {
  afficherStock([], vi.fn());

  expect(screen.getByRole("button", { name: "Vider les produits périmés" })).toBeDisabled();
});

test("demande confirmation avec le nombre exact et annule sans lancer l'action", async () => {
  const user = userEvent.setup();
  const onDiscardExpired = vi.fn(async () => 2);
  afficherStock(
    [item({ id: "a" }), item({ id: "b" }), item({ id: "ddm", dateKind: "DDM" })],
    onDiscardExpired,
  );

  await user.click(screen.getByRole("button", { name: "Vider les produits périmés" }));
  const dialog = screen.getByRole("dialog", {
    name: "Marquer ces 2 produits comme jetés ?",
  });
  expect(within(dialog).getByText("Marquer ces 2 produits comme jetés ?")).toBeInTheDocument();
  await user.click(within(dialog).getByRole("button", { name: "Annuler" }));

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Vider les produits périmés" })).toHaveFocus();
  expect(onDiscardExpired).not.toHaveBeenCalled();
});

test("annonce le traitement en cours puis le résultat", async () => {
  const user = userEvent.setup();
  let finish!: (count: number) => void;
  const onDiscardExpired = vi.fn(() => new Promise<number>((resolve) => (finish = resolve)));
  afficherStock([item({ id: "a" }), item({ id: "b" })], onDiscardExpired);

  await user.click(screen.getByRole("button", { name: "Vider les produits périmés" }));
  const dialog = screen.getByRole("dialog", {
    name: "Marquer ces 2 produits comme jetés ?",
  });
  await user.click(within(dialog).getByRole("button", { name: "Marquer comme jetés" }));

  const processing = screen.getByText("Vidage des produits périmés en cours…");
  expect(processing).toBeInTheDocument();
  expect(processing.closest('[role="status"]')).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Vider les produits périmés" })).toBeDisabled();
  finish(2);
  const result = await screen.findByText("2 produits marqués comme jetés.");
  expect(result.closest('[role="status"]')).toBeInTheDocument();
});

test("annonce explicitement une erreur de stockage sans afficher de succès", async () => {
  const user = userEvent.setup();
  const onDiscardExpired = vi.fn(async () => {
    throw new Error("IndexedDB indisponible.");
  });
  afficherStock([item({ id: "a" }), item({ id: "b" })], onDiscardExpired);

  await user.click(screen.getByRole("button", { name: "Vider les produits périmés" }));
  const dialog = screen.getByRole("dialog", {
    name: "Marquer ces 2 produits comme jetés ?",
  });
  await user.click(within(dialog).getByRole("button", { name: "Marquer comme jetés" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Impossible de vider les produits périmés : le stockage local a refusé la modification. Aucun produit n'a été modifié.",
  );
  expect(screen.queryByText(/produits? marqués? comme jetés?/i)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Vider les produits périmés" })).toBeEnabled();
  expect(onDiscardExpired).toHaveBeenCalledTimes(1);
});

test("gère le clavier : focus sur Annuler, Échap ferme et rend le focus au bouton", async () => {
  const user = userEvent.setup();
  const onDiscardExpired = vi.fn(async () => 2);
  afficherStock([item({ id: "a" }), item({ id: "b" })], onDiscardExpired);
  const trigger = screen.getByRole("button", { name: "Vider les produits périmés" });

  trigger.focus();
  await user.keyboard("{Enter}");
  const dialog = screen.getByRole("dialog", { name: "Marquer ces 2 produits comme jetés ?" });
  expect(dialog).toHaveAttribute("aria-modal", "true");
  expect(within(dialog).getByRole("button", { name: "Annuler" })).toHaveFocus();
  await user.tab();
  expect(within(dialog).getByRole("button", { name: "Marquer comme jetés" })).toHaveFocus();
  await user.tab();
  expect(within(dialog).getByRole("button", { name: "Annuler" })).toHaveFocus();
  await user.tab({ shift: true });
  expect(within(dialog).getByRole("button", { name: "Marquer comme jetés" })).toHaveFocus();

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(onDiscardExpired).not.toHaveBeenCalled();
});

test("accorde la confirmation et le résultat au singulier pour un seul produit", async () => {
  const user = userEvent.setup();
  afficherStock(
    [item({ id: "a" })],
    vi.fn(async () => 1),
  );

  await user.click(screen.getByRole("button", { name: "Vider les produits périmés" }));
  const dialog = screen.getByRole("dialog", { name: "Marquer ce produit comme jeté ?" });
  await user.click(within(dialog).getByRole("button", { name: "Marquer comme jeté" }));

  const result = await screen.findByText("1 produit marqué comme jeté.");
  expect(result.closest('[role="status"]')).toBeInTheDocument();
});
