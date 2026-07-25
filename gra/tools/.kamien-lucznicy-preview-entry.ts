/**
 * .kamien-lucznicy-preview-entry.ts — entry TYLKO do podgladu porownawczego
 * (dyspozycje/PODGLAD-KAMIEN-LUCZNICY.html). Nie jest czescia gry.
 *
 * 4 panele, WSPOLNA kamera i wspolne swiatla (1:1 ze scene.ts, styl 'roblox'):
 *   [Egipt OBECNY] [Egipt OPUS 5]
 *   [Sumer OBECNY] [Sumer OPUS 5]
 *
 * REGENERACJA PODGLADU (z katalogu gra/, BEZ npm run build — nie odpala
 * prebuild/export-data.py, wiec nie nadpisuje JSON-ow w gra/data):
 *
 *   node -e "const e=require('./node_modules/esbuild'),f=require('fs');
 *   const js=e.buildSync({entryPoints:['tools/.kamien-lucznicy-preview-entry.ts'],
 *     bundle:true,platform:'browser',format:'iife',target:'es2020',
 *     minify:true,write:false}).outputFiles[0].text;
 *   const p='../dyspozycje/PODGLAD-KAMIEN-LUCZNICY.html';
 *   f.writeFileSync(p,f.readFileSync(p,'utf8').replace(/<script>[\s\S]*<\/script>/,
 *     '<script>'+js+'</script>'));"
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildEgyptianArcher, buildSumerianArcher } from '../src/render/jednostki-p3-dystans';
import { buildEgyptianArcherOpus5, buildSumerianArcherOpus5 } from '../src/render/kamien-lucznicy-opus5';

const HEX_R = 1.0;

type Panel = {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  pivot: THREE.Group;
  model: THREE.Group;
  build: (c: number) => THREE.Group;
  hex: THREE.Mesh;
  canvas: HTMLCanvasElement;
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

function makePanel(canvas: HTMLCanvasElement, build: (c: number) => THREE.Group): Panel {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;   // jak w grze
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY_STUDIO);
  makeLights(scene);

  // heks pod figurka — pokazuje czytelnosc w realnej skali pola
  const hexGeo = new THREE.CylinderGeometry(HEX_R, HEX_R, 0.06, 6);
  const hex = new THREE.Mesh(hexGeo, new THREE.MeshStandardMaterial({ color: 0x45505c, roughness: 0.95 }));
  hex.position.y = -0.03;
  scene.add(hex);

  const pivot = new THREE.Group();
  scene.add(pivot);
  const model = build(ownerColor);
  pivot.add(model);

  return { scene, renderer, pivot, model, build, hex, canvas };
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
  const names = ['a', 'b', 'c', 'd'];
  panels.forEach((p, i) => {
    const c = countOf(p.model);
    const box = new THREE.Box3().setFromObject(p.model);
    setText(`stat-${names[i]}-mesh`, String(c.mesh));
    setText(`stat-${names[i]}-tri`, String(c.tri));
    setText(`stat-${names[i]}-mat`, String(c.mat));
    setText(`stat-${names[i]}-h`, (box.max.y / HEX_R).toFixed(3));
  });
}

// ── ujecia ────────────────────────────────────────────────────────────────
const TARGET = new THREE.Vector3(0, 0.37, 0);

function setView(kind: string): void {
  const el = THREE.MathUtils.degToRad(kind === 'gra' ? 52 : kind === 'oko' ? 12 : 28);
  const dist = kind === 'gra' ? 1.60 : kind === 'oko' ? 1.42 : 1.34;
  camera.position.set(0, TARGET.y + Math.sin(el) * dist, Math.cos(el) * dist);
  controls.target.copy(TARGET);
  controls.update();
}

// ── init ──────────────────────────────────────────────────────────────────
const canvasA = document.getElementById('cv-a') as HTMLCanvasElement;
const canvasB = document.getElementById('cv-b') as HTMLCanvasElement;
const canvasC = document.getElementById('cv-c') as HTMLCanvasElement;
const canvasD = document.getElementById('cv-d') as HTMLCanvasElement;
panels.push(makePanel(canvasA, buildEgyptianArcher));
panels.push(makePanel(canvasB, buildEgyptianArcherOpus5));
panels.push(makePanel(canvasC, buildSumerianArcher));
panels.push(makePanel(canvasD, buildSumerianArcherOpus5));

// OrbitControls na nakladce obejmujacej WSZYSTKIE panele → jedno ujecie
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
  const w = canvasA.clientWidth || 1, h = canvasA.clientHeight || 1;
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
on('col', 'input', (e) => {
  ownerColor = parseInt((e.target as HTMLInputElement).value.slice(1), 16);
  rebuild();
});
on('btn-hex', 'click', () => {
  const vis = !panels[0]!.hex.visible;
  for (const p of panels) p.hex.visible = vis;
  setText('btn-hex', vis ? 'Heks: WŁ' : 'Heks: WYŁ');
});

// ── deterministyczny zrzut do screenshotow (playwright) ───────────────────
(window as unknown as { setPreview: (deg: number, spinOn: boolean, dist?: number) => void }).setPreview =
  (deg: number, spinOn: boolean, dist?: number): void => {
    spin = spinOn;
    angle = THREE.MathUtils.degToRad(deg);
    for (const p of panels) p.pivot.rotation.y = angle;
    if (dist !== undefined) {
      const dir = camera.position.clone().sub(TARGET).normalize();
      camera.position.copy(TARGET.clone().addScaledVector(dir, dist));
      controls.update();
    }
  };
