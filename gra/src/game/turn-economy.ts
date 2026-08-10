/**
 * turn-economy.ts
 * Per-turn economy tick: wires the pure economy module (game/economy.ts) into
 * the runtime so that ending a turn advances each city's economy.
 *
 * Pure logic -- no DOM, no THREE, no side effects beyond mutating the City
 * objects passed in (population + magazynZywnosci).  This makes it directly
 * unit-testable (see tools/logic-test.cjs).
 *
 * Why an adapter:
 *   The runtime City (game/cities.ts) is sparse: { id, ownerId, q, r, name,
 *   population, magazynZywnosci? }.  economy.ts works on a richer EconomyCity.
 *   We map runtime -> EconomyCity each turn, run cityYieldPerTurn(), then
 *   compute local food balance (PYTANIE-85). Population growth runs centrally
 *   after advanceEmpireFood via applyCentralFoodPopulationGrowth (empire-food.ts).
 *
 * Scope (task 13B):
 *   - Real terrain-driven yields from the city centre + its 6 neighbour hexes.
 *   - Population growth / starvation: PYTANIE-85 central path (empire-food +
 *     population-growth-v85). magazynZywnosci kept for save compat only.
 *   - Aggregate per-owner yields (food / production / money / science / culture)
 *     are returned for HUD display.  There is no Player/treasury/science runtime
 *     state yet, so those streams are reported, not banked -- that is a later task.
 *   - No buildings, specialists, production queue, corruption-from-distance, AI,
 *     or trade-slider UI: those subsystems do not exist at runtime in 13B.
 *
 * EKONOMIA wpiecia (2026-06-25):
 *   WIRE 1: zdrowie -- computeCityHealth() per miasto, wchodzi do toEconomyCity().
 *   WIRE 2: splitPraca -- dziela Prace na doBudynkow/doPuli per miasto.
 *   WIRE 3: Luksus->Wealth -- advanceWealth() per miasto, mnoznik na pieniadz.
 *   WIRE 4: oblezenie -- gdy city.oblegane=true: brak dochodu zywnosci z pol,
 *           magazyn maleje o (population+garnizon)/ture, clamp do 0.
 *   WIRE 5: B5 hybryda -- split % rozwój miast (getCityFoodSplit per miasto); koszt wojska
 *           NIE schodzi z netto miasta (advanceEmpireFood + zapasy państwa).
 */

import {
  type WzrostLudnosciPace,
} from './population-growth-tempo';
import {
  applyPopulationGrowthThreshold,
  getPopulationGrowthThresholdMultiplier,
  type GameDifficulty,
} from './difficulty-cost';
import type { Hex } from '../types/hex';
import type { GameMap } from '../types/map';
import { Nakladka, TerenBazowy } from '../types/hex';
import type { GameData } from '../data/loader';
import type { City, CityPodzialHandlu, CityPodzialPracy } from './cities';
import { resolveCityPodzialHandlu } from './empire-handel-split';
import { resolveCityPodzialPracy } from './empire-city-defaults';
import {
  cityYieldPerTurn,
  civBonusyForCivKey,
  civEconomyYieldMultipliers,
  mnoznikHandelPieniadzForCivByDifficulty,
  tileYield,
  type EconParams,
  type EconomyCity,
  type WorkedTile,
  type CityYieldContext,
  type BuildingRecord,
  cityBuildingEntriesFromBuiltIds,
  corruptionRate,
  corruptionBuildingReduction,
} from './economy';
import {
  improvementKeysForHex,
  territoryResourceYieldForImprovement,
  RESOURCE_UPKEEP_IMPROVEMENT_KEYS,
  type TerritoryResourceKey,
} from './terrain-improvements';
import { cityManpowerMax, refreshManpowerAfterPopChange, tickManpowerRegen, civManpowerMults, loadManpowerRegenParams, tickManpowerUnitReplenishment, type ManpowerHealUnit } from './manpower';
import {
  loadStorageParams,
  foodStorageCapacity,
  readCityFoodBuffer,
  loadUpkeepParams,
  buildUnitUpkeepTable,
  upkeepBalance,
  totalBuildingResourceUpkeep,
  totalUnitResourceUpkeep,
  addResourceCosts,
  unitFoodPerTurn,
  loadOwnerStorageParams,
  ownerResourceCapacityPerType,
  reconcileOwnerResourceCaps,
  type UpkeepParams,
  type UnitFoodLike,
  type UnitFoodTable,
  type UnitUpkeepLike,
  type UpkeepBalance,
  type StorageParams,
  type OwnerStorageParams,
  type BuildingInstanceLike,
} from './economy-upkeep';
import {
  runConverters,
  loadThroughput,
  DEFAULT_CONVERTER_RECIPES,
  converterBuildingIdForRecipe,
  computeGarncarniaSurplusBonus,
  type RawConverterParamsJson,
} from './converters';
import {
  ownerResourceStockAll,
  ownerResourceStock,
  creditOwnerResourceStock,
  assignOwnerResourceStockFromPool,
} from './building-stock-cost';
import {
  splitPraca,
  cityPracaInteger,
  buildingLevelForEpoch,
} from './production';
import {
  builtIdsForSpichlerzYields,
  cityHasSpichlerzBuilding,
  filterRuntimeActiveBuiltIds,
  paySpichlerzDrainForCity,
  resolveSpichlerzCityBonusState,
  spichlerzArmyFoodCostMultiplier,
  spichlerzHealthBonus,
  SPICHLERZ_DRAIN_CERAMIKA_PER_TURN,
  type BuildingRuntimeGateOptions,
  type SpichlerzCityBonusState,
} from './building-resource-gate';
import {
  deductMennicaZlotoDrain,
  empireZlotoStock,
  MENNICA_ZLOTO_DRAIN_PER_TURN,
} from './zloto-access';
import {
  advanceWealth,
  loadWealthParams,
  freshWealthState,
  type WealthState,
  type WealthTickResult,
} from './wealth';
import {
  assignWorkedTiles,
  cityRangeForPopulation,
  resolveWorkedTiles,
  rebalanceWorkersAfterPopulationChange,
  reconcileAllWorkedTiles,
  hexKeysWithinRadius,
  isLandWorkableHex,
  type TileYield as OkolicaTileYield,
} from './okolica';
import { buildTerritoryNodesFromCities } from '../map/territory-work';
import { territoryOwnerAt, type TerritoryNode } from '../map/territory';
import {
  cityTradeMultiplier,
  loadReligionParams,
  type ReligionState,
} from './culture-religion';
import type { OrderYieldMults } from './order';
import {
  buildRationParams,
  computeCityRationCost,
  computeGrowthPercentV85,
  getCityRationLevel,
  type RationParams,
} from './population-growth-v85';
import { pickOsiedlePopBonus, osiedlePopLabel } from './society-breakdown';
import { hexDistance } from '../units/setup';
import { type WonderYieldBonus } from './wonders-data';

/** Stosuje mnożniki Porządku na plony (B2-Q6) — przed Wealth i splitPraca. */
function applyOrderYieldMults(
  yld: { praca: number; pieniadz: number; nauka: number; kultura: number },
  mults: OrderYieldMults,
): void {
  if (mults.productionMult !== 1) yld.praca *= mults.productionMult;
  if (mults.pieniadzMult !== 1) yld.pieniadz *= mults.pieniadzMult;
  if (mults.naukaMult !== 1) yld.nauka *= mults.naukaMult;
  if (mults.kulturaMult !== 1) yld.kultura *= mults.kulturaMult;
}

// ---------------------------------------------------------------------------
// CUDA-EKON-01 (2026-07-23): "+wonder yields" — KROK CELOWO ODDZIELNY od reszty
// ekonomii/Pracy (patrz raport C-CUDA-BONUS=A). Dolicza flat bonusy.miasto
// ukończonych cudów świata (sumWonderCityYieldsForOwner, wonders-data.ts) DO
// KAŻDEGO miasta właściciela, PO cityYieldPerTurn()/cityPracaInteger(), PRZED
// Wealth/splitPraca (traktowane jak zwykły dochód bazowy miasta — tak samo jak
// dochody z budynków). Nie modyfikuje economy.ts/cityYieldPerTurn w ogóle —
// zero konfliktu z równoległymi zmianami w formułach Pracy z terenu/ulepszeń.
// Obrona (miasto.obrona z Dur-Sharrukin/Yerkapı) NIE ma dziś odpowiednika w
// CityYieldResult (brak city-defense yield) — TODO, poza zakresem ekonomii.
function applyWonderCityYields(
  yld: { pieniadz: number; zywnosc: number; nauka: number; kultura: number; praca: number },
  bonus: Readonly<WonderYieldBonus> | undefined,
): void {
  if (!bonus) return;
  if (bonus.pieniadz) yld.pieniadz += bonus.pieniadz;
  if (bonus.zywnosc) yld.zywnosc += bonus.zywnosc;
  if (bonus.nauka) yld.nauka += bonus.nauka;
  if (bonus.kultura) yld.kultura += bonus.kultura;
  if (bonus.praca) yld.praca += bonus.praca;
  // zadowolenie: patrz society-breakdown.ts computeHappinessBreakdown (haCuda) —
  // to jest realny happiness pipeline; CityYieldResult.zadowolenie nie jest
  // dziś propagowane do CityEconomyTick (pre-istniejący dead field), więc
  // dopisywanie tu nic by nie zmieniło w rozgrywce.
}

/** Nazwa wyświetlana cywilizacji z klucza (grecy → Grecy) — pod cityTradeMultiplier. */
function civDisplayNameForKey(
  civKey: string | undefined,
  civs: GameData['civs'],
): string | null {
  if (!civKey || !civs?.cywilizacje?.length) return null;
  const key = civKey.toLowerCase();
  for (const row of civs.cywilizacje) {
    if (!row) continue;
    const ids = [row.ikonaId, (row as { typCywilizacji?: string }).typCywilizacji, row.Cywilizacja]
      .filter((s): s is string => typeof s === 'string' && s.length > 0)
      .map(s => s.toLowerCase());
    if (ids.includes(key)) return row.Cywilizacja ?? null;
  }
  return null;
}

/**
 * B-KULT-REL-Q3A — mnożnik handlu z religii (gate: Waluta + Mennica + dominująca
 * wiara). Maciej 2026-07-25 (pytanie 71/C): Mennica stoi wyłącznie w stolicy,
 * więc bramka "Mennica" tutaj musi być IMPERIUM-WIDE (czy właściciel ma Mennicę
 * GDZIEKOLWIEK), nie "w tym mieście" — spójnie z resztą Efektu 1 (patrz
 * economy.ts CityYieldContext.maMennica). Wołający liczy union po miastach raz
 * per tick i przekazuje gotowy boolean.
 */
function religionTradeWalutaOverride(
  cityReligion: ReligionState | undefined,
  ownerCivKey: string | undefined,
  maMennicaEmpireWide: boolean,
  walutaOdkryta: boolean,
  civs: GameData['civs'],
  societyParams: GameData['societyParams'],
  difficulty: Difficulty,
): number | undefined {
  if (!walutaOdkryta || !maMennicaEmpireWide || !cityReligion) return undefined;
  const civName = civDisplayNameForKey(ownerCivKey, civs);
  if (!civName) return undefined;
  const rp = loadReligionParams(societyParams, difficulty);
  const trade = cityTradeMultiplier(
    cityReligion, civName, civs as unknown as import('./culture-religion').CivsDataLike, rp, true,
  );
  return trade.applied ? trade.multiplier : undefined;
}

/**
 * Właściciele (ownerId), którzy mają Mennicę zbudowaną w KTÓRYMKOLWIEK ze swoich
 * miast -- liczone RAZ na tick (Maciej 2026-07-25, pytanie 71/C: skoro Mennica
 * stoi wyłącznie w stolicy, bramka Efektu 1 musi sprawdzać całe imperium, nie
 * "to miasto", inaczej żadne miasto poza stolicą nie dostałoby mnożnika).
 */
function ownersWithMennica(
  cities: ReadonlyArray<{ id: string; ownerId: number }>,
  builtByCity: ReadonlyMap<string, readonly string[]>,
): Set<number> {
  const owners = new Set<number>();
  for (const c of cities) {
    if ((builtByCity.get(c.id) ?? []).includes('mennica')) owners.add(c.ownerId);
  }
  return owners;
}

/**
 * Wartość Efektu 1 (mnożnik Handel netto) gdy bramka jest otwarta: override z
 * religii (dominująca wiara, patrz religionTradeWalutaOverride) ma pierwszeństwo;
 * w przeciwnym razie mnożnik CYWILIZACYJNY skalowany trudnością (Maciej
 * 2026-07-25, pytanie 69) -- ZASTĘPUJE dawną płaską regułę "2/1.5/1 dla
 * wszystkich", która żyje teraz tylko jako `fallbackScaled` dla cywilizacji bez
 * wpisu w civs.json.
 */
function resolveWalutaMnoznikOverride(
  cityReligion: ReligionState | undefined,
  ownerCivKey: string | undefined,
  maMennicaEmpireWide: boolean,
  walutaOdkryta: boolean,
  civs: GameData['civs'],
  societyParams: GameData['societyParams'],
  difficulty: Difficulty,
  fallbackScaled: number,
): number | undefined {
  const religionOverride = religionTradeWalutaOverride(
    cityReligion, ownerCivKey, maMennicaEmpireWide, walutaOdkryta, civs, societyParams, difficulty,
  );
  if (religionOverride !== undefined) return religionOverride;
  return mnoznikHandelPieniadzForCivByDifficulty(ownerCivKey, civs, difficulty, fallbackScaled);
}

// ---------------------------------------------------------------------------
// Difficulty
// ---------------------------------------------------------------------------

export type Difficulty = 'easy' | 'normal' | 'hard';

// ---------------------------------------------------------------------------
// EconParams builder
// ---------------------------------------------------------------------------

/**
 * Build the EconParams struct from the raw econ-params.json blob.
 *
 * NOTE: we deliberately do NOT call economy.loadEconParams() here.  That helper
 * reads the ASCII key `prog_wzrostu_wspolczynnik`, but the actual JSON key is
 * `og_wzrostu_wspolczynnik` (with a diacritic), so loadEconParams() throws at
 * runtime.  We read the real keys directly, with safe numeric fallbacks, so a
 * single odd key can never crash the whole turn.
 */
export function buildEconParams(data: GameData, difficulty: Difficulty = 'normal'): EconParams {
  // data.econParams is typed as a flat record by the loader, but the underlying
  // JSON is the nested { ekonomia_miasta, budynki, ... } shape that economy.ts
  // formulas were written against.  Read it back through `any` to reach both.
  const raw = data.econParams as unknown as {
    ekonomia_miasta?: Record<string, Record<string, number>>;
    budynki?: Record<string, Record<string, number>>;
    globalne?: Record<string, Record<string, number>>;
  };
  const em = raw.ekonomia_miasta ?? {};
  const bu = raw.budynki ?? {};
  const gl = raw.globalne ?? {};
  const d = difficulty;

  const num = (group: Record<string, Record<string, number>>, key: string, fallback: number): number => {
    const row = group[key];
    const v = row ? row[d] : undefined;
    return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  };

  return {
    progWzrostuWspolczynnik:        num(em, 'próg_wzrostu_wspolczynnik', 16),
    spichlerzZachowaniePoPrzroscie: num(em, 'spichlerz_zachowanie_po_wzroscie', 0.5),
    akweduktProgLudnosci:           num(em, 'akwedukt_prog_ludnosci', 5),
    spichlerzProgLudnosci:          num(em, 'spichlerz_prog_ludnosci', 8),
    akweduktMaxLudnosci:            num(em, 'akwedukt_max_ludnosci', 12),
    zywnoscZuzytkaPopulacja:        num(em, 'zywnosc_zuzytka_populacja', 1),
    zdrowieModyfikatorWspolczynnik: num(em, 'zdrowie_modyfikator_wspolczynnik', 0.05),
    korupcjaWspolczynnikDystansu:   num(em, 'korupcja_wspolczynnik_dystansu', 2),
    korupcjaWspolczynnikMiast:      num(em, 'korupcja_wspolczynnik_miast', 1),
    korupcjaCap:                    num(em, 'korupcja_cap', 50) / 100,
    budynekMlynMnoznikPracy:        num(bu, 'budynek_mlyn_mnoznik_pracy', 2),
    budynekMlynBonusPracy:          num(bu, 'budynek_mlyn_bonus_pracy', 2),
    budynekCegielniBonusPracy:      num(bu, 'budynek_cegielnia_bonus_pracy', 0.25),
    budynekTargowiskoBonusHandlu:   num(bu, 'budynek_targowisko_bonus_handlu', 0.5),
    budynekBibliotekaBonusNauki:    num(bu, 'budynek_biblioteka_bonus_nauki', 0.5),
    budynekAkademiaBonusNauki:      num(bu, 'budynek_akademia_bonus_nauki', 0.10),
    budynekGarncarniaBonusZywnosci: num(bu, 'budynek_garncarnia_bonus_zywnosci_lokalnie', 0.10),
    budynekMennicaMnoznik:          num(bu, 'budynek_mennica_mnoznik', 1),      // NIEUZYWANE 2026-07-25 (patrz economy.ts)
    mennicaMnoznikPoWalucie:        num(gl, 'mennica_mnoznik_po_walucie', 1.5), // JEDYNY mnoznik Efektu 1 (Waluta+Mennica scalone)
    walutaMnoznik:                  num(bu, 'waluta_mnoznik', 2),               // NIEUZYWANE 2026-07-25 (patrz economy.ts)
    targowiskoPracaMnoznik:         num(bu, 'targowisko_praca_na_pieniadz_mnoznik', 2),
    suwaakHandelNaukaDefault:       num(em, 'suwak_handel_nauka_domyslnie', 60),
    suwaakHandelPieniadz:           num(em, 'suwak_handel_pieniadz_domyslnie', 30),
    suwaakHandelLuksus:             num(em, 'suwak_handel_luksus_domyslnie', 10),
    suwaakPracaBudynki:             num(em, 'suwak_praca_budynki_domyslnie', 70),
    suwaakPracaTeren:               num(em, 'suwak_praca_teren_domyslnie', 30),
  };
}

