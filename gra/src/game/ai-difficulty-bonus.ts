/**
 * P-AI-MOC-BONUS=A — podpięcie martwych pól DifficultyParams dla major AI.
 * Logika testowalna bez main.ts (spawn plan + mnożniki walki/nauki).
 */

import type { GameMap } from '../types/map';
import type { City } from './cities';
import { canFoundCity, MIN_CITY_DISTANCE } from './cities';
import { isBarbarian } from './barbarians';
import type { DifficultyParams } from './ai';
import { hexDistance } from '../units/setup';

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

/** Mnożnik realnej Pracy AI z bonusProdukcja (0.1 → ×1.1, 0.25 → ×1.25). */
export function difficultyProductionMultiplier(bonusProdukcja: number): number {
  return 1 + Math.max(0, bonusProdukcja);
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

/**
 * R-MIASTA-PANSTWA-STARTOWE-JEDNOSTKI-Q1: jednostki startowe MIASTA-PAŃSTWA (nie major
 * AI) wg `cityStateDifficulty` (osobny suwak od `_menuDifficulty`/AI, main.ts). Miasta-
 * państwa NIE kwalifikują się do `qualifiesForMajorAiDifficultyBonus` (isCityState=true
 * je wyklucza z bonusu major AI wyżej w tym pliku) — to jest ich WŁASNA, prostsza ścieżka:
 * liczba jednostek zależy WYŁĄCZNIE od poziomu trudności miast-państw, nie od
 * DifficultyParams.startoweJednostki (to pole karmi inną skalę/inne źródło dla major AI).
 * easy=0 (zachowanie dzisiejsze, bez regresji) / normal=1 / hard=2.
 */
export function cityStateStartUnitCount(difficulty: 'easy' | 'normal' | 'hard'): number {
  if (difficulty === 'hard') return 2;
  if (difficulty === 'normal') return 1;
  return 0;
}

/** Jednostki wojskowe nadawane graczowi po założeniu pierwszego miasta. */
export function playerStartUnitCount(difficulty: 'easy' | 'normal' | 'hard'): number {
  if (difficulty === 'hard') return 3;
  if (difficulty === 'normal') return 2;
  return 1;
}

/** Jednostki obcych państw-miast AI; ta tabela jest niezależna od suwaka PM gracza. */
export function foreignCityStateStartUnitCount(difficulty: 'easy' | 'normal' | 'hard'): number {
  if (difficulty === 'easy') return 2;
  if (difficulty === 'normal') return 1;
  return 0;
}

/**
 * P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1: NAJBLIŻSZY heks wokół stolicy, który FAKTYCZNIE
 * spełnia normalny warunek minimalnego dystansu (`canFoundCity` bez żadnego
 * obejścia/`clusterStartSlot`) — dokładnie ta sama reguła, która obowiązuje każde
 * inne miasto. Wcześniej funkcja sprawdzała WYŁĄCZNIE bezpośrednich sąsiadów
 * stolicy (odległość=1) i wołała `canFoundCity(..., { clusterStartSlot: true })`,
 * czyli JEDNOCZEŚNIE prosiła o hex bliżej niż `MIN_CITY_DISTANCE` i kazała
 * pominąć jedyny mechanizm, który mógłby to odrzucić — stąd np. „URUK — KOLONIA"
 * bezpośrednio przy stolicy „Uruk" (zgłoszenie właściciela 2026-09-08).
 * Przeszukuje rosnący promień (dolna granica = `MIN_CITY_DISTANCE`, żadna nowa
 * liczba balansu) i zwraca pierwszy legalny hex w kolejności rosnącej odległości.
 */
export function pickBonusCityHex(
  map: GameMap,
  cities: City[],
  capitalQ: number,
  capitalR: number,
): { q: number; r: number } | null {
  // Promień wyszukiwania: wielokrotność MIN_CITY_DISTANCE (istniejąca stała) —
  // nie balansowa liczba, tylko bezpieczna górna granica przeszukiwania; poza
  // nią kolonia jest po prostu zablokowana (istniejąca ścieżka `extraCitiesBlocked`
  // w `planMajorAiDifficultyStartBonuses`, bez zmiany semantyki).
  const maxRadius = MIN_CITY_DISTANCE * 3;
  const candidates: Array<{ q: number; r: number; d: number }> = [];
  for (let dq = -maxRadius; dq <= maxRadius; dq++) {
    for (let dr = -maxRadius; dr <= maxRadius; dr++) {
      if (dq === 0 && dr === 0) continue;
      const q = capitalQ + dq;
      const r = capitalR + dr;
      const d = hexDistance(capitalQ, capitalR, q, r);
      if (d > maxRadius) continue;
      candidates.push({ q, r, d });
    }
  }
  candidates.sort((a, b) => a.d - b.d);
  for (const c of candidates) {
    const { ok } = canFoundCity(c.q, c.r, cities, map);
    if (ok) return { q: c.q, r: c.r };
  }
  return null;
}
