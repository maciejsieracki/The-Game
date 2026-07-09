/**
 * improvements.ts (Grupa A / MAPA — render) — wyglad ULEPSZEN TERENU na heksie.
 * buildImprovement(key, ownerCol) -> THREE.Group osadzony na WIERZCHU heksa (y=0 = gora kafla).
 * KLUCZE zgodne z gra/data/terrain-improvements.json (silnik mapuje stan heksu -> model).
 * Render-only; bonusy/koszt/epoka(dane) = MIASTO. 14 pozycji.
 */
import * as THREE from 'three';
import { GAME_MAP_RENDER_STYLE, type MapRenderStyle, buildStyleTarasyTerrace } from './mapRenderStyle';
import { buildRobloxImprovement, buildRobloxFoodStack } from './robloxImprovements';
import { placeLivestockPair } from './styleResources';

export type ImprovementKey =
  | 'farma' | 'bydlo' | 'owce' | 'lama' | 'kopalnia' | 'kamieniolom' | 'oboz_lowiecki' | 'wyrab' | 'tartak'
  | 'lodzie_rybackie' | 'droga' | 'droga_brukowana' | 'posterunek' | 'stadnina' | 'pastwisko' | 'kopalnia_miedzi'
  | 'irygacja' | 'pole_irygowane' | 'glinianka' | 'warzelnia_soli' | 'tarasy' | 'fort';

export const IMPROVEMENTS: { key: ImprovementKey; label: string; epoka: number }[] = [
  { key: 'farma', label: 'Farma', epoka: 1 },
  // Ulepszenie ≠ surowiec (Maciej 2026-07-09): to STRUKTURY budowane na surowcu-zwierzęciu
  // (jak stadnina na koniu). Surowce (złoża) zostają nazwami zwierząt: Trzoda / Owce / Lama.
  { key: 'bydlo', label: 'Pastwisko', epoka: 1 },      // buduje się na złożu Trzody (krowa/świnia)
  { key: 'owce', label: 'Owczarnia', epoka: 1 },       // buduje się na złożu Owiec
  { key: 'lama', label: 'Zagroda lam', epoka: 1 },     // buduje się na złożu Lam
  { key: 'stadnina', label: 'Stadnina', epoka: 2 },
  { key: 'kopalnia', label: 'Kopalnia żelaza', epoka: 1 }, { key: 'kamieniolom', label: 'Kamieniołom', epoka: 1 },
  { key: 'kopalnia_miedzi', label: 'Kopalnia miedzi', epoka: 2 },
  { key: 'oboz_lowiecki', label: 'Obóz łowiecki', epoka: 1 }, { key: 'wyrab', label: 'Wyrąb', epoka: 1 },
  { key: 'tartak', label: 'Tartak', epoka: 1 },
  { key: 'lodzie_rybackie', label: 'Łodzie rybackie', epoka: 1 }, { key: 'droga', label: 'Droga', epoka: 1 },
  { key: 'droga_brukowana', label: 'Droga brukowana', epoka: 3 },
  { key: 'posterunek', label: 'Posterunek (Strażnica)', epoka: 2 },
  { key: 'irygacja', label: 'Irygacja', epoka: 2 },   { key: 'glinianka', label: 'Glinianka', epoka: 2 },
  { key: 'warzelnia_soli', label: 'Warzelnia soli', epoka: 2 },
  { key: 'tarasy', label: 'Tarasy', epoka: 2 }, { key: 'fort', label: 'Fort', epoka: 3 },
];

const M = (c: number) => new THREE.MeshLambertMaterial({ color: c });
const COL = { dirt: 0x8a6a45, dirtDk: 0x6e5436, water: 0x4a93c4, crop: 0x9bbf3f, cropDk: 0x6f9a2c,
  wood: 0x6b4f2a, woodDk: 0x4f3a1e, stone: 0x9a8c70, stoneDk: 0x77694f, ore: 0x6e6e76, clay: 0xb5774a,
  hide: 0xb89a5e, rock: 0x8a8076, leaf: 0x4f7d34, white: 0xefe9df, fire: 0xe5722b, grape: 0x6a3d7a, salt: 0xf2efe6 };
