/**
 * jednostki-p8a-bliskiwschod.ts — PACZKA 8a/8: BLISKI WSCHOD (4), epoka BRAZU
 * ---------------------------------------------------------------------------
 * Bespoke modele dla 4 jednostek per-civ, ktore DZIS renderuja sie jako jeden
 * generyk buildCategoryModel('domyslny') (units.ts case default ~:5732 —
 * indygo tunika + wlocznia + mala tarcza):
 *   buildPiechotaHetycka(ownerColor)    "Piechota hetycka"    (Hetyci, wlocznia)
 *   buildGwardiaIshtar(ownerColor)      "Gwardia Ishtar"      (Babilonia, wlocznia, elita)
 *   buildWojownikBabilonski(ownerColor) "Wojownik babilonski" (Babilonia, miecz sierpowy)
 *   buildWojownikFenicki(ownerColor)    "Wojownik fenicki"    (Fenicjanie, wlocznia)
 *
 * Interfejs i konwencje BEZ ZMIAN (rodzina hastati-falangita.ts / p4-melee):
 *   - figurka PRZODEM do +Z, stopy na y = 0, wysokosc ~0.55*HEX_R,
 *   - uklad prawoskretny: LEWA reka = +X (TARCZA), PRAWA = -X (BRON),
 *   - group.userData['mats'] i ['perTokenGeos'] jak w units.ts,
 *   - geometrie wspolne = singletony modulu (perTokenGeos puste),
 *   - anatomia lancuchowa bwSeg/bwBuildLeg/bwBuildArm = niSeg/niBuildLeg/
 *     niBuildArm (hastati-falangita.ts), BRON NA OSI DLONI, POZY ATAKU.
 *
 * ROZROZNIALNOSC KULTUR (dyspozycja paczki):
 *   HETYTA    — helm stozkowy z OPADAJACYM pioropuszem + nauszniki, tarcza
 *               OSEMKOWA (hetycka, pole = kolor gracza), kremowa tunika krotka
 *               + szeroki pas, BUTY Z ZADARTYMI NOSKAMI, pchniecie podreczne.
 *   ISHTAR    — elita Babilonu: LAZURYT + ZLOTO, tarcza okragla ze zlotym polem
 *               i GWIAZDA ISZTAR (8 promieni = KOLOR GRACZA), wlocznia z ozdobnym
 *               grotem (zlota tuleja + sauroter), helm zloty z krotkim grzebieniem,
 *               BRODA KRECONA KLOCKOWO (3 rzedy), pchniecie NADRECZNE.
 *   BABILON   — MIECZ SIERPOWY (sappara) z brazu w ciosie z gory, tarcza okragla
 *               skromniejsza (pole = kolor gracza, drewniany rant), tunika CEGLASTA
 *               z lamowka w ZIGZAG MURU (kremowe merlony), helm stozkowy, broda.
 *   FENICJANIN— PURPUROWA tunika (barwnik Tyru), tarcza okragla z ROZETA fenicka
 *               (lniane platki na polu gracza), helm POLKULISTY z krotka kita,
 *               przy pasie ZWOJ LINY + SAKWA kupiecka, pchniecie podreczne plaskie.
 *
 * KOLOR GRACZA (spojny nosnik serii): POLE tarczy (hetyta, babilonczyk,
 * fenicjanin) / GWIAZDA + RANT tarczy (Ishtar — pole zlote, elitarne) + SZARFA
 * skosna na torsie (wszyscy czterej).
 *
 * POZY ATAKU (kazda inna): hetyta pchniecie podreczne grot lekko W GORE;
 * Ishtar nadreczne grot w dol (lokiec nad barkiem); babilonczyk CIOS sierpowcem
 * z gory (ramie wzniesione); fenicjanin pchniecie podreczne PLASKIE (poziome).
 * Wykrok: biodra obnizone 0.010-0.012, stopy na y=0.
 *
 * Budzet: <=~460 tri na figurke — realnie patrz raport paczki (countTri).
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

// ── kolory serii (paleta units.ts + barwy Bliskiego Wschodu) ────────────────
const BW_SKIN      = 0xe0ac69;
const BW_BRONZE    = 0xcf9234;
const BW_BRONZE_LT = 0xd0a050;
const BW_GOLD      = 0xd8b040;
const BW_WOOD      = 0x7a5c3a;
const BW_LEATHER   = 0x6b4a28;
const BW_LEATHER_DK= 0x53381e;
const BW_LINEN     = 0xe8e0c8;   // tunika hetycka (anatolijski len)
const BW_LAPIS     = 0x2450a0;   // lazuryt — Gwardia Ishtar
const BW_LAPIS_DK  = 0x1a3c7e;
const BW_BRICK     = 0x9c4a2e;   // cegla mulowa — wojownik babilonski
const BW_CREAM     = 0xe6d9b8;   // merlony zigzagu / rozeta
const BW_PURPLE    = 0x7a1f5e;   // purpura tyryjska — Fenicja
const BW_ROPE      = 0xb89a6a;   // lina konopna
const BW_DARKHAIR  = 0x2a1a0a;   // broda
const BW_DARK      = 0x20180f;   // pioropusz/kita
const BW_STEEL     = 0xc2cad2;

// ── wymiary sylwetki (identyczne z rodzina NI_*/MS_* wzorca) ────────────────
const BW_HIP_Y     = 0.208 * HEX_R;
const BW_TORSO_W   = 0.180 * HEX_R;
const BW_TORSO_H   = 0.205 * HEX_R;
const BW_TORSO_D   = 0.100 * HEX_R;
const BW_TORSO_BOT = 0.240 * HEX_R;
const BW_TORSO_CTR = BW_TORSO_BOT + BW_TORSO_H * 0.5;
const BW_TORSO_TOP = BW_TORSO_BOT + BW_TORSO_H;
const BW_NECK_H    = 0.028 * HEX_R;
const BW_HEAD_S    = 0.128 * HEX_R;
const BW_HEAD_CTR  = BW_TORSO_TOP + BW_NECK_H + BW_HEAD_S * 0.5;
const BW_HEAD_TOP  = BW_TORSO_TOP + BW_NECK_H + BW_HEAD_S;
const BW_SHLD_X    = BW_TORSO_W * 0.5 + 0.030 * HEX_R;
const BW_SHLD_Y    = BW_TORSO_TOP - 0.024 * HEX_R;
const BW_HIP_X     = 0.052 * HEX_R;
const BW_THIGH_L   = 0.104 * HEX_R;
const BW_SHIN_L    = 0.096 * HEX_R;
const BW_UPARM_L   = 0.100 * HEX_R;
const BW_FOREARM_L = 0.092 * HEX_R;

