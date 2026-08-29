'use strict';
/* EVALUATOR (niezalezny pomiar) — R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1
 * Pytanie: czy po rozdzieleniu bramek POBOR utrzymania nadal dziala przez WIELE TUR
 * i czy konsekwencja niedoboru sie odpala. Mierzone INACZEJ niz Operator:
 * petla N tur, slad zapisany jako JSON — porownywalny 1:1 miedzy BAZA a GALEZIA.
 * Uruchamiac z katalogu gra/.
 */
const fs = require('fs'), path = require('path');
const GRA = process.cwd();
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const ENTRY = path.join(GRA, 'tools', '.ev-drain-entry.ts');
const BUNDLE = path.join(GRA, 'tools', '.ev-drain-bundle.cjs');
fs.writeFileSync(ENTRY, `
export * as EU from '../src/game/economy-upkeep';
export { unitStockCost, missingStockFor, ownerResourceStockAll, deductBuildingStockCostAcrossCities } from '../src/game/building-stock-cost';
export { advanceCityEconomy } from '../src/game/turn-economy';
`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent' });
const M = require(BUNDLE), EU = M.EU;
const DATA = {
  civs: require(path.join(GRA,'data/civs.json')), econParams: require(path.join(GRA,'data/econ-params.json')),
  societyParams: require(path.join(GRA,'data/society-params.json')), buildings: require(path.join(GRA,'data/buildings.json')),
  units: require(path.join(GRA,'data/units.json')), tech: require(path.join(GRA,'data/tech.json')),
};
const WOJ = DATA.units.find(u => u.Jednostka === 'Wojownik');
const trace = { unitsJson: { stock: M.unitStockCost(WOJ), upkeep: EU.unitResourceUpkeep(WOJ) }, owners: {} };

// bramka: 57 -> ? ; 49 -> ?  (nazwa symbolu rozna miedzy baza a galezia -> bierz co jest)
const gate = EU.canAffordUnitRecruitStock || EU.canAffordUnitRecruitFull;
trace.gate57 = gate({ drewno: 57 }, WOJ);
trace.gate49 = gate({ drewno: 49 }, WOJ);
trace.gate50 = gate({ drewno: 50 }, WOJ);
trace.hint57 = EU.pickUnitRecruitHint({ drewno: 57 }, WOJ);

// PETLA WIELU TUR — osobno dla gracza (0), AI (3) i "MP" (7). Identyczny setup.
for (const ownerId of [0, 3, 7]) {
  const city = { id: 'm1', ownerId, q: 0, r: 0, name: 'Testowo', population: 1, magazynZywnosci: 10, surowce: { drewno: 57 } };
  const cities = [city];
  const rec = { recruitAllowed: gate(M.ownerResourceStockAll(cities, ownerId), WOJ), turns: [] };
  // rekrutacja: pobor jednorazowego kosztu
  M.deductBuildingStockCostAcrossCities(cities, ownerId, M.unitStockCost(WOJ));
  rec.poolAfterRecruit = M.ownerResourceStockAll(cities, ownerId).drewno ?? 0;
  const econUnits = [{ ownerId, typeId: 'Wojownik', camping: false }];
  for (let t = 1; t <= 5; t++) {
    const before = M.ownerResourceStockAll(cities, ownerId).drewno ?? 0;
    const econ = M.advanceCityEconomy(cities, { hexes: {} }, DATA, 'normal', econUnits, new Map(), new Map());
    const resUpkeep = econ.resourceUpkeepByOwner.get(ownerId) ?? {};
    const unitsUpkeep = econ.resourceUpkeepUnitsByOwner.get(ownerId) ?? {};
    const poolBefore = M.ownerResourceStockAll(cities, ownerId);
    const missing = M.missingStockFor(poolBefore, resUpkeep);
    M.deductBuildingStockCostAcrossCities(cities, ownerId, resUpkeep);
    const after = M.ownerResourceStockAll(cities, ownerId).drewno ?? 0;
    rec.turns.push({ t, before, naliczoneJednostki: unitsUpkeep, naliczoneRazem: resUpkeep, niedobor: missing, after });
  }
  trace.owners[ownerId] = rec;
}
// kontrola przeciwna: ten sam przebieg BEZ jednostki
{
  const cities = [{ id: 'm1', ownerId: 0, q: 0, r: 0, name: 'Testowo', population: 1, magazynZywnosci: 10, surowce: { drewno: 7 } }];
  const econ = M.advanceCityEconomy(cities, { hexes: {} }, DATA, 'normal', [], new Map(), new Map());
  trace.kontrolaBezJednostki = econ.resourceUpkeepUnitsByOwner.get(0) ?? {};
}
console.log(JSON.stringify(trace, null, 1));
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (e) {}