const box = (w: number, h: number, d: number, c: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c)); m.castShadow = true; m.receiveShadow = true; return m; };
const cyl = (rt: number, rb: number, h: number, c: number, seg = 8) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), M(c)); m.castShadow = true; return m; };
const cone = (r: number, h: number, c: number, seg = 8) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), M(c)); m.castShadow = true; return m; };
const sph = (r: number, c: number) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), M(c)); m.castShadow = true; return m; };

function droga(): THREE.Group {
  const g = new THREE.Group();
  const band = box(1.78, 0.03, 0.42, 0xb09766); band.position.y = 0.015; g.add(band);
  for (const z of [-0.12, 0.12]) { const rut = box(1.78, 0.012, 0.04, COL.dirtDk); rut.position.set(0, 0.032, z); g.add(rut); }
  for (let i = 0; i < 9; i++) { const s = box(0.09, 0.02, 0.09, i % 2 ? COL.stone : COL.stoneDk); s.position.set(-0.8 + i * 0.2, 0.03, (i % 2 ? 0.1 : -0.1)); g.add(s); }
  return g;
}
function drogaBrukowana(): THREE.Group {
  const g = new THREE.Group();
  const band = box(1.78, 0.04, 0.48, 0x9a9080); band.position.y = 0.02; g.add(band);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 7; col++) {
      const brick = box(0.22, 0.025, 0.12, (row + col) % 2 ? 0xc4b8a8 : 0xa89888);
      brick.position.set(-0.66 + col * 0.22, 0.045, -0.12 + row * 0.12);
      g.add(brick);
    }
  }
  return g;
}
function addIrygacjaField(g: THREE.Group): void {
  const soil = box(1.42, 0.03, 1.22, COL.dirt);
  soil.position.y = 0.015;
  g.add(soil);
  const kanalZ = [-0.34, 0, 0.34];
  for (const z of kanalZ) {
    const ch = box(1.36, 0.025, 0.1, COL.water);
    ch.position.set(0, 0.03, z);
    g.add(ch);
    const bankN = box(1.36, 0.04, 0.05, COL.dirtDk);
    bankN.position.set(0, 0.025, z + 0.08);
    g.add(bankN);
    const bankS = box(1.36, 0.04, 0.05, COL.dirtDk);
    bankS.position.set(0, 0.025, z - 0.08);
    g.add(bankS);
  }
  const rowZ = [-0.17, -0.51, 0.17, 0.51];
  for (let ri = 0; ri < rowZ.length; ri++) {
    const z = rowZ[ri]!;
    for (let j = 0; j < 7; j++) {
      const t = cone(0.035, 0.09, ri % 2 ? COL.crop : COL.cropDk, 5);
      t.position.set(-0.54 + j * 0.18, 0.06, z);
      g.add(t);
    }
  }
}

function irygacja(): THREE.Group {
  const g = new THREE.Group();
  addIrygacjaField(g);
  return g;
}

function poleIrygowane(): THREE.Group {
  const g = new THREE.Group();
  addIrygacjaField(g);
  farmHut(g, -0.46, 0.22);
  farmHut(g, -0.46, -0.18, 0.82);
  const wood = box(0.08, 0.06, 0.1, COL.woodDk);
  wood.position.set(-0.46, 0.03, -0.02);
  g.add(wood);
  farmMiniField(g, -0.38, 0.02, 0.44, 0.4);
  return g;
}
function farmHut(g: THREE.Group, x: number, z: number, scale = 1): void {
  const w = 0.14 * scale;
  const h = 0.11 * scale;
  const walls = box(w, h, w * 0.9, COL.woodDk);
  walls.position.set(x, h / 2, z);
  g.add(walls);
  const roof = cone(w * 0.85, h * 0.95, COL.woodDk, 4);
  roof.position.set(x, h + h * 0.35, z);
  g.add(roof);
}

function farmMiniField(g: THREE.Group, cx: number, cz: number, w: number, d: number): void {
  const soil = box(w, 0.03, d, COL.dirt);
  soil.position.set(cx, 0.015, cz);
  g.add(soil);
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const px = cx - w * 0.28 + col * (w * 0.28);
      const pz = cz - d * 0.22 + row * (d * 0.35);
      const t = cone(0.03, 0.08, (row + col) % 2 ? COL.crop : COL.cropDk, 5);
      t.position.set(px, 0.05, pz);
      g.add(t);
    }
  }
}

