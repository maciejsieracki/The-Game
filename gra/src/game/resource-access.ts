/**

 * resource-access.ts — surowce w zasięgu miasta (ABC-19: potencjał vs dostęp aktywny).

 * Panel miasta: getCityResourceAccessForCity → { potential, active }.

 * getResourceAccessForCity → tylko active (bramki budynków / produkcji).

 */

import improvementsJson from '../../data/terrain-improvements.json';

import { Nakladka } from '../types/hex';

import type { GameMap } from '../types/map';

import { isDepositVisible, zlozeMinEraFor } from '../map/deposit-era';

import { hexDistance } from '../units/setup';

import { citySightRadius } from './okolica';

import { hasBrazAccess } from './braz-access';

import {

  computeEmpireLivestockUnlocks,

  type LivestockKey,

} from './livestock-unlock';

import { normalizeImprovementKey } from './terrain-improvements';



type HexZloze = { nakladka?: Nakladka; zloze?: string; zlozeMinEra?: number };



type ImprovementRow = { surowiecOdblokowany?: string | string[] | null };



/** JSON może mieć tablicę lub legacy string `"[\"bydlo\",...]"`. */

function parseSurowiecOdblokowany(raw: string | string[] | null | undefined): string[] {

  if (!raw) return [];

  if (Array.isArray(raw)) return raw;

  const t = raw.trim();

  if (t.startsWith('[')) {

    try {

      const parsed = JSON.parse(t) as unknown;

      if (Array.isArray(parsed)) return parsed.map(String);

    } catch { /* fallback */ }

  }

  return [raw];

}



const IMPROVEMENTS = improvementsJson as Record<string, ImprovementRow>;



/** Mapowanie nakładki / znacznika zloze → nazwa wyświetlana (resources.json). */

const NAKLADKA_LABEL: Partial<Record<Nakladka, string>> = {

  [Nakladka.ZlozeGliny]: 'Glina',

  [Nakladka.ZlozeRudy]:  'Ruda',

  [Nakladka.ZlozeKonia]: 'Koń',

  [Nakladka.ZlozeOwiec]: 'Owce',

  [Nakladka.ZlozeBydla]: 'Bydło (krowa/wół)',

  [Nakladka.ZlozeLamy]:  'Lama',

};



const ZLOZE_LABEL: Record<string, string> = {

  wegiel: 'Węgiel',

  sol:      'Sól',

  miedz:    'Ruda miedzi',

  zelazo:   'Ruda żelaza',

  stal:     'Stal',

};



/** Klucze ASCII z terrain-improvements.json → etykieta panelu (resources.json Surowiec). */

const SUROWIEC_KEY_LABEL: Record<string, string> = {

  drewno: 'Drewno',

  kamien: 'Kamień',

  glina:  'Glina',

  ruda:   'Ruda',

  zelazo: 'Żelazo',

  stal:   'Stal',

  bydlo:  'Bydło (krowa/wół)',

  owce:   'Owce',

  lama:   'Lama',

  kon:    'Koń',

  sol:    'Sól',

  braz:   'Brąz',

};



function labelForHex(hex: HexZloze, currentEra = 99): string | null {

  const z = hex.zloze?.trim().toLowerCase();

  if (z) {

    if (!isDepositVisible(hex, currentEra)) return null;

    if (ZLOZE_LABEL[z]) return ZLOZE_LABEL[z]!;

    return z.charAt(0).toUpperCase() + z.slice(1);

  }

  const n = hex.nakladka;

  if (n && n !== Nakladka.Brak && n !== Nakladka.Las && NAKLADKA_LABEL[n]) {

    return NAKLADKA_LABEL[n]!;

  }

  return null;

}



/** Etykieta surowca / złoża na heksie (panel mapy, podgląd kontekstowy). */

export function hexDepositDisplayLabel(hex: HexZloze, currentEra = 99): string | null {

  return labelForHex(hex, currentEra);

}



const ERA_UI_NAMES: Record<number, string> = {

  1: 'Kamień',

  2: 'Brąz',

  3: 'Żelazo',

};



/** Gdy złoże jest na mapie, ale epoka gracza nie pozwala jeszcze rozpoznać typu. */

export function hexHiddenDepositHint(hex: HexZloze, currentEra = 99): string | null {

  const z = hex.zloze?.trim().toLowerCase();

  if (!z || isDepositVisible(hex, currentEra)) return null;

  const name = ZLOZE_LABEL[z] ?? (z.charAt(0).toUpperCase() + z.slice(1));

  const minEra = zlozeMinEraFor(hex);

  const eraName = ERA_UI_NAMES[minEra] ?? `epoki ${minEra}`;

  return `${name} — ukryte (widoczne od epoki ${eraName})`;

}



export function labelsForImprovementUnlock(

  improvementKey: string | undefined | null,

): string[] {

  if (!improvementKey) return [];

  const keys = parseSurowiecOdblokowany(IMPROVEMENTS[improvementKey]?.surowiecOdblokowany);

  if (keys.length === 0) return [];

  return keys

    .map(k => SUROWIEC_KEY_LABEL[k] ?? (k ? k.charAt(0).toUpperCase() + k.slice(1) : ''))

    .filter(Boolean);

}



