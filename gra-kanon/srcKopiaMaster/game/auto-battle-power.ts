/**
 * auto-battle-power.ts — werdykt i straty auto-walki na mocy M (kanon v2b).
 */

import type { UnitPowerInput } from './unit-power';
import { armyFieldPower, isSiegeUnit } from './unit-power';
import {
  loadAutoBattleParams,
  UPSET_CHANCE,
  UPSET_R_THRESHOLD,
  TIE_EPS,
  type AutoBattleStratyParams,
} from './auto-battle-params';

export type AutoBattleWinner = 'attacker' | 'defender' | 'tie' | 'none';

export interface AutoBattleResolveResult {
  winner: AutoBattleWinner;
  ratio: number;
  mAtk: number;
  mDef: number;
  mDefEffective: number;
  lossAtkPct: number;
  lossDefPct: number;
  upset?: boolean;
  note?: string;
}

const LINE_WEIGHTS: Record<string, number> = {
  'Wręcz': 1.0,
  'Flanka': 0.5,
  'Dystans': 0.25,
  'Morska': 0.5,
  'Wsparcie': 0.5,
};

const BATTLE_EXCLUDED_TYPES = new Set(['Zwiadowca', 'Osadnik']);

export function isFieldBattleUnit(typeId: string, def: UnitPowerInput): boolean {
  if (isSiegeUnit(def)) return false;
  if (BATTLE_EXCLUDED_TYPES.has(typeId)) return false;
  return armyFieldPower(def) > 0;
}

export function lineWeightForDef(def: UnitPowerInput): number {
  const rola = (def['Rola (linia)'] ?? '').trim();
  return LINE_WEIGHTS[rola] ?? 1.0;
}

export function sumRosterFieldM(
  roster: ReadonlyArray<{ typeId: string; def: UnitPowerInput }>,
): number {
  let sum = 0;
  for (const u of roster) {
    if (!isFieldBattleUnit(u.typeId, u.def)) continue;
    sum += armyFieldPower(u.def);
  }
  return Math.round(sum * 10) / 10;
}

function coreLoss(ratio: number, pExp: number, L_MAX: number): number {
  const r = Math.max(1, ratio);
  return L_MAX / Math.pow(r, pExp);
}

function winnerLossPct(ratio: number, pExp: number, p: AutoBattleStratyParams): number {
  const raw = p.coef_zwyciezca * coreLoss(ratio, pExp, p.L_MAX);
  const cap = Math.min(1, p.coef_zwyciezca * p.L_MAX);
  return Math.round(Math.max(p.L_MIN, Math.min(cap, raw)) * 10000) / 10000;
}

function loserLossPct(ratio: number, pExp: number, p: AutoBattleStratyParams): number {
  const core = coreLoss(ratio, pExp, p.L_MAX);
  return Math.round(Math.min(1, p.coef_przegrany * (1 - core)) * 10000) / 10000;
}

function isTie(mAtk: number, mDef: number): boolean {
  if (mAtk <= 0 && mDef <= 0) return true;
  const denom = Math.max(mAtk, mDef, 1);
  return Math.abs(mAtk - mDef) / denom < TIE_EPS;
}

export interface ResolveAutoBattleInput {
  mAtk: number;
  mDef: number;
  rng?: () => number;
  params?: AutoBattleStratyParams;
}

/**
 * Szansa atakującego na preBattle (0–100) — ten sam stos M co auto-walka v2b.
 * mDef powinno być już po terenie/murze (jak w effectiveDefenderM).
 */
export function autoBattleWinPct(mAtk: number, mDef: number): number {
  const a = Math.max(0, mAtk);
  const d = Math.max(0, mDef);
  if (a <= 0 && d <= 0) return 50;
  if (a <= 0) return 0;
  if (d <= 0) return 100;
  return Math.round((a / (a + d)) * 100);
}

/**
 * Werdykt + % strat (przed wagami linii na HP).
 * mDef powinno być już pomnożone przez teren/mur jeśli dotyczy.
 */
export function resolveAutoBattleByPower(input: ResolveAutoBattleInput): AutoBattleResolveResult {
  const p = input.params ?? loadAutoBattleParams();
  const mAtk = input.mAtk;
  const mDef = input.mDef;
  const rng = input.rng ?? Math.random;

  if (mAtk <= 0 && mDef <= 0) {
    return { winner: 'none', ratio: 1, mAtk, mDef, mDefEffective: mDef, lossAtkPct: 0, lossDefPct: 0 };
  }

  if (isTie(mAtk, mDef)) {
    return {
      winner: 'tie',
      ratio: 1,
      mAtk,
      mDef,
      mDefEffective: mDef,
      lossAtkPct: p.remis_pct,
      lossDefPct: p.remis_pct,
      note: 'remis M',
    };
  }

  let winner: 'attacker' | 'defender' =
    mAtk > mDef ? 'attacker' : 'defender';
  let upset = false;

  const mW = Math.max(mAtk, mDef);
  const mL = Math.max(Math.min(mAtk, mDef), 1);
  let ratio = mW / mL;

  if (ratio < UPSET_R_THRESHOLD) {
    if (rng() < UPSET_CHANCE) {
      winner = winner === 'attacker' ? 'defender' : 'attacker';
      upset = true;
      ratio = mW / mL;
    }
  }

  let lossAtk: number;
  let lossDef: number;

  if (winner === 'attacker') {
    lossAtk = winnerLossPct(ratio, p.p_atk, p);
    lossDef = loserLossPct(ratio, p.p_def, p);
  } else {
    lossDef = winnerLossPct(ratio, p.p_def, p);
    lossAtk = loserLossPct(ratio, p.p_atk, p);
  }

  return {
    winner,
    ratio: Math.round(ratio * 1000) / 1000,
    mAtk,
    mDef,
    mDefEffective: mDef,
    lossAtkPct: lossAtk,
    lossDefPct: lossDef,
    upset,
  };
}

export interface UnitLossRow {
  id: string;
  hpBefore: number;
  hpAfter: number;
  dead: boolean;
  effLossPct: number;
}

/** Straty HP na składzie (krok 9b — wagi linii). */
export function applyLossPctToRoster(
  roster: ReadonlyArray<{ id: string; typeId: string; def: UnitPowerInput; hp?: number }>,
  lossPct: number,
  maxHpOf: (def: UnitPowerInput) => number,
): UnitLossRow[] {
  const rows: UnitLossRow[] = [];
  for (const u of roster) {
    const maxHp = maxHpOf(u.def);
    const before = u.hp ?? maxHp;
    const w = lineWeightForDef(u.def);
    const eff = Math.min(1, lossPct * w);
    const after = Math.max(0, Math.floor(before * (1 - eff)));
    rows.push({
      id: u.id,
      hpBefore: before,
      hpAfter: after,
      dead: after <= 0,
      effLossPct: Math.round(eff * 1000) / 10,
    });
  }
  return rows;
}
