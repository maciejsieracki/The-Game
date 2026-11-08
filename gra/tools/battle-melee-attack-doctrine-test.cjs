'use strict';
/** Focused production-method regression: Atak must hand off line movement to melee combat. */
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const fs = require('node:fs');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');

async function loadBattleScene() {
  const bundle = await esbuild.build({
    stdin: {
      contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };",
      resolveDir: ROOT, sourcefile: 'battle-melee-attack-doctrine-entry.ts',
    },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(ROOT, 'node_modules/three/build/three.cjs') },
    plugins: [{ name: 'stub-nonlogic-battle-assets', setup(build) {
      const stubs = [
        [/brandAssets/, 'brand', 'export const civIconSvg=()=>""; export const brandIconSvg=()=>"";'],
        [/leaderPortraits/, 'leader', 'export const leaderPortraitUrl=()=>""; export const leaderName=()=>""; export const civIconIdFromCivLabel=()=>"";'],
        [/muzyka-antyczna/, 'audio', 'export const startVictoryMusic=()=>{}; export const startDefeatMusic=()=>{}; export const startBattleMusic=()=>{};'],
      ];
      for (const [filter, namespace, contents] of stubs) {
        build.onResolve({ filter }, args => ({ path: args.path, namespace }));
        build.onLoad({ filter: /.*/, namespace }, () => ({ contents, loader: 'js' }));
      }
    } }],
    write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(bundle.outputFiles[0].text, {
    module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout,
  }, { filename: 'battleScene.ts' });
  return module.exports.BattleScene;
}

function unit(id, side, q, r) {
  return {
    bu: { id, nazwa: 'Wojownik', kategoria: 'miecznik', stats: {}, hp: 100, maxHp: 100 },
    q, r, side, dead: false, fadingOut: false, removed: false, routed: false,
    mounted: false, rangedBase: false, primaryRanged: false, ranged: false,
    range: 0, rangeBase: 0, ammoLeft: 0, ammoMax: 0, moveLeft: 2,
    acted: false, morale: 100, moraleMax: 100, playerOrder: { type: 'none' },
    attackDirection: 'front', facing: side === 'atk' ? 'E' : 'W',
    groupId: `${side}-line`, formationRank: 0,
  };
}

async function runDoctrine(BattleScene, doctrine) {
  const atk = Array.from({ length: 24 }, (_, i) => unit(`atk-warrior-${i + 1}`, 'atk', 10, 5 + i));
  const def = Array.from({ length: 24 }, (_, i) => unit(`def-warrior-${i + 1}`, 'def', 13, 5 + i));
  const events = [];
  const scene = Object.create(BattleScene.prototype);
  Object.assign(scene, {
    atk, def, finished: false, _manualMode: false, siegeWallCol: -1,
    _generalSettings: { blockadeActive: false, blockadeCol: null },
    _groupMeta: new Map(), _groups: new Map(), _selectedUnits: new Set(),
    occByKey: new Map([...atk, ...def].map(u => [`${u.q},${u.r}`, u])),
    terrainMap: { passable: () => true, moveCost: () => 1, at: () => 0 },
    _targetPriorities: { mounted: ['melee'], ranged: ['melee'], melee: ['melee'] },
    _isUnitDoctrineAuto: () => true,
    _effectiveMetaForUnit: u => ({ doctrine, autoPlay: true, attackDirection: 'front', formation: 'F1' }),
    _applyTerrainRange() {},
    _updateFacing() {},
    _updateMoraleBar() {},
    _updateAmmoBar() {},
    _refreshQueuedOrderVisuals() {},
    _schedule(_delay, callback) { callback(); },
    _priorityScore() { return 0; },
    _destAllowedByBlockade() { return true; },
    _doMove(u, q, r, done) {
      events.push({ type: 'move', id: u.bu.id, from: [u.q, u.r], to: [q, r] });
      this.occByKey.delete(`${u.q},${u.r}`);
      u.q = q; u.r = r; u.moveLeft--;
      this.occByKey.set(`${q},${r}`, u);
      done();
    },
    _doAttack(u, target, done) {
      const distance = Math.abs(u.q - target.q) + Math.abs(u.r - target.r);
      const legal = distance === 1;
      events.push({ type: legal ? 'melee-attack' : 'illegal-attack', id: u.bu.id, targetId: target.bu.id, distance, targetHpBefore: target.bu.hp });
      if (legal) target.bu.hp -= 10;
      events.at(-1).targetHpAfter = target.bu.hp;
      done();
    },
  });

  const traceIds = new Set([atk[0].bu.id, def[0].bu.id]);
  const baseLineGate = scene._compactAttackAllowsStep;
  scene._compactAttackAllowsStep = function (u, col) {
    const allowed = baseLineGate.call(this, u, col);
    if (traceIds.has(u.bu.id)) events.push({ type: 'line-candidate', id: u.bu.id, from: [u.q, u.r], candidateCol: col, allowed, rank: u.formationRank });
    return allowed;
  };
  const baseAdvance = scene._advanceStep;
  scene._advanceStep = function (u, done) {
    if (traceIds.has(u.bu.id)) {
      const target = this._nearestEnemy(u);
      events.push({
        type: 'advance-check', id: u.bu.id, doctrine,
        position: [u.q, u.r], nearestTarget: target?.bu.id ?? null,
        turn: this._traceTurn,
        distance: target ? Math.abs(u.q - target.q) + Math.abs(u.r - target.r) : null,
        canAttackFromHere: this._canAttackFrom(u, u.q, u.r),
      });
    }
    return baseAdvance.call(this, u, done);
  };

  for (let turn = 1; turn <= 2; turn++) {
    scene._traceTurn = turn;
    for (const u of [...atk, ...def]) {
      u.moveLeft = 2;
      events.push({ type: 'activation-start', id: u.bu.id, turn, doctrine, position: [u.q, u.r], nearestTarget: scene._nearestEnemy(u)?.bu.id ?? null });
      await new Promise(resolve => scene._activateUnit(u, resolve));
      events.push({ type: 'activation-end', id: u.bu.id, turn, doctrine, position: [u.q, u.r] });
    }
  }
  return { doctrine, events, attackers: atk, defenders: def };
}

