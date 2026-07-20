/**
 * villages.ts
 * Neutralne WIOSKI (goodie huts) — rzadkie punkty na mapie świata, rozmieszczane
 * RAZ przy generacji mapy (analogicznie do spawnCamps() w game/barbarians.ts, ale
 * jednorazowo, nie co turę). Pierwsze wejście jednostki gracza na wioskę daje
 * nagrodę (main.ts), po czym wioska znika (hex.wioska.istnieje = false).
 *
 * Pure logic — no DOM, no THREE. Deterministyczny LCG shuffle seedowany `seed`
 * (ten sam wzór co spawnCamps), więc ta sama mapa dla tego samego seeda zawsze
 * daje te same wioski (bramka map-gen-regression-test: determinizm A=B).
 *
 * Samodzielny moduł w warstwie map/ (nie importuje game/barbarians.ts, żeby
 * uniknąć zależności map/ -> game/ — spójnie z hexDistanceAxial lokalną kopią
 * w gen-helpers.ts).
 */

import type { Hex } from '../types/hex';
import { TerenBazowy } from '../types/hex';
import { hexDistanceAxial } from './gen-helpers';

// ---------------------------------------------------------------------------
// TUNING: wartości do playtestu
// ---------------------------------------------------------------------------

/**
 * Ile heksów lądowych (Morze/Wybrzeże wykluczone z liczenia) przypada na jedną
 * wioskę. Liczba wiosek = round(landHexCount / VILLAGE_LAND_HEX_PER_VILLAGE),
 * min. 1. Zmierzone na realnych mapach 'kontynenty' (ląd tu wychodzi ~20% —
 * mniej niż mogłoby się wydawać z rozmiaru siatki): z N=140 wychodzi
 * maly(108×74)≈10, standardowy(168×120)≈29, duzy(240×168)≈65 wiosek —
 * "kilkanaście do kilkadziesiąt" w zależności od rozmiaru mapy.
 */
export const VILLAGE_LAND_HEX_PER_VILLAGE = 140;

/** Minimalny dystans (heksy) wioski od dowolnego miasta / pozycji startowej. */
export const VILLAGE_MIN_DIST_FROM_CITY = 4;

/** Minimalny dystans (heksy) wioski od innej wioski oraz od obozu barbarzyńców. */
export const VILLAGE_MIN_SPACING = 5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Pozycja wioski wybrana przez placeVillages(). */
export interface VillageSite {
  q: number;
  r: number;
}

/** Minimalny kształt "ma q/r" dla miast / obozów barbarzyńców (wykluczenia). */
export interface QRLike {
  q: number;
  r: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Numerical Recipes 32-bit LCG — ten sam wzór co spawnCamps() w barbarians.ts. */
function lcgNext(state: number): [number, number] {
  const next = (state * 1664525 + 1013904223) >>> 0;
  return [next, next / 0x100000000];
}

/** Teren, na którym wioska nigdy nie może stanąć (woda/wybrzeże/góry/pustynia). */
function isVillageExcludedTerrain(t: TerenBazowy): boolean {
  return (
    t === TerenBazowy.Morze ||
    t === TerenBazowy.Wybrzeze ||
    t === TerenBazowy.Gory ||
    t === TerenBazowy.Pustynia
  );
}

// ---------------------------------------------------------------------------
// placeVillages
// ---------------------------------------------------------------------------

/**
 * Wybiera pozycje NOWYCH wiosek (nie mutuje `hexes`) i zwraca je jako listę.
 * Wołane RAZ w generateMap() po finalizacji lądu/wybrzeża (obok placeDeposits),
 * z `cities` = wyliczone pozycje startowe (computeStartPositions) — bo w tym
 * momencie generacji żadne prawdziwe City jeszcze nie istnieje — i `existingCamps`
 * = [] (obozy barbarzyńców spawnują się dopiero w trakcie gry, per turę).
 *
 * Zasady wyboru miejsca (identyczne w duchu do spawnCamps):
 *   - heks istnieje w mapie, niczyj (wlasciciel === null),
 *   - teren PRZECHODNI i zamieszkiwalny: NIE Morze/Wybrzeże/Góry/Pustynia,
 *   - co najmniej `minDistFromCity` od każdego miasta/pozycji startowej,
 *   - co najmniej `spacing` od każdego istniejącego obozu barbarzyńców i od
 *     każdej innej NOWO wybranej wioski.
 *
 * Kolejność kandydatów jest tasowana deterministycznie z `seed` (LCG
 * Fisher-Yates) — te same wejścia zawsze dają te same wioski.
 *
 * Liczba wiosek = round(landHexCount / landHexPerVillage), min. 1, gdzie
 * landHexCount liczy WSZYSTKIE heksy lądowe (bez Morza/Wybrzeża) — niezależnie
 * od tego czy dany heks akurat kwalifikuje się jako kandydat (Góry/Pustynia się
 * liczą do "lądu", ale nie mogą przyjąć wioski).
 *
 * @returns lista nowych pozycji wiosek (możliwe pusta, gdy brak miejsca).
 */
export function placeVillages(
  hexes: Record<string, Hex>,
  cities: ReadonlyArray<QRLike>,
  existingCamps: ReadonlyArray<QRLike>,
  seed: number,
  opts?: {
    minDistFromCity?: number;
    spacing?: number;
    landHexPerVillage?: number;
  },
): VillageSite[] {
  const minDistFromCity = opts?.minDistFromCity ?? VILLAGE_MIN_DIST_FROM_CITY;
  const spacing = opts?.spacing ?? VILLAGE_MIN_SPACING;
  const landHexPerVillage = opts?.landHexPerVillage ?? VILLAGE_LAND_HEX_PER_VILLAGE;

  let landHexCount = 0;
  const candidates: VillageSite[] = [];

  for (const key of Object.keys(hexes)) {
    const hex = hexes[key];
    if (hex === undefined) continue;

    const isSea = hex.terenBazowy === TerenBazowy.Morze || hex.terenBazowy === TerenBazowy.Wybrzeze;
    if (!isSea) landHexCount++;

    if (hex.wlasciciel !== null) continue;
    if (isVillageExcludedTerrain(hex.terenBazowy)) continue;

    candidates.push({ q: hex.coords.q, r: hex.coords.r });
  }

  const targetCount = Math.max(1, Math.round(landHexCount / landHexPerVillage));
  if (candidates.length === 0) return [];

  // Deterministyczny Fisher-Yates shuffle seedowany `seed` (wzór jak spawnCamps).
  let lcg = seed >>> 0;
  for (let i = candidates.length - 1; i > 0; i--) {
    let rnd: number;
    [lcg, rnd] = lcgNext(lcg);
    const j = Math.floor(rnd * (i + 1));
    const tmp = candidates[i]!;
    candidates[i] = candidates[j]!;
    candidates[j] = tmp;
  }

  const placed: QRLike[] = existingCamps.map(c => ({ q: c.q, r: c.r }));
  const result: VillageSite[] = [];

  for (const cand of candidates) {
    if (result.length >= targetCount) break;

    const tooCloseToCity = cities.some(
      c => hexDistanceAxial(cand.q, cand.r, c.q, c.r) < minDistFromCity,
    );
    if (tooCloseToCity) continue;

    const tooCloseToOther = placed.some(
      p => hexDistanceAxial(cand.q, cand.r, p.q, p.r) < spacing,
    );
    if (tooCloseToOther) continue;

    placed.push(cand);
    result.push(cand);
  }

  return result;
}
