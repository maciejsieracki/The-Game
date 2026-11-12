// R-RUSTPORT-P6-SIEGE-TRANSFER-Q8-Q1: generator wektorow dla klocka przeniesienia cudow
// (`snapshotWonderTerritoryOwners`, `planWonderTransfers`, `applyWonderTransfers`, `isCivilizationOwnerId`)
// z pinu webu.
//
// Zrodlo (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75, plik tylko do odczytu, poza repo):
//   * gra/src/game/wonder-transfer.ts (caly plik; `export ` zdejmowane, typy zdejmowane przez esbuild transformSync).
//
// Wykonywane REALNIE w node. Trzy rodzaje przypadkow:
//   * "plan"    - wyczerpujaco: 1 cud, owner x before x after (rowniez brak klucza = undefined w TS);
//   * "apply"   - plan (w tym niespojny fromOwnerId, duplikaty wpisow, duplikaty wonderId) na liscie cudow;
//   * "chain"   - deterministyczny (LCG) pelny przebieg: migawka PRZED, migawka PO, plan, apply.
//
// Uzycie (katalog z node_modules/esbuild POZA repo, esbuild 0.25.0 jak p6_aipeace_balans_gen.mjs):
//   node tests/p6_siege_wonder_watch_gen.mjs <wonder-transfer.ts@pin> <katalog z node_modules/esbuild> \
//     > tests/p6_siege_wonder_watch_vectors/vectors.json

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const [srcPath, esbuildDir] = process.argv.slice(2);
if (!srcPath || !esbuildDir) throw new Error('uzycie: gen.mjs <wonder-transfer.ts> <katalog z esbuild>');

const require = createRequire(path.join(esbuildDir, 'package.json'));
const { transformSync } = require('esbuild');

const src = readFileSync(srcPath, 'utf8').replace(/^export /gm, '');
const js = transformSync(src, { loader: 'ts', format: 'esm', target: 'es2022' }).code;
// eslint-disable-next-line no-new-func
const W = new Function(
  js + '\nreturn { isCivilizationOwnerId, snapshotWonderTerritoryOwners, planWonderTransfers, applyWonderTransfers };',
)();

const ABSENT = '__absent__';
// Obiekt JSON -> Map (klucz nieobecny = brak wpisu = undefined w TS; null/liczba = wartosc).
function mapFromObj(obj) {
  const m = new Map();
  for (const [k, v] of Object.entries(obj)) m.set(k, v);
  return m;
}
function objFromMap(m) {
  return Object.fromEntries(m);
}

const cases = { plan: [], apply: [], chain: [] };

// ---- plan: wyczerpujaco dla jednego cudu ----
const OWNERS = [-99, -1, 0, 1, 2];
const BA_VALUES = [ABSENT, null, -99, -1, 0, 1, 2];
function bawObj(id, v) {
  return v === ABSENT ? {} : { [id]: v };
}
for (const owner of OWNERS) {
  for (const b of BA_VALUES) {
    for (const a of BA_VALUES) {
      const wonders = [{ wonderId: 'w1', q: 3, r: -2, ownerId: owner }];
      const before = bawObj('w1', b);
      const after = bawObj('w1', a);
      const plan = W.planWonderTransfers(wonders, mapFromObj(before), mapFromObj(after));
      cases.plan.push({ wonders, before, after, expected: plan });
    }
  }
}

// ---- plan: wiele cudow, duplikaty wonderId ----
{
  const wonders = [
    { wonderId: 'a', q: 0, r: 0, ownerId: 1 },
    { wonderId: 'b', q: 1, r: 0, ownerId: 2 },
    { wonderId: 'c', q: 2, r: 0, ownerId: -1 },
    { wonderId: 'a', q: 0, r: 0, ownerId: 1 },
    { wonderId: 'd', q: 3, r: 0, ownerId: 0 },
  ];
  const before = { a: 1, b: 2, c: -1, d: null };
  const after = { a: 2, b: null, c: 3, d: 1 };
  const plan = W.planWonderTransfers(wonders, mapFromObj(before), mapFromObj(after));
  cases.plan.push({ wonders, before, after, expected: plan });
}

