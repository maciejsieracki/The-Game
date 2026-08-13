/**
 * robloxImprovements.ts — ulepszenia terenu w stylu RoboProBlocks.
 * Te same klucze co improvements.ts; klocki + flatShading, ale rozpoznawalna funkcja (droga=droga, farma=pole…).
 */
import * as THREE from 'three';
import type { ImprovementKey } from './improvements';
import { buildStyleTarasyTerrace, type QualityTier } from './mapRenderStyle';
import { placeLivestockPair } from './styleResources';
import { buildLama, buildZlozeOwce } from './pastwisko-modele'; // buildPastwiskoZwierzeta wycofany (model pokazowy — nieużywany)
import { buildTrzoda } from './swinia-trzoda';
import {
  buildFarma, buildKopalnia, buildKamieniolom, buildTartak, buildZagrodaDodatki,
  ULEPSZENIA_P2_LAYOUT,
} from './ulepszenia-modele-p2';
import {
  buildWyrab, buildObozLowiecki, buildGlinianka, buildWarzelniaSoli,
  buildLodzieRybackie, buildStadnina, ULEPSZENIA_P3A_LAYOUT,
} from './ulepszenia-modele-p3a';
import {
  buildIrygacja, buildPoleIrygowane, buildFort, buildPosterunek,
  buildDrogaNawierzchnia, buildDrogaBrukowanaNawierzchnia, ULEPSZENIA_P3B_LAYOUT,
} from './ulepszenia-modele-p3b';
import { buildKopalniaZlota } from './kopalnia-zlota-opus5';

function mat(c: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color: c, flatShading: true });
}

// GRAFIKA-3D: poziom jakości dekoracji (liczba koni w stadninie, gęstość zwierząt itp.).
// Ustawiany ze sceny (mapDetailQuality gracza); domyślnie 'high' (pełne sloty).
let _improvementDetailQuality: QualityTier = 'high';
export function setImprovementDetailQuality(q: QualityTier): void { _improvementDetailQuality = q; }

function box(w: number, h: number, d: number, c: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function addBox(g: THREE.Group, w: number, h: number, d: number, x: number, y: number, z: number, c: number): void {
  const m = box(w, h, d, c);
  m.position.set(x, y + h / 2, z);
  g.add(m);
}

function addCyl(g: THREE.Group, rt: number, rb: number, h: number, x: number, y: number, z: number, c: number, seg = 6): void {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c));
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  g.add(m);
}

/** Jasna paleta Roblox — kolory „mówią” co to jest. */
const C = {
  road: 0xc4a574,
  roadDash: 0xffee88,
  cobble: 0x8899aa,
  soil: 0x8b6914,
  crop: 0x7cfc00,
  cropDk: 0x44aa22,
  water: 0x00bfff,
  wood: 0xcd853f,
  woodDk: 0x8b4513,
  hide: 0xffa726,
  fire: 0xff5722,
  ore: 0xff8800,
  stone: 0xaabbcc,
  stoneDk: 0x667788,
  clay: 0xff8844,
  salt: 0xffffff,
  brine: 0xaaddff,
  leaf: 0x55dd55,
  grape: 0x9c27b0,
  fish: 0x80deea,
  tent: 0xff7043,
  flag: 0xffd54a,
} as const;

function rbxDroga(g: THREE.Group): void {
  addBox(g, 1.75, 0.07, 0.52, 0, 0, 0, C.road);
  addBox(g, 1.78, 0.02, 0.54, 0, 0.08, 0, 0x6b5344);
  for (let i = -3; i <= 3; i++) {
    addBox(g, 0.12, 0.035, 0.08, i * 0.22, 0.09, 0, C.roadDash);
  }
  for (const z of [-0.23, 0.23]) {
    for (let i = -4; i <= 4; i++) {
      addBox(g, 0.1, 0.05, 0.1, i * 0.2, 0.075, z, i % 2 ? C.cobble : 0x778899);
    }
  }
}

function rbxDrogaBrukowana(g: THREE.Group): void {
  addBox(g, 1.75, 0.08, 0.54, 0, 0, 0, C.cobble);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 8; col++) {
      addBox(g, 0.18, 0.04, 0.1, -0.63 + col * 0.18, 0.06, -0.15 + row * 0.1,
        (row + col) % 2 ? 0xc4b8a8 : 0x908878);
    }
  }
}

