'use strict';
/**
 * mint-capital-only-test.cjs -- R-WEB-MINT-CAPITAL-ONLY-Q1 (odp. 8A, 2026-11-26).
 *
 * Kontrakt: bonus Mennicy (Waluta+Mennica) liczy się RAZ na cywilizację i TYLKO z Mennicy
 * stojącej w aktualnej stolicy właściciela (heurystyka isCapital = pierwsze miasto ownera).
 * Mennica poza stolicą (po przeniesieniu/utracie stolicy) nie daje bonusu.
 *
 * Run from gra/:  node tools/mint-capital-only-test.cjs
 * Bundluje turn-economy.ts z esbuild (jak waluta-mennica-test.cjs).
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[mint-capital-only-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.mint-capital-only-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.mint-capital-only-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { ownersWithMennica, setOwnerCapitalCityResolver } from '../src/game/turn-economy';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[mint-capital-only-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const ownersWithMennica = M.ownersWithMennica;
const setOwnerCapitalCityResolver = M.setOwnerCapitalCityResolver;

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail !== undefined ? ' -- ' + detail : '')); }
}
function setOf(s) { return [...s].sort((a, b) => a - b); }
function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// Miasta: owner 0 ma stolicę c0 (pierwsze), c1 regionalne; owner 1 ma c2 (stolica), c3.
const cities = [
  { id: 'c0', ownerId: 0 },
  { id: 'c1', ownerId: 0 },
  { id: 'c2', ownerId: 1 },
  { id: 'c3', ownerId: 1 },
];

console.log('mint-capital-only-test (R-WEB-MINT-CAPITAL-ONLY-Q1)');

// 1. Mennica w stolicy -> bonus dla właściciela.
{
  const built = new Map([['c0', ['mennica']]]);
  check('bonus z Mennicy w stolicy', eq(setOf(ownersWithMennica(cities, built)), [0]),
    JSON.stringify(setOf(ownersWithMennica(cities, built))));
}

// 2. Mennica poza stolicą (c1) -> brak bonusu.
{
  const built = new Map([['c1', ['mennica']]]);
  check('brak bonusu: Mennica poza stolicą nie działa', ownersWithMennica(cities, built).size === 0);
}

// 3. Stolica PRZENIESIONA: resolver (źródło prawdy = capitalCityIdForOwner w grze) wskazuje c1.
//    Osierocona Mennica w c0 (dawna stolica) nie daje bonusu. Heurystyka „pierwsze miasto"
//    dałaby tu bonus -- test wymusza, że silnik używa resolvera, a nie kolejności tablicy.
setOwnerCapitalCityResolver((oid) => (oid === 0 ? 'c1' : oid === 1 ? 'c2' : null));
{
  const built = new Map([['c0', ['mennica']]]);
  check('po przeniesieniu stolicy: osierocona Mennica (stara stolica) nie daje bonusu',
    ownersWithMennica(cities, built).size === 0);
  const both = new Map([['c0', ['mennica']], ['c1', ['mennica']]]);
  check('po przeniesieniu stolicy: Mennica w nowej stolicy daje bonus (raz, mimo dwóch Mennic)',
    eq(setOf(ownersWithMennica(cities, both)), [0]));
  const onlyNew = new Map([['c1', ['mennica']]]);
  check('po przeniesieniu stolicy: sama nowa Mennica daje bonus',
    eq(setOf(ownersWithMennica(cities, onlyNew)), [0]));
}

// 4. Dwie cywilizacje, każda z Mennicą w swojej stolicy -> po jednym bonusie na owner.
setOwnerCapitalCityResolver((oid) => (oid === 0 ? 'c0' : oid === 1 ? 'c2' : null));
{
  const built = new Map([['c0', ['mennica']], ['c2', ['mennica']]]);
  check('dwa owner-y z Mennicą w stolicy -> oba', eq(setOf(ownersWithMennica(cities, built)), [0, 1]));
}

// 5. Resolver ustawia stolicę c0; Mennica tylko w c1 (regionalne) -> brak bonusu.
//    Sprawdza, że implementacja nie wraca do heurystyki „pierwsze miasto" (która dałaby też c1 tylko
//    gdyby c1 było pierwsze; tu test pada, jeśli ktoś usunie gałąź resolvera).
setOwnerCapitalCityResolver((oid) => (oid === 0 ? 'c0' : oid === 1 ? 'c2' : null));
{
  const built = new Map([['c1', ['mennica']]]);
  check('resolver: Mennica w mieście regionalnym nie daje bonusu', ownersWithMennica(cities, built).size === 0);
}

// 6. Brak resolvera (testy/stare wywołania) = heurystyka: pierwsze miasto ownera.
setOwnerCapitalCityResolver(null);
{
  const built = new Map([['c0', ['mennica']]]);
  check('bez resolvera: heurystyka (pierwsze miasto) daje bonus', eq(setOf(ownersWithMennica(cities, built)), [0]));
}
setOwnerCapitalCityResolver(null);

console.log('');
console.log('mint-capital-only-test: ' + pass + ' PASS / ' + fail + ' FAIL');
try { fs.unlinkSync(ENTRY_FILE); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
