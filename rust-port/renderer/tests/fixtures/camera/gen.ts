// R-RUSTPORT-P4-11-CAMERA-TERRAIN-CPU-Q1 — generator of camera-controller reference vectors.
//
// Run ONLY outside the repository (scratch dir), see README.md. The esbuild bundle links:
//  - three@0.169.0 (npm, version pinned by gra/package-lock.json),
//  - the web module `render/camera.ts` (CameraController, DRAG_THRESHOLD_PX) and
//    `render/hexutil.ts` (HEX_R, mapCenter) from `git archive edb8fb56 gra/src`,
//    IMPORTED UNCHANGED (not rewritten),
//  - copies of two fragments that cannot be imported without DOM/WebGL, marked
//    `// LITERAL <file>:<lines>` (same logic and arithmetic, TS types removed):
//    main.ts:1903-1909 (cameraControllerOpts: minDist/maxDist/keyPanSpeed) and
//    scene.ts:3084-3085 (initial camera position before the controller).
// The DOM is replaced by stubs that only REGISTER the listeners camera.ts adds in
// `_bind()` (camera.ts:225-234); the script then calls exactly those listeners with
// synthetic events, i.e. the real handlers run.
// Output: camera.json in the directory given as argv[2].

import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CameraController, DRAG_THRESHOLD_PX } from '../websrc/gra/src/render/camera';
import { HEX_R, mapCenter } from '../websrc/gra/src/render/hexutil';

const OUT = process.argv[2];
if (!OUT) throw new Error('usage: node gen.mjs <outdir>');
fs.mkdirSync(OUT, { recursive: true });

type Handler = (e: any) => void;
function makeTarget() {
  const map = new Map<string, Handler>();
  return {
    map,
    addEventListener(type: string, h: Handler) { map.set(type, h); },
    removeEventListener(type: string) { map.delete(type); },
  };
}

interface Rect { left: number; top: number; width: number; height: number }
interface Gate { block: Rect | null; wheelBlock: Rect | null | undefined; edge: boolean }
const inRect = (r: Rect | null | undefined, x: number, y: number) =>
  !!r && x >= r.left && y >= r.top && x < r.left + r.width && y < r.top + r.height;

interface Scenario {
  name: string;
  W: number; H: number;
  /** 'game' = main.ts options; 'default' = constructor defaults; 'custom' = explicit options */
  opts: 'game' | 'default' | 'custom';
  custom?: any;
  rect: Rect;
  /** true: blockWheelAt given separately (main.ts); false: defaults to blockPointerAt */
  separateWheel: boolean;
  steps: any[];
}

