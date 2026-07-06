/**
 * wonderModels.ts — modele 3D cudów świata na heksie mapy (MAPA, Roblox).
 * Kanon: budowa na hexie terytorium — nie w slocie miasta (Maciej 2026-07-03).
 */
import * as THREE from 'three';
import { HEX_R } from './hexutil';

export interface WonderModelOptions {
  /** Po absolut — szary kamień, bez „świeżości”. */
  ruin?: boolean;
  /** Kolor właściciela (opaska / flaga). */
  ownerColor?: number;
}

const R = HEX_R;

function grey(c: number, ruin: boolean): number {
  if (!ruin) return c;
  const r = (c >> 16) & 255;
  const g = (c >> 8) & 255;
  const b = c & 255;
  const m = (r + g + b) / 3;
  return (Math.round(r * 0.45 + m * 0.55) << 16)
    | (Math.round(g * 0.45 + m * 0.55) << 8)
    | Math.round(b * 0.45 + m * 0.55);
}

function m(c: number, ruin: boolean): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color: grey(c, ruin), flatShading: true });
}

function box(
  g: THREE.Group, w: number, h: number, d: number,
  x: number, y: number, z: number, mat: THREE.Material,
): void {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
}

function cyl(
  g: THREE.Group, rt: number, rb: number, h: number,
  x: number, y: number, z: number, mat: THREE.Material, seg = 6,
): void {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  g.add(mesh);
}

function cone(
  g: THREE.Group, r: number, h: number,
  x: number, y: number, z: number, mat: THREE.Material, seg = 4,
): void {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  g.add(mesh);
}

/** Piramidy Giza — gładkie ściany (stożek 4-ścianny), nie ziggurat schodkowy. */
function egyptianPyramid(g: THREE.Group, sand: THREE.Material, gold: THREE.Material): void {
  const baseW = 0.52 * R;
  const h = 0.48 * R;
  const baseRadius = (baseW / 2) * Math.SQRT2;
  cone(g, baseRadius, h, 0, 0, 0, sand, 4);
  cone(g, 0.05 * R, 0.08 * R, 0, h, 0, gold, 4);
}

function obelisk(g: THREE.Group, stone: THREE.Material, cap: THREE.Material): void {
  box(g, 0.14 * R, 0.06 * R, 0.14 * R, 0, 0, 0, stone);
  box(g, 0.10 * R, 0.52 * R, 0.10 * R, 0, 0.06 * R, 0, stone);
  cone(g, 0.07 * R, 0.10 * R, 0, 0.58 * R, 0, cap, 4);
}

function hangingGardens(g: THREE.Group, brick: THREE.Material, leaf: THREE.Material, water: THREE.Material): void {
  for (let i = 0; i < 4; i++) {
    const w = (0.50 - i * 0.08) * R;
    const h = 0.07 * R;
    const y = i * 0.08 * R;
    box(g, w, h, w * 0.72, 0, y, 0, brick);
    box(g, w * 0.88, 0.04 * R, w * 0.55, 0, y + h, 0, leaf);
  }
  box(g, 0.18 * R, 0.05 * R, 0.18 * R, 0.22 * R, 0.02 * R, 0, water);
}

function oracleTemple(g: THREE.Group, stone: THREE.Material, roof: THREE.Material): void {
  cyl(g, 0.28 * R, 0.30 * R, 0.05 * R, 0, 0, 0, stone, 6);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    box(g, 0.05 * R, 0.18 * R, 0.05 * R, Math.cos(a) * 0.20 * R, 0.05 * R, Math.sin(a) * 0.20 * R, stone);
  }
  cone(g, 0.26 * R, 0.12 * R, 0, 0.23 * R, 0, roof, 6);
}

function stupa(g: THREE.Group, white: THREE.Material, gold: THREE.Material): void {
  cyl(g, 0.22 * R, 0.24 * R, 0.08 * R, 0, 0, 0, white, 8);
  cyl(g, 0.18 * R, 0.20 * R, 0.10 * R, 0, 0.08 * R, 0, white, 8);
  cone(g, 0.16 * R, 0.14 * R, 0, 0.18 * R, 0, gold, 8);
  box(g, 0.04 * R, 0.10 * R, 0.04 * R, 0, 0.32 * R, 0, gold);
}

