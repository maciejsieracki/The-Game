/**
 * picker.ts
 * Pure coordinate-conversion and picking utilities for hex grid input.
 *
 * Hex convention: POINTY-TOP, external radius R.
 *
 * Forward formula (axialToWorld in render/hexutil.ts):
 *   world_x = R * sqrt(3) * (q + r/2)
 *   world_z = R * 1.5     * r
 *
 * Inverse (worldToAxial here):
 *   rf = z / (R * 1.5)
 *   qf = x / (R * sqrt(3)) - rf / 2
 *   => fractional axial (qf, rf) rounded via cube-round
 *
 * No side effects, no event listeners.
 * main.ts attaches the canvas click handler and calls pixelToHex.
 */

import * as THREE from 'three';
import type { RuntimeUnit } from '../units/setup';

// ---------------------------------------------------------------------------
// Internal constant (mirrors hexutil.ts SQRT3 -- kept local to stay pure)
// ---------------------------------------------------------------------------

const SQRT3 = Math.sqrt(3);

/** Resolve InstancedMesh terrain hit → axial hex (built in render/scene.ts). */
export type TerrainPickResolver = (
  mesh: THREE.InstancedMesh,
  instanceId: number,
) => { q: number; r: number } | null;

// ---------------------------------------------------------------------------
// 1. worldToAxial
// ---------------------------------------------------------------------------

/**
 * Convert a world-space (x, z) coordinate to the nearest axial hex (q, r).
 * This is the exact algebraic inverse of axialToWorld from render/hexutil.ts:
 *
 *   axialToWorld: x = R * sqrt(3) * (q + r/2),  z = R * 1.5 * r
 *   worldToAxial: rf = z / (R * 1.5),            qf = x / (R * sqrt(3)) - rf / 2
 *
 * Fractional (qf, rf) is snapped to the nearest integer hex center using the
 * standard "convert to cube, round, fix largest residual" algorithm.
 */
export function worldToAxial(x: number, z: number, R: number): { q: number; r: number } {
  // Step 1: fractional axial coordinates (exact inverse of the forward formula)
  const rf = z / (R * 1.5);
  const qf = x / (R * SQRT3) - rf * 0.5;

  // Step 2: convert fractional axial to fractional cube
  // Cube: xc = qf, yc = -qf - rf, zc = rf
  const xc = qf;
  const zc = rf;
  const yc = -xc - zc;

  // Step 3: round all three cube coordinates
  let rx = Math.round(xc);
  let ry = Math.round(yc);
  let rz = Math.round(zc);

  // Step 4: fix the coordinate with the largest rounding residual
  // so that the cube constraint rx + ry + rz == 0 is restored
  const dx = Math.abs(rx - xc);
  const dy = Math.abs(ry - yc);
  const dz = Math.abs(rz - zc);

  if (dx > dy && dx > dz) {
    rx = -ry - rz;
  } else if (dy > dz) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  // Step 5: convert back to axial (q = xc, r = zc)
  return { q: rx, r: rz };
}

// ---------------------------------------------------------------------------
// 1b. clientRectToNdc — testable NDC conversion (must match camera viewport)
// ---------------------------------------------------------------------------

export function clientRectToNdc(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): { x: number; y: number } | null {
  const { left, top, width, height } = rect;
  if (width <= 0 || height <= 0) return null;
  return {
    x: ((clientX - left) / width) * 2 - 1,
    y: -((clientY - top) / height) * 2 + 1,
  };
}

function worldUpNormal(hit: THREE.Intersection): number {
  if (!hit.face) return 0;
  const n = hit.face.normal.clone();
  hit.object.updateMatrixWorld(true);
  n.transformDirection(hit.object.matrixWorld);
  return n.y;
}

// ---------------------------------------------------------------------------
// 2. pixelToHex
// ---------------------------------------------------------------------------

/**
 * Convert a canvas pixel (clientX, clientY) to the axial hex coordinates
 * under the cursor.
 *
 * When `terrainMeshes` + `resolveTerrainInstance` are provided, InstancedMesh
 * hits resolve directly to the hex instance (Civ6-style — no worldToAxial drift
 * on prism side faces). Otherwise raycasts terrain tops, then falls back to y=0.
 *
 * Returns null if the ray is parallel to the plane or points away from it
 * (no intersection in the forward direction).
 */
export function pixelToHex(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  camera: THREE.Camera,
  R: number,
  terrainMeshes?: readonly THREE.Object3D[],
  resolveTerrainInstance?: TerrainPickResolver,
): { q: number; r: number } | null {
  const rect = canvas.getBoundingClientRect();
  const ndc = clientRectToNdc(clientX, clientY, rect);
  if (!ndc) return null;

  camera.updateMatrixWorld(true);

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), camera);

  if (terrainMeshes && terrainMeshes.length > 0) {
    const hits = raycaster.intersectObjects(terrainMeshes as THREE.Object3D[], false);
    for (const h of hits) {
      if (
        resolveTerrainInstance
        && h.object instanceof THREE.InstancedMesh
        && h.instanceId !== undefined
      ) {
        const resolved = resolveTerrainInstance(h.object, h.instanceId);
        if (resolved) return resolved;
      }
      if (worldUpNormal(h) > 0.5) {
        return worldToAxial(h.point.x, h.point.z, R);
      }
    }
    if (hits.length > 0) {
      const pt = hits[0]!.point;
      return worldToAxial(pt.x, pt.z, R);
    }
  }

  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const intersection = new THREE.Vector3();
  const hit = raycaster.ray.intersectPlane(plane, intersection);

  if (hit === null) {
    return null;
  }

  return worldToAxial(intersection.x, intersection.z, R);
}

// ---------------------------------------------------------------------------
// 3. keyOf
// ---------------------------------------------------------------------------

/**
 * Canonical string key for an axial hex coordinate, matching the format used
 * throughout the logic layer: "${q},${r}".
 */
export function keyOf(q: number, r: number): string {
  return `${q},${r}`;
}

// ---------------------------------------------------------------------------
// 4. unitAt
// ---------------------------------------------------------------------------

/**
 * Return the first unit in `units` whose position matches (q, r), or null.
 */
export function unitAt(q: number, r: number, units: RuntimeUnit[]): RuntimeUnit | null {
  for (const unit of units) {
    if (unit.q === q && unit.r === r) {
      return unit;
    }
  }
  return null;
}