function run(sc: Scenario) {
  const win = makeTarget();
  const doc = makeTarget();
  const canvas: any = makeTarget();
  let rect = { ...sc.rect };
  canvas.getBoundingClientRect = () => ({ ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height, x: rect.left, y: rect.top });
  (globalThis as any).window = win;
  (globalThis as any).document = doc;

  const R = HEX_R;
  const center = mapCenter(sc.W, sc.H, R);
  // LITERAL scene.ts:3078-3085 (roblox branch of camDist; fov/aspect do not influence the controller)
  const camera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.5, 5000);
  const camDist = Math.max(sc.W, sc.H) * R * 1.65;
  camera.position.set(center.x, camDist * 0.9, center.z + camDist * 0.7);
  camera.lookAt(center.x, 0, center.z);

  const gate: Gate = { block: null, wheelBlock: undefined, edge: false };
  const blockPointerAt = (x: number, y: number) => inRect(gate.block, x, y);
  const blockWheelAt = (x: number, y: number) => inRect(gate.wheelBlock ?? null, x, y);
  let opts: any;
  if (sc.opts === 'game') {
    // LITERAL main.ts:1903-1909 + 1911-1929 (predicates replaced by the scripted gate)
    const mapSpan = Math.max(sc.W, sc.H) * HEX_R * 1.85;
    const maxDist = Math.max(320, mapSpan * 1.2);
    opts = {
      minDist: 8 / 3,
      maxDist,
      keyPanSpeed: 0.3,
      blockPointerAt,
      edgePanActive: () => gate.edge,
    };
    if (sc.separateWheel) opts.blockWheelAt = blockWheelAt;
  } else if (sc.opts === 'default') {
    opts = { blockPointerAt, edgePanActive: () => gate.edge };
    if (sc.separateWheel) opts.blockWheelAt = blockWheelAt;
  } else {
    opts = { ...sc.custom, blockPointerAt, edgePanActive: () => gate.edge };
    if (sc.separateWheel) opts.blockWheelAt = blockWheelAt;
  }
  const ctrl: any = new CameraController(camera, canvas, center, opts);
  // matrixWorld is recorded for the hand-written scenarios only (fuzz: target, dist and
  // position; the matrices are a pure function of them, proven bit-exact in P4-10).
  const withWorld = !sc.name.startsWith('fuzz');
  const snap = () => {
    camera.updateMatrixWorld(true);
    const st = ctrl.getFocusState();
    const o: any = {
      tx: st.x, tz: st.z, d: st.dist,
      p: [camera.position.x, camera.position.y, camera.position.z],
    };
    if (withWorld) o.w = Array.from(camera.matrixWorld.elements);
    return o;
  };
  const out: any = {
    name: sc.name, W: sc.W, H: sc.H, opts: sc.opts, custom: sc.custom ?? null,
    separateWheel: sc.separateWheel, rect: sc.rect,
    center: [center.x, center.z], initPos: [camera.position.x, camera.position.y, camera.position.z],
    limits: ctrl.getDistLimits(),
    init: snap(),
    steps: [] as any[],
  };
  // the constructor already moved the camera; initPos above is AFTER _syncCamera, so
  // also record the pre-controller position (scene.ts:3085) for the Rust constructor:
  out.scenePos = [center.x, camDist * 0.9, center.z + camDist * 0.7];
  for (const s of sc.steps) {
    const ev = (o: any) => ({ preventDefault() {}, ...o });
    switch (s.k) {
      case 'down': canvas.map.get('mousedown')!(ev({ button: s.b ?? 0, clientX: s.x, clientY: s.y })); break;
      case 'move': win.map.get('mousemove')!(ev({ clientX: s.x, clientY: s.y })); break;
      case 'up': win.map.get('mouseup')!(ev({ button: s.b ?? 0, clientX: s.x ?? 0, clientY: s.y ?? 0 })); break;
      case 'wheel': canvas.map.get('wheel')!(ev({ clientX: s.x, clientY: s.y, deltaY: s.dy })); break;
      case 'kd': win.map.get('keydown')!(ev({ key: s.key })); break;
      case 'ku': win.map.get('keyup')!(ev({ key: s.key })); break;
      case 'blur': win.map.get('blur')!(ev({})); break;
      case 'leave': doc.map.get('mouseleave')!(ev({})); break;
      case 'frame': ctrl.update(); break;
      case 'focus': if (s.d === undefined) ctrl.focusAt(s.x, s.z); else ctrl.focusAt(s.x, s.z, s.d); break;
      case 'edge': gate.edge = s.on; break;
      case 'block': gate.block = s.r; break;
      case 'wblock': gate.wheelBlock = s.r; break;
      case 'rect': rect = { ...s.r }; break;
      default: throw new Error('bad step ' + s.k);
    }
    out.steps.push({ s, st: snap() });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Scenarios: hand-written edge cases + LCG fuzz.
function lcg(seed: number) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const VP: Rect = { left: 0, top: 0, width: 1280, height: 720 };
const VP2: Rect = { left: 37.5, top: 12, width: 800, height: 600 };
const scenarios: Scenario[] = [];

// 1. Drag dead zone: 5.9 px no pan, 6 px arms without jump, then pan.
scenarios.push({ name: 'drag-threshold', W: 40, H: 30, opts: 'game', rect: VP, separateWheel: true, steps: [
  { k: 'down', x: 600, y: 300 }, { k: 'move', x: 605.9, y: 300 }, { k: 'move', x: 600, y: 305.9 },
  { k: 'move', x: 604.2, y: 304.2 }, { k: 'move', x: 606, y: 300 }, { k: 'move', x: 640, y: 330 },
  { k: 'move', x: 500, y: 100 }, { k: 'up' }, { k: 'move', x: 400, y: 100 },
  { k: 'down', x: 100, y: 100 }, { k: 'move', x: 103.6, y: 104.8 }, { k: 'move', x: 50, y: 60 }, { k: 'up' },
  { k: 'down', x: 10, y: 10, b: 2 }, { k: 'move', x: 300, y: 300 }, { k: 'up', b: 2 },
  { k: 'down', x: 10, y: 10, b: 1 }, { k: 'move', x: 30, y: 300 },
  { k: 'down', x: 200, y: 200 }, { k: 'move', x: 200, y: 194 }, { k: 'move', x: 220, y: 150 }, { k: 'up', b: 2 },
  { k: 'move', x: 300, y: 150 },
] });
// 2. Wheel: zoom in/out, deltaY 0 = zoom in, clamp at min and max, blocks.
{
  const steps: any[] = [];
  for (let i = 0; i < 40; i++) steps.push({ k: 'wheel', x: 640, y: 360, dy: -100 });
  steps.push({ k: 'wheel', x: 640, y: 360, dy: 0 });
  for (let i = 0; i < 80; i++) steps.push({ k: 'wheel', x: 640, y: 360, dy: 53 });
  steps.push({ k: 'wheel', x: 640, y: 360, dy: -0.0001 });
  steps.push({ k: 'block', r: { left: 0, top: 0, width: 300, height: 720 } });
  steps.push({ k: 'wheel', x: 100, y: 360, dy: -100 });
  steps.push({ k: 'wheel', x: 400, y: 360, dy: -100 });
  steps.push({ k: 'wblock', r: { left: 1000, top: 0, width: 280, height: 720 } });
  steps.push({ k: 'wheel', x: 100, y: 360, dy: -100 });
  steps.push({ k: 'wheel', x: 1100, y: 360, dy: -100 });
  steps.push({ k: 'down', x: 100, y: 100 });
  steps.push({ k: 'move', x: 200, y: 200 });
  steps.push({ k: 'down', x: 500, y: 100 });
  steps.push({ k: 'move', x: 520, y: 100 });
  steps.push({ k: 'move', x: 560, y: 120 });
  steps.push({ k: 'up' });
  scenarios.push({ name: 'wheel-clamp-blocks', W: 12, H: 9, opts: 'game', rect: VP, separateWheel: true, steps });
  scenarios.push({ name: 'wheel-default-gate', W: 12, H: 9, opts: 'game', rect: VP, separateWheel: false, steps });
}
// 3. Keys: WASD / arrows / upper case / opposite keys / key-up.
scenarios.push({ name: 'keys', W: 64, H: 36, opts: 'game', rect: VP, separateWheel: true, steps: [
  { k: 'frame' }, { k: 'kd', key: 'w' }, { k: 'frame' }, { k: 'frame' }, { k: 'kd', key: 'D' }, { k: 'frame' },
  { k: 'kd', key: 'ArrowDown' }, { k: 'frame' }, { k: 'ku', key: 'W' }, { k: 'frame' }, { k: 'ku', key: 'arrowdown' },
  { k: 'frame' }, { k: 'kd', key: 'ArrowLeft' }, { k: 'frame' }, { k: 'kd', key: 'a' }, { k: 'frame' }, { k: 'ku', key: 'd' },
  { k: 'frame' }, { k: 'ku', key: 'ArrowLeft' }, { k: 'frame' }, { k: 'ku', key: 'a' }, { k: 'frame' },
  { k: 'kd', key: 'ArrowUp' }, { k: 'kd', key: 's' }, { k: 'frame' }, { k: 'kd', key: 'x' }, { k: 'frame' },
  { k: 'wheel', x: 10, y: 10, dy: 1 }, { k: 'frame' }, { k: 'ku', key: 's' }, { k: 'frame' }, { k: 'blur' }, { k: 'frame' },
  { k: 'ku', key: 'ArrowUp' }, { k: 'frame' },
] });
// 4. Edge pan: zones, corners, linear ramp, inactive, outside rect, blocked, dragging, blur/leave.
{
  const steps: any[] = [{ k: 'move', x: 5, y: 360 }, { k: 'frame' }, { k: 'edge', on: true }];
  const pts = [[5, 360], [0, 360], [31.999, 360], [32, 360], [16, 16], [1279, 719], [1280, 720], [1280.5, 360], [-0.5, 360],
    [640, 0], [640, 719.5], [1250, 360], [1248, 3], [640, 360], [20.25, 700.75]];
  for (const [x, y] of pts) { steps.push({ k: 'move', x, y }); steps.push({ k: 'frame' }); steps.push({ k: 'frame' }); }
  steps.push({ k: 'move', x: 5, y: 5 }, { k: 'blur' }, { k: 'frame' }, { k: 'move', x: 6, y: 6 }, { k: 'frame' });
  steps.push({ k: 'leave' }, { k: 'frame' }, { k: 'move', x: 1275, y: 700 }, { k: 'frame' });
  steps.push({ k: 'block', r: { left: 1200, top: 600, width: 80, height: 120 } }, { k: 'frame' }, { k: 'block', r: null }, { k: 'frame' });
  steps.push({ k: 'down', x: 1275, y: 700 }, { k: 'frame' }, { k: 'move', x: 1270, y: 690 }, { k: 'frame' }, { k: 'up' }, { k: 'frame' });
  steps.push({ k: 'kd', key: 'a' }, { k: 'frame' }, { k: 'ku', key: 'a' }, { k: 'edge', on: false }, { k: 'frame' });
  scenarios.push({ name: 'edge-pan', W: 40, H: 30, opts: 'game', rect: VP, separateWheel: true, steps });
  scenarios.push({ name: 'edge-pan-offset-rect', W: 40, H: 30, opts: 'game', rect: VP2, separateWheel: true,
    steps: steps.map((s) => (s.k === 'move' ? { ...s, x: s.x * 0.625 + 37.5, y: s.y * 0.833 + 12 } : s))
      .concat([{ k: 'edge', on: true }, { k: 'rect', r: { left: 0, top: 0, width: 375, height: 812 } }, { k: 'move', x: 370, y: 400 }, { k: 'frame' }]) });
}
// 5. focusAt with/without dist, clamp.
scenarios.push({ name: 'focus', W: 9, H: 7, opts: 'game', rect: VP, separateWheel: true, steps: [
  { k: 'focus', x: 3.5, z: -2.25 }, { k: 'focus', x: 10, z: 10, d: 22 }, { k: 'focus', x: 0, z: 0, d: 0.5 },
  { k: 'focus', x: -7.125, z: 100.75, d: 99999 }, { k: 'focus', x: 1e-9, z: -1e-9, d: 8 }, { k: 'wheel', x: 1, y: 1, dy: -1 },
] });
// 6. Constructor defaults and custom options.
scenarios.push({ name: 'defaults', W: 20, H: 15, opts: 'default', rect: VP, separateWheel: false, steps: [
  { k: 'wheel', x: 1, y: 1, dy: 1 }, { k: 'kd', key: 'd' }, { k: 'frame' }, { k: 'edge', on: true }, { k: 'move', x: 1279, y: 1 },
  { k: 'frame' }, { k: 'down', x: 600, y: 600 }, { k: 'move', x: 700, y: 650 }, { k: 'move', x: 720, y: 640 }, { k: 'up' },
  { k: 'ku', key: 'd' }, { k: 'frame' },
] });
scenarios.push({ name: 'custom', W: 20, H: 15, opts: 'custom', rect: VP2, separateWheel: true,
  custom: { minDist: 3, maxDist: 50, keyPanSpeed: 0.7, mousePanFactor: 0.0035, zoomFactor: 0.2, edgePanZonePx: 48, edgePanSpeed: 1.3 },
  steps: [{ k: 'edge', on: true }, { k: 'move', x: 40, y: 20 }, { k: 'frame' }, { k: 'kd', key: 'w' }, { k: 'frame' },
    { k: 'wheel', x: 300, y: 300, dy: -3 }, { k: 'frame' }, { k: 'down', x: 300, y: 300 }, { k: 'move', x: 330, y: 280 },
    { k: 'move', x: 380, y: 260 }, { k: 'up' }, { k: 'frame' }] });
// 6b. Edge pan with `edgePanZonePx: 0` (`?? 32` keeps 0, camera.ts:117): the cursor exactly on
//     every edge/corner must not pan (camera.ts:266-270 use strict `<`/`>`; `<=` would give 0/0 = NaN).
scenarios.push({ name: 'edge-zone-zero', W: 20, H: 15, opts: 'custom', rect: VP, separateWheel: true,
  custom: { minDist: 3, maxDist: 50, keyPanSpeed: 0.7, mousePanFactor: 0.0035, zoomFactor: 0.2, edgePanZonePx: 0, edgePanSpeed: 1.3 },
  steps: [{ k: 'edge', on: true }, { k: 'move', x: 0, y: 360 }, { k: 'frame' }, { k: 'move', x: 1280, y: 360 }, { k: 'frame' },
    { k: 'move', x: 640, y: 0 }, { k: 'frame' }, { k: 'move', x: 640, y: 720 }, { k: 'frame' }, { k: 'move', x: 0, y: 0 }, { k: 'frame' },
    { k: 'move', x: 1280, y: 720 }, { k: 'frame' }, { k: 'move', x: 0.25, y: 719.75 }, { k: 'frame' }, { k: 'kd', key: 'd' },
    { k: 'move', x: 0, y: 720 }, { k: 'frame' }, { k: 'ku', key: 'd' }, { k: 'frame' }] });
// 7. LCG fuzz: random event streams on several maps / viewports.
const KEYS = ['w', 'a', 's', 'd', 'W', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'q', 'Shift'];
const fuzzMaps: Array<[number, number, Rect]> = [[9, 7, VP], [40, 30, VP2], [128, 80, VP], [240, 168, { left: 0, top: 56, width: 375, height: 812 }]];
for (let fi = 0; fi < 24; fi++) {
  const rnd = lcg(1000 + fi * 7919);
  const [W, H, rect] = fuzzMaps[fi % fuzzMaps.length]!;
  const steps: any[] = [];
  const rx = () => rect.left - 20 + rnd() * (rect.width + 40);
  const ry = () => rect.top - 20 + rnd() * (rect.height + 40);
  for (let i = 0; i < 250; i++) {
    const p = rnd();
    if (p < 0.30) steps.push({ k: 'move', x: rnd() < 0.3 ? Math.round(rx()) : rx(), y: rnd() < 0.3 ? Math.round(ry()) : ry() });
    else if (p < 0.38) steps.push({ k: 'down', x: rx(), y: ry(), b: rnd() < 0.85 ? 0 : 2 });
    else if (p < 0.44) steps.push({ k: 'up' });
    else if (p < 0.54) steps.push({ k: 'wheel', x: rx(), y: ry(), dy: rnd() < 0.5 ? -100 * rnd() : 100 * rnd() });
    else if (p < 0.62) steps.push({ k: 'kd', key: KEYS[Math.floor(rnd() * KEYS.length)]! });
    else if (p < 0.70) steps.push({ k: 'ku', key: KEYS[Math.floor(rnd() * KEYS.length)]! });
    else if (p < 0.92) steps.push({ k: 'frame' });
    else if (p < 0.94) steps.push({ k: 'edge', on: rnd() < 0.7 });
    else if (p < 0.955) steps.push({ k: 'block', r: rnd() < 0.5 ? null : { left: rect.left, top: rect.top, width: rect.width * 0.3, height: rect.height } });
    else if (p < 0.97) steps.push({ k: 'wblock', r: rnd() < 0.5 ? null : { left: rect.left + rect.width * 0.7, top: rect.top, width: rect.width * 0.3, height: rect.height } });
    else if (p < 0.98) steps.push({ k: rnd() < 0.5 ? 'blur' : 'leave' });
    else steps.push({ k: 'focus', x: rnd() * W * 1.7, z: rnd() * H * 1.5, d: rnd() < 0.5 ? undefined : rnd() * 400 });
  }
  scenarios.push({ name: `fuzz-${fi}`, W, H, opts: 'game', rect, separateWheel: fi % 3 !== 0, steps });
}

const results = scenarios.map(run);
let nSteps = 0;
for (const r of results) nSteps += r.steps.length;
fs.writeFileSync(path.join(OUT, 'camera.json'), JSON.stringify({
  generator: 'tests/fixtures/camera/gen.ts', three: THREE.REVISION, dragThresholdPx: DRAG_THRESHOLD_PX, scenarios: results,
}));
console.log(`camera scenarios=${results.length} steps=${nSteps}`);
