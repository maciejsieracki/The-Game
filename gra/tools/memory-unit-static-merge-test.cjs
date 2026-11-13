'use strict';
/**
 * memory-unit-static-merge-test.cjs -- R-WEB-MEMORY-UNIT-STATIC-MERGE-Q1: scalenie statycznych czesci zetonow
 * jednostek w PRAWDZIWYM `UnitRenderer` (Chromium + WebGL swiftshader, prawdziwe buildery, pierscienie wlasciciela
 * i wojny, tabliczki statystyk, sortowanie `pooledMaterialOpaqueSort` jak w scene.ts).
 *
 * Dwie SWIEZE strony buduja te sama scene: A = `UnitRenderer.staticMerge = false` (stan sprzed tematu),
 * B = scalenie wlaczone (produkcja). Zetony: wszystkie kategorie + wszystkie nazwy z gra/data/units.json,
 * wlasciciel 0 (wlasny) i 1 (wrogi) -- 194 zetony.
 *   S1 -- scalenie dziala: meshe w zetonach B < 40% A (pomiar; wylaczenie scalenia => FAIL);
 *   S2 -- draw calls B < 40% A;
 *   S3 -- obraz: stanie / marsz (przesuniety korzen, setTokenWorldPosition) / atak (wypad ku sasiedniemu heksowi)
 *         rozne piksele RGBA A vs B <= LIMIT (domyslnie 120 z 1,6 mln, decyzja wlasciciela ~100);
 *   S4 -- picking (`pickUnitIdAt` w srodek kazdego zetonu): ten sam wynik A i B w staniu i marszu, >= 95% trafien;
 *   S3b -- to samo w zblizeniu (5 zetonow na cala klatke) + stan przyciemniony;
 *   S5 -- przyciemnienie odroczenia (co 3. zeton, tworzony W oknie odroczenia jak w grze): przyciemnione B maja
 *         wszystkie materialy przezroczyste, inne zetony nietkniete; A vs B przyciemnione <= LIMIT (zeton przyciemniony
 *         jest celowo NIESCALONY); po zdjeciu ("kolor wraca"): ten sam obiekt zetonu (uuid, bez przebudowy), scalony
 *         w miejscu (liczba meshy == baza B), klatka vs baza <= LIMIT, picking jak w bazie;
 *   S6 -- LOD drobnych czesci: dla kazdego oddalenia liczba schowanych CZESCI w B == A (ten sam zestaw progow),
 *         przy duzym oddaleniu cos schowane; klatka z LOD A vs B <= LIMIT; picking w stanie LOD == bez LOD;
 *         powrot do zblizenia => klatka B == klatka B bazowa (0 px);
 *   S7 -- przebudowa zetonu (zmiana wlasciciela => inny pierscien) i usuniecie wszystkich: bez wyjatku, pule puste.
 * Usage (z gra/, wymaga node_modules): node tools/memory-unit-static-merge-test.cjs [--shots <katalog>] [--limit 120]
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const argv = process.argv;
const opt = (n) => (argv.indexOf('--' + n) !== -1 ? argv[argv.indexOf('--' + n) + 1] : null);
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
const SHOTS = opt('shots');
const LIMIT = Number(opt('limit') || '120');
let pass = 0; let fail = 0;
const ok = (label, cond, detail) => { if (cond) { pass++; console.log('  OK  ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); } else { fail++; console.error(' FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); } };

const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8')).map((u) => u.Jednostka).filter(Boolean);
const SRC = path.join(GRA, 'src');
const entry = `
import * as THREE from 'three';
import { UnitRenderer } from '${SRC}/render/units';
import { pooledMaterialOpaqueSort } from '${SRC}/render/materialContentPool';
import { axialToWorld, HEX_R } from '${SRC}/render/hexutil';
const UNITS: string[] = ${JSON.stringify(units)};
const CATS = ['melee', 'ranged', 'cavalry', 'siege', 'settler', 'worker', 'scout', 'naval', 'super', 'general'];
const W = 1600, H = 1000, COLS = 20;
const b64 = (u: Uint8Array) => { let s = ''; const C = 0x8000; for (let i = 0; i < u.length; i += C) s += String.fromCharCode.apply(null, Array.from(u.subarray(i, i + C))); return btoa(s); };
function makeHex(q: number, r: number): any {
  return { coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
    wioska: { jest: false, ludnosc: 0 }, widocznosc: {}, rzeka: { krawedzie: [] } };
}
(window as any).run = (merge: boolean) => {
  (UnitRenderer as any).staticMerge = merge;
  const out: any = { merge };
  const specs: Array<{ cat: string; typeId: string; owner: number }> = [];
  for (const owner of [0, 1]) { for (const c of CATS) specs.push({ cat: c, typeId: '', owner }); for (const n of UNITS) specs.push({ cat: 'melee', typeId: n, owner }); }
  const ROWS = Math.ceil(specs.length / COLS);
  const hexes: Record<string, any> = {};
  const cells: Array<{ q: number; r: number }> = [];
  for (let row = 0; row < ROWS + 1; row++) for (let col = 0; col < COLS + 1; col++) {
    const q = col - Math.floor(row / 2); const r = row; hexes[q + ',' + r] = makeHex(q, r);
    if (col < COLS && row < ROWS) cells.push({ q, r });
  }
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H); document.body.style.margin = '0'; document.body.appendChild(renderer.domElement);
  renderer.setOpaqueSort(pooledMaterialOpaqueSort);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x203040);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1); sun.position.set(3, 8, 5); scene.add(sun);
  const ur = new UnitRenderer(scene, { szerokoscQ: COLS + 1, wysokoscR: ROWS + 1, hexes, seed: 1, rzeki: [] } as any);
  const list = specs.map((s, i) => ({ id: 'u' + i, ownerId: s.owner, typeId: s.typeId, category: s.cat, q: cells[i]!.q, r: cells[i]!.r, ruch: 2, ruchLeft: 2, hp: 100 }));
  const display: any = { visibleIds: new Set(list.map((u) => u.id)), badgeByRepId: new Map() };
  ur.sync(list as any, display);
  // kadr z polozen heksow (nie z geometrii) -- identyczny w A i B
  const p0 = axialToWorld(cells[0]!.q, cells[0]!.r, HEX_R); let minX = p0.x, maxX = p0.x, minZ = p0.z, maxZ = p0.z;
  for (const c of cells) { const p = axialToWorld(c.q, c.r, HEX_R); minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); }
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2; const halfW = (maxX - minX) / 2 + 1.2; const halfH = halfW * H / W;
  const cam = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 400);
  cam.position.set(cx, 40, cz + 30); cam.lookAt(cx, 0.5, cz); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const tokens: Map<string, THREE.Object3D> = (ur as any).tokens;
  let meshes = 0; for (const t of tokens.values()) t.traverse((o: any) => { if (o.isMesh) meshes++; });
  out.tokens = tokens.size; out.meshes = meshes;
  const gl = renderer.getContext();
  const grab = () => { scene.updateMatrixWorld(true); renderer.render(scene, cam); out.lastCalls = renderer.info.render.calls; const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return b64(px); };
  const canvas = renderer.domElement;
  const pick = () => list.map((u) => {
    const o = tokens.get(u.id)!; const p = new THREE.Vector3(); new THREE.Box3().setFromObject(o).getCenter(p); p.project(cam);
    return ur.pickUnitIdAt((p.x + 1) / 2 * W, (1 - p.y) / 2 * H, canvas, cam);
  });
  const home = list.map((u) => ur.getTokenPlacement(u.q, u.r));
  const place = (dx: number, dz: number) => list.forEach((u, i) => ur.setTokenWorldPosition(u.id, home[i]!.x + dx, home[i]!.y, home[i]!.z + dz));
  out.idle = grab(); out.drawCalls = out.lastCalls; out.pickIdle = pick();
  // zblizenie (pierwsze 5 zetonow rzedu 0) -- do oceny wzrokowej detali
  const zc = axialToWorld(cells[2]!.q, cells[2]!.r, HEX_R);
  const zoom = () => { const o = cam.clone(); const zh = 2.9, zv = zh * H / W; o.left = -zh; o.right = zh; o.top = zv; o.bottom = -zv;
    o.position.set(zc.x, 6, zc.z + 4.5); o.lookAt(zc.x, 0.9, zc.z); o.updateMatrixWorld(); o.updateProjectionMatrix(); return o; };
  const grabZ = () => { const z = zoom(); scene.updateMatrixWorld(true); renderer.render(scene, z); const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return b64(px); };
  out.zoomIdle = grabZ();
  place(0.37, 0); out.march = grab(); out.pickMarch = pick(); out.zoomMarch = grabZ();
  const nb = axialToWorld(1, 0, HEX_R); place(nb.x * 0.45, nb.z * 0.45); out.attack = grab(); out.zoomAttack = grabZ();
  place(0, 0);
  // przyciemnienie odroczenia
  const dimSet = new Set(list.filter((_, i) => i % 3 === 0).map((u) => u.id));
  // jak w grze: jednostka powstaje W oknie odroczenia (zeton tworzony jako przyciemniony), potem okno sie zamyka
  const dimList = list.filter((u) => dimSet.has(u.id));
  ur.sync(list.filter((u) => !dimSet.has(u.id)) as any, display);
  ur.sync(list as any, display, dimSet);
  const countMeshes = () => { let n = 0; for (const t of tokens.values()) t.traverse((o: any) => { if (o.isMesh) n++; }); return n; };
  out.meshesDim = countMeshes();
  const uuidDim = dimList.map((u) => tokens.get(u.id)!.uuid);
  out.dim = grab(); out.zoomDim = grabZ();
  let dimOk = true, othersOk = true;
  for (const u of list) tokens.get(u.id)!.traverse((o: any) => {
    if (!o.isMesh || o.isSprite) return; const m = o.material; if (Array.isArray(m)) return;
    const own = ((tokens.get(u.id)!.userData['mats'] as any[]) ?? []).includes(m);
    if (!own) return;
    if (dimSet.has(u.id)) { if (!m.transparent || m.opacity > 0.9) dimOk = false; }
    else if (m.userData && m.userData['dimBase']) othersOk = false;
  });
  out.dimOk = dimOk; out.othersOk = othersOk;
  ur.sync(list as any, display, new Set());
  out.undim = grab();
  out.meshesUndim = countMeshes();
  out.sameUuid = dimList.every((u, i) => tokens.get(u.id)!.uuid === uuidDim[i]);
  out.pickUndim = pick();
  // LOD drobnych czesci
  const lod: any[] = [];
  for (const dist of [8, 20, 40, 70, 110, 160]) {
    ur.applySmallPartLod(dist, 40, H, 3);
    lod.push({ dist, parts: (ur as any).smallPartLod.hiddenPartCount, meshes: ur.lodHiddenCount });
  }
  out.lod = lod;
  ur.applySmallPartLod(40, 40, H, 3); out.lodFrame = grab(); out.lodParts40 = (ur as any).smallPartLod.hiddenPartCount; out.pickLod = pick();
  ur.applySmallPartLod(1, 40, H, 3); out.lodBack = grab();
  // przebudowa (zmiana wlasciciela => inny pierscien) i usuniecie
  let err = '';
  try {
    const flipped = list.map((u, i) => (i % 5 === 0 ? { ...u, ownerId: u.ownerId === 0 ? 1 : 0 } : u));
    ur.sync(flipped as any, display); grab();
    ur.sync([] as any, { visibleIds: new Set(), badgeByRepId: new Map() } as any); grab();
  } catch (e) { err = String(e); }
  out.err = err; out.geoPool = (ur as any).geoPool.stats(); out.matPool = (ur as any).matPool.stats(); out.tokensAfter = tokens.size;
  return out;
};
(window as any).diffPng = (a: string, b: string) => {
  const A = Uint8Array.from(atob(a), (c) => c.charCodeAt(0)); const B = Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const s = ((H - 1 - y) * W + x) * 4; const d = (y * W + x) * 4;
    const diff = A[s] !== B[s] || A[s + 1] !== B[s + 1] || A[s + 2] !== B[s + 2] || A[s + 3] !== B[s + 3];
    if (diff) { img.data[d] = 255; img.data[d + 1] = 0; img.data[d + 2] = 255; img.data[d + 3] = 255; }
    else { img.data[d] = B[s]! >> 2; img.data[d + 1] = B[s + 1]! >> 2; img.data[d + 2] = B[s + 2]! >> 2; img.data[d + 3] = 255; }
  }
  ctx.putImageData(img, 0, 0); return cv.toDataURL('image/png');
};
(window as any).framePng = (a: string) => {
  const A = Uint8Array.from(atob(a), (c) => c.charCodeAt(0));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  for (let y = 0; y < H; y++) { const s = (H - 1 - y) * W * 4; img.data.set(A.subarray(s, s + W * 4), y * W * 4); }
  ctx.putImageData(img, 0, 0); return cv.toDataURL('image/png');
};
`;

function diff(a, b) {
  const A = Buffer.from(a, 'base64'); const B = Buffer.from(b, 'base64');
  let d = 0; for (let i = 0; i < A.length; i += 4) if (A[i] !== B[i] || A[i + 1] !== B[i + 1] || A[i + 2] !== B[i + 2] || A[i + 3] !== B[i + 3]) d++;
  return d;
}
const sameArr = (a, b) => JSON.stringify(a) === JSON.stringify(b);

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'unit-static-merge-'));
  let browser = null;
  try {
    const res = await esbuild.build({ stdin: { contents: entry, resolveDir: GRA, loader: 'ts' }, bundle: true, format: 'iife', write: false, logLevel: 'error',
      loader: { '.json': 'json', '.png': 'dataurl', '.jpg': 'dataurl', '.mp3': 'dataurl', '.svg': 'dataurl' } });
    fs.writeFileSync(path.join(tmp, 'b.js'), res.outputFiles[0].text);
    fs.writeFileSync(path.join(tmp, 'index.html'), '<!doctype html><meta charset="utf-8"><body style="margin:0"><script src="b.js"></script>');
    browser = await chromium.launch({ headless: true, executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined,
      args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
    const errs = [];
    const page = async () => { const p = await browser.newPage({ viewport: { width: 1600, height: 1000 } }); p.on('pageerror', (e) => errs.push(String(e).slice(0, 300))); await p.goto('file://' + path.join(tmp, 'index.html')); return p; };
    const pa = await page(); const t0 = Date.now(); const A = await pa.evaluate(() => window.run(false)); const tA = Date.now() - t0;
    const pb = await page(); const t1 = Date.now(); const B = await pb.evaluate(() => window.run(true)); const tB = Date.now() - t1;
    console.log('  info zetony ' + A.tokens + ', czas run A/B ms ' + tA + '/' + tB);
    ok('S1 meshe w zetonach B < 40% A', B.meshes < 0.4 * A.meshes, { A: A.meshes, B: B.meshes, perTokenA: +(A.meshes / A.tokens).toFixed(1), perTokenB: +(B.meshes / B.tokens).toFixed(1) });
    ok('S2 draw calls B < 40% A', B.drawCalls < 0.4 * A.drawCalls, { A: A.drawCalls, B: B.drawCalls });
    const dIdle = diff(A.idle, B.idle), dMarch = diff(A.march, B.march), dAttack = diff(A.attack, B.attack);
    ok('S3 obraz stanie/marsz/atak A vs B <= ' + LIMIT + ' px z 1,6 mln', dIdle <= LIMIT && dMarch <= LIMIT && dAttack <= LIMIT, { idle: dIdle, march: dMarch, attack: dAttack });
    const hits = A.pickIdle.filter((v, i) => v === 'u' + i).length;
    ok('S4 picking A == B (stanie, marsz), trafienia >= 95%', sameArr(A.pickIdle, B.pickIdle) && sameArr(A.pickMarch, B.pickMarch) && hits >= 0.95 * A.tokens,
      { hits, of: A.tokens, idleSame: sameArr(A.pickIdle, B.pickIdle), marchSame: sameArr(A.pickMarch, B.pickMarch) });
    const dz = { idle: diff(A.zoomIdle, B.zoomIdle), march: diff(A.zoomMarch, B.zoomMarch), attack: diff(A.zoomAttack, B.zoomAttack), dim: diff(A.zoomDim, B.zoomDim) };
    ok('S3b zblizenie (5 zetonow na cala klatke) stanie/marsz/atak/przyciemnienie A vs B <= ' + LIMIT + ' px', Object.values(dz).every((v) => v <= LIMIT), dz);
    const dDim = diff(A.dim, B.dim);
    ok('S5 przyciemnienie: B przyciemnione, inne nietkniete, A vs B przyciemnione <= ' + LIMIT + '; po zdjeciu: ten sam obiekt zetonu (bez przebudowy), scalony w miejscu (meshe == baza B), klatka B vs baza B <= ' + LIMIT + ', A == baza A (0 px), picking == baza',
      B.dimOk && B.othersOk && dDim <= LIMIT && B.sameUuid && A.sameUuid && B.meshesUndim === B.meshes && B.meshesDim > B.meshes
        && diff(B.undim, B.idle) <= LIMIT && diff(A.undim, A.idle) === 0 && sameArr(B.pickUndim, B.pickIdle),
      { dimOk: B.dimOk, othersOk: B.othersOk, dimAvsB: dDim, sameUuid: B.sameUuid, meshes: { base: B.meshes, dim: B.meshesDim, undim: B.meshesUndim },
        undimVsIdleB: diff(B.undim, B.idle), undimVsIdleA: diff(A.undim, A.idle), pickSame: sameArr(B.pickUndim, B.pickIdle) });
    const lodSame = A.lod.every((x, i) => x.parts === B.lod[i].parts);
    const dLod = diff(A.lodFrame, B.lodFrame);
    ok('S6 LOD: schowane czesci B == A dla kazdego oddalenia, cos schowane, klatka LOD A vs B <= ' + LIMIT + ', picking w LOD == bez LOD, powrot == baza',
      lodSame && B.lod[B.lod.length - 1].parts > 0 && dLod <= LIMIT && sameArr(B.pickLod, B.pickIdle) && diff(B.lodBack, B.idle) === 0,
      { A: A.lod, B: B.lod, lodFrameAvsB: dLod, pickLodSame: sameArr(B.pickLod, B.pickIdle), backVsIdle: diff(B.lodBack, B.idle) });
    ok('S7 przebudowa i usuniecie bez wyjatku, pule puste', !B.err && !A.err && B.tokensAfter === 0 && B.geoPool.shared === 0 && B.matPool.shared === 0 && B.geoPool.refs === 0,
      { err: B.err || A.err, geo: B.geoPool, mat: B.matPool });
    ok('S8 brak bledow strony', errs.length === 0, errs.slice(0, 3));
    if (SHOTS) {
      fs.mkdirSync(SHOTS, { recursive: true });
      const save = async (name, dataUrl) => fs.writeFileSync(path.join(SHOTS, name), Buffer.from(dataUrl.split(',')[1], 'base64'));
      for (const [n, a, b] of [['stanie', A.idle, B.idle], ['marsz', A.march, B.march], ['atak', A.attack, B.attack], ['przyciemnienie', A.dim, B.dim], ['lod40', A.lodFrame, B.lodFrame], ['zblizenie-stanie', A.zoomIdle, B.zoomIdle], ['zblizenie-marsz', A.zoomMarch, B.zoomMarch], ['zblizenie-atak', A.zoomAttack, B.zoomAttack], ['zblizenie-przyciemnienie', A.zoomDim, B.zoomDim]]) {
        await save(n + '-A-bez-scalenia.png', await pb.evaluate((x) => window.framePng(x), a));
        await save(n + '-B-scalenie.png', await pb.evaluate((x) => window.framePng(x), b));
        await save(n + '-roznica.png', await pb.evaluate(([x, y]) => window.diffPng(x, y), [a, b]));
      }
      console.log('  zrzuty: ' + SHOTS);
    }
    console.log('WYNIK ' + JSON.stringify({ tokens: A.tokens, meshes: [A.meshes, B.meshes], drawCalls: [A.drawCalls, B.drawCalls], px: { idle: dIdle, march: dMarch, attack: dAttack, dim: dDim, lod40: dLod, zoom: dz },
      lodParts: { A: A.lod.map((x) => x.parts), B: B.lod.map((x) => x.parts), Bmeshes: B.lod.map((x) => x.meshes) }, runMs: [tA, tB] }));
  } finally {
    if (browser) await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`\nmemory-unit-static-merge-test: ${pass} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
