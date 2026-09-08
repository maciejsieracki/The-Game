/**
 * livestock-unlock.ts — odblokowanie hodowli (Model B 2026-07-09).
 * Bydło/owce/lama: czyste ulepszenie bez złoża (jak farma).
 * Koń: stadnina na złożu konia → odblokowanie imperium (ABC-18).
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

const INCA_CIV_TYPES = new Set(['inkowie', 'inka', 'incas', 'astekowie', 'astek', 'aztekowie', 'aztek']);

export function isIncaCiv(civType: string | undefined | null): boolean {
  if (!civType) return false;
  const t = civType.toLowerCase().trim();
  return INCA_CIV_TYPES.has(t) || t.includes('inkow') || t.includes('astek') || t.includes('aztek');
}

/** Złoże lamy na mapie / w UI — tylko dla cywilizacji lamowych (dziś: Inkowie). */
export function isLamaDepositVisibleForCiv(civType: string | undefined | null): boolean {
  return isIncaCiv(civType);
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
  hex: { nakladka?: Nakladka; zloze?: string },
  key: 'bydlo' | 'owce' | 'lama',
): boolean {
  if (hex.nakladka === DEPOSIT_FOR_LIVESTOCK[key]) return true;
  return hex.zloze?.trim().toLowerCase() === key;
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
 * Hodowle odblokowane imperium — Model B: tylko koń ze stadniny na złożu konia (ABC-18).
 * Bydło/owce/lama nie mają złoża na mapie — brak odblokowania imperium.
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
      const norm = normalizeImprovementKey(impKey) ?? impKey;
      if (norm !== 'stadnina') continue;
      if (!improvementMatchesLivestockDeposit(impKey, hex)) continue;
      unlocked.add('kon');
    }
  }
  return unlocked;
}

/**
 * Koszt jednorazowy (w sztukach 'kon' z magazynu imperium) za każdą stadninę POZA złożem
 * konia — P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1 (runda 2, liczba jawna właściciela). NIE jest
 * to stała bramka odblokowania: każda kolejna stadnina poza złożem płaci OSOBNE 50.
 */
export const STADNINA_HORSE_COST = 50;

/**
 * Model B (Maciej 2026-07-09) BYŁO: hodowla (Pastwisko/Owczarnia/Zagroda lam) = CZYSTE
 * ulepszenie budowane jak farma — BEZ złoża/„zarodka". Tylko KOŃ zostawał surowcem: stadnina
 * wymagała złoża konia LUB imperialnego odblokowania 'kon' — RAZ zbudowana na złożu odblokowywała
 * WSZYSTKIE kolejne stadniny DARMO, gdziekolwiek w imperium.
 *
 * P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1 (runda 2, 2026-09-08, ODWRÓCENIE WYŁĄCZNIE dla stadniny):
 * ten darmowy-po-pierwszej-stadninie mechanizm (dawne `empireUnlocks.has('kon')` liczone przez
 * `computeEmpireLivestockUnlocks` z `placedImprovements`) jest RETIROWANY — właściciel wprost:
 * "musimy zapłacić 50 koni [...] Gdy w surowcach będzie 50 koni, można postawić stadninę".
 * Zastąpione: (a) złoże konia NA TYM heksie — bez zmian, zawsze darmowe; (b) aktualny stan
 * magazynu imperium (`horseStockAvailable`, dowożony przez wołającego z tego samego odczytu co
 * `citySurowceSumForOwner`/panel Surowców) >= STADNINA_HORSE_COST W CHWILI sprawdzania —
 * odjęcie 50 następuje osobno, przy realnym potwierdzeniu budowy (main.ts::commitBuildRequest),
 * NIE tutaj (ta funkcja jest czystym predykatem, wołanym wielokrotnie do samego sprawdzania
 * czy przycisk ma być aktywny); (c) `tradeRouteKonUnlocked` (Temat #4 „Handel E3b", odrębny,
 * już wcześniej wdrożony mechanizm — aktywna trasa handlowa z cywilizacją mającą dostęp do konia)
 * ZOSTAJE bez zmian jako NIEZALEŻNA, wcześniej zaakceptowana ścieżka darmowego dostępu — nie jest
 * to część Modelu B retirowanego tym tematem, tylko osobna funkcja gry (patrz
 * docs/encyklopedia/pojecia/szlaki-handlowe.md — "Dostęp do surowców przez trasę").
 * (Bramka cywilizacji/epoki jest osobno w isLivestockAllowed.)
 */
export function isLivestockUnlockedForPlacement(
  improvementKey: string,
  hex: { nakladka?: Nakladka },
  tradeRouteKonUnlocked: boolean,
  horseStockAvailable: number,
): boolean {
  const norm = normalizeImprovementKey(improvementKey) ?? improvementKey;
  if (norm === 'stadnina') {
    return hexHasHorseDeposit(hex)
      || tradeRouteKonUnlocked
      || horseStockAvailable >= STADNINA_HORSE_COST;
  }
  return true; // bydlo/owce/lama — bez wymogu złoża
}
