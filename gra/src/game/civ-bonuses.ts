/**
 * civ-bonuses.ts
 * Odczyt i stosowanie bonusow cywilizacji z civs.json (RDY-01, D4).
 * Pure functions — bez stanu globalnego.
 */

import { civMatrixParam, loadCivMatrix } from './civ-matrix';

// ---------------------------------------------------------------------------
// Shared shapes (unikamy importu loader/combat — brak cykli)
// ---------------------------------------------------------------------------

export interface CivBonusEntry {
  typ: string;
  cel: string;
  /** jednostka_specjalna: string[] (tokeny-fix); inne typy bonusow: number. */
  wartosc: number | string | string[];
  opis?: string;
  realizuje?: string;
  matrixParamId?: string;
  matrixCivKey?: string;
}

export interface CivBonusUnitShape {
  typNazwa: string;
  rola: string;
  missileAttack?: number;
  counterTyp?: string;
}

export interface CivCombatContext {
  side: 'attacker' | 'defender';
  terrain?: string;
  isChargeRound?: boolean;
  ownTerritory?: boolean;
  onWallWalkway?: boolean;
  shallowSea?: boolean;
}

/** Additive multipliers: final stat *= (1 + sum of matching bonuses). */
export interface CivStatMultipliers {
  atk: number;
  obrona: number;
  pancerz: number;
  uderzenie: number;
  rangedAtk: number;
  health: number;
}

const ONE: CivStatMultipliers = {
  atk: 0,
  obrona: 0,
  pancerz: 0,
  uderzenie: 0,
  rangedAtk: 0,
  health: 0,
};

// ---------------------------------------------------------------------------
// Unit category (cel w bonusy[]: piechota | lukownicy | kawaleria | rydwany)
// ---------------------------------------------------------------------------

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036F]/g, '').toLowerCase();
}

/** Kategoria bojowa jednostki do dopasowania pola `cel` w bonusie. */
export function unitCombatCategory(unit: CivBonusUnitShape): string {
  const n = stripDiacritics(unit.typNazwa);
  const rola = stripDiacritics(unit.rola ?? '');
  const counter = stripDiacritics(unit.counterTyp ?? '');

  if (rola === 'morska' || rola === 'galera' || counter === 'naval') return 'morska';
  if (rola === 'oblez-nicza' || rola === 'obleznicza' || counter === 'siege') return 'obleczenie';
  if (n.includes('rydwan')) return 'rydwany';
  if (
    n.includes('konn') ||
    n.includes('kawaler') ||
    n.includes('husar') ||
    n.includes('stepow') ||
    (rola === 'flanka' && (n.includes('kon') || n.includes('jezd')))
  ) {
    return 'kawaleria';
  }
  if (
    rola === 'dystans' ||
    n.includes('lucz') ||
    n.includes('kusz') ||
    n.includes('procar') ||
    n.includes('luk') ||
    (unit.missileAttack ?? 0) > 0
  ) {
    return 'lukownicy';
  }
  return 'piechota';
}

/** Adapter for PreBattle's `categoryOf()` output, including its naval `galera` class. */
export function civCombatUnitShapeFromCategory(typNazwa: string, category: string): CivBonusUnitShape {
  const normalized = stripDiacritics(category);
  const ranged = ['dystans', 'lucz', 'łucz', 'kusz', 'procar'].some(token => normalized.includes(token));
  const cavalry = ['kawal', 'kon', 'flank'].some(token => normalized.includes(token));
  const naval = normalized.includes('morsk') || normalized.includes('naval') || normalized === 'galera';
  const siege = normalized.includes('oblez') || normalized.includes('siege');
  return {
    typNazwa: cavalry ? `Konnica ${typNazwa}` : typNazwa,
    rola: ranged ? 'Dystans' : naval ? 'Morska' : siege ? 'Oblężnicza' : cavalry ? 'Flanka' : category,
    missileAttack: ranged ? 1 : 0,
  };
}

