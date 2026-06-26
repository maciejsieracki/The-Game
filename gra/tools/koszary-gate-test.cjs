'use strict';
/**
 * koszary-gate-test.cjs -- standalone Node test for Koszary gate in availableProduction.
 * Run from gra/:  node tools/koszary-gate-test.cjs
 *
 * Decyzja Maciej 2026-06-25: jednostki epoki Braz (epochNumber=2) wymagaja
 * wybudowanych Koszar (id='koszary') w miescie, by pojawic sie w availableProduction.
 * Jednostki epok Kamien i Zelazo bez zmian.
 *
 * Bundles production.ts (+ deps) via esbuild, then runs assertions.
 * Pure logic only -- no DOM, no THREE.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[koszary-gate-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.koszary-gate-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.koszary-gate-bundle.cjs');

const ENTRY_TS = `
export {
  availableProduction,
  purchasableUnits,
  epochNumber,
  EPOCH_BY_NAME,
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
  console.error('[koszary-gate-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const { availableProduction, purchasableUnits, epochNumber } = M;

// --- test harness ----------------------------------------------------------
let passed = 0;
let failed = 0;

function assert(cond, msg, extra) {
  if (cond) {
    passed++;
    console.log('  [OK] ' + msg);
  } else {
    failed++;
    const detail = extra ? (' -- ' + extra) : '';
    console.error('  [FAIL] ' + msg + detail);
  }
}

// --- Fixture data ----------------------------------------------------------
// Minimal city stub (availableProduction accepts City but only uses it for
// future per-city gating; currently marked void inside the function).
const CITY = { id: 'test-city', q: 0, r: 0, ownerId: 0, population: 3, epoch: 2 };

// Bronze unit (standardowy, bez "W zamian za", tech = '-')
const UNIT_BRAZ = {
  Jednostka: 'Wojownik Brazu',
  Epoka: 'Braz',
  'Rola (linia)': 'Wrecz',
  'W zamian za': '-',
  Tech: '-',
  'Pieniadz (koszt)': 10,
};

// Stone unit (epoka Kamien)
const UNIT_KAMIEN = {
  Jednostka: 'Piesciarz',
  Epoka: 'Kamien',
  'Rola (linia)': 'Wrecz',
  'W zamian za': '-',
  Tech: '-',
  'Pieniadz (koszt)': 5,
};

// Iron unit (epoka Zelazo)
const UNIT_ZELAZO = {
  Jednostka: 'Legionista',
  Epoka: 'Zelazo',
  'Rola (linia)': 'Wrecz',
  'W zamian za': '-',
  Tech: '-',
  'Pieniadz (koszt)': 15,
};

// Civ-specific replacement (should always be filtered regardless of Koszary)
const UNIT_CIV = {
  Jednostka: 'Sherden',
  Epoka: 'Braz',
  'Rola (linia)': 'Wrecz',
  'W zamian za': 'Wojownik Brazu',
  Tech: '-',
  'Pieniadz (koszt)': 10,
};

// Minimal building list -- koszary must be present so built.has('koszary') works
const KOSZARY_DEF = {
  id: 'koszary',
  nazwa: 'Koszary',
  kategoria: 'Wojsko',
  epokaWejscia: 2,
  maksPoziom: 10,
  kosztBudowy: 25,
  techUnlock: 'Wojskowosc',
};

// ProductionData stubs
const DATA_WITH_KOSZARY = {
  buildings: [KOSZARY_DEF],
  units: [UNIT_KAMIEN, UNIT_BRAZ, UNIT_ZELAZO, UNIT_CIV],
};

const NO_TECHS = [];
const WITH_WOJSKOWOSC = ['Wojskowosc'];

// --------------------------------------------------------------------------
console.log('\n[koszary-gate-test] Running tests...\n');

// --- epochNumber sanity ---------------------------------------------------
console.log('0. epochNumber sanity');
assert(epochNumber('Kamien') === 1, 'epochNumber Kamien = 1');
assert(epochNumber('Braz') === 2, 'epochNumber Braz = 2');
assert(epochNumber('Zelazo') === 3, 'epochNumber Zelazo = 3');
// Polish diacritics variants
assert(epochNumber('Brąz') === 2, 'epochNumber Brąz (diacritic) = 2');
assert(epochNumber('Żelazo') === 3, 'epochNumber Zelazo (diacritic) = 3');

// --- Test A: Bronze unit NOT available without Koszary --------------------
console.log('\n1. Bronze unit NIE dostepna bez Koszar (epoch=2, builtBuildingIds=[])');
{
  const items = availableProduction(CITY, DATA_WITH_KOSZARY, NO_TECHS, {
    epoch: 2,
    builtBuildingIds: [],
  });
  const ids = items.map(i => i.id);
  assert(!ids.includes('Wojownik Brazu'),
    'Wojownik Brazu NIE pojawia sie bez Koszar',
    'ids=' + JSON.stringify(ids));
}

// --- Test B: Bronze unit IS available with Koszary -----------------------
console.log('\n2. Bronze unit JEST dostepna z Koszarami (epoch=2, built=[koszary])');
{
  const items = availableProduction(CITY, DATA_WITH_KOSZARY, NO_TECHS, {
    epoch: 2,
    builtBuildingIds: ['koszary'],
  });
  const ids = items.map(i => i.id);
  assert(ids.includes('Wojownik Brazu'),
    'Wojownik Brazu pojawia sie po wybudowaniu Koszar',
    'ids=' + JSON.stringify(ids));
}

// --- Test C: Stone unit unaffected (no Koszary required) -----------------
console.log('\n3. Jednostka Kamienia niezmieniina -- dostepna bez Koszar');
{
  const itemsNoBuild = availableProduction(CITY, DATA_WITH_KOSZARY, NO_TECHS, {
    epoch: 2,
    builtBuildingIds: [],
  });
  const itemsWithBuild = availableProduction(CITY, DATA_WITH_KOSZARY, NO_TECHS, {
    epoch: 2,
    builtBuildingIds: ['koszary'],
  });
  assert(itemsNoBuild.some(i => i.id === 'Piesciarz'),
    'Piesciarz (Kamien) JEST dostepny bez Koszar',
    'ids=' + JSON.stringify(itemsNoBuild.map(i => i.id)));
  assert(itemsWithBuild.some(i => i.id === 'Piesciarz'),
    'Piesciarz (Kamien) JEST dostepny takze z Koszarami',
    'ids=' + JSON.stringify(itemsWithBuild.map(i => i.id)));
}

// --- Test D: Iron unit unaffected at epoch 3 (no Koszary gate for iron) ---
console.log('\n4. Jednostka Zelaza niezmieniina -- dostepna bez/z Koszarami (epoch=3)');
{
  const itemsNoBuild = availableProduction(CITY, DATA_WITH_KOSZARY, NO_TECHS, {
    epoch: 3,
    builtBuildingIds: [],
  });
  const itemsWithBuild = availableProduction(CITY, DATA_WITH_KOSZARY, NO_TECHS, {
    epoch: 3,
    builtBuildingIds: ['koszary'],
  });
  assert(itemsNoBuild.some(i => i.id === 'Legionista'),
    'Legionista (Zelazo) JEST dostepny bez Koszar przy epoch=3',
    'ids=' + JSON.stringify(itemsNoBuild.map(i => i.id)));
  assert(itemsWithBuild.some(i => i.id === 'Legionista'),
    'Legionista (Zelazo) JEST dostepny z Koszarami przy epoch=3',
    'ids=' + JSON.stringify(itemsWithBuild.map(i => i.id)));
}

// --- Test E: Civ-specific replacement never appears (independent of Koszary) --
console.log('\n5. Civ-specific replacement (W zamian za != -) nigdy nie pojawia sie');
{
  const items = availableProduction(CITY, DATA_WITH_KOSZARY, NO_TECHS, {
    epoch: 2,
    builtBuildingIds: ['koszary'],
  });
  assert(!items.some(i => i.id === 'Sherden'),
    'Sherden (civ-specific) NIE pojawia sie nawet z Koszarami',
    'ids=' + JSON.stringify(items.map(i => i.id)));
}

// --- Test F: purchasableUnits also honours the Koszary gate ---------------
console.log('\n6. purchasableUnits takze respektuje gate Koszar');
{
  const withoutKoszary = purchasableUnits(CITY, DATA_WITH_KOSZARY, NO_TECHS, {
    epoch: 2,
    builtBuildingIds: [],
  });
  const withKoszary = purchasableUnits(CITY, DATA_WITH_KOSZARY, NO_TECHS, {
    epoch: 2,
    builtBuildingIds: ['koszary'],
  });
  assert(!withoutKoszary.some(i => i.id === 'Wojownik Brazu'),
    'purchasableUnits: Wojownik Brazu NIE pojawia sie bez Koszar');
  assert(withKoszary.some(i => i.id === 'Wojownik Brazu'),
    'purchasableUnits: Wojownik Brazu pojawia sie z Koszarami');
}

// --- Test G: lazaret not available at epoch 3 (epokaWejscia=5) ------------
console.log('\n7. Lazaret niedostepny przy epoch=3 (epokaWejscia=5 po zmianie)');
{
  // Load real buildings.json to verify the live data
  let buildingsJson;
  try {
    buildingsJson = require('../data/buildings.json');
  } catch (e) {
    console.error('  [SKIP] Could not load ../data/buildings.json:', e.message);
    buildingsJson = null;
  }
  if (buildingsJson) {
    const lazaret = buildingsJson.find(b => b.id === 'lazaret');
    assert(lazaret !== undefined, 'lazaret istnieje w buildings.json');
    assert(lazaret && lazaret.epokaWejscia === 5,
      'lazaret epokaWejscia === 5 (Sredniowiecze, parking)',
      'got ' + (lazaret && lazaret.epokaWejscia));

    const dataReal = { buildings: buildingsJson, units: [] };
    const atEpoch3 = availableProduction(CITY, dataReal, [], { epoch: 3, builtBuildingIds: [] });
    assert(!atEpoch3.some(i => i.id === 'lazaret'),
      'lazaret NIE pojawia sie przy epoch=3 (cap v0.1)',
      'items=' + JSON.stringify(atEpoch3.map(i => i.id)));

    const atEpoch4 = availableProduction(CITY, dataReal, ['Medycyna'], { epoch: 5, builtBuildingIds: [] });
    assert(atEpoch4.some(i => i.id === 'lazaret'),
      'lazaret pojawia sie przy epoch=5 + tech Medycyna (future)',
      'items=' + JSON.stringify(atEpoch4.map(i => i.id)));
  }
}

// --- Summary ---------------------------------------------------------------
console.log('');
if (failed === 0) {
  console.log('[koszary-gate-test] WSZYSTKIE TESTY ZIELONE (' + passed + '/' + (passed + failed) + ')');
  process.exit(0);
} else {
  console.error('[koszary-gate-test] NIEUDANE: ' + failed + '/' + (passed + failed));
  process.exit(1);
}
