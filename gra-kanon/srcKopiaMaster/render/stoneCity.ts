/**
 * stoneCity.ts — miasta EPOKI KAMIENIA per cywilizacja (10 typow jak bronzeCity).
 * buildStoneAgeCity(civ, level 1..10, ownerColor, withWalls)
 * L1-5: prymityw (lepianki / kopule / okrągłe chaty wg cyw).
 * L6-10: cegła mułowa + proto-świątynia centrum (megalit, ziggurat, obelisk…).
 * Mury niezależne od poziomu (withWalls).
 *
 * Wywołanie legacy (bez cyw): buildStoneAgeCity(level, owner, walls) — styl uniwersalny.
 */
import * as THREE from 'three';
import { type BronzeCiv, BRONZE_CIVS } from './bronzeCity';

export type StoneCiv = BronzeCiv;
export const STONE_CIVS = BRONZE_CIVS;

export const STONE_CIV_LABELS: Record<StoneCiv, string> = {
  grecja: 'Grecy', rzym: 'Rzymianie', sumer: 'Sumerowie', egipt: 'Egipcjanie', inka: 'Inkowie',
  aztek: 'Aztekowie', chiny: 'Chińczycy', zulu: 'Zulusi', celtowie: 'Celtowie', germanie: 'Germanie',
  hetyci: 'Hetyci / Fenicjanie',
};

function rnd(n: number, salt: number): number {
  let x = Math.imul((n + 1) * 2654435761 + salt * 40503, 0x27d4eb2d) >>> 0;
  x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d) >>> 0; x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}

const mk = (c: number) => new THREE.MeshLambertMaterial({ color: c });
const mkS = (c: number) => new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide });

interface M {
  mud: THREE.Material; thatch: THREE.Material; thatchDk: THREE.Material;
  brick: THREE.Material; brickDk: THREE.Material;
  stone: THREE.Material; stoneDk: THREE.Material;
  wood: THREE.Material; fire: THREE.Material; owner: THREE.Material; gold: THREE.Material;
}

function stonePalette(civ: StoneCiv, ownerCol: number): M {
  const base = {
    stone: mk(0x9a8c70), stoneDk: mk(0x77694f), wood: mk(0x6b4f2a),
    fire: mk(0xff7a1a), owner: mk(ownerCol), gold: mk(0xd4af37),
  };
  switch (civ) {
    case 'grecja':
      return { ...base, mud: mk(0x8a7050), thatch: mk(0xc2a262), thatchDk: mk(0x9a7d44), brick: mk(0xb8a078), brickDk: mk(0x8a7050) };
    case 'rzym':
      return { ...base, mud: mk(0x8a6848), thatch: mk(0xb89a5e), thatchDk: mk(0x8a6848), brick: mk(0xc9a36b), brickDk: mk(0x9c763f) };
    case 'sumer':
    case 'egipt':
      return { ...base, mud: mk(0x9a7a50), thatch: mk(0xc9a36b), thatchDk: mk(0x9c763f), brick: mk(0xc9a36b), brickDk: mk(0xa07c44), stone: mk(0xc29a62), stoneDk: mk(0xa07c44), gold: mk(0xe6c64a) };
    case 'inka':
      return { ...base, mud: mk(0x8f857a), thatch: mk(0xc6a64e), thatchDk: mk(0x8a7a40), brick: mk(0x8a8076), brickDk: mk(0x6f665c) };
    case 'aztek':
      return { ...base, mud: mk(0x8a7f70), thatch: mk(0x9a8f80), thatchDk: mk(0x726a5c), brick: mk(0x9a8f80), brickDk: mk(0x726a5c), stone: mk(0x9a8f80) };
    case 'chiny':
      return { ...base, mud: mk(0x8a7058), thatch: mk(0xb89a5e), thatchDk: mk(0x8a6848), brick: mk(0xe7ddc7), brickDk: mk(0xb23a2a) };
    case 'zulu':
      return { ...base, mud: mk(0x9c7b50), thatch: mk(0xc2a766), thatchDk: mk(0x8a6a45), brick: mk(0x9c7b50), brickDk: mk(0x8a6a45) };
    case 'celtowie':
      return { ...base, mud: mk(0x9a8060), thatch: mk(0xb89a5e), thatchDk: mk(0x8a6a45), brick: mk(0xcdbb95), brickDk: mk(0x9a8060) };
    case 'germanie':
      return { ...base, mud: mk(0x8a7048), thatch: mk(0x8f7a45), thatchDk: mk(0x6f5e34), brick: mk(0xb8a06a), brickDk: mk(0x8a3a2a) };
    case 'hetyci':
      return { ...base, mud: mk(0x8a8a8a), thatch: mk(0x757575), thatchDk: mk(0x616161), brick: mk(0x9e9e9e), brickDk: mk(0x616161), stone: mk(0x9e9e9e), stoneDk: mk(0x616161) };
    default:
      return { ...base, mud: mk(0x9a7a50), thatch: mk(0xc9a86a), thatchDk: mk(0xa08048), brick: mk(0xb8956a), brickDk: mk(0x9a7a50) };
  }
}

