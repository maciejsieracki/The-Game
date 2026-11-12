'use strict';
/**
 * prod-empty-gate-contract-test.cjs — R-PROD-EMPTY-GATE-Q1.
 *
 * Zgłoszenie właściciela: powiadomienie „Produkcja: <miasto> — Kolejka pusta — wybierz budynek
 * lub jednostkę” pojawiało się przy BRAKU surowców. Przyczyna (ustalona kodem, nie zgadywana):
 *  - bramka zdarzenia `cityHasAffordableLevelUpgrade` (main.ts) liczyła „do zrobienia” WYŁĄCZNIE
 *    magazyn państwa (`canAffordBuildingStock(pool, cost)`), a nie to, co wiersz „Ulepsz” w panelu
 *    uznaje za możliwe (`buildingCanBuildNow` = chipy: tech, lokalizacja, ETYKIETA SUROWCA, magazyn).
 *    Przykład: Garncarnia (poziom 2) kosztuje same Drewno, ale wymaga Gliny — przy 30 Drewna i 0 Gliny
 *    magazyn „wystarcza”, panel pokazuje wiersz nieaktywny, a zdarzenie się pojawia.
 *  - bramka jednostek nie znała oblężenia (`isCityUnderSiege`) i miała własną kopię warunku ludności.
 *
 * Ten plik sprawdza dwie rzeczy:
 *  A. KONTRAKT ŹRÓDEŁ — bramka zdarzenia używa WSPÓLNYCH predykatów z cityPanel.ts
 *     (`buildingCanBuildNow`, `unitRecruitAllowedNow`) i nie ma już ścieżki „sam magazyn”.
 *  B. ZACHOWANIE NA DANYCH — esbuild składa realne moduły czyste (building-resource-gate,
 *     building-stock-cost) i pokazuje, że magazyn-only daje „tak” tam, gdzie etykieta zasobu daje „nie”.
 *
 * Test żywy w Chromium (zdarzenie `prod-empty-*` przy zerowych i niezerowych surowcach) jest w
 * `tools/prod-empty-gate-real-render-test.cjs` — ten plik go NIE zastępuje.
 *
 * Usage (z gra/): node tools/prod-empty-gate-contract-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const MAIN = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const PANEL = fs.readFileSync(path.join(GRA, 'src', 'ui', 'cityPanel.ts'), 'utf8');

let pass = 0;
let fail = 0;
function assert(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  -- ' + detail : '')); }
}

/** Ciało funkcji `name` z main.ts / cityPanel.ts: od sygnatury do pierwszego `\n    }` (main) lub `\n}` (panel). */
function bodyOf(src, header, closeRe) {
  const i = src.indexOf(header);
  if (i < 0) return null;
  const rest = src.slice(i);
  const m = rest.match(closeRe);
  return m ? rest.slice(0, m.index + m[0].length) : rest;
}

console.log('-- A. kontrakt źródeł (bramka zdarzenia = wspólne predykaty panelu) --');

assert('cityPanel eksportuje buildingCanBuildNow',
  /export function buildingCanBuildNow\(/.test(PANEL));
assert('cityPanel eksportuje unitRecruitAllowedNow',
  /export function unitRecruitAllowedNow\(/.test(PANEL));

const unitAllowed = bodyOf(PANEL, 'export function unitRecruitAllowedNow(', /\n}\n/);
assert('unitRecruitAllowedNow sprawdza oblężenie (isCityUnderSiege)',
  !!unitAllowed && /isCityUnderSiege\(\[city\], city\)/.test(unitAllowed));
assert('unitRecruitAllowedNow sprawdza rekrutów imperium (empireRekruciAffordable)',
  !!unitAllowed && /empireRekruciAffordable\(city, mpCost, empireRekruciTotal\(city\)\)/.test(unitAllowed));
assert('unitRecruitAllowedNow sprawdza pulę państwa (missingStockFor)',
  !!unitAllowed && /missingStockFor\(ownerSurowcePoolFor\(city\), unitStockCost\(udef\)\)/.test(unitAllowed));
assert('unitRecruitAllowedNow sprawdza skarbiec ≥ koszt zakupu',
  !!unitAllowed && /skarb < item\.koszt/.test(unitAllowed));

assert('main.ts importuje buildingCanBuildNow i unitRecruitAllowedNow z ui/cityPanel',
  /from '\.\/ui\/cityPanel'/.test(MAIN)
  && /buildingCanBuildNow[\s\S]{0,200}from '\.\/ui\/cityPanel'/.test(MAIN.split('\n').filter(l => l.includes("from './ui/cityPanel'")).join('\n'))
  && /unitRecruitAllowedNow/.test(MAIN.split('\n').filter(l => l.includes("from './ui/cityPanel'")).join('\n')));

const lvl = bodyOf(MAIN, 'function cityHasAffordableLevelUpgrade(', /\n    }\n/);
assert('cityHasAffordableLevelUpgrade używa buildingCanBuildNow',
  !!lvl && /buildingCanBuildNow\(def, city, data, ctx, techs\)/.test(lvl));
