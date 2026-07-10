/**
 * jednostki-p4-melee.ts — PACZKA 4/8: MELEE SPECIALS (6), epoka BRAZU
 * ---------------------------------------------------------------------------
 * Zamienniki 1:1 dla starych tokenow z gra/src/render/units.ts:
 *   buildSherden(ownerColor)           -> units.ts:3189 (dispatch :1012, :1030)
 *   buildTyrrhenian(ownerColor)        -> units.ts:3263 (dispatch :1061)
 *   buildShekelesh(ownerColor)         -> units.ts:3377 (dispatch :1062)
 *   buildMycenaeanWarrior(ownerColor)  -> units.ts:3112 (dispatch :1008, :1026)
 *   buildShangHalberdier(ownerColor)   -> units.ts:3483 (dispatch :1013, :1031)
 *   buildKhopeshWarrior(ownerColor)    -> units.ts:2321 (dispatch :1045)
 * Interfejs i konwencje BEZ ZMIAN (rodzina hastati-falangita.ts):
 *   - figurka PRZODEM do +Z, stopy na y = 0, wysokosc ~0.55*HEX_R,
 *   - uklad prawoskretny: LEWA reka = +X (tarcza), PRAWA = -X (bron),
 *   - group.userData['mats'] i ['perTokenGeos'] jak w units.ts,
 *   - geometrie wspolne = singletony modulu (perTokenGeos puste),
 *   - anatomia lancuchowa msSeg/msBuildLeg/msBuildArm = niSeg/niBuildLeg/
 *     niBuildArm (kon-nowy-model.ts / hastati-falangita.ts), bron NA OSI DLONI.
 *
 * POZY ATAKU (kazda inna):
 *   Sherden    — CIOS mieczem z gory (ramie wzniesione, klinga w przod-gore),
 *   Tyrrenski  — ZAMACH toporem DWURECZNYM po przekatnej (obie piesci na
 *                toporzysku: drzewce przez oba nadgarstki, glowica nad barkiem),
 *   Szekelesz  — PCHNIECIE wlocznia podreczne (grot poziomo w przod),
 *   Mykenski   — PCHNIECIE mieczem naue na wysokosci piersi (jak hastati),
 *   Shang      — CIOS halabarda ge w dol (dwurecznie, klinga poprzeczna),
 *   Khopesh    — CIECIE sierpowcem z zamachu (hak khopesh wygina sie w przod).
 *
 * HELMY (kazdy charakterystyczny): Sherden = ROGATY z dyskiem slonecznym;
 * tyrrenski = grzebien przod-tyl (kolor gracza); szekelesz = czapka trzcinowa
 * (pionowe pasy) + opaska gracza; mykenski = KLY DZIKA (kremowe pasy) + guz;
 * Shang = brazowa misa z maska taotie + kolnierz gracza; khopesh = niebieski
 * KHEPRESH ze zlota opaska i ureuszem.
 *
 * LUDY MORZA (Sherden/Tyrrenski/Szekelesz) spojne jako grupa: morskie barwy
 * tunik (teal / morski granat / morska zielen) + skorzane PANCERZE PASOWE
 * (poziome pasy + skrzyzowane szelki), rozrozne bronia/helmem/tarcza.
 *
 * KOLOR GRACZA jak w starych: Sherden pole tarczy; tyrrenski czub/grzebien +
 * pole tarczy (na plecach) + ostrze topora; szekelesz opaska helmu + pole
 * tarczy; mykenski listwa talii tarczy osemkowej; Shang kolnierz karku
 * (+ kita ge); khopesh pas biodrowy + pole tarczy.
 *
 * ODSTEPSTWA OD STARYCH (swiadome, wg dyspozycji paczki):
 *   1. Mykenski: stara wersja miala WLOCZNIE — dyspozycja P4 mowi MIECZ
 *      (naue II z brazu); tarcza osemkowa zostaje.
 *   2. Tyrrenski: stary mial topor JEDNORECZNY + tarcze w lewej — dyspozycja
 *      mowi TOPOR DWURECZNY W ZAMACHU; okragla tarcza (kolor gracza)
 *      przewieszona na plecy, zeby blazon gracza nie zniknal.
 *   3. Sherden/Szekelesz/Tyrrenski: brazowe kirysy/lniane tuniki zastapione
 *      skorzanymi pancerzami pasowymi (spojnosc grupy Ludow Morza).
 *   4. Khopesh: nemes zastapiony helmem KHEPRESH (rozroznienie od lucznika
 *      egipskiego, ktory nosi nemes); kolnierz usekh i lniany kilt zostaja.
 *
 * Budzet: kazda figurka ~330-460 tri (stare: 372-756) — patrz raport paczki.
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

// ── kolory serii (paleta units.ts + morskie barwy Ludow Morza) ──────────────
const MS_SKIN      = 0xe0ac69;
const MS_BRONZE    = 0xcf9234;
const MS_BRONZE_LT = 0xd0a050;
const MS_STEEL     = 0xc2cad2;
const MS_WOOD      = 0x7a5c3a;
const MS_LEATHER   = 0x6b4a28;
const MS_LEATHER_DK= 0x53381e;
const MS_GOLD      = 0xd8b040;
const MS_LINEN     = 0xe8e0c8;
const MS_WOAD      = 0x2f5aa0;   // khepresh (niebieska korona wojenna)
const MS_LACQUER   = 0xa8252a;   // laka chinska (Shang)
const MS_TEAL      = 0x2e6e63;   // tunika Sherden (morska)
const MS_SEABLUE   = 0x33607a;   // tunika tyrrenska (morski granat)
const MS_SEAGREEN  = 0x3e7a5e;   // tunika szekelesz (morska zielen)
const MS_OCHRE     = 0xc8932e;   // tunika mykenska (ochra jak stara)
const MS_TUSK      = 0xeae0c4;   // kly dzika (kremowe)
const MS_HIDE      = 0x8a6a3e;   // skora bydleca tarczy osemkowej
const MS_DARKHAIR  = 0x2a1a0a;
const MS_DARK      = 0x20180f;

// ── wymiary sylwetki (identyczne z rodzina NI_* wzorca) ─────────────────────
const MS_HIP_Y     = 0.208 * HEX_R;
const MS_TORSO_W   = 0.180 * HEX_R;
const MS_TORSO_H   = 0.205 * HEX_R;
const MS_TORSO_D   = 0.100 * HEX_R;
const MS_TORSO_BOT = 0.240 * HEX_R;
const MS_TORSO_CTR = MS_TORSO_BOT + MS_TORSO_H * 0.5;
const MS_TORSO_TOP = MS_TORSO_BOT + MS_TORSO_H;
const MS_NECK_H    = 0.028 * HEX_R;
const MS_HEAD_S    = 0.128 * HEX_R;
const MS_HEAD_CTR  = MS_TORSO_TOP + MS_NECK_H + MS_HEAD_S * 0.5;
const MS_HEAD_TOP  = MS_TORSO_TOP + MS_NECK_H + MS_HEAD_S;
const MS_SHLD_X    = MS_TORSO_W * 0.5 + 0.030 * HEX_R;
const MS_SHLD_Y    = MS_TORSO_TOP - 0.024 * HEX_R;
const MS_HIP_X     = 0.052 * HEX_R;
const MS_THIGH_L   = 0.104 * HEX_R;
const MS_SHIN_L    = 0.096 * HEX_R;
const MS_UPARM_L   = 0.100 * HEX_R;
const MS_FOREARM_L = 0.092 * HEX_R;

// ── geometrie-singletony ────────────────────────────────────────────────────
let gMSTorso:   THREE.BoxGeometry | null = null;
let gMSNeck:    THREE.BoxGeometry | null = null;
let gMSHead:    THREE.BoxGeometry | null = null;
let gMSThigh:   THREE.BoxGeometry | null = null;
let gMSShin:    THREE.BoxGeometry | null = null;
let gMSFoot:    THREE.BoxGeometry | null = null;
let gMSUpArm:   THREE.BoxGeometry | null = null;
let gMSForearm: THREE.BoxGeometry | null = null;
let gMSFist:    THREE.BoxGeometry | null = null;
let gMSSkirt:   THREE.BoxGeometry | null = null;
let gMSBelt:    THREE.BoxGeometry | null = null;
let gMSBandT:   THREE.BoxGeometry | null = null;   // pas pancerza (tors)
let gMSStrap:   THREE.BoxGeometry | null = null;   // szelka skosna
let gMSBowl:    THREE.CylinderGeometry | null = null;  // misa helmu (8-kat)
let gMSBand:    THREE.CylinderGeometry | null = null;  // opaska helmu (otwarta)
let gMSShFace:  THREE.CylinderGeometry | null = null;  // pole tarczy okraglej
let gMSShRim:   THREE.CylinderGeometry | null = null;  // rant tarczy (otwarty)
let gMSShBoss:  THREE.BoxGeometry | null = null;
let gMSBlade:   THREE.BoxGeometry | null = null;
let gMSBladeTip:THREE.ConeGeometry | null = null;
let gMSGuard:   THREE.BoxGeometry | null = null;
let gMSSpShaft: THREE.BoxGeometry | null = null;
let gMSSpTip:   THREE.ConeGeometry | null = null;
let gMSHaft:    THREE.BoxGeometry | null = null;
let gMSAxeHead: THREE.BoxGeometry | null = null;
let gMSAxeEdge: THREE.BoxGeometry | null = null;
let gMSPole:    THREE.BoxGeometry | null = null;
let gMSGeBlade: THREE.BoxGeometry | null = null;
let gMSGeTassel:THREE.BoxGeometry | null = null;
let gMSGeCap:   THREE.ConeGeometry | null = null;
let gMSHorn:    THREE.BoxGeometry | null = null;
let gMSDisc:    THREE.BoxGeometry | null = null;
let gMSSpike:   THREE.BoxGeometry | null = null;
let gMSCrestBase: THREE.BoxGeometry | null = null;
let gMSCrestHair: THREE.BoxGeometry | null = null;
let gMSBeard:   THREE.BoxGeometry | null = null;
let gMSMedal:   THREE.BoxGeometry | null = null;
let gMSReed:    THREE.BoxGeometry | null = null;
let gMSFringe:  THREE.BoxGeometry | null = null;
let gMSCap:     THREE.CylinderGeometry | null = null;
let gMSTuskB1:  THREE.CylinderGeometry | null = null;
let gMSTuskB2:  THREE.CylinderGeometry | null = null;
let gMSTuskB3:  THREE.CylinderGeometry | null = null;
let gMSKnob:    THREE.BoxGeometry | null = null;
let gMSCheek:   THREE.BoxGeometry | null = null;
let gMSLobeBig: THREE.BufferGeometry | null = null;
let gMSLobeSm:  THREE.BufferGeometry | null = null;
let gMSWaistBar:THREE.BoxGeometry | null = null;
let gMSMask:    THREE.BoxGeometry | null = null;
let gMSEye:     THREE.BoxGeometry | null = null;
let gMSFlap:    THREE.BoxGeometry | null = null;
let gMSKhep:    THREE.CylinderGeometry | null = null;
let gMSUraeus:  THREE.BoxGeometry | null = null;
let gMSCollar:  THREE.BoxGeometry | null = null;
let gMSKhStr:   THREE.BoxGeometry | null = null;
let gMSKhSeg:   THREE.BoxGeometry | null = null;

function getGMSTorso():   THREE.BoxGeometry { return (gMSTorso   ||= new THREE.BoxGeometry(MS_TORSO_W, MS_TORSO_H, MS_TORSO_D)); }
function getGMSNeck():    THREE.BoxGeometry { return (gMSNeck    ||= new THREE.BoxGeometry(0.042 * HEX_R, MS_NECK_H * 1.6, 0.042 * HEX_R)); }
function getGMSHead():    THREE.BoxGeometry { return (gMSHead    ||= new THREE.BoxGeometry(MS_HEAD_S, MS_HEAD_S, MS_HEAD_S)); }
function getGMSThigh():   THREE.BoxGeometry { return (gMSThigh   ||= new THREE.BoxGeometry(0.056 * HEX_R, MS_THIGH_L, 0.060 * HEX_R)); }
function getGMSShin():    THREE.BoxGeometry { return (gMSShin    ||= new THREE.BoxGeometry(0.038 * HEX_R, MS_SHIN_L, 0.042 * HEX_R)); }
function getGMSFoot():    THREE.BoxGeometry { return (gMSFoot    ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)); }
function getGMSUpArm():   THREE.BoxGeometry { return (gMSUpArm   ||= new THREE.BoxGeometry(0.054 * HEX_R, MS_UPARM_L, 0.054 * HEX_R)); }
function getGMSForearm(): THREE.BoxGeometry { return (gMSForearm ||= new THREE.BoxGeometry(0.040 * HEX_R, MS_FOREARM_L, 0.040 * HEX_R)); }
function getGMSFist():    THREE.BoxGeometry { return (gMSFist    ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)); }
function getGMSSkirt():   THREE.BoxGeometry { return (gMSSkirt   ||= new THREE.BoxGeometry(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)); }
function getGMSBelt():    THREE.BoxGeometry { return (gMSBelt    ||= new THREE.BoxGeometry(0.190 * HEX_R, 0.034 * HEX_R, 0.112 * HEX_R)); }
function getGMSBandT():   THREE.BoxGeometry { return (gMSBandT   ||= new THREE.BoxGeometry(0.192 * HEX_R, 0.024 * HEX_R, 0.114 * HEX_R)); }
function getGMSStrap():   THREE.BoxGeometry { return (gMSStrap   ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.120 * HEX_R, 0.008 * HEX_R)); }
function getGMSBowl():    THREE.CylinderGeometry { return (gMSBowl ||= new THREE.CylinderGeometry(0.062 * HEX_R, 0.092 * HEX_R, 0.100 * HEX_R, 8, 1)); }
function getGMSBand():    THREE.CylinderGeometry { return (gMSBand ||= new THREE.CylinderGeometry(0.097 * HEX_R, 0.097 * HEX_R, 0.022 * HEX_R, 8, 1, true)); }
function getGMSShFace():  THREE.CylinderGeometry { return (gMSShFace ||= new THREE.CylinderGeometry(0.112 * HEX_R, 0.088 * HEX_R, 0.030 * HEX_R, 10, 1)); }
function getGMSShRim():   THREE.CylinderGeometry { return (gMSShRim  ||= new THREE.CylinderGeometry(0.122 * HEX_R, 0.122 * HEX_R, 0.016 * HEX_R, 10, 1, true)); }
function getGMSShBoss():  THREE.BoxGeometry { return (gMSShBoss ||= new THREE.BoxGeometry(0.036 * HEX_R, 0.036 * HEX_R, 0.026 * HEX_R)); }
function getGMSBlade():   THREE.BoxGeometry { return (gMSBlade   ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.140 * HEX_R, 0.013 * HEX_R)); }
function getGMSBladeTip():THREE.ConeGeometry{ return (gMSBladeTip||= new THREE.ConeGeometry(0.016 * HEX_R, 0.042 * HEX_R, 4)); }
function getGMSGuard():   THREE.BoxGeometry { return (gMSGuard   ||= new THREE.BoxGeometry(0.056 * HEX_R, 0.018 * HEX_R, 0.024 * HEX_R)); }
function getGMSSpShaft(): THREE.BoxGeometry { return (gMSSpShaft ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.560 * HEX_R, 0.019 * HEX_R)); }
function getGMSSpTip():   THREE.ConeGeometry{ return (gMSSpTip   ||= new THREE.ConeGeometry(0.019 * HEX_R, 0.058 * HEX_R, 4)); }
function getGMSHaft():    THREE.BoxGeometry { return (gMSHaft    ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.440 * HEX_R, 0.020 * HEX_R)); }
function getGMSAxeHead(): THREE.BoxGeometry { return (gMSAxeHead ||= new THREE.BoxGeometry(0.094 * HEX_R, 0.056 * HEX_R, 0.020 * HEX_R)); }
function getGMSAxeEdge(): THREE.BoxGeometry { return (gMSAxeEdge ||= new THREE.BoxGeometry(0.014 * HEX_R, 0.056 * HEX_R, 0.026 * HEX_R)); }
function getGMSPole():    THREE.BoxGeometry { return (gMSPole    ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.660 * HEX_R, 0.018 * HEX_R)); }
function getGMSGeBlade(): THREE.BoxGeometry { return (gMSGeBlade ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.032 * HEX_R, 0.130 * HEX_R)); }
function getGMSGeTassel():THREE.BoxGeometry { return (gMSGeTassel||= new THREE.BoxGeometry(0.030 * HEX_R, 0.052 * HEX_R, 0.014 * HEX_R)); }
function getGMSGeCap():   THREE.ConeGeometry{ return (gMSGeCap   ||= new THREE.ConeGeometry(0.016 * HEX_R, 0.040 * HEX_R, 4)); }
function getGMSHorn():    THREE.BoxGeometry { return (gMSHorn    ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.062 * HEX_R, 0.020 * HEX_R)); }
function getGMSDisc():    THREE.BoxGeometry { return (gMSDisc    ||= new THREE.BoxGeometry(0.034 * HEX_R, 0.034 * HEX_R, 0.012 * HEX_R)); }
function getGMSSpike():   THREE.BoxGeometry { return (gMSSpike   ||= new THREE.BoxGeometry(0.014 * HEX_R, 0.055 * HEX_R, 0.014 * HEX_R)); }
function getGMSCrestBase():THREE.BoxGeometry{ return (gMSCrestBase||= new THREE.BoxGeometry(0.018 * HEX_R, 0.022 * HEX_R, 0.112 * HEX_R)); }
function getGMSCrestHair():THREE.BoxGeometry{ return (gMSCrestHair||= new THREE.BoxGeometry(0.022 * HEX_R, 0.062 * HEX_R, 0.150 * HEX_R)); }
function getGMSBeard():   THREE.BoxGeometry { return (gMSBeard   ||= new THREE.BoxGeometry(0.086 * HEX_R, 0.044 * HEX_R, 0.022 * HEX_R)); }
function getGMSMedal():   THREE.BoxGeometry { return (gMSMedal   ||= new THREE.BoxGeometry(0.032 * HEX_R, 0.032 * HEX_R, 0.010 * HEX_R)); }
function getGMSReed():    THREE.BoxGeometry { return (gMSReed    ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.080 * HEX_R, 0.013 * HEX_R)); }
function getGMSFringe():  THREE.BoxGeometry { return (gMSFringe  ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.034 * HEX_R, 0.012 * HEX_R)); }
function getGMSCap():     THREE.CylinderGeometry { return (gMSCap ||= new THREE.CylinderGeometry(0.058 * HEX_R, 0.086 * HEX_R, 0.108 * HEX_R, 8, 1)); }
function getGMSTuskB1():  THREE.CylinderGeometry { return (gMSTuskB1 ||= new THREE.CylinderGeometry(0.0905 * HEX_R, 0.0925 * HEX_R, 0.026 * HEX_R, 8, 1, true)); }
function getGMSTuskB2():  THREE.CylinderGeometry { return (gMSTuskB2 ||= new THREE.CylinderGeometry(0.0820 * HEX_R, 0.0850 * HEX_R, 0.026 * HEX_R, 8, 1, true)); }
function getGMSTuskB3():  THREE.CylinderGeometry { return (gMSTuskB3 ||= new THREE.CylinderGeometry(0.0715 * HEX_R, 0.0760 * HEX_R, 0.026 * HEX_R, 8, 1, true)); }
function getGMSKnob():    THREE.BoxGeometry { return (gMSKnob    ||= new THREE.BoxGeometry(0.028 * HEX_R, 0.038 * HEX_R, 0.028 * HEX_R)); }
function getGMSCheek():   THREE.BoxGeometry { return (gMSCheek   ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.050 * HEX_R, 0.042 * HEX_R)); }
function getGMSWaistBar():THREE.BoxGeometry { return (gMSWaistBar||= new THREE.BoxGeometry(0.140 * HEX_R, 0.028 * HEX_R, 0.016 * HEX_R)); }
function getGMSMask():    THREE.BoxGeometry { return (gMSMask    ||= new THREE.BoxGeometry(0.108 * HEX_R, 0.054 * HEX_R, 0.016 * HEX_R)); }
function getGMSEye():     THREE.BoxGeometry { return (gMSEye     ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.017 * HEX_R, 0.008 * HEX_R)); }
function getGMSFlap():    THREE.BoxGeometry { return (gMSFlap    ||= new THREE.BoxGeometry(0.150 * HEX_R, 0.050 * HEX_R, 0.038 * HEX_R)); }
function getGMSKhep():    THREE.CylinderGeometry { return (gMSKhep ||= new THREE.CylinderGeometry(0.050 * HEX_R, 0.090 * HEX_R, 0.110 * HEX_R, 8, 1)); }
function getGMSUraeus():  THREE.BoxGeometry { return (gMSUraeus  ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.034 * HEX_R, 0.013 * HEX_R)); }
function getGMSCollar():  THREE.BoxGeometry { return (gMSCollar  ||= new THREE.BoxGeometry(0.192 * HEX_R, 0.028 * HEX_R, 0.110 * HEX_R)); }
function getGMSKhStr():   THREE.BoxGeometry { return (gMSKhStr   ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.096 * HEX_R, 0.013 * HEX_R)); }
function getGMSKhSeg():   THREE.BoxGeometry { return (gMSKhSeg   ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.064 * HEX_R, 0.013 * HEX_R)); }

// tarcza osemkowa (mykenska): fasetowany owal z lukiem — jak scutum wzorca
function msOvalRing(a: number, b: number, c: number, N: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(ang) * a, y = Math.sin(ang) * b;
    pts.push([x, y, -c * (x / a) * (x / a)]);
  }
  return pts;
}
function msMakeShell(a: number, b: number, c: number, t: number, N: number): THREE.BufferGeometry {
  const ring = msOvalRing(a, b, c, N);
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
function getGMSLobeBig(): THREE.BufferGeometry { return (gMSLobeBig ||= msMakeShell(0.078 * HEX_R, 0.088 * HEX_R, 0.030 * HEX_R, 0.016 * HEX_R, 8)); }
function getGMSLobeSm():  THREE.BufferGeometry { return (gMSLobeSm  ||= msMakeShell(0.064 * HEX_R, 0.072 * HEX_R, 0.024 * HEX_R, 0.016 * HEX_R, 8)); }

// ── anatomia lancuchowa (kopia konwencji niSeg/niBuildLeg/niBuildArm) ──────
function msDirDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}
function msSeg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = msDirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}
function msBuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  mFoot: THREE.MeshStandardMaterial, hipY: number = MS_HIP_Y,
): void {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = msSeg(group, getGMSThigh(), mThigh, P, thU, MS_THIGH_L);
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = msSeg(group, getGMSShin(), mShin, P, thL, MS_SHIN_L);
  const foot = new THREE.Mesh(getGMSFoot(), mFoot);
  foot.position.set(sx, 0.013 * HEX_R, P.z + 0.016 * HEX_R);
  group.add(foot);
}
function msBuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  let P = new THREE.Vector3(sx, MS_SHLD_Y, 0);
  P = msSeg(group, getGMSUpArm(), mUp, P, thU, MS_UPARM_L);
  P.y += 0.010 * HEX_R;
  const wrist = msSeg(group, getGMSForearm(), mFore, P, thF, MS_FOREARM_L);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getGMSFist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(msDirDown(thF), 0.014 * HEX_R));
    group.add(fist);
  }
  return { wrist, axis: msDirDown(thF) };
}
function msBuildCore(
  group: THREE.Group, mat: MatFactory, mTorso: THREE.MeshStandardMaterial,
): void {
  const torso = new THREE.Mesh(getGMSTorso(), mTorso);
  torso.position.set(0, MS_TORSO_CTR, 0);
  group.add(torso);
  const mSkin = mat(MS_SKIN, 0.05, 0.80);
  const neck = new THREE.Mesh(getGMSNeck(), mSkin);
  neck.position.set(0, MS_TORSO_TOP + MS_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(getGMSHead(), mSkin);
  head.position.set(0, MS_HEAD_CTR, 0);
  group.add(head);
}

/** Pancerz pasowy Ludow Morza: 3 poziome pasy skory + 2 skrzyzowane szelki. */
function msStrapArmor(group: THREE.Group, mBand: THREE.MeshStandardMaterial,
                      mStrap: THREE.MeshStandardMaterial): void {
  for (const dy of [0.058, 0.0, -0.058]) {
    const b = new THREE.Mesh(getGMSBandT(), mBand);
    b.position.set(0, MS_TORSO_CTR + dy * HEX_R, 0);
    group.add(b);
  }
  for (const s of [-1, 1]) {
    const strap = new THREE.Mesh(getGMSStrap(), mStrap);
    strap.rotation.set(-0.55, 0, s * 0.62);
    strap.position.set(s * 0.020 * HEX_R, 0.446 * HEX_R, 0.040 * HEX_R);
    group.add(strap);
  }
}