/**
 * unitMatchesCel — eksportowane (R-OBRONA-MIASTA-MP-Q1, runda 3, warunek 1):
 * defenseBreakdown.ts liczy "N z M jednostek" dla bonusów obrony civ (bonus_obrona
 * ma zawsze `cel` np. 'piechota' -- realna walka bramkuje przez TĘ SAMĄ funkcję
 * w bonusApplies() ponizej; panel preBattle MUSI uzywac identycznego predykatu,
 * zero rownoleglej reimplementacji dopasowania kategorii jednostki).
 */
export function unitMatchesCel(unit: CivBonusUnitShape, cel: string): boolean {
  const cat = unitCombatCategory(unit);
  const c = stripDiacritics(cel);
  if (c === 'piechota') return cat === 'piechota';
  if (c === 'lukownicy' || c === 'dystans') return cat === 'lukownicy';
  if (c === 'kawaleria') return cat === 'kawaleria';
  if (c === 'rydwany') return cat === 'rydwany';
  if (c === 'morska') return cat === 'morska';
  if (c === 'obleczenie' || c === 'obleznicza') return cat === 'obleczenie';
  if (c === 'wszystko') return true;
  return cat === c;
}

function terrainIsForestOrJungle(terrain: string): boolean {
  const t = stripDiacritics(terrain);
  return t.includes('las') || t.includes('dzungl') || t.includes('gor');
}

export function bonusApplies(
  b: CivBonusEntry,
  unit: CivBonusUnitShape,
  ctx: CivCombatContext,
): boolean {
  if (!isKnownMatrixCombatEntry(b)) return false;
  if (b.realizuje !== 'walka') return false;
  if (b.typ === 'jednostka_specjalna') return false;
  if (typeof b.wartosc !== 'number') return false;
  if (!unitMatchesCel(unit, b.cel)) return false;

  const terrain = ctx.terrain ?? '';

  if (b.matrixParamId === 'walka_atak_piechota_terytorium_wlasne'
    || b.matrixParamId === 'walka_obrona_piechota_terytorium_wlasne') {
    if (!ctx.ownTerritory) return false;
  }
  if (b.matrixParamId?.includes('_w_murze') && !ctx.onWallWalkway) return false;
  if (b.matrixParamId?.includes('_teren_las') && !terrainIsForestOrJungle(terrain)) return false;
  if (b.matrixParamId?.includes('_teren_plytkie_morze') && !ctx.shallowSea) return false;
  if (b.matrixParamId?.includes('_runda_szarzy') && !ctx.isChargeRound) return false;

  if (b.typ === 'bonus_obrona' && ctx.side !== 'defender') return false;

  return true;
}

function applyMatrixCombatBonus(
  m: CivStatMultipliers,
  b: CivBonusEntry,
): void {
  const v = b.wartosc as number;
  const matrixId = b.matrixParamId ?? '';

  if (matrixId.startsWith('walka_ruch_') || matrixId === 'walka_zasieg_proc' || matrixId === 'walka_oblezenie_proc') return;
  if (matrixId.startsWith('walka_atak_') || matrixId === 'walka_atak_wszystkie') m.atk += v;
  if (matrixId.startsWith('walka_obrona_') && !matrixId.includes('_w_murze')) m.obrona += v;
  if (matrixId.startsWith('walka_pancerz_')) m.pancerz += v;
  if (matrixId.startsWith('walka_uderzenie_')) m.uderzenie += v;
  if (matrixId.startsWith('walka_dystans_')) m.rangedAtk += v;
  if (matrixId.startsWith('walka_hp_')) m.health += v;
}

/**
 * Sumuje bonusy walki jako ulgi procentowe (0.2 = +20% do statu).
 * Wywolaj osobno dla rundy szarzy (isChargeRound=true) i bazowo.
 */
export function civCombatStatMultipliers(
  bonusy: readonly CivBonusEntry[] | undefined,
  unit: CivBonusUnitShape,
  ctx: CivCombatContext,
): CivStatMultipliers {
  const result: CivStatMultipliers = { ...ONE };
  if (!bonusy?.length) return result;

  for (const b of bonusy) {
    if (!bonusApplies(b, unit, ctx)) continue;
    applyMatrixCombatBonus(result, b);
  }
  return result;
}