function rbxFarmHut(g: THREE.Group, x: number, z: number, scale = 1): void {
  const w = 0.14 * scale;
  const h = 0.11 * scale;
  addBox(g, w, h, w * 0.9, x, 0, z, C.woodDk);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.85, h * 0.95, 4), mat(0xff7043));
  roof.position.set(x, h + h * 0.42, z);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);
}

function rbxFarmMiniField(g: THREE.Group, cx: number, cz: number, w: number, d: number): void {
  addBox(g, w, 0.03, d, cx, 0, cz, C.soil);
  const cols = 3;
  const rows = 2;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const px = cx - w * 0.32 + col * (w * 0.32);
      const pz = cz - d * 0.28 + row * (d * 0.38);
      addBox(g, 0.05, 0.1, 0.05, px, 0.03, pz, (row + col) % 2 ? C.crop : C.cropDk);
      addBox(g, 0.035, 0.05, 0.035, px, 0.12, pz, C.cropDk);
    }
  }
}

/** Mała farma: domki + mini pole (lewa strona hexa — miejsce na hodowlę). */
function rbxFarmSettlement(g: THREE.Group, opts: { livestock?: 'bydlo' }): void {
  rbxFarmHut(g, -0.46, 0.22);
  rbxFarmHut(g, -0.46, -0.18, 0.82);
  addBox(g, 0.08, 0.06, 0.1, -0.46, 0.03, -0.02, C.wood);
  rbxFarmMiniField(g, -0.38, 0.02, 0.44, 0.4);
  if (opts.livestock === 'bydlo') {
    rbxLivestockBydlo(g, 0.4, 0.02, true);
  }
}

/** Krowy — wzór z mapy (złoże = ulepszenie bydło). */
function rbxLivestockBydlo(g: THREE.Group, cx: number, cz: number, _compact = false): void {
  placeLivestockPair(g, 'cow', cx, cz, 'roblox');
}

function rbxFarma(g: THREE.Group): void {
  rbxFarmSettlement(g, {});
}

function rbxPastwisko(g: THREE.Group): void {
  rbxFarmHut(g, -0.44, 0.18, 0.88);
  rbxFarmMiniField(g, -0.38, -0.06, 0.4, 0.34);
  rbxLivestockBydlo(g, 0.36, 0.02, true);
}

/** Solo bydło / złoże krowy — tylko zwierzęta (bez chaty i pola uprawnego). */
function rbxBydlo(g: THREE.Group): void {
  rbxLivestockBydlo(g, 0.02, 0, false);
}

function rbxLivestockOwce(g: THREE.Group, cx: number, cz: number, _compact = false): void {
  placeLivestockPair(g, 'sheep', cx, cz, 'roblox');
}

function rbxFarmBydloOwce(g: THREE.Group): void {
  rbxFarmSettlement(g, {});
  rbxLivestockBydlo(g, 0.44, 0.24, true);
  rbxLivestockOwce(g, 0.34, -0.34, true);
}

/** Bydło + owce bez farmy (podgląd / rzadkie złoża). */
function rbxBydloOwce(g: THREE.Group): void {
  rbxLivestockBydlo(g, 0.12, 0.08, false);
  rbxLivestockOwce(g, -0.12, -0.08, false);
}

/** Farma + owce (domki po lewej, owce po prawej). */
function rbxFarmOwce(g: THREE.Group): void {
  rbxFarmSettlement(g, {});
  rbxLivestockOwce(g, 0.44, 0.24, true);
}

/** Solo owce / złoże owiec — tylko zwierzęta. */
function rbxOwce(g: THREE.Group): void {
  rbxLivestockOwce(g, 0.02, 0, false);
}

