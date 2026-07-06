/**
 * robloxCity.ts — miasta na mapie w stylu Roblox (kolorowe klocki, wieże, mury).
 * Kontrakt jak buildStoneAgeCity: level 1–10, kolor cywilizacji, opcjonalne mury.
 */
import * as THREE from 'three';

function rnd(n: number, salt: number): number {
  let x = Math.imul((n + 1) * 2654435761 + salt * 40503, 0x27d4eb2d) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x2c1b3c6d) >>> 0;
  x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}

function mat(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}

const RBX_PALETTE = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0xa29bfe, 0xff9ff3, 0x54a0ff, 0x5cd85a, 0xff9f43];

function addBox(
  g: THREE.Group,
  w: number, h: number, d: number,
  x: number, y: number, z: number,
  color: number,
): void {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
}

function addTower(g: THREE.Group, x: number, z: number, baseY: number, h: number, color: number): void {
  addBox(g, 0.22, h, 0.22, x, baseY, z, color);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.22, 4), mat(0xffaa00));
  roof.position.set(x, baseY + h + 0.08, z);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);
}

function robloxWall(spread: number): THREE.Group {
  const g = new THREE.Group();
  const segments = 14;
  const Rr = spread * 1.35;
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const bx = Math.cos(a) * Rr;
    const bz = Math.sin(a) * Rr;
    addBox(g, 0.18, 0.28, 0.14, bx, 0.04, bz, i % 2 === 0 ? 0x9aa3b0 : 0x8899aa);
    if (i % 3 === 0) {
      addBox(g, 0.12, 0.38, 0.12, bx, 0.04, bz, 0xff8800);
    }
  }
  const gate = new THREE.Mesh(new THREE.BoxGeometry(Rr * 0.35, 0.22, 0.12), mat(0x553311));
  gate.position.set(0, 0.15, Rr);
  g.add(gate);
  return g;
}

export function buildRobloxCity(level: number, ownerCol: number, withWalls = false): THREE.Group {
  const L = Math.max(1, Math.min(10, Math.round(level)));
  const root = new THREE.Group();

  const spread = 0.28 + L * 0.055;
  const buildingCount = [2, 4, 6, 8, 10, 12, 14, 17, 20, 24][L - 1]!;

  const platR = 0.38 + (L - 1) * 0.032;
  const plat = new THREE.Mesh(
    new THREE.CylinderGeometry(platR, platR * 1.06, 0.07, 8),
    mat(0x44dd44),
  );
  plat.position.y = 0.035;
  plat.receiveShadow = true;
  root.add(plat);

  const accent = ownerCol & 0xffffff;
  const colors = [accent, ...RBX_PALETTE.filter(c => c !== accent)];

  for (let i = 0; i < buildingCount; i++) {
    const ang = (i / buildingCount) * Math.PI * 2 + rnd(i, L) * 0.6;
    const dist = spread * (0.35 + rnd(i, L + 3) * 0.65);
    const bx = Math.cos(ang) * dist;
    const bz = Math.sin(ang) * dist;
    const w = 0.18 + rnd(i, 7) * 0.16;
    const h = 0.2 + rnd(i, 11) * 0.35 + L * 0.025;
    const d = w * (0.85 + rnd(i, 13) * 0.2);
    addBox(root, w, h, d, bx, 0.07, bz, colors[i % colors.length]!);

    if (L >= 4 && i % 4 === 0) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.25, h * 0.2, 0.02), mat(0x88ddff));
      win.position.set(bx, 0.07 + h * 0.55, bz + d / 2 + 0.01);
      root.add(win);
    }
  }

  if (L >= 3) {
    addTower(root, 0, 0, 0.07, 0.35 + L * 0.05, 0xff8800);
  }

  if (L >= 6) {
    const th = 0.5 + (L - 6) * 0.08;
    addBox(root, 0.55, th, 0.48, 0, 0.07, 0, 0x9aa3b0);
    for (const [dx, dz] of [[-0.32, -0.28], [0.32, -0.28], [-0.32, 0.28], [0.32, 0.28]] as const) {
      addBox(root, 0.14, th * 0.75, 0.14, dx, 0.07, dz, 0x8899aa);
    }
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.28, 4), mat(0xff9922));
    cap.position.set(0, 0.07 + th + 0.1, 0);
    cap.rotation.y = Math.PI / 4;
    cap.castShadow = true;
    root.add(cap);
  }

  if (L >= 8) {
    addTower(root, spread * 0.55, spread * 0.2, 0.07, 0.45 + (L - 8) * 0.06, 0xff6b6b);
    addTower(root, -spread * 0.5, -spread * 0.15, 0.07, 0.4, 0x4ecdc4);
  }

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.42 + L * 0.02, 5), mat(0x8b5a2b));
  pole.position.set(spread * 0.75, 0.25, spread * 0.55);
  pole.castShadow = true;
  root.add(pole);

  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.02), mat(accent));
  flag.position.set(spread * 0.75 + 0.06, 0.42 + L * 0.015, spread * 0.55);
  root.add(flag);

  if (L >= 2) {
    const path = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 6), mat(0xc49a6c));
    path.position.set(0, 0.075, spread * 0.5);
    path.receiveShadow = true;
    root.add(path);
  }

  if (withWalls) root.add(robloxWall(spread));

  return root;
}

