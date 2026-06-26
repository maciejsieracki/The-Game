/**
 * units.ts
 * Renders unit tokens and movement-range highlight discs on the hex map.
 *
 * Token visual: ROBLOX R6-style box avatar per category (~0.55*HEX_R tall).
 * Categories: osadnik | miecznik | wlocznik | lucznik | procarz | oszczepnik |
 *             maczuga | topor | konnica | rydwan | super | domyslny
 *
 * Base avatar (buildBaseAvatar):
 *   - Box HEAD     (~0.13R cube)      skin tone, two dark eye dots
 *   - Box TORSO    (0.18 x 0.22 x 0.10 R)  cloth/tunic color
 *   - Box ARMS x2  (0.06 x 0.20 x 0.06 R)  cloth color
 *   - Box LEGS x2  (0.07 x 0.20 x 0.07 R)  dark trousers
 * Total height ~0.55*HEX_R; feet at y=0 of group.
 *
 * Per-category gear layered on top (boxes, low-poly) -- see buildUnitModel.
 *
 * Highlight visual:
 *   A flat hexagonal disc (CylinderGeometry, 6 sides) with MeshBasicMaterial
 *   transparent at 0.35 opacity, color 0x66ccff.
 *
 * Route visual:
 *   TubeGeometry along CatmullRomCurve3 (gold 0xffe27a, opacity 0.9).
 *   Intermediate dots: SphereGeometry. Destination: TorusGeometry ring.
 */

import * as THREE from 'three';
import type { GameMap } from '../types/map';
import type { Hex } from '../types/hex';
import { TerenBazowy } from '../types/hex';
import { axialToWorld, HEX_R } from './hexutil';
import type { RuntimeUnit } from '../units/setup';

// ---------------------------------------------------------------------------
// Terrain top-Y table -- MUST match TERRAIN_VISUALS in scene.ts
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
// Roblox R6 proportions (all in world units relative to HEX_R)
// Feet at y=0 of the group; total height ~0.55*HEX_R.
// ---------------------------------------------------------------------------

const TOKEN_LIFT = 0.01 * HEX_R;

// Avatar proportions -- stocky R6 style
const AV_LEG_W   = 0.07  * HEX_R;  // leg box width & depth
const AV_LEG_H   = 0.20  * HEX_R;  // leg height
const AV_LEG_SEP = 0.045 * HEX_R;  // half-gap between legs (edge to center)

const AV_TORSO_W = 0.18  * HEX_R;
const AV_TORSO_H = 0.22  * HEX_R;
const AV_TORSO_D = 0.10  * HEX_R;

const AV_ARM_W   = 0.06  * HEX_R;
const AV_ARM_H   = 0.20  * HEX_R;
const AV_ARM_D   = 0.06  * HEX_R;

const AV_NECK_W  = 0.04  * HEX_R;
const AV_NECK_H  = 0.03  * HEX_R;
const AV_NECK_D  = 0.04  * HEX_R;

const AV_HEAD_S  = 0.13  * HEX_R;  // head box side

// Derived Y positions (group origin = floor / feet)
const AV_Y_LEG_BOT   = 0.0;
const AV_Y_LEG_CTR   = AV_Y_LEG_BOT  + AV_LEG_H   * 0.5;
const AV_Y_LEG_TOP   = AV_Y_LEG_BOT  + AV_LEG_H;
const AV_Y_TORSO_BOT = AV_Y_LEG_TOP;
const AV_Y_TORSO_CTR = AV_Y_TORSO_BOT + AV_TORSO_H * 0.5;
const AV_Y_TORSO_TOP = AV_Y_TORSO_BOT + AV_TORSO_H;
const AV_Y_NECK_CTR  = AV_Y_TORSO_TOP + AV_NECK_H  * 0.5;
const AV_Y_NECK_TOP  = AV_Y_TORSO_TOP + AV_NECK_H;
const AV_Y_HEAD_BOT  = AV_Y_NECK_TOP;
const AV_Y_HEAD_CTR  = AV_Y_HEAD_BOT  + AV_HEAD_S  * 0.5;
const AV_Y_HEAD_TOP  = AV_Y_HEAD_BOT  + AV_HEAD_S;
// Arm center: vertically same as torso upper region
const AV_Y_ARM_CTR   = AV_Y_TORSO_BOT + AV_TORSO_H * 0.55;
// Arm X offset (outside torso edge)
const AV_ARM_OFFSET_X = AV_TORSO_W * 0.5 + AV_ARM_W * 0.5 + 0.003 * HEX_R;

// Colors
const COLOR_SKIN      = 0xe0ac69;  // skin tone
const COLOR_CLOTH     = 0xb5784a;  // neutral tunic/cloth brown
const COLOR_TROUSERS  = 0x4a3828;  // dark brown trousers
const COLOR_DARK_EYE  = 0x1a1008;  // near-black eyes
const COLOR_STEEL     = 0xb0b8c0;  // light steel grey
const COLOR_DARK_STEEL= 0x6a7278;  // darker steel for segment gaps
const COLOR_BRONZE    = 0xc08840;  // bronze armor
const COLOR_DARK_BRONZE=0x7a5020; // darker bronze gap
const COLOR_WOOD      = 0x7a5c3a;  // wood handle
const COLOR_LEATHER   = 0x6b4a28;  // leather straps
const COLOR_HORSE     = 0x6b4c2a;  // horse body brown
const COLOR_HAT_BROWN = 0x3e2a1a;  // wide-brim hat dark leather
const COLOR_HAT_LIGHT = 0x8b6040;  // osadnik hat accent
const COLOR_GOLD      = 0xd4a830;  // gold trim (super)
const COLOR_POLE_GREY = 0x888888;  // banner pole grey
const COLOR_CHARIOT   = 0x8b6a2a;  // chariot wood

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
// Shared singleton geometries (base avatar parts)
// ---------------------------------------------------------------------------

// Base avatar body parts
let geoAvLeg:   THREE.BoxGeometry | null = null;
let geoAvTorso: THREE.BoxGeometry | null = null;
let geoAvArm:   THREE.BoxGeometry | null = null;
let geoAvNeck:  THREE.BoxGeometry | null = null;
let geoAvHead:  THREE.BoxGeometry | null = null;
let geoAvEye:   THREE.BoxGeometry | null = null;

function getGeoAvLeg():   THREE.BoxGeometry { return (geoAvLeg   ||= new THREE.BoxGeometry(AV_LEG_W, AV_LEG_H, AV_LEG_W)); }
function getGeoAvTorso(): THREE.BoxGeometry { return (geoAvTorso ||= new THREE.BoxGeometry(AV_TORSO_W, AV_TORSO_H, AV_TORSO_D)); }
function getGeoAvArm():   THREE.BoxGeometry { return (geoAvArm   ||= new THREE.BoxGeometry(AV_ARM_W, AV_ARM_H, AV_ARM_D)); }
function getGeoAvNeck():  THREE.BoxGeometry { return (geoAvNeck  ||= new THREE.BoxGeometry(AV_NECK_W, AV_NECK_H, AV_NECK_D)); }
function getGeoAvHead():  THREE.BoxGeometry { return (geoAvHead  ||= new THREE.BoxGeometry(AV_HEAD_S, AV_HEAD_S, AV_HEAD_S)); }
function getGeoAvEye():   THREE.BoxGeometry { return (geoAvEye   ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.015 * HEX_R, 0.008 * HEX_R)); }

// Highlight
let geoHighlight: THREE.CylinderGeometry | null = null;
function getGeoHighlight(): THREE.CylinderGeometry {
  return (geoHighlight ||= new THREE.CylinderGeometry(HIGHLIGHT_RADIUS, HIGHLIGHT_RADIUS, HIGHLIGHT_HEIGHT, 6, 1));
}

// ---------------------------------------------------------------------------
// Shared weapon / gear geometries (singletons)
// ---------------------------------------------------------------------------

// Hat (osadnik)
let geoHatBrim:    THREE.BoxGeometry | null = null;
let geoHatCrown:   THREE.BoxGeometry | null = null;
let geoBackpack:   THREE.BoxGeometry | null = null;
let geoSash:       THREE.BoxGeometry | null = null;

// Armor (miecznik, wlocznik, super)
let geoCuirassBox:    THREE.BoxGeometry | null = null;
let geoCuirassGap:    THREE.BoxGeometry | null = null;
let geoShoulderPad:   THREE.BoxGeometry | null = null;
let geoHelmetDome:    THREE.CylinderGeometry | null = null;
let geoHelmetCrest:   THREE.BoxGeometry | null = null;
let geoHelmetSimple:  THREE.BoxGeometry | null = null;

