'use strict';
/** Szybki pomiar globalnej górzystości lądu (tier medium). */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.measure-relief-pct-entry.ts');
const BUNDLE = path.resolve(__dirname, '.measure-relief-pct-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generateMap } from '../src/map/generator';
export { TerenBazowy } from '../src/types/hex';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const { generateMap, TerenBazowy } = require(BUNDLE);
const seeds = [42, 7, 99, 123, 555];
let sum = 0;

for (const seed of seeds) {
  const map = generateMap(168, 120, seed, 'kontynenty', {
    mapSizeMenuLabel: 'Standardowy',
    worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
  });
  let land = 0;
  let g = 0;
  let w = 0;
  for (const hex of Object.values(map.hexes)) {
    if (hex.terenBazowy === 'morze' || hex.terenBazowy === 'wybrzeze') continue;
    land++;
    if (hex.terenBazowy === TerenBazowy.Gory) g++;
    if (hex.terenBazowy === TerenBazowy.Wzgorza) w++;
  }
  const pct = ((g + w) / land) * 100;
  sum += pct;
  console.log(
    `seed ${seed}: relief ${pct.toFixed(2)}% (Góry ${((g / land) * 100).toFixed(2)}%, Wzgórza ${((w / land) * 100).toFixed(2)}%)`,
  );
}
console.log(`avg relief: ${(sum / seeds.length).toFixed(2)}%`);
