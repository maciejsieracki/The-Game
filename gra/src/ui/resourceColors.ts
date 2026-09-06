/**
 * resourceColors.ts — JEDNO ŹRÓDŁO PRAWDY koloru sześciu surowców.
 *
 * TEMAT: P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1 (zgłoszenie właściciela 2026-08-09:
 * „trzeba ujednolicić zasady kolorów prezentacji surowców między panelem miasta
 * a głównym HUD-em mapy świata — różne miejsca używają różnych konwencji
 * kolorystycznych dla tych samych sześciu surowców").
 *
 * SZEŚĆ SUROWCÓW: Praca, Żywność, Skarbiec, Nauka, Kultura, Religia.
 *
 * ŻADEN Z TYCH KOLORÓW NIE JEST NOWY. Oba to tokeny marki z FROZEN
 * `icons/brand/tokens.css` — wybrane jako warianty NAJCZĘŚCIEJ WYSTĘPUJĄCE
 * w kodzie (ECHO właściciela dla tego tematu: przy sprzeczności wygrywa wariant
 * obecny w większej liczbie miejsc):
 *   • `--tg-gold-primary` #e8d88a — HUD mapy (wartość każdego chipa), panel
 *     miasta (ikona i wartość paska W3), `--civ-gold-primary`, `--gold` w scope
 *     `.civ-cs`. Warianty odrzucone: #e8b84a (zapas w pasku W3 panelu miasta,
 *     1 miejsce), #e0b24a (`.civ-detail-scope`), #d9a441 (panel imperium).
 *   • `--tg-science-blue` #5a9bd4 — asset `res-science.svg`/`tb-science*.svg`,
 *     pierścień postępu badań, `--civ-science`, `--blue` w `.civ-cs`
 *     (4 miejsca renderu w panelu miasta). Warianty odrzucone: #7cb4e4
 *     (3 miejsca renderu), #8ec5ff (panel imperium).
 *
 * CO TEN MODUŁ OBEJMUJE: kolor TOŻSAMOŚCI surowca — element, który mówi
 * „to jest ten surowiec" (ikona/medalion, wartość zapasu, wartość chipa).
 * CZEGO NIE OBEJMUJE: kolory STANU (zielony przyrost / czerwony deficyt /
 * pomarańczowe ostrzeżenie). Stan jest wspólną konwencją obu ekranów i jest
 * ortogonalny do tożsamości surowca — HUD mapy koloruje tempo na zielono
 * (`.civ-hud-chip-rate`), panel miasta koloruje tempo tego miasta i deltę
 * cywilizacji na zielono/czerwono. Ta warstwa zostaje nietknięta.
 */

export type ResourceColorKey =
  | 'praca'
  | 'zywnosc'
  | 'skarbiec'
  | 'nauka'
  | 'kultura'
  | 'religia';

export const RESOURCE_COLOR_KEYS: readonly ResourceColorKey[] = [
  'praca',
  'zywnosc',
  'skarbiec',
  'nauka',
  'kultura',
  'religia',
] as const;

/** Etykieta PL surowca — wyłącznie do opisów/diagnostyki bramki. */
export const RESOURCE_COLOR_LABEL: Record<ResourceColorKey, string> = {
  praca: 'Praca',
  zywnosc: 'Żywność',
  skarbiec: 'Skarbiec',
  nauka: 'Nauka',
  kultura: 'Kultura',
  religia: 'Religia',
};

/**
 * PALETA — jedyne miejsce w kodzie, w którym stoi literał koloru surowca.
 * Zmiana wartości tutaj musi być widoczna JEDNOCZEŚNIE w panelu miasta
 * i w HUD-ie mapy świata; pilnuje tego `tools/kolor-surowce-spojnosc-test.cjs`.
 */
export const RESOURCE_COLOR: Record<ResourceColorKey, string> = {
  praca: '#e8d88a',
  zywnosc: '#e8d88a',
  skarbiec: '#e8d88a',
  nauka: '#5a9bd4',
  kultura: '#e8d88a',
  religia: '#e8d88a',
};

/** Nazwa zmiennej CSS niosącej kolor danego surowca. */
export function resourceColorVarName(key: ResourceColorKey): string {
  return `--civ-res-${key}`;
}

/** Klasa ustawiająca `color` elementu na kolor surowca (wartość, etykieta). */
export function resourceTextClass(key: ResourceColorKey): string {
  return `civ-res-c-${key}`;
}

/**
 * Klasa zakresu na korzeniu chipa/wiersza. Ustawia `--civ-res-self`, z którego
 * czytają wszystkie elementy tożsamościowe tego chipa (ikona, wartość, zapas) —
 * dzięki temu jeden chip nie może rozjechać ikony i liczby na dwa surowce.
 */
export function resourceScopeClass(key: ResourceColorKey): string {
  return `civ-res-${key}`;
}

/** Blok `:root` ze zmiennymi palety — wstrzykiwany raz przez brandTokenVars.ts. */
export const RESOURCE_COLOR_ROOT_CSS = `
:root {
${RESOURCE_COLOR_KEYS.map((k) => `  ${resourceColorVarName(k)}: ${RESOURCE_COLOR[k]};`).join('\n')}
}
`;

/**
 * Reguły klas palety. `prefix` podnosi swoistość selektora do poziomu scope'ów,
 * które mają własne `.civ-cs .gold`-podobne reguły (0,2,0) — bez tego paleta
 * przegrywałaby kaskadę w panelu miasta.
 */
export function resourceColorClassCss(prefix = ''): string {
  const p = prefix ? `${prefix} ` : '';
  const lines: string[] = [];
  for (const k of RESOURCE_COLOR_KEYS) {
    lines.push(`${p}.${resourceTextClass(k)}{color:var(${resourceColorVarName(k)});}`);
    lines.push(`${p}.${resourceScopeClass(k)}{--civ-res-self:var(${resourceColorVarName(k)});}`);
  }
  return lines.join('\n');
}
