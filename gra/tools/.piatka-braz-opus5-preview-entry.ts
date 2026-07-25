/**
 * .piatka-braz-opus5-preview-entry.ts — entry TYLKO do podgladu porownawczego
 * (dyspozycje/PODGLAD-PIATKA-BRAZ-OPUS5.html). Nie jest czescia gry, NIC z tego
 * pliku nie jest importowane przez units.ts ani main.ts.
 *
 * Pokazuje 7 modeli OBOK SIEBIE, kazdy na wlasnym heksie (R=1), heksy w rzedzie
 * wzdluz osi X stykajace sie bokami (axialToWorld: dx = HEX_R*sqrt(3), r=0 rzad),
 * pod tym samym kątem kamery co w grze (52°), te same swiatla co scene.ts
 * (styl 'roblox').
 *
 * 5 modeli NIEWPIETYCH (do oceny przez wlasciciela):
 *   wlocznik  → braz-wlocznik-opus5.ts        → buildWlocznikBrazOpus5
 *   miecznik  → braz-miecznik-opus5.ts        → buildMiecznikBrazOpus5
 *   procarz   → braz-procarz-opus5.ts         → buildProcarzBrazOpus5
 *   rydwan    → braz-rydwan-woly-opus5.ts     → buildRydwanWolyBrazOpus5
 *   hastati   → hastati-opus5.ts              → buildHastatiOpus5 (Epoka ZELAZA,
 *               poza biezacym zakresem Brazu — pokazany osobno, NIE jako czesc
 *               kompletu brazowego)
 *
 * 2 modele JUZ WPIETE (odniesienie — units.ts je faktycznie importuje):
 *   lucznik-nubijski → braz-lucznik-nubijski-opus5.ts → buildNubianArcherOpus5
 *   taran            → braz-taran-opus5.ts            → buildTaranOkutyOpus5
 *
 * REGENERACJA (z katalogu gra/, BEZ npm run build/dev — nie odpala
 * prebuild/predev → export-data.py, wiec nie nadpisuje JSON-ow w gra/data):
 *
 *   node tools/build-piatka-braz-opus5-preview.cjs
 *
 * Sterowanie z Playwright (screenshot script) przez window.__demo — patrz
 * capture-piatka-braz-opus5.cjs.
 */
import * as THREE from 'three';
import { HEX_R } from '../src/render/hexutil';
import { buildWlocznikBrazOpus5 } from '../src/render/braz-wlocznik-opus5';
import { buildMiecznikBrazOpus5 } from '../src/render/braz-miecznik-opus5';
import { buildProcarzBrazOpus5 } from '../src/render/braz-procarz-opus5';
import { buildRydwanWolyBrazOpus5 } from '../src/render/braz-rydwan-woly-opus5';
import { buildHastatiOpus5 } from '../src/render/hastati-opus5';
import { buildNubianArcherOpus5 } from '../src/render/braz-lucznik-nubijski-opus5';
import { buildTaranOkutyOpus5 } from '../src/render/braz-taran-opus5';

type Build = (c: number) => THREE.Group;

type Unit = {
  id: string;
  label: string;
  tag: string; // 'NOWY' | 'ODNIESIENIE'
  build: Build;
};

const UNITS: Unit[] = [
  { id: 'wlocznik', label: 'Włócznik (Brąz)', tag: 'NOWY', build: buildWlocznikBrazOpus5 },
  { id: 'miecznik', label: 'Miecznik (Brąz)', tag: 'NOWY', build: buildMiecznikBrazOpus5 },
  { id: 'procarz', label: 'Procarz (Brąz)', tag: 'NOWY', build: buildProcarzBrazOpus5 },
  { id: 'rydwan', label: 'Rydwan (woły, Brąz)', tag: 'NOWY', build: buildRydwanWolyBrazOpus5 },
  { id: 'hastati', label: 'Hastati (ŻELAZO — poza zakresem)', tag: 'NOWY', build: buildHastatiOpus5 },
  { id: 'lucznik-nubijski', label: 'Łucznik nubijski', tag: 'ODNIESIENIE (wpięty)', build: buildNubianArcherOpus5 },
  { id: 'taran', label: 'Taran okuty', tag: 'ODNIESIENIE (wpięty)', build: buildTaranOkutyOpus5 },
];

const SQRT3 = Math.sqrt(3);
const ROW_DX = HEX_R * SQRT3; // odleglosc srodkow sasiednich heksow w rzedzie (styk bokami)
const N = UNITS.length;
const rowOffset = ((N - 1) / 2) * ROW_DX;

type Panel = {
  unit: Unit;
  x: number;
  hex: THREE.Mesh;
  pivot: THREE.Group;
  model: THREE.Group;
  label: HTMLDivElement;
};

const ownerColor = 0x2f6fd0;

const canvas = document.getElementById('cv') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const SKY_GAME = 0x78a7ff;
const GROUND_GAME = 0x6f9e4a;

const scene = new THREE.Scene();
scene.background = new THREE.Color(SKY_GAME);

// swiatla 1:1 ze scene.ts (styl 'roblox')
scene.add(new THREE.HemisphereLight(0xffffff, 0x88cc88, 1.05));
const sun = new THREE.DirectionalLight(0xfffef0, 1.25);
sun.position.set(60, 100, 40);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xbcd4ff, 0.35);
fill.position.set(-50, 60, -30);
scene.add(fill);

