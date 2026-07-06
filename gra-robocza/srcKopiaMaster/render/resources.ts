/**
 * resources.ts (Grupa A / MAPA — render)
 * Male NAKLADKI surowcowe na heksie (mniejsze niz jednostka), dekoracja terenu:
 * kon, owca, krowa(bydlo), lama + glina (dzbany) + ruda (skaly). Wg enum Nakladka.
 */
import * as THREE from 'three';
import { Nakladka } from '../types/hex';

const mat = (c: number) => new THREE.MeshLambertMaterial({ color: c });

function legsAt(g: THREE.Group, col: THREE.Material, h: number, lx: number, lz: number): void {
  for (const sx of [lx, -lx]) for (const sz of [lz, -lz]) {
    const lg = new THREE.Mesh(new THREE.BoxGeometry(0.012, h, 0.012), col);
    lg.position.set(sx, h / 2, sz); lg.castShadow = true; g.add(lg);
  }
}

function horse(): THREE.Group {
  const g = new THREE.Group();
  const brown = mat(0x8b5a2b);
  const dark = mat(0x3f2c1a);
  const black = mat(0x141010);
  const hoof = mat(0x1a1410);
  for (const [lx, lz] of [[0.05, 0.03], [0.05, -0.03], [-0.05, 0.03], [-0.05, -0.03]] as const) {
    const lg = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.055, 0.012), dark);
    lg.position.set(lx, 0.028, lz);
    lg.castShadow = true;
    g.add(lg);
    const hf = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.012, 0.014), hoof);
    hf.position.set(lx, 0.006, lz);
    g.add(hf);
  }
  const bodyY = 0.078;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.048, 0.058), brown);
  body.position.set(0, bodyY, 0);
  body.castShadow = true;
  g.add(body);
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.052, 0.05), brown);
  chest.position.set(0.04, bodyY + 0.004, 0);
  g.add(chest);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.095, 0.048), brown);
  neck.position.set(0.075, bodyY + 0.02, 0);
  g.add(neck);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.044, 0.048), brown);
  head.position.set(0.155, bodyY + 0.088, 0);
  g.add(head);
  const mane = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.012, 0.014), black);
  mane.position.set(0.118, bodyY + 0.118, -0.014);
  g.add(mane);
  const tail1 = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.045, 0.01), black);
  tail1.position.set(-0.095, bodyY + 0.028, 0.018);
  g.add(tail1);
  const tail2 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.058, 0.009), black);
  tail2.position.set(-0.118, bodyY + 0.008, 0.024);
  g.add(tail2);
  const tail3 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.052, 0.008), black);
  tail3.position.set(-0.136, bodyY - 0.012, 0.028);
  g.add(tail3);
  return g;
}
function sheep(): THREE.Group {
  const g = new THREE.Group(); const wool = mat(0xefe9df), dark = mat(0x3a342c);
  legsAt(g, dark, 0.035, 0.035, 0.02);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), wool); body.scale.set(1.3, 0.9, 1.0); body.position.y = 0.075; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.028), dark); head.position.set(0.07, 0.08, 0); g.add(head);
  return g;
}
function cow(): THREE.Group {
  const g = new THREE.Group(); const b0 = mat(0x6b4a2b), white = mat(0xeae3d6), dark = mat(0x2e231a);
  legsAt(g, dark, 0.05, 0.045, 0.022);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.065), b0); body.position.y = 0.08; body.castShadow = true; g.add(body);
  const patch = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.062, 0.067), white); patch.position.set(0.02, 0.08, 0); g.add(patch);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, 0.04), b0); head.position.set(0.092, 0.095, 0); g.add(head);
  for (const sz of [0.016, -0.016]) { const horn = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.022, 4), white); horn.position.set(0.092, 0.12, sz); g.add(horn); }
  return g;
}
function llama(): THREE.Group {
  const g = new THREE.Group(); const tan = mat(0xc9a877), dark = mat(0x6b5436);
  legsAt(g, dark, 0.06, 0.035, 0.02);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.05, 0.05), tan); body.position.y = 0.085; body.castShadow = true; g.add(body);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.08, 0.03), tan); neck.position.set(0.05, 0.14, 0); g.add(neck);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.028), tan); head.position.set(0.06, 0.185, 0); g.add(head);
  return g;
}
function clayPots(): THREE.Group {
  const g = new THREE.Group(); const clay = mat(0xb5774a), clayDk = mat(0x8a5733);
  const spots: Array<[number, number, number]> = [[0, 0, 1.0], [0.05, 0.03, 0.7], [-0.04, 0.04, 0.6]];
  for (const [px, pz, s] of spots) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * s, 0.022 * s, 0.05 * s, 8), clay);
    pot.position.set(px, 0.025 * s, pz); pot.castShadow = true; g.add(pot);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.028 * s, 0.006 * s, 5, 8), clayDk);
    rim.position.set(px, 0.05 * s, pz); rim.rotation.x = Math.PI / 2; g.add(rim);
  }
  return g;
}
function oreRocks(): THREE.Group {
  const g = new THREE.Group(); const rock = mat(0x6e6e76), ore = mat(0xb08d3a);
  const spots: Array<[number, number, number]> = [[0, 0, 1.0], [0.05, 0.02, 0.7], [-0.03, 0.04, 0.65]];
  for (const [px, pz, s] of spots) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.035 * s, 0), rock);
    r.position.set(px, 0.03 * s, pz); r.rotation.set(px * 3, pz * 5, s); r.castShadow = true; g.add(r);
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.012 * s, 0.012 * s, 0.012 * s), ore);
    v.position.set(px + 0.012, 0.045 * s, pz); g.add(v);
  }
  return g;
}

export function buildResourceOverlay(nakladka: Nakladka): THREE.Group | null {
  switch (nakladka) {
    case Nakladka.ZlozeKonia: return horse();
    case Nakladka.ZlozeOwiec: return sheep();
    case Nakladka.ZlozeBydla: return cow();
    case Nakladka.ZlozeLamy:  return llama();
    case Nakladka.ZlozeGliny: return clayPots();
    case Nakladka.ZlozeRudy:  return oreRocks();
    default: return null;
  }
}
