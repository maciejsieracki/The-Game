'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(GRA, 'package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(GRA, 'package-lock.json'), 'utf8'));
const rootLock = lock.packages?.[''];

assert(pkg.devDependencies?.esbuild, 'package.json must declare esbuild');
assert(rootLock?.devDependencies?.esbuild, 'package-lock.json must lock esbuild');
assert.strictEqual(pkg.scripts.prebuild, 'node tools/bundle-wiki-for-game.cjs');
assert.strictEqual(pkg.scripts.predev, 'node tools/bundle-wiki-for-game.cjs');
assert(!/export-data\.py|\/sessions\//.test(pkg.scripts.prebuild));
assert(!/export-data\.py|\/sessions\//.test(pkg.scripts.predev));

console.log('reproducible-build-contract-test: 6 passed, 0 failed');
