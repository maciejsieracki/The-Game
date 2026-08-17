#!/usr/bin/env node
/**
 * Test: adjustHandelSplit() zawsze zwraca sumę 100%.
 * Bug potwierdzony przez Evaluatora: gdy Nauka jest na capie 60% i zmienia się inne pole,
 * nadwyżka z capowania znika, suma spada poniżej 100%.
 *
 * Run from gra/: node tools/adjust-handel-split-suma-test.cjs
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[adjust-handel-split-suma-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE = path.resolve(__dirname, '.adjust-handel-split-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.adjust-handel-split-bundle.cjs');

const ENTRY_TS = `
import { adjustHandelSplit, MAX_PROCENT_NAUKA } from '../src/game/cities';
export { adjustHandelSplit, MAX_PROCENT_NAUKA };
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS);

// Kompiluj entry point z TS na CJS
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    outfile: BUNDLE_FILE,
    format: 'cjs',
    platform: 'node',
    external: [],
    logLevel: 'warning',
  });
} catch (e) {
  console.error('[adjust-handel-split-suma-test] esbuild failed:', e.message);
  process.exit(1);
} finally {
  try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
}

const { adjustHandelSplit, MAX_PROCENT_NAUKA } = require(BUNDLE_FILE);

try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}

// Debug: sprawdzenie czy funkcja istnieje i co robi
const debugResult = adjustHandelSplit(
  { procentPieniadz: 10, procentNauka: 60, procentLuksus: 30 },
  'procentLuksus',
  0
);
console.log('[DEBUG] Reprodukcja Evaluatora test:');
console.log('  Input:', { procentPieniadz: 10, procentNauka: 60, procentLuksus: 30 });
console.log('  Changed:', 'procentLuksus, newVal: 0');
console.log('  Result:', debugResult);
console.log('  Expected: procentLuksus=0 or 30 (after redistribution), but got:', debugResult.procentLuksus);
console.log('');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`✗ ${name}`);
    console.error(`  ${e.message}`);
    failed++;
  }
}

function assertSumaEquals100(result, scenario) {
  const suma = result.procentPieniadz + result.procentNauka + result.procentLuksus;
  assert.strictEqual(
    suma, 100,
    `${scenario}: suma=${suma} (powinno być 100%), result=${JSON.stringify(result)}`
  );
}

// Test 1: Reprodukcja z raportu Evaluatora
// current={pieniadz:10, nauka:60, luksus:30}, zmiana procentLuksus na 0
test('Reprodukcja Evaluatora: nauka 60 (cap), luksus zmiana 30→0', () => {
  const result = adjustHandelSplit(
    { procentPieniadz: 10, procentNauka: 60, procentLuksus: 30 },
    'procentLuksus',
    0
  );
  assertSumaEquals100(result, 'Reprodukcja Evaluatora');
  // Rozsądna redystrybucja: Nauka zostaje na capie 60, Pieniądz bierze resztę
  assert.strictEqual(result.procentNauka, 60, 'Nauka powinna być na capie 60');
  assert.strictEqual(result.procentLuksus, 0, 'Luksus zmieniony na 0');
  assert.strictEqual(result.procentPieniadz, 40, 'Pieniądz = 40 (100-60-0)');
});

// Test 2: Nauka na capie, zmiana Pieniądza
test('Nauka na capie 60, zmiana Pieniądza 30→10', () => {
  const result = adjustHandelSplit(
    { procentPieniadz: 30, procentNauka: 60, procentLuksus: 10 },
    'procentPieniadz',
    10
  );
  assertSumaEquals100(result, 'Zmiana Pieniądza');
  assert.strictEqual(result.procentNauka, 60, 'Nauka powinna być na capie');
  assert.strictEqual(result.procentPieniadz, 10, 'Pieniądz zmieniony');
});

// Test 3: Nauka poniżej capu, zmiana innego pola
test('Nauka poniżej capu 50, zmiana Luksusa 30→40', () => {
  const result = adjustHandelSplit(
    { procentPieniadz: 20, procentNauka: 50, procentLuksus: 30 },
    'procentLuksus',
    40
  );
  assertSumaEquals100(result, 'Nauka poniżej capu, zmiana Luksusa');
  // Nauka powinnia zostać redystrybuowana (poniżej capu, nie powinno być problemu)
  assert(result.procentNauka <= 100, 'Nauka <= 100');
});

// Test 4: Zmiana bezpośrednio suwaka Nauki, cap powinien działać
test('Bezpośrednia zmiana Nauki 50→70, cap na 60', () => {
  const result = adjustHandelSplit(
    { procentPieniadz: 30, procentNauka: 50, procentLuksus: 20 },
    'procentNauka',
    70
  );
  assertSumaEquals100(result, 'Bezpośrednia zmiana Nauki z cap');
  assert.strictEqual(result.procentNauka, 60, 'Nauka powinna być ocapowana na 60');
});

// Test 5: Nauka już na capie 60, zmiana Pieniądza — cap nie powinien zmienić nic
test('Nauka na capie 60, zmiana Pieniądza 20→30 (cap idle)', () => {
  const result = adjustHandelSplit(
    { procentPieniadz: 20, procentNauka: 60, procentLuksus: 20 },
    'procentPieniadz',
    30
  );
  assertSumaEquals100(result, 'Cap idle, bez zmian');
  assert.strictEqual(result.procentNauka, 60, 'Nauka powinna zostać 60');
  assert.strictEqual(result.procentPieniadz, 30, 'Pieniądz zmieniony');
});

// Test 6: Ekstremum — wszystko na jednym polu
test('Ekstremum: wszystko na Pieniazie 100', () => {
  const result = adjustHandelSplit(
    { procentPieniadz: 20, procentNauka: 40, procentLuksus: 40 },
    'procentPieniadz',
    100
  );
  assertSumaEquals100(result, 'Ekstremum 100 na Pieniazie');
  assert.strictEqual(result.procentPieniadz, 100, 'Pieniądz = 100');
  assert.strictEqual(result.procentNauka, 0, 'Nauka = 0 (pozostałe zmniejszone)');
  assert.strictEqual(result.procentLuksus, 0, 'Luksus = 0 (pozostałe zmniejszone)');
});

// Test 7: Zmiana Nauki poniżej capu, a potem zmiana innego pola i cap
test('Kombinacja: Nauka 50→70 (cap do 60), potem zmiana Luksusa', () => {
  let result = adjustHandelSplit(
    { procentPieniadz: 30, procentNauka: 50, procentLuksus: 20 },
    'procentNauka',
    70
  );
  assertSumaEquals100(result, 'Krok 1: cap Nauki');
  assert.strictEqual(result.procentNauka, 60);

  // Teraz zmiana Luksusa na nowym stanie
  result = adjustHandelSplit(result, 'procentLuksus', 10);
  assertSumaEquals100(result, 'Krok 2: zmiana Luksusa z Nauką na capie');
});

// Test 8: Wiele zmian w ciągu — każda powinna zachować sumę 100
test('Sekwencja zmian: P→L→N→L', () => {
  let state = { procentPieniadz: 33, procentNauka: 33, procentLuksus: 34 };

  state = adjustHandelSplit(state, 'procentPieniadz', 50);
  assertSumaEquals100(state, 'Zmiana 1: Pieniądz');

  state = adjustHandelSplit(state, 'procentLuksus', 20);
  assertSumaEquals100(state, 'Zmiana 2: Luksus');

  state = adjustHandelSplit(state, 'procentNauka', 70); // cap na 60
  assertSumaEquals100(state, 'Zmiana 3: Nauka z cap');

  state = adjustHandelSplit(state, 'procentLuksus', 30);
  assertSumaEquals100(state, 'Zmiana 4: Luksus (cap Nauki powinien działać)');
});

console.log(`\n---\nWyniki: ${passed} pass, ${failed} fail`);
if (failed > 0) {
  process.exit(1);
}
