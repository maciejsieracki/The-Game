'use strict';
/**
 * R-WEB-MINIMAP-VIEWPORT-RECT-FOLLOW-Q1 — test ramki widoku minimapy (biała ramka = obszar widziany przez kamerę).
 *
 * Bramka: node tools/minimap-viewport-rect-follow-test.cjs
 *
 * Co sprawdza:
 *  (A) computeViewport (map/minimap.ts, kod źródłowy uruchomiony przez esbuild): ramka PRZESUWA SIĘ przy
 *      przesunięciu kamery i ZMIENIA ROZMIAR przy zoomie.
 *  (B) minimapHud.ts (kod źródłowy, esbuild + atrapa DOM/canvas z rejestrem wywołań): updateViewport(vp)
 *      rysuje ramkę w nowym miejscu, NIE przerysowuje heksów (brak nowych fill), a przy tej samej ramce nic nie
 *      rysuje; wynik zgodny z pełnym update() z tymi samymi danymi.
 *  (C) wiązanie: renderLoop (main.ts) wywołuje updateMinimapViewport(computeViewport(...)) BEZ bramki
 *      minimapDirty, a hud.ts eksportuje je i deleguje do minimapApi.updateViewport.
 *
 * Mutacja (dowód nietautologiczności): updateViewport jako no-op → sekcja B pada; usunięcie wywołania
 * z renderLoop → sekcja C pada.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const STUBS = {
  name: 'stubs',
  setup(build) {
    build.onResolve({ filter: /brandTokenVars$/ }, () => ({ path: 'stub-brand', namespace: 'stub' }));
    build.onResolve({ filter: /game\/visibility$/ }, () => ({ path: 'stub-vis', namespace: 'stub' }));
    build.onLoad({ filter: /.*/, namespace: 'stub' }, args => ({
      contents: args.path === 'stub-brand'
        ? 'export function ensureBrandRootTokens() {}'
        : 'export const FOG_EXPLORED_BRIGHTNESS = 0.175;',
      loader: 'js',
    }));
  },
};

async function bundle(rel) {
  const res = await esbuild.build({
    entryPoints: [path.join(ROOT, rel)],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    plugins: [STUBS],
    logLevel: 'silent',
  });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', res.outputFiles[0].text)(mod, mod.exports, require);
  return mod.exports;
}

// ---------------------------------------------------------------- atrapa DOM + rejestr rysowania
const draws = [];          // { m, a, canvasId }
let canvasSeq = 0;
function makeCtx(canvasId) {
  const ctx = { fillStyle: '', strokeStyle: '', lineWidth: 1, globalAlpha: 1 };
  for (const m of ['fillRect', 'fill', 'beginPath', 'moveTo', 'lineTo', 'closePath', 'stroke', 'arc', 'strokeRect', 'drawImage']) {
    ctx[m] = (...a) => { draws.push({ m, a, canvasId }); };
  }
  return ctx;
}
function makeEl(tag) {
  const el = {
    tagName: tag, className: '', id: '', innerHTML: '', textContent: '', type: '', title: '', onclick: null,
    style: { setProperty() {} }, children: [],
    classList: { toggle() {}, add() {}, remove() {} },
    appendChild(c) { this.children.push(c); return c; },
    querySelectorAll() { return []; },
    addEventListener() {},
    remove() {},
    setAttribute() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 280, height: 170 }; },
  };
  if (tag === 'canvas') {
    el.width = 0; el.height = 0;
    const id = ++canvasSeq;
    el.__id = id;
    const ctx = makeCtx(id);
    el.getContext = () => ctx;
  }
  return el;
}
globalThis.document = {
  createElement: makeEl,
  getElementById: () => null,
  head: { appendChild() {} },
};

const strokeRects = () => draws.filter(d => d.m === 'strokeRect' && d.canvasId === visibleCanvasId());
const fills = () => draws.filter(d => d.m === 'fill').length;
let visibleCanvasId = () => -1;

