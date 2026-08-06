/**
 * jednostki-p6-super.ts — PACZKA 6/8: SUPER-JEDNOSTKI (braz)
 * (seria render-jednostki; wzorzec anatomii: hastati-falangita.ts KOREKTA v2,
 *  konwencja SUPERA: jednostki-p2-inka.ts — choragiew-znacznik NA PLECACH)
 * ---------------------------------------------------------------------------
 * ZAWARTOSC PLIKU (stan 2026-08-06) — DWA buildery, oba UZYWANE:
 *   buildSuperGreece(ownerColor)  Hieros Lochos  — units.ts, buildSuperUnit, case 'grecja'
 *   buildSuperRome(ownerColor)    Evocati        — units.ts, buildSuperUnit, case 'rzym'
 *                                                  (Triari maja wlasny model)
 * Wywolania sa po NAZWIE FUNKCJI (import w units.ts) — celowo bez numerow
 * linii: poprzedni naglowek podawal „units.ts:6162" itp., co rozjechalo sie
 * z kodem i wprowadzalo w blad.
 *
 * USUNIETE 2026-08-06 (R-BRAZ-SUPER-DISPATCH-Q1=A, sprzatanie po recenzji):
 * buildSuperChina / buildSuperZulu / buildSuperEgypt / buildSuperSumer wraz
 * z ich geometriami-singletonami. Po przekierowaniu dispatchu na modele
 * NAZWANE (buildHuBenWei / buildUThulwana / buildMedjay /
 * buildSumerianRoyalGuard w units.ts) nie mialy juz ANI JEDNEGO wywolania —
 * zostawaly wylacznie jako martwy kod. Odpowiednik inkaski (buildSuperInca)
 * zniknal analogicznie z jednostki-p2-inka.ts.
 *
 * Interfejs i konwencje BEZ ZMIAN:
 *   - figurka PRZODEM do +Z, stopy na y = 0, uklad prawoskretny => LEWA = +X, PRAWA = -X,
 *   - TARCZA na LEWYM (+X) przedramieniu, BRON w PRAWEJ (-X) dloni NA OSI przedramienia,
 *   - POZY ATAKU (wykrok, biodra obnizone), NAKRYCIE GLOWY na kazdej glowie,
 *   - kolor gracza JAK STARE NIOSA (Grecja pole tarczy; Rzym blazon na scutum)
 *     + CHORAGIEW NA PLECACH (pole+flaga kolor gracza+zloty finial) = znacznik
 *     SUPER kazdej elity,
 *   - group.userData['mats'] i ['perTokenGeos'] jak w units.ts, geometrie = singletony.
 *
 * CHARAKTERY (rozroznialnosc elit):
 *   GRECJA Hieros Lochos: koryncki helm z WYSOKIM grzebieniem z przednim lokiem,
 *     muskularny kirys z brazu, purpurowy krotki plaszcz, aspis z motywem THETA,
 *     dory nadrecznie (pchniecie).
 *   RZYM Evocati: weteran po wzorcu Hastatiego — POSREBRZANY montefortino
 *     z PODWOJNYM pioropuszem, FALERY (3 krazki odznaczen na rzemieniu),
 *     owalne scutum ze zlotymi SKRZYDLAMI i WIENCEM, gladius w pchnieciu.
 * Budzet: <= ~480 tri (+20 elita); zob. liczby przy builderach.
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

// ── paleta serii (units.ts + serie P1-P4) ───────────────────────────────────
const S6_SKIN      = 0xe0ac69;   // skora jasna (Grecja / Rzym)
const S6_STEEL     = 0xc2cad2;   // stal polerowana
const S6_SILVER    = 0xd7dce2;   // posrebrzany helm Evocati
const S6_BRONZE    = 0xcf9234;   // braz
const S6_BRONZE_LT = 0xd0a050;   // jasny braz
const S6_GOLD      = 0xe0b53a;   // zloto elit (akcent SUPER)
const S6_WOOD      = 0x7a5c3a;   // drewno
const S6_WOOD_DK   = 0x5f4020;   // ciemne drewno (drzewce choragwi)
const S6_LEATHER   = 0x6b4a28;   // skora rzemienie
const S6_ROMAN_RED = 0xa42a22;   // tunika rzymska
const S6_CRIMSON   = 0xa01f2e;   // karmazyn (grzebien Grecji)
const S6_PURPLE    = 0x7a2c96;   // purpura (plaszcz Hieros Lochos, piora Evocati)
const S6_EYE       = 0x1a1008;   // oczy
const S6_DARK      = 0x20180f;   // szczelina helmu

// ── wymiary sylwetki (rodzina NI_* z hastati-falangita.ts — spojna seria) ───
const S6_HIP_Y     = 0.208 * HEX_R;
const S6_TORSO_W   = 0.180 * HEX_R;
const S6_TORSO_H   = 0.205 * HEX_R;
const S6_TORSO_D   = 0.100 * HEX_R;
const S6_TORSO_BOT = 0.240 * HEX_R;
const S6_TORSO_CTR = S6_TORSO_BOT + S6_TORSO_H * 0.5;
const S6_TORSO_TOP = S6_TORSO_BOT + S6_TORSO_H;
const S6_NECK_H    = 0.028 * HEX_R;
const S6_HEAD_S    = 0.128 * HEX_R;
const S6_HEAD_CTR  = S6_TORSO_TOP + S6_NECK_H + S6_HEAD_S * 0.5;
const S6_HEAD_TOP  = S6_TORSO_TOP + S6_NECK_H + S6_HEAD_S;
const S6_SHLD_X    = S6_TORSO_W * 0.5 + 0.030 * HEX_R;
const S6_SHLD_Y    = S6_TORSO_TOP - 0.024 * HEX_R;
const S6_HIP_X     = 0.052 * HEX_R;
const S6_THIGH_L   = 0.104 * HEX_R;
const S6_SHIN_L    = 0.096 * HEX_R;
const S6_UPARM_L   = 0.100 * HEX_R;
const S6_FOREARM_L = 0.092 * HEX_R;

// ── geometrie-singletony (wspolne dla wszystkich tokenow paczki) ────────────
let gS6Torso:   THREE.BoxGeometry | null = null;
let gS6Neck:    THREE.BoxGeometry | null = null;
let gS6Head:    THREE.BoxGeometry | null = null;
let gS6Eye:     THREE.BoxGeometry | null = null;
let gS6Thigh:   THREE.BoxGeometry | null = null;
let gS6Shin:    THREE.BoxGeometry | null = null;
let gS6Foot:    THREE.BoxGeometry | null = null;
let gS6UpArm:   THREE.BoxGeometry | null = null;
let gS6Forearm: THREE.BoxGeometry | null = null;
let gS6Fist:    THREE.BoxGeometry | null = null;
let gS6Skirt:   THREE.BoxGeometry | null = null;
let gS6Belt:    THREE.BoxGeometry | null = null;
let gS6Greave:  THREE.BoxGeometry | null = null;
// choragiew SUPER (na plecach)
let gS6Pole:    THREE.BoxGeometry | null = null;
let gS6Flag:    THREE.BoxGeometry | null = null;
let gS6Finial:  THREE.BoxGeometry | null = null;
// Grecja
let gS6CorDome:  THREE.CylinderGeometry | null = null;
let gS6Slit:     THREE.BoxGeometry | null = null;
let gS6CrestBase:THREE.BoxGeometry | null = null;
let gS6CrestTall:THREE.BoxGeometry | null = null;
let gS6CrestCurl:THREE.BoxGeometry | null = null;
let gS6PecPlate: THREE.BoxGeometry | null = null;
let gS6AbsPlate: THREE.BoxGeometry | null = null;
let gS6Cloak:    THREE.BoxGeometry | null = null;
let gS6AspisFace:THREE.CylinderGeometry | null = null;
let gS6AspisRim: THREE.CylinderGeometry | null = null;
let gS6ThetaRing:THREE.CylinderGeometry | null = null;
let gS6ThetaBar: THREE.BoxGeometry | null = null;
let gS6DoryShaft:THREE.BoxGeometry | null = null;
let gS6DoryTip:  THREE.ConeGeometry | null = null;
let gS6Sauroter: THREE.BoxGeometry | null = null;
// Rzym
let gS6MontBowl: THREE.CylinderGeometry | null = null;
let gS6Cheek:    THREE.BoxGeometry | null = null;
let gS6PlumeRom: THREE.BoxGeometry | null = null;
let gS6Phalera:  THREE.BoxGeometry | null = null;
let gS6ScutShell:THREE.BufferGeometry | null = null;
let gS6ScutFace: THREE.BufferGeometry | null = null;
let gS6Umbo:     THREE.BoxGeometry | null = null;
let gS6WingRom:  THREE.BoxGeometry | null = null;
let gS6Wreath:   THREE.CylinderGeometry | null = null;
let gS6Blade:    THREE.BoxGeometry | null = null;
let gS6BladeTip: THREE.ConeGeometry | null = null;
let gS6Guard:    THREE.BoxGeometry | null = null;

function getGS6Torso():   THREE.BoxGeometry { return (gS6Torso   ||= new THREE.BoxGeometry(S6_TORSO_W, S6_TORSO_H, S6_TORSO_D)); }
function getGS6Neck():    THREE.BoxGeometry { return (gS6Neck    ||= new THREE.BoxGeometry(0.042 * HEX_R, S6_NECK_H * 1.6, 0.042 * HEX_R)); }
function getGS6Head():    THREE.BoxGeometry { return (gS6Head    ||= new THREE.BoxGeometry(S6_HEAD_S, S6_HEAD_S, S6_HEAD_S)); }
function getGS6Eye():     THREE.BoxGeometry { return (gS6Eye     ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.015 * HEX_R, 0.008 * HEX_R)); }
function getGS6Thigh():   THREE.BoxGeometry { return (gS6Thigh   ||= new THREE.BoxGeometry(0.056 * HEX_R, S6_THIGH_L, 0.060 * HEX_R)); }
function getGS6Shin():    THREE.BoxGeometry { return (gS6Shin    ||= new THREE.BoxGeometry(0.038 * HEX_R, S6_SHIN_L, 0.042 * HEX_R)); }
function getGS6Foot():    THREE.BoxGeometry { return (gS6Foot    ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)); }
function getGS6UpArm():   THREE.BoxGeometry { return (gS6UpArm   ||= new THREE.BoxGeometry(0.054 * HEX_R, S6_UPARM_L, 0.054 * HEX_R)); }
function getGS6Forearm(): THREE.BoxGeometry { return (gS6Forearm ||= new THREE.BoxGeometry(0.040 * HEX_R, S6_FOREARM_L, 0.040 * HEX_R)); }
function getGS6Fist():    THREE.BoxGeometry { return (gS6Fist    ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)); }
function getGS6Skirt():   THREE.BoxGeometry { return (gS6Skirt   ||= new THREE.BoxGeometry(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)); }
function getGS6Belt():    THREE.BoxGeometry { return (gS6Belt    ||= new THREE.BoxGeometry(0.190 * HEX_R, 0.034 * HEX_R, 0.112 * HEX_R)); }
function getGS6Greave():  THREE.BoxGeometry { return (gS6Greave  ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.098 * HEX_R, 0.050 * HEX_R)); }
function getGS6Pole():    THREE.BoxGeometry { return (gS6Pole    ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.500 * HEX_R, 0.016 * HEX_R)); }
function getGS6Flag():    THREE.BoxGeometry { return (gS6Flag    ||= new THREE.BoxGeometry(0.085 * HEX_R, 0.062 * HEX_R, 0.008 * HEX_R)); }
function getGS6Finial():  THREE.BoxGeometry { return (gS6Finial  ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.024 * HEX_R, 0.024 * HEX_R)); }
function getGS6CorDome():  THREE.CylinderGeometry { return (gS6CorDome  ||= new THREE.CylinderGeometry(0.066 * HEX_R, 0.084 * HEX_R, 0.128 * HEX_R, 9, 1)); }
function getGS6Slit():     THREE.BoxGeometry { return (gS6Slit     ||= new THREE.BoxGeometry(0.052 * HEX_R, 0.020 * HEX_R, 0.012 * HEX_R)); }
function getGS6CrestBase():THREE.BoxGeometry { return (gS6CrestBase||= new THREE.BoxGeometry(0.024 * HEX_R, 0.034 * HEX_R, 0.130 * HEX_R)); }
function getGS6CrestTall():THREE.BoxGeometry { return (gS6CrestTall||= new THREE.BoxGeometry(0.030 * HEX_R, 0.104 * HEX_R, 0.196 * HEX_R)); }
function getGS6CrestCurl():THREE.BoxGeometry { return (gS6CrestCurl||= new THREE.BoxGeometry(0.030 * HEX_R, 0.052 * HEX_R, 0.034 * HEX_R)); }
function getGS6PecPlate(): THREE.BoxGeometry { return (gS6PecPlate ||= new THREE.BoxGeometry(0.150 * HEX_R, 0.050 * HEX_R, 0.012 * HEX_R)); }
function getGS6AbsPlate(): THREE.BoxGeometry { return (gS6AbsPlate ||= new THREE.BoxGeometry(0.104 * HEX_R, 0.030 * HEX_R, 0.012 * HEX_R)); }
function getGS6Cloak():    THREE.BoxGeometry { return (gS6Cloak    ||= new THREE.BoxGeometry(0.196 * HEX_R, 0.170 * HEX_R, 0.014 * HEX_R)); }
function getGS6AspisFace():THREE.CylinderGeometry { return (gS6AspisFace ||= new THREE.CylinderGeometry(0.128 * HEX_R, 0.100 * HEX_R, 0.034 * HEX_R, 10, 1)); }
function getGS6AspisRim(): THREE.CylinderGeometry { return (gS6AspisRim  ||= new THREE.CylinderGeometry(0.140 * HEX_R, 0.140 * HEX_R, 0.020 * HEX_R, 10, 1, true)); }
function getGS6ThetaRing():THREE.CylinderGeometry { return (gS6ThetaRing ||= new THREE.CylinderGeometry(0.062 * HEX_R, 0.062 * HEX_R, 0.014 * HEX_R, 6, 1, true)); }
function getGS6ThetaBar(): THREE.BoxGeometry { return (gS6ThetaBar ||= new THREE.BoxGeometry(0.086 * HEX_R, 0.018 * HEX_R, 0.010 * HEX_R)); }
function getGS6DoryShaft():THREE.BoxGeometry { return (gS6DoryShaft||= new THREE.BoxGeometry(0.021 * HEX_R, 0.740 * HEX_R, 0.021 * HEX_R)); }
function getGS6DoryTip():  THREE.ConeGeometry{ return (gS6DoryTip  ||= new THREE.ConeGeometry(0.020 * HEX_R, 0.062 * HEX_R, 4)); }
function getGS6Sauroter(): THREE.BoxGeometry { return (gS6Sauroter ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.055 * HEX_R, 0.022 * HEX_R)); }
function getGS6MontBowl(): THREE.CylinderGeometry { return (gS6MontBowl ||= new THREE.CylinderGeometry(0.050 * HEX_R, 0.093 * HEX_R, 0.092 * HEX_R, 8, 1)); }
function getGS6Cheek():    THREE.BoxGeometry { return (gS6Cheek    ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.052 * HEX_R, 0.044 * HEX_R)); }
function getGS6PlumeRom(): THREE.BoxGeometry { return (gS6PlumeRom ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.118 * HEX_R, 0.013 * HEX_R)); }
function getGS6Phalera():  THREE.BoxGeometry { return (gS6Phalera  ||= new THREE.BoxGeometry(0.038 * HEX_R, 0.038 * HEX_R, 0.012 * HEX_R)); }
function getGS6Umbo():     THREE.BoxGeometry { return (gS6Umbo     ||= new THREE.BoxGeometry(0.050 * HEX_R, 0.050 * HEX_R, 0.024 * HEX_R)); }
function getGS6WingRom():  THREE.BoxGeometry { return (gS6WingRom  ||= new THREE.BoxGeometry(0.058 * HEX_R, 0.020 * HEX_R, 0.008 * HEX_R)); }
function getGS6Wreath():   THREE.CylinderGeometry { return (gS6Wreath ||= new THREE.CylinderGeometry(0.056 * HEX_R, 0.056 * HEX_R, 0.012 * HEX_R, 8, 1, true)); }
function getGS6Blade():    THREE.BoxGeometry { return (gS6Blade    ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.135 * HEX_R, 0.014 * HEX_R)); }
function getGS6BladeTip(): THREE.ConeGeometry{ return (gS6BladeTip ||= new THREE.ConeGeometry(0.016 * HEX_R, 0.040 * HEX_R, 4)); }
function getGS6Guard():    THREE.BoxGeometry { return (gS6Guard    ||= new THREE.BoxGeometry(0.056 * HEX_R, 0.018 * HEX_R, 0.024 * HEX_R)); }

// ── owalna skorupa scutum (jak hastati-falangita: fasetowany obrys elipsy) ──
function s6OvalRing(a: number, b: number, c: number, N: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(ang) * a, y = Math.sin(ang) * b;
    pts.push([x, y, -c * (x / a) * (x / a)]);
  }
  return pts;
}
function s6OvalShellGeo(a: number, b: number, c: number, t: number, N: number): THREE.BufferGeometry {
  const ring = s6OvalRing(a, b, c, N);
  const pos: number[] = [];
  const P = (x: number, y: number, z: number) => { pos.push(x, y, z); };
  const Fz = t * 0.5, B = -t * 0.5;
  for (let i = 0; i < N; i++) {
    const p = ring[i]!, q = ring[(i + 1) % N]!;
    P(0, 0, Fz); P(p[0], p[1], p[2] + Fz); P(q[0], q[1], q[2] + Fz);
    P(0, 0, B); P(q[0], q[1], q[2] + B); P(p[0], p[1], p[2] + B);
    P(p[0], p[1], p[2] + Fz); P(p[0], p[1], p[2] + B); P(q[0], q[1], q[2] + B);
    P(p[0], p[1], p[2] + Fz); P(q[0], q[1], q[2] + B); P(q[0], q[1], q[2] + Fz);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function s6OvalFaceGeo(a: number, b: number, c: number, N: number): THREE.BufferGeometry {
  const ring = s6OvalRing(a, b, c, N);
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
function getGS6ScutShell(): THREE.BufferGeometry { return (gS6ScutShell ||= s6OvalShellGeo(0.104 * HEX_R, 0.190 * HEX_R, 0.052 * HEX_R, 0.020 * HEX_R, 10)); }
function getGS6ScutFace():  THREE.BufferGeometry { return (gS6ScutFace  ||= s6OvalFaceGeo(0.0874 * HEX_R, 0.1596 * HEX_R, 0.0367 * HEX_R, 10)); }

// ── lancuch konczyn (konwencja niSeg/niBuildLeg/niBuildArm serii) ───────────
function s6DirDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}
function s6Seg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = s6DirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}
function s6BuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  mFoot: THREE.MeshStandardMaterial, hipY: number = S6_HIP_Y,
): void {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = s6Seg(group, getGS6Thigh(), mThigh, P, thU, S6_THIGH_L);
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = s6Seg(group, getGS6Shin(), mShin, P, thL, S6_SHIN_L);
  const foot = new THREE.Mesh(getGS6Foot(), mFoot);
  foot.position.set(sx, 0.013 * HEX_R, P.z + 0.016 * HEX_R);
  group.add(foot);
}
function s6BuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  let P = new THREE.Vector3(sx, S6_SHLD_Y, 0);
  P = s6Seg(group, getGS6UpArm(), mUp, P, thU, S6_UPARM_L);
  P.y += 0.010 * HEX_R;
  const wrist = s6Seg(group, getGS6Forearm(), mFore, P, thF, S6_FOREARM_L);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getGS6Fist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(s6DirDown(thF), 0.014 * HEX_R));
    group.add(fist);
  }
  return { wrist, axis: s6DirDown(thF) };
}
/** Korpus: tors + szyja + glowa (+ opcjonalnie oczy przy odkrytej twarzy). */
function s6Core(
  group: THREE.Group, mat: MatFactory, mTorso: THREE.MeshStandardMaterial,
  skinColor: number, eyes: boolean,
): THREE.MeshStandardMaterial {
  const torso = new THREE.Mesh(getGS6Torso(), mTorso);
  torso.position.set(0, S6_TORSO_CTR, 0);
  group.add(torso);
  const mSkin = mat(skinColor, 0.05, 0.80);
  const neck = new THREE.Mesh(getGS6Neck(), mSkin);
  neck.position.set(0, S6_TORSO_TOP + S6_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(getGS6Head(), mSkin);
  head.position.set(0, S6_HEAD_CTR, 0);
  group.add(head);
  if (eyes) {
    const mEye = mat(S6_EYE, 0.02, 0.95);
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(getGS6Eye(), mEye);
      eye.position.set(sx * 0.028 * HEX_R, S6_HEAD_CTR + 0.008 * HEX_R, S6_HEAD_S * 0.5 + 0.004 * HEX_R);
      group.add(eye);
    }
  }
  return mSkin;
}
/**
 * CHORAGIEW NA PLECACH — znacznik SUPER (konwencja P2/Inka): drzewce za plecami
 * pochylone -0.14, flaga = KOLOR GRACZA, ZLOTY szescienny finial (akcent elit).
 */
