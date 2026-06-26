/**
 * units.ts
 * Renders unit tokens and movement-range highlight discs on the hex map.
 *
 * Token visual (low-poly settler figure):
 *   Total height ~0.45 * HEX_R standing on the hex surface.
 *   Parts (bottom to top):
 *     - Dark base disc        (CylinderGeometry, 8 sides) -- grounding shadow
 *     - Legs x2              (CylinderGeometry, tapered)  -- dark brown 0x5b4636
 *     - Torso                (CylinderGeometry, tapered)  -- OWNER color
 *     - Head                 (SphereGeometry 8x6)         -- skin 0xe0ac69
 *     - Hat brim             (CylinderGeometry, wide flat) -- neutral 0x3e2a1a
 *     - Hat crown            (CylinderGeometry, narrow)   -- neutral 0x3e2a1a
 *     - Hat band             (CylinderGeometry, thin ring) -- OWNER color
 *     - Banner pole          (CylinderGeometry, thin rod)  -- grey 0x888888
 *     - Banner flag          (ConeGeometry)               -- OWNER color
 *
 * Highlight visual:
 *   A flat hexagonal disc (CylinderGeometry, 6 sides, very short) rendered with
 *   a transparent MeshBasicMaterial at opacity 0.35, color 0x66ccff.
 *   Placed just above the terrain surface at topY(hex) + small lift.
 *
 * Route visual:
 *   A TubeGeometry along a CatmullRomCurve3 through hex centers (gold 0xffe27a,
 *   radius 0.05*HEX_R, opacity 0.9). Intermediate waypoints are SphereGeometry
 *   dots (radius 0.07*HEX_R, same gold). The destination hex gets a flat
 *   TorusGeometry ring (radius 0.13*HEX_R, tube 0.035*HEX_R, color 0xff8c00).
 */

import * as THREE from 'three';
import type { GameMap } from '../types/map';
import type { Hex } from '../types/hex';
import { TerenBazowy } from '../types/hex';
import { axialToWorld, HEX_R } from './hexutil';
import type { RuntimeUnit } from '../units/setup';

// ---------------------------------------------------------------------------
// Terrain top-Y table -- MUST match TERRAIN_VISUALS in scene.ts
// topY = height + yOffset  (top surface of the hex prism above y=0)
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
  // Prism center Y = height/2 + yOffset; TOP FACE = height + yOffset
  return tv.height + tv.yOffset;
}

// ---------------------------------------------------------------------------
// Owner color palette
// ---------------------------------------------------------------------------

/** Player 0 = gold/cyan so it reads clearly against terrain. */
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
// Token geometry constants (all in world units, HEX_R = 1.0)
// Settler figure: total height ~0.45 * HEX_R
// ---------------------------------------------------------------------------

const TOKEN_LIFT = 0.01 * HEX_R; // gap between hex surface and token base

// Base grounding disc
const BASE_DISC_RADIUS = 0.13 * HEX_R;
const BASE_DISC_HEIGHT = 0.012 * HEX_R;

// Legs (two short tapered cylinders, side by side)
const LEG_RADIUS_TOP    = 0.028 * HEX_R;
const LEG_RADIUS_BOT    = 0.022 * HEX_R;
const LEG_HEIGHT        = 0.09 * HEX_R;
const LEG_OFFSET_X      = 0.038 * HEX_R; // left/right spread

// Torso (tapered cylinder, owner color)
const TORSO_RADIUS_TOP  = 0.065 * HEX_R;
const TORSO_RADIUS_BOT  = 0.055 * HEX_R;
const TORSO_HEIGHT      = 0.12 * HEX_R;

// Head (low-poly sphere)
const HEAD_RADIUS       = 0.055 * HEX_R;

// Hat brim (wide flat cylinder)
const HAT_BRIM_RADIUS   = 0.095 * HEX_R;
const HAT_BRIM_HEIGHT   = 0.018 * HEX_R;

// Hat crown (narrow cylinder on top of brim)
const HAT_CROWN_RADIUS  = 0.055 * HEX_R;
const HAT_CROWN_HEIGHT  = 0.065 * HEX_R;

// Hat band (thin ring between brim and crown, owner color)
const HAT_BAND_HEIGHT   = 0.020 * HEX_R;