function rockFacade(g: THREE.Group, rock: THREE.Material, cave: THREE.Material): void {
  box(g, 0.48 * R, 0.38 * R, 0.14 * R, 0, 0.08 * R, 0, rock);
  box(g, 0.22 * R, 0.20 * R, 0.06 * R, 0, 0.14 * R, 0.06 * R, cave);
  for (const sx of [-0.14, 0.14]) {
    cyl(g, 0.04 * R, 0.05 * R, 0.22 * R, sx * R, 0, 0.10 * R, rock, 4);
  }
}

function trilithon(g: THREE.Group, stone: THREE.Material): void {
  for (const sx of [-0.16, 0.16]) {
    box(g, 0.10 * R, 0.32 * R, 0.10 * R, sx * R, 0, 0, stone);
  }
  box(g, 0.44 * R, 0.08 * R, 0.12 * R, 0, 0.32 * R, 0, stone);
}

/** Kolos Rodyjski — Helios nad bramą portu: dwie nogi na cokołach, ręka z pochodnią. */
function colossus(
  g: THREE.Group,
  bronze: THREE.Material,
  stone: THREE.Material,
  water: THREE.Material,
  flame: THREE.Material,
): void {
  // Kanał portowy między nogami
  box(g, 0.14 * R, 0.025 * R, 0.28 * R, 0, 0.012 * R, 0, water);

  // Dwa kamienne cokoły (mole) + nogi rozstawione
  for (const sx of [-1, 1]) {
    const x = sx * 0.20 * R;
    box(g, 0.14 * R, 0.07 * R, 0.13 * R, x, 0, 0, stone);
    box(g, 0.09 * R, 0.24 * R, 0.09 * R, x, 0.07 * R, 0, bronze);
  }

  // Tułów nad kanałem
  box(g, 0.16 * R, 0.20 * R, 0.09 * R, 0, 0.31 * R, 0, bronze);
  // Pas / szatka
  box(g, 0.18 * R, 0.05 * R, 0.10 * R, 0, 0.28 * R, 0, bronze);

  // Głowa Heliosa
  box(g, 0.11 * R, 0.11 * R, 0.09 * R, 0, 0.51 * R, 0, bronze);
  // Korona promienista (promienie słońca)
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
    box(
      g, 0.018 * R, 0.07 * R, 0.018 * R,
      Math.cos(a) * 0.08 * R, 0.58 * R, Math.sin(a) * 0.05 * R,
      bronze,
    );
  }

  // Lewa ręka w dół
  box(g, 0.06 * R, 0.18 * R, 0.06 * R, -0.13 * R, 0.34 * R, 0, bronze);

  // Prawa ręka uniesiona + misa z płomieniem
  box(g, 0.06 * R, 0.22 * R, 0.06 * R, 0.13 * R, 0.40 * R, 0, bronze);
  cyl(g, 0.045 * R, 0.05 * R, 0.035 * R, 0.13 * R, 0.52 * R, 0, bronze, 6);
  cone(g, 0.055 * R, 0.10 * R, 0.13 * R, 0.57 * R, 0, flame, 4);
}

