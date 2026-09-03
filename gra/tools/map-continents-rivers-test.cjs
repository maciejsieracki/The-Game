'use strict';
/** MAPA — kontynenty (wiele mas) + rzeki na płaskim terenie. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.map-continents-entry.ts');
const BUNDLE = path.resolve(__dirname, '.map-continents-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generujSwiat, generateMap } from '../src/map/generator';
export { continentCenterCount, buildSixteenGridIslandCenters, ISLAND_GRID_DIVISIONS } from '../src/map/gen-helpers';
export {
  resolveWorldGenNumbers,
  DEFAULT_WORLD_DENSITY,
} from '../src/map/newGameMapDefaults';
export { TerenBazowy } from '../src/types/hex';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

function countLandMasses(map) {
  const visited = new Set();
  let masses = 0;
  const HEX = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
  const isLand = (tb) =>
    tb !== M.TerenBazowy.Morze && tb !== M.TerenBazowy.PlytkieMorze;

  for (const key of Object.keys(map.hexes)) {
    if (visited.has(key)) continue;
    const h = map.hexes[key];
    if (!h || !isLand(h.terenBazowy)) continue;

    masses++;
    const stack = [key];
    visited.add(key);
    while (stack.length) {
      const cur = stack.pop();
      const [q, r] = cur.split(',').map(Number);
      for (const [dq, dr] of HEX) {
        const nk = `${q + dq},${r + dr}`;
        if (visited.has(nk)) continue;
        const nh = map.hexes[nk];
        if (!nh || !isLand(nh.terenBazowy)) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
  }
  return masses;
}

function countRiverHexes(map) {
  let n = 0;
  for (const h of Object.values(map.hexes)) {
    if (h.rzeka?.obecna) n++;
  }
  return n;
}

function countSea(map) {
  let n = 0;
  for (const h of Object.values(map.hexes)) {
    if (h.terenBazowy === M.TerenBazowy.Morze) n++;
  }
  return n;
}

// Kontynenty: 5 stref (środek + 4 narożniki)
ok(M.continentCenterCount(84, 60, 'kontynenty') === 5, 'kontynenty: dokładnie 5 stref');

const genHighRivers = {
    worldDensity: { resources: 'medium', rivers: 'high', desert: 'medium', forest: 'medium', relief: 'high' },
  mapSizeMenuLabel: 'Standardowy',
};

// Wiele mas lądowych (nie jedna pangea)
let multiMassOk = 0;
for (const seed of [1, 7, 42, 99, 2026, 7777]) {
  const map = M.generujSwiat(seed, 'standardowy', 'kontynenty', genHighRivers);
  const masses = countLandMasses(map);
  const sea = countSea(map);
  if (masses >= 3 && sea > 200) multiMassOk++;
}
ok(multiMassOk >= 4, `kontynenty standard: >=3 mas lądu + morze (ok=${multiMassOk}/6)`);

// Rzeki przy „dużo” — także na mapie bez gór (wymuszone pangea płaska)
const flatOpts = {
  worldDensity: { resources: 'low', rivers: 'high', desert: 'low', forest: 'low', relief: 'high' },
  mapSizeMenuLabel: 'Mały',
};
let riverOk = 0;
for (const seed of [1, 42, 99, 555, 2026]) {
  const map = M.generujSwiat(seed, 'maly', 'kontynenty', flatOpts);
  const paths = map.riverPaths?.length ?? 0;
  const hexes = countRiverHexes(map);
  if (paths >= 1 && hexes >= 4) riverOk++;
}
ok(riverOk >= 4, `rzeki high tier: >=1 trasa (ok=${riverOk}/5)`);

// Pangea ≠ kontynenty (pangea: zwykle 1 duża masa)
const pangea = M.generujSwiat(42, 'standardowy', 'pangea', genHighRivers);
const kont = M.generujSwiat(42, 'standardowy', 'kontynenty', genHighRivers);
ok(countLandMasses(pangea) < countLandMasses(kont), 'kontynenty ma więcej mas niż pangea (seed 42)');

// Wyspy: siatka 4×4 → wiele oddzielnych mas (nie jeden kontynent)
ok(M.ISLAND_GRID_DIVISIONS === 4, 'wyspy: siatka 4×4');
ok(M.buildSixteenGridIslandCenters(() => 0.5, 168, 120).length === 16, 'wyspy: 16 centrów');
let wyspyGridOk = 0;
for (const seed of [1, 42, 99, 777]) {
  const map = M.generujSwiat(seed, 'standardowy', 'wyspy', genHighRivers);
  const masses = countLandMasses(map);
  if (masses >= 10 && masses <= 18) wyspyGridOk++;
}
ok(wyspyGridOk >= 3, `wyspy 4x4: ~16 mas lądu (ok=${wyspyGridOk}/4)`);
const wyspy42 = M.generujSwiat(42, 'standardowy', 'wyspy', genHighRivers);
ok(countLandMasses(wyspy42) > countLandMasses(kont), 'wyspy: więcej mas niż kontynenty (seed 42)');

console.log(`map-continents-rivers-test: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
