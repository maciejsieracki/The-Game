/**
 * cities.ts
 * Renders low-poly settlement models on the hex map, one per City.
 *
 * Model anatomy (all sizes relative to HEX_R):
 *   1. Base platform  -- flat CylinderGeometry, stone grey 0x9b9b8a
 *   2. Houses x3      -- BoxGeometry body (tan/adobe 0xcda77a) +
 *                        pitched roof (BoxGeometry scaled thin, rotated 45 deg, terracotta 0xb5532f)
 *   3. Temple         -- larger BoxGeometry body (stone grey) + 4-sided ConeGeometry roof (owner color)
 *   4. Flag pole      -- thin CylinderGeometry (grey)
 *   5. Flag           -- small ConeGeometry (owner color)
 *
 * City footprint: ~0.6 * HEX_R radius. Clearly visible from steep top-down camera.
 *
 * Owner color palette (same indices as units.ts):
 *   0 = gold 0xffd54a, 1 = red, 2 = green, 3 = blue,
 *   4 = orange, 5 = purple, 6 = teal, 7 = pink
 */

import * as THREE from 'three';
import type { City } from '../game/cities';
import type { GameMap } from '../types/map';
import type { Hex } from '../types/hex';
import { TerenBazowy } from '../types/hex';
import { axialToWorld, HEX_R } from './hexutil';

// ---------------------------------------------------------------------------
// Terrain top-Y table -- MUST match TERRAIN_VISUALS in scene.ts
// topY = height + yOffset
// ---------------------------------------------------------------------------

interface TerrainTopY {
  height: number;
  yOffset: number;
}

const TERRAIN_TOP: Record<TerenBazowy, TerrainTopY> = {
  [TerenBazowy.Morze]:    { height: 0.30, yOffset: 0.00 },
  [TerenBazowy.Wybrzeze]: { height: 0.35, yOffset: 0.05 },
  [TerenBazowy.Laka]:     { height: 0.40, yOffset: 0.05 },
  [TerenBazowy.Rownina]:  { height: 0.45, yOffset: 0.08 },
  [TerenBazowy.Pustynia]: { height: 0.40, yOffset: 0.05 },
  [TerenBazowy.Wzgorza]:  { height: 0.70, yOffset: 0.15 },
  [TerenBazowy.Gory]:     { height: 1.20, yOffset: 0.40 },
};

function terrainTopY(hex: Hex): number {
  const tv = TERRAIN_TOP[hex.terenBazowy];
  return tv.height + tv.yOffset;
}

// ---------------------------------------------------------------------------
// Owner color palette
// ---------------------------------------------------------------------------

const OWNER_COLORS: number[] = [
  0xffd54a, // 0 = player (gold)
  0xe53935, // 1 = red
  0x43a047, // 2 = green
  0x1e88e5, // 3 = blue
  0xfb8c00, // 4 = orange
  0x8e24aa, // 5 = purple
  0x00acc1, // 6 = teal
  0xf06292, // 7 = pink
];

function ownerColor(ownerId: number): number {
  return OWNER_COLORS[ownerId % OWNER_COLORS.length]!;
}

// ---------------------------------------------------------------------------
// Settlement colors
// ---------------------------------------------------------------------------

const COLOR_PLATFORM = 0x9b9b8a; // stone grey base platform
const COLOR_HOUSE    = 0xcda77a; // tan/adobe house walls
const COLOR_ROOF     = 0xb5532f; // terracotta house roofs
const COLOR_TEMPLE   = 0x8a8a7a; // slightly darker stone grey for temple body
const COLOR_POLE     = 0xaaaaaa; // grey flag pole

// ---------------------------------------------------------------------------
// Size constants (world units, HEX_R = 1.0)
// Footprint radius ~0.6 * HEX_R
// ---------------------------------------------------------------------------

const R = HEX_R;

// Base platform (flat cylinder, 6-sided to echo the hex)
const PLATFORM_RADIUS = 0.55 * R;
const PLATFORM_HEIGHT = 0.04 * R;

// House body box (width x height x depth)
const HOUSE_W = 0.18 * R;
const HOUSE_H = 0.16 * R;
const HOUSE_D = 0.18 * R;

// House roof (thin box rotated 45 deg on X, same footprint but wider/taller)
const ROOF_W  = 0.20 * R;
const ROOF_H  = 0.12 * R;
const ROOF_D  = 0.20 * R;

// Houses are arranged in a triangle around the centre
const HOUSE_DIST = 0.28 * R; // radial distance from centre

// Temple body
const TEMPLE_W = 0.24 * R;
const TEMPLE_H = 0.24 * R;
const TEMPLE_D = 0.24 * R;