function rbxKopalnia(g: THREE.Group): void {
  addCyl(g, 0.55, 0.72, 0.2, 0, 0.1, 0.1, C.stoneDk);
  addBox(g, 0.36, 0.28, 0.08, 0, 0.22, 0.38, C.wood);
  addBox(g, 0.24, 0.2, 0.06, 0, 0.18, 0.42, 0x1a1208);
  for (const [x, z] of [[-0.28, 0.2], [0.3, 0.08], [0.08, -0.22]] as const) {
    addBox(g, 0.12, 0.12, 0.12, x, 0.22, z, C.ore);
  }
  addBox(g, 0.22, 0.12, 0.16, 0.42, 0.12, -0.08, C.woodDk);
  for (const sx of [-1, 1]) {
    addCyl(g, 0.05, 0.05, 0.04, 0.42, 0.04, -0.08 + sx * 0.08, 0x222222, 8);
  }
}

function rbxKamieniolom(g: THREE.Group): void {
  addCyl(g, 0.62, 0.58, 0.06, 0, 0.03, 0, C.stoneDk, 8);
  let y = 0.06;
  for (let i = 0; i < 3; i++) {
    const s = 0.48 - i * 0.1;
    addBox(g, s, 0.1, s, -0.08 + i * 0.04, y, -0.04 + i * 0.04, i % 2 ? C.stone : 0xb0bec5);
    y += 0.1;
  }
  addBox(g, 0.18, 0.14, 0.18, 0.38, 0.1, 0.28, C.stone);
  addBox(g, 0.14, 0.1, 0.14, 0.42, 0.08, -0.12, C.stone);
}

function rbxObozLowiecki(g: THREE.Group): void {
  const tent = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.52, 4), mat(C.tent));
  tent.position.set(-0.12, 0.26, 0);
  tent.rotation.y = Math.PI / 4;
  tent.castShadow = true;
  g.add(tent);
  addBox(g, 0.04, 0.04, 0.42, 0.42, 0.34, 0, C.woodDk);
  for (const sx of [-1, 1]) {
    addCyl(g, 0.02, 0.025, 0.36, 0.42, 0.18, sx * 0.18, C.woodDk, 5);
  }
  addBox(g, 0.04, 0.2, 0.24, 0.42, 0.22, 0, C.hide);
  addBox(g, 0.1, 0.1, 0.1, -0.1, 0.08, 0.42, C.fire);
  addBox(g, 0.06, 0.14, 0.06, -0.1, 0.16, 0.42, 0xffab00);
}

function rbxWyrab(g: THREE.Group): void {
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.65, 6), mat(C.wood));
    log.rotation.x = Math.PI / 2;
    log.position.set(-0.18, 0.1 + (i % 2) * 0.14, -0.08 + i * 0.16);
    log.castShadow = true;
    g.add(log);
  }
  addCyl(g, 0.14, 0.15, 0.14, 0.36, 0.07, 0.26, C.woodDk, 8);
  addCyl(g, 0.014, 0.014, 0.32, 0.36, 0.2, 0.26, C.woodDk, 5);
  addBox(g, 0.12, 0.08, 0.03, 0.46, 0.32, 0.26, 0xb0bec5);
}

function rbxTartak(g: THREE.Group): void {
  addBox(g, 0.58, 0.1, 0.48, 0, 0.05, 0, C.woodDk);
  addBox(g, 0.38, 0.05, 0.03, 0, 0.14, 0, 0xeceff1);
  for (let i = 0; i < 2; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.52, 6), mat(C.wood));
    log.rotation.z = Math.PI / 2;
    log.position.set(-0.04, 0.12 + i * 0.14, -0.06 + i * 0.18);
    log.castShadow = true;
    g.add(log);
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.16, 4), mat(C.woodDk));
  roof.position.set(0.16, 0.26, 0);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);
}

function rbxIrygacjaLarge(g: THREE.Group, cornerHut: boolean): void {
  addBox(g, 1.42, 0.04, 1.22, 0, 0, 0, C.soil);
  for (const z of [-0.34, 0, 0.34]) {
    addBox(g, 1.36, 0.06, 0.12, 0, 0.04, z, C.water);
    addBox(g, 1.36, 0.07, 0.05, 0, 0.04, z + 0.1, C.woodDk);
    addBox(g, 1.36, 0.07, 0.05, 0, 0.04, z - 0.1, C.woodDk);
  }
  const rowZ = [-0.17, -0.51, 0.17, 0.51];
  for (let ri = 0; ri < rowZ.length; ri++) {
    const z = rowZ[ri]!;
    for (let j = 0; j < 7; j++) {
      const x = -0.54 + j * 0.18;
      addBox(g, 0.07, 0.13, 0.07, x, 0.05, z, ri % 2 ? C.crop : C.cropDk);
      addBox(g, 0.04, 0.06, 0.04, x + 0.04, 0.04, z + (j % 2 ? 0.04 : -0.04), ri % 2 ? C.cropDk : C.crop);
    }
  }
  if (cornerHut) {
    rbxFarmHut(g, -0.56, 0.48, 0.75);
  }
}

