'use strict';
/**
 * building-resource-visibility-test.cjs -- R-WEB-RECRUIT-LIST-REGRESSION-Q1 r3 (2026-10-24).
 * Run from gra/:  node tools/building-resource-visibility-test.cjs
 *
 * Zasada wlasciciela: element mozliwy do wybudowania/rekrutacji, ale bez surowca, ma byc
 * WIDOCZNY i wyszarzony z informacja czego brakuje. Dotyczy budynkow (bramka surowca
 * etykietowego buildingResourceGateMet) i zamiennikow „Zastąp” (bramka zapasu Braz/Zelazo/Drewno).
 * Reguly ery/technologii/lokalizacji/prerekwizytow NADAL ukrywaja.
 *
 * Kontrakt (DANE REALNE: gra/data/buildings.json, units.json, realny production.ts):
 *  1. Widok (showResourceGatedBuildings=true): budynek z bramka surowca bez zapasu JEST na liscie.
 *  2. Domyslnie (AI, walidacja): ten sam budynek NIE jest na liscie (zachowanie gry bez zmian).
 *  3. Z dostarczonym surowcem budynek jest na liscie w obu trybach.
 *  4. Bramka technologii nadal ukrywa budynek w widoku.
 *  5. Zastąp (showStockGatedUnits=true): jednostka bez zapasu jest na liscie, a
 *     unitStockShortfallLabel podaje przyczyne; domyslnie jest ukryta; z zapasem brak przyczyny.
 * Wyglad wiersza i modala: building-resource-visibility-ui-test.cjs (Chromium).
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[building-resource-visibility-test] esbuild not found. Run: npm ci --ignore-scripts (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.building-resource-visibility-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.building-resource-visibility-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, [
  "export { buildableProduction, availableReplacementsFor, unitStockShortfallLabel } from '../src/game/production';",
  "export { buildingRequiredActiveLabels, buildingResourceGateMet } from '../src/game/building-resource-gate';",
  '',
].join('\n'), 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE_FILE, logLevel: 'silent', resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[building-resource-visibility-test] esbuild bundling failed:\n', e.message || e);
  try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* ignore */ }
  process.exit(1);
}

const M = require(BUNDLE_FILE);
let passed = 0;
let failed = 0;
function assert(cond, msg, extra) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + (extra !== undefined ? (' -- ' + JSON.stringify(extra)) : '')); }
}

const BUILDINGS = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'buildings.json'), 'utf8'));
const UNITS = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
const DATA = { buildings: BUILDINGS, units: UNITS };
const CITY = { id: 'stolica', name: 'Stolica', q: 0, r: 0, ownerId: 0, population: 3, surowce: {} };
const ALL_TECHS = [...new Set(BUILDINGS.map(b => (b.techUnlock || '').toString().trim())
  .filter(t => t && t !== '-' && t !== '—'))];
const BASE = {
  isCapital: true, cityHasCoastOrRiver: true, builtBuildingIds: [],
  empireBuiltIds: [], empireActiveResourceLabels: [], empireResourceStock: {},
};
const ids = list => list.map(i => i.id);
const ALL_STOCK = {};
for (const k of ['drewno', 'kamien', 'glina', 'ruda', 'zelazo', 'braz', 'stal', 'sol', 'cegla', 'ceramika', 'zloto', 'kon']) {
  ALL_STOCK[k] = 100000;
}

console.log('\n[building-resource-visibility-test] Running tests...\n');

// Kandydat: budynek z bramka surowca etykietowego; tech/prerekwizyt spelnione (ALL_TECHS, isCapital).
const gatedCandidates = BUILDINGS.filter(b => M.buildingRequiredActiveLabels(b).length > 0);
const candidate = gatedCandidates.find(b => {
  const ctx = { ...BASE, epoch: b.epokaWejscia, empireResourceStock: {} };
  return ids(M.buildableProduction(CITY, DATA, ALL_TECHS, { ...ctx, showResourceGatedBuildings: true })).includes(b.id);
});

console.log('1. Budynek z bramka surowca, pusty magazyn: widoczny w widoku listy budowy');
{
  assert(gatedCandidates.length > 0, 'w danych realnych sa budynki z bramka surowca', gatedCandidates.map(b => b.id));
  assert(!!candidate, 'znaleziono kandydata (bramka surowca, tech/prerekwizyt spelnione)');
  if (candidate) {
    const ctx = { ...BASE, epoch: candidate.epokaWejscia, empireResourceStock: {} };
    const view = ids(M.buildableProduction(CITY, DATA, ALL_TECHS, { ...ctx, showResourceGatedBuildings: true }));
    assert(view.includes(candidate.id), `${candidate.id} (${candidate.nazwa}) widoczny w widoku przy pustym magazynie`);
    assert(M.buildingResourceGateMet(candidate, [], [], {}) === false,
      `${candidate.id}: bramka surowca NIE przechodzi przy pustym magazynie (wiersz wyszarzony)`);
    console.log('     kandydat: ' + candidate.id + ' wymaga=' + JSON.stringify(M.buildingRequiredActiveLabels(candidate)));
  }
}

