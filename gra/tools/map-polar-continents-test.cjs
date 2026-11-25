'use strict';
/**
 * R-WEB-MAP-POLAR-RESTORE-CONTINENTS-Q1 (A1, 2026-11-25): dowód, że mapa „kontynenty” ma pas
 * polarny (TerenBazowy.Polarny) dla kilku ziaren, a typ „ziemia” nadal nie ma Antarktydy.
 * Regresja: MAP-POLAR-ZERO (od 40a29e4c6 kontynenty miały 0 heksów Polarny).
 * Mutacja: wyłączenie ochrony pasa polarnego dla kontynentów (generator.ts: argument
 * `typ === 'kontynenty'` przekazywany do applyLandFractionByContinent → false, czyli
 * polarBandLastForErosion zwraca kolejkę bez zmian) musi dawać czerwony wynik.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'map-polar-continents-'));
const ENTRY = path.join(TMP, 'entry.ts');
const BUNDLE = path.join(TMP, 'bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generujSwiat } from ${JSON.stringify(path.join(GRA, 'src/map/generator'))};
export { climateBandAt, latitudinalOceanBufferRows } from ${JSON.stringify(path.join(GRA, 'src/map/gen-helpers'))};
export { TerenBazowy } from ${JSON.stringify(path.join(GRA, 'src/types/hex'))};`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  loader: { '.ts': 'ts', '.json': 'json' },
  logLevel: 'silent',
});

const M = require(BUNDLE);
const { TerenBazowy } = M;
const OPTS = {
  worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
};

let fail = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    fail++;
  } else {
    console.log('ok:', msg);
  }
}

/** Heksy grywalnego pasa polarnego (climateBandAt polar, poza buforem oceanu) — sufit dla Polarny. */
function polarBandHexCount(map, isEarth) {
  const h = map.wysokoscR;
  const buf = M.latitudinalOceanBufferRows(h, isEarth);
  let n = 0;
  for (const hex of Object.values(map.hexes)) {
    const r = hex.coords.r;
    if (r < buf || r >= h - buf) continue;
    const band = M.climateBandAt(hex.coords.q, hex.coords.r, h, isEarth);
    if (band === 'polar_north' || band === 'polar_south') n++;
  }
  return n;
}

function polarCount(map) {
  let n = 0;
  for (const hex of Object.values(map.hexes)) {
    if (hex.terenBazowy === TerenBazowy.Polarny) n++;
  }
  return n;
}

// Sufit (R-WEB-MAP-POLAR-RESTORE-CONTINENTS-Q1 obrona r1, nit 5): zmierzone po poprawce (168x120,
// standardowy, kontynenty) seed 1 = 387, 42 = 404, 99 = 381, 7777 = 449; pas grywalny ~2016 heksów.
// Sufit 600 = ~1,35 x najwyższy pomiar: wykrywa zarówno zero (regresja), jak i nadmiar.
const POLAR_CEILING = 600;
const SEEDS = [1, 7, 42, 4242];
for (const seed of SEEDS) {
  const map = M.generujSwiat(seed, 'standardowy', 'kontynenty', OPTS);
  const polar = polarCount(map);
  const band = polarBandHexCount(map, false);
  const ceiling = POLAR_CEILING;
  console.log(`  seed=${seed} kontynenty standardowy: polar=${polar} pasPolarny=${band} sufit=${ceiling}`);
  assert(polar > 0, `kontynenty seed ${seed}: polar > 0 (${polar})`);
  assert(polar <= ceiling, `kontynenty seed ${seed}: polar <= sufit ${ceiling} (${polar})`);
}

const small = M.generujSwiat(42, 'malenki', 'kontynenty', OPTS);
const smallPolar = polarCount(small);
console.log(`  seed=42 kontynenty malenki: polar=${smallPolar}`);
assert(smallPolar > 0, `kontynenty malenki seed 42: polar > 0 (${smallPolar})`);

const earth = M.generujSwiat(42, 'standardowy', 'ziemia', OPTS);
const earthPolar = polarCount(earth);
assert(earthPolar === 0, `ziemia seed 42 bez Polarny (Antarktyda zamierzenie): ${earthPolar}`);

console.log(fail === 0 ? 'map-polar-continents-test: PASS' : `map-polar-continents-test: FAIL (${fail})`);
fs.rmSync(TMP, { recursive: true, force: true });
process.exit(fail > 0 ? 1 : 0);
