/**
 * hastati-opus5.ts — WARIANT PORÓWNAWCZY modelu HASTATI (nie podpięty do gry)
 * ---------------------------------------------------------------------------
 * Drop-in zgodny z `buildHastati(ownerColor)` z hastati-falangita.ts:
 *   - ta sama sygnatura: (ownerColor: number) => THREE.Group,
 *   - figurka PRZODEM do +Z, stopy na y = 0 grupy, ta sama wysokosc sylwetki,
 *   - group.userData['mats'] i ['perTokenGeos'] jak w calej serii,
 *   - geometrie wspolne = singletony modulu (perTokenGeos puste),
 *   - MeshStandardMaterial, paleta identyczna z units.ts / hastati-falangita.ts.
 *
 * NIE MODYFIKUJE istniejacego modelu — to osobny wariant do porownania
 * wizualnego (dyspozycje/PODGLAD-HASTATI-OPUS5.html).
 *
 * UKLAD STRON (jak w serii): przod = +Z, gora = +Y, uklad prawoskretny
 *   => LEWA reka = +X (tarcza), PRAWA = -X (bron).
 *
 * ---------------------------------------------------------------------------
 * ZGODNOSC HISTORYCZNA — hastatus republikanski, ok. 250–150 p.n.e.
 * Podstawa: Polibiusz VI.23 (opis uzbrojenia rzymskiej piechoty), znaleziska
 * helmow typu Montefortino, tarcza z Fajum (jedyne zachowane scutum, I w.p.n.e.),
 * pomnik Emiliusza Paulusa w Delfach (relief scutum z motywem skrzydel/pioruna).
 *
 *   1. SCUTUM — OWALNE, wypukle, ok. 2,5 x 4 stopy. Polibiusz: dwie warstwy
 *      drewna klejone klejem skornym, pokryte plotnem, potem cielecina;
 *      ZELAZNE OKUCIE GORNEJ I DOLNEJ KRAWEDZI (osobno, nie dookola!) oraz
 *      zelazne umbo. Spina = pionowe zebro. Umbo republikanskie = wydluzone
 *      wrzecionowate ("ziarno jeczmienia"), nie okragle cesarskie.
 *      -> modeluje: skorupa owalna (14 segmentow), pole = KOLOR GRACZA,
 *         spina pelnej wysokosci, wrzecionowate umbo, okucia TYLKO gora/dol,
 *         motyw skrzydel, porpax + poprzeczny chwyt za polem.
 *   2. HELM MONTEFORTINO — braz/mosiadz, kulista czasza, GUZ na szczycie
 *      (gniazdo kity), nakarczek, nauszniki. Polibiusz VI.23.12: wieniec
 *      TRZECH pionowych pior, purpurowych albo czarnych, wysokosci ok. lokcia
 *      (~45 cm) — "aby zolnierz wydawal sie dwa razy wyzszy".
 *      -> 3 purpurowe piora (kolor za Polibiuszem) + czarna kita na guzie.
 *      NIE hełm imperial-gallic (I w. n.e. — anachronizm o ~200 lat).
 *   3. PANCERZ — PECTORALE (kardiophylax): brazowa plyta "na piedz kwadratowa"
 *      (~20x20 cm) na skrzyzowanych rzemieniach. Polibiusz przypisuje ja
 *      zolnierzom o cenzusie ponizej 10 000 drachm — czyli wlasnie hastati
 *      (najmlodsi i najubozsi z trzech linii ciezkiej piechoty). Kolczuga
 *      (lorica hamata) to opcja bogatszych; lorica segmentata = I w. n.e.,
 *      dla hastatiego gruby anachronizm. -> pectorale.
 *   4. PILUM — znak rozpoznawczy hastati. Polibiusz: KAZDY nosi DWA pila
 *      (ciezkie i lekkie), drzewce ~3 lokci, zelazny trzpien tej samej dlugosci
 *      wpuszczony do polowy drzewca i nitowany. -> jedno pilum W DLONI TARCZOWEJ
 *      (drugie juz rzucone — spojne ze statystykami z units.json: atak
 *      dystansowy, zasieg 2, "2 rzuty przed zwarciem").
 *   5. GLADIUS HISPANIENSIS — dluzsza, LISCIASTA klinga (talia + rozszerzenie),
 *      noszony po PRAWEJ stronie (Polibiusz VI.23.6: "na prawym udzie").
 *      -> klinga dobyta w pchnieciu + PUSTA POCHWA na prawym biodrze.
 *   6. NOGI — JEDEN nagolennik (ocrea) na LEWEJ (wysunietej) nodze; caligae
 *      (podeszwa + rzemienie), nie buty.
 *   7. TUNIKA — bez pterugesow: pterugesy zwisaja z kirysu/subarmalis, a nie
 *      spod samego pectorale na rzemieniach. -> gladki rabek tuniki z faldami.
 *   8. PUGIO — element NAJSLABIEJ udokumentowany dla hastatiego (sztylet
 *      hiszpanski wchodzi do uzycia rownolegle z gladius hispaniensis, ale
 *      masowo poswiadczony jest dopiero pozno-republikanski / cesarski).
 *      Dodany jako maly detal na LEWYM biodrze i OZNACZONY — do usuniecia
 *      jedna linia, jesli wlasciciel uzna go za ryzykowny.
 *
 * Budzet: ~1150 tri / ~85 mesh (obecny model w grze: 462 tri / 35 mesh).
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

// ── paleta: IDENTYCZNA z units.ts / hastati-falangita.ts (spojnosc serii) ──
const HO_SKIN       = 0xe0ac69;
const HO_SKIN_DK    = 0xc08f4e;   // cien twarzy / dlonie
const HO_STEEL      = 0xc2cad2;   // polerowana klinga gladiusa
const HO_IRON       = 0x8e97a0;   // zelazo kute: okucia scutum, trzpien pilum
const HO_BRONZE     = 0xcf9234;
const HO_BRONZE_LT  = 0xd0a050;
const HO_WOOD       = 0x7a5c3a;
const HO_LEATHER    = 0x6b4a28;
const HO_LEATHER_DK = 0x4e351c;
const HO_GOLD       = 0xd8b040;
const HO_ROMAN_RED  = 0xa42a22;
const HO_RED_DK     = 0x7e1e18;   // faldy/cien tuniki
const HO_PURPLE     = 0x7a2c96;   // piora (Polibiusz: purpurowe albo czarne)
const HO_BLACK      = 0x171310;   // kita montefortino
const HO_LINEN      = 0xe8e0c8;   // plotno pokrycia scutum (rewers)

// ── wymiary sylwetki: TE SAME co rodzina NI_* (modele porownywalne 1:1) ────
const HO_HIP_Y     = 0.208 * HEX_R;
const HO_TORSO_W   = 0.180 * HEX_R;
const HO_TORSO_H   = 0.205 * HEX_R;
const HO_TORSO_D   = 0.100 * HEX_R;
const HO_TORSO_BOT = 0.240 * HEX_R;
const HO_TORSO_CTR = HO_TORSO_BOT + HO_TORSO_H * 0.5;
const HO_TORSO_TOP = HO_TORSO_BOT + HO_TORSO_H;
const HO_NECK_H    = 0.028 * HEX_R;
const HO_HEAD_S    = 0.128 * HEX_R;
const HO_HEAD_CTR  = HO_TORSO_TOP + HO_NECK_H + HO_HEAD_S * 0.5;
const HO_HEAD_TOP  = HO_TORSO_TOP + HO_NECK_H + HO_HEAD_S;
const HO_SHLD_X    = HO_TORSO_W * 0.5 + 0.030 * HEX_R;
const HO_SHLD_Y    = HO_TORSO_TOP - 0.024 * HEX_R;
const HO_HIP_X     = 0.052 * HEX_R;

const HO_THIGH_L   = 0.104 * HEX_R;
const HO_SHIN_L    = 0.096 * HEX_R;
const HO_UPARM_L   = 0.100 * HEX_R;
const HO_FOREARM_L = 0.092 * HEX_R;

// ── geometrie-singletony (lazy, wspolne dla wszystkich tokenow) ────────────
// anatomia
let gHOTorso:    THREE.BoxGeometry | null = null;
let gHOChest:    THREE.BoxGeometry | null = null;
let gHONeck:     THREE.BoxGeometry | null = null;
let gHOHead:     THREE.BoxGeometry | null = null;
let gHOJaw:      THREE.BoxGeometry | null = null;
let gHONose:     THREE.BoxGeometry | null = null;
let gHOEye:      THREE.BoxGeometry | null = null;
let gHOThigh:    THREE.BoxGeometry | null = null;
let gHOShin:     THREE.BoxGeometry | null = null;
let gHOUpArm:    THREE.BoxGeometry | null = null;
let gHOForearm:  THREE.BoxGeometry | null = null;
let gHOFist:     THREE.BoxGeometry | null = null;
// tunika / pas / pancerz
let gHOSkirt:    THREE.BoxGeometry | null = null;
let gHOFold:     THREE.BoxGeometry | null = null;
let gHOBelt:     THREE.BoxGeometry | null = null;
let gHOBuckle:   THREE.BoxGeometry | null = null;
let gHOPect:     THREE.BoxGeometry | null = null;
let gHOPectRim:  THREE.BoxGeometry | null = null;
let gHOPectBoss: THREE.CylinderGeometry | null = null;
let gHOStrap:    THREE.BoxGeometry | null = null;
// obuwie / nagolennik
let gHOSole:     THREE.BoxGeometry | null = null;
let gHOToes:     THREE.BoxGeometry | null = null;
let gHOCalStrap: THREE.BoxGeometry | null = null;
let gHOGreave:   THREE.BoxGeometry | null = null;
let gHOKneeCop:  THREE.BoxGeometry | null = null;
// helm montefortino
let gHOMontBowl: THREE.CylinderGeometry | null = null;
let gHOMontRib:  THREE.CylinderGeometry | null = null;
let gHOMontKnob: THREE.CylinderGeometry | null = null;
let gHOMontNeck: THREE.BoxGeometry | null = null;
let gHOMontBrow: THREE.BoxGeometry | null = null;
let gHOCheek:    THREE.BoxGeometry | null = null;
let gHOCheekDisc:THREE.CylinderGeometry | null = null;
let gHOKitaBase: THREE.CylinderGeometry | null = null;
let gHOKitaHair: THREE.BoxGeometry | null = null;
let gHOFeather:  THREE.BoxGeometry | null = null;
let gHOFeatTip:  THREE.BoxGeometry | null = null;
// scutum
let gHOScutShell:THREE.BufferGeometry | null = null;
let gHOScutFace: THREE.BufferGeometry | null = null;
let gHOScutRimT: THREE.BufferGeometry | null = null;
let gHOScutRimB: THREE.BufferGeometry | null = null;
let gHOSpina:    THREE.BoxGeometry | null = null;
let gHOUmbo:     THREE.CylinderGeometry | null = null;
let gHOUmboPlate:THREE.CylinderGeometry | null = null;
let gHOWing:     THREE.BoxGeometry | null = null;
let gHOPorpax:   THREE.BoxGeometry | null = null;
let gHOGripBar:  THREE.BoxGeometry | null = null;
let gHORivet:    THREE.BoxGeometry | null = null;
// gladius + pochwa
let gHOBladeLo:  THREE.BoxGeometry | null = null;
let gHOBladeHi:  THREE.BoxGeometry | null = null;
let gHOBladeTip: THREE.ConeGeometry | null = null;
let gHOGuard:    THREE.BoxGeometry | null = null;
let gHOGrip:     THREE.CylinderGeometry | null = null;
let gHOPommel:   THREE.CylinderGeometry | null = null;
let gHOScabbard: THREE.BoxGeometry | null = null;
let gHOScabBand: THREE.BoxGeometry | null = null;
let gHOChape:    THREE.ConeGeometry | null = null;
let gHOHanger:   THREE.BoxGeometry | null = null;
// pilum
let gHOPilShaft: THREE.CylinderGeometry | null = null;
let gHOPilCollar:THREE.CylinderGeometry | null = null;
let gHOPilShank: THREE.BoxGeometry | null = null;
let gHOPilHead:  THREE.ConeGeometry | null = null;
let gHOPilFerr:  THREE.CylinderGeometry | null = null;
// pugio (element oznaczony — patrz naglowek pkt 8)
let gHOPugio:    THREE.BoxGeometry | null = null;
let gHOPugioHlt: THREE.BoxGeometry | null = null;

// ---------------------------------------------------------------------------
// OWALNA SKORUPA SCUTUM — fasetowany obrys elipsy (N segmentow) z lukiem
// poprzecznym: kazdy wierzcholek cofniety o c*(x/a)^2 ku zolnierzowi.
// N = 14 (obecny model gry ma 10) — gladszy luk przy koszcie 16 tri.
// ---------------------------------------------------------------------------
const HO_SCUT_N = 14;

function hoOvalRing(a: number, b: number, c: number, N: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2 + Math.PI / 2;   // wierzcholek na gorze
    const x = Math.cos(ang) * a, y = Math.sin(ang) * b;
    pts.push([x, y, -c * (x / a) * (x / a)]);
  }
  return pts;
}

function makeOvalShellGeo(a: number, b: number, c: number, t: number, N: number): THREE.BufferGeometry {
  const ring = hoOvalRing(a, b, c, N);
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

function makeOvalFaceGeo(a: number, b: number, c: number, N: number): THREE.BufferGeometry {
  const ring = hoOvalRing(a, b, c, N);
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

/**
 * ZELAZNE OKUCIE KRAWEDZI (Polibiusz VI.23.4: okute GORA i DOL, nie dookola).
 * Pasek quadow wzdluz zewnetrznego obrysu, dla PODZBIORU segmentow, lekko
 * wypuszczony na zewnatrz (k) i grubszy niz skorupa (t2) — czytelny okap.
 */
