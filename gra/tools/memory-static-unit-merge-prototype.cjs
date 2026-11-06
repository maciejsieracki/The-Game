'use strict';
/**
 * memory-static-unit-merge-prototype.cjs -- R-WEB-MEMORY-SHARED-MATERIALS-UNIT-MERGE-Q1 (B): PROTOTYP scalenia statycznych
 * czesci modeli jednostek (POMIAR + test zgodnosci; prototyp NIE jest wpiety w gre).
 *
 * Scalenie: w zetonie `buildUnitModel` (+ pierscien wlasciciela jak w grze) wszystkie meshe o tym samym materiale (po
 * MaterialContentPool), tym samym renderOrder/cieniach/frustumCulled i zgodnym ukladzie atrybutow, z dodatnim wyznacznikiem
 * macierzy, laczone w JEDEN mesh (wierzcholki przeliczone do ukladu korzenia zetonu, `mergeGeometries`), a geometrie scalone
 * trafiaja do GeometryContentPool (identyczne typy zetonow dziela jedna scalona geometrie). Picking dziala dalej przez
 * `userData.unitId` korzenia (UnitRenderer.pickUnitIdAt idzie w gore po rodzicach). Na mapie czesci zetonow NIE sa animowane
 * (ruch/atak przesuwa caly korzen: `setTokenWorldPosition`), wiec pozy "stanie/marsz/atak" = ten sam model w innej pozycji.
 *
 * Czesc 1 (Node, V8 --expose-gc): 475 zetonow (t.100), sterta zetonow PRZED (pule geometrii + materialow) i PO scaleniu,
 *   liczba Object3D/meshy na zeton.
 * Czesc 2 (Chromium, swiftshader): 194 modele (kategorie + wszystkie nazwy z units.json, 2 kolory), klatka PRZED vs PO
 *   (rozne piksele RGBA z 1,6 mln), picking (raycast w srodek modelu -> ten sam model), oraz ta sama para po przesunieciu
 *   korzeni (poza "marsz") i obrocie (poza "atak").
 *
 * Runda 2 (zarzut Z2 Evaluatora): pomiar sterty sekwencyjny w JEDNYM procesie (geo -> mat -> merge) dawal rozne wyniki
 *   miedzy przebiegami/srodowiskami (geo+mat 51,06 MB u Operatora, 60,25 MB u Evaluatora), bo stan sterty V8 po
 *   poprzednim trybie (JIT, feedback, fragmentacja, leniwie tworzone singletony) liczy sie do kolejnego. Teraz KAZDY tryb
 *   mierzony jest w OSOBNYM, swiezym procesie Node (`--heap-child <tryb>`), z przebiegiem rozgrzewkowym tego samego trybu
 *   w tym procesie, REPS powtorzen z rotowana kolejnoscia trybow; raportowana mediana, min i max. Stary pomiar
 *   sekwencyjny zostaje w wyniku jako `sequentialInProcess` (do porownania, nie do decyzji).
 *   Dziecko uruchamiane z `--single-threaded-gc`: bez tej flagi tryb `geo` w swiezym procesie byl BIMODALNY
 *   (57,82 albo 67,01 MB, ~50/50, rownolegle znakowanie GC), z flaga 6/6 przebiegow = 67,0 MB.
 * Usage (z gra/, wymaga node_modules): node tools/memory-static-unit-merge-prototype.cjs <katalog tymczasowy poza repo> [REPS=5]
 */
const fs = require('fs');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const HEAP_CHILD = process.argv[2] === '--heap-child' ? process.argv[3] : null;
const TMP = HEAP_CHILD ? process.argv[4] : process.argv[2];
const REPS = HEAP_CHILD ? 1 : Math.max(1, parseInt(process.argv[3] || '5', 10));
if (!TMP) { console.error('podaj katalog tymczasowy'); process.exit(2); }
fs.mkdirSync(TMP, { recursive: true });
const SRC = path.join(GRA, 'src');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8')).map((u) => u.Jednostka).filter(Boolean);

