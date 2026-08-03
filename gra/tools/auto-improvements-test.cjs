'use strict';
/**
 * auto-improvements-test.cjs — picker wspólny gracz+AI (game/auto-improvements.ts).
 * Run from gra/:  node tools/auto-improvements-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[auto-improvements-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.auto-improvements-test-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.auto-improvements-test-bundle.cjs');

const ENTRY_TS = `
export {
  pickAutoImprovements,
  prioritiesForUlepszeniaFocus,
} from ${JSON.stringify(SRC + '/game/auto-improvements')};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[auto-improvements-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const { pickAutoImprovements } = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

function makeFlatMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      const k = `${q},${r}`;
      hexes[k] = {
        coords: { q, r },
        terenBazowy: 'rownina',
        nakladka: 'brak',
        ulepszenie: 'brak',
        wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
}

function makeHillMap(w, h) {
  const m = makeFlatMap(w, h);
  for (const hex of Object.values(m.hexes)) hex.terenBazowy = 'wzgorza';
  return m;
}

function makeCity(id, ownerId, q, r, population = 2, extra = {}) {
  return { id, ownerId, q, r, name: 'TestCity', population, ...extra };
}

function baseOpts(city, map) {
  return {
    cities: [city],
    ownerId: city.ownerId,
    map,
    territoryNodes: [{ q: city.q, r: city.r, pop: city.population, level: 1, ownerId: city.ownerId }],
    placedImprovements: new Map(),
    pracaAvailable: 200,
    unlockedTechs: new Set(['Rolnictwo', 'Kamieniarstwo']),
    pracaSurplusThreshold: 0,
    skipWyrab: true,
    civArchetype: 'grecy',
  };
}

// 1. focus zywnosc prefers farm over mine when both qualify
console.log('1. focus zywnosc — farma przed kamieniolom');
{
  const map = makeFlatMap(20, 20);
  // heks (16,15) rownina — farma; (17,15) wzgorza — kamieniolom
  map.hexes['17,15'].terenBazowy = 'wzgorza';
  const city = makeCity('c1', 0, 15, 15, 3, { ulepszeniaFocus: 'zywnosc' });
  const picks = pickAutoImprovements(baseOpts(city, map));
  eq(picks.length, 1, 'jedno ulepszenie');
  eq(picks[0].key, 'farma', 'zywnosc wybiera farme zamiast kamieniolomu');
}

// 2. onlyWorked=true skips unworked qualifying hex
console.log('2. onlyWorked=true — pomija nieobrabiane');
{
  const map = makeFlatMap(20, 20);
  const city = makeCity('c2', 0, 10, 10, 1, {
    ulepszeniaFocus: 'zywnosc',
    ulepszeniaOnlyWorked: true,
  });
  const opts = baseOpts(city, map);
  opts.getOnlyWorked = c => c.ulepszeniaOnlyWorked ?? false;
  opts.getWorkedHexKeys = () => new Set(['11,10']); // tylko jeden hex worked, nie (10,10) centrum
  const picks = pickAutoImprovements(opts);
  eq(picks.length, 1, 'znajduje ulepszenie na worked');
  eq(picks[0].q, 11, 'wybiera worked hex 11,10');
  eq(picks[0].r, 10, 'wybiera worked hex 11,10');
}

// 3. onlyWorked=false can pick unworked
console.log('3. onlyWorked=false — moze nieobrabiane');
{
  const map = makeFlatMap(20, 20);
  const city = makeCity('c3', 0, 10, 10, 1, {
    ulepszeniaFocus: 'zywnosc',
    ulepszeniaOnlyWorked: false,
  });
  const opts = baseOpts(city, map);
  opts.getOnlyWorked = c => c.ulepszeniaOnlyWorked ?? false;
  opts.getWorkedHexKeys = () => new Set(['99,99']); // zaden realny hex
  const picks = pickAutoImprovements(opts);
  eq(picks.length, 1, 'bez filtra worked — kwalifikujacy hex');
}

// 4. max 1 per city
console.log('4. max 1 per city');
{
  const map = makeFlatMap(30, 30);
  const city = makeCity('c4', 0, 15, 15, 4, { ulepszeniaFocus: 'zywnosc' });
  const picks = pickAutoImprovements(baseOpts(city, map));
  eq(picks.length, 1, 'maks 1 ulepszenie na miasto');
}

// 5. wyrab skipped when skipWyrab
console.log('5. skipWyrab — brak wyrab');
{
  const map = makeFlatMap(20, 20);
  for (const hex of Object.values(map.hexes)) hex.nakladka = 'las';
  const city = makeCity('c5', 0, 10, 10, 3, { ulepszeniaFocus: 'zrownowazone' });
  const opts = baseOpts(city, map);
  opts.skipWyrab = true;
  opts.unlockedTechs = new Set(); // wyrab bez tech — ale skipWyrab i tak wycina
  const picks = pickAutoImprovements(opts);
  eq(picks.length, 0, 'skipWyrab — zero ulepszen na samej lesie');
  const hasWyrab = picks.some(p => p.key === 'wyrab');
  eq(hasWyrab, false, 'brak wyrab w wyniku');
}

// 6. surowce focus picks mine on hills
console.log('6. focus surowce — kamieniolom na wzgorzach');
{
  const map = makeHillMap(20, 20);
  const city = makeCity('c6', 0, 10, 10, 3, { ulepszeniaFocus: 'surowce' });
  const opts = baseOpts(city, map);
  opts.unlockedTechs = new Set(['Murarstwo']);
  const picks = pickAutoImprovements(opts);
  eq(picks.length, 1, 'jedno ulepszenie surowcowe');
  eq(picks[0].key, 'kamieniolom', 'surowce wybiera kamieniolom');
}

// 7. R-AUTO-ULEPSZENIA-Q2=B — getMaxPerCity = 2
console.log('7. getMaxPerCity=2');
{
  const map = makeFlatMap(30, 30);
  const city = makeCity('c7', 0, 15, 15, 5, { ulepszeniaFocus: 'zywnosc' });
  const opts = baseOpts(city, map);
  opts.getMaxPerCity = () => 2;
  opts.pracaAvailable = 200;
  const picks = pickAutoImprovements(opts);
  assert(picks.length === 2, `getMaxPerCity=2 → 2 picki (got ${picks.length})`);
}

// 8. getMaxPerCity = 3
console.log('8. getMaxPerCity=3');
{
  const map = makeFlatMap(30, 30);
  const city = makeCity('c8', 0, 15, 15, 6, { ulepszeniaFocus: 'zywnosc' });
  const opts = baseOpts(city, map);
  opts.getMaxPerCity = () => 3;
  opts.pracaAvailable = 300;
  const picks = pickAutoImprovements(opts);
  assert(picks.length === 3, `getMaxPerCity=3 → 3 picki (got ${picks.length})`);
}

console.log(`\nauto-improvements-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
