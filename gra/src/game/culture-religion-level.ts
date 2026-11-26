// R-WEB-CULT-REL-IMPL-Q1 (CULTIMPL) — ustawienie nowej gry „Kultura i religia”.
//
// Decyzja właściciela (2026-11-26, potwierdzona dosłownie): każda linia Kultury i każda linia
// Religii liczy się i do Szczęścia, i do PRAWA miasta. Granice na linię (epoka 1):
//   • Mały wpływ (łatwy):   D = −10, G = +10  (= dziś: 2·x·udział − x przy x = 10)
//   • Neutralny (normalny): D = −15, G = +5
//   • Duży wpływ (trudny):  D = −20, G = 0    (żadnych plusów)
// Wartość linii: (D + (G − D) · udział_własnej) · skala_epoki, skala_epoki = x_epoki / x_epoki1
// z `szczescie_skala_kultura_religia` (10/16/23 → ×1,0 / ×1,6 / ×2,3).
//
// Stan poziomu: `null` = brak pola (stary zapis / tryb zgodności) — wtedy Szczęście liczy się
// dokładnie jak dziś i linii Prawa NIE ma. Moduł jest CZYSTY (bez importów z gry).

export type CulturaReligiaLevel = 'latwy' | 'normalny' | 'trudny';

export const CULTURA_RELIGIA_LEVELS: readonly CulturaReligiaLevel[] = ['latwy', 'normalny', 'trudny'];

/** Granice linii na poziom (epoka 1). Nadpisywalne z `society-params.json → kultura_religia_poziomy`. */
export interface CulturaReligiaBounds {
  /** Wartość przy 0% własnej (dolna granica, ≤ 0). */
  D: number;
  /** Wartość przy 100% własnej (górna granica). */
  G: number;
}

export const CULTURA_RELIGIA_BOUNDS_DEFAULT: Readonly<Record<CulturaReligiaLevel, CulturaReligiaBounds>> = Object.freeze({
  latwy: { D: -10, G: 10 },
  normalny: { D: -15, G: 5 },
  trudny: { D: -20, G: 0 },
});

/** Normalizacja pola z kreatora/zapisu. Brak / zła wartość = `null` (tryb zgodności). */
export function normalizeCulturaReligiaLevel(raw: unknown): CulturaReligiaLevel | null {
  return raw === 'latwy' || raw === 'normalny' || raw === 'trudny' ? raw : null;
}

let activeLevel: CulturaReligiaLevel | null = null;

/** Ustawiane przy starcie nowej gry / wczytaniu zapisu (main.ts). `undefined` = zgodność. */
export function setCulturaReligiaLevel(raw: unknown): void {
  activeLevel = normalizeCulturaReligiaLevel(raw);
}

export function getCulturaReligiaLevel(): CulturaReligiaLevel | null {
  return activeLevel;
}

/**
 * Wartość jednej linii (Kultura albo Religia) dla poziomu, epoki i udziału własnej [0,1].
 * `scaleEra` = x_epoki / x_epoki1 (np. 1,0 / 1,6 / 2,3). Udział spoza [0,1] jest ścinany.
 * Dla poziomu łatwego wynik jest matematycznie równy dzisiejszemu 2·x·udział − x (x = 10·scaleEra);
 * silnik używa jednak dokładnie dzisiejszego wzoru dla `latwy`, żeby wynik był bit-w-bit.
 */
export function cultureReligionLineValue(
  level: CulturaReligiaLevel,
  scaleEra: number,
  udzialWlasnej: number,
  bounds: Readonly<Record<CulturaReligiaLevel, CulturaReligiaBounds>> = CULTURA_RELIGIA_BOUNDS_DEFAULT,
): number {
  const b = bounds[level];
  const s = Number.isFinite(udzialWlasnej) ? Math.min(1, Math.max(0, udzialWlasnej)) : 1;
  const k = Number.isFinite(scaleEra) ? scaleEra : 1;
  return (b.D + (b.G - b.D) * s) * k;
}
