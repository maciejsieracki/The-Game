/**
 * siegeCampModels.ts — modele 3D obozu oblężniczego (OBL-S6, źródło: siegepreview).
 * Lane MAPA · używane przez SiegeMarkerRenderer.
 */
import * as THREE from 'three';
import type { SiegeMachineKind } from '../game/siegeMachines';

const CAMP_SCALE = 0.42;

function mk(c: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color: c });
}

export function makeSiegeSoldiers(count: number, color: number): THREE.Group {
  const g = new THREE.Group();
  const mat = mk(color);
  const helmetMat = mk(0x888888);
  for (let i = 0; i < count; i++) {
    const sx = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.1, 0.04), mat);
    body.position.y = 0.05;
    body.castShadow = true;
    sx.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), mat);
    head.position.y = 0.135;
    head.castShadow = true;
    sx.add(head);
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.034, 0.02, 6), helmetMat);
    helm.position.y = 0.155;
    sx.add(helm);
    const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.22, 4), mk(0x6b4f2a));
    spear.position.set(0.04, 0.11, 0);
    sx.add(spear);
    sx.position.set((i - (count - 1) / 2) * 0.13, 0, 0);
    g.add(sx);
  }
  return g;
}

export function makeSiegeRam(): THREE.Group {
  const g = new THREE.Group();
  const woodMat = mk(0x6b4f2a);
  const roofMat = mk(0x8a6a3a);
  const metalMat = mk(0x555555);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.1), woodMat);
  body.position.y = 0.07;
  body.castShadow = true;
  g.add(body);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 3, 1), roofMat);
  roof.rotation.z = Math.PI / 2;
  roof.scale.y = 0.62;
  roof.position.y = 0.135;
  roof.castShadow = true;
  g.add(roof);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6), woodMat);
  beam.rotation.z = Math.PI / 2;
  beam.position.set(0.1, 0.07, 0);
  beam.castShadow = true;
  g.add(beam);
  const ramHead = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), metalMat);
  ramHead.position.set(0.22, 0.07, 0);
  g.add(ramHead);
  for (const xs of [-1, 1] as const) {
    for (const zs of [-1, 1] as const) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.015, 8), mk(0x3a2c1a));
      w.rotation.z = Math.PI / 2;
      w.position.set(xs * 0.07, 0.022, zs * 0.04);
      g.add(w);
    }
  }
  return g;
}

export function makeSiegeTower(): THREE.Group {
  const g = new THREE.Group();
  const woodMat = mk(0x6b4f2a);
  const planks = mk(0x7a5c32);
  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.34, 0.09), woodMat);
  tower.position.y = 0.17;
  tower.castShadow = true;
  g.add(tower);
  for (let i = 0; i < 3; i++) {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.012, 0.095), planks);
    floor.position.y = 0.05 + i * 0.11;
    g.add(floor);
  }
  const roofTop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.015, 0.1), planks);
  roofTop.position.y = 0.34;
  g.add(roofTop);
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.01, 0.15), planks);
  ramp.rotation.x = -0.45;
  ramp.position.set(0, 0.26, 0.09);
  ramp.castShadow = true;
  g.add(ramp);
  for (const xs of [-1, 1] as const) {
    for (const zs of [-1, 1] as const) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.015, 8), mk(0x3a2c1a));
      w.rotation.z = Math.PI / 2;
      w.position.set(xs * 0.038, 0.022, zs * 0.035);
      g.add(w);
    }
  }
  return g;
}

function makeTent(color: number): THREE.Group {
  const g = new THREE.Group();
  const mat = mk(color);
  const tent = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.16, 4), mat);
  tent.position.y = 0.08;
  tent.rotation.y = Math.PI / 4;
  tent.castShadow = true;
  g.add(tent);
  return g;
}

export interface SiegeCampBuildOpts {
  attackerColor: number;
  readyMachines?: SiegeMachineKind[];
  faceDirX: number;
  faceDirZ: number;
}

export function buildSiegeCampGroup(opts: SiegeCampBuildOpts): THREE.Group {
  const root = new THREE.Group();
  root.scale.setScalar(CAMP_SCALE);

  const angle = Math.atan2(opts.faceDirX, opts.faceDirZ);
  root.rotation.y = angle;

  const tentColor = (opts.attackerColor & 0xfefefe) >> 1;
  const t1 = makeTent(tentColor);
  t1.position.set(-0.2, 0, -0.08);
  root.add(t1);
  const t2 = makeTent(tentColor);
  t2.position.set(0.18, 0, 0.1);
  root.add(t2);

  const soldiers = makeSiegeSoldiers(4, opts.attackerColor);
  soldiers.position.set(0, 0, 0.05);
  root.add(soldiers);

  const machines = opts.readyMachines ?? [];
  let mx = -0.35;
  for (const kind of machines) {
    const m = kind === 'taran' ? makeSiegeRam() : makeSiegeTower();
    m.position.set(mx, 0, 0.28);
    root.add(m);
    mx += 0.38;
  }
  if (machines.length === 0) {
    const ram = makeSiegeRam();
    ram.position.set(0, 0, 0.32);
    root.add(ram);
  }

  return root;
}

export const DEFAULT_SIEGE_ATTACKER_COLOR = 0xc42020;
