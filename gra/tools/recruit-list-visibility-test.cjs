'use strict';
/**
 * recruit-list-visibility-test.cjs -- standalone Node test: widocznosc listy rekrutacji.
 * Run from gra/:  node tools/recruit-list-visibility-test.cjs
 *
 * R-WEB-RECRUIT-LIST-REGRESSION-Q1 (2026-10-24): zgloszenie wlasciciela -- na poczatku
 * gry w panelu miasta „Rekrutacja" widoczna byla tylko jedna jednostka (Zwiadowca), mimo
 * ze dwie jednostki wojskowe Kamienia powinny byc obecne. Przyczyna: bramka zapasu surowca
 * w availableProduction (Braz/Zelazo od DOSTEP-SUROWCE-Q1 daacd43a, Drewno od
 * BUG-BRAMKA-DREWNO-BRAK 5682c066) UKRYWALA jednostke, gdy magazyn panstwa nie ma surowca.
 * Wymaganie: jednostka bez srodkow ma byc WIDOCZNA i wyszarzona z przyczyna.
 *
 * Kontrakt testu (DANE REALNE: gra/data/units.json, nie fixtury):
 *  - domyslny kontekst (logika gry: AI, walidacja) -- bramka zapasu NADAL ukrywa (bez zmian);
 *  - lista panelu (recruitPanelPurchasableUnits -> showStockGatedUnits: true) -- wojskowe
 *    jednostki Drewna/Brazu/Zelaza pozostaja przy braku zapasu; Zwiadowca zawsze;
 *  - lista panelu z zapasem -- jednostka nadal dostepna.
 * Test wyszarzenia wiersza (DOM) jest w recruit-list-visibility-ui-test.cjs.
 * Bundluje realny production.ts przez esbuild; bez DOM.
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[recruit-list-visibility-test] esbuild not found. Run: npm ci --ignore-scripts (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.recruit-list-visibility-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.recruit-list-visibility-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, [
  "export { availableProduction, purchasableUnits } from '../src/game/production';",
  '',
].join('\n'), 'utf8');

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
  console.error('[recruit-list-visibility-test] esbuild bundling failed:\n', e.message || e);
  try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* ignore */ }
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const { availableProduction, purchasableUnits } = M;

let passed = 0;
let failed = 0;
function assert(cond, msg, extra) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else {
    failed++;
    console.error('  [FAIL] ' + msg + (extra ? (' -- ' + extra) : ''));
  }
}

// Dane REALNE z gra/data/units.json (nie fixtury).
const UNITS = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
const DATA = { buildings: [], units: UNITS };
const CITY = { id: 'test-city', q: 0, r: 0, ownerId: 0, population: 3 };
const NO_TECHS = [];
const names = items => items.map(i => i.id);
const MILITARY = ['Wojownik', 'Oszczepnik'];

function unitOf(name) {
  const u = UNITS.find(x => x && x.Jednostka === name);
  if (!u) throw new Error('units.json: brak jednostki ' + name);
  return u;
}

console.log('\n[recruit-list-visibility-test] Running tests...\n');

console.log('1. Nowa gra, brak Drewna, logika gry (domyslny kontekst): jednostki Drewna UKRYTE (bez zmian)');
{
  const items = availableProduction(CITY, DATA, NO_TECHS, { epoch: 1, builtBuildingIds: [], empireResourceStock: {} });
  assert(!names(items).includes('Wojownik') && !names(items).includes('Oszczepnik'),
    'domyslnie Wojownik/Oszczepnik ukryte przy braku Drewna', 'ids=' + JSON.stringify(names(items)));
  assert(names(items).includes('Zwiadowca'), 'Zwiadowca zawsze dostepny');
}

console.log('\n2. Nowa gra, brak Drewna, LISTA PANELU (showStockGatedUnits): >=2 jednostki wojskowe WIDOCZNE');
{
  const items = purchasableUnits(CITY, DATA, NO_TECHS, {
    epoch: 1, builtBuildingIds: [], empireResourceStock: {}, showStockGatedUnits: true,
  });
  const ids = names(items);
  const military = ids.filter(id => MILITARY.includes(id));
  assert(military.length >= 2, 'na liscie panelu sa >=2 jednostki wojskowe przy braku Drewna',
    'ids=' + JSON.stringify(ids));
  assert(ids.includes('Zwiadowca'), 'Zwiadowca widoczny w panelu');
}

console.log('\n3. Lista panelu: brak Brazu/Zelaza -> jednostka widoczna (wyszarzana w UI); logika gry ukrywa');
{
  const bronze = UNITS.find(u => u && u.Surowiec === 'Brąz' && u.Epoka === 'Kamień')
    || UNITS.find(u => u && u.Surowiec === 'Brąz');
  if (!bronze) throw new Error('units.json: brak jednostki z Surowiec=Brąz');
  // Jednostka Brazu wymaga epoki Brazu, technologii (Tech) i Koszar w miescie -- podajemy realnie.
  const techs = [bronze.Tech];
  const panel = purchasableUnits(CITY, DATA, techs, {
    epoch: 2, builtBuildingIds: ['koszary'], empireResourceStock: {}, showStockGatedUnits: true,
  });
  const logic = availableProduction(CITY, DATA, techs, { epoch: 2, builtBuildingIds: ['koszary'], empireResourceStock: {} });
  assert(names(panel).includes(bronze.Jednostka),
    bronze.Jednostka + ' (Brąz) widoczna w panelu bez Brazu w magazynie');
  assert(!names(logic).includes(bronze.Jednostka),
    bronze.Jednostka + ' nadal ukryta dla logiki gry (bez zmian)');
}

console.log('\n4. Lista panelu z zapasem Drewna (20) -> Wojownik dostepny');
{
  const items = purchasableUnits(CITY, DATA, NO_TECHS, {
    epoch: 1, builtBuildingIds: [], empireResourceStock: { drewno: 20 }, showStockGatedUnits: true,
  });
  assert(names(items).includes('Wojownik'), 'Wojownik dostepny z Drewnem w magazynie');
}

console.log('\n5. Dane: Wojownik/Oszczepnik maja koszt Drewna w units.json (potwierdzenie zalozenia)');
{
  const w = unitOf('Wojownik');
  const o = unitOf('Oszczepnik');
  assert(w['Surowiec'] === 'Drewno' && Number(w['Surowiec (ilość)']) > 0, 'Wojownik: Surowiec=Drewno, ilosc>0',
    JSON.stringify({ s: w['Surowiec'], i: w['Surowiec (ilość)'] }));
  assert(o['Surowiec'] === 'Drewno' && Number(o['Surowiec (ilość)']) > 0, 'Oszczepnik: Surowiec=Drewno, ilosc>0',
    JSON.stringify({ s: o['Surowiec'], i: o['Surowiec (ilość)'] }));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (_) { /* ignore */ }
if (failed > 0) process.exit(1);