// ── geometrie-singletony ────────────────────────────────────────────────────
let gBWTorso:   THREE.BoxGeometry | null = null;
let gBWNeck:    THREE.BoxGeometry | null = null;
let gBWHead:    THREE.BoxGeometry | null = null;
let gBWThigh:   THREE.BoxGeometry | null = null;
let gBWShin:    THREE.BoxGeometry | null = null;
let gBWFoot:    THREE.BoxGeometry | null = null;
let gBWToe:     THREE.BoxGeometry | null = null;   // zadarty nosek (hetycki)
let gBWUpArm:   THREE.BoxGeometry | null = null;
let gBWForearm: THREE.BoxGeometry | null = null;
let gBWFist:    THREE.BoxGeometry | null = null;
let gBWSkirt:   THREE.BoxGeometry | null = null;
let gBWBelt:    THREE.BoxGeometry | null = null;
let gBWBeltWide:THREE.BoxGeometry | null = null;   // szeroki pas hetycki
let gBWSash:    THREE.BoxGeometry | null = null;   // szarfa gracza (skosna)
let gBWHem:     THREE.BoxGeometry | null = null;   // lamowka spodnicy
let gBWMerlon:  THREE.BoxGeometry | null = null;   // zabek zigzagu muru
let gBWCone:    THREE.CylinderGeometry | null = null;  // helm stozkowy (8-kat)
let gBWConeTall:THREE.CylinderGeometry | null = null;  // wyzszy stozek (Ishtar)
let gBWCheek:   THREE.BoxGeometry | null = null;   // nausznik
let gBWPlumeTop:THREE.BoxGeometry | null = null;   // czub pioropusza
let gBWPlumeFall:THREE.BoxGeometry | null = null;  // opadajacy ogon pioropusza
let gBWCrestBase:THREE.BoxGeometry | null = null;  // podstawa grzebienia
let gBWCrestHair:THREE.BoxGeometry | null = null;  // krotki grzebien (Ishtar)
let gBWBowl:    THREE.CylinderGeometry | null = null;  // misa polkulista (Fenicja)
let gBWBowlTop: THREE.CylinderGeometry | null = null;  // kopulka misy
let gBWTuft:    THREE.BoxGeometry | null = null;   // krotka kita fenicka
let gBWBeard1:  THREE.BoxGeometry | null = null;   // broda klockowa — rzad 1
let gBWBeard2:  THREE.BoxGeometry | null = null;   // rzad 2
let gBWBeard3:  THREE.BoxGeometry | null = null;   // rzad 3
let gBWShFace:  THREE.CylinderGeometry | null = null;  // pole tarczy okraglej
let gBWShRim:   THREE.CylinderGeometry | null = null;  // rant tarczy (otwarty)
let gBWShBoss:  THREE.BoxGeometry | null = null;
let gBWStarRay: THREE.BoxGeometry | null = null;   // ramie gwiazdy Isztar (x4 = 8 promieni)
let gBWRosPetal:THREE.BoxGeometry | null = null;   // platek rozety (x3 = 6 platkow)
let gBWSpShaft: THREE.BoxGeometry | null = null;   // wlocznia
let gBWSpTip:   THREE.ConeGeometry | null = null;
let gBWSpButt:  THREE.BoxGeometry | null = null;   // sauroter/stopka
let gBWSpCollar:THREE.BoxGeometry | null = null;   // zlota tuleja pod grotem
let gBWGrip:    THREE.BoxGeometry | null = null;   // rekojesc sierpowca
let gBWBladeStr:THREE.BoxGeometry | null = null;   // prosta czesc klingi
let gBWBladeArc:THREE.BoxGeometry | null = null;   // segment luku sierpa
let gBWRope:    THREE.TorusGeometry | null = null; // zwoj liny
let gBWPouch:   THREE.BoxGeometry | null = null;   // sakwa kupiecka
let gBWFig8Shell: THREE.BufferGeometry | null = null;  // lob tarczy osemkowej (skorupa)
let gBWFig8Face:  THREE.BufferGeometry | null = null;  // lob — pole (kolor gracza)

