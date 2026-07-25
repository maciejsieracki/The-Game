/**
 * .kamien-zulu-taran-preview-entry.ts — entry TYLKO do podgladu porownawczego
 * (dyspozycje/PODGLAD-KAMIEN-ZULU-TARAN.html). Nie jest czescia gry.
 *
 * REGENERACJA PODGLADU (z katalogu gra/, BEZ npm run build — nie odpala
 * prebuild/export-data.py, wiec nie nadpisuje JSON-ow w gra/data):
 *
 *   node -e "const e=require('./node_modules/esbuild'),f=require('fs');
 *   const p='../dyspozycje/PODGLAD-KAMIEN-ZULU-TARAN.html';
 *   const s=f.readFileSync(p,'utf8');
 *   const i=s.indexOf('<script>'), j=s.lastIndexOf('<\/script>');
 *   const js=e.buildSync({entryPoints:['tools/.kamien-zulu-taran-preview-entry.ts'],
 *     bundle:true,platform:'browser',format:'iife',target:'es2020',
 *     minify:true,write:false}).outputFiles[0].text;
 *   f.writeFileSync(p, s.slice(0,i)+'<script>'+js+'<\/script>'+s.slice(j+9));"
 *
 * ⚠️ NIE uzywaj tu String.replace(regex, '<script>'+js+'<\/script>') — tak
 *    robi .hastati-preview-entry.ts i to PUAPKA: zminifikowany bundle zawiera
 *    sekwencje $' oraz $` , ktore replace traktuje jako wzorce specjalne
 *    (tekst po/przed dopasowaniem). Efekt: plik podgladu puchnie 3x i dostaje
 *    kilka zduplikowanych znacznikow <script> — sprawdzone, zdarzylo sie tutaj.
 *    Ciecie po indeksach (powyzej) jest odporne.
 *
 * (Szkielet HTML — style, podpisy, przyciski — jest w samym pliku podgladu;
 * powyzsze podmienia tylko wklejony inline bundle.)
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildZuluJavelineer } from '../src/render/jednostki-p3-dystans';
import { buildBatteringRam } from '../src/render/jednostki-p57-wlocznie-machiny';
import {
  buildZuluJavelineerOpus5,
  buildBatteringRamOpus5,
} from '../src/render/kamien-zulu-taran-opus5';

const HEX_R = 1.0;

type Panel = {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  pivot: THREE.Group;
  model: THREE.Group;
  build: (c: number) => THREE.Group;
  hex: THREE.Mesh;
  canvas: HTMLCanvasElement;
  id: string;
};

const SKY_GAME = 0x78a7ff;      // palette.sky (styl 'roblox' z mapRenderStyle.ts)
const SKY_STUDIO = 0x1b2128;
const GROUND_GAME = 0x6f9e4a;   // trawa

let ownerColor = 0x2f6fd0;
let bgGame = false;
let spin = true;
let angle = 0;

const panels: Panel[] = [];

// ── kamera WSPOLNA dla wszystkich paneli (gwarancja identycznego ujecia) ───
const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);

function makeLights(scene: THREE.Scene): void {
  // 1:1 ze scene.ts (renderStyle === 'roblox')
  scene.add(new THREE.HemisphereLight(0xffffff, 0x88cc88, 1.05));
  const sun = new THREE.DirectionalLight(0xfffef0, 1.25);
  sun.position.set(60, 100, 40);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xbcd4ff, 0.35);
  fill.position.set(-50, 60, -30);
  scene.add(fill);
}

function makePanel(canvas: HTMLCanvasElement, id: string, build: (c: number) => THREE.Group): Panel {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;   // jak w grze
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY_STUDIO);
  makeLights(scene);

  // heks pod modelem — pokazuje czytelnosc w realnej skali pola (R = 1)
  const hexGeo = new THREE.CylinderGeometry(HEX_R, HEX_R, 0.06, 6);
  const hex = new THREE.Mesh(hexGeo, new THREE.MeshStandardMaterial({ color: 0x45505c, roughness: 0.95 }));
  hex.position.y = -0.03;
  scene.add(hex);

  const pivot = new THREE.Group();
  scene.add(pivot);
  const model = build(ownerColor);
  pivot.add(model);

  return { scene, renderer, pivot, model, build, hex, canvas, id };
}

function disposeGroup(g: THREE.Group): void {
  const mats = g.userData['mats'] as THREE.Material[] | undefined;
  if (mats) { for (const m of mats) m.dispose(); }
  const geos = g.userData['perTokenGeos'] as THREE.BufferGeometry[] | undefined;
  if (geos) { for (const q of geos) q.dispose(); }
}

function rebuild(): void {
  for (const p of panels) {
    p.pivot.remove(p.model);
    disposeGroup(p.model);
    p.model = p.build(ownerColor);
    p.pivot.add(p.model);
  }
  updateStats();
}

function countOf(g: THREE.Group): { mesh: number; tri: number; mat: number } {
  let mesh = 0, tri = 0;
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      mesh++;
      const geo = m.geometry;
      tri += geo.index ? geo.index.count / 3 : geo.attributes['position']!.count / 3;
    }
  });
  const mats = g.userData['mats'] as THREE.Material[] | undefined;
  return { mesh, tri: Math.round(tri), mat: mats ? mats.length : 0 };
}

function setText(id: string, s: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = s;
}

function updateStats(): void {
  for (const p of panels) {
    const c = countOf(p.model);
    const box = new THREE.Box3().setFromObject(p.model);
    const sz = box.getSize(new THREE.Vector3());
    setText(`stat-${p.id}-mesh`, String(c.mesh));
    setText(`stat-${p.id}-tri`, String(c.tri));
    setText(`stat-${p.id}-mat`, String(c.mat));
    setText(`stat-${p.id}-h`, (box.max.y / HEX_R).toFixed(3));
    setText(`stat-${p.id}-bb`,
      `${(sz.x / HEX_R).toFixed(2)}×${(sz.y / HEX_R).toFixed(2)}×${(sz.z / HEX_R).toFixed(2)}`);
  }
}

// ── ujecia ────────────────────────────────────────────────────────────────
const TARGET = new THREE.Vector3(0, 0.33, 0);

function setView(kind: string): void {
  const el = THREE.MathUtils.degToRad(kind === 'gra' ? 52 : kind === 'oko' ? 12 : 28);
  const dist = kind === 'gra' ? 1.70 : kind === 'oko' ? 1.52 : 1.44;
  camera.position.set(0, TARGET.y + Math.sin(el) * dist, Math.cos(el) * dist);
  controls.target.copy(TARGET);
  controls.update();
}

// ── init ──────────────────────────────────────────────────────────────────
const specs: [string, (c: number) => THREE.Group][] = [
  ['za', buildZuluJavelineer],
  ['zb', buildZuluJavelineerOpus5],
  ['ta', buildBatteringRam],
  ['tb', buildBatteringRamOpus5],
];
for (const [id, build] of specs) {
  const cv = document.getElementById(`cv-${id}`) as HTMLCanvasElement | null;
  if (cv) panels.push(makePanel(cv, id, build));
}

// OrbitControls na nakladce obejmujacej WSZYSTKIE panele → jedna kamera
const overlay = document.getElementById('orbit-overlay') as HTMLElement;
const controls = new OrbitControls(camera, overlay);
controls.enablePan = false;
controls.minDistance = 0.7;
controls.maxDistance = 6;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
setView('gra');
updateStats();

function resize(): void {
  for (const p of panels) {
    const w = p.canvas.clientWidth, h = p.canvas.clientHeight;
    if (w === 0 || h === 0) continue;
    p.renderer.setSize(w, h, false);
  }
  const first = panels[0];
  if (!first) return;
  const w = first.canvas.clientWidth || 1, h = first.canvas.clientHeight || 1;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

let last = performance.now();
function tick(): void {
  requestAnimationFrame(tick);
  const now = performance.now();
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (spin) angle += dt * 0.5;
  resize();
  controls.update();
  for (const p of panels) {
    p.pivot.rotation.y = angle;
    p.renderer.render(p.scene, camera);
  }
}
tick();

// ── sterowanie ────────────────────────────────────────────────────────────
function on(id: string, ev: string, fn: (e: Event) => void): void {
  const el = document.getElementById(id);
  if (el) el.addEventListener(ev, fn);
}

on('btn-spin', 'click', () => {
  spin = !spin;
  setText('btn-spin', spin ? 'Obrót: WŁ' : 'Obrót: WYŁ');
});
on('btn-face', 'click', () => {
  angle = 0;
  spin = false;
  setText('btn-spin', 'Obrót: WYŁ');
});
for (const v of ['gra', 'front', 'oko']) {
  on(`view-${v}`, 'click', () => {
    setView(v);
    document.querySelectorAll('.viewbtn').forEach((b) => b.classList.remove('on'));
    document.getElementById(`view-${v}`)?.classList.add('on');
  });
}
on('btn-bg', 'click', () => {
  bgGame = !bgGame;
  for (const p of panels) {
    (p.scene.background as THREE.Color).set(bgGame ? SKY_GAME : SKY_STUDIO);
    (p.hex.material as THREE.MeshStandardMaterial).color.set(bgGame ? GROUND_GAME : 0x45505c);
  }
  setText('btn-bg', bgGame ? 'Tło: gra' : 'Tło: studio');
});
on('btn-hex', 'click', () => {
  const first = panels[0];
  if (!first) return;
  const vis = !first.hex.visible;
  for (const p of panels) p.hex.visible = vis;
  setText('btn-hex', vis ? 'Heks: WŁ' : 'Heks: WYŁ');
});
on('col', 'input', (e) => {
  ownerColor = parseInt((e.target as HTMLInputElement).value.slice(1), 16);
  rebuild();
});
for (const [id, hex] of [['sw-blue', '#2f6fd0'], ['sw-red', '#b6342a'],
                         ['sw-green', '#2f8a4a'], ['sw-yellow', '#d8b040']] as [string, string][]) {
  on(id, 'click', () => {
    ownerColor = parseInt(hex.slice(1), 16);
    const inp = document.getElementById('col') as HTMLInputElement | null;
    if (inp) inp.value = hex;
    rebuild();
  });
}
