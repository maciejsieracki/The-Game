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
import { applyCivMatrixParam, civMatrixParam, loadCivMatrix } from './civ-matrix';

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
  /**
   * G1 (R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1, wlasciciel 2026-09-05): czy budynek daje
   * Szczescie. Kryterium wlasciciela: czy MIESZKANIEC z budynku korzysta, czy tylko
   * panstwo albo wojsko. Zrodlem prawdy jest pole `dajeSzczescie` w data/buildings.json
   * (DANE, nie stala w kodzie) -- dodanie budynku w przyszlej epoce nie wymaga zmiany
   * TypeScriptu, wystarczy sklasyfikowac go w danych tym samym kryterium.
   * Brak pola = `false` (budynek bez Szczescia) -- cisza w danych NIE moze dawac
   * ryczaltu, bo to dokladnie ten blad, ktory G1 usuwa.
   */
  dajeSzczescie?:      boolean;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// EconParams
// ---------------------------------------------------------------------------

/** Economy parameters resolved for one difficulty level. */
export interface EconParams {
  progWzrostuWspolczynnik:          number;
  spichlerzZachowaniePoPrzroscie:   number;
  /** Twardy cap ludności bez ŻADNEGO budynku (Spichlerz/Akwedukt) — dolny stopień drabinki, domyślnie 5. */
  akweduktProgLudnosci:             number;
  /**
   * Twardy cap ludności ze Spichlerzem (I lub II), ale BEZ Akweduktu — środkowy stopień
   * drabinki (R-SPICHLERZ-CAP-LUDNOSCI-ETAP, Maciej 2026-08-09, ECHO A), domyślnie 8.
   */
  spichlerzProgLudnosci:            number;
  /** Twardy cap ludności po zbudowaniu Akweduktu — górny stopień (domyślnie 12, obniżka z dawnych 15). */
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
   * Tax-only Mint multiplier on handelNetto before the tax slider split.
   * The caller gates it with the owner's currency tech, a built Mint and gold
   * access. Rates: easy ×1.62, normal ×1.50, hard ×1.38. Route income bypasses
   * this city tax calculation and is unaffected.
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
    spichlerzProgLudnosci:          read(em, 'spichlerz_prog_ludnosci', 8),
    akweduktMaxLudnosci:            read(em, 'akwedukt_max_ludnosci', 12),
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
  /** P-SUROWCE-BAZA-DREWNO-KAMIEŃ-GLINA-Q1=A: baza terenu może dawać glinę; bonusy nakładek są addytywne. */
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
  /** Civilization key used to resolve Matrix population-cap deltas. */
  civKey?:         string | null;
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
  pieniadzZPracy: number;  // deprecated compatibility field; always 0 (Work is converted manually from the empire pool)
  /**
   * Decyzja 67B (Maciej 2026-07-25, cytat: "Budynki, jeżeli miały wcześniej handel...
   * powinny go dawać nie bezpośrednio do skarbca, tylko do puli, do podziału"). Suma
   * SUROWA (przed-mnoznikowa, przed podzialem suwakiem) Pieniadza z bazy budynkow
   * (Σ buildingValue(record, level, 'pieniadz')) -- WYLACZNIE pole informacyjne do
   * UI/debug (panel miasta "ile Pieniadza z budynkow"). Ta wartosc NIE trafia
   * bezposrednio do `pieniadz` (patrz Step 3/8
   * nizej) -- wchodzi do handelBazowy PRZED Targowiskiem/civHandelMult/trasami/
   * korupcja/Waluta+Mennica i dopiero POTEM jest
   * dzielona suwakiem Nauka/Pieniadz/Luksus razem z reszta Daniny. Realny wplyw
   * mnoznikow/podzialu widac w polu `pieniadz` (i `nauka`/`luksus`), NIE tutaj.
   */
  pieniadzBudynkow: number;
  /**
   * E1 Zadanie 2: surowce logistyczne zebrane z pól tej tury (informacyjnie w wyniku
   * cityYieldPerTurn — ta sama suma tileYield co computeWorkedMagazynYieldsByCity).
   * Kredyt do magazynu państwa: turn-economy.ts tickEmpireResourcePipeline
   * (R-HEX-PLONY-MAGAZYN B: worked + ulepszenia surowiec_ilosc_tura addytywnie).
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

// Klucz 'Wybrzeże' zostaje dosłownie — etykieta z terrain-yields.json, poza allowlistą
// P-MAPGEN-PANGEA-OBRYS-P4-WYBRZEZE-Q1 (nietknięty plik danych); wartość mapuje już na
// nowy TerenBazowy.PlytkieMorze.
const TERRAIN_NAME_TO_ENUM: Record<string, TerenBazowy> = {
  'Łąka':     TerenBazowy.Laka,
  'Równina':  TerenBazowy.Rownina,
  'Wzgórza':  TerenBazowy.Wzgorza,
  'Góry':     TerenBazowy.Gory,
  'Wybrzeże': TerenBazowy.PlytkieMorze,
  'Morze':    TerenBazowy.Morze,
  'Pustynia': TerenBazowy.Pustynia,
  'Polarny':  TerenBazowy.Polarny,
};

function terrainRowToTileYield(row: TerrainTypeDef | TerrainModifierDef): TileYield {
  return {
    zywnosc: Number(row['Żywność'] ?? 0),
    praca:   Number(row['Praca'] ?? 0),
    handel:  Number(row['Podatek'] ?? row['Handel'] ?? 0),
    drewno:  Number(row['Drewno'] ?? 0),
    kamien:  Number(row['Kamień'] ?? 0),
    glina:   Number((row as { Glina?: number | null }).Glina ?? 0),
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
  return row ? terrainRowToTileYield(row as TerrainModifierDef) : ZERO_YIELD;
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
    glina   += RIVER_MODIFIER.glina;
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

/**
 * Ryczałt Szczęścia za budynek — ale WYŁĄCZNIE dla budynków oznaczonych w danych
 * `dajeSzczescie: true` (G1, R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1, właściciel 2026-09-05).
 * Do 2026-09-05 obowiązywał każdy budynek bez wyjątku (decyzja Macieja 2026-07-22),
 * przez co Mury, Koszary czy Warsztat oblężniczy podnosiły Szczęście miasta.
 */
export const BUILDING_HAPPINESS_BASE_PER_BUILDING = 1;

/**
 * Czy ten budynek w ogóle daje Szczęście. Decyduje POLE DANYCH `dajeSzczescie`
 * (data/buildings.json), nie lista w kodzie — G1. Brak pola = `false`: budynek
 * niesklasyfikowany nie dostaje ryczałtu ani bonusu `baza.zadowolenie`.
 */
export function buildingGivesHappiness(b: { dajeSzczescie?: unknown }): boolean {
  return b.dajeSzczescie === true;
}

/**
 * Szczęście z jednego budynku: ryczałt +1 + ewentualny bonus z `baza.zadowolenie`,
 * ale tylko dla budynku szczęściodajnego. Np. Świątynia (zadowolenie 2, poziom 1) → 3;
 * Spichlerz (zadowolenie 4) → 5; Mury (`dajeSzczescie: false`) → DOKŁADNIE 0.
 */
export function buildingHappinessAtLevel(
  b: Pick<BuildingRecord, 'baza'> & { dajeSzczescie?: unknown },
  level: number,
): number {
  if (!buildingGivesHappiness(b)) return 0;
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
  /** G1: klasyfikacja szczęściodajności z data/buildings.json. Brak = false. */
  dajeSzczescie?: unknown;
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
   * Corruption/waste loss fraction [0, cap]. D1 (Maciej 2026-07-25): affects ONLY
   * handelNetto (Danina/Podatek) below, NEVER Praca. Compute via corruptionRate()
   * (dystansOdStolicy, liczbaWszystkichMiast, params), then multiply by
   * (1 - corruptionBuildingReduction(builtIds)) for Sad/Pretorium/Palac (D4) --
   * caller (turn-economy.ts) does this BEFORE building this ctx. NOTE: even the
   * capital in a 1-city empire is NOT automatically 0 -- korupcjaWspolczynnikMiast
   * still applies (liczbaWszystkichMiast >= 1), only dystansOdStolicy is 0 for it.
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
   * Mennica (Mint) zbudowana GDZIEKOLWIEK W IMPERIUM tego właściciela (NIE
   * "w tym mieście" -- zmiana Maciej 2026-07-25, pytanie 71/C: "moneta bita w
   * jednym miejscu obsługuje obieg całego państwa", w parze z decyzją B, że
   * Mennica stoi WYŁĄCZNIE w stolicy). Wołający (turn-economy.ts, cityPanel.ts)
   * liczy to jako union budynków po WSZYSTKICH miastach tego ownera -- economy.ts
   * samo nie zna innych miast, dostaje gotowy boolean. Sam ten flag nic nie
   * mnoży -- jest jednym z DWÓCH warunków (obok walutaOdkryta) bramki Mint
   * tax multiplier below. The one built Mint activates its tax effect across
   * every city owned by that civilization.
   */
  maMennica:      boolean;
  /**
   * Waluta (currency tech) discovered by this player. Mint modifies only local
   * tax when this and the empire-wide Mint flag are both true. Difficulty rate:
   * easy ×1.62 / normal ×1.50 / hard ×1.38. Trade routes are not in this pool.
   * Work-to-tax conversion is an explicit owner action from the remaining empire pool.
   * Optional; defaults to false so existing ctx literals remain valid.
   */
  walutaOdkryta?: boolean;
  /** RDY-01: mnoznik na Handel z bonusu cyw (np. Grecy +15%). Domyslnie 1. */
  civHandelMult?: number;
  /** RDY-01: mnoznik na Nauke z bonusu cyw (np. Inkowie +15%). Domyslnie 1. */
  civNaukaMult?: number;
  /**
   * T4 (R-HANDEL-SZLAKI-PRZEBUDOWA-Q1, ECHO Q3 Wariant C, runda 2): suma
   * per-trasowych bonusow Handlu tego miasta -- dla kazdej trasy tego miasta z
   * `budynekOdblokowany===true`, `0.05 * wlasny dochod dystansowy tej strony
   * trasy` (patrz trade-routes.ts computeTradeRouteBuildingBonusByCity, BEZ
   * mnoznika bonusu cudow CUDA-HANDEL-01). ZASTEPUJE stary
   * `liczbaAktywnychTrasHandlowych`/mnoznik (1+0.05*n), ktory liczyl WSZYSTKIE
   * polaczone trasy niezaleznie od budynku (bug znaleziony przez Final Control
   * T3). Addytywny skladnik do handelBrutto -- NIE laczony mnoznikowo z
   * Targowiskiem/civHandelMult, zeby uniknac podwojnego liczenia. Domyslnie 0
   * (brak tras z budynkiem).
   */
  premiaHandluTrasHandlowych?: number;
  /** Owner-selected Work converted to ordinary tax, already expressed at the configured rate. */
  additionalTax?: number;
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

/** Compatibility API: matrix value, or the supplied generic system fallback. */
export function mnoznikHandelPieniadzForCiv(
  civKey: string | null | undefined,
  _civs: { cywilizacje?: CivMnoznikRow[] } | null | undefined,
  fallback = 1,
): number {
  const matrixValue = civMatrixMnoznikHandelPieniadzRaw(civKey);
  return matrixValue === undefined ? fallback : matrixValue;
}

/**
 * Canonical matrix source for a known civilization. Raw zero is a matrix value
 * and must not reactivate the retired civs.json multiplier.
 */
function civMatrixMnoznikHandelPieniadzRaw(civKey: string | null | undefined): number | undefined {
  if (!civKey) return undefined;
  const key = civKey.toLowerCase();
  const known = loadCivMatrix().cywilizacje.some((row) => [
    row.ikonaId,
    row.typCywilizacji,
    row.Cywilizacja,
  ].some((id) => id.toLowerCase() === key));
  if (!known) return undefined;
  const value = civMatrixParam(civKey, 'meta_mnoznik_waluta');
  return Number.isFinite(value) ? value : undefined;
}

/**
 * Difficulty delta applied on top of the canonical civ-matrix.json
 * meta_mnoznik_waluta value (decyzja Maciej 2026-07-25, pytanie 69 --
 * "mnoznik cywilizacyjny skalowany poziomem trudnosci"): "Zostawmy go jako
 * obowiazujacy dla poziomu normal. Wersja easy bedzie miala pol punktu wiecej
 * [...] wersja hard pol punktu mniej." The matrix number IS the normal-difficulty
 * value; we never edit source data here -- the +0.5 / -0.5 scaling lives only here.
 */
const MNOZNIK_HANDEL_TRUDNOSC_DELTA: Record<Difficulty, number> = {
  easy:   0.5,
  normal: 0,
  hard:   -0.5,
};

/**
 * Matrix multiplier with the established difficulty delta. The civs.json
 * numerical field is never read. `fallbackScaled` is the generic difficulty
 * baseline for owners without a resolving matrix key.
 *
 * `fallbackScaled` already includes generic difficulty behavior and is not
 * adjusted a second time. Known matrix raw zero remains authoritative and
 * receives the existing difficulty delta like any other matrix value.
 */
export function mnoznikHandelPieniadzForCivByDifficulty(
  civKey: string | null | undefined,
  _civs: { cywilizacje?: CivMnoznikRow[] } | null | undefined,
  difficulty: Difficulty,
  fallbackScaled: number,
): number {
  const raw = civMatrixMnoznikHandelPieniadzRaw(civKey);
  if (raw === undefined) return fallbackScaled;
  return raw + (MNOZNIK_HANDEL_TRUDNOSC_DELTA[difficulty] ?? 0);
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

/** Legacy civs.json yield bonuses are no longer numerical consumer inputs. */
export function civEconomyYieldMultipliers(
  _bonusy: readonly CivEconomyBonus[] | undefined,
): { handel: number; nauka: number } {
  return { handel: 1, nauka: 1 };
}

/**
 * Compute the full per-turn yield for a city.
 *
 * Steps (Spec-ekonomia.md ss.1.2, 1.3, 1.4, 2.1, 3.1):
 *   1. Sum terrain yields from workedTiles.
 *   2. Apply Mlyn multiplier on tile Praca; Cegielnia bonus on gross tile Praca.
 *   3'. Sum building BASE outputs; Work stays in the empire pool unless manually converted.
 *   3. Build the local tax pool from terrain and building cash, then apply local trade modifiers.
 *      "Budynki, jeżeli miały wcześniej handel... powinny go dawać nie bezpośrednio
 *      do skarbca, tylko do puli, do podziału"). pieniadzBudynkow is part of the
 *      trade/tax base; Work remains in the empire pool unless explicitly converted.
 *   5. Apply corruption/waste (strataFraction) do calego Handlu/Daniny (juz z
 *      pieniadzBudynkow w srodku) -- D1: Praca NIGDY nie jest tym
 *      dotknieta.
 *   6. Split Handel via trade slider into Nauka / Pieniadz / Luksus.
 *   7. Apply Mennica multiplier to caly Handel (w tym pieniadzBudynkow); Biblioteka bonus to Nauka.
 *   8. Add specialist Poborca bonus do Pieniadza (jedyny strumien Pieniadza, ktory
 *      nadal omija podzial suwakiem -- poza zakresem decyzji 67B).
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

  // --- Step 3: Sum building BASE outputs. Musi powstac TERAZ (a nie po handlu),
  // because building Work is part of the city production split.
  // is retained as a city yield component; the resulting empire pool is handled separately.
  let pracaBudynkow    = 0;
  let pieniadzBudynkow = 0;
  let zywnoscBudynkow  = 0;
  let naukaBudynkow    = 0;
  let kulturaBudynkow  = 0;
  let zadBudynkow      = 0;
  let pieniadzPortu    = 0;

  for (const { record, level } of cityBuildings) {
    pracaBudynkow    += buildingValue(record, level, 'praca');
    const buildingMoney = buildingValue(record, level, 'pieniadz');
    pieniadzBudynkow += buildingMoney;
    if (record.id === 'port') pieniadzPortu += buildingMoney;
    zywnoscBudynkow  += buildingValue(record, level, 'zywnosc');
    naukaBudynkow    += buildingValue(record, level, 'nauka');
    kulturaBudynkow  += buildingValue(record, level, 'kultura');
    zadBudynkow      += buildingHappinessAtLevel(record, level);
  }

  // Port income is a separately named source: its own building cash and connected
  // maritime routes receive this coefficient once, before the general gross-trade
  // and cash-share stages. Land-route income remains untouched here.
  const portRaw = city.civKey ? civMatrixParam(city.civKey, 'eko_pieniadz_port_proc') : 0;
  if (city.civKey && portRaw !== 0) {
    pieniadzBudynkow += pieniadzPortu * portRaw;
  }

  // Dawne "mnoznik% -> Praca" USUNIETE 2026-07-25 — patrz komentarz funkcji powyzej.
  // Praca miasta to czysta suma teren+budynki, bez mnoznika.
  const pracaBruttoLacznie = pracaBruttoTerenu + pracaBudynkow;
  // D1 (Maciej 2026-07-25): "Korupcja ma dotykać tylko i wyłącznie daniny, a potem
  // podatku, nie pracy." -- Praca NIGDY nie jest mnozona przez strate korupcji
  // (patrz Step 5 nizej, ktory strata dotyka tylko Handel/Danine).
  // F-04 approved owner work coefficient (mul_proc). A source zero is neutral;
  // the matrix owns this effect, while unrelated building/terrain/Order effects
  // remain in their existing stages. Missing owner identity stays neutral.
  const pracaNetto = city.civKey
    ? applyCivMatrixParam(pracaBruttoLacznie, city.civKey, 'eko_praca_proc')
    : pracaBruttoLacznie;

  // Work assigned to the empire pool remains there unless the owner explicitly
  // converts some of the remaining balance. `additionalTax` enters the tax stream
  // through its own context field, after the local Targowisko gross-trade bonus.
  const walutaOdkrytaOnly = ctx.walutaOdkryta === true;
  const pracaInt = cityPracaInteger(pracaNetto);
  const pieniadzZPracy = 0;

  // City tax excludes route proceeds. Manual Work tax is added after route-only
  // bonuses, then follows the ordinary corruption, Mint and slider stages.
  const handelBazowy = handelTerenu + pieniadzBudynkow;
  let handelBrutto = handelBazowy;
  // For a known matrix owner, the matrix is authoritative (including raw zero)
  // for this legacy-overlapping gross-trade effect. Unknown/missing owner keys
  // retain the existing legacy multiplier behavior.
  const civHandelMult = city.civKey ? 1 : (ctx.civHandelMult ?? 1);
  if (civHandelMult !== 1) {
    handelBrutto *= civHandelMult;
  }
  // T4 (runda 2): premia za trasy handlowe Z BUDYNKIEM, addytywna suma
  // per-trasowych bonusow 0.05*wlasny dochod dystansowy -- patrz
  // CityYieldContext.premiaHandluTrasHandlowych. ZASTEPUJE stary mnoznik
  // (1+0.05*n) liczony ze WSZYSTKICH polaczonych tras niezaleznie od budynku.
  const premiaTrasHandlowych = ctx.premiaHandluTrasHandlowych ?? 0;
  if (premiaTrasHandlowych > 0) {
    handelBrutto += premiaTrasHandlowych;
  }
  // F-04: replace the same-effect legacy multiplier above and apply the approved
  // general gross-trade coefficient once to the complete named gross stage.
  if (city.civKey) handelBrutto = applyCivMatrixParam(handelBrutto, city.civKey, 'eko_handel_brutto_proc');
  // Manual Work tax joins after local and route-only gross modifiers, so it is
  // never multiplied by the Market route bonus or route-building premiums.
  handelBrutto += Math.max(0, ctx.additionalTax ?? 0);

  // --- Step 5: Apply corruption/waste to the complete tax base, including manual
  // Work tax. Unconverted Work still in the empire pool is not affected. ---
  const strataRaw = city.civKey
    ? applyCivMatrixParam(ctx.strataFraction, city.civKey, 'eko_korupcja_proc')
    : ctx.strataFraction;
  const strata = Math.min(strataRaw, params.korupcjaCap);
  const handelNettoRaw    = handelBrutto       * (1 - strata);
  // Mint affects the local tax pool only. Separately settled route cash bypasses it.
  const walutaActive = walutaOdkrytaOnly && ctx.maMennica === true;
  const walutaMnoznikBase = params.mennicaMnoznikPoWalucie;
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
  const luksusZHandluRaw = Math.floor(handelNetto * pctLuksus);
  const luksusZHandlu = city.civKey
    ? Math.floor(applyCivMatrixParam(luksusZHandluRaw, city.civKey, 'eko_luksus_proc'))
    : luksusZHandluRaw;

  // Biblioteka: +Nauka% applied to the city's local science (master par.2a).
  // Akademia (ZADANIE 2, 2026-07-25, decyzja 4): +Nauka% osobny, stackuje ADDYTYWNIE
  // z Biblioteka -- (1 + bibliotekaBonus + akademiaBonus), NIE (1+b)*(1+a). Kolejnosc
  // nie zmieniona: premia dziala PO zsumowaniu plonow budynkow (naukaBudynkow), wiec
  // mnozy takze wlasne 6 pkt Nauki Akademii -- ten sam efekt co Biblioteka ma dzis.
  const naukaBonusFactor = 1
    + (ctx.maBiblioteka ? params.budynekBibliotekaBonusNauki : 0)
    + (ctx.maAkademia   ? params.budynekAkademiaBonusNauki   : 0);
  const naukaLokalnaRaw  = Math.floor((naukaZHandlu + naukaBudynkow) * naukaBonusFactor);
  const naukaLokalna = city.civKey
    ? Math.floor(applyCivMatrixParam(naukaLokalnaRaw, city.civKey, 'eko_nauka_proc'))
    : (ctx.civNaukaMult !== undefined && ctx.civNaukaMult !== 1
      ? Math.floor(naukaLokalnaRaw * ctx.civNaukaMult)
      : naukaLokalnaRaw);

  // --- Step 8: Money from the tax allocation plus specialist Poborca. Building
  // money, manual Work tax, and route-derived amounts are each added to their own
  // appropriate stage above, preventing duplicate credit.
  let pieniadzTotal = city.civKey
    ? applyCivMatrixParam(pieniadzZHandlu, city.civKey, 'eko_pieniadz_proc')
    : pieniadzZHandlu;
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
  const zywnoscBruttoRaw = zywnoscBruttoBaza * garncarniaMnoznikZywnosci;
  const zywnoscBrutto = city.civKey
    ? applyCivMatrixParam(zywnoscBruttoRaw, city.civKey, 'eko_zywnosc_proc')
    : zywnoscBruttoRaw;
  const zywnoscZuzyta = city.ludnosc * params.zywnoscZuzytkaPopulacja
                       + ctx.wojskoZuzycieZywnosci;
  const zywnoscNetto  = zywnoscBrutto - zywnoscZuzyta;

  return {
    praca:          pracaInt,
    pieniadz:       Math.floor(pieniadzTotal),
    zywnosc:        Math.floor(zywnoscNetto),
    nauka:          naukaLokalna,
    luksus:         luksusZHandlu,
    kultura:        Math.floor(city.civKey
      ? applyCivMatrixParam(kulturaBudynkow, city.civKey, 'eko_kultura_proc')
      : kulturaBudynkow),
    zadowolenie:    Math.floor(zadBudynkow),
    zywnoscBrutto:  Math.floor(zywnoscBrutto),
    handelBrutto:   Math.floor(handelBrutto),
    pracaTerenu:    Math.floor(pracaBruttoTerenu),
    pracaBudynkow:  Math.floor(pracaBudynkow),
    pieniadzZPracy,
    pieniadzBudynkow: Math.floor(pieniadzBudynkow),
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

/**
 * Aktualny twardy cap ludności miasta — drabinka 3 stopni (R-SPICHLERZ-CAP-LUDNOSCI-ETAP,
 * Maciej 2026-08-09, ECHO A): bez żadnego budynku → akweduktProgLudnosci (normal=5); ze
 * Spichlerzem (I lub II), ale bez Akweduktu → spichlerzProgLudnosci (normal=8); z Akweduktem
 * (niezależnie od Spichlerza) → akweduktMaxLudnosci (normal=12, obniżka z dawnych 15).
 * `maSpichlerz` = sam fakt POSIADANIA budynku w DOWOLNYM tierze (I lub II) — cap to stały
 * parametr strukturalny, nie zależy od odprowadzenia Ceramiki/Soli w danej turze (to inny
 * mechanizm, patrz `SpichlerzCityBonusState` w `building-resource-gate.ts`).
 */
export function cityPopulationCap(
  maAkwedukt: boolean,
  maSpichlerz: boolean,
  params: Pick<EconParams, 'akweduktProgLudnosci' | 'spichlerzProgLudnosci' | 'akweduktMaxLudnosci'>,
  matrixDelta: number = 0,
): number {
  const buildingCap = maAkwedukt
    ? params.akweduktMaxLudnosci
    : maSpichlerz
      ? params.spichlerzProgLudnosci
      : params.akweduktProgLudnosci;
  const safeDelta = matrixDelta === -1 || matrixDelta === 0 || matrixDelta === 1 || matrixDelta === 2
    ? matrixDelta
    : 0;
  return Math.min(14, buildingCap + safeDelta);
}

/** Resolve the owner civilization's approved additive population-cap delta. */
export function resolvePopulationCapMatrixDelta(civKey: string | null | undefined): number {
  const value = civKey ? civMatrixParam(civKey, 'lud_limit_populacji') : 0;
  return value === -1 || value === 0 || value === 1 || value === 2 ? value : 0;
}

/**
 * Compute population change for one turn.
 *
 * Rules (B5-SPICH, Maciej 2026-06-29; drabinka capu R-SPICHLERZ-CAP-LUDNOSCI-ETAP 2026-08-09):
 *   - Bufor wzrostu kumuluje się ZAWSZE (z/bez Spichlerza) z zywnoscNetto (część „Rozwój miast”).
 *   - Próg: Threshold(N) = 20 + N * coeff → +1 ludność.
 *   - Po wzroście: bez Spichlerza bufor → 0; ze Spichlerzem bufor × spichlerzZachowaniePoPrzroscie (50%).
 *   - Deficyt: magazyn maleje; przy 0 i ujemnej nadwyżce → −1 ludność (min 1).
 *   - Cap bez żadnego budynku: akweduktProgLudnosci (normal=5).
 *   - Cap ze Spichlerzem (I lub II), bez Akweduktu: spichlerzProgLudnosci (normal=8).
 *   - Cap z Akweduktem: akweduktMaxLudnosci (normal=12).
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

  const popCap = cityPopulationCap(
    maAkwedukt,
    maSpichlerz || !!maSpichlerzII,
    params,
    resolvePopulationCapMatrixDelta(city.civKey),
  );

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

/** Building ids that reduce corruption when present IN THIS CITY (D4, Maciej 2026-07-25). */
const KORUPCJA_REDUKCJA_BUDYNKI = ['sad', 'pretorium', 'palac'] as const;
/** Reduction per building, as a fraction of the base corruption rate (30 punktow procentowych). */
const KORUPCJA_REDUKCJA_NA_BUDYNEK = 0.30;
/**
 * Naturalny sufit sumy redukcji to 0.60 (Sad + Palac w stolicy, albo Sad + Pretorium
 * w regionie -- Palac ma lokalizacja:"stolica", Pretorium lokalizacja:"region", wiec
 * zaden budynek nie moze wystapic w obu miejscach naraz). Mimo to jawny Math.min
 * ponizej zabezpiecza przed przyszla zmiana danych (D4, Maciej 2026-07-25).
 */
const KORUPCJA_REDUKCJA_SUFIT = 0.60;

/**
 * Decyzja 59 + Pałac (D4, Maciej 2026-07-25): Sąd, Pretorium i Pałac redukują korupcję,
 * każdy o 30 punktów procentowych, ADDYTYWNIE, TYLKO w mieście w ktorym stoja (nie
 * globalnie w imperium). Redukcja dziala jako mnoznik na strataBazowa z corruptionRate():
 *   strataPoRedukcji = strataBazowa * (1 - sumaRedukcji).
 * PARYTET AI: wywolujacy stosuje ta sama funkcje identycznie dla gracza i AI.
 *
 * @param builtIds - identyfikatory budynkow zbudowanych W TYM MIEScie (nie w imperium)
 * @returns ulamek redukcji [0, 0.60]
 */
export function corruptionBuildingReduction(builtIds: readonly string[]): number {
  let suma = 0;
  for (const id of KORUPCJA_REDUKCJA_BUDYNKI) {
    if (builtIds.includes(id)) suma += KORUPCJA_REDUKCJA_NA_BUDYNEK;
  }
  return Math.min(KORUPCJA_REDUKCJA_SUFIT, suma);
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