function lepianka(rad: number, seed: number, m: M): THREE.Group {
  const g = new THREE.Group();
  const wallH = rad * (0.55 + rnd(seed, 7) * 0.25);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 1.1, wallH, 7), m.mud);
  wall.position.y = wallH / 2; wall.castShadow = true; wall.receiveShadow = true; g.add(wall);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(rad * 1.35, rad * 1.0, 7), m.thatch);
  roof.position.y = wallH + rad * 0.45; roof.castShadow = true; g.add(roof);
  return g;
}

function beehiveHut(rad: number, m: M): THREE.Group {
  const g = new THREE.Group();
  const r = rad * 0.95;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), m.thatch);
  dome.scale.y = 1.15; dome.castShadow = true; dome.receiveShadow = true; g.add(dome);
  return g;
}

function roundhouse(rad: number, seed: number, m: M): THREE.Group {
  const g = new THREE.Group();
  const r = rad * 0.95, h = rad * 0.75;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), m.mud);
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(r * 1.25, rad * 1.05, 12), m.thatch);
  cone.position.y = h + rad * 0.5; cone.castShadow = true; g.add(cone);
  return g;
}

function longHut(rad: number, seed: number, m: M): THREE.Group {
  const g = new THREE.Group();
  const w = rad * 2.4, h = rad * 0.75, d = rad * 1.1;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m.mud);
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const rr = d * 0.8;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, w * 1.05, 3, 1), m.thatch);
  roof.rotation.z = Math.PI / 2; roof.scale.y = d / (1.732 * rr);
  roof.position.y = h + rr * 0.35; roof.castShadow = true; g.add(roof);
  return g;
}

function brickHouse(rad: number, seed: number, m: M): THREE.Group {
  const g = new THREE.Group();
  const w = rad * 1.7, h = rad * (1.1 + rnd(seed, 3) * 0.5), d = rad * 1.5;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m.brick);
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w * 1.06, rad * 0.12, d * 1.06), m.brickDk);
  roof.position.y = h + rad * 0.06; roof.castShadow = true; g.add(roof);
  return g;
}

function standingStone(hh: number, m: M): THREE.Mesh {
  const s = new THREE.Mesh(new THREE.BoxGeometry(0.04, hh, 0.05), m.stone);
  s.position.y = hh / 2; s.castShadow = true; s.receiveShadow = true; return s;
}

function firePit(platH: number, m: M): THREE.Group {
  const g = new THREE.Group();
  const pit = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.10, 0.03, 12), m.stoneDk);
  pit.position.y = platH; pit.receiveShadow = true; g.add(pit);
  const fire = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.10, 6), m.fire);
  fire.position.y = platH + 0.06; g.add(fire);
  return g;
}

function megalithTemple(scale: number, m: M): THREE.Group {
  const g = new THREE.Group();
  const ringR = 0.085 * scale, n = Math.round(6 + scale * 2);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.2832;
    const st = standingStone(0.16 * scale, m);
    st.position.set(Math.cos(a) * ringR, 0, Math.sin(a) * ringR);
    st.rotation.y = a; g.add(st);
  }
  const hh = 0.15 * scale;
  for (const sx of [-0.05 * scale, 0.05 * scale]) {
    const up = new THREE.Mesh(new THREE.BoxGeometry(0.055 * scale, hh, 0.055 * scale), m.stoneDk);
    up.position.set(sx, hh / 2, 0); up.castShadow = true; g.add(up);
  }
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.18 * scale, 0.045 * scale, 0.08 * scale), m.stoneDk);
  cap.position.set(0, hh + 0.022 * scale, 0); cap.castShadow = true; g.add(cap);
  return g;
}

