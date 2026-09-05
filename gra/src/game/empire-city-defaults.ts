/**
 * empire-city-defaults.ts — R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE=A (Maciej 2026-08-09).
 * Runda 2 (naprawa B2+B3 z Evaluator RUNDA 1: FAIL, patrz dyspozycje/PYTANIA-OTWARTE.md).
 *
 * Rozszerza wzorzec „globalne domyślne imperium + opcjonalny override lokalny",
 * już istniejący dla Daniny/Handlu (empire-handel-split.ts), na TRZY kolejne pola:
 *   1. Podział Pracy (budynki/skarbiec)  — City.podzialPracy + podzialPracyOverride.
 *   2. Priorytet Praca/Żywność (okolica) — City.okolicaFocus + okolicaFocusOverride.
 *   3. Priorytet produkcji (budowa)      — City.budowaFocus/budowaTryb + budowaFocusOverride.
 *
 * Podział Pracy odtwarza DOKŁADNIE architekturę Handlu: pole City.podzialPracy jest
 * "prawdziwie opcjonalne" i rozwiązywane DOPIERO przy odczycie (resolveCityPodzialPracy),
 * dokładnie tak jak resolveCityPodzialHandlu. Jedyny seam odczytu to turn-economy.ts.
 *
 * okolicaFocus i budowaFocus/budowaTryb różnią się architektonicznie: te pola są dziś
 * ZAWSZE konkretnie wypełnione na City (ensureCitySaveDefaults) i czytane BEZPOŚREDNIO
 * w kilkunastu czystych funkcjach (okolica.ts, auto-manage.ts, ai.ts) bez żadnego seamu
 * pośredniczącego. Przepięcie wszystkich tych odczytów na resolver-przy-odczycie byłoby
 * nieproporcjonalnie inwazyjne. Zamiast tego: ownerDefault Map zostaje ŹRÓDŁEM PRAWDY,
 * a City.<pole> jest utrzymywane jako zsynchronizowany cache dla miast BEZ override —
 * każda zmiana globalnej wartości natychmiast nadpisuje (broadcast) pole na wszystkich
 * miastach ownera bez override (broadcastOkolicaFocusToOwnerCities /
 * broadcastBudowaProfilToOwnerCities, main.ts). Miasta Z override trzymają WŁASNĄ
 * wartość i NIGDY nie są dotykane przez broadcast (M6 — mutacja przeżyła w rundzie 1,
 * broadcastBudowaProfilToOwnerCities MUSI pomijać override=true; patrz test
 * "M6: broadcast pomija miasto z override=true" w empire-city-defaults-test.cjs).
 *
 * budowaFocus/budowaTryb: zakres CELOWO ograniczony do tych dwóch pól (dosłowne
 * brzmienie zlecenia) -- NIE obejmuje budowaPriorytetTypow (pełna, uporządkowana lista
 * priorytetów trybu 'priorytet') ani budowaLista (konkretne budynki trybu 'lista', z
 * natury per-miasto). B1 (rozszerzenie globalnego mechanizmu o budowaPriorytetTypow)
 * jest CELOWO POZA zakresem rundy 2 — czeka na osobną decyzję ABC Macieja
 * (dyspozycje/PYTANIA-OTWARTE.md, "R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE — Evaluator
 * RUNDA 1: FAIL"). NIE zgadywać rozwiązania B1 tutaj.
 *
 * Migracja starych zapisów (B3, M7/M8 — mutacje przeżyły w rundzie 1): stary zapis może
 * mieć RÓŻNE wartości okolicaFocus/budowaFocus+budowaTryb między miastami tego samego
 * ownera (bo pole było dotąd czysto per-miasto). Global default przy migracji jest
 * wyliczany z PIERWSZEGO miasta ownera w tablicy (heurystyka — akceptowalna, patrz
 * dyspozycje) — ale KAŻDE miasto, którego wartość RÓŻNI SIĘ od tego defaultu, MUSI
 * dostać override=true i ZACHOWAĆ swoją starą, indywidualną wartość. Cichcem nadpisanie
 * (utrata danych gracza) jest zakazane — patrz testy "M7"/"M8" w
 * empire-city-defaults-test.cjs.
 */
