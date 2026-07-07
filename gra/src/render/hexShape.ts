/**
 * hexShape.ts — wspólna geometria pointy-top (zgodna z units.ts / CylinderGeometry mapy).
 */
import * as THREE from 'three';

/** Kontur pointy-top w płaszczyźnie XZ (środek 0,0). */
export function hexRingPointsXZ(R: number, y = 0): THREE.Vector3[] {
  const verts: THREE.Vector3[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 2 + (i * Math.PI) / 3;
    verts.push(new THREE.Vector3(R * Math.cos(angle), y, R * Math.sin(angle)));
  }
  return verts;
}

/** Shape w płaszczyźnie XY (obrót mesh.rotation.x = -π/2 → XZ). */
export function appendPointyTopHex(
  path: THREE.Path | THREE.Shape,
  radius: number,
  reverse: boolean,
): void {
  const order = reverse ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5];
  for (let j = 0; j < 6; j++) {
    const i = order[j]!;
    const angle = Math.PI / 2 + (i * Math.PI) / 3;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (j === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  path.closePath();
}
