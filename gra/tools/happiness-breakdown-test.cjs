'use strict';
/**
 * happiness-breakdown-test.cjs -- standalone Node test for happinessBreakdown in order.ts
 * Run from gra/:  node tools/happiness-breakdown-test.cjs
 *
 * Bundles order.ts (+ its deps) via esbuild, then runs assertions.
 * Pure logic only -- no DOM, no THREE.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[happiness-breakdown-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.happiness-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.happiness-bundle.cjs');

const ENTRY_TS = `
export { happinessBreakdown } from '../src/game/order';
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
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[happiness-breakdown-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const { happinessBreakdown } = M;

// --- test harness ----------------------------------------------------------
let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else       { failed++; console.error('  [FAIL] ' + msg); }
}

function eq(a, b, msg) {
  if (a === b) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + ' -- got ' + JSON.stringify(a) + ', expected ' + JSON.stringify(b)); }
}

console.log('\n[happiness-breakdown-test] Running tests...\n');

// Helper: sprawdz ze wynik sumuje sie do population
function assertSum(pop, hap, desc) {
  const r = happinessBreakdown(pop, hap);
  const sum = r.zadowoleni + r.kontentni + r.niezadowoleni;
  eq(sum, pop <= 0 ? 0 : Math.floor(pop), desc + ': suma == population');
}

// --- Test 1: population <= 0 / NaN -> same zera ----------------------------
console.log('1. population <= 0 / NaN -> same zera');
const r0 = happinessBreakdown(0, 5);
eq(r0.zadowoleni, 0, 'pop=0: zadowoleni=0');
eq(r0.kontentni, 0, 'pop=0: kontentni=0');
eq(r0.niezadowoleni, 0, 'pop=0: niezadowoleni=0');

const rNeg = happinessBreakdown(-5, 5);
eq(rNeg.zadowoleni + rNeg.kontentni + rNeg.niezadowoleni, 0, 'pop=-5 -> suma==0');

const rNaN = happinessBreakdown(NaN, 5);
eq(rNaN.zadowoleni + rNaN.kontentni + rNaN.niezadowoleni, 0, 'pop=NaN -> suma==0');

// --- Test 2: szczescie=0 -> wszyscy kontentni --------------------------------
console.log('\n2. szczescie=0 -> wszyscy kontentni');
const rNeutral = happinessBreakdown(10, 0);
eq(rNeutral.zadowoleni, 0, 'szczescie=0 -> zadowoleni=0');
eq(rNeutral.niezadowoleni, 0, 'szczescie=0 -> niezadowoleni=0');
eq(rNeutral.kontentni, 10, 'szczescie=0 -> kontentni=10');

// --- Test 3: dodatnie szczescie przesuwa do zadowoleni ----------------------
console.log('\n3. Dodatnie szczescie -> zadowoleni > 0');
const rPos = happinessBreakdown(10, 10);
assert(rPos.zadowoleni > 0, 'szczescie=+10 -> zadowoleni > 0');
eq(rPos.niezadowoleni, 0, 'szczescie=+10 -> niezadowoleni = 0');
eq(rPos.zadowoleni + rPos.kontentni + rPos.niezadowoleni, 10, 'suma == 10');

// --- Test 4: ujemne szczescie przesuwa do niezadowoleni ---------------------
console.log('\n4. Ujemne szczescie -> niezadowoleni > 0');
const rNegH = happinessBreakdown(10, -10);
assert(rNegH.niezadowoleni > 0, 'szczescie=-10 -> niezadowoleni > 0');
eq(rNegH.zadowoleni, 0, 'szczescie=-10 -> zadowoleni = 0');
eq(rNegH.zadowoleni + rNegH.kontentni + rNegH.niezadowoleni, 10, 'suma == 10');

// --- Test 5: symetria: +szczescie vs -szczescie (zadowoleni <-> niezadowoleni)
console.log('\n5. Symetria: +szczescie i -szczescie zamienione grupy');
const rSym5p = happinessBreakdown(10, 5);
const rSym5m = happinessBreakdown(10, -5);
eq(rSym5p.zadowoleni, rSym5m.niezadowoleni,
   'pop=10: zadowoleni(+5) == niezadowoleni(-5)');
eq(rSym5p.niezadowoleni, rSym5m.zadowoleni,
   'pop=10: niezadowoleni(+5) == zadowoleni(-5)');

// --- Test 6: suma zawsze == population --------------------------------------
console.log('\n6. Suma zawsze == population');
for (const [pop, hap] of [
  [1, 0], [1, 100], [1, -100],
  [10, 5], [10, -5], [100, 0], [7, 3], [7, -3],
  [20, 20], [20, -20]
]) {
  assertSum(pop, hap, 'pop=' + pop + ' hap=' + hap);
}

// --- Test 7: szczescie >= MAX_HAP -> prawie wszyscy zadowoleni ---------------
console.log('\n7. Bardzo wysokie szczescie -> max zadowoleni');
const rMax = happinessBreakdown(10, 1000);
eq(rMax.niezadowoleni, 0, 'szczescie=1000 -> niezadowoleni=0');
eq(rMax.zadowoleni, 10, 'szczescie=1000 -> zadowoleni=10 (cala populacja)');
eq(rMax.kontentni, 0, 'szczescie=1000 -> kontentni=0');

// --- Test 8: szczescie <= -MAX_HAP -> prawie wszyscy niezadowoleni ----------
console.log('\n8. Bardzo ujemne szczescie -> max niezadowoleni');
const rMin = happinessBreakdown(10, -1000);
eq(rMin.zadowoleni, 0, 'szczescie=-1000 -> zadowoleni=0');
eq(rMin.niezadowoleni, 10, 'szczescie=-1000 -> niezadowoleni=10');
eq(rMin.kontentni, 0, 'szczescie=-1000 -> kontentni=0');

// --- Test 9: NaN szczescie -> wszyscy kontentni (jak szczescie=0) ------------
console.log('\n9. szczescie=NaN -> traktowane jak 0');
const rNaNH = happinessBreakdown(10, NaN);
eq(rNaNH.zadowoleni, 0, 'szczescie=NaN -> zadowoleni=0');
eq(rNaNH.niezadowoleni, 0, 'szczescie=NaN -> niezadowoleni=0');
eq(rNaNH.kontentni, 10, 'szczescie=NaN -> kontentni=10');

// --- Test 10: deterministyczny (dwa identyczne wywolania -> identyczny wynik)
console.log('\n10. Deterministyczny');
const d1 = happinessBreakdown(20, 7);
const d2 = happinessBreakdown(20, 7);
eq(JSON.stringify(d1), JSON.stringify(d2), 'dwa wywolania -> identyczny wynik');

// --- Test 11: PURE -- wejscia nie sa mutowane --------------------------------
console.log('\n11. Pure -- wejscia nie sa mutowane');
const pop0 = 15;
const hap0 = 3;
happinessBreakdown(pop0, hap0);
eq(pop0, 15, 'population nie zmutowane');
eq(hap0, 3, 'szczescie nie zmutowane');

// --- summary ---------------------------------------------------------------
const total = passed + failed;
if (failed === 0) {
  console.log('\nHAPPINESS-BREAKDOWN OK (' + passed + '/' + total + ')');
} else {
  console.log('\nHAPPINESS-BREAKDOWN FAIL (' + passed + '/' + total + ' passed, ' + failed + ' failed)');
}

// Clean up temp artifacts
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed === 0 ? 0 : 1);
