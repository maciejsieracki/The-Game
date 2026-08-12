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
  WYZYWIENIE_LEVELS,
  WYZYWIENIE_MAX,
  WYZYWIENIE_MIN,
  WYZYWIENIE_STEP,
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

/** Czy po rozliczeniu miast Spichlerz nie jest ujemny z powodu racji (wojsko osobno). */
export function isEmpireCityFoodSolvent(
  zapasyPrzed: number,
  perCity: ReadonlyArray<CityFoodTickLike>,
  ownerId: number,
): boolean {
  return computeEmpireCityFoodNadwyzka(perCity, ownerId) + zapasyPrzed >= 0;
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
 */
function isRationBalanceTargetMet(
  zapasyPrzed: number,
  perCity: ReadonlyArray<CityFoodTickLike>,
  ownerId: number,
  requireFlowBalance?: boolean,
): boolean {
  if (requireFlowBalance) {
    return computeEmpireCityFoodNadwyzka(perCity, ownerId) >= 0;
  }
  return isEmpireCityFoodSolvent(zapasyPrzed, perCity, ownerId);
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
}

/**
 * SPICH-AUTO-Q1: obniża poziomRacji we wszystkich miastach właściciela o WYZYWIENIE_STEP,
 * aż pula po dopłatach miastom (przed wojskiem) nie spadnie poniżej zera.
 */
export function autoBalanceRationsToSolvency(opts: AutoBalanceRationsOpts): AutoRationAdjustResult {
  const {
    ownerId, cities, econ, zapasyPrzed, rationParams, spichlerzByCity, onlyAutoManaged,
    requireFlowBalance,
  } = opts;
  const ownerCities = ownerCitiesForAutoAdjust(cities, ownerId, onlyAutoManaged);
  if (ownerCities.length === 0) {
    return { adjusted: false, changes: [] };
  }

  if (isRationBalanceTargetMet(zapasyPrzed, econ.perCity, ownerId, requireFlowBalance)) {
    return { adjusted: false, changes: [] };
  }

  const oldLevels = new Map<string, PoziomRacji>();
  for (const c of ownerCities) {
    ensureCityRationDefaults(c);
    oldLevels.set(c.id, getCityRationLevel(c));
  }

  const maxSteps = Math.round((WYZYWIENIE_MAX - WYZYWIENIE_MIN) / WYZYWIENIE_STEP) + 2;
  for (let step = 0; step < maxSteps; step++) {
    if (isRationBalanceTargetMet(zapasyPrzed, econ.perCity, ownerId, requireFlowBalance)) break;

    let lowered = false;
    for (const c of ownerCities) {
      const lvl = getCityRationLevel(c);
      if (lvl > WYZYWIENIE_MIN) {
        c.poziomRacji = clampPoziomRacji(lvl - WYZYWIENIE_STEP);
        lowered = true;
      }
    }
    if (!lowered) break;

    recomputeCityFoodBalancesInEcon(econ.perCity, cities, rationParams, spichlerzByCity);
  }

  const changes: AutoRationCityChange[] = [];
  for (const c of ownerCities) {
    const oldLvl = oldLevels.get(c.id)!;
    const newLvl = getCityRationLevel(c);
    if (newLvl !== oldLvl) {
      changes.push({ cityId: c.id, name: c.name, oldLevel: oldLvl, newLevel: newLvl });
    }
  }

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
}

/**
 * Gdy Spichlerz państwa jest solvent — podnieś Wyżywienie (poziomRacji) o krok,
 * aż do max lub braku nadwyżki. Parytet SPICH-AUTO (obniżanie przy deficycie).
 * Gracz (requireProductionSurplus): tylko nadwyżka produkcji miast (Q1=B).
 * Major AI: nadwyżka lub zapasy centralne (nie magazynuj zamiast rosnąć).
 */
export function autoRaiseRationsForGrowth(opts: AutoRaiseRationsOpts): AutoRationAdjustResult {
  const {
    ownerId, cities, econ, zapasyPrzed, rationParams, spichlerzByCity,
    requireProductionSurplus, onlyAutoManaged,
  } = opts;
  const ownerCities = ownerCitiesForAutoAdjust(cities, ownerId, onlyAutoManaged);
  if (ownerCities.length === 0) {
    return { adjusted: false, changes: [] };
  }

  if (!isEmpireCityFoodSolvent(zapasyPrzed, econ.perCity, ownerId)) {
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

  const oldLevels = new Map<string, PoziomRacji>();
  for (const c of ownerCities) {
    ensureCityRationDefaults(c);
    oldLevels.set(c.id, getCityRationLevel(c));
  }

  const maxSteps = Math.round((WYZYWIENIE_MAX - WYZYWIENIE_MIN) / WYZYWIENIE_STEP) + 2;
  for (let step = 0; step < maxSteps; step++) {
    const levelsBeforeRaise = new Map<string, PoziomRacji>();
    for (const c of ownerCities) {
      levelsBeforeRaise.set(c.id, getCityRationLevel(c));
    }

    let raised = false;
    for (const c of ownerCities) {
      const lvl = getCityRationLevel(c);
      if (lvl < WYZYWIENIE_MAX) {
        c.poziomRacji = clampPoziomRacji(lvl + WYZYWIENIE_STEP);
        raised = true;
      }
    }
    if (!raised) break;

    recomputeCityFoodBalancesInEcon(econ.perCity, cities, rationParams, spichlerzByCity);

    const pool = simulateCityFoodCentralPool(zapasyPrzed, econ.perCity, ownerId);
    // R-AUTO-WYZYWIENIE-CEL-BILANS-NIEUJEMNY (rozpoznanie #4): dla gracza (requireProductionSurplus)
    // krok akceptujemy TYLKO jeśli PO nim flow tej tury jest nieujemny — nie wystarczy, że
    // skumulowana rezerwa (stock) go pokryje. Dawniej `nadwyzka<=0` po kroku był tylko `break`
    // BEZ cofnięcia — funkcja strukturalnie przestrzeliwała o jeden krok (WYZYWIENIE_STEP) ponad
    // to, co bieżąca produkcja udźwignie, cicho finansując go z rezerwy. AI (requireProductionSurplus
    // fałsz) zostaje przy dawnym stock-based kryterium (isRationBalanceTargetMet bez flagi).
    // EN: for the player (requireProductionSurplus) a step is accepted ONLY if this turn's flow
    // is non-negative after it — reserve coverage (stock) is not enough. Previously a
    // post-step nadwyzka<=0 was merely a `break` WITHOUT rollback — the function structurally
    // overshot by one step (WYZYWIENIE_STEP) beyond what current production can sustain, silently
    // financed from the reserve. AI (requireProductionSurplus false) keeps the old stock-based
    // criterion (isRationBalanceTargetMet without the flag).
    const targetMet = isRationBalanceTargetMet(zapasyPrzed, econ.perCity, ownerId, requireProductionSurplus);
    if (pool < 0 || !targetMet) {
      for (const c of ownerCities) {
        c.poziomRacji = levelsBeforeRaise.get(c.id)!;
      }
      recomputeCityFoodBalancesInEcon(econ.perCity, cities, rationParams, spichlerzByCity);
      break;
    }

    if (requireProductionSurplus && computeEmpireCityFoodNadwyzka(econ.perCity, ownerId) <= 0) break;
  }

  const changes: AutoRationCityChange[] = [];
  for (const c of ownerCities) {
    const oldLvl = oldLevels.get(c.id)!;
    const newLvl = getCityRationLevel(c);
    if (newLvl !== oldLvl) {
      changes.push({ cityId: c.id, name: c.name, oldLevel: oldLvl, newLevel: newLvl });
    }
  }

  return { adjusted: changes.length > 0, changes };
}

/** R-AUTO-RACJE-RAISE-Q3=A: najwyższy poziom Wyżywienia przy którym Spichlerz ≥ 0 po dopłatach miastom. */
export function maxSafePoziomRacjiForCity(opts: {
  cityId: string;
  ownerId: number;
  cities: City[];
  econ: Pick<EconomyTickResult, 'perCity'>;
  zapasyPrzed: number;
  rationParams: RationParams;
  spichlerzByCity?: ReadonlyMap<string, SpichlerzCityBonusState>;
}): PoziomRacji {
  const { cityId, ownerId, cities, econ, zapasyPrzed, rationParams, spichlerzByCity } = opts;
  const city = cities.find(c => c.id === cityId);
  if (!city || city.ownerId !== ownerId) return WYZYWIENIE_MIN;

  ensureCityRationDefaults(city);
  const originalLevel = getCityRationLevel(city);
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
    recomputeCityFoodBalancesInEcon(econ.perCity, cities, rationParams, spichlerzByCity);
    const pool = simulateCityFoodCentralPool(zapasyPrzed, econ.perCity, ownerId);
    const targetMet = isRationBalanceTargetMet(zapasyPrzed, econ.perCity, ownerId, requireFlowBalance);
    if (pool >= 0 && targetMet) {
      maxSafe = level;
    }
  }

  city.poziomRacji = originalLevel;
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
