/**
 * .zloze-mockup/main.ts — DOWÓD na to, co gra rysuje dla złóż surowców.
 * NIE jest częścią gry.
 *
 * Woła DOKŁADNIE tę samą funkcję co mapa gry (main.ts:1415 i :1442):
 *   buildStyledResourceOverlay(hex.nakladka, GAME_MAP_RENDER_STYLE, hex.zloze)
 * dla pięciu złóż: miedz, zelazo, wegiel, sol, zloto.
 *
 * WIDOKI (parametr `?widok=` w URL):
 *   porownanie (domyślny) — 5 heksów obok siebie, kamera 52°, model „jak wychodzi
 *                           z buildera" (bez kompaktowania mapy),
 *   blisko                — zbliżenie na pojedynczy heks (`?zloze=zloto`),
 *   daleko                — REALNA skala rozgrywki: siatka heksów, kamera gry
 *                           (fov 50, elewacja 52°, dystans jak przy zwykłym graniu)
 *                           i nakładki osadzone DOKŁADNIE tak, jak robi to
 *                           main.ts:compactDepositAtEdge (wyśrodkowanie XZ,
 *                           skala do 0,55 HEX_R, dosunięcie do ścianki -Z).
 *
 * Budowanie (z katalogu gra/, NIGDY `npm run build`):
 *   node ./node_modules/vite/bin/vite.js build --config tools/.zloze-mockup/vite.config.ts
 */
import * as THREE from 'three';
import { HEX_R, axialToWorld } from '../../src/render/hexutil';
import { buildStyledResourceOverlay } from '../../src/render/styleResources';
import { GAME_MAP_RENDER_STYLE } from '../../src/render/mapRenderStyle';
import { Nakladka } from '../../src/types/hex';

const ZLOZA: readonly string[] = ['miedz', 'zelazo', 'wegiel', 'sol', 'zloto'];

function appendPointyTopHex(path: THREE.Path | THREE.Shape, radius: number): void {
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 3;
    if (i === 0) path.moveTo(radius * Math.cos(a), radius * Math.sin(a));
    else path.lineTo(radius * Math.cos(a), radius * Math.sin(a));
  }
  path.closePath();
}

/** Kafelek Wzgórz — terenu, na którym gra stawia złoże złota. */
function hexTile(kolor = 0x7a6a44): THREE.Mesh {
  const shape = new THREE.Shape();
  appendPointyTopHex(shape, HEX_R * 0.985);
  const m = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshStandardMaterial({ color: kolor, roughness: 0.95, metalness: 0 }),
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

/** Ile obiektów faktycznie zwróciła gra dla danego złoża (0 = nic nie widać). */
const wynik: Record<string, number> = {};

/** 1:1 kopia main.ts:compactDepositAtEdge (stałe DEPOSIT_EDGE_R / DEPOSIT_TARGET_SPAN). */
const DEPOSIT_EDGE_R = 0.62;
const DEPOSIT_TARGET_SPAN = 0.55;
function compactDepositAtEdge(ov: THREE.Group, x: number, z: number, baseY: number, rotY: number): void {
  const bb = new THREE.Box3().setFromObject(ov);
  if (!bb.isEmpty()) {
    const cx = (bb.min.x + bb.max.x) / 2;
    const cz = (bb.min.z + bb.max.z) / 2;
    const maxSpan = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) || 1;
    for (const ch of ov.children) {
      const geo = (ch as THREE.Mesh).geometry;
      if (geo) geo.translate(-cx, 0, -cz);
    }
    ov.scale.setScalar(Math.min(0.6, (DEPOSIT_TARGET_SPAN * HEX_R) / maxSpan));
  }
  ov.position.set(x, baseY + 0.01, z - DEPOSIT_EDGE_R * HEX_R);
  ov.rotation.y = rotY;
}

function swiatlo(scene: THREE.Scene): void {
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const dir = new THREE.DirectionalLight(0xffffff, 1.1);
  dir.position.set(3, 6, 4);
  scene.add(dir);
}

function overlay(zloze: string): THREE.Group | null {
  const ov = buildStyledResourceOverlay(Nakladka.Brak, GAME_MAP_RENDER_STYLE, zloze);
  wynik[zloze] = ov ? 1 : 0;
  return ov;
}

/** Widok „porownanie" — pięć heksów obok siebie (oryginalny widok mockupu). */
function scenaPorownanie(scene: THREE.Scene): void {
  const step = Math.sqrt(3) * HEX_R;
  ZLOZA.forEach((zloze, i) => {
    const g = new THREE.Group();
    g.add(hexTile());
    const ov = overlay(zloze);
    if (ov) g.add(ov);
    g.position.x = (i - (ZLOZA.length - 1) / 2) * step;
    scene.add(g);
  });
}