import type { City, CityPodzialPracy, OkolicaFocus, BudowaFocus, BudowaTryb } from './cities';
import {
  DEFAULT_PODZIAL_PRACY,
  clampPodzialPracyBudynkiPercent,
  DEFAULT_OKOLICA_FOCUS,
  DEFAULT_BUDOWA_FOCUS,
  DEFAULT_BUDOWA_TRYB,
} from './cities';
import { DEFAULT_POZIOM_RACJI, type PoziomRacji } from './population-growth-v85';

// ---------------------------------------------------------------------------
// 1. Podział Pracy (budynki / skarbiec) — resolver-przy-odczycie, wzorem Handlu.
// ---------------------------------------------------------------------------

export function podzialPracyEqual(a: CityPodzialPracy, b: CityPodzialPracy): boolean {
  return clampPodzialPracyBudynkiPercent(a.procentBudynki)
    === clampPodzialPracyBudynkiPercent(b.procentBudynki);
}

function normalizePodzialPracy(split: CityPodzialPracy): CityPodzialPracy {
  return { procentBudynki: clampPodzialPracyBudynkiPercent(split.procentBudynki) };
}

/** Efektywny podział Pracy dla miasta: override lokalny lub domyślny imperium. */
export function resolveCityPodzialPracy(
  city: Pick<City, 'podzialPracy' | 'podzialPracyOverride' | 'ownerId'>,
  ownerDefault: CityPodzialPracy | undefined,
  paramsFallback?: CityPodzialPracy,
): CityPodzialPracy {
  if (city.podzialPracyOverride && city.podzialPracy) {
    return normalizePodzialPracy(city.podzialPracy);
  }
  if (ownerDefault) {
    return normalizePodzialPracy(ownerDefault);
  }
  if (city.podzialPracy) {
    return normalizePodzialPracy(city.podzialPracy);
  }
  return normalizePodzialPracy(paramsFallback ?? DEFAULT_PODZIAL_PRACY);
}

/**
 * R-PRACA-JEDEN-PODZIAL-Q1 pkt 5 — ZASADA OVERRIDE MIASTA (czysta, testowalna).
 *
 * Suwak miasta NIE jest zablokowany. Ustawia LOKALNA wartosc podzialu; w chwili gdy ta
 * wartosc rozni sie od globalnej domyslnej imperium, „Indywidualne" zapala sie SAMO —
 * bez osobnego klikniecia. Powrot do wartosci globalnej gasi override i miasto znow
 * sledzi globalna (pole `podzialPracy` jest usuwane, wiec pozniejsza zmiana globalna
 * automatycznie obejmuje to miasto).
 *
 * PRZED tym tematem suwak miasta BEZ override zmienial wartosc GLOBALNA, wszystkim
 * miastom naraz — gracz nie mial jak ustawic jednego miasta bez uprzedniego klikniecia
 * „Indywidualne".
 *
 * Zwraca opis docelowego stanu miasta; nie mutuje wejscia.
 */
export interface PodzialPracyLocalChange {
  /** Wartosc lokalna do zapisania; `undefined` = skasuj pole (miasto sledzi globalna). */
  podzialPracy: CityPodzialPracy | undefined;
  /** Docelowy stan pinu „Indywidualne". */
  podzialPracyOverride: boolean;
}

export function applyPodzialPracyLocalChange(
  procentBudynkiRaw: number | undefined | null,
  ownerDefault: CityPodzialPracy | undefined,
): PodzialPracyLocalChange {
  const procentBudynki = clampPodzialPracyBudynkiPercent(procentBudynkiRaw);
  const globalny = clampPodzialPracyBudynkiPercent(
    ownerDefault?.procentBudynki ?? DEFAULT_PODZIAL_PRACY.procentBudynki,
  );
  if (procentBudynki === globalny) {
    return { podzialPracy: undefined, podzialPracyOverride: false };
  }
  return { podzialPracy: { procentBudynki }, podzialPracyOverride: true };
}

