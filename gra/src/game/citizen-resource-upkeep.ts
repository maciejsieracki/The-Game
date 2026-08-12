/**
 * citizen-resource-upkeep.ts — R-ZUZYCIE-SUROWCOW-OBYWATELE (Maciej 2026-08-10, drenaż
 * realny doprecyzowany 2026-08-11, stawka zmniejszona 1,0→0,2 2026-08-12 — punkt 1 zgłoszenia
 * „DECYZJA: STAWKA 1→0,2", `dyspozycje/PYTANIA-OTWARTE.md`; stawka PRZYWRÓCONA 0,2→1,0
 * 2026-08-13 jako część `R-EKONOMIA-SUROWCE-SKALA-5X-Q1` — pełne przeskalowanie ekonomii
 * surowcowej ×5 eliminuje problem zaokrąglenia do zera przy stawce 0,2 u źródła, patrz
 * `dyspozycje/PYTANIA-OTWARTE.md` sekcja `R-EKONOMIA-SUROWCE-SKALA-5X-Q1`).
 *
 * Obywatele miast zużywają surowce budowlane per epoka (tabela: `data/citizen-resource-upkeep.json`),
 * ściągane z magazynu CENTRALNEGO imperium (suma City.surowce po wszystkich miastach ownera —
 * `ownerResourceStockAll`, `building-stock-cost.ts`), NIE z lokalnej produkcji/dostępności TEGO
 * miasta (ECHO Q1, `dyspozycje/PYTANIA-OTWARTE.md` 2026-08-10: „Wszystkie potrzebne surowce dla
 * mieszkańców są ściągane z magazynu. Wszystkie potrzebne surowce dla mieszkańców są ściągane z
 * magazynu — miasto nie musi mieć własnej Glinianki ani rzeki”). Kara aktywuje się od 1. tury
 * epoki (ECHO Q1), ale ponieważ dostępność jest civ-wide, a nie lokalna, nie generuje kary
 * niemożliwej-do-uniknięcia z powodu położenia jednego miasta.
 *
 * ⚠️ DWIE FUNKCJE, DWA RÓŻNE KONTRAKTY — nie mylić:
 *   • `resolveCitizenResourceCoverage()` — CZYSTY PODGLĄD, bez efektów ubocznych. Bramka binarna
 *     „magazyn > 0 → dostępny" (NIE liczy realnego zapotrzebowania 1:1 per obywatel, NIE
 *     odejmuje). Używana tam, gdzie liczy się tylko podgląd (np. UI podglądu miasta przed turą) —
 *     zostaje jako jest, celowo NIE zamieniona.
 *   • `computeCitizenResourceDrain()` — REALNY DRENAŻ (Maciej 2026-08-11; stawka zmniejszona
 *     2026-08-12, patrz niżej): stawka **0,2 sztuki surowca na 1 obywatela na turę**
 *     (`CITIZEN_UPKEEP_RATE_PER_CITIZEN`), per wymagany surowiec epoki. `required =
 *     Math.floor(population × 0,2)`, `drained = min(required, stock[key] ?? 0)` — magazyn NIGDY nie schodzi poniżej zera, przy
 *     niedoborze drenuje się ile jest, NIE blokuje się całkowicie. Zwraca też `deductions` —
 *     mapę do realnego odjęcia z magazynu przez wołającego. Kara nadal BINARNA (ECHO Q3=A,
 *     niezmieniona semantyka): „dostępny" = zapotrzebowanie pokryte W PEŁNI (`drained >= required`),
 *     „brakujący" = pokryte częściowo lub wcale — NIE skaluje się z wielkością niedoboru.
 *     ⚠️ PUŁAPKA WIELU MIAST TEGO SAMEGO OWNERA: wołający MUSI zsumować `population` WSZYSTKICH
 *     miast ownera i wywołać tę funkcję RAZ per owner per turę (potem zastosować IDENTYCZNY
 *     wynik do każdego miasta tego ownera) — wywołanie per miasto z osobna, każde z tym samym
 *     `empireStock` (sprzed odjęcia), wydrenowałoby ten sam magazyn wielokrotnie i pozwoliłoby
 *     kilku miastom razem zużyć więcej surowca, niż faktycznie jest w magazynie. Wzorzec
 *     poprawnego wywołania: `main.ts` `citizenUpkeepDrainForOwner()` (memoizacja per owner per
 *     turę, tak jak `makeOwnerEmpireStockResolver()`).
 *
 * ⚠️ ZAOKRĄGLENIE `required` W DÓŁ DO SZTUK CAŁKOWITYCH (Maciej 2026-08-12, decyzja świadoma,
 * nie luka): przy stawce 0,2 suma `population × 0,2` jest z reguły ułamkowa (np. 53 obywateli →
 * 10,6). Sprawdzono resztę silnika: `City.surowce` jest wszędzie indziej magazynowane i mutowane
 * w SZTUKACH CAŁKOWITYCH — `creditOwnerResourceStock(cities, ownerId, key, Math.floor(raw *
 * mult), cap)` w `turn-economy.ts` (kredytowanie magazynu z ułamkowego mnożnika terenu/bonusu) i
 * `computeTradeRouteResourceFlow()` w `trade-routes.ts` (jawny komentarz: „Math.floor — surowiec
 * liczy się w sztukach całkowitych, zgodnie z resztą City.surowce"). Dla SPÓJNOŚCI z tym wzorcem
 * `computeCitizenResourceDrain()` też floruje `required` w dół (`Math.floor`, NIE `Math.round`
 * ani `Math.ceil`) — ten sam kierunek zaokrąglenia co przy kredytowaniu magazynu, więc obywatele
 * nigdy nie są obciążani WIĘCEJ niż wynika z czystej stawki. Skutek przy małej populacji (przykład
 * Macieja: pop=1 → 1×0,2=0,2 → floor=0): zero zapotrzebowania, zero kary — nie błąd granulacji,
 * tylko naturalna konsekwencja trzymania magazynu w sztukach całkowitych przy niecałkowitej
 * stawce (ten sam mechanizm co przy każdym innym niecałkowitym dopływie surowca w tym silniku).
 * / EN: `required` is rounded DOWN to whole units (Math.floor, not round/ceil) — kept consistent
 * with the rest of the engine, which stores/mutates `City.surowce` exclusively in whole units
 * (see the same Math.floor pattern crediting territory yield in `turn-economy.ts` and the
 * explicit "whole units, consistent with the rest of City.surowce" comment in
 * `computeTradeRouteResourceFlow()`, `trade-routes.ts`). At a very small population (e.g. pop=1 →
 * 1×0.2=0.2) this floors to need=0 — zero demand, zero penalty; a deliberate consequence of
 * whole-unit storage at a fractional rate, not a granularity bug.
 *
 * AI (duża + Państwa-Miasta) objęte identycznie jak gracz (ECHO Q2=A) — funkcje tu są
 * ownerId-agnostyczne, ten sam wzorzec co `building-stock-cost.ts` (SUROW-CIV-01).
 *
 * / EN: citizens consume construction resources per era (table in
 * `data/citizen-resource-upkeep.json`), drawn from the empire-wide central stockpile (sum of
 * City.surowce across all of the owner's cities), never from this particular city's local
 * production or access.
 *
 * TWO FUNCTIONS, TWO DIFFERENT CONTRACTS: `resolveCitizenResourceCoverage()` is a PURE PREVIEW
 * (no side effects, binary "stock > 0 → available" gate, no real per-capita demand, no
 * deduction) — kept as-is for UI preview use elsewhere. `computeCitizenResourceDrain()` is the
 * REAL drain (rate: 0.2 units of resource per citizen per turn, reduced from 1.0 on 2026-08-12 —
 * `CITIZEN_UPKEEP_RATE_PER_CITIZEN`), `required = Math.floor(population × 0.2)`,
 * `drained = min(required, stock)`, never goes below zero, and returns a `deductions` map for
 * the caller to actually mutate the stockpile. The binary penalty is unchanged (ECHO Q3=A):
 * "available" means demand was FULLY covered, "missing" otherwise — still not scaled by the
 * size of the shortfall. CALLERS MUST sum `population` across ALL of an owner's cities and call
 * this function ONCE per owner per turn (then apply the identical result to every city of that
 * owner) — calling it once per city against the same pre-deduction stock would let several
 * cities of the same owner jointly over-drain the shared stockpile.
 *
 * AI (both the large AI and City-States) are covered by the exact same rule as the player — every
 * function here is ownerId-agnostic, mirroring `building-stock-cost.ts` (SUROW-CIV-01).
 *
 * Wzorzec bramki binarnej: `zloto-access.ts` (`ownerCanFeedMennica`/`resolveOwnerZlotoFromStock`).
 * Wzorzec realnego drenażu rozłożonego po miastach ownera: `building-stock-cost.ts`
 * (`deductBuildingStockCostAcrossCities` — bierze NAJPIERW z miast o największym zapasie).
 * Kanały kary: Szczęście → `HappinessBreakdownInput.citizenResourceHappinessDelta`
 * (`society-breakdown.ts`); Rozwój → `GrowthPercentInput.citizenResourceGrowthPct`
 * (`population-growth-v85.ts`).
 */
