'use strict';
/**
 * R-WEB-BATTLE-CAP-500-Q1
 * Limit jednostek na strone na polu bitwy = 500 (jedno zrodlo: MAX_PER_SIDE w battleScene.ts).
 * Headless (bez WebGL): produkcyjne _placeUnits + produkcyjne _activateUnit; _doMove/_doAttack to adaptery
 * fixture (ruch + prosty model obrazen), wiec test mierzy KOSZT LOGIKI tury i poprawnosc rozstawienia / konca bitwy.
 * NIE mierzy FPS renderu (brak GPU/Chromium w srodowisku) -- patrz raport.
 * Run from gra/: node tools/battle-cap-500-test.cjs
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const fs = require('node:fs');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');

async function loadModules() {
  const result = await esbuild.build({
    stdin: {
      contents: `import { BattleScene, BATTLE_MAX_PER_SIDE } from './src/battle/battleScene.ts';
import { battleReserveNotice } from './src/game/post-battle-map.ts';
module.exports = { BattleScene, BATTLE_MAX_PER_SIDE, battleReserveNotice };`,
      resolveDir: ROOT, sourcefile: 'battle-cap-500-entry.ts',
    },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(ROOT, 'node_modules', 'three', 'build', 'three.cjs') },
    plugins: [{
      name: 'stubs',
      setup(build) {
        const stubs = [
          [/render\/units/, "import * as THREE from 'three'; export const buildUnitModel = () => new THREE.Group();"],
          [/brandAssets/, 'export const civIconSvg = () => ""; export const brandIconSvg = () => "";'],
          [/leaderPortraits/, 'export const leaderPortraitUrl = () => ""; export const leaderName = () => ""; export const civIconIdFromCivLabel = () => "";'],
          [/muzyka-antyczna/, 'export const startVictoryMusic = () => {}; export const startDefeatMusic = () => {}; export const startBattleMusic = () => {};'],
        ];
        stubs.forEach(([filter, contents], i) => {
          const ns = 'stub' + i;
          build.onResolve({ filter }, args => ({ path: args.path, namespace: ns }));
          build.onLoad({ filter: /.*/, namespace: ns }, () => ({ contents, loader: 'js', resolveDir: ROOT }));
        });
      },
    }],
    write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout, performance,
  }, { filename: 'battleScene.ts' });
  return module.exports;
}

const BOARD_COLS = 68, BOARD_ROWS = 156;
const PLAY_COLS = Math.round(BOARD_COLS * Math.SQRT1_2), PLAY_ROWS = Math.round(BOARD_ROWS * Math.SQRT1_2);
const PLAY_COL0 = Math.floor((BOARD_COLS - PLAY_COLS) / 2), PLAY_ROW0 = Math.floor((BOARD_ROWS - PLAY_ROWS) / 2);
const PLAY_COL1 = PLAY_COL0 + PLAY_COLS - 1, PLAY_ROW1 = PLAY_ROW0 + PLAY_ROWS - 1;

let pass = 0;
function ok(cond, msg) { assert.ok(cond, msg); pass++; }

function mkUnit(side, i, kind) {
  const defs = {
    inf: { cat: 'miecznik', name: 'Wojownik', st: {} },
    jav: { cat: 'oszczepnik', name: 'Oszczepnik', st: { 'Atak dystansowy': 5, 'Zasięg ataku (hex)': 2, 'Ilosc pociskow': 6 } },
    arch: { cat: 'lucznik', name: 'Łucznik', st: { 'Atak dystansowy': 5, 'Zasięg ataku (hex)': 4, 'Ilosc pociskow': 12 } },
    cav: { cat: 'konnica', name: 'Jeździec', st: {} },
  }[kind];
  return {
    id: `${side}-${kind}-${i}`, nazwa: defs.name, kategoria: defs.cat, ownerColor: side === 'atk' ? '#4488cc' : '#cc4444',
    hp: 100, maxHp: 100, morale: 100,
    stats: { Jednostka: defs.name, Atak: 8, Obrona: 5, Pancerz: 1, Ruch: 3, 'Ruch w bitwie (heksy)': 2, ...defs.st },
  };
}
function mkRoster(side, n) {
  // 60% piechota, 15% oszczep, 15% luk, 10% konnica -- typowy mieszany sklad
  return Array.from({ length: n }, (_, i) => {
    const m = i % 20;
    const kind = m < 12 ? 'inf' : m < 15 ? 'jav' : m < 18 ? 'arch' : 'cav';
    return mkUnit(side, i, kind);
  });
}

