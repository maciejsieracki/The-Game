// R-RUSTPORT-P6-WIEZE-MERGE-Q1 (etap 1): generator wektorow dla `pick_tower_target` (siege_tactics_tower.rs).
// Generator WYKONUJE kod z pinu, nie transkrypcje reki:
//   * gra/src/game/city-towers.ts -> pickTowerTarget (wyciete po nazwie, typy zdjete, wykonane w node).
// Straznik SHA-256: generator odmawia pracy, gdy plik pinu lub wyciety fragment roznia sie od zapisanych skrotow.
// Przypadki sa generowane deterministycznie (LCG). Zasieg `NaN` / `Infinity` jest kodowany jako napis.
//
// Uzycie (WEB_ROOT = `git archive 07d2fbd72 gra/src | tar -x -C <katalog>`, poza repo; Node 22):
//   node rust-port/engine/tests/p6_tower_target_wiring_gen.mjs <WEB_ROOT> > rust-port/engine/tests/p6_tower_target_wiring_vectors/vectors.json

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const [WEB_ROOT] = process.argv.slice(2);
if (!WEB_ROOT) throw new Error('uzycie: gen.mjs <WEB_ROOT>');
const SRC = path.join(WEB_ROOT, 'gra', 'src');
const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';

const FILE_SHA256 = 'cc715ed61f65cb0b11fe38efe80e6c6a1742feefec2c0bb5e6ce142a4da8cbd4';
const FRAGMENT_SHA256 = '56a196fe638705e1883506e315b059116268e49b20b679a90db1448ebe3da333';

const sha = s => createHash('sha256').update(s).digest('hex');

const fileText = readFileSync(path.join(SRC, 'game', 'city-towers.ts'), 'utf8');
if (sha(fileText) !== FILE_SHA256) throw new Error(`strazik SHA-256 city-towers.ts: ${sha(fileText)} != ${FILE_SHA256} (pin ${PIN})`);
const lines = fileText.split('\n');

// Wycinek funkcji po nazwie: od deklaracji do domykajacego nawiasu o tym samym wcieciu.
function extractFn(name) {
  const re = new RegExp(`^\\s*(export )?function ${name}\\(`);
  const hits = lines.map((l, idx) => (re.test(l) ? idx : -1)).filter(idx => idx >= 0);
  if (hits.length !== 1) throw new Error(`funkcja ${name}: oczekiwano 1 deklaracji, jest ${hits.length}`);
  const start = hits[0];
  const indent = lines[start].match(/^\s*/)[0];
  let end = start + 1;
  while (lines[end] !== indent + '}') end++;
  return lines.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1');
}

const pickSrc = extractFn('pickTowerTarget');
const fragSha = sha(pickSrc);
if (fragSha !== FRAGMENT_SHA256) throw new Error(`strazik SHA-256 fragmentu pickTowerTarget: ${fragSha} != ${FRAGMENT_SHA256}`);

const code = stripTypeScriptTypes(
  `function __mk() {\n${pickSrc}\nreturn { pickTowerTarget };\n}`,
  { mode: 'strip' },
);
const { pickTowerTarget } = new Function(`${code}\nreturn __mk();`)();

// Generator deterministyczny (LCG, bez Math.random).
let seed = 20261114;
function rnd() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

function genRange() {
  const r = rnd();
  if (r < 0.04) return NaN;
  if (r < 0.08) return Infinity;
  if (r < 0.12) return -1;
  return int(0, 6);
}

function genEnemies() {
  const n = int(0, 6);
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ q: int(-2, 8), r: int(-2, 8), hp: int(0, 9), dead: rnd() < 0.2 });
  }
  return out;
}

// Liczniki pokrycia: policzone z wykonania pinu na tym samym wejsciu.
const counters = { cases: 0, hit: 0, none: 0, dead_matters: 0, range_matters: 0, own_tile_present: 0, tie_break: 0, nan_range: 0, inf_range: 0 };

const cases = [];
for (let k = 0; k < 400; k++) {
  const tower = { q: int(0, 6), r: int(0, 6) };
  const range = genRange();
  const enemies = genEnemies();
  const expected = pickTowerTarget(tower, range, enemies);

  counters.cases++;
  if (expected >= 0) counters.hit++; else counters.none++;
  if (Number.isNaN(range)) counters.nan_range++;
  if (range === Infinity) counters.inf_range++;
  if (enemies.some(e => Math.abs(tower.q - e.q) + Math.abs(tower.r - e.r) < 1)) counters.own_tile_present++;
  const undead = enemies.map(e => ({ ...e, dead: false }));
  if (pickTowerTarget(tower, range, undead) !== expected) counters.dead_matters++;
  const unranged = pickTowerTarget(tower, Infinity, enemies);
  if (unranged !== expected) counters.range_matters++;
  // remis odleglosci z roznym HP wsrod zywych w zasiegu
  const inRange = enemies
    .map((e, i) => ({ e, i, d: Math.abs(tower.q - e.q) + Math.abs(tower.r - e.r) }))
    .filter(x => !x.e.dead && x.d >= 1 && x.d <= range);
  if (inRange.some(a => inRange.some(b => a.d === b.d && a.e.hp !== b.e.hp))) counters.tie_break++;

  cases.push({
    tower,
    range: Number.isNaN(range) ? 'NaN' : range === Infinity ? 'Infinity' : range,
    enemies,
    expected,
  });
}

const out = {
  pin: PIN,
  source: 'gra/src/game/city-towers.ts',
  file_sha256: FILE_SHA256,
  fragment_sha256: FRAGMENT_SHA256,
  note: 'expected = indeks zwrocony przez pickTowerTarget pinu (-1 = brak celu); range NaN/Infinity jako napisy',
  counters,
  cases,
};
process.stdout.write(JSON.stringify(out, null, 1) + '\n');
