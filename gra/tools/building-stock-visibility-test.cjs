'use strict';
/**
 * building-stock-visibility-test.cjs -- R-WEB-RECRUIT-LIST-REGRESSION-Q1 (2026-10-24).
 * Run from gra/:  node tools/building-stock-visibility-test.cjs
 *
 * Zasada wlasciciela: budynek mozliwy do wybudowania, ale bez surowca w magazynie panstwa,
 * ma byc WIDOCZNY i wyszarzony z informacja, czego brakuje. Reguly dostepu (era, technologia,
 * kultura, bramka zlozowa/aktywnego surowca) NADAL ukrywaja/blokuja jak dotad.
 *
 * Kontrakt (DANE REALNE: gra/data/buildings.json, units.json, realny production.ts):
 *  1. Budynek z kosztem surowcowym (koszt_surowce), bez bramki dostepu, przy pustym magazynie
 *     pozostaje na liscie buildableProduction (NIE jest ukrywany przez zapas).
 *  2. Przy pustym magazynie canAffordBuildingStock = false, a missingStockFor podaje brakujacy
 *     surowiec z iloscia (tekst przyczyny w cityPanel: „Brakuje w magazynie: N X").
 *  3. Kontrola: budynek z bramka DOSTEPU (buildingRequiredActiveLabels niepusty) bez dostepu
 *     nadal NIE przechodzi buildingResourceGateMet (regula dostepu bez zmian).
 * Wyglad wiersza/przycisku budynku (wyszarzenie) w przegladarce: NIE_ZMIERZONO w tym tescie.
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[building-stock-visibility-test] esbuild not found. Run: npm ci --ignore-scripts (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.building-stock-visibility-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.building-stock-visibility-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, [
  "export { buildableProduction } from '../src/game/production';",
  "export { buildingStockCost, canAffordBuildingStock, missingStockFor } from '../src/game/building-stock-cost';",
  "export { buildingRequiredActiveLabels, buildingResourceGateMet } from '../src/game/building-resource-gate';",
  '',
].join('\n'), 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE_FILE, logLevel: 'silent', resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[building-stock-visibility-test] esbuild bundling failed:\n', e.message || e);
  try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* ignore */ }
  process.exit(1);
}

const M = require(BUNDLE_FILE);
let passed = 0;
let failed = 0;
function assert(cond, msg, extra) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + (extra ? (' -- ' + extra) : '')); }
}

const BUILDINGS = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'buildings.json'), 'utf8'));
const UNITS = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
const DATA = { buildings: BUILDINGS, units: UNITS };
const CITY = { id: 'stolica', name: 'Stolica', q: 0, r: 0, ownerId: 0, population: 3, surowce: {} };
const CTX_EMPTY = {
  epoch: 1, isCapital: true, cityHasCoastOrRiver: true, builtBuildingIds: [],
  empireBuiltIds: [], empireActiveResourceLabels: [], empireResourceStock: {},
};
const names = items => items.map(i => i.id);
// Wszystkie technologie z katalogu budynkow (kandydat musi przejsc bramke technologii, nie tu testowana).
const ALL_TECHS = [...new Set(BUILDINGS.map(b => (b.techUnlock || '').toString().trim()).filter(t => t && t !== '-' && t !== '—'))];

console.log('\n[building-stock-visibility-test] Running tests...\n');

// Kandydat: koszt surowcowy > 0, bez bramki dostepu, widoczny z pelnym magazynem.
const RICH = {};
for (const b of BUILDINGS) {
  for (const [k, v] of Object.entries(M.buildingStockCost(b))) RICH[k] = Math.max(RICH[k] || 0, v * 100);
}
const richList = names(M.buildableProduction(CITY, DATA, ALL_TECHS, { ...CTX_EMPTY, empireResourceStock: RICH }));
const candidate = BUILDINGS.find(b =>
  Object.keys(M.buildingStockCost(b)).length > 0
  && M.buildingRequiredActiveLabels(b).length === 0
  && richList.includes(b.id));

console.log('1. Budynek z kosztem surowcowym bez bramki dostepu, PUSTY magazyn: widoczny na liscie');
{
  if (!candidate) {
    assert(false, 'znaleziono budynek-kandydata (koszt surowcowy, bez bramki dostepu) w danych realnych');
  } else {
    const cost = M.buildingStockCost(candidate);
    const emptyList = names(M.buildableProduction(CITY, DATA, ALL_TECHS, CTX_EMPTY));
    assert(emptyList.includes(candidate.id),
      `${candidate.id} (${candidate.nazwa}) nie jest ukrywany przy pustym magazynie (lista budowy)`,
      'cost=' + JSON.stringify(cost));
    const missing = M.missingStockFor({}, cost);
    assert(Object.keys(missing).length > 0 && Object.values(missing).every(v => v > 0),
      'przy pustym magazynie brakuje surowca z iloscia (przyczyna do pokazania)', JSON.stringify(missing));
    assert(!M.canAffordBuildingStock({}, cost), 'przycisk budowy wylaczony: canAffordBuildingStock=false przy pustym magazynie');
    assert(M.canAffordBuildingStock(RICH, cost), 'z pelnym magazynem budynek dostepny (canAffordBuildingStock=true)');
    console.log('     kandydat: ' + candidate.id + ' koszt=' + JSON.stringify(cost));
  }
}

console.log('\n2. Bramka surowca etykietowego (R-WEB-RECRUIT-LIST-REGRESSION-Q1 r3, D1): w widoku wyszarzony, domyslnie (AI) ukryty');
{
  const gated = BUILDINGS.find(b => M.buildingRequiredActiveLabels(b).length > 0);
  if (!gated) {
    assert(false, 'znaleziono budynek z bramka dostepu w danych realnych');
  } else {
    assert(M.buildingResourceGateMet(gated, [], [], {}) === false,
      `${gated.id}: bez dostepu do surowca (brak etykiety i zapasu) bramka surowca nie przechodzi`);
    const gatedList = names(M.buildableProduction(CITY, DATA, ALL_TECHS, CTX_EMPTY));
    assert(!gatedList.includes(gated.id), `${gated.id}: domyslnie (AI/walidacja) nadal ukryty z listy budowy`);
    const viewList = names(M.buildableProduction(CITY, DATA, ALL_TECHS, { ...CTX_EMPTY, showResourceGatedBuildings: true }));
    assert(viewList.includes(gated.id), `${gated.id}: w widoku listy budowy widoczny (wyszarzony z przyczyna)`);
  }
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (_) { /* ignore */ }
if (failed > 0) process.exit(1);
