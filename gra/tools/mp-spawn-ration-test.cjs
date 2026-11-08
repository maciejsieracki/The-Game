'use strict';
/**
 * mp-spawn-ration-test.cjs — P-MP-SPAWN-WYZYWIENIE
 * Nowe miasta (foundCity/foundCityAt) startują z Wyżywieniem 4 (DEFAULT_POZIOM_RACJI),
 * nie z legacy migrate(procentRozwoj:100)→6.
 * Run: node tools/mp-spawn-ration-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.mp-spawn-ration-entry.ts');
const BUNDLE = path.resolve(__dirname, '.mp-spawn-ration-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { foundCityAt, DEFAULT_PROCENT_ROZWOJ } from '../src/game/cities';
export {
  DEFAULT_POZIOM_RACJI,
  getCityRationLevel,
  migrateProcentRozwojToPoziomRacji,
} from '../src/game/population-growth-v85';
export { generateMap } from '../src/map/generator';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
  loader: { '.ts': 'ts', '.json': 'json' },
});

const M = require(BUNDLE);
let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}
function eq(a, b, label) {
  ok(a === b, `${label} (got ${a}, want ${b})`);
}

const map = M.generateMap(24, 24, 424242);
const cities = [];

function findLandHex() {
  for (const [key, hex] of Object.entries(map.hexes)) {
    const t = hex.terenBazowy;
    if (t !== 'morze' && t !== 'plytkie_morze' && t !== 'gory') {
      const [q, r] = key.split(',').map(Number);
      return { q, r };
    }
  }
  throw new Error('no land hex');
}

function nextHex(offset) {
  const { q, r } = findLandHex();
  return { q: q + offset * 8, r: r + offset * 8 };
}

console.log('--- T1: foundCityAt MP (foundingCityState=true) → Wyżywienie 4 ---');
{
  const pos = nextHex(0);
  const city = M.foundCityAt(pos.q, pos.r, 3, cities, map, 'Sparta', true);
  ok(city !== null, 'T1a: foundCityAt zwraca miasto');
  if (city) {
    cities.push(city);
    eq(city.poziomRacji, M.DEFAULT_POZIOM_RACJI, 'T1b: jawne poziomRacji=4');
    eq(M.getCityRationLevel(city), 4, 'T1c: getCityRationLevel=4');
    ok(city.startCityState === true, 'T1d: startCityState');
  }
}

console.log('\n--- T2: foundCityAt major AI (bez CS) → Wyżywienie 4 ---');
{
  const pos = nextHex(1);
  const city = M.foundCityAt(pos.q, pos.r, 1, cities, map, 'Ateny', false);
  ok(city !== null, 'T2a: foundCityAt major zwraca miasto');
  if (city) {
    cities.push(city);
    eq(city.poziomRacji, 4, 'T2b: poziomRacji=4');
    eq(M.getCityRationLevel(city), 4, 'T2c: getCityRationLevel=4');
  }
}

console.log('\n--- T3: foundCityAt gracz → Wyżywienie 4 ---');
{
  const pos = nextHex(2);
  const city = M.foundCityAt(pos.q, pos.r, 0, cities, map, 'Memfis');
  ok(city !== null, 'T3a: foundCityAt gracz zwraca miasto');
  if (city) {
    eq(city.poziomRacji, 4, 'T3b: poziomRacji=4');
    eq(M.getCityRationLevel(city), 4, 'T3c: getCityRationLevel=4');
  }
}

console.log('\n--- T4: legacy migrate procentRozwoj:100 bez poziomRacji → 6 (stare save) ---');
{
  const legacy = { id: 'legacy', ownerId: 3, procentRozwoj: M.DEFAULT_PROCENT_ROZWOJ };
  eq(M.migrateProcentRozwojToPoziomRacji(legacy.procentRozwoj), 6, 'T4a: legacy 100→6');
  eq(M.getCityRationLevel(legacy), 6, 'T4b: getCityRationLevel bez poziomRacji=6');
  ok(legacy.poziomRacji === undefined, 'T4c: legacy nie ma jawnego poziomRacji');
}

console.log('\n--- T5: jawne poziomRacji=4 ma pierwszeństwo nad procentRozwoj:100 ---');
{
  const mixed = { id: 'mix', ownerId: 1, procentRozwoj: 100, poziomRacji: 4 };
  eq(M.getCityRationLevel(mixed), 4, 'T5: poziomRacji wygrywa nad procentRozwoj');
}

console.log(`\n=== mp-spawn-ration-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
