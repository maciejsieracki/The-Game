'use strict';
/**
 * map-models-scale-2x-test.cjs — R-WEB-MAP-MODELS-SCALE-2X-Q1 (R1 + obrona R2)
 *
 * Dowod, ze na mapie swiata skala wizerunkow (a) WSZYSTKICH zloz/surowcow oraz
 * (b) ulepszen FORT i POSTERUNEK jest 2x wzgledem stanu bazowego, a pozostale
 * ulepszenia maja 1x; pozycja podstawy bez zmian. Prawdziwy render w Chromium (WebGL).
 *
 * R2: harness NIE trzyma kopii compactDepositAtEdge — stale DEPOSIT_* i funkcja sa WYCINANE
 * z faktycznego gra/src/main.ts (biezacego i bazowego) i kompilowane do bundla, wiec zmiana
 * tej funkcji w main.ts jest widoczna dla testu. Uzywane tez prawdziwe collapseToMergedMesh
 * (prog OVERLAY_COLLAPSE_MIN_MESHES z main.ts) i reliefSurfaceSampler. Metryki wierzcholkowe
 * (wystawanie poza heks, odleglosc od srodka, od sasiadow), mapa przegladowa z duza liczba
 * zloz (czas klatki: mediana z powtorzen naprzemiennych base/cur + renderer.info).
 *
 * Stan bazowy = BASE_SRC albo `git archive` (BASE_REF; domyslnie HEAD gdy gra/src brudne, inaczej HEAD~1).
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
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

function baseSrc() {
  if (process.env.BASE_SRC) return path.resolve(process.env.BASE_SRC);
  const dirty = cp.execSync('git status --porcelain -- gra/src', { cwd: REPO }).toString().trim();
  const ref = process.env.BASE_REF || (dirty ? 'HEAD' : 'HEAD~1');
  const dir = path.join(WORK, 'base');
  fs.mkdirSync(dir, { recursive: true });
  cp.execSync(`git archive ${ref} gra/src gra/data | tar -x -C ${dir}`, { cwd: REPO, shell: '/bin/bash' });
  return path.join(dir, 'gra', 'src');
}

/** Wycina z main.ts stale DEPOSIT_* + compactDepositAtEdge + prog collapse. edgeOverride: tylko do wariantow informacyjnych. */
function extractSnippet(src, edgeOverride) {
  const main = fs.readFileSync(path.join(src, 'main.ts'), 'utf8');
  const a = main.indexOf('const DEPOSIT_EDGE_R = ');
  const b = main.indexOf('/** Epoka gracza dla widoczności złóż metali');
  if (a < 0 || b < 0 || b < a) throw new Error('nie znaleziono compactDepositAtEdge w main.ts');
  let snip = main.slice(a, b);
  if (edgeOverride !== undefined) snip = snip.replace(/const DEPOSIT_EDGE_R = [0-9.]+;/, `const DEPOSIT_EDGE_R = ${edgeOverride};`);
  const m = main.match(/const OVERLAY_COLLAPSE_MIN_MESHES = (\d+);/);
  if (!m) throw new Error('brak OVERLAY_COLLAPSE_MIN_MESHES w main.ts');
  return `const OVERLAY_COLLAPSE_MIN_MESHES = ${m[1]};\n${snip}`;
}