const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 200);

const labelsRoot = document.getElementById('labels') as HTMLDivElement;

const panels: Panel[] = [];
UNITS.forEach((unit, i) => {
  const x = i * ROW_DX - rowOffset;

  const hexGeo = new THREE.CylinderGeometry(HEX_R, HEX_R, 0.06, 6);
  const hex = new THREE.Mesh(hexGeo, new THREE.MeshStandardMaterial({ color: GROUND_GAME, roughness: 0.95 }));
  hex.position.set(x, -0.03, 0);
  scene.add(hex);

  const pivot = new THREE.Group();
  pivot.position.set(x, 0, 0);
  scene.add(pivot);
  const model = unit.build(ownerColor);
  pivot.add(model);

  const label = document.createElement('div');
  label.className = 'lbl' + (unit.tag.startsWith('ODNIESIENIE') ? ' ref' : '');
  label.innerHTML = `<b>${unit.label}</b><span>${unit.tag}</span>`;
  labelsRoot.appendChild(label);

  panels.push({ unit, x, hex, pivot, model, label });
});

function updateLabels(): void {
  const v = new THREE.Vector3();
  const w = canvas.clientWidth || 1;
  const h = canvas.clientHeight || 1;
  for (const p of panels) {
    v.set(p.x, 0, 0.55);
    v.project(camera);
    const sx = (v.x * 0.5 + 0.5) * w;
    const sy = (-v.y * 0.5 + 0.5) * h;
    p.label.style.left = `${sx}px`;
    p.label.style.top = `${sy}px`;
    p.label.style.display = v.z > 1 ? 'none' : 'block';
  }
}

// UWAGA: promien bryly liczony jest wzgledem LOKALNEGO ukladu modelu (pivot
// = srodek wlasnego heksu), NIE wzgledem globalnego (0,0,0) sceny — bo kazdy
// panel siedzi na innym x. measureLocal() mnozy world-matrix mesha przez
// odwrotnosc world-matrix pivota, zeby dostac wspolrzedne wzgledem hex-center.
function measureLocal(model: THREE.Group): {
  mesh: number; tri: number; maxR: number; minY: number; maxY: number;
} {
  model.updateMatrixWorld(true);
  let mesh = 0;
  let tri = 0;
  let maxR = 0;
  let minY = Infinity;
  let maxY = -Infinity;
  const v = new THREE.Vector3();
  const pivotWorldInverse = new THREE.Matrix4();
  const pivot = model.parent as THREE.Group; // pivot jest bezposrednim rodzicem
  pivot.updateMatrixWorld(true);
  pivotWorldInverse.copy(pivot.matrixWorld).invert();
  model.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    mesh++;
    const geo = m.geometry;
    const pos = geo.attributes['position'];
    if (!pos) return;
    tri += geo.index ? geo.index.count / 3 : pos.count / 3;
    m.updateWorldMatrix(true, false);
    const toLocal = new THREE.Matrix4().multiplyMatrices(pivotWorldInverse, m.matrixWorld);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      v.applyMatrix4(toLocal);
      const rr = Math.hypot(v.x, v.z);
      if (rr > maxR) maxR = rr;
      if (v.y < minY) minY = v.y;
      if (v.y > maxY) maxY = v.y;
    }
  });
  return { mesh, tri: Math.round(tri), maxR, minY, maxY };
}

function measureAll(): Record<string, unknown>[] {
  return panels.map((p) => {
    const m = measureLocal(p.model);
    return {
      id: p.unit.id,
      label: p.unit.label,
      tag: p.unit.tag,
      mesh: m.mesh,
      tri: m.tri,
      heightRatio: m.maxY / HEX_R,
      maxRadiusRatio: m.maxR / HEX_R,
      minY: m.minY,
      maxY: m.maxY,
    };
  });
}

function setOverview(): void {
  const el = THREE.MathUtils.degToRad(52);
  const target = new THREE.Vector3(0, 0.32, 0);
  const dist = 15.5;
  camera.position.set(target.x, target.y + Math.sin(el) * dist, target.z + Math.cos(el) * dist);
  camera.lookAt(target);
  resize();
}

function setFocus(i: number, distOverride?: number): void {
  const p = panels[i];
  if (!p) return;
  const el = THREE.MathUtils.degToRad(52);
  const m = measureLocal(p.model);
  const height = m.maxY;
  const width = m.maxR * 2;
  const size = Math.max(height, width) * 1.5;
  const halfV = THREE.MathUtils.degToRad(camera.fov / 2);
  const dist = distOverride ?? Math.max(0.9, (size / 2) / Math.tan(halfV));
  const targetY = (m.minY + m.maxY) / 2;
  const target = new THREE.Vector3(p.x, targetY, 0);
  camera.position.set(target.x, target.y + Math.sin(el) * dist, target.z + Math.cos(el) * dist);
  camera.lookAt(target);
  resize();
}

function resize(): void {
  const w = canvas.clientWidth || 1;
  const h = canvas.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', () => { resize(); render(); });

function render(): void {
  updateLabels();
  renderer.render(scene, camera);
}

setOverview();
resize();
render();

(window as unknown as { __demo: unknown }).__demo = {
  setOverview: () => { setOverview(); render(); },
  setFocus: (i: number, dist?: number) => { setFocus(i, dist); render(); },
  measureAll,
  count: N,
  ids: UNITS.map((u) => u.id),
  render,
};
