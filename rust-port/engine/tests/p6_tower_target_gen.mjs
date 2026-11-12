// P6 TOWER-TARGET (R-RUSTPORT-P6-TOWER-TARGET-Q1, runda 1 Operatora): generator wektorow WYKONUJACY TEKST PINU
// (pin 07d2fbd72) dla `pickTowerTarget` (gra/src/game/city-towers.ts) oraz kolejnosci ognia wiez
// (`_fireSiegeTowers` / `_destroyTowerAtRow` w gra/src/battle/battleScene.ts).
//
// Uruchomienie (z korzenia repo; katalog roboczy na pliki modulu poza repo):
//   TOWER_TARGET_SCRATCH=<katalog poza repo> node rust-port/engine/tests/p6_tower_target_gen.mjs
//
// WYKONYWANE SA DOSLOWNE LINIE z pinu (przez `git show`, bez checkoutu). Straznik: SHA-256 wycietych fragmentow musi
// zgadzac sie z FRAGMENT_SHA256. Jedyne przeksztalcenia: usuniecie typow TS (`module.stripTypeScriptTypes`, Node >= 22.13),
// zamiana `private` na nic w metodach klasy. Nie ma recznej kopii logiki.
//
// ATRAPY (jawne, nie z pinu): `_schedule` (zapis zdarzenia + kolejka callbackow, wykonywana w kolejnosci rosnacego
// `ms`, stabilnie jak timer), `_fireOneTower` (zapis zdarzenia), `this.log` (tablica), `towerShooterRow` (wejscie).
// Kolejnosc ognia jest MIERZONA (nie porownywana z Rust): meta.fireOrder.