/** Paleta Rzymu (z bronzeCity) — białe mury, czerwone dachówki. */
const ROME = {
  wall: 0xe7ddc7,
  roof: 0xb5532f,
  roofDk: 0x8f3f22,
  col: 0xede6d6,
  stone: 0x9a8c70,
  stoneDk: 0x77694f,
  path: 0xc49a6c,
  grass: 0x55bb44,
} as const;

/** Dom rzymski: biały blok + czerwony dach dwuspadowy (klocki). */
function addRomanHouse(g: THREE.Group, x: number, z: number, baseY: number, w: number, h: number, d: number): void {
  addBox(g, w, h, d, x, baseY, z, ROME.wall);
  const rw = w * 1.06;
  const rh = d * 0.35;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.06, rh), mat(ROME.roof));
  roof.position.set(x, baseY + h + 0.03, z);
  roof.rotation.x = -0.42;
  roof.castShadow = true;
  g.add(roof);
  const roof2 = roof.clone();
  roof2.rotation.x = 0.42;
  roof2.position.set(x, baseY + h + 0.03, z);
  g.add(roof2);
}

/** Świątynia rzymska — podium + kolumny + czerwony fronton z klocków. */
function addRomanTemple(g: THREE.Group, baseY: number, scale: number): void {
  const W = 0.34 * scale;
  const D = 0.26 * scale;
  const podH = 0.05 * scale;
  addBox(g, W * 1.1, podH, D * 1.1, 0, baseY, 0, ROME.col);
  const colH = 0.14 * scale;
  const colN = 5;
  for (let i = 0; i < colN; i++) {
    const cx = -W * 0.42 + (i / (colN - 1)) * W * 0.84;
    addBox(g, 0.04 * scale, colH, 0.04 * scale, cx, baseY + podH, D * 0.38, ROME.col);
  }
  addBox(g, W * 0.62, colH * 0.85, D * 0.42, 0, baseY + podH, -D * 0.12, ROME.wall);
  const entY = baseY + podH + colH;
  addBox(g, W * 1.05, 0.04 * scale, D * 1.05, 0, entY, 0, ROME.roofDk);
  const peak = new THREE.Mesh(new THREE.ConeGeometry(W * 0.55, 0.12 * scale, 4), mat(ROME.roof));
  peak.position.set(0, entY + 0.08 * scale, 0);
  peak.rotation.y = Math.PI / 4;
  peak.castShadow = true;
  g.add(peak);
}

function romanWall(spread: number): THREE.Group {
  const g = new THREE.Group();
  const segments = 16;
  const Rr = spread * 1.38;
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    if (Math.abs(((a + Math.PI) % (Math.PI * 2)) - Math.PI) < 0.2) continue;
    const bx = Math.cos(a) * Rr;
    const bz = Math.sin(a) * Rr;
    addBox(g, 0.16, 0.26, 0.12, bx, 0.04, bz, i % 2 === 0 ? ROME.stone : ROME.stoneDk);
    if (i % 4 === 0) {
      addBox(g, 0.1, 0.34, 0.1, bx, 0.04, bz, ROME.roof);
    }
  }
  addBox(g, Rr * 0.32, 0.2, 0.1, 0, 0.04, Rr, ROME.stoneDk);
  return g;
}

