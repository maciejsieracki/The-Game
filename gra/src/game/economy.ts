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
 *   9. Rounding: fractional yields floored (Math.floor) per Spec ss.1.3 — wyjątek:
 *      Praca miasta zaokrąglana Math.round (splitPraca + pula imperium, patrz production.ts).
 *  10. productionProgress: returns { completed, newZebranaPraca, remainder }.
 */

// ---------------------------------------------------------------------------
// Imports from existing types
// ---------------------------------------------------------------------------

export type { HexCoords } from '../types/hex';
import { TerenBazowy, Nakladka } from '../types/hex';
import terrainYieldsData from '../../data/terrain-yields.json';
import type { TerrainModifierDef, TerrainTypeDef } from '../data/loader';
import { buildingEffectAtLevel, cityPracaInteger, splitPraca, buildingLevelForEpoch } from './production';
import { applyImprovementBonuses, oreYieldFromImprovements } from './terrain-improvements';

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
  /** Twardy cap ludności po zbudowaniu Akweduktu (domyślnie 15). */
  akweduktMaxLudnosci:              number;
  zywnoscZuzytkaPopulacja:          number;
  zdrowieModyfikatorWspolczynnik:   number;  // health->growth coeff [PT 0.05]
  korupcjaWspolczynnikDystansu:     number;
  korupcjaWspolczynnikMiast:        number;
  korupcjaCap:                      number;  // fraction, e.g. 0.50
  budynekMlynMnoznikPracy:          number;
  budynekMlynBonusPracy:            number;
  budynekCegielniBonusPracy:        number;
  budynekTargowiskoBonusHandlu:     number;
  budynekBibliotekaBonusNauki:      number;  // Biblioteka -> +Nauka% (master par.2a)
  /**
   * ZADANIE 2 (Maciej 2026-07-25, decyzja 4): Akademia -> +Nauka% LOKALNIE, w tej
   * samej konwencji co Biblioteka (stackuje addytywnie: (1 + biblioteka% + akademia%)).
   * Biblioteka NIE dotknięta -- zostaje przy +50%. Placeholder 10% na wszystkich
   * poziomach trudności (econ-params budynek_akademia_bonus_nauki).
   */
  budynekAkademiaBonusNauki:        number;
  /**
   * Zadanie 2 (2026-07-23): Garncarnia -> +Zywnosc% LOKALNIE (tylko w miescie gdzie
   * stoi), stackuje addytywnie za kazda sztuke: ×(1 + wartosc × liczbaGarncarni).
   * PLACEHOLDER 10% (econ-params.json budynek_garncarnia_bonus_zywnosci_lokalnie).
   */
  budynekGarncarniaBonusZywnosci:   number;
  /**
   * NIEUŻYWANE od 2026-07-25 (decyzja Maciej): dawna wartość bazowa Mennicy
   * (budynek_mennica_mnoznik), praktycznie martwa już wcześniej -- efekt Mennicy
   * jest teraz w całości opisany przez mennicaMnoznikPoWalucie poniżej. Pole
   * zostawione w schemacie (parsowane z JSON) dla zgodności starych zapisów/
   * narzędzi, ale kod go już nigdzie nie konsumuje.
   */
  budynekMennicaMnoznik:            number;
  /**
   * JEDYNY mnożnik Handlu netto po scaleniu (Maciej 2026-07-25): mnoży CAŁY
   * handelNetto miasta (Skarb + Nauka + Zamożność razem, PRZED podziałem
   * suwakiem) TYLKO gdy technologia Waluta jest odkryta ORAZ Mennica jest
   * zbudowana w tym mieście (bramka AND liczona przez wołającego -- ctx.maMennica
   * && ctx.walutaOdkryta w cityYieldPerTurn). Wartości właściciela: easy x2,0 /
   * normal x1,5 / hard x1,0 (brak efektu). Dawne DWA osobne mnożniki (waluta_mnoznik
   * na cały Handel przy samym techu; mennica_mnoznik_po_walucie tylko na strumień
   * Pieniądza) zostały scalone w ten jeden -- patrz CityYieldContext.walutaOdkryta.
   */
  mennicaMnoznikPoWalucie:          number;
  /**
   * NIEUŻYWANE od 2026-07-25 (decyzja Maciej): dawny Efekt 1 "sam tech Waluty
   * daje x2 na cały Handel netto, bez wymogu Mennicy" -- zastąpiony przez
   * mennicaMnoznikPoWalucie (wymaga Mennicy + Waluty, wartość różna per trudność).
   * Pole zostawione w schemacie (parsowane z JSON) dla zgodności, kod go
   * już nigdzie nie konsumuje w formule Efektu 1.
   */
  walutaMnoznik:                    number;
  targowiskoPracaMnoznik:           number;  // Efekt 2: doPuli x mnoznik -> Pieniadz gdy maTargowisko+waluta (domyslnie 2)
  suwaakHandelNaukaDefault:         number;
  suwaakHandelPieniadz:             number;
  suwaakHandelLuksus:               number;
  suwaakPracaBudynki:               number;
  suwaakPracaTeren:                 number;
}

type Difficulty = 'easy' | 'normal' | 'hard';

