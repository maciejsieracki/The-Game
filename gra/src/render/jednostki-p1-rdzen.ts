/**
 * jednostki-p1-rdzen.ts — PACZKA 1/8: rdzen generyczny (7 jednostek)
 * ---------------------------------------------------------------------------
 * Zamienniki 1:1 dla starych tokenow z render/units.ts (buildCategoryModel):
 *   buildWojownikKamien(color) -> case 'domyslny'   (~units.ts:5730)
 *   buildOszczepnik(color)     -> case 'oszczepnik' (~units.ts:4684)
 *   buildLucznik(color)        -> case 'lucznik'    (~units.ts:4509)
 *   buildZwiadowca(color)      -> case 'zwiadowca'  (~units.ts:5501)
 *   buildProcarz(color)        -> case 'procarz'    (~units.ts:4615)
 *   buildWlocznik(color)       -> case 'wlocznik'   (~units.ts:4405)
 *   buildMiecznik(color)       -> case 'miecznik'   (~units.ts:4307)
 *
 * Wzorzec anatomii: _sandbox/MASTER/render-jednostki/hastati-falangita.ts
 *   - konczyny lancuchowe (p1Seg / p1BuildLeg / p1BuildArm), piesc = kotwica
 *     osi broni; stopy na y=0; przod = +Z; uklad prawoskretny => LEWA = +X;
 *   - geometrie wspolne = singletony modulu (rejestr getG), perTokenGeos=[];
 *   - group.userData['mats'] jak w units.ts (dispose bez zmian).
 *
 * ZASADY WLASCICIELA: tarcza ZAWSZE w LEWEJ (+X), bron w PRAWEJ (-X);
 * kazda figurka w POZIE AKCJI; NAKRYCIE GLOWY OBOWIAZKOWE (kamien: skorzane/
 * futrzane czapy z klem/piorem; braz: proste helmy stozkowe z brazu);
 * kolor gracza: szarfa na piersi (jak sash buildBaseAvatar) + pola tarcz /
 * kolczan / klamra tam, gdzie niosl go stary model; budzet <=~460 tri.
 *
 * Epoka czytelna: KAMIEN = skory, futra, krzemien, drewno, kosc;
 * BRAZ = barwione tuniki + polyskliwy braz (metalness wysoki).
 */

import * as THREE from 'three';
import { HEX_R } from './hexutil';

type MatFactory = (color: number, metalness?: number, roughness?: number,
                   transparent?: boolean, opacity?: number) => THREE.MeshStandardMaterial;

function makeMats(): { mats: THREE.Material[]; mat: MatFactory } {
  const mats: THREE.Material[] = [];
  const mat: MatFactory = (color, metalness = 0.1, roughness = 0.7, transparent = false, opacity = 1.0) => {
    const m = new THREE.MeshStandardMaterial({ color, metalness, roughness, transparent, opacity });
    mats.push(m);
    return m;
  };
  return { mats, mat };
}

// ── kolory serii ────────────────────────────────────────────────────────────
const P1_SKIN      = 0xe0ac69;
const P1_SKIN_DARK = 0xc89058;
const P1_FUR_DK    = 0x5f4a30;   // ciemne futro (czapa, kamizela)
const P1_FUR_LT    = 0x8a6f4d;   // jasniejsze futro / skora surowa
const P1_LEATHER   = 0x6b4a28;
const P1_LEATH_LT  = 0x96703f;   // jasna skora (kamizela lucznika)
const P1_WOOD      = 0x7a5c3a;
const P1_WOOD_DK   = 0x5c452c;
const P1_FLINT     = 0x8d9298;   // krzemien (chlodny szary)
const P1_BONE      = 0xe6ddc2;   // kiel / kosc / piora
const P1_BRONZE    = 0xcf9234;
const P1_BRONZE_LT = 0xd8ab52;
const P1_STRING    = 0xd8cfb4;   // cieciwa / sznur procy
const P1_OCHRE     = 0xc8932e;   // tunika procarza (braz)
const P1_TEAL      = 0x1f7a78;   // tunika wlocznika (braz)
const P1_RUST      = 0xb5482f;   // tunika miecznika (braz)
const P1_OLIVE     = 0x5d6b34;   // tunika zwiadowcy
const P1_STONE     = 0x8a857c;   // kamien procy

// ── wymiary sylwetki (rodzina hastati-falangita / jezdziec) ────────────────
const P1_HIP_Y     = 0.208 * HEX_R;
const P1_TORSO_W   = 0.180 * HEX_R;
const P1_TORSO_H   = 0.205 * HEX_R;
const P1_TORSO_D   = 0.100 * HEX_R;
const P1_TORSO_BOT = 0.240 * HEX_R;
const P1_TORSO_CTR = P1_TORSO_BOT + P1_TORSO_H * 0.5;
const P1_TORSO_TOP = P1_TORSO_BOT + P1_TORSO_H;
const P1_NECK_H    = 0.028 * HEX_R;
const P1_HEAD_S    = 0.128 * HEX_R;
const P1_HEAD_CTR  = P1_TORSO_TOP + P1_NECK_H + P1_HEAD_S * 0.5;
const P1_HEAD_TOP  = P1_TORSO_TOP + P1_NECK_H + P1_HEAD_S;
const P1_SHLD_X    = P1_TORSO_W * 0.5 + 0.030 * HEX_R;
const P1_SHLD_Y    = P1_TORSO_TOP - 0.024 * HEX_R;
const P1_HIP_X     = 0.052 * HEX_R;
const P1_THIGH_L   = 0.104 * HEX_R;
const P1_SHIN_L    = 0.096 * HEX_R;
const P1_UPARM_L   = 0.100 * HEX_R;
const P1_FOREARM_L = 0.092 * HEX_R;

// ── geometrie-singletony (rejestr; wspolne dla wszystkich tokenow) ─────────
const p1Geos: Record<string, THREE.BufferGeometry> = {};
function getG(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = p1Geos[key];
  if (!g) { g = make(); p1Geos[key] = g; }
  return g;
}
const gBox = (k: string, w: number, h: number, d: number) =>
  getG(k, () => new THREE.BoxGeometry(w * HEX_R, h * HEX_R, d * HEX_R));

