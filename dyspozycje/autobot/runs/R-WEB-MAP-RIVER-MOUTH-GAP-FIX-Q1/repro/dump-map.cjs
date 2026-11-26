'use strict';
// Zrzut mapy (hexes: terenBazowy + rzeka, riverPaths, kinds) do JSON dla analizy offline.
// Uzycie: node dump-map.cjs <typ> <seed> <out.json>
const typ = process.argv[2] || 'kontynenty';
const seed = Number(process.argv[3] || 42);
const outPath = process.argv[4];
const w = 168, h = 120;
const M = require('./bundle.cjs')('dump', `
export { generateMap } from '../src/map/generator';
`);
const map = M.generateMap(w, h, seed, typ, {
  mapSizeMenuLabel: 'Standardowy', landFraction: typ === 'pangea' ? 0.35 : 0.3,
  worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
});
const hexes = {};
for (const [k, v] of Object.entries(map.hexes)) hexes[k] = [v.terenBazowy, v.rzeka && v.rzeka.obecna ? 1 : 0];
require('fs').writeFileSync(outPath, JSON.stringify({
  w, h, hexes, paths: map.riverPaths, kinds: map.riverPathKinds,
}));
console.log('ok', Object.keys(hexes).length, map.riverPaths.length);
