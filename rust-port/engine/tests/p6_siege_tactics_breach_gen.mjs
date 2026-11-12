// P6 SIEGE-TAKTYKA K4 (r2): generator wektorow automatu wylomu WYKONUJACY tekst pinu (pin 07d2fbd72).
// Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_breach_gen.mjs (Node 22)
// Wynik -> p6_siege_tactics_breach_vectors/vectors.json. Ziarno PRNG 217 (mulberry32).
//
// Zasada: kazdy fragment to dokladny, zbalansowany skladniowo zakres linii pinu (1-based, wlacznie),
// wykonany przez `new Function(...params, tekst)` z `this` = stan sceny (stub). Nic nie jest przepisywane recznie.
// Poza wykonaniem zostaja wylacznie:
//   * parametry wejsciowe, ktore web wylicza w liniach spoza fragmentu (np. dmg = _siegeStructureDamage, :7314;
//     wallRow/side z wywolujacego), podawane z wektora;
//   * stuby efektow (_updateSiegeHud, _spawnWallLabel, _schedule = natychmiastowe wywolanie callbacka po 700 ms),
//     ktorych wynik nie wplywa na pola WallState;
//   * stale BF_COLS / BTerrain (uzywane tylko do indeksu kafla terenu, ktorego Rust nie modeluje).
// Straznik: SHA-256 zlaczonych fragmentow pinu. Zmiana pinu -> blad zamiast cichych wektorow.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const FILES = {
  scene: 'gra/src/battle/battleScene.ts',
  city: 'gra/src/game/city-fortification.ts',
};
// Fragmenty: zakresy linii pinu. Kazdy zakres jest zbalansowany (parsuje sie samodzielnie).
const FRAGMENTS = {
  // _skipInstantFallback :3715-3722 (guard :3716 pominiety: wywolujacy)
  skipInstantFallback: { file: 'scene', ranges: [[3720, 3722]], params: ['isSiegeUnit'] },
  // _attackWallTile guard :7541
  attackWallGuard: { file: 'scene', ranges: [[7541, 7541]], params: ['done'] },
  // callback _attackWallTile (w _schedule(700)) :7556-7564
  attackWallCallback: { file: 'scene', ranges: [[7556, 7564]], params: ['wallRow', 'dmg'] },
  // _breachWallTile body :7639-7647
  breachWallTile: { file: 'scene', ranges: [[7639, 7647]], params: ['wallRow', 'BF_COLS', 'BTerrain'] },
  // _attackGate: guard :7311 + obrazenia :7327-7332
  attackGate: { file: 'scene', ranges: [[7311, 7311], [7327, 7332]], params: ['dmg', 'done'] },
  // _breachGate body :7758-7759
  breachGate: { file: 'scene', ranges: [[7758, 7759]], params: [] },
  // _trySiegeTowerClimb: ru.onWallWalkway = true :8071 + blok wejscia na mur :8072-8075
  towerClimbEnterWall: { file: 'scene', ranges: [[8071, 8075]], params: ['ru', 'attackerWallEntryIsBreach'] },
  // _siegeApproachRestricted body :7952-7959
  approachRestricted: { file: 'scene', ranges: [[7952, 7959]], params: ['ru', 'isSiegeUnit', 'canShoot'] },
  // _checkEnd: repels :10184-10187 (zwraca aliveA)
  repelsAttack: { file: 'scene', ranges: [[10184, 10187]], params: ['isSiege', 'aliveA'], ret: 'return aliveA;' },
  // _checkEnd: rozstrzygniecie :10208 (return false gdy obie zyja) + :10213-10220
  winner: { file: 'scene', ranges: [[10208, 10208], [10213, 10220]], params: ['aliveA', 'aliveD'], prefix: 'let winner;', ret: 'return winner;' },
  // attackerWallEntryIsBreach (city-fortification.ts:97)
  cityWallEntry: { file: 'city', ranges: [[97, 97]], params: ['side', 'onWallWalkway'] },
};
const FRAGMENT_SHA256 = '17ba1ab668a06679155a8b5c1b88afdbeace955db0a9f400b8db6e44db01e042';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const sources = Object.fromEntries(
  Object.entries(FILES).map(([key, path]) => [
    key,
    execFileSync('git', ['show', `${PIN}:${path}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n'),
  ]),
);
const pinRange = (file, a, b) => sources[file].slice(a - 1, b).join('\n');

const fragmentTexts = Object.fromEntries(
  Object.entries(FRAGMENTS).map(([name, f]) => [
    name,
    [f.prefix ?? '', ...f.ranges.map(([a, b]) => pinRange(f.file, a, b)), f.ret ?? ''].join('\n'),
  ]),
);
const fragmentDigest = createHash('sha256')
  .update(Object.keys(FRAGMENTS).map((name) => `${name}\n${fragmentTexts[name]}`).join('\n---\n'))
  .digest('hex');
if (FRAGMENT_SHA256 !== '__SET_AFTER_FIRST_RUN__' && fragmentDigest !== FRAGMENT_SHA256) {
  throw new Error(`fragmenty pinu nie zgadzaja sie z hashem: ${fragmentDigest}`);
}

const F = Object.fromEntries(
  Object.entries(FRAGMENTS).map(([name, f]) => [name, new Function(...f.params, fragmentTexts[name])]),
);

// --- stala stubow (nie wplywaja na WallState) ---
const BF_COLS = 20;
const BTerrain = { Plains: 'PLAINS' };

// --- scena: `this` dla wykonywanych fragmentow ---
function newScene(s) {
  const scene = {
    siegeWallCol: s.wallCol,
    siegeGateCol: s.gateCol,
    gateHp: s.gateHp,
    gateOpen: s.gateOpen,
    wallTileHp: new Map(s.wallTileHp),
    siegeWallTilesInit: s.wallTilesInit,
    towerAtWallRows: new Set(s.towers),
    wallEverBreached: s.ever,
    atk: [],
    def: [],
    terrainMap: { tiles: s.terrainPresent ? new Array(BF_COLS * 8).fill('X') : null },
    log: [],
    finished: false,
    lastAttackedWallRow: null,
    _updateSiegeHud() {},
    _spawnWallLabel() {},
    _schedule(_ms, cb) {
      cb();
    },
    _breachWallTile(wallRow) {
      F.breachWallTile.call(this, wallRow, BF_COLS, BTerrain);
    },
    _breachGate() {
      F.breachGate.call(this);
    },
  };
  return scene;
}

function sceneOf(scene) {
  return {
    wallCol: scene.siegeWallCol,
    gateCol: scene.siegeGateCol,
    gateHp: scene.gateHp,
    gateOpen: scene.gateOpen,
    wallTileHp: scene.wallTileHp,
    wallTilesInit: scene.siegeWallTilesInit,
    towers: scene.towerAtWallRows,
    ever: scene.wallEverBreached,
  };
}

// --- wykonania pojedynczych zdarzen przez pin ---
function execAttackWall(scene, row, dmg) {
  let done = false;
  F.attackWallGuard.call(scene, () => {
    done = true;
  });
  if (!done) F.attackWallCallback.call(scene, row, dmg);
}
function execBreachWall(scene, row) {
  F.breachWallTile.call(scene, row, BF_COLS, BTerrain);
}
function execAttackGate(scene, dmg) {
  F.attackGate.call(scene, dmg, () => {});
}
function execClimb(scene, side) {
  const ru = { side, onWallWalkway: false };
  F.towerClimbEnterWall.call(scene, ru, F.cityWallEntry);
}
function execSkip(scene, hasSiege) {
  scene.atk = [{ dead: false, bu: { siege: hasSiege } }];
  F.skipInstantFallback.call(scene, (bu) => bu.siege);
}
// Jednostka `ru` w formie uzywanej przez pin: pola side/routed/onWallWalkway/primaryRanged/shootingEnabled/mounted
// oraz `bu` (dla isSiegeUnit(ru.bu)). Flaga canShoot(ru) jest podawana osobno (canShootFlag).
function mkUnit(u) {
  return {
    side: u.side,
    routed: u.routed,
    onWallWalkway: u.onWallWalkway,
    bu: { siege: u.siege },
    primaryRanged: u.primaryRanged,
    canShootFlag: u.canShoot,
    shootingEnabled: u.shootingEnabled,
    mounted: u.mounted,
  };
}
function execApproach(scene, u) {
  return F.approachRestricted.call(
    scene,
    mkUnit(u),
    (bu) => bu.siege,
    (ru) => ru.canShootFlag,
  );
}
function execRepels(scene, isSiege, aliveA) {
  return F.repelsAttack.call(scene, isSiege, aliveA);
}
function execWinner(scene, aliveA, aliveD, hpA, hpD) {
  scene.atk = hpA.map((hp) => ({ bu: { hp } }));
  scene.def = hpD.map((hp) => ({ bu: { hp } }));
  const r = F.winner.call(scene, aliveA, aliveD);
  return r === false ? null : r; // false = bitwa trwa (obie strony zyja)
}

// --- PRNG ---
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(217);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

// --- serializacja (NaN/Infinity jako tekst, bo JSON ich nie ma) ---
const enc = (x) => {
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  return x;
};
const DMGS = [0, 1, 5, 14, 16, 3.5, -3, 400, Infinity, -Infinity, NaN];
const HPS = [1, 7, 14, 90, 400, 0, -2, 0.5];
const FINITE_HPS = [1, 7, 14, 90, 400, 0, -2, 0.5, 12];

function randomState() {
  const wallCol = pick([-1, 3, 5, 9]);
  const gateCol = pick([-1, wallCol, 4]);
  const init = int(0, 6);
  const rows = new Map();
  for (let r = 0; r < init; r++) {
    if (rnd() < 0.8) rows.set(r, pick(HPS));
  }
  const towers = new Set();
  for (let r = 0; r < 6; r++) if (rnd() < 0.2) towers.add(r);
  return {
    wallCol,
    gateCol,
    gateHp: pick([400, 150, 14, 0]),
    gateOpen: rnd() < 0.2,
    wallTileHp: rows,
    wallTilesInit: init,
    towers,
    ever: rnd() < 0.3,
    terrainPresent: rnd() < 0.85,
  };
}
function inState(s) {
  const hp = {};
  for (const [k, v] of [...s.wallTileHp.entries()].sort((a, b) => a[0] - b[0])) hp[k] = enc(v);
  return {
    wallCol: s.wallCol,
    gateCol: s.gateCol,
    gateHp: enc(s.gateHp),
    gateOpen: s.gateOpen,
    wallTileHp: hp,
    wallTilesInit: s.wallTilesInit,
    towerRows: [...s.towers].sort((a, b) => a - b),
    wallEverBreached: s.ever,
  };
}
function outState(scene) {
  const o = sceneOf(scene);
  return inState({ ...o, wallTileHp: o.wallTileHp, towers: o.towers, ever: o.ever, terrainPresent: false });
}
function sceneFromInput(s) {
  return newScene(s);
}

// --- wektory: pojedyncze zdarzenia (kazdy wykonany przez pin) ---
const vAttackWall = [];
for (let i = 0; i < 200; i++) {
  const s = randomState();
  const row = int(0, 5);
  const dmg = pick(DMGS);
  const inp = inState(s);
  const scene = sceneFromInput(s);
  execAttackWall(scene, row, dmg);
  vAttackWall.push({ input: inp, row, dmg: enc(dmg), terrainTilesPresent: s.terrainPresent, expect: outState(scene) });
}

const vBreachWall = [];
for (let i = 0; i < 120; i++) {
  const s = randomState();
  const row = int(0, 5);
  const inp = inState(s);
  const scene = sceneFromInput(s);
  execBreachWall(scene, row);
  vBreachWall.push({ input: inp, row, terrainTilesPresent: s.terrainPresent, expect: outState(scene) });
}

const vAttackGate = [];
for (let i = 0; i < 160; i++) {
  const s = randomState();
  const dmg = pick(DMGS);
  const inp = inState(s);
  const scene = sceneFromInput(s);
  execAttackGate(scene, dmg);
  vAttackGate.push({ input: inp, dmg: enc(dmg), expect: outState(scene) });
}

const vTowerClimb = [];
for (const sideAtk of [true, false]) {
  for (let i = 0; i < 40; i++) {
    const s = randomState();
    const inp = inState(s);
    const scene = sceneFromInput(s);
    execClimb(scene, sideAtk ? 'atk' : 'def');
    vTowerClimb.push({ input: inp, sideAtk, expect: outState(scene) });
  }
}

const vSkip = [];
for (const hasSiege of [true, false]) {
  for (let i = 0; i < 40; i++) {
    const s = randomState();
    const inp = inState(s);
    const scene = sceneFromInput(s);
    execSkip(scene, hasSiege);
    vSkip.push({ input: inp, atkHasAliveSiegeUnit: hasSiege, expect: outState(scene) });
  }
}

// --- podejscie (galezie a-e _siegeApproachRestricted), z isSiege/isSiegeUnit/strzelec/wierzchowiec ---
const vApproach = [];
for (let i = 0; i < 300; i++) {
  const s = randomState();
  const unit = {
    side: pick(['atk', 'atk', 'def']),
    routed: rnd() < 0.15,
    onWallWalkway: rnd() < 0.2,
    siege: rnd() < 0.2,
    primaryRanged: rnd() < 0.3,
    canShoot: rnd() < 0.6,
    shootingEnabled: pick([true, false, undefined]),
    mounted: rnd() < 0.5,
  };
  const inp = inState(s);
  const scene = sceneFromInput(s);
  const got = execApproach(scene, unit);
  vApproach.push({
    input: inp,
    unit: {
      side: unit.side,
      routed: unit.routed,
      onWallWalkway: unit.onWallWalkway,
      siege: unit.siege,
      primaryRanged: unit.primaryRanged,
      canShoot: unit.canShoot,
      shootingEnabled: unit.shootingEnabled === undefined ? null : unit.shootingEnabled,
      mounted: unit.mounted,
    },
    expect: got,
  });
}

// --- repels (_checkEnd :10184-10187) ---
const vRepels = [];
for (let i = 0; i < 120; i++) {
  const isSiege = rnd() < 0.5;
  const ever = rnd() < 0.4;
  const aliveA = rnd() < 0.8;
  const scene = newScene({ ...randomState(), ever });
  const got = execRepels(scene, isSiege, aliveA);
  vRepels.push({ isSiege, wallEverBreached: ever, aliveA, expect: got });
}

// --- rozstrzygniecie (_checkEnd :10208, :10213-10220) ---
const vWinner = [];
for (let i = 0; i < 120; i++) {
  const aliveA = rnd() < 0.6;
  const aliveD = rnd() < 0.6;
  const hpA = [pick(FINITE_HPS), pick(FINITE_HPS)];
  const hpD = [pick(FINITE_HPS), pick(FINITE_HPS)];
  const scene = newScene(randomState());
  const got = execWinner(scene, aliveA, aliveD, hpA, hpD);
  vWinner.push({ aliveA, aliveD, hpA: hpA.map(enc), hpD: hpD.map(enc), expect: got });
}

// --- sekwencje zdarzen: stan prowadzony wylacznie przez wykonane fragmenty pinu ---
const sequences = [];
for (let i = 0; i < 90; i++) {
  const s = randomState();
  s.wallCol = pick([3, 5]);
  const init = { ...inState(s), terrainTilesPresent: s.terrainPresent };
  const scene = sceneFromInput(s);
  const steps = [];
  const n = int(6, 10);
  for (let k = 0; k < n; k++) {
    const kind = pick(['attackWall', 'attackWall', 'attackGate', 'climb', 'skip', 'breachWall']);
    if (kind === 'attackWall') {
      const row = int(0, 5);
      const dmg = pick(DMGS);
      execAttackWall(scene, row, dmg);
      steps.push({ kind, row, dmg: enc(dmg) });
    } else if (kind === 'breachWall') {
      const row = int(0, 5);
      execBreachWall(scene, row);
      steps.push({ kind, row });
    } else if (kind === 'attackGate') {
      const dmg = pick(DMGS);
      execAttackGate(scene, dmg);
      steps.push({ kind, dmg: enc(dmg) });
    } else if (kind === 'climb') {
      const sideAtk = rnd() < 0.8;
      execClimb(scene, sideAtk ? 'atk' : 'def');
      steps.push({ kind, sideAtk });
    } else {
      const hasSiege = rnd() < 0.5;
      execSkip(scene, hasSiege);
      steps.push({ kind, atkHasAliveSiegeUnit: hasSiege });
    }
    const mountedUnit = { side: 'atk', routed: false, onWallWalkway: false, siege: false, primaryRanged: false, canShoot: false, shootingEnabled: undefined, mounted: true };
    const footUnit = { ...mountedUnit, mounted: false };
    const aliveAAfterRepels = execRepels(scene, true, true);
    steps[steps.length - 1].expect = {
      wallEverBreached: scene.wallEverBreached,
      gateOpen: scene.gateOpen,
      wallTileRows: [...scene.wallTileHp.keys()].sort((a, b) => a - b),
      approachMounted: execApproach(scene, mountedUnit),
      approachFoot: execApproach(scene, footUnit),
      repels: aliveAAfterRepels === false,
      winnerIfStalled: execWinner(scene, aliveAAfterRepels, true, [10], [10]),
    };
  }
  sequences.push({ init, steps });
}

const vectors = {
  source: `gra/src/battle/battleScene.ts + gra/src/game/city-fortification.ts @ ${PIN}`,
  generator: 'rust-port/engine/tests/p6_siege_tactics_breach_gen.mjs (seed 217, mulberry32; wykonanie fragmentow pinu)',
  fragments: Object.fromEntries(
    Object.entries(FRAGMENTS).map(([name, f]) => [name, f.ranges.map(([a, b]) => `${FILES[f.file]}:${a}-${b}`)]),
  ),
  fragmentSha256: fragmentDigest,
  attackWallTile: vAttackWall,
  breachWallTile: vBreachWall,
  attackGate: vAttackGate,
  towerClimbEnterWall: vTowerClimb,
  skipInstantFallback: vSkip,
  approachRestricted: vApproach,
  repelsAttack: vRepels,
  winner: vWinner,
  sequences,
};

const outDir = join(here, 'p6_siege_tactics_breach_vectors');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(vectors, null, 1) + '\n');
const singles = vAttackWall.length + vBreachWall.length + vAttackGate.length + vTowerClimb.length + vSkip.length + vApproach.length + vRepels.length + vWinner.length;
const steps = sequences.reduce((acc, q) => acc + q.steps.length, 0);
console.log(`fragmentSha256=${fragmentDigest}`);
console.log(`przypadki pojedyncze=${singles} sekwencje=${sequences.length} kroki=${steps}`);
