/**
 * bronzeCity.ts (lane Civ-MAPA / render) — miasta EPOKI BRAZU per cywilizacja.
 * buildBronzeCity(civ, level 1..10, ownerColor, withWalls). Centrum = swiatynia danej cyw.
 * 9 typow rosteru (DANE) + 'aztek' jako wariant mezoamerykanski do decyzji.
 *  grecja  — biale kubiczne domy (plaski dach) + swiatynia z kolumnami i frontonem.
 *  rzym    — biale sciany + czerwone dachowki + swiatynia frontalna na podium.
 *  sumer   — mulobrick + ZIGGURAT (schodkowa wieza ze swiatynka na szczycie).
 *  egipt   — mulobrick + swiatynia PYLONOWA (2 pylony + brama) + obeliski.
 *  inka    — kamienne tarasy + thatch + platforma-swiatynia (zloty trapez, Coricancha).
 *  aztek   — kamienna PIRAMIDA SCHODKOWA ze schodami + podwojna swiatynka (Templo Mayor).
 *  chiny   — dziedziniec + uniesiona hala na platformie, szerokie okapy (dach ceramiczny).
 *  zulu    — kraal: pierscien kopulastych chat + centralna wielka chata + zagroda.
 *  celtowie— okragle chaty (stozkowa strzecha) + nemeton (krag kamieni + drewniany idol).
 *  germanie— dlugie domy (longhouse) + drewniany hof z rzezbionym slupem-idolem.
 * 10 poziomow rozwoju; mury niezalezne (withWalls) — kamienne lub palisada wg cyw.
 */
import * as THREE from 'three';

export type BronzeCiv = 'grecja' | 'rzym' | 'sumer' | 'egipt' | 'inka' | 'aztek' | 'chiny' | 'zulu' | 'celtowie' | 'germanie';
export const BRONZE_CIVS: BronzeCiv[] = ['grecja','rzym','sumer','egipt','inka','aztek','chiny','zulu','celtowie','germanie'];

function rnd(n: number, salt: number): number {
  let x = Math.imul((n + 1) * 2654435761 + salt * 40503, 0x27d4eb2d) >>> 0;
  x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d) >>> 0; x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}
const mk = (c: number) => new THREE.MeshLambertMaterial({ color: c });
const mkS = (c: number) => new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide });

interface BM {
  wall: THREE.Material; roof: THREE.Material; roofDk: THREE.Material; col: THREE.Material;
  stone: THREE.Material; stoneDk: THREE.Material; wood: THREE.Material; owner: THREE.Material;
  thatch: THREE.Material; accent: THREE.Material; gold: THREE.Material; tile: THREE.Material;
}

