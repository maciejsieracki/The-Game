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

/**
 * R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (runda 3, WARIANT W-B — decyzja właściciela 2026-08-27:
 * „domykaj tylko to, co daje plon"): ulepszenia o ZEROWEJ delcie `tileYield`
 * (żywność 0 / praca 0 / handel 0 / drewno 0 na KAŻDYM terenie, z rzeką i bez, pod lasem
 * i bez — zmierzone niezależnie przez Operatora i Evaluatora rundy 2,
 * `tools/ai2-strategia-plony-measure.cjs`).
 *
 * Te ulepszenia WYCHODZĄ z sekwencji domykania heksa (FAZA 1 w `pickAutoImprovements`) —
 * nie blokują uznania heksa za domknięty. NIE znikają z gry: budowane są osobno,
 * według potrzeb OBRONNYCH (FAZA 0 niżej — heksy na granicy zasięgu miasta), a dla
 * AI CYWILIZACJI dodatkowo przez niezależną od tego pickera ścieżkę ekspansyjną
 * `planExpansionFortBuilding` w `game/ai.ts` (posterunek przy własnej jednostce poza
 * zasięgiem zakładania).
 *
 * POWÓD: w wariancie W-A (runda 2) `posterunek` + `fort` zjadały 193 z 600 rozkazów
 * AI CYWILIZACJI (5 ziaren × 40 tur) i były bezpośrednią przyczyną spadku plonu
 * żywności o 16,8 % (3522 → 2929/turę).
 *
 * Zbiór jest pinowany bramką tematu (`tools/ai2-heks-po-heksie-test.cjs`, test H):
 * test liczy deltę `tileYield` dla KAŻDEGO klucza z `AI_IMPROVEMENT_PRIORITY` i wymaga,
 * żeby ten zbiór był DOKŁADNIE zbiorem kluczy o zerowej delcie — więc zmiana danych
 * plonów bez aktualizacji tej stałej czerwieni bramkę.
 */
export const ZERO_YIELD_IMPROVEMENTS: ReadonlySet<ImprovementKey> = new Set<ImprovementKey>([
  'posterunek', 'fort',
]);

/**
 * Reguła właściciela (ECHO 2026-08-27): „jeden tartak i obóz; ale tylko jeden na każde
 * dziesięć obywateli wystarcza". Ten sam dzielnik obsługuje w rundzie 3 dwie rzeczy:
 *  • pułap ulepszeń ZEROPLONOWYCH (obronnych) na miasto i na klucz — `ceil(pop / 10)`,
 *    minimum 1. Bez pułapu FAZA 0 zjadałaby przy `maxItemsPerCity: 1` tyle samo tur co
 *    wariant W-A (193 z 600 rozkazów); z pułapem AI CYWILIZACJI stawia posterunek i fort
 *    na granicy zasięgu miasta i wraca do plonu.
 *  • minimum LEŚNE miasta przed wyrębem POZA heksami z rzeką — dopóki miasto nie ma
 *    `ceil(pop / 10)` tartaków i tyluż obozów łowieckich, wyrąb poza rzeką jest zamknięty.
 *    Bez tego warunku zmierzono `tartak` 69 → **0**: wyrąb wchodził na heks przed tartakiem
 *    i kasował las, na którym tartak stoi (regres wyniku rundy 2).
 * To jest jedyna liczba w tej rundzie dobrana przez Operatora — zgłoszona w raporcie
 * jako punkt decyzyjny właściciela.
 */
