'use strict';
/**
 * fc-probe.cjs — Final Control R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1 (2026-08-26)
 * Niezalezny pomiar FC, pisany od zera (nie kopia testu Operatora ani Ewaluatora).
 * Uruchomienie:  node fc-probe.cjs <sciezka-do-gra>
 * Wypisuje JEDEN obiekt JSON — porownywalny bajt w bajt miedzy baza a galezia.
 *
 * Mierzy:
 *  (1) werdykt bramki rekrutacji przez SCIEZKE PRODUKCYJNA (symbol wolany w main.ts)
 *      dla pul 49/50/57/60 i trzech ownerow (0=gracz, 4=AI, 31=MP);
 *  (2) 6 kolejnych TUR prawdziwego advanceCityEconomy po rekrutacji przy 57 Drewna,
 *      z poborem dokladnie jak main.ts:26107-26120 (missingStockFor -> deduct).
 */
const fs = require('fs');
const path = require('path');
const GRA = path.resolve(process.argv[2]);
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const ENTRY = path.join(GRA, 'tools', '.fc-probe-entry.ts');
const BUNDLE = path.join(GRA, 'tools', '.fc-probe-bundle.cjs');
fs.writeFileSync(ENTRY, `
export * as EU from '../src/game/economy-upkeep';
export { unitStockCost, ownerResourceStockAll, missingStockFor,
  deductBuildingStockCostAcrossCities } from '../src/game/building-stock-cost';
export { advanceCityEconomy } from '../src/game/turn-economy';
`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE,
  absWorkingDir: GRA, logLevel: 'silent' });
const M = require(BUNDLE), EU = M.EU;
const D = n => require(path.join(GRA, 'data', n));
const units = D('units.json');
const DATA = { civs: D('civs.json'), econParams: D('econ-params.json'),
  societyParams: D('society-params.json'), buildings: D('buildings.json'), units, tech: D('tech.json') };
const W = units.find(u => u.Jednostka === 'Wojownik');

// Bramka wolana z main.ts to `canAffordUnitRecruitFull` (na galezi: alias).
const GATE = EU.canAffordUnitRecruitFull;
const out = { jednostka: { koszt: M.unitStockCost(W), utrzymanie: EU.unitResourceUpkeep(W) },
  bramkaArnosc: GATE.length, bramka: {}, tury: {} };

for (const oid of [0, 4, 31]) {
  const row = {};
  for (const pula of [49, 50, 57, 60]) {
    const cities = [{ id: 'a', ownerId: oid, surowce: { drewno: pula } },
                    { id: 'obce', ownerId: 77, surowce: { drewno: 9999 } }];
    const pool = M.ownerResourceStockAll(cities, oid);
    row[pula] = { gate: GATE(pool, W), hint: EU.pickUnitRecruitHint(pool, W),
                  chipCzerwony: EU.isUnitRecruitStockChipMissing(pool, W, 'drewno') };
  }
  out.bramka['owner' + oid] = row;
}

for (const oid of [0, 4, 31]) {
  // rekrutacja przy 57 Drewna: pobor jednorazowego kosztu
  const cities = [{ id: 'm', ownerId: oid, q: 0, r: 0, name: 'T',
    population: 1, magazynZywnosci: 10, surowce: { drewno: 57 } }];
  const dozwolona = GATE(M.ownerResourceStockAll(cities, oid), W);
  M.deductBuildingStockCostAcrossCities(cities, oid, M.unitStockCost(W));
  const slad = [{ krok: 'po rekrutacji', dozwolona, pula: M.ownerResourceStockAll(cities, oid).drewno ?? 0 }];
  const econUnits = [{ ownerId: oid, typeId: 'Wojownik', camping: false }];
  for (let t = 1; t <= 6; t++) {
    const econ = M.advanceCityEconomy(cities, { hexes: {} }, DATA, 'normal', econUnits, new Map(), new Map());
    const nalUnits = econ.resourceUpkeepUnitsByOwner.get(oid) ?? {};
    const nalRazem = econ.resourceUpkeepByOwner.get(oid) ?? {};
    const przed = M.ownerResourceStockAll(cities, oid);
    const brak = M.missingStockFor(przed, nalRazem);
    M.deductBuildingStockCostAcrossCities(cities, oid, nalRazem);
    slad.push({ tura: t, naliczoneJednostki: nalUnits, naliczoneRazem: nalRazem,
      pulaPrzed: przed.drewno ?? 0, niedobor: brak, pulaPo: M.ownerResourceStockAll(cities, oid).drewno ?? 0 });
  }
  out.tury['owner' + oid] = slad;
}
// kontrola przeciwna: ten sam tick BEZ jednostki
{
  const cities = [{ id: 'm', ownerId: 0, q: 0, r: 0, name: 'T', population: 1, magazynZywnosci: 10, surowce: { drewno: 7 } }];
  const econ = M.advanceCityEconomy(cities, { hexes: {} }, DATA, 'normal', [], new Map(), new Map());
  out.kontrolaBezJednostki = econ.resourceUpkeepUnitsByOwner.get(0) ?? {};
}
console.log(JSON.stringify(out, null, 2));
try { fs.unlinkSync(ENTRY); } catch (e) {}
try { fs.unlinkSync(BUNDLE); } catch (e) {}
