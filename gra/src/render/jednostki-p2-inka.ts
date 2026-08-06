/**
 * jednostki-p2-inka.ts — PACZKA 2/8: INKOWIE, proceduralne modele piechoty
 * (seria render-jednostki; wzorzec: hastati-falangita.ts KOREKTA v2)
 * ---------------------------------------------------------------------------
 * ZAWARTOSC PLIKU (stan 2026-08-06) — CZTERY buildery, wszystkie UZYWANE
 * (wywolania po NAZWIE FUNKCJI, import w units.ts; celowo bez numerow linii —
 * poprzedni naglowek podawal „units.ts:6266" itp. i dawno sie rozjechal):
 *   buildMaceWarrior(ownerColor)     'wojownik z maczuga' / 'chaska'
 *   buildInkaJavelineer(ownerColor)  'oszczepnik' + 'estolica'
 *   buildAxeWarriorInka(ownerColor)  'wojownik z toporem'
 *   buildInkaSlinger(ownerColor)     'procarz' + 'huaracoc'
 *
 * USUNIETE 2026-08-06 (R-BRAZ-SUPER-DISPATCH-Q1=A, sprzatanie po recenzji):
 * buildSuperInca wraz z geometriami uzywanymi wylacznie przez niego. Po
 * przekierowaniu dispatchu super-jednostek na modele NAZWANE super 'inka'
 * obsluguje buildInkaRoyalGuard w units.ts, a buildSuperInca nie mial juz ANI
 * JEDNEGO wywolania. (Poprzedni naglowek twierdzil odwrotnie — ze to
 * buildInkaRoyalGuard jest „martwym kodem" — co po zmianie dispatchu przestalo
 * byc prawda.) Analogiczne czyszczenie objelo jednostki-p6-super.ts.
 *
 * Interfejs i konwencje BEZ ZMIAN:
 *   - figurka PRZODEM do +Z, stopy na y = 0, uklad prawoskretny => LEWA = +X, PRAWA = -X,
 *   - TARCZA zawsze na LEWYM (+X) przedramieniu, BRON w PRAWEJ (-X) dloni NA OSI przedramienia,
 *   - POZY ATAKU (wykrok, biodra obnizone, zamach), NAKRYCIE GLOWY na kazdej glowie,
 *   - group.userData['mats'] i ['perTokenGeos'] jak w units.ts, geometrie = singletony modulu.
 *
 * STYL ANDYJSKI (paczka 2):
 *   - tuniki-UNKU: kolory ziemi (ochra/burgund) + wzory geometryczne (szachownica
 *     tokapu, rzedy rombow, pasy graniczne na dole spodnicy),
 *   - nakrycia glowy: opaski llautu z piorami (Chaska, Estolica, Huaracoc),
 *     czapka CHULLO z nausznikami (topornik),
 *   - akcenty: turkus 0x2a9d8f + zloto Inkow 0xe0b53a, zlote kolczyki-krazki (orejones),
 *   - bronie: maczuga gwiazdzista z KAMIENNA glowica (gwiazda = 3 skrzyzowane klocki),
 *     estolica-atlatl w gescie zamachu (strzalka na haczyku), topor bradzowy na DLUGIM
 *     stylisku, proca huaraca w ZAMACHU NAD GLOWA.
 *   - kolor gracza JAK W STARYCH: Chaska pole tarczy+2 piora; Estolica pas dolny+pioropusz;
 *     topornik pole tarczy+pioro; Huaracoc pas dolny+klapka sakwy.
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

// ── paleta andyjska (ziemia + turkus + zloto; zgodna z units.ts poza turkusem
//    rozjasnionym 0x1f7a78 -> 0x2a9d8f dla czytelnosci malych klockow) ───────
const IK_SKIN      = 0xe0ac69;   // skora (Estolica, Huaracoc — jak stare)
const IK_SKIN_DARK = 0xc89058;   // skora ogorzala (Chaska, topornik, SUPER — jak stare)
const IK_OCHRE     = 0xc8932e;   // ochra unku
const IK_BURGUNDY  = 0x7e2a30;   // burgund unku topornika
const IK_RED       = 0xc0392b;   // czerwien tekstylna
const IK_RED_BAND  = 0xc03530;   // czerwona opaska llautu (jak stare)
const IK_TEAL      = 0x2a9d8f;   // turkus andyjski (akcent)
const IK_GOLD      = 0xe0b53a;   // zloto Inkow
const IK_WOOD      = 0x7a5c3a;   // drewno
const IK_LEATHER   = 0x6b4a28;   // skora rzemienie/sandaly
const IK_STONE     = 0x8a8680;   // kamien glowicy maczugi
const IK_BRONZE    = 0xcf9234;   // braz
const IK_BRONZE_LT = 0xd0a050;   // jasny braz (krawedz topora)
const IK_FEATHER   = 0xf4f0e6;   // biale pioro
const IK_EYE       = 0x1a1008;   // oczy

// ── wymiary sylwetki (rodzina NI_* z hastati-falangita.ts — spojna seria) ───
const IK_HIP_Y     = 0.208 * HEX_R;
const IK_TORSO_W   = 0.180 * HEX_R;
const IK_TORSO_H   = 0.205 * HEX_R;
const IK_TORSO_D   = 0.100 * HEX_R;
const IK_TORSO_BOT = 0.240 * HEX_R;
const IK_TORSO_CTR = IK_TORSO_BOT + IK_TORSO_H * 0.5;
const IK_TORSO_TOP = IK_TORSO_BOT + IK_TORSO_H;
const IK_NECK_H    = 0.028 * HEX_R;
const IK_HEAD_S    = 0.128 * HEX_R;
const IK_HEAD_CTR  = IK_TORSO_TOP + IK_NECK_H + IK_HEAD_S * 0.5;
const IK_HEAD_TOP  = IK_TORSO_TOP + IK_NECK_H + IK_HEAD_S;
const IK_SHLD_X    = IK_TORSO_W * 0.5 + 0.030 * HEX_R;
const IK_SHLD_Y    = IK_TORSO_TOP - 0.024 * HEX_R;
const IK_HIP_X     = 0.052 * HEX_R;
const IK_THIGH_L   = 0.104 * HEX_R;
const IK_SHIN_L    = 0.096 * HEX_R;
const IK_UPARM_L   = 0.100 * HEX_R;
const IK_FOREARM_L = 0.092 * HEX_R;

// ── geometrie-singletony (wspolne dla wszystkich tokenow paczki) ────────────
let gIKTorso:   THREE.BoxGeometry | null = null;
let gIKNeck:    THREE.BoxGeometry | null = null;
let gIKHead:    THREE.BoxGeometry | null = null;
let gIKEye:     THREE.BoxGeometry | null = null;
let gIKThigh:   THREE.BoxGeometry | null = null;
let gIKShin:    THREE.BoxGeometry | null = null;
let gIKFoot:    THREE.BoxGeometry | null = null;
let gIKUpArm:   THREE.BoxGeometry | null = null;
let gIKForearm: THREE.BoxGeometry | null = null;
let gIKFist:    THREE.BoxGeometry | null = null;
let gIKSkirt:   THREE.BoxGeometry | null = null;   // dol unku
let gIKHemBand: THREE.BoxGeometry | null = null;   // pas graniczny na dole
let gIKBelt:    THREE.BoxGeometry | null = null;   // pas chumpi
let gIKCollar:  THREE.BoxGeometry | null = null;   // zloty kolnierz
let gIKBand:    THREE.BoxGeometry | null = null;   // opaska llautu
let gIKFeather: THREE.BoxGeometry | null = null;   // pioro standardowe
let gIKPlume:   THREE.BoxGeometry | null = null;   // pioropusz plaski
let gIKDiamond: THREE.BoxGeometry | null = null;   // romb tkacki (rot z 45 st.)
let gIKCheckSq: THREE.BoxGeometry | null = null;   // kratka tokapu
let gIKEarSpool:THREE.BoxGeometry | null = null;   // zloty kolczyk-krazek
// bronie i tarcze
let gIKMaceHaft:THREE.BoxGeometry | null = null;
let gIKMaceRay: THREE.BoxGeometry | null = null;   // ramie gwiazdy (x3 skrzyzowane)
let gIKAxeHaft: THREE.BoxGeometry | null = null;   // DLUGIE stylisko
let gIKAxeSock: THREE.BoxGeometry | null = null;   // osada glowicy
let gIKAxeBlade:THREE.BoxGeometry | null = null;
let gIKAxeEdge: THREE.BoxGeometry | null = null;
let gIKAtlBoard:THREE.BoxGeometry | null = null;   // deska estoliki
let gIKAtlHook: THREE.BoxGeometry | null = null;
let gIKDart:    THREE.BoxGeometry | null = null;
let gIKDartTip: THREE.ConeGeometry | null = null;
let gIKFletch:  THREE.BoxGeometry | null = null;
let gIKCord:    THREE.BoxGeometry | null = null;   // sznur procy
let gIKPouch:   THREE.BoxGeometry | null = null;   // kieszen procy / sakwa
let gIKPellet:  THREE.BoxGeometry | null = null;   // pocisk
let gIKSmallSh: THREE.BoxGeometry | null = null;   // mala kwadratowa tarcza
let gIKShBoss:  THREE.BoxGeometry | null = null;
// chullo topornika
let gIKChullo:  THREE.BoxGeometry | null = null;
let gIKChStripe:THREE.BoxGeometry | null = null;
let gIKChFlap:  THREE.BoxGeometry | null = null;
let gIKChKnob:  THREE.BoxGeometry | null = null;

function getGIKTorso():   THREE.BoxGeometry { return (gIKTorso   ||= new THREE.BoxGeometry(IK_TORSO_W, IK_TORSO_H, IK_TORSO_D)); }
function getGIKNeck():    THREE.BoxGeometry { return (gIKNeck    ||= new THREE.BoxGeometry(0.042 * HEX_R, IK_NECK_H * 1.6, 0.042 * HEX_R)); }
function getGIKHead():    THREE.BoxGeometry { return (gIKHead    ||= new THREE.BoxGeometry(IK_HEAD_S, IK_HEAD_S, IK_HEAD_S)); }
function getGIKEye():     THREE.BoxGeometry { return (gIKEye     ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.014 * HEX_R, 0.008 * HEX_R)); }
function getGIKThigh():   THREE.BoxGeometry { return (gIKThigh   ||= new THREE.BoxGeometry(0.056 * HEX_R, IK_THIGH_L, 0.060 * HEX_R)); }
function getGIKShin():    THREE.BoxGeometry { return (gIKShin    ||= new THREE.BoxGeometry(0.038 * HEX_R, IK_SHIN_L, 0.042 * HEX_R)); }
function getGIKFoot():    THREE.BoxGeometry { return (gIKFoot    ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)); }
function getGIKUpArm():   THREE.BoxGeometry { return (gIKUpArm   ||= new THREE.BoxGeometry(0.054 * HEX_R, IK_UPARM_L, 0.054 * HEX_R)); }
function getGIKForearm(): THREE.BoxGeometry { return (gIKForearm ||= new THREE.BoxGeometry(0.040 * HEX_R, IK_FOREARM_L, 0.040 * HEX_R)); }
function getGIKFist():    THREE.BoxGeometry { return (gIKFist    ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)); }
function getGIKSkirt():   THREE.BoxGeometry { return (gIKSkirt   ||= new THREE.BoxGeometry(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)); }
function getGIKHemBand(): THREE.BoxGeometry { return (gIKHemBand ||= new THREE.BoxGeometry(0.204 * HEX_R, 0.026 * HEX_R, 0.124 * HEX_R)); }
function getGIKBelt():    THREE.BoxGeometry { return (gIKBelt    ||= new THREE.BoxGeometry(0.190 * HEX_R, 0.030 * HEX_R, 0.112 * HEX_R)); }
function getGIKCollar():  THREE.BoxGeometry { return (gIKCollar  ||= new THREE.BoxGeometry(0.150 * HEX_R, 0.020 * HEX_R, 0.106 * HEX_R)); }
function getGIKBand():    THREE.BoxGeometry { return (gIKBand    ||= new THREE.BoxGeometry(0.142 * HEX_R, 0.026 * HEX_R, 0.142 * HEX_R)); }
function getGIKFeather(): THREE.BoxGeometry { return (gIKFeather ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.105 * HEX_R, 0.010 * HEX_R)); }
function getGIKPlume():   THREE.BoxGeometry { return (gIKPlume   ||= new THREE.BoxGeometry(0.014 * HEX_R, 0.080 * HEX_R, 0.024 * HEX_R)); }
function getGIKDiamond(): THREE.BoxGeometry { return (gIKDiamond ||= new THREE.BoxGeometry(0.032 * HEX_R, 0.032 * HEX_R, 0.010 * HEX_R)); }
function getGIKCheckSq(): THREE.BoxGeometry { return (gIKCheckSq ||= new THREE.BoxGeometry(0.036 * HEX_R, 0.046 * HEX_R, 0.011 * HEX_R)); }
function getGIKEarSpool():THREE.BoxGeometry { return (gIKEarSpool||= new THREE.BoxGeometry(0.012 * HEX_R, 0.026 * HEX_R, 0.026 * HEX_R)); }
function getGIKMaceHaft():THREE.BoxGeometry { return (gIKMaceHaft||= new THREE.BoxGeometry(0.026 * HEX_R, 0.300 * HEX_R, 0.026 * HEX_R)); }
function getGIKMaceRay(): THREE.BoxGeometry { return (gIKMaceRay ||= new THREE.BoxGeometry(0.098 * HEX_R, 0.019 * HEX_R, 0.019 * HEX_R)); }
function getGIKAxeHaft(): THREE.BoxGeometry { return (gIKAxeHaft ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.440 * HEX_R, 0.022 * HEX_R)); }
function getGIKAxeSock(): THREE.BoxGeometry { return (gIKAxeSock ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.052 * HEX_R, 0.034 * HEX_R)); }
function getGIKAxeBlade():THREE.BoxGeometry { return (gIKAxeBlade||= new THREE.BoxGeometry(0.016 * HEX_R, 0.058 * HEX_R, 0.110 * HEX_R)); }
function getGIKAxeEdge(): THREE.BoxGeometry { return (gIKAxeEdge ||= new THREE.BoxGeometry(0.012 * HEX_R, 0.048 * HEX_R, 0.030 * HEX_R)); }
function getGIKAtlBoard():THREE.BoxGeometry { return (gIKAtlBoard||= new THREE.BoxGeometry(0.018 * HEX_R, 0.220 * HEX_R, 0.042 * HEX_R)); }
function getGIKAtlHook(): THREE.BoxGeometry { return (gIKAtlHook ||= new THREE.BoxGeometry(0.012 * HEX_R, 0.022 * HEX_R, 0.020 * HEX_R)); }
function getGIKDart():    THREE.BoxGeometry { return (gIKDart    ||= new THREE.BoxGeometry(0.011 * HEX_R, 0.300 * HEX_R, 0.011 * HEX_R)); }
function getGIKDartTip(): THREE.ConeGeometry{ return (gIKDartTip ||= new THREE.ConeGeometry(0.012 * HEX_R, 0.036 * HEX_R, 4)); }
function getGIKFletch():  THREE.BoxGeometry { return (gIKFletch  ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.030 * HEX_R, 0.006 * HEX_R)); }
function getGIKCord():    THREE.BoxGeometry { return (gIKCord    ||= new THREE.BoxGeometry(0.009 * HEX_R, 0.175 * HEX_R, 0.009 * HEX_R)); }
function getGIKPouch():   THREE.BoxGeometry { return (gIKPouch   ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.026 * HEX_R, 0.030 * HEX_R)); }
function getGIKPellet():  THREE.BoxGeometry { return (gIKPellet  ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.026 * HEX_R, 0.026 * HEX_R)); }
function getGIKSmallSh(): THREE.BoxGeometry { return (gIKSmallSh ||= new THREE.BoxGeometry(0.085 * HEX_R, 0.105 * HEX_R, 0.014 * HEX_R)); }
function getGIKShBoss():  THREE.BoxGeometry { return (gIKShBoss  ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.030 * HEX_R, 0.012 * HEX_R)); }
function getGIKChullo():  THREE.BoxGeometry { return (gIKChullo  ||= new THREE.BoxGeometry(0.148 * HEX_R, 0.055 * HEX_R, 0.148 * HEX_R)); }
function getGIKChStripe():THREE.BoxGeometry { return (gIKChStripe||= new THREE.BoxGeometry(0.142 * HEX_R, 0.014 * HEX_R, 0.142 * HEX_R)); }
function getGIKChFlap():  THREE.BoxGeometry { return (gIKChFlap  ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.062 * HEX_R, 0.046 * HEX_R)); }
function getGIKChKnob():  THREE.BoxGeometry { return (gIKChKnob  ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.026 * HEX_R, 0.020 * HEX_R)); }

// ── kinematyka lancuchowa (identyczna z hastati-falangita.ts) ───────────────
function ikDirDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}

function ikSeg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = ikDirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

/** Noga w wykroku: udo + golen + stopa PLASKO na y=0 (sandal = klocek skory). */
function ikBuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  mFoot: THREE.MeshStandardMaterial, hipY: number = IK_HIP_Y,
): void {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = ikSeg(group, getGIKThigh(), mThigh, P, thU, IK_THIGH_L);
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = ikSeg(group, getGIKShin(), mShin, P, thL, IK_SHIN_L);
  const foot = new THREE.Mesh(getGIKFoot(), mFoot);
  foot.position.set(sx, 0.013 * HEX_R, P.z + 0.016 * HEX_R);
  group.add(foot);
}

