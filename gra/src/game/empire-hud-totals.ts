/**
 * empire-hud-totals.ts — R-HUD-MIASTO-STAN-CYWILIZACJI (2026-08-08, playtest Macieja).
 *
 * Pure, zero-dependency helper for the city-panel HUD chips (Praca/Żywność/
 * Skarbiec/Nauka/Kultura/Religia): given an already-computed empire-wide rate
 * snapshot (the SAME source of truth the rest of the app uses — see
 * `resolveEmpireSnap()` / `cfg.getEmpireHud` in `ui/cityPanel.ts`, backed by
 * `buildHudState()` in `main.ts`) and the current city's own per-stat value,
 * returns the six "civ total" numbers to show as the big chip value.
 *
 * Deliberately does NOT recompute anything itself (no `computeView` loop) —
 * it only decides which number to show, with a same-value fallback (`?? cityOwn.x`)
 * when the empire snapshot doesn't have that field, matching the degrade
 * convention already used elsewhere in `cityPanel.ts` (`empire.kulturaRate ??
 * view.kultura`). This keeps the file dependency-free so it can be unit
 * tested in isolation (`tools/hud-miasto-stan-cywilizacji-test.cjs`) without
 * bundling the DOM-heavy `ui/cityPanel.ts` module.
 */

/** Subset of `EmpireHudSnap` (ui/cityPanel.ts) actually needed here — kept
 *  structural on purpose so any object shaped like `EmpireHudSnap` fits. */
export interface EmpireRateSnapshotForChips {
  pracaRate?: number;
  zywnoscRate?: number;
  zlotoRate?: number;
  naukaRate?: number;
  kulturaRate?: number;
  religionRate?: number;
}

export interface CitySixStatValues {
  praca: number;
  zywnosc: number;
  zloto: number;
  nauka: number;
  kultura: number;
  religia: number;
}

/**
 * Duża liczba w chipie = suma cywilizacji z `empire` (jeśli dostępna), w
 * przeciwnym razie wartość TEGO miasta (`cityOwn`) — żeby przy braku danych
 * nigdy nie pokazać mylącego „0" zamiast realnej (choćby lokalnej) liczby.
 */
export function civWideSixStatsFromEmpireSnap(
  empire: EmpireRateSnapshotForChips,
  cityOwn: CitySixStatValues,
): CitySixStatValues {
  return {
    praca: empire.pracaRate ?? cityOwn.praca,
    zywnosc: empire.zywnoscRate ?? cityOwn.zywnosc,
    zloto: empire.zlotoRate ?? cityOwn.zloto,
    nauka: empire.naukaRate ?? cityOwn.nauka,
    kultura: empire.kulturaRate ?? cityOwn.kultura,
    religia: Math.round(empire.religionRate ?? cityOwn.religia),
  };
}

/** Podzbiór `EmpireHudSnap` z ZAPASAMI (nie tempem) — te same pola, które główny
 *  HUD mapy pokazuje jako dużą liczbę (skarbiec / magazyn / nauka nagromadzona).
 *  / EN: stock (not rate) subset of `EmpireHudSnap`, mirroring the world-map HUD. */
export interface EmpireStockSnapshotForChips {
  pracaPool?: number;
  zywnoscReserve?: number;
  zloto?: number;
  nauka?: number;
  kultura?: number;
  religionStock?: number;
}

/** Formatowanie małej liczby (tempo cywilizacji) — kopia konwencji `fmtResDelta`
 *  z `ui/cityPanel.ts`, powtórzona tutaj, żeby plik został DOM-free i testowalny.
 *  / EN: local copy of cityPanel's `fmtResDelta` to keep this module DOM-free. */
function fmtChipRate(n: number): { html: string; cls: string } {
  if (n === 0) return { html: '', cls: '' };
  const cls = n > 0 ? 'green' : 'red';
  const html = n > 0 ? `+${n}` : String(n);
  return { html, cls };
}

/**
 * R-HUD-MIASTO-STOCK-TEMPO-TRZY-ELEMENTY (2026-08-09, playtest Macieja):
 * dwa OSTATNIE z trzech elementów chipu karty miasta, jako gotowy HTML:
 *   • mała liczba `+N` = tempo CAŁEJ cywilizacji (`civRate`, suma wszystkich miast);
 *   • trzeci element `(N)` w kolorze złotym = realny ZAPAS całej cywilizacji
 *     (`civStock`, ta sama wielkość co duża liczba na głównym HUD mapy).
 * Duża liczba (tempo TEGO miasta) jest renderowana przez wywołującego.
 * / EN: renders the 2nd (civ-wide rate) and 3rd (gold civ-wide stock) chip elements.
 */
export function buildChipDeltaStockHtml(civRate?: number, civStock?: number): string {
  const d = civRate !== undefined ? fmtChipRate(Math.round(civRate)) : { html: '', cls: '' };
  const deltaHtml = d.html
    ? `<span class="civ-v-w3-chip-delta ${d.cls}">${d.html}</span>`
    : '';
  const stockHtml = civStock !== undefined
    ? `<span class="civ-v-w3-chip-stock">(${Math.round(civStock)})</span>`
    : '';
  return deltaHtml + stockHtml;
}