const MERGE_TS = `
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
export function mergeStaticParts(root: THREE.Object3D): { before: number; after: number; mergedGeos: THREE.BufferGeometry[] } {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map<string, Array<{ mesh: THREE.Mesh; rel: THREE.Matrix4 }>>();
  let before = 0;
  root.traverse((o: any) => {
    if (!o.isMesh) return; before++;
    if (o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || o.children.length > 0) return;
    const rel = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
    if (rel.determinant() <= 0) return;
    const g = o.geometry as THREE.BufferGeometry;
    if (Object.keys(g.morphAttributes).length > 0) return; // grupy przy pojedynczym materiale sa ignorowane przez renderer
    const sig = Object.keys(g.attributes).sort().map((n) => n + (g.attributes[n] as any).itemSize).join(',') + (g.index ? 'I' : 'N');
    const key = o.material.id + '|' + o.renderOrder + '|' + o.castShadow + o.receiveShadow + o.frustumCulled + o.visible + '|' + sig;
    let b = buckets.get(key); if (!b) { b = []; buckets.set(key, b); } b.push({ mesh: o, rel });
  });
  const mergedGeos: THREE.BufferGeometry[] = [];
  for (const list of buckets.values()) {
    if (list.length < 2) continue;
    const geos = list.map(({ mesh, rel }) => { const c = (mesh.geometry as THREE.BufferGeometry).clone(); c.applyMatrix4(rel); return c; });
    const merged = mergeGeometries(geos, false);
    for (const g of geos) g.dispose();
    if (!merged) continue;
    const first = list[0]!.mesh;
    const m = new THREE.Mesh(merged, first.material);
    m.renderOrder = first.renderOrder; m.castShadow = first.castShadow; m.receiveShadow = first.receiveShadow;
    for (const { mesh } of list) mesh.parent!.remove(mesh);
    root.add(m);
    mergedGeos.push(merged);
  }
  // puste grupy posrednie
  const prune = (o: THREE.Object3D) => { for (const c of [...o.children]) { prune(c); if (!(c as any).isMesh && c.children.length === 0 && !(c as any).isSprite && c.type === 'Group') o.remove(c); } };
  prune(root);
  let after = 0; root.traverse((o: any) => { if (o.isMesh) after++; });
  return { before, after, mergedGeos };
}
`;

const NODE_ENTRY = `
export * as THREE from 'three';
export { buildUnitModel } from '${SRC}/render/units';
export { GeometryContentPool } from '${SRC}/render/geometryContentPool';
export { MaterialContentPool } from '${SRC}/render/materialContentPool';
export { mergeStaticParts } from './merge';
`;

const BROWSER_ENTRY = `
import * as THREE from 'three';
import { buildUnitModel } from '${SRC}/render/units';
import { GeometryContentPool } from '${SRC}/render/geometryContentPool';
import { MaterialContentPool, pooledMaterialOpaqueSort } from '${SRC}/render/materialContentPool';
import { mergeStaticParts } from './merge';
const UNITS: string[] = ${JSON.stringify(units)};
const CATS = ['melee', 'ranged', 'cavalry', 'siege', 'settler', 'worker', 'scout', 'naval', 'super', 'general'];
const W = 1600, H = 1000;
const b64 = (u: Uint8Array) => { let s = ''; const C = 0x8000; for (let i = 0; i < u.length; i += C) s += String.fromCharCode.apply(null, Array.from(u.subarray(i, i + C))); return btoa(s); };
(window as any).run = (merge: boolean) => {
  const out: any = {};
  const GP = new GeometryContentPool(); const MP = new MaterialContentPool();
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H); document.body.appendChild(renderer.domElement);
  renderer.setOpaqueSort(pooledMaterialOpaqueSort);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x203040);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1); sun.position.set(3, 8, 5); scene.add(sun);
  const specs: Array<() => THREE.Group> = [];
  for (const col of [0xd04040, 0x3060d0]) { for (const c of CATS) specs.push(() => buildUnitModel(c, col)); for (const n of UNITS) specs.push(() => buildUnitModel('melee', col, n)); }
  const COLS = 20; const ROWS = Math.ceil(specs.length / COLS); const CELL = 1.6;
  const cam = new THREE.OrthographicCamera(-COLS * CELL / 2, COLS * CELL / 2, ROWS * CELL / 2, -ROWS * CELL / 2, 0.1, 200);
  cam.position.set(0, 30, 30); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
  const ringGeo = new THREE.RingGeometry(0.5, 0.56, 6);
  const models: THREE.Group[] = [];
  let before = 0, after = 0;
  specs.forEach((fn, i) => {
    const grp = fn();
    const own = new THREE.MeshBasicMaterial({ color: (i % 2) ? 0xffcc00 : 0x00ccff, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, own); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; grp.add(ring);
    const mats = grp.userData['mats'] ?? []; mats.push(own);
    grp.userData['unitId'] = 'u' + i;
    const col = i % COLS; const row = Math.floor(i / COLS);
    grp.position.set((col - COLS / 2 + 0.5) * CELL, 0, (row - ROWS / 2 + 0.5) * CELL);
    scene.add(grp);
    GP.poolOwned(grp, grp.userData['perTokenGeos'] ?? []); MP.poolOwned(grp, mats);
    if (merge) { const r = mergeStaticParts(grp); before += r.before; after += r.after; GP.poolOwned(grp, r.mergedGeos); }
    models.push(grp);
  });
  out.meshesBefore = before; out.meshesAfter = after; out.models = models.length;
  scene.updateMatrixWorld(true);
  const gl = renderer.getContext();
  const grab = () => { scene.updateMatrixWorld(true); renderer.render(scene, cam); const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return b64(px); };
  const ray = new THREE.Raycaster();
  const pick = () => models.map((m) => {
    const p = new THREE.Vector3(); new THREE.Box3().setFromObject(m).getCenter(p); p.project(cam);
    ray.setFromCamera(new THREE.Vector2(p.x, p.y), cam);
    for (const h of ray.intersectObjects(models, true)) { let o: any = h.object; while (o) { if (o.userData.unitId) return o.userData.unitId; o = o.parent; } }
    return null;
  });
  out.idle = grab(); out.pickIdle = pick();
  for (const m of models) m.position.x += 0.37; // marsz: przesuniety korzen
  out.march = grab(); out.pickMarch = pick();
  for (const m of models) m.rotation.y = 0.6;   // atak: obrot korzenia ku celowi
  out.attack = grab();
  out.drawCalls = renderer.info.render.calls;
  return out;
};
`;

