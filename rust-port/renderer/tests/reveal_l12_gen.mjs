// R-RUSTPORT-P4-1-L12-REVEAL-R1: generator of the reveal vectors
// (`FogRevealDto`: `revealAllLand` and `riverRevealKeys`, gaps L1/L2).
//
// The generator EXECUTES the pin `07d2fbd72` text (files from `git show`, not
// from the working tree); the SHA-256 of every file / excerpt is written to
// `sources` in vectors.json, so `--check` fails on any drift of the pin text:
// - `gra/src/game/visibility.ts` (whole file: `computeVisibleAt`,
//   `addExplored`, `allHexKeys`, `allRevealLandKeys`, `exploredSetForRender`);
// - `gra/src/units/setup.ts:353-355` (`keyOf`), `:361-366` (`hexDistance`),
//   `:664-666` (`isWaterTerrain`); `gra/src/types/hex.ts` (whole file);
// - `gra/src/main.ts:12856` (`ALL_LAND_KEYS`), `:12864-12866`
//   (`fogExploredForRender`), `:13074-13080` (`startRevealKeysForRiverFog`),
//   `:13475-13519` (`refreshFog`, run with stubs for everything that is not
//   fog: meshes, units, cities, HUD, diplomacy);
// - `gra/src/render/scene.ts:3531-3548` (`setFog`: `lastRiverRevealKeys`,
//   `landReveal`, `isHidden`, `anyHidden`, `showOceanBackdropNow`), `:3629`
//   (`anyHiddenFinal`), `:3654` (`lastAnyHidden`), `:3431-3433` (river
//   `fogActive` / `riverHidden`);
// - `gra/src/render/riverLod.ts:359-377` (`mergedRiverVisibleInFog`).
// Stubs: `okolica.citySightRadius` throws (not reached);
// `mapGenDefaultSight` returns NaN (module-level `DEFAULT_SIGHT`, not read by
// the functions used here); `ME()` = 0 (`exploredByHuman` has seat 0 only).
//
// The DTO written next to the web results is the contract encoding of the
// same refresh: `fog.state` = D-DTO-10 (`2` in `vis`, `1` in
// `exploredForRender`, `0` otherwise; all `2` when `!useFogRender`),
// `fogActive` = `useFogRender`, `reveal.revealAllLand` = `revealAllLand`,
// `reveal.riverRevealKeys` = `startRevealKeysForRiverFog()` (sorted `r`-major,
// `q`-minor; `null` for `undefined`) only when `useFogRender`: with the fog
// off the pin calls `setFog(ALL_KEYS, ALL_KEYS)` WITHOUT options
// (`main.ts:13506`), `startRevealKeysForRiverFog()` is not called and the
// scene reads `lastRiverRevealKeys = opts?.riverRevealKeys ?? null`
// (`scene.ts:3531`), so the DTO carries `null` there
// (R-RUSTPORT-P4-1-L12-FOGOFF-VEC-R1). `exploredCopyState` is the same fog with
// the raw `explored` instead of `exploredForRender` (mutation (c) of the
// dispatch, as a producer bug the adapter must reject).
//
// TypeScript is stripped with the TypeScript compiler (`transpileModule`),
// path from TYPESCRIPT_JS; otherwise a `typescript` package resolvable from
// this file, otherwise the global one (`npm root -g`/typescript).
//
// Usage (from any directory in the repo):
//   node rust-port/renderer/tests/reveal_l12_gen.mjs          -> writes vectors.json
//   node rust-port/renderer/tests/reveal_l12_gen.mjs --check  -> EXIT 1 on difference

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PIN = '07d2fbd72';
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, 'reveal_l12_vectors');
const OUT = join(OUT_DIR, 'vectors.json');
const CHECK = process.argv.includes('--check');
const requireHere = createRequire(import.meta.url);
function typescriptPath() {
  if (process.env.TYPESCRIPT_JS) return process.env.TYPESCRIPT_JS;
  try {
    return requireHere.resolve('typescript');
  } catch {
    const globalRoot = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
    return join(globalRoot, 'typescript', 'lib', 'typescript.js');
  }
}
const ts = requireHere(typescriptPath());

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

