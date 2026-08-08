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

const eStartParams = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'e-start-params.json'), 'utf8'));

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

/**
 * Menu miast-państw (min·domyślne·max) — drabinka MIASTA_PANSTWA_MENU_BY_TIER,
 * stała ZASZYTA W KODZIE (gra/src/map/newGameMapDefaults.ts), NIEZALEŻNA od
 * e-start-params.json. Jeśli ta drabinka kiedyś się zmieni, uaktualnij ręcznie —
 * to celowy kontrakt kodu, nie dane do wyprowadzenia z JSON-a.
 */
const MP_LADDER_EXPECT = {
  Malenki: [2, 3, 4],
  Mały: [3, 4, 5],
  Standardowy: [4, 5, 7],
  Duży: [5, 6, 8],
  Ogromny: [6, 7, 9],
  'Super Huge': [7, 8, 9],
};

/**
 * Domyślna liczba miast-państw (defaultMiastaPanstwaFromMapLabel) czyta NAJPIERW
 * Panel-E (skala_mapy[label].miasta_panstwa), przez clampMiastaPanstwaCount —
 * dlatego wyprowadzamy oczekiwanie z żywego e-start-params.json zamiast wpisywać
 * liczbę na sztywno (2026-08-08: commit 6f96f08 obniżył te wartości o 1,
 * a test został ze starymi liczbami — ten rozjazd ma się nie powtórzyć).
 */
function jsonMiastaPanstwaDefault(label) {
  const raw = eStartParams.skala_mapy?.[label]?.miasta_panstwa;
  if (typeof raw !== 'number') throw new Error(`brak skala_mapy.${label}.miasta_panstwa w e-start-params.json`);
  const n = Math.floor(raw);
  return Math.max(1, Math.min(n, M.MAX_MIAST_PANSTWA));
}

/**
 * Macierz mapa × epoka (CIV-MAP-EPOCH-Q1 = A) — civTypesTripleForMapLabel() czyta
 * bezpośrednio skala_mapy[label].typy_cywilizacji_per_epoka[epoch] z Panel-E (pełny
 * passthrough, gdy JSON ma wpis dla danej pary mapa/epoka — dziś ma dla wszystkich).
 * Wyprowadzamy oczekiwania z żywego JSON-a z tego samego powodu co miasta-państwa wyżej.
 */
function jsonTypyTriple(label, epoch) {
  const t = eStartParams.skala_mapy?.[label]?.typy_cywilizacji_per_epoka?.[epoch];
  if (!t) throw new Error(`brak skala_mapy.${label}.typy_cywilizacji_per_epoka.${epoch} w e-start-params.json`);
  return [t.min, t.default, t.max];
}

const TYPY_LABELS = ['Malenki', 'Mały', 'Standardowy', 'Duży', 'Ogromny', 'Super Huge'];
const TYPY_EPOCHS = ['kamien', 'braz', 'zelazo'];

const EPOCH_POOL = { kamien: 8, braz: 14, zelazo: 15 };

console.log('map-scale-menu-test (Panel-E + menu kreatora + CIV-MAP-EPOCH-Q1)\n');

assert(M.MAX_MIAST_PANSTWA === 9, 'MAX_MIAST_PANSTWA=9');
assert(M.MAX_TYPY_CYWILIZACJI_MENU === 15, 'MAX_TYPY_CYWILIZACJI_MENU=15');
assert(M.EPOCH_CIV_TYPE_POOL.kamien === 8, 'pula kamień=8');
assert(M.EPOCH_CIV_TYPE_POOL.braz === 14, 'pula brąz=14');
assert(M.EPOCH_CIV_TYPE_POOL.zelazo === 15, 'pula żelazo=15');

for (const [label, exp] of Object.entries(MP_LADDER_EXPECT)) {
  const mp = M.miastaPanstwaMenuForMapLabel(label);
  assert(
    mp.opts.join(',') === exp.join(','),
    `${label} mp menu ${mp.opts.join('·')} (exp ${exp.join('·')}, drabinka kodu)`,
  );
  const expectedDefault = jsonMiastaPanstwaDefault(label);
  assert(
    M.defaultMiastaPanstwaFromMapLabel(label) === expectedDefault,
    `${label} domyślne mp=${expectedDefault} (Panel-E e-start-params.json)`,
  );
  const maxMp = parseInt(mp.opts[mp.opts.length - 1], 10);
  assert(maxMp <= M.MAX_MIAST_PANSTWA, `${label} mp max ${maxMp} ≤ ${M.MAX_MIAST_PANSTWA}`);
}

for (const label of TYPY_LABELS) {
  for (const epoch of TYPY_EPOCHS) {
    const exp = jsonTypyTriple(label, epoch);
    const typy = M.civTypesMenuForMapLabel(label, epoch);
    assert(
      typy.opts.join(',') === exp.join(','),
      `${label}+${epoch} typy menu ${typy.opts.join('·')} (exp ${exp.join('·')}, Panel-E)`,
    );
    assert(
      M.defaultCivTypesFromMapLabel(label, epoch) === exp[1],
      `${label}+${epoch} domyślne typy=${exp[1]} (Panel-E)`,
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
assert(superZelazo.max === 15, 'Super Huge+żelazo max=15');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
