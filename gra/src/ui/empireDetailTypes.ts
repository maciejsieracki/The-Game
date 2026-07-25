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
  /**
   * SUROW-CIV-01 (Maciej 2026-07-24): cap CAŁEGO PAŃSTWA (civ-wide) dla tego typu
   * surowca — capBase + capBonusPerMagazyn×liczba Magazynów ownera. Brak (undefined)
   * dla wierszy czystego dostępu (Sól/Koń/Ceramika — `access`, stock zawsze 0/—).
   */
  cap?: number;
  /**
   * SUROW-UI-A1 (2026-07-24): baza capu (econ-params.json magazyn_baza_surowce, DZIŚ
   * 500) — pozwala UI wyliczyć tekst „baza + bonus × Magazyny” bez zaszywania starej
   * wartości 100 na sztywno. Brak (undefined) dla wierszy dostępu.
   */
  capBase?: number;
  /** Bonus capu za KAŻDY Magazyn (econ-params.json magazyn_bonus_surowce_na_budynek). */
  capBonusPerMagazyn?: number;
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

/**
 * TEMAT 14 (Maciej 2026-07-24) — jedna aktywna trasa handlowa gracz↔obca cywilizacja
 * (trade-routes.ts TradeRoute), widziana z panelu imperium (nie panelu miasta).
 */
export interface EmpireTradeRouteRow {
  id: string;
  /** Miasto gracza (fromCityId trasy — trasy zawsze gracz↔obcy, patrz refreshTradeRoutes). */
  cityName: string;
  partnerCityName: string;
  partnerOwnerLabel: string;
  medium: 'lad' | 'morze';
  dystans: number;
  /** Dochód tej trasy/turę (tradeRouteDistanceIncome) — kredytowany OBU miastom w pełnej kwocie. */
  income: number;
}

/** Zbiorczy widok imperium: suma dochodu + rozpiska aktywnych tras (żeton HUD „Handel"). */
export interface EmpireTradeSnap {
  totalIncome: number;
  routes: EmpireTradeRouteRow[];
}

export interface EmpireDetailSnap {
  global: EmpireGlobalParams;
  economy: HudState;
  kultura: EmpireKulturaSnap;
  power: EmpirePowerSnap;
  cityEcon: EmpireCityEconRow[];
  cityPobor: EmpireCityPoborRow[];
  resources: EmpireResourceRow[];
  trade: EmpireTradeSnap;
}
