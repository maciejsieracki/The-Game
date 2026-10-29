'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');

async function loadBattleScene() {
  const result = await esbuild.build({
    stdin: { contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };", resolveDir: ROOT, sourcefile: 'battle-manual-orders-routing-entry.ts' },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020', alias: { three: path.join(ROOT, 'node_modules/three/build/three.cjs') },
    plugins: [{ name: 'stub-browser-services', setup(build) {
      for (const [filter, namespace, contents] of [
        [/brandAssets/, 'brand', 'export const civIconSvg=()=>""; export const brandIconSvg=()=>"";'],
        [/leaderPortraits/, 'leader', 'export const leaderPortraitUrl=()=>""; export const leaderName=()=>""; export const civIconIdFromCivLabel=()=>"";'],
        [/muzyka-antyczna/, 'audio', 'export const startVictoryMusic=()=>{}; export const startDefeatMusic=()=>{}; export const startBattleMusic=()=>{};'],
      ]) { build.onResolve({ filter }, args => ({ path: args.path, namespace })); build.onLoad({ filter: /.*/, namespace }, () => ({ contents, loader: 'js' })); }
    } }], write: false, logLevel: 'silent',
  });
  const mod = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module: mod, exports: mod.exports, require, console, process, globalThis, setTimeout, clearTimeout }, { filename: 'battleScene.ts' });
  return mod.exports.BattleScene;
}
const key = (q, r) => `${q},${r}`;
function unit(id, side, q, r, opts = {}) {
  return { bu: { id, nazwa: id, kategoria: opts.category || 'piechota', hp: 100, maxHp: 100, stats: {} }, side, q, r,
    dead: false, fadingOut: false, removed: false, routed: false, acted: false, moveLeft: 2, moveMax: 2,
    rangedBase: !!opts.ranged, primaryRanged: !!opts.ranged, range: opts.range || 0, rangeBase: opts.range || 0,
    ammoLeft: opts.ammo ?? (opts.ranged ? 3 : 0), ammoMax: 3, shootingEnabled: true, mounted: !!opts.mounted,
    formationRank: opts.rank || 0, groupId: opts.groupId ?? null, playerOrder: { type: 'none' } };
}
function fixture(BattleScene, own, enemies, blocked = new Set()) {
  const scene = Object.create(BattleScene.prototype);
  scene.atk = own; scene.def = enemies; scene.occByKey = new Map([...own, ...enemies].map(u => [key(u.q, u.r), u]));
  scene.finished = false; scene.busy = false; scene._autoBatchPlanning = null;
  scene._generalSettings = { blockadeActive: false, blockadeCol: null };
  scene._enemiesOf = ru => (ru.side === 'atk' ? scene.def : scene.atk).filter(u => !u.dead && !u.fadingOut && !u.routed);
  scene._passableForUnit = (_ru, q, r) => q >= 0 && q < 64 && r >= 0 && r < 72 && !blocked.has(key(q, r));
  scene._compactAttackAllowsStep = () => true; scene._refreshQueuedOrderVisuals = () => {};
  scene.moves = []; scene.blockedMoveAttempts = []; scene.attacks = [];
  scene._doMove = (ru, q, r, done) => {
    const next = key(q, r), from = key(ru.q, ru.r);
    if (scene.occByKey.has(next)) { scene.blockedMoveAttempts.push({ id: ru.bu.id, to: next, occupant: scene.occByKey.get(next).bu.id }); done(); return; }
    scene.occByKey.delete(from); scene.occByKey.set(next, ru); ru.q = q; ru.r = r; scene.moves.push({ id: ru.bu.id, to: next }); done();
  };
  scene._doMeleeAttack = (a, d, done) => { scene.attacks.push({ kind: 'melee', attacker: a.bu.id, target: d.bu.id, distance: Math.abs(a.q-d.q)+Math.abs(a.r-d.r) }); done(); };
  scene._doRangedAttack = (a, d, done) => { scene.attacks.push({ kind: 'ranged', attacker: a.bu.id, target: d.bu.id, distance: Math.abs(a.q-d.q)+Math.abs(a.r-d.r) }); done(); };
  return scene;
}
async function main() {
  const BattleScene = await loadBattleScene();
  const results = [];
  let clickOrderTypes = [];
  {
    const attacker = unit('manual-infantry', 'atk', 5, 10), blocker = unit('friendly-screen', 'atk', 6, 10), target = unit('enemy-target', 'def', 10, 10);
    const scene = fixture(BattleScene, [attacker, blocker], [target]); attacker.playerOrder = { type: 'attack', targetId: target.bu.id };
    BattleScene.prototype._performPlayerOrder.call(scene, attacker, () => {});
    results.push({ test: 'melee attack around allied blocker', moves: scene.moves, blockedMoveAttempts: scene.blockedMoveAttempts, position: [attacker.q, attacker.r] });
  }
  {
    const dry = unit('dry-archer', 'atk', 8, 10, { ranged: true, range: 3, ammo: 0, category: 'lucznik' }), target = unit('enemy-at-range-3', 'def', 11, 10);
    const scene = fixture(BattleScene, [dry], [target]); dry.playerOrder = { type: 'attack', targetId: target.bu.id };
    BattleScene.prototype._performPlayerOrder.call(scene, dry, () => {});
    results.push({ test: 'dry ranged unit closes instead of striking at range 3', moves: scene.moves, attacks: scene.attacks, position: [dry.q, dry.r] });
  }
  {
    const archer = unit('loaded-archer', 'atk', 8, 10, { ranged: true, range: 3, ammo: 3, category: 'lucznik' }), target = unit('clicked-enemy', 'def', 11, 10);
    const scene = fixture(BattleScene, [archer], [target]); archer.playerOrder = { type: 'attack', targetId: target.bu.id };
    BattleScene.prototype._performPlayerOrder.call(scene, archer, () => {});
    results.push({ test: 'loaded ranged unit attacks selected in-range target', moves: scene.moves, attacks: scene.attacks });
  }
  {
    const archer = unit('ranged-group-archer', 'atk', 5, 10, { ranged: true, range: 3, ammo: 3, category: 'lucznik', groupId: 'ranged-group' });
    const screen = unit('ranged-group-screen', 'atk', 6, 10, { groupId: 'ranged-group' });
    const target = unit('ranged-group-target', 'def', 11, 10);
    const scene = fixture(BattleScene, [archer, screen], [target], new Set(['5,9']));
    archer.playerOrder = { type: 'attack', targetId: target.bu.id };
    BattleScene.prototype._performPlayerOrder.call(scene, archer, () => {});
    const orderAfterStep = { ...archer.playerOrder };
    target.dead = true;
    const replacement = unit('ranged-replacement-target', 'def', 13, 10);
    scene.def.push(replacement); scene.occByKey.set(key(replacement.q, replacement.r), replacement);
    BattleScene.prototype._performPlayerOrder.call(scene, archer, () => {});
    results.push({ test: 'ranged attack order routes around allied screen/terrain, preserves clicked target during movement, clears after target death', moves: scene.moves, orderAfterStep, finalOrder: archer.playerOrder, attacks: scene.attacks });
  }
  {
    const cavalry = unit('mounted-group-cavalry', 'atk', 5, 10, { mounted: true, category: 'konnica', groupId: 'mounted-group' });
    const screen = unit('mounted-group-screen', 'atk', 6, 10, { groupId: 'mounted-group' });
    const target = unit('mounted-group-target', 'def', 11, 10);
    const scene = fixture(BattleScene, [cavalry, screen], [target], new Set(['5,9']));
    cavalry.playerOrder = { type: 'attack', targetId: target.bu.id };
    BattleScene.prototype._performPlayerOrder.call(scene, cavalry, () => {});
    results.push({ test: 'mounted attack order routes around allied screen/terrain while retaining exact target intent', moves: scene.moves, orderAfterStep: cavalry.playerOrder, attacks: scene.attacks });
  }
  {
    const own = Array.from({ length: 42 }, (_, i) => unit(`group-${i}`, 'atk', i < 3 ? [5, 4, 6][i] : (i - 3) % 10, i < 3 ? 10 : 30 + Math.floor((i - 3) / 10), { groupId: 'large-manual-group', rank: i < 3 ? i : 2 }));
    const target = unit('group-target', 'def', 10, 10);
    const scene = fixture(BattleScene, own, [target], new Set(['5,9', '4,9']));
    scene._selectedUnits = new Set([own[0].bu.id]); scene._queuedOrderUnitIds = new Set();
    scene._findPlayerUnit = id => own.find(u => u.bu.id === id) ?? null;
    scene._liveGroupMemberIds = gid => own.filter(u => u.groupId === gid).map(u => u.bu.id);
    scene._enemyRoster = () => [target]; scene._showOrderFeedback = () => {};
    BattleScene.prototype._issueBattleAttack.call(scene, target.bu.id, true);
    const allAssigned = own.every(u => u.playerOrder.type === 'attack' && u.playerOrder.targetId === target.bu.id && scene._queuedOrderUnitIds.has(u.bu.id));
    BattleScene.prototype._performPlayerOrder.call(scene, own[0], () => {});
    BattleScene.prototype._performPlayerOrder.call(scene, own[1], () => {});
    const routed = scene.moves.slice();
    target.dead = true;
    BattleScene.prototype._performPlayerOrder.call(scene, own[3], () => {});
    results.push({ test: '42-unit group attack order around allied line + impassable terrain; stale target behavior', allAssigned, routed, blockedMoveAttempts: scene.blockedMoveAttempts, staleOrderAfterTargetDeath: own[3].playerOrder.type, attacks: scene.attacks });
  }
  {
    const own = unit('selected-own', 'atk', 5, 10), enemy = unit('clicked-enemy', 'def', 10, 10), scene = fixture(BattleScene, [own], [enemy]);
    scene._selectedUnits = new Set([own.bu.id]); scene._lastClickModifiers = { ctrl: false, shift: false }; scene._battleAwaitingOrders = false; scene.roundNo = 1;
    scene._manualMode = true; scene.deployPhase = false; scene.started = true; scene.finished = false; scene._isPlayerSide = side => side === 'atk';
    const orders = []; scene._issueBattleAttack = (id, queued) => orders.push({ type: 'attack', id, queued }); scene._issueBattleMove = (col, row, queued) => orders.push({ type: 'move', col, row, queued });
    scene._handleBattleUnitPick = () => {}; scene._pickGroundTile = (x, y) => x === 10 ? { col: 10, row: 10 } : { col: 20, row: 12 };
    scene._raycastFromCanvas = () => ({ intersectObjects: () => [] });
    BattleScene.prototype._onBattleClick.call(scene, 10, 10); BattleScene.prototype._onBattleClick.call(scene, 20, 12);
    results.push({ test: 'canvas semantics enemy click=attack, empty hex click=move', orders });
    clickOrderTypes = orders.map(o => o.type);
  }
  console.log(JSON.stringify(results, null, 2));
  assert.ok(results[0].blockedMoveAttempts.length > 0 || results[0].moves.some(m => m.to !== '6,10'), 'attack route must not stall at or step onto occupied direct tile');
  assert.equal(results[1].attacks.length, 0, 'dry primary shooter must not melee from range 3');
  assert.ok(results[1].moves.length > 0, 'dry primary shooter must close to melee range');
  assert.equal(results[2].attacks[0]?.kind, 'ranged', 'loaded shooter fires at selected target in range');
  assert.ok(results[3].moves.length > 0, 'ranged attack order advances around a blocked direct route');
  assert.deepEqual(results[3].orderAfterStep, { type: 'attack', targetId: 'ranged-group-target' }, 'ranged actor retains exact target while moving');
  assert.equal(results[3].finalOrder.type, 'none', 'ranged actor clears dead explicit target and does not silently retarget');
  assert.ok(results[4].moves.length > 0, 'mounted attack order advances around a blocked direct route');
  assert.deepEqual(results[4].orderAfterStep, { type: 'attack', targetId: 'mounted-group-target' }, 'mounted actor retains exact target while moving');
  assert.ok(results[5].allAssigned, 'all 42 members receive queued attack order against the selected target');
  assert.equal(results[5].blockedMoveAttempts.length, 0, 'group members never step onto a blocked or occupied cell');
  assert.equal(results[5].routed.length, 2, 'front and rear group members route around the blocker/terrain');
  assert.equal(results[5].staleOrderAfterTargetDeath, 'none', 'dead target is cleared rather than attacked');
  assert.deepEqual(clickOrderTypes, ['attack', 'move']);
  console.log('battle-manual-orders-routing-test: passed');
}
main().catch(err => { console.error(err); process.exitCode = 1; });