import citizenUpkeepTable from '../../data/citizen-resource-upkeep.json';

export interface CitizenUpkeepEraRow {
  epoka: number;
  nazwa: string;
  surowce: string[];
}

interface CitizenUpkeepKaraShape {
  szczescieZaDostepny?: number;
  szczescieZaBrakujacy?: number;
  rozwojPctZaBrakujacy?: number;
}

interface CitizenUpkeepTableShape {
  epoki: CitizenUpkeepEraRow[];
  _kara?: CitizenUpkeepKaraShape;
}

const TABLE = citizenUpkeepTable as unknown as CitizenUpkeepTableShape;
const ROWS: readonly CitizenUpkeepEraRow[] = TABLE.epoki ?? [];

/** Kary — data-driven z JSON (`_kara`), z bezpiecznym fallbackiem na wartości kanonu (2026-08-10). */
export const CITIZEN_UPKEEP_HAPPINESS_PER_AVAILABLE = TABLE._kara?.szczescieZaDostepny ?? 1;
export const CITIZEN_UPKEEP_HAPPINESS_PER_MISSING = TABLE._kara?.szczescieZaBrakujacy ?? -1;
export const CITIZEN_UPKEEP_GROWTH_PCT_PER_MISSING = TABLE._kara?.rozwojPctZaBrakujacy ?? -1;