assert('cityHasAffordableLevelUpgrade NIE ma już ścieżki „sam magazyn”',
  !!lvl && !/canAffordBuildingStock\(pool/.test(lvl));

const enq = bodyOf(MAIN, 'function cityHasAffordableBuildingEnqueue(', /\n    }\n/);
assert('cityHasAffordableBuildingEnqueue używa buildingCanBuildNow',
  !!enq && /buildingCanBuildNow\(def, city, data, ctx, techs\)/.test(enq));
assert('cityHasAffordableBuildingEnqueue NIE ma już ścieżki „sam magazyn”',
  !!enq && !/canAffordBuildingStock\(pool/.test(enq));

const unitRec = bodyOf(MAIN, 'function cityHasAffordableUnitRecruitment(', /\n    }\n/);
assert('cityHasAffordableUnitRecruitment używa unitRecruitAllowedNow',
  !!unitRec && /unitRecruitAllowedNow\(city, item, data, player\.skarbiec\)/.test(unitRec));
assert('cityHasAffordableUnitRecruitment NIE ma już własnej kopii warunku ludności',
  !!unitRec && !/canAffordUnitManpowerEmpire/.test(unitRec));

const fp = bodyOf(MAIN, 'function productionOptionsFingerprint(', /\n    }\n/);
assert('productionOptionsFingerprint używa tych samych bramek (buildingCanBuildNow + unitRecruitAllowedNow)',
  !!fp && /buildingCanBuildNow\(def, city, data, ctx, techs\)/.test(fp)
  && /unitRecruitAllowedNow\(city, item, data, player\.skarbiec\)/.test(fp));

assert('hak pomiarowy __prodEmptyTestDebug istnieje i jest za bramką dev/playtest',
  /prodEmptyProbeAllowed = import\.meta\.env\.DEV/.test(MAIN)
  && /__prodEmptyTestDebug = \{/.test(MAIN));

console.log('\n-- B. zachowanie na realnych danych (magazyn-only vs bramka panelu) --');

const ENTRY = path.resolve(__dirname, '.prod-empty-gate-entry.ts');
const BUNDLE = path.resolve(__dirname, '.prod-empty-gate-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { buildingRequiredActiveLabels, buildingResourceGateMet } from '../src/game/building-resource-gate.ts';
export { buildingStockCost, canAffordBuildingStock } from '../src/game/building-stock-cost.ts';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
});
const B = require(BUNDLE);
const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'buildings.json'), 'utf8'));
const list = Array.isArray(buildings) ? buildings : (buildings.buildings || Object.values(buildings));
const garncarnia = list.find(b => b.id === 'garncarnia');

assert('garncarnia w danych ma etykietę Glina (buildingRequiredActiveLabels)',
  !!garncarnia && B.buildingRequiredActiveLabels(garncarnia).includes('Glina'),
  JSON.stringify(B.buildingRequiredActiveLabels(garncarnia || {})));

if (garncarnia) {
  // Magazyn państwa: Drewno wystarcza na koszt, Gliny NIE MA.
  const cost = B.buildingStockCost(garncarnia);
  const pool = Object.fromEntries(Object.keys(cost).map(k => [k, 100000]));
  delete pool.glina;
  const stockOk = B.canAffordBuildingStock(pool, cost);
  const labelOk = B.buildingResourceGateMet(garncarnia, [], [], pool);
  console.log(`        (koszt=${JSON.stringify(cost)}, stockOk=${stockOk}, labelOk=${labelOk})`);
  assert('magazyn-only (stara bramka) uznaje Garncarnię za możliwą, gdy Glina = 0',
    stockOk === true);
  assert('bramka etykiety surowca (panel) uznaje ją za NIEmożliwą, gdy Glina = 0',
    labelOk === false);
  assert('zatem nowa bramka (stockOk && labelOk) nie zgłasza jej przy braku Gliny',
    (stockOk && labelOk) === false);
}

fs.rmSync(ENTRY, { force: true });
fs.rmSync(BUNDLE, { force: true });

console.log(`\nWYNIK: ${pass} PASS, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
