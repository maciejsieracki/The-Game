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

/** Wpis dziennika Wydarzeń (kształt zgodny z warEventLog w main.ts). */
export interface WorldDiploNewsEntry {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  kind: 'diplo';
  turnCreated: number;
}

export interface WorldDiploNewsInput {
  a: number;
  b: number;
  prevStatus: string | undefined;
  nextStatus: string;
  turn: number;
  /** Klucz pary (diploPairKey w main.ts) — część id wpisu, dedup w turze. */
  pairKey: string;
  labelA: string;
  labelB: string;
  /** `getDiplomaticContacts()` — cywilizacje odkryte przez gracza. */
  discovered: ReadonlySet<number>;
  /** true dla pary z graczem lub barbarzyńcą (wpis tworzą inne ścieżki / nie ma wpisu). */
  skip: boolean;
}

/**
 * Pełna decyzja i budowa wpisu: null, gdy brak wiadomości (brak zmiany wojny/pokoju, pominięta
 * para, strona nieodkryta). Czysta funkcja — testowana wprost w tools/diplo-world-news-test.cjs.
 */
export function worldDiploNewsEntry(p: WorldDiploNewsInput): WorldDiploNewsEntry | null {
  const kind = worldDiploNewsKind(p.prevStatus, p.nextStatus);
  if (kind === null) return null;
  if (p.skip) return null;
  if (!worldDiploNewsVisible(p.a, p.b, p.discovered)) return null;
  const isWar = kind === 'wojna';
  const pairLabel = p.labelA + ' i ' + p.labelB;
  return {
    id: `ai-diplo-news-${p.turn}-${p.pairKey}-${kind}`,
    icon: isWar ? '⚔' : '☮',
    title: (isWar ? 'Wojna: ' : kind === 'sojusz' ? 'Sojusz: ' : 'Pokój: ') + pairLabel,
    subtitle: isWar
      ? 'Wojna między innymi cywilizacjami'
      : kind === 'sojusz' ? 'Sojusz zawarty po wojnie między innymi cywilizacjami' : 'Zawarcie pokoju między innymi cywilizacjami',
    kind: 'diplo',
    turnCreated: p.turn,
  };
}