function makeOvalRimGeo(
  a: number, b: number, c: number, t2: number, N: number, idx: number[], k: number,
): THREE.BufferGeometry {
  const inner = hoOvalRing(a, b, c, N);
  const outer = hoOvalRing(a * k, b * k, c * k, N);
  const pos: number[] = [];
  const P = (v: [number, number, number], dz: number) => { pos.push(v[0], v[1], v[2] + dz); };
  const F = t2 * 0.5, B = -t2 * 0.5;
  for (const i of idx) {
    const pi = inner[i]!, qi = inner[(i + 1) % N]!;
    const po = outer[i]!, qo = outer[(i + 1) % N]!;
    // lico (przod okucia)
    P(pi, F); P(po, F); P(qo, F);
    P(pi, F); P(qo, F); P(qi, F);
    // rewers
    P(pi, B); P(qo, B); P(po, B);
    P(pi, B); P(qi, B); P(qo, B);
    // zewnetrzna krawedz okucia
    P(po, F); P(po, B); P(qo, B);
    P(po, F); P(qo, B); P(qo, F);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// indeksy segmentow obrysu: luk GORNY wokol i=0, luk DOLNY wokol i=N/2
const HO_RIM_TOP = [HO_SCUT_N - 2, HO_SCUT_N - 1, 0, 1];
const HO_RIM_BOT = [HO_SCUT_N / 2 - 2, HO_SCUT_N / 2 - 1, HO_SCUT_N / 2, HO_SCUT_N / 2 + 1];

const SCUT_A = 0.104 * HEX_R;   // polos pozioma skorupy
const SCUT_B = 0.190 * HEX_R;   // polos pionowa skorupy
const SCUT_C = 0.052 * HEX_R;   // glebokosc luku poprzecznego
const SCUT_T = 0.020 * HEX_R;   // grubosc skorupy

// ── akcesory geometrii ─────────────────────────────────────────────────────
function getHOTorso():    THREE.BoxGeometry { return (gHOTorso    ||= new THREE.BoxGeometry(HO_TORSO_W, HO_TORSO_H, HO_TORSO_D)); }
function getHOChest():    THREE.BoxGeometry { return (gHOChest    ||= new THREE.BoxGeometry(HO_TORSO_W * 1.04, 0.070 * HEX_R, HO_TORSO_D * 1.06)); }
function getHONeck():     THREE.BoxGeometry { return (gHONeck     ||= new THREE.BoxGeometry(0.042 * HEX_R, HO_NECK_H * 1.6, 0.042 * HEX_R)); }
function getHOHead():     THREE.BoxGeometry { return (gHOHead     ||= new THREE.BoxGeometry(HO_HEAD_S, HO_HEAD_S, HO_HEAD_S)); }
function getHOJaw():      THREE.BoxGeometry { return (gHOJaw      ||= new THREE.BoxGeometry(0.086 * HEX_R, 0.034 * HEX_R, 0.038 * HEX_R)); }
function getHONose():     THREE.BoxGeometry { return (gHONose     ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.026 * HEX_R, 0.016 * HEX_R)); }
function getHOEye():      THREE.BoxGeometry { return (gHOEye      ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.012 * HEX_R, 0.008 * HEX_R)); }
function getHOThigh():    THREE.BoxGeometry { return (gHOThigh    ||= new THREE.BoxGeometry(0.056 * HEX_R, HO_THIGH_L, 0.060 * HEX_R)); }
function getHOShin():     THREE.BoxGeometry { return (gHOShin     ||= new THREE.BoxGeometry(0.038 * HEX_R, HO_SHIN_L, 0.042 * HEX_R)); }
function getHOUpArm():    THREE.BoxGeometry { return (gHOUpArm    ||= new THREE.BoxGeometry(0.054 * HEX_R, HO_UPARM_L, 0.054 * HEX_R)); }
function getHOForearm():  THREE.BoxGeometry { return (gHOForearm  ||= new THREE.BoxGeometry(0.040 * HEX_R, HO_FOREARM_L, 0.040 * HEX_R)); }
function getHOFist():     THREE.BoxGeometry { return (gHOFist     ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)); }
function getHOSkirt():    THREE.BoxGeometry { return (gHOSkirt    ||= new THREE.BoxGeometry(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)); }
function getHOFold():     THREE.BoxGeometry { return (gHOFold     ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.062 * HEX_R, 0.014 * HEX_R)); }
function getHOBelt():     THREE.BoxGeometry { return (gHOBelt     ||= new THREE.BoxGeometry(0.190 * HEX_R, 0.030 * HEX_R, 0.112 * HEX_R)); }
function getHOBuckle():   THREE.BoxGeometry { return (gHOBuckle   ||= new THREE.BoxGeometry(0.034 * HEX_R, 0.028 * HEX_R, 0.014 * HEX_R)); }
function getHOPect():     THREE.BoxGeometry { return (gHOPect     ||= new THREE.BoxGeometry(0.086 * HEX_R, 0.086 * HEX_R, 0.014 * HEX_R)); }
function getHOPectRim():  THREE.BoxGeometry { return (gHOPectRim  ||= new THREE.BoxGeometry(0.100 * HEX_R, 0.100 * HEX_R, 0.008 * HEX_R)); }
function getHOPectBoss(): THREE.CylinderGeometry { return (gHOPectBoss ||= new THREE.CylinderGeometry(0.019 * HEX_R, 0.023 * HEX_R, 0.012 * HEX_R, 8, 1)); }
function getHOStrap():    THREE.BoxGeometry { return (gHOStrap    ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.126 * HEX_R, 0.008 * HEX_R)); }
function getHOSole():     THREE.BoxGeometry { return (gHOSole     ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.014 * HEX_R, 0.082 * HEX_R)); }
function getHOToes():     THREE.BoxGeometry { return (gHOToes     ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.016 * HEX_R, 0.026 * HEX_R)); }
function getHOCalStrap(): THREE.BoxGeometry { return (gHOCalStrap ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.009 * HEX_R, 0.030 * HEX_R)); }
function getHOGreave():   THREE.BoxGeometry { return (gHOGreave   ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.094 * HEX_R, 0.050 * HEX_R)); }
function getHOKneeCop():  THREE.BoxGeometry { return (gHOKneeCop  ||= new THREE.BoxGeometry(0.048 * HEX_R, 0.026 * HEX_R, 0.030 * HEX_R)); }
function getHOMontBowl(): THREE.CylinderGeometry { return (gHOMontBowl ||= new THREE.CylinderGeometry(0.046 * HEX_R, 0.092 * HEX_R, 0.086 * HEX_R, 10, 1)); }
function getHOMontRib():  THREE.CylinderGeometry { return (gHOMontRib  ||= new THREE.CylinderGeometry(0.083 * HEX_R, 0.095 * HEX_R, 0.014 * HEX_R, 10, 1)); }
function getHOMontKnob(): THREE.CylinderGeometry { return (gHOMontKnob ||= new THREE.CylinderGeometry(0.020 * HEX_R, 0.034 * HEX_R, 0.024 * HEX_R, 8, 1)); }
function getHOMontNeck(): THREE.BoxGeometry { return (gHOMontNeck ||= new THREE.BoxGeometry(0.148 * HEX_R, 0.018 * HEX_R, 0.056 * HEX_R)); }
function getHOMontBrow(): THREE.BoxGeometry { return (gHOMontBrow ||= new THREE.BoxGeometry(0.128 * HEX_R, 0.016 * HEX_R, 0.030 * HEX_R)); }
function getHOCheek():    THREE.BoxGeometry { return (gHOCheek    ||= new THREE.BoxGeometry(0.017 * HEX_R, 0.054 * HEX_R, 0.042 * HEX_R)); }
function getHOCheekDisc():THREE.CylinderGeometry { return (gHOCheekDisc||= new THREE.CylinderGeometry(0.017 * HEX_R, 0.017 * HEX_R, 0.009 * HEX_R, 6, 1)); }
function getHOKitaBase(): THREE.CylinderGeometry { return (gHOKitaBase ||= new THREE.CylinderGeometry(0.013 * HEX_R, 0.017 * HEX_R, 0.020 * HEX_R, 6, 1)); }
function getHOKitaHair(): THREE.BoxGeometry { return (gHOKitaHair ||= new THREE.BoxGeometry(0.028 * HEX_R, 0.052 * HEX_R, 0.030 * HEX_R)); }
function getHOFeather():  THREE.BoxGeometry { return (gHOFeather  ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.104 * HEX_R, 0.010 * HEX_R)); }
function getHOFeatTip():  THREE.BoxGeometry { return (gHOFeatTip  ||= new THREE.BoxGeometry(0.013 * HEX_R, 0.036 * HEX_R, 0.008 * HEX_R)); }
function getHOScutShell():THREE.BufferGeometry { return (gHOScutShell ||= makeOvalShellGeo(SCUT_A, SCUT_B, SCUT_C, SCUT_T, HO_SCUT_N)); }
function getHOScutFace(): THREE.BufferGeometry { return (gHOScutFace  ||= makeOvalFaceGeo(SCUT_A * 0.92, SCUT_B * 0.92, SCUT_C * 0.80, HO_SCUT_N)); }
function getHOScutRimT(): THREE.BufferGeometry { return (gHOScutRimT  ||= makeOvalRimGeo(SCUT_A * 0.97, SCUT_B * 0.97, SCUT_C, SCUT_T * 1.5, HO_SCUT_N, HO_RIM_TOP, 1.06)); }
function getHOScutRimB(): THREE.BufferGeometry { return (gHOScutRimB  ||= makeOvalRimGeo(SCUT_A * 0.97, SCUT_B * 0.97, SCUT_C, SCUT_T * 1.5, HO_SCUT_N, HO_RIM_BOT, 1.06)); }
function getHOSpina():    THREE.BoxGeometry { return (gHOSpina    ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.330 * HEX_R, 0.013 * HEX_R)); }
function getHOUmbo():     THREE.CylinderGeometry { return (gHOUmbo     ||= new THREE.CylinderGeometry(0.006 * HEX_R, 0.030 * HEX_R, 0.026 * HEX_R, 6, 1)); }
function getHOUmboPlate():THREE.CylinderGeometry { return (gHOUmboPlate||= new THREE.CylinderGeometry(0.040 * HEX_R, 0.040 * HEX_R, 0.010 * HEX_R, 6, 1)); }
function getHOWing():     THREE.BoxGeometry { return (gHOWing     ||= new THREE.BoxGeometry(0.066 * HEX_R, 0.012 * HEX_R, 0.008 * HEX_R)); }
function getHOPorpax():   THREE.BoxGeometry { return (gHOPorpax   ||= new THREE.BoxGeometry(0.070 * HEX_R, 0.020 * HEX_R, 0.010 * HEX_R)); }
function getHOGripBar():  THREE.BoxGeometry { return (gHOGripBar  ||= new THREE.BoxGeometry(0.052 * HEX_R, 0.014 * HEX_R, 0.014 * HEX_R)); }
function getHORivet():    THREE.BoxGeometry { return (gHORivet    ||= new THREE.BoxGeometry(0.011 * HEX_R, 0.011 * HEX_R, 0.008 * HEX_R)); }
function getHOBladeLo():  THREE.BoxGeometry { return (gHOBladeLo  ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.078 * HEX_R, 0.012 * HEX_R)); }
function getHOBladeHi():  THREE.BoxGeometry { return (gHOBladeHi  ||= new THREE.BoxGeometry(0.032 * HEX_R, 0.062 * HEX_R, 0.013 * HEX_R)); }
function getHOBladeTip(): THREE.ConeGeometry { return (gHOBladeTip ||= new THREE.ConeGeometry(0.019 * HEX_R, 0.052 * HEX_R, 4)); }
function getHOGuard():    THREE.BoxGeometry { return (gHOGuard    ||= new THREE.BoxGeometry(0.054 * HEX_R, 0.016 * HEX_R, 0.026 * HEX_R)); }
function getHOGrip():     THREE.CylinderGeometry { return (gHOGrip     ||= new THREE.CylinderGeometry(0.014 * HEX_R, 0.014 * HEX_R, 0.044 * HEX_R, 6, 1)); }
function getHOPommel():   THREE.CylinderGeometry { return (gHOPommel   ||= new THREE.CylinderGeometry(0.024 * HEX_R, 0.016 * HEX_R, 0.020 * HEX_R, 6, 1)); }
function getHOScabbard(): THREE.BoxGeometry { return (gHOScabbard ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.150 * HEX_R, 0.016 * HEX_R)); }
function getHOScabBand(): THREE.BoxGeometry { return (gHOScabBand ||= new THREE.BoxGeometry(0.036 * HEX_R, 0.014 * HEX_R, 0.022 * HEX_R)); }
function getHOChape():    THREE.ConeGeometry { return (gHOChape    ||= new THREE.ConeGeometry(0.018 * HEX_R, 0.030 * HEX_R, 4)); }
function getHOHanger():   THREE.BoxGeometry { return (gHOHanger   ||= new THREE.BoxGeometry(0.010 * HEX_R, 0.036 * HEX_R, 0.010 * HEX_R)); }
function getHOPilShaft(): THREE.CylinderGeometry { return (gHOPilShaft ||= new THREE.CylinderGeometry(0.011 * HEX_R, 0.013 * HEX_R, 0.330 * HEX_R, 6, 1)); }
function getHOPilCollar():THREE.CylinderGeometry { return (gHOPilCollar||= new THREE.CylinderGeometry(0.015 * HEX_R, 0.017 * HEX_R, 0.026 * HEX_R, 6, 1)); }
function getHOPilShank(): THREE.BoxGeometry { return (gHOPilShank ||= new THREE.BoxGeometry(0.009 * HEX_R, 0.290 * HEX_R, 0.009 * HEX_R)); }
function getHOPilHead():  THREE.ConeGeometry { return (gHOPilHead  ||= new THREE.ConeGeometry(0.016 * HEX_R, 0.044 * HEX_R, 4)); }
function getHOPilFerr():  THREE.CylinderGeometry { return (gHOPilFerr  ||= new THREE.CylinderGeometry(0.010 * HEX_R, 0.006 * HEX_R, 0.026 * HEX_R, 6, 1)); }
function getHOPugio():    THREE.BoxGeometry { return (gHOPugio    ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.070 * HEX_R, 0.012 * HEX_R)); }
function getHOPugioHlt(): THREE.BoxGeometry { return (gHOPugioHlt ||= new THREE.BoxGeometry(0.028 * HEX_R, 0.020 * HEX_R, 0.014 * HEX_R)); }