/** Ramie: bark->lokiec->nadgarstek (+ opcjonalna piesc). BRON NA OSI dloni. */
function ikBuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  let P = new THREE.Vector3(sx, IK_SHLD_Y, 0);
  P = ikSeg(group, getGIKUpArm(), mUp, P, thU, IK_UPARM_L);
  P.y += 0.010 * HEX_R;
  const wrist = ikSeg(group, getGIKForearm(), mFore, P, thF, IK_FOREARM_L);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getGIKFist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(ikDirDown(thF), 0.014 * HEX_R));
    group.add(fist);
  }
  return { wrist, axis: ikDirDown(thF) };
}

/** Korpus: tors-unku + szyja + glowa + oczy (twarze Inkow ODKRYTE — opaski). */
function ikCore(
  group: THREE.Group, mat: MatFactory, mTunic: THREE.MeshStandardMaterial,
  skinColor: number,
): THREE.MeshStandardMaterial {
  const torso = new THREE.Mesh(getGIKTorso(), mTunic);
  torso.position.set(0, IK_TORSO_CTR, 0);
  group.add(torso);
  const mSkin = mat(skinColor, 0.05, 0.80);
  const neck = new THREE.Mesh(getGIKNeck(), mSkin);
  neck.position.set(0, IK_TORSO_TOP + IK_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(getGIKHead(), mSkin);
  head.position.set(0, IK_HEAD_CTR, 0);
  group.add(head);
  const mEye = mat(IK_EYE, 0.02, 0.95);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(getGIKEye(), mEye);
    eye.position.set(sx * 0.028 * HEX_R, IK_HEAD_CTR + 0.008 * HEX_R, IK_HEAD_S * 0.5 + 0.004 * HEX_R);
    group.add(eye);
  }
  return mSkin;
}

