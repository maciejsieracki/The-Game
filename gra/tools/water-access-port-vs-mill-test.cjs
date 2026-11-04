'use strict';
/**
 * water-access-port-vs-mill-test.cjs — R-WEB-WATER-ACCESS-PORT-VS-MILL-Q1 (decyzja właściciela 2026-11-04:
 * „porty: morze i rzeka; młyn: tylko rzeka”). Run z gra/:  node tools/water-access-port-vs-mill-test.cjs
 * Mutacje: WATERPM_SRC_DIR=<kopia gra/src> node tools/water-access-port-vs-mill-test.cjs
 *
 * (A) Port = isCoastalCity || cityHasWaterAccess (formuła main.ts cityHasCoastOrRiverAccess): morze TAK, rzeka TAK, sucho NIE.
 * (B) „Tylko rzeka” (cityHasWaterAccess): morze NIE, rzeka TAK, ujście rzeki TAK (przez rzekę).
 * (C) production.ts: Port wymaga ctx.cityHasCoastOrRiver; 'mlyn' nie jest w WATER_ACCESS_BUILDING_IDS.
 * (D) pin tekstowy main.ts: cityHasCoastOrRiverAccess = isCoastalCity(...) || cityHasWaterAccess(...).
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.WATERPM_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'waterpm-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, [
  `export { isCoastalCity } from ${JSON.stringify(SRC + '/game/barbarians')};`,
  `export { cityHasWaterAccess } from ${JSON.stringify(SRC + '/game/turn-economy')};`,
  `export { availableProduction } from ${JSON.stringify(SRC + '/game/production')};`,
  `export { WATER_ACCESS_BUILDING_IDS } from ${JSON.stringify(SRC + '/game/building-resource-gate')};`,
].join('\n') + '\n');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
  loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { isCoastalCity, cityHasWaterAccess, availableProduction, WATER_ACCESS_BUILDING_IDS } = require(bundle);
let failed = 0;
const ok = (c, m) => { if (c) console.log('  [OK] ' + m); else { failed++; console.error('  [FAIL] ' + m); } };
const K = (q, r) => `${q},${r}`;
function makeMap({ river = [] } = {}) {
  const hexes = {};
  for (let q = 0; q < 20; q++) for (let r = 0; r < 20; r++) {
    const edge = q === 0 || r === 0 || q === 19 || r === 19;
    hexes[K(q, r)] = { coords: { q, r }, terenBazowy: edge ? 'morze' : 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] } };
  }
  for (const [q, r] of river) hexes[K(q, r)].rzeka = { obecna: true, krawedzie: [] };
  return { szerokoscQ: 20, wysokoscR: 20, hexes, seed: 1, riverPaths: river.length ? [river.map(([q, r]) => ({ q, r }))] : [] };
}
const portAccess = (c, m) => isCoastalCity(m, c) || cityHasWaterAccess(c, m);

const map = makeMap({ river: [[10, 10], [10, 11]] });
const SEA = { q: 1, r: 5 }, RIVER = { q: 10, r: 10 }, RIVER_NB = { q: 11, r: 10 }, DRY = { q: 6, r: 14 };
console.log('(A) Port: morze LUB rzeka');
ok(portAccess(SEA, map), 'miasto nad morzem -> Port TAK');
ok(portAccess(RIVER, map), 'miasto na rzece -> Port TAK');
ok(portAccess(RIVER_NB, map), 'miasto obok rzeki -> Port TAK');
ok(!portAccess(DRY, map), 'miasto suche -> Port NIE');
console.log('(B) Tylko rzeka (młyn / słodka woda)');
ok(!cityHasWaterAccess(SEA, map), 'morze samo NIE daje „tylko rzeka”');
ok(cityHasWaterAccess(RIVER, map) && cityHasWaterAccess(RIVER_NB, map), 'rzeka na heksie i sąsiedzie TAK');
ok(!cityHasWaterAccess(DRY, map), 'sucho NIE');
const mouth = makeMap({ river: [[1, 4], [1, 5]] });
ok(cityHasWaterAccess({ q: 1, r: 5 }, mouth), 'ujście rzeki do morza -> TAK wyłącznie przez rzekę');
ok(!cityHasWaterAccess({ q: 1, r: 9 }, mouth) && isCoastalCity(mouth, { q: 1, r: 9 }), 'wybrzeże bez rzeki: Port TAK, „tylko rzeka” NIE');
console.log('(C) production.ts');
ok(WATER_ACCESS_BUILDING_IDS.has('port') && WATER_ACCESS_BUILDING_IDS.has('port_wielki'), 'Port i Port wielki w bramce wodnej');
ok(!WATER_ACCESS_BUILDING_IDS.has('mlyn'), 'mlyn NIE ma bramki wodnej (brak definicji budynku w buildings.json)');
const bData = require('../data/buildings.json');
const city = { id: 'c1', q: 5, r: 5, ownerId: 0, name: 'T', population: 5, kulturaSkumulowana: 0 };
const mk = (w) => ({ epoch: 3, builtBuildingIds: [], civBonusy: [], empireResourceStock: { drewno: 999, kamien: 999 }, cityHasCoastOrRiver: w });
const ids = (w) => availableProduction(city, { buildings: bData, units: [] }, ['Żegluga'], mk(w)).map(i => i.id);
ok(ids(true).includes('port'), 'Port dostępny przy dostępie do wody');
ok(!ids(false).includes('port'), 'Port niedostępny bez dostępu do wody');
console.log('(D) pin main.ts');
const mainTxt = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
ok(/return isCoastalCity\(map, city\) \|\| cityHasWaterAccess\(city, map\);/.test(mainTxt), 'cityHasCoastOrRiverAccess = isCoastalCity || cityHasWaterAccess');
try { fs.rmSync(temp, { recursive: true, force: true }); } catch (_) { /* */ }
console.log(failed === 0 ? 'ALL PASS' : `FAILED=${failed}`);
process.exit(failed === 0 ? 0 : 1);
