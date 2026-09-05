/**
 * empire-food.ts — centralny magazyn żywności (PYTANIE-85).
 *
 * Kolejność tury: suma bilansów lokalnych → nadwyżki do centrali → dopłaty miastom
 * → koszt wojska → zmiana stanu magazynu. Wzrost ludności w population-growth-v85.ts.
 */
import type { EconomyTickResult, EconUnit, CityEconomyTick, OwnerEraResolver } from './turn-economy';
import { militaryFoodConsumptionWithSpichlerz, recomputeCityFoodBalancesInEcon } from './turn-economy';
import type { UpkeepParams, UnitFoodTable } from './economy-upkeep';
import { magazynEraMultiplier } from './economy-upkeep';
import { isBarbarian } from './barbarians';
import { SPICHLERZ_EMPIRE_CAP_I, SPICHLERZ_EMPIRE_CAP_II_FULL, resolveSpichlerzCityBonusState } from './building-resource-gate';
import type { SpichlerzCityBonusState } from './building-resource-gate';
import type { City } from './cities';
import {
  buildRationParams,
  clampPoziomRacji,
  ensureCityRationDefaults,
  getCityRationLevel,
  rationGrowthPercent,
  WYZYWIENIE_LEVELS,
  WYZYWIENIE_MIN,
  type GrowthPercentBreakdown,
  type PoziomRacji,
  type RationParams,
} from './population-growth-v85';

export interface EmpireFoodState {
  /** Centralny magazyn żywności imperium (PYTANIE-85). */
  zapasyPanstwa: number;
  /** @deprecated migracja — nie używane w logice V85. */
  procentRozwoj?: number;
  turyUjemnychZapasow: number;
}

export interface EmpireFoodParams {
  /** Baza capu magazynu centralnego 🍞. */
  centralCapBaza: number;
  /** Dodatek capu za każdy budynek Magazyn w imperium. */
  centralCapBonusMagazyn: number;
  glodWojskaHpFrac: number;
  glodWojskaKarencjaTur: number;
  /** Mnożnik statów bojowych (bez armor) gdy glodWojska — domyślnie 0.75. */
  glodWojskaStatMult: number;
  rationParams: RationParams;
}

export interface EmpireFoodCityRow {
  cityId: string;
  name: string;
  produkcja: number;
  kosztRacji: number;
  bilans: number;
  wzrostProcent: number;
  nakarmione: boolean;
  breakdown?: GrowthPercentBreakdown;
}

export interface EmpireFoodTick {
  ownerId: number;
  /** Uprawa i hodowla — suma produkcji brutto miast. */
  uprawaHodowla: number;
  /** Wyżywienie ludności — suma kosztów racji. */
  wyzwienieLudnosci: number;
  /** Nadwyżka — produkcja − wyżywienie (przed dopłatami). */
  nadwyzka: number;
  /** Pomoc miastom — dopłaty z magazynu do miast na minusie. */
  pomocMiastom: number;
  /** Spichlerz stolicy — pula po pomocy miastom, przed wojskiem. */
  spichlerzStolicy: number;
  /** Wojsko — koszt żywności armii. */
  wojsko: number;
  /** Przyrost zapasów — zmiana stanu magazynu w tej turze. */
  przyrostZapasow: number;
  zapasyPrzed: number;
  zapasyPo: number;
  maxCap: number;
  kosztArmii: number;
  glodWojska: boolean;
  turyUjemnychZapasowPo: number;
  glodWojskaAtrycjaAktywna: boolean;
  /** @deprecated alias do uprawaHodowla */
  zywnoscBrutto: number;
  /** @deprecated */
  doRozwoju: number;
  /** @deprecated */
  doPanstwa: number;
  perCityRows: EmpireFoodCityRow[];
  fedByCityId: Map<string, boolean>;
}

export interface EmpireFoodTickResult {
  perOwner: EmpireFoodTick[];
  byOwner: Map<number, EmpireFoodTick>;
}

type Difficulty = 'easy' | 'normal' | 'hard';
interface RawParamRow { easy?: number; normal?: number; hard?: number; }

function pick(row: RawParamRow | undefined, d: Difficulty, fallback: number): number {
  if (!row) return fallback;
  const v = row[d];
  return Number.isFinite(v) ? (v as number) : fallback;
}

export function buildEmpireFoodParams(
  raw: {
    ekonomia_miasta?: Record<string, RawParamRow>;
    globalne?: Record<string, RawParamRow>;
    glod_wojska_hp_frac?: RawParamRow;
    glod_wojska_karencja_tur?: RawParamRow;
    glod_wojska_stat_mult?: RawParamRow;
    magazyn_centralny_baza_zywnosc?: RawParamRow;
    magazyn_centralny_bonus_zywnosc_na_budynek?: RawParamRow;
  },
  difficulty: Difficulty = 'normal',
): EmpireFoodParams {
  const em = raw.ekonomia_miasta ?? raw;
  const gl = raw.globalne ?? raw;
  return {
    centralCapBaza: pick(
      gl.magazyn_centralny_baza_zywnosc ?? em.magazyn_centralny_baza_zywnosc,
      difficulty, 1000,
    ),
    centralCapBonusMagazyn: pick(
      gl.magazyn_centralny_bonus_zywnosc_na_budynek ?? em.magazyn_centralny_bonus_zywnosc_na_budynek,
      difficulty, 100,
    ),
    glodWojskaHpFrac: pick(em.glod_wojska_hp_frac, difficulty, 0.08),
    glodWojskaKarencjaTur: pick(em.glod_wojska_karencja_tur, difficulty, 3),
    glodWojskaStatMult: pick(em.glod_wojska_stat_mult, difficulty, 0.75),
    rationParams: buildRationParams(raw, difficulty),
  };
}

export function freshEmpireFoodState(_procentRozwojDefault = 100): EmpireFoodState {
  return { zapasyPanstwa: 0, turyUjemnychZapasow: 0 };
}

function countMagazynByOwner(
  perCity: EconomyTickResult['perCity'],
  builtByCity?: ReadonlyMap<string, readonly string[]>,
): Map<number, number> {
  const out = new Map<number, number>();
  if (!builtByCity) return out;
  const seen = new Set<string>();
  for (const tick of perCity) {
    if (seen.has(tick.cityId)) continue;
    seen.add(tick.cityId);
    if ((builtByCity.get(tick.cityId) ?? []).includes('magazyn')) {
      out.set(tick.ownerId, (out.get(tick.ownerId) ?? 0) + 1);
    }
  }
  return out;
}

/**
 * P-MAGAZYN-SKALOWANIE-EPOKA-Q1 (Maciej 2026-08-12): `era` skaluje WYŁĄCZNIE
 * wkład Spichlerza (SPICHLERZ_EMPIRE_CAP_I/II, magazynEraMultiplier -- ×2/epokę
 * CYWILIZACJI WŁAŚCICIELA) -- `centralCapBaza`/`centralCapBonusMagazyn`
 * (magazyn_centralny_baza_zywnosc / magazyn_centralny_bonus_zywnosc_na_budynek)
 * NIE są objęte tym zadaniem, zostają FLAT bez zmian (poza zakresem
 * P-MAGAZYN-SKALOWANIE-EPOKA-Q1 -- właściciel wskazał wyłącznie magazyn_baza_surowce
 * / magazyn_bonus_surowce_na_budynek / Spichlerz I/II). Domyślne era=1 -> mnożnik
 * ×1, zachowanie identyczne jak przed ta zmiana.
 */
