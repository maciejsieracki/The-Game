/**
 * bronzeCityRoblox.ts — miasta epoki brązu w stylu Roblox (klocki, flatShading).
 * API jak buildBronzeCity: poziom 1..10, withWalls, per cywilizacja.
 */
import * as THREE from 'three';
import type { BronzeCiv } from './bronzeCity';
import { HEX_R } from './hexutil';

export type { BronzeCiv } from './bronzeCity';
export { BRONZE_CIVS, ikonaIdToBronzeCiv } from './bronzeCity';

/** Skala modelu na heksie (jak cities.ts) — mur liczony pod 70% powierzchni hexa w grze. */
const CITY_MODEL_SCALE = 1.38;
/** Wypełnienie hexa murem (obwód ≈ 70% promienia mapowego po skali). */
const WALL_HEX_FILL = 0.70;
const WALL_BAND = 0.058;
const WALL_HEIGHT = 0.15;

type WallMassKind = 'wood' | 'clay' | 'brick' | 'whiteBrick' | 'stone';

function wallMassKind(civ: BronzeCiv): WallMassKind {
  switch (civ) {
    case 'celtowie':
      return 'wood';
    case 'sumer':
    case 'zulu':
    case 'germanie':
      return 'clay';
    case 'hetyci':
      return 'stone';
    case 'egipt':
      return 'whiteBrick';
    case 'rzym':
    case 'chiny':
      return 'brick';
    default:
      return 'stone';
  }
}

function wallMassMaterial(kind: WallMassKind, p: RP): THREE.Material {
  switch (kind) {
    case 'wood':
      return p.wood;
    case 'clay':
      return p.clay;
    case 'brick':
      return p.brick;
    case 'whiteBrick':
      return p.whiteBrick;
    case 'stone':
      return p.stone;
  }
}

/** Pointy-top hex w płaszczyźnie XY (jak units.ts / hexutil). */
function tracePointyTopHex(path: THREE.Path | THREE.Shape, radius: number, reverse: boolean): void {
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

let hexWallRingCache = new Map<string, THREE.ExtrudeGeometry>();

function getHexWallRingGeo(outerR: number, innerR: number, height: number): THREE.ExtrudeGeometry {
  const key = `${outerR.toFixed(4)}|${innerR.toFixed(4)}|${height.toFixed(4)}`;
  const hit = hexWallRingCache.get(key);
  if (hit) return hit;
  const shape = new THREE.Shape();
  tracePointyTopHex(shape, outerR, false);
  const hole = new THREE.Path();
  tracePointyTopHex(hole, innerR, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  hexWallRingCache.set(key, geo);
  return geo;
}

function rnd(n: number, salt: number): number {
  let x = Math.imul((n + 1) * 2654435761 + salt * 40503, 0x27d4eb2d) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x2c1b3c6d) >>> 0;
  x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}

function rbx(c: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color: c, flatShading: true });
}

interface RP {
  wall: THREE.Material;
  roof: THREE.Material;
  roof2: THREE.Material;
  stone: THREE.Material;
  stone2: THREE.Material;
  wood: THREE.Material;
  clay: THREE.Material;
  brick: THREE.Material;
  whiteBrick: THREE.Material;
  accent: THREE.Material;
  gold: THREE.Material;
  owner: THREE.Material;
  trim: THREE.Material;
}