// Temple roof (4-sided cone = ConeGeometry with 4 radial segments)
const TEMPLE_ROOF_RADIUS = 0.17 * R;
const TEMPLE_ROOF_HEIGHT = 0.20 * R;

// Flag pole
const POLE_RADIUS = 0.010 * R;
const POLE_HEIGHT = 0.55 * R;

// Flag (small cone at top of pole)
const FLAG_RADIUS = 0.07 * R;
const FLAG_HEIGHT = 0.10 * R;

// Small lift above hex surface so the model sits cleanly on top
const CITY_LIFT = 0.008 * R;

// ---------------------------------------------------------------------------
// City model builder
// ---------------------------------------------------------------------------

interface CityModelResult {
  group: THREE.Group;
  mats:  THREE.Material[];
}

function buildCityModel(ownerCol: number): CityModelResult {
  const group = new THREE.Group();
  const mats: THREE.Material[] = [];

  function mat(color: number): THREE.MeshLambertMaterial {
    const m = new THREE.MeshLambertMaterial({ color });
    mats.push(m);
    return m;
  }

  const matPlatform   = mat(COLOR_PLATFORM);
  const matHouseWall  = mat(COLOR_HOUSE);
  const matHouseRoof  = mat(COLOR_ROOF);
  const matTempleBody = mat(COLOR_TEMPLE);
  const matTempleRoof = mat(ownerCol);
  const matPole       = mat(COLOR_POLE);
  const matFlag       = mat(ownerCol);

  // ---- Base platform ----
  const gPlatform = new THREE.CylinderGeometry(PLATFORM_RADIUS, PLATFORM_RADIUS, PLATFORM_HEIGHT, 6, 1);
  const mPlatform = new THREE.Mesh(gPlatform, matPlatform);
  mPlatform.position.y = PLATFORM_HEIGHT * 0.5;
  group.add(mPlatform);

  // Y level of the top surface of the platform
  const platformTop = PLATFORM_HEIGHT;

  // ---- Three houses arranged in a triangle ----
  const gHouseBody = new THREE.BoxGeometry(HOUSE_W, HOUSE_H, HOUSE_D);
  const gHouseRoof = new THREE.BoxGeometry(ROOF_W, ROOF_H, ROOF_D);

  const houseAngles = [Math.PI * 0.0, Math.PI * (2.0 / 3.0), Math.PI * (4.0 / 3.0)];

  for (const angle of houseAngles) {
    const hx = Math.cos(angle) * HOUSE_DIST;
    const hz = Math.sin(angle) * HOUSE_DIST;

    // House body
    const body = new THREE.Mesh(gHouseBody, matHouseWall);
    body.position.set(hx, platformTop + HOUSE_H * 0.5, hz);
    group.add(body);

    // Pitched roof: a thin box rotated 45 deg around X to form a ridge
    const roof = new THREE.Mesh(gHouseRoof, matHouseRoof);
    roof.position.set(hx, platformTop + HOUSE_H + ROOF_H * 0.35, hz);
    roof.rotation.x = Math.PI * 0.25; // 45-degree tilt = pitched roof silhouette
    group.add(roof);
  }

  // ---- Central temple ----
  const gTempleBody = new THREE.BoxGeometry(TEMPLE_W, TEMPLE_H, TEMPLE_D);
  const mTemple = new THREE.Mesh(gTempleBody, matTempleBody);
  mTemple.position.y = platformTop + TEMPLE_H * 0.5;
  group.add(mTemple);

  const templeTop = platformTop + TEMPLE_H;

  // 4-sided pyramid roof (ConeGeometry with 4 segments = square base)
  const gTempleRoof = new THREE.ConeGeometry(TEMPLE_ROOF_RADIUS, TEMPLE_ROOF_HEIGHT, 4, 1);
  const mTempleRoof = new THREE.Mesh(gTempleRoof, matTempleRoof);
  mTempleRoof.position.y = templeTop + TEMPLE_ROOF_HEIGHT * 0.5;
  mTempleRoof.rotation.y = Math.PI * 0.25; // align pyramid corners to cardinal axes
  group.add(mTempleRoof);

  // ---- Flag pole (mounted on temple roof peak) ----
  const poleBase = templeTop + TEMPLE_ROOF_HEIGHT;
  const gPole = new THREE.CylinderGeometry(POLE_RADIUS, POLE_RADIUS, POLE_HEIGHT, 5, 1);
  const mPole = new THREE.Mesh(gPole, matPole);
  mPole.position.y = poleBase + POLE_HEIGHT * 0.5;
  group.add(mPole);

  // ---- Flag (owner-color cone at top of pole) ----
  const gFlag = new THREE.ConeGeometry(FLAG_RADIUS, FLAG_HEIGHT, 4, 1);
  const mFlag = new THREE.Mesh(gFlag, matFlag);
  mFlag.position.y = poleBase + POLE_HEIGHT + FLAG_HEIGHT * 0.5;
  // Tilt flag slightly to the side so it reads as a flag from top-down
  mFlag.rotation.z = Math.PI * 0.5;
  mFlag.position.x = FLAG_RADIUS * 0.5;
  group.add(mFlag);

  // Store all per-instance geometries for disposal
  // (gHouseBody / gHouseRoof are shared across the 3 houses in this group
  //  but are not singletons across groups, so we own them here)
  group.userData['mats']         = mats;
  group.userData['perCityGeos']  = [gPlatform, gHouseBody, gHouseRoof, gTempleBody, gTempleRoof, gPole, gFlag];

  return { group, mats };
}

