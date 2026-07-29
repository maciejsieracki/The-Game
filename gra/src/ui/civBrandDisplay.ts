/**
 * civBrandDisplay.ts — krótka linia wyróżnika cywilizacji (styl + jednostka specjalna).
 * Pełny opis tylko na starcie gry (newGameFlow); w trakcie gry — tooltip na nazwie.
 */

import civsRaw from '../../data/civs.json';

type CivBrandRow = {
  ikonaId?: string;
  typCywilizacji?: string;
  Cywilizacja?: string;
  'Styl / charakter'?: string | null;
  'Jednostka specjalna'?: string | null;
};

/** „defensywna piechota · Falanga (Hoplita)" — bez pustych segmentów i placeholderów. */
export function formatCivBrandLine(
  styl?: string | null,
  jednostkaSpec?: string | null,
): string {
  const parts: string[] = [];
  const s = (styl ?? '').trim();
  const j = (jednostkaSpec ?? '').trim();
  if (s && s !== '—') parts.push(s);
  if (j && j !== '—') parts.push(j);
  return parts.join(' · ');
}

/** Lookup po ikonaId / typCywilizacji / nazwie (jak economy.civBonusyForCivKey). */
export function civBrandLineForKey(civKey: string | null | undefined): string {
  if (!civKey) return '';
  const key = civKey.toLowerCase();
  const rows = (civsRaw as { cywilizacje?: CivBrandRow[] }).cywilizacje ?? [];
  for (const row of rows) {
    const ids = [row.ikonaId, row.typCywilizacji, row.Cywilizacja]
      .filter((s): s is string => typeof s === 'string' && s.length > 0)
      .map(s => s.toLowerCase());
    if (ids.includes(key)) {
      return formatCivBrandLine(row['Styl / charakter'], row['Jednostka specjalna']);
    }
  }
  return '';
}

/** Atrybut title= dla tooltipa na nazwie cywilizacji (pusty gdy brak treści). */
export function civBrandTitleAttr(
  styl?: string | null,
  jednostkaSpec?: string | null,
): string {
  const line = formatCivBrandLine(styl, jednostkaSpec);
  if (!line) return '';
  const esc = line
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
  return ` title="${esc}"`;
}

/** Skrót: title= z lookupu po kluczu cywilizacji. */
export function civBrandTitleAttrForKey(civKey: string | null | undefined): string {
  const line = civBrandLineForKey(civKey);
  if (!line) return '';
  const esc = line
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
  return ` title="${esc}"`;
}