/** Dol unku: spodnica + pas graniczny (wzor tkacki) + pas chumpi. */
function ikSkirtSet(
  group: THREE.Group, mSkirt: THREE.MeshStandardMaterial,
  mBorder: THREE.MeshStandardMaterial, mBelt: THREE.MeshStandardMaterial | null,
): void {
  const skirt = new THREE.Mesh(getGIKSkirt(), mSkirt);
  skirt.position.set(0, IK_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const border = new THREE.Mesh(getGIKHemBand(), mBorder);
  border.position.set(0, IK_TORSO_BOT - 0.050 * HEX_R, 0);
  group.add(border);
  if (mBelt !== null) {
    const belt = new THREE.Mesh(getGIKBelt(), mBelt);
    belt.position.set(0, 0.252 * HEX_R, 0);
    group.add(belt);
  }
}

/** Opaska llautu + zwrot pozycji Y srodka opaski. */
function ikHeadband(group: THREE.Group, mBand: THREE.MeshStandardMaterial): number {
  const y = IK_HEAD_CTR + 0.034 * HEX_R;
  const band = new THREE.Mesh(getGIKBand(), mBand);
  band.position.set(0, y, 0);
  group.add(band);
  return y;
}

/** Zlote kolczyki-krazki (orejones) po obu stronach glowy. */
function ikEarSpools(group: THREE.Group, mGold: THREE.MeshStandardMaterial): void {
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(getGIKEarSpool(), mGold);
    e.position.set(sx * (IK_HEAD_S * 0.5 + 0.007 * HEX_R), IK_HEAD_CTR - 0.012 * HEX_R, 0.006 * HEX_R);
    group.add(e);
  }
}

