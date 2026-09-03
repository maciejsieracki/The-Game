'use strict';
/** MAPA — szablon Ziemi (decyzja A): ląd tylko w masce mockupu Macieja. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.earth-template-entry.ts');
const BUNDLE = path.resolve(__dirname, '.earth-template-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generujSwiat } from '../src/map/generator';
export { countLandSeaHexes, findInlandWaterHexes, repairRiverPathAdjacency } from '../src/map/gen-helpers';
export { earthTemplateLandAt, earthNorthOceanRows, earthSouthOceanRows } from '../src/map/earth-land-mask';
export { generateMap } from '../src/map/generator';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

function landPct(map) {
  const { land, total } = M.countLandSeaHexes(map.hexes);
  return land / total;
}

const genOpts = {
  worldDensity: { resources: 'medium', rivers: 'medium', desert: 'medium', forest: 'medium', relief: 'medium' },
  mapSizeMenuLabel: 'Standardowy',
};

const map = M.generujSwiat(777, 'standardowy', 'ziemia', genOpts);
const pct = landPct(map);
ok(pct >= 0.12 && pct <= 0.32, `ziemia ląd ${(pct * 100).toFixed(1)}% w oczekiwanym paśmie 12–32%`);

let outsideLand = 0;
for (const key of Object.keys(map.hexes)) {
  const [qs, rs] = key.split(',');
  const q = parseInt(qs, 10);
  const r = parseInt(rs, 10);
  const hex = map.hexes[key];
  if (hex.terenBazowy === 'morze') continue;
  if (M.earthTemplateLandAt(q, r, map.szerokoscQ, map.wysokoscR) <= 0) outsideLand++;
}
ok(outsideLand === 0, `ziemia: 0 heksów lądu poza szablonem (found ${outsideLand})`);

const W = map.szerokoscQ;
const H = map.wysokoscR;
const north = M.earthNorthOceanRows(H);
const b = 2;
let northLand = 0;
for (let r = b; r < b + north; r++) {
  for (let q = b; q < W - b; q++) {
    if (M.earthTemplateLandAt(q, r, W, H) > 0) northLand++;
  }
}
ok(northLand === 0, `ziemia: 0 lądu w buforze arktycznym (${north} rzędów, found ${northLand})`);
ok(north >= 28 && north <= 32, `ziemia standard: bufor arktyczny ≈30 rzędów (got ${north})`);

const south = M.earthSouthOceanRows(H);
let southLand = 0;
for (let r = H - b - south; r < H - b; r++) {
  for (let q = b; q < W - b; q++) {
    if (M.earthTemplateLandAt(q, r, W, H) > 0) southLand++;
  }
}
ok(southLand === 0, `ziemia: 0 lądu w buforze południowym (${south} rzędów, found ${southLand})`);
ok(south >= 28 && south <= 32, `ziemia standard: bufor południowy ≈30 rzędów (got ${south})`);

let antLand = 0;
const landRows = H - 2 * b - north - south;
const antRow = b + north + landRows - 3;
for (let q = Math.floor(W * 0.35); q < Math.floor(W * 0.65); q++) {
  if (M.earthTemplateLandAt(q, antRow, W, H) > 0) antLand++;
}
ok(antLand > 0, `ziemia: Antarktyda w szablonie nad buforem południowym (found ${antLand} heksów przy r=${antRow})`);

const big = M.generujSwiat(4242, 'duzy', 'ziemia', genOpts);
let morseInMask = 0;
for (const key of Object.keys(big.hexes)) {
  const [q, r] = key.split(',').map(Number);
  if (M.earthTemplateLandAt(q, r, big.szerokoscQ, big.wysokoscR) <= 0) continue;
  const tb = big.hexes[key].terenBazowy;
  if (tb === 'morze' || tb === 'plytkie_morze') morseInMask++;
}
ok(morseInMask === 0, `ziemia duzy: 0 morza/wybrzeza w masce lądu (found ${morseInMask})`);
const inland = M.findInlandWaterHexes(big.hexes, big.szerokoscQ, big.wysokoscR);
const inlandInLandMask = inland.filter((k) => {
  const [q, r] = k.split(',').map(Number);
  return M.earthTemplateLandAt(q, r, big.szerokoscQ, big.wysokoscR) > 0;
});
ok(inlandInLandMask.length === 0, `ziemia duzy: 0 wody w masce lądu (found ${inlandInLandMask.length})`);

// Rzeki: każdy krok trasy = sąsiedni hex (krawędzie renderu)
const rmap = M.generateMap(168, 120, 777, 'kontynenty', genOpts);
for (const path of rmap.riverPaths ?? []) {
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const dq = a.q - b.q; const dr = a.r - b.r;
    const dist = (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
    ok(dist === 1, `river step adjacent (${a.q},${a.r})→(${b.q},${b.r}) dist=${dist}`);
    if (fail > 0) break;
  }
  if (fail > 0) break;
}

console.log(`earth-template-test: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
