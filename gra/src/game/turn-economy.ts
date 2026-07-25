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
 *   We map runtime -> EconomyCity each turn, run cityYieldPerTurn() and
 *   populationGrowth(), then write the results back onto the runtime City.
 *
 * Scope (task 13B):
 *   - Real terrain-driven yields from the city centre + its 6 neighbour hexes.
 *   - Population growth / starvation driven by net food, with a persisted food
 *     store (magazynZywnosci) so surplus accumulates across turns.
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
import type { City } from './cities';
import { normalizePodzialHandlu } from './cities';
import {
  cityYieldPerTurn,
  populationGrowth,
  civBonusyForCivKey,
  civEconomyYieldMultipliers,
  tileYield,
  type EconParams,
  type EconomyCity,
  type WorkedTile,
  type CityYieldContext,
  type BuildingRecord,
  cityBuildingEntriesFromBuiltIds,
} from './economy';
import {
  improvementKeysForHex,
  territoryResourceYieldForImprovement,
  RESOURCE_UPKEEP_IMPROVEMENT_KEYS,
  type TerritoryResourceKey,
} from './terrain-improvements';
import { cityManpowerMax, refreshManpowerAfterPopChange, tickManpowerRegen, civManpowerMults, loadManpowerRegenParams } from './manpower';
import {
  loadStorageParams,
  foodStorageCapacity,
  readCityFoodBuffer,
  loadUpkeepParams,
  buildUnitUpkeepTable,
  upkeepBalance,
  loadOwnerStorageParams,
  ownerResourceCapacityPerType,
  reconcileOwnerResourceCaps,
  type UpkeepParams,
  type UnitFoodLike,
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
  type RawConverterParamsJson,
} from './converters';
import {
  splitPraca,
  cityPracaInteger,
  buildingLevelForEpoch,
} from './production';
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
import { getCityFoodSplit } from './empire-food';
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