function computeCentralFoodCap(
  ownerId: number,
  perCity: EconomyTickResult['perCity'],
  magazynCount: number,
  params: EmpireFoodParams,
  era: number = 1,
): number {
  const spichlerzMult = magazynEraMultiplier(era);
  let spichlerzCap = 0;
  for (const tick of perCity) {
    if (tick.ownerId !== ownerId || tick.oblegany) continue;
    if (tick.maSpichlerzII) spichlerzCap += SPICHLERZ_EMPIRE_CAP_II_FULL * spichlerzMult;
    else if (tick.maSpichlerz) spichlerzCap += SPICHLERZ_EMPIRE_CAP_I * spichlerzMult;
  }
  return params.centralCapBaza
    + params.centralCapBonusMagazyn * magazynCount
    + spichlerzCap;
}

export function advanceEmpireFood(
  econ: EconomyTickResult,
  units: ReadonlyArray<EconUnit>,
  states: Map<number, EmpireFoodState>,
  upkeep: UpkeepParams,
  params: EmpireFoodParams,
  foodTable: UnitFoodTable = {},
  builtByCity?: ReadonlyMap<string, readonly string[]>,
  /**
   * P-MAGAZYN-SKALOWANIE-EPOKA-Q1 (Maciej 2026-08-12): epoka CYWILIZACJI
   * WŁAŚCICIELA dla skalowania wkładu Spichlerza do centralnego capu żywności
   * (computeCentralFoodCap). OPCJONALNY, na końcu -- zachowuje wsteczna
   * kompatybilność z istniejącymi wywołaniami testowymi (era=1, mnożnik ×1,
   * identyczne zachowanie jak przed ta zmianą). PARYTET AI: ta sama funkcja
   * (main.ts::empireEpochForOwner) dla gracza (ownerId=0) i AI, zero gałęzi.
   */
  resolveOwnerEra?: OwnerEraResolver,
): EmpireFoodTickResult {
  const magazynCountByOwner = countMagazynByOwner(econ.perCity, builtByCity);
  const perOwner: EmpireFoodTick[] = [];
  const byOwner = new Map<number, EmpireFoodTick>();

  const ownerIds = new Set<number>([
    ...econ.perCity.map(t => t.ownerId),
    ...states.keys(),
    ...units.map(u => u.ownerId),
  ]);

  for (const ownerId of ownerIds) {
    // Barbarzyńcy (ownerId=-1) nie mają miast ani magazynu państwa — pomijamy głód wojska.
    if (isBarbarian(ownerId)) continue;

    const st = states.get(ownerId) ?? freshEmpireFoodState();
    if (!states.has(ownerId)) states.set(ownerId, st);

    const zapasyPrzed = st.zapasyPanstwa;
    let central = zapasyPrzed;
    let uprawaHodowla = 0;
    let wyzwienieLudnosci = 0;
    let pomocMiastom = 0;
    const deficits: Array<{ cityId: string; need: number; name: string }> = [];
    const perCityRows: EmpireFoodCityRow[] = [];
    const fedByCityId = new Map<string, boolean>();

    for (const tick of econ.perCity) {
      if (tick.ownerId !== ownerId || tick.oblegany) continue;
      const produkcja = tick.zywnoscBrutto ?? Math.max(0, tick.zywnoscNetto + (tick.kosztRacji ?? 0));
      const kosztRacji = tick.kosztRacji ?? 0;
      const bilans = tick.bilansLokalny ?? (produkcja - kosztRacji);
      uprawaHodowla += produkcja;
      wyzwienieLudnosci += kosztRacji;

      perCityRows.push({
        cityId: tick.cityId,
        name: tick.cityId,
        produkcja,
        kosztRacji,
        bilans,
        wzrostProcent: tick.wzrostProcent ?? 0,
        nakarmione: false,
      });

      if (bilans >= 0) {
        central += bilans;
        fedByCityId.set(tick.cityId, true);
      } else {
        deficits.push({ cityId: tick.cityId, need: -bilans, name: tick.cityId });
      }
    }

    for (const d of deficits) {
      const covered = Math.min(d.need, Math.max(0, central));
      central -= covered;
      pomocMiastom += covered;
      const fed = covered >= d.need;
      fedByCityId.set(d.cityId, fed);
      const row = perCityRows.find(r => r.cityId === d.cityId);
      if (row) row.nakarmione = fed;
    }

    const nadwyzka = uprawaHodowla - wyzwienieLudnosci;
    const spichlerzStolicy = central;
    const kosztArmii = militaryFoodConsumptionWithSpichlerz(units, ownerId, upkeep, foodTable);
    central -= kosztArmii;

    const ownerEra = resolveOwnerEra ? resolveOwnerEra(ownerId) : 1;
    const maxCap = computeCentralFoodCap(
      ownerId, econ.perCity, magazynCountByOwner.get(ownerId) ?? 0, params, ownerEra,
    );
    if (central > maxCap) central = maxCap;
    const glodWojska = central < 0;
    central = Math.max(0, central);
    const przyrostZapasow = central - zapasyPrzed;

    st.zapasyPanstwa = central;
    _maxCapByOwner.set(ownerId, maxCap);

    const turyUjemnychZapasowPrzed = st.turyUjemnychZapasow ?? 0;
    const turyUjemnychZapasowPo = glodWojska ? turyUjemnychZapasowPrzed + 1 : 0;
    st.turyUjemnychZapasow = turyUjemnychZapasowPo;

    const tick: EmpireFoodTick = {
      ownerId,
      uprawaHodowla,
      wyzwienieLudnosci,
      nadwyzka,
      pomocMiastom,
      spichlerzStolicy,
      wojsko: kosztArmii,
      przyrostZapasow,
      zapasyPrzed,
      zapasyPo: central,
      maxCap,
      kosztArmii,
      glodWojska,
      turyUjemnychZapasowPo,
      glodWojskaAtrycjaAktywna: turyUjemnychZapasowPo >= params.glodWojskaKarencjaTur,
      zywnoscBrutto: uprawaHodowla,
      doRozwoju: 0,
      doPanstwa: nadwyzka,
      perCityRows,
      fedByCityId,
    };
    perOwner.push(tick);
    byOwner.set(ownerId, tick);
  }

  _setLastEmpireFoodTicks(byOwner);
  return { perOwner, byOwner };
}

// --- Runtime accessors (HUD) ---

let _lastTicks = new Map<number, EmpireFoodTick>();
let _statesRef = new Map<number, EmpireFoodState>();
let _maxCapByOwner = new Map<number, number>();

export function bindEmpireFoodRuntime(states: Map<number, EmpireFoodState>): void {
  _statesRef = states;
}

export function getEmpireFoodReserve(ownerId: number): number {
  return _statesRef.get(ownerId)?.zapasyPanstwa ?? 0;
}

export function getEmpireFoodMaxCap(ownerId: number): number {
  return _maxCapByOwner.get(ownerId) ?? 0;
}

/** @deprecated PYTANIE-85 — suwak usunięty. */
export function getEmpireFoodSplit(_ownerId: number): number {
  return 100;
}

