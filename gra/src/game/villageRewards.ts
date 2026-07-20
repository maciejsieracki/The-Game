/**
 * villageRewards.ts
 * Tabela nagród z WIOSEK neutralnych (goodie huts) — czysta logika, testowalna
 * bez DOM/THREE (zob. tools/villages-test.cjs).
 *
 * Podział odpowiedzialności:
 *   - pickVillageReward()   -- czyste losowanie KATEGORII nagrody z wag (roll wejściowy).
 *   - villageGoldAmount()   -- kwota złota (skalowana erą).
 *   - villageTechProgress() -- postęp nauki doliczany do bieżącej technologii (skalowany erą).
 *   - villageUnitForEra()   -- typeId jednostki-nagrody dla danej ery, lub null (-> fallback złoto).
 *
 * Realizację nagrody (mutacja PlayerState, tworzenie RuntimeUnit, komunikaty)
 * robi main.ts — ten moduł nie zna PlayerState/RuntimeUnit/main.ts.
 */

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

/**
 * Wybiera kategorię nagrody na podstawie `roll` (oczekiwane [0,1), np. Math.random()).
 * Czysta funkcja -- deterministyczna dla danego roll, więc testowalna bez RNG.
 * Progi w kolejności: złoto [0, GOLD) | tech [GOLD, GOLD+TECH) | jednostka [GOLD+TECH, 1).
 */
export function pickVillageReward(roll: number): VillageRewardKind {
  const r = Math.min(Math.max(roll, 0), 0.999999999);
  if (r < VILLAGE_REWARD_WEIGHT_GOLD) return 'zloto';
  if (r < VILLAGE_REWARD_WEIGHT_GOLD + VILLAGE_REWARD_WEIGHT_TECH) return 'tech';
  return 'jednostka';
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