function farma(): THREE.Group {
  const g = new THREE.Group();
  farmHut(g, -0.46, 0.22);
  farmHut(g, -0.46, -0.18, 0.82);
  farmMiniField(g, -0.38, 0.02, 0.44, 0.4);
  return g;
}

function livestockBydlo(g: THREE.Group, cx: number, cz: number, _compact = false): void {
  placeLivestockPair(g, 'cow', cx, cz, 'minecraft');
}

function farmWithBydlo(): THREE.Group {
  const g = farma();
  livestockBydlo(g, 0.4, 0.02, true);
  return g;
}

function bydlo(): THREE.Group {
  const g = new THREE.Group();
  livestockBydlo(g, 0, 0, false);
  return g;
}
function owce(): THREE.Group {
  const g = new THREE.Group();
  placeLivestockPair(g, 'sheep', 0, 0, 'minecraft');
  return g;
}
function lama(): THREE.Group {
  const g = new THREE.Group();
  const ll = (x: number, z: number) => {
    const body = box(0.12, 0.12, 0.07, 0xc4a574);
    body.position.set(x, 0.1, z);
    g.add(body);
    const neck = cyl(0.028, 0.034, 0.12, 0xc4a574, 6);
    neck.position.set(x + 0.05, 0.18, z);
    g.add(neck);
    const head = box(0.05, 0.04, 0.04, 0xb8956a);
    head.position.set(x + 0.09, 0.24, z);
    g.add(head);
  };
  ll(0.26, 0.02);
  ll(0.38, -0.14);
  return g;
}
function pastwisko(): THREE.Group { return bydlo(); }
function kopalnia(): THREE.Group {
  const g = new THREE.Group();
  const mound = cyl(0.5, 0.7, 0.18, COL.dirtDk, 7); mound.position.y = 0.09; g.add(mound);
  const frame = box(0.34, 0.26, 0.06, COL.wood); frame.position.set(0, 0.21, 0.34); g.add(frame);
  const adit = box(0.22, 0.18, 0.05, 0x1c140c); adit.position.set(0, 0.17, 0.37); g.add(adit);
  for (const t of [[-0.3, 0.18], [0.32, 0.1], [0.1, -0.2]] as const) { const r = sph(0.08, COL.ore); r.position.set(t[0], 0.2, t[1]); g.add(r); }
  const cart = box(0.2, 0.1, 0.14, COL.woodDk); cart.position.set(0.4, 0.12, -0.05); g.add(cart);
  for (const sx of [-1, 1]) { const w = cyl(0.05, 0.05, 0.03, 0x222222, 8); w.rotation.z = Math.PI / 2; w.position.set(0.4, 0.06, -0.05 + sx * 0.08); g.add(w); }
  return g;
}
function glinianka(): THREE.Group {
  const g = new THREE.Group();
  const pit = cyl(0.55, 0.5, 0.06, 0x6e4a2b, 12); pit.position.y = 0.03; g.add(pit);
  const water = cyl(0.4, 0.4, 0.02, 0x7a5a3a, 12); water.position.y = 0.06; g.add(water);
  for (const t of [[-0.35, 0.3], [0.4, 0.2], [0.2, -0.35]] as const) { const m = sph(0.12, COL.clay); m.scale.y = 0.7; m.position.set(t[0], 0.07, t[1]); g.add(m); }
  for (const t of [[-0.1, 0.4], [0.15, 0.42]] as const) { const pot = cyl(0.05, 0.07, 0.12, COL.clay, 8); pot.position.set(t[0], 0.09, t[1]); g.add(pot); }
  return g;
}
function kamieniolom(): THREE.Group {
  const g = new THREE.Group();
  const pit = cyl(0.6, 0.55, 0.05, COL.stoneDk, 10); pit.position.y = 0.025; g.add(pit);
  let y = 0.05; for (let i = 0; i < 3; i++) { const b = box(0.5 - i * 0.1, 0.08, 0.5 - i * 0.1, i % 2 ? COL.stone : 0xb0a489); b.position.set(-0.1 + i * 0.05, y + 0.04, -0.05 + i * 0.05); g.add(b); y += 0.08; }
  for (const t of [[0.35, 0.3], [0.4, -0.1]] as const) { const blk = box(0.16, 0.12, 0.16, COL.stone); blk.position.set(t[0], 0.09, t[1]); g.add(blk); }
  return g;
}
function obozLowiecki(): THREE.Group {
  const g = new THREE.Group();
  const tent = cone(0.32, 0.5, COL.hide, 7); tent.position.set(-0.1, 0.25, 0); g.add(tent);
  for (const sx of [-1, 1]) { const p = cyl(0.02, 0.025, 0.34, COL.woodDk, 5); p.position.set(0.4, 0.17, sx * 0.18); g.add(p); }
  const bar = box(0.04, 0.04, 0.4, COL.woodDk); bar.position.set(0.4, 0.33, 0); g.add(bar);
  const hideSheet = box(0.02, 0.18, 0.22, COL.hide); hideSheet.position.set(0.4, 0.22, 0); g.add(hideSheet);
  const fire = cone(0.08, 0.12, COL.fire, 6); fire.position.set(-0.1, 0.06, 0.4); g.add(fire);
  return g;
}
function tartak(): THREE.Group {
  const g = new THREE.Group();
  const base = box(0.55, 0.08, 0.45, COL.woodDk); base.position.y = 0.04; g.add(base);
  const saw = box(0.35, 0.04, 0.02, 0xc0c8d0); saw.position.set(0, 0.12, 0); g.add(saw);
  for (let i = 0; i < 2; i++) {
    const log = cyl(0.06, 0.06, 0.5, COL.wood, 8);
    log.rotation.z = Math.PI / 2;
    log.position.set(-0.05, 0.1 + i * 0.12, -0.08 + i * 0.16);
    g.add(log);
  }
  const roof = cone(0.28, 0.14, COL.woodDk, 4); roof.position.set(0.15, 0.22, 0); g.add(roof);
  return g;
}

