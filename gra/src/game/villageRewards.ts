/**
 * villageRewards.ts
 * Tabela nagród z WIOSEK neutralnych (goodie huts) — czysta logika, testowalna
 * bez DOM/THREE (zob. tools/villages-test.cjs).
 *
 * Podział odpowiedzialności:
 *   - pickVillageReward()        -- czyste losowanie KATEGORII nagrody z wag (roll wejściowy).
 *   - villageGoldAmount()        -- kwota złota (skalowana erą).
 *   - villageTechProgress()      -- postęp nauki doliczany do bieżącej technologii (skalowany erą).
 *   - villageUnitForEra()        -- typeId jednostki-nagrody dla danej ery, lub null (-> fallback złoto).
 *   - findVillageRewardSpawnHex() -- heks spawnu jednostki-nagrody (poza obcym miastem).
 *
 * Realizację nagrody (mutacja PlayerState, tworzenie RuntimeUnit, komunikaty)
 * robi main.ts — ten moduł nie zna PlayerState/RuntimeUnit/main.ts.
 */

import type { CityHexRef } from './city-hex-movement';
import { canUnitOccupyCityHex } from './city-hex-movement';
import type { RuntimeUnit } from '../units/setup';
import { hexNeighborCoords, keyOf } from '../units/setup';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VillageRewardKind = 'zloto' | 'tech' | 'jednostka';

// ---------------------------------------------------------------------------
// TUNING: wartości do playtestu
// ---------------------------------------------------------------------------

/** Wagi kategorii nagrody -- MUSZĄ sumować się do 1. */
export const VILLAGE_REWARD_WEIGHT_GOLD = 0.5;
export const VILLAGE_REWARD_WEIGHT_TECH = 0.3;
export const VILLAGE_REWARD_WEIGHT_UNIT = 0.2;

/** Zakres bazowy kwoty złota (przed skalowaniem erą), era 1 = Kamień. */
export const VILLAGE_GOLD_BASE_MIN = 20;
export const VILLAGE_GOLD_BASE_MAX = 50;

/** Mnożnik kwoty złota za erę ponad 1 (era 1 = ×1, era 2 = ×2, era 3 = ×3). */
export const VILLAGE_GOLD_ERA_MULT = 1;

/** Ostrożny domyślny postęp nauki (przed skalowaniem erą) -- ułamek kosztu taniej technologii. */
export const VILLAGE_TECH_SCIENCE_BASE = 25;

/** Mnożnik postępu nauki za erę ponad 1 (jak złoto). */
export const VILLAGE_TECH_ERA_MULT = 1;

/**
 * Podstawowa jednostka-nagroda dla danej ery (typeId == pole "Jednostka" w units.json).
 * Celowo tylko jednostki kulturowo-neutralne (Kultura: null w units.json), żeby
 * nagroda nie zależała od cywilizacji gracza. Brak wpisu dla danej ery (np. 3 =
 * Żelazo, gdzie w danych nie ma neutralnej jednostki bojowej) -> main.ts
 * traktuje to jak "brak definicji" i przyznaje złoto (fallback).
 */
export const VILLAGE_UNIT_BY_ERA: Readonly<Record<number, string>> = {
  1: 'Zwiadowca',
  2: 'Włócznik',
};

// ---------------------------------------------------------------------------
// pickVillageReward
// ---------------------------------------------------------------------------

export interface PickVillageRewardOptions {
  /** Wyklucz kategorię "jednostka" z puli (R-CHATKA-SKARBOW-BEZ-JEDNOSTEK-WOJSKOWYCH-NA-CUDZYM-TERENIE) --
   * usunięte 20% rozdzielone proporcjonalnie na złoto/tech (50:30 -> 62,5%/37,5%), ECHO A 2026-08-09.
   * / EN: exclude the "jednostka" category from the pool -- its share is redistributed
   * proportionally over zloto/tech. */
  excludeUnit?: boolean;
}

