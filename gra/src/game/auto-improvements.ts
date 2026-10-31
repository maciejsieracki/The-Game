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
import {
  buildImprovementQualifier,
  depositAllowsPlayerImprovement,
  hexHasDepositReserve,
  type ImprovementBuildState,
} from '../map/improvement-build';
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

/**
 * Kolejność priorytetów AI / profil Zrównoważone (determinizm A=B).
 *
 * R-ULEPSZENIA-OBOZ-LOWIECKI-WYMAGA-TARTAKU-Q1: `tartak` PRZED `oboz_lowiecki` — obóz
 * wymaga teraz w `qualifies()` (map/improvement-build.ts) WCZEŚNIEJ zbudowanego tartaku na
 * TYM SAMYM heksie lasu. Było odwrotnie (`oboz_lowiecki` przed `tartak`): AI próbowałoby
 * najpierw obozu, ten byłby zablokowany przez nowy gate, a pętla FAZA 1 idzie po priorytecie
 * RAZ na heks w tej samej iteracji — więc bez tej zmiany kolejności obóz nigdy nie doczekałby
 * się budowy w rozsądnym czasie na danym polu (dopiero po tym, jak inny mechanizm postawi
 * tartak). Kolejność wewnątrz reszty listy bez zmian.
 */
export const AI_IMPROVEMENT_PRIORITY: readonly ImprovementKey[] = [
  'farma', 'bydlo', 'owce', 'lama', 'tarasy', 'tartak', 'oboz_lowiecki', 'lodzie_rybackie',
  // Strategic transition: build bronze inputs first (copper + tin), then iron.
  // Recruitment stock deficits still move the exact mine/converter forward when needed.
  'irygacja', 'kopalnia_miedzi', 'kopalnia_cyny', 'kopalnia_zelaza', 'kamieniolom', 'glinianka', 'stadnina',
  'warzelnia_soli', 'posterunek', 'droga', 'droga_brukowana', 'fort',
  'wyrab',
];

/**
 * R-ULEPSZENIA-OBOZ-LOWIECKI-WYMAGA-TARTAKU-Q1 (runda 2 — naprawa regresu znalezionego przez
 * Final Control w rundzie 1): `tartak` PRZED `oboz_lowiecki`, ten sam wzorzec reorderu co w
 * `AI_IMPROVEMENT_PRIORITY` wyżej. Bez tego pod profilem „Żywność" automat próbował od razu
 * `oboz_lowiecki`, zawsze przegrywał gate wymagający wcześniejszego tartaku na TYM SAMYM
 * heksie (bo tartak nigdy nie jest w tej liście w ogóle), i CICHO przestawał budować obozy
 * pod tym profilem na zawsze (0/18 zamiast 18/18 w symulacji Final Control).
 */
export const ULEPSZENIA_FOCUS_ZYWNOSC: readonly ImprovementKey[] = [
  'farma', 'bydlo', 'owce', 'lama', 'tarasy', 'lodzie_rybackie', 'irygacja',
];

/**
 * R-WEB-AUTOIMPROVE-STAGES-Q1 R3, ABC-A=C (właściciel 2026-10-31, K1 gracz „Żywność”): z profilu „Żywność”
 * ZNIKAJĄ `tartak` i `oboz_lowiecki` — K1 to wyłącznie farma/trzoda/irygacja/wycinka (wg etapów), zero tartaków
 * i obozów. Stała służy jako filtr bezpieczeństwa także dla ścieżek z `priorityOverride` (etap E6).
 */
const FOREST_BUILDING_KEYS: ReadonlySet<ImprovementKey> = new Set<ImprovementKey>(['tartak', 'oboz_lowiecki']);

/**
 * R3, ABC-B=B (K2/K3, jedna wspólna logika): lista „samej żywności” przy braku niedoboru = żywność K1 +
 * `oboz_lowiecki`. Tartak NIE jest żywnością i powstaje wyłącznie przy niedoborze drewna (krok „brakujący
 * surowiec”); obóz łowiecki `qualifies()` dopuszcza tylko na heksie z JUŻ istniejącym tartakiem
 * (improvement-build.ts:641), więc nie powoduje budowy nowego tartaku.
 */
const ULEPSZENIA_FOOD_ONLY_ZROWNOWAZONE: readonly ImprovementKey[] = [
  ...ULEPSZENIA_FOCUS_ZYWNOSC, 'oboz_lowiecki',
];

/**
 * R-ULEPSZENIA-OBOZ-LOWIECKI-WYMAGA-TARTAKU-Q1 (runda 3 — naprawa regresu znalezionego
 * przez Evaluatora rundy 2, potwierdzonego niezależnie przez Obronę rundy 2): CELOWO
 * nie `new Set(ULEPSZENIA_FOCUS_ZYWNOSC)` wprost — `tartak` jest tu ODJĘTY, mimo że
 * jest w `ULEPSZENIA_FOCUS_ZYWNOSC` (kolejność budowy, komentarz przy tej stałej wyżej).
 * Powód rozdziału: ten Set ma DRUGIEGO konsumenta poza kolejnością budowy — `main.ts`
 * (`syncImprovementDecorForHex`/`forestKeptUnderImprovement`, ~12071-12078) ma jawny,
 * zamknięty kontrakt z tematu R-ULEPSZENIA-OBOZ-LOWIECKI-LAS-ZNIKA-I-TEREN-Q1 (Final
 * Control PASS 2026-09-02): „droga/fort/posterunek/tartak/glinianka NIE są ulepszeniami
 * żywnościowymi i spłaszczają wzgórze jak dotąd". Runda 2 dopisała `tartak` do
 * `ULEPSZENIA_FOCUS_ZYWNOSC`, żeby naprawić INNY defekt (profil „Żywność" nigdy nie
 * budował `oboz_lowiecki` — gate w `qualifies()` wymaga wcześniej zbudowanego `tartak`
 * na TYM SAMYM heksie) — ale przez `new Set(...)` bez filtra ta zmiana PRZY OKAZJI
 * przesunęła też `tartak` do zbioru „żywnościowych" dla kontraktu widoczności lasu,
 * łamiąc go (żywy dowód: `tools/oboz-lowiecki-las-znika-render-test.cjs`, sekcja G,
 * 26/27 zamiast 27/27 na cfbff71d). Rozdzielenie dwóch znaczeń tego Setu naprawia
 * kontrakt lasu bez cofania naprawy rundy 2.
 *
 * UWAGA — weryfikacja żywa konsumenta `foodOnly` (`hexPhasePriority` niżej, ~linia 682)
 * DAŁA WYNIK PRZECIWNY do założenia dispatchu rundy 3 („dodanie tartak tam jest
 * niezależnie pożądane, zostaw jak jest"): symulacja `pickAutoImprovements`
 * (`demandDriven: true`, profil `zrownowazone`, brak deficytu → foodOnly aktywne,
 * 3 ziarna × 40 tur) daje PRZED tą zmianą tartak=123/oboz_lowiecki=123 w parach 1:1,
 * a PO tej zmianie (ten sam Set, bez filtra na konsumenta) tartak=0/oboz_lowiecki=0 —
 * dokładnie wzorzec cichego regresu z rundy 1/2 tego tematu, tym razem po stronie
 * AI CYWILIZACJI profilu zrównoważonego pod popytem. Przyczyna: `hexPhasePriority`
 * (linia 682) czyta TEN SAM eksport `ULEPSZENIA_ZYWNOSCIOWE`, więc odjęcie `tartak`
 * tu odejmuje go RÓWNIEŻ tam — te dwa znaczenia (kontrakt dekoru lasu vs. gate
 * `foodOnly`) są z tego miejsca strukturalnie nierozdzielne, bo allowlista rundy 3
 * zezwala WYŁĄCZNIE na zmianę tej definicji, nie linii 682 ani main.ts. Zgłoszone
 * jawnie w raporcie rundy 3 jako BLOKADA do decyzji Evaluatora/właściciela — NIE
 * naprawione w tej rundzie, bo naprawa (rozdzielenie konsumentów) wymaga poszerzenia
 * allowlisty poza tę definicję.
 */
export const ULEPSZENIA_ZYWNOSCIOWE: ReadonlySet<ImprovementKey> =
  new Set<ImprovementKey>(ULEPSZENIA_FOOD_ONLY_ZROWNOWAZONE);

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