// Banner pole (thin rod beside the figure, owner-colored cone on top)
const POLE_RADIUS       = 0.012 * HEX_R;
const POLE_HEIGHT       = 0.28 * HEX_R;
const POLE_OFFSET_X     = 0.10 * HEX_R; // to the right of center
const BANNER_RADIUS     = 0.055 * HEX_R;
const BANNER_HEIGHT     = 0.07 * HEX_R;

// Computed Y positions (all relative to group origin = bottom of base disc)
const Y_DISC_CTR   = BASE_DISC_HEIGHT * 0.5;
const Y_LEGS_BOT   = BASE_DISC_HEIGHT;
const Y_LEGS_CTR   = Y_LEGS_BOT + LEG_HEIGHT * 0.5;
const Y_TORSO_BOT  = Y_LEGS_BOT + LEG_HEIGHT;
const Y_TORSO_CTR  = Y_TORSO_BOT + TORSO_HEIGHT * 0.5;
const Y_TORSO_TOP  = Y_TORSO_BOT + TORSO_HEIGHT;
const Y_HEAD_CTR   = Y_TORSO_TOP + HEAD_RADIUS * 0.9; // slight neck overlap
const Y_HEAD_TOP   = Y_TORSO_TOP + HEAD_RADIUS * 1.8;
const Y_BRIM_CTR   = Y_HEAD_TOP + HAT_BRIM_HEIGHT * 0.5;
const Y_BRIM_TOP   = Y_HEAD_TOP + HAT_BRIM_HEIGHT;
const Y_BAND_CTR   = Y_BRIM_TOP + HAT_BAND_HEIGHT * 0.5;
const Y_BAND_TOP   = Y_BRIM_TOP + HAT_BAND_HEIGHT;
const Y_CROWN_CTR  = Y_BAND_TOP + HAT_CROWN_HEIGHT * 0.5;
// Banner pole base at same level as torso bottom, pole extends upward
const Y_POLE_CTR   = Y_LEGS_BOT + POLE_HEIGHT * 0.5;
const Y_POLE_TOP   = Y_LEGS_BOT + POLE_HEIGHT;
const Y_BANNER_CTR = Y_POLE_TOP + BANNER_HEIGHT * 0.5;

// Colors (fixed)
const COLOR_LEGS    = 0x5b4636; // dark brown
const COLOR_SKIN    = 0xe0ac69; // skin tone
const COLOR_HAT     = 0x3e2a1a; // dark leather brown
const COLOR_POLE    = 0x888888; // grey metal

// Highlight
const HIGHLIGHT_RADIUS  = HEX_R * 0.88;
const HIGHLIGHT_HEIGHT  = 0.015 * HEX_R;
const HIGHLIGHT_LIFT    = 0.005 * HEX_R;
const HIGHLIGHT_COLOR   = 0x66ccff;
const HIGHLIGHT_OPACITY = 0.35;

// Route
const ROUTE_Y_LIFT  = 0.06 * HEX_R;  // float above terrain/tokens
const ROUTE_COLOR   = 0xffe27a;       // bright gold
const ROUTE_OPACITY = 0.9;
const TUBE_RADIUS   = 0.05 * HEX_R;
const TUBE_SEGMENTS = 64;
const DOT_RADIUS    = 0.07 * HEX_R;  // intermediate waypoint sphere
const DEST_TORUS_R  = 0.13 * HEX_R;  // destination ring -- main radius
const DEST_TUBE_R   = 0.035 * HEX_R; // destination ring -- tube radius
const DEST_COLOR    = 0xff8c00;       // strong orange-gold

// ---------------------------------------------------------------------------
// Shared geometry cache (created once, reused for all tokens)
// ---------------------------------------------------------------------------

let geoBaseDisc:   THREE.CylinderGeometry | null = null;
let geoLeg:        THREE.CylinderGeometry | null = null;
let geoTorso:      THREE.CylinderGeometry | null = null;
let geoHead:       THREE.SphereGeometry   | null = null;
let geoHatBrim:    THREE.CylinderGeometry | null = null;
let geoHatCrown:   THREE.CylinderGeometry | null = null;
let geoHatBand:    THREE.CylinderGeometry | null = null;
let geoPole:       THREE.CylinderGeometry | null = null;
let geoBanner:     THREE.ConeGeometry     | null = null;
let geoHighlight:  THREE.CylinderGeometry | null = null;