function palette(civ: BronzeCiv, ownerCol: number): RP {
  const base = {
    stone: rbx(0xaabbcc),
    stone2: rbx(0x8899aa),
    wood: rbx(0xcd853f),
    clay: rbx(0xc4a574),
    brick: rbx(0xb5523a),
    whiteBrick: rbx(0xf2ece4),
    gold: rbx(0xffd54a),
    owner: rbx(ownerCol),
    trim: rbx(0x334455),
  };
  switch (civ) {
    case 'grecja':
      return {
        ...base,
        wall: rbx(0xf8f9fc),
        stone: rbx(0xf2f4f7),
        stone2: rbx(0xe8eaed),
        roof: rbx(0xf5f6f8),
        roof2: rbx(0xeeeeee),
        accent: rbx(0x1565c0),
        trim: rbx(0x42a5f5),
        wood: rbx(0xe8eaed),
      };
    case 'rzym':
      return { ...base, wall: rbx(0xfff8e7), roof: rbx(0xe53935), roof2: rbx(0xc62828), accent: rbx(0xffcc80), stone: rbx(0xd7ccc8) };
    case 'sumer':
      return { ...base, wall: rbx(0xd4a574), roof: rbx(0xa1887f), roof2: rbx(0x8d6e63), accent: rbx(0xff8a65), stone: rbx(0xbcaaa4), stone2: rbx(0x8d6e63) };
    case 'egipt':
      return { ...base, wall: rbx(0xffe082), roof: rbx(0xffca28), roof2: rbx(0xffa000), accent: rbx(0xffd54a), gold: rbx(0xffeb3b), stone: rbx(0xffcc80) };
    case 'inka':
      return { ...base, wall: rbx(0xb0bec5), roof: rbx(0xffa726), roof2: rbx(0xfb8c00), accent: rbx(0xffd54a), stone: rbx(0x90a4ae), stone2: rbx(0x78909c) };
    case 'aztek':
      return { ...base, wall: rbx(0x8d6e63), roof: rbx(0x43a047), roof2: rbx(0x2e7d32), accent: rbx(0xd32f2f), gold: rbx(0x00e676), stone: rbx(0x795548) };
    case 'chiny':
      return { ...base, wall: rbx(0xfff3e0), roof: rbx(0x424242), roof2: rbx(0x212121), accent: rbx(0xd32f2f), gold: rbx(0xffd54a), trim: rbx(0xb71c1c) };
    case 'zulu':
      return { ...base, wall: rbx(0xd7ccc8), roof: rbx(0xffb74d), roof2: rbx(0xff9800), accent: rbx(0x6d4c41) };
    case 'celtowie':
      return { ...base, wall: rbx(0xd7ccc8), roof: rbx(0x8bc34a), roof2: rbx(0x689f38), accent: rbx(0x795548), stone: rbx(0x9e9e9e) };
    case 'germanie':
      return { ...base, wall: rbx(0xa1887f), roof: rbx(0x6d4c41), roof2: rbx(0x4e342e), accent: rbx(0xff5722), wood: rbx(0x5d4037) };
    case 'hetyci':
      return {
        ...base,
        wall: rbx(0x9e9e9e),
        roof: rbx(0x757575),
        roof2: rbx(0x616161),
        stone: rbx(0x9e9e9e),
        stone2: rbx(0x757575),
        accent: rbx(0x546e7a),
        trim: rbx(0x424242),
        wood: rbx(0x6d4c41),
      };
    default:
      return { ...base, wall: rbx(0xf5f5f5), roof: rbx(0xef5350), roof2: rbx(0xc62828), accent: rbx(0xffeb3b) };
  }
}

function addBox(
  g: THREE.Group, w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material,
): void {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
}

function addCyl(
  g: THREE.Group, rt: number, rb: number, h: number, x: number, y: number, z: number, m: THREE.Material, seg = 6,
): void {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  g.add(mesh);
}

/** Mały „studek" Roblox na dachu. */
function addStud(g: THREE.Group, x: number, y: number, z: number, m: THREE.Material, r = 0.018): void {
  addCyl(g, r, r, 0.012, x, y, z, m, 8);
}

function steps(g: THREE.Group, n: number, w: number, d: number, h: number, shrink: number, m: THREE.Material, y0 = 0): number {
  let y = y0;
  let cw = w;
  let cd = d;
  for (let i = 0; i < n; i++) {
    addBox(g, cw, h, cd, 0, y, 0, m);
    y += h;
    cw *= shrink;
    cd *= shrink;
  }
  return y;
}

