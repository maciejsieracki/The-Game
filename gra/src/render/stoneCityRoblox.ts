/**
 * stoneCityRoblox.ts — epoka kamienia, styl Roblox (klocki, flatShading).
 * Per cywilizacja (jak stoneCity.ts / bronzeCityRoblox).
 * API: buildStoneAgeCityRoblox(civ, level 1..10, ownerCol, withWalls)
 */
import * as THREE from 'three';
import { type BronzeCiv } from './bronzeCity';
import { type StoneCiv } from './stoneCity';
import { HEX_R } from './hexutil';

export type { StoneCiv } from './stoneCity';

const CITY_MODEL_SCALE = 1.38;
const WALL_HEX_FILL = 0.70;
const WALL_BAND = 0.058;
const WALL_HEIGHT = 0.13;

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

interface SP {
  mud: THREE.Material;
  thatch: THREE.Material;
  thatchDk: THREE.Material;
  brick: THREE.Material;
  brickDk: THREE.Material;
  stone: THREE.Material;
  stoneDk: THREE.Material;
  wood: THREE.Material;
  fire: THREE.Material;
  gold: THREE.Material;
  owner: THREE.Material;
}

function stonePalette(civ: StoneCiv, ownerCol: number): SP {
  const base = {
    stone: rbx(0x9a9a94),
    stoneDk: rbx(0x77694f),
    wood: rbx(0x8b6914),
    fire: rbx(0xff6b2b),
    gold: rbx(0xd4af37),
    owner: rbx(ownerCol),
  };
  switch (civ) {
    case 'grecja':
      return { ...base, mud: rbx(0x8a7050), thatch: rbx(0xc2a262), thatchDk: rbx(0x9a7d44), brick: rbx(0xb8a078), brickDk: rbx(0x8a7050) };
    case 'rzym':
      return { ...base, mud: rbx(0x8a6848), thatch: rbx(0xb89a5e), thatchDk: rbx(0x8a6848), brick: rbx(0xc9a36b), brickDk: rbx(0x9c763f) };
    case 'sumer':
    case 'egipt':
      return { ...base, mud: rbx(0x9a7a50), thatch: rbx(0xc9a36b), thatchDk: rbx(0x9c763f), brick: rbx(0xc9a36b), brickDk: rbx(0xa07c44), stone: rbx(0xc29a62), stoneDk: rbx(0xa07c44), gold: rbx(0xe6c64a) };
    case 'inka':
      return { ...base, mud: rbx(0x8f857a), thatch: rbx(0xc6a64e), thatchDk: rbx(0x8a7a40), brick: rbx(0x8a8076), brickDk: rbx(0x6f665c) };
    case 'aztek':
      return { ...base, mud: rbx(0x8a7f70), thatch: rbx(0x9a8f80), thatchDk: rbx(0x726a5c), brick: rbx(0x9a8f80), brickDk: rbx(0x726a5c), stone: rbx(0x9a8f80) };
    case 'chiny':
      return { ...base, mud: rbx(0x8a7058), thatch: rbx(0xb89a5e), thatchDk: rbx(0x8a6848), brick: rbx(0xe7ddc7), brickDk: rbx(0xb23a2a) };
    case 'zulu':
      return { ...base, mud: rbx(0x9c7b50), thatch: rbx(0xc2a766), thatchDk: rbx(0x8a6a45), brick: rbx(0x9c7b50), brickDk: rbx(0x8a6a45) };
    case 'celtowie':
      return { ...base, mud: rbx(0x9a8060), thatch: rbx(0xb89a5e), thatchDk: rbx(0x8a6a45), brick: rbx(0xcdbb95), brickDk: rbx(0x9a8060) };
    case 'germanie':
      return { ...base, mud: rbx(0x8a7048), thatch: rbx(0x8f7a45), thatchDk: rbx(0x6f5e34), brick: rbx(0xb8a06a), brickDk: rbx(0x8a3a2a) };
    case 'hetyci':
      return { ...base, mud: rbx(0x8a8a8a), thatch: rbx(0x757575), thatchDk: rbx(0x616161), brick: rbx(0x9e9e9e), brickDk: rbx(0x616161), stone: rbx(0x9e9e9e), stoneDk: rbx(0x616161) };
    default:
      return { ...base, mud: rbx(0x9a7a50), thatch: rbx(0xc9a86a), thatchDk: rbx(0xa08048), brick: rbx(0xb8956a), brickDk: rbx(0x9a7a50) };
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

const hexWallRingCache = new Map<string, THREE.ExtrudeGeometry>();

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

function blockRoof(g: THREE.Group, w: number, h: number, d: number, y: number, m: THREE.Material): void {
  addBox(g, w, h * 0.45, d, 0, y, 0, m);
  addBox(g, w * 0.72, h * 0.35, d * 0.72, 0, y + h * 0.45, 0, m);
  addBox(g, w * 0.42, h * 0.22, d * 0.42, 0, y + h * 0.8, 0, m);
}

function lepianka(rad: number, seed: number, p: SP): THREE.Group {
  const g = new THREE.Group();
  const w = rad * 1.5;
  const h = rad * (0.55 + rnd(seed, 2) * 0.25);
  const d = rad * 1.35;
  addBox(g, w, h, d, 0, 0, 0, p.mud);
  blockRoof(g, w * 1.08, rad * 0.85, d * 1.08, h, p.thatch);
  return g;
}

function roundHut(rad: number, p: SP): THREE.Group {
  const g = new THREE.Group();
  addCyl(g, rad * 0.95, rad, rad * 0.7, 0, 0, 0, p.mud, 8);
  addCyl(g, rad * 1.05, rad * 0.4, rad * 0.75, 0, rad * 0.7, 0, p.thatch, 8);
  return g;
}

function longHut(rad: number, p: SP): THREE.Group {
  const g = new THREE.Group();
  const w = rad * 2.2;
  const h = rad * 0.72;
  const d = rad * 1.05;
  addBox(g, w, h, d, 0, 0, 0, p.mud);
  addBox(g, w * 1.05, rad * 0.12, d * 1.08, 0, h, 0, p.thatch);
  return g;
}

function brickHut(rad: number, seed: number, p: SP): THREE.Group {
  const g = new THREE.Group();
  const w = rad * 1.6;
  const h = rad * (1.0 + rnd(seed, 3) * 0.35);
  const d = rad * 1.4;
  addBox(g, w, h, d, 0, 0, 0, p.brick);
  addBox(g, w * 1.05, rad * 0.1, d * 1.05, 0, h, 0, p.brickDk);
  return g;
}

function beehiveHut(rad: number, p: SP): THREE.Group {
  const g = new THREE.Group();
  addCyl(g, rad * 0.9, rad * 0.95, rad * 0.85, 0, 0, 0, p.mud, 8);
  addCyl(g, rad * 1.05, rad * 0.5, rad * 0.9, 0, rad * 0.85, 0, p.thatch, 8);
  return g;
}

function firePit(y: number, p: SP): THREE.Group {
  const g = new THREE.Group();
  addCyl(g, 0.07, 0.075, 0.025, 0, y, 0, p.stone, 8);
  addBox(g, 0.05, 0.08, 0.05, 0, y + 0.02, 0, p.fire);
  return g;
}

function megalithCenter(scale: number, p: SP): THREE.Group {
  const g = new THREE.Group();
  const ringR = 0.09 * scale;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    addBox(g, 0.035 * scale, 0.14 * scale, 0.028 * scale, Math.cos(a) * ringR, 0, Math.sin(a) * ringR, p.stone);
  }
  for (const sx of [-1, 1]) addBox(g, 0.04 * scale, 0.12 * scale, 0.04 * scale, sx * 0.045 * scale, 0, 0, p.stoneDk);
  addBox(g, 0.16 * scale, 0.04 * scale, 0.07 * scale, 0, 0.12 * scale, 0, p.stoneDk);
  return g;
}

function protoZiggurat(scale: number, p: SP): THREE.Group {
  const g = new THREE.Group();
  let w = 0.28 * scale;
  let y = 0;
  for (let i = 0; i < 3; i++) {
    const h = 0.045 * scale;
    addBox(g, w, h, w * 0.85, 0, y, 0, p.brick);
    y += h;
    w *= 0.74;
  }
  addBox(g, w * 1.1, 0.035 * scale, w * 0.9, 0, y, 0, p.gold);
  return g;
}

function protoObelisk(scale: number, p: SP): THREE.Group {
  const g = new THREE.Group();
  addCyl(g, 0.018 * scale, 0.024 * scale, 0.22 * scale, 0, 0, 0, p.brick, 4);
  addCyl(g, 0.024 * scale, 0.01 * scale, 0.05 * scale, 0, 0.24 * scale, 0, p.gold, 4);
  return g;
}

function protoPyramid(steps: number, scale: number, p: SP): THREE.Group {
  const g = new THREE.Group();
  let w = 0.3 * scale;
  let y = 0;
  for (let i = 0; i < steps; i++) {
    const h = 0.04 * scale;
    addBox(g, w, h, w, 0, y, 0, p.stone);
    y += h;
    w *= 0.78;
  }
  addBox(g, w * 1.1, 0.035 * scale, w * 1.1, 0, y, 0, p.gold);
  return g;
}

function protoNemeton(scale: number, p: SP): THREE.Group {
  const g = new THREE.Group();
  const ringR = 0.1 * scale;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    addBox(g, 0.03 * scale, 0.12 * scale, 0.025 * scale, Math.cos(a) * ringR, 0, Math.sin(a) * ringR, p.stone);
  }
  addCyl(g, 0.022 * scale, 0.026 * scale, 0.16 * scale, 0, 0, 0, p.wood, 6);
  return g;
}

