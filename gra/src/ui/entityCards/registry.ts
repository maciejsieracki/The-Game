/**
 * entityCards/registry.ts — resolvery `id → surowy wiersz` per kind (plan §2).
 *
 * `technology` REUŻYWA istniejący `techToSlug`/`techNameFromSlug` z `sciencePicker.ts`
 * (WARIANT A, NFD-strip) — NIE nowy `slug.ts` z tego modułu — dokładnie jak nakazuje
 * `08-dispatch-T1-wznowienie.md` (ECHO=C): dzisiejsze drzewko technologii i jego `TECH_MAP`
 * zostają całkowicie nietknięte, nowy system kart tylko czyta te same nazwy przez ten sam
 * publiczny eksport, więc slug dla `id` technologii jest identyczny z tym, czego już
 * używa `scienceHubHud.ts`/`techTreeView.ts`.
 *
 * `unit` jest NOWY: własna `Map<slug, UnitDef>` budowana raz przy starcie modułu, slug
 * liczony przez skonsolidowany `slugify()` z `./slug.ts` — dla jednostek nie ma dziś
 * żadnego istniejącego sluga do zachowania kompatybilności (plan §2).
 *
 * `building`/`improvement` są cienkie — `buildings.json[].id` i klucz obiektu
 * `terrain-improvements.json` już SĄ kanonicznym identyfikatorem, zero derywacji.
 *
 * Zero edycji `sciencePicker.ts`/`research.ts` — tylko import ich publicznych eksportów.
 */
import type { UnitDef, BuildingDef } from '../../data/loader';
import buildingsData from '../../../data/buildings.json';
import unitsData from '../../../data/units.json';
import terrainImprovementsData from '../../../data/terrain-improvements.json';
import techData from '../../../data/tech.json';
import wondersData from '../../../data/wonders.json';
import { techToSlug, techNameFromSlug } from '../sciencePicker';
import { slugify } from './slug';
import type { EntityCardResolver } from './types';

// ---------------------------------------------------------------------------
// building
// ---------------------------------------------------------------------------

const BUILDINGS = buildingsData as unknown as BuildingDef[];

export const resolveBuildingRow: EntityCardResolver<BuildingDef> = (id) => {
  return BUILDINGS.find((b) => b.id === id) ?? null;
};

// ---------------------------------------------------------------------------
// improvement
// ---------------------------------------------------------------------------

/** Wiersz `terrain-improvements.json` — pola realnie użyte przez adaptery (T1: szkielet,
 * pełny kształt dokładnie odwzorowany w T7b). Klucz `_meta` w danych jest metadanym pliku,
 * nie encją — resolver go pomija (patrz `IMPROVEMENT_KEYS` niżej). */
export interface ImprovementRow {
  nazwa?: string;
  epoka?: number;
  bonus?: Record<string, number>;
  surowiecOdblokowany?: string | null;
  teren?: string;
  warunek?: string;
  koszt_praca?: number;
  tech?: string;
  odblokowuje?: string;
}

const TERRAIN_IMPROVEMENTS = terrainImprovementsData as unknown as Record<string, ImprovementRow>;

export const resolveImprovementRow: EntityCardResolver<ImprovementRow> = (id) => {
  if (id === '_meta') return null;
  return TERRAIN_IMPROVEMENTS[id] ?? null;
};

// ---------------------------------------------------------------------------
// technology — REUŻYWA TECH_MAP/techToSlug/techNameFromSlug z sciencePicker.ts
// ---------------------------------------------------------------------------

export interface RawTech {
  'Technologia': string;
  'Epoka': string;
  'Poziom': number;
  'Wymaga (prereq)': string;
  'wymagany budynek'?: string | null;
  'wymagane ulepszenie'?: string | null;
  'Odblokowuje budynek': string | null;
  'Odblokowuje surowiec.': string | null;
  'Odblokowuje ulepszenie terenu'?: string | null;
  'Koszt nauki': number;
  'Uwagi': string | null;
}

const TECH_LIST = (techData as unknown as { technologie: RawTech[] }).technologie;

/** Resolver technology: `id` to slug wg `techToSlug()` (WARIANT A, sciencePicker.ts) —
 * odzyskaj nazwę kanoniczną przez `techNameFromSlug()`, potem znajdź surowy wiersz
 * w `tech.json` po tej nazwie. NIE liczy sluga przez `./slug.ts` (WARIANT C) — patrz
 * nagłówek pliku. */