function getGeoBaseDisc():  THREE.CylinderGeometry { return (geoBaseDisc  ||= new THREE.CylinderGeometry(BASE_DISC_RADIUS,  BASE_DISC_RADIUS,  BASE_DISC_HEIGHT, 8,  1)); }
function getGeoLeg():       THREE.CylinderGeometry { return (geoLeg       ||= new THREE.CylinderGeometry(LEG_RADIUS_TOP,    LEG_RADIUS_BOT,    LEG_HEIGHT,       5,  1)); }
function getGeoTorso():     THREE.CylinderGeometry { return (geoTorso     ||= new THREE.CylinderGeometry(TORSO_RADIUS_TOP,  TORSO_RADIUS_BOT,  TORSO_HEIGHT,     6,  1)); }
function getGeoHead():      THREE.SphereGeometry   { return (geoHead      ||= new THREE.SphereGeometry(HEAD_RADIUS, 8, 6)); }
function getGeoHatBrim():   THREE.CylinderGeometry { return (geoHatBrim   ||= new THREE.CylinderGeometry(HAT_BRIM_RADIUS,   HAT_BRIM_RADIUS,   HAT_BRIM_HEIGHT,  12, 1)); }
function getGeoHatCrown():  THREE.CylinderGeometry { return (geoHatCrown  ||= new THREE.CylinderGeometry(HAT_CROWN_RADIUS,  HAT_CROWN_RADIUS,  HAT_CROWN_HEIGHT, 8,  1)); }
function getGeoHatBand():   THREE.CylinderGeometry { return (geoHatBand   ||= new THREE.CylinderGeometry(HAT_CROWN_RADIUS + 0.002 * HEX_R, HAT_CROWN_RADIUS + 0.002 * HEX_R, HAT_BAND_HEIGHT, 8, 1)); }
function getGeoPole():      THREE.CylinderGeometry { return (geoPole      ||= new THREE.CylinderGeometry(POLE_RADIUS,       POLE_RADIUS,       POLE_HEIGHT,      5,  1)); }
function getGeoBanner():    THREE.ConeGeometry     { return (geoBanner    ||= new THREE.ConeGeometry(BANNER_RADIUS, BANNER_HEIGHT, 5, 1)); }
function getGeoHighlight(): THREE.CylinderGeometry { return (geoHighlight ||= new THREE.CylinderGeometry(HIGHLIGHT_RADIUS,  HIGHLIGHT_RADIUS,  HIGHLIGHT_HEIGHT, 6,  1)); }

// ---------------------------------------------------------------------------
// Build a settler token Group for one unit
// ---------------------------------------------------------------------------

