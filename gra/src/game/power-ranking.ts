/**
 * power-ranking.ts — lista państw widocznych w rankingu Mocy (panel imperium + overlay).
 *
 * PRODUKCJA (domyślnie):
 * - tylko pełne cywilizacje (bez miast-państw klastra),
 * - tylko odkryte w mgle wojny (+ gracz ownerId 0 zawsze).
 *
 * TEMP / test-only (do usunięcia przed finalną wersją):
 * - `civ.debugPowerRankingAll` w localStorage lub `?debugPowerRankingAll=1` w URL
 *   → pokaż wszystkie pełne cywilizacje niezależnie od odkrycia.
 *   Miasta-państwa nadal ukryte.
 */

import { isOwnerClusterCityState } from './display-names';

/** localStorage — TEMP test toggle (produkcja: domyślnie brak / false). */
export const POWER_RANKING_DEBUG_ALL_LS_KEY = 'civ.debugPowerRankingAll';

export interface PowerRankingFilterOpts {
  cityStateOpts?: Parameters<typeof isOwnerClusterCityState>[1];
  discoveredOwners: ReadonlySet<number>;
  /** TEMP: test-only — wszystkie pełne cywilizacje, bez filtra mgły. */
  debugShowAll?: boolean;
}

/** Państwa kwalifikujące się do rankingu Mocy (kolejność wejściowa zachowana). */
export function filterOwnersForPowerRanking(
  ownerIds: Iterable<number>,
  opts: PowerRankingFilterOpts,
): number[] {
  const showAll = opts.debugShowAll ?? false;
  const out: number[] = [];
  for (const oid of ownerIds) {
    if (oid === 0) {
      out.push(0);
      continue;
    }
    if (isOwnerClusterCityState(oid, opts.cityStateOpts)) continue;
    if (!showAll && !opts.discoveredOwners.has(oid)) continue;
    out.push(oid);
  }
  return out;
}

const debugToggleListeners = new Set<() => void>();

/** Rejestruje callback po zmianie przełącznika testowego (np. odśwież panel). */
export function onPowerRankingDebugToggle(listener: () => void): () => void {
  debugToggleListeners.add(listener);
  return () => debugToggleListeners.delete(listener);
}

function notifyDebugToggleListeners(): void {
  for (const fn of debugToggleListeners) fn();
}

/** TEMP: czy pokazać w rankingu wszystkie pełne cywilizacje (nie tylko odkryte). */
export function isPowerRankingDebugShowAll(): boolean {
  if (typeof location !== 'undefined') {
    const q = new URLSearchParams(location.search).get('debugPowerRankingAll');
    if (q === '1' || q === 'true') return true;
    if (q === '0' || q === 'false') return false;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(POWER_RANKING_DEBUG_ALL_LS_KEY) === 'true';
    }
  } catch {
    /* prywatny tryb / brak localStorage */
  }
  return false;
}

/** TEMP: zapis przełącznika testowego + powiadomienie UI. */
export function setPowerRankingDebugShowAll(on: boolean): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(POWER_RANKING_DEBUG_ALL_LS_KEY, on ? 'true' : 'false');
    }
  } catch {
    /* ignore */
  }
  notifyDebugToggleListeners();
}

/**
 * TEMP: czy pokazać checkbox testowy w UI rankingu.
 * Widoczny w ROBOCZA / Vite dev / gdy już ustawiono klucz debug.
 */
export function isPowerRankingDebugUiAvailable(): boolean {
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) return true;
  if (typeof location !== 'undefined') {
    const path = location.pathname.toLowerCase();
    if (path.includes('robocza') || path.includes('gra-robocza')) return true;
    if (new URLSearchParams(location.search).has('debugPowerRankingAll')) return true;
  }
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(POWER_RANKING_DEBUG_ALL_LS_KEY) != null) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** HTML checkboxa testowego (panel imperium / overlay Moc). */
export function powerRankingDebugToggleHtml(): string {
  if (!isPowerRankingDebugUiAvailable()) return '';
  const checked = isPowerRankingDebugShowAll() ? ' checked' : '';
  return '<label class="civ-pow-rank-debug" style="display:block;margin:8px 0 4px;font-size:11px;color:#8a93a4">'
    + '<input type="checkbox" data-pow-rank-debug' + checked + '> '
    + '<span style="color:#c9a24a">[TEST]</span> Pokaż moc wszystkich cywilizacji (bez mgły)</label>';
}

/** Podłącza handler checkboxa po wstrzyknięciu HTML. */
export function wirePowerRankingDebugToggle(container: ParentNode, onChange: () => void): void {
  const cb = container.querySelector<HTMLInputElement>('input[data-pow-rank-debug]');
  if (!cb) return;
  cb.addEventListener('change', () => {
    setPowerRankingDebugShowAll(cb.checked);
    onChange();
  });
}