/**
 * Effective matrix entries for UI projections use the same gates as combat.
 * Legacy civ descriptions are deliberately not parsed or presented as effects.
 */
export function civCombatBonusProjection(
  bonusy: readonly CivBonusEntry[] | undefined,
  unit: CivBonusUnitShape,
  ctx: CivCombatContext,
): CivBonusEntry[] {
  if (!bonusy?.length) return [];
  return bonusy.filter(b => bonusApplies(b, unit, ctx) && isCombatModifierBonus(b));
}

/** PreBattle chips mirror the effective per-unit combat projection. */
export function effectiveCombatBonusChipTexts(
  bonusy: readonly CivBonusEntry[],
  roster: readonly CivBonusUnitShape[],
  ctx: CivCombatContext,
): string[] {
  const seen = new Set<string>();
  for (const unit of roster) {
    for (const b of civCombatBonusProjection(bonusy, unit, ctx)) {
      if (!isCombatModifierBonus(b)) continue;
      const text = (b.opis ?? '').trim();
      if (text) seen.add(text);
    }
  }
  return [...seen];
}

export function applyMultiplier(base: number, addFrac: number): number {
  return base * (1 + addFrac);
}

const MATRIX_COMBAT_SPECS: ReadonlyArray<readonly [string, string, string]> = [
  ['walka_atak_piechota', 'bonus_walka', 'piechota'], ['walka_atak_lukownicy', 'bonus_walka', 'lukownicy'],
  ['walka_atak_kawaleria', 'bonus_walka', 'kawaleria'], ['walka_atak_rydwany', 'bonus_walka', 'rydwany'],
  ['walka_atak_obleczenie', 'bonus_walka', 'obleczenie'], ['walka_atak_morska', 'bonus_walka', 'morska'],
  ['walka_atak_wszystkie', 'bonus_walka', 'wszystko'],
  ['walka_obrona_piechota', 'bonus_obrona', 'piechota'], ['walka_obrona_lukownicy', 'bonus_obrona', 'lukownicy'],
  ['walka_obrona_kawaleria', 'bonus_obrona', 'kawaleria'], ['walka_obrona_rydwany', 'bonus_obrona', 'rydwany'],
  ['walka_obrona_obleczenie', 'bonus_obrona', 'obleczenie'], ['walka_obrona_morska', 'bonus_obrona', 'morska'],
  ['walka_pancerz_piechota', 'bonus_walka', 'piechota'], ['walka_pancerz_lukownicy', 'bonus_walka', 'lukownicy'],
  ['walka_pancerz_kawaleria', 'bonus_walka', 'kawaleria'], ['walka_pancerz_rydwany', 'bonus_walka', 'rydwany'],
  ['walka_uderzenie_piechota', 'bonus_walka', 'piechota'], ['walka_uderzenie_kawaleria', 'bonus_walka', 'kawaleria'],
  ['walka_uderzenie_rydwany', 'bonus_walka', 'rydwany'], ['walka_dystans_lukownicy', 'bonus_walka', 'lukownicy'],
  ['walka_dystans_rydwany', 'bonus_walka', 'rydwany'], ['walka_hp_piechota', 'bonus_obrona', 'piechota'],
  ['walka_hp_kawaleria', 'bonus_obrona', 'kawaleria'], ['walka_hp_rydwany', 'bonus_obrona', 'rydwany'],
  ['walka_atak_piechota_teren_las', 'bonus_walka', 'piechota'], ['walka_obrona_piechota_teren_las', 'bonus_obrona', 'piechota'],
  ['walka_atak_piechota_terytorium_wlasne', 'bonus_walka', 'piechota'], ['walka_obrona_piechota_terytorium_wlasne', 'bonus_obrona', 'piechota'],
  ['walka_atak_piechota_w_murze', 'bonus_walka', 'piechota'], ['walka_obrona_piechota_w_murze', 'bonus_obrona', 'piechota'],
  ['walka_atak_piechota_runda_szarzy', 'bonus_walka', 'piechota'], ['walka_obrona_piechota_runda_szarzy', 'bonus_obrona', 'piechota'],
  ['walka_atak_piechota_teren_plytkie_morze', 'bonus_walka', 'piechota'], ['walka_obrona_piechota_teren_plytkie_morze', 'bonus_obrona', 'piechota'],
  ['walka_ruch_piechota_teren_plytkie_morze', 'bonus_walka', 'piechota'],
];