define('hex', whole('gra/src/types/hex.ts'), {});
define('setup', [
  "import { TerenBazowy } from '../types/hex';",
  excerpt('gra/src/units/setup.ts', 353, 355, 'export function keyOf('),
  excerpt('gra/src/units/setup.ts', 361, 366, 'export function hexDistance('),
  excerpt('gra/src/units/setup.ts', 664, 666, 'export function isWaterTerrain('),
].join('\n'), { '../types/hex': 'hex' });
define('okolica', 'export function citySightRadius(): never { throw new Error("stub citySightRadius"); }', {});
define('mapgen', 'export function mapGenDefaultSight(): number { return NaN; }', {});
define('visibility', whole('gra/src/game/visibility.ts'), {
  '../units/setup': 'setup',
  '../types/hex': 'hex',
  './okolica': 'okolica',
  '../data/map-gen-params-loader': 'mapgen',
});
define('riverLod', `export ${excerpt('gra/src/render/riverLod.ts', 359, 377, 'export function mergedRiverVisibleInFog(').replace(/^export /, '')}`, {});

const allLandKeysLine = excerpt('gra/src/main.ts', 12856, 12856, 'let ALL_LAND_KEYS = new Set(allRevealLandKeys(map));');
const fogExploredBody = excerpt('gra/src/main.ts', 12864, 12866, 'function fogExploredForRender(): Set<string> {');
const startRevealBody = excerpt('gra/src/main.ts', 13074, 13080, 'function startRevealKeysForRiverFog(): Set<string> | undefined {');
const refreshFogBody = excerpt('gra/src/main.ts', 13475, 13519, 'function refreshFog(opts?: { skipVeteranEducation?: boolean }): void {');
define('main', `
import { addExplored, allHexKeys, allRevealLandKeys, computeVisibleAt, exploredSetForRender } from './visibility';
export function runRefreshFog(env: any): any {
  const map = env.map;
  let galleryOn = false;
  let fogOn: boolean = env.fogOn;
  let revealAllLand: boolean = env.revealAllLand;
  const explored = new Set<string>(env.explored);
  const exploredByHuman = new Map<number, Set<string>>([[0, explored]]);
  const ME = (): number => 0;
  let ALL_KEYS = new Set(allHexKeys(map));
  ${allLandKeysLine}
  const startRevealRadius: number = env.startRevealRadius;
  const playerStartHexFor = (_o: number) => env.startHex;
  const isAwaitingFirstPlayerCity = () => env.awaiting;
  const currentVisible = () => new Set<string>(env.visible);
  const noop = (..._a: unknown[]) => {};
  const markMinimapDirty = noop, updateDiplomaticDiscovery = noop, syncCampMeshes = noop,
    syncVillageMeshes = noop, syncResourceOverlayFog = noop, syncImprovementMeshFog = noop,
    syncSettlementMeshFog = noop, syncWorkerFieldOverlayFog = noop, syncUnitsRender = noop,
    refreshD1bHud = noop, checkNewDiplomaticContacts = noop, checkVeteranEnemyFirstEncounter = noop,
    refreshTerritoryBorderOverlay = noop;
  const visibleUnitsList = (_v: Set<string>) => [];
  const workerFieldOverlayGroup = null;
  let deferRefreshFogUnitSync: (() => void) | null = null;
  const cityRenderer = { applyFogVisibility: noop };
  const wonderRenderer = { applyFogVisibility: noop };
  const d1bHudActive = false;
  const territoryBorderVisible = false;
  const calls: any[] = [];
  const setFog = (visible: Set<string>, explored: Set<string>, ...rest: any[]) =>
    calls.push({ visible, explored, nargs: 2 + rest.length, opts: rest[0] });
  ${fogExploredBody}
  ${startRevealBody}
  ${refreshFogBody}
  refreshFog();
  return { calls, explored, exploredForRender: fogExploredForRender(), startReveal: startRevealKeysForRiverFog() };
}`, { './visibility': 'visibility' });

const setFogHead = excerpt('gra/src/render/scene.ts', 3531, 3548, 'lastRiverRevealKeys = opts?.riverRevealKeys ?? null;');
const anyHiddenFinalLine = excerpt('gra/src/render/scene.ts', 3629, 3629, 'const anyHiddenFinal = anyHidden;');
const lastAnyHiddenLine = excerpt('gra/src/render/scene.ts', 3654, 3654, 'lastAnyHidden = anyHiddenFinal && !landReveal;');
const riverHead = excerpt('gra/src/render/scene.ts', 3431, 3433, 'const fogActive = lastAnyHidden;');
define('scene', `
import { mergedRiverVisibleInFog } from './riverLod';
export function runSetFog(hexKeys: string[], visible: Set<string>, explored: Set<string>, opts: any, riverEntries: string[][]): any {
  let lastRiverRevealKeys: Set<string> | null = null;
  let lastAnyHidden = false;
  const hexInstance = new Map<string, number>(hexKeys.map((k) => [k, 0]));
  ${setFogHead}
  ${anyHiddenFinalLine}
  ${lastAnyHiddenLine}
  ${riverHead}
  const rivers = riverEntries.map((keys) => mergedRiverVisibleInFog(fogActive, lastRiverRevealKeys, riverHidden, keys));
  return { landReveal, lastRiverRevealKeys, showOceanBackdropNow, lastAnyHidden, rivers };
}`, { './riverLod': 'riverLod' });