/** Migracja starych zapisów (per-miasto bez globalnego) → global + flagi override. */
export function migratePodzialPracyOnLoad(
  cities: ReadonlyArray<City>,
  ownerDefaults: Map<number, CityPodzialPracy>,
  savedDefaults: ReadonlyArray<[number, CityPodzialPracy]> | undefined,
): void {
  if (savedDefaults?.length) {
    for (const [oid, split] of savedDefaults) {
      ownerDefaults.set(oid, normalizePodzialPracy(split));
    }
  } else {
    for (const city of cities) {
      if (!ownerDefaults.has(city.ownerId)) {
        ownerDefaults.set(city.ownerId, normalizePodzialPracy(
          city.podzialPracy ?? DEFAULT_PODZIAL_PRACY,
        ));
      }
    }
    for (const city of cities) {
      if (city.podzialPracyOverride !== undefined) continue;
      const def = ownerDefaults.get(city.ownerId) ?? DEFAULT_PODZIAL_PRACY;
      if (!city.podzialPracy) {
        city.podzialPracyOverride = false;
        continue;
      }
      city.podzialPracy = normalizePodzialPracy(city.podzialPracy);
      const differs = !podzialPracyEqual(city.podzialPracy, def);
      city.podzialPracyOverride = differs;
      if (!differs) {
        delete city.podzialPracy;
      }
    }
  }
  // P-PRACA-CAP-MIGRACJA-LUKA-Q1: cap „ulepszenia ≤ 50%" (czyli budynki ≥ 50%,
  // MIN_PODZIAL_PRACY_BUDYNKI_PERCENT) MUSI obowiązywać po KAŻDEJ ścieżce wczytania,
  // bez wyjątku. Do tej pory ta funkcja zostawiała `city.podzialPracy` nieprzyciętym
  // w DWÓCH przypadkach:
  //   (1) gałąź `savedDefaults?.length` (nowoczesny zapis niosący własne domyślne
  //       imperium) normalizowała WYŁĄCZNIE `ownerDefaults` — pętla po miastach niżej
  //       żyje w gałęzi `else`, więc dla takiego zapisu nie wykonywała się wcale;
  //   (2) `if (city.podzialPracyOverride !== undefined) continue;` — miasto z już
  //       ustawioną flagą override było pomijane razem z normalizacją.
  // Dziś nie powodowało to błędu widocznego dla gracza tylko dlatego, że na ścieżce
  // load `ensureCitySaveDefaults()` (main.ts) biegnie WCZEŚNIEJ i przycina te same
  // pola, a `resolveCityPodzialPracy()` normalizuje jeszcze raz przy każdym odczycie.
  // To jest maskowanie przez kolejność wywołań, nie gwarancja — dokładnie ta klasa
  // kruchości, która w tym obszarze wracała już jako REGRES2/REGRES3. Jedna
  // bezwarunkowa pętla zamyka obie luki niezależnie od kolejności i od gałęzi.
  for (const city of cities) {
    if (city.podzialPracy) {
      city.podzialPracy = normalizePodzialPracy(city.podzialPracy);
    }
  }
  for (const city of cities) {
    if (!ownerDefaults.has(city.ownerId)) {
      ownerDefaults.set(city.ownerId, normalizePodzialPracy(DEFAULT_PODZIAL_PRACY));
    }
  }
}

export function freshOwnerDefaultPodzialPracy(): CityPodzialPracy {
  return { ...DEFAULT_PODZIAL_PRACY };
}

// ---------------------------------------------------------------------------
// 2. Priorytet Praca/Żywność (okolicaFocus) — global Map = źródło prawdy,
//    City.okolicaFocus = cache zsynchronizowany broadcastem (patrz nagłówek pliku).
// ---------------------------------------------------------------------------

/** Efektywny okolicaFocus (do UI / diagnostyki — main.ts trzyma city.okolicaFocus w sync). */
export function resolveCityOkolicaFocus(
  city: Pick<City, 'okolicaFocus' | 'okolicaFocusOverride'>,
  ownerDefault: OkolicaFocus | undefined,
): OkolicaFocus {
  if (city.okolicaFocusOverride && city.okolicaFocus) {
    return city.okolicaFocus;
  }
  return ownerDefault ?? city.okolicaFocus ?? DEFAULT_OKOLICA_FOCUS;
}

/**
 * Nadpisuje okolicaFocus wszystkich miast ownera BEZ override (broadcast globalnej
 * zmiany). Miasta z okolicaFocusOverride===true SĄ POMIJANE (pin 📌) — M6-analog dla
 * Okolicy; broadcastBudowaProfilToOwnerCities niżej ma identyczny wzorzec dla Budowy.
 */
