/**
 * kon-nowy-model.ts — NOWY proceduralny model konia (koncept, render-kon)
 * ---------------------------------------------------------------------------
 * Zamiennik 1:1 dla buildHorse() z render/units.ts:691 (wolany w:
 *   - case 'konnica'  units.ts:5071
 *   - case 'rydwan'   units.ts:5320  (2 konie + uprzaz)
 *   - onager          units.ts:2230  (2 konie + uprzaz)
 * Ten sam interfejs i konwencje:
 *   - kon zwrocony PRZODEM do -Z (leb ku -Z, ogon ku +Z),
 *   - kopyta na y = 0 grupy,
 *   - zwraca Y grzbietu (siodla) dla jezdzca,
 *   - WYLACZNIE geometrie-singletony (zero alokacji per token),
 *   - mHarn = null  ->  bez uprzezy (konnica).
 * UWAGA: zwracany horseBackY = 0.296*HEX_R (stary: 0.2724*HEX_R) — jezdziec
 * siada o ~0.024 wyzej; rydwan/onager bez zmian logiki (dyszel i tak nizej).
 *
 * Co nowego wzgledem starego modelu (252 tri -> 380 tri, ta sama skala):
 *   1. Sylwetka: beczka tulowia (7-katny walec) + organiczna piers i zad
 *      (ikosaedry) zamiast 3 prostopadloscianow; wyrazny klab.
 *   2. Szyja w luku: 3 zwezane segmenty 6-katne stawiane lancuchowo
 *      (-1.02 / -0.62 / -0.26 rad) — dumna, wygieta szyja bojowa.
 *   3. Leb: pochylona czaszka + zwezony pysk (4-katny stozek) + ostre uszy
 *      (stozki 3-katne) + grzywka; grzywa piaskami wzdluz karku.
 *   4. Nogi ze stawami (udo + nadpecie + kopyto, katy per noga) w dynamicznym
 *      wykroku: lewa przednia uniesiona (kolano wysoko), lewa tylna w napedzie.
 *   5. Ogon 2-segmentowy (nasada w gore-tyl + splyw) zamiast pojedynczego slupka.
 *
 * Wpiecie: wkleic ponizsze definicje do render/units.ts w miejsce starych
 * geoHorse* / getGeoHorse* / BH_* / buildHorse (linie ~345-357, ~450-461,
 * ~686-780). Typ MatFactory i stala HEX_R juz istnieja w units.ts.
 */

import * as THREE from 'three';
import { HEX_R } from './hexutil';

type MatFactory = (color: number, metalness?: number, roughness?: number,
                   transparent?: boolean, opacity?: number) => THREE.MeshStandardMaterial;

// ---------------------------------------------------------------------------
// Geometrie-singletony nowego konia (lazy, wspoldzielone przez wszystkie tokeny)
// ---------------------------------------------------------------------------
let geoNHBarrel:  THREE.CylinderGeometry | null = null;  // beczka tulowia (7-kat)
let geoNHChest:   THREE.IcosahedronGeometry | null = null; // piers / lopatka
let geoNHRump:    THREE.IcosahedronGeometry | null = null; // zad
let geoNHWithers: THREE.BoxGeometry | null = null;       // klab
let geoNHNeck1:   THREE.CylinderGeometry | null = null;  // szyja — nasada
let geoNHNeck2:   THREE.CylinderGeometry | null = null;  // szyja — srodek
let geoNHNeck3:   THREE.CylinderGeometry | null = null;  // szyja — kark
let geoNHSkull:   THREE.BoxGeometry | null = null;       // czaszka
let geoNHMuzzle:  THREE.CylinderGeometry | null = null;  // pysk (zwezony)
let geoNHEar:     THREE.ConeGeometry | null = null;      // ucho
let geoNHMane:    THREE.BoxGeometry | null = null;       // pas grzywy
let geoNHFore:    THREE.BoxGeometry | null = null;       // grzywka na czole
let geoNHUpFrnt:  THREE.BoxGeometry | null = null;       // ramie (przod)
let geoNHUpRear:  THREE.BoxGeometry | null = null;       // udo (tyl, masywne)
let geoNHLower:   THREE.BoxGeometry | null = null;       // nadpecie
let geoNHHoof:    THREE.BoxGeometry | null = null;       // kopyto
let geoNHTail1:   THREE.CylinderGeometry | null = null;  // ogon — nasada
let geoNHTail2:   THREE.CylinderGeometry | null = null;  // ogon — splyw
let geoNHGirth:   THREE.CylinderGeometry | null = null;  // poprega (uprzaz)
let geoNHBreast:  THREE.BoxGeometry | null = null;       // napiersnik (uprzaz)