/**
 * Głód wojska — osłabienie statów bojowych (bez armor) gdy w tej turze zabrakło żywności na armię.
 * Wcześniejsze niż isArmyStarving (atrycja HP po karencji).
 */
export function isArmyHungry(ownerId: number): boolean {
  if (isBarbarian(ownerId)) return false;
  return _lastTicks.get(ownerId)?.glodWojska ?? false;
}

/** Atrycja HP wojska — aktywna PO karencji glodWojskaKarencjaTur tur z głodem wojska z rzędu. */
export function isArmyStarving(ownerId: number): boolean {
  if (isBarbarian(ownerId)) return false;
  return _lastTicks.get(ownerId)?.glodWojskaAtrycjaAktywna ?? false;
}

export function getArmyStarvationCountdown(ownerId: number, karencjaTur: number): number | null {
  const t = _lastTicks.get(ownerId);
  if (!t || !t.glodWojska || t.glodWojskaAtrycjaAktywna) return null;
  return Math.max(1, karencjaTur - t.turyUjemnychZapasowPo);
}

export function getLastEmpireFoodTick(ownerId: number): EmpireFoodTick | undefined {
  return _lastTicks.get(ownerId);
}

export function _setLastEmpireFoodTicks(ticks: Map<number, EmpireFoodTick>): void {
  _lastTicks = ticks;
}

export function clearLastEmpireFoodTicks(): void {
  _lastTicks = new Map();
  _maxCapByOwner = new Map();
}

// --- SPICH-AUTO-Q1: auto-obniżenie racji do bilansu miast = 0 (przed wojskiem) ---

/** R-AUTO-RACJE-RAISE-Q5=A: auto obniżanie+podnoszenie Wyżywienia. Gracz: tylko gdy flaga WŁ. AI: zawsze. */
export function isCityAutoWyzywienieEnabled(city: City, opts?: { forceAuto?: boolean }): boolean {
  if (opts?.forceAuto) return true;
  if (city.ownerId !== 0) return true;
  return city.autoWyzywienie === true;
}

function ownerCitiesForAutoAdjust(
  cities: City[],
  ownerId: number,
  onlyAutoManaged?: boolean,
): City[] {
  const ownerCities = cities.filter(c => c.ownerId === ownerId);
  if (!onlyAutoManaged) return ownerCities;
  return ownerCities.filter(c => isCityAutoWyzywienieEnabled(c));
}

export interface AutoRationCityChange {
  cityId: string;
  name: string;
  oldLevel: PoziomRacji;
  newLevel: PoziomRacji;
}

export interface AutoRationAdjustResult {
  adjusted: boolean;
  changes: AutoRationCityChange[];
}

type CityFoodTickLike = Pick<
  CityEconomyTick,
  'ownerId' | 'oblegany' | 'zywnoscBrutto' | 'kosztRacji' | 'bilansLokalny'
>;

/** Suma produkcji − koszt racji (imperium, bez wojska). */
export function computeEmpireCityFoodNadwyzka(
  perCity: ReadonlyArray<CityFoodTickLike>,
  ownerId: number,
): number {
  let uprawa = 0;
  let koszt = 0;
  for (const tick of perCity) {
    if (tick.ownerId !== ownerId || tick.oblegany) continue;
    const produkcja = tick.zywnoscBrutto ?? 0;
    const kosztRacji = tick.kosztRacji ?? 0;
    uprawa += produkcja;
    koszt += kosztRacji;
  }
  return uprawa - koszt;
}

/** Symulacja puli centralnej po dopłatach miastom (przed kosztem wojska). */
export function simulateCityFoodCentralPool(
  zapasyPrzed: number,
  perCity: ReadonlyArray<CityFoodTickLike>,
  ownerId: number,
): number {
  let central = zapasyPrzed;
  const deficits: number[] = [];
  for (const tick of perCity) {
    if (tick.ownerId !== ownerId || tick.oblegany) continue;
    const produkcja = tick.zywnoscBrutto ?? 0;
    const koszt = tick.kosztRacji ?? 0;
    const bilans = tick.bilansLokalny ?? (produkcja - koszt);
    if (bilans >= 0) {
      central += bilans;
    } else {
      deficits.push(-bilans);
    }
  }
  for (const need of deficits) {
    const covered = Math.min(need, Math.max(0, central));
    central -= covered;
  }
  return central;
}

/**
 * R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A: czy KAŻDE miasto właściciela zostanie w tej turze
 * nakarmione, tzn. czy pula centralna pokryje KAŻDY deficyt lokalny W CAŁOŚCI.
 *
 * `simulateCityFoodCentralPool` tego NIE mówi: pokrywa deficyty `Math.min(need, max(0, central))`,
 * więc gdy puli zabraknie, zwraca 0 — nigdy nie schodzi poniżej zera i „pool >= 0" jest w praktyce
 * zawsze prawdą. Głód (`fed=false` → `applyHungerPenaltyV85` → −1 ludność) rozpoznaje dopiero
 * `advanceEmpireFood` (:257-265). Ta funkcja odtwarza DOKŁADNIE tę samą kolejność (nadwyżki do
 * puli, potem deficyty w kolejności miast) i zwraca twardy warunek nadrzędny funkcji celu
 * autowyżywienia: „żadne miasto nie głoduje".
 * EN: whether EVERY city gets fully covered this turn — the hard constraint of the auto-feeding
 * objective. `simulateCityFoodCentralPool` cannot answer this: it clamps coverage at the pool's
 * remainder and never returns a negative pool, so "pool >= 0" is vacuous. Mirrors the exact
 * redistribution order of `advanceEmpireFood`.
 */
export function simulateCityFoodAllFed(
  zapasyPrzed: number,
  perCity: ReadonlyArray<CityFoodTickLike>,
  ownerId: number,
): boolean {
  let central = zapasyPrzed;
  const deficits: number[] = [];
  for (const tick of perCity) {
    if (tick.ownerId !== ownerId || tick.oblegany) continue;
    const produkcja = tick.zywnoscBrutto ?? 0;
    const koszt = tick.kosztRacji ?? 0;
    const bilans = tick.bilansLokalny ?? (produkcja - koszt);
    if (bilans >= 0) central += bilans;
    else deficits.push(-bilans);
  }
  for (const need of deficits) {
    const covered = Math.min(need, Math.max(0, central));
    central -= covered;
    if (covered < need - 1e-9) return false;
  }
  return true;
}

/**
 * R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A, własność (B): poziom Wyżywienia miasta, które osiągnęło
 * limit ludności. Najniższy poziom z `WYZYWIENIE_LEVELS` o NIEUJEMNYM wzroście (dziś 1,5 → 0%):
 * miasto na limicie nie musi rosnąć (i tak nie urośnie — `applyFractionalGrowthV85` blokuje
 * DODATNI przyrost przy `pop >= popCap`, ale ujemnego NIE blokuje: gałąź `growthPct < 0`
 * w `population-growth-v85.ts:250` działa niezależnie od capu), więc poziom niżej
 * (−2%/−6%/−10%) jest wykluczony DOPÓKI stać na to imperium. To jest SUFIT, nie podłoga:
 * gdy wspólny poziom miast rosnących spada poniżej tej wartości, miasto na limicie schodzi
 * razem z nimi (`cappedLevelFor`) — inaczej byłoby uprzywilejowane kosztem rosnących. Wyprowadzony z tabeli `WYZYWIENIE_GROWTH_PCT`, nie wpisany ręcznie —
 * zmiana tabeli automatycznie przesuwa ten poziom.
 * EN: ration level for a city at its population cap — the lowest level with non-negative growth
 * (today 1.5 → 0%). Derived from WYZYWIENIE_GROWTH_PCT, not a magic number. Its surplus portion
 * returns to the central pool for the remaining cities.
 */
