/**
 * R-STAWKI-STROJENIE 2026-08-03 — Maciej: ×2 koszty (nie dochody). Playtest → ustaw 1 aby cofnąć.
 * R-NADMIAR-POOLS FALA2 2026-08-04 — Maciej: dodatkowe ×2 na wybrane koszty (stacking z FALA1).
 * Racje ludności: tylko FALA1 (bez FALA2).
 */
export const R_STAWKI_KOSZT_MULT = 2;

/** FALA2 — dodatkowy mnożnik ×2 (stacking z FALA1 tam, gdzie obowiązuje). */
export const R_STAWKI_FALA2_MULT = 2;

/** Efekt FALA1+FALA2 (×4) dla utrzymania jednostek i żywności wojska. */
export const R_STAWKI_FALA1_FALA2_MULT =
  R_STAWKI_KOSZT_MULT * R_STAWKI_FALA2_MULT;

function stripDiacriticsLower(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

/** Normalizacja epoki tech (Braz/Brąz, Zelazo/Żelazo → braz/zelazo). */
export function normalizeResearchEra(epoka?: string | null): string {
  if (!epoka) return 'kamien';
  const n = stripDiacriticsLower(epoka);
  if (n === 'braz' || n === 'brąz') return 'braz';
  if (n === 'zelazo' || n === 'żelazo') return 'zelazo';
  if (n === 'kamien' || n === 'kamień') return 'kamien';
  return n;
}

/** Brąz + Żelazo: dodatkowe ×2 kosztów badań (FALA2 na FALA1). */
export function isResearchEraFala2Extra(epoka?: string | null): boolean {
  const era = normalizeResearchEra(epoka);
  return era === 'braz' || era === 'zelazo';
}

/** Koszt surowców magazynowych budynku (koszt_surowce) — FALA2 ×2 vs JSON. */
export function scaleStockCostRecord(
  raw: Partial<Record<string, number>> | null | undefined,
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
      out[k] = Math.max(1, Math.round(v * R_STAWKI_FALA2_MULT));
    }
  }
  return out;
}

/** Koszt Pracy ulepszenia terenu przy budowie — FALA2 ×2 vs JSON. */
export function scaleImprovementWorkCost(base: number): number {
  if (!Number.isFinite(base) || base <= 0) return 0;
  return Math.max(1, Math.round(base * R_STAWKI_FALA2_MULT));
}

/** Koszt Pracy cudu (budowa na mapie / kolejka) — FALA2 ×2 vs wonders.json. */
export function scaledWonderWorkCost(kosztBudowy: number): number {
  if (!Number.isFinite(kosztBudowy) || kosztBudowy <= 0) return 0;
  return Math.max(1, Math.round(kosztBudowy * R_STAWKI_FALA2_MULT));
}

/** Koszt żywności przy starcie budowy cudu = skalowana Praca (zapasy państwa). */
export function scaledWonderFoodCost(kosztBudowy: number): number {
  return scaledWonderWorkCost(kosztBudowy);
}
