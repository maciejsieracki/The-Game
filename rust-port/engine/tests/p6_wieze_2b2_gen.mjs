// P6 WIEZE-2B2 r2: generator wektorow STRZALU wiezy (`_fireOneTower`, pin 07d2fbd72,
// gra/src/battle/battleScene.ts:4223-4262) przez WYKONANIE wyciętego tekstu pinu (transpilacja TS w node).
// Uruchomienie: node rust-port/engine/tests/p6_wieze_2b2_gen.mjs (Node >= 22.13, module.stripTypeScriptTypes).
//
// Wycinane z pinu (zakres od nazwy do pierwszej linii '  }' o wcieciu 2 spacje; pickTowerTarget z city-towers.ts
// od 'export function pickTowerTarget(' do pierwszej linii '}'):
//   _fireOneTower (battleScene.ts:4223), pickTowerTarget (gra/src/game/city-towers.ts:141).
// Stuby (poza zakresem wektora): THREE (Vector3/Quaternion z zapisem wywolan), makeProjectileMesh, cellToWorld,
//   tileTopY, _sfxShot, _spawnDamageLabel, projectiles/scene/log (zapis pushow), _now.
// Zachowanie zapisywane do wektora:
//   * `_schedule(ms, cb)`: kolejka (ms, cb); po `_fireOneTower` uruchamiana w kolejnosci ms (jak zegar).
//   * `_singleBlow(shooter, target, ranged)`: REJESTRUJE argumenty (statystyki strzelca `shooter.bu.stats`,
//     kategoria, hp, indeks celu w `this.atk`, `ranged`), zwraca 0 (wynik liczbowy ciosu NIE jest tu wektorem).
// Straznik zrodla: SHA-256 wyciętych fragmentow (FRAGMENT_SHA256). Zmiana pinu -> blad generatora.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_BATTLE = 'gra/src/battle/battleScene.ts';
const PIN_CITY = 'gra/src/game/city-towers.ts';
const SEED = 0x2b2;
const CASE_COUNT = 240;
const FRAGMENT_SHA256 = 'beeb83309a34288136bf81398bee43c33735587db446e5ef9476abd855d20bfa';
const RANGED_FLY_MS = 380; // pin battleScene.ts:1012

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const show = (p) => execFileSync('git', ['show', `${PIN}:${p}`], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\n');

const battleLines = show(PIN_BATTLE);
const cityLines = show(PIN_CITY);

function expectLine(lines, n, re) {
  if (!re.test(lines[n - 1])) throw new Error(`pin ${n}: oczekiwano ${re}, jest: ${lines[n - 1]}`);
}
function sliceMethod(lines, re) {
  const hits = [];
  for (let n = 1; n <= lines.length; n++) if (re.test(lines[n - 1])) hits.push(n);
  if (hits.length !== 1) throw new Error(`pin: ${re} trafien ${hits.length}`);
  const start = hits[0];
  for (let n = start + 1; n <= lines.length; n++) {
    if (lines[n - 1] === '  }') return lines.slice(start - 1, n).join('\n');
  }
  throw new Error(`brak konca metody od linii ${start}`);
}
function sliceTopFunction(lines, re) {
  const hits = [];
  for (let n = 1; n <= lines.length; n++) if (re.test(lines[n - 1])) hits.push(n);
  if (hits.length !== 1) throw new Error(`pin: ${re} trafien ${hits.length}`);
  const start = hits[0];
  for (let n = start + 1; n <= lines.length; n++) {
    if (lines[n - 1] === '}') return lines.slice(start - 1, n).join('\n');
  }
  throw new Error(`brak konca funkcji od linii ${start}`);
}

expectLine(battleLines, 4223, /^  private _fireOneTower\($/);
expectLine(cityLines, 141, /^export function pickTowerTarget\($/);
const fireText = sliceMethod(battleLines, /^  private _fireOneTower\($/);
const pickText = sliceTopFunction(cityLines, /^export function pickTowerTarget\($/);

const fragmentDigest = createHash('sha256').update(`${fireText}\n---\n${pickText}`).digest('hex');
if (FRAGMENT_SHA256 !== 'PLACEHOLDER' && fragmentDigest !== FRAGMENT_SHA256) {
  throw new Error(`fragmenty pinu nie zgadzaja sie z hashem: ${fragmentDigest}`);
}
console.error('fragment sha256', fragmentDigest);

// Klasa-harness: tekst pinu transpilowany z TS; zmienne globalne pinu podawane jako parametry fabryki.
const classSrc = `${stripTypeScriptTypes(
  `${pickText.replace(/^export function/, 'function')}\n` +
    `class Harness {\n${fireText}\n}\n`,
)}\nreturn Harness;`;
const makeHarness = new Function(
  'THREE', 'cellToWorld', 'TILE_S', 'tileTopY', 'makeProjectileMesh', 'projectileKind', 'RANGED_FLY_MS', 'Dir',
  classSrc,
);

class Vec3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  subVectors(a, b) { this.x = a.x - b.x; this.y = a.y - b.y; this.z = a.z - b.z; return this; }
  normalize() { return this; }
  lengthSq() { return this.x * this.x + this.y * this.y + this.z * this.z; }
}
class Quat {
  setFromUnitVectors() { return this; }
  copy() { return this; }
}
const THREE = { Vector3: Vec3, Quaternion: Quat };
const Dir = { W: 2 };
const cellToWorld = (c, r) => ({ x: c * 10, z: r * 10 });
const TILE_S = 10;
const tileTopY = () => 0;
const makeProjectileMesh = () => ({ group: { position: new Vec3(), quaternion: new Quat() }, geos: [], mats: [] });
const projectileKind = () => 'arrow';
const Harness = makeHarness(THREE, cellToWorld, TILE_S, tileTopY, makeProjectileMesh, projectileKind, RANGED_FLY_MS, Dir);

// Deterministyczny PRNG (mulberry32).
let seedState = SEED >>> 0;
function rnd() {
  seedState = (seedState + 0x6d2b79f5) >>> 0;
  let t = seedState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rint = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const chance = (p) => rnd() < p;

function runCase(c) {
  const h = new Harness();
  const queue = [];
  const blows = [];
  const atk = c.atk.map((u, i) => ({
    id: `atk${i}`,
    q: u.q,
    r: u.r,
    bu: { hp: u.hp },
    dead: u.dead,
    fadingOut: u.fadingOut,
    routed: u.routed,
    removed: u.removed,
  }));
  Object.assign(h, {
    finished: c.finished,
    siegeWallCol: c.wallCol,
    atk,
    towerRange: c.towerRange,
    log: { push() {} },
    scene: { add() {} },
    projectiles: { push() {} },
    terrainMap: null,
    _sfxShot() {},
    _spawnDamageLabel() {},
    _now() { return 0; },
    _schedule(ms, cb) { queue.push({ ms, cb }); },
    _singleBlow(shooter, target, ranged) {
      blows.push({
        stats: shooter.bu.stats,
        kategoria: shooter.bu.kategoria,
        hp: shooter.bu.hp,
        targetAtkIdx: this.atk.indexOf(target),
        ranged,
      });
      return 0;
    },
  });
  const shooterRow = c.shooterRow;
  const t = { row: c.towerRow, mesh: null, destroyed: c.destroyed };
  // hp jak w pinie `_fireSiegeTowers` (battleScene.ts:4212): Number(Health ?? health ?? 1) || 1.
  const hp = Number(shooterRow['Health'] ?? shooterRow['health'] ?? 1) || 1;
  h._fireOneTower(t, shooterRow, shooterRow.Jednostka, hp);
  const delays = queue.map((x) => x.ms);
  queue.sort((a, b) => a.ms - b.ms).forEach((x) => x.cb());
  return { blows, delays };
}

// Cztery kształty wiersza strzelca (cyklicznie po przypadkach): Typ/Health/health obecne lub brakujące,
// Typ nie-Distance. Dzięki temu asercje kategorii/HP/Jednostka w Rust nie są stałą.
const shooterRows = [
  { Jednostka: 'Lucznik', Typ: 'Distance', Health: 10, missileAttack: 3 },
  { Jednostka: 'Procarz', Typ: 'Distance', health: 4, missileAttack: 2 },
  { Jednostka: 'Kusznik', Health: 0, missileAttack: 5 },
  { Jednostka: 'Oblezacz', Typ: 'Oblezanie', Health: null, health: 7, missileAttack: 4 },
];
const cases = [];
for (let i = 0; i < CASE_COUNT; i++) {
  const wallCol = rint(0, 9);
  const towerRow = rint(0, 8);
  const n = rint(0, 5);
  const shooterRow = shooterRows[i % shooterRows.length];
  const atk = [];
  for (let k = 0; k < n; k++) {
    atk.push({
      q: wallCol + rint(-3, 3),
      r: towerRow + rint(-3, 3),
      hp: rint(0, 10),
      dead: chance(0.15),
      fadingOut: chance(0.1),
      routed: chance(0.1),
      removed: chance(0.05),
    });
  }
  const c = {
    id: `TW-${String(i).padStart(3, '0')}`,
    wallCol,
    towerRow,
    towerRange: [2, 3, 4][rint(0, 2)],
    finished: chance(0.05),
    destroyed: chance(0.1),
    atk,
    shooterRow,
  };
  const { blows, delays } = runCase(c);
  if (blows.length > 1) throw new Error(`przypadek ${c.id}: wiecej niz jeden cios`);
  if (delays.length > 1) throw new Error(`przypadek ${c.id}: wiecej niz jedno zaplanowanie`);
  if (blows.length === 1 && delays[0] !== RANGED_FLY_MS) throw new Error(`przypadek ${c.id}: opoznienie ${delays[0]}`);
  c.expectTarget = blows.length === 1 ? blows[0].targetAtkIdx : -1;
  c.expectShot = blows.length;
  c.expectDelayMs = delays.length === 1 ? delays[0] : null;
  c.expectStats = blows.length === 1 ? { Jednostka: blows[0].stats.Jednostka, Typ: blows[0].stats.Typ } : null;
  c.expectKategoria = blows.length === 1 ? blows[0].kategoria : null;
  c.expectHp = blows.length === 1 ? blows[0].hp : null;
  c.expectRanged = blows.length === 1 ? blows[0].ranged : null;
  cases.push(c);
}

const counts = {
  total: cases.length,
  shot: cases.filter((c) => c.expectShot === 1).length,
  noShotDestroyed: cases.filter((c) => c.destroyed).length,
  noShotFinished: cases.filter((c) => c.finished && !c.destroyed).length,
  noTargetLive: cases.filter((c) => !c.finished && !c.destroyed && c.expectShot === 0).length,
  deadOrFadeSkipped: cases.filter((c) => !c.finished && !c.destroyed && c.atk.some((u) => u.dead || u.fadingOut) && c.expectShot === 0).length,
};
const out = {
  meta: {
    pin: PIN,
    files: [PIN_BATTLE, PIN_CITY],
    fragments: ['_fireOneTower battleScene.ts:4223', 'pickTowerTarget city-towers.ts:141'],
    fragmentSha256: fragmentDigest,
    seed: `0x${SEED.toString(16)}`,
    rangedFlyMs: RANGED_FLY_MS,
    stub: 'Harness: _schedule kolejka, _singleBlow rejestruje argumenty (wynik 0), THREE/mesh stuby',
    counts,
  },
  cases,
};
const outDir = join(here, 'p6_wieze_2b2_vectors');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors.json'), `${JSON.stringify(out, null, 1)}\n`);
console.error('counts', JSON.stringify(counts));
