'use strict';
/**
 * granary2-tech-data-guard-test.cjs — R-WEB-GRANARY2-TECH-DATA-FIX-Q1 (2026-11-05).
 *
 * Zgłoszenie właściciela: Spichlerz II pokazuje „Wymagane badania: Warzelnia soli” (czerwone),
 * a budynku nie da się zbudować. Przyczyna: buildings.json spichlerz_ii.techUnlock = "Warzelnia soli"
 * to NIE technologia z tech.json, tylko ulepszenie terenu odblokowywane przez „Garncarstwo”
 * (kolumna „Odblokowuje ulepszenie terenu”). Żadna technologia nie ma tego budynku w „Odblokowuje budynek”,
 * więc production.ts (availableProduction / eraBuildingCatalog) nigdy nie dopuszcza budynku.
 *
 * Test ma dwie części:
 *   A) STRAŻNIK DANYCH — każdy niepusty techUnlock (buildings.json) i Tech (units.json) musi istnieć
 *      w tech.json (Technologia). Pada, gdy wpis wskazuje nieistniejącą technologię.
 *   B) ZACHOWANIE — Spichlerz II jest budowalny z: epoką 2, Spichlerzem I w mieście, Pismem,
 *      solą w magazynie państwa i ceramiką (garncarnia w imperium lub zapas Ceramiki).
 *      Bez Pisma, bez Soli albo bez Ceramiki — NIE jest budowalny. Bez epoki 2 — NIE jest budowalny.
 *
 * Uruchom z gra/:  node tools/granary2-tech-data-guard-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.granary2-tech-guard-entry.ts');
const BUNDLE = path.resolve(__dirname, '.granary2-tech-guard-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { buildableProduction, eraBuildingCatalog } from '../src/game/production';
export { buildingStockCost } from '../src/game/building-stock-cost';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} finally {
  try { fs.unlinkSync(ENTRY); } catch (_) { /* best effort */ }
}

const M = require(BUNDLE);
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(GRA, rel), 'utf8'));
const rawBuildings = readJson('data/buildings.json');
const rawUnits = readJson('data/units.json');
const techNames = new Set(readJson('data/tech.json').technologie.map(t => t.Technologia));
const DATA = { buildings: rawBuildings, units: [] };
const BLANK = new Set(['', '-', '—']);

let pass = 0, fail = 0;
function ok(c, m) {
  if (c) { pass++; }
  else { fail++; console.error('  FAIL:', m); }
}

// ---------------------------------------------------------------------------
// A) STRAŻNIK DANYCH
// ---------------------------------------------------------------------------
{
  const badBuildings = rawBuildings
    .filter(b => b.techUnlock != null && !BLANK.has(String(b.techUnlock).trim())
      && !techNames.has(String(b.techUnlock).trim()))
    .map(b => `${b.id}.techUnlock="${b.techUnlock}"`);
  ok(badBuildings.length === 0,
    `buildings.json: techUnlock spoza tech.json: ${badBuildings.join(', ') || '(brak)'}`);

  const badUnits = rawUnits
    .filter(u => u.Tech != null && !BLANK.has(String(u.Tech).trim())
      && !techNames.has(String(u.Tech).trim()))
    .map(u => `${u.Jednostka}.Tech="${u.Tech}"`);
  ok(badUnits.length === 0,
    `units.json: Tech spoza tech.json: ${badUnits.join(', ') || '(brak)'}`);

  const sII = rawBuildings.find(b => b.id === 'spichlerz_ii');
  ok(sII && sII.techUnlock === 'Pismo',
    `spichlerz_ii.techUnlock powinien być 'Pismo' (jest: ${sII && sII.techUnlock})`);
  ok(sII && sII.epokaWejscia === 2, 'spichlerz_ii.epokaWejscia pozostaje 2');
  ok(sII && sII.koszt_surowce && sII.koszt_surowce.drewno === 50 && sII.koszt_surowce.kamien === 50 && sII.koszt_surowce.cegla === 50,
    'koszt budowy Spichlerza II (drewno = kamień = cegła = 50; R-WEB-BUILDING-COSTS-ERA-RESOURCES-IMPL-Q1)');
}