export const resolveTechnologyRow: EntityCardResolver<RawTech> = (id) => {
  const nazwa = techNameFromSlug(id);
  if (nazwa == null) return null;
  return TECH_LIST.find((t) => t['Technologia'] === nazwa) ?? null;
};

/** Slug kanoniczny technologii z jej nazwy — reeksport wygodny dla adapterów
 * (deleguje 1:1 do `sciencePicker.ts`, nie duplikuje logiki). */
export const technologyIdFromName = techToSlug;

// ---------------------------------------------------------------------------
// unit — NOWY, własna Map budowana raz przy starcie, skonsolidowany slug.ts
// ---------------------------------------------------------------------------

const UNITS = unitsData as unknown as UnitDef[];

function buildUnitMap(): Map<string, UnitDef> {
  const map = new Map<string, UnitDef>();
  for (const u of UNITS) {
    const name = u.Jednostka;
    if (name == null || name === '') continue;
    map.set(slugify(name), u);
  }
  return map;
}

const UNIT_MAP: Map<string, UnitDef> = buildUnitMap();

export const resolveUnitRow: EntityCardResolver<UnitDef> = (id) => {
  return UNIT_MAP.get(id) ?? null;
};

/** Slug kanoniczny jednostki z jej nazwy (`Jednostka`) — nowy, brak poprzednika
 * do zachowania kompatybilności (plan §2). */
export function unitToSlug(name: string): string {
  return slugify(name);
}

// ---------------------------------------------------------------------------
// wonder — R-KARTY-HISTORIA-INFRA-CUDA-Q1: NOWY, mapa `id → wiersz` budowana raz
// przy imporcie WYŁĄCZNIE z tablicy `cuda` (`wonders.json`) — `parkowane_epoka4plus`
// (5 nieaktywnych cudów) jest CELOWO POZA ZAKRESEM (dispatch RECON): nie dostają
// karty ani pola historia w tej rundzie, więc resolver ich w ogóle nie widzi.
// -----------------------------------------------------------------------------

/** Jeden bonus specjalny cudu (`bonusy.specjalne[]`) — wiersz `opis` gotowy do
 * wyświetlenia, reszta pól to metadane mechaniki (poza zakresem karty gracza). */
export interface WonderSpecialBonus {
  typ?: string;
  wartosc?: number;
  opis?: string;
  cel?: string;
}

/** Jeden bonus terenowy cudu (`bonusy.teren[]`). */
export interface WonderTerrainBonus {
  typTerenu?: string;
  warunek?: string;
  [resource: string]: string | number | undefined;
}

/** Wiersz `wonders.json.cuda[]` — pola realnie użyte przez `wonderAdapter.ts`.
 * `uwagi` jest CELOWO obecne w typie (dev-tekst istniejący w danych), ale
 * `wonderAdapter.ts` go NIE renderuje (ta sama zasada co dla pozostałych 4
 * kategorii — zapobieganie wyciekowi tekstu deweloperskiego graczowi). */
export interface WonderRow {
  id: string;
  nazwa?: string;
  nazwaAlt?: string;
  dostep?: string;
  cywilizacje?: string[];
  techUnlock?: string[];
  wymagaTerenu?: string[];
  epokaWejscia?: number;
  absolut?: number;
  maxNaSwiecie?: number;
  kosztBudowy?: number;
  utrzymanie?: number;
  bonusy?: {
    miasto?: Record<string, number>;
    teren?: WonderTerrainBonus[];
    specjalne?: WonderSpecialBonus[];
  };
  uwagi?: string;
  /** Rys historyczny (T-KARTY-HISTORIA-INFRA-Q1) — lowercase, konwencja spójna z
   * `buildings.json`/`terrain-improvements.json`. Pole NIE jest jeszcze zadeklarowane
   * w danych (dopisze je dopiero kolejny, treściowy dispatch); tu wyłącznie mechanizm. */
  historia?: string;
}

const WONDERS = (wondersData as unknown as { cuda: WonderRow[] }).cuda;

function buildWonderMap(): Map<string, WonderRow> {
  const map = new Map<string, WonderRow>();
  for (const w of WONDERS) {
    if (w?.id) map.set(w.id, w);
  }
  return map;
}

const WONDER_MAP: Map<string, WonderRow> = buildWonderMap();

export const resolveWonderRow: EntityCardResolver<WonderRow> = (id) => {
  return WONDER_MAP.get(id) ?? null;
};