export function broadcastOkolicaFocusToOwnerCities(
  cities: ReadonlyArray<City>,
  ownerId: number,
  focus: OkolicaFocus,
): void {
  for (const c of cities) {
    if (c.ownerId !== ownerId || c.okolicaFocusOverride) continue;
    c.okolicaFocus = focus;
  }
}

/** Migracja starych zapisów (okolicaFocus zawsze per-miasto) → global + flagi override. */
export function migrateOkolicaFocusOnLoad(
  cities: ReadonlyArray<City>,
  ownerDefaults: Map<number, OkolicaFocus>,
  savedDefaults: ReadonlyArray<[number, OkolicaFocus]> | undefined,
): void {
  if (savedDefaults?.length) {
    for (const [oid, focus] of savedDefaults) ownerDefaults.set(oid, focus);
  } else {
    // Default = wartość PIERWSZEGO miasta danego ownera napotkanego w tablicy
    // (heurystyka, patrz nagłówek pliku) — ownerDefaults.has() strzeże, by kolejne
    // miasta tego samego ownera NIE nadpisały już ustalonego defaultu.
    for (const city of cities) {
      if (!ownerDefaults.has(city.ownerId)) {
        ownerDefaults.set(city.ownerId, city.okolicaFocus ?? DEFAULT_OKOLICA_FOCUS);
      }
    }
    // KAŻDE miasto różniące się od tak wyliczonego defaultu dostaje override=true
    // i ZACHOWUJE swoją starą wartość (M7 — zakaz cichego nadpisania).
    for (const city of cities) {
      if (city.okolicaFocusOverride !== undefined) continue;
      const def = ownerDefaults.get(city.ownerId) ?? DEFAULT_OKOLICA_FOCUS;
      const differs = !!city.okolicaFocus && city.okolicaFocus !== def;
      city.okolicaFocusOverride = differs;
      if (!differs) city.okolicaFocus = def;
    }
  }
  for (const city of cities) {
    if (!ownerDefaults.has(city.ownerId)) ownerDefaults.set(city.ownerId, DEFAULT_OKOLICA_FOCUS);
  }
}

export function freshOwnerDefaultOkolicaFocus(): OkolicaFocus {
  return DEFAULT_OKOLICA_FOCUS;
}

// ---------------------------------------------------------------------------
// 3. Priorytet produkcji (budowaFocus + budowaTryb, PARA) — global Map = źródło
//    prawdy, City.budowaFocus/budowaTryb = cache zsynchronizowany broadcastem.
//    Świadomie NIE obejmuje budowaPriorytetTypow/budowaLista (patrz nagłówek pliku).
//    B1 (budowaPriorytetTypow) CELOWO POZA zakresem — patrz nagłówek pliku.
// ---------------------------------------------------------------------------

export interface CityBudowaProfil {
  budowaFocus: BudowaFocus;
  budowaTryb: BudowaTryb;
}

export function budowaProfilEqual(a: CityBudowaProfil, b: CityBudowaProfil): boolean {
  return a.budowaFocus === b.budowaFocus && a.budowaTryb === b.budowaTryb;
}

export function resolveCityBudowaProfil(
  city: Pick<City, 'budowaFocus' | 'budowaTryb' | 'budowaFocusOverride'>,
  ownerDefault: CityBudowaProfil | undefined,
): CityBudowaProfil {
  if (city.budowaFocusOverride && city.budowaFocus && city.budowaTryb) {
    return { budowaFocus: city.budowaFocus, budowaTryb: city.budowaTryb };
  }
  if (ownerDefault) return ownerDefault;
  return {
    budowaFocus: city.budowaFocus ?? DEFAULT_BUDOWA_FOCUS,
    budowaTryb: city.budowaTryb ?? DEFAULT_BUDOWA_TRYB,
  };
}

/**
 * Nadpisuje budowaFocus/budowaTryb wszystkich miast ownera BEZ override (broadcast).
 * Miasta z budowaFocusOverride===true SĄ POMIJANE — pin 📌 NIE może zostać złamany
 * przez broadcast globalnej zmiany (M6, Evaluator RUNDA 1: mutacja usuwająca ten
 * warunek przeżyła próbę testów — patrz test "M6" w empire-city-defaults-test.cjs).
 */
