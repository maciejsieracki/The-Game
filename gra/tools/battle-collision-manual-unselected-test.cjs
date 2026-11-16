'use strict';
// R-WEB-BATTLE-COLLISION-ARBITRATION-MANUAL-UNSELECTED-Q1: arbitraz kolizji o pole w bitwie RECZNEJ miedzy jednostkami
// NIEWYBRANYMI przez gracza (ruchem steruja reguly sceny) rozstrzygany jak w AUTO: piechota pierwsza, lucznik ustepuje,
// ten sam typ => mniejsze ID. Rozkaz jednostki WYBRANEJ nie jest przestawiany.
//
// Test na prawdziwych metodach BattleScene (esbuild + vm, jak battle-manual-orders-full-move-test): realne
// _computeManualArbitrationClaims, _applyManualArbPhantoms, _clearManualArbPhantoms, _activateNext, _activateUnit,
// _snapshotAutoBatchIntents i resolveAutoBatchPhase. Stubowane sa tylko: ruch po terenie (_doMove, _passableForUnit),
// planer sciezki BFS (_firstStepAlongPathToAttack -- zachlanny krok), timer (_schedule), UI (banner, kolejka rozkazow).
//
// Uzycie:  node tools/battle-collision-manual-unselected-test.cjs            -> zielony na kodzie
//          node tools/battle-collision-manual-unselected-test.cjs --mutate   -> mutacja: rezerwacje ARBITRAZU w trybie
//                                                                            recznym wylaczone (ma byc CZERWONY)
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
  let source = original;
  if (MUTATE) {
    const from = 'if (!this._manualMode || this._manualArbOwner.size === 0) return added;';
    if (!source.includes(from)) throw new Error('mutacja nie trafila w battleScene.ts');
    source = source.replace(from, 'return added;');
  }
  const result = await esbuild.build({
    stdin: { contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };", resolveDir: ROOT, sourcefile: 'manual-unselected-entry.ts' },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020', alias: { three: path.join(ROOT, 'node_modules/three/build/three.cjs') }, write: false, logLevel: 'silent',
    plugins: [{ name: 'manual-unselected', setup(build) {
      build.onLoad({ filter: /battleScene\.ts$/ }, () => ({ contents: source, loader: 'ts' }));
      for (const [filter, namespace, contents] of [[/brandAssets/, 'brand', 'export const civIconSvg=()=>""; export const brandIconSvg=()=>"";'], [/leaderPortraits/, 'leader', 'export const leaderPortraitUrl=()=>""; export const leaderName=()=>""; export const civIconIdFromCivLabel=()=>"";'], [/muzyka-antyczna/, 'audio', 'export const startVictoryMusic=()=>{}; export const startDefeatMusic=()=>{}; export const startBattleMusic=()=>{};']]) {
        build.onResolve({ filter }, args => ({ path: args.path, namespace }));
        build.onLoad({ filter: /.*/, namespace }, () => ({ contents, loader: 'js' }));
      }
    } }],
  });
  const mod = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module: mod, exports: mod.exports, require, console, process, globalThis, setTimeout, clearTimeout });
  return mod.exports.BattleScene;
}

const key = (q, r) => `${q},${r}`;
function unit(id, side, q, r, options = {}) {
  return {
    bu: { id, nazwa: id, kategoria: options.ranged ? 'lucznik' : 'piechota', hp: 10, maxHp: 10, stats: {} },
    side, q, r, dead: false, fadingOut: false, removed: false, routed: false, acted: false,
    moveLeft: options.mp ?? 1, moveMax: options.mp ?? 1, rangedBase: !!options.ranged, primaryRanged: !!options.ranged,
    rangeBase: options.ranged ? 2 : 0, range: options.ranged ? 2 : 0, ammoLeft: options.ranged ? 9 : 0, ammoMax: options.ranged ? 9 : 0,
    shootingEnabled: true, mounted: false, formationRank: 0, groupId: null, playerOrder: { type: 'none' },
    unitDoctrine: options.doctrine ?? null,
  };
}

