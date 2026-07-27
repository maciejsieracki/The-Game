'use strict';
/** C-MAP-Q3: pasy klimatyczne + teren polarny + bufor oceanu N/S. */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.climate-band-entry.ts');
const BUNDLE = path.join(__dirname, '.climate-band-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  climateBandAt,
  applyClimateBandsToHexes,
  latitudinalOceanBufferRows,
  enforceLatitudinalOceanBuffer,
  isInLatitudinalOceanBuffer,
} from '../src/map/gen-helpers';
export { generujSwiat } from '../src/map/generator';
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
  absWorkingDir: GRA,
  loader: { '.ts': 'ts', '.json': 'json' },
  logLevel: 'silent',
});

const M = require(BUNDLE);
const { TerenBazowy } = M;

let fail = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    fail++;
  }
}

const H = 100;
const BUF = 5;
assert(M.climateBandAt(0, BUF, H) === 'polar_north', 'playable north → polar_north');
assert(M.climateBandAt(0, BUF + 4, H) === 'polar_north', 'playable 4% → polar_north');
assert(M.climateBandAt(0, BUF + Math.floor(0.5 * (H - 2 * BUF)), H) === 'desert', 'playable mid → desert');
assert(M.climateBandAt(0, H - BUF - 1, H) === 'polar_south', 'playable south → polar_south');
assert(M.latitudinalOceanBufferRows(H, false) === 5, 'procedural buffer 5% of 100');
assert(M.latitudinalOceanBufferRows(120, true) >= 25, 'earth buffer ~30 on std height');

const map = M.generujSwiat(42, 'standardowy', 'kontynenty', {
  worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
});
const height = map.wysokoscR;
let polar = 0;
let desert = 0;
let landTopBuf = 0;
const buf = M.latitudinalOceanBufferRows(height, false);
for (const hex of Object.values(map.hexes)) {
  const { q, r } = hex.coords;
  if (hex.terenBazowy === TerenBazowy.Polarny) polar++;
  if (M.climateBandAt(q, r, height) === 'desert' && hex.terenBazowy === TerenBazowy.Pustynia) desert++;
  if (r < buf && hex.terenBazowy !== TerenBazowy.Morze && hex.terenBazowy !== TerenBazowy.Wybrzeze) {
    landTopBuf++;
  }
}
assert(polar > 0, `map has polar terrain (${polar} hexes)`);
assert(desert > 0, `desert band has pustynia (${desert} hexes)`);
assert(landTopBuf === 0, `top lat buffer is ocean-only (violations=${landTopBuf})`);

const earth = M.generujSwiat(42, 'standardowy', 'ziemia', {
  worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
});
let antLand = 0;
const eBuf = M.latitudinalOceanBufferRows(earth.wysokoscR, true);
for (const hex of Object.values(earth.hexes)) {
  const r = hex.coords.r;
  if (r < eBuf || r >= earth.wysokoscR - eBuf) {
    if (hex.terenBazowy !== TerenBazowy.Morze && hex.terenBazowy !== TerenBazowy.Wybrzeze) antLand++;
  }
}
assert(antLand === 0, `earth polar ocean buffer clear (violations=${antLand})`);

console.log(fail === 0 ? 'climate-band-test: PASS' : `climate-band-test: FAIL (${fail})`);
process.exit(fail > 0 ? 1 : 0);
