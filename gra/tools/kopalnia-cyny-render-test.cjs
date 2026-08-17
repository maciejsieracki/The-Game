'use strict';
/**
 * kopalnia-cyny-render-test.cjs — P-CYNA-BRAK-WIZUALIZACJI-3D-NA-MAPIE (verify/close)
 *
 * Sprawdza dwie rzeczy naraz:
 *  (A) SUROWE ZŁOŻE cyny ma model 3D podpięty w buildStyledResourceOverlay
 *      (wzorem zloze-zloto-render-test.cjs dla R-ZLOTO-NIEWIDOCZNE);
 *  (B) ULEPSZENIE „Kopalnia cyny" ma WŁASNĄ bryłę, a nie generyczną kopalnię —
 *      i mieści się w obrysie heksa przy poprawnych proporcjach.
 *
 * Run from gra/:  node tools/kopalnia-cyny-render-test.cjs
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.kopalnia-cyny-render-entry.ts');
const bundle = path.join(__dirname, '.kopalnia-cyny-render-bundle.cjs');

fs.writeFileSync(entry, `
export * as THREE from 'three';
export { buildStyledResourceOverlay } from '../src/render/styleResources';
export { buildZlozeCyna, buildZlozeZloto } from '../src/render/ulepszenia-modele-p3b';
export { buildKopalniaCyny } from '../src/render/kopalnia-cyny-opus5';
export { buildKopalnia } from '../src/render/ulepszenia-modele-p2';
export { buildRobloxImprovement } from '../src/render/robloxImprovements';
export { buildImprovement } from '../src/render/improvements';
export { buildResourceOverlayFromZloze } from '../src/render/resources';
export { Nakladka } from '../src/types/hex';
export { HEX_R } from '../src/render/hexutil';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);
const THREE = M.THREE;

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

function countMeshes(group) {
  let n = 0;
  group.traverse((o) => { if (o.isMesh) n++; });
  return n;
}
function countTris(group) {
  let n = 0;
  group.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const g = o.geometry;
    n += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  });
  return Math.round(n);
}
/** Największy promień w płaszczyźnie XZ po wszystkich WIERZCHOŁKACH (nie po bbox). */
function maxRadiusXZ(group) {
  group.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  let max = 0;
  group.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const pos = o.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      max = Math.max(max, Math.hypot(v.x, v.z));
    }
  });
  return max;
}
function bbox(group) {
  group.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(group);
}

console.log('kopalnia-cyny-render-test (P-CYNA-BRAK-WIZUALIZACJI-3D-NA-MAPIE)\n');

// ── A. SUROWE ZŁOŻE ────────────────────────────────────────────────────────
const roblox = M.buildStyledResourceOverlay(M.Nakladka.Brak, 'roblox', 'cyna');
assert(roblox != null, 'A1 roblox + zloze="cyna" → overlay != null (było null = niewidoczne złoże)');
assert(roblox && countMeshes(roblox) >= 18, 'A2 roblox overlay ma >=18 meshy (4 skupiska)');

const minecraft = M.buildStyledResourceOverlay(M.Nakladka.Brak, 'minecraft', 'cyna');
assert(minecraft != null, 'A3 minecraft + zloze="cyna" → overlay != null (styledTinOre)');
assert(minecraft && countMeshes(minecraft) >= 6, 'A4 minecraft overlay ma >=6 meshy');

const civ = M.buildStyledResourceOverlay(M.Nakladka.Brak, 'civ', 'cyna');
assert(civ != null, 'A5 civ + zloze="cyna" → overlay != null (tinOreRocks)');
assert(M.buildResourceOverlayFromZloze('cyna') != null, 'A6 buildResourceOverlayFromZloze("cyna") != null');
assert(M.buildZlozeCyna() != null, 'A7 buildZlozeCyna() eksportowane');

// Złoże cyny NIE MOŻE być fallbackiem na złoto/miedź. Porównanie po liczbie
// trójkątów byłoby ślepe (dwa różne modele mogą mieć tyle samo) — sprawdzamy
// PALETĘ: kasyteryt jest czarnobrunatny i żadna barwa złota/miedzi wystąpić nie może.
// / EN: triangle counts can collide by accident; assert on the palette instead.
function kolory(group) {
  const s = new Set();
  group.traverse(o => { if (o.isMesh && o.material && o.material.color) s.add(o.material.color.getHex()); });
  return s;
}
const kCyna = kolory(M.buildZlozeCyna());
const kZloto = kolory(M.buildZlozeZloto());
assert(kCyna.has(0x2a201a), 'A8 złoże cyny ma barwę kasyterytu 0x2a201a');
assert(!kCyna.has(0xffc21a) && !kCyna.has(0xffe86e) && !kCyna.has(0xc98505),
  'A9 złoże cyny NIE używa żadnej barwy złota (brak fallbacku na złoto)');
