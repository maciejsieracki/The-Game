'use strict';
/** Picker math: worldToAxial roundtrip + NDC corners (regresja przesunięcia Y). */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.picker-test-entry.ts');
const BUNDLE = path.join(__dirname, '.picker-test-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { worldToAxial, clientRectToNdc, pixelToHex, refreshInstancedPickBounds } from '../src/input/picker';
export { axialToWorld, HEX_R } from '../src/render/hexutil';
export { terrainSurfaceTopY, ROBLOX_TERRAIN_VIS } from '../src/render/mapRenderStyle';
import * as THREE_NS from 'three';
export const THREE = THREE_NS;`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  loader: { '.ts': 'ts' },
  // three zostaje jako require() z node_modules — inaczej artefakt .picker-test-bundle.cjs
  // (plik śledzony w repo) puchnie o ~32 tys. linii przy każdym uruchomieniu testu.
  external: ['three'],
  logLevel: 'silent',
});

const {
  worldToAxial, clientRectToNdc, pixelToHex, refreshInstancedPickBounds,
  axialToWorld, HEX_R, terrainSurfaceTopY, ROBLOX_TERRAIN_VIS, THREE,
} = require(BUNDLE);

let pass = 0;
let fail = 0;

function ok(label, cond) {
  if (cond) { pass++; return; }
  fail++;
  console.error('FAIL:', label);
}

for (let q = -4; q <= 8; q++) {
  for (let r = -3; r <= 6; r++) {
    const { x, z } = axialToWorld(q, r, HEX_R);
    const back = worldToAxial(x, z, HEX_R);
    ok(`roundtrip ${q},${r}`, back.q === q && back.r === r);
  }
}

{
  const rect = { left: 100, top: 50, width: 800, height: 600 };
  const tl = clientRectToNdc(100, 50, rect);
  ok('NDC top-left x', tl && Math.abs(tl.x - (-1)) < 1e-9);
  ok('NDC top-left y', tl && Math.abs(tl.y - 1) < 1e-9);
  const br = clientRectToNdc(900, 650, rect);
  ok('NDC bottom-right x', br && Math.abs(br.x - 1) < 1e-9);
  ok('NDC bottom-right y', br && Math.abs(br.y - (-1)) < 1e-9);
  const ctr = clientRectToNdc(500, 350, rect);
  ok('NDC center', ctr && Math.abs(ctr.x) < 1e-9 && Math.abs(ctr.y) < 1e-9);
}

ok('NDC zero width', clientRectToNdc(0, 0, { left: 0, top: 0, width: 0, height: 100 }) === null);

// ---------------------------------------------------------------------------
// REGRESJA R-RUCH-WZGORZA (2026-07-26): mgła wojny NIE MOŻE wypisać meshy terenu
// z raycastu pickingu.
//
// three.js liczy `InstancedMesh.boundingSphere` LENIWIE przy pierwszym raycaście
// i nigdy jej nie odświeża. Renderer chowa heksy pod mgłą macierzą zerową i
// przywraca je, gdy mgła opadnie — jeśli sfera policzyła się na zamglonej mapie,
// zostaje zawężona do odsłoniętego skrawka i cały mesh wypada z pickingu.
// Klik leci wtedy na płaszczyznę y = 0, która leży POD wierzchem terenu, więc
// wskazuje heks dalej od kamery (na wzgórzu ~pół heksa, na górze ~cały).
// refreshInstancedPickBounds() zamraża sfery po zbudowaniu sceny (scene.ts).
{
  const R = HEX_R;
  const VW = 1200, VH = 700;
  const GRID = 14;                    // 14×14 heksów Łąki
  const topY = terrainSurfaceTopY('laka', 'roblox');
  const height = ROBLOX_TERRAIN_VIS['laka'].height;

  const list = [];
  for (let q = 0; q < GRID; q++) for (let r = 0; r < GRID; r++) list.push({ q, r });

  const geo = new THREE.CylinderGeometry(R * 1.008, R * 1.008, height, 6, 1);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial(), list.length);
  mesh.frustumCulled = false;
  const keys = [], orig = [];
  const dummy = new THREE.Object3D();
  list.forEach((h, i) => {
    const { x, z } = axialToWorld(h.q, h.r, R);
    dummy.position.set(x, topY - height / 2, z);
    dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    keys[i] = `${h.q},${h.r}`; orig[i] = dummy.matrix.clone();
  });
  mesh.instanceMatrix.needsUpdate = true;
  const scene = new THREE.Scene(); scene.add(mesh);
  const resolve = (m, id) => {
    const k = keys[id]; if (!k) return null;
    const [q, r] = k.split(',').map(Number); return { q, r };
  };

  // Kamera 1:1 jak CameraController._syncCamera (elewacja 52°, azymut 0, fov 50).
  const camera = new THREE.PerspectiveCamera(50, VW / VH, 0.5, 4000);
  const ctr = axialToWorld((GRID - 1) / 2, (GRID - 1) / 2, R);
  const el = THREE.MathUtils.degToRad(52);
  const DIST = 22;
  camera.position.set(ctr.x, DIST * Math.sin(el), ctr.z + DIST * Math.cos(el));
  camera.lookAt(ctr.x, 0, ctr.z);
  camera.updateMatrixWorld(true); camera.updateProjectionMatrix();
  const canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: VW, height: VH }) };

  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  const setFogTo = (keep) => {
    for (let i = 0; i < mesh.count; i++) {
      const [q, r] = keys[i].split(',').map(Number);
      mesh.setMatrixAt(i, keep(q, r) ? orig[i] : ZERO);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  // Kolejność jak w grze: buildScene (komplet instancji) → zamrożenie sfer →
  // setFog chowa prawie całą mapę → mgła opada → gracz klika.
  refreshInstancedPickBounds([mesh]);
  const frozenR = mesh.boundingSphere ? mesh.boundingSphere.radius : 0;
  setFogTo((q, r) => q <= 2 && r <= 2);
  pixelToHex(VW / 2, VH / 2, canvas, camera, R, [mesh], resolve); // pierwszy klik pod mgłą
  setFogTo(() => true);

  ok('bounds: sfera zamrożona na pełnym zasięgu mapy', frozenR > 12);
  ok('bounds: mgła nie zawęziła zamrożonej sfery',
    mesh.boundingSphere !== null && Math.abs(mesh.boundingSphere.radius - frozenR) < 1e-9);

  // Sfera, z którą gra wchodzi w dalszą część sesji (po mgle) — to JEJ używa picker.
  const sessionSphere = mesh.boundingSphere ? mesh.boundingSphere.clone() : null;

  // Ground truth = świeży raycast (sfera liczona od nowa); picker dostaje sferę
  // sesyjną — dokładnie tak, jak w grze. Musi zwrócić DOKŁADNIE to samo.
  let mism = 0, checked = 0;
  for (let px = 260; px <= VW - 260; px += 17) {
    for (let py = 110; py <= VH - 110; py += 17) {
      const rc = new THREE.Raycaster();
      rc.setFromCamera(new THREE.Vector2((px / VW) * 2 - 1, -(py / VH) * 2 + 1), camera);
      mesh.boundingSphere = null;                 // ground truth: zawsze aktualna sfera
      const hits = rc.intersectObjects([mesh], false);
      const truth = hits.length ? resolve(mesh, hits[0].instanceId) : null;
      if (!truth) continue;
      checked++;
      mesh.boundingSphere = sessionSphere ? sessionSphere.clone() : null;
      const got = pixelToHex(px, py, canvas, camera, R, [mesh], resolve);
      if (!got || got.q !== truth.q || got.r !== truth.r) mism++;
    }
  }
  ok('bounds: siatka kursorów pokryta', checked > 400);
  ok(`bounds: 0 rozjazdów kursor↔heks po mgle (było ${mism}/${checked})`, mism === 0);
}

console.log(`picker-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