function wyrab(): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) { const log = cyl(0.07, 0.07, 0.7, COL.wood, 8); log.rotation.x = Math.PI / 2; log.position.set(-0.2, 0.08 + (i % 2) * 0.14, -0.1 + i * 0.15); g.add(log); }
  const stump = cyl(0.12, 0.13, 0.12, COL.woodDk, 9); stump.position.set(0.35, 0.06, 0.25); g.add(stump);
  const handle = cyl(0.012, 0.012, 0.3, 0x5a3f22, 5); handle.rotation.z = 0.5; handle.position.set(0.35, 0.18, 0.25); g.add(handle);
  const headA = box(0.1, 0.06, 0.02, 0xbfc4c9); headA.position.set(0.45, 0.3, 0.25); g.add(headA);
  return g;
}
function tarasy(): THREE.Group {
  if (GAME_MAP_RENDER_STYLE === 'minecraft') {
    return buildStyleTarasyTerrace('minecraft', false, 0.85);
  }
  const g = new THREE.Group();
  let r = 0.7, y = 0; for (let i = 0; i < 3; i++) { const front = cyl(r, r, 0.07, COL.stone, 14); front.position.y = y + 0.035; g.add(front);
    const top = cyl(r * 0.86, r * 0.86, 0.02, i === 2 ? COL.crop : COL.leaf, 14); top.position.y = y + 0.08; g.add(top); y += 0.08; r *= 0.74; }
  return g;
}
function lodzie(): THREE.Group {
  const g = new THREE.Group();
  const hull = cyl(0.1, 0.16, 0.6, COL.wood, 8); hull.rotation.x = Math.PI / 2; hull.scale.set(0.5, 1, 1); hull.position.set(0, 0.05, 0); g.add(hull);
  const mast = cyl(0.012, 0.012, 0.3, COL.woodDk, 5); mast.position.set(0, 0.2, 0); g.add(mast);
  const sail = box(0.01, 0.16, 0.18, COL.white); sail.position.set(0, 0.24, 0.02); g.add(sail);
  for (let i = 0; i < 4; i++) { const f = sph(0.03, 0xd9d3c2); f.position.set(-0.3 + i * 0.2, 0.03, 0.32); g.add(f); }
  return g;
}
function warzelniaSoli(): THREE.Group {
  const g = new THREE.Group();
  for (const gx of [-0.34, 0.34]) for (const gz of [-0.34, 0.34]) {
    const rim = box(0.5, 0.04, 0.5, COL.dirtDk); rim.position.set(gx, 0.02, gz); g.add(rim);
    const brine = box(0.4, 0.015, 0.4, 0xbfd6cf); brine.position.set(gx, 0.045, gz); g.add(brine);
    const crust = box(0.34, 0.02, 0.34, COL.salt); crust.position.set(gx, 0.05, gz); g.add(crust);
  }
  for (const t of [[0, 0.0], [0.0, 0.0]] as const) { void t; }
  const mound = cone(0.13, 0.18, COL.salt, 7); mound.position.set(0, 0.09, 0); g.add(mound);
  const mound2 = cone(0.09, 0.13, COL.white, 7); mound2.position.set(0.0, 0.065, 0.0); void mound2;
  return g;
}
function fort(ownerCol: number): THREE.Group {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  const S = 0.6, h = 0.22;
  const base = box(S * 2.1, 0.05, S * 2.1, COL.dirtDk); base.position.y = 0.025; inner.add(base);
  const wall = (w: number, d: number, x: number, z: number) => { const m = box(w, h, d, COL.wood); m.position.set(x, h / 2 + 0.05, z); inner.add(m); };
  wall(S * 2, 0.06, 0, -S);
  wall(0.06, S * 2, -S, 0);
  wall(0.06, S * 2, S, 0);
  wall(S * 0.7, 0.06, -S * 0.62, S);
  wall(S * 0.7, 0.06, S * 0.62, S);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const t = box(0.2, 0.32, 0.2, COL.woodDk); t.position.set(sx * S, 0.16 + 0.05, sz * S); inner.add(t);
    const roof = cone(0.17, 0.14, COL.hide, 4); roof.position.set(sx * S, 0.38, sz * S); inner.add(roof); }
  const pole = cyl(0.012, 0.012, 0.34, COL.woodDk, 5); pole.position.set(0, 0.22, 0); inner.add(pole);
  const flag = box(0.005, 0.08, 0.11, ownerCol); flag.position.set(0, 0.33, 0.06); inner.add(flag);
  inner.scale.setScalar(1 / 3);
  g.add(inner);
  return g;
}
function straznica(ownerCol: number): THREE.Group {
  const g = new THREE.Group();
  const Rr = 0.62, n = 16;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; if (Math.abs(a - Math.PI / 2) < 0.4) continue;
    const p = cyl(0.022, 0.026, 0.22, COL.woodDk, 5); p.position.set(Math.cos(a) * Rr, 0.11, Math.sin(a) * Rr); g.add(p);
    const tip = cone(0.028, 0.05, COL.woodDk, 5); tip.position.set(Math.cos(a) * Rr, 0.24, Math.sin(a) * Rr); g.add(tip); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const leg = cyl(0.025, 0.03, 0.42, COL.wood, 5); leg.position.set(sx * 0.14, 0.21, sz * 0.14); g.add(leg); }
  const platform = box(0.4, 0.05, 0.4, COL.wood); platform.position.y = 0.44; g.add(platform);
  const cabin = box(0.3, 0.18, 0.3, COL.hide); cabin.position.y = 0.55; g.add(cabin);
  const roof = cone(0.3, 0.16, COL.woodDk, 4); roof.position.y = 0.72; g.add(roof);
  const pole = cyl(0.012, 0.012, 0.2, COL.woodDk, 5); pole.position.set(0, 0.86, 0); g.add(pole);
  const flag = box(0.005, 0.07, 0.1, ownerCol); flag.position.set(0, 0.86, 0.06); g.add(flag);
  return g;
}

