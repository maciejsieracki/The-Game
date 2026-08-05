/**
 * djungla-modele.ts — R-SCENA-PERF: kępy dżungli tropikalnej jako 5 InstancedMesh
 * (wzorzec lasInst / lasy-modele.ts). Zastępuje buildStyleForestCluster + collapseToMergedMesh
 * (~1100× scalMerge na Pangea) → 5 draw calli, zero overlay merge dla jungleForest.
 */
import * as THREE from 'three';

export const LICZBA_WARIANTOW_DJUNGLI = 5;

export const SOL_WARIANT_DJUNGLI = 1319;
export const SOL_ROTACJA_DJUNGLI = 1321;

function hashHeksa(q: number, r: number, seed: number, salt: number): number {
  let h = (Math.imul(q | 0, 0x27d4eb2d)
    ^ Math.imul(r | 0, 0x165667b1)
    ^ Math.imul(seed | 0, 0x9e3779b1)
    ^ Math.imul(salt | 0, 0x85ebca6b)) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

export function wariantDjungliDlaHeksa(
  q: number,
  r: number,
  liczbaWariantow: number = LICZBA_WARIANTOW_DJUNGLI,
  seed = 0,
): number {
  return Math.floor(hashHeksa(q, r, seed, SOL_WARIANT_DJUNGLI) * liczbaWariantow);
}

export function rotacjaDjungliDlaHeksa(q: number, r: number, seed = 0): number {
  return Math.floor(hashHeksa(q, r, seed, SOL_ROTACJA_DJUNGLI) * 6) * (Math.PI / 3);
}

const Z_D0 = 0x1e4a28;
const Z_D1 = 0x2d5a35;
const Z_D2 = 0x3d6b45;
const Z_D3 = 0x4a7a52;
const Z_D4 = 0x5a8f5a;
const Z_JASNY = 0x6b9f62;
const PIEN_PALMA = 0x6a4a28;
const PIEN_CIENKI = 0x5a4028;

interface Parts { pos: number[]; col: number[]; }
type V3 = [number, number, number];

function rgb(hex: number): V3 {
  return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
}

function pushTri(P: Parts, a: V3, b: V3, c: V3, col: V3, ref: V3): void {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * ref[0] + ny * ref[1] + nz * ref[2] < 0) { const t = b; b = c; c = t; }
  P.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  for (let k = 0; k < 3; k++) P.col.push(col[0], col[1], col[2]);
}

function ringN(n: number, cx: number, cz: number, r: number, yaw: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const a = yaw + i * (Math.PI * 2 / n);
    pts.push([cx + r * Math.sin(a), cz + r * Math.cos(a)]);
  }
  return pts;
}

function pien(P: Parts, cx: number, cz: number, y0: number, h: number,
  rb: number, rt: number, colHex: number, yaw = 0, n = 5): void {
  const col = rgb(colHex);
  const bot = ringN(n, cx, cz, rb, yaw);
  const top = ringN(n, cx, cz, rt, yaw);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const b0: V3 = [bot[i]![0], y0, bot[i]![1]], b1: V3 = [bot[j]![0], y0, bot[j]![1]];
    const t0: V3 = [top[i]![0], y0 + h, top[i]![1]], t1: V3 = [top[j]![0], y0 + h, top[j]![1]];
    const ref: V3 = [(b0[0] + b1[0]) / 2 - cx, 0, (b0[2] + b1[2]) / 2 - cz];
    pushTri(P, b0, b1, t1, col, ref);
    pushTri(P, b0, t1, t0, col, ref);
  }
}

function cone(P: Parts, cx: number, cz: number, y0: number, h: number, r: number,
  colHex: number, yaw = 0, apexOx = 0, apexOz = 0): void {
  const col = rgb(colHex);
  const bot = ringN(6, cx, cz, r, yaw);
  const A: V3 = [cx + apexOx, y0 + h, cz + apexOz];
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const b0: V3 = [bot[i]![0], y0, bot[i]![1]], b1: V3 = [bot[j]![0], y0, bot[j]![1]];
    const ref: V3 = [(b0[0] + b1[0]) / 2 - cx, 0, (b0[2] + b1[2]) / 2 - cz];
    pushTri(P, b0, b1, A, col, ref);
  }
}

const BLOB_JIT: readonly number[] = [1.0, 0.86, 1.10, 0.92, 1.06, 0.88];

function blob(P: Parts, cx: number, cy: number, cz: number, rx: number, rz: number,
  hUp: number, hDn: number, colHex: number, yaw = 0, apexOx = 0, apexOz = 0): void {
  const col = rgb(colHex);
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const a = yaw + i * Math.PI / 3;
    const jit = BLOB_JIT[i]!;
    pts.push([cx + rx * jit * Math.sin(a), cz + rz * jit * Math.cos(a)]);
  }
  const T: V3 = [cx + apexOx, cy + hUp, cz + apexOz];
  const B: V3 = [cx - apexOx * 0.5, cy - hDn, cz - apexOz * 0.5];
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const v0: V3 = [pts[i]![0], cy, pts[i]![1]], v1: V3 = [pts[j]![0], cy, pts[j]![1]];
    const ref: V3 = [(v0[0] + v1[0]) / 2 - cx, 0, (v0[2] + v1[2]) / 2 - cz];
    pushTri(P, v0, v1, T, col, ref);
    pushTri(P, v1, v0, B, col, ref);
  }
}

