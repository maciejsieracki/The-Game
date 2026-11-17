// R-RUSTPORT-P4-1F2-TERRITORY-RANGES-R1: generator of the territory-ranges
// vectors (`TerritoryRangesDto`: hexes per owner after the fog filter of the
// active seat ME(), and the outer border edges of each owner).
//
// The generator EXECUTES the pin `07d2fbd72` text (files from `git show`, not
// from the working tree); the SHA-256 of every file / excerpt is written to
// `sources` in vectors.json, so `--check` fails on any drift of the pin text:
// - `gra/src/map/territory.ts` (whole file: `cityTerritoryRadius`,
//   `territoryOwnerAt`, `territoryOwnerLookup` and its index for >= 12 nodes);
// - `gra/src/map/range-hexes.ts` (whole file: `collectTerritoryHexKeysByOwner`);
// - `gra/src/map/territory-border.ts` (whole file:
//   `collectTerritoryBoundaryEdges`, `makeAxialHexCenterFn`);
// - `gra/src/render/hexutil.ts` (whole file: `axialToWorld`, `HEX_R`);
// - `gra/src/game/okolica.ts:37-50` (`CITY_RANGE_MIN`, `CITY_RANGE_CAP`,
//   `cityRangeForPopulation`) with `gra/data/miasto-params.json`;
// - `gra/src/main.ts:15593-15601` (the fog filter of
//   `refreshTerritoryBorderOverlay`: `isMe(ownerId)` → always, `!fogOn` →
//   always, else `currentVisible()` ∪ `fogExploredForRender()`).
// The other imports of those files (`citySightRadius`, `dominantReligion`)
// are not reached by the functions used here; they are stubs that throw.
// TypeScript is stripped with the TypeScript compiler (`transpileModule`),
// path from TYPESCRIPT_JS (default /opt/node22/lib/node_modules/typescript/lib/typescript.js).
//
// Usage (from any directory in the repo):
//   node rust-port/renderer/tests/territory_ranges_f2_gen.mjs          -> writes vectors.json
//   node rust-port/renderer/tests/territory_ranges_f2_gen.mjs --check  -> EXIT 1 on difference

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PIN = '07d2fbd72';
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, 'territory_ranges_f2_vectors');
const OUT = join(OUT_DIR, 'vectors.json');
const CHECK = process.argv.includes('--check');
const TS_PATH = process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
const ts = createRequire(import.meta.url)(TS_PATH);

const show = (path) => execFileSync('git', ['show', `${PIN}:${path}`], { cwd: HERE, encoding: 'utf8', maxBuffer: 64 << 20 });
const sha256 = (text) => createHash('sha256').update(text).digest('hex');
const sources = {};

function excerpt(path, from, to, sig) {
  const lines = show(path).split('\n').slice(from - 1, to);
  if (!lines[0].trimStart().startsWith(sig)) {
    console.error(`signature drift at ${path}:${from}: ${lines[0]}`);
    process.exit(2);
  }
  const body = lines.join('\n');
  sources[`${path}:${from}-${to}`] = sha256(body);
  return body;
}
function whole(path) {
  const text = show(path);
  sources[path] = sha256(text);
  return text;
}

// ------------------------------------------------------------ module loader
const transpile = (src) => ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const modules = {};
function define(name, src, deps) {
  const code = transpile(src);
  const module = { exports: {} };
  const req = (spec) => {
    const target = deps[spec];
    if (target === undefined) throw new Error(`${name}: unexpected import ${spec}`);
    return modules[target];
  };
  new Function('exports', 'require', 'module', code)(module.exports, req, module);
  modules[name] = module.exports;
}

const miastoParams = whole('gra/data/miasto-params.json');
const okolicaExcerpt = excerpt('gra/src/game/okolica.ts', 37, 50, 'export const CITY_RANGE_MIN');
define('okolica', [
  `const miastoParams = ${miastoParams.trim()};`,
  okolicaExcerpt,
  'export function citySightRadius(): number { throw new Error("stub citySightRadius"); }',
].join('\n'), {});
define('culture-religion', 'export function dominantReligion(): never { throw new Error("stub dominantReligion"); }', {});
define('hexutil', whole('gra/src/render/hexutil.ts'), {});
define('territory', whole('gra/src/map/territory.ts'), { '../game/okolica': 'okolica' });
define('range-hexes', whole('gra/src/map/range-hexes.ts'), {
  './territory': 'territory',
  '../game/okolica': 'okolica',
  '../game/culture-religion': 'culture-religion',
});
define('territory-border', whole('gra/src/map/territory-border.ts'), { '../render/hexutil': 'hexutil' });

