/**
 * army-stack-limit.ts — R-WEB-ARMY-STACK-LIMIT-Q1 (decyzja wlasciciela 2026-11-07, ABC).
 *
 * Jedna armia (wszystkie wlasne jednostki jednego wlasciciela na jednym heksie, takze w miescie)
 * NIE MOZE miec wiecej jednostek niz limit bitwy na strone. Limit pochodzi z JEDNEGO zrodla
 * (`BATTLE_MAX_PER_SIDE` w battle/battleScene.ts) i jest tu zawsze PARAMETREM `limit` --
 * modul nie trzyma wlasnej kopii liczby (zadnej drugiej stalej 500).
 *
 * Modul jest czysty (zadnych importow z main.ts / renderu), wiec bramki w main.ts, testy
 * headless i AI korzystaja z tych samych funkcji.
 */

/** Minimalny ksztalt jednostki potrzebny do liczenia stosow. */
export interface StackUnitLike {
  id: string;
  ownerId: number;
  q: number;
  r: number;
}

/** Liczba WLASNYCH jednostek wlasciciela na heksie (wszystkie: pole, garnizon, cywile). */
export function ownUnitCountAt(
  units: ReadonlyArray<StackUnitLike>,
  ownerId: number,
  q: number,
  r: number,
  exceptIds?: ReadonlySet<string> | ReadonlyArray<string>,
): number {
  const skip = exceptIds === undefined ? null : exceptIds instanceof Set ? exceptIds : new Set(exceptIds);
  let n = 0;
  for (const u of units) {
    if (u.ownerId !== ownerId || u.q !== q || u.r !== r) continue;
    if (skip && skip.has(u.id)) continue;
    n++;
  }
  return n;
}

/** Ile jednostek jeszcze zmiesci sie na heksie (>= 0). `exceptIds` = jednostki, ktore wlasnie go opuszczaja. */
export function stackFreeSlots(
  units: ReadonlyArray<StackUnitLike>,
  ownerId: number,
  q: number,
  r: number,
  limit: number,
  exceptIds?: ReadonlySet<string> | ReadonlyArray<string>,
): number {
  return Math.max(0, limit - ownUnitCountAt(units, ownerId, q, r, exceptIds));
}

/**
 * Czy `moving` (n jednostek) moze zakonczyc ruch / sie scalic na heksie (q,r) bez przekroczenia limitu.
 * Jednostki z `moving`, ktore juz stoja na tym heksie, nie sa liczone podwojnie.
 */
export function canJoinStackAt(
  units: ReadonlyArray<StackUnitLike>,
  moving: ReadonlyArray<StackUnitLike>,
  q: number,
  r: number,
  limit: number,
): boolean {
  if (moving.length === 0) return true;
  const ownerId = moving[0]!.ownerId;
  const movingIds = new Set(moving.map(m => m.id));
  const there = ownUnitCountAt(units, ownerId, q, r, movingIds);
  return there + moving.length <= limit;
}

/** Czy w miescie / na heksie jest miejsce na `extra` nowych jednostek (rekrutacja, narodziny, nagroda). */
export function hexHasRoomFor(
  units: ReadonlyArray<StackUnitLike>,
  ownerId: number,
  q: number,
  r: number,
  limit: number,
  extra = 1,
): boolean {
  return ownUnitCountAt(units, ownerId, q, r) + extra <= limit;
}

/**
 * Przytnij sciezke ruchu tak, by OSTATNI heks mial miejsce na caly ruszajacy sie stos
 * (marsz moze skonczyc budzet ruchu na pelnym wlasnym heksie, przez ktory tylko przechodzil).
 * Zwraca przyciety odcinek (moze byc pusty = nie ma gdzie stanac).
 */
export function trimPathToStackRoom<T extends { q: number; r: number }>(
  units: ReadonlyArray<StackUnitLike>,
  moving: ReadonlyArray<StackUnitLike>,
  path: ReadonlyArray<T>,
  limit: number,
): T[] {
  const out = path.slice();
  while (out.length > 0) {
    const last = out[out.length - 1]!;
    if (canJoinStackAt(units, moving, last.q, last.r, limit)) break;
    out.pop();
  }
  return out;
}

export interface StackSplitMove {
  unitId: string;
  fromQ: number;
  fromR: number;
  toQ: number;
  toR: number;
}

export interface StackSplitPlan {
  moves: StackSplitMove[];
  /** Jednostki, dla ktorych nie znaleziono miejsca (zostaja, stos nadal ponad limit). */
  unplaced: string[];
}

/** Szesc kierunkow osiowych w kolejnosci cyklicznej (potrzebnej do obchodu pierscienia). */
const RING_DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1],
];

export interface StackSplitOpts {
  /** Czy na heks (q,r) wolno przeniesc jednostke wlasciciela (teren, obce miasta, obce jednostki, woda...). */
  canPlaceAt: (ownerId: number, q: number, r: number) => boolean;
  /** Maksymalny promien szukania wolnego heksu (domyslnie 6). */
  maxRadius?: number;
}

