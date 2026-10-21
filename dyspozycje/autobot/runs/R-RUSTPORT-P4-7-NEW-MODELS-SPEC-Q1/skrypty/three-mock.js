// Minimalny MOCK three.js (r169) do liczenia meshy/trojkatow/AABB modeli z pinu edb8fb56.
// Liczby trojkatow wg regul generatorow r169 (niezaindeksowane: index.count/3):
//  Box(1,1,1)=12; Cylinder(rt,rb,h,seg,hs=1,open=false)=tors (seg*hs*2 minus pominiete
//  zdegenerowane przy rt==0 / rb==0) + kapsle (seg gdy r>0); Cone=Cylinder(0,r);
//  Circle(seg)=seg; Sphere(w=32,h=16)= w*(2h-2); Plane=2*ws*hs; Ring(theta=32,phi=1)=2*theta*phi;
//  Torus(rs=12,ts=48)=2*rs*ts; Ico(detail d)=20*(d+1)^2; Dodeca(d=0)=36; Octa(d=0)=8.
//  Extrude: NIE liczone (null) — zaznaczane osobno.
export const DoubleSide = 2, FrontSide = 0, BackSide = 1;
let EXTRUDE_HITS = 0;
export function __extrudeHits() { return EXTRUDE_HITS; }

class Vec3 { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  setScalar(s) { this.x = this.y = this.z = s; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; } }
export { Vec3 as Vector3 };
export class Vector2 { constructor(x = 0, y = 0) { this.x = x; this.y = y; } }
class Euler extends Vec3 {}
export class Color { constructor(c) { this.v = typeof c === 'number' ? c : 0; }
  lerp() { return this; } getHex() { return this.v; } copy(o) { this.v = o.v; return this; } clone() { return new Color(this.v); } }

export class Object3D {
  constructor() { this.children = []; this.position = new Vec3(); this.rotation = new Euler(); this.scale = new Vec3(1, 1, 1); this.userData = {}; this.parent = null; this.isMesh = false; }
  add(...o) { for (const c of o) { this.children.push(c); c.parent = this; } return this; }
  traverse(f) { f(this); for (const c of this.children) c.traverse(f); }
}
export class Group extends Object3D {}
export class Mesh extends Object3D { constructor(g, m) { super(); this.geometry = g; this.material = m; this.isMesh = true; } }

class Geo { constructor(tri, bb) { this.tri = tri; this.bb = bb; } dispose() {} }
export class BufferGeometry extends Geo { constructor() { super(null, null); } }
export class BoxGeometry extends Geo { constructor(w = 1, h = 1, d = 1, ws = 1, hs = 1, ds = 1) {
  super(2 * (ws * hs + hs * ds + ws * ds) * 2, [-w / 2, -h / 2, -d / 2, w / 2, h / 2, d / 2]); this.kind = 'Box'; } }
function cylTri(rt, rb, seg, hs, open) {
  let t = 0;
  for (let y = 0; y < hs; y++) { if (rt > 0 || y !== 0) t += seg; if (rb > 0 || y !== hs - 1) t += seg; }
  if (!open) { if (rt > 0) t += seg; if (rb > 0) t += seg; }
  return t;
}
export class CylinderGeometry extends Geo { constructor(rt = 1, rb = 1, h = 1, seg = 32, hs = 1, open = false) {
  const r = Math.max(rt, rb); super(cylTri(rt, rb, seg, hs, open), [-r, -h / 2, -r, r, h / 2, r]); this.kind = 'Cyl' + seg; } }
export class ConeGeometry extends Geo { constructor(r = 1, h = 1, seg = 32, hs = 1, open = false) {
  super(cylTri(0, r, seg, hs, open), [-r, -h / 2, -r, r, h / 2, r]); this.kind = 'Cone' + seg; } }
