'use strict';
/**
 * unit-replace-test.cjs -- standalone Node sanity test for availableReplacementsFor()
 * (mechanizm "Zastąp", ZASTAP-JEDNOSTKI-PLAN.md). Run from gra/:
 *   node tools/unit-replace-test.cjs
 *
 * Bundles production.ts (+ deps) via esbuild, loads the REAL data/units.json,
 * and checks two scenarios from the dyspozycja:
 *   1. Rzym w epoce Żelazo: lista zamienników dla Hastati (Typ=Swordsman) zawiera
 *      inne miecznik-y tego samego Typ (Wojownik, Evocati), NIE zawiera Hastati
 *      samej siebie ani jednostek innej nacji (Hieros Lochos = Grecja).
 *   2. "Wojownik tyrreński" (Typ=Offensive) -> lista zawiera "Evocati" (Typ=Swordsman)
 *      mimo innego Typ, wyłącznie dzięki polu "Zastąp specjalnie" -- i tylko gdy
 *      Evocati jest faktycznie odblokowany (epoka/tech); gdy nie -- znika.
 *
 * Pure logic only -- no DOM, no THREE.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[unit-replace-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.unit-replace-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.unit-replace-bundle.cjs');

const ENTRY_TS = `
export {
  availableReplacementsFor,
  availableProduction,
  epochNumber,
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
  console.error('[unit-replace-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const { availableReplacementsFor } = M;

const unitsJson = require('../data/units.json');
const DATA = { buildings: [], units: Object.values(unitsJson) };

// --- test harness ------------------------------------------------------------
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

// Ctx: Rzym gracz w epoce Zelazo (3), Hutnictwo zelaza + Brazownictwo zbadane,
// bez bonusow cyw (civBonusy=[]) -- specTokens puste, wiec jednostki "Specjalna"
// innych nacji i tak odpadaja na bramce Nacja.
const RZYM_ZELAZO_CTX = {
  epoch: 3,
  civUnitNacja: 'Rzym',
  civBonusy: [],
  builtBuildingIds: [],
  placedImprovements: null,
};
const TECHS_ZELAZO = ['Brazownictwo', 'Brązownictwo', 'Hutnictwo żelaza'];

console.log('\n[unit-replace-test] Running tests...\n');

// --- Scenario 1: Hastati (Rzym, Zelazo, Typ=Swordsman) ----------------------
console.log('1. Rzym / Zelazo -- zamienniki dla Hastati (Typ=Swordsman)');
{
  const items = availableReplacementsFor('Hastati', DATA, TECHS_ZELAZO, RZYM_ZELAZO_CTX);
  const ids = items.map(i => i.id);
  assert(ids.length > 0, 'lista niepusta', 'ids=' + JSON.stringify(ids));
  assert(!ids.includes('Hastati'), 'Hastati nie zastepuje samej siebie', 'ids=' + JSON.stringify(ids));
  assert(ids.includes('Wojownik'), 'zawiera inny miecznik tego samego Typ (Wojownik, uniwersalny)', 'ids=' + JSON.stringify(ids));
  assert(ids.includes('Evocati'), 'zawiera Evocati (Rzym, Typ=Swordsman, odblokowany w Zelazie)', 'ids=' + JSON.stringify(ids));
  assert(!ids.includes('Hieros Lochos (Święty Zastęp)'), 'NIE zawiera Hieros Lochos (Grecja != Rzym)', 'ids=' + JSON.stringify(ids));
  assert(items.every(i => i.kind === 'jednostka' && typeof i.koszt === 'number'), 'każda pozycja ma kind=jednostka i liczbowy koszt');
}

// --- Scenario 2: Wojownik tyrreński -> Evocati mimo innego Typ --------------
console.log('\n2. "Wojownik tyrreński" (Typ=Offensive) -> dochodzi "Evocati" (Typ=Swordsman)');
{
  const items = availableReplacementsFor('Wojownik tyrreński', DATA, TECHS_ZELAZO, RZYM_ZELAZO_CTX);
  const ids = items.map(i => i.id);
  assert(ids.includes('Evocati'), 'Evocati obecny mimo innego Typ (pole "Zastąp specjalnie")', 'ids=' + JSON.stringify(ids));
  assert(!ids.includes('Wojownik tyrreński'), 'nie zastepuje samej siebie', 'ids=' + JSON.stringify(ids));
}

// --- Scenario 2b: bez odblokowanego Evocati (brak tech) -> znika ------------
console.log('\n2b. Bez tech "Hutnictwo żelaza" -- Evocati NIE jest jeszcze "dostępny", znika z listy');
{
  const ctxNoTech = { ...RZYM_ZELAZO_CTX, epoch: 2 }; // Braz -- Evocati wymaga Zelaza
  const items = availableReplacementsFor('Wojownik tyrreński', DATA, ['Brazownictwo', 'Brązownictwo'], ctxNoTech);
  const ids = items.map(i => i.id);
  assert(!ids.includes('Evocati'), 'Evocati zniknal (nieodblokowany w epoce Brazu)', 'ids=' + JSON.stringify(ids));
}

// --- Scenario 3: nieznana jednostka -> pusta lista --------------------------
console.log('\n3. Nieznana nazwa jednostki -> []');
{
  const items = availableReplacementsFor('Nie Ma Takiej Jednostki', DATA, TECHS_ZELAZO, RZYM_ZELAZO_CTX);
  assert(Array.isArray(items) && items.length === 0, 'zwraca pusta tablice dla nieznanej jednostki');
}

// --- Summary -----------------------------------------------------------------
console.log('');
if (failed === 0) {
  console.log('[unit-replace-test] WSZYSTKIE TESTY ZIELONE (' + passed + '/' + (passed + failed) + ')');
  process.exit(0);
} else {
  console.error('[unit-replace-test] NIEUDANE: ' + failed + '/' + (passed + failed));
  process.exit(1);
}
