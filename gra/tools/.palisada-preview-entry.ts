/**
 * .palisada-preview-entry.ts — podgląd miasta z palisadą (Kamień + propozycja Brąz).
 * Tylko narzędzie preview — nie importowany przez grę.
 *
 * REGENERACJA (z katalogu gra/):
 *   node tools/build-palisada-preview.cjs
 *   node tools/capture-palisada-preview.cjs
 */
import * as THREE from 'three';
import { HEX_R } from '../src/render/hexutil';
import { buildMiastoKamien } from '../src/render/miasto-kamien';
import { buildMiastoBraz } from '../src/render/miasto-braz';

type SceneKind = 'kamien' | 'braz' | 'both';

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
const ownerColor = 0xffd54a;
const LEVEL = 6;

type Panel = {
  id: string;
  label: string;
  tag: string;
  x: number;
  pivot: THREE.Group;
  model: THREE.Group;
  labelEl: HTMLDivElement;
};

const panels: Panel[] = [];

function tintBrown(obj: THREE.Object3D, amount = 0.38): void {
  const warm = new THREE.Color(0x9a6b3a);
  obj.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = mesh.material as THREE.MeshLambertMaterial;
    if (!mat?.color) return;
    mat.color.lerp(warm, amount);
  });
}

/** Tylko pierścień palisady z buildMiastoKamien (bez zabudowy wewnętrznej). */
function buildPalisadeRingOnly(level: number, brownTint = false): THREE.Group {
  const shell = buildMiastoKamien(level, { mur: true, color: ownerColor });
  const inner = shell.children[0] as THREE.Group;
  while (inner.children.length > 1) inner.remove(inner.children[0]);
  if (brownTint) tintBrown(inner, 0.42);
  return shell;
}

function buildBronzeProposal(): THREE.Group {
  const root = new THREE.Group();
  const city = buildMiastoBraz('rzym', LEVEL, { mur: false, color: ownerColor });
  const ring = buildPalisadeRingOnly(LEVEL, true);
  root.add(city);
  root.add(ring);
  return root;
}

function addHex(x: number): void {
  const hex = new THREE.Mesh(
    new THREE.CylinderGeometry(HEX_R, HEX_R, 0.06, 6),
    new THREE.MeshStandardMaterial({ color: 0x6f9e4a, roughness: 0.95 }),
  );
  hex.position.set(x, -0.03, 0);
  scene.add(hex);
}

function addPanel(id: string, label: string, tag: string, x: number, model: THREE.Group): void {
  addHex(x);
  const pivot = new THREE.Group();
  pivot.position.set(x, 0, 0);
  scene.add(pivot);
  pivot.add(model);

  const labelEl = document.createElement('div');
  labelEl.className = 'lbl' + (tag.includes('PROPOZYCJA') ? ' prop' : '');
  labelEl.innerHTML = `<b>${label}</b><span>${tag}</span>`;
  labelsRoot.appendChild(labelEl);

  panels.push({ id, label, tag, x, pivot, model, labelEl });
}

const SQRT3 = Math.sqrt(3);
const ROW_DX = HEX_R * SQRT3;

function buildPanels(kind: SceneKind): void {
  scene.clear();
  panels.length = 0;
  labelsRoot.innerHTML = '';
  scene.background = new THREE.Color(0x78a7ff);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x88cc88, 1.05));
  scene.add(sun);
  scene.add(fill);

  if (kind === 'kamien' || kind === 'both') {
    const x = kind === 'both' ? -ROW_DX / 2 : 0;
    addPanel(
      'kamien',
      'Miasto epoki Kamienia',
      'Palisada drewniana (model gry)',
      x,
      buildMiastoKamien(LEVEL, { mur: true, color: ownerColor }),
    );
  }
  if (kind === 'braz' || kind === 'both') {
    const x = kind === 'both' ? ROW_DX / 2 : 0;
    addPanel(
      'braz',
      'Miasto epoki Brązu',
      'PROPOZYCJA — palisada ubrązowiona',
      x,
      buildBronzeProposal(),
    );
  }
}

function updateLabels(): void {
  const v = new THREE.Vector3();
  const w = canvas.clientWidth || 1;
  const h = canvas.clientHeight || 1;
  for (const p of panels) {
    v.set(p.x, 0, 0.95);
    v.project(camera);
    p.labelEl.style.left = `${(v.x * 0.5 + 0.5) * w}px`;
    p.labelEl.style.top = `${(-v.y * 0.5 + 0.5) * h}px`;
    p.labelEl.style.display = v.z > 1 ? 'none' : 'block';
  }
}

function measureLocal(model: THREE.Group): { maxR: number; minY: number; maxY: number } {
  model.updateMatrixWorld(true);
  let maxR = 0, minY = Infinity, maxY = -Infinity;
  const v = new THREE.Vector3();
  const pivot = model.parent as THREE.Group;
  pivot.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(pivot.matrixWorld).invert();
  model.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const pos = m.geometry.attributes['position'];
    if (!pos) return;
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
  return { maxR, minY, maxY };
}

const EL = THREE.MathUtils.degToRad(52);

function setOverview(): void {
  const w = canvas.clientWidth || 1;
  const h = canvas.clientHeight || 1;
  const halfV = THREE.MathUtils.degToRad(camera.fov / 2);
  const halfH = Math.atan(Math.tan(halfV) * (w / h));
  const n = panels.length;
  const rowHalf = n > 1 ? ROW_DX / 2 + HEX_R * 1.02 : HEX_R * 1.02;
  const distH = rowHalf / Math.tan(halfH);
  const distV = (1.05 * HEX_R) / Math.tan(halfV);
  const dist = Math.max(distH, distV) * 1.04;
  const target = new THREE.Vector3(0, 0.32, 0);
  camera.position.set(target.x, target.y + Math.sin(EL) * dist, target.z + Math.cos(EL) * dist);
  camera.lookAt(target);
  resize();
}

function setFocus(id: string): void {
  const p = panels.find((x) => x.id === id);
  if (!p) return;
  const m = measureLocal(p.model);
  const size = Math.max(m.maxY, m.maxR * 2) * 1.35;
  const halfV = THREE.MathUtils.degToRad(camera.fov / 2);
  const dist = Math.max(0.9, (size / 2) / Math.tan(halfV));
  const target = new THREE.Vector3(p.x, (m.minY + m.maxY) / 2, 0);
  camera.position.set(target.x, target.y + Math.sin(EL) * dist, target.z + Math.cos(EL) * dist);
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

let currentKind: SceneKind = 'both';

function setKind(kind: SceneKind): void {
  currentKind = kind;
  buildPanels(kind);
  setOverview();
  render();
}

resize();
setKind('both');

document.body.dataset.ready = '1';

(window as unknown as { __demo: unknown }).__demo = {
  setKind,
  setOverview: () => { setOverview(); render(); },
  setFocus: (id: string) => { setFocus(id); render(); },
  render,
  getKind: () => currentKind,
};