/**
 * A raw parameter row in econ-params.json.  Besides the three difficulty values
 * it also carries metadata fields (`jednostka`, `opis`), so we type the value as
 * a tolerant record and read the difficulty key by index.
 */
type RawEconParam = Record<string, number | string | undefined>;

interface RawEconParamsJson {
  ekonomia_miasta?: Record<string, RawEconParam>;
  budynki?:         Record<string, RawEconParam>;
  globalne?:        Record<string, RawEconParam>;
}

/** JSON key for the growth-threshold coefficient (diacritic: "próg"). */
const KEY_PROG_WZROSTU = 'próg_wzrostu_wspolczynnik';

/**
 * Extract EconParams for a given difficulty from the raw econ-params.json blob.
 *
 *   import rawEconJson from '../../data/econ-params.json';
 *   const params = loadEconParams(rawEconJson, 'normal');
 *
 * Robust by design: the JSON rows carry extra metadata and one key uses a Polish
 * diacritic ("próg_..."); any missing/non-numeric value falls back to the
 * documented default, so a single odd row can never crash a turn.
 */
export function loadEconParams(
  raw: RawEconParamsJson,
  difficulty: Difficulty,
): EconParams {
  const em = raw.ekonomia_miasta ?? {};
  const bu = raw.budynki ?? {};
  const gl = raw.globalne ?? {};
  const d  = difficulty;

  const read = (
    group: Record<string, RawEconParam>,
    key: string,
    fallback: number,
  ): number => {
    const row = group[key];
    const v   = row ? row[d] : undefined;
    return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  };

  return {
    progWzrostuWspolczynnik:        read(em, KEY_PROG_WZROSTU, 16),
    spichlerzZachowaniePoPrzroscie: read(em, 'spichlerz_zachowanie_po_wzroscie', 0.5),
    akweduktProgLudnosci:           read(em, 'akwedukt_prog_ludnosci', 5),
    akweduktMaxLudnosci:            read(em, 'akwedukt_max_ludnosci', 15),
    zywnoscZuzytkaPopulacja:        read(em, 'zywnosc_zuzytka_populacja', 1),
    zdrowieModyfikatorWspolczynnik: read(em, 'zdrowie_modyfikator_wspolczynnik', 0.05),
    korupcjaWspolczynnikDystansu:   read(em, 'korupcja_wspolczynnik_dystansu', 2),
    korupcjaWspolczynnikMiast:      read(em, 'korupcja_wspolczynnik_miast', 1),
    korupcjaCap:                    read(em, 'korupcja_cap', 50) / 100,
    budynekMlynMnoznikPracy:        read(bu, 'budynek_mlyn_mnoznik_pracy', 2),
    budynekMlynBonusPracy:          read(bu, 'budynek_mlyn_bonus_pracy', 2),
    budynekCegielniBonusPracy:      read(bu, 'budynek_cegielnia_bonus_pracy', 0.25),
    budynekTargowiskoBonusHandlu:   read(bu, 'budynek_targowisko_bonus_handlu', 0.5),
    budynekBibliotekaBonusNauki:    read(bu, 'budynek_biblioteka_bonus_nauki', 0.5),
    budynekAkademiaBonusNauki:      read(bu, 'budynek_akademia_bonus_nauki', 0.10),
    budynekGarncarniaBonusZywnosci: read(bu, 'budynek_garncarnia_bonus_zywnosci_lokalnie', 0.10),
    budynekMennicaMnoznik:          read(bu, 'budynek_mennica_mnoznik', 1),      // NIEUZYWANE 2026-07-25
    mennicaMnoznikPoWalucie:        read(gl, 'mennica_mnoznik_po_walucie', 1.5), // JEDYNY mnoznik Efektu 1
    walutaMnoznik:                  read(bu, 'waluta_mnoznik', 2),               // NIEUZYWANE 2026-07-25
    targowiskoPracaMnoznik:         read(bu, 'targowisko_praca_na_pieniadz_mnoznik', 2),
    suwaakHandelNaukaDefault:       read(em, 'suwak_handel_nauka_domyslnie', 60),
    suwaakHandelPieniadz:           read(em, 'suwak_handel_pieniadz_domyslnie', 30),
    suwaakHandelLuksus:             read(em, 'suwak_handel_luksus_domyslnie', 10),
    suwaakPracaBudynki:             read(em, 'suwak_praca_budynki_domyslnie', 70),
    suwaakPracaTeren:               read(em, 'suwak_praca_teren_domyslnie', 30),
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
  /** GLINA-Q1=A (2026-07-20): stala ilosc z bonusu ulepszenia (glinianka); baza terenu zawsze 0. */
  glina:   number;
  /** Ruda miedzi (kopalnia_miedzi / kopalnia na złożu miedzi) — stock do Odlewni brązu. */
  ruda:          number;
  /** Ruda żelaza (kopalnia na złożu żelaza) — stock do Odlewni żelaza. */
  ruda_zelaza:   number;
}

/** A worked tile passed to cityYieldPerTurn. */
export interface WorkedTile {
  terenBazowy: TerenBazowy;
  nakladka:    Nakladka;
  maRzeke:     boolean;
  /** Złoże surowcowe heksa (miedz, zelazo, sol…) — do rozróżnienia rudy miedzi vs żelaza. */
  zloze?: string;
  /** Klucz z terrain-improvements.json (np. farma, kopalnia). @deprecated Prefer ulepszeniaKeys. */
  ulepszenieKey?: string;
  /** Wiele warstw ulepszeń na heksie (farma+irygacja, farma+bydło). */
  ulepszeniaKeys?: string[];
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
  maSpichlerzII?:  boolean;
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
  luksus:         number;   // trade->Spoleczenstwo stream; feeds Wealth (advanceWealth)
  kultura:        number;
  zadowolenie:    number;
  // Intermediate values for UI/debug
  zywnoscBrutto:  number;
  handelBrutto:   number;
  pracaTerenu:    number;
  pracaBudynkow:  number;
  pieniadzZPracy: number;  // Efekt 2: doPuli * targowiskoPracaMnoznik (0 gdy brak Targowiska/Waluty)
  /**
   * E1 Zadanie 2: surowce logistyczne zebrane z pol tej tury (przed magazynem/converterami).
   * Drewno/kamien/glina maja numeryczny plon terenu/ulepszen (tileYield); glina dodana
   * GLINA-Q1=A (2026-07-20, stala ilosc 2/ture z glinianki). Ruda miedzi/żelaza — numeryczny
   * plon z kopalni_miedzi / kopalnia (audit ROBOCZA 9a0ca985, 2026-07-23).
   */
  drewnoTerenu:   number;
  kamienTerenu:   number;
  glinaTerenu:    number;
  rudaTerenu:     number;
  rudaZelazaTerenu: number;
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

const ZERO_YIELD: TileYield = { zywnosc: 0, praca: 0, handel: 0, drewno: 0, kamien: 0, glina: 0, ruda: 0, ruda_zelaza: 0 };

const TERRAIN_NAME_TO_ENUM: Record<string, TerenBazowy> = {
  'Łąka':     TerenBazowy.Laka,
  'Równina':  TerenBazowy.Rownina,
  'Wzgórza':  TerenBazowy.Wzgorza,
  'Góry':     TerenBazowy.Gory,
  'Wybrzeże': TerenBazowy.Wybrzeze,
  'Morze':    TerenBazowy.Morze,
  'Pustynia': TerenBazowy.Pustynia,
};

function terrainRowToTileYield(row: TerrainTypeDef | TerrainModifierDef): TileYield {
  return {
    zywnosc: Number(row['Żywność'] ?? 0),
    praca:   Number(row['Praca'] ?? 0),
    handel:  Number(row['Handel'] ?? 0),
    drewno:  Number(row['Drewno'] ?? 0),
    kamien:  Number(row['Kamień'] ?? 0),
    // Glina nie ma bazy terenu ani modyfikatora w terrain-yields.json -- wylacznie z bonusu
    // ulepszenia (glinianka, GLINA-Q1=A), doklejane w tileYield() nizej.
    glina:   0,
    ruda:    0,
    ruda_zelaza: 0,
  };
}

function buildTerrainYields(): Record<TerenBazowy, TileYield> {
  const out = {} as Record<TerenBazowy, TileYield>;
  for (const row of terrainYieldsData.terrain_types) {
    const key = TERRAIN_NAME_TO_ENUM[row.Teren];
    if (key) out[key] = terrainRowToTileYield(row);
  }
  return out;
}

function terrainModifier(name: string): TileYield {
  const row = terrainYieldsData.terrain_modifiers.find(m => m['Modyfikator'] === name);
  return row ? terrainRowToTileYield(row) : ZERO_YIELD;
}

const TERRAIN_YIELDS = buildTerrainYields();
const RIVER_MODIFIER  = terrainModifier('Rzeka');
const FOREST_MODIFIER = terrainModifier('Las (nakładka)');

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
  let glina   = base.glina;
  let ruda    = 0;
  let ruda_zelaza = 0;

  if (tile.nakladka === Nakladka.Las) {
    zywnosc += FOREST_MODIFIER.zywnosc;
    praca   += FOREST_MODIFIER.praca;
    handel  += FOREST_MODIFIER.handel;
    drewno  += FOREST_MODIFIER.drewno;
  }

  if (tile.maRzeke) {
    zywnosc += RIVER_MODIFIER.zywnosc;
    praca   += RIVER_MODIFIER.praca;
    handel  += RIVER_MODIFIER.handel;
  }

  const out: TileYield = {
    zywnosc: Math.max(0, zywnosc),
    praca:   Math.max(0, praca),
    handel:  Math.max(0, handel),
    drewno:  Math.max(0, drewno),
    kamien:  Math.max(0, kamien),
    glina:   Math.max(0, glina),
    ruda:    0,
    ruda_zelaza: 0,
  };

  const impKeys = tile.ulepszeniaKeys?.length
    ? tile.ulepszeniaKeys
    : (tile.ulepszenieKey ? [tile.ulepszenieKey] : []);
  if (impKeys.length) {
    applyImprovementBonuses(out, impKeys);
    out.zywnosc = Math.max(0, out.zywnosc);
    out.praca   = Math.max(0, out.praca);
    out.handel  = Math.max(0, out.handel);
    out.drewno  = Math.max(0, out.drewno);
    out.kamien  = Math.max(0, out.kamien);
    out.glina   = Math.max(0, out.glina);
    const ore = oreYieldFromImprovements(impKeys, tile.zloze);
    out.ruda += ore.ruda;
    out.ruda_zelaza += ore.ruda_zelaza;
  }

  return out;
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
  return Math.floor(buildingEffectAtLevel(b.baza[key], b.przyrost[key], level));
}

/** Każdy zbudowany budynek daje +1 szczęścia (decyzja Macieja 2026-07-22). */
export const BUILDING_HAPPINESS_BASE_PER_BUILDING = 1;

/**
 * Szczęście z jednego budynku: globalne +1 + ewentualny bonus z `baza.zadowolenie`.
 * Np. Świątynia (zadowolenie 3, poziom 1) → 4; Mury (0) → 1.
 */
export function buildingHappinessAtLevel(
  b: Pick<BuildingRecord, 'baza'>,
  level: number,
): number {
  const extra = typeof b.baza.zadowolenie === 'number' && b.baza.zadowolenie !== 0
    ? buildingValue(b as BuildingRecord, level, 'zadowolenie')
    : 0;
  return BUILDING_HAPPINESS_BASE_PER_BUILDING + extra;
}

/** Minimalny kształt wpisu katalogu budynków do liczenia szczęścia. */
export interface BuildingHappinessCatalogEntry {
  id: string;
  baza: BuildingYields;
  epokaWejscia: number;
  maksPoziom: number;
  poziomTechGate?: Record<string, string> | null;
}

/** Suma szczęścia ze wszystkich zbudowanych budynków miasta. */
export function sumBuildingHappinessFromBuiltIds(
  builtIds: readonly string[],
  catalog: readonly BuildingHappinessCatalogEntry[],
  levelFor: (bdef: BuildingHappinessCatalogEntry) => number,
): number {
  let sum = 0;
  for (const bid of builtIds) {
    const bdef = catalog.find(b => b.id === bid);
    if (!bdef) continue;
    sum += buildingHappinessAtLevel(bdef, levelFor(bdef));
  }
  return sum;
}

/** Suma szczęścia z wpisów `{ record, level }` (cityYieldPerTurn). */
export function sumBuildingHappiness(cityBuildings: readonly CityBuildingEntry[]): number {
  let sum = 0;
  for (const { record, level } of cityBuildings) {
    sum += buildingHappinessAtLevel(record, level);
  }
  return sum;
}

// ---------------------------------------------------------------------------
// 2. cityYieldPerTurn
// ---------------------------------------------------------------------------

export interface CityBuildingEntry {
  record: BuildingRecord;
  level:  number;
}

/**
 * Zbuduj CityBuildingEntry[] (record+level) z listy zbudowanych id budynkow miasta.
 * JEDYNE zrodlo prawdy uzywane przez wszystkie wywolania cityYieldPerTurn (silnik
 * advanceCityEconomy, podglad previewCityEconomy, panel "Bilans plonow" cityPanel.ts)
 * -- zeby plony budynkow (Praca/Pieniadz/Zywnosc/Nauka/Kultura/Zadowolenie) liczyly
 * sie identycznie wszedzie (2026-07-25, naprawa "budynki nie licza sie w silniku").
 *
 * Poziom liczony przez buildingLevelForEpoch() (production.ts) -- NIE wlasny wzor:
 * uwzglednia epokaWejscia, maksPoziom i opcjonalny poziomTechGate. Nieznane id
 * (brak w katalogu) sa pomijane, tak samo jak w sumBuildingHappinessFromBuiltIds.
 */
export function cityBuildingEntriesFromBuiltIds(
  builtIds: readonly string[],
  catalog: readonly BuildingRecord[],
  cityEpoch: number,
  unlockedTechs?: ReadonlySet<string> | readonly string[] | null,
): CityBuildingEntry[] {
  const entries: CityBuildingEntry[] = [];
  for (const bid of builtIds) {
    const record = catalog.find(b => b.id === bid);
    if (!record) continue;
    const level = buildingLevelForEpoch(
      record.epokaWejscia,
      cityEpoch,
      record.maksPoziom,
      record.poziomTechGate as Record<string, string> | null | undefined,
      unlockedTechs,
    );
    entries.push({ record, level });
  }
  return entries;
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
  /** Biblioteka present -> +Nauka%. Optional so existing ctx literals stay valid. */
  maBiblioteka?:  boolean;
  /**
   * ZADANIE 2 (2026-07-25): Akademia present -> +Nauka% (osobny param od Biblioteki,
   * stackuje addytywnie). Optional so existing ctx literals stay valid.
   */
  maAkademia?:    boolean;
  /**
   * Mennica (Mint) zbudowana w TYM mieście. Sam ten flag nic nie mnoży -- jest
   * jednym z DWÓCH warunków (obok walutaOdkryta) bramki Efektu 1 (patrz niżej).
   * Dawne osobne pole `mennicaMnoznik` (mnożnik TYLKO na strumień Pieniądza)
   * zostało USUNIĘTE 2026-07-25 (decyzja Maciej) -- efekt jest teraz jeden,
   * scalony w Efekcie 1 poniżej, i wymaga Mennicy + Waluty razem.
   */
  maMennica:      boolean;
  /**
   * Waluta (currency tech) discovered by this player.
   * Efekt 1 (SCALONY, decyzja Maciej 2026-07-25): handelNetto *= mennicaMnoznikPoWalucie
   * (easy x2,0 / normal x1,5 / hard x1,0 -- BRAK efektu na hard) TYLKO gdy
   * walutaOdkryta ORAZ maMennica są oba prawdziwe. Sam tech Waluty już NIE
   * wystarcza -- to jest sedno zmiany; przedtem (do 2026-07-24) sam tech dawał
   * już x2 niezależnie od trudności i budynku, a Mennica mnożyła osobno tylko
   * strumień Pieniądza -- oba stare efekty są teraz jednym.
   * Efekt 2 (bez zmian): doPuli (Praca surplus) -> Pieniadz x targowiskoPracaMnoznik gdy maTargowisko && walutaOdkryta.
   * Optional; defaults to false so existing ctx literals remain valid.
   */
  walutaOdkryta?: boolean;
  /**
   * Per-cyw/religia override for Efekt 1 bazy (mnoznikHandelPieniadz z civs.json,
   * 1.7-2.4, lub religionTradeWalutaOverride). Gdy ustawione, zastepuje
   * params.mennicaMnoznikPoWalucie jako WARTOŚĆ mnożnika -- NIE omija bramki
   * walutaOdkryta && maMennica powyżej (bramka decyduje CZY mnożyć, override
   * decyduje O ILE).
   */
  walutaMnoznikOverride?: number;
  /** RDY-01: mnoznik na Handel z bonusu cyw (np. Grecy +15%). Domyslnie 1. */
  civHandelMult?: number;
  /** RDY-01: mnoznik na Nauke z bonusu cyw (np. Inkowie +15%). Domyslnie 1. */
  civNaukaMult?: number;
  /**
   * Handel E3: liczba AKTYWNYCH tras handlowych dotykających tego miasta
   * (obie role -- zrodlo i cel; patrz trade-routes.ts computeTradeRouteCountByCity).
   * Kazda trasa dodaje +5% do Handlu, kumulatywnie: (1 + 0.05*n). Osobny, jawny
   * czynnik -- NIE laczony z Targowiskiem/civHandelMult, zeby uniknac podwojnego
   * liczenia (STAN-PRACY-HANDOFF.md, epik Handel E3). Domyslnie 0 (brak tras).
   */
  liczbaAktywnychTrasHandlowych?: number;
  /**
   * Zadanie 2 (2026-07-23): liczba Garncarni ZBUDOWANYCH W TYM MIESCIE (nie civ-wide).
   * Kazda dodaje +budynekGarncarniaBonusZywnosci (domyslnie 10%) do lokalnej Zywnosci
   * brutto, stackuje addytywnie: ×(1 + wartosc × liczbaGarncarni). Domyslnie 0 (brak
   * Garncarni) tak, zeby istniejace literaly ctx zostaly wazne.
   */
  liczbaGarncarni?: number;
}

/** Minimalny ksztalt wpisu bonusy[] z civs.json (unikamy importu loader). */
export interface CivEconomyBonus {
  typ: string;
  cel: string;
  /** jednostka_specjalna: string[] (tokeny-fix); inne typy bonusow: number. */
  wartosc: number | string | string[];
  opis?: string;
  realizuje?: string;
}

/** Minimal civ row shape for mnoznikHandelPieniadz lookup. */
export interface CivMnoznikRow {
  Cywilizacja?:       string;
  ikonaId?:           string;
  typCywilizacji?:    string;
  mnoznikHandelPieniadz?: number;
}

/**
 * Per-nacja mnoznik Handel->Pieniadz (decyzja 5A: baza 2, widelki 1.7-2.4).
 * Matches civ by ikonaId, typCywilizacji, or display name (case-insensitive).
 */
export function mnoznikHandelPieniadzForCiv(
  civKey: string | null | undefined,
  civs: { cywilizacje?: CivMnoznikRow[] } | null | undefined,
  fallback = 2,
): number {
  if (!civKey || !civs?.cywilizacje?.length) return fallback;
  const key = civKey.toLowerCase();
  for (const row of civs.cywilizacje) {
    if (!row) continue;
    const ids = [row.ikonaId, row.typCywilizacji, row.Cywilizacja]
      .filter((s): s is string => typeof s === 'string' && s.length > 0)
      .map(s => s.toLowerCase());
    if (!ids.includes(key)) continue;
    const v = row.mnoznikHandelPieniadz;
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
    return fallback;
  }
  return fallback;
}

/** Bonusy ekonomii z wiersza cywilizacji (civs.json). */
export function civBonusyForCivKey(
  civKey: string | null | undefined,
  civs: { cywilizacje?: Array<CivMnoznikRow & { bonusy?: CivEconomyBonus[] }> } | null | undefined,
): readonly CivEconomyBonus[] {
  if (!civKey || !civs?.cywilizacje?.length) return [];
  const key = civKey.toLowerCase();
  for (const row of civs.cywilizacje) {
    if (!row) continue;
    const ids = [row.ikonaId, row.typCywilizacji, row.Cywilizacja]
      .filter((s): s is string => typeof s === 'string' && s.length > 0)
      .map(s => s.toLowerCase());
    if (ids.includes(key)) return row.bonusy ?? [];
  }
  return [];
}

/**
 * Mnozniki yield z bonusow realizuje=ekonomia (RDY-01: Grecy handel, Inkowie nauka).
 */
export function civEconomyYieldMultipliers(
  bonusy: readonly CivEconomyBonus[] | undefined,
): { handel: number; nauka: number } {
  let handel = 1;
  let nauka = 1;
  if (!bonusy?.length) return { handel, nauka };
  for (const b of bonusy) {
    if (b.realizuje !== 'ekonomia') continue;
    if (b.typ === 'bonus_zloto' && b.cel === 'handel' && typeof b.wartosc === 'number') {
      handel += b.wartosc;
    }
    if (b.typ === 'bonus_nauka' && typeof b.wartosc === 'number') {
      nauka += b.wartosc;
    }
  }
  return { handel, nauka };
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
 *   5. Apply corruption/waste (strataFraction) to gross Praca and Handel.
 *   6. Split Handel via trade slider into Nauka / Pieniadz / Luksus.
 *   7. Apply Mennica multiplier to Pieniadz; Biblioteka bonus to Nauka.
 *   8. Add building direct Pieniadz + specialist Poborca bonuses.
 *   9. Apply Garncarnia +Zywnosc% (lokalnie, per miasto, ctx.liczbaGarncarni) to
 *      gross food, THEN compute net food = gross food - (population + military).
 *
 * All fractional results are floored.
 *
 * UWAGA (2026-07-25): dawny "Step 5" (baza.mnoznik budynkow niewojskowych -> % do
 * Pracy) zostal CALKOWICIE USUNIETY — byl martwy/blednie policzony (patrz
 * dyspozycje/AUDYT-MARTWE-PARAMETRY-BUDYNKOW.md). Pole `mnoznik` w buildings.json
 * zyje teraz WYLACZNIE jako zrodlo % dla dwoch sciezek ulepszen jednostek
 * (Pancerz / Parametry miekkie) — patrz gra/src/game/unit-building-bonuses.ts.
 * Praca miasta to odtad WYLACZNIE suma Praca(teren) + Praca(budynki), bez zadnego
 * globalnego mnoznika procentowego.
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
  let drewnoTerenu  = 0;
  let kamienTerenu  = 0;
  let glinaTerenu   = 0;
  let rudaTerenu    = 0;
  let rudaZelazaTerenu = 0;

  for (const tile of workedTiles) {
    const y = tileYield(tile);
    zywnoscTerenu += y.zywnosc;
    pracaTerenu   += y.praca;
    handelTerenu  += y.handel;
    drewnoTerenu  += y.drewno;
    kamienTerenu  += y.kamien;
    glinaTerenu   += y.glina;
    rudaTerenu    += y.ruda;
    rudaZelazaTerenu += y.ruda_zelaza;
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
  const civHandelMult = ctx.civHandelMult ?? 1;
  if (civHandelMult !== 1) {
    handelBrutto *= civHandelMult;
  }
  // Handel E3: +5% Handlu za kazda AKTYWNA trase handlowa miasta, kumulatywnie
  // (1 + 0.05*n). Osobny, jawny czynnik -- patrz CityYieldContext.liczbaAktywnychTrasHandlowych.
  const liczbaTrasHandlowych = ctx.liczbaAktywnychTrasHandlowych ?? 0;
  if (liczbaTrasHandlowych > 0) {
    handelBrutto *= (1 + 0.05 * liczbaTrasHandlowych);
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
    zadBudynkow      += buildingHappinessAtLevel(record, level);
  }

  // Step 5 (dawne "mnoznik% -> Praca") USUNIETE 2026-07-25 — patrz komentarz
  // funkcji powyzej. Praca miasta to czysta suma teren+budynki, bez mnoznika.
  const pracaBruttoLacznie = pracaBruttoTerenu + pracaBudynkow;

  // --- Step 5 (renumbered from 6): Apply corruption/waste ---
  const strata = Math.min(ctx.strataFraction, params.korupcjaCap);
  const pracaNetto        = pracaBruttoLacznie * (1 - strata);
  const handelNettoRaw    = handelBrutto       * (1 - strata);
  // Waluta odkryta (sam tech, BEZ wymogu Mennicy) -- uzywane WYLACZNIE przez Efekt 2
  // (Targowisko) ponizej. Efekt 2 NIE zostal ruszony przez decyzje 2026-07-25 (Maciej:
  // "nie ruszaj Targowiska, to inny strumien") -- musi zostac osobna zmienna, inaczej
  // scalona bramka Efektu 1 (ponizej) przecieklaby i wylaczyla Efekt 2 gdy brak Mennicy.
  const walutaOdkrytaOnly = ctx.walutaOdkryta === true;
  // Efekt 1 SCALONY (Waluta + Mennica, decyzja Maciej 2026-07-25): caly handelNetto
  // jest mnozony x mennicaMnoznikPoWalucie (easy x2,0 / normal x1,5 / hard x1,0) TYLKO
  // gdy walutaOdkryta ORAZ maMennica sa oba prawdziwe -- sam tech Waluty juz NIE
  // wystarcza. Dziala na cala pule PRZED podzialem na Nauka/Pieniadz/Luksus, wiec
  // nauka i zamoznosc z handlu tez rosna razem ze Skarbem (decyzja: wariant A).
  const walutaActive = walutaOdkrytaOnly && ctx.maMennica === true;
  const walutaMnoznikBase = ctx.walutaMnoznikOverride ?? params.mennicaMnoznikPoWalucie;
  const walutaMnoznikAktywny = walutaActive ? walutaMnoznikBase : 1;
  const handelNetto   = handelNettoRaw * walutaMnoznikAktywny;

  // --- Step 6+7: Trade slider -> Nauka / Pieniadz / Luksus ---
  // Dawny osobny mnoznik ctx.mennicaMnoznik (Handel->Pieniadz, TYLKO strumien
  // Pieniadza) zostal USUNIETY 2026-07-25 -- Mennica jest teraz jednym z dwoch
  // warunkow bramki Efektu 1 powyzej (handelNetto), wiec mnozy juz i tak Skarb+
  // Nauke+Zamoznosc razem; osobne mnozenie tutaj dublowaloby efekt.
  const pctNauka    = city.podziałHandlu.procentNauka    / 100;
  const pctPieniadz = city.podziałHandlu.procentPieniadz / 100;
  const pctLuksus   = city.podziałHandlu.procentLuksus   / 100;

  const naukaZHandlu    = Math.floor(handelNetto * pctNauka);
  const pieniadzZHandlu = Math.floor(handelNetto * pctPieniadz);
  // Luksus stream (Spec ss.2.1/2.2): feeds Zadowolenie downstream (society lane).
  const luksusZHandlu   = Math.floor(handelNetto * pctLuksus);

  // Biblioteka: +Nauka% applied to the city's local science (master par.2a).
  // Akademia (ZADANIE 2, 2026-07-25, decyzja 4): +Nauka% osobny, stackuje ADDYTYWNIE
  // z Biblioteka -- (1 + bibliotekaBonus + akademiaBonus), NIE (1+b)*(1+a). Kolejnosc
  // nie zmieniona: premia dziala PO zsumowaniu plonow budynkow (naukaBudynkow), wiec
  // mnozy takze wlasne 6 pkt Nauki Akademii -- ten sam efekt co Biblioteka ma dzis.
  const naukaBonusFactor = 1
    + (ctx.maBiblioteka ? params.budynekBibliotekaBonusNauki : 0)
    + (ctx.maAkademia   ? params.budynekAkademiaBonusNauki   : 0);
  const naukaLokalnaRaw  = Math.floor((naukaZHandlu + naukaBudynkow) * naukaBonusFactor);
  const civNaukaMult     = ctx.civNaukaMult ?? 1;
  const naukaLokalna     = civNaukaMult !== 1
    ? Math.floor(naukaLokalnaRaw * civNaukaMult)
    : naukaLokalnaRaw;

  // --- Step 8: Total Pieniadz = from trade + from buildings + specialists + Efekt 2 ---
  // Efekt 2 (Targowisko + Waluta): pula-Praca (doPuli) -> Pieniadz x targowiskoPracaMnoznik.
  // doPuli = pracaNetto * (1 - podziałPracy.procentBudynki/100) -- computed by caller (splitPraca).
  // Tutaj obliczamy wewnetrznie z pracaNetto i suwaka, zeby wynik był w CityYieldResult.
  const pctPracaBudynki = city.podziałPracy.procentBudynki / 100;
  const pracaInt = cityPracaInteger(pracaNetto);
  const { doPuli } = splitPraca(pracaInt, pctPracaBudynki);
  const pieniadzZPracy = (ctx.maTargowisko && walutaOdkrytaOnly)
    ? Math.floor(doPuli * params.targowiskoPracaMnoznik)
    : 0;

  let pieniadzTotal = pieniadzZHandlu + pieniadzBudynkow + pieniadzZPracy;
  for (const spec of city.specjalisci) {
    if (spec === 'poborca') {
      pieniadzTotal += 2;
    }
  }

  // --- Step 9: Net food ---
  // Garncarnia (Zadanie 2, 2026-07-23): +Zywnosc% LOKALNIE po zsumowaniu bazowej
  // Zywnosci (teren+budynki), PRZED odjeciem konsumpcji. Stackuje za kazda sztuke
  // zbudowana w TYM miescie (civ-wide NIE dotyczy -- patrz Stolarnia/Warsztat kamieniarski
  // w turn-economy.ts, ktore dzialaja na drewno/kamien, nie zywnosc).
  const zywnoscBruttoBaza = zywnoscTerenu + zywnoscBudynkow;
  const liczbaGarncarni = ctx.liczbaGarncarni ?? 0;
  const garncarniaMnoznikZywnosci = 1 + params.budynekGarncarniaBonusZywnosci * liczbaGarncarni;
  const zywnoscBrutto = zywnoscBruttoBaza * garncarniaMnoznikZywnosci;
  const zywnoscZuzyta = city.ludnosc * params.zywnoscZuzytkaPopulacja
                       + ctx.wojskoZuzycieZywnosci;
  const zywnoscNetto  = zywnoscBrutto - zywnoscZuzyta;

  return {
    praca:          pracaInt,
    pieniadz:       Math.floor(pieniadzTotal),
    zywnosc:        Math.floor(zywnoscNetto),
    nauka:          naukaLokalna,
    luksus:         luksusZHandlu,
    kultura:        Math.floor(kulturaBudynkow),
    zadowolenie:    Math.floor(zadBudynkow),
    zywnoscBrutto:  Math.floor(zywnoscBrutto),
    handelBrutto:   Math.floor(handelBrutto),
    pracaTerenu:    Math.floor(pracaBruttoTerenu),
    pracaBudynkow:  Math.floor(pracaBudynkow),
    pieniadzZPracy,
    drewnoTerenu:   Math.floor(drewnoTerenu),
    kamienTerenu:   Math.floor(kamienTerenu),
    glinaTerenu:    Math.floor(glinaTerenu),
    rudaTerenu:     Math.floor(rudaTerenu),
    rudaZelazaTerenu: Math.floor(rudaZelazaTerenu),
  };
}

// ---------------------------------------------------------------------------
// 3. populationGrowth
// ---------------------------------------------------------------------------

/** Aktualny twardy cap ludności miasta (bez Akweduktu vs z Akweduktem). */
export function cityPopulationCap(
  maAkwedukt: boolean,
  params: Pick<EconParams, 'akweduktProgLudnosci' | 'akweduktMaxLudnosci'>,
): number {
  return maAkwedukt ? params.akweduktMaxLudnosci : params.akweduktProgLudnosci;
}

/**
 * Compute population change for one turn.
 *
 * Rules (B5-SPICH, Maciej 2026-06-29):
 *   - Bufor wzrostu kumuluje się ZAWSZE (z/bez Spichlerza) z zywnoscNetto (część „Rozwój miast”).
 *   - Próg: Threshold(N) = 20 + N * coeff → +1 ludność.
 *   - Po wzroście: bez Spichlerza bufor → 0; ze Spichlerzem bufor × spichlerzZachowaniePoPrzroscie (50%).
 *   - Deficyt: magazyn maleje; przy 0 i ujemnej nadwyżce → −1 ludność (min 1).
 *   - Cap bez Akweduktu: akweduktProgLudnosci (normal=5).
 *   - Cap z Akweduktem: akweduktMaxLudnosci (normal=15).
 *   - Zdrowie: modifier = max(0, 1 + zdrowie * wsp) [PT]
 */
export function populationGrowth(
  city: EconomyCity,
  zywnoscNetto: number,
  params: EconParams,
  wzrostThresholdMult: number = 1,
): PopulationGrowthResult {
  const { ludnosc, zdrowie, maSpichlerz, maSpichlerzII, maAkwedukt, magazynZywnosci } = city;

  const healthModifier  = Math.max(0, 1 + zdrowie * params.zdrowieModyfikatorWspolczynnik);
  const effectiveFlow   = zywnoscNetto >= 0
    ? zywnoscNetto * healthModifier
    : zywnoscNetto;

  const popCap = cityPopulationCap(maAkwedukt, params);

  let nowaLudnosc  = ludnosc;
  let nowyMagazynZywnosci  = magazynZywnosci;
  let wzrost       = false;
  let ubytek       = false;

  nowyMagazynZywnosci = magazynZywnosci + Math.floor(effectiveFlow);

  if (nowyMagazynZywnosci < 0) {
    nowyMagazynZywnosci = 0;
    if (ludnosc > 1) {
      nowaLudnosc = ludnosc - 1;
      ubytek      = true;
    }
    return { nowaLudnosc, nowyMagazynZywnosci, wzrost, ubytek };
  }

  const baseThreshold = 20 + ludnosc * params.progWzrostuWspolczynnik; // Próg wzrostu — wartości finalne (baza 20, wsp. w econ-params), wszystkie warianty i trudności
  const threshold = Math.max(1, Math.round(baseThreshold * wzrostThresholdMult));

  if (nowyMagazynZywnosci >= threshold && ludnosc < popCap) {
    nowaLudnosc = ludnosc + 1;
    wzrost      = true;
    const retainFrac = maSpichlerzII
      ? 0.7
      : (maSpichlerz ? params.spichlerzZachowaniePoPrzroscie : 0);
    nowyMagazynZywnosci = (maSpichlerz || maSpichlerzII)
      ? Math.floor(nowyMagazynZywnosci * retainFrac)
      : 0;
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

// ---------------------------------------------------------------------------
// B1-Q3 — drzewko technologii (re-eksport lane B; logika w tech-tree.ts)
// ---------------------------------------------------------------------------

export {
  TECH_TREE_MODEL_LINEAR,
  linearDepthInEpoch,
  orderedTechsInEpoch,
  readTechTreeModel,
  techPrereqChain,
  validateTechGraph,
} from './tech-tree';
export type { TechGraphValidation, TechTreeModel } from './tech-tree';
