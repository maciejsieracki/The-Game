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
