/**
 * empireDetailTypes.ts — snapshot panelu imperium (HUD mapy).
 */
import type { HudState } from './hud';

export interface EmpireGlobalParams {
  civName: string;
  civEmoji: string;
  styl: string;
  jednostkaSpec: string;
  bonusStartowy: string;
  religiaPanstwowa: string;
  bonusy: Array<{ opis: string; realizuje: string }>;
}

export interface EmpireResourceRow {
  id: string;
  icon: string;
  label: string;
  stock: number;
  ratePerTurn: number;
  assigned?: string;
  typ: 'podstawowy' | 'surowy' | 'przetworzony' | 'hodowla';
  dostep: boolean;
}

export interface EmpireKulturaSnap {
  total: number;
  rate: number;
  thresholds: number[];
  nextThreshold: number | null;
  pctToNext: number | null;
  happinessNote: string;
  cities: Array<{ name: string; kultura: number; borderRadius: number }>;
}

export interface EmpirePowerComponentRow {
  key: string;
  label: string;
  rawCount: number;
  weightPct: number;
  normalized: number;
  points: number;
  sharePct: number;
  formulaNote?: string;
}

export interface EmpirePowerSnap {
  power: number;
  powerBase: number;
  components: EmpirePowerComponentRow[];
  ranking: Array<{ civ: string; power: number; rank: number; isPlayer?: boolean }>;
  respektExample?: { civ: string; respekt: number; playerPower: number; theirPower: number };
  ludnoscLudki: number;
  ludnoscAbsLabel: string;
  rekruci: number;
  rekruciLabel: string;
  rekrutEkw: number;
  rekruciMax: number;
  rekruciMaxLabel: string;
  unitsOnMap: number;
  kosztJednostki: number;
}

/** Dochód / turę per miasto (ostatni tick ekonomii). */
export interface EmpireCityEconRow {
  name: string;
  pieniadz: number;
  pracaPula: number;
  pracaBudynki: number;
  nauka: number;
}

/** Ludność i pula rekrutów per miasto. */
export interface EmpireCityPoborRow {
  name: string;
  ludki: number;
  ludnoscAbsLabel: string;
  rekruci: number;
  rekruciMax: number;
  regenPerTurn: number;
}

export interface EmpireDetailSnap {
  global: EmpireGlobalParams;
  economy: HudState;
  kultura: EmpireKulturaSnap;
  power: EmpirePowerSnap;
  cityEcon: EmpireCityEconRow[];
  cityPobor: EmpireCityPoborRow[];
  resources: EmpireResourceRow[];
}
