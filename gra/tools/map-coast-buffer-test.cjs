'use strict';
/** MAPA — bufor wybrzeża: suchy ląd nie styka się wprost z Morzem. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.map-coast-entry.ts');
const BUNDLE = path.resolve(__dirname, '.map-coast-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { findDryLandTouchingSea, findInlandSeaHexes, findInlandWaterHexes, morseDepthFromMapBorder, maxOceanBayDepth, mapBorderWidth, MAP_BORDER_OCEAN_HEXES, MAP_MARGIN_LAND_ZONE_HEXES, marginLandCapForBorderDistance, findLandInMapBorder, hexBorderDistance } from '../src/map/gen-helpers';
export { generateMap, generujSwiat } from '../src/map/generator';
export {
  findLandCoastSandCandidates,
  computeRiverDeltaHexKeys,
  landCoastSandNeeded,
  LAND_COAST_SAND_FRAC,
} from '../src/render/mapRenderStyle';
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

const typs = ['kontynenty', 'pangea', 'wyspy', 'ziemia'];
for (const typ of typs) {
  for (const seed of [1, 7, 42, 99, 2026]) {
    const map = M.generateMap(54, 37, seed, typ);
    const bad = M.findDryLandTouchingSea(map.hexes);
    ok(bad.length === 0, `${typ} seed=${seed}: ląd przy morzu (${bad.slice(0, 3).join(', ')})`);
    const inland = M.findInlandSeaHexes(map.hexes, map.szerokoscQ, map.wysokoscR);
    ok(inland.length === 0, `${typ} seed=${seed}: morze w środku lądu (${inland.slice(0, 3).join(', ')})`);
    const inlandW = M.findInlandWaterHexes(map.hexes, map.szerokoscQ, map.wysokoscR);
    ok(inlandW.length === 0, `${typ} seed=${seed}: woda w środku lądu (${inlandW.slice(0, 3).join(', ')})`);
    const borderLand = M.findLandInMapBorder(map.hexes, map.szerokoscQ, map.wysokoscR);
    ok(borderLand.length === 0, `${typ} seed=${seed}: ląd w buforze brzegu (${borderLand.slice(0, 3).join(', ')})`);
    if (typ === 'pangea') {
      const depth = M.morseDepthFromMapBorder(map.hexes, map.szerokoscQ, map.wysokoscR);
      let enclosed = 0;
      for (const [k, h] of Object.entries(map.hexes)) {
        if (h.terenBazowy !== M.TerenBazowy.Morze) continue;
        if (depth.get(k) === undefined) enclosed++;
      }
      ok(enclosed === 0, `${typ} seed=${seed}: odcięte morse w lądzie (${enclosed} heksów)`);
    }
  }
}

ok(M.MAP_BORDER_OCEAN_HEXES === 2, 'MAP_BORDER_OCEAN_HEXES === 2 (twardy ocean d=0,1)');

function ringLandPct(map, d) {
  let land = 0, total = 0;
  const w = map.szerokoscQ, h = map.wysokoscR;
  for (let r = 0; r < h; r++) {
    for (let q = 0; q < w; q++) {
      if (M.hexBorderDistance(q, r, w, h) !== d) continue;
      total++;
      if (map.hexes[`${q},${r}`]?.terenBazowy !== M.TerenBazowy.Morze) land++;
    }
  }
  return total ? land / total : 0;
}

for (const d of [3, 4, 5]) {
  const map = M.generujSwiat(42, 'standardowy', 'pangea', { landFraction: 0.2, mapSizeMenuLabel: 'Standardowy' });
  const cap = M.marginLandCapForBorderDistance(d);
  const pct = ringLandPct(map, d);
  ok(pct <= cap + 0.04, `pangea pierścień d=${d}: ląd ${(pct*100).toFixed(1)}% ≤ cap ${(cap*100).toFixed(0)}%+4pp`);
}

for (const roz of ['malenki', 'maly', 'standardowy', 'superogromny']) {
  const map = M.generujSwiat(42, roz, 'kontynenty');
  const b = M.mapBorderWidth(map.szerokoscQ, map.wysokoscR);
  ok(b >= M.MAP_BORDER_OCEAN_HEXES, `generujSwiat ${roz}: bufor brzegu ${b} < min`);
  const borderLand = M.findLandInMapBorder(map.hexes, map.szerokoscQ, map.wysokoscR);
  ok(borderLand.length === 0, `generujSwiat ${roz}: ląd w buforze (${borderLand.length})`);
}

for (const roz of ['malenki', 'maly', 'standardowy']) {
  const map = M.generujSwiat(42, roz, 'kontynenty');
  const bad = M.findDryLandTouchingSea(map.hexes);
  ok(bad.length === 0, `generujSwiat ${roz}: bufor wybrzeża`);
}

// Hybryda C — kandydaci piasku na lądzie przy Wybrzeżu
for (const seed of [1, 7, 42, 99, 2026]) {
  const map = M.generateMap(54, 37, seed, 'kontynenty');
  const landBeach = M.findLandCoastSandCandidates(map);
  ok(landBeach.length > 0, `seed=${seed}: brak heksów lądu z pasem piasku (land beach cap)`);
  ok(M.LAND_COAST_SAND_FRAC >= 0.25 && M.LAND_COAST_SAND_FRAC <= 0.35,
    `LAND_COAST_SAND_FRAC poza 25–35% (${M.LAND_COAST_SAND_FRAC})`);
}

// Delta A — u ujść rzek fan Wybrzeże (gdy rzeki sięgają brzegu)
let deltaSamples = 0;
let deltaFound = 0;
for (const seed of [1, 7, 42, 99, 2026, 314, 777]) {
  const map = M.generateMap(54, 37, seed, 'kontynenty');
  const delta = M.computeRiverDeltaHexKeys(map);
  const paths = map.riverPaths ?? [];
  let coastal = false;
  for (const path of paths) {
    for (let i = Math.max(0, path.length - 4); i < path.length; i++) {
      const h = map.hexes[`${path[i].q},${path[i].r}`];
      if (!h) continue;
      if (h.terenBazowy === M.TerenBazowy.PlytkieMorze) coastal = true;
      for (const [dq, dr] of [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]]) {
        const nh = map.hexes[`${path[i].q + dq},${path[i].r + dr}`];
        if (nh?.terenBazowy === M.TerenBazowy.PlytkieMorze) coastal = true;
      }
    }
  }
  if (coastal) {
    deltaSamples++;
    if (delta.size >= 1) deltaFound++;
    ok(delta.size <= 3 * (map.riverPaths?.length ?? 0),
      `seed=${seed}: delta fan zbyt duży (${delta.size})`);
  }
}
ok(deltaSamples === 0 || deltaFound > 0,
  `brak delty u ujść mimo ${deltaSamples} map z rzeką przy brzegu`);

console.log(`map-coast-buffer-test: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
