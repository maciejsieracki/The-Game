/**
 * power-labels.ts — nazewnictwo Moc / Power (Maciej P-C3, 2026-06-26).
 *
 * Stary „Wpływ” 0–100 (normalizacja vs mapa) — WYCOFANY.
 * Nowa metryka obiektywna (P-A): PL „Moc”, EN „Power” (identyfikatory kodu: power/objectivePower).
 */

/** Etykieta HUD i overlay — język polski (v1.0 UI). */
export const MOC_LABEL_PL = 'Moc';

/** Etykieta angielska (docs, i18n przyszłość). */
export const MOC_LABEL_EN = 'Power';

import powerParams from '../../data/power-params.json';
import { loadPowerOpcje } from '../game/power-options';

/** Etykieta HUD — z power-params.json (Panel-B Potega-opcje) lub domyślnie „Moc”. */
export function mocLabel(): string {
  return loadPowerOpcje().hudEtykietaPl || MOC_LABEL_PL;
}

/**
 * Tytuł overlay: „Moc 3020” (czysty tekst — ikonę Mocy dokleja wywołujący jako
 * osobny SVG w HTML, patrz powerOverlayHud.ts; ta funkcja jest PURE i jej wynik
 * bywa wstawiany przez `esc()`, więc nie może zwracać znaczników HTML).
 * / EN: overlay title as plain text — the caller renders the SVG icon
 * separately because this function's output gets HTML-escaped at its call site.
 */
export function mocTitle(value: number): string {
  return `${mocLabel()} ${value}`;
}

/** „Moc 3020” w tekście bieżącym. */
export function mocWithValue(value: number): string {
  return `${mocLabel()} ${value}`;
}
