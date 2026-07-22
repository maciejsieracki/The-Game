/**
 * post-battle-map.ts — wspólne skutki walki na mapie (auto + ręczna 3D).
 * Werdykt/straty: auto = M v2b; ręczna = survivors z bitwy.
 * Ruch po walce: identyczny kanon §14 AUTO-WALKA-MOC-ALGORYTM.
 */

import type { GameMap } from '../types/map';
import type { City } from './cities';
import { onCityCapturedCulture } from './conquest-stability';
import type { RuntimeUnit } from '../units/setup';
import { hexNeighborCoords, isCivilianUnit } from '../units/setup';
import { syncStackRuchLeft } from './armyMerge';
import { applyLossPctToRoster } from './auto-battle-power';
import type { UnitPowerInput } from './unit-power';

export type MapBattleWinner = 'atakujacy' | 'obronca' | 'remis';

export interface BattleStartPos {
  q: number;
  r: number;
}

export interface ManualSurvivor {
  id: string;
  hp?: number;
}

export interface PostBattleMapInput {
  units: RuntimeUnit[];
  map: GameMap;
  cities: City[];
  battleQ: number;
  battleR: number;
  atkAnchor: RuntimeUnit;
  atkRoster: RuntimeUnit[];
  defRoster: RuntimeUnit[];
  atkStart: Map<string | number, BattleStartPos>;
  winner: MapBattleWinner;
  lossAtkPct?: number;
  lossDefPct?: number;
  manualSurvivors?: ManualSurvivor[];
  getDef: (u: RuntimeUnit) => UnitPowerInput & Record<string, unknown>;
  maxHpOf: (def: UnitPowerInput) => number;
  isPassableHex: (q: number, r: number) => boolean;
  isUnitAt: (q: number, r: number, exceptId?: string | number) => boolean;
  rng?: () => number;
  cityOnBattleHex?: City | null;
}

export interface PostBattleMapResult {
  removedIds: string[];
}

function removeUnitById(units: RuntimeUnit[], id: string | number): void {
  const idx = units.findIndex(u => u.id === id);
  if (idx >= 0) units.splice(idx, 1);
}

function liveUnit(units: RuntimeUnit[], id: string | number): RuntimeUnit | undefined {
  return units.find(u => u.id === id);
}

function applyAutoLosses(input: PostBattleMapInput): Set<string> {
  const dead = new Set<string>();
  const toRows = (roster: RuntimeUnit[]) =>
    roster.map(u => ({
      id: String(u.id),
      typeId: u.typeId,
      def: input.getDef(u),
      hp: u.hp,
    }));

  if (input.lossAtkPct != null && input.lossAtkPct > 0) {
    for (const row of applyLossPctToRoster(toRows(input.atkRoster), input.lossAtkPct, input.maxHpOf)) {
      const u = liveUnit(input.units, row.id);
      if (!u) continue;
      if (row.dead) dead.add(row.id);
      else u.hp = row.hpAfter;
    }
  }

  if (input.lossDefPct != null && input.lossDefPct > 0) {
    for (const row of applyLossPctToRoster(toRows(input.defRoster), input.lossDefPct, input.maxHpOf)) {
      const u = liveUnit(input.units, row.id);
      if (!u) continue;
      if (row.dead) dead.add(row.id);
      else u.hp = row.hpAfter;
    }
  }

  for (const id of dead) removeUnitById(input.units, id);
  return dead;
}

function applyManualSurvivors(input: PostBattleMapInput): void {
  const live = new Set((input.manualSurvivors ?? []).map(s => String(s.id)));
  const hpMap = new Map(
    (input.manualSurvivors ?? []).map(s => [String(s.id), s.hp] as const),
  );
  for (const u of [...input.atkRoster, ...input.defRoster]) {
    if (!live.has(String(u.id))) {
      removeUnitById(input.units, u.id);
      continue;
    }
    const hp = hpMap.get(String(u.id));
    const run = liveUnit(input.units, u.id);
    if (run && hp != null) {
      if (hp <= 0) removeUnitById(input.units, u.id);
      else run.hp = hp;
    }
  }
}

function wipeDefenderOnCityCenter(input: PostBattleMapInput): void {
  const city = input.cityOnBattleHex;
  if (!city) return;
  for (const u of input.defRoster) {
    if (u.q === city.q && u.r === city.r) {
      removeUnitById(input.units, u.id);
    }
  }
}

function centroidOfRoster(roster: RuntimeUnit[]): { q: number; r: number } {
  if (roster.length === 0) return { q: 0, r: 0 };
  let sq = 0;
  let sr = 0;
  for (const u of roster) {
    sq += u.q;
    sr += u.r;
  }
  return { q: sq / roster.length, r: sr / roster.length };
}