const MATRIX_ADAPTER_EXCLUDED_IDS = new Set(['walka_atak_lukownicy']);
const MATRIX_ZERO_MARKER_IDS = new Set([
  'walka_atak_piechota',
  'walka_obrona_piechota',
  'walka_pancerz_piechota',
  'walka_dystans_lukownicy',
  'walka_hp_piechota',
  'walka_hp_rydwany',
]);
const MATRIX_COMBAT_ENTRY_SPECS = new Map<string, readonly [string, string]>();
for (const [id, typ, cel] of MATRIX_COMBAT_SPECS) {
  if (!MATRIX_ADAPTER_EXCLUDED_IDS.has(id)) MATRIX_COMBAT_ENTRY_SPECS.set(id, [typ, cel]);
}
for (const [id, typ, cel] of [
  ['walka_ruch_bitwa_proc', 'bonus_walka', 'piechota'],
  ['walka_ruch_rydwany', 'bonus_walka', 'rydwany'],
  ['walka_zasieg_proc', 'bonus_walka', 'wszystko'],
  ['walka_oblezenie_proc', 'bonus_walka', 'wszystko'],
] as const) {
  MATRIX_COMBAT_ENTRY_SPECS.set(id, [typ, cel]);
}

function isKnownMatrixCombatEntry(b: CivBonusEntry): boolean {
  const id = b.matrixParamId;
  if (!id || b.realizuje !== 'walka' || typeof b.wartosc !== 'number' || !Number.isFinite(b.wartosc)) return false;
  const spec = MATRIX_COMBAT_ENTRY_SPECS.get(id);
  return !!spec && b.typ === spec[0] && b.cel === spec[1];
}

export function civMatrixBonusyForCivKey(civKey: string): CivBonusEntry[] {
  const out: CivBonusEntry[] = [];
  const normalizedKey = civKey.toLowerCase();
  const hasMatrixRow = loadCivMatrix().cywilizacje.some(row =>
    [row.ikonaId, row.typCywilizacji, row.Cywilizacja].some(value => value.toLowerCase() === normalizedKey));
  for (const [id, typ, cel] of MATRIX_COMBAT_SPECS) {
    if (MATRIX_ADAPTER_EXCLUDED_IDS.has(id)) continue;
    const wartosc = civMatrixParam(civKey, id);
    if (wartosc !== 0 || (hasMatrixRow && MATRIX_ZERO_MARKER_IDS.has(id))) {
      out.push({ typ, cel, wartosc, opis: `Matrix:${id}`, realizuje: 'walka', matrixParamId: id });
    }
  }
  for (const id of ['walka_ruch_bitwa_proc', 'walka_ruch_rydwany', 'walka_zasieg_proc', 'walka_oblezenie_proc']) {
    // Owner decision 1B: Egypt's chariot field replaces its overlapping
    // general battle-movement field, including when the specific value is 0.
    if (civKey === 'egipt' && id === 'walka_ruch_bitwa_proc') continue;
    const wartosc = civMatrixParam(civKey, id);
    const cel = id === 'walka_ruch_rydwany' || (id === 'walka_ruch_bitwa_proc' && civKey === 'egipt')
      ? 'rydwany'
      : id === 'walka_ruch_bitwa_proc'
        ? 'piechota'
        : 'wszystko';
    if (wartosc !== 0) out.push({ typ: 'bonus_walka', cel, wartosc, opis: `Matrix:${id}`, realizuje: 'walka', matrixParamId: id, matrixCivKey: civKey });
  }
  const recruitment = civMatrixParam(civKey, 'walka_koszt_rekrutacji_proc');
  if (recruitment !== 0) out.push({ typ: 'koszt_redukcja', cel: civKey === 'zulusi' ? 'Impi' : 'jednostki', wartosc: recruitment, opis: 'Matrix:walka_koszt_rekrutacji_proc', realizuje: 'ekonomia', matrixParamId: 'walka_koszt_rekrutacji_proc' });
  return out;
}