/** Osada Aschaffenburg — oppidum celtycki (La Tène): wysoki mur, chaty, hala w centrum. */
function celticWalledSettlement(
  g: THREE.Group,
  earth: THREE.Material,
  wood: THREE.Material,
  thatch: THREE.Material,
  stone: THREE.Material,
  water: THREE.Material,
): void {
  const wallBase = 0.10 * R;
  const wallH = 0.22 * R;

  // Wysoki wał + mur kamienny (murus gallicus)
  cyl(g, 0.48 * R, 0.50 * R, wallBase, 0, 0, 0, earth, 12);
  cyl(g, 0.44 * R, 0.46 * R, wallH, 0, wallBase, 0, stone, 12);

  // Palisada na szczycie muru
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    if (Math.abs(a - Math.PI / 2) < 0.28) continue;
    const px = Math.cos(a) * 0.45 * R;
    const pz = Math.sin(a) * 0.45 * R;
    const py = wallBase + wallH;
    box(g, 0.020 * R, 0.09 * R, 0.020 * R, px, py + 0.045 * R, pz, wood);
    cone(g, 0.024 * R, 0.04 * R, px, py + 0.11 * R, pz, wood, 4);
  }

  // Brama z wieżami
  for (const sx of [-1, 1]) {
    box(g, 0.07 * R, 0.26 * R, 0.07 * R, sx * 0.12 * R, wallBase + 0.13 * R, 0.44 * R, stone);
    cone(g, 0.065 * R, 0.09 * R, sx * 0.12 * R, wallBase + 0.30 * R, 0.44 * R, thatch, 4);
  }
  box(g, 0.22 * R, 0.05 * R, 0.06 * R, 0, wallBase + 0.24 * R, 0.44 * R, wood);

  // Hala dębowa — centralny budynek osady
  box(g, 0.24 * R, 0.11 * R, 0.15 * R, 0, wallBase + 0.055 * R, 0, wood);
  box(g, 0.26 * R, 0.09 * R, 0.17 * R, 0, wallBase + 0.16 * R, 0, thatch);
  for (const sx of [-0.10, -0.03, 0.03, 0.10]) {
    box(g, 0.035 * R, 0.22 * R, 0.035 * R, sx * R, wallBase + 0.055 * R, 0.06 * R, wood);
  }

  // Rondinys wokół hali
  const huts: [number, number][] = [[-0.17, -0.11], [0.19, -0.09], [-0.13, 0.17], [0.15, 0.15]];
  for (const [hx, hz] of huts) {
    cyl(g, 0.08 * R, 0.085 * R, 0.085 * R, hx * R, wallBase + 0.042 * R, hz * R, wood, 10);
    cone(g, 0.10 * R, 0.10 * R, hx * R, wallBase + 0.132 * R, hz * R, thatch, 10);
  }

  // Men — tafla rzeki (wymóg: rzeka_sasiad)
  box(g, 0.38 * R, 0.022 * R, 0.09 * R, 0, 0.011 * R, -0.47 * R, water);
}

function ziggurat(g: THREE.Group, mud: THREE.Material, stair: THREE.Material): void {
  const tiers = [
    [0.48 * R, 0.09 * R],
    [0.38 * R, 0.08 * R],
    [0.28 * R, 0.07 * R],
    [0.18 * R, 0.06 * R],
  ];
  let y = 0;
  for (const tier of tiers) {
    const w = tier[0]!;
    const h = tier[1]!;
    box(g, w, h, w, 0, y, 0, mud);
    box(g, 0.06 * R, h, 0.14 * R, 0.20 * R, y, 0.18 * R, stair);
    y += h;
  }
  box(g, 0.06 * R, 0.10 * R, 0.06 * R, 0, y, 0, stair);
}

function mayanPyramid(g: THREE.Group, stone: THREE.Material, temple: THREE.Material): void {
  box(g, 0.44 * R, 0.16 * R, 0.44 * R, 0, 0, 0, stone);
  box(g, 0.30 * R, 0.12 * R, 0.30 * R, 0, 0.16 * R, 0, stone);
  box(g, 0.18 * R, 0.08 * R, 0.14 * R, 0, 0.28 * R, 0, temple);
}

function terracottaPit(g: THREE.Group, clay: THREE.Material, earth: THREE.Material): void {
  box(g, 0.50 * R, 0.06 * R, 0.36 * R, 0, 0, 0, earth);
  for (let row = 0; row < 3; row++) {
    for (let col = -2; col <= 2; col++) {
      box(g, 0.04 * R, 0.10 * R, 0.03 * R, col * 0.08 * R, 0.06 * R, (row - 1) * 0.09 * R, clay);
    }
  }
}

function archUnit(
  parent: THREE.Group,
  tierH: number,
  archW: number,
  pillarW: number,
  depth: number,
  stone: THREE.Material,
  dark: THREE.Material,
): void {
  box(parent, pillarW, tierH, depth, -archW / 2, tierH / 2, 0, stone);
  box(parent, pillarW, tierH, depth, archW / 2, tierH / 2, 0, stone);
  box(parent, archW + pillarW * 2, tierH * 0.22, depth * 1.05, 0, tierH * 0.89, 0, stone);
  box(parent, archW * 0.72, tierH * 0.50, depth * 0.55, 0, tierH * 0.46, 0, dark);
}