function getGeoNHBarrel():  THREE.CylinderGeometry  { return (geoNHBarrel  ||= new THREE.CylinderGeometry(0.064 * HEX_R, 0.057 * HEX_R, 0.235 * HEX_R, 7, 1)); }
function getGeoNHChest():   THREE.IcosahedronGeometry { return (geoNHChest ||= new THREE.IcosahedronGeometry(0.070 * HEX_R, 0)); }
function getGeoNHRump():    THREE.IcosahedronGeometry { return (geoNHRump  ||= new THREE.IcosahedronGeometry(0.068 * HEX_R, 0)); }
function getGeoNHWithers(): THREE.BoxGeometry      { return (geoNHWithers ||= new THREE.BoxGeometry(0.054 * HEX_R, 0.056 * HEX_R, 0.106 * HEX_R)); }
function getGeoNHNeck1():   THREE.CylinderGeometry { return (geoNHNeck1   ||= new THREE.CylinderGeometry(0.041 * HEX_R, 0.053 * HEX_R, 0.088 * HEX_R, 6, 1, true)); }
function getGeoNHNeck2():   THREE.CylinderGeometry { return (geoNHNeck2   ||= new THREE.CylinderGeometry(0.034 * HEX_R, 0.041 * HEX_R, 0.078 * HEX_R, 6, 1, true)); }
function getGeoNHNeck3():   THREE.CylinderGeometry { return (geoNHNeck3   ||= new THREE.CylinderGeometry(0.028 * HEX_R, 0.034 * HEX_R, 0.064 * HEX_R, 6, 1, true)); }
function getGeoNHSkull():   THREE.BoxGeometry      { return (geoNHSkull   ||= new THREE.BoxGeometry(0.060 * HEX_R, 0.070 * HEX_R, 0.088 * HEX_R)); }
function getGeoNHMuzzle():  THREE.CylinderGeometry { return (geoNHMuzzle  ||= new THREE.CylinderGeometry(0.019 * HEX_R, 0.028 * HEX_R, 0.086 * HEX_R, 4, 1)); }
function getGeoNHEar():     THREE.ConeGeometry     { return (geoNHEar     ||= new THREE.ConeGeometry(0.013 * HEX_R, 0.042 * HEX_R, 3)); }
function getGeoNHMane():    THREE.BoxGeometry      { return (geoNHMane    ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.100 * HEX_R, 0.024 * HEX_R)); }
function getGeoNHFore():    THREE.BoxGeometry      { return (geoNHFore    ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.048 * HEX_R, 0.018 * HEX_R)); }
function getGeoNHUpFrnt():  THREE.BoxGeometry      { return (geoNHUpFrnt  ||= new THREE.BoxGeometry(0.036 * HEX_R, 0.104 * HEX_R, 0.046 * HEX_R)); }
function getGeoNHUpRear():  THREE.BoxGeometry      { return (geoNHUpRear  ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.112 * HEX_R, 0.054 * HEX_R)); }
function getGeoNHLower():   THREE.BoxGeometry      { return (geoNHLower   ||= new THREE.BoxGeometry(0.021 * HEX_R, 0.088 * HEX_R, 0.025 * HEX_R)); }
function getGeoNHHoof():    THREE.BoxGeometry      { return (geoNHHoof    ||= new THREE.BoxGeometry(0.031 * HEX_R, 0.024 * HEX_R, 0.038 * HEX_R)); }
function getGeoNHTail1():   THREE.CylinderGeometry { return (geoNHTail1   ||= new THREE.CylinderGeometry(0.013 * HEX_R, 0.017 * HEX_R, 0.050 * HEX_R, 4, 1)); }
function getGeoNHTail2():   THREE.CylinderGeometry { return (geoNHTail2   ||= new THREE.CylinderGeometry(0.006 * HEX_R, 0.013 * HEX_R, 0.112 * HEX_R, 4, 1)); }
function getGeoNHGirth():   THREE.CylinderGeometry { return (geoNHGirth   ||= new THREE.CylinderGeometry(0.071 * HEX_R, 0.071 * HEX_R, 0.020 * HEX_R, 7, 1, true)); }
function getGeoNHBreast():  THREE.BoxGeometry      { return (geoNHBreast  ||= new THREE.BoxGeometry(0.100 * HEX_R, 0.018 * HEX_R, 0.014 * HEX_R)); }