function protoHittiteGate(scale: number, p: SP): THREE.Group {
  const g = new THREE.Group();
  const tw = 0.09 * scale;
  const th = 0.2 * scale;
  const gap = 0.08 * scale;
  for (const sx of [-1, 1]) {
    const x = sx * (gap / 2 + tw / 2);
    addBox(g, tw, th, tw * 0.9, x, 0, 0, p.stone);
    addBox(g, tw * 1.08, 0.03 * scale, tw, x, th, 0, p.stoneDk);
  }
  addBox(g, gap + tw * 1.2, 0.05 * scale, tw * 0.7, 0, th * 0.75, 0, p.stoneDk);
  return g;
}

function protoCenter(civ: StoneCiv, L: number, platH: number, p: SP): THREE.Group | null {
  const sc = 0.85 + (L - 6) * 0.08;
  if (L >= 6) {
    switch (civ) {
      case 'grecja':
      case 'rzym':
        return megalithCenter(sc, p);
      case 'sumer':
        return protoZiggurat(sc, p);
      case 'egipt':
        return protoObelisk(sc, p);
      case 'inka':
        return protoPyramid(2, sc, p);
      case 'aztek':
        return protoPyramid(4, sc, p);
      case 'chiny': {
        const g = new THREE.Group();
        for (const [x, z] of [[-0.06, -0.06], [0.06, -0.06], [-0.06, 0.06], [0.06, 0.06]] as const) {
          addCyl(g, 0.012, 0.014, 0.16 * sc, x * sc, 0, z * sc, p.wood, 5);
        }
        addBox(g, 0.22 * sc, 0.04 * sc, 0.22 * sc, 0, 0.16 * sc, 0, p.brickDk);
        return g;
      }
      case 'zulu':
        return beehiveHut(0.18 * sc, p);
      case 'celtowie':
        return protoNemeton(sc, p);
      case 'germanie': {
        const g = new THREE.Group();
        for (const sx of [-1, 1]) {
          addCyl(g, 0.018 * sc, 0.022 * sc, 0.18 * sc, sx * 0.08 * sc, 0, 0.05 * sc, p.wood, 6);
          addBox(g, 0.04 * sc, 0.04 * sc, 0.04 * sc, sx * 0.08 * sc, 0.2 * sc, 0.05 * sc, p.brickDk);
        }
        return g;
      }
      case 'hetyci':
        return protoHittiteGate(sc, p);
      default:
        return megalithCenter(sc, p);
    }
  }
  if (L >= 3) {
    const g = firePit(platH, p);
    if (L >= 4 && (civ === 'egipt' || civ === 'grecja' || civ === 'celtowie' || civ === 'hetyci')) {
      addBox(g, 0.03, 0.12, 0.025, 0.07, platH, 0.04, p.stone);
      addBox(g, 0.025, 0.1, 0.02, -0.06, platH, -0.03, p.stoneDk);
    }
    return g;
  }
  return null;
}

