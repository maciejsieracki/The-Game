'use strict';
/**
 * R-BITWA-BTF-MIXED-ARMY-DOCTRINES-Q1
 * Headless BattleScene production-logic matrix. This executes the production
 * `_activateUnit`, doctrine dispatch, production target selection, production
 * BFS/cavalry movement planners, and production formation slot planner. Its
 * `_doMove` and `_doAttack` adapters record fixture actions (they do not animate,
 * apply damage, or prove the full runtime attack loop). It does NOT claim a
 * WebGL, visual-collision, or full Chromium battle test.
 */
const assert = require('assert');
const path = require('path');
const vm = require('vm');
const fs = require('fs');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');
const { initialBattleFormation, initialBattleSlots, classifyInitialBattleRole } = require(path.join(ROOT, 'src/battle/formationRules.ts'));
const terrainData = require(path.join(ROOT, 'data/terrain-combat.json'));

async function loadBattleScene() {
  const result = await esbuild.build({
    stdin: {
      contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };",
      resolveDir: ROOT, sourcefile: 'battle-large-mixed-doctrine-matrix-entry.ts',
    },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(ROOT, 'node_modules/three/build/three.cjs') },
    plugins: [{ name: 'stub-browser-services', setup(build) {
      const entries = [
        [/brandAssets/, 'brand', 'export const civIconSvg=()=>""; export const brandIconSvg=()=>"";'],
        [/leaderPortraits/, 'leader', 'export const leaderPortraitUrl=()=>""; export const leaderName=()=>""; export const civIconIdFromCivLabel=()=>"";'],
        [/muzyka-antyczna/, 'audio', 'export const startVictoryMusic=()=>{}; export const startDefeatMusic=()=>{}; export const startBattleMusic=()=>{};'],
      ];
      for (const [filter, namespace, contents] of entries) {
        build.onResolve({ filter }, args => ({ path: args.path, namespace }));
        build.onLoad({ filter: /.*/, namespace }, () => ({ contents, loader: 'js' }));
      }
    } }],
    write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports, require, console, process, globalThis,
    setTimeout, clearTimeout,
  }, { filename: 'battleScene.ts' });
  return module.exports.BattleScene;
}

const roles = [
  ...Array.from({ length: 14 }, () => 'infantry'),
  ...Array.from({ length: 6 }, () => 'javelin'),
  ...Array.from({ length: 8 }, () => 'archer'),
  ...Array.from({ length: 4 }, () => 'slinger'),
  ...Array.from({ length: 7 }, () => 'cavalry'),
  ...Array.from({ length: 3 }, () => 'chariot'),
];
const roleDetails = {
  infantry: { category: 'miecznik', name: 'Wojownik', ranged: false, mounted: false, reach: 0 },
  javelin: { category: 'oszczepnik', name: 'Oszczepnik', ranged: true, mounted: false, reach: 2 },
  archer: { category: 'lucznik', name: 'Łucznik', ranged: true, mounted: false, reach: 3 },
  slinger: { category: 'procarz', name: 'Procarz', ranged: true, mounted: false, reach: 4 },
  cavalry: { category: 'konnica', name: 'Jeździec', ranged: false, mounted: true, reach: 0 },
  chariot: { category: 'rydwan', name: 'Rydwan konny', ranged: false, mounted: true, reach: 0 },
};
const roleOf = unit => classifyInitialBattleRole({
  category: roleDetails[unit.role].category,
  name: roleDetails[unit.role].name,
  primaryRanged: roleDetails[unit.role].ranged,
});
const key = (q, r) => `${q},${r}`;