export function buildImprovement(
  key: ImprovementKey,
  ownerCol = 0xffd54a,
  style: MapRenderStyle = GAME_MAP_RENDER_STYLE,
): THREE.Group {
  if (style === 'roblox') return buildRobloxImprovement(key, ownerCol);
  switch (key) {
    case 'droga': return droga();
    case 'droga_brukowana': return drogaBrukowana();
    case 'irygacja': return irygacja();
    case 'pole_irygowane': return poleIrygowane();
    case 'farma': return farma();
    case 'bydlo': return bydlo();
    case 'owce': return owce();
    case 'lama': return lama();
    case 'stadnina': return bydlo();
    case 'kopalnia': return kopalnia();
    case 'glinianka': return glinianka();
    case 'kamieniolom': return kamieniolom();
    case 'oboz_lowiecki': return obozLowiecki();
    case 'wyrab': return wyrab();
    case 'tartak': return tartak();
    case 'tarasy': return tarasy();
    case 'lodzie_rybackie': return lodzie();
    case 'warzelnia_soli': return warzelniaSoli();
    case 'fort': return fort(ownerCol);
    case 'posterunek': return straznica(ownerCol);
    case 'pastwisko': return bydlo();
    case 'kopalnia_miedzi': return kopalnia();
  }
}