function makeScene(BattleScene, blocked) {
  const scene = Object.create(BattleScene.prototype);
  scene.scene = { add() {}, remove() {} };
  scene.terrainMap = {
    passable: (c, r) => c >= 0 && c < BOARD_COLS && r >= 0 && r < BOARD_ROWS && !blocked.has(`${c},${r}`),
    at: () => 0, moveCost: () => 1, combatTerrainName: () => 'Plaskie (rownina/laka)',
  };
  scene.occByKey = new Map(); scene.ownedGeos = []; scene.ownedMats = [];
  scene._deployMode = false; scene.deployPhase = false; scene.siegeWallCol = -1;
  scene._deployMeleeLines = 1; scene._deployArcherLines = 1;
  scene._playerControlSide = () => 'atk';
  scene._updateHpBar = scene._updateMoraleBar = scene._updateAmmoBar = () => {};
  scene._debugRecordSiegeColumns = scene._repositionSiegeAttackers = () => {};
  scene._placeSiegeDefenders = () => [];
  scene._savedAtkBUs = scene._savedDefBUs = [];
  return scene;
}

function checkPlacement(units, side, expected, label) {
  ok(units.length === expected, `${label}/${side}: wystawiono ${units.length}, oczekiwano ${expected}`);
  const cells = new Set(units.map(u => `${u.q},${u.r}`));
  ok(cells.size === units.length, `${label}/${side}: brak nakladania (${cells.size}/${units.length} unikalnych pol)`);
  ok(units.every(u => Number.isFinite(u.q) && Number.isFinite(u.r)), `${label}/${side}: brak NaN w pozycjach`);
  ok(units.every(u => u.q >= 0 && u.q < BOARD_COLS && u.r >= 0 && u.r < BOARD_ROWS), `${label}/${side}: w granicach planszy`);
  const outsidePlay = units.filter(u => u.q < PLAY_COL0 || u.q > PLAY_COL1 || u.r < PLAY_ROW0 || u.r > PLAY_ROW1).length;
  ok(outsidePlay === 0, `${label}/${side}: ${outsidePlay} jednostek poza strefa gry`);
}

function setupSim(scene) {
  const key = (q, r) => `${q},${r}`;
  const stats = { moves: 0, attacks: 0, kills: 0 };
  Object.assign(scene, {
    finished: false, _manualMode: false, _autoBattleSuspended: false, _autoBatchPlanning: null,
    _groupMeta: new Map(), _groups: new Map(), _selectedUnits: new Set(),
    _generalSettings: { blockadeActive: false, blockadeCol: null },
    _targetPriorities: { mounted: ['mounted', 'ranged', 'melee'], ranged: ['melee', 'ranged', 'mounted'], melee: ['melee', 'mounted', 'ranged'] },
    terrainData: require(path.join(ROOT, 'data/terrain-combat.json')),
    _movePoints: 2, _isCatapult: () => false,
    _refreshQueuedOrderVisuals() {}, _updateFacing() {}, _schedule(_d, cb) { cb(); },
    _isPlayerSide: () => false,
    _doMove(ru, q, r, done) {
      const k = key(q, r);
      if (!scene.occByKey.has(k) && scene.terrainMap.passable(q, r)) {
        scene.occByKey.delete(key(ru.q, ru.r)); scene.occByKey.set(k, ru);
        ru.q = q; ru.r = r; ru.moveLeft = Math.max(0, ru.moveLeft - 1); stats.moves++;
      }
      done();
    },
    _doAttack(ru, target, done) {
      stats.attacks++;
      if (ru.rangedBase && ru.ammoLeft > 0) ru.ammoLeft--;
      target.bu.hp -= 12;
      if (target.bu.hp <= 0 && !target.dead) {
        target.dead = true; stats.kills++;
        scene.occByKey.delete(key(target.q, target.r));
      }
      ru.acted = true;
      done();
    },
  });
  return stats;
}

