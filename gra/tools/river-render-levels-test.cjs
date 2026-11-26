'use strict';
/**
 * node tools/river-render-levels-test.cjs — RIVERS3A: trzy poziomy rzek widoczne domyślnie
 * i różna grubość (main > medium > tributary/short). Tylko render; generator map nietknięty.
 *
 * Sekcja A: domyślny etap renderu (bez location/localStorage w node) = 3 → przepuszcza tributary.
 * Sekcja B: filterRiverPathsForStage na domyślnym etapie zachowuje main, medium, tributary, short.
 * Sekcja C: riverWidthMulForKind — ścisła kolejność main > medium > tributary dla każdej długości.
 * Sekcja D: stary etap 2 (main+medium) nadal odcina dopływy (jawny wybór gracza respektowany).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.river-render-levels-entry.ts');
const BUNDLE = path.resolve(__dirname, '.river-render-levels-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  getRiverRenderStage,
  filterRiverPathsForStage,
  riverWidthMulForKind,
  RIVER_RENDER_DEFAULT_STAGE,
} from '../src/render/scene';
`,
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
const ok = (cond, msg) => {
  if (cond) { pass++; console.log('  OK', msg); }
  else { fail++; console.error('FAIL', msg); }
};

const seg = (tag) => [{ q: tag, r: 0 }, { q: tag, r: 1 }];
const paths = [seg(1), seg(2), seg(3), seg(4)];
const kinds = ['main', 'medium', 'tributary', 'short'];

console.log('\n[A] domyślny etap renderu');
const stage = M.getRiverRenderStage();
ok(M.RIVER_RENDER_DEFAULT_STAGE === 3, `RIVER_RENDER_DEFAULT_STAGE = 3 (jest ${M.RIVER_RENDER_DEFAULT_STAGE})`);
ok(stage === 3, `getRiverRenderStage() bez URL/localStorage = 3 (jest ${stage})`);

console.log('\n[B] domyślny etap przepuszcza wszystkie trzy poziomy');
const outDef = M.filterRiverPathsForStage(paths, kinds, stage);
const keptKinds = outDef.pathKinds;
ok(keptKinds.includes('main'), 'main widoczne');
ok(keptKinds.includes('medium'), 'medium widoczne');
ok(keptKinds.includes('tributary'), 'tributary (trzeci poziom) widoczne domyślnie');
ok(keptKinds.includes('short'), 'short widoczne domyślnie');
ok(outDef.paths.length === 4, `liczba tras po filtrze = 4 (jest ${outDef.paths.length})`);

console.log('\n[C] różna grubość: main > medium > tributary/short');
let orderOk = true;
const lens = [2, 9, 10, 17, 18, 40, 100];
for (const L of lens) {
  const m = M.riverWidthMulForKind('main', L);
  const d = M.riverWidthMulForKind('medium', L);
  const t = M.riverWidthMulForKind('tributary', L);
  const s = M.riverWidthMulForKind('short', L);
  if (!(m > d && d > t && t === s)) orderOk = false;
  if (t < 0.3 - 1e-9) orderOk = false;
}
ok(orderOk, 'dla każdej długości: main > medium > tributary == short, tributary ≥ 0,3');
const tributaryVal = M.riverWidthMulForKind('tributary', 20);
const mediumVal = M.riverWidthMulForKind('medium', 20);
const mainVal = M.riverWidthMulForKind('main', 20);
ok(tributaryVal < mediumVal && mediumVal < mainVal,
  `przykład len=20: main ${mainVal.toFixed(3)} > medium ${mediumVal.toFixed(3)} > tributary ${tributaryVal.toFixed(3)}`);

console.log('\n[D] jawny stary etap 2 nadal odcina dopływy');
const out2 = M.filterRiverPathsForStage(paths, kinds, 2);
ok(!out2.pathKinds.includes('tributary') && !out2.pathKinds.includes('short'),
  'stage 2 odcina tributary/short (wybór gracza respektowany)');
ok(out2.pathKinds.includes('main') && out2.pathKinds.includes('medium'), 'stage 2 zachowuje main i medium');

console.log(`\nWYNIK: ${pass} OK / ${fail} FAIL`);
try { fs.unlinkSync(ENTRY); } catch { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
