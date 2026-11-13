'use strict';
/**
 * node tools/city-name-start-overlap-test.cjs
 * R-WEB-CITY-NAME-UNIQUE-FOREVER-Q1 r2 — start gry: stolica gracza zuzywa nazwe globalnie
 * (pule Sumer/Babilonia/Asyria/Fenicja/Egipt sie nakladaja). Prawdziwy buildClusterStartPlan / buildClusterSpawnPlan.
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const os = require('os');

const GRA = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cnso-'));
const entry = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(entry, `
export { buildClusterStartPlan } from ${JSON.stringify(path.join(GRA, 'src/game/cluster-start'))};
export { buildClusterSpawnPlan } from ${JSON.stringify(path.join(GRA, 'src/map/cluster-spawn'))};
export { generateMap } from ${JSON.stringify(path.join(GRA, 'src/map/generator'))};
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: GRA, logLevel: 'silent' });
const M = require(bundle);
const civs = require('../data/civs.json');
const realPools = require('../data/city-names-pools.json');

const MAPSZ = +(process.env.MAPSZ||50), RIV = +(process.env.RIV||4);
let fails = 0, checked = 0;
function ok(c, m) { if (!c) { fails++; console.log('FAIL', m); } }
function dups(names) {
  const seen = new Set(); const d = [];
  for (const n of names) { if (seen.has(n)) d.push(n); seen.add(n); }
  return d;
}

for (const playerCivId of ['sumer', 'babilonia', 'asyria', 'fenicjanie', 'egipt']) {
  if (!realPools[playerCivId]) { console.log('brak puli', playerCivId); fails++; continue; }
  // Deterministyczne wymuszenie nakladania: nazwa stolicy gracza jest 2. nazwa w puli kazdej obcej cywilizacji
  // (realne nakladania 7./20./43. indeksu wymagalyby ogromnych map). Bez poprawki obce 2. miasto = stolica gracza.
  const pools = JSON.parse(JSON.stringify(realPools));
  const capName = pools[playerCivId].miasta_cywilizacji[0];
  for (const k of Object.keys(pools)) {
    const l = pools[k] && pools[k].miasta_cywilizacji;
    if (k === playerCivId || !Array.isArray(l)) continue;
    pools[k].miasta_cywilizacji = [l[0], capName, ...l.slice(1).filter(n => n !== capName)];
  }
  for (const seed of [11, 202, 4242]) {
    const map = M.generateMap(MAPSZ, MAPSZ, seed, 'kontynenty');
    const common = { map, civs, seed, rywaleNaKlaster: RIV, aktywneTypy: 12, cityNamesPools: pools };
    const spawn = M.buildClusterSpawnPlan({ ...common, playerTyp: playerCivId });
    const start = M.buildClusterStartPlan({ ...common, playerCivId });
    const label = `${playerCivId}/seed ${seed}`;
    const dSpawn = dups([spawn.playerStartCityName, ...spawn.slots.map(s => s.nazwaMiasta)]);
    ok(dSpawn.length === 0, `${label}: buildClusterSpawnPlan duplikaty ${dSpawn.join(',')}`);
    const dStart = dups([start.playerStartCityName, ...start.spawnCities.map(c => c.name)]);
    ok(dStart.length === 0, `${label}: buildClusterStartPlan duplikaty ${dStart.join(',')}`);
    checked++;
    console.log(`${label}: obcych miast ${start.spawnCities.length}, dup spawn=${dSpawn.length} start=${dStart.length}`);
  }
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(fails ? `FAIL (${fails}) przebiegow ${checked}` : `PASS przebiegow ${checked}`);
process.exit(fails ? 1 : 0);
