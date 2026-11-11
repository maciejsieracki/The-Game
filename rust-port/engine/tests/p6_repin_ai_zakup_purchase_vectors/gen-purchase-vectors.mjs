// Generator wektorow zakupu AI na realnym magazynie: uruchamia PRAWDZIWY kod weba
//   unitStockCost (building-stock-cost.ts) + canAffordUnitRecruitStock / missingStockFor (economy-upkeep.ts)
// na WSZYSTKICH jednostkach gra/data/units.json (origin/main, git archive poza repo).
// Uzycie (Node 22, z tego katalogu):
//   P6_WEB_ROOT=<web> node --experimental-transform-types --no-warnings --import ./register.mjs ./gen-purchase-vectors.mjs ./purchase-vectors.json
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const WEB = process.env.P6_WEB_ROOT;
const OUT = process.argv[2];
const bsc = await import(pathToFileURL(join(WEB, 'gra/src/game/building-stock-cost.ts')).href);
const eu = await import(pathToFileURL(join(WEB, 'gra/src/game/economy-upkeep.ts')).href);
const units = JSON.parse(readFileSync(join(WEB, 'gra/data/units.json'), 'utf8'));
const list = Array.isArray(units) ? units : units.units ?? units.jednostki;

const cases = [];
for (const def of list) {
  const cost = bsc.unitStockCost(def);
  const keys = Object.keys(cost);
  const pools = [];
  const add = (label, pool) => {
    pools.push({
      label,
      pool,
      canAfford: eu.canAffordUnitRecruitStock(pool, def),
      missing: bsc.missingStockFor(pool, cost),
    });
  };
  add('empty', {});
  add('exact', { ...cost });
  add('plus5', Object.fromEntries(keys.map((k) => [k, cost[k] + 5])));
  add('unrelated', { diament: 999 });
  for (const k of keys) add(`minus1:${k}`, { ...cost, [k]: cost[k] - 1 });
  for (const k of keys) add(`zero:${k}`, { ...cost, [k]: 0 });
  cases.push({ unit: def.Jednostka, stockCost: cost, pools });
}
writeFileSync(OUT, JSON.stringify({ source: 'origin/main gra/src/game/{building-stock-cost,economy-upkeep}.ts', cases }, null, 1));
console.log('cases', cases.length, 'pools', cases.reduce((a, c) => a + c.pools.length, 0));