/**
 * Stawka zużycia: sztuk surowca / 1 obywatela / turę, per wymagany surowiec epoki.
 * PRZYWRÓCONA **1,0** (Maciej 2026-08-13, `R-EKONOMIA-SUROWCE-SKALA-5X-Q1`, punkt 1 —
 * `dyspozycje/PYTANIA-OTWARTE.md`) — była **0,2** (Maciej 2026-08-12, „DECYZJA: STAWKA
 * 1→0,2"), przed tym **1,0** (Maciej 2026-08-11). Powrót do 1,0 jest częścią pełnego
 * przeskalowania ekonomii surowcowej ×5 (produkcja/koszty/utrzymanie/cap razem): przy
 * stawce 1,0 `floor(population × 1,0)` nigdy nie zeruje się dla populacji ≥ 1, co usuwa
 * problem zaokrąglenia-do-zera przy małych populacjach BEZ potrzeby osobnej premii —
 * zamiast obniżać stawkę (jak 2026-08-12), rozwiązaniem jest podniesienie granulacji
 * całej ekonomii surowcowej. Użycie: patrz `computeCitizenResourceDrain()` niżej (JSDoc
 * modułu ma pełne uzasadnienie zaokrąglenia `Math.floor(population × ta_stawka)`) oraz
 * `citizenUpkeepDisplayLines()` (panel UI — ta sama stawka, ten sam Math.floor, żeby liczba
 * wyświetlana graczowi zawsze zgadzała się z realnym drenażem silnika).
 * / EN: consumption rate — units of resource per 1 citizen per turn, per resource required by
 * the era. RESTORED to 1.0 (2026-08-13, R-EKONOMIA-SUROWCE-SKALA-5X-Q1) as part of the full
 * ×5 resource-economy rescale — at rate 1.0, `floor(population × 1.0)` never floors to zero
 * for population ≥ 1, which fixes the zero-rounding problem at small populations without a
 * separate bonus branch. Also used by `citizenUpkeepDisplayLines()` (UI panel) so the
 * displayed number always matches the real engine drain.
 */
