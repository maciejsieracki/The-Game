/**
 * Wyświetlana etykieta rozmiaru mapy (R-WEB-POLISH-LANGUAGE-AUDIT-Q1, decyzja właściciela 2026-11-12).
 * Klucze („Malenki", „Super Huge") zostają bez zmian — to one są kluczem zapisów, menu i
 * wyszukiwań (e-start-params, generator, normMenuLabel). Ta funkcja zmienia TYLKO tekst pokazywany graczowi.
 */
const MAP_SIZE_DISPLAY: Readonly<Record<string, string>> = {
  Malenki: 'Maleńki',
  'Super Huge': 'Bardzo ogromny',
};

export function mapSizeDisplayLabel(key: string): string {
  return MAP_SIZE_DISPLAY[key] ?? key;
}
