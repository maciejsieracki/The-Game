/**
 * economy.ts
 * City economy logic for The Game -- pure module, no DOM, no THREE.
 *
 * Spec sources:
 *   - Spec-ekonomia.md  (all formulas; sections 1-8)
 *   - PROJEKT-GRY-master.md  par. 2, 8, 8a, 8e
 *   - gra/data/buildings.json  (building definitions)
 *   - gra/data/terrain-yields.json  (terrain base yields + modifiers)
 *   - gra/data/econ-params.json  (difficulty-scaled parameters)
 *
 * Assumptions / design decisions:
 *   1. The City type from src/game/cities.ts (runtime shape: id, ownerId, q, r,
 *      name, population) is too sparse for economy computation.  We define a
 *      local EconomyCity input interface that extends it with the fields this
 *      module needs, rather than editing cities.ts or types/city.ts.
 *   2. "Handel" (trade) and "Praca" (production/labour) from terrain tiles follow
 *      the tables in Spec-ekonomia.md ss.1.1.
 *   3. Building multipliers (mnoznik field in buildings.json) are percentage
 *      bonuses.  The targowisko bonus is applied separately via ctx.maTargowisko.
 *      Combat/military mnoznik values (kuznia, koszary) affect unit strength, not
 *      the six yield outputs -- we skip those here.
 *   4. Poborca specialist: +2 Pieniadz/ture directly (Spec ss.1.3).
 *   5. Food consumption per ss.1.4: populacja * 1 + wojskoZuzycieZywnosci.
 *      Callers pass effective military food consumption (camping units = 0.5 each).
 *   6. Health modifier: modifier = max(0, 1 + zdrowie * 0.05) [PT].
 *   7. econ-params.json uses difficulty keys "easy"/"normal"/"hard".
 *      All functions accept an EconParams struct; call loadEconParams() once at start.
 *   8. buildingValue() supports any BuildingYieldKey so it can serve cost/maint math.
 *   9. Rounding: all fractional yields are floored (Math.floor) per Spec ss.1.3 ex.
 *  10. productionProgress: returns { completed, newZebranaPraca, remainder }.
 */

// ---------------------------------------------------------------------------
// Imports from existing types
// ---------------------------------------------------------------------------

export type { HexCoords } from '../types/hex';
import { TerenBazowy, Nakladka } from '../types/hex';

// ---------------------------------------------------------------------------
// Building record shape (mirrors buildings.json)
// ---------------------------------------------------------------------------

/** Yield keys present in baza / przyrost objects of buildings.json. */
export type BuildingYieldKey =
  | 'praca'
  | 'pieniadz'
  | 'zywnosc'
  | 'nauka'
  | 'kultura'
  | 'zadowolenie'
  | 'obrona'
  | 'mnoznik';

export interface BuildingYields {
  praca:       number;
  pieniadz:    number;
  zywnosc:     number;
  nauka:       number;
  kultura:     number;
  zadowolenie: number;
  obrona:      number;
  mnoznik:     number;
}