const { runRefreshFog } = modules.main;
const { runSetFog } = modules.scene;
const { TerenBazowy } = modules.hex;

// ------------------------------------------------------------ scenarios
// Map: r-major, q-minor, `hexes[i] = (i % w, i / w)` (contract §1.4,
// `validate_map`), keys `${q},${r}` in this insertion order (`Object.keys`).
function rectMap(w, h) {
  const hexes = [];
  for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) hexes.push([q, r]);
  return hexes;
}
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s;
  };
}
const TERRAINS = ['laka', 'rownina', 'wzgorza', 'gory', 'plytkie_morze', 'morze', 'pustynia', 'polarny'];
// Terrain per hex; `morzePermille` of the hexes are `Morze` (the only
// non-reveal terrain), the rest spread over the other seven.
function terrains(hexes, seed, morzePermille) {
  const next = lcg(seed);
  return hexes.map(() => {
    if (next() % 1000 < morzePermille) return 'morze';
    const others = TERRAINS.filter((t) => t !== 'morze');
    return others[next() % others.length];
  });
}
function subset(hexes, seed, permille) {
  const next = lcg(seed);
  return hexes.filter(() => next() % 1000 < permille);
}
// River entries (`entry.hexKeys`): `count` random runs of 1..6 map hexes.
function rivers(hexes, seed, count) {
  const next = lcg(seed);
  const out = [];
  for (let i = 0; i < count; i++) {
    const len = 1 + (next() % 6);
    const run = [];
    for (let j = 0; j < len; j++) run.push(hexes[next() % hexes.length]);
    out.push(run);
  }
  return out;
}
const key = ([q, r]) => `${q},${r}`;
const sortKeys = (keys) => [...keys]
  .map((k) => k.split(',').map(Number))
  .sort((a, b) => a[1] - b[1] || a[0] - b[0]);

function scenario(name, o) {
  const hexes = rectMap(o.w, o.h);
  const ter = o.terrains ?? terrains(hexes, o.seed, o.morze ?? 300);
  const visible = o.visible ?? subset(hexes, o.seed + 1, o.visPermille ?? 120);
  const explored = o.explored ?? subset(hexes, o.seed + 2, o.expPermille ?? 200);
  const startHex = o.startHex === undefined ? hexes[(o.seed * 7) % hexes.length] : o.startHex;
  const riverRuns = rivers(hexes, o.seed + 3, 10);
  // One run inside the start circle (around the start hex), so the reveal
  // keys decide its visibility when the circle is unexplored.
  if (startHex) riverRuns.push([startHex]);
  return {
    name, w: o.w, h: o.h, hexes, ter, visible, explored, startHex,
    fogOn: o.fogOn, revealAllLand: o.revealAllLand, awaiting: o.awaiting,
    startRevealRadius: o.radius ?? 2, riverRuns,
  };
}

const SCENARIOS = [
  scenario('fog_on_no_reveal_awaiting', { w: 9, h: 7, seed: 11, fogOn: true, revealAllLand: false, awaiting: true }),
  scenario('fog_on_reveal_not_awaiting', { w: 9, h: 7, seed: 13, fogOn: true, revealAllLand: true, awaiting: false }),
  scenario('fog_off_reveal_on', { w: 8, h: 6, seed: 17, fogOn: false, revealAllLand: true, awaiting: false }),
  scenario('fog_off_no_reveal_awaiting', { w: 8, h: 6, seed: 19, fogOn: false, revealAllLand: false, awaiting: true }),
  scenario('fog_on_reveal_awaiting', { w: 10, h: 8, seed: 23, fogOn: true, revealAllLand: true, awaiting: true, radius: 3 }),
  scenario('fog_on_nothing_seen_awaiting', { w: 9, h: 7, seed: 29, fogOn: true, revealAllLand: false, awaiting: true, visible: [], explored: [] }),
  scenario('fog_on_awaiting_no_start_hex', { w: 7, h: 6, seed: 31, fogOn: true, revealAllLand: false, awaiting: true, startHex: null }),
  scenario('fog_on_reveal_no_sea', { w: 7, h: 6, seed: 37, fogOn: true, revealAllLand: true, awaiting: true, morze: 0 }),
  scenario('fog_on_all_explored', { w: 7, h: 5, seed: 41, fogOn: true, revealAllLand: false, awaiting: true, expPermille: 1000 }),
  scenario('fog_on_reveal_all_sea', { w: 6, h: 5, seed: 43, fogOn: true, revealAllLand: true, awaiting: false, morze: 1000 }),
  scenario('fog_on_awaiting_radius0', { w: 7, h: 6, seed: 47, fogOn: true, revealAllLand: false, awaiting: true, radius: 0 }),
  scenario('fog_on_reveal_explored_land', { w: 8, h: 6, seed: 53, fogOn: true, revealAllLand: true, awaiting: true, expPermille: 1000, morze: 200 }),
];
for (let i = 0; i < 16; i++) {
  const seed = 101 + 17 * i;
  SCENARIOS.push(scenario(`random_${i}`, {
    w: 6 + (i % 6), h: 5 + (i % 5), seed,
    fogOn: i % 4 !== 3, revealAllLand: i % 3 === 0, awaiting: i % 2 === 0,
    radius: 1 + (i % 3), morze: 150 + 50 * (i % 5),
  }));
}

