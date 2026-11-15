/**
 * R-WEB-UI-RESOURCE-SOURCE-LEDGER-UI-AND-REST-Q1 (partia 4): HTML bloku „Skąd zapasy” na karcie surowca.
 *
 * Część CZYSTA (bez DOM, bez odczytu stanu gry): dostaje gotowe linie z
 * `ledgerSourceLinesForResource` (resource-ledger.ts) i zwraca markup `<details>`.
 * Dzięki temu test może wołać tę funkcję bezpośrednio w node.
 *
 * Zasady: jedna linia na źródło („+12 Warzelnia (Rzym)”, „−20 Obywatele”), przyrost zielony,
 * ubytek czerwony, etykiety po polsku (bez surowych ID — etykiety nadaje silnik przy zapisie),
 * wszystkie teksty escapowane.
 * / EN: pure HTML builder for the "Skąd zapasy" card block; no DOM and no game state access.
 */
import type { LedgerSourceLine } from '../game/resource-ledger';

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Markup `<details class="civ-emp-res-skad">` z jedną linią na źródło.
 * `open` = domyślnie rozwinięte (sól i ceramika — priorytet właściciela).
 * `turnCount` = liczba tur w oknie (podpis w summary).
 */
export function resourceSourceLedgerDetailsHtml(
  lines: ReadonlyArray<LedgerSourceLine>,
  turnCount: number,
  open: boolean,
): string {
  const rows = lines.map(l => {
    const sign = l.amount > 0 ? '+' : '−';
    const cls = l.gain ? 'gain' : 'loss';
    return `<div class="civ-emp-res-skad-row ${cls}"><span class="k">${escHtml(l.label)}</span>`
      + `<span class="v">${sign}${escHtml(String(Math.abs(l.amount)))}</span></div>`;
  }).join('');
  return `<details class="civ-emp-res-skad"${open ? ' open' : ''}>`
    + `<summary>Skąd zapasy (ostatnie ${escHtml(String(turnCount))} tur)</summary>`
    + `<div class="civ-emp-res-skad-body">${rows}`
    + `<div class="civ-emp-res-skad-note">Suma z okna tur; przyrost i ubytek osobno.</div>`
    + `</div></details>`;
}
