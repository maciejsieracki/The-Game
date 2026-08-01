'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const repo = path.resolve(__dirname, '..', '..');
const genPath = path.resolve(__dirname, '..', 'src', 'map', 'gen-helpers.ts');
const backup = genPath + '.compare-bak';
const commits = ['d6a4928', 'd963af4^', 'HEAD'];

fs.copyFileSync(genPath, backup);

const ENTRY = path.resolve(__dirname, '._tmp-compare-entry.ts');
const BUNDLE = path.resolve(__dirname, '._tmp-compare-bundle.cjs');
fs.writeFileSync(
  ENTRY,
  `export { generateMap } from '../src/map/generator';
export { groupLandMassKeys, maxDryLowlandPatchSize, maxLandHexDistanceToRiver } from '../src/map/gen-helpers';`,
  'utf8',
);

for (const rev of commits) {
  const content = execSync(`git show ${rev}:gra/src/map/gen-helpers.ts`, { cwd: repo, encoding: 'utf8' });
  fs.writeFileSync(genPath, content, 'utf8');
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
  const map = M.generateMap(168, 120, 42, 'kontynenty', {
    mapSizeMenuLabel: 'Standardowy',
    worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
  });
  const masses = M.groupLandMassKeys(map.hexes).filter((m) => m.length >= 8);
  let maxDry = 0;
  let maxProx = 0;
  for (const mass of masses) {
    if (mass.length < 150) continue;
    maxDry = Math.max(maxDry, M.maxDryLowlandPatchSize(mass, map.hexes));
    maxProx = Math.max(maxProx, M.maxLandHexDistanceToRiver(mass, map.hexes));
  }
  console.log(`${rev}: maxDry=${maxDry} maxProx=${maxProx}`);
}

fs.copyFileSync(backup, genPath);
fs.unlinkSync(backup);
