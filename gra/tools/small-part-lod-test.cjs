'use strict';
/**
 * small-part-lod-test.cjs — R-WEB-PERF-LATE-GAME-LAG-HUD-Q2 (R3)
 *
 * Regression for the render-side LOD of small model parts (draw calls scale ~96 per unit token).
 *   1. far zoom hides meshes below the pixel threshold; large meshes stay visible;
 *   2. near zoom restores every hidden mesh (no permanent loss);
 *   3. repeated calls in the same distance bucket/version are no-ops (no per-frame traversal);
 *   4. a new model (version bump) is processed even at unchanged zoom;
 *   5. 'unitStatPlate' subtrees, renderOrder != 0 meshes, InstancedMesh and hidden roots are never touched;
 *   6. minPx <= 0 disables the LOD and restores everything;
 *   7. nested scale is accounted for (tiny geometry under a big scaled parent stays visible).
 *
 * Run from gra/: node tools/small-part-lod-test.cjs
 */
const fs = require('fs');
const path = require('path');
const GRA_DIR = path.resolve(__dirname, '..');
let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log('  PASS: ' + label); }
  else { fail++; console.log('  FAIL: ' + label + (detail ? ' -- ' + detail : '')); }
}
const esbuild = require(path.resolve(GRA_DIR, 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.small-part-lod-entry.ts');
const bundle = path.resolve(__dirname, '.small-part-lod-bundle.cjs');
fs.writeFileSync(entry, `
export { SmallPartLod } from '../src/render/smallPartLod';
import * as THREE from 'three';
export { THREE };
`);
try {
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, absWorkingDir: GRA_DIR, logLevel: 'silent' });
  const { SmallPartLod, THREE } = require(bundle);
  const box = s => new THREE.Mesh(new THREE.BoxGeometry(s, s, s), new THREE.MeshBasicMaterial());
  const scene = new THREE.Scene();
  const makeToken = () => {
    const g = new THREE.Group();
    const big = box(1.0);                 // radius ~0.87
    const small = box(0.01);              // radius ~0.0087
    const plate = new THREE.Group(); plate.name = 'unitStatPlate';
    const plateMesh = box(0.001); plate.add(plateMesh);
    const ordered = box(0.001); ordered.renderOrder = 5;
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.001, 0.001, 0.001), new THREE.MeshBasicMaterial(), 2);
    const bigParent = new THREE.Group(); bigParent.scale.set(100, 100, 100);
    const nested = box(0.01);             // 0.01 * 100 => visible
    bigParent.add(nested);
    g.add(big, small, plate, ordered, inst, bigParent);
    scene.add(g);
    return { g, big, small, plateMesh, ordered, inst, nested };
  };
  const t1 = makeToken();
  const roots = [t1.g];
  const lod = new SmallPartLod();
  const FOV = 45, VH = 1000;

  // near: dist 5 => world/px = 2*5*tan(22.5deg)/1000 ~ 0.00414 ; small diameter 0.0173 => ~4.2px >= 3 -> visible
  lod.apply(roots, scene, 1, 5, FOV, VH, 3);
  check('near zoom hides nothing', lod.hiddenCount === 0 && t1.small.visible && t1.big.visible);

  // far: dist 316 => world/px ~ 0.26 ; small diameter 0.017 << 3px
  lod.apply(roots, scene, 1, 316, FOV, VH, 3);
  check('far zoom hides tiny mesh', t1.small.visible === false);
  check('far zoom keeps large mesh (1.0 world ~ 3.8px)', t1.big.visible === true);
  check('stat plate subtree untouched', t1.plateMesh.visible === true);
  check('renderOrder != 0 mesh untouched', t1.ordered.visible === true);
  check('InstancedMesh untouched', t1.inst.visible === true);
  check('nested scale respected (tiny geometry in x100 parent stays)', t1.nested.visible === true);
  check('hiddenCount counts only LOD-hidden meshes', lod.hiddenCount === 1, 'got ' + lod.hiddenCount);

  // idempotent: same bucket/version must not traverse again -> externally flipped mesh stays as-is
  t1.small.visible = true;
  lod.apply(roots, scene, 1, 316, FOV, VH, 3);
  check('same bucket + version is a no-op (no per-frame work)', t1.small.visible === true);
  // tiny zoom change inside the same ~12% bucket is also a no-op
  lod.apply(roots, scene, 1, 317, FOV, VH, 3);
  check('sub-bucket zoom change is a no-op', t1.small.visible === true);

  // new model at unchanged zoom => version bump processes it
  const t2 = makeToken();
  lod.apply([t1.g, t2.g], scene, 2, 316, FOV, VH, 3);
  check('version bump re-evaluates (new token small part hidden)', t2.small.visible === false && t1.small.visible === false);

  // hidden root skipped
  t2.g.visible = false;
  const t3 = makeToken(); t3.g.visible = false;
  lod.apply([t1.g, t2.g, t3.g], scene, 3, 316, FOV, VH, 3);
  check('hidden root is skipped', t3.small.visible === true);

  // zoom back in restores everything
  lod.apply([t1.g, t2.g, t3.g], scene, 3, 5, FOV, VH, 3);
  check('zoom in restores all hidden meshes', lod.hiddenCount === 0 && t1.small.visible && t2.small.visible);

  // disable
  lod.apply(roots, scene, 4, 316, FOV, VH, 3);
  check('re-hidden at far zoom', t1.small.visible === false);
  lod.apply(roots, scene, 4, 316, FOV, VH, 0);
  check('minPx <= 0 disables LOD and restores', lod.hiddenCount === 0 && t1.small.visible === true);

  // reset
  lod.apply(roots, scene, 5, 316, FOV, VH, 3);
  lod.reset();
  check('reset() restores and forgets key', lod.hiddenCount === 0 && t1.small.visible === true);
} finally {
  try { fs.unlinkSync(entry); } catch {}
  try { fs.unlinkSync(bundle); } catch {}
}
console.log(`\nsmall-part-lod-test: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