/** A single building record from buildings.json. */
export interface BuildingRecord {
  id:                  string;
  nazwa:               string;
  kategoria:           string;
  epokaWejscia:        number;
  maksPoziom:          number;
  baza:                BuildingYields;
  przyrost:            BuildingYields;
  kosztBudowy:         number;
  przyrostKosztu:      number;
  utrzymanie:          number;
  przyrostUtrzymania:  number;
  techUnlock:          string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// EconParams
// ---------------------------------------------------------------------------

/** Economy parameters resolved for one difficulty level. */
export interface EconParams {
  progWzrostuWspolczynnik:          number;
  spichlerzZachowaniePoPrzroscie:   number;
  akweduktProgLudnosci:             number;
  zywnoscZuzytkaPopulacja:          number;
  korupcjaWspolczynnikDystansu:     number;
  korupcjaWspolczynnikMiast:        number;
  korupcjaCap:                      number;  // fraction, e.g. 0.50
  budynekMlynMnoznikPracy:          number;
  budynekMlynBonusPracy:            number;
  budynekCegielniBonusPracy:        number;
  budynekTargowiskoBonusHandlu:     number;
  suwaakHandelNaukaDefault:         number;
  suwaakHandelPieniadz:             number;
  suwaakHandelLuksus:               number;
  suwaakPracaBudynki:               number;
}

type Difficulty = 'easy' | 'normal' | 'hard';

interface RawEconParam {
  easy:   number;
  normal: number;
  hard:   number;
}

interface RawEconParamsJson {
  ekonomia_miasta: {
    prog_wzrostu_wspolczynnik:        RawEconParam;
    spichlerz_zachowanie_po_wzroscie: RawEconParam;
    akwedukt_prog_ludnosci:           RawEconParam;
    zywnosc_zuzytka_populacja:        RawEconParam;
    korupcja_wspolczynnik_dystansu:   RawEconParam;
    korupcja_wspolczynnik_miast:      RawEconParam;
    korupcja_cap:                     RawEconParam;
    suwak_handel_nauka_domyslnie:     RawEconParam;
    suwak_handel_pieniadz_domyslnie:  RawEconParam;
    suwak_handel_luksus_domyslnie:    RawEconParam;
    suwak_praca_budynki_domyslnie:    RawEconParam;
  };
  budynki: {
    budynek_mlyn_mnoznik_pracy:       RawEconParam;
    budynek_mlyn_bonus_pracy:         RawEconParam;
    budynek_cegielnia_bonus_pracy:    RawEconParam;
    budynek_targowisko_bonus_handlu:  RawEconParam;
  };
}

/**
 * Extract EconParams for a given difficulty from the raw JSON blob.
 *
 *   import rawEconJson from '../../data/econ-params.json';
 *   const params = loadEconParams(rawEconJson, 'normal');
 */
export function loadEconParams(
  raw: RawEconParamsJson,
  difficulty: Difficulty,
): EconParams {
  const em = raw.ekonomia_miasta;
  const bu = raw.budynki;
  const d  = difficulty;
  return {
    progWzrostuWspolczynnik:        em.prog_wzrostu_wspolczynnik[d],
    spichlerzZachowaniePoPrzroscie: em.spichlerz_zachowanie_po_wzroscie[d],
    akweduktProgLudnosci:           em.akwedukt_prog_ludnosci[d],
    zywnoscZuzytkaPopulacja:        em.zywnosc_zuzytka_populacja[d],
    korupcjaWspolczynnikDystansu:   em.korupcja_wspolczynnik_dystansu[d],
    korupcjaWspolczynnikMiast:      em.korupcja_wspolczynnik_miast[d],
    korupcjaCap:                    em.korupcja_cap[d] / 100,
    budynekMlynMnoznikPracy:        bu.budynek_mlyn_mnoznik_pracy[d],
    budynekMlynBonusPracy:          bu.budynek_mlyn_bonus_pracy[d],
    budynekCegielniBonusPracy:      bu.budynek_cegielnia_bonus_pracy[d],
    budynekTargowiskoBonusHandlu:   bu.budynek_targowisko_bonus_handlu[d],
    suwaakHandelNaukaDefault:       em.suwak_handel_nauka_domyslnie[d],
    suwaakHandelPieniadz:           em.suwak_handel_pieniadz_domyslnie[d],
    suwaakHandelLuksus:             em.suwak_handel_luksus_domyslnie[d],
    suwaakPracaBudynki:             em.suwak_praca_budynki_domyslnie[d],
  };
}

// ---------------------------------------------------------------------------
// Tile yield types
// ---------------------------------------------------------------------------

export interface TileYield {
  zywnosc: number;
  praca:   number;
  handel:  number;
  drewno:  number;
  kamien:  number;
}

/** A worked tile passed to cityYieldPerTurn. */
export interface WorkedTile {
  terenBazowy: TerenBazowy;
  nakladka:    Nakladka;
  maRzeke:     boolean;
}

// ---------------------------------------------------------------------------
// City economy input shape
// ---------------------------------------------------------------------------

/**
 * Economy-relevant city state.
 * The runtime City from cities.ts has only { id, ownerId, q, r, name, population }.
 * We extend it here with the economy-specific fields.
 */
export interface EconomyCity {
  id:              string;
  ludnosc:         number;
  zdrowie:         number;
  czyStolica:      boolean;
  maSpichlerz:     boolean;
  maAkwedukt:      boolean;
  magazynZywnosci: number;
  specjalisci:     Array<'uczony' | 'poborca' | 'artysta'>;
  kolejkaProdukcji: Array<{ kosztPracy: number; zebranaPraca: number }>;
  podziałHandlu: {
    procentNauka:    number;
    procentPieniadz: number;
    procentLuksus:   number;
  };
  podziałPracy: {
    procentBudynki: number;
  };
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface CityYieldResult {
  praca:          number;
  pieniadz:       number;
  zywnosc:        number;
  nauka:          number;
  kultura:        number;
  zadowolenie:    number;
  // Intermediate values for UI/debug
  zywnoscBrutto:  number;
  handelBrutto:   number;
  pracaTerenu:    number;
  pracaBudynkow:  number;
}

export interface PopulationGrowthResult {
  nowaLudnosc:         number;
  nowyMagazynZywnosci: number;
  wzrost:              boolean;
  ubytek:              boolean;
}

export interface ProductionProgressResult {
  completed:       boolean;
  newZebranaPraca: number;
  remainder:       number;
}

// ---------------------------------------------------------------------------
// Terrain yield tables (from terrain-yields.json / Spec-ekonomia.md ss.1.1)
// ---------------------------------------------------------------------------

const TERRAIN_YIELDS: Record<TerenBazowy, TileYield> = {
  [TerenBazowy.Laka]:     { zywnosc: 4, praca: 1, handel: 1, drewno: 1, kamien: 0 },
  [TerenBazowy.Rownina]:  { zywnosc: 2, praca: 1, handel: 1, drewno: 2, kamien: 1 },
  [TerenBazowy.Wzgorza]:  { zywnosc: 1, praca: 2, handel: 0, drewno: 2, kamien: 2 },
  [TerenBazowy.Gory]:     { zywnosc: 0, praca: 0, handel: 0, drewno: 2, kamien: 5 },
  [TerenBazowy.Wybrzeze]: { zywnosc: 3, praca: 2, handel: 2, drewno: 0, kamien: 0 },
  [TerenBazowy.Morze]:    { zywnosc: 2, praca: 0, handel: 2, drewno: 0, kamien: 0 },
  [TerenBazowy.Pustynia]: { zywnosc: 0, praca: 0, handel: 1, drewno: 0, kamien: 0 },
};

// Overlay modifiers (Spec-ekonomia.md ss.1.1)
const RIVER_MODIFIER:  TileYield = { zywnosc: 3, praca: 2, handel: 2, drewno: 0, kamien: 0 };
const FOREST_MODIFIER: TileYield = { zywnosc: -1, praca: 0, handel: -1, drewno: 3, kamien: 0 };

const ZERO_YIELD: TileYield = { zywnosc: 0, praca: 0, handel: 0, drewno: 0, kamien: 0 };

/**
 * Compute raw tile yields including overlay modifiers.
 * Negative per-tile yields are floored to 0.
 */
export function tileYield(tile: WorkedTile): TileYield {
  const base = TERRAIN_YIELDS[tile.terenBazowy] ?? ZERO_YIELD;

  let zywnosc = base.zywnosc;
  let praca   = base.praca;
  let handel  = base.handel;
  let drewno  = base.drewno;
  let kamien  = base.kamien;

  if (tile.nakladka === Nakladka.Las) {
    zywnosc += FOREST_MODIFIER.zywnosc;
    handel  += FOREST_MODIFIER.handel;
    drewno  += FOREST_MODIFIER.drewno;
  }

  if (tile.maRzeke) {
    zywnosc += RIVER_MODIFIER.zywnosc;
    praca   += RIVER_MODIFIER.praca;
    handel  += RIVER_MODIFIER.handel;
  }

  return {
    zywnosc: Math.max(0, zywnosc),
    praca:   Math.max(0, praca),
    handel:  Math.max(0, handel),
    drewno:  Math.max(0, drewno),
    kamien:  Math.max(0, kamien),
  };
}

// ---------------------------------------------------------------------------
// 1. buildingValue
// ---------------------------------------------------------------------------

/**
 * Compute the value of a building stat at a given level.
 *
 * Formula (Spec par. 8e):
 *   value(level) = baza[key] + (level - 1) * przyrost[key]
 *
 * Level 1 returns the base value with no growth bonus.
 *
 * @param b     - building record from buildings.json
 * @param level - current building level (1-based, >= 1)
 * @param key   - yield key
 */
export function buildingValue(
  b: BuildingRecord,
  level: number,
  key: BuildingYieldKey,
): number {
  return b.baza[key] + (level - 1) * b.przyrost[key];
}

// ---------------------------------------------------------------------------
// 2. cityYieldPerTurn
// ---------------------------------------------------------------------------

export interface CityBuildingEntry {
  record: BuildingRecord;
  level:  number;
}

export interface CityYieldContext {
  /**
   * Effective military food consumption this turn for units at this city
   * (normal units = 1 each, camping units = 0.5 each -- caller sums).
   */
  wojskoZuzycieZywnosci: number;
  /**
   * Corruption/waste loss fraction [0, cap].
   * Use corruptionRate() to compute; pass 0 for the capital in a 1-city empire.
   */
  strataFraction: number;
  maMlyn:         boolean;
  maCegielnia:    boolean;
  maTargowisko:   boolean;
  maMennica:      boolean;
  /**
   * Mint (Mennica) trade->money multiplier (from econ-params budynek_mennica_mnoznik).
   * Pass 1.0 when Mennica is absent or tech Waluta not yet researched.
   */
  mennicaMnoznik: number;
}

/**
 * Compute the full per-turn yield for a city.
 *
 * Steps (Spec-ekonomia.md ss.1.2, 1.3, 1.4, 2.1, 3.1):
 *   1. Sum terrain yields from workedTiles.
 *   2. Apply Mlyn multiplier on tile Praca; Cegielnia bonus on gross tile Praca.
 *   3. Apply Targowisko bonus on tile Handel.
 *   4. Sum building BASE outputs (praca, pieniadz, zywnosc, nauka, kultura, zadowolenie).
 *      Buildings are a direct source of Praca and Pieniadz (par. 8e rule 3).
 *   5. Apply non-combat building mnoznik% to combined Praca.
 *   6. Apply corruption/waste (strataFraction) to gross Praca and Handel.
 *   7. Split Handel via trade slider into Nauka / Pieniadz.
 *   8. Apply Mennica multiplier to Pieniadz share.
 *   9. Add building direct Pieniadz + specialist Poborca bonuses.
 *  10. Compute net food = gross food - (population + military) consumption.
 *
 * All fractional results are floored.
 */
export function cityYieldPerTurn(
  city: EconomyCity,
  workedTiles: WorkedTile[],
  cityBuildings: CityBuildingEntry[],
  params: EconParams,
  ctx: CityYieldContext,
): CityYieldResult {

  // --- Step 1: Sum raw terrain yields ---
  let zywnoscTerenu = 0;
  let pracaTerenu   = 0;
  let handelTerenu  = 0;

  for (const tile of workedTiles) {
    const y = tileYield(tile);
    zywnoscTerenu += y.zywnosc;
    pracaTerenu   += y.praca;
    handelTerenu  += y.handel;
  }

  // --- Step 2: Mlyn multiplier on tile Praca (Spec ss.1.2) ---
  let pracaBruttoTerenu: number;
  if (ctx.maMlyn) {
    pracaBruttoTerenu = pracaTerenu * params.budynekMlynMnoznikPracy
                      + params.budynekMlynBonusPracy;
  } else {
    pracaBruttoTerenu = pracaTerenu;
  }
  // Cegielnia bonus applied AFTER Mlyn
  if (ctx.maCegielnia) {
    pracaBruttoTerenu = pracaBruttoTerenu * (1 + params.budynekCegielniBonusPracy);
  }

  // --- Step 3: Targowisko bonus on tile Handel (Spec ss.1.3) ---
  let handelBrutto: number;
  if (ctx.maTargowisko) {
    handelBrutto = handelTerenu * (1 + params.budynekTargowiskoBonusHandlu);
  } else {
    handelBrutto = handelTerenu;
  }

  // --- Step 4: Sum building BASE outputs ---
  let pracaBudynkow    = 0;
  let pieniadzBudynkow = 0;
  let zywnoscBudynkow  = 0;
  let naukaBudynkow    = 0;
  let kulturaBudynkow  = 0;
  let zadBudynkow      = 0;

  for (const { record, level } of cityBuildings) {
    pracaBudynkow    += buildingValue(record, level, 'praca');
    pieniadzBudynkow += buildingValue(record, level, 'pieniadz');
    zywnoscBudynkow  += buildingValue(record, level, 'zywnosc');
    naukaBudynkow    += buildingValue(record, level, 'nauka');
    kulturaBudynkow  += buildingValue(record, level, 'kultura');
    zadBudynkow      += buildingValue(record, level, 'zadowolenie');
  }

  // --- Step 5: Sum non-combat mnoznik% and apply to combined Praca ---
  let totalMnoznikProc = 0;
  for (const { record, level } of cityBuildings) {
    const kat = record.kategoria;
    if (!kat.includes('Wojsko') && !kat.includes('Obrona')) {
      totalMnoznikProc += buildingValue(record, level, 'mnoznik');
    }
  }
  const mnoznikFactor = 1 + totalMnoznikProc / 100;
  const pracaBruttoLacznie = (pracaBruttoTerenu + pracaBudynkow) * mnoznikFactor;

  // --- Step 6: Apply corruption/waste ---
  const strata = Math.min(ctx.strataFraction, params.korupcjaCap);
  const pracaNetto  = pracaBruttoLacznie * (1 - strata);
  const handelNetto = handelBrutto       * (1 - strata);

  // --- Step 7+8: Trade slider -> Nauka / Pieniadz; apply mint multiplier ---
  const pctNauka    = city.podziałHandlu.procentNauka    / 100;
  const pctPieniadz = city.podziałHandlu.procentPieniadz / 100;

  const naukaZHandlu    = Math.floor(handelNetto * pctNauka);
  const pieniadzZHandlu = Math.floor(
    handelNetto * pctPieniadz * ctx.mennicaMnoznik
  );

  // --- Step 9: Total Pieniadz = from trade + from buildings + specialists ---
  let pieniadzTotal = pieniadzZHandlu + pieniadzBudynkow;
  for (const spec of city.specjalisci) {
    if (spec === 'poborca') {
      pieniadzTotal += 2;
    }
  }

  // --- Step 10: Net food ---
  const zywnoscBrutto = zywnoscTerenu + zywnoscBudynkow;
  const zywnoscZuzyta = city.ludnosc * params.zywnoscZuzytkaPopulacja
                       + ctx.wojskoZuzycieZywnosci;
  const zywnoscNetto  = zywnoscBrutto - zywnoscZuzyta;

  return {
    praca:          Math.floor(pracaNetto),
    pieniadz:       Math.floor(pieniadzTotal),
    zywnosc:        Math.floor(zywnoscNetto),
    nauka:          Math.floor(naukaZHandlu + naukaBudynkow),
    kultura:        Math.floor(kulturaBudynkow),
    zadowolenie:    Math.floor(zadBudynkow),
    zywnoscBrutto:  Math.floor(zywnoscBrutto),
    handelBrutto:   Math.floor(handelBrutto),
    pracaTerenu:    Math.floor(pracaBruttoTerenu),
    pracaBudynkow:  Math.floor(pracaBudynkow),
  };
}

// ---------------------------------------------------------------------------
// 3. populationGrowth
// ---------------------------------------------------------------------------

/**
 * Compute population change for one turn.
 *
 * Rules (Spec-ekonomia.md ss.4.1-4.4):
 *   - Without Spichlerz: surplus evaporates; deficit triggers starvation immediately.
 *   - With Spichlerz: surplus accumulates; growth at Threshold(N) = 10 + N * coeff.
 *   - On growth: magazyn *= spichlerzZachowaniePoPrzroscie (floored).
 *   - Pop cap without Akwedukt: akweduktProgLudnosci.
 *   - Health modifier: modifier = max(0, 1 + zdrowie * 0.05)  [PT]
 *   - Deficit drains store; pop drops by 1 when store hits 0 and deficit remains.
 *
 * @param city         - economy city
 * @param zywnoscNetto - net food this turn (from cityYieldPerTurn)
 * @param params       - economy parameters
 */
export function populationGrowth(
  city: EconomyCity,
  zywnoscNetto: number,
  params: EconParams,
): PopulationGrowthResult {
  const { ludnosc, zdrowie, maSpichlerz, maAkwedukt, magazynZywnosci } = city;

  // Health modifier on food flow (Spec ss.4.4)
  const healthModifier  = Math.max(0, 1 + zdrowie * 0.05);
  const effectiveFlow   = zywnoscNetto * healthModifier;

  const popCap = maAkwedukt ? Number.MAX_SAFE_INTEGER : params.akweduktProgLudnosci;

  let nowaLudnosc  = ludnosc;
  let nowyMagazynZywnosci  = magazynZywnosci;
  let wzrost       = false;
  let ubytek       = false;

  if (!maSpichlerz) {
    // Without granary: surplus lost; deficit = immediate starvation check
    if (effectiveFlow < 0 && ludnosc > 1) {
      nowaLudnosc = ludnosc - 1;
      ubytek      = true;
    }
    nowyMagazynZywnosci = 0;
    return { nowaLudnosc, nowyMagazynZywnosci, wzrost, ubytek };
  }

  // With granary: accumulate food
  nowyMagazynZywnosci = magazynZywnosci + Math.floor(effectiveFlow);

  if (nowyMagazynZywnosci < 0) {
    // Store depleted -- starvation
    nowyMagazynZywnosci = 0;
    if (ludnosc > 1) {
      nowaLudnosc = ludnosc - 1;
      ubytek      = true;
    }
    return { nowaLudnosc, nowyMagazynZywnosci, wzrost, ubytek };
  }

  // Check growth threshold
  const threshold = 10 + ludnosc * params.progWzrostuWspolczynnik;

  if (nowyMagazynZywnosci >= threshold && ludnosc < popCap) {
    nowaLudnosc = ludnosc + 1;
    wzrost      = true;
    nowyMagazynZywnosci = Math.floor(nowyMagazynZywnosci * params.spichlerzZachowaniePoPrzroscie);
  }

  return { nowaLudnosc, nowyMagazynZywnosci, wzrost, ubytek };
}

// ---------------------------------------------------------------------------
// 4. productionProgress
// ---------------------------------------------------------------------------

/**
 * Advance the production queue by pracaPerTurn points.
 *
 * Callers should pre-compute:
 *   pracaPerTurn = Math.floor(cityYield.praca * podziałPracy.procentBudynki / 100)
 *
 * @param currentBuildCost - total Praca cost of the item being built
 * @param currentProgress  - Praca already accumulated
 * @param pracaPerTurn     - Praca available this turn for production
 */
export function productionProgress(
  currentBuildCost: number,
  currentProgress: number,
  pracaPerTurn: number,
): ProductionProgressResult {
  const newZebranaPraca = currentProgress + Math.floor(pracaPerTurn);

  if (newZebranaPraca >= currentBuildCost) {
    return {
      completed:       true,
      newZebranaPraca: currentBuildCost,
      remainder:       newZebranaPraca - currentBuildCost,
    };
  }

  return {
    completed:       false,
    newZebranaPraca,
    remainder:       0,
  };
}

// ---------------------------------------------------------------------------
// 5. corruptionRate  (utility for building CityYieldContext.strataFraction)
// ---------------------------------------------------------------------------

/**
 * Compute the corruption/waste loss fraction for a city.
 *
 * Formula (Spec ss.5.1):
 *   Strata% = min(cap%, dystans * coeff_d + liczba_miast * coeff_m)
 *   Capital: dystans = 0.
 *
 * Returns a fraction [0, cap], e.g. 0.21 means 21% loss.
 *
 * @param dystansOdStolicy      - hex distance from this city to the capital
 * @param liczbaWszystkichMiast - total cities owned by this player
 * @param params                - economy parameters
 */
export function corruptionRate(
  dystansOdStolicy: number,
  liczbaWszystkichMiast: number,
  params: EconParams,
): number {
  const strataPct = dystansOdStolicy * params.korupcjaWspolczynnikDystansu
                  + liczbaWszystkichMiast * params.korupcjaWspolczynnikMiast;
  const capPct = params.korupcjaCap * 100;  // korupcjaCap is a fraction
  return Math.min(capPct, strataPct) / 100;
}
