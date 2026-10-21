// Generator of Three.js r169 reference geometry for civ-renderer `geom`
// (topic R-RUSTPORT-P4-8-GEOMETRY-PRIMS-Q1).
//
// Usage (run from any directory OUTSIDE the downloaded package):
//   node gen_fixtures.mjs <three-package-root> <output-dir>
// where <three-package-root> is the unpacked `npm pack three@0.169.0`
// (the directory containing package.json with version 0.169.0).
//
// Writes one JSON file per family into <output-dir>. Each file:
//   { "three": "0.169.0", "cases": [ { name, kind, args, position, normal,
//     uv, index, groups } ] }
// Buffers are the exact Float32Array contents (as JSON numbers; NaN -> null),
// `index` is null for non-indexed geometry, groups are [start, count, mat].
// `args` is everything the Rust test needs to rebuild the same geometry;
// computed inputs (shape outlines, curve points) are stored as the exact f64
// values JavaScript produced.

import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , threeRoot, outDir] = process.argv;
if (!threeRoot || !outDir) {
  console.error('usage: node gen_fixtures.mjs <three-package-root> <output-dir>');
  process.exit(2);
}
const pkg = JSON.parse(readFileSync(join(threeRoot, 'package.json'), 'utf8'));
if (pkg.name !== 'three' || pkg.version !== '0.169.0') {
  console.error(`expected three@0.169.0, got ${pkg.name}@${pkg.version}`);
  process.exit(2);
}
const THREE = await import(pathToFileURL(join(threeRoot, 'build/three.module.js')).href);
const BGU = await import(
  pathToFileURL(join(threeRoot, 'examples/jsm/utils/BufferGeometryUtils.js')).href
);
if (THREE.REVISION !== '169') throw new Error(`REVISION ${THREE.REVISION}`);

const PI = Math.PI;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- builders

function hexPts(radius, reverse) {
  // tracePointyTopHex / appendPointyTopHex (bronzeCityRoblox.ts:57, units.ts:475)
  const order = reverse ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5];
  const pts = [];
  for (let j = 0; j < 6; j++) {
    const i = order[j];
    const angle = Math.PI / 2 + (i * Math.PI) / 3;
    pts.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
  }
  return pts;
}

function starPts(R, frac) {
  // unitVeteranBadges.ts:155
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? R : R * frac;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  return pts;
}

function makePath(P, pts, close) {
  const p = new P();
  pts.forEach(([x, y], j) => (j === 0 ? p.moveTo(x, y) : p.lineTo(x, y)));
  if (close) p.closePath();
  return p;
}

function makeShape(s) {
  const shape = makePath(THREE.Shape, s.outline, s.close !== false);
  for (const h of s.holes || []) shape.holes.push(makePath(THREE.Path, h, s.close !== false));
  return shape;
}

function build(kind, a) {
  switch (kind) {
    case 'box': return new THREE.BoxGeometry(...a);
    case 'plane': return new THREE.PlaneGeometry(...a);
    case 'cylinder': return new THREE.CylinderGeometry(...a);
    case 'cone': return new THREE.ConeGeometry(...a);
    case 'sphere': return new THREE.SphereGeometry(...a);
    case 'torus': return new THREE.TorusGeometry(...a);
    case 'circle': return new THREE.CircleGeometry(...a);
    case 'ring': return new THREE.RingGeometry(...a);
    case 'icosahedron': return new THREE.IcosahedronGeometry(...a);
    case 'dodecahedron': return new THREE.DodecahedronGeometry(...a);
    case 'octahedron': return new THREE.OctahedronGeometry(...a);
    case 'tetrahedron': return new THREE.TetrahedronGeometry(...a);
    case 'shape': return new THREE.ShapeGeometry(makeShape(a));
    case 'shape_multi': return new THREE.ShapeGeometry(a.shapes.map(makeShape));
    case 'extrude': return new THREE.ExtrudeGeometry(a.shapes.map(makeShape), a.options);
    case 'tube': {
      const pts = a.points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
      const curve = new THREE.CatmullRomCurve3(pts, a.curveClosed, a.curveType, a.tension);
      return new THREE.TubeGeometry(curve, a.tubularSegments, a.radius, a.radialSegments, a.closed);
    }
    case 'transform': {
      const g = build(a.base.kind, a.base.args);
      for (const op of a.ops) applyOp(g, op);
      return g;
    }
    case 'merge': {
      const parts = a.parts.map((p) => build(p.kind, p.args));
      return BGU.mergeGeometries(parts, a.useGroups);
    }
    default: throw new Error(kind);
  }
}