function protoZiggurat(scale: number, m: M): THREE.Group {
  const g = new THREE.Group();
  let w = 0.28 * scale, d = 0.22 * scale, y = 0;
  for (let i = 0; i < 3; i++) {
    const h = 0.05 * scale;
    const step = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m.brick);
    step.position.y = y + h / 2; step.castShadow = true; step.receiveShadow = true; g.add(step);
    y += h; w *= 0.72; d *= 0.72;
  }
  const shrine = new THREE.Mesh(new THREE.BoxGeometry(w * 1.2, 0.05 * scale, d * 1.2), m.gold);
  shrine.position.y = y + 0.025 * scale; g.add(shrine);
  return g;
}

function protoObelisk(scale: number, m: M): THREE.Group {
  const g = new THREE.Group();
  const h = 0.28 * scale, base = 0.03 * scale;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(base * 0.6, base, h, 4), m.brick);
  shaft.rotation.y = Math.PI / 4; shaft.position.y = h / 2; shaft.castShadow = true; g.add(shaft);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(base * 0.85, h * 0.14, 4), m.gold);
  cap.rotation.y = Math.PI / 4; cap.position.y = h + h * 0.06; g.add(cap);
  return g;
}

function protoPyramid(steps: number, scale: number, m: M): THREE.Group {
  const g = new THREE.Group();
  let w = 0.32 * scale, y = 0;
  for (let i = 0; i < steps; i++) {
    const h = 0.045 * scale;
    const s = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), m.stone);
    s.position.y = y + h / 2; s.castShadow = true; g.add(s);
    y += h; w *= 0.78;
  }
  const top = new THREE.Mesh(new THREE.BoxGeometry(w * 1.1, 0.04 * scale, w * 1.1), m.gold);
  top.position.y = y + 0.02 * scale; g.add(top);
  return g;
}

function protoNemeton(scale: number, m: M): THREE.Group {
  const g = new THREE.Group();
  const ringR = 0.12 * scale, n = 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const h = (0.12 + rnd(i, 3) * 0.05) * scale;
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.03 * scale, h, 0.025 * scale), m.stone);
    s.position.set(Math.cos(a) * ringR, h / 2, Math.sin(a) * ringR); s.rotation.y = a; s.castShadow = true; g.add(s);
  }
  const idol = new THREE.Mesh(new THREE.CylinderGeometry(0.025 * scale, 0.03 * scale, 0.18 * scale, 6), m.wood);
  idol.position.y = 0.09 * scale; idol.castShadow = true; g.add(idol);
  return g;
}

