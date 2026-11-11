'use strict';
/**
 * falangita-sarissa-shots.cjs — zrzuty Falangi (zblizenie + widok z daleka), PRZED/PO.
 * TEMAT: R-WEB-RENDER-FALANGA-UNIT-MODEL-PHALANGITE-Q1.
 * Usage (z gra/): node tools/falangita-sarissa-shots.cjs <katalog-wyjsciowy> [--before-ref origin/main]
 *   Zrzuty "po" = bieżące drzewo robocze; "przed" = hastati-falangita.ts z <before-ref> (git show),
 *   wstrzyknięty przez plugin esbuild (bez dotykania plików).
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const { chromium } = require(path.resolve(GRA, 'node_modules', 'playwright'));
const OUT = path.resolve(process.argv[2] || path.join(GRA, '..', 'tmp-shots'));
const refIdx = process.argv.indexOf('--before-ref');
const BEFORE_REF = refIdx > -1 ? process.argv[refIdx + 1] : 'origin/main';
const MODEL_TS = path.resolve(GRA, 'src', 'render', 'hastati-falangita.ts');
const ENTRY = path.resolve(__dirname, '.falangita-shots-entry.ts');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(ENTRY, [
  "import * as THREE from 'three';",
  "import { buildUnitModel } from '../src/render/units.ts';",
  'window.__THREE = THREE; window.__buildUnitModel = buildUnitModel;', '',
].join('\n'));

const oldSrc = execFileSync('git', ['show', BEFORE_REF + ':gra/src/render/hastati-falangita.ts'],
  { cwd: GRA, encoding: 'utf8', maxBuffer: 1 << 26 });
const beforePlugin = {
  name: 'before',
  setup(b) {
    b.onLoad({ filter: /hastati-falangita\.ts$/ }, (a) => (path.resolve(a.path) === MODEL_TS
      ? { contents: oldSrc, loader: 'ts', resolveDir: path.dirname(a.path) } : null));
  },
};
async function bundle(out, before) {
  await esbuild.build({ entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: out, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    plugins: before ? [beforePlugin] : [], logLevel: 'silent' });
}

async function launch() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({ headless: true, args: ['--no-sandbox'],
      executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  }
}

async function shotSet(page, bundleFile, tag) {
  await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0"></body></html>');
  await page.addScriptTag({ path: bundleFile });
  for (const view of ['close-front', 'close-34', 'close-side-right', 'close-back34', 'far-line']) {
    await page.evaluate((view) => {
      const THREE = window.__THREE, build = window.__buildUnitModel;
      document.body.innerHTML = '';
      const W = 900, H = 520;
      const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
      r.setSize(W, H); r.setClearColor(0x78a7ff, 1);
      document.body.appendChild(r.domElement);
      const scene = new THREE.Scene();
      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      const d = new THREE.DirectionalLight(0xffffff, 1.0); d.position.set(2, 3, 2); scene.add(d);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x6a8a4a })); scene.add(ground);
      const cam = new THREE.PerspectiveCamera(30, W / H, 0.05, 60);
      if (view.startsWith('close')) {
        const u = build('falanga', 0x3366ee, 'Falanga');
        const rot = { 'close-front': 0, 'close-34': 0.7, 'close-side-right': Math.PI / 2, 'close-back34': Math.PI + 0.7 }[view];
        u.rotation.y = rot; scene.add(u);
        cam.position.set(0.0, 0.62, 1.9); cam.lookAt(0, 0.28, 0.1);
      } else {
        // widok z daleka: 3 rzedy x 6 w szyku, kamera jak w grze (elewacja ~50deg)
        for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) {
          const u = build('falanga', row === 2 ? 0xcc4422 : 0x3366ee, 'Falanga');
          u.position.set((i - 2.5) * 0.62, 0, -row * 0.75);
          if (row === 2) { u.rotation.y = Math.PI; u.position.z = 0.4; }
          scene.add(u);
        }
        cam.fov = 28; cam.position.set(0, 5.2, 6.2); cam.lookAt(0, 0.2, -0.4);
      }
      cam.updateProjectionMatrix();
      r.render(scene, cam);
    }, view);
    await page.screenshot({ path: path.join(OUT, `${tag}-${view}.png`), clip: { x: 0, y: 0, width: 900, height: 520 } });
  }
}

(async () => {
  const bPo = path.resolve(__dirname, '.falangita-shots-po.js');
  const bPrzed = path.resolve(__dirname, '.falangita-shots-przed.js');
  await bundle(bPo, false);
  await bundle(bPrzed, true);
  const br = await launch();
  const page = await br.newPage({ viewport: { width: 900, height: 520 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await shotSet(page, bPrzed, 'przed');
  await shotSet(page, bPo, 'po');
  await br.close();
  for (const f of [ENTRY, bPo, bPrzed]) { try { fs.unlinkSync(f); } catch (_) {} }
  console.log('zrzuty w ' + OUT + (errs.length ? ' BLEDY: ' + errs.join(' | ') : ' (0 bledow JS)'));
})();
