/**
 * styleResources.ts — surowce mapy w stylu Roblox / Minecraft.
 * Zwierzęta: czytelna sylwetka z góry (gra) i z boku (podgląd).
 */
import * as THREE from 'three';
import { Nakladka } from '../types/hex';
import type { MapRenderStyle } from './mapRenderStyle';
import { buildResourceOverlay } from './resources';
import { buildZlozeKrowy, buildZlozeOwce } from './pastwisko-modele';
import { buildTrzoda } from './swinia-trzoda';
import { buildZlozeKonie } from './kon-nowy-model';
import {
  buildZlozeMiedz, buildZlozeZelazo, buildZlozeWegiel, buildZlozeSol, buildZlozeGlina,
} from './ulepszenia-modele-p3b';

const S = 2.05 / 3; // małe nakładki surowcowe (~1/3 poprzedniej skali)

function mat(c: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color: c, flatShading: true });
}

function box(g: THREE.Group, w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material): void {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  g.add(mesh);
}

/** Klocek ze środkiem w (cx,cy,cz) i obrotem (rx,ry,rz). */
function boxAt(g: THREE.Group, w: number, h: number, d: number, cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, m: THREE.Material): void {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(cx, cy, cz);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  g.add(mesh);
}

function leg(g: THREE.Group, x: number, z: number, h: number, m: THREE.Material): void {
  box(g, 0.022 * S, h, 0.022 * S, x, 0, z, m);
}

/** Koń — złoże mapy: głowa jednym blokiem, gruba szyja, pasek grzywy, długi ogon. */
function styledHorse(style: MapRenderStyle): THREE.Group {
  const g = new THREE.Group();
  if (style !== 'roblox') return horseLegacy(g, style);
  const s = S;
  const coat = mat(0xb8864a);
  const coatDk = mat(0x8b5a2b);
  const black = mat(0x141010);
  const hoof = mat(0x1a1410);

  const legH = 0.085 * s;
  const legW = 0.023 * s;
  for (const [lx, lz] of [[-0.052, 0.027], [-0.052, -0.027], [0.052, 0.027], [0.052, -0.027]] as const) {
    box(g, legW, legH, legW, lx * s, 0, lz * s, coatDk);
    box(g, legW * 1.1, 0.016 * s, legW * 1.1, lx * s, 0.008 * s, lz * s, hoof);
  }

  const bodyY = legH + 0.034 * s;
  const bodyH = 0.086 * s;
  box(g, 0.178 * s, bodyH, 0.09 * s, -0.012 * s, bodyY, 0, coat);
  box(g, 0.09 * s, 0.078 * s, 0.084 * s, 0.05 * s, bodyY + 0.006 * s, 0, coatDk);
  box(g, 0.084 * s, 0.072 * s, 0.086 * s, -0.074 * s, bodyY + 0.004 * s, 0, coatDk);

  const neckLenX = 0.074 * s;
  const neckH = 0.122 * s;
  const neckD = 0.054 * s;
  const neckX = 0.084 * s;
  const neckY = bodyY + 0.026 * s;
  box(g, neckLenX, neckH, neckD, neckX, neckY, 0, coat);

  const headLen = 0.112 * s;
  const headH = 0.056 * s;
  const headD = neckD;
  const neckFrontX = neckX + neckLenX * 0.5;
  const headX = neckFrontX + headLen * 0.5;
  const headY = neckY + neckH - headH * 0.62;
  box(g, headLen, headH, headD, headX, headY, 0, coat);

  const withersX = neckX - neckLenX * 0.42;
  const maneTopY = headY + headH - 0.006 * s;
  const maneBackZ = -neckD * 0.34;
  const maneStartX = headX - headLen * 0.08;
  const maneEndX = withersX;
  const maneLenX = maneStartX - maneEndX;
  const maneMidX = (maneStartX + maneEndX) * 0.5;
  box(g, maneLenX, 0.014 * s, 0.018 * s, maneMidX, maneTopY, maneBackZ, black);
  box(g, 0.016 * s, 0.028 * s, 0.012 * s, headX - headLen * 0.42, maneTopY - 0.008 * s, maneBackZ - 0.004 * s, black);

  const tailRootY = bodyY + bodyH * 0.42;
  const tailZ = 0.026 * s;
  box(g, 0.024 * s, 0.05 * s, 0.014 * s, -0.106 * s, tailRootY, tailZ, black);
  box(g, 0.02 * s, 0.068 * s, 0.012 * s, -0.13 * s, tailRootY - 0.026 * s, tailZ + 0.01 * s, black);
  box(g, 0.017 * s, 0.078 * s, 0.011 * s, -0.152 * s, tailRootY - 0.052 * s, tailZ + 0.018 * s, black);
  box(g, 0.014 * s, 0.072 * s, 0.01 * s, -0.172 * s, tailRootY - 0.078 * s, tailZ + 0.024 * s, black);
  box(g, 0.012 * s, 0.058 * s, 0.009 * s, -0.188 * s, tailRootY - 0.098 * s, tailZ + 0.028 * s, black);

  return g;
}