function buildTokenGroup(ownerCol: number): THREE.Group {
  const group = new THREE.Group();

  const matLegs   = new THREE.MeshLambertMaterial({ color: COLOR_LEGS });
  const matTorso  = new THREE.MeshLambertMaterial({ color: ownerCol });
  const matSkin   = new THREE.MeshLambertMaterial({ color: COLOR_SKIN });
  const matHat    = new THREE.MeshLambertMaterial({ color: COLOR_HAT });
  const matBand   = new THREE.MeshLambertMaterial({ color: ownerCol });
  const matPole   = new THREE.MeshLambertMaterial({ color: COLOR_POLE });
  const matBanner = new THREE.MeshLambertMaterial({ color: ownerCol });

  // Base grounding disc (very dark, semi-transparent shadow)
  const matBase = new THREE.MeshLambertMaterial({ color: 0x111111, transparent: true, opacity: 0.55 });
  const mBase = new THREE.Mesh(getGeoBaseDisc(), matBase);
  mBase.position.y = Y_DISC_CTR;
  group.add(mBase);

  // Left leg
  const mLegL = new THREE.Mesh(getGeoLeg(), matLegs);
  mLegL.position.set(-LEG_OFFSET_X, Y_LEGS_CTR, 0);
  group.add(mLegL);

  // Right leg
  const mLegR = new THREE.Mesh(getGeoLeg(), matLegs);
  mLegR.position.set(LEG_OFFSET_X, Y_LEGS_CTR, 0);
  group.add(mLegR);

  // Torso (owner color -- the main identity color)
  const mTorso = new THREE.Mesh(getGeoTorso(), matTorso);
  mTorso.position.y = Y_TORSO_CTR;
  group.add(mTorso);

  // Head (skin tone sphere, low-poly)
  const mHead = new THREE.Mesh(getGeoHead(), matSkin);
  mHead.position.y = Y_HEAD_CTR;
  group.add(mHead);

  // Hat brim (wide flat, dark leather)
  const mBrim = new THREE.Mesh(getGeoHatBrim(), matHat);
  mBrim.position.y = Y_BRIM_CTR;
  group.add(mBrim);

  // Hat band (owner color ring just above brim -- visible from above)
  const mBand = new THREE.Mesh(getGeoHatBand(), matBand);
  mBand.position.y = Y_BAND_CTR;
  group.add(mBand);

  // Hat crown (dark, narrow cylinder)
  const mCrown = new THREE.Mesh(getGeoHatCrown(), matHat);
  mCrown.position.y = Y_CROWN_CTR;
  group.add(mCrown);

  // Banner pole (to the right, slightly in front)
  const mPole = new THREE.Mesh(getGeoPole(), matPole);
  mPole.position.set(POLE_OFFSET_X, Y_POLE_CTR, -0.02 * HEX_R);
  group.add(mPole);

  // Banner flag (owner color cone at top of pole, pointing up)
  const mBanner = new THREE.Mesh(getGeoBanner(), matBanner);
  mBanner.position.set(POLE_OFFSET_X, Y_BANNER_CTR, -0.02 * HEX_R);
  group.add(mBanner);

  return group;
}

// ---------------------------------------------------------------------------
// UnitRenderer
// ---------------------------------------------------------------------------

export class UnitRenderer {
  private scene: THREE.Scene;

  /** Fast hex lookup by "q,r" key. */
  private hexGrid: Map<string, Hex>;

  /** Active unit tokens keyed by unit.id. */
  private tokens: Map<string, THREE.Object3D> = new Map();

  /** Materials created per token (stored for disposal). */
  private tokenMaterials: Map<string, THREE.Material[]> = new Map();

  /** Current highlight group (all discs live inside). */
  private highlightGroup: THREE.Group | null = null;

  /** Materials created for highlights (stored for disposal). */
  private highlightMaterials: THREE.MeshBasicMaterial[] = [];

  /** All Three.js objects in the current path route (tube + dots + destination marker). */
  private routeObjects: THREE.Object3D[] = [];

