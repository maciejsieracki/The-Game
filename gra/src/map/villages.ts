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
import type { GameDifficulty } from '../game/difficulty-cost';
import { hexDistanceAxial } from './gen-helpers';

// ---------------------------------------------------------------------------
// TUNING: liczba chat ze skarbami (Maciej 2026-07-22)
// ---------------------------------------------------------------------------

/**
 * Chat na miasto wg trudności: HART=1 · NORMAL=2 · EZ=3.
 * targetHuts = expectedStartCityCount × multiplier.
 */
export const VILLAGE_HUTS_PER_CITY: Readonly<Record<GameDifficulty, number>> = {
  hard: 1,
  normal: 2,
  easy: 3,
};

/** @deprecated Stara formuła (ląd/140) — tylko testy legacy / jawny fallback. */
export const VILLAGE_LAND_HEX_PER_VILLAGE = 140;

/** Oczekiwana liczba miast startowych: gracz + AI + miasta-państwa (1 + N per typ). */
export function expectedStartCityCount(civTypesCount: number, cityStatesCount: number): number {
  const types = Math.max(1, Math.floor(civTypesCount));
  const states = Math.max(0, Math.floor(cityStatesCount));
  return types * (1 + states);
}

export function villageHutsPerCityMultiplier(difficulty: GameDifficulty = 'normal'): number {
  return VILLAGE_HUTS_PER_CITY[difficulty] ?? VILLAGE_HUTS_PER_CITY.normal;
}

/** Docelowa liczba chat: miasta × mnożnik trudności. */
export function targetVillageHutCount(
  cityCount: number,
  difficulty: GameDifficulty = 'normal',
): number {
  const cities = Math.max(0, Math.floor(cityCount));
  return cities * villageHutsPerCityMultiplier(difficulty);
}

/**
 * Minimalny dystans (heksy) wioski od dowolnego miasta / pozycji startowej.
 * 3 hex — przy target = miasta×trudność (do ~300+ chat) spacing 4+ ucina spawn do ~30% celu.
 */
export const VILLAGE_MIN_DIST_FROM_CITY = 3;

/**
 * Minimalny dystans (heksy) wioski od innej wioski oraz od obozu barbarzyńców.
 * 3 hex — gęstość wymagana przez kanon (2–3 chat na miasto przy 12 typach × 12 państw).
 */
export const VILLAGE_MIN_SPACING = 3;

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
    t === TerenBazowy.Pustynia ||
    t === TerenBazowy.Polarny
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
 * Liczba wiosek: `opts.targetCount` (kanon: miasta × mnożnik trudności), albo
 * legacy `round(landHexCount / landHexPerVillage)` gdy targetCount nie podany.
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
    /** Kanon: docelowa liczba chat (miasta × trudność). */
    targetCount?: number;
    /** @deprecated fallback gdy brak targetCount */
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

  const targetCount = opts?.targetCount != null && Number.isFinite(opts.targetCount)
    ? Math.max(0, Math.floor(opts.targetCount))
    : Math.max(1, Math.round(landHexCount / landHexPerVillage));
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
