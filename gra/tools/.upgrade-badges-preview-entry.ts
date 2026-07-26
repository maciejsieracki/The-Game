/**
 * .upgrade-badges-preview-entry.ts — entry TYLKO do podglądu odznak ulepszeń
 * jednostek (render/unitUpgradeBadges.ts). NIE jest częścią gry.
 *
 * Budowanie (z katalogu gra/, BEZ npm run build — nie odpala prebuild/
 * export-data.py, więc JSON-y w gra/data pozostają nietknięte):
 *
 *   node tools/build-upgrade-badges-preview.cjs
 *
 * Scena: 5 heksów obok siebie (stykających się bokami — dowód, że nic nie
 * wychodzi poza obrys i nie nachodzi na sąsiada), kamera pod kątem gry 52°.
 */
import * as THREE from 'three';
import { buildUnitModel } from '../src/render/units';
import { axialToWorld, HEX_R } from '../src/render/hexutil';
import {
  applyUnitUpgradeBadgeLevel,
  upgradeBadgeLevelFromTotalPp,
  VETERAN_BADGE_RESERVED_Y,
} from '../src/render/unitUpgradeBadges';

// --- MOCK-i podglądu (kopie prywatnych elementów UnitRenderer / veteran.ts) --
// Obwódka właściciela 1:1 ze stałymi units.ts — po to, żeby udowodnić, że
// obwódka ulepszenia jej nie udaje i się z nią nie zlewa.
const OWNER_RING_OUTER = HEX_R * 0.90;
const OWNER_RING_WIDTH = 0.045 * HEX_R;
const OWNER_RING_INNER = OWNER_RING_OUTER - OWNER_RING_WIDTH;
const OWNER_RING_OPACITY = 0.42;
const OWNER_RING_LIFT = 0.006 * HEX_R;

function appendPointyTopHex(path: THREE.Path | THREE.Shape, radius: number, reverse: boolean): void {
  const order = reverse ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5];
  for (let j = 0; j < 6; j++) {
    const i = order[j]!;
    const a = Math.PI / 2 + (i * Math.PI) / 3;
    if (j === 0) path.moveTo(radius * Math.cos(a), radius * Math.sin(a));
    else path.lineTo(radius * Math.cos(a), radius * Math.sin(a));
  }
  path.closePath();
}

function ownerRing(color: number): THREE.Mesh {
  const shape = new THREE.Shape();
  appendPointyTopHex(shape, OWNER_RING_OUTER, false);
  const hole = new THREE.Path();
  appendPointyTopHex(hole, OWNER_RING_INNER, true);
  shape.holes.push(hole);
  const m = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: OWNER_RING_OPACITY, depthWrite: false, side: THREE.DoubleSide }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = OWNER_RING_LIFT;
  return m;
}

/** MOCK gwiazdek weterana — NIE ma ich jeszcze w render/; tu tylko po to, by
 *  pokazać kontrast (złote gwiazdki NAD GŁOWĄ vs metalowe kule PRZY PODSTAWIE). */
function veteranStars(count: number): THREE.Group {
  const g = new THREE.Group();
  const R = 0.075 * HEX_R;
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? R : R * 0.42;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    if (i === 0) shape.moveTo(r * Math.cos(a), r * Math.sin(a));
    else shape.lineTo(r * Math.cos(a), r * Math.sin(a));
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.02 * HEX_R, bevelEnabled: false, curveSegments: 1 });
  const mat = new THREE.MeshStandardMaterial({ color: 0xffd24a, emissive: 0x6a4b00, roughness: 0.3, metalness: 0.9 });
  const start = -((count - 1) / 2) * 0.17 * HEX_R;
  for (let i = 0; i < count; i++) {
    const s = new THREE.Mesh(geo, mat);
    s.position.set(start + i * 0.17 * HEX_R, VETERAN_BADGE_RESERVED_Y, 0);
    g.add(s);
  }
  return g;
}

// --- scena ------------------------------------------------------------------
type Case = { pancerz: number; parametry: number; vet: number; label: string };

