/**
 * jednostki-p57-wlocznie-machiny.ts — PACZKA 5+7/8: WLOCZNICY PER-CIV (2) + MACHINY (2)
 * ---------------------------------------------------------------------------
 * Zamienniki 1:1 dla starych tokenow z gra-robocza/srcKopiaMaster/render/units.ts:
 *   buildImpi(ownerColor)             -> units.ts:1835 (dispatch :1148 'impi'), BRAZ
 *   buildSumerianSpearman(ownerColor) -> units.ts:1992 (dispatch :1151), BRAZ
 *   buildBatteringRam(ownerColor)     -> units.ts:3747 (dispatch :1168 + fallback :5830), KAMIEN
 *   buildSiegeTower(ownerColor)       -> units.ts:3973 (dispatch :1170), BRAZ
 * Interfejs i konwencje BEZ ZMIAN (rodzina hastati-falangita.ts):
 *   - token PRZODEM do +Z, podstawa na y = 0, humanoid ~0.55*HEX_R,
 *   - uklad prawoskretny: LEWA reka = +X (tarcza), PRAWA = -X (bron),
 *   - group.userData['mats'] i ['perTokenGeos'] jak w units.ts,
 *   - geometrie wspolne = singletony modulu (perTokenGeos puste),
 *   - anatomia lancuchowa wmSeg/wmBuildLeg/wmBuildArm = niSeg/niBuildLeg/
 *     niBuildArm (hastati-falangita.ts), bron NA OSI DLONI.
 *
 * IMPI (Zulu, braz) — POZA: dynamiczny WYPAD z iklwa (pchniecie podreczne).
 *   Wielka owalna tarcza nguni (isihlangu, laciata bydleca bialo-brazowa,
 *   pionowe drzewce mgobo z futrzana kitka) na LEWYM przedramieniu; krotka
 *   assegai iklwa (szeroki lisc) w PRAWEJ na osi dloni; isicoco (czarny
 *   piercien) + 2 piora zurawia; spodnica futrzana isinene (klapa przednia
 *   = KOLOR GRACZA jak stary sash); amashoba (biale kity bydlece) na
 *   ramionach i lydkach; nagi tors. Kolor gracza: klapa + romb na tarczy.
 *
 * WLOCZNIK SUMERYJSKI (braz) — POZA: SCIANA TARCZ (defensywno-pchajaca).
 *   WIELKA prostokatna tarcza pelnej wysokosci (dol ~przy ziemi, pole =
 *   KOLOR GRACZA jak stara + brazowe listwy i nity) przed lewym bokiem;
 *   wlocznia POZIOMA nad gorna krawedzia tarczy w PRAWEJ na osi dloni;
 *   kaunakes frędzlowy (3 rzedy + zabki); helm stozkowy MIEDZIANY z nosalem
 *   i nakarcznikiem; czarna kwadratowa broda (Sumer); tunika teal jak stara.
 *
 * TARAN (kamien, machina) — prymitywny, W ROZPEDZIE (kloda wychylona +Z,
 *   liny pochylone). Gruba kloda z KAMIENNYM lbem (4-katny ostroslup sciety)
 *   na rzemieniach, koziol z belek (nogi A + kalenica) na PELNYCH DREWNIANYCH
 *   KRAZKACH, dach ze SKOR (patchwork 2 odcienie) na 4 zerdziach, zwis skory
 *   z tylu. Kolor gracza: proporczyk na kalenicy + tarczka na burcie.
 *
 * WIEZA OBLEZNICZA (braz, machina) — wysoka wieza na 4 PELNYCH kolach,
 *   3 kondygnacje (ciemne belki narozne + jasniejsze panele plecionki),
 *   mostek zrzutowy u gory LEKKO UCHYLONY (~25 stopni od pionu) z linami,
 *   TARCZE zawieszone na burtach (2 w kolorze gracza, 2 skorzane),
 *   proporzec gracza na szczycie, otwor wejsciowy z tylu.
 *
 * Gabaryty machin vs stare (token bez skalowania w dispatchu):
 *   taran  stary ~0.31x0.39x0.42 -> nowy ~0.33x0.45x0.44 (+8..15%),
 *   wieza  stara ~0.34x0.54(0.66 z flaga)x0.31 -> nowa ~0.33x0.58(0.72)x0.29.
 * Budzet: Impi ~450 tri, Sumer ~420 tri (humanoid <=460);
 *   taran ~600 tri, wieza ~680 tri (machiny <=700).
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

// ── kolory serii (paleta units.ts + skory/miedz/kamien) ─────────────────────
const WM_SKIN_ZULU  = 0xb06030;   // ciepla ciemna skora (jak stary Impi)
const WM_SKIN       = 0xe0ac69;
const WM_BRONZE     = 0xcf9234;
const WM_BRONZE_LT  = 0xd0a050;
const WM_COPPER     = 0xb87333;   // helm miedziany Sumeru
const WM_STEEL      = 0xc2cad2;
const WM_WOOD       = 0x7a5c3a;
const WM_WOOD_DK    = 0x4a3018;
const WM_PLANKS     = 0x8a6840;
const WM_WICKER     = 0xc9a066;   // plecionka wiezy
const WM_LEATHER    = 0x6b4a28;
const WM_HIDE_RED   = 0x8a3a26;   // laty bydlece
const WM_HIDE_WHT   = 0xe8ddc4;   // biala siersc nguni
const WM_FUR        = 0x5a3c20;   // futro isinene
const WM_FUR_LT     = 0x7a5230;
const WM_TEAL       = 0x1f7a78;   // tunika Sumeru (jak stara)
const WM_FLEECE     = 0xd8c8a0;   // kaunakes
const WM_STONE      = 0x8a8e94;   // kamienny leb taranu
const WM_ROPE       = 0x9a8060;
const WM_BLACK      = 0x171310;
const WM_CRANE_WHT  = 0xf0ece0;   // piora zurawia

// ── wymiary sylwetki (rodzina NI_* z hastati-falangita.ts) ──────────────────
const WM_HIP_Y     = 0.208 * HEX_R;
const WM_TORSO_W   = 0.180 * HEX_R;
const WM_TORSO_H   = 0.205 * HEX_R;
const WM_TORSO_D   = 0.100 * HEX_R;
const WM_TORSO_BOT = 0.240 * HEX_R;
const WM_TORSO_CTR = WM_TORSO_BOT + WM_TORSO_H * 0.5;
const WM_TORSO_TOP = WM_TORSO_BOT + WM_TORSO_H;
const WM_NECK_H    = 0.028 * HEX_R;
const WM_HEAD_S    = 0.128 * HEX_R;
const WM_HEAD_CTR  = WM_TORSO_TOP + WM_NECK_H + WM_HEAD_S * 0.5;
const WM_HEAD_TOP  = WM_TORSO_TOP + WM_NECK_H + WM_HEAD_S;
const WM_SHLD_X    = WM_TORSO_W * 0.5 + 0.030 * HEX_R;
const WM_SHLD_Y    = WM_TORSO_TOP - 0.024 * HEX_R;
const WM_HIP_X     = 0.052 * HEX_R;

const WM_THIGH_L   = 0.104 * HEX_R;
const WM_SHIN_L    = 0.096 * HEX_R;
const WM_UPARM_L   = 0.100 * HEX_R;
const WM_FOREARM_L = 0.092 * HEX_R;

// ── geometrie-singletony ─────────────────────────────────────────────────────
let gWMTorso:   THREE.BoxGeometry | null = null;
let gWMNeck:    THREE.BoxGeometry | null = null;
let gWMHead:    THREE.BoxGeometry | null = null;
let gWMThigh:   THREE.BoxGeometry | null = null;
let gWMShin:    THREE.BoxGeometry | null = null;
let gWMFoot:    THREE.BoxGeometry | null = null;
let gWMUpArm:   THREE.BoxGeometry | null = null;
let gWMForearm: THREE.BoxGeometry | null = null;
let gWMFist:    THREE.BoxGeometry | null = null;
let gWMSkirt:   THREE.BoxGeometry | null = null;
// Impi
let gWMShoba:   THREE.BoxGeometry | null = null;    // kita amashoba
let gWMIsicoco: THREE.CylinderGeometry | null = null;
let gWMFeather: THREE.BoxGeometry | null = null;
let gWMFringe:  THREE.BoxGeometry | null = null;    // fredzel futra
let gWMNguniShell: THREE.BufferGeometry | null = null;
let gWMNguniFace:  THREE.BufferGeometry | null = null;
let gWMPatchBig:   THREE.BoxGeometry | null = null;
let gWMPatchSm:    THREE.BoxGeometry | null = null;
let gWMMgobo:   THREE.BoxGeometry | null = null;    // drzewce tarczy
let gWMMgoboTuft: THREE.BoxGeometry | null = null;
let gWMDiamond: THREE.BoxGeometry | null = null;    // romb gracza
let gWMIklwaShaft: THREE.BoxGeometry | null = null;
let gWMIklwaBlade: THREE.BoxGeometry | null = null;
let gWMIklwaTip:   THREE.ConeGeometry | null = null;
let gWMNecklace:   THREE.BoxGeometry | null = null;
// Sumer
let gWMConeHelm: THREE.CylinderGeometry | null = null;
let gWMNoseG:   THREE.BoxGeometry | null = null;
let gWMNeckG:   THREE.BoxGeometry | null = null;
let gWMBeard:   THREE.BoxGeometry | null = null;
let gWMFleeceRow1: THREE.BoxGeometry | null = null;
let gWMFleeceRow2: THREE.BoxGeometry | null = null;
let gWMFleeceRow3: THREE.BoxGeometry | null = null;
let gWMFleeceTab:  THREE.BoxGeometry | null = null;
let gWMPauldron:   THREE.BoxGeometry | null = null;
let gWMTowerFace:  THREE.BoxGeometry | null = null;
let gWMTowerBack:  THREE.BoxGeometry | null = null;
let gWMTowerBar:   THREE.BoxGeometry | null = null;
let gWMStud:    THREE.BoxGeometry | null = null;
let gWMSpearShaft: THREE.BoxGeometry | null = null;
let gWMSpearTip:   THREE.ConeGeometry | null = null;
let gWMSpearButt:  THREE.BoxGeometry | null = null;

function getGWMTorso():   THREE.BoxGeometry { return (gWMTorso   ||= new THREE.BoxGeometry(WM_TORSO_W, WM_TORSO_H, WM_TORSO_D)); }
function getGWMNeck():    THREE.BoxGeometry { return (gWMNeck    ||= new THREE.BoxGeometry(0.042 * HEX_R, WM_NECK_H * 1.6, 0.042 * HEX_R)); }
function getGWMHead():    THREE.BoxGeometry { return (gWMHead    ||= new THREE.BoxGeometry(WM_HEAD_S, WM_HEAD_S, WM_HEAD_S)); }
function getGWMThigh():   THREE.BoxGeometry { return (gWMThigh   ||= new THREE.BoxGeometry(0.056 * HEX_R, WM_THIGH_L, 0.060 * HEX_R)); }
function getGWMShin():    THREE.BoxGeometry { return (gWMShin    ||= new THREE.BoxGeometry(0.038 * HEX_R, WM_SHIN_L, 0.042 * HEX_R)); }
function getGWMFoot():    THREE.BoxGeometry { return (gWMFoot    ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)); }
function getGWMUpArm():   THREE.BoxGeometry { return (gWMUpArm   ||= new THREE.BoxGeometry(0.054 * HEX_R, WM_UPARM_L, 0.054 * HEX_R)); }
function getGWMForearm(): THREE.BoxGeometry { return (gWMForearm ||= new THREE.BoxGeometry(0.040 * HEX_R, WM_FOREARM_L, 0.040 * HEX_R)); }
function getGWMFist():    THREE.BoxGeometry { return (gWMFist    ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)); }
function getGWMSkirt():   THREE.BoxGeometry { return (gWMSkirt   ||= new THREE.BoxGeometry(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)); }
function getGWMShoba():   THREE.BoxGeometry { return (gWMShoba   ||= new THREE.BoxGeometry(0.062 * HEX_R, 0.046 * HEX_R, 0.062 * HEX_R)); }
function getGWMIsicoco(): THREE.CylinderGeometry { return (gWMIsicoco ||= new THREE.CylinderGeometry(0.052 * HEX_R, 0.058 * HEX_R, 0.026 * HEX_R, 8, 1, true)); }
function getGWMFeather(): THREE.BoxGeometry { return (gWMFeather ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.130 * HEX_R, 0.010 * HEX_R)); }
function getGWMFringe():  THREE.BoxGeometry { return (gWMFringe  ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.052 * HEX_R, 0.014 * HEX_R)); }
function getGWMPatchBig():THREE.BoxGeometry { return (gWMPatchBig||= new THREE.BoxGeometry(0.052 * HEX_R, 0.088 * HEX_R, 0.010 * HEX_R)); }
function getGWMPatchSm(): THREE.BoxGeometry { return (gWMPatchSm ||= new THREE.BoxGeometry(0.040 * HEX_R, 0.052 * HEX_R, 0.010 * HEX_R)); }
function getGWMMgobo():   THREE.BoxGeometry { return (gWMMgobo   ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.500 * HEX_R, 0.016 * HEX_R)); }
function getGWMMgoboTuft():THREE.BoxGeometry{ return (gWMMgoboTuft||= new THREE.BoxGeometry(0.026 * HEX_R, 0.052 * HEX_R, 0.026 * HEX_R)); }
function getGWMDiamond(): THREE.BoxGeometry { return (gWMDiamond ||= new THREE.BoxGeometry(0.040 * HEX_R, 0.040 * HEX_R, 0.010 * HEX_R)); }
function getGWMIklwaShaft(): THREE.BoxGeometry { return (gWMIklwaShaft ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.240 * HEX_R, 0.018 * HEX_R)); }
function getGWMIklwaBlade(): THREE.BoxGeometry { return (gWMIklwaBlade ||= new THREE.BoxGeometry(0.036 * HEX_R, 0.090 * HEX_R, 0.012 * HEX_R)); }
function getGWMIklwaTip(): THREE.ConeGeometry { return (gWMIklwaTip ||= new THREE.ConeGeometry(0.016 * HEX_R, 0.044 * HEX_R, 4)); }
function getGWMNecklace(): THREE.BoxGeometry { return (gWMNecklace ||= new THREE.BoxGeometry(0.150 * HEX_R, 0.022 * HEX_R, 0.085 * HEX_R)); }
function getGWMConeHelm(): THREE.CylinderGeometry { return (gWMConeHelm ||= new THREE.CylinderGeometry(0.018 * HEX_R, 0.090 * HEX_R, 0.125 * HEX_R, 8, 1)); }
function getGWMNoseG():   THREE.BoxGeometry { return (gWMNoseG   ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.058 * HEX_R, 0.016 * HEX_R)); }
function getGWMNeckG():   THREE.BoxGeometry { return (gWMNeckG   ||= new THREE.BoxGeometry(0.120 * HEX_R, 0.040 * HEX_R, 0.020 * HEX_R)); }
function getGWMBeard():   THREE.BoxGeometry { return (gWMBeard   ||= new THREE.BoxGeometry(0.084 * HEX_R, 0.052 * HEX_R, 0.024 * HEX_R)); }
function getGWMFleeceRow1(): THREE.BoxGeometry { return (gWMFleeceRow1 ||= new THREE.BoxGeometry(0.206 * HEX_R, 0.034 * HEX_R, 0.134 * HEX_R)); }
function getGWMFleeceRow2(): THREE.BoxGeometry { return (gWMFleeceRow2 ||= new THREE.BoxGeometry(0.198 * HEX_R, 0.034 * HEX_R, 0.130 * HEX_R)); }
function getGWMFleeceRow3(): THREE.BoxGeometry { return (gWMFleeceRow3 ||= new THREE.BoxGeometry(0.190 * HEX_R, 0.034 * HEX_R, 0.126 * HEX_R)); }
function getGWMFleeceTab(): THREE.BoxGeometry { return (gWMFleeceTab ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.030 * HEX_R, 0.012 * HEX_R)); }
function getGWMPauldron(): THREE.BoxGeometry { return (gWMPauldron ||= new THREE.BoxGeometry(0.066 * HEX_R, 0.026 * HEX_R, 0.108 * HEX_R)); }
function getGWMTowerFace(): THREE.BoxGeometry { return (gWMTowerFace ||= new THREE.BoxGeometry(0.170 * HEX_R, 0.340 * HEX_R, 0.014 * HEX_R)); }
function getGWMTowerBack(): THREE.BoxGeometry { return (gWMTowerBack ||= new THREE.BoxGeometry(0.184 * HEX_R, 0.354 * HEX_R, 0.012 * HEX_R)); }
function getGWMTowerBar(): THREE.BoxGeometry { return (gWMTowerBar ||= new THREE.BoxGeometry(0.184 * HEX_R, 0.024 * HEX_R, 0.010 * HEX_R)); }
function getGWMStud():    THREE.BoxGeometry { return (gWMStud    ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.024 * HEX_R, 0.010 * HEX_R)); }
function getGWMSpearShaft(): THREE.BoxGeometry { return (gWMSpearShaft ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.600 * HEX_R, 0.019 * HEX_R)); }
function getGWMSpearTip(): THREE.ConeGeometry { return (gWMSpearTip ||= new THREE.ConeGeometry(0.019 * HEX_R, 0.058 * HEX_R, 4)); }
function getGWMSpearButt(): THREE.BoxGeometry { return (gWMSpearButt ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.030 * HEX_R, 0.024 * HEX_R)); }

// ── owalna skorupa tarczy nguni (jak scutum hastati: fasetowana elipsa) ─────
function wmOvalRing(a: number, b: number, c: number, N: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(ang) * a, y = Math.sin(ang) * b;
    pts.push([x, y, -c * (x / a) * (x / a)]);
  }
  return pts;
}

function wmOvalShell(a: number, b: number, c: number, t: number, N: number): THREE.BufferGeometry {
  const ring = wmOvalRing(a, b, c, N);
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

function wmOvalFace(a: number, b: number, c: number, N: number): THREE.BufferGeometry {
  const ring = wmOvalRing(a, b, c, N);
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

function getGWMNguniShell(): THREE.BufferGeometry { return (gWMNguniShell ||= wmOvalShell(0.088 * HEX_R, 0.205 * HEX_R, 0.030 * HEX_R, 0.014 * HEX_R, 10)); }
function getGWMNguniFace():  THREE.BufferGeometry { return (gWMNguniFace  ||= wmOvalFace(0.076 * HEX_R, 0.180 * HEX_R, 0.022 * HEX_R, 10)); }

// ── anatomia lancuchowa (identyczna konwencja co hastati-falangita.ts) ──────
function wmDirDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}

function wmSeg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = wmDirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

/** Noga w wykroku; zwraca punkt kolana i kostki (do dekoracji amashoba). */
function wmBuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  mFoot: THREE.MeshStandardMaterial, hipY: number = WM_HIP_Y,
): { knee: THREE.Vector3; ankle: THREE.Vector3 } {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = wmSeg(group, getGWMThigh(), mThigh, P, thU, WM_THIGH_L);
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  const knee = P.clone();
  const ankle = wmSeg(group, getGWMShin(), mShin, P, thL, WM_SHIN_L);
  const foot = new THREE.Mesh(getGWMFoot(), mFoot);
  foot.position.set(sx, 0.013 * HEX_R, ankle.z + 0.016 * HEX_R);
  group.add(foot);
  return { knee, ankle };
}

