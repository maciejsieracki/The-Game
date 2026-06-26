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
 */

import type { GameMap } from '../types/map';
import type { Hex } from '../types/hex';
import { Nakladka, TerenBazowy } from '../types/hex';
import type { GameData } from '../data/loader';
import type { City } from './cities';
import {
  cityYieldPerTurn,
  populationGrowth,
  type EconParams,
  type EconomyCity,
  type WorkedTile,
  type CityBuildingEntry,
  type CityYieldContext,
} from './economy';
import {
  loadStorageParams,
  foodStorageCapacity,
  resourceStorageCapacityPerType,
  loadUpkeepParams,
  militaryFoodConsumption,
  buildUnitUpkeepTable,
  upkeepBalance,
  type UpkeepParams,
  type UnitFoodLike,
  type UnitUpkeepLike,
  type UpkeepBalance,
} from './economy-upkeep';
import {
  runConverters,
  loadThroughput,
  DEFAULT_CONVERTER_RECIPES,
  type RawConverterParamsJson,
} from './converters';
import {
  splitPraca,
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
  type TileYield as OkolicaTileYield,
} from './okolica';

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
  };
  const em = raw.ekonomia_miasta ?? {};
  const bu = raw.budynki ?? {};
  const d = difficulty;

  const num = (group: Record<string, Record<string, number>>, key: string, fallback: number): number => {
    const row = group[key];
    const v = row ? row[d] : undefined;
    return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  };

  return {
    progWzrostuWspolczynnik:        num(em, 'próg_wzrostu_wspolczynnik', 8),
    spichlerzZachowaniePoPrzroscie: num(em, 'spichlerz_zachowanie_po_wzroscie', 0.5),
    akweduktProgLudnosci:           num(em, 'akwedukt_prog_ludnosci', 6),
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
    budynekMennicaMnoznik:          num(bu, 'budynek_mennica_mnoznik', 1),
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
  studnia:          number;  // bonus: Studnia/Laznia
  targowisko:       number;  // bonus: Targowisko
  ceramika:         number;  // bonus: Ceramika
  maleMiastoBonus:  number;  // bonus: pop <= prog zagoszczenia
  karaZagoszczenie: number;  // kara/1 pop > prog (ujemna)
  progZagoszczenia: number;  // prog populacji dla zagoszczenia
  karaBagno:        number;  // kara: bagno w okolicy (ujemna)
  karaDzungla:      number;  // kara: dzungla (Nakladka.Las traktowana jako las -- brak Dzungla w v0.1)
  karaBrakWody:     number;  // kara: brak rzeki+studni+akweduktu (ujemna)
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

  return {
    rzeka:            rd('zdrowie_rzeka', 2),
    akwedukt:         rd('zdrowie_akwedukt', 4),
    studnia:          rd('zdrowie_studnia', 2),
    targowisko:       rd('zdrowie_targowisko', 2),
    ceramika:         rd('zdrowie_ceramika', 1),
    maleMiastoBonus:  rd('zdrowie_male_miasto_bonus', 1),
    karaZagoszczenie: rd('zdrowie_kara_zagęszczenie', -1),
    progZagoszczenia: rd('zdrowie_prog_zagęszczenia', 4),
    karaBagno:        rd('zdrowie_kara_bagno', -1),
    karaDzungla:      rd('zdrowie_kara_dzungla', -1),
    karaBrakWody:     rd('zdrowie_kara_brak_wody', -2),
  };
}

/**
 * Oblicz punkty zdrowia miasta na podstawie terenu i budynkow.
 *
 * @param ludnosc       populacja miasta
 * @param tiles         obrobione heksy miasta (centrum + sasiedzi)
 * @param builtIds      id wybudowanych budynkow w miescie
 * @param hp            parametry zdrowia z society-params.json
 */