/**
 * Maczuga gwiazdzista NA OSI przedramienia: grupa w piesci, +Y lokalne = os.
 * Gwiazda = 3 SKRZYZOWANE klocki w lokalnej plaszczyznie XZ, PROSTOPADLE
 * do drzewca (talerz wokol trzonka jak w kamiennych glowicach kanana);
 * przy zamachu pionowym talerz jest frontem do kamery izo 52 st.
 */
function ikStarMace(
  group: THREE.Group, fist: THREE.Vector3, thF: number,
  mHaft: THREE.MeshStandardMaterial, mHead: THREE.MeshStandardMaterial,
): void {
  const wg = new THREE.Group();
  wg.position.copy(fist);
  wg.rotation.x = Math.PI - thF;
  const haft = new THREE.Mesh(getGIKMaceHaft(), mHaft);
  haft.position.set(0, 0.100 * HEX_R, 0);
  wg.add(haft);
  for (const az of [0, Math.PI / 3, (2 * Math.PI) / 3]) {
    const ray = new THREE.Mesh(getGIKMaceRay(), mHead);
    ray.rotation.y = az;
    ray.position.set(0, 0.210 * HEX_R, 0);
    wg.add(ray);
  }
  group.add(wg);
}

// ---------------------------------------------------------------------------
// 1. CHASKA — WOJOWNIK Z MACZUGA (Inkowie, Kamien) — POZA ATAKU
// Ochrowe unku z szachownica tokapu (czerwien/turkus), zlota opaska + 3 piora
// (srodek bialy, boki = KOLOR GRACZA), maczuga gwiazdzista z KAMIENNA glowica
// w PRAWEJ (-X) dloni w zamachu znad barku, mala kwadratowa tarcza (pole =
// KOLOR GRACZA, brazowy boss) na LEWYM (+X) przedramieniu, wykrok.
// ---------------------------------------------------------------------------
export function buildMaceWarrior(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mOchre = mat(IK_OCHRE,   0.06, 0.80);
  const mRed   = mat(IK_RED,     0.06, 0.78);
  const mTeal  = mat(IK_TEAL,    0.06, 0.78);
  const mStone = mat(IK_STONE,   0.18, 0.72);
  const mWood  = mat(IK_WOOD,    0.05, 0.85);
  const mFeath = mat(IK_FEATHER, 0.03, 0.92);
  const mOwner = mat(ownerColor_,0.12, 0.68);
  const mLeath = mat(IK_LEATHER, 0.06, 0.82);
  const mGold  = mat(IK_GOLD,    0.50, 0.40);
  const mBronz = mat(IK_BRONZE,  0.40, 0.45);

  const HIP_Y = IK_HIP_Y - 0.010 * HEX_R;

  const mSkin = ikCore(group, mat, mOchre, IK_SKIN_DARK);
  ikSkirtSet(group, mOchre, mTeal, mLeath);
  // szachownica tokapu 2x3 na klatce (czerwien/turkus)
  let ri = 0;
  for (const dy of [0.052, 0.0, -0.052]) {
    let cj = 0;
    for (const dx of [-0.040, 0.040]) {
      const sq = new THREE.Mesh(getGIKCheckSq(), ((ri + cj++) % 2 === 0) ? mRed : mTeal);
      sq.position.set(dx * HEX_R, IK_TORSO_CTR + dy * HEX_R, IK_TORSO_D * 0.5 + 0.006 * HEX_R);
      group.add(sq);
    }
    ri++;
  }

  // nogi: LEWA (+X) wykroczna, PRAWA (-X) zakroczna; sandaly skorzane
  ikBuildLeg(group,  IK_HIP_X,  0.55,  0.30, mOchre, mSkin, mLeath, HIP_Y);
  ikBuildLeg(group, -IK_HIP_X, -0.50, -0.18, mOchre, mSkin, mLeath, HIP_Y);

  // NAKRYCIE GLOWY: zlota opaska + 3 piora (bok=KOLOR GRACZA, srodek bialy)
  ikHeadband(group, mGold);
  for (const [fx, rz, col] of [[-0.048, 0.26, mOwner], [0.0, 0.0, mFeath], [0.048, -0.26, mOwner]] as [number, number, THREE.MeshStandardMaterial][]) {
    const f = new THREE.Mesh(getGIKFeather(), col);
    f.rotation.z = rz;
    f.position.set(fx * HEX_R + Math.sin(rz) * 0.020 * HEX_R, IK_HEAD_TOP + 0.055 * HEX_R, -0.006 * HEX_R);
    group.add(f);
  }

  // PRAWE (-X) RAMIE + MACZUGA: zamach szczytowy — reka pionowo w gore,
  // kamienna gwiazda-talerz WYSOKO nad glowa, lekko w przod
  const armR = ikBuildArm(group, -IK_SHLD_X, -2.60, 2.75, mOchre, mSkin, mSkin);
  const fist = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  ikStarMace(group, fist, 2.75, mWood, mStone);

  // LEWE (+X) RAMIE + MALA TARCZA przed korpusem (pole = KOLOR GRACZA)
  const armL = ikBuildArm(group, IK_SHLD_X, 0.50, 1.10, mOchre, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(armL.wrist.x - 0.012 * HEX_R, armL.wrist.y + 0.026 * HEX_R, armL.wrist.z + 0.034 * HEX_R);
  sh.rotation.y = -0.18;
  const face = new THREE.Mesh(getGIKSmallSh(), mOwner);
  sh.add(face);
  const boss = new THREE.Mesh(getGIKShBoss(), mBronz);
  boss.position.set(0, 0, 0.010 * HEX_R);
  sh.add(boss);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// 2. ESTOLICA — OSZCZEPNIK Z MIOTACZEM (Inkowie, Kamien) — POZA ATAKU
// Gest zamachu atlatlem: prawa reka wysoko w tyl, deska miotacza NA OSI
// przedramienia, strzalka zaparta o haczyk celuje w przod-gore; w LEWEJ
// piesci 2 zapasowe strzalki. Ochrowe unku, rzad rombow (turkus/czerwien),
// zloty kolnierz, pas dolny = KOLOR GRACZA, czerwone llautu + pioropusz
// KOLORU GRACZA. Gleboki wykrok.
// ---------------------------------------------------------------------------
export function buildInkaJavelineer(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mOchre = mat(IK_OCHRE,    0.05, 0.86);
  const mRed   = mat(IK_RED,      0.06, 0.78);
  const mTeal  = mat(IK_TEAL,     0.06, 0.78);
  const mWood  = mat(IK_WOOD,     0.05, 0.85);
  const mBronz = mat(IK_BRONZE,   0.40, 0.48);
  const mOwner = mat(ownerColor_, 0.10, 0.68);
  const mGold  = mat(IK_GOLD,     0.45, 0.40);
  const mBand  = mat(IK_RED_BAND, 0.05, 0.75);
  const mLeath = mat(IK_LEATHER,  0.06, 0.82);

  const HIP_Y = IK_HIP_Y - 0.012 * HEX_R;

  const mSkin = ikCore(group, mat, mOchre, IK_SKIN);
  ikSkirtSet(group, mOchre, mOwner, mLeath);     // pas dolny = KOLOR GRACZA (jak stary)
  // zloty kolnierz + rzad rombow tkackich na klatce
  const col = new THREE.Mesh(getGIKCollar(), mGold);
  col.position.set(0, IK_TORSO_TOP - 0.010 * HEX_R, 0);
  group.add(col);
  let di = 0;
  for (const dx of [-0.052, 0.0, 0.052]) {
    const d = new THREE.Mesh(getGIKDiamond(), (di++ === 1) ? mRed : mTeal);
    d.rotation.z = Math.PI / 4;
    d.position.set(dx * HEX_R, IK_TORSO_CTR + 0.006 * HEX_R, IK_TORSO_D * 0.5 + 0.006 * HEX_R);
    group.add(d);
  }

  // nogi: gleboki wykrok miotacza (LEWA wykroczna)
  ikBuildLeg(group,  IK_HIP_X,  0.62,  0.36, mOchre, mSkin, mLeath, HIP_Y);
  ikBuildLeg(group, -IK_HIP_X, -0.55, -0.22, mOchre, mSkin, mLeath, HIP_Y);

  // NAKRYCIE GLOWY: czerwone llautu + plaski pioropusz KOLORU GRACZA
  ikHeadband(group, mBand);
  const plume = new THREE.Mesh(getGIKPlume(), mOwner);
  plume.position.set(0, IK_HEAD_TOP + 0.042 * HEX_R, -0.004 * HEX_R);
  group.add(plume);

  // PRAWE (-X) RAMIE + ATLATL W ZAMACHU: lokiec nad barkiem w tyl, deska na
  // osi przedramienia, strzalka na haczyku celuje w przod-gore (+Z)
  const armR = ikBuildArm(group, -IK_SHLD_X, -2.35, 1.95, mOchre, mSkin, mSkin);
  const thF = 1.95;
  const fist = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  const wg = new THREE.Group();
  wg.position.copy(fist);
  wg.rotation.x = Math.PI - thF;
  const board = new THREE.Mesh(getGIKAtlBoard(), mWood);
  board.position.set(0, 0.060 * HEX_R, 0.006 * HEX_R);
  wg.add(board);
  const hook = new THREE.Mesh(getGIKAtlHook(), mBronz);
  hook.position.set(0, 0.162 * HEX_R, 0.016 * HEX_R);
  wg.add(hook);
  group.add(wg);
  // strzalka (dart) w przestrzeni swiata: ogon na haczyku, grot ku wrogowi
  const DART_A = 1.00;                                  // stromy kat wyrzutu (czytelny przy izo 52)
  const dartDir = new THREE.Vector3(0, Math.sin(DART_A), Math.cos(DART_A));
  const tail = fist.clone().addScaledVector(armR.axis, 0.162 * HEX_R);
  tail.z += 0.018 * HEX_R;
  const dartRotX = Math.atan2(dartDir.z, dartDir.y);
  const dart = new THREE.Mesh(getGIKDart(), mWood);
  dart.rotation.x = dartRotX;
  dart.position.copy(tail.clone().addScaledVector(dartDir, 0.145 * HEX_R));
  group.add(dart);
  const dtip = new THREE.Mesh(getGIKDartTip(), mBronz);
  dtip.rotation.x = dartRotX;
  dtip.rotation.y = Math.PI / 4;
  dtip.position.copy(tail.clone().addScaledVector(dartDir, 0.308 * HEX_R));
  group.add(dtip);
  const fl = new THREE.Mesh(getGIKFletch(), mFeatherOf(mat));
  fl.rotation.x = dartRotX;
  fl.position.copy(tail.clone().addScaledVector(dartDir, 0.022 * HEX_R));
  group.add(fl);

  // LEWE (+X) RAMIE: piesc trzyma 2 zapasowe strzalki pionowo
  const armL = ikBuildArm(group, IK_SHLD_X, 0.30, 0.85, mOchre, mSkin, mSkin);
  const fistL = armL.wrist.clone().addScaledVector(armL.axis, 0.014 * HEX_R);
  for (const dx of [-0.011, 0.011]) {
    const sd = new THREE.Mesh(getGIKDart(), mWood);
    sd.rotation.x = -0.10;
    sd.position.set(fistL.x + dx * HEX_R, fistL.y + 0.040 * HEX_R, fistL.z - 0.004 * HEX_R);
    group.add(sd);
  }

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

/** Biale pioro lotki — maly helper, zeby nie dublowac materialu. */
function mFeatherOf(mat: MatFactory): THREE.MeshStandardMaterial {
  return mat(IK_FEATHER, 0.03, 0.92);
}

// ---------------------------------------------------------------------------
// 3. WOJOWNIK Z TOPOREM (Inkowie, Braz) — POZA ATAKU
// Burgundowe unku z ochrowym pasem i rombami, czapka CHULLO z nausznikami
// (ochra + turkusowy pasek) + pioro KOLORU GRACZA, TOPOR BRAZOWY NA DLUGIM
// STYLISKU w PRAWEJ (-X) dloni w zamachu ciecia (ostrze ku wrogowi w dol),
// mala kwadratowa tarcza (pole = KOLOR GRACZA) na LEWYM (+X) przedramieniu.
// ---------------------------------------------------------------------------
export function buildAxeWarriorInka(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mBurg  = mat(IK_BURGUNDY, 0.05, 0.82);
  const mOchre = mat(IK_OCHRE,    0.06, 0.80);
  const mTeal  = mat(IK_TEAL,     0.06, 0.78);
  const mBronz = mat(IK_BRONZE,   0.48, 0.40);
  const mBronL = mat(IK_BRONZE_LT,0.54, 0.32);
  const mWood  = mat(IK_WOOD,     0.05, 0.85);
  const mOwner = mat(ownerColor_, 0.12, 0.68);
  const mLeath = mat(IK_LEATHER,  0.06, 0.82);

  const HIP_Y = IK_HIP_Y - 0.012 * HEX_R;

  const mSkin = ikCore(group, mat, mBurg, IK_SKIN_DARK);
  ikSkirtSet(group, mBurg, mOchre, mLeath);
  // ochrowy pas poziomy na klatce + 3 burgundowe romby na pasie
  const band = new THREE.Mesh(getGIKBelt(), mOchre);   // reuzycie klocka pasa
  band.scale.set(0.98, 1.30, 0.96);
  band.position.set(0, IK_TORSO_CTR + 0.036 * HEX_R, 0);
  group.add(band);
  for (const dx of [-0.048, 0.0, 0.048]) {
    const d = new THREE.Mesh(getGIKDiamond(), mBurg);
    d.rotation.z = Math.PI / 4;
    d.scale.set(0.78, 0.78, 1.0);
    d.position.set(dx * HEX_R, IK_TORSO_CTR + 0.036 * HEX_R, IK_TORSO_D * 0.5 + 0.008 * HEX_R);
    group.add(d);
  }

  // nogi: wykrok rabiacego
  ikBuildLeg(group,  IK_HIP_X,  0.60,  0.35, mBurg, mSkin, mLeath, HIP_Y);
  ikBuildLeg(group, -IK_HIP_X, -0.55, -0.20, mBurg, mSkin, mLeath, HIP_Y);

  // NAKRYCIE GLOWY: CHULLO (ochra, turkusowy pasek, nauszniki, guzik)
  const cap = new THREE.Mesh(getGIKChullo(), mOchre);
  cap.position.set(0, IK_HEAD_TOP - 0.004 * HEX_R, 0);
  group.add(cap);
  const stripe = new THREE.Mesh(getGIKChStripe(), mTeal);
  stripe.position.set(0, IK_HEAD_TOP - 0.026 * HEX_R, 0);
  group.add(stripe);
  for (const sx of [-1, 1]) {
    const flap = new THREE.Mesh(getGIKChFlap(), mOchre);
    flap.position.set(sx * (IK_HEAD_S * 0.5 + 0.006 * HEX_R), IK_HEAD_CTR - 0.024 * HEX_R, 0.004 * HEX_R);
    group.add(flap);
  }
  const knob = new THREE.Mesh(getGIKChKnob(), mTeal);
  knob.position.set(0, IK_HEAD_TOP + 0.032 * HEX_R, 0);
  group.add(knob);
  // pioro KOLORU GRACZA za chullo
  const f = new THREE.Mesh(getGIKFeather(), mOwner);
  f.rotation.z = 0.18;
  f.position.set(0.016 * HEX_R, IK_HEAD_TOP + 0.082 * HEX_R, -0.012 * HEX_R);
  group.add(f);

  // PRAWE (-X) RAMIE + TOPOR NA DLUGIM STYLISKU: zamach, ostrze w przod-dol
  const thF = 2.62;
  const armR = ikBuildArm(group, -IK_SHLD_X, -2.40, thF, mBurg, mSkin, mSkin);
  const fist = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  const wg = new THREE.Group();
  wg.position.copy(fist);
  wg.rotation.x = Math.PI - thF;
  const haft = new THREE.Mesh(getGIKAxeHaft(), mWood);
  haft.position.set(0, 0.140 * HEX_R, 0);
  wg.add(haft);
  const sock = new THREE.Mesh(getGIKAxeSock(), mBronz);
  sock.position.set(0, 0.300 * HEX_R, 0);
  wg.add(sock);
  const blade = new THREE.Mesh(getGIKAxeBlade(), mBronz);
  blade.position.set(0, 0.300 * HEX_R, 0.064 * HEX_R);
  wg.add(blade);
  const edge = new THREE.Mesh(getGIKAxeEdge(), mBronL);
  edge.position.set(0, 0.300 * HEX_R, 0.126 * HEX_R);
  wg.add(edge);
  group.add(wg);

  // LEWE (+X) RAMIE + MALA TARCZA (pole = KOLOR GRACZA)
  const armL = ikBuildArm(group, IK_SHLD_X, 0.50, 1.10, mBurg, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(armL.wrist.x - 0.012 * HEX_R, armL.wrist.y + 0.026 * HEX_R, armL.wrist.z + 0.034 * HEX_R);
  sh.rotation.y = -0.18;
  const face = new THREE.Mesh(getGIKSmallSh(), mOwner);
  sh.add(face);
  const boss = new THREE.Mesh(getGIKShBoss(), mBronL);
  boss.position.set(0, 0, 0.010 * HEX_R);
  sh.add(boss);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// 4. PROCARZ HUARACOC (Inkowie, Braz) — POZA ATAKU
// Huaraca w ZAMACHU NAD GLOWA: prawa reka wyprostowana w gore, dwa sznury
// poziomo od piesci do kieszeni z kamieniem (wir nad glowa); lewa reka
// WSKAZUJE cel. Ochrowe unku, 2 romby, zloty kolnierz i kolczyki-krazki,
// czerwone llautu + biale piorko, sakwa na biodrze (klapka = KOLOR GRACZA),
// pas dolny = KOLOR GRACZA. Szeroki zakrok (napiecie przed wyrzutem).
// ---------------------------------------------------------------------------
export function buildInkaSlinger(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mOchre = mat(IK_OCHRE,    0.05, 0.86);
  const mRed   = mat(IK_RED,      0.06, 0.78);
  const mTeal  = mat(IK_TEAL,     0.06, 0.78);
  const mStone = mat(0x8a857c,    0.05, 0.95);
  const mOwner = mat(ownerColor_, 0.08, 0.70);
  const mGold  = mat(IK_GOLD,     0.45, 0.40);
  const mBand  = mat(IK_RED_BAND, 0.05, 0.75);
  const mLeath = mat(IK_LEATHER,  0.05, 0.85);
  const mStrap = mat(0x7a5034,    0.05, 0.85);
  const mFeath = mat(IK_FEATHER,  0.03, 0.92);

  const HIP_Y = IK_HIP_Y - 0.008 * HEX_R;

  const mSkin = ikCore(group, mat, mOchre, IK_SKIN);
  ikSkirtSet(group, mOchre, mOwner, mLeath);     // pas dolny = KOLOR GRACZA (jak stary)
  const col = new THREE.Mesh(getGIKCollar(), mGold);
  col.position.set(0, IK_TORSO_TOP - 0.010 * HEX_R, 0);
  group.add(col);
  let di = 0;
  for (const dx of [-0.032, 0.032]) {
    const d = new THREE.Mesh(getGIKDiamond(), (di++ === 0) ? mRed : mTeal);
    d.rotation.z = Math.PI / 4;
    d.position.set(dx * HEX_R, IK_TORSO_CTR + 0.008 * HEX_R, IK_TORSO_D * 0.5 + 0.006 * HEX_R);
    group.add(d);
  }

  // nogi: szeroki zakrok procarza (ciezar na tylnej PRAWEJ)
  ikBuildLeg(group,  IK_HIP_X,  0.35,  0.20, mOchre, mSkin, mLeath, HIP_Y);
  ikBuildLeg(group, -IK_HIP_X, -0.60, -0.28, mOchre, mSkin, mLeath, HIP_Y);

  // NAKRYCIE GLOWY: czerwone llautu + biale piorko z tylu + zlote kolczyki
  ikHeadband(group, mBand);
  const f = new THREE.Mesh(getGIKFeather(), mFeath);
  f.scale.set(0.8, 0.72, 1.0);
  f.rotation.x = -0.35;
  f.position.set(0, IK_HEAD_TOP + 0.036 * HEX_R, -0.052 * HEX_R);
  group.add(f);
  ikEarSpools(group, mGold);

  // PRAWE (-X) RAMIE WYPROSTOWANE W GORE + HUARACA W WIRZE POZIOMYM
  const armR = ikBuildArm(group, -IK_SHLD_X, -2.85, 3.05, mOchre, mSkin, mSkin);
  const fist = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  const W = new THREE.Vector3(0.92, 0, -0.39).normalize();    // kierunek wiru (w lewo-bok, widoczny)
  const YUP = new THREE.Vector3(0, 1, 0);
  const pouchP = fist.clone().addScaledVector(W, 0.175 * HEX_R);
  for (const dy of [-0.006, 0.006]) {
    const cord = new THREE.Mesh(getGIKCord(), mStrap);
    cord.quaternion.setFromUnitVectors(YUP, W);
    cord.position.copy(fist.clone().addScaledVector(W, 0.0875 * HEX_R));
    cord.position.y += dy * HEX_R;
    group.add(cord);
  }
  const pouch = new THREE.Mesh(getGIKPouch(), mLeath);
  pouch.quaternion.setFromUnitVectors(YUP, W);
  pouch.position.copy(pouchP);
  group.add(pouch);
  const pellet = new THREE.Mesh(getGIKPellet(), mStone);
  pellet.position.copy(pouchP.clone().addScaledVector(W, 0.014 * HEX_R));
  group.add(pellet);

  // LEWE (+X) RAMIE WSKAZUJE CEL (wyprostowane w przod)
  ikBuildArm(group, IK_SHLD_X, 1.55, 1.55, mOchre, mSkin, mSkin);

  // sakwa z pociskami na LEWYM biodrze (klapka = KOLOR GRACZA)
  const hip = new THREE.Mesh(getGIKPouch(), mLeath);
  hip.scale.set(1.15, 1.5, 1.2);
  hip.position.set(IK_TORSO_W * 0.5 + 0.016 * HEX_R, IK_TORSO_BOT - 0.020 * HEX_R, 0.020 * HEX_R);
  group.add(hip);
  const flap = new THREE.Mesh(getGIKShBoss(), mOwner);
  flap.scale.set(1.2, 0.9, 0.8);
  hipFlapPlace(flap, group);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

/** Klapka sakwy na biodrze (KOLOR GRACZA) — pozycja wspolna. */
function hipFlapPlace(flap: THREE.Mesh, group: THREE.Group): void {
  flap.position.set(IK_TORSO_W * 0.5 + 0.016 * HEX_R, IK_TORSO_BOT + 0.004 * HEX_R, 0.028 * HEX_R);
  group.add(flap);
}