function applyOp(g, op) {
  const [name, ...v] = op;
  switch (name) {
    case 'rotateX': g.rotateX(v[0]); break;
    case 'rotateY': g.rotateY(v[0]); break;
    case 'rotateZ': g.rotateZ(v[0]); break;
    case 'translate': g.translate(v[0], v[1], v[2]); break;
    case 'scale': g.scale(v[0], v[1], v[2]); break;
    case 'trs': {
      // Object3D.updateMatrix(): compose(position, quaternion(euler), scale)
      const o = new THREE.Object3D();
      o.position.set(v[0], v[1], v[2]);
      o.rotation.set(v[3], v[4], v[5], v[6]);
      o.scale.set(v[7], v[8], v[9]);
      o.updateMatrix();
      g.applyMatrix4(o.matrix);
      break;
    }
    case 'computeVertexNormals': g.computeVertexNormals(); break;
    default: throw new Error(name);
  }
}

const num = (x) => (Number.isNaN(x) ? null : x);
function dump(name, kind, args) {
  const g = build(kind, args);
  const at = (n) => (g.attributes[n] ? Array.from(g.attributes[n].array, num) : []);
  return {
    name,
    kind,
    args,
    position: at('position'),
    normal: at('normal'),
    uv: at('uv'),
    index: g.index ? Array.from(g.index.array) : null,
    groups: g.groups.map((x) => [x.start, x.count, x.materialIndex]),
  };
}

// ------------------------------------------------------------------- cases
// Typical values come from the web call sites (P4-4 §1.2); edge values cover
// minimum segment counts, zero sizes, partial arcs and larger tessellation.