function s6Banner(
  group: THREE.Group, mPole: THREE.MeshStandardMaterial,
  mFlag: THREE.MeshStandardMaterial, mGold: THREE.MeshStandardMaterial,
): void {
  const pole = new THREE.Mesh(getGS6Pole(), mPole);
  pole.rotation.x = -0.14;
  pole.position.set(-0.052 * HEX_R, 0.340 * HEX_R, -0.086 * HEX_R);
  group.add(pole);
  const flag = new THREE.Mesh(getGS6Flag(), mFlag);
  flag.rotation.x = -0.14;
  flag.position.set(-0.100 * HEX_R, 0.548 * HEX_R, -0.115 * HEX_R);
  group.add(flag);
  const fin = new THREE.Mesh(getGS6Finial(), mGold);
  fin.position.set(-0.052 * HEX_R, 0.600 * HEX_R, -0.122 * HEX_R);
  group.add(fin);
}

// ---------------------------------------------------------------------------
// HIEROS LOCHOS / SWIETY ZASTEP (Grecja, SUPER braz) — ~488 tri, POZA ATAKU
// Elitarny hoplita: koryncki helm z WYSOKIM karmazynowym grzebieniem i przednim
// lokiem, muskularny kirys z brazu (plyta piersiowa + miesnie brzucha), krotki
// PURPUROWY plaszcz, aspis (pole = KOLOR GRACZA) z brazowym motywem THETA,
// dory nadrecznie (grot w przod), nagolenniki, choragiew na plecach.
// ---------------------------------------------------------------------------
export function buildSuperGreece(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mBronze = mat(S6_BRONZE,    0.40, 0.42);
  const mBronzL = mat(S6_BRONZE_LT, 0.55, 0.35);
  const mGold   = mat(S6_GOLD,      0.58, 0.32);
  const mSteel  = mat(S6_STEEL,     0.50, 0.40);
  const mCrest  = mat(S6_CRIMSON,   0.08, 0.74);
  const mPurple = mat(S6_PURPLE,    0.06, 0.78);
  const mOwner  = mat(ownerColor_,  0.16, 0.62);
  const mWood   = mat(S6_WOOD,      0.05, 0.85);
  const mWoodD  = mat(S6_WOOD_DK,   0.05, 0.85);
  const mLeath  = mat(S6_LEATHER,   0.06, 0.82);
  const mDark   = mat(S6_DARK,      0.05, 0.90);

  const HIP_Y = S6_HIP_Y - 0.012 * HEX_R;   // gleboki wypad

  // korpus: tors = kirys z brazu; twarz pod korynckim helmem (bez oczu)
  const mSkin = s6Core(group, mat, mBronze, S6_SKIN, false);
  // muskularny kirys: plyta piersiowa + linia miesni brzucha (jasny braz)
  const pec = new THREE.Mesh(getGS6PecPlate(), mBronzL);
  pec.position.set(0, S6_TORSO_CTR + 0.048 * HEX_R, S6_TORSO_D * 0.5 + 0.008 * HEX_R);
  group.add(pec);
  const abs = new THREE.Mesh(getGS6AbsPlate(), mBronzL);
  abs.position.set(0, S6_TORSO_CTR - 0.024 * HEX_R, S6_TORSO_D * 0.5 + 0.008 * HEX_R);
  group.add(abs);
  // krotki purpurowy plaszcz elity za plecami
  const cloak = new THREE.Mesh(getGS6Cloak(), mPurple);
  cloak.rotation.x = 0.16;
  cloak.position.set(0, S6_TORSO_CTR + 0.012 * HEX_R, -S6_TORSO_D * 0.5 - 0.016 * HEX_R);
  group.add(cloak);
  // pterugesy skorzane + pas
  const skirt = new THREE.Mesh(getGS6Skirt(), mLeath);
  skirt.position.set(0, S6_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const belt = new THREE.Mesh(getGS6Belt(), mBronzL);
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);

  // nogi w wypadzie + nagolenniki z jasnego brazu na obu goleniach
  s6BuildLeg(group,  S6_HIP_X,  0.55,  0.30, mBronze, mSkin, mLeath, HIP_Y);
  s6BuildLeg(group, -S6_HIP_X, -0.50, -0.16, mBronze, mSkin, mLeath, HIP_Y);
  const grF = new THREE.Mesh(getGS6Greave(), mBronzL);
  grF.rotation.x = Math.PI - 0.30;
  grF.position.set(S6_HIP_X, 0.072 * HEX_R, 0.070 * HEX_R);
  group.add(grF);
  const grB = new THREE.Mesh(getGS6Greave(), mBronzL);
  grB.rotation.x = Math.PI + 0.16;
  grB.position.set(-S6_HIP_X, 0.068 * HEX_R, -0.052 * HEX_R);
  group.add(grB);

  // HELM KORYNCKI + WYSOKI grzebien (baza + wlosie + przedni lok)
  const dome = new THREE.Mesh(getGS6CorDome(), mBronze);
  dome.position.set(0, S6_HEAD_CTR + 0.014 * HEX_R, 0);
  group.add(dome);
  const slit = new THREE.Mesh(getGS6Slit(), mDark);
  slit.position.set(0, S6_HEAD_CTR + 0.002 * HEX_R, 0.062 * HEX_R);
  group.add(slit);
  const crB = new THREE.Mesh(getGS6CrestBase(), mBronzL);
  crB.position.set(0, S6_HEAD_TOP + 0.028 * HEX_R, -0.006 * HEX_R);
  group.add(crB);
  const crT = new THREE.Mesh(getGS6CrestTall(), mCrest);
  crT.rotation.x = 0.10;
  crT.position.set(0, S6_HEAD_TOP + 0.096 * HEX_R, -0.012 * HEX_R);
  group.add(crT);
  const crC = new THREE.Mesh(getGS6CrestCurl(), mCrest);
  crC.rotation.x = 0.42;
  crC.position.set(0, S6_HEAD_TOP + 0.128 * HEX_R, 0.086 * HEX_R);
  group.add(crC);

  // PRAWE (-X) RAMIE + DORY NADRECZNIE (lokiec nad barkiem, grot w przod-dol)
  const armR = s6BuildArm(group, -S6_SHLD_X, -2.55, 1.32, mBronze, mSkin, mLeath);
  const spearTh = Math.PI * 0.5 + 0.20;
  const spearAxis = new THREE.Vector3(0, -Math.sin(0.20), Math.cos(0.20));
  const grip = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  const shaft = new THREE.Mesh(getGS6DoryShaft(), mWood);
  shaft.rotation.x = spearTh;
  shaft.position.copy(grip.clone().addScaledVector(spearAxis, 0.130 * HEX_R));
  group.add(shaft);
  const dtip = new THREE.Mesh(getGS6DoryTip(), mSteel);
  dtip.rotation.x = spearTh;
  dtip.rotation.y = Math.PI / 4;
  dtip.position.copy(grip.clone().addScaledVector(spearAxis, (0.130 + 0.370 + 0.028) * HEX_R));
  group.add(dtip);
  const sauro = new THREE.Mesh(getGS6Sauroter(), mBronzL);
  sauro.rotation.x = spearTh;
  sauro.position.copy(grip.clone().addScaledVector(spearAxis, (0.130 - 0.370 - 0.024) * HEX_R));
  group.add(sauro);

  // LEWE (+X) RAMIE + ASPIS z motywem THETA przed korpusem
  const armL = s6BuildArm(group, S6_SHLD_X, 0.52, 1.05, mBronze, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.055 * HEX_R,
    armL.wrist.y + 0.065 * HEX_R,
    armL.wrist.z + 0.052 * HEX_R,
  );
  sh.rotation.y = -0.20;
  const face = new THREE.Mesh(getGS6AspisFace(), mOwner);   // pole = KOLOR GRACZA
  face.rotation.x = Math.PI / 2;
  sh.add(face);
  const rim = new THREE.Mesh(getGS6AspisRim(), mBronzL);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0, -0.004 * HEX_R);
  sh.add(rim);
  const thRing = new THREE.Mesh(getGS6ThetaRing(), mBronzL); // THETA: pierscien...
  thRing.rotation.x = Math.PI / 2;
  thRing.position.set(0, 0, 0.022 * HEX_R);
  sh.add(thRing);
  const thBar = new THREE.Mesh(getGS6ThetaBar(), mBronzL);   // ...+ pozioma belka
  thBar.position.set(0, 0, 0.024 * HEX_R);
  sh.add(thBar);
  group.add(sh);

  s6Banner(group, mWoodD, mOwner, mGold);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}
