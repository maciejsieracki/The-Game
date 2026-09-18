'use strict';

const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.building-epoch-cost-implementation-entry.ts');
const bundle = path.join(__dirname, '.building-epoch-cost-implementation-bundle.cjs');
const esbuild = require(process.env.ESBUILD_ROOT || path.join(GRA, 'node_modules', 'esbuild'));

fs.writeFileSync(entry, `
export { itemCost, buildingProductionItem } from '../src/game/production';
export { buildingEraCostMultiplier, buildingStockCost } from '../src/game/building-stock-cost';
export { buildingUpkeep } from '../src/game/economy-upkeep';
`, 'utf8');

let passed = 0;
let failed = 0;
function eq(actual, expected, label) {
  if (actual === expected) passed++;
  else {
    failed++;
    console.error(`FAIL: ${label}: got ${actual}, want ${expected}`);
  }
}

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
  eq(M.buildingEraCostMultiplier(1), 1, 'Stone era multiplier is x1');
  eq(M.buildingEraCostMultiplier(2), 2, 'Bronze era multiplier is x2');
  eq(M.buildingEraCostMultiplier(3), 4, 'Iron era multiplier is x4');
  eq(M.buildingEraCostMultiplier(4), 4, 'later eras keep the Iron+ x4 multiplier');
  eq(M.buildingEraCostMultiplier(undefined), 1, 'missing era safely defaults to Stone x1');
  eq(M.buildingEraCostMultiplier(0), 1, 'zero era safely defaults to Stone x1');
  const data = {
    buildings: [
      { id: 'stone', nazwa: 'Stone', epokaWejscia: 1, kosztBudowy: 7, przyrostKosztu: 3 },
      { id: 'bronze', nazwa: 'Bronze', epokaWejscia: 2, kosztBudowy: 7, przyrostKosztu: 3 },
      { id: 'iron', nazwa: 'Iron', epokaWejscia: 3, kosztBudowy: 7, przyrostKosztu: 3 },
    ],
    units: [],
  };

  eq(M.itemCost('budynek', 'stone', data, 3), 13, 'Stone L3 Work remains x1');
  eq(M.itemCost('budynek', 'bronze', data, 1), 14, 'Bronze L1 Work applies x2');
  eq(M.itemCost('budynek', 'iron', data, 3), 52, 'Iron L3 Work applies x4');

  const bronzeItem = M.buildingProductionItem('bronze', data, 1);
  const ironItem = M.buildingProductionItem('iron', data, 3);
  eq(bronzeItem?.koszt, 14, 'building queue consumer uses Bronze era Work cost');
  eq(ironItem?.koszt, 52, 'building queue consumer uses Iron era Work cost');

  const playerBronze = M.buildingProductionItem('bronze', data, 1, undefined, undefined, 0, 'normal');
  const aiBronze = M.buildingProductionItem('bronze', data, 1, undefined, undefined, 7, 'normal');
  eq(playerBronze?.koszt, aiBronze?.koszt, 'normal difficulty keeps player/AI Bronze Work parity');
  eq(JSON.parse(JSON.stringify([ironItem]))[0]?.koszt, 52, 'queued Work cost survives save/load serialization');

  eq(
    M.buildingStockCost({ epokaWejscia: 2, koszt_surowce: { drewno: 5, ruda: 0.5 } }).drewno,
    20,
    'Bronze stock applies FALA2 x2 then era x2',
  );
  eq(
    M.buildingStockCost({ epokaWejscia: 3, koszt_surowce: { drewno: 5, ruda: 0.5 } }).ruda,
    4,
    'Iron stock is integral after FALA2 x2 then era x4',
  );
  const missingEraStock = M.buildingStockCost({ koszt_surowce: { drewno: 5, ruda: 0 } });
  eq(missingEraStock.drewno, 10, 'missing era uses Stone x1 without dropping FALA2 stock scaling');
  eq(Object.keys(M.buildingStockCost({ epokaWejscia: 3, koszt_surowce: { drewno: 0, ruda: null } })).length, 0,
    'zero/null stock fields stay absent');

  const ironBuilding = { epokaWejscia: 3, utrzymanie: 3, przyrostUtrzymania: 2 };
  eq(M.buildingUpkeep(ironBuilding, 3), 56, 'Iron L3 money upkeep applies era x4 once');
  eq(M.buildingUpkeep({ epokaWejscia: 3, utrzymanie: 0, przyrostUtrzymania: 0 }, 3, 9), 0,
    'explicit zero upkeep remains zero at Iron+');
  eq(M.buildingUpkeep({ epokaWejscia: 3, przyrostUtrzymania: 0 }, 1, 1), 8,
    'missing upkeep field uses flat default then Iron+ x4');

  console.log(`building-epoch-cost-implementation-test: ${passed} passed, ${failed} failed`);
  process.exitCode = failed > 0 ? 1 : 0;
} finally {
  for (const file of [entry, bundle]) {
    try { fs.unlinkSync(file); } catch {}
  }
}
