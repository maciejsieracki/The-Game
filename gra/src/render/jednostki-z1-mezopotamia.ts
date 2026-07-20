/**
 * jednostki-z1-mezopotamia.ts — ZELAZO P1: MEZOPOTAMIA / INDUS (4 jednostki)
 * ---------------------------------------------------------------------------
 * Bespoke modele dla 4 jednostek EPOKI ZELAZA, ktore dzis renderuja sie jako
 * generyk newBuildWojownikKamien (kamienny wojownik!):
 *   buildGwardiaHetycka(ownerColor)       "Gwardia hetycka"        (Hetyci, miecz, elita 40/9)
 *   buildPiechotaNeobabilonska(ownerColor)"Piechota neobabilonska" (Babilonia, miecz)
 *   buildMurTarcz(ownerColor)             "Mur tarcz (Sargonid)"   (Sumer, wlocznia, formacja)
 *   buildGarnizonHarappy(ownerColor)      "Garnizon Harappy"       (Harappa, miecz-tasak)
 *
 * Interfejs i konwencje BEZ ZMIAN (rodzina hastati-falangita.ts / p8a / p57):
 *   - figurka PRZODEM do +Z, stopy na y = 0, wysokosc ~0.55*HEX_R,
 *   - uklad prawoskretny: LEWA reka = +X (TARCZA), PRAWA = -X (BRON),
 *   - group.userData['mats'] i ['perTokenGeos'] jak w units.ts,
 *   - geometrie wspolne = singletony modulu (perTokenGeos puste),
 *   - anatomia lancuchowa z1Seg/z1BuildLeg/z1BuildArm = niSeg/niBuildLeg/
 *     niBuildArm (hastati-falangita.ts), BRON NA OSI DLONI, POZY ATAKU,
 *   - helm na KAZDEJ glowie, kolor gracza = POLE TARCZY + SZARFA.
 *
 * EWOLUCJA KREWNYCH Z BRAZU (wiecej metalu; ZELAZO = ciemniejszy, zimniejszy
 * metal niz braz):
 *   GWARDIA HETYCKA  — ciezsza siostra buildPiechotaHetycka (p8a): lamelkowy
 *     kaftan zelazny na kremowej tunice, ZELAZNY MIECZ PROSTY (ewolucja
 *     sierpowatego) w pchnieciu na wysokosci piersi, tarcza-OSEMKA wzmocniona
 *     zelaznym bosem, helm zelazny z WYSOKIM grzebieniem + nauszniki,
 *     buty z zadartymi noskami (hetycki detal), szeroki ciemny pas.
 *   PIECHOTA NEOBABILONSKA — ewolucja buildWojownikBabilonski (p8a): kaftan
 *     PIKOWANY (ceglasty, pionowe przeszycia kremowe), zigzag muru na dole
 *     (merlony — znak Babilonu), TARCZA WIEZOWA (pole = kolor gracza, zelazne
 *     listwy) ze SKROMNYM zlotym Isztar-akcentem (krzyz 8 promieni mniejszy
 *     niz u Gwardii Ishtar), zelazny miecz prosty w CIOSIE Z GORY (ta sama
 *     poza co sierpowiec przodka), helm: zelazny stozek z NAKARCZNIKIEM,
 *     broda klockowa (2 rzedy).
 *   MUR TARCZ (SARGONID) — ewolucja buildSumerianSpearman (p57): SCIANA TARCZ,
 *     WIELKA prostokatna tarcza formacyjna OKUTA zelazem (listwy poziome +
 *     pionowe okucia krawedzi + nity), wlocznia POZIOMA nad krawedzia,
 *     helm ZELAZNY (nie miedziany!) z nosalem i nakarcznikiem, czarna
 *     kwadratowa broda, tunika teal + kaunakes + 2 zelazne lamelki torsu.
 *   GARNIZON HARAPPY — ewolucja buildStraznikHarappy (p8b): plecionka
 *     trzcinowa WZMOCNIONA SKORA (pasy skorzane + zelazne nity), ZELAZNY
 *     MIECZ-TASAK nisko przy pasie (postawa garnizonowa jak przodek), TURBAN
 *     NA HELMIE SKORZANYM z karneolowym klejnotem, naszyjnik z paciorkow
 *     (karneol/turkus), biala bawelna, skora doliny Indusu, oczy odkryte.
 *
 * Budzet: <=~460 tri na figurke — realne liczby w raporcie (countTri).
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

// ── paleta (seria + ZELAZO: ciemniejszy i zimniejszy metal niz braz) ────────
const Z1_SKIN       = 0xe0ac69;   // skora (Anatolia/Mezopotamia)
const Z1_SKIN_INDUS = 0xb8824e;   // skora doliny Indusu (jak p8b)
const Z1_IRON       = 0x8f97a3;   // ZELAZO — ciemniejsze/zimniejsze niz braz
const Z1_IRON_DK    = 0x6b7280;   // zelazo ciemne (okucia, lamelki)
const Z1_BRONZE     = 0xcf9234;   // braz (akcenty przetrwale z epoki brazu)
const Z1_GOLD       = 0xd8b040;   // zloto (Isztar-akcent, garda elity)
const Z1_WOOD       = 0x7a5c3a;
const Z1_LEATHER    = 0x6b4a28;
const Z1_LEATHER_DK = 0x53381e;   // szeroki pas hetycki
const Z1_LINEN      = 0xe8e0c8;   // tunika hetycka (jak przodek)
const Z1_BRICK      = 0x9c4a2e;   // cegla mulowa Babilonu (jak przodek)
const Z1_CREAM      = 0xe6d9b8;   // przeszycia pikowania / merlony
const Z1_TEAL       = 0x1f7a78;   // tunika Sumeru (jak przodek)
const Z1_FLEECE     = 0xd8c8a0;   // kaunakes sumeryjski
const Z1_COTTON     = 0xefe9d6;   // bawelna Harappy
const Z1_REED       = 0xd8c07c;   // plecionka trzcinowa (jasna)
const Z1_REED_DARK  = 0xa07f42;   // trzcina ciemna (listwy)
const Z1_CARNELIAN  = 0xc05528;   // karneol Harappy
const Z1_TEALBEAD   = 0x2a9d8f;   // turkusowy paciorek
const Z1_DARKHAIR   = 0x2a1a0a;   // broda
const Z1_DARK       = 0x20180f;   // grzebien/kita
const Z1_EYE        = 0x1a1008;

// ── wymiary sylwetki (rodzina NI_* z hastati-falangita.ts — spojna seria) ───
const Z1_HIP_Y     = 0.208 * HEX_R;
const Z1_TORSO_W   = 0.180 * HEX_R;
const Z1_TORSO_H   = 0.205 * HEX_R;
const Z1_TORSO_D   = 0.100 * HEX_R;
const Z1_TORSO_BOT = 0.240 * HEX_R;
const Z1_TORSO_CTR = Z1_TORSO_BOT + Z1_TORSO_H * 0.5;
const Z1_TORSO_TOP = Z1_TORSO_BOT + Z1_TORSO_H;
const Z1_NECK_H    = 0.028 * HEX_R;
const Z1_HEAD_S    = 0.128 * HEX_R;
const Z1_HEAD_CTR  = Z1_TORSO_TOP + Z1_NECK_H + Z1_HEAD_S * 0.5;
const Z1_HEAD_TOP  = Z1_TORSO_TOP + Z1_NECK_H + Z1_HEAD_S;
const Z1_SHLD_X    = Z1_TORSO_W * 0.5 + 0.030 * HEX_R;
const Z1_SHLD_Y    = Z1_TORSO_TOP - 0.024 * HEX_R;
const Z1_HIP_X     = 0.052 * HEX_R;
const Z1_THIGH_L   = 0.104 * HEX_R;
const Z1_SHIN_L    = 0.096 * HEX_R;
const Z1_UPARM_L   = 0.100 * HEX_R;
const Z1_FOREARM_L = 0.092 * HEX_R;

// ── geometrie-singletony (cache po kluczu — wspolne miedzy tokenami) ────────
const z1GeoCache = new Map<string, THREE.BufferGeometry>();
function getG(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = z1GeoCache.get(key);
  if (!g) { g = make(); z1GeoCache.set(key, g); }
  return g;
}
function gBox(key: string, w: number, h: number, d: number): THREE.BufferGeometry {
  return getG(key, () => new THREE.BoxGeometry(w * HEX_R, h * HEX_R, d * HEX_R));
}

// czesci wspolne sylwetki (identyczne wymiary jak rodzina NI_*)
function gTorso()   { return gBox('torso', 0.180, 0.205, 0.100); }
function gNeck()    { return gBox('neck', 0.042, 0.028 * 1.6, 0.042); }
function gHead()    { return gBox('head', 0.128, 0.128, 0.128); }
function gThigh()   { return gBox('thigh', 0.056, 0.104, 0.060); }
function gShin()    { return gBox('shin', 0.038, 0.096, 0.042); }
function gFoot()    { return gBox('foot', 0.044, 0.026, 0.078); }
function gUpArm()   { return gBox('uparm', 0.054, 0.100, 0.054); }
function gForearm() { return gBox('forearm', 0.040, 0.092, 0.040); }
function gFist()    { return gBox('fist', 0.046, 0.046, 0.048); }
function gSkirt()   { return gBox('skirt', 0.196, 0.070, 0.118); }
function gBelt()    { return gBox('belt', 0.190, 0.034, 0.112); }
function gBeltWide(){ return gBox('beltwide', 0.192, 0.056, 0.114); }
function gSash()    { return gBox('sash', 0.052, 0.230, 0.010); }
function gToe()     { return gBox('toe', 0.030, 0.034, 0.022); }
function gEye()     { return gBox('eye', 0.020, 0.020, 0.008); }

// tarcza osemkowa (hetycka — jak przodek z p8a): fasetowany owal z lukiem
function z1OvalRing(a: number, b: number, c: number, N: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(ang) * a, y = Math.sin(ang) * b;
    pts.push([x, y, -c * (x / a) * (x / a)]);
  }
  return pts;
}
function z1MakeShell(a: number, b: number, c: number, t: number, N: number): THREE.BufferGeometry {
  const ring = z1OvalRing(a, b, c, N);
  const pos: number[] = [];
  const P = (x: number, y: number, z: number) => { pos.push(x, y, z); };
  const F = t * 0.5, B = -t * 0.5;
  for (let i = 0; i < N; i++) {
    const p = ring[i]!, q = ring[(i + 1) % N]!;
    P(0, 0, F); P(p[0], p[1], p[2] + F); P(q[0], q[1], q[2] + F);
    P(0, 0, B); P(q[0], q[1], q[2] + B); P(p[0], p[1], p[2] + B);
    P(p[0], p[1], p[2] + F); P(p[0], p[1], p[2] + B); P(q[0], q[1], q[2] + B);
    P(p[0], p[1], p[2] + F); P(q[0], q[1], q[2] + B); P(q[0], q[1], q[2] + F);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function z1MakeFace(a: number, b: number, c: number, N: number): THREE.BufferGeometry {
  const ring = z1OvalRing(a, b, c, N);
  const pos: number[] = [];
  for (let i = 0; i < N; i++) {
    const p = ring[i]!, q = ring[(i + 1) % N]!;
    pos.push(0, 0, 0, p[0], p[1], p[2], q[0], q[1], q[2]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function gFig8Shell() { return getG('fig8shell', () => z1MakeShell(0.082 * HEX_R, 0.094 * HEX_R, 0.026 * HEX_R, 0.018 * HEX_R, 8)); }
function gFig8Face()  { return getG('fig8face',  () => z1MakeFace(0.070 * HEX_R, 0.080 * HEX_R, 0.020 * HEX_R, 8)); }

// ── anatomia lancuchowa (konwencja niSeg/niBuildLeg/niBuildArm) ─────────────
function z1DirDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}
function z1Seg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = z1DirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}
function z1BuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  mFoot: THREE.MeshStandardMaterial, hipY: number = Z1_HIP_Y,
): { footZ: number } {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = z1Seg(group, gThigh(), mThigh, P, thU, Z1_THIGH_L);
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = z1Seg(group, gShin(), mShin, P, thL, Z1_SHIN_L);
  const foot = new THREE.Mesh(gFoot(), mFoot);
  foot.position.set(sx, 0.013 * HEX_R, P.z + 0.016 * HEX_R);
  group.add(foot);
  return { footZ: P.z + 0.016 * HEX_R };
}
function z1BuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  let P = new THREE.Vector3(sx, Z1_SHLD_Y, 0);
  P = z1Seg(group, gUpArm(), mUp, P, thU, Z1_UPARM_L);
  P.y += 0.010 * HEX_R;
  const wrist = z1Seg(group, gForearm(), mFore, P, thF, Z1_FOREARM_L);
  if (mFist !== null) {
    const fist = new THREE.Mesh(gFist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(z1DirDown(thF), 0.014 * HEX_R));
    group.add(fist);
  }
  return { wrist, axis: z1DirDown(thF) };
}
function z1Core(
  group: THREE.Group, mat: MatFactory, mTorso: THREE.MeshStandardMaterial,
  skinColor: number = Z1_SKIN, eyes: boolean = false,
): THREE.MeshStandardMaterial {
  const torso = new THREE.Mesh(gTorso(), mTorso);
  torso.position.set(0, Z1_TORSO_CTR, 0);
  group.add(torso);
  const mSkin = mat(skinColor, 0.05, 0.80);
  const neck = new THREE.Mesh(gNeck(), mSkin);
  neck.position.set(0, Z1_TORSO_TOP + Z1_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(gHead(), mSkin);
  head.position.set(0, Z1_HEAD_CTR, 0);
  group.add(head);
  if (eyes) {
    const mEye = mat(Z1_EYE, 0.02, 0.95);
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(gEye(), mEye);
      eye.position.set(sx * 0.028 * HEX_R, Z1_HEAD_CTR + 0.008 * HEX_R, Z1_HEAD_S * 0.5 + 0.004 * HEX_R);
      group.add(eye);
    }
  }
  return mSkin;
}
/** Szarfa gracza skosna przez tors (nosnik koloru gracza — jak seria). */
function z1Sash(group: THREE.Group, mOwner: THREE.MeshStandardMaterial): void {
  const s = new THREE.Mesh(gSash(), mOwner);
  s.rotation.z = 0.60;
  s.position.set(0, Z1_TORSO_CTR + 0.012 * HEX_R, Z1_TORSO_D * 0.5 + 0.007 * HEX_R);
  group.add(s);
}
/** Broda klockowa (styl mezopotamski): schodkowane rzedy. */
function z1Beard(group: THREE.Group, mHair: THREE.MeshStandardMaterial, rows: number): void {
  const z0 = Z1_HEAD_S * 0.5 - 0.004 * HEX_R;
  const geos = [gBox('beard1', 0.088, 0.026, 0.026), gBox('beard2', 0.074, 0.026, 0.022), gBox('beard3', 0.056, 0.026, 0.018)];
  for (let i = 0; i < rows; i++) {
    const b = new THREE.Mesh(geos[i], mHair);
    b.position.set(0, Z1_HEAD_CTR - (0.052 + i * 0.026) * HEX_R, z0 + (0.012 - i * 0.003) * HEX_R);
    group.add(b);
  }
}

