"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/render/braz-lucznik-nubijski-opus5.ts
var braz_lucznik_nubijski_opus5_exports = {};
__export(braz_lucznik_nubijski_opus5_exports, {
  buildNubianArcherOpus5: () => buildNubianArcherOpus5,
  disposeBrazLucznikNubijskiOpus5Geometries: () => disposeBrazLucznikNubijskiOpus5Geometries
});
module.exports = __toCommonJS(braz_lucznik_nubijski_opus5_exports);
var THREE = __toESM(require("three"), 1);

// src/render/hexutil.ts
var HEX_R = 1;
var SQRT3 = Math.sqrt(3);

// src/render/braz-lucznik-nubijski-opus5.ts
function makeMats() {
  const mats = [];
  const mat = (color, metalness = 0.1, roughness = 0.7, transparent = false, opacity = 1) => {
    const m = new THREE.MeshStandardMaterial({ color, metalness, roughness, transparent, opacity });
    mats.push(m);
    return m;
  };
  return { mats, mat };
}
var NB_SKIN = 6043168;
var NB_SKIN_DK = 4006676;
var NB_HIDE = 9071170;
var NB_HIDE_DK = 6967086;
var NB_FRINGE = 5914404;
var NB_LEATHER = 7031336;
var NB_LEATHER_DK = 4862747;
var NB_HEADBAND = 4862747;
var NB_WOOD_BOW = 7294508;
var NB_WOOD_SHAFT = 10254152;
var NB_STRING = 15261900;
var NB_SINEW = 14207912;
var NB_BRONZE = 13603380;
var NB_BRONZE_LT = 14329934;
var NB_HAIR = 1379591;
var NB_FEATHER = 15393746;
var NB_FEATHER_DK = 9206884;
var NB_SHIELD = 9058854;
var NB_SHIELD_DK = 5907478;
var NB_EYE = 1314828;
var NB_HIP_Y = 0.208 * HEX_R;
var NB_TORSO_W = 0.18 * HEX_R;
var NB_TORSO_H = 0.205 * HEX_R;
var NB_TORSO_D = 0.1 * HEX_R;
var NB_TORSO_BOT = 0.24 * HEX_R;
var NB_TORSO_CTR = NB_TORSO_BOT + NB_TORSO_H * 0.5;
var NB_TORSO_TOP = NB_TORSO_BOT + NB_TORSO_H;
var NB_NECK_H = 0.028 * HEX_R;
var NB_HEAD_S = 0.128 * HEX_R;
var NB_HEAD_CTR = NB_TORSO_TOP + NB_NECK_H + NB_HEAD_S * 0.5;
var NB_HEAD_TOP = NB_TORSO_TOP + NB_NECK_H + NB_HEAD_S;
var NB_SHLD_X = NB_TORSO_W * 0.5 + 0.03 * HEX_R;
var NB_SHLD_Y = NB_TORSO_TOP - 0.024 * HEX_R;
var NB_HIP_X = 0.052 * HEX_R;
var NB_THIGH_L = 0.104 * HEX_R;
var NB_SHIN_L = 0.096 * HEX_R;
var NB_UPARM_L = 0.1 * HEX_R;
var NB_FOREARM_L = 0.092 * HEX_R;
var gNBTorso = null;
var gNBChest = null;
var gNBNeck = null;
var gNBHead = null;
var gNBJaw = null;
var gNBNose = null;
var gNBEar = null;
var gNBEye = null;
var gNBThigh = null;
var gNBShin = null;
var gNBSole = null;
var gNBToes = null;
var gNBUpArm = null;
var gNBForearm = null;
var gNBFist = null;
var gNBUnit = null;
var gNBHideWrap = null;
var gNBHidePan = null;
var gNBFringe = null;
var gNBBelt = null;
var gNBKnot = null;
var gNBBracer = null;
var gNBHairCap = null;
var gNBHeadBand = null;
var gNBFeather = null;
var gNBFeatTip = null;
var gNBFeatTuft = null;
var gNBShinWrap = null;
var gNBGrip = null;
var gNBGripWrap = null;
var gNBNock = null;
var gNBArrowTip = null;
var gNBBinding = null;
var gNBFletch = null;
var gNBQuiver = null;
var gNBQRim = null;
var gNBQStrap = null;
var gNBQArrow = null;
var gNBShield = null;
var gNBShieldRim = null;
var gNBShieldStrap = null;
function getNBTorso() {
  return gNBTorso ||= new THREE.BoxGeometry(NB_TORSO_W, NB_TORSO_H, NB_TORSO_D);
}
function getNBChest() {
  return gNBChest ||= new THREE.BoxGeometry(NB_TORSO_W * 1.05, 0.072 * HEX_R, NB_TORSO_D * 1.06);
}
function getNBNeck() {
  return gNBNeck ||= new THREE.BoxGeometry(0.042 * HEX_R, NB_NECK_H * 1.6, 0.042 * HEX_R);
}
function getNBHead() {
  return gNBHead ||= new THREE.BoxGeometry(NB_HEAD_S, NB_HEAD_S, NB_HEAD_S);
}
function getNBJaw() {
  return gNBJaw ||= new THREE.BoxGeometry(0.086 * HEX_R, 0.034 * HEX_R, 0.038 * HEX_R);
}
function getNBNose() {
  return gNBNose ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.026 * HEX_R, 0.016 * HEX_R);
}
function getNBEar() {
  return gNBEar ||= new THREE.BoxGeometry(0.01 * HEX_R, 0.032 * HEX_R, 0.022 * HEX_R);
}
function getNBEye() {
  return gNBEye ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.011 * HEX_R, 8e-3 * HEX_R);
}
function getNBThigh() {
  return gNBThigh ||= new THREE.BoxGeometry(0.056 * HEX_R, NB_THIGH_L, 0.06 * HEX_R);
}
function getNBShin() {
  return gNBShin ||= new THREE.BoxGeometry(0.038 * HEX_R, NB_SHIN_L, 0.042 * HEX_R);
}
function getNBSole() {
  return gNBSole ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.018 * HEX_R, 0.062 * HEX_R);
}
function getNBToes() {
  return gNBToes ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.014 * HEX_R, 0.022 * HEX_R);
}
function getNBUpArm() {
  return gNBUpArm ||= new THREE.BoxGeometry(0.054 * HEX_R, NB_UPARM_L, 0.054 * HEX_R);
}
function getNBForearm() {
  return gNBForearm ||= new THREE.BoxGeometry(0.04 * HEX_R, NB_FOREARM_L, 0.04 * HEX_R);
}
function getNBFist() {
  return gNBFist ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R);
}
function getNBUnit() {
  return gNBUnit ||= new THREE.BoxGeometry(1, 1, 1);
}
function getNBHideWrap() {
  return gNBHideWrap ||= new THREE.BoxGeometry(0.206 * HEX_R, 0.088 * HEX_R, 0.126 * HEX_R);
}
function getNBHidePan() {
  return gNBHidePan ||= new THREE.BoxGeometry(0.084 * HEX_R, 0.07 * HEX_R, 0.014 * HEX_R);
}
function getNBFringe() {
  return gNBFringe ||= new THREE.BoxGeometry(0.017 * HEX_R, 0.058 * HEX_R, 0.01 * HEX_R);
}
function getNBBelt() {
  return gNBBelt ||= new THREE.BoxGeometry(0.198 * HEX_R, 0.024 * HEX_R, 0.122 * HEX_R);
}
function getNBKnot() {
  return gNBKnot ||= new THREE.BoxGeometry(0.036 * HEX_R, 0.032 * HEX_R, 0.019 * HEX_R);
}
function getNBBracer() {
  return gNBBracer ||= new THREE.BoxGeometry(0.05 * HEX_R, 0.046 * HEX_R, 0.05 * HEX_R);
}
function getNBHairCap() {
  return gNBHairCap ||= new THREE.BoxGeometry(0.13 * HEX_R, 0.04 * HEX_R, 0.13 * HEX_R);
}
function getNBHeadBand() {
  return gNBHeadBand ||= new THREE.BoxGeometry(0.136 * HEX_R, 0.024 * HEX_R, 0.136 * HEX_R);
}
function getNBFeather() {
  return gNBFeather ||= new THREE.BoxGeometry(0.02 * HEX_R, 0.1 * HEX_R, 0.01 * HEX_R);
}
function getNBFeatTip() {
  return gNBFeatTip ||= new THREE.BoxGeometry(0.013 * HEX_R, 0.036 * HEX_R, 8e-3 * HEX_R);
}
function getNBFeatTuft() {
  return gNBFeatTuft ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.02 * HEX_R, 0.026 * HEX_R);
}
function getNBShinWrap() {
  return gNBShinWrap ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.02 * HEX_R, 0.046 * HEX_R);
}
function getNBGrip() {
  return gNBGrip ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.076 * HEX_R, 0.026 * HEX_R);
}
function getNBGripWrap() {
  return gNBGripWrap ||= new THREE.BoxGeometry(0.029 * HEX_R, 0.04 * HEX_R, 0.031 * HEX_R);
}
function getNBNock() {
  return gNBNock ||= new THREE.BoxGeometry(0.015 * HEX_R, 0.019 * HEX_R, 0.017 * HEX_R);
}
function getNBArrowTip() {
  return gNBArrowTip ||= new THREE.ConeGeometry(0.012 * HEX_R, 0.044 * HEX_R, 4);
}
function getNBBinding() {
  return gNBBinding ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.016 * HEX_R, 0.016 * HEX_R);
}
function getNBFletch() {
  return gNBFletch ||= new THREE.BoxGeometry(6e-3 * HEX_R, 0.048 * HEX_R, 0.024 * HEX_R);
}
function getNBQuiver() {
  return gNBQuiver ||= new THREE.BoxGeometry(0.048 * HEX_R, 0.156 * HEX_R, 0.048 * HEX_R);
}
function getNBQRim() {
  return gNBQRim ||= new THREE.BoxGeometry(0.056 * HEX_R, 0.018 * HEX_R, 0.056 * HEX_R);
}
function getNBQStrap() {
  return gNBQStrap ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.23 * HEX_R, 0.01 * HEX_R);
}
function getNBQArrow() {
  return gNBQArrow ||= new THREE.BoxGeometry(9e-3 * HEX_R, 0.09 * HEX_R, 9e-3 * HEX_R);
}
function getNBShield() {
  return gNBShield ||= new THREE.CylinderGeometry(0.076 * HEX_R, 0.076 * HEX_R, 0.014 * HEX_R, 10, 1);
}
function getNBShieldRim() {
  return gNBShieldRim ||= new THREE.CylinderGeometry(0.02 * HEX_R, 0.02 * HEX_R, 0.02 * HEX_R, 8, 1);
}
function getNBShieldStrap() {
  return gNBShieldStrap ||= new THREE.BoxGeometry(0.02 * HEX_R, 0.17 * HEX_R, 9e-3 * HEX_R);
}
var NB_Y_UP = new THREE.Vector3(0, 1, 0);
function nbDirDown(theta) {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}
function nbSeg(group, geo, mtl, P, theta, len) {
  const dir = nbDirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}
