/**
 * R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 (runda 1) -- akcja armii „Zasadzka".
 *
 * Reguły (decyzje ABC właściciela 2026-11-16):
 *  - Zastawienie zużywa CAŁĄ pulę ruchu stosu (jak fortyfikacja). Działa na dowolnym
 *    heksie POZA miastem; zablokowane z powodem, gdy armia w mieście, oblega, ma 0 ruchu,
 *    jest w bitwie albo jest już w zasadzce.
 *  - Stan trwa, dopóki armia się nie ruszy, nie wejdzie w nią wróg (w wojnie) albo
 *    gracz jej nie odwoła. Utrzymanie jednostek bez zmian.
 *  - Dla WROGA (każdy inny właściciel) jednostki w zasadzce są NIEWIDOCZNE: nie liczą się
 *    jako zajęcie heksu (pathfinding wroga traktuje heks jako wolny) i nie są rysowane.
 *    Dla właściciela stos jest widoczny (oznaczenie „w zasadzce” po stronie UI).
 *  - Wyzwalacz: wrogi ruch (właściciel w WOJNIE z właścicielem zasadzki) wchodzący na
 *    heks zasadzki zatrzymuje się na tym heksie; zasadzka zostaje zdjęta i otwiera się
 *    bitwa. Wróg stojący obok nie uruchamia zasadzki. Wobec nie-wrogów (pokój/rozejm/
 *    sojusz) zasadzka nie jest aktywna: nie odpala i nie blokuje.
 *  - Stan jest polem opcjonalnym `RuntimeUnit.ambush`; brak pola = brak zasadzki
 *    (kompatybilność wsteczna zapisów).
 *
 * Moduł jest czysty (bez DOM, bez stanu globalnego) -- zależności od świata gry
 * (czy heks ma miasto, czy trwa bitwa, czy dwa właściciele są w wojnie) przychodzą
 * jako parametry, żeby reguły dało się testować na realnych funkcjach.
 *
 * Poza zakresem tej rundy (patrz raport): rozstawienie wojsk w bitwie, decyzja AI
 * „kiedy zastawić”, integracja pathfindingu/renderu/mgły z main.ts.
 */
import type { RuntimeUnit } from '../units/setup';

/** Maksymalna szerokość długiej linii zaskoczonych jednostek w bitwie (rozstawienie -- runda 2). */
export const AMBUSH_FORMATION_MAX_WIDTH = 3;

export type AmbushBlockReason =
  | 'empty'
  | 'in-city'
  | 'besieging'
  | 'no-movement'
  | 'in-battle'
  | 'already-ambushed';

export interface AmbushSetContext {
  /** Heks stosu ma miasto (dowolnego właściciela) -- zasadzka tylko poza miastem. */
  cityOnHex: boolean;
  /** Trwa bitwa (scena bitwy otwarta). */
  inBattle: boolean;
}

/** Polskie komunikaty powodów blokady (wyświetlane w tooltipie przycisku). */
export const AMBUSH_BLOCK_MESSAGES: Readonly<Record<AmbushBlockReason, string>> = {
  'empty': 'Brak jednostek do zasadzki.',
  'in-city': 'Armia w mieście nie może zastawić zasadzki.',
  'besieging': 'Oblegająca armia nie może zastawić zasadzki.',
  'no-movement': 'Armia nie ma ruchu do zużycia na zasadzkę.',
  'in-battle': 'Nie można zastawić zasadzki w trakcie bitwy.',
  'already-ambushed': 'Armia jest już w zasadzce.',
};

export type AmbushCheck =
  | { ok: true }
  | { ok: false; reason: AmbushBlockReason; message: string };

/** Czy jednostka jest w zasadzce (tylko jawne `true`; brak pola = nie). */
export function isUnitAmbushed(u: Pick<RuntimeUnit, 'ambush'>): boolean {
  return u.ambush === true;
}

/** Czy stos (ta sama armia) jest w zasadzce -- wystarczy, że którakolwiek jednostka ma stan. */
export function isStackAmbushed(stack: ReadonlyArray<Pick<RuntimeUnit, 'ambush'>>): boolean {
  return stack.some(isUnitAmbushed);
}