// ---------------------------------------------------------------------------
// WIRE 1: Zdrowie -- parametry ze society-params.json["zdrowie"]
// ---------------------------------------------------------------------------

/**
 * Parametry zdrowia odczytane z society-params.json (sekcja "zdrowie"),
 * dla konkretnego poziomu trudnosci.
 */
interface HealthParams {
  rzeka:            number;  // bonus: miasto przy rzece
  akwedukt:         number;  // bonus: wybudowany Akwedukt
  studnia:          number;  // bonus: Studnia
  targowisko:       number;  // bonus: Targowisko
  lazniaPubliczna:  number;  // bonus: Łaźnia publiczna (PYTANIE-85-Q9)
  ceramika:         number;  // bonus: Ceramika
  /** D-START-OSIEDLE: bonus zdrowia malejący pop 1→4. */
  osiedlePopBonus:  (pop: number) => number;
  karaZagoszczenie: number;  // kara/1 pop > prog (ujemna)
  progZagoszczenia: number;  // prog populacji dla zagoszczenia
  karaBagno:        number;  // kara: bagno w okolicy (ujemna; teren 'bagno' — gdy dodany)
  bonusLas:         number;  // bonus: las (Nakladka.Las) w promieniu okolicy miasta
  karaDzungla:      number;  // rezerwa: prawdziwa dżungla (osobna nakładka — nie Las)
  karaBrakWody:     number;  // kara: brak rzeki+studni+akweduktu (ujemna)
}

/** Kontekst mapy do zdrowia: woda (D17-A) + skan okolicy (las/bagno). */
export interface CityHealthMapContext {
  city: Pick<City, 'q' | 'r' | 'population'>;
  map: GameMap;
}

interface CityVicinityTerrain {
  hasLas: boolean;
  hasBagno: boolean;
}

/** Skan heksów w promieniu okolicy miasta pod modyfikatory zdrowia terenu. */
function scanCityVicinityTerrain(ctx: CityHealthMapContext): CityVicinityTerrain {
  const radius = cityRangeForPopulation(ctx.city.population);
  let hasLas = false;
  let hasBagno = false;
  // D5: lokalna enumeracja heksów w promieniu (jak D1) zamiast skanu CAŁEJ mapy.
  // Ta funkcja leci per computeView, a computeView jest wołane w pętli po miastach
  // (panel miasta) → stary skan 320k dawał O(miasta × 320k) = kilkadziesiąt sekund na Super Huge.
  for (const key of hexKeysWithinRadius(ctx.city.q, ctx.city.r, radius, ctx.map)) {
    const hex = ctx.map.hexes[key];
    if (!hex) continue;
    if (!hasLas && hex.nakladka === Nakladka.Las) hasLas = true;
    if (!hasBagno && (hex.terenBazowy as string) === 'bagno') hasBagno = true;
    if (hasLas && hasBagno) break;
  }
  return { hasLas, hasBagno };
}

/**
 * Wczytaj HealthParams z surowego society-params.json, sekcja "zdrowie".
 * Brak wpisu lub zla wartosc -> safe fallback (normal).
 */
function loadHealthParams(
  raw: unknown,
  difficulty: Difficulty,
): HealthParams {
  const sp = raw as Record<string, unknown> | undefined;
  const zd = (sp && typeof sp === 'object' && sp['zdrowie'])
    ? sp['zdrowie'] as Record<string, Record<string, unknown>>
    : {};

  const rd = (key: string, fallback: number): number => {
    const row = zd[key];
    if (!row || typeof row !== 'object') return fallback;
    const v = row[difficulty];
    return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  };

  const progZagoszczenia = rd('zdrowie_prog_zagęszczenia', 4);
  const legacyMaleMiasto = rd('zdrowie_male_miasto_bonus', 1);

  return {
    rzeka:            rd('zdrowie_rzeka', 2),
    akwedukt:         rd('zdrowie_akwedukt', 4),
    studnia:          rd('zdrowie_studnia', 2),
    targowisko:       rd('zdrowie_targowisko', 2),
    lazniaPubliczna:  rd('zdrowie_laznia_publiczna', 5),
    ceramika:         rd('zdrowie_ceramika', 1),
    osiedlePopBonus: (pop: number) => {
      const legacy = pop <= progZagoszczenia ? legacyMaleMiasto : 0;
      return pickOsiedlePopBonus(zd, 'zdrowie_bonus_osiedle_pop', pop, difficulty, legacy);
    },
    karaZagoszczenie: rd('zdrowie_kara_zagęszczenie', -1),
    progZagoszczenia,
    karaBagno:        rd('zdrowie_kara_bagno', -1),
    bonusLas:         rd('zdrowie_bonus_las', 1),
    karaDzungla:      rd('zdrowie_kara_dzungla', -1),
    karaBrakWody:     rd('zdrowie_kara_brak_wody', -2),
  };
}

/**
 * Czy miasto ma dostęp do wody (D17-A): centrum lub sąsiad z rzeką / riverPaths.
 */
const __riverHexSetCache = new WeakMap<object, Set<string>>();
export function cityHasWaterAccess(city: Pick<City, 'q' | 'r'>, map: GameMap): boolean {
  // D6: memoizuj zbiór heksów rzek per referencja riverPaths — cityHasWaterAccess leci
  // per computeView w pętli po miastach, a odbudowa całego zbioru (alokacje stringów) za
  // każdym razem to koszt + GC na Super Huge. Cache auto-inwaliduje, gdy riverPaths się zmieni.
  const paths = map.riverPaths ?? [];
  const riverHexSet: Set<string> = __riverHexSetCache.get(paths as object) ?? (() => {
    const s = new Set<string>();
    for (const path of paths) {
      for (const h of path) s.add(`${h.q},${h.r}`);
    }
    __riverHexSetCache.set(paths as object, s);
    return s;
  })();

  function hexHasRiver(q: number, r: number): boolean {
    const hex = map.hexes[`${q},${r}`];
    if (hex?.rzeka?.obecna) return true;
    if (riverHexSet.has(`${q},${r}`)) return true;
    for (const [dq, dr] of HEX_NEIGHBORS) {
      if (riverHexSet.has(`${q + dq},${r + dr}`)) return true;
    }
    return false;
  }

  return hexHasRiver(city.q, city.r);
}

/**
 * Oblicz punkty zdrowia miasta na podstawie terenu i budynkow.
 *
 * @param ludnosc       populacja miasta
 * @param tiles         obrobione heksy miasta (centrum + sasiedzi) — legacy fallback
 * @param builtIds      id wybudowanych budynkow w miescie
 * @param hp            parametry zdrowia z society-params.json
 * @param hasWaterAccess dostęp do wody (D17-A); gdy brak — skan tiles[].maRzeke
 */
function computeCityHealth(
  ludnosc: number,
  tiles: WorkedTile[],
  builtIds: readonly string[],
  hp: HealthParams,
  hasWaterAccess?: boolean,
  mapCtx?: CityHealthMapContext,
  spichlerzZdrowieBonus = 0,
  /** U-14bA: nadwyżka Ceramiki w imperium po drain Spichlerza (tylko miasto z Garncarnią). */
  garncarniaSurplusZdrowie = 0,
): number {
  let z = 0;

  let maRzeke = hasWaterAccess === true;
  if (hasWaterAccess === undefined) {
    for (const t of tiles) {
      if (t.maRzeke) { maRzeke = true; break; }
    }
  }

  // Flagi budynkow
  const maStudnie    = builtIds.includes('studnia');
  const maTargowisko = builtIds.includes('targowisko');
  const maAkwedukt   = builtIds.includes('akwedukt');
  const maLaznia     = builtIds.includes('laznia_publiczna');

  // Bonusy
  if (maRzeke)      z += hp.rzeka;
  if (maAkwedukt)   z += hp.akwedukt;
  if (maStudnie)    z += hp.studnia;
  if (maTargowisko) z += hp.targowisko;
  if (maLaznia)     z += hp.lazniaPubliczna;

  // Bonus osiedla (pop 1–4, malejący — D-START-OSIEDLE)
  const osiedleV = hp.osiedlePopBonus(ludnosc);
  if (osiedleV) z += osiedleV;

  // Kara zagoszczenia (per dodatkowy punkt pop powyzej progu)
  if (ludnosc > hp.progZagoszczenia) {
    z += hp.karaZagoszczenie * (ludnosc - hp.progZagoszczenia);
  }

  // Kara brak wody
  if (!maRzeke && !maStudnie && !maAkwedukt) z += hp.karaBrakWody;

  // Okolica: las = bonus zdrowia; bagno = kara (gdy teren istnieje na mapie)
  if (mapCtx) {
    const vicinity = scanCityVicinityTerrain(mapCtx);
    if (vicinity.hasLas) z += hp.bonusLas;
    if (vicinity.hasBagno) z += hp.karaBagno;
  }

  if (spichlerzZdrowieBonus) z += spichlerzZdrowieBonus;
  if (garncarniaSurplusZdrowie) z += garncarniaSurplusZdrowie;

  return Math.round(z);  // zwracamy integer (pkt zdrowia)
}

/** Jedna linia rozkladu zdrowia miasta (UI panel miasta, B2-Q3). */
export interface CityHealthLine {
  label: string;
  value: number;
}

/**
 * Rozklad punktow zdrowia miasta na zrodla (+/-) — do sekcji Zdrowie w panelu miasta.
 * Logika zgodna z {@link computeCityHealth}; zwraca tez sume zaokraglona.
 */
export function computeCityHealthBreakdown(
  ludnosc: number,
  tiles: WorkedTile[],
  builtIds: readonly string[],
  societyRaw: unknown,
  difficulty: Difficulty,
  mapCtx?: CityHealthMapContext,
): { total: number; lines: CityHealthLine[] } {
  const hp = loadHealthParams(societyRaw, difficulty);
  const lines: CityHealthLine[] = [];

  const hasWaterAccess = mapCtx
    ? cityHasWaterAccess(mapCtx.city, mapCtx.map)
    : undefined;

  let maRzeke = hasWaterAccess === true;
  if (hasWaterAccess === undefined) {
    for (const t of tiles) {
      if (t.maRzeke) { maRzeke = true; break; }
    }
  }

  const maStudnie    = builtIds.includes('studnia');
  const maTargowisko = builtIds.includes('targowisko');
  const maAkwedukt   = builtIds.includes('akwedukt');
  const maLaznia     = builtIds.includes('laznia_publiczna');
  if (maRzeke)      lines.push({ label: 'Rzeka', value: hp.rzeka });
  if (maAkwedukt)   lines.push({ label: 'Akwedukt', value: hp.akwedukt });
  if (maStudnie)    lines.push({ label: 'Studnia', value: hp.studnia });
  if (maTargowisko) lines.push({ label: 'Targowisko', value: hp.targowisko });
  if (maLaznia)     lines.push({ label: 'Łaźnia publiczna', value: hp.lazniaPubliczna });

  const osiedleV = hp.osiedlePopBonus(ludnosc);
  if (osiedleV) {
    lines.push({ label: osiedlePopLabel(ludnosc), value: osiedleV });
  }
  if (ludnosc > hp.progZagoszczenia) {
    const over = ludnosc - hp.progZagoszczenia;
    lines.push({ label: `Zagęszczenie (×${over})`, value: hp.karaZagoszczenie * over });
  }

  if (!maRzeke && !maStudnie && !maAkwedukt) {
    lines.push({ label: 'Brak wody', value: hp.karaBrakWody });
  }

  if (mapCtx) {
    const vicinity = scanCityVicinityTerrain(mapCtx);
    if (vicinity.hasLas) lines.push({ label: 'Las w okolicy', value: hp.bonusLas });
    if (vicinity.hasBagno) lines.push({ label: 'Bagno w okolicy', value: hp.karaBagno });
  }

  const total = computeCityHealth(ludnosc, tiles, builtIds, hp, maRzeke, mapCtx);
  return { total, lines };
}

// ---------------------------------------------------------------------------
// Worked-tile gathering
// ---------------------------------------------------------------------------

/** Pointy-top axial neighbour offsets (matches units/setup.ts HEX_NEIGHBORS). */
const HEX_NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [+1,  0], [-1,  0], [ 0, +1], [ 0, -1], [+1, -1], [-1, +1],
];

export function hexToWorkedTile(hex: Hex & { ulepszenia?: readonly string[] | null; zloze?: string }): WorkedTile {
  const ulepszeniaKeys = improvementKeysForHex(hex);
  return {
    terenBazowy: hex.terenBazowy,
    nakladka:    hex.nakladka ?? Nakladka.Brak,
    maRzeke:     !!(hex.rzeka && hex.rzeka.obecna),
    zloze:       hex.zloze,
    ulepszenieKey: ulepszeniaKeys[0],
    ulepszeniaKeys: ulepszeniaKeys.length ? ulepszeniaKeys : undefined,
  };
}

/**
 * Tiles worked by a city in v0.1: its own centre hex plus the (up to) 6 adjacent
 * hexes that exist on the map.  Off-map / missing hexes are skipped.
 * @deprecated Uzywane przez logic-test (wsteczna zgodnosc). W logice tury uzyj cityWorkedTilesForEconomy.
 */
export function workedTilesForCity(city: City, map: GameMap): WorkedTile[] {
  const tiles: WorkedTile[] = [];
  const centre = map.hexes[`${city.q},${city.r}`];
  if (centre) tiles.push(hexToWorkedTile(centre));
  for (const [dq, dr] of HEX_NEIGHBORS) {
    const h = map.hexes[`${city.q + dq},${city.r + dr}`];
    if (h) tiles.push(hexToWorkedTile(h));
  }
  return tiles;
}

/**
 * Plony miasta (Maciej B1 / 4C):
 *   - Centrum (hex miasta) ZAWSZE daje plony z własnego terenu — bez 👤.
 *   - N = populacja = max N obywateli 👤 na otaczających heksach (suma 👤 = pop).
 *   - Razem: N+1 źródeł (centrum + N pól obok), ale tylko N slotów 👤 do ręcznego ustawienia.
 *
 * Zwraca WorkedTile[] = [centrum, ...przypisane_pola_obok].
 */