export function broadcastBudowaProfilToOwnerCities(
  cities: ReadonlyArray<City>,
  ownerId: number,
  profil: CityBudowaProfil,
): void {
  for (const c of cities) {
    if (c.ownerId !== ownerId || c.budowaFocusOverride) continue;
    c.budowaFocus = profil.budowaFocus;
    c.budowaTryb = profil.budowaTryb;
  }
}

/** Migracja starych zapisów (budowaFocus/Tryb zawsze per-miasto) → global + override. */
export function migrateBudowaProfilOnLoad(
  cities: ReadonlyArray<City>,
  ownerDefaults: Map<number, CityBudowaProfil>,
  savedDefaults: ReadonlyArray<[number, CityBudowaProfil]> | undefined,
): void {
  if (savedDefaults?.length) {
    for (const [oid, profil] of savedDefaults) ownerDefaults.set(oid, { ...profil });
  } else {
    for (const city of cities) {
      if (!ownerDefaults.has(city.ownerId)) {
        ownerDefaults.set(city.ownerId, {
          budowaFocus: city.budowaFocus ?? DEFAULT_BUDOWA_FOCUS,
          budowaTryb: city.budowaTryb ?? DEFAULT_BUDOWA_TRYB,
        });
      }
    }
    // KAŻDE miasto różniące się od tak wyliczonego defaultu dostaje override=true
    // i ZACHOWUJE swoją starą parę (budowaFocus, budowaTryb) — M8, zakaz cichego
    // nadpisania (analogiczny do M7 dla okolicaFocus wyżej).
    for (const city of cities) {
      if (city.budowaFocusOverride !== undefined) continue;
      const def = ownerDefaults.get(city.ownerId) ?? freshOwnerDefaultBudowaProfil();
      if (!city.budowaFocus || !city.budowaTryb) {
        city.budowaFocusOverride = false;
        continue;
      }
      const differs = !budowaProfilEqual({ budowaFocus: city.budowaFocus, budowaTryb: city.budowaTryb }, def);
      city.budowaFocusOverride = differs;
      if (!differs) {
        city.budowaFocus = def.budowaFocus;
        city.budowaTryb = def.budowaTryb;
      }
    }
  }
  for (const city of cities) {
    if (!ownerDefaults.has(city.ownerId)) ownerDefaults.set(city.ownerId, freshOwnerDefaultBudowaProfil());
  }
}

export function freshOwnerDefaultBudowaProfil(): CityBudowaProfil {
  return { budowaFocus: DEFAULT_BUDOWA_FOCUS, budowaTryb: DEFAULT_BUDOWA_TRYB };
}

/**
 * P-AI-NIE-STAWIA-BUDYNKOW-Q1 (Maciej 2026-09-04): tryb auto-budowy dla NOWEGO
 * właściciela będącego realnym AI (duża cywilizacja LUB miasto-państwo). Ta sama
 * wartość, którą `foundCityAt` (cities.ts) wpisuje w świeżo założone miasto
 * (`budowaTryb: 'zrownowazone'`) — i którą `seedCityOwnerDefaults` (main.ts) dotąd
 * kasowała bezwarunkowym `DEFAULT_BUDOWA_TRYB = 'reczny'` przy KAŻDYM założeniu
 * i KAŻDYM przejęciu miasta.
 */
export const AI_DEFAULT_BUDOWA_TRYB: BudowaTryb = 'zrownowazone';

