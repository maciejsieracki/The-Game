// Wektory P6.M03 dla zakresow earth-land-mask.ts (1-20, 27, 32, 37-50, 53-78, 97, 128-146):
// URUCHAMIA kod TS weba (pin edb8fb56). Funkcje prywatne eksportowane dopiskiem na koncu KOPII pliku
// w KORZENIU (tresc oryginalna bez zmian).
// Uzycie: node --experimental-transform-types --import ./gen-loader-register.mjs ./gen-m03-earth.mjs <KORZEN> <wyjscie.json>
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
const mapDir = `${root}/gra/src/map`;
const src = readFileSync(`${mapDir}/earth-land-mask.ts`, 'utf8');
writeFileSync(
  `${mapDir}/__m03_earth_slice.ts`,
  src + '\nexport { earthPlayableInnerHeight, earthPlayableInnerWidth, earthLandMapRows, bitAt, earthSubsampleGrid, earthLandFractionThreshold, EARTH_PLAYABLE_BORDER };\n',
);
const E = await import(pathToFileURL(`${mapDir}/__m03_earth_slice.ts`).href);
const T = (x) => (Object.is(x, -0) ? '-0' : String(x));

const res = {
  zrodlo: 'uruchomiony kod TS weba (gen-m03-earth.mjs), pin edb8fb56',
  node: process.version,
  sha256: { 'earth-land-mask.ts': createHash('sha256').update(src).digest('hex') },
  consts: {
    EARTH_PLAYABLE_BORDER: E.EARTH_PLAYABLE_BORDER,
    EARTH_POLAR_OCEAN_REF_ROWS: E.EARTH_POLAR_OCEAN_REF_ROWS,
    EARTH_POLAR_OCEAN_REF_INNER_H: E.EARTH_POLAR_OCEAN_REF_INNER_H,
  },
  heights: [],
  widths: [],
  dims: [],
  bits: [],
};
for (let h = -3; h <= 700; h++) {
  res.heights.push([
    h,
    E.earthPlayableInnerHeight(h),
    E.earthPolarOceanRows(h),
    E.earthNorthOceanRows(h),
    E.earthSouthOceanRows(h),
    E.earthLandMapRows(h),
  ]);
}
for (let w = -3; w <= 700; w++) res.widths.push([w, E.earthPlayableInnerWidth(w)]);
const sizes = [0, 1, 2, 3, 4, 5, 6, 10, 50, 83, 84, 85, 86, 90, 100, 112, 113, 114, 115, 116, 120, 160, 163, 164, 165, 166, 168, 220, 221, 222, 223, 224, 225, 250, 300, 320, 321, 322, 323, 324, 325, 330, 420, 421, 422, 423, 424, 425, 426, 500, 1000];
for (const w of sizes) for (const h of sizes) res.dims.push([w, h, E.earthSubsampleGrid(w, h), T(E.earthLandFractionThreshold(w, h))]);
for (let y = -3; y <= 402; y += 1) {
  for (const x of [-3, -1, 0, 1, 2, 3, 100, 359, 360, 718, 719, 720, 721, 725]) res.bits.push([x, y, E.bitAt(x, y)]);
}
// siatka rzadsza po calej masce
for (let y = 0; y < 400; y += 7) for (let x = 0; x < 720; x += 11) res.bits.push([x, y, E.bitAt(x, y)]);
writeFileSync(out, JSON.stringify(res));
console.log('OK', res.heights.length, res.dims.length, res.bits.length);
