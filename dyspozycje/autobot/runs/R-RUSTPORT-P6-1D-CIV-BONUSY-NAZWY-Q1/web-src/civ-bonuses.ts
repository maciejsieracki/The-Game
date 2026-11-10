/**
 * civ-bonuses.ts
 * Odczyt i stosowanie bonusow cywilizacji z civs.json (RDY-01, D4).
 * Pure functions — bez stanu globalnego.
 */

import { civMatrixParam } from './civ-matrix';

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

  if (rola === 'morska' || counter === 'naval') return 'morska';
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

function opisMentionsForest(opis: string): boolean {
  const o = stripDiacritics(opis);
  return o.includes('les') || o.includes('dzungl') || o.includes('gorsk');
}

function opisChargeOnly(opis: string): boolean {
  const o = stripDiacritics(opis);
  if (o.includes('uderzeni') && o.includes('szarz')) return true;
  if (o.includes('pierwsz')) return true;
  if (o.includes('szarz') && !o.includes('les')) return true;
  if (o.includes('starciu')) return true;
  return false;
}

function opisForestOrCharge(opis: string): boolean {
  const o = stripDiacritics(opis);
  return o.includes(' lub ') && opisMentionsForest(opis) && (o.includes('pierwsz') || o.includes('zasadzk'));
}

export function bonusApplies(
  b: CivBonusEntry,
  unit: CivBonusUnitShape,
  ctx: CivCombatContext,
): boolean {
  if (b.realizuje !== 'walka') return false;
  if (b.typ === 'jednostka_specjalna') return false;
  if (typeof b.wartosc !== 'number') return false;
  if (!unitMatchesCel(unit, b.cel)) return false;

  const opis = b.opis ?? '';
  const terrain = ctx.terrain ?? '';

  if (b.matrixParamId === 'walka_atak_piechota_terytorium_wlasne'
    || b.matrixParamId === 'walka_obrona_piechota_terytorium_wlasne') {
    if (!ctx.ownTerritory) return false;
  }
  if (b.matrixParamId?.includes('_w_murze') && !ctx.onWallWalkway) return false;
  if (b.matrixParamId?.includes('_teren_las') && !terrainIsForestOrJungle(terrain)) return false;
  if (b.matrixParamId?.includes('_teren_plytkie_morze') && !ctx.shallowSea) return false;
  if (b.matrixParamId?.includes('_runda_szarzy') && !ctx.isChargeRound) return false;

  if (opisForestOrCharge(opis)) {
    const forestOk = terrain.length > 0 && terrainIsForestOrJungle(terrain);
    const chargeOk = ctx.isChargeRound === true;
    if (!forestOk && !chargeOk) return false;
    return true;
  }

  if (opisMentionsForest(opis) && terrain.length > 0 && !terrainIsForestOrJungle(terrain)) {
    return false;
  }

  if (opisChargeOnly(opis) && !ctx.isChargeRound) return false;

  if (b.typ === 'bonus_obrona' && ctx.side !== 'defender') return false;

  return true;
}