  constructor(scene: THREE.Scene, map: GameMap) {
    this.scene = scene;

    // Precompute "q,r" -> Hex lookup from GameMap.hexes (already keyed that way)
    this.hexGrid = new Map<string, Hex>(Object.entries(map.hexes));
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * Synchronise rendered tokens with the current unit list.
   * Call every frame or whenever units change position.
   * Snaps each token to its logical q,r (final resting position).
   */
  sync(units: RuntimeUnit[]): void {
    const presentIds = new Set<string>();

    for (const unit of units) {
      presentIds.add(unit.id);

      const key = `${unit.q},${unit.r}`;
      const hex = this.hexGrid.get(key);
      const topY = hex ? terrainTopY(hex) : 0;

      const yBase = topY + TOKEN_LIFT;

      if (this.tokens.has(unit.id)) {
        // Snap existing token to logical position
        const obj = this.tokens.get(unit.id)!;
        obj.position.set(
          axialToWorld(unit.q, unit.r, HEX_R).x,
          yBase,
          axialToWorld(unit.q, unit.r, HEX_R).z,
        );
      } else {
        // Create new token
        const color = ownerColor(unit.ownerId);
        const group = buildTokenGroup(color);

        const { x, z } = axialToWorld(unit.q, unit.r, HEX_R);
        group.position.set(x, yBase, z);
        group.userData['unitId'] = unit.id;

        // Collect materials for later disposal
        const mats: THREE.Material[] = [];
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const m = child.material;
            if (Array.isArray(m)) {
              mats.push(...m);
            } else {
              mats.push(m);
            }
          }
        });
        this.tokenMaterials.set(unit.id, mats);

        this.scene.add(group);
        this.tokens.set(unit.id, group);
      }
    }

    // Remove tokens whose units are gone
    for (const [id, obj] of this.tokens) {
      if (!presentIds.has(id)) {
        this.scene.remove(obj);
        this._disposeObject3D(obj, this.tokenMaterials.get(id) ?? []);
        this.tokens.delete(id);
        this.tokenMaterials.delete(id);
      }
    }
  }

  /**
   * Move a unit token to an arbitrary world position.
   * Used by the movement animator to tween the token along a path.
   * No-op if the unit id is not currently rendered.
   */
  setTokenWorldPosition(id: string, x: number, y: number, z: number): void {
    const obj = this.tokens.get(id);
    if (obj) {
      obj.position.set(x, y, z);
    }
  }

  /**
   * Return the terrain top Y for a hex at axial coordinates (q, r).
   * Returns height + yOffset, matching the value used by sync().
   * Returns 0 if the hex does not exist in the grid.
   * Used by the movement animator to compute the token Y along a path.
   */
  topYAt(q: number, r: number): number {
    const hex = this.hexGrid.get(`${q},${r}`);
    return hex ? terrainTopY(hex) : 0;
  }

  /**
   * Draw translucent hex discs over the given set of hexes.
   * Replaces any previously drawn highlights.
   * @param hexes Set of "q,r" coordinate keys to highlight.
   */
  setHighlight(hexes: Set<string>): void {
    this.clearHighlight();

    if (hexes.size === 0) return;

    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({
      color: HIGHLIGHT_COLOR,
      transparent: true,
      opacity: HIGHLIGHT_OPACITY,
      depthWrite: false,
    });
    this.highlightMaterials.push(mat);

    for (const key of hexes) {
      const parts = key.split(',');
      if (parts.length !== 2) continue;
      const q = parseInt(parts[0]!, 10);
      const r = parseInt(parts[1]!, 10);
      if (isNaN(q) || isNaN(r)) continue;

      const hex = this.hexGrid.get(key);
      const topY = hex ? terrainTopY(hex) : 0;

      const disc = new THREE.Mesh(getGeoHighlight(), mat);
      const { x, z } = axialToWorld(q, r, HEX_R);
      disc.position.set(x, topY + HIGHLIGHT_LIFT, z);
      group.add(disc);
    }

    this.scene.add(group);
    this.highlightGroup = group;
  }

  /** Remove all highlight discs. */
  clearHighlight(): void {
    if (this.highlightGroup) {
      this.scene.remove(this.highlightGroup);
      // Meshes share one material; dispose just the material(s)
      for (const m of this.highlightMaterials) {
        m.dispose();
      }
      this.highlightMaterials = [];
      this.highlightGroup = null;
    }
  }

  /**
   * Draw a movement route line from hexes[0] to hexes[hexes.length-1].
   * Replaces any previously drawn route.
   * Requires at least 2 hexes; silently clears and returns for shorter arrays.
   *
   * Visuals (all at topYAt(q,r) + 0.06*HEX_R above each hex center):
   *   Tube        -- TubeGeometry along CatmullRomCurve3, radius 0.05*HEX_R,
   *                  color 0xffe27a (bright gold), opacity 0.9.
   *   Waypoints   -- SphereGeometry radius 0.07*HEX_R (gold) at each
   *                  INTERMEDIATE hex (not first, not last).
   *   Destination -- TorusGeometry ring at the LAST hex: main radius 0.13*HEX_R,
   *                  tube radius 0.035*HEX_R, color 0xff8c00 (orange-gold),
   *                  rotated flat on the hex plane.
   */
  setPathRoute(hexes: { q: number; r: number }[]): void {
    this.clearPathRoute();

    if (hexes.length < 2) return;

    // One gold material shared by tube + waypoint dots.
    // One orange material for the destination marker.
    // Both are disposed in clearPathRoute via userData['routeMat'] sentinel.
    const matGold = new THREE.MeshBasicMaterial({
      color: ROUTE_COLOR,
      transparent: true,
      opacity: ROUTE_OPACITY,
      depthWrite: false,
    });
    const matDest = new THREE.MeshBasicMaterial({
      color: DEST_COLOR,
      transparent: true,
      opacity: ROUTE_OPACITY,
      depthWrite: false,
    });

    // World-space point for each hex (y floats above terrain)
    const points: THREE.Vector3[] = hexes.map(({ q, r }) => {
      const { x, z } = axialToWorld(q, r, HEX_R);
      const y = this.topYAt(q, r) + ROUTE_Y_LIFT;
      return new THREE.Vector3(x, y, z);
    });

    // Tube along CatmullRomCurve3 through all hex centers
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, TUBE_SEGMENTS, TUBE_RADIUS, 8, false);
    const tube = new THREE.Mesh(tubeGeo, matGold);
    tube.userData['routeGeoOwner'] = true; // unique geometry -- always dispose
    tube.userData['routeMat'] = matGold;   // sentinel: clearPathRoute disposes this
    this.scene.add(tube);
    this.routeObjects.push(tube);

    // Intermediate waypoint dots (skip first and last hex).
    // One SphereGeometry instance shared by all dot meshes;
    // disposed exactly once via the first dot's routeGeoOwner flag.
    let dotGeo: THREE.SphereGeometry | null = null;
    for (let i = 1; i < points.length - 1; i++) {
      if (dotGeo === null) {
        dotGeo = new THREE.SphereGeometry(DOT_RADIUS, 8, 6);
      }
      const dot = new THREE.Mesh(dotGeo, matGold);
      dot.position.copy(points[i]!);
      if (i === 1) {
        dot.userData['routeGeoOwner'] = true; // first dot owns the shared dotGeo
      }
      this.scene.add(dot);
      this.routeObjects.push(dot);
    }

    // Destination marker: flat torus ring at the last hex
    const torusGeo = new THREE.TorusGeometry(DEST_TORUS_R, DEST_TUBE_R, 8, 24);
    const destMarker = new THREE.Mesh(torusGeo, matDest);
    destMarker.position.copy(points[points.length - 1]!);
    destMarker.rotation.x = Math.PI / 2; // lay the ring flat on the hex plane
    destMarker.userData['routeGeoOwner'] = true; // unique geometry -- always dispose
    destMarker.userData['routeMat'] = matDest;   // sentinel for material disposal
    this.scene.add(destMarker);
    this.routeObjects.push(destMarker);
  }

  /**
   * Remove the current path route from the scene and dispose all GPU resources.
   * Safe to call when no route is active.
   */
  clearPathRoute(): void {
    if (this.routeObjects.length === 0) return;

    // Collect materials tagged on sentinel meshes (deduplicated by Set).
    const matsToDispose = new Set<THREE.Material>();

    for (const obj of this.routeObjects) {
      this.scene.remove(obj);
      if (obj instanceof THREE.Mesh) {
        // Dispose geometry only on owner meshes (avoids double-free on shared dotGeo).
        if (obj.userData['routeGeoOwner'] === true) {
          obj.geometry.dispose();
        }
        // Collect material instances for deferred disposal.
        const mat = obj.userData['routeMat'] as THREE.Material | undefined;
        if (mat !== undefined) {
          matsToDispose.add(mat);
        }
      }
    }

    for (const m of matsToDispose) {
      m.dispose();
    }

    this.routeObjects = [];
  }

  /** Remove all unit tokens and highlights; dispose all GPU resources. */
  dispose(): void {
    this.clearPathRoute();
    this.clearHighlight();

    for (const [id, obj] of this.tokens) {
      this.scene.remove(obj);
      this._disposeObject3D(obj, this.tokenMaterials.get(id) ?? []);
    }
    this.tokens.clear();
    this.tokenMaterials.clear();

    // Dispose shared geometries
    geoBaseDisc?.dispose();  geoBaseDisc  = null;
    geoLeg?.dispose();       geoLeg       = null;
    geoTorso?.dispose();     geoTorso     = null;
    geoHead?.dispose();      geoHead      = null;
    geoHatBrim?.dispose();   geoHatBrim   = null;
    geoHatCrown?.dispose();  geoHatCrown  = null;
    geoHatBand?.dispose();   geoHatBand   = null;
    geoPole?.dispose();      geoPole      = null;
    geoBanner?.dispose();    geoBanner    = null;
    geoHighlight?.dispose(); geoHighlight = null;
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private _disposeObject3D(_obj: THREE.Object3D, mats: THREE.Material[]): void {
    // Geometries are shared; only per-token materials need disposal here.
    for (const m of mats) {
      m.dispose();
    }
  }
}
