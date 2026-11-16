'use strict';
// R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-STRIKE-AT-END-Q1: rozkaz RECZNY marszu / ataku = pelny ruch w jednej aktywacji,
// cios na koncu ruchu (max 1 na ture). Test jednostkowy na scenie ze stubami (esbuild + vm, jak battle-attack-move-order-test).
// Uzycie:  node tools/battle-manual-orders-full-move-test.cjs            -> zielony na kodzie
//          node tools/battle-manual-orders-full-move-test.cjs --mutate  -> mutacja: jeden _doMove na aktywacje (ma byc CZERWONY)
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const fs = require('node:fs');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');
const MUTATE = process.argv.includes('--mutate');
const SRC = path.join(ROOT, 'src/battle/battleScene.ts');

async function loadScene() {
  const original = fs.readFileSync(SRC, 'utf8');
  const source = MUTATE
    ? original.split('this._manualOrderAfterStep(ru, done);').join('done();')
    : original;
  if (MUTATE && source === original) throw new Error('mutacja nie trafila w battleScene.ts');
  const result = await esbuild.build({
    stdin: { contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };", resolveDir: ROOT, sourcefile: 'manual-full-move-entry.ts' },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020', alias: { three: path.join(ROOT, 'node_modules/three/build/three.cjs') }, write: false, logLevel: 'silent',
    plugins: [{ name: 'manual-full-move', setup(build) {
      build.onLoad({ filter: /battleScene\.ts$/ }, () => ({ contents: source, loader: 'ts' }));
      for (const [filter, namespace, contents] of [[/brandAssets/, 'brand', 'export const civIconSvg=()=>""; export const brandIconSvg=()=>"";'], [/leaderPortraits/, 'leader', 'export const leaderPortraitUrl=()=>""; export const leaderName=()=>""; export const civIconIdFromCivLabel=()=>"";'], [/muzyka-antyczna/, 'audio', 'export const startVictoryMusic=()=>{}; export const startDefeatMusic=()=>{}; export const startBattleMusic=()=>{};']]) {
        build.onResolve({ filter }, args => ({ path: args.path, namespace })); build.onLoad({ filter: /.*/, namespace }, () => ({ contents, loader: 'js' }));
      }
    } }],
  });
  const mod = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module: mod, exports: mod.exports, require, console, process, globalThis, setTimeout, clearTimeout });
  return mod.exports.BattleScene;
}

const key = (q, r) => `${q},${r}`;
function unit(id, side, q, r, options = {}) {
  return { bu: { id, nazwa: id, kategoria: 'piechota', hp: 10, maxHp: 10, stats: {} }, side, q, r, dead: false, fadingOut: false, removed: false, routed: false, acted: false,
    moveLeft: options.mp ?? 3, moveMax: options.mp ?? 3, rangedBase: false, primaryRanged: false, rangeBase: 0, range: 0, ammoLeft: 0, ammoMax: 0, shootingEnabled: true,
    mounted: false, formationRank: 0, groupId: null, playerOrder: { type: 'none' } };
}

function sceneFor(BattleScene, own, enemies) {
  const scene = Object.create(BattleScene.prototype);
  scene.atk = own; scene.def = enemies; scene.siegeWallCol = -1; scene._manualMode = true; scene.finished = false; scene._autoBattleSuspended = false;
  scene.roundNo = 1; scene.moves = []; scene.attacks = []; scene.busy = false;
  scene.occByKey = new Map([...own, ...enemies].map(u => [key(u.q, u.r), u]));
  scene._enemiesOf = u => (u.side === 'atk' ? scene.def : scene.atk).filter(e => !e.dead && !e.removed && !e.routed && !e.fadingOut);
  scene._isPlayerSide = side => side === 'atk';
  scene._isUnitDoctrineAuto = () => false;
  scene._passableForUnit = (_u, q, r) => q >= 0 && q < 64 && r >= 0 && r < 72;
  scene._destAllowedByBlockade = () => true;
  scene._compactAttackAllowsStep = () => true;
  scene._shouldAvoidAutoBacktrack = () => false;
  scene._canStrikeTargetFrom = (u, q, r, target) => Math.abs(q - target.q) + Math.abs(r - target.r) <= 1;
  scene._priorityScore = () => 0;
  // Stub prostej sciezki (BFS wymaga terrainMap): krok zachlanny w strone celu.
  scene._firstStepAlongPathToAttack = (ru, _allow, target) => {
    const dc = Math.sign(target.q - ru.q), dr = Math.sign(target.r - ru.r);
    if (dc !== 0) return `${ru.q + dc},${ru.r}`;
    if (dr !== 0) return `${ru.q},${ru.r + dr}`;
    return null;
  };
  scene._refreshQueuedOrderVisuals = () => {};
  scene._doMove = (u, q, r, done) => {
    // Krok kosztuje 1 MP (plaski teren), jak w _doMove -> moveLeft - stepCost.
    const next = key(q, r), from = key(u.q, u.r);
    if (scene.occByKey.has(next)) { done(); return; }
    scene.occByKey.delete(from); u.q = q; u.r = r; scene.occByKey.set(next, u);
    u.moveLeft = Math.max(0, u.moveLeft - 1); scene.moves.push(next); done();
  };
  scene._doAttack = (u, enemy, done) => {
    scene.attacks.push({ unit: u.bu.id, target: enemy.bu.id, distance: Math.abs(u.q - enemy.q) + Math.abs(u.r - enemy.r) });
    enemy.dead = true; scene.occByKey.delete(key(enemy.q, enemy.r)); done();
  };
  return scene;
}