const filterBody = excerpt('gra/src/main.ts', 15593, 15601, 'let visOnce: Set<string> | null = null;');
define('refresh', `
import { collectTerritoryHexKeysByOwner } from './range-hexes';
export function refreshByOwner(map: any, nodes: any[], isMe: (o: number) => boolean, fogOn: boolean,
    currentVisible: () => Set<string>, fogExploredForRender: () => Set<string>): Map<number, Set<string>> {
${filterBody}
  return byOwner;
}`, { './range-hexes': 'range-hexes' });

const { refreshByOwner } = modules.refresh;
const { collectTerritoryBoundaryEdges, makeAxialHexCenterFn } = modules['territory-border'];
const { CITY_RANGE_MIN, CITY_RANGE_CAP } = modules.okolica;
const { FORT_TERRITORY_RADIUS, OUTPOST_TERRITORY_RADIUS } = modules.territory;

// ------------------------------------------------------------ scenarios
// Map: r-major, q-minor ("odd-r" rectangle in axial: q = col - floor(r/2)),
// so the keys include negative q. `map.hexes` keys are `${q},${r}` in this
// insertion order (the `Object.keys` order the web loop follows).
function rectMap(w, h) {
  const hexes = [];
  for (let r = 0; r < h; r++) for (let col = 0; col < w; col++) hexes.push([col - Math.floor(r / 2), r]);
  return hexes;
}
// Deterministic subset of the map (LCG), for visible / explored sets.
function subset(hexes, seed, permille) {
  let s = seed >>> 0;
  const out = [];
  for (const h of hexes) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    if ((s % 1000) < permille) out.push(h);
  }
  return out;
}
const city = (q, r, ownerId, pop) => ({ q, r, ownerId, pop, level: 1 });
const fort = (q, r, ownerId, order) => ({ q, r, ownerId, pop: 0, level: 1, isFort: true, ...(order ? { order } : {}) });
const outpost = (q, r, ownerId, order) => ({ q, r, ownerId, pop: 0, level: 1, isOutpost: true, ...(order ? { order } : {}) });

const MAP_A = rectMap(26, 18);
const MAP_B = rectMap(34, 24);
const SCENARIOS = [
  {
    name: 'two_owners_fog_off',
    hexes: MAP_A,
    nodes: [city(4, 6, 0, 5), city(9, 6, 1, 7)],
    me: 0, fogOn: false, visible: [], explored: [],
  },
  {
    name: 'two_owners_fog_on_me0',
    hexes: MAP_A,
    nodes: [city(4, 6, 0, 5), city(9, 6, 1, 7)],
    me: 0, fogOn: true,
    visible: subset(MAP_A, 11, 300), explored: subset(MAP_A, 29, 200),
  },
  {
    name: 'two_owners_fog_on_me1',
    hexes: MAP_A,
    nodes: [city(4, 6, 0, 5), city(9, 6, 1, 7)],
    me: 1, fogOn: true,
    visible: subset(MAP_A, 7, 350), explored: subset(MAP_A, 3, 150),
  },
  {
    name: 'two_owners_fog_on_nothing_seen',
    hexes: MAP_A,
    nodes: [city(4, 6, 0, 5), city(9, 6, 1, 7)],
    me: 0, fogOn: true, visible: [], explored: [],
  },
  {
    name: 'pop_edge_cases',
    hexes: MAP_A,
    // pop 0 -> radius 0 (only the centre), 3 -> 5 (min), 2.9 -> floor 2 -> 5,
    // 20 -> 15 (cap), negative -> 0.
    nodes: [city(2, 2, 0, 0), city(10, 3, 1, 3), city(18, 4, 2, 2.9), city(6, 12, 3, 20), city(20, 14, 4, -4)],
    me: 0, fogOn: true,
    visible: subset(MAP_A, 41, 500), explored: subset(MAP_A, 43, 100),
  },
  {
    name: 'forts_outposts_order_lt12',
    hexes: MAP_A,
    nodes: [
      city(3, 3, 0, 6),
      fort(9, 5, 1, { turn: 4, seq: 2 }),
      fort(11, 5, 2, { turn: 4, seq: 1 }),
      outpost(14, 8, 1),
      fort(15, 9, 2),
      outpost(6, 10, -1, { turn: 9, seq: 0 }),
      fort(7, 11, 0, { turn: 2, seq: 0 }),
      city(18, 12, -99, 5),
    ],
    me: 2, fogOn: true,
    visible: subset(MAP_A, 101, 400), explored: subset(MAP_A, 103, 250),
  },
  {
    name: 'many_nodes_index_path',
    hexes: MAP_B,
    // >= 12 nodes: territoryOwnerLookup takes the index (territoryOwnerIndex).
    nodes: [
      city(2, 2, 0, 5), city(8, 3, 0, 9), city(14, 2, 1, 6), city(20, 4, 1, 15),
      city(26, 3, 2, 5), city(3, 10, 2, 8), city(10, 11, 3, 5), city(17, 12, 3, 11),
      fort(23, 11, 0, { turn: 3, seq: 1 }), fort(25, 12, 1, { turn: 3, seq: 0 }),
      outpost(5, 18, 2), outpost(12, 19, 3, { turn: 1, seq: 5 }), fort(18, 20, -1),
      city(0, 21, 1, 7),
    ],
    me: 1, fogOn: true,
    visible: subset(MAP_B, 211, 450), explored: subset(MAP_B, 223, 200),
  },
  {
    name: 'many_nodes_fog_off',
    hexes: MAP_B,
    nodes: [
      city(2, 2, 0, 5), city(8, 3, 0, 9), city(14, 2, 1, 6), city(20, 4, 1, 15),
      city(26, 3, 2, 5), city(3, 10, 2, 8), city(10, 11, 3, 5), city(17, 12, 3, 11),
      fort(23, 11, 0, { turn: 3, seq: 1 }), fort(25, 12, 1, { turn: 3, seq: 0 }),
      outpost(5, 18, 2), outpost(12, 19, 3, { turn: 1, seq: 5 }), fort(18, 20, -1),
      city(0, 21, 1, 7),
    ],
    me: 0, fogOn: false, visible: [], explored: [],
  },
];