/** Heks 1 krok od bitwy — najdalej od atakujących (ucieczka obrońcy). */
export function pickRetreatTargetAwayFromAttacker(input: PostBattleMapInput): { q: number; r: number } {
  const atk = centroidOfRoster(input.atkRoster);
  const neighbors = hexNeighborCoords(input.battleQ, input.battleR);
  const passable = neighbors.filter(n => input.isPassableHex(n.q, n.r));
  if (passable.length === 0) return { q: input.battleQ, r: input.battleR };

  passable.sort((a, b) => {
    const da = (a.q - atk.q) ** 2 + (a.r - atk.r) ** 2;
    const db = (b.q - atk.q) ** 2 + (b.r - atk.r) ** 2;
    return db - da;
  });
  return passable[0]!;
}

/** Heks 1 krok od bitwy — w stronę atakujących (remis / cofnięcie ATK). */
export function pickRetreatTargetTowardAttackerSide(input: PostBattleMapInput): { q: number; r: number } {
  const atk = centroidOfRoster(input.atkRoster);
  const neighbors = hexNeighborCoords(input.battleQ, input.battleR);
  const passable = neighbors.filter(n => input.isPassableHex(n.q, n.r));
  if (passable.length === 0) return { q: input.battleQ, r: input.battleR };

  passable.sort((a, b) => {
    const da = (a.q - atk.q) ** 2 + (a.r - atk.r) ** 2;
    const db = (b.q - atk.q) ** 2 + (b.r - atk.r) ** 2;
    return da - db;
  });
  return passable[0]!;
}

function placeFanOutGroup(
  input: PostBattleMapInput,
  roster: RuntimeUnit[],
  lead: RuntimeUnit,
  direction: { q: number; r: number },
  stayOnCityCenter = false,
): void {
  const dq = direction.q - input.battleQ;
  const dr = direction.r - input.battleR;
  const order = [lead, ...roster.filter(u => u.id !== lead.id)];

  for (const ref of order) {
    const u = liveUnit(input.units, ref.id);
    if (!u) continue;

    if (stayOnCityCenter && input.cityOnBattleHex &&
        u.q === input.cityOnBattleHex.q && u.r === input.cityOnBattleHex.r) {
      continue;
    }

    let placed = false;
    for (let step = 1; step <= 3; step++) {
      const tq = u.q + dq * step;
      const tr = u.r + dr * step;
      if (!input.isPassableHex(tq, tr)) break;
      if (!input.isUnitAt(tq, tr, u.id)) {
        u.q = tq;
        u.r = tr;
        placed = true;
        break;
      }
    }

    if (!placed) {
      const prev = u.defLossesThisTurn ?? 0;
      if (prev >= 1) removeUnitById(input.units, u.id);
      else u.defLossesThisTurn = prev + 1;
    }
  }
}

function pickLiveDefLead(
  input: PostBattleMapInput,
  defAlive: RuntimeUnit[],
): RuntimeUnit | null {
  if (defAlive.length === 0) return null;
  const onBattle = defAlive.find(u => u.q === input.battleQ && u.r === input.battleR);
  return onBattle ?? defAlive[0]!;
}

/** Ocalali obrońcy fan-out −1 heks (pole i miasto — Maciej B 2026-06-26). Centrum miasta = wipe przed fan-out. */
function retreatDefendersAfterAtkWin(input: PostBattleMapInput): void {
  const defAlive = input.defRoster
    .map(r => liveUnit(input.units, r.id))
    .filter((u): u is RuntimeUnit => !!u);
  const lead = pickLiveDefLead(input, defAlive);
  if (!lead) return;

  const dir = pickRetreatTargetAwayFromAttacker(input);
  placeFanOutGroup(input, defAlive, lead, dir, !!input.cityOnBattleHex);
}

function retreatDefendersOnTie(input: PostBattleMapInput): void {
  const defAlive = input.defRoster
    .map(r => liveUnit(input.units, r.id))
    .filter((u): u is RuntimeUnit => !!u);
  const lead = pickLiveDefLead(input, defAlive);
  if (!lead) return;

  const dir = pickRetreatTargetAwayFromAttacker(input);
  placeFanOutGroup(input, defAlive, lead, dir, !!input.cityOnBattleHex);
}

/**
 * Po wygranej ATK: kotwica (i ewentualny stos na jej hexie startowym) wchodzi na heks bitwy.
 * Wspierający z sąsiednich hexów zostają — §13b / §14 AUTO-WALKA-MOC-ALGORYTM.
 */
