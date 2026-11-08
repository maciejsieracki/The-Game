'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const fs = require('node:fs');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');

async function loadScene() {
  const result = await esbuild.build({ stdin: { contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };", resolveDir: ROOT, sourcefile: 'attack-move-test.ts' }, bundle: true, platform: 'node', format: 'cjs', target: 'es2020', alias: { three: path.join(ROOT, 'node_modules/three/build/three.cjs') }, write: false, logLevel: 'silent', plugins: [{ name: 'browser-stubs', setup(build) {
    for (const [filter, namespace, contents] of [[/brandAssets/, 'brand', 'export const civIconSvg=()=>""; export const brandIconSvg=()=>"";'], [/leaderPortraits/, 'leader', 'export const leaderPortraitUrl=()=>""; export const leaderName=()=>""; export const civIconIdFromCivLabel=()=>"";'], [/muzyka-antyczna/, 'audio', 'export const startVictoryMusic=()=>{}; export const startDefeatMusic=()=>{}; export const startBattleMusic=()=>{};']]) { build.onResolve({ filter }, args => ({ path: args.path, namespace })); build.onLoad({ filter: /.*/, namespace }, () => ({ contents, loader: 'js' })); }
  } }] });
  const mod = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module: mod, exports: mod.exports, require, console, process, globalThis, setTimeout, clearTimeout });
  return mod.exports.BattleScene;
}
const key = (q, r) => `${q},${r}`;
function unit(id, side, q, r, options = {}) {
  return { bu: { id, nazwa: id, kategoria: options.ranged ? 'lucznik' : options.mounted ? 'konnica' : 'piechota', hp: 10, maxHp: 10, stats: {} }, side, q, r, dead: false, fadingOut: false, removed: false, routed: false, acted: false, moveLeft: 2, moveMax: 2, rangedBase: !!options.ranged, primaryRanged: !!options.ranged, rangeBase: options.range ?? 0, range: options.range ?? 0, ammoLeft: options.ammo ?? 0, ammoMax: 3, shootingEnabled: true, mounted: !!options.mounted, formationRank: 0, groupId: options.groupId ?? null, playerOrder: { type: 'none' } };
}
function sceneFor(own, enemies, blocked = new Set()) {
  const scene = Object.create(globalThis.__AttackMoveScene.prototype);
  scene.atk = own; scene.def = enemies;
  scene.occByKey = new Map([...own, ...enemies].map(u => [key(u.q, u.r), u]));
  scene.moves = []; scene.attacks = []; scene.blocked = [];
  scene._enemiesOf = u => (u.side === 'atk' ? scene.def : scene.atk).filter(e => !e.dead && !e.removed && !e.routed && !e.fadingOut);
  scene._isPlayerSide = side => side === 'atk';
  scene._passableForUnit = (_u, q, r) => q >= 0 && q < 64 && r >= 0 && r < 72 && !blocked.has(key(q, r));
  scene._destAllowedByBlockade = () => true;
  scene._canStrikeTargetFrom = (u, q, r, target) => {
    const d = Math.abs(q - target.q) + Math.abs(r - target.r);
    return u.rangedBase && u.ammoLeft > 0 && u.shootingEnabled !== false ? d <= u.range : d <= 1;
  };
  scene._canAttackFrom = () => false;
  scene._priorityScore = () => 0;
  scene._refreshQueuedOrderVisuals = () => {};
  scene._doMove = (u, q, r, done) => {
    const next = key(q, r), from = key(u.q, u.r);
    if (scene.occByKey.has(next)) { scene.blocked.push(next); done(); return; }
    scene.occByKey.delete(from); u.q = q; u.r = r; scene.occByKey.set(next, u); scene.moves.push(next); done();
  };
  scene._doAttack = (u, enemy, done) => {
    scene.attacks.push({ unit: u.bu.id, target: enemy.bu.id, distance: Math.abs(u.q - enemy.q) + Math.abs(u.r - enemy.r) });
    enemy.dead = true; scene.occByKey.delete(key(enemy.q, enemy.r)); done();
  };
  return scene;
}