// ---------------------------------------------------------------------------
// B) ZACHOWANIE (production.ts — ta sama ścieżka co panel miasta)
// ---------------------------------------------------------------------------
const CITY = { id: 'c1', q: 0, r: 0, ownerId: 0, population: 5 };
const need = (id) => M.buildingStockCost(rawBuildings.find(x => x.id === id));
const S2_STOCK = { ...need('spichlerz_ii'), sol: 5, ceramika: 5 };

function baseCtx(o) {
  return Object.assign({
    epoch: 2,
    builtBuildingIds: ['spichlerz'],
    productionQueue: [],
    isCapital: true,
    ownerId: 0,
    difficulty: 'normal',
    empireResourceStock: S2_STOCK,
    empireBuiltIds: [],
  }, o);
}
const buildable = (techs, o) => M.buildableProduction(CITY, DATA, techs, baseCtx(o)).map(i => i.id).includes('spichlerz_ii');
const entry = (techs, o) => M.eraBuildingCatalog(DATA, techs, baseCtx(o)).find(e => e.id === 'spichlerz_ii');

// Pełny zestaw: Pismo + epoka 2 + Spichlerz I + sól + ceramika (garncarnia w imperium).
const GOOD_CTX = { empireBuiltIds: ['garncarnia'] };

ok(buildable(['Pismo'], GOOD_CTX),
  'Spichlerz II budowalny: Pismo + epoka 2 + Spichlerz I + sól + ceramika (garncarnia)');

const ePlain = entry(['Pismo'], GOOD_CTX);
ok(ePlain && ePlain.status === 'ready',
  `eraBuildingCatalog spichlerz_ii status='ready' przy pełnych warunkach (jest: ${ePlain && ePlain.status}, missingTech=${ePlain && ePlain.missingTech})`);

// Ceramika jako zapas państwa zamiast garncarni.
ok(buildable(['Pismo'], { empireBuiltIds: [], empireResourceStock: S2_STOCK }),
  'Spichlerz II budowalny z zapasem Ceramiki w magazynie państwa (bez garncarni)');

// Brak Garncarstwa -> niebudowalny, a katalog wskazuje właściwą brakującą technologię.
ok(!buildable([], GOOD_CTX), 'Spichlerz II niebudowalny bez Pisma');
const eNoTech = entry([], GOOD_CTX);
ok(eNoTech && eNoTech.status === 'locked' && eNoTech.missingTech === 'Pismo',
  `katalog: bez Pisma status='locked', missingTech='Pismo' (jest: ${eNoTech && eNoTech.status}/${eNoTech && eNoTech.missingTech})`);

// Epoka 1 -> niebudowalny (epokaWejscia 2 pozostaje bramką epoki).
ok(!buildable(['Pismo'], { ...GOOD_CTX, epoch: 1 }), 'Spichlerz II niebudowalny w epoce 1');

// Brak Spichlerza I -> niebudowalny (upgradeFrom).
ok(!buildable(['Pismo'], { ...GOOD_CTX, builtBuildingIds: [] }), 'Spichlerz II niebudowalny bez Spichlerza I');

// Brak soli w imperium -> niebudowalny.
ok(!buildable(['Pismo'], { ...GOOD_CTX, empireResourceStock: { ...S2_STOCK, sol: 0 } }),
  'Spichlerz II niebudowalny bez soli (magazyn państwa 0)');

// Brak ceramiki (ani garncarni, ani zapasu) -> niebudowalny. Zasada właściciela: ceramika + sól.
ok(!buildable(['Pismo'], { empireBuiltIds: [], empireResourceStock: { ...S2_STOCK, ceramika: 0 } }),
  'Spichlerz II niebudowalny bez Ceramiki (brak garncarni i zapasu) — zasada właściciela: ceramika + sól');

console.log(`granary2-tech-data-guard-test: PASS ${pass} / FAIL ${fail}`);
if (fail > 0) process.exit(1);