/** Łączny ruch stosu (minimum z jednostek -- tak jak w resztę akcji stosu). */
function stackMovementLeft(stack: ReadonlyArray<Pick<RuntimeUnit, 'ruchLeft'>>): number {
  if (stack.length === 0) return 0;
  return Math.min(...stack.map(u => u.ruchLeft));
}

/**
 * Sprawdza, czy stos może zastawić zasadzkę. Kolejność powodów: pusty stos,
 * bitwa, miasto na heksie, oblężenie, już w zasadzce, brak ruchu.
 */
export function canSetAmbush(
  stack: ReadonlyArray<RuntimeUnit>,
  ctx: AmbushSetContext,
): AmbushCheck {
  const fail = (reason: AmbushBlockReason): AmbushCheck =>
    ({ ok: false, reason, message: AMBUSH_BLOCK_MESSAGES[reason] });
  if (stack.length === 0) return fail('empty');
  if (ctx.inBattle) return fail('in-battle');
  if (ctx.cityOnHex) return fail('in-city');
  if (stack.some(u => typeof u.oblegaCityId === 'string' && u.oblegaCityId.length > 0)) {
    return fail('besieging');
  }
  if (isStackAmbushed(stack)) return fail('already-ambushed');
  if (stackMovementLeft(stack) <= 0) return fail('no-movement');
  return { ok: true };
}

/**
 * Zastawia zasadzkę na stosie: ustawia stan na każdej jednostce i zeruje całą pulę
 * ruchu stosu. Nie sprawdza reguł -- wołający ma najpierw wywołać canSetAmbush.
 */
export function setAmbush(stack: RuntimeUnit[]): void {
  for (const u of stack) {
    u.ambush = true;
    u.ambushAt = ambushStamp(u);
    u.ruchLeft = 0;
  }
}

/**
 * Odwołuje zasadzkę (bez kosztu ruchu). Używane przy ręcznym odwołaniu przez gracza.
 */
export function cancelAmbush(stack: RuntimeUnit[]): void {
  for (const u of stack) clearAmbushState(u);
}

/** Pieczec miejsca zasadzki: heks + wlasciciel. Zmiana (ruch, odwrot, zmiana wlasciciela) = zasadzka wygasa. */
function ambushStamp(u: Pick<RuntimeUnit, 'q' | 'r' | 'ownerId'>): string {
  return u.q + ',' + u.r + ',' + u.ownerId;
}

function clearAmbushState(u: RuntimeUnit): boolean {
  const had = u.ambush !== undefined || u.ambushAt !== undefined;
  if (u.ambush !== undefined) delete u.ambush;
  if (u.ambushAt !== undefined) delete u.ambushAt;
  return had;
}

/**
 * Cykl zycia zasadzki (pkt 4) -- JEDNO miejsce, wolane z synchronizacji jednostek po kazdej zmianie stanu.
 * Zdejmuje zasadzke jednostce, ktora: zmienila heks lub wlasciciela (ruch, odwrot po bitwie, relokacja,
 * podzial stosu -- czesc, ktora odeszla), stoi w miescie, w garnizonie, czuwa (sentry), jest ufortyfikowana w
 * polu albo oblega. Dodatkowo spojnosc grupy: stos (wlasciciel + heks + stackGroupId) jest ALBO caly w zasadzce,
 * ALBO wcale -- dolaczenie widocznej jednostki (scalenie) ujawnia caly stos; reszta po PODZIALE zostaje.
 * `hasCityAt(q, r)` = czy heks ma miasto. Zwraca liczbe jednostek, ktorym zdjeto stan.
 */