// ---------------------------------------------------------------------------
// 1. GWARDIA HETYCKA (Hetyci, ZELAZO, ELITA 40/9) — POZA: pchniecie zelaznym
// mieczem prostym na wysokosci piersi, tarcza-osemka oslania korpus, gleboki
// wykrok. Ciezsza siostra Piechoty hetyckiej (p8a): lamelkowy kaftan zelazny
// na kremowej tunice, helm ZELAZNY z WYSOKIM grzebieniem + nauszniki, tarcza
// osemkowa wzmocniona zelaznym bosem, buty z zadartymi noskami, szeroki pas.
// ---------------------------------------------------------------------------
export function buildGwardiaHetycka(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mLinen  = mat(Z1_LINEN,      0.06, 0.82);
  const mIron   = mat(Z1_IRON,       0.55, 0.40);
  const mIronD  = mat(Z1_IRON_DK,    0.50, 0.46);
  const mGold   = mat(Z1_GOLD,       0.55, 0.35);
  const mOwner  = mat(ownerColor_,   0.14, 0.64);
  const mLeath  = mat(Z1_LEATHER,    0.06, 0.82);
  const mLeathD = mat(Z1_LEATHER_DK, 0.05, 0.85);
  const mSkin   = mat(Z1_SKIN,       0.05, 0.80);
  const mDark   = mat(Z1_DARK,       0.05, 0.88);

  const HIP_Y = Z1_HIP_Y - 0.012 * HEX_R;   // gleboki wykrok (elita napiera)

  // korpus: kremowa tunika + LAMELKOWY KAFTAN ZELAZNY (3 pasy lamelek)
  z1Core(group, mat, mLinen);
  for (let i = 0; i < 3; i++) {
    const lam = new THREE.Mesh(gBox('hetlam', 0.184, 0.040, 0.106), (i % 2 === 0) ? mIron : mIronD);
    lam.position.set(0, Z1_TORSO_TOP - (0.052 + i * 0.048) * HEX_R, 0);
    group.add(lam);
  }
  const skirt = new THREE.Mesh(gSkirt(), mLinen);
  skirt.position.set(0, Z1_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const belt = new THREE.Mesh(gBeltWide(), mLeathD);   // szeroki pas hetycki
  belt.position.set(0, 0.258 * HEX_R, 0);
  group.add(belt);
  z1Sash(group, mOwner);

  // nogi: LEWA (+X) wykroczna; BUTY Z ZADARTYMI NOSKAMI (hetycki detal)
  const legL = z1BuildLeg(group,  Z1_HIP_X,  0.58,  0.34, mLinen, mSkin, mLeath, HIP_Y);
  const legR = z1BuildLeg(group, -Z1_HIP_X, -0.52, -0.20, mLinen, mSkin, mLeath, HIP_Y);
  for (const [sx, fz] of [[Z1_HIP_X, legL.footZ], [-Z1_HIP_X, legR.footZ]] as [number, number][]) {
    const toe = new THREE.Mesh(gToe(), mLeath);
    toe.rotation.x = -0.55;
    toe.position.set(sx, 0.030 * HEX_R, fz + 0.042 * HEX_R);
    group.add(toe);
  }

  // HELM ZELAZNY stozkowy + nauszniki + WYSOKI GRZEBIEN przod-tyl (elita)
  const cone = new THREE.Mesh(getG('hetcone', () => new THREE.CylinderGeometry(0.040 * HEX_R, 0.098 * HEX_R, 0.115 * HEX_R, 8, 1)), mIron);
  cone.position.set(0, Z1_HEAD_CTR + 0.042 * HEX_R, 0);
  group.add(cone);
  for (const sx of [-1, 1]) {
    const ck = new THREE.Mesh(gBox('hetcheek', 0.020, 0.052, 0.044), mIron);
    ck.position.set(sx * (Z1_HEAD_S * 0.5 + 0.004 * HEX_R), Z1_HEAD_CTR - 0.012 * HEX_R, 0.014 * HEX_R);
    group.add(ck);
  }
  const crest = new THREE.Mesh(gBox('hetcrest', 0.024, 0.088, 0.150), mDark);  // WYSOKI grzebien
  crest.rotation.x = 0.10;
  crest.position.set(0, Z1_HEAD_TOP + 0.088 * HEX_R, -0.008 * HEX_R);
  group.add(crest);

  // PRAWE (-X) RAMIE + ZELAZNY MIECZ PROSTY: pchniecie na wysokosci piersi,
  // klinga NA OSI przedramienia (ewolucja: sierpowaty -> prosty zelazny)
  const armR = z1BuildArm(group, -Z1_SHLD_X, 1.02, 1.40, mLinen, mSkin, mLeath);
  const swAxis = armR.axis;
  const guard = new THREE.Mesh(gBox('hetguard', 0.056, 0.018, 0.024), mGold);
  guard.rotation.x = Math.PI - 1.40;
  guard.position.copy(armR.wrist.clone().addScaledVector(swAxis, 0.032 * HEX_R));
  group.add(guard);
  const blade = new THREE.Mesh(gBox('hetblade', 0.026, 0.150, 0.014), mIron);
  blade.rotation.x = Math.PI - 1.40;
  blade.position.copy(armR.wrist.clone().addScaledVector(swAxis, 0.110 * HEX_R));
  group.add(blade);
  const tip = new THREE.Mesh(getG('hettip', () => new THREE.ConeGeometry(0.016 * HEX_R, 0.042 * HEX_R, 4)), mIron);
  tip.rotation.x = Math.PI - 1.40;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(armR.wrist.clone().addScaledVector(swAxis, 0.206 * HEX_R));
  group.add(tip);

  // LEWE (+X) RAMIE + TARCZA-OSEMKA WZMOCNIONA (pole gracza, zelazny bos)
  const armL = z1BuildArm(group, Z1_SHLD_X, 0.50, 1.08, mLinen, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.025 * HEX_R,
    armL.wrist.y + 0.052 * HEX_R,
    armL.wrist.z + 0.045 * HEX_R,
  );
  sh.rotation.y = -0.20;
  for (const dy of [0.072, -0.072]) {                  // dwa loby osemki
    const shell = new THREE.Mesh(gFig8Shell(), mLeath);
    shell.position.set(0, dy * HEX_R, 0);
    sh.add(shell);
    const face = new THREE.Mesh(gFig8Face(), mOwner);
    face.position.set(0, dy * HEX_R, 0.013 * HEX_R);
    sh.add(face);
  }
  const boss = new THREE.Mesh(gBox('hetboss', 0.040, 0.040, 0.022), mIron);  // zelazny bos (talia osemki)
  boss.rotation.z = Math.PI / 4;
  boss.position.set(0, 0, 0.018 * HEX_R);
  sh.add(boss);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// 2. PIECHOTA NEOBABILONSKA (Babilonia, ZELAZO) — POZA: CIOS Z GORY zelaznym
// mieczem prostym (ta sama poza co sierpowiec przodka z brazu — ewolucja
// broni, nie ruchu). Kaftan PIKOWANY (ceglasty + pionowe przeszycia kremowe),
// merlony zigzagu muru na dole (znak Babilonu), TARCZA WIEZOWA z zelaznymi
// listwami i SKROMNYM zlotym Isztar-akcentem, helm: zelazny stozek z
// NAKARCZNIKIEM, broda klockowa (2 rzedy).
// ---------------------------------------------------------------------------
export function buildPiechotaNeobabilonska(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mBrick  = mat(Z1_BRICK,    0.05, 0.84);
  const mCream  = mat(Z1_CREAM,    0.06, 0.82);
  const mIron   = mat(Z1_IRON,     0.55, 0.40);
  const mIronD  = mat(Z1_IRON_DK,  0.50, 0.46);
  const mGold   = mat(Z1_GOLD,     0.55, 0.35);
  const mOwner  = mat(ownerColor_, 0.14, 0.64);
  const mWood   = mat(Z1_WOOD,     0.05, 0.85);
  const mLeath  = mat(Z1_LEATHER,  0.06, 0.82);
  const mSkin   = mat(Z1_SKIN,     0.05, 0.80);
  const mHair   = mat(Z1_DARKHAIR, 0.05, 0.88);

  const HIP_Y = Z1_HIP_Y - 0.010 * HEX_R;

  // korpus: kaftan PIKOWANY — ceglasty tors + 2 pionowe przeszycia kremowe
  z1Core(group, mat, mBrick);
  for (const sx of [-0.045, 0.045]) {
    const seam = new THREE.Mesh(gBox('nbseam', 0.014, 0.190, 0.008), mCream);
    seam.position.set(sx * HEX_R, Z1_TORSO_CTR, Z1_TORSO_D * 0.5 + 0.005 * HEX_R);
    group.add(seam);
  }
  const skirt = new THREE.Mesh(gSkirt(), mBrick);
  skirt.position.set(0, Z1_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const hem = new THREE.Mesh(gBox('nbhem', 0.198, 0.026, 0.120), mCream);
  hem.position.set(0, Z1_TORSO_BOT - 0.052 * HEX_R, 0);
  group.add(hem);
  for (const sx of [-1, 1]) {                          // merlony zigzagu muru
    const mer = new THREE.Mesh(gBox('nbmerlon', 0.024, 0.020, 0.008), mBrick);
    mer.position.set(sx * 0.062 * HEX_R, Z1_TORSO_BOT - 0.044 * HEX_R, 0.062 * HEX_R);
    group.add(mer);
  }
  const belt = new THREE.Mesh(gBelt(), mLeath);
  belt.position.set(0, 0.256 * HEX_R, 0);
  group.add(belt);
  z1Sash(group, mOwner);

  // nogi
  z1BuildLeg(group,  Z1_HIP_X,  0.55,  0.30, mBrick, mSkin, mLeath, HIP_Y);
  z1BuildLeg(group, -Z1_HIP_X, -0.50, -0.16, mBrick, mSkin, mLeath, HIP_Y);

  // HELM: ZELAZNY stozek + NAKARCZNIK + broda klockowa (2 rzedy)
  const cone = new THREE.Mesh(getG('nbcone', () => new THREE.CylinderGeometry(0.038 * HEX_R, 0.096 * HEX_R, 0.120 * HEX_R, 8, 1)), mIron);
  cone.position.set(0, Z1_HEAD_CTR + 0.044 * HEX_R, 0);
  group.add(cone);
  const neckG = new THREE.Mesh(gBox('nbneckg', 0.130, 0.042, 0.020), mIronD);
  neckG.rotation.x = -0.38;
  neckG.position.set(0, Z1_HEAD_CTR - 0.018 * HEX_R, -(Z1_HEAD_S * 0.5 + 0.010 * HEX_R));
  group.add(neckG);
  z1Beard(group, mHair, 2);

  // PRAWE (-X) RAMIE + ZELAZNY MIECZ w CIOSIE Z GORY (poza przodka-sierpowca)
  const armR = z1BuildArm(group, -Z1_SHLD_X, -2.15, 2.45, mBrick, mSkin, mLeath);
  const swAxis = armR.axis;
  const grip = new THREE.Mesh(gBox('nbgrip', 0.024, 0.062, 0.024), mWood);
  grip.rotation.x = Math.PI - 2.45;
  grip.position.copy(armR.wrist.clone().addScaledVector(swAxis, 0.016 * HEX_R));
  group.add(grip);
  const guard = new THREE.Mesh(gBox('nbguard', 0.056, 0.018, 0.024), mIronD);
  guard.rotation.x = Math.PI - 2.45;
  guard.position.copy(armR.wrist.clone().addScaledVector(swAxis, 0.052 * HEX_R));
  group.add(guard);
  const blade = new THREE.Mesh(gBox('nbblade', 0.026, 0.150, 0.014), mIron);
  blade.rotation.x = Math.PI - 2.45;
  blade.position.copy(armR.wrist.clone().addScaledVector(swAxis, 0.132 * HEX_R));
  group.add(blade);
  const tip = new THREE.Mesh(getG('nbtip', () => new THREE.ConeGeometry(0.016 * HEX_R, 0.042 * HEX_R, 4)), mIron);
  tip.rotation.x = Math.PI - 2.45;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(armR.wrist.clone().addScaledVector(swAxis, 0.228 * HEX_R));
  group.add(tip);

  // LEWE (+X) RAMIE + TARCZA WIEZOWA (pole gracza, zelazne listwy,
  // SKROMNY zloty Isztar-akcent: krzyz 8 promieni w gornej czesci)
  const armL = z1BuildArm(group, Z1_SHLD_X, 0.46, 1.02, mBrick, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.020 * HEX_R,
    armL.wrist.y + 0.045 * HEX_R,
    armL.wrist.z + 0.048 * HEX_R,
  );
  sh.rotation.y = -0.18;
  const face = new THREE.Mesh(gBox('nbshface', 0.156, 0.296, 0.020), mOwner);
  sh.add(face);
  for (const fy of [-0.118, 0.118]) {                  // zelazne listwy okuc
    const bar = new THREE.Mesh(gBox('nbshbar', 0.164, 0.022, 0.010), mIronD);
    bar.position.set(0, fy * HEX_R, 0.012 * HEX_R);
    sh.add(bar);
  }
  for (const rot of [0, Math.PI / 4, Math.PI / 2, -Math.PI / 4]) {  // Isztar: 8 malych promieni
    const ray = new THREE.Mesh(gBox('nbray', 0.014, 0.084, 0.008), mGold);
    ray.rotation.z = rot;
    ray.position.set(0, 0.056 * HEX_R, 0.014 * HEX_R);
    sh.add(ray);
  }
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// 3. MUR TARCZ (SARGONID) (Sumer, ZELAZO, formacja 6/10) — POZA: SCIANA TARCZ
// (ewolucja wlocznika sumeryjskiego z p57). WIELKA prostokatna tarcza
// formacyjna OKUTA ZELAZEM (pole = kolor gracza, listwy poziome + okucia
// krawedzi + nity) frontem przed cialem, dol tuz nad ziemia; wlocznia POZIOMA
// nad krawedzia tarczy (lokiec uniesiony). Helm ZELAZNY (nie miedziany!)
// z nosalem i nakarcznikiem, czarna kwadratowa broda, tunika teal + kaunakes
// + 2 zelazne lamelki torsu (wiecej metalu niz u przodka).
// ---------------------------------------------------------------------------
export function buildMurTarcz(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mTeal   = mat(Z1_TEAL,     0.05, 0.85);
  const mFleece = mat(Z1_FLEECE,   0.04, 0.96);
  const mIron   = mat(Z1_IRON,     0.55, 0.40);
  const mIronD  = mat(Z1_IRON_DK,  0.50, 0.46);
  const mWood   = mat(Z1_WOOD,     0.05, 0.85);
  const mOwner  = mat(ownerColor_, 0.12, 0.66);
  const mLeath  = mat(Z1_LEATHER,  0.06, 0.82);
  const mSkin   = mat(Z1_SKIN,     0.05, 0.80);
  const mBlack  = mat(Z1_DARK,     0.04, 0.90);

  const HIP_Y = Z1_HIP_Y - 0.006 * HEX_R;   // lekki wykrok — mur stoi

  // korpus: tunika teal + 2 ZELAZNE LAMELKI (ewolucja: metal na torsie)
  z1Core(group, mat, mTeal);
  for (let i = 0; i < 2; i++) {
    const lam = new THREE.Mesh(gBox('mtlam', 0.184, 0.038, 0.106), (i === 0) ? mIron : mIronD);
    lam.position.set(0, Z1_TORSO_TOP - (0.050 + i * 0.046) * HEX_R, 0);
    group.add(lam);
  }
  z1Sash(group, mOwner);

  // kaunakes: 3 rzedy runa (dziedzictwo sumeryjskie)
  const rows: [THREE.BufferGeometry, number][] = [
    [gBox('mtfl1', 0.206, 0.034, 0.134), Z1_TORSO_BOT - 0.010 * HEX_R],
    [gBox('mtfl2', 0.198, 0.034, 0.130), Z1_TORSO_BOT - 0.044 * HEX_R],
    [gBox('mtfl3', 0.190, 0.034, 0.126), Z1_TORSO_BOT - 0.078 * HEX_R],
  ];
  for (const [geo, fy] of rows) {
    const r = new THREE.Mesh(geo, mFleece);
    r.position.set(0, fy, 0);
    group.add(r);
  }

  // nogi: lekki wykrok (mur stoi), golenie nagie, sandaly
  z1BuildLeg(group,  Z1_HIP_X,  0.26,  0.10, mTeal, mSkin, mLeath, HIP_Y);
  z1BuildLeg(group, -Z1_HIP_X, -0.26, -0.08, mTeal, mSkin, mLeath, HIP_Y);

  // HELM ZELAZNY stozkowy + nosal + nakarcznik + czarna kwadratowa broda
  const helm = new THREE.Mesh(getG('mthelm', () => new THREE.CylinderGeometry(0.018 * HEX_R, 0.090 * HEX_R, 0.125 * HEX_R, 8, 1)), mIron);
  helm.position.set(0, Z1_HEAD_CTR + 0.040 * HEX_R, 0);
  group.add(helm);
  const nose = new THREE.Mesh(gBox('mtnose', 0.018, 0.058, 0.016), mIronD);
  nose.position.set(0, Z1_HEAD_CTR - 0.008 * HEX_R, Z1_HEAD_S * 0.5 + 0.006 * HEX_R);
  group.add(nose);
  const neckG = new THREE.Mesh(gBox('mtneckg', 0.120, 0.040, 0.020), mIron);
  neckG.rotation.x = -0.38;
  neckG.position.set(0, Z1_HEAD_CTR - 0.020 * HEX_R, -(Z1_HEAD_S * 0.5 + 0.010 * HEX_R));
  group.add(neckG);
  const beard = new THREE.Mesh(gBox('mtbeard', 0.084, 0.052, 0.024), mBlack);
  beard.position.set(0, Z1_HEAD_CTR - 0.052 * HEX_R, Z1_HEAD_S * 0.5 - 0.004 * HEX_R);
  group.add(beard);

  // PRAWE (-X) RAMIE + WLOCZNIA POZIOMA nad krawedzia tarczy (lokiec uniesiony)
  const armR = z1BuildArm(group, -Z1_SHLD_X, 1.24, 1.58, mTeal, mSkin, mSkin);
  const ax = armR.axis;
  const shaft = new THREE.Mesh(gBox('mtshaft', 0.019, 0.600, 0.019), mWood);
  shaft.rotation.x = Math.PI - 1.58;
  shaft.position.copy(armR.wrist.clone().addScaledVector(ax, 0.060 * HEX_R));
  group.add(shaft);
  const tip = new THREE.Mesh(getG('mttip', () => new THREE.ConeGeometry(0.019 * HEX_R, 0.058 * HEX_R, 4)), mIron);
  tip.rotation.x = Math.PI - 1.58;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(armR.wrist.clone().addScaledVector(ax, 0.405 * HEX_R));
  group.add(tip);
  const butt = new THREE.Mesh(gBox('mtbutt', 0.024, 0.030, 0.024), mIronD);
  butt.rotation.x = Math.PI - 1.58;
  butt.position.copy(armR.wrist.clone().addScaledVector(ax, -0.255 * HEX_R));
  group.add(butt);

  // LEWE (+X) RAMIE za WIELKA TARCZA FORMACYJNA OKUTA (frontem — mur tarcz)
  z1BuildArm(group, Z1_SHLD_X, 0.42, 0.98, mTeal, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(0.130 * HEX_R, 0.195 * HEX_R, 0.105 * HEX_R);
  const back = new THREE.Mesh(gBox('mtshback', 0.184, 0.354, 0.012), mWood);
  back.position.set(0, 0, -0.008 * HEX_R);
  sh.add(back);
  const face = new THREE.Mesh(gBox('mtshface', 0.170, 0.340, 0.014), mOwner);
  sh.add(face);
  for (const fy of [-0.100, 0.100]) {                  // ZELAZNE listwy poziome
    const bar = new THREE.Mesh(gBox('mtshbar', 0.184, 0.026, 0.010), mIronD);
    bar.position.set(0, fy * HEX_R, 0.008 * HEX_R);
    sh.add(bar);
  }
  for (const fx of [-0.078, 0.078]) {                  // okucia pionowe krawedzi
    const edge = new THREE.Mesh(gBox('mtshedge', 0.020, 0.354, 0.010), mIron);
    edge.position.set(fx * HEX_R, 0, 0.006 * HEX_R);
    sh.add(edge);
  }
  for (const fy of [-0.032, 0.032]) {                  // nity w osi
    const st = new THREE.Mesh(gBox('mtstud', 0.024, 0.024, 0.010), mIron);
    st.rotation.z = Math.PI / 4;
    st.position.set(0, fy * HEX_R, 0.009 * HEX_R);
    sh.add(st);
  }
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// 4. GARNIZON HARAPPY (Harappa, ZELAZO, 8/8) — POZA: postawa garnizonowa
// (obrona miasta-planu; ewolucja Straznika bram z p8b): WIELKA prostokatna
// tarcza plecionkowa WZMOCNIONA SKORA (pasy skorzane + zelazne nity, pas
// centralny = KOLOR GRACZA) przed korpusem, ZELAZNY MIECZ-TASAK nisko przy
// pasie (grot ku wrogowi — pchniecie zza tarczy). TURBAN NA HELMIE SKORZANYM
// z karneolowym klejnotem, naszyjnik z paciorkow (karneol/turkus), biala
// bawelna, skora doliny Indusu, oczy odkryte.
// ---------------------------------------------------------------------------
export function buildGarnizonHarappy(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mCotton = mat(Z1_COTTON,     0.04, 0.86);
  const mOwner  = mat(ownerColor_,   0.15, 0.65);
  const mReed   = mat(Z1_REED,       0.04, 0.88);
  const mReedD  = mat(Z1_REED_DARK,  0.04, 0.88);
  const mIron   = mat(Z1_IRON,       0.55, 0.40);
  const mIronD  = mat(Z1_IRON_DK,    0.50, 0.46);
  const mCarn   = mat(Z1_CARNELIAN,  0.20, 0.45);
  const mTeal   = mat(Z1_TEALBEAD,   0.18, 0.50);
  const mLeath  = mat(Z1_LEATHER,    0.06, 0.82);
  const mWood   = mat(Z1_WOOD,       0.05, 0.85);

  const HIP_Y = Z1_HIP_Y - 0.008 * HEX_R;   // lekki wykrok obronny

  // korpus: biala tunika bawelniana; twarz ODKRYTA => oczy
  const mSkin = z1Core(group, mat, mCotton, Z1_SKIN_INDUS, true);
  const skirt = new THREE.Mesh(gSkirt(), mCotton);
  skirt.position.set(0, Z1_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const belt = new THREE.Mesh(gBelt(), mOwner);        // pas = KOLOR GRACZA (jak przodek)
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);

  // NASZYJNIK Z PACIORKOW (karneol/turkus, luk) — znak Harappy
  let bi = 0;
  for (const bx of [-0.040, 0.0, 0.040]) {
    const bead = new THREE.Mesh(gBox('grbead', 0.024, 0.024, 0.014), (bi++ % 2 === 0) ? mCarn : mTeal);
    const arc = (Math.abs(bx) < 0.02) ? -0.008 : 0.0;
    bead.position.set(bx * HEX_R, Z1_TORSO_TOP - 0.014 * HEX_R + arc * HEX_R, Z1_TORSO_D * 0.5 + 0.008 * HEX_R);
    group.add(bead);
  }

  // nogi: postawa garnizonowa (lekki wykrok obronny)
  z1BuildLeg(group,  Z1_HIP_X,  0.42,  0.24, mCotton, mSkin, mLeath, HIP_Y);
  z1BuildLeg(group, -Z1_HIP_X, -0.38, -0.14, mCotton, mSkin, mLeath, HIP_Y);

  // TURBAN NA HELMIE SKORZANYM: skorzany dzwon + bawelniany zawoj + KLEJNOT
  const cap = new THREE.Mesh(getG('grcap', () => new THREE.CylinderGeometry(0.046 * HEX_R, 0.068 * HEX_R, 0.058 * HEX_R, 8, 1)), mLeath);
  cap.position.set(0, Z1_HEAD_CTR + 0.058 * HEX_R, 0);
  group.add(cap);
  const wrap = new THREE.Mesh(gBox('grwrap', 0.172, 0.034, 0.172), mCotton);  // BIALY zawoj turbanu
  wrap.rotation.y = Math.PI / 8;
  wrap.position.set(0, Z1_HEAD_CTR + 0.030 * HEX_R, 0);
  group.add(wrap);
  const jewel = new THREE.Mesh(gBox('grjewel', 0.026, 0.038, 0.012), mCarn);  // klejnot czolowy na zawoju
  jewel.position.set(0, Z1_HEAD_CTR + 0.030 * HEX_R, 0.092 * HEX_R);
  group.add(jewel);

  // PRAWE (-X) RAMIE + ZELAZNY MIECZ-TASAK nisko (pchniecie zza tarczy):
  // przedramie w przod, klinga NA OSI dloni, szeroki grzbiet tasaka
  const armR = z1BuildArm(group, -Z1_SHLD_X, 0.85, 1.52, mCotton, mSkin, mSkin);
  const ax = armR.axis;
  const guard = new THREE.Mesh(gBox('grguard', 0.052, 0.016, 0.022), mIronD);
  guard.rotation.x = Math.PI - 1.52;
  guard.position.copy(armR.wrist.clone().addScaledVector(ax, 0.034 * HEX_R));
  group.add(guard);
  const blade = new THREE.Mesh(gBox('grblade', 0.038, 0.130, 0.012), mIron);   // SZEROKA klinga tasaka
  blade.rotation.x = Math.PI - 1.52;
  blade.position.copy(armR.wrist.clone().addScaledVector(ax, 0.102 * HEX_R));
  group.add(blade);
  const tip = new THREE.Mesh(gBox('grtip', 0.030, 0.036, 0.011), mIron);       // skosny czub tasaka
  tip.rotation.x = Math.PI - 1.52;
  tip.rotation.z = 0.42;
  tip.position.copy(armR.wrist.clone().addScaledVector(ax, 0.180 * HEX_R));
  group.add(tip);

  // LEWE (+X) RAMIE + WIELKA TARCZA plecionkowa WZMOCNIONA SKORA
  const armL = z1BuildArm(group, Z1_SHLD_X, 0.50, 1.10, mCotton, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.030 * HEX_R,
    armL.wrist.y + 0.052 * HEX_R,
    armL.wrist.z + 0.050 * HEX_R,
  );
  sh.rotation.y = -0.18;
  const base = new THREE.Mesh(gBox('grshbase', 0.210, 0.340, 0.014), mReed);   // pole plecionki
  sh.add(base);
  for (const vy of [-0.110, 0.110]) {                  // pasy SKORZANE (wzmocnienie)
    const h = new THREE.Mesh(gBox('grshstrap', 0.222, 0.036, 0.020), mLeath);
    h.position.set(0, vy * HEX_R, 0.010 * HEX_R);
    sh.add(h);
  }
  for (const vx of [-0.056, 0.056]) {                  // listwy pionowe trzcinowe
    const v = new THREE.Mesh(gBox('grshv', 0.034, 0.352, 0.026), mReedD);
    v.position.set(vx * HEX_R, 0, 0.016 * HEX_R);
    sh.add(v);
  }
  const band = new THREE.Mesh(gBox('grshband', 0.222, 0.044, 0.024), mOwner);  // pas = KOLOR GRACZA
  band.position.set(0, 0, 0.020 * HEX_R);
  sh.add(band);
  for (const [vx, vy] of [[-0.056, -0.110], [0.056, -0.110], [-0.056, 0.110], [0.056, 0.110]] as [number, number][]) {
    const st = new THREE.Mesh(gBox('grstud', 0.020, 0.020, 0.010), mIron);     // ZELAZNE nity
    st.rotation.z = Math.PI / 4;
    st.position.set(vx * HEX_R, vy * HEX_R, 0.022 * HEX_R);
    sh.add(st);
  }
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}