const fogCodes = (hexes, useFogRender, vis, expl) => hexes.map((h) => {
  const k = key(h);
  if (!useFogRender || vis.has(k)) return 2;
  return expl.has(k) ? 1 : 0;
});

const out = [];
for (const s of SCENARIOS) {
  const map = { hexes: {} };
  s.hexes.forEach((h, i) => { map.hexes[key(h)] = { terenBazowy: s.ter[i] }; });
  const r = runRefreshFog({
    map, fogOn: s.fogOn, revealAllLand: s.revealAllLand,
    explored: s.explored.map(key), visible: s.visible.map(key),
    startHex: s.startHex ? { q: s.startHex[0], r: s.startHex[1] } : null,
    awaiting: s.awaiting, startRevealRadius: s.startRevealRadius,
  });
  if (r.calls.length !== 1) throw new Error(`${s.name}: ${r.calls.length} setFog calls`);
  const call = r.calls[0];
  const useFogRender = s.fogOn || s.revealAllLand;
  const vis = new Set(s.visible.map(key));
  const scene = runSetFog(s.hexes.map(key), call.visible, call.explored, call.opts, s.riverRuns.map((run) => run.map(key)));
  const landSet = new Set(s.hexes.filter((_, i) => s.ter[i] !== TerenBazowy.Morze).map(key));
  out.push({
    name: s.name,
    hexes: s.hexes.map((h, i) => [h[0], h[1], s.ter[i]]),
    dto: {
      fog: { state: fogCodes(s.hexes, useFogRender, vis, r.exploredForRender) },
      fogActive: useFogRender,
      reveal: {
        revealAllLand: s.revealAllLand,
        // Taken from the EXECUTED pin path, not re-derived: `refreshFog`
        // (main.ts:13489-13494 / 13505-13506) picks the `setFog` call, and
        // scene.ts:3531 `lastRiverRevealKeys = opts?.riverRevealKeys ?? null`
        // turns a call without options (fog off) into `null`.
        riverRevealKeys: scene.lastRiverRevealKeys === null
          ? null
          : sortKeys(scene.lastRiverRevealKeys).map(([q, rr]) => ({ q, r: rr })),
      },
    },
    exploredCopyState: fogCodes(s.hexes, useFogRender, vis, r.explored),
    exploredCopyDiffers: useFogRender && s.revealAllLand && [...landSet].some((k) => !r.explored.has(k)),
    web: {
      setFog: {
        visible: sortKeys(call.visible),
        explored: sortKeys(call.explored),
        nargs: call.nargs,
      },
      scene: {
        landReveal: scene.landReveal,
        riverRevealKeys: scene.lastRiverRevealKeys === null ? null : sortKeys(scene.lastRiverRevealKeys),
        showOceanBackdrop: scene.showOceanBackdropNow,
        riverFogActive: scene.lastAnyHidden,
      },
      rivers: s.riverRuns.map((run, i) => ({ keys: run.map(key), visible: scene.rivers[i] })),
    },
  });
}

const text = `${JSON.stringify({ pin: PIN, sources, scenarios: out }, null, 1)}\n`;
if (CHECK) {
  const prev = readFileSync(OUT, 'utf8');
  if (prev !== text) {
    console.error('reveal_l12 vectors differ from the pin');
    process.exit(1);
  }
  console.log(`reveal_l12 vectors OK (${out.length} scenarios)`);
} else {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT, text);
  console.log(`wrote ${OUT} (${out.length} scenarios)`);
}
