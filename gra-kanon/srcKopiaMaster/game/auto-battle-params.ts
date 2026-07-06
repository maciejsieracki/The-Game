/**
 * auto-battle-params.ts — parametry auto-walki (Panel-C → auto-battle-params.json).
 */

import raw from '../../data/auto-battle-params.json';

export interface AutoBattleStratyParams {
  L_MAX: number;
  p_atk: number;
  p_def: number;
  p?: number;
  L_MIN: number;
  remis_pct: number;
  coef_zwyciezca: number;
  coef_przegrany: number;
}

export interface AutoBattleParamsFile {
  kalibracja?: string;
  straty: AutoBattleStratyParams;
}

const file = raw as AutoBattleParamsFile;

export function loadAutoBattleParams(): AutoBattleStratyParams {
  const s = file.straty ?? ({} as AutoBattleStratyParams);
  const legacyP = s.p ?? 0.58;
  return {
    L_MAX: s.L_MAX ?? 0.42,
    p_atk: s.p_atk ?? legacyP,
    p_def: s.p_def ?? legacyP,
    L_MIN: s.L_MIN ?? 0.05,
    remis_pct: s.remis_pct ?? 0.4,
    coef_zwyciezca: s.coef_zwyciezca ?? 1.0,
    coef_przegrany: s.coef_przegrany ?? 1.0,
  };
}

/** Kanon upset: ~20% gdy R zwycięzcy < 1.15 */
export const UPSET_R_THRESHOLD = 1.15;
export const UPSET_CHANCE = 0.2;
export const TIE_EPS = 0.01;