/* ---------------- DOMY ---------------- */
function boxHouse(rad: number, seed: number, wallM: THREE.Material, roofM: THREE.Material, roofTh = 0.1, hMul = 1.0): THREE.Group {
  const g = new THREE.Group();
  const w = rad * 1.7, h = rad * (hMul + rnd(seed, 3) * 0.5), d = rad * 1.5;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallM);
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w * 1.05, rad * roofTh, d * 1.05), roofM);
  roof.position.y = h + rad * roofTh * 0.5; roof.castShadow = true; g.add(roof);
  return g;
}
function gabledHouse(rad: number, seed: number, wallM: THREE.Material, roofM: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const w = rad * 1.7, h = rad * (0.9 + rnd(seed, 3) * 0.5), d = rad * 1.5;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallM);
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const rr = d * 0.6;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, w * 1.05, 3, 1), roofM);
  roof.rotation.z = Math.PI / 2; roof.scale.y = (d / (1.732 * rr));
  roof.position.y = h + rr * 0.35; roof.castShadow = true; g.add(roof);
  return g;
}
function longhouse(rad: number, seed: number, wallM: THREE.Material, thatchM: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const w = rad * 2.7, h = rad * 0.9, d = rad * 1.2;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallM);
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const rr = d * 0.75;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, w * 1.06, 3, 1), thatchM);
  roof.rotation.z = Math.PI / 2; roof.scale.y = (d / (1.5 * rr));
  roof.position.y = h + rr * 0.42; roof.castShadow = true; g.add(roof);
  return g;
}
function roundhouse(rad: number, seed: number, wallM: THREE.Material, thatchM: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const r = rad * 0.95, h = rad * 0.8;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), wallM);
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(r * 1.25, rad * 1.1, 12), thatchM);
  cone.position.y = h + rad * 0.55; cone.castShadow = true; g.add(cone);
  return g;
}
function beehiveHut(rad: number, seed: number, thatchM: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const r = rad * 0.95;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), thatchM);
  dome.position.y = 0.001; dome.scale.y = 1.15; dome.castShadow = true; dome.receiveShadow = true; g.add(dome);
  return g;
}
function pagodaRoof(bw: number, bd: number, rise: number, overhang: number, tileM: THREE.Material, tipM: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const w = bw * overhang, d = bd * overhang;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(rise * 0.18, 1, rise, 4), tileM);
  roof.rotation.y = Math.PI / 4; roof.scale.set(w / Math.SQRT2, 1, d / Math.SQRT2); roof.castShadow = true; g.add(roof);
  const eave = new THREE.Mesh(new THREE.BoxGeometry(w, rise * 0.1, d), tipM); g.add(eave);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.ConeGeometry(rise * 0.12, rise * 0.6, 4), tipM);
    tip.rotation.order = 'ZYX'; tip.position.set(sx * w * 0.5, rise * 0.06, sz * d * 0.5);
    tip.rotation.z = -sx * 0.7; tip.rotation.x = sz * 0.7; tip.castShadow = true; g.add(tip);
  }
  return g;
}
function chineseHouse(rad: number, seed: number, wallM: THREE.Material, tileM: THREE.Material, redM: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const w = rad * 1.6, h = rad * 0.8, d = rad * 1.3;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallM);
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  for (const sx of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.09, rad * 0.09, h, 6), redM); c.position.set(sx * w * 0.46, h / 2, d * 0.46); c.castShadow = true; g.add(c); }
  const roof = pagodaRoof(w, d, rad * 0.5, 1.35, tileM, redM); roof.position.y = h + rad * 0.04; g.add(roof);
  return g;
}

function celticHouse(rad: number, seed: number, wallM: THREE.Material, thatchM: THREE.Material, woodM: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const w = rad * 1.5, h = rad * 0.85, d = rad * 1.95;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallM);
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const apexH = rad * 1.05;
  const roof = gableRoof(w * 1.12, d * 1.06, apexH, thatchM); roof.position.y = h + apexH / 3; roof.castShadow = true; g.add(roof);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(rad * 0.1, h * 1.02, rad * 0.1), woodM); post.position.set(sx * w * 0.46, h / 2, sz * d * 0.46); g.add(post); }
  return g;
}
function murusGallicus(spread: number, m: BM): THREE.Group {
  const g = new THREE.Group();
  const Rr = spread * 1.4, h = 0.2, th = 0.05;
  const stone = mkS(0x9a8c70), stoneDk = mkS(0x7d6f56);
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(Rr + th, Rr + th, h, 44, 1, true), stone); outer.position.y = h / 2; outer.castShadow = true; outer.receiveShadow = true; g.add(outer);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(Rr - th, Rr - th, h, 44, 1, true), stone); inner.position.y = h / 2; g.add(inner);
  const cap = new THREE.Mesh(new THREE.RingGeometry(Rr - th, Rr + th, 44), stoneDk); cap.rotation.x = -Math.PI / 2; cap.position.y = h; g.add(cap);
  const n = 36;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a);
    const atGate = Math.abs(a - Math.PI / 2) < 0.28;
    if (!atGate) { const beam = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.06), m.wood); beam.position.set(cx * (Rr + th), h * 0.55, cz * (Rr + th)); beam.rotation.y = -a; g.add(beam); }
    if (i % 2 === 0 && !atGate) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.07, 5), m.wood); post.position.set(cx * Rr, h + 0.035, cz * Rr); g.add(post); }
  }
  const gz = Rr;
  const tower = (x: number) => { const t = new THREE.Mesh(new THREE.BoxGeometry(0.12, h + 0.16, 0.12), stone); t.position.set(x, (h + 0.16) / 2, gz); t.castShadow = true; g.add(t);
    const beamTop = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.14), m.wood); beamTop.position.set(x, h + 0.16, gz); g.add(beamTop);
    const capT = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.1, 4), m.thatch); capT.position.set(x, h + 0.22, gz); g.add(capT); };
  tower(-Rr * 0.22); tower(Rr * 0.22);
  const walk = new THREE.Mesh(new THREE.BoxGeometry(Rr * 0.58, 0.05, 0.14), m.wood); walk.position.set(0, h + 0.02, gz); g.add(walk);
  const door = new THREE.Mesh(new THREE.BoxGeometry(Rr * 0.34, h * 0.8, 0.05), mk(0x3a2c1a)); door.position.set(0, h * 0.4, gz); g.add(door);
  return g;
}

