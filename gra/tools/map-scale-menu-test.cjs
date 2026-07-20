'use strict';
/** Regresja menu skali kreatora (Maciej 2026-07-04: mp max 9, typy osobno). */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.map-scale-menu-entry.ts');
const bundle = path.join(__dirname, '.map-scale-menu-bundle.cjs');

fs.writeFileSync(
  entry,
  `export {
  MAX_MIAST_PANSTWA,
  MAX_TYPY_CYWILIZACJI_MENU,
  miastaPanstwaMenuForMapLabel,
  civTypesMenuForMapLabel,
  defaultMiastaPanstwaFromMapLabel,
  defaultCivTypesFromMapLabel,
} from '../src/map/newGameMapDefaults';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

const EXPECT = {
  Malenki: { mp: [6, 8, 10], typy: [6, 8, 10] },
  Mały: { mp: [8, 10, 12], typy: [8, 10, 12] },
  Standardowy: { mp: [10, 12, 14], typy: [10, 12, 14] },
  Duży: { mp: [12, 14, 16], typy: [12, 14, 15] },
  Ogromny: { mp: [14, 16, 18], typy: [13, 15, 15] },
  'Super Huge': { mp: [14, 16, 18], typy: [13, 15, 15] },
};

console.log('map-scale-menu-test (Panel-E + menu kreatora)\n');

assert(M.MAX_MIAST_PANSTWA === 18, 'MAX_MIAST_PANSTWA=18');
assert(M.MAX_TYPY_CYWILIZACJI_MENU === 15, 'MAX_TYPY_CYWILIZACJI_MENU=15');

for (const [label, exp] of Object.entries(EXPECT)) {
  const mp = M.miastaPanstwaMenuForMapLabel(label);
  assert(
    mp.opts.join(',') === exp.mp.join(','),
    `${label} mp menu ${mp.opts.join('·')} (exp ${exp.mp.join('·')})`,
  );
  assert(
    M.defaultMiastaPanstwaFromMapLabel(label) === exp.mp[1],
    `${label} domyślne mp=${exp.mp[1]}`,
  );

  const typy = M.civTypesMenuForMapLabel(label);
  assert(
    typy.opts.join(',') === exp.typy.join(','),
    `${label} typy menu ${typy.opts.join('·')} (exp ${exp.typy.join('·')})`,
  );
  assert(
    M.defaultCivTypesFromMapLabel(label) === exp.typy[1],
    `${label} domyślne typy=${exp.typy[1]}`,
  );

  const maxMp = parseInt(mp.opts[mp.opts.length - 1], 10);
  assert(maxMp <= M.MAX_MIAST_PANSTWA, `${label} mp max ${maxMp} ≤ ${M.MAX_MIAST_PANSTWA}`);
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