// === UKŁAD SEKTOROWY (Maciej 2026-07-09) ===================================
// Każde ulepszenie w SWOIM boku heksa, wyśrodkowane, MOCNO mniejsze, dosunięte do ścianki;
// środek wolny pod miasto. Reużywa istniejących modeli — BEZ nowych grafik, tylko pomniejszenie + przesunięcie.
// Boki: 1 surowce · 2 farma · 3 pastwisko/hodowla · 4 fort/posterunek · 5-6 rezerwa.
// DROGA (Maciej 2026-07-09): pas przez ŚRODEK heksa góra–dół (symbol drogi); miasto ją przykryje.
// Może kolidować z rzeką — zaakceptowane. Łączenie dróg rozwiążemy inaczej w przyszłości.
const SECTOR_R = 0.72;      // dosunięcie do ścianki (HEX_R=1)
const SECTOR_SCALE = 0.30;  // znacząco mniejsze
const CAT_ANGLE_DEG: Record<string, number> = {
  surowiec: 0, farma: 60, pastwisko: 120, fort: 180, inne: 240,
};
const SUROWIEC_KEYS = new Set(['kopalnia', 'kamieniolom', 'glinianka', 'warzelnia_soli', 'stadnina', 'kopalnia_miedzi']);
const PASTWISKO_KEYS = new Set(['bydlo', 'owce', 'lama', 'pastwisko']);
const FORT_KEYS = new Set(['fort', 'posterunek']);
const DROGA_KEYS = new Set(['droga', 'droga_brukowana']);
const OVERLAY_KEYS = new Set(['irygacja', 'pole_irygowane', 'tarasy']); // nakładki → przy farmie

function improvementSectorAngle(key: string): number {
  if (SUROWIEC_KEYS.has(key)) return CAT_ANGLE_DEG.surowiec!;
  if (key === 'farma' || OVERLAY_KEYS.has(key)) return CAT_ANGLE_DEG.farma!;
  if (PASTWISKO_KEYS.has(key)) return CAT_ANGLE_DEG.pastwisko!;
  if (FORT_KEYS.has(key)) return CAT_ANGLE_DEG.fort!;
  return CAT_ANGLE_DEG.inne!;
}

/**
 * Ujednolicony układ sektorowy dla wszystkich ulepszeń heksa. Każdy typ w swoim boku,
 * wyśrodkowany w XZ, przeskalowany SECTOR_SCALE i dosunięty do ścianki (SECTOR_R).
 */
export function buildImprovementSectored(
  keys: readonly string[],
  ownerCol = 0xffd54a,
  style: MapRenderStyle = GAME_MAP_RENDER_STYLE,
  hexR = 1,
): THREE.Group {
  const g = new THREE.Group();
  const normalized = keys.filter(k => k && k !== 'brak');
  const box = new THREE.Box3();
  const c = new THREE.Vector3();
  const sz = new THREE.Vector3();
  const bySector = new Map<number, string[]>();
  for (const k of normalized) {
    if (DROGA_KEYS.has(k)) {
      // Droga = pas przez ŚRODEK heksa (góra–dół). Model istniejący, wyśrodkowany, obrócony na N–S
      // i rozciągnięty do (prawie) wierzchołków. Miasto go przykryje. Może kolidować z rzeką (OK).
      const road = buildImprovement(k as ImprovementKey, ownerCol, style);
      box.setFromObject(road); box.getCenter(c); box.getSize(sz);
      road.position.x -= c.x; road.position.z -= c.z; // środek w XZ (spód Y zostaje)
      const wrap = new THREE.Group();
      wrap.add(road);
      const longLen = Math.max(sz.x, sz.z) || 1;
      const target = 1.9 * hexR; // od górnego do dolnego wierzchołka
      if (sz.x >= sz.z) { wrap.scale.x = target / longLen; wrap.rotation.y = Math.PI / 2; }
      else { wrap.scale.z = target / longLen; }
      g.add(wrap);
      continue;
    }
    const ang = improvementSectorAngle(k);
    let arr = bySector.get(ang);
    if (!arr) { arr = []; bySector.set(ang, arr); }
    arr.push(k);
  }
  for (const [angDeg, ks] of bySector) {
    const sub = new THREE.Group();
    for (const k of ks) {
      const model = buildImprovement(k as ImprovementKey, ownerCol, style);
      box.setFromObject(model);
      box.getCenter(c);
      model.position.x -= c.x;
      model.position.z -= c.z; // wyśrodkuj w XZ (spód Y zostaje na 0)
      if (FORT_KEYS.has(k)) model.scale.multiplyScalar(0.5); // fort/posterunek dodatkowo mniejsze
      sub.add(model);
    }
    sub.scale.setScalar(SECTOR_SCALE);
    const a = (angDeg * Math.PI) / 180;
    sub.position.set(Math.sin(a) * SECTOR_R * hexR, 0, -Math.cos(a) * SECTOR_R * hexR);
    g.add(sub);
  }
  return g;
}

