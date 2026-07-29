'use strict';
/**
 * zelazo-gate-test.cjs -- standalone Node test for the Zelazo (iron) access gate.
 * Run from gra/:  node tools/zelazo-gate-test.cjs
 *
 * Decyzja wlasciciela 2026-07-19: dostep do zelaza (dla jednostek Surowiec='zelazo') =
 *   (a) Kopalnia postawiona GDZIEKOLWIEK w imperium na heksie ze zlozem zelaza
 *       (empireHasKopalniaNaZlozuZelaza -- jak empireHasKopalniaMiedzi dla brazu)
 *   AND
 *   (b) Odlewnia zelaza (id 'odlewnia_zelaza') wybudowana W TYM miescie.
 *
 * Bundles zelazo-access.ts + production.ts via esbuild, then runs assertions.
 * Pure logic only -- no DOM, no THREE.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[zelazo-gate-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.zelazo-gate-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.zelazo-gate-bundle.cjs');

const ENTRY_TS = `
export {
  availableProduction,
  availableReplacementsFor,
  purchasableUnits,
} from '../src/game/production';
export {
  empireHasKopalniaNaZlozuZelaza,
  cityHasOdlewniaZelaza,
  hasZelazoAccess,
} from '../src/game/zelazo-access';
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
  console.error('[zelazo-gate-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const {
  availableProduction, availableReplacementsFor, purchasableUnits,
  empireHasKopalniaNaZlozuZelaza, cityHasOdlewniaZelaza, hasZelazoAccess,
} = M;

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

const UNIT_ZELAZO = {
  Jednostka: 'Legionista',
  Epoka: 'Zelazo',
  'Rola (linia)': 'Wrecz',
  'W zamian za': '-',
  Tech: '-',
  Surowiec: 'zelazo',
  'Pieniadz (koszt)': 15,
};
const UNIT_ZELAZO_NO_SUROWIEC = {
  Jednostka: 'Procarz',
  Epoka: 'Zelazo',
  'Rola (linia)': 'Dystans',
  'W zamian za': '-',
  Tech: '-',
  Surowiec: '',
  'Pieniadz (koszt)': 8,
};

const DATA = { buildings: [], units: [UNIT_ZELAZO, UNIT_ZELAZO_NO_SUROWIEC] };
const NO_TECHS = [];

// Fake map: hex "1,1" = zloze zelazo; hex "2,2" = zloze miedz (kontrola -- NIE zelazo).
const MAP = {
  hexes: {
    '1,1': { zloze: 'zelazo' },
    '2,2': { zloze: 'miedz' },
    '3,3': {},
  },
};

console.log('\n[zelazo-gate-test] Running tests...\n');

// === Warstwa 1: zelazo-access.ts (jednostki funkcji) ========================
console.log('1. empireHasKopalniaNaZlozuZelaza');
{
  const placedNone = new Map();
  assert(empireHasKopalniaNaZlozuZelaza(placedNone, MAP) === false,
    'brak placedImprovements -> false');

  const placedKopalniaOnZelazo = new Map([['1,1', 'kopalnia_zelaza']]);
  assert(empireHasKopalniaNaZlozuZelaza(placedKopalniaOnZelazo, MAP) === true,
    'Kopalnia żelaza na hexie ze zlozem zelaza -> true');

  const placedLegacyKopalniaOnZelazo = new Map([['1,1', 'kopalnia']]);
  assert(empireHasKopalniaNaZlozuZelaza(placedLegacyKopalniaOnZelazo, MAP) === true,
    'Legacy kopalnia na hexie ze zlozem zelaza -> true (migracja save)');

  const placedKopalniaOnMiedz = new Map([['2,2', 'kopalnia_zelaza']]);
  assert(empireHasKopalniaNaZlozuZelaza(placedKopalniaOnMiedz, MAP) === false,
    'Kopalnia na hexie ze zlozem MIEDZI (nie zelaza) -> false');

  const placedKopalniaOnEmpty = new Map([['3,3', 'kopalnia_zelaza']]);
  assert(empireHasKopalniaNaZlozuZelaza(placedKopalniaOnEmpty, MAP) === false,
    'Kopalnia żelaza na hexie BEZ zloza -> false');

  const placedOtherImprovementOnZelazo = new Map([['1,1', 'droga']]);
  assert(empireHasKopalniaNaZlozuZelaza(placedOtherImprovementOnZelazo, MAP) === false,
    'INNE ulepszenie (droga) na hexie ze zlozem zelaza (bez Kopalni) -> false');

  const placedMultiLayer = new Map([['1,1', ['droga', 'kopalnia_zelaza']]]);
  assert(empireHasKopalniaNaZlozuZelaza(placedMultiLayer, MAP) === true,
    'Kopalnia jako jedna z kilku warstw na hexie -> true');

  const placedNoMap = new Map([['1,1', 'kopalnia']]);
  assert(empireHasKopalniaNaZlozuZelaza(placedNoMap, null) === false,
    'brak mapy (null) -> false (bezpiecznik)');
}

console.log('\n2. cityHasOdlewniaZelaza');
{
  assert(cityHasOdlewniaZelaza([]) === false, 'miasto bez budynkow -> false');
  assert(cityHasOdlewniaZelaza(['odlewnia_brazu']) === false,
    'sama Odlewnia brazu (bez zelaza) -> false');
  assert(cityHasOdlewniaZelaza(['odlewnia_zelaza']) === true,
    'Odlewnia zelaza wybudowana -> true');
}

console.log('\n3. hasZelazoAccess (AND-gate)');
{
  assert(hasZelazoAccess({ zelazo: 1 }, []) === false, 'zelazo w magazynie, brak Odlewni -> false');
  assert(hasZelazoAccess({}, ['odlewnia_zelaza']) === false, 'Odlewnia=true, brak zelaza w magazynie -> false');
  assert(hasZelazoAccess({ zelazo: 1 }, ['odlewnia_zelaza']) === true, 'zelazo w magazynie + Odlewnia -> true');
  assert(hasZelazoAccess(undefined, ['odlewnia_zelaza']) === false, 'brak stocku -> false (fail-closed)');
}

// === Warstwa 2: availableProduction / availableReplacementsFor (integracja) ==
console.log('\n4. availableProduction: miasto BEZ zlozа/kopalni LUB BEZ Odlewni -> jednostki zelazne NIEDOSTEPNE');
{
  // Brak kopalni w ogole.
  const itemsNoMine = availableProduction(CITY, DATA, NO_TECHS, {
    epoch: 3,
    builtBuildingIds: ['odlewnia_zelaza'],
    hasKopalniaNaZlozuZelaza: false,
  });
  assert(!itemsNoMine.some(i => i.id === 'Legionista'),
    'Legionista NIE dostepny: Odlewnia jest, ale brak kopalni na zlozu zelaza',
    'ids=' + JSON.stringify(itemsNoMine.map(i => i.id)));

  // Kopalnia jest (empire-wide), ale BRAK Odlewni w tym miescie.
  const itemsNoOdlewnia = availableProduction(CITY, DATA, NO_TECHS, {
    epoch: 3,
    builtBuildingIds: [],
    hasKopalniaNaZlozuZelaza: true,
  });
  assert(!itemsNoOdlewnia.some(i => i.id === 'Legionista'),
    'Legionista NIE dostepny: kopalnia jest, ale brak Odlewni zelaza w miescie',
    'ids=' + JSON.stringify(itemsNoOdlewnia.map(i => i.id)));

  // Ctx bez pola hasKopalniaNaZlozuZelaza w ogole (domyslne {}) -> fail-closed.
  const itemsDefaultCtx = availableProduction(CITY, DATA, NO_TECHS, {
    epoch: 3,
    builtBuildingIds: ['odlewnia_zelaza'],
  });
  assert(!itemsDefaultCtx.some(i => i.id === 'Legionista'),
    'Legionista NIE dostepny gdy ctx.hasKopalniaNaZlozuZelaza w ogole nie podano (fail-closed)',
    'ids=' + JSON.stringify(itemsDefaultCtx.map(i => i.id)));
}

console.log('\n5. availableProduction: miasto Z kopalnia na zlozu ORAZ z Odlewnia -> jednostki zelazne DOSTEPNE');
{
  const items = availableProduction(CITY, DATA, NO_TECHS, {
    epoch: 3,
    builtBuildingIds: ['odlewnia_zelaza'],
    hasKopalniaNaZlozuZelaza: true,
    empireResourceStock: { zelazo: 1 },
  });
  assert(items.some(i => i.id === 'Legionista'),
    'Legionista JEST dostepny: kopalnia na zlozu + Odlewnia zelaza',
    'ids=' + JSON.stringify(items.map(i => i.id)));
}

console.log('\n6. Jednostka Zelaza BEZ Surowiec="zelazo" (np. pusty Surowiec) -- gate jej NIE dotyczy');
{
  const items = availableProduction(CITY, DATA, NO_TECHS, {
    epoch: 3,
    builtBuildingIds: [],
    hasKopalniaNaZlozuZelaza: false,
  });
  assert(items.some(i => i.id === 'Procarz'),
    'Procarz (Surowiec pusty) dostepny mimo braku kopalni/Odlewni -- bramka zelaza go nie dotyczy',
    'ids=' + JSON.stringify(items.map(i => i.id)));
}

console.log('\n7. purchasableUnits respektuje ten sam gate');
{
  const without = purchasableUnits(CITY, DATA, NO_TECHS, {
    epoch: 3, builtBuildingIds: ['odlewnia_zelaza'], hasKopalniaNaZlozuZelaza: false,
  });
  const withBoth = purchasableUnits(CITY, DATA, NO_TECHS, {
    epoch: 3, builtBuildingIds: ['odlewnia_zelaza'], hasKopalniaNaZlozuZelaza: true,
    empireResourceStock: { zelazo: 1 },
  });
  assert(!without.some(i => i.id === 'Legionista'), 'purchasableUnits: brak kopalni -> Legionista niedostepny');
  assert(withBoth.some(i => i.id === 'Legionista'), 'purchasableUnits: kopalnia+Odlewnia -> Legionista dostepny');
}

console.log('\n8. availableReplacementsFor ("Zastap") respektuje ten sam gate');
{
  const CURRENT_UNIT = {
    Jednostka: 'Wojownik podstawowy',
    Epoka: 'Kamien',
    'Rola (linia)': 'Wrecz',
    Typ: 'Swordsman',
    'W zamian za': '-',
    Tech: '-',
    Surowiec: '',
    'Pieniadz (koszt)': 5,
  };
  const UNIT_ZELAZO_SAME_TYP = { ...UNIT_ZELAZO, Typ: 'Swordsman' };
  const DATA_REPL = { buildings: [], units: [CURRENT_UNIT, UNIT_ZELAZO_SAME_TYP] };

  const withoutAccess = availableReplacementsFor('Wojownik podstawowy', DATA_REPL, NO_TECHS, {
    epoch: 3, builtBuildingIds: ['odlewnia_zelaza'], hasKopalniaNaZlozuZelaza: false,
  });
  assert(!withoutAccess.some(i => i.id === 'Legionista'),
    'Zastap: Legionista NIE jest opcja zamiany bez dostepu do zelaza',
    'ids=' + JSON.stringify(withoutAccess.map(i => i.id)));

  const withAccess = availableReplacementsFor('Wojownik podstawowy', DATA_REPL, NO_TECHS, {
    epoch: 3, builtBuildingIds: ['odlewnia_zelaza'], hasKopalniaNaZlozuZelaza: true,
    empireResourceStock: { zelazo: 1 },
  });
  assert(withAccess.some(i => i.id === 'Legionista'),
    'Zastap: Legionista JEST opcja zamiany z pelnym dostepem do zelaza',
    'ids=' + JSON.stringify(withAccess.map(i => i.id)));
}

// --- Summary -----------------------------------------------------------------
console.log('');
try { fs.unlinkSync(ENTRY_FILE); } catch {}
try { fs.unlinkSync(BUNDLE_FILE); } catch {}

if (failed === 0) {
  console.log('[zelazo-gate-test] WSZYSTKIE TESTY ZIELONE (' + passed + '/' + (passed + failed) + ')');
  process.exit(0);
} else {
  console.error('[zelazo-gate-test] NIEUDANE: ' + failed + '/' + (passed + failed));
  process.exit(1);
}