function diff(a, b) {
  const A = Buffer.from(a, 'base64'); const B = Buffer.from(b, 'base64');
  let d = 0; for (let i = 0; i < A.length; i += 4) if (A[i] !== B[i] || A[i + 1] !== B[i + 1] || A[i + 2] !== B[i + 2] || A[i + 3] !== B[i + 3]) d++;
  return d;
}

const LOADERS = { '.json': 'json', '.png': 'dataurl', '.jpg': 'dataurl', '.mp3': 'dataurl', '.svg': 'dataurl' };

(async () => {
  if (!HEAP_CHILD) {
    fs.writeFileSync(path.join(TMP, 'merge.ts'), MERGE_TS);
    await esbuild.build({ stdin: { contents: NODE_ENTRY, resolveDir: TMP, loader: 'ts' }, bundle: true, platform: 'node', format: 'cjs', outfile: path.join(TMP, 'n.cjs'), logLevel: 'error', nodePaths: [path.join(GRA, 'node_modules')], loader: LOADERS });
  }
  // ---- Czesc 1: Node, sterta
  const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (k === 'measureText' ? () => ({ width: 10 }) : (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern') ? () => ({ addColorStop() {} }) : (k === 'getImageData' ? (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) : () => {}))), set: (t, k, v) => { t[k] = v; return true; } });
  const mkCanvas = () => ({ width: 64, height: 64, style: {}, getContext: () => ctx, addEventListener() {}, toDataURL: () => '' });
  global.document = { createElement: (tag) => (tag === 'canvas' ? mkCanvas() : { style: {}, appendChild() {}, setAttribute() {} }), createElementNS: () => mkCanvas(), body: { appendChild() {} } };
  global.window = { devicePixelRatio: 1, addEventListener() {}, location: { search: '' } }; global.self = global.window;
  global.OffscreenCanvas = function (w, h) { return Object.assign(mkCanvas(), { width: w, height: h }); };
  const M = require(path.join(TMP, 'n.cjs')); const { THREE } = M;
  require('v8').setFlagsFromString('--expose-gc'); const gc = require('vm').runInNewContext('gc');
  const spaces = () => { const o = {}; for (const x of require('v8').getHeapSpaceStatistics()) o[x.space_name] = x.space_used_size; o.arrayBuffers = process.memoryUsage().arrayBuffers; return o; };
  const heap = () => { gc(); gc(); return process.memoryUsage().heapUsed + process.memoryUsage().arrayBuffers; };
  const N = 475;
  for (const n of units) M.buildUnitModel('melee', 0xff0000, n); // rozgrzewka singletonow
  const measure = (mode) => {
    const GP = new M.GeometryContentPool(); const MP = new M.MaterialContentPool();
    const h0 = heap(); const sp0 = spaces(); const toks = [];
    for (let i = 0; i < N; i++) {
      const g = M.buildUnitModel('melee', i % 2 ? 0xff0000 : 0x0000ff, units[i % units.length]);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.56, 6), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffcc00 : 0x00ccff, transparent: true, opacity: 0.6, depthWrite: false }));
      g.add(ring); g.userData.mats.push(ring.material);
      GP.poolOwned(g, g.userData.perTokenGeos || []);
      if (mode !== 'geo') MP.poolOwned(g, g.userData.mats);
      if (mode === 'merge') { const r = M.mergeStaticParts(g); GP.poolOwned(g, r.mergedGeos); }
      toks.push(g);
    }
    const h1 = heap(); const sp1 = spaces();
    const spaceDeltaMB = {}; for (const k of Object.keys(sp1)) spaceDeltaMB[k] = +((sp1[k] - (sp0[k] || 0)) / 1048576).toFixed(2);
    let obj = 0, mesh = 0; const mats = new Set();
    for (const t of toks) t.traverse((o) => { obj++; if (o.isMesh) { mesh++; mats.add(o.material); } });
    return { mode, heapMB: +((h1 - h0) / 1048576).toFixed(2), object3dPerToken: +(obj / N).toFixed(1), meshesPerToken: +(mesh / N).toFixed(1), uniqueMaterials: mats.size, keep: toks.length, spaceDeltaMB };
  };
  if (HEAP_CHILD) {
    const warm = measure(HEAP_CHILD); const r = measure(HEAP_CHILD); r.warmupHeapMB = warm.heapMB;
    console.log('CHILD ' + JSON.stringify(r)); return;
  }
  const rGeo = measure('geo'); const rMat = measure('mat'); const rMerge = measure('merge');
  const sequentialInProcess = { geo: rGeo.heapMB, mat: rMat.heapMB, merge: rMerge.heapMB,
    deltaMaterialsMB: +(rGeo.heapMB - rMat.heapMB).toFixed(2), deltaMergeMB: +(rMat.heapMB - rMerge.heapMB).toFixed(2) };
  // izolowany pomiar: swiezy proces na kazdy tryb, REPS powtorzen, rotowana kolejnosc
  const { execFileSync } = require('child_process');
  const MODES = ['geo', 'mat', 'merge']; const samples = { geo: [], mat: [], merge: [] }; const detail = {};
  for (let rep = 0; rep < REPS; rep++) {
    for (let k = 0; k < 3; k++) {
      const mode = MODES[(rep + k) % 3];
      const outTxt = execFileSync(process.execPath, ['--single-threaded-gc', __filename, '--heap-child', mode, TMP], { encoding: 'utf8', maxBuffer: 1 << 24 });
      const line = outTxt.split('\n').find((l) => l.startsWith('CHILD '));
      if (!line) throw new Error('brak wyniku dziecka ' + mode);
      const r = JSON.parse(line.slice(6)); samples[mode].push(r.heapMB); detail[mode] = r;
    }
  }
  const med = (a) => { const b = [...a].sort((x, y) => x - y); const n = b.length; return +((n % 2) ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2).toFixed(2); };
  const stat = (mode) => ({ medianMB: med(samples[mode]), minMB: Math.min(...samples[mode]), maxMB: Math.max(...samples[mode]), samples: samples[mode],
    object3dPerToken: detail[mode].object3dPerToken, meshesPerToken: detail[mode].meshesPerToken, uniqueMaterials: detail[mode].uniqueMaterials });
  const sGeo = stat('geo'), sMat = stat('mat'), sMerge = stat('merge');
  console.log('HEAP ' + JSON.stringify({ tokens: N, method: 'isolated-process-per-mode+single-threaded-gc', reps: REPS, geoOnly: sGeo, geoPlusMat: sMat, geoMatMerge: sMerge,
    deltaMaterialsMB: +(sGeo.medianMB - sMat.medianMB).toFixed(2), deltaMergeMB: +(sMat.medianMB - sMerge.medianMB).toFixed(2),
    deltaMergeVsGeoOnlyMB: +(sGeo.medianMB - sMerge.medianMB).toFixed(2), sequentialInProcess }));
  // ---- Czesc 2: Chromium, piksele + picking
  const res = await esbuild.build({ stdin: { contents: BROWSER_ENTRY, resolveDir: TMP, loader: 'ts' }, bundle: true, format: 'iife', write: false, logLevel: 'error', nodePaths: [path.join(GRA, 'node_modules')], loader: LOADERS });
  fs.writeFileSync(path.join(TMP, 'b.js'), res.outputFiles[0].text);
  fs.writeFileSync(path.join(TMP, 'index.html'), '<!doctype html><meta charset="utf-8"><body style="margin:0"><script src="b.js"></script>');
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined,
    args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const runMode = async (merge) => { const p = await browser.newPage({ viewport: { width: 1600, height: 1000 } }); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 200))); await p.goto('file://' + path.join(TMP, 'index.html')); const r = await p.evaluate((m) => window.run(m), merge); await p.close(); r.errs = errs; return r; };
    const A = await runMode(false); const B = await runMode(true);
    const out = { models: B.models, meshesBefore: B.meshesBefore, meshesAfter: B.meshesAfter, drawCalls: [A.drawCalls, B.drawCalls],
      diffIdle: diff(A.idle, B.idle), diffMarch: diff(A.march, B.march), diffAttack: diff(A.attack, B.attack), pixels: 1600 * 1000,
      pickSameIdle: JSON.stringify(A.pickIdle) === JSON.stringify(B.pickIdle), pickSameMarch: JSON.stringify(A.pickMarch) === JSON.stringify(B.pickMarch),
      pickHits: A.pickIdle.filter((v, i) => v === 'u' + i).length, errs: [...A.errs, ...B.errs] };
    console.log('PIXELS ' + JSON.stringify(out));
  } finally { await browser.close(); }
})();
