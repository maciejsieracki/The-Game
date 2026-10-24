'use strict';
/**
 * recruit-list-visibility-test.cjs -- standalone Node test: widocznosc listy rekrutacji.
 * Run from gra/:  node tools/recruit-list-visibility-test.cjs
 *
 * R-WEB-RECRUIT-LIST-REGRESSION-Q1 (2026-10-24): zgloszenie wlasciciela -- na poczatku
 * gry w panelu miasta „Rekrutacja" widoczna byla tylko jedna jednostka (Zwiadowca), mimo
 * ze dwie jednostki wojskowe Kamienia powinny byc obecne. Przyczyna: bramka zapasu surowca
 * w availableProduction (Braz/Zelazo, a od BUG-BRAMKA-DREWNO-BRAK 5682c066 takze Drewno)
 * UKRYWALA jednostke, gdy magazyn panstwa nie ma surowca. Wymaganie: jednostka bez
 * srodkow ma byc WIDOCZNA i wyszarzona z przyczyna.
 *
 * Kontrakt testu:
 *  - domyslny kontekst (logika gry: AI, walidacja) -- bramka zapasu NADAL ukrywa (bez zmian);
 *  - kontekst panelu (showStockGatedUnits: true) -- wojskowe jednostki Drewna/Brazu/Zelaza
 *    pozostaja na liscie przy braku zapasu; Zwiadowca zawsze;
 *  - kontekst panelu z zapasem -- jednostka nadal dostepna.
 * Wyszarzenie i przyczyna sa w cityPanel.ts / unitRecruitCard.ts (poza zakresem testu logiki).
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

const ENTRY_FILE = path.resolve(__dirname, '.recruit-list-visibility-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.recruit-list-visibility-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, "export { availableProduction, purchasableUnits } from '../src/game/production';\n", 'utf8');

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

const CITY = { id: 'test-city', q: 0, r: 0, ownerId: 0, population: 3 };
const UNITS = [
  { Jednostka: 'Wojownik', Epoka: 'Kamień', 'Rola (linia)': 'Wręcz', 'W zamian za': '-', Tech: '-',
    Surowiec: 'Drewno', 'Surowiec (ilość)': 13, 'Pieniądz (koszt)': 10 },
  { Jednostka: 'Oszczepnik', Epoka: 'Kamień', 'Rola (linia)': 'Dystans', 'W zamian za': '-', Tech: '-',
    Surowiec: 'Drewno', 'Surowiec (ilość)': 13, 'Pieniądz (koszt)': 10 },
  { Jednostka: 'Zwiadowca', Epoka: 'Kamień', Typ: 'Civilian', 'Rola (linia)': 'Wsparcie', 'W zamian za': '-', Tech: '-',
    Surowiec: null, 'Surowiec (ilość)': 0, 'Pieniądz (koszt)': 8 },
];
const DATA = { buildings: [], units: UNITS };
const NO_TECHS = [];
const names = items => items.map(i => i.id);
const MILITARY = ['Wojownik', 'Oszczepnik'];

console.log('\n[recruit-list-visibility-test] Running tests...\n');

console.log('1. Logika gry (domyslny kontekst): brak Drewna -> jednostki Drewna UKRYTE (bez zmian)');
{
  const items = availableProduction(CITY, DATA, NO_TECHS, { epoch: 1, builtBuildingIds: [], empireResourceStock: {} });
  assert(!names(items).includes('Wojownik') && !names(items).includes('Oszczepnik'),
    'domyslnie Wojownik/Oszczepnik ukryte przy braku Drewna', 'ids=' + JSON.stringify(names(items)));
  assert(names(items).includes('Zwiadowca'), 'Zwiadowca zawsze dostepny');
}

console.log('\n2. Panel rekrutacji (showStockGatedUnits): brak Drewna -> >=2 jednostki wojskowe WIDOCZNE');
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

console.log('\n3. Panel rekrutacji: brak Brazu -> jednostka Brazu widoczna (wyszarzana w UI); logika gry ukrywa');
{
  const bronze = { Jednostka: 'Hoplita', Epoka: 'Kamień', 'Rola (linia)': 'Wręcz', 'W zamian za': '-', Tech: '-',
    Surowiec: 'Brąz', 'Surowiec (ilość)': 5, 'Pieniądz (koszt)': 12 };
  const data = { buildings: [], units: [...UNITS, bronze] };
  const panel = purchasableUnits(CITY, data, NO_TECHS, {
    epoch: 1, builtBuildingIds: [], empireResourceStock: {}, showStockGatedUnits: true,
  });
  const logic = availableProduction(CITY, data, NO_TECHS, { epoch: 1, builtBuildingIds: [], empireResourceStock: {} });
  assert(names(panel).includes('Hoplita'), 'Hoplita (Brąz) widoczna w panelu bez Brazu w magazynie');
  assert(!names(logic).includes('Hoplita'), 'Hoplita nadal ukryta dla logiki gry (bez zmian)');
}

console.log('\n4. Panel rekrutacji z zapasem Drewna -> Wojownik dostepny');
{
  const items = purchasableUnits(CITY, DATA, NO_TECHS, {
    epoch: 1, builtBuildingIds: [], empireResourceStock: { drewno: 20 }, showStockGatedUnits: true,
  });
  assert(names(items).includes('Wojownik'), 'Wojownik dostepny z Drewnem w magazynie');
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (_) { /* ignore */ }
if (failed > 0) process.exit(1);