assert(!kCyna.has(0xe07b2f) && !kCyna.has(0x39c6b2),
  'A10 złoże cyny NIE używa barw miedzi (brak fallbacku na miedź)');
assert([...kCyna].some(c => !kZloto.has(c)), 'A11 paleta cyny różna od palety złota');

// ── B. ULEPSZENIE „KOPALNIA CYNY" ─────────────────────────────────────────
const kop = M.buildKopalniaCyny();
assert(kop != null, 'B1 buildKopalniaCyny() zwraca grupę');

const genTri = countTris(M.buildKopalnia());
const cynTri = countTris(kop);
assert(cynTri !== genTri, `B2 to NIE generyczna kopalnia (tri cyna=${cynTri} vs generyczna=${genTri})`);

const rbx = M.buildRobloxImprovement('kopalnia_cyny');
assert(countTris(rbx) === cynTri, `B3 robloxImprovements wpięte na własny model (tri=${countTris(rbx)})`);
const civImp = M.buildImprovement('kopalnia_cyny');
assert(countTris(civImp) === cynTri, `B4 improvements.ts wpięte na własny model (tri=${countTris(civImp)})`);

// geometria: obrys, wysokość, spód
const bb = bbox(kop);
const maxR = maxRadiusXZ(kop);
const HEX_INNER = 0.866 * M.HEX_R; // wpisany promień heksa — poza nim wchodzimy na sąsiada
console.log(`\n   maxRadiusXZ = ${maxR.toFixed(3)} (limit wpisany ${HEX_INNER.toFixed(3)})`);
console.log(`   bbox y      = ${bb.min.y.toFixed(4)} … ${bb.max.y.toFixed(3)}`);
console.log(`   bbox xz     = x[${bb.min.x.toFixed(3)}, ${bb.max.x.toFixed(3)}]  z[${bb.min.z.toFixed(3)}, ${bb.max.z.toFixed(3)}]`);
console.log(`   meshy=${countMeshes(kop)}  tri=${cynTri}\n`);

assert(maxR <= HEX_INNER, `B5 cały model w obrysie heksa (maxR=${maxR.toFixed(3)} <= ${HEX_INNER.toFixed(3)})`);
assert(maxR <= 0.70 * M.HEX_R, `B6 zapas na kompaktowanie sektorowe (maxR=${maxR.toFixed(3)} <= 0.700)`);
assert(bb.min.y >= -0.001, `B7 nic nie wchodzi pod teren (minY=${bb.min.y.toFixed(4)})`);
assert(bb.max.y >= 0.45 * M.HEX_R, `B8 dominanta pionowa czytelna z 52° (maxY=${bb.max.y.toFixed(3)} >= 0.450)`);
assert(bb.max.y <= 0.62 * M.HEX_R, `B9 nie wyższa niż Kopalnia złota+zapas (maxY=${bb.max.y.toFixed(3)} <= 0.620)`);
// Budżet trójkątów: punktem odniesienia jest Kopalnia złota (992 tri, 57 meshy) —
// ten sam wzorzec konwencji, ta sama rola na mapie. Limit 1000 = „nie drożej niż wzorzec".
// / EN: triangle budget benchmarked against the Gold Mine (992 tri) — same convention, same role.
assert(cynTri <= 1000, `B10 budżet trójkątów wobec Kopalni złota=992 (${cynTri} <= 1000)`);

// materiały/geometrie współdzielone — dwie instancje muszą wskazywać te same obiekty
const kop2 = M.buildKopalniaCyny();
const g1 = []; kop.traverse(o => { if (o.isMesh) g1.push(o.geometry); });
const g2 = []; kop2.traverse(o => { if (o.isMesh) g2.push(o.geometry); });
assert(g1.length === g2.length && g1.every((g, i) => g === g2[i]),
  'B11 geometrie są SINGLETONAMI modułu (zero alokacji per instancja)');
assert(Array.isArray(kop.userData.mats) && kop.userData.mats.length === 0,
  'B12 userData.mats puste (współdzielone materiały nie mogą być zwalniane per żeton)');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