function rampartPalisade(spread: number, m: BM): THREE.Group {
  const g = new THREE.Group();
  const Rr = spread * 1.32, hB = 0.14;
  const earth = mkS(0x6f7d3a), earthDk = mkS(0x5c5230);
  const rOut = Rr * 1.32, rTopOut = Rr * 1.1, rTopIn = Rr * 0.98, rIn = Rr * 0.82;
  const ditch = new THREE.Mesh(new THREE.RingGeometry(rOut, rOut * 1.18, 44), earthDk); ditch.rotation.x = -Math.PI / 2; ditch.position.y = 0.002; ditch.receiveShadow = true; g.add(ditch);
  const outS = new THREE.Mesh(new THREE.CylinderGeometry(rTopOut, rOut, hB, 44, 1, true), earth); outS.position.y = hB / 2; outS.castShadow = true; outS.receiveShadow = true; g.add(outS);
  const inS = new THREE.Mesh(new THREE.CylinderGeometry(rTopIn, rIn, hB, 44, 1, true), earth); inS.position.y = hB / 2; g.add(inS);
  const top = new THREE.Mesh(new THREE.RingGeometry(rTopIn, rTopOut, 44), earth); top.rotation.x = -Math.PI / 2; top.position.y = hB; top.receiveShadow = true; g.add(top);
  const Rp = (rTopIn + rTopOut) / 2, n = 54, postH = 0.19;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; if (Math.abs(a - Math.PI / 2) < 0.2) continue;
    const cx = Math.cos(a) * Rp, cz = Math.sin(a) * Rp;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, postH, 5), m.wood); post.position.set(cx, hB + postH / 2, cz); post.castShadow = true; g.add(post);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.03, 5), m.wood); tip.position.set(cx, hB + postH, cz); g.add(tip); }
  const gz = Rp;
  for (const sx of [-1, 1]) { const pst = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), m.wood); pst.position.set(sx * 0.17, hB + 0.25, gz); pst.castShadow = true; g.add(pst); }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.22), m.wall); deck.position.set(0, hB + 0.4, gz); deck.castShadow = true; g.add(deck);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.16), m.wall); upper.position.set(0, hB + 0.5, gz); g.add(upper);
  const ghRoof = gableRoof(0.5, 0.22, 0.13, m.thatch); ghRoof.position.set(0, hB + 0.6, gz); g.add(ghRoof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.05), mk(0x3a2c1a)); door.position.set(0, hB * 0.5 + 0.1, gz); g.add(door);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, rOut * 0.5), m.wood); bridge.position.set(0, hB * 0.5, gz + rOut * 0.32); bridge.castShadow = true; g.add(bridge);
  return g;
}

/* ---------------- WSPOLNE BRYLY ---------------- */
function steppedPlatform(steps: number, baseW: number, baseD: number, stepH: number, shrink: number, sideM: THREE.Material, y0 = 0): { g: THREE.Group; topY: number; topW: number; topD: number } {
  const g = new THREE.Group();
  let w = baseW, d = baseD, y = y0;
  for (let i = 0; i < steps; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, stepH, d), sideM);
    b.position.y = y + stepH / 2; b.castShadow = true; b.receiveShadow = true; g.add(b);
    y += stepH; w *= shrink; d *= shrink;
  }
  return { g, topY: y, topW: w / shrink, topD: d / shrink };
}
function obelisk(h: number, base: number, stoneM: THREE.Material, capM: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(base * 0.6, base, h, 4), stoneM);
  shaft.rotation.y = Math.PI / 4; shaft.position.y = h / 2; shaft.castShadow = true; g.add(shaft);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(base * 0.85, h * 0.14, 4), capM);
  cap.rotation.y = Math.PI / 4; cap.position.y = h + h * 0.06; g.add(cap);
  return g;
}

