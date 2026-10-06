import type { ComponentChildren } from "preact";
import { useEffect, useId, useRef } from "preact/hooks";

/**
 * Boîte de dialogue modale de confirmation : focus initial sur « Annuler »,
 * focus maintenu dans la boîte et fermeture par Échap.
 */
export function ConfirmDialog({
  title,
  confirmLabel,
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
  children,
}: {
  title: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ComponentChildren;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const buttons = Array.from(dialogRef.current.querySelectorAll<HTMLButtonElement>("button"));
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div class="dialog-backdrop">
      <div
        ref={dialogRef}
        class="dialog card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
      >
        <h2 id={titleId} class="dialog-title">
          {title}
        </h2>
        {children}
        <div class="dialog-actions">
          <button ref={cancelRef} type="button" class="btn btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" class="btn btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
