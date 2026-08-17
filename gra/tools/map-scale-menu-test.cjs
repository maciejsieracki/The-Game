'use strict';
/** Regresja menu skali kreatora (Maciej 2026-07-04: mp max 9; CIV-MAP-EPOCH-Q1: typy mapa×epoka). */

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
  EPOCH_CIV_TYPE_POOL,
  miastaPanstwaMenuForMapLabel,
  civTypesMenuForMapLabel,
  civTypesTripleForMapLabel,
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

const MP_EXPECT = {
  Malenki: [2, 3, 4],
  Mały: [3, 4, 5],
  Standardowy: [4, 6, 7],
  Duży: [5, 7, 8],
  Ogromny: [6, 8, 9],
  'Super Huge': [7, 8, 9],
};

/** CIV-MAP-EPOCH-Q1 = A — macierz mapa × epoka */
const TYPY_EXPECT = {
  Malenki: {
    kamien: [2, 3, 5],
    braz: [3, 4, 6],
    zelazo: [3, 4, 6],
  },
  Mały: {
    kamien: [3, 4, 6],
    braz: [4, 5, 7],
    zelazo: [4, 5, 7],
  },
  Standardowy: {
    kamien: [4, 5, 7],
    braz: [5, 6, 8],
    zelazo: [5, 6, 8],
  },
  Duży: {
    kamien: [5, 6, 8],
    braz: [8, 9, 11],
    zelazo: [9, 10, 12],
  },
  Ogromny: {
    kamien: [6, 7, 9],
    braz: [10, 11, 13],
    zelazo: [11, 12, 14],
  },
  'Super Huge': {
    kamien: [6, 7, 8],
    braz: [12, 13, 15],
    zelazo: [13, 14, 16],
  },
};

const EPOCH_POOL = { kamien: 8, braz: 14, zelazo: 15 };

console.log('map-scale-menu-test (Panel-E + menu kreatora + CIV-MAP-EPOCH-Q1)\n');

assert(M.MAX_MIAST_PANSTWA === 9, 'MAX_MIAST_PANSTWA=9');
assert(M.MAX_TYPY_CYWILIZACJI_MENU === 15, 'MAX_TYPY_CYWILIZACJI_MENU=15');
assert(M.EPOCH_CIV_TYPE_POOL.kamien === 8, 'pula kamień=8');
assert(M.EPOCH_CIV_TYPE_POOL.braz === 14, 'pula brąz=14');
assert(M.EPOCH_CIV_TYPE_POOL.zelazo === 15, 'pula żelazo=15');

for (const [label, exp] of Object.entries(MP_EXPECT)) {
  const mp = M.miastaPanstwaMenuForMapLabel(label);
  assert(
    mp.opts.join(',') === exp.join(','),
    `${label} mp menu ${mp.opts.join('·')} (exp ${exp.join('·')})`,
  );
  assert(
    M.defaultMiastaPanstwaFromMapLabel(label) === exp[1],
    `${label} domyślne mp=${exp[1]}`,
  );
  const maxMp = parseInt(mp.opts[mp.opts.length - 1], 10);
  assert(maxMp <= M.MAX_MIAST_PANSTWA, `${label} mp max ${maxMp} ≤ ${M.MAX_MIAST_PANSTWA}`);
}

for (const [label, epochs] of Object.entries(TYPY_EXPECT)) {
  for (const [epoch, exp] of Object.entries(epochs)) {
    const typy = M.civTypesMenuForMapLabel(label, epoch);
    assert(
      typy.opts.join(',') === exp.join(','),
      `${label}+${epoch} typy menu ${typy.opts.join('·')} (exp ${exp.join('·')})`,
    );
    assert(
      M.defaultCivTypesFromMapLabel(label, epoch) === exp[1],
      `${label}+${epoch} domyślne typy=${exp[1]}`,
    );
    const triple = M.civTypesTripleForMapLabel(label, epoch);
    const min = triple.min;
    const max = triple.max;
    const pool = EPOCH_POOL[epoch];
    assert(min < max, `${label}+${epoch} min(${min}) < max(${max})`);
    assert(max <= pool, `${label}+${epoch} max(${max}) ≤ pula(${pool})`);
  }
}

// Skróty z zadania
const duzyKamien = M.civTypesTripleForMapLabel('Duży', 'kamien');
assert(duzyKamien.min < duzyKamien.max && duzyKamien.max <= 8, 'Duży+kamień min<max i max≤8');

const superZelazo = M.civTypesTripleForMapLabel('Super Huge', 'zelazo');
assert(superZelazo.max === 16, 'Super Huge+żelazo max=16');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