const families = {
  box: [
    ['unit', [1, 1, 1, 1, 1, 1]],
    ['typical_small', [0.12, 0.3, 0.08, 1, 1, 1]],
    ['segmented', [2, 3, 4, 2, 3, 4]],
    ['zero_height', [1, 0, 1, 1, 1, 1]],
    ['negative_depth', [1, 1, -1, 1, 1, 1]],
    ['large_segments', [1, 1, 1, 10, 10, 10]],
  ],
  plane: [
    ['unit', [1, 1, 1, 1]],
    ['segmented', [2, 1.5, 4, 3]],
    ['zero_size', [0, 0, 1, 1]],
  ],
  cylinder: [
    ['default', [1, 1, 1, 32, 1, false, 0, TAU]],
    ['typical', [0.05, 0.07, 0.4, 8, 1, false, 0, TAU]],
    ['min_segments', [1, 1, 1, 3, 1, false, 0, TAU]],
    ['frustum_hseg', [0.5, 1, 2, 6, 3, false, 0, TAU]],
    ['open_ended', [1, 0.5, 1, 6, 2, true, 0, TAU]],
    ['partial_theta', [1, 1, 1, 5, 1, false, 0.3, PI]],
    ['zero_top', [0, 1, 1, 6, 1, false, 0, TAU]],
    ['zero_bottom', [1, 0, 1, 6, 1, false, 0, TAU]],
    ['hexagonal_prism', [1, 1, 0.2, 6, 1, false, PI / 6, TAU]],
    ['large', [1, 1, 1, 64, 4, false, 0, TAU]],
  ],
  cone: [
    ['default', [1, 1, 32, 1, false, 0, TAU]],
    ['typical', [0.1, 0.25, 6, 1, false, 0, TAU]],
    ['min_segments', [1, 1, 3, 1, false, 0, TAU]],
    ['open_hseg', [1, 2, 8, 3, true, 0, TAU]],
    ['pyramid', [0.5, 0.5, 4, 1, false, PI / 4, TAU]],
  ],
  sphere: [
    ['default', [1, 32, 16, 0, TAU, 0, PI]],
    ['typical', [0.08, 8, 6, 0, TAU, 0, PI]],
    ['min_segments', [1, 3, 2, 0, TAU, 0, PI]],
    ['below_min_clamped', [1, 1, 1, 0, TAU, 0, PI]],
    ['hemisphere', [1, 12, 6, 0, TAU, 0, PI / 2]],
    ['lower_cap', [1, 12, 6, 0, TAU, PI / 2, PI / 2]],
    ['partial_phi', [2, 10, 5, 0.5, PI, 0.2, 2]],
    ['zero_radius', [0, 6, 4, 0, TAU, 0, PI]],
    ['large', [1, 48, 24, 0, TAU, 0, PI]],
  ],
  torus: [
    ['default', [1, 0.4, 12, 48, TAU]],
    ['typical', [0.1, 0.015, 6, 16, TAU]],
    ['min', [1, 0.2, 2, 3, TAU]],
    ['half_arc', [1, 0.3, 8, 12, PI]],
    ['zero_tube', [1, 0, 4, 6, TAU]],
  ],
  circle: [
    ['default', [1, 32, 0, TAU]],
    ['hex', [0.9, 6, 0, TAU]],
    ['below_min_clamped', [1, 1, 0, TAU]],
    ['partial', [2, 8, 0.25, PI]],
    ['zero_radius', [0, 6, 0, TAU]],
  ],
  ring: [
    ['default', [0.5, 1, 32, 1, 0, TAU]],
    ['typical', [0.8, 0.9, 24, 1, 0, TAU]],
    ['below_min_clamped', [0.5, 1, 1, 0, 0, TAU]],
    ['phi_segments', [0.2, 1, 6, 3, 0, TAU]],
    ['partial', [0.5, 1, 8, 2, 1, PI / 2]],
  ],
  polyhedron: [
    ['icosahedron_d0', 'icosahedron', [1, 0]],
    ['icosahedron_d1', 'icosahedron', [0.5, 1]],
    ['icosahedron_d2', 'icosahedron', [2, 2]],
    ['dodecahedron_d0', 'dodecahedron', [0.035, 0]],
    ['dodecahedron_d1', 'dodecahedron', [1, 1]],
    ['octahedron_d0', 'octahedron', [0.03, 0]],
    ['octahedron_d1', 'octahedron', [1, 1]],
    ['octahedron_d3', 'octahedron', [1, 3]],
    ['tetrahedron_d0', 'tetrahedron', [1, 0]],
    ['tetrahedron_d2', 'tetrahedron', [1, 2]],
  ],
  shape: [
    ['triangle_default', 'shape', { outline: [[0, 0.5], [-0.5, -0.5], [0.5, -0.5]], holes: [], close: true }],
    ['selection_hex_ring', 'shape', { outline: hexPts(0.94, false), holes: [hexPts(0.94 - 0.11, true)] }],
    ['owner_hex_ring', 'shape', { outline: hexPts(0.9, false), holes: [hexPts(0.9 - 0.045, true)] }],
    ['ccw_hole_not_reversed', 'shape', { outline: hexPts(1, true), holes: [hexPts(0.5, false)] }],
    ['star', 'shape', { outline: starPts(0.072, 0.42), holes: [] }],
    ['concave_two_holes', 'shape', {
      outline: [[0, 0], [4, 0], [4, 3], [2, 1.5], [0, 3]],
      holes: [[[0.5, 0.5], [1, 0.5], [1, 1], [0.5, 1]], [[2.6, 0.4], [3.4, 0.4], [3.4, 1.2]]],
    }],
    ['open_outline_not_closed', 'shape', { outline: [[0, 0], [1, 0], [1, 1], [0, 1]], holes: [], close: false }],
    ['many_points_hashed', 'shape', {
      // > 80 vertices -> Earcut z-order hashing path
      outline: Array.from({ length: 96 }, (_, i) => {
        const a = (i / 96) * TAU;
        const r = 1 + 0.25 * Math.sin(5 * a);
        return [r * Math.cos(a), r * Math.sin(a)];
      }),
      holes: [hexPts(0.3, true)],
    }],
    ['multi_two_shapes', 'shape_multi', {
      shapes: [
        { outline: hexPts(1, false), holes: [hexPts(0.8, true)] },
        { outline: [[2, 0], [3, 0], [3, 1]], holes: [] },
      ],
    }],
  ],
  extrude: [
    ['hex_wall_ring', 'extrude', {
      shapes: [{ outline: hexPts(1.0, false), holes: [hexPts(0.85, true)] }],
      options: { depth: 0.18, bevelEnabled: false },
    }],
    ['veteran_star', 'extrude', {
      shapes: [{ outline: starPts(0.072, 0.42), holes: [] }],
      options: { depth: 0.02, bevelEnabled: false, curveSegments: 1 },
    }],
    ['square_steps3', 'extrude', {
      shapes: [{ outline: [[0, 0], [1, 0], [1, 1], [0, 1]], holes: [] }],
      options: { depth: 2, steps: 3, bevelEnabled: false },
    }],
    ['square_default_bevel', 'extrude', {
      shapes: [{ outline: [[0, 0], [1, 0], [1, 1], [0, 1]], holes: [] }],
      options: {},
    }],
    ['hex_ring_bevel_custom', 'extrude', {
      shapes: [{ outline: hexPts(1, false), holes: [hexPts(0.6, true)] }],
      options: { depth: 0.5, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelOffset: 0.01, bevelSegments: 2, steps: 2 },
    }],
    ['two_shapes', 'extrude', {
      shapes: [
        { outline: [[0, 0], [1, 0], [0, 1]], holes: [] },
        { outline: [[2, 0], [3, 0], [3, 1], [2, 1]], holes: [] },
      ],
      options: { depth: 1, bevelEnabled: false },
    }],
  ],
  tube: (() => {
    // units.ts:6529 — CatmullRomCurve3(points) default centripetal, then
    // TubeGeometry(curve, 64, 0.05, 8, false)
    const route = [[0, 0.1, 0], [1.5, 0.12, 0.866], [3, 0.2, 0], [4.5, 0.15, 0.866], [6, 0.1, 1.732]];
    return [
      ['trade_route', 'tube', { points: route, curveClosed: false, curveType: 'centripetal', tension: 0.5, tubularSegments: 64, radius: 0.05, radialSegments: 8, closed: false }],
      ['two_points', 'tube', { points: [[0, 0, 0], [1, 1, 0]], curveClosed: false, curveType: 'centripetal', tension: 0.5, tubularSegments: 4, radius: 0.1, radialSegments: 3, closed: false }],
      ['chordal', 'tube', { points: route, curveClosed: false, curveType: 'chordal', tension: 0.5, tubularSegments: 12, radius: 0.2, radialSegments: 5, closed: false }],
      ['catmullrom_tension', 'tube', { points: route, curveClosed: false, curveType: 'catmullrom', tension: 0.3, tubularSegments: 12, radius: 0.2, radialSegments: 5, closed: false }],
      ['closed_loop', 'tube', { points: [[1, 0, 0], [0, 0.3, 1], [-1, 0, 0], [0, -0.3, -1]], curveClosed: true, curveType: 'centripetal', tension: 0.5, tubularSegments: 16, radius: 0.1, radialSegments: 6, closed: true }],
      ['straight_axis', 'tube', { points: [[0, 0, 0], [0, 0, 1], [0, 0, 2]], curveClosed: false, curveType: 'centripetal', tension: 0.5, tubularSegments: 3, radius: 1, radialSegments: 4, closed: false }],
    ];
  })(),
  ops: [
    ['box_rotateX_translate', 'transform', { base: { kind: 'box', args: [1, 2, 3, 1, 1, 1] }, ops: [['rotateX', -PI / 2], ['translate', 0.5, -1, 2]] }],
    ['cylinder_rotYZ_scale', 'transform', { base: { kind: 'cylinder', args: [0.5, 1, 2, 6, 1, false, 0, TAU] }, ops: [['rotateY', 0.7], ['rotateZ', PI / 2], ['scale', 1, 2, 0.5]] }],
    ['extrude_hex_rotateX', 'transform', { base: { kind: 'extrude', args: { shapes: [{ outline: hexPts(1, false), holes: [hexPts(0.85, true)] }], options: { depth: 0.18, bevelEnabled: false } } }, ops: [['rotateX', -PI / 2]] }],
    ['sphere_trs_xyz', 'transform', { base: { kind: 'sphere', args: [1, 8, 6, 0, TAU, 0, PI] }, ops: [['trs', 1, 2, 3, 0.3, -0.5, 1.1, 'XYZ', 2, 1, 0.5]] }],
    ['box_trs_yxz_negscale', 'transform', { base: { kind: 'box', args: [1, 1, 1, 1, 1, 1] }, ops: [['trs', -1, 0, 0.5, 0.2, 0.4, 0.6, 'YXZ', -1, 1, 1]] }],
    ['cone_trs_zyx', 'transform', { base: { kind: 'cone', args: [1, 2, 5, 1, false, 0, TAU] }, ops: [['trs', 0, 0, 0, 1, 0.5, -0.25, 'ZYX', 1, 1, 1]] }],
    ['sphere_recompute_normals', 'transform', { base: { kind: 'sphere', args: [1, 8, 6, 0, TAU, 0, PI] }, ops: [['computeVertexNormals']] }],
    ['cylinder_recompute_normals', 'transform', { base: { kind: 'cylinder', args: [1, 0.5, 1, 6, 2, false, 0, TAU] }, ops: [['scale', 1, 3, 1], ['computeVertexNormals']] }],
    ['merge_indexed_groups', 'merge', { parts: [{ kind: 'box', args: [1, 1, 1, 1, 1, 1] }, { kind: 'cylinder', args: [0.5, 0.5, 1, 6, 1, false, 0, TAU] }, { kind: 'sphere', args: [0.3, 6, 4, 0, TAU, 0, PI] }], useGroups: true }],
    ['merge_indexed_nogroups', 'merge', { parts: [{ kind: 'plane', args: [1, 1, 2, 2] }, { kind: 'transform', args: { base: { kind: 'box', args: [1, 1, 1, 1, 1, 1] }, ops: [['translate', 2, 0, 0]] } }], useGroups: false }],
    ['merge_nonindexed_groups', 'merge', { parts: [{ kind: 'dodecahedron', args: [1, 0] }, { kind: 'octahedron', args: [0.5, 1] }], useGroups: true }],
  ],
};

let total = 0;
for (const [family, cases] of Object.entries(families)) {
  const out = cases.map((c) => (c.length === 2 ? dump(c[0], family, c[1]) : dump(c[0], c[1], c[2])));
  total += out.length;
  writeFileSync(join(outDir, `${family}.json`), JSON.stringify({ three: pkg.version, cases: out }) + '\n');
  console.log(`${family}.json: ${out.length} cases`);
}
console.log(`total cases: ${total}`);