/** Farma + irygacja — mała farma (lewa) + duże pole irygowane (cały hex). */
function rbxFarmIrygacja(g: THREE.Group): void {
  rbxIrygacjaLarge(g, false);
  rbxFarmSettlement(g, {});
}

/** Solo irygacja — kanały i uprawy, bez zabudowy farmy. */
function rbxIrygacja(g: THREE.Group): void {
  rbxIrygacjaLarge(g, false);
}

function rbxPoleIrygowane(g: THREE.Group): void {
  rbxFarmIrygacja(g);
}

function rbxGlinianka(g: THREE.Group): void {
  addCyl(g, 0.58, 0.52, 0.08, 0, 0.04, 0, 0x6d4c2b, 10);
  addCyl(g, 0.42, 0.42, 0.03, 0, 0.08, 0, 0x7a5230, 10);
  for (const [x, z] of [[-0.32, 0.28], [0.38, 0.18], [0.18, -0.32]] as const) {
    addBox(g, 0.14, 0.1, 0.14, x, 0.08, z, C.clay);
  }
  for (const [x, z] of [[-0.08, 0.38], [0.14, 0.4]] as const) {
    addCyl(g, 0.06, 0.08, 0.14, x, 0.1, z, C.clay, 6);
  }
}

function rbxTarasy(g: THREE.Group): void {
  g.add(buildStyleTarasyTerrace('roblox', false, 0.88));
}

function rbxLodzie(g: THREE.Group): void {
  const hull = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.62), mat(C.wood));
  hull.position.set(0, 0.08, 0);
  hull.castShadow = true;
  g.add(hull);
  addCyl(g, 0.014, 0.014, 0.32, 0, 0.22, 0, C.woodDk, 5);
  addBox(g, 0.02, 0.18, 0.2, 0, 0.26, 0.04, 0xffffff);
  for (let i = 0; i < 4; i++) {
    addBox(g, 0.06, 0.04, 0.1, -0.28 + i * 0.18, 0.04, 0.34, C.fish);
  }
}

function rbxWarzelniaSoli(g: THREE.Group): void {
  for (const [gx, gz] of [[-0.34, -0.34], [0.34, -0.34], [-0.34, 0.34], [0.34, 0.34]] as const) {
    addBox(g, 0.48, 0.06, 0.48, gx, 0.03, gz, C.woodDk);
    addBox(g, 0.4, 0.03, 0.4, gx, 0.07, gz, C.brine);
    addBox(g, 0.34, 0.04, 0.34, gx, 0.09, gz, C.salt);
  }
  const mound = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.2, 4), mat(C.salt));
  mound.position.set(0, 0.12, 0);
  mound.rotation.y = Math.PI / 4;
  mound.castShadow = true;
  g.add(mound);
}

function rbxFort(g: THREE.Group, ownerCol: number): void {
  const inner = new THREE.Group();
  const S = 0.62;
  const h = 0.24;
  addBox(inner, S * 2.1, 0.06, S * 2.1, 0, 0.03, 0, C.stoneDk);
  const wall = (w: number, d: number, x: number, z: number) => addBox(inner, w, h, d, x, 0.06, z, C.stone);
  wall(S * 2, 0.08, 0, -S);
  wall(0.08, S * 2, -S, 0);
  wall(0.08, S * 2, S, 0);
  wall(S * 0.68, 0.08, -S * 0.64, S);
  wall(S * 0.68, 0.08, S * 0.64, S);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBox(inner, 0.22, 0.36, 0.22, sx * S, 0.12, sz * S, C.woodDk);
      const t = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.16, 4), mat(0xff7043));
      t.position.set(sx * S, 0.38, sz * S);
      t.rotation.y = Math.PI / 4;
      t.castShadow = true;
      inner.add(t);
    }
  }
  addCyl(inner, 0.014, 0.014, 0.36, 0, 0.22, 0, C.woodDk, 5);
  addBox(inner, 0.02, 0.1, 0.14, 0, 0.36, 0.08, ownerCol & 0xffffff);
  inner.scale.setScalar(1 / 3);
  g.add(inner);
}

