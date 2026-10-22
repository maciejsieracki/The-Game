/**
 * unitCtxDockDiploGate.ts — ukrywanie docku karty jednostki przy otwartym UI dyplomacji
 * (BUG-DYPLO-PANEL-OVERLAP-Q1=A). Bez importów diplo modułów — checker rejestruje hud.ts.
 */

let diploOpenChecker: (() => boolean) | null = null;
const listeners: Array<() => void> = [];

/** Rejestruje sprawdzanie „czy dyplo UI otwarte” (hud.ts: lista + audiencja). */
export function setDiploOpenChecker(fn: () => boolean): void {
  diploOpenChecker = fn;
}

/** Gdy dyplo open → unit side-ctx dock ma być ukryty (AC BUG-DYPLO-PANEL-OVERLAP-Q1). */
export function isDiploObscuringUnitDock(): boolean {
  return diploOpenChecker?.() ?? false;
}

export function onDiploUiVisibilityChange(fn: () => void): void {
  listeners.push(fn);
}

/** Wołane z diploListHud / diplomacyAudience przy show/hide. */
export function notifyDiploUiVisibilityChange(): void {
  for (const fn of listeners) fn();
}