function temple(civ: BronzeCiv, s: number, p: RP): THREE.Group {
  const g = new THREE.Group();
  switch (civ) {
    case 'grecja': {
      const marble = p.stone;
      const blue = p.accent;
      addBox(g, 0.34 * s, 0.04 * s, 0.24 * s, 0, 0, 0, marble);
      for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) {
        const isBlue = sz === 1 && sx !== 0;
        addCyl(g, 0.022 * s, 0.026 * s, 0.16 * s, sx * 0.12 * s, 0.04 * s, sz * 0.08 * s, isBlue ? blue : marble, 6);
      }
      addBox(g, 0.36 * s, 0.05 * s, 0.26 * s, 0, 0.2 * s, 0, marble);
      addBox(g, 0.28 * s, 0.04 * s, 0.04 * s, 0, 0.26 * s, 0.1 * s, marble);
      addBox(g, 0.22 * s, 0.05 * s, 0.012 * s, 0, 0.285 * s, 0.12 * s, blue);
      break;
    }
    case 'rzym': {
      addBox(g, 0.3 * s, 0.08 * s, 0.22 * s, 0, 0, 0, p.stone);
      for (let i = -2; i <= 2; i++) addCyl(g, 0.02 * s, 0.024 * s, 0.14 * s, i * 0.06 * s, 0.08 * s, 0.1 * s, p.wall, 6);
      addBox(g, 0.32 * s, 0.05 * s, 0.24 * s, 0, 0.22 * s, 0, p.roof);
      addStud(g, 0, 0.28 * s, 0, p.gold);
      break;
    }
    case 'sumer': {
      steps(g, 4, 0.4 * s, 0.32 * s, 0.07 * s, 0.74, p.stone);
      addBox(g, 0.18 * s, 0.08 * s, 0.14 * s, 0, 0.3 * s, 0, p.accent);
      addBox(g, 0.1 * s, 0.04 * s, 0.28 * s, 0, 0.12 * s, 0.14 * s, p.stone2);
      break;
    }
    case 'egipt': {
      for (const sx of [-1, 1]) {
        addBox(g, 0.1 * s, 0.28 * s, 0.12 * s, sx * 0.08 * s, 0, 0, p.wall);
        addBox(g, 0.12 * s, 0.04 * s, 0.14 * s, sx * 0.08 * s, 0.28 * s, 0, p.gold);
      }
      addBox(g, 0.22 * s, 0.04 * s, 0.08 * s, 0, 0.22 * s, 0, p.accent);
      for (const sx of [-1, 1]) addCyl(g, 0.02 * s, 0.024 * s, 0.18 * s, sx * 0.14 * s, 0, 0.06 * s, p.gold, 4);
      break;
    }
    case 'inka': {
      steps(g, 3, 0.36 * s, 0.28 * s, 0.06 * s, 0.8, p.stone);
      addBox(g, 0.2 * s, 0.12 * s, 0.16 * s, 0, 0.2 * s, 0, p.wall);
      addBox(g, 0.22 * s, 0.025 * s, 0.18 * s, 0, 0.28 * s, 0, p.gold);
      addBox(g, 0.14 * s, 0.06 * s, 0.14 * s, 0, 0.34 * s, 0, p.roof);
      break;
    }
    case 'aztek': {
      steps(g, 5, 0.42 * s, 0.38 * s, 0.055 * s, 0.78, p.stone);
      addBox(g, 0.12 * s, 0.08 * s, 0.14 * s, -0.08 * s, 0.32 * s, 0, p.accent);
      addBox(g, 0.12 * s, 0.08 * s, 0.14 * s, 0.08 * s, 0.32 * s, 0, p.gold);
      addBox(g, 0.14 * s, 0.03 * s, 0.32 * s, 0, 0.14 * s, 0.16 * s, p.stone2);
      break;
    }
    case 'chiny': {
      addBox(g, 0.4 * s, 0.05 * s, 0.4 * s, 0, 0, 0, p.stone);
      let y = 0.05 * s;
      for (let tier = 0; tier < 3; tier++) {
        const bw = (0.28 - tier * 0.05) * s;
        addBox(g, bw, 0.1 * s, bw, 0, y, 0, p.wall);
        addBox(g, bw * 1.15, 0.04 * s, bw * 1.15, 0, y + 0.1 * s, 0, p.roof);
        for (const sx of [-1, 1]) addCyl(g, 0.016 * s, 0.016 * s, 0.1 * s, sx * bw * 0.42, y, bw * 0.42, p.accent, 6);
        y += 0.16 * s;
      }
      addCyl(g, 0.01 * s, 0.02 * s, 0.08 * s, 0, y, 0, p.gold, 6);
      break;
    }
    case 'zulu': {
      addCyl(g, 0.2 * s, 0.22 * s, 0.08 * s, 0, 0, 0, p.wood, 8);
      addCyl(g, 0.18 * s, 0.2 * s, 0.14 * s, 0, 0.08 * s, 0, p.roof, 8);
      addBox(g, 0.08 * s, 0.1 * s, 0.02 * s, 0, 0.05 * s, 0.19 * s, p.wood);
      break;
    }
    case 'celtowie': {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        addBox(g, 0.04 * s, 0.14 * s, 0.03 * s, Math.cos(a) * 0.16 * s, 0, Math.sin(a) * 0.16 * s, p.stone);
      }
      addCyl(g, 0.035 * s, 0.04 * s, 0.22 * s, 0, 0, 0, p.wood, 6);
      addBox(g, 0.07 * s, 0.06 * s, 0.07 * s, 0, 0.24 * s, 0, p.accent);
      addBox(g, 0.05 * s, 0.05 * s, 0.05 * s, 0, 0.32 * s, 0, p.gold);
      break;
    }
    case 'germanie': {
      addBox(g, 0.36 * s, 0.12 * s, 0.18 * s, 0, 0, 0, p.wall);
      addBox(g, 0.38 * s, 0.04 * s, 0.2 * s, 0, 0.14 * s, 0, p.roof);
      for (const sx of [-1, 1]) {
        addCyl(g, 0.022 * s, 0.026 * s, 0.2 * s, sx * 0.14 * s, 0, 0.12 * s, p.wood, 6);
        addBox(g, 0.05 * s, 0.05 * s, 0.05 * s, sx * 0.14 * s, 0.22 * s, 0.12 * s, p.accent);
      }
      break;
    }
    case 'hetyci': {
      const tw = 0.11 * s, th = 0.28 * s, td = 0.14 * s, gap = 0.1 * s;
      for (const sx of [-1, 1]) {
        const x = sx * (gap / 2 + tw / 2);
        addBox(g, tw, th, td, x, 0, 0, p.stone);
        addBox(g, tw * 1.08, 0.04 * s, td * 1.08, x, th, 0, p.stone2);
        for (let i = 0; i < 3; i++) addBox(g, tw * 0.92, 0.05 * s, td * 0.35, x, 0.06 * s + i * th * 0.28, td * 0.22, p.stone2);
      }
      addBox(g, gap + tw * 1.4, 0.06 * s, td * 0.55, 0, th * 0.78, 0, p.stone2);
      addBox(g, gap * 0.72, th * 0.42, td * 0.42, 0, th * 0.36, 0, p.stone);
      addBox(g, gap + tw * 2, 0.025 * s, 0.22 * s, 0, 0, -0.15 * s, p.stone2);
      break;
    }
  }
  return g;
}

