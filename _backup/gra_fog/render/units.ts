/**
 * units.ts
 * Renders unit tokens and movement-range highlight discs on the hex map.
 *
 * Token visual: distinct low-poly humanoid figure per category (~0.45*HEX_R tall).
 * Categories: osadnik | miecznik | wlocznik | lucznik | procarz | oszczepnik |
 *             maczuga | topor | konnica | rydwan | super | domyslny
 *
 * Common humanoid base (all categories share this base except konnica/rydwan):
 *   - Dark base disc        (CylinderGeometry, 8 sides) -- grounding shadow
 *   - Legs x2              (CylinderGeometry, tapered)  -- dark brown
 *   - Torso                (CylinderGeometry, tapered)  -- OWNER color
 *   - Head                 (SphereGeometry 8x6)         -- skin tone
 * Weapon/silhouette varies per category (see buildUnitModel).
 *
 * Highlight visual:
 *   A flat hexagonal disc (CylinderGeometry, 6 sides, very short) rendered with
 *   a transparent MeshBasicMaterial at opacity 0.35, color 0x66ccff.
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
// Token geometry constants (all in world units, HEX_R = 1.0)
// Total humanoid height ~0.45 * HEX_R standing on the hex surface.
// ---------------------------------------------------------------------------

const TOKEN_LIFT = 0.01 * HEX_R;

// Base grounding disc
const BASE_DISC_RADIUS = 0.13 * HEX_R;
const BASE_DISC_HEIGHT = 0.012 * HEX_R;

// Legs (two short tapered cylinders, side by side)
const LEG_RADIUS_TOP = 0.028 * HEX_R;
const LEG_RADIUS_BOT = 0.022 * HEX_R;
const LEG_HEIGHT     = 0.09 * HEX_R;
const LEG_OFFSET_X   = 0.038 * HEX_R;

// Torso (tapered cylinder, owner color)
const TORSO_RADIUS_TOP = 0.065 * HEX_R;
const TORSO_RADIUS_BOT = 0.055 * HEX_R;
const TORSO_HEIGHT     = 0.12 * HEX_R;

// Head (low-poly sphere)
const HEAD_RADIUS = 0.055 * HEX_R;

// Hat (osadnik only)
const HAT_BRIM_RADIUS  = 0.095 * HEX_R;
const HAT_BRIM_HEIGHT  = 0.018 * HEX_R;
const HAT_CROWN_RADIUS = 0.055 * HEX_R;
const HAT_CROWN_HEIGHT = 0.065 * HEX_R;
const HAT_BAND_HEIGHT  = 0.020 * HEX_R;

// Banner pole (osadnik + super)
const POLE_RADIUS   = 0.012 * HEX_R;
const POLE_HEIGHT   = 0.28 * HEX_R;
const POLE_OFFSET_X = 0.10 * HEX_R;
const BANNER_RADIUS = 0.055 * HEX_R;
const BANNER_HEIGHT = 0.07 * HEX_R;

// Computed Y positions (all relative to group origin = bottom of base disc)
const Y_DISC_CTR  = BASE_DISC_HEIGHT * 0.5;
const Y_LEGS_BOT  = BASE_DISC_HEIGHT;
const Y_LEGS_CTR  = Y_LEGS_BOT + LEG_HEIGHT * 0.5;
const Y_TORSO_BOT = Y_LEGS_BOT + LEG_HEIGHT;
const Y_TORSO_CTR = Y_TORSO_BOT + TORSO_HEIGHT * 0.5;
const Y_TORSO_TOP = Y_TORSO_BOT + TORSO_HEIGHT;
const Y_HEAD_CTR  = Y_TORSO_TOP + HEAD_RADIUS * 0.9;
const Y_HEAD_TOP  = Y_TORSO_TOP + HEAD_RADIUS * 1.8;

// Hat band positions (computed from head top)
const Y_BRIM_CTR  = Y_HEAD_TOP + HAT_BRIM_HEIGHT * 0.5;
const Y_BRIM_TOP  = Y_HEAD_TOP + HAT_BRIM_HEIGHT;
const Y_BAND_CTR  = Y_BRIM_TOP + HAT_BAND_HEIGHT * 0.5;
const Y_BAND_TOP  = Y_BRIM_TOP + HAT_BAND_HEIGHT;
const Y_CROWN_CTR = Y_BAND_TOP + HAT_CROWN_HEIGHT * 0.5;

// Banner pole base at torso bottom
const Y_POLE_CTR   = Y_LEGS_BOT + POLE_HEIGHT * 0.5;
const Y_POLE_TOP   = Y_LEGS_BOT + POLE_HEIGHT;
const Y_BANNER_CTR = Y_POLE_TOP + BANNER_HEIGHT * 0.5;

// Colors (fixed)
const COLOR_LEGS  = 0x5b4636; // dark brown
const COLOR_SKIN  = 0xe0ac69; // skin tone
const COLOR_HAT   = 0x3e2a1a; // dark leather brown
const COLOR_POLE  = 0x888888; // grey metal
const COLOR_STEEL = 0xaaaaaa; // light grey for blades
const COLOR_WOOD  = 0x7a5c3a; // wood handle brown
const COLOR_HORSE = 0x6b4c2a; // horse body brown
const COLOR_DARK  = 0x2a2a2a; // near black for cape

// Highlight
const HIGHLIGHT_RADIUS  = HEX_R * 0.88;
const HIGHLIGHT_HEIGHT  = 0.015 * HEX_R;
const HIGHLIGHT_LIFT    = 0.005 * HEX_R;
const HIGHLIGHT_COLOR   = 0x66ccff;
const HIGHLIGHT_OPACITY = 0.35;

// Route
const ROUTE_Y_LIFT  = 0.06 * HEX_R;
const ROUTE_COLOR   = 0xffe27a;
const ROUTE_OPACITY = 0.9;
const TUBE_RADIUS   = 0.05 * HEX_R;
const TUBE_SEGMENTS = 64;
const DOT_RADIUS    = 0.07 * HEX_R;
const DEST_TORUS_R  = 0.13 * HEX_R;
const DEST_TUBE_R   = 0.035 * HEX_R;
const DEST_COLOR    = 0xff8c00;

// ---------------------------------------------------------------------------
// Shared geometry cache (created once, reused for all tokens)
// Keyed by category; shared shapes used across categories are separate slots.
// ---------------------------------------------------------------------------

let geoBaseDisc:  THREE.CylinderGeometry | null = null;
let geoLeg:       THREE.CylinderGeometry | null = null;
let geoTorso:     THREE.CylinderGeometry | null = null;
let geoHead:      THREE.SphereGeometry   | null = null;

// Osadnik hat
let geoHatBrim:   THREE.CylinderGeometry | null = null;
let geoHatCrown:  THREE.CylinderGeometry | null = null;
let geoHatBand:   THREE.CylinderGeometry | null = null;
let geoPole:      THREE.CylinderGeometry | null = null;
let geoBanner:    THREE.ConeGeometry     | null = null;

// Highlight
let geoHighlight: THREE.CylinderGeometry | null = null;

// Shared weapon/prop geometries
let geoSwordBlade:    THREE.BoxGeometry      | null = null;
let geoSwordGuard:    THREE.BoxGeometry      | null = null;
let geoRoundShield:   THREE.CylinderGeometry | null = null;
let geoSpearShaft:    THREE.CylinderGeometry | null = null;
let geoSpearTip:      THREE.ConeGeometry     | null = null;
let geoSmallShield:   THREE.BoxGeometry      | null = null;
let geoBow:           THREE.TorusGeometry    | null = null;
let geoQuiver:        THREE.BoxGeometry      | null = null;
let geoSlingSphere:   THREE.SphereGeometry   | null = null;
let geoSlingLoop:     THREE.TorusGeometry    | null = null;
let geoJavelinShaft:  THREE.CylinderGeometry | null = null;
let geoJavelinTip:    THREE.ConeGeometry     | null = null;
let geoClubShaft:     THREE.CylinderGeometry | null = null;
let geoClubKnob:      THREE.SphereGeometry   | null = null;
let geoAxeHandle:     THREE.CylinderGeometry | null = null;
let geoAxeBlade:      THREE.BoxGeometry      | null = null;
let geoHorseBody:     THREE.BoxGeometry      | null = null;
let geoHorseNeck:     THREE.CylinderGeometry | null = null;
let geoHorseHead:     THREE.BoxGeometry      | null = null;
let geoHorseLeg:      THREE.CylinderGeometry | null = null;
let geoRiderTorso:    THREE.CylinderGeometry | null = null;
let geoRiderHead:     THREE.SphereGeometry   | null = null;
let geoCartBody:      THREE.BoxGeometry      | null = null;
let geoCartWheel:     THREE.CylinderGeometry | null = null;
let geoSuperCrest:    THREE.ConeGeometry     | null = null;
let geoSuperHelm:     THREE.CylinderGeometry | null = null;
let geoSuperCape:     THREE.BoxGeometry      | null = null;
let geoSuperBanner:   THREE.ConeGeometry     | null = null;
let geoSuperPole:     THREE.CylinderGeometry | null = null;

function getGeoBaseDisc():  THREE.CylinderGeometry { return (geoBaseDisc  ||= new THREE.CylinderGeometry(BASE_DISC_RADIUS, BASE_DISC_RADIUS, BASE_DISC_HEIGHT, 8, 1)); }
function getGeoLeg():       THREE.CylinderGeometry { return (geoLeg       ||= new THREE.CylinderGeometry(LEG_RADIUS_TOP, LEG_RADIUS_BOT, LEG_HEIGHT, 5, 1)); }
function getGeoTorso():     THREE.CylinderGeometry { return (geoTorso     ||= new THREE.CylinderGeometry(TORSO_RADIUS_TOP, TORSO_RADIUS_BOT, TORSO_HEIGHT, 6, 1)); }
function getGeoHead():      THREE.SphereGeometry   { return (geoHead      ||= new THREE.SphereGeometry(HEAD_RADIUS, 8, 6)); }
function getGeoHatBrim():   THREE.CylinderGeometry { return (geoHatBrim   ||= new THREE.CylinderGeometry(HAT_BRIM_RADIUS, HAT_BRIM_RADIUS, HAT_BRIM_HEIGHT, 12, 1)); }
function getGeoHatCrown():  THREE.CylinderGeometry { return (geoHatCrown  ||= new THREE.CylinderGeometry(HAT_CROWN_RADIUS, HAT_CROWN_RADIUS, HAT_CROWN_HEIGHT, 8, 1)); }
function getGeoHatBand():   THREE.CylinderGeometry { return (geoHatBand   ||= new THREE.CylinderGeometry(HAT_CROWN_RADIUS + 0.002 * HEX_R, HAT_CROWN_RADIUS + 0.002 * HEX_R, HAT_BAND_HEIGHT, 8, 1)); }
function getGeoPole():      THREE.CylinderGeometry { return (geoPole      ||= new THREE.CylinderGeometry(POLE_RADIUS, POLE_RADIUS, POLE_HEIGHT, 5, 1)); }
function getGeoBanner():    THREE.ConeGeometry     { return (geoBanner    ||= new THREE.ConeGeometry(BANNER_RADIUS, BANNER_HEIGHT, 5, 1)); }
function getGeoHighlight(): THREE.CylinderGeometry { return (geoHighlight ||= new THREE.CylinderGeometry(HIGHLIGHT_RADIUS, HIGHLIGHT_RADIUS, HIGHLIGHT_HEIGHT, 6, 1)); }

function getGeoSwordBlade():   THREE.BoxGeometry      { return (geoSwordBlade   ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.18 * HEX_R, 0.012 * HEX_R)); }
function getGeoSwordGuard():   THREE.BoxGeometry      { return (geoSwordGuard   ||= new THREE.BoxGeometry(0.055 * HEX_R, 0.015 * HEX_R, 0.015 * HEX_R)); }
function getGeoRoundShield():  THREE.CylinderGeometry { return (geoRoundShield  ||= new THREE.CylinderGeometry(0.055 * HEX_R, 0.055 * HEX_R, 0.012 * HEX_R, 8, 1)); }
function getGeoSpearShaft():   THREE.CylinderGeometry { return (geoSpearShaft   ||= new THREE.CylinderGeometry(0.012 * HEX_R, 0.012 * HEX_R, 0.36 * HEX_R, 5, 1)); }
function getGeoSpearTip():     THREE.ConeGeometry     { return (geoSpearTip     ||= new THREE.ConeGeometry(0.020 * HEX_R, 0.055 * HEX_R, 5, 1)); }
function getGeoSmallShield():  THREE.BoxGeometry      { return (geoSmallShield  ||= new THREE.BoxGeometry(0.050 * HEX_R, 0.065 * HEX_R, 0.012 * HEX_R)); }
function getGeoBow():          THREE.TorusGeometry    { return (geoBow          ||= new THREE.TorusGeometry(0.075 * HEX_R, 0.010 * HEX_R, 6, 12, Math.PI)); }
function getGeoQuiver():       THREE.BoxGeometry      { return (geoQuiver       ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.08 * HEX_R, 0.022 * HEX_R)); }
function getGeoSlingSphere():  THREE.SphereGeometry   { return (geoSlingSphere  ||= new THREE.SphereGeometry(0.025 * HEX_R, 6, 4)); }
function getGeoSlingLoop():    THREE.TorusGeometry    { return (geoSlingLoop    ||= new THREE.TorusGeometry(0.030 * HEX_R, 0.008 * HEX_R, 4, 8)); }
function getGeoJavelinShaft(): THREE.CylinderGeometry { return (geoJavelinShaft ||= new THREE.CylinderGeometry(0.010 * HEX_R, 0.010 * HEX_R, 0.22 * HEX_R, 5, 1)); }
function getGeoJavelinTip():   THREE.ConeGeometry     { return (geoJavelinTip   ||= new THREE.ConeGeometry(0.016 * HEX_R, 0.040 * HEX_R, 4, 1)); }
function getGeoClubShaft():    THREE.CylinderGeometry { return (geoClubShaft    ||= new THREE.CylinderGeometry(0.022 * HEX_R, 0.018 * HEX_R, 0.14 * HEX_R, 5, 1)); }
function getGeoClubKnob():     THREE.SphereGeometry   { return (geoClubKnob     ||= new THREE.SphereGeometry(0.038 * HEX_R, 7, 5)); }
function getGeoAxeHandle():    THREE.CylinderGeometry { return (geoAxeHandle    ||= new THREE.CylinderGeometry(0.012 * HEX_R, 0.012 * HEX_R, 0.16 * HEX_R, 5, 1)); }
function getGeoAxeBlade():     THREE.BoxGeometry      { return (geoAxeBlade     ||= new THREE.BoxGeometry(0.065 * HEX_R, 0.055 * HEX_R, 0.015 * HEX_R)); }
function getGeoHorseBody():    THREE.BoxGeometry      { return (geoHorseBody    ||= new THREE.BoxGeometry(0.18 * HEX_R, 0.10 * HEX_R, 0.10 * HEX_R)); }
function getGeoHorseNeck():    THREE.CylinderGeometry { return (geoHorseNeck    ||= new THREE.CylinderGeometry(0.030 * HEX_R, 0.035 * HEX_R, 0.10 * HEX_R, 5, 1)); }
function getGeoHorseHead():    THREE.BoxGeometry      { return (geoHorseHead    ||= new THREE.BoxGeometry(0.06 * HEX_R, 0.05 * HEX_R, 0.05 * HEX_R)); }
function getGeoHorseLeg():     THREE.CylinderGeometry { return (geoHorseLeg     ||= new THREE.CylinderGeometry(0.018 * HEX_R, 0.015 * HEX_R, 0.11 * HEX_R, 4, 1)); }
function getGeoRiderTorso():   THREE.CylinderGeometry { return (geoRiderTorso   ||= new THREE.CylinderGeometry(0.048 * HEX_R, 0.040 * HEX_R, 0.09 * HEX_R, 6, 1)); }
function getGeoRiderHead():    THREE.SphereGeometry   { return (geoRiderHead    ||= new THREE.SphereGeometry(0.042 * HEX_R, 7, 5)); }
function getGeoCartBody():     THREE.BoxGeometry      { return (geoCartBody     ||= new THREE.BoxGeometry(0.22 * HEX_R, 0.07 * HEX_R, 0.12 * HEX_R)); }
function getGeoCartWheel():    THREE.CylinderGeometry { return (geoCartWheel    ||= new THREE.CylinderGeometry(0.055 * HEX_R, 0.055 * HEX_R, 0.020 * HEX_R, 8, 1)); }
function getGeoSuperCrest():   THREE.ConeGeometry     { return (geoSuperCrest   ||= new THREE.ConeGeometry(0.030 * HEX_R, 0.08 * HEX_R, 5, 1)); }
function getGeoSuperHelm():    THREE.CylinderGeometry { return (geoSuperHelm    ||= new THREE.CylinderGeometry(0.060 * HEX_R, 0.058 * HEX_R, 0.040 * HEX_R, 8, 1)); }
function getGeoSuperCape():    THREE.BoxGeometry      { return (geoSuperCape    ||= new THREE.BoxGeometry(0.10 * HEX_R, 0.12 * HEX_R, 0.008 * HEX_R)); }
function getGeoSuperBanner():  THREE.ConeGeometry     { return (geoSuperBanner  ||= new THREE.ConeGeometry(0.065 * HEX_R, 0.09 * HEX_R, 5, 1)); }
function getGeoSuperPole():    THREE.CylinderGeometry { return (geoSuperPole    ||= new THREE.CylinderGeometry(POLE_RADIUS * 1.3, POLE_RADIUS * 1.3, POLE_HEIGHT * 1.15, 5, 1)); }

// ---------------------------------------------------------------------------
// Humanoid base builder -- shared by all categories except konnica / rydwan
// Returns { group, matTorso: THREE.MeshLambertMaterial }
// Also collects all materials into the provided array for disposal tracking.
// ---------------------------------------------------------------------------

interface BaseResult {
  group: THREE.Group;
  matTorso: THREE.MeshLambertMaterial;
  mats: THREE.Material[];
}

function buildHumanoidBase(ownerCol: number): BaseResult {
  const group = new THREE.Group();
  const mats: THREE.Material[] = [];

  function mat(color: number, transparent = false, opacity = 1.0): THREE.MeshLambertMaterial {
    const m = new THREE.MeshLambertMaterial({ color, transparent, opacity });
    mats.push(m);
    return m;
  }

  const matBase  = mat(0x111111, true, 0.55);
  const matLegs  = mat(COLOR_LEGS);
  const matTorso = mat(ownerCol);
  const matSkin  = mat(COLOR_SKIN);

  // Grounding disc
  const mBase = new THREE.Mesh(getGeoBaseDisc(), matBase);
  mBase.position.y = Y_DISC_CTR;
  group.add(mBase);

  // Legs
  const mLegL = new THREE.Mesh(getGeoLeg(), matLegs);
  mLegL.position.set(-LEG_OFFSET_X, Y_LEGS_CTR, 0);
  group.add(mLegL);

  const mLegR = new THREE.Mesh(getGeoLeg(), matLegs);
  mLegR.position.set(LEG_OFFSET_X, Y_LEGS_CTR, 0);
  group.add(mLegR);

  // Torso (owner color)
  const mTorso = new THREE.Mesh(getGeoTorso(), matTorso);
  mTorso.position.y = Y_TORSO_CTR;
  group.add(mTorso);

  // Head (skin tone)
  const mHead = new THREE.Mesh(getGeoHead(), matSkin);
  mHead.position.y = Y_HEAD_CTR;
  group.add(mHead);

  return { group, matTorso, mats };
}

// ---------------------------------------------------------------------------
// buildUnitModel -- DISTINCT low-poly figure per category
// ---------------------------------------------------------------------------

/**
 * Returns a THREE.Group representing a unit of the given category.
 * Owner color appears on the torso AND a top-visible element.
 * All geometries are shared singletons; all materials are per-token (collected
 * in the group's userData['mats'] array for disposal).
 */
