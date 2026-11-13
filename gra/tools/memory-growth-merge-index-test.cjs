'use strict';
/**
 * memory-growth-merge-index-test.cjs -- R-WEB-MEMORY-GROWTH-ROOTCAUSE-Q1 (node, bez przegladarki).
 * collapseToMergedMesh (render/mergeDecor.ts) wspoldzieli teraz wierzcholki o identycznej pozycji+kolorze
 * przez bufor indeksow. Test dowodzi, ze OBRAZ sie nie zmienia: lista trojkatow po rozwinieciu indeksow jest
 * BIT W BIT rowna liscie trojkatow starego algorytmu (bez indeksow -- kopia referencyjna ponizej), dla
 * REALNYCH modeli ulepszen (buildImprovementSectored) i prymitywow z vertex colors; oraz ze pamiec spada.
 *   M1 -- realne ulepszenia (pojedyncze warstwy + kombinacje z droga): trojkaty identyczne, bajty < 50%
 *   M2 -- grupa bez powtorzen -> index null (bez zmian formatu); >65535 unikalnych -> Uint32Array
 *   M3 -- releaseMergedDecorCpuArraysAfterUpload: sfera/prostopadloscian policzone, onUpload zeruje tablice
 * Usage (z gra/, wymaga node_modules): node tools/memory-growth-merge-index-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-merge-index-'));
// R1 obrona Z5: katalog tymczasowy sprzatany ZAWSZE -- takze po wyjatku (np. brak node_modules/esbuild,
// blad bundla) i po przerwaniu SIGINT/SIGTERM; wczesniej rmSync byl tylko na koncu sciezki sukcesu.
const cleanupTmp = () => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* nic */ } };
process.on('exit', cleanupTmp);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(130));
const entry = path.join(tmp, 'entry.ts'); const out = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(entry, `
export * as THREE from 'three';
export { collapseToMergedMesh, indexIdenticalVertices, releaseMergedDecorCpuArraysAfterUpload, mergedDecorCpuArraysReleased } from ${JSON.stringify(path.join(GRA, 'src/render/mergeDecor'))};
export { buildImprovementSectored } from ${JSON.stringify(path.join(GRA, 'src/render/improvements'))};
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: out,
  absWorkingDir: GRA, logLevel: 'silent', nodePaths: [path.join(GRA, 'node_modules')], loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.svg': 'text', '.glb': 'binary', '.json': 'json' } });
const M = require(out);
const { THREE } = M;
let pass = 0; let fail = 0;
const ok = (label, cond, detail) => { if (cond) { pass++; console.log('  OK  ' + label); } else { fail++; console.error(' FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); } };

/** Kopia REFERENCYJNA starego buildMergedMesh (sprzed tematu): trojkaty bez indeksow, Float32. */
function referenceSoup(group) {
  const _m = new THREE.Matrix4(); const _v = new THREE.Vector3(); const _c = new THREE.Color(); const W = new THREE.Color(1, 1, 1);
  const P = []; const C = [];
  group.traverse((obj) => {
    if (!obj.isMesh) return;
    const geo = obj.geometry; const idx = geo.index; const pos = geo.getAttribute('position'); if (!pos) return;
    _m.identity(); let o = obj; while (o && o !== group) { o.updateMatrix(); _m.premultiply(o.matrix); o = o.parent; }
    const mat0 = Array.isArray(obj.material) ? obj.material[0] : obj.material; _c.copy((mat0 && mat0.color) || W);
    const col = geo.getAttribute('color');
    const push = (i) => { _v.fromBufferAttribute(pos, i).applyMatrix4(_m); P.push(_v.x, _v.y, _v.z); if (col) C.push(col.getX(i), col.getY(i), col.getZ(i)); else C.push(_c.r, _c.g, _c.b); };
    if (idx) for (let i = 0; i < idx.count; i++) push(idx.getX(i)); else for (let i = 0; i < pos.count; i++) push(i);
  });
  return { P: new Float32Array(P), C: new Float32Array(C) };
}
/** Rozwiniecie geometrii zmergowanego meshu do listy trojkatow (jak rysuje GPU). */
function expandMerged(group) {
  const mesh = group.children[0]; const g = mesh.geometry;
  const p = g.getAttribute('position').array; const c = g.getAttribute('color').array; const ix = g.index ? g.index.array : null;
  const n = ix ? ix.length : p.length / 3; const P = new Float32Array(n * 3); const C = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const s = (ix ? ix[i] : i) * 3; P[i * 3] = p[s]; P[i * 3 + 1] = p[s + 1]; P[i * 3 + 2] = p[s + 2]; C[i * 3] = c[s]; C[i * 3 + 1] = c[s + 1]; C[i * 3 + 2] = c[s + 2]; }
  const bytes = p.byteLength + c.byteLength + (ix ? ix.byteLength : 0);
  return { P, C, bytes, indexed: !!ix };
}
const bitEqual = (a, b) => a.length === b.length && Buffer.compare(Buffer.from(a.buffer, a.byteOffset, a.byteLength), Buffer.from(b.buffer, b.byteOffset, b.byteLength)) === 0;

// --- M1: realne ulepszenia
const CASES = [['farma'], ['droga'], ['kamieniolom'], ['tartak'], ['kopalnia_miedzi'], ['posterunek'], ['fort'], ['stadnina'],
  ['oboz_lowiecki'], ['bydlo'], ['farma', 'droga'], ['pole_irygowane', 'irygacja', 'droga'], ['kopalnia_zelaza', 'droga_brukowana']];
let refBytesSum = 0; let newBytesSum = 0; let built = 0;
for (const layers of CASES) {
  let g;
  try { g = M.buildImprovementSectored(layers, 0xffd54a, undefined, 1, {}, 0b101101); }
  catch (e) { ok('M1 build ' + layers.join('+'), false, String(e).slice(0, 160)); continue; }
  const ref = referenceSoup(g);
  if (ref.P.length === 0) { console.log('  --  ' + layers.join('+') + ': pusty model (pomijam)'); continue; }
  M.collapseToMergedMesh(g);
  const got = expandMerged(g); built++;
  refBytesSum += ref.P.byteLength + ref.C.byteLength; newBytesSum += got.bytes;
  ok(`M1 ${layers.join('+')}: trojkaty identyczne bit w bit (${ref.P.length / 9} tr.)`, bitEqual(ref.P, got.P) && bitEqual(ref.C, got.C));
}
ok('M1: zbudowano >= 10 realnych modeli', built >= 10, built);
const ratio = newBytesSum / Math.max(1, refBytesSum);
console.log(`  ..  bajty geometrii: stary ${refBytesSum} -> nowy ${newBytesSum} (${(ratio * 100).toFixed(1)}%)`);
ok('M1: geometria realnych ulepszen < 50% starej', ratio < 0.5, ratio);

// --- M2: formaty krancowe
{
  const tri = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]); const col = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  const r = M.indexIdenticalVertices(tri, col);
  ok('M2: brak powtorzen -> index null, te same tablice', r.index === null && r.positions === tri && r.colors === col);
  const n = 70000 * 3; const P = new Float32Array(n * 3); const C = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const u = Math.floor(i / 3) % 70000 + (i % 3) * 70000; P[i * 3] = u; P[i * 3 + 1] = u * 0.5; P[i * 3 + 2] = -u; C[i * 3] = 0.25; }
  for (let i = 0; i < 3; i++) P[(n - 3 + i) * 3] = P[i * 3], P[(n - 3 + i) * 3 + 1] = P[i * 3 + 1], P[(n - 3 + i) * 3 + 2] = P[i * 3 + 2];
  const r2 = M.indexIdenticalVertices(P, C);
  ok('M2: >65535 unikalnych -> Uint32Array', r2.index instanceof Uint32Array, r2.index && r2.index.constructor.name);
  let same = true; for (let i = 0; i < n && same; i++) { const s = r2.index[i] * 3; same = r2.positions[s] === P[i * 3] && r2.positions[s + 1] === P[i * 3 + 1] && r2.positions[s + 2] === P[i * 3 + 2] && r2.colors[s] === C[i * 3]; }
  ok('M2: rozwiniecie Uint32 zgodne z wejsciem', same);
  const pz = new Float32Array([0, 0, 0, -0, 0, 0, 0, 0, 0]); const cz = new Float32Array(9);
  const r3 = M.indexIdenticalVertices(pz, cz);
  ok('M2: +0 i -0 traktowane jako rozne (bit w bit, zero zgadywania)', r3.index !== null && r3.positions.length === 6, r3.positions.length);
}

// --- M3: zwolnienie kopii CPU po uploadzie
{
  const g = M.buildImprovementSectored(['farma', 'droga'], 0xffd54a, undefined, 1, {}, 0b111111);
  M.collapseToMergedMesh(g);
  M.releaseMergedDecorCpuArraysAfterUpload(g);
  const geo = g.children[0].geometry;
  ok('M3: sfera i prostopadloscian policzone przed zwolnieniem', !!geo.boundingSphere && !!geo.boundingBox && geo.boundingSphere.radius > 0);
  ok('M3: przed uploadem tablice zostaja', M.mergedDecorCpuArraysReleased(g) === false);
  const cnt = geo.getAttribute('position').count; const icnt = geo.index ? geo.index.count : 0;
  for (const a of [...Object.values(geo.attributes), geo.index].filter(Boolean)) a.onUploadCallback(); // jak WebGLAttributes.createBuffer
  ok('M3: po uploadzie position/color/index = null', M.mergedDecorCpuArraysReleased(g) === true);
  ok('M3: count zachowany (draw range)', geo.getAttribute('position').count === cnt && (!geo.index || geo.index.count === icnt));
  const plain = new THREE.Group(); plain.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial()));
  M.releaseMergedDecorCpuArraysAfterUpload(plain);
  ok('M3: grupa NIEzmergowana nietknieta (wspoldzielone geometrie bezpieczne)', plain.children[0].geometry.getAttribute('position').onUploadCallback.toString().indexOf('array = null') < 0);
}
cleanupTmp();
console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
