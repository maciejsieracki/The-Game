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
  type ConverterBuildingUtilization,
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
  // Dopyw z mapy zwiekszany przez Stolarnie / Warsztat kamieniarski (+% dopywu, nie konwerter).
  drewno: 'Drewno',
  kamien: 'Kamień',
};

/** Surowiec "dopywu z mapy" -> budynek, ktory go zwieksza (wiersz agregatu pojawia sie tylko gdy taki stoi). */
export const RAW_INFLOW_RESOURCE_BUILDING: Readonly<Record<string, string>> = {
  drewno: 'stolarnia',
  kamien: 'kamieniarski',
};

/**
 * R-WEB-UI-RESOURCE-BUILDING-UTILIZATION-PERCENT-Q1: wykorzystanie mocy budynku w NASTEPNEJ turze
 * (z TEGO SAMEGO przebiegu co prognoza produkcji). Wylaczony budynek nie ma widoku (`enabled: false`).
 *  - 'converter'    : konwerter z receptura; `pct` = cykle/maks. cykle, `limitedBy`/`missing` gdy < 100%
 *  - 'noConversion' : Stolarnia / Warsztat kamieniarski -- brak wejscia/konwersji (dodaja % dopywu), pelne 100%
 *  - 'asleep'       : konwerter wlaczony, ale uspiony przez bramke runtime (np. brak dostepu do zloza) -- 0%
 */
export interface BuildingUtilizationView {
  kind: 'converter' | 'noConversion' | 'asleep';
  pct: number;
  limitedBy?: 'wejscie' | 'magazyn' | 'przepustowosc';
  /** Brakujace do pelnej mocy wejscia: surowiec -> sztuki. */
  missing: Record<string, number>;
  cykle: number;
  maxCykle: number;
}

export interface EmpireProducerBuildingRow {
  buildingId: string;
  label: string;
  enabled: boolean;
  /** Brak gdy wylaczony albo gdy nie podano prognozy. */
  utilization?: BuildingUtilizationView;
}

/** Zbiorczo per typ budynku (cala cywilizacja): ile sztuk, ile wylaczonych, srednie wykorzystanie wlaczonych. */
export interface EmpireProducerTypeSummary {
  buildingId: string;
  label: string;
  count: number;
  disabled: number;
  /** Srednie wazone (suma cykli / suma maks. cykli) wlaczonych; null = brak wlaczonych lub brak prognozy. */
  avgPct: number | null;
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
  /**
   * PROGNOZA nastepnej tury: wartosc z TEGO SAMEGO kodu co realny tick (`forecastNextTurnProduction`),
   * z uwzglednieniem wylaczonych budynkow, biezacych zapasow wejsc i konkurencji o wspolne wejscia.
   * `null` = brak prognozy (np. nie podano). "Jesli nic sie nie zmieni do konca tury."
   */
  forecastNextTurn: number | null;
  /** Mozliwa produkcja z budynkow WLACZONYCH, przy nieograniczonych wejsciach i magazynie. */
  potentialEnabled: number;
  /** Mozliwa produkcja ze WSZYSTKICH zbudowanych (wlacznie z wylaczonymi) -- jw. */
  potentialInstalled: number;
}