function getGBWTorso():   THREE.BoxGeometry { return (gBWTorso   ||= new THREE.BoxGeometry(BW_TORSO_W, BW_TORSO_H, BW_TORSO_D)); }
function getGBWNeck():    THREE.BoxGeometry { return (gBWNeck    ||= new THREE.BoxGeometry(0.042 * HEX_R, BW_NECK_H * 1.6, 0.042 * HEX_R)); }
function getGBWHead():    THREE.BoxGeometry { return (gBWHead    ||= new THREE.BoxGeometry(BW_HEAD_S, BW_HEAD_S, BW_HEAD_S)); }
function getGBWThigh():   THREE.BoxGeometry { return (gBWThigh   ||= new THREE.BoxGeometry(0.056 * HEX_R, BW_THIGH_L, 0.060 * HEX_R)); }
function getGBWShin():    THREE.BoxGeometry { return (gBWShin    ||= new THREE.BoxGeometry(0.038 * HEX_R, BW_SHIN_L, 0.042 * HEX_R)); }
function getGBWFoot():    THREE.BoxGeometry { return (gBWFoot    ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)); }
function getGBWToe():     THREE.BoxGeometry { return (gBWToe     ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.034 * HEX_R, 0.022 * HEX_R)); }
function getGBWUpArm():   THREE.BoxGeometry { return (gBWUpArm   ||= new THREE.BoxGeometry(0.054 * HEX_R, BW_UPARM_L, 0.054 * HEX_R)); }
function getGBWForearm(): THREE.BoxGeometry { return (gBWForearm ||= new THREE.BoxGeometry(0.040 * HEX_R, BW_FOREARM_L, 0.040 * HEX_R)); }
function getGBWFist():    THREE.BoxGeometry { return (gBWFist    ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)); }
function getGBWSkirt():   THREE.BoxGeometry { return (gBWSkirt   ||= new THREE.BoxGeometry(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)); }
function getGBWBelt():    THREE.BoxGeometry { return (gBWBelt    ||= new THREE.BoxGeometry(0.190 * HEX_R, 0.034 * HEX_R, 0.112 * HEX_R)); }
function getGBWBeltWide():THREE.BoxGeometry { return (gBWBeltWide||= new THREE.BoxGeometry(0.192 * HEX_R, 0.056 * HEX_R, 0.114 * HEX_R)); }
function getGBWSash():    THREE.BoxGeometry { return (gBWSash    ||= new THREE.BoxGeometry(0.052 * HEX_R, 0.230 * HEX_R, 0.010 * HEX_R)); }
function getGBWHem():     THREE.BoxGeometry { return (gBWHem     ||= new THREE.BoxGeometry(0.198 * HEX_R, 0.026 * HEX_R, 0.120 * HEX_R)); }
function getGBWMerlon():  THREE.BoxGeometry { return (gBWMerlon  ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.020 * HEX_R, 0.008 * HEX_R)); }
function getGBWCone():    THREE.CylinderGeometry { return (gBWCone ||= new THREE.CylinderGeometry(0.040 * HEX_R, 0.098 * HEX_R, 0.115 * HEX_R, 8, 1)); }
function getGBWConeTall():THREE.CylinderGeometry { return (gBWConeTall ||= new THREE.CylinderGeometry(0.038 * HEX_R, 0.096 * HEX_R, 0.125 * HEX_R, 8, 1)); }
function getGBWCheek():   THREE.BoxGeometry { return (gBWCheek   ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.052 * HEX_R, 0.044 * HEX_R)); }
function getGBWPlumeTop():THREE.BoxGeometry { return (gBWPlumeTop||= new THREE.BoxGeometry(0.026 * HEX_R, 0.052 * HEX_R, 0.026 * HEX_R)); }
function getGBWPlumeFall():THREE.BoxGeometry{ return (gBWPlumeFall||= new THREE.BoxGeometry(0.024 * HEX_R, 0.115 * HEX_R, 0.018 * HEX_R)); }
function getGBWCrestBase():THREE.BoxGeometry{ return (gBWCrestBase||= new THREE.BoxGeometry(0.018 * HEX_R, 0.022 * HEX_R, 0.092 * HEX_R)); }
function getGBWCrestHair():THREE.BoxGeometry{ return (gBWCrestHair||= new THREE.BoxGeometry(0.022 * HEX_R, 0.050 * HEX_R, 0.118 * HEX_R)); }
function getGBWBowl():    THREE.CylinderGeometry { return (gBWBowl ||= new THREE.CylinderGeometry(0.062 * HEX_R, 0.090 * HEX_R, 0.066 * HEX_R, 8, 1, true)); }
function getGBWBowlTop(): THREE.CylinderGeometry { return (gBWBowlTop ||= new THREE.CylinderGeometry(0.024 * HEX_R, 0.060 * HEX_R, 0.034 * HEX_R, 8, 1)); }
function getGBWTuft():    THREE.BoxGeometry { return (gBWTuft    ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.048 * HEX_R, 0.052 * HEX_R)); }
function getGBWBeard1():  THREE.BoxGeometry { return (gBWBeard1  ||= new THREE.BoxGeometry(0.088 * HEX_R, 0.026 * HEX_R, 0.026 * HEX_R)); }
function getGBWBeard2():  THREE.BoxGeometry { return (gBWBeard2  ||= new THREE.BoxGeometry(0.074 * HEX_R, 0.026 * HEX_R, 0.022 * HEX_R)); }
function getGBWBeard3():  THREE.BoxGeometry { return (gBWBeard3  ||= new THREE.BoxGeometry(0.056 * HEX_R, 0.026 * HEX_R, 0.018 * HEX_R)); }
function getGBWShFace():  THREE.CylinderGeometry { return (gBWShFace ||= new THREE.CylinderGeometry(0.112 * HEX_R, 0.088 * HEX_R, 0.030 * HEX_R, 8, 1)); }
function getGBWShRim():   THREE.CylinderGeometry { return (gBWShRim  ||= new THREE.CylinderGeometry(0.122 * HEX_R, 0.122 * HEX_R, 0.016 * HEX_R, 8, 1, true)); }
function getGBWShBoss():  THREE.BoxGeometry { return (gBWShBoss  ||= new THREE.BoxGeometry(0.036 * HEX_R, 0.036 * HEX_R, 0.026 * HEX_R)); }
function getGBWStarRay(): THREE.BoxGeometry { return (gBWStarRay ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.186 * HEX_R, 0.010 * HEX_R)); }
function getGBWRosPetal():THREE.BoxGeometry { return (gBWRosPetal||= new THREE.BoxGeometry(0.030 * HEX_R, 0.120 * HEX_R, 0.010 * HEX_R)); }
function getGBWSpShaft(): THREE.BoxGeometry { return (gBWSpShaft ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.560 * HEX_R, 0.019 * HEX_R)); }
function getGBWSpTip():   THREE.ConeGeometry{ return (gBWSpTip   ||= new THREE.ConeGeometry(0.019 * HEX_R, 0.058 * HEX_R, 4)); }
function getGBWSpButt():  THREE.BoxGeometry { return (gBWSpButt  ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.048 * HEX_R, 0.022 * HEX_R)); }
function getGBWSpCollar():THREE.BoxGeometry { return (gBWSpCollar||= new THREE.BoxGeometry(0.030 * HEX_R, 0.026 * HEX_R, 0.030 * HEX_R)); }
function getGBWGrip():    THREE.BoxGeometry { return (gBWGrip    ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.062 * HEX_R, 0.024 * HEX_R)); }
function getGBWBladeStr():THREE.BoxGeometry { return (gBWBladeStr||= new THREE.BoxGeometry(0.014 * HEX_R, 0.132 * HEX_R, 0.026 * HEX_R)); }
function getGBWBladeArc():THREE.BoxGeometry { return (gBWBladeArc||= new THREE.BoxGeometry(0.014 * HEX_R, 0.070 * HEX_R, 0.030 * HEX_R)); }
function getGBWRope():    THREE.TorusGeometry { return (gBWRope  ||= new THREE.TorusGeometry(0.030 * HEX_R, 0.011 * HEX_R, 3, 7)); }
function getGBWPouch():   THREE.BoxGeometry { return (gBWPouch   ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.052 * HEX_R, 0.024 * HEX_R)); }

