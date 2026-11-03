/**
 * R-WEB-EVENTS-DEFER-TO-TURN-START-Q1 — wspolna kolejka odroczenia powiadomien-modali.
 *
 * Regula wlasciciela (2026-11-03): wszystkie informacje, wydarzenia i odkrycia pojawiaja sie
 * PO zakonczeniu ruchow i tur wszystkich innych cywilizacji / panstw-miast, czyli na poczatku
 * nowej tury gracza — a NIE w trakcie ich trwania. WYJATEK (decyzja ABC): dyplomacja wymagajaca
 * odpowiedzi gracza moze pojawic sie od razu.
 *
 * Ten modul jest czysty (zero DOM, zero stanu gry): trzyma FIFO wpisow `{channel, ownerId, fire}`.
 * `main.ts` decyduje przez `shouldDeferNotice(endTurnInProgress, channel)`, czy wpis idzie do
 * kolejki, a na poczatku tury gracza wola `flushFor(aktywnyFotel)`.
 *
 * Toasty (`showHintMessage`) maja wlasna, starsza kolejke (`eot-event-defer.ts`,
 * `deferredEotHints` -> dziennik Wydarzenia); ten modul obejmuje reszte kanalow, ktore wczesniej
 * wyskakiwaly NATYCHMIAST w fazie EOT: modale odkrycia technologii, ukonczenia cudu,
 * zdobycia miasta.
 *
 * Zapis/wczytanie: kolejka jest zawsze oproznana w `finally` przejscia tury, zanim gracz zdola
 * cokolwiek zapisac; trwale slady zdarzen (`warEventLog`: `tech-done-*`, `era-*`) sa dopisywane
 * synchronicznie i zapisuja sie normalnie. Przy Nowej grze / wczytaniu `clear()` zeruje reszte
 * (brak duplikatow po wczytaniu).
 */

/** Kanaly modali odraczane do poczatku tury gracza. */
export type DeferrableNoticeChannel =
  | 'tech-discovery'
  | 'wonder-completed'
  | 'city-capture';

/** Kanaly NIE odraczane (wymagaja odpowiedzi gracza w trakcie) — decyzja wlasciciela. */
export type ImmediateNoticeChannel = 'diplomacy';

export type NoticeChannel = DeferrableNoticeChannel | ImmediateNoticeChannel;

export interface DeferredNotice {
  /** Rosnacy numer kolejnosci wystapienia (stabilny, rozstrzyga kolejnosc flushu). */
  seq: number;
  channel: DeferrableNoticeChannel;
  /** Fotel ludzki, ktoremu zdarzenie nalezy pokazac (hot-seat). */
  ownerId: number;
  fire: () => void;
}

/** Dyplomacja jest jedynym wyjatkiem od odroczenia. */
export function isDeferExemptChannel(channel: NoticeChannel): boolean {
  return channel === 'diplomacy';
}

/** Czy powiadomienie z danego kanalu ma isc do kolejki (faza EOT = tury innych cywilizacji). */
export function shouldDeferNotice(endTurnInProgress: boolean, channel: NoticeChannel): boolean {
  return endTurnInProgress && !isDeferExemptChannel(channel);
}

export interface EventDeferQueue {
  enqueue(channel: DeferrableNoticeChannel, ownerId: number, fire: () => void): void;
  size(): number;
  /** Liczba oczekujacych wpisow dla fotela. */
  sizeFor(ownerId: number): number;
  /**
   * Odpal (w kolejnosci wystapienia) wszystkie wpisy fotela `ownerId`; wpisy innych foteli
   * zostaja w kolejce do ich tury. Wyjatek w jednym wpisie nie gubi pozostalych.
   * Zwraca liczbe odpalonych wpisow.
   */
  flushFor(ownerId: number, onError?: (err: unknown, entry: DeferredNotice) => void): number;
  clear(): void;
  /** Podglad (do testow / diagnostyki). */
  snapshot(): ReadonlyArray<{ seq: number; channel: DeferrableNoticeChannel; ownerId: number }>;
}

export function createEventDeferQueue(): EventDeferQueue {
  let entries: DeferredNotice[] = [];
  let nextSeq = 1;
  return {
    enqueue(channel, ownerId, fire) {
      entries.push({ seq: nextSeq++, channel, ownerId, fire });
    },
    size: () => entries.length,
    sizeFor: (ownerId) => entries.filter(e => e.ownerId === ownerId).length,
    flushFor(ownerId, onError) {
      if (entries.length === 0) return 0;
      const mine = entries.filter(e => e.ownerId === ownerId);
      if (mine.length === 0) return 0;
      // Usun PRZED odpaleniem: wpis odpalony ponownie wolany flush (reentrancja) nie zdubluje sie.
      entries = entries.filter(e => e.ownerId !== ownerId);
      mine.sort((a, b) => a.seq - b.seq);
      let fired = 0;
      for (const e of mine) {
        try {
          e.fire();
          fired++;
        } catch (err) {
          if (onError) onError(err, e);
        }
      }
      return fired;
    },
    clear() {
      entries = [];
    },
    snapshot: () => entries.map(e => ({ seq: e.seq, channel: e.channel, ownerId: e.ownerId })),
  };
}