// rdzen ciala
const gTorso   = () => gBox('torso', 0.180, 0.205, 0.100);
const gNeck    = () => gBox('neck', 0.042, 0.045, 0.042);
const gHead    = () => gBox('head', 0.128, 0.128, 0.128);
const gThigh   = () => gBox('thigh', 0.056, 0.104, 0.060);
const gShin    = () => gBox('shin', 0.038, 0.096, 0.042);
const gFoot    = () => gBox('foot', 0.044, 0.026, 0.078);
const gUpArm   = () => gBox('uparm', 0.054, 0.100, 0.054);
const gForearm = () => gBox('forearm', 0.040, 0.092, 0.040);
const gFist    = () => gBox('fist', 0.046, 0.046, 0.048);
const gSkirt   = () => gBox('skirt', 0.196, 0.070, 0.118);
const gBelt    = () => gBox('belt', 0.190, 0.034, 0.112);
const gSash    = () => gBox('sash', 0.186, 0.032, 0.106);

// ---------------------------------------------------------------------------
// Kierunek segmentu: theta od pionu W DOL, +theta = ku przodowi (+Z).
// ---------------------------------------------------------------------------
function p1Dir(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}

/** Segment od punktu P wzdluz theta o dlugosci len; zwraca punkt koncowy. */
function p1Seg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = p1Dir(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

/** Mesh (geometria o osi Y) rozpiety miedzy dowolnymi punktami A->B. */
function p1Span(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  A: THREE.Vector3, B: THREE.Vector3,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mtl);
  const dir = B.clone().sub(A);
  const len = dir.length();
  dir.normalize();
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  mesh.scale.y = len / (((geo as any).parameters?.height) ?? 1);
  mesh.position.copy(A.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return mesh;
}

/** Noga: udo (thU) + golen (thL) + stopa plasko na y=0. */
function p1BuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  mFoot: THREE.MeshStandardMaterial, hipY: number = P1_HIP_Y,
): void {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = p1Seg(group, gThigh(), mThigh, P, thU, P1_THIGH_L);
  P.z -= 0.004 * HEX_R; P.y += 0.008 * HEX_R;
  P = p1Seg(group, gShin(), mShin, P, thL, P1_SHIN_L);
  const foot = new THREE.Mesh(gFoot(), mFoot);
  foot.position.set(sx, 0.013 * HEX_R, P.z + 0.016 * HEX_R);
  group.add(foot);
}

/** Ramie: ramie (thU) + przedramie (thF) + opcjonalna piesc. */
function p1BuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  let P = new THREE.Vector3(sx, P1_SHLD_Y, 0);
  P = p1Seg(group, gUpArm(), mUp, P, thU, P1_UPARM_L);
  P.y += 0.010 * HEX_R;
  const wrist = p1Seg(group, gForearm(), mFore, P, thF, P1_FOREARM_L);
  if (mFist !== null) {
    const fist = new THREE.Mesh(gFist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(p1Dir(thF), 0.014 * HEX_R));
    group.add(fist);
  }
  return { wrist, axis: p1Dir(thF) };
}