function makeSide(side, rankWidth, archerLines, meleeLines, attackDirection, fronts) {
  const raw = roles.map((role, i) => ({ id: `${side}-${role}-${i}`, role }));
  const formation = initialBattleFormation(raw, roleOf);
  const slots = initialBattleSlots(formation, {
    rankWidth, midRow: 36, playRow0: 2, playRow1: 70, archerLines, meleeLines,
  });
  const front = side === 'atk' ? fronts.atk : fronts.def;
  const rankStep = side === 'atk' ? -1 : 1;
  const positions = slots.map(slot => ({
    q: front + slot.rank * rankStep,
    r: slot.row,
  }));
  const center = {
    q: positions.reduce((sum, p) => sum + p.q, 0) / positions.length,
    r: positions.reduce((sum, p) => sum + p.r, 0) / positions.length,
  };
  return slots.map((slot, index) => {
    const detail = roleDetails[slot.unit.role];
    const { q, r } = positions[index];
    return {
      bu: {
        id: slot.unit.id,
        nazwa: detail.name,
        kategoria: detail.category,
        hp: 500, maxHp: 500,
        stats: {
          Jednostka: detail.name,
          'Atak dystansowy': detail.ranged ? 5 : 0,
          'Zasięg ataku (hex)': detail.reach,
          'Ilosc pociskow': detail.ranged ? 20 : 0,
          'Ruch w bitwie (heksy)': 2,
          Atak: 12, Obrona: 8, Pancerz: 2,
        },
      },
      q, r, side,
      dead: false, fadingOut: false, removed: false, routed: false,
      acted: false, moveLeft: 2, morale: 100, moraleMax: 100,
      mounted: detail.mounted, rangedBase: detail.ranged,
      primaryRanged: detail.ranged, ranged: detail.ranged,
      range: detail.reach, rangeBase: detail.reach,
      ammoLeft: detail.ranged ? 20 : 0, ammoMax: detail.ranged ? 20 : 0,
      shootingEnabled: true, rangedKite: false,
      formationRank: slot.rank,
      formationOffset: { dc: Math.round(q - center.q), dr: Math.round(r - center.r) },
      groupId: undefined,
      playerOrder: { type: 'none' },
      attackDirection,
      facing: side === 'atk' ? 'E' : 'W',
    };
  });
}

