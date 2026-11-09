/**
 * building-upkeep-resources-test.cjs
 * R-WEB-BUILDING-UPKEEP-RESOURCES-IMPL-Q1 (decyzja wlasciciela 2026-11-09)
 *
 * Utrzymanie SUROWCOWE budynku jest proporcjonalne do jego utrzymania w Pieniadzu:
 * dla kazdego surowca z `koszt_surowce` budynek zuzywa na ture
 * buildingUpkeep(budynek, poziom) x wspolczynnik (econ-params `budynki.utrzymanie_surowce_wspolczynnik`,
 * domyslnie 1) sztuk. Zastepuje dawna stala 5 szt./typ. Pieniadz utrzymania bez zmian.
 *
 *   A. wyliczenie (dane rzeczywiste buildings.json + econ-params.json)
 *   B. pobor + deficyt (deductBuildingStockCostAcrossCities / missingStockFor -- ten sam mechanizm co jednostki)
 *   C. gracz i AI ten sam kod (turn-economy liczy per owner; main.ts odejmuje dla gracza i AI)
 *   D. okablowanie: poziom przekazany w tick/podglad/UI; wspolczynnik z danych
 *   E. zapisy gry: brak migracji (regula z danych, nic nowego w save)
 *
 * Uruchomienie: node tools/building-upkeep-resources-test.cjs (z gra/, po npm install)
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) { console.error('[building-upkeep-resources-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.bur-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.bur-bundle.cjs');
fs.writeFileSync(ENTRY_FILE, `
export {
  buildingUpkeep, buildingResourceUpkeep, totalBuildingResourceUpkeep,
  buildingResourceUpkeepForBuiltIds, previewOwnerBuildingResourceUpkeep,
  configureBuildingResourceUpkeepRatio, getBuildingResourceUpkeepRatio,
} from '../src/game/economy-upkeep';
export { deductBuildingStockCostAcrossCities, missingStockFor, ownerResourceStockAll } from '../src/game/building-stock-cost';
`, 'utf8');
try {
  esbuild.buildSync({ entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE_FILE, logLevel: 'silent' });
} catch (e) { console.error('bundling failed:\n', e.message || e); process.exit(1); }
const M = require(BUNDLE_FILE);

let passed = 0, failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }
function eq(a, b, m) { assert(JSON.stringify(a) === JSON.stringify(b), `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const readJson = (p) => JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', p), 'utf8'));
const read = (p) => fs.readFileSync(path.resolve(__dirname, '..', p), 'utf8');
const bRaw = readJson('data/buildings.json');
const BUILDINGS = Array.isArray(bRaw) ? bRaw : (bRaw.buildings || bRaw);
const ECON = readJson('data/econ-params.json');

try {
  // -------------------------------------------------------------------------
  console.log('-- A. wyliczenie na danych rzeczywistych --');
  M.configureBuildingResourceUpkeepRatio(ECON, 'normal');
  eq(M.getBuildingResourceUpkeepRatio(), 1, 'A0: wspolczynnik z econ-params = 1 (1:1)');
  for (const d of ['easy', 'normal', 'hard']) {
    eq(ECON.budynki.utrzymanie_surowce_wspolczynnik[d], 1, `A0b: econ-params ${d} = 1`);
  }
  const get = (id) => BUILDINGS.find(b => b.id === id);
  for (const id of ['mury', 'kuznia', 'fort', 'wielka_odlewnia', 'palac_iii']) {
    const b = get(id);
    const g = M.buildingUpkeep(b, 1);
    const want = {};
    for (const [k, v] of Object.entries(b.koszt_surowce)) if (v > 0) want[k] = g;
    eq(M.buildingResourceUpkeep(b, 1), want, `A1: ${id} -> ${g} szt. kazdego surowca z kosztu (= zloto utrzymania)`);
  }
  // Przyklad z dispatchu: Mury = po tyle drewna, kamienia i cegly, ile Pieniadza.
  const mury = get('mury');
  const gm = M.buildingUpkeep(mury, 1);
  eq(Object.keys(M.buildingResourceUpkeep(mury, 1)).sort(), ['cegla', 'drewno', 'kamien'], 'A2: Mury -> drewno + kamien + cegla');
  assert(gm > 0 && M.buildingResourceUpkeep(mury, 1).drewno === gm, 'A2b: Mury drewno = zloto utrzymania');
  eq(M.buildingResourceUpkeep(get('stela'), 1), {}, 'A3: Stela (utrzymanie 0) -> brak utrzymania surowcowego');
  eq(M.buildingResourceUpkeep(get('palac'), 1), {}, 'A4: Palac (bez koszt_surowce) -> brak utrzymania surowcowego');
  // Poziomy: rosnie razem z Pieniadzem (przyrostUtrzymania).
  const kuznia = get('kuznia');
  assert(M.buildingUpkeep(kuznia, 3) > M.buildingUpkeep(kuznia, 1), 'A5: Kuznia ma przyrost utrzymania per poziom');
  eq(M.buildingResourceUpkeep(kuznia, 3).drewno, M.buildingUpkeep(kuznia, 3), 'A5b: poziom 3 -> surowce rosna jak Pieniadz');
  // Calosc katalogu.
  let bad = 0;
  for (const b of BUILDINGS) {
    const g = M.buildingUpkeep(b, 1);
    const r = M.buildingResourceUpkeep(b, 1);
    const types = Object.keys(b.koszt_surowce || {}).filter(k => b.koszt_surowce[k] > 0);
    if (g <= 0 || types.length === 0) { if (Object.keys(r).length !== 0) bad++; continue; }
    if (Object.keys(r).length !== types.length || Object.values(r).some(v => v !== g)) bad++;
  }
  eq(bad, 0, `A6: wszystkie ${BUILDINGS.length} budynkow zgodne z regula`);
  // Suma per surowiec z poziomami instancji.
  const inst = [{ record: mury, level: 1 }, { record: kuznia, level: 2 }, { record: mury, level: 1 }];
  const tot = M.totalBuildingResourceUpkeep(inst);
  eq(tot.drewno, 2 * M.buildingUpkeep(mury, 1) + M.buildingUpkeep(kuznia, 2), 'A7: suma drewna = 2xMury + Kuznia L2');
  eq(tot.cegla, 2 * M.buildingUpkeep(mury, 1), 'A7b: cegla tylko z Murow');

  // -------------------------------------------------------------------------
  console.log('-- B. pobor i deficyt (ten sam mechanizm co jednostki) --');
  {
    const cities = [
      { id: 'c1', ownerId: 0, surowce: { drewno: 10, kamien: 3, cegla: 0 } },
      { id: 'c2', ownerId: 0, surowce: { drewno: 6 } },
      { id: 'c9', ownerId: 1, surowce: { drewno: 100 } },
    ];
    const upkeep = M.totalBuildingResourceUpkeep([{ record: mury, level: 1 }]);
    const pool = M.ownerResourceStockAll(cities, 0);
    const missing = M.missingStockFor(pool, upkeep);
    M.deductBuildingStockCostAcrossCities(cities, 0, upkeep);
    const after = M.ownerResourceStockAll(cities, 0);
    eq(after.drewno, Math.max(0, 16 - upkeep.drewno), 'B1: drewno pobrane z puli panstwa');
    eq(after.kamien ?? 0, Math.max(0, 3 - upkeep.kamien), 'B2: kamien pobrany (deficyt -> 0, nie ujemny)');
    eq(after.cegla ?? 0, 0, 'B3: pusta pula cegly -> 0 (nie ujemna)');
    assert(missing.cegla > 0 || upkeep.cegla === 0, 'B4: brak cegly wykryty (missingStockFor) -> ten sam komunikat "Brak surowcow na utrzymanie budynkow"');
    eq(M.ownerResourceStockAll(cities, 1).drewno, 100, 'B5: pula innego wlasciciela nietknieta');
  }

  // -------------------------------------------------------------------------
  console.log('-- C. gracz i AI ten sam kod --');
  {
    const te = read('src/game/turn-economy.ts');
    assert(/for \(const oid of ownerIds\)/.test(te) && te.includes('totalBuildingResourceUpkeep(\n      buildingsByOwner.get(oid) ?? [],'),
      'C1: turn-economy liczy utrzymanie surowcowe budynkow dla KAZDEGO ownera (gracz i AI) tym samym wywolaniem');
    const mainSrc = read('src/main.ts');
    assert(mainSrc.includes('const aiResUpkeep = econ.resourceUpkeepByOwner.get(oid);')
      && mainSrc.includes('deductBuildingStockCostAcrossCities(cities, oid, aiResUpkeep);'),
      'C2: AI -- main.ts odejmuje resourceUpkeepByOwner (budynki + wojsko) z puli');
    assert(mainSrc.includes('const hResUpkeep = econ.resourceUpkeepByOwner.get(hOid);')
      && mainSrc.includes('deductBuildingStockCostAcrossCities(cities, hOid, hResUpkeep);'),
      'C3: gracz -- main.ts odejmuje resourceUpkeepByOwner tym samym mechanizmem');
    const needs = read('src/game/ai-resource-needs.ts');
    assert(!/utrzyman|upkeep/i.test(needs),
      'C4: ai-resource-needs nie zalezy od utrzymania -- deficyt tylko obcina pule do 0 i NIE blokuje budowy (brak zakleszczenia)');
  }

  // -------------------------------------------------------------------------
  console.log('-- D. okablowanie poziomu i wspolczynnika --');
  {
    const te = read('src/game/turn-economy.ts');
    assert(te.includes('configureBuildingResourceUpkeepRatio(rawEconParams, difficulty);'), 'D1: tick ustawia wspolczynnik z danych');
    const mainSrc = read('src/main.ts');
    assert(mainSrc.includes('function buildingLevelForOwnerBuilding('), 'D2: main.ts ma helper poziomu wg epoki/techu wlasciciela (jak tick)');
    assert(/buildingResourceUpkeepForBuiltIds\(builtIds, data\.buildings, bdef => buildingLevelForOwnerBuilding\(bdef, ownerId\)\)/.test(mainSrc), 'D3: podglad per miasto z poziomem');
    assert(/previewOwnerBuildingResourceUpkeep\(ownerId, cities, data\.buildings, cityBuilt, bdef => buildingLevelForOwnerBuilding\(bdef, ownerId\)\)/.test(mainSrc), 'D4: fallback panelu surowcow z poziomem');
    assert(/bdef => buildingLevelForOwnerBuilding\(bdef, 0\),/.test(mainSrc), 'D5: HUD brutto/netto (previewOwnerTotalResourceUpkeep) z poziomem');
    const cp = read('src/ui/cityPanel.ts');
    assert(cp.includes('resources: buildingResourceUpkeep(def, level),'), 'D6: karta/lista budynkow w miescie -- poziom');
    assert(cp.includes('sumOwnedBuildingsResourceUpkeep(built, data, city)'), 'D7: suma w panelu miasta z poziomami budynkow miasta');
    const ad = read('src/ui/entityCards/buildingAdapter.ts');
    assert(ad.includes('buildingResourceUpkeep(building, upkeepLevel)'), 'D8: karta budynku -- poziom');
    assert(!/BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE/.test(read('src/game/economy-upkeep.ts').replace(/\/\*[\s\S]*?\*\//g, '')),
      'D9: stala 5 szt./typ usunieta z kodu');
    // Polskie nazwy, nie surowe id: karta uzywa stockResourceLabel.
    assert(ad.includes('stockResourceLabel(k)'), 'D10: karta uzywa polskich etykiet surowcow');
  }

  // -------------------------------------------------------------------------
  console.log('-- E. zapisy gry --');
  {
    const main = read('src/main.ts');
    assert(!/utrzymanie_surowce|utrzymanieSurowce\w*:\s*\S+,\s*\/\/ save/.test(main), 'E1: brak nowego pola w zapisie');
    assert(main.includes('buildingResourceUpkeepByOwner.clear();'), 'E2: mapy upkeep czyszczone przy load i liczone z danych na nowo (brak migracji)');
  }
} finally {
  try { fs.unlinkSync(ENTRY_FILE); } catch (_) {}
  try { fs.unlinkSync(BUNDLE_FILE); } catch (_) {}
}

console.log(`\nbuilding-upkeep-resources-test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