// ---------------------------------------------------------------------------
// CityRenderer
// ---------------------------------------------------------------------------

export class CityRenderer {
  private scene:   THREE.Scene;

  /** Fast hex lookup by "q,r" key. */
  private hexGrid: Map<string, Hex>;

  /** Active city models keyed by city.id. */
  private models: Map<string, THREE.Group> = new Map();

  /** Per-model materials for disposal. */
  private modelMaterials: Map<string, THREE.Material[]> = new Map();

  /** Per-model unique geometries for disposal. */
  private modelGeos: Map<string, THREE.BufferGeometry[]> = new Map();

  constructor(scene: THREE.Scene, map: GameMap) {
    this.scene   = scene;
    this.hexGrid = new Map<string, Hex>(Object.entries(map.hexes));
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * Synchronise rendered settlement models with the current city list.
   * Reuses existing models by city.id; creates new ones; removes stale ones.
   * City position = axialToWorld(city.lokalizacja.q, city.lokalizacja.r, HEX_R),
   * Y = terrainTopY(hex at that position) + CITY_LIFT.
   */
  sync(cities: City[]): void {
    const presentIds = new Set<string>();

    for (const city of cities) {
      presentIds.add(city.id);

      const q = city.q;
      const r = city.r;
      const key = `${q},${r}`;

      const hex   = this.hexGrid.get(key);
      const topY  = hex ? terrainTopY(hex) : 0;
      const yBase = topY + CITY_LIFT;

      if (this.models.has(city.id)) {
        // Reposition existing model (in case city somehow moved)
        const grp = this.models.get(city.id)!;
        const { x, z } = axialToWorld(q, r, HEX_R);
        grp.position.set(x, yBase, z);
      } else {
        // Build new settlement model
        const ownerIndex = city.ownerId;
        const col        = ownerColor(ownerIndex);
        const { group }  = buildCityModel(col);

        const { x, z } = axialToWorld(q, r, HEX_R);
        group.position.set(x, yBase, z);
        group.userData['cityId'] = city.id;

        this._registerModel(city.id, group);
        this.scene.add(group);
      }
    }

    // Remove models for cities that no longer exist
    for (const [id, grp] of this.models) {
      if (!presentIds.has(id)) {
        this.scene.remove(grp);
        this._disposeModel(id);
        this.models.delete(id);
        this.modelMaterials.delete(id);
        this.modelGeos.delete(id);
      }
    }
  }

  /** Remove all city models from the scene and dispose GPU resources. */
  dispose(): void {
    for (const [id, grp] of this.models) {
      this.scene.remove(grp);
      this._disposeModel(id);
    }
    this.models.clear();
    this.modelMaterials.clear();
    this.modelGeos.clear();
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  /**
   * Convert a string ownerId to a numeric palette index.
   * Interprets numeric strings directly (e.g. "0", "1").
   * Falls back to a stable hash for arbitrary string ids.
   */
  private _ownerIndex(ownerId: string): number {
    const n = parseInt(ownerId, 10);
    if (!isNaN(n) && n >= 0) return n;
    // Simple stable hash for non-numeric ids
    let h = 0;
    for (let i = 0; i < ownerId.length; i++) {
      h = (Math.imul(h, 31) + ownerId.charCodeAt(i)) >>> 0;
    }
    return h % OWNER_COLORS.length;
  }

  private _registerModel(id: string, group: THREE.Group): void {
    this.models.set(id, group);
    this.modelMaterials.set(id, (group.userData['mats'] as THREE.Material[]) ?? []);
    this.modelGeos.set(id, (group.userData['perCityGeos'] as THREE.BufferGeometry[]) ?? []);
  }

  private _disposeModel(id: string): void {
    const mats = this.modelMaterials.get(id) ?? [];
    for (const m of mats) m.dispose();
    const geos = this.modelGeos.get(id) ?? [];
    for (const g of geos) g.dispose();
  }
}