/** Okragla wypukla tarcza: pole (walec zwezany) + rant + opcjonalne umbo. */
function msRoundShield(mFace: THREE.MeshStandardMaterial, mRim: THREE.MeshStandardMaterial,
                       mBoss: THREE.MeshStandardMaterial | null, scale: number): THREE.Group {
  const sh = new THREE.Group();
  const face = new THREE.Mesh(getGMSShFace(), mFace);
  face.rotation.x = Math.PI / 2;
  sh.add(face);
  const rim = new THREE.Mesh(getGMSShRim(), mRim);
  rim.rotation.x = Math.PI / 2;
  rim.position.z = -0.004 * HEX_R;
  sh.add(rim);
  if (mBoss !== null) {
    const boss = new THREE.Mesh(getGMSShBoss(), mBoss);
    boss.position.z = 0.020 * HEX_R;
    sh.add(boss);
  }
  sh.scale.setScalar(scale);
  return sh;
}

/** Tarcza w lewej dloni-gardzie: grupa na nadgarstku, lekko ku osi ciala. */
function msMountShield(group: THREE.Group, sh: THREE.Group, wrist: THREE.Vector3): void {
  sh.position.set(wrist.x - 0.025 * HEX_R, wrist.y + 0.030 * HEX_R, wrist.z + 0.042 * HEX_R);
  sh.rotation.y = -0.20;
  group.add(sh);
}