export function reconcileAmbush(
  units: RuntimeUnit[],
  hasCityAt: (q: number, r: number) => boolean,
): number {
  if (!units.some(u => u.ambush !== undefined || u.ambushAt !== undefined)) return 0;
  let n = 0;
  for (const u of units) {
    if (u.ambush === undefined && u.ambushAt === undefined) continue;
    if (u.ambush !== true) { if (clearAmbushState(u)) n++; continue; }
    if (u.ambushAt === undefined) { u.ambushAt = ambushStamp(u); }
    const bad = u.ambushAt !== ambushStamp(u)
      || u.inGarnizon === true
      || u.sentry === true
      || u.ufortyfikowanyWPolu === true
      || (typeof u.oblegaCityId === 'string' && u.oblegaCityId.length > 0)
      || hasCityAt(u.q, u.r);
    if (bad && clearAmbushState(u)) n++;
  }
  // Spojnosc grupy (stos = wlasciciel + heks + stackGroupId).
  const groups = new Map<string, RuntimeUnit[]>();
  for (const u of units) {
    if (u.inGarnizon === true) continue;
    const k = u.ownerId + '|' + u.q + ',' + u.r + '|' + (u.stackGroupId ?? '');
    const g = groups.get(k);
    if (g === undefined) groups.set(k, [u]); else g.push(u);
  }
  for (const g of groups.values()) {
    if (g.length < 2) continue;
    const amb = g.filter(u => u.ambush === true).length;
    if (amb === 0 || amb === g.length) continue;
    for (const u of g) if (clearAmbushState(u)) n++;
  }
  return n;
}

/**
 * Czy jednostka jest widoczna dla danego właściciela (widza). Jednostki w zasadzce
 * są widoczne tylko dla własnego właściciela; dla wszystkich innych są niewidoczne.
 */
export function isUnitVisibleToViewer(u: Pick<RuntimeUnit, 'ownerId' | 'ambush'>, viewerOwnerId: number): boolean {
  if (!isUnitAmbushed(u)) return true;
  return u.ownerId === viewerOwnerId;
}

/** Lista jednostek widocznych dla widza (ukryte zasadzki odfiltrowane). */
export function unitsVisibleToViewer<T extends Pick<RuntimeUnit, 'ownerId' | 'ambush'>>(
  units: ReadonlyArray<T>,
  viewerOwnerId: number,
): T[] {
  return units.filter(u => isUnitVisibleToViewer(u, viewerOwnerId));
}

/**
 * Czy heks jest zajęty z punktu widzenia widza. Zasadzka wroga NIE zajmuje heksu
 * (pathfinding wroga traktuje go jako wolny). Jednostki własne zawsze liczą się.
 */
export function isHexOccupiedForViewer(
  units: ReadonlyArray<Pick<RuntimeUnit, 'ownerId' | 'ambush' | 'q' | 'r'>>,
  q: number,
  r: number,
  viewerOwnerId: number,
): boolean {
  return units.some(
    u => u.q === q && u.r === r && isUnitVisibleToViewer(u, viewerOwnerId),
  );
}

/** Wynik sprawdzenia wyzwalacza na heksie. */
export interface AmbushTriggerResult {
  triggered: boolean;
  /** Właściciel zasadzki (gdy wyzwolona). */
  ambushOwnerId?: number;
  /** Jednostki zasadzki, które zostały ujawnione (ich stan został zdjęty). */
  revealed: RuntimeUnit[];
}

/**
 * Sprawdza, czy wrogi ruch wchodzący na heks `q,r` uruchamia zasadzkę. Wyzwalacz działa
 * tylko, gdy właściciel zasadzki jest W WOJNIE z poruszającym się właścicielem.
 * Gdy zasadzka się wyzwala, stan `ambush` jest zdejmowany z jej jednostek (ujawnione).
 * Funkcja mutuje wyłącznie jednostki zasadzki wyzwolonej; brak zasadzki = brak mutacji.
 *
 * `isAtWar(a, b)` -- czy właściciele a i b są w wojnie (symetryczne; wołający dostarcza).
 */
export function resolveAmbushTrigger(
  units: RuntimeUnit[],
  q: number,
  r: number,
  moverOwnerId: number,
  isAtWar: (a: number, b: number) => boolean,
): AmbushTriggerResult {
  const hit = units.filter(
    u => u.q === q && u.r === r && isUnitAmbushed(u)
      && u.ownerId !== moverOwnerId && isAtWar(moverOwnerId, u.ownerId),
  );
  const first = hit[0];
  if (first === undefined) return { triggered: false, revealed: [] };
  const ambushOwnerId = first.ownerId;
  // Odkrywamy cały stos zasadzki tego właściciela na heksie (jedna zasadzka = jeden stos).
  const revealed = units.filter(
    u => u.q === q && u.r === r && u.ownerId === ambushOwnerId && isUnitAmbushed(u),
  );
  for (const u of revealed) clearAmbushState(u);
  return { triggered: true, ambushOwnerId, revealed };
}

