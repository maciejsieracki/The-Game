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