function computeCityHealth(
  ludnosc: number,
  tiles: WorkedTile[],
  builtIds: readonly string[],
  hp: HealthParams,
): number {
  let z = 0;

  // Flagi terenu -- skanujemy tile'e centrum i okolicy
  let maRzeke   = false;
  // W v0.1 brak TerenBazowy.Bagno / Dzungla -- les (Nakladka.Las) nie jest kara.
  // Zakladamy: brak kary za bagno/dzungle do czasu pojawienia sie tych TerenBazowy.

  for (const t of tiles) {
    if (t.maRzeke) { maRzeke = true; break; }
  }

  // Flagi budynkow
  const maStudnie    = builtIds.includes('studnia');
  const maTargowisko = builtIds.includes('targowisko');
  const maAkwedukt   = builtIds.includes('akwedukt');
  const maCeramike   = builtIds.includes('ceramika');

  // Bonusy
  if (maRzeke)      z += hp.rzeka;
  if (maAkwedukt)   z += hp.akwedukt;
  if (maStudnie)    z += hp.studnia;
  if (maTargowisko) z += hp.targowisko;
  if (maCeramike)   z += hp.ceramika;

  // Bonus: male miasto (pop <= prog zagoszczenia)
  if (ludnosc <= hp.progZagoszczenia) z += hp.maleMiastoBonus;

  // Kara zagoszczenia (per dodatkowy punkt pop powyzej progu)
  if (ludnosc > hp.progZagoszczenia) {
    z += hp.karaZagoszczenie * (ludnosc - hp.progZagoszczenia);
  }

  // Kara brak wody
  if (!maRzeke && !maStudnie && !maAkwedukt) z += hp.karaBrakWody;

  return Math.round(z);  // zwracamy integer (pkt zdrowia)
}

// ---------------------------------------------------------------------------
// Worked-tile gathering
// ---------------------------------------------------------------------------

/** Pointy-top axial neighbour offsets (matches units/setup.ts HEX_NEIGHBORS). */
const HEX_NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [+1,  0], [-1,  0], [ 0, +1], [ 0, -1], [+1, -1], [-1, +1],
];

