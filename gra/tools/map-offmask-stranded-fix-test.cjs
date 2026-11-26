'use strict';
/**
 * R-WEB-MAP-OFFMASK-STRANDED-FIX-Q1 (MAPFIX, P3+P4):
 *  - P3: typ Ziemia — po generowaniu 0 heksów lądu poza maską szablonu (seed 777 i 42);
 *  - P4: po generowaniu 0 samotnych suchych heksów lądu bez sąsiada-lądu na otwartym
 *    oceanie (wyspy 108×74 seed 42 — dawniej 1 heks).
 * Mutacja czerwona: usunięcie bloku „Przebieg 3e-final" z generator.ts → test czerwony.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.map-offmask-stranded-fix-entry.ts');
const BUNDLE = path.resolve(__dirname, '.map-offmask-stranded-fix-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generateMap, generujSwiat } from '../src/map/generator';
export { countOpenOceanLandSpecks } from '../src/map/gen-helpers';
export { earthTemplateLandAt } from '../src/map/earth-land-mask';
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

const M = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) {
    pass++;
    console.log('PASS:', msg);
  } else {
    fail++;
    console.error('FAIL:', msg);
  }
}

const DENSITY = {
  rivers: 'medium',
  forest: 'medium',
  desert: 'medium',
  relief: 'medium',
  resources: 'medium',
};

function offMaskLandCount(map, W, H) {
  let n = 0;
  for (const [key, hex] of Object.entries(map.hexes)) {
    const t = hex.terenBazowy;
    if (t === 'morze' || t === 'plytkie_morze') continue;
    const [q, r] = key.split(',').map(Number);
    if (M.earthTemplateLandAt(q, r, W, H) <= 0) n++;
  }
  return n;
}

// P3 — Ziemia, mapa standardowa 168×120.
for (const seed of [777, 42]) {
  const map = M.generujSwiat(seed, 'standardowy', 'ziemia', {
    worldDensity: DENSITY,
    mapSizeMenuLabel: 'Standardowy',
  });
  const n = offMaskLandCount(map, map.szerokoscQ, map.wysokoscR);
  ok(n === 0, `Ziemia 168×120 seed=${seed}: 0 heksów lądu poza maską (found ${n})`);
  // Regresja (zarzut Evaluatora 1): cofnięcie lądu nie może zamienić płytkiego morza
  // na głębokie — na Ziemi płytkie morze (wybrzeże) musi istnieć.
  let shallow = 0;
  for (const hex of Object.values(map.hexes)) if (hex.terenBazowy === 'plytkie_morze') shallow++;
  ok(shallow > 0, `Ziemia 168×120 seed=${seed}: płytkie morze zachowane (found ${shallow})`);
}

// P4 — wyspy 108×74 seed 42: brak samotnego lądu na otwartym oceanie.
{
  const map = M.generateMap(108, 74, 42, 'wyspy', {
    worldDensity: DENSITY,
    mapSizeMenuLabel: 'Mały',
  });
  const specks = M.countOpenOceanLandSpecks(map.hexes);
  ok(specks === 0, `Wyspy 108×74 seed=42: 0 samotnych lądów na oceanie (found ${specks})`);
}

console.log(`\nmap-offmask-stranded-fix-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