function applyWalkBonus(
  m: CivStatMultipliers,
  b: CivBonusEntry,
  side: 'attacker' | 'defender',
): void {
  const v = b.wartosc as number;
  const opis = stripDiacritics(b.opis ?? '');
  const matrixId = b.matrixParamId ?? '';

  if (matrixId.startsWith('walka_ruch_') || matrixId === 'walka_zasieg_proc' || matrixId === 'walka_oblezenie_proc') return;
  if (matrixId.startsWith('walka_atak_') || matrixId === 'walka_atak_wszystkie') m.atk += v;
  if (matrixId.startsWith('walka_obrona_') && !matrixId.includes('_w_murze')) m.obrona += v;
  if (matrixId.startsWith('walka_pancerz_')) m.pancerz += v;
  if (matrixId.startsWith('walka_uderzenie_')) m.uderzenie += v;
  if (matrixId.startsWith('walka_dystans_')) m.rangedAtk += v;
  if (matrixId.startsWith('walka_hp_')) m.health += v;
  if (b.matrixParamId) return;

  if (b.typ === 'bonus_obrona') {
    m.obrona += v;
    if (opis.includes('hp') || opis.includes('health') || opis.includes('ciezka piechota')) {
      m.health += v;
    }
    if (opis.includes('pancerz')) m.pancerz += v;
    return;
  }

  if (b.typ !== 'bonus_walka') return;

  // „Atak” przed „uderzeniu” — opisy typu „pierwszym uderzeniu” to narracja szarży, nie stat Uderzenie.
  if (opis.includes('ataku') || (opis.includes(' atak') && !opis.includes('uderzen'))) {
    m.atk += v;
    if (opis.includes('pancerz')) m.pancerz += v;
    if (opis.includes('obron') && side === 'defender') m.obrona += v;
    return;
  }

  if (opis.includes('uderzeni') || (opis.includes('szarz') && opis.includes('kawaler'))) {
    m.uderzenie += v;
    return;
  }
  if (opis.includes('dystans') || (opis.includes('lucz') && opis.includes('rydwan'))) {
    m.rangedAtk += v;
    return;
  }
  if (opis.includes('hp') && opis.includes('obron')) {
    m.health += v;
    m.obrona += v;
    return;
  }
  if (opis.includes('pancerz') && !opis.includes('atak')) {
    m.pancerz += v;
    return;
  }

  m.atk += v;
  if (opis.includes('pancerz')) m.pancerz += v;
  if (opis.includes('obron') && side === 'defender') m.obrona += v;
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
  const m: CivStatMultipliers = { ...ONE };
  if (!bonusy?.length) return m;

  for (const b of bonusy) {
    if (!bonusApplies(b, unit, ctx)) continue;
    applyWalkBonus(m, b, ctx.side);
  }
  return m;
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

export function civMatrixBonusyForCivKey(civKey: string): CivBonusEntry[] {
  const out: CivBonusEntry[] = [];
  const excludedG1 = new Set([
    'walka_atak_lukownicy', 'walka_atak_piechota', 'walka_dystans_lukownicy',
    'walka_hp_piechota', 'walka_hp_rydwany', 'walka_obrona_piechota', 'walka_pancerz_piechota',
  ]);
  for (const [id, typ, cel] of MATRIX_COMBAT_SPECS) {
    if (excludedG1.has(id)) continue;
    const wartosc = civMatrixParam(civKey, id);
    if (wartosc !== 0) out.push({ typ, cel, wartosc, opis: `Matrix:${id}`, realizuje: 'walka', matrixParamId: id });
  }
  for (const id of ['walka_ruch_bitwa_proc', 'walka_ruch_rydwany', 'walka_zasieg_proc', 'walka_oblezenie_proc']) {
    const wartosc = civMatrixParam(civKey, id);
    const cel = id === 'walka_ruch_rydwany' || (id === 'walka_ruch_bitwa_proc' && civKey === 'egipt')
      ? 'rydwany'
      : id === 'walka_ruch_bitwa_proc'
        ? 'piechota'
        : 'wszystko';
    if (wartosc !== 0) out.push({ typ: 'bonus_walka', cel, wartosc, opis: `Matrix:${id}`, realizuje: 'walka', matrixParamId: id });
  }
  const recruitment = civMatrixParam(civKey, 'walka_koszt_rekrutacji_proc');
  if (recruitment !== 0) out.push({ typ: 'koszt_redukcja', cel: 'jednostki', wartosc: recruitment, opis: 'Matrix:walka_koszt_rekrutacji_proc', realizuje: 'ekonomia', matrixParamId: 'walka_koszt_rekrutacji_proc' });
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
    if (!b.matrixParamId || !ids.includes(b.matrixParamId) || !unitMatchesCel(unit, b.cel)) continue;
    if (b.matrixParamId.includes('_teren_las') && !terrainIsForestOrJungle(terrain)) continue;
    if (b.matrixParamId.includes('_teren_plytkie_morze') && !shallowSea) continue;
    if (typeof b.wartosc === 'number') sum += b.wartosc;
  }
  return sum;
}

export function civMovementMultiplier(bonusy: readonly CivBonusEntry[] | undefined, unit: CivBonusUnitShape, terrain = '', shallowSea = false): number {
  return 1 + matchingMatrixSum(bonusy, unit, ['walka_ruch_bitwa_proc', 'walka_ruch_rydwany', 'walka_ruch_piechota_teren_plytkie_morze'], terrain, shallowSea);
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
  if (b.realizuje !== 'walka') return false;
  if (b.typ === 'jednostka_specjalna') return false;
  return typeof b.wartosc === 'number';
}