export function buildUnitModel(category: string, ownerColor_: number): THREE.Group {
  // Helper to create a per-token material and push it for tracking
  // (we attach mats to group.userData after the switch so each branch
  //  builds with the shared helper returned from buildHumanoidBase)

  switch (category) {
    // -----------------------------------------------------------------------
    case 'osadnik': {
      // Wide-brim hat + small banner (identical to original settler look)
      const { group, mats } = buildHumanoidBase(ownerColor_);

      const matHat    = new THREE.MeshLambertMaterial({ color: COLOR_HAT });
      const matBand   = new THREE.MeshLambertMaterial({ color: ownerColor_ });
      const matPole   = new THREE.MeshLambertMaterial({ color: COLOR_POLE });
      const matBanner = new THREE.MeshLambertMaterial({ color: ownerColor_ });
      mats.push(matHat, matBand, matPole, matBanner);

      const mBrim = new THREE.Mesh(getGeoHatBrim(), matHat);
      mBrim.position.y = Y_BRIM_CTR;
      group.add(mBrim);

      const mBand = new THREE.Mesh(getGeoHatBand(), matBand);
      mBand.position.y = Y_BAND_CTR;
      group.add(mBand);

      const mCrown = new THREE.Mesh(getGeoHatCrown(), matHat);
      mCrown.position.y = Y_CROWN_CTR;
      group.add(mCrown);

      const mPole = new THREE.Mesh(getGeoPole(), matPole);
      mPole.position.set(POLE_OFFSET_X, Y_POLE_CTR, -0.02 * HEX_R);
      group.add(mPole);

      const mBannerFlag = new THREE.Mesh(getGeoBanner(), matBanner);
      mBannerFlag.position.set(POLE_OFFSET_X, Y_BANNER_CTR, -0.02 * HEX_R);
      group.add(mBannerFlag);

      group.userData['mats'] = mats;
      return group;
    }

    // -----------------------------------------------------------------------
    case 'miecznik': {
      // Sword in right hand + round shield on left
      const { group, mats } = buildHumanoidBase(ownerColor_);

      const matSteel  = new THREE.MeshLambertMaterial({ color: COLOR_STEEL });
      const matWood   = new THREE.MeshLambertMaterial({ color: COLOR_WOOD });
      const matOwner  = new THREE.MeshLambertMaterial({ color: ownerColor_ });
      mats.push(matSteel, matWood, matOwner);

      // Sword blade (right side, raised)
      const mBlade = new THREE.Mesh(getGeoSwordBlade(), matSteel);
      mBlade.position.set(0.095 * HEX_R, Y_TORSO_CTR + 0.04 * HEX_R, 0);
      group.add(mBlade);

      // Crossguard
      const mGuard = new THREE.Mesh(getGeoSwordGuard(), matSteel);
      mGuard.position.set(0.095 * HEX_R, Y_TORSO_CTR - 0.01 * HEX_R, 0);
      group.add(mGuard);

      // Round shield (left side, angled to be visible from top)
      const mShield = new THREE.Mesh(getGeoRoundShield(), matOwner);
      mShield.position.set(-0.095 * HEX_R, Y_TORSO_CTR, 0.01 * HEX_R);
      mShield.rotation.z = Math.PI / 2; // stand upright
      group.add(mShield);

      group.userData['mats'] = mats;
      return group;
    }

    // -----------------------------------------------------------------------
    case 'wlocznik': {
      // Long spear (taller than figure) + small rectangular shield
      const { group, mats } = buildHumanoidBase(ownerColor_);

      const matWood   = new THREE.MeshLambertMaterial({ color: COLOR_WOOD });
      const matSteel  = new THREE.MeshLambertMaterial({ color: COLOR_STEEL });
      const matOwner  = new THREE.MeshLambertMaterial({ color: ownerColor_ });
      mats.push(matWood, matSteel, matOwner);

      // Spear shaft (right side, tall -- extends above head)
      const mShaft = new THREE.Mesh(getGeoSpearShaft(), matWood);
      mShaft.position.set(0.095 * HEX_R, Y_LEGS_BOT + 0.36 * HEX_R * 0.5, 0);
      group.add(mShaft);

      // Spear tip (cone at top of shaft)
      const mTip = new THREE.Mesh(getGeoSpearTip(), matSteel);
      mTip.position.set(0.095 * HEX_R, Y_LEGS_BOT + 0.36 * HEX_R + 0.020 * HEX_R, 0);
      group.add(mTip);

      // Small shield (left, owner color, visible from top)
      const mShield = new THREE.Mesh(getGeoSmallShield(), matOwner);
      mShield.position.set(-0.095 * HEX_R, Y_TORSO_CTR, 0.02 * HEX_R);
      group.add(mShield);

      group.userData['mats'] = mats;
      return group;
    }

    // -----------------------------------------------------------------------
    case 'lucznik': {
      // Bow (vertical torus arc) at side + quiver on back
      const { group, mats } = buildHumanoidBase(ownerColor_);

      const matWood   = new THREE.MeshLambertMaterial({ color: COLOR_WOOD });
      const matOwner  = new THREE.MeshLambertMaterial({ color: ownerColor_ });
      mats.push(matWood, matOwner);

      // Bow -- a half-torus, rotated to stand vertically
      const mBow = new THREE.Mesh(getGeoBow(), matWood);
      mBow.position.set(0.095 * HEX_R, Y_TORSO_CTR + 0.02 * HEX_R, 0);
      // TorusGeometry(r, tube, ..., Math.PI) is a half-arc by default in XY plane; rotate to stand upright
      mBow.rotation.z = -Math.PI / 2;
      group.add(mBow);

      // Quiver (small box on the back, owner color -- visible from top-down)
      const mQuiver = new THREE.Mesh(getGeoQuiver(), matOwner);
      mQuiver.position.set(0, Y_TORSO_CTR, -0.08 * HEX_R);
      group.add(mQuiver);

      group.userData['mats'] = mats;
      return group;
    }

    // -----------------------------------------------------------------------
    case 'procarz': {
      // One arm raised with a sling loop (thin torus) + stone (tiny sphere)
      const { group, mats } = buildHumanoidBase(ownerColor_);

      const matOwner  = new THREE.MeshLambertMaterial({ color: ownerColor_ });
      const matStone  = new THREE.MeshLambertMaterial({ color: 0x777777 });
      mats.push(matOwner, matStone);

      // Sling loop (thin torus) held raised above head
      const mLoop = new THREE.Mesh(getGeoSlingLoop(), matOwner);
      mLoop.position.set(0.07 * HEX_R, Y_HEAD_TOP + 0.04 * HEX_R, 0);
      // Lay torus flat for top-down readability
      mLoop.rotation.x = Math.PI / 2;
      group.add(mLoop);

      // Stone (tiny sphere near the loop)
      const mStone = new THREE.Mesh(getGeoSlingSphere(), matStone);
      mStone.position.set(0.10 * HEX_R, Y_HEAD_TOP + 0.065 * HEX_R, 0);
      group.add(mStone);

      group.userData['mats'] = mats;
      return group;
    }

    // -----------------------------------------------------------------------
    case 'oszczepnik': {
      // Raised shorter javelin angled in throwing pose
      const { group, mats } = buildHumanoidBase(ownerColor_);

      const matWoodJ  = new THREE.MeshLambertMaterial({ color: COLOR_WOOD });
      const matSteelJ = new THREE.MeshLambertMaterial({ color: COLOR_STEEL });
      const matOwnerJ = new THREE.MeshLambertMaterial({ color: ownerColor_ });
      mats.push(matWoodJ, matSteelJ, matOwnerJ);

      // Javelin shaft (angled forward/upward, shorter than spear)
      const mShaftJ = new THREE.Mesh(getGeoJavelinShaft(), matWoodJ);
      const jAngle = -Math.PI / 4.5;
      mShaftJ.rotation.z = jAngle;
      mShaftJ.position.set(0.07 * HEX_R, Y_TORSO_CTR + 0.04 * HEX_R, 0);
      group.add(mShaftJ);

      const mTipJ = new THREE.Mesh(getGeoJavelinTip(), matSteelJ);
      const tipY = Y_TORSO_CTR + 0.04 * HEX_R + Math.cos(jAngle) * (0.11 * HEX_R);
      const tipX = 0.07 * HEX_R - Math.sin(jAngle) * (0.11 * HEX_R);
      mTipJ.rotation.z = jAngle;
      mTipJ.position.set(tipX, tipY, 0);
      group.add(mTipJ);

      // Shoulder pad (owner color disc on top of torso, visible from above)
      const gShoulder = new THREE.CylinderGeometry(0.030 * HEX_R, 0.030 * HEX_R, 0.012 * HEX_R, 6, 1);
      const mShoulder = new THREE.Mesh(gShoulder, matOwnerJ);
      mShoulder.position.set(0.06 * HEX_R, Y_TORSO_TOP - 0.01 * HEX_R, 0);
      group.add(mShoulder);
      group.userData['perTokenGeos'] = [gShoulder];

      group.userData['mats'] = mats;
      return group;
    }

    // -----------------------------------------------------------------------
    case 'maczuga': {
      // Club/mace = short thick cylinder (handle) with knob sphere on top, held up
      const { group, mats } = buildHumanoidBase(ownerColor_);

      const matWoodM  = new THREE.MeshLambertMaterial({ color: COLOR_WOOD });
      const matOwnerM = new THREE.MeshLambertMaterial({ color: ownerColor_ });
      mats.push(matWoodM, matOwnerM);

      // Club shaft (raised right side, thick)
      const mShaftM = new THREE.Mesh(getGeoClubShaft(), matWoodM);
      mShaftM.position.set(0.085 * HEX_R, Y_TORSO_TOP + 0.005 * HEX_R, 0);
      group.add(mShaftM);

      // Knob (owner color sphere on top -- visible from above)
      const mKnob = new THREE.Mesh(getGeoClubKnob(), matOwnerM);
      mKnob.position.set(0.085 * HEX_R, Y_TORSO_TOP + 0.14 * HEX_R * 0.5 + 0.038 * HEX_R, 0);
      group.add(mKnob);

      group.userData['mats'] = mats;
      return group;
    }

    // -----------------------------------------------------------------------
    case 'topor': {
      // Axe = thin handle + wedge box blade near the top (owner color on blade)
      const { group, mats } = buildHumanoidBase(ownerColor_);

      const matWoodT  = new THREE.MeshLambertMaterial({ color: COLOR_WOOD });
      const matSteelT = new THREE.MeshLambertMaterial({ color: COLOR_STEEL });
      const matOwnerT = new THREE.MeshLambertMaterial({ color: ownerColor_ });
      mats.push(matWoodT, matSteelT, matOwnerT);

      // Axe handle (right side, raised)
      const mHandleT = new THREE.Mesh(getGeoAxeHandle(), matWoodT);
      mHandleT.position.set(0.085 * HEX_R, Y_TORSO_CTR + 0.03 * HEX_R, 0);
      group.add(mHandleT);

      // Axe blade (owner color box near top of handle)
      const mBladeT = new THREE.Mesh(getGeoAxeBlade(), matOwnerT);
      mBladeT.position.set(0.085 * HEX_R + 0.020 * HEX_R, Y_TORSO_TOP + 0.010 * HEX_R, 0);
      group.add(mBladeT);

      // Steel edge trim (reuse sword guard geometry)
      const mEdgeT = new THREE.Mesh(getGeoSwordGuard(), matSteelT);
      mEdgeT.position.set(0.085 * HEX_R + 0.035 * HEX_R, Y_TORSO_TOP + 0.010 * HEX_R, 0);
      mEdgeT.scale.set(0.5, 0.8, 1.0);
      group.add(mEdgeT);

      group.userData['mats'] = mats;
      return group;
    }

    // -----------------------------------------------------------------------
    case 'konnica': {
      // Horse body + 4 legs + neck + head + rider on top (owner color on rider)
      const group = new THREE.Group();
      const mats: THREE.Material[] = [];

      const matHorse  = new THREE.MeshLambertMaterial({ color: COLOR_HORSE });
      const matBaseK  = new THREE.MeshLambertMaterial({ color: 0x111111, transparent: true, opacity: 0.55 });
      const matRider  = new THREE.MeshLambertMaterial({ color: ownerColor_ });
      const matSkinK  = new THREE.MeshLambertMaterial({ color: COLOR_SKIN });
      const matLegsK  = new THREE.MeshLambertMaterial({ color: COLOR_LEGS });
      mats.push(matHorse, matBaseK, matRider, matSkinK, matLegsK);

      // Wider grounding disc for horse
      const gDiscHorse = new THREE.CylinderGeometry(0.16 * HEX_R, 0.16 * HEX_R, BASE_DISC_HEIGHT, 8, 1);
      const mBaseKm = new THREE.Mesh(gDiscHorse, matBaseK);
      mBaseKm.position.y = Y_DISC_CTR;
      group.add(mBaseKm);
      const perGeosK: THREE.BufferGeometry[] = [gDiscHorse];

      // Horse body (wide box, low center)
      const HORSE_Y = Y_LEGS_BOT + 0.11 * HEX_R;
      const mBodyK = new THREE.Mesh(getGeoHorseBody(), matHorse);
      mBodyK.position.set(0, HORSE_Y, 0);
      group.add(mBodyK);

      // Four horse legs
      const legPosK: ReadonlyArray<readonly [number, number]> = [
        [ 0.06 * HEX_R,  0.04 * HEX_R],
        [-0.06 * HEX_R,  0.04 * HEX_R],
        [ 0.06 * HEX_R, -0.04 * HEX_R],
        [-0.06 * HEX_R, -0.04 * HEX_R],
      ];
      const LEG_CTR_Y = Y_LEGS_BOT + 0.055 * HEX_R;
      for (const [lx, lz] of legPosK) {
        const mLegK = new THREE.Mesh(getGeoHorseLeg(), matHorse);
        mLegK.position.set(lx, LEG_CTR_Y, lz);
        group.add(mLegK);
      }

      // Horse neck (cylinder, angled forward)
      const NECK_Y = HORSE_Y + 0.05 * HEX_R + 0.050 * HEX_R;
      const mNeckK = new THREE.Mesh(getGeoHorseNeck(), matHorse);
      mNeckK.position.set(0.06 * HEX_R, NECK_Y, 0);
      mNeckK.rotation.z = -0.45;
      group.add(mNeckK);

      // Horse head (small box)
      const mHHeadK = new THREE.Mesh(getGeoHorseHead(), matHorse);
      mHHeadK.position.set(0.12 * HEX_R, NECK_Y + 0.055 * HEX_R, 0);
      group.add(mHHeadK);

      // Rider: torso (owner color) + head (skin) seated on horse back
      const RIDER_Y = HORSE_Y + 0.05 * HEX_R;
      const mRTorsoK = new THREE.Mesh(getGeoRiderTorso(), matRider);
      mRTorsoK.position.set(-0.02 * HEX_R, RIDER_Y + 0.045 * HEX_R, 0);
      group.add(mRTorsoK);

      const mRHeadK = new THREE.Mesh(getGeoRiderHead(), matSkinK);
      mRHeadK.position.set(-0.02 * HEX_R, RIDER_Y + 0.045 * HEX_R + 0.09 * HEX_R * 0.5 + 0.042 * HEX_R, 0);
      group.add(mRHeadK);

      // Rider legs (dark, visible on sides of horse)
      const mRLegLK = new THREE.Mesh(getGeoLeg(), matLegsK);
      mRLegLK.position.set(-0.02 * HEX_R, RIDER_Y - 0.005 * HEX_R, 0.06 * HEX_R);
      mRLegLK.rotation.x = Math.PI / 2.2;
      group.add(mRLegLK);

      const mRLegRK = new THREE.Mesh(getGeoLeg(), matLegsK);
      mRLegRK.position.set(-0.02 * HEX_R, RIDER_Y - 0.005 * HEX_R, -0.06 * HEX_R);
      mRLegRK.rotation.x = -Math.PI / 2.2;
      group.add(mRLegRK);

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = perGeosK;
      return group;
    }

    // -----------------------------------------------------------------------
    case 'rydwan': {
      // Wheeled platform (box cart + 2 wheel cylinders) + standing figure
      const group = new THREE.Group();
      const mats: THREE.Material[] = [];

      const matOwnerR = new THREE.MeshLambertMaterial({ color: ownerColor_ });
      const matBaseR  = new THREE.MeshLambertMaterial({ color: 0x111111, transparent: true, opacity: 0.55 });
      const matWoodR  = new THREE.MeshLambertMaterial({ color: COLOR_WOOD });
      const matSteelR = new THREE.MeshLambertMaterial({ color: COLOR_STEEL });
      const matSkinR  = new THREE.MeshLambertMaterial({ color: COLOR_SKIN });
      const matLegsR  = new THREE.MeshLambertMaterial({ color: COLOR_LEGS });
      mats.push(matOwnerR, matBaseR, matWoodR, matSteelR, matSkinR, matLegsR);

      // Wider grounding disc
      const gDiscR = new THREE.CylinderGeometry(0.15 * HEX_R, 0.15 * HEX_R, BASE_DISC_HEIGHT, 8, 1);
      const mBaseRm = new THREE.Mesh(gDiscR, matBaseR);
      mBaseRm.position.y = Y_DISC_CTR;
      group.add(mBaseRm);
      const perGeosR: THREE.BufferGeometry[] = [gDiscR];

      // Cart body (owner color, low box)
      const CART_Y = BASE_DISC_HEIGHT + 0.035 * HEX_R;
      const mCartR = new THREE.Mesh(getGeoCartBody(), matOwnerR);
      mCartR.position.set(0, CART_Y, 0);
      group.add(mCartR);

      // Two wheels (vertical cylinders)
      const WHEEL_Y = CART_Y - 0.015 * HEX_R;
      const mWheelLR = new THREE.Mesh(getGeoCartWheel(), matWoodR);
      mWheelLR.position.set(0, WHEEL_Y, 0.075 * HEX_R);
      mWheelLR.rotation.x = Math.PI / 2;
      group.add(mWheelLR);

      const mWheelRR = new THREE.Mesh(getGeoCartWheel(), matWoodR);
      mWheelRR.position.set(0, WHEEL_Y, -0.075 * HEX_R);
      mWheelRR.rotation.x = Math.PI / 2;
      group.add(mWheelRR);

      // Wheel axle (per-token geometry)
      const gAxleR = new THREE.CylinderGeometry(0.008 * HEX_R, 0.008 * HEX_R, 0.16 * HEX_R, 5, 1);
      const mAxleR = new THREE.Mesh(gAxleR, matSteelR);
      mAxleR.position.set(0, WHEEL_Y, 0);
      mAxleR.rotation.x = Math.PI / 2;
      group.add(mAxleR);
      perGeosR.push(gAxleR);

      // Standing figure on cart
      const FIG_BASE = CART_Y + 0.035 * HEX_R;
      const mLegLR = new THREE.Mesh(getGeoLeg(), matLegsR);
      mLegLR.position.set(-LEG_OFFSET_X, FIG_BASE + LEG_HEIGHT * 0.5, 0);
      group.add(mLegLR);

      const mLegRR = new THREE.Mesh(getGeoLeg(), matLegsR);
      mLegRR.position.set(LEG_OFFSET_X, FIG_BASE + LEG_HEIGHT * 0.5, 0);
      group.add(mLegRR);

      // Torso (per-token geometry, owner color)
      const gFTorsoR = new THREE.CylinderGeometry(TORSO_RADIUS_TOP, TORSO_RADIUS_BOT, TORSO_HEIGHT, 6, 1);
      const mFTorsoR = new THREE.Mesh(gFTorsoR, matOwnerR);
      mFTorsoR.position.set(0, FIG_BASE + LEG_HEIGHT + TORSO_HEIGHT * 0.5, 0);
      group.add(mFTorsoR);
      perGeosR.push(gFTorsoR);

      const FIG_HEAD_Y = FIG_BASE + LEG_HEIGHT + TORSO_HEIGHT + HEAD_RADIUS * 0.9;
      const mFHeadR = new THREE.Mesh(getGeoHead(), matSkinR);
      mFHeadR.position.set(0, FIG_HEAD_Y, 0);
      group.add(mFHeadR);

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = perGeosR;
      return group;
    }

    // -----------------------------------------------------------------------
    case 'super': {
      // Elite humanoid: plumed helm (owner color crest) + dark cape + tall banner
      const { group, mats } = buildHumanoidBase(ownerColor_);

      const matOwnerS = new THREE.MeshLambertMaterial({ color: ownerColor_ });
      const matDark   = new THREE.MeshLambertMaterial({ color: COLOR_DARK });
      const matPoleS  = new THREE.MeshLambertMaterial({ color: COLOR_POLE });
      const matHelmS  = new THREE.MeshLambertMaterial({ color: 0x888888 });
      mats.push(matOwnerS, matDark, matPoleS, matHelmS);

      // Helmet (grey cylinder over head)
      const mHelmS = new THREE.Mesh(getGeoSuperHelm(), matHelmS);
      mHelmS.position.y = Y_HEAD_CTR + 0.010 * HEX_R;
      group.add(mHelmS);

      // Plume/crest (owner color cone on top of helm -- very visible from above)
      const mCrestS = new THREE.Mesh(getGeoSuperCrest(), matOwnerS);
      mCrestS.position.y = Y_HEAD_CTR + 0.040 * HEX_R + 0.040 * HEX_R;
      group.add(mCrestS);

      // Cape (thin dark box behind the figure, tilted slightly)
      const mCapeS = new THREE.Mesh(getGeoSuperCape(), matDark);
      mCapeS.position.set(0, Y_TORSO_CTR + 0.01 * HEX_R, -0.07 * HEX_R);
      mCapeS.rotation.x = 0.25;
      group.add(mCapeS);

      // Tall banner pole (taller than osadnik pole)
      const superPoleY = Y_LEGS_BOT + POLE_HEIGHT * 1.15 * 0.5;
      const superBannerY = Y_LEGS_BOT + POLE_HEIGHT * 1.15 + BANNER_HEIGHT * 0.5;
      const mPoleS = new THREE.Mesh(getGeoSuperPole(), matPoleS);
      mPoleS.position.set(POLE_OFFSET_X, superPoleY, -0.02 * HEX_R);
      group.add(mPoleS);

      // Larger banner flag (owner color)
      const mSBannerS = new THREE.Mesh(getGeoSuperBanner(), matOwnerS);
      mSBannerS.position.set(POLE_OFFSET_X, superBannerY, -0.02 * HEX_R);
      group.add(mSBannerS);

      group.userData['mats'] = mats;
      return group;
    }

    // -----------------------------------------------------------------------
    case 'domyslny':
    default: {
      // Plain humanoid -- no weapon, no hat
      const { group, mats } = buildHumanoidBase(ownerColor_);
      group.userData['mats'] = mats;
      return group;
    }
  }
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

  /** Per-token unique geometries (stored for disposal -- not shared singletons). */
  private tokenGeos: Map<string, THREE.BufferGeometry[]> = new Map();

  /** Current highlight group (all discs live inside). */
  private highlightGroup: THREE.Group | null = null;

  /** Materials created for highlights (stored for disposal). */
  private highlightMaterials: THREE.MeshBasicMaterial[] = [];

  /** All Three.js objects in the current path route. */
  private routeObjects: THREE.Object3D[] = [];

  constructor(scene: THREE.Scene, map: GameMap) {
    this.scene = scene;
    this.hexGrid = new Map<string, Hex>(Object.entries(map.hexes));
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * Synchronise rendered tokens with the current unit list.
   * If a cached token's category differs from unit.category, rebuilds it.
   * Stores category on group.userData['cat'] to detect changes.
   */
  sync(units: RuntimeUnit[]): void {
    const presentIds = new Set<string>();

    for (const unit of units) {
      presentIds.add(unit.id);

      const key = `${unit.q},${unit.r}`;
      const hex = this.hexGrid.get(key);
      const topY = hex ? terrainTopY(hex) : 0;
      const yBase = topY + TOKEN_LIFT;

      const cat = unit.category ?? 'domyslny';

      if (this.tokens.has(unit.id)) {
        const obj = this.tokens.get(unit.id)!;

        // Rebuild if category changed
        if (obj.userData['cat'] !== cat) {
          this.scene.remove(obj);
          this._disposeToken(unit.id, obj);
          this.tokens.delete(unit.id);
          this.tokenMaterials.delete(unit.id);
          this.tokenGeos.delete(unit.id);

          const color = ownerColor(unit.ownerId);
          const group = buildUnitModel(cat, color);
          const { x, z } = axialToWorld(unit.q, unit.r, HEX_R);
          group.position.set(x, yBase, z);
          group.userData['unitId'] = unit.id;
          group.userData['cat']    = cat;

          this._registerToken(unit.id, group);
          this.scene.add(group);
        } else {
          // Just reposition
          const { x, z } = axialToWorld(unit.q, unit.r, HEX_R);
          obj.position.set(x, yBase, z);
        }
      } else {
        // Create new token
        const color = ownerColor(unit.ownerId);
        const group = buildUnitModel(cat, color);

        const { x, z } = axialToWorld(unit.q, unit.r, HEX_R);
        group.position.set(x, yBase, z);
        group.userData['unitId'] = unit.id;
        group.userData['cat']    = cat;

        this._registerToken(unit.id, group);
        this.scene.add(group);
      }
    }

    // Remove tokens whose units are gone
    for (const [id, obj] of this.tokens) {
      if (!presentIds.has(id)) {
        this.scene.remove(obj);
        this._disposeToken(id, obj);
        this.tokens.delete(id);
        this.tokenMaterials.delete(id);
        this.tokenGeos.delete(id);
      }
    }
  }

  /**
   * Move a unit token to an arbitrary world position.
   * Used by the movement animator.
   */
  setTokenWorldPosition(id: string, x: number, y: number, z: number): void {
    const obj = this.tokens.get(id);
    if (obj) {
      obj.position.set(x, y, z);
    }
  }

  /**
   * Return the terrain top Y for a hex at axial coordinates (q, r).
   * Returns 0 if the hex does not exist in the grid.
   */
  topYAt(q: number, r: number): number {
    const hex = this.hexGrid.get(`${q},${r}`);
    return hex ? terrainTopY(hex) : 0;
  }

  /**
   * Draw translucent hex discs over the given set of hexes.
   * Replaces any previously drawn highlights.
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
   */
  setPathRoute(hexes: { q: number; r: number }[]): void {
    this.clearPathRoute();

    if (hexes.length < 2) return;

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

    const points: THREE.Vector3[] = hexes.map(({ q, r }) => {
      const { x, z } = axialToWorld(q, r, HEX_R);
      const y = this.topYAt(q, r) + ROUTE_Y_LIFT;
      return new THREE.Vector3(x, y, z);
    });

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, TUBE_SEGMENTS, TUBE_RADIUS, 8, false);
    const tube = new THREE.Mesh(tubeGeo, matGold);
    tube.userData['routeGeoOwner'] = true;
    tube.userData['routeMat'] = matGold;
    this.scene.add(tube);
    this.routeObjects.push(tube);

    let dotGeo: THREE.SphereGeometry | null = null;
    for (let i = 1; i < points.length - 1; i++) {
      if (dotGeo === null) {
        dotGeo = new THREE.SphereGeometry(DOT_RADIUS, 8, 6);
      }
      const dot = new THREE.Mesh(dotGeo, matGold);
      dot.position.copy(points[i]!);
      if (i === 1) {
        dot.userData['routeGeoOwner'] = true;
      }
      this.scene.add(dot);
      this.routeObjects.push(dot);
    }

    const torusGeo = new THREE.TorusGeometry(DEST_TORUS_R, DEST_TUBE_R, 8, 24);
    const destMarker = new THREE.Mesh(torusGeo, matDest);
    destMarker.position.copy(points[points.length - 1]!);
    destMarker.rotation.x = Math.PI / 2;
    destMarker.userData['routeGeoOwner'] = true;
    destMarker.userData['routeMat'] = matDest;
    this.scene.add(destMarker);
    this.routeObjects.push(destMarker);
  }

  /**
   * Remove the current path route from the scene and dispose all GPU resources.
   */
  clearPathRoute(): void {
    if (this.routeObjects.length === 0) return;

    const matsToDispose = new Set<THREE.Material>();

    for (const obj of this.routeObjects) {
      this.scene.remove(obj);
      if (obj instanceof THREE.Mesh) {
        if (obj.userData['routeGeoOwner'] === true) {
          obj.geometry.dispose();
        }
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
      this._disposeToken(id, obj);
    }
    this.tokens.clear();
    this.tokenMaterials.clear();
    this.tokenGeos.clear();

    // Dispose shared singleton geometries (humanoid base)
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

    // Weapon/prop shared geometries
    geoSwordBlade?.dispose();    geoSwordBlade    = null;
    geoSwordGuard?.dispose();    geoSwordGuard    = null;
    geoRoundShield?.dispose();   geoRoundShield   = null;
    geoSpearShaft?.dispose();    geoSpearShaft    = null;
    geoSpearTip?.dispose();      geoSpearTip      = null;
    geoSmallShield?.dispose();   geoSmallShield   = null;
    geoBow?.dispose();           geoBow           = null;
    geoQuiver?.dispose();        geoQuiver        = null;
    geoSlingSphere?.dispose();   geoSlingSphere   = null;
    geoSlingLoop?.dispose();     geoSlingLoop     = null;
    geoJavelinShaft?.dispose();  geoJavelinShaft  = null;
    geoJavelinTip?.dispose();    geoJavelinTip    = null;
    geoClubShaft?.dispose();     geoClubShaft     = null;
    geoClubKnob?.dispose();      geoClubKnob      = null;
    geoAxeHandle?.dispose();     geoAxeHandle     = null;
    geoAxeBlade?.dispose();      geoAxeBlade      = null;
    geoHorseBody?.dispose();     geoHorseBody     = null;
    geoHorseNeck?.dispose();     geoHorseNeck     = null;
    geoHorseHead?.dispose();     geoHorseHead     = null;
    geoHorseLeg?.dispose();      geoHorseLeg      = null;
    geoRiderTorso?.dispose();    geoRiderTorso    = null;
    geoRiderHead?.dispose();     geoRiderHead     = null;
    geoCartBody?.dispose();      geoCartBody      = null;
    geoCartWheel?.dispose();     geoCartWheel     = null;
    geoSuperCrest?.dispose();    geoSuperCrest    = null;
    geoSuperHelm?.dispose();     geoSuperHelm     = null;
    geoSuperCape?.dispose();     geoSuperCape     = null;
    geoSuperBanner?.dispose();   geoSuperBanner   = null;
    geoSuperPole?.dispose();     geoSuperPole     = null;
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  /**
   * Register token in tracking maps.
   * Reads group.userData['mats'] and group.userData['perTokenGeos'] set by buildUnitModel.
   */
  private _registerToken(id: string, group: THREE.Group): void {
    this.tokens.set(id, group);
    this.tokenMaterials.set(id, (group.userData['mats'] as THREE.Material[]) ?? []);
    this.tokenGeos.set(id, (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? []);
  }

  /**
   * Dispose all per-token materials and unique geometries.
   * Does NOT call scene.remove() -- caller is responsible for that.
   */
  private _disposeToken(id: string, _obj: THREE.Object3D): void {
    const mats = this.tokenMaterials.get(id) ?? [];
    for (const m of mats) {
      m.dispose();
    }
    const geos = this.tokenGeos.get(id) ?? [];
    for (const g of geos) {
      g.dispose();
    }
  }
}
