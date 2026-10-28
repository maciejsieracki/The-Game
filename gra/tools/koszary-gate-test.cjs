'use strict';
/**
 * koszary-gate-test.cjs -- standalone Node test for the per-city Koszary unit gate.
 * Run from gra/:  node tools/koszary-gate-test.cjs
 *
 * Bronze and later units require Barracks in their city. Stone units remain
 * unaffected, while production visibility keeps the current + previous era window.
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
  availableReplacementsFor,
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
const { availableProduction, availableReplacementsFor, purchasableUnits, epochNumber } = M;

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

// Koło unlocks the Ox Chariot in late Stone; no barracks/bronze gate applies.
const UNIT_OX_CHARIOT = {
  Jednostka: 'Rydwan (woły)',
  Epoka: 'Kamień',
  Typ: 'Mount',
  'Rola (linia)': 'Flanka',
  'W zamian za': '-',
  Tech: 'Koło',
  'Pieniądz (koszt)': 15,
  Surowiec: 'Drewno',
  'Surowiec (ilość)': 25,
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
  units: [UNIT_KAMIEN, UNIT_OX_CHARIOT, UNIT_BRAZ, UNIT_ZELAZO, UNIT_CIV],
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

// --- Bronze transition: Stone remains available, Bronze requires Barracks ---
console.log('\n1. Epoka Brazu: Kamien dostepny, Braz zablokowany bez Koszar');
{
  const items = availableProduction(CITY, DATA_WITH_KOSZARY, NO_TECHS, {
    epoch: 2,
    builtBuildingIds: [],
  });
  const ids = items.map(i => i.id);
  assert(ids.includes('Piesciarz'),
    'Piesciarz (Kamien) pozostaje dostepny po awansie do Brazu bez Koszar',
    'ids=' + JSON.stringify(ids));
  assert(!ids.includes('Wojownik Brazu'),
    'Wojownik Brazu jest zablokowany bez Koszar',
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

// --- Test C2: Ox Chariot is available after Koło in late Stone, without barracks --
console.log('\n3b. Rydwan (woły) po Kole w epoce Kamienia nie wymaga Koszar');
{
  const noWheel = availableProduction(CITY, DATA_WITH_KOSZARY, [], {
    epoch: 1,
    builtBuildingIds: [],
    empireResourceStock: { drewno: 25 },
  }).map(item => item.id);
  const withWheel = availableProduction(CITY, DATA_WITH_KOSZARY, ['Koło'], {
    epoch: 1,
    builtBuildingIds: [],
    empireResourceStock: { drewno: 25 },
  }).map(item => item.id);
  assert(!noWheel.includes('Rydwan (woły)'), 'Rydwan (woły) jest zablokowany przed wynalezieniem Koła');
  assert(withWheel.includes('Rydwan (woły)'), 'Rydwan (woły) jest dostępny po Kole w epoce Kamienia bez Koszar');
}

// --- Iron transition: Stone expires; Bronze and Iron both require Barracks --
console.log('\n4. Epoka Zelaza: Kamien wygasa, Braz i Zelazo wymagaja Koszar');
{
  const itemsNoBuild = availableProduction(CITY, DATA_WITH_KOSZARY, NO_TECHS, {
    epoch: 3,
    builtBuildingIds: [],
  });
  const itemsWithBuild = availableProduction(CITY, DATA_WITH_KOSZARY, NO_TECHS, {
    epoch: 3,
    builtBuildingIds: ['koszary'],
  });
  assert(!itemsNoBuild.some(i => i.id === 'Piesciarz'),
    'Piesciarz (Kamien) wygasa przy epoch=3',
    'ids=' + JSON.stringify(itemsNoBuild.map(i => i.id)));
  assert(!itemsNoBuild.some(i => i.id === 'Wojownik Brazu'),
    'Wojownik Brazu pozostaje zablokowany bez Koszar przy epoch=3',
    'ids=' + JSON.stringify(itemsNoBuild.map(i => i.id)));
  assert(!itemsNoBuild.some(i => i.id === 'Legionista'),
    'Legionista (Zelazo) jest zablokowany bez Koszar przy epoch=3',
    'ids=' + JSON.stringify(itemsNoBuild.map(i => i.id)));
  assert(itemsWithBuild.some(i => i.id === 'Wojownik Brazu'),
    'Wojownik Brazu jest dostepny z Koszarami przy epoch=3');
  assert(itemsWithBuild.some(i => i.id === 'Legionista'),
    'Legionista (Zelazo) jest dostepny z Koszarami przy epoch=3',
    'ids=' + JSON.stringify(itemsWithBuild.map(i => i.id)));
}

// Replacement choices use the same per-city, Bronze+ gate as normal recruitment.
console.log('\n4b. Zastap respektuje bramke Koszar w epoce Zelaza');
{
  const replacementData = {
    buildings: [KOSZARY_DEF],
    units: [
      { ...UNIT_KAMIEN, Typ: 'Melee' },
      { ...UNIT_BRAZ, Typ: 'Melee' },
      { ...UNIT_ZELAZO, Typ: 'Melee' },
    ],
  };
  const noBarracks = availableReplacementsFor('Piesciarz', replacementData, NO_TECHS, {
    epoch: 3, builtBuildingIds: [],
  }).map(item => item.id);
  const withBarracks = availableReplacementsFor('Piesciarz', replacementData, NO_TECHS, {
    epoch: 3, builtBuildingIds: ['koszary'],
  }).map(item => item.id);
  assert(!noBarracks.includes('Wojownik Brazu') && !noBarracks.includes('Legionista'),
    'Zastap blokuje brazowe i zelazne jednostki bez Koszar',
    'ids=' + JSON.stringify(noBarracks));
  assert(withBarracks.includes('Wojownik Brazu') && withBarracks.includes('Legionista'),
    'Zastap udostepnia brazowe i zelazne jednostki z Koszarami',
    'ids=' + JSON.stringify(withBarracks));
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

// --- Test G: Lazaret USUNIETY z gry calkowicie (Maciej) --------------------
// Asercje istnienia/epoki/dostepnosci Lazaretu usuniete -- budynek nie istnieje
// juz w buildings.json. Zostaje WYLACZNIE zabezpieczenie regresyjne: gdyby ktos
// kiedys przypadkiem przywrocil id='lazaret', nie ma prawa pojawic sie w epoce 3.
console.log('\n7. Lazaret usuniety z gry -- zabezpieczenie przed przywroceniem');
{
  let buildingsJson;
  try {
    buildingsJson = require('../data/buildings.json');
  } catch (e) {
    console.error('  [SKIP] Could not load ../data/buildings.json:', e.message);
    buildingsJson = null;
  }
  if (buildingsJson) {
    const dataReal = { buildings: buildingsJson, units: [] };
    const atEpoch3 = availableProduction(CITY, dataReal, [], { epoch: 3, builtBuildingIds: [] });
    assert(!atEpoch3.some(i => i.id === 'lazaret'),
      'lazaret NIE pojawia sie przy epoch=3 (usuniety z gry / cap v0.1)',
      'items=' + JSON.stringify(atEpoch3.map(i => i.id)));
  }
}

// --- Test: jeden typ budynku na miasto ------------------------------------
console.log('\n-- jeden typ budynku (zbudowany / w kolejce) --');

function testOneBuildingPerType() {
  const stelaDef = {
    id: 'stela', nazwa: 'Stela', kategoria: 'Kultura', epokaWejscia: 1,
    maksPoziom: 10, nazwyPoziomow: [], techUnlock: 'Murarstwo',
    kosztBudowy: 15, przyrostKosztu: 5, utrzymanie: 0, przyrostUtrzymania: 0,
    wymagania: '', uwagi: '',
    baza: { praca: 0, pieniadz: 0, zywnosc: 0, nauka: 0, kultura: 1, zadowolenie: 0, obrona: 0, mnoznik: 0 },
    przyrost: { praca: 0, pieniadz: 0, zywnosc: 0, nauka: 0, kultura: 1, zadowolenie: 0, obrona: 0, mnoznik: 0 },
  };
  const spichlerzDef = {
    id: 'spichlerz', nazwa: 'Spichlerz', kategoria: 'Zywnosc', epokaWejscia: 1,
    maksPoziom: 10, nazwyPoziomow: [], techUnlock: '',
    kosztBudowy: 20, przyrostKosztu: 10, utrzymanie: 1, przyrostUtrzymania: 0,
    wymagania: '', uwagi: '',
    baza: { praca: 0, pieniadz: 0, zywnosc: 2, nauka: 0, kultura: 0, zadowolenie: 0, obrona: 0, mnoznik: 0 },
    przyrost: { praca: 0, pieniadz: 0, zywnosc: 1, nauka: 0, kultura: 0, zadowolenie: 0, obrona: 0, mnoznik: 0 },
  };
  const DATA = { buildings: [stelaDef, spichlerzDef], units: [] };
  const TECHS = ['Murarstwo'];

  assert(!availableProduction(CITY, DATA, TECHS, {
    epoch: 2, builtBuildingIds: ['stela'],
  }).some(i => i.id === 'stela'),
    'stela znika gdy juz zbudowana');

  assert(!availableProduction(CITY, DATA, TECHS, {
    epoch: 2, builtBuildingIds: [],
    productionQueue: [{ kind: 'budynek', id: 'stela', nazwa: 'Stela', koszt: 15 }],
  }).some(i => i.id === 'stela'),
    'stela znika gdy juz w kolejce (nawet 1 pozycja)');

  assert(!availableProduction(CITY, DATA, TECHS, {
    epoch: 2, builtBuildingIds: ['spichlerz'],
  }).some(i => i.id === 'spichlerz'),
    'spichlerz znika gdy zbudowany');
}

testOneBuildingPerType();

// --- Summary ---------------------------------------------------------------
console.log('');
if (failed === 0) {
  console.log('[koszary-gate-test] WSZYSTKIE TESTY ZIELONE (' + passed + '/' + (passed + failed) + ')');
  process.exit(0);
} else {
  console.error('[koszary-gate-test] NIEUDANE: ' + failed + '/' + (passed + failed));
  process.exit(1);
}
