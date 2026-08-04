'use strict';
/**
 * budowa-lista-szablony-test.cjs — migracja i helpery biblioteki list budowy
 * Run from gra/: node tools/budowa-lista-szablony-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch {
    console.error('[budowa-lista-szablony-test] esbuild not found');
    process.exit(1);
  }
})();

const ENTRY = path.resolve(__dirname, '.budowa-lista-entry.ts');
const BUNDLE = path.resolve(__dirname, '.budowa-lista-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  loadBudowaListaBiblioteka,
  dedupeBudowaLista,
  defaultBudowaListaNazwa,
} from '../src/game/cities';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[budowa-lista-szablony-test] bundle failed:', e.message || e);
  process.exit(1);
}

const {
  loadBudowaListaBiblioteka,
  dedupeBudowaLista,
  defaultBudowaListaNazwa,
} = require(BUNDLE);

let pass = 0;
let fail = 0;

function eq(actual, expected, label) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(`  ✗ ${label}`);
    console.error(`    expected: ${JSON.stringify(expected)}`);
    console.error(`    actual:   ${JSON.stringify(actual)}`);
  }
}

console.log('budowa-lista-szablony-test\n');

console.log('1. dedupeBudowaLista');
eq(dedupeBudowaLista(['koszary', 'spichlerz', 'koszary', '', 'spichlerz']), ['koszary', 'spichlerz'], 'usuwa duplikaty i puste');

console.log('\n2. defaultBudowaListaNazwa');
eq(defaultBudowaListaNazwa([]), 'Lista 1', 'pusta biblioteka -> Lista 1');
eq(defaultBudowaListaNazwa([{ id: 'a', nazwa: 'Lista 1', budynki: [] }]), 'Lista 2', 'pomija zajęte nazwy');

console.log('\n3. loadBudowaListaBiblioteka — migracja A/B/C');
const migrated = loadBudowaListaBiblioteka({
  budowaListaSzablony: {
    A: ['koszary'],
    B: [],
    C: ['spichlerz', 'stolarnia'],
  },
});
eq(migrated.length, 2, 'dwa niepuste sloty');
eq(migrated[0].nazwa, 'Lista A', 'slot A -> Lista A');
eq(migrated[0].budynki, ['koszary'], 'budynki A');
eq(migrated[1].nazwa, 'Lista C', 'slot C -> Lista C');
eq(migrated[1].budynki, ['spichlerz', 'stolarnia'], 'budynki C');

console.log('\n4. loadBudowaListaBiblioteka — nowy format');
const fresh = loadBudowaListaBiblioteka({
  budowaListaBiblioteka: [
    { id: 'x1', nazwa: 'Moja', budynki: ['port'] },
  ],
});
eq(fresh.length, 1, 'jeden szablon');
eq(fresh[0].nazwa, 'Moja', 'nazwa zachowana');
eq(fresh[0].budynki, ['port'], 'budynki zachowane');

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
