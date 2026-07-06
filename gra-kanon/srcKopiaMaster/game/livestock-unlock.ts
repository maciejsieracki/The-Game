/**
 * livestock-unlock.ts — odblokowanie hodowli po pastwisku/stadninie na złożu (ABC-18 Maciej 2026-07-05).
 * Złoże w terytorium ≠ dostęp — wymaga ulepszenia na złożu (bydło/owce/lama/koń→stadnina).
 */
import { Nakladka } from '../types/hex';
import type { GameMap } from '../types/map';
import { normalizeImprovementKey } from './terrain-improvements';

export type LivestockKey = 'bydlo' | 'owce' | 'lama' | 'kon';

export const LIVESTOCK_IMPROVEMENT_KEYS: readonly LivestockKey[] = ['bydlo', 'owce', 'lama'];

/** Ulepszenie terenu → odblokowany surowiec hodowlany (ABC-18). */
const IMPROVEMENT_UNLOCKS_LIVESTOCK: Readonly<Record<string, LivestockKey>> = {
  bydlo: 'bydlo',
  owce: 'owce',
  lama: 'lama',
  stadnina: 'kon',
};

const DEPOSIT_FOR_LIVESTOCK: Record<'bydlo' | 'owce' | 'lama', Nakladka> = {
  bydlo: Nakladka.ZlozeBydla,
  owce:  Nakladka.ZlozeOwiec,
  lama:  Nakladka.ZlozeLamy,
};

const INCA_CIV_TYPES = new Set(['inkowie', 'inka', 'incas']);

export function isIncaCiv(civType: string | undefined | null): boolean {
  if (!civType) return false;
  const t = civType.toLowerCase().trim();
  return INCA_CIV_TYPES.has(t) || t.includes('inkow');
}

export function livestockKeyFromImprovement(improvementKey: string): LivestockKey | null {
  const raw = improvementKey?.toLowerCase?.().trim();
  if (raw === 'kon' || raw === 'konie') return 'kon';
  const k = normalizeImprovementKey(improvementKey);
  if (!k) return null;
  if (k in IMPROVEMENT_UNLOCKS_LIVESTOCK) return IMPROVEMENT_UNLOCKS_LIVESTOCK[k]!;
  if (k === 'bydlo' || k === 'owce' || k === 'lama' || k === 'kon') return k;
  return null;
}

export function hexHasLivestockDeposit(
  hex: { nakladka?: Nakladka },
  key: 'bydlo' | 'owce' | 'lama',
): boolean {
  return hex.nakladka === DEPOSIT_FOR_LIVESTOCK[key];
}

export function hexHasHorseDeposit(hex: { nakladka?: Nakladka }): boolean {
  return hex.nakladka === Nakladka.ZlozeKonia;
}

/** Czy ulepszenie pasuje do złoża na heksie (pierwsze pastwisko/stadnina). */
export function improvementMatchesLivestockDeposit(
  improvementKey: string,
  hex: { nakladka?: Nakladka },
): boolean {
  const norm = normalizeImprovementKey(improvementKey) ?? improvementKey;
  if (norm === 'stadnina') return hexHasHorseDeposit(hex);
  const lk = livestockKeyFromImprovement(norm);
  if (!lk || lk === 'kon') return false;
  return hexHasLivestockDeposit(hex, lk);
}

/**
 * Czy cywilizacja może budować dany typ hodowli w danej epoce.
 */
export function isLivestockAllowed(
  civType: string | undefined | null,
  improvementKey: string,
  era: number,
): boolean {
  const lk = livestockKeyFromImprovement(improvementKey);
  if (!lk) return true;
  if (lk === 'kon') return !isIncaCiv(civType);
  if (lk === 'lama') return isIncaCiv(civType);
  if (isIncaCiv(civType) && era < 3) return false;
  return true;
}

function keysOnPlacedHex(imp: string | readonly string[]): string[] {
  if (typeof imp === 'string') return imp ? [imp] : [];
  return imp.map(String);
}

/**
 * Hodowle odblokowane imperium — tylko po postawieniu pastwiska/stadniny NA złożu (ABC-18).
 */
export function computeEmpireLivestockUnlocks(
  placedImprovements: ReadonlyMap<string, string | readonly string[]>,
  map: GameMap,
  ownerId?: string | null,
): Set<LivestockKey> {
  const unlocked = new Set<LivestockKey>();
  for (const [hexKey, impRaw] of placedImprovements) {
    const hex = map.hexes[hexKey];
    if (!hex) continue;
    if (ownerId != null && hex.wlasciciel !== ownerId) continue;
    for (const impKey of keysOnPlacedHex(impRaw)) {
      const lk = livestockKeyFromImprovement(impKey);
      if (!lk) continue;
      if (!improvementMatchesLivestockDeposit(impKey, hex)) continue;
      unlocked.add(lk);
    }
  }
  return unlocked;
}

/** Pierwsze pastwisko: tylko na złożu; potem — po odblokowaniu imperium. */
export function isLivestockUnlockedForPlacement(
  improvementKey: string,
  hex: { nakladka?: Nakladka },
  empireUnlocks: ReadonlySet<LivestockKey>,
): boolean {
  const norm = normalizeImprovementKey(improvementKey) ?? improvementKey;
  if (norm === 'stadnina') {
    return hexHasHorseDeposit(hex) || empireUnlocks.has('kon');
  }
  const lk = livestockKeyFromImprovement(norm);
  if (!lk || lk === 'kon') return true;
  if (improvementMatchesLivestockDeposit(norm, hex)) return true;
  return empireUnlocks.has(lk);
}
