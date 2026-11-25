/**
 * R-WEB-DIPLO-WORLD-WAR-PEACE-NEWS-Q1 — czysta decyzja „czy zmiana statusu pary AI↔AI
 * jest wiadomością dla gracza i jaki to rodzaj”. Bez DOM i bez stanu gry (testowalne wprost,
 * tools/diplo-world-news-test.cjs). Wywoływana z setDiploRelation (main.ts) — jedynego
 * miejsca zmiany statusu pary w silniku.
 *
 * PL: Wpis powstaje tylko, gdy status realnie się zmienia i dotyczy wojny (wypowiedzenie,
 * wojna po rozejmie, wojna epoki → 'wojna'; zakończenie wojny → 'pokoj' / 'sojusz').
 * Pary z graczem i barbarzyńcy są wykluczane w main.ts (dla pary z graczem istnieją już wpisy).
 * R-WEB-DIPLO-WORLD-NEWS-IN-DIPLOMACY-WINDOW-Q1: ten sam wpis trafia też do TRWAŁEJ listy
 * „Wydarzenia na świecie” w oknie dyplomacji (worldDiploNewsPush, max WORLD_DIPLO_NEWS_MAX).
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

/**
 * R-WEB-WAR-END-REASON-LOG-Q1 — kod powodu zmiany statusu pary (ustawiany w main.ts tuż przed
 * setDiploRelation przez withDiploWarReason; brak kodu = wpis jak dotąd, bez powodu).
 * EN: reason code for a status change; absent code = entry without reason.
 */
export type WorldDiploReasonCode =
  | 'pokoj_wymuszony_zmeczenie'
  | 'oferta_zmeczenia'
  | 'auto_pokoj_dwa_miasta'
  | 'prosba_o_pokoj_ai'
  | 'pokoj_z_propozycji'
  | 'pokoj_po_rozejmie'
  | 'rozejm_wygasl'
  | 'wojna_epoki'
  | 'wypowiedzenie_ai'
  | 'wypowiedzenie_gracza'
  | 'zdobycie_miasta'
  | 'bunt'
  | 'inny';

/** Powód wpisu przekazywany do worldDiploNewsEntry: kod + tury wojny (dla pokoju po wojnie). */
export interface WorldDiploReason {
  kod: string;
  /** Liczba tur wojny, która się właśnie zakończyła (undefined = nieznana / wojna startuje). */
  turyWojny?: number;
}

/**
 * Polski opis powodu do wpisu „Wydarzenia na świecie”; null dla kodu nieznanego lub 'inny'
 * (wpis zostaje bez powodu). Czysta funkcja.
 */
export function worldDiploReasonLabel(kod: string, turyWojny?: number): string | null {
  switch (kod) {
    case 'pokoj_wymuszony_zmeczenie':
      return turyWojny !== undefined
        ? `Pokój wymuszony po ${turyWojny} turach wojny`
        : 'Pokój wymuszony zmęczeniem wojną';
    case 'oferta_zmeczenia': return 'Pokój z oferty przegranego zmęczonego wojną';
    case 'auto_pokoj_dwa_miasta': return 'Pokój po zdobyciu 2 miast';
    case 'prosba_o_pokoj_ai': return 'Pokój na prośbę przegrywającej cywilizacji';
    case 'pokoj_z_propozycji': return 'Pokój z propozycji';
    case 'pokoj_po_rozejmie': return 'Pokój po zakończeniu rozejmu';
    case 'rozejm_wygasl': return 'Rozejm wygasł, wojna wraca';
    case 'wojna_epoki': return 'Wojna epoki';
    case 'wypowiedzenie_ai': return 'Wypowiedzenie wojny przez AI';
    case 'wypowiedzenie_gracza': return 'Wypowiedzenie wojny przez gracza';
    case 'zdobycie_miasta': return 'Zdobycie miasta';
    case 'bunt': return 'Bunt miasta';
    default: return null;
  }
}

/** Wpis dziennika Wydarzeń (kształt zgodny z warEventLog w main.ts) + pola trwałej listy. */
export interface WorldDiploNewsEntry {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  kind: 'diplo';
  turnCreated: number;
  /** Strony pary (widoczność sprawdzana także przy wyświetlaniu trwałej listy). */
  a: number;
  b: number;
  /** Rodzaj do wyświetlenia w liście; 'rozejm' = pokój z truceUntilTurn w silniku. */
  newsKind: 'wojna' | 'pokoj' | 'rozejm' | 'sojusz';
  /** Polski opis powodu (R-WEB-WAR-END-REASON-LOG-Q1); brak = wpis bez powodu (stare zapisy). */
  powod?: string;
}