/**
 * Drzewce dwureczne PRZEZ OBA NADGARSTKI: grupa w srodku odcinka miedzy
 * dlonmi, os +Y = kierunek od dolnej dloni (B) do gornej (A). Zwraca grupe
 * (dodac do figurki) i polowe rozstawu dloni d2 (do pozycjonowania glowicy).
 */
function msPoleBetween(A: THREE.Vector3, B: THREE.Vector3): { W: THREE.Group; d2: number } {
  const dir = new THREE.Vector3().subVectors(A, B);
  const d2 = dir.length() * 0.5;
  dir.normalize();
  const W = new THREE.Group();
  W.position.copy(A.clone().add(B).multiplyScalar(0.5));
  W.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  return { W, d2 };
}

// ---------------------------------------------------------------------------
// WOJOWNIK SHERDEN (Ludy Morza, Rzym/Braz) — CIOS MIECZEM Z GORY
// Helm ROGATY z dyskiem slonecznym (ikona Ludow Morza), prosty brazowy miecz
// w PRAWEJ (-X) wzniesiony do ciecia, okragla tarcza (pole = kolor gracza,
// brazowy rant, stalowe umbo) na LEWYM (+X) przedramieniu, tunika teal,
// skorzany pancerz pasowy, nagolenice = brazowe golenie, wykrok.
// ---------------------------------------------------------------------------
export function buildSherden(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();
  const mBronze = mat(MS_BRONZE,    0.42, 0.45);
  const mBronzL = mat(MS_BRONZE_LT, 0.52, 0.38);
  const mSteel  = mat(MS_STEEL,     0.52, 0.40);
  const mOwner  = mat(ownerColor_,  0.14, 0.64);
  const mTunic  = mat(MS_TEAL,      0.05, 0.80);
  const mLeath  = mat(MS_LEATHER,   0.06, 0.82);
  const mLeatD  = mat(MS_LEATHER_DK,0.06, 0.84);
  const mSkin   = mat(MS_SKIN,      0.05, 0.80);

  const HIP_Y = MS_HIP_Y - 0.012 * HEX_R;
  niCoreP4(group, mat, mTunic, mLeath, mLeatD);

  // nogi: LEWA (+X) wykroczna; golenie brazowe = nagolenice, sandaly skorzane
  msBuildLeg(group,  MS_HIP_X,  0.58,  0.34, mSkin, mBronzL, mLeath, HIP_Y);
  msBuildLeg(group, -MS_HIP_X, -0.52, -0.20, mSkin, mBronzL, mLeath, HIP_Y);

  // HELM ROGATY: brazowa misa + 2 rogi (po 2 segmenty — polksiezyc) + dysk
  const bowl = new THREE.Mesh(getGMSBowl(), mBronze);
  bowl.position.set(0, MS_HEAD_CTR + 0.030 * HEX_R, 0);
  group.add(bowl);
  const spike = new THREE.Mesh(getGMSSpike(), mBronzL);
  spike.position.set(0, MS_HEAD_TOP + 0.052 * HEX_R, 0);
  group.add(spike);
  const disc = new THREE.Mesh(getGMSDisc(), mBronzL);       // dysk sloneczny
  disc.position.set(0, MS_HEAD_TOP + 0.092 * HEX_R, 0);
  group.add(disc);
  for (const sx of [-1, 1]) {
    const h1 = new THREE.Mesh(getGMSHorn(), mBronzL);       // rog: segment dolny (na zewnatrz)
    h1.rotation.z = -sx * 0.62;
    h1.position.set(sx * 0.058 * HEX_R, MS_HEAD_TOP + 0.016 * HEX_R, 0);
    group.add(h1);
    const h2 = new THREE.Mesh(getGMSHorn(), mBronzL);       // rog: segment gorny (czubek ku gorze)
    h2.scale.set(0.85, 0.85, 0.85);
    h2.rotation.z = sx * 0.25;
    h2.position.set(sx * 0.070 * HEX_R, MS_HEAD_TOP + 0.066 * HEX_R, 0);
    group.add(h2);
  }

  // PRAWE (-X) RAMIE + MIECZ wzniesiony do ciecia (klinga NA OSI przedramienia)
  const armR = msBuildArm(group, -MS_SHLD_X, -2.15, 2.85, mTunic, mSkin, mLeath);
  const blade = new THREE.Mesh(getGMSBlade(), mBronzL);
  blade.rotation.x = Math.PI - 2.85;
  blade.position.copy(armR.wrist.clone().addScaledVector(armR.axis, 0.100 * HEX_R));
  group.add(blade);
  const tip = new THREE.Mesh(getGMSBladeTip(), mBronzL);
  tip.rotation.x = Math.PI - 2.85;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(armR.wrist.clone().addScaledVector(armR.axis, 0.192 * HEX_R));
  group.add(tip);
  const guard = new THREE.Mesh(getGMSGuard(), mBronze);
  guard.rotation.x = Math.PI - 2.85;
  guard.position.copy(armR.wrist.clone().addScaledVector(armR.axis, 0.030 * HEX_R));
  group.add(guard);

  // LEWE (+X) RAMIE + OKRAGLA TARCZA (pole gracza, rant braz, umbo stal)
  const armL = msBuildArm(group, MS_SHLD_X, 0.50, 1.10, mTunic, mSkin, null);
  msMountShield(group, msRoundShield(mOwner, mBronze, mSteel, 1.0), armL.wrist);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

/** Wspolny korpus P4: tors(tunika)+szyja+glowa+spodnica+pas+pancerz pasowy. */
function niCoreP4(group: THREE.Group, mat: MatFactory, mTunic: THREE.MeshStandardMaterial,
                  mLeath: THREE.MeshStandardMaterial, mLeatD: THREE.MeshStandardMaterial): void {
  msBuildCore(group, mat, mTunic);
  const skirt = new THREE.Mesh(getGMSSkirt(), mTunic);
  skirt.position.set(0, MS_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const belt = new THREE.Mesh(getGMSBelt(), mLeath);
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);
  msStrapArmor(group, mLeatD, mLeath);
}

// ---------------------------------------------------------------------------
// WOJOWNIK TYRRENSKI (Ludy Morza, Rzym/Braz) — ZAMACH TOPOREM DWURECZNYM
// Helm z GRZEBIENIEM przod-tyl (kolor gracza), topor dwureczny nad prawym
// barkiem (drzewce przez oba nadgarstki, ostrze = kolor gracza jak stary),
// broda, okragla tarcza gracza przewieszona NA PLECACH, tunika morski granat,
// pancerz pasowy, gleboki wykrok zamachu.
// ---------------------------------------------------------------------------
export function buildTyrrhenian(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();
  const mBronze = mat(MS_BRONZE,    0.42, 0.45);
  const mBronzL = mat(MS_BRONZE_LT, 0.52, 0.38);
  const mOwner  = mat(ownerColor_,  0.14, 0.64);
  const mTunic  = mat(MS_SEABLUE,   0.05, 0.80);
  const mWood   = mat(MS_WOOD,      0.05, 0.85);
  const mLeath  = mat(MS_LEATHER,   0.06, 0.82);
  const mLeatD  = mat(MS_LEATHER_DK,0.06, 0.84);
  const mSkin   = mat(MS_SKIN,      0.05, 0.80);
  const mHair   = mat(MS_DARKHAIR,  0.04, 0.88);

  const HIP_Y = MS_HIP_Y - 0.016 * HEX_R;
  niCoreP4(group, mat, mTunic, mLeath, mLeatD);

  // medalion na piersi (jak stary)
  const medal = new THREE.Mesh(getGMSMedal(), mBronzL);
  medal.position.set(0, MS_TORSO_CTR + 0.055 * HEX_R, MS_TORSO_D * 0.5 + 0.008 * HEX_R);
  group.add(medal);
  // broda
  const beard = new THREE.Mesh(getGMSBeard(), mHair);
  beard.position.set(0, MS_HEAD_CTR - 0.042 * HEX_R, MS_HEAD_S * 0.5 + 0.004 * HEX_R);
  group.add(beard);

  // nogi — gleboki wykrok zamachu
  msBuildLeg(group,  MS_HIP_X,  0.66,  0.42, mSkin, mBronzL, mLeath, HIP_Y);
  msBuildLeg(group, -MS_HIP_X, -0.58, -0.24, mSkin, mBronzL, mLeath, HIP_Y);

  // HELM Z GRZEBIENIEM: misa + podstawa + grzebien przod-tyl (kolor gracza)
  const bowl = new THREE.Mesh(getGMSBowl(), mBronze);
  bowl.position.set(0, MS_HEAD_CTR + 0.030 * HEX_R, 0);
  group.add(bowl);
  const cBase = new THREE.Mesh(getGMSCrestBase(), mBronzL);
  cBase.position.set(0, MS_HEAD_TOP + 0.022 * HEX_R, 0);
  group.add(cBase);
  const crest = new THREE.Mesh(getGMSCrestHair(), mOwner);
  crest.rotation.x = 0.10;
  crest.position.set(0, MS_HEAD_TOP + 0.062 * HEX_R, -0.006 * HEX_R);
  group.add(crest);

  // OBIE RECE NA TOPORZE — zamach po przekatnej nad prawym barkiem
  const armR = msBuildArm(group, -MS_SHLD_X, -2.45, 2.85, mTunic, mSkin, mLeath); // gorna dlon
  const armL = msBuildArm(group,  MS_SHLD_X,  0.45, 2.05, mTunic, mSkin, mLeath); // dolna dlon
  const { W, d2 } = msPoleBetween(armR.wrist, armL.wrist);
  const haft = new THREE.Mesh(getGMSHaft(), mWood);
  haft.position.y = 0.030 * HEX_R;                    // drzewce wystaje za gorna dlon
  W.add(haft);
  const head = new THREE.Mesh(getGMSAxeHead(), mBronze);   // glowica za gorna dlonia
  head.position.set(0.034 * HEX_R, d2 + 0.115 * HEX_R, 0);
  W.add(head);
  const edge = new THREE.Mesh(getGMSAxeEdge(), mOwner);    // ostrze = kolor gracza
  edge.position.set(0.086 * HEX_R, d2 + 0.115 * HEX_R, 0);
  W.add(edge);
  const socket = new THREE.Mesh(getGMSKnob(), mBronzL);    // gniazdo osadzenia
  socket.position.set(0, d2 + 0.115 * HEX_R, 0);
  W.add(socket);
  group.add(W);

  // OKRAGLA TARCZA GRACZA NA PLECACH (blazon widoczny z tylu)
  const sh = msRoundShield(mOwner, mBronze, null, 0.85);
  sh.rotation.y = Math.PI;
  sh.position.set(0.010 * HEX_R, MS_TORSO_CTR + 0.020 * HEX_R, -(MS_TORSO_D * 0.5 + 0.034 * HEX_R));
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// WOJOWNIK SZEKELESZ (Ludy Morza, Rzym/Braz) — PCHNIECIE WLOCZNIA PODRECZNE
// Czapka TRZCINOWA (pionowe pasy trzciny) + OPASKA kolor gracza, wlocznia
// pozioma w PRAWEJ na osi dloni, MALA okragla tarcza gracza na LEWYM
// przedramieniu, brazowe naramienniki, frendzle kiltu, tunika morska zielen.
// ---------------------------------------------------------------------------
export function buildShekelesh(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();
  const mBronze = mat(MS_BRONZE,    0.42, 0.45);
  const mBronzL = mat(MS_BRONZE_LT, 0.52, 0.38);
  const mOwner  = mat(ownerColor_,  0.14, 0.64);
  const mTunic  = mat(MS_SEAGREEN,  0.05, 0.80);
  const mWood   = mat(MS_WOOD,      0.05, 0.85);
  const mLeath  = mat(MS_LEATHER,   0.06, 0.82);
  const mLeatD  = mat(MS_LEATHER_DK,0.06, 0.84);
  const mLinen  = mat(MS_LINEN,     0.04, 0.88);
  const mSkin   = mat(MS_SKIN,      0.05, 0.80);

  const HIP_Y = MS_HIP_Y - 0.010 * HEX_R;
  niCoreP4(group, mat, mTunic, mLeath, mLeatD);

  // frendzle kiltu (3 lniane bloczki pod rabkiem — znak rozpoznawczy starego)
  for (const i of [-0.5, 0.5]) {
    const fr = new THREE.Mesh(getGMSFringe(), mLinen);
    fr.position.set(i * 0.048 * HEX_R, MS_TORSO_BOT - 0.062 * HEX_R, 0.052 * HEX_R);
    group.add(fr);
  }

  // nogi — wykrok pchniecia
  msBuildLeg(group,  MS_HIP_X,  0.52,  0.28, mSkin, mBronzL, mLeath, HIP_Y);
  msBuildLeg(group, -MS_HIP_X, -0.46, -0.16, mSkin, mBronzL, mLeath, HIP_Y);

  // CZAPKA TRZCINOWA: ciemna misa + 4 pionowe pasy trzciny + opaska gracza
  const bowl = new THREE.Mesh(getGMSBowl(), mLeatD);
  bowl.position.set(0, MS_HEAD_CTR + 0.030 * HEX_R, 0);
  group.add(bowl);
  for (const k of [-1, 0, 1]) {
    const ang = k * 0.80;
    const reed = new THREE.Mesh(getGMSReed(), mLinen);
    reed.rotation.y = ang;
    reed.rotation.z = -Math.sin(ang) * 0.14;          // pasy klada sie po misie
    reed.position.set(Math.sin(ang) * 0.086 * HEX_R, MS_HEAD_CTR + 0.052 * HEX_R, Math.cos(ang) * 0.086 * HEX_R);
    group.add(reed);
  }
  const band = new THREE.Mesh(getGMSBand(), mOwner);  // OPASKA gracza
  band.scale.setScalar(1.05);
  band.position.set(0, MS_HEAD_CTR + 0.020 * HEX_R, 0);
  group.add(band);

  // PRAWE (-X) RAMIE + WLOCZNIA POZIOMO (pchniecie podreczne, grot w przod)
  const armR = msBuildArm(group, -MS_SHLD_X, 0.55, 1.62, mTunic, mSkin, mLeath);
  const shaft = new THREE.Mesh(getGMSSpShaft(), mWood);
  shaft.rotation.x = Math.PI - 1.62;
  shaft.position.copy(armR.wrist.clone().addScaledVector(armR.axis, 0.150 * HEX_R));
  group.add(shaft);
  const tip = new THREE.Mesh(getGMSSpTip(), mBronzL);
  tip.rotation.x = Math.PI - 1.62;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(armR.wrist.clone().addScaledVector(armR.axis, (0.150 + 0.280 + 0.026) * HEX_R));
  group.add(tip);

  // LEWE (+X) RAMIE + MALA okragla tarcza (pole gracza, rant braz, umbo braz)
  const armL = msBuildArm(group, MS_SHLD_X, 0.45, 1.08, mTunic, mSkin, null);
  msMountShield(group, msRoundShield(mOwner, mBronze, mBronzL, 0.74), armL.wrist);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// WOJOWNIK MYKENSKI (Grecja, Braz) — PCHNIECIE MIECZEM NAUE
// Helm z KLOW DZIKA: skorzana czapka + 3 KREMOWE pasy klow + guz brazowy +
// policzki; brazowy kirys + skorzane pterugesy; miecz naue II (braz) pchniecie
// w przod; TARCZA OSEMKOWA (dwa owalne platy skory, listwa talii = kolor
// gracza) na LEWYM przedramieniu; nagolenice brazowe.
// ---------------------------------------------------------------------------
export function buildMycenaeanWarrior(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();
  const mBronze = mat(MS_BRONZE,    0.42, 0.45);
  const mBronzL = mat(MS_BRONZE_LT, 0.52, 0.38);
  const mOwner  = mat(ownerColor_,  0.14, 0.64);
  const mTunic  = mat(MS_OCHRE,     0.05, 0.80);
  const mTusk   = mat(MS_TUSK,      0.04, 0.80);
  const mHide   = mat(MS_HIDE,      0.05, 0.86);
  const mLeath  = mat(MS_LEATHER,   0.06, 0.82);
  const mSkin   = mat(MS_SKIN,      0.05, 0.80);

  const HIP_Y = MS_HIP_Y - 0.012 * HEX_R;
  msBuildCore(group, mat, mBronze);                   // tors = brazowy kirys
  const skirt = new THREE.Mesh(getGMSSkirt(), mLeath);// pterugesy skorzane
  skirt.position.set(0, MS_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const belt = new THREE.Mesh(getGMSBelt(), mBronzL); // pas brazowy kirysu
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);

  // nogi: golenie brazowe = nagolenice
  msBuildLeg(group,  MS_HIP_X,  0.58,  0.34, mTunic, mBronzL, mLeath, HIP_Y);
  msBuildLeg(group, -MS_HIP_X, -0.52, -0.20, mTunic, mBronzL, mLeath, HIP_Y);

  // HELM Z KLOW DZIKA: skorzana czapka + 3 kremowe pasy + guz + policzki
  const cap = new THREE.Mesh(getGMSCap(), mLeath);
  cap.position.set(0, MS_HEAD_CTR + 0.032 * HEX_R, 0);
  group.add(cap);
  const b1 = new THREE.Mesh(getGMSTuskB1(), mTusk);
  b1.position.set(0, MS_HEAD_CTR + 0.006 * HEX_R, 0);
  group.add(b1);
  const b2 = new THREE.Mesh(getGMSTuskB2(), mTusk);
  b2.position.set(0, MS_HEAD_CTR + 0.042 * HEX_R, 0);
  group.add(b2);
  const b3 = new THREE.Mesh(getGMSTuskB3(), mTusk);
  b3.position.set(0, MS_HEAD_CTR + 0.078 * HEX_R, 0);
  group.add(b3);
  const knob = new THREE.Mesh(getGMSKnob(), mBronzL);
  knob.position.set(0, MS_HEAD_TOP + 0.052 * HEX_R, 0);
  group.add(knob);
  for (const sx of [-1, 1]) {
    const ck = new THREE.Mesh(getGMSCheek(), mTusk);
    ck.position.set(sx * (MS_HEAD_S * 0.5 + 0.004 * HEX_R), MS_HEAD_CTR - 0.016 * HEX_R, 0.016 * HEX_R);
    group.add(ck);
  }

  // PRAWE (-X) RAMIE + MIECZ NAUE II: pchniecie w przod na wysokosci piersi
  const armR = msBuildArm(group, -MS_SHLD_X, 0.95, 1.50, mTunic, mSkin, mLeath);
  const blade = new THREE.Mesh(getGMSBlade(), mBronzL);
  blade.rotation.x = Math.PI - 1.50;
  blade.position.copy(armR.wrist.clone().addScaledVector(armR.axis, 0.100 * HEX_R));
  group.add(blade);
  const tip = new THREE.Mesh(getGMSBladeTip(), mBronzL);
  tip.rotation.x = Math.PI - 1.50;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(armR.wrist.clone().addScaledVector(armR.axis, 0.192 * HEX_R));
  group.add(tip);
  const guard = new THREE.Mesh(getGMSGuard(), mBronze);
  guard.rotation.x = Math.PI - 1.50;
  guard.position.copy(armR.wrist.clone().addScaledVector(armR.axis, 0.030 * HEX_R));
  group.add(guard);

  // LEWE (+X) RAMIE + TARCZA OSEMKOWA: dwa owalne platy + listwa talii gracza
  const armL = msBuildArm(group, MS_SHLD_X, 0.52, 1.05, mTunic, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(armL.wrist.x - 0.028 * HEX_R, armL.wrist.y + 0.040 * HEX_R, armL.wrist.z + 0.045 * HEX_R);
  sh.rotation.y = -0.32;
  const lobeB = new THREE.Mesh(getGMSLobeBig(), mHide);
  lobeB.position.set(0, -0.070 * HEX_R, 0);
  sh.add(lobeB);
  const lobeS = new THREE.Mesh(getGMSLobeSm(), mHide);
  lobeS.position.set(0, 0.088 * HEX_R, 0.004 * HEX_R);
  sh.add(lobeS);
  const waist = new THREE.Mesh(getGMSWaistBar(), mOwner);   // talia = kolor gracza
  waist.position.set(0, 0.010 * HEX_R, 0.014 * HEX_R);
  sh.add(waist);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// HALABARDNIK SHANG (Chiny, Braz) — CIOS HALABARDA GE W DOL (dwurecznie)
// Brazowy helm z MASKA TAOTIE (plyta + ciemne oczy) + kolnierz karku kolor
// gracza; lakowany czerwony kaftan lamelowy (pasy brazowe); halabarda GE:
// drzewce przez oba nadgarstki, KLINGA POPRZECZNA przy szczycie + kita gracza
// + brazowy grot szczytowy. Bez tarczy (jak stary).
// ---------------------------------------------------------------------------
export function buildShangHalberdier(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();
  const mLac    = mat(MS_LACQUER,   0.10, 0.55);
  const mBronze = mat(MS_BRONZE,    0.42, 0.45);
  const mBronzL = mat(MS_BRONZE_LT, 0.52, 0.38);
  const mOwner  = mat(ownerColor_,  0.14, 0.64);
  const mWood   = mat(MS_WOOD,      0.05, 0.85);
  const mLeath  = mat(MS_LEATHER,   0.06, 0.82);
  const mSkin   = mat(MS_SKIN,      0.05, 0.80);
  const mDark   = mat(MS_DARK,      0.05, 0.90);

  const HIP_Y = MS_HIP_Y - 0.014 * HEX_R;
  msBuildCore(group, mat, mLac);                      // kaftan lakowy
  const skirt = new THREE.Mesh(getGMSSkirt(), mLac);
  skirt.position.set(0, MS_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const belt = new THREE.Mesh(getGMSBelt(), mLeath);
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);
  for (const dy of [0.058, 0.0, -0.058]) {            // pasy lamelowe brazowe
    const b = new THREE.Mesh(getGMSBandT(), mBronzL);
    b.position.set(0, MS_TORSO_CTR + dy * HEX_R, 0);
    group.add(b);
  }

  // nogi: lakowane spodnie, sandaly
  msBuildLeg(group,  MS_HIP_X,  0.60,  0.36, mLac, mLac, mLeath, HIP_Y);
  msBuildLeg(group, -MS_HIP_X, -0.54, -0.22, mLac, mLac, mLeath, HIP_Y);

  // HELM TAOTIE: brazowa misa + plyta maski + 2 ciemne oczy + kolnierz gracza
  const bowl = new THREE.Mesh(getGMSBowl(), mBronze);
  bowl.position.set(0, MS_HEAD_CTR + 0.030 * HEX_R, 0);
  group.add(bowl);
  const mask = new THREE.Mesh(getGMSMask(), mBronzL);
  mask.position.set(0, MS_HEAD_CTR + 0.030 * HEX_R, 0.072 * HEX_R);
  group.add(mask);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(getGMSEye(), mDark);
    eye.position.set(sx * 0.028 * HEX_R, MS_HEAD_CTR + 0.034 * HEX_R, 0.084 * HEX_R);
    group.add(eye);
  }
  const brow = new THREE.Mesh(getGMSEye(), mDark);           // brew taotie (zwoj)
  brow.scale.set(2.6, 0.8, 1.0);
  brow.position.set(0, MS_HEAD_CTR + 0.052 * HEX_R, 0.084 * HEX_R);
  group.add(brow);
  for (const sx of [-1, 1]) {                                // policzki brazowe
    const ck = new THREE.Mesh(getGMSCheek(), mBronze);
    ck.position.set(sx * (MS_HEAD_S * 0.5 + 0.004 * HEX_R), MS_HEAD_CTR - 0.014 * HEX_R, 0.014 * HEX_R);
    group.add(ck);
  }
  const spike = new THREE.Mesh(getGMSSpike(), mBronzL);
  spike.position.set(0, MS_HEAD_TOP + 0.048 * HEX_R, 0);
  group.add(spike);
  const flap = new THREE.Mesh(getGMSFlap(), mOwner);  // kolnierz karku gracza
  flap.position.set(0, MS_HEAD_CTR - 0.034 * HEX_R, -MS_HEAD_S * 0.5 - 0.008 * HEX_R);
  group.add(flap);

  // OBIE RECE NA DRZEWCU GE — cios w dol (przedni koniec ku wrogowi)
  const armR = msBuildArm(group, -MS_SHLD_X, -2.20, 2.60, mLac, mSkin, mLeath); // gorna dlon (tyl)
  const armL = msBuildArm(group,  MS_SHLD_X,  0.50, 1.30, mLac, mSkin, mLeath); // dolna dlon (przod)
  const { W, d2 } = msPoleBetween(armR.wrist, armL.wrist);   // +Y = ku gornej dloni
  const pole = new THREE.Mesh(getGMSPole(), mWood);
  pole.position.y = -0.060 * HEX_R;                   // drzewce dluzsze ku wrogowi
  W.add(pole);
  const ge = new THREE.Mesh(getGMSGeBlade(), mBronzL);       // KLINGA POPRZECZNA
  ge.position.set(0, -(d2 + 0.130 * HEX_R), 0.052 * HEX_R);
  W.add(ge);
  const tassel = new THREE.Mesh(getGMSGeTassel(), mOwner);   // kita gracza pod klinga
  tassel.position.set(0, -(d2 + 0.088 * HEX_R), 0.030 * HEX_R);
  W.add(tassel);
  const cap = new THREE.Mesh(getGMSGeCap(), mBronze);        // grot szczytowy
  cap.rotation.x = Math.PI;                            // czubkiem ku wrogowi (-Y)
  cap.position.set(0, -(d2 + 0.185 * HEX_R), 0);
  W.add(cap);
  group.add(W);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// WOJOWNIK Z KHOPESH (Egipt, Braz) — CIECIE SIERPOWCEM Z ZAMACHU
// Niebieski helm KHEPRESH ze zlota opaska i ureuszem; zloty kolnierz usekh;
// lniany kilt + pas biodrowy kolor gracza; KHOPESH: prosta czesc na osi
// przedramienia + sierpowy HAK z 3 segmentow wyginajacy sie w przod; mala
// okragla tarcza (pole gracza) na LEWYM przedramieniu.
// ---------------------------------------------------------------------------
export function buildKhopeshWarrior(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();
  const mBronze = mat(MS_BRONZE,    0.42, 0.45);
  const mBronzL = mat(MS_BRONZE_LT, 0.52, 0.38);
  const mOwner  = mat(ownerColor_,  0.14, 0.64);
  const mLinen  = mat(MS_LINEN,     0.05, 0.86);
  const mBlue   = mat(MS_WOAD,      0.06, 0.72);
  const mGold   = mat(MS_GOLD,      0.55, 0.38);
  const mLeath  = mat(MS_LEATHER,   0.06, 0.82);
  const mSkin   = mat(MS_SKIN,      0.05, 0.80);

  const HIP_Y = MS_HIP_Y - 0.012 * HEX_R;
  msBuildCore(group, mat, mLinen);                    // lniana tunika
  const skirt = new THREE.Mesh(getGMSSkirt(), mLinen);// lniany kilt
  skirt.position.set(0, MS_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const waist = new THREE.Mesh(getGMSBelt(), mOwner); // pas biodrowy gracza
  waist.position.set(0, 0.252 * HEX_R, 0);
  group.add(waist);
  const collar = new THREE.Mesh(getGMSCollar(), mGold);      // kolnierz usekh
  collar.position.set(0, MS_TORSO_TOP - 0.008 * HEX_R, 0);
  group.add(collar);

  // nogi: bose uda, sandaly
  msBuildLeg(group,  MS_HIP_X,  0.56,  0.32, mSkin, mSkin, mLeath, HIP_Y);
  msBuildLeg(group, -MS_HIP_X, -0.50, -0.18, mSkin, mSkin, mLeath, HIP_Y);

  // HELM KHEPRESH: niebieska bania (lekko ku tylowi) + zlota opaska + ureusz
  const khep = new THREE.Mesh(getGMSKhep(), mBlue);
  khep.rotation.x = -0.10;
  khep.position.set(0, MS_HEAD_CTR + 0.034 * HEX_R, -0.006 * HEX_R);
  group.add(khep);
  const band = new THREE.Mesh(getGMSBand(), mGold);
  band.scale.setScalar(0.97);
  band.position.set(0, MS_HEAD_CTR + 0.016 * HEX_R, 0);
  group.add(band);
  const uraeus = new THREE.Mesh(getGMSUraeus(), mGold);
  uraeus.position.set(0, MS_HEAD_CTR + 0.075 * HEX_R, 0.060 * HEX_R);
  group.add(uraeus);

  // PRAWE (-X) RAMIE + KHOPESH z zamachu: prosta czesc na osi, hak w przod
  const armR = msBuildArm(group, -MS_SHLD_X, -2.35, 2.75, mSkin, mSkin, mLeath);
  const kh = new THREE.Group();
  kh.position.copy(armR.wrist);
  kh.rotation.x = Math.PI - 2.75;                     // lokalny +Y = os przedramienia
  const straight = new THREE.Mesh(getGMSKhStr(), mBronzL);
  straight.position.set(0, 0.072 * HEX_R, 0);
  kh.add(straight);
  let Py = 0.120 * HEX_R, Pz = 0;                     // lancuch haka: 3 segmenty
  for (const a of [0.40, 0.95, 1.55]) {
    const seg = new THREE.Mesh(getGMSKhSeg(), mBronzL);
    seg.rotation.x = a;
    const dy = Math.cos(a) * 0.062 * HEX_R, dz = Math.sin(a) * 0.062 * HEX_R;
    seg.position.set(0, Py + dy * 0.5, Pz + dz * 0.5);
    kh.add(seg);
    Py += dy; Pz += dz;
  }
  const guard = new THREE.Mesh(getGMSGuard(), mGold); // zlota gardka nad piescia
  guard.position.set(0, 0.026 * HEX_R, 0);
  kh.add(guard);
  group.add(kh);

  // LEWE (+X) RAMIE + MALA TARCZA (pole gracza, rant braz, umbo brazowe)
  const armL = msBuildArm(group, MS_SHLD_X, 0.48, 1.06, mSkin, mSkin, null);
  msMountShield(group, msRoundShield(mOwner, mBronze, mBronzL, 0.78), armL.wrist);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}
