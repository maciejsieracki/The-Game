'use strict';
/**
 * map-models-scale-2x-test.cjs — R-WEB-MAP-MODELS-SCALE-2X-Q1
 *
 * Dowod, ze na mapie swiata skala wizerunkow (a) WSZYSTKICH zloz/surowcow oraz
 * (b) ulepszen FORT i POSTERUNEK jest 2x wzgledem stanu bazowego, a pozostale
 * ulepszenia maja 1x; pozycja podstawy (spod Y=0, srodek XZ) bez zmian.
 * Prawdziwy render w Chromium (WebGL): harness osadza zloza DOKLADNIE jak
 * main.ts:compactDepositAtEdge (1:1 kopia) i ulepszenia przez buildImprovementSectored.
 *
 * Stan bazowy = BASE_SRC (katalog src sprzed zmiany). Gdy brak BASE_SRC, baza jest
 * odtwarzana z `git archive` (BASE_REF; domyslnie HEAD gdy gra/src ma niezacommitowane
 * zmiany, inaczej HEAD~1).
 *
 * Uzycie z gra/:  node tools/map-models-scale-2x-test.cjs [--shots <katalog>]
 * Bundle poza repo: /dev/shm/<unikalna>. Bez npm run build/dev.
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const cp = require('child_process');

const GRA = path.resolve(__dirname, '..');
const REPO = path.resolve(GRA, '..');
const WORK = fs.mkdtempSync(path.join('/dev/shm', 'mms2x-'));
const shotsIdx = process.argv.indexOf('--shots');
const SHOTS = shotsIdx > 0 ? path.resolve(process.argv[shotsIdx + 1]) : null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

let passed = 0, failed = 0;
function assert(c, msg) { if (c) { passed++; console.log('PASS:', msg); } else { failed++; console.error('FAIL:', msg); } }
const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e * Math.max(1, Math.abs(b));

function baseSrc() {
  if (process.env.BASE_SRC) return path.resolve(process.env.BASE_SRC);
  const dirty = cp.execSync('git status --porcelain -- gra/src', { cwd: REPO }).toString().trim();
  const ref = process.env.BASE_REF || (dirty ? 'HEAD' : 'HEAD~1');
  const dir = path.join(WORK, 'base');
  fs.mkdirSync(dir, { recursive: true });
  cp.execSync(`git archive ${ref} gra/src gra/data | tar -x -C ${dir}`, { cwd: REPO, shell: '/bin/bash' });
  return path.join(dir, 'gra', 'src');
}

const HARNESS = (src) => `
import * as THREE from 'three';
import { HEX_R } from '${src}/render/hexutil';
import { buildStyledResourceOverlay } from '${src}/render/styleResources';
import { buildImprovementSectored } from '${src}/render/improvements';
import { Nakladka } from '${src}/types/hex';

const DEPOSIT_EDGE_R = 0.62, DEPOSIT_TARGET_SPAN = 0.55;
const DEPOSIT_EDGE_R_ELEVATED = 0.80, DEPOSIT_TARGET_SPAN_ELEVATED = 0.34;
/** 1:1 kopia main.ts:compactDepositAtEdge (bez reliefu: surfaceY=null) */
function compact(ov, x, z, baseY, rotY, elevated) {
  const edgeR = (elevated ? DEPOSIT_EDGE_R_ELEVATED : DEPOSIT_EDGE_R) * HEX_R;
  const targetSpan = elevated ? DEPOSIT_TARGET_SPAN_ELEVATED : DEPOSIT_TARGET_SPAN;
  const bb = new THREE.Box3().setFromObject(ov);
  if (!bb.isEmpty()) {
    const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
    const maxSpan = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) || 1;
    for (const ch of ov.children) { if (ch.geometry) ch.geometry.translate(-cx, 0, -cz); }
    const dds = ov.userData.depositDisplayScale || 1;
    ov.scale.setScalar(Math.min(0.6, (targetSpan * HEX_R) / maxSpan) * dds);
  }
  ov.position.set(x, baseY + 0.01, z - edgeR);
  ov.rotation.y = rotY;
}
function tile(x, z, col) {
  const s = new THREE.Shape();
  for (let i = 0; i < 6; i++) { const a = Math.PI / 2 + i * Math.PI / 3; const px = HEX_R * 0.985 * Math.cos(a), py = HEX_R * 0.985 * Math.sin(a); if (i) s.lineTo(px, py); else s.moveTo(px, py); }
  s.closePath();
  const m = new THREE.Mesh(new THREE.ShapeGeometry(s), new THREE.MeshLambertMaterial({ color: col }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0, z); return m;
}
const DEPOSITS = [
  ['konie', Nakladka.ZlozeKonia, undefined], ['owce', Nakladka.ZlozeOwiec, undefined],
  ['bydlo', Nakladka.ZlozeBydla, undefined], ['lama', Nakladka.ZlozeLamy, undefined],
  ['glina', Nakladka.ZlozeGliny, undefined], ['ruda', Nakladka.ZlozeRudy, undefined],
  ['miedz', Nakladka.Brak, 'miedz'], ['zelazo', Nakladka.Brak, 'zelazo'], ['wegiel', Nakladka.Brak, 'wegiel'],
  ['sol', Nakladka.Brak, 'sol'], ['zloto', Nakladka.Brak, 'zloto'], ['cyna', Nakladka.Brak, 'cyna'],
];
const IMPR = ['fort', 'posterunek', 'farma', 'tartak', 'kopalnia_miedzi', 'kamieniolom', 'oboz_lowiecki', 'glinianka', 'warzelnia_soli', 'stadnina', 'pastwisko', 'tarasy', 'droga'];
function metrics(g) {
  g.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(g);
  const c = new THREE.Vector3(); b.getCenter(c);
  return { minY: b.min.y, maxY: b.max.y, w: b.max.x - b.min.x, d: b.max.z - b.min.z, cx: c.x, cz: c.z, maxX: b.max.x, minX: b.min.x, maxZ: b.max.z, minZ: b.min.z };
}
const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
R.setSize(1000, 560); document.body.appendChild(R.domElement);
window.__measure = function () {
  const out = { deposits: {}, depositsElev: {}, impr: {} };
  DEPOSITS.forEach(([name, nak, z]) => {
    for (const el of [false, true]) {
      const ov = buildStyledResourceOverlay(nak, 'roblox', z);
      const dst = el ? out.depositsElev : out.deposits;
      if (!ov) { dst[name] = null; continue; }
      const dds = ov.userData.depositDisplayScale || 1;
      compact(ov, 0, 0, 0, 0, el);
      dst[name] = { dds, scale: ov.scale.x, m: metrics(ov) };
    }
  });
  for (const k of IMPR) out.impr[k] = metrics(buildImprovementSectored([k], 0xffd54a, undefined, HEX_R, {}, 63));
  return out;
};
window.__render = function (view) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9ec7e8);
  scene.add(new THREE.AmbientLight(0xffffff, 0.75)); const dl = new THREE.DirectionalLight(0xffffff, 0.9); dl.position.set(3, 8, 4); scene.add(dl);
  const cam = new THREE.PerspectiveCamera(50, 1000 / 560, 0.1, 100);
  let cells = [];
  if (view === 'deposits' || view === 'close') {
    DEPOSITS.forEach((d, i) => cells.push({ x: (i % 6) * 1.75 + (Math.floor(i / 6) % 2) * 0.87, z: Math.floor(i / 6) * 1.5, dep: d }));
  } else if (view === 'forts') {
    ['fort', 'posterunek', 'farma', 'tartak', 'kamieniolom', 'pastwisko'].forEach((k, i) => cells.push({ x: i * 1.75, z: 0, impr: [k] }));
  } else if (view === 'combo') {
    cells.push({ x: 0, z: 0, dep: DEPOSITS[0], impr: ['fort'], city: true });
    cells.push({ x: 1.75, z: 0, dep: DEPOSITS[10], impr: ['kopalnia_miedzi', 'posterunek'], city: true });
    cells.push({ x: 3.5, z: 0, dep: DEPOSITS[4], impr: ['glinianka', 'farma'] });
    cells.push({ x: 5.25, z: 0, dep: DEPOSITS[7], impr: ['droga'], city: true });
  }
  for (const c of cells) {
    scene.add(tile(c.x, c.z, 0x6f9a52));
    if (c.city) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.5), new THREE.MeshLambertMaterial({ color: 0xb04a3a })); m.position.set(c.x, 0.175, c.z); scene.add(m); }
    if (c.impr) { const g = buildImprovementSectored(c.impr, 0xffd54a, undefined, HEX_R, {}, 63); g.position.set(c.x, 0.01, c.z); scene.add(g); }
    if (c.dep) { const ov = buildStyledResourceOverlay(c.dep[1], 'roblox', c.dep[2]); if (ov) { compact(ov, c.x, c.z, 0.01, 0, false); scene.add(ov); } }
  }
  let tx, tz, dist;
  const el = 52 * Math.PI / 180;
  if (view === 'close') { tx = cells[0].x; tz = cells[0].z - 0.3; dist = 3.0; }
  else {
    const xs = cells.map((c) => c.x), zs = cells.map((c) => c.z);
    tx = (Math.min(...xs) + Math.max(...xs)) / 2; tz = (Math.min(...zs) + Math.max(...zs)) / 2;
    dist = Math.max(Math.max(...xs) - Math.min(...xs) + 2.2, (Math.max(...zs) - Math.min(...zs) + 2) * 1.8) * 0.95;
  }
  cam.position.set(tx, Math.sin(el) * dist, tz + Math.cos(el) * dist); cam.lookAt(tx, 0, tz);
  R.render(scene, cam);
  const t0 = performance.now(); for (let i = 0; i < 20; i++) R.render(scene, cam); R.getContext().finish();
  return { frameMs: (performance.now() - t0) / 20 };
};
`;

function bundle(name, src) {
  const entry = path.join(WORK, name + '-entry.ts');
  fs.writeFileSync(entry, HARNESS(src));
  const out = path.join(WORK, name + '.js');
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'browser', format: 'iife', outfile: out, absWorkingDir: GRA, nodePaths: [path.join(GRA, 'node_modules')], logLevel: 'silent' });
  const html = path.join(WORK, name + '.html');
  fs.writeFileSync(html, `<!doctype html><meta charset=utf-8><body style="margin:0"><script src="${name}.js"></script>`);
  return html;
}

(async () => {
  const { chromium } = require('playwright');
  const cur = bundle('cur', path.join(GRA, 'src'));
  const base = bundle('base', baseSrc());
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const res = {};
  for (const [tag, html] of [['base', base], ['cur', cur]]) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 560 } });
    const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
    await page.goto('file://' + html);
    res[tag] = { m: await page.evaluate(() => window.__measure()), perf: {}, errs };
    for (const v of ['deposits', 'forts', 'combo', 'close']) {
      res[tag].perf[v] = (await page.evaluate((vv) => window.__render(vv), v)).frameMs;
      if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${tag === 'base' ? 'przed' : 'po'}-${v}.png`) });
    }
    await page.close();
  }
  await browser.close();
  assert(res.base.errs.length === 0 && res.cur.errs.length === 0, 'brak bledow strony (base/cur): ' + JSON.stringify([res.base.errs, res.cur.errs]));

  for (const el of ['deposits', 'depositsElev']) {
    for (const k of Object.keys(res.base.m[el])) {
      const b = res.base.m[el][k], c = res.cur.m[el][k];
      if (!b || !c) { assert(!b && !c, `${el}/${k}: oba null`); continue; }
      assert(near(c.dds, 2 * b.dds), `${el}/${k}: depositDisplayScale ${b.dds} -> ${c.dds} (2x)`);
      assert(near(c.scale, 2 * b.scale), `${el}/${k}: skala koncowa ${b.scale.toFixed(4)} -> ${c.scale.toFixed(4)} (2x)`);
      assert(near(c.m.w, 2 * b.m.w, 1e-4) && near(c.m.maxY - c.m.minY, 2 * (b.m.maxY - b.m.minY), 1e-4), `${el}/${k}: wymiary bbox 2x (${b.m.w.toFixed(3)} -> ${c.m.w.toFixed(3)})`);
      // pozycja podstawy (origin grupy: y=baseY+0.01, XZ=srodek heksu-edgeR) jest ustawiana w compact() i nie zalezy od skali;
      // wlasny spod modelu (offset wzgledem origin) skaluje sie proporcjonalnie => (minY-0.01) rosnie 2x, model nie zawisa ani nie tonie
      assert(near(c.m.minY - 0.01, 2 * (b.m.minY - 0.01), 1e-4) && c.m.minY > -0.05 && c.m.minY < 0.05, `${el}/${k}: uziemienie proporcjonalne (minY ${b.m.minY.toFixed(4)} -> ${c.m.minY.toFixed(4)}), origin bez zmian`);
      assert(near(c.m.cx, 2 * b.m.cx, 1e-4) || Math.abs(c.m.cx) < 1e-6, `${el}/${k}: srodek XZ modelu wzgledem origin skaluje sie proporcjonalnie (cx ${b.m.cx.toFixed(4)} -> ${c.m.cx.toFixed(4)})`);
    }
  }
  for (const k of Object.keys(res.base.m.impr)) {
    const b = res.base.m.impr[k], c = res.cur.m.impr[k];
    const f = (k === 'fort' || k === 'posterunek') ? 2 : 1;
    assert(near(c.w, f * b.w, 1e-4) && near(c.d, f * b.d, 1e-4) && near(c.maxY - c.minY, f * (b.maxY - b.minY), 1e-4), `ulepszenie ${k}: wymiary ${f}x (w ${b.w.toFixed(3)} -> ${c.w.toFixed(3)})`);
    assert(near(c.minY, f * b.minY, 1e-4) && c.minY > -0.05, `ulepszenie ${k}: uziemienie minY ${b.minY.toFixed(4)} -> ${c.minY.toFixed(4)} (proporcjonalne ${f}x, origin bez zmian)`);
    if (f === 2) {
      const maxR = Math.max(...[[c.minX, c.minZ], [c.minX, c.maxZ], [c.maxX, c.minZ], [c.maxX, c.maxZ]].map(([x, z]) => Math.hypot(x, z)));
      assert(maxR <= 1.0 + 1e-6, `ulepszenie ${k}: bbox miesci sie w promieniu heksa (R=${maxR.toFixed(3)} <= 1.0)`);
    }
  }
  for (const v of Object.keys(res.base.perf)) {
    const b = res.base.perf[v], c = res.cur.perf[v];
    console.log(`INFO: czas klatki (swiftshader, srednia 20 klatek) ${v}: przed ${b.toFixed(2)} ms, po ${c.toFixed(2)} ms`);
    assert(c <= b * 1.5 + 2, `wydajnosc ${v}: po (${c.toFixed(2)} ms) bez znaczacego spadku wzgledem przed (${b.toFixed(2)} ms)`);
  }
  fs.rmSync(WORK, { recursive: true, force: true });
  console.log(`\nWYNIK: ${passed} PASS, ${failed} FAIL`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
