/**
 * .kzt-shot.ts — NARZĘDZIE DIAGNOSTYCZNE (nie jest częścią gry).
 * Programowy rasteryzator: renderuje buildery do PNG bez przeglądarki/WebGL.
 * Kamera, światła i tone mapping 1:1 z podglądem (a więc i z grą, styl 'roblox').
 */
import * as THREE from 'three';
import { buildZuluJavelineer } from '../src/render/jednostki-p3-dystans';
import { buildBatteringRam } from '../src/render/jednostki-p57-wlocznie-machiny';
import { buildZuluJavelineerOpus5, buildBatteringRamOpus5 } from '../src/render/kamien-zulu-taran-opus5';

const SS = 2;                     // supersampling
const W = 620, H = 620;
const BG = 0x1b2128;

type V3 = { x: number; y: number; z: number };

function s2l(c: number): number { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function l2s(c: number): number { return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; }
function aces(x: number): number {
  const c = x * 1.05 * 0.6;
  return Math.max(0, Math.min(1, (c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14)));
}
function lin(hex: number): [number, number, number] {
  return [s2l(((hex >> 16) & 255) / 255), s2l(((hex >> 8) & 255) / 255), s2l((hex & 255) / 255)];
}

// światła 1:1 ze scene.ts (renderStyle 'roblox')
const HEMI_SKY = lin(0xffffff), HEMI_GND = lin(0x88cc88), HEMI_I = 1.05;
const SUN_C = lin(0xfffef0), SUN_I = 1.25;
const FIL_C = lin(0xbcd4ff), FIL_I = 0.35;
const SUN_D = new THREE.Vector3(60, 100, 40).normalize();
const FIL_D = new THREE.Vector3(-50, 60, -30).normalize();

function shade(n: V3, alb: [number, number, number]): [number, number, number] {
  const t = 0.5 * n.y + 0.5;
  const nsun = Math.max(0, n.x * SUN_D.x + n.y * SUN_D.y + n.z * SUN_D.z);
  const nfil = Math.max(0, n.x * FIL_D.x + n.y * FIL_D.y + n.z * FIL_D.z);
  const out: [number, number, number] = [0, 0, 0];
  for (let k = 0; k < 3; k++) {
    const hemi = (HEMI_GND[k]! + (HEMI_SKY[k]! - HEMI_GND[k]!) * t) * HEMI_I;
    out[k] = alb[k]! * (hemi + SUN_C[k]! * SUN_I * nsun + FIL_C[k]! * FIL_I * nfil);
  }
  return out;
}

type Tri = {
  sx: number[]; sy: number[]; sz: number[]; iw: number[];
  cr: number[]; cg: number[]; cb: number[];
};

export function render(root: THREE.Object3D, elevDeg: number, azDeg: number,
                       targetY: number, dist: number, withHex: boolean): Uint8Array {
  const w = W * SS, h = H * SS;
  const cam = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
  const el = THREE.MathUtils.degToRad(elevDeg), az = THREE.MathUtils.degToRad(azDeg);
  const r = Math.cos(el) * dist;
  cam.position.set(Math.sin(az) * r, targetY + Math.sin(el) * dist, Math.cos(az) * r);
  cam.lookAt(0, targetY, 0);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  const view = cam.matrixWorldInverse.clone();
  const proj = cam.projectionMatrix.clone();
  const vp = proj.clone().multiply(view);

  const scene = new THREE.Group();
  scene.add(root);
  if (withHex) {
    const hex = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.06, 6),
      new THREE.MeshStandardMaterial({ color: 0x45505c }));
    hex.position.y = -0.03;
    scene.add(hex);
  }
  scene.updateMatrixWorld(true);

  const tris: Tri[] = [];
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const geo = m.geometry;
    const pos = geo.attributes['position'] as THREE.BufferAttribute;
    const nrm = geo.attributes['normal'] as THREE.BufferAttribute | undefined;
    const idx = geo.index;
    const nm = new THREE.Matrix3().getNormalMatrix(m.matrixWorld);
    const col = (m.material as THREE.MeshStandardMaterial).color;
    const alb: [number, number, number] = [s2l(col.r), s2l(col.g), s2l(col.b)];
    const count = idx ? idx.count : pos.count;
    const P = new THREE.Vector3(), N = new THREE.Vector3();
    for (let t = 0; t < count; t += 3) {
      const sx: number[] = [], sy: number[] = [], sz: number[] = [], iw: number[] = [];
      const cr: number[] = [], cg: number[] = [], cb: number[] = [];
      let ok = true;
      for (let k = 0; k < 3; k++) {
        const vi = idx ? idx.getX(t + k) : t + k;
        P.fromBufferAttribute(pos, vi).applyMatrix4(m.matrixWorld);
        if (nrm) N.fromBufferAttribute(nrm, vi).applyMatrix3(nm).normalize();
        else N.set(0, 1, 0);
        // dwustronne cieniowanie (płaskie łaty/lica bywają jednostronne)
        const toCam = new THREE.Vector3().subVectors(cam.position, P);
        if (N.dot(toCam) < 0) N.multiplyScalar(-1);
        const c = shade(N, alb);
        cr.push(c[0]); cg.push(c[1]); cb.push(c[2]);
        const v = new THREE.Vector4(P.x, P.y, P.z, 1).applyMatrix4(vp);
        if (v.w <= 1e-6) { ok = false; break; }
        iw.push(1 / v.w);
        sx.push((v.x / v.w * 0.5 + 0.5) * w);
        sy.push((1 - (v.y / v.w * 0.5 + 0.5)) * h);
        sz.push(v.z / v.w);
      }
      if (ok) tris.push({ sx, sy, sz, iw, cr, cg, cb });
    }
  });

  const zbuf = new Float32Array(w * h).fill(Infinity);
  const buf = new Float32Array(w * h * 3);
  const bg = lin(BG);
  for (let i = 0; i < w * h; i++) { buf[i * 3] = bg[0]!; buf[i * 3 + 1] = bg[1]!; buf[i * 3 + 2] = bg[2]!; }

  for (const T of tris) {
    const x0 = T.sx[0]!, y0 = T.sy[0]!, x1 = T.sx[1]!, y1 = T.sy[1]!, x2 = T.sx[2]!, y2 = T.sy[2]!;
    const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
    if (Math.abs(area) < 1e-9) continue;
    const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
    const maxX = Math.min(w - 1, Math.ceil(Math.max(x0, x1, x2)));
    const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
    const maxY = Math.min(h - 1, Math.ceil(Math.max(y0, y1, y2)));
    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const cx = px + 0.5, cy = py + 0.5;
        let w0 = ((x1 - cx) * (y2 - cy) - (x2 - cx) * (y1 - cy)) / area;
        let w1 = ((x2 - cx) * (y0 - cy) - (x0 - cx) * (y2 - cy)) / area;
        let w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w0 * T.sz[0]! + w1 * T.sz[1]! + w2 * T.sz[2]!;
        const o = py * w + px;
        if (z >= zbuf[o]!) continue;
        zbuf[o] = z;
        const iw = w0 * T.iw[0]! + w1 * T.iw[1]! + w2 * T.iw[2]!;
        const a0 = w0 * T.iw[0]! / iw, a1 = w1 * T.iw[1]! / iw, a2 = w2 * T.iw[2]! / iw;
        buf[o * 3]     = a0 * T.cr[0]! + a1 * T.cr[1]! + a2 * T.cr[2]!;
        buf[o * 3 + 1] = a0 * T.cg[0]! + a1 * T.cg[1]! + a2 * T.cg[2]!;
        buf[o * 3 + 2] = a0 * T.cb[0]! + a1 * T.cb[1]! + a2 * T.cb[2]!;
      }
    }
  }

  // downsample + tone map + sRGB
  const out = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const acc = [0, 0, 0];
      for (let dy = 0; dy < SS; dy++) for (let dx = 0; dx < SS; dx++) {
        const o = ((y * SS + dy) * w + (x * SS + dx)) * 3;
        acc[0]! += buf[o]!; acc[1]! += buf[o + 1]!; acc[2]! += buf[o + 2]!;
      }
      const n = SS * SS, p = (y * W + x) * 4;
      for (let k = 0; k < 3; k++) out[p + k] = Math.round(l2s(aces(acc[k]! / n)) * 255);
      out[p + 3] = 255;
    }
  }
  return out;
}

export const BUILDERS: Record<string, (c: number) => THREE.Group> = {
  'zulu-stary': buildZuluJavelineer,
  'zulu-opus5': buildZuluJavelineerOpus5,
  'taran-stary': buildBatteringRam,
  'taran-opus5': buildBatteringRamOpus5,
};
export const SIZE = { W, H };