/** Heksy w odleglosci dokladnie `radius` od (q,r) w stalej, deterministycznej kolejnosci. */
function ringHexes(q: number, r: number, radius: number): Array<{ q: number; r: number }> {
  if (radius === 0) return [{ q, r }];
  const out: Array<{ q: number; r: number }> = [];
  // Kierunki w kolejnosci cyklicznej wokol heksu; start = centrum + RING_DIRS[4] * radius, obchod po 6 bokach.
  let cq = q + RING_DIRS[4]![0] * radius;
  let cr = r + RING_DIRS[4]![1] * radius;
  for (let d = 0; d < 6; d++) {
    for (let i = 0; i < radius; i++) {
      out.push({ q: cq, r: cr });
      cq += RING_DIRS[d]![0];
      cr += RING_DIRS[d]![1];
    }
  }
  return out;
}

/**
 * MIGRACJA / siatka bezpieczenstwa: dla kazdego (wlasciciel, heks) ze stosem wiekszym niz `limit`
 * zaplanuj deterministyczny podzial NADWYZKI na najblizsze wolne heksy (sasiedzi, potem coraz dalsze
 * pierscienie), bez usuwania jednostek. W stosie zostaje pierwsze `limit` jednostek (kolejnosc w tablicy
 * `units`); nadwyzka (kolejne wg tej kolejnosci) trafia do najblizszych heksow, z ktorych kazdy przyjmie
 * do `limit` jednostek (ktore wlasciciel i tak tam ma, wlicza sie). Czysta funkcja -- nie mutuje `units`.
 *
 * Kolejnosc wejsciowa: heksy sortowane po (ownerId, q, r) -- wynik nie zalezy od kolejnosci iteracji Map.
 */
export function planOversizedStackSplits(
  units: ReadonlyArray<StackUnitLike>,
  limit: number,
  opts: StackSplitOpts,
): StackSplitPlan {
  const maxRadius = opts.maxRadius ?? 6;
  const groups = new Map<string, StackUnitLike[]>();
  for (const u of units) {
    const k = u.ownerId + '|' + u.q + ',' + u.r;
    const g = groups.get(k);
    if (g) g.push(u); else groups.set(k, [u]);
  }
  const over = [...groups.values()]
    .filter(g => g.length > limit)
    .sort((a, b) => a[0]!.ownerId - b[0]!.ownerId || a[0]!.q - b[0]!.q || a[0]!.r - b[0]!.r);

  // Licznik "wirtualny" -- uwzglednia juz zaplanowane przeniesienia.
  const virtual = new Map<string, number>();
  const countAt = (ownerId: number, q: number, r: number): number => {
    const k = ownerId + '|' + q + ',' + r;
    const v = virtual.get(k);
    if (v !== undefined) return v;
    const base = groups.get(k)?.length ?? 0;
    virtual.set(k, base);
    return base;
  };
  const bump = (ownerId: number, q: number, r: number, d: number): void => {
    const k = ownerId + '|' + q + ',' + r;
    virtual.set(k, countAt(ownerId, q, r) + d);
  };
  // Czy na heksie stoi OBCA jednostka (nie wolno sie tam przenosic).
  const foreignAt = new Map<string, Set<number>>();
  for (const u of units) {
    const k = u.q + ',' + u.r;
    const s = foreignAt.get(k);
    if (s) s.add(u.ownerId); else foreignAt.set(k, new Set([u.ownerId]));
  }

  const moves: StackSplitMove[] = [];
  const unplaced: string[] = [];
  for (const g of over) {
    const ownerId = g[0]!.ownerId;
    const q0 = g[0]!.q;
    const r0 = g[0]!.r;
    const excess = g.slice(limit);
    let idx = 0;
    for (let radius = 1; radius <= maxRadius && idx < excess.length; radius++) {
      for (const h of ringHexes(q0, r0, radius)) {
        if (idx >= excess.length) break;
        const owners = foreignAt.get(h.q + ',' + h.r);
        if (owners && [...owners].some(o => o !== ownerId)) continue;
        if (!opts.canPlaceAt(ownerId, h.q, h.r)) continue;
        let room = limit - countAt(ownerId, h.q, h.r);
        while (room > 0 && idx < excess.length) {
          const u = excess[idx++]!;
          moves.push({ unitId: u.id, fromQ: q0, fromR: r0, toQ: h.q, toR: h.r });
          bump(ownerId, h.q, h.r, 1);
          bump(ownerId, q0, r0, -1);
          room--;
        }
      }
    }
    while (idx < excess.length) unplaced.push(excess[idx++]!.id);
  }
  return { moves, unplaced };
}

/** Komunikat dla gracza przy zablokowanym ruchu / scaleniu / rekrutacji. */
export function stackLimitBlockMessage(limit: number): string {
  return 'Armia nie może mieć więcej niż ' + limit + ' jednostek (limit bitwy).';
}

/** Komunikat po migracji / podziale stosu ponad limit. */
export function stackLimitSplitNotice(moved: number, limit: number): string {
  return 'Podzielono armie ponad limit ' + limit + ' jednostek: ' + moved + ' jednostek przeniesiono na sąsiednie heksy.';
}