// ---------------------------------------------------------------------------
// Kinematyka lancuchowa — IDENTYCZNA konwencja co hastati-falangita.ts:
// theta od pionu W DOL, +theta = ku przodowi (+Z); mesh o osi Y klasc
// z rotation.x = PI - theta.
// ---------------------------------------------------------------------------
function hoDirDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}

function hoSeg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = hoDirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

/**
 * Noga: udo + golen + CALIGA (podeszwa + palce + 2 rzemienie) plasko na y = 0.
 * (Obecny model gry ma w tym miejscu jeden klocek-stope.)
 */
function hoBuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  mBoot: THREE.MeshStandardMaterial, mStrap: THREE.MeshStandardMaterial,
  hipY: number,
): THREE.Vector3 {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = hoSeg(group, getHOThigh(), mThigh, P, thU, HO_THIGH_L);
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = hoSeg(group, getHOShin(), mShin, P, thL, HO_SHIN_L);

  const footZ = P.z + 0.016 * HEX_R;
  const sole = new THREE.Mesh(getHOSole(), mBoot);
  sole.position.set(sx, 0.007 * HEX_R, footZ);
  group.add(sole);
  const toes = new THREE.Mesh(getHOToes(), mBoot);
  toes.position.set(sx, 0.010 * HEX_R, footZ + 0.040 * HEX_R);
  group.add(toes);
  for (const dz of [-0.012, 0.014]) {                 // rzemienie caligae
    const st = new THREE.Mesh(getHOCalStrap(), mStrap);
    st.position.set(sx, 0.020 * HEX_R, footZ + dz * HEX_R);
    group.add(st);
  }
  return P;
}