// Sword
let geoSwordBlade:   THREE.BoxGeometry | null = null;
let geoSwordCross:   THREE.BoxGeometry | null = null;
let geoSwordGrip:    THREE.BoxGeometry | null = null;
// Round shield (rim box + boss box)
let geoShieldRim:    THREE.CylinderGeometry | null = null;
let geoShieldBoss:   THREE.CylinderGeometry | null = null;
// Small shield
let geoSmallShield:  THREE.BoxGeometry | null = null;

// Spear / javelin
let geoSpearShaft:   THREE.BoxGeometry | null = null;
let geoSpearTip:     THREE.BoxGeometry | null = null;
let geoJavShaft:     THREE.BoxGeometry | null = null;
let geoJavTip:       THREE.BoxGeometry | null = null;

// Bow (segmented arc built from thin boxes -- shared via per-token build)
// Quiver
let geoQuiver:       THREE.BoxGeometry | null = null;

// Sling + stone
let geoSlingStone:   THREE.BoxGeometry | null = null;

// Club / mace
let geoClubHandle:   THREE.BoxGeometry | null = null;
let geoClubKnob:     THREE.BoxGeometry | null = null;

// Axe
let geoAxeHandle:    THREE.BoxGeometry | null = null;
let geoAxeBlade:     THREE.BoxGeometry | null = null;

// Horse
let geoHorseBody:    THREE.BoxGeometry | null = null;
let geoHorseNeck:    THREE.BoxGeometry | null = null;
let geoHorseHead:    THREE.BoxGeometry | null = null;
let geoHorseLeg:     THREE.BoxGeometry | null = null;

// Chariot
let geoCartBody:     THREE.BoxGeometry | null = null;
let geoCartWheel:    THREE.CylinderGeometry | null = null;

// Super elite extras
let geoSuperCrestPlume: THREE.BoxGeometry | null = null;
let geoSuperCape:       THREE.BoxGeometry | null = null;
let geoBannerPole:      THREE.BoxGeometry | null = null;
let geoBannerFlag:      THREE.BoxGeometry | null = null;
let geoGildedTrim:      THREE.BoxGeometry | null = null;

function getGeoHatBrim():      THREE.BoxGeometry      { return (geoHatBrim      ||= new THREE.BoxGeometry(0.22  * HEX_R, 0.025 * HEX_R, 0.22  * HEX_R)); }
function getGeoHatCrown():     THREE.BoxGeometry      { return (geoHatCrown     ||= new THREE.BoxGeometry(0.13  * HEX_R, 0.08  * HEX_R, 0.13  * HEX_R)); }
function getGeoBackpack():     THREE.BoxGeometry      { return (geoBackpack     ||= new THREE.BoxGeometry(0.08  * HEX_R, 0.10  * HEX_R, 0.04  * HEX_R)); }
function getGeoSash():         THREE.BoxGeometry      { return (geoSash         ||= new THREE.BoxGeometry(0.10  * HEX_R, 0.04  * HEX_R, 0.012 * HEX_R)); }
function getGeoCuirassBox():   THREE.BoxGeometry      { return (geoCuirassBox   ||= new THREE.BoxGeometry(0.21  * HEX_R, 0.24  * HEX_R, 0.13  * HEX_R)); }
function getGeoCuirassGap():   THREE.BoxGeometry      { return (geoCuirassGap   ||= new THREE.BoxGeometry(0.21  * HEX_R, 0.008 * HEX_R, 0.14  * HEX_R)); }
function getGeoShoulderPad():  THREE.BoxGeometry      { return (geoShoulderPad  ||= new THREE.BoxGeometry(0.07  * HEX_R, 0.05  * HEX_R, 0.07  * HEX_R)); }
function getGeoHelmetDome():   THREE.CylinderGeometry { return (geoHelmetDome   ||= new THREE.CylinderGeometry(0.075 * HEX_R, 0.080 * HEX_R, 0.07 * HEX_R, 8, 1)); }
function getGeoHelmetCrest():  THREE.BoxGeometry      { return (geoHelmetCrest  ||= new THREE.BoxGeometry(0.015 * HEX_R, 0.03  * HEX_R, 0.09  * HEX_R)); }
function getGeoHelmetSimple(): THREE.BoxGeometry      { return (geoHelmetSimple ||= new THREE.BoxGeometry(0.14  * HEX_R, 0.07  * HEX_R, 0.14  * HEX_R)); }
function getGeoSwordBlade():   THREE.BoxGeometry      { return (geoSwordBlade   ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.20  * HEX_R, 0.012 * HEX_R)); }
function getGeoSwordCross():   THREE.BoxGeometry      { return (geoSwordCross   ||= new THREE.BoxGeometry(0.07  * HEX_R, 0.018 * HEX_R, 0.018 * HEX_R)); }
function getGeoSwordGrip():    THREE.BoxGeometry      { return (geoSwordGrip    ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.06  * HEX_R, 0.022 * HEX_R)); }
function getGeoShieldRim():    THREE.CylinderGeometry { return (geoShieldRim    ||= new THREE.CylinderGeometry(0.065 * HEX_R, 0.065 * HEX_R, 0.015 * HEX_R, 10, 1)); }
function getGeoShieldBoss():   THREE.CylinderGeometry { return (geoShieldBoss   ||= new THREE.CylinderGeometry(0.022 * HEX_R, 0.022 * HEX_R, 0.022 * HEX_R, 6,  1)); }
function getGeoSmallShield():  THREE.BoxGeometry      { return (geoSmallShield  ||= new THREE.BoxGeometry(0.07  * HEX_R, 0.09  * HEX_R, 0.014 * HEX_R)); }
function getGeoSpearShaft():   THREE.BoxGeometry      { return (geoSpearShaft   ||= new THREE.BoxGeometry(0.015 * HEX_R, 0.40  * HEX_R, 0.015 * HEX_R)); }
function getGeoSpearTip():     THREE.BoxGeometry      { return (geoSpearTip     ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.055 * HEX_R, 0.022 * HEX_R)); }
function getGeoJavShaft():     THREE.BoxGeometry      { return (geoJavShaft     ||= new THREE.BoxGeometry(0.012 * HEX_R, 0.26  * HEX_R, 0.012 * HEX_R)); }
function getGeoJavTip():       THREE.BoxGeometry      { return (geoJavTip       ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.040 * HEX_R, 0.018 * HEX_R)); }
function getGeoQuiver():       THREE.BoxGeometry      { return (geoQuiver       ||= new THREE.BoxGeometry(0.025 * HEX_R, 0.09  * HEX_R, 0.025 * HEX_R)); }
function getGeoSlingStone():   THREE.BoxGeometry      { return (geoSlingStone   ||= new THREE.BoxGeometry(0.028 * HEX_R, 0.028 * HEX_R, 0.028 * HEX_R)); }
function getGeoClubHandle():   THREE.BoxGeometry      { return (geoClubHandle   ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.16  * HEX_R, 0.030 * HEX_R)); }
function getGeoClubKnob():     THREE.BoxGeometry      { return (geoClubKnob     ||= new THREE.BoxGeometry(0.055 * HEX_R, 0.055 * HEX_R, 0.055 * HEX_R)); }
function getGeoAxeHandle():    THREE.BoxGeometry      { return (geoAxeHandle    ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.18  * HEX_R, 0.016 * HEX_R)); }
function getGeoAxeBlade():     THREE.BoxGeometry      { return (geoAxeBlade     ||= new THREE.BoxGeometry(0.08  * HEX_R, 0.065 * HEX_R, 0.018 * HEX_R)); }
function getGeoHorseBody():    THREE.BoxGeometry      { return (geoHorseBody    ||= new THREE.BoxGeometry(0.22  * HEX_R, 0.12  * HEX_R, 0.11  * HEX_R)); }
function getGeoHorseNeck():    THREE.BoxGeometry      { return (geoHorseNeck    ||= new THREE.BoxGeometry(0.06  * HEX_R, 0.12  * HEX_R, 0.06  * HEX_R)); }
function getGeoHorseHead():    THREE.BoxGeometry      { return (geoHorseHead    ||= new THREE.BoxGeometry(0.07  * HEX_R, 0.06  * HEX_R, 0.06  * HEX_R)); }
function getGeoHorseLeg():     THREE.BoxGeometry      { return (geoHorseLeg     ||= new THREE.BoxGeometry(0.04  * HEX_R, 0.14  * HEX_R, 0.04  * HEX_R)); }
function getGeoCartBody():     THREE.BoxGeometry      { return (geoCartBody     ||= new THREE.BoxGeometry(0.25  * HEX_R, 0.08  * HEX_R, 0.14  * HEX_R)); }
function getGeoCartWheel():    THREE.CylinderGeometry { return (geoCartWheel    ||= new THREE.CylinderGeometry(0.065 * HEX_R, 0.065 * HEX_R, 0.020 * HEX_R, 10, 1)); }
function getGeoSuperCrestPlume(): THREE.BoxGeometry   { return (geoSuperCrestPlume ||= new THREE.BoxGeometry(0.015 * HEX_R, 0.10  * HEX_R, 0.08  * HEX_R)); }
function getGeoSuperCape():    THREE.BoxGeometry      { return (geoSuperCape    ||= new THREE.BoxGeometry(0.15  * HEX_R, 0.22  * HEX_R, 0.010 * HEX_R)); }
function getGeoBannerPole():   THREE.BoxGeometry      { return (geoBannerPole   ||= new THREE.BoxGeometry(0.014 * HEX_R, 0.30  * HEX_R, 0.014 * HEX_R)); }
function getGeoBannerFlag():   THREE.BoxGeometry      { return (geoBannerFlag   ||= new THREE.BoxGeometry(0.09  * HEX_R, 0.07  * HEX_R, 0.008 * HEX_R)); }
function getGeoGildedTrim():   THREE.BoxGeometry      { return (geoGildedTrim   ||= new THREE.BoxGeometry(0.22  * HEX_R, 0.018 * HEX_R, 0.14  * HEX_R)); }