/** Koloseum — eliptyczny amfiteatr: 3 kondygnacje łuków + arena + attyk. */
function colosseum(
  g: THREE.Group,
  stone: THREE.Material,
  sand: THREE.Material,
  dark: THREE.Material,
): void {
  // Arena (piasek / walki)
  const arena = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19 * R, 0.19 * R, 0.028 * R, 24),
    sand,
  );
  arena.scale.set(1.55, 1, 1.05);
  arena.position.y = 0.014 * R;
  arena.receiveShadow = true;
  g.add(arena);

  const tiers = [
    { rx: 0.42, rz: 0.29, baseY: 0.028, tierH: 0.095, n: 16, archW: 0.058, pillarW: 0.028, depth: 0.05 },
    { rx: 0.37, rz: 0.26, baseY: 0.123, tierH: 0.082, n: 16, archW: 0.052, pillarW: 0.025, depth: 0.046 },
    { rx: 0.33, rz: 0.23, baseY: 0.205, tierH: 0.072, n: 14, archW: 0.048, pillarW: 0.022, depth: 0.042 },
  ];

  for (const tier of tiers) {
    for (let i = 0; i < tier.n; i++) {
      const a = (i / tier.n) * Math.PI * 2;
      const px = Math.cos(a) * tier.rx * R;
      const pz = Math.sin(a) * tier.rz * R;
      const arch = new THREE.Group();
      arch.position.set(px, tier.baseY * R, pz);
      arch.rotation.y = -a + Math.PI / 2;
      archUnit(
        arch,
        tier.tierH * R,
        tier.archW * R,
        tier.pillarW * R,
        tier.depth * R,
        stone,
        dark,
      );
      g.add(arch);
    }
  }

  // Attyk (4. kondygnacja — mur z okienkami)
  const atticN = 14;
  const atticY = 0.277 * R;
  const atticH = 0.055 * R;
  for (let i = 0; i < atticN; i++) {
    const a = (i / atticN) * Math.PI * 2;
    const px = Math.cos(a) * 0.30 * R;
    const pz = Math.sin(a) * 0.21 * R;
    const seg = new THREE.Group();
    seg.position.set(px, atticY, pz);
    seg.rotation.y = -a + Math.PI / 2;
    box(seg, 0.07 * R, atticH, 0.038 * R, 0, atticH / 2, 0, stone);
    box(seg, 0.025 * R, atticH * 0.35, 0.02 * R, 0, atticH * 0.55, 0.012 * R, dark);
    g.add(seg);
  }

  // Główne wejście (portyk od frontu)
  box(g, 0.10 * R, 0.14 * R, 0.06 * R, -0.07 * R, 0.07 * R, 0.30 * R, stone);
  box(g, 0.10 * R, 0.14 * R, 0.06 * R, 0.07 * R, 0.07 * R, 0.30 * R, stone);
  box(g, 0.20 * R, 0.04 * R, 0.07 * R, 0, 0.16 * R, 0.30 * R, stone);
}

function citadel(g: THREE.Group, wall: THREE.Material, zig: THREE.Material): void {
  box(g, 0.46 * R, 0.14 * R, 0.46 * R, 0, 0, 0, wall);
  for (const [sx, sz] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]] as const) {
    box(g, 0.08 * R, 0.20 * R, 0.08 * R, sx * R, 0.14 * R, sz * R, wall);
  }
  box(g, 0.16 * R, 0.14 * R, 0.16 * R, 0, 0.14 * R, 0, zig);
  cone(g, 0.10 * R, 0.08 * R, 0, 0.28 * R, 0, zig, 4);
}

function grandGate(g: THREE.Group, stone: THREE.Material, gold: THREE.Material): void {
  box(g, 0.10 * R, 0.28 * R, 0.10 * R, -0.18 * R, 0, 0, stone);
  box(g, 0.10 * R, 0.28 * R, 0.10 * R, 0.18 * R, 0, 0, stone);
  box(g, 0.44 * R, 0.08 * R, 0.12 * R, 0, 0.28 * R, 0, stone);
  box(g, 0.36 * R, 0.06 * R, 0.08 * R, 0, 0.36 * R, 0, gold);
  for (const sx of [-0.14, 0.14]) {
    box(g, 0.06 * R, 0.14 * R, 0.08 * R, sx * R, 0.06 * R, 0.06 * R, gold);
  }
}

