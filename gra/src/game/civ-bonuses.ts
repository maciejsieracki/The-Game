/**
 * civ-bonuses.ts
 * Odczyt i stosowanie bonusow cywilizacji z civs.json (RDY-01, D4).
 * Pure functions — bez stanu globalnego.
 */

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
}

export interface CivBonusUnitShape {
  typNazwa: string;
  rola: string;
  missileAttack?: number;
}

export interface CivCombatContext {
  side: 'attacker' | 'defender';
  terrain?: string;
  isChargeRound?: boolean;
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