/** Ramie; zwraca nadgarstek i os przedramienia (BRON ZAWSZE NA TEJ OSI). */
function wmBuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  let P = new THREE.Vector3(sx, WM_SHLD_Y, 0);
  P = wmSeg(group, getGWMUpArm(), mUp, P, thU, WM_UPARM_L);
  P.y += 0.010 * HEX_R;
  const wrist = wmSeg(group, getGWMForearm(), mFore, P, thF, WM_FOREARM_L);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getGWMFist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(wmDirDown(thF), 0.014 * HEX_R));
    group.add(fist);
  }
  return { wrist, axis: wmDirDown(thF) };
}

/** Wspolny korpus: tors + szyja + glowa. */
function wmBuildCore(
  group: THREE.Group, mat: MatFactory, mTorso: THREE.MeshStandardMaterial,
  skinColor: number = WM_SKIN,
): void {
  const torso = new THREE.Mesh(getGWMTorso(), mTorso);
  torso.position.set(0, WM_TORSO_CTR, 0);
  group.add(torso);
  const mSkin = mat(skinColor, 0.05, 0.80);
  const neck = new THREE.Mesh(getGWMNeck(), mSkin);
  neck.position.set(0, WM_TORSO_TOP + WM_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(getGWMHead(), mSkin);
  head.position.set(0, WM_HEAD_CTR, 0);
  group.add(head);
}

// ---------------------------------------------------------------------------
// IMPI (Zulu, BRAZ) — ~460 tri, POZA: dynamiczny wypad z iklwa
// Nagi tors (ciemna skora), isicoco + 2 piora zurawia, spodnica futrzana
// (klapa przednia = KOLOR GRACZA), amashoba na ramionach i lydkach, WIELKA
// owalna tarcza nguni (biala w brazowe laty, drzewce mgobo z kitka, romb
// gracza) na LEWYM (+X) przedramieniu, krotka iklwa w PRAWEJ (-X) na osi
// dloni — pchniecie podreczne. Stopy na y = 0.
// ---------------------------------------------------------------------------
export function buildImpi(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin  = mat(WM_SKIN_ZULU, 0.05, 0.80);
  const mFur   = mat(WM_FUR,       0.04, 0.92);
  const mFurLt = mat(WM_FUR_LT,    0.04, 0.90);
  const mWhite = mat(WM_HIDE_WHT,  0.03, 0.90);
  const mHide  = mat(WM_HIDE_RED,  0.04, 0.88);
  const mLeath = mat(WM_LEATHER,   0.05, 0.84);
  const mOwner = mat(ownerColor_,  0.10, 0.68);
  const mWood  = mat(WM_WOOD,      0.05, 0.85);
  const mBronz = mat(WM_BRONZE,    0.40, 0.48);
  const mBlack = mat(WM_BLACK,     0.04, 0.90);
  const mCrane = mat(WM_CRANE_WHT, 0.03, 0.88);

  const HIP_Y = WM_HIP_Y - 0.014 * HEX_R;   // gleboki wypad

  // korpus: NAGI tors (skora)
  wmBuildCore(group, mat, mSkin, WM_SKIN_ZULU);

  // spodnica futrzana isinene + przednia klapa w KOLORZE GRACZA + fredzle
  const skirt = new THREE.Mesh(getGWMSkirt(), mFur);
  skirt.position.set(0, WM_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const flap = new THREE.Mesh(getGWMFringe(), mOwner);
  flap.scale.set(1.30, 1.35, 1.0);
  flap.position.set(0, WM_TORSO_BOT - 0.046 * HEX_R, 0.062 * HEX_R);
  group.add(flap);
  for (const sx of [-1, 1]) {               // futrzane fredzle po bokach klapy
    const fr = new THREE.Mesh(getGWMFringe(), mFurLt);
    fr.position.set(sx * 0.066 * HEX_R, WM_TORSO_BOT - 0.042 * HEX_R, 0.056 * HEX_R);
    group.add(fr);
  }

  // nogi (nagie): LEWA (+X) wykroczna, PRAWA (-X) zakroczna + amashoba lydek
  const legL = wmBuildLeg(group,  WM_HIP_X,  0.66,  0.40, mSkin, mSkin, mSkin, HIP_Y);
  const legR = wmBuildLeg(group, -WM_HIP_X, -0.58, -0.24, mSkin, mSkin, mSkin, HIP_Y);
  for (const [leg, thL] of [[legL, 0.40], [legR, -0.24]] as [ { knee: THREE.Vector3 }, number ][]) {
    const shoba = new THREE.Mesh(getGWMShoba(), mWhite);
    shoba.rotation.x = Math.PI - thL;
    shoba.position.copy(leg.knee.clone().addScaledVector(wmDirDown(thL), 0.034 * HEX_R));
    group.add(shoba);
  }

  // isicoco (czarny piercien) + 2 piora zurawia
  const coco = new THREE.Mesh(getGWMIsicoco(), mBlack);
  coco.position.set(0, WM_HEAD_TOP + 0.008 * HEX_R, 0);
  group.add(coco);
  for (const s of [-1, 1]) {
    const f = new THREE.Mesh(getGWMFeather(), mCrane);
    f.rotation.z = s * 0.14;
    f.rotation.x = -0.10;
    f.position.set(s * 0.022 * HEX_R, WM_HEAD_TOP + 0.078 * HEX_R, -0.024 * HEX_R);
    group.add(f);
  }

  // PRAWE (-X) RAMIE + IKLWA: pchniecie podreczne, klinga NA OSI przedramienia
  const armR = wmBuildArm(group, -WM_SHLD_X, 1.00, 1.52, mSkin, mSkin, mSkin);
  const shR = new THREE.Mesh(getGWMShoba(), mWhite);        // amashoba ramienia
  shR.rotation.x = Math.PI - 1.00;
  shR.position.set(-WM_SHLD_X, WM_SHLD_Y - 0.030 * HEX_R, 0.030 * HEX_R);
  group.add(shR);
  const ax = armR.axis;
  const shaft = new THREE.Mesh(getGWMIklwaShaft(), mWood);
  shaft.rotation.x = Math.PI - 1.52;
  shaft.position.copy(armR.wrist.clone().addScaledVector(ax, 0.055 * HEX_R));
  group.add(shaft);
  const blade = new THREE.Mesh(getGWMIklwaBlade(), mBronz);  // szeroki lisc iklwa
  blade.rotation.x = Math.PI - 1.52;
  blade.position.copy(armR.wrist.clone().addScaledVector(ax, 0.225 * HEX_R));
  group.add(blade);
  const tip = new THREE.Mesh(getGWMIklwaTip(), mBronz);
  tip.rotation.x = Math.PI - 1.52;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(armR.wrist.clone().addScaledVector(ax, 0.295 * HEX_R));
  group.add(tip);

  // LEWE (+X) RAMIE + TARCZA NGUNI przed korpusem + amashoba ramienia
  const armL = wmBuildArm(group, WM_SHLD_X, 0.50, 1.05, mSkin, mSkin, null);
  const shL = new THREE.Mesh(getGWMShoba(), mWhite);
  shL.rotation.x = Math.PI - 0.50;
  shL.position.set(WM_SHLD_X, WM_SHLD_Y - 0.036 * HEX_R, 0.018 * HEX_R);
  group.add(shL);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.022 * HEX_R,
    armL.wrist.y + 0.030 * HEX_R,
    armL.wrist.z + 0.042 * HEX_R,
  );
  sh.rotation.y = -0.18;
  const shell = new THREE.Mesh(getGWMNguniShell(), mLeath);  // rant + plecy
  sh.add(shell);
  const face = new THREE.Mesh(getGWMNguniFace(), mWhite);    // biala siersc
  face.position.set(0, 0, 0.010 * HEX_R);
  sh.add(face);
  // brazowe LATY bydlece (2 duze + 1 mala) — laciata krowa nguni
  const p1 = new THREE.Mesh(getGWMPatchBig(), mHide);
  p1.rotation.z = 0.30;
  p1.position.set(-0.030 * HEX_R, 0.088 * HEX_R, 0.016 * HEX_R);
  sh.add(p1);
  const p2 = new THREE.Mesh(getGWMPatchBig(), mHide);
  p2.rotation.z = -0.42;
  p2.position.set(0.026 * HEX_R, -0.086 * HEX_R, 0.016 * HEX_R);
  sh.add(p2);
  const p3 = new THREE.Mesh(getGWMPatchSm(), mHide);
  p3.rotation.z = 0.55;
  p3.position.set(0.040 * HEX_R, 0.020 * HEX_R, 0.016 * HEX_R);
  sh.add(p3);
  // romb KOLORU GRACZA w centrum
  const dia = new THREE.Mesh(getGWMDiamond(), mOwner);
  dia.rotation.z = Math.PI / 4;
  dia.position.set(0, 0, 0.020 * HEX_R);
  sh.add(dia);
  // drzewce mgobo (za tarcza, konce wystaja gora/dol) + futrzana kitka
  const mgobo = new THREE.Mesh(getGWMMgobo(), mWood);
  mgobo.position.set(0, 0.010 * HEX_R, -0.014 * HEX_R);
  sh.add(mgobo);
  const tuft = new THREE.Mesh(getGWMMgoboTuft(), mFurLt);
  tuft.position.set(0, 0.278 * HEX_R, -0.014 * HEX_R);
  sh.add(tuft);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// WLOCZNIK SUMERYJSKI (BRAZ) — ~450 tri, POZA: SCIANA TARCZ
// Tunika teal (jak stara), kaunakes fredzlowy (3 rzedy + zabki), naramienniki
// skorzane, helm stozkowy MIEDZIANY z nosalem i nakarcznikiem, czarna broda.
// WIELKA prostokatna tarcza pelnej wysokosci (pole = KOLOR GRACZA, listwy +
// nity brazowe) przed LEWYM bokiem, dol tuz nad ziemia; wlocznia POZIOMA
// nad gorna krawedzia tarczy w PRAWEJ (-X) na osi dloni (lokiec uniesiony).
// ---------------------------------------------------------------------------
export function buildSumerianSpearman(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mTeal   = mat(WM_TEAL,      0.05, 0.85);
  const mFleece = mat(WM_FLEECE,    0.04, 0.96);
  const mCopper = mat(WM_COPPER,    0.45, 0.42);
  const mBronze = mat(WM_BRONZE,    0.42, 0.45);
  const mBronzL = mat(WM_BRONZE_LT, 0.50, 0.38);
  const mWood   = mat(WM_WOOD,      0.05, 0.85);
  const mOwner  = mat(ownerColor_,  0.12, 0.66);
  const mLeath  = mat(WM_LEATHER,   0.06, 0.82);
  const mSkin   = mat(WM_SKIN,      0.05, 0.80);
  const mBlack  = mat(WM_BLACK,     0.04, 0.90);

  const HIP_Y = WM_HIP_Y - 0.006 * HEX_R;   // lekki wykrok — mur tarcz

  // korpus: tunika teal + skorzane naramienniki
  wmBuildCore(group, mat, mTeal);
  for (const sx of [-1, 1]) {
    const pd = new THREE.Mesh(getGWMPauldron(), mLeath);
    pd.position.set(sx * 0.062 * HEX_R, WM_TORSO_TOP - 0.004 * HEX_R, 0);
    group.add(pd);
  }

  // kaunakes: 3 rzedy runa + zabki fredzli na dole przodu
  const rows: [THREE.BoxGeometry, number][] = [
    [getGWMFleeceRow1(), WM_TORSO_BOT - 0.010 * HEX_R],
    [getGWMFleeceRow2(), WM_TORSO_BOT - 0.044 * HEX_R],
    [getGWMFleeceRow3(), WM_TORSO_BOT - 0.078 * HEX_R],
  ];
  for (const [geo, fy] of rows) {
    const r = new THREE.Mesh(geo, mFleece);
    r.position.set(0, fy, 0);
    group.add(r);
  }
  for (const sx of [-0.056, 0.0, 0.056]) {
    const tab = new THREE.Mesh(getGWMFleeceTab(), mFleece);
    tab.position.set(sx * HEX_R, WM_TORSO_BOT - 0.106 * HEX_R, 0.050 * HEX_R);
    group.add(tab);
  }

  // nogi: lekki wykrok (mur stoi) — golenie nagie, stopy skorzane sandaly
  wmBuildLeg(group,  WM_HIP_X,  0.26,  0.10, mTeal, mSkin, mLeath, HIP_Y);
  wmBuildLeg(group, -WM_HIP_X, -0.26, -0.08, mTeal, mSkin, mLeath, HIP_Y);

  // HELM stozkowy MIEDZIANY + nosal + nakarcznik + czarna broda kwadratowa
  const helm = new THREE.Mesh(getGWMConeHelm(), mCopper);
  helm.position.set(0, WM_HEAD_CTR + 0.040 * HEX_R, 0);
  group.add(helm);
  const nose = new THREE.Mesh(getGWMNoseG(), mBronzL);
  nose.position.set(0, WM_HEAD_CTR - 0.008 * HEX_R, WM_HEAD_S * 0.5 + 0.006 * HEX_R);
  group.add(nose);
  const neckG = new THREE.Mesh(getGWMNeckG(), mCopper);
  neckG.rotation.x = -0.38;
  neckG.position.set(0, WM_HEAD_CTR - 0.020 * HEX_R, -(WM_HEAD_S * 0.5 + 0.010 * HEX_R));
  group.add(neckG);
  const beard = new THREE.Mesh(getGWMBeard(), mBlack);
  beard.position.set(0, WM_HEAD_CTR - 0.052 * HEX_R, WM_HEAD_S * 0.5 - 0.004 * HEX_R);
  group.add(beard);

  // PRAWE (-X) RAMIE + WLOCZNIA POZIOMA nad krawedzia tarczy (lokiec uniesiony)
  const armR = wmBuildArm(group, -WM_SHLD_X, 1.24, 1.58, mTeal, mSkin, mSkin);
  const ax = armR.axis;
  const shaft = new THREE.Mesh(getGWMSpearShaft(), mWood);
  shaft.rotation.x = Math.PI - 1.58;
  shaft.position.copy(armR.wrist.clone().addScaledVector(ax, 0.060 * HEX_R));
  group.add(shaft);
  const tip = new THREE.Mesh(getGWMSpearTip(), mBronze);
  tip.rotation.x = Math.PI - 1.58;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(armR.wrist.clone().addScaledVector(ax, 0.405 * HEX_R));
  group.add(tip);
  const butt = new THREE.Mesh(getGWMSpearButt(), mBronzL);
  butt.rotation.x = Math.PI - 1.58;
  butt.position.copy(armR.wrist.clone().addScaledVector(ax, -0.255 * HEX_R));
  group.add(butt);

  // LEWE (+X) RAMIE za WIELKA PROSTOKATNA TARCZA (frontem — sciana tarcz)
  wmBuildArm(group, WM_SHLD_X, 0.42, 0.98, mTeal, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(0.130 * HEX_R, 0.195 * HEX_R, 0.105 * HEX_R);
  const back = new THREE.Mesh(getGWMTowerBack(), mWood);     // deska nosna
  back.position.set(0, 0, -0.008 * HEX_R);
  sh.add(back);
  const face = new THREE.Mesh(getGWMTowerFace(), mOwner);    // POLE = KOLOR GRACZA
  sh.add(face);
  for (const fy of [-0.092, 0.092]) {                        // listwy brazowe
    const bar = new THREE.Mesh(getGWMTowerBar(), mBronze);
    bar.position.set(0, fy * HEX_R, 0.008 * HEX_R);
    sh.add(bar);
  }
  for (const fy of [-0.030, 0.030, 0.150]) {                 // nity w osi
    const st = new THREE.Mesh(getGWMStud(), mBronzL);
    st.rotation.z = Math.PI / 4;
    st.position.set(0, fy * HEX_R, 0.009 * HEX_R);
    sh.add(st);
  }
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ── geometrie machin: cache po wymiarach (singletony wspolne miedzy tokenami) ─
const wmBoxCache = new Map<string, THREE.BoxGeometry>();
function wmBox(w: number, h: number, d: number): THREE.BoxGeometry {
  const k = w + '|' + h + '|' + d;
  let g = wmBoxCache.get(k);
  if (!g) { g = new THREE.BoxGeometry(w * HEX_R, h * HEX_R, d * HEX_R); wmBoxCache.set(k, g); }
  return g;
}
const wmCylCache = new Map<string, THREE.CylinderGeometry>();
function wmCyl(rt: number, rb: number, h: number, seg: number, open = false): THREE.CylinderGeometry {
  const k = rt + '|' + rb + '|' + h + '|' + seg + '|' + (open ? 1 : 0);
  let g = wmCylCache.get(k);
  if (!g) { g = new THREE.CylinderGeometry(rt * HEX_R, rb * HEX_R, h * HEX_R, seg, 1, open); wmCylCache.set(k, g); }
  return g;
}

// ---------------------------------------------------------------------------
// TARAN (KAMIEN, machina) — ~600 tri, POZA: W ROZPEDZIE
// Prymitywny koziol belkowy na PELNYCH DREWNIANYCH KRAZKACH; gruba kloda
// z KAMIENNYM lbem (4-katny ostroslup sciety) na rzemieniach, WYCHYLONA ku
// +Z (liny pochylone); dach ze skor (patchwork 2 odcienie) na 4 zerdziach,
// zwis skory z tylu. KOLOR GRACZA: proporczyk na kalenicy + tarczka na
// prawej burcie. Front = +Z, podstawa kol na y = 0.
// ---------------------------------------------------------------------------
export function buildBatteringRam(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mWood   = mat(WM_WOOD,    0.06, 0.82);
  const mDkWood = mat(WM_WOOD_DK, 0.04, 0.88);
  const mPlank  = mat(WM_PLANKS,  0.05, 0.80);
  const mHideA  = mat(0x9a6a42,   0.04, 0.92);   // skora jasna
  const mHideB  = mat(0x7a5232,   0.04, 0.92);   // skora ciemna
  const mLeath  = mat(WM_LEATHER, 0.05, 0.88);
  const mStone  = mat(WM_STONE,   0.08, 0.85);
  const mRope   = mat(WM_ROPE,    0.04, 0.90);
  const mOwner  = mat(ownerColor_, 0.12, 0.70);

  // pelne drewniane KRAZKI (4) + piasty + osie
  for (const wz of [-0.115, 0.115]) {
    for (const wx of [-0.150, 0.150]) {
      const w = new THREE.Mesh(wmCyl(0.056, 0.056, 0.032, 8), mPlank);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx * HEX_R, 0.056 * HEX_R, wz * HEX_R);
      group.add(w);
      const hub = new THREE.Mesh(wmBox(0.022, 0.022, 0.022), mDkWood);
      hub.position.set(Math.sign(wx) * 0.168 * HEX_R, 0.056 * HEX_R, wz * HEX_R);
      group.add(hub);
    }
    const axle = new THREE.Mesh(wmBox(0.340, 0.026, 0.026), mDkWood);
    axle.position.set(0, 0.056 * HEX_R, wz * HEX_R);
    group.add(axle);
  }

  // rama: 2 belki wzdluzne + 2 poprzeczki
  for (const sx of [-0.115, 0.115]) {
    const beam = new THREE.Mesh(wmBox(0.036, 0.032, 0.360), mWood);
    beam.position.set(sx * HEX_R, 0.092 * HEX_R, 0);
    group.add(beam);
  }
  for (const sz of [-0.148, 0.148]) {
    const cross = new THREE.Mesh(wmBox(0.266, 0.028, 0.036), mWood);
    cross.position.set(0, 0.092 * HEX_R, sz * HEX_R);
    group.add(cross);
  }

  // koziol: 2 pary nog A + kalenica nosna
  for (const sz of [-0.120, 0.120]) {
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(wmBox(0.028, 0.250, 0.028), mDkWood);
      leg.rotation.z = -s * 0.46;
      leg.position.set(s * 0.054 * HEX_R, 0.204 * HEX_R, sz * HEX_R);
      group.add(leg);
    }
  }
  const ridge = new THREE.Mesh(wmBox(0.034, 0.034, 0.340), mWood);
  ridge.position.set(0, 0.322 * HEX_R, 0);
  group.add(ridge);

  // KLODA W ROZPEDZIE (wychylona ku +Z) + rzemienie + KAMIENNY LEB
  const ram = new THREE.Mesh(wmCyl(0.032, 0.032, 0.280, 8), mDkWood);
  ram.rotation.x = Math.PI / 2;
  ram.position.set(0, 0.212 * HEX_R, 0.035 * HEX_R);
  group.add(ram);
  for (const rz of [-0.020, 0.125]) {
    const strap = new THREE.Mesh(wmCyl(0.037, 0.037, 0.018, 6, true), mLeath);
    strap.rotation.x = Math.PI / 2;
    strap.position.set(0, 0.212 * HEX_R, rz * HEX_R);
    group.add(strap);
  }
  const head = new THREE.Mesh(wmCyl(0.026, 0.056, 0.095, 4), mStone);
  head.rotation.x = Math.PI / 2;
  head.rotation.y = Math.PI / 4;
  head.position.set(0, 0.212 * HEX_R, 0.2105 * HEX_R);
  group.add(head);

  // liny zawieszenia (4, pochylone — kloda w wychyle)
  for (const zt of [-0.075, 0.0, 0.075, 0.150]) {
    const rope = new THREE.Mesh(wmBox(0.012, 0.088, 0.012), mRope);
    rope.rotation.x = 0.40;
    rope.position.set(0, 0.283 * HEX_R, (zt + 0.017) * HEX_R);
    group.add(rope);
  }

  // 4 zerdzie + dach ze skor (patchwork 2x2) + kalenica + zwis z tylu
  for (const sx of [-0.132, 0.132]) {
    for (const sz of [-0.140, 0.140]) {
      const pole = new THREE.Mesh(wmBox(0.024, 0.270, 0.024), mWood);
      pole.position.set(sx * HEX_R, 0.227 * HEX_R, sz * HEX_R);
      group.add(pole);
    }
  }
  for (const s of [-1, 1]) {
    for (const sz of [-0.090, 0.090]) {
      const hide = (s * sz > 0) ? mHideA : mHideB;   // szachownica odcieni
      const roof = new THREE.Mesh(wmBox(0.190, 0.016, 0.180), hide);
      roof.rotation.z = -s * 0.466;
      roof.position.set(s * 0.0825 * HEX_R, 0.4035 * HEX_R, sz * HEX_R);
      group.add(roof);
    }
  }
  const roofRidge = new THREE.Mesh(wmBox(0.036, 0.030, 0.370), mDkWood);
  roofRidge.position.set(0, 0.448 * HEX_R, 0);
  group.add(roofRidge);
  const drape = new THREE.Mesh(wmBox(0.200, 0.055, 0.014), mHideB);
  drape.rotation.x = 0.15;
  drape.position.set(0, 0.335 * HEX_R, -0.185 * HEX_R);
  group.add(drape);

  // KOLOR GRACZA: proporczyk na kalenicy + tarczka na prawej burcie
  const mast = new THREE.Mesh(wmBox(0.012, 0.110, 0.012), mWood);
  mast.position.set(0, 0.503 * HEX_R, -0.170 * HEX_R);
  group.add(mast);
  const flag = new THREE.Mesh(wmBox(0.070, 0.045, 0.008), mOwner);
  flag.position.set(0.041 * HEX_R, 0.532 * HEX_R, -0.170 * HEX_R);
  group.add(flag);
  const buckler = new THREE.Mesh(wmCyl(0.040, 0.040, 0.012, 6), mOwner);
  buckler.rotation.z = Math.PI / 2;
  buckler.position.set(0.146 * HEX_R, 0.300 * HEX_R, 0.020 * HEX_R);
  group.add(buckler);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// WIEZA OBLEZNICZA (BRAZ, machina) — ~680 tri
// Wysoka wieza na 4 PELNYCH kolach: 3 kondygnacje (ciemne slupy narozne +
// jasniejsze panele plecionki + gzymsy), podest z parapetem, MOSTEK ZRZUTOWY
// LEKKO UCHYLONY (~25 stopni od pionu) z 2 linami, TARCZE na burtach
// (2 przednie = KOLOR GRACZA, 2 tylne skorzane), otwor wejsciowy z tylu,
// proporzec gracza na szczycie. Front = +Z, kola na y = 0.
// ---------------------------------------------------------------------------
export function buildSiegeTower(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mWood   = mat(WM_WOOD,    0.06, 0.82);
  const mDkWood = mat(WM_WOOD_DK, 0.04, 0.88);
  const mWicker = mat(WM_WICKER,  0.05, 0.86);
  const mPlank  = mat(WM_PLANKS,  0.05, 0.80);
  const mLeath  = mat(WM_LEATHER, 0.05, 0.88);
  const mDark   = mat(0x241708,   0.03, 0.95);
  const mOwner  = mat(ownerColor_, 0.12, 0.70);

  // 4 PELNE kola + piasty + 2 osie
  for (const wz of [-0.110, 0.110]) {
    for (const wx of [-0.148, 0.148]) {
      const w = new THREE.Mesh(wmCyl(0.060, 0.060, 0.034, 8), mPlank);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx * HEX_R, 0.060 * HEX_R, wz * HEX_R);
      group.add(w);
      const hub = new THREE.Mesh(wmBox(0.022, 0.022, 0.022), mDkWood);
      hub.position.set(Math.sign(wx) * 0.168 * HEX_R, 0.060 * HEX_R, wz * HEX_R);
      group.add(hub);
    }
    const axle = new THREE.Mesh(wmBox(0.336, 0.028, 0.028), mDkWood);
    axle.position.set(0, 0.060 * HEX_R, wz * HEX_R);
    group.add(axle);
  }

  // platforma podwozia
  const base = new THREE.Mesh(wmBox(0.280, 0.030, 0.250), mWood);
  base.position.set(0, 0.105 * HEX_R, 0);
  group.add(base);

  // 3 kondygnacje: panele plecionki (przod/tyl/boki) — korpus smukly
  for (let k = 0; k < 3; k++) {
    const y0 = (0.120 + k * 0.140) * HEX_R;
    for (const sz of [-1, 1]) {
      const wall = new THREE.Mesh(wmBox(0.230, 0.135, 0.016), mWicker);
      wall.position.set(0, y0 + 0.0675 * HEX_R, sz * 0.105 * HEX_R);
      group.add(wall);
    }
    for (const sx of [-1, 1]) {
      const wall = new THREE.Mesh(wmBox(0.016, 0.135, 0.210), mWicker);
      wall.position.set(sx * 0.107 * HEX_R, y0 + 0.0675 * HEX_R, 0);
      group.add(wall);
    }
  }
  // 4 slupy narozne pelnej wysokosci + 2 gzymsy (jasne deski)
  for (const sx of [-0.117, 0.117]) {
    for (const sz of [-0.107, 0.107]) {
      const post = new THREE.Mesh(wmBox(0.030, 0.450, 0.030), mDkWood);
      post.position.set(sx * HEX_R, 0.345 * HEX_R, sz * HEX_R);
      group.add(post);
    }
  }
  for (const gy of [0.258, 0.398]) {
    const trim = new THREE.Mesh(wmBox(0.270, 0.018, 0.245), mPlank);
    trim.position.set(0, gy * HEX_R, 0);
    group.add(trim);
  }

  // podest gorny NADWIESZONY (machikuly) + parapet (przedni nizszy — widoczny mostek)
  const deck = new THREE.Mesh(wmBox(0.262, 0.024, 0.240), mPlank);
  deck.position.set(0, 0.547 * HEX_R, 0);
  group.add(deck);
  const parF = new THREE.Mesh(wmBox(0.262, 0.036, 0.016), mWood);
  parF.position.set(0, 0.577 * HEX_R, 0.112 * HEX_R);
  group.add(parF);
  const parB = new THREE.Mesh(wmBox(0.262, 0.056, 0.016), mWood);
  parB.position.set(0, 0.587 * HEX_R, -0.112 * HEX_R);
  group.add(parB);
  for (const sx of [-0.123, 0.123]) {
    const par = new THREE.Mesh(wmBox(0.016, 0.056, 0.240), mWood);
    par.position.set(sx * HEX_R, 0.587 * HEX_R, 0);
    group.add(par);
  }

  // MOSTEK ZRZUTOWY lekko uchylony (~25 stopni od pionu) + 2 liny
  const ramp = new THREE.Mesh(wmBox(0.170, 0.014, 0.190), mPlank);
  ramp.rotation.x = -1.134;
  ramp.position.set(0, 0.646 * HEX_R, 0.160 * HEX_R);
  group.add(ramp);
  for (const sx of [-0.064, 0.064]) {
    const rope = new THREE.Mesh(wmBox(0.010, 0.100, 0.010), mLeath);
    rope.rotation.x = 0.62;
    rope.position.set(sx * HEX_R, 0.672 * HEX_R, 0.165 * HEX_R);
    group.add(rope);
  }

  // TARCZE gracza zawieszone na burtach (po 1 na kazda burte)
  for (const sx of [-1, 1]) {
    const sh = new THREE.Mesh(wmCyl(0.048, 0.048, 0.012, 6), mOwner);
    sh.rotation.z = Math.PI / 2;
    sh.position.set(sx * 0.122 * HEX_R, 0.420 * HEX_R, 0.025 * HEX_R);
    group.add(sh);
  }

  // szczeliny strzeleckie z przodu (kondygnacje 1-2)
  for (const py of [0.335, 0.475]) {
    const port = new THREE.Mesh(wmBox(0.056, 0.018, 0.012), mDark);
    port.position.set(0, py * HEX_R, 0.114 * HEX_R);
    group.add(port);
  }

  // otwor wejsciowy z tylu + 2 ukosne belki usztywniajace
  const door = new THREE.Mesh(wmBox(0.090, 0.110, 0.012), mDark);
  door.position.set(0, 0.180 * HEX_R, -0.114 * HEX_R);
  group.add(door);
  for (const s of [-1, 1]) {
    const brace = new THREE.Mesh(wmBox(0.024, 0.190, 0.020), mWood);
    brace.rotation.z = s * 0.60;
    brace.position.set(0, 0.330 * HEX_R, -0.116 * HEX_R);
    group.add(brace);
  }

  // proporzec gracza na szczycie
  const mast = new THREE.Mesh(wmBox(0.013, 0.170, 0.013), mWood);
  mast.position.set(-0.060 * HEX_R, 0.660 * HEX_R, -0.060 * HEX_R);
  group.add(mast);
  const flag = new THREE.Mesh(wmBox(0.100, 0.056, 0.008), mOwner);
  flag.position.set(-0.002 * HEX_R, 0.714 * HEX_R, -0.060 * HEX_R);
  group.add(flag);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}
