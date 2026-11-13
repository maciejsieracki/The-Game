/**
 * R-WEB-DETERMINISM-GAME-RNG-Q1 — generatory z ziarnem dla ścieżek tury.
 *
 * Cel: to samo ziarno gry (`_gameSeed`) + ta sama tura + ten sam identyfikator strumienia
 * (salt, np. 'cs-war', 'scout') daje identyczny ciąg liczb. Zastępuje nieseedowane `Math.random`
 * w pętli tury. Nie zmienia rozkładu losowości dla gracza (ziarno nowej gry nadal losowe).
 *
 * Czysty moduł: bez zależności od DOM/stanu gry, bez `Math.random`.
 */

/** mulberry32 — deterministyczny generator [0,1) z 32-bitowego ziarna. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash FNV-1a 32-bit dla łańcucha (salt strumienia). */
export function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Miesza liczby całkowite w jedno 32-bitowe ziarno (kolejność argumentów ma znaczenie). */
export function mixSeed(...parts: number[]): number {
  let h = 0x9e3779b9;
  for (const p of parts) {
    let x = (p | 0) >>> 0;
    x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
    x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
    x ^= x >>> 16;
    h = Math.imul(h ^ x, 0x27d4eb2d) >>> 0;
    h ^= h >>> 15;
  }
  return h >>> 0;
}

/**
 * Strumień losowy dla jednego miejsca wywołania w jednej turze.
 * @param gameSeed ziarno gry (`_gameSeed`)
 * @param turn numer tury
 * @param salt stała nazwa miejsca wywołania (np. 'scout-auto-explore')
 * @param ownerId właściciel (0 gdy nie dotyczy)
 */
export function gameStreamRng(gameSeed: number, turn: number, salt: string, ownerId = 0): () => number {
  return mulberry32(mixSeed(gameSeed, turn, ownerId, hashStr(salt)));
}

/**
 * Deterministyczny sufiks identyfikatora (base36), unikalny w obrębie przebiegu dzięki `seq`.
 * Zastępuje `Math.random().toString(36).slice(2)` w nadawaniu ID jednostek/obozów.
 */
export function gameIdSuffix(gameSeed: number, turn: number, salt: string, seq: number): string {
  const v = mixSeed(gameSeed, turn, seq, hashStr(salt));
  return v.toString(36);
}