function makeScenario(BattleScene, { doctrine, rangedLines, priorityVariant, terrainVariant }) {
  const activeSide = doctrine === 'defensive' ? 'def' : 'atk';
  const fronts = terrainVariant === 'engaged' ? { atk: 15, def: 16 } : { atk: 11, def: 20 };
  const atk = makeSide('atk', 20, rangedLines, 1, priorityVariant ? 'bok' : 'front', fronts);
  const def = makeSide('def', 20, rangedLines, 1, priorityVariant ? 'bok' : 'front', fronts);
  const active = activeSide === 'atk' ? atk : def;
  const enemies = activeSide === 'atk' ? def : atk;
  const initialPositions = Object.fromEntries(active.map(ru => [ru.bu.id, { q: ru.q, r: ru.r }]));
  const initialDistances = {};
  for (const role of Object.keys(roleDetails)) {
    const units = active.filter(ru => roleForId(ru.bu.id) === role);
    const minimums = units.map(ru => Math.min(...enemies.map(e => Math.abs(ru.q - e.q) + Math.abs(ru.r - e.r))));
    initialDistances[role] = {
      min: Math.min(...minimums),
      max: Math.max(...minimums),
      unitsWithTargetInRange: units.filter((ru, i) => minimums[i] <= (roleDetails[role].reach || 1)).length,
    };
  }
  const gid = 'active-group-1';
  for (const ru of active) ru.groupId = gid;

  const blocked = new Set();
  if (terrainVariant === 'corridor') {
    // Deterministic rough-ground channel with three continuous 4-connected
    // passes. Staggering each opening by column accidentally made an unbroken
    // wall for the square battle pathfinder, invalidating the intended corridor.
    const openRows = new Set([20, 21, 22, 31, 32, 33, 42, 43, 44]);
    for (const q of [13, 14, 15]) {
      for (let r = 16; r <= 56; r++) {
        if (!openRows.has(r)) blocked.add(key(q, r));
      }
    }
  }
  const scene = Object.create(BattleScene.prototype);
  const occByKey = new Map([...atk, ...def].map(ru => [key(ru.q, ru.r), ru]));
  const events = [];
  const traceIds = new Set(active.filter(ru => ru.rangedBase).map(ru => ru.bu.id));
  Object.assign(scene, {
    atk, def, occByKey,
    finished: false, siegeWallCol: -1, _manualMode: false,
    _autoBattleSuspended: false, _autoBatchPlanning: null,
    _groupMeta: new Map([[gid, {
      doctrine, autoPlay: true, formation: 'F2',
      rallyCol: activeSide === 'atk' ? 60 : 0, rallyRow: 36,
      attackDirection: priorityVariant ? 'bok' : 'front',
    }]]),
    _groups: new Map([[gid, new Set(active.map(ru => ru.bu.id))]]),
    _selectedUnits: new Set(), _generalSettings: { blockadeActive: false, blockadeCol: null },
    _targetPriorities: {
      mounted: priorityVariant ? ['ranged', 'mounted', 'melee'] : ['mounted', 'ranged', 'melee'],
      ranged: priorityVariant ? ['mounted', 'ranged', 'melee'] : ['melee', 'ranged', 'mounted'],
      melee: priorityVariant ? ['ranged', 'mounted', 'melee'] : ['melee', 'mounted', 'ranged'],
    },
    terrainData,
    terrainMap: {
      at: () => 0,
      passable: (q, r) => q >= 0 && q < 64 && r >= 0 && r < 72 && !blocked.has(key(q, r)),
      moveCost: () => 1,
      combatTerrainName: () => 'Plaskie (rownina/laka)',
    },
    _playerRoster: () => active,
    _enemyRoster: () => enemies,
    _movePoints: 2,
    _isCatapult: () => false,
    _refreshQueuedOrderVisuals() {},
    _updateFacing() {},
    _updateMoraleBar() {},
    _updateAmmoBar() {},
    _doMove(ru, q, r, done) {
      const targetKey = key(q, r);
      const oldKey = key(ru.q, ru.r);
      if (occByKey.has(targetKey) || !this.terrainMap.passable(q, r)) {
        events.push({ type: 'blocked-move', unitId: ru.bu.id, role: roleForId(ru.bu.id), q, r });
        done(); return;
      }
      const moveLeftBefore = ru.moveLeft;
      occByKey.delete(oldKey);
      occByKey.set(targetKey, ru);
      ru.q = q; ru.r = r;
      ru.moveLeft = Math.max(0, ru.moveLeft - 1);
      events.push({ type: 'move', unitId: ru.bu.id, role: roleForId(ru.bu.id), from: oldKey, q, r, moveLeftBefore, moveLeftAfter: ru.moveLeft, turn: this._traceTurn });
      done();
    },
    _doAttack(ru, target, done) {
      const distance = Math.abs(ru.q - target.q) + Math.abs(ru.r - target.r);
      const ranged = ru.rangedBase && ru.ammoLeft > 0;
      const legal = ranged ? distance >= 1 && distance <= ru.range : distance === 1 || (distance === 0 && ru.onWallWalkway && target.onWallWalkway);
      if (!legal) {
        events.push({ type: 'illegal-attack', unitId: ru.bu.id, role: roleForId(ru.bu.id), distance });
        done(); return;
      }
      const ammoBefore = ru.ammoLeft;
      if (ranged) ru.ammoLeft--;
      events.push({ type: ranged ? 'shot' : 'melee-attack', unitId: ru.bu.id, role: roleForId(ru.bu.id), targetId: target.bu.id, distance, range: ru.range, ammoBefore, ammoAfter: ru.ammoLeft, targetHp: target.bu.hp, turn: this._traceTurn });
      done();
    },
    _schedule(_delay, cb) { cb(); },
  });
  const originalRangedPick = BattleScene.prototype._pickRangedTargetByPriority;
  scene._pickRangedTargetByPriority = function(ru, ...args) {
    const selected = originalRangedPick.call(this, ru, ...args);
    if (traceIds.has(ru.bu.id)) events.push({ type: 'ranged-pick', unitId: ru.bu.id, targetId: selected?.bu.id ?? null, at: [ru.q, ru.r], targetAt: selected ? [selected.q, selected.r] : null, distance: selected ? Math.abs(ru.q-selected.q)+Math.abs(ru.r-selected.r) : null, range: ru.range, ammo: ru.ammoLeft, rank: ru.formationRank, moveLeft: ru.moveLeft, acted: ru.acted, turn: this._traceTurn, enemies: this._enemiesOf(ru).map(e=>({id:e.bu.id,at:[e.q,e.r],distance:Math.abs(ru.q-e.q)+Math.abs(ru.r-e.r),class:this._unitBattleClass(e),priority:this._priorityScore(ru,e)})).filter(e=>e.distance<=ru.range+2).sort((a,b)=>a.distance-b.distance).slice(0,8) });
    return selected;
  };
  const originalCompactGate = BattleScene.prototype._compactAttackAllowsStep;
  scene._compactAttackAllowsStep = function(ru, candidateCol) {
    const allowed = originalCompactGate.call(this, ru, candidateCol);
    if (traceIds.has(ru.bu.id)) events.push({ type: 'line-gate', unitId: ru.bu.id, from: [ru.q, ru.r], candidateCol, allowed, rank: ru.formationRank, moveLeft: ru.moveLeft, acted: ru.acted });
    return allowed;
  };
  const routeSearchMetrics = { calls: 0, passabilityChecks: 0, maxChecksPerCall: 0 };
  const originalPassable = BattleScene.prototype._passableForUnit;
  const originalRoute = BattleScene.prototype._firstStepTowardMoveDestination;
  scene._passableForUnit = function(ru, col, row) {
    if (this._trackingMoveRoute) routeSearchMetrics.passabilityChecks++;
    return originalPassable.call(this, ru, col, row);
  };
  scene._firstStepTowardMoveDestination = function(...args) {
    routeSearchMetrics.calls++;
    const before = routeSearchMetrics.passabilityChecks;
    this._trackingMoveRoute = true;
    try { return originalRoute.apply(this, args); }
    finally {
      this._trackingMoveRoute = false;
      routeSearchMetrics.maxChecksPerCall = Math.max(routeSearchMetrics.maxChecksPerCall, routeSearchMetrics.passabilityChecks - before);
    }
  };
  return { scene, active, enemies, events, doctrine, rangedLines, priorityVariant, terrainVariant, initialDistances, initialPositions, routeSearchMetrics };
}

