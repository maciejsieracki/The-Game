'use strict';
// R1: heksy lądu poza maską szablonu Ziemi (seed 777, standardowy, ziemia) — odtworzenie.
const M = require('./bundle.cjs')('r1', `
export { generujSwiat } from '../src/map/generator';
export { earthTemplateLandAt, earthNorthOceanRows, earthSouthOceanRows } from '../src/map/earth-land-mask';
export { TerenBazowy } from '../src/types/hex';`);
const genOpts = {
  worldDensity: { resources: 'medium', rivers: 'medium', desert: 'medium', forest: 'medium', relief: 'medium' },
  mapSizeMenuLabel: 'Standardowy',
};
const SEED = Number(process.argv[2] || 777);
const map = M.generujSwiat(SEED, 'standardowy', 'ziemia', genOpts);
console.log('seed', SEED);
const W = map.szerokoscQ;
const H = map.wysokoscR;
const off = [];
for (const key of Object.keys(map.hexes)) {
  const [q, r] = key.split(',').map(Number);
  const hex = map.hexes[key];
  if (hex.terenBazowy === 'morze' || hex.terenBazowy === 'plytkie_morze') continue;
  if (M.earthTemplateLandAt(q, r, W, H) <= 0) off.push({ q, r, t: hex.terenBazowy });
}
const byTerrain = {};
for (const o of off) byTerrain[o.t] = (byTerrain[o.t] || 0) + 1;
const totalHexes = Object.keys(map.hexes).length;
console.log(JSON.stringify({
  W, H, north: M.earthNorthOceanRows(H), south: M.earthSouthOceanRows(H),
  totalHexes, offMaskLand: off.length, byTerrain,
}));
console.log('sample:', JSON.stringify(off.slice(0, 12)));
// Czy heks poza maską ma sąsiada w masce (efekt brzegu) czy jest w głębi poza maską?
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
let withMaskNeighbor = 0;
for (const o of off) {
  let n = 0;
  for (const [dq, dr] of DIRS) if (M.earthTemplateLandAt(o.q + dq, o.r + dr, W, H) > 0) n++;
  if (n > 0) withMaskNeighbor++;
}
console.log('offMask hexes with >=1 in-mask neighbour (brzeg):', withMaskNeighbor, 'of', off.length);
console.log('offMask r min/max:', Math.min(...off.map(o => o.r)), Math.max(...off.map(o => o.r)),
  'q min/max:', Math.min(...off.map(o => o.q)), Math.max(...off.map(o => o.q)));