const HARNESS = (src, snippet) => `
import * as THREE from 'three';
import { HEX_R } from '${src}/render/hexutil';
import { buildStyledResourceOverlay } from '${src}/render/styleResources';
import { buildImprovementSectored } from '${src}/render/improvements';
import { Nakladka, TerenBazowy } from '${src}/types/hex';
import { collapseToMergedMesh, countMeshesInGroup } from '${src}/render/mergeDecor';
import { reliefSurfaceSampler } from '${src}/render/mapRenderStyle';

${snippet}
const SEED = 1234, SQ3 = Math.sqrt(3);
function place(ov, x, z, baseY, rotY, mode, q, r) {
  if (countMeshesInGroup(ov) >= OVERLAY_COLLAPSE_MIN_MESHES) collapseToMergedMesh(ov); // jak main.ts:maybeCollapseResourceOverlay
  const surf = mode === 'flat' ? null : reliefSurfaceSampler(mode === 'hill' ? TerenBazowy.Wzgorza : TerenBazowy.Gory, q, r, SEED, HEX_R);
  compactDepositAtEdge(ov, x, z, baseY, rotY, surf);
  ov.matrixAutoUpdate = false; ov.updateMatrix();
}
function tile(x, z, col) { // pointy-top, jak hexutil (wierzcholki na osi Z)
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
const NB = [0, 1, 2, 3, 4, 5].map((k) => [SQ3 * Math.cos(k * Math.PI / 3), SQ3 * Math.sin(k * Math.PI / 3)]);
function metrics(g) {
  g.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(g);
  const c = new THREE.Vector3(); b.getCenter(c);
  // wierzcholkowo: wystawanie poza heks (pointy-top: normalne krawedzi co 60 st., apothem=HEX_R*sqrt3/2)
  let outside = -Infinity, minCentre = Infinity, minNb = Infinity; const v = new THREE.Vector3();
  g.traverse((o) => {
    if (!o.isMesh) return; const pos = o.geometry.getAttribute('position'); if (!pos) return;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      const x = v.x, z = v.z;
      for (let k = 0; k < 6; k++) outside = Math.max(outside, x * Math.cos(k * Math.PI / 3) + z * Math.sin(k * Math.PI / 3) - HEX_R * SQ3 / 2);
      minCentre = Math.min(minCentre, Math.hypot(x, z));
      for (const [nx, nz] of NB) minNb = Math.min(minNb, Math.hypot(x - nx, z - nz));
    }
  });
  return { minY: b.min.y, maxY: b.max.y, w: b.max.x - b.min.x, d: b.max.z - b.min.z, cx: c.x, cz: c.z, maxX: b.max.x, minX: b.min.x, maxZ: b.max.z, minZ: b.min.z, outside, minCentre, minNb, posY: g.position.y };
}
const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
R.setSize(1000, 560); document.body.appendChild(R.domElement);
window.__measure = function () {
  const out = { deposits: {}, hill: {}, mount: {}, impr: {}, edgeR: DEPOSIT_EDGE_R };
  DEPOSITS.forEach(([name, nak, z]) => {
    for (const mode of ['flat', 'hill', 'mount']) {
      const ov = buildStyledResourceOverlay(nak, 'roblox', z);
      const dst = mode === 'flat' ? out.deposits : out[mode];
      if (!ov) { dst[name] = null; continue; }
      const dds = ov.userData.depositDisplayScale || 1;
      place(ov, 0, 0, 0, 0, mode, 3, 2);
      dst[name] = { dds, scale: ov.scale.x, m: metrics(ov) };
    }
  });
  for (const k of IMPR) out.impr[k] = metrics(buildImprovementSectored([k], 0xffd54a, undefined, HEX_R, {}, 63));
  return out;
};
const hexPos = (q, r) => ({ x: HEX_R * SQ3 * (q + r / 2), z: HEX_R * 1.5 * r });
const city = (scene, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.5), new THREE.MeshLambertMaterial({ color: 0xb04a3a })); m.position.set(x, 0.175, z); scene.add(m); };
function mkScene() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9ec7e8);
  scene.add(new THREE.AmbientLight(0xffffff, 0.75)); const dl = new THREE.DirectionalLight(0xffffff, 0.9); dl.position.set(3, 8, 4); scene.add(dl);
  return scene;
}
const COLS = [0x6f9a52, 0x7aa85c, 0x5f8a48, 0x86b266];
function frame(scene, tx, tz, dist, elDeg) {
  const cam = new THREE.PerspectiveCamera(50, 1000 / 560, 0.1, 400);
  const el = elDeg * Math.PI / 180;
  cam.position.set(tx, Math.sin(el) * dist, tz + Math.cos(el) * dist); cam.lookAt(tx, 0, tz);
  R.render(scene, cam); return cam;
}
function timeIt(scene, cam, n) { const t = []; for (let i = 0; i < n; i++) { const t0 = performance.now(); R.render(scene, cam); R.getContext().finish(); t.push(performance.now() - t0); } return t; }
function build(view) {
  const scene = mkScene(); let tx = 0, tz = 0, dist = 5, el = 52;
  const cluster = (dep, mode, withCity, impr) => {
    for (const [q, r] of [[0, 0], [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]]) { const p = hexPos(q, r); scene.add(tile(p.x, p.z, COLS[(q * 3 + r * 5 + 8) % 4])); }
    if (withCity) { city(scene, 0, 0); const p = hexPos(0, -1); city(scene, p.x, p.z); }
    if (impr) { const g = buildImprovementSectored(impr, 0xffd54a, undefined, HEX_R, {}, 63); g.position.set(0, 0.01, 0); scene.add(g); }
    const ov = buildStyledResourceOverlay(dep[1], 'roblox', dep[2]); if (ov) { place(ov, 0, 0, 0.01, 0, mode, 3, 2); scene.add(ov); }
    dist = 4.2; el = 55;
  };
  const row = (items, f) => {
    const px = (i) => (i % 6) * 1.9 + (Math.floor(i / 6) % 2) * 0.95, pz = (i) => Math.floor(i / 6) * 1.7;
    items.forEach((it, i) => f(it, px(i), pz(i)));
    const xs = items.map((_, i) => px(i)), zs = items.map((_, i) => pz(i));
    tx = (Math.min(...xs) + Math.max(...xs)) / 2; tz = (Math.min(...zs) + Math.max(...zs)) / 2;
    dist = Math.max(Math.max(...xs) - Math.min(...xs) + 2.4, (Math.max(...zs) - Math.min(...zs) + 2.2) * 1.8) * 0.95;
  };
  const dep = (names) => names.map((n) => DEPOSITS.find((d) => d[0] === n));
  const depCell = (d, x, z, mode) => { scene.add(tile(x, z, 0x6f9a52)); const ov = buildStyledResourceOverlay(d[1], 'roblox', d[2]); if (ov) { place(ov, x, z, 0.01, 0, mode, 3, 2); scene.add(ov); } };
  if (view === 'horse') cluster(DEPOSITS[0], 'flat', true);
  else if (view === 'ores') row(dep(['miedz', 'zelazo', 'wegiel', 'zloto', 'cyna', 'ruda']), (d, x, z) => depCell(d, x, z, 'flat'));
  else if (view === 'saltclay') row(dep(['sol', 'glina', 'owce', 'bydlo', 'lama', 'konie']), (d, x, z) => depCell(d, x, z, 'flat'));
  else if (view === 'forts') row(['fort', 'posterunek', 'farma', 'tartak', 'kamieniolom', 'pastwisko'], (k, x, z) => { scene.add(tile(x, z, 0x6f9a52)); const g = buildImprovementSectored([k], 0xffd54a, undefined, HEX_R, {}, 63); g.position.set(x, 0.01, z); scene.add(g); });
  else if (view === 'combo') cluster(DEPOSITS[10], 'flat', true, ['kopalnia_miedzi', 'posterunek']);
  else if (view === 'overview') { // mapa przegladowa: 31x31 = 961 heksow, zloze na kazdym
    const N = 31; let n = 0;
    for (let r = 0; r < N; r++) for (let q = -Math.floor(r / 2); q < N - Math.floor(r / 2); q++) {
      const p = hexPos(q, r); scene.add(tile(p.x, p.z, COLS[(q * 3 + r * 5 + 400) % 4]));
      const d = DEPOSITS[n++ % DEPOSITS.length]; const ov = buildStyledResourceOverlay(d[1], 'roblox', d[2]);
      if (ov) { place(ov, p.x, p.z, 0.01, q * 1.3 + r * 0.7, 'flat', q, r); scene.add(ov); }
      if (n % 9 === 0) { const g = buildImprovementSectored([n % 18 === 0 ? 'fort' : 'posterunek'], 0xffd54a, undefined, HEX_R, {}, 63); g.position.set(p.x, 0.01, p.z); scene.add(g); }
    }
    const c = hexPos(15, 15); tx = c.x; tz = c.z; dist = 62; el = 70;
  }
  return { scene, cam: frame(scene, tx, tz, dist, el) };
}
window.__shot = function (view) { build(view); };
window.__perf = function (view) {
  const { cam, scene } = build(view);
  timeIt(scene, cam, 5);
  const reps = []; for (let i = 0; i < 6; i++) reps.push(timeIt(scene, cam, 15).sort((a, b) => a - b)[7]);
  R.info.reset(); R.render(scene, cam);
  return { ms: reps, calls: R.info.render.calls, tris: R.info.render.triangles, objs: scene.children.length };
};
`;