function moveAtkRosterOntoBattleHex(input: PostBattleMapInput): void {
  const anchor = input.atkAnchor;
  const anchorStart = input.atkStart.get(anchor.id);
  const liveAtk = input.atkRoster
    .map(r => liveUnit(input.units, r.id))
    .filter((u): u is RuntimeUnit => !!u);
  if (liveAtk.length === 0) return;

  const moved: RuntimeUnit[] = [];
  for (const u of liveAtk) {
    if (isCivilianUnit(u) && u.id !== anchor.id) continue;
    const start = input.atkStart.get(u.id);
    const onAnchorStartHex =
      u.id === anchor.id
      || (anchorStart != null && start != null && start.q === anchorStart.q && start.r === anchorStart.r);
    if (!onAnchorStartHex) continue;
    u.q = input.battleQ;
    u.r = input.battleR;
    moved.push(u);
  }
  if (moved.length > 1) syncStackRuchLeft(moved);
}

function retreatAtkRosterToStart(input: PostBattleMapInput): void {
  for (const ref of input.atkRoster) {
    const u = liveUnit(input.units, ref.id);
    if (!u) continue;
    const start = input.atkStart.get(ref.id);
    if (start) {
      u.q = start.q;
      u.r = start.r;
    }
  }
}

function spendAttackMpOnLive(
  units: RuntimeUnit[],
  atkRoster: RuntimeUnit[],
  anchorId: string | number | undefined,
): void {
  for (const ref of atkRoster) {
    if (isCivilianUnit(ref) && ref.id !== anchorId) continue;
    const u = units.find(x => x.id === ref.id);
    if (u) u.ruchLeft = Math.max(0, u.ruchLeft - 1);
  }
}

export function applyPostBattleMap(input: PostBattleMapInput): PostBattleMapResult {
  const removedIds: string[] = [];

  if (input.manualSurvivors !== undefined) {
    applyManualSurvivors(input);
  } else {
    const dead = applyAutoLosses(input);
    dead.forEach(id => removedIds.push(id));
  }

  if (input.winner === 'atakujacy') {
    if (input.cityOnBattleHex) wipeDefenderOnCityCenter(input);
    retreatDefendersAfterAtkWin(input);
    moveAtkRosterOntoBattleHex(input);
  } else if (input.winner === 'obronca') {
    retreatAtkRosterToStart(input);
    for (const ref of input.defRoster) {
      const u = liveUnit(input.units, ref.id);
      if (u) u.defLossesThisTurn = (u.defLossesThisTurn ?? 0) + 1;
    }
  } else {
    const atkDir = pickRetreatTargetTowardAttackerSide(input);
    const stayCity = !!input.cityOnBattleHex;
    const atkAlive = input.atkRoster.map(r => liveUnit(input.units, r.id)).filter(Boolean) as RuntimeUnit[];
    if (atkAlive.length > 0) {
      placeFanOutGroup(input, atkAlive, input.atkAnchor, atkDir, stayCity);
    }
    retreatDefendersOnTie(input);
  }

  spendAttackMpOnLive(input.units, input.atkRoster, input.atkAnchor.id);
  return { removedIds };
}

export function snapshotRosterPositions(roster: RuntimeUnit[]): Map<string | number, BattleStartPos> {
  const m = new Map<string | number, BattleStartPos>();
  for (const u of roster) m.set(u.id, { q: u.q, r: u.r });
  return m;
}

export function findCityOnHex(cities: City[], q: number, r: number): City | undefined {
  return cities.find(c => c.q === q && c.r === r);
}

export function applyCityCaptureAfterBattle(
  city: City,
  atkRoster: RuntimeUnit[],
  atkOwner: number,
  units: RuntimeUnit[],
  anchorId: string | number = atkRoster[0]?.id ?? '',
): RuntimeUnit | null {
  const prevOwner = city.ownerId;
  for (let i = units.length - 1; i >= 0; i--) {
    const u = units[i]!;
    if (u.ownerId === city.ownerId && u.q === city.q && u.r === city.r) {
      units.splice(i, 1);
    }
  }

  let lead: RuntimeUnit | null = null;
  for (const ref of atkRoster) {
    const live = units.find(x => x.id === ref.id);
    if (!live) continue;
    const isAnchor = ref.id === anchorId;
    if (isAnchor && !isCivilianUnit(live)) {
      live.q = city.q;
      live.r = city.r;
      lead = live;
    }
    if (isCivilianUnit(live) && !isAnchor) continue;
    live.ruchLeft = Math.max(0, live.ruchLeft - 1);
    if (live.inGarnizon) delete live.inGarnizon;
    if (live.oblegaCityId === city.id) delete live.oblegaCityId;
  }

  city.ownerId = atkOwner;
  city.oblegane = false;
  if (city.rebelState) city.rebelState = false;
  onCityCapturedCulture(city, atkOwner, prevOwner);
  return lead;
}