function horseLegacy(g: THREE.Group, style: MapRenderStyle): THREE.Group {
  const brown = mat(style === 'roblox' ? 0x8b5a2b : 0x6b4a2b);
  const dark = mat(0x3f2c1a);
  const hoof = mat(0x1a1410);
  const s = style === 'roblox' ? S : 1;
  for (const [lx, lz] of [[0.05, 0.03], [0.05, -0.03], [-0.07, 0.03], [-0.07, -0.03]] as const) {
    leg(g, lx * s, lz * s, 0.055 * s, dark);
    box(g, 0.028 * s, 0.018 * s, 0.028 * s, lx * s, 0.009 * s, lz * s, hoof);
  }
  box(g, 0.18 * s, 0.06 * s, 0.07 * s, 0, 0.078 * s, 0, brown);
  boxAt(g, 0.04 * s, 0.11 * s, 0.04 * s, 0.05 * s, 0.11 * s, 0, 0, 0.4, -0.35, brown);
  box(g, 0.05 * s, 0.05 * s, 0.06 * s, 0.12 * s, 0.14 * s, 0, brown);
  box(g, 0.035 * s, 0.035 * s, 0.09 * s, 0.19 * s, 0.125 * s, 0, brown);
  return g;
}

/** Owca — puszysta biała kula + czarna głowa z boku. */
function styledSheep(style: MapRenderStyle): THREE.Group {
  const g = new THREE.Group();
  const wool = mat(style === 'roblox' ? 0xf5f5f5 : 0xefe9df);
  const dark = mat(0x2a2420);
  const s = style === 'roblox' ? S : 1;
  if (style === 'roblox') {
    leg(g, -0.04 * s, 0.022 * s, 0.04 * s, dark);
    leg(g, -0.04 * s, -0.022 * s, 0.04 * s, dark);
    leg(g, 0.04 * s, 0.022 * s, 0.04 * s, dark);
    leg(g, 0.04 * s, -0.022 * s, 0.04 * s, dark);
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09 * s, 0), wool);
    body.position.set(0, 0.1 * s, 0);
    body.scale.set(1.35, 1.0, 1.15);
    body.castShadow = true;
    g.add(body);
    const puff1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06 * s, 0), wool);
    puff1.position.set(0.03 * s, 0.12 * s, 0.04 * s);
    puff1.castShadow = true;
    g.add(puff1);
    const puff2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055 * s, 0), wool);
    puff2.position.set(-0.025 * s, 0.11 * s, -0.035 * s);
    g.add(puff2);
    box(g, 0.045 * s, 0.04 * s, 0.04 * s, 0.1 * s, 0.1 * s, 0, dark);
    box(g, 0.02 * s, 0.018 * s, 0.015 * s, 0.12 * s, 0.1 * s, 0.012 * s, dark);
    box(g, 0.008 * s, 0.008 * s, 0.006 * s, 0.125 * s, 0.108 * s, 0.018 * s, mat(0xffaaaa));
  } else {
    leg(g, -0.035, 0.02, 0.035, dark);
    leg(g, -0.035, -0.02, 0.035, dark);
    leg(g, 0.035, 0.02, 0.035, dark);
    leg(g, 0.035, -0.02, 0.035, dark);
    box(g, 0.11, 0.08, 0.08, 0, 0.075, 0, wool);
    box(g, 0.03, 0.03, 0.028, 0.07, 0.08, 0, dark);
  }
  return g;
}

