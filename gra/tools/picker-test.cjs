'use strict';
/** Picker math: worldToAxial roundtrip + NDC corners (regresja przesunięcia Y). */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.picker-test-entry.ts');
const BUNDLE = path.join(__dirname, '.picker-test-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { worldToAxial, clientRectToNdc } from '../src/input/picker';
export { axialToWorld, HEX_R } from '../src/render/hexutil';`,
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
  loader: { '.ts': 'ts' },
  logLevel: 'silent',
});

const { worldToAxial, clientRectToNdc, axialToWorld, HEX_R } = require(BUNDLE);

let pass = 0;
let fail = 0;

function ok(label, cond) {
  if (cond) { pass++; return; }
  fail++;
  console.error('FAIL:', label);
}

for (let q = -4; q <= 8; q++) {
  for (let r = -3; r <= 6; r++) {
    const { x, z } = axialToWorld(q, r, HEX_R);
    const back = worldToAxial(x, z, HEX_R);
    ok(`roundtrip ${q},${r}`, back.q === q && back.r === r);
  }
}

{
  const rect = { left: 100, top: 50, width: 800, height: 600 };
  const tl = clientRectToNdc(100, 50, rect);
  ok('NDC top-left x', tl && Math.abs(tl.x - (-1)) < 1e-9);
  ok('NDC top-left y', tl && Math.abs(tl.y - 1) < 1e-9);
  const br = clientRectToNdc(900, 650, rect);
  ok('NDC bottom-right x', br && Math.abs(br.x - 1) < 1e-9);
  ok('NDC bottom-right y', br && Math.abs(br.y - (-1)) < 1e-9);
  const ctr = clientRectToNdc(500, 350, rect);
  ok('NDC center', ctr && Math.abs(ctr.x) < 1e-9 && Math.abs(ctr.y) < 1e-9);
}

ok('NDC zero width', clientRectToNdc(0, 0, { left: 0, top: 0, width: 0, height: 100 }) === null);

console.log(`picker-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