function dwelling(civ: StoneCiv, idx: number, rad: number, L: number, p: SP): THREE.Group {
  const adv = L >= 6 && idx % 3 === 1;
  switch (civ) {
    case 'zulu':
      return beehiveHut(rad, p);
    case 'celtowie':
      return adv ? roundHut(rad, p) : (idx % 2 === 0 ? roundHut(rad, p) : lepianka(rad, idx, p));
    case 'germanie':
      return idx % 4 === 0 ? longHut(rad, p) : roundHut(rad, p);
    case 'inka':
    case 'aztek':
      return adv ? brickHut(rad, idx, p) : beehiveHut(rad, p);
    case 'chiny':
      return adv ? brickHut(rad, idx, p) : lepianka(rad, idx, p);
    case 'hetyci':
      return adv ? brickHut(rad, idx, p) : lepianka(rad, idx, p);
    default:
      return adv ? brickHut(rad, idx, p) : lepianka(rad, idx, p);
  }
}

function hexWall(spread: number, p: SP, mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const hexTarget = (WALL_HEX_FILL * HEX_R) / CITY_MODEL_SCALE;
  const outerR = Math.max(hexTarget, spread * 1.18);
  const innerR = Math.max(outerR - WALL_BAND, spread * 0.88);
  const mesh = new THREE.Mesh(getHexWallRingGeo(outerR, innerR, WALL_HEIGHT), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return g;
}

function cityWalls(civ: StoneCiv, spread: number, p: SP): THREE.Group {
  if (civ === 'zulu' || civ === 'germanie' || civ === 'celtowie') return hexWall(spread, p, p.wood);
  return hexWall(spread, p, p.stone);
}

/** Epoka kamienia — styl Roblox, per cywilizacja (podgląd / dev). */
function buildStoneAgeCityRobloxPerCiv(
  civ: StoneCiv | BronzeCiv,
  level: number,
  ownerCol: number,
  withWalls = false,
): THREE.Group {
  const L = Math.max(1, Math.min(10, Math.round(level)));
  const group = new THREE.Group();
  const p = stonePalette(civ as StoneCiv, ownerCol);
  const hutCount = [1, 2, 3, 5, 7, 9, 12, 15, 18, 22][L - 1]!;
  const spread = 0.11 + L * 0.045;
  const hutR = 0.055;
  const platH = 0.025;

  addCyl(group, spread * 1.05, spread * 1.08, platH, 0, 0, 0, p.mud, 6);

  const center = protoCenter(civ as StoneCiv, L, platH, p);
  if (center) {
    center.position.y = platH;
    group.add(center);
  }

  let placed = 0;
  const rings: Array<[number, number]> = [[4, spread * 0.55], [7, spread * 0.82], [14, spread * 1.08]];
  for (const [cap, ringR] of rings) {
    const per = Math.min(hutCount - placed, cap);
    for (let i = 0; i < per; i++) {
      const ang = (i / per) * 6.2832 + rnd(placed, 1);
      const rr = ringR * (0.82 + rnd(placed, 2) * 0.28);
      const hut = dwelling(civ as StoneCiv, placed, hutR * (0.9 + rnd(placed, 3) * 0.25), L, p);
      hut.position.set(Math.cos(ang) * rr, platH, Math.sin(ang) * rr);
      hut.rotation.y = civ === 'germanie'
        ? Math.atan2(-Math.sin(ang), -Math.cos(ang))
        : Math.round(rnd(placed, 4) * 4) * (Math.PI / 2);
      group.add(hut);
      placed++;
    }
    if (placed >= hutCount) break;
  }

  if (L >= 5) {
    addCyl(group, 0.012, 0.014, 0.28, spread * 0.88, platH, spread * 0.15, p.wood, 6);
    addBox(group, 0.055, 0.045, 0.002, spread * 0.88, platH + 0.3, spread * 0.18, p.owner);
  }

  if (withWalls) group.add(cityWalls(civ as StoneCiv, spread, p));
  return group;
}

/** A5-S2: jeden wspólny styl kamienia — lepianki + ogień, bez świątyń per cyw. */
function buildStoneAgeCityRobloxUniversal(
  level: number,
  ownerCol: number,
  withWalls = false,
): THREE.Group {
  const L = Math.max(1, Math.min(10, Math.round(level)));
  const group = new THREE.Group();
  const p = stonePalette('grecja', ownerCol);
  const hutCount = [1, 2, 3, 5, 7, 9, 12, 15, 18, 22][L - 1]!;
  const spread = 0.11 + L * 0.045;
  const hutR = 0.055;
  const platH = 0.025;

  addCyl(group, spread * 1.05, spread * 1.08, platH, 0, 0, 0, p.mud, 6);

  if (L >= 3) {
    const center = firePit(platH, p);
    center.position.y = platH;
    group.add(center);
  }

  let placed = 0;
  const rings: Array<[number, number]> = [[4, spread * 0.55], [7, spread * 0.82], [14, spread * 1.08]];
  for (const [cap, ringR] of rings) {
    const per = Math.min(hutCount - placed, cap);
    for (let i = 0; i < per; i++) {
      const ang = (i / per) * 6.2832 + rnd(placed, 1);
      const rr = ringR * (0.82 + rnd(placed, 2) * 0.28);
      const hut = lepianka(hutR * (0.9 + rnd(placed, 3) * 0.25), placed, p);
      hut.position.set(Math.cos(ang) * rr, platH, Math.sin(ang) * rr);
      hut.rotation.y = Math.round(rnd(placed, 4) * 4) * (Math.PI / 2);
      group.add(hut);
      placed++;
    }
    if (placed >= hutCount) break;
  }

  if (L >= 5) {
    addCyl(group, 0.012, 0.014, 0.28, spread * 0.88, platH, spread * 0.15, p.wood, 6);
    addBox(group, 0.055, 0.045, 0.002, spread * 0.88, platH + 0.3, spread * 0.18, p.owner);
  }

  if (withWalls) group.add(hexWall(spread, p, p.stone));
  return group;
}

export function buildStoneAgeCityRoblox(level: number, ownerCol: number, withWalls?: boolean): THREE.Group;
export function buildStoneAgeCityRoblox(
  civ: StoneCiv | BronzeCiv,
  level: number,
  ownerCol: number,
  withWalls?: boolean,
): THREE.Group;
export function buildStoneAgeCityRoblox(
  civOrLevel: StoneCiv | BronzeCiv | number,
  levelOrOwner: number,
  ownerOrWalls?: number | boolean,
  withWallsArg = false,
): THREE.Group {
  if (typeof civOrLevel === 'number') {
    const lvl = civOrLevel;
    const owner = levelOrOwner;
    const walls = typeof ownerOrWalls === 'boolean' ? ownerOrWalls : false;
    return buildStoneAgeCityRobloxUniversal(lvl, owner, walls);
  }
  const walls = typeof ownerOrWalls === 'boolean' ? ownerOrWalls : withWallsArg;
  return buildStoneAgeCityRobloxPerCiv(
    civOrLevel,
    levelOrOwner,
    ownerOrWalls as number,
    walls,
  );
}