/** Widok „blisko" — jeden heks (domyślnie złoto) z bliska. */
function scenaBlisko(scene: THREE.Scene, zloze: string): void {
  const g = new THREE.Group();
  g.add(hexTile());
  const ov = overlay(zloze);
  if (ov) g.add(ov);
  scene.add(g);
  for (const z of ZLOZA) if (wynik[z] === undefined) wynik[z] = buildStyledResourceOverlay(Nakladka.Brak, GAME_MAP_RENDER_STYLE, z) ? 1 : 0;
}

/**
 * Widok „daleko" — realna skala rozgrywki. Siatka Wzgórz/Gór, złoża rozrzucone
 * jak na mapie, nakładki osadzone przez kopię compactDepositAtEdge.
 */
function scenaDaleko(scene: THREE.Scene): { cx: number; cz: number } {
  const W = 13, H = 11;
  // deterministyczny „szum" — bez zależności od RNG
  const h01 = (q: number, r: number): number => {
    const s = Math.sin(q * 12.9898 + r * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };
  let sx = 0, sz = 0, n = 0;
  for (let r = 0; r < H; r++) {
    for (let q = 0; q < W; q++) {
      const { x, z } = axialToWorld(q - (r - (r & 1)) / 2, r, HEX_R);
      sx += x; sz += z; n++;
      const t = h01(q, r);
      const kolor = t > 0.82 ? 0x8d8a80 : t > 0.55 ? 0x7a6a44 : t > 0.28 ? 0x6f7c46 : 0x84754c;
      const tile = hexTile(kolor);
      tile.position.set(x, 0, z);
      scene.add(tile);
      // co kilka heksów złoże — złoto rozsiane po całym kadrze
      const d = h01(q * 3 + 7, r * 5 + 11);
      let zloze: string | null = null;
      if (d > 0.93) zloze = 'zloto';
      else if (d > 0.88) zloze = 'miedz';
      else if (d > 0.84) zloze = 'zelazo';
      else if (d > 0.80) zloze = 'wegiel';
      else if (d > 0.77) zloze = 'sol';
      if (!zloze) continue;
      const ov = overlay(zloze);
      if (!ov) continue;
      compactDepositAtEdge(ov, x, z, 0, q * 1.3 + r * 0.7);
      scene.add(ov);
    }
  }
  for (const z of ZLOZA) if (wynik[z] === undefined) wynik[z] = buildStyledResourceOverlay(Nakladka.Brak, GAME_MAP_RENDER_STYLE, z) ? 1 : 0;
  return { cx: sx / n, cz: sz / n };
}

function main(): void {
  const params = new URLSearchParams(location.search);
  const widok = params.get('widok') ?? 'porownanie';
  const zlozeBlisko = params.get('zloze') ?? 'zloto';

  const canvas = document.getElementById('scena') as HTMLCanvasElement;
  if (widok === 'daleko') {
    // realny kadr gry: 16:9, nie panorama 1280x420 z widoku porównawczego
    canvas.width = 2400; canvas.height = 1350;
    canvas.style.width = '1200px'; canvas.style.height = '675px';
  }
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(canvas.width, canvas.height, false);
  renderer.setClearColor(0x0e1318, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  swiatlo(scene);

  const elev = (52 * Math.PI) / 180;
  let cam: THREE.PerspectiveCamera;

  if (widok === 'blisko') {
    scenaBlisko(scene, zlozeBlisko);
    cam = new THREE.PerspectiveCamera(30, canvas.width / canvas.height, 0.1, 100);
    const dist = 3.4;
    cam.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
    cam.lookAt(0, 0.08 * HEX_R, 0);
  } else if (widok === 'daleko') {
    const c = scenaDaleko(scene);
    // kamera gry: fov 50 (render/scene.ts:2425), elewacja 52° (render/camera.ts:120)
    cam = new THREE.PerspectiveCamera(50, canvas.width / canvas.height, 0.5, 500);
    const dist = 16; // ~16 heksów w poziomie — typowy roboczy zoom rozgrywki
    cam.position.set(c.cx, Math.sin(elev) * dist, c.cz + Math.cos(elev) * dist);
    cam.lookAt(c.cx, 0, c.cz);
  } else {
    scenaPorownanie(scene);
    cam = new THREE.PerspectiveCamera(30, canvas.width / canvas.height, 0.1, 100);
    const dist = 9.0;
    cam.position.set(0, Math.sin(elev) * dist + 0.2, Math.cos(elev) * dist);
    cam.lookAt(0, 0.1 * HEX_R, 0);
  }

  renderer.render(scene, cam);

  document.getElementById('legenda')!.innerHTML = ZLOZA.map(z =>
    `<div class="${wynik[z] ? 'ok' : 'brak'}"><b>${z}</b><br>${wynik[z] ? 'model JEST' : 'BRAK MODELU'}</div>`,
  ).join('');
  document.body.dataset['gotowe'] = '1';
}

main();