/**
 * R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (runda 4, ZASADA 1 — budowanie napędzane popytem).
 *
 * ECHO właściciela 2026-08-27: „AI powinno budować mniej więcej wszystkie ulepszenia poza
 * żywnością, tylko w miarę potrzeby, czyli surowcowe, wtedy kiedy brakuje surowców, a nie
 * budować na zapas […]. W innych wypadkach powinna być tylko i wyłącznie inwestycja
 * w żywność."
 *
 * `deficitKeys` to `resourceDeficitKeys` silnika (`detectOwnerResourceNeeds` →
 * `main.ts::resourceDeficitKeysForOwner`). Klucz `zywnosc` jest z tego testu WYŁĄCZONY
 * ŚWIADOMIE: niedobór żywności nie jest „sygnałem do wybudowania pozostałych ulepszeń" —
 * w domyślnym trybie i tak buduje się wyłącznie żywność, więc brak żywności nie może
 * otwierać budowy surowców i infrastruktury (byłoby to odwrócenie reguły właściciela).
 * `detectOwnerResourceNeeds` dopisuje `zywnosc` do `deficitKeys`, gdy zapas żywności
 * państwa spada poniżej progu — bez tego filtru każde głodujące państwo budowałoby
 * „na zapas" wszystko.
 */
export function hasNonFoodResourceDeficit(deficitKeys?: readonly string[]): boolean {
  if (!deficitKeys?.length) return false;
  return deficitKeys.some(k => k !== 'zywnosc');
}

/**
 * R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (runda 4, ZASADA 3 — przekierowanie nadwyżki).
 * Diagnostyka jednego wywołania pickera, wypełniana W MIEJSCU, gdy wołający poda obiekt
 * w `PickAutoImprovementsOpts.surplusReport`. Nie zmienia ani jednego picku — służy
 * wyłącznie temu, żeby wołający (AI CYWILIZACJI: `main.ts`, AI GRACZA: `main.ts`) wiedział,
 * że budżet ulepszeń nie ma dziś czego kupić.
 */
export interface AutoImprovementSurplusReport {
  /** Czy w tym wywołaniu Zasada 1 była w ogóle aktywna (demandDriven + profil zrównoważony). */
  demandActive: boolean;
  /** Czy trwa niedobór surowca innego niż żywność (`hasNonFoodResourceDeficit`). */
  deficitActive: boolean;
  /** Czy jakikolwiek heks dopuszczony przez Zasadę 2 kwalifikował JAKIEKOLWIEK ulepszenie. */
  anyCandidate: boolean;
  /** ZASADA 3: brak niedoboru ORAZ brak kandydatów „przy obywatelach" = nadwyżka budżetu. */
  surplus: boolean;
}

/** Świeży, pusty raport nadwyżki (wołający przekazuje go do pickera i czyta po powrocie). */
export function freshSurplusReport(): AutoImprovementSurplusReport {
  return { demandActive: false, deficitActive: false, anyCandidate: false, surplus: false };
}

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
  /**
   * R4-Q2=C: `skipWyrab` PER MIASTO — nadpisuje wspólne `skipWyrab` dla tego miasta.
   * Istnieje, bo przełącznik „wolno wycinać las" właściciel chciał mieć w DWÓCH zakresach
   * (państwo i miasto), a `skipWyrab` jest jeden na całe wywołanie. Gdy nie podane,
   * obowiązuje `skipWyrab` (czyli dla wołających nieświadomych tej opcji — bez zmian).
   */
  getSkipWyrab?: (city: AutoImprovementCity) => boolean;
  /**
   * ZASADA 1 (runda 4): włącza budowanie napędzane popytem. Domyślnie `false`, żeby
   * wołający nieświadomi tej reguły (narzędzia, testy legacy) zachowali dzisiejsze
   * zachowanie. Działa TYLKO na profilu `zrownowazone` — trzy pozostałe profile automatu
   * gracza („żywność", „surowce", „infrastruktura") są jawnym wyborem gracza wbrew
   * domyślnemu zachowaniu i NIE są ruszane (granica §14 dispatchu rundy 4).
   */
  demandDriven?: boolean;
  /** ZASADA 1: `resourceDeficitKeys` właściciela na tę turę (patrz `hasNonFoodResourceDeficit`). */
  resourceDeficitKeys?: readonly string[];
  /** ZASADA 3: obiekt diagnostyczny wypełniany w miejscu; `undefined` = nie licz nic ekstra. */
  surplusReport?: AutoImprovementSurplusReport;
  civArchetype?: string;
  playerEra?: number;
  isImprovementAllowedForCiv?: (key: ImprovementKey, civArchetype?: string) => boolean;
  /** Nadpisanie kolejności (np. AI deficit boost). */
  priorityOverride?: readonly ImprovementKey[];
  /** Food mode: gate all selected cities through empire-wide preparation/farm/livestock/late-food stages. */
  foodImprovementStages?: boolean | ((city: AutoImprovementCity) => boolean);
  /** Internal stage-0 gate: only clear forest on river hexes, never off-river forest. */
  riverForestClearingOnly?: boolean;
  /**
   * R-WEB-AUTOIMPROVE-PRIORITY-Q1 (R5): heksy, na których wycinka JUŻ trwa (wieloturowa wycinka
   * gracza: `hexClearingStates`) albo została już zaplanowana w tym samym wywołaniu. Picker traktuje je
   * jak `scheduledWyrabHexes` — bez tego etap wycinki emitował rozkaz na heks w toku co turę,
   * wykonanie go odrzucało (`hexClearingStates.has`), a rozkaz (niepusty) zajmował całe wywołanie
   * i blokował farmy/trzodę/irygację (zmierzone: main.ts exec-wycinka-in-progress).
   */
  clearingHexKeys?: ReadonlySet<string>;
  /**
   * Internal (R2): przebiegi K1/K2/K3 (niedobor, etapy, fallback miast zywnosciowych) trzymaja tartak i oboz
   * w minimum lesnym `ceil(pop/10)` na miasto. Profile „surowce”/„infrastruktura” i miasta spoza etapow
   * tej flagi NIE dostaja — zachowanie bazy 4d1916f2c.
   */
  limitForestKeysToMinimum?: boolean;
  /**
   * Internal (R4, korekta dróg właściciela 2026-10-31): przebieg „drogi” K2/K3 — jedyny, w którym profil
   * zrównoważony pod popytem (`demandDriven`) może postawić `droga`/`droga_brukowana`. Ustawia go WYŁĄCZNIE
   * `pickAutoImprovements`, gdy etapy żywności E1–E6 i ścieżka zapasowa nie mają nic do zrobienia ORAZ nie
   * ma aktywnego niedoboru z możliwym do zbudowania ulepszeniem (najniższy priorytet).
   */
  roadsPass?: boolean;
  /** Internal stage E1: only river hexes are candidates (farm on river first, everywhere). */
  riverHexesOnly?: boolean;
  /** Internal stage E5: the river stages E1-E4 are exhausted — off-river clearing is not blocked by river hexes. */
  offRiverClearing?: boolean;
  /**
   * Internal (stages): when the most expensive eligible item of the stage does not fit the budget now,
   * cheaper items must NOT consume it (koniec starvation irygacji 60 Pracy, Q2=B/ABC-6=A).
   */
  reserveBudgetForMostExpensive?: boolean;
  /** Internal (stages): irrigation only on a hex that already has a farm (owner order: clear→farm→livestock→irrigation). */
  irrigationNeedsFarm?: boolean;
  /**
   * K2/K3: filtr `onlyWorked` dla przebiegu „brakujący surowiec” (AI: surowce wszędzie — ECHO 2026-09-08;
   * gracz: domyślnie jego własne `getOnlyWorked`).
   */
  getResourcePassOnlyWorked?: (city: AutoImprovementCity) => boolean;
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
const FOOD_LIVESTOCK_STAGE_KEYS: readonly ImprovementKey[] = [
  'bydlo', 'owce', 'lama',
];

/**
 * R-WEB-AUTOIMPROVE-PRIORITY-Q1 (R5, D4 właściciela 2026-10-31): limit jednego etapu na turę — intencja
 * zamkniętego tematu R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 („nie rób 15 heksów naraz niekompleksowo”),
 * zachowana mimo przejścia z „heks po heksie” na etapy globalne. Dotyczy rozkazów jednego etapu
 * na jedno miasto w jednym wywołaniu (AI: `maxItemsPerCity: 1` jest ostrzejszy i zostaje).
 */
export const FOOD_STAGE_MAX_ITEMS_PER_CITY = 3;

interface FoodStageDef {
  /** Etap właściciela (E1…E6) — tylko opis do diagnostyki. */
  id: string;
  keys: readonly ImprovementKey[];
  /** E1: kandydaci tylko na heksach z rzeką. */
  riverHexesOnly?: boolean;
  /** E2: wycinka wyłącznie lasu na heksie rzeki. */
  riverForestClearingOnly?: boolean;
  /** E5: rzeki zagospodarowane (E1-E4 puste) — wycinka poza rzeką nie jest blokowana przez heksy rzeki. */
  offRiverClearing?: boolean;
  /** Q2=B (właściciel 2026-10-31): trzoda i irygacja poza limitem procentowym puli Pracy (zostaje rezerwa i sama Praca). */
  exemptPercentCap?: boolean;
}