/**
 * Ramie: ramie + przedramie + piesc. Zwraca nadgarstek i OS PRZEDRAMIENIA
 * (bron zawsze na tej osi — nic nie lewituje).
 */
function hoBuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  let P = new THREE.Vector3(sx, HO_SHLD_Y, 0);
  P = hoSeg(group, getHOUpArm(), mUp, P, thU, HO_UPARM_L);
  P.y += 0.010 * HEX_R;
  const wrist = hoSeg(group, getHOForearm(), mFore, P, thF, HO_FOREARM_L);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getHOFist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(hoDirDown(thF), 0.014 * HEX_R));
    group.add(fist);
  }
  return { wrist, axis: hoDirDown(thF) };
}

// ---------------------------------------------------------------------------
// HASTATI — wariant OPUS 5. Poza ataku spojna z rodzina (pchniecie gladiusem,
// gleboki wykrok, tarcza oslania korpus), ale wyposazenie rozbudowane wg
// Polibiusza VI.23: pilum w dloni tarczowej, pochwa na PRAWYM biodrze,
// okucia scutum tylko gora/dol, wrzecionowate umbo, caligae, twarz.
// ---------------------------------------------------------------------------
export function buildHastatiOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mGold    = mat(HO_GOLD,       0.55, 0.35);
  const mBronze  = mat(HO_BRONZE,     0.50, 0.42);
  const mBronzL  = mat(HO_BRONZE_LT,  0.52, 0.38);
  const mOwner   = mat(ownerColor_,   0.15, 0.65);
  const mRed     = mat(HO_ROMAN_RED,  0.05, 0.80);
  const mRedDk   = mat(HO_RED_DK,     0.05, 0.84);
  const mSteel   = mat(HO_STEEL,      0.58, 0.30);
  const mIron    = mat(HO_IRON,       0.62, 0.42);
  const mLeath   = mat(HO_LEATHER,    0.05, 0.82);
  const mLeathDk = mat(HO_LEATHER_DK, 0.05, 0.86);
  const mSkin    = mat(HO_SKIN,       0.05, 0.80);
  const mSkinDk  = mat(HO_SKIN_DK,    0.05, 0.82);
  const mPurple  = mat(HO_PURPLE,     0.08, 0.72);
  const mBlack   = mat(HO_BLACK,      0.05, 0.85);
  const mWood    = mat(HO_WOOD,       0.05, 0.85);

  const HIP_Y = HO_HIP_Y - 0.012 * HEX_R;   // gleboki wypad (jak w rodzinie)

  // ═══ KORPUS ══════════════════════════════════════════════════════════════
  const torso = new THREE.Mesh(getHOTorso(), mRed);
  torso.position.set(0, HO_TORSO_CTR, 0);
  group.add(torso);
  const chest = new THREE.Mesh(getHOChest(), mRed);       // klatka szersza od talii
  chest.position.set(0, HO_TORSO_TOP - 0.038 * HEX_R, 0);
  group.add(chest);

  const neck = new THREE.Mesh(getHONeck(), mSkin);
  neck.position.set(0, HO_TORSO_TOP + HO_NECK_H * 0.5, 0);
  group.add(neck);

  // ═══ GLOWA + TWARZ (montefortino zostawia twarz odslonieta) ══════════════
  const head = new THREE.Mesh(getHOHead(), mSkin);
  head.position.set(0, HO_HEAD_CTR, 0);
  group.add(head);
  const jaw = new THREE.Mesh(getHOJaw(), mSkinDk);
  jaw.position.set(0, HO_HEAD_CTR - HO_HEAD_S * 0.38, 0.010 * HEX_R);
  group.add(jaw);
  const nose = new THREE.Mesh(getHONose(), mSkin);
  nose.position.set(0, HO_HEAD_CTR - 0.004 * HEX_R, HO_HEAD_S * 0.5 + 0.006 * HEX_R);
  group.add(nose);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(getHOEye(), mBlack);
    eye.position.set(sx * 0.026 * HEX_R, HO_HEAD_CTR + 0.014 * HEX_R, HO_HEAD_S * 0.5 + 0.002 * HEX_R);
    group.add(eye);
  }

  // ═══ TUNIKA: rabek + faldy + pas (cingulum) ══════════════════════════════
  const skirt = new THREE.Mesh(getHOSkirt(), mRed);
  skirt.position.set(0, HO_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  for (const sx of [-1, 0, 1]) {                    // faldy tuniki (cien)
    const fold = new THREE.Mesh(getHOFold(), mRedDk);
    fold.position.set(sx * 0.058 * HEX_R, HO_TORSO_BOT - 0.024 * HEX_R, HO_TORSO_D * 0.5 + 0.010 * HEX_R);
    group.add(fold);
  }
  const belt = new THREE.Mesh(getHOBelt(), mLeath);
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);
  const buckle = new THREE.Mesh(getHOBuckle(), mBronzL);
  buckle.position.set(0, 0.252 * HEX_R, HO_TORSO_D * 0.5 + 0.014 * HEX_R);
  group.add(buckle);

  // ═══ PECTORALE (kardiophylax) na skrzyzowanych rzemieniach ═══════════════
  // Polibiusz: brazowa plyta "na piedz kwadratowa" u zolnierzy ubozszych.
  const pectZ = HO_TORSO_D * 0.5 + 0.008 * HEX_R;
  const pectRim = new THREE.Mesh(getHOPectRim(), mBronze);
  pectRim.position.set(0, 0.386 * HEX_R, pectZ);
  group.add(pectRim);
  const pect = new THREE.Mesh(getHOPect(), mGold);
  pect.position.set(0, 0.386 * HEX_R, pectZ + 0.008 * HEX_R);
  group.add(pect);
  const pectBoss = new THREE.Mesh(getHOPectBoss(), mBronzL);   // wytloczenie srodkowe
  pectBoss.rotation.x = Math.PI / 2;
  pectBoss.position.set(0, 0.386 * HEX_R, pectZ + 0.018 * HEX_R);
  group.add(pectBoss);
  for (const s of [-1, 1]) {                        // rzemienie przez barki (przod)
    const strap = new THREE.Mesh(getHOStrap(), mLeath);
    strap.rotation.set(-0.55, 0, s * 0.62);
    strap.position.set(s * 0.020 * HEX_R, 0.448 * HEX_R, 0.038 * HEX_R);
    group.add(strap);
  }
  for (const s of [-1, 1]) {                        // te same rzemienie na plecach
    const strapB = new THREE.Mesh(getHOStrap(), mLeathDk);
    strapB.rotation.set(0.42, 0, -s * 0.60);
    strapB.position.set(s * 0.026 * HEX_R, 0.430 * HEX_R, -(HO_TORSO_D * 0.5 + 0.006 * HEX_R));
    group.add(strapB);
  }

  // ═══ NOGI: LEWA (+X) wykroczna, PRAWA (-X) zakroczna ═════════════════════
  hoBuildLeg(group,  HO_HIP_X,  0.58,  0.34, mRed, mSkin, mLeath, mLeathDk, HIP_Y);
  hoBuildLeg(group, -HO_HIP_X, -0.52, -0.20, mRed, mSkin, mLeath, mLeathDk, HIP_Y);
  // JEDNA ocrea — na LEWEJ (wysunietej, odslonietej zza tarczy) goleni
  const greave = new THREE.Mesh(getHOGreave(), mBronze);
  greave.rotation.x = Math.PI - 0.34;
  greave.position.set(HO_HIP_X, 0.070 * HEX_R, 0.069 * HEX_R);
  group.add(greave);
  const knee = new THREE.Mesh(getHOKneeCop(), mBronzL);   // naslonek nagolennika
  knee.rotation.x = -0.30;
  knee.position.set(HO_HIP_X, 0.122 * HEX_R, 0.052 * HEX_R);
  group.add(knee);

  // ═══ HELM MONTEFORTINO ═══════════════════════════════════════════════════
  // czasza + zebro obwodowe + nakarczek + oslona czola + nauszniki z tarczka
  // + GUZ na szczycie + czarna kita + 3 purpurowe piora (Polibiusz VI.23.12)
  const bowl = new THREE.Mesh(getHOMontBowl(), mBronze);
  bowl.position.set(0, HO_HEAD_CTR + 0.030 * HEX_R, 0);
  group.add(bowl);
  const rib = new THREE.Mesh(getHOMontRib(), mBronzL);
  rib.position.set(0, HO_HEAD_CTR - 0.002 * HEX_R, 0);
  group.add(rib);
  const brow = new THREE.Mesh(getHOMontBrow(), mBronzL);
  brow.rotation.x = 0.16;
  brow.position.set(0, HO_HEAD_CTR + 0.030 * HEX_R, HO_HEAD_S * 0.5 + 0.008 * HEX_R);
  group.add(brow);
  const neckG = new THREE.Mesh(getHOMontNeck(), mBronzL);
  neckG.rotation.x = -0.42;
  neckG.position.set(0, HO_HEAD_CTR - 0.016 * HEX_R, -(HO_HEAD_S * 0.5 + 0.022 * HEX_R));
  group.add(neckG);
  for (const sx of [-1, 1]) {                       // nauszniki + tarczka (typ Montefortino)
    const ck = new THREE.Mesh(getHOCheek(), mBronze);
    ck.rotation.z = sx * 0.10;
    ck.position.set(sx * (HO_HEAD_S * 0.5 + 0.005 * HEX_R), HO_HEAD_CTR - 0.016 * HEX_R, 0.016 * HEX_R);
    group.add(ck);
    const disc = new THREE.Mesh(getHOCheekDisc(), mBronzL);
    disc.rotation.z = Math.PI / 2;
    disc.position.set(sx * (HO_HEAD_S * 0.5 + 0.012 * HEX_R), HO_HEAD_CTR - 0.028 * HEX_R, 0.018 * HEX_R);
    group.add(disc);
  }
  const knob = new THREE.Mesh(getHOMontKnob(), mBronzL);   // GUZ — cecha typu
  knob.position.set(0, HO_HEAD_TOP + 0.012 * HEX_R, 0);
  group.add(knob);
  const kitaB = new THREE.Mesh(getHOKitaBase(), mBlack);
  kitaB.position.set(0, HO_HEAD_TOP + 0.032 * HEX_R, 0);
  group.add(kitaB);
  const kitaH = new THREE.Mesh(getHOKitaHair(), mBlack);
  kitaH.rotation.x = 0.14;
  kitaH.position.set(0, HO_HEAD_TOP + 0.062 * HEX_R, -0.006 * HEX_R);
  group.add(kitaH);
  // 3 pionowe piora (~lokiec wysokosci): trzon + wezsza koncowka
  for (const sx of [-1, 0, 1]) {
    const base = HO_HEAD_TOP + (sx === 0 ? 0.100 : 0.090) * HEX_R;
    const f = new THREE.Mesh(getHOFeather(), mPurple);
    f.rotation.z = -sx * 0.15;
    f.position.set(sx * 0.032 * HEX_R, base, 0);
    group.add(f);
    const ft = new THREE.Mesh(getHOFeatTip(), mPurple);
    ft.rotation.z = -sx * 0.15;
    ft.position.set(sx * 0.042 * HEX_R, base + 0.068 * HEX_R, 0);
    group.add(ft);
  }

  // ═══ PRAWE (-X) RAMIE + GLADIUS HISPANIENSIS w pchnieciu ═════════════════
  // klinga LISCIASTA: talia (waska) -> rozszerzenie -> ostrze. Wszystko NA OSI
  // przedramienia.
  const armR = hoBuildArm(group, -HO_SHLD_X, 0.95, 1.50, mRed, mSkin, mSkinDk);
  const ax = armR.axis;
  const at = (d: number): THREE.Vector3 => armR.wrist.clone().addScaledVector(ax, d * HEX_R);
  const rotBlade = Math.PI - 1.50;

  const grip = new THREE.Mesh(getHOGrip(), mWood);
  grip.rotation.x = rotBlade;
  grip.position.copy(at(-0.008));
  group.add(grip);
  const pommel = new THREE.Mesh(getHOPommel(), mWood);
  pommel.rotation.x = rotBlade;
  pommel.position.copy(at(-0.038));
  group.add(pommel);
  const guard = new THREE.Mesh(getHOGuard(), mBronzL);
  guard.rotation.x = rotBlade;
  guard.position.copy(at(0.020));
  group.add(guard);
  const bladeLo = new THREE.Mesh(getHOBladeLo(), mSteel);    // talia klingi
  bladeLo.rotation.x = rotBlade;
  bladeLo.position.copy(at(0.068));
  group.add(bladeLo);
  const bladeHi = new THREE.Mesh(getHOBladeHi(), mSteel);    // rozszerzenie "liscia"
  bladeHi.rotation.x = rotBlade;
  bladeHi.position.copy(at(0.138));
  group.add(bladeHi);
  const tip = new THREE.Mesh(getHOBladeTip(), mSteel);
  tip.rotation.x = rotBlade;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(at(0.195));
  group.add(tip);

  // ═══ POCHWA (vagina) na PRAWYM biodrze — Polibiusz: "na prawym udzie" ════
  // Klinga dobyta, wiec pochwa PUSTA — wisi na rzemieniu od cingulum.
  const scabX = -(HO_TORSO_W * 0.5 + 0.026 * HEX_R);
  const hanger = new THREE.Mesh(getHOHanger(), mLeathDk);
  hanger.position.set(scabX, 0.246 * HEX_R, 0.012 * HEX_R);
  group.add(hanger);
  const scab = new THREE.Mesh(getHOScabbard(), mLeath);
  scab.rotation.x = 0.10;
  scab.rotation.z = -0.12;
  scab.position.set(scabX - 0.008 * HEX_R, 0.156 * HEX_R, 0.006 * HEX_R);
  group.add(scab);
  for (const dy of [0.052, -0.030]) {               // okucia pochwy
    const band = new THREE.Mesh(getHOScabBand(), mBronzL);
    band.rotation.x = 0.10;
    band.rotation.z = -0.12;
    band.position.set(scabX - 0.008 * HEX_R + dy * 0.12 * HEX_R, (0.156 + dy) * HEX_R, 0.006 * HEX_R);
    group.add(band);
  }
  const chape = new THREE.Mesh(getHOChape(), mBronzL);       // trzewik pochwy
  chape.rotation.x = Math.PI + 0.10;
  chape.rotation.z = -0.12;
  chape.position.set(scabX - 0.018 * HEX_R, 0.070 * HEX_R, -0.002 * HEX_R);
  group.add(chape);

  // ═══ PUGIO na LEWYM biodrze — element NAJSLABIEJ udokumentowany ══════════
  // (patrz naglowek pkt 8; usuniecie = skasowanie tego bloku)
  const pugX = HO_TORSO_W * 0.5 + 0.020 * HEX_R;
  const pug = new THREE.Mesh(getHOPugio(), mLeathDk);
  pug.rotation.z = 0.16;
  pug.position.set(pugX, 0.208 * HEX_R, -0.014 * HEX_R);
  group.add(pug);
  const pugH = new THREE.Mesh(getHOPugioHlt(), mBronzL);
  pugH.rotation.z = 0.16;
  pugH.position.set(pugX + 0.008 * HEX_R, 0.250 * HEX_R, -0.014 * HEX_R);
  group.add(pugH);

  // ═══ LEWE (+X) RAMIE + SCUTUM ════════════════════════════════════════════
  const armL = hoBuildArm(group, HO_SHLD_X, 0.50, 1.10, mRed, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.025 * HEX_R,
    armL.wrist.y + 0.034 * HEX_R,
    armL.wrist.z + 0.045 * HEX_R,
  );
  sh.rotation.y = -0.22;

  // skorupa = pokrycie z CIELECINY (Polibiusz VI.23.3: plotno, na to skora
  // cielaca) — brazowa, wiec pole w kolorze gracza dominuje i czyta sie z gory
  const shell = new THREE.Mesh(getHOScutShell(), mLeath);
  sh.add(shell);
  // lico = KOLOR GRACZA (wymog gry — miejsce na tint per-cywilizacja)
  const face = new THREE.Mesh(getHOScutFace(), mOwner);
  face.position.set(0, 0, 0.014 * HEX_R);
  sh.add(face);
  // ZELAZNE OKUCIE: tylko luk GORNY i DOLNY (Polibiusz VI.23.4)
  const rimT = new THREE.Mesh(getHOScutRimT(), mIron);
  sh.add(rimT);
  const rimB = new THREE.Mesh(getHOScutRimB(), mIron);
  sh.add(rimB);
  // spina — pionowe zebro na calej wysokosci
  const spina = new THREE.Mesh(getHOSpina(), mWood);
  spina.position.set(0, 0, 0.022 * HEX_R);
  sh.add(spina);
  // umbo WRZECIONOWATE (republikanskie), nie okragle cesarskie
  // podkladka = wydluzone WRZECIONO (skala Z przed rotacja => pion tarczy)
  const umboPlate = new THREE.Mesh(getHOUmboPlate(), mBronze);
  umboPlate.rotation.x = Math.PI / 2;
  umboPlate.scale.set(1.0, 1.0, 1.9);
  umboPlate.position.set(0, 0, 0.026 * HEX_R);
  sh.add(umboPlate);
  // zelazne umbo: STOZEK OSTRZEM NA ZEWNATRZ (+Z). radiusTop lezy przy +Y
  // geometrii, wiec rotacja MUSI byc +PI/2 — przy -PI/2 na widza patrzy plaska
  // szeroka podstawa i przy oswietleniu z gory czyta sie jak czarna dziura.
  const umbo = new THREE.Mesh(getHOUmbo(), mIron);
  umbo.rotation.x = Math.PI / 2;
  umbo.scale.set(1.0, 1.0, 1.7);
  umbo.position.set(0, 0, 0.036 * HEX_R);
  sh.add(umbo);
  // motyw skrzydel (relief z pomnika Emiliusza Paulusa) — 2 pary listew
  for (const s of [-1, 1]) {
    for (const dy of [0.084, -0.084]) {
      const wing = new THREE.Mesh(getHOWing(), mGold);
      wing.rotation.z = s * (dy > 0 ? 0.42 : -0.42);
      wing.position.set(s * 0.040 * HEX_R, dy * HEX_R, 0.024 * HEX_R);
      sh.add(wing);
    }
  }
  // nity okuc (gora/dol)
  for (const dy of [0.176, -0.176]) {
    const rv = new THREE.Mesh(getHORivet(), mIron);
    rv.position.set(0, dy * HEX_R, 0.014 * HEX_R);
    sh.add(rv);
  }
  // porpax + poprzeczny chwyt ZA polem (reka faktycznie ma czego trzymac)
  const porpax = new THREE.Mesh(getHOPorpax(), mLeathDk);
  porpax.position.set(0, 0.012 * HEX_R, -0.026 * HEX_R);
  sh.add(porpax);
  const gripBar = new THREE.Mesh(getHOGripBar(), mWood);
  gripBar.position.set(0, -0.020 * HEX_R, -0.032 * HEX_R);
  sh.add(gripBar);
  group.add(sh);

  // ═══ PILUM w dloni tarczowej ═════════════════════════════════════════════
  // Polibiusz: KAZDY hastatus nosi DWA pila. Jedno juz rzucone (statystyki
  // units.json: atak dystansowy, 2 pociski) — drugie trzymane przy tarczy,
  // gotowe. Budowa: drzewce + kolnierz + zelazny trzpien + piramidalny grot
  // + stopka. Trzpien ~rowny drzewcowi — sylwetka rozpoznawalna z gory.
  // CHWYT: drzewce przechodzi PRZEZ dlon tarczowa (zasada serii — bron na osi
  // dloni, nic nie lewituje). Punkt chwytu = local y 0.24; kat (x -0.14,
  // z -0.10) rozwiazany tak, by w tej wysokosci drzewce trafilo w nadgarstek
  // lewej reki, przeszlo ZA czasza tarczy i wyszlo grotem nad jej gornym rantem.
  const PIL_TH_X = -0.14, PIL_TH_Z = -0.10, PIL_GRIP_H = 0.24 * HEX_R;
  const kx = Math.sin(-PIL_TH_Z);                       // udzial h w przesunieciu x
  const ky = Math.cos(PIL_TH_Z) * Math.cos(PIL_TH_X);
  const kz = Math.cos(PIL_TH_Z) * Math.sin(PIL_TH_X);
  const gripPt = new THREE.Vector3(                     // gdzie ma byc drzewce
    armL.wrist.x + 0.012 * HEX_R,
    armL.wrist.y + 0.009 * HEX_R,
    armL.wrist.z + 0.020 * HEX_R,
  );
  const pil = new THREE.Group();
  pil.position.set(
    gripPt.x - kx * PIL_GRIP_H,
    gripPt.y - ky * PIL_GRIP_H,
    gripPt.z - kz * PIL_GRIP_H,
  );
  pil.rotation.x = PIL_TH_X;                         // odchylone do tylu
  pil.rotation.z = PIL_TH_Z;                         // i lekko na zewnatrz
  const pShaft = new THREE.Mesh(getHOPilShaft(), mWood);
  pShaft.position.set(0, 0.185 * HEX_R, 0);
  pil.add(pShaft);
  const pFerr = new THREE.Mesh(getHOPilFerr(), mIron);
  pFerr.rotation.x = Math.PI;
  pFerr.position.set(0, 0.008 * HEX_R, 0);
  pil.add(pFerr);
  const pCollar = new THREE.Mesh(getHOPilCollar(), mIron);
  pCollar.position.set(0, 0.360 * HEX_R, 0);
  pil.add(pCollar);
  for (const dy of [0.330, 0.386]) {                 // nity mocujace trzpien
    const rv = new THREE.Mesh(getHORivet(), mIron);
    rv.position.set(0, dy * HEX_R, 0.013 * HEX_R);
    pil.add(rv);
  }
  const pShank = new THREE.Mesh(getHOPilShank(), mIron);
  pShank.position.set(0, 0.520 * HEX_R, 0);
  pil.add(pShank);
  const pHead = new THREE.Mesh(getHOPilHead(), mIron);
  pHead.rotation.y = Math.PI / 4;
  pHead.position.set(0, 0.687 * HEX_R, 0);
  pil.add(pHead);
  group.add(pil);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

