'use strict';
/**
 * node tools/capital-seadist-measure.cjs — R-WEB-CAPITAL-SEADIST-Q1 (obrona r2): odtwarzalny pomiar
 * uzasadniajacy warunek "brak wolnego slotu srodladowego" w cluster-start-test (Standard, seed 4242, 8 typow).
 * Wypisuje: liczba hexow ladu, hexow o seaDist >= minSea, sepGate (jak runtime), maks. pakunek zachlanny
 * (N prob, deterministyczny RNG) dla kilku sep — to DOLNA granica maks. liczby stolic srodladowych
 * (heurystyka, nie dowod gornej granicy), oraz seaDist stolic z planu.
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.capital-seadist-measure-entry.ts');
const bundle = path.join(__dirname, '.capital-seadist-measure-bundle.cjs');
fs.writeFileSync(entry, `
export { buildClusterStartPlan } from '../src/game/cluster-start';
export { generateMap } from '../src/map/generator';
export { capitalMinSeaDist, capitalMinSeparationForMap, seaDistAt } from '../src/map/clusters';
export { buildSeaDistanceField, hexDistanceAxial } from '../src/map/gen-helpers';
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: GRA, logLevel: 'silent' });
const M = require(bundle);
const civs = require('../data/civs.json');
const TRIALS = Number(process.env.TRIALS || 300);

const seed = Number(process.env.SEED || 4242);
const map = M.generateMap(168, 120, seed, 'kontynenty');
const plan = M.buildClusterStartPlan({ map, civs, seed, playerCivId: 'grecy', rywaleNaKlaster: 6, aktywneTypy: 8, startEpochId: 'kamien' });
const sea = M.buildSeaDistanceField(map.hexes);
const minSea = M.capitalMinSeaDist(plan.placement.rozmiarMapy);
const hexes = Object.values(map.hexes);
const land = hexes.filter(h => M.seaDistAt(sea, h.coords.q, h.coords.r) > 0);
const landSep = hexes.filter(h => h.terenBazowy !== 'morze' && h.terenBazowy !== 'gory' && h.terenBazowy !== 'plytkie_morze').length;
const inland = land.filter(h => M.seaDistAt(sea, h.coords.q, h.coords.r) >= minSea).map(h => h.coords);
const sepGate = M.capitalMinSeparationForMap(plan.placement.rozmiarMapy, 168, 120, 8, landSep);
console.log(`seed=${seed} land(seaDist>0)=${land.length} landSep(runtime)=${landSep} inland(seaDist>=${minSea})=${inland.length} sepGate=${sepGate}`);

let st = 123456789;
const rnd = () => { st ^= st << 13; st >>>= 0; st ^= st >>> 17; st ^= st << 5; st >>>= 0; return st / 4294967296; };
function greedyMax(sep) {
  let best = 0;
  for (let t = 0; t < TRIALS; t++) {
    const pool = inland.slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const picked = [];
    for (const p of pool) if (picked.every(o => M.hexDistanceAxial(p.q, p.r, o.q, o.r) >= sep)) picked.push(p);
    if (picked.length > best) best = picked.length;
  }
  return best;
}
for (const sep of [15, 20, sepGate - 1, sepGate, 25]) console.log(`sep=${sep}: max pakunek zachlanny (${TRIALS} prob) = ${greedyMax(sep)} (potrzeba 8 = gracz + 7 obcych)`);
const caps = [plan.playerStartHex, ...plan.foreignTypeClusters.map(c => c.positions[0])].filter(Boolean);
console.log('seaDist stolic: ' + caps.map(c => M.seaDistAt(sea, c.q, c.r)).join(','));
console.log('stolic z seaDist < ' + minSea + ': ' + caps.filter(c => M.seaDistAt(sea, c.q, c.r) < minSea).length + '/' + caps.length);