// ---------------------------------------------------------------- dane testowe
function gridData(viewport) {
  const cols = 12, rows = 8;
  const hexes = [];
  for (let r = 0; r < rows; r++) {
    for (let q = 0; q < cols; q++) hexes.push({ q, r, teren: 'Laka', ownerColor: undefined, fog: 'visible' });
  }
  return { cols, rows, hexes, viewport, markers: [] };
}
const VP1 = { x: 1, y: 1, w: 4, h: 3 };
const VP2 = { x: 5, y: 2, w: 4, h: 3 };   // kamera przesunięta w prawo i w dół
const VP3 = { x: 4, y: 1, w: 8, h: 6 };   // zoom out: ramka większa, przesunięta o 1
const VP3_COPY = { x: 4, y: 1, w: 8, h: 6 };

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('PASS:', name); };

async function main() {
  // ---------------------------------------------------------------- (A) computeViewport
  const mm = await bundle('src/map/minimap.ts');
  const map = { szerokoscQ: 200, wysokoscR: 200, hexes: {} };
  const cam = (targetX, targetZ, distance) => ({ targetX, targetZ, distance, fov: 0.7, aspect: 1.6 });
  const vA = mm.computeViewport(map, cam(0, 0, 10));
  const vShift = mm.computeViewport(map, cam(60, 0, 10));
  const vZoom = mm.computeViewport(map, cam(0, 0, 30));

  t('(A) computeViewport: przesunięcie kamery przesuwa ramkę (x/y)', () => {
    assert.ok(vA && vShift, 'ramka widoku policzona');
    assert.notEqual(vShift.x, vA.x, 'x ramki zmienia się po przesunięciu kamery');
    assert.ok(vShift.x > vA.x, 'kamera w prawo → ramka w prawo');
  });
  t('(A) computeViewport: zoom zmienia rozmiar ramki (w/h)', () => {
    assert.ok(vZoom && vA);
    assert.ok(vZoom.w > vA.w, 'większe oddalenie → szersza ramka');
    assert.ok(vZoom.h > vA.h, 'większe oddalenie → wyższa ramka');
  });

  // ---------------------------------------------------------------- (B) minimapHud
  const hudMod = await bundle('src/ui/minimapHud.ts');
  let data = gridData(VP1);
  const hud = hudMod.createMinimapHud({ getMinimapData: () => data, width: 280, height: 170 });
  visibleCanvasId = () => hud.canvas.__id;

  t('(B) update(): ramka rysowana z viewport danych (pełne odświeżenie)', () => {
    const r = strokeRects();
    assert.equal(r.length, 1, 'jedna ramka po pełnym update');
    assert.ok(Math.abs(r[0].a[0] - (Math.floor(VP1.x * (280 / 12)) + 0.5)) < 1e-9, 'x ramki z VP1');
  });

  const fillsAfterFull = fills();
  const strokeAfterFull = strokeRects().length;
  let beforeDrawImage = draws.filter(d => d.m === 'drawImage').length;

  t('(B) updateViewport(VP2): ramka PRZESUWA się na nowe miejsce', () => {
    hud.updateViewport(VP2);
    const r = strokeRects();
    assert.equal(r.length, strokeAfterFull + 1, 'dorysowana nowa ramka');
    const last = r[r.length - 1].a;
    assert.ok(Math.abs(last[0] - (Math.floor(VP2.x * (280 / 12)) + 0.5)) < 1e-9, 'x nowej ramki z VP2');
    assert.ok(Math.abs(last[1] - (Math.floor(VP2.y * (170 / 8)) + 0.5)) < 1e-9, 'y nowej ramki z VP2');
  });

  t('(B) updateViewport: NIE przerysowuje heksów (brak nowych fill), tylko składa warstwę bazową', () => {
    assert.equal(fills(), fillsAfterFull, 'liczba fill bez zmian = heksy nietknięte');
    const dImg = draws.filter(d => d.m === 'drawImage').length;
    assert.equal(dImg, beforeDrawImage + 1, 'jedno drawImage warstwy bazowej na zmianę kamery');
  });

  t('(B) updateViewport: wynik zgodny z pełnym update() z tymi samymi danymi (bez tautologii)', () => {
    const freshData = gridData(VP2);
    const fresh = hudMod.createMinimapHud({ getMinimapData: () => freshData, width: 280, height: 170 });
    const freshId = fresh.canvas.__id;
    const freshRect = draws.filter(d => d.m === 'strokeRect' && d.canvasId === freshId).pop().a;
    // ostatnia ramka widocznej minimapy po updateViewport(VP2) musi być identyczna jak świeżo policzona
    const incRect = strokeRects().pop().a;
    assert.deepEqual(incRect, freshRect);
  });

  t('(B) zoom: updateViewport(VP3) zmienia rozmiar ramki (w/h)', () => {
    hud.updateViewport(VP3);
    const last = strokeRects().pop().a;
    assert.ok(Math.abs(last[2] - Math.ceil(VP3.w * (280 / 12))) < 1e-9, 'szerokość z VP3');
    assert.ok(Math.abs(last[3] - Math.ceil(VP3.h * (170 / 8))) < 1e-9, 'wysokość z VP3');
  });

  t('(B) ta sama ramka (kopia) → brak kolejnego rysowania (tani sprawdzian)', () => {
    const n = draws.length;
    hud.updateViewport(VP3_COPY);
    assert.equal(draws.length, n, 'bez zmian ramki nic nie rysujemy');
  });

  t('(B) brak ramki (undefined) → rysowana warstwa bazowa bez ramki', () => {
    const before = strokeRects().length;
    hud.updateViewport(undefined);
    assert.equal(strokeRects().length, before, 'brak nowego strokeRect');
  });

  t('(B) pełne update() po zmianie danych nadal przerysowuje heksy', () => {
    const f0 = fills();
    data = gridData({ x: 0, y: 0, w: 2, h: 2 });
    hud.update();
    assert.ok(fills() > f0, 'pełne odświeżenie rysuje heksy');
    assert.ok(Math.abs(strokeRects().pop().a[0] - 0.5) < 1e-9, 'ramka z nowych danych');
  });

  // ---------------------------------------------------------------- (C) wiązanie w main.ts / hud.ts
  const main = read('src/main.ts');
  const hudSrc = read('src/ui/hud.ts');

  t('(C) main.ts: renderLoop wywołuje updateMinimapViewport(computeViewport(map, cameraGroundTarget())) bez bramki dirty', () => {
    const loopAt = main.indexOf('function renderLoop()');
    assert.ok(loopAt > 0, 'renderLoop istnieje');
    const callAt = main.indexOf('updateMinimapViewport(computeViewport(map, cameraGroundTarget()));', loopAt);
    const renderAt = main.indexOf('renderer.render(scene, camera);', loopAt);
    assert.ok(callAt > loopAt && renderAt > callAt, 'wywołanie w ciele renderLoop, przed renderer.render');
    const between = main.slice(loopAt, callAt);
    assert.ok(!/minimapDirty/.test(between), 'nie za bramką minimapDirty');
    assert.ok(/import\s*\{[^}]*updateMinimapViewport[^}]*\}\s*from\s*'\.\/ui\/hud'/.test(main), 'import z ui/hud');
  });

  t('(C) hud.ts: eksport updateMinimapViewport deleguje do minimapApi.updateViewport', () => {
    assert.ok(/export function updateMinimapViewport\(/.test(hudSrc), 'eksport');
    assert.ok(/minimapApi\?\.updateViewport\(viewport\)/.test(hudSrc), 'delegacja');
  });

  console.log(`\nOK: ${pass} testów minimap-viewport-rect-follow`);
}

main().catch(err => { console.error('FAIL:', err && err.message ? err.message : err); process.exit(1); });