/**
 * WIĄŻĄCA SPECYFIKACJA WŁAŚCICIELA (2026-10-31), globalnie po etapach, nie heks po heksie:
 *   E1 farma na heksach z rzeką BEZ lasu — pierwszy priorytet, wszędzie;
 *   E2 wycinka lasu na heksach przy rzece (potem farma na wyciętym heksie = E1 w kolejnej turze);
 *   E3 hodowla (bydło/owce/lama) — wyłącznie przy rzece (picker: `riverHexKeys`), poza limitem % puli (Q2=B);
 *   E4 irygacja (+tarasy) — poza limitem % puli (Q2=B);
 *   E5 poza rzeką: wycinka + farmy (D3). ABC-3=B (właściciel 2026-10-31): BEZ minimum leśnego
 *      (`lesneMinSpelnione`) i BEZ progu `WYRAB_MIN_FOREST_IN_RADIUS`; tartak/obóz NIE są częścią tego
 *      etapu (nie stawiamy ich na każdym lesie kosztem wycinki); heks z tartakiem/obozem NIE idzie pod
 *      topór (strażnik per heks zostaje);
 *   E6 pozostałe ulepszenia żywnościowe (obóz łowiecki — wymaga tartaku na heksie, w granicach minimum
 *      leśnego `ceil(pop/10)`; łodzie rybackie, warzelnia soli).
 * Etap niższy rusza dopiero, gdy wyższy nie ma NIC do zrobienia w zasięgu miasta (z uwzględnieniem
 * technologii i `onlyWorked`): etap, któremu brakuje technologii, NIE jest celem (D4), natomiast etap
 * z celem czekającym na samą Pracę/limit wstrzymuje niższe (kolejność nie jest omijana).
 */
const FOOD_STAGES: readonly FoodStageDef[] = [
  { id: 'E1', keys: ['farma'], riverHexesOnly: true },
  { id: 'E2', keys: ['wyrab'], riverForestClearingOnly: true },
  { id: 'E3', keys: FOOD_LIVESTOCK_STAGE_KEYS, exemptPercentCap: true },
  { id: 'E4', keys: ['irygacja', 'tarasy'], exemptPercentCap: true },
  { id: 'E5', keys: ['wyrab', 'farma'], offRiverClearing: true },
  { id: 'E6', keys: ['oboz_lowiecki', 'lodzie_rybackie', 'warzelnia_soli'] },
];

/** D3: ulepszenia, których wykonanie na heksie rzeki oznacza „zagospodarowaną rzekę” (wycinkę liczy `riverKrok0Ok`). */
const RIVER_DEVELOPMENT_KEYS: readonly ImprovementKey[] = ['farma', 'bydlo', 'owce', 'lama', 'irygacja', 'tarasy'];

/**
 * P-AI-011 / R-WEB-AUTOIMPROVE-STAGES-Q1: ulepszenie terenu pod brakujący surowiec. JEDNA tablica dla
 * K2 (gracz „zrównoważone”) i K3 (AI cywilizacji) — `ai.ts` re-eksportuje ją jako `AI_IMPROVEMENT_FOR_DEFICIT`.
 */
export const IMPROVEMENT_FOR_DEFICIT: Readonly<Record<string, readonly ImprovementKey[]>> = {
  drewno: ['tartak', 'wyrab'],
  kamien: ['kamieniolom'],
  glina: ['glinianka'],
  ruda: ['kopalnia_miedzi'],
  ruda_zelaza: ['kopalnia_zelaza'],
  ruda_cyny: ['kopalnia_cyny'],
  // R4 (właściciel 2026-10-31: „niedobór ma tylko otwierać ulepszenia brakującego surowca”): dopisane
  // sól → warzelnia i koń → stadnina (klucze magazynu `sol`/`kon`, terrain-improvements.ts:284). Bez nich
  // nowa zasada (lista = żywność + WYŁĄCZNIE brakujący surowiec) nigdy nie postawiłaby warzelni/stadniny.
  sol: ['warzelnia_soli'],
  kon: ['stadnina'],
};

/** Klucze dróg (terrain-improvements.json: `droga`, `droga_brukowana`) — najniższy priorytet K2/K3. */
export const ROAD_KEYS: readonly ImprovementKey[] = ['droga', 'droga_brukowana'];
const ROAD_KEY_SET: ReadonlySet<ImprovementKey> = new Set<ImprovementKey>(ROAD_KEYS);

/**
 * Ulepszenia produkujące BRAKUJĄCE surowce (kolejność = kolejność niedoborów, największa luka pierwsza).
 * Pusta lista = niedobór dotyczy wyłącznie surowców bez ulepszenia terenu (np. złoto, stal) albo żywności.
 */
export function deficitImprovementKeys(deficitKeys?: readonly string[]): ImprovementKey[] {
  const out: ImprovementKey[] = [];
  for (const key of deficitKeys ?? []) {
    // `wyrab` (drewno) NIE jest krokiem „brakujący surowiec”: wycinka ma własną ścieżkę etapową
    // (E2 przy rzece, E5 poza rzeką — decyzje D1/D3/ABC-3) i nie wolno jej uruchamiać na wszystkich lasach
    // z powodu niedoboru drewna.
    for (const imp of IMPROVEMENT_FOR_DEFICIT[key] ?? []) if (imp !== 'wyrab' && !out.includes(imp)) out.push(imp);
  }
  return out;
}

function isFoodStageCity(opts: PickAutoImprovementsOpts, city: AutoImprovementCity): boolean {
  if (typeof opts.foodImprovementStages === 'function') return opts.foodImprovementStages(city);
  return opts.foodImprovementStages === true;
}

/**
 * Niedobory, na które istnieje ulepszenie terenu (K2/K3). Niedobór surowca bez ulepszenia (złoto, stal…)
 * lub żywności NIE jest sygnałem do budowy czegokolwiek w automacie ulepszeń — „niedobór ma wpływać
 * tylko wtedy, gdy realnie występuje” (właściciel 2026-10-31).
 */
export function actionableDeficitKeys(deficitKeys?: readonly string[]): string[] {
  return (deficitKeys ?? []).filter(k => deficitImprovementKeys([k]).length > 0);
}

/**
 * Food automation is a civilization-wide sequence, not a per-hex stack order (E1…E6 above).
 * A stage that emits any orders owns the whole call; later stages wait for the next turn. This keeps
 * the AI per-city throttle intact while ensuring one city cannot start livestock
 * while another still has an eligible farm plot.
 *
 * KONTEKSTY (właściciel 2026-10-31; każdy test i raport podaje, którego dotyczy):
 *  K1 gracz „Żywność” (`getFocus`==='zywnosc'): wyłącznie etapy E1…E6, BEZ odwołań do niedoborów;
 *  K2 gracz „zrównoważone” i K3 AI cywilizacji: TA SAMA logika (ten kod). Co turę: (1) jeśli brakuje
 *     surowca, dla którego istnieje ulepszenie terenu (`IMPROVEMENT_FOR_DEFICIT`) — ono idzie NA PRZÓD,
 *     (2) potem etapy żywnościowe z pozostałego budżetu, (3) gdy niedobór zniknie, pierwszy krok
 *     znika razem z nim (zero histerezy — stan liczony od nowa w każdym wywołaniu).
 */
