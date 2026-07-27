/**
 * danina-nazwa.ts
 *
 * Decyzja Macieja (2026-07-27): strumień dochodu miasta oddawanego władcy (dawny
 * "Handel" w danych terenu / handelBrutto/handelNetto w silniku) nazywa się
 * zawsze **Podatek** w całej grze — bez bramki Waluta/Mennica i bez nazwy
 * "Danina". Handel międzynarodowy (trasy dyplomatyczne) to osobny mechanizm
 * z etykietą "Handel ze szlaków" / żeton HUD "Handel".
 *
 * Moduł zachowuje dotychczasowe eksporty API (kompatybilność wołających), ale
 * wszystkie funkcje etykiety zwracają stałe wartości Podatek/podatku/podatek.
 */

/** Etykieta widoczna dla gracza — zawsze "Podatek" (decyzja 2026-07-27). */
export type DaninaLabel = 'Podatek';

export function daninaLabelGenitive(_label?: DaninaLabel): 'podatku' {
  return 'podatku';
}

export function daninaLabelAccusative(_label?: DaninaLabel): 'podatek' {
  return 'podatek';
}

/** Zawsze true — bramka Danina/Podatek usunięta (decyzja 2026-07-27). */
export function isPodatekActive(
  _walutaOdkryta?: boolean,
  _mennicaWStolicy?: boolean,
  _maDostepDoZlota?: boolean,
): boolean {
  return true;
}

/** Etykieta do wyświetlenia graczowi — zawsze "Podatek". */
export function daninaLabel(
  _walutaOdkryta?: boolean,
  _mennicaWStolicy?: boolean,
  _maDostepDoZlota?: boolean,
): DaninaLabel {
  return 'Podatek';
}

/**
 * Czy Mennica stoi W STOLICY danego ownera (używane przez ekonomię / Mennicę,
 * nie do nazewnictwa strumienia — patrz nagłówek pliku).
 */
export function mennicaWStolicy(
  capitalCityId: string | null | undefined,
  builtBuildingIdsForCapital: readonly string[] | null | undefined,
): boolean {
  if (!capitalCityId) return false;
  return (builtBuildingIdsForCapital ?? []).includes('mennica');
}

export function daninaLabelForOwnerByCityList(
  _ownerId?: number,
  _walutaOdkryta?: boolean,
  _cities?: ReadonlyArray<{ id: string; ownerId: number }>,
  _builtByCity?: ReadonlyMap<string, readonly string[]>,
  _capitalCityId?: string | null,
  _maDostepDoZlota?: boolean,
): DaninaLabel {
  return 'Podatek';
}