/** Zwolnienie singletonow modulu (konwencja disposeUnitGeometries z units.ts). */
export function disposeHastatiOpus5Geometries(): void {
  const all: (THREE.BufferGeometry | null)[] = [
    gHOTorso, gHOChest, gHONeck, gHOHead, gHOJaw, gHONose, gHOEye,
    gHOThigh, gHOShin, gHOUpArm, gHOForearm, gHOFist,
    gHOSkirt, gHOFold, gHOBelt, gHOBuckle, gHOPect, gHOPectRim, gHOPectBoss, gHOStrap,
    gHOSole, gHOToes, gHOCalStrap, gHOGreave, gHOKneeCop,
    gHOMontBowl, gHOMontRib, gHOMontKnob, gHOMontNeck, gHOMontBrow,
    gHOCheek, gHOCheekDisc, gHOKitaBase, gHOKitaHair, gHOFeather, gHOFeatTip,
    gHOScutShell, gHOScutFace, gHOScutRimT, gHOScutRimB, gHOSpina,
    gHOUmbo, gHOUmboPlate, gHOWing, gHOPorpax, gHOGripBar, gHORivet,
    gHOBladeLo, gHOBladeHi, gHOBladeTip, gHOGuard, gHOGrip, gHOPommel,
    gHOScabbard, gHOScabBand, gHOChape, gHOHanger,
    gHOPilShaft, gHOPilCollar, gHOPilShank, gHOPilHead, gHOPilFerr,
    gHOPugio, gHOPugioHlt,
  ];
  for (const g of all) { g?.dispose(); }
  gHOTorso = gHOChest = gHONeck = gHOHead = gHOJaw = gHONose = gHOEye = null;
  gHOThigh = gHOShin = gHOUpArm = gHOForearm = gHOFist = null;
  gHOSkirt = gHOFold = gHOBelt = gHOBuckle = gHOPect = gHOPectRim = gHOStrap = null;
  gHOPectBoss = null;
  gHOSole = gHOToes = gHOCalStrap = gHOGreave = gHOKneeCop = null;
  gHOMontBowl = gHOMontRib = gHOMontKnob = gHOCheekDisc = gHOKitaBase = null;
  gHOMontNeck = gHOMontBrow = gHOCheek = gHOKitaHair = gHOFeather = gHOFeatTip = null;
  gHOScutShell = gHOScutFace = gHOScutRimT = gHOScutRimB = null;
  gHOSpina = gHOWing = gHOPorpax = gHOGripBar = gHORivet = null;
  gHOUmbo = gHOUmboPlate = null;
  gHOBladeLo = gHOBladeHi = gHOGuard = gHOScabbard = gHOScabBand = gHOHanger = null;
  gHOBladeTip = gHOChape = gHOPilHead = null;
  gHOGrip = gHOPommel = gHOPilShaft = gHOPilCollar = gHOPilFerr = null;
  gHOPilShank = gHOPugio = gHOPugioHlt = null;
}