function nbSegDir(group, geo, mtl, A, D, len) {
  const mesh = new THREE.Mesh(geo, mtl);
  if (D.y < -0.9999) mesh.rotation.x = Math.PI;
  else mesh.quaternion.setFromUnitVectors(NB_Y_UP, D);
  mesh.position.copy(A.clone().addScaledVector(D, len * 0.5));
  group.add(mesh);
  return A.clone().addScaledVector(D, len);
}
function nbStretch(parent, mtl, A, B, w, d) {
  const v = B.clone().sub(A);
  const len = v.length();
  const D = v.clone().normalize();
  const mesh = new THREE.Mesh(getNBUnit(), mtl);
  mesh.scale.set(w, len, d ?? w);
  if (D.y < -0.9999) mesh.rotation.x = Math.PI;
  else mesh.quaternion.setFromUnitVectors(NB_Y_UP, D);
  mesh.position.copy(A.clone().addScaledVector(D, len * 0.5));
  parent.add(mesh);
  return mesh;
}
function nbBuildLeg(group, sx, thU, thL, mSkin, mSkinDk, hipY) {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = nbSeg(group, getNBThigh(), mSkin, P, thU, NB_THIGH_L);
  P.z -= 4e-3 * HEX_R;
  P.y += 8e-3 * HEX_R;
  P = nbSeg(group, getNBShin(), mSkin, P, thL, NB_SHIN_L);
  const footZ = P.z + 0.012 * HEX_R;
  const sole = new THREE.Mesh(getNBSole(), mSkin);
  sole.position.set(sx, 9e-3 * HEX_R, footZ);
  group.add(sole);
  const toes = new THREE.Mesh(getNBToes(), mSkinDk);
  toes.position.set(sx, 7e-3 * HEX_R, footZ + 0.038 * HEX_R);
  group.add(toes);
  return { ankle: P, footZ };
}
function nbArmIK(group, S, T, pole, mUp, mFore, mFist) {
  const L1 = NB_UPARM_L, L2 = NB_FOREARM_L;
  const dv = T.clone().sub(S);
  const dist = Math.min(dv.length(), (L1 + L2) * 0.999);
  const dn = dv.clone().normalize();
  const a = (dist * dist + L1 * L1 - L2 * L2) / (2 * dist);
  const h = Math.sqrt(Math.max(L1 * L1 - a * a, 0));
  const C = S.clone().addScaledVector(dn, a);
  const pp = pole.clone().sub(dn.clone().multiplyScalar(pole.dot(dn)));
  if (pp.lengthSq() < 1e-8) pp.set(0, -1, 0);
  pp.normalize();
  const E = C.clone().addScaledVector(pp, h);
  const dU = E.clone().sub(S).normalize();
  nbSegDir(group, getNBUpArm(), mUp, S, dU, L1);
  const elbow = S.clone().addScaledVector(dU, L1);
  const axis = T.clone().sub(elbow).normalize();
  const hand = nbSegDir(group, getNBForearm(), mFore, elbow, axis, L2);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getNBFist(), mFist);
    if (axis.y < -0.9999) fist.rotation.x = Math.PI;
    else fist.quaternion.setFromUnitVectors(NB_Y_UP, axis);
    fist.position.copy(hand.clone().addScaledVector(axis, 0.012 * HEX_R));
    group.add(fist);
  }
  return { hand, axis, elbow };
}
function nbBuildCore(group, mTorso, mSkin, mSkinDk) {
  const torso = new THREE.Mesh(getNBTorso(), mTorso);
  torso.position.set(0, NB_TORSO_CTR, 0);
  group.add(torso);
  const chest = new THREE.Mesh(getNBChest(), mTorso);
  chest.position.set(0, NB_TORSO_TOP - 0.038 * HEX_R, 0);
  group.add(chest);
  const neck = new THREE.Mesh(getNBNeck(), mSkin);
  neck.position.set(0, NB_TORSO_TOP + NB_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(getNBHead(), mSkin);
  head.position.set(0, NB_HEAD_CTR, 0);
  group.add(head);
  const jaw = new THREE.Mesh(getNBJaw(), mSkinDk);
  jaw.position.set(0, NB_HEAD_CTR - NB_HEAD_S * 0.38, 0.01 * HEX_R);
  group.add(jaw);
  const nose = new THREE.Mesh(getNBNose(), mSkin);
  nose.position.set(0, NB_HEAD_CTR - 4e-3 * HEX_R, NB_HEAD_S * 0.5 + 6e-3 * HEX_R);
  group.add(nose);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(getNBEar(), mSkinDk);
    ear.position.set(sx * (NB_HEAD_S * 0.5 + 4e-3 * HEX_R), NB_HEAD_CTR - 6e-3 * HEX_R, 0);
    group.add(ear);
  }
}
var NB_GRIP = new THREE.Vector3(0.088 * HEX_R, 0.442 * HEX_R, 0.185 * HEX_R);
var NB_NOCK = new THREE.Vector3(-0.052 * HEX_R, 0.458 * HEX_R, -0.02 * HEX_R);
function nbAddBowLimbs(group, mBow, mWrap) {
  const PROFILE = [
    [0.04, 6e-3],
    [0.15, 0.014],
    [0.26, 0.018],
    [0.35, 0.014],
    [0.42, -0.01]
  ];
  const W = [0.017, 0.015, 0.013, 0.011];
  const dirA = NB_GRIP.clone().sub(NB_NOCK).normalize();
  const yaw = Math.atan2(dirA.x, dirA.z);
  const bow = new THREE.Group();
  bow.position.copy(NB_GRIP);
  bow.rotation.y = yaw;
  const grip = new THREE.Mesh(getNBGrip(), mBow);
  bow.add(grip);
  const wrap = new THREE.Mesh(getNBGripWrap(), mWrap);
  bow.add(wrap);
  for (const sg of [1, -1]) {
    for (let i = 0; i < PROFILE.length - 1; i++) {
      const p = PROFILE[i], q = PROFILE[i + 1];
      const A = new THREE.Vector3(0, sg * p[0] * HEX_R, p[1] * HEX_R);
      const B = new THREE.Vector3(0, sg * q[0] * HEX_R, q[1] * HEX_R);
      nbStretch(bow, mBow, A, B, W[i] * HEX_R, (W[i] + 3e-3) * HEX_R);
    }
    const last2 = PROFILE[PROFILE.length - 1];
    const nock = new THREE.Mesh(getNBNock(), mBow);
    nock.position.set(0, sg * last2[0] * HEX_R, last2[1] * HEX_R);
    bow.add(nock);
  }
  group.add(bow);
  const last = PROFILE[PROFILE.length - 1];
  const rotY = new THREE.Matrix4().makeRotationY(yaw);
  const tipTop = new THREE.Vector3(0, last[0] * HEX_R, last[1] * HEX_R).applyMatrix4(rotY).add(NB_GRIP);
  const tipBot = new THREE.Vector3(0, -last[0] * HEX_R, last[1] * HEX_R).applyMatrix4(rotY).add(NB_GRIP);
  return { tipTop, tipBot };
}
function nbAddString(group, tipTop, tipBot, mString) {
  nbStretch(group, mString, tipTop, NB_NOCK, 7e-3 * HEX_R);
  nbStretch(group, mString, tipBot, NB_NOCK, 7e-3 * HEX_R);
}
function nbAddArrow(group, mShaft, mBronze, mSinew, mFletch) {
  const dirA = NB_GRIP.clone().sub(NB_NOCK).normalize();
  const shaftEnd = NB_GRIP.clone().addScaledVector(dirA, 0.058 * HEX_R);
  nbStretch(group, mShaft, NB_NOCK, shaftEnd, 0.011 * HEX_R);
  const bind = new THREE.Mesh(getNBBinding(), mSinew);
  bind.quaternion.setFromUnitVectors(NB_Y_UP, dirA);
  bind.position.copy(shaftEnd.clone().addScaledVector(dirA, 4e-3 * HEX_R));
  group.add(bind);
  const tip = new THREE.Mesh(getNBArrowTip(), mBronze);
  tip.quaternion.setFromUnitVectors(NB_Y_UP, dirA);
  tip.position.copy(shaftEnd.clone().addScaledVector(dirA, 0.024 * HEX_R));
  group.add(tip);
  for (const rz of [0, Math.PI / 2]) {
    const fl = new THREE.Mesh(getNBFletch(), mFletch);
    fl.quaternion.setFromUnitVectors(NB_Y_UP, dirA);
    fl.rotateY(rz);
    fl.position.copy(NB_NOCK.clone().addScaledVector(dirA, 0.03 * HEX_R));
    group.add(fl);
  }
}
function nbAddQuiver(group, mLeath, mLeathDk, mShaft, mFletchOwner) {
  const QX = -0.056 * HEX_R;
  const QZ = -(NB_TORSO_D * 0.5 + 0.032 * HEX_R);
  const q = new THREE.Mesh(getNBQuiver(), mLeath);
  q.rotation.x = -0.24;
  q.rotation.z = 0.22;
  q.position.set(QX, NB_TORSO_CTR + 0.05 * HEX_R, QZ);
  group.add(q);
  const rim = new THREE.Mesh(getNBQRim(), mLeathDk);
  rim.rotation.x = -0.24;
  rim.rotation.z = 0.22;
  rim.position.set(QX - 0.018 * HEX_R, NB_TORSO_CTR + 0.126 * HEX_R, QZ - 0.02 * HEX_R);
  group.add(rim);
  const strapB = new THREE.Mesh(getNBQStrap(), mLeathDk);
  strapB.rotation.set(0.1, 0, -0.62);
  strapB.position.set(-0.012 * HEX_R, NB_TORSO_CTR + 0.01 * HEX_R, -(NB_TORSO_D * 0.5 + 8e-3 * HEX_R));
  group.add(strapB);
  const strapF = new THREE.Mesh(getNBQStrap(), mLeath);
  strapF.rotation.set(-0.1, 0, 0.6);
  strapF.position.set(-0.01 * HEX_R, NB_TORSO_CTR + 8e-3 * HEX_R, NB_TORSO_D * 0.5 + 6e-3 * HEX_R);
  group.add(strapF);
  for (const [dx, dy] of [[-0.022, 0], [2e-3, 0.012], [0.02, -6e-3]]) {
    const sh = new THREE.Mesh(getNBQArrow(), mShaft);
    sh.rotation.x = -0.24;
    sh.rotation.z = 0.22;
    sh.position.set(QX + dx * HEX_R, NB_TORSO_CTR + (0.14 + dy) * HEX_R, QZ - 0.02 * HEX_R);
    group.add(sh);
    const f = new THREE.Mesh(getNBFletch(), mFletchOwner);
    f.rotation.x = -0.24;
    f.rotation.z = 0.22;
    f.scale.set(1, 0.66, 0.66);
    f.position.set(QX + (dx - 0.012) * HEX_R, NB_TORSO_CTR + (0.18 + dy) * HEX_R, QZ - 0.03 * HEX_R);
    group.add(f);
  }
}
function nbAddBackShield(group, mShield, mShieldDk, mStrap) {
  const SX = 0.052 * HEX_R;
  const SZ = -(NB_TORSO_D * 0.5 + 0.02 * HEX_R);
  const SY = NB_TORSO_BOT + 0.058 * HEX_R;
  const face = new THREE.Mesh(getNBShield(), mShield);
  face.rotation.x = Math.PI / 2 - 0.3;
  face.rotation.z = 0.1;
  face.position.set(SX, SY, SZ);
  group.add(face);
  const boss = new THREE.Mesh(getNBShieldRim(), mShieldDk);
  boss.rotation.x = Math.PI / 2 - 0.3;
  boss.position.set(SX, SY, SZ - 0.012 * HEX_R);
  group.add(boss);
  const strap = new THREE.Mesh(getNBShieldStrap(), mStrap);
  strap.rotation.set(0.06, 0, 0.3);
  strap.position.set(SX * 0.4, NB_TORSO_CTR - 0.01 * HEX_R, SZ + 6e-3 * HEX_R);
  group.add(strap);
}
function nbArcherLegs(group, mSkin, mSkinDk) {
  const HIP = NB_HIP_Y - 6e-3 * HEX_R;
  nbBuildLeg(group, NB_HIP_X, 0.3, 0.16, mSkin, mSkinDk, HIP);
  nbBuildLeg(group, -NB_HIP_X, -0.34, -0.14, mSkin, mSkinDk, HIP);
  for (const sx of [-1, 1]) {
    const wrap = new THREE.Mesh(getNBShinWrap(), mSkinDk);
    wrap.position.set(sx * NB_HIP_X * 1.05, 0.052 * HEX_R, sx > 0 ? 6e-3 * HEX_R : -2e-3 * HEX_R);
    group.add(wrap);
  }
}
function nbArcherArms(group, mUp, mFore, mFist) {
  const left = nbArmIK(
    group,
    new THREE.Vector3(NB_SHLD_X, NB_SHLD_Y, 0),
    NB_GRIP,
    new THREE.Vector3(0.55, -0.7, 0.2),
    mUp,
    mFore,
    mFist
  );
  const right = nbArmIK(
    group,
    new THREE.Vector3(-NB_SHLD_X, NB_SHLD_Y, 0),
    NB_NOCK,
    new THREE.Vector3(-0.55, 0.85, -0.25),
    mUp,
    mFore,
    mFist
  );
  return { left, right };
}
function buildNubianArcherOpus5(ownerColor_) {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();
  const mSkin = mat(NB_SKIN, 0.05, 0.82);
  const mSkinDk = mat(NB_SKIN_DK, 0.05, 0.85);
  const mHide = mat(NB_HIDE, 0.05, 0.86);
  const mHideDk = mat(NB_HIDE_DK, 0.05, 0.88);
  const mFringe = mat(NB_FRINGE, 0.05, 0.88);
  const mOwner = mat(ownerColor_, 0.1, 0.7);
  const mWood = mat(NB_WOOD_BOW, 0.05, 0.84);
  const mShaft = mat(NB_WOOD_SHAFT, 0.05, 0.84);
  const mLeath = mat(NB_LEATHER, 0.06, 0.82);
  const mLeathDk = mat(NB_LEATHER_DK, 0.06, 0.86);
  const mHeadBand = mat(NB_HEADBAND, 0.06, 0.84);
  const mString = mat(NB_STRING, 0.02, 0.95);
  const mSinew = mat(NB_SINEW, 0.03, 0.92);
  const mBronze = mat(NB_BRONZE, 0.55, 0.4);
  const mBronzeLt = mat(NB_BRONZE_LT, 0.6, 0.34);
  const mHair = mat(NB_HAIR, 0.04, 0.9);
  const mFeath = mat(NB_FEATHER, 0.03, 0.92);
  const mFeathDk = mat(NB_FEATHER_DK, 0.04, 0.9);
  const mShield = mat(NB_SHIELD, 0.05, 0.84);
  const mShieldDk = mat(NB_SHIELD_DK, 0.05, 0.86);
  const mEye = mat(NB_EYE, 0.05, 0.86);
  nbBuildCore(group, mSkin, mSkin, mSkinDk);
  nbArcherLegs(group, mSkin, mSkinDk);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(getNBEye(), mEye);
    eye.position.set(sx * 0.026 * HEX_R, NB_HEAD_CTR + 0.014 * HEX_R, NB_HEAD_S * 0.5 + 2e-3 * HEX_R);
    group.add(eye);
  }
  const hair = new THREE.Mesh(getNBHairCap(), mHair);
  hair.position.set(0, NB_HEAD_TOP - 0.02 * HEX_R, 0);
  group.add(hair);
  const band = new THREE.Mesh(getNBHeadBand(), mHeadBand);
  band.position.set(0, NB_HEAD_CTR + 0.04 * HEX_R, 0);
  group.add(band);
  const featTuft = new THREE.Mesh(getNBFeatTuft(), mFeathDk);
  featTuft.position.set(-6e-3 * HEX_R, NB_HEAD_TOP + 0.01 * HEX_R, -0.03 * HEX_R);
  group.add(featTuft);
  const feather = new THREE.Mesh(getNBFeather(), mFeath);
  feather.rotation.x = -0.06;
  feather.position.set(-6e-3 * HEX_R, NB_HEAD_TOP + 0.062 * HEX_R, -0.032 * HEX_R);
  group.add(feather);
  const featTip = new THREE.Mesh(getNBFeatTip(), mFeathDk);
  featTip.rotation.x = -0.06;
  featTip.position.set(-6e-3 * HEX_R, NB_HEAD_TOP + 0.116 * HEX_R, -0.036 * HEX_R);
  group.add(featTip);
  const wrap = new THREE.Mesh(getNBHideWrap(), mHide);
  wrap.position.set(0, NB_TORSO_BOT - 0.024 * HEX_R, 0);
  group.add(wrap);
  const panel = new THREE.Mesh(getNBHidePan(), mHideDk);
  panel.rotation.x = -0.08;
  panel.position.set(0, NB_TORSO_BOT - 0.04 * HEX_R, NB_TORSO_D * 0.5 + 0.02 * HEX_R);
  group.add(panel);
  for (const sx of [-0.066, -0.022, 0.022, 0.066]) {
    const fr = new THREE.Mesh(getNBFringe(), mFringe);
    fr.position.set(sx * HEX_R, NB_TORSO_BOT - 0.058 * HEX_R, NB_TORSO_D * 0.5 + 0.01 * HEX_R);
    group.add(fr);
  }
  const belt = new THREE.Mesh(getNBBelt(), mOwner);
  belt.position.set(0, NB_TORSO_BOT + 0.014 * HEX_R, 0);
  group.add(belt);
  const knot = new THREE.Mesh(getNBKnot(), mOwner);
  knot.position.set(0.03 * HEX_R, NB_TORSO_BOT + 8e-3 * HEX_R, NB_TORSO_D * 0.5 + 0.012 * HEX_R);
  group.add(knot);
  const arms = nbArcherArms(group, mSkin, mSkin, mSkinDk);
  const bracer = new THREE.Mesh(getNBBracer(), mLeath);
  bracer.quaternion.setFromUnitVectors(NB_Y_UP, arms.left.axis);
  bracer.position.copy(arms.left.hand.clone().addScaledVector(arms.left.axis, -0.04 * HEX_R));
  group.add(bracer);
  nbAddQuiver(group, mLeath, mLeathDk, mShaft, mOwner);
  nbAddBackShield(group, mShield, mShieldDk, mLeathDk);
  const bow = nbAddBowLimbs(group, mWood, mLeath);
  nbAddString(group, bow.tipTop, bow.tipBot, mString);
  nbAddArrow(group, mShaft, mBronze, mSinew, mOwner);
  group.userData["mats"] = mats;
  group.userData["perTokenGeos"] = [];
  return group;
}
function disposeBrazLucznikNubijskiOpus5Geometries() {
  const all = [
    gNBTorso,
    gNBChest,
    gNBNeck,
    gNBHead,
    gNBJaw,
    gNBNose,
    gNBEar,
    gNBEye,
    gNBThigh,
    gNBShin,
    gNBSole,
    gNBToes,
    gNBUpArm,
    gNBForearm,
    gNBFist,
    gNBUnit,
    gNBHideWrap,
    gNBHidePan,
    gNBFringe,
    gNBBelt,
    gNBKnot,
    gNBBracer,
    gNBHairCap,
    gNBHeadBand,
    gNBFeather,
    gNBFeatTip,
    gNBFeatTuft,
    gNBShinWrap,
    gNBGrip,
    gNBGripWrap,
    gNBNock,
    gNBArrowTip,
    gNBBinding,
    gNBFletch,
    gNBQuiver,
    gNBQRim,
    gNBQStrap,
    gNBQArrow,
    gNBShield,
    gNBShieldRim,
    gNBShieldStrap
  ];
  for (const g of all) {
    g?.dispose();
  }
  gNBTorso = gNBChest = gNBNeck = gNBHead = gNBJaw = gNBNose = gNBEar = gNBEye = null;
  gNBThigh = gNBShin = gNBSole = gNBToes = gNBUpArm = gNBForearm = gNBFist = gNBUnit = null;
  gNBHideWrap = gNBHidePan = gNBFringe = gNBBelt = gNBKnot = gNBBracer = null;
  gNBHairCap = gNBHeadBand = gNBFeather = gNBFeatTip = gNBFeatTuft = gNBShinWrap = null;
  gNBGrip = gNBGripWrap = gNBNock = gNBArrowTip = gNBBinding = gNBFletch = null;
  gNBQuiver = gNBQRim = gNBQStrap = gNBQArrow = null;
  gNBShield = gNBShieldRim = gNBShieldStrap = null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildNubianArcherOpus5,
  disposeBrazLucznikNubijskiOpus5Geometries
});
