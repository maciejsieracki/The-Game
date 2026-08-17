/**
 * e-start-params-loader.ts — odczyt Panel-E (`gra/data/e-start-params.json`).
 * Kreator nowej gry + meta zwycięstwa (batch F-E-START-PARAMS).
 */
import raw from '../../data/e-start-params.json';
import { normPlMenuLabel } from '../util/norm-pl-label';
import type { QualityTier } from '../map/newGameMapDefaults';

export interface TypyCywilizacjiTripleRow {
  default: number;
  min: number;
  max: number;
}

export type StartEpochId = 'kamien' | 'braz' | 'zelazo';

interface SkalaRow {
  rywale_ai?: number;
  miasta_panstwa?: number;
  /** Legacy — domyślna liczba typów (żelazo lub pojedyncza skala). */
  typy_cywilizacji?: number;
  typy_cywilizacji_per_epoka?: Partial<Record<StartEpochId, TypyCywilizacjiTripleRow>>;
  hex_w?: number;
  hex_h?: number;
}

type RawEStart = {
  defaulty?: {
    player_civ_id?: string;
    start_epoch_id?: string;
    map_quality_default?: string;
    render_quality_bundled?: string;
    city_limit_base_default?: number;
  };
  skala_mapy?: Record<string, SkalaRow>;
  tempo_gry?: Record<string, number>;
  city_limits?: Record<string, number>;
  zwyciestwo?: {
    ostatnia_epoka_v1?: number;
    prog_dominacji_power?: number;
    dominacja_wymaga_ostatniej_epoki?: boolean;
    nauka_wymaga_rakiety?: boolean;
  };
  kreator_zaawansowane?: Record<string, unknown>;
};

const R = raw as RawEStart;

const MENU_KEYS = ['Malenki', 'Mały', 'Standardowy', 'Duży', 'Ogromny', 'Super Huge'] as const;

function normMenuLabel(label: string): string {
  return normPlMenuLabel(label);
}

function skalaRow(menuLabel: string): SkalaRow | undefined {
  const n = normMenuLabel(menuLabel);
  const m = R.skala_mapy;
  if (!m) return undefined;
  for (const key of Object.keys(m)) {
    if (normMenuLabel(key) === n) return m[key];
  }
  for (const key of MENU_KEYS) {
    if (normMenuLabel(key) === n) return m[key];
  }
  return undefined;
}

export function eStartPlayerCivId(): string {
  return R.defaulty?.player_civ_id ?? 'rzymianie';
}

export function eStartEpochId(): string {
  return R.defaulty?.start_epoch_id ?? 'kamien';
}

export function eStartMapQualityDefault(): string {
  return R.defaulty?.map_quality_default ?? 'Średnia';
}

export function eStartRenderQualityBundled(): QualityTier {
  const q = R.defaulty?.render_quality_bundled ?? 'medium';
  if (q === 'low' || q === 'high') return q;
  return 'medium';
}

export function eStartRywaleAi(menuLabel: string): number | undefined {
  return skalaRow(menuLabel)?.rywale_ai;
}

function normEpochId(epochId: string): StartEpochId {
  const n = epochId.toLowerCase().replace(/ł/g, 'l').trim();
  if (n === 'braz' || n === 'bronz') return 'braz';
  if (n === 'zelazo' || n === 'iron') return 'zelazo';
  return 'kamien';
}

export function eStartTypyCywilizacjiPerEpoka(
  menuLabel: string,
  epochId: string,
): TypyCywilizacjiTripleRow | undefined {
  const row = skalaRow(menuLabel);
  const ep = normEpochId(epochId);
  const triple = row?.typy_cywilizacji_per_epoka?.[ep];
  if (!triple) return undefined;
  const { default: def, min, max } = triple;
  if (
    typeof def !== 'number' || typeof min !== 'number' || typeof max !== 'number'
    || !Number.isFinite(def) || !Number.isFinite(min) || !Number.isFinite(max)
  ) {
    return undefined;
  }
  return { default: def, min, max };
}

export function eStartTypyCywilizacji(menuLabel: string): number | undefined {
  const row = skalaRow(menuLabel);
  const kamien = row?.typy_cywilizacji_per_epoka?.kamien?.default;
  if (typeof kamien === 'number' && kamien > 0) return kamien;
  return row?.typy_cywilizacji;
}

export function eStartMiastaPanstwa(menuLabel: string): number | undefined {
  return skalaRow(menuLabel)?.miasta_panstwa;
}

export function eStartHexDims(menuLabel: string): [number, number] | undefined {
  const row = skalaRow(menuLabel);
  if (row?.hex_w && row?.hex_h) return [row.hex_w, row.hex_h];
  return undefined;
}

export function eStartOstatniaEpokaV1(): number {
  const v = R.zwyciestwo?.ostatnia_epoka_v1;
  return typeof v === 'number' && v > 0 ? v : 3;
}

export function eStartProgDominacjiPower(): number {
  const v = R.zwyciestwo?.prog_dominacji_power;
  return typeof v === 'number' && v > 0 && v < 1 ? v : 0.5;
}

export function eStartDominacjaWymagaOstatniejEpoki(): boolean {
  return R.zwyciestwo?.dominacja_wymaga_ostatniej_epoki !== false;
}

export function eStartNaukaWymagaRakiety(): boolean {
  return R.zwyciestwo?.nauka_wymaga_rakiety !== false;
}

export function eStartTempoMultiplier(label: string): number | undefined {
  const n = normMenuLabel(label);
  const t = R.tempo_gry;
  if (!t) return undefined;
  for (const [k, v] of Object.entries(t)) {
    if (normMenuLabel(k) === n && typeof v === 'number') return v;
  }
  return undefined;
}

export function eStartCityLimitBaseDefault(): number {
  const v = R.defaulty?.city_limit_base_default;
  return typeof v === 'number' && v > 0 ? v : 10;
}

export function eStartCityLimitBaseOptions(): number[] {
  const limits = R.city_limits;
  if (!limits || typeof limits !== 'object') return [10, 15, 20];
  const opts = Object.values(limits).filter(v => typeof v === 'number' && v > 0).sort((a, b) => a - b);
  return opts.length > 0 ? opts : [10, 15, 20];
}