export const CITIZEN_UPKEEP_RATE_PER_CITIZEN = 1.0;

/**
 * Lista surowców wymaganych przez obywateli w danej epoce (kumulatywna — tabela JSON już
 * niesie pełną listę per epoka, nie trzeba scalać wierszy). `era` < 1 lub bez wpisu →
 * najbliższa zdefiniowana epoka ≤ `era` (a jeśli nie ma żadnej ≤ `era`, pierwsza dostępna).
 */
export function citizenRequiredResourcesForEra(era: number): readonly string[] {
  const first = ROWS[0];
  if (!first) return [];
  const e = Number.isFinite(era) ? Math.max(1, Math.floor(era)) : 1;
  const exact = ROWS.find(r => r.epoka === e);
  if (exact) return exact.surowce;
  const below = [...ROWS].filter(r => r.epoka <= e).sort((a, b) => b.epoka - a.epoka)[0];
  return (below ?? first).surowce;
}

export interface CitizenUpkeepCoverage {
  /** Surowce wymagane w tej epoce (z tabeli, kumulatywne). */
  required: readonly string[];
  /** Surowce spośród `required`, których magazyn centralny imperium ma > 0. */
  available: readonly string[];
  /** Surowce spośród `required`, których magazyn centralny imperium NIE ma (0 lub brak wpisu). */
  missing: readonly string[];
  /** Suma modyfikatora Szczęścia (+1/dostępny, -1/brakujący — data-driven, per miasto). */
  happinessDelta: number;
  /** Suma modyfikatora Rozwoju w punktach % (-1%/brakujący — data-driven, per miasto). */
  growthPctDelta: number;
}

/**
 * Rozstrzyga pokrycie zużycia surowców przez obywateli danego miasta w danej epoce, wg
 * magazynu CENTRALNEGO imperium (nie lokalnego City.surowce tego miasta — ECHO Q1).
 *
 * `empireStock` = `ownerResourceStockAll(cities, ownerId)` (`building-stock-cost.ts`) — TEN SAM
 * magazyn dla każdego miasta danego ownera; wołający powinien liczyć go RAZ per owner per turę
 * (np. `makeOwnerEmpireStockResolver()` w `main.ts`), nie per miasto.
 *
 * ⚠️ To PODGLĄD (patrz JSDoc modułu) — bramka binarna „magazyn > 0", NIE realny drenaż 1:1
 * per obywatel. Do realnego zużycia magazynu użyj `computeCitizenResourceDrain()`.
 *
 * Pure — bez mutacji wejść, bez DOM.
 */