/** Owca — ten sam wzór co nakładka złoża owiec na mapie (Roblox/Minecraft). */
export function buildStyledSheep(style: MapRenderStyle = 'roblox'): THREE.Group {
  return styledSheep(style);
}

/** Krowa — ten sam wzór co nakładka złoża bydła na mapie (Roblox/Minecraft). */
export function buildStyledCow(style: MapRenderStyle = 'roblox'): THREE.Group {
  return styledCow(style);
}

/** Skala zewnętrzna — identyczna solo i w parze na heksie. */
export const LIVESTOCK_FIGURE_SCALE = 1.0;

export function placeLivestockFigure(
  g: THREE.Group,
  kind: 'cow' | 'sheep',
  x: number,
  z: number,
  rotY: number,
  style: MapRenderStyle,
  scale = LIVESTOCK_FIGURE_SCALE,
): void {
  const fig = kind === 'cow' ? buildStyledCow(style) : buildStyledSheep(style);
  fig.scale.setScalar(scale);
  fig.rotation.y = rotY;
  fig.position.set(x, 0, z);
  g.add(fig);
}

/** Para zwierząt — ta sama skala co pojedynczy model. */
export function placeLivestockPair(
  g: THREE.Group,
  kind: 'cow' | 'sheep',
  cx: number,
  cz: number,
  style: MapRenderStyle,
): void {
  placeLivestockFigure(g, kind, cx, cz, 0.15, style, LIVESTOCK_FIGURE_SCALE);
  placeLivestockFigure(g, kind, cx + 0.11, cz - 0.1, -0.35, style, LIVESTOCK_FIGURE_SCALE);
}

/** Krowa — masywny tułów, plamy, wyraźne rogi, morda. */
function styledCow(style: MapRenderStyle): THREE.Group {
  const g = new THREE.Group();
  const brown = mat(0x5c4030);
  const white = mat(0xf0ebe3);
  const dark = mat(0x1e1814);
  const hornCol = mat(0xf5f0d8);
  const hornTip = mat(0xddd8c0);
  const pink = mat(0xffaaaa);
  const s = style === 'roblox' ? S : 1;
  const legH = style === 'roblox' ? 0.085 * s : 0.05 * s;
  leg(g, -0.055 * s, 0.028 * s, legH, dark);
  leg(g, -0.055 * s, -0.028 * s, legH, dark);
  leg(g, 0.055 * s, 0.028 * s, legH, dark);
  leg(g, 0.055 * s, -0.028 * s, legH, dark);
  const bodyY = legH + 0.035 * s;
  box(g, 0.2 * s, 0.1 * s, 0.11 * s, 0, bodyY, 0, brown);
  box(g, 0.09 * s, 0.095 * s, 0.1 * s, 0.045 * s, bodyY + 0.005 * s, 0.01 * s, white);
  box(g, 0.065 * s, 0.075 * s, 0.065 * s, -0.055 * s, bodyY, -0.025 * s, white);
  // Głowa — szeroka, krótsza niż u konia
  box(g, 0.075 * s, 0.065 * s, 0.075 * s, 0.13 * s, bodyY + 0.02 * s, 0, brown);
  box(g, 0.055 * s, 0.048 * s, 0.055 * s, 0.175 * s, bodyY + 0.015 * s, 0, brown);
  box(g, 0.04 * s, 0.032 * s, 0.04 * s, 0.2 * s, bodyY + 0.012 * s, 0, dark);
  box(g, 0.025 * s, 0.02 * s, 0.015 * s, 0.215 * s, bodyY + 0.01 * s, 0, pink);
  if (style === 'roblox') {
    // Rogi — duże, wygięte na boki (czytelne z góry i z boku)
    for (const side of [-1, 1] as const) {
      const hornBase = new THREE.Mesh(new THREE.CylinderGeometry(0.016 * s, 0.022 * s, 0.055 * s, 5), hornCol);
      hornBase.position.set(0.155 * s, bodyY + 0.075 * s, side * 0.038 * s);
      hornBase.rotation.set(side * 0.55, 0.1, side * 0.35);
      hornBase.castShadow = true;
      g.add(hornBase);
      const hornTipMesh = new THREE.Mesh(new THREE.ConeGeometry(0.014 * s, 0.045 * s, 5), hornTip);
      hornTipMesh.position.set(0.148 * s, bodyY + 0.11 * s, side * 0.055 * s);
      hornTipMesh.rotation.set(side * 0.7, 0.15, side * 0.4);
      hornTipMesh.castShadow = true;
      g.add(hornTipMesh);
    }
    box(g, 0.045 * s, 0.038 * s, 0.032 * s, -0.025 * s, bodyY - 0.01 * s, 0, pink);
  } else {
    for (const sz of [0.022 * s, -0.022 * s]) {
      const h = new THREE.Mesh(new THREE.ConeGeometry(0.012 * s, 0.03 * s, 4), hornCol);
      h.position.set(0.12 * s, bodyY + 0.055 * s, sz);
      h.castShadow = true;
      g.add(h);
    }
  }
  return g;
}

