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
import {
  computePorPct, pctFromNetto, porPctBand, REVOLT_CRITICAL_POR_PCT, loadRevoltParams, loadSocietyScaleParams,
  type OrderPctBreakdown,
} from './society-breakdown';
import {
  FALLBACK_ORDER_PARAMS, loadOrderParams, type OrderParams, type Difficulty, type SocietyParamsLike,
} from './order';
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

/**
 * AICULT r3: wejscie `aiCityGarrisonNeed` z PELNEGO rozbicia Porzadku miasta (wynik silnika
 * `evaluateOrderFromBreakdown`), bez duplikowania wzorow: Szczescie% i netto/mianownik Prawa
 * biora sie z `order`, a linie garnizonu (jednostek) odejmujemy od netto. perUnit/capUnits/cap
 * pochodza z tych samych parametrow `society-params` co silnik (`prawo_garnizon_*`, `prawo_pct_cap`).
 * Zwraca potrzebna liczbe jednostek garnizonu (0 = miasto nie jest w buncie skrajnym bez garnizonu).
 */
export function aiCityGarrisonNeedFromOrder(
  order: OrderPctBreakdown,
  society: SocietyParamsLike | null | undefined,
  difficulty: Difficulty,
): number {
  const prBlock = ((society as { prawo?: unknown } | null | undefined)?.prawo ?? {}) as Record<string, Record<string, unknown>>;
  const pick = (key: string, fb: number): number => {
    const v = prBlock[key]?.[difficulty];
    return typeof v === 'number' && Number.isFinite(v) ? v : fb;
  };
  const garrLine = order.prawo.lines.find(l => l.id === 'garnizon');
  return aiCityGarrisonNeed({
    prawoNettoBezGarnizonu: order.prawo.netto - (garrLine ? garrLine.value : 0),
    szPct: order.sz.szPct,
    prawMax: order.prawo.prawMax,
    perUnit: pick('prawo_garnizon_per_jednostka', 20),
    capUnits: pick('prawo_garnizon_cap_jednostek', 5),
    prawPctCap: loadSocietyScaleParams(society, difficulty).prawPctCap,
    params: loadOrderParams(society, difficulty),
    criticalPorPct: loadRevoltParams(society, difficulty).criticalPorPct,
  });
}
