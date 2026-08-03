/**
 * auto-improvements.ts
 * Wspólny picker auto-ulepszeń terenu (gracz + AI).
 * Kwalifikacja heksów = buildImprovementQualifier (map/improvement-build.ts).
 * PURE — bez DOM, bez THREE.
 */

import type { GameMap } from '../types/map';
import { Nakladka } from '../types/hex';
import type { ImprovementKey } from '../render/improvements';
import type { TerritoryNode } from '../map/territory';
import { cityTerritoryRadius } from '../map/territory';
import { buildImprovementQualifier, type ImprovementBuildState } from '../map/improvement-build';
import { hexKeysWithinRadius } from './okolica';
import { getImprovementMeta, isImprovementTechUnlocked } from './improvement-tech';
import { isImprovementAllowedForCiv } from './terrain-improvements';
import type { UlepszeniaFocus } from './cities';
import { DEFAULT_ULEPSZENIA_FOCUS } from './cities';

/** Minimalny kształt miasta dla pickera (gracz + AI). */
export interface AutoImprovementCity {
  id: string;
  ownerId: number;
  q: number;
  r: number;
  population: number;
  ulepszeniaFocus?: UlepszeniaFocus;
  ulepszeniaOnlyWorked?: boolean;
}

export interface AutoImprovementPick {
  ownerId: number;
  cityId: string;
  q: number;
  r: number;
  key: ImprovementKey;
  kosztPraca: number;
}

/** Kolejność priorytetów AI / profil Zrównoważone (determinizm A=B). */
export const AI_IMPROVEMENT_PRIORITY: readonly ImprovementKey[] = [
  'farma', 'bydlo', 'owce', 'lama', 'tarasy', 'oboz_lowiecki', 'lodzie_rybackie',
  'irygacja', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kamieniolom', 'glinianka', 'stadnina',
  'warzelnia_soli', 'tartak', 'posterunek', 'droga', 'droga_brukowana', 'fort',
  'wyrab',
];

const ULEPSZENIA_FOCUS_ZYWNOSC: readonly ImprovementKey[] = [
  'farma', 'bydlo', 'owce', 'lama', 'tarasy', 'oboz_lowiecki', 'lodzie_rybackie', 'irygacja',
];

const ULEPSZENIA_FOCUS_SUROWCE: readonly ImprovementKey[] = [
  'tartak', 'kamieniolom', 'glinianka', 'kopalnia_miedzi', 'kopalnia_zelaza',
  'stadnina', 'warzelnia_soli',
];

const ULEPSZENIA_FOCUS_INFRASTRUKTURA: readonly ImprovementKey[] = [
  'posterunek', 'droga', 'droga_brukowana', 'fort',
];

const ULEPSZENIA_FOCUS_ZROWNOWAZONE: readonly ImprovementKey[] = AI_IMPROVEMENT_PRIORITY;

/** TEMAT #8: próg zachowania lasu przy wyrębie (>= N heksów lasu w promieniu miasta). */
export const WYRAB_MIN_FOREST_IN_RADIUS = 3;

/** R-AUTO-V2-Q4=B: minimalna rezerwa Pracy państwa po auto-ulepszeniu (placeholder do strojenia). */
export const AUTO_ULEPSZENIA_PRACA_RESERVE = 30;

/** Zwraca listę typów ulepszeń wg profilu focus. */
export function prioritiesForUlepszeniaFocus(
  focus: UlepszeniaFocus,
  skipWyrab = false,
): readonly ImprovementKey[] {
  let list: readonly ImprovementKey[];
  switch (focus) {
    case 'zywnosc':
      list = ULEPSZENIA_FOCUS_ZYWNOSC;
      break;
    case 'surowce':
      list = ULEPSZENIA_FOCUS_SUROWCE;
      break;
    case 'infrastruktura':
      list = ULEPSZENIA_FOCUS_INFRASTRUKTURA;
      break;
    case 'zrownowazone':
    default:
      list = ULEPSZENIA_FOCUS_ZROWNOWAZONE;
      break;
  }
  if (skipWyrab) {
    return list.filter(k => k !== 'wyrab');
  }
  return list;
}

export interface PickAutoImprovementsOpts {
  cities: readonly AutoImprovementCity[];
  ownerId: number;
  map: GameMap;
  territoryNodes?: readonly TerritoryNode[];
  placedImprovements?: ReadonlyMap<string, string | readonly string[]>;
  pracaAvailable: number;
  unlockedTechs: ReadonlySet<string>;
  /** Profil per miasto (domyślnie city.ulepszeniaFocus ?? zrownowazone). */
  getFocus?: (city: AutoImprovementCity) => UlepszeniaFocus;
  /** Filtr heksów — tylko obrabiane (domyślnie city.ulepszeniaOnlyWorked ?? false). */
  getOnlyWorked?: (city: AutoImprovementCity) => boolean;
  getWorkedHexKeys?: (city: AutoImprovementCity) => ReadonlySet<string>;
  /** Stały limit (gdy brak getMaxPerCity). */
  maxPerCity?: number;
  /** R-AUTO-ULEPSZENIA-Q2=B: limit per miasto (1–3). Nadpisuje maxPerCity. */
  getMaxPerCity?: (city: AutoImprovementCity) => number;
  pracaSurplusThreshold?: number;
  skipWyrab?: boolean;
  civArchetype?: string;
  playerEra?: number;
  isImprovementAllowedForCiv?: (key: ImprovementKey, civArchetype?: string) => boolean;
  /** Nadpisanie kolejności (np. AI deficit boost). */
  priorityOverride?: readonly ImprovementKey[];
}