export const WYZYWIENIE_POZIOM_NA_LIMICIE: PoziomRacji =
  WYZYWIENIE_LEVELS.find(l => rationGrowthPercent(l) >= 0) ?? WYZYWIENIE_MIN;

export interface EqualGrowthRationPlanOpts {
  ownerId: number;
  cities: City[];
  econ: Pick<EconomyTickResult, 'perCity'>;
  zapasyPrzed: number;
  rationParams: RationParams;
  spichlerzByCity?: ReadonlyMap<string, SpichlerzCityBonusState>;
  /** Gracz Q5=A: planem obejmujemy tylko miasta z autoWyzywienie === true. */
  onlyAutoManaged?: boolean;
  /** Gracz (ownerId===0): kryterium FLOW-based zamiast STOCK-based — patrz `isRationBalanceTargetMet`. */
  requireFlowBalance?: boolean;
  /** Koszt żywności armii tej tury — ten sam kontrakt co w `AutoBalanceRationsOpts.kosztArmii`. */
  kosztArmii?: number;
  /**
   * Własność (B): limit ludności per miasto (`cityPopulationCap(maAkwedukt, maSpichlerz, econParams)`),
   * liczony przez wołającego — `empire-food.ts` nie zna ani `builtByCity`, ani `EconParams`, a
   * `City` nie niesie capu. Brak mapy (dziś: wywołania z `main.ts` przed wdrożeniem węzła B) →
   * żadne miasto nie jest uznane za „na limicie" i plan zachowuje się jak bez własności (B),
   * bez zmiany zachowania wstecz.
   * EN: per-city population cap, computed by the caller (empire-food.ts knows neither builtByCity
   * nor EconParams, and City carries no cap). Absent → no city is treated as capped (backward
   * compatible).
   */
  popCapByCityId?: ReadonlyMap<string, number>;
}

export interface EqualGrowthRationPlan {
  /** Wspólny poziom Wyżywienia dla miast, które jeszcze mogą rosnąć. */
  uniformLevel: PoziomRacji;
  /** Docelowy poziom per miasto (miasta na limicie ludności dostają `WYZYWIENIE_POZIOM_NA_LIMICIE`). */
  levelByCityId: Map<string, PoziomRacji>;
  /** Miasta rozpoznane jako będące na limicie ludności (własność B). */
  atPopCapCityIds: string[];
  /** Czy przy tym planie KAŻDE miasto właściciela jest nakarmione (twardy warunek nadrzędny). */
  allFed: boolean;
}

/**
 * R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A — RDZEŃ nowej funkcji celu autowyżywienia.
 *
 * PRZYCZYNA, którą to zastępuje (zmierzona, nie założona — raport `01-operator.md`): dawny
 * mechanizm był ASYMETRYCZNY. Obniżanie szło PER MIASTO przez `maxSafePoziomRacjiForCity`, które
 * pytało „jak nisko musi zejść TO JEDNO miasto, żeby CAŁE imperium się zbilansowało" — więc
 * pierwsze odpytane miasto pochłaniało całą korektę imperium i lądowało na 0 (−10% wzrostu),
 * a pozostałe zostawały na 4 (+4,5%). Podnoszenie szło natomiast LOCKSTEP przez
 * `autoRaiseRationsForGrowth` (krok o `WYZYWIENIE_STEP` we WSZYSTKICH miastach naraz, cofany
 * globalnie) — więc przyklepane miasto mogło wrócić dopiero, gdy na krok stać było całe imperium.
 * Efekt: zapadka, w której miasto z ZEROWYM kosztem racji (dodatni bilans lokalny!) kurczy się,
 * a miasto na pełnych racjach (ujemny bilans, dopłacany z puli) rośnie +7% — dokładnie odwrotna
 * zależność ze zrzutu właściciela.
 *
 * NOWA FUNKCJA CELU: nie „podnoś racje wszystkim, dopóki się da", tylko WYRÓWNYWANIE WZROSTU.
 * Racje są jedyną dźwignią, którą autowyżywienie steruje wzrostem (`WYZYWIENIE_GROWTH_PCT`),
 * więc WSPÓLNY poziom = wspólny składnik `racje` wzrostu: przy tej samej wielkości i tych samych
 * modyfikatorach dwa miasta dostają ten sam WZROST%, niezależnie od tego, które z nich ma
 * lokalną nadwyżkę, a które deficyt (deficyt pokrywa redystrybucja z puli centralnej,
 * `advanceEmpireFood:257-265` — mechanizm, którego ta zmiana NIE dotyka).
 *
 * Plan to najwyższy WSPÓLNY poziom, przy którym JEDNOCZEŚNIE:
 *   (1) żadne miasto nie głoduje (`simulateCityFoodAllFed`) — twardy warunek nadrzędny,
 *   (2) kryterium bilansu jest spełnione (`isRationBalanceTargetMet`, to samo co dotąd).
 * Koszt racji rośnie monotonicznie z poziomem, więc skan malejący znajduje maksimum.
 * Stąd własność (C): mniej żywności → niższy wspólny poziom → CAŁA cywilizacja zwalnia razem,
 * zamiast części miast stanąć, a części pędzić.
 * Własność (B): miasto na limicie ludności wychodzi z wyrównywania — dostaje
 * `WYZYWIENIE_POZIOM_NA_LIMICIE`, a zaoszczędzona porcja podnosi wspólny poziom pozostałym.
 *
 * Funkcja NIE zapisuje niczego trwale: ustawia poziomy próbnie, a na końcu przywraca stan
 * wejściowy (`econ` przeliczony z powrotem), więc jest bezpieczna także jako zapytanie.
 */
