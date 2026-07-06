/**
 * empire-food.ts — implementacja ticku zapasów państwa (B5-Q1=A, B5-Q2=A).
 */
import type { EconomyTickResult, EconUnit } from './turn-economy';
import type { UpkeepParams } from './economy-upkeep';
import { militaryFoodConsumption } from './economy-upkeep';

export interface EmpireFoodState {
  zapasyPanstwa: number;
  procentRozwoj: number;
}

export interface EmpireFoodParams {
  procentRozwojDefault: number;
  glodWojskaHpFrac:     number;
  /** B5-SP: pojemność zapasów armii na 1 Spichlerz w imperium (domyślnie 100). */
  spichlerzPojemnoscZapasowPanstwa: number;
}

export interface EmpireFoodTick {
  ownerId:       number;
  zywnoscBrutto: number;
  doRozwoju:     number;
  doPanstwa:     number;
  kosztArmii:    number;
  zapasyPrzed:   number;
  zapasyPo:      number;
  glodWojska:    boolean;
}

export interface EmpireFoodTickResult {
  perOwner: EmpireFoodTick[];
  byOwner:  Map<number, EmpireFoodTick>;
}

type Difficulty = 'easy' | 'normal' | 'hard';

interface RawParamRow { easy?: number; normal?: number; hard?: number; }

function pick(row: RawParamRow | undefined, d: Difficulty, fallback: number): number {
  if (!row) return fallback;
  const v = row[d];
  return Number.isFinite(v) ? (v as number) : fallback;
}

export function buildEmpireFoodParams(
  raw: {
    suwak_zywnosc_rozwoj_domyslnie?: RawParamRow;
    glod_wojska_hp_frac?: RawParamRow;
    spichlerz_pojemnosc_zapasow_panstwa?: RawParamRow;
  },
  difficulty: Difficulty = 'normal',
): EmpireFoodParams {
  return {
    procentRozwojDefault: pick(raw.suwak_zywnosc_rozwoj_domyslnie, difficulty, 100),
    glodWojskaHpFrac:     pick(raw.glod_wojska_hp_frac, difficulty, 0.08),
    spichlerzPojemnoscZapasowPanstwa: pick(raw.spichlerz_pojemnosc_zapasow_panstwa, difficulty, 100),
  };
}

export function freshEmpireFoodState(procentRozwojDefault = 100): EmpireFoodState {
  return { zapasyPanstwa: 0, procentRozwoj: procentRozwojDefault };
}

export function advanceEmpireFood(
  econ: EconomyTickResult,
  units: ReadonlyArray<EconUnit>,
  states: Map<number, EmpireFoodState>,
  upkeep: UpkeepParams,
  params: EmpireFoodParams,
): EmpireFoodTickResult {
  const bruttoByOwner = new Map<number, number>();
  const spichlerzCountByOwner = new Map<number, number>();
  for (const tick of econ.perCity) {
    if (tick.maSpichlerz) {
      spichlerzCountByOwner.set(
        tick.ownerId,
        (spichlerzCountByOwner.get(tick.ownerId) ?? 0) + 1,
      );
    }
    if (tick.oblegany) continue;
    const z = Math.max(0, tick.zywnoscNetto);
    bruttoByOwner.set(tick.ownerId, (bruttoByOwner.get(tick.ownerId) ?? 0) + z);
  }

  const perOwner: EmpireFoodTick[] = [];
  const byOwner  = new Map<number, EmpireFoodTick>();

  const ownerIds = new Set<number>([
    ...bruttoByOwner.keys(),
    ...states.keys(),
    ...units.map(u => u.ownerId),
  ]);

  for (const ownerId of ownerIds) {
    const st = states.get(ownerId) ?? freshEmpireFoodState(params.procentRozwojDefault);
    if (!states.has(ownerId)) states.set(ownerId, st);

    const pctRozwoj = Math.min(100, Math.max(0, st.procentRozwoj));
    const brutto    = bruttoByOwner.get(ownerId) ?? 0;
    const doRozwoju = brutto * (pctRozwoj / 100);
    const doPanstwa = brutto - doRozwoju;

    const ownerUnits = units.filter(u => u.ownerId === ownerId);
    const kosztArmii = militaryFoodConsumption(ownerUnits, upkeep);

    const zapasyPrzed = st.zapasyPanstwa;
    const spichlerzCount = spichlerzCountByOwner.get(ownerId) ?? 0;
    const canStoreArmyFood = spichlerzCount > 0;
    const maxZapasy = spichlerzCount * params.spichlerzPojemnoscZapasowPanstwa;
    let zapasyPo: number;
    if (canStoreArmyFood) {
      zapasyPo = zapasyPrzed + doPanstwa - kosztArmii;
      if (zapasyPo > maxZapasy) zapasyPo = maxZapasy;
    } else {
      // Bez Spichlerza w imperium: wojsko je tylko z tej tury; nadwyżka przepada.
      zapasyPo = doPanstwa - kosztArmii;
      if (zapasyPo > 0) zapasyPo = 0;
    }
    st.zapasyPanstwa  = zapasyPo;
    _maxCapByOwner.set(ownerId, maxZapasy);

    const tick: EmpireFoodTick = {
      ownerId,
      zywnoscBrutto: brutto,
      doRozwoju,
      doPanstwa,
      kosztArmii,
      zapasyPrzed,
      zapasyPo,
      glodWojska: zapasyPo < 0,
    };
    perOwner.push(tick);
    byOwner.set(ownerId, tick);
  }

  _setLastEmpireFoodTicks(byOwner);
  return { perOwner, byOwner };
}

let _lastTicks = new Map<number, EmpireFoodTick>();
let _statesRef = new Map<number, EmpireFoodState>();
let _maxCapByOwner = new Map<number, number>();

export function bindEmpireFoodRuntime(states: Map<number, EmpireFoodState>): void {
  _statesRef = states;
}

export function getEmpireFoodReserve(ownerId: number): number {
  return _statesRef.get(ownerId)?.zapasyPanstwa ?? 0;
}

/** B5-SP: max zapasów armii (100 × liczba Spichlerzy); 0 gdy brak Spichlerza. */
export function getEmpireFoodMaxCap(ownerId: number): number {
  return _maxCapByOwner.get(ownerId) ?? 0;
}

export function getEmpireFoodSplit(ownerId: number): number {
  return _statesRef.get(ownerId)?.procentRozwoj ?? 100;
}

export function isArmyStarving(ownerId: number): boolean {
  const t = _lastTicks.get(ownerId);
  return t?.glodWojska ?? false;
}

export function getLastEmpireFoodTick(ownerId: number): EmpireFoodTick | undefined {
  return _lastTicks.get(ownerId);
}

export function _setLastEmpireFoodTicks(ticks: Map<number, EmpireFoodTick>): void {
  _lastTicks = ticks;
}