function rbxPosterunek(g: THREE.Group, ownerCol: number): void {
  const Rr = 0.64;
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    if (Math.abs(a - Math.PI / 2) < 0.35) continue;
    const bx = Math.cos(a) * Rr;
    const bz = Math.sin(a) * Rr;
    addBox(g, 0.06, 0.24, 0.06, bx, 0.04, bz, C.woodDk);
    addBox(g, 0.08, 0.06, 0.08, bx, 0.28, bz, 0xff7043);
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addCyl(g, 0.028, 0.034, 0.44, sx * 0.14, 0.22, sz * 0.14, C.wood, 6);
    }
  }
  addBox(g, 0.42, 0.06, 0.42, 0, 0.46, 0, C.wood);
  addBox(g, 0.32, 0.2, 0.32, 0, 0.58, 0, C.hide);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.18, 4), mat(C.woodDk));
  roof.position.set(0, 0.76, 0);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);
  addCyl(g, 0.014, 0.014, 0.22, 0, 0.88, 0, C.woodDk, 5);
  addBox(g, 0.02, 0.08, 0.12, 0, 0.88, 0.08, ownerCol & 0xffffff);
}

const BUILDERS: Record<ImprovementKey, (g: THREE.Group, owner: number) => void> = {
  droga: g => { g.add(buildDrogaNawierzchnia()); },   // GRAFIKA-3D partia 3B
  droga_brukowana: g => { g.add(buildDrogaBrukowanaNawierzchnia()); },
  farma: g => { g.add(buildFarma({ wariant: 'solo' })); },   // GRAFIKA-3D partia 2
  bydlo: g => { g.add(buildTrzoda()); },   // TRZODA (krowa+świnia N-NE, środek wolny pod miasto) — Maciej 2026-07-09
  owce: g => { g.add(buildZlozeOwce()); },   // FIX GRAFIKA-TEREN-2: owce jak trzoda/złoże owiec (2 owce S-SW, środek wolny) — buildOwca z pastwisko-modele
  lama: g => { const l = buildLama(); l.position.set(0.63, 0, 0.04); g.add(l); },
  stadnina: g => { g.add(buildStadnina(1)); },   // Maciej 2026-07-09: zawsze 1 koń (dwa zajmowały prawie cały heks)
  kopalnia_zelaza: g => { const m = buildKopalnia(); m.rotation.y = ULEPSZENIA_P2_LAYOUT.kopalnia.budynek.rotY; g.add(m); },
  kamieniolom: g => { const m = buildKamieniolom(); m.rotation.y = ULEPSZENIA_P2_LAYOUT.kamieniolom.budynek.rotY; g.add(m); },
  oboz_lowiecki: g => { const m = buildObozLowiecki(); m.rotation.y = ULEPSZENIA_P3A_LAYOUT.obozLowiecki.budynek.rotY; g.add(m); },
  wyrab: g => { const m = buildWyrab(); m.rotation.y = ULEPSZENIA_P3A_LAYOUT.wyrab.budynek.rotY; g.add(m); },
  tartak: g => { const m = buildTartak(); m.rotation.y = ULEPSZENIA_P2_LAYOUT.tartak.budynek.rotY; g.add(m); },
  irygacja: g => { const m = buildIrygacja(); m.rotation.y = ULEPSZENIA_P3B_LAYOUT.irygacja.budynek.rotY; g.add(m); },
  pole_irygowane: g => { const m = buildPoleIrygowane(); m.rotation.y = ULEPSZENIA_P3B_LAYOUT.pole_irygowane.budynek.rotY; g.add(m); },
  glinianka: g => { const m = buildGlinianka(); m.rotation.y = ULEPSZENIA_P3A_LAYOUT.glinianka.budynek.rotY; g.add(m); },
  tarasy: g => rbxTarasy(g),
  lodzie_rybackie: g => { const m = buildLodzieRybackie(); m.rotation.y = ULEPSZENIA_P3A_LAYOUT.lodzieRybackie.budynek.rotY; g.add(m); },
  warzelnia_soli: g => { const m = buildWarzelniaSoli(); m.rotation.y = ULEPSZENIA_P3A_LAYOUT.warzelniaSoli.budynek.rotY; g.add(m); },
  fort: (g, o) => { const m = buildFort(o); m.rotation.y = ULEPSZENIA_P3B_LAYOUT.fort.budynek.rotY; g.add(m); },   // FIX GRAFIKA-TEREN-2: usunięto scale 1/3 (relikt sprzed sektorów — płaska plamka); net 0.15 jak posterunek
  posterunek: (g, o) => { const m = buildPosterunek(o); m.rotation.y = ULEPSZENIA_P3B_LAYOUT.posterunek.budynek.rotY; g.add(m); },
  pastwisko: g => {
    const f = buildFarma({ wariant: 'pastwisko' });
    f.rotation.y = ULEPSZENIA_P2_LAYOUT.farma.pastwisko.budynek.rotY;
    g.add(f, buildTrzoda(), buildZagrodaDodatki()); // wycofano buildPastwiskoZwierzeta (model pokazowy) → trzoda N-NE
  },
  kopalnia_miedzi: g => { const m = buildKopalnia(); m.rotation.y = ULEPSZENIA_P2_LAYOUT.kopalnia.budynek.rotY; g.add(m); },
  // WŁASNY model 3D (Opus 5, 2026-07-25) — koniec reużycia buildKopalnia(). Model jest już
  // zorientowany przodem do kamery (+Z), więc BEZ rotacji z ULEPSZENIA_P2_LAYOUT.
  kopalnia_zlota: g => { g.add(buildKopalniaZlota()); },
  // Kopalnia cyny (2026-08-13): TYMCZASOWE reużycie buildKopalnia() (jak kopalnia_miedzi
  // przed swoim dedykowanym modelu) — dedykowana bryła 3D to praca Opus 5 (CLAUDE.md),
  // poza zakresem tego zlecenia (Sonnet 5). / EN: TEMPORARY reuse of the generic mine model
  // — a dedicated 3D shape is Opus-5-reserved render work, out of scope here.
  kopalnia_cyny: g => { const m = buildKopalnia(); m.rotation.y = ULEPSZENIA_P2_LAYOUT.kopalnia.budynek.rotY; g.add(m); },
};

