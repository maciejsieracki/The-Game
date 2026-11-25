'use strict';
// R4: pojedyncze lądy na otwartym oceanie (stranded-land-test) — argumenty: w h typ seed.
const [w0, h0, typ0, seed0] = [process.argv[2] || '108', process.argv[3] || '74', process.argv[4] || 'wyspy', process.argv[5] || '42'];
const w = Number(w0);
const h = Number(h0);
const typ = typ0;
const seed = Number(seed0);
const M = require('./bundle.cjs')('r4', `
export { generateMap } from '../src/map/generator';
export { countOpenOceanLandSpecks } from '../src/map/gen-helpers';
export { TerenBazowy } from '../src/types/hex';
`);
const map = M.generateMap(w, h, seed, typ, {
  mapSizeMenuLabel: w >= 168 ? 'Standardowy' : 'Mały',
  worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
});
const specks = M.countOpenOceanLandSpecks(map.hexes);
const landN = Object.values(map.hexes).filter((x) => x.terenBazowy !== 'morze' && x.terenBazowy !== 'plytkie_morze').length;
console.log(JSON.stringify({ typ, seed, w, h, totalHexes: Object.keys(map.hexes).length, landHexes: landN, openOceanLandSpecks: specks }));
