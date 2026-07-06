/**
 * deposit-era.ts — widoczność złóż metali per epoka (E-P0-04/05).
 */
import type { HexWithZloze } from './gen-helpers';
import { mapGenMetalDepositMinEra } from '../data/map-gen-params-loader';

export type DepositEraHex = Pick<HexWithZloze, 'zloze' | 'zlozeMinEra'>;

export const METAL_DEPOSIT_MIN_ERA: Record<string, number> = mapGenMetalDepositMinEra();

export function zlozeMinEraFor(hex: DepositEraHex): number {
  if (hex.zlozeMinEra != null) return hex.zlozeMinEra;
  const z = hex.zloze?.trim().toLowerCase();
  if (z && METAL_DEPOSIT_MIN_ERA[z] != null) return METAL_DEPOSIT_MIN_ERA[z]!;
  return 1;
}

export function isDepositVisible(hex: DepositEraHex, currentEra: number): boolean {
  if (!hex.zloze) return true;
  return currentEra >= zlozeMinEraFor(hex);
}

export function visibleZloze(hex: DepositEraHex, currentEra: number): string | undefined {
  if (!hex.zloze) return undefined;
  return isDepositVisible(hex, currentEra) ? hex.zloze : undefined;
}

export function ensureDepositEraMeta(hexes: Record<string, HexWithZloze>): void {
  for (const hex of Object.values(hexes)) {
    if (!hex.zloze) continue;
    const z = hex.zloze.trim().toLowerCase();
    if (METAL_DEPOSIT_MIN_ERA[z] != null && hex.zlozeMinEra == null) {
      hex.zlozeMinEra = METAL_DEPOSIT_MIN_ERA[z];
    }
  }
}

export function countHiddenMetalDeposits(hexes: Record<string, HexWithZloze>, era: number): number {
  let n = 0;
  for (const hex of Object.values(hexes)) {
    if (hex.zloze && !isDepositVisible(hex, era)) n++;
  }
  return n;
}
