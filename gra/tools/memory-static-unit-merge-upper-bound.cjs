'use strict';
/**
 * memory-static-unit-merge-upper-bound.cjs -- R-WEB-MEMORY-STATIC-FOOTPRINT-Q1, obrona r1 (zarzut Z2).
 * POMIAR (nie test PASS/FAIL): gorna granica zysku kandydata (B) "scalenie statycznych czesci modeli jednostek".
 * V8 (Node, --expose-gc przez v8.setFlagsFromString): 475 zetonow buildUnitModel (liczba zetonow w t.100 PO; rowny miks
 * typow z data/units.json), geometrie w GeometryContentPool. Raport: sterta zetonow, Object3D/mesh/material na zeton,
 * koszt jednego THREE.Mesh (bez geometrii/materialu) i gorna granica = (meshe - materialy na zeton) x koszt mesha,
 * tzn. gdyby WSZYSTKIE meshe o tym samym materiale w zetonie zlaczyc w jeden.
 * Usage: node tools/memory-static-unit-merge-upper-bound.cjs <gra z node_modules> <katalog tymczasowy poza repo>
 */
const path = require('path'); const fs = require('fs');
const GRA = process.argv[2]; const S = process.argv[3]; const SRC = path.join(GRA, 'src');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
(async () => {
  await esbuild.build({
    stdin: { contents: `export * as THREE from 'three'; export { buildUnitModel } from '${SRC}/render/units'; export { GeometryContentPool } from '${SRC}/render/geometryContentPool';`, resolveDir: GRA, loader: 'ts' },
    bundle: true, platform: 'node', format: 'cjs', outfile: S + '/b.cjs', logLevel: 'error', nodePaths: [GRA + '/node_modules'],
    loader: { '.json': 'json', '.png': 'dataurl', '.jpg': 'dataurl', '.mp3': 'dataurl', '.svg': 'dataurl' },
  });
  const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (k === 'measureText' ? () => ({ width: 10 }) : (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern') ? () => ({ addColorStop() {} }) : (k === 'getImageData' ? (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) : () => {}))), set: (t, k, v) => { t[k] = v; return true; } });
  const mkCanvas = () => ({ width: 64, height: 64, style: {}, getContext: () => ctx, addEventListener() {}, toDataURL: () => '' });
  global.document = { createElement: (tag) => (tag === 'canvas' ? mkCanvas() : { style: {}, appendChild() {}, setAttribute() {} }), createElementNS: () => mkCanvas(), body: { appendChild() {} } };
  global.window = { devicePixelRatio: 1, addEventListener() {}, location: { search: '' } }; global.self = global.window;
  global.OffscreenCanvas = function (w, h) { return Object.assign(mkCanvas(), { width: w, height: h }); };
  const M = require(S + '/b.cjs'); const { THREE } = M;
  require('v8').setFlagsFromString('--expose-gc'); const gc = require('vm').runInNewContext('gc');
  const heap = () => { gc(); gc(); return process.memoryUsage().heapUsed; };
  const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8')).map((u) => u.Jednostka).filter(Boolean);
  const N = 475; // liczba zetonow w t.100 (PO)
  const pool = new M.GeometryContentPool();
  // rozgrzewka (singletony modulowe builderow)
  for (const n of units) M.buildUnitModel('melee', 0xff0000, n);
  const h0 = heap();
  const tokens = [];
  for (let i = 0; i < N; i++) { const g = M.buildUnitModel('melee', i % 2 ? 0xff0000 : 0x0000ff, units[i % units.length]); pool.poolOwned(g, g.userData.perTokenGeos || []); tokens.push(g); }
  const h1 = heap();
  let obj = 0, mesh = 0, matsPerTok = 0;
  for (const t of tokens) { const mats = new Set(); t.traverse((o) => { obj++; if (o.isMesh) { mesh++; mats.add(o.material); } }); matsPerTok += mats.size; }
  // koszt pojedynczego Object3D/Mesh (bez geometrii i materialu: wspolne)
  const g1 = new THREE.BoxGeometry(); const m1 = new THREE.MeshBasicMaterial(); const K = 20000;
  const h2 = heap(); const arr = []; for (let i = 0; i < K; i++) arr.push(new THREE.Mesh(g1, m1)); const h3 = heap();
  const perMesh = (h3 - h2) / K;
  const tokMB = (h1 - h0) / 1048576;
  const graphMB = obj * perMesh / 1048576;
  const mergeableMeshes = mesh - matsPerTok; // gorna granica: wszystkie meshe o tym samym materiale w zetonie -> 1
  const upperMB = mergeableMeshes * perMesh / 1048576;
  console.log(JSON.stringify({ tokens: N, heapTokensMB: +tokMB.toFixed(2), object3dPerToken: +(obj / N).toFixed(1), meshesPerToken: +(mesh / N).toFixed(1), materialsPerToken: +(matsPerTok / N).toFixed(1), bytesPerMesh: Math.round(perMesh), sceneGraphMB: +graphMB.toFixed(2), upperBoundMergeMB: +upperMB.toFixed(2) }));
  arr.length = 0;
})();