async function main() {
  const { BattleScene, BATTLE_MAX_PER_SIDE, battleReserveNotice } = await loadModules();

  // 1) jedno zrodlo prawdy
  ok(BATTLE_MAX_PER_SIDE === 500, `BATTLE_MAX_PER_SIDE === 500 (jest ${BATTLE_MAX_PER_SIDE})`);
  const src = fs.readFileSync(path.join(ROOT, 'src/battle/battleScene.ts'), 'utf8');
  ok(/^const MAX_PER_SIDE = 500;/m.test(src), 'jedna stala MAX_PER_SIDE = 500 w battleScene.ts');
  ok(!/\.slice\(0,\s*120\)/.test(src), 'brak literalnego slice(0, 120)');

  // 2) rozstawienie 500 vs 500 na czystej planszy i z przeszkodami (10% zablokowanych pol)
  const results = {};
  for (const variant of ['plains', 'obstacles']) {
    const blocked = new Set();
    if (variant === 'obstacles') {
      let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
      for (let c = PLAY_COL0; c <= PLAY_COL1; c++) for (let r = PLAY_ROW0; r <= PLAY_ROW1; r++) if (rnd() < 0.10) blocked.add(`${c},${r}`);
    }
    const scene = makeScene(BattleScene, blocked);
    const atkIn = mkRoster('atk', 500), defIn = mkRoster('def', 500);
    const t0 = performance.now();
    BattleScene.prototype._placeUnits.call(scene, atkIn, defIn);
    const placeMs = performance.now() - t0;
    checkPlacement(scene.atk, 'atk', 500, `500v500/${variant}`);
    checkPlacement(scene.def, 'def', 500, `500v500/${variant}`);
    ok(new Set([...scene.atk, ...scene.def].map(u => `${u.q},${u.r}`)).size === 1000, `500v500/${variant}: 1000 unikalnych pol lacznie`);
    ok(scene.atk.every(u => !blocked.has(`${u.q},${u.r}`)) && scene.def.every(u => !blocked.has(`${u.q},${u.r}`)), `500v500/${variant}: nikt na zablokowanym polu`);
    const maxAtkCol = Math.max(...scene.atk.map(u => u.q)), minDefCol = Math.min(...scene.def.map(u => u.q));
    ok(maxAtkCol < minDefCol, `500v500/${variant}: armie rozdzielone (atk max kol ${maxAtkCol} < def min kol ${minDefCol})`);
    console.log(`PERF rozstawienie 500v500 (${variant}): ${placeMs.toFixed(0)} ms`);
    results[variant] = { placeMs: +placeMs.toFixed(1), scene };
  }

  // 3) limit: 600 vs 450 -> 500 / 450, rezerwa 100 nietknieta
  {
    const scene = makeScene(BattleScene, new Set());
    const atkIn = mkRoster('atk', 600), defIn = mkRoster('def', 450);
    const snapshot = atkIn.slice(500).map(u => JSON.stringify(u));
    BattleScene.prototype._placeUnits.call(scene, atkIn, defIn);
    ok(scene.atk.length === 500 && scene.def.length === 450, `600v450 -> ${scene.atk.length}/${scene.def.length} (oczek. 500/450)`);
    checkPlacement(scene.atk, 'atk', 500, '600v450'); checkPlacement(scene.def, 'def', 450, '600v450');
    const deployedIds = new Set(scene.atk.map(u => u.bu.id));
    ok(atkIn.slice(500).every(u => !deployedIds.has(u.id)), '600v450: rezerwa (100 ostatnich) nie wystawiona');
    ok(atkIn.slice(500).map(u => JSON.stringify(u)).every((s, i) => s === snapshot[i]), '600v450: rezerwa 100 nietknieta (dane jednostek bez zmian)');
    ok(atkIn.length === 600, '600v450: tablica wejsciowa nadal ma 600');
    const notice = battleReserveNotice(600, 450, BATTLE_MAX_PER_SIDE, 'atk');
    ok(notice && /^100 /.test(notice), `komunikat rezerwy dziala z limitem 500: "${notice}"`);
    ok(!/120/.test(String(notice)), 'komunikat nie zawiera starego limitu 120');
    ok(!battleReserveNotice(500, 500, BATTLE_MAX_PER_SIDE, 'atk'), 'brak komunikatu gdy nikt nie przekracza 500');
  }

  // 4) symulacja logiki tury 500 vs 500: czas na ture, brak NaN, bitwa sie konczy
  const maxTurns = Number(process.env.CAP500_TURNS || 150);
  const simN = Number(process.env.CAP500_SIM_N || 500);
  const scene = makeScene(BattleScene, new Set());
  BattleScene.prototype._placeUnits.call(scene, mkRoster('atk', simN), mkRoster('def', simN));
  const stats = setupSim(scene);

  // 3b) rownowaznosc zoptymalizowanego testu celu BFS (_makeCanAttackFromTest) z _canAttackFrom
  {
    let seed = 99; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
    const all = [...scene.atk, ...scene.def];
    let compared = 0, trues = 0;
    for (let k = 0; k < 60; k++) {
      const ru = all[Math.floor(rnd() * all.length)];
      const fast = BattleScene.prototype._makeCanAttackFromTest.call(scene, ru);
      for (let t = 0; t < 400; t++) {
        const c = PLAY_COL0 + Math.floor(rnd() * PLAY_COLS), r = PLAY_ROW0 + Math.floor(rnd() * PLAY_ROWS);
        const slow = BattleScene.prototype._canAttackFrom.call(scene, ru, c, r);
        assert.equal(fast(c, r), slow, `_makeCanAttackFromTest == _canAttackFrom (${ru.bu.id} @${c},${r}, range ${ru.range})`);
        compared++; if (slow) trues++;
      }
    }
    ok(compared === 24000 && trues > 0, `rownowaznosc testu celu BFS: ${compared} porownan, ${trues} trafien`);
  }
  const turnMs = [];
  let turns = 0;
  for (; turns < maxTurns; turns++) {
    const t0 = performance.now();
    for (const ru of [...scene.atk, ...scene.def]) {
      if (ru.dead) continue;
      ru.acted = false; ru.moveLeft = 2; ru.playerOrder = { type: 'none' };
      BattleScene.prototype._activateUnit.call(scene, ru, () => {});
    }
    turnMs.push(performance.now() - t0);
    if (process.env.CAP500_VERBOSE && turns % 10 === 0) console.log(`tura ${turns}: ${turnMs[turnMs.length - 1].toFixed(0)} ms, zywi atk ${scene.atk.filter(u => !u.dead).length} def ${scene.def.filter(u => !u.dead).length}`);
    const a = scene.atk.filter(u => !u.dead).length, d = scene.def.filter(u => !u.dead).length;
    if (Math.min(a, d) <= Math.ceil(simN * 0.05)) { turns++; break; }
  }
  const aliveA = scene.atk.filter(u => !u.dead).length, aliveD = scene.def.filter(u => !u.dead).length;
  if (process.env.CAP500_DIAG && aliveA && aliveD) {
    const liveA = scene.atk.filter(u => !u.dead), liveD = scene.def.filter(u => !u.dead);
    const near = u => Math.min(...(u.side === 'atk' ? liveD : liveA).map(e => Math.abs(e.q - u.q) + Math.abs(e.r - u.r)));
    console.log('DIAG def:', liveD.map(u => `${u.bu.kategoria}@${u.q},${u.r} hp${u.bu.hp} routed=${!!u.routed} ammo=${u.ammoLeft} near=${near(u)}`).join(' | '));
    const cnt = {}; liveA.forEach(u => { const k = u.bu.kategoria + (near(u) <= 1 ? '/adj' : '/far'); cnt[k] = (cnt[k] || 0) + 1; });
    console.log('DIAG atk:', JSON.stringify(cnt), 'sample far:', liveA.filter(u => near(u) > 1).slice(0, 6).map(u => `${u.bu.kategoria}@${u.q},${u.r} near=${near(u)} range=${u.range} ammo=${u.ammoLeft}`).join(' | '));
  }
  // Rozstrzygniecie: jedna strona zredukowana do <= 5% stanu poczatkowego (resztki to lucznicy bez amunicji
  // uciekajacy na brzeg pola -- zachowanie istniejacej logiki kitingu, nie skutek limitu; patrz raport).
  const decisive = Math.min(aliveA, aliveD) <= Math.ceil(simN * 0.05);
  ok(decisive, `bitwa ${simN}v${simN} rozstrzygnieta w <= ${maxTurns} tur (tur: ${turns}, zywi atk ${aliveA} / def ${aliveD})`);
  ok([...scene.atk, ...scene.def].every(u => Number.isFinite(u.q) && Number.isFinite(u.r) && Number.isFinite(u.bu.hp)), 'brak NaN w pozycjach/HP po symulacji');
  ok(stats.attacks > 0 && stats.kills > 0, `walka zaszla (ruchy ${stats.moves}, ataki ${stats.attacks}, zabici ${stats.kills})`);
  const sorted = [...turnMs].sort((a, b) => a - b);
  const p = q => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  const meanMs = turnMs.reduce((a, b) => a + b, 0) / turnMs.length;
  console.log(`PERF logika tury 500v500 (1000 jedn., bez renderu): tur=${turns} srednia=${meanMs.toFixed(1)} ms p95=${p(0.95).toFixed(1)} ms max=${sorted[sorted.length - 1].toFixed(1)} ms; rozstawienie plains=${results.plains.placeMs} ms obstacles=${results.obstacles.placeMs} ms`);
  // Prog = ochrona przed regresja zlozonosci (przed optymalizacja sama tura 0 miala ~81 s), nie budzet FPS; luzny, bo zalezy od obciazenia maszyny.
  ok(meanMs < 5000, `srednia czasu tury logiki < 5000 ms (jest ${meanMs.toFixed(1)} ms)`);

  console.log(`PASS ${pass} asercji`);
}

main().catch(e => { console.error('FAIL:', (e && e.stack) || e); process.exit(1); });