// ---------------------------------------------------------------------------
// Material factory -- MeshStandardMaterial per token (collected for disposal)
// ---------------------------------------------------------------------------

type MatFactory = (color: number, metalness?: number, roughness?: number, transparent?: boolean, opacity?: number) => THREE.MeshStandardMaterial;

function makeMatFactory(mats: THREE.Material[]): MatFactory {
  return function mat(
    color: number,
    metalness = 0.1,
    roughness = 0.7,
    transparent = false,
    opacity = 1.0
  ): THREE.MeshStandardMaterial {
    const m = new THREE.MeshStandardMaterial({ color, metalness, roughness, transparent, opacity });
    mats.push(m);
    return m;
  };
}

// ---------------------------------------------------------------------------
// Base avatar builder (Roblox R6 box style)
// skin:  hex color for head skin
// cloth: hex color for torso + arms
// Returns group with all parts added; group origin = feet (y=0)
// Also returns references to arm meshes so caller can add gear to them.
// ---------------------------------------------------------------------------

interface BaseAvatarResult {
  group: THREE.Group;
  mats:  THREE.Material[];
  // Useful anchor Y values
  torsoTopY:  number;
  headTopY:   number;
  armLMesh:   THREE.Mesh;
  armRMesh:   THREE.Mesh;
}

function buildBaseAvatar(
  skinColor:  number,
  clothColor: number,
  ownerCol:   number
): BaseAvatarResult {
  const group = new THREE.Group();
  const mats: THREE.Material[] = [];
  const mat = makeMatFactory(mats);

  const mSkin    = mat(skinColor,  0.05, 0.80);
  const mCloth   = mat(clothColor, 0.05, 0.85);
  const mTrouse  = mat(COLOR_TROUSERS, 0.05, 0.85);
  const mEye     = mat(COLOR_DARK_EYE, 0.02, 0.95);
  // owner-color sash on the torso front (always visible)
  const mSash    = mat(ownerCol,   0.08, 0.70);

  // Left leg
  const mLegL = new THREE.Mesh(getGeoAvLeg(), mTrouse);
  mLegL.position.set(-(AV_LEG_SEP + AV_LEG_W * 0.5), AV_Y_LEG_CTR, 0);
  group.add(mLegL);

  // Right leg
  const mLegR = new THREE.Mesh(getGeoAvLeg(), mTrouse);
  mLegR.position.set( (AV_LEG_SEP + AV_LEG_W * 0.5), AV_Y_LEG_CTR, 0);
  group.add(mLegR);

  // Torso
  const mTorso = new THREE.Mesh(getGeoAvTorso(), mCloth);
  mTorso.position.set(0, AV_Y_TORSO_CTR, 0);
  group.add(mTorso);

  // Owner-color sash across the torso front
  const mS = new THREE.Mesh(getGeoSash(), mSash);
  mS.position.set(0, AV_Y_TORSO_CTR - 0.01 * HEX_R, AV_TORSO_D * 0.5 + 0.003 * HEX_R);
  group.add(mS);

  // Left arm
  const mArmL = new THREE.Mesh(getGeoAvArm(), mCloth);
  mArmL.position.set(-AV_ARM_OFFSET_X, AV_Y_ARM_CTR, 0);
  group.add(mArmL);

  // Right arm
  const mArmR = new THREE.Mesh(getGeoAvArm(), mCloth);
  mArmR.position.set( AV_ARM_OFFSET_X, AV_Y_ARM_CTR, 0);
  group.add(mArmR);

  // Neck
  const mNeck = new THREE.Mesh(getGeoAvNeck(), mCloth);
  mNeck.position.set(0, AV_Y_NECK_CTR, 0);
  group.add(mNeck);

  // Head
  const mHead = new THREE.Mesh(getGeoAvHead(), mSkin);
  mHead.position.set(0, AV_Y_HEAD_CTR, 0);
  group.add(mHead);

  // Eyes (two small dark boxes on the front face of the head)
  const eyeZ = AV_HEAD_S * 0.5 + 0.003 * HEX_R;
  const eyeY = AV_Y_HEAD_CTR + 0.010 * HEX_R;
  const eyeXOff = 0.030 * HEX_R;

  const mEyeL = new THREE.Mesh(getGeoAvEye(), mEye);
  mEyeL.position.set(-eyeXOff, eyeY, eyeZ);
  group.add(mEyeL);

  const mEyeR = new THREE.Mesh(getGeoAvEye(), mEye);
  mEyeR.position.set( eyeXOff, eyeY, eyeZ);
  group.add(mEyeR);

  return {
    group,
    mats,
    torsoTopY: AV_Y_TORSO_TOP,
    headTopY:  AV_Y_HEAD_TOP,
    armLMesh:  mArmL,
    armRMesh:  mArmR,
  };
}

// ---------------------------------------------------------------------------
// buildUnitModel -- Roblox-style figure per category
// ---------------------------------------------------------------------------

/**
 * Returns a THREE.Group representing a unit of the given category.
 * Owner color appears on a clearly visible sash/shield/crest/cape per unit.
 * All geometries are shared singletons; all materials are per-token (collected
 * in group.userData['mats'] for disposal). Per-token unique geometries go into
 * group.userData['perTokenGeos'].
 */
