/**
 * loader.ts
 * Wczytuje dane gry z plików JSON wygenerowanych przez tools/export-data.py.
 *
 * Używaj: import { loadGameData } from './data/loader';
 * Zwraca obiekt GameData z typowanymi tablicami/słownikami dla każdego arkusza.
 *
 * Uwaga: JSON-y są importowane statycznie — Vite bundluje je razem z JS.
 * Nie ma opóźnienia sieciowego; dane są dostępne synchronicznie.
 */

// ─── Surowe importy JSON ──────────────────────────────────────────────────────

import unitsRaw       from '../../data/units.json';
import buildingsRaw   from '../../data/buildings.json';
import resourcesRaw   from '../../data/resources.json';
import techRaw        from '../../data/tech.json';
import civsRaw        from '../../data/civs.json';
import terrainYieldsRaw  from '../../data/terrain-yields.json';
import terrainCombatRaw  from '../../data/terrain-combat.json';
import countersRaw    from '../../data/counters.json';
import diplomacyRaw   from '../../data/diplomacy.json';
import econParamsRaw  from '../../data/econ-params.json';
import aiParamsRaw    from '../../data/ai-params.json';
import societyParamsRaw from '../../data/society-params.json';
import terrainMovementRaw from '../../data/terrain-movement.json';

// ─── Typy danych statycznych (wiersze z Excela) ───────────────────────────────

/** Wiersz z arkusza Jednostki.xlsx — stat bazowy jednego typu jednostki. */
export interface UnitDef {
  Jednostka: string;
  Epoka: string | null;
  Kultura: string | null;
  Tech: string | null;
  'Pieniądz (koszt)': number | null;
  Ludność: number | null;
  Surowiec: string | null;
  'Surowiec (ilość)': number | null;
  'Utrzymanie (Pieniądz/turę)': number | null;
  'żywność/turę': number | null;
  Atak: number | null;
  Uderzenie: number | null;
  Obrona: number | null;
  Ruch: number | null;
  'Ruch w bitwie (heksy)': number | null;
  Health: number | null;
  'Próg dezercji (% health)': number | null;
  'Widok pola': number | null;
  'Atak dystansowy': number | null;
  'Zasięg ataku (hex)': string | number | null;
  'Ilość pocisków': string | number | null;
  'W zamian za': string | null;
  'Super-jednostka': string | null;
  Uwagi: string | null;
  'Rola (linia)': string | null;
  Pancerz: number | null;
  Przebicie: number | null;
  'Kara obrony z flanki (%)': string | number | null;
  'Kara obrony z tyłu (%)': string | number | null;
}

/** Wiersz z arkusza Budynki.xlsx. */
export interface BuildingDef {
  id: string;
  nazwa: string;
  kategoria: string;
  epokaWejscia: number;
  maksPoziom: number;
  nazwyPoziomow: string[];
  baza: {
    praca: number;
    pieniadz: number;
    zywnosc: number;
    nauka: number;
    kultura: number;
    zadowolenie: number;
    obrona: number;
    mnoznik: number;
  };
  przyrost: {
    praca: number;
    pieniadz: number;
    zywnosc: number;
    nauka: number;
    kultura: number;
    zadowolenie: number;
    obrona: number;
    mnoznik: number;
  };
  kosztBudowy: number;
  przyrostKosztu: number;
  utrzymanie: number;
  przyrostUtrzymania: number;
  wymagania: string;
  uwagi: string;
  techUnlock: string;
}

/** Wiersz z arkusza Surowce.xlsx. */
export interface ResourceDef {
  Surowiec: string;
  Typ: string | null;
  'Źródło / budynek': string | null;
  Uwagi: string | null;
}

/** Wiersz z arkusza Technologie-drzewko.xlsx. */
export interface TechDef {
  Technologia: string;
  Epoka: string | null;
  Poziom: number | null;
  'Dostęp do surowca.': string | null;
  'wymagany budynek': string | null;
  'Wymaga (prereq)': string | null;
  'Odblokowuje surowiec.': string | null;
  'Odblokowuje budynek': string | null;
  'Koszt nauki': number | null;
  Uwagi: string | null;
}

