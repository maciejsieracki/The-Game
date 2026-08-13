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
  'irygacja', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_cyny', 'kamieniolom', 'glinianka', 'stadnina',
  'warzelnia_soli', 'tartak', 'posterunek', 'droga', 'droga_brukowana', 'fort',
  'wyrab',
];

const ULEPSZENIA_FOCUS_ZYWNOSC: readonly ImprovementKey[] = [
  'farma', 'bydlo', 'owce', 'lama', 'tarasy', 'oboz_lowiecki', 'lodzie_rybackie', 'irygacja',
];

const ULEPSZENIA_FOCUS_SUROWCE: readonly ImprovementKey[] = [
  'tartak', 'kamieniolom', 'glinianka', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_cyny',
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
  /**
   * R-AUTO-PRACA-BUDZET-PROCENT-Q1=B: stały % (0–100) budżetu Pracy dla WSZYSTKICH miast tego
   * wywołania (gdy brak getPracaBudgetPercent). Domyślnie 100 — BRAK ograniczenia % (jedyne
   * ograniczenia to sama pula i flat-rezerwa), żeby wywołania nieświadome tego mechanizmu (np.
   * AI — patrz `maxItemsPerCity` niżej) nie zostały niespodziewanie przycięte. Ten % to sposób
   * gracza na "zostaw mi część Pracy" (`UlepszeniaEmpirePolicy.pracaAutoPercent` w cities.ts,
   * świeża polityka startuje od DEFAULT_ULEPSZENIA_PRACA_PERCENT=33%, NIE od tego domyślnego
   * parametru funkcji) — koncept, który dla AI nie ma odpowiednika (AI nie ma "gracza", dla
   * którego miałoby zostawiać Pracę). ZASTĘPUJE dawny `maxPerCity` (limit sztuk) jako mechanizm
   * WYBORU GRACZA; AI ma swój OSOBNY, niezależny throttle — patrz `maxItemsPerCity`.
   * / EN: flat % (0-100) of the Work budget for ALL cities in this call (when no
   * getPracaBudgetPercent). Defaults to 100 — NO % restriction (the only limits are the pool
   * itself and the flat reserve), so callers unaware of this mechanism (e.g. AI — see
   * `maxItemsPerCity` below) aren't unexpectedly capped. This % is the player's way to "leave me
   * some Work" (`UlepszeniaEmpirePolicy.pracaAutoPercent` in cities.ts, a fresh policy starts at
   * DEFAULT_ULEPSZENIA_PRACA_PERCENT=33%, NOT this function parameter's default) — a concept
   * that has no AI equivalent (AI has no "player" to leave Work for). REPLACES the old
   * `maxPerCity` (item-count cap) as the PLAYER'S choice mechanism; AI has its OWN, independent
   * throttle — see `maxItemsPerCity`.
   */
  pracaBudgetPercent?: number;
  /** R-AUTO-PRACA-BUDZET-PROCENT-Q1=B: % per miasto (0–100). Nadpisuje pracaBudgetPercent. */
  getPracaBudgetPercent?: (city: AutoImprovementCity) => number;
  /**
   * Throttle LICZBY ulepszeń/miasto/turę, NIEZALEŻNY od %-budżetu Pracy (oba limity działają
   * RÓWNOLEGLE — obowiązuje ciaśniejszy). Domyślnie bez limitu (Infinity). To NIE jest część
   * R-AUTO-PRACA-BUDZET-PROCENT-Q1=B (który dotyczy WYŁĄCZNIE gracza) — to PRZEDWCZEŚNIEJSZY,
   * osobny mechanizm wydajności/determinizmu AI (`planCityImprovements` w ai.ts jawnie ustawia
   * 1 — dawniej to był NIEJAWNY skutek uboczny domyślnej wartości usuniętego `maxPerCity=1`,
   * teraz jawny i udokumentowany tu). Gracz go NIE ustawia.
   * / EN: item-COUNT throttle per city per turn, INDEPENDENT of the %-budget (both limits apply
   * in PARALLEL — whichever is tighter wins). Unlimited (Infinity) by default. This is NOT part
   * of R-AUTO-PRACA-BUDZET-PROCENT-Q1=B (which is player-only) — it's a PRE-EXISTING, separate
   * AI performance/determinism throttle (`planCityImprovements` in ai.ts sets it to 1 explicitly
   * — previously an IMPLICIT side effect of the removed `maxPerCity=1` default, now explicit and
   * documented here). The player never sets this.
   */
  maxItemsPerCity?: number;
  pracaSurplusThreshold?: number;
  skipWyrab?: boolean;
  civArchetype?: string;
  playerEra?: number;
  isImprovementAllowedForCiv?: (key: ImprovementKey, civArchetype?: string) => boolean;
  /** Nadpisanie kolejności (np. AI deficit boost). */
  priorityOverride?: readonly ImprovementKey[];
}