export interface EmpireProducersSnap {
  cities: EmpireProducerCityRow[];
  /** Agregat per typ budynku (tylko gdy podano prognoze wykorzystania). */
  typeSummaries?: EmpireProducerTypeSummary[];
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
  /** Prognoza nastepnej tury per surowiec (konwertery + dopyw drewna/kamienia); brak = bez prognozy. */
  forecastNext?: Readonly<Record<string, number>>;
  /** Maksimum dopywu drewna/kamienia (przy wlaczonych / przy wszystkich zainstalowanych budynkach). */
  rawInflowPotential?: {
    enabled: Readonly<Record<string, number>>;
    installed: Readonly<Record<string, number>>;
  };
  /** cityId -> buildingId -> wykorzystanie mocy (z forecastNextTurnProduction); brak = bez procentow. */
  utilizationByCity?: ReadonlyMap<string, Readonly<Record<string, ConverterBuildingUtilization>>>;
  buildingLabel: (buildingId: string) => string;
}): EmpireProducersSnap {
  const enabledPot: Record<string, number> = {};
  const installedPot: Record<string, number> = {};
  const cityRows: EmpireProducerCityRow[] = [];
  const rawBuiltInstalled = new Set<string>();
  for (const city of args.cities) {
    if (city.ownerId !== args.ownerId) continue;
    const built = args.builtByCity.get(city.id) ?? [];
    const rows: EmpireProducerBuildingRow[] = [];
    for (const id of built) {
      if (!isToggleableProductionBuilding(id)) continue;
      const enabled = isProductionBuildingEnabled(city, id);
      const row: EmpireProducerBuildingRow = { buildingId: id, label: args.buildingLabel(id), enabled };
      if (enabled && args.utilizationByCity) {
        const u = args.utilizationByCity.get(city.id)?.[id];
        if (RAW_PRODUCER_BUILDING_IDS.includes(id)) {
          row.utilization = { kind: 'noConversion', pct: 100, missing: {}, cykle: 0, maxCykle: 0 };
        } else if (u) {
          row.utilization = {
            kind: 'converter', pct: u.pct, limitedBy: u.limitedBy, missing: { ...u.missing },
            cykle: u.cykle, maxCykle: u.maxCykle,
          };
        } else {
          row.utilization = { kind: 'asleep', pct: 0, missing: {}, cykle: 0, maxCykle: 0 };
        }
      }
      rows.push(row);
      if (RAW_PRODUCER_BUILDING_IDS.includes(id)) rawBuiltInstalled.add(id);
      const disp = converterProductionDisplayForBuilding(id, args.rawParams, args.difficulty, args.era);
      if (!disp) continue;
      for (const [res, amount] of Object.entries(disp.produced)) {
        installedPot[res] = (installedPot[res] ?? 0) + amount;
        if (enabled) enabledPot[res] = (enabledPot[res] ?? 0) + amount;
      }
    }
    if (rows.length > 0) cityRows.push({ cityId: city.id, name: city.name, buildings: rows });
  }
  let typeSummaries: EmpireProducerTypeSummary[] | undefined;
  if (args.utilizationByCity) {
    // Tylko konwertery (stolarnia/kamieniarski nie maja przerobu -- srednia bylaby bezuzyteczna).
    const acc = new Map<string, { label: string; count: number; disabled: number; cykle: number; max: number; pctSum: number; pctN: number }>();
    for (const c of cityRows) {
      for (const b of c.buildings) {
        if (RAW_PRODUCER_BUILDING_IDS.includes(b.buildingId)) continue;
        const t = acc.get(b.buildingId) ?? { label: b.label, count: 0, disabled: 0, cykle: 0, max: 0, pctSum: 0, pctN: 0 };
        t.count += 1;
        if (!b.enabled) t.disabled += 1;
        else if (b.utilization) {
          t.cykle += b.utilization.cykle;
          t.max += b.utilization.maxCykle;
          t.pctSum += b.utilization.pct;
          t.pctN += 1;
        }
        acc.set(b.buildingId, t);
      }
    }
    typeSummaries = [...acc.entries()].map(([buildingId, t]) => ({
      buildingId, label: t.label, count: t.count, disabled: t.disabled,
      avgPct: t.max > 0 ? Math.round((100 * t.cykle) / t.max) : (t.pctN > 0 ? Math.round(t.pctSum / t.pctN) : null),
    }));
  }
  const resources: EmpireProducerResourceRow[] = [];
  for (const [id, label] of Object.entries(PRODUCED_RESOURCE_LABELS)) {
    const rawBuilding = RAW_INFLOW_RESOURCE_BUILDING[id];
    const forecast = args.forecastNext ? (args.forecastNext[id] ?? 0) : null;
    if (rawBuilding !== undefined) {
      // Drewno / Kamien: wiersz tylko gdy stoi Stolarnia / Warsztat kamieniarski (inaczej to zwykly dopyw z mapy).
      if (!rawBuiltInstalled.has(rawBuilding)) continue;
      resources.push({
        id, label,
        realizedLastTurn: args.realizedLastTurn ? (args.realizedLastTurn[id] ?? 0) : null,
        forecastNextTurn: forecast,
        potentialEnabled: Math.floor(args.rawInflowPotential?.enabled[id] ?? 0),
        potentialInstalled: Math.floor(args.rawInflowPotential?.installed[id] ?? 0),
      });
      continue;
    }
    const installed = installedPot[id] ?? 0;
    const realized = args.realizedLastTurn ? (args.realizedLastTurn[id] ?? 0) : null;
    if (installed <= 0 && !(realized !== null && realized > 0)) continue;
    resources.push({
      id, label,
      realizedLastTurn: realized,
      forecastNextTurn: forecast,
      potentialEnabled: Math.floor(enabledPot[id] ?? 0),
      potentialInstalled: Math.floor(installed),
    });
  }
  return typeSummaries ? { cities: cityRows, typeSummaries, resources } : { cities: cityRows, resources };
}