/**
 * P-AI-NIE-STAWIA-BUDYNKOW-Q1: globalny default budowy ZALEŻNY OD WŁAŚCICIELA.
 *
 * RUNDA 1, OBRONA, zarzut 1 — PRZYJĘTY. ECHO właściciela (przekazane PO dispatchu,
 * więc wiążące ponad zapisem „gracz: bez zmian" w `00-dispatch.md`): „profil domyślny
 * trybu budowy ma być AUTOMATYCZNY dla wszystkich właścicieli, ŁĄCZNIE Z GRACZEM —
 * z zachowaniem gwarancji, że barbarzyńcy mają ZERO budynków".
 *
 * Dotąd każdy owner — gracz, duże AI, miasto-państwo, barbarzyńcy, rebelianci —
 * dostawał `freshOwnerDefaultBudowaProfil()` z `budowaTryb:'reczny'`.
 * `pickAutoBuildItem` (auto-manage.ts) odmawia dla trybu 'reczny', a AI nie ma
 * ŻADNEJ ścieżki UI powrotu do trybu auto — więc miasta AI nigdy nie stawiały
 * budynków (zgłoszenie właściciela: dwa zdobyte miasta obcych cywilizacji, oba
 * z pustą listą „BUDYNKI W MIEŚCIE (0)”).
 *
 * Rozróżnienie zamiast globalnego zdjęcia resetu:
 *  - `ownerId >= 0` (GRACZ oraz każde realne AI — duża cywilizacja i miasto-państwo,
 *    oba mają dodatnie ownerId) → tryb auto. Gracz NIE traci kontroli: „ręczna kolejka"
 *    jest z natury per-miasto (`onBudowaEnterManual` w main.ts ustawia
 *    `budowaFocusOverride = true`), a miasta z override są pomijane przez
 *    `broadcastBudowaProfilToOwnerCities` i przez migrację niżej;
 *  - `BARBARIAN_OWNER_ID = -1` → 'reczny' OBOWIĄZKOWE: gwarancja „miasto
 *    barbarzyńskie produkuje WYŁĄCZNIE jednostki (nigdy budynki)" (main.ts,
 *    komentarz w `applyCityCaptureToMap`) opiera się WPROST na tym, że
 *    `pickAutoBuildItem` odmawia barbarzyńcom. Zdjęcie resetu globalnie
 *    naprawiłoby budowanie AI i po cichu złamało tamtą gwarancję;
 *  - `REBEL_FACTION_OWNER_ID = -99` (i każdy inny ujemny sentinel) → 'reczny',
 *    zero zmiany zachowania poza celem tego tematu.
 *
 * Test `isBarbarianOwner` jest przy dzisiejszym `BARBARIAN_OWNER_ID = -1`
 * redundantny wobec `ownerId < 0` — zostaje ŚWIADOMIE, bo gwarancja barbarzyńska
 * nie może zależeć od znaku sentinela. Predykat wstrzykiwany (nie import), żeby ten
 * moduł pozostał wolny od zależności na `barbarians.ts` (wzorzec `owner-utils.ts`
 * odwrócony: tam import, tu injekcja — tu moduł jest częścią warstwy defaults,
 * ładowanej także przez testy jednostkowe bez świata gry).
 */
export function freshOwnerDefaultBudowaProfilForOwner(
  ownerId: number,
  isBarbarianOwner: (id: number) => boolean,
): CityBudowaProfil {
  if (ownerId < 0 || isBarbarianOwner(ownerId)) return freshOwnerDefaultBudowaProfil();
  return { budowaFocus: DEFAULT_BUDOWA_FOCUS, budowaTryb: AI_DEFAULT_BUDOWA_TRYB };
}

