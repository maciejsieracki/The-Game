// R-WEB-CULT-REL-IMPL-Q1 (CULTIMPL) — ustawienie nowej gry „Kultura i religia”.
// R-WEB-CULT-REL-AI-PLUS10-Q1 (2026-11-27) — OSOBNY poziom dla gracza i dla AI.
//
// Granice na linię (epoka 1), jak dotąd:
//   • Mały wpływ (łatwy):   D = −10, G = +10
//   • Neutralny (normalny): D = −15, G = +5
//   • Duży wpływ (trudny):  D = −20, G = 0
//
// GRACZ (człowiek, także hotseat): BEZ ZMIAN względem dzisiejszej wersji:
//   wartość = (D + (G − D) · udział_własnej) · skala_epoki, skala_epoki = x_epoki / x_epoki1
//   (10/16/23 → ×1,0 / ×1,6 / ×2,3).
//
// AI (cywilizacja komputera), decyzja właściciela 2026-11-27 („plus dziesięć zawsze stałe
// miało być tylko dla AI”, „plus dziesięć rośnie w każdej epoce”, „minusy też rosną
// addytywnie”): Δ = x_epoki − x_epoki1 (0 / +6 / +13 punktów), i:
//   D_AI(e) = D − Δ        (łatwy −10/−16/−23, normalny −15/−21/−28, trudny −20/−26/−33)
//   G_AI(e) = G_AI + Δ     (+10/+16/+23 na każdym poziomie)
//   wartość = D_AI(e) + (G_AI(e) − D_AI(e)) · udział_własnej
//
// Stan poziomu: `null` = brak pola (stary zapis / tryb zgodności) — wtedy Szczęście liczy się
// dokładnie jak dziś i linii Prawa NIE ma. Poziom AI: brak pola = taki sam jak poziom gracza.
// Moduł jest CZYSTY (bez importów z gry).

export type CulturaReligiaLevel = 'latwy' | 'normalny' | 'trudny';

export const CULTURA_RELIGIA_LEVELS: readonly CulturaReligiaLevel[] = ['latwy', 'normalny', 'trudny'];

/** Granice linii na poziom (epoka 1). Nadpisywalne z `society-params.json → kultura_religia_poziomy`. */
export interface CulturaReligiaBounds {
  /** Wartość przy 0% własnej (dolna granica, ≤ 0) — wspólna dla gracza i AI (epoka 1). */
  D: number;
  /** Wartość przy 100% własnej — GRACZ (człowiek, także hotseat), epoka 1. */
  G: number;
  /** Wartość przy 100% własnej — CYWILIZACJA AI, epoka 1 (+10 na każdym poziomie). */
  GAi: number;
}

/** Plus AI (epoka 1) — stały na każdym poziomie „Kultura i religia”. */
export const CULTURA_RELIGIA_AI_G_DEFAULT = 10;

/** x_epoki1 w punktach linii (10) — baza, od której liczy się Δ epok dla AI. */
export const CULTURA_RELIGIA_BASE_POINTS = 10;

export const CULTURA_RELIGIA_BOUNDS_DEFAULT: Readonly<Record<CulturaReligiaLevel, CulturaReligiaBounds>> = Object.freeze({
  latwy: { D: -10, G: 10, GAi: CULTURA_RELIGIA_AI_G_DEFAULT },
  normalny: { D: -15, G: 5, GAi: CULTURA_RELIGIA_AI_G_DEFAULT },
  trudny: { D: -20, G: 0, GAi: CULTURA_RELIGIA_AI_G_DEFAULT },
});

/**
 * Granice D/G dla danego typu właściciela miasta (gracz: G; AI: GAi). D zawsze wspólne.
 * Formuła wartości: `cultureReligionLineValue`.
 */
export function culturaReligiaBoundsForOwner(
  bounds: CulturaReligiaBounds,
  ownerIsHuman: boolean,
): { D: number; G: number } {
  return { D: bounds.D, G: ownerIsHuman ? bounds.G : bounds.GAi };
}

/** Normalizacja pola z kreatora/zapisu. Brak / zła wartość = `null` (tryb zgodności). */
export function normalizeCulturaReligiaLevel(raw: unknown): CulturaReligiaLevel | null {
  return raw === 'latwy' || raw === 'normalny' || raw === 'trudny' ? raw : null;
}

let activeLevel: CulturaReligiaLevel | null = null;
let activeLevelAi: CulturaReligiaLevel | null = null;

/**
 * Ustawiane przy starcie nowej gry / wczytaniu zapisu (main.ts). `undefined` = zgodność.
 * `rawAi` = poziom AI; brak / zła wartość = taki sam jak poziom gracza (stare zapisy).
 * Poziom gracza `null` (zgodność) → poziom AI też `null`.
 */
export function setCulturaReligiaLevel(raw: unknown, rawAi?: unknown): void {
  activeLevel = normalizeCulturaReligiaLevel(raw);
  activeLevelAi = activeLevel === null ? null : (normalizeCulturaReligiaLevel(rawAi) ?? activeLevel);
}

/** Poziom GRACZA (człowieka). */
export function getCulturaReligiaLevel(): CulturaReligiaLevel | null {
  return activeLevel;
}

/** Poziom CYWILIZACJI AI. */
export function getCulturaReligiaLevelAi(): CulturaReligiaLevel | null {
  return activeLevelAi;
}

/** Poziom właściwy dla typu właściciela (gracz / AI). */
export function getCulturaReligiaLevelForOwner(ownerIsHuman: boolean): CulturaReligiaLevel | null {
  return ownerIsHuman ? activeLevel : activeLevelAi;
}

/**
 * Wartość jednej linii (Kultura albo Religia) dla poziomu, epoki i udziału własnej [0,1].
 * `scaleEra` = x_epoki / x_epoki1 (np. 1,0 / 1,6 / 2,3). Udział spoza [0,1] jest ścinany.
 * `ownerIsHuman` (domyślnie true = gracz): true → wzór mnożony przez skalę (dziś, bez zmian);
 * false = AI → wzór addytywny: Δ = basePts·(skala−1) dodane do granic epoki 1 (D − Δ, GAi + Δ).
 */
export function cultureReligionLineValue(
  level: CulturaReligiaLevel,
  scaleEra: number,
  udzialWlasnej: number,
  bounds: Readonly<Record<CulturaReligiaLevel, CulturaReligiaBounds>> = CULTURA_RELIGIA_BOUNDS_DEFAULT,
  ownerIsHuman: boolean = true,
  basePts: number = CULTURA_RELIGIA_BASE_POINTS,
): number {
  const raw = bounds[level];
  const s = Number.isFinite(udzialWlasnej) ? Math.min(1, Math.max(0, udzialWlasnej)) : 1;
  const k = Number.isFinite(scaleEra) ? scaleEra : 1;
  if (ownerIsHuman) {
    return (raw.D + (raw.G - raw.D) * s) * k;
  }
  const delta = basePts * (k - 1);
  const dAi = raw.D - delta;
  const gAi = raw.GAi + delta;
  return dAi + (gAi - dAi) * s;
}
