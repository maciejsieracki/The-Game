/**
 * wonders-effects-text.ts — tekst efektów cudu dla gracza (modal „CUD UKOŃCZONY", karta cudu).
 * R-WEB-UI-RAW-IDS-IN-PLAYER-TEXT-Q1: id terenów/ulepszeń idą przez JEDEN resolver `nazwaWyswietlana`
 * (text-names.ts), nigdy surowo.
 */
import type { WonderDef } from './wonders-data';
import { nazwaWyswietlana } from './text-names';

export const WONDER_YIELD_LABELS: Readonly<Record<string, string>> = {
  pieniadz: 'złota', zywnosc: 'żywności', nauka: 'nauki', kultura: 'kultury',
  zadowolenie: 'zadowolenia', praca: 'produkcji', obrona: 'obrony', drewno: 'drewna',
};

export function formatWonderYieldBonus(b?: Readonly<Record<string, number | undefined>>): string {
  if (!b) return '';
  return Object.entries(b)
    .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] !== 0)
    .map(([k, v]) => `+${v} ${WONDER_YIELD_LABELS[k] ?? nazwaWyswietlana(k)}`)
    .join(', ');
}

/** Lista efektów cudu (jedna linia, części rozdzielone „ · "). */
export function wonderEffectsText(w: Pick<WonderDef, 'bonusy'>): string {
  const parts: string[] = [];
  const miasto = formatWonderYieldBonus(w.bonusy?.miasto as Record<string, number | undefined> | undefined);
  if (miasto) parts.push(`Miasto ${miasto} (× każde miasto)`);
  const hex = formatWonderYieldBonus(w.bonusy?.hex as Record<string, number | undefined> | undefined);
  if (hex) parts.push(`Hex cudu ${hex}`);
  for (const t of w.bonusy?.teren ?? []) {
    const y = formatWonderYieldBonus(t as unknown as Record<string, number | undefined>);
    if (y) parts.push(`${nazwaWyswietlana(t.typTerenu)} ${y}`);
  }
  for (const s of w.bonusy?.specjalne ?? []) parts.push(s.opis);
  return parts.length > 0 ? parts.join(' · ') : '(brak opisanych bonusów)';
}