// ---- apply: niespojny from, duplikaty wpisow, idempotencja ----
{
  const wonders = [
    { wonderId: 'x', q: 0, r: 0, ownerId: 1 },
    { wonderId: 'y', q: 0, r: 1, ownerId: 2 },
    { wonderId: 'x', q: 9, r: 9, ownerId: 5 },
  ];
  const plan = [
    { wonderId: 'x', q: 0, r: 0, fromOwnerId: 1, toOwnerId: 3 },
    { wonderId: 'x', q: 0, r: 0, fromOwnerId: 1, toOwnerId: 4 },
    { wonderId: 'y', q: 0, r: 1, fromOwnerId: 7, toOwnerId: 3 },
    { wonderId: 'z', q: 0, r: 2, fromOwnerId: 0, toOwnerId: 1 },
    { wonderId: 'y', q: 0, r: 1, fromOwnerId: 2, toOwnerId: 0 },
    { wonderId: 'y', q: 0, r: 1, fromOwnerId: 0, toOwnerId: 6 },
  ];
  const copy = JSON.parse(JSON.stringify(wonders));
  const n = W.applyWonderTransfers(copy, plan);
  cases.apply.push({ wonders, plan, expected: { count: n, wonders: copy } });
}
// apply z pusta lista i z planem na pustej liscie
for (const [wonders, plan] of [
  [[], []],
  [[{ wonderId: 'q', q: 0, r: 0, ownerId: 0 }], []],
  [[], [{ wonderId: 'q', q: 0, r: 0, fromOwnerId: 0, toOwnerId: 1 }]],
]) {
  const copy = JSON.parse(JSON.stringify(wonders));
  const n = W.applyWonderTransfers(copy, plan);
  cases.apply.push({ wonders, plan, expected: { count: n, wonders: copy } });
}

// ---- chain: LCG (deterministyczny) ----
let seed = 20261112;
function rnd(n) {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed % n;
}
const HEXES = [
  [0, 0], [1, 0], [0, 1], [1, 1], [2, 0], [-1, 2], [3, -1],
];
const WONDER_OWNERS = [-99, -1, 0, 1, 2, 3];
const TERR_OWNERS = [null, -99, -1, 0, 1, 2, 3];
for (let i = 0; i < 80; i++) {
  const nW = 1 + rnd(4);
  const wonders = [];
  for (let k = 0; k < nW; k++) {
    const [q, r] = HEXES[rnd(HEXES.length)];
    wonders.push({ wonderId: `w${k}`, q, r, ownerId: WONDER_OWNERS[rnd(WONDER_OWNERS.length)] });
  }
  const terrBefore = [];
  const terrAfter = [];
  for (const [q, r] of HEXES) {
    if (rnd(4) > 0) terrBefore.push({ q, r, owner: TERR_OWNERS[rnd(TERR_OWNERS.length)] });
    if (rnd(4) > 0) terrAfter.push({ q, r, owner: TERR_OWNERS[rnd(TERR_OWNERS.length)] });
  }
  const lookup = terr => (q, r) => {
    const e = terr.find(t => t.q === q && t.r === r);
    return e === undefined ? null : e.owner;
  };
  const before = W.snapshotWonderTerritoryOwners(wonders, lookup(terrBefore));
  const after = W.snapshotWonderTerritoryOwners(wonders, lookup(terrAfter));
  const plan = W.planWonderTransfers(wonders, before, after);
  const final = JSON.parse(JSON.stringify(wonders));
  const n = W.applyWonderTransfers(final, plan);
  cases.chain.push({
    wonders,
    terrBefore,
    terrAfter,
    expected: {
      before: objFromMap(before),
      after: objFromMap(after),
      plan,
      count: n,
      wonders: final,
    },
  });
}

// ---- kontrola: liczby i rozklad przypadkow ----
const out = {
  source: 'gra/src/game/wonder-transfer.ts @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75',
  generator: 'tests/p6_siege_wonder_watch_gen.mjs',
  counts: { plan: cases.plan.length, apply: cases.apply.length, chain: cases.chain.length },
  cases,
};
process.stdout.write(JSON.stringify(out, null, 1) + '\n');