export function resolveCitizenResourceCoverage(
  era: number,
  empireStock: Readonly<Record<string, number>> | null | undefined,
): CitizenUpkeepCoverage {
  const required = citizenRequiredResourcesForEra(era);
  const stock = empireStock ?? {};
  const available: string[] = [];
  const missing: string[] = [];
  for (const key of required) {
    const have = stock[key];
    if (typeof have === 'number' && Number.isFinite(have) && have > 0) {
      available.push(key);
    } else {
      missing.push(key);
    }
  }
  const happinessDelta =
    available.length * CITIZEN_UPKEEP_HAPPINESS_PER_AVAILABLE
    + missing.length * CITIZEN_UPKEEP_HAPPINESS_PER_MISSING;
  const growthPctDelta = missing.length * CITIZEN_UPKEEP_GROWTH_PCT_PER_MISSING;
  return { required, available, missing, happinessDelta, growthPctDelta };
}

/** Wynik `computeCitizenResourceDrain()` — pokrycie (jak `CitizenUpkeepCoverage`) + mapa do realnego odjęcia. */
export interface CitizenResourceDrainResult extends CitizenUpkeepCoverage {
  /**
   * Ile realnie odjąć z magazynu centralnego, per surowiec (tylko klucze > 0). Wołający
   * (main.ts) mutuje faktyczny stan `City.surowce` tym `deductions`, np. przez
   * `deductBuildingStockCostAcrossCities(cities, ownerId, deductions)`
   * (`building-stock-cost.ts`) — ta funkcja sama rozkłada odjęcie po miastach ownera.
   */
  deductions: Record<string, number>;
}

/**
 * Realny drenaż magazynu centralnego imperium przez obywateli (Maciej 2026-08-11; stawka
 * zmniejszona 2026-08-12, „DECYZJA: STAWKA 1→0,2", punkt 1): stawka
 * **`CITIZEN_UPKEEP_RATE_PER_CITIZEN` (0,2 sztuki surowca na 1 obywatela na turę)**, per
 * wymagany surowiec danej epoki.
 *
 * `population` MUSI być sumą populacji WSZYSTKICH miast ownera (nie populacją jednego miasta z
 * osobna) — patrz ostrzeżenie w JSDoc modułu o wielu miastach tego samego ownera. `required =
 * Math.floor(population × CITIZEN_UPKEEP_RATE_PER_CITIZEN)` — zaokrąglone W DÓŁ do sztuk
 * całkowitych, SPÓJNIE z resztą silnika (`City.surowce` magazynowane wyłącznie w sztukach
 * całkowitych — patrz `⚠️ ZAOKRĄGLENIE...` w JSDoc modułu na górze pliku, precedensy
 * `turn-economy.ts`/`trade-routes.ts`); `drained = min(required, stock[key] ?? 0)` (nigdy
 * poniżej zera). Kara nadal binarna (ECHO Q3=A): „dostępny" = `drained >= required` (pełne
 * pokrycie), „brakujący" w przeciwnym razie — identyczna semantyka kar co
 * `resolveCitizenResourceCoverage`
 * (`CITIZEN_UPKEEP_HAPPINESS_PER_AVAILABLE/MISSING`, `CITIZEN_UPKEEP_GROWTH_PCT_PER_MISSING`).
 *
 * Pure — NIE mutuje `empireStock` ani niczego innego; zwraca `deductions` do zastosowania przez
 * wołającego. Ujemna/niefinitna `population` traktowana jak 0 (brak zapotrzebowania — zawsze
 * "dostępny", zero-regresja na dane śmieciowe).
 */