export function pickAutoImprovements(opts: PickAutoImprovementsOpts): AutoImprovementPick[] {
  const stagedCities = opts.cities.filter(city => isFoodStageCity(opts, city));
  if (stagedCities.length === 0 || !opts.territoryNodes) {
    return pickAutoImprovementsSinglePass(opts);
  }
  const otherCities = opts.cities.filter(city => !isFoodStageCity(opts, city));
  const clearingSeed = new Set<string>(opts.clearingHexKeys ?? []);
  const maxItems = opts.maxItemsPerCity ?? Infinity;
  const maxItemsStage = Math.min(maxItems, FOOD_STAGE_MAX_ITEMS_PER_CITY);
  const totalBudget = Number.isFinite(opts.improvementBudgetCap)
    ? Math.max(0, opts.improvementBudgetCap as number)
    : Math.floor(Math.max(0, opts.pracaAvailable)
      * Math.max(0, Math.min(100, opts.pracaBudgetPercent ?? 100)) / 100);
  // Stan po wcześniejszych przebiegach TEGO wywołania — kolejne przebiegi nie mogą postawić duplikatu
  // warstwy ani drugi raz zaplanować wycinki tego samego heksu.
  const mergedPlaced = new Map<string, string[]>();
  if (opts.placedImprovements) {
    for (const [hk, v] of opts.placedImprovements) mergedPlaced.set(hk, Array.isArray(v) ? [...v] : [v]);
  }
  const record = (picks: readonly AutoImprovementPick[]): void => {
    for (const pick of picks) {
      const hk = `${pick.q},${pick.r}`;
      if (pick.key === 'wyrab') clearingSeed.add(hk);
      else mergedPlaced.set(hk, [...(mergedPlaced.get(hk) ?? []), pick.key]);
    }
  };
  const sum = (picks: readonly AutoImprovementPick[]): number => picks.reduce((n, p) => n + p.kosztPraca, 0);
  /** Opcje przebiegu po wydatku `spent` (wspólna koperta imperium, pula pomniejszona o wydane). */
  const actionable = actionableDeficitKeys(opts.resourceDeficitKeys);
  const after = (spent: number, extra: Partial<PickAutoImprovementsOpts>): PickAutoImprovementsOpts => ({
    ...opts,
    resourceDeficitKeys: actionable,
    placedImprovements: mergedPlaced,
    pracaAvailable: Math.max(0, opts.pracaAvailable - spent),
    improvementBudgetCap: Math.max(0, totalBudget - spent),
    clearingHexKeys: clearingSeed,
    foodImprovementStages: false,
    ...extra,
  });

  // KROK 1 (K2/K3): brakujący surowiec — jego ulepszenie NA PRZÓD. K1 („zywnosc”) tu nie wchodzi.
  const deficitKeys = opts.demandDriven === true ? deficitImprovementKeys(opts.resourceDeficitKeys) : [];
  const deficitCities = deficitKeys.length === 0 ? [] : stagedCities.filter(
    c => (opts.getFocus?.(c) ?? c.ulepszeniaFocus ?? DEFAULT_ULEPSZENIA_FOCUS) === 'zrownowazone',
  );
  let deficitPicks: AutoImprovementPick[] = [];
  if (deficitCities.length > 0) {
    deficitPicks = pickAutoImprovementsSinglePass(after(0, {
      cities: deficitCities,
      priorityOverride: deficitKeys,
      getOnlyWorked: opts.getResourcePassOnlyWorked ?? opts.getOnlyWorked,
      riverForestClearingOnly: false,
      riverHexesOnly: false,
      offRiverClearing: false,
      limitForestKeysToMinimum: true,
    }));
    record(deficitPicks);
  }
  const deficitSpent = sum(deficitPicks);
  const usedByCity = new Map<string, number>();
  for (const p of deficitPicks) usedByCity.set(p.cityId, (usedByCity.get(p.cityId) ?? 0) + 1);
  // Limit sztuk na miasto (AI: 1) obowiązuje na całe wywołanie, nie na każdy przebieg osobno.
  const foodCities = stagedCities.filter(c => (usedByCity.get(c.id) ?? 0) < maxItems);

  // KROK 2: etapy żywnościowe E1…E6.
  let stagedPicks: AutoImprovementPick[] = [];
  let earlierStageIsPending = false;
  for (const stage of foodCities.length === 0 ? [] : FOOD_STAGES) {
    const stageOpts = after(deficitSpent, {
      cities: foodCities,
      priorityOverride: stage.keys,
      riverForestClearingOnly: stage.riverForestClearingOnly === true,
      riverHexesOnly: stage.riverHexesOnly === true,
      offRiverClearing: stage.offRiverClearing === true,
      reserveBudgetForMostExpensive: true,
      irrigationNeedsFarm: true,
      limitForestKeysToMinimum: true,
      maxItemsPerCity: maxItemsStage,
      ...(stage.exemptPercentCap === true
        ? { pracaBudgetPercent: 100, getPracaBudgetPercent: undefined, improvementBudgetCap: undefined }
        : {}),
    });
    const stagePicks = pickAutoImprovementsSinglePass(stageOpts);
    if (stagePicks.length > 0) {
      stagedPicks = stagePicks;
      break;
    }

    // Do not skip a stage just because its valid targets are currently blocked by the Work
    // budget: probe eligibility with an unlimited temporary budget; if a target exists but
    // cannot be built now, later food stages must wait instead of bypassing the chosen priority.
    // ABC-5=A (właściciel): technologia NIE jest powodem czekania — etap bez odblokowanego typu
    // nie ma celu w zasięgu miasta, więc nie blokuje etapów niższych.
    const probePicks = pickAutoImprovementsSinglePass({
      ...stageOpts,
      pracaAvailable: Number.MAX_SAFE_INTEGER,
      improvementBudgetCap: Number.MAX_SAFE_INTEGER,
      pracaBudgetPercent: 100,
      getPracaBudgetPercent: undefined,
      maxItemsPerCity: Infinity,
      pracaSurplusThreshold: 0,
      surplusReport: undefined,
      reserveBudgetForMostExpensive: false,
    });
    if (probePicks.length > 0) {
      earlierStageIsPending = true;
      break;
    }
  }
  record(stagedPicks);
  const stageSpent = deficitSpent + sum(stagedPicks);

  // Preserve ordinary forestry fallback only after no food stage has any eligible
  // target. In particular, never let this fallback cut a non-river forest while a
  // farm/livestock/irrigation phase is waiting on the Work budget.
  // R4: dla K2/K3 (`demandDriven`) lista tej sciezki to NADAL tylko zywnosc + ulepszenie brakujacego
  // surowca (picker zawęza `basePriority` — niedobor NIE otwiera reszty listy).
  let fallbackPicks: AutoImprovementPick[] = [];
  let fallbackIsPending = false;
  if (stagedPicks.length === 0 && !earlierStageIsPending && foodCities.length > 0) {
    const fallbackOpts = after(stageSpent, { cities: foodCities, limitForestKeysToMinimum: true });
    fallbackPicks = pickAutoImprovementsSinglePass(fallbackOpts);
    record(fallbackPicks);
    if (fallbackPicks.length === 0) {
      // Jak w etapach: cel czekajacy tylko na Prace wstrzymuje nizszy priorytet (drogi).
      fallbackIsPending = pickAutoImprovementsSinglePass({
        ...fallbackOpts,
        pracaAvailable: Number.MAX_SAFE_INTEGER,
        improvementBudgetCap: Number.MAX_SAFE_INTEGER,
        pracaBudgetPercent: 100,
        getPracaBudgetPercent: undefined,
        maxItemsPerCity: Infinity,
        pracaSurplusThreshold: 0,
        surplusReport: undefined,
        reserveBudgetForMostExpensive: false,
      }).length > 0;
    }
  }
  const fallbackSpent = stageSpent + sum(fallbackPicks);

  // KROK 3 (K2/K3, korekta dróg właściciela 2026-10-31): „Drogi powinny być budowane dopiero wtedy, kiedy
  // zaspokoi się wszystkie potrzeby związane z ulepszeniami żywności oraz wszystkie potrzeby związane
  // z surowcami.” Drogi = NAJNIŻSZY priorytet: (1) żaden etap E1–E6 ani ścieżka zapasowa nie ma celu
  // (ani do postawienia teraz, ani czekającego na Pracę), (2) niedobór surowca z możliwym do zbudowania
  // ulepszeniem jest zaspokojony: brak picków kroku 1 w tej turze ORAZ brak celu czekającego na Pracę.
  // ZAŁOŻENIE: niedobór bez ulepszenia terenu (złoto, stal) albo bez miejsca/technologii dla ulepszenia
  // NIE blokuje dróg w nieskończoność — `actionable` odfiltrowuje pierwsze, a probe niżej drugie.
  let roadPicks: AutoImprovementPick[] = [];
  const roadCities = opts.demandDriven === true
    ? foodCities.filter(c => (opts.getFocus?.(c) ?? c.ulepszeniaFocus ?? DEFAULT_ULEPSZENIA_FOCUS) === 'zrownowazone')
    : [];
  if (
    roadCities.length > 0
    && stagedPicks.length === 0 && !earlierStageIsPending
    && fallbackPicks.length === 0 && !fallbackIsPending
    && deficitPicks.length === 0
  ) {
    const deficitIsPending = deficitCities.length > 0 && pickAutoImprovementsSinglePass(after(0, {
      cities: deficitCities,
      priorityOverride: deficitKeys,
      getOnlyWorked: opts.getResourcePassOnlyWorked ?? opts.getOnlyWorked,
      riverForestClearingOnly: false,
      riverHexesOnly: false,
      offRiverClearing: false,
      limitForestKeysToMinimum: true,
      pracaAvailable: Number.MAX_SAFE_INTEGER,
      improvementBudgetCap: Number.MAX_SAFE_INTEGER,
      pracaBudgetPercent: 100,
      getPracaBudgetPercent: undefined,
      maxItemsPerCity: Infinity,
      pracaSurplusThreshold: 0,
      surplusReport: undefined,
    })).length > 0;
    if (!deficitIsPending) {
      roadPicks = pickAutoImprovementsSinglePass(after(fallbackSpent, {
        cities: roadCities,
        priorityOverride: ROAD_KEYS,
        roadsPass: true,
        surplusReport: undefined,
        riverForestClearingOnly: false,
        riverHexesOnly: false,
        offRiverClearing: false,
        limitForestKeysToMinimum: false,
        maxItemsPerCity: maxItemsStage,
      }));
      record(roadPicks);
    }
  }
  const sideSpent = fallbackSpent + sum(roadPicks);

  if (otherCities.length === 0) return [...deficitPicks, ...stagedPicks, ...fallbackPicks, ...roadPicks];
  // Selected non-food profiles remain active in the same call. Charge their picks
  // against the same empire envelope, after the currently active food phase.
  const normalPicks = pickAutoImprovementsSinglePass(after(sideSpent, { cities: otherCities }));
  return [...deficitPicks, ...stagedPicks, ...fallbackPicks, ...roadPicks, ...normalPicks];
}