/* ---------------- SWIATYNIE ---------------- */
function peristyle(g: THREE.Group, w: number, d: number, baseY: number, colH: number, colR: number, mat: THREE.Material, nx: number, nz: number, frontOnly: boolean): void {
  const hw = w / 2 - colR, hd = d / 2 - colR;
  const place = (x: number, z: number) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(colR, colR * 1.12, colH, 6), mat); c.position.set(x, baseY + colH / 2, z); c.castShadow = true; g.add(c); };
  for (let i = 0; i < nx; i++) { const x = -hw + 2 * hw * (i / (nx - 1)); place(x, hd); if (!frontOnly) place(x, -hd); }
  if (!frontOnly) for (let j = 1; j < nz - 1; j++) { const z = -hd + 2 * hd * (j / (nz - 1)); place(hw, z); place(-hw, z); }
}
function gableRoof(w: number, d: number, apexH: number, mat: THREE.Material): THREE.Mesh {
  const rr = apexH / 1.5;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, d, 3, 1), mat);
  roof.rotation.x = -Math.PI / 2; roof.scale.x = w / (1.732 * rr); roof.castShadow = true;
  return roof;
}
function greekTemple(scale: number, m: BM): THREE.Group {
  const g = new THREE.Group();
  const W = 0.34 * scale, D = 0.22 * scale, baseH = 0.03 * scale, colH = 0.15 * scale;
  const base = new THREE.Mesh(new THREE.BoxGeometry(W, baseH, D), m.col); base.position.y = baseH / 2; base.castShadow = true; base.receiveShadow = true; g.add(base);
  peristyle(g, W, D, baseH, colH, 0.012 * scale, m.col, 6, 4, false);
  const entY = baseH + colH;
  const ent = new THREE.Mesh(new THREE.BoxGeometry(W * 1.04, 0.03 * scale, D * 1.04), m.roofDk); ent.position.y = entY + 0.015 * scale; g.add(ent);
  g.add((() => { const r = gableRoof(W * 1.05, D * 1.06, 0.1 * scale, m.roof); r.position.y = entY + 0.03 * scale; return r; })());
  return g;
}
function romanTemple(scale: number, m: BM): THREE.Group {
  const g = new THREE.Group();
  const W = 0.30 * scale, D = 0.24 * scale, podH = 0.06 * scale, colH = 0.15 * scale;
  const pod = new THREE.Mesh(new THREE.BoxGeometry(W, podH, D), m.col); pod.position.y = podH / 2; pod.castShadow = true; pod.receiveShadow = true; g.add(pod);
  peristyle(g, W, D, podH, colH, 0.013 * scale, m.col, 6, 4, true);
  const cell = new THREE.Mesh(new THREE.BoxGeometry(W * 0.7, colH, D * 0.55), m.wall); cell.position.set(0, podH + colH / 2, -D * 0.18); g.add(cell);
  const entY = podH + colH;
  const ent = new THREE.Mesh(new THREE.BoxGeometry(W * 1.04, 0.03 * scale, D * 1.04), m.roofDk); ent.position.y = entY + 0.015 * scale; g.add(ent);
  g.add((() => { const r = gableRoof(W * 1.05, D * 1.06, 0.11 * scale, m.roof); r.position.y = entY + 0.03 * scale; return r; })());
  return g;
}
function ziggurat(scale: number, m: BM): THREE.Group {
  const g = new THREE.Group();
  const { g: plat, topY, topW, topD } = steppedPlatform(4, 0.42 * scale, 0.34 * scale, 0.07 * scale, 0.72, m.stone);
  g.add(plat);
  const shrine = new THREE.Mesh(new THREE.BoxGeometry(topW * 0.8, 0.09 * scale, topD * 0.8), m.accent);
  shrine.position.y = topY + 0.045 * scale; shrine.castShadow = true; g.add(shrine);
  // schody frontowe
  const st = new THREE.Mesh(new THREE.BoxGeometry(0.07 * scale, 0.012 * scale, 0.36 * scale), m.stoneDk);
  st.position.set(0, topY * 0.5, 0.2 * scale); st.rotation.x = -0.5; g.add(st);
  return g;
}
function pylonTemple(scale: number, m: BM): THREE.Group {
  const g = new THREE.Group();
  const pyW = 0.1 * scale, pyH = 0.26 * scale, pyD = 0.13 * scale, gap = 0.12 * scale;
  const pylon = (x: number) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(pyW * 0.78, pyW, pyH, 4), m.wall); p.rotation.y = Math.PI / 4; p.scale.z = pyD / pyW; p.position.set(x, pyH / 2, 0); p.castShadow = true; g.add(p); };
  pylon(-(gap / 2 + pyW / 2)); pylon(gap / 2 + pyW / 2);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(gap + pyW * 1.6, 0.05 * scale, pyD * 0.7), m.accent); lintel.position.set(0, pyH * 0.82, 0); g.add(lintel);
  const court = new THREE.Mesh(new THREE.BoxGeometry(gap + pyW * 2.2, 0.02 * scale, 0.2 * scale), m.stone); court.position.set(0, 0.01 * scale, -0.16 * scale); court.receiveShadow = true; g.add(court);
  const ob = obelisk(0.2 * scale, 0.02 * scale, m.wall, m.gold);
  const ob2 = ob.clone(); ob.position.set(-(gap / 2 + pyW + 0.05 * scale), 0, 0.06 * scale); ob2.position.set(gap / 2 + pyW + 0.05 * scale, 0, 0.06 * scale); g.add(ob, ob2);
  return g;
}
function aztecPyramid(scale: number, m: BM): THREE.Group {
  const g = new THREE.Group();
  const { g: plat, topY, topW, topD } = steppedPlatform(5, 0.44 * scale, 0.4 * scale, 0.055 * scale, 0.78, m.stone);
  g.add(plat);
  // dwie swiatynki na szczycie (Templo Mayor)
  const sh = (x: number, c: THREE.Material) => { const s = new THREE.Mesh(new THREE.BoxGeometry(topW * 0.34, 0.08 * scale, topD * 0.7), c); s.position.set(x, topY + 0.04 * scale, 0); s.castShadow = true; g.add(s);
    const r = new THREE.Mesh(new THREE.BoxGeometry(topW * 0.4, 0.03 * scale, topD * 0.78), m.roofDk); r.position.set(x, topY + 0.095 * scale, 0); g.add(r); };
  sh(-topW * 0.22, m.accent); sh(topW * 0.22, m.gold);
  // szerokie schody frontowe
  const stair = new THREE.Mesh(new THREE.BoxGeometry(0.13 * scale, 0.02 * scale, topY * 1.5), m.stoneDk);
  stair.position.set(0, topY * 0.5, 0.22 * scale); stair.rotation.x = -0.62; g.add(stair);
  return g;
}
function incaTemple(scale: number, m: BM): THREE.Group {
  const g = new THREE.Group();
  const { g: plat, topY, topW, topD } = steppedPlatform(3, 0.4 * scale, 0.32 * scale, 0.06 * scale, 0.8, m.stone);
  g.add(plat);
  // trapezowa swiatynia (zlote akcenty - Coricancha)
  const cell = new THREE.Mesh(new THREE.CylinderGeometry(topW * 0.34, topW * 0.4, 0.13 * scale, 4), m.wall);
  cell.rotation.y = Math.PI / 4; cell.scale.z = (topD * 0.8) / (topW * 0.8); cell.position.y = topY + 0.065 * scale; cell.castShadow = true; g.add(cell);
  const band = new THREE.Mesh(new THREE.BoxGeometry(topW * 0.74, 0.018 * scale, topD * 0.62), m.gold); band.position.y = topY + 0.11 * scale; g.add(band);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(topW * 0.5, 0.08 * scale, 4), m.thatch); roof.rotation.y = Math.PI / 4; roof.position.y = topY + 0.17 * scale; roof.castShadow = true; g.add(roof);
  const st = new THREE.Mesh(new THREE.BoxGeometry(0.08 * scale, 0.012 * scale, topY * 1.4), m.stoneDk); st.position.set(0, topY * 0.5, 0.18 * scale); st.rotation.x = -0.6; g.add(st);
  return g;
}
function chineseHall(scale: number, m: BM): THREE.Group {
  const g = new THREE.Group();
  const podH = 0.05 * scale;
  const pod = new THREE.Mesh(new THREE.BoxGeometry(0.44 * scale, podH, 0.44 * scale), m.stone); pod.position.y = podH / 2; pod.castShadow = true; pod.receiveShadow = true; g.add(pod);
  let y = podH, bw = 0.3 * scale, bd = 0.3 * scale;
  for (let i = 0; i < 3; i++) {
    const bh = 0.1 * scale;
    const wallBody = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.84, bh, bd * 0.84), m.wall); wallBody.position.y = y + bh / 2; wallBody.castShadow = true; g.add(wallBody);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.014 * scale, 0.014 * scale, bh, 6), m.accent); c.position.set(sx * bw * 0.44, y + bh / 2, sz * bd * 0.44); c.castShadow = true; g.add(c); }
    y += bh;
    const roof = pagodaRoof(bw, bd, 0.075 * scale, 1.5, m.tile, m.accent); roof.position.y = y + 0.012 * scale; g.add(roof);
    y += 0.055 * scale; bw *= 0.72; bd *= 0.72;
  }
  const fin = new THREE.Mesh(new THREE.CylinderGeometry(0.008 * scale, 0.018 * scale, 0.1 * scale, 6), m.gold); fin.position.y = y + 0.05 * scale; g.add(fin);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.022 * scale, 8, 6), m.gold); ball.position.y = y + 0.12 * scale; g.add(ball);
  for (const sx of [-1, 1]) { const lan = new THREE.Mesh(new THREE.SphereGeometry(0.022 * scale, 8, 6), m.accent); lan.scale.y = 1.3; lan.position.set(sx * 0.16 * scale, 0.14 * scale, 0.2 * scale); g.add(lan); }
  return g;
}
function zuluGreatHut(scale: number, m: BM): THREE.Group {
  const g = new THREE.Group();
  const r = 0.2 * scale;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), m.thatch);
  dome.scale.y = 1.2; dome.castShadow = true; dome.receiveShadow = true; g.add(dome);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.7, 0.012 * scale, 6, 20), m.wood); ring.rotation.x = Math.PI / 2; ring.position.y = 0.02 * scale; g.add(ring);
  // wejscie
  const door = new THREE.Mesh(new THREE.BoxGeometry(r * 0.3, r * 0.4, 0.02 * scale), m.wood); door.position.set(0, r * 0.25, r * 0.96); g.add(door);
  return g;
}
function celticNemeton(scale: number, m: BM): THREE.Group {
  const g = new THREE.Group();
  const ringR = 0.17 * scale, n = 8;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const h = (0.14 + rnd(i, 7) * 0.06) * scale;
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.035 * scale, h, 0.028 * scale), m.stone); s.position.set(Math.cos(a) * ringR, h / 2, Math.sin(a) * ringR); s.rotation.y = a; s.castShadow = true; g.add(s); }
  // drewniany idol/totem w srodku
  const idol = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * scale, 0.035 * scale, 0.24 * scale, 6), m.wood); idol.position.y = 0.12 * scale; idol.castShadow = true; g.add(idol);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.06 * scale, 0.05 * scale, 0.06 * scale), m.wood); head.position.y = 0.26 * scale; g.add(head);
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.045 * scale, 0.05 * scale, 4), m.gold); top.position.y = 0.31 * scale; g.add(top);
  return g;
}
function germanHof(scale: number, m: BM): THREE.Group {
  const g = new THREE.Group();
  const W = 0.36 * scale, H = 0.12 * scale, D = 0.18 * scale;
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), m.wall); body.position.y = H / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const rr = D * 0.85;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, W * 1.08, 3, 1), m.thatch); roof.rotation.z = Math.PI / 2; roof.scale.y = (D * 1.3) / (1.5 * rr); roof.position.y = H + rr * 0.4; roof.castShadow = true; g.add(roof);
  // rzezbione slupy-idole przed wejsciem
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * scale, 0.024 * scale, 0.22 * scale, 6), m.wood); p.position.set(sx * W * 0.36, 0.11 * scale, D * 0.7); p.castShadow = true; g.add(p);
    const k = new THREE.Mesh(new THREE.BoxGeometry(0.05 * scale, 0.05 * scale, 0.05 * scale), m.accent); k.position.set(sx * W * 0.36, 0.24 * scale, D * 0.7); g.add(k); }
  return g;
}