function bundle(name, src, edge) {
  const entry = path.join(WORK, name + '-entry.ts');
  fs.writeFileSync(entry, HARNESS(src, extractSnippet(src, edge)));
  const out = path.join(WORK, name + '.js');
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'browser', format: 'iife', outfile: out, absWorkingDir: GRA, nodePaths: [path.join(GRA, 'node_modules')], logLevel: 'silent' });
  const html = path.join(WORK, name + '.html');
  fs.writeFileSync(html, `<!doctype html><meta charset=utf-8><body style="margin:0"><script src="${name}.js"></script>`);
  return html;
}

(async () => {
  const { chromium } = require('playwright');
  const curSrc = path.join(GRA, 'src'), bSrc = baseSrc();
  // main.ts: logika kompaktowania zlozy NIE zmieniona wzgledem bazy (zmiana skali tylko przez depositDisplayScale)
  assert(extractSnippet(curSrc) === extractSnippet(bSrc), 'main.ts: compactDepositAtEdge + DEPOSIT_* identyczne z baza (zmiana skali nie dotyka main.ts)');
  const cur = bundle('cur', curSrc), base = bundle('base', bSrc);
  const variants = {}; // informacyjne: inne DEPOSIT_EDGE_R (propozycja korekty kolizji)
  for (const e of [0.5, 0.4]) variants[e] = bundle('cur-e' + e, curSrc, e);
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const res = { base: { errs: [] }, cur: { errs: [] } };
  const pages = {};
  for (const [tag, html] of [['base', base], ['cur', cur]]) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 560 } });
    page.on('pageerror', (e) => res[tag].errs.push(String(e)));
    await page.goto('file://' + html, { timeout: 180000 });
    res[tag].m = await page.evaluate(() => window.__measure());
    pages[tag] = page;
    for (const v of ['horse', 'ores', 'saltclay', 'forts', 'combo', 'overview']) {
      await page.evaluate((vv) => { window.__shot(vv); }, v);
      if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `r2-${tag === 'base' ? 'przed' : 'po'}-${v}.png`) });
    }
  }
  // wydajnosc: naprzemiennie base/cur (3 serie), overview 961 zloz
  const perf = { base: { ms: [] }, cur: { ms: [] } };
  for (let round = 0; round < 3; round++) for (const tag of ['base', 'cur']) {
    const p = await pages[tag].evaluate(() => window.__perf('overview'));
    perf[tag].ms.push(...p.ms); perf[tag].calls = p.calls; perf[tag].tris = p.tris; perf[tag].objs = p.objs;
  }
  for (const tag of ['base', 'cur']) await pages[tag].close();
  // warianty informacyjne EDGE_R
  const varRes = {};
  for (const [e, html] of Object.entries(variants)) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 560 } });
    await page.goto('file://' + html, { timeout: 180000 });
    varRes[e] = await page.evaluate(() => window.__measure());
    if (SHOTS) { await page.evaluate(() => window.__shot('horse')); await page.screenshot({ path: path.join(SHOTS, `r2-propozycja-edge${e}-horse.png`) }); }
    await page.close();
  }
  await browser.close();
  assert(res.base.errs.length === 0 && res.cur.errs.length === 0, 'brak bledow strony (base/cur): ' + JSON.stringify([res.base.errs, res.cur.errs]));

  for (const el of ['deposits', 'hill', 'mount']) {
    for (const k of Object.keys(res.base.m[el])) {
      const b = res.base.m[el][k], c = res.cur.m[el][k];
      if (!b || !c) { assert(!b && !c, `${el}/${k}: oba null`); continue; }
      assert(near(c.dds, 2 * b.dds), `${el}/${k}: depositDisplayScale ${b.dds} -> ${c.dds} (2x)`);
      assert(near(c.scale, 2 * b.scale), `${el}/${k}: skala koncowa ${b.scale.toFixed(4)} -> ${c.scale.toFixed(4)} (2x)`);
      assert(near(c.m.w, 2 * b.m.w, 1e-4) && near(c.m.maxY - c.m.minY, 2 * (b.m.maxY - b.m.minY), 1e-4), `${el}/${k}: wymiary bbox 2x (${b.m.w.toFixed(3)} -> ${c.m.w.toFixed(3)})`);
      // uziemienie: spod modelu wzgledem origin (posY) skaluje sie 2x; model nie zapada sie ponizej origin ani nie wisi
      assert(near(c.m.minY - c.m.posY, 2 * (b.m.minY - b.m.posY), 1e-4) && c.m.minY >= c.m.posY - 0.05 && c.m.minY <= c.m.posY + 0.05,
        `${el}/${k}: uziemienie proporcjonalne (minY-origin ${(b.m.minY - b.m.posY).toFixed(4)} -> ${(c.m.minY - c.m.posY).toFixed(4)}), brak zawieszenia/zapadniecia`);
      if (el === 'deposits') assert(near(c.m.posY, b.m.posY, 1e-9), `${el}/${k}: pozycja podstawy (origin Y) bez zmian (${c.m.posY})`);
      if (el !== 'deposits') assert(c.m.minY >= -1e-3, `${el}/${k}: na wzgorzu/gorze spod nie ponizej plaszczyzny heksa (Y>=0) (minY ${c.m.minY.toFixed(3)})`);
      assert(near(c.m.cx, 2 * b.m.cx, 1e-4) || Math.abs(c.m.cx) < 1e-6, `${el}/${k}: srodek XZ modelu skaluje sie proporcjonalnie (cx ${b.m.cx.toFixed(4)} -> ${c.m.cx.toFixed(4)})`);
    }
  }
  for (const k of Object.keys(res.base.m.impr)) {
    const b = res.base.m.impr[k], c = res.cur.m.impr[k];
    const f = (k === 'fort' || k === 'posterunek') ? 2 : 1;
    assert(near(c.w, f * b.w, 1e-4) && near(c.d, f * b.d, 1e-4) && near(c.maxY - c.minY, f * (b.maxY - b.minY), 1e-4), `ulepszenie ${k}: wymiary ${f}x (w ${b.w.toFixed(3)} -> ${c.w.toFixed(3)})`);
    assert(near(c.minY, f * b.minY, 1e-4) && c.minY > -0.05, `ulepszenie ${k}: uziemienie minY ${b.minY.toFixed(4)} -> ${c.minY.toFixed(4)} (proporcjonalne ${f}x, origin bez zmian)`);
    if (f === 2) assert(c.outside <= 1e-6 && c.minCentre > 0, `ulepszenie ${k}: wszystkie wierzcholki w obrebie heksa (wystawanie ${c.outside.toFixed(3)} <= 0, baza ${b.outside.toFixed(3)})`);
  }
  // kolizja wizualna zloz (wierzcholkowo, jednostki = HEX_R): INFO + twarde progi
  console.log('INFO: kolizja zloz — wystawanie poza heks (max po wierzcholkach; <=0 = w srodku), odleglosc od srodka heksu (miasto), od srodka sasiada');
  console.log('INFO: DEPOSIT_EDGE_R (main.ts) =', res.cur.m.edgeR);
  let worstOut = -Infinity, worstName = '';
  for (const el of ['deposits', 'hill', 'mount']) for (const k of Object.keys(res.cur.m[el])) {
    const b = res.base.m[el][k], c = res.cur.m[el][k]; if (!b || !c) continue;
    if (c.m.outside > worstOut) { worstOut = c.m.outside; worstName = el + '/' + k; }
    console.log(`INFO: ${el}/${k}: wystaje ${b.m.outside.toFixed(3)} -> ${c.m.outside.toFixed(3)}; od srodka ${b.m.minCentre.toFixed(3)} -> ${c.m.minCentre.toFixed(3)}; od sasiada ${b.m.minNb.toFixed(3)} -> ${c.m.minNb.toFixed(3)}`);
    assert(c.m.minNb > 0.25, `${el}/${k}: zloze nie siega srodka sasiedniego heksu (miasto/jednostka sasiada): min odl. ${c.m.minNb.toFixed(3)} > 0.25`);
  }
  console.log(`INFO: najwieksze wystawanie poza heks po x2: ${worstOut.toFixed(3)} HEX_R (${worstName}) — kosmetyka do decyzji (DEPOSIT_EDGE_R w main.ts poza allowlista)`);
  for (const [e, m] of Object.entries(varRes)) {
    const all = ['deposits', 'hill', 'mount'].flatMap((el) => Object.values(m[el]).filter(Boolean));
    console.log(`INFO: propozycja DEPOSIT_EDGE_R=${e}: najwieksze wystawanie ${Math.max(...all.map((x) => x.m.outside)).toFixed(3)}, min odl. od srodka heksu ${Math.min(...all.map((x) => x.m.minCentre)).toFixed(3)} (NIE zastosowano w main.ts)`);
  }
  // wydajnosc: mapa przegladowa 961 heksow ze zlozem
  const mb = Math.min(...perf.base.ms), mc = Math.min(...perf.cur.ms), medB = median(perf.base.ms), medC = median(perf.cur.ms);
  console.log(`INFO: mapa przegladowa (961 zloz + forty/posterunki), ${perf.cur.ms.length} serii x 15 klatek (swiftshader, maszyna wspoldzielona): MIN przed ${mb.toFixed(2)} ms, po ${mc.toFixed(2)} ms; mediana przed ${medB.toFixed(2)}, po ${medC.toFixed(2)}; draw calls ${perf.base.calls} -> ${perf.cur.calls}; trojkaty ${perf.base.tris} -> ${perf.cur.tris}; obiekty sceny ${perf.base.objs} -> ${perf.cur.objs}`);
  assert(perf.base.calls === perf.cur.calls && perf.base.objs === perf.cur.objs, `instancing/draw calls bez zmian (draw calls ${perf.base.calls} -> ${perf.cur.calls}, obiekty ${perf.base.objs} -> ${perf.cur.objs})`);
  assert(perf.base.tris === perf.cur.tris, `liczba trojkatow bez zmian (${perf.base.tris} -> ${perf.cur.tris}) — skala nie zmienia geometrii`);
  assert(mc <= mb * 1.25 + 1, `czas klatki (min z serii) po (${mc.toFixed(2)} ms) <= 1.25x przed (${mb.toFixed(2)} ms) + 1 ms`);
  fs.rmSync(WORK, { recursive: true, force: true });
  console.log(`\nWYNIK: ${passed} PASS, ${failed} FAIL`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
