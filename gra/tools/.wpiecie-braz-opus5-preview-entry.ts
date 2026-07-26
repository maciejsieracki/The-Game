/**
 * .wpiecie-braz-opus5-preview-entry.ts — entry TYLKO do weryfikacji wizualnej
 * wpięcia piątki modeli Brązu/Żelaza Opus 5 (2026-07-26). Nie jest częścią gry,
 * nic z tego pliku nie importuje units.ts ani main.ts.
 *
 * Różnica wobec .piatka-braz-opus5-preview-entry.ts: kamera jest DOPASOWANA do
 * szerokości rzędu (poprzedni podgląd stał 15,5 j. od celu i modele były na
 * zrzucie wielkości paznokcia — nie dało się ocenić ani broni, ani tarcz).
 * Tutaj dystans liczy się z szerokości rzędu i FOV, więc rząd wypełnia kadr.
 *
 * 7 modeli na STYKAJĄCYCH SIĘ heksach (dx = HEX_R*sqrt(3), jak axialToWorld),
 * kąt kamery 52° (jak w grze), światła 1:1 ze scene.ts (styl „roblox").
 * Kolejność: 5 wpinanych (Włócznik, Miecznik, Procarz, Rydwan na wołach,
 * Hastati) + 2 ODNIESIENIA już wpięte wcześniej (Łucznik nubijski, Taran okuty).
 *
 * REGENERACJA (z katalogu gra/, BEZ npm run build/dev):
 *   node tools/build-wpiecie-braz-opus5-preview.cjs
 *   node tools/capture-wpiecie-braz-opus5.cjs <katalog-na-zrzuty>
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

type Unit = { id: string; label: string; tag: string; build: (c: number) => THREE.Group };

const UNITS: Unit[] = [
  { id: 'wlocznik', label: 'Włócznik', tag: 'WPINANY', build: buildWlocznikBrazOpus5 },
  { id: 'miecznik', label: 'Wojownik z mieczem i tarczą', tag: 'WPINANY', build: buildMiecznikBrazOpus5 },
  { id: 'procarz', label: 'Procarz', tag: 'WPINANY', build: buildProcarzBrazOpus5 },
  { id: 'rydwan', label: 'Rydwan (woły)', tag: 'WPINANY', build: buildRydwanWolyBrazOpus5 },
  { id: 'hastati', label: 'Hastati (Żelazo)', tag: 'WPINANY', build: buildHastatiOpus5 },
  { id: 'lucznik-nubijski', label: 'Łucznik nubijski', tag: 'ODNIESIENIE', build: buildNubianArcherOpus5 },
  { id: 'taran', label: 'Taran okuty', tag: 'ODNIESIENIE', build: buildTaranOkutyOpus5 },
];

const SQRT3 = Math.sqrt(3);
const ROW_DX = HEX_R * SQRT3;
const N = UNITS.length;
const rowOffset = ((N - 1) / 2) * ROW_DX;

type Panel = { unit: Unit; x: number; pivot: THREE.Group; model: THREE.Group; label: HTMLDivElement };

const canvas = document.getElementById('cv') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x78a7ff);
scene.add(new THREE.HemisphereLight(0xffffff, 0x88cc88, 1.05));
const sun = new THREE.DirectionalLight(0xfffef0, 1.25);
sun.position.set(60, 100, 40);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xbcd4ff, 0.35);
fill.position.set(-50, 60, -30);
scene.add(fill);

const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 200);
const labelsRoot = document.getElementById('labels') as HTMLDivElement;
const ownerColor = 0x2f6fd0;

const panels: Panel[] = [];
UNITS.forEach((unit, i) => {
  const x = i * ROW_DX - rowOffset;
  // heks pointy-top: CylinderGeometry(6) daje flat-top, więc obrót o 30°
  const hex = new THREE.Mesh(
    new THREE.CylinderGeometry(HEX_R, HEX_R, 0.06, 6),
    new THREE.MeshStandardMaterial({ color: 0x6f9e4a, roughness: 0.95 }),
  );
  hex.position.set(x, -0.03, 0);
  scene.add(hex);

  // OKRAG WPISANY w heks (r=0.866*HEX_R) na poziomie gruntu — żeby na zrzucie było widać, czy broń albo
  // koła wychodzą poza własne pole (promień wpisany = 0.866*HEX_R).
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(HEX_R * 0.858, HEX_R * 0.866, 72),
    new THREE.MeshBasicMaterial({ color: 0xff2b2b, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.012, 0);
  scene.add(ring);

  const pivot = new THREE.Group();
  pivot.position.set(x, 0, 0);
  scene.add(pivot);
  const model = unit.build(ownerColor);
  pivot.add(model);

  const label = document.createElement('div');
  label.className = 'lbl' + (unit.tag === 'ODNIESIENIE' ? ' ref' : '');
  label.innerHTML = `<b>${unit.label}</b><span>${unit.tag}</span>`;
  labelsRoot.appendChild(label);

  panels.push({ unit, x, pivot, model, label });
});

function updateLabels(): void {
  const v = new THREE.Vector3();
  const w = canvas.clientWidth || 1;
  const h = canvas.clientHeight || 1;
  for (const p of panels) {
    v.set(p.x, 0, 0.95);
    v.project(camera);
    p.label.style.left = `${(v.x * 0.5 + 0.5) * w}px`;
    p.label.style.top = `${(-v.y * 0.5 + 0.5) * h}px`;
    p.label.style.display = v.z > 1 ? 'none' : 'block';
  }
}

function measureLocal(model: THREE.Group): { mesh: number; tri: number; maxR: number; minY: number; maxY: number } {
  model.updateMatrixWorld(true);
  let mesh = 0, tri = 0, maxR = 0, minY = Infinity, maxY = -Infinity;
  const v = new THREE.Vector3();
  const pivot = model.parent as THREE.Group;
  pivot.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(pivot.matrixWorld).invert();
  model.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    mesh++;
    const pos = m.geometry.attributes['position'];
    if (!pos) return;
    tri += m.geometry.index ? m.geometry.index.count / 3 : pos.count / 3;
    m.updateWorldMatrix(true, false);
    const toLocal = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(toLocal);
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
      id: p.unit.id, label: p.unit.label, tag: p.unit.tag,
      mesh: m.mesh, tri: m.tri,
      heightRatio: m.maxY / HEX_R, maxRadiusRatio: m.maxR / HEX_R,
      minY: m.minY, maxY: m.maxY,
    };
  });
}

const EL = THREE.MathUtils.degToRad(52);

/** Kadr na CAŁY rząd: dystans policzony z szerokości rzędu i poziomego FOV. */
function setOverview(): void {
  const w = canvas.clientWidth || 1;
  const h = canvas.clientHeight || 1;
  const halfV = THREE.MathUtils.degToRad(camera.fov / 2);
  const halfH = Math.atan(Math.tan(halfV) * (w / h));
  const rowHalf = rowOffset + HEX_R * 1.02;              // pół szerokości rzędu + margines
  const distH = rowHalf / Math.tan(halfH);
  const distV = (1.05 * HEX_R) / Math.tan(halfV);        // żeby zmieściła się wysokość figur
  const dist = Math.max(distH, distV) * 1.02;
  const target = new THREE.Vector3(0, 0.36, 0);
  camera.position.set(target.x, target.y + Math.sin(EL) * dist, target.z + Math.cos(EL) * dist);
  camera.lookAt(target);
  resize();
}