function protoCenter(civ: StoneCiv, L: number, platH: number, m: M): THREE.Group | null {
  const sc = 0.75 + (L - 6) * 0.12;
  if (L >= 6) {
    switch (civ) {
      case 'grecja': case 'rzym': return megalithTemple(sc, m);
      case 'sumer': return protoZiggurat(sc, m);
      case 'egipt': return protoObelisk(sc, m);
      case 'inka': return protoPyramid(2, sc, m);
      case 'aztek': return protoPyramid(4, sc, m);
      case 'chiny': {
        const g = new THREE.Group();
        for (const [x, z] of [[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]] as const) {
          const p = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.2 * sc, 5), m.wood);
          p.position.set(x * sc, 0.1 * sc, z * sc); p.castShadow = true; g.add(p);
        }
        const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * sc, 0.14 * sc, 0.04 * sc, 4), m.brickDk);
        roof.rotation.y = Math.PI / 4; roof.position.y = 0.2 * sc; g.add(roof);
        return g;
      }
      case 'zulu': {
        const g = beehiveHut(0.22 * sc, m); g.scale.setScalar(sc); return g;
      }
      case 'celtowie': return protoNemeton(sc, m);
      case 'germanie': {
        const g = new THREE.Group();
        for (const sx of [-1, 1]) {
          const p = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * sc, 0.024 * sc, 0.22 * sc, 6), m.wood);
          p.position.set(sx * 0.1 * sc, 0.11 * sc, 0.06 * sc); p.castShadow = true; g.add(p);
          const k = new THREE.Mesh(new THREE.BoxGeometry(0.05 * sc, 0.05 * sc, 0.05 * sc), m.brickDk);
          k.position.set(sx * 0.1 * sc, 0.24 * sc, 0.06 * sc); g.add(k);
        }
        return g;
      }
      case 'hetyci': {
        const g = new THREE.Group();
        const tw = 0.09 * sc, th = 0.2 * sc, gap = 0.08 * sc;
        for (const sx of [-1, 1]) {
          const x = sx * (gap / 2 + tw / 2);
          const t = new THREE.Mesh(new THREE.BoxGeometry(tw, th, tw * 0.9), m.stone);
          t.position.set(x, th / 2, 0); t.castShadow = true; g.add(t);
        }
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(gap + tw * 1.2, 0.05 * sc, tw * 0.7), m.stoneDk);
        lintel.position.set(0, th * 0.78, 0); g.add(lintel);
        return g;
      }
    }
  }
  if (L >= 3) {
    const g = firePit(platH, m);
    if (L >= 4 && (civ === 'egipt' || civ === 'grecja' || civ === 'celtowie' || civ === 'hetyci')) {
      const s1 = standingStone(0.18, m); s1.position.set(0.08, platH, 0.04); g.add(s1);
      const s2 = standingStone(0.14, m); s2.position.set(-0.07, platH, -0.04); g.add(s2);
    }
    return g;
  }
  return null;
}

function stoneDwelling(civ: StoneCiv, idx: number, rad: number, L: number, m: M): THREE.Group {
  const adv = L >= 6 && idx % 3 === 1;
  switch (civ) {
    case 'zulu': return beehiveHut(rad, m);
    case 'celtowie': return adv ? roundhouse(rad, idx, m) : (idx % 2 === 0 ? roundhouse(rad, idx, m) : lepianka(rad, idx, m));
    case 'germanie': return idx % 4 === 0 ? longHut(rad, idx, m) : roundhouse(rad, idx, m);
    case 'inka': case 'aztek': return adv ? brickHouse(rad, idx, m) : beehiveHut(rad, m);
    case 'chiny': return adv ? brickHouse(rad, idx, m) : lepianka(rad, idx, m);
    case 'hetyci':
      return adv ? brickHouse(rad, idx, m) : lepianka(rad, idx, m);
    default: return adv ? brickHouse(rad, idx, m) : lepianka(rad, idx, m);
  }
}

function cityWall(spread: number): THREE.Group {
  const g = new THREE.Group();
  const Rr = spread * 1.42, wallH = 0.17;
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(Rr, Rr * 1.03, wallH, 30, 1, true), mkS(0x9a8c70));
  wall.position.y = wallH / 2; wall.castShadow = true; wall.receiveShadow = true; g.add(wall);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(Rr * 1.05, Rr * 1.05, 0.035, 30, 1, true), mkS(0x77694f));
  rim.position.y = wallH; g.add(rim);
  const gate = new THREE.Mesh(new THREE.BoxGeometry(Rr * 0.16, wallH * 0.85, 0.06), mk(0x3a2c1a));
  gate.position.set(0, wallH * 0.42, Rr * 1.02); g.add(gate);
  return g;
}

function palisadeWall(spread: number, m: M): THREE.Group {
  const g = new THREE.Group();
  const Rr = spread * 1.42, n = 30, postH = 0.19;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    if (Math.abs(((a + Math.PI) % (Math.PI * 2)) - Math.PI) < 0.18) continue;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, postH, 5), m.wood);
    p.position.set(Math.cos(a) * Rr, postH / 2, Math.sin(a) * Rr); p.castShadow = true; g.add(p);
  }
  return g;
}

function stoneWalls(civ: StoneCiv, spread: number, m: M): THREE.Group {
  if (civ === 'zulu' || civ === 'germanie' || civ === 'celtowie') return palisadeWall(spread, m);
  return cityWall(spread);
}