/**
 * P-AI-NIE-STAWIA-BUDYNKOW-Q1, RUNDA 1, OBRONA, zarzut 2 — PRZYJĘTY.
 * ŚCIEŻKA WCZYTANIA ZAPISU (§16a pkt 4 — trwały stan save/load).
 *
 * `migrateBudowaProfilOnLoad` wyżej odtwarza `ownerDefaultBudowaProfil` z zapisu
 * (`savedDefaults`) albo wylicza go z pól miast — w OBU gałęziach oddaje graczowski
 * `DEFAULT_BUDOWA_TRYB = 'reczny'` dla ownerów AI, bo dokładnie to niesie każdy zapis
 * zrobiony przed tą naprawą. Bez tego kroku właściciel, który zgłosił defekt
 * z TRWAJĄCEJ rozgrywki, po wczytaniu swojego zapisu nie zobaczyłby ŻADNEJ zmiany:
 * `seedCityOwnerDefaults` nie pomoże, bo jego gałąź stoi pod
 * `if (!ownerDefaultBudowaProfil.has(...))`, a wpis z zapisu już tam jest.
 *
 * ARGUMENT „PODNIESIENIE NIE ODBIERA WYBORU" (dowód z kodu, nie z deklaracji;
 * uznany za poprawny w ratyfikacji, patrz akapit niżej — ale NIE jest już
 * uzasadnieniem dla ownera 0): `'reczny'` NIGDY nie trafia do wartości GLOBALNEJ
 * z woli użytkownika. Jedyne wejście w tryb ręczny to `onBudowaEnterManual` (main.ts),
 * które ustawia `city.budowaFocusOverride = true` i z definicji NIE broadcastuje
 * (`onBudowaTrybChange` zapisuje globalny profil wyłącznie w gałęzi
 * `if (!city.budowaFocusOverride)`, a tryb 'reczny' nie przechodzi tamtędy).
 * Globalne `'reczny'` w zapisie jest więc ZAWSZE śladem starego defaultu, nigdy
 * decyzją — a miasta, w których gracz świadomie wybrał ręczną kolejkę, mają
 * `budowaFocusOverride === true` i są tu pomijane (jak w `broadcastBudowaProfil-
 * ToOwnerCities`). Barbarzyńcy i ujemne sentinele zostają nietknięci.
 *
 * RATYFIKACJA ORKIESTRATORA 2026-09-05, DECYZJA 1 — ECHO właściciela „Tylko nowe
 * partie". Argument wyżej został UZNANY ZA POPRAWNY, ale właściciel wybrał wariant
 * ZACHOWAWCZY i to jest wiążące: **ta migracja POMIJA ownera 0 (gracza)**. Skutek
 * przyjęty jawnie: zapis zrobiony przed naprawą zachowuje graczowi tryb ręczny
 * i NIE skorzysta z naprawy — gracz włączy automat sam globalnym przełącznikiem,
 * jeśli zechce. Zakres jest wąski i celowy: dotyczy WYŁĄCZNIE tej migracji.
 * Seed nowej gry oraz przejęcie miasta idą przez
 * `freshOwnerDefaultBudowaProfilForOwner` wyżej i dalej dają graczowi tryb AUTO
 * (drugie ECHO: „gracz też startowo auto"). Migracja dla AI i miast-państw zostaje
 * bez zmian — tam podniesienie trybu jest sednem tematu (asercje A8/A8b/A9 bramki).
 *
 * Zwraca listę ownerów faktycznie podniesionych (dla bramki i diagnostyki).
 */
export function upgradeBudowaProfilAutoDefaultsOnLoad(
  cities: ReadonlyArray<City>,
  ownerDefaults: Map<number, CityBudowaProfil>,
  isBarbarianOwner: (id: number) => boolean,
): number[] {
  const owners = new Set<number>(ownerDefaults.keys());
  for (const c of cities) owners.add(c.ownerId);
  const upgraded: number[] = [];
  for (const oid of owners) {
    if (oid < 0 || isBarbarianOwner(oid)) continue;
    // RATYFIKACJA 2026-09-05, DECYZJA 1 („Tylko nowe partie"): gracz (owner 0) NIE jest
    // podnoszony na ścieżce wczytania zapisu. Bramka: A10 (zielona) + M7 (mutant bez tej
    // linii podnosi gracza, więc A10 realnie mierzy tę jedną linię). Nie upraszczaj.
    if (oid === 0) continue;
    const cur = ownerDefaults.get(oid);
    // Cokolwiek innego niż stary default 'reczny' jest realnym ustawieniem — nie ruszamy.
    if (cur && cur.budowaTryb !== DEFAULT_BUDOWA_TRYB) continue;
    const next: CityBudowaProfil = {
      budowaFocus: cur?.budowaFocus ?? DEFAULT_BUDOWA_FOCUS,
      budowaTryb: AI_DEFAULT_BUDOWA_TRYB,
    };
    ownerDefaults.set(oid, next);
    // Pola per-miasto są czytane BEZPOŚREDNIO przez pętlę ekonomii
    // (`else if (isAutoBudowaTryb(city.budowaTryb))`, main.ts) — sam wpis w mapie
    // globalnej by nie wystarczył. Miasta z override pomijane (pin 📌).
    broadcastBudowaProfilToOwnerCities(cities, oid, next);
    upgraded.push(oid);
  }
  return upgraded;
}

// ---------------------------------------------------------------------------
// 4. Żywność (poziom Wyżywienia/Racji) — R-USTAWIENIA-GLOBALNE-LOKALNE (Maciej
//    2026-08-10, żywa rozmowa: "globalne ustawienia dla żywności pracy i pieniędzy").
//    Wzorem okolicaFocus/budowaFocus (NIE Podziału Pracy): pole City.poziomRacji jest
//    ZAWSZE konkretnie wypełnione (istniało długo przed tym mechanizmem, czytane
//    bezpośrednio w kilkunastu miejscach silnika przez getCityRationLevel) — global
//    Map jest źródłem prawdy, City.poziomRacji zsynchronizowany broadcastem dla miast
//    BEZ override (main.ts broadcastPoziomRacjiToOwnerCities po zmianie globalnej).
// ---------------------------------------------------------------------------

