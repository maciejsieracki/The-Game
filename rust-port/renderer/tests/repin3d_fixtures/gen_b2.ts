// R-RUSTPORT-REPIN-3D-B2-Q1 — reference generator (browser half) for batch B2:
// the owner-medallion ring colour `ringHex` (render/unitOwnerEmblem.ts of the web
// `origin/main` @ 86d510c66: normalizeRingHex :249-253, ringColorFor :260-263,
// drawDisc(ringColor) :266-278, drawFallbackGlyph(…, ringColor) :281-288,
// emblemKey :330-339 with `:<ring>`, ring over the portrait :419-426) and the plate
// owner icon of render/unitStatPlate.ts (PLATE_OWNER_ICON_SIZE 0,80·HEX_R :154).
//
// Bundled by esbuild 0.24.0 (+ three@0.169.0) into an IIFE and run by gen_b2.mjs
// in headless Chromium 141 on a REAL Canvas 2D (the same harness as
// tests/fixtures/overlay/gen.mjs: bundled fonts as FontFace, `font` setter mapped,
// `window.Image` wrapped to await every `onload`). The web modules are imported
// UNCHANGED from `git archive origin/main gra/src gra/data` (../websrc) and called
// through their exported entry points: setUnitOwnerEmblemAssets, ownerEmblemKey,
// ownerEmblemTexture, applyUnitStatPlate. Nothing is transcribed.

import * as THREE from 'three';
import {
  ownerEmblemKey, ownerEmblemTexture, setUnitOwnerEmblemAssets,
} from '../websrc/gra/src/render/unitOwnerEmblem';
import * as Plate from '../websrc/gra/src/render/unitStatPlate';

type Ctx = { civId: string | null; era: number; isCityState: boolean; isBarbarian: boolean; ringHex?: string | null };

declare const OVERLAY_INPUT: { svgs: Record<string, string>; portraits: Record<string, string> };
declare const OVERLAY_PENDING: Promise<unknown>[];

function hx(v: number): string {
  const dv = new DataView(new ArrayBuffer(8));
  dv.setFloat64(0, v, false);
  let s = '';
  for (let i = 0; i < 8; i++) s += dv.getUint8(i).toString(16).padStart(2, '0');
  return s;
}

// ------------------------------------------------------------------ textures
interface TexRec { id: string; tex: THREE.Texture; initial: string }
const texById = new Map<THREE.Texture, TexRec>();
const snapshots: Record<string, string> = {};
function b64(u8: Uint8ClampedArray): string {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i + 0x8000)));
  return btoa(s);
}
function snap(canvas: HTMLCanvasElement): string {
  return b64(canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data);
}
function texId(t: THREE.Texture | null | undefined): string | null {
  if (!t) return null;
  let r = texById.get(t);
  if (!r) {
    r = { id: 'e' + texById.size, tex: t, initial: snap(t.image as HTMLCanvasElement) };
    texById.set(t, r);
  }
  return r.id;
}

// ------------------------------------------------------------------ inputs (= tests/fixtures/overlay/gen.ts)
const svg = (k: string) => OVERLAY_INPUT.svgs[k] ?? '';
const EMBLEM_ASSETS = {
  leaderPortraitUrl: (civId: string, era: number) => OVERLAY_INPUT.portraits[`${civId}|${era}`] ?? null,
  civSigilSvg: (civId: string) => svg(`civ:${civId}`),
  barbarianSigilSvg: () => svg('chip-death'),
};

// ringHex edge cases for normalizeRingHex (JS trim, /^#[0-9a-fA-F]{6}$/, toLowerCase).
const RINGS: Array<string | null | undefined> = [
  undefined, null, '', ' ', '#1e88e5', '#1E88E5', '#1e88E5', ' #1e88e5 ', ' #1e88e5 ',
  '﻿#abcdef', '\u0085#abcdef', '　#AbCdEf\t', '#1e88e5\n', '#1e88e', '#1e88e5f', '#1e88e5ff',
  '1e88e5', '##1e88e', '#gggggg', '#12345g', '#ＡＢＣＤＥＦ', '#1e8 8e5',
  '#000000', '#FFFFFF', 'rgb(1,2,3)', '#1e88e5\u0000', '​#1e88e5', '#',
];
const BASES: Ctx[] = [
  { civId: 'grecy', era: 2, isCityState: false, isBarbarian: false },
  { civId: null, era: 2.5, isCityState: false, isBarbarian: false },
  { civId: ' Zulusi ', era: NaN, isCityState: false, isBarbarian: false },
  { civId: 'grecy', era: 2, isCityState: true, isBarbarian: false },
  { civId: null, era: 1, isCityState: false, isBarbarian: true },
  { civId: 'grecy', era: 2, isCityState: true, isBarbarian: true },
];

