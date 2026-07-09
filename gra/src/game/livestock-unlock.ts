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

/**
 * Cywilizacja „Nowego Świata" (Ameryka) — start bez koni/owiec/krów: bydło/owce odblokowane
 * od epoki 3, koń dopiero po uzyskaniu dostępu do złoża koni. Dziś = Inkowie; gdy dojdą kolejne
 * cywilizacje amerykańskie (Majowie itd.), rozszerzyć TU (jedno miejsce) — reguła po TYPIE, nie nazwie.
 */
export function isNewWorldCiv(civType: string | undefined | null): boolean {
  return isIncaCiv(civType);
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
  // Koń = surowiec-dostęp poza food-gate (decyzja 2a). Nowy Świat nie ma koni na starcie, ale
  // zdobywa je PO uzyskaniu dostępu do złoża koni — tu (civ-gate) koń dozwolony dla wszystkich,
  // a realny warunek złoża/odblokowania imperium egzekwuje isLivestockUnlockedForPlacement.
  // (Zmiana 2026-07-09: wcześniej Inkowie mieli konia zablokowanego NA ZAWSZE.)
  if (lk === 'kon') return true;
  if (lk === 'lama') return isIncaCiv(civType); // lama andyjska — tylko Inkowie
  if (isNewWorldCiv(civType) && era < 3) return false; // Nowy Świat: bydło/owce dopiero od epoki 3
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

/**
 * Model B (Maciej 2026-07-09): hodowla (Pastwisko/Owczarnia/Zagroda lam) = CZYSTE ulepszenie
 * budowane jak farma — BEZ złoża/„zarodka" (złoża zwierzęce usunięte z mapy). Tylko KOŃ zostaje
 * surowcem: stadnina wymaga złoża konia LUB imperialnego odblokowania 'kon'.
 * (Bramka cywilizacji/epoki jest osobno w isLivestockAllowed.)
 */
export function isLivestockUnlockedForPlacement(
  improvementKey: string,
  hex: { nakladka?: Nakladka },
  empireUnlocks: ReadonlySet<LivestockKey>,
): boolean {
  const norm = normalizeImprovementKey(improvementKey) ?? improvementKey;
  if (norm === 'stadnina') {
    return hexHasHorseDeposit(hex) || empireUnlocks.has('kon');
  }
  return true; // bydlo/owce/lama — bez wymogu złoża
}