/** Efektywny poziomRacji (do UI/diagnostyki — main.ts trzyma city.poziomRacji w sync). */
export function resolveCityPoziomRacji(
  city: Pick<City, 'poziomRacji' | 'poziomRacjiOverride'>,
  ownerDefault: PoziomRacji | undefined,
): PoziomRacji {
  if (city.poziomRacjiOverride && city.poziomRacji != null) {
    return city.poziomRacji;
  }
  return ownerDefault ?? city.poziomRacji ?? DEFAULT_POZIOM_RACJI;
}

/**
 * Nadpisuje poziomRacji wszystkich miast ownera BEZ override (broadcast globalnej
 * zmiany). Miasta z poziomRacjiOverride===true SĄ POMIJANE (pin 📌) — wzorem
 * broadcastOkolicaFocusToOwnerCities/broadcastBudowaProfilToOwnerCities wyżej.
 */
export function broadcastPoziomRacjiToOwnerCities(
  cities: ReadonlyArray<City>,
  ownerId: number,
  poziom: PoziomRacji,
): void {
  for (const c of cities) {
    if (c.ownerId !== ownerId || c.poziomRacjiOverride) continue;
    c.poziomRacji = poziom;
  }
}

/**
 * P-SPICHLERZ-AUTO-ZYWIENIE-MASOWY-PRZYCISK-Q1: jednorazowa akcja "ustaw teraz" (nie stan
 * trwały/toggle) — dla WSZYSTKICH miast ownera BEZ poziomRacjiOverride ustawia
 * `autoWyzywienie = true`. Miasta z poziomRacjiOverride===true SĄ POMIJANE (pin 📌),
 * dokładnie ten sam wzorzec filtra co `broadcastPoziomRacjiToOwnerCities` wyżej.
 */
export function broadcastAutoWyzywienieToOwnerCities(
  cities: ReadonlyArray<City>,
  ownerId: number,
): void {
  for (const c of cities) {
    if (c.ownerId !== ownerId || c.poziomRacjiOverride) continue;
    c.autoWyzywienie = true;
  }
}

/** Migracja starych zapisów (poziomRacji zawsze per-miasto) → global + flagi override. */
export function migratePoziomRacjiOnLoad(
  cities: ReadonlyArray<City>,
  ownerDefaults: Map<number, PoziomRacji>,
  savedDefaults: ReadonlyArray<[number, PoziomRacji]> | undefined,
): void {
  if (savedDefaults?.length) {
    for (const [oid, poziom] of savedDefaults) ownerDefaults.set(oid, poziom);
  } else {
    // Default = wartość PIERWSZEGO miasta danego ownera napotkanego w tablicy
    // (heurystyka, wzorem migrateOkolicaFocusOnLoad wyżej).
    for (const city of cities) {
      if (!ownerDefaults.has(city.ownerId)) {
        ownerDefaults.set(city.ownerId, city.poziomRacji ?? DEFAULT_POZIOM_RACJI);
      }
    }
    // KAŻDE miasto różniące się od tak wyliczonego defaultu dostaje override=true
    // i ZACHOWUJE swoją starą wartość (zakaz cichego nadpisania, wzorem M7/M8).
    for (const city of cities) {
      if (city.poziomRacjiOverride !== undefined) continue;
      const def = ownerDefaults.get(city.ownerId) ?? DEFAULT_POZIOM_RACJI;
      const differs = city.poziomRacji != null && city.poziomRacji !== def;
      city.poziomRacjiOverride = differs;
      if (!differs) city.poziomRacji = def;
    }
  }
  for (const city of cities) {
    if (!ownerDefaults.has(city.ownerId)) ownerDefaults.set(city.ownerId, DEFAULT_POZIOM_RACJI);
  }
}

export function freshOwnerDefaultPoziomRacji(): PoziomRacji {
  return DEFAULT_POZIOM_RACJI;
}
