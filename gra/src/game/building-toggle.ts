/**
 * building-toggle.ts -- R-WEB-RESOURCE-BUILDING-ENABLE-TOGGLE-Q1 (decyzja wlasciciela 2026-11-11).
 *
 * Czysty modul (bez DOM/THREE): wlaczanie/wylaczanie budynkow PRODUKUJACYCH SUROWCE
 * per miasto per budynek.
 *
 * ZAKRES (wyliczony PRZED edycja kodu, patrz raport 10-operator-claude.md):
 *   - konwertery (receptury z DEFAULT_CONVERTER_RECIPES): cegielnia, garncarnia,
 *     odlewnia_brazu, odlewnia_zelaza, wielka_odlewnia (multi-receptura: braz / zelazo / stal);
 *   - surowe producenci "+% dopływu": stolarnia (+drewno), kamieniarski (+kamien).
 *   Kuznie (kuznia/kuznia_zelaza/wielka_kuznia) sa w grupie "Produkcja surowcow", ale NIE
 *   produkuja surowca (tylko bonus Pancerza) -- poza zakresem. Kopalnie/zloza to ulepszenia
 *   terenu, nie budynki miasta -- poza zakresem.
 *
 * SEMANTYKA: wylaczony budynek NADAL stoi (zostaje w builtIds / zapisie / prereq / odblokowaniach
 * technologii), ale w obliczeniach ekonomii jest pomijany: brak produkcji, brak zuzycia wejsc,
 * brak utrzymania (zloto + surowce). Ponowne wlaczenie przywraca normalne zachowanie.
 * Nic nie jest zwracane (koszt budowy) i nic nie jest usuwane (budynek, magazyn).
 *
 * STAN: `City.wylaczoneBudynki?: string[]` (id budynkow wylaczonych w TYM miescie).
 * Brak pola (stary zapis) = wszystko wlaczone. Serializowane razem z miastem.
 * PARYTET AI: te same funkcje dla gracza i AI; AI sama niczego nie wylacza.
 */

import {
  DEFAULT_CONVERTER_RECIPES,
  converterBuildingIdForRecipe,
  converterProductionDisplayForBuilding,
  type Difficulty,
  type RawConverterParamsJson,
} from './converters';

/** Budynki surowego "+% dopływu" (nie sa konwerterami). */
export const RAW_PRODUCER_BUILDING_IDS: readonly string[] = ['stolarnia', 'kamieniarski'];

/** Wszystkie id budynkow produkujacych surowce, ktore wolno wylaczyc (konwertery + surowe). */
export const TOGGLEABLE_PRODUCTION_BUILDING_IDS: ReadonlySet<string> = new Set<string>([
  ...DEFAULT_CONVERTER_RECIPES.map(converterBuildingIdForRecipe),
  ...RAW_PRODUCER_BUILDING_IDS,
]);

export function isToggleableProductionBuilding(buildingId: string): boolean {
  return TOGGLEABLE_PRODUCTION_BUILDING_IDS.has(buildingId);
}

/** Minimalny ksztalt miasta potrzebny temu modulowi (City spelnia go strukturalnie). */
export interface ToggleCityLike {
  id: string;
  wylaczoneBudynki?: string[];
}

/** Czy budynek jest wlaczony w tym miescie (budynki spoza zakresu sa zawsze "wlaczone"). */
export function isProductionBuildingEnabled(
  city: Pick<ToggleCityLike, 'wylaczoneBudynki'> | undefined,
  buildingId: string,
): boolean {
  if (!isToggleableProductionBuilding(buildingId)) return true;
  const off = city?.wylaczoneBudynki;
  return !(Array.isArray(off) && off.includes(buildingId));
}

/**
 * Ustaw stan budynku w miescie. Zwraca true gdy stan sie ZMIENIL (false: budynek spoza zakresu
 * albo stan juz taki sam). Pole zostaje usuniete gdy lista pusta (stary format zapisu).
 */
export function setProductionBuildingEnabled(
  city: ToggleCityLike,
  buildingId: string,
  enabled: boolean,
): boolean {
  if (!isToggleableProductionBuilding(buildingId)) return false;
  const cur = Array.isArray(city.wylaczoneBudynki) ? city.wylaczoneBudynki : [];
  const isOff = cur.includes(buildingId);
  if (enabled && isOff) {
    const next = cur.filter(id => id !== buildingId);
    if (next.length > 0) city.wylaczoneBudynki = next; else delete city.wylaczoneBudynki;
    return true;
  }
  if (!enabled && !isOff) {
    city.wylaczoneBudynki = [...cur, buildingId];
    return true;
  }
  return false;
}

/** Normalizacja po wczytaniu zapisu: tylko tekstowe id z zakresu, bez duplikatow; pusta -> brak pola. */
export function sanitizeDisabledBuildings(city: ToggleCityLike): void {
  const raw = city.wylaczoneBudynki as unknown;
  if (raw === undefined) return;
  if (!Array.isArray(raw)) { delete city.wylaczoneBudynki; return; }
  const clean: string[] = [];
  for (const id of raw) {
    if (typeof id === 'string' && isToggleableProductionBuilding(id) && !clean.includes(id)) clean.push(id);
  }
  if (clean.length > 0) city.wylaczoneBudynki = clean; else delete city.wylaczoneBudynki;
}

