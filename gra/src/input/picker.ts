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

/** Punkt świata → piksele viewportu (do tooltipów fixed na <html>, niezależnie od zoom UI body). */
export function worldToClientPx(
  worldX: number,
  worldY: number,
  worldZ: number,
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
): { x: number; y: number } | null {
  const v = new THREE.Vector3(worldX, worldY, worldZ);
  v.project(camera);
  if (v.z > 1) return null;
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return {
    x: rect.left + (v.x * 0.5 + 0.5) * rect.width,
    y: rect.top + (-v.y * 0.5 + 0.5) * rect.height,
  };
}

// ---------------------------------------------------------------------------
// 1c. refreshInstancedPickBounds — sfera otaczająca InstancedMesh do raycastu
// ---------------------------------------------------------------------------

/**
 * Przelicza sferę otaczającą (`boundingSphere`) każdego InstancedMesh z listy
 * pickingowej.
 *
 * DLACZEGO TO ISTNIEJE (R-RUCH-WZGORZA, nawrót 2026-07-26):
 * `THREE.InstancedMesh.raycast()` robi najpierw odsiew po sferze otaczającej:
 *   if (this.boundingSphere === null) this.computeBoundingSphere();
 *   if (raycaster.ray.intersectsSphere(sphere) === false) return;   // CAŁY mesh odpada
 * Sfera liczy się LENIWIE — przy PIERWSZYM raycaście — z AKTUALNYCH macierzy
 * instancji i nigdy nie jest odświeżana. Tymczasem renderer chowa heksy pod mgłą
 * wojny i dekor pod miastem, wpisując instancjom macierz zerową (`ZERO_MATRIX`,
 * scene.ts) i przywracając ją, gdy mgła opadnie. Pierwszy ruch myszy po starcie
 * gry pada więc na mapę prawie całą zasłoniętą mgłą → sfera obejmuje tylko
 * odsłonięty skrawek i taka ZOSTAJE do końca sesji. Każdy późniejszy klik poza
 * tym skrawkiem nie trafia już w żadną bryłę terenu i leci do awaryjnego
 * przecięcia z płaszczyzną y = 0 — a ta leży POD wierzchem terenu, więc promień
 * biegnie dalej i wskazuje heks o pół pola dalej od kamery (tym bardziej, im
 * teren wyższy: wzgórze ≈ 0,50 heksa, góra ≈ 0,95 heksa).
 *
 * Wywoływać RAZ, tuż po zbudowaniu sceny — gdy wszystkie instancje mają jeszcze
 * oryginalne macierze. Sfera pokrywa wtedy pełny zasięg mapy i nie zdezaktualizuje
 * się: chowanie instancji tylko ściąga je do punktu (nic nie wychodzi poza sferę).
 */
export function refreshInstancedPickBounds(meshes: readonly THREE.Object3D[]): void {
  for (const mesh of meshes) {
    if (mesh instanceof THREE.InstancedMesh) mesh.computeBoundingSphere();
  }
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
  /** Wysokość wierzchu terenu (y) — używana przy awaryjnym przecięciu z płaszczyzną. */
  terrainTopYAt?: (q: number, r: number) => number,
): { q: number; r: number } | null {
  const rect = canvas.getBoundingClientRect();
  const ndc = clientRectToNdc(clientX, clientY, rect);
  if (!ndc) return null;

  camera.updateMatrixWorld(true);

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), camera);

  if (terrainMeshes && terrainMeshes.length > 0) {
    const hits = raycaster.intersectObjects(terrainMeshes as THREE.Object3D[], false);
    // R-RUCH-WZGORZA: THREE.Raycaster IGNORUJE object.visible (sprawdza tylko layers) — meshe
    // dekoracyjne wzgórz/gór bywają ukrywane (LOD niskiego zoomu: zoomFlags.styledDecor=false;
    // fog wojny/miasto: matrix-hide) bez zerowania macierzy przy zwykłym visible=false. Bez tego
    // filtra klik trafiałby w "widmowy" hit na niewidocznej bryle -> zly heks.
    let sideResolvedFallback: { q: number; r: number } | null = null;
    for (const h of hits) {
      if (h.object.visible === false) continue;
      if (
        resolveTerrainInstance
        && h.object instanceof THREE.InstancedMesh
        && h.instanceId !== undefined
      ) {
        const resolved = resolveTerrainInstance(h.object, h.instanceId);
        if (resolved) {
          const nY = worldUpNormal(h);
          if (nY > 0.5) return resolved;
          // Bok góry/wzgórza może leżeć nad sąsiednim heksem — akceptuj tylko gdy
          // punkt trafienia i instancja wskazują ten sam heks.
          const fromPoint = worldToAxial(h.point.x, h.point.z, R);
          if (fromPoint.q === resolved.q && fromPoint.r === resolved.r) return resolved;
          if (!sideResolvedFallback) sideResolvedFallback = resolved;
          continue;
        }
      }
      if (worldUpNormal(h) > 0.5) {
        return worldToAxial(h.point.x, h.point.z, R);
      }
    }
    if (sideResolvedFallback) return sideResolvedFallback;
    const visibleHit = hits.find((h) => h.object.visible !== false);
    if (visibleHit) {
      return worldToAxial(visibleHit.point.x, visibleHit.point.z, R);
    }
  }

  const intersection = new THREE.Vector3();
  const plane0 = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  if (raycaster.ray.intersectPlane(plane0, intersection) === null) {
    return null;
  }

  const coarse = worldToAxial(intersection.x, intersection.z, R);
  if (terrainTopYAt) {
    const topY = terrainTopYAt(coarse.q, coarse.r);
    if (topY > 0) {
      const refined = new THREE.Vector3();
      const planeTop = new THREE.Plane(new THREE.Vector3(0, 1, 0), -topY);
      if (raycaster.ray.intersectPlane(planeTop, refined) !== null) {
        return worldToAxial(refined.x, refined.z, R);
      }
    }
  }
  return coarse;
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