export function buildRobloxImprovement(key: ImprovementKey, ownerCol = 0xffd54a): THREE.Group {
  const g = new THREE.Group();
  const fn = BUILDERS[key];
  if (fn) fn(g, ownerCol);
  return g;
}

const FOOD_STACK_KEYS = new Set(['farma', 'irygacja', 'bydlo', 'owce']);

/** Składanie warstw żywności — farma+bydło / farma+irygacja / farma+bydło+owce (podgląd). */
export function buildRobloxFoodStack(keys: readonly string[]): THREE.Group | null {
  const n = keys.filter(k => k && k !== 'brak' && FOOD_STACK_KEYS.has(k));
  if (n.length === 0) return null;
  const hasF = n.includes('farma');
  const hasI = n.includes('irygacja');
  const hasB = n.includes('bydlo');
  const hasO = n.includes('owce');
  const g = new THREE.Group();
  if (hasF && hasB && hasO) {
    rbxFarmBydloOwce(g);
    return g;
  }
  if (hasF && hasI) {
    rbxFarmIrygacja(g);
    return g;
  }
  if (hasF && hasB) {
    rbxFarmSettlement(g, { livestock: 'bydlo' });
    return g;
  }
  if (hasF && hasO) {
    rbxFarmOwce(g);
    return g;
  }
  if (hasB && hasO) {
    rbxBydloOwce(g);
    return g;
  }
  if (hasF) {
    rbxFarmSettlement(g, {});
    return g;
  }
  if (hasI) {
    rbxIrygacja(g);
    return g;
  }
  if (hasB) {
    rbxBydlo(g);
    return g;
  }
  if (hasO) {
    rbxOwce(g);
    return g;
  }
  return null;
}