/** Wiele warstw ulepszeń na heksie (kanon §3 — SILNIK wpina stan hex.ulepszenia[]). */
export function buildImprovementStack(
  keys: readonly string[],
  ownerCol = 0xffd54a,
  style: MapRenderStyle = GAME_MAP_RENDER_STYLE,
): THREE.Group {
  const g = new THREE.Group();
  const normalized = keys.filter(k => k && k !== 'brak');
  const foodKeys = normalized.filter(k => ['farma', 'irygacja', 'bydlo', 'owce'].includes(k));

  if (style === 'roblox' && foodKeys.length > 0) {
    const composed = buildRobloxFoodStack(normalized);
    if (composed) {
      for (const k of normalized.filter(k => !foodKeys.includes(k))) {
        composed.add(buildImprovement(k as ImprovementKey, ownerCol, style));
      }
      return composed;
    }
  }

  if (normalized.includes('farma') && normalized.includes('bydlo') && normalized.includes('owce')) {
    if (style === 'roblox') {
      g.add(buildRobloxFoodStack(normalized)!);
    } else {
      g.add(farmWithBydlo());
      const ow = owce();
      ow.position.set(0.34, 0, -0.22);
      g.add(ow);
    }
    for (const k of normalized.filter(k => !['farma', 'bydlo', 'owce'].includes(k))) {
      g.add(buildImprovement(k as ImprovementKey, ownerCol, style));
    }
    return g;
  }

  if (normalized.includes('farma') && normalized.includes('irygacja')) {
    g.add(buildImprovement('pole_irygowane' as ImprovementKey, ownerCol, style));
    for (const k of normalized.filter(k => k !== 'farma' && k !== 'irygacja')) {
      g.add(buildImprovement(k as ImprovementKey, ownerCol, style));
    }
    return g;
  }

  if (normalized.includes('farma') && normalized.includes('bydlo')) {
    if (style === 'roblox') {
      g.add(buildRobloxFoodStack(['farma', 'bydlo'])!);
    } else {
      g.add(farmWithBydlo());
    }
    for (const k of normalized.filter(k => k !== 'farma' && k !== 'bydlo')) {
      g.add(buildImprovement(k as ImprovementKey, ownerCol, style));
    }
    return g;
  }

  if (normalized.includes('farma') && normalized.includes('owce')) {
    if (style === 'roblox') {
      g.add(buildRobloxFoodStack(['farma', 'owce'])!);
    } else {
      g.add(farma());
      placeLivestockPair(g, 'sheep', 0.4, 0.02, style);
    }
    for (const k of normalized.filter(k => k !== 'farma' && k !== 'owce')) {
      g.add(buildImprovement(k as ImprovementKey, ownerCol, style));
    }
    return g;
  }

  if (normalized.includes('bydlo') && normalized.includes('owce')) {
    if (style === 'roblox') {
      g.add(buildRobloxFoodStack(['bydlo', 'owce'])!);
    } else {
      g.add(bydlo());
      placeLivestockPair(g, 'sheep', 0.32, -0.28, style);
    }
    for (const k of normalized.filter(k => k !== 'bydlo' && k !== 'owce')) {
      g.add(buildImprovement(k as ImprovementKey, ownerCol, style));
    }
    return g;
  }

  for (const k of normalized) {
    g.add(buildImprovement(k as ImprovementKey, ownerCol, style));
  }
  return g;
}
