'use strict';
/**
 * split-output-test.cjs -- standalone Node test for splitOutput in production.ts
 * Run from gra/:  node tools/split-output-test.cjs
 *
 * Bundles production.ts (+ its deps) via esbuild, then runs assertions.
 * Pure logic only -- no DOM, no THREE.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[split-output-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.split-output-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.split-output-bundle.cjs');

const ENTRY_TS = `
export {
  splitOutput,
  cityScienceOutput,
  cityMoneyOutput,
  DEFAULT_OUTPUT_SHARES,
} from '../src/game/production';
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
  console.error('[split-output-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const { splitOutput, cityScienceOutput, cityMoneyOutput, DEFAULT_OUTPUT_SHARES } = M;

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

function approxEq(a, b, msg, eps) {
  eps = eps === undefined ? 1e-9 : eps;
  if (Math.abs(a - b) <= eps) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + ' -- got ' + a + ', expected ~' + b); }
}

console.log('\n[split-output-test] Running tests...\n');

// --- Test 1: DEFAULT_OUTPUT_SHARES wartosci i ich suma ----------------------
console.log('1. DEFAULT_OUTPUT_SHARES wartosci');
approxEq(DEFAULT_OUTPUT_SHARES.produkcja, 0.4, 'DEFAULT produkcja = 0.4');
approxEq(DEFAULT_OUTPUT_SHARES.pieniadz,  0.3, 'DEFAULT pieniadz = 0.3');
approxEq(DEFAULT_OUTPUT_SHARES.nauka,     0.2, 'DEFAULT nauka = 0.2');
approxEq(DEFAULT_OUTPUT_SHARES.rozwoj,    0.1, 'DEFAULT rozwoj = 0.1');
approxEq(
  DEFAULT_OUTPUT_SHARES.produkcja + DEFAULT_OUTPUT_SHARES.pieniadz +
  DEFAULT_OUTPUT_SHARES.nauka + DEFAULT_OUTPUT_SHARES.rozwoj,
  1.0,
  'DEFAULT shares sumuja sie do 1.0'
);

// --- Test 2: suma strumieni == total (domyslne udzialy) ---------------------
console.log('\n2. Suma strumieni == total');
const r100 = splitOutput(100);
eq(r100.produkcja + r100.pieniadz + r100.nauka + r100.rozwoj, 100,
   'splitOutput(100) -> suma == 100');

const r7 = splitOutput(7);
eq(r7.produkcja + r7.pieniadz + r7.nauka + r7.rozwoj, 7,
   'splitOutput(7) -> suma == 7 (zaokraglenie)');

const r1 = splitOutput(1);
eq(r1.produkcja + r1.pieniadz + r1.nauka + r1.rozwoj, 1,
   'splitOutput(1) -> suma == 1');

const r999 = splitOutput(999);
eq(r999.produkcja + r999.pieniadz + r999.nauka + r999.rozwoj, 999,
   'splitOutput(999) -> suma == 999');

// --- Test 3: domyslne udzialy daja oczekiwane wartosci (total=100) ----------
console.log('\n3. Domyslne udzialy: total=100 -> 40/30/20/10');
eq(r100.produkcja, 40, 'produkcja = 40');
eq(r100.pieniadz,  30, 'pieniadz = 30');
eq(r100.nauka,     20, 'nauka = 20');
eq(r100.rozwoj,    10, 'rozwoj = 10');

// --- Test 4: shares nienormalizowane -> przeskalowane -----------------------
console.log('\n4. Shares nienormalizowane (suma != 1) -> przeskalowane');
// Udzialy {4,3,2,1} powinny byc identyczne jak {0.4,0.3,0.2,0.1}
const r100b = splitOutput(100, { produkcja: 4, pieniadz: 3, nauka: 2, rozwoj: 1 });
eq(r100b.produkcja + r100b.pieniadz + r100b.nauka + r100b.rozwoj, 100,
   'suma == 100 dla shares {4,3,2,1}');
eq(r100b.produkcja, 40, 'produkcja = 40 (nienorm. {4,3,2,1})');
eq(r100b.pieniadz,  30, 'pieniadz = 30 (nienorm.)');
eq(r100b.nauka,     20, 'nauka = 20 (nienorm.)');
eq(r100b.rozwoj,    10, 'rozwoj = 10 (nienorm.)');

// --- Test 5: total=0 / ujemny / NaN -> same zera ----------------------------
console.log('\n5. total=0 / ujemny / NaN -> same zera');
const r0 = splitOutput(0);
eq(r0.produkcja, 0, 'total=0 -> produkcja=0');
eq(r0.pieniadz,  0, 'total=0 -> pieniadz=0');
eq(r0.nauka,     0, 'total=0 -> nauka=0');
eq(r0.rozwoj,    0, 'total=0 -> rozwoj=0');

const rNeg = splitOutput(-10);
eq(rNeg.produkcja + rNeg.pieniadz + rNeg.nauka + rNeg.rozwoj, 0,
   'total=-10 -> suma==0');

const rNaN = splitOutput(NaN);
eq(rNaN.produkcja + rNaN.pieniadz + rNaN.nauka + rNaN.rozwoj, 0,
   'total=NaN -> suma==0');

const rInf = splitOutput(Infinity);
eq(rInf.produkcja + rInf.pieniadz + rInf.nauka + rInf.rozwoj, 0,
   'total=Infinity -> suma==0');

// --- Test 6: fallback gdy wszystkie udzialy = 0 -> calosc do produkcja ------
console.log('\n6. Fallback: wszystkie shares=0 -> calosc do produkcja');
const rFallback = splitOutput(50, { produkcja: 0, pieniadz: 0, nauka: 0, rozwoj: 0 });
eq(rFallback.produkcja, 50, 'produkcja=50 gdy shares={0,0,0,0}');
eq(rFallback.pieniadz,  0,  'pieniadz=0');
eq(rFallback.nauka,     0,  'nauka=0');
eq(rFallback.rozwoj,    0,  'rozwoj=0');

// --- Test 7: PURE -- wejscie nie jest mutowane -------------------------------
console.log('\n7. Pure -- wejscia nie sa mutowane');
const sharesInput = { produkcja: 0.5, pieniadz: 0.2, nauka: 0.2, rozwoj: 0.1 };
const sharesBefore = JSON.stringify(sharesInput);
splitOutput(80, sharesInput);
eq(JSON.stringify(sharesInput), sharesBefore, 'shares nie zmutowane');

// --- Test 8: cityScienceOutput i cityMoneyOutput ----------------------------
console.log('\n8. cityScienceOutput i cityMoneyOutput');
eq(cityScienceOutput(100), 20, 'cityScienceOutput(100) = 20 (default 0.2)');
eq(cityMoneyOutput(100),   30, 'cityMoneyOutput(100) = 30 (default 0.3)');
eq(cityScienceOutput(0),    0, 'cityScienceOutput(0) = 0');
eq(cityMoneyOutput(0),      0, 'cityMoneyOutput(0) = 0');

// shares z nadwaga nauki = 1.0 -> calosc do nauki
const scienceAll = cityScienceOutput(50, { produkcja: 0, pieniadz: 0, nauka: 1, rozwoj: 0 });
eq(scienceAll, 50, 'cityScienceOutput(50, nauka=1) = 50');

// --- Test 9: NaN/ujemne udzialy traktowane jako 0 ---------------------------
console.log('\n9. NaN i ujemne shares traktowane jako 0');
const rNaNShare = splitOutput(100, { produkcja: NaN, pieniadz: 0.5, nauka: 0.5, rozwoj: 0 });
eq(rNaNShare.produkcja + rNaNShare.pieniadz + rNaNShare.nauka + rNaNShare.rozwoj, 100,
   'NaN udzial traktowany jako 0; suma==100');
assert(rNaNShare.produkcja === 0, 'NaN share produkcja -> 0');

const rNegShare = splitOutput(100, { produkcja: -1, pieniadz: 0.5, nauka: 0.5, rozwoj: 0 });
eq(rNegShare.produkcja + rNegShare.pieniadz + rNegShare.nauka + rNegShare.rozwoj, 100,
   'ujemny udzial traktowany jako 0; suma==100');

// --- Test 10: rozne wartosci total (calkowite + ulamkowe) -------------------
console.log('\n10. Suma zawsze == total dla roznych wartosci');
for (const t of [1, 2, 3, 5, 10, 13, 100, 1000]) {
  const r = splitOutput(t);
  eq(r.produkcja + r.pieniadz + r.nauka + r.rozwoj, t, 'suma == ' + t);
}

// --- summary ---------------------------------------------------------------
const total = passed + failed;
if (failed === 0) {
  console.log('\nSPLIT-OUTPUT OK (' + passed + '/' + total + ')');
} else {
  console.log('\nSPLIT-OUTPUT FAIL (' + passed + '/' + total + ' passed, ' + failed + ' failed)');
}

// Clean up temp artifacts
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed === 0 ? 0 : 1);