/** Scena z prawdziwymi metodami; ruch po terenie i UI stubowane. Kolejka _schedule wykonywana przez runQueue. */
function sceneFor(BattleScene, own, enemies) {
  const scene = Object.create(BattleScene.prototype);
  scene.atk = own; scene.def = enemies; scene.siegeWallCol = -1; scene._manualMode = true; scene.finished = false;
  scene._autoBattleSuspended = false; scene.roundNo = 1; scene.moves = []; scene.attacks = []; scene.busy = false;
  scene.turnOrder = []; scene.turnIdx = 0; scene.log = []; scene.routedUnits = []; scene.vTimers = [];
  scene.occByKey = new Map([...own, ...enemies].map(u => [key(u.q, u.r), u]));
  scene._queuedOrderUnitIds = new Set();
  // Strona sterowana przez gracza (prawdziwe _isPlayerSide czyta to pole): atk = gracz.
  scene._deployPlayerSideOpt = 'atk';
  scene._manualArbOwner = new Map();
  scene._groupMeta = new Map();
  scene._queue = [];
  // Jak w produkcji: kontynuacja planowania AUTO (klony) wykonuje sie synchronicznie; reszta trafia do kolejki.
  scene._schedule = (_ms, cb) => { if (scene._autoBatchPlanning) cb(); else scene._queue.push(cb); };
  scene._checkEnd = () => false;
  // Start kolejnej tury planuje sam test (beginManualTurn); _beginTurn ze zgaszonej kolejki nie jest uruchamiany.
  scene._beginTurn = () => {};
  scene._updateBattlePhaseBanner = () => {};
  scene._refreshQueuedOrderVisuals = () => {};
  scene._applyTerrainRange = () => {};
  // Warstwa wizualna (3D) pominieta: nie wplywa na arbitraz pol.
  scene._updateFacing = () => {};
  scene._syncUnitVisual = () => {};
  scene._refreshUnitVisual = () => {};
  scene._playUnitAnim = () => {};
  scene._passableForUnit = (_u, q, r) => q >= 0 && q < 64 && r >= 0 && r < 72;
  scene._destAllowedByBlockade = () => true;
  scene._compactAttackAllowsStep = () => true;
  scene._shouldAvoidAutoBacktrack = () => false;
  scene._canStrikeTargetFrom = (u, q, r, target) => Math.abs(q - target.q) + Math.abs(r - target.r) <= 1;
  scene._priorityScore = () => 0;
  // Planer sciezki BFS pominiety: zachlanny krok w strone celu (ten sam stub co battle-manual-orders-full-move-test).
  scene._firstStepAlongPathToAttack = (ru, _allow, target) => {
    const t = target ?? scene._nearestEnemyOf(ru);
    if (!t) return null;
    // Jak BFS w produkcji: krok tylko na wolne, przejezdne pole (zajete pole nie jest kandydatem).
    const free = (q, r) => !scene.occByKey.has(key(q, r)) && scene._passableForUnit(ru, q, r);
    const dc = Math.sign(t.q - ru.q), dr = Math.sign(t.r - ru.r);
    if (dc !== 0 && free(ru.q + dc, ru.r)) return key(ru.q + dc, ru.r);
    if (dr !== 0 && free(ru.q, ru.r + dr)) return key(ru.q, ru.r + dr);
    return null;
  };
  scene._nearestEnemyOf = (ru) => {
    const en = (ru.side === 'atk' ? scene.def : scene.atk).filter(e => !e.dead && !e.removed && !e.fadingOut);
    let best = null; let bd = Infinity;
    for (const e of en) { const d = Math.abs(e.q - ru.q) + Math.abs(e.r - ru.r); if (d < bd) { bd = d; best = e; } }
    return best;
  };
  // Planowanie AUTO na klonach (_snapshotAutoBatchIntents) tez wola _doMove: wtedy zapisuje tylko krok intencji,
  // a NIE rejestr realnych ruchow (inaczej planowanie zanieczyszcza wynik).
  scene._doMove = (u, q, r, done) => {
    const planning = scene._autoBatchPlanning;
    const next = key(q, r), from = key(u.q, u.r);
    if (scene.occByKey.has(next)) { done(); return; }
    if (scene.occByKey.get(from) === u) scene.occByKey.delete(from);
    u.q = q; u.r = r; scene.occByKey.set(next, u);
    u.moveLeft = Math.max(0, u.moveLeft - 1);
    if (planning) { planning.intent.kind = 'move'; planning.intent.steps.push({ col: q, row: r }); }
    else scene.moves.push({ unit: u.bu.id, cell: next });
    done();
  };
  scene._doAttack = (u, enemy, done) => {
    if (scene._autoBatchPlanning) { done(); return; }
    scene.attacks.push({ unit: u.bu.id, target: enemy.bu.id });
    enemy.dead = true; if (scene.occByKey.get(key(enemy.q, enemy.r)) === enemy) scene.occByKey.delete(key(enemy.q, enemy.r)); done();
  };
  return scene;
}

