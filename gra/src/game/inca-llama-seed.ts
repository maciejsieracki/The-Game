/**
 * inca-llama-seed.ts — POSIEW LAMY przy starcie Inków (decyzja 3a, Maciej 2026-07-09).
 *
 * Generator mapy NIE jest dotykany (hash kontrolny map NIETKNIĘTY). Po wygenerowaniu mapy,
 * przy przydziale startu, gdy w grze są Inkowie, gra DOSTAWIA 2–3 złoża `ZlozeLamy` na
 * wzgórzach/górach regionu startowego każdego Inki — deterministycznie z ziarna mapy + pozycji
 * startu (bez rand() generatora). Brak Inków w rozgrywce → brak lam.
 *
 * Lama-improvement dozwolona na {Wzgórza, Góry} (improvement-build.ts) — złoża sadzimy tam samo.
 */
import { Nakladka, TerenBazowy } from '../types/hex';
import type { GameMap } from '../types/map';
import { hexKeysWithinRadius } from './okolica';

/** Promień regionu startowego, w którym dosiewamy lamy (heksy). */
export const LLAMA_START_RADIUS = 3;
/** Ile złóż lamy na jeden start Inków (o ile starczy wzgórz/gór). */
export const LLAMA_PER_START = 3;

/** Deterministyczny hash pozycji + ziarna (xorshift/imul) — bez Math.random, bez generatora. */
function hashPos(seed: number, q: number, r: number): number {
  let h = (Math.imul(q | 0, 0x27d4eb2d)
    ^ Math.imul(r | 0, 0x165667b1)
    ^ Math.imul(seed | 0, 0x9e3779b1)) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

/**
 * Dosiewa złoża `ZlozeLamy` wokół startów Inków. Zwraca liczbę posianych złóż.
 * @param avoid  heksy do pominięcia (miasta / dokładne heksy startowe) — bez lamy pod miastem.
 */
export function seedIncaLlamaDeposits(
  map: GameMap,
  seed: number,
  incaStarts: ReadonlyArray<{ q: number; r: number }>,
  avoid: ReadonlySet<string> = new Set(),
  perStart = LLAMA_PER_START,
  radius = LLAMA_START_RADIUS,
): number {
  let seeded = 0;
  const usedGlobal = new Set<string>(); // ten sam heks nie liczony dwa razy (nakładające się regiony)
  for (const start of incaStarts) {
    const candidates: Array<{ key: string; h: number }> = [];
    for (const key of hexKeysWithinRadius(start.q, start.r, radius, map)) {
      if (avoid.has(key) || usedGlobal.has(key)) continue;
      const hex = map.hexes[key];
      if (!hex) continue;
      const t = hex.terenBazowy;
      if (t !== TerenBazowy.Wzgorza && t !== TerenBazowy.Gory) continue; // lama: wzgórza/góry
      if (hex.nakladka !== Nakladka.Brak) continue; // nie nadpisuj lasu / istniejących złóż
      if ((hex as { zloze?: string }).zloze) continue; // nie na złożu metali/soli (runtime-only pole)
      candidates.push({ key, h: hashPos(seed, hex.coords.q, hex.coords.r) });
    }
    candidates.sort((a, b) => a.h - b.h); // deterministyczny wybór
    for (let i = 0; i < candidates.length && i < perStart; i++) {
      const key = candidates[i]!.key;
      map.hexes[key]!.nakladka = Nakladka.ZlozeLamy;
      usedGlobal.add(key);
      seeded++;
    }
  }
  return seeded;
}