/** Lama — wysoka szyja w pionie, mała głowa, długie uszy. */
function styledLlama(style: MapRenderStyle): THREE.Group {
  const g = new THREE.Group();
  const tan = mat(style === 'roblox' ? 0xffcc88 : 0xc9a877);
  const dark = mat(0x5a4430);
  const s = style === 'roblox' ? S : 1;
  leg(g, -0.04 * s, 0.022 * s, 0.075 * s, dark);
  leg(g, -0.04 * s, -0.022 * s, 0.075 * s, dark);
  leg(g, 0.04 * s, 0.022 * s, 0.075 * s, dark);
  leg(g, 0.04 * s, -0.022 * s, 0.075 * s, dark);
  box(g, 0.11 * s, 0.065 * s, 0.07 * s, 0, 0.095 * s, 0, tan);
  box(g, 0.04 * s, 0.14 * s, 0.04 * s, 0.02 * s, 0.155 * s, 0, tan);
  box(g, 0.05 * s, 0.055 * s, 0.04 * s, 0.04 * s, 0.235 * s, 0, tan);
  box(g, 0.035 * s, 0.03 * s, 0.03 * s, 0.055 * s, 0.265 * s, 0, tan);
  if (style === 'roblox') {
    box(g, 0.012 * s, 0.055 * s, 0.008 * s, 0.05 * s, 0.295 * s, 0.014 * s, tan);
    box(g, 0.012 * s, 0.055 * s, 0.008 * s, 0.05 * s, 0.295 * s, -0.014 * s, tan);
    box(g, 0.018 * s, 0.012 * s, 0.012 * s, 0.055 * s, 0.278 * s, 0.018 * s, dark);
    box(g, 0.018 * s, 0.012 * s, 0.012 * s, 0.055 * s, 0.278 * s, -0.018 * s, dark);
  }
  return g;
}

/** Glina — stos dzbanów i bryły gliny. */
function styledClay(style: MapRenderStyle): THREE.Group {
  const g = new THREE.Group();
  const clay = mat(style === 'roblox' ? 0xff8844 : 0xb5774a);
  const clayDk = mat(0xcc6633);
  const wet = mat(0xdd5522);
  const s = style === 'roblox' ? S : 1;
  if (style === 'roblox') {
    const pots: Array<[number, number, number]> = [[0, 0, 1.0], [0.08 * s, 0.045 * s, 0.8], [-0.07 * s, 0.05 * s, 0.72]];
    for (const [px, pz, sc] of pots) {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038 * s * sc, 0.028 * s * sc, 0.065 * s * sc, 8),
        clay,
      );
      pot.position.set(px, 0.032 * s * sc, pz);
      pot.castShadow = true;
      g.add(pot);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.035 * s * sc, 0.007 * s * sc, 4, 8), clayDk);
      rim.position.set(px, 0.065 * s * sc, pz);
      rim.rotation.x = Math.PI / 2;
      g.add(rim);
    }
    box(g, 0.07 * s, 0.025 * s, 0.05 * s, -0.04 * s, 0, 0.03 * s, wet);
  } else {
    for (const [px, pz, sc] of [[0, 0, 1.0], [0.05, 0.03, 0.7], [-0.04, 0.04, 0.6]] as const) {
      box(g, 0.04 * sc, 0.05 * sc, 0.04 * sc, px, 0, pz, clay);
    }
  }
  return g;
}