const keyOf = ([q, r]) => `${q},${r}`;
const parseKey = (k) => k.split(',').map(Number);
const out = {
  pin: PIN,
  sources,
  constants: {
    cityRangeMin: CITY_RANGE_MIN,
    cityRangeCap: CITY_RANGE_CAP,
    fortTerritoryRadius: FORT_TERRITORY_RADIUS,
    outpostTerritoryRadius: OUTPOST_TERRITORY_RADIUS,
  },
  scenarios: [],
};
const centerFn = makeAxialHexCenterFn();
for (const sc of SCENARIOS) {
  const map = { hexes: Object.fromEntries(sc.hexes.map((h) => [keyOf(h), {}])) };
  const vis = new Set(sc.visible.map(keyOf));
  const exp = new Set(sc.explored.map(keyOf));
  const byOwner = refreshByOwner(map, sc.nodes, (o) => o === sc.me, sc.fogOn, () => new Set(vis), () => new Set(exp));
  const owners = [];
  const borders = [];
  for (const [ownerId, set] of byOwner) {
    owners.push({ ownerId, hexes: [...set].map(parseKey) });
    const edges = collectTerritoryBoundaryEdges(set, centerFn).map((e) => [e.v0Key, e.v1Key]);
    borders.push({ ownerId, edges });
  }
  out.scenarios.push({
    name: sc.name,
    hexes: sc.hexes,
    nodes: sc.nodes.map((n) => ({
      q: n.q, r: n.r, ownerId: n.ownerId, pop: n.pop,
      isOutpost: !!n.isOutpost, isFort: !!n.isFort, order: n.order ?? null,
    })),
    me: sc.me,
    fogOn: sc.fogOn,
    visible: sc.visible,
    explored: sc.explored,
    byOwner: owners,
    borders,
  });
}

const text = `${JSON.stringify(out)}\n`;
if (CHECK) {
  const cur = readFileSync(OUT, 'utf8');
  if (cur !== text) {
    console.error('vectors.json differs from the pin output');
    process.exit(1);
  }
  console.log('vectors.json matches the pin');
} else {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT, text);
  console.log(`wrote ${OUT}: ${out.scenarios.length} scenarios`);
  for (const s of out.scenarios) {
    console.log(`  ${s.name}: owners ${s.byOwner.map((o) => `${o.ownerId}:${o.hexes.length}`).join(' ')} edges ${s.borders.map((b) => b.edges.length).join(' ')}`);
  }
}
