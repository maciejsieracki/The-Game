/**
 * improvements.ts (lane Civ-MAPA / render) — wyglad ULEPSZEN TERENU na heksie.
 * buildImprovement(key, ownerCol) -> THREE.Group osadzony na WIERZCHU heksa (y=0 = gora kafla).
 * KLUCZE zgodne z gra/data/terrain-improvements.json (silnik mapuje stan heksu -> model).
 * Render-only; bonusy/koszt/epoka(dane) = MIASTO. 15 pozycji.
 */
import * as THREE from 'three';

export type ImprovementKey =
  | 'farma' | 'pastwisko' | 'kopalnia' | 'kamieniolom' | 'oboz_lowiecki' | 'wyrab'
  | 'lodzie_rybackie' | 'droga' | 'posterunek'
  | 'irygacja' | 'pole_irygowane' | 'glinianka' | 'plantacja' | 'warzelnia_soli' | 'tarasy' | 'fort';

export const IMPROVEMENTS: { key: ImprovementKey; label: string; epoka: number }[] = [
  { key: 'farma', label: 'Farma', epoka: 1 }, { key: 'pastwisko', label: 'Pastwisko', epoka: 1 },
  { key: 'kopalnia', label: 'Kopalnia', epoka: 1 }, { key: 'kamieniolom', label: 'Kamieniołom', epoka: 1 },
  { key: 'oboz_lowiecki', label: 'Obóz łowiecki', epoka: 1 }, { key: 'wyrab', label: 'Wyrąb', epoka: 1 },
  { key: 'lodzie_rybackie', label: 'Łodzie rybackie', epoka: 1 }, { key: 'droga', label: 'Droga', epoka: 1 },
  { key: 'posterunek', label: 'Posterunek (Strażnica)', epoka: 1 },
  { key: 'irygacja', label: 'Irygacja', epoka: 2 }, { key: 'pole_irygowane', label: 'Pole irygowane', epoka: 2 }, { key: 'glinianka', label: 'Glinianka', epoka: 2 },
  { key: 'plantacja', label: 'Plantacja', epoka: 2 }, { key: 'warzelnia_soli', label: 'Warzelnia soli', epoka: 2 },
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
function irygacja(): THREE.Group {
  const g = new THREE.Group();
  for (const z of [-0.3, 0, 0.3]) { const ch = box(1.5, 0.02, 0.1, COL.water); ch.position.set(0, 0.02, z); g.add(ch);
    const bank = box(1.5, 0.04, 0.06, COL.dirtDk); bank.position.set(0, 0.02, z + 0.1); g.add(bank); }
  for (let i = 0; i < 8; i++) { const c = cone(0.04, 0.1, COL.crop, 5); c.position.set(-0.6 + (i % 4) * 0.4, 0.05, i < 4 ? -0.15 : 0.15); g.add(c); }
  return g;
}
function farma(): THREE.Group {
  const g = new THREE.Group();
  const soil = box(1.4, 0.03, 1.2, COL.dirt); soil.position.y = 0.015; g.add(soil);
  for (let i = 0; i < 6; i++) { const row = box(1.3, 0.02, 0.05, COL.dirtDk); row.position.set(0, 0.035, -0.5 + i * 0.2); g.add(row);
    for (let j = 0; j < 5; j++) { const t = cone(0.035, 0.09, i % 2 ? COL.crop : COL.cropDk, 5); t.position.set(-0.5 + j * 0.25, 0.06, -0.5 + i * 0.2); g.add(t); } }
  return g;
}
function pastwisko(): THREE.Group {
  const g = new THREE.Group();
  const W = 1.3, D = 1.1;
  for (const sx of [-1, 1]) { const r = box(W, 0.015, 0.03, COL.wood); r.position.set(0, 0.13, sx * D / 2); g.add(r); const r2 = box(0.03, 0.015, D, COL.wood); r2.position.set(sx * W / 2, 0.13, 0); g.add(r2); }
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const p = cyl(0.02, 0.02, 0.18, COL.woodDk, 5); p.position.set(Math.cos(a) * W / 2, 0.09, Math.sin(a) * D / 2); g.add(p); }
  const animal = (x: number, z: number, c: number) => { const b = box(0.18, 0.1, 0.1, c); b.position.set(x, 0.09, z); g.add(b); const h = box(0.07, 0.07, 0.07, c); h.position.set(x + 0.12, 0.11, z); g.add(h); };
  animal(-0.2, 0.1, COL.white); animal(0.25, -0.15, 0x8a6a45);
  return g;
}
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
function wyrab(): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) { const log = cyl(0.07, 0.07, 0.7, COL.wood, 8); log.rotation.x = Math.PI / 2; log.position.set(-0.2, 0.08 + (i % 2) * 0.14, -0.1 + i * 0.15); g.add(log); }
  const stump = cyl(0.12, 0.13, 0.12, COL.woodDk, 9); stump.position.set(0.35, 0.06, 0.25); g.add(stump);
  const handle = cyl(0.012, 0.012, 0.3, 0x5a3f22, 5); handle.rotation.z = 0.5; handle.position.set(0.35, 0.18, 0.25); g.add(handle);
  const headA = box(0.1, 0.06, 0.02, 0xbfc4c9); headA.position.set(0.45, 0.3, 0.25); g.add(headA);
  return g;
}
function poleIrygowane(): THREE.Group {
  const g = new THREE.Group();
  // Baza gleby (jak farma)
  const soil = box(1.4, 0.03, 1.2, COL.dirt); soil.position.y = 0.015; g.add(soil);
  // 3 kanały wodne (jak irygacja) biegnące poziomo przez pole
  const kanalZ = [-0.38, 0, 0.38];
  for (const z of kanalZ) {
    const ch = box(1.35, 0.025, 0.1, COL.water); ch.position.set(0, 0.03, z); g.add(ch);
    const bankN = box(1.35, 0.04, 0.05, COL.dirtDk); bankN.position.set(0, 0.025, z + 0.08); g.add(bankN);
    const bankS = box(1.35, 0.04, 0.05, COL.dirtDk); bankS.position.set(0, 0.025, z - 0.08); g.add(bankS);
  }
  // Rzędy plonów między kanałami — 4 pasy (bujniejsze niż sama farma)
  const rowZ = [-0.19, -0.57, 0.19, 0.57];
  for (let ri = 0; ri < rowZ.length; ri++) {
    const z = rowZ[ri];
    const row = box(1.3, 0.02, 0.05, COL.dirtDk); row.position.set(0, 0.038, z); g.add(row);
    // 7 stożków plonów na rząd (gęściej niż farma)
    for (let j = 0; j < 7; j++) {
      const t = cone(0.04, 0.1, ri % 2 ? COL.crop : COL.cropDk, 5);
      t.position.set(-0.54 + j * 0.18, 0.065, z); g.add(t);
      // Dodatkowy mały stożek obok — efekt bujności
      const t2 = cone(0.025, 0.07, ri % 2 ? COL.cropDk : COL.crop, 5);
      t2.position.set(-0.45 + j * 0.18, 0.055, z + (j % 2 ? 0.05 : -0.05)); g.add(t2);
    }
  }
  return g;
}
function tarasy(): THREE.Group {
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
function plantacja(): THREE.Group {
  const g = new THREE.Group();
  for (const z of [-0.4, 0, 0.4]) {
    const rail = box(1.3, 0.02, 0.03, COL.wood); rail.position.set(0, 0.13, z); g.add(rail);
    for (const sx of [-1, 1]) { const p = cyl(0.015, 0.018, 0.16, COL.woodDk, 5); p.position.set(sx * 0.6, 0.08, z); g.add(p); }
    const vine = box(1.25, 0.1, 0.09, COL.leaf); vine.position.set(0, 0.17, z); g.add(vine);
    for (let i = 0; i < 4; i++) { const gr = sph(0.03, COL.grape); gr.position.set(-0.45 + i * 0.3, 0.11, z + 0.05); g.add(gr); }
  }
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
  const S = 0.6, h = 0.22;
  const base = box(S * 2.1, 0.05, S * 2.1, COL.dirtDk); base.position.y = 0.025; g.add(base);
  // 4 sciany palisady (przerwa-brama z przodu +z)
  const wall = (w: number, d: number, x: number, z: number) => { const m = box(w, h, d, COL.wood); m.position.set(x, h / 2 + 0.05, z); g.add(m); };
  wall(S * 2, 0.06, 0, -S);            // tyl
  wall(0.06, S * 2, -S, 0);            // lewo
  wall(0.06, S * 2, S, 0);             // prawo
  wall(S * 0.7, 0.06, -S * 0.62, S);   // przod-lewo (brama posrodku)
  wall(S * 0.7, 0.06, S * 0.62, S);    // przod-prawo
  // 4 naroznikowe blokhauzy
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const t = box(0.2, 0.32, 0.2, COL.woodDk); t.position.set(sx * S, 0.16 + 0.05, sz * S); g.add(t);
    const roof = cone(0.17, 0.14, COL.hide, 4); roof.position.set(sx * S, 0.38, sz * S); g.add(roof); }
  // sztandar wlasciciela
  const pole = cyl(0.012, 0.012, 0.34, COL.woodDk, 5); pole.position.set(0, 0.22, 0); g.add(pole);
  const flag = box(0.005, 0.08, 0.11, ownerCol); flag.position.set(0, 0.33, 0.06); g.add(flag);
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

export function buildImprovement(key: ImprovementKey, ownerCol = 0xffd54a): THREE.Group {
  switch (key) {
    case 'droga': return droga();
    case 'irygacja': return irygacja();
    case 'pole_irygowane': return poleIrygowane();
    case 'farma': return farma();
    case 'pastwisko': return pastwisko();
    case 'kopalnia': return kopalnia();
    case 'glinianka': return glinianka();
    case 'kamieniolom': return kamieniolom();
    case 'oboz_lowiecki': return obozLowiecki();
    case 'wyrab': return wyrab();
    case 'tarasy': return tarasy();
    case 'lodzie_rybackie': return lodzie();
    case 'plantacja': return plantacja();
    case 'warzelnia_soli': return warzelniaSoli();
    case 'fort': return fort(ownerCol);
    case 'posterunek': return straznica(ownerCol);
  }
}
