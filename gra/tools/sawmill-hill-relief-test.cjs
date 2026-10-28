'use strict';

// Regression for a sawmill built on a wooded hill: preserve the hill relief and
// forest overlay, then place the improvement sector against the sampled slope.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require('esbuild');

const gra = path.resolve(__dirname, '..');
const mainSource = fs.readFileSync(path.join(gra, 'src/main.ts'), 'utf8');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sawmill-hill-relief-'));
const entry = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'relief.cjs');
let passed = 0;
function check(condition, message) {
  assert.ok(condition, message);
  passed++;
  console.log(`PASS: ${message}`);
}

try {
  fs.writeFileSync(entry, `export { preservesHillReliefKey, preservesHillRelief } from ${JSON.stringify(path.join(gra, 'src/game/relief-preserving-improvements.ts'))};`);
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
  const relief = require(bundle);
  check(relief.preservesHillReliefKey('tartak'), 'tartak is explicitly marked as relief-preserving');
  check(relief.preservesHillRelief(['tartak']), 'a sawmill-only stack preserves the hill');
  check(!relief.preservesHillRelief(['tartak', 'farma']), 'a conflicting non-preserving layer does not silently preserve relief');

  const reliefStart = mainSource.indexOf('function keepsReliefUnderImprovement(');
  const reliefEnd = mainSource.indexOf('function improvementReliefOpts(', reliefStart);
  const reliefCode = mainSource.slice(reliefStart, reliefEnd);
  check(reliefCode.includes('return preservesHillRelief(layers);'), 'main terrain preservation uses the tested relief predicate');

  const decorStart = mainSource.indexOf('function syncImprovementDecorForHex(');
  const decorEnd = mainSource.indexOf('function removeClearingMesh(', decorStart);
  const decorCode = mainSource.slice(decorStart, decorEnd);
  const keepReliefAt = decorCode.indexOf('if (elevated && keepsReliefUnderImprovement(hexKey, layers))');
  const hideHillAt = decorCode.indexOf('if (elevated) {\n        hideDecorAtHex(hexKey);');
  check(keepReliefAt >= 0 && hideHillAt > keepReliefAt, 'preserved wooded hill returns before the fallback that hides forest/relief decor');

  const optsStart = mainSource.indexOf('function improvementReliefOpts(');
  const optsEnd = mainSource.indexOf('function improvementMeshPlacement(', optsStart);
  const optsCode = mainSource.slice(optsStart, optsEnd);
  check(optsCode.includes('keepsReliefUnderImprovement(hexKey, layers)'), 'sawmill sector gets elevated placement options on a preserved hill');
  check(optsCode.includes('reliefSurfaceSampler(hex.terenBazowy, q, r, map.seed, HEX_R)'), 'elevated placement samples the actual hill surface');

  const spawnStart = mainSource.indexOf('function spawnImprovementMesh(');
  const spawnEnd = mainSource.indexOf('\n    }', spawnStart);
  const spawnCode = mainSource.slice(spawnStart, spawnEnd);
  check(spawnCode.includes('improvementReliefOpts(q, r, layers)'), 'the spawned improvement visual receives the sampled relief placement');
  console.log(`\nsawmill-hill-relief-test: ${passed} assertions passed`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
