/**
 * rangeOverlay.ts — wizualizacja zasięgu kultury / religii na mapie 3D (MAPA).
 */
import * as THREE from 'three';
import type { GameMap } from '../types/map';
import { TerenBazowy } from '../types/hex';
import { axialToWorld, HEX_R } from './hexutil';
import { GAME_MAP_RENDER_STYLE, terrainSurfaceTopY } from './mapRenderStyle';

const HEX_DIRS: { dq: number; dr: number }[] = [
  { dq: 1, dr: 0 },
  { dq: 1, dr: -1 },
  { dq: 0, dr: -1 },
  { dq: -1, dr: 0 },
  { dq: -1, dr: 1 },
  { dq: 0, dr: 1 },
];

/** Wierzchołki heksa — ta sama orientacja co hexCorners / CylinderGeometry(6) w scene.ts (rog 0 w +Z). */
function hexVertices(cx: number, y: number, cz: number, R: number): THREE.Vector3[] {
  const verts: THREE.Vector3[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    verts.push(new THREE.Vector3(
      cx + R * Math.sin(a),
      y,
      cz + R * Math.cos(a),
    ));
  }
  return verts;
}

function hexTopY(map: GameMap, key: string, yOffset: number): number {
  const hex = map.hexes[key];
  const teren = hex?.terenBazowy ?? TerenBazowy.Laka;
  return terrainSurfaceTopY(teren, GAME_MAP_RENDER_STYLE, yOffset);
}