export function resolveEqualGrowthRationPlan(
  opts: EqualGrowthRationPlanOpts,
): EqualGrowthRationPlan {
  const {
    ownerId, cities, econ, zapasyPrzed, rationParams, spichlerzByCity,
    onlyAutoManaged, requireFlowBalance, kosztArmii = 0, popCapByCityId,
  } = opts;

  const managed = ownerCitiesForAutoAdjust(cities, ownerId, onlyAutoManaged);
  const originalLevels = new Map<string, PoziomRacji>();
  for (const c of managed) {
    ensureCityRationDefaults(c);
    originalLevels.set(c.id, getCityRationLevel(c));
  }

  const atPopCap: City[] = [];
  const growing: City[] = [];
  for (const c of managed) {
    const cap = popCapByCityId?.get(c.id);
    if (cap !== undefined && c.population >= cap) atPopCap.push(c);
    else growing.push(c);
  }

  const perCity = econ.perCity as CityEconomyTick[];
  /**
   * Poziom miasta na limicie: „potrzeba" (0% wzrostu), ale NIGDY więcej niż dostają miasta
   * rosnace. Bez `Math.min` w niedoborze wychodziło odwrotnie niz mowi GOAL wlasnosci (B)
   * („nie konsumuje racji ponad potrzebe — jego porcja wraca do puli dla pozostalych"):
   * przy wspolnym poziomie ponizej 1,5 miasto na limicie konsumowalo DROZSZE racje niz miasta,
   * ktorym ta porcja miala pomoc, i spychalo je o caly poziom nizej (pomiar: 12 miast ze zrzutu,
   * cap 5, kosztArmii 20, zapasy 279, produkcja x0,25 — BEZ mapy limitow wspolny poziom 0,5
   * (-6%), Z mapa 0 (-10%)). `Math.min` zachowuje oszczednosc tam, gdzie ona istnieje
   * (poziom > 1,5 → miasto na limicie bierze 1,5 i oddaje reszte do puli), a w niedoborze
   * zrownuje je z pozostalymi — wlasnosc (C): przy mniejszej ilosci zywnosci ZWALNIAJA WSZYSCY,
   * miasto na limicie nie jest uprzywilejowane kosztem rosnacych.
   * EN: capped city takes its "need" level (0% growth) but never MORE than the growing cities.
   */
  const cappedLevelFor = (level: PoziomRacji): PoziomRacji =>
    Math.min(WYZYWIENIE_POZIOM_NA_LIMICIE, level) as PoziomRacji;
  const applyCandidate = (level: PoziomRacji): void => {
    for (const c of atPopCap) c.poziomRacji = cappedLevelFor(level);
    for (const c of growing) c.poziomRacji = level;
    recomputeCityFoodBalancesInEcon(perCity, cities, rationParams, spichlerzByCity);
  };
  const feasible = (): boolean =>
    simulateCityFoodAllFed(zapasyPrzed, perCity, ownerId)
    && isRationBalanceTargetMet(zapasyPrzed, perCity, ownerId, requireFlowBalance, kosztArmii);

  let uniformLevel: PoziomRacji = WYZYWIENIE_MIN;
  let allFed = false;
  for (let i = WYZYWIENIE_LEVELS.length - 1; i >= 0; i--) {
    const level = WYZYWIENIE_LEVELS[i] ?? WYZYWIENIE_MIN;
    applyCandidate(level);
    if (feasible()) { uniformLevel = level; allFed = true; break; }
  }
  if (!allFed) {
    // Nawet minimum nie karmi wszystkich (produkcja imperium nie pokrywa samego istnienia miast) —
    // zostajemy na minimum: niżej zejść się nie da, a wyżej byłoby tylko gorzej.
    applyCandidate(WYZYWIENIE_MIN);
    allFed = simulateCityFoodAllFed(zapasyPrzed, perCity, ownerId);
  }

  const levelByCityId = new Map<string, PoziomRacji>();
  for (const c of atPopCap) levelByCityId.set(c.id, cappedLevelFor(uniformLevel));
  for (const c of growing) levelByCityId.set(c.id, uniformLevel);

  // Przywróć stan wejściowy — plan jest zapytaniem, nie zapisem.
  for (const c of managed) c.poziomRacji = originalLevels.get(c.id)!;
  recomputeCityFoodBalancesInEcon(perCity, cities, rationParams, spichlerzByCity);

  return {
    uniformLevel,
    levelByCityId,
    atPopCapCityIds: atPopCap.map(c => c.id),
    allFed,
  };
}

/** Zastosuj plan wyrównania i zwróć listę faktycznych zmian poziomu. */
function applyEqualGrowthRationPlan(
  plan: EqualGrowthRationPlan,
  cities: City[],
  ownerId: number,
  onlyAutoManaged: boolean | undefined,
  econ: Pick<EconomyTickResult, 'perCity'>,
  rationParams: RationParams,
  spichlerzByCity?: ReadonlyMap<string, SpichlerzCityBonusState>,
): AutoRationCityChange[] {
  const managed = ownerCitiesForAutoAdjust(cities, ownerId, onlyAutoManaged);
  const changes: AutoRationCityChange[] = [];
  for (const c of managed) {
    const target = plan.levelByCityId.get(c.id);
    if (target === undefined) continue;
    const oldLevel = getCityRationLevel(c);
    const newLevel = clampPoziomRacji(target);
    if (Math.abs(newLevel - oldLevel) < 1e-9) continue;
    c.poziomRacji = newLevel;
    changes.push({ cityId: c.id, name: c.name, oldLevel, newLevel });
  }
  if (changes.length > 0) {
    recomputeCityFoodBalancesInEcon(
      econ.perCity as CityEconomyTick[], cities, rationParams, spichlerzByCity,
    );
  }
  return changes;
}

/**
 * Czy po rozliczeniu miast Spichlerz nie jest ujemny.
 *
 * R-AUTO-WYZYWIENIE-KRYTERIUM-Q1=A, z doprecyzowaniem właściciela (2026-08-13, ECHO
 * `dyspozycje/PYTANIA-OTWARTE.md`): `kosztArmii` (domyślnie 0, kompatybilność wsteczna dla
 * wywołań, które go jeszcze nie liczą w danym momencie tury) jest teraz odejmowany od kryterium
 * — dawniej funkcja nazywała się "solvent" ale liczyła TYLKO bilans miast + rezerwę, ignorując
 * że ta sama rezerwa w tej samej turze ma jeszcze pokryć żywność wojska (`central -= kosztArmii`
 * w `advanceEmpireFood`, linia ~270) — więc "solvent" według starej definicji nie gwarantowało
 * że PRZYROST ZAPASÓW (stan magazynu PO turze) faktycznie będzie ≥0, jeśli wojsko było drogie.
 * EN: `kosztArmii` (default 0, backward-compat for callers that don't compute it yet at that
 * point in the turn) is now subtracted from the criterion — the function used to be named
 * "solvent" but only counted the cities' balance + reserve, ignoring that the same reserve this
 * same turn still has to cover the army's food (`central -= kosztArmii` in `advanceEmpireFood`,
 * line ~270) — so "solvent" under the old definition did not guarantee that the stockpile's net
 * change (state AFTER the turn) would actually be ≥0 when the army was expensive.
 */
export function isEmpireCityFoodSolvent(
  zapasyPrzed: number,
  perCity: ReadonlyArray<CityFoodTickLike>,
  ownerId: number,
  kosztArmii: number = 0,
): boolean {
  return computeEmpireCityFoodNadwyzka(perCity, ownerId) + zapasyPrzed - kosztArmii >= 0;
}