/** Jeden bonus cywilizacji (z tablicy bonusy[] w civs.json). */
export interface CivBonus {
  typ: string;
  cel: string;
  wartosc: number | string;
  opis: string;
  realizuje: string;
}

/** Jedna cywilizacja z arkusza Cywilizacje.xlsx. */
export interface CivDef {
  Cywilizacja: string;
  'Styl / charakter': string | null;
  'Jednostka specjalna': string | null;
  'Bonus startowy': string | null;
  'Bonusy/minusy (do dopracowania)': string | null;
  Uwagi: string | null;
  /** Klucz identyfikujący cywilizację (np. 'grecy', 'rzymianie') — odpowiada TypCywilizacji enum. */
  ikonaId?: string;
  /** Mnoznik przychodu z handlu (Pieniadz). */
  mnoznikHandelPieniadz?: number;
  /** Nazwy miast w klastrze tej cywilizacji. */
  nazwyKlastra?: string[];
  /** Bonusy/maliki tej cywilizacji do użycia przez systemy gry. */
  bonusy?: CivBonus[];
}

/** Warunki startowe (drugi arkusz Cywilizacje.xlsx). */
export interface StartGryDef {
  [key: string]: string | number | null;
}

/** Dane cywilizacji (oba arkusze). */
export interface CivsData {
  cywilizacje: CivDef[];
  start_gry: StartGryDef[];
}

/** Plony terenu bazowego. */
export interface TerrainTypeDef {
  Teren: string;
  Żywność: number | null;
  Praca: number | null;
  Handel: number | null;
  Drewno: number | null;
  Kamień: number | null;
  Suma: number | null;
  Uwagi: string | null;
}

/** Modyfikatory terenu (nakładki, rzeka, itp.). */
export interface TerrainModifierDef {
  [key: string]: string | number | null;
}

/** Koszty ruchu terenu bazowego + modyfikator lasu. */
export interface TerrainMovementData {
  costs: Record<string, number>;
  forestExtra: number;
}

/** Dane plonów terenu (oba sub-arkusze). */
export interface TerrainYieldsData {
  terrain_types: TerrainTypeDef[];
  terrain_modifiers: TerrainModifierDef[];
}

/** Wiersz z arkusza Countery (relacje counter jednostek). */
export interface CounterDef {
  'Typ atakujący': string | null;
  'Cel (typ)': string | null;
  Bonus: string | null;
  'Rodzaj (Atak/Obrona)': string | null;
  Status: string | null;
}

/** Wiersz z arkusza Teren-combat (modyfikatory terenu w walce). */
export interface TerrainCombatDef {
  Teren: string;
  'Koszt wejścia (ruch)': string | null;
  'Bonus Obrona': string | null;
  'Δ Zasięg (dystansowi)': string | null;
  'Kawaleria/Rydwan': string | null;
  'Efekt specjalny': string | null;
}

/** Parametr ekonomiczny (jeden wiersz z Ekonomia-parametry.xlsx). */
export interface EconParamDef {
  wartość: number | null;
  jednostka: string | null;
  sekcja: string | null;
  opis: string | null;
}

/** Parametr AI (jeden wiersz z AI-parametry.xlsx). */
export interface AiParamDef {
  wartość: number | null;
  /** ASCII alias for wartość (used in ai.ts bracket-access entry['wartosc']). */
  wartosc?: number | null;
  sekcja: string | null;
  opis: string | null;
}

/**
 * Zbiorczy interfejs danych gry zwracany przez loadGameData().
 * Zawiera wszystkie statyczne dane wczytane z JSON-ów.
 */
