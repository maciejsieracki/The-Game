/**
 * .palisada-biskupin-preview-entry.ts — propozycja palisady w stylu Biskupin.
 * Tylko narzędzie preview — NIE importowany przez grę, NIE zmienia miasto-kamien.ts.
 *
 * REGENERACJA (z katalogu gra/):
 *   node tools/build-palisada-biskupin-preview.cjs
 *   node tools/capture-palisada-biskupin-preview.cjs
 */
import * as THREE from 'three';
import { HEX_R } from '../src/render/hexutil';
import { buildMiastoKamien, rozmiarDlaPoziomu } from '../src/render/miasto-kamien';

type SceneKind = 'kamien' | 'braz' | 'both';

const canvas = document.getElementById('cv') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6a9ec8);
scene.fog = new THREE.Fog(0x6a9ec8, 8, 28);

const sun = new THREE.DirectionalLight(0xfff8e8, 1.3);
sun.position.set(50, 90, 35);
const fill = new THREE.DirectionalLight(0xb8d4ff, 0.4);
fill.position.set(-40, 50, -25);
const hemi = new THREE.HemisphereLight(0xe8f0ff, 0x5a7a3a, 0.85);

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

function mat(c: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color: c, flatShading: true });
}

const azXZ = (deg: number, r: number): { x: number; z: number } => ({
  x: r * Math.sin((deg * Math.PI) / 180),
  z: -r * Math.cos((deg * Math.PI) / 180),
});

interface BiskupinPalette {
  drewno: THREE.Material;
  drewnoDk: THREE.Material;
  drewnoHi: THREE.Material;
  ziemia: THREE.Material;
  ziemiaDk: THREE.Material;
  metal?: THREE.Material;
}

function makeBiskupinPalette(bronze = false): BiskupinPalette {
  if (bronze) {
    return {
      drewno: mat(0x5a4a3a),
      drewnoDk: mat(0x3d3228),
      drewnoHi: mat(0x6e5c48),
      ziemia: mat(0x4a5c38),
      ziemiaDk: mat(0x3a482c),
      metal: mat(0x3a3a42),
    };
  }
  return {
    drewno: mat(0x7a7268),
    drewnoDk: mat(0x5c554e),
    drewnoHi: mat(0x8f877c),
    ziemia: mat(0x6b7a4a),
    ziemiaDk: mat(0x556640),
  };
}

function B(
  g: THREE.Object3D, w: number, h: number, d: number,
  cx: number, cy: number, cz: number, m: THREE.Material,
  rx = 0, ry = 0, rz = 0,
): void {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(cx, cy, cz);
  if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  g.add(mesh);
}

/**
 * Palisada Biskupin: skarpa + żerdzie na skos + ściana belek + korona nierówna + brama.
 * Struktura referencyjna — propozycja UX, nie wal() z gry.
 */