/**
 * Planuje auto-ulepszenia: per miasto do `pracaBudgetPercent`% (domyślnie 100 — bez ograniczenia)
 * ze SKUMULOWANEJ puli Pracy `pracaAvailable` — zamrożonej w momencie wejścia do tej funkcji tej
 * tury (NIE od przyrostu — R-AUTO-PRACA-BUDZET-PROCENT-Q1=B), ORAZ (niezależnie, równolegle) do
 * `maxItemsPerCity` sztuk (domyślnie bez limitu; AI ustawia jawnie 1 — throttle wydajności,
 * niezwiązany z %-budżetem). Flat-rezerwa `pracaSurplusThreshold` (np.
 * AUTO_ULEPSZENIA_PRACA_RESERVE) to DODATKOWY dolny próg bezpieczeństwa — auto-manager nigdy nie
 * schodzi poniżej niej, niezależnie od %/liczby.
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
    pracaBudgetPercent = 100,
    getPracaBudgetPercent,
    maxItemsPerCity = Infinity,
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

  // R-AUTO-PRACA-BUDZET-PROCENT-Q1=B: dostępnaPula = pula Pracy W MOMENCIE WEJŚCIA w ten blok
  // tej tury, zamrożona TU, PRZED jakimkolwiek wydatkiem w tym wywołaniu — kolejne picki (tego
  // i innych miast) nie przesuwają bazy % w dół razem z malejącym pracaLeft.
  // / EN: available pool = the Work pool AT THE MOMENT this call runs this turn, frozen HERE,
  // BEFORE any spend in this call — later picks (this city's or another's) don't shift the %
  // base downward together with the shrinking pracaLeft.
  const globalPracaPulaAtEntry = opts.pracaAvailable;

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
    const cityPercent = Math.max(0, Math.min(100, getPracaBudgetPercent?.(city) ?? pracaBudgetPercent));
    const cityBudget = (cityPercent / 100) * globalPracaPulaAtEntry;

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

    let spentThisCity = 0;
    let placedThisCity = 0;

    for (const key of basePriority) {
      if (spentThisCity >= cityBudget || placedThisCity >= maxItemsPerCity) break;
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

      // R-AUTO-PRACA-BUDZET-PROCENT-Q1=B: ten sam typ (np. farma) wielokrotnie na różnych
      // heksach, dopóki starcza budżetu TEGO miasta (cityBudget), limitu sztuk (maxItemsPerCity —
      // niezależny, np. throttle AI) i globalnej puli (pracaLeft, z flat-rezerwą jako dolnym
      // progiem bezpieczeństwa).
      while (spentThisCity < cityBudget && placedThisCity < maxItemsPerCity && meta.kosztPraca <= pracaLeft) {
        if (pracaLeft - meta.kosztPraca < reserve) break;
        if (spentThisCity + meta.kosztPraca > cityBudget) break;
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
          spentThisCity += meta.kosztPraca;
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