// Texture contexts: [name, phase, ctx]. Phase `assets` = game configuration (main.ts),
// `noassets` = previews (disc + glyph only). Cache: first context of a key wins.
const TEX_CTX: Array<[string, 'assets' | 'noassets', Ctx]> = [
  ['portrait_blue', 'assets', { civId: 'grecy', era: 2, isCityState: false, isBarbarian: false, ringHex: '#1e88e5' }],
  // same normalised ring → same key → the SAME texture object (cache hit)
  ['portrait_blue_alias', 'assets', { civId: 'grecy', era: 2, isCityState: false, isBarbarian: false, ringHex: ' #1E88E5 ' }],
  ['portrait_red', 'assets', { civId: 'grecy', era: 2, isCityState: false, isBarbarian: false, ringHex: '#e53935' }],
  ['portrait_brass', 'assets', { civId: 'grecy', era: 2, isCityState: false, isBarbarian: false, ringHex: null }],
  ['portrait_zulusi_green', 'assets', { civId: 'zulusi', era: 3, isCityState: false, isBarbarian: false, ringHex: '#43A047' }],
  ['sigil_red', 'assets', { civId: 'nieznana', era: 2, isCityState: false, isBarbarian: false, ringHex: '#E53935' }],
  ['glyph_green', 'assets', { civId: 'brak', era: 2, isCityState: false, isBarbarian: false, ringHex: '#43a047' }],
  ['glyph_bad_ring', 'assets', { civId: 'brak', era: 3, isCityState: false, isBarbarian: false, ringHex: '#abc' }],
  ['cs_ring_ignored', 'assets', { civId: 'grecy', era: 2, isCityState: true, isBarbarian: false, ringHex: '#ff0000' }],
  ['barb_ring_ignored', 'assets', { civId: null, era: 2, isCityState: false, isBarbarian: true, ringHex: '#00ff00' }],
  ['noassets_purple', 'noassets', { civId: 'grecy', era: 2, isCityState: false, isBarbarian: false, ringHex: '#8e24aa' }],
  ['noassets_white', 'noassets', { civId: 'egipt', era: 1, isCityState: false, isBarbarian: false, ringHex: '#FFFFFF' }],
  ['noassets_cs_ignored', 'noassets', { civId: 'egipt', era: 1, isCityState: true, isBarbarian: false, ringHex: '#123456' }],
];

const VITALS = { ruchLeft: 2, ruchMax: 2, hp: 100, hpMax: 100, fieldPowerM: 42, ownerColor: 0x1e88e5 };

export async function run(): Promise<unknown> {
  const out: any = { rings: RINGS.map((r) => (r === undefined ? { undef: true } : { v: r })), bases: [], keys: [], textures: [], plates: [] };
  out.bases = BASES.map((b) => ({ ...b, era: hx(b.era) }));
  for (let bi = 0; bi < BASES.length; bi++) {
    for (let ri = 0; ri < RINGS.length; ri++) {
      const c: Ctx = { ...BASES[bi] };
      if (RINGS[ri] !== undefined) c.ringHex = RINGS[ri];
      out.keys.push([bi, ri, ownerEmblemKey(c)]);
    }
  }
  out.consts = { PLATE_OWNER_ICON_SIZE: hx(Plate.PLATE_OWNER_ICON_SIZE) };

  const ctxOut = (c: Ctx) => ({ ...c, era: hx(c.era), ringHex: c.ringHex === undefined ? null : c.ringHex });
  setUnitOwnerEmblemAssets(EMBLEM_ASSETS);
  for (const [name, phase, c] of TEX_CTX.filter((t) => t[1] === 'assets')) {
    out.textures.push({ name, phase, ctx: ctxOut(c), key: ownerEmblemKey(c), tex: texId(ownerEmblemTexture(c)) });
  }
  // plate owner icon (applyUnitStatPlate on a fresh token): key + mesh position / scale bits
  for (const [name, , c] of TEX_CTX.filter((t) => t[1] === 'assets').slice(0, 3)) {
    const g = new THREE.Group();
    Plate.applyUnitStatPlate(g, c, VITALS);
    const tex = ownerEmblemTexture(c);
    let icon: any = null;
    g.traverse((o) => {
      const m = (o as any).material;
      if ((o as any).isMesh && m && m.map === tex) icon = { p: [o.position.x, o.position.y, o.position.z].map(hx), s: [o.scale.x, o.scale.y, o.scale.z].map(hx), renderOrder: o.renderOrder };
    });
    out.plates.push({ name, ownerKey: g.userData.statPlateOwnerKey, icon });
  }
  setUnitOwnerEmblemAssets(null);
  for (const [name, phase, c] of TEX_CTX.filter((t) => t[1] === 'noassets')) {
    out.textures.push({ name, phase, ctx: ctxOut(c), key: ownerEmblemKey(c), tex: texId(ownerEmblemTexture(c)) });
  }

  await Promise.all(OVERLAY_PENDING);
  await new Promise((r) => setTimeout(r, 50));
  const list: unknown[] = [];
  for (const r of texById.values()) {
    const cv = (r.tex as THREE.CanvasTexture).image as HTMLCanvasElement;
    const fin = snap(cv);
    snapshots[r.id] = fin;
    if (r.initial !== fin) snapshots[r.id + '.initial'] = r.initial;
    list.push({ id: r.id, w: cv.width, h: cv.height, version: r.tex.version, initialEqualsFinal: r.initial === fin });
  }
  out.textureList = list;
  out.snapshots = snapshots;
  return out;
}
(window as any).OVERLAY_RUN = run;