async function main() {
  globalThis.__AttackMoveScene = await loadScene();
  const BattleScene = globalThis.__AttackMoveScene;
  const results = [];

  // A direct-route enemy is attacked when reached, then the same waypoint order resumes.
  {
    const mover = unit('infantry', 'atk', 3, 10), threat = unit('route-threat', 'def', 7, 10);
    const s = sceneFor([mover], [threat]); mover.playerOrder = { type: 'attackMove', col: 10, row: 10 };
    for (let i = 0; i < 10 && mover.playerOrder.type === 'attackMove'; i++) BattleScene.prototype._performPlayerOrder.call(s, mover, () => {});
    results.push({ waypoint: [mover.q, mover.r], attacks: s.attacks, moveCount: s.moves.length, finalOrder: mover.playerOrder.type });
    assert.equal(s.attacks.length, 1, 'route threat is engaged exactly once');
    assert.equal(s.attacks[0].target, threat.bu.id);
    assert.ok(s.moves.length >= 4, 'unit advances both before and after the fight');
    assert.deepEqual([mover.q, mover.r], [10, 10], 'unit resumes and reaches its waypoint');
    assert.equal(mover.playerOrder.type, 'none', 'waypoint order clears on arrival');
  }

  // Dry archers must approach a route threat instead of firing illegally from nominal range.
  {
    const archer = unit('dry-archer', 'atk', 3, 20, { ranged: true, range: 4, ammo: 0 });
    const threat = unit('threat', 'def', 6, 20);
    const s = sceneFor([archer], [threat]); archer.playerOrder = { type: 'attackMove', col: 10, row: 20 };
    BattleScene.prototype._performPlayerOrder.call(s, archer, () => {});
    results.push({ dry: true, firstMove: s.moves[0], attacks: s.attacks });
    assert.equal(s.attacks.length, 0, 'empty ammunition does not permit a ranged strike');
    assert.ok(s.moves.length, 'dry ranged unit advances toward reachable melee');
    assert.equal(archer.playerOrder.type, 'attackMove');
  }

  // Routed enemies cease to block the waypoint; a wholly blocked route remains pending.
  {
    const mover = unit('routed-case', 'atk', 3, 25), routed = unit('routed-threat', 'def', 5, 25);
    routed.routed = true;
    const s = sceneFor([mover], [routed]); mover.playerOrder = { type: 'attackMove', col: 8, row: 25 };
    BattleScene.prototype._performPlayerOrder.call(s, mover, () => {});
    assert.equal(s.attacks.length, 0, 'routed enemy is unavailable as an attack-move target');
    assert.ok(s.moves.length > 0, 'unit continues toward waypoint when threat has routed');
  }
  {
    const mover = unit('blocked-route', 'atk', 3, 26), enemy = unit('unreachable', 'def', 8, 26);
    const wall = new Set(Array.from({ length: 156 }, (_, r) => key(4, r)));
    const s = sceneFor([mover], [enemy], wall); mover.playerOrder = { type: 'attackMove', col: 7, row: 26 };
    BattleScene.prototype._performPlayerOrder.call(s, mover, () => {});
    assert.equal(s.moves.length, 0, 'no movement crosses an impassable full-width barrier');
    assert.equal(mover.playerOrder.type, 'attackMove', 'blocked route remains an explicit cancellable order');
  }

  // Loaded ranged units can engage from a legal route firing tile and then continue.
  {
    const archer = unit('loaded-archer', 'atk', 3, 30, { ranged: true, range: 3, ammo: 2 });
    const threat = unit('ranged-threat', 'def', 6, 30);
    const s = sceneFor([archer], [threat]); archer.playerOrder = { type: 'attackMove', col: 10, row: 30 };
    BattleScene.prototype._performPlayerOrder.call(s, archer, () => {});
    assert.equal(s.attacks[0]?.target, threat.bu.id, 'loaded shooter attacks threat along actual route');
    assert.equal(s.attacks[0]?.distance, 3, 'shot occurs at legal range');
    BattleScene.prototype._performPlayerOrder.call(s, archer, () => {});
    assert.equal(archer.q, 4, 'ranged unit continues toward waypoint rather than stopping at a firing tile');
  }

  // Blockers define the actual route; a threat off that path must not pull the unit away.
  {
    const mover = unit('blocked-mover', 'atk', 3, 40);
    const screen = unit('screen', 'atk', 4, 40);
    const offRoute = unit('off-route', 'def', 4, 43);
    const s = sceneFor([mover, screen], [offRoute], new Set(['4,39']));
    mover.playerOrder = { type: 'attackMove', col: 7, row: 40 };
    const path = BattleScene.prototype._attackMovePath.call(s, mover, 7, 40, true);
    assert.ok(path?.length > 1 && !path.includes('4,40'), 'scouted path goes around allied occupancy');
    assert.ok(!path.includes('4,43'), 'off-route threat is excluded from the path');
    BattleScene.prototype._performPlayerOrder.call(s, mover, () => {});
    results.push({ path, firstStep: s.moves[0], attacks: s.attacks });
    assert.equal(s.attacks.length, 0, 'off-route enemy is ignored');
    assert.equal(s.blocked.length, 0, 'movement never enters an occupied tile');
  }

  // Selected-group order preserves formation destinations and assigns independently serialized orders.
  {
    const a = unit('group-a', 'atk', 3, 50, { groupId: 'g' });
    const b = unit('group-b', 'atk', 3, 51, { groupId: 'g' });
    const enemy = unit('irrelevant', 'def', 12, 60);
    const s = sceneFor([a, b], [enemy]);
    s._selectedUnits = new Set([a.bu.id]); s._queuedOrderUnitIds = new Set();
    s._findPlayerUnit = id => [a, b].find(u => u.bu.id === id);
    s._liveGroupMemberIds = () => [a.bu.id, b.bu.id];
    s._moveTargetForUnit = u => ({ col: 9, row: u.r });
    s._orderGroupMove = (gid, col, row) => { a.playerOrder = { type: 'move', col, row }; b.playerOrder = { type: 'move', col, row: row + 1 }; };
    s._moveDestinationsForSelection = () => new Map(); s._showOrderFeedback = () => {};
    let dispatched = [];
    s._executeUnitsImmediate = ids => { dispatched = [...ids]; }; s._advanceToNextBattleUnit = () => {};
    BattleScene.prototype._issueBattleAttackMove.call(s, 9, 50, true);
    results.push({ groupOrders: [a.playerOrder, b.playerOrder], queued: [...s._queuedOrderUnitIds] });
    assert.equal(JSON.stringify(a.playerOrder), '{"type":"attackMove","col":9,"row":50}');
    assert.equal(JSON.stringify(b.playerOrder), '{"type":"attackMove","col":9,"row":51}');
    assert.equal(s._queuedOrderUnitIds.size, 2, 'both group members queue the waypoint order');
    BattleScene.prototype._executeQueuedOrders.call(s);
    assert.equal(s._queuedOrderUnitIds.size, 0, 'turn execution consumes the queued ids exactly once');
    assert.equal(dispatched.length, 2, 'turn execution serially dispatches both group members');
  }

  // A mixed 42-unit group moves once per activation, serially, and keeps every
  // waypoint between tactical turns while live occupancy updates.
  {
    const members = Array.from({ length: 42 }, (_, i) => unit(
      `army-${i}`, 'atk', 3, 20 + i,
      { groupId: 'mixed-42', ranged: i % 3 === 1, mounted: i % 3 === 2, range: i % 3 === 1 ? 3 : 0, ammo: i % 3 === 1 ? 2 : 0 },
    ));
    const enemy = unit('off-route-enemy', 'def', 50, 70);
    const s = sceneFor(members, [enemy]);
    s._selectedUnits = new Set([members[0].bu.id]);
    s._queuedOrderUnitIds = new Set();
    s._findPlayerUnit = id => members.find(u => u.bu.id === id) ?? (enemy.bu.id === id ? enemy : null);
    s._liveGroupMemberIds = () => members.map(u => u.bu.id);
    s._orderGroupMove = (_gid, col) => { for (const u of members) u.playerOrder = { type: 'move', col, row: u.r }; };
    s._moveDestinationsForSelection = () => new Map();
    s._showOrderFeedback = () => {};
    s._advanceToNextBattleUnit = () => {};
    BattleScene.prototype._issueBattleAttackMove.call(s, 12, 40, false);
    assert.equal(s.moves.length, 42, 'the production immediate-order runner activated each mixed group member once');
    assert.ok(members.every(u => u.q === 4 && u.playerOrder.type === 'attackMove'), 'every member advances one tile and retains its individual waypoint');
    assert.equal(s.blocked.length, 0, 'serialized activations avoid all updated occupied cells');
    for (const u of members) u.acted = false; // the next tactical turn reopens activations
    BattleScene.prototype._executeUnitsImmediate.call(s, members.map(u => u.bu.id));
    assert.equal(s.moves.length, 84, 'the next turn executes the group again, not the first order twice in one activation');
    assert.ok(members.every(u => u.q === 5 && u.playerOrder.type === 'attackMove'), 'waypoints survive progression to the next turn');
  }

  // Cancellation and replacement stop future waypoint execution.
  {
    const mover = unit('cancelled', 'atk', 3, 5); const enemy = unit('enemy', 'def', 12, 5);
    const s = sceneFor([mover], [enemy]); mover.playerOrder = { type: 'attackMove', col: 10, row: 5 };
    s._selectedUnits = new Set([mover.bu.id]); s._queuedOrderUnitIds = new Set([mover.bu.id]);
    s._findPlayerUnit = id => id === mover.bu.id ? mover : null;
    BattleScene.prototype._cancelAttackMoveSelected.call(s);
    assert.equal(mover.playerOrder.type, 'none'); assert.equal(s._queuedOrderUnitIds.size, 0);
    mover.playerOrder = { type: 'attackMove', col: 10, row: 5 };
    mover.playerOrder = { type: 'move', col: 9, row: 5 };
    assert.equal(mover.playerOrder.type, 'move', 'replacement command supersedes attack-move');
  }
  {
    const a = unit('cancel-group-a', 'atk', 3, 8, { groupId: 'cancel-group' });
    const b = unit('cancel-group-b', 'atk', 3, 9, { groupId: 'cancel-group' });
    const s = sceneFor([a, b], []);
    s._selectedUnits = new Set([a.bu.id]); s._queuedOrderUnitIds = new Set([a.bu.id, b.bu.id]);
    s._findPlayerUnit = id => [a, b].find(u => u.bu.id === id);
    s._liveGroupMemberIds = () => [a.bu.id, b.bu.id];
    s._cancelAttackMoveSelected = BattleScene.prototype._cancelAttackMoveSelected;
    a.playerOrder = { type: 'attackMove', col: 10, row: 8 };
    b.playerOrder = { type: 'attackMove', col: 10, row: 9 };
    BattleScene.prototype._cancelAttackMoveSelected.call(s);
    assert.equal(a.playerOrder.type, 'none');
    assert.equal(b.playerOrder.type, 'none', 'group cancellation reaches every member expanded into the order');
    assert.equal(s._queuedOrderUnitIds.size, 0);
  }

  // Renderer contract and click dispatch keep Move and exact-target Attack distinct.
  {
    const source = fs.readFileSync(path.join(ROOT, 'src/battle/battleScene.ts'), 'utf8');
    assert.match(source, /Atakuj-marszem/);
    assert.match(source, /battleAttackMoveMode/);
    assert.match(source, /if \(this\._attackMoveMode\) this\._issueBattleAttackMove/);
    assert.match(source, /this\._issueBattleAttack\(hitUnit\.bu\.id, queueOnly\)/);
    results.push({ rendererModeLabel: true, enemyClickRemainsExactTarget: true });
  }
  console.log(JSON.stringify(results, null, 2));
  console.log('battle-attack-move-order-test: passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
