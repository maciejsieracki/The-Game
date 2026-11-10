/**
 * building-upkeep-resources-test.cjs
 * R-WEB-BUILDING-UPKEEP-RESOURCES-IMPL-Q1 (decyzja wlasciciela 2026-11-09; r2 wg dispatchu)
 *
 * Utrzymanie SUROWCOWE budynku jest proporcjonalne do jego utrzymania w Pieniadzu:
 * dla kazdego surowca z `koszt_surowce` budynek zuzywa na ture
 * floor(surowe utrzymanie Pieniadza na poziomie) x wspolczynnik (econ-params
 * `budynki.utrzymanie_surowce_wspolczynnik`, domyslnie 1) sztuk. "Surowe" = pole `utrzymanie`
 * + `przyrostUtrzymania` per poziom, BEZ FALA2 i BEZ mnoznika epoki (dotycza tylko zlota).
 * Zastepuje dawna stala 5 szt./typ. Pieniadz utrzymania bez zmian.
 *
 *   A. wyliczenie (dane rzeczywiste buildings.json + econ-params.json)
 *   B. pobor + deficyt (deductBuildingStockCostAcrossCities / missingStockFor -- ten sam mechanizm co jednostki)
 *   C. gracz i AI ten sam kod (turn-economy liczy per owner; main.ts odejmuje dla gracza i AI)
 *   D. okablowanie poziomu i wspolczynnika w UI/main (wiring)
 *   F. ZACHOWANIE: prawdziwy advanceCityEconomy -- wspolczynnik z danych wplywa na pobor ticka,
 *      per owner (resolveOwnerUpkeepDifficulty), gracz i AI dostaja to samo
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
import { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../src/map/generator';
import { computeStartPlacements } from '../src/units/setup';
import { foundCity, cityName } from '../src/game/cities';
import { loadGameData } from '../src/data/loader';
import { advanceCityEconomy } from '../src/game/turn-economy';
export {
  buildingUpkeep, buildingResourceUpkeep, totalBuildingResourceUpkeep,
  buildingResourceUpkeepForBuiltIds, previewOwnerBuildingResourceUpkeep,
  readBuildingResourceUpkeepRatio,
} from '../src/game/economy-upkeep';
export { deductBuildingStockCostAcrossCities, missingStockFor, ownerResourceStockAll } from '../src/game/building-stock-cost';
export { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT, computeStartPlacements, foundCity, cityName, loadGameData, advanceCityEconomy };
`, 'utf8');
try {
  esbuild.buildSync({ entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE_FILE, loader: { '.json': 'json', '.ts': 'ts' }, logLevel: 'silent' });
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

// Surowe utrzymanie Pieniadza na poziomie 1 (pole utrzymanie, bez FALA2 i epoki).
const rawL1 = (b) => (Number.isFinite(b.utrzymanie) ? Math.floor(b.utrzymanie) : 0);

try {
  // -------------------------------------------------------------------------
  console.log('-- A. wyliczenie na danych rzeczywistych --');
  eq(M.readBuildingResourceUpkeepRatio(ECON, 'normal'), 1, 'A0: wspolczynnik z econ-params = 1 (1:1)');
  for (const d of ['easy', 'normal', 'hard']) {
    eq(ECON.budynki.utrzymanie_surowce_wspolczynnik[d], 1, `A0b: econ-params ${d} = 1`);
  }
  const get = (id) => BUILDINGS.find(b => b.id === id);
  for (const id of ['mury', 'kuznia', 'fort', 'wielka_odlewnia', 'palac_iii']) {
    const b = get(id);
    const want = {};
    for (const [k, v] of Object.entries(b.koszt_surowce || {})) if (v > 0) want[k] = rawL1(b);
    eq(M.buildingResourceUpkeep(b, 1), rawL1(b) > 0 ? want : {}, `A1: ${id} -> ${rawL1(b)} szt. kazdego surowca z kosztu`);
  }
  // Przyklad z dispatchu: Mury (utrzymanie 2) = 2 drewna + 2 kamienia + 2 cegly na ture.
  const mury = get('mury');
  eq(M.buildingResourceUpkeep(mury, 1), { drewno: 2, kamien: 2, cegla: 2 }, 'A2: Mury (utrzymanie 2) -> 2 drewna + 2 kamienia + 2 cegly');
  eq(M.buildingResourceUpkeep(get('stela'), 1), {}, 'A3: Stela (utrzymanie 0) -> brak utrzymania surowcowego');
  eq(M.buildingResourceUpkeep(get('palac'), 1), {}, 'A4: Palac (bez koszt_surowce) -> brak utrzymania surowcowego');
  // Poziomy: rosnie razem z Pieniadzem (przyrostUtrzymania per poziom), bez FALA2/epoki.
  const kuznia = get('kuznia');
  const kuz3 = Math.floor(kuznia.utrzymanie + (kuznia.przyrostUtrzymania || 0) * 2);
  eq(M.buildingResourceUpkeep(kuznia, 3).drewno, kuz3, `A5: Kuznia poziom 3 -> ${kuz3} (surowe utrzymanie + przyrost x2)`);
  // Calosc katalogu.
  let bad = 0;
  for (const b of BUILDINGS) {
    const raw = rawL1(b);
    // R-WEB-BUILDING-UPKEEP-CERAMICS-IMPL-Q1: stale `utrzymanie_surowce` (ceramika) jest poza regula koszt_surowce.
    const fixedK = Object.keys(b.utrzymanie_surowce || {});
    const r = Object.fromEntries(Object.entries(M.buildingResourceUpkeep(b, 1)).filter(([k]) => !fixedK.includes(k)));
    const types = Object.keys(b.koszt_surowce || {}).filter(k => b.koszt_surowce[k] > 0);
    if (raw <= 0 || types.length === 0) { if (Object.keys(r).length !== 0) bad++; continue; }
    if (Object.keys(r).length !== types.length || Object.values(r).some(v => v !== raw)) bad++;
  }
  eq(bad, 0, `A6: wszystkie ${BUILDINGS.length} budynkow zgodne z regula`);
  // Suma per surowiec z poziomami instancji.
  const inst = [{ record: mury, level: 1 }, { record: kuznia, level: 3 }, { record: mury, level: 1 }];
  const tot = M.totalBuildingResourceUpkeep(inst);
  eq(tot.drewno, 2 * 2 + kuz3, 'A7: suma drewna = 2xMury L1 + Kuznia L3');
  eq(tot.cegla, 2 * 2, 'A7b: cegla tylko z Murow');

  // -------------------------------------------------------------------------
  console.log('-- B. pobor i deficyt (ten sam mechanizm co jednostki) --');
  {
    const cities = [
      { id: 'c1', ownerId: 0, surowce: { drewno: 10, kamien: 1, cegla: 0 } },
      { id: 'c2', ownerId: 0, surowce: { drewno: 6 } },
      { id: 'c9', ownerId: 1, surowce: { drewno: 100 } },
    ];
    const upkeep = M.totalBuildingResourceUpkeep([{ record: mury, level: 1 }]);
    const pool = M.ownerResourceStockAll(cities, 0);
    const missing = M.missingStockFor(pool, upkeep);
    M.deductBuildingStockCostAcrossCities(cities, 0, upkeep);
    const after = M.ownerResourceStockAll(cities, 0);
    eq(after.drewno, Math.max(0, 16 - upkeep.drewno), 'B1: drewno pobrane z puli panstwa');
    eq(after.kamien ?? 0, 0, 'B2: kamien deficyt -> 0 (nie ujemny)');
    eq(after.cegla ?? 0, 0, 'B3: pusta pula cegly -> 0 (nie ujemna)');
    assert(missing.kamien > 0 && missing.cegla > 0, 'B4: brak kamienia i cegly wykryty (missingStockFor)');
    eq(M.ownerResourceStockAll(cities, 1).drewno, 100, 'B5: pula innego wlasciciela nietknieta');
  }

  // -------------------------------------------------------------------------
  console.log('-- C. gracz i AI ten sam kod (wiring) --');
  {
    const te = read('src/game/turn-economy.ts');
    assert(/for \(const oid of ownerIds\)/.test(te) && te.includes('totalBuildingResourceUpkeep(\n      buildingsByOwner.get(oid) ?? [],\n      buildingResRatioForOwner(oid),'),
      'C1: turn-economy liczy utrzymanie surowcowe budynkow dla KAZDEGO ownera (gracz i AI) tym samym wywolaniem, z wspolczynnikiem tego ownera');
    const mainSrc = read('src/main.ts');
    assert(mainSrc.includes('const aiResUpkeep = econ.resourceUpkeepByOwner.get(oid);')
      && mainSrc.includes('deductBuildingStockCostAcrossCities(cities, oid, aiResUpkeep);'),
      'C2: AI -- main.ts odejmuje resourceUpkeepByOwner (budynki + wojsko) z puli');
    assert(mainSrc.includes('const hResUpkeep = econ.resourceUpkeepByOwner.get(hOid);')
      && mainSrc.includes('deductBuildingStockCostAcrossCities(cities, hOid, hResUpkeep);'),
      'C3: gracz -- main.ts odejmuje resourceUpkeepByOwner tym samym mechanizmem');
    // C4 (statyczne), zaktualizowane w R-WEB-BUILDING-UPKEEP-CERAMICS-IMPL-Q1: ai-resource-needs dostaje
    // zapotrzebowanie utrzymania przez wejscie `upkeepDemand` (deficyt utrzymania widoczny dla planera AI).
    const needs = read('src/game/ai-resource-needs.ts');
    assert(/upkeepDemand/.test(needs),
      'C4 (statyczne): ai-resource-needs przyjmuje upkeepDemand (deficyt utrzymania ceramiki)');
  }

  // -------------------------------------------------------------------------
  console.log('-- D. okablowanie poziomu i wspolczynnika (wiring) --');
  {
    const te = read('src/game/turn-economy.ts');
    assert(!te.includes('configureBuildingResourceUpkeepRatio'), 'D1: brak stanu modulu -- wspolczynnik idzie argumentem');
    const mainSrc = read('src/main.ts');
    assert(mainSrc.includes('function buildingLevelForOwnerBuilding('), 'D2: main.ts ma helper poziomu wg epoki/techu wlasciciela (jak tick)');
    assert(mainSrc.includes('buildingResourceUpkeepForBuiltIds(builtIds, data.buildings, bdef => buildingLevelForOwnerBuilding(bdef, ownerId), readBuildingResourceUpkeepRatio(data.econParams, _menuDifficulty))'),
      'D3: podglad per miasto z poziomem i wspolczynnikiem');
    assert(mainSrc.includes('previewOwnerBuildingResourceUpkeep(ownerId, cities, data.buildings, cityBuilt, bdef => buildingLevelForOwnerBuilding(bdef, ownerId), readBuildingResourceUpkeepRatio(data.econParams, _menuDifficulty))'),
      'D4: fallback panelu surowcow z poziomem i wspolczynnikiem');
    assert(mainSrc.includes('bdef => buildingLevelForOwnerBuilding(bdef, 0),\n        readBuildingResourceUpkeepRatio(data.econParams, _menuDifficulty),'),
      'D5: HUD brutto/netto (previewOwnerTotalResourceUpkeep) z poziomem i wspolczynnikiem');
    const cp = read('src/ui/cityPanel.ts');
    assert(cp.includes('resources: buildingResourceUpkeep(def, level, buildingResourceUpkeepRatioForView()),'), 'D6: karta/lista budynkow w miescie -- poziom');
    assert(cp.includes('sumOwnedBuildingsResourceUpkeep(built, data, city)'), 'D7: suma w panelu miasta z poziomami budynkow miasta');
    const ad = read('src/ui/entityCards/buildingAdapter.ts');
    assert(ad.includes('buildingResourceUpkeep(building, upkeepLevel, readBuildingResourceUpkeepRatio('), 'D8: karta budynku -- poziom i wspolczynnik');
    assert(!/BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE/.test(read('src/game/economy-upkeep.ts').replace(/\/\*[\s\S]*?\*\//g, '')),
      'D9: stala 5 szt./typ usunieta z kodu');
    assert(ad.includes('stockResourceLabel(k)') && ad.includes("'pieniądz'") && ad.includes('plUpkeepForm'),
      'D10: karta uzywa polskich etykiet i odmian (bez surowych id)');
  }

  // -------------------------------------------------------------------------
  console.log('-- F. zachowanie: prawdziwy advanceCityEconomy --');
  {
    const map = M.generateMap(M.DEFAULT_WIDTH, M.DEFAULT_HEIGHT, 9191);
    const dataBase = M.loadGameData();
    const start = M.computeStartPlacements(map, dataBase);
    assert(Array.isArray(start.aiStarts) && start.aiStarts.length >= 2, 'F0: mapa ma co najmniej 2 starty AI');
    // Dwa swiezo zalozone miasta z Murami: owner 0 (gracz-like) i owner 1 (AI).
    const mkCities = () => {
      const c0 = M.foundCity({ id: 'bur_s0', ownerId: 0, typeId: 'Osadnik', category: 'osadnik', q: start.aiStarts[0].q, r: start.aiStarts[0].r, ruch: 2, ruchLeft: 2 }, [], map, M.cityName(1));
      const c1 = M.foundCity({ id: 'bur_s1', ownerId: 1, typeId: 'Osadnik', category: 'osadnik', q: start.aiStarts[1].q, r: start.aiStarts[1].r, ruch: 2, ruchLeft: 2 }, [], map, M.cityName(2));
      assert(c0 && c1, 'F0b: miasta zalozone');
      return [c0, c1];
    };
    const runTick = (data, resolveOwnerUpkeepDifficulty) => {
      const cities = mkCities();
      const builtByCity = new Map([[cities[0].id, ['mury']], [cities[1].id, ['mury']]]);
      // Kolejnosc argumentow advanceCityEconomy (27 pozycji; 27 = resolveOwnerUpkeepDifficulty).
      const args = [
        /* 1 */ cities, /* 2 */ map, /* 3 */ data, /* 4 */ 'normal', /* 5 */ [], /* 6 */ new Map(),
        /* 7 */ builtByCity, /* 8 */ 1, /* 9 */ new Set(), /* 10 */ new Map(), /* 11 */ new Map(),
        /* 12 */ undefined, /* 13 */ undefined, /* 14 */ 'wysoki', /* 15 */ undefined, /* 16 */ undefined,
        /* 17 */ undefined, /* 18 */ undefined, /* 19 */ undefined, /* 20 */ undefined, /* 21 */ undefined,
        /* 22 */ new Map(), /* 23 */ undefined, /* 24 */ new Map(), /* 25 */ new Map(), /* 26 */ new Map(),
        /* 27 */ resolveOwnerUpkeepDifficulty,
      ];
      const res = M.advanceCityEconomy(...args);
      return {
        p: res.resourceUpkeepBuildingsByOwner.get(0) || {},
        ai: res.resourceUpkeepBuildingsByOwner.get(1) || {},
      };
    };
    const withRatio = (normal, easy, hard) => {
      const d = JSON.parse(JSON.stringify(dataBase));
      d.econParams.budynki = { ...(d.econParams.budynki || {}), utrzymanie_surowce_wspolczynnik: { easy, normal, hard } };
      return d;
    };
    const r1 = runTick(dataBase, undefined);
    eq(r1.p.drewno, 2, 'F1: tick (wspolczynnik 1 z danych) -- gracz: Mury pobieraja 2 drewna');
    eq(r1.ai.drewno, 2, 'F1b: tick -- AI (owner 1): te same 2 drewna (ten sam kod)');
    const r2 = runTick(withRatio(2, 2, 2), undefined);
    eq(r2.p.drewno, 4, 'F2: wspolczynnik 2 w DANYCH musi podwoic pobor ticka (gracz)');
    eq(r2.p.cegla, 4, 'F2b: wspolczynnik 2 -- cegla tez podwojona');
    eq(r2.ai.drewno, 4, 'F2c: wspolczynnik 2 -- AI tez podwojony');
    // Per owner: owner 1 ma trudnosc 'hard' (wspolczynnik 3), owner 0 -- 'normal' (wspolczynnik 1).
    const r3 = runTick(withRatio(1, 0.5, 3), (oid) => (oid === 1 ? 'hard' : 'normal'));
    eq(r3.p.drewno, 2, 'F3: owner 0 (normal, wspolczynnik 1) -> 2 drewna');
    eq(r3.ai.drewno, 6, 'F3b: owner 1 (hard, wspolczynnik 3) -> 6 drewna (per owner, nie jeden wspolczynnik)');
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