export function cityWorkedTilesForEconomy(
  city: City,
  map: GameMap,
  territoryNodes?: readonly TerritoryNode[],
): WorkedTile[] {
  const tiles: WorkedTile[] = [];

  const centreHex = map.hexes[`${city.q},${city.r}`];
  if (centreHex) tiles.push(hexToWorkedTile(centreHex));

  const pop = Math.max(0, Math.floor(city.population ?? 0));
  if (pop <= 0) return tiles;

  // Zasieg okolicy wg nowego modelu: min(pop, cap=15).
  const radius = cityRangeForPopulation(pop);

  const yieldOf = (q: number, r: number): OkolicaTileYield => {
    const h = map.hexes[`${q},${r}`];
    if (!h) return {};
    const wt = hexToWorkedTile(h);
    const y = tileYield(wt);
    return {
      zywnosc: y.zywnosc,
      praca:   y.praca,
      handel:  y.handel,
    };
  };

  // Przypisz N najlepszych pol (auto lub reczny) w zasiegu.
  // P-HEKS-ISWORKABLE-OVERLAY-VS-SILNIK-HIPOTEZA: isWorkable musi byc identyczny z
  // overlay renderowania (main.ts::okolicaHexWorkable) -- inaczej silnik przypisuje
  // (i w AUTO faktycznie wybiera) robotnikow na Gorach/Morzu, ktorych gracz nigdy
  // nie widzi jako mozliwe. W trybie recznym z NIELEGALNYM starym wpisem: filtr tu
  // powoduje ze ten wpis po prostu nie liczy sie do produkcji (bez komunikatu, bez
  // auto-naprawy danych) -- zgodnie z R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1.
  const assigned = resolveWorkedTiles(city, map, yieldOf, {
    radius,
    territoryNodes,
    ownerId: city.ownerId,
    isWorkable: (q, r) => isLandWorkableHex(map, q, r),
  });

  // Konwertuj przypisane pozycje na WorkedTile.
  for (const t of assigned) {
    const h = map.hexes[t.key];
    if (h) tiles.push(hexToWorkedTile(h));
  }

  return tiles;
}

/** Współrzędne pól obrabianych (bez centrum) — podgląd okolicy w panelu miasta. */
export function workedHexCoordsForCity(
  city: City,
  map: GameMap,
  territoryNodes?: readonly TerritoryNode[],
): Array<{ q: number; r: number }> {
  const pop = Math.max(0, Math.floor(city.population ?? 0));
  if (pop <= 0) return [];
  const radius = cityRangeForPopulation(pop);
  const yieldOf = (q: number, r: number): OkolicaTileYield => {
    const h = map.hexes[`${q},${r}`];
    if (!h) return {};
    const wt = hexToWorkedTile(h);
    const y = tileYield(wt);
    return { zywnosc: y.zywnosc, praca: y.praca, handel: y.handel };
  };
  const assigned = resolveWorkedTiles(city, map, yieldOf, {
    radius,
    territoryNodes,
    ownerId: city.ownerId,
    isWorkable: (q, r) => isLandWorkableHex(map, q, r),
  });
  return assigned.map(t => ({ q: t.q, r: t.r }));
}

// ---------------------------------------------------------------------------
// SUROW-TERYT-01 (Maciej 2026-07-23): surowce logistyczne PER ZBUDOWANE
// ULEPSZENIE w terytorium, niezaleznie od workedTiles.
// ---------------------------------------------------------------------------

/** Suma surowcow logistycznych/ture per miasto (klucz = City.id). */
export type TerritoryResourceYieldByCity = ReadonlyMap<string, Partial<Record<TerritoryResourceKey, number>>>;

/**
 * Nalicza surowce logistyczne (drewno/kamien/glina/ruda/ruda_zelaza) z KAŻDEGO
 * zbudowanego ulepszenia (tartak/kamieniolom/glinianka/kopalnia_miedzi/kopalnia)
 * leżącego w terytorium właściciela — niezależnie od tego, czy pole jest
 * obsadzone populacją (workedTiles). Argumenty Macieja (2026-07-23): złoża bywają
 * poza zasięgiem pracy miast; na starcie za mało populacji, by obsadzić
 * wszystkie ulepszenia.
 *
 * Przypisanie do miasta: heks → territoryOwnerAt (najbliższy węzeł terytorium,
 * dowolny właściciel) → jeśli to ten sam ownerId → NAJBLIŻSZE miasto TEGO
 * ownera (hexDistance). Ulepszenie poza terytorium jakiegokolwiek miasta
 * (territoryOwnerAt zwraca null) jest pomijane — nie ma właściciela.
 *
 * Żywność i Praca — BEZ ZMIAN (zostają przy workedTiles, patrz cityYieldPerTurn).
 *
 * Deterministyczne: iteracja po Object.keys(map.hexes) w kolejności wstawienia
 * (generator mapy jest deterministyczny), zero Math.random(); przy remisie
 * odległości do miasta wygrywa PIERWSZE miasto w tablicy `cities`.
 */
