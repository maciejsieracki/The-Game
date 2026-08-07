'use strict';
/** Profil faz generateMap + clusters — Mały seed 42. */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.map-gen-phase-profile-entry.ts');
const BUNDLE = path.join(__dirname, '.map-gen-phase-profile-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `import { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../src/map/generator';
import { computeClusters } from '../src/map/clusters';
import { MAP_GEN_PHASE_LABELS } from '../src/map/mapGenProgress';

const map = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 42, 'kontynenty', {
  mapSizeMenuLabel: 'Mały',
  worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
});

console.log('=== map-gen-phase-profile: Mały seed=42 ===');
const t = map.mapGenTimings;
if (t) {
  for (const key of Object.keys(MAP_GEN_PHASE_LABELS) as (keyof typeof MAP_GEN_PHASE_LABELS)[]) {
    console.log(\`  \${MAP_GEN_PHASE_LABELS[key]}: \${t[key]}ms\`);
  }
  console.log(\`  total: \${t.total}ms\`);
} else {
  console.log('  (brak mapGenTimings)');
}

const t0 = performance.now();
computeClusters(map, { seed: 42, aktywneTypy: 5, rywaleNaKlaster: 4 });
const clustersMs = Math.round(performance.now() - t0);
console.log(\`  computeClusters: \${clustersMs}ms\`);
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
  absWorkingDir: GRA,
  loader: { '.ts': 'ts', '.json': 'json' },
  logLevel: 'silent',
});

require(BUNDLE);
