'use strict';
/**
 * P-REKRUTACJA-JEDNOSTEK-TYLKO-SKARBIEC-Q1=B — kapitulacja głodowa.
 *
 * Repro luki: resolveSiegeSurrender musi migrować legacy jednostki z kolejka[]
 * przed pozostawieniem przejętego miasta nowemu właścicielowi. Budynki zostają,
 * opłacona rekrutacja[] zostaje, a postęp wraca do starego właściciela dokładnie raz.
 *
 * Uruchomienie: z katalogu gra: node tools/surrender-rekrutacja-build-gate-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_ROOT, 'src', 'main.ts');
const ENTRY = path.resolve(__dirname, '.surrender-rekrutacja-entry.ts');
const BUNDLE = path.resolve(__dirname, '.surrender-rekrutacja-bundle.cjs');

fs.writeFileSync(ENTRY, `
  export { sanitizeBuildQueue } from '../src/game/production';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (error) {
  console.error('[surrender-rekrutacja-build-gate-test] bundling failed:', error.message || error);
  process.exit(1);
}

const { sanitizeBuildQueue } = require(BUNDLE);
const mainSource = fs.readFileSync(MAIN_TS, 'utf8');

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) passed++;
  else {
    failed++;
    console.error('FAIL:', message);
  }
}

function extractFunction(source, signature) {
  const start = source.indexOf(signature);
  if (start < 0) return null;
  const bodyStart = source.indexOf('{', start);
  if (bodyStart < 0) return null;
  let depth = 0;
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  return null;
}

const surrenderSource = extractFunction(
  mainSource,
  'function resolveSiegeSurrender(cityId: string): void {',
);

console.log('\n-- kontrakt resolveSiegeSurrender --');
assert(!!surrenderSource, 'resolveSiegeSurrender jest obecne w main.ts');
if (surrenderSource) {
  const ownerChange = surrenderSource.indexOf('city.ownerId = newOwner;');
  const migration = surrenderSource.indexOf('const migrated = sanitizeBuildQueue(prodSurrender);');
  assert(migration > ownerChange,
    'surrender migruje kolejkę w ścieżce faktycznej zmiany właściciela');
  assert(
    /const prodSurrender = cityProd\.get\(city\.id\);[\s\S]*?const migrated = sanitizeBuildQueue\(prodSurrender\);[\s\S]*?setOwnerPracaPool\(oldOwner, ownerPracaPool\(oldOwner\) \+ migrated\.refundedPraca\);[\s\S]*?cityProd\.set\(city\.id, sanitizeProductionQueue\(newOwner, migrated\.prod\)\);/.test(surrenderSource),
    'surrender usuwa legacy, zwraca Pracę staremu właścicielowi i filtruje kolejkę dla nowego',
  );

  // Negacja: usunięcie wywołania sanitizera musi zapalić tę samą bramkę.
  const mutant = surrenderSource.replace(
    'const migrated = sanitizeBuildQueue(prodSurrender);',
    'const migrated = prodSurrender;',
  );
  assert(
    !/const migrated = sanitizeBuildQueue\(prodSurrender\);/.test(mutant),
    'negacja: brak sanitizeBuildQueue w surrender jest wykrywalny',
  );
}

console.log('\n-- repro: legacy kolejka przy kapitulacji głodowej --');
const oldOwner = 7;
const newOwner = 0;
const building = { kind: 'budynek', id: 'spichlerz', nazwa: 'Spichlerz', koszt: 20 };
const legacyFront = { kind: 'jednostka', id: 'Wojownik', nazwa: 'Wojownik', koszt: 40 };
const legacyWaiting = { ...legacyFront, id: 'Łucznik', nazwa: 'Łucznik', postep: 6 };
const paidRecruit = { ...legacyFront, koszt: 40 };
const cityProd = new Map([[
  'city-surrender',
  {
    kolejka: [legacyFront, legacyWaiting, building],
    postep: 10,
    rekrutacja: [paidRecruit],
  },
]]);
const praca = new Map([[oldOwner, 20], [newOwner, 31]]);

function migrateSurrenderQueueOnce() {
  const prodSurrender = cityProd.get('city-surrender');
  const migrated = sanitizeBuildQueue(prodSurrender);
  if (migrated.refundedPraca > 0) {
    praca.set(oldOwner, praca.get(oldOwner) + migrated.refundedPraca);
  }
  cityProd.set('city-surrender', migrated.prod);
}

migrateSurrenderQueueOnce();
const afterFirst = cityProd.get('city-surrender');
assert(afterFirst.kolejka.length === 1 && afterFirst.kolejka[0].id === 'spichlerz',
  'surrender usuwa legacy jednostki, ale zachowuje budynek');
assert(!afterFirst.kolejka.some(item => item.kind === 'jednostka'),
  'surrender nie zostawia żadnej jednostki w kolejka[]');
assert(afterFirst.rekrutacja.length === 1 && afterFirst.rekrutacja[0].id === 'Wojownik',
  'surrender zachowuje opłaconą rekrutacja[]');
assert(praca.get(oldOwner) === 36,
  'zwrot Pracy 16 trafia do starego właściciela (20 → 36)');
assert(praca.get(newOwner) === 31,
  'nowy właściciel nie dostaje zwrotu legacy');

migrateSurrenderQueueOnce();
assert(praca.get(oldOwner) === 36,
  'ponowne rozstrzygnięcie nie dubluje zwrotu Pracy');
assert(cityProd.get('city-surrender').rekrutacja.length === 1,
  'ponowne rozstrzygnięcie nie dubluje opłaconej rekrutacji');

console.log(`\nsurrender-rekrutacja-build-gate-test: ${passed} passed, ${failed} failed`);
try { fs.rmSync(ENTRY, { force: true }); } catch (_) {}
try { fs.rmSync(BUNDLE, { force: true }); } catch (_) {}
process.exit(failed > 0 ? 1 : 0);
