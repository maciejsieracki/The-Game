'use strict';
/** node tools/civ-visual-test.cjs — kolorHex cywilizacji (B-decyzja 2026-07-07) */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.civ-visual-entry.ts');
const bundle = path.join(__dirname, '.civ-visual-bundle.cjs');

fs.writeFileSync(
  entry,
  `export {
  OWNER_COLORS_FALLBACK,
  parseHexColor,
  civColorHex,
  civColorForIkonaId,
  civColorForOwner,
  civColorCssForOwner,
} from '../src/game/civ-visual';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);
const civs = require('../data/civs.json');

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('civ-visual-test (kolorHex cywilizacji)\n');

assert(M.parseHexColor('#1E5AA8') === 0x1e5aa8, 'parseHexColor #1E5AA8');
assert(M.parseHexColor('C41E3A') === 0xc41e3a, 'parseHexColor bez #');
assert(M.parseHexColor('#ABC') === 0xaabbcc, 'parseHexColor skrót 3-znakowy');
assert(M.parseHexColor('not-a-hex') === M.OWNER_COLORS_FALLBACK[0], 'parseHexColor fallback przy złym hex');

const list = civs.cywilizacje;
assert(list.length === 15, `15 cywilizacji (jest ${list.length})`);

const hexSet = new Set();
for (const c of list) {
  const id = c.ikonaId;
  const hex = c.kolorHex;
  assert(typeof hex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(hex),
    `${id}: kolorHex wymagany #RRGGBB (dostał: ${hex})`);
  if (hex) hexSet.add(hex.toUpperCase());
  const resolved = M.civColorHex(civs, id);
  assert(resolved.toUpperCase() === hex.toUpperCase(), `${id}: civColorHex zgodny z JSON`);
  assert(M.civColorForIkonaId(civs, id) === M.parseHexColor(hex), `${id}: civColorForIkonaId`);
}

assert(hexSet.size >= 12, `kolory rozpoznawalne: min 12 unikalnych (jest ${hexSet.size})`);

const civTypeForOwner = (oid) => (oid === 0 ? 'grecy' : 'rzymianie');
assert(M.civColorForOwner(civs, 0, civTypeForOwner) === 0x1e5aa8, 'civColorForOwner gracz Grecy');
assert(M.civColorForOwner(civs, 3, civTypeForOwner) === 0x8b1a1a, 'civColorForOwner AI Rzymianie');
assert(M.civColorCssForOwner(civs, 0, civTypeForOwner) === '#1E5AA8', 'civColorCssForOwner CSS hex');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