/** Wykonuje kolejke timerow (ACT_GAP) az do wyczerpania -- odpowiednik uplywu czasu w przegladarce. */
function runQueue(scene, maxSteps = 500) {
  let steps = 0;
  while (scene._queue.length > 0 && steps++ < maxSteps) scene._queue.shift()();
  if (steps >= maxSteps) throw new Error(`kolejka timerow nie wygasla (ostatnie ${scene._queue.length} zadan): ${String(scene._queue[0]).slice(0, 300)}`);
}

/** Poczatek tury RECZNEJ jak w _beginTurn: kolejnosc = rosteru, reset akcji, potem rezerwacje arbitrazu i aktywacje. */
function beginManualTurn(scene) {
  const player = scene.atk.filter(u => !u.dead && !u.fadingOut && !u.removed);
  const enemy = scene.def.filter(u => !u.dead && !u.fadingOut && !u.removed);
  scene.turnOrder = [...player, ...enemy];
  for (const ru of scene.turnOrder) { ru.acted = false; ru.moveLeft = ru.moveMax; }
  scene.turnIdx = 0;
  scene._computeManualArbitrationClaims();
  scene._activateNext();
  runQueue(scene);
}

async function main() {
  const BattleScene = await loadScene();
  const proto = BattleScene.prototype;
  const results = [];
  let claimsSeen = 0;

  // S1: dwoch NIEWYBRANYCH wrogow (strona def, reguly sceny) chce to samo wolne pole (5,1).
  //     Lucznik def-1 stoi (5,0) i idzie w dol; piechota def-2 stoi (4,1) i idzie w prawo.
  //     Lucznik ma NIZSZY numer ID i roster przed piechota -- bez arbitrazu wszedlby pierwszy.
  //     Oczekiwane: piechota def-2 wchodzi na (5,1), lucznik def-1 ustepuje (nie wchodzi).
  {
    const archer = unit('def-1', 'def', 5, 0, { ranged: true });
    const infantry = unit('def-2', 'def', 4, 1);
    const target = unit('atk-1', 'atk', 9, 1, { doctrine: 'manual' });
    const targetB = unit('atk-2', 'atk', 5, 3, { doctrine: 'manual' });
    const s = sceneFor(BattleScene, [target, targetB], [archer, infantry]);
    beginManualTurn(s);
    claimsSeen = s._manualArbOwner.size;
    const enteredByInfantry = s.moves.some(m => m.unit === 'def-2' && m.cell === key(5, 1));
    const enteredByArcher = s.moves.some(m => m.unit === 'def-1' && m.cell === key(5, 1));
    results.push({ test: 'S1-infantry-wins-archer-yields', moves: s.moves, claimsOnNonSelected: claimsSeen });
    assert.ok(claimsSeen > 0, 'S1: arbitraz zarezerwowal pola dla jednostek niewybranych');
    assert.equal(enteredByInfantry, true, 'S1: piechota def-2 wchodzi na (5,1)');
    assert.equal(enteredByArcher, false, 'S1: lucznik def-1 ustepuje i nie wchodzi na (5,1)');
  }

  // S2: ten sam typ (piechota vs piechota) -- mniejsze ID wchodzi, wiekszy ustepuje (brak ping-ponga).
  {
    const a10 = unit('def-10', 'def', 5, 0);
    const a2 = unit('def-2', 'def', 4, 1);
    const target = unit('atk-1', 'atk', 9, 1, { doctrine: 'manual' });
    const targetB = unit('atk-2', 'atk', 5, 3, { doctrine: 'manual' });
    const s = sceneFor(BattleScene, [target, targetB], [a10, a2]);
    beginManualTurn(s);
    const winner = s.moves.filter(m => m.cell === key(5, 1)).map(m => m.unit);
    results.push({ test: 'S2-same-class-lower-id-wins', winners: winner, moves: s.moves });
    assert.deepEqual(winner, ['def-2'], 'S2: def-2 (nizszy numer) wchodzi na (5,1), def-10 nie');
  }

  // S3 (rozkaz wybranej jednostki bez zmian): lucznik GRACZA (atk) z rozkazem ruchu na (5,1) jest WYBRANY;
  //     niewybrana piechota wroga (def-2) tez chce (5,1). Rozkaz gracza nie moze byc przestawiony:
  //     lucznik wchodzi na (5,1), piechota nie.
  {
    const archer = unit('atk-1', 'atk', 5, 0, { ranged: true, mp: 1 });
    archer.playerOrder = { type: 'move', col: 5, row: 1 };
    const infantry = unit('def-2', 'def', 4, 1);
    const enemy = unit('def-9', 'def', 9, 1);
    const s = sceneFor(BattleScene, [archer], [infantry, enemy]);
    beginManualTurn(s);
    const archerMoved = s.moves.some(m => m.unit === 'atk-1' && m.cell === key(5, 1));
    const infantryMoved = s.moves.some(m => m.unit === 'def-2' && m.cell === key(5, 1));
    results.push({ test: 'S3-selected-order-not-changed', moves: s.moves });
    assert.equal(archerMoved, true, 'S3: rozkaz wybranego lucznika (5,1) wykonany bez przestawiania');
    assert.equal(infantryMoved, false, 'S3: niewybrana piechota nie wchodzi na pole zajete rozkazem gracza');
  }

  // S4 (stabilnosc, 30 rund): brak zamiany miejscami i ping-ponga; wynik identyczny przy powtorzeniu (determinizm x3).
  const fingerprints = [];
  for (let rep = 0; rep < 3; rep++) {
    const archer = unit('def-1', 'def', 5, 0, { ranged: true });
    const infantry = unit('def-2', 'def', 4, 1);
    const target = unit('atk-1', 'atk', 9, 1, { doctrine: 'manual' });
    const targetB = unit('atk-2', 'atk', 5, 3, { doctrine: 'manual' });
    const s = sceneFor(BattleScene, [target, targetB], [archer, infantry]);
    for (let round = 0; round < 30; round++) beginManualTurn(s);
    fingerprints.push(JSON.stringify({ moves: s.moves, pos: [archer.q, archer.r, infantry.q, infantry.r] }));
    // Ping-pong: ta sama jednostka wraca na pole sprzed dwoch swoich ruchow (A->B->A).
    const perUnit = new Map();
    for (const m of s.moves) { if (!perUnit.has(m.unit)) perUnit.set(m.unit, []); perUnit.get(m.unit).push(m.cell); }
    let pingpong = 0;
    for (const seq of perUnit.values()) for (let i = 2; i < seq.length; i++) if (seq[i] === seq[i - 2]) pingpong++;
    // Zamiana miejscami: dwie jednostki wymieniaja pola w kolejnych ruchach (A: X->Y, potem B: Y->X).
    let swaps = 0;
    for (let i = 1; i < s.moves.length; i++) {
      const prev = s.moves[i - 1], cur = s.moves[i];
      const prevFrom = s.moves.length && prev.unit !== cur.unit && cur.cell === prev.cell;
      if (prevFrom) swaps++;
    }
    assert.equal(pingpong, 0, 'S4: brak ping-pongu (powrot na wlasne pole sprzed 2 ruchow) w 30 rundach');
    assert.equal(swaps, 0, 'S4: brak zamiany miejscami w 30 rundach');
  }
  assert.equal(new Set(fingerprints).size, 1, 'S4: determinizm x3 na tym samym scenariuszu');
  results.push({ test: 'S4-30-rounds-determinism-x3', fingerprint: fingerprints[0].length });

  console.log(JSON.stringify(results, null, 2));
  console.log(`battle-collision-manual-unselected-test${MUTATE ? ' (MUTACJA)' : ''}: passed`);
}

main().catch(err => { console.error(err); process.exit(1); });
