'use strict';
/**
 * drewno-gate-test.cjs -- standalone Node test for the Drewno (wood) access gate.
 * Run from gra/:  node tools/drewno-gate-test.cjs
 *
 * BUG-BRAMKA-DREWNO-BRAK (Maciej, decyzja A, 2026-08-08): bramka dostepu do surowca
 * w production.ts (availableProduction + availableReplacementsFor) sprawdzala
 * WYLACZNIE Braz i Zelazo -- brakowala analogiczna galaz dla Drewna, mimo ze wiele
 * jednostek epoki Kamienia (Wojownik, Procarz, Oszczepnik, Lucznik, ...) ma
 * Surowiec='Drewno'. Ten test pokrywa nowa bramke (obie kopie warunku) ORAZ
 * powiazana decyzje BUG-ZWIADOWCA-KOSZT-SUROWCA (Zwiadowca: koszt Drewna wyzerowany
 * w OBU kanalach -- rekrutacja i utrzymanie -- wiec musi pozostac ZAWSZE dostepny,
 * niezaleznie od stanu magazynu panstwa).
 *
 * Bundles production.ts via esbuild, then runs assertions.
 * Pure logic only -- no DOM, no THREE.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[drewno-gate-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.drewno-gate-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.drewno-gate-bundle.cjs');

const ENTRY_TS = `
export {
  availableProduction,
  availableReplacementsFor,
  purchasableUnits,
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
  console.error('[drewno-gate-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const { availableProduction, availableReplacementsFor, purchasableUnits } = M;

// --- test harness ------------------------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg, extra) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else {
    failed++;
    console.error('  [FAIL] ' + msg + (extra ? (' -- ' + extra) : ''));
  }
}

// --- Fixtures ----------------------------------------------------------------
const CITY = { id: 'test-city', q: 0, r: 0, ownerId: 0, population: 3 };

// Jednostka drewniana (analog do "Wojownik" w prawdziwym units.json: Surowiec='Drewno',
// Surowiec (ilość)=10 -- niezerowy wymog).
const UNIT_DREWNO = {
  Jednostka: 'Wojownik',
  Epoka: 'Kamień',
  'Rola (linia)': 'Wręcz',
  'W zamian za': '-',
  Tech: '-',
  Surowiec: 'Drewno',
  'Surowiec (ilość)': 10,
  'Pieniądz (koszt)': 5,
};

// Jednostka bez kosztu surowcowego (analog do prawdziwego Zwiadowcy PO naprawie
// BUG-ZWIADOWCA-KOSZT-SUROWCA: Surowiec=null, Surowiec (ilość)=0). Musi pozostac
// ZAWSZE dostepna -- bramka sprawdza tylko u.Surowiec (stripDiacritics), nie ilosc,
// wiec Surowiec musi byc "puste" (null), inaczej bramka drewna zablokowalaby ja mimo
// zerowego wymogu ilosciowego.
const UNIT_DREWNO_ZERO = {
  Jednostka: 'Zwiadowca',
  Epoka: 'Kamień',
  'Rola (linia)': 'Wsparcie',
  'W zamian za': '-',
  Tech: '-',
  Surowiec: null,
  'Surowiec (ilość)': 0,
  'Pieniądz (koszt)': 8,
};

const DATA = { buildings: [], units: [UNIT_DREWNO, UNIT_DREWNO_ZERO] };
const NO_TECHS = [];

console.log('\n[drewno-gate-test] Running tests...\n');

console.log('1. availableProduction: brak Drewna w magazynie panstwa -> jednostka Surowiec=Drewno NIEDOSTEPNA');
{
  const items = availableProduction(CITY, DATA, NO_TECHS, {
    epoch: 1,
    builtBuildingIds: [],
    empireResourceStock: {},
  });
  assert(!items.some(i => i.id === 'Wojownik'),
    'Wojownik (Surowiec=Drewno) NIE dostepny bez Drewna w magazynie',
    'ids=' + JSON.stringify(items.map(i => i.id)));
}

console.log('\n2. availableProduction: brak pola empireResourceStock w ogole (domyslne {}) -> fail-closed');
{
  const items = availableProduction(CITY, DATA, NO_TECHS, {
    epoch: 1,
    builtBuildingIds: [],
  });
  assert(!items.some(i => i.id === 'Wojownik'),
    'Wojownik NIE dostepny gdy ctx.empireResourceStock w ogole nie podano (fail-closed)',
    'ids=' + JSON.stringify(items.map(i => i.id)));
}

console.log('\n3. availableProduction: Drewno w magazynie panstwa -> jednostka Surowiec=Drewno DOSTEPNA');
{
  const items = availableProduction(CITY, DATA, NO_TECHS, {
    epoch: 1,
    builtBuildingIds: [],
    empireResourceStock: { drewno: 1 },
  });
  assert(items.some(i => i.id === 'Wojownik'),
    'Wojownik JEST dostepny: Drewno w magazynie panstwa',
    'ids=' + JSON.stringify(items.map(i => i.id)));
}

console.log('\n4. Jednostka z zerowym wymogiem Drewna (Surowiec=null, np. Zwiadowca po naprawie) -- ZAWSZE dostepna');
{
  const itemsNoStock = availableProduction(CITY, DATA, NO_TECHS, {
    epoch: 1,
    builtBuildingIds: [],
    empireResourceStock: {},
  });
  assert(itemsNoStock.some(i => i.id === 'Zwiadowca'),
    'Zwiadowca dostepny BEZ Drewna w magazynie (Surowiec=null -- bramka go nie dotyczy)',
    'ids=' + JSON.stringify(itemsNoStock.map(i => i.id)));

  const itemsWithStock = availableProduction(CITY, DATA, NO_TECHS, {
    epoch: 1,
    builtBuildingIds: [],
    empireResourceStock: { drewno: 5 },
  });
  assert(itemsWithStock.some(i => i.id === 'Zwiadowca'),
    'Zwiadowca dostepny takze Z Drewnem w magazynie',
    'ids=' + JSON.stringify(itemsWithStock.map(i => i.id)));
}

console.log('\n5. purchasableUnits respektuje ten sam gate');
{
  const without = purchasableUnits(CITY, DATA, NO_TECHS, {
    epoch: 1, builtBuildingIds: [], empireResourceStock: {},
  });
  const withStock = purchasableUnits(CITY, DATA, NO_TECHS, {
    epoch: 1, builtBuildingIds: [], empireResourceStock: { drewno: 1 },
  });
  assert(!without.some(i => i.id === 'Wojownik'), 'purchasableUnits: brak Drewna -> Wojownik niedostepny');
  assert(withStock.some(i => i.id === 'Wojownik'), 'purchasableUnits: Drewno w magazynie -> Wojownik dostepny');
  assert(without.some(i => i.id === 'Zwiadowca'), 'purchasableUnits: Zwiadowca dostepny nawet bez Drewna');
}

console.log('\n6. availableReplacementsFor ("Zastap") respektuje ten sam gate');
{
  const CURRENT_UNIT = {
    Jednostka: 'Placeholder wrecz',
    Epoka: 'Kamień',
    'Rola (linia)': 'Wręcz',
    Typ: 'Swordsman',
    'W zamian za': '-',
    Tech: '-',
    Surowiec: null,
    'Surowiec (ilość)': 0,
    'Pieniądz (koszt)': 3,
  };
  const UNIT_DREWNO_SAME_TYP = { ...UNIT_DREWNO, Typ: 'Swordsman' };
  const DATA_REPL = { buildings: [], units: [CURRENT_UNIT, UNIT_DREWNO_SAME_TYP] };

  const withoutAccess = availableReplacementsFor('Placeholder wrecz', DATA_REPL, NO_TECHS, {
    epoch: 1, builtBuildingIds: [], empireResourceStock: {},
  });
  assert(!withoutAccess.some(i => i.id === 'Wojownik'),
    'Zastap: Wojownik NIE jest opcja zamiany bez Drewna w magazynie',
    'ids=' + JSON.stringify(withoutAccess.map(i => i.id)));

  const withAccess = availableReplacementsFor('Placeholder wrecz', DATA_REPL, NO_TECHS, {
    epoch: 1, builtBuildingIds: [], empireResourceStock: { drewno: 1 },
  });
  assert(withAccess.some(i => i.id === 'Wojownik'),
    'Zastap: Wojownik JEST opcja zamiany z Drewnem w magazynie',
    'ids=' + JSON.stringify(withAccess.map(i => i.id)));
}

console.log('\n7. Jednostka Braz/Zelazo -- bramka Drewna jej NIE dotyczy (regresja braz/zelazo)');
{
  const UNIT_BRAZ = { ...UNIT_DREWNO, Jednostka: 'Wlocznik', Surowiec: 'Braz' };
  const DATA_BRAZ = { buildings: [], units: [UNIT_BRAZ] };
  const items = availableProduction(CITY, DATA_BRAZ, NO_TECHS, {
    epoch: 1, builtBuildingIds: [], empireResourceStock: { drewno: 5 }, // Drewno, NIE Braz
  });
  assert(!items.some(i => i.id === 'Wlocznik'),
    'Wlocznik (Surowiec=Braz) nadal blokowany bramka Brazu mimo Drewna w magazynie -- regresja',
    'ids=' + JSON.stringify(items.map(i => i.id)));
}

// === Warstwa realnych danych: data/units.json =================================
console.log('\n8. Realne data/units.json: Zwiadowca (po naprawie) vs Wojownik (bez naprawy)');
{
  const realUnits = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '..', 'data', 'units.json'), 'utf8'));
  const zwiadowca = realUnits.find(u => u.Jednostka === 'Zwiadowca');
  const wojownik = realUnits.find(u => u.Jednostka === 'Wojownik');
  assert(!!zwiadowca, 'Zwiadowca istnieje w units.json');
  assert(!!wojownik, 'Wojownik istnieje w units.json');
  assert(zwiadowca['Surowiec (ilość)'] === 0,
    'Zwiadowca: Surowiec (ilość) = 0', 'ma=' + zwiadowca['Surowiec (ilość)']);
  assert(zwiadowca['Surowiec'] == null,
    'Zwiadowca: Surowiec = null/puste (inaczej bramka Drewna by go zablokowala)',
    'ma=' + JSON.stringify(zwiadowca['Surowiec']));
  assert(zwiadowca['Utrzymanie surowiec (ilość)'] === 0,
    'Zwiadowca: Utrzymanie surowiec (ilość) = 0', 'ma=' + zwiadowca['Utrzymanie surowiec (ilość)']);
  assert(wojownik['Surowiec (ilość)'] === 10 && wojownik['Surowiec'] === 'Drewno',
    'Wojownik: nadal Surowiec=Drewno ×10 (bez zmian -- kontrola)',
    'ma=' + JSON.stringify({ Surowiec: wojownik['Surowiec'], ilosc: wojownik['Surowiec (ilość)'] }));

  const REAL_DATA = { buildings: [], units: realUnits };
  const itemsNoDrewno = availableProduction(CITY, REAL_DATA, NO_TECHS, {
    epoch: 1, builtBuildingIds: [], empireResourceStock: {},
  });
  assert(itemsNoDrewno.some(i => i.id === 'Zwiadowca'),
    'Realne dane: Zwiadowca dostepny BEZ Drewna w magazynie panstwa',
    'ids=' + JSON.stringify(itemsNoDrewno.map(i => i.id)));
  assert(!itemsNoDrewno.some(i => i.id === 'Wojownik'),
    'Realne dane: Wojownik NIEdostepny bez Drewna w magazynie panstwa (nowa bramka)',
    'ids=' + JSON.stringify(itemsNoDrewno.map(i => i.id)));

  const itemsWithDrewno = availableProduction(CITY, REAL_DATA, NO_TECHS, {
    epoch: 1, builtBuildingIds: [], empireResourceStock: { drewno: 1 },
  });
  assert(itemsWithDrewno.some(i => i.id === 'Wojownik'),
    'Realne dane: Wojownik dostepny Z Drewnem w magazynie panstwa',
    'ids=' + JSON.stringify(itemsWithDrewno.map(i => i.id)));
}

// --- Summary -----------------------------------------------------------------
console.log('');
try { fs.unlinkSync(ENTRY_FILE); } catch {}
try { fs.unlinkSync(BUNDLE_FILE); } catch {}

if (failed === 0) {
  console.log('[drewno-gate-test] WSZYSTKIE TESTY ZIELONE (' + passed + '/' + (passed + failed) + ')');
  process.exit(0);
} else {
  console.error('[drewno-gate-test] NIEUDANE: ' + failed + '/' + (passed + failed));
  process.exit(1);
}
