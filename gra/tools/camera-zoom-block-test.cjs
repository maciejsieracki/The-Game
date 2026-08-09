'use strict';
/**
 * camera-zoom-block-test.cjs — BUG-ZOOM-ZABLOKOWANY-TRYB-ULEPSZEN (Maciej, playtest 2026-08-08).
 *
 * Regresja: zoom kółkiem NIE MOŻE być blokowany trybem budowania ulepszeń/cudu (po wybraniu
 * celu) ani trybem zakładania miasta — drag-pan owszem, zoom nie. Przed fixem CameraController
 * (`gra/src/render/camera.ts`) miał JEDEN predykat `blockPointerAt` gating zarówno
 * `_onMouseDown` (drag), `_edgePanDelta` (auto-pan) jak i `_onWheel` (zoom) — a main.ts
 * (`cameraControllerOpts()`) wpinał tam pełny warunek `foundCityMode || (buildModeOpen &&
 * (activeImprovementKey || activeWonderId))`, ignorujący pozycję kursora. Fix wprowadza osobny
 * `blockWheelAt`, domyślnie = `blockPointerAt` (fallback dla wywołań bez tej opcji).
 *
 * Test importuje RZECZYWISTY `CameraController` z `../src/render/camera.ts` (esbuild, `three`
 * jako external — jak picker-test.cjs) i steruje nim przez syntetyczne zdarzenia DOM (fake
 * EventTarget dla canvas/window/document — bez jsdom, bo nie potrzebujemy realnego drzewa DOM,
 * tylko addEventListener/dispatchEvent). main.ts jest plikiem startowym gry (bootuje całą scenę
 * przy imporcie) — nie da się zaimportować z niego samej `cameraControllerOpts()`, więc predykaty
 * `fullPredicate`/`panelOnlyPredicate` niżej są WIERNĄ KOPIĄ kształtu warunku z
 * `gra/src/main.ts` (`cameraControllerOpts()`, dziś ok. linii 1355-1370) — jeśli to wiązanie
 * się tam zmieni, ten test trzeba zaktualizować równolegle (nie jest z main.ts importowany
 * automatycznie).
 *
 * Uruchamiane na TYM SAMYM pliku testowym względem dwóch drzew źródłowych (commit z fixem vs
 * commit rodzica a659f4a1 bez `blockWheelAt`) — na rodzicu assercja 1 (repro) MUSI failować
 * (dowód, że stary kod miał bug), pozostałe 3 muszą przejść (dowód, że fix nie regresuje
 * drag-panu, edge-panu ani samej blokady panelu miasta).
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.camera-zoom-block-test-entry.ts');
const BUNDLE = path.join(__dirname, '.camera-zoom-block-test-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { CameraController, DRAG_THRESHOLD_PX } from '../src/render/camera';
import * as THREE_NS from 'three';
export const THREE = THREE_NS;`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  loader: { '.ts': 'ts' },
  external: ['three'], // jak picker-test.cjs — bundlowanie three puchnie artefakt o ~32 tys. linii
  logLevel: 'silent',
});

const { CameraController, DRAG_THRESHOLD_PX, THREE } = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(label, cond) {
  if (cond) { pass++; return; }
  fail++;
  console.error('FAIL:', label);
}

// ── Fake EventTarget: tylko addEventListener/removeEventListener/dispatchEvent, bez jsdom ──
function makeFakeTarget() {
  const listeners = {};
  return {
    addEventListener(type, fn) { (listeners[type] || (listeners[type] = [])).push(fn); },
    removeEventListener(type, fn) {
      if (!listeners[type]) return;
      listeners[type] = listeners[type].filter((f) => f !== fn);
    },
    dispatchEvent(evt) {
      (listeners[evt.type] || []).slice().forEach((fn) => fn(evt));
    },
  };
}

// camera.ts referuje globalne `window`/`document` bezpośrednio (nie przez DI) — jak w
// pre-battle-save-test.cjs, trzeba je podstawić PRZED konstrukcją CameraController.
global.window = makeFakeTarget();
global.document = makeFakeTarget();

function makeCamera() {
  const camera = new THREE.PerspectiveCamera(50, 1200 / 800, 0.5, 4000);
  camera.position.set(0, 15, 25); // dist startowy ≈ 29.15 (offset od target {0,0,0})
  return camera;
}

// ── Predykaty — WIERNA KOPIA main.ts:cameraControllerOpts() (patrz komentarz u góry pliku) ──
// Panel "miasta" udawany prostym prostokątem ekranu (0,0)-(200,100) zamiast prawdziwego
// isPointOverCityPanelUi (który wymaga jsdom + stanu UI miasta) — to, co testujemy, to
// ROZDZIELENIE blockPointerAt/blockWheelAt w CameraController, nie samą logikę panelu miasta,
// która jest niezmieniona przez ten bug/fix.
const state = { foundCityMode: false, buildModeOpen: false, activeImprovementKey: null, activeWonderId: null };
const isOverPanelStub = (x, y) => x < 200 && y < 100;
const fullPredicate = (x, y) => {
  if (isOverPanelStub(x, y)) return true;
  if (state.foundCityMode || (state.buildModeOpen && (state.activeImprovementKey || state.activeWonderId))) return true;
  return false;
};

const canvasA = makeFakeTarget();
const ctrlA = new CameraController(makeCamera(), canvasA, { x: 0, z: 0 }, {
  blockPointerAt: fullPredicate,
  // FIX: post-fix main.ts wiąże blockWheelAt WYŁĄCZNIE z pozycyjnym checkiem panelu miasta —
  // bez warunków trybu. Na commit-rodzicu (bez pola blockWheelAt w klasie) ta opcja jest po
  // prostu ignorowana i _onWheel nadal używa blockPointerAt — to właśnie odtwarza bug.
  blockWheelAt: isOverPanelStub,
});

const canvasB = makeFakeTarget();
const ctrlB = new CameraController(makeCamera(), canvasB, { x: 0, z: 0 }, {
  blockPointerAt: fullPredicate,
  // CELOWO brak klucza blockWheelAt — testuje domyślny fallback (assercja 3).
});

function dispatchWheel(canvas, x, y, deltaY) {
  canvas.dispatchEvent({ type: 'wheel', clientX: x, clientY: y, deltaY, preventDefault() {} });
}
function dispatchMouseDown(canvas, x, y) {
  canvas.dispatchEvent({ type: 'mousedown', button: 0, clientX: x, clientY: y });
}
function dispatchWindowMouseMove(x, y) {
  global.window.dispatchEvent({ type: 'mousemove', clientX: x, clientY: y });
}
function dispatchWindowMouseUp() {
  global.window.dispatchEvent({ type: 'mouseup' });
}

const MAP_X = 600, MAP_Y = 400;   // wyraźnie poza prostokątem panelu (0,0)-(200,100)
const PANEL_X = 50, PANEL_Y = 50; // wyraźnie wewnątrz

// ── Assercja 1 — REPRO/FIX: wheel poza panelem, w trakcie buildMode+wybrany cel, NIE jest
// blokowany. Na commicie-rodzicu (a659f4a1) MUSI to failować — tam _onWheel używał pełnego
// blockPointerAt (panel OR tryb), więc zoom był zablokowany identycznie jak drag. ──
state.buildModeOpen = true;
state.activeImprovementKey = 'test-improvement';
{
  const d0 = ctrlA.getFocusState().dist;
  dispatchWheel(canvasA, MAP_X, MAP_Y, 100);
  const d1 = ctrlA.getFocusState().dist;
  ok('Repro/fix: wheel poza panelem w trybie budowania ulepszenia (cel wybrany) NIE blokowany', d1 !== d0);
}
state.buildModeOpen = false;
state.activeImprovementKey = null;

// ── Assercja 2 — NEGACJA: wheel NAD panelem miasta nadal blokowany, niezależnie od trybu. ──
{
  const dA0 = ctrlA.getFocusState().dist;
  dispatchWheel(canvasA, PANEL_X, PANEL_Y, 100); // tryb wyłączony
  const dA1 = ctrlA.getFocusState().dist;
  const blockedNoMode = dA1 === dA0;

  state.buildModeOpen = true;
  state.activeImprovementKey = 'test-improvement';
  const dB0 = ctrlA.getFocusState().dist;
  dispatchWheel(canvasA, PANEL_X, PANEL_Y, 100); // tryb włączony
  const dB1 = ctrlA.getFocusState().dist;
  const blockedWithMode = dB1 === dB0;
  state.buildModeOpen = false;
  state.activeImprovementKey = null;

  ok('Negacja: wheel nad panelem miasta blokowany niezależnie od trybu', blockedNoMode && blockedWithMode);
}

// ── Assercja 3 — FALLBACK: brak opcji blockWheelAt => domyślnie = blockPointerAt (stare
// zachowanie zachowane dla wywołań, które nie podają osobnego predykatu dla kółka). ──
state.buildModeOpen = true;
state.activeImprovementKey = 'test-improvement';
{
  const d0 = ctrlB.getFocusState().dist;
  dispatchWheel(canvasB, MAP_X, MAP_Y, 100); // poza panelem, ale blockPointerAt blokuje przez tryb
  const d1 = ctrlB.getFocusState().dist;
  ok('Fallback: brak blockWheelAt => domyślnie blockPointerAt (blokada trybu zachowana)', d1 === d0);
}
state.buildModeOpen = false;
state.activeImprovementKey = null;

// ── Assercja 4 — BRAK REGRESJI NA DRAGU: blockPointerAt nadal blokuje drag-pan w trakcie
// placementu (niezmienione przez ten fix) — z kontrolą negatywną (tryb wyłączony -> pan
// faktycznie działa), żeby dowieść, że harness jest w stanie wykryć pan, gdyby przestał być
// blokowany. ──
{
  state.buildModeOpen = true;
  state.activeImprovementKey = 'test-improvement';
  const t0blocked = ctrlA.getFocusState();
  dispatchMouseDown(canvasA, MAP_X, MAP_Y);
  dispatchWindowMouseMove(MAP_X + DRAG_THRESHOLD_PX + 4, MAP_Y + DRAG_THRESHOLD_PX + 4); // uzbraja drag
  dispatchWindowMouseMove(MAP_X + DRAG_THRESHOLD_PX + 24, MAP_Y + DRAG_THRESHOLD_PX + 24); // realny pan, gdyby nie blokada
  dispatchWindowMouseUp();
  const t1blocked = ctrlA.getFocusState();
  const dragBlocked = t1blocked.x === t0blocked.x && t1blocked.z === t0blocked.z;

  state.buildModeOpen = false;
  state.activeImprovementKey = null;
  const t0free = ctrlA.getFocusState();
  dispatchMouseDown(canvasA, MAP_X, MAP_Y);
  dispatchWindowMouseMove(MAP_X + DRAG_THRESHOLD_PX + 4, MAP_Y + DRAG_THRESHOLD_PX + 4);
  dispatchWindowMouseMove(MAP_X + DRAG_THRESHOLD_PX + 24, MAP_Y + DRAG_THRESHOLD_PX + 24);
  dispatchWindowMouseUp();
  const t1free = ctrlA.getFocusState();
  const dragWorkedWhenFree = t1free.x !== t0free.x || t1free.z !== t0free.z;

  ok('Brak regresji: blockPointerAt nadal blokuje drag-pan w trakcie placementu (kontrola: pan działa poza trybem)', dragBlocked && dragWorkedWhenFree);
}

console.log(`camera-zoom-block-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