/**
 * R-AUTO-WYZYWIENIE-CEL-BILANS-NIEUJEMNY (rozpoznanie #4, Maciej 2026-08-10, ECHO „zgoda"):
 * kryterium docelowe dla auto-korekty poziomu Racji. Domyślnie (`requireFlowBalance` fałsz/
 * pominięte) — STOCK-based: `isEmpireCityFoodSolvent` (skumulowana rezerwa `zapasyPrzed` może
 * pokryć chwilowy lokalny deficyt) — dzisiejsze zachowanie dla AI/miast-państw, bez zmian.
 * Gdy `requireFlowBalance` prawda (WYŁĄCZNIE gracz, ownerId===0) — FLOW-based: sama bieżąca
 * tura musi się bilansować (`computeEmpireCityFoodNadwyzka >= 0`), rezerwa nie liczy się jako
 * pokrycie — inaczej auto-podnoszenie/backstop cicho drenuje Spichlerz z tury na turę.
 * EN: target criterion for ration-level auto-adjustment. Default (requireFlowBalance false/
 * omitted) — STOCK-based: isEmpireCityFoodSolvent (accumulated reserve zapasyPrzed may cover a
 * transient local deficit) — today's AI/city-state behavior, unchanged. When requireFlowBalance
 * is true (player ONLY, ownerId===0) — FLOW-based: this turn alone must balance
 * (computeEmpireCityFoodNadwyzka >= 0), reserve does not count as coverage — otherwise
 * auto-raise/backstop silently drains the granary turn after turn.
 *
 * R-AUTO-WYZYWIENIE-KRYTERIUM-Q1=A (2026-08-13): `kosztArmii` (domyślnie 0) dodany do OBU
 * gałęzi — flow-based (gracz) liczyła dotąd samą Nadwyżkę miast, stock-based (`isEmpireCityFoodSolvent`)
 * liczyła Nadwyżkę+rezerwę, żadna nie odejmowała kosztu wojska. Efekt: kryterium mogło uznać
 * poziom Racji za "bezpieczny", mimo że w tej samej turze `advanceEmpireFood` i tak odejmie
 * `kosztArmii` od tej samej puli — rzeczywisty PRZYROST ZAPASÓW mógł wyjść ujemny mimo
 * "spełnionego" kryterium. Właściciela słowa (doprecyzowanie, ważniejsze niż litera A/B):
 * wyznacznikiem ma być rzeczywisty przyrost zapasów za turę, zawsze ≥0, NIE stan bufora.
 * EN: `kosztArmii` (default 0) added to BOTH branches — flow-based (player) only counted the
 * cities' Nadwyżka, stock-based (`isEmpireCityFoodSolvent`) counted Nadwyżka+reserve, neither
 * subtracted the army's cost. Effect: the criterion could call a ration level "safe" even though
 * `advanceEmpireFood` still subtracts `kosztArmii` from that same pool this same turn — the
 * actual stockpile net change could still come out negative despite a "met" criterion. Owner's
 * words (clarification, more important than the A/B letter): the determinant must be the actual
 * per-turn stockpile increase, always ≥0, NOT the buffer's size.
 */
function isRationBalanceTargetMet(
  zapasyPrzed: number,
  perCity: ReadonlyArray<CityFoodTickLike>,
  ownerId: number,
  requireFlowBalance?: boolean,
  kosztArmii: number = 0,
): boolean {
  if (requireFlowBalance) {
    return computeEmpireCityFoodNadwyzka(perCity, ownerId) - kosztArmii >= 0;
  }
  return isEmpireCityFoodSolvent(zapasyPrzed, perCity, ownerId, kosztArmii);
}

export interface AutoBalanceRationsOpts {
  ownerId: number;
  cities: City[];
  econ: EconomyTickResult;
  zapasyPrzed: number;
  rationParams: RationParams;
  spichlerzByCity?: ReadonlyMap<string, SpichlerzCityBonusState>;
  /** Gracz Q5=A: tylko miasta z autoWyzywienie === true. */
  onlyAutoManaged?: boolean;
  /** R-AUTO-WYZYWIENIE-CEL-BILANS-NIEUJEMNY: gracz (ownerId===0) — cel obniżania to flow tej
   * tury >=0 (`isRationBalanceTargetMet`), nie tylko stock-based pokrycie rezerwą — inaczej
   * ratchet nie znika, dopóki rezerwa nie spadnie blisko zera. WYŁĄCZNIE dla gracza; AI/miasta-
   * -państwa zostają przy dzisiejszym stock-based (pomiń/fałsz).
   * EN: player (ownerId===0) — lowering target is this turn's flow >=0
   * (isRationBalanceTargetMet), not just stock-based reserve coverage — otherwise the ratchet
   * does not disappear until the reserve nears zero. Player ONLY; AI/city-states stay
   * stock-based (omit/false). */
  requireFlowBalance?: boolean;
  /** R-AUTO-WYZYWIENIE-KRYTERIUM-Q1=A (2026-08-13): koszt żywności armii tej tury
   * (`militaryFoodConsumptionWithSpichlerz`) — odejmowany od kryterium bezpiecznego poziomu, żeby
   * PRZYROST ZAPASÓW (nie tylko bilans miast/rezerwa) był ≥0. Domyślnie 0 — kompatybilność
   * wsteczna dla wywołań, gdzie koszt armii nie jest jeszcze policzalny w danym momencie tury
   * (0 odtwarza dawne zachowanie, kryterium ignoruje wojsko dokładnie jak przed tą zmianą).
   * EN: this turn's army food cost — subtracted from the safe-level criterion so the STOCKPILE'S
   * net increase (not just cities' balance/reserve) is ≥0. Default 0 for backward compat where
   * army cost isn't computable yet at that point in the turn (0 reproduces prior behavior). */
  kosztArmii?: number;
  /** R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A własność (B) — patrz `EqualGrowthRationPlanOpts.popCapByCityId`. */
  popCapByCityId?: ReadonlyMap<string, number>;
}

/**
 * SPICH-AUTO-Q1: sprowadza poziomRacji miast właściciela do poziomu, przy którym pula po
 * dopłatach miastom (przed wojskiem) nie spada poniżej zera.
 *
 * R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A: dawniej była to pętla LOCKSTEP (krok −`WYZYWIENIE_STEP`
 * we wszystkich miastach naraz), która ZACHOWYWAŁA istniejący rozrzut poziomów — miasto
 * przyklepane wcześniej do 0,5 schodziło razem z miastem stojącym na 4, więc różnica wzrostu
 * −6% vs +4,5% trwała. Teraz kieruje nią `resolveEqualGrowthRationPlan`: wspólny poziom dla
 * wszystkich miast mogących rosnąć, przy twardym warunku „żadne miasto nie głoduje".
 * EN: was a lockstep loop that PRESERVED the existing spread of levels; now driven by the
 * equal-growth plan (one shared level, hard no-starvation constraint).
 */
export function autoBalanceRationsToSolvency(opts: AutoBalanceRationsOpts): AutoRationAdjustResult {
  const {
    ownerId, cities, econ, zapasyPrzed, rationParams, spichlerzByCity, onlyAutoManaged,
    requireFlowBalance, kosztArmii = 0,
  } = opts;
  const ownerCities = ownerCitiesForAutoAdjust(cities, ownerId, onlyAutoManaged);
  if (ownerCities.length === 0) {
    return { adjusted: false, changes: [] };
  }

  for (const c of ownerCities) ensureCityRationDefaults(c);

  const targetAlreadyMet = isRationBalanceTargetMet(
    zapasyPrzed, econ.perCity, ownerId, requireFlowBalance, kosztArmii,
  );
  const allFedAlready = simulateCityFoodAllFed(zapasyPrzed, econ.perCity, ownerId);
  if (targetAlreadyMet && allFedAlready) {
    // Bilans i brak głodu już osiągnięte — obniżanie nie ma czego naprawiać. Wyrównanie
    // W GÓRĘ należy do `autoRaiseRationsForGrowth`, nie do tej funkcji (zachowany podział ról).
    return { adjusted: false, changes: [] };
  }

  const plan = resolveEqualGrowthRationPlan({
    ownerId, cities, econ, zapasyPrzed, rationParams, spichlerzByCity,
    onlyAutoManaged, requireFlowBalance, kosztArmii, popCapByCityId: opts.popCapByCityId,
  });
  const changes = applyEqualGrowthRationPlan(
    plan, cities, ownerId, onlyAutoManaged, econ, rationParams, spichlerzByCity,
  );

  return { adjusted: changes.length > 0, changes };
}