// tarcza osemkowa (hetycka): fasetowany owal z lukiem — jak scutum wzorca
function bwOvalRing(a: number, b: number, c: number, N: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(ang) * a, y = Math.sin(ang) * b;
    pts.push([x, y, -c * (x / a) * (x / a)]);
  }
  return pts;
}
function bwMakeShell(a: number, b: number, c: number, t: number, N: number): THREE.BufferGeometry {
  const ring = bwOvalRing(a, b, c, N);
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
function bwMakeFace(a: number, b: number, c: number, N: number): THREE.BufferGeometry {
  const ring = bwOvalRing(a, b, c, N);
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
function getGBWFig8Shell(): THREE.BufferGeometry { return (gBWFig8Shell ||= bwMakeShell(0.082 * HEX_R, 0.094 * HEX_R, 0.026 * HEX_R, 0.018 * HEX_R, 8)); }
function getGBWFig8Face():  THREE.BufferGeometry { return (gBWFig8Face  ||= bwMakeFace(0.070 * HEX_R, 0.080 * HEX_R, 0.020 * HEX_R, 8)); }

// ── anatomia lancuchowa (kopia konwencji niSeg/niBuildLeg/niBuildArm) ──────
function bwDirDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}
function bwSeg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = bwDirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}
function bwBuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  mFoot: THREE.MeshStandardMaterial, hipY: number = BW_HIP_Y,
): { footZ: number } {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = bwSeg(group, getGBWThigh(), mThigh, P, thU, BW_THIGH_L);
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = bwSeg(group, getGBWShin(), mShin, P, thL, BW_SHIN_L);
  const foot = new THREE.Mesh(getGBWFoot(), mFoot);
  foot.position.set(sx, 0.013 * HEX_R, P.z + 0.016 * HEX_R);
  group.add(foot);
  return { footZ: P.z + 0.016 * HEX_R };
}
function bwBuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  let P = new THREE.Vector3(sx, BW_SHLD_Y, 0);
  P = bwSeg(group, getGBWUpArm(), mUp, P, thU, BW_UPARM_L);
  P.y += 0.010 * HEX_R;
  const wrist = bwSeg(group, getGBWForearm(), mFore, P, thF, BW_FOREARM_L);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getGBWFist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(bwDirDown(thF), 0.014 * HEX_R));
    group.add(fist);
  }
  return { wrist, axis: bwDirDown(thF) };
}
function bwBuildCore(
  group: THREE.Group, mat: MatFactory, mTorso: THREE.MeshStandardMaterial,
): void {
  const torso = new THREE.Mesh(getGBWTorso(), mTorso);
  torso.position.set(0, BW_TORSO_CTR, 0);
  group.add(torso);
  const mSkin = mat(BW_SKIN, 0.05, 0.80);
  const neck = new THREE.Mesh(getGBWNeck(), mSkin);
  neck.position.set(0, BW_TORSO_TOP + BW_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(getGBWHead(), mSkin);
  head.position.set(0, BW_HEAD_CTR, 0);
  group.add(head);
}

/** Szarfa gracza skosna przez tors (nosnik koloru gracza, jak seria). */
function bwSash(group: THREE.Group, mOwner: THREE.MeshStandardMaterial): void {
  const s = new THREE.Mesh(getGBWSash(), mOwner);
  s.rotation.z = 0.60;
  s.position.set(0, BW_TORSO_CTR + 0.012 * HEX_R, BW_TORSO_D * 0.5 + 0.007 * HEX_R);
  group.add(s);
}

/** Broda krecona klockowo (styl babilonski): 1-3 schodkowane rzedy klockow. */
function bwBeard(group: THREE.Group, mHair: THREE.MeshStandardMaterial, rows: number): void {
  const z0 = BW_HEAD_S * 0.5 - 0.004 * HEX_R;
  const geos = [getGBWBeard1(), getGBWBeard2(), getGBWBeard3()];
  for (let i = 0; i < rows; i++) {
    const b = new THREE.Mesh(geos[i], mHair);
    b.position.set(0, BW_HEAD_CTR - (0.052 + i * 0.026) * HEX_R, z0 + (0.012 - i * 0.003) * HEX_R);
    group.add(b);
  }
}

/** Okragla wypukla tarcza: pole (walec zwezany) + rant + opcjonalne umbo. */
function bwRoundShield(mFace: THREE.MeshStandardMaterial, mRim: THREE.MeshStandardMaterial,
                       mBoss: THREE.MeshStandardMaterial | null, scale: number): THREE.Group {
  const sh = new THREE.Group();
  const face = new THREE.Mesh(getGBWShFace(), mFace);
  face.rotation.x = Math.PI / 2;
  sh.add(face);
  const rim = new THREE.Mesh(getGBWShRim(), mRim);
  rim.rotation.x = Math.PI / 2;
  rim.position.z = -0.004 * HEX_R;
  sh.add(rim);
  if (mBoss !== null) {
    const boss = new THREE.Mesh(getGBWShBoss(), mBoss);
    boss.position.z = 0.020 * HEX_R;
    sh.add(boss);
  }
  sh.scale.setScalar(scale);
  return sh;
}

/** Tarcza w lewej dloni-gardzie: grupa na nadgarstku, lekko ku osi ciala. */
function bwMountShield(group: THREE.Group, sh: THREE.Group, wrist: THREE.Vector3): void {
  sh.position.set(wrist.x - 0.025 * HEX_R, wrist.y + 0.030 * HEX_R, wrist.z + 0.042 * HEX_R);
  sh.rotation.y = -0.20;
  group.add(sh);
}

/** Wlocznia PODRECZNA na wysokosci dloni: os pozioma +Z, pochylenie `tilt`
 *  (+ = grot w gore). Grot z przodu, stopka z tylu; drzewce przez piesc. */
function bwSpearUnderhand(group: THREE.Group, wrist: THREE.Vector3, axis: THREE.Vector3,
                          mWood: THREE.MeshStandardMaterial, mTip: THREE.MeshStandardMaterial,
                          mButt: THREE.MeshStandardMaterial | null, tilt: number,
                          mCollar: THREE.MeshStandardMaterial | null = null): void {
  const spearTh = Math.PI * 0.5 + tilt;              // bwDirDown(PI/2+tilt) => grot w gore dla tilt>0
  const sAxis = bwDirDown(spearTh);
  const grip = wrist.clone().addScaledVector(axis, 0.014 * HEX_R);
  const shaft = new THREE.Mesh(getGBWSpShaft(), mWood);
  shaft.rotation.x = Math.PI - spearTh;
  shaft.position.copy(grip.clone().addScaledVector(sAxis, 0.105 * HEX_R));
  group.add(shaft);
  const tip = new THREE.Mesh(getGBWSpTip(), mTip);
  tip.rotation.x = Math.PI - spearTh;                // +Y cone = sAxis (grot w przod)
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(grip.clone().addScaledVector(sAxis, (0.105 + 0.280 + 0.026) * HEX_R));
  group.add(tip);
  if (mCollar !== null) {
    const col = new THREE.Mesh(getGBWSpCollar(), mCollar);
    col.rotation.x = Math.PI - spearTh;
    col.position.copy(grip.clone().addScaledVector(sAxis, (0.105 + 0.280 - 0.020) * HEX_R));
    group.add(col);
  }
  if (mButt !== null) {
    const butt = new THREE.Mesh(getGBWSpButt(), mButt);
    butt.rotation.x = Math.PI - spearTh;
    butt.position.copy(grip.clone().addScaledVector(sAxis, (0.105 - 0.280 - 0.018) * HEX_R));
    group.add(butt);
  }
}

// ---------------------------------------------------------------------------
// PIECHOTA HETYCKA (Hetyci, Braz) — POZA: pchniecie wlocznia podreczne,
// grot lekko W GORE. Helm stozkowy z NAUSZNIKAMI i OPADAJACYM pioropuszem,
// tarcza OSEMKOWA (pole = kolor gracza, skorzana skorupa), kremowa tunika
// krotka + SZEROKI ciemny pas, BUTY Z ZADARTYMI NOSKAMI (hetycki detal).
// ---------------------------------------------------------------------------
export function buildPiechotaHetycka(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mLinen  = mat(BW_LINEN,      0.06, 0.82);
  const mBronze = mat(BW_BRONZE,     0.35, 0.50);
  const mBronzL = mat(BW_BRONZE_LT,  0.55, 0.35);
  const mOwner  = mat(ownerColor_,   0.14, 0.64);
  const mWood   = mat(BW_WOOD,       0.05, 0.85);
  const mLeath  = mat(BW_LEATHER,    0.06, 0.82);
  const mLeathD = mat(BW_LEATHER_DK, 0.05, 0.85);
  const mSkin   = mat(BW_SKIN,       0.05, 0.80);
  const mDark   = mat(BW_DARK,       0.05, 0.88);

  const HIP_Y = BW_HIP_Y - 0.010 * HEX_R;   // wykrok bojowy

  // korpus: kremowa tunika krotka + spodnica + SZEROKI pas
  bwBuildCore(group, mat, mLinen);
  const skirt = new THREE.Mesh(getGBWSkirt(), mLinen);
  skirt.position.set(0, BW_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const belt = new THREE.Mesh(getGBWBeltWide(), mLeathD);
  belt.position.set(0, 0.258 * HEX_R, 0);
  group.add(belt);
  bwSash(group, mOwner);

  // nogi: LEWA (+X) wykroczna; BUTY Z ZADARTYMI NOSKAMI na obu stopach
  const legL = bwBuildLeg(group,  BW_HIP_X,  0.55,  0.30, mLinen, mSkin, mLeath, HIP_Y);
  const legR = bwBuildLeg(group, -BW_HIP_X, -0.50, -0.16, mLinen, mSkin, mLeath, HIP_Y);
  for (const [sx, fz] of [[BW_HIP_X, legL.footZ], [-BW_HIP_X, legR.footZ]] as [number, number][]) {
    const toe = new THREE.Mesh(getGBWToe(), mLeath);
    toe.rotation.x = -0.55;                            // zadarty ku gorze
    toe.position.set(sx, 0.030 * HEX_R, fz + 0.042 * HEX_R);
    group.add(toe);
  }

  // HELM STOZKOWY z nausznikami + pioropusz OPADAJACY ku karkowi
  const cone = new THREE.Mesh(getGBWCone(), mBronze);
  cone.position.set(0, BW_HEAD_CTR + 0.042 * HEX_R, 0);
  group.add(cone);
  for (const sx of [-1, 1]) {
    const ck = new THREE.Mesh(getGBWCheek(), mBronze);
    ck.position.set(sx * (BW_HEAD_S * 0.5 + 0.004 * HEX_R), BW_HEAD_CTR - 0.012 * HEX_R, 0.014 * HEX_R);
    group.add(ck);
  }
  const plumeTop = new THREE.Mesh(getGBWPlumeTop(), mDark);
  plumeTop.position.set(0, BW_HEAD_TOP + 0.058 * HEX_R, -0.006 * HEX_R);
  group.add(plumeTop);
  const plumeFall = new THREE.Mesh(getGBWPlumeFall(), mDark);   // ogon splywa w tyl-dol
  plumeFall.rotation.x = -2.35;
  plumeFall.position.set(0, BW_HEAD_TOP + 0.014 * HEX_R, -0.075 * HEX_R);
  group.add(plumeFall);

  // PRAWE (-X) RAMIE + WLOCZNIA podrecznie, grot lekko W GORE
  const armR = bwBuildArm(group, -BW_SHLD_X, 0.85, 1.42, mLinen, mSkin, mLeath);
  bwSpearUnderhand(group, armR.wrist, armR.axis, mWood, mBronzL, mBronze, 0.30);

  // LEWE (+X) RAMIE + TARCZA OSEMKOWA (dwa loby, pole = kolor gracza)
  const armL = bwBuildArm(group, BW_SHLD_X, 0.50, 1.08, mLinen, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.025 * HEX_R,
    armL.wrist.y + 0.052 * HEX_R,
    armL.wrist.z + 0.045 * HEX_R,
  );
  sh.rotation.y = -0.20;
  for (const dy of [0.072, -0.072]) {                  // gorny i dolny lob osemki
    const shell = new THREE.Mesh(getGBWFig8Shell(), mLeath);
    shell.position.set(0, dy * HEX_R, 0);
    sh.add(shell);
    const face = new THREE.Mesh(getGBWFig8Face(), mOwner);
    face.position.set(0, dy * HEX_R, 0.013 * HEX_R);
    sh.add(face);
  }
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// GWARDIA ISHTAR (Babilonia, Braz, ELITA) — POZA: pchniecie NADRECZNE
// (lokiec nad barkiem, grot w przod lekko w dol). LAZURYT + ZLOTO: zlota
// tarcza z GWIAZDA ISZTAR (8 promieni = kolor gracza, rant = lapis), helm
// zloty z krotkim lapisowym grzebieniem, BRODA KRECONA KLOCKOWO (3 rzedy),
// wlocznia z ozdobna zlota tuleja i stopka.
// ---------------------------------------------------------------------------
export function buildGwardiaIshtar(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mLapis  = mat(BW_LAPIS,     0.10, 0.62);
  const mLapisD = mat(BW_LAPIS_DK,  0.10, 0.66);
  const mGold   = mat(BW_GOLD,      0.58, 0.32);
  const mBronze = mat(BW_BRONZE,    0.35, 0.50);
  const mOwner  = mat(ownerColor_,  0.14, 0.60);
  const mWood   = mat(BW_WOOD,      0.05, 0.85);
  const mLeath  = mat(BW_LEATHER,   0.06, 0.82);
  const mSkin   = mat(BW_SKIN,      0.05, 0.80);
  const mHair   = mat(BW_DARKHAIR,  0.05, 0.88);

  const HIP_Y = BW_HIP_Y - 0.012 * HEX_R;   // gleboki wykrok (elita napiera)

  // korpus: lazurytowa tunika, zloty pas i zlota lamowka spodnicy
  bwBuildCore(group, mat, mLapis);
  const skirt = new THREE.Mesh(getGBWSkirt(), mLapisD);
  skirt.position.set(0, BW_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const hem = new THREE.Mesh(getGBWHem(), mGold);
  hem.position.set(0, BW_TORSO_BOT - 0.052 * HEX_R, 0);
  group.add(hem);
  const belt = new THREE.Mesh(getGBWBelt(), mGold);
  belt.position.set(0, 0.256 * HEX_R, 0);
  group.add(belt);
  bwSash(group, mOwner);

  // nogi
  bwBuildLeg(group,  BW_HIP_X,  0.58,  0.34, mLapis, mSkin, mLeath, HIP_Y);
  bwBuildLeg(group, -BW_HIP_X, -0.52, -0.20, mLapis, mSkin, mLeath, HIP_Y);

  // HELM: zloty stozek + krotki lapisowy grzebien przod-tyl + BRODA klockowa
  const cone = new THREE.Mesh(getGBWConeTall(), mGold);
  cone.position.set(0, BW_HEAD_CTR + 0.047 * HEX_R, 0);
  group.add(cone);
  const crestB = new THREE.Mesh(getGBWCrestBase(), mBronze);
  crestB.position.set(0, BW_HEAD_TOP + 0.058 * HEX_R, -0.006 * HEX_R);
  group.add(crestB);
  const crestH = new THREE.Mesh(getGBWCrestHair(), mLapis);
  crestH.position.set(0, BW_HEAD_TOP + 0.092 * HEX_R, -0.008 * HEX_R);
  group.add(crestH);
  bwBeard(group, mHair, 3);

  // PRAWE (-X) RAMIE + WLOCZNIA NADRECZNIE (lokiec nad barkiem, grot w dol)
  const armR = bwBuildArm(group, -BW_SHLD_X, -2.55, 1.32, mLapis, mSkin, mLeath);
  bwSpearUnderhand(group, armR.wrist, armR.axis, mWood, mBronze, mGold, -0.20, mGold);

  // LEWE (+X) RAMIE + ZLOTA TARCZA z gwiazda Isztar (promienie = kolor gracza)
  const armL = bwBuildArm(group, BW_SHLD_X, 0.52, 1.05, mLapis, mSkin, null);
  const sh = bwRoundShield(mGold, mLapisD, null, 1.0);
  for (let i = 0; i < 4; i++) {                        // 4 boxy przez srodek = 8 promieni
    const ray = new THREE.Mesh(getGBWStarRay(), mOwner);
    ray.rotation.z = i * Math.PI / 4;
    ray.position.z = 0.017 * HEX_R;
    sh.add(ray);
  }
  const hub = new THREE.Mesh(getGBWShBoss(), mGold);   // zloty guz na srodku gwiazdy
  hub.position.z = 0.024 * HEX_R;
  sh.add(hub);
  bwMountShield(group, sh, armL.wrist);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// WOJOWNIK BABILONSKI (Babilonia, Braz) — POZA: CIOS SIERPOWCEM Z GORY
// (ramie wzniesione, sierp wygina sie w przod). Tunika CEGLASTA z lamowka
// w ZIGZAG MURU (kremowy pas + ceglane merlony), helm stozkowy brazowy,
// broda klockowa (2 rzedy), tarcza okragla SKROMNIEJSZA (pole = kolor gracza,
// drewniany rant, bez umba).
// ---------------------------------------------------------------------------
export function buildWojownikBabilonski(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mBrick  = mat(BW_BRICK,     0.05, 0.84);
  const mCream  = mat(BW_CREAM,     0.06, 0.82);
  const mBronze = mat(BW_BRONZE,    0.35, 0.50);
  const mBronzL = mat(BW_BRONZE_LT, 0.55, 0.35);
  const mOwner  = mat(ownerColor_,  0.14, 0.64);
  const mWood   = mat(BW_WOOD,      0.05, 0.85);
  const mLeath  = mat(BW_LEATHER,   0.06, 0.82);
  const mSkin   = mat(BW_SKIN,      0.05, 0.80);
  const mHair   = mat(BW_DARKHAIR,  0.05, 0.88);

  const HIP_Y = BW_HIP_Y - 0.010 * HEX_R;

  // korpus: ceglasta tunika + spodnica z KREMOWA lamowka i zigzagiem muru
  bwBuildCore(group, mat, mBrick);
  const skirt = new THREE.Mesh(getGBWSkirt(), mBrick);
  skirt.position.set(0, BW_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const hem = new THREE.Mesh(getGBWHem(), mCream);
  hem.position.set(0, BW_TORSO_BOT - 0.052 * HEX_R, 0);
  group.add(hem);
  for (const sx of [-1.5, -0.5, 0.5, 1.5]) {           // merlony (zabki muru) z przodu
    const mer = new THREE.Mesh(getGBWMerlon(), mBrick);
    mer.position.set(sx * 0.046 * HEX_R, BW_TORSO_BOT - 0.044 * HEX_R, 0.062 * HEX_R);
    group.add(mer);
  }
  const belt = new THREE.Mesh(getGBWBelt(), mLeath);
  belt.position.set(0, 0.256 * HEX_R, 0);
  group.add(belt);
  bwSash(group, mOwner);

  // nogi
  bwBuildLeg(group,  BW_HIP_X,  0.55,  0.30, mBrick, mSkin, mLeath, HIP_Y);
  bwBuildLeg(group, -BW_HIP_X, -0.50, -0.16, mBrick, mSkin, mLeath, HIP_Y);

  // HELM STOZKOWY brazowy (bez nausznikow) + broda klockowa (2 rzedy)
  const cone = new THREE.Mesh(getGBWCone(), mBronze);
  cone.position.set(0, BW_HEAD_CTR + 0.042 * HEX_R, 0);
  group.add(cone);
  bwBeard(group, mHair, 2);

  // PRAWE (-X) RAMIE + SIERPOWIEC (sappara) w CIOSIE Z GORY:
  // ramie wzniesione w tyl-gore, przedramie w przod-gore; rekojesc na osi
  // dloni, prosta czesc klingi przedluza os, luk sierpa wygina sie ku +Z.
  const armR = bwBuildArm(group, -BW_SHLD_X, -2.15, 2.45, mBrick, mSkin, mLeath);
  const swTh = 2.45;                                   // os klingi = os przedramienia (gora-przod)
  const sAxis = armR.axis;
  const grip = new THREE.Mesh(getGBWGrip(), mWood);
  grip.rotation.x = Math.PI - swTh;
  grip.position.copy(armR.wrist.clone().addScaledVector(sAxis, 0.016 * HEX_R));
  group.add(grip);
  const blade = new THREE.Mesh(getGBWBladeStr(), mBronzL);
  blade.rotation.x = Math.PI - swTh;
  blade.position.copy(armR.wrist.clone().addScaledVector(sAxis, 0.110 * HEX_R));
  group.add(blade);
  // dwa segmenty luku: kazdy kolejny mocniej pochylony ku przodowi (+Z)
  const arcBase = armR.wrist.clone().addScaledVector(sAxis, 0.176 * HEX_R);
  const a1 = new THREE.Mesh(getGBWBladeArc(), mBronzL);
  a1.rotation.x = Math.PI - (swTh - 0.55);
  a1.position.copy(arcBase.clone().addScaledVector(bwDirDown(swTh - 0.55), 0.032 * HEX_R));
  group.add(a1);
  const arcEnd = arcBase.clone().addScaledVector(bwDirDown(swTh - 0.55), 0.064 * HEX_R);
  const a2 = new THREE.Mesh(getGBWBladeArc(), mBronzL);
  a2.rotation.x = Math.PI - (swTh - 1.10);
  a2.position.copy(arcEnd.clone().addScaledVector(bwDirDown(swTh - 1.10), 0.030 * HEX_R));
  group.add(a2);

  // LEWE (+X) RAMIE + tarcza skromniejsza (pole gracza, drewniany rant)
  const armL = bwBuildArm(group, BW_SHLD_X, 0.50, 1.08, mBrick, mSkin, null);
  bwMountShield(group, bwRoundShield(mOwner, mWood, null, 0.74), armL.wrist);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// WOJOWNIK FENICKI (Fenicjanie, Braz) — POZA: pchniecie wlocznia podreczne
// PLASKIE (grot poziomo). PURPUROWA tunika (barwnik Tyru) z kremowa lamowka,
// helm POLKULISTY z krotka kita, tarcza okragla z ROZETA fenicka (kremowe
// platki na polu gracza), przy pasie ZWOJ LINY + SAKWA kupiecka (morski smaczek).
// ---------------------------------------------------------------------------
export function buildWojownikFenicki(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mPurple = mat(BW_PURPLE,    0.06, 0.78);
  const mCream  = mat(BW_CREAM,     0.06, 0.82);
  const mBronze = mat(BW_BRONZE,    0.35, 0.50);
  const mBronzL = mat(BW_BRONZE_LT, 0.55, 0.35);
  const mOwner  = mat(ownerColor_,  0.14, 0.64);
  const mWood   = mat(BW_WOOD,      0.05, 0.85);
  const mLeath  = mat(BW_LEATHER,   0.06, 0.82);
  const mSkin   = mat(BW_SKIN,      0.05, 0.80);
  const mDark   = mat(BW_DARK,      0.05, 0.88);
  const mRope   = mat(BW_ROPE,      0.05, 0.86);

  const HIP_Y = BW_HIP_Y - 0.010 * HEX_R;

  // korpus: purpurowa tunika + kremowa lamowka spodnicy + pas skorzany
  bwBuildCore(group, mat, mPurple);
  const skirt = new THREE.Mesh(getGBWSkirt(), mPurple);
  skirt.position.set(0, BW_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const hem = new THREE.Mesh(getGBWHem(), mCream);
  hem.position.set(0, BW_TORSO_BOT - 0.052 * HEX_R, 0);
  group.add(hem);
  const belt = new THREE.Mesh(getGBWBelt(), mLeath);
  belt.position.set(0, 0.256 * HEX_R, 0);
  group.add(belt);
  bwSash(group, mOwner);

  // ZWOJ LINY przy lewym biodrze (zeglarski) + SAKWA przy prawym (kupiecka)
  const rope = new THREE.Mesh(getGBWRope(), mRope);
  rope.position.set(0.088 * HEX_R, 0.250 * HEX_R, -0.046 * HEX_R);
  rope.rotation.y = 0.55;
  group.add(rope);
  const pouch = new THREE.Mesh(getGBWPouch(), mLeath);
  pouch.position.set(-0.096 * HEX_R, 0.236 * HEX_R, -0.020 * HEX_R);
  group.add(pouch);

  // nogi
  bwBuildLeg(group,  BW_HIP_X,  0.52,  0.28, mPurple, mSkin, mLeath, HIP_Y);
  bwBuildLeg(group, -BW_HIP_X, -0.48, -0.14, mPurple, mSkin, mLeath, HIP_Y);

  // HELM POLKULISTY (misa + kopulka) + KROTKA KITA
  const bowl = new THREE.Mesh(getGBWBowl(), mBronze);
  bowl.position.set(0, BW_HEAD_CTR + 0.038 * HEX_R, 0);
  group.add(bowl);
  const bowlTop = new THREE.Mesh(getGBWBowlTop(), mBronze);
  bowlTop.position.set(0, BW_HEAD_CTR + 0.088 * HEX_R, 0);
  group.add(bowlTop);
  const tuft = new THREE.Mesh(getGBWTuft(), mDark);
  tuft.rotation.x = 0.30;                              // kita klania sie w tyl
  tuft.position.set(0, BW_HEAD_TOP + 0.066 * HEX_R, -0.012 * HEX_R);
  group.add(tuft);

  // PRAWE (-X) RAMIE + WLOCZNIA podrecznie, grot POZIOMO
  const armR = bwBuildArm(group, -BW_SHLD_X, 0.78, 1.52, mPurple, mSkin, mLeath);
  bwSpearUnderhand(group, armR.wrist, armR.axis, mWood, mBronzL, mBronze, 0.18);

  // LEWE (+X) RAMIE + TARCZA z rozeta fenicka (platki kremowe na polu gracza)
  const armL = bwBuildArm(group, BW_SHLD_X, 0.52, 1.05, mPurple, mSkin, null);
  const sh = bwRoundShield(mOwner, mBronze, null, 0.90);
  for (let i = 0; i < 3; i++) {                        // 3 boxy przez srodek = 6 platkow rozety
    const petal = new THREE.Mesh(getGBWRosPetal(), mCream);
    petal.rotation.z = i * Math.PI / 3;
    petal.position.z = 0.017 * HEX_R;
    sh.add(petal);
  }
  const hub = new THREE.Mesh(getGBWShBoss(), mBronzL); // guzek rozety
  hub.position.z = 0.024 * HEX_R;
  sh.add(hub);
  bwMountShield(group, sh, armL.wrist);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}