function setFocus(i: number, distOverride?: number): void {
  const p = panels[i];
  if (!p) return;
  const m = measureLocal(p.model);
  const size = Math.max(m.maxY, m.maxR * 2) * 1.35;
  const halfV = THREE.MathUtils.degToRad(camera.fov / 2);
  const dist = distOverride ?? Math.max(0.9, (size / 2) / Math.tan(halfV));
  const target = new THREE.Vector3(p.x, (m.minY + m.maxY) / 2, 0);
  camera.position.set(target.x, target.y + Math.sin(EL) * dist, target.z + Math.cos(EL) * dist);
  camera.lookAt(target);
  resize();
}

/** Kadr niemal z boku (elewacja 12°) — do sprawdzenia wysokości tarczy/broni. */
function setSide(i: number): void {
  const p = panels[i];
  if (!p) return;
  const m = measureLocal(p.model);
  const el = THREE.MathUtils.degToRad(12);
  const halfV = THREE.MathUtils.degToRad(camera.fov / 2);
  const dist = Math.max(0.9, (Math.max(m.maxY, m.maxR * 2) * 1.3 / 2) / Math.tan(halfV));
  const target = new THREE.Vector3(p.x, (m.minY + m.maxY) / 2, 0);
  camera.position.set(target.x + Math.cos(el) * dist * 0.92, target.y + Math.sin(el) * dist, target.z + Math.cos(el) * dist * 0.38);
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

resize();
setOverview();
render();

(window as unknown as { __demo: unknown }).__demo = {
  setOverview: () => { setOverview(); render(); },
  setFocus: (i: number, dist?: number) => { setFocus(i, dist); render(); },
  setSide: (i: number) => { setSide(i); render(); },
  measureAll,
  count: N,
  ids: UNITS.map((u) => u.id),
  render,
};
