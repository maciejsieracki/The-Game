/**
 * auto-build-gate.ts — R-WEB-SETTINGS-AUTOBUILD-TOGGLE-Q1 (decyzja właściciela 2026-11-05).
 *
 * Jedna czysta bramka „automatyzacja budowy" DLA GRACZA (ludzkich foteli):
 *   - auto-ulepszenia terenu (`pickAutoImprovements` na EOT gracza),
 *   - auto-budowa budynków w miastach (tryby `priorytet`/`lista`/`zrownowazone`,
 *     kolejkowanie po ukończeniu, kolejkowanie z Zarządcy ⚙).
 *
 * Opcja `administratorsEnabled` jest DOMYŚLNIE WYŁĄCZONA (nowa gra i zapisy bez pola).
 * AI / państwa-miasta / barbarzyńcy NIE są dotknięci (zawsze budują automatycznie).
 * Wyłączenie NIE kasuje trybów zapisanych w mieście — tryb zostaje w danych, ale
 * silnik go nie wykonuje, dopóki opcja jest wyłączona.
 * / EN: single pure gate for the human-player build automation; AI unaffected.
 */

/**
 * R-WEB-SETTINGS-ADMINISTRATORS-WIZARD-Q1 (właściciel 2026-11-11): globalna opcja „Administratorzy” z kreatora
 * nowej gry zastąpiła przełącznik „Automatyzacja budowy” z ustawień. Zapisana w grze NA STAŁE
 * (`meta.administratorsEnabled`), bez przełącznika w trakcie gry. Dotyczy WYŁĄCZNIE gracza (ludzkich foteli);
 * AI nie podlega opcji (ZAŁOŻENIE z DODATKU 2: AI buduje i ulepsza jak dotąd, `ai_wymaga_administratora=false`).
 * Armia (R-WEB-ARMY-AUTO-RECRUIT-GENERAL-Q1) jest niezależna od tej opcji.
 */
/** Wartość domyślna opcji „Administratorzy” (nowa gra, zapis bez pola): WYŁĄCZONE. */
export const ADMINISTRATORS_ENABLED_DEFAULT = false;

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
  administratorsEnabled: boolean,
): boolean {
  if (!isHumanSeatOwner(ownerId, humanOwnerIds)) return true;
  return administratorsEnabled === true;
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
  administratorsEnabled: boolean,
  cityHasWorkingAdministrator: boolean,
): boolean {
  if (!isAutoBuildAllowedForOwner(ownerId, humanOwnerIds, administratorsEnabled)) return false;
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
  administratorsEnabled: boolean,
  cityHasWorkingImprovementAdministrator: boolean,
  aiRequires: boolean = false,
): boolean {
  if (!isAutoBuildAllowedForOwner(ownerId, humanOwnerIds, administratorsEnabled)) return false;
  if (!isHumanSeatOwner(ownerId, humanOwnerIds) && !aiRequires) return true;
  return cityHasWorkingImprovementAdministrator === true;
}

/**
 * R-WEB-IMPROVEMENT-ADMINISTRATOR-Q1 r2 (zarzut 2): czysty filtr miast objętych auto-ulepszeniami terenu
 * w przebiegu EOT fotela `seatOwnerId` — TA SAMA funkcja jest używana w main.ts i w teście behawioralnym
 * (ten sam świat z administratorem i bez niego), zamiast sondy regex.
 */
export function selectCitiesForAutoImprovement<C extends { ownerId: number }>(
  cities: readonly C[],
  seatOwnerId: number,
  seatAllowed: boolean,
  isCityActive: (c: C) => boolean,
  isAutoMode: (c: C) => boolean,
): C[] {
  return cities.filter(c => {
    if (c.ownerId !== seatOwnerId) return false;
    if (!seatAllowed) return false;
    if (!isCityActive(c)) return false;
    return isAutoMode(c);
  });
}

/**
 * R-WEB-IMPROVEMENT-ADMINISTRATOR-Q1 r2 (zarzut 1): OSOBNA flaga migracji administratora ulepszeń
 * (`meta.improvementAdministratorNoticeShown`) — niezależna od `cityAdministratorNoticeShown`, bo zapisy
 * zrobione po wdrożeniu administratora miasta mają tamtą flagę = true i migracja ulepszeń nigdy by nie ruszyła.
 * Zwraca true, gdy należy pokazać jednorazowe powiadomienie.
 */
export function shouldShowImprovementAdminMigration(noticeShown: boolean, affectedCities: number): boolean {
  return noticeShown !== true && affectedCities > 0;
}

/** Podpowiedź UI: auto-ulepszenia terenu wymagają działającego administratora ulepszeń. */
export const AUTO_IMPROVE_NEEDS_ADMINISTRATOR_HINT = 'Auto-ulepszenia terenu wymagają działającego administratora państwa (jeden na całe Państwo)';

/** Podpowiedź UI: autobudowa wymaga działającego administratora miasta. */
export const AUTO_BUILD_NEEDS_ADMINISTRATOR_HINT = 'Autobudowa w tym mieście wymaga działającego administratora';

/** Odczyt z meta zapisu: brak pola / nie-boolean = wyłączone (stary zapis: migracja w main.ts). */
export function administratorsFromSaveMeta(raw: unknown): boolean {
  return raw === true;
}

/** Odczyt z parametrów nowej gry: brak pola = domyślnie wyłączone. */
export function administratorsFromNewGameParam(raw: unknown): boolean {
  return typeof raw === 'boolean' ? raw : ADMINISTRATORS_ENABLED_DEFAULT;
}

/**
 * Migracja starego zapisu (sprzed opcji „Administratorzy”): zapis BEZ `administratorsEnabled`, ale z włączoną
 * dotąd automatyzacją (`autoBuildEnabled === true`) → administratorzy WYŁĄCZENI + jednorazowe powiadomienie.
 */
export function shouldShowLegacyAutomationMigration(
  meta: { administratorsEnabled?: unknown; autoBuildEnabled?: unknown } | undefined | null,
  hadHiredAdministrator: boolean = false,
): boolean {
  if (!meta) return false;
  // Zarzut Evaluatora 1: opłacony administrator ginie przy wczytaniu także przy autoBuildEnabled=false — wtedy też komunikat.
  return typeof meta.administratorsEnabled !== 'boolean' && (meta.autoBuildEnabled === true || hadHiredAdministrator === true);
}

/** Treść jednorazowego powiadomienia (zakładka „Ważne”) po wczytaniu starego zapisu z włączoną automatyzacją. */
export const LEGACY_AUTOMATION_NOTICE_TITLE = 'Automatyzacja wymaga administratorów';
export const LEGACY_AUTOMATION_NOTICE_TEXT =
  'Ta gra powstała przed opcją „Administratorzy”: automatyczna budowa budynków i ulepszeń terenu jest w niej wyłączona, a administratorzy usunięci. '
  + 'Aby odzyskać automatyzację, rozpocznij nową grę z włączoną opcją „Administratorzy” w kreatorze nowej gry.';

/** Podpowiedź UI dla zablokowanych kontrolek auto (opcja „Administratorzy” wyłączona w tej grze). */
export const AUTO_BUILD_DISABLED_HINT = 'Automatyzacja jest dostępna tylko w grze z włączoną opcją „Administratorzy” (kreator nowej gry)';