export function computeCitizenResourceDrain(
  era: number,
  population: number,
  empireStock: Readonly<Record<string, number>> | null | undefined,
): CitizenResourceDrainResult {
  const required = citizenRequiredResourcesForEra(era);
  const stock = empireStock ?? {};
  const pop = Number.isFinite(population) && population > 0 ? Math.floor(population) : 0;
  const available: string[] = [];
  const missing: string[] = [];
  const deductions: Record<string, number> = {};
  for (const key of required) {
    // Math.floor: sztuki całkowite, SPÓJNIE z resztą City.surowce (patrz JSDoc modułu i funkcji
    // powyżej -- precedens creditOwnerResourceStock(..., Math.floor(raw*mult), ...) w
    // turn-economy.ts oraz computeTradeRouteResourceFlow() w trade-routes.ts).
    // / EN: Math.floor -- whole units, consistent with the rest of City.surowce (see module and
    // function JSDoc above; same precedent as turn-economy.ts / trade-routes.ts).
    const need = Math.floor(pop * CITIZEN_UPKEEP_RATE_PER_CITIZEN);
    const haveRaw = stock[key];
    const have = typeof haveRaw === 'number' && Number.isFinite(haveRaw) && haveRaw > 0 ? haveRaw : 0;
    const drained = Math.min(need, have);
    if (drained > 0) deductions[key] = drained;
    if (drained >= need) {
      available.push(key);
    } else {
      missing.push(key);
    }
  }
  const happinessDelta =
    available.length * CITIZEN_UPKEEP_HAPPINESS_PER_AVAILABLE
    + missing.length * CITIZEN_UPKEEP_HAPPINESS_PER_MISSING;
  const growthPctDelta = missing.length * CITIZEN_UPKEEP_GROWTH_PCT_PER_MISSING;
  return { required, available, missing, happinessDelta, growthPctDelta, deductions };
}

/** Jeden wiersz do wyświetlenia w panelu miasta — jeden surowiec, łączna ilość dla TEGO miasta. */
export interface CitizenUpkeepDisplayLine {
  /** Klucz surowca (np. „drewno") — etykieta czytelna dla gracza dobierana przez UI. */
  key: string;
  /**
   * Łączne zużycie tego surowca przez WSZYSTKICH obywateli TEGO miasta na turę
   * (`Math.floor(cityPopulation × CITIZEN_UPKEEP_RATE_PER_CITIZEN)`), NIE stawka per capita. Znak koduje
   * WYŁĄCZNIE kolor UI (dodatni = pokryty w pełni, ujemny = niedobór) — wartość bezwzględna to
   * zawsze łączne zapotrzebowanie tego miasta, niezależnie od statusu pokrycia.
   */
  value: number;
  /** Pokrycie wg werdyktu silnika (`coverage.available`/`coverage.missing`) — bez zmian, tylko liczba obok jest przeliczona dla tego miasta. */
  available: boolean;
}