function palaceWeiyang(g: THREE.Group, red: THREE.Material, roof: THREE.Material, gold: THREE.Material): void {
  box(g, 0.48 * R, 0.08 * R, 0.28 * R, 0, 0, 0, red);
  box(g, 0.40 * R, 0.10 * R, 0.22 * R, 0, 0.08 * R, 0, roof);
  for (const sx of [-0.16, 0, 0.16]) {
    box(g, 0.05 * R, 0.16 * R, 0.05 * R, sx * R, 0.08 * R, 0.10 * R, red);
  }
  box(g, 0.08 * R, 0.06 * R, 0.08 * R, 0, 0.18 * R, 0, gold);
}

function rampGate(g: THREE.Group, earth: THREE.Material, stone: THREE.Material): void {
  box(g, 0.40 * R, 0.14 * R, 0.30 * R, 0, 0, -0.06 * R, earth);
  box(g, 0.12 * R, 0.18 * R, 0.08 * R, 0, 0.14 * R, 0.10 * R, stone);
  for (const sx of [-0.10, 0.10]) {
    box(g, 0.06 * R, 0.10 * R, 0.10 * R, sx * R, 0.06 * R, 0.14 * R, stone);
  }
}

function woodenIdol(g: THREE.Group, wood: THREE.Material, iron: THREE.Material): void {
  box(g, 0.12 * R, 0.06 * R, 0.12 * R, 0, 0, 0, wood);
  box(g, 0.14 * R, 0.34 * R, 0.10 * R, 0, 0.06 * R, 0, wood);
  box(g, 0.20 * R, 0.04 * R, 0.04 * R, 0, 0.28 * R, 0, iron);
  box(g, 0.04 * R, 0.04 * R, 0.18 * R, 0, 0.22 * R, 0, iron);
}

/** Roquepertuse — oppidum celtycki: wał, palisada, rondinys, totem nemetonu. */
function gallicOppidum(
  g: THREE.Group,
  earth: THREE.Material,
  wood: THREE.Material,
  thatch: THREE.Material,
  stone: THREE.Material,
): void {
  // Wał ziemny + kamienny pierścień (murus gallicus, uproszczony)
  cyl(g, 0.46 * R, 0.48 * R, 0.07 * R, 0, 0, 0, earth, 10);
  cyl(g, 0.42 * R, 0.44 * R, 0.05 * R, 0, 0.07 * R, 0, stone, 10);

  // Palisada drewniana (luka z przodu = brama)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    if (Math.abs(a - Math.PI / 2) < 0.32) continue;
    const px = Math.cos(a) * 0.44 * R;
    const pz = Math.sin(a) * 0.44 * R;
    box(g, 0.022 * R, 0.11 * R, 0.022 * R, px, 0.125 * R, pz, wood);
    cone(g, 0.026 * R, 0.035 * R, px, 0.185 * R, pz, wood, 4);
  }

  // Brama oppidum
  box(g, 0.05 * R, 0.13 * R, 0.05 * R, -0.08 * R, 0.065 * R, 0.43 * R, wood);
  box(g, 0.05 * R, 0.13 * R, 0.05 * R, 0.08 * R, 0.065 * R, 0.43 * R, wood);
  box(g, 0.20 * R, 0.035 * R, 0.05 * R, 0, 0.145 * R, 0.43 * R, wood);

  // Rondinys — okrągłe chaty ze strzechą
  const huts: [number, number][] = [[-0.14, -0.06], [0.15, -0.04], [-0.04, 0.14]];
  for (const [hx, hz] of huts) {
    cyl(g, 0.085 * R, 0.09 * R, 0.09 * R, hx * R, 0.12 * R, hz * R, wood, 10);
    cone(g, 0.105 * R, 0.11 * R, hx * R, 0.21 * R, hz * R, thatch, 10);
  }

  // Nemeton — totem w centrum (sanctuary Roquepertuse)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    box(
      g, 0.025 * R, 0.08 * R, 0.02 * R,
      Math.cos(a) * 0.07 * R, 0.12 * R, Math.sin(a) * 0.07 * R,
      stone,
    );
  }
  cyl(g, 0.028 * R, 0.032 * R, 0.16 * R, 0, 0.12 * R, 0, wood, 6);
  box(g, 0.055 * R, 0.045 * R, 0.045 * R, 0, 0.28 * R, 0, wood);
}