async function main() {
  const BattleScene = await loadScene();
  const proto = BattleScene.prototype;
  const results = [];

  // 1. Marsz reczny: MP 3 na wolnej drodze -> jedna aktywacja zjada caly ruch (>= 1,5 heksa), jedno wywolanie done.
  {
    const mover = unit('marsz', 'atk', 3, 10, { mp: 3 });
    const s = sceneFor(BattleScene, [mover], []);
    mover.playerOrder = { type: 'move', col: 12, row: 10 };
    let doneCalls = 0;
    proto._performPlayerOrder.call(s, mover, () => { doneCalls++; });
    results.push({ test: 'march-full-move', moved: s.moves.length, q: mover.q, moveLeft: mover.moveLeft, doneCalls });
    assert.ok(s.moves.length >= 1.5, `marsz reczny: ${s.moves.length} krokow w jednej aktywacji (wymagane >= 1,5)`);
    assert.equal(doneCalls, 1, 'aktywacja konczy sie jednym done()');
    assert.ok(mover.moveLeft <= mover.moveMax * 0.1 + 1e-9 || mover.moveLeft === 0, 'niewykorzystany ruch <= 10%');
  }

  // 2. Atak reczny: jednostka idzie ku wrogowi pelnym ruchem i uderza na koncu ruchu (ruch + cios w tej samej rundzie).
  {
    const attacker = unit('szarza', 'atk', 3, 10, { mp: 3 });
    const enemy = unit('wrog', 'def', 7, 10);
    const s = sceneFor(BattleScene, [attacker], [enemy]);
    attacker.playerOrder = { type: 'attack', targetId: enemy.bu.id };
    let doneCalls = 0;
    proto._performPlayerOrder.call(s, attacker, () => { doneCalls++; });
    results.push({ test: 'attack-move-then-strike', moved: s.moves.length, attacks: s.attacks, doneCalls });
    assert.equal(s.attacks.length, 1, 'jeden cios na koncu ruchu');
    assert.equal(s.attacks[0].distance, 1, 'cios zadany z sasiedztwa');
    assert.ok(s.moves.length >= 2 && s.moves.length > 0, `ruch + cios w tej samej rundzie: ${s.moves.length} krokow`);
    assert.equal(doneCalls, 1);
  }

  // 3. Jeden cios na jednostke na ture: po ciosie nie ma drugiego, nawet jesli zostalo MP i drugi wrog stoi obok.
  {
    const attacker = unit('jeden-cios', 'atk', 3, 10, { mp: 3 });
    const e1 = unit('wrog-1', 'def', 4, 10);
    const e2 = unit('wrog-2', 'def', 4, 11);
    const s = sceneFor(BattleScene, [attacker], [e1, e2]);
    attacker.playerOrder = { type: 'move', col: 9, row: 10 };
    proto._performPlayerOrder.call(s, attacker, () => {});
    results.push({ test: 'one-strike-per-round', attacks: s.attacks.length, moveLeft: attacker.moveLeft });
    assert.equal(s.attacks.length, 1, 'po ciosie jednostka nie uderza drugi raz w tej samej rundzie');
  }

  // 4. Doktryna AI (isUnitDoctrineAuto) nie jest objeta lancuchem: jeden krok na aktywacje (zachowanie bez zmian).
  {
    const ai = unit('ai-doktryna', 'atk', 3, 10, { mp: 3 });
    const s = sceneFor(BattleScene, [ai], []);
    s._isUnitDoctrineAuto = () => true;
    s._manualMode = false;
    ai.playerOrder = { type: 'move', col: 12, row: 10 };
    proto._performPlayerOrder.call(s, ai, () => {});
    results.push({ test: 'doctrine-not-chained', moved: s.moves.length });
    assert.equal(s.moves.length, 1, 'poza trybem recznym: dotychczasowy jeden krok');
  }

  console.log(JSON.stringify(results, null, 2));
  console.log(`battle-manual-orders-full-move-test${MUTATE ? ' (MUTACJA)' : ''}: passed`);
}

main().catch(err => { console.error(err); process.exit(1); });