// ── wysokosci sylwetki ──────────────────────────────────────────────────────
const NH_BODY_CTR  = 0.221 * HEX_R;  // srodek beczki tulowia
const NH_BACK_Y    = 0.296 * HEX_R;  // grzbiet / siodlo (zwracane)
const NH_LEG_TOP_F = 0.196 * HEX_R;  // staw barkowy (przod)
const NH_LEG_TOP_R = 0.200 * HEX_R;  // staw biodrowy (tyl)

// ---------------------------------------------------------------------------
// Pomocnicze: segment lancucha (szyja / ogon) — mesh od punktu P pod katem
// theta (rot.x; 0 = pion, ujemny = pochylenie ku -Z), zwraca punkt koncowy.
// ---------------------------------------------------------------------------
function nhChainSeg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number, phase = 0,
): THREE.Vector3 {
  const dir = new THREE.Vector3(0, Math.cos(theta), Math.sin(theta));
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = theta;
  if (phase !== 0) mesh.rotation.y = phase;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

// ---------------------------------------------------------------------------
// Noga ze stawem: udo/ramie + nadpecie + kopyto, liczone lancuchowo w dol od
// stawu. thU / thL — katy segmentow (rot.x; + = kolano/kopyto ku przodowi -Z).
// Kopyto laduje na y=0 dla nog podporowych (katy dobrane), a noga wykroczna
// (duze thU) naturalnie zawisa nad ziemia.
// ---------------------------------------------------------------------------
function nhBuildLeg(
  group: THREE.Group, mHorse: THREE.MeshStandardMaterial, mHoof: THREE.MeshStandardMaterial,
  sx: number, zPiv: number, yPiv: number, thU: number, thL: number, rear: boolean,
  cx: number, cz: number,
): void {
  const Lu = rear ? 0.092 * HEX_R : 0.088 * HEX_R;
  const Ll = 0.080 * HEX_R;
  const dU = new THREE.Vector3(0, -Math.cos(thU), -Math.sin(thU));
  const dL = new THREE.Vector3(0, -Math.cos(thL), -Math.sin(thL));
  const P0 = new THREE.Vector3(cx + sx, yPiv, cz + zPiv);
  const P1 = P0.clone().addScaledVector(dU, Lu);
  const P2 = P1.clone().addScaledVector(dL, Ll);

  const up = new THREE.Mesh(rear ? getGeoNHUpRear() : getGeoNHUpFrnt(), mHorse);
  up.rotation.x = -thU;
  up.position.copy(P0.clone().addScaledVector(dU, Lu * 0.5));
  group.add(up);

  const lo = new THREE.Mesh(getGeoNHLower(), mHorse);
  lo.rotation.x = -thL;
  lo.position.copy(P1.clone().addScaledVector(dL, Ll * 0.5 - 0.010 * HEX_R)); // zakladka w stawie
  group.add(lo);

  const hoof = new THREE.Mesh(getGeoNHHoof(), mHoof);
  hoof.position.set(P2.x, P2.y - 0.0096 * HEX_R, P2.z - 0.004 * HEX_R);
  group.add(hoof);
}

// ---------------------------------------------------------------------------
// buildHorse — NOWY kon (zamiennik units.ts:691; interfejs bez zmian)
//
//   group  — grupa docelowa (meshe dodawane bezposrednio)
//   mat    — fabryka materialow (nieuzywana; zachowana dla zgodnosci wywolan)
//   mHorse — material ciala konia
//   mMane  — material grzywy / ogona / kopyt
//   mHarn  — material uprzezy (null = bez uprzezy, np. konnica)
//   cx, cz — offset srodka konia w grupie
//
// Zwraca Y grzbietu konia (miejsce jezdzca). Kopyta na y=0. Przod ku -Z.
// ---------------------------------------------------------------------------
export function buildHorse(
  group:  THREE.Group,
  mat:    MatFactory,
  mHorse: THREE.MeshStandardMaterial,
  mMane:  THREE.MeshStandardMaterial,
  mHarn:  THREE.MeshStandardMaterial | null,
  cx:     number,
  cz:     number,
): number {
  void mat; // zgodnosc interfejsu — nowe elementy uzywaja przekazanych materialow

  // ── TULOW: beczka + piers + zad + klab ─────────────────────────────────
  const barrel = new THREE.Mesh(getGeoNHBarrel(), mHorse);
  barrel.rotation.x = -Math.PI / 2;      // os walca wzdluz Z, szerszy koniec ku piersi
  barrel.rotation.y = Math.PI / 7;       // krawedz 7-kata ku gorze (plaski grzbiet)
  barrel.scale.set(0.82, 1, 1.06);       // waska, gleboka klatka
  barrel.position.set(cx, NH_BODY_CTR, cz + 0.004 * HEX_R);
  group.add(barrel);

  const chest = new THREE.Mesh(getGeoNHChest(), mHorse);
  chest.scale.set(0.80, 1.00, 0.95);
  chest.position.set(cx, NH_BODY_CTR + 0.002 * HEX_R, cz - 0.130 * HEX_R);
  group.add(chest);

  const rump = new THREE.Mesh(getGeoNHRump(), mHorse);
  rump.scale.set(0.86, 0.98, 1.12);
  rump.position.set(cx, NH_BODY_CTR - 0.004 * HEX_R, cz + 0.130 * HEX_R);
  group.add(rump);

  const withers = new THREE.Mesh(getGeoNHWithers(), mHorse);
  withers.rotation.x = -0.22;
  withers.position.set(cx, NH_BODY_CTR + 0.046 * HEX_R, cz - 0.088 * HEX_R);
  group.add(withers);

  // ── SZYJA W LUKU: 3 segmenty lancuchowo, coraz bardziej pionowe ────────
  const thetas = [-1.02, -0.62, -0.26];
  const lens   = [0.082 * HEX_R, 0.072 * HEX_R, 0.058 * HEX_R];
  const geos   = [getGeoNHNeck1(), getGeoNHNeck2(), getGeoNHNeck3()];
  let P = new THREE.Vector3(cx, NH_BODY_CTR + 0.032 * HEX_R, cz - 0.140 * HEX_R);
  const neckPts: THREE.Vector3[] = [P.clone()];
  for (let i = 0; i < 3; i++) {
    P = nhChainSeg(group, geos[i]!, mHorse, P, thetas[i]!, lens[i]!, Math.PI / 6);
    neckPts.push(P.clone());
  }

  // ── LEB: czaszka + pysk + uszy ─────────────────────────────────────────
  const headP = new THREE.Vector3(cx, P.y + 0.012 * HEX_R, P.z - 0.022 * HEX_R);
  const skull = new THREE.Mesh(getGeoNHSkull(), mHorse);
  skull.rotation.x = -0.20;              // nos lekko w dol — dumna postawa
  skull.position.copy(headP);
  group.add(skull);

  const muzDir = new THREE.Vector3(0, -0.31, -0.951);
  const muzzle = new THREE.Mesh(getGeoNHMuzzle(), mHorse);
  muzzle.rotation.x = -1.886;            // os walca wzdluz muzDir (zwezenie ku nozdrzom)
  muzzle.rotation.y = Math.PI / 4;
  muzzle.position.copy(
    headP.clone()
      .add(new THREE.Vector3(0, -0.012 * HEX_R, -0.036 * HEX_R))
      .addScaledVector(muzDir, 0.034 * HEX_R),
  );
  group.add(muzzle);

  for (const side of [-1, 1] as const) {
    const ear = new THREE.Mesh(getGeoNHEar(), mHorse);
    ear.position.set(cx + side * 0.020 * HEX_R, headP.y + 0.052 * HEX_R, headP.z + 0.016 * HEX_R);
    ear.rotation.z = -side * 0.30;
    ear.rotation.x = -0.18;
    group.add(ear);
  }

  // ── GRZYWA wzdluz karku + grzywka na czole ─────────────────────────────
  const maneRad = [0.048 * HEX_R, 0.040 * HEX_R, 0.034 * HEX_R];
  for (let i = 0; i < 3; i++) {
    const th = thetas[i]!;
    const mid = neckPts[i]!.clone().add(neckPts[i + 1]!).multiplyScalar(0.5);
    const perp = new THREE.Vector3(0, -Math.sin(th), Math.cos(th)); // grzbietowa strona szyi
    const seg = new THREE.Mesh(getGeoNHMane(), mMane);
    seg.scale.y = (lens[i]! / (0.100 * HEX_R)) * 1.12;
    seg.rotation.x = th;
    seg.position.copy(mid.clone().addScaledVector(perp, maneRad[i]!));
    group.add(seg);
  }
  const fore = new THREE.Mesh(getGeoNHFore(), mMane);
  fore.rotation.x = -0.72;
  fore.position.set(cx, headP.y + 0.040 * HEX_R, headP.z - 0.026 * HEX_R);
  group.add(fore);

  // ── NOGI ZE STAWAMI — dynamiczny wykrok ────────────────────────────────
  // prawa przednia: podpor | lewa przednia: uniesiona (kolano wysoko)
  // lewa tylna: naped w tyl | prawa tylna: podstawiona
  const X = 0.052 * HEX_R;
  nhBuildLeg(group, mHorse, mMane,  X, -0.118 * HEX_R, NH_LEG_TOP_F,        0.10, -0.06, false, cx, cz);
  nhBuildLeg(group, mHorse, mMane, -X, -0.110 * HEX_R, 0.206 * HEX_R,       1.00, -0.18, false, cx, cz);
  nhBuildLeg(group, mHorse, mMane, -X,  0.116 * HEX_R, NH_LEG_TOP_R,       -0.34, -0.10, true,  cx, cz);
  nhBuildLeg(group, mHorse, mMane,  X,  0.116 * HEX_R, NH_LEG_TOP_R,        0.24,  0.04, true,  cx, cz);

  // ── OGON: nasada w gore-tyl + splyw w dol ──────────────────────────────
  let T = new THREE.Vector3(cx, NH_BODY_CTR + 0.034 * HEX_R, cz + 0.196 * HEX_R);
  T = nhChainSeg(group, getGeoNHTail1(), mMane, T, 1.10, 0.048 * HEX_R);
  nhChainSeg(group, getGeoNHTail2(), mMane, T, 2.76, 0.108 * HEX_R);

  // ── UPRZAZ (rydwan / onager) ───────────────────────────────────────────
  if (mHarn !== null) {
    const girth = new THREE.Mesh(getGeoNHGirth(), mHarn);
    girth.rotation.x = -Math.PI / 2;
    girth.rotation.y = Math.PI / 7;
    girth.scale.set(0.85, 1, 1.09);
    girth.position.set(cx, NH_BODY_CTR, cz + 0.042 * HEX_R);
    group.add(girth);
    const breast = new THREE.Mesh(getGeoNHBreast(), mHarn);
    breast.position.set(cx, NH_BODY_CTR + 0.016 * HEX_R, cz - 0.196 * HEX_R);
    group.add(breast);
  }

  return NH_BACK_Y;
}

// ---------------------------------------------------------------------------
// OPCJONALNE: nogi jezdzca w siodle (stary jezdziec konnicy jest beznogi).
// Wolac w case 'konnica' po zbudowaniu jezdzca:
//   addRiderLegs(group, mCloth, mat(0x3a2414, 0.05, 0.85), horseBackY);
// Uzywa geometrii per-token — dodac zwracane geo do userData['perTokenGeos']
// albo przeniesc na singletony analogicznie jak wyzej.
// ---------------------------------------------------------------------------
export function addRiderLegs(
  group: THREE.Group,
  mCloth: THREE.MeshStandardMaterial,
  mBoot: THREE.MeshStandardMaterial,
  riderBotY: number,
): THREE.BufferGeometry[] {
  const gThigh = new THREE.BoxGeometry(0.042 * HEX_R, 0.088 * HEX_R, 0.048 * HEX_R);
  const gShin  = new THREE.BoxGeometry(0.026 * HEX_R, 0.086 * HEX_R, 0.030 * HEX_R);
  const gBoot  = new THREE.BoxGeometry(0.030 * HEX_R, 0.022 * HEX_R, 0.054 * HEX_R);
  for (const s of [-1, 1] as const) {
    const thigh = new THREE.Mesh(gThigh, mCloth);
    thigh.rotation.x = -1.24;
    thigh.position.set(s * 0.064 * HEX_R, riderBotY + 0.010 * HEX_R, -0.020 * HEX_R);
    group.add(thigh);
    const shin = new THREE.Mesh(gShin, mCloth);
    shin.rotation.x = 0.10;
    shin.position.set(s * 0.076 * HEX_R, riderBotY - 0.048 * HEX_R, -0.058 * HEX_R);
    group.add(shin);
    const boot = new THREE.Mesh(gBoot, mBoot);
    boot.position.set(s * 0.076 * HEX_R, riderBotY - 0.094 * HEX_R, -0.066 * HEX_R);
    group.add(boot);
  }
  return [gThigh, gShin, gBoot];
}

// ---------------------------------------------------------------------------
// SUGESTIA (bug w obecnym units.ts:5138-5156): grot i proporczyk lancy sa
// pozycjonowane POZA osia drzewca (lataja w powietrzu obok konia). Poprawka —
// liczyc pozycje z osi lancy:
//   const th   = Math.PI * 0.5 + 0.34;                       // przod-gora
//   const axis = new THREE.Vector3(0, Math.cos(th), Math.sin(th));
//   const CTR  = new THREE.Vector3(RSPEAR_X, R_ARM_CTR + 0.075, -0.085);
//   mLance.rotation.x = th;  mLance.position.copy(CTR);
//   mLanceTip.rotation.x = th;
//   mLanceTip.position.copy(CTR.clone().addScaledVector(axis, -0.295));
//   mPennon.rotation.x = th;
//   mPennon.position.copy(CTR.clone().addScaledVector(axis, -0.225))
//          .add(new THREE.Vector3(0, -0.028, 0));
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// KONIE NA MAPIE (złoże/dekoracja terenu) — 2 konie BEZ jeźdźca w slotach na
// obrzeżu heksa (środek wolny pod przyszłą stajnię/zagrodę). Różne rotY, jeden
// wariant maści. Materiały MeshStandard (spójne z jednostkami). GRAFIKA-3D partia 1 item 2.
// ---------------------------------------------------------------------------
export function buildZlozeKonie(hexR: number = HEX_R): THREE.Group {
  const g = new THREE.Group();
  const std = (c: number): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.85, metalness: 0.05 });
  const matF: MatFactory = (c) => std(c);
  // Maciej 2026-07-09: JEDEN koń, mały, MOCNO przy krawędzi heksa (środek wolny pod miasto).
  // Skala 0.18 (0.125 był trochę za mały); pozycja na obrzeżu ~0.82 R (sektor E).
  const konie = [
    { x: 0.80, z: -0.14, rotY: 2.30, body: 0x6b4a2f, mane: 0x2a1c12 },  // gniady, przy krawędzi
  ] as const;
  for (const k of konie) {
    const sub = new THREE.Group();
    buildHorse(sub, matF, std(k.body), std(k.mane), null, 0, 0);
    sub.scale.setScalar(0.18);
    sub.position.set(k.x * hexR, 0, k.z * hexR);
    sub.rotation.y = k.rotY;
    g.add(sub);
  }
  return g;
}