const CASES: Case[] = [
  { pancerz: 0,  parametry: 0,  vet: 0, label: 'brak ulepszeń (0 pp)' },
  { pancerz: 0,  parametry: 20, vet: 0, label: 'niskie: koszary (20 pp) → 1 kropka' },
  { pancerz: 15, parametry: 20, vet: 0, label: 'średnie: kuźnia+koszary (35 pp) → 2 kropki' },
  { pancerz: 45, parametry: 50, vet: 0, label: 'maks.: 6 budynków (95 pp) → 3 kropki' },
  { pancerz: 0,  parametry: 0,  vet: 3, label: 'WETERAN ★★★ (bez ulepszeń budynkowych)' },
];

function makeScene(cases: Case[], ownerColorId: number[]): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x78a7ff);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x88cc88, 1.05));
  const sun = new THREE.DirectionalLight(0xfffef0, 1.25);
  sun.position.set(60, 100, 40);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xbcd4ff, 0.35);
  fill.position.set(-50, 60, -30);
  scene.add(fill);

  const tileGeo = new THREE.CylinderGeometry(HEX_R, HEX_R, 0.10, 6);
  const tileMat = new THREE.MeshStandardMaterial({ color: 0x6f9e4a, roughness: 0.95 });

  cases.forEach((c, i) => {
    const { x, z } = axialToWorld(i, 0);
    const tile = new THREE.Mesh(tileGeo, tileMat);
    tile.position.set(x, -0.05, z);
    scene.add(tile);

    const color = ownerColorId[i]!;
    const g = buildUnitModel('miecznik', color, 'miecznik');
    g.position.set(x, 0, z);
    g.add(ownerRing(color));
    applyUnitUpgradeBadgeLevel(g, upgradeBadgeLevelFromTotalPp(c.pancerz + c.parametry));
    if (c.vet > 0) g.add(veteranStars(c.vet));
    scene.add(g);
  });
  return scene;
}

function render(canvas: HTMLCanvasElement, scene: THREE.Scene, target: THREE.Vector3, dist: number, fov: number): void {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(canvas.width, canvas.height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const cam = new THREE.PerspectiveCamera(fov, canvas.width / canvas.height, 0.05, 200);
  const el = THREE.MathUtils.degToRad(52); // KĄT KAMERY GRY
  cam.position.set(target.x, target.y + Math.sin(el) * dist, target.z + Math.cos(el) * dist);
  cam.lookAt(target);
  renderer.render(scene, cam);
}

// Rząd 5 heksów — ujęcie przeglądowe (kolory właścicieli: gracz + AI, parytet).
const wide = document.getElementById('cv-wide') as HTMLCanvasElement;
const centerX = axialToWorld(2, 0).x;
render(wide, makeScene(CASES, [0xffd54a, 0xffd54a, 0xe53935, 0x1e88e5, 0x43a047]),
  new THREE.Vector3(centerX, 0.30, 0), 9.2, 42);

// Zbliżenie: maksymalne ulepszenie obok weterana (dowód rozróżnialności).
const near = document.getElementById('cv-near') as HTMLCanvasElement;
const closeCases: Case[] = [CASES[3]!, CASES[4]!];
render(near, makeScene(closeCases, [0x1e88e5, 0x43a047]),
  new THREE.Vector3(axialToWorld(0.5, 0).x, 0.35, 0), 4.0, 40);

// Zbliżenie na poziomy 1/2/3 — czytelność liczby kropek i koloru obwódki.
const dots = document.getElementById('cv-dots') as HTMLCanvasElement;
const dotCases: Case[] = [CASES[1]!, CASES[2]!, CASES[3]!];
render(dots, makeScene(dotCases, [0xe53935, 0xe53935, 0xe53935]),
  new THREE.Vector3(axialToWorld(1, 0).x, 0.30, 0), 5.6, 40);

(window as unknown as Record<string, unknown>)['__PREVIEW_READY'] = true;
