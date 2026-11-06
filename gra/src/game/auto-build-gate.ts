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