/** Ile ostatnich wpisów trzyma trwała lista „Wydarzenia na świecie” w oknie dyplomacji. */
export const WORLD_DIPLO_NEWS_MAX = 20;

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
  /** true, gdy silnik zapisuje pokój jako rozejm (relacja 'pokoj' z truceUntilTurn). */
  truce?: boolean;
  /** Powód zmiany statusu (R-WEB-WAR-END-REASON-LOG-Q1); brak = wpis jak dotąd. */
  powod?: WorldDiploReason;
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
  const isTruce = kind === 'pokoj' && p.truce === true;
  const pairLabel = p.labelA + ' i ' + p.labelB;
  const newsKind: WorldDiploNewsEntry['newsKind'] =
    isWar ? 'wojna' : kind === 'sojusz' ? 'sojusz' : isTruce ? 'rozejm' : 'pokoj';
  const powodTekst = p.powod ? worldDiploReasonLabel(p.powod.kod, p.powod.turyWojny) : null;
  const baseSubtitle = isWar
      ? 'Wojna między innymi cywilizacjami'
      : kind === 'sojusz'
        ? 'Sojusz zawarty po wojnie między innymi cywilizacjami'
        : isTruce
          ? 'Rozejm między innymi cywilizacjami'
          : 'Zawarcie pokoju między innymi cywilizacjami';
  return {
    id: `ai-diplo-news-${p.turn}-${p.pairKey}-${kind}`,
    icon: isWar ? '⚔' : '☮',
    title: (isWar ? 'Wojna: ' : kind === 'sojusz' ? 'Sojusz: ' : isTruce ? 'Rozejm: ' : 'Pokój: ') + pairLabel,
    subtitle: powodTekst !== null ? baseSubtitle + ' · ' + powodTekst : baseSubtitle,
    kind: 'diplo',
    turnCreated: p.turn,
    a: p.a,
    b: p.b,
    newsKind,
    ...(powodTekst !== null ? { powod: powodTekst } : {}),
  };
}

/**
 * Trwała lista: dopisuje wpis na POCZĄTEK (najnowszy pierwszy), bez duplikatu id, przycina do
 * WORLD_DIPLO_NEWS_MAX. Nie modyfikuje `list` — zwraca nową tablicę.
 */
export function worldDiploNewsPush(
  list: readonly WorldDiploNewsEntry[],
  entry: WorldDiploNewsEntry,
): WorldDiploNewsEntry[] {
  if (list.some(e => e.id === entry.id)) return list.slice(0, WORLD_DIPLO_NEWS_MAX);
  return [entry, ...list].slice(0, WORLD_DIPLO_NEWS_MAX);
}

/**
 * Odczyt zapisu: brak pola lub zły typ → pusta lista (migracja starych zapisów); pozycje
 * niepełne są pomijane; wynik przycięty do WORLD_DIPLO_NEWS_MAX.
 */
export function worldDiploNewsSanitize(raw: unknown): WorldDiploNewsEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: WorldDiploNewsEntry[] = [];
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue;
    const e = r as Record<string, unknown>;
    if (typeof e.id !== 'string' || typeof e.title !== 'string' || typeof e.subtitle !== 'string') continue;
    if (typeof e.turnCreated !== 'number' || typeof e.a !== 'number' || typeof e.b !== 'number') continue;
    const nk = e.newsKind;
    if (nk !== 'wojna' && nk !== 'pokoj' && nk !== 'rozejm' && nk !== 'sojusz') continue;
    out.push({
      id: e.id,
      icon: typeof e.icon === 'string' ? e.icon : '',
      title: e.title,
      subtitle: e.subtitle,
      kind: 'diplo',
      turnCreated: e.turnCreated,
      a: e.a,
      b: e.b,
      newsKind: nk,
      ...(typeof e.powod === 'string' ? { powod: e.powod } : {}),
    });
  }
  return out.slice(0, WORLD_DIPLO_NEWS_MAX);
}

/** Pozycje trwałej listy widoczne przy danym zbiorze odkrytych (ten sam warunek co przy zapisie). */
export function worldDiploNewsVisibleList(
  list: readonly WorldDiploNewsEntry[],
  discovered: ReadonlySet<number>,
): WorldDiploNewsEntry[] {
  return list.filter(e => worldDiploNewsVisible(e.a, e.b, discovered));
}
