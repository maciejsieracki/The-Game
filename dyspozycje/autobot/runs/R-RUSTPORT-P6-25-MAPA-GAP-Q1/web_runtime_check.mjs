// Uruchamia PRAWDZIWE moduly weba (gra/src/map @ edb8fb56, wypakowane git archive do katalogu poza repo) pod Node 22
// (--experimental-transform-types + loader hooks z rozszerzeniami .ts i JSON). Zero zmian w gra/**.
// Uzycie: node --experimental-transform-types --import <register.mjs> web_runtime_check.mjs <WEB_ROOT>
// Zadania: (1) liczba eksportow runtime per modul, (2) wektory landMask dla typow swiata vs stale testu Rust
// map_generator.rs:1458 (canonical_mask_vectors_match_typescript).
import { readdirSync } from 'node:fs';
const root = process.argv[2];
const base = root + '/gra/src/map/';
const out = {};
for (const f of readdirSync(base).filter((n) => n.endsWith('.ts')).sort()) {
  try {
    const m = await import(base + f);
    out[f] = Object.keys(m).length;
  } catch (e) {
    out[f] = 'IMPORT-ERR: ' + String(e.message).split('\n')[0].slice(0, 120);
  }
}
console.log('RUNTIME_EXPORTS ' + JSON.stringify(out));

const gh = await import(base + 'gen-helpers.ts');
const nm = await import(base + 'newGameMapDefaults.ts');
const W = 36, H = 28, seed = 42;
const pts = [[18, 14], [9, 8], [27, 20]];
for (const typ of ['kontynenty', 'pangea', 'wyspy']) {
  const rand = gh.mulberry32(seed);
  const perm = gh.buildPermTable(rand);
  const shape = gh.defaultShapeParams(rand);
  const sizeNorm = Math.max(W, H) / 36;
  shape.noiseScale /= sizeNorm;
  const lf = nm.resolveLandFraction(undefined, typ);
  const radiusBoost = Math.max(0, (lf - 0.5) * 0.28);
  const sparse = lf <= 0.35;
  let centers;
  if (typ === 'kontynenty') centers = gh.buildFiveZoneContinentCenters(rand, W, H, (sparse ? 0.11 : 0.13) + radiusBoost, (sparse ? 0.19 : 0.23) + radiusBoost);
  else if (typ === 'wyspy') centers = gh.buildSixteenGridIslandCenters(rand, W, H);
  else centers = gh.buildPangeaBlobCenters(rand, W, H, lf);
  const vals = pts.map(([q, r]) => {
    if (typ === 'pangea') return gh.landMaskPangea(q, r, W, H, centers, perm, shape.noiseScale, lf);
    if (typ === 'wyspy') return gh.landMaskWyspy(q, r, W, H, centers, perm, shape.noiseScale);
    return gh.landMaskKontynenty(q, r, W, H, centers, perm, shape.noiseScale);
  });
  console.log('WEB landMask', typ, 'landFraction=' + lf, 'centers=' + centers.length, JSON.stringify(vals));
}
console.log('RUST expected kontynenty [1.0,0.5537604801383436,0.4956324549950586]');
console.log('RUST expected pangea     [0.9789176456785471,0.2049166935764926,0.1281437628375818]');
console.log('RUST expected wyspy      [0.014317990285265408,0.004516155530222999,0.0037681991835320453]');
{
  const rand = gh.mulberry32(seed);
  const perm = gh.buildPermTable(rand);
  const shape = gh.defaultShapeParams(rand);
  const ez = [[0, 0], [18, 14], [24, 14], [10, 10], [30, 20], [18, 4], [18, 23]].map(([q, r]) => gh.landMaskZiemia(q, r, W, H, perm, shape.noiseScale));
  console.log('WEB landMaskZiemia', JSON.stringify(ez));
{
  // classifyTerrain: 6 przypadkow z testu Rust map_generator.rs:1370 (progi domyslne = thresholds undefined)
  const cases = [
    [0.10, 0.10, 0.80, 0.20, 0.20, 'temperate_north', 0.0],
    [0.10, 0.30, 0.80, 0.20, 0.20, 'temperate_north', 0.0],
    [0.25, 0.40, 0.80, 0.20, 0.20, 'temperate_north', 0.0],
    [0.20, 0.40, 0.61, 0.20, 0.20, 'temperate_north', 0.0],
    [0.30, 0.40, 0.20, 0.20, 0.70, 'desert', 0.0],
    [0.40, 0.40, 0.20, 0.20, 0.20, 'temperate_north', 1.0],
  ];
  const got = cases.map(([e, lm, mn, fo, de, band, cb]) => gh.classifyTerrain(e, lm, mn, fo, de, undefined, band, cb).terenBazowy);
  console.log('WEB classifyTerrain', JSON.stringify(got));
  console.log('RUST expected (Sea,Grassland,Mountains,Hills,Desert,Plains) = morze,laka,gory,wzgorza,pustynia,rownina');
}
  console.log('RUST expected ziemia [0,0.9316724043325739,0,0.9199536103293708,0,0,0]');
}
