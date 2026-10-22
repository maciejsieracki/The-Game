/**
 * Zamyka panel HUD po kliknięciu poza panelem (mapa, inne UI).
 * Trigger-y (np. .b-wiki) pomijane — obsługują własny toggle.
 */

export function bindHudPanelOutsideDismiss(
  panel: HTMLElement,
  isOpen: () => boolean,
  close: () => void,
  ignoreClosest = '',
  /** Dodatkowe elementy UI (np. banner trybu budowy) — klik w nie nie zamyka panelu. */
  extraPanels: HTMLElement[] = [],
): () => void {
  const onPointer = (ev: PointerEvent): void => {
    if (!isOpen()) return;
    const target = ev.target;
    if (!(target instanceof Node)) return;
    if (panel.contains(target)) return;
    for (const extra of extraPanels) {
      if (extra.contains(target)) return;
    }
    if (ignoreClosest && target instanceof Element && target.closest(ignoreClosest)) return;
    // Przełączenie między medalionami — obsługuje mapToolbar (nie zamykaj przed click).
    if (target instanceof Element && target.closest('.civ-map-toolbar')) return;
    close();
  };
  document.addEventListener('pointerdown', onPointer, true);
  return () => document.removeEventListener('pointerdown', onPointer, true);
}