/**
 * Planuje auto-ulepszenia: max `maxPerCity` (domyślnie 1) na miasto na turę.
 * Determinizm: miasta po id, heksy po (q,r), typy wg profilu.
 */
export function pickAutoImprovements(opts: PickAutoImprovementsOpts): AutoImprovementPick[] {
  const {
    cities,
    ownerId,
    map,
    territoryNodes,
    placedImprovements,
    unlockedTechs,
    getFocus = c => c.ulepszeniaFocus ?? DEFAULT_ULEPSZENIA_FOCUS,
    getOnlyWorked = c => c.ulepszeniaOnlyWorked ?? false,
    getWorkedHexKeys,
    maxPerCity = 1,
    getMaxPerCity,
    pracaSurplusThreshold = 0,
    skipWyrab = false,
    civArchetype,
    playerEra,
    isImprovementAllowedForCiv: civGate = isImprovementAllowedForCiv,
    priorityOverride,
  } = opts;

  if (cities.length === 0 || !territoryNodes) return [];

  let pracaLeft = opts.pracaAvailable;
  const reserve = opts.pracaSurplusThreshold ?? 0;
  if (pracaLeft <= reserve) return [];

  const workingPlaced = new Map<string, string[]>();
  if (placedImprovements) {
    for (const [hk, v] of placedImprovements) {
      workingPlaced.set(hk, Array.isArray(v) ? [...v] : [v]);
    }
  }

  const state: ImprovementBuildState = {
    map,
    cityNodes: cities.map(c => ({ q: c.q, r: c.r, pop: c.population, level: 1 })),
    territoryNodes,
    playerOwnerIdNum: ownerId,
    placedImprovements: workingPlaced,
    researchedTechs: unlockedTechs,
    playerCivArchetype: civArchetype,
    playerEra,
  };
  const qualifies = buildImprovementQualifier(state);

  const orderedCities = [...cities].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const picks: AutoImprovementPick[] = [];
  const scheduledWyrabHexes = new Set<string>();

  for (const city of orderedCities) {
    if (pracaLeft <= reserve) break;

    const focus = getFocus(city);
    const basePriority = priorityOverride ?? prioritiesForUlepszeniaFocus(focus, skipWyrab);
    const onlyWorked = getOnlyWorked(city);
    const workedKeys = onlyWorked && getWorkedHexKeys ? getWorkedHexKeys(city) : null;
    const cityMax = Math.max(1, Math.min(3, getMaxPerCity?.(city) ?? maxPerCity));

    const radius = cityTerritoryRadius({ q: city.q, r: city.r, pop: city.population, level: 1 }) + 1;
    let candidateHexes = hexKeysWithinRadius(city.q, city.r, radius, map)
      .map(k => {
        const [qs, rs] = k.split(',');
        return { q: Number(qs), r: Number(rs) };
      })
      .sort((a, b) => (a.q - b.q) || (a.r - b.r));

    if (workedKeys) {
      candidateHexes = candidateHexes.filter(({ q, r }) => workedKeys.has(`${q},${r}`));
    }

    let placedThisCity = 0;

    for (const key of basePriority) {
      if (placedThisCity >= cityMax) break;
      const meta = getImprovementMeta(key);
      if (!meta) continue;
      if (meta.kosztPraca > pracaLeft) continue;
      if (pracaLeft - meta.kosztPraca < reserve) continue;
      if (!isImprovementTechUnlocked(key, unlockedTechs)) continue;
      if (!civGate(key, civArchetype)) continue;

      if (key === 'wyrab' && !skipWyrab) {
        const forestCount = candidateHexes.reduce((n, { q, r }) => {
          const hk = `${q},${r}`;
          if (scheduledWyrabHexes.has(hk)) return n;
          return map.hexes[hk]?.nakladka === Nakladka.Las ? n + 1 : n;
        }, 0);
        if (forestCount < WYRAB_MIN_FOREST_IN_RADIUS) continue;
      }

      // Q2=B: ten sam typ (np. farma) wielokrotnie na różnych heksach aż do cityMax.
      while (placedThisCity < cityMax && meta.kosztPraca <= pracaLeft) {
        if (pracaLeft - meta.kosztPraca < reserve) break;
        let placedOne = false;
        for (const { q, r } of candidateHexes) {
          const hexKey = `${q},${r}`;
          if (key === 'wyrab' && scheduledWyrabHexes.has(hexKey)) continue;
          if (!qualifies(key, q, r)) continue;

          picks.push({
            ownerId,
            cityId: city.id,
            q,
            r,
            key,
            kosztPraca: meta.kosztPraca,
          });
          pracaLeft -= meta.kosztPraca;
          placedThisCity++;

          if (key === 'wyrab') {
            scheduledWyrabHexes.add(hexKey);
          } else {
            const cur = workingPlaced.get(hexKey) ?? [];
            workingPlaced.set(hexKey, [...cur, key]);
          }
          placedOne = true;
          break;
        }
        if (!placedOne) break;
      }
      if (pracaLeft <= reserve) break;
    }
  }

  return picks;
}