function pickAutoImprovementsSinglePass(opts: PickAutoImprovementsOpts): AutoImprovementPick[] {
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
    getSkipWyrab,
    demandDriven = false,
    resourceDeficitKeys,
    surplusReport,
    civArchetype,
    playerEra,
    isImprovementAllowedForCiv: civGate = isImprovementAllowedForCiv,
    priorityOverride,
    riverForestClearingOnly = false,
    riverHexesOnly = false,
    offRiverClearing = false,
    clearingHexKeys,
    reserveBudgetForMostExpensive = false,
    irrigationNeedsFarm = false,
    limitForestKeysToMinimum = false,
    roadsPass = false,
  } = opts;

  if (cities.length === 0 || !territoryNodes) return [];

  // ZASADA 1 (runda 4): stan niedoboru jest WSPÓLNY dla całego wywołania — `resourceDeficitKeys`
  // jest polityką PAŃSTWA (magazyn surowców jest państwowy), nie miasta.
  const deficitActive = hasNonFoodResourceDeficit(resourceDeficitKeys);
  if (surplusReport) surplusReport.deficitActive = deficitActive;
  // R4: ulepszenia BRAKUJĄCYCH surowców (tylko z nich niedobór może coś „otworzyć” w K2/K3).
  const deficitOpenKeys: ReadonlySet<ImprovementKey> = deficitActive
    ? new Set<ImprovementKey>(deficitImprovementKeys(resourceDeficitKeys))
    : new Set<ImprovementKey>();

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

  // P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1 (runda 3, decyzja orkiestratora Zarzut 2): TEN SAM
  // odczyt magazynu 'kon' imperium co main.ts::citySurowceSumForOwner/refreshBuildApi
  // (symetrycznie do gracza) — żeby AI/automat miasta mogło budować stadninę POZA złożem konia
  // gdy magazyn imperium ma >= STADNINA_HORSE_COST (50), zamiast trwale tracić tę zdolność po
  // retirowaniu Modelu B (livestock-unlock.ts, runda 2). `cities` tu to ZAWSZE realne obiekty
  // `City` (game/cities.ts) zawężone przez wołającego do JEDNEGO ownera (main.ts:
  // `autoImpCities` filtrowane po `c.ownerId === hOid`; ai.ts: `myCities`, komentarz tamże:
  // "AutoImprovementCity jest tylko WĘŻSZYM widokiem tego samego obiektu") — `AutoImprovementCity`
  // po prostu nie deklaruje pola `surowce` w swoim (węższym) typie, mimo że ono tam jest w
  // runtime. Sumowanie PO `ownerId === ownerId` (defensywnie, na wypadek gdyby wołający kiedyś
  // przekazał mieszaną listę) — bez zmiany sygnatury `pickAutoImprovements` ani wołających
  // (main.ts/ai.ts), więc naprawa mieści się WYŁĄCZNIE w tym pliku (allowlista rundy 3).
  const horseStockAvailable = cities.reduce((sum, c) => {
    if (c.ownerId !== ownerId) return sum;
    const surowce = (c as unknown as { surowce?: Record<string, number> }).surowce;
    return sum + (surowce?.kon ?? 0);
  }, 0);
  // `tradeRouteKonUnlocked` (Temat #4, trasa handlowa) NIE jest dziś derywowalne z samych
  // `AutoImprovementCity`/`cities` — wymagałoby dowiezienia `tradeRouteResourceGrants` przez
  // wołającego (main.ts/ai.ts, POZA allowlistą tej rundy). Zostaje `false` (bezpieczny domyślny,
  // TAKI SAM jak zachowanie AI PRZED tą rundą — brak regresji, tylko brak jeszcze tej DRUGIEJ,
  // niezależnej ścieżki darmowego dostępu dla automatu; osobny wąski dodatek jeśli właściciel
  // zechce równości również na tym torze).
  const state: ImprovementBuildState = {
    map,
    cityNodes: cities.map(c => ({ q: c.q, r: c.r, pop: c.population, level: 1 })),
    territoryNodes,
    playerOwnerIdNum: ownerId,
    placedImprovements: workingPlaced,
    researchedTechs: unlockedTechs,
    playerCivArchetype: civArchetype,
    playerEra,
    horseStockAvailable,
    tradeRouteKonUnlocked: false,
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
  // R5: wycinka w toku / zaplanowana wcześniej w tym wywołaniu liczy się jak już zaplanowana.
  const scheduledWyrabHexes = new Set<string>(clearingHexKeys ?? []);

  // Stage reservation: set when the most expensive eligible item of a stage does not fit the budget.
  let budgetReservedForExpensive = false;

  for (const city of orderedCities) {
    if (pracaLeft <= reserve || budgetReservedForExpensive) break;

    const focus = getFocus(city);
    // R4-Q2=C: przełącznik „wolno wycinać las" ma dwa zakresy (państwo i miasto), więc
    // `skipWyrab` musi być rozstrzygany PER MIASTO. Bez `getSkipWyrab` — wartość wspólna.
    // Food phase 0 is an owner-ordered river preparation step; it is limited to
    // river forests by `riverForestClearingOnly` and therefore does not enable
    // general forest harvesting. Other profiles still honor the existing toggle.
    const citySkipWyrab = riverForestClearingOnly
      ? false
      : (getSkipWyrab ? getSkipWyrab(city) : skipWyrab);
    // R3, ABC-A=C: K1 (profil „Żywność”) nigdy nie stawia tartaku ani obozu — także przy `priorityOverride` (E6).
    // R4 (właściciel 2026-10-31, K2 gracz „Zrównoważone” i K3 AI — jedna logika): „Niedobór ma tylko otwierać
    // ulepszenia brakującego surowca, nic więcej.” Pod popytem lista = ŻYWNOŚĆ + ulepszenia WYŁĄCZNIE
    // brakujących surowców (`deficitImprovementKeys`, jedno źródło prawdy: `IMPROVEMENT_FOR_DEFICIT`)
    // + (tylko przebieg `roadsPass`) drogi. Fort/posterunek (FAZA 0) i reszta listy są tu zamknięte zawsze.
    // Profile „Żywność” (K1), „surowce” i „infrastruktura” oraz wywołania bez `demandDriven` — bez zmian.
    const demandActive = demandDriven && focus === 'zrownowazone';
    const basePriority = (priorityOverride ?? prioritiesForUlepszeniaFocus(focus, citySkipWyrab))
      .filter(k => focus !== 'zywnosc' || !FOREST_BUILDING_KEYS.has(k))
      .filter(k => !demandActive
        || k === 'wyrab'
        || ULEPSZENIA_FOOD_ONLY_ZROWNOWAZONE.includes(k)
        || deficitOpenKeys.has(k)
        || (roadsPass && ROAD_KEY_SET.has(k)));
    const onlyWorked = getOnlyWorked(city);
    // R4 KOREKTA F (właściciel 2026-10-31): heks centrum miasta jest ZWYKŁYM heksem dla automatu (farma, trzoda,
    // irygacja i inne wg zwykłych reguł). `workedHexCoordsForCity` WYKLUCZA centrum (okolica.ts:276), bo centrum
    // daje plony bez obywatela (okolica.ts:626 — jest zawsze pracowane), więc dla profili żywnościowych centrum
    // dopisujemy do zbioru „pracowanych”; profile „surowce”/„infrastruktura” bez zmian.
    const workedKeys = onlyWorked && getWorkedHexKeys
      ? ((focus === 'zywnosc' || focus === 'zrownowazone')
        ? new Set<string>([...getWorkedHexKeys(city), `${city.q},${city.r}`])
        : getWorkedHexKeys(city))
      : null;

    // ---------------------------------------------------------------------
    // ZASADA 1 (runda 4) — BUDOWANIE NAPĘDZANE POPYTEM.
    // Domyślnie (brak niedoboru) lista typów zawęża się do `ULEPSZENIA_FOCUS_ZYWNOSC`;
    // przy niedoborze wraca pełna lista profilu (a `improvementPriorityForDeficits`
    // w ai.ts przestawia w niej niedobór na przód — te dwa mechanizmy są rozłączne:
    // TAMTEN zmienia KOLEJNOŚĆ, TEN zmienia ZAKRES).
    // Dotyczy WYŁĄCZNIE profilu `zrownowazone` (AI CYWILIZACJI nie ustawia
    // `ulepszeniaFocus`, więc `getFocus` zwraca dla niej DEFAULT_ULEPSZENIA_FOCUS =
    // `zrownowazone`); trzy pozostałe profile automatu gracza są jawnym wyborem gracza
    // i zostają nietknięte (kryterium 5 dispatchu rundy 4).
    // ---------------------------------------------------------------------
    if (surplusReport && demandActive) surplusReport.demandActive = true;
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

    // ---------------------------------------------------------------------
    // ZASADA 2 (runda 4) — BUDOWA TYLKO PRZY OBYWATELACH, Z WYJĄTKIEM ZŁÓŻ.
    // ECHO właściciela: „powinno domyślnie budować ulepszenia tam, gdzie są obywatele
    // […] z wyłączeniem surowców, które mogą znajdować się w różnych miejscach według
    // potrzeby". Filtr `onlyWorked` istniał wcześniej i wycinał heks bez 👤 CAŁKOWICIE —
    // razem ze złożem, na którym stoi jedyna kopalnia miedzi w promieniu. Tu heks
    // złożowy WRACA do puli kandydatów, ale wyłącznie dla ulepszenia, które to konkretne
    // złoże konsumuje (`depositAllowsPlayerImprovement`) — patrz `hexAllowsKey` niżej.
    // `hexHasDepositReserve` jest tu właściwym testem „to jest złoże": nakładka Las daje
    // `false` (jedyne dwie nie-złożowe nakładki to `Brak` i `Las`), więc `oboz_lowiecki`
    // na lesie NIE dostaje zwolnienia — obóz to ulepszenie przy obywatelach jak każde inne.
    // ---------------------------------------------------------------------
    const isDepositHexForKey = (q: number, r: number, key: ImprovementKey): boolean => {
      const hex = map.hexes[`${q},${r}`];
      if (!hex) return false;
      return hexHasDepositReserve(hex) && depositAllowsPlayerImprovement(key, hex);
    };
    /** Czy na tym heksie wolno postawić TEN klucz, biorąc pod uwagę Zasadę 2. */
    const hexAllowsKey = (q: number, r: number, key: ImprovementKey): boolean => {
      if (!workedKeys) return true;
      if (workedKeys.has(`${q},${r}`)) return true;
      return isDepositHexForKey(q, r, key);
    };

    // Pełny promień miasta PRZED filtrem Zasady 2. Zasada 2 ogranicza, GDZIE wolno
    // budować — NIE zmienia tego, co miasto ma i czym dysponuje w swoim promieniu.
    // Wszystkie LICZNIKI STANU (zapas lasu przed wyrębem, minimum leśne, pułap ulepszeń
    // obronnych, licznik ulepszeń plonowych) muszą liczyć po tej liście, nie po
    // zawężonej: zliczanie zapasu lasu po samych polach z obywatelami dawało przy małym
    // mieście (pop 2 → 2 pola) „mniej niż 3 heksy lasu", więc próg zachowania lasu
    // zamykał wyrąb na mapie zbudowanej z samego lasu (regres złapany przez
    // `tools/ai-improvements-test.cjs`, test 7).
    const radiusHexes = candidateHexes;
    if (workedKeys) {
      candidateHexes = candidateHexes.filter(({ q, r }) => {
        if (workedKeys.has(`${q},${r}`)) return true;
        const hex = map.hexes[`${q},${r}`];
        return !!hex && hexHasDepositReserve(hex);
      });
    }

    // R4 KOREKTA F (właściciel 2026-10-31): zniesiony filtr R3 „centrum miasta wyłączone” — heks centrum jest
    // zwykłym kandydatem (patrz `workedKeys` wyżej); tartak nie powstanie, bo centrum nie ma lasu.

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
    const orderedHexes = [...candidateHexes]
      // R5 etap E1: farma najpierw na heksach z rzeką (wszędzie), więc kandydaci to tylko rzeka.
      .filter(h => !riverHexesOnly || riverHexKeys.has(`${h.q},${h.r}`))
      .sort((a, b) => {
      const ar = riverHexKeys.has(`${a.q},${a.r}`) ? 0 : 1;
      const br = riverHexKeys.has(`${b.q},${b.r}`) ? 0 : 1;
      return (ar - br) || (hexDist(a.q, a.r) - hexDist(b.q, b.r)) || (a.q - b.q) || (a.r - b.r);
    });

    // R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (runda 3, W-B): sekwencja DOMYKANIA heksa obejmuje
    // WYŁĄCZNIE ulepszenia o niezerowej delcie plonu. `wyrab` ma własny, wcześniejszy krok
    // na heksach rzeka+las (niżej w tej samej pętli), a `posterunek`/`fort` (delta 0/0/0/0)
    // wychodzą do osobnej FAZY 0 „obrona" — patrz `ZERO_YIELD_IMPROVEMENTS`.
    //
    // ZASADA 1 (runda 4) nakłada się TU: przy braku niedoboru lista domykania heksa
    // zawęża się do ulepszeń ŻYWNOŚCIOWYCH, a FAZA 0 (obrona: posterunek/fort —
    // infrastruktura) w ogóle nie rusza. To jest różnica między „mniej" a ZERO rozkazów
    // poza żywnością, której wymaga kryterium 2 dispatchu.
    const hexPhasePriority = basePriority.filter(
      k => k !== 'wyrab'
        && !ZERO_YIELD_IMPROVEMENTS.has(k),
    );
    const defensePriority = demandActive
      ? []
      : basePriority.filter(k => ZERO_YIELD_IMPROVEMENTS.has(k));

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
    const plonoweWPromieniu = radiusHexes.reduce((n, { q, r }) => {
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
        for (const { q, r } of radiusHexes) {
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
          // ZASADA 2: posterunek/fort to nie ulepszenia złożowe — na heksie bez 👤 nie stają.
          if (!hexAllowsKey(q, r, key)) continue;
          if (!qualifies(key, q, r)) continue;
          if (surplusReport) surplusReport.anyCandidate = true;
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
    //
    // ZASADA 1 (runda 4) a WYRĄB — świadome rozstrzygnięcie Operatora, zgłoszone wprost
    // w raporcie: KROK 0 (wyrąb na heksie rzeka+las) ZOSTAJE także przy braku niedoboru.
    // Po zamknięciu `R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1` (w `main` od 2026-08-27) farma na
    // zalesionym heksie wymaga wyrębu ZAWSZE — więc ten konkretny wyrąb NIE jest budową
    // „na zapas": jest pierwszym krokiem sekwencji ŻYWNOŚCIOWEJ (wyrąb → farma), którą
    // właściciel zlecił w rundzie 3 i której dispatch rundy 4 wprost nie cofa („Zasada 1
    // zmienia PROGI budowy, nie usuwa mechanizmu wyrębu przy rzece z rundy 3").
    // Wyłączany jest natomiast wyrąb z FAZY 2 (niżej) — tam wyrąb NIE prowadzi do farmy,
    // jest zbieraniem drewna „bo nic pilniejszego", czyli dokładnie budową na zapas.
    const wyrabWlaczony = !citySkipWyrab && basePriority.includes('wyrab');
    let forestLeftInRadius = radiusHexes.reduce((n, { q, r }) => {
      const hk = `${q},${r}`;
      if (scheduledWyrabHexes.has(hk)) return n;
      return map.hexes[hk]?.nakladka === Nakladka.Las ? n + 1 : n;
    }, 0);

    // R-WEB-AUTOIMPROVE-PRIORITY-Q1 (runda 2, zarzut 1 i 3 Obrony): KROK 0 NA HEKSIE RZEKA+LAS
    // (etap E2 właściciela: „najpierw wyciąć, potem farma" — wiążące) NIE zależy od
    // `lesneMinSpelnione` ani od progu `WYRAB_MIN_FOREST_IN_RADIUS`. Zależność od tartaku
    // i obozu, których jeszcze nie ma, była DEADLOCKIEM: tartak/obóz zablokowane na rzece,
    // a wycinka zablokowana brakiem tartaku. Ta sama funkcja steruje bramką tartak/obóz
    // poniżej, więc obie strony zgadzają się co do tego, kiedy wyrąb na rzece dojdzie.
    // Warunki = dokładnie to, co wyrąb na rzece faktycznie wymaga (bez budżetu — budżet
    // jest przejściowy, a bramka nie może blokować tartaku na stałe).
    const wyrabMetaRzeka = getImprovementMeta('wyrab');
    const riverKrok0Ok = (q: number, r: number): boolean => {
      const hk = `${q},${r}`;
      if (!wyrabWlaczony || !wyrabMetaRzeka) return false;
      if (!riverHexKeys.has(hk)) return false;
      if (scheduledWyrabHexes.has(hk)) return false;
      if (map.hexes[hk]?.nakladka !== Nakladka.Las) return false;
      if ((workingPlaced.get(hk) ?? []).some(k => k === 'tartak' || k === 'oboz_lowiecki')) return false;
      if (!hexAllowsKey(q, r, 'wyrab')) return false;
      if (!isImprovementTechUnlocked('wyrab', unlockedTechs) || !civGate('wyrab', civArchetype)) return false;
      return qualifies('wyrab', q, r);
    };

    // „Jeżeli zagospodaruje wszystkie rzeki, to dopiero wtedy zabiera się za inne tereny
    // i wykarczowuje las, i stawia kolejne farmy" (ECHO właściciela 2026-08-27). Dopóki
    // w promieniu miasta został NIEZAGOSPODAROWANY heks z rzeką, wyrąb dotyczy WYŁĄCZNIE
    // heksów z rzeką. Gdy rzek już nie ma czym zagospodarować — a są mapy, gdzie miasta
    // nie mają w promieniu ANI JEDNEGO heksa z rzeką (zmierzone: ziarno 512, wyrąb 0 na
    // 40 tur, bo warunek „rzeka" nie miał gdzie zajść) — wyrąb schodzi na pozostałe lasy.
    // Heks z rzeką liczy się jako niezagospodarowany, gdy ma jeszcze las (jest co wyciąć)
    // albo jest pusty i kwalifikuje jakiekolwiek ulepszenie plonowe.
    // R-WEB-AUTOIMPROVE-PRIORITY-Q1 (R5, D3 właściciela 2026-10-31): „rzeka zagospodarowana” = na KAŻDYM
    // kwalifikującym się heksie rzeki zrobione wszystko, co możliwe wg dostępnych technologii
    // (wycinka, farma, trzoda, irygacja) — bez wiecznego blokowania przez heks, na którym dany typ jest
    // niemożliwy (brak technologii, brak obywatela przy onlyWorked, stoi tartak/obóz, heks nie kwalifikuje się).
    // Dotychczas każdy heks rzeki z lasem liczył się jako „do zagospodarowania” nawet gdy wycinka na nim była
    // niemożliwa (`riverKrok0Ok` fałsz), co blokowało wycinkę poza rzeką na stałe. W przebiegu etapowym
    // (`offRiverClearing`, etap E5) wyższe etapy E1-E4 są już wyczerpane, więc ta bramka nie obowiązuje.
    const rzekiDoZagospodarowania = !offRiverClearing && wyrabWlaczony && candidateHexes.some(({ q, r }) => {
      const hk = `${q},${r}`;
      if (!riverHexKeys.has(hk)) return false;
      if (scheduledWyrabHexes.has(hk)) return false;
      if (map.hexes[hk]?.nakladka === Nakladka.Las && riverKrok0Ok(q, r)) return true;
      // ZASADA 1/2: „czym zagospodarować” liczy się na TEJ SAMEJ, zawężonej liście
      // i z tym samym filtrem heksów, którymi rządzi się FAZA 1 — inaczej wyrąb schodziłby
      // poza rzekę na podstawie kandydatów, których automat i tak nie postawi.
      const placedHere = workingPlaced.get(hk) ?? [];
      return hexPhasePriority.some(k => {
        if (!RIVER_DEVELOPMENT_KEYS.includes(k)) return false;
        if (placedHere.includes(k)) return false;
        if ((k === 'bydlo' || k === 'owce' || k === 'lama') && !riverHexKeys.has(hk)) return false;
        if (!isImprovementTechUnlocked(k, unlockedTechs) || !civGate(k, civArchetype)) return false;
        return hexAllowsKey(q, r, k) && qualifies(k, q, r);
      });
    });

    // MINIMUM LEŚNE MIASTA (ECHO właściciela: „Każde miasto powinno mieć las wokół siebie,
    // jeden tartak i obóz; ale tylko jeden na każde dziesięć obywateli wystarcza").
    // Wyrąb POZA heksem z rzeką jest zamknięty, dopóki miasto nie ma swojego tartaku
    // i obozu — inaczej wycinka wchodzi na heks przed tartakiem i kasuje las, na którym
    // tartak stoi. Zmierzone bez tego warunku: `tartak` 69 → 0 (regres wyniku rundy 2).
    const lesneMin = Math.max(1, Math.ceil((city.population || 0) / JEDEN_NA_ILU_OBYWATELI));
    // ZASADA 1 (runda 4) — KOREKTA ZAKRESU TEJ BRAMKI, zmierzona: minimum leśne wolno
    // wymagać WYŁĄCZNIE z tych kluczy, które automat W TEJ KONFIGURACJI w ogóle może
    // postawić (`hexPhasePriority`, nie pełna `basePriority`). Przy `foodOnly` `tartak`
    // jest poza listą — wymaganie go dawało DEADLOCK: tartak nigdy nie powstaje, więc
    // `lesneMinSpelnione` nigdy nie jest spełnione, więc wyrąb rundy 3 znika całkowicie
    // (zmierzone: wyrąb 72 → 0 na wszystkich pięciu ziarnach, także przy jawnie włączonym
    // przełączniku R4-Q2 — czyli cichy regres mechanizmu, którego dispatch rundy 4 wprost
    // zabrania: „Zasada 1 zmienia PROGI budowy, nie usuwa mechanizmu wyrębu przy rzece").
    // Gdy `tartak` jest na liście (niedobór / profile nieobjęte Zasadą 1), bramka działa
    // dokładnie jak w rundzie 3.
    // R3, ABC-B=B (K2/K3): tartak powstaje WYŁĄCZNIE przy niedoborze drewna. Bez niego minimum leśne nie
    // jest wymaganiem (inaczej deadlock: tartak nigdy nie powstaje, więc wyrąb poza rzeką nigdy nie rusza).
    const tartakDozwolony = !demandActive || (resourceDeficitKeys ?? []).includes('drewno');
    const lesneWymagane: ImprovementKey[] = (['tartak', 'oboz_lowiecki'] as ImprovementKey[])
      .filter(k => tartakDozwolony && hexPhasePriority.includes(k))
      // ... i tak samo: wymagac wolno tylko tego, co jest ODBLOKOWANE. Bez tego warunku
      // AI bez technologii (`improvementTechs` puste — jedyny bezwarunkowo dostepny typ to
      // `wyrab`) czekaloby w nieskonczonosc na tartak/oboz, ktorych nie wolno mu zbudowac
      // (regres zlapany przez `tools/ai-improvements-test.cjs`, test 7).
      .filter(k => isImprovementTechUnlocked(k, unlockedTechs) && civGate(k, civArchetype));
    // `lesneMinSpelnione` bramkuje KAŻDY wyrąb, także ten na heksie z rzeką: dopóki miasto
    // nie ma swojego tartaku i obozu, topór stoi. Zmierzone (5 ziaren × 40 tur, AI CYWILIZACJI):
    // bez tej bramki tartak 10 i obóz 10, z bramką tartak 23 i obóz 24, kosztem 26 punktów
    // plonu żywności (3203 → 3177) i 14 wyrębów (85 → 71). Wybrano wariant z bramką, żeby nie
    // cofać wyniku rundy 2 („tartak 0 → 69") bardziej, niż wymaga tego decyzja „wycinać mimo to".
    const lesneMinSpelnione = lesneWymagane.every(k => {
      let have = 0;
      for (const { q, r } of radiusHexes) {
        if ((workingPlaced.get(`${q},${r}`) ?? []).includes(k)) have++;
        if (have >= lesneMin) return true;
      }
      return false;
    });
    // ABC-3=B (właściciel 2026-10-31): w etapie E5 (`offRiverClearing`) wycinka poza rzeką NIE zależy od
    // minimum leśnego ani od progu lasu w promieniu. Strażnik per heks (tartak/obóz stoi → heks nie idzie
    // pod topór) zostaje w warunku KROKU 0 poniżej.
    const wolnoKarczowacPozaRzeka = !riverForestClearingOnly
      && !rzekiDoZagospodarowania && (offRiverClearing || lesneMinSpelnione);

    // Bramki rodzaju ulepszenia na heksie, wspólne dla FAZY 1 i SONDY nadwyżki (ZASADA 3):
    //  • R-WEB-AUTOIMPROVE-PRIORITY-Q1 (E3, wiążąca specyfikacja właściciela): hodowla (bydło/owce/lama)
    //    TYLKO na heksach przy rzece — „Innych terenów nie rozpatrujemy” (ta sama funkcja dla gracza i AI);
    //  • etapy: irygacja po farmie na TYM heksie (wycinka→farma→trzoda→irygacja);
    //  • tartak/obóz: limit minimum leśnego `ceil(pop/10)` (reguła „1 na 10 obywateli”, ECHO 2026-08-27,
    //    ta sama co `lesneMin`) WYŁĄCZNIE w przebiegach K1/K2/K3 (`limitForestKeysToMinimum`); profile
    //    „surowce”/„infrastruktura” = zachowanie bazy 4d1916f2c (R2, zarzut FC nr 1). Pytanie ABC-B czeka.
    const keyBlockedOnHex = (key: ImprovementKey, hexKey: string): boolean => {
      if ((key === 'bydlo' || key === 'owce' || key === 'lama') && !riverHexKeys.has(hexKey)) return true;
      if (key === 'irygacja' && irrigationNeedsFarm && !(workingPlaced.get(hexKey) ?? []).includes('farma')) return true;
      // R3, ABC-B=B: w K2/K3 (`demandActive`) tartak tylko przy niedoborze drewna; obóz bez nowego tartaku
      // (wymóg tartaku na heksie egzekwuje `qualifies`, improvement-build.ts:641).
      if (key === 'tartak' && !tartakDozwolony) return true;
      if (limitForestKeysToMinimum && (key === 'tartak' || key === 'oboz_lowiecki')) {
        let haveForest = 0;
        for (const { q: rq, r: rr } of radiusHexes) {
          if ((workingPlaced.get(`${rq},${rr}`) ?? []).includes(key)) haveForest++;
        }
        if (haveForest >= lesneMin) return true;
      }
      return false;
    };

    // FAZA 1 — heks po heksie.
    for (const { q, r } of orderedHexes) {
      if (globalSpent >= effectiveCityCap || placedThisCity >= maxItemsPerCity || pracaLeft <= reserve) {
        cityBudgetExhausted = true;
        break;
      }
      const hexKey = `${q},${r}`;

      // KROK 0 heksa: wyrąb, gdy heks ma rzekę I las (bez lesneMin i progu lasu — patrz wyżej),
      // albo wyrąb poza rzeką (dalej z bramkami lesneMin i progu).
      if (
        riverKrok0Ok(q, r)
        || (
          wyrabWlaczony
          && (offRiverClearing || lesneMinSpelnione)
          && wolnoKarczowacPozaRzeka
          && !riverHexKeys.has(hexKey)
          && !scheduledWyrabHexes.has(hexKey)
          && map.hexes[hexKey]?.nakladka === Nakladka.Las
          && (offRiverClearing || forestLeftInRadius >= WYRAB_MIN_FOREST_IN_RADIUS)
          && !(workingPlaced.get(hexKey) ?? []).some(k => k === 'tartak' || k === 'oboz_lowiecki')
          // ZASADA 2: wyrąb NIE jest ulepszeniem złożowym — poza heksami z obywatelami stoi.
          && hexAllowsKey(q, r, 'wyrab')
        )
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
        // Q2=B/ABC-6=A: w etapie żywnościowym brak budżetu na NAJDROŻSZĄ kwalifikującą się pozycję
        // (irygacja 60) wstrzymuje tańsze — nie wolno im jej zjadać (starvation, zmierzone G1/G3).
        const budgetFail = meta.kosztPraca > pracaLeft
          || pracaLeft - meta.kosztPraca < reserve
          || globalSpent + meta.kosztPraca > effectiveCityCap;
        if (budgetFail && !reserveBudgetForMostExpensive) continue;
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
        // R-WEB-AUTOIMPROVE-PRIORITY-Q1 (Objaw A, zmierzone: gra/tools/wyrab-rzeka-krok0-test.cjs):
        // KROK 0 wycinki na heksie rzeka+las idzie PRZED tartakiem/obozem na tym heksie.
        // Bez tej bramki tartak+obóz wchodziły na heks rzeki w FAZIE 1 (FOREST_COEXIST),
        // a straznik KROKU 0 („nie ma tartaku/obozu na heksie") blokował wycinkę tam na zawsze.
        // Skutek zmierzony: heks rzeki zostaje lasem, a `rzekiDoZagospodarowania` = true
        // blokuje wycinkę lasów poza rzeką. Heks tylko wstrzymany dla tartak/oboz, gdy KROK 0
        // jest dopuszczony (ta sama reguła co w KROKU 0 minus bramek bez wpływu na kolejność).
        if ((key === 'tartak' || key === 'oboz_lowiecki') && riverKrok0Ok(q, r)) continue;
        // ZASADA 2: heks bez obywateli przechodzi tylko jako ZŁOŻE i tylko dla ulepszenia,
        // które to złoże konsumuje.
        if (!hexAllowsKey(q, r, key)) continue;
        // Wspólne bramki rodzaju ulepszenia na heksie (te same w SONDZIE nadwyżki, ZASADA 3).
        if (keyBlockedOnHex(key, hexKey)) continue;
        if (!qualifies(key, q, r)) continue;
        if (budgetFail) {
          budgetReservedForExpensive = true;
          break;
        }

        if (surplusReport) surplusReport.anyCandidate = true;
        picks.push({ ownerId, cityId: city.id, q, r, key, kosztPraca: meta.kosztPraca });
        pracaLeft -= meta.kosztPraca;
        globalSpent += meta.kosztPraca;
        placedThisCity++;
        const cur = workingPlaced.get(hexKey) ?? [];
        workingPlaced.set(hexKey, [...cur, key]);
      }
      if (budgetReservedForExpensive) {
        cityBudgetExhausted = true;
        break;
      }
      if (pracaLeft <= reserve) {
        cityBudgetExhausted = true;
        break;
      }
    }

    // FAZA 2 — `wyrab` na starych zasadach (po typie, pierwszy kwalifikujący się heks).
    // Zachowana 1:1 semantyka sprzed odwrócenia pętli, łącznie z progiem zachowania lasu.
    //
    // ZASADA 1 (runda 4): przy braku niedoboru ta faza NIE rusza. Wyrąb tutaj nie prowadzi
    // do żadnej farmy — to zbieranie Drewna „bo nic pilniejszego się nie kwalifikuje",
    // czyli budowa na zapas, której ECHO właściciela zabrania wprost. Wyrąb pod farmę przy
    // rzece żyje w KROKU 0 wyżej i tam zostaje niezależnie od niedoboru.
    if (
      !riverForestClearingOnly
      && !cityBudgetExhausted && !demandActive && !citySkipWyrab && basePriority.includes('wyrab')
    ) {
      const key: ImprovementKey = 'wyrab';
      const meta = getImprovementMeta(key);
      const techOk = isImprovementTechUnlocked(key, unlockedTechs) && civGate(key, civArchetype);
      if (meta && techOk && meta.kosztPraca <= pracaLeft && pracaLeft - meta.kosztPraca >= reserve) {
        const forestCount = radiusHexes.reduce((n, { q, r }) => {
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
              if (!hexAllowsKey(q, r, key)) continue;
              // RUNDA 4: ten sam straznik co w KROKU 0 — heks z tartakiem albo obozem
              // NIE idzie pod topor (wycinka skasowalaby ulepszenie stojace na lesie,
              // `stripImprovementsWhenForestRemoved`). W rundzie 3 FAZA 2 tego warunku
              // nie miala; przy `maxItemsPerCity: 1` prawie nigdy nie ruszala, wiec luka
              // nie ujawniala sie w pomiarze. Bramka tematu (test I) lapie ja teraz wprost.
              if ((workingPlaced.get(hexKey) ?? []).some(k => k === 'tartak' || k === 'oboz_lowiecki')) continue;
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

    // ---------------------------------------------------------------------
    // ZASADA 3 (runda 4) — SONDA KANDYDATÓW. Rusza WYŁĄCZNIE, gdy wołający poprosił
    // o raport nadwyżki I nic jeszcze nie znaleziono. „Nic nie postawiono" nie znaczy
    // jeszcze „nie ma czego stawiać" (mógł skończyć się budżet), więc pytanie o istnienie
    // kandydata zadajemy osobno, BEZ testów kosztu — dokładnie tymi samymi bramkami
    // (tech / cywilizacja / Zasada 2 / duplikat warstwy / `qualifies`), którymi rządzi się
    // FAZA 1. Sonda nie dodaje ani jednego picku.
    // ---------------------------------------------------------------------
    if (surplusReport && !surplusReport.anyCandidate) {
      for (const { q, r } of orderedHexes) {
        if (surplusReport.anyCandidate) break;
        const hexKey = `${q},${r}`;
        for (const key of hexPhasePriority) {
          if (!getImprovementMeta(key)) continue;
          if (!isImprovementTechUnlocked(key, unlockedTechs)) continue;
          if (!civGate(key, civArchetype)) continue;
          if ((workingPlaced.get(hexKey) ?? []).includes(key)) continue;
          if (!hexAllowsKey(q, r, key)) continue;
          if (keyBlockedOnHex(key, hexKey)) continue;
          if (!qualifies(key, q, r)) continue;
          surplusReport.anyCandidate = true;
          break;
        }
      }
    }
  }

  // ZASADA 3: nadwyżka = Zasada 1 aktywna, ZERO niedoboru surowca i ZERO kandydatów
  // „przy obywatelach". Wtedy budżet ulepszeń nie ma dziś czego kupić i wołający ma
  // podstawę, żeby przesunąć środki (AI CYWILIZACJI) albo powiadomić gracza (AI GRACZA).
  if (surplusReport) {
    surplusReport.surplus = surplusReport.demandActive
      && !surplusReport.deficitActive
      && !surplusReport.anyCandidate;
  }

  return picks;
}