function roleForId(id) {
  const match = id.match(/-(infantry|javelin|archer|slinger|cavalry|chariot)-/);
  return match ? match[1] : 'unknown';
}

function summarize(scenario) {
  const out = {};
  for (const role of Object.keys(roleDetails)) {
    const own = scenario.active.filter(ru => roleForId(ru.bu.id) === role);
    const unitEvents = scenario.events.filter(e => e.role === role);
    out[role] = {
      units: own.length,
      moves: unitEvents.filter(e => e.type === 'move').length,
      shots: unitEvents.filter(e => e.type === 'shot').length,
      melee: unitEvents.filter(e => e.type === 'melee-attack').length,
      blockedMoves: unitEvents.filter(e => e.type === 'blocked-move').length,
      illegalAttacks: unitEvents.filter(e => e.type === 'illegal-attack').length,
      ammoSpent: own.reduce((sum, ru) => sum + (roleDetails[role].ranged ? 20 - ru.ammoLeft : 0), 0),
      idleUnits: own.filter(ru => !unitEvents.some(e => e.unitId === ru.bu.id && ['move', 'shot', 'melee-attack'].includes(e.type))).length,
      initialDistance: scenario.initialDistances[role],
      finalDistance: (() => {
        const nearest = own.map(ru => Math.min(...scenario.enemies.map(e => Math.abs(ru.q-e.q)+Math.abs(ru.r-e.r))));
        return { min: Math.min(...nearest), max: Math.max(...nearest), unitsOutsideWeaponRange: nearest.filter(d => d > (roleDetails[role].reach || 1)).length };
      })(),
    };
  }
  return out;
}

