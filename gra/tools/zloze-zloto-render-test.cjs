'use strict';
/**
 * zloze-zloto-render-test.cjs — R-ZLOTO-NIEWIDOCZNE (verify/close)
 * Sprawdza, że surowe złoże złota ma model 3D podpięty w buildStyledResourceOverlay.
 *
 * Run from gra/:  node tools/zloze-zloto-render-test.cjs
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.zloze-zloto-render-entry.ts');
const bundle = path.join(__dirname, '.zloze-zloto-render-bundle.cjs');

fs.writeFileSync(entry, `
export { buildStyledResourceOverlay } from '../src/render/styleResources';
export { buildZlozeZloto } from '../src/render/ulepszenia-modele-p3b';
export { Nakladka } from '../src/types/hex';
`, 'utf8');

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

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

function countMeshes(group) {
  let n = 0;
  group.traverse((o) => { if (o.isMesh) n++; });
  return n;
}

console.log('zloze-zloto-render-test (R-ZLOTO-NIEWIDOCZNE)\n');

const roblox = M.buildStyledResourceOverlay(M.Nakladka.Brak, 'roblox', 'zloto');
assert(roblox != null, 'roblox + zloze → non-null overlay');
assert(countMeshes(roblox) >= 18, 'roblox overlay ma meshe (>=18)');

const minecraft = M.buildStyledResourceOverlay(M.Nakladka.Brak, 'minecraft', 'zloto');
assert(minecraft != null, 'minecraft + zloze → non-null overlay (styledGoldOre)');
assert(countMeshes(minecraft) >= 6, 'minecraft overlay ma meshe (>=6)');

const direct = M.buildZlozeZloto();
assert(direct != null, 'buildZlozeZloto() eksportowane');
assert(countMeshes(direct) >= 18, 'buildZlozeZloto ma >=18 meshy (4 skupiska)');

const miedz = M.buildStyledResourceOverlay(M.Nakladka.Brak, 'roblox', 'miedz');
assert(miedz != null, 'kontrola: miedz nadal renderuje');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
