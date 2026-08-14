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
   * R-AUTO-PRACA-BUDZET-PROCENT-Q1=B (runda 2, naprawa FAIL Evaluatora): stały % (0–100)
   * budżetu Pracy DLA CAŁEGO TEGO WYWOŁANIA (gdy brak getPracaBudgetPercent) — JEDEN, WSPÓLNY
   * budżet dla WSZYSTKICH miast razem, nie osobny budżet na każde miasto. Łączny wydatek
   * automatu na wszystkie miasta w tym wywołaniu jest ograniczony do `pct% × pula` (pula = stan
   * puli Pracy NA KONIEC TURY, po całej ekonomii/upkeepie, przed wydatkiem auto-managera — patrz
   * `globalPracaPulaAtEntry` w pickAutoImprovements), NIEZALEŻNIE od liczby miast N (runda 1 tego
   * miała błąd: liczyła `pct% × pula` OSOBNO dla każdego miasta, więc N miast mogło razem wydać
   * do N×pct% puli — Evaluator złapał 98,7% wydane przy nominalnych 33% i 4 miastach). Domyślnie
   * 100 — BRAK ograniczenia % (jedyne ograniczenia to sama pula i flat-rezerwa), żeby wywołania
   * nieświadome tego mechanizmu (np. AI — patrz `maxItemsPerCity` niżej) nie zostały
   * niespodziewanie przycięte. Ten % to sposób gracza na "zostaw mi część Pracy"
   * (`UlepszeniaEmpirePolicy.pracaAutoPercent` w cities.ts, świeża polityka startuje od
   * DEFAULT_ULEPSZENIA_PRACA_PERCENT=33%, NIE od tego domyślnego parametru funkcji) — koncept,
   * który dla AI nie ma odpowiednika (AI nie ma "gracza", dla którego miałoby zostawiać Pracę).
   * ZASTĘPUJE dawny `maxPerCity` (limit sztuk) jako mechanizm WYBORU GRACZA; AI ma swój OSOBNY,
   * niezależny throttle — patrz `maxItemsPerCity`.
   * / EN: flat % (0-100) of the Work budget for THIS ENTIRE CALL (when no
   * getPracaBudgetPercent) — ONE SHARED budget across ALL cities together, not a separate
   * budget per city. Total spend across every city in this call is capped at `pct% × pool`
   * (pool = the Work pool's state AT TURN END, after the whole turn's economy/upkeep, before the
   * auto-manager's spend — see `globalPracaPulaAtEntry` in pickAutoImprovements), regardless of
   * city count N (round 1 bug: computed `pct% × pool` SEPARATELY per city, so N cities could
   * together spend up to N×pct% of the pool — the Evaluator caught 98.7% spent at a nominal 33%
   * with 4 cities). Defaults to 100 — NO % restriction (the only limits are the pool itself and
   * the flat reserve), so callers unaware of this mechanism (e.g. AI — see `maxItemsPerCity`
   * below) aren't unexpectedly capped. This % is the player's way to "leave me some Work"
   * (`UlepszeniaEmpirePolicy.pracaAutoPercent` in cities.ts, a fresh policy starts at
   * DEFAULT_ULEPSZENIA_PRACA_PERCENT=33%, NOT this function parameter's default) — a concept
   * that has no AI equivalent (AI has no "player" to leave Work for). REPLACES the old
   * `maxPerCity` (item-count cap) as the PLAYER'S choice mechanism; AI has its OWN, independent
   * throttle — see `maxItemsPerCity`.
   *
   * R-AUTO-PRACA-OVERRIDE-PER-MIASTO-Q3=B (2026-08-14, decyzja właściciela): to jest RÓWNIEŻ
   * źródło NADRZĘDNEGO pułapu całego imperium (`imperiumBudgetCap` niżej), liczonego RAZ z TEJ
   * wartości (polityki imperium przekazanej przez wołającego), NIGDY z per-miasto override
   * zwróconego przez `getPracaBudgetPercent`. Wołający MUSI tu przekazać wartość polityki
   * imperium (nie zostawiać domyślnych 100), jeśli chce, żeby per-miasto override
   * (`getPracaBudgetPercent`) nie mógł przebić pułapu całej cywilizacji — patrz komentarz przy
   * `getPracaBudgetPercent` niżej.
   * / EN: this is ALSO the source of the OVERARCHING empire-wide cap (`imperiumBudgetCap` below),
   * computed ONCE from THIS value (the empire policy passed by the caller), NEVER from a
   * per-city override returned by `getPracaBudgetPercent`. The caller MUST pass the empire
   * policy value here (not leave the default 100) if a per-city override
   * (`getPracaBudgetPercent`) should not be able to exceed the whole civilization's cap — see
   * the `getPracaBudgetPercent` comment below.
   */
  pracaBudgetPercent?: number;
  /**
   * R-AUTO-PRACA-BUDZET-PROCENT-Q1=B: % (0–100) PER MIASTO — nadpisuje `pracaBudgetPercent` dla
   * TEGO miasta (np. override gracza w panelu miasta, `city.ulepszeniaPracaPercent`). UWAGA: to
   * NIE tworzy dodatkowego budżetu obok wspólnej puli — % tego miasta jest jego WŁASNYM pułapem
   * na WSPÓLNY, dzielony licznik wydatków (`globalSpent` w pickAutoImprovements), nie osobną
   * kopertą. Przy jednakowym % dla wszystkich miast (typowy przypadek — brak override) to i tak
   * daje dokładnie jeden wspólny budżet `pct% × pula`.
   *
   * R-AUTO-PRACA-OVERRIDE-PER-MIASTO-Q3=B (2026-08-14): override tego miasta NIE może przebić
   * `imperiumBudgetCap` (policzonego z `pracaBudgetPercent` — polityki imperium, patrz wyżej).
   * „Autopraca działa z budżetu całej cywilizacji, a nie z budżetu miasta" (słowa właściciela) —
   * override decyduje WYŁĄCZNIE o kolejności/udziale WEWNĄTRZ wspólnego pułapu imperium, nigdy o
   * przebiciu sumy całego wywołania ponad `pracaBudgetPercent% × pula`. Efektywny pułap TEGO
   * miasta w pętli niżej to `min(cityBudgetCap, imperiumBudgetCap)` — patrz `effectiveCityCap`.
   * / EN: % (0-100) PER CITY — overrides `pracaBudgetPercent` for THIS city (e.g. a player
   * override in the city panel, `city.ulepszeniaPracaPercent`). NOTE: this does NOT create an
   * extra budget alongside the shared pool — this city's % is its OWN ceiling on the SHARED,
   * cross-city spend counter (`globalSpent` in pickAutoImprovements), not a separate envelope.
   * With the same % for every city (the typical case — no override) this still yields exactly
   * one shared budget of `pct% × pool`.
   *
   * R-AUTO-PRACA-OVERRIDE-PER-MIASTO-Q3=B (2026-08-14): this city's override can NEVER exceed
   * `imperiumBudgetCap` (computed from `pracaBudgetPercent` — the empire policy, see above).
   * "Auto-work runs off the whole civilization's budget, not the city's" (owner's words) — the
   * override decides ONLY the order/share WITHIN the shared empire cap, never a breach of the
   * whole call's total above `pracaBudgetPercent% × pool`. This city's effective cap in the loop
   * below is `min(cityBudgetCap, imperiumBudgetCap)` — see `effectiveCityCap`.
   */
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
 * Planuje auto-ulepszenia: JEDEN wspólny budżet Pracy dla CAŁEGO wywołania (wszystkich miast
 * razem) = `pracaBudgetPercent`% (domyślnie 100 — bez ograniczenia) ze SKUMULOWANEJ puli Pracy
 * `pracaAvailable` — czyli stanu puli Pracy NA KONIEC TURY, po całej ekonomii/upkeepie, przed
 * wydatkiem auto-managera, zamrożonego w `globalPracaPulaAtEntry` w momencie wejścia do tej
 * funkcji (NIE od przyrostu tej tury — R-AUTO-PRACA-BUDZET-PROCENT-Q1=B). Miasta czerpią z TEJ
 * SAMEJ wspólnej puli PO KOLEI (kolejność = po id, patrz `orderedCities` niżej) — łączny wydatek
 * wszystkich miast razem nigdy nie przekracza `pct% × globalPracaPulaAtEntry`, NIEZALEŻNIE od
 * liczby miast N (naprawa rundy 2: przed nią każde miasto liczyło `pct%` OSOBNO od PEŁNEJ puli,
 * więc N miast mogło razem wydać do N×pct%). Kolejność miast wpływa WYŁĄCZNIE na to, KTÓRE
 * konkretne ulepszenia się zmieszczą w budżecie (pierwsze miasto w kolejności ma pierwszeństwo do
 * wspólnej puli) — NIE na łączną wydaną sumę, która jest deterministyczna niezależnie od
 * kolejności (patrz test 12 w auto-improvements-test.cjs). RÓWNOLEGLE, niezależnie od %-budżetu,
 * obowiązuje też `maxItemsPerCity` sztuk/miasto (domyślnie bez limitu; AI ustawia jawnie 1 —
 * throttle wydajności/determinizmu AI, niezwiązany z %-budżetem — patrz opis pola wyżej). Flat-
 * rezerwa `pracaSurplusThreshold` (np. AUTO_ULEPSZENIA_PRACA_RESERVE) to DODATKOWY dolny próg
 * bezpieczeństwa na CAŁEJ puli imperium — auto-manager nigdy nie schodzi poniżej niej, niezależnie
 * od %/liczby miast.
 * R-AUTO-PRACA-OVERRIDE-PER-MIASTO-Q3=B (2026-08-14): per-miasto override (`getPracaBudgetPercent`)
 * NIGDY nie przebija `pracaBudgetPercent`% × `globalPracaPulaAtEntry` (nadrzędny pułap imperium,
 * `imperiumBudgetCap`) — nawet jeśli override JEDNEGO miasta jest wyższy niż polityka imperium
 * (np. override 80% przy polityce 20%), łączny wydatek CAŁEGO wywołania nadal nie przekracza 20%
 * puli. Override decyduje wyłącznie o PIERWSZEŃSTWIE/UDZIALE w ramach tego wspólnego pułapu, nie o
 * jego przebiciu (właściciel: „Autopraca działa z budżetu całej cywilizacji, a nie z budżetu
 * miasta").
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

  // R-AUTO-PRACA-BUDZET-PROCENT-Q1=B: dostępnaPula = stan puli Pracy NA KONIEC TURY (po całej
  // ekonomii/upkeepie, przed wydatkiem auto-managera) W MOMENCIE WEJŚCIA w ten blok tej tury,
  // zamrożona TU, PRZED jakimkolwiek wydatkiem w tym wywołaniu — kolejne picki (tego i innych
  // miast) nie przesuwają bazy % w dół razem z malejącym pracaLeft.
  // / EN: available pool = the Work pool's state AT TURN END (after the whole turn's
  // economy/upkeep, before the auto-manager's spend), AT THE MOMENT this call runs this turn,
  // frozen HERE, BEFORE any spend in this call — later picks (this city's or another's) don't
  // shift the % base downward together with the shrinking pracaLeft.
  const globalPracaPulaAtEntry = opts.pracaAvailable;

  // R-AUTO-PRACA-BUDZET-PROCENT-Q1=B (runda 2): licznik WSPÓLNY dla CAŁEGO wywołania (wszystkich
  // miast razem) — NIE per-miasto. To jest sedno naprawy: każde miasto sprawdza swój % przeciwko
  // TEMU SAMEMU dzielonemu licznikowi (globalSpent), więc łączny wydatek wszystkich miast razem
  // jest ograniczony do pct%×pula, niezależnie od liczby miast N (dawny błąd: `spentThisCity`
  // resetował się PER MIASTO, więc N miast mogło razem wydać do N×pct%).
  // / EN: SHARED counter for the WHOLE call (all cities together) — NOT per city. This is the
  // core of the fix: every city checks its own % against this SAME shared counter (globalSpent),
  // so the total spend across all cities together is capped at pct%×pool, regardless of city
  // count N (old bug: `spentThisCity` reset PER CITY, so N cities could together spend up to
  // N×pct%).
  let globalSpent = 0;

  // R-AUTO-PRACA-OVERRIDE-PER-MIASTO-Q3=B (2026-08-14, decyzja właściciela): pułap NADRZĘDNY
  // całego imperium, policzony RAZ z `pracaBudgetPercent` (polityka imperium przekazana przez
  // wołającego), NIGDY z per-miasto override zwróconego przez `getPracaBudgetPercent`. Bez tego
  // pułapu jedno miasto z override wyższym niż polityka imperium (np. 80% vs polityka 20%) mogło
  // wydać całą swoją część ze WSPÓLNEGO licznika `globalSpent`, zanim wspólny pułap w ogóle
  // wszedłby w grę — Evaluator zmierzył 80% CAŁEJ puli imperium wydane przy nominalnych 20%.
  // „Autopraca działa z budżetu całej cywilizacji, a nie z budżetu miasta" (słowa właściciela) —
  // override miasta nie jest osobną kopertą, tylko udziałem WEWNĄTRZ tego pułapu.
  // / EN: OVERARCHING empire-wide cap, computed ONCE from `pracaBudgetPercent` (the empire
  // policy passed by the caller), NEVER from a per-city override returned by
  // `getPracaBudgetPercent`. Without this cap, one city with an override higher than the empire
  // policy (e.g. 80% vs a 20% policy) could spend its whole share of the SHARED `globalSpent`
  // counter before the shared cap ever kicked in — the Evaluator measured 80% of the WHOLE
  // empire pool spent at a nominal 20%. "Auto-work runs off the whole civilization's budget, not
  // the city's" (owner's words) — a city's override is not a separate envelope, just a share
  // WITHIN this cap.
  const imperiumPercentClamped = Math.max(0, Math.min(100, pracaBudgetPercent));
  const imperiumBudgetCap = (imperiumPercentClamped / 100) * globalPracaPulaAtEntry;

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
    // cityBudgetCap = pułap TEGO miasta na WSPÓLNY, dzielony licznik globalSpent (nie osobna
    // koperta — patrz komentarz przy globalSpent wyżej). Przy jednakowym % dla wszystkich miast
    // (typowy przypadek) to i tak daje dokładnie jeden wspólny budżet pct%×pula.
    // / EN: cityBudgetCap = THIS city's ceiling on the SHARED globalSpent counter (not a separate
    // envelope — see the globalSpent comment above). With the same % for every city (the typical
    // case) this still yields exactly one shared budget of pct%×pool.
    const cityPercent = Math.max(0, Math.min(100, getPracaBudgetPercent?.(city) ?? pracaBudgetPercent));
    const cityBudgetCap = (cityPercent / 100) * globalPracaPulaAtEntry;
    // R-AUTO-PRACA-OVERRIDE-PER-MIASTO-Q3=B (2026-08-14): pułap tego miasta na WSPÓLNY licznik
    // globalSpent NIGDY nie może przebić nadrzędnego pułapu imperium (`imperiumBudgetCap`,
    // policzonego z polityki imperium — patrz komentarz przy jego deklaracji). Override miasta
    // (`cityBudgetCap` wyżej może być wyższy niż `imperiumBudgetCap`, np. 80% vs polityka 20%)
    // decyduje wtedy WYŁĄCZNIE o tym, że TO miasto ma pierwszeństwo do reszty wspólnej puli
    // imperium (w ramach kolejności po id) — nie o przebiciu sumy całego wywołania.
    // / EN: this city's ceiling on the SHARED globalSpent counter can NEVER exceed the
    // overarching empire cap (`imperiumBudgetCap`, computed from the empire policy — see its
    // declaration comment). A city's override (`cityBudgetCap` above may be higher than
    // `imperiumBudgetCap`, e.g. 80% vs a 20% policy) then decides ONLY that THIS city gets
    // priority for the rest of the shared empire pool (within id ordering) — never a breach of
    // the whole call's total.
    const effectiveCityCap = Math.min(cityBudgetCap, imperiumBudgetCap);

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
      if (globalSpent >= effectiveCityCap || placedThisCity >= maxItemsPerCity) break;
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

      // R-AUTO-PRACA-BUDZET-PROCENT-Q1=B (runda 2): ten sam typ (np. farma) wielokrotnie na
      // różnych heksach, dopóki starcza WSPÓLNEGO budżetu całego wywołania (globalSpent
      // sprawdzany przeciw pułapowi TEGO miasta effectiveCityCap = min(cityBudgetCap,
      // imperiumBudgetCap) — patrz komentarze wyżej), limitu sztuk (maxItemsPerCity — niezależny,
      // np. throttle AI) i globalnej puli (pracaLeft, z flat-rezerwą jako dolnym progiem
      // bezpieczeństwa).
      while (globalSpent < effectiveCityCap && placedThisCity < maxItemsPerCity && meta.kosztPraca <= pracaLeft) {
        if (pracaLeft - meta.kosztPraca < reserve) break;
        if (globalSpent + meta.kosztPraca > effectiveCityCap) break;
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
          globalSpent += meta.kosztPraca;
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