function buildTintMesh(
  map: GameMap,
  hexKeys: Set<string>,
  color: number,
  opacity: number,
  yOffset: number,
): THREE.InstancedMesh | null {
  const hexes: Array<{ q: number; r: number; y: number }> = [];
  for (const key of hexKeys) {
    const hex = map.hexes[key];
    if (!hex) continue;
    const { q, r } = hex.coords;
    hexes.push({ q, r, y: hexTopY(map, key, yOffset) });
  }
  if (hexes.length === 0) return null;

  const geo = new THREE.CylinderGeometry(HEX_R * 0.97, HEX_R * 0.97, 0.002, 6);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, hexes.length);
  mesh.renderOrder = 3;

  const dummy = new THREE.Object3D();
  for (let i = 0; i < hexes.length; i++) {
    const { q, r, y } = hexes[i]!;
    const { x, z } = axialToWorld(q, r, HEX_R);
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function buildBorderLine(
  map: GameMap,
  hexKeys: Set<string>,
  color: number,
  opacity: number,
  yOffset: number,
  flatY?: number,
): THREE.LineSegments | null {
  const positions: number[] = [];
  const borderY = flatY ?? terrainSurfaceTopY(TerenBazowy.Laka, GAME_MAP_RENDER_STYLE, yOffset);

  for (const key of hexKeys) {
    const hex = map.hexes[key];
    if (!hex) continue;
    const { q, r } = hex.coords;
    const { x: cx, z: cz } = axialToWorld(q, r, HEX_R);
    const verts = hexVertices(cx, borderY, cz, HEX_R);

    for (let i = 0; i < 6; i++) {
      const dir = HEX_DIRS[i]!;
      const nq = q + dir.dq;
      const nr = r + dir.dr;
      if (!hexKeys.has(`${nq},${nr}`)) {
        const va = verts[i]!;
        const vb = verts[(i + 1) % 6]!;
        positions.push(va.x, va.y, va.z, vb.x, vb.y, vb.z);
      }
    }
  }

  if (positions.length === 0) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.renderOrder = 5;
  return lines;
}

function edgeOutwardNormal(
  cx: number,
  cz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): { nx: number; nz: number } {
  const edx = bx - ax;
  const edz = bz - az;
  const len = Math.hypot(edx, edz) || 1;
  let nx = -edz / len;
  let nz = edx / len;
  const midx = (ax + bx) * 0.5;
  const midz = (az + bz) * 0.5;
  if ((midx - cx) * nx + (midz - cz) * nz < 0) {
    nx = -nx;
    nz = -nz;
  }
  return { nx, nz };
}

/** Szerszy półprzezroczysty pas wzdłuż zewnętrznych krawędzi heksów (czytelniejszy niż cienka linia). */
function buildBorderBandMesh(
  map: GameMap,
  hexKeys: Set<string>,
  color: number,
  opacity: number,
  yOffset: number,
  bandWidth: number,
): THREE.Mesh | null {
  if (bandWidth <= 0) return null;
  const positions: number[] = [];
  const indices: number[] = [];
  let vi = 0;

  for (const key of hexKeys) {
    const hex = map.hexes[key];
    if (!hex) continue;
    const { q, r } = hex.coords;
    const hexY = hexTopY(map, key, yOffset);
    const { x: cx, z: cz } = axialToWorld(q, r, HEX_R);
    const verts = hexVertices(cx, hexY, cz, HEX_R);

    for (let i = 0; i < 6; i++) {
      const dir = HEX_DIRS[i]!;
      const nq = q + dir.dq;
      const nr = r + dir.dr;
      if (hexKeys.has(`${nq},${nr}`)) continue;

      const va = verts[i]!;
      const vb = verts[(i + 1) % 6]!;
      const { nx, nz } = edgeOutwardNormal(cx, cz, va.x, va.z, vb.x, vb.z);
      const ax0 = va.x;
      const az0 = va.z;
      const bx0 = vb.x;
      const bz0 = vb.z;
      const ax1 = ax0 + nx * bandWidth;
      const az1 = az0 + nz * bandWidth;
      const bx1 = bx0 + nx * bandWidth;
      const bz1 = bz0 + nz * bandWidth;
      const y = hexY + 0.004;

      positions.push(
        ax0, y, az0,
        bx0, y, bz0,
        bx1, y, bz1,
        ax1, y, az1,
      );
      indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
      vi += 4;
    }
  }

  if (positions.length === 0) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 6;
  return mesh;
}

export interface RangeOverlayStyle {
  tintColor: number;
  tintOpacity: number;
  borderColor: number;
  borderOpacity: number;
  /** Grubość pasa na zewnętrznych krawędziach (world units); 0 = cienka linia. */
  borderBandWidth?: number;
  yOffset?: number;
}

export const CULTURE_RANGE_STYLE: RangeOverlayStyle = {
  tintColor: 0xcc66ff,
  tintOpacity: 0.24,
  borderColor: 0xee99ff,
  borderOpacity: 0.85,
  yOffset: 0.05,
};

export const RELIGION_RANGE_STYLE: RangeOverlayStyle = {
  tintColor: 0xffb040,
  tintOpacity: 0.22,
  borderColor: 0xffd070,
  borderOpacity: 0.85,
  yOffset: 0.055,
};

/** Buduje grupę obiektów 3D (tint + obrys) dla podanego zbioru heksów. */
export function buildRangeOverlayGroup(
  map: GameMap,
  hexKeys: Set<string>,
  style: RangeOverlayStyle,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'range-overlay';
  const yOff = style.yOffset ?? 0.05;
  const flatBorderY = terrainSurfaceTopY(TerenBazowy.Laka, GAME_MAP_RENDER_STYLE, yOff + 0.008);
  const tint = buildTintMesh(map, hexKeys, style.tintColor, style.tintOpacity, yOff);
  if (tint) group.add(tint);
  const bandW = style.borderBandWidth ?? 0;
  if (bandW > 0) {
    const band = buildBorderBandMesh(map, hexKeys, style.borderColor, style.borderOpacity, yOff + 0.006, bandW);
    if (band) group.add(band);
  } else {
    const border = buildBorderLine(map, hexKeys, style.borderColor, style.borderOpacity, yOff + 0.008, flatBorderY);
    if (border) group.add(border);
  }
  return group;
}

/** Usuwa grupę z sceny i zwalnia geometrię/materiały. */
export function disposeRangeOverlayGroup(group: THREE.Group | null): void {
  if (!group) return;
  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      if (m) (m as THREE.Material).dispose();
    }
  });
  group.clear();
}