/** builtIds miasta bez wylaczonych budynkow produkcyjnych ("operacyjne" id do ekonomii). */
export function operationalBuiltIds(
  city: Pick<ToggleCityLike, 'wylaczoneBudynki'> | undefined,
  builtIds: readonly string[],
): readonly string[] {
  const off = city?.wylaczoneBudynki;
  if (!Array.isArray(off) || off.length === 0) return builtIds;
  return builtIds.filter(id => !(isToggleableProductionBuilding(id) && off.includes(id)));
}

/**
 * Mapa cityId -> operacyjne builtIds dla ekonomii (produkcja/zuzycie/utrzymanie).
 * Zwraca TE SAMA mape gdy zaden budynek nie jest wylaczony (zero kosztu, zero zmiany zachowania).
 */
export function operationalBuiltByCity(
  cities: ReadonlyArray<ToggleCityLike>,
  builtByCity: ReadonlyMap<string, readonly string[]>,
): ReadonlyMap<string, readonly string[]> {
  let out: Map<string, readonly string[]> | null = null;
  for (const city of cities) {
    const off = city.wylaczoneBudynki;
    if (!Array.isArray(off) || off.length === 0) continue;
    const built = builtByCity.get(city.id);
    if (!built) continue;
    const eff = operationalBuiltIds(city, built);
    if (eff === built) continue;
    if (!out) out = new Map(builtByCity);
    out.set(city.id, eff);
  }
  return out ?? builtByCity;
}

// ---------------------------------------------------------------------------
// Migawka dla panelu imperium (lista miast + agregaty per surowiec)
// ---------------------------------------------------------------------------

/** Etykiety surowcow przetworzonych (wyjscia konwerterow). */
export const PRODUCED_RESOURCE_LABELS: Readonly<Record<string, string>> = {
  cegla: 'Cegła',
  ceramika: 'Ceramika',
  braz: 'Brąz',
  zelazo: 'Żelazo',
  stal: 'Stal',
};

export interface EmpireProducerBuildingRow {
  buildingId: string;
  label: string;
  enabled: boolean;
}

export interface EmpireProducerCityRow {
  cityId: string;
  name: string;
  /** TYLKO budynki produkujace surowce zbudowane w tym miescie. */
  buildings: EmpireProducerBuildingRow[];
}

export interface EmpireProducerResourceRow {
  id: string;
  label: string;
  /**
   * Faktyczna produkcja z OSTATNIO przeliczonej tury (historia, nie prognoza).
   * `null` = brak danych (nowa gra / po wczytaniu, przed pierwsza przeliczona tura).
   */
  realizedLastTurn: number | null;
  /** Mozliwa produkcja z budynkow WLACZONYCH, przy nieograniczonych wejsciach i magazynie. */
  potentialEnabled: number;
  /** Mozliwa produkcja ze WSZYSTKICH zbudowanych (wlacznie z wylaczonymi) -- jw. */
  potentialInstalled: number;
}

export interface EmpireProducersSnap {
  cities: EmpireProducerCityRow[];
  resources: EmpireProducerResourceRow[];
}

export interface ProducersSnapCity extends ToggleCityLike {
  ownerId: number;
  name: string;
}

/**
 * Buduje migawke "Budynki produkcyjne" dla jednego ownera. Czysta: potencjal liczony TA SAMA funkcja
 * co pokazuje panel miasta (`converterProductionDisplayForBuilding`), wiec brak drugiej formuly.
 * `builtByCity` = PELNE (nieprzefiltrowane) listy budynkow -- stan wlaczony/wylaczony czytany z miasta.
 */
export function buildEmpireProducersSnap(args: {
  cities: ReadonlyArray<ProducersSnapCity>;
  ownerId: number;
  builtByCity: ReadonlyMap<string, readonly string[]>;
  era: number;
  rawParams: RawConverterParamsJson;
  difficulty: Difficulty;
  realizedLastTurn: Readonly<Record<string, number>> | undefined;
  buildingLabel: (buildingId: string) => string;
}): EmpireProducersSnap {
  const enabledPot: Record<string, number> = {};
  const installedPot: Record<string, number> = {};
  const cityRows: EmpireProducerCityRow[] = [];
  for (const city of args.cities) {
    if (city.ownerId !== args.ownerId) continue;
    const built = args.builtByCity.get(city.id) ?? [];
    const rows: EmpireProducerBuildingRow[] = [];
    for (const id of built) {
      if (!isToggleableProductionBuilding(id)) continue;
      const enabled = isProductionBuildingEnabled(city, id);
      rows.push({ buildingId: id, label: args.buildingLabel(id), enabled });
      const disp = converterProductionDisplayForBuilding(id, args.rawParams, args.difficulty, args.era);
      if (!disp) continue;
      for (const [res, amount] of Object.entries(disp.produced)) {
        installedPot[res] = (installedPot[res] ?? 0) + amount;
        if (enabled) enabledPot[res] = (enabledPot[res] ?? 0) + amount;
      }
    }
    if (rows.length > 0) cityRows.push({ cityId: city.id, name: city.name, buildings: rows });
  }
  const resources: EmpireProducerResourceRow[] = [];
  for (const [id, label] of Object.entries(PRODUCED_RESOURCE_LABELS)) {
    const installed = installedPot[id] ?? 0;
    const realized = args.realizedLastTurn ? (args.realizedLastTurn[id] ?? 0) : null;
    if (installed <= 0 && !(realized !== null && realized > 0)) continue;
    resources.push({
      id, label,
      realizedLastTurn: realized,
      potentialEnabled: Math.floor(enabledPot[id] ?? 0),
      potentialInstalled: Math.floor(installed),
    });
  }
  return { cities: cityRows, resources };
}
