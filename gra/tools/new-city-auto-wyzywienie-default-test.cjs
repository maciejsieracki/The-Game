'use strict';
/**
 * new-city-auto-wyzywienie-default-test.cjs — R-NOWE-MIASTO-AUTOWYZYWIENIE-DOMYSLNIE.
 * Nowo założone/wybudowane miasto startuje z autoWyzywienie=true.
 * Stary zapis / istniejące miasto bez migracji na load.
 *
 * Uruchom z gra/: node tools/new-city-auto-wyzywienie-default-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[new-city-auto-wyzywienie-default-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.new-city-auto-wyzywienie-default-entry.ts');
const BUNDLE = path.resolve(__dirname, '.new-city-auto-wyzywienie-default-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  foundCity,
  foundCityAt,
  ensureCitySaveDefaults,
} from '../src/game/cities';
export { isCityAutoWyzywienieEnabled } from '../src/game/empire-food';
`,
  'utf8',
);

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[new-city-auto-wyzywienie-default-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('FAIL:', msg); }
}

function makeMap(q, r) {
  return { hexes: { [`${q},${r}`]: { terenBazowy: 0 } } };
}

function makeSettler(q, r, ownerId) {
  return { q, r, ownerId, typeId: 'osadnik', category: 'cywilna' };
}

// ---------------------------------------------------------------------------
// T1: foundCityAt gracz → autoWyzywienie=true
// ---------------------------------------------------------------------------
{
  const map = makeMap(0, 0);
  const city = M.foundCityAt(0, 0, 0, [], map, 'Memfis');
  ok(city !== null, 'T1a: foundCityAt gracz zwraca miasto');
  ok(city?.autoWyzywienie === true, `T1b: foundCityAt gracz autoWyzywienie=true (got ${city?.autoWyzywienie})`);
  ok(M.isCityAutoWyzywienieEnabled(city), 'T1c: isCityAutoWyzywienieEnabled gracz=true dla nowego miasta');
}

// ---------------------------------------------------------------------------
// T2: foundCityAt AI → autoWyzywienie=true (dane) + parytet isCityAutoWyzywienieEnabled
// ---------------------------------------------------------------------------
{
  const map = makeMap(2, 0);
  const city = M.foundCityAt(2, 0, 3, [], map, 'Sparta', false);
  ok(city !== null, 'T2a: foundCityAt AI zwraca miasto');
  ok(city?.autoWyzywienie === true, `T2b: foundCityAt AI autoWyzywienie=true (got ${city?.autoWyzywienie})`);
  ok(M.isCityAutoWyzywienieEnabled(city), 'T2c: isCityAutoWyzywienieEnabled AI=true (jak dotąd)');
}

// ---------------------------------------------------------------------------
// T3: foundCity (osadnik) → autoWyzywienie=true
// ---------------------------------------------------------------------------
{
  const map = makeMap(4, 0);
  const settler = makeSettler(4, 0, 0);
  const city = M.foundCity(settler, [], map, 'Ur');
  ok(city !== null, 'T3a: foundCity zwraca miasto');
  ok(city?.autoWyzywienie === true, `T3b: foundCity autoWyzywienie=true (got ${city?.autoWyzywienie})`);
}

// ---------------------------------------------------------------------------
// T4: ensureCitySaveDefaults NIE włącza autoWyzywienie dla legacy (brak pola)
// ---------------------------------------------------------------------------
{
  const legacy = {
    id: 'legacy1',
    ownerId: 0,
    q: 0,
    r: 0,
    name: 'Stare',
    population: 3,
  };
  M.ensureCitySaveDefaults(legacy);
  ok(legacy.autoWyzywienie === undefined, `T4a: legacy bez pola pozostaje undefined (got ${legacy.autoWyzywienie})`);
  ok(!M.isCityAutoWyzywienieEnabled(legacy), 'T4b: legacy bez pola → auto WYŁ dla gracza');
}

// ---------------------------------------------------------------------------
// T5: ensureCitySaveDefaults NIE nadpisuje jawnego autoWyzywienie=false
// ---------------------------------------------------------------------------
{
  const existingOff = {
    id: 'existing-off',
    ownerId: 0,
    q: 1,
    r: 0,
    name: 'Wyłączone',
    population: 2,
    autoWyzywienie: false,
  };
  M.ensureCitySaveDefaults(existingOff);
  ok(existingOff.autoWyzywienie === false, `T5a: istniejące miasto z false zachowuje false (got ${existingOff.autoWyzywienie})`);
  ok(!M.isCityAutoWyzywienieEnabled(existingOff), 'T5b: istniejące miasto z false → auto WYŁ');
}

// ---------------------------------------------------------------------------
// T6 (edge): istniejące miasto z autoWyzywienie=true zachowuje true po load defaults
// ---------------------------------------------------------------------------
{
  const existingOn = {
    id: 'existing-on',
    ownerId: 0,
    q: 2,
    r: 0,
    name: 'Włączone',
    population: 2,
    autoWyzywienie: true,
  };
  M.ensureCitySaveDefaults(existingOn);
  ok(existingOn.autoWyzywienie === true, `T6a: istniejące miasto z true zachowuje true (got ${existingOn.autoWyzywienie})`);
  ok(M.isCityAutoWyzywienieEnabled(existingOn), 'T6b: istniejące miasto z true → auto WŁ');
}

// ---------------------------------------------------------------------------
// T7 (edge): drugie nowe miasto w tej samej sesji founding — nadal true
// ---------------------------------------------------------------------------
{
  const map = {
    hexes: {
      '0,0': { terenBazowy: 0 },
      '6,0': { terenBazowy: 0 },
    },
  };
  const cities = [];
  const c1 = M.foundCityAt(0, 0, 0, cities, map, 'Miasto1');
  cities.push(c1);
  const c2 = M.foundCityAt(6, 0, 0, cities, map, 'Miasto2');
  ok(c1 !== null && c2 !== null, `T7a: oba foundCityAt zwracają miasto (c1=${!!c1}, c2=${!!c2})`);
  ok(c1?.autoWyzywienie === true && c2?.autoWyzywienie === true,
    `T7b: kolejne nowe miasto też true (got c1=${c1?.autoWyzywienie}, c2=${c2?.autoWyzywienie})`);
}

// cleanup bundle artifacts
try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }

console.log(`\nnew-city-auto-wyzywienie-default-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
