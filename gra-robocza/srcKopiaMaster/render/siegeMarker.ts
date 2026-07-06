/**
 * siegeMarker.ts — wizualizacja oblężenia na mapie świata (MAPA/C3).
 * Dysk + pierścień nad terenem (jak highlight ruchu) + sprite ⚔.
 */

import * as THREE from 'three';
import type { GameMap } from '../types/map';
import type { SiegeMachineKind } from '../game/siegeMachines';
import { axialToWorld, HEX_R } from './hexutil';
import {
  buildSiegeCampGroup,
  DEFAULT_SIEGE_ATTACKER_COLOR,
} from './siegeCampModels';

const SIEGE_DISC_COLOR = 0xe74c3c;
const SIEGE_RING_COLOR = 0xff1744;
const MARKER_LIFT = 0.14;
const RING_LIFT = 0.16;
const SPRITE_LIFT = 1.35;

let geoDisc: THREE.CylinderGeometry | null = null;
let geoRing: THREE.RingGeometry | null = null;
let siegeTex: THREE.CanvasTexture | null = null;

function discGeo(): THREE.CylinderGeometry {
  if (!geoDisc) geoDisc = new THREE.CylinderGeometry(HEX_R * 0.88, HEX_R * 0.88, 0.035, 6);
  return geoDisc;
}

function ringGeo(): THREE.RingGeometry {
  if (!geoRing) geoRing = new THREE.RingGeometry(HEX_R * 0.78, HEX_R * 1.05, 6);
  return geoRing;
}

function siegeSpriteTexture(): THREE.CanvasTexture {
  if (!siegeTex) {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 128, 128);
    ctx.font = 'bold 96px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u2694', 64, 70);
    siegeTex = new THREE.CanvasTexture(c);
  }
  return siegeTex;
}

export interface SiegeMarkerSyncOptions {
  getTopY: (q: number, r: number) => number;
  /** cityId -> hex keys obozów (jednostki oblegające obok miasta) */
  campHexesByCity?: Map<string, string[]>;
  /** OBL-S6: hexKey -> gotowe machiny (City.siegeMachines.ready rozdzielone po obozach) */
  machinesByCampHex?: Map<string, SiegeMachineKind[]>;
  /** ownerId atakującego -> kolor (opcjonalnie) */
  ownerColorById?: Map<number, number>;
  /** hexKey -> ownerId oblegającego (opcjonalnie; bez tego = DEFAULT_SIEGE_ATTACKER_COLOR) */
  campOwnerByHex?: Map<string, number>;
}

interface CityMarkerGroup {
  group: THREE.Group;
  disc: THREE.Mesh;
  ring: THREE.Mesh;
  sprite: THREE.Sprite;
  campGroups: THREE.Group[];
}

export class SiegeMarkerRenderer {
  private scene: THREE.Scene;
  private markers = new Map<string, CityMarkerGroup>();
  private sharedMats: THREE.Material[] = [];

  constructor(scene: THREE.Scene, _map: GameMap) {
    this.scene = scene;
  }

  private matDisc(): THREE.MeshBasicMaterial {
    const m = new THREE.MeshBasicMaterial({
      color: SIEGE_DISC_COLOR,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      depthTest: false,
    });
    this.sharedMats.push(m);
    return m;
  }

  private matRing(): THREE.MeshBasicMaterial {
    const m = new THREE.MeshBasicMaterial({
      color: SIEGE_RING_COLOR,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
    });
    this.sharedMats.push(m);
    return m;
  }