/** Predykat wojny dostarczany przez wołającego (symetryczny; barbarzyńcy = wróg). */
export type AmbushWarPredicate = (a: number, b: number) => boolean;

/**
 * Czy zasadzka jednostki `u` jest UKRYTA przed poruszającym się właścicielem `moverOwnerId`
 * (i traktowana przez pathfinding jak pusty heks): tylko stos w zasadzce, cudzy, w WOJNIE.
 * Wobec nie-wrogów (pokój/sojusz) heks pozostaje zajęty (brak nakładania jednostek).
 */
export function isAmbushHiddenFromMover(
  u: Pick<RuntimeUnit, 'ownerId' | 'ambush'>,
  moverOwnerId: number,
  isAtWar: AmbushWarPredicate,
): boolean {
  return u.ambush === true && u.ownerId !== moverOwnerId && isAtWar(moverOwnerId, u.ownerId);
}

/** Wynik przycięcia trasy ruchu na pierwszej zasadzce wroga. */
export interface AmbushPathCut<T extends { q: number; r: number }> {
  /** Trasa do heksu PRZED zasadzką (może być pusta: zasadzka tuż przy starcie). */
  path: T[];
  /** Heks zasadzki, w którą ruch wpada; brak = trasa czysta (path = wejście bez zmian). */
  ambushHex?: { q: number; r: number };
}

/**
 * Przycina trasę ruchu `path` (heksy kroków, bez heksu startu) na pierwszym heksie z zasadzką
 * wroga (mover w WOJNIE z właścicielem zasadzki). Ruch kończy się na ostatnim heksie PRZED
 * zasadzką (nie nakłada jednostek), a wołający otwiera bitwę o heks zasadzki.
 */
export function truncatePathAtAmbush<T extends { q: number; r: number }>(
  units: ReadonlyArray<Pick<RuntimeUnit, 'ownerId' | 'ambush' | 'q' | 'r'>>,
  path: ReadonlyArray<T>,
  moverOwnerId: number,
  isAtWar: AmbushWarPredicate,
): AmbushPathCut<T> {
  if (path.length === 0 || !units.some(u => u.ambush === true)) return { path: path.slice() };
  for (let i = 0; i < path.length; i++) {
    const h = path[i]!;
    if (units.some(u => u.q === h.q && u.r === h.r && isAmbushHiddenFromMover(u, moverOwnerId, isAtWar))) {
      return { path: path.slice(0, i), ambushHex: { q: h.q, r: h.r } };
    }
  }
  return { path: path.slice() };
}

/**
 * Polityka cyklu życia: stos po scaleniu/podziale -- zasadzkę zachowują tylko jednostki, które
 * NIE zmieniły heksu ani składu. `movedIds` = jednostki poruszające się/dołączane; zdejmuje im
 * zasadzkę, reszta zostaje. Zwraca liczbę jednostek, którym zdjęto stan.
 */
export function cancelAmbushForUnits(units: RuntimeUnit[], movedIds: ReadonlySet<string>): number {
  let n = 0;
  for (const u of units) {
    if (movedIds.has(u.id) && clearAmbushState(u)) n++;
  }
  return n;
}

/**
 * Łagodna normalizacja przy wczytaniu: pole inne niż `true` (np. stary zapis, `null`)
 * oznacza brak zasadzki. Zwraca true, gdy pole zostało usunięte/poprawione.
 */
export function normalizeAmbushField(u: { ambush?: unknown }): boolean {
  if (u.ambush === undefined || u.ambush === true) return false;
  delete (u as { ambush?: unknown }).ambush;
  delete (u as { ambushAt?: unknown }).ambushAt;
  return true;
}