export interface GameData {
  /** Definicje typów jednostek (stats bazowe). */
  units: UnitDef[];
  /** Definicje budynków (koszty i efekty). */
  buildings: BuildingDef[];
  /** Definicje surowców (typ, źródło). */
  resources: ResourceDef[];
  /** Drzewko technologiczne (prereqy, koszty, bonusy). */
  tech: TechDef[];
  /** Cywilizacje i ich warunki startowe. */
  civs: CivsData;
  /** Plony terenu bazowego + modyfikatory. */
  terrainYields: TerrainYieldsData;
  /** Modyfikatory walki na terenie. */
  terrainCombat: TerrainCombatDef[];
  /** Relacje counter jednostek (bonus ataku/obrony). */
  counters: CounterDef[];
  /** Dane dyplomacji (akcje, parametry, panel sterowania). */
  diplomacy: typeof diplomacyRaw;
  /** Parametry ekonomiczne (słownik klucz → wartość + meta). */
  econParams: Record<string, EconParamDef>;
  /** Parametry AI (słownik klucz → wartość + meta). */
  aiParams: Record<string, AiParamDef>;
  /** Parametry społeczeństwa (zdrowie, szczęście, kultura, religia). */
  societyParams: typeof societyParamsRaw;
  /** Koszty ruchu terenu bazowego + modyfikator lasu (z Excel 'Ruch terenu'). */
  terrainMovement: TerrainMovementData;
}

// ─── Loader ───────────────────────────────────────────────────────────────────

/**
 * Zwraca bundle wszystkich statycznych danych gry z plików JSON.
 * Dane są importowane statycznie przez Vite — brak żadnych opóźnień.
 *
 * Przykład użycia:
 *   const data = loadGameData();
 *   console.log(`Jednostki: ${data.units.length}`);
 */
export function loadGameData(): GameData {
  return {
    units:         unitsRaw         as UnitDef[],
    buildings:     buildingsRaw     as BuildingDef[],
    resources:     resourcesRaw     as ResourceDef[],
    tech:          (Array.isArray(techRaw) ? techRaw : (techRaw as any).technologie ?? []) as TechDef[],
    civs:          civsRaw          as CivsData,
    terrainYields: terrainYieldsRaw as TerrainYieldsData,
    terrainCombat: terrainCombatRaw as TerrainCombatDef[],
    counters:      countersRaw      as CounterDef[],
    diplomacy:     diplomacyRaw,
    econParams:    econParamsRaw    as unknown as Record<string, EconParamDef>,
    aiParams:      aiParamsRaw      as unknown as Record<string, AiParamDef>,
    societyParams: societyParamsRaw,
    terrainMovement: terrainMovementRaw as TerrainMovementData,
  };
}

// ─── Pomocnicze akcesory ──────────────────────────────────────────────────────

/**
 * Zwraca definicję jednostki po nazwie (pole "Jednostka") lub undefined gdy brak.
 */
export function getUnitDef(data: GameData, nazwa: string): UnitDef | undefined {
  return data.units.find(u => u.Jednostka === nazwa);
}

/**
 * Zwraca definicję budynku po nazwie (pole "Budynek") lub undefined gdy brak.
 */
export function getBuildingDef(data: GameData, nazwa: string): BuildingDef | undefined {
  return data.buildings.find(b => b.nazwa === nazwa);
}

/**
 * Zwraca definicję technologii po nazwie (pole "Technologia") lub undefined gdy brak.
 */
export function getTechDef(data: GameData, nazwa: string): TechDef | undefined {
  return data.tech.find(t => t.Technologia === nazwa);
}

/**
 * Zwraca listę technologii dostępnych na danym poziomie drzewka.
 */
export function getTechByLevel(data: GameData, poziom: number): TechDef[] {
  return data.tech.filter(t => t.Poziom === poziom);
}

/**
 * Zwraca definicje bojowe terenu po nazwie terenu lub undefined gdy brak.
 */
export function getTerrainCombat(data: GameData, teren: string): TerrainCombatDef | undefined {
  return data.terrainCombat.find(t => t.Teren === teren);
}