function matchingMatrixSum(
  bonusy: readonly CivBonusEntry[] | undefined,
  unit: CivBonusUnitShape,
  ids: readonly string[],
  terrain = '',
  shallowSea = false,
): number {
  let sum = 0;
  for (const b of bonusy ?? []) {
    const matrixParamId = b.matrixParamId;
    if (!matrixParamId || !isKnownMatrixCombatEntry(b) || !ids.includes(matrixParamId) || !unitMatchesCel(unit, b.cel)) continue;
    if (matrixParamId.includes('_teren_las') && !terrainIsForestOrJungle(terrain)) continue;
    if (matrixParamId.includes('_teren_plytkie_morze') && !shallowSea) continue;
    if (typeof b.wartosc === 'number') sum += b.wartosc;
  }
  return sum;
}

export function civMovementMultiplier(bonusy: readonly CivBonusEntry[] | undefined, unit: CivBonusUnitShape, terrain = '', shallowSea = false): number {
  return 1 + matchingMatrixSum(bonusy, unit, ['walka_ruch_bitwa_proc', 'walka_ruch_rydwany', 'walka_ruch_piechota_teren_plytkie_morze'], terrain, shallowSea);
}

/** Decision 4B excludes Egyptian battle movement from strategic embarkation only. */
export function civEmbarkationMovementMultiplier(bonusy: readonly CivBonusEntry[] | undefined, unit: CivBonusUnitShape): number {
  const strategicBonusy = bonusy?.filter(b => b.matrixCivKey !== 'egipt'
    || b.matrixParamId === 'walka_ruch_piechota_teren_plytkie_morze');
  return civMovementMultiplier(strategicBonusy, unit, '', true);
}

export function civAttackRangeMultiplier(bonusy: readonly CivBonusEntry[] | undefined, unit: CivBonusUnitShape): number {
  return 1 + matchingMatrixSum(bonusy, unit, ['walka_zasieg_proc', 'walka_dystans_rydwany']);
}

export function civSiegeAttackMultiplier(bonusy: readonly CivBonusEntry[] | undefined, unit: CivBonusUnitShape): number {
  return 1 + matchingMatrixSum(bonusy, unit, ['walka_oblezenie_proc']);
}

export function civWallDefenseMultiplier(bonusy: readonly CivBonusEntry[] | undefined, unit: CivBonusUnitShape): number {
  return 1 + matchingMatrixSum(bonusy, unit, ['walka_obrona_piechota_w_murze']);
}

// ---------------------------------------------------------------------------
// Miasto: redukcja kosztu budowli (Rzymianie koszt_redukcja)
// ---------------------------------------------------------------------------

/** Ulga na koszt Produkcji budynkow (0.2 = -20%). Sumuje bonusy miasto. */
export function civBuildingCostDiscount(
  bonusy: readonly CivBonusEntry[] | undefined,
): number {
  if (!bonusy?.length) return 0;
  let disc = 0;
  for (const b of bonusy) {
    if (b.realizuje !== 'miasto') continue;
    if (b.typ !== 'koszt_redukcja') continue;
    if (b.cel !== 'budynki') continue;
    if (typeof b.wartosc === 'number' && b.wartosc > 0) disc += b.wartosc;
  }
  return Math.min(disc, 0.75);
}

export function buildingCostAfterCivDiscount(
  baseCost: number,
  bonusy: readonly CivBonusEntry[] | undefined,
): number {
  const disc = civBuildingCostDiscount(bonusy);
  if (disc <= 0 || baseCost <= 0) return baseCost;
  return Math.max(1, Math.floor(baseCost * (1 - disc)));
}

/**
 * PreBattle — tylko liczbowe modyfikatory walki.
 * Pomija jednostka_specjalna (flavor), ekonomię i miasto.
 */
export function isCombatModifierBonus(b: CivBonusEntry): boolean {
  return isKnownMatrixCombatEntry(b) && b.wartosc !== 0;
}