function house(civ: BronzeCiv, idx: number, r: number, p: RP): THREE.Group {
  const g = new THREE.Group();
  const j = 0.85 + rnd(idx, 2) * 0.3;
  const w = r * 1.6 * j;
  const h = r * (0.75 + rnd(idx, 3) * 0.45);
  const d = r * 1.35 * j;

  switch (civ) {
    case 'grecja':
      addBox(g, w, h, d, 0, 0, 0, p.wall);
      addBox(g, w * 1.05, r * 0.12, d * 1.05, 0, h, 0, p.roof);
      break;
    case 'sumer':
    case 'egipt':
    case 'aztek':
      addBox(g, w, h, d, 0, 0, 0, p.wall);
      addBox(g, w * 1.05, r * 0.12, d * 1.05, 0, h, 0, p.roof);
      addStud(g, 0, h + r * 0.12, 0, p.trim);
      break;
    case 'rzym':
    case 'inka':
      addBox(g, w, h, d, 0, 0, 0, p.wall);
      addBox(g, w * 1.08, r * 0.14, d * 0.5, 0, h + r * 0.04, 0, p.roof);
      addBox(g, w * 1.08, r * 0.14, d * 0.5, 0, h + r * 0.04, 0, p.roof2);
      break;
    case 'chiny':
      addBox(g, w, h, d, 0, 0, 0, p.wall);
      addBox(g, w * 1.1, r * 0.08, d * 1.1, 0, h, 0, p.roof);
      addCyl(g, r * 0.06, r * 0.06, h, w * 0.42, 0, d * 0.38, p.accent, 6);
      break;
    case 'zulu':
      addCyl(g, r * 0.9, r * 0.95, h * 0.85, 0, 0, 0, p.wall, 8);
      addCyl(g, r * 1.05, r * 0.5, r * 0.9, 0, h * 0.85, 0, p.roof, 8);
      break;
    case 'celtowie':
      if (idx % 4 === 0) {
        addCyl(g, r * 0.85, r * 0.85, h, 0, 0, 0, p.wall, 8);
        addCyl(g, r, r * 0.3, r * 0.95, 0, h, 0, p.roof, 8);
      } else {
        addBox(g, w, h, d * 1.15, 0, 0, 0, p.wall);
        addBox(g, w * 1.1, r * 0.12, d * 0.55, 0, h, 0, p.roof);
      }
      break;
    case 'germanie':
      if (idx % 5 === 0) {
        addBox(g, w * 1.6, h, d, 0, 0, 0, p.wall);
        addBox(g, w * 1.65, r * 0.12, d * 1.05, 0, h, 0, p.roof);
      } else {
        addCyl(g, r * 0.85, r * 0.85, h, 0, 0, 0, p.wall, 6);
        addCyl(g, r, r * 0.35, r, 0, h, 0, p.roof, 6);
      }
      break;
    case 'hetyci':
      addBox(g, w, h, d, 0, 0, 0, p.stone);
      addBox(g, w * 1.05, r * 0.1, d * 1.05, 0, h, 0, p.stone2);
      addStud(g, 0, h + r * 0.1, 0, p.trim);
      break;
    default:
      addBox(g, w, h, d, 0, 0, 0, p.wall);
      addBox(g, w * 1.05, r * 0.1, d * 1.05, 0, h, 0, p.roof);
  }
  return g;
}

