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
export { ownersWithMennica } from '../src/game/turn-economy';
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

// 3. Osierocona Mennica w c0, stolica zmieniona na c1 (zmiana kolejności miast) -> brak bonusu.
{
  const moved = [{ id: 'c1', ownerId: 0 }, { id: 'c0', ownerId: 0 }];
  const built = new Map([['c0', ['mennica']]]);
  check('po zmianie stolicy bonus znika do czasu zbudowania nowej',
    ownersWithMennica(moved, built).size === 0);
  // Nowa Mennica w nowej stolicy (c1) plus osierocona w c0 -> jeden bonus (owner 0).
  const both = new Map([['c0', ['mennica']], ['c1', ['mennica']]]);
  check('po zmianie stolicy: nowa Mennica w stolicy daje bonus (raz)',
    eq(setOf(ownersWithMennica(moved, both)), [0]));
}

// 4. Dwie Mennice w różnych miastach (obie w stolicach różnych ownerów) -> po jednym bonusie na owner.
{
  const built = new Map([['c0', ['mennica']], ['c2', ['mennica']]]);
  check('dwa owner-y z Mennicą w stolicy -> oba', eq(setOf(ownersWithMennica(cities, built)), [0, 1]));
}

// 5. Mutacja czerwona: stolica nie jest sprawdzana (wszystkie miasta) -> test wykrywa regresję.
{
  const allCitiesMutant = (cs, b) => {
    const owners = new Set();
    for (const c of cs) if ((b.get(c.id) ?? []).includes('mennica')) owners.add(c.ownerId);
    return owners;
  };
  const built = new Map([['c1', ['mennica']]]);
  check('mutacja (wszystkie miasta) jest czerwona na rdzeniu',
    allCitiesMutant(cities, built).size === 1 && ownersWithMennica(cities, built).size === 0);
}

console.log('');
console.log('mint-capital-only-test: ' + pass + ' PASS / ' + fail + ' FAIL');
try { fs.unlinkSync(ENTRY_FILE); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