/** B-KULT-REL-Q3A — mnożnik handlu z religii (gate: Waluta + Mennica + dominująca wiara). */
function religionTradeWalutaOverride(
  cityReligion: ReligionState | undefined,
  ownerCivKey: string | undefined,
  builtIds: readonly string[],
  walutaOdkryta: boolean,
  civs: GameData['civs'],
  societyParams: GameData['societyParams'],
  difficulty: Difficulty,
): number | undefined {
  if (!walutaOdkryta || !builtIds.includes('mennica') || !cityReligion) return undefined;
  const civName = civDisplayNameForKey(ownerCivKey, civs);
  if (!civName) return undefined;
  const rp = loadReligionParams(societyParams, difficulty);
  const trade = cityTradeMultiplier(
    cityReligion, civName, civs as unknown as import('./culture-religion').CivsDataLike, rp, true,
  );
  return trade.applied ? trade.multiplier : undefined;
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
    akweduktMaxLudnosci:            num(em, 'akwedukt_max_ludnosci', 15),
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
    budynekMennicaMnoznik:          num(bu, 'budynek_mennica_mnoznik', 1),
    mennicaMnoznikPoWalucie:        num(gl, 'mennica_mnoznik_po_walucie', 1.5),
    walutaMnoznik:                  num(bu, 'waluta_mnoznik', 2),
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
  const maCeramike   = builtIds.includes('garncarnia');

  // Bonusy
  if (maRzeke)      z += hp.rzeka;
  if (maAkwedukt)   z += hp.akwedukt;
  if (maStudnie)    z += hp.studnia;
  if (maTargowisko) z += hp.targowisko;
  if (maCeramike)   z += hp.ceramika;

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
  const maCeramike   = builtIds.includes('garncarnia');

  if (maRzeke)      lines.push({ label: 'Rzeka', value: hp.rzeka });
  if (maAkwedukt)   lines.push({ label: 'Akwedukt', value: hp.akwedukt });
  if (maStudnie)    lines.push({ label: 'Studnia', value: hp.studnia });
  if (maTargowisko) lines.push({ label: 'Targowisko', value: hp.targowisko });
  if (maCeramike)   lines.push({ label: 'Ceramika', value: hp.ceramika });

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
  const assigned = resolveWorkedTiles(city, map, yieldOf, {
    radius,
    territoryNodes,
    ownerId: city.ownerId,
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
): EconomyCity {
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
    podziałHandlu: normalizePodzialHandlu(city.podzialHandlu ?? {
      procentNauka:    params.suwaakHandelNaukaDefault,
      procentPieniadz: params.suwaakHandelPieniadz,
      procentLuksus:   params.suwaakHandelLuksus,
    }),
    podziałPracy: city.podzialPracy ?? {
      procentBudynki: params.suwaakPracaBudynki,
    },
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
  /** B5: % netto żywności tego miasta na wzrost ludności (reszta → zapasy armii). */
  procentRozwoj:  number;
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
}

export type OwnerEraResolver = (ownerId: number) => number;
export type OwnerTechResolver = (ownerId: number) => ReadonlySet<string>;

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

  const perCity: CityEconomyTick[] = [];
  const capitalSeen = new Set<number>();

  for (const city of cities) {
    const isCapital = !capitalSeen.has(city.ownerId);
    capitalSeen.add(city.ownerId);

    const worked = cityWorkedTilesForEconomy(city, map, territoryNodes);
    const builtIds = builtByCity.get(city.id) ?? [];
    const hasWater = cityHasWaterAccess(city, map);
    const zdrowie = computeCityHealth(city.population, worked, builtIds, healthParams, hasWater, { city, map });

    const maSpichlerzII = builtIds.includes('spichlerz_ii');
    const maSpichlerz = maSpichlerzII || builtIds.includes('spichlerz');
    const maAkwedukt = builtIds.includes('akwedukt');
    const pctRozwoj = getCityFoodSplit(city);
    const econCity = toEconomyCity(city, params, isCapital, zdrowie, { maSpichlerz, maSpichlerzII, maAkwedukt });

    const ownerEra = resolveOwnerEra
      ? resolveOwnerEra(city.ownerId)
      : (city.ownerId === 0 ? playerEra : 1);
    const ownerTech = resolveOwnerTech
      ? resolveOwnerTech(city.ownerId)
      : playerZbadane;
    const walutaOdkryta = ownerTech.has('Waluta') || ownerTech.has('waluta');
    const ownerCivKey = ownerCivByOwnerId.get(city.ownerId);
    const cityReligion = cityReligionByCityId.get(city.id);
    const walutaMnoznikOverride = religionTradeWalutaOverride(
      cityReligion,
      ownerCivKey,
      builtIds,
      walutaOdkryta,
      data.civs,
      data.societyParams,
      difficulty,
    );
    const ownerBonusy = ownerCivKey
      ? civBonusyForCivKey(ownerCivKey, data.civs)
      : [];
    const { handel: civHandelMult, nauka: civNaukaMult } = civEconomyYieldMultipliers(ownerBonusy);
    const liczbaTrasHandlowych = tradeRouteCountByCity.get(city.id) ?? 0;
    const ctx: CityYieldContext = {
      wojskoZuzycieZywnosci: 0,
      strataFraction: 0,
      maMlyn: builtIds.includes('mlyn'),
      maCegielnia: builtIds.includes('cegielnia'),
      maTargowisko: builtIds.includes('targowisko'),
      maBiblioteka: builtIds.includes('biblioteka'),
      maAkademia: builtIds.includes('akademia'),
      maMennica: builtIds.includes('mennica'),
      // Zadanie 1 (E1): Mennica dziala TYLKO gdy zbudowana ORAZ Waluta odkryta (spojne
      // z tym, ze Mennica i tak wymaga techu Waluta do postawienia -- patrz buildings.json).
      mennicaMnoznik: (builtIds.includes('mennica') && walutaOdkryta)
        ? params.mennicaMnoznikPoWalucie
        : 1,
      walutaOdkryta,
      walutaMnoznikOverride,
      civHandelMult,
      civNaukaMult,
      liczbaAktywnychTrasHandlowych: liczbaTrasHandlowych,
      // Zadanie 2 (2026-07-23): Garncarnia +Zywnosc% LOKALNIE -- liczba sztuk w TYM miescie.
      liczbaGarncarni: builtIds.filter(id => id === 'garncarnia').length,
    };

    // Naprawa 2026-07-25: budynki miasta -> plony flat (Praca/Pieniadz/Zywnosc/Nauka/
    // Kultura) przez cityBuildingEntriesFromBuiltIds (economy.ts) -- ta sama funkcja
    // uzywana w advanceCityEconomy i cityPanel "Bilans plonow", zeby podglad HUD
    // pokazywal identyczne liczby co realny silnik tury.
    const cityBuildings = cityBuildingEntriesFromBuiltIds(builtIds, buildingCatalog, ownerEra, ownerTech);
    const yld = cityYieldPerTurn(econCity, worked, cityBuildings, params, ctx);
    const orderMult = orderMultByCity.get(city.id);
    if (orderMult) applyOrderYieldMults(yld, orderMult);
    yld.praca = cityPracaInteger(yld.praca);
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

    const udzialBudynki = (city.podzialPracy?.procentBudynki ?? params.suwaakPracaBudynki) / 100;
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
        pieniadzZPracy: yld.pieniadzZPracy,
        pieniadzZTras,
        oblegany: true,
        obleganyGlod: getCityFood(city) <= 0,
        magazynPoTurze: getCityFood(city),
        maSpichlerz,
        maSpichlerzII,
        procentRozwoj: pctRozwoj,
      });
      continue;
    }

    perCity.push({
      cityId: city.id,
      ownerId: city.ownerId,
      praca: yld.praca,
      pieniadz: pieniadzPoWealth + pieniadzZTras,
      pieniadzBrutto: yld.pieniadz,
      zywnoscNetto: yld.zywnosc,
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
      pieniadzZPracy: yld.pieniadzZPracy,
      pieniadzZTras,
      oblegany: false,
      obleganyGlod: false,
      magazynPoTurze: getCityFood(city),
      maSpichlerz,
      maSpichlerzII,
      procentRozwoj: pctRozwoj,
    });
  }

  return { perCity };
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
    if (bIds.includes('stolarnia')) {
      stolarniaCountByOwner.set(c.ownerId, (stolarniaCountByOwner.get(c.ownerId) ?? 0) + 1);
    }
    if (bIds.includes('kamieniarski')) {
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
    pracaUpkeepByOwner,
  };

  // --- Per-owner income accumulators (for upkeep balance after city loop) ---
  const incomeByOwner = new Map<number, number>();

  for (const city of cities) {
    const isCapital = !capitalSeen.has(city.ownerId);
    capitalSeen.add(city.ownerId);

    const worked    = cityWorkedTilesForEconomy(city, map, territoryNodes);
    const builtIds  = builtByCity.get(city.id) ?? [];

    // WIRE 1: oblicz zdrowie miasta (D17-A: dostęp do wody z mapy, nie tylko pól plonów)
    const hasWater = cityHasWaterAccess(city, map);
    const zdrowie = computeCityHealth(city.population, worked, builtIds, healthParams, hasWater, { city, map });

    const maSpichlerzII = builtIds.includes('spichlerz_ii');
    const maSpichlerz = maSpichlerzII || builtIds.includes('spichlerz');
    const maAkwedukt  = builtIds.includes('akwedukt');
    const pctRozwoj = getCityFoodSplit(city);
    const econCity = toEconomyCity(city, params, isCapital, zdrowie, { maSpichlerz, maSpichlerzII, maAkwedukt });

    const ownerEra = resolveOwnerEra
      ? resolveOwnerEra(city.ownerId)
      : (city.ownerId === 0 ? playerEra : 1);
    const ownerTech = resolveOwnerTech
      ? resolveOwnerTech(city.ownerId)
      : playerZbadane;
    const walutaOdkryta = ownerTech.has('Waluta') || ownerTech.has('waluta');
    const ownerCivKey = ownerCivByOwnerId.get(city.ownerId);
    const cityReligion = cityReligionByCityId.get(city.id);
    const walutaMnoznikOverride = religionTradeWalutaOverride(
      cityReligion,
      ownerCivKey,
      builtIds,
      walutaOdkryta,
      data.civs,
      data.societyParams,
      difficulty,
    );
    const ownerBonusy = ownerCivKey
      ? civBonusyForCivKey(ownerCivKey, data.civs)
      : [];
    const { handel: civHandelMult, nauka: civNaukaMult } = civEconomyYieldMultipliers(ownerBonusy);
    const liczbaTrasHandlowych = tradeRouteCountByCity.get(city.id) ?? 0;
    const ctx: CityYieldContext = {
      wojskoZuzycieZywnosci: 0,   // B5: wojsko → zapasy państwa (advanceEmpireFood)
      strataFraction:        0,   // no distance-corruption tracking yet
      maMlyn:                builtIds.includes('mlyn'),
      maCegielnia:           builtIds.includes('cegielnia'),
      maTargowisko:          builtIds.includes('targowisko'),
      maBiblioteka:          builtIds.includes('biblioteka'),
      maAkademia:            builtIds.includes('akademia'),
      maMennica:             builtIds.includes('mennica'),
      // Zadanie 1 (E1): Mennica dziala TYLKO gdy zbudowana ORAZ Waluta odkryta (spojne
      // z tym, ze Mennica i tak wymaga techu Waluta do postawienia -- patrz buildings.json).
      mennicaMnoznik:        (builtIds.includes('mennica') && walutaOdkryta)
        ? params.mennicaMnoznikPoWalucie
        : 1,
      walutaOdkryta,         // P1b: mnoznik Handel->Pieniadz gdy Waluta zbadana
      walutaMnoznikOverride, // RDY-11: per-cyw 1.7-2.4 gdy ownerCivByOwnerId podane
      civHandelMult,         // RDY-01: bonus_zloto handel (Grecy +15%)
      civNaukaMult,          // RDY-01: bonus_nauka (Inkowie +15%)
      liczbaAktywnychTrasHandlowych: liczbaTrasHandlowych, // Handel E3: +5%/trasa
      // Zadanie 2 (2026-07-23): Garncarnia +Zywnosc% LOKALNIE -- liczba sztuk w TYM miescie.
      liczbaGarncarni:       builtIds.filter(id => id === 'garncarnia').length,
    };

    // Naprawa 2026-07-25: budynki miasta -> plony flat (Praca/Pieniadz/Zywnosc/Nauka/
    // Kultura) przez cityBuildingEntriesFromBuiltIds (economy.ts) -- jedyne zrodlo,
    // wspoldzielone z previewCityEconomy i cityPanel "Bilans plonow".
    const cityBuildings = cityBuildingEntriesFromBuiltIds(builtIds, buildingCatalog, ownerEra, ownerTech);
    const yld = cityYieldPerTurn(econCity, worked, cityBuildings, params, ctx);

    const orderMult = orderMultByCity.get(city.id);
    if (orderMult) applyOrderYieldMults(yld, orderMult);
    yld.praca = cityPracaInteger(yld.praca);
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
    const udzialBudynki = (city.podzialPracy?.procentBudynki ?? params.suwaakPracaBudynki) / 100;
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
        pieniadzZPracy:    yld.pieniadzZPracy,
        pieniadzZTras,
        oblegany:          true,
        obleganyGlod,
        magazynPoTurze,
        maSpichlerz,
        maSpichlerzII,
        procentRozwoj: pctRozwoj,
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

    // --- Normalna sciezka (nie oblegane) -- BEZ ZMIAN wzgledem oryginalu ---

    // growthMult (7.4): scale food inflow BEFORE populationGrowth so the
    // threshold crossing is affected.  growthMult < 1 under unrest slows growth
    // (food accumulates slower); growthMult > 1 speeds it up.  Default = 1 (no effect).
    const surplus = Math.max(0, yld.zywnosc) * (pctRozwoj / 100);
    const deficit = Math.min(0, yld.zywnosc);
    const zywnoscDoRozwoju = surplus + deficit;
    const growthMult = growthMultByCity.get(city.id) ?? 1;
    const zywnoscDlaWzrostu = growthMult !== 1
      ? zywnoscDoRozwoju * growthMult
      : zywnoscDoRozwoju;

    const wzrostThresholdMult = getPopulationGrowthThresholdMultiplier(
      city.ownerId,
      wzrostLudnosciPace,
      gameDifficulty,
    );
    const grow = populationGrowth(econCity, zywnoscDlaWzrostu, params, wzrostThresholdMult);

    const before = city.population;

    // --- write results back onto the runtime city ---
    city.population = grow.nowaLudnosc;

    if (grow.nowaLudnosc !== before) {
      rebalanceWorkersAfterPopulationChange(city, map, before, grow.nowaLudnosc, territoryNodes);
    }

    const ownerEpoka = ownerEra;
    const mpMults = civManpowerMults(ownerBonusy);
    if (city.manpower === undefined) {
      city.manpower = cityManpowerMax(city.population, ownerEpoka, mpMults.maxMult);
    } else if (grow.nowaLudnosc !== before) {
      city.manpower = refreshManpowerAfterPopChange(city, ownerEpoka, before, mpMults.maxMult);
    }
    city.manpower = tickManpowerRegen(
      city,
      ownerEpoka,
      loadManpowerRegenParams(),
      mpMults.regenMult,
      mpMults.maxMult,
    );

    // Clamp bufor wzrostu to capacity (s.7.1 — nadwyżka ponad cap ginie).
    // Cap >= próg wzrostu: inaczej przy cap=20 i progu=22 miasto utknęło by na +1/t.
    const foodCap = growthFoodStorageCap(
      city.population, maSpichlerz, params, storageParams,
      wzrostLudnosciPace, city.ownerId, gameDifficulty,
    );
    city.magazynZywnosci = Math.min(grow.nowyMagazynZywnosci, foodCap);
    magazynPoTurze = city.magazynZywnosci;

    // Accumulate income for upkeep balance (pieniadz po Wealth + dochod z tras -- Handel E3).
    incomeByOwner.set(city.ownerId, (incomeByOwner.get(city.ownerId) ?? 0) + pieniadzPoWealth + pieniadzZTras);

    // --- Converters (s.1.5) -- run after terrain yield, per-city (Zadanie 2 E1) ---
    // City.surowce jest teraz realnym polem runtime (game/cities.ts).
    //
    // SUROW-TERYT-01 (Maciej 2026-07-23): surowce logistyczne (drewno/kamien/glina/
    // ruda/ruda_zelaza) NIE plyna juz z yld.*Terenu (ktore zalezaly od workedTiles --
    // pola obsadzone populacja). Zamiast tego kazde ZBUDOWANE ulepszenie w terytorium
    // wlasciciela produkuje stala stawke/ture, niezaleznie od obsadzenia -- patrz
    // computeTerritoryResourceYieldByCity (liczone raz dla calej tury, powyzej petli).
    // Zywnosc i Praca ZOSTAJA przy modelu workedTiles (yld.zywnosc/yld.praca -- bez zmian).
    // SUROW-CIV-01 (Maciej 2026-07-24): resCap uzywany jako sufit PODCZAS produkcji/
    // konwersji w TYM miescie jest teraz capem CALEGO PANSTWA (nie per-miasto x5 jak
    // dawniej) -- prawdziwe ograniczenie to SUMA po miastach ownera, egzekwowana RAZ
    // na ture PO petli (reconcileOwnerResourceCaps, patrz nizej). Uzycie capu panstwa
    // tutaj tylko zapobiega patologicznemu wzrostowi w jednej turze; nie blokuje
    // pojedynczego miasta ponizej realnej pojemnosci panstwa.
    const resCap = ownerResourceCapFor(city.ownerId);
    if (!city.surowce) city.surowce = {};
    const citySurowce: Record<string, number> = city.surowce;
    // Produkcja per-ulepszenie (SUROW-TERYT-01, f136c09) × mnoznik civ-wide bonusow
    // (Stolarnia drewno / Warsztat kamieniarski kamien, Zadanie 2 2026-07-23): stala liczba
    // sztuk tego ownera (policzona przed petla) → mnoznik ten sam dla kazdego miasta ownera
    // = odpowiednik przemnozenia SUMY drewna/kamienia imperium przez (1 + 0.10 × liczba_ownera).
    const terrYield = territoryResourceByCity.get(city.id);
    const drewnoMultCiv = 1 + stolarniaBonusDrewnaCiv * (stolarniaCountByOwner.get(city.ownerId) ?? 0);
    const kamienMultCiv = 1 + kamieniarskiBonusKamieniaCiv * (kamieniarskiCountByOwner.get(city.ownerId) ?? 0);
    citySurowce.drewno = Math.min(resCap, (citySurowce.drewno ?? 0) + Math.floor((terrYield?.drewno ?? 0) * drewnoMultCiv));
    citySurowce.kamien = Math.min(resCap, (citySurowce.kamien ?? 0) + Math.floor((terrYield?.kamien ?? 0) * kamienMultCiv));
    citySurowce.glina  = Math.min(resCap, (citySurowce.glina ?? 0) + (terrYield?.glina ?? 0));

    // Ruda miedzi / ruda żelaza — numeryczny stock do łańcucha konwerterów (audit 9a0ca985).
    citySurowce.ruda = Math.min(resCap, (citySurowce.ruda ?? 0) + (terrYield?.ruda ?? 0));
    citySurowce.ruda_zelaza = Math.min(resCap, (citySurowce.ruda_zelaza ?? 0) + (terrYield?.ruda_zelaza ?? 0));

    // Uruchamiamy tylko konwertery, ktorych budynek jest FAKTYCZNIE wybudowany w tym
    // miescie (inaczej drewno konwertowaloby sie samoistnie bez Cegielni/Garncarni/...).
    // Uwaga: 'tartak' i 'huta' (id w DEFAULT_CONVERTER_RECIPES) nie maja dzis
    // odpowiednika w buildings.json (Tartak istnieje tylko jako ulepszenie terenu;
    // Huta w ogole nie istnieje -- zastapiona przez 'odlewnia_brazu') -- te dwie
    // receptury pozostaja wiec nieaktywne, to pre-istniejacy stan danych, nie regresja.
    const activeRecipes = DEFAULT_CONVERTER_RECIPES.filter(r => builtIds.includes(r.id));
    if (activeRecipes.length > 0) {
      const convResult = runConverters(
        activeRecipes,
        citySurowce,
        converterThroughputs,
        () => resCap,
      );
      city.surowce = convResult.stores;
    }

    const tick: CityEconomyTick = {
      cityId:            city.id,
      ownerId:           city.ownerId,
      praca:             yld.praca,
      pieniadz:          pieniadzPoWealth + pieniadzZTras,
      pieniadzBrutto:    yld.pieniadz,
      zywnoscNetto:      yld.zywnosc,
      nauka:             yld.nauka,
      luksus:            yld.luksus,
      kultura:           yld.kultura,
      ludnoscPrzed:      before,
      ludnoscPo:         grow.nowaLudnosc,
      wzrost:            grow.wzrost,
      ubytek:            grow.ubytek,
      zdrowie,
      doBudynkow,
      doPuli,
      wealthMnoznik:     wt.mnoznik,
      wealthZadowolenie: wt.zadowolenie,
      pieniadzZPracy:    yld.pieniadzZPracy,
      pieniadzZTras,
      oblegany:          false,
      obleganyGlod:      false,
      magazynPoTurze,
      maSpichlerz,
      maSpichlerzII,
      procentRozwoj: pctRozwoj,
    };
    result.perCity.push(tick);

    result.cities         += 1;
    result.totalPraca      += yld.praca;
    result.totalPieniadz   += tick.pieniadz;
    result.totalNauka      += yld.nauka;
    result.totalLuksus     += yld.luksus;
    result.totalKultura    += yld.kultura;
    result.totalZywnosc    += yld.zywnosc;
    result.totalPracaPula  += doPuli;
    if (grow.wzrost) result.growth  += 1;
    if (grow.ubytek) result.starved += 1;
  }

  // SUROW-CIV-01 (Maciej 2026-07-24): RAZ na ture, PO ze produkcja+konwersja lokalna
  // (petla powyzej) sie zakonczyla -- klamruj SUME city.surowce po miastach KAZDEGO
  // ownera do capu panstwa (ownerResourceCapFor). OWNERID-AGNOSTIC: reconcileOwnerResourceCaps
  // iteruje po WSZYSTKICH ownerId obecnych w `cities` (gracz i kazda cywilizacja AI
  // identycznie) -- zero galezi "tylko gracz". Nadwyzka ginie z miast o najwiekszym
  // zapasie danego typu najpierw (deterministycznie, patrz komentarz w economy-upkeep.ts).
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
  }

  return result;
}