export interface ResourceAccessCity {

  id: string;

  q: number;

  r: number;

  population: number;

  kulturaSkumulowana?: number;

}



export interface ResourceAccessOptions {

  /** Właściciel heksów — do filtrowania odblokowań hodowli imperium. */

  ownerId?: string;

  /** Budynki miasta — bramka brązu (Popalnia AND Piec hutniczy). */

  builtIds?: readonly string[];

  /** Wstępnie obliczone odblokowania hodowli (opcjonalnie z main.ts). */

  empireLivestockUnlocks?: ReadonlySet<LivestockKey>;

}



export interface CityResourceAccess {

  /** Złoża widoczne w zasięgu — jeszcze bez aktywnego dostępu (ABC-19 A). */

  potential: string[];

  /** Surowce używalne: ulepszenie / hodowla / brąz AND-gate. */

  active: string[];

}



function improvementKeysOnPlacedHex(imp: string | readonly string[]): string[] {

  if (typeof imp === 'string') {

    const k = normalizeImprovementKey(imp);

    return k ? [k] : [];

  }

  return imp

    .map(k => normalizeImprovementKey(String(k)))

    .filter((k): k is string => !!k);

}



function sortLabels(labels: Iterable<string>): string[] {

  return Array.from(labels).sort((a, b) => a.localeCompare(b, 'pl'));

}



function hexesInCitySight(

  city: ResourceAccessCity,

  map: GameMap,

): Array<{ hexKey: string; hex: typeof map.hexes[string] & HexZloze }> {

  const sight = citySightRadius(city.population, city.kulturaSkumulowana ?? 0);

  if (sight <= 0) return [];

  const out: Array<{ hexKey: string; hex: typeof map.hexes[string] & HexZloze }> = [];

  for (const [hexKey, hex] of Object.entries(map.hexes)) {

    if (hexDistance(city.q, city.r, hex.coords.q, hex.coords.r) > sight) continue;

    out.push({ hexKey, hex: hex as typeof hex & HexZloze });

  }

  return out;

}



function collectDepositPotential(

  city: ResourceAccessCity,

  map: GameMap,

  currentEra: number,

): Set<string> {

  const found = new Set<string>();

  for (const { hex } of hexesInCitySight(city, map)) {

    const label = labelForHex(hex, currentEra);

    if (label) found.add(label);

  }

  return found;

}



function collectActiveAccess(

  city: ResourceAccessCity,

  map: GameMap,

  placedImprovements: ReadonlyMap<string, string | readonly string[]> | null | undefined,

  options: ResourceAccessOptions,

): Set<string> {

  const sight = citySightRadius(city.population, city.kulturaSkumulowana ?? 0);

  const found = new Set<string>();



  if (placedImprovements && sight > 0) {

    for (const [hexKey, impKey] of placedImprovements) {

      const hex = map.hexes[hexKey];

      if (!hex) continue;

      if (hexDistance(city.q, city.r, hex.coords.q, hex.coords.r) > sight) continue;

      for (const key of improvementKeysOnPlacedHex(impKey)) {

        for (const label of labelsForImprovementUnlock(key)) {

          found.add(label);

        }

      }

    }

  }



  const livestockUnlocks = options.empireLivestockUnlocks

    ?? (placedImprovements

      ? computeEmpireLivestockUnlocks(placedImprovements, map, options.ownerId)

      : undefined);

  if (livestockUnlocks) {

    for (const lk of livestockUnlocks) {

      const label = SUROWIEC_KEY_LABEL[lk];

      if (label) found.add(label);

    }

  }



  if (options.builtIds && hasBrazAccess(placedImprovements, options.builtIds)) {

    found.add(SUROWIEC_KEY_LABEL.braz!);

  }



  return found;

}



/**

 * ABC-19 A: potencjał (złoże) vs dostęp aktywny (ulepszenie / bramka).

 */

export function getCityResourceAccessForCity(

  city: ResourceAccessCity,

  map: GameMap,

  placedImprovements?: ReadonlyMap<string, string | readonly string[]> | null,

  currentEra = 99,

  options: ResourceAccessOptions = {},

): CityResourceAccess {

  const activeSet = collectActiveAccess(city, map, placedImprovements, options);

  const potentialRaw = collectDepositPotential(city, map, currentEra);

  const potentialSet = new Set<string>();

  for (const label of potentialRaw) {

    if (!activeSet.has(label)) potentialSet.add(label);

  }

  return {

    potential: sortLabels(potentialSet),

    active: sortLabels(activeSet),

  };

}



/**

 * Tylko aktywny dostęp — bramki budynków, produkcji, dyplomacji (v0.1 boolean).

 */

export function getResourceAccessForCity(

  city: ResourceAccessCity,

  map: GameMap,

  placedImprovements?: ReadonlyMap<string, string | readonly string[]> | null,

  currentEra = 99,

  options: ResourceAccessOptions = {},

): string[] {

  return getCityResourceAccessForCity(

    city, map, placedImprovements, currentEra, options,

  ).active;

}


