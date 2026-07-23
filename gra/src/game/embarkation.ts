/**
 * embarkation.ts — TEMAT #15: embarkacja jednostek lądowych (gracz + AI + Ludy Morza).
 * Pure functions only — no DOM, no THREE, no main.ts. Deterministyczne.
 *
 * Reguły (backlog właściciela, „agresja AI + pływanie + embarkacja"):
 *   - jednostka LĄDOWA może wejść na heks wody (Morze/Wybrzeże) po zbadaniu
 *     technologii Żegluga → staje się „zaokrętowana" (RuntimeUnit.embarked),
 *   - ruch po wodzie: stały koszt EMBARKED_WATER_MOVE_COST za heks (setup.ts),
 *   - BRAK ataku z wody (bramka w main.ts: openPlayerMapUnitAttack / AI / barbarzyńcy),
 *   - obrona na wodzie ×EMBARK_DEFENSE_MULT (−50%, effectiveDefenderM w main.ts),
 *   - automatyczne zejście na ląd przy wejściu na heks lądowy (applyEmbarkStateAfterMove),
 *   - zapis stanu: pole `embarked` na RuntimeUnit jedzie w save razem z units[]
 *     (stare save'y bez pola = jednostka niezaokrętowana — wstecznie kompatybilne).
 */

import type { GameMap } from '../types/map';
import type { Hex } from '../types/hex';
import type { RuntimeUnit } from '../units/setup';
import { keyOf, isWaterTerrain, embarkMoveCost, terrainMoveCost } from '../units/setup';

/** Slug technologii wymaganej do embarkacji (tech.json „Technologia"). */
export const EMBARK_TECH = 'Żegluga';

/** Mnożnik obrony jednostki zaokrętowanej (−50%). */
export const EMBARK_DEFENSE_MULT = 0.5;

/**
 * Czy jednostka może się zaokrętować (wejść na wodę), gdy jej właściciel
 * zna Żeglugę. Jednostki morskie (kategoria 'galera') nie embarkują —
 * są łodziami same w sobie. Jednostka już zaokrętowana zawsze może pływać
 * (wraca na ląd niezależnie od techa — nie może utknąć na wodzie).
 */
export function canUnitEmbark(
  unit: Pick<RuntimeUnit, 'category' | 'embarked'>,
  ownerHasSeafaring: boolean,
): boolean {
  if (unit.embarked === true) return true;
  if (unit.category === 'galera') return false;
  return ownerHasSeafaring;
}

/**
 * Funkcja kosztu ruchu dla danej jednostki: woda przejezdna (embarkMoveCost)
 * gdy jednostka może się zaokrętować, w przeciwnym razie undefined
 * (wywołujący używa domyślnego terrainMoveCost — woda nieprzejezdna).
 */
export function moveCostFnFor(
  unit: Pick<RuntimeUnit, 'category' | 'embarked'>,
  ownerHasSeafaring: boolean,
): ((hex: Hex) => number) | undefined {
  return canUnitEmbark(unit, ownerHasSeafaring) ? embarkMoveCost : undefined;
}

/** Czy heks (q,r) na mapie jest wodą (Morze/Wybrzeże). Brak heksa = false. */
export function isWaterHexAt(map: GameMap, q: number, r: number): boolean {
  const hex = map.hexes[keyOf(q, r)];
  return hex !== undefined && isWaterTerrain(hex.terenBazowy);
}

/**
 * Po ruchu: ustawia stan embarkacji jednostek wg terenu, na którym stoją
 * (woda → embarked=true, ląd → pole usuwane — automatyczne zejście na ląd).
 * Mutuje jednostki. Zwraca true, gdy cokolwiek się zmieniło (sygnał dla
 * renderu, żeby przebudować tokeny — łódka pod modelem).
 */
export function applyEmbarkStateAfterMove(
  units: RuntimeUnit[],
  map: GameMap,
): boolean {
  let changed = false;
  for (const u of units) {
    const onWater = isWaterHexAt(map, u.q, u.r);
    if (onWater && u.embarked !== true) {
      u.embarked = true;
      changed = true;
    } else if (!onWater && u.embarked === true) {
      delete u.embarked;
      changed = true;
    }
  }
  return changed;
}

/**
 * Najbliższy przejezdny heks WODY sąsiadujący (promień 1–2) z (q,r), wolny od
 * jednostek — do powrotu rajderów w morze i spawnu z obozów nadmorskich.
 * Deterministyczne (stała kolejność sąsiadów). null gdy brak.
 */
export function nearestFreeWaterHex(
  map: GameMap,
  q: number,
  r: number,
  occupied: ReadonlySet<string>,
): { q: number; r: number } | null {
  const NEI: ReadonlyArray<readonly [number, number]> = [
    [+1, 0], [-1, 0], [0, +1], [0, -1], [+1, -1], [-1, +1],
  ];
  const isFreeWater = (nq: number, nr: number): boolean => {
    const k = keyOf(nq, nr);
    const hex = map.hexes[k];
    if (hex === undefined || occupied.has(k)) return false;
    return isWaterTerrain(hex.terenBazowy);
  };
  for (const [dq, dr] of NEI) {
    if (isFreeWater(q + dq, r + dr)) return { q: q + dq, r: r + dr };
  }
  const seen = new Set<string>([keyOf(q, r)]);
  for (const [dq, dr] of NEI) {
    for (const [dq2, dr2] of NEI) {
      const nq = q + dq + dq2;
      const nr = r + dr + dr2;
      const k = keyOf(nq, nr);
      if (seen.has(k)) continue;
      seen.add(k);
      if (isFreeWater(nq, nr)) return { q: nq, r: nr };
    }
  }
  return null;
}

/** Re-eksport dla testów (jedno miejsce importu w harnessie). */
export { isWaterTerrain, embarkMoveCost, terrainMoveCost };
