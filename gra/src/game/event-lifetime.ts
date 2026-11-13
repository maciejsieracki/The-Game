/**
 * R-WEB-EVENTS-ONE-TURN-LIFETIME-Q1 — wspolny mechanizm czasu zycia wydarzen informacyjnych.
 *
 * Regula wlasciciela (2026-11-04): wydarzenie informacyjne zyje JEDNA ture gracza. Powstaje na
 * poczatku tury (po turach innych cywilizacji), a jesli nie zostanie przeczytane lub usuniete,
 * przy przejsciu do nastepnej tury znika i NIE wraca. W nowej turze widac tylko wydarzenia
 * powstale w tej nowej turze.
 *
 * Modul czysty (zero DOM, zero stanu gry). Kazdy wpis dziennika wydarzen dostaje `turnCreated`
 * (`stampEventTurn`); na granicy tury (`turn++`) `expireEventsBeforeTurn` usuwa z kazdego dziennika
 * wpisy starsze niz biezaca tura. Wpis BEZ `turnCreated` (zapomniany producent) traktujemy jako
 * przeterminowany — wygasa przy najblizszym przejsciu tury, bez bledu.
 *
 * WYJATEK (decyzyjne): karty `blocking:true` (bunt, kolejka produkcji, propozycje dyplomatyczne)
 * nie sa wpisami dziennikow — `collectTurnEvents()` buduje je z zywego stanu gry i znikaja dopiero
 * po rozstrzygnieciu decyzji. Ten modul ich nie dotyka; dodatkowo `expireEventsBeforeTurn`
 * nigdy nie usuwa wpisu z `blocking:true`.
 */

export interface TurnStampedEvent {
  id: string;
  /** Numer tury gracza, w ktorej wpis powstal. */
  turnCreated?: number;
  blocking?: boolean;
}

/** Zwraca wpis oznaczony numerem tury utworzenia (nie nadpisuje istniejacego znacznika). */
export function stampEventTurn<T extends TurnStampedEvent>(event: T, turn: number): T {
  if (event.turnCreated !== undefined) return event;
  return { ...event, turnCreated: turn };
}

/** Czy wpis jest nadal zywy w turze `currentTurn` (utworzony w tej turze lub pozniej / decyzyjny). */
export function isEventLiveInTurn(event: TurnStampedEvent, currentTurn: number): boolean {
  if (event.blocking === true) return true;
  return event.turnCreated !== undefined && event.turnCreated >= currentTurn;
}

/**
 * Usun z dziennika (w miejscu) wpisy utworzone przed `currentTurn`. Zwraca usuniete wpisy
 * (wolajacy moze zwolnic powiazane szczegoly modali / mapy celow).
 */
export function expireEventsBeforeTurn<T extends TurnStampedEvent>(log: T[], currentTurn: number): T[] {
  const removed: T[] = [];
  let w = 0;
  for (let i = 0; i < log.length; i++) {
    const e = log[i]!;
    if (isEventLiveInTurn(e, currentTurn)) log[w++] = e;
    else removed.push(e);
  }
  log.length = w;
  return removed;
}
