/**
 * .veteran-badges-preview-entry.ts — entry TYLKO do podglądu odznak poziomu
 * weterana (render/unitVeteranBadges.ts) zestawionych z odznakami ulepszeń
 * budynkowych (render/unitUpgradeBadges.ts). NIE jest częścią gry.
 *
 * Budowanie (z katalogu gra/, BEZ npm run build — nie odpala prebuild/
 * export-data.py, więc JSON-y w gra/data pozostają nietknięte):
 *
 *   node tools/build-veteran-badges-preview.cjs <out.html>
 *
 * Scena: heksy stykające się bokami (dowód, że nic nie wychodzi poza obrys),
 * kamera pod kątem gry 52° — tak jak liczy ją render/camera.ts::_syncCamera.
 */
import * as THREE from 'three';
import { buildUnitModel } from '../src/render/units';
import { axialToWorld, HEX_R } from '../src/render/hexutil';
import { applyUnitUpgradeBadgeLevel, upgradeBadgeLevelFromTotalPp } from '../src/render/unitUpgradeBadges';
import { applyUnitVeteranBadgeLevel } from '../src/render/unitVeteranBadges';
import type { VeteranLevel } from '../src/game/veteran';

// Obwódka właściciela 1:1 ze stałymi units.ts — żeby było widać, że żadna
// z odznak jej nie udaje i się z nią nie zlewa.
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

// --- scena ------------------------------------------------------------------
type Case = {
  vet: VeteranLevel;      // poziom weterana 1/2/3
  pancerz: number;        // pp Pancerz (ścieżka A)
  parametry: number;      // pp Parametry (ścieżka B)
  owner: number;          // kolor właściciela (gracz vs AI — parytet)
  tile: number;           // kolor kafelka pod jednostką (test kontrastu odznaki)
};

const CASES: Case[] = [
  { vet: 1, pancerz: 0,  parametry: 0,  owner: 0xffd54a, tile: 0x6f9e4a }, // Rekrut — BEZ odznaki
  { vet: 2, pancerz: 0,  parametry: 0,  owner: 0xffd54a, tile: 0x6f9e4a }, // Doświadczony +10% — 2 gwiazdki
  { vet: 3, pancerz: 0,  parametry: 0,  owner: 0xe53935, tile: 0x6f9e4a }, // Weteran +20% (AI) — 3 gwiazdki
  { vet: 1, pancerz: 45, parametry: 50, owner: 0x1e88e5, tile: 0x6f9e4a }, // Ulepszenie budynkowe III — kule przy podstawie
  { vet: 3, pancerz: 45, parametry: 50, owner: 0x43a047, tile: 0x6f9e4a }, // OBA systemy naraz
];

/** Ten sam zestaw na jasnym piasku — dowód, że złoto nie ginie na jasnym terenie. */
const CASES_SAND: Case[] = CASES.map((c) => ({ ...c, tile: 0xe3d4a0 }));

function makeScene(cases: Case[]): THREE.Scene {
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

  cases.forEach((c, i) => {
    const { x, z } = axialToWorld(i, 0);
    const tile = new THREE.Mesh(tileGeo, new THREE.MeshStandardMaterial({ color: c.tile, roughness: 0.95 }));
    tile.position.set(x, -0.05, z);
    scene.add(tile);

    const g = buildUnitModel('miecznik', c.owner, 'miecznik');
    g.position.set(x, 0, z);
    g.add(ownerRing(c.owner));
    applyUnitUpgradeBadgeLevel(g, upgradeBadgeLevelFromTotalPp(c.pancerz + c.parametry));
    applyUnitVeteranBadgeLevel(g, c.vet);
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
  const el = THREE.MathUtils.degToRad(52); // KĄT KAMERY GRY (render/camera.ts)
  cam.position.set(target.x, target.y + Math.sin(el) * dist, target.z + Math.cos(el) * dist);
  cam.lookAt(target);
  renderer.render(scene, cam);
}

const centerX = axialToWorld(2, 0).x;

// 1) Przegląd — dystans typowej, oddalonej kamery mapy.
render(document.getElementById('cv-wide') as HTMLCanvasElement, makeScene(CASES),
  new THREE.Vector3(centerX, 0.40, 0), 9.2, 42);

// 2) Ten sam rząd na jasnym piasku — test kontrastu obwódki gwiazdy.
render(document.getElementById('cv-sand') as HTMLCanvasElement, makeScene(CASES_SAND),
  new THREE.Vector3(centerX, 0.40, 0), 9.2, 42);

// 3) Zbliżenie: Rekrut / +10% / +20% — policzalność gwiazdek.
render(document.getElementById('cv-vet') as HTMLCanvasElement, makeScene(CASES.slice(0, 3)),
  new THREE.Vector3(axialToWorld(1, 0).x, 0.42, 0), 5.4, 40);

// 4) Zbliżenie: weteran vs ulepszenie budynkowe vs oba naraz (dowód rozróżnialności).
render(document.getElementById('cv-mix') as HTMLCanvasElement, makeScene(CASES.slice(2, 5)),
  new THREE.Vector3(axialToWorld(1, 0).x, 0.38, 0), 5.4, 40);

(window as unknown as Record<string, unknown>)['__PREVIEW_READY'] = true;