/**
 * Wybiera kategorię nagrody na podstawie `roll` (oczekiwane [0,1), np. Math.random()).
 * Czysta funkcja -- deterministyczna dla danego roll, więc testowalna bez RNG.
 * Progi w kolejności: złoto [0, GOLD) | tech [GOLD, GOLD+TECH) | jednostka [GOLD+TECH, 1).
 */
export function pickVillageReward(roll: number, opts?: PickVillageRewardOptions): VillageRewardKind {
  const r = Math.min(Math.max(roll, 0), 0.999999999);
  if (opts?.excludeUnit) {
    const goldShare = VILLAGE_REWARD_WEIGHT_GOLD / (VILLAGE_REWARD_WEIGHT_GOLD + VILLAGE_REWARD_WEIGHT_TECH);
    return r < goldShare ? 'zloto' : 'tech';
  }
  if (r < VILLAGE_REWARD_WEIGHT_GOLD) return 'zloto';
  if (r < VILLAGE_REWARD_WEIGHT_GOLD + VILLAGE_REWARD_WEIGHT_TECH) return 'tech';
  return 'jednostka';
}

// ---------------------------------------------------------------------------
// shouldExcludeUnitReward
// ---------------------------------------------------------------------------

/**
 * R-CHATKA-SKARBOW-BEZ-JEDNOSTEK-WOJSKOWYCH-NA-CUDZYM-TERENIE (ECHO A, 2026-08-09).
 * Decyzja: chatka na CUDZYM terytorium nie ma prawa dać jednostki WOJSKOWEJ jako nagrody --
 * bo taka jednostka spawnuje się na cudzym terenie i liczy się jak naruszenie granicy (kara
 * -5 Zaufania/turę), mimo że gracz nie zrobił nic poza odkryciem chatki. Oceniane na heksie
 * SPAWNU jednostki (`findVillageRewardSpawnHex`), NIE na heksie chatki -- bo to spawn, nie
 * chatka, powoduje naruszenie. Czysta funkcja -- wyciągnięta z inline koniunkcji w main.ts
 * (`checkVillageRewardAt`) do behawioralnej weryfikacji pełną tabelą prawdy (runda 4
 * AutoBota, zamyka mutacje odwrócenia semantyki niewidoczne dla bramki tekstowej-regexowej).
 * / EN: pure decision function extracted from an inline conjunction in main.ts so it can be
 * verified by a full truth table instead of only a text-pinning regex gate.
 *
 * @param a.hasSpawnHex        czy w ogóle znaleziono heks spawnu jednostki-nagrody (brak =>
 *                              nie ma czego wykluczać, jednostka i tak nie powstanie).
 * @param a.spawnHexOwnerId    właściciel terytorium NA HEKSIE SPAWNU (null = teren niczyj/neutralny).
 * @param a.playerOwnerId      ownerId gracza odkrywającego chatkę.
 * @param a.rewardUnitIsMilitary czy jednostka-nagroda dla bieżącej ery jest jednostką WOJSKOWĄ
 *                              (nie cywilną) -- cywile (np. Zwiadowca) nigdy nie są wykluczane.
 */
export function shouldExcludeUnitReward(a: {
  hasSpawnHex: boolean;
  spawnHexOwnerId: number | null;
  playerOwnerId: number;
  rewardUnitIsMilitary: boolean;
}): boolean {
  if (!a.hasSpawnHex) return false;
  if (!a.rewardUnitIsMilitary) return false;
  if (a.spawnHexOwnerId === null) return false;
  return a.spawnHexOwnerId !== a.playerOwnerId;
}

// ---------------------------------------------------------------------------
// Magnitudes
// ---------------------------------------------------------------------------

/**
 * Losowa kwota złota (liczba całkowita) w zakresie bazowym, skalowana erą.
 * `rand` domyślnie Math.random -- wstrzykiwalne dla testów deterministycznych.
 */
