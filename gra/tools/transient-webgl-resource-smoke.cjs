'use strict';
/** Live Chromium/WebGL counter smoke for disposal of transient world-map resources. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));
const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.transient-webgl-entry.ts');
const BUNDLE = path.join(__dirname, '.transient-webgl-bundle.js');

async function main() {
  fs.writeFileSync(ENTRY, `
import * as THREE from 'three';
import { disposeTransientObject3D, markSharedTransientGeometry, markSharedTransientMaterial, cloneTransientMaterial } from '../src/render/transientObjectResources';
(window as any).runTransientSmoke = () => {
  const canvas = document.querySelector('canvas')!;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
  renderer.setSize(32, 32);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 10);
  camera.position.z = 3;
  const liveGeometry = markSharedTransientGeometry(new THREE.BoxGeometry(1, 1, 1));
  const liveMaterial = markSharedTransientMaterial(new THREE.MeshBasicMaterial({ color: 0x55aa99 }));
  const liveGroup = new THREE.Group();
  liveGroup.add(new THREE.Mesh(liveGeometry, liveMaterial));
  scene.add(liveGroup);
  renderer.render(scene, camera);
  const liveBaseline = renderer.info.memory.geometries;
  for (let i = 0; i < 120; i++) {
    const ghost = new THREE.Group();
    const sourceMaterial = markSharedTransientMaterial(new THREE.MeshBasicMaterial({ color: 0xffcc44 }));
    ghost.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), cloneTransientMaterial(sourceMaterial)));
    scene.add(ghost);
    renderer.render(scene, camera);
    scene.remove(ghost);
    disposeTransientObject3D(ghost);
    renderer.render(scene, camera);
  }
  const afterTransientCycles = renderer.info.memory.geometries;
  const sharedGeometryStillUsable = liveGeometry.attributes.position.count > 0
    && scene.children.includes(liveGroup)
    && liveMaterial.color.getHex() === 0x55aa99;
  scene.remove(liveGroup);
  disposeTransientObject3D(liveGroup);
  renderer.render(scene, camera);
  const afterLiveRemoval = renderer.info.memory.geometries;
  renderer.dispose();
  return { liveBaseline, afterTransientCycles, afterLiveRemoval, sharedGeometryStillUsable };
};
`, 'utf8');
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent' });
  const systemChromium = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].find(fs.existsSync);
  const browser = await chromium.launch({ ...(systemChromium ? { executablePath: systemChromium } : {}),
    headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'] });
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><canvas></canvas>');
    await page.addScriptTag({ path: BUNDLE });
    const result = await page.evaluate(() => window.runTransientSmoke());
    if (!result.sharedGeometryStillUsable || result.afterTransientCycles !== result.liveBaseline
        || result.afterLiveRemoval !== result.liveBaseline) {
      throw new Error(`WebGL geometry counter mismatch: ${JSON.stringify(result)}`);
    }
    console.log(JSON.stringify(result));
  } finally {
    await browser.close();
    for (const file of [ENTRY, BUNDLE]) { try { fs.unlinkSync(file); } catch (_) {} }
  }
}
main().catch((err) => { console.error(err); process.exitCode = 1; });