export function buildUnitModel(category: string, ownerColor_: number): THREE.Group {
  switch (category) {

    // -----------------------------------------------------------------------
    case 'osadnik': {
      // Wide-brim hat + backpack + no weapon; cloth/brown palette + owner sash
      const { group, mats } = buildBaseAvatar(COLOR_SKIN, COLOR_CLOTH, ownerColor_);
      const mat = makeMatFactory(mats);

      const mHatBrown = mat(COLOR_HAT_BROWN, 0.05, 0.90);
      const mHatLight = mat(COLOR_HAT_LIGHT, 0.05, 0.85);
      const mPack     = mat(COLOR_LEATHER,   0.05, 0.85);

      // Wide brim (flat box just above head)
      const mBrim = new THREE.Mesh(getGeoHatBrim(), mHatBrown);
      mBrim.position.set(0, AV_Y_HEAD_TOP + 0.015 * HEX_R, 0);
      group.add(mBrim);

      // Crown on top of brim
      const mCrown = new THREE.Mesh(getGeoHatCrown(), mHatBrown);
      mCrown.position.set(0, AV_Y_HEAD_TOP + 0.025 * HEX_R + 0.08 * HEX_R * 0.5 + 0.005 * HEX_R, 0);
      group.add(mCrown);

      // Hat band (owner color, a thin strip around the crown base)
      const gBand = new THREE.BoxGeometry(0.135 * HEX_R, 0.018 * HEX_R, 0.135 * HEX_R);
      const mBand = new THREE.Mesh(gBand, mat(ownerColor_, 0.08, 0.70));
      mBand.position.set(0, AV_Y_HEAD_TOP + 0.025 * HEX_R + 0.008 * HEX_R, 0);
      group.add(mBand);

      // Backpack on the back
      const mPk = new THREE.Mesh(getGeoBackpack(), mPack);
      mPk.position.set(0, AV_Y_TORSO_CTR + 0.01 * HEX_R, -(AV_TORSO_D * 0.5 + 0.022 * HEX_R));
      group.add(mPk);

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = [gBand];
      return group;
    }

    // -----------------------------------------------------------------------
    case 'miecznik': {
      // Bronze segmented cuirass + shoulder pads + domed helmet with swept crest
      // Sword in right hand + round shield (rim+boss) on left arm
      const { group, mats } = buildBaseAvatar(COLOR_SKIN, COLOR_LEATHER, ownerColor_);
      const mat = makeMatFactory(mats);

      const mBronze     = mat(COLOR_BRONZE,      0.30, 0.60);
      const mDarkBronze = mat(COLOR_DARK_BRONZE,  0.25, 0.65);
      const mSteel      = mat(COLOR_STEEL,        0.40, 0.50);
      const mDarkSteel  = mat(COLOR_DARK_STEEL,   0.35, 0.55);
      const mOwner      = mat(ownerColor_,        0.15, 0.65);
      const mWood       = mat(COLOR_WOOD,         0.05, 0.85);

      // Cuirass (slightly larger than torso, over it)
      const mCuirass = new THREE.Mesh(getGeoCuirassBox(), mBronze);
      mCuirass.position.set(0, AV_Y_TORSO_CTR, 0);
      group.add(mCuirass);

      // Two horizontal gap lines for banded armor look
      for (const dy of [-0.05 * HEX_R, 0.03 * HEX_R]) {
        const mGap = new THREE.Mesh(getGeoCuirassGap(), mDarkBronze);
        mGap.position.set(0, AV_Y_TORSO_CTR + dy, 0.001 * HEX_R);
        group.add(mGap);
      }

      // Shoulder pads (left + right)
      const mSpL = new THREE.Mesh(getGeoShoulderPad(), mBronze);
      mSpL.position.set(-AV_ARM_OFFSET_X + 0.005 * HEX_R, AV_Y_TORSO_TOP - 0.015 * HEX_R, 0);
      group.add(mSpL);

      const mSpR = new THREE.Mesh(getGeoShoulderPad(), mBronze);
      mSpR.position.set( AV_ARM_OFFSET_X - 0.005 * HEX_R, AV_Y_TORSO_TOP - 0.015 * HEX_R, 0);
      group.add(mSpR);

      // Domed helmet (low cylinder over head)
      const mHelm = new THREE.Mesh(getGeoHelmetDome(), mBronze);
      mHelm.position.set(0, AV_Y_HEAD_CTR + 0.015 * HEX_R, 0);
      group.add(mHelm);

      // Short swept crest (low ridge, in owner color) -- NOT a tall cone
      const mCrest = new THREE.Mesh(getGeoHelmetCrest(), mOwner);
      mCrest.position.set(0, AV_Y_HEAD_TOP + 0.005 * HEX_R, 0);
      group.add(mCrest);

      // Sword: grip + crossguard + blade (right side)
      const SWORD_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.018 * HEX_R;
      const mGrip = new THREE.Mesh(getGeoSwordGrip(), mWood);
      mGrip.position.set(SWORD_X, AV_Y_TORSO_CTR - 0.04 * HEX_R, 0);
      group.add(mGrip);

      const mCross = new THREE.Mesh(getGeoSwordCross(), mSteel);
      mCross.position.set(SWORD_X, AV_Y_TORSO_CTR + 0.01 * HEX_R, 0);
      group.add(mCross);

      const mBlade = new THREE.Mesh(getGeoSwordBlade(), mSteel);
      mBlade.position.set(SWORD_X, AV_Y_TORSO_CTR + 0.11 * HEX_R, 0);
      group.add(mBlade);

      // Round shield: rim (cylinder) + boss center (smaller cylinder)
      const SHIELD_X = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.020 * HEX_R);
      const mRim = new THREE.Mesh(getGeoShieldRim(), mSteel);
      mRim.rotation.z = Math.PI / 2;
      mRim.position.set(SHIELD_X, AV_Y_TORSO_CTR + 0.01 * HEX_R, 0);
      group.add(mRim);

      const mBoss = new THREE.Mesh(getGeoShieldBoss(), mOwner);
      mBoss.rotation.z = Math.PI / 2;
      mBoss.position.set(SHIELD_X - 0.012 * HEX_R, AV_Y_TORSO_CTR + 0.01 * HEX_R, 0);
      group.add(mBoss);

      // Dark steel rim outline on shield back
      const mRimD = new THREE.Mesh(getGeoShieldRim(), mDarkSteel);
      mRimD.rotation.z = Math.PI / 2;
      mRimD.position.set(SHIELD_X + 0.008 * HEX_R, AV_Y_TORSO_CTR + 0.01 * HEX_R, 0);
      mRimD.scale.set(1.0, 0.85, 0.85);
      group.add(mRimD);

      group.userData['mats'] = mats;
      return group;
    }

    // -----------------------------------------------------------------------
    case 'wlocznik': {
      // Similar armor (light cuirass), tall spear + small shield; simple helmet
      const { group, mats } = buildBaseAvatar(COLOR_SKIN, COLOR_LEATHER, ownerColor_);
      const mat = makeMatFactory(mats);

      const mBronze = mat(COLOR_BRONZE,     0.30, 0.60);
      const mBronzD = mat(COLOR_DARK_BRONZE, 0.25, 0.65);
      const mSteel  = mat(COLOR_STEEL,      0.40, 0.50);
      const mWood   = mat(COLOR_WOOD,       0.05, 0.85);
      const mOwner  = mat(ownerColor_,      0.15, 0.65);

      // Light cuirass (same box but slightly smaller than miecznik)
      const mCuir = new THREE.Mesh(getGeoCuirassBox(), mBronze);
      mCuir.scale.set(0.92, 0.92, 0.92);
      mCuir.position.set(0, AV_Y_TORSO_CTR, 0);
      group.add(mCuir);

      const mGap = new THREE.Mesh(getGeoCuirassGap(), mBronzD);
      mGap.position.set(0, AV_Y_TORSO_CTR + 0.02 * HEX_R, 0);
      group.add(mGap);

      // Simple box helmet
      const mHelm = new THREE.Mesh(getGeoHelmetSimple(), mBronze);
      mHelm.position.set(0, AV_Y_HEAD_CTR + 0.005 * HEX_R, 0);
      group.add(mHelm);

      // Tall spear shaft + tip (right side, extends above head)
      const SPEAR_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.015 * HEX_R;
      const SPEAR_BOT = AV_Y_LEG_BOT + 0.02 * HEX_R;
      const SPEAR_CTR = SPEAR_BOT + 0.40 * HEX_R * 0.5;
      const SPEAR_TOP = SPEAR_BOT + 0.40 * HEX_R;
      const mShaft = new THREE.Mesh(getGeoSpearShaft(), mWood);
      mShaft.position.set(SPEAR_X, SPEAR_CTR, 0);
      group.add(mShaft);

      const mTip = new THREE.Mesh(getGeoSpearTip(), mSteel);
      mTip.position.set(SPEAR_X, SPEAR_TOP + 0.028 * HEX_R, 0);
      group.add(mTip);

      // Small shield (left, owner color)
      const SSHIELD_X = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.012 * HEX_R);
      const mSShield = new THREE.Mesh(getGeoSmallShield(), mOwner);
      mSShield.position.set(SSHIELD_X, AV_Y_TORSO_CTR + 0.01 * HEX_R, 0);
      group.add(mSShield);

      // Steel border on small shield
      const gBorder = new THREE.BoxGeometry(0.076 * HEX_R, 0.096 * HEX_R, 0.010 * HEX_R);
      const mBorder = new THREE.Mesh(gBorder, mSteel);
      mBorder.position.set(SSHIELD_X + 0.005 * HEX_R, AV_Y_TORSO_CTR + 0.01 * HEX_R, -0.003 * HEX_R);
      group.add(mBorder);

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = [gBorder];
      return group;
    }

    // -----------------------------------------------------------------------
    case 'lucznik': {
      // Light cloth + cap; bow (segmented arc boxes) to the side; quiver on back
      const { group, mats } = buildBaseAvatar(COLOR_SKIN, 0x8a7050, ownerColor_);
      const mat = makeMatFactory(mats);

      const mWood  = mat(COLOR_WOOD,   0.05, 0.85);
      const mOwner = mat(ownerColor_,  0.08, 0.70);
      const mCap   = mat(0x5a4020,     0.05, 0.88);

      // Simple flat cap (box on head)
      const gCap = new THREE.BoxGeometry(0.14 * HEX_R, 0.04 * HEX_R, 0.14 * HEX_R);
      const mCapM = new THREE.Mesh(gCap, mCap);
      mCapM.position.set(0, AV_Y_HEAD_TOP + 0.01 * HEX_R, 0);
      group.add(mCapM);

      // Bow: 5 short box segments forming a curved arc on the right side
      // Arc is in the XY plane, offset to the right of the figure
      const BOW_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.025 * HEX_R;
      const BOW_R = 0.10 * HEX_R;  // arc radius
      const BOW_CTR_Y = AV_Y_TORSO_CTR;
      const BOW_SEGS = 5;
      const BOW_ARC  = Math.PI * 0.85;
      const BOW_START = -BOW_ARC * 0.5;
      const gBowSeg = new THREE.BoxGeometry(0.014 * HEX_R, BOW_R * 2 * Math.sin(BOW_ARC / (BOW_SEGS * 2)) * 1.1, 0.014 * HEX_R);
      for (let i = 0; i < BOW_SEGS; i++) {
        const angle = BOW_START + (i + 0.5) * (BOW_ARC / BOW_SEGS);
        const bx = BOW_X;
        const by = BOW_CTR_Y + Math.cos(angle) * BOW_R;
        const segRot = -angle;
        const mSeg = new THREE.Mesh(gBowSeg, mWood);
        mSeg.position.set(bx, by, 0);
        mSeg.rotation.z = segRot;
        group.add(mSeg);
      }

      // Quiver (owner color box on back-right)
      const mQ = new THREE.Mesh(getGeoQuiver(), mOwner);
      mQ.position.set(0.04 * HEX_R, AV_Y_TORSO_CTR + 0.02 * HEX_R, -(AV_TORSO_D * 0.5 + 0.016 * HEX_R));
      group.add(mQ);

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = [gCap, gBowSeg];
      return group;
    }

    // -----------------------------------------------------------------------
    case 'procarz': {
      // Light cloth, one arm raised with sling + stone; no armor
      const { group, mats } = buildBaseAvatar(COLOR_SKIN, 0x9a8060, ownerColor_);
      const mat = makeMatFactory(mats);

      const mStone = mat(0x888880, 0.05, 0.95);
      const mOwner = mat(ownerColor_, 0.08, 0.70);

      // Right arm raised (replace/repose by adding a raised arm box at the raised position)
      const gRaisedArm = new THREE.BoxGeometry(AV_ARM_W, AV_ARM_H, AV_ARM_D);
      const mRaisedArm = new THREE.Mesh(gRaisedArm, mat(0x9a8060, 0.05, 0.85));
      // Position: right side, arm raised so center is near head level
      const RAISE_X = AV_ARM_OFFSET_X;
      mRaisedArm.position.set(RAISE_X, AV_Y_HEAD_CTR, 0);
      mRaisedArm.rotation.z = Math.PI * 0.6;
      group.add(mRaisedArm);

      // Sling strap (thin box from raised hand upward)
      const gSling = new THREE.BoxGeometry(0.010 * HEX_R, 0.08 * HEX_R, 0.010 * HEX_R);
      const mSling = new THREE.Mesh(gSling, mOwner);
      mSling.position.set(RAISE_X + 0.05 * HEX_R, AV_Y_HEAD_TOP + 0.025 * HEX_R, 0);
      group.add(mSling);

      // Stone (small box at top of sling)
      const mStoneM = new THREE.Mesh(getGeoSlingStone(), mStone);
      mStoneM.position.set(RAISE_X + 0.06 * HEX_R, AV_Y_HEAD_TOP + 0.065 * HEX_R, 0);
      group.add(mStoneM);

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = [gRaisedArm, gSling];
      return group;
    }

    // -----------------------------------------------------------------------
    case 'oszczepnik': {
      // Light armor, raised short javelin (angled), small shield + owner shoulder mark
      const { group, mats } = buildBaseAvatar(COLOR_SKIN, COLOR_LEATHER, ownerColor_);
      const mat = makeMatFactory(mats);

      const mBronze = mat(COLOR_BRONZE,     0.25, 0.65);
      const mSteel  = mat(COLOR_STEEL,      0.40, 0.50);
      const mWood   = mat(COLOR_WOOD,       0.05, 0.85);
      const mOwner  = mat(ownerColor_,      0.12, 0.68);

      // Light chest plate (thinner than miecznik)
      const gChest = new THREE.BoxGeometry(0.19 * HEX_R, 0.14 * HEX_R, 0.12 * HEX_R);
      const mChest = new THREE.Mesh(gChest, mBronze);
      mChest.position.set(0, AV_Y_TORSO_TOP - 0.08 * HEX_R, 0);
      group.add(mChest);

      // Javelin shaft (angled, raised, shorter than spear)
      const JAV_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.012 * HEX_R;
      const gJShaft = new THREE.BoxGeometry(0.013 * HEX_R, 0.26 * HEX_R, 0.013 * HEX_R);
      const mJShaft = new THREE.Mesh(gJShaft, mWood);
      const jAngle = -Math.PI / 5;
      mJShaft.rotation.z = jAngle;
      mJShaft.position.set(JAV_X + 0.03 * HEX_R, AV_Y_TORSO_CTR + 0.06 * HEX_R, 0);
      group.add(mJShaft);

      const gJTip = new THREE.BoxGeometry(0.020 * HEX_R, 0.040 * HEX_R, 0.020 * HEX_R);
      const mJTip = new THREE.Mesh(gJTip, mSteel);
      const tipX = JAV_X + 0.03 * HEX_R - Math.sin(jAngle) * 0.13 * HEX_R;
      const tipY = AV_Y_TORSO_CTR + 0.06 * HEX_R + Math.cos(jAngle) * 0.13 * HEX_R;
      mJTip.rotation.z = jAngle;
      mJTip.position.set(tipX, tipY, 0);
      group.add(mJTip);

      // Shoulder pad in owner color (visible from top-down)
      const gShoulder = new THREE.BoxGeometry(0.07 * HEX_R, 0.04 * HEX_R, 0.07 * HEX_R);
      const mShoulder = new THREE.Mesh(gShoulder, mOwner);
      mShoulder.position.set(JAV_X - 0.025 * HEX_R, AV_Y_TORSO_TOP, 0);
      group.add(mShoulder);

      // Small shield (left)
      const SSHX = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.012 * HEX_R);
      const mSSh = new THREE.Mesh(getGeoSmallShield(), mBronze);
      mSSh.position.set(SSHX, AV_Y_TORSO_CTR + 0.01 * HEX_R, 0);
      group.add(mSSh);

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = [gChest, gJShaft, gJTip, gShoulder];
      return group;
    }

    // -----------------------------------------------------------------------
    case 'maczuga': {
      // Club/mace raised (thick handle + cubic knob); tribal cloth; feather/crest
      const { group, mats } = buildBaseAvatar(COLOR_SKIN, 0xa07040, ownerColor_);
      const mat = makeMatFactory(mats);

      const mWood   = mat(COLOR_WOOD,   0.05, 0.85);
      const mOwner  = mat(ownerColor_,  0.12, 0.68);

      // Feather crest on head (owner color, tall thin box angled)
      const gFeather = new THREE.BoxGeometry(0.018 * HEX_R, 0.08 * HEX_R, 0.010 * HEX_R);
      const mFeather = new THREE.Mesh(gFeather, mOwner);
      mFeather.position.set(0, AV_Y_HEAD_TOP + 0.042 * HEX_R, 0);
      mFeather.rotation.z = 0.25;
      group.add(mFeather);

      // Club handle (raised right side)
      const CLUB_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.018 * HEX_R;
      const mHandle = new THREE.Mesh(getGeoClubHandle(), mWood);
      mHandle.position.set(CLUB_X, AV_Y_TORSO_TOP + 0.005 * HEX_R, 0);
      group.add(mHandle);

      // Knob (cubic, owner color)
      const mKnob = new THREE.Mesh(getGeoClubKnob(), mOwner);
      mKnob.position.set(CLUB_X, AV_Y_TORSO_TOP + 0.16 * HEX_R + 0.028 * HEX_R, 0);
      group.add(mKnob);

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = [gFeather];
      return group;
    }

    // -----------------------------------------------------------------------
    case 'topor': {
      // Axe (handle + wide blade box); light armor
      const { group, mats } = buildBaseAvatar(COLOR_SKIN, COLOR_LEATHER, ownerColor_);
      const mat = makeMatFactory(mats);

      const mBronze = mat(COLOR_BRONZE,     0.25, 0.65);
      const mSteel  = mat(COLOR_STEEL,      0.40, 0.50);
      const mWood   = mat(COLOR_WOOD,       0.05, 0.85);
      const mOwner  = mat(ownerColor_,      0.15, 0.65);

      // Light chest piece
      const gChest = new THREE.BoxGeometry(0.19 * HEX_R, 0.12 * HEX_R, 0.12 * HEX_R);
      const mChest = new THREE.Mesh(gChest, mBronze);
      mChest.position.set(0, AV_Y_TORSO_TOP - 0.07 * HEX_R, 0);
      group.add(mChest);

      // Axe handle (right side, raised)
      const AXE_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.015 * HEX_R;
      const mAxHandle = new THREE.Mesh(getGeoAxeHandle(), mWood);
      mAxHandle.position.set(AXE_X, AV_Y_TORSO_CTR + 0.03 * HEX_R, 0);
      group.add(mAxHandle);

      // Axe blade (owner color, wide box at top of handle)
      const mAxBlade = new THREE.Mesh(getGeoAxeBlade(), mOwner);
      mAxBlade.position.set(AXE_X + 0.025 * HEX_R, AV_Y_TORSO_TOP + 0.012 * HEX_R, 0);
      group.add(mAxBlade);

      // Steel edge trim (thin strip on blade edge)
      const gEdge = new THREE.BoxGeometry(0.012 * HEX_R, 0.068 * HEX_R, 0.014 * HEX_R);
      const mEdge = new THREE.Mesh(gEdge, mSteel);
      mEdge.position.set(AXE_X + 0.062 * HEX_R, AV_Y_TORSO_TOP + 0.012 * HEX_R, 0);
      group.add(mEdge);

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = [gChest, gEdge];
      return group;
    }

    // -----------------------------------------------------------------------
    case 'konnica': {
      // Box horse (body + neck + head + 4 legs, brown) + avatar seated on top
      const group = new THREE.Group();
      const mats: THREE.Material[] = [];
      const mat = makeMatFactory(mats);

      const mHorse  = mat(COLOR_HORSE,  0.10, 0.80);
      const mMane   = mat(0x3a2010,     0.05, 0.85);
      const mSkin   = mat(COLOR_SKIN,   0.05, 0.80);
      const mCloth  = mat(COLOR_LEATHER,0.05, 0.85);
      const mOwner  = mat(ownerColor_,  0.12, 0.68);
      const mWood   = mat(COLOR_WOOD,   0.05, 0.85);
      const mSteel  = mat(COLOR_STEEL,  0.40, 0.50);

      // Horse: body (wide box)
      const HORSE_BOT = 0.14 * HEX_R;  // horse legs end here (group y=0 is floor)
      const HORSE_CTR = HORSE_BOT + 0.06 * HEX_R;  // center of body
      const mHBody = new THREE.Mesh(getGeoHorseBody(), mHorse);
      mHBody.position.set(0, HORSE_CTR, 0);
      group.add(mHBody);

      // Four horse legs
      const H_LEG_CTR = HORSE_BOT * 0.5;
      const hLegPosXZ: ReadonlyArray<[number, number]> = [
        [ 0.07 * HEX_R,  0.03 * HEX_R],
        [-0.07 * HEX_R,  0.03 * HEX_R],
        [ 0.07 * HEX_R, -0.03 * HEX_R],
        [-0.07 * HEX_R, -0.03 * HEX_R],
      ];
      for (const [lx, lz] of hLegPosXZ) {
        const mHL = new THREE.Mesh(getGeoHorseLeg(), mHorse);
        mHL.position.set(lx, H_LEG_CTR, lz);
        group.add(mHL);
      }

      // Horse neck (box, angled)
      const NECK_BOT_Y = HORSE_CTR + 0.04 * HEX_R;
      const mHNeck = new THREE.Mesh(getGeoHorseNeck(), mHorse);
      mHNeck.position.set(0.07 * HEX_R, NECK_BOT_Y + 0.06 * HEX_R, 0);
      mHNeck.rotation.z = -0.40;
      group.add(mHNeck);

      // Mane strip (dark box along neck)
      const gMane = new THREE.BoxGeometry(0.022 * HEX_R, 0.10 * HEX_R, 0.020 * HEX_R);
      const mManeM = new THREE.Mesh(gMane, mMane);
      mManeM.position.set(0.07 * HEX_R, NECK_BOT_Y + 0.06 * HEX_R, 0);
      mManeM.rotation.z = -0.40;
      group.add(mManeM);

      // Horse head
      const mHHead = new THREE.Mesh(getGeoHorseHead(), mHorse);
      mHHead.position.set(0.14 * HEX_R, NECK_BOT_Y + 0.12 * HEX_R, 0);
      group.add(mHHead);

      // Rider: box torso + arms + head + sash (seated on horse back)
      const RIDER_BOT = HORSE_CTR + 0.06 * HEX_R;  // sit on horse back
      const R_TORSO_CTR = RIDER_BOT + AV_TORSO_H * 0.5;
      const R_TORSO_TOP = RIDER_BOT + AV_TORSO_H;
      const R_HEAD_CTR = R_TORSO_TOP + AV_NECK_H + AV_HEAD_S * 0.5;
      const R_HEAD_TOP = R_HEAD_CTR + AV_HEAD_S * 0.5;
      const R_ARM_CTR  = RIDER_BOT + AV_TORSO_H * 0.55;

      const mRTorso = new THREE.Mesh(getGeoAvTorso(), mCloth);
      mRTorso.scale.set(0.85, 0.75, 0.85);
      mRTorso.position.set(-0.02 * HEX_R, R_TORSO_CTR, 0);
      group.add(mRTorso);

      // Rider sash (owner color)
      const gRSash = new THREE.BoxGeometry(0.09 * HEX_R, 0.035 * HEX_R, 0.012 * HEX_R);
      const mRSash = new THREE.Mesh(gRSash, mOwner);
      mRSash.position.set(-0.02 * HEX_R, R_TORSO_CTR, AV_TORSO_D * 0.43 + 0.003 * HEX_R);
      group.add(mRSash);

      // Rider arms (straddling the horse)
      const gRArmL = new THREE.BoxGeometry(AV_ARM_W * 0.8, AV_ARM_H * 0.75, AV_ARM_D * 0.8);
      const mRArmL = new THREE.Mesh(gRArmL, mCloth);
      mRArmL.position.set(-0.02 * HEX_R - AV_ARM_OFFSET_X * 0.85, R_ARM_CTR, 0);
      group.add(mRArmL);

      const gRArmR = new THREE.BoxGeometry(AV_ARM_W * 0.8, AV_ARM_H * 0.75, AV_ARM_D * 0.8);
      const mRArmR = new THREE.Mesh(gRArmR, mCloth);
      mRArmR.position.set(-0.02 * HEX_R + AV_ARM_OFFSET_X * 0.85, R_ARM_CTR, 0);
      group.add(mRArmR);

      // Rider head
      const gRHead = new THREE.BoxGeometry(AV_HEAD_S * 0.85, AV_HEAD_S * 0.85, AV_HEAD_S * 0.85);
      const mRHead = new THREE.Mesh(gRHead, mSkin);
      mRHead.position.set(-0.02 * HEX_R, R_HEAD_CTR, 0);
      group.add(mRHead);

      // Eye dots on rider
      const gREyeL = new THREE.BoxGeometry(0.016 * HEX_R, 0.012 * HEX_R, 0.008 * HEX_R);
      const mREyeL = new THREE.Mesh(gREyeL, mat(COLOR_DARK_EYE, 0.02, 0.95));
      const rEyeZ = AV_HEAD_S * 0.85 * 0.5 + 0.002 * HEX_R;
      mREyeL.position.set(-0.02 * HEX_R - 0.025 * HEX_R, R_HEAD_CTR + 0.008 * HEX_R, rEyeZ);
      group.add(mREyeL);

      const gREyeR = new THREE.BoxGeometry(0.016 * HEX_R, 0.012 * HEX_R, 0.008 * HEX_R);
      const mREyeR = new THREE.Mesh(gREyeR, mat(COLOR_DARK_EYE, 0.02, 0.95));
      mREyeR.position.set(-0.02 * HEX_R + 0.025 * HEX_R, R_HEAD_CTR + 0.008 * HEX_R, rEyeZ);
      group.add(mREyeR);

      // Rider's spear (right hand, held upright)
      const RSPEAR_X = -0.02 * HEX_R + AV_ARM_OFFSET_X * 0.85 + AV_ARM_W * 0.4 + 0.015 * HEX_R;
      const mRSpear = new THREE.Mesh(getGeoSpearShaft(), mWood);
      mRSpear.position.set(RSPEAR_X, RIDER_BOT + 0.20 * HEX_R, 0);
      group.add(mRSpear);

      const mRSpearTip = new THREE.Mesh(getGeoSpearTip(), mSteel);
      mRSpearTip.position.set(RSPEAR_X, RIDER_BOT + 0.20 * HEX_R + 0.20 * HEX_R + 0.028 * HEX_R, 0);
      group.add(mRSpearTip);

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = [gMane, gRSash, gRArmL, gRArmR, gRHead, gREyeL, gREyeR];
      return group;
    }

    // -----------------------------------------------------------------------
    case 'rydwan': {
      // Wheeled chariot box + 2 wheel cylinders + standing avatar
      const group = new THREE.Group();
      const mats: THREE.Material[] = [];
      const mat = makeMatFactory(mats);

      const mCart  = mat(ownerColor_,     0.10, 0.75);  // owner-colored cart
      const mWood  = mat(COLOR_CHARIOT,   0.05, 0.85);
      const mSteel = mat(COLOR_STEEL,     0.40, 0.50);
      const mSkin  = mat(COLOR_SKIN,      0.05, 0.80);
      const mCloth = mat(COLOR_LEATHER,   0.05, 0.85);
      const mDark  = mat(COLOR_TROUSERS,  0.05, 0.85);

      // Cart body (owner color -- very visible from above)
      const CART_BOT = 0.065 * HEX_R;  // above the wheels
      const CART_CTR = CART_BOT + 0.04 * HEX_R;
      const mCartB = new THREE.Mesh(getGeoCartBody(), mCart);
      mCartB.position.set(0, CART_CTR, 0);
      group.add(mCartB);

      // Wood trim on cart sides
      const gCartTrim = new THREE.BoxGeometry(0.26 * HEX_R, 0.016 * HEX_R, 0.15 * HEX_R);
      const mCartTrim = new THREE.Mesh(gCartTrim, mWood);
      mCartTrim.position.set(0, CART_CTR + 0.048 * HEX_R, 0);
      group.add(mCartTrim);

      // Two wheels (vertical cylinders, on each side)
      const WHEEL_Y = CART_BOT - 0.035 * HEX_R;
      const mWL = new THREE.Mesh(getGeoCartWheel(), mWood);
      mWL.position.set(0, WHEEL_Y, 0.080 * HEX_R);
      mWL.rotation.x = Math.PI / 2;
      group.add(mWL);

      const mWR = new THREE.Mesh(getGeoCartWheel(), mWood);
      mWR.position.set(0, WHEEL_Y, -0.080 * HEX_R);
      mWR.rotation.x = Math.PI / 2;
      group.add(mWR);

      // Axle
      const gAxle = new THREE.BoxGeometry(0.012 * HEX_R, 0.012 * HEX_R, 0.18 * HEX_R);
      const mAxle = new THREE.Mesh(gAxle, mSteel);
      mAxle.position.set(0, WHEEL_Y, 0);
      group.add(mAxle);

      // Standing figure on cart
      const FIG_BASE = CART_CTR + 0.04 * HEX_R;  // top of cart box
      const F_LEG_CTR = FIG_BASE + AV_LEG_H * 0.5;
      const F_TORSO_CTR = FIG_BASE + AV_LEG_H + AV_TORSO_H * 0.5;
      const F_TORSO_TOP = FIG_BASE + AV_LEG_H + AV_TORSO_H;
      const F_HEAD_CTR = F_TORSO_TOP + AV_NECK_H + AV_HEAD_S * 0.5;
      const F_HEAD_TOP = F_HEAD_CTR + AV_HEAD_S * 0.5;
      const F_ARM_CTR = FIG_BASE + AV_LEG_H + AV_TORSO_H * 0.55;

      // Legs
      const gFLegL = new THREE.BoxGeometry(AV_LEG_W, AV_LEG_H, AV_LEG_W);
      const mFLegL = new THREE.Mesh(gFLegL, mDark);
      mFLegL.position.set(-(AV_LEG_SEP + AV_LEG_W * 0.5), F_LEG_CTR, 0);
      group.add(mFLegL);

      const gFLegR = new THREE.BoxGeometry(AV_LEG_W, AV_LEG_H, AV_LEG_W);
      const mFLegR = new THREE.Mesh(gFLegR, mDark);
      mFLegR.position.set( (AV_LEG_SEP + AV_LEG_W * 0.5), F_LEG_CTR, 0);
      group.add(mFLegR);

      // Torso (cloth)
      const gFTorso = new THREE.BoxGeometry(AV_TORSO_W, AV_TORSO_H, AV_TORSO_D);
      const mFTorso = new THREE.Mesh(gFTorso, mCloth);
      mFTorso.position.set(0, F_TORSO_CTR, 0);
      group.add(mFTorso);

      // Arms
      const gFArmL = new THREE.BoxGeometry(AV_ARM_W, AV_ARM_H, AV_ARM_D);
      const mFArmL = new THREE.Mesh(gFArmL, mCloth);
      mFArmL.position.set(-AV_ARM_OFFSET_X, F_ARM_CTR, 0);
      group.add(mFArmL);

      const gFArmR = new THREE.BoxGeometry(AV_ARM_W, AV_ARM_H, AV_ARM_D);
      const mFArmR = new THREE.Mesh(gFArmR, mCloth);
      mFArmR.position.set( AV_ARM_OFFSET_X, F_ARM_CTR, 0);
      group.add(mFArmR);

      // Head
      const gFHead = new THREE.BoxGeometry(AV_HEAD_S, AV_HEAD_S, AV_HEAD_S);
      const mFHead = new THREE.Mesh(gFHead, mSkin);
      mFHead.position.set(0, F_HEAD_CTR, 0);
      group.add(mFHead);

      // Eyes
      const fEyeZ = AV_HEAD_S * 0.5 + 0.003 * HEX_R;
      const fEyeY = F_HEAD_CTR + 0.010 * HEX_R;
      const gFEyeL = new THREE.BoxGeometry(0.020 * HEX_R, 0.015 * HEX_R, 0.008 * HEX_R);
      const mFEyeL = new THREE.Mesh(gFEyeL, mat(COLOR_DARK_EYE, 0.02, 0.95));
      mFEyeL.position.set(-0.030 * HEX_R, fEyeY, fEyeZ);
      group.add(mFEyeL);

      const gFEyeR = new THREE.BoxGeometry(0.020 * HEX_R, 0.015 * HEX_R, 0.008 * HEX_R);
      const mFEyeR = new THREE.Mesh(gFEyeR, mat(COLOR_DARK_EYE, 0.02, 0.95));
      mFEyeR.position.set( 0.030 * HEX_R, fEyeY, fEyeZ);
      group.add(mFEyeR);

      // Reins (thin box from hands forward -- decorative)
      const gReins = new THREE.BoxGeometry(0.010 * HEX_R, 0.010 * HEX_R, 0.10 * HEX_R);
      const mReins = new THREE.Mesh(gReins, mat(COLOR_DARK_STEEL, 0.35, 0.55));
      mReins.position.set(0, F_ARM_CTR, -(AV_TORSO_D * 0.5 + 0.05 * HEX_R));
      group.add(mReins);

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = [
        gCartTrim, gAxle,
        gFLegL, gFLegR, gFTorso, gFArmL, gFArmR, gFHead, gFEyeL, gFEyeR, gReins
      ];
      return group;
    }

    // -----------------------------------------------------------------------
    case 'super': {
      // Elite: plumed helmet (tall plume in owner color), gilded armor,
      // dark cape behind, tall banner pole with flag, most ornate
      const { group, mats } = buildBaseAvatar(COLOR_SKIN, 0x808878, ownerColor_);
      const mat = makeMatFactory(mats);

      const mGold     = mat(COLOR_GOLD,        0.50, 0.40);
      const mSteel    = mat(COLOR_STEEL,        0.40, 0.50);
      const mDark     = mat(0x1a1a20,           0.10, 0.80);
      const mOwner    = mat(ownerColor_,        0.20, 0.55);
      const mPoleM    = mat(COLOR_POLE_GREY,    0.35, 0.55);

      // Gilded cuirass (gold armor over torso)
      const mCuir = new THREE.Mesh(getGeoCuirassBox(), mGold);
      mCuir.scale.set(1.05, 1.05, 1.05);
      mCuir.position.set(0, AV_Y_TORSO_CTR, 0);
      group.add(mCuir);

      // Gilded trim line (accent strip)
      const mTrim = new THREE.Mesh(getGeoGildedTrim(), mSteel);
      mTrim.position.set(0, AV_Y_TORSO_CTR + 0.02 * HEX_R, 0);
      group.add(mTrim);

      // Second trim at lower torso
      const mTrim2 = new THREE.Mesh(getGeoGildedTrim(), mGold);
      mTrim2.scale.set(1.0, 0.6, 1.0);
      mTrim2.position.set(0, AV_Y_TORSO_BOT + 0.02 * HEX_R, 0);
      group.add(mTrim2);

      // Shoulder pads (gold)
      const mSpL = new THREE.Mesh(getGeoShoulderPad(), mGold);
      mSpL.position.set(-AV_ARM_OFFSET_X + 0.005 * HEX_R, AV_Y_TORSO_TOP - 0.015 * HEX_R, 0);
      group.add(mSpL);

      const mSpR = new THREE.Mesh(getGeoShoulderPad(), mGold);
      mSpR.position.set( AV_ARM_OFFSET_X - 0.005 * HEX_R, AV_Y_TORSO_TOP - 0.015 * HEX_R, 0);
      group.add(mSpR);

      // Plumed helmet (dome + tall rectangular plume in owner color)
      const mHelm = new THREE.Mesh(getGeoHelmetDome(), mSteel);
      mHelm.position.set(0, AV_Y_HEAD_CTR + 0.015 * HEX_R, 0);
      group.add(mHelm);

      // Gold helmet rim
      const gHelmRim = new THREE.BoxGeometry(0.165 * HEX_R, 0.018 * HEX_R, 0.165 * HEX_R);
      const mHelmRim = new THREE.Mesh(gHelmRim, mGold);
      mHelmRim.position.set(0, AV_Y_HEAD_CTR - 0.015 * HEX_R, 0);
      group.add(mHelmRim);

      // Tall plume (owner color, swept back)
      const mPlume = new THREE.Mesh(getGeoSuperCrestPlume(), mOwner);
      mPlume.position.set(0, AV_Y_HEAD_TOP + 0.055 * HEX_R, -0.015 * HEX_R);
      mPlume.rotation.x = 0.30;
      group.add(mPlume);

      // Dark cape (thin box behind figure, angled)
      const mCape = new THREE.Mesh(getGeoSuperCape(), mDark);
      mCape.position.set(0, AV_Y_TORSO_CTR + 0.01 * HEX_R, -AV_TORSO_D * 0.5 - 0.006 * HEX_R);
      mCape.rotation.x = 0.22;
      group.add(mCape);

      // Tall banner pole (right side, taller than figure)
      const POLE_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.015 * HEX_R;
      const POLE_CTR_Y = AV_Y_LEG_BOT + 0.30 * HEX_R * 0.5;
      const POLE_TOP_Y = AV_Y_LEG_BOT + 0.30 * HEX_R;
      const mPole = new THREE.Mesh(getGeoBannerPole(), mPoleM);
      mPole.position.set(POLE_X, POLE_CTR_Y, 0);
      group.add(mPole);

      // Banner flag (owner color rectangle at top of pole)
      const mFlag = new THREE.Mesh(getGeoBannerFlag(), mOwner);
      mFlag.position.set(POLE_X + 0.047 * HEX_R, POLE_TOP_Y - 0.036 * HEX_R, 0);
      group.add(mFlag);

      // Gold finial (small cube atop pole)
      const gFinial = new THREE.BoxGeometry(0.022 * HEX_R, 0.022 * HEX_R, 0.022 * HEX_R);
      const mFinial = new THREE.Mesh(gFinial, mGold);
      mFinial.position.set(POLE_X, POLE_TOP_Y + 0.011 * HEX_R, 0);
      group.add(mFinial);

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = [gHelmRim, gFinial];
      return group;
    }

    // -----------------------------------------------------------------------
    case 'domyslny':
    default: {
      // Base avatar + simple upright spear (no armor, no hat)
      const { group, mats } = buildBaseAvatar(COLOR_SKIN, COLOR_CLOTH, ownerColor_);
      const mat = makeMatFactory(mats);

      const mWood  = mat(COLOR_WOOD,  0.05, 0.85);
      const mSteel = mat(COLOR_STEEL, 0.40, 0.50);

      // Simple spear (right side)
      const SPEAR_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.015 * HEX_R;
      const SPEAR_CTR = AV_Y_LEG_BOT + 0.02 * HEX_R + 0.40 * HEX_R * 0.5;
      const SPEAR_TOP = AV_Y_LEG_BOT + 0.02 * HEX_R + 0.40 * HEX_R;
      const mShaft = new THREE.Mesh(getGeoSpearShaft(), mWood);
      mShaft.position.set(SPEAR_X, SPEAR_CTR, 0);
      group.add(mShaft);

      const mTip = new THREE.Mesh(getGeoSpearTip(), mSteel);
      mTip.position.set(SPEAR_X, SPEAR_TOP + 0.028 * HEX_R, 0);
      group.add(mTip);

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

    // Dispose shared singleton geometries
    geoAvLeg?.dispose();    geoAvLeg    = null;
    geoAvTorso?.dispose();  geoAvTorso  = null;
    geoAvArm?.dispose();    geoAvArm    = null;
    geoAvNeck?.dispose();   geoAvNeck   = null;
    geoAvHead?.dispose();   geoAvHead   = null;
    geoAvEye?.dispose();    geoAvEye    = null;

    geoHighlight?.dispose(); geoHighlight = null;

    geoHatBrim?.dispose();      geoHatBrim      = null;
    geoHatCrown?.dispose();     geoHatCrown     = null;
    geoBackpack?.dispose();     geoBackpack     = null;
    geoSash?.dispose();         geoSash         = null;
    geoCuirassBox?.dispose();   geoCuirassBox   = null;
    geoCuirassGap?.dispose();   geoCuirassGap   = null;
    geoShoulderPad?.dispose();  geoShoulderPad  = null;
    geoHelmetDome?.dispose();   geoHelmetDome   = null;
    geoHelmetCrest?.dispose();  geoHelmetCrest  = null;
    geoHelmetSimple?.dispose(); geoHelmetSimple = null;
    geoSwordBlade?.dispose();   geoSwordBlade   = null;
    geoSwordCross?.dispose();   geoSwordCross   = null;
    geoSwordGrip?.dispose();    geoSwordGrip    = null;
    geoShieldRim?.dispose();    geoShieldRim    = null;
    geoShieldBoss?.dispose();   geoShieldBoss   = null;
    geoSmallShield?.dispose();  geoSmallShield  = null;
    geoSpearShaft?.dispose();   geoSpearShaft   = null;
    geoSpearTip?.dispose();     geoSpearTip     = null;
    geoJavShaft?.dispose();     geoJavShaft     = null;
    geoJavTip?.dispose();       geoJavTip       = null;
    geoQuiver?.dispose();       geoQuiver       = null;
    geoSlingStone?.dispose();   geoSlingStone   = null;
    geoClubHandle?.dispose();   geoClubHandle   = null;
    geoClubKnob?.dispose();     geoClubKnob     = null;
    geoAxeHandle?.dispose();    geoAxeHandle    = null;
    geoAxeBlade?.dispose();     geoAxeBlade     = null;
    geoHorseBody?.dispose();    geoHorseBody    = null;
    geoHorseNeck?.dispose();    geoHorseNeck    = null;
    geoHorseHead?.dispose();    geoHorseHead    = null;
    geoHorseLeg?.dispose();     geoHorseLeg     = null;
    geoCartBody?.dispose();     geoCartBody     = null;
    geoCartWheel?.dispose();    geoCartWheel    = null;
    geoSuperCrestPlume?.dispose(); geoSuperCrestPlume = null;
    geoSuperCape?.dispose();    geoSuperCape    = null;
    geoBannerPole?.dispose();   geoBannerPole   = null;
    geoBannerFlag?.dispose();   geoBannerFlag   = null;
    geoGildedTrim?.dispose();   geoGildedTrim   = null;
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