/* ---------------- MURY ---------------- */
function stoneWall(spread: number, m: BM): THREE.Group {
  const g = new THREE.Group();
  const Rr = spread * 1.42, wallH = 0.18;
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(Rr, Rr * 1.03, wallH, 30, 1, true), mkS(0x9a8c70)); wall.position.y = wallH / 2; wall.castShadow = true; wall.receiveShadow = true; g.add(wall);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(Rr * 1.05, Rr * 1.05, 0.035, 30, 1, true), mkS(0x77694f)); rim.position.y = wallH; g.add(rim);
  const gate = new THREE.Mesh(new THREE.BoxGeometry(Rr * 0.16, wallH * 0.85, 0.06), mk(0x3a2c1a)); gate.position.set(0, wallH * 0.42, Rr * 1.02); g.add(gate);
  return g;
}
function palisadeWall(spread: number, m: BM): THREE.Group {
  const g = new THREE.Group();
  const Rr = spread * 1.42, n = 34, postH = 0.2;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2;
    if (Math.abs(((a + Math.PI) % (Math.PI * 2)) - Math.PI) < 0.18) continue; // brama z przodu
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, postH, 5), m.wood); p.position.set(Math.cos(a) * Rr, postH / 2, Math.sin(a) * Rr); p.castShadow = true; g.add(p);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.04, 5), m.wood); tip.position.set(Math.cos(a) * Rr, postH + 0.02, Math.sin(a) * Rr); g.add(tip); }
  return g;
}

