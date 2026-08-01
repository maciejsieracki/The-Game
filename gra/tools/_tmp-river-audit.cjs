'use strict';
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const fs = require('fs');
const entry = path.resolve(__dirname, '_tmp-river-audit-entry.ts');
const bundle = path.resolve(__dirname, '_tmp-river-audit-bundle.cjs');
if (!fs.existsSync(entry)) {
  fs.writeFileSync(entry, `export { generateMap } from '../src/map/generator';
export { resolveRiverMapParams } from '../src/map/newGameMapDefaults';
export { groupLandMassKeys, buildSeaDistanceField, landHexesByCoverageCell, cellHasRiverSourceInCell, minLandHexesForRiverCell, hexKey, parseHexKey, HEX_DIRECTIONS } from '../src/map/gen-helpers';
export { TerenBazowy } from '../src/types/hex';
export { terrainSurfaceTopY, FLAT_LAND_SURFACE_Y, riverSurfaceLiftY } from '../src/render/mapRenderStyle';
export { HEX_R } from '../src/render/hexutil';`, 'utf8');
}
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
const M = require(bundle);
const { TerenBazowy } = M;

function isDryLand(t) {
  return t && t !== TerenBazowy.Morze && t !== TerenBazowy.Wybrzeze;
}

function maxDryPatch(massSet, hexes) {
  const visited = new Set();
  let maxSize = 0;
  for (const k of massSet) {
    if (visited.has(k)) continue;
    const h = hexes[k];
    if (!h || !isDryLand(h.terenBazowy)) continue;
    if (h.rzeka?.obecna) continue;
    const queue = [k];
    visited.add(k);
    let size = 0;
    while (queue.length) {
      const cur = queue.shift();
      size++;
      const { q, r } = M.parseHexKey(cur);
      for (const [dq, dr] of M.HEX_DIRECTIONS) {
        const nk = M.hexKey(q + dq, r + dr);
        if (!massSet.has(nk) || visited.has(nk)) continue;
        const nh = hexes[nk];
        if (!nh || !isDryLand(nh.terenBazowy)) continue;
        if (nh.rzeka?.obecna) continue;
        visited.add(nk);
        queue.push(nk);
      }
    }
    if (size > maxSize) maxSize = size;
  }
  return maxSize;
}

console.log('--- Wysokości flat vs rzeka (roblox) ---');
const flats = [TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Pustynia, TerenBazowy.Polarny];
for (const t of flats) {
  console.log(`${t}: topY=${M.terrainSurfaceTopY(t, 'roblox').toFixed(3)}`);
}
const riverY = M.terrainSurfaceTopY(TerenBazowy.Laka, 'roblox') + M.riverSurfaceLiftY(M.HEX_R);
console.log(`Rzeka (Laka+lift): ${riverY.toFixed(3)}`);
console.log(`Pustynia delta: ${(M.terrainSurfaceTopY(TerenBazowy.Pustynia, 'roblox') - M.terrainSurfaceTopY(TerenBazowy.Laka, 'roblox')).toFixed(3)}`);

console.log('\n--- Audyt gęstości (Standard kontynenty) ---');
for (const seed of [42, 7, 99, 1234]) {
  const map = M.generateMap(168, 120, seed, 'kontynenty', {
    mapSizeMenuLabel: 'Standardowy',
    worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
  });
  const kinds = map.riverPathKinds;
  let landTotal = 0, riverHex = 0;
  for (const h of Object.values(map.hexes)) {
    if (!isDryLand(h.terenBazowy)) continue;
    landTotal++;
    if (h.rzeka?.obecna) riverHex++;
  }
  const masses = M.groupLandMassKeys(map.hexes).filter((m) => m.length >= 80);
  let maxDry = 0;
  for (const mass of masses) maxDry = Math.max(maxDry, maxDryPatch(new Set(mass), map.hexes));
  console.log(`seed ${seed}: main=${kinds.filter(k=>k==='main').length} med=${kinds.filter(k=>k==='medium').length} short=${kinds.filter(k=>k==='short').length} riverHex=${(100*riverHex/landTotal).toFixed(1)}% maxDry=${maxDry}`);
}
