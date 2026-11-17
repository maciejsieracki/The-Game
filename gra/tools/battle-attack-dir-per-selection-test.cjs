'use strict';
// R-WEB-BATTLE-ATTACK-DIRECTION-PER-SELECTED-UNITS-Q1 (DODATEK 1 ABC B): Kierunek natarcia,
// Formacja i Konnica dzialaja na DOKLADNIE zaznaczone jednostki (brak zaznaczenia = cala armia).
// Test headless (esbuild + vm, jak battle-deploy-cavalry-flanks-test.cjs).
const assert = require('node:assert/strict');
const path = require('node:path'); const vm = require('node:vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
async function load() {
  const result = await esbuild.build({
    stdin: { contents: "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };", resolveDir: path.join(__dirname, '..'), sourcefile: 'p.ts' },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(__dirname, '..', 'node_modules', 'three', 'build', 'three.cjs') },
    plugins: [require('./lib/esbuild-raw-plugin.cjs'), { name: 's', setup(b) {
      const st = (f, c) => { const ns = 'ns' + f.source; b.onResolve({ filter: f }, () => ({ path: ns, namespace: ns })); b.onLoad({ filter: /.*/, namespace: ns }, () => ({ contents: c, loader: 'js' })); };
      st(/render\/units/, "import * as THREE from 'three'; export const buildUnitModel = () => new THREE.Group();");
      st(/brandAssets/, 'export const civIconSvg = () => ""; export const brandIconSvg = () => "";');
      st(/leaderPortraits/, 'export const leaderPortraitUrl = () => ""; export const leaderName = () => ""; export const civIconIdFromCivLabel = () => "";');
      st(/muzyka-antyczna/, 'export const startVictoryMusic = () => {}; export const startDefeatMusic = () => {}; export const startBattleMusic = () => {};');
    } }], write: false, logLevel: 'silent' });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout }, { filename: 'b.ts' });
  return module.exports.BattleScene;
}
const unit = (id, cat, name, st = {}) => ({ id, nazwa: name, kategoria: cat, ownerColor: '#48c', hp: 100, maxHp: 100, morale: 100, stats: { Jednostka: name, Atak: 8, Obrona: 8, Pancerz: 2, Ruch: 4, ...st } });
function makeScene(BS) {
  const scene = Object.create(BS.prototype);
  scene.scene = { add() {} };
  scene.terrainMap = { passable: () => true, at: () => 'plains' };
  scene.occByKey = new Map(); scene.ownedGeos = []; scene.ownedMats = [];
  scene._deployMode = true; scene.deployPhase = true; scene.siegeWallCol = -1;
  scene._deployMeleeLines = 1; scene._deployArcherLines = 1;
  scene._playerControlSide = () => 'atk';
  scene._updateHpBar = scene._updateMoraleBar = scene._updateAmmoBar = () => {};
  scene._debugRecordSiegeColumns = scene._repositionSiegeAttackers = () => {};
  scene._placeSiegeDefenders = () => []; scene._savedAtkBUs = scene._savedDefBUs = [];
  // UI stubs: only feedback text is recorded
  scene.feedback = [];
  scene._showOrderFeedback = (m) => { scene.feedback.push(m); };
  scene._refreshDeploySelectionVisuals = () => {};
  scene._updateRosterBar = () => {};
  scene._syncDeployAttackDirectionButtons = () => {};
  scene._syncDeployCavalryButtons = () => {};
  scene._syncDeployFormationButtons = () => {};
  scene._updateDeployToolbarStatus = () => {};
  scene._showDeployFeedback = () => {};
  scene._syncDeployLinesButtons = () => {};
  return scene;
}
const isMounted = (u) => /^m\d/.test(u.bu.id);
// Mieszana armia: jedna grupa "1" = 6 piechoty + 4 konnicy (+ dowodca)
function mixedArmy(BS) {
  const roster = [
    ...Array.from({ length: 6 }, (_, i) => unit('inf' + i, 'miecznik', 'Wojownik')),
    ...Array.from({ length: 4 }, (_, i) => unit('m' + i, 'konnica', 'Jeździec')),
    unit('leader', 'dowodca', 'Wódz', { isArmyCommander: true }),
  ];
  const scene = makeScene(BS);
  BS.prototype._placeUnits.call(scene, roster, roster);
  const ids = scene.atk.map(u => u.bu.id);
  for (const u of scene.atk) u.groupId = '1';
  scene._groups = new Map([['1', new Set(ids)]]);
  scene._groupMeta = new Map();
  scene._selectedUnits = new Set();
  return scene;
}
// Dwie grupy: G "1" = 6 piechoty; G "2" = 4 konnice + wodz (zaznaczenie calej G2 mozliwe)
function twoGroupArmy(BS) {
  const s = mixedArmy(BS);
  for (const u of s.atk) u.groupId = (u.bu.id.startsWith('inf') ? '1' : '2');
  s._groups = new Map([
    ['1', new Set(s.atk.filter(u => u.groupId === '1').map(u => u.bu.id))],
    ['2', new Set(s.atk.filter(u => u.groupId === '2').map(u => u.bu.id))],
  ]);
  return s;
}
const sel = (scene, pred) => { scene._selectedUnits = new Set(scene.atk.filter(pred).map(u => u.bu.id)); };
const mounted = (scene) => scene.atk.filter(isMounted);
const foot = (scene) => scene.atk.filter(u => !isMounted(u));
(async () => {
  const BS = await load();
  const apply = (scene, fn, ...args) => BS.prototype[fn].apply(scene, args);
  let checks = 0;
  // (a) zaznaczona konnica + Tyl -> tylko konnica; piechota front; meta grupy nie nadpisana
  {
    const s = mixedArmy(BS);
    assert.equal(mounted(s).length, 4, '(a) precondition: 4 cavalry in army');
    sel(s, isMounted);
    apply(s, '_applyDeployAttackDirection', 'tyl');
    for (const u of mounted(s)) assert.equal(u.attackDirection, 'tyl', `(a) ${u.bu.id} = tyl`);
    for (const u of foot(s)) assert.equal(u.attackDirection, 'front', `(a) ${u.bu.id} stays front`);
    assert.notEqual(s._ensureGroupMeta('1').attackDirection, 'tyl', '(a) group meta not overwritten by partial order');
    assert.match(s.feedback.at(-1), /zaznaczenie \(4\)/, '(a) feedback names selection scope');
    checks += 4;
  }
  // (b) brak zaznaczenia -> cala armia
  {
    const s = mixedArmy(BS);
    apply(s, '_applyDeployAttackDirection', 'bok');
    for (const u of s.atk) assert.equal(u.attackDirection, 'bok', `(b) ${u.bu.id} = bok`);
    assert.equal(s._ensureGroupMeta('1').attackDirection, 'bok', '(b) group meta set for full army');
    assert.match(s.feedback.at(-1), /cała armia/, '(b) feedback says whole army');
    checks += 3;
  }
  // (c) kolejnosc: cala armia front, potem konnica tyl -> tylko konnica zmieniona
  {
    const s = mixedArmy(BS);
    apply(s, '_applyDeployAttackDirection', 'front');
    sel(s, isMounted);
    apply(s, '_applyDeployAttackDirection', 'tyl');
    for (const u of mounted(s)) assert.equal(u.attackDirection, 'tyl', `(c) ${u.bu.id} tyl`);
    for (const u of foot(s)) assert.equal(u.attackDirection, 'front', `(c) ${u.bu.id} front`);
    checks += 2;
  }
  // (c2) zaznaczenie WSZYSTKICH zywych jednostek grupy -> meta grupy wolno ustawic
  {
    const s = mixedArmy(BS);
    sel(s, () => true);
    apply(s, '_applyDeployAttackDirection', 'tyl');
    assert.equal(s._ensureGroupMeta('1').attackDirection, 'tyl', '(c2) full-group selection sets group meta');
    checks += 1;
  }
  // (e) Konnica (tryb) per zaznaczenie: zaznaczona konnica -> piechota stoi, bez kolizji
  {
    const s = mixedArmy(BS);
    const footBefore = new Map(foot(s).map(u => [u.bu.id, [u.q, u.r]]));
    sel(s, isMounted);
    apply(s, '_applyDeployCavalryMode', 'rear');
    for (const u of foot(s)) assert.deepEqual([u.q, u.r], footBefore.get(u.bu.id), `(e) foot ${u.bu.id} not moved by cavalry order`);
    const cells = s.atk.map(u => u.q + ',' + u.r);
    assert.equal(new Set(cells).size, cells.length, '(e) no two units share a cell after cavalry order');
    assert.equal(s._ensureGroupMeta('1').cavalryMode, undefined, '(e) partial selection does not set group cavalryMode');
    checks += 3;
    // (e2) Konnica "z tylu" fizycznie przestawia zaznaczona konnice (nie tylko meta/tryb)
    const s2 = mixedArmy(BS);
    const cavBefore = new Map(mounted(s2).map(u => [u.bu.id, u.q + ',' + u.r]));
    sel(s2, isMounted);
    apply(s2, '_applyDeployCavalryMode', 'rear');
    const moved = mounted(s2).filter(u => (u.q + ',' + u.r) !== cavBefore.get(u.bu.id)).length;
    assert.ok(moved > 0, '(e2) selected cavalry physically repositioned by rear order');
    checks += 1;
  }
  // (f) Formacja per zaznaczenie: F1 na 2 jednostki piechoty -> konnica stoi, bez kolizji
  {
    const s = mixedArmy(BS);
    const cavBefore = new Map(mounted(s).map(u => [u.bu.id, [u.q, u.r]]));
    const infBefore = new Map(foot(s).map(u => [u.bu.id, u.q + ',' + u.r]));
    sel(s, u => u.bu.id === 'inf0' || u.bu.id === 'inf1');
    apply(s, '_applyDeployArmyFormation', 'F1');
    const infMoved = foot(s).filter(u => (u.q + ',' + u.r) !== infBefore.get(u.bu.id)).map(u => u.bu.id);
    assert.ok(infMoved.length > 0 && infMoved.every(id => id === 'inf0' || id === 'inf1'), '(f0) only selected infantry repositioned by Formacja: ' + infMoved.join(','));
    for (const u of mounted(s)) assert.deepEqual([u.q, u.r], cavBefore.get(u.bu.id), `(f) cavalry ${u.bu.id} not moved`);
    const cells = s.atk.map(u => u.q + ',' + u.r);
    assert.equal(new Set(cells).size, cells.length, '(f) no cell collisions after partial formation');
    checks += 3;
  }
  // (g) dwie grupy: zaznaczone cala G2 (4 konnice + wodz) + 1 piechurz z G1
  //     -> G2 w pelni objeta (meta tak), G1 czesciowo (meta NIE); reszta piechoty front; feedback "cala grupa (6)"? -> zaznaczenie
  {
    const s = twoGroupArmy(BS);
    sel(s, u => isMounted(u) || u.bu.id === 'leader' || u.bu.id === 'inf0');
    apply(s, '_applyDeployAttackDirection', 'tyl');
    for (const u of s.atk.filter(u => isMounted(u) || u.bu.id === 'leader' || u.bu.id === 'inf0')) assert.equal(u.attackDirection, 'tyl', `(g) ${u.bu.id} tyl`);
    for (const u of s.atk.filter(u => u.bu.id.startsWith('inf') && u.bu.id !== 'inf0')) assert.equal(u.attackDirection, 'front', `(g) ${u.bu.id} front`);
    assert.equal(s._groupMeta.get('1')?.attackDirection, undefined, '(g) partial G1 does not set meta');
    assert.equal(s._groupMeta.get('2')?.attackDirection, 'tyl', '(g) fully covered G2 sets meta');
    assert.match(s.feedback.at(-1), /zaznaczenie \(6\)/, '(g) feedback names selection of 6');
    checks += 9;
  }
  // (g2) cala grupa jednej grupy -> etykieta "cala grupa"
  {
    const s = twoGroupArmy(BS);
    sel(s, u => u.groupId === '2');
    apply(s, '_applyDeployAttackDirection', 'bok');
    assert.match(s.feedback.at(-1), /cała grupa \(5\)/, '(g2) whole group labelled as group');
    checks += 1;
  }
  // (h) chip stanu: zaznaczenie mieszane (tyl + front) -> flaga mixed; jednorodne -> bez flagi
  {
    const s = mixedArmy(BS);
    apply(s, '_applyDeployAttackDirection', 'front');
    sel(s, isMounted);
    apply(s, '_applyDeployAttackDirection', 'tyl');
    sel(s, u => isMounted(u) || u.bu.id === 'inf0');
    apply(s, '_syncDeployToolbarFromSelection');
    assert.equal(s._deployAttackDirMixed, true, '(h) mixed selection (tyl+front) -> chip "Natarcie: rozne"');
    sel(s, isMounted);
    apply(s, '_syncDeployToolbarFromSelection');
    assert.equal(s._deployAttackDirMixed, false, '(h) uniform selection -> no mixed flag');
    assert.equal(s._deployAttackDirection, 'tyl', '(h) uniform selection shows its direction');
    checks += 3;
  }
  // (h2) brak zaznaczenia po mieszanej armii -> chip pokazuje "rozne" (zakres = cala armia)
  {
    const s = mixedArmy(BS);
    apply(s, '_applyDeployAttackDirection', 'front');
    sel(s, isMounted);
    apply(s, '_applyDeployAttackDirection', 'tyl');
    sel(s, () => false);
    s._deployActiveGroupId = null;
    apply(s, '_syncDeployToolbarFromSelection');
    assert.equal(s._deployAttackDirMixed, true, '(h2) no selection over mixed army -> mixed chip');
    checks += 1;
  }
  // (i) powtorka bitwy: snapshot mieszany -> flaga mixed (nie pokazuje kierunku pierwszej jednostki)
  {
    const s = mixedArmy(BS);
    const snap = new Map(s.atk.map(u => [u.bu.id, u.bu.id.startsWith('m') ? 'tyl' : 'front']));
    apply(s, '_restoreDeployAttackDirSnapshot', snap);
    assert.equal(s._deployAttackDirMixed, true, '(i) restored mixed snapshot -> mixed chip');
    checks += 1;
  }
  console.log('battle-attack-dir-per-selection-test: OK, checks=' + checks);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