export function villageGoldAmount(era: number, rand: () => number = Math.random): number {
  const e = Math.max(1, Math.floor(era));
  const span = VILLAGE_GOLD_BASE_MAX - VILLAGE_GOLD_BASE_MIN + 1;
  const base = VILLAGE_GOLD_BASE_MIN + Math.floor(rand() * span);
  return Math.round(base * (1 + (e - 1) * VILLAGE_GOLD_ERA_MULT));
}

/** Postęp nauki doliczany do bieżącej technologii, skalowany erą. */
export function villageTechProgress(era: number): number {
  const e = Math.max(1, Math.floor(era));
  return Math.round(VILLAGE_TECH_SCIENCE_BASE * (1 + (e - 1) * VILLAGE_TECH_ERA_MULT));
}

/** typeId jednostki-nagrody dla danej ery, lub null gdy brak zdefiniowanej (-> fallback złoto). */
export function villageUnitForEra(era: number): string | null {
  const e = Math.max(1, Math.floor(era));
  return VILLAGE_UNIT_BY_ERA[e] ?? null;
}

// ---------------------------------------------------------------------------
// Spawn jednostki-nagrody
// ---------------------------------------------------------------------------

/** Maks. odległość heksowa od chatki przy szukaniu miejsca spawnu nagrody. */
export const VILLAGE_REWARD_SPAWN_MAX_RADIUS = 2;

export interface VillageRewardSpawnInput {
  hutQ: number;
  hutR: number;
  ownerId: number;
  units: readonly RuntimeUnit[];
  cities: readonly CityHexRef[];
  isPassable: (q: number, r: number) => boolean;
  /** Heksy odkryte graczem — preferowane przy wyborze spawnu. */
  exploredHexes?: ReadonlySet<string>;
  maxRadius?: number;
}

/**
 * Wybiera heks na spawn jednostki z nagrody chatki.
 * Kolejność preferencji: bliżej chatki → odkryty → stabilny tie-break (q, r).
 * Odrzuca: wodę/nieprzechodni teren, zajęte heksy, heksy obcych miast.
 */
export function findVillageRewardSpawnHex(
  input: VillageRewardSpawnInput,
): { q: number; r: number } | undefined {
  const maxRadius = input.maxRadius ?? VILLAGE_REWARD_SPAWN_MAX_RADIUS;
  const candidates: Array<{ q: number; r: number; dist: number; explored: boolean }> = [];

  const visited = new Set<string>([keyOf(input.hutQ, input.hutR)]);
  let ring: Array<{ q: number; r: number }> = [{ q: input.hutQ, r: input.hutR }];

  for (let dist = 1; dist <= maxRadius; dist++) {
    const nextRing: Array<{ q: number; r: number }> = [];
    for (const cell of ring) {
      for (const { q: nq, r: nr } of hexNeighborCoords(cell.q, cell.r)) {
        const k = keyOf(nq, nr);
        if (visited.has(k)) continue;
        visited.add(k);
        nextRing.push({ q: nq, r: nr });

        if (!input.isPassable(nq, nr)) continue;
        if (!canUnitOccupyCityHex(input.ownerId, nq, nr, input.cities)) continue;

        const occupied = input.units.some(
          u => u.q === nq && u.r === nr && u.inGarnizon !== true,
        );
        if (occupied) continue;

        const explored = input.exploredHexes?.has(k) ?? false;
        candidates.push({ q: nq, r: nr, dist, explored });
      }
    }
    ring = nextRing;
  }

  if (candidates.length === 0) return undefined;

  candidates.sort((a, b) => {
    if (a.dist !== b.dist) return a.dist - b.dist;
    if (a.explored !== b.explored) return a.explored ? -1 : 1;
    if (a.q !== b.q) return a.q - b.q;
    return a.r - b.r;
  });

  const best = candidates[0]!;
  return { q: best.q, r: best.r };
}