async function main() {
  const BattleScene = await loadBattleScene();
  const reports = [];
  const errors = [];
  const turnCount = Number(process.env.BTF_TURNS || 5);
  const selectedDoctrines = process.env.BTF_DOCTRINES ? new Set(process.env.BTF_DOCTRINES.split(',')) : null;
  const selectedLines = process.env.BTF_LINES ? new Set(process.env.BTF_LINES.split(',').map(Number)) : null;
  const selectedTerrain = process.env.BTF_TERRAIN || null;
  for (const doctrine of ['steady', 'defensive', 'aggressive']) {
    if (selectedDoctrines && !selectedDoctrines.has(doctrine)) continue;
    for (const rangedLines of [1, 2, 3]) {
      if (selectedLines && !selectedLines.has(rangedLines)) continue;
      for (const priorityVariant of [0, 1]) {
        for (const terrainVariant of ['engaged', 'corridor']) {
          if (selectedTerrain && selectedTerrain !== terrainVariant) continue;
          const s = makeScenario(BattleScene, { doctrine, rangedLines, priorityVariant, terrainVariant });
          for (let turn = 0; turn < turnCount; turn++) {
            for (const ru of s.active) {
              // Battle turns reset acted; call _activateUnit once per unit per
              // simulated round rather than silently leaving later rounds idle.
              ru.acted = false;
              ru.moveLeft = 2;
              ru.playerOrder = { type: 'none' };
              const traced = ru.rangedBase;
              const before = traced ? { q: ru.q, r: ru.r, moveLeft: ru.moveLeft, acted: ru.acted, ammoLeft: ru.ammoLeft } : null;
              s.scene._traceTurn = turn;
              BattleScene.prototype._activateUnit.call(s.scene, ru, () => {});
              if (traced) s.events.push({ type: 'activation', unitId: ru.bu.id, doctrine: s.doctrine, turn, before, after: { q: ru.q, r: ru.r, moveLeft: ru.moveLeft, acted: ru.acted, ammoLeft: ru.ammoLeft } });
            }
          }
          const summary = summarize(s);
          const idleReason = doctrine === 'defensive' ? 'expected-hold-if-no-target-in-range' : 'no-path/line-block/no-improving-move';
          const traceUnitIds = new Set(['atk-archer-26', 'atk-slinger-30', 'atk-slinger-28']);
          const trace = s.events.filter(event => traceUnitIds.has(event.unitId));
          reports.push({ doctrine, rangedLines, priorityVariant, terrainVariant, activeUnits: s.active.length, turns: turnCount, summary, idleReason, routeSearch: s.routeSearchMetrics, trace });
          if (s.events.some(e => e.type === 'illegal-attack')) {
            errors.push(`${doctrine}/lines${rangedLines}/priority${priorityVariant}/${terrainVariant}: illegal attack emitted`);
          }
          if (terrainVariant === 'engaged' && !s.events.some(e => e.type === 'shot' && (e.role === 'archer' || e.role === 'slinger' || e.role === 'javelin'))) {
            errors.push(`${doctrine}/lines${rangedLines}/priority${priorityVariant}/${terrainVariant}: no ranged shot across ${turnCount} activations`);
          }
          if (doctrine !== 'defensive' && !s.events.some(e => e.type === 'move' && (e.role === 'cavalry' || e.role === 'chariot'))) {
            errors.push(`${doctrine}/lines${rangedLines}/priority${priorityVariant}/${terrainVariant}: mounted roster made no move`);
          }
          if (doctrine === 'steady' && terrainVariant === 'engaged') {
            for (const role of ['javelin', 'archer', 'slinger']) {
              const units = s.active.filter(ru => roleForId(ru.bu.id) === role);
              for (const ru of units) {
                const unitEvents = s.events.filter(event => event.unitId === ru.bu.id);
                const fired = unitEvents.some(event => event.type === 'shot');
                const finalDistance = Math.min(...s.enemies.map(enemy => Math.abs(ru.q-enemy.q)+Math.abs(ru.r-enemy.r)));
                const activationEvents = unitEvents.filter(event => event.type === 'activation');
                const lastActivation = activationEvents.at(-1);
                const startDistance = lastActivation
                  ? Math.min(...s.enemies.map(enemy => Math.abs(lastActivation.before.q-enemy.q)+Math.abs(lastActivation.before.r-enemy.r)))
                  : finalDistance;
                const movedInLastActivation = unitEvents.some(event => event.type==='move' && event.turn===turnCount-1);
                const enteredRangeAtHorizon = lastActivation?.turn===turnCount-1
                  && startDistance>roleDetails[role].reach && finalDistance<=roleDetails[role].reach && movedInLastActivation;
                if (!fired && finalDistance<=roleDetails[role].reach && !enteredRangeAtHorizon) {
                  errors.push(`${doctrine}/lines${rangedLines}/priority${priorityVariant}/${terrainVariant}: ${ru.bu.id} started an activation in range but never fired`);
                }
                const initial = s.initialPositions[ru.bu.id];
                const initialDistance = Math.min(...s.enemies.map(enemy => Math.abs(initial.q-enemy.q)+Math.abs(initial.r-enemy.r)));
                if (!fired && finalDistance>roleDetails[role].reach && finalDistance>=initialDistance) {
                  errors.push(`${doctrine}/lines${rangedLines}/priority${priorityVariant}/${terrainVariant}: ${ru.bu.id} remained outside range without reducing distance (${initialDistance}->${finalDistance})`);
                }
              }
            }
          }
          if (terrainVariant === 'engaged' && doctrine !== 'defensive') {
            for (const role of ['cavalry', 'chariot']) {
              const idleMounted = s.active.filter(ru => roleForId(ru.bu.id) === role
                && !s.events.some(e => e.unitId === ru.bu.id && ['move', 'melee-attack'].includes(e.type)));
              if (idleMounted.length) {
                errors.push(`${doctrine}/lines${rangedLines}/priority${priorityVariant}/${terrainVariant}: ${idleMounted.length} ${role} units did not move or attack (${idleMounted.map(u => u.bu.id).join(', ')})`);
              }
            }
          }
          if (doctrine === 'steady' && terrainVariant === 'corridor' && turnCount >= 24
            && !s.events.some(e => e.type === 'shot' && ['archer', 'slinger', 'javelin'].includes(e.role))) {
            const details = s.active.filter(ru => ['archer', 'slinger', 'javelin'].includes(roleForId(ru.bu.id)))
              .map(ru => {
                const distance = Math.min(...s.enemies.map(e => Math.abs(ru.q - e.q) + Math.abs(ru.r - e.r)));
                const nearestEnemy = s.enemies.reduce((best, enemy) => {
                  const d = Math.abs(ru.q - enemy.q) + Math.abs(ru.r - enemy.r);
                  return d < best.distance ? { unit: enemy, distance: d } : best;
                }, { unit: s.enemies[0], distance: Number.POSITIVE_INFINITY });
                const canStep = col => s.scene._compactAttackAllowsStep(ru, col)
                  || s.scene._rangedFiringStepStaysBehindMelee(ru, col);
                const route512 = s.scene._firstStepTowardMoveDestination(ru, ru.q, ru.r, 512, canStep);
                const route2048 = s.scene._firstStepTowardMoveDestination(ru, ru.q, ru.r, 2048, canStep);
                const moves = s.events.filter(event => event.unitId === ru.bu.id && event.type === 'move')
                  .map(event => `${event.q},${event.r}`).join('>');
                const prioritizedTarget = s.scene._pickRangedTargetByPriority(ru);
                return `${roleForId(ru.bu.id)}@${ru.q},${ru.r}:d${distance}to${nearestEnemy.unit?.q},${nearestEnemy.unit?.r}:range=${ru.range}:canShoot=${ru.shootingEnabled && ru.ammoLeft>0}:prioritized=${prioritizedTarget?.bu.id ?? '-'}:lock=${ru.autoRangedTargetId ?? '-'}@${ru.autoRangedGoal?.q ?? '-'},${ru.autoRangedGoal?.r ?? '-'}:moves=${moves || '-'}:route512=${route512 ?? '-'}:route2048=${route2048 ?? '-'}`;
              }).join('|');
            const gate = [[13,31],[14,30],[15,29],[13,20],[14,19],[15,18],[13,42],[14,41],[15,40]]
              .map(([q,r]) => `${q},${r}:${s.scene.occByKey.get(key(q,r))?.bu.id ?? '-'}`).join(',');
            const meleeFront = s.active.filter(ru => roleForId(ru.bu.id) === 'infantry')
              .filter(ru => ru.r >= 25 && ru.r <= 35)
              .map(ru => `${ru.q},${ru.r}`).join(';');
            errors.push(`${doctrine}/lines${rangedLines}/priority${priorityVariant}/${terrainVariant}: no ranged unit reached firing range after ${turnCount} activations; gate=${gate}; meleeFront=${meleeFront}; ${details}`);
          }
        }
      }
    }
  }
  const reportPath = path.join(__dirname, '..', '..', 'dyspozycje', 'autobot', 'runs', 'R-BITWA-BTF-MIXED-ARMY-DOCTRINES-Q1', '01-matrix.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    label: 'headless production BattleScene action matrix; animation/renderer stubbed',
    seed: 20261028,
    unitsPerSide: roles.length,
    scenarios: reports,
    errors,
  }, null, 2) + '\n');
  for (const r of reports) {
    const ranged = ['javelin', 'archer', 'slinger'].map(role => `${role}:${r.summary[role].shots}/${r.summary[role].moves}/${r.summary[role].idleUnits}`).join(' ');
    const mounted = ['cavalry', 'chariot'].map(role => `${role}:${r.summary[role].moves}/${r.summary[role].melee}/${r.summary[role].idleUnits}`).join(' ');
    console.log(`${r.doctrine.padEnd(10)} lines=${r.rangedLines} prio=${r.priorityVariant} ${r.terrainVariant.padEnd(8)} | ranged shots/moves/idle ${ranged} | mounted moves/melee/idle ${mounted}`);
  }
  console.log(`\nMatrix: ${reports.length} scenarios, ${roles.length} active units each, ${turnCount} activations, ${errors.length} red conditions`);
  for (const error of errors) console.log(`RED: ${error}`);
  if (!selectedLines && !selectedTerrain && !selectedDoctrines) assert.strictEqual(reports.length, 36, 'covers 3 doctrines × 3 line settings × 2 priorities × 2 terrain patterns');
  assert.strictEqual(errors.length, 0, 'all large mixed-army scenarios produce ranged attacks and mounted movement where doctrine requires it, with no illegal attacks');
  console.log(`Evidence written: ${reportPath}`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
