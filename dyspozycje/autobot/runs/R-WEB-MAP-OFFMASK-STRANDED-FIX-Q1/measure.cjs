'use strict';
// Pomiar PRZED/PO (R-WEB-MAP-OFFMASK-STRANDED-FIX-Q1): udział lądu, liczba mas lądu,
// heksy rzek, heksy poza maską Ziemi, samotne lądy na oceanie, czas generowania.
// Użycie: node measure.cjs <typ> <w> <h> <seed>   (typ 'ziemia' → generujSwiat, reszta → generateMap)
// GRA_DIR (opcjonalnie) wskazuje gra/ z innym kodem generatora (pomiar bazy).
const REPRO = require('path').resolve(__dirname, '..', 'R-WEB-MAP-GEN-BUG-REPRO-Q1', 'repro');
const M = require(REPRO + '/bundle.cjs')('measure', `
export { generateMap, generujSwiat } from '../src/map/generator';
export { countOpenOceanLandSpecks } from '../src/map/gen-helpers';
export { earthTemplateLandAt } from '../src/map/earth-land-mask';
export { TerenBazowy } from '../src/types/hex';`);
const [typ, w0, h0, seed0] = process.argv.slice(2);
const w = Number(w0), h = Number(h0), seed = Number(seed0);
const opts = {
  worldDensity: { resources: 'medium', rivers: 'medium', desert: 'medium', forest: 'medium', relief: 'medium' },
  mapSizeMenuLabel: w >= 168 ? 'Standardowy' : 'Mały',
};
const t0 = Date.now();
const map = typ === 'ziemia' ? M.generujSwiat(seed, 'standardowy', 'ziemia', opts) : M.generateMap(w, h, seed, typ, opts);
const ms = Date.now() - t0;
const W = map.szerokoscQ ?? w, H = map.wysokoscR ?? h;
const hexes = map.hexes;
const keys = Object.keys(hexes);
const isWater = (t) => t === 'morze' || t === 'plytkie_morze';
let land = 0, rivers = 0, offMask = 0;
const landSet = new Set();
for (const k of keys) {
  const hx = hexes[k];
  const [q, r] = k.split(',').map(Number);
  if (!isWater(hx.terenBazowy)) { land++; landSet.add(k); }
  if (hx.rzeka && hx.rzeka.obecna) rivers++;
  if (typ === 'ziemia' && !isWater(hx.terenBazowy) && M.earthTemplateLandAt(q, r, W, H) <= 0) offMask++;
}
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
let masses = 0;
const seen = new Set();
for (const k of landSet) {
  if (seen.has(k)) continue;
  masses++;
  const stack = [k];
  seen.add(k);
  while (stack.length) {
    const c = stack.pop();
    const [q, r] = c.split(',').map(Number);
    for (const [dq, dr] of DIRS) {
      const nk = `${q + dq},${r + dr}`;
      if (landSet.has(nk) && !seen.has(nk)) { seen.add(nk); stack.push(nk); }
    }
  }
}
const specks = M.countOpenOceanLandSpecks(hexes);
let specksInMask = 0, morzeInMask = 0;
for (const k of keys) {
  const hx = hexes[k];
  const [q, r] = k.split(',').map(Number);
  const inMask = typ === 'ziemia' && M.earthTemplateLandAt(q, r, W, H) > 0;
  if (inMask && (hx.terenBazowy === 'morze' || hx.terenBazowy === 'plytkie_morze')) morzeInMask++;
  if (!inMask || isWater(hx.terenBazowy)) continue;
  let dry = 0;
  for (const [dq, dr] of DIRS) { const nh = hexes[`${q + dq},${r + dr}`]; if (nh && !isWater(nh.terenBazowy)) dry++; }
  if (dry === 0) specksInMask++;
}
console.log(JSON.stringify({ typ, w, h, seed, totalHexes: keys.length, landHexes: land, landFrac: +(land / keys.length).toFixed(5),
  masses, riverHexes: rivers, offMaskLand: offMask, openOceanLandSpecks: specks, specksInMask, morzeInMask, ms }));
