/**
 * P-AI-MOC-BONUS=A — podpięcie martwych pól DifficultyParams dla major AI.
 * Logika testowalna bez main.ts (spawn plan + mnożniki walki/nauki).
 */

import type { GameMap } from '../types/map';
import type { City } from './cities';
import { canFoundCity } from './cities';
import { isBarbarian } from './barbarians';
import type { DifficultyParams } from './ai';
import { hexNeighborCoords } from '../units/setup';

/** Domyślny typ jednostki bonusowej startowej (epoka kamień). */
export const AI_DIFFICULTY_BONUS_UNIT_TYPE = 'Wojownik';

/** Major AI = pełna cywilizacja (stolica klastra), nie gracz / barbarzyńca / miasto-państwo. */
export function qualifiesForMajorAiDifficultyBonus(
  ownerId: number,
  isCityState: boolean,
): boolean {
  return ownerId > 0 && !isBarbarian(ownerId) && !isCityState;
}

/** Mnożnik statystyk walki (atak/obrona) z bonusWalka (0.05 → ×1.05). */
export function difficultyCombatMultiplier(bonusWalka: number): number {
  return 1 + Math.max(0, bonusWalka);
}

/** Płaski dodatek punktów nauki AI na turę. */
export function difficultyScienceBonusPerTurn(bonusNauka: number): number {
  return Math.max(0, bonusNauka);
}

/** Skaluje staty bojowe definicji jednostki (atak/obrona/ranged) — bez pancerza. */
export function applyDifficultyCombatToUnitDef<T extends Record<string, unknown>>(
  def: T,
  mult: number,
): T {
  if (mult === 1) return def;
  const scaleNum = (v: unknown): unknown => (typeof v === 'number' ? v * mult : v);
  const missile = def.missileAttack ?? def['Missile Attack'];
  return {
    ...def,
    meleeAttack: scaleNum(def.meleeAttack ?? def['Melee Attack'] ?? def['Atak']),
    meleeDefence: scaleNum(def.meleeDefence ?? def['Obrona'] ?? def['meleeDefence']),
    ...(missile != null && missile !== '---'
      ? { missileAttack: scaleNum(missile) }
      : {}),
  };
}

export interface DifficultyBonusUnitSpawn {
  typeId: string;
  q: number;
  r: number;
}

export interface DifficultyBonusCitySpawn {
  q: number;
  r: number;
  nameSuffix: string;
}

export interface DifficultyBonusSpawnPlan {
  units: DifficultyBonusUnitSpawn[];
  cities: DifficultyBonusCitySpawn[];
  /** true gdy startoweMiasta>0 ale brak legalnego heksu — jednostki zamiast miasta. */
  extraCitiesBlocked: boolean;
}

/**
 * Plan spawnu bonusów startowych dla stolicy major AI (wywołanie jednorazowe przy founding).
 */
export function planMajorAiDifficultyStartBonuses(
  capitalQ: number,
  capitalR: number,
  params: DifficultyParams,
  map: GameMap,
  cities: City[],
  qualifies: boolean,
): DifficultyBonusSpawnPlan {
  const empty: DifficultyBonusSpawnPlan = {
    units: [],
    cities: [],
    extraCitiesBlocked: false,
  };
  if (!qualifies) return empty;

  const units: DifficultyBonusUnitSpawn[] = [];
  const extraCities: DifficultyBonusCitySpawn[] = [];
  let extraCitiesBlocked = false;

  const unitCount = Math.max(0, Math.floor(params.startoweJednostki));
  for (let i = 0; i < unitCount; i++) {
    units.push({
      typeId: AI_DIFFICULTY_BONUS_UNIT_TYPE,
      q: capitalQ,
      r: capitalR,
    });
  }

  const cityCount = Math.max(0, Math.floor(params.startoweMiasta));
  if (cityCount > 0) {
    const hex = pickBonusCityHex(map, cities, capitalQ, capitalR);
    if (hex) {
      for (let i = 0; i < cityCount; i++) {
        extraCities.push({ q: hex.q, r: hex.r, nameSuffix: i > 0 ? ` ${i + 1}` : '' });
      }
    } else {
      extraCitiesBlocked = true;
      // BLOK: brak legalnego heksu — równoważnik jednostkami (1 miasto ≈ 1 Wojownik).
      for (let i = 0; i < cityCount; i++) {
        units.push({
          typeId: AI_DIFFICULTY_BONUS_UNIT_TYPE,
          q: capitalQ,
          r: capitalR,
        });
      }
    }
  }

  return { units, cities: extraCities, extraCitiesBlocked };
}

/** Sąsiad stolicy nadający się na dodatkowe miasto startowe AI. */
export function pickBonusCityHex(
  map: GameMap,
  cities: City[],
  capitalQ: number,
  capitalR: number,
): { q: number; r: number } | null {
  const neighbors = hexNeighborCoords(capitalQ, capitalR);
  for (const n of neighbors) {
    const { ok } = canFoundCity(n.q, n.r, cities, map, { clusterStartSlot: true });
    if (ok) return n;
  }
  return null;
}
