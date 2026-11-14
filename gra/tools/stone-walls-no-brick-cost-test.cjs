'use strict';
/**
 * stone-walls-no-brick-cost-test.cjs -- R-WEB-DATA-STONE-WALLS-NO-BRICK-COST-Q1.
 * Mury kamienne (mury_kamienne) NIE wymagają cegły. Mury ceglane (mury) zachowują cegłę.
 * Uruchom z gra/:  node tools/stone-walls-no-brick-cost-test.cjs
 *
 * Test czerwony na bazie (origin/main 1b8ce0d39): mury_kamienne miał koszt_surowce
 * { drewno: 80, kamien: 80, cegla: 80 } (karta 160/160/160).
 */

const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.stone-walls-no-brick-cost-entry.ts');
const bundle = path.join(__dirname, '.stone-walls-no-brick-cost-bundle.cjs');
const esbuild = require(process.env.ESBUILD_ROOT || path.join(GRA, 'node_modules', 'esbuild'));

let passed = 0;
let failed = 0;
function check(cond, label, detail) {
  if (cond) passed++;
  else {
    failed++;
    console.error(`FAIL: ${label}${detail !== undefined ? ` -- ${JSON.stringify(detail)}` : ''}`);
  }
}

fs.writeFileSync(entry, `
export { buildingStockCost, canAffordBuildingStock, missingStockFor, deductBuildingStockCost } from '../src/game/building-stock-cost';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: bundle,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
  const M = require(bundle);

  const buildings = require(path.join(GRA, 'data', 'buildings.json'));
  const list = Array.isArray(buildings) ? buildings : (buildings.buildings || buildings);
  const byId = (id) => list.find((b) => b && b.id === id);
  const kamienne = byId('mury_kamienne');
  const ceglane = byId('mury');
  check(!!kamienne && !!ceglane, 'dane: mury_kamienne i mury istnieją w buildings.json');

  // (1) Dane: Mury kamienne bez cegły, z drewnem i kamieniem w dotychczasowych ilościach (80 -> 160 na karcie).
  const kKoszt = kamienne.koszt_surowce || {};
  check(!('cegla' in kKoszt), 'D1 mury_kamienne.koszt_surowce nie zawiera cegla', kKoszt);
  check(kKoszt.drewno === 80 && kKoszt.kamien === 80, 'D2 mury_kamienne: drewno 80, kamien 80 (bez zmiany ilości)', kKoszt);

  // (2) Mury ceglane zachowują cegłę.
  const cKoszt = ceglane.koszt_surowce || {};
  check(cKoszt.cegla === 80 && cKoszt.drewno === 80 && cKoszt.kamien === 80, 'D3 mury (ceglane): cegla 80 zachowana', cKoszt);

  // (3) Koszt realny po skali epoki (buildingStockCost): Murów kamiennych bez cegły.
  const kReal = M.buildingStockCost(kamienne);
  check(!('cegla' in kReal) && kReal.drewno === 160 && kReal.kamien === 160, 'K1 buildingStockCost(mury_kamienne) = {drewno:160, kamien:160}', kReal);
  const cReal = M.buildingStockCost(ceglane);
  check(cReal.cegla === 320 && cReal.drewno === 320 && cReal.kamien === 320, 'K2 buildingStockCost(mury) = 320/320/320 (era x2 po FALA2)', cReal);

  // (4) Bramka budowy (canAffordBuildingStock) na puli bez cegły.
  const pulaBezCegly = { drewno: 1000, kamien: 1000, cegla: 0 };
  check(M.canAffordBuildingStock(pulaBezCegly, kReal) === true, 'G1 bramka: Mury kamienne BUDOWALNE przy 0 cegły w magazynie');
  check(M.canAffordBuildingStock(pulaBezCegly, cReal) === false, 'G2 bramka: Mury ceglane ZABLOKOWANE przy 0 cegły w magazynie');
  check(M.missingStockFor(pulaBezCegly, kReal).cegla === undefined, 'G3 brak wpisu cegły w brakach Murów kamiennych', M.missingStockFor(pulaBezCegly, kReal));
  check(M.missingStockFor(pulaBezCegly, cReal).cegla === 320, 'G4 brak cegły Murów ceglanych = 320', M.missingStockFor(pulaBezCegly, cReal));

  // (5) Pobór kosztu: Murów kamiennych nie zmniejsza cegły.
  const po = M.deductBuildingStockCost({ drewno: 500, kamien: 500, cegla: 50 }, kReal);
  check(po.cegla === 50 && po.drewno === 340 && po.kamien === 340, 'P1 pobór Murów kamiennych: cegla bez zmian, drewno/kamień -160', po);

  // (6) Mutacja: przywrócenie cegły w danych ma dawać czerwony wynik (ten test to wykrywa).
  const mutated = { ...kamienne, koszt_surowce: { drewno: 80, kamien: 80, cegla: 80 } };
  const kMut = M.buildingStockCost(mutated);
  check(M.canAffordBuildingStock(pulaBezCegly, kMut) === false, 'M1 mutacja (cegla w Murach kamiennych) blokuje budowę -- test wykrywa regresję');
} finally {
  for (const f of [entry, bundle]) {
    try { fs.unlinkSync(f); } catch (_) { /* brak pliku */ }
  }
}

console.log(`stone-walls-no-brick-cost-test: ${passed} PASS, ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