/* ---------------- PALETY ---------------- */
function palette(civ: BronzeCiv, ownerCol: number): BM {
  const base = { stone: mk(0x9a8c70), stoneDk: mk(0x77694f), wood: mk(0x6b4f2a), owner: mk(ownerCol), thatch: mk(0xb89a5e), accent: mk(0xb5532f), gold: mk(0xd4af37), tile: mk(0xb5532f) };
  switch (civ) {
    case 'grecja':   return { ...base, wall: mk(0xe9e4d6), roof: mk(0xd9d3c2), roofDk: mk(0xc7c0ad), col: mk(0xf0ece1), accent: mk(0xc7c0ad) };
    case 'rzym':     return { ...base, wall: mk(0xe7ddc7), roof: mk(0xb5532f), roofDk: mk(0x8f3f22), col: mk(0xede6d6), tile: mk(0xb5532f) };
    case 'sumer':    return { ...base, wall: mk(0xc9a36b), roof: mk(0xbb8f57), roofDk: mk(0x9c763f), col: mk(0xc9a36b), stone: mk(0xc29a62), stoneDk: mk(0xa07c44), accent: mk(0xb07d4e) };
    case 'egipt':    return { ...base, wall: mk(0xd8c48f), roof: mk(0xcdb87e), roofDk: mk(0xb29a5c), col: mk(0xd8c48f), stone: mk(0xd2bd83), stoneDk: mk(0xb29a5c), accent: mk(0xcf9b4a), gold: mk(0xe6c64a) };
    case 'inka':     return { ...base, wall: mk(0x8f857a), roof: mk(0xc6a64e), roofDk: mk(0x6f665c), col: mk(0x8f857a), stone: mk(0x8a8076), stoneDk: mk(0x6f665c), thatch: mk(0xc6a64e), gold: mk(0xd4af37) };
    case 'aztek':    return { ...base, wall: mk(0x9a8f80), roof: mk(0x8a7f70), roofDk: mk(0x6b6457), col: mk(0x9a8f80), stone: mk(0x9a8f80), stoneDk: mk(0x726a5c), accent: mk(0xa83a2a), gold: mk(0x2f8f6f) };
    case 'chiny':    return { ...base, wall: mk(0xe7ddc7), roof: mk(0x55585c), roofDk: mk(0x3f4246), col: mk(0xb23a2a), stone: mk(0x9b9486), accent: mk(0xb23a2a), gold: mk(0xd9b441), tile: mk(0x55585c) };
    case 'zulu':     return { ...base, wall: mk(0x9c7b50), roof: mk(0xb89a5e), roofDk: mk(0x8a6a45), col: mk(0x9c7b50), thatch: mk(0xc2a766), wood: mk(0x6b4f2a), accent: mk(0x9c7b50) };
    case 'celtowie': return { ...base, wall: mk(0xcdbb95), roof: mk(0xb89a5e), roofDk: mk(0x8a6a45), col: mk(0xcdbb95), thatch: mk(0xb89a5e), stone: mk(0x9a8c70) };
    case 'germanie': return { ...base, wall: mk(0xb8a06a), roof: mk(0x8f7a45), roofDk: mk(0x6f5e34), col: mk(0xb8a06a), thatch: mk(0x8f7a45), accent: mk(0x8a3a2a) };
  }
}

