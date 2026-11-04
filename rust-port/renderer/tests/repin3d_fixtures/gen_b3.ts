// R-RUSTPORT-REPIN-3D-B2-Q1 (batch B3) — reference generator for the commander star of
// render/unitVeteranBadges.ts of the web `origin/main` @ 86d510c66
// (`applyUnitCommanderStar` :275-301, `COMMANDER_STAR_HIT_UD` :213). The flag itself is
// computed by the UnitRenderer (render/units.ts :6147, not ported: DTO of the caller).
//
// Node only (no canvas: geometry + material parameters), bundled by esbuild 0.24.0 with
// three@0.169.0; numbers from node v22.22.0 like every MOD fixture (P4.11 pattern). The web
// module is imported UNCHANGED from `git archive origin/main gra/src gra/data` (../websrc)
// and called through its exported entry points.
//
//   ../ref/node_modules/.bin/esbuild gen_b3.ts --bundle --platform=node --format=esm \
//     --outfile=gen_b3.mjs --log-level=warning && node gen_b3.mjs ../out

import * as THREE from 'three';
import { writeFileSync } from 'node:fs';
import * as Vet from '../websrc/gra/src/render/unitVeteranBadges';

function hx(v: number): string {
  const dv = new DataView(new ArrayBuffer(8));
  dv.setFloat64(0, v, false);
  let s = '';
  for (let i = 0; i < 8; i++) s += dv.getUint8(i).toString(16).padStart(2, '0');
  return s;
}
function hx32(v: number): string {
  const dv = new DataView(new ArrayBuffer(4));
  dv.setFloat32(0, v, false);
  let s = '';
  for (let i = 0; i < 4; i++) s += dv.getUint8(i).toString(16).padStart(2, '0');
  return s;
}

const geoById = new Map<THREE.BufferGeometry, string>();
const geos: unknown[] = [];
function geoId(g: THREE.BufferGeometry): string {
  let id = geoById.get(g);
  if (id) return id;
  id = 'g' + geoById.size;
  geoById.set(g, id);
  const arr = (n: string) => Array.from(g.getAttribute(n).array as Float32Array, hx32);
  geos.push({ id, vtx: g.getAttribute('position').count, position: arr('position'), normal: arr('normal'), uv: arr('uv') });
  return id;
}
const col = (c: THREE.Color | undefined) => (c ? [hx(c.r), hx(c.g), hx(c.b)] : null);
function matRec(m: THREE.Material): unknown {
  const a = m as any;
  return {
    type: m.type, color: col(a.color), emissive: col(a.emissive), map: a.map ? 'tex' : null,
    transparent: m.transparent, depthTest: m.depthTest, depthWrite: m.depthWrite, toneMapped: m.toneMapped,
    side: m.side, opacity: hx(m.opacity), roughness: hx(a.roughness), metalness: hx(a.metalness),
  };
}
function dumpTree(root: THREE.Object3D): unknown[] {
  const nodes: unknown[] = [];
  const index = new Map<THREE.Object3D, number>();
  root.traverse((o) => {
    index.set(o, nodes.length);
    const rec: any = {
      type: o.type, name: o.name, parent: o.parent && index.has(o.parent) ? index.get(o.parent) : -1,
      p: [o.position.x, o.position.y, o.position.z].map(hx),
      r: [o.rotation.x, o.rotation.y, o.rotation.z].map(hx), order: o.rotation.order,
      s: [o.scale.x, o.scale.y, o.scale.z].map(hx),
      renderOrder: o.renderOrder, visible: o.visible,
      ud: Object.fromEntries(Object.entries(o.userData).filter(([, v]) => typeof v !== 'object')),
    };
    if ((o as any).isMesh) {
      const m = o as THREE.Mesh;
      rec.geo = geoId(m.geometry);
      rec.mat = matRec(m.material as THREE.Material);
    }
    nodes.push(rec);
  });
  return nodes;
}

const out: any = { consts: { COMMANDER_STAR_HIT_UD: Vet.COMMANDER_STAR_HIT_UD }, cases: [] };

// Sequences of applyUnitCommanderStar on ONE token (sync() semantics). After each step: the
// commander sub-tree (or null), whether the badge object is the SAME as after the previous
// step (the web keeps it: `if (old) return`), and the token's child count.
const SEQS: boolean[][] = [
  [true], [false], [true, true], [true, false], [false, true], [true, false, true], [false, false], [true, true, false, false, true],
];
for (const seq of SEQS) {
  const g = new THREE.Group(); g.name = 'token';
  let prev: THREE.Object3D | undefined;
  const steps: unknown[] = [];
  for (const has of seq) {
    Vet.applyUnitCommanderStar(g, has);
    const badge = g.userData['commanderStarBadge'] as THREE.Object3D | undefined;
    steps.push({
      has,
      present: !!badge,
      same: !!badge && badge === prev,
      children: g.children.length,
      tree: badge ? dumpTree(badge) : null,
    });
    prev = badge;
  }
  out.cases.push({ seq, steps });
}
// Coexistence with the veteran stars: the commander badge is a separate child.
{
  const g = new THREE.Group(); g.name = 'token';
  Vet.applyUnitVeteranBadgeStarCount(g, 3);
  Vet.applyUnitCommanderStar(g, true);
  Vet.applyUnitVeteranBadgeStarCount(g, 0);
  out.coexist = { children: g.children.map((c) => c.name), commander: dumpTree(g.userData['commanderStarBadge']) };
}
out.geos = geos;
writeFileSync(process.argv[2].replace(/\/?$/, '/') + 'b3.json', JSON.stringify(out) + '\n');
console.log(`b3 cases=${out.cases.length} geos=${geos.length}`);