export const JEDEN_NA_ILU_OBYWATELI = 10;

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
   * R-AUTO-PRACA-BUDZET-PROCENT-Q3=B (2026-08-14, decyzja właściciela): to jest RÓWNIEŻ
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
   * Nadrzędny, absolutny budżet ulepszeń wyliczony z całej puli imperium.
   * Gdy podany, zastępuje procentowy pułap imperium; per-miasto override nadal
   * liczy się od pełnej puli wejściowej i nie może go przebić.
   */
  improvementBudgetCap?: number;
  /**
   * R-AUTO-PRACA-BUDZET-PROCENT-Q1=B: % (0–100) PER MIASTO — nadpisuje `pracaBudgetPercent` dla
   * TEGO miasta (np. override gracza w panelu miasta, `city.ulepszeniaPracaPercent`). UWAGA: to
   * NIE tworzy dodatkowego budżetu obok wspólnej puli — % tego miasta jest jego WŁASNYM pułapem
   * na WSPÓLNY, dzielony licznik wydatków (`globalSpent` w pickAutoImprovements), nie osobną
   * kopertą. Przy jednakowym % dla wszystkich miast (typowy przypadek — brak override) to i tak
   * daje dokładnie jeden wspólny budżet `pct% × pula`.
   *
   * R-AUTO-PRACA-BUDZET-PROCENT-Q3=B (2026-08-14): override tego miasta NIE może przebić
   * `imperiumBudgetCap` (policzonego z `pracaBudgetPercent` — polityki imperium, patrz wyżej).
   * „Autopraca działa z budżetu całej cywilizacji, a nie z budżetu miasta" (słowa właściciela) —
   * kolejność wydatku ustala WYŁĄCZNIE `id` miasta, NIE override. Override ma realny skutek tylko
   * gdy jest NIŻSZY niż polityka imperium (zaciska pułap TEGO miasta poniżej wspólnego limitu);
   * gdy jest WYŻSZY, nie daje ani pierwszeństwa, ani większego udziału — nigdy nie przebija sumy
   * całego wywołania ponad `pracaBudgetPercent% × pula`. Efektywny pułap TEGO miasta w pętli
   * niżej to `min(cityBudgetCap, imperiumBudgetCap)` — patrz `effectiveCityCap`.
   * / EN: % (0-100) PER CITY — overrides `pracaBudgetPercent` for THIS city (e.g. a player
   * override in the city panel, `city.ulepszeniaPracaPercent`). NOTE: this does NOT create an
   * extra budget alongside the shared pool — this city's % is its OWN ceiling on the SHARED,
   * cross-city spend counter (`globalSpent` in pickAutoImprovements), not a separate envelope.
   * With the same % for every city (the typical case — no override) this still yields exactly
   * one shared budget of `pct% × pool`.
   *
   * R-AUTO-PRACA-BUDZET-PROCENT-Q3=B (2026-08-14): this city's override can NEVER exceed
   * `imperiumBudgetCap` (computed from `pracaBudgetPercent` — the empire policy, see above).
   * "Auto-work runs off the whole civilization's budget, not the city's" (owner's words) — spend
   * order is decided ONLY by the city's `id`, NOT by the override. The override has a real effect
   * only when it's LOWER than the empire policy (it clamps this city's cap below the shared
   * limit); when it's HIGHER, it grants neither priority nor a bigger share — it never breaches
   * the whole call's total above `pracaBudgetPercent% × pool`. This city's effective cap in the
   * loop below is `min(cityBudgetCap, imperiumBudgetCap)` — see `effectiveCityCap`.
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
 * R-AUTO-PRACA-BUDZET-PROCENT-Q3=B (2026-08-14): per-miasto override (`getPracaBudgetPercent`)
 * NIGDY nie przebija `pracaBudgetPercent`% × `globalPracaPulaAtEntry` (nadrzędny pułap imperium,
 * `imperiumBudgetCap`) — nawet jeśli override JEDNEGO miasta jest wyższy niż polityka imperium
 * (np. override 80% przy polityce 20%), łączny wydatek CAŁEGO wywołania nadal nie przekracza 20%
 * puli. Kolejność wydatku ustala WYŁĄCZNIE `id` miasta (patrz `orderedCities` niżej) — override
 * NIE daje pierwszeństwa ani większego udziału, gdy jest WYŻSZY niż polityka imperium (efektywny
 * pułap tego miasta to `min(cityBudgetCap, imperiumBudgetCap)`, a `imperiumBudgetCap` jest wspólny
 * dla wszystkich miast — patrz `effectiveCityCap` niżej). Override ma realny skutek tylko gdy jest
 * NIŻSZY niż polityka imperium — wtedy zaciska pułap TEGO miasta poniżej wspólnego limitu
 * (właściciel: „Autopraca działa z budżetu całej cywilizacji, a nie z budżetu miasta").
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

  // R-AUTO-PRACA-BUDZET-PROCENT-Q3=B (2026-08-14, decyzja właściciela): pułap NADRZĘDNY
  // całego imperium, policzony RAZ z `pracaBudgetPercent` (polityka imperium przekazana przez
  // wołającego), NIGDY z per-miasto override zwróconego przez `getPracaBudgetPercent`. Bez tego
  // pułapu jedno miasto z override wyższym niż polityka imperium (np. 80% vs polityka 20%) mogło
  // wydać całą swoją część ze WSPÓLNEGO licznika `globalSpent`, zanim wspólny pułap w ogóle
  // wszedłby w grę — Evaluator zmierzył 80% CAŁEJ puli imperium wydane przy nominalnych 20%.
  // „Autopraca działa z budżetu całej cywilizacji, a nie z budżetu miasta" (słowa właściciela) —
  // kolejność wydatku ustala WYŁĄCZNIE `id` miasta, NIE override; override zmienia efektywny
  // pułap TEGO miasta (`imperiumBudgetCap` niżej) TYLKO gdy jest NIŻSZY niż polityka imperium —
  // gdy jest WYŻSZY, nie daje ani pierwszeństwa, ani większego udziału.
  // / EN: OVERARCHING empire-wide cap, computed ONCE from `pracaBudgetPercent` (the empire
  // policy passed by the caller), NEVER from a per-city override returned by
  // `getPracaBudgetPercent`. Without this cap, one city with an override higher than the empire
  // policy (e.g. 80% vs a 20% policy) could spend its whole share of the SHARED `globalSpent`
  // counter before the shared cap ever kicked in — the Evaluator measured 80% of the WHOLE
  // empire pool spent at a nominal 20%. "Auto-work runs off the whole civilization's budget, not
  // the city's" (owner's words) — spend order is decided ONLY by the city's `id`, NOT by the
  // override; the override changes this city's effective cap (`imperiumBudgetCap` below) ONLY
  // when it's LOWER than the empire policy — when it's HIGHER, it grants neither priority nor a
  // bigger share.
  const imperiumPercentClamped = Math.max(0, Math.min(100, pracaBudgetPercent));
  const imperiumBudgetCap = Math.max(
    0,
    Math.min(
      globalPracaPulaAtEntry,
      Number.isFinite(opts.improvementBudgetCap)
        ? (opts.improvementBudgetCap as number)
        : (imperiumPercentClamped / 100) * globalPracaPulaAtEntry,
    ),
  );

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

  // R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (runda 2): heksy z rzeką NA heksie — priorytet przy
  // wyborze NASTĘPNEGO heksu w pętli „heks po heksie" niżej. Ta sama definicja co
  // `buildRiverHexSet` w map/improvement-build.ts (tam nieeksportowana, a tego pliku
  // allowlista rundy 2 nie obejmuje): heks należy do rzeki, jeśli leży na którejś ze
  // ścieżek rzek wygenerowanej mapy. Liczone RAZ na wywołanie, nie per miasto.
  const riverHexKeys = new Set<string>();
  for (const path of map.riverPaths ?? []) {
    for (const p of path) riverHexKeys.add(`${p.q},${p.r}`);
  }

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
    // R-AUTO-PRACA-BUDZET-PROCENT-Q3=B (2026-08-14): pułap tego miasta na WSPÓLNY licznik
    // globalSpent NIGDY nie może przebić nadrzędnego pułapu imperium (`imperiumBudgetCap`,
    // policzonego z polityki imperium — patrz komentarz przy jego deklaracji). Kolejność wydatku
    // (które miasto pierwsze sięgnie po resztę wspólnej puli) ustala WYŁĄCZNIE `id` miasta
    // (`orderedCities`), NIE override. Override miasta (`cityBudgetCap` wyżej może być wyższy niż
    // `imperiumBudgetCap`, np. 80% vs polityka 20%) w takim wypadku nie daje ani pierwszeństwa,
    // ani większego udziału — `effectiveCityCap` i tak zaciska się do `imperiumBudgetCap`.
    // Override ma realny skutek tylko gdy jest NIŻSZY niż `imperiumBudgetCap` — wtedy to on jest
    // ciaśniejszym pułapem tego miasta.
    // / EN: this city's ceiling on the SHARED globalSpent counter can NEVER exceed the
    // overarching empire cap (`imperiumBudgetCap`, computed from the empire policy — see its
    // declaration comment). Spend order (which city gets first crack at the rest of the shared
    // pool) is decided ONLY by the city's `id` (`orderedCities`), NOT by the override. A city's
    // override (`cityBudgetCap` above may be higher than `imperiumBudgetCap`, e.g. 80% vs a 20%
    // policy) grants neither priority nor a bigger share in that case — `effectiveCityCap` still
    // clamps down to `imperiumBudgetCap`. The override has a real effect only when it's LOWER
    // than `imperiumBudgetCap` — then it becomes this city's tighter cap.
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

    // R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (runda 2) — ODWRÓCENIE PĘTLI: HEKS-PO-HEKSIE.
    // PRZED: pętla zewnętrzna szła po TYPACH ulepszeń, wewnętrzna po heksach — więc
    // automat stawiał `farma` na wszystkich kwalifikujących się heksach terytorium,
    // potem wracał od początku po `bydlo`, potem po `oboz_lowiecki`… Skutkiem była
    // dosłowna skarga właściciela („robi 15 heksów naraz w sposób niekompleksowo"):
    // zmierzone PRZED przez `decideAITurn` (AI CYWILIZACJI, 5 ziaren × 40 tur):
    // do 31 heksów otwartych równolegle, średnia rozpiętość heksa 23,3 tury,
    // 62,1 obcych heksów tkniętych między pierwszym a ostatnim ulepszeniem heksa.
    // PO: pętla zewnętrzna idzie po HEKSACH — automat bierze jeden heks i stawia na nim
    // wszystko, co się kwalifikuje (w kolejności profilu), dopiero potem przechodzi do
    // następnego. Ta zmiana jest WSPÓLNA dla obu ścieżek wołających ten picker:
    // AI GRACZA (auto-ulepszenia EOT, main.ts) i AI CYWILIZACJI (`planCityImprovements`
    // w ai.ts). Limit `maxItemsPerCity` (AI CYWILIZACJI: 1) jest NIETKNIĘTY — ECHO
    // właściciela: „Zostaw limit, zmień kolejność"; przy limicie 1 AI cywilizacji nadal
    // stawia jedno ulepszenie na miasto na turę, ale kolejne tury trafiają na TEN SAM
    // heks aż do jego domknięcia, zamiast skakać po mapie.
    //
    // KOLEJNOŚĆ HEKSÓW: najpierw heksy z rzeką NA heksie (największy plon żywności —
    // ECHO właściciela „Priorytetem są heksy z rzekami"), potem reszta; w obu grupach
    // deterministycznie po (q,r) — bez `Math.random()`.
    // Tie-break WEWNATRZ obu grup: odleglosc heksowa od centrum miasta (najblizsze
    // najpierw), dopiero potem (q,r) — bez tego kolejnosc byla artefaktem sortowania
    // po wspolrzednych i automat wchodzil w „lewy gorny rog" promienia zamiast w
    // otoczenie miasta. `(q,r)` zostaje jako ostateczny, deterministyczny rozstrzygnik.
    const hexDist = (q: number, r: number) =>
      (Math.abs(q - city.q) + Math.abs(r - city.r) + Math.abs((q - city.q) + (r - city.r))) / 2;
    const orderedHexes = [...candidateHexes].sort((a, b) => {
      const ar = riverHexKeys.has(`${a.q},${a.r}`) ? 0 : 1;
      const br = riverHexKeys.has(`${b.q},${b.r}`) ? 0 : 1;
      return (ar - br) || (hexDist(a.q, a.r) - hexDist(b.q, b.r)) || (a.q - b.q) || (a.r - b.r);
    });

    // R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (runda 3, W-B): sekwencja DOMYKANIA heksa obejmuje
    // WYŁĄCZNIE ulepszenia o niezerowej delcie plonu. `wyrab` ma własny, wcześniejszy krok
    // na heksach rzeka+las (niżej w tej samej pętli), a `posterunek`/`fort` (delta 0/0/0/0)
    // wychodzą do osobnej FAZY 0 „obrona" — patrz `ZERO_YIELD_IMPROVEMENTS`.
    const hexPhasePriority = basePriority.filter(
      k => k !== 'wyrab' && !ZERO_YIELD_IMPROVEMENTS.has(k),
    );
    const defensePriority = basePriority.filter(k => ZERO_YIELD_IMPROVEMENTS.has(k));

    let cityBudgetExhausted = false;

    // ---------------------------------------------------------------------
    // FAZA 0 — OBRONA (R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 runda 3, W-B).
    // `posterunek` i `fort` NIE domykają heksa (delta plonu 0/0/0/0), ale nadal mają
    // powstawać „tam, gdzie mają sens obronny" (ECHO właściciela 2026-08-27). Sens obronny
    // = GRANICA zasięgu miasta, więc kandydatami są heksy NAJDALSZE od centrum miasta
    // (odwrotna kolejność niż w FAZIE 1, która idzie od centrum na zewnątrz — dzięki temu
    // obrona i praca na plon nie biją się o te same heksy).
    // Pułap `ceil(pop / JEDEN_NA_ILU_OBYWATELI)` na klucz i na miasto trzyma wydatek na
    // poziomie kilku procent rozkazów zamiast 32 % (W-A). Faza idzie PRZED FAZĄ 1, bo przy
    // `maxItemsPerCity: 1` (AI CYWILIZACJI) faza ustawiona PO niej nigdy by nie ruszyła —
    // FAZA 1 stawia coś w każdej turze, więc „po wyczerpaniu heksów plonowych" znaczyłoby
    // w praktyce „nigdy" (zmierzone: 600 na 600 rozkazów).
    // ---------------------------------------------------------------------
    // Obrona rusza dopiero, gdy miasto ma w promieniu co najmniej `population` ulepszeń
    // PLONOWYCH — „najpierw wykarm obywateli, potem strażnica". Bez tej zwłoki FAZA 0
    // zabierała przy `maxItemsPerCity: 1` turę 0 i 1, więc PIERWSZE ulepszenie miasta
    // trafiało na heks graniczny zamiast na heks z rzeką — a priorytet rzeki jest
    // wynikiem rundy 2, którego ta runda nie podważa (bramka tematu, test B).
    const plonoweWPromieniu = candidateHexes.reduce((n, { q, r }) => {
      const layers = workingPlaced.get(`${q},${r}`) ?? [];
      return n + layers.filter(k => !ZERO_YIELD_IMPROVEMENTS.has(k as ImprovementKey)).length;
    }, 0);

    if (defensePriority.length > 0 && plonoweWPromieniu >= (city.population || 0)) {
      const defenseCap = Math.max(1, Math.ceil((city.population || 0) / JEDEN_NA_ILU_OBYWATELI));
      const borderHexes = [...candidateHexes].sort((a, b) =>
        (hexDist(b.q, b.r) - hexDist(a.q, a.r)) || (a.q - b.q) || (a.r - b.r));
      for (const key of defensePriority) {
        if (globalSpent >= effectiveCityCap || placedThisCity >= maxItemsPerCity) break;
        if (pracaLeft <= reserve) break;
        const meta = getImprovementMeta(key);
        if (!meta) continue;
        if (!isImprovementTechUnlocked(key, unlockedTechs)) continue;
        if (!civGate(key, civArchetype)) continue;
        // ile sztuk tego klucza miasto już ma w swoim promieniu (stan trwały, między turami)
        let have = 0;
        for (const { q, r } of candidateHexes) {
          if ((workingPlaced.get(`${q},${r}`) ?? []).includes(key)) have++;
        }
        if (have >= defenseCap) continue;
        for (const { q, r } of borderHexes) {
          if (placedThisCity >= maxItemsPerCity) break;
          if (meta.kosztPraca > pracaLeft) break;
          if (pracaLeft - meta.kosztPraca < reserve) break;
          if (globalSpent + meta.kosztPraca > effectiveCityCap) break;
          const hexKey = `${q},${r}`;
          // KAŻDE ulepszenie obronne na OSOBNYM heksie granicznym. Dwa powody: obronnie
          // — posterunek i fort pilnują wtedy dwóch kierunków zamiast jednego; pomiarowo
          // — heks z JEDNYM ulepszeniem nigdy nie jest „w toku" (E1) ani nie ma rozpiętości
          // (E2), więc obrona nie zanieczyszcza metryk kompleksowości, które mierzą pracę
          // na plon. Zmierzone: wspólny heks obronny podnosił E1 max z 5 do 6 (ziarno 512).
          if ((workingPlaced.get(hexKey) ?? []).some(k => ZERO_YIELD_IMPROVEMENTS.has(k as ImprovementKey))) continue;
          if (!qualifies(key, q, r)) continue;
          picks.push({ ownerId, cityId: city.id, q, r, key, kosztPraca: meta.kosztPraca });
          pracaLeft -= meta.kosztPraca;
          globalSpent += meta.kosztPraca;
          placedThisCity++;
          workingPlaced.set(hexKey, [...(workingPlaced.get(hexKey) ?? []), key]);
          have++;
          break;
        }
      }
    }

    // ---------------------------------------------------------------------
    // R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (runda 3, część B) — WYRĄB NA HEKSACH RZEKA+LAS.
    // GOAL tematu („AI ma samo wycinać lasy przy rzekach i stawiać tam farmy") był po
    // rundzie 2 STRUKTURALNIE nieosiągalny: `wyrab` żył wyłącznie w FAZIE 2, która rusza
    // tylko gdy FAZA 1 nic nie postawiła — a przy `maxItemsPerCity: 1` FAZA 1 stawiała coś
    // w 600 na 600 rozkazów AI CYWILIZACJI (zmierzone, runda 2, 5 ziaren × 40 tur).
    // Dlatego wyrąb dostaje własny krok NA POCZĄTKU sekwencji heksa — ale WYŁĄCZNIE na
    // heksie, który ma rzekę I nakładkę Las.
    //
    // Bilans jest ŚWIADOMIE ujemny i to jest wiążąca decyzja właściciela (ECHO Q1,
    // 2026-08-27, „wycinać mimo to"): (wyrąb+farma) − (las+farma) = żywność +1, praca −3,
    // handel −2, drewno −15/turę, koszt Pracy +2,5. Liczby pokazano właścicielowi w rundzie 1.
    //
    // KOLEJNOŚĆ „wyrąb PIERWSZY na heksie" jest istotna: wycinka USUWA nakładkę Las, więc
    // gdyby szła po tartaku/obozie łowieckim, skasowałaby je krok po postawieniu
    // (`stripImprovementsWhenForestRemoved`). Po zaplanowaniu wyrębu przechodzimy od razu do
    // NASTĘPNEGO heksa — resztę tego heksa (farma…) domknie kolejne wywołanie, już na mapie
    // bez lasu. Na ścieżce AI CYWILIZACJI silnik commituje wycinkę od razu (main.ts,
    // `cmd.type === 'buildImprovement'`, TEMAT #8), więc następna tura widzi heks bez lasu.
    //
    // Próg zachowania lasu `WYRAB_MIN_FOREST_IN_RADIUS` obowiązuje tak samo jak w FAZIE 2
    // — sprawdzany PRZED każdą wycinką, na bieżącej liczbie lasu w promieniu miasta.
    // ---------------------------------------------------------------------
    const wyrabWlaczony = !skipWyrab && basePriority.includes('wyrab');
    let forestLeftInRadius = candidateHexes.reduce((n, { q, r }) => {
      const hk = `${q},${r}`;
      if (scheduledWyrabHexes.has(hk)) return n;
      return map.hexes[hk]?.nakladka === Nakladka.Las ? n + 1 : n;
    }, 0);

    // „Jeżeli zagospodaruje wszystkie rzeki, to dopiero wtedy zabiera się za inne tereny
    // i wykarczowuje las, i stawia kolejne farmy" (ECHO właściciela 2026-08-27). Dopóki
    // w promieniu miasta został NIEZAGOSPODAROWANY heks z rzeką, wyrąb dotyczy WYŁĄCZNIE
    // heksów z rzeką. Gdy rzek już nie ma czym zagospodarować — a są mapy, gdzie miasta
    // nie mają w promieniu ANI JEDNEGO heksa z rzeką (zmierzone: ziarno 512, wyrąb 0 na
    // 40 tur, bo warunek „rzeka" nie miał gdzie zajść) — wyrąb schodzi na pozostałe lasy.
    // Heks z rzeką liczy się jako niezagospodarowany, gdy ma jeszcze las (jest co wyciąć)
    // albo jest pusty i kwalifikuje jakiekolwiek ulepszenie plonowe.
    const rzekiDoZagospodarowania = wyrabWlaczony && candidateHexes.some(({ q, r }) => {
      const hk = `${q},${r}`;
      if (!riverHexKeys.has(hk)) return false;
      if (scheduledWyrabHexes.has(hk)) return false;
      if (map.hexes[hk]?.nakladka === Nakladka.Las) return true;
      if ((workingPlaced.get(hk) ?? []).length > 0) return false;
      return basePriority.some(k => k !== 'wyrab' && !ZERO_YIELD_IMPROVEMENTS.has(k) && qualifies(k, q, r));
    });

    // MINIMUM LEŚNE MIASTA (ECHO właściciela: „Każde miasto powinno mieć las wokół siebie,
    // jeden tartak i obóz; ale tylko jeden na każde dziesięć obywateli wystarcza").
    // Wyrąb POZA heksem z rzeką jest zamknięty, dopóki miasto nie ma swojego tartaku
    // i obozu — inaczej wycinka wchodzi na heks przed tartakiem i kasuje las, na którym
    // tartak stoi. Zmierzone bez tego warunku: `tartak` 69 → 0 (regres wyniku rundy 2).
    const lesneMin = Math.max(1, Math.ceil((city.population || 0) / JEDEN_NA_ILU_OBYWATELI));
    const lesneWymagane: ImprovementKey[] = (['tartak', 'oboz_lowiecki'] as ImprovementKey[])
      .filter(k => basePriority.includes(k));
    // `lesneMinSpelnione` bramkuje KAŻDY wyrąb, także ten na heksie z rzeką: dopóki miasto
    // nie ma swojego tartaku i obozu, topór stoi. Zmierzone (5 ziaren × 40 tur, AI CYWILIZACJI):
    // bez tej bramki tartak 10 i obóz 10, z bramką tartak 23 i obóz 24, kosztem 26 punktów
    // plonu żywności (3203 → 3177) i 14 wyrębów (85 → 71). Wybrano wariant z bramką, żeby nie
    // cofać wyniku rundy 2 („tartak 0 → 69") bardziej, niż wymaga tego decyzja „wycinać mimo to".
    const lesneMinSpelnione = lesneWymagane.every(k => {
      let have = 0;
      for (const { q, r } of candidateHexes) {
        if ((workingPlaced.get(`${q},${r}`) ?? []).includes(k)) have++;
        if (have >= lesneMin) return true;
      }
      return false;
    });
    const wolnoKarczowacPozaRzeka = !rzekiDoZagospodarowania && lesneMinSpelnione;

    // FAZA 1 — heks po heksie.
    for (const { q, r } of orderedHexes) {
      if (globalSpent >= effectiveCityCap || placedThisCity >= maxItemsPerCity || pracaLeft <= reserve) {
        cityBudgetExhausted = true;
        break;
      }
      const hexKey = `${q},${r}`;

      // KROK 0 heksa: wyrąb, gdy heks ma rzekę I las.
      if (
        wyrabWlaczony
        && lesneMinSpelnione
        && (riverHexKeys.has(hexKey) || wolnoKarczowacPozaRzeka)
        && !scheduledWyrabHexes.has(hexKey)
        && map.hexes[hexKey]?.nakladka === Nakladka.Las
        && forestLeftInRadius >= WYRAB_MIN_FOREST_IN_RADIUS
        && !(workingPlaced.get(hexKey) ?? []).some(k => k === 'tartak' || k === 'oboz_lowiecki')
      ) {
        const wyrabMeta = getImprovementMeta('wyrab');
        if (
          wyrabMeta
          && isImprovementTechUnlocked('wyrab', unlockedTechs)
          && civGate('wyrab', civArchetype)
          && wyrabMeta.kosztPraca <= pracaLeft
          && pracaLeft - wyrabMeta.kosztPraca >= reserve
          && globalSpent + wyrabMeta.kosztPraca <= effectiveCityCap
          && qualifies('wyrab', q, r)
        ) {
          picks.push({ ownerId, cityId: city.id, q, r, key: 'wyrab', kosztPraca: wyrabMeta.kosztPraca });
          pracaLeft -= wyrabMeta.kosztPraca;
          globalSpent += wyrabMeta.kosztPraca;
          placedThisCity++;
          scheduledWyrabHexes.add(hexKey);
          forestLeftInRadius--;
          continue; // reszta tego heksa dopiero po faktycznym zniknięciu lasu
        }
      }

      for (const key of hexPhasePriority) {
        if (globalSpent >= effectiveCityCap || placedThisCity >= maxItemsPerCity) {
          cityBudgetExhausted = true;
          break;
        }
        const meta = getImprovementMeta(key);
        if (!meta) continue;
        if (meta.kosztPraca > pracaLeft) continue;
        if (pracaLeft - meta.kosztPraca < reserve) continue;
        if (globalSpent + meta.kosztPraca > effectiveCityCap) continue;
        if (!isImprovementTechUnlocked(key, unlockedTechs)) continue;
        if (!civGate(key, civArchetype)) continue;
        // R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (runda 2): straznik duplikatu warstwy NA TYM heksie.
        // Bez niego `droga` (i kazde inne ulepszenie, ktorego `buildImprovementQualifier` nie
        // czyta z `placedImprovements`, tylko z danych heksa/`roadKeys` — patrz `isRoadQualified`
        // w map/improvement-build.ts i komentarz przy `planCityImprovements` w ai.ts) kwalifikuje
        // sie na tym samym heksie w kolko: zmierzone przed tym straznikiem 37 drog na JEDNYM
        // heksie w 40 turach. Stara petla „po typach" tego nie ujawniala tylko dlatego, ze
        // nigdy nie dochodzila do pozycji `droga` na liscie priorytetow. Ten sam warunek stosuje
        // juz post-factum wolajacy gracz (`prevLayers.includes(pick.key)` w main.ts) — tu jest
        // egzekwowany w samym pickerze, wiec obie sciezki dostaja go tak samo.
        if ((workingPlaced.get(hexKey) ?? []).includes(key)) continue;
        if (!qualifies(key, q, r)) continue;

        picks.push({ ownerId, cityId: city.id, q, r, key, kosztPraca: meta.kosztPraca });
        pracaLeft -= meta.kosztPraca;
        globalSpent += meta.kosztPraca;
        placedThisCity++;
        const cur = workingPlaced.get(hexKey) ?? [];
        workingPlaced.set(hexKey, [...cur, key]);
      }
      if (pracaLeft <= reserve) {
        cityBudgetExhausted = true;
        break;
      }
    }

    // FAZA 2 — `wyrab` na starych zasadach (po typie, pierwszy kwalifikujący się heks).
    // Zachowana 1:1 semantyka sprzed odwrócenia pętli, łącznie z progiem zachowania lasu.
    if (!cityBudgetExhausted && !skipWyrab && basePriority.includes('wyrab')) {
      const key: ImprovementKey = 'wyrab';
      const meta = getImprovementMeta(key);
      const techOk = isImprovementTechUnlocked(key, unlockedTechs) && civGate(key, civArchetype);
      if (meta && techOk && meta.kosztPraca <= pracaLeft && pracaLeft - meta.kosztPraca >= reserve) {
        const forestCount = candidateHexes.reduce((n, { q, r }) => {
          const hk = `${q},${r}`;
          if (scheduledWyrabHexes.has(hk)) return n;
          return map.hexes[hk]?.nakladka === Nakladka.Las ? n + 1 : n;
        }, 0);
        if (forestCount >= WYRAB_MIN_FOREST_IN_RADIUS) {
          while (globalSpent < effectiveCityCap && placedThisCity < maxItemsPerCity && meta.kosztPraca <= pracaLeft) {
            if (pracaLeft - meta.kosztPraca < reserve) break;
            if (globalSpent + meta.kosztPraca > effectiveCityCap) break;
            let placedOne = false;
            for (const { q, r } of orderedHexes) {
              const hexKey = `${q},${r}`;
              if (scheduledWyrabHexes.has(hexKey)) continue;
              if (!qualifies(key, q, r)) continue;
              picks.push({ ownerId, cityId: city.id, q, r, key, kosztPraca: meta.kosztPraca });
              pracaLeft -= meta.kosztPraca;
              globalSpent += meta.kosztPraca;
              placedThisCity++;
              scheduledWyrabHexes.add(hexKey);
              placedOne = true;
              break;
            }
            if (!placedOne) break;
          }
        }
      }
    }
  }

  return picks;
}
