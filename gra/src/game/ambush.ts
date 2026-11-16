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
    u.ruchLeft = 0;
  }
}

/**
 * Odwołuje zasadzkę (bez kosztu ruchu). Używane przy ręcznym odwołaniu przez gracza.
 */
export function cancelAmbush(stack: RuntimeUnit[]): void {
  for (const u of stack) {
    if (u.ambush !== undefined) delete u.ambush;
  }
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
  for (const u of revealed) delete u.ambush;
  return { triggered: true, ambushOwnerId, revealed };
}

/**
 * Łagodna normalizacja przy wczytaniu: pole inne niż `true` (np. stary zapis, `null`)
 * oznacza brak zasadzki. Zwraca true, gdy pole zostało usunięte/poprawione.
 */
export function normalizeAmbushField(u: { ambush?: unknown }): boolean {
  if (u.ambush === undefined || u.ambush === true) return false;
  delete (u as { ambush?: unknown }).ambush;
  return true;
}