/** Wspolny korpus: tors + szyja + glowa (skora). */
function p1BuildCore(
  group: THREE.Group, mat: MatFactory, mTorso: THREE.MeshStandardMaterial,
  skin: number = P1_SKIN,
): THREE.MeshStandardMaterial {
  const torso = new THREE.Mesh(gTorso(), mTorso);
  torso.position.set(0, P1_TORSO_CTR, 0);
  group.add(torso);
  const mSkin = mat(skin, 0.05, 0.80);
  const neck = new THREE.Mesh(gNeck(), mSkin);
  neck.position.set(0, P1_TORSO_TOP + P1_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(gHead(), mSkin);
  head.position.set(0, P1_HEAD_CTR, 0);
  group.add(head);
  return mSkin;
}

/** Szarfa koloru gracza na piersi (odpowiednik sash buildBaseAvatar). */
function p1OwnerSash(group: THREE.Group, mOwner: THREE.MeshStandardMaterial): void {
  const s = new THREE.Mesh(gSash(), mOwner);
  s.position.set(0, P1_TORSO_CTR - 0.012 * HEX_R, 0);
  group.add(s);
}

/** Spodnica (skory/tunika) + pas. */
function p1SkirtBelt(
  group: THREE.Group, mSkirt: THREE.MeshStandardMaterial,
  mBelt: THREE.MeshStandardMaterial | null,
): void {
  const skirt = new THREE.Mesh(gSkirt(), mSkirt);
  skirt.position.set(0, P1_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  if (mBelt) {
    const belt = new THREE.Mesh(gBelt(), mBelt);
    belt.position.set(0, 0.252 * HEX_R, 0);
    group.add(belt);
  }
}

// ── nakrycia glowy ──────────────────────────────────────────────────────────
/** KAMIEN: futrzana/skorzana czapa (8-kat) nasadzona na glowe. */
function p1FurCap(group: THREE.Group, mFur: THREE.MeshStandardMaterial): void {
  const cap = new THREE.Mesh(
    getG('furcap', () => new THREE.CylinderGeometry(0.058 * HEX_R, 0.088 * HEX_R, 0.080 * HEX_R, 8, 1)),
    mFur);
  cap.position.set(0, P1_HEAD_CTR + 0.052 * HEX_R, 0);
  group.add(cap);
}
/** BRAZ: prosty stozkowy helm z brazu + guzek. */
function p1BronzeCone(group: THREE.Group, mBronze: THREE.MeshStandardMaterial,
                      mKnob: THREE.MeshStandardMaterial | null): void {
  const rim = new THREE.Mesh(
    getG('bhelmrim', () => new THREE.CylinderGeometry(0.086 * HEX_R, 0.092 * HEX_R, 0.036 * HEX_R, 8, 1)),
    mBronze);
  rim.position.set(0, P1_HEAD_CTR + 0.036 * HEX_R, 0);
  group.add(rim);
  const cone = new THREE.Mesh(
    getG('bhelmcone', () => new THREE.ConeGeometry(0.086 * HEX_R, 0.108 * HEX_R, 8, 1)),
    mBronze);
  cone.position.set(0, P1_HEAD_CTR + 0.108 * HEX_R, 0);
  group.add(cone);
  if (mKnob) {
    const knob = new THREE.Mesh(gBox('bhelmknob', 0.026, 0.030, 0.026), mKnob);
    knob.position.set(0, P1_HEAD_CTR + 0.170 * HEX_R, 0);
    group.add(knob);
  }
}

// ---------------------------------------------------------------------------
// 1. WOJOWNIK (Kamien, zamiennik 'domyslny') — POZA: zamach maczugo-mieczem
// Futrzana czapa z KLEM (kosc) + opaska koloru gracza, futrzana kamizela,
// skorzana spodnica, krzemienny MACZUGO-MIECZ w PRAWEJ (-X) nad glowa
// (mid-swing), MALA okragla TARCZA skorzana (pole = kolor gracza) na LEWYM
// (+X) przedramieniu, gleboki wypad.
// ---------------------------------------------------------------------------
export function buildWojownikKamien(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mFur   = mat(P1_FUR_DK,   0.04, 0.92);
  const mFurL  = mat(P1_FUR_LT,   0.04, 0.90);
  const mLeath = mat(P1_LEATHER,  0.05, 0.85);
  const mWood  = mat(P1_WOOD,     0.05, 0.85);
  const mWoodD = mat(P1_WOOD_DK,  0.05, 0.86);
  const mFlint = mat(P1_FLINT,    0.18, 0.55);
  const mBone  = mat(P1_BONE,     0.06, 0.75);
  const mOwner = mat(ownerColor_, 0.10, 0.70);

  const HIP_Y = P1_HIP_Y - 0.012 * HEX_R;

  // korpus: futrzana kamizela; nogi w skorzanych owijkach
  const mSkin = p1BuildCore(group, mat, mFur);
  p1SkirtBelt(group, mLeath, mFurL);
  p1OwnerSash(group, mOwner);
  p1BuildLeg(group,  P1_HIP_X,  0.58,  0.34, mSkin, mLeath, mLeath, HIP_Y);
  p1BuildLeg(group, -P1_HIP_X, -0.52, -0.20, mSkin, mLeath, mLeath, HIP_Y);

  // futrzana czapa + opaska gracza + KIEL (kosc) nad czolem
  p1FurCap(group, mFur);
  const band = new THREE.Mesh(gBox('wojband', 0.150, 0.022, 0.150), mOwner);
  band.position.set(0, P1_HEAD_CTR + 0.026 * HEX_R, 0);
  group.add(band);
  const fang = new THREE.Mesh(
    getG('wojfang', () => new THREE.ConeGeometry(0.018 * HEX_R, 0.064 * HEX_R, 4, 1)), mBone);
  fang.rotation.x = 0.85;
  fang.rotation.y = Math.PI / 4;
  fang.position.set(0, P1_HEAD_CTR + 0.058 * HEX_R, 0.088 * HEX_R);
  group.add(fang);

  // PRAWA (-X): zamach maczugo-mieczem nad glowa (bron NA OSI przedramienia)
  const armR = p1BuildArm(group, -P1_SHLD_X, -2.30, 2.75, mSkin, mSkin, mSkin);
  const ax = armR.axis;
  const shaft = new THREE.Mesh(gBox('wojshaft', 0.021, 0.200, 0.021), mWoodD);
  shaft.rotation.x = Math.PI - 2.75;
  shaft.position.copy(armR.wrist.clone().addScaledVector(ax, 0.112 * HEX_R));
  group.add(shaft);
  const flint = new THREE.Mesh(gBox('wojflint', 0.036, 0.100, 0.018), mFlint);
  flint.rotation.x = Math.PI - 2.75;
  flint.position.copy(armR.wrist.clone().addScaledVector(ax, 0.258 * HEX_R));
  group.add(flint);
  const ftip = new THREE.Mesh(
    getG('wojftip', () => new THREE.ConeGeometry(0.020 * HEX_R, 0.048 * HEX_R, 4, 1)), mFlint);
  ftip.rotation.x = Math.PI - 2.75;
  ftip.rotation.y = Math.PI / 4;
  ftip.position.copy(armR.wrist.clone().addScaledVector(ax, 0.330 * HEX_R));
  group.add(ftip);

  // LEWA (+X): mala tarcza skorzana przed korpusem (pole = kolor gracza)
  const armL = p1BuildArm(group, P1_SHLD_X, 0.50, 1.10, mSkin, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.020 * HEX_R,
    armL.wrist.y + 0.030 * HEX_R,
    armL.wrist.z + 0.040 * HEX_R,
  );
  sh.rotation.y = -0.20;
  const face = new THREE.Mesh(
    getG('wojshface', () => new THREE.CylinderGeometry(0.086 * HEX_R, 0.078 * HEX_R, 0.020 * HEX_R, 10, 1)), mOwner);
  face.rotation.x = Math.PI / 2;
  sh.add(face);
  const rim = new THREE.Mesh(
    getG('wojshrim', () => new THREE.CylinderGeometry(0.094 * HEX_R, 0.094 * HEX_R, 0.016 * HEX_R, 10, 1, true)), mLeath);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0, -0.003 * HEX_R);
  sh.add(rim);
  const boss = new THREE.Mesh(gBox('wojboss', 0.034, 0.034, 0.020), mWoodD);
  boss.position.set(0, 0, 0.013 * HEX_R);
  sh.add(boss);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// 2. OSZCZEPNIK (Kamien) — POZA: nadreczny zamach oszczepem (rzut)
// Skorzana czapa z PIOREM, torso naga ciemna skora + skorzany pas ukosny,
// futrzana spodniczka; oszczep z krzemiennym grotem w PRAWEJ (-X) nad
// barkiem (grot lekko w gore), PEK 2 zapasowych oszczepow w LEWEJ (+X).
// ---------------------------------------------------------------------------
export function buildOszczepnik(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mFur   = mat(P1_FUR_LT,   0.04, 0.90);
  const mLeath = mat(P1_LEATHER,  0.05, 0.85);
  const mWood  = mat(P1_WOOD,     0.05, 0.85);
  const mFlint = mat(P1_FLINT,    0.18, 0.55);
  const mBone  = mat(P1_BONE,     0.06, 0.75);
  const mOwner = mat(ownerColor_, 0.10, 0.70);

  const HIP_Y = P1_HIP_Y - 0.012 * HEX_R;

  // korpus: naga ciemna skora + futrzana spodniczka + pas
  const mSkin = p1BuildCore(group, mat, mat(P1_SKIN_DARK, 0.05, 0.80), P1_SKIN_DARK);
  p1SkirtBelt(group, mFur, mLeath);
  p1OwnerSash(group, mOwner);
  // skorzany pas ukosny przez piers (baldric)
  const strap = new THREE.Mesh(gBox('oszstrap', 0.026, 0.230, 0.014), mLeath);
  strap.rotation.z = 0.60;
  strap.position.set(0, P1_TORSO_CTR + 0.030 * HEX_R, P1_TORSO_D * 0.5 + 0.006 * HEX_R);
  group.add(strap);

  p1BuildLeg(group,  P1_HIP_X,  0.60,  0.36, mSkin, mSkin, mLeath, HIP_Y);
  p1BuildLeg(group, -P1_HIP_X, -0.54, -0.22, mSkin, mSkin, mLeath, HIP_Y);

  // skorzana czapa + PIORO z tylu
  p1FurCap(group, mLeath);
  const feather = new THREE.Mesh(gBox('oszfeather', 0.022, 0.098, 0.012), mBone);
  feather.rotation.x = -0.42;
  feather.position.set(0.030 * HEX_R, P1_HEAD_TOP + 0.055 * HEX_R, -0.045 * HEX_R);
  group.add(feather);

  // PRAWA (-X): nadreczny zamach — oszczep NA OSI dloni, grot w przod-GORE
  const armR = p1BuildArm(group, -P1_SHLD_X, -2.55, 1.32, mSkin, mSkin, mSkin);
  const javTh = Math.PI * 0.5 - 0.14;               // 0.14 w gore
  const javAxis = new THREE.Vector3(0, Math.sin(0.14), Math.cos(0.14));
  const grip = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  const jShaft = new THREE.Mesh(gBox('oszjav', 0.015, 0.440, 0.015), mWood);
  jShaft.rotation.x = Math.PI - javTh;
  jShaft.position.copy(grip.clone().addScaledVector(javAxis, 0.060 * HEX_R));
  group.add(jShaft);
  const jTip = new THREE.Mesh(
    getG('oszjtip', () => new THREE.ConeGeometry(0.017 * HEX_R, 0.055 * HEX_R, 4, 1)), mFlint);
  jTip.rotation.x = Math.PI - javTh;
  jTip.rotation.y = Math.PI / 4;
  jTip.position.copy(grip.clone().addScaledVector(javAxis, (0.060 + 0.220 + 0.024) * HEX_R));
  group.add(jTip);

  // LEWA (+X): pek 2 zapasowych oszczepow pionowo w piesci
  const armL = p1BuildArm(group, P1_SHLD_X, 0.35, 0.55, mSkin, mSkin, mSkin);
  for (const dz of [-0.014, 0.014]) {
    const sp = new THREE.Mesh(gBox('oszspare', 0.013, 0.400, 0.013), mWood);
    sp.position.set(armL.wrist.x + 0.004 * HEX_R, armL.wrist.y + 0.085 * HEX_R, armL.wrist.z + dz * HEX_R);
    group.add(sp);
    const st = new THREE.Mesh(
      getG('oszjtip', () => new THREE.ConeGeometry(0.017 * HEX_R, 0.055 * HEX_R, 4, 1)), mFlint);
    st.rotation.y = Math.PI / 4;
    st.position.set(armL.wrist.x + 0.004 * HEX_R, armL.wrist.y + 0.085 * HEX_R + 0.227 * HEX_R, armL.wrist.z + dz * HEX_R);
    group.add(st);
  }

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// 3. LUCZNIK (Kamien) — POZA: pelny naciag luku ze strzala
// Skorzana czapa z piorem BOCZNYM, jasna skorzana kamizela, LEWA (+X) reka
// wyciagnieta w przod trzyma LUK (6 segmentow), PRAWA (-X) dlon przy policzku
// (naciag), cieciwa zgieta w V do dloni, STRZALA z krzemiennym grotem na
// cieciwie; kolczan koloru gracza ze strzalami na plecach.
// ---------------------------------------------------------------------------
export function buildLucznik(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mLeath = mat(P1_LEATHER,  0.05, 0.85);
  const mVest  = mat(P1_LEATH_LT, 0.05, 0.86);
  const mWood  = mat(P1_WOOD,     0.05, 0.82);
  const mFlint = mat(P1_FLINT,    0.18, 0.55);
  const mBone  = mat(P1_BONE,     0.06, 0.75);
  const mStr   = mat(P1_STRING,   0.02, 0.95);
  const mOwner = mat(ownerColor_, 0.10, 0.70);

  const HIP_Y = P1_HIP_Y - 0.008 * HEX_R;

  // korpus: skorzana kamizela; przedramiona gole
  const mSkin = p1BuildCore(group, mat, mVest);
  p1SkirtBelt(group, mLeath, mLeath);
  p1OwnerSash(group, mOwner);
  p1BuildLeg(group,  P1_HIP_X,  0.42,  0.22, mSkin, mSkin, mLeath, HIP_Y);
  p1BuildLeg(group, -P1_HIP_X, -0.40, -0.14, mSkin, mSkin, mLeath, HIP_Y);

  // czapa skorzana + piorko boczne
  p1FurCap(group, mLeath);
  const feather = new THREE.Mesh(gBox('lucfeather', 0.020, 0.092, 0.012), mBone);
  feather.rotation.z = -0.50;
  feather.position.set(0.062 * HEX_R, P1_HEAD_TOP + 0.048 * HEX_R, -0.010 * HEX_R);
  group.add(feather);

  // LEWA (+X) wyciagnieta w przod — luk pionowy w piesci
  const armL = p1BuildArm(group, P1_SHLD_X, 1.45, 1.50, mVest, mSkin, mSkin);
  const gripP = armL.wrist.clone().addScaledVector(armL.axis, 0.020 * HEX_R);
  const BOW_R = 0.140 * HEX_R;
  const bowPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 6; i++) {
    const phi = (-70 + (140 / 6) * i) * Math.PI / 180;
    bowPts.push(new THREE.Vector3(
      gripP.x,
      gripP.y + BOW_R * Math.sin(phi),
      gripP.z - BOW_R + BOW_R * Math.cos(phi),
    ));
  }
  for (let i = 0; i < 6; i++) {
    p1Span(group, getG('lucbowseg', () => new THREE.BoxGeometry(0.016 * HEX_R, 1, 0.016 * HEX_R)),
      mWood, bowPts[i]!, bowPts[i + 1]!);
  }

  // PRAWA (-X): dlon przy policzku (naciag)
  const armR = p1BuildArm(group, -P1_SHLD_X, 1.30, -2.05, mVest, mSkin, mSkin);
  const nock = new THREE.Vector3(armR.wrist.x + 0.030 * HEX_R, armR.wrist.y, armR.wrist.z + 0.024 * HEX_R);

  // cieciwa zgieta w V: od koncow luku do nocka
  const gStrSeg = getG('lucstr', () => new THREE.BoxGeometry(0.007 * HEX_R, 1, 0.007 * HEX_R));
  p1Span(group, gStrSeg, mStr, bowPts[0]!, nock);
  p1Span(group, gStrSeg, mStr, bowPts[6]!, nock);

  // strzala: od nocka przez luk w przod (+Z), krzemienny grot + lotki
  const arrDir = gripP.clone().add(new THREE.Vector3(0, 0.012 * HEX_R, 0.02 * HEX_R)).sub(nock).normalize();
  const arrEnd = nock.clone().addScaledVector(arrDir, 0.330 * HEX_R);
  p1Span(group, getG('lucarrow', () => new THREE.BoxGeometry(0.011 * HEX_R, 1, 0.011 * HEX_R)),
    mWood, nock, arrEnd);
  const aTip = new THREE.Mesh(
    getG('lucatip', () => new THREE.ConeGeometry(0.014 * HEX_R, 0.042 * HEX_R, 4, 1)), mFlint);
  aTip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arrDir);
  aTip.position.copy(arrEnd.clone().addScaledVector(arrDir, 0.018 * HEX_R));
  group.add(aTip);
  for (const off of [0.014, 0.036]) {
    const fl = new THREE.Mesh(gBox('lucfletch', 0.006, 0.026, 0.024), mBone);
    fl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), arrDir);
    fl.position.copy(nock.clone().addScaledVector(arrDir, off * HEX_R));
    group.add(fl);
  }

  // kolczan KOLORU GRACZA na plecach + 2 strzaly z lotkami
  const quiver = new THREE.Mesh(gBox('lucquiver', 0.052, 0.170, 0.045), mOwner);
  quiver.rotation.x = -0.30;
  quiver.position.set(-0.048 * HEX_R, P1_TORSO_CTR + 0.040 * HEX_R, -(P1_TORSO_D * 0.5 + 0.030 * HEX_R));
  group.add(quiver);
  for (const dx of [-0.014, 0.012]) {
    const sh2 = new THREE.Mesh(gBox('lucqarr', 0.009, 0.075, 0.009), mWood);
    sh2.rotation.x = -0.30;
    sh2.position.set(-0.048 * HEX_R + dx * HEX_R, P1_TORSO_CTR + 0.150 * HEX_R, -(P1_TORSO_D * 0.5 + 0.064 * HEX_R));
    group.add(sh2);
    const fl2 = new THREE.Mesh(gBox('lucfletch', 0.006, 0.026, 0.024), mBone);
    fl2.rotation.x = -0.30;
    fl2.position.set(-0.048 * HEX_R + dx * HEX_R, P1_TORSO_CTR + 0.185 * HEX_R, -(P1_TORSO_D * 0.5 + 0.075 * HEX_R));
    group.add(fl2);
  }

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// 4. ZWIADOWCA (cywil, bez broni) — POZA: dynamiczny krok, dlon nad oczami
// Futrzana czapa z OGONEM (traperska), tunika oliwkowa, sakwa na pasku
// ukosnym z klapka koloru gracza; LEWA (+X) dlon-daszek nad oczami,
// PRAWA (-X) trzyma laske podrozna; gleboki wykrok marszowy.
// ---------------------------------------------------------------------------
export function buildZwiadowca(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mFur   = mat(P1_FUR_DK,   0.04, 0.92);
  const mFurL  = mat(P1_FUR_LT,   0.04, 0.90);
  const mTunic = mat(P1_OLIVE,    0.05, 0.86);
  const mLeath = mat(P1_LEATHER,  0.05, 0.85);
  const mWood  = mat(P1_WOOD,     0.05, 0.82);
  const mOwner = mat(ownerColor_, 0.10, 0.70);

  const HIP_Y = P1_HIP_Y - 0.014 * HEX_R;

  // korpus: tunika oliwkowa, skorzana spodnica
  const mSkin = p1BuildCore(group, mat, mTunic, P1_SKIN_DARK);
  p1SkirtBelt(group, mLeath, mFurL);
  p1OwnerSash(group, mOwner);
  p1BuildLeg(group,  P1_HIP_X,  0.72,  0.40, mTunic, mSkin, mLeath, HIP_Y);
  p1BuildLeg(group, -P1_HIP_X, -0.62, -0.26, mTunic, mSkin, mLeath, HIP_Y);

  // czapa futrzana z ogonem (traperska)
  p1FurCap(group, mFur);
  const tail = new THREE.Mesh(gBox('zwtail', 0.032, 0.110, 0.026), mFurL);
  tail.rotation.x = -0.55;
  tail.position.set(0, P1_HEAD_CTR + 0.010 * HEX_R, -(P1_HEAD_S * 0.5 + 0.028 * HEX_R));
  group.add(tail);

  // LEWA (+X): dlon-daszek nad oczami
  const armL = p1BuildArm(group, P1_SHLD_X, 1.90, 2.99, mTunic, mSkin, null);
  const palm = new THREE.Mesh(gBox('zwpalm', 0.052, 0.016, 0.066), mSkin);
  palm.position.copy(armL.wrist.clone().add(new THREE.Vector3(-0.030 * HEX_R, 0.014 * HEX_R, 0.010 * HEX_R)));
  group.add(palm);

  // PRAWA (-X): laska podrozna pionowo do ziemi
  const armR = p1BuildArm(group, -P1_SHLD_X, 0.42, 0.70, mTunic, mSkin, mSkin);
  const staffX = armR.wrist.x - 0.004 * HEX_R;
  const staffZ = armR.wrist.z + 0.016 * HEX_R;
  const staff = new THREE.Mesh(gBox('zwstaff', 0.016, 0.430, 0.016), mWood);
  staff.position.set(staffX, 0.215 * HEX_R, staffZ);
  group.add(staff);
  const knob = new THREE.Mesh(gBox('zwknob', 0.026, 0.024, 0.026), mWood);
  knob.position.set(staffX, 0.442 * HEX_R, staffZ);
  group.add(knob);

  // sakwa na lewym biodrze + pasek ukosny + klapka koloru gracza
  const bag = new THREE.Mesh(gBox('zwbag', 0.062, 0.072, 0.032), mLeath);
  bag.position.set(0.100 * HEX_R, 0.250 * HEX_R, 0.018 * HEX_R);
  group.add(bag);
  const flap = new THREE.Mesh(gBox('zwflap', 0.062, 0.024, 0.036), mOwner);
  flap.position.set(0.100 * HEX_R, 0.282 * HEX_R, 0.018 * HEX_R);
  group.add(flap);
  const strap = new THREE.Mesh(gBox('zwstrap', 0.024, 0.250, 0.012), mLeath);
  strap.rotation.z = -0.62;
  strap.position.set(0, P1_TORSO_CTR + 0.030 * HEX_R, P1_TORSO_D * 0.5 + 0.006 * HEX_R);
  group.add(strap);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// KLINGA LISCIASTA (miecz brazowy) — plaska wstega o obrysie liscia,
// dwie warstwy (przod+tyl) zeby dzialala z jednostronnym materialem.
// Os Y, baza (rekojesc) w y=0, czubek w y=len.
// ---------------------------------------------------------------------------
function makeLeafBladeGeo(len: number, wMax: number): THREE.BufferGeometry {
  const prof: [number, number][] = (                    // [y, half-width]
    [[0.00, 0.28], [0.16, 0.34], [0.42, 0.50], [0.62, 0.42], [0.84, 0.24], [1.00, 0.0]] as [number, number][]
  ).map(([t, w]) => [t * len, w * wMax]);
  const pos: number[] = [];
  const quad = (x1: number, y1: number, x2: number, y2: number, z: number, flip: boolean) => {
    if (!flip) pos.push(-x1, y1, z, x1, y1, z, x2, y2, z, -x1, y1, z, x2, y2, z, -x2, y2, z);
    else       pos.push(-x1, y1, z, x2, y2, z, x1, y1, z, -x1, y1, z, -x2, y2, z, x2, y2, z);
  };
  for (let i = 0; i < prof.length - 1; i++) {
    const [y1, w1] = prof[i]!, [y2, w2] = prof[i + 1]!;
    quad(w1, y1, w2, y2, 0.006, false);          // przod
    quad(w1, y1, w2, y2, -0.006, true);          // tyl
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------------------
// 5. PROCARZ (Braz) — POZA: proca ZAKRECONA nad glowa (mid-whirl)
// Prosta czapka stozkowa z brazu, tunika ochra, PRAWA (-X) wysoko nad glowa
// — sznur procy lukiem nad glowa zakonczony woreczkiem z kamieniem, LEWA
// (+X) wyciagnieta w przod (celowanie); woreczek kamieni na biodrze.
// ---------------------------------------------------------------------------
export function buildProcarz(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mTunic = mat(P1_OCHRE,     0.05, 0.85);
  const mLeath = mat(P1_LEATHER,   0.05, 0.85);
  const mBronz = mat(P1_BRONZE,    0.42, 0.42);
  const mCord  = mat(P1_STRING,    0.03, 0.92);
  const mStone = mat(P1_STONE,     0.05, 0.95);
  const mOwner = mat(ownerColor_,  0.10, 0.70);

  const HIP_Y = P1_HIP_Y - 0.010 * HEX_R;

  // korpus: tunika ochra + skorzany pas
  const mSkin = p1BuildCore(group, mat, mTunic);
  p1SkirtBelt(group, mTunic, mLeath);
  p1OwnerSash(group, mOwner);
  p1BuildLeg(group,  P1_HIP_X,  0.55,  0.30, mTunic, mSkin, mLeath, HIP_Y);
  p1BuildLeg(group, -P1_HIP_X, -0.48, -0.16, mTunic, mSkin, mLeath, HIP_Y);

  // prosta czapka stozkowa z brazu
  p1BronzeCone(group, mBronz, null);

  // PRAWA (-X) wysoko: sznur procy lukiem NAD GLOWA + woreczek z kamieniem
  const armR = p1BuildArm(group, -P1_SHLD_X, -2.90, 2.50, mTunic, mSkin, mSkin);
  const P0 = armR.wrist.clone().addScaledVector(armR.axis, 0.016 * HEX_R);
  const P1p = new THREE.Vector3(-0.005 * HEX_R, P0.y + 0.062 * HEX_R, P0.z - 0.158 * HEX_R);
  const P2p = new THREE.Vector3(0.128 * HEX_R, P0.y + 0.028 * HEX_R, P0.z - 0.005 * HEX_R);
  const gCord = getG('proccord', () => new THREE.BoxGeometry(0.011 * HEX_R, 1, 0.011 * HEX_R));
  p1Span(group, gCord, mCord, P0, P1p);
  p1Span(group, gCord, mCord, P1p, P2p);
  const pouch = new THREE.Mesh(gBox('procpouch', 0.044, 0.026, 0.060), mLeath);
  pouch.position.copy(P2p);
  pouch.rotation.y = 0.5;
  group.add(pouch);
  const pellet = new THREE.Mesh(gBox('procstone', 0.024, 0.020, 0.024), mStone);
  pellet.scale.setScalar(1.15);
  pellet.position.copy(P2p.clone().add(new THREE.Vector3(0, 0.020 * HEX_R, 0)));
  group.add(pellet);

  // LEWA (+X): wyciagnieta w przod-dol (celowanie/balans)
  p1BuildArm(group, P1_SHLD_X, 0.85, 1.15, mTunic, mSkin, mSkin);

  // woreczek kamieni na prawym biodrze + 2 kamyki
  const bag = new THREE.Mesh(gBox('procbag', 0.058, 0.062, 0.034), mLeath);
  bag.position.set(-0.100 * HEX_R, 0.248 * HEX_R, 0.020 * HEX_R);
  group.add(bag);
  for (const dx of [-0.012, 0.012]) {
    const st = new THREE.Mesh(gBox('procstone', 0.024, 0.020, 0.024), mStone);
    st.scale.setScalar(0.8);
    st.position.set(-0.100 * HEX_R + dx * HEX_R, 0.284 * HEX_R, 0.020 * HEX_R);
    group.add(st);
  }

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// 6. WLOCZNIK (Braz) — POZA: nadreczne pchniecie wlocznia
// Stozkowy helm z brazu z nosalem i guzkiem, tunika morska (teal), brazowy
// pektoral; wlocznia z LISCIASTYM brazowym grotem w PRAWEJ (-X) nad barkiem
// (grot w przod lekko w dol), OKRAGLA tarcza z umbo (pole = kolor gracza,
// rant braz) na LEWYM (+X) przedramieniu; nagolenniki brazowe.
// ---------------------------------------------------------------------------
export function buildWlocznik(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mTunic  = mat(P1_TEAL,      0.05, 0.85);
  const mLeath  = mat(P1_LEATHER,   0.05, 0.85);
  const mBronz  = mat(P1_BRONZE,    0.42, 0.42);
  const mBronzL = mat(P1_BRONZE_LT, 0.55, 0.35);
  const mWood   = mat(P1_WOOD,      0.05, 0.85);
  const mOwner  = mat(ownerColor_,  0.14, 0.64);

  const HIP_Y = P1_HIP_Y - 0.010 * HEX_R;

  // korpus: tunika teal + skorzana spodnica + brazowy pektoral
  const mSkin = p1BuildCore(group, mat, mTunic);
  p1SkirtBelt(group, mLeath, mLeath);
  p1OwnerSash(group, mOwner);
  const pect = new THREE.Mesh(gBox('wlpect', 0.092, 0.088, 0.016), mBronz);
  pect.position.set(0, P1_TORSO_CTR + 0.052 * HEX_R, P1_TORSO_D * 0.5 + 0.008 * HEX_R);
  group.add(pect);
  // nogi: golenie = brazowe nagolenniki
  p1BuildLeg(group,  P1_HIP_X,  0.55,  0.30, mTunic, mBronzL, mLeath, HIP_Y);
  p1BuildLeg(group, -P1_HIP_X, -0.50, -0.16, mTunic, mBronzL, mLeath, HIP_Y);

  // stozkowy helm z brazu + guzek + nosal
  p1BronzeCone(group, mBronz, mBronzL);
  const nose = new THREE.Mesh(gBox('wlnose', 0.018, 0.050, 0.014), mBronz);
  nose.position.set(0, P1_HEAD_CTR + 0.004 * HEX_R, P1_HEAD_S * 0.5 + 0.006 * HEX_R);
  group.add(nose);

  // PRAWA (-X): nadreczne pchniecie — wlocznia NA OSI dloni, grot w przod-dol
  const armR = p1BuildArm(group, -P1_SHLD_X, -2.55, 1.32, mTunic, mSkin, mSkin);
  const spearTh = Math.PI * 0.5 + 0.20;
  const spearAxis = new THREE.Vector3(0, -Math.sin(0.20), Math.cos(0.20));
  const grip = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  const shaft = new THREE.Mesh(gBox('wlshaft', 0.020, 0.560, 0.020), mWood);
  shaft.rotation.x = Math.PI - spearTh;
  shaft.position.copy(grip.clone().addScaledVector(spearAxis, 0.125 * HEX_R));
  group.add(shaft);
  const tip = new THREE.Mesh(
    getG('wltip', () => new THREE.ConeGeometry(0.024 * HEX_R, 0.078 * HEX_R, 4, 1)), mBronzL);
  tip.rotation.x = Math.PI - spearTh;
  tip.rotation.y = Math.PI / 4;
  tip.scale.z = 0.45;                                // splaszczony = LISCIASTY grot
  tip.position.copy(grip.clone().addScaledVector(spearAxis, (0.125 + 0.280 + 0.034) * HEX_R));
  group.add(tip);
  const butt = new THREE.Mesh(gBox('wlbutt', 0.022, 0.045, 0.022), mBronz);
  butt.rotation.x = Math.PI - spearTh;
  butt.position.copy(grip.clone().addScaledVector(spearAxis, (0.125 - 0.280 - 0.018) * HEX_R));
  group.add(butt);

  // LEWA (+X): okragla tarcza z umbo przed korpusem (pole = kolor gracza)
  const armL = p1BuildArm(group, P1_SHLD_X, 0.52, 1.05, mTunic, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.040 * HEX_R,
    armL.wrist.y + 0.055 * HEX_R,
    armL.wrist.z + 0.048 * HEX_R,
  );
  sh.rotation.y = -0.20;
  const face = new THREE.Mesh(
    getG('wlshface', () => new THREE.CylinderGeometry(0.104 * HEX_R, 0.088 * HEX_R, 0.026 * HEX_R, 12, 1)), mOwner);
  face.rotation.x = Math.PI / 2;
  sh.add(face);
  const rim = new THREE.Mesh(
    getG('wlshrim', () => new THREE.CylinderGeometry(0.114 * HEX_R, 0.114 * HEX_R, 0.018 * HEX_R, 12, 1, true)), mBronzL);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0, -0.004 * HEX_R);
  sh.add(rim);
  const umbo = new THREE.Mesh(gBox('wlumbo', 0.040, 0.040, 0.024), mBronz);
  umbo.position.set(0, 0, 0.018 * HEX_R);
  sh.add(umbo);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// 7. MIECZNIK „Wojownik z mieczem i tarcza" (Braz) — POZA: zamach do ciecia
// Stozkowy helm z brazu z POPRZECZNYM grzebieniem, tunika rdzawa; brazowy
// MIECZ LISCIASTY w PRAWEJ (-X) uniesiony nad bark (mid-swing), OKRAGLA
// tarcza z krzyzem listew (pole = kolor gracza) na LEWYM (+X) przedramieniu.
// ---------------------------------------------------------------------------
export function buildMiecznik(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mTunic  = mat(P1_RUST,      0.05, 0.82);
  const mLeath  = mat(P1_LEATHER,   0.05, 0.85);
  const mBronz  = mat(P1_BRONZE,    0.42, 0.42);
  const mBronzL = mat(P1_BRONZE_LT, 0.55, 0.35);
  const mWood   = mat(P1_WOOD_DK,   0.05, 0.85);
  const mCrest  = mat(0xa01f2e,     0.08, 0.74);
  const mOwner  = mat(ownerColor_,  0.14, 0.64);

  const HIP_Y = P1_HIP_Y - 0.012 * HEX_R;

  // korpus: tunika rdzawa + pas + skorzana spodnica
  const mSkin = p1BuildCore(group, mat, mTunic);
  p1SkirtBelt(group, mLeath, mLeath);
  p1OwnerSash(group, mOwner);
  p1BuildLeg(group,  P1_HIP_X,  0.58,  0.34, mTunic, mSkin, mLeath, HIP_Y);
  p1BuildLeg(group, -P1_HIP_X, -0.52, -0.20, mTunic, mSkin, mLeath, HIP_Y);

  // helm stozkowy z brazu + POPRZECZNY grzebien (odroznia od wlocznika)
  p1BronzeCone(group, mBronz, null);
  const crestB = new THREE.Mesh(gBox('miecrestb', 0.100, 0.020, 0.022), mBronzL);
  crestB.position.set(0, P1_HEAD_CTR + 0.168 * HEX_R, 0);
  group.add(crestB);
  const crestH = new THREE.Mesh(gBox('miecresth', 0.124, 0.048, 0.020), mCrest);
  crestH.position.set(0, P1_HEAD_CTR + 0.198 * HEX_R, 0);
  group.add(crestH);

  // PRAWA (-X): zamach — miecz liściasty NA OSI przedramienia w gore-przod
  const armR = p1BuildArm(group, -P1_SHLD_X, -2.05, 2.62, mTunic, mSkin, mSkin);
  const ax = armR.axis;
  const hilt = new THREE.Mesh(gBox('miehilt', 0.020, 0.052, 0.020), mWood);
  hilt.rotation.x = Math.PI - 2.62;
  hilt.position.copy(armR.wrist.clone().addScaledVector(ax, 0.012 * HEX_R));
  group.add(hilt);
  const guard = new THREE.Mesh(gBox('mieguard', 0.058, 0.016, 0.024), mBronz);
  guard.rotation.x = Math.PI - 2.62;
  guard.position.copy(armR.wrist.clone().addScaledVector(ax, 0.042 * HEX_R));
  group.add(guard);
  const blade = new THREE.Mesh(
    getG('mieblade', () => makeLeafBladeGeo(0.185 * HEX_R, 0.058 * HEX_R)), mBronzL);
  blade.rotation.x = Math.PI - 2.62;
  blade.position.copy(armR.wrist.clone().addScaledVector(ax, 0.050 * HEX_R));
  group.add(blade);

  // LEWA (+X): okragla tarcza z krzyzem listew przed korpusem
  const armL = p1BuildArm(group, P1_SHLD_X, 0.50, 1.08, mTunic, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.036 * HEX_R,
    armL.wrist.y + 0.050 * HEX_R,
    armL.wrist.z + 0.046 * HEX_R,
  );
  sh.rotation.y = -0.22;
  const face = new THREE.Mesh(
    getG('mieshface', () => new THREE.CylinderGeometry(0.112 * HEX_R, 0.096 * HEX_R, 0.026 * HEX_R, 12, 1)), mOwner);
  face.rotation.x = Math.PI / 2;
  sh.add(face);
  const rim = new THREE.Mesh(
    getG('mieshrim', () => new THREE.CylinderGeometry(0.122 * HEX_R, 0.122 * HEX_R, 0.018 * HEX_R, 12, 1, true)), mBronz);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0, -0.004 * HEX_R);
  sh.add(rim);
  const barV = new THREE.Mesh(gBox('miebarv', 0.020, 0.190, 0.012), mBronzL);
  barV.position.set(0, 0, 0.016 * HEX_R);
  sh.add(barV);
  const barH = new THREE.Mesh(gBox('miebarh', 0.190, 0.020, 0.012), mBronzL);
  barH.position.set(0, 0, 0.016 * HEX_R);
  sh.add(barH);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}