  private buildGroup(): CityMarkerGroup {
    const group = new THREE.Group();
    group.renderOrder = 80;

    const disc = new THREE.Mesh(discGeo(), this.matDisc());
    disc.renderOrder = 81;
    group.add(disc);

    const ring = new THREE.Mesh(ringGeo(), this.matRing());
    ring.rotation.x = -Math.PI / 2;
    ring.renderOrder = 82;
    group.add(ring);

    const spriteMat = new THREE.SpriteMaterial({
      map: siegeSpriteTexture(),
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    this.sharedMats.push(spriteMat);
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.35, 1.35, 1);
    sprite.renderOrder = 90;
    group.add(sprite);

    this.scene.add(group);
    return { group, disc, ring, sprite, campGroups: [] };
  }

  private placeCityMarker(
    entry: CityMarkerGroup,
    q: number,
    r: number,
    getTopY: (q: number, r: number) => number,
  ): void {
    const { x, z } = axialToWorld(q, r, HEX_R);
    const topY = getTopY(q, r);
    entry.group.position.set(x, 0, z);
    entry.disc.position.set(0, topY + MARKER_LIFT, 0);
    entry.ring.position.set(0, topY + RING_LIFT, 0);
    entry.sprite.position.set(0, topY + SPRITE_LIFT, 0);
  }

  sync(
    obleganeCityIds: Set<string>,
    cityPositions: Map<string, { q: number; r: number }>,
    options: SiegeMarkerSyncOptions,
  ): void {
    const getTopY = options.getTopY;

    for (const id of obleganeCityIds) {
      const pos = cityPositions.get(id);
      if (!pos) continue;

      let entry = this.markers.get(id);
      if (!entry) {
        entry = this.buildGroup();
        this.markers.set(id, entry);
      }

      this.placeCityMarker(entry, pos.q, pos.r, getTopY);

      for (const cg of entry.campGroups) {
        entry.group.remove(cg);
        cg.traverse(obj => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material.dispose();
          }
        });
      }
      entry.campGroups = [];

      const camps = options.campHexesByCity?.get(id) ?? [];
      const cityPos = pos;
      for (const hk of camps) {
        const parts = hk.split(',');
        if (parts.length !== 2) continue;
        const cq = parseInt(parts[0]!, 10);
        const cr = parseInt(parts[1]!, 10);
        if (isNaN(cq) || isNaN(cr)) continue;

        const ownerId = options.campOwnerByHex?.get(hk) ?? 0;
        const attackerColor =
          options.ownerColorById?.get(ownerId) ?? DEFAULT_SIEGE_ATTACKER_COLOR;
        const ready = options.machinesByCampHex?.get(hk);

        const dx = cityPos.q - cq;
        const dz = cityPos.r - cr;
        const camp3d = buildSiegeCampGroup({
          attackerColor,
          readyMachines: ready,
          faceDirX: dx,
          faceDirZ: dz,
        });

        const { x: cx, z: cz } = axialToWorld(cq, cr, HEX_R);
        camp3d.position.set(
          cx - entry.group.position.x,
          getTopY(cq, cr) + MARKER_LIFT * 0.5,
          cz - entry.group.position.z,
        );
        camp3d.renderOrder = 85;
        entry.group.add(camp3d);
        entry.campGroups.push(camp3d);
      }
    }

    for (const [id, entry] of this.markers) {
      if (!obleganeCityIds.has(id)) {
        this.scene.remove(entry.group);
        for (const cg of entry.campGroups) {
          cg.traverse(obj => {
            if (obj instanceof THREE.Mesh) {
              obj.geometry.dispose();
              if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
              else obj.material.dispose();
            }
          });
        }
        this.markers.delete(id);
      }
    }
  }

  /** Delikatne pulsowanie pierścienia (wywołuj w pętli render). */
  pulse(timeSec: number): void {
    const pulse = 0.78 + 0.22 * Math.sin(timeSec * 3.2);
    for (const entry of this.markers.values()) {
      entry.ring.scale.set(pulse, pulse, 1);
      const sm = entry.sprite.material as THREE.SpriteMaterial;
      sm.opacity = 0.82 + 0.18 * Math.sin(timeSec * 2.4);
    }
  }

  dispose(): void {
    for (const [, entry] of this.markers) {
      this.scene.remove(entry.group);
      for (const cg of entry.campGroups) {
        cg.traverse(obj => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material.dispose();
          }
        });
      }
    }
    this.markers.clear();
    for (const m of this.sharedMats) m.dispose();
    this.sharedMats.length = 0;
    if (siegeTex) {
      siegeTex.dispose();
      siegeTex = null;
    }
  }
}