export interface AutoRaiseRationsOpts {
  ownerId: number;
  cities: City[];
  econ: EconomyTickResult;
  zapasyPrzed: number;
  rationParams: RationParams;
  spichlerzByCity?: ReadonlyMap<string, SpichlerzCityBonusState>;
  /** Gracz (Q1=B): podnoś tylko przy trwałej nadwyżce produkcji miast; major AI — zapasy OK. */
  requireProductionSurplus?: boolean;
  /** Gracz Q5=A: tylko miasta z autoWyzywienie === true. */
  onlyAutoManaged?: boolean;
  /** R-AUTO-WYZYWIENIE-KRYTERIUM-Q1=A (2026-08-13): koszt żywności armii tej tury — patrz
   * `AutoBalanceRationsOpts.kosztArmii`, ten sam kontrakt (domyślnie 0, wsteczna kompatybilność). */
  kosztArmii?: number;
  /** R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A własność (B) — patrz `EqualGrowthRationPlanOpts.popCapByCityId`. */
  popCapByCityId?: ReadonlyMap<string, number>;
}

/**
 * Gdy Spichlerz państwa jest solvent — ustaw Wyżywienie na najwyższy WSPÓLNY poziom, na jaki
 * stać imperium przy braku głodu. Parytet SPICH-AUTO (obniżanie przy deficycie).
 * Gracz (requireProductionSurplus): tylko nadwyżka produkcji miast (Q1=B).
 * Major AI: nadwyżka lub zapasy centralne (nie magazynuj zamiast rosnąć).
 *
 * R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A: dawniej pętla LOCKSTEP podnosiła `poziomRacji` o
 * `WYZYWIENIE_STEP` we WSZYSTKICH miastach naraz i cofała krok globalnie, gdy imperium go nie
 * udźwignęło — więc miasto przyklepane wcześniej do 0/0,5 mogło wrócić DOPIERO wtedy, gdy na
 * krok stać było wszystkie miasta łącznie (zapadka: rozrzut raz powstały nie znikał). Teraz
 * funkcja nie „dokłada kroku do stanu bieżącego", tylko rozwiązuje docelowy WSPÓLNY poziom
 * (`resolveEqualGrowthRationPlan`) — dzięki temu wyrównuje w OBIE strony i jest niezależna od
 * stanu wyjściowego, więc nie ma stanu, z którego nie da się wrócić.
 * EN: was a lockstep raise-and-globally-revert ratchet (a city pinned low could only recover
 * when the WHOLE empire could afford a step). Now it solves for the target shared level, so it
 * equalizes in both directions and has no unrecoverable state.
 */
export function autoRaiseRationsForGrowth(opts: AutoRaiseRationsOpts): AutoRationAdjustResult {
  const {
    ownerId, cities, econ, zapasyPrzed, rationParams, spichlerzByCity,
    requireProductionSurplus, onlyAutoManaged, kosztArmii = 0,
  } = opts;
  const ownerCities = ownerCitiesForAutoAdjust(cities, ownerId, onlyAutoManaged);
  if (ownerCities.length === 0) {
    return { adjusted: false, changes: [] };
  }

  if (!isEmpireCityFoodSolvent(zapasyPrzed, econ.perCity, ownerId, kosztArmii)) {
    return { adjusted: false, changes: [] };
  }

  const nadwyzka = computeEmpireCityFoodNadwyzka(econ.perCity, ownerId);
  if (requireProductionSurplus) {
    // Gracz Q1=B: tylko trwała nadwyżka produkcji — zapasy Spichlerza nie uruchamiają raise.
    if (nadwyzka <= 0) {
      return { adjusted: false, changes: [] };
    }
  } else if (nadwyzka <= 0 && zapasyPrzed <= 0) {
    // Major AI: nadwyżka miast lub zapasy centralne; brak żywności = brak ruchu.
    return { adjusted: false, changes: [] };
  }

  for (const c of ownerCities) ensureCityRationDefaults(c);

  {
    // R-AUTO-WYZYWIENIE-CEL-BILANS-NIEUJEMNY (rozpoznanie #4) ZACHOWANE: dla gracza
    // (requireProductionSurplus) poziom jest akceptowalny TYLKO jeśli flow tej tury jest po nim
    // nieujemny — nie wystarczy, że skumulowana rezerwa (stock) go pokryje. Ta sama flaga jedzie
    // do planu jako `requireFlowBalance`, więc skan poziomów odrzuca dokładnie te poziomy, które
    // dawna pętla musiała cofać po fakcie. AI (requireProductionSurplus fałsz) zostaje przy
    // dawnym stock-based kryterium.
    // EN: finding #4 PRESERVED — the same flag is passed to the plan as `requireFlowBalance`, so
    // the level scan rejects exactly the levels the old loop had to roll back after the fact.
    const plan = resolveEqualGrowthRationPlan({
      ownerId, cities, econ, zapasyPrzed, rationParams, spichlerzByCity,
      onlyAutoManaged, requireFlowBalance: requireProductionSurplus, kosztArmii,
      popCapByCityId: opts.popCapByCityId,
    });
    const changes = applyEqualGrowthRationPlan(
      plan, cities, ownerId, onlyAutoManaged, econ, rationParams, spichlerzByCity,
    );
    return { adjusted: changes.length > 0, changes };
  }
}

/**
 * R-AUTO-RACJE-RAISE-Q3=A: najwyższy poziom Wyżywienia przy którym Spichlerz ≥ 0 po dopłatach
 * miastom i żadne miasto nie głoduje.
 *
 * ⚠️ R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A — TU MIESZKAŁA PRZYCZYNA odwrotnej zależności wzrostu
 * od bilansu ze zrzutu właściciela (pomiar w `runs/R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A/01-operator.md`).
 * Dawny kontrfaktyk brzmiał: „ustaw TO JEDNO miasto na `level`, POZOSTAŁE ZOSTAW GDZIE SĄ" — więc
 * funkcja odpowiadała na pytanie „jak nisko musi zejść to jedno miasto, żeby CAŁE imperium się
 * zbilansowało". Cała korekta imperium spadała na miasto, które akurat zostało odpytane jako
 * pierwsze (`main.ts` woła to w pętli po miastach i z `applyLiveSafeRationForCity` po każdym
 * przyroście ludności). Zmierzony przykład, jedno i to samo imperium, ta sama tura, flow −22:
 * maxSafe dla Sparty = 0, maxSafe dla Jin = 2 — wynik zależał od TEGO, KTÓRE MIASTO PYTA, czyli
 * od kolejności iteracji. Miasto zbite do 0 przestawało płacić za racje (DODATNI bilans lokalny)
 * i dostawało −10% wzrostu, a miasta nietknięte zostawały na 4 (ujemny bilans, dopłacany z puli)
 * z +4,5%. Stąd „miasta z nadwyżką się kurczą, miasta z deficytem rosną".
 *
 * Kontrfaktyk jest teraz SPRAWIEDLIWY: przy sprawdzaniu poziomu `level` pozostałe miasta
 * właściciela schodzą do `min(ich poziom, level)` — nikt nie jest proszony o zejście niżej niż
 * miasto, o które pytamy. Dzięki temu wynik jest ten sam dla każdego miasta o poziomie ≥ level
 * (niezależny od kolejności), a przycięcie w `main.ts` przestaje wybierać ofiarę i zaczyna
 * WYRÓWNYWAĆ. Koszt nadal rośnie monotonicznie z `level`, więc skan rosnący jest poprawny.
 * EN: the old counterfactual ("set THIS city to `level`, leave the others where they are") made a
 * single, order-dependent city absorb the entire empire-wide correction — measured: same empire,
 * same turn, maxSafe=0 for one city and 2 for another. Now the other cities drop to
 * min(theirLevel, level) in the counterfactual, so the answer is order-independent and the
 * main.ts clamp equalizes instead of picking a victim.
 */