function ownerBanner(g: THREE.Group, ownerColor: number, ruin: boolean): void {
  const mat = m(ownerColor, ruin);
  box(g, 0.04 * R, 0.14 * R, 0.04 * R, 0.24 * R, 0.08 * R, 0, mat);
  box(g, 0.10 * R, 0.06 * R, 0.02 * R, 0.28 * R, 0.16 * R, 0, mat);
}

/** Buduje model cudu — rozpoznawalna sylwetka Roblox per id z wonders.json. */
export function buildWonderModel(wonderId: string, opts: WonderModelOptions = {}): THREE.Group {
  const ruin = opts.ruin ?? false;
  const g = new THREE.Group();
  const mats = {
    sand: m(0xd4b878, ruin),
    stone: m(0x9a9088, ruin),
    white: m(0xe8e4dc, ruin),
    gold: m(0xc8a040, ruin),
    brick: m(0xa06848, ruin),
    leaf: m(0x4a8a40, ruin),
    water: m(0x5aadbe, ruin),
    bronze: m(0xb88850, ruin),
    rock: m(0xc87868, ruin),
    cave: m(0x3a3028, ruin),
    wood: m(0x7a5838, ruin),
    thatch: m(0xb8a060, ruin),
    mud: m(0x8a7050, ruin),
    clay: m(0xb07050, ruin),
    earth: m(0x6a5038, ruin),
    red: m(0xa83838, ruin),
    roof: m(0x2a2828, ruin),
    wall: m(0x7a7870, ruin),
    dark: m(0x4a4038, ruin),
    iron: m(0x555558, ruin),
  };

  switch (wonderId) {
    case 'piramidy': egyptianPyramid(g, mats.sand, mats.gold); break;
    case 'wielka_stela': obelisk(g, mats.stone, mats.gold); break;
    case 'wiszace_ogrody': hangingGardens(g, mats.brick, mats.leaf, mats.water); break;
    case 'wyrocznia': oracleTemple(g, mats.stone, mats.gold); break;
    case 'roquepertuse': gallicOppidum(g, mats.earth, mats.wood, mats.thatch, mats.stone); break;
    case 'stupa_sanchi': stupa(g, mats.white, mats.gold); break;
    case 'petra': rockFacade(g, mats.rock, mats.cave); break;
    case 'hamonga': trilithon(g, mats.stone); break;
    case 'kolos': colossus(g, mats.bronze, mats.stone, mats.water, mats.gold); break;
    case 'osada_aschaffenburg': celticWalledSettlement(g, mats.earth, mats.wood, mats.thatch, mats.stone, mats.water); break;
    case 'ziggurat': ziggurat(g, mats.mud, mats.stone); break;
    case 'mundo_perdido': mayanPyramid(g, mats.stone, mats.gold); break;
    case 'terakotowa_armia': terracottaPit(g, mats.clay, mats.earth); break;
    case 'koloseum': colosseum(g, mats.stone, mats.sand, mats.dark); break;
    case 'dur_sharrukin': citadel(g, mats.wall, mats.mud); break;
    case 'brama_narodow': grandGate(g, mats.stone, mats.gold); break;
    case 'palac_weiyang': palaceWeiyang(g, mats.red, mats.roof, mats.gold); break;
    case 'yerkapi': rampGate(g, mats.earth, mats.stone); break;
    case 'posag_peruna': woodenIdol(g, mats.wood, mats.iron); break;
    default: {
      cyl(g, 0.20 * R, 0.22 * R, 0.20 * R, 0, 0, 0, mats.stone, 6);
      cone(g, 0.18 * R, 0.12 * R, 0, 0.20 * R, 0, mats.gold, 6);
      break;
    }
  }

  if (opts.ownerColor !== undefined) {
    ownerBanner(g, opts.ownerColor, ruin);
  }

  g.userData['mats'] = Object.values(mats);
  return g;
}

export const WONDER_MODEL_IDS = [
  'piramidy', 'wielka_stela', 'wiszace_ogrody', 'wyrocznia', 'roquepertuse',
  'stupa_sanchi', 'petra', 'hamonga', 'kolos', 'osada_aschaffenburg', 'ziggurat',
  'mundo_perdido', 'terakotowa_armia', 'koloseum', 'dur_sharrukin', 'brama_narodow',
  'palac_weiyang', 'yerkapi', 'posag_peruna',
] as const;