function buildBiskupinWal(p: BiskupinPalette, r: number): THREE.Group {
  const g = new THREE.Group();
  const gapOd = 72;
  const gapDo = 108;
  const n = Math.max(20, Math.round(r * 64));

  // Skarpa — pierścień ziemi z lekkim nachyleniem na zewnątrz
  for (let i = 0; i < n; i++) {
    const az = (i / n) * 360;
    if (az > gapOd - 8 && az < gapDo + 8) continue;
    const { x, z } = azXZ(az, r * 0.92);
    const rad = (az * Math.PI) / 180;
    const segW = (2 * Math.PI * r * 0.92) / n * 1.15;
    B(g, segW, 0.055, 0.14, x, 0.027, z, i % 2 ? p.ziemia : p.ziemiaDk, 0, -az + 90, 0);
    // Żerdzie na skos (zewnętrzna korona skarpy)
    const lean = 0.55;
    const stakeH = 0.09 + 0.03 * ((i * 17) % 4) / 3;
    const sx = x + Math.sin(rad) * 0.06;
    const sz = z - Math.cos(rad) * 0.06;
    B(g, 0.022, stakeH, 0.022, sx, 0.04 + stakeH / 2, sz, p.drewnoDk,
      lean * Math.cos(rad), -az, lean * Math.sin(rad));
  }

  // Ściana — poziome belki + pionowe pale
  const wallR = r * 0.98;
  for (let i = 0; i < n; i++) {
    const az = (i / n) * 360;
    if (az > gapOd - 5 && az < gapDo + 5) continue;
    const { x, z } = azXZ(az, wallR);
    const rad = (az * Math.PI) / 180;
    // Pionowe pale co segment
    const postH = 0.19 + 0.04 * ((i * 23) % 5) / 4;
    B(g, 0.028, postH, 0.028, x, postH / 2 + 0.05, z, i % 3 ? p.drewno : p.drewnoDk);
    // Belki poziome (3 poziomy)
    if (i % 2 === 0) {
      const nextAz = ((i + 1) / n) * 360;
      if (nextAz > gapOd - 5 && nextAz < gapDo + 5) continue;
      const p2 = azXZ(nextAz, wallR);
      const mx = (x + p2.x) / 2;
      const mz = (z + p2.z) / 2;
      const dx = p2.x - x;
      const dz = p2.z - z;
      const len = Math.hypot(dx, dz) * 1.02;
      const ang = Math.atan2(dx, dz);
      for (const yOff of [0.09, 0.14, 0.19]) {
        B(g, 0.024, 0.022, len, mx, 0.05 + yOff, mz, p.drewnoHi, 0, ang, 0);
      }
      if (p.metal && i % 6 === 0) {
        B(g, 0.032, 0.012, 0.032, mx, 0.21, mz, p.metal);
      }
    }
  }

  // Korona — nierówne żerdzie nad murem
  for (let i = 0; i < n; i++) {
    const az = (i / n) * 360;
    if (az > gapOd - 6 && az < gapDo + 6) continue;
    const { x, z } = azXZ(az, wallR * 1.01);
    const crownH = 0.12 + 0.1 * ((i * 41) % 7) / 6;
    const tilt = 0.08 * (((i * 13) % 3) - 1);
    const rad = (az * Math.PI) / 180;
    B(g, 0.02, crownH, 0.02, x, 0.24 + crownH / 2, z, i % 2 ? p.drewnoHi : p.drewno,
      tilt * Math.cos(rad), -az, tilt * Math.sin(rad));
  }

  // Brama od +x
  const b1 = azXZ(gapOd, wallR);
  const b2 = azXZ(gapDo, wallR);
  B(g, 0.05, 0.26, 0.05, b1.x, 0.18, b1.z, p.drewnoDk);
  B(g, 0.05, 0.26, 0.05, b2.x, 0.18, b2.z, p.drewnoDk);
  const gateW = Math.hypot(b2.x - b1.x, b2.z - b1.z);
  B(g, gateW + 0.06, 0.04, 0.05, (b1.x + b2.x) / 2, 0.28, (b1.z + b2.z) / 2, p.drewnoHi);
  B(g, 0.06, 0.04, 0.06, b1.x, 0.02, b1.z, p.ziemiaDk);
  B(g, 0.06, 0.04, 0.06, b2.x, 0.02, b2.z, p.ziemiaDk);
  if (p.metal) {
    B(g, 0.04, 0.03, 0.04, b1.x, 0.14, b1.z, p.metal);
    B(g, 0.04, 0.03, 0.04, b2.x, 0.14, b2.z, p.metal);
  }

  return g;
}

function osWal(level: number): number {
  const rz = rozmiarDlaPoziomu(level);
  return rz === 'male' ? 0.37 : rz === 'srednie' ? 0.42 : 0.445;
}

function buildCityWithBiskupinWal(level: number, bronze = false): THREE.Group {
  const root = new THREE.Group();
  const city = buildMiastoKamien(level, { mur: false, color: ownerColor });
  const wal = buildBiskupinWal(makeBiskupinPalette(bronze), osWal(level));
  root.add(city);
  root.add(wal);
  return root;
}

function addTerrain(x: number): void {
  const hex = new THREE.Mesh(
    new THREE.CylinderGeometry(HEX_R, HEX_R, 0.06, 6),
    new THREE.MeshStandardMaterial({ color: 0x5f8e42, roughness: 0.95 }),
  );
  hex.position.set(x, -0.03, 0);
  scene.add(hex);

  // Pas wody za heksem (referencja Biskupin)
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(HEX_R * 4, HEX_R * 2.2),
    new THREE.MeshStandardMaterial({ color: 0x4a7a9a, roughness: 0.3, metalness: 0.1 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(x, -0.02, -HEX_R * 1.6);
  scene.add(water);

  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(HEX_R * 3.5, HEX_R * 1.2),
    new THREE.MeshStandardMaterial({ color: 0x6a9a48, roughness: 0.95 }),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(x, -0.015, HEX_R * 1.4);
  scene.add(grass);
}

function addPanel(id: string, label: string, tag: string, x: number, model: THREE.Group): void {
  addTerrain(x);
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
  scene.background = new THREE.Color(0x6a9ec8);
  scene.fog = new THREE.Fog(0x6a9ec8, 8, 28);
  scene.add(hemi);
  scene.add(sun);
  scene.add(fill);

  if (kind === 'kamien' || kind === 'both') {
    const x = kind === 'both' ? -ROW_DX / 2 : 0;
    addPanel(
      'kamien',
      'Kamień — styl Biskupin',
      'PROPOZYCJA — skarpa + belki + korona',
      x,
      buildCityWithBiskupinWal(LEVEL, false),
    );
  }
  if (kind === 'braz' || kind === 'both') {
    const x = kind === 'both' ? ROW_DX / 2 : 0;
    addPanel(
      'braz',
      'Brąz — styl Biskupin',
      'PROPOZYCJA — ciemniejsze drewno + okucia',
      x,
      buildCityWithBiskupinWal(LEVEL, true),
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
