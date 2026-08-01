'use strict';
/** Bramka: ścieżki rzek bez pętli (revisit hex) + brak zamkniętych pierścieni krawędzi. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.river-loop-entry.ts');
const BUNDLE = path.resolve(__dirname, '.river-loop-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generateMap } from '../src/map/generator';
export { riverPathHasRevisitedHex, sanitizeRiverPath } from '../src/map/gen-helpers';`,
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
  if (cond) { pass++; console.log('PASS:', msg); }
  else { fail++; console.error('FAIL:', msg); }
}

// Jednostkowo: pętla A→B→C→A → sanitize usuwa revisit
const loopPath = [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 1, r: 1 }, { q: 0, r: 0 }];
ok(M.riverPathHasRevisitedHex(loopPath), 'wykrywa revisit w pętli');
const cleaned = M.sanitizeRiverPath(loopPath);
ok(!M.riverPathHasRevisitedHex(cleaned), 'sanitize usuwa revisit');
ok(cleaned.length <= 3, `sanitize skraca pętlę (${cleaned.length} hex)`);

// Integracja: generateMap — zero pętli w riverPaths
for (const seed of [1, 7, 42, 99]) {
  const map = M.generateMap(168, 120, seed, 'kontynenty', {
    mapSizeMenuLabel: 'Standardowy',
    worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
  });
  let loops = 0;
  for (let i = 0; i < map.riverPaths.length; i++) {
    if (M.riverPathHasRevisitedHex(map.riverPaths[i])) loops++;
  }
  ok(loops === 0, `seed ${seed}: 0 tras z revisit hex (${loops})`);
}

console.log(`\nriver-loop-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