console.log('\n2. Domyslny tryb (AI, walidacja): ten sam budynek NIE jest na liscie (regula gry bez zmian)');
{
  if (candidate) {
    const ctx = { ...BASE, epoch: candidate.epokaWejscia, empireResourceStock: {} };
    const def = ids(M.buildableProduction(CITY, DATA, ALL_TECHS, ctx));
    assert(!def.includes(candidate.id), `${candidate.id} nieobecny w trybie domyslnym (AI nie buduje bez surowca)`);
  } else {
    assert(false, 'kandydat wymagany do testu 2');
  }
}

console.log('\n3. Z dostarczonym surowcem budynek jest na liscie w obu trybach');
{
  if (candidate) {
    const ctx = { ...BASE, epoch: candidate.epokaWejscia, empireResourceStock: ALL_STOCK };
    const def = ids(M.buildableProduction(CITY, DATA, ALL_TECHS, ctx));
    const view = ids(M.buildableProduction(CITY, DATA, ALL_TECHS, { ...ctx, showResourceGatedBuildings: true }));
    assert(def.includes(candidate.id), `${candidate.id} dostepny w trybie domyslnym z zapasem`);
    assert(view.includes(candidate.id), `${candidate.id} dostepny w widoku z zapasem`);
  } else {
    assert(false, 'kandydat wymagany do testu 3');
  }
}

console.log('\n4. Bramka technologii nadal ukrywa budynek w widoku (regula dostepu bez zmian)');
{
  const techGated = BUILDINGS.find(b => {
    const t = (b.techUnlock || '').toString().trim();
    return t && t !== '-' && t !== '—' && M.buildingRequiredActiveLabels(b).length === 0;
  });
  assert(!!techGated, 'znaleziono budynek z wymogiem technologii');
  if (techGated) {
    const ctx = { ...BASE, epoch: techGated.epokaWejscia, empireResourceStock: ALL_STOCK };
    const view = ids(M.buildableProduction(CITY, DATA, [], { ...ctx, showResourceGatedBuildings: true }));
    assert(!view.includes(techGated.id), `${techGated.id}: bez technologii ${techGated.techUnlock} nadal ukryty w widoku`);
  }
}

console.log('\n5. Zastąp: jednostka bez zapasu widoczna w widoku, przyczyna podana; domyslnie ukryta');
{
  let pair = null;
  for (const u of UNITS) {
    const ctxBase = { ...BASE, epoch: 4, empireResourceStock: {} };
    const strict = ids(M.availableReplacementsFor(u.Jednostka, DATA, ALL_TECHS, ctxBase));
    const view = ids(M.availableReplacementsFor(u.Jednostka, DATA, ALL_TECHS, { ...ctxBase, showStockGatedUnits: true }));
    const extra = view.filter(id => !strict.includes(id));
    if (extra.length > 0) { pair = { current: u.Jednostka, strict, view, extra }; break; }
  }
  assert(!!pair, 'znaleziono jednostke, dla ktorej widok Zastąp ma pozycje bez zapasu');
  if (pair) {
    const unitOf = id => UNITS.find(u => u.Jednostka === id);
    assert(pair.extra.every(id => M.unitStockShortfallLabel(unitOf(id), {}) !== null),
      'kazda pozycja dodatkowa w widoku ma przyczyne braku zapasu', pair.extra);
    assert(pair.strict.every(id => M.unitStockShortfallLabel(unitOf(id), {}) === null),
      'pozycje domyslne (AI-like) nie maja przyczyny braku (zapas przeszedl bramke)');
    console.log('     jednostka: ' + pair.current + ' ukryte-domyslnie=' + JSON.stringify(pair.extra));
    const withStock = ids(M.availableReplacementsFor(pair.current, DATA, ALL_TECHS, {
      ...BASE, epoch: 4, empireResourceStock: ALL_STOCK, showStockGatedUnits: true,
    }));
    assert(pair.extra.every(id => withStock.includes(id)), 'z zapasem pozycje widoczne i bez przyczyny braku');
  }
  const woj = UNITS.find(u => u.Jednostka === 'Wojownik');
  assert(M.unitStockShortfallLabel(woj, {}) === 'Brak w magazynie państwa: Drewno',
    'Wojownik bez drewna: przyczyna „Brak w magazynie państwa: Drewno”', M.unitStockShortfallLabel(woj, {}));
  assert(M.unitStockShortfallLabel(woj, { drewno: 50 }) === null, 'Wojownik z drewnem: brak przyczyny');
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (_) { /* ignore */ }
if (failed > 0) process.exit(1);
