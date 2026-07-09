/**
 * podglad-sektory/main.ts — samodzielny mini-świat do OCENY układu sektorowego ulepszeń
 * ZANIM wbudujemy go do gry. Renderuje kilkanaście przykładowych heksów (teren + zestaw
 * współistniejących ulepszeń) używając PRAWDZIWYCH modeli z gry (buildImprovementSectored).
 * Nie dotyka silnika — czysty podgląd render. Maciej 2026-07-09.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildImprovementSectored, buildImprovement, type ImprovementKey } from '../src/render/improvements';

// --- kolory terenów (spójne z grą) ---
const TERR = {
  laka: 0x5f9e42, rownina: 0xa6d074, wzgorza: 0x8a6a45, gory: 0x8a8076, woda: 0x4a93c4, pustynia: 0xd9c68a,
  las: 0x3f6d2c,
};

type Scen = { label: string; color: number; keys: ImprovementKey[]; water?: boolean };

// Scenariusze wprost z macierzy współistnienia (§3 SCHEMAT-SEKTORY-WSPOLISTNIENIE.md).
// „kopalnia" reprezentuje kopalnię żelaza/miedzi (jeden model), etykieta doprecyzowuje.
const SCEN: Scen[] = [
  { label: 'Łąka — bez surowca',        color: TERR.laka,    keys: ['farma', 'bydlo', 'fort', 'droga'] },
  { label: 'Równina — koń',             color: TERR.rownina, keys: ['stadnina', 'farma', 'bydlo', 'droga'] },
  { label: 'Równina — sól',             color: TERR.rownina, keys: ['warzelnia_soli', 'farma', 'bydlo', 'droga'] },
  { label: 'Łąka — glina',              color: TERR.laka,    keys: ['glinianka', 'farma', 'bydlo', 'droga'] },
  { label: 'Łąka — koń + irygacja',     color: TERR.laka,    keys: ['stadnina', 'farma', 'irygacja', 'bydlo', 'fort', 'droga'] },
  { label: 'Wzgórza — ruda żelaza',     color: TERR.wzgorza, keys: ['kopalnia', 'owce', 'droga'] },
  { label: 'Wzgórza — ruda miedzi',     color: TERR.wzgorza, keys: ['kopalnia', 'owce', 'fort'] },
  { label: 'Wzgórza — tarasy',          color: TERR.wzgorza, keys: ['tarasy', 'owce', 'droga'] },
  { label: 'Góry — ruda + lama',        color: TERR.gory,    keys: ['kopalnia', 'lama', 'fort'] },
  { label: 'Las — wyrąb',               color: TERR.las,     keys: ['wyrab', 'fort', 'droga'] },
  { label: 'Las — tartak + obóz',       color: TERR.las,     keys: ['tartak', 'oboz_lowiecki', 'droga'] },
  { label: 'Woda — łodzie rybackie',    color: TERR.woda,    keys: ['lodzie_rybackie'], water: true },
];

// --- start (owinięte w boot() — klasyczny skrypt w <head> po singlefile odpala się
//     zanim powstanie <body>; bez guardu document.body === null → appendChild rzuca) ---
function boot(): void {
// --- scena ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e2c36);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 1000);
const CAM0 = new THREE.Vector3(0, 13.5, 12.5);
const TGT0 = new THREE.Vector3(0, 0, 0.3);
camera.position.copy(CAM0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(TGT0);
controls.maxPolarAngle = Math.PI * 0.49;

scene.add(new THREE.AmbientLight(0xffffff, 0.78));
const dir = new THREE.DirectionalLight(0xfff4e0, 0.95);
dir.position.set(7, 14, 5);
dir.castShadow = true;
dir.shadow.mapSize.set(1024, 1024);
dir.shadow.camera.left = -14; dir.shadow.camera.right = 14;
dir.shadow.camera.top = 14; dir.shadow.camera.bottom = -14;
scene.add(dir);

// --- heks (kafel) ---
function hexTile(color: number): THREE.Group {
  const c = new THREE.Group();
  const geo = new THREE.CylinderGeometry(1, 1, 0.24, 6);
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color }));
  mesh.rotation.y = Math.PI / 6; // bok (ścianka) skierowany na sektor a=0 (północ)
  mesh.position.y = -0.12;       // wierzch kafla na y=0
  mesh.receiveShadow = true;
  c.add(mesh);
  return c;
}

// --- etykieta (sprite z canvasu) ---
function labelSprite(text: string): THREE.Sprite {
  const fs = 34, pad = 10;
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d')!;
  ctx.font = `bold ${fs}px system-ui, sans-serif`;
  cv.width = Math.ceil(ctx.measureText(text).width) + pad * 2;
  cv.height = fs + pad * 2;
  ctx.font = `bold ${fs}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = '#ffe08a';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, pad, cv.height / 2);
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  const s = 0.0055;
  spr.scale.set(cv.width * s, cv.height * s, 1);
  return spr;
}

// --- układ siatki ---
const COLS = 4;
const GAP = 4.0;
const ROWS = Math.ceil(SCEN.length / COLS);

SCEN.forEach((s, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const cell = new THREE.Group();
  cell.position.set((col - (COLS - 1) / 2) * GAP, 0, (row - (ROWS - 1) / 2) * GAP);
  cell.add(hexTile(s.color));

  try {
    if (s.water) {
      const m = buildImprovement('lodzie_rybackie', 0xffd54a);
      const ctr = new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3());
      m.position.x -= ctr.x; m.position.z -= ctr.z;
      m.scale.setScalar(0.5);
      cell.add(m);
    } else {
      cell.add(buildImprovementSectored(s.keys, 0xffd54a, undefined, 1));
    }
  } catch (err) {
    console.warn('[podglad-sektory] scenariusz nie zbudowany:', s.label, err);
    const warn = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshBasicMaterial({ color: 0xff3355 }));
    warn.position.y = 0.3;
    cell.add(warn);
  }

  const lab = labelSprite(s.label);
  lab.position.set(0, 0.2, 1.6); // podpis na ziemi PRZED heksem — nie nachodzi na rząd wyżej
  cell.add(lab);

  scene.add(cell);
});

const cntEl = document.getElementById('cnt');
if (cntEl) cntEl.textContent = `${SCEN.length} scenariuszy · siatka ${COLS}×${ROWS}`;

// --- pętla + interakcja ---
function tick(): void {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    camera.position.copy(CAM0);
    controls.target.copy(TGT0);
  }
});
} // koniec boot()

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
