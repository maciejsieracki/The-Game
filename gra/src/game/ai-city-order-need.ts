/**
 * R-WEB-AI-CULT-REL-GARRISON-BUILD-Q1 (AICULT, #189) -- potrzeba garnizonu wg Porzadku miasta.
 *
 * Czysta funkcja: ile jednostek garnizonu (linia Prawa „Garnizon (N jedn.)”) jest potrzebne,
 * zeby miasto wyszlo z buntu skrajnego (PorPct >= prog buntu). Liczy sie TYM SAMYM wzorem co
 * silnik: computePorPct (Szczescie + Prawo) i pctFromNetto/prawMax, wiec wynik nie rozjezdza sie
 * z gra. Garnizon wplywa wylacznie na Prawo (nie na Szczescie) i to tylko do capUnits jednostek.
 *
 * Zakres stosowania: poziom „Kultura i religia” = normalny / trudny. Latwy i tryb zgodnosci
 * (brak ustawienia) NIE uzywaja tej funkcji -- zachowanie AI jak dotad (patrz
 * `aiGarrisonNeedApplies`).
 */
import { computePorPct, pctFromNetto, porPctBand, REVOLT_CRITICAL_POR_PCT } from './society-breakdown';
import { FALLBACK_ORDER_PARAMS, type OrderParams } from './order';
import type { CulturaReligiaLevel } from './culture-religion-level';

export interface AiCityGarrisonNeedInput {
  /** Netto Prawa miasta BEZ linii garnizonu jednostek (budynki, osiedle, kultura i religia...). */
  prawoNettoBezGarnizonu: number;
  /** Szczescie miasta w % (SzPct, jak w computeHappinessBreakdown). */
  szPct: number;
  /** Mianownik Prawa miasta (prawMaxForCity). */
  prawMax: number;
  /** Punkty Prawa za jednostke garnizonu (prawo_garnizon_per_jednostka). */
  perUnit: number;
  /** Limit jednostek liczonych w Prawie (prawo_garnizon_cap_jednostek). */
  capUnits: number;
  /** Cap procentowy Prawa (scale.prawPctCap). */
  prawPctCap: number;
  /** Wagi Porzadku; domyslnie FALLBACK_ORDER_PARAMS. */
  params?: OrderParams;
  /** Prog buntu skrajnego; domyslnie REVOLT_CRITICAL_POR_PCT. */
  criticalPorPct?: number;
}

/**
 * Minimalna liczba jednostek garnizonu [0..capUnits], przy ktorej Porzadek miasta przestaje byc
 * w buncie skrajnym. Zero, gdy miasto juz z tego wychodzi. Gdy nawet pelny cap nie wystarcza,
 * zwraca capUnits (maksimum uzyteczne w Prawie) -- wtedy budynki/Szczescie musza dolozyc reszte.
 */
export function aiCityGarrisonNeed(input: AiCityGarrisonNeedInput): number {
  const params = input.params ?? FALLBACK_ORDER_PARAMS;
  const crit = Number.isFinite(input.criticalPorPct) ? (input.criticalPorPct as number) : REVOLT_CRITICAL_POR_PCT;
  const capUnits = Math.max(0, Math.floor(Number.isFinite(input.capUnits) ? input.capUnits : 0));
  const perUnit = Number.isFinite(input.perUnit) ? input.perUnit : 0;
  const base = Number.isFinite(input.prawoNettoBezGarnizonu) ? input.prawoNettoBezGarnizonu : 0;
  const prawMax = input.prawMax > 0 ? input.prawMax : 1;
  for (let n = 0; n <= capUnits; n++) {
    const prawPct = pctFromNetto(Math.max(0, base + perUnit * n), prawMax, input.prawPctCap);
    const porPct = computePorPct(input.szPct, prawPct, params);
    if (porPctBand(porPct, crit) !== 'bunt_skrajny') return n;
  }
  return capUnits;
}

/**
 * Czy wlaczyc potrzebe garnizonu wg Porzadku: tylko poziomy normalny i trudny. Latwy oraz
 * tryb zgodnosci (null) zachowuja dzisiejsze zachowanie AI bit-w-bit.
 */
export function aiGarrisonNeedApplies(level: CulturaReligiaLevel | null): boolean {
  return level === 'normalny' || level === 'trudny';
}