function walls(civ: BronzeCiv, spread: number, p: RP): THREE.Group {
  const g = new THREE.Group();
  const hexTarget = (WALL_HEX_FILL * HEX_R) / CITY_MODEL_SCALE;
  const outerR = Math.max(hexTarget, spread * 1.22);
  const innerR = Math.max(outerR - WALL_BAND, spread * 0.92);
  const geo = getHexWallRingGeo(outerR, innerR, WALL_HEIGHT);
  const mat = wallMassMaterial(wallMassKind(civ), p);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return g;
}

/** Miasto brązu — styl Roblox (klocki). */
export function buildBronzeCityRoblox(
  civ: BronzeCiv,
  level: number,
  ownerCol: number,
  withWalls = false,
): THREE.Group {
  const L = Math.max(1, Math.min(10, Math.round(level)));
  const group = new THREE.Group();
  const p = palette(civ, ownerCol);
  const hutCount = [2, 3, 5, 7, 9, 12, 15, 18, 22, 26][L - 1]!;
  const spread = 0.13 + L * 0.05;
  const hutR = 0.06;
  const tScale = 0.8 + (L - 1) * 0.06;

  group.add(temple(civ, tScale, p));

  let placed = 0;
  const rings: Array<[number, number]> = [[6, spread * 0.62], [10, spread * 0.9], [18, spread * 1.15]];
  for (const [cap, ringR] of rings) {
    const per = Math.min(hutCount - placed, cap);
    for (let i = 0; i < per; i++) {
      const ang = (i / per) * 6.2832 + rnd(placed, 1);
      const rr = ringR * (0.85 + rnd(placed, 2) * 0.3);
      const h = house(civ, placed, hutR * (0.9 + rnd(placed, 3) * 0.3), p);
      h.position.set(Math.cos(ang) * rr, 0, Math.sin(ang) * rr);
      h.rotation.y = (civ === 'germanie' || civ === 'chiny')
        ? Math.atan2(-Math.sin(ang), -Math.cos(ang))
        : Math.round(rnd(placed, 4) * 4) * (Math.PI / 2);
      group.add(h);
      placed++;
    }
    if (placed >= hutCount) break;
  }

  addCyl(group, 0.014, 0.016, 0.32, spread * 0.95, 0, spread * 0.2, p.wood, 6);
  addBox(group, 0.07, 0.05, 0.002, spread * 0.95, 0.3, spread * 0.24, p.owner);

  if (withWalls) group.add(walls(civ, spread, p));
  return group;
}