export function maxSafePoziomRacjiForCity(opts: {
  cityId: string;
  ownerId: number;
  cities: City[];
  econ: Pick<EconomyTickResult, 'perCity'>;
  zapasyPrzed: number;
  rationParams: RationParams;
  spichlerzByCity?: ReadonlyMap<string, SpichlerzCityBonusState>;
  /** R-AUTO-WYZYWIENIE-KRYTERIUM-Q1=A (2026-08-13): koszt żywności armii tej tury — patrz
   * `AutoBalanceRationsOpts.kosztArmii`, ten sam kontrakt (domyślnie 0, wsteczna kompatybilność). */
  kosztArmii?: number;
  /** R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A własność (B) — patrz `EqualGrowthRationPlanOpts.popCapByCityId`. */
  popCapByCityId?: ReadonlyMap<string, number>;
}): PoziomRacji {
  const {
    cityId, ownerId, cities, econ, zapasyPrzed, rationParams, spichlerzByCity, kosztArmii = 0,
    popCapByCityId,
  } = opts;
  const city = cities.find(c => c.id === cityId);
  if (!city || city.ownerId !== ownerId) return WYZYWIENIE_MIN;

  ensureCityRationDefaults(city);
  const originalLevel = getCityRationLevel(city);
  const others = cities.filter(c => c.ownerId === ownerId && c.id !== cityId);
  const othersOriginal = new Map<string, PoziomRacji>();
  for (const c of others) {
    ensureCityRationDefaults(c);
    othersOriginal.set(c.id, getCityRationLevel(c));
  }
  let maxSafe = WYZYWIENIE_MIN;

  // R-AUTO-WYZYWIENIE-CEL-BILANS-NIEUJEMNY (rozpoznanie #4): backstop gracza (ownerId===0) używał
  // tych samych funkcji stock-based (simulateCityFoodCentralPool/isEmpireCityFoodSolvent) z tym
  // samym zapasyPrzed co autoRaiseRationsForGrowth — akceptował więc DOKŁADNIE to samo
  // przestrzelenie, które raise już zaaplikował, więc nie chronił przed nim wcale. Dla gracza
  // maxSafe musi być najwyższym poziomem, przy którym flow TEJ tury (nadwyzka) jest nieujemny.
  // Wszyscy dzisiejsi wywołujący tę funkcję w main.ts przekazują wyłącznie ownerId=0 (grep
  // potwierdzony w raporcie Operatora) — gate jawny na wypadek przyszłego wywołania dla AI.
  // EN: player (ownerId===0) backstop used the same stock-based helpers
  // (simulateCityFoodCentralPool/isEmpireCityFoodSolvent) with the same zapasyPrzed as
  // autoRaiseRationsForGrowth — so it accepted the EXACT overshoot raise had already applied,
  // giving no real protection. For the player maxSafe must be the highest level at which THIS
  // turn's flow (nadwyzka) is non-negative. Every current caller in main.ts passes ownerId=0 only
  // (grep-confirmed in the Operator report) — the gate is explicit for any future AI caller.
  const requireFlowBalance = ownerId === 0;

  for (const level of WYZYWIENIE_LEVELS) {
    city.poziomRacji = level;
    for (const c of others) {
      const cap = popCapByCityId?.get(c.id);
      // Miasto na limicie bierze „potrzebe", ale — tak samo jak w `resolveEqualGrowthRationPlan`
      // — nigdy wiecej niz miasta rosnace w tym kontrfaktyku.
      c.poziomRacji = (cap !== undefined && c.population >= cap)
        ? Math.min(WYZYWIENIE_POZIOM_NA_LIMICIE, level)
        : Math.min(othersOriginal.get(c.id)!, level);
    }
    recomputeCityFoodBalancesInEcon(econ.perCity, cities, rationParams, spichlerzByCity);
    const pool = simulateCityFoodCentralPool(zapasyPrzed, econ.perCity, ownerId);
    const allFed = simulateCityFoodAllFed(zapasyPrzed, econ.perCity, ownerId);
    const targetMet = isRationBalanceTargetMet(
      zapasyPrzed, econ.perCity, ownerId, requireFlowBalance, kosztArmii,
    );
    if (pool >= 0 && allFed && targetMet) {
      maxSafe = level;
    }
  }

  city.poziomRacji = originalLevel;
  for (const c of others) c.poziomRacji = othersOriginal.get(c.id)!;
  recomputeCityFoodBalancesInEcon(econ.perCity, cities, rationParams, spichlerzByCity);
  return clampPoziomRacji(maxSafe);
}

/** @deprecated PYTANIE-85 */
export function computeEmpireFoodNetDelta(
  brutto: number,
  kosztArmii: number,
  _pctRozwoj: number,
  _spichlerzCount: number,
  _params: EmpireFoodParams,
): number {
  return brutto - kosztArmii;
}

/** @deprecated PYTANIE-85 */
export function computeEmpireFoodNetDeltaFromCityFoods(
  cityFoods: ReadonlyArray<{ zywnoscNetto: number; procentRozwoj?: number }>,
  kosztArmii: number,
  _spichlerzCount: number,
  _params: EmpireFoodParams,
): number {
  let sum = 0;
  for (const c of cityFoods) sum += c.zywnoscNetto;
  return sum - kosztArmii;
}

/** @deprecated PYTANIE-85 */
export function computeEmpireFoodMaxCap(
  _spichlerzCount: number,
  params: EmpireFoodParams,
): number {
  return params.centralCapBaza;
}

/** @deprecated */
export function clampFoodSplitPct(n: number): number {
  return Math.min(100, Math.max(0, n));
}

/** @deprecated */
export function getCityFoodSplit(
  city: { procentRozwoj?: number; poziomRacji?: number },
  _defaultPct = 100,
): number {
  return city.poziomRacji !== undefined
    ? Math.round((city.poziomRacji / 6) * 100)
    : 100;
}

export {
  applyPostCentralPopulationGrowth,
  applyPostCentralPopulationGrowth as applyCentralFoodPopulationGrowth,
  type PostCentralGrowthOpts as ApplyCentralFoodGrowthOpts,
} from './population-growth-v85';
