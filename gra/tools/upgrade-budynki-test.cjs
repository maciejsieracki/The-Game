'use strict';
/**
 * upgrade-budynki-test.cjs — regresja UPGRADE budynków (2026-07-05)
 * node tools/upgrade-budynki-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.upgrade-budynki-entry.ts');
const BUNDLE = path.resolve(__dirname, '.upgrade-budynki-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  availableProduction, applyCompletedBuildingIds, isBuildingSupersededByUpgrade,
} from '../src/game/production';
export {
  upgradeProductionDisplayName, isBuildingSuppressedFromProduction,
  upgradeChainSteps, cityHasBibliotekaLine, cityHasAmfiteatrLine, cityHasMurLine,
} from '../src/game/building-upgrades';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(BUNDLE);
const techData = JSON.parse(fs.readFileSync(path.join(GRA, 'data/tech.json'), 'utf8')).technologie;
const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
const terrain = JSON.parse(fs.readFileSync(path.join(GRA, 'data/terrain-improvements.json'), 'utf8'));

const city = { id: 'c1', name: 'X', ownerId: 0, population: 5, q: 0, r: 0 };
const prodData = { buildings, units: [] };

let pass = 0, fail = 0;
function ok(c, m) {
  if (c) { pass++; console.log('  PASS:', m); }
  else { fail++; console.error('  FAIL:', m); }
}

// ABC-21: Teatr ukryty
{
  const teatr = buildings.find(b => b.id === 'teatr');
  ok(M.isBuildingSuppressedFromProduction(teatr), 'Teatr suppressed from production');
  const items = M.availableProduction(city, prodData, ['Filozofia'], {
    epoch: 3, builtBuildingIds: ['biblioteka'],
  });
  ok(!items.some(i => i.id === 'teatr'), 'Teatr not in production list');
}

// ABC-20: Port → Port wielki
{
  const pw = buildings.find(b => b.id === 'port_wielki');
  ok(pw && pw.upgradeFrom === 'port', 'port_wielki upgradeFrom port');
  const label = M.upgradeProductionDisplayName(pw, buildings);
  ok(label.includes('Rozbuduj') && label.includes('Port'), 'Rozbuduj label port');
  const items = M.availableProduction(city, prodData, ['Inżynieria'], {
    epoch: 3, builtBuildingIds: ['port'],
  });
  ok(items.some(i => i.id === 'port_wielki'), 'port_wielki available with port built');
  ok(!items.some(i => i.id === 'port'), 'port hidden when not superseded but built — still in built');
}

// ABC-22: Mury → Cytadela (fort)
{
  const fort = buildings.find(b => b.id === 'fort');
  ok(fort.upgradeFrom === 'mury', 'fort upgradeFrom mury');
  ok(fort.baza.obrona === 15, 'fort merged obrona 15');
  const items = M.availableProduction(city, prodData, ['Inżynieria'], {
    epoch: 3, builtBuildingIds: ['mury'],
  });
  ok(items.some(i => i.id === 'fort'), 'fort upgrade when mury built');
  ok(!items.some(i => i.id === 'fort' && !items.find(x => x.id === 'fort')), 'fort only via mury');
  const noMury = M.availableProduction(city, prodData, ['Inżynieria'], {
    epoch: 3, builtBuildingIds: [],
  });
  ok(!noMury.some(i => i.id === 'fort'), 'fort blocked without mury');
  const after = M.applyCompletedBuildingIds(['mury'], 'fort', buildings);
  ok(after.includes('fort') && !after.includes('mury'), 'fort replaces mury in builtIds');
  ok(M.cityHasMurLine(after), 'cityHasMurLine after fort');
}

// ABC-21 merge: Biblioteka → Akademia
{
  const ak = buildings.find(b => b.id === 'akademia');
  ok(ak.upgradeFrom === 'biblioteka', 'akademia upgradeFrom biblioteka');
  ok(ak.baza.nauka === 9 && ak.baza.kultura === 7, 'akademia merged stats');
  const after = M.applyCompletedBuildingIds(['biblioteka'], 'akademia', buildings);
  ok(after.includes('akademia') && !after.includes('biblioteka'), 'akademia replaces biblioteka');
  ok(M.cityHasBibliotekaLine(after), 'cityHasBibliotekaLine with akademia');
  ok(M.cityHasAmfiteatrLine(after), 'cityHasAmfiteatrLine with akademia (merge teatr)');
}

// Koszary → Akademia wojskowa
{
  const aw = buildings.find(b => b.id === 'akademia_wojskowa');
  ok(aw.upgradeFrom === 'koszary', 'akademia_wojskowa upgradeFrom koszary');
  const items = M.availableProduction(city, prodData, ['Sztuka wojenna'], {
    epoch: 3, builtBuildingIds: ['koszary'],
  });
  ok(items.some(i => i.id === 'akademia_wojskowa'), 'AW available after koszary');
}

// Kuźnia → Wielka kuźnia
{
  const wk = buildings.find(b => b.id === 'wielka_kuznia');
  ok(wk.upgradeFrom === 'kuznia_zelaza', 'wielka_kuznia upgradeFrom kuznia_zelaza');
}

// ABC-23: Drogi brukowane prereq
{
  const drogi = techData.find(t => t.Technologia === 'Drogi brukowane');
  ok(drogi['Wymaga (prereq)'] === 'Inżynieria + Budownictwo', 'Drogi brukowane prereq ABC-23');
}

// ABC-24: droga brukowana tylko +2 ruch
{
  const bruk = terrain.droga_brukowana;
  ok(bruk.bonus_ruch === 2, 'bonus_ruch 2');
  ok(!bruk.bonus || Object.keys(bruk.bonus).length === 0, 'no handel bonus on bruk');
}

// upgrade chain depth (UPG-LOC max 3 — sanity)
{
  for (const id of ['swiatynia', 'akademia', 'fort', 'port_wielki']) {
    const chain = M.upgradeChainSteps(id, buildings);
    ok(chain.length >= 2 && chain.length <= 3, `chain ${id} length ${chain.length} in 2..3`);
  }
}

console.log(`\nupgrade-budynki-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