export class CircleGeometry extends Geo { constructor(r = 1, seg = 32) { super(seg, [-r, -r, 0, r, r, 0]); this.kind = 'Circle'; } }
export class SphereGeometry extends Geo { constructor(r = 1, w = 32, h = 16) { super(w * (2 * h - 2), [-r, -r, -r, r, r, r]); this.kind = 'Sph'; } }
export class PlaneGeometry extends Geo { constructor(w = 1, h = 1, ws = 1, hs = 1) { super(2 * ws * hs, [-w / 2, -h / 2, 0, w / 2, h / 2, 0]); } }
export class RingGeometry extends Geo { constructor(i = 0.5, o = 1, ts = 32, ps = 1) { super(2 * ts * ps, [-o, -o, 0, o, o, 0]); } }
export class TorusGeometry extends Geo { constructor(r = 1, t = 0.4, rs = 12, ts = 48) { const R = r + t; super(2 * rs * ts, [-R, -R, -t, R, R, t]); } }
export class IcosahedronGeometry extends Geo { constructor(r = 1, d = 0) { super(20 * (d + 1) ** 2, [-r, -r, -r, r, r, r]); } }
export class DodecahedronGeometry extends Geo { constructor(r = 1, d = 0) { super(36 * (d + 1) ** 2, [-r, -r, -r, r, r, r]); } }
export class OctahedronGeometry extends Geo { constructor(r = 1, d = 0) { super(8 * (d + 1) ** 2, [-r, -r, -r, r, r, r]); } }
export class ExtrudeGeometry extends Geo { constructor() { super(null, null); EXTRUDE_HITS++; this.kind = 'Extrude'; } }
export class Shape { moveTo() { return this; } lineTo() { return this; } closePath() { return this; } constructor() { this.holes = []; } }
export class Path extends Shape {}
class Mat { constructor(o = {}) { this.o = o; this.color = new Color(o.color); } dispose() {} clone() { return new this.constructor(this.o); } }
export class MeshLambertMaterial extends Mat {}
export class MeshStandardMaterial extends Mat {}
export class MeshBasicMaterial extends Mat {}

// --- pomiar ---
function mul(a, b) { const r = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[i * 4 + k] * b[k * 4 + j]; r[i * 4 + j] = s; } return r; }
function local(o) {
  const { x: a, y: b, z: c } = o.rotation; // Euler XYZ (Three domyslnie): R = Rx*Ry*Rz
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
  const Rx = [1, 0, 0, 0, 0, ca, -sa, 0, 0, sa, ca, 0, 0, 0, 0, 1];
  const Ry = [cb, 0, sb, 0, 0, 1, 0, 0, -sb, 0, cb, 0, 0, 0, 0, 1];
  const Rz = [cc, -sc, 0, 0, sc, cc, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const R = mul(mul(Rx, Ry), Rz);
  const S = [o.scale.x, 0, 0, 0, 0, o.scale.y, 0, 0, 0, 0, o.scale.z, 0, 0, 0, 0, 1];
  const RS = mul(R, S);
  RS[3] = o.position.x; RS[7] = o.position.y; RS[11] = o.position.z;
  return RS;
}
export function __measure(root) {
  let meshes = 0, tri = 0, triUnknown = 0, mats = new Set();
  const bb = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  let maxR = 0;
  const kinds = {};
  const walk = (o, M) => {
    const W = mul(M, local(o));
    if (o.isMesh) {
      meshes++; mats.add(o.material);
      const g = o.geometry;
      kinds[g.kind || g.constructor.name] = (kinds[g.kind || g.constructor.name] || 0) + 1;
      if (g.tri == null) triUnknown++; else tri += g.tri;
      if (g.bb) {
        const [x0, y0, z0, x1, y1, z1] = g.bb;
        for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) {
          const X = W[0] * x + W[1] * y + W[2] * z + W[3], Y = W[4] * x + W[5] * y + W[6] * z + W[7], Z = W[8] * x + W[9] * y + W[10] * z + W[11];
          bb[0] = Math.min(bb[0], X); bb[1] = Math.min(bb[1], Y); bb[2] = Math.min(bb[2], Z);
          bb[3] = Math.max(bb[3], X); bb[4] = Math.max(bb[4], Y); bb[5] = Math.max(bb[5], Z);
          maxR = Math.max(maxR, Math.hypot(X, Z));
        }
      }
    }
    for (const c of o.children) walk(c, W);
  };
  walk(root, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  return { meshes, tri, triUnknown, materials: mats.size, maxY: bb[4], maxR_corners: maxR, kinds };
}