function buildStoneAgeCityImpl(civ: StoneCiv, level: number, ownerCol: number, withWalls: boolean): THREE.Group {
  const L = Math.max(1, Math.min(10, Math.round(level)));
  const group = new THREE.Group();
  const m = stonePalette(civ, ownerCol);
  const hutCount = [1, 2, 3, 5, 7, 9, 12, 15, 18, 22][L - 1]!;
  const spread = 0.22 + L * 0.06;
  const hutR = 0.13;
  const platR = 0.40 + (L - 1) * 0.03;
  const platH = 0.03;

  const plat = new THREE.Mesh(
    new THREE.CylinderGeometry(platR, platR * 1.04, platH, 8, 1),
    mk(0x7a6040),
  );
  plat.position.y = platH * 0.5; plat.receiveShadow = true; group.add(plat);

  const center = protoCenter(civ, L, platH, m);
  if (center) {
    center.position.y = platH;
    group.add(center);
  }

  let placed = 0;
  if (L <= 2) {
    for (let i = 0; i < hutCount; i++) {
      const ang = i * 2.2 + rnd(i, 1) * 6;
      const rr = L === 1 ? 0 : platR * 0.55;
      const hut = stoneDwelling(civ, i, hutR, L, m);
      hut.position.set(Math.cos(ang) * rr, platH, Math.sin(ang) * rr);
      hut.rotation.y = rnd(i, 4) * 6.28; group.add(hut); placed++;
    }
  } else {
    const rings: Array<[number, number]> = [[5, spread * 0.55], [8, spread * 0.85], [16, spread * 1.12]];
    for (const [cap, ringR] of rings) {
      const per = Math.min(hutCount - placed, cap);
      for (let i = 0; i < per; i++) {
        const ang = (i / per) * 6.2832 + rnd(placed, 1);
        const rr = ringR * (0.82 + rnd(placed, 2) * 0.36);
        const hut = stoneDwelling(civ, placed, hutR * (0.85 + rnd(placed, 3) * 0.3), L, m);
        hut.position.set(Math.cos(ang) * rr, platH, Math.sin(ang) * rr);
        hut.rotation.y = (civ === 'germanie')
          ? Math.atan2(-Math.sin(ang), -Math.cos(ang))
          : rnd(placed, 4) * 6.28;
        group.add(hut); placed++;
      }
      if (placed >= hutCount) break;
    }
  }

  if (L >= 5) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.024, 0.45, 6), m.wood);
    pole.position.set(spread * 0.85, 0.22, spread * 0.18); pole.castShadow = true; group.add(pole);
    const flag = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 4), m.owner);
    flag.position.set(spread * 0.85, 0.49, spread * 0.18); group.add(flag);
  }

  if (withWalls) group.add(stoneWalls(civ, spread, m));
  return group;
}

/** Uniwersalny styl (legacy — bez rozróżnienia cywilizacji). */
function buildStoneAgeCityUniversal(level: number, ownerCol: number, withWalls: boolean): THREE.Group {
  return buildStoneAgeCityImpl('grecja', level, ownerCol, withWalls);
}

export function buildStoneAgeCity(level: number, ownerCol: number, withWalls?: boolean): THREE.Group;
export function buildStoneAgeCity(civ: StoneCiv, level: number, ownerCol: number, withWalls?: boolean): THREE.Group;
export function buildStoneAgeCity(
  civOrLevel: StoneCiv | number,
  levelOrOwner: number,
  ownerOrWalls?: number | boolean,
  withWallsArg = false,
): THREE.Group {
  if (typeof civOrLevel === 'number') {
    const lvl = civOrLevel;
    const owner = levelOrOwner;
    const walls = typeof ownerOrWalls === 'boolean' ? ownerOrWalls : false;
    return buildStoneAgeCityUniversal(lvl, owner, walls);
  }
  const walls = typeof ownerOrWalls === 'boolean' ? ownerOrWalls : withWallsArg;
  return buildStoneAgeCityImpl(civOrLevel, levelOrOwner, ownerOrWalls as number, walls);
}