/**
 * Miasto Rzymu — styl RoboProBlocks (kolorowe klocki, flat shading).
 * Poziomy 1–10: rośnie liczba domów, świątynia, opcjonalnie mury kamienne.
 */
export function buildRobloxRomeCity(level: number, ownerCol: number, withWalls = false): THREE.Group {
  const L = Math.max(1, Math.min(10, Math.round(level)));
  const root = new THREE.Group();
  const baseY = 0.07;

  const spread = 0.26 + L * 0.052;
  const buildingCount = [2, 3, 5, 7, 9, 11, 14, 17, 20, 24][L - 1]!;
  const tScale = 0.75 + (L - 1) * 0.065;

  const platR = 0.36 + (L - 1) * 0.034;
  const plat = new THREE.Mesh(
    new THREE.CylinderGeometry(platR, platR * 1.05, 0.07, 8),
    mat(ROME.grass),
  );
  plat.position.y = 0.035;
  plat.receiveShadow = true;
  root.add(plat);

  addRomanTemple(root, baseY, tScale);

  for (let i = 0; i < buildingCount; i++) {
    const ang = (i / buildingCount) * Math.PI * 2 + rnd(i, L) * 0.5 + 0.35;
    const dist = spread * (0.42 + rnd(i, L + 5) * 0.58);
    const bx = Math.cos(ang) * dist;
    const bz = Math.sin(ang) * dist;
    const w = 0.14 + rnd(i, 9) * 0.12;
    const h = 0.16 + rnd(i, 13) * 0.22 + L * 0.018;
    const d = w * (0.9 + rnd(i, 17) * 0.15);
    addRomanHouse(root, bx, bz, baseY, w, h, d);
  }

  if (L >= 5) {
    addBox(root, 0.12, 0.08, 0.5, 0, baseY, spread * 0.55, ROME.path);
  }

  const accent = ownerCol & 0xffffff;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.38 + L * 0.02, 5), mat(0x8b5a2b));
  pole.position.set(spread * 0.72, 0.24, spread * 0.48);
  pole.castShadow = true;
  root.add(pole);
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.02), mat(accent));
  flag.position.set(spread * 0.72 + 0.05, 0.4 + L * 0.012, spread * 0.48);
  root.add(flag);

  if (L >= 7) {
    addBox(root, 0.08, 0.55 + (L - 7) * 0.06, 0.08, spread * 0.62, baseY, spread * 0.15, ROME.col);
    const obelisk = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42 + L * 0.03, 0.06), mat(ROME.col));
    obelisk.position.set(-spread * 0.55, baseY + 0.22, spread * 0.2);
    obelisk.castShadow = true;
    root.add(obelisk);
  }

  if (withWalls) root.add(romanWall(spread));

  return root;
}

export function addRobloxSkyDecor(scene: THREE.Scene, cx: number, cz: number, span: number, lite = false): void {
  const cloudMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    flatShading: true,
    transparent: true,
    opacity: 0.9,
  });
  const puffGeo = new THREE.IcosahedronGeometry(1, 0);
  const count = lite ? 14 : 36;
  for (let i = 0; i < count; i++) {
    const g = new THREE.Group();
    const bx = cx + (rnd(i, 99) - 0.5) * span * 1.5;
    const bz = cz + (rnd(i, 77) - 0.5) * span * 1.5;
    const by = 2.5 + rnd(i, 55) * 4 + span * 0.08;
    const scale = 1.4 + rnd(i, 33) * 2.8;
    for (let p = 0; p < 5; p++) {
      const m = new THREE.Mesh(puffGeo, cloudMat);
      m.scale.setScalar(scale * (0.7 + rnd(i, p) * 0.5));
      m.position.set((p - 2) * scale * 0.55, rnd(i, p + 10) * 0.35, rnd(i, p + 20) * 0.45);
      g.add(m);
    }
    g.position.set(bx, by, bz);
    scene.add(g);
  }
}