// ---------------------------------------------------------------------------
// EVOCATI (Rzym, SUPER braz) — ~490 tri, POZA ATAKU
// Weteran po wzorcu Hastatiego: czerwona tunika, POSREBRZANY montefortino
// z PODWOJNYM purpurowym pioropuszem i zlotymi policzkami, FALERY (3 krazki
// odznaczen na piersi), OWALNY wypukly SCUTUM (pole = KOLOR GRACZA jak
// Hastati) ze zlotymi SKRZYDLAMI, WIENCEM i umbo, gladius w pchnieciu,
// choragiew na plecach.
// ---------------------------------------------------------------------------
export function buildSuperRome(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mGold   = mat(S6_GOLD,      0.58, 0.32);
  const mSilver = mat(S6_SILVER,    0.62, 0.28);
  const mSteel  = mat(S6_STEEL,     0.55, 0.35);
  const mRed    = mat(S6_ROMAN_RED, 0.05, 0.80);
  const mPurple = mat(S6_PURPLE,    0.08, 0.72);
  const mOwner  = mat(ownerColor_,  0.15, 0.65);
  const mLeath  = mat(S6_LEATHER,   0.05, 0.82);
  const mWoodD  = mat(S6_WOOD_DK,   0.05, 0.85);

  const HIP_Y = S6_HIP_Y - 0.012 * HEX_R;   // gleboki wypad jak Hastati

  // korpus: czerwona tunika weterana + spodnica + pas
  const mSkin = s6Core(group, mat, mRed, S6_SKIN, false);
  const skirt = new THREE.Mesh(getGS6Skirt(), mRed);
  skirt.position.set(0, S6_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const belt = new THREE.Mesh(getGS6Belt(), mLeath);
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);
  // FALERY: trzy krazki odznaczen (zloto/srebro/zloto) na piersi
  let fi = 0;
  for (const dx of [-0.052, 0.0, 0.052]) {
    const ph = new THREE.Mesh(getGS6Phalera(), (fi++ % 2 === 0) ? mGold : mSilver);
    ph.rotation.z = Math.PI / 4;
    ph.position.set(dx * HEX_R, S6_TORSO_CTR + 0.034 * HEX_R, S6_TORSO_D * 0.5 + 0.010 * HEX_R);
    group.add(ph);
  }

  // nogi: gleboki wypad
  s6BuildLeg(group,  S6_HIP_X,  0.58,  0.34, mRed, mSkin, mLeath, HIP_Y);
  s6BuildLeg(group, -S6_HIP_X, -0.52, -0.20, mRed, mSkin, mLeath, HIP_Y);

  // POSREBRZANY MONTEFORTINO: miska + zlote policzki + PODWOJNY pioropusz
  const bowl = new THREE.Mesh(getGS6MontBowl(), mSilver);
  bowl.position.set(0, S6_HEAD_CTR + 0.030 * HEX_R, 0);
  group.add(bowl);
  for (const sx of [-1, 1]) {
    const ck = new THREE.Mesh(getGS6Cheek(), mGold);
    ck.position.set(sx * (S6_HEAD_S * 0.5 + 0.004 * HEX_R), S6_HEAD_CTR - 0.014 * HEX_R, 0.018 * HEX_R);
    group.add(ck);
  }
  for (const sx of [-1, 1]) {
    const pl = new THREE.Mesh(getGS6PlumeRom(), mPurple);
    pl.rotation.z = -sx * 0.12;
    pl.position.set(sx * 0.026 * HEX_R, S6_HEAD_TOP + 0.086 * HEX_R, 0);
    group.add(pl);
  }

  // PRAWE (-X) RAMIE + GLADIUS w pchnieciu na osi przedramienia
  const armR = s6BuildArm(group, -S6_SHLD_X, 0.95, 1.50, mRed, mSkin, mLeath);
  const blade = new THREE.Mesh(getGS6Blade(), mSteel);
  blade.rotation.x = Math.PI - 1.50;
  blade.position.copy(armR.wrist.clone().addScaledVector(armR.axis, 0.098 * HEX_R));
  group.add(blade);
  const btip = new THREE.Mesh(getGS6BladeTip(), mSteel);
  btip.rotation.x = Math.PI - 1.50;
  btip.rotation.y = Math.PI / 4;
  btip.position.copy(armR.wrist.clone().addScaledVector(armR.axis, 0.1875 * HEX_R));
  group.add(btip);
  const guard = new THREE.Mesh(getGS6Guard(), mGold);
  guard.rotation.x = Math.PI - 1.50;
  guard.position.copy(armR.wrist.clone().addScaledVector(armR.axis, 0.030 * HEX_R));
  group.add(guard);

  // LEWE (+X) RAMIE + OWALNY SCUTUM: pole = KOLOR GRACZA, zloty WIENIEC,
  // SKRZYDLA po bokach wienca i umbo (odznaka weteranow)
  const armL = s6BuildArm(group, S6_SHLD_X, 0.50, 1.10, mRed, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.025 * HEX_R,
    armL.wrist.y + 0.034 * HEX_R,
    armL.wrist.z + 0.045 * HEX_R,
  );
  sh.rotation.y = -0.22;
  const shell = new THREE.Mesh(getGS6ScutShell(), mLeath);
  sh.add(shell);
  const face = new THREE.Mesh(getGS6ScutFace(), mOwner);   // pole = KOLOR GRACZA
  face.position.set(0, 0, 0.016 * HEX_R);
  sh.add(face);
  const wreath = new THREE.Mesh(getGS6Wreath(), mGold);    // wieniec laurowy
  wreath.rotation.x = Math.PI / 2;
  wreath.position.set(0, 0, 0.024 * HEX_R);
  sh.add(wreath);
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(getGS6WingRom(), mGold);      // zlote skrzydla
    w.rotation.z = s * 0.45;
    w.position.set(s * 0.062 * HEX_R, 0.052 * HEX_R, 0.020 * HEX_R);
    sh.add(w);
  }
  const umbo = new THREE.Mesh(getGS6Umbo(), mGold);
  umbo.position.set(0, 0, 0.032 * HEX_R);
  sh.add(umbo);
  group.add(sh);

  s6Banner(group, mWoodD, mOwner, mGold);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}