function hexToWorkedTile(hex: Hex): WorkedTile {
  return {
    terenBazowy: hex.terenBazowy,
    nakladka:    hex.nakladka ?? Nakladka.Brak,
    maRzeke:     !!(hex.rzeka && hex.rzeka.obecna),
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
 * Plony modelu PRZYPISANYCH POL (2026-06-25, decyzja Naster):
 *   - Centrum miasta ZAWSZE produkuje baze (niezaleznie od obywateli).
 *   - Pozostale plony = suma N najlepszych pol w zasiegu, gdzie N = populacja,
 *     zasieg = cityRangeForPopulation(population) = min(pop, cap=15).
 *   - Pola bez przypisanego obywatela nie wchodza do sumy plonow.
 *
 * Zwraca WorkedTile[] = [centrum, ...N_przypisanych_pol].
 * Uzywa identycznego zrodla plonow (hexToWorkedTile) co workedTilesForCity.
 * Ranking pol: inline logika tileYield (zywnosc+praca+handel, wagi 1/1/1).
 * UWAGA: inline TERRAIN_YIELDS musi byc zsynchronizowane z economy.ts.
 */
export function cityWorkedTilesForEconomy(city: City, map: GameMap): WorkedTile[] {
  const tiles: WorkedTile[] = [];

  // Centrum ZAWSZE daje baze plonow.
  const centreHex = map.hexes[`${city.q},${city.r}`];
  if (centreHex) tiles.push(hexToWorkedTile(centreHex));

  // N = populacja; pop=0 -> tylko centrum.
  const pop = Math.max(0, Math.floor(city.population ?? 0));
  if (pop <= 0) return tiles;

  // Zasieg okolicy wg nowego modelu: min(pop, cap=15).
  const radius = cityRangeForPopulation(pop);

  // Inline logika tileYield dla rankowania pol (musi byc zsync z economy.ts TERRAIN_YIELDS).
  // Uzywamy jako yieldOf do assignWorkedTiles (rankowanie score = zywnosc+praca+handel).
  const TERRAIN_SCORE: Record<string, { zywnosc: number; praca: number; handel: number }> = {
    laka:     { zywnosc: 4, praca: 1, handel: 1 },
    rownina:  { zywnosc: 2, praca: 1, handel: 1 },
    wzgorza:  { zywnosc: 1, praca: 2, handel: 0 },
    gory:     { zywnosc: 0, praca: 0, handel: 0 },
    wybrzeze: { zywnosc: 3, praca: 2, handel: 2 },
    morze:    { zywnosc: 2, praca: 0, handel: 2 },
    pustynia: { zywnosc: 0, praca: 0, handel: 1 },
  };

  const yieldOf = (q: number, r: number): OkolicaTileYield => {
    const h = map.hexes[`${q},${r}`];
    if (!h) return {};
    const wt = hexToWorkedTile(h);
    const base = TERRAIN_SCORE[wt.terenBazowy as string] ?? { zywnosc: 0, praca: 0, handel: 0 };
    let zywnosc = base.zywnosc;
    let praca   = base.praca;
    let handel  = base.handel;
    if (wt.nakladka === 'las') { zywnosc -= 1; handel -= 1; }
    if (wt.maRzeke) { zywnosc += 3; praca += 2; handel += 2; }
    return {
      zywnosc: Math.max(0, zywnosc),
      praca:   Math.max(0, praca),
      handel:  Math.max(0, handel),
    };
  };

  // Przypisz N najlepszych pol (bez centrum) w zasiegu.
  const assigned = assignWorkedTiles(city.q, city.r, pop, map, yieldOf, { radius });

  // Konwertuj przypisane pozycje na WorkedTile.
  for (const t of assigned) {
    const h = map.hexes[t.key];
    if (h) tiles.push(hexToWorkedTile(h));
  }

  return tiles;
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
): EconomyCity {
  return {
    id:              city.id,
    ludnosc:         city.population,
    zdrowie,
    czyStolica:      isCapital,
    maSpichlerz:     false,
    maAkwedukt:      false,
    magazynZywnosci: city.magazynZywnosci ?? 0,
    specjalisci:     [],
    kolejkaProdukcji: [],
    podziałHandlu: {
      procentNauka:    params.suwaakHandelNaukaDefault,
      procentPieniadz: params.suwaakHandelPieniadz,
      procentLuksus:   params.suwaakHandelLuksus,
    },
    podziałPracy: {
      procentBudynki: params.suwaakPracaBudynki,
    },
  };
}

// ---------------------------------------------------------------------------
// WIRE 4: Oblezenie -- accessor + logika zegara glodu
// ---------------------------------------------------------------------------

/**
 * getCityFood -- zwraca biezacy zapas zywnosci miasta.
 * Pole magazynZywnosci na runtime City jest skalarem (number | undefined).
 * Brak pola = magazyn pusty (0).
 *
 * Uzycie przez UNITS/SILNIK: getCityFood(city) zamiast city.magazynZywnosci ?? 0.
 */
export function getCityFood(city: City): number {
  return city.magazynZywnosci ?? 0;
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
  // WIRE 4: oblezenie
  oblegany:       boolean;         // czy miasto bylo oblegane w tej turze
  obleganyGlod:   boolean;         // true gdy magazyn osiagnal 0 (ryzyko kapitulacji)
  magazynPoTurze: number;          // stan magazynu zywnosci po turze
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
 * @param builtByCity     optional map cityId->string[] of built building ids
 * @param playerEra       current era of the player (for Wealth cap/prog)
 */
/** Minimal unit info needed by the economy tick for food/upkeep accounting. */
export interface EconUnit {
  ownerId: number;
  typeId:  string;
  camping: boolean;
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
): EconomyTickResult {
  const params = buildEconParams(data, difficulty);
  const noBuildings: CityBuildingEntry[] = [];

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
  };

  // --- Per-owner income accumulators (for upkeep balance after city loop) ---
  const incomeByOwner = new Map<number, number>();

  for (const city of cities) {
    const isCapital = !capitalSeen.has(city.ownerId);
    capitalSeen.add(city.ownerId);

    const worked    = cityWorkedTilesForEconomy(city, map);
    const builtIds  = builtByCity.get(city.id) ?? [];

    // WIRE 1: oblicz zdrowie miasta
    const zdrowie = computeCityHealth(city.population, worked, builtIds, healthParams);

    const econCity = toEconomyCity(city, params, isCapital, zdrowie);

    // Military food: units belonging to this city's owner (approx. per-owner split).
    const ownerUnits = econUnits.filter(u => u.ownerId === city.ownerId);
    const milFood = militaryFoodConsumption(ownerUnits, upkeepParams);

    const walutaOdkryta = playerZbadane.has('Waluta') || playerZbadane.has('waluta');
    const ctx: CityYieldContext = {
      wojskoZuzycieZywnosci: milFood,   // real military food consumption (economy-upkeep s.6.3)
      strataFraction:        0,   // no distance-corruption tracking yet
      maMlyn:                builtIds.includes('mlyn'),
      maCegielnia:           builtIds.includes('cegielnia'),
      maTargowisko:          builtIds.includes('targowisko'),
      maBiblioteka:          builtIds.includes('biblioteka'),
      maMennica:             builtIds.includes('mennica'),
      mennicaMnoznik:        1,
      walutaOdkryta,         // P1b: mnoznik x2 Handel->Pieniadz gdy Waluta zbadana
    };

    const yld = cityYieldPerTurn(econCity, worked, noBuildings, params, ctx);

    // WIRE 3: Luksus -> Wealth tick
    // wealthState per miasto -- persystowane na city jako pole dynamiczne
    const prevWealth: WealthState = (city as any).wealthState ?? freshWealthState();
    const wt: WealthTickResult = advanceWealth(
      prevWealth,
      yld.luksus,      // spoleczMoney = strumien Luksus
      yld.pieniadz,    // miastoMoney  = pieniadz brutto tej tury
      playerEra,
      wealthParams,
    );
    // Zapisz nowy stan Wealth na obiekt City (dynamiczne pole)
    (city as any).wealthState = { poziom: wt.poziom, pula: wt.pula };

    // Pieniadz po mnozniku Wealth (KONTRAKT: mnozi strumien podatku, nie nauka/luksus)
    const pieniadzPoWealth = Math.floor(yld.pieniadz * wt.mnoznik);

    // WIRE 2: splitPraca
    const udzialBudynki = params.suwaakPracaBudynki / 100;
    const { doBudynkow, doPuli } = splitPraca(yld.praca, udzialBudynki);

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
        pieniadz:          pieniadzPoWealth,
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
        oblegany:          true,
        obleganyGlod,
        magazynPoTurze,
      };
      result.perCity.push(tick);

      // Accumulate income for upkeep balance.
      incomeByOwner.set(city.ownerId, (incomeByOwner.get(city.ownerId) ?? 0) + pieniadzPoWealth);

      result.cities         += 1;
      result.totalPraca      += yld.praca;
      result.totalPieniadz   += pieniadzPoWealth;
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
    const growthMult = growthMultByCity.get(city.id) ?? 1;
    const zywnoscDlaWzrostu = growthMult !== 1
      ? yld.zywnosc * growthMult
      : yld.zywnosc;

    const grow = populationGrowth(econCity, zywnoscDlaWzrostu, params);

    const before = city.population;

    // --- write results back onto the runtime city ---
    city.population = grow.nowaLudnosc;

    // Clamp food store to capacity (s.7.1 -- surplus is lost).
    const maSpichlerz = false;   // no spichlerz tracking yet; cap = base 20
    const foodCap = foodStorageCapacity(maSpichlerz, storageParams);
    city.magazynZywnosci = Math.min(grow.nowyMagazynZywnosci, foodCap);
    magazynPoTurze = city.magazynZywnosci;

    // Accumulate income for upkeep balance (uzyj pieniadz po Wealth).
    incomeByOwner.set(city.ownerId, (incomeByOwner.get(city.ownerId) ?? 0) + pieniadzPoWealth);

    // --- Converters (s.1.5) -- run after terrain yield, per-city ---
    // City.surowce is not yet a runtime field (resource collection not wired).
    // This hook runs with empty stores (no-op) until resource stores are added.
    const maMagazyn = false;
    const resCap = resourceStorageCapacityPerType(maMagazyn, storageParams);
    const citySurowce: Record<string, number> = (city as any).surowce ?? {};
    if (Object.keys(citySurowce).length > 0) {
      const convResult = runConverters(
        DEFAULT_CONVERTER_RECIPES,
        citySurowce,
        converterThroughputs,
        () => resCap,
      );
      (city as any).surowce = convResult.stores;
    }

    const tick: CityEconomyTick = {
      cityId:            city.id,
      ownerId:           city.ownerId,
      praca:             yld.praca,
      pieniadz:          pieniadzPoWealth,
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
      oblegany:          false,
      obleganyGlod:      false,
      magazynPoTurze,
    };
    result.perCity.push(tick);

    result.cities         += 1;
    result.totalPraca      += yld.praca;
    result.totalPieniadz   += pieniadzPoWealth;
    result.totalNauka      += yld.nauka;
    result.totalLuksus     += yld.luksus;
    result.totalKultura    += yld.kultura;
    result.totalZywnosc    += yld.zywnosc;
    result.totalPracaPula  += doPuli;
    if (grow.wzrost) result.growth  += 1;
    if (grow.ubytek) result.starved += 1;
  }

  // --- Compute upkeep balance per owner (s.6.4 / s.8.4) ---
  // Collect all unique owner IDs across cities + units.
  const ownerIds = new Set<number>([
    ...cities.map(c => c.ownerId),
    ...econUnits.map(u => u.ownerId),
  ]);
  for (const oid of ownerIds) {
    const income  = incomeByOwner.get(oid) ?? 0;
    const ounits  = econUnits.filter(u => u.ownerId === oid) as UnitUpkeepLike[];
    // No buildings in runtime yet -> empty array; upkeep = 0 for buildings.
    const balance = upkeepBalance(income, [], ounits, unitUpkeepTbl, upkeepParams);
    result.upkeepByOwner.set(oid, balance);
  }

  return result;
}
