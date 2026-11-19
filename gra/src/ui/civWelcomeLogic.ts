/**
 * civWelcomeLogic.ts — CZYSTA logika ekranu „Odkryłeś nową cywilizację” (R-WEB-UI-CIV-WELCOME-SCREEN-Q1).
 * Zero DOM / Audio: testowalne w Node (gra/tools/civ-welcome-screen-test.cjs).
 *
 * Źródła danych (bez kopii balansowych):
 *   - data/civs.json            — nazwa, styl, jednostka specjalna, religia, ikonaId
 *   - data/civ-matrix.json      — plusy/minusy (niezerowe parametry gracza; dip_/ai_/meta_ pominięte)
 *   - data/civ-intro-texts.json — rys historyczny i powitania (ZATWIERDZONE 2026-11-18)
 */

import civsRaw from '../../data/civs.json';
import civMatrixRaw from '../../data/civ-matrix.json';
import introRaw from '../../data/civ-intro-texts.json';

type CivRow = {
  Cywilizacja?: string;
  ikonaId?: string;
  typCywilizacji?: string;
  'Styl / charakter'?: string | null;
  'Jednostka specjalna'?: string | null;
  Religia?: string | null;
};

type MatrixRow = {
  Cywilizacja?: string;
  ikonaId?: string;
  typCywilizacji?: string;
  params?: Record<string, number | null | undefined>;
};

export interface CivIntroEntry {
  rys_historyczny: string;
  powitanie_przyjazne: string[];
  powitanie_nieprzyjazne: string[];
}

export interface CivWelcomeInfo {
  name: string;
  ikonaId: string;
  styl: string;
  jednostka: string;
  religia: string;
  rys: string;
  /** Pełne listy; ekran powitalny pokazuje wszystkie pozycje. */
  plusy: string[];
  minusy: string[];
}

const CIV_ROWS = (civsRaw as { cywilizacje?: CivRow[] }).cywilizacje ?? [];
const MATRIX_ROWS = ((civMatrixRaw as { cywilizacje?: unknown }).cywilizacje ?? []) as MatrixRow[];
const INTRO = introRaw as unknown as Record<string, CivIntroEntry>;

/** Liczba wariantów powitania władcy w każdej z dwóch grup (przyjazne / nieprzyjazne). */
export const WELCOME_GREETING_VARIANTS = 3;

/**
 * Etykiety parametrów gracza z civ-matrix.json (nazwy po polsku dla gracza).
 * Klucze spoza listy (dip_*, ai_*, meta_*) są celowo pomijane — to parametry wewnętrzne.
 */
export const CIV_PARAM_LABELS: Readonly<Record<string, string>> = {
  walka_atak_piechota: 'Atak piechoty',
  walka_atak_kawaleria: 'Atak konnicy',
  walka_atak_rydwany: 'Atak rydwanów',
  walka_atak_morska: 'Atak na morzu',
  walka_atak_obleczenie: 'Atak oblężniczy',
  walka_atak_piechota_teren_las: 'Atak piechoty w lesie',
  walka_atak_piechota_runda_szarzy: 'Atak piechoty w szarży',
  walka_atak_piechota_teren_plytkie_morze: 'Atak piechoty na płytkiej wodzie',
  walka_obrona_piechota: 'Obrona piechoty',
  walka_obrona_morska: 'Obrona na morzu',
  walka_obrona_piechota_teren_las: 'Obrona piechoty w lesie',
  walka_obrona_piechota_terytorium_wlasne: 'Obrona piechoty na własnym terenie',
  walka_obrona_piechota_w_murze: 'Obrona piechoty za murem',
  walka_obrona_piechota_teren_plytkie_morze: 'Obrona piechoty na płytkiej wodzie',
  walka_pancerz_piechota: 'Pancerz piechoty',
  walka_uderzenie_piechota: 'Uderzenie piechoty',
  walka_uderzenie_kawaleria: 'Uderzenie konnicy',
  walka_dystans_lukownicy: 'Ostrzał łuczników',
  walka_dystans_rydwany: 'Ostrzał z rydwanów',
  walka_ruch_bitwa_proc: 'Ruch w bitwie',
  walka_ruch_rydwany: 'Ruch rydwanów',
  walka_ruch_piechota_teren_plytkie_morze: 'Ruch piechoty na płytkiej wodzie',
  walka_hp_piechota: 'Wytrzymałość piechoty',
  walka_hp_rydwany: 'Wytrzymałość rydwanów',
  walka_koszt_rekrutacji_proc: 'Koszt rekrutacji',
  prod_koszt_budynku_proc: 'Koszt budynków',
  prod_koszt_jednostki_proc: 'Koszt jednostek',
  eko_praca_proc: 'Wydajność pracy',
  eko_pieniadz_proc: 'Dochód z pieniądza',
  eko_pieniadz_port_proc: 'Dochód z pieniądza w portach',
  eko_handel_brutto_proc: 'Handel',
  eko_nauka_proc: 'Nauka',
  lud_limit_populacji: 'Limit ludności',
  lud_wzrost_proc: 'Wzrost ludności',
  mp_regen_proc: 'Odnawianie rezerw ludzkich',
};

