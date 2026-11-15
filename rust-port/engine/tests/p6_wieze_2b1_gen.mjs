// P6 WIEZE-2B1: generator wektorow PLANOWANIA wystrzalow wiez (`_fireSiegeTowers`, pin 07d2fbd72,
// gra/src/battle/battleScene.ts:4194-4219) przez WYKONANIE wyciętego tekstu pinu.
// Uruchomienie: node rust-port/engine/tests/p6_wieze_2b1_gen.mjs (Node >= 22.13, module.stripTypeScriptTypes).
//
// Wycinane z pinu (po nazwie metody, zakres do pierwszej linii '  }' o wcieciu 2 spacje):
//   _destroyTowerAtRow (battleScene.ts:4194), _fireSiegeTowers (battleScene.ts:4208, nazwa zmieniona na _fireSiegeTowersPin).
// Stuby (poza zakresem 2B1, strzal = 2B2):
//   _schedule(ms, cb): zapisuje (ms, cb) do kolejki; kolejke odpala generator w kolejnosci wstawienia, a
//     _fireOneTower zapisuje wiersz wiezy (cel wybierany w chwili wystrzalu, bez efektu na stanie).
//   _fireOneTower(t): tylko rejestruje wiersz wiezy (strzal _singleBlow = 2B2).
// Straznik zrodla: SHA-256 wyciętych fragmentow (FRAGMENT_SHA256). Zmiana pinu -> blad generatora.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_PATH = 'gra/src/battle/battleScene.ts';
const SEED = 2231;
const CASE_COUNT = 240;
const FRAGMENT_SHA256 = 'c7522e637a4739b31bf95c94d3d8906f8726bc1ac87afbe015ac9db4794d4f8a';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const pinLines = execFileSync('git', ['show', `${PIN}:${PIN_PATH}`], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\n');
const LINE = (n) => pinLines[n - 1];

function expectLine(n, re) {
  if (!re.test(LINE(n))) throw new Error(`pin ${n}: oczekiwano ${re}, jest: ${LINE(n)}`);
}
function methodRange(re) {
  const hits = [];
  for (let n = 1; n <= pinLines.length; n++) if (re.test(LINE(n))) hits.push(n);
  if (hits.length !== 1) throw new Error(`pin: ${re} trafien ${hits.length}`);
  const start = hits[0];
  if (/\{.*\}\s*$/.test(LINE(start))) return [start, start];
  for (let n = start + 1; n <= pinLines.length; n++) if (LINE(n) === '  }') return [start, n];
  throw new Error(`brak konca metody od linii ${start}`);
}
const textOf = ([a, b]) => pinLines.slice(a - 1, b).join('\n');

expectLine(4194, /^  private _destroyTowerAtRow\(wallRow: number\): void \{$/);
expectLine(4208, /^  private _fireSiegeTowers\(\): void \{$/);
const destroyRange = methodRange(/^  private _destroyTowerAtRow\(wallRow: number\): void \{$/);
const fireRange = methodRange(/^  private _fireSiegeTowers\(\): void \{$/);
const destroyText = textOf(destroyRange);
const fireText = textOf(fireRange);

const fragmentDigest = createHash('sha256').update(`${destroyText}\n---\n${fireText}`).digest('hex');
if (FRAGMENT_SHA256 !== 'PLACEHOLDER' && fragmentDigest !== FRAGMENT_SHA256) {
  throw new Error(`fragmenty pinu nie zgadzaja sie z hashem: ${fragmentDigest}`);
}
console.error('fragment sha256', fragmentDigest);

const classSrc = [
  'class Harness {',
  '  constructor(spec) {',
  '    this.siegeTowers = spec.towers.map((row) => ({ row, mesh: null, destroyed: false }));',
  '    this.wallTileHp = new Set(spec.wallRows);',
  '    this.towerShooterRow = spec.towers.length ? { Jednostka: "Strzelec", Typ: "Distance", Health: 1 } : null;',
  '    this.finished = false; this.log = []; this.__queue = []; this.__cur = undefined; this.__destroyed = [];',
  '  }',
  '  _schedule(ms, cb) { this.__queue.push({ ms, cb }); }',
  '  _fireOneTower(t) { this.__cur = t.row; }',
  destroyText.replace('private _destroyTowerAtRow(wallRow: number): void {', '_destroyTowerAtRowPin(wallRow) {')
    .replace('this.log.push(', 'this.__destroyed.push(wallRow); this.log.push('),
  fireText
    .replace('private _fireSiegeTowers(): void {', '_fireSiegeTowersPin() {')
    .replaceAll('this._destroyTowerAtRow(', 'this._destroyTowerAtRowPin('),
  '}',
].join('\n');

const jsSrc = stripTypeScriptTypes(classSrc, { mode: 'strip' });
const Harness = new Function(jsSrc + '\nreturn Harness;')();

// Wykonanie planowania: zwraca liste [odroczenie_ms, wiersz_wiezy] w kolejnosci wstawienia do kolejki oraz
// wiersze wiez zburzonych przez _destroyTowerAtRow (web), w kolejnosci.
function runCase(towers, wallRows) {
  const h = new Harness({ towers, wallRows });
  h._fireSiegeTowersPin();
  const planned = h.__queue.map((q) => {
    h.__cur = undefined;
    q.cb();
    return [q.ms, h.__cur];
  });
  return { planned, destroyed: h.__destroyed };
}

// --- PRNG (mulberry32) ---
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
const rnd = mulberry32(SEED);
const randInt = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

// Przypadki kotwiczace (wartosci z pinu, recznie): trzy wieze z brakiem kafla na srodku.
const anchors = [
  { towers: [], wallRows: [] },
  { towers: [3], wallRows: [3] },
  { towers: [3, 4, 5], wallRows: [3, 4, 5] },
  { towers: [3, 4, 5], wallRows: [3, 5] },
  { towers: [3, 4], wallRows: [] },
];

const cases = [];
const pushCase = (id, towers, wallRows) => {
  const { planned, destroyed } = runCase(towers, wallRows);
  cases.push({ id, towers, wallRows, planned, destroyed });
};
anchors.forEach((a, i) => pushCase(`anchor-${String(i).padStart(3, '0')}`, a.towers, a.wallRows));
for (let k = 0; k < CASE_COUNT; k++) {
  const n = randInt(0, 5);
  const pool = [1, 2, 3, 4, 5, 6, 7, 8];
  const towers = [];
  while (towers.length < n) {
    const r = pool[randInt(0, pool.length - 1)];
    if (!towers.includes(r)) towers.push(r);
  }
  const wallRows = towers.filter(() => rnd() < 0.6);
  for (const r of pool) if (!towers.includes(r) && rnd() < 0.3) wallRows.push(r);
  wallRows.sort((a, b) => a - b);
  pushCase(`plan-${String(k).padStart(3, '0')}`, towers, wallRows);
}

const stats = {
  count: cases.length,
  withTowers: cases.filter((c) => c.towers.length > 0).length,
  withUnwalled: cases.filter((c) => c.destroyed.length > 0).length,
  withStagger2: cases.filter((c) => c.planned.length >= 3).length,
  withBothOutcomes: cases.filter((c) => c.planned.length > 0 && c.destroyed.length > 0).length,
  maxPlanned: Math.max(...cases.map((c) => c.planned.length)),
};
console.error('statystyki', JSON.stringify(stats));

const outDir = join(here, 'p6_wieze_2b1_vectors');
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, 'vectors.json'),
  JSON.stringify({
    source: { pin: PIN, path: PIN_PATH, fragmentSha256: fragmentDigest, lines: { destroy: destroyRange, fire: fireRange } },
    generator: 'p6_wieze_2b1_gen.mjs',
    seed: SEED,
    stats,
    cases,
  }, null, 1) + '\n',
);
console.error(`zapisano ${cases.length} przypadkow do ${join(outDir, 'vectors.json')}`);