/**
 * P-PORZADEK-PANEL-CZYTELNOSC-ROZBICIE (Maciej 2026-08-12): buduje wiersze do bloku
 * „Zaopatrzenie obywateli" w panelu miasta — dla KAŻDEGO surowca z `coverage.required` łączną
 * ilość zużywaną przez obywateli PRZEKAZANEGO miasta (`cityPopulation × stawka`), nie stawkę
 * per capita (poprzedni błąd: panel pokazywał zawsze ±1, czyli samą stawkę kary Szczęścia, nie
 * ilość surowca). `coverage` może być liczone dla innej populacji (np. całego imperium ownera —
 * patrz JSDoc modułu) — to WERDYKT SILNIKA używany WYŁĄCZNIE do statusu available/missing
 * (kolor), sama WIELKOŚĆ liczby jest tu przeliczana lokalnie dla `cityPopulation`. Kolejność
 * wierszy: dostępne (w kolejności `coverage.available`), potem brakujące (w kolejności
 * `coverage.missing`) — identycznie jak dotychczasowe grupowanie w panelu (dostępne na górze).
 * Pure — bez DOM, bez mutacji wejść.
 *
 * ⚠️ ZNANY ROZJAZD PANEL vs SILNIK (Evaluator, przegląd 1208eb6c, ŚWIADOMIE NIENAPRAWIONY —
 * zmiana wymagałaby decyzji właściciela, patrz niżej): `computeCitizenResourceDrain()` floruje
 * RAZ na SUMIE populacji WSZYSTKICH miast ownera (`floor(Σ_miasta population × stawka)`), ale ta
 * funkcja floruje OSOBNO PER MIASTO i wywołująca strona (panel) sumuje wizualnie wiersz po
 * wierszu (`Σ floor(cityPopulation_i × stawka)`) — matematycznie `Σfloor ≤ floor(Σ)`, więc przy
 * >1 mieście tego samego ownera suma liczb pokazywanych graczowi na osobnych kartach miast może
 * wyjść MNIEJSZA niż to, co silnik realnie drenuje z magazynu (np. 3 miasta po 4 obywateli:
 * panel pokazuje floor(4×0,2)=0 na każdej z 3 kart, razem 0, silnik realnie drenuje
 * floor(12×0,2)=2). Świadomie NIE naprawione tutaj: docelowa naprawa („panel MUSI czytać werdykt
 * silnika, nie przeliczać osobno" — zasada już egzekwowana w `resource-usage-breakdown.ts`)
 * wymagałaby albo (a) pokazywania tej samej wartości EMPIRE-WIDE identycznie na KAŻDEJ karcie
 * miasta tego ownera (zamiana semantyki „ile zużywa TO miasto" na „ile zużywa CAŁE imperium
 * ownera" — realna zmiana tego, co widzi gracz), albo (b) wymyślenia nowego algorytmu
 * podziału sprawiedliwego jednej empire-wide liczby pomiędzy miasta, którego silnik dziś NIE
 * liczy i nigdzie nie definiuje. Obie opcje to decyzja produktowa/UX, nie techniczna, i obie
 * odwracałyby JUŻ PODJĘTĄ i przypiętą testem decyzję (P-PORZADEK-PANEL-CZYTELNOSC-ROZBICIE,
 * `porzadek-panel-czytelnosc-test.cjs` sekcja A: „wartość = ±Math.floor(populacja_MIASTA ×
 * 0,2)"). Kolor dostępny/brakujący (jedyny kanał, który realnie wpływa na Szczęście/Rozwój)
 * POZOSTAJE poprawny — to WERDYKT SILNIKA per-owner (binarny, nie liczbowy), rozjazd dotyczy
 * WYŁĄCZNIE wyświetlanej liczby sztuk, kosmetyczny, nie wpływa na żadną mechanikę gry.
 * / EN: KNOWN PANEL vs ENGINE DISCREPANCY (deliberately left unfixed — would need an owner
 * product decision): the engine floors ONCE on the SUM of an owner's cities' population; this
 * function floors PER CITY and the caller sums the displayed rows — mathematically
 * `Σfloor ≤ floor(Σ)`, so with >1 city of the same owner the numbers shown across separate city
 * cards can sum to LESS than what the engine actually drains. Not fixed here because the fix
 * would either show the same empire-wide number identically on every city card (a real change to
 * what the player sees) or invent a fair-share split algorithm the engine does not define —
 * both would reverse an already-locked, test-pinned decision. Cosmetic only: the
 * available/missing color (the only channel feeding Happiness/Growth) is unaffected — it is
 * still the engine's per-owner binary verdict.
 */
export function citizenUpkeepDisplayLines(
  coverage: Pick<CitizenUpkeepCoverage, 'available' | 'missing'>,
  cityPopulation: number,
): CitizenUpkeepDisplayLine[] {
  const pop = Number.isFinite(cityPopulation) && cityPopulation > 0 ? Math.floor(cityPopulation) : 0;
  // Math.floor: sztuki całkowite, ta sama zasada co computeCitizenResourceDrain() powyżej --
  // liczba wyświetlana graczowi musi się zgadzać z realnym drenażem silnika.
  const qty = Math.floor(pop * CITIZEN_UPKEEP_RATE_PER_CITIZEN);
  return [
    ...coverage.available.map((key) => ({ key, value: qty, available: true })),
    ...coverage.missing.map((key) => ({ key, value: -qty, available: false })),
  ];
}
