// P6 SIEGE-TAKTYKA K4: generator wektorow automatu wylomu z kodu weba (pin 07d2fbd72, gra/src/battle/battleScene.ts).
// Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_breach_gen.mjs
// Wynik -> p6_siege_tactics_breach_vectors/vectors.json. Ziarno PRNG 217 (mulberry32).
//
// Wyciete fragmenty (wycieta logika, bez typow TS i bez `this.`, bez efektow sceny):
//   3718-3721  _skipInstantFallback: wylom przy machinie w skladzie atakujacego
//   7311       _attackGate: guard gateOpen || siegeGateCol < 0
//   7327-7329  _attackGate: gateHp = max(0, gateHp - dmg); przy <= 0 -> _breachGate
//   7555-7564  callback _attackWallTile: newHp = max(0, (wallTileHp.get ?? 0) - dmg); przy <= 0 -> _breachWallTile
//   7638-7647  _breachWallTile: if (!tiles) return; wallTileHp.delete; wallEverBreached = true
//   7757-7759  _breachGate: gateOpen = true; wallEverBreached = true
//   8072-8073  _trySiegeTowerClimb: attackerWallEntryIsBreach(side, true) && !wallEverBreached -> wallEverBreached = true
// Straznik: SHA-256 zlaczonych fragmentow pinu (ponizej). Zmiana pinu lub przepisania -> blad zamiast cichych wektorow.
// Efekty sceny (animacje, log, _schedule, HUD, mutacje terenu, zdejmowanie jednostek) sa POZA zakresem.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_PATH = 'gra/src/battle/battleScene.ts';
const RANGES = [[3718, 3721], [7311, 7311], [7327, 7329], [7555, 7564], [7638, 7647], [7757, 7759], [8072, 8073]];
const FRAGMENT_SHA256 = '26147b15898739412ca1f20fbf79e15dc867771ac9562f408674f77a39adee63';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const pinLines = execFileSync('git', ['show', `${PIN}:${PIN_PATH}`], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\n');
const pinRange = (a, b) => pinLines.slice(a - 1, b).join('\n');
const fragmentDigest = createHash('sha256')
  .update(RANGES.map(([a, b]) => pinRange(a, b)).join('\n---\n'))
  .digest('hex');
if (fragmentDigest !== FRAGMENT_SHA256) {
  throw new Error(`fragmenty pinu nie zgadzaja sie z hashem: ${fragmentDigest}`);
}

// --- wycieta z battleScene.ts:3718-3721 ---
function skipInstantFallback(s, atkHasAliveSiegeUnit) {
  // if (this.siegeWallCol >= 0 && this.atk.some(u => !u.dead && isSiegeUnit(u.bu))) { this.wallEverBreached = true; }
  if (s.wallCol >= 0 && atkHasAliveSiegeUnit) s.ever = true;
}

// --- wycieta z battleScene.ts:7311 oraz 7327-7329 (_attackGate) ---
function attackGate(s, dmg) {
  // if (this.gateOpen || this.siegeGateCol < 0) { done(); return; }
  if (s.gateOpen || s.gateCol < 0) return;
  // this.gateHp = Math.max(0, this.gateHp - dmg);
  s.gateHp = jsMax0(s.gateHp - dmg);
  // if (this.gateHp <= 0) this._breachGate();
  if (s.gateHp <= 0) breachGate(s);
}

// --- wycieta z battleScene.ts:7555-7564 (callback _attackWallTile) ---
function attackWallTile(s, row, dmg, terrain) {
  // const curHp = this.wallTileHp.get(wallRow) ?? 0;
  const cur = s.wallTileHp.has(row) ? s.wallTileHp.get(row) : 0;
  // const newHp = Math.max(0, curHp - dmg);
  const newHp = jsMax0(cur - dmg);
  // this.wallTileHp.set(wallRow, newHp);
  s.wallTileHp.set(row, newHp);
  // if (newHp <= 0) this._breachWallTile(wallRow);
  if (newHp <= 0) breachWallTile(s, row, terrain);
}

// --- wycieta z battleScene.ts:7638-7647 (_breachWallTile) ---
function breachWallTile(s, row, terrain) {
  // const tiles = this.terrainMap.tiles; if (!tiles) return;
  if (!terrain) return;
  // this.wallTileHp.delete(wallRow);
  s.wallTileHp.delete(row);
  // this.wallEverBreached = true;
  s.ever = true;
}

// --- wycieta z battleScene.ts:7757-7759 (_breachGate) ---
function breachGate(s) {
  s.gateOpen = true;
  s.ever = true;
}

// --- wycieta z battleScene.ts:8072-8073 (wejscie na mur po wiezy; onWallWalkway = true) ---
function towerClimbEnterWall(s, sideAtk) {
  // if (attackerWallEntryIsBreach(ru.side, ru.onWallWalkway) && !this.wallEverBreached) this.wallEverBreached = true;
  // attackerWallEntryIsBreach(side, w) = side === 'atk' && w === true (city-fortification.ts:96-98)
  if (sideAtk && true && !s.ever) s.ever = true;
}

// JS Math.max(0, x): NaN zostaje NaN.
function jsMax0(x) {
  return Number.isNaN(x) ? NaN : Math.max(0, x);
}

// Pochodne predykaty z battleScene.ts:7951-7959 (galezie d, e) i 10184-10186 (repels).
function tileBreached(s) {
  return s.wallTilesInit > 0 && s.wallTileHp.size < s.wallTilesInit;
}
function approachMounted(s) {
  // (d) ru.mounted: !(gateOpen || tileBreached)
  return !(s.gateOpen || tileBreached(s));
}
function approachFoot(s) {
  // (e) piechota: !(wallEverBreached || towerAtWallRows.size > 0)
  return !(s.ever || s.towers.size > 0);
}
function repelsAttack(isSiege, ever) {
  // if (isSiege && !this.wallEverBreached) aliveA = false (10184-10186)
  return isSiege && !ever;
}
function winnerIfStalled(aliveA) {
  // battle_winner(aliveA, true, ...) -> defender gdy aliveA == false (10208-10220, obie strony zyja -> null)
  return aliveA ? null : 'obronca';
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
  };
}
function cloneState(s) {
  return { ...s, wallTileHp: new Map(s.wallTileHp), towers: new Set(s.towers) };
}
function outState(s) {
  const hp = {};
  for (const [k, v] of [...s.wallTileHp.entries()].sort((a, b) => a[0] - b[0])) hp[k] = enc(v);
  return {
    gateHp: enc(s.gateHp),
    gateOpen: s.gateOpen,
    wallTileHp: hp,
    wallEverBreached: s.ever,
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

// --- wektory: pojedyncze zdarzenia ---
const vAttackWall = [];
for (let i = 0; i < 200; i++) {
  const s = randomState();
  s.wallCol = pick([3, 5]); // atak na mur wymaga siegeWallCol >= 0 (guard w wywolujacym, 7541)
  const row = int(0, 5);
  const dmg = pick(DMGS);
  const terrain = rnd() < 0.85;
  const inp = inState(s);
  const out = cloneState(s);
  attackWallTile(out, row, dmg, terrain);
  vAttackWall.push({ input: inp, row, dmg: enc(dmg), terrainTilesPresent: terrain, expect: outState(out) });
}

const vBreachWall = [];
for (let i = 0; i < 120; i++) {
  const s = randomState();
  const row = int(0, 5);
  const terrain = rnd() < 0.85;
  const inp = inState(s);
  const out = cloneState(s);
  breachWallTile(out, row, terrain);
  vBreachWall.push({ input: inp, row, terrainTilesPresent: terrain, expect: outState(out) });
}

const vAttackGate = [];
for (let i = 0; i < 160; i++) {
  const s = randomState();
  const dmg = pick(DMGS);
  const inp = inState(s);
  const out = cloneState(s);
  attackGate(out, dmg);
  vAttackGate.push({ input: inp, dmg: enc(dmg), expect: outState(out) });
}

const vTowerClimb = [];
for (const sideAtk of [true, false]) {
  for (let i = 0; i < 40; i++) {
    const s = randomState();
    const inp = inState(s);
    const out = cloneState(s);
    towerClimbEnterWall(out, sideAtk);
    vTowerClimb.push({ input: inp, sideAtk, expect: outState(out) });
  }
}

const vSkip = [];
for (const hasSiege of [true, false]) {
  for (let i = 0; i < 40; i++) {
    const s = randomState();
    const inp = inState(s);
    const out = cloneState(s);
    skipInstantFallback(out, hasSiege);
    vSkip.push({ input: inp, atkHasAliveSiegeUnit: hasSiege, expect: outState(out) });
  }
}

// --- sekwencje zdarzen z kompozycja (zasilenie approach/repels/winner) ---
const sequences = [];
for (let i = 0; i < 90; i++) {
  const s = randomState();
  s.wallCol = pick([3, 5]);
  const init = inState(s);
  const steps = [];
  const n = int(6, 10);
  for (let k = 0; k < n; k++) {
    const kind = pick(['attackWall', 'attackWall', 'attackGate', 'climb', 'skip', 'breachWall']);
    if (kind === 'attackWall') {
      const row = int(0, 5);
      const dmg = pick(DMGS);
      const terrain = rnd() < 0.9;
      attackWallTile(s, row, dmg, terrain);
      steps.push({ kind, row, dmg: enc(dmg), terrainTilesPresent: terrain });
    } else if (kind === 'breachWall') {
      const row = int(0, 5);
      const terrain = rnd() < 0.9;
      breachWallTile(s, row, terrain);
      steps.push({ kind, row, terrainTilesPresent: terrain });
    } else if (kind === 'attackGate') {
      const dmg = pick(DMGS);
      attackGate(s, dmg);
      steps.push({ kind, dmg: enc(dmg) });
    } else if (kind === 'climb') {
      const sideAtk = rnd() < 0.8;
      towerClimbEnterWall(s, sideAtk);
      steps.push({ kind, sideAtk });
    } else {
      const hasSiege = rnd() < 0.5;
      skipInstantFallback(s, hasSiege);
      steps.push({ kind, atkHasAliveSiegeUnit: hasSiege });
    }
    const repels = repelsAttack(true, s.ever);
    steps[steps.length - 1].expect = {
      wallEverBreached: s.ever,
      gateOpen: s.gateOpen,
      tileBreached: tileBreached(s),
      approachMounted: approachMounted(s),
      approachFoot: approachFoot(s),
      repels,
      winnerIfStalled: winnerIfStalled(!repels),
      wallTileRows: [...s.wallTileHp.keys()].sort((a, b) => a - b),
    };
  }
  sequences.push({ init, steps });
}

const vectors = {
  source: `gra/src/battle/battleScene.ts @ ${PIN}, linie ${RANGES.map(([a, b]) => `${a}-${b}`).join(', ')}`,
  generator: 'rust-port/engine/tests/p6_siege_tactics_breach_gen.mjs (seed 217, mulberry32)',
  fragmentSha256: fragmentDigest,
  attackWallTile: vAttackWall,
  breachWallTile: vBreachWall,
  attackGate: vAttackGate,
  towerClimbEnterWall: vTowerClimb,
  skipInstantFallback: vSkip,
  sequences,
};

const outDir = join(here, 'p6_siege_tactics_breach_vectors');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(vectors, null, 1) + '\n');
const total = vAttackWall.length + vBreachWall.length + vAttackGate.length + vTowerClimb.length + vSkip.length + sequences.length;
console.log(`fragmentSha256=${fragmentDigest}`);
console.log(`przypadki pojedyncze=${vAttackWall.length + vBreachWall.length + vAttackGate.length + vTowerClimb.length + vSkip.length} sekwencje=${sequences.length} razem=${total}`);