async function main() {
  const BattleScene = await loadBattleScene();
  const attack = await runDoctrine(BattleScene, 'steady');
  const charge = await runDoctrine(BattleScene, 'aggressive');
  const attackHits = attack.events.filter(e => e.type === 'melee-attack');
  const chargeHits = charge.events.filter(e => e.type === 'melee-attack');
  const trace = attack.events.filter(e => e.type === 'advance-check' && e.canAttackFromHere);
  const attackSideHits = attackHits.filter(e => e.id.startsWith('atk-'));
  const chargeSideHits = chargeHits.filter(e => e.id.startsWith('atk-'));
  const report = {
    controlledRoster: { attackers: 24, defenders: 24, sameIds: true, samePositions: true },
    attack: { checks: trace.slice(0, 4), firstWarriorCandidateSteps: attack.events.filter(e => e.type === 'line-candidate' && e.id === 'atk-warrior-1'), meleeAttacks: attackHits.length, attackerMeleeAttacks: attackSideHits.length, hpLoss: attackHits.reduce((sum, e) => sum + e.targetHpBefore - e.targetHpAfter, 0) },
    charge: { meleeAttacks: chargeHits.length, attackerMeleeAttacks: chargeSideHits.length, hpLoss: chargeHits.reduce((sum, e) => sum + e.targetHpBefore - e.targetHpAfter, 0) },
  };
  const reportPath = path.resolve(ROOT, '../dyspozycje/autobot/runs/R-BITWA-MANUAL-MELEE-ATTACK-STUCK-Q1/02-focused-production-method-regression.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  assert.equal(attackHits.length, 72, 'Atak must strike after line movement reaches adjacency on the following activation');
  assert.equal(chargeHits.length, 72, 'Szturm remains the paired melee control');
  assert.equal(attackSideHits.length, 24, 'Atak attacker line strikes after reaching adjacency');
  assert.equal(chargeSideHits.length, 24, 'Szturm attacker line strikes after reaching adjacency');
  assert.ok(attackHits.every(e => e.distance === 1 && e.targetHpAfter < e.targetHpBefore), 'Atak melee events must be legal and lower target HP');
  assert.ok(trace.length >= 2, 'Trace must show Atak reaching legal adjacency before the attack');

  const noTarget = unit('atk-no-target', 'atk', 10, 10);
  const empty = Object.create(BattleScene.prototype);
  Object.assign(empty, sceneFieldsForEmpty(noTarget));
  let attackCalls = 0;
  empty._doAttack = () => { attackCalls++; };
  empty._advanceStep(noTarget, () => {});
  assert.equal(attackCalls, 0, 'Without a living legal target, Atak must stay a no-op rather than fabricate a strike');
  console.log('PASS same 24v24 warriors advance to adjacency then strike in Atak and Szturm; PASS empty target remains no-op');
}

function sceneFieldsForEmpty(unit) {
  return {
    atk: [unit], def: [], finished: false, occByKey: new Map([[`${unit.q},${unit.r}`, unit]]),
    _effectiveMetaForUnit: () => ({ doctrine: 'steady' }),
    _nearestEnemy: () => null,
    _canAttackFrom: () => false,
    _doAttack() {}, _doMove() {},
  };
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