/* ---------------- BUILDER ---------------- */
export function buildBronzeCity(civ: BronzeCiv, level: number, ownerCol: number, withWalls = false): THREE.Group {
  const L = Math.max(1, Math.min(10, Math.round(level)));
  const group = new THREE.Group();
  const m = palette(civ, ownerCol);
  const hutCount = [2, 3, 5, 7, 9, 12, 15, 18, 22, 26][L - 1]!;
  const spread = 0.13 + L * 0.05;
  const hutR = 0.06;
  const tScale = 0.8 + (L - 1) * 0.06;

  // CENTRUM: swiatynia per cyw
  const temple: Record<BronzeCiv, () => THREE.Group> = {
    grecja: () => greekTemple(tScale, m), rzym: () => romanTemple(tScale, m),
    sumer: () => ziggurat(tScale, m), egipt: () => pylonTemple(tScale, m),
    inka: () => incaTemple(tScale, m), aztek: () => aztecPyramid(tScale, m),
    chiny: () => chineseHall(tScale, m), zulu: () => zuluGreatHut(tScale, m),
    celtowie: () => celticNemeton(tScale, m), germanie: () => germanHof(tScale, m),
  };
  group.add(temple[civ]());

  // DOM per cyw
  const house = (idx: number, r: number): THREE.Group => {
    switch (civ) {
      case 'grecja': return boxHouse(r, idx, m.wall, m.roof, 0.1, 1.0);
      case 'rzym': return gabledHouse(r, idx, m.wall, m.roof);
      case 'sumer': case 'egipt': return boxHouse(r, idx, m.wall, m.roofDk, 0.06, 0.9);
      case 'inka': return gabledHouse(r, idx, m.wall, m.thatch);
      case 'aztek': return boxHouse(r, idx, m.wall, m.roofDk, 0.08, 0.85);
      case 'chiny': return chineseHouse(r, idx, m.wall, m.tile, m.accent);
      case 'zulu': return beehiveHut(r, idx, m.thatch);
      case 'celtowie': return (idx % 4 === 0) ? roundhouse(r, idx, m.wall, m.thatch) : celticHouse(r, idx, m.wall, m.thatch, m.wood);
      case 'germanie': return (idx % 5 === 0) ? longhouse(r, idx, m.wall, m.thatch) : roundhouse(r, idx, m.wall, m.thatch);
    }
  };

  let placed = 0;
  const rings: Array<[number, number]> = [[6, spread * 0.62], [10, spread * 0.9], [18, spread * 1.15]];
  for (const [cap, ringR] of rings) {
    const per = Math.min(hutCount - placed, cap);
    for (let i = 0; i < per; i++) {
      const ang = (i / per) * 6.2832 + rnd(placed, 1);
      const rr = ringR * (0.85 + rnd(placed, 2) * 0.3);
      const h = house(placed, hutR * (0.9 + rnd(placed, 3) * 0.3));
      h.position.set(Math.cos(ang) * rr, 0, Math.sin(ang) * rr);
      h.rotation.y = (civ === 'germanie' || civ === 'chiny')
        ? Math.atan2(-Math.sin(ang), -Math.cos(ang))       // dlugie domy/hale zwrocone do centrum
        : Math.round(rnd(placed, 4) * 4) * (Math.PI / 2);
      group.add(h); placed++;
    }
    if (placed >= hutCount) break;
  }

  // sztandar wodza (owner)
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.32, 6), m.wood); pole.position.set(spread * 0.95, 0.16, spread * 0.2); pole.castShadow = true; group.add(pole);
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.001, 0.05, 0.07), m.owner); flag.position.set(spread * 0.95, 0.3, spread * 0.2 + 0.04); group.add(flag);

  if (withWalls) {
    if (civ === 'celtowie') group.add(murusGallicus(spread, m));
    else if (civ === 'germanie') group.add(rampartPalisade(spread, m));
    else if (civ === 'zulu') group.add(palisadeWall(spread, m));
    else group.add(stoneWall(spread, m));
  }
  return group;
}