import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const BS_PATH = 'gra/src/battle/battleScene.ts';
const CT_PATH = 'gra/src/game/city-towers.ts';
// Hash fragmentow pinu (wyliczany przez PRINT_HASH=1). Zmiana pinu -> blad straznika.
const FRAGMENT_SHA256 = '1321c316517057e97159f84ce0688edf9837cd63a6507ca8d484d2b2637b3ffc';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const gitLines = (path) =>
  execFileSync('git', ['show', `${PIN}:${path}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\n');
const BS = gitLines(BS_PATH);
const CT = gitLines(CT_PATH);

// Blok od pierwszej linii pasujacej do `startRe` do pierwszej linii pasujacej do `closeRe` (wlacznie).
function block(lines, startRe, closeRe) {
  const s = lines.findIndex((l) => startRe.test(l));
  if (s < 0) throw new Error(`brak linii startowej ${startRe}`);
  for (let i = s; i < lines.length; i++) {
    if (i > s && closeRe.test(lines[i])) return lines.slice(s, i + 1);
  }
  throw new Error(`brak domkniecia bloku od ${startRe}`);
}
const METHOD_END = /^ {2}\}$/;
const TOP_END = /^\}$/;

const FR = {
  pick: block(CT, /^export function pickTowerTarget\(/, TOP_END),
  fire: block(BS, /^ {2}private _fireSiegeTowers\(\): void \{$/, METHOD_END),
  destroy: block(BS, /^ {2}private _destroyTowerAtRow\(wallRow: number\): void \{$/, METHOD_END),
};
const FRAGMENT_ORDER = ['pick', 'fire', 'destroy'];
const digest = createHash('sha256')
  .update(FRAGMENT_ORDER.map((k) => FR[k].join('\n')).join('\n---\n'))
  .digest('hex');
if (process.env.PRINT_HASH) console.log(`FRAGMENT_SHA256=${digest}`);
if (digest !== FRAGMENT_SHA256) {
  throw new Error(`fragmenty pinu nie zgadzaja sie z hashem: ${digest}`);
}

// Metody: `  private _x(` -> `  _x(`.
const asMethod = (l) => l.replace(/^ {2}private /, '  ');

const moduleSrc = stripTypeScriptTypes([
  ...FR.pick,
  'export class TowerScene {',
  'constructor() { this.ev = []; this.queue = []; this.log = []; }',
  ...[FR.fire, FR.destroy].flat().map(asMethod),
  // ---- atrapy (jawne): zapis zdarzen + kolejka callbackow ----
  "  _schedule(ms, cb) { this.ev.push({ k: 'schedule', ms }); this.queue.push({ ms, seq: this.queue.length, cb }); }",
  "  _fireOneTower(t, shooterRow, nazwa, hp) { this.ev.push({ k: 'fire', row: t.row }); }",
  '}',
].join('\n'));

const scratch = process.env.TOWER_TARGET_SCRATCH ?? mkdtempSync(join(tmpdir(), 'tower-target-'));
mkdirSync(scratch, { recursive: true });
const modPath = join(scratch, 'p6_tower_target_pin.mjs');
writeFileSync(modPath, moduleSrc, 'utf8');
const M = await import(pathToFileURL(modPath).href);
const { pickTowerTarget, TowerScene } = M;

// ---------- PRNG (mulberry32, seed 4242) ----------
let seed = 4242 >>> 0;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];

// NaN nie da sie zapisac w JSON: kodujemy jako napis "NaN".
const dec = (v) => (v === 'NaN' ? NaN : v);
const enc = (v) => (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : v);

// ---------- przypadki pickTowerTarget ----------
function genCase(idx) {
  const tower = { q: ri(0, 6), r: ri(0, 6) };
  const range = rnd() < 0.03 ? 'NaN' : pick([0, 1, 2, 3, 4, 5]);
  const n = ri(0, 7);
  const enemies = [];
  for (let i = 0; i < n; i++) {
    const e = { q: ri(0, 6), r: ri(0, 6), hp: rnd() < 0.03 ? 'NaN' : pick([1, 2, 3, 4]) };
    if (rnd() < 0.15) e.dead = true;
    enemies.push(e);
  }
  const expect = pickTowerTarget(tower, dec(range), enemies.map((e) => ({ q: e.q, r: e.r, hp: dec(e.hp), dead: e.dead })));
  return { id: `pick-${idx}`, tower, range, enemies, expect: expect < 0 ? -1 : expect, cat: categorize(tower, range, enemies, expect) };
}

// Kategorie wyprowadzone z ZACHOWANIA pinu i danych wejsciowych (nie z kodu Rust).
function categorize(tower, range, enemies, expect) {
  const out = [expect < 0 ? 'none' : 'pick'];
  const rangeN = dec(range);
  const dOf = (e) => Math.abs(tower.q - e.q) + Math.abs(tower.r - e.r);
  if (enemies.some((e) => e.dead && dOf(e) >= 1 && dOf(e) <= rangeN)) out.push('dead:skipped');
  if (enemies.some((e) => dOf(e) === 0)) out.push('self:skipped');
  if (range === 'NaN') out.push('range:nan');
  if (enemies.some((e) => e.hp === 'NaN')) out.push('hp:nan');
  const cand = enemies.map((e, i) => ({ e, i, d: dOf(e) })).filter((x) => !x.e.dead && x.d >= 1 && x.d <= rangeN);
  if (cand.some((x) => x.d === rangeN)) out.push('range:edge');
  if (cand.length > 0) {
    const minD = Math.min(...cand.map((x) => x.d));
    const tied = cand.filter((x) => x.d === minD);
    if (tied.length > 1) out.push('tie:dist');
    const minHp = Math.min(...tied.map((x) => x.e.hp === 'NaN' ? Infinity : x.e.hp));
    const hpTied = tied.filter((x) => x.e.hp === minHp);
    if (tied.length > 1 && hpTied.length > 1) out.push('tie:full');
    if (tied.length > 1 && hpTied.length === 1) out.push('tie:hp');
  }
  return out;
}

const PER = 600;
const cases = [];
for (let i = 0; i < PER; i++) cases.push(genCase(i));

// ---------- kolejnosc ognia (pomiar stagger, mtryka bez porownania z Rust) ----------
function fireScenario(idx) {
  const sc = new TowerScene();
  sc.finished = rnd() < 0.1;
  sc.towerShooterRow = rnd() < 0.1 ? null : { Jednostka: 'Luczznik', Health: 10 };
  const nT = ri(0, 8);
  sc.siegeTowers = [];
  for (let i = 0; i < nT; i++) sc.siegeTowers.push({ row: ri(0, 20), mesh: null, destroyed: rnd() < 0.1 });
  sc.wallTileHp = new Map();
  for (let r = 0; r <= 20; r++) if (rnd() < 0.7) sc.wallTileHp.set(r, 1);
  const before = sc.siegeTowers.map((t) => ({ row: t.row, destroyed: t.destroyed }));
  sc._fireSiegeTowers();
  // Wykonanie kolejki jak timer: rosnaco po `ms`, przy rownym `ms` wg kolejnosci wpisania.
  const q = [...sc.queue].sort((a, b) => a.ms - b.ms || a.seq - b.seq);
  for (const item of q) item.cb();
  const schedules = sc.ev.filter((x) => x.k === 'schedule').map((x) => x.ms);
  const fires = sc.ev.filter((x) => x.k === 'fire').map((x) => x.row);
  return { id: `fire-${idx}`, before, schedules, fires, logLen: sc.log.length, destroyedAfter: sc.siegeTowers.filter((t) => t.destroyed).map((t) => t.row) };
}
const fireCases = [];
for (let i = 0; i < 40; i++) fireCases.push(fireScenario(i));
const staggers = new Set();
for (const f of fireCases) {
  for (let i = 1; i < f.schedules.length; i++) staggers.add(f.schedules[i] - f.schedules[i - 1]);
  if (f.schedules.length > 0 && f.schedules[0] !== 0) throw new Error('pierwszy strzal nie ma opoznienia 0');
  if (f.schedules.length !== f.fires.length) throw new Error('liczba zaplanowanych != liczba strzalow');
}
if (staggers.size > 0 && (staggers.size !== 1 || !staggers.has(180))) {
  throw new Error(`stagger nie jest staly 180 ms: ${[...staggers].join(',')}`);
}

const tally = {};
for (const c of cases) for (const k of c.cat) tally[k] = (tally[k] ?? 0) + 1;

const doc = {
  meta: {
    pin: PIN,
    generator: 'rust-port/engine/tests/p6_tower_target_gen.mjs',
    fragmentSha256: digest,
    seed: 4242,
    cases: cases.length,
    note: 'Wyjscia = wykonanie doslownych linii pinu (city-towers.ts pickTowerTarget; battleScene.ts _fireSiegeTowers/_destroyTowerAtRow) w harnessie; atrapy jak w naglowku generatora.',
    categories: tally,
    staggerMsMeasured: [...staggers].sort((a, b) => a - b),
    fireOrder: { cases: fireCases.length, fires: fireCases.reduce((s, f) => s + f.fires.length, 0) },
  },
  cases: cases.map(({ cat, ...rest }) => ({ ...rest, expect: enc(rest.expect) })),
  fireOrderCases: fireCases,
};
const outDir = join(here, 'p6_tower_target_vectors');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(doc, null, 1) + '\n', 'utf8');
console.log(`cases=${cases.length} fireCases=${fireCases.length} sha256=${digest}`);
console.log(JSON.stringify(tally, null, 1));
console.log(`staggerMsMeasured=${[...staggers].join(',')}`);
