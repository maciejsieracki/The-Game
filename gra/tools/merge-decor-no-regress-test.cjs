'use strict';
/** merge-decor-no-regress-test.cjs — skip podwójnego collapse + offline overlay count */
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const BUNDLE = path.join(__dirname, '.merge-decor-no-regress-bundle.cjs');

esbuild.buildSync({
  entryPoints: [path.join(__dirname, '.merge-decor-no-regress-entry.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: ROOT,
  loader: { '.ts': 'ts', '.json': 'json' },
  logLevel: 'silent',
});

const THREE = require('three');
const M = require(BUNDLE);

let pass = 0;
let fail = 0;

function ok(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}

// --- isAlreadyMergedDecor + podwójny collapse ---
const g = new THREE.Group();
const m1 = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshLambertMaterial({ color: 0xff0000 }),
);
const m2 = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
);
g.add(m1);
g.add(m2);
ok(M.countMeshesInGroup(g) === 2, 'pre-merge: 2 meshy');

M.collapseToMergedMesh(g);
ok(g.children.length === 1, 'po merge: 1 dziecko');
ok(M.isAlreadyMergedDecor(g), 'isAlreadyMergedDecor po collapse');

const posBefore = g.children[0].geometry.getAttribute('position').array.length;
M.collapseToMergedMesh(g);
ok(g.children.length === 1, 'drugi collapse: nadal 1 dziecko');
ok(
  g.children[0].geometry.getAttribute('position').array.length === posBefore,
  'drugi collapse: geometria bez zmian (skip)',
);
ok(g.userData[M.MERGED_DECOR_FLAG] === true, 'flaga MERGED_DECOR na grupie');

// --- offline overlay count (roblox pangea standard) ---
const DENSITY = { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' };
const map = M.generujSwiat(42, 'standardowy', 'pangea', { worldDensity: DENSITY });
const counts = M.countSceneOverlayCandidates(map, 'roblox');
ok(counts.total >= 0, 'countSceneOverlayCandidates zwraca total');
ok(
  counts.estHeavyMerge + counts.estLightSkip === counts.total,
  'heavy+light = total',
);
console.log('  overlay roblox/pangea/standard:', JSON.stringify(counts));

console.log(`\nmerge-decor-no-regress-test: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
