'use strict';
/**
 * memory-static-material-pool-pixel-test.cjs -- R-WEB-MEMORY-SHARED-MATERIALS-UNIT-MERGE-Q1 (A): wspolne materialy
 * modeli BEZ zmiany obrazu (piksel w piksel).
 *
 * Prawdziwy Chromium + WebGL (swiftshader), prawdziwe buildery (`buildUnitModel` dla wszystkich kategorii i nazw z
 * gra/data/units.json, `buildMiastoKamien`/`buildMiastoBraz`), pierscienie wlasciciela jak w grze (194 modele).
 * Dwie SWIEZE strony buduja te sama scene (te same id materialow/obiektow):
 *   strona P (plain)  -- jak przed tematem: tylko GeometryContentPool, wlasne materialy, przyciemnienie wprost;
 *   strona S (shared) -- GeometryContentPool + MaterialContentPool, przyciemnienie przez unshare() (jak UnitRenderer).
 * Obie z `renderer.setOpaqueSort(pooledMaterialOpaqueSort)` (tak jak scene.ts); P dodatkowo z domyslnym sortowaniem.
 *   M0 -- P: domyslne painterSortStable == pooledMaterialOpaqueSort (bez znacznikow sortowanie identyczne);
 *   M1 -- klatka bazowa P == S (0 roznych pikseli RGBA);
 *   M2 -- klatka z przyciemnieniem co 3. modelu P == S, po zdjeciu przyciemnienia P == S i == baza;
 *   M3 -- kontrola czulosci: S z domyslnym sortowaniem (material.id wspolnego materialu) ROZNI sie od P (> 0 px),
 *         inaczej M1 niczego nie dowodzi;
 *   M4 -- przyciemnienie S nie przechodzi na inne modele (materialy przyciemnionych prywatne, reszta nietknieta);
 *   M5 -- picking (raycast w srodek kazdego modelu) ten sam w P i S;
 *   M6 -- materialow w scenie mniej (unikalne `mesh.material`), zwolnienie bez wyjatku, pula pusta po zwolnieniu.
 * Usage (z gra/, wymaga node_modules): node tools/memory-static-material-pool-pixel-test.cjs [--shots <katalog>]
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
import { GeometryContentPool } from '${SRC}/render/geometryContentPool';
import { MaterialContentPool, pooledMaterialOpaqueSort } from '${SRC}/render/materialContentPool';
const UNITS: string[] = ${JSON.stringify(units)};
const CATS = ['melee', 'ranged', 'cavalry', 'siege', 'settler', 'worker', 'scout', 'naval', 'super', 'general'];
const W = 1600, H = 1000;
const b64 = (u: Uint8Array) => { let s = ''; const C = 0x8000; for (let i = 0; i < u.length; i += C) s += String.fromCharCode.apply(null, Array.from(u.subarray(i, i + C))); return btoa(s); };
(window as any).run = (mode: 'plain' | 'shared') => {
  const out: any = { mode };
  const GPOOL = new GeometryContentPool();
  const MPOOL = new MaterialContentPool();
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H); document.body.appendChild(renderer.domElement);
  renderer.setOpaqueSort(pooledMaterialOpaqueSort);
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
  const models: Array<{ grp: THREE.Group; geos: THREE.BufferGeometry[]; mats: THREE.Material[]; isCity: boolean }> = [];
  const ringGeo = new THREE.RingGeometry(0.5, 0.56, 6);
  const uniqMats = () => { const s = new Set(); scene.traverse((o: any) => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m: any) => s.add(m)); }); return s.size; };
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
      // pierscien wlasciciela jak UnitRenderer._attachOwnerRing (kolor wg wlasciciela -> identyczny stan w wielu zetonach)
      const own = new THREE.MeshBasicMaterial({ color: (i % 2) ? 0xffcc00 : 0x00ccff, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, own); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; grp.add(ring); mats.push(own);
    }
    const col = i % COLS; const row = Math.floor(i / COLS);
    grp.position.set((col - COLS / 2 + 0.5) * CELL, 0, (row - ROWS / 2 + 0.5) * CELL);
    scene.add(grp);
    models.push({ grp, geos, mats, isCity });
  });
  scene.updateMatrixWorld(true);
  out.models = models.length;
  out.matsBefore = uniqMats();
  for (const m of models) GPOOL.poolOwned(m.grp, m.geos);
  if (mode === 'shared') for (const m of models) MPOOL.poolOwned(m.grp, m.mats);
  out.matsAfter = uniqMats();
  out.poolStats = MPOOL.stats();
  const gl = renderer.getContext();
  const grab = (): Uint8Array => { renderer.render(scene, cam); const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
  const ray = new THREE.Raycaster();
  out.pick = models.map((m) => {
    const p = new THREE.Vector3(); new THREE.Box3().setFromObject(m.grp).getCenter(p); p.project(cam);
    ray.setFromCamera(new THREE.Vector2(p.x, p.y), cam);
    const hit = ray.intersectObjects(scene.children, true)[0];
    if (!hit) return -1; let o: any = hit.object; while (o.parent && o.parent !== scene) o = o.parent; return models.findIndex((x) => x.grp === o);
  });
  const base = grab();
  out.base = b64(base);
  renderer.setOpaqueSort(null as any);
  out.baseDefaultSort = b64(grab());
  renderer.setOpaqueSort(pooledMaterialOpaqueSort);
  // przyciemnienie co 3. modelu jednostki -- identyczne z UnitRenderer._applyDeferredDim
  const dimmed = models.filter((m, i) => !m.isCity && i % 3 === 0);
  const others = models.filter((m) => !dimmed.includes(m));
  const otherOpacityBefore = others.map((m) => m.mats.map((x: any) => x.opacity + '/' + x.transparent).join(','));
  const setDim = (m: { grp: THREE.Group; mats: THREE.Material[] }, dim: boolean) => {
    if (dim && mode === 'shared') MPOOL.unshare(m.grp, m.mats);
    for (const mm of new Set(m.mats)) { // jak UnitRenderer._applyDeferredDim (unikalne instancje)
      const mat = mm as any;
      if (dim) { mat.userData['dimBase'] = { transparent: mat.transparent, opacity: mat.opacity }; mat.transparent = true; mat.opacity = Math.min(mat.opacity, 0.45); }
      else { const b = mat.userData['dimBase']; if (!b) continue; mat.transparent = b.transparent; mat.opacity = b.opacity; delete mat.userData['dimBase']; }
      mat.needsUpdate = true;
    }
  };
  for (const m of dimmed) setDim(m, true);
  out.dim = b64(grab());
  out.dimLeak = others.some((m, k) => m.mats.map((x: any) => x.opacity + '/' + x.transparent).join(',') !== otherOpacityBefore[k]);
  out.dimPrivate = mode !== 'shared' || dimmed.every((m) => m.mats.every((x) => !others.some((o) => o.mats.includes(x))));
  for (const m of dimmed) setDim(m, false);
  const undim = grab();
  out.undim = b64(undim);
  let d = 0; for (let i = 0; i < base.length; i += 4) if (base[i] !== undim[i] || base[i + 1] !== undim[i + 1] || base[i + 2] !== undim[i + 2] || base[i + 3] !== undim[i + 3]) d++;
  out.undimVsBase = d;
  out.infoMaterials = (renderer.info.programs || []).length;
  try { for (const m of models) { MPOOL.release(m.mats); GPOOL.release(m.geos); } out.releaseOk = true; } catch (e) { out.releaseOk = String(e); }
  out.poolAfterRelease = MPOOL.stats();
  return out;
};
`;

function diff(a, b, W, shotPath) {
  const A = Buffer.from(a, 'base64'); const B = Buffer.from(b, 'base64');
  let d = 0; const where = [];
  for (let i = 0; i < A.length; i += 4) {
    if (A[i] !== B[i] || A[i + 1] !== B[i + 1] || A[i + 2] !== B[i + 2] || A[i + 3] !== B[i + 3]) { d++; if (where.length < 8) { const p = i / 4; where.push([p % W, Math.floor(p / W)]); } }
  }
  return { d, where };
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-mem4-matpixel-'));
  let browser;
  try {
    const res = await esbuild.build({ stdin: { contents: entry, resolveDir: GRA, loader: 'ts' }, bundle: true, format: 'iife', write: false, logLevel: 'error',
      loader: { '.json': 'json', '.png': 'dataurl', '.jpg': 'dataurl', '.mp3': 'dataurl', '.svg': 'dataurl' } });
    fs.writeFileSync(path.join(tmp, 'b.js'), res.outputFiles[0].text);
    fs.writeFileSync(path.join(tmp, 'index.html'), '<!doctype html><meta charset="utf-8"><body style="margin:0"><script src="b.js"></script>');
    browser = await chromium.launch({ headless: true, executablePath: fs.existsSync(FALLBACK_CHROME) ? FALLBACK_CHROME : undefined,
      args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
    const runMode = async (mode) => {
      const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
      const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
      await page.goto('file://' + path.join(tmp, 'index.html'));
      const r = await page.evaluate((m) => window.run(m), mode);
      if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, 'material-pool-' + mode + '.png') }); }
      await page.close();
      r.errs = errs; return r;
    };
    const P = await runMode('plain');
    const S = await runMode('shared');
    const W = 1600;
    ok('M0 brak bledow stron; bez znacznikow sortowanie == domyslne three.js', P.errs.length === 0 && S.errs.length === 0 && diff(P.base, P.baseDefaultSort, W).d === 0,
      { errs: [...P.errs, ...S.errs], d: diff(P.base, P.baseDefaultSort, W).d });
    const m1 = diff(P.base, S.base, W);
    ok('M1 klatka bazowa: wspolne materialy == wlasne (0 roznych pikseli z 1,6 mln)', m1.d === 0, { diff: m1.d, where: m1.where, models: S.models });
    const m2a = diff(P.dim, S.dim, W); const m2b = diff(P.undim, S.undim, W);
    ok('M2 przyciemnienie co 3. jednostki i zdjecie: P == S, po zdjeciu == baza', m2a.d === 0 && m2b.d === 0 && P.undimVsBase === 0 && S.undimVsBase === 0,
      { dim: m2a.d, undim: m2b.d, undimVsBaseP: P.undimVsBase, undimVsBaseS: S.undimVsBase, dimVsBase: diff(P.base, P.dim, W).d });
    const m3 = diff(P.base, S.baseDefaultSort, W);
    ok('M3 kontrola czulosci: wspolne materialy z domyslnym sortowaniem ROZNIA sie (test widzi kolejnosc)', m3.d > 0, { diff: m3.d, where: m3.where });
    ok('M4 przyciemnienie nie przechodzi na inne modele', !S.dimLeak && S.dimPrivate && !P.dimLeak, { leak: S.dimLeak, priv: S.dimPrivate });
    ok('M5 picking ten sam', JSON.stringify(P.pick) === JSON.stringify(S.pick) && P.pick.filter((v, i) => v === i).length > S.models * 0.8,
      { hits: P.pick.filter((v, i) => v === i).length, models: S.models });
    ok('M6 mniej materialow, zwolnienie OK, pula pusta', S.matsAfter < S.matsBefore / 3 && P.matsAfter === P.matsBefore && S.releaseOk === true && S.poolAfterRelease.shared === 0 && S.poolAfterRelease.refs === 0,
      { plain: [P.matsBefore, P.matsAfter], shared: [S.matsBefore, S.matsAfter], pool: S.poolStats, after: S.poolAfterRelease, release: S.releaseOk });
  } catch (e) {
    fail++; console.error(e);
  } finally {
    if (browser) await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`\nWYNIK: ${pass} OK / ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})();