/** Parametry, których wzrost jest KOSZTEM (dodatni = gorzej dla gracza). */
const COST_PARAM_KEYS: ReadonlySet<string> = new Set([
  'prod_koszt_budynku_proc',
  'prod_koszt_jednostki_proc',
  'walka_koszt_rekrutacji_proc',
]);

/** Dopasowanie klucza cywilizacji (ikonaId / typCywilizacji / nazwa), bez rozróżniania wielkości liter. */
function matchesCivKey(row: { ikonaId?: string; typCywilizacji?: string; Cywilizacja?: string }, key: string): boolean {
  const k = key.toLowerCase();
  return [row.ikonaId, row.typCywilizacji, row.Cywilizacja]
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
    .some(s => s.toLowerCase() === k);
}

function findCivRow(civKey: string): CivRow | null {
  return CIV_ROWS.find(r => matchesCivKey(r, civKey)) ?? null;
}

/** FNV-1a 32-bit — stabilny, bez Math.random(). */
export function hash32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Nastawienie „przyjazne” = wszystko poza „Wrogi” i „Nieufny” (etykieta z nastawienieLabelFromScore:
 * Zaufanie < 30 → Nieufny, < 10 → Wrogi; w wojnie zawsze Wrogi). Próg efektywny: Zaufanie ≥ 30 i brak wojny.
 */
export function isFriendlyStance(label: string | null | undefined): boolean {
  return label !== 'Wrogi' && label !== 'Nieufny';
}

/** Powitanie władcy: deterministyczny wybór 1 z 3 wariantów wg ziarna gry, cywilizacji i nastawienia. */
export function pickWelcomeGreeting(civKey: string, friendly: boolean, seed: number): string {
  const row = findCivRow(civKey);
  const id = (row?.ikonaId ?? civKey).toLowerCase();
  const intro = INTRO[id];
  if (!intro) return '';
  const pool = (friendly ? intro.powitanie_przyjazne : intro.powitanie_nieprzyjazne) ?? [];
  if (pool.length === 0) return '';
  const variants = Math.min(pool.length, WELCOME_GREETING_VARIANTS);
  const idx = hash32(`${seed >>> 0}|${id}|${friendly ? 'p' : 'n'}`) % variants;
  return pool[idx] ?? '';
}

/** Plusy i minusy cywilizacji z niezerowych parametrów gracza (civ-matrix.json). */
export function civPlusMinus(civKey: string): { plusy: string[]; minusy: string[] } {
  const plusy: string[] = [];
  const minusy: string[] = [];
  const row = MATRIX_ROWS.find(r => matchesCivKey(r, civKey));
  if (!row?.params) return { plusy, minusy };
  for (const [key, raw] of Object.entries(row.params)) {
    const label = CIV_PARAM_LABELS[key];
    if (!label || typeof raw !== 'number' || !Number.isFinite(raw) || raw === 0) continue;
    const size = Math.abs(raw) >= 1 ? String(Math.abs(raw)) : `${Math.round(Math.abs(raw) * 100)}%`;
    const sign = raw > 0 ? '+' : '−';
    const text = `${label} ${sign}${size}`;
    const good = COST_PARAM_KEYS.has(key) ? raw < 0 : raw > 0;
    (good ? plusy : minusy).push(text);
  }
  return { plusy, minusy };
}

/** Pełne dane ekranu powitalnego dla cywilizacji; null gdy klucz nie pasuje do żadnej z 15. */
export function civWelcomeInfo(civKey: string): CivWelcomeInfo | null {
  const row = findCivRow(civKey);
  if (!row) return null;
  const ikonaId = (row.ikonaId ?? civKey).toLowerCase();
  const intro = INTRO[ikonaId];
  const { plusy, minusy } = civPlusMinus(civKey);
  return {
    name: row.Cywilizacja ?? ikonaId,
    ikonaId,
    styl: (row['Styl / charakter'] ?? '').trim(),
    jednostka: (row['Jednostka specjalna'] ?? '').trim(),
    religia: (row.Religia ?? '').trim(),
    rys: intro?.rys_historyczny ?? '',
    plusy,
    minusy,
  };
}

/**
 * Flaga „ekran pokazany RAZ” (per fotel). `shown` = zbiór ownerId, którym ekran już pokazano
 * (ta sama mapa co diplomaticDiscoveryPopupShown w meta zapisu).
 */
export function firstContactWelcomeDue(shown: ReadonlySet<number>, ownerId: number): boolean {
  return !shown.has(ownerId);
}

/**
 * Migracja starego zapisu: gdy meta nie ma pola `diplomaticDiscoveryPopupShown` (zapis sprzed flagi),
 * cywilizacje już znane NIE pokazują ekranu powitalnego. Zwraca ownerIds do wpisania jako „pokazane”.
 * Zapis z polem (nawet pustym) nie jest migrowany.
 */
export function legacyShownMigration(metaShownField: unknown, knownOwnerIds: readonly number[]): number[] {
  if (metaShownField !== undefined) return [];
  return knownOwnerIds.slice();
}

/** Klucze wszystkich cywilizacji z civs.json (ikonaId, małymi literami). */
export function civKeysAll(): string[] {
  return CIV_ROWS.map(r => (r.ikonaId ?? '').toLowerCase()).filter(s => s.length > 0);
}