/** Ruda miedzi (góry) — skały z miedzianymi żyłami. */
function styledCopperOre(style: MapRenderStyle): THREE.Group {
  const g = new THREE.Group();
  const rock = mat(style === 'roblox' ? 0x667788 : 0x6e6e76);
  const ore = mat(0xb87333);
  const oreHi = mat(0xdaa520);
  const s = style === 'roblox' ? S : 1;
  const spots: Array<[number, number, number]> = [[0, 0, 1.0], [0.08 * s, 0.035 * s, 0.78], [-0.06 * s, 0.05 * s, 0.7]];
  for (const [px, pz, sc] of spots) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.05 * s * sc, 0), rock);
    r.position.set(px, 0.045 * s * sc, pz);
    r.rotation.set(px * 2, pz * 3, sc);
    r.castShadow = true;
    g.add(r);
    box(g, 0.018 * s * sc, 0.018 * s * sc, 0.018 * s * sc, px + 0.012, 0.055 * s * sc, pz, ore);
    box(g, 0.012 * s * sc, 0.012 * s * sc, 0.012 * s * sc, px - 0.008, 0.048 * s * sc, pz + 0.01, oreHi);
  }
  return g;
}

/** Ruda żelaza (góry) — ciemne skały z szarymi żyłami. */
function styledIronOre(style: MapRenderStyle): THREE.Group {
  const g = new THREE.Group();
  const rock = mat(0x555a60);
  const ore = mat(0x8a8a92);
  const oreHi = mat(0xb0b0b8);
  const s = style === 'roblox' ? S : 1;
  const spots: Array<[number, number, number]> = [[0, 0, 1.0], [0.07 * s, 0.04 * s, 0.8], [-0.05 * s, 0.03 * s, 0.72]];
  for (const [px, pz, sc] of spots) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.05 * s * sc, 0), rock);
    r.position.set(px, 0.045 * s * sc, pz);
    r.rotation.set(px * 2, pz * 3, sc);
    r.castShadow = true;
    g.add(r);
    box(g, 0.02 * s * sc, 0.02 * s * sc, 0.02 * s * sc, px + 0.01, 0.05 * s * sc, pz, ore);
    box(g, 0.014 * s * sc, 0.014 * s * sc, 0.014 * s * sc, px - 0.012, 0.042 * s * sc, pz, oreHi);
  }
  return g;
}

/** Ruda — sterta skał ze złotymi żyłami (legacy Nakladka.ZlozeRudy). */
function styledOre(style: MapRenderStyle): THREE.Group {
  const g = new THREE.Group();
  const rock = mat(style === 'roblox' ? 0x667788 : 0x6e6e76);
  const rockDk = mat(0x556066);
  const ore = mat(0xffdd00);
  const oreHi = mat(0xffee66);
  const s = style === 'roblox' ? S : 1;
  const spots: Array<[number, number, number]> = [[0, 0, 1.0], [0.08 * s, 0.035 * s, 0.78], [-0.06 * s, 0.05 * s, 0.7]];
  for (const [px, pz, sc] of spots) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.05 * s * sc, 0), rock);
    r.position.set(px, 0.045 * s * sc, pz);
    r.rotation.set(px * 2, pz * 3, sc);
    r.castShadow = true;
    g.add(r);
    if (style === 'roblox') {
      box(g, 0.028 * s * sc, 0.02 * s * sc, 0.022 * s * sc, px + 0.02 * s, 0.055 * s * sc, pz, rockDk);
      box(g, 0.024 * s * sc, 0.024 * s * sc, 0.024 * s * sc, px + 0.015 * s, 0.07 * s * sc, pz + 0.01 * s, ore);
      box(g, 0.014 * s * sc, 0.014 * s * sc, 0.014 * s * sc, px - 0.01 * s, 0.06 * s * sc, pz - 0.008 * s, oreHi);
    } else {
      box(g, 0.015 * s * sc, 0.015 * s * sc, 0.015 * s * sc, px + 0.012, 0.045 * s * sc, pz, ore);
    }
  }
  return g;
}