export function computeTerritoryResourceYieldByCity(
  cities: ReadonlyArray<Pick<City, 'id' | 'q' | 'r' | 'ownerId'>>,
  map: GameMap,
  territoryNodes: readonly TerritoryNode[],
): TerritoryResourceYieldByCity {
  const out = new Map<string, Partial<Record<TerritoryResourceKey, number>>>();
  if (!cities.length) return out;

  function nearestOwnerCityId(q: number, r: number, ownerId: number): string | null {
    let best: string | null = null;
    let bestDist = Infinity;
    for (const c of cities) {
      if (c.ownerId !== ownerId) continue;
      const d = hexDistance(q, r, c.q, c.r);
      if (d < bestDist) { bestDist = d; best = c.id; }
    }
    return best;
  }

  for (const hexKey of Object.keys(map.hexes)) {
    const hex = map.hexes[hexKey];
    if (!hex) continue;
    const impKeys = improvementKeysForHex(hex);
    if (!impKeys.length) continue;

    const { q, r } = hex.coords;
    const owner = territoryOwnerAt(q, r, territoryNodes);
    if (owner == null) continue;
    const cityId = nearestOwnerCityId(q, r, owner);
    if (!cityId) continue;

    for (const key of impKeys) {
      const yieldRow = territoryResourceYieldForImprovement(key, (hex as { zloze?: string }).zloze);
      if (!yieldRow) continue;
      const rec = out.get(cityId) ?? {};
      rec[yieldRow.resourceKey] = (rec[yieldRow.resourceKey] ?? 0) + yieldRow.amount;
      out.set(cityId, rec);
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// PYTANIE-84 R5+D2: Stolarnia — +10%/szt. na wpływie drewna z mapy (addytywnie).
// R-HEX-PLONY-MAGAZYN (Maciej 2026-07-29, B): drewno/kamień/glina z tileYield
// na KAŻDYM heksie cityWorkedTilesForEconomy (centrum + 👤) + ulepszenia
// surowiec_ilosc_tura (terrYield) addytywnie — patrz computeWorkedMagazynYieldsByCity.
// ---------------------------------------------------------------------------

/** Mnożnik wpływu drewna z mapy: 1 + bonus×liczbaStolarni (addytywnie). */
export function stolarniaDrewnoMapInflowMult(
  stolarniaCount: number,
  bonusPerBuilding: number,
): number {
  const n = Math.max(0, Math.floor(stolarniaCount));
  return 1 + bonusPerBuilding * n;
}

/** floor(baza × mnożnik Stolarnii) — wpływ do magazynu państwa z mapy. */
export function applyStolarniaDrewnoMapInflow(
  baseDrewno: number,
  stolarniaCount: number,
  bonusPerBuilding: number,
): number {
  if (!Number.isFinite(baseDrewno) || baseDrewno <= 0) return 0;
  return Math.floor(baseDrewno * stolarniaDrewnoMapInflowMult(stolarniaCount, bonusPerBuilding));
}

/** Plony magazynowe z obrabianych pól (centrum miasta + 👤) — R-HEX-PLONY-MAGAZYN B. */
export interface WorkedMagazynYield {
  drewno: number;
  kamien: number;
  glina: number;
}

const ZERO_WORKED_MAGAZYN: WorkedMagazynYield = { drewno: 0, kamien: 0, glina: 0 };

/**
 * Suma drewno/kamień/glina z tileYield na każdym heksie cityWorkedTilesForEconomy.
 * Pełne plony terenu (terrain-yields + nakładki + bonusy pól ulepszeń w tileYield),
 * BEZ surowiec_ilosc_tura (to osobno w computeTerritoryResourceYieldByCity).
 */
export function computeWorkedMagazynYieldsByCity(
  cities: ReadonlyArray<Pick<City, 'id' | 'q' | 'r' | 'ownerId' | 'population'>>,
  map: GameMap,
  territoryNodes: readonly TerritoryNode[],
): ReadonlyMap<string, WorkedMagazynYield> {
  const out = new Map<string, WorkedMagazynYield>();
  for (const city of cities) {
    const worked = cityWorkedTilesForEconomy(city as City, map, territoryNodes);
    let drewno = 0;
    let kamien = 0;
    let glina = 0;
    for (const tile of worked) {
      const y = tileYield(tile);
      drewno += y.drewno;
      kamien += y.kamien;
      glina += y.glina;
    }
    if (drewno > 0 || kamien > 0 || glina > 0) {
      out.set(city.id, { drewno, kamien, glina });
    }
  }
  return out;
}

/** @deprecated alias — użyj computeWorkedMagazynYieldsByCity().drewno */
export function computeWorkedDrewnoByCity(
  cities: ReadonlyArray<Pick<City, 'id' | 'q' | 'r' | 'ownerId' | 'population'>>,
  map: GameMap,
  territoryNodes: readonly TerritoryNode[],
): ReadonlyMap<string, number> {
  const out = new Map<string, number>();
  for (const [id, y] of computeWorkedMagazynYieldsByCity(cities, map, territoryNodes)) {
    if (y.drewno > 0) out.set(id, y.drewno);
  }
  return out;
}

// ---------------------------------------------------------------------------
// ZADANIE 1 (Maciej 2026-07-23): upkeep Pracy civ-wide za ulepszenia surowcowe.
// Wariant B: −1 Praca/turę PER OWNER (nie per-city -- płynie z globalnej puli
// produkcji cywilizacji, patrz playerPracaPool/aiPracaPoolByOwner w main.ts) za
// KAŻDE zbudowane ulepszenie z RESOURCE_UPKEEP_IMPROVEMENT_KEYS w terytorium
// właściciela. Ciągły koszt niezależny od obsadzenia pola ludnością (jak
// computeTerritoryResourceYieldByCity powyżej) — "ktoś musi obsłużyć nawet bez ludka".
// ---------------------------------------------------------------------------

/** Liczba ulepszeń płacących upkeep Pracy, per ownerId (civ-wide, nie per-city). */
export function countResourceUpkeepImprovementsByOwner(
  map: GameMap,
  territoryNodes: readonly TerritoryNode[],
): ReadonlyMap<number, number> {
  const out = new Map<number, number>();
  for (const hexKey of Object.keys(map.hexes)) {
    const hex = map.hexes[hexKey];
    if (!hex) continue;
    const impKeys = improvementKeysForHex(hex);
    if (!impKeys.length) continue;
    let n = 0;
    for (const key of impKeys) {
      if (RESOURCE_UPKEEP_IMPROVEMENT_KEYS.has(key)) n += 1;
    }
    if (n === 0) continue;
    const { q, r } = hex.coords;
    const owner = territoryOwnerAt(q, r, territoryNodes);
    if (owner == null) continue;
    out.set(owner, (out.get(owner) ?? 0) + n);
  }
  return out;
}

/** Koszt Pracy/turę/ulepszenie -- econ-params.json budynki.ulepszenie_surowcowe_upkeep_praca (placeholder=1). */
export function loadResourceImprovementUpkeepCost(
  data: GameData,
  difficulty: Difficulty,
): number {
  const raw = data.econParams as unknown as RawConverterParamsJson;
  return loadThroughput(raw, 'ulepszenie_surowcowe_upkeep_praca', difficulty, 1);
}

/**
 * Praca/turę do odjęcia z globalnej puli produkcji cywilizacji (civ-wide), per
 * ownerId, za utrzymanie ulepszeń surowcowych tej tury. Brak wpisu / 0 = brak
 * ulepszeń płatnych u tego ownera. Odejmowanie i clamp do 0 -- odpowiedzialność
 * wołającego (main.ts: playerPracaPool / aiPracaPoolByOwner), nie tego modułu.
 */
export function computePracaUpkeepByOwner(
  map: GameMap,
  territoryNodes: readonly TerritoryNode[],
  data: GameData,
  difficulty: Difficulty,
): ReadonlyMap<number, number> {
  const counts = countResourceUpkeepImprovementsByOwner(map, territoryNodes);
  const cost = loadResourceImprovementUpkeepCost(data, difficulty);
  const out = new Map<number, number>();
  for (const [owner, n] of counts) out.set(owner, n * cost);
  return out;
}

// ---------------------------------------------------------------------------
// Runtime City -> EconomyCity adapter
// ---------------------------------------------------------------------------

/**
 * Build the EconomyCity input from a sparse runtime City.
 * `czyStolica` marks the owner's first city as their capital (no corruption).
 * `zdrowie` pre-computed per-city (WIRE 1); defaults to 0 for backward compat.
 * Buildings / specialists / production queue are empty in 13B.
 */
export function toEconomyCity(
  city: City,
  params: EconParams,
  isCapital: boolean,
  zdrowie: number = 0,
  buildings: { maSpichlerz?: boolean; maSpichlerzII?: boolean; maAkwedukt?: boolean } = {},
  ownerDefaultPodzial?: CityPodzialHandlu,
  ownerDefaultPodzialPracy?: CityPodzialPracy,
): EconomyCity {
  const paramsFallback: CityPodzialHandlu = {
    procentNauka:    params.suwaakHandelNaukaDefault,
    procentPieniadz: params.suwaakHandelPieniadz,
    procentLuksus:   params.suwaakHandelLuksus,
  };
  const pracaParamsFallback: CityPodzialPracy = {
    procentBudynki: params.suwaakPracaBudynki,
  };
  return {
    id:              city.id,
    ludnosc:         city.population,
    zdrowie,
    czyStolica:      isCapital,
  maSpichlerz:     buildings.maSpichlerz ?? false,
  maSpichlerzII:   buildings.maSpichlerzII ?? false,
  maAkwedukt:      buildings.maAkwedukt ?? false,
    magazynZywnosci: readCityFoodBufferFromCity(city),
    specjalisci:     [],
    kolejkaProdukcji: [],
    podziałHandlu: resolveCityPodzialHandlu(city, ownerDefaultPodzial, paramsFallback),
    // R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE=A (Maciej 2026-08-09): global/override
    // wzorem podziałHandlu (empire-city-defaults.ts resolveCityPodzialPracy).
    podziałPracy: resolveCityPodzialPracy(city, ownerDefaultPodzialPracy, pracaParamsFallback),
  };
}

// ---------------------------------------------------------------------------
// WIRE 4: Oblezenie -- accessor + logika zegara glodu
// ---------------------------------------------------------------------------

/**
 * Bufor wzrostu (magazynZywnosci) — skalar >= 0 (patrz readCityFoodBuffer w economy-upkeep).
 */
export function readCityFoodBufferFromCity(city: Pick<City, 'magazynZywnosci'>): number {
  return readCityFoodBuffer(city.magazynZywnosci);
}

/** Próg bufora wzrostu: (20 + N × wsp.) × tempo kreatora × asymetria trudności. */
export function growthFoodThreshold(
  population: number,
  params: EconParams,
  pace: WzrostLudnosciPace = 'wysoki',
  ownerId: number = 0,
  difficulty: GameDifficulty = 'normal',
): number {
  const base = 20 + population * params.progWzrostuWspolczynnik; // Próg wzrostu — wartości finalne (baza 20, wsp. w econ-params)
  return applyPopulationGrowthThreshold(base, ownerId, pace, difficulty);
}

/**
 * Pojemność bufora wzrostu — co najmniej próg wzrostu, żeby cap < próg
 * nie blokował wzrostu przy małym napływie żywności/turę.
 */
export function growthFoodStorageCap(
  population: number,
  maSpichlerz: boolean,
  params: EconParams,
  storageParams: StorageParams,
  pace: WzrostLudnosciPace = 'wysoki',
  ownerId: number = 0,
  difficulty: GameDifficulty = 'normal',
): number {
  const base = foodStorageCapacity(maSpichlerz, storageParams);
  return Math.max(base, growthFoodThreshold(population, params, pace, ownerId, difficulty));
}

/**
 * getCityFood -- zwraca biezacy zapas zywnosci miasta.
 * Pole magazynZywnosci na runtime City jest skalarem (number | undefined).
 * Brak pola = magazyn pusty (0).
 *
 * Uzycie przez UNITS/SILNIK: getCityFood(city) zamiast city.magazynZywnosci ?? 0.
 */
export function getCityFood(city: City): number {
  return readCityFoodBufferFromCity(city);
}

// ---------------------------------------------------------------------------
// Per-turn tick
// ---------------------------------------------------------------------------

/** Result for a single city after one economy tick. */
export interface CityEconomyTick {
  cityId:         string;
  ownerId:        number;
  praca:          number;
  pieniadz:       number;  // po mnozniku Wealth (strumien do skarbca gracza)
  pieniadzBrutto: number;  // pieniadz przed mnoznikiem Wealth (z economy.ts)
  zywnoscNetto:   number;
  nauka:          number;
  luksus:         number;
  kultura:        number;
  ludnoscPrzed:   number;
  ludnoscPo:      number;
  wzrost:         boolean;
  ubytek:         boolean;
  zdrowie:        number;          // WIRE 1: obliczone zdrowie miasta
  doBudynkow:     number;          // WIRE 2: czesc Pracy na kolejke budynkow
  doPuli:         number;          // WIRE 2: czesc Pracy do puli globalnej
  wealthMnoznik:  number;          // WIRE 3: mnoznik podatku z Wealth
  wealthZadowolenie: number;       // WIRE 3: wklad do zadowolenia
  /** R7-C: nadwyżka Ceramiki po Spichlerzu → +Zadowolenie (miasto z Garncarnią). */
  garncarniaSurplusZadowolenie?: number;
  pieniadzZPracy: number;          // Efekt 2: doPuli*targowiskoPracaMnoznik (0 bez Targowiska/Waluty)
  /**
   * Handel E3: dochod dystansowy z tras handlowych dotykajacych to miasto
   * (trade-routes.ts computeTradeRouteIncomeByCity) -- juz WLICZONY w `pieniadz`
   * powyzej (dodany PO mnozniku Wealth, wiec "czysto" do skarbca), a tutaj
   * wystawiony osobno wylacznie do rozbicia w UI. 0 gdy miasto nie ma tras.
   */
  pieniadzZTras: number;
  // WIRE 4: oblezenie
  oblegany:       boolean;         // czy miasto bylo oblegane w tej turze
  obleganyGlod:   boolean;         // true gdy magazyn osiagnal 0 (ryzyko kapitulacji)
  magazynPoTurze: number;          // stan bufora wzrostu (magazynZywnosci) po turze
  /** B5-SPICH: miasto ma wybudowany Spichlerz (wpływa na zapasy państwa imperium). */
  maSpichlerz:    boolean;
  /** B-SPIC: tier II — cap 150, bufor 70%. */
  maSpichlerzII?: boolean;
  /** PYTANIE-84 U-5: tor Ceramiki aktywny w tym mieście (drain B6/B8). */
  spichlerzCeramika?: boolean;
  /** PYTANIE-84 U-5: tor Soli aktywny w tym mieście (drain B7). */
  spichlerzSol?: boolean;
  /** @deprecated PYTANIE-85 — suwak zastąpiony racjami. */
  procentRozwoj?: number;
  /** PYTANIE-85: produkcja brutto (teren + budynki). */
  zywnoscBrutto?: number;
  /** PYTANIE-85: koszt racji (pop × żywność/rację). */
  kosztRacji?: number;
  /** PYTANIE-85: bilans lokalny = brutto − racje. */
  bilansLokalny?: number;
  /** PYTANIE-85: poziom racji 1|2|3. */
  poziomRacji?: number;
  /** PYTANIE-85: łączny WZROST% (szacunek bez Szczęścia jeśli brak). */
  wzrostProcent?: number;
  /** PYTANIE-85: ułamkowy bufor wzrostu po turze. */
  wzrostUlamkowyPo?: number;
}

/** Aggregate of one full economy tick across all processed cities. */
export interface EconomyTickResult {
  perCity:        CityEconomyTick[];
  cities:         number;
  totalPraca:     number;
  totalPieniadz:  number;   // suma po mnoznikach Wealth
  totalNauka:     number;
  totalLuksus:    number;
  totalKultura:   number;
  totalZywnosc:   number;
  totalPracaPula: number;   // WIRE 2: suma doPuli ze wszystkich miast
  growth:         number;   // cities that grew this turn
  starved:        number;   // cities that lost population this turn
  /** Per-owner upkeep balance (buildings + units). Keyed by ownerId. */
  upkeepByOwner:  Map<number, UpkeepBalance>;
  /** Per-owner building resource upkeep (1/turę per koszt_surowce type). Keyed by ownerId. */
  resourceUpkeepByOwner: Map<number, Record<string, number>>;
  /**
   * ZADANIE 1 (Maciej 2026-07-23): Praca/turę do odjęcia z globalnej puli
   * produkcji cywilizacji (civ-wide -- playerPracaPool/aiPracaPoolByOwner w
   * main.ts) za utrzymanie ulepszeń surowcowych. Keyed by ownerId; brak wpisu = 0.
   * Silnik (turn-economy.ts) tylko OBLICZA -- odjęcie + clamp do 0 robi main.ts,
   * bo tylko tam istnieje realna pula Pracy (nie ma jej na City/EconomyTickResult).
   */
  pracaUpkeepByOwner: ReadonlyMap<number, number>;
}

export interface OwnerEconomySum {
  pieniadz: number;
  nauka: number;
  doPuli: number;
  praca: number;
  kultura: number;
  /** Handel E3: podzbior `pieniadz` pochodzacy z dochodu dystansowego tras (rozbicie UI). */
  pieniadzZTras: number;
}

/** Sum per-city tick yields for one owner (HUD / treasury — not econ.total*). */
export function sumEconomyForOwner(
  result: Pick<EconomyTickResult, 'perCity'>,
  ownerId: number,
): OwnerEconomySum {
  let pieniadz = 0;
  let nauka = 0;
  let doPuli = 0;
  let praca = 0;
  let kultura = 0;
  let pieniadzZTras = 0;
  for (const tk of result.perCity) {
    if (tk.ownerId !== ownerId) continue;
    pieniadz += tk.pieniadz;
    nauka += tk.nauka;
    doPuli += tk.doPuli;
    praca += tk.praca;
    kultura += tk.kultura;
    pieniadzZTras += tk.pieniadzZTras;
  }
  return { pieniadz, nauka, doPuli, praca, kultura, pieniadzZTras };
}

/**
 * HUD gracza — suma tylko z miast obecnych w `cities` (ownerId 0).
 * Bezpieczniejsze niż sam ownerId w ticku (ochrona przed starymi save / rozjazdem).
 */
export function sumEconomyForPlayerCities(
  result: Pick<EconomyTickResult, 'perCity'>,
  cities: ReadonlyArray<{ id: string; ownerId: number }>,
): OwnerEconomySum {
  const playerCityIds = new Set(
    cities.filter(c => c.ownerId === 0).map(c => c.id),
  );
  let pieniadz = 0;
  let nauka = 0;
  let doPuli = 0;
  let praca = 0;
  let kultura = 0;
  let pieniadzZTras = 0;
  for (const tk of result.perCity) {
    if (!playerCityIds.has(tk.cityId)) continue;
    pieniadz += tk.pieniadz;
    nauka += tk.nauka;
    doPuli += tk.doPuli;
    praca += tk.praca;
    kultura += tk.kultura;
    pieniadzZTras += tk.pieniadzZTras;
  }
  return { pieniadz, nauka, doPuli, praca, kultura, pieniadzZTras };
}

/**
 * SUROW-CIV-01 (Maciej 2026-07-24) -- czysty getter civ-wide capu surowca dla JEDNEGO
 * ownera, przeznaczony dla wywolujacych spoza advanceCityEconomy (UI licznik imperium,
 * przyszly handel/dyplomacja -- patrz komentarz w building-stock-cost.ts). Liczy Magazyny
 * ownera z builtByCity, wczytuje te same parametry co advanceCityEconomy.
 *
 * OWNERID-AGNOSTIC: formula identyczna dla gracza (ownerId=0) i kazdej cywilizacji AI --
 * jedyna zmienna to FAKTYCZNA liczba Magazynow tego konkretnego ownera.
 *
 * Zapas (stock) per typ: patrz ownerResourceStock / ownerResourceStockAll w
 * game/building-stock-cost.ts (dziala na tym samym `cities`, bez potrzeby builtByCity).
 */
export function ownerResourceCap(
  cities: ReadonlyArray<{ id: string; ownerId: number }>,
  builtByCity: ReadonlyMap<string, readonly string[]>,
  ownerId: number,
  data: GameData,
  difficulty: Difficulty = 'normal',
): number {
  let magazynCount = 0;
  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    if ((builtByCity.get(c.id) ?? []).includes('magazyn')) magazynCount++;
  }
  const rawEconParams = data.econParams as unknown as Parameters<typeof loadOwnerStorageParams>[0];
  const params = loadOwnerStorageParams(rawEconParams, difficulty);
  return ownerResourceCapacityPerType(magazynCount, params);
}

/**
 * Advance the economy for every city by one turn.
 *
 * For each city this:
 *   1. Adapts the runtime City -> EconomyCity (with computed health WIRE 1).
 *   2. Computes per-turn yields from worked terrain (cityYieldPerTurn).
 *   3. Applies Wealth tick per city: luksus -> advanceWealth -> mnoznik (WIRE 3).
 *   4. Applies splitPraca: splits Praca into doBudynkow/doPuli (WIRE 2).
 *   5. Applies growthMult (7.4): scales food inflow before populationGrowth.
 *   6. WIRE 4 -- oblezenie: gdy city.oblegane=true pomija dochod zywnosci z pol,
 *      odejmuje (population+garnizon) od magazynu, clamp do 0, brak wzrostu populacji.
 *      Gdy city.oblegane=false/undefined -- zachowanie BEZ ZMIAN (pelna compat).
 *   7. Applies population growth/starvation from net food (populationGrowth).
 *   8. Writes population + magazynZywnosci back onto the runtime City.
 *
 * Mutates the City objects in `cities` (population, magazynZywnosci, wealthState).
 * Returns the aggregate for the HUD.
 *
 * @param cities          runtime cities (mutated in place)
 * @param map             world map (read-only)
 * @param data            loaded game data (econ params, society params)
 * @param difficulty      difficulty level (default 'normal')
 * @param econUnits       units for food/upkeep accounting
 * @param growthMultByCity optional growthMult map from order.ts (order lane)
 * @param orderMultByCity optional yield mults from order.ts (B2-Q6; następna tura jak growthMult)
 * @param builtByCity     optional map cityId->string[] of built building ids
 * @param playerEra       current era of the player (for Wealth cap/prog)
 * @param ownerCivByOwnerId optional map ownerId -> civ key (ikonaId); enables per-cyw Handel->Pieniadz mnoznik
 */
/** Minimal unit info needed by the economy tick for food/upkeep accounting. */
export interface EconUnit {
  ownerId: number;
  typeId:  string;
  camping: boolean;
  /** C-GLOD-Q2=B (Maciej 2026-07-26): true = unit stoi na WŁASNYM terytorium
   *  (mnożnik zużycia żywności x1,0), false = poza (x2,0). Brak pola = domyślnie
   *  własne terytorium -- patrz UnitFoodLike w economy-upkeep.ts. */
  onOwnTerritory?: boolean;
}

export type OwnerEraResolver = (ownerId: number) => number;
export type OwnerTechResolver = (ownerId: number) => ReadonlySet<string>;
/**
 * PYTANIE 83=B (Maciej 2026-07-25) + PYTANIE-77-DOP=B (2026-07-27): dostęp do złota
 * per owner — wołający liczy TO RAZ PER OWNER PER TICK (memoizowany resolver),
 * łącząc dostęp natywny ORAZ grant handlowy ORAZ łaskę 1 tury po utracie
 * (mennica-zloto-grace.ts / main.ts prepareMennicaZlotoGraceForTick).
 */
export type OwnerZlotoAccessResolver = (ownerId: number) => boolean;

/** PYTANIE-84: aktywne etykiety surowców imperium (źródła terenowe + granty handlowe). */
export type OwnerActiveLabelsResolver = (ownerId: number) => readonly string[];

/** PYTANIE-84: suma City.surowce po imperium (magazyn państwa per typ). */
export type OwnerEmpireStockResolver = (ownerId: number) => Readonly<Record<string, number>>;

/** PYTANIE-84 U-10: ostatni tick — bonus wojska z Soli (≥1 Spichlerz II płaci). */
let _spichlerzSolArmyByOwner = new Map<number, boolean>();
/** Miasta z aktywną Solią w tym ticku (garnizon ½ żywności U-10B). */
let _spichlerzSolCityIdsByOwner = new Map<number, ReadonlySet<string>>();

export function spichlerzSolArmyBonusActive(ownerId: number): boolean {
  return _spichlerzSolArmyByOwner.get(ownerId) ?? false;
}

export function spichlerzSolPayingCityIds(ownerId: number): ReadonlySet<string> {
  return _spichlerzSolCityIdsByOwner.get(ownerId) ?? new Set<string>();
}

/**
 * Koszt żywności armii z mnożnikami Spichlerza II / Sól (U-10B).
 * Wołający musi przekazać inGarnizon + garrisonCityId na jednostkach garnizonu.
 */
export function militaryFoodConsumptionWithSpichlerz(
  units: ReadonlyArray<EconUnit & { inGarnizon?: boolean; garrisonCityId?: string }>,
  ownerId: number,
  upkeep: UpkeepParams,
  foodTable: UnitFoodTable = {},
  opts?: {
    solArmyOverride?: boolean;
    solCityIdsOverride?: ReadonlySet<string>;
  },
): number {
  const solArmy = opts?.solArmyOverride ?? spichlerzSolArmyBonusActive(ownerId);
  const solCities = opts?.solCityIdsOverride ?? spichlerzSolPayingCityIds(ownerId);
  let sum = 0;
  for (const u of units) {
    if (u.ownerId !== ownerId) continue;
    const base = unitFoodPerTurn(u, upkeep, foodTable);
    const mult = spichlerzArmyFoodCostMultiplier({
      solArmyBonusActive: solArmy,
      onOwnTerritory: u.onOwnTerritory ?? true,
      isGarrisonInSolCity: !!(u.inGarnizon && u.garrisonCityId && solCities.has(u.garrisonCityId)),
    });
    sum += base * mult;
  }
  return sum;
}

function resolveSpichlerzForCity(
  cities: ReadonlyArray<City>,
  ownerId: number,
  builtIds: readonly string[],
  dryRun: boolean,
): SpichlerzCityBonusState {
  const drain = paySpichlerzDrainForCity(cities, ownerId, builtIds, dryRun);
  return resolveSpichlerzCityBonusState(builtIds, drain);
}

/** Symulacja puli Ceramiki po drainach Spichlerzy w imperium (dry-run, bez mutacji). */
function simulateCeramikaAfterSpichlerzDrains(
  cities: ReadonlyArray<City>,
  ownerId: number,
  builtByCity: ReadonlyMap<string, readonly string[]>,
): number {
  let ceramika = ownerResourceStock(cities, ownerId, 'ceramika');
  for (const city of cities) {
    if (city.ownerId !== ownerId) continue;
    const builtIds = builtByCity.get(city.id) ?? [];
    const hasSpichlerz = cityHasSpichlerzBuilding(builtIds);
    if (hasSpichlerz && ceramika >= SPICHLERZ_DRAIN_CERAMIKA_PER_TURN) {
      ceramika -= SPICHLERZ_DRAIN_CERAMIKA_PER_TURN;
    }
  }
  return ceramika;
}

/** U-14bA / R7-C: +Zadowolenie z nadwyżki Ceramiki po drain Spichlerza (per owner, miasto z Garncarnią). */
export function computeGarncarniaSurplusZadowolenieByOwner(
  cities: ReadonlyArray<City>,
  builtByCity: ReadonlyMap<string, readonly string[]>,
  /** true po tickEmpireResourcePipeline (drain już w puli); false w podglądzie HUD. */
  stockAlreadyDrained = false,
): Map<number, number> {
  const out = new Map<number, number>();
  const ownerIds = new Set(cities.map(c => c.ownerId));
  for (const ownerId of ownerIds) {
    let maGarncarnie = false;
    for (const city of cities) {
      if (city.ownerId !== ownerId) continue;
      if ((builtByCity.get(city.id) ?? []).includes('garncarnia')) {
        maGarncarnie = true;
        break;
      }
    }
    const ceramikaAfter = stockAlreadyDrained
      ? ownerResourceStock(cities, ownerId, 'ceramika')
      : simulateCeramikaAfterSpichlerzDrains(cities, ownerId, builtByCity);
    const { zadowolenieBonus } = computeGarncarniaSurplusBonus({
      ceramikaPoDrainSpichlerza: ceramikaAfter,
      maGarncarnie,
      efekt: 'zadowolenie',
      zadowolenieNaSztuke: 1,
    });
    out.set(ownerId, zadowolenieBonus);
  }
  return out;
}

/** PYTANIE-85: bilans żywności miasta (brutto − racje). */
export function computeCityFoodBalanceV85(
  zywnoscBrutto: number,
  population: number,
  city: Pick<City, 'poziomRacji' | 'procentRozwoj'>,
  rationParams: RationParams,
  spichlerzState?: SpichlerzCityBonusState,
): { kosztRacji: number; bilansLokalny: number; poziomRacji: number } {
  const poziomRacji = getCityRationLevel(city);
  const kosztRacji = computeCityRationCost(
    population,
    poziomRacji,
    rationParams,
    spichlerzState,
  );
  return {
    kosztRacji,
    bilansLokalny: zywnoscBrutto - kosztRacji,
    poziomRacji,
  };
}

/** SPICH-AUTO-Q1: przelicz koszt racji / bilans lokalny po zmianie poziomRacji (bez pełnego ticku). */
export function recomputeCityFoodBalancesInEcon(
  perCity: CityEconomyTick[],
  cities: City[],
  rationParams: RationParams,
  spichlerzByCity?: ReadonlyMap<string, SpichlerzCityBonusState>,
): void {
  const cityById = new Map(cities.map(c => [c.id, c]));
  for (const tick of perCity) {
    const city = cityById.get(tick.cityId);
    if (!city) continue;
    const spichlerz = spichlerzByCity?.get(tick.cityId) ?? {
      ceramikaActive: tick.spichlerzCeramika ?? false,
      solActive: tick.spichlerzSol ?? false,
      maSpichlerzPop: tick.maSpichlerz ?? false,
      maSpichlerzIIPop: tick.maSpichlerzII ?? false,
    };
    const produkcja = tick.zywnoscBrutto
      ?? Math.max(0, (tick.zywnoscNetto ?? 0) + (tick.kosztRacji ?? 0));
    const foodBal = computeCityFoodBalanceV85(
      produkcja,
      city.population,
      city,
      rationParams,
      spichlerz,
    );
    tick.kosztRacji = foodBal.kosztRacji;
    tick.bilansLokalny = foodBal.bilansLokalny;
    tick.zywnoscNetto = foodBal.bilansLokalny;
    tick.poziomRacji = foodBal.poziomRacji;
  }
}

/** Odśwież totalZywnosc w wyniku ticku po zmianie bilansów lokalnych. */
export function refreshEconomyFoodTotals(result: EconomyTickResult): void {
  let total = 0;
  for (const tick of result.perCity) {
    total += tick.bilansLokalny ?? tick.zywnoscNetto ?? 0;
  }
  result.totalZywnosc = total;
}

function runtimeActiveBuiltIdsForCity(
  builtIds: readonly string[],
  ownerId: number,
  resolveOwnerActiveLabels: OwnerActiveLabelsResolver | undefined,
  resolveOwnerEmpireStock: OwnerEmpireStockResolver | undefined,
  resolveOwnerZlotoAccess: OwnerZlotoAccessResolver | undefined,
  empireStockOverride?: Readonly<Record<string, number>>,
): readonly string[] {
  if (!resolveOwnerActiveLabels) return builtIds;
  const gateOptions: BuildingRuntimeGateOptions = {
    ownerId,
    resolveOwnerZlotoAccess,
  };
  return filterRuntimeActiveBuiltIds(
    builtIds,
    resolveOwnerActiveLabels(ownerId),
    empireStockOverride ?? resolveOwnerEmpireStock?.(ownerId),
    gateOptions,
  );
}

/**
 * PYTANIE-84 R1/R2/R3/Q5 — rdzeń magazynu państwa (przed plonami miast, po reconcile cap z poprzedniej tury):
 *   (1) wpływ z mapy → pula imperium (Stolarnia/Warsztat mnożą drewno/kamień — D2);
 *   (2) konwertery / odlewnie czytają i zapisują wspólną pulę (ownerResourceStockAll);
 *   (3) Spichlerz drain B6/B7/B8 (U-5/U-11) — przed plonami tej tury (R2).
 *
 * HANDOFF main.ts: wołający advanceCityEconomy bez zmian — pipeline wewnątrz ticku.
 */
function tickEmpireResourcePipeline(
  cities: City[],
  builtByCity: ReadonlyMap<string, readonly string[]>,
  territoryResourceByCity: TerritoryResourceYieldByCity,
  workedMagazynByCity: ReadonlyMap<string, WorkedMagazynYield>,
  stolarniaCountByOwner: ReadonlyMap<number, number>,
  kamieniarskiCountByOwner: ReadonlyMap<number, number>,
  stolarniaBonusDrewnaCiv: number,
  kamieniarskiBonusKamieniaCiv: number,
  converterThroughputs: Record<string, number>,
  ownerResourceCapFor: (ownerId: number) => number,
  resolveOwnerActiveLabels?: OwnerActiveLabelsResolver,
  resolveOwnerZlotoAccess?: OwnerZlotoAccessResolver,
): Map<string, SpichlerzCityBonusState> {
  const ownerIds = new Set(cities.map(c => c.ownerId));

  // Faza 1 (R2): wpływ z mapy do magazynu państwa — przed konwerterami.
  for (const city of cities) {
    const terrYield = territoryResourceByCity.get(city.id);
    const worked = workedMagazynByCity.get(city.id) ?? ZERO_WORKED_MAGAZYN;
    const ownerId = city.ownerId;
    const cap = ownerResourceCapFor(ownerId);
    const stolarniaCount = stolarniaCountByOwner.get(ownerId) ?? 0;
    const kamienMult = 1 + kamieniarskiBonusKamieniaCiv * (kamieniarskiCountByOwner.get(ownerId) ?? 0);

    const creditTerritory = (key: TerritoryResourceKey, raw: number | undefined, mult = 1): void => {
      if (raw == null || !(raw > 0)) return;
      creditOwnerResourceStock(cities, ownerId, key, Math.floor(raw * mult), cap);
    };

    // R-HEX-PLONY-MAGAZYN B: ulepszenie (terrYield) + plony terenu z 👤 (worked) addytywnie.
    const drewnoMapBase = (terrYield?.drewno ?? 0) + worked.drewno;
    const drewnoCredit = applyStolarniaDrewnoMapInflow(
      drewnoMapBase,
      stolarniaCount,
      stolarniaBonusDrewnaCiv,
    );
    if (drewnoCredit > 0) {
      creditOwnerResourceStock(cities, ownerId, 'drewno', drewnoCredit, cap);
    }

    const kamienMapBase = (terrYield?.kamien ?? 0) + worked.kamien;
    creditTerritory('kamien', kamienMapBase, kamienMult);

    const glinaMapBase = (terrYield?.glina ?? 0) + worked.glina;
    creditTerritory('glina', glinaMapBase);

    if (!terrYield) continue;
    creditTerritory('ruda', terrYield.ruda);
    creditTerritory('ruda_zelaza', terrYield.ruda_zelaza);
    creditTerritory('sol', terrYield.sol);
    creditTerritory('zloto', terrYield.zloto);
    creditTerritory('kon', terrYield.kon);
  }

  // Faza 2 (R2/Q5): budynki przetwórcze / odlewnie ze skarbca państwa (R3=B).
  for (const ownerId of ownerIds) {
    const cap = ownerResourceCapFor(ownerId);
    let pool: Record<string, number> = { ...ownerResourceStockAll(cities, ownerId) };

    for (const city of cities) {
      if (city.ownerId !== ownerId) continue;
      const builtIds = builtByCity.get(city.id) ?? [];
      const runtimeBuiltIds = runtimeActiveBuiltIdsForCity(
        builtIds,
        ownerId,
        resolveOwnerActiveLabels,
        undefined,
        resolveOwnerZlotoAccess,
        pool,
      );
      const activeRecipes = DEFAULT_CONVERTER_RECIPES.filter(r =>
        runtimeBuiltIds.includes(converterBuildingIdForRecipe(r)),
      );
      if (activeRecipes.length === 0) continue;

      const convResult = runConverters(
        activeRecipes,
        pool,
        converterThroughputs,
        () => cap,
      );
      pool = convResult.stores;
    }

    assignOwnerResourceStockFromPool(cities, ownerId, pool);
  }

  // Faza 3 (PYTANIE-84 U-5/U-10/U-11): drain Spichlerza ze skarbca po świeżej produkcji/konwersji.
  const spichlerzByCity = new Map<string, SpichlerzCityBonusState>();
  _spichlerzSolArmyByOwner.clear();
  _spichlerzSolCityIdsByOwner.clear();
  for (const city of cities) {
    const builtIds = builtByCity.get(city.id) ?? [];
    const drain = paySpichlerzDrainForCity(cities, city.ownerId, builtIds, false);
    const state = resolveSpichlerzCityBonusState(builtIds, drain);
    spichlerzByCity.set(city.id, state);
    if (state.solActive) {
      _spichlerzSolArmyByOwner.set(city.ownerId, true);
      const prev = new Set(_spichlerzSolCityIdsByOwner.get(city.ownerId) ?? []);
      prev.add(city.id);
      _spichlerzSolCityIdsByOwner.set(city.ownerId, prev);
    }
  }
  return spichlerzByCity;
}

/**
 * PYTANIE-84-U-13: po plonach miast (mnożnik Mennicy już policzony) — pobierz 1 Złoto/t
 * ze skarbca państwa. Tura łaski (grace): efekt bez zużycia, gdy brak zapasu w puli.
 */
function applyMennicaZlotoDrainForOwners(
  cities: City[],
  mennicaOwners: ReadonlySet<number>,
  resolveOwnerTech: OwnerTechResolver | undefined,
  playerZbadane: ReadonlySet<string>,
  resolveOwnerZlotoAccess: OwnerZlotoAccessResolver,
): void {
  for (const ownerId of mennicaOwners) {
    const ownerTech = resolveOwnerTech ? resolveOwnerTech(ownerId) : playerZbadane;
    const walutaOdkryta = ownerTech.has('Waluta') || ownerTech.has('waluta');
    if (!walutaOdkryta) continue;
    if (!resolveOwnerZlotoAccess(ownerId)) continue;
    const pool = ownerResourceStockAll(cities, ownerId);
    if (empireZlotoStock(pool) < MENNICA_ZLOTO_DRAIN_PER_TURN) continue;
    assignOwnerResourceStockFromPool(cities, ownerId, deductMennicaZlotoDrain(pool));
  }
}

/**
 * Live preview of per-city yields — same formulas as advanceCityEconomy, but
 * read-only (no population / wealth / magazyn mutation). For HUD before end turn.
 */
export function previewCityEconomy(
  cities: ReadonlyArray<City>,
  map: GameMap,
  data: GameData,
  difficulty: Difficulty = 'normal',
  builtByCity: ReadonlyMap<string, readonly string[]> = new Map(),
  playerEra: number = 1,
  playerZbadane: ReadonlySet<string> = new Set(),
  ownerCivByOwnerId: ReadonlyMap<number, string> = new Map(),
  orderMultByCity: ReadonlyMap<string, OrderYieldMults> = new Map(),
  resolveOwnerEra?: OwnerEraResolver,
  resolveOwnerTech?: OwnerTechResolver,
  tradeRouteCountByCity: ReadonlyMap<string, number> = new Map(),
  tradeIncomeByCity: ReadonlyMap<string, number> = new Map(),
  territoryNodes?: readonly TerritoryNode[],
  cityReligionByCityId: ReadonlyMap<string, ReligionState> = new Map(),
  /** CUDA-EKON-01: ownerId -> suma bonusy.miasto cudów ukończonych (× każde miasto ownera). */
  wonderCityYieldsByOwner: ReadonlyMap<number, WonderYieldBonus> = new Map(),
  /** PYTANIE 83=B: dostęp do złota per owner (patrz OwnerZlotoAccessResolver powyżej). */
  resolveOwnerZlotoAccess: OwnerZlotoAccessResolver = () => true,
  /** PYTANIE-84: runtime gate dostęp/magazyn — gdy podane, budynki z DEPOSIT_LINKED śpią bez surowca. */
  resolveOwnerActiveLabels?: OwnerActiveLabelsResolver,
  resolveOwnerEmpireStock?: OwnerEmpireStockResolver,
  /** DYSPOZYCJA-85-SUWAK: domyślny podział Daniny/Podatku per owner. */
  ownerDefaultPodzialHandluByOwner: ReadonlyMap<number, CityPodzialHandlu> = new Map(),
  /** R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE=A: domyślny podział Pracy per owner. */
  ownerDefaultPodzialPracyByOwner: ReadonlyMap<number, CityPodzialPracy> = new Map(),
): Pick<EconomyTickResult, 'perCity'> {
  const params = buildEconParams(data, difficulty);
  const buildingCatalog = data.buildings as unknown as BuildingRecord[];
  const rawEconParams = data.econParams as unknown as Parameters<typeof loadUpkeepParams>[0];
  const wealthParams = loadWealthParams(
    data.econParams as unknown as import('./wealth').RawWealthParamsJson,
    difficulty,
  );
  const healthParams = loadHealthParams(
    (data as unknown as Record<string, unknown>).societyParams,
    difficulty,
  );
  const rationParams = buildRationParams(rawEconParams, difficulty);
  const capitalSeen = new Set<number>();
  // Pytanie 71/C (Maciej 2026-07-25): Mennica stoi wyłącznie w stolicy (pytanie 70/B)
  // -> bramka Efektu 1 musi patrzeć na CAŁE imperium ownera, nie tylko to miasto.
  // Liczone RAZ na tick, nie per-city.
  const mennicaOwners = ownersWithMennica(cities, builtByCity);
  // D2 (Maciej 2026-07-25): pre-pass dla korupcji -- wspolrzedne "stolicy" per owner wg
  // TEJ SAMEJ heurystyki co isCapital nizej (pierwsze miasto ownera w tablicy `cities`;
  // ten modul nie ma dostepu do autorytatywnego capitalCityIdForOwner z main.ts). Musi
  // powstac PRZED glowna petla, bo miasto regionalne moze byc iterowane przed swoja
  // stolica. Rownolegle: liczbaWszystkichMiast per owner (PARYTET AI -- ta sama liczba
  // dla gracza i AI, zero galezi po ownerId).
  const capitalCoordsByOwner = new Map<number, { q: number; r: number }>();
  const cityCountByOwner = new Map<number, number>();
  for (const c of cities) {
    if (!capitalCoordsByOwner.has(c.ownerId)) {
      capitalCoordsByOwner.set(c.ownerId, { q: c.q, r: c.r });
    }
    cityCountByOwner.set(c.ownerId, (cityCountByOwner.get(c.ownerId) ?? 0) + 1);
  }

  const garncarniaSurplusZadowolenieByOwner = computeGarncarniaSurplusZadowolenieByOwner(
    cities, builtByCity, false,
  );

  const perCity: CityEconomyTick[] = [];

  for (const city of cities) {
    const isCapital = !capitalSeen.has(city.ownerId);
    capitalSeen.add(city.ownerId);

    const worked = cityWorkedTilesForEconomy(city, map, territoryNodes);
    const builtIds = builtByCity.get(city.id) ?? [];
    const runtimeBuiltIds = runtimeActiveBuiltIdsForCity(
      builtIds,
      city.ownerId,
      resolveOwnerActiveLabels,
      resolveOwnerEmpireStock,
      resolveOwnerZlotoAccess,
    );
    const spichlerzState = resolveSpichlerzForCity(cities, city.ownerId, builtIds, true);
    const hasWater = cityHasWaterAccess(city, map);
    const garncarniaZadowolenie = runtimeBuiltIds.includes('garncarnia')
      ? (garncarniaSurplusZadowolenieByOwner.get(city.ownerId) ?? 0)
      : 0;
    const zdrowie = computeCityHealth(
      city.population, worked, runtimeBuiltIds, healthParams, hasWater, { city, map },
      spichlerzHealthBonus(spichlerzState),
    );

    const maSpichlerzII = spichlerzState.maSpichlerzIIPop;
    const maSpichlerz = spichlerzState.maSpichlerzPop;
    const maAkwedukt = runtimeBuiltIds.includes('akwedukt');
    const poziomRacji = getCityRationLevel(city);
    const ownerDefaultPodzial = ownerDefaultPodzialHandluByOwner.get(city.ownerId);
    const ownerDefaultPodzialPracy = ownerDefaultPodzialPracyByOwner.get(city.ownerId);
    const econCity = toEconomyCity(
      city, params, isCapital, zdrowie,
      { maSpichlerz, maSpichlerzII, maAkwedukt },
      ownerDefaultPodzial,
      ownerDefaultPodzialPracy,
    );

    const ownerEra = resolveOwnerEra
      ? resolveOwnerEra(city.ownerId)
      : (city.ownerId === 0 ? playerEra : 1);
    const ownerTech = resolveOwnerTech
      ? resolveOwnerTech(city.ownerId)
      : playerZbadane;
    const walutaOdkryta = ownerTech.has('Waluta') || ownerTech.has('waluta');
    const ownerCivKey = ownerCivByOwnerId.get(city.ownerId);
    const cityReligion = cityReligionByCityId.get(city.id);
    const maMennicaBuiltEmpireWide = mennicaOwners.has(city.ownerId);
    // PYTANIE 83=B (Maciej 2026-07-25): "Mennica przestaje działać po utracie dostępu
    // do złota. Mnożnik znika, Podatek wraca do Daniny." Budynek NIE jest burzony
    // (maMennicaBuiltEmpireWide zostaje true) -- tylko EFEKT śpi, gdy cywilizacja
    // aktualnie nie ma dostępu do złota (ani własna Kopalnia złota, ani szlak).
    // resolveOwnerZlotoAccess to memoizowany resolver ownera (RAZ per owner per tick,
    // main.ts) -- patrz OwnerZlotoAccessResolver powyżej.
    const maMennicaEmpireWide = maMennicaBuiltEmpireWide && resolveOwnerZlotoAccess(city.ownerId);
    const walutaMnoznikOverride = resolveWalutaMnoznikOverride(
      cityReligion,
      ownerCivKey,
      maMennicaEmpireWide,
      walutaOdkryta,
      data.civs,
      data.societyParams,
      difficulty,
      params.mennicaMnoznikPoWalucie,
    );
    const ownerBonusy = ownerCivKey
      ? civBonusyForCivKey(ownerCivKey, data.civs)
      : [];
    const { handel: civHandelMult, nauka: civNaukaMult } = civEconomyYieldMultipliers(ownerBonusy);
    const liczbaTrasHandlowych = tradeRouteCountByCity.get(city.id) ?? 0;
    // D2 (Maciej 2026-07-25): korupcja wpięta -- dystansOdStolicy=0 dla stolicy (i gdy
    // brak zarejestrowanej stolicy tego ownera, co w praktyce nie wystepuje bo kazdy
    // wlasciciel rejestruje swoje pierwsze miasto w pre-passie powyzej). D4: redukcja
    // Sad/Pretorium/Palac TYLKO w tym miescie, mnozona na strataBazowa. PARYTET AI --
    // brak galezi po ownerId.
    const capCoords = capitalCoordsByOwner.get(city.ownerId);
    const dystansOdStolicy = (isCapital || !capCoords)
      ? 0
      : hexDistance(city.q, city.r, capCoords.q, capCoords.r);
    const liczbaWszystkichMiast = cityCountByOwner.get(city.ownerId) ?? 1;
    const strataBazowa = corruptionRate(dystansOdStolicy, liczbaWszystkichMiast, params);
    const redukcjaBudynkowKorupcji = corruptionBuildingReduction(builtIds);
    const strataFraction = strataBazowa * (1 - redukcjaBudynkowKorupcji);
    const ctx: CityYieldContext = {
      wojskoZuzycieZywnosci: 0,
      strataFraction,
      maMlyn: runtimeBuiltIds.includes('mlyn'),
      maCegielnia: runtimeBuiltIds.includes('cegielnia'),
      maTargowisko: runtimeBuiltIds.includes('targowisko'),
      maBiblioteka: runtimeBuiltIds.includes('biblioteka'),
      maAkademia: runtimeBuiltIds.includes('akademia'),
      // Efekt 1 SCALONY (decyzja Maciej 2026-07-25): Mennica jest jednym z dwoch
      // warunkow bramki w cityYieldPerTurn (ctx.maMennica && ctx.walutaOdkryta) --
      // gdy oba prawdziwe, CALY handelNetto (Skarb+Nauka+Zamoznosc) jest mnozony
      // przez mnoznik cywilizacyjny skalowany trudnoscia (walutaMnoznikOverride,
      // patrz resolveWalutaMnoznikOverride powyzej -- ZASTEPUJE plaska regule
      // "2/1.5/1 dla wszystkich", pytanie 69). Mennica jest teraz IMPERIUM-WIDE
      // (pytanie 71/C), bo stoi wylacznie w stolicy (pytanie 70/B). PYTANIE 83=B:
      // maMennicaEmpireWide juz zawiera bramke dostepu do zlota (patrz wyzej) --
      // gdy zlota brak, ta flaga jest false mimo ze budynek dalej stoi.
      maMennica: maMennicaEmpireWide,
      walutaOdkryta,
      walutaMnoznikOverride,
      civHandelMult,
      civNaukaMult,
      liczbaAktywnychTrasHandlowych: liczbaTrasHandlowych,
      // Zadanie 2 (2026-07-23): Garncarnia +Zywnosc% LOKALNIE -- liczba sztuk w TYM miescie.
      liczbaGarncarni: runtimeBuiltIds.filter(id => id === 'garncarnia').length,
    };

    // Naprawa 2026-07-25: budynki miasta -> plony flat (Praca/Pieniadz/Zywnosc/Nauka/
    // Kultura) przez cityBuildingEntriesFromBuiltIds (economy.ts) -- ta sama funkcja
    // uzywana w advanceCityEconomy i cityPanel "Bilans plonow", zeby podglad HUD
    // pokazywal identyczne liczby co realny silnik tury.
    // U-22B: efektywny id Spichlerza (I vs II + Zadowolenie z JSON) zamiast surowych builtIds.
    const yieldBuiltIds = builtIdsForSpichlerzYields(runtimeBuiltIds, spichlerzState);
    const cityBuildings = cityBuildingEntriesFromBuiltIds(yieldBuiltIds, buildingCatalog, ownerEra, ownerTech);
    const yld = cityYieldPerTurn(econCity, worked, cityBuildings, params, ctx);
    const orderMult = orderMultByCity.get(city.id);
    if (orderMult) applyOrderYieldMults(yld, orderMult);
    yld.praca = cityPracaInteger(yld.praca);
    const zywnoscBrutto = yld.zywnoscBrutto;
    const foodBal = computeCityFoodBalanceV85(zywnoscBrutto, city.population, city, rationParams, spichlerzState);
    yld.zywnosc = foodBal.bilansLokalny;
    // +wonder yields (CUDA-EKON-01) — patrz applyWonderCityYields, krok osobny od reszty.
    applyWonderCityYields(yld, wonderCityYieldsByOwner.get(city.ownerId));

    const prevWealth: WealthState = city.wealthState ?? freshWealthState();
    const wealthImmunity = (city.wealthImmunityRemaining ?? 0) > 0;
    const wt: WealthTickResult = advanceWealth(
      prevWealth,
      yld.luksus,
      yld.pieniadz,
      ownerEra,
      wealthParams,
      wealthImmunity ? { minPoziom: 1 } : undefined,
    );
    const pieniadzPoWealth = Math.floor(yld.pieniadz * wt.mnoznik);
    // Handel E3: dochod dystansowy z tras -- CZYSTO do skarbca, dodany PO mnozniku
    // Wealth (nie jest mnozony przez niego).
    const pieniadzZTras = tradeIncomeByCity.get(city.id) ?? 0;

    // NAPRAWA CACHE/LIVE (Maciej 2026-08-10, znalezisko B): PRZEDTEM czytano `city.podzialPracy`
    // wprost -- pole wypełnione WYŁĄCZNIE gdy miasto ma aktywny lokalny override
    // (podzialPracyOverride=true). Bez override to pole jest `undefined`
    // (seedCityOwnerDefaults/onPodzialPracyOverrideToggle je usuwają), więc split cicho spadał
    // do statycznego `params.suwaakPracaBudynki` z JSON-a -- IGNORUJĄC globalny suwak Pracy
    // gracza (ownerDefaultPodzialPracy), mimo że `econCity.podziałPracy` dwadzieścia linii
    // wyżej (toEconomyCity → resolveCityPodzialPracy) już poprawnie go rozwiązuje. Efekt: panel
    // miasta (cityPanel, effectivePodzialPracy → ten sam resolveCityPodzialPracy) pokazywał
    // ustawioną wartość (np. 50/50 → +6/+6), a silnik/HUD cywilizacji liczył zawsze na
    // domyślnych 70/30 (round(6×0,70)=4 → doPuli=2) — DOKŁADNIE zgłoszony rozjazd „plus sześć
    // vs plus dwa". `econCity.podziałPracy` już niesie poprawną wartość — czytamy z niego.
    // / EN: previously read `city.podzialPracy` directly -- only populated when the city has an
    // active local override; without override it is `undefined`, so the split silently fell
    // back to the static JSON default, ignoring the player's global Praca slider
    // (ownerDefaultPodzialPracy) even though `econCity.podziałPracy` above already resolves it
    // correctly. This was the actual root cause of the reported mismatch, not merely a cache
    // staleness issue.
    const udzialBudynki = econCity.podziałPracy.procentBudynki / 100;
    const { doBudynkow, doPuli } = splitPraca(yld.praca, udzialBudynki);

    const isOblegane = city.oblegane === true;
    if (isOblegane) {
      perCity.push({
        cityId: city.id,
        ownerId: city.ownerId,
        praca: yld.praca,
        pieniadz: pieniadzPoWealth + pieniadzZTras,
        pieniadzBrutto: yld.pieniadz,
        zywnoscNetto: 0,
        nauka: yld.nauka,
        luksus: yld.luksus,
        kultura: yld.kultura,
        ludnoscPrzed: city.population,
        ludnoscPo: city.population,
        wzrost: false,
        ubytek: false,
        zdrowie,
        doBudynkow,
        doPuli,
        wealthMnoznik: wt.mnoznik,
        wealthZadowolenie: wt.zadowolenie,
        garncarniaSurplusZadowolenie: garncarniaZadowolenie,
        pieniadzZPracy: yld.pieniadzZPracy,
        pieniadzZTras,
        oblegany: true,
        obleganyGlod: getCityFood(city) <= 0,
        magazynPoTurze: getCityFood(city),
        maSpichlerz,
        maSpichlerzII,
        spichlerzCeramika: spichlerzState.ceramikaActive,
        spichlerzSol: spichlerzState.solActive,
        procentRozwoj: Math.round((poziomRacji / 6) * 100),
        zywnoscBrutto: 0,
        kosztRacji: 0,
        bilansLokalny: 0,
        poziomRacji,
      });
      continue;
    }

    const growthPreview = computeGrowthPercentV85({
      population: city.population,
      poziomRacji: foodBal.poziomRacji,
      zdrowie,
      szczescieNetto: 0,
      wealthPoziom: wt.poziom,
      spichlerzState,
      civKey: ownerCivByOwnerId.get(city.ownerId) ?? null,
      rationParams,
    });

    perCity.push({
      cityId: city.id,
      ownerId: city.ownerId,
      praca: yld.praca,
      pieniadz: pieniadzPoWealth + pieniadzZTras,
      pieniadzBrutto: yld.pieniadz,
      zywnoscNetto: foodBal.bilansLokalny,
      nauka: yld.nauka,
      luksus: yld.luksus,
      kultura: yld.kultura,
      ludnoscPrzed: city.population,
      ludnoscPo: city.population,
      wzrost: false,
      ubytek: false,
      zdrowie,
      doBudynkow,
      doPuli,
      wealthMnoznik: wt.mnoznik,
      wealthZadowolenie: wt.zadowolenie,
      garncarniaSurplusZadowolenie: garncarniaZadowolenie,
      pieniadzZPracy: yld.pieniadzZPracy,
      pieniadzZTras,
      oblegany: false,
      obleganyGlod: false,
      magazynPoTurze: city.wzrostUlamkowy ?? 0,
      maSpichlerz,
      maSpichlerzII,
      spichlerzCeramika: spichlerzState.ceramikaActive,
      spichlerzSol: spichlerzState.solActive,
      procentRozwoj: Math.round((poziomRacji / 6) * 100),
      zywnoscBrutto,
      kosztRacji: foodBal.kosztRacji,
      bilansLokalny: foodBal.bilansLokalny,
      poziomRacji,
      wzrostProcent: growthPreview.total,
      wzrostUlamkowyPo: city.wzrostUlamkowy ?? 0,
    });
  }

  return { perCity };
}

/**
 * Live preview of one owner's gold upkeep balance (building + unit maintenance,
 * Spec s.6.4) — same primitives as advanceCityEconomy's real end-of-turn tick
 * (upkeepBalance over buildingsByOwner/econUnits, s.1878-1913 below), but pure
 * and read-only, so it can run BEFORE end of turn (HUD "Skarbiec" chip rate).
 *
 * NAPRAWA HUD-SKARBIEC (Maciej 2026-07-26, zgloszenie z playtestu, bundle
 * 2f928932): HUD-owy chip Skarbca pokazywal WPLYWY BRUTTO (suma Pieniadza z
 * miast, playerEcon.pieniadz) jako "przyrost/ture", pomijajac utrzymanie
 * budynkow i jednostek ktore Skarbiec realnie odejmuje przy koncu tury (main.ts
 * "Bank treasury" blok, `player.skarbiec -= playerBalance.utrzymanieRazem`).
 * Ta funkcja daje wolajacemu (main.ts refreshLiveEmpireRates) dokladnie te same
 * dwie sumy PRZED koncem tury, zeby wyswietlany "+N" byl realna projekcja
 * netto, nie samym przychodem.
 *
 * `econUnits` celowo tego samego typu co advanceCityEconomy uzywa (EconUnit,
 * bez pola `category`) -- upkeepBalance/totalUnitUpkeep i tak dostaje go przez
 * `as unknown as UnitUpkeepLike[]` (identycznie jak nizej w advanceCityEconomy),
 * wiec zachowanie (dopasowanie po typeId / fallback standardowy) jest IDENTYCZNE
 * w podglodzie i w realnym ticku -- zaden rozjazd z powodu innego ksztaltu danych.
 * PARYTET AI: ownerId to zwykly parametr, zero galezi warunkowych po jego wartosci.
 */
export function previewOwnerUpkeep(
  ownerId: number,
  cities: ReadonlyArray<City>,
  data: GameData,
  difficulty: Difficulty = 'normal',
  builtByCity: ReadonlyMap<string, readonly string[]> = new Map(),
  econUnits: ReadonlyArray<EconUnit> = [],
  playerEra: number = 1,
  playerZbadane: ReadonlySet<string> = new Set(),
  resolveOwnerEra?: OwnerEraResolver,
  resolveOwnerTech?: OwnerTechResolver,
): UpkeepBalance {
  const rawEconParams = data.econParams as unknown as Parameters<typeof loadUpkeepParams>[0];
  const upkeepParams  = loadUpkeepParams(rawEconParams, difficulty);
  const unitUpkeepTbl = buildUnitUpkeepTable(data.units as unknown as Parameters<typeof buildUnitUpkeepTable>[0]);

  const buildings: BuildingInstanceLike[] = [];
  for (const city of cities) {
    if (city.ownerId !== ownerId) continue;
    const builtIds = builtByCity.get(city.id) ?? [];
    if (builtIds.length === 0) continue;
    const ownerEra = resolveOwnerEra
      ? resolveOwnerEra(city.ownerId)
      : (city.ownerId === 0 ? playerEra : 1);
    const ownerTech = resolveOwnerTech
      ? resolveOwnerTech(city.ownerId)
      : playerZbadane;
    for (const bid of builtIds) {
      const bdef = data.buildings.find(b => b.id === bid);
      if (!bdef) continue;
      const level = buildingLevelForEpoch(
        bdef.epokaWejscia, ownerEra, bdef.maksPoziom, bdef.poziomTechGate, ownerTech,
      );
      buildings.push({ record: bdef as unknown as BuildingRecord, level });
    }
  }
  const ounits = econUnits.filter(u => u.ownerId === ownerId) as unknown as UnitUpkeepLike[];
  // `income` nie jest tu potrzebny (wolacy chce tylko utrzymanieBudynki/Jednostki/Razem,
  // nie salda) -- 0 jest neutralne, wplywa wylacznie na pola saldo/deficyt ponizej.
  return upkeepBalance(0, buildings, ounits, unitUpkeepTbl, upkeepParams);
}

export function advanceCityEconomy(
  cities: City[],
  map: GameMap,
  data: GameData,
  difficulty: Difficulty = 'normal',
  econUnits: ReadonlyArray<EconUnit> = [],
  growthMultByCity: ReadonlyMap<string, number> = new Map(),
  builtByCity: ReadonlyMap<string, readonly string[]> = new Map(),
  playerEra: number = 1,
  playerZbadane: ReadonlySet<string> = new Set(),
  ownerCivByOwnerId: ReadonlyMap<number, string> = new Map(),
  orderMultByCity: ReadonlyMap<string, OrderYieldMults> = new Map(),
  resolveOwnerEra?: OwnerEraResolver,
  resolveOwnerTech?: OwnerTechResolver,
  wzrostLudnosciPace: WzrostLudnosciPace = 'wysoki',
  /** Handel E3: cityId -> liczba aktywnych tras handlowych (+5% Handlu/trasa). */
  tradeRouteCountByCity: ReadonlyMap<string, number> = new Map(),
  /** Handel E3: cityId -> dochod dystansowy z tras tej tury (czysto do skarbca). */
  tradeIncomeByCity: ReadonlyMap<string, number> = new Map(),
  cityReligionByCityId: ReadonlyMap<string, ReligionState> = new Map(),
  /** CUDA-EKON-01: ownerId -> suma bonusy.miasto cudów ukończonych (× każde miasto ownera). */
  wonderCityYieldsByOwner: ReadonlyMap<number, WonderYieldBonus> = new Map(),
  /** PYTANIE 83=B: dostęp do złota per owner (patrz OwnerZlotoAccessResolver powyżej). */
  resolveOwnerZlotoAccess: OwnerZlotoAccessResolver = () => true,
  /** PYTANIE-84: runtime gate dostęp/magazyn — gdy podane, budynki z DEPOSIT_LINKED śpią bez surowca. */
  resolveOwnerActiveLabels?: OwnerActiveLabelsResolver,
  resolveOwnerEmpireStock?: OwnerEmpireStockResolver,
  /** DYSPOZYCJA-85-SUWAK: domyślny podział Daniny/Podatku per owner. */
  ownerDefaultPodzialHandluByOwner: ReadonlyMap<number, CityPodzialHandlu> = new Map(),
  /** Faza 3 Manpower: leczenie HP jednostek z puli imperium (po regen w pętli miast). */
  manpowerHeal?: {
    units: ManpowerHealUnit[];
    getMaxHp: (typeId: string) => number;
  },
  /** R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE=A: domyślny podział Pracy per owner. */
  ownerDefaultPodzialPracyByOwner: ReadonlyMap<number, CityPodzialPracy> = new Map(),
): EconomyTickResult {
  const gameDifficulty = difficulty as GameDifficulty;
  const params = buildEconParams(data, difficulty);
  const buildingCatalog = data.buildings as unknown as BuildingRecord[];

  const territoryNodes = buildTerritoryNodesFromCities(cities);
  reconcileAllWorkedTiles(cities, territoryNodes);

  // SUROW-TERYT-01 (Maciej 2026-07-23): surowce logistyczne per ulepszenie w
  // terytorium, niezaleznie od workedTiles -- liczone RAZ dla calej tury (nie per-city).
  const territoryResourceByCity = computeTerritoryResourceYieldByCity(cities, map, territoryNodes);

  // ZADANIE 1 (Maciej 2026-07-23): upkeep Pracy civ-wide za ulepszenia surowcowe
  // -- liczone RAZ dla calej tury (per owner, nie per-city, patrz komentarz przy
  // computePracaUpkeepByOwner powyzej).
  const pracaUpkeepByOwner = computePracaUpkeepByOwner(map, territoryNodes, data, difficulty);

  // Load upkeep + storage params from the same econ-params.json blob.
  const rawEconParams = data.econParams as unknown as Parameters<typeof loadUpkeepParams>[0];
  const upkeepParams  = loadUpkeepParams(rawEconParams, difficulty);
  const storageParams = loadStorageParams(rawEconParams, difficulty);
  const rationParams = buildRationParams(rawEconParams, difficulty);

  // Build unit upkeep lookup table once per tick.
  const unitUpkeepTbl = buildUnitUpkeepTable(data.units as unknown as Parameters<typeof buildUnitUpkeepTable>[0]);

  // Pre-compute converter throughputs (from econ-params.json) -- used per-city.
  const rawForConverters = data.econParams as unknown as RawConverterParamsJson;
  const converterThroughputs: Record<string, number> = {};
  for (const recipe of DEFAULT_CONVERTER_RECIPES) {
    converterThroughputs[recipe.id] = loadThroughput(
      rawForConverters, recipe.throughputParamKey, difficulty, recipe.throughputFallback,
    );
  }

  // Zadanie 2 (2026-07-23): Stolarnia / Warsztat kamieniarski -- bonus CIV-WIDE do
  // produkcji Drewna/Kamienia (+10% za kazda sztuke zbudowana GDZIEKOLWIEK w imperium
  // ownera, stackuje addytywnie). Parametr 10% w econ-params.json (budynki.*) --
  // PLACEHOLDER do strojenia, wczytywany tym samym generycznym loaderem co przepustowosci
  // konwerterow (loadThroughput dziala na kazdym kluczu budynki.<key>.<difficulty>).
  const stolarniaBonusDrewnaCiv = loadThroughput(
    rawForConverters, 'budynek_stolarnia_bonus_drewna_civ', difficulty, 0.10,
  );
  const kamieniarskiBonusKamieniaCiv = loadThroughput(
    rawForConverters, 'budynek_kamieniarski_bonus_kamienia_civ', difficulty, 0.10,
  );
  // Liczba Stolarni / Warsztatow kamieniarskich PER OWNER (suma po wszystkich miastach --
  // stad "civ-wide"), policzona RAZ przed petla po miastach.
  const stolarniaCountByOwner = new Map<number, number>();
  const kamieniarskiCountByOwner = new Map<number, number>();
  // SUROW-CIV-01 (Maciej 2026-07-24): liczba Magazynow PER OWNER (civ-wide) -- wejscie
  // do capu panstwa surowcow (ownerResourceCapacityPerType). OWNERID-AGNOSTIC: liczone
  // identycznie dla gracza (ownerId=0) i kazdej cywilizacji AI, zero specjalnej sciezki.
  const magazynCountByOwner = new Map<number, number>();
  for (const c of cities) {
    const bIds = builtByCity.get(c.id) ?? [];
    const runtimeBIds = runtimeActiveBuiltIdsForCity(
      bIds,
      c.ownerId,
      resolveOwnerActiveLabels,
      resolveOwnerEmpireStock,
      resolveOwnerZlotoAccess,
    );
    if (runtimeBIds.includes('stolarnia')) {
      stolarniaCountByOwner.set(c.ownerId, (stolarniaCountByOwner.get(c.ownerId) ?? 0) + 1);
    }
    if (runtimeBIds.includes('kamieniarski')) {
      kamieniarskiCountByOwner.set(c.ownerId, (kamieniarskiCountByOwner.get(c.ownerId) ?? 0) + 1);
    }
    if (bIds.includes('magazyn')) {
      magazynCountByOwner.set(c.ownerId, (magazynCountByOwner.get(c.ownerId) ?? 0) + 1);
    }
  }

  // SUROW-CIV-01: parametry + cap panstwa per owner (jeden raz, czysty getter z cache).
  // ownerStorageParams jest wspolny dla WSZYSTKICH ownerow (gracz + AI) -- sam cap
  // rozni sie tylko przez magazynCountByOwner (rzeczywiscie zbudowane Magazyny tego
  // ownera), nigdy przez ownerId samo w sobie.
  const ownerStorageParams: OwnerStorageParams = loadOwnerStorageParams(rawEconParams, difficulty);
  const ownerResCapByOwner = new Map<number, number>();
  function ownerResourceCapFor(ownerId: number): number {
    const cached = ownerResCapByOwner.get(ownerId);
    if (cached !== undefined) return cached;
    const cap = ownerResourceCapacityPerType(magazynCountByOwner.get(ownerId) ?? 0, ownerStorageParams);
    ownerResCapByOwner.set(ownerId, cap);
    return cap;
  }

  // WIRE 1: parametry zdrowia z society-params.json
  const healthParams = loadHealthParams(
    (data as unknown as Record<string, unknown>).societyParams,
    difficulty,
  );

  // WIRE 3: parametry Wealth z econ-params.json
  const wealthParams = loadWealthParams(
    data.econParams as unknown as import('./wealth').RawWealthParamsJson,
    difficulty,
  );

  // Track the first city seen per owner -> treat as that owner's capital.
  const capitalSeen = new Set<number>();
  // Pytanie 71/C (Maciej 2026-07-25): Mennica stoi wyłącznie w stolicy (pytanie 70/B)
  // -> bramka Efektu 1 musi patrzeć na CAŁE imperium ownera, nie tylko to miasto.
  // Liczone RAZ na tick, nie per-city.
  const mennicaOwners = ownersWithMennica(cities, builtByCity);
  // D2 (Maciej 2026-07-25): pre-pass dla korupcji -- wspolrzedne "stolicy" per owner wg
  // TEJ SAMEJ heurystyki co isCapital nizej (pierwsze miasto ownera w tablicy `cities`;
  // ten modul nie ma dostepu do autorytatywnego capitalCityIdForOwner z main.ts). Musi
  // powstac PRZED glowna petla, bo miasto regionalne moze byc iterowane przed swoja
  // stolica. Rownolegle: liczbaWszystkichMiast per owner (PARYTET AI -- ta sama liczba
  // dla gracza i AI, zero galezi po ownerId).
  const capitalCoordsByOwner = new Map<number, { q: number; r: number }>();
  const cityCountByOwner = new Map<number, number>();
  for (const c of cities) {
    if (!capitalCoordsByOwner.has(c.ownerId)) {
      capitalCoordsByOwner.set(c.ownerId, { q: c.q, r: c.r });
    }
    cityCountByOwner.set(c.ownerId, (cityCountByOwner.get(c.ownerId) ?? 0) + 1);
  }

  const result: EconomyTickResult = {
    perCity:        [],
    cities:         0,
    totalPraca:     0,
    totalPieniadz:  0,
    totalNauka:     0,
    totalLuksus:    0,
    totalKultura:   0,
    totalZywnosc:   0,
    totalPracaPula: 0,
    growth:         0,
    starved:        0,
    upkeepByOwner:  new Map(),
    resourceUpkeepByOwner: new Map(),
    pracaUpkeepByOwner,
  };

  // --- Per-owner income accumulators (for upkeep balance after city loop) ---
  const incomeByOwner = new Map<number, number>();

  // PYTANIE-84 R2: wpływ mapy → konwertery → drain Spichlerza PRZED plonami miast.
  const workedMagazynByCity = computeWorkedMagazynYieldsByCity(cities, map, territoryNodes);
  const spichlerzByCity = tickEmpireResourcePipeline(
    cities,
    builtByCity,
    territoryResourceByCity,
    workedMagazynByCity,
    stolarniaCountByOwner,
    kamieniarskiCountByOwner,
    stolarniaBonusDrewnaCiv,
    kamieniarskiBonusKamieniaCiv,
    converterThroughputs,
    ownerResourceCapFor,
    resolveOwnerActiveLabels,
    resolveOwnerZlotoAccess,
  );

  const garncarniaSurplusZadowolenieByOwner = computeGarncarniaSurplusZadowolenieByOwner(
    cities, builtByCity, true,
  );

  for (const city of cities) {
    const isCapital = !capitalSeen.has(city.ownerId);
    capitalSeen.add(city.ownerId);

    const worked    = cityWorkedTilesForEconomy(city, map, territoryNodes);
    const builtIds  = builtByCity.get(city.id) ?? [];
    const runtimeBuiltIds = runtimeActiveBuiltIdsForCity(
      builtIds,
      city.ownerId,
      resolveOwnerActiveLabels,
      resolveOwnerEmpireStock,
      resolveOwnerZlotoAccess,
    );

    const spichlerzState = spichlerzByCity.get(city.id)
      ?? resolveSpichlerzCityBonusState(builtIds, { ceramikaPaid: false, solPaid: false });

    // WIRE 1: oblicz zdrowie miasta (D17-A: dostęp do wody z mapy, nie tylko pól plonów)
    const hasWater = cityHasWaterAccess(city, map);
    const garncarniaZadowolenie = runtimeBuiltIds.includes('garncarnia')
      ? (garncarniaSurplusZadowolenieByOwner.get(city.ownerId) ?? 0)
      : 0;
    const zdrowie = computeCityHealth(
      city.population, worked, runtimeBuiltIds, healthParams, hasWater, { city, map },
      spichlerzHealthBonus(spichlerzState),
    );

    const maSpichlerzII = spichlerzState.maSpichlerzIIPop;
    const maSpichlerz = spichlerzState.maSpichlerzPop;
    const maAkwedukt  = runtimeBuiltIds.includes('akwedukt');
    const poziomRacji = getCityRationLevel(city);
    const ownerDefaultPodzial = ownerDefaultPodzialHandluByOwner.get(city.ownerId);
    const ownerDefaultPodzialPracy = ownerDefaultPodzialPracyByOwner.get(city.ownerId);
    const econCity = toEconomyCity(
      city, params, isCapital, zdrowie,
      { maSpichlerz, maSpichlerzII, maAkwedukt },
      ownerDefaultPodzial,
      ownerDefaultPodzialPracy,
    );

    const ownerEra = resolveOwnerEra
      ? resolveOwnerEra(city.ownerId)
      : (city.ownerId === 0 ? playerEra : 1);
    const ownerTech = resolveOwnerTech
      ? resolveOwnerTech(city.ownerId)
      : playerZbadane;
    const walutaOdkryta = ownerTech.has('Waluta') || ownerTech.has('waluta');
    const ownerCivKey = ownerCivByOwnerId.get(city.ownerId);
    const cityReligion = cityReligionByCityId.get(city.id);
    const maMennicaBuiltEmpireWide = mennicaOwners.has(city.ownerId);
    // PYTANIE 83=B (Maciej 2026-07-25): "Mennica przestaje działać po utracie dostępu
    // do złota. Mnożnik znika, Podatek wraca do Daniny." Budynek NIE jest burzony
    // (maMennicaBuiltEmpireWide zostaje true) -- tylko EFEKT śpi, gdy cywilizacja
    // aktualnie nie ma dostępu do złota (ani własna Kopalnia złota, ani szlak).
    // resolveOwnerZlotoAccess to memoizowany resolver ownera (RAZ per owner per tick,
    // main.ts) -- patrz OwnerZlotoAccessResolver powyżej.
    const maMennicaEmpireWide = maMennicaBuiltEmpireWide && resolveOwnerZlotoAccess(city.ownerId);
    const walutaMnoznikOverride = resolveWalutaMnoznikOverride(
      cityReligion,
      ownerCivKey,
      maMennicaEmpireWide,
      walutaOdkryta,
      data.civs,
      data.societyParams,
      difficulty,
      params.mennicaMnoznikPoWalucie,
    );
    const ownerBonusy = ownerCivKey
      ? civBonusyForCivKey(ownerCivKey, data.civs)
      : [];
    const { handel: civHandelMult, nauka: civNaukaMult } = civEconomyYieldMultipliers(ownerBonusy);
    const liczbaTrasHandlowych = tradeRouteCountByCity.get(city.id) ?? 0;
    // D2 (Maciej 2026-07-25): korupcja wpięta -- dystansOdStolicy=0 dla stolicy (i gdy
    // brak zarejestrowanej stolicy tego ownera, co w praktyce nie wystepuje bo kazdy
    // wlasciciel rejestruje swoje pierwsze miasto w pre-passie powyzej). D4: redukcja
    // Sad/Pretorium/Palac TYLKO w tym miescie, mnozona na strataBazowa. PARYTET AI --
    // brak galezi po ownerId.
    const capCoords = capitalCoordsByOwner.get(city.ownerId);
    const dystansOdStolicy = (isCapital || !capCoords)
      ? 0
      : hexDistance(city.q, city.r, capCoords.q, capCoords.r);
    const liczbaWszystkichMiast = cityCountByOwner.get(city.ownerId) ?? 1;
    const strataBazowa = corruptionRate(dystansOdStolicy, liczbaWszystkichMiast, params);
    const redukcjaBudynkowKorupcji = corruptionBuildingReduction(builtIds);
    const strataFraction = strataBazowa * (1 - redukcjaBudynkowKorupcji);
    const ctx: CityYieldContext = {
      wojskoZuzycieZywnosci: 0,   // B5: wojsko → zapasy państwa (advanceEmpireFood)
      strataFraction,
      maMlyn:                runtimeBuiltIds.includes('mlyn'),
      maCegielnia:           runtimeBuiltIds.includes('cegielnia'),
      maTargowisko:          runtimeBuiltIds.includes('targowisko'),
      maBiblioteka:          runtimeBuiltIds.includes('biblioteka'),
      maAkademia:            runtimeBuiltIds.includes('akademia'),
      // Efekt 1 SCALONY (decyzja Maciej 2026-07-25): Mennica jest jednym z dwoch
      // warunkow bramki w cityYieldPerTurn (ctx.maMennica && ctx.walutaOdkryta) --
      // gdy oba prawdziwe, CALY handelNetto (Skarb+Nauka+Zamoznosc) jest mnozony
      // przez mnoznik cywilizacyjny skalowany trudnoscia (walutaMnoznikOverride,
      // patrz resolveWalutaMnoznikOverride powyzej -- ZASTEPUJE plaska regule
      // "2/1.5/1 dla wszystkich", pytanie 69). Mennica jest teraz IMPERIUM-WIDE
      // (pytanie 71/C), bo stoi wylacznie w stolicy (pytanie 70/B). PYTANIE 83=B:
      // maMennicaEmpireWide juz zawiera bramke dostepu do zlota -- gdy brak, false
      // mimo ze budynek dalej stoi (nie jest burzony).
      maMennica:             maMennicaEmpireWide,
      walutaOdkryta,         // P1b: bramka Efektu 1 (razem z maMennica) w cityYieldPerTurn
      walutaMnoznikOverride, // per-cyw skalowany trudnoscia (lub override religii)
      civHandelMult,         // RDY-01: bonus_zloto handel (Grecy +15%)
      civNaukaMult,          // RDY-01: bonus_nauka (Inkowie +15%)
      liczbaAktywnychTrasHandlowych: liczbaTrasHandlowych, // Handel E3: +5%/trasa
      // Zadanie 2 (2026-07-23): Garncarnia +Zywnosc% LOKALNIE -- liczba sztuk w TYM miescie.
      liczbaGarncarni:       runtimeBuiltIds.filter(id => id === 'garncarnia').length,
    };

    // Naprawa 2026-07-25: budynki miasta -> plony flat (Praca/Pieniadz/Zywnosc/Nauka/
    // Kultura) przez cityBuildingEntriesFromBuiltIds (economy.ts) -- jedyne zrodlo,
    // wspoldzielone z previewCityEconomy i cityPanel "Bilans plonow".
    // U-22B: efektywny id Spichlerza (I vs II + Zadowolenie z JSON) zamiast surowych builtIds.
    const yieldBuiltIds = builtIdsForSpichlerzYields(runtimeBuiltIds, spichlerzState);
    const cityBuildings = cityBuildingEntriesFromBuiltIds(yieldBuiltIds, buildingCatalog, ownerEra, ownerTech);
    const yld = cityYieldPerTurn(econCity, worked, cityBuildings, params, ctx);

    const orderMult = orderMultByCity.get(city.id);
    if (orderMult) applyOrderYieldMults(yld, orderMult);
    yld.praca = cityPracaInteger(yld.praca);
    const zywnoscBrutto = yld.zywnoscBrutto;
    const foodBal = computeCityFoodBalanceV85(zywnoscBrutto, city.population, city, rationParams, spichlerzState);
    yld.zywnosc = foodBal.bilansLokalny;
    // +wonder yields (CUDA-EKON-01) — patrz applyWonderCityYields, krok osobny od reszty
    // ekonomii/Pracy (nie dotyka economy.ts ani formul terenu/ulepszen powyzej).
    applyWonderCityYields(yld, wonderCityYieldsByOwner.get(city.ownerId));

    // WIRE 3: Luksus -> Wealth tick
    // wealthState per miasto -- persystowane na city jako pole dynamiczne
    const prevWealth: WealthState = city.wealthState ?? freshWealthState();
    const wealthImmunity = (city.wealthImmunityRemaining ?? 0) > 0;
    const wt: WealthTickResult = advanceWealth(
      prevWealth,
      yld.luksus,      // spoleczMoney = strumien Luksus
      yld.pieniadz,    // miastoMoney  = pieniadz brutto tej tury
      ownerEra,
      wealthParams,
      wealthImmunity ? { minPoziom: 1 } : undefined,
    );
    if (wealthImmunity && city.wealthImmunityRemaining != null) {
      city.wealthImmunityRemaining = Math.max(0, city.wealthImmunityRemaining - 1);
    }
    // Zapisz nowy stan Wealth na obiekt City (dynamiczne pole)
    city.wealthState = { poziom: wt.poziom, pula: wt.pula };

    // Pieniadz po mnozniku Wealth (KONTRAKT: mnozi strumien podatku, nie nauka/luksus)
    const pieniadzPoWealth = Math.floor(yld.pieniadz * wt.mnoznik);
    // Handel E3: dochod dystansowy z tras -- CZYSTO do skarbca, dodany PO mnozniku
    // Wealth (nie jest mnozony przez niego). Kredytowany OBU miastom trasy (Q8=B).
    const pieniadzZTras = tradeIncomeByCity.get(city.id) ?? 0;

    // WIRE 2: splitPraca
    // NAPRAWA CACHE/LIVE (Maciej 2026-08-10, znalezisko B) -- ten sam błąd co w
    // previewCityEconomy (patrz komentarz tam): `city.podzialPracy` jest `undefined` bez
    // lokalnego override, więc realny tick końca tury liczył split ZAWSZE na statycznym
    // `params.suwaakPracaBudynki`, ignorując globalny suwak Pracy gracza. `econCity.podziałPracy`
    // (toEconomyCity → resolveCityPodzialPracy, wyżej) już rozwiązuje override/global poprawnie.
    // / EN: same bug as previewCityEconomy above -- the real end-of-turn tick ignored the
    // global Praca slider for cities without a local override; `econCity.podziałPracy` already
    // resolves it correctly.
    const udzialBudynki = econCity.podziałPracy.procentBudynki / 100;
    const { doBudynkow, doPuli } = splitPraca(yld.praca, udzialBudynki);
    if (ctx.maTargowisko && walutaOdkryta) {
      const pieniadzZPracyPoSplit = Math.floor(doPuli * params.targowiskoPracaMnoznik);
      yld.pieniadz = yld.pieniadz - yld.pieniadzZPracy + pieniadzZPracyPoSplit;
      yld.pieniadzZPracy = pieniadzZPracyPoSplit;
    }

    // WIRE 4: oblezenie -- zegar glodu
    // Gdy city.oblegane === true: pomijamy dochod zywnosci z pol, odejmujemy zuzycie.
    // Gdy false/undefined: zachowanie BEZ ZMIAN (pelna wsteczna kompatybilnosc).
    const isOblegane = city.oblegane === true;
    let magazynPoTurze: number;
    let obleganyGlod = false;

    if (isOblegane) {
      // Brak dochodu zywnosci z pol (magazyn tylko maleje).
      // Zuzycie: kazdy mieszkaniec + kazda jednostka garnizonu zjada 1/ture.
      const garnizon = (city.garnizon != null && city.garnizon > 0) ? city.garnizon : 0;
      const zuzycie = city.population + garnizon;
      const magazynPrzed = getCityFood(city);
      magazynPoTurze = Math.max(0, magazynPrzed - zuzycie);
      obleganyGlod = magazynPoTurze <= 0;

      // Podczas oblezenia: brak wzrostu populacji (populationGrowth nie wola sie).
      // Zapisz magazyn z powrotem.
      city.magazynZywnosci = magazynPoTurze;

      const tick: CityEconomyTick = {
        cityId:            city.id,
        ownerId:           city.ownerId,
        praca:             yld.praca,
        pieniadz:          pieniadzPoWealth + pieniadzZTras,
        pieniadzBrutto:    yld.pieniadz,
        zywnoscNetto:      0,           // brak dochodu podczas oblezenia
        nauka:             yld.nauka,
        luksus:            yld.luksus,
        kultura:           yld.kultura,
        ludnoscPrzed:      city.population,
        ludnoscPo:         city.population, // populacja nie zmienia sie podczas oblezenia
        wzrost:            false,
        ubytek:            false,
        zdrowie,
        doBudynkow,
        doPuli,
        wealthMnoznik:     wt.mnoznik,
        wealthZadowolenie: wt.zadowolenie,
        garncarniaSurplusZadowolenie: garncarniaZadowolenie,
        pieniadzZPracy:    yld.pieniadzZPracy,
        pieniadzZTras,
        oblegany:          true,
        obleganyGlod,
        magazynPoTurze,
        maSpichlerz,
        maSpichlerzII,
        spichlerzCeramika: spichlerzState.ceramikaActive,
        spichlerzSol: spichlerzState.solActive,
        procentRozwoj: Math.round((poziomRacji / 6) * 100),
        zywnoscBrutto: 0,
        kosztRacji: 0,
        bilansLokalny: 0,
        poziomRacji,
      };
      result.perCity.push(tick);

      // Accumulate income for upkeep balance (wliczajac dochod z tras -- Handel E3).
      incomeByOwner.set(city.ownerId, (incomeByOwner.get(city.ownerId) ?? 0) + tick.pieniadz);

      result.cities         += 1;
      result.totalPraca      += yld.praca;
      result.totalPieniadz   += tick.pieniadz;
      result.totalNauka      += yld.nauka;
      result.totalLuksus     += yld.luksus;
      result.totalKultura    += yld.kultura;
      result.totalZywnosc    += 0;   // brak dochodu zywnosci z pol podczas oblezenia
      result.totalPracaPula  += doPuli;
      // brak wzrostu/ubytku populacji podczas oblezenia

      continue;
    }

    // --- Normalna sciezka (nie oblegane) — PYTANIE-85: bilans lokalny, wzrost po centrali ---

    const before = city.population;
    const growthPreview = computeGrowthPercentV85({
      population: city.population,
      poziomRacji: foodBal.poziomRacji,
      zdrowie,
      szczescieNetto: 0,
      wealthPoziom: wt.poziom,
      spichlerzState,
      civKey: ownerCivKey ?? null,
      rationParams,
    });

    const ownerEpoka = ownerEra;
    const mpMults = civManpowerMults(ownerBonusy);
    if (city.manpower === undefined) {
      city.manpower = cityManpowerMax(city.population, ownerEpoka, mpMults.maxMult);
    }
    city.manpower = tickManpowerRegen(
      city,
      ownerEpoka,
      loadManpowerRegenParams(),
      mpMults.regenMult,
      mpMults.maxMult,
    );

    magazynPoTurze = city.wzrostUlamkowy ?? 0;

    incomeByOwner.set(city.ownerId, (incomeByOwner.get(city.ownerId) ?? 0) + pieniadzPoWealth + pieniadzZTras);

    const tick: CityEconomyTick = {
      cityId:            city.id,
      ownerId:           city.ownerId,
      praca:             yld.praca,
      pieniadz:          pieniadzPoWealth + pieniadzZTras,
      pieniadzBrutto:    yld.pieniadz,
      zywnoscNetto:      foodBal.bilansLokalny,
      nauka:             yld.nauka,
      luksus:            yld.luksus,
      kultura:           yld.kultura,
      ludnoscPrzed:      before,
      ludnoscPo:         before,
      wzrost:            false,
      ubytek:            false,
      zdrowie,
      doBudynkow,
      doPuli,
      wealthMnoznik:     wt.mnoznik,
      wealthZadowolenie: wt.zadowolenie,
      garncarniaSurplusZadowolenie: garncarniaZadowolenie,
      pieniadzZPracy:    yld.pieniadzZPracy,
      pieniadzZTras,
      oblegany:          false,
      obleganyGlod:      false,
      magazynPoTurze,
      maSpichlerz,
      maSpichlerzII,
      spichlerzCeramika: spichlerzState.ceramikaActive,
      spichlerzSol: spichlerzState.solActive,
      procentRozwoj: Math.round((poziomRacji / 6) * 100),
      zywnoscBrutto,
      kosztRacji: foodBal.kosztRacji,
      bilansLokalny: foodBal.bilansLokalny,
      poziomRacji,
      wzrostProcent: growthPreview.total,
      wzrostUlamkowyPo: city.wzrostUlamkowy ?? 0,
    };
    result.perCity.push(tick);

    result.cities         += 1;
    result.totalPraca      += yld.praca;
    result.totalPieniadz   += tick.pieniadz;
    result.totalNauka      += yld.nauka;
    result.totalLuksus     += yld.luksus;
    result.totalKultura    += yld.kultura;
    result.totalZywnosc    += foodBal.bilansLokalny;
    result.totalPracaPula  += doPuli;
  }

  // PYTANIE-84-U-13: drain Mennicy po plonach (łaska = efekt bez pobrania Złota).
  applyMennicaZlotoDrainForOwners(
    cities,
    mennicaOwners,
    resolveOwnerTech,
    playerZbadane,
    resolveOwnerZlotoAccess,
  );

  // SUROW-CIV-01: klamruj sumę city.surowce po pipeline (teren + konwertery + drain Spichlerza).
  reconcileOwnerResourceCaps(cities, ownerResourceCapFor);

  // --- Compute upkeep balance per owner (s.6.4 / s.8.4) ---
  // Collect all unique owner IDs across cities + units.
  const ownerIds = new Set<number>([
    ...cities.map(c => c.ownerId),
    ...econUnits.map(u => u.ownerId),
  ]);
  const buildingsByOwner = new Map<number, BuildingInstanceLike[]>();
  for (const city of cities) {
    const builtIds = builtByCity.get(city.id) ?? [];
    if (builtIds.length === 0) continue;
    const ownerEra = resolveOwnerEra
      ? resolveOwnerEra(city.ownerId)
      : (city.ownerId === 0 ? playerEra : 1);
    const ownerTech = resolveOwnerTech
      ? resolveOwnerTech(city.ownerId)
      : playerZbadane;
    const list = buildingsByOwner.get(city.ownerId) ?? [];
    for (const bid of builtIds) {
      const bdef = data.buildings.find(b => b.id === bid);
      if (!bdef) continue;
      const level = buildingLevelForEpoch(
        bdef.epokaWejscia,
        ownerEra,
        bdef.maksPoziom,
        bdef.poziomTechGate,
        ownerTech,
      );
      list.push({ record: bdef as unknown as BuildingRecord, level });
    }
    buildingsByOwner.set(city.ownerId, list);
  }
  for (const oid of ownerIds) {
    const income  = incomeByOwner.get(oid) ?? 0;
    const ounits  = econUnits.filter(u => u.ownerId === oid) as unknown as UnitUpkeepLike[];
    const balance = upkeepBalance(income, buildingsByOwner.get(oid) ?? [], ounits, unitUpkeepTbl, upkeepParams);
    result.upkeepByOwner.set(oid, balance);
    const resUpkeep: Record<string, number> = totalBuildingResourceUpkeep(
      buildingsByOwner.get(oid) ?? [],
    );
    addResourceCosts(
      resUpkeep,
      totalUnitResourceUpkeep(ounits, typeId =>
        data.units.find(u => u.Jednostka === typeId),
      ),
    );
    result.resourceUpkeepByOwner.set(oid, resUpkeep);
  }

  if (manpowerHeal) {
    tickManpowerUnitReplenishment(
      cities,
      manpowerHeal.units,
      difficulty,
      resolveOwnerEra ?? ((oid: number) => (oid === 0 ? playerEra : 1)),
      (oid: number) => {
        const key = ownerCivByOwnerId.get(oid);
        return key ? civBonusyForCivKey(key, data.civs) : [];
      },
      manpowerHeal.getMaxHp,
    );
  }

  return result;
}
