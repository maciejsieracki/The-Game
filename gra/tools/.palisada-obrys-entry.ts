/**
 * .palisada-obrys-entry.ts — pomiar obrysu miasta epoki Kamienia z palisada
 * (kontrola rezerwy srodka heksa po wdrozeniu palisady Biskupin).
 *
 * URUCHOMIENIE (z katalogu gra/):
 *   node node_modules/esbuild/bin/esbuild tools/.palisada-obrys-entry.ts \
 *     --bundle --platform=node --format=cjs --outfile=%TEMP%\palisada-obrys.cjs
 *   node %TEMP%\palisada-obrys.cjs
 */
import * as THREE from 'three';
import { buildMiastoKamien, MIASTO_KAMIEN_LAYOUT } from '../src/render/miasto-kamien';

function pomiar(root: THREE.Group): { maxR: number; maxY: number; meshe: number; tri: number } {
  root.updateMatrixWorld(true);
  let maxR = 0, maxY = 0, meshe = 0, tri = 0;
  const v = new THREE.Vector3();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    meshe++;
    const pos = mesh.geometry.attributes['position'];
    if (!pos) return;
    const idx = mesh.geometry.index;
    tri += (idx ? idx.count : pos.count) / 3;
    mesh.updateWorldMatrix(true, false);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      const rr = Math.hypot(v.x, v.z);
      if (rr > maxR) maxR = rr;
      if (v.y > maxY) maxY = v.y;
    }
  });
  return { maxR, maxY, meshe, tri };
}

/** CityRenderer mnozy model o CITY_MODEL_SCALE — pomiar w jednostkach swiata. */
const S = MIASTO_KAMIEN_LAYOUT.cityModelScale;

console.log('poziom | bez muru: r/h | z palisada: r/h | limit r | meshe | tri walu');
for (const L of [1, 3, 4, 6, 7, 10]) {
  const bez = pomiar(buildMiastoKamien(L, { mur: false }));
  const zMurem = pomiar(buildMiastoKamien(L, { mur: true }));
  const faza = L <= 3 ? 'male' : L <= 6 ? 'srednie' : 'duze';
  const limit = MIASTO_KAMIEN_LAYOUT.granice[faza as 'male' | 'srednie' | 'duze'].zMurem;
  const f = S;
  console.log(
    `P${String(L).padStart(2)} | ${(bez.maxR * f).toFixed(3)}/${(bez.maxY * f).toFixed(3)}` +
    ` | ${(zMurem.maxR * f).toFixed(3)}/${(zMurem.maxY * f).toFixed(3)}` +
    ` | ${limit} | ${zMurem.meshe} | ${zMurem.tri - bez.tri}` +
    ` | ${zMurem.maxR * f <= limit ? 'OK' : 'PRZEKROCZONY'}`,
  );
}