/** Węgiel (góry) — ciemne bryły. */
function styledCoal(style: MapRenderStyle): THREE.Group {
  const g = new THREE.Group();
  const coal = mat(0x2a2a2a);
  const coalHi = mat(0x3d3d3d);
  const s = S;
  const spots: Array<[number, number, number]> = [[0, 0, 1.0], [0.06 * s, 0.03 * s, 0.85], [-0.05 * s, 0.04 * s, 0.75]];
  for (const [px, pz, sc] of spots) {
    box(g, 0.04 * s * sc, 0.028 * s * sc, 0.035 * s * sc, px, 0, pz, coal);
    box(g, 0.022 * s * sc, 0.018 * s * sc, 0.02 * s * sc, px + 0.015 * s, 0.022 * s * sc, pz, coalHi);
  }
  return g;
}

/** Sól (wybrzeże) — białe kryształki. */
function styledSalt(style: MapRenderStyle): THREE.Group {
  const g = new THREE.Group();
  const salt = mat(0xf5f8ff);
  const saltDk = mat(0xd8e4f0);
  const s = S;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const px = Math.cos(a) * 0.04 * s;
    const pz = Math.sin(a) * 0.04 * s;
    box(g, 0.014 * s, 0.032 * s, 0.014 * s, px, 0, pz, i % 2 === 0 ? salt : saltDk);
  }
  box(g, 0.025 * s, 0.012 * s, 0.02 * s, 0, 0.018 * s, 0, saltDk);
  return g;
}

export function buildStyledResourceOverlay(nakladka: Nakladka, style: MapRenderStyle, zloze?: string): THREE.Group | null {
  if (style === 'civ') return buildResourceOverlay(nakladka);
  let g: THREE.Group | null = null;
  switch (nakladka) {
    case Nakladka.ZlozeKonia:
      // GRAFIKA-3D partia 1 (item 2): 2 konie BEZ jeźdźca w slotach obrzeża, środek wolny
      g = style === 'roblox' ? buildZlozeKonie() : styledHorse(style);
      if (g) g.userData.depositDisplayScale = 2; // Maciej 2026-07-29: ×2 vs inne złoża (compactDepositAtEdge)
      break;
    case Nakladka.ZlozeOwiec:
    case Nakladka.ZlozeBydla:
      // GRAFIKA-3D partia 1: surowe złoże = zwierzęta danego typu w slotach layoutu (środek wolny pod ulepszenie)
      if (style === 'roblox') {
        // ZlozeBydla = złoże TRZODY (krowa+świnia N-NE); ZlozeOwiec = owce. Środek wolny pod ulepszenie/miasto.
        g = nakladka === Nakladka.ZlozeBydla ? buildTrzoda() : buildZlozeOwce();
      } else {
        g = nakladka === Nakladka.ZlozeBydla ? styledCow(style) : styledSheep(style);
      }
      break;
    case Nakladka.ZlozeLamy: g = styledLlama(style); break;
    case Nakladka.ZlozeGliny: g = style === 'roblox' ? buildZlozeGlina() : styledClay(style); break;
    case Nakladka.ZlozeRudy: g = styledOre(style); break;
    default: break;
  }
  if (!g && zloze) {
    switch (zloze) {
      case 'miedz': g = style === 'roblox' ? buildZlozeMiedz() : styledCopperOre(style); break;
      case 'zelazo': g = style === 'roblox' ? buildZlozeZelazo() : styledIronOre(style); break;
      case 'wegiel': g = style === 'roblox' ? buildZlozeWegiel() : styledCoal(style); break;
      case 'sol': g = style === 'roblox' ? buildZlozeSol() : styledSalt(style); break;
    }
  }
  return g;
}
