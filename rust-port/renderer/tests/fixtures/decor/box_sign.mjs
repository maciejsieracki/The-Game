// Reference for `bounding_box_keeps_web_sign_of_zero` (tests/decor_web_parity.rs),
// P4.17 r3 (Evaluator r3 objection 5): `Box3.setFromObject(root, true)` of
// three r169 keeps the sign of zero of `Math.min` / `Math.max`
// (`Math.min(+0, -0) === -0`, `Math.max(-0, +0) === +0`, in either order).
//
// The root is a Mesh placed at (-0, -0, -0) without a parent, so
// `matrixWorld = matrix` and `applyMatrix4` gives `v + (-0)`, which keeps the
// sign of the vertex coordinate (+0 + -0 = +0, -0 + -0 = -0). With a parent
// group the sign would already be lost in `multiplyMatrices` (1 * -0 + 0 * -0
// + ... + 0 = +0), which is why no decor fixture exercises it.
//
// Run outside the repository (three@0.169.0 resolvable, see README.md):
//   node box_sign.mjs > box_sign.json
import * as THREE from 'three';

const num = (v) => (Object.is(v, -0) ? '-0' : String(v));
const arr = (a) => '[' + a.map(num).join(',') + ']';

function boxOf(pos, node) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial());
  m.position.set(node[0], node[1], node[2]);
  m.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(m, true);
  return [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z];
}

const N = [-0, -0, -0];
const P = [0, 0, 0];
const cases = [
  ['plusThenMinus', [0, 0, 0, -0, -0, -0], N],
  ['minusThenPlus', [-0, -0, -0, 0, 0, 0], N],
  ['onlyMinus', [-0, -0, -0], N],
  ['onlyPlus', [0, 0, 0], N],
  ['mixedAxes', [0, -0, 0, -0, 0, -0], N],
  ['plusNode', [0, 0, 0, -0, -0, -0], P],
];
const out = cases.map(
  ([name, pos, node]) =>
    `{"name":"${name}","pos":${arr(pos)},"node":${arr(node)},"box":${arr(boxOf(pos, node))}}`,
);
console.log(`{"three":"${THREE.REVISION}","cases":[${out.join(',')}]}`);
