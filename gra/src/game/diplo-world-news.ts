/**
 * R-WEB-DIPLO-WORLD-WAR-PEACE-NEWS-Q1 — czysta decyzja „czy zmiana statusu pary AI↔AI
 * jest wiadomością dla gracza i jaki to rodzaj”. Bez DOM i bez stanu gry (testowalne wprost,
 * tools/diplo-world-news-test.cjs). Wywoływana z setDiploRelation (main.ts) — jedynego
 * miejsca zmiany statusu pary w silniku.
 *
 * PL: Wpis powstaje tylko, gdy status realnie się zmienia i dotyczy wojny (wypowiedzenie,
 * wojna po rozejmie, wojna epoki → 'wojna'; zakończenie wojny → 'pokoj' / 'sojusz').
 * Pary z graczem i barbarzyńcy są wykluczane w main.ts (dla pary z graczem istnieją już wpisy).
 * EN: News entry is produced only on a real status change touching war: any → 'wojna' is
 * 'wojna'; leaving 'wojna' is 'pokoj' (truces are stored as 'pokoj' by the engine) or
 * 'sojusz' when an alliance is the result.
 */

export type WorldDiploNewsKind = 'wojna' | 'pokoj' | 'sojusz';

/** Rodzaj wiadomości dla zmiany statusu `prev` → `next`, albo `null` (brak wpisu). */
export function worldDiploNewsKind(prev: string | undefined, next: string): WorldDiploNewsKind | null {
  if (prev === undefined || prev === next) return null;
  if (next === 'wojna') return 'wojna';
  if (prev !== 'wojna') return null;
  if (next === 'sojusz') return 'sojusz';
  return 'pokoj';
}

/**
 * Warunek widoczności („jeżeli ma odkrytą tę cywilizację”): gracz widzi wiadomość tylko, gdy
 * ma ODKRYTE obie cywilizacje pary. Zbiór `discovered` = `getDiplomaticContacts()` (ten sam
 * predykat, którym dyplomacja decyduje o widoczności innych wpisów pary).
 */
export function worldDiploNewsVisible(a: number, b: number, discovered: ReadonlySet<number>): boolean {
  return discovered.has(a) && discovered.has(b);
}