function palma(P: Parts, x: number, z: number, yaw: number): void {
  pien(P, x, z, 0, 0.48, 0.05, 0.035, PIEN_PALMA, yaw, 5);
  const fy = 0.50;
  const frondCols = [Z_D2, Z_D3, Z_D4];
  for (let fi = 0; fi < 4; fi++) {
    const fa = yaw + (fi / 4) * Math.PI * 2;
    const fx = x + Math.cos(fa) * 0.16;
    const fz = z + Math.sin(fa) * 0.16;
    cone(P, fx, fz, fy - 0.04, 0.24, 0.14, frondCols[fi % 3]!, fa, Math.cos(fa) * 0.04, Math.sin(fa) * 0.04);
  }
}

function parasol(P: Parts, x: number, z: number, yaw: number): void {
  pien(P, x, z, 0, 0.38, 0.04, 0.055, PIEN_CIENKI, yaw, 5);
  const capY = 0.42;
  const col = rgb(Z_D3);
  const bot = ringN(6, x, z, 0.32, yaw);
  const top = ringN(6, x, z, 0.28, yaw);
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const b0: V3 = [bot[i]![0], capY, bot[i]![1]], b1: V3 = [bot[j]![0], capY, bot[j]![1]];
    const t0: V3 = [top[i]![0], capY + 0.06, top[i]![1]], t1: V3 = [top[j]![0], capY + 0.06, top[j]![1]];
    const ref: V3 = [0, 1, 0];
    pushTri(P, b0, b1, t1, col, ref);
    pushTri(P, b0, t1, t0, col, ref);
  }
}

function drzewoTrop(P: Parts, x: number, z: number, H: number, yaw: number): void {
  pien(P, x, z, 0, 0.22 * H, 0.024 + 0.042 * H, 0.018 + 0.030 * H, PIEN_CIENKI, yaw, 4);
  blob(P, x, 0.62 * H, z, 0.28 * H, 0.28 * H, 0.38 * H, 0.28 * H, Z_D4, yaw, 0.04 * H, 0.03 * H);
}

function czesciDjungli(w: number): Parts {
  const P: Parts = { pos: [], col: [] };
  if (w === 0) {
    palma(P, 0.44, 0.28, 0.3);
    parasol(P, -0.38, 0.35, 1.8);
    drzewoTrop(P, -0.28, -0.48, 0.88, 3.5);
    palma(P, 0.18, -0.52, 2.1);
    parasol(P, -0.55, -0.22, 4.6);
    drzewoTrop(P, 0.08, 0.06, 0.72, 5.2);
  } else if (w === 1) {
    palma(P, 0.50, 0.20, 0.5);
    palma(P, -0.42, 0.40, 2.4);
    parasol(P, 0.30, -0.45, 1.2);
    drzewoTrop(P, -0.50, -0.35, 0.82, 3.8);
    palma(P, 0.62, -0.10, 4.0);
    parasol(P, -0.08, -0.08, 5.5);
    drzewoTrop(P, 0.22, 0.55, 0.68, 2.0);
  } else if (w === 2) {
    parasol(P, 0.46, 0.32, 0.7);
    palma(P, -0.48, 0.25, 2.0);
    palma(P, 0.10, -0.55, 3.3);
    drzewoTrop(P, -0.35, -0.50, 0.90, 4.5);
    parasol(P, 0.55, -0.28, 1.5);
    drzewoTrop(P, -0.12, 0.10, 0.76, 5.8);
  } else if (w === 3) {
    palma(P, 0.40, 0.38, 0.2);
    drzewoTrop(P, -0.52, 0.18, 0.86, 2.6);
    parasol(P, 0.28, -0.52, 4.1);
    palma(P, -0.20, -0.42, 3.0);
    parasol(P, 0.58, -0.12, 1.7);
    drzewoTrop(P, 0.05, 0.02, 0.70, 5.0);
    cone(P, -0.35, 0.55, 0, 0.10, 0.08, Z_JASNY, 1.4);
  } else {
    palma(P, 0.35, 0.30, 0.9);
    parasol(P, -0.45, -0.30, 2.8);
    palma(P, 0.55, -0.35, 4.2);
    drzewoTrop(P, -0.15, 0.45, 0.80, 1.1);
    parasol(P, 0.20, -0.55, 3.6);
    drzewoTrop(P, -0.40, 0.08, 0.74, 5.3);
    cone(P, 0.10, 0.08, 0, 0.09, 0.07, Z_D1, 0.5);
  }
  return P;
}

function zbudujGeometrie(P: Parts, nazwa: string): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P.pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(P.col, 3));
  g.computeVertexNormals();
  g.name = nazwa;
  return g;
}

const cacheDjungli: Array<THREE.BufferGeometry | null> = [null, null, null, null, null];

export function djunglaGeometria(wariant: number): THREE.BufferGeometry {
  const w = ((wariant | 0) % 5 + 5) % 5;
  if (!cacheDjungli[w]) cacheDjungli[w] = zbudujGeometrie(czesciDjungli(w), `djungla-d${w}`);
  return cacheDjungli[w]!;
}

export const DJUNGLA_MATERIAL = new THREE.MeshLambertMaterial({
  vertexColors: true,
  flatShading: true,
});
