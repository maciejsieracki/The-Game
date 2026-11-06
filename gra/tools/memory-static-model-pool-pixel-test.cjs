'use strict';
/**
 * memory-static-model-pool-pixel-test.cjs -- R-WEB-MEMORY-STATIC-FOOTPRINT-Q1 (B/C): obraz piksel w piksel.
 *
 * Prawdziwy Chromium + WebGL (swiftshader), prawdziwe buildery modeli (`buildUnitModel` dla wszystkich kategorii
 * i nazw z gra/data/units.json, `buildMiastoKamien`/`buildMiastoBraz`) i pierscienie wlasciciela jak w grze.
 * Ta sama scena i ten sam renderer:
 *   X1 -- klatka A (modele jak dotad: wlasne geometrie) == klatka B (po poolOwnedGeometries, czyli dokladnie to, co
 *         robia UnitRenderer._registerToken / CityRenderer._registerModel): 0 roznych pikseli (readPixels, RGBA),
 *         przy domyslnym sortowaniu sceny three.js (sortObjects = true);
 *   X2 -- kontrola czulosci: wspoldzielenie MATERIALOW (wariant odrzucony, patrz raport) zmienia klatke -- three sortuje
 *         nieprzezroczyste obiekty po material.id, wiec inna kolejnosc rysowania zmienia wynik z-fightingu
 *         wspolplaszczyznowych scian. Test musi to wykryc (diff > 0), inaczej X1 niczego nie dowodzi;
 *   X3 -- picking: raycast w srodek kazdego modelu trafia ten sam model przed i po pooling;
 *   X4 -- mniej unikalnych geometrii (renderer.info.memory.geometries po renderze);
 *   X5 -- zwolnienie (releaseOwnedGeometries) bez wyjatku.
 * Usage (z gra/, wymaga node_modules): node tools/memory-static-model-pool-pixel-test.cjs [--shots <katalog>]
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const argv = process.argv;
const opt = (n) => (argv.indexOf('--' + n) !== -1 ? argv[argv.indexOf('--' + n) + 1] : null);
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
const SHOTS = opt('shots');
let pass = 0; let fail = 0;
const ok = (label, cond, detail) => { if (cond) { pass++; console.log('  OK  ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); } else { fail++; console.error(' FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); } };

const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8')).map((u) => u.Jednostka).filter(Boolean);
const SRC = path.join(GRA, 'src');
const entry = `
import * as THREE from 'three';
import { buildUnitModel } from '${SRC}/render/units';
import { buildMiastoKamien } from '${SRC}/render/miasto-kamien';
import { buildMiastoBraz } from '${SRC}/render/miasto-braz';
import { poolOwnedGeometries, releaseOwnedGeometries } from '${SRC}/render/geometryContentPool';
const UNITS: string[] = ${JSON.stringify(units)};
const CATS = ['melee', 'ranged', 'cavalry', 'siege', 'settler', 'worker', 'scout', 'naval', 'super', 'general'];
const W = 1600, H = 1000;
(window as any).run = () => {
  const out: any = {};
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H); document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x203040);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1); sun.position.set(3, 8, 5); scene.add(sun);
  const specs: Array<() => THREE.Group> = [];
  for (const col of [0xd04040, 0x3060d0]) {
    for (const c of CATS) specs.push(() => buildUnitModel(c, col));
    for (const n of UNITS) specs.push(() => buildUnitModel('melee', col, n));
    for (const lvl of [1, 2, 3, 4]) {
      specs.push(() => buildMiastoKamien(lvl, { mur: lvl > 2, color: col }));
      specs.push(() => buildMiastoBraz('egipt', lvl, { mur: lvl > 2, palisada: false, color: col }));
      specs.push(() => buildMiastoBraz('rzym', lvl, { mur: lvl > 2, palisada: lvl === 2, color: col }));
    }
  }
  const COLS = 24; const ROWS = Math.ceil(specs.length / COLS); const CELL = 1.6;
  const cam = new THREE.OrthographicCamera(-COLS * CELL / 2, COLS * CELL / 2, ROWS * CELL / 2, -ROWS * CELL / 2, 0.1, 200);
  cam.position.set(0, 30, 30); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
  const models: Array<{ grp: THREE.Group; geos: THREE.BufferGeometry[]; mats: THREE.Material[]; cx: number; cy: number }> = [];
  const ringGeo = new THREE.RingGeometry(0.5, 0.56, 6);
  specs.forEach((fn, i) => {
    const grp = fn();
    const isCity = !grp.userData['perTokenGeos'];
    let geos: THREE.BufferGeometry[]; let mats: THREE.Material[];
    if (isCity) {
      const gs = new Set<THREE.BufferGeometry>(); const ms = new Set<THREE.Material>();
      grp.traverse((o: any) => { if (o.isMesh) { gs.add(o.geometry); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m: any) => ms.add(m)); } });
      geos = [...gs]; mats = [...ms]; grp.scale.setScalar(0.35);
    } else {
      geos = grp.userData['perTokenGeos'] ?? []; mats = grp.userData['mats'] ?? [];
      const own = new THREE.MeshBasicMaterial({ color: (i % 2) ? 0xffcc00 : 0x00ccff, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, own); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; grp.add(ring); mats.push(own);
    }
    const col = i % COLS; const row = Math.floor(i / COLS);
    grp.position.set((col - COLS / 2 + 0.5) * CELL, 0, (row - ROWS / 2 + 0.5) * CELL);
    scene.add(grp);
    models.push({ grp, geos, mats, cx: col, cy: row });
  });
  scene.updateMatrixWorld(true);
  const gl = renderer.getContext();
  const grab = (): Uint8Array => { renderer.render(scene, cam); const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
  const ray = new THREE.Raycaster();
  const pick = (): number[] => models.map((m) => {
    const p = new THREE.Vector3(); new THREE.Box3().setFromObject(m.grp).getCenter(p); p.project(cam);
    ray.setFromCamera(new THREE.Vector2(p.x, p.y), cam);
    const hit = ray.intersectObjects(scene.children, true)[0];
    if (!hit) return -1; let o: any = hit.object; while (o.parent && o.parent !== scene) o = o.parent; return models.findIndex((x) => x.grp === o);
  });
  const pxA = grab(); const pickA = pick();
  const cnt = (p: Uint8Array, q: Uint8Array) => { let d = 0; for (let i = 0; i < p.length; i += 4) if (p[i] !== q[i] || p[i + 1] !== q[i + 1] || p[i + 2] !== q[i + 2] || p[i + 3] !== q[i + 3]) d++; return d; };
  out.diffAA = cnt(pxA, grab());
  out.infoA = { geometries: renderer.info.memory.geometries, programs: (renderer.info.programs || []).length };
  const uniq = () => { const s = new Set(); scene.traverse((o: any) => { if (o.isMesh) s.add(o.geometry); }); return s.size; };
  out.uniqA = uniq();
  for (const m of models) poolOwnedGeometries(m.grp, m.geos);
  const pxB = grab(); const pickB = pick();
  out.uniqB = uniq();
  out.infoB = { geometries: renderer.info.memory.geometries, programs: (renderer.info.programs || []).length };
  out.diffAB = cnt(pxA, pxB); out.pixels = W * H; out.models = models.length;
  out.pickSame = pickA.every((v, i) => v === pickB[i]); out.pickHits = pickA.filter((v, i) => v === i).length;
  // X2: kontrola czulosci -- wspolne materialy (identyczny stan) zmieniaja tylko kolejnosc rysowania
  const canon = new Map<string, THREE.Material>();
  for (const m of models) m.grp.traverse((o: any) => {
    if (!o.isMesh || Array.isArray(o.material) || o.material.map) return;
    const j = o.material.toJSON(); delete j.uuid; const k = JSON.stringify(j);
    const c = canon.get(k); if (c) o.material = c; else canon.set(k, o.material);
  });
  out.diffMatShare = cnt(pxB, grab());
  try { for (const m of models) releaseOwnedGeometries(m.geos); out.releaseOk = true; } catch (e) { out.releaseOk = String(e); }
  out.pngA = renderer.domElement.toDataURL('image/png').length;
  return out;
};
`;

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-mem2-pixel-'));
  let browser;
  try {
    const res = await esbuild.build({ stdin: { contents: entry, resolveDir: GRA, loader: 'ts' }, bundle: true, format: 'iife', write: false, logLevel: 'error',
      loader: { '.json': 'json', '.png': 'dataurl', '.jpg': 'dataurl', '.mp3': 'dataurl', '.svg': 'dataurl' } });
    fs.writeFileSync(path.join(tmp, 'b.js'), res.outputFiles[0].text);
    fs.writeFileSync(path.join(tmp, 'index.html'), '<!doctype html><meta charset="utf-8"><body style="margin:0"><script src="b.js"></script>');
    browser = await chromium.launch({ headless: true, executablePath: fs.existsSync(FALLBACK_CHROME) ? FALLBACK_CHROME : undefined,
      args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
    await page.goto('file://' + path.join(tmp, 'index.html'));
    const r = await page.evaluate(() => window.run());
    if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, 'model-pool-grid.png') }); }
    ok('X0 brak bledow strony, render deterministyczny (A == A)', errs.length === 0 && r.diffAA === 0, { errs, diffAA: r.diffAA });
    ok('X1 klatka przed == po pooling geometrii (0 roznych pikseli)', r.diffAB === 0, { diffAB: r.diffAB, pixels: r.pixels, models: r.models });
    ok('X2 kontrola czulosci: wspolne materialy zmieniaja klatke (test widzi kolejnosc rysowania)', r.diffMatShare > 0, { diffMatShare: r.diffMatShare });
    ok('X3 picking ten sam przed i po', r.pickSame && r.pickHits > r.models * 0.8, { pickSame: r.pickSame, hits: r.pickHits, models: r.models });
    ok('X4 mniej unikalnych geometrii', r.uniqB < r.uniqA / 1.5 && r.infoB.geometries < r.infoA.geometries, { uniqA: r.uniqA, uniqB: r.uniqB, infoA: r.infoA, infoB: r.infoB });
    ok('X5 zwolnienie bez wyjatku', r.releaseOk === true, r.releaseOk);
  } catch (e) {
    fail++; console.error(e);
  } finally {
    if (browser) await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`\nWYNIK: ${pass} OK / ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})();
