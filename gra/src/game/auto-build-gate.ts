/**
 * auto-build-gate.ts — R-WEB-SETTINGS-AUTOBUILD-TOGGLE-Q1 (decyzja właściciela 2026-11-05).
 *
 * Jedna czysta bramka „automatyzacja budowy" DLA GRACZA (ludzkich foteli):
 *   - auto-ulepszenia terenu (`pickAutoImprovements` na EOT gracza),
 *   - auto-budowa budynków w miastach (tryby `priorytet`/`lista`/`zrownowazone`,
 *     kolejkowanie po ukończeniu, kolejkowanie z Zarządcy ⚙).
 *
 * Opcja `autoBuildEnabled` jest DOMYŚLNIE WYŁĄCZONA (nowa gra i zapisy bez pola).
 * AI / państwa-miasta / barbarzyńcy NIE są dotknięci (zawsze budują automatycznie).
 * Wyłączenie NIE kasuje trybów zapisanych w mieście — tryb zostaje w danych, ale
 * silnik go nie wykonuje, dopóki opcja jest wyłączona.
 * / EN: single pure gate for the human-player build automation; AI unaffected.
 */

/** Wartość domyślna opcji (nowa gra, zapis bez pola). */
export const AUTO_BUILD_ENABLED_DEFAULT = false;

/** Czy owner jest ludzkim fotelem. */
export function isHumanSeatOwner(ownerId: number, humanOwnerIds: readonly number[]): boolean {
  return humanOwnerIds.includes(ownerId);
}

/**
 * Czy automatyka budowy może działać dla danego ownera.
 * AI (nie-człowiek) → zawsze true; człowiek → wartość opcji.
 */
export function isAutoBuildAllowedForOwner(
  ownerId: number,
  humanOwnerIds: readonly number[],
  autoBuildEnabled: boolean,
): boolean {
  if (!isHumanSeatOwner(ownerId, humanOwnerIds)) return true;
  return autoBuildEnabled === true;
}

/**
 * R-WEB-CITY-ADMINISTRATOR-Q1 (właściciel 2026-11-11): autobudowa budynków GRACZA w mieście działa
 * WYŁĄCZNIE przy działającym administratorze tego miasta (oprócz globalnej opcji). Bez administratora
 * (albo gdy nie pracuje — brak środków w skarbcu) automat w tym mieście nie buduje; tryb zostaje w danych.
 * ZAŁOŻENIE: AI (nie-człowiek) NIE podlega bramce administratora — AI buduje jak dotąd (administrator
 * AI daje mu tylko efekty ekonomiczne), bo inaczej AI zablokowałoby samo siebie przed budową
 * budynku administracyjnego (patrz raport rundy 1).
 */
export function isCityAutoBuildAllowed(
  ownerId: number,
  humanOwnerIds: readonly number[],
  autoBuildEnabled: boolean,
  cityHasWorkingAdministrator: boolean,
): boolean {
  if (!isAutoBuildAllowedForOwner(ownerId, humanOwnerIds, autoBuildEnabled)) return false;
  if (!isHumanSeatOwner(ownerId, humanOwnerIds)) return true;
  return cityHasWorkingAdministrator === true;
}

/**
 * R-WEB-IMPROVEMENT-ADMINISTRATOR-Q1 (właściciel 2026-11-11): automatyczne ulepszenia TERENU w mieście gracza
 * działają WYŁĄCZNIE przy działającym administratorze ulepszeń tego miasta (oprócz globalnej opcji).
 * Bez niego (albo gdy nie pracuje — brak środków) wszystko ręcznie. AI: tylko gdy `aiRequires` (JSON,
 * domyślnie false — patrz raport rundy 1).
 */
export function isCityAutoImprovementAllowed(
  ownerId: number,
  humanOwnerIds: readonly number[],
  autoBuildEnabled: boolean,
  cityHasWorkingImprovementAdministrator: boolean,
  aiRequires: boolean = false,
): boolean {
  if (!isAutoBuildAllowedForOwner(ownerId, humanOwnerIds, autoBuildEnabled)) return false;
  if (!isHumanSeatOwner(ownerId, humanOwnerIds) && !aiRequires) return true;
  return cityHasWorkingImprovementAdministrator === true;
}

/** Podpowiedź UI: auto-ulepszenia terenu wymagają działającego administratora ulepszeń. */
export const AUTO_IMPROVE_NEEDS_ADMINISTRATOR_HINT = 'Auto-ulepszenia terenu w tym mieście wymagają działającego administratora ulepszeń';

/** Podpowiedź UI: autobudowa wymaga działającego administratora miasta. */
export const AUTO_BUILD_NEEDS_ADMINISTRATOR_HINT = 'Autobudowa w tym mieście wymaga działającego administratora';

/** Odczyt z meta zapisu: brak pola / nie-boolean = wyłączona. */
export function autoBuildFromSaveMeta(raw: unknown): boolean {
  return raw === true;
}

/** Odczyt z parametrów nowej gry: brak pola = domyślnie wyłączona. */
export function autoBuildFromNewGameParam(raw: unknown): boolean {
  return typeof raw === 'boolean' ? raw : AUTO_BUILD_ENABLED_DEFAULT;
}

/** Podpowiedź UI dla zablokowanych kontrolek auto. */
export const AUTO_BUILD_DISABLED_HINT = 'Włącz automatyzację budowy w Ustawieniach';
