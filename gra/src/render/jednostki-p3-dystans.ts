/**
 * jednostki-p3-dystans.ts — proceduralne modele DYSTANSOWYCH per cywilizacja
 * PACZKA 3/8 (render-jednostki, seria MASTER)
 * ---------------------------------------------------------------------------
 * Zamienniki 1:1 dla starych tokenow z render/units.ts:
 *   buildZuluJavelineer(ownerColor)  -> units.ts:1804 buildZuluJavelineer
 *                                       (dispatch: 'oszczepnik zulu'/'izijula'/'isijula'/'zulu javelineer')
 *   buildEgyptianArcher(ownerColor)  -> units.ts:2223 buildEgyptianArcher
 *                                       (dispatch: 'lucznik egipski'/'egyptian archer')
 *   buildSumerianArcher(ownerColor)  -> units.ts:1947 buildSumerianArcher
 *                                       (dispatch: 'lucznik sumeryjski'/'sumerian archer')
 *   buildAkkadianArcher(ownerColor)  -> units.ts:3555 buildAkkadianArcher
 *                                       (dispatch: 'lucznik akadyjski'/'akadyjsk'/'akkad'/'akkadian archer')
 *   buildAssyrianArcher(ownerColor)  -> NOWY CASE. Dzis Lucznik asyryjski spada
 *                                       do GENERYKA buildCategoryModel('lucznik');
 *                                       wpiecie: w buildNamedUnit dodac
 *                                       if (n.includes('lucznik asyryjski') || n.includes('asyryjsk') ||
 *                                           n.includes('assyrian archer')) return buildAssyrianArcher(ownerColor_);
 *
 * Interfejs i konwencje BEZ ZMIAN (jak hastati-falangita.ts):
 *   - figurka PRZODEM do +Z, stopy na y = 0 grupy, wysokosc ~0.55*HEX_R,
 *   - group.userData['mats'] i ['perTokenGeos'] jak w units.ts,
 *   - geometrie wspolne = singletony modulu (perTokenGeos puste),
 *   - uklad prawoskretny: przod = +Z, gora = +Y  =>  LEWA reka = +X, PRAWA = -X.
 *
 * ZASADY WLASCICIELA (paczka 3):
 *   1. LUCZNICY: luk w LEWEJ (+X) dloni, strzala i cieciwa w PRAWEJ (-X) —
 *      POZA PELNEGO NACIAGU: lewa reka wyprostowana ku srodkowi przed pier-
 *      sia, prawa dlon z nasada strzaly cofnieta za policzek, cieciwa = V
 *      od obu koncow lucziska do dloni, strzala NA OSI naciagu, grot ~+Z.
 *      Kotwice liczone IK (pdArmIK) — nic nie lewituje, konczyny sie domykaja.
 *   2. OSZCZEPNIK: zamach — prawa reka nad barkiem z oszczepem NA OSI dloni
 *      (grot w przod, lekko w dol), lewa reka z tarcza nguni przed korpusem,
 *      gleboki wykrok.
 *   3. NAKRYCIE GLOWY KAZDY: Zulu = opaska futrzana + piora (isicoco),
 *      Egipt = chusta plocienna typu nemes (pasy blekitu, klapki na barki),
 *      Sumer = stozkowy helm filcowo-miedziany, Akad = brazowy helm z nosalem,
 *      Asyria = wysoki stozkowy helm z grzebieniem luskowym.
 *   4. KOLOR GRACZA jak niosly stare tokeny: Zulu = umbo tarczy + opaska na
 *      ramieniu; Egipt = pas na biodrach + lotki strzal; Sumer = pas nad
 *      kaunakesem + lotki; Akad = fredzla-lamowka szaty + lotki; ASYRIA
 *      (decyzja spojna, nowy wzor): REKAWY tuniki pod luska + szarfa pasa
 *      + lotki strzal.
 *   5. Rozroznialnosc kultur: Zulu = owalna bydleca tarcza nguni w LACIATY
 *      wzor (biale platy na brazie) + pek oszczepow; Egipt = biala spodniczka
 *      shenti + zloty kolnierz usech + luk prosty; Sumer = fredzlowy kaunakes
 *      (3 poziomy runa) + broda; Akad = luk kompozytowy + kolczan NA PLECACH
 *      + dluga szata z fredzla; Asyria = zbroja luskowa (rzedy lamelek),
 *      wysokie buty, dluga broda.
 *
 * Anatomia SPOJNA z hastati-falangita.ts (rodzina NI_* -> PD_*): konczyny
 * lancuchowe, RAMIONA przez IK dwusegmentowe (pdArmIK: bark->lokiec->dlon,
 * biegun lokcia zadawany), BRON NA OSI/W DLONI. Stopy plasko na y=0.
 *
 * Budzet (policzony traversem, stary -> nowy): Zulu 356->454, Egipt 384->452,
 * Sumer 344->460, Akad 332->448, Asyria 448(generyk)->460 — wszystkie <= ~460.
 * Odstepstwo od starych: brak klockow oczu (rodzina hastati-falangita v2 —
 * twarze czyste, naglowia obowiazkowe).
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

// ── kolory serii (zgodne z paleta units.ts) ────────────────────────────────
const PD_SKIN       = 0xe0ac69;   // skora jasna (Egipt/Sumer/Akad/Asyria)
const PD_SKIN_ZULU  = 0xb06030;   // skora Zulu (jak stary token)
const PD_BRONZE     = 0xcf9234;
const PD_BRONZE_LT  = 0xd0a050;
const PD_STEEL      = 0xc2cad2;
const PD_WOOD       = 0x7a5c3a;
const PD_WOOD_BOW   = 0x8a6238;   // luczisko (jasniejsze niz stare — czytelne na tle stroju)
const PD_LEATHER    = 0x6b4a28;
const PD_GOLD       = 0xd4a830;
const PD_LINEN      = 0xe8e0c8;
const PD_STRING     = 0xe8e0cc;   // cieciwa (jak stara)
const PD_TEAL       = 0x1f7a78;   // tunika Sumeru (jak stara)
const PD_FLEECE     = 0xd8c8a0;   // runo kaunakes (jak stare)
const PD_WOAD       = 0x2f5aa0;   // blekit egipski (pasy nemes)
const PD_HIDE_RED   = 0x8a3a26;   // bydleca skora tarczy nguni (jak stara)
const PD_PAINT_WHT  = 0xeae3d2;   // biale platy nguni / piora
const PD_HAIR_DK    = 0x1a0c06;   // wlosy / broda
const PD_FUR_DK     = 0x3a2214;   // futro opaski isicoco
const PD_LOIN_DK    = 0x3a2810;   // przepaska Zulu (jak stara)
const PD_SCALE      = 0x9a8a5a;   // luska asyryjska (brazowo-plowa)
const PD_SCALE_DK   = 0x6f6242;   // ciemniejsze rzedy lamelek
const PD_BOOT_DK    = 0x4a3526;   // wysokie buty asyryjskie

// ── wymiary sylwetki (rodzina NI_* z hastati-falangita.ts) ─────────────────
const PD_HIP_Y     = 0.208 * HEX_R;
const PD_TORSO_W   = 0.180 * HEX_R;
const PD_TORSO_H   = 0.205 * HEX_R;
const PD_TORSO_D   = 0.100 * HEX_R;
const PD_TORSO_BOT = 0.240 * HEX_R;
const PD_TORSO_CTR = PD_TORSO_BOT + PD_TORSO_H * 0.5;
const PD_TORSO_TOP = PD_TORSO_BOT + PD_TORSO_H;
const PD_NECK_H    = 0.028 * HEX_R;
const PD_HEAD_S    = 0.128 * HEX_R;
const PD_HEAD_CTR  = PD_TORSO_TOP + PD_NECK_H + PD_HEAD_S * 0.5;
const PD_HEAD_TOP  = PD_TORSO_TOP + PD_NECK_H + PD_HEAD_S;
const PD_SHLD_X    = PD_TORSO_W * 0.5 + 0.030 * HEX_R;
const PD_SHLD_Y    = PD_TORSO_TOP - 0.024 * HEX_R;
const PD_HIP_X     = 0.052 * HEX_R;

const PD_THIGH_L   = 0.104 * HEX_R;
const PD_SHIN_L    = 0.096 * HEX_R;
const PD_UPARM_L   = 0.100 * HEX_R;
const PD_FOREARM_L = 0.092 * HEX_R;

// ── geometrie-singletony (lazy; wspolne dla wszystkich tokenow) ────────────
let gPDTorso:    THREE.BoxGeometry | null = null;
let gPDNeck:     THREE.BoxGeometry | null = null;
let gPDHead:     THREE.BoxGeometry | null = null;
let gPDThigh:    THREE.BoxGeometry | null = null;
let gPDShin:     THREE.BoxGeometry | null = null;
let gPDFoot:     THREE.BoxGeometry | null = null;
let gPDUpArm:    THREE.BoxGeometry | null = null;
let gPDForearm:  THREE.BoxGeometry | null = null;
let gPDFist:     THREE.BoxGeometry | null = null;
let gPDSkirt:    THREE.BoxGeometry | null = null;   // spodnica/kilt/szata
let gPDBelt:     THREE.BoxGeometry | null = null;   // pas na biodrach
// luk + strzala + kolczan
let gPDBowMid:   THREE.BoxGeometry | null = null;   // srodkowy segment lucziska
let gPDBowLimb:  THREE.BoxGeometry | null = null;   // ramie lucziska
let gPDBowSiyah: THREE.BoxGeometry | null = null;   // koncowka (siyah)
let gPDUnit:     THREE.BoxGeometry | null = null;   // jednostkowy cienki box (cieciwa/strzala, skalowany per mesh)
let gPDArrowTip: THREE.ConeGeometry | null = null;
let gPDFletch:   THREE.BoxGeometry | null = null;
let gPDQuiver:   THREE.BoxGeometry | null = null;
let gPDQArrow:   THREE.BoxGeometry | null = null;   // drzewce w kolczanie
// naglowia
let gPDConeHelm: THREE.CylinderGeometry | null = null;  // stozek Sumer/Akad
let gPDTallCone: THREE.CylinderGeometry | null = null;  // wysoki stozek Asyria
let gPDNasal:    THREE.BoxGeometry | null = null;
let gPDCrest:    THREE.BoxGeometry | null = null;       // grzebien asyryjski
let gPDBand:     THREE.BoxGeometry | null = null;       // opaska isicoco / pas nemes
let gPDFeather:  THREE.BoxGeometry | null = null;
let gPDNemes:    THREE.BoxGeometry | null = null;       // korona chusty
let gPDLappet:   THREE.BoxGeometry | null = null;       // klapka nemes
let gPDBackFlap: THREE.BoxGeometry | null = null;       // ogon chusty na kark
let gPDBeard:    THREE.BoxGeometry | null = null;
let gPDBeardLg:  THREE.BoxGeometry | null = null;
// kultury
let gPDCollar:   THREE.BoxGeometry | null = null;       // usech
let gPDFleece:   THREE.BoxGeometry | null = null;       // poziom kaunakes
let gPDFringe:   THREE.BoxGeometry | null = null;       // lamowka szaty Akadu
let gPDRobe:     THREE.BoxGeometry | null = null;       // dluga szata Akadu
let gPDScaleRow: THREE.BoxGeometry | null = null;       // rzad lamelek
let gPDBootCuff: THREE.BoxGeometry | null = null;       // cholewka buta
let gPDArmBand:  THREE.BoxGeometry | null = null;       // opaska naramienna
let gPDTuft:     THREE.BoxGeometry | null = null;       // amashoba (kitki futra)
let gPDLoin:     THREE.BoxGeometry | null = null;       // przepaska Zulu
let gPDNguniShell: THREE.BufferGeometry | null = null;  // skorupa tarczy nguni
let gPDNguniFace:  THREE.BufferGeometry | null = null;  // pole tarczy nguni
let gPDPatch:    THREE.BoxGeometry | null = null;       // bialy plat laciaty
let gPDBoss:     THREE.BoxGeometry | null = null;       // umbo
let gPDMgobo:    THREE.BoxGeometry | null = null;       // drzewce tarczy nguni
let gPDJavShaft: THREE.BoxGeometry | null = null;
let gPDJavTip:   THREE.ConeGeometry | null = null;

function getGPDTorso():   THREE.BoxGeometry { return (gPDTorso   ||= new THREE.BoxGeometry(PD_TORSO_W, PD_TORSO_H, PD_TORSO_D)); }
function getGPDNeck():    THREE.BoxGeometry { return (gPDNeck    ||= new THREE.BoxGeometry(0.042 * HEX_R, PD_NECK_H * 1.6, 0.042 * HEX_R)); }
function getGPDHead():    THREE.BoxGeometry { return (gPDHead    ||= new THREE.BoxGeometry(PD_HEAD_S, PD_HEAD_S, PD_HEAD_S)); }
function getGPDThigh():   THREE.BoxGeometry { return (gPDThigh   ||= new THREE.BoxGeometry(0.056 * HEX_R, PD_THIGH_L, 0.060 * HEX_R)); }
function getGPDShin():    THREE.BoxGeometry { return (gPDShin    ||= new THREE.BoxGeometry(0.038 * HEX_R, PD_SHIN_L, 0.042 * HEX_R)); }
function getGPDFoot():    THREE.BoxGeometry { return (gPDFoot    ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)); }
function getGPDUpArm():   THREE.BoxGeometry { return (gPDUpArm   ||= new THREE.BoxGeometry(0.054 * HEX_R, PD_UPARM_L, 0.054 * HEX_R)); }
function getGPDForearm(): THREE.BoxGeometry { return (gPDForearm ||= new THREE.BoxGeometry(0.040 * HEX_R, PD_FOREARM_L, 0.040 * HEX_R)); }
function getGPDFist():    THREE.BoxGeometry { return (gPDFist    ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)); }
function getGPDSkirt():   THREE.BoxGeometry { return (gPDSkirt   ||= new THREE.BoxGeometry(0.196 * HEX_R, 0.078 * HEX_R, 0.120 * HEX_R)); }
function getGPDBelt():    THREE.BoxGeometry { return (gPDBelt    ||= new THREE.BoxGeometry(0.200 * HEX_R, 0.026 * HEX_R, 0.124 * HEX_R)); }
function getGPDBowMid():  THREE.BoxGeometry { return (gPDBowMid  ||= new THREE.BoxGeometry(0.021 * HEX_R, 0.150 * HEX_R, 0.024 * HEX_R)); }
function getGPDBowLimb(): THREE.BoxGeometry { return (gPDBowLimb ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.125 * HEX_R, 0.021 * HEX_R)); }
function getGPDBowSiyah():THREE.BoxGeometry { return (gPDBowSiyah||= new THREE.BoxGeometry(0.016 * HEX_R, 0.072 * HEX_R, 0.018 * HEX_R)); }
function getGPDUnit():    THREE.BoxGeometry { return (gPDUnit    ||= new THREE.BoxGeometry(1, 1, 1)); }
function getGPDArrowTip():THREE.ConeGeometry{ return (gPDArrowTip||= new THREE.ConeGeometry(0.013 * HEX_R, 0.042 * HEX_R, 4)); }
function getGPDFletch():  THREE.BoxGeometry { return (gPDFletch  ||= new THREE.BoxGeometry(0.007 * HEX_R, 0.052 * HEX_R, 0.024 * HEX_R)); }
function getGPDQuiver():  THREE.BoxGeometry { return (gPDQuiver  ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.150 * HEX_R, 0.046 * HEX_R)); }
function getGPDQArrow():  THREE.BoxGeometry { return (gPDQArrow  ||= new THREE.BoxGeometry(0.009 * HEX_R, 0.085 * HEX_R, 0.009 * HEX_R)); }
function getGPDConeHelm():THREE.CylinderGeometry { return (gPDConeHelm ||= new THREE.CylinderGeometry(0.018 * HEX_R, 0.086 * HEX_R, 0.108 * HEX_R, 8, 1)); }
function getGPDTallCone():THREE.CylinderGeometry { return (gPDTallCone ||= new THREE.CylinderGeometry(0.013 * HEX_R, 0.082 * HEX_R, 0.135 * HEX_R, 8, 1)); }
function getGPDNasal():   THREE.BoxGeometry { return (gPDNasal   ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.056 * HEX_R, 0.016 * HEX_R)); }
function getGPDCrest():   THREE.BoxGeometry { return (gPDCrest   ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.052 * HEX_R, 0.098 * HEX_R)); }
function getGPDBand():    THREE.BoxGeometry { return (gPDBand    ||= new THREE.BoxGeometry(0.140 * HEX_R, 0.026 * HEX_R, 0.140 * HEX_R)); }
function getGPDFeather(): THREE.BoxGeometry { return (gPDFeather ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.096 * HEX_R, 0.010 * HEX_R)); }
function getGPDNemes():   THREE.BoxGeometry { return (gPDNemes   ||= new THREE.BoxGeometry(0.152 * HEX_R, 0.046 * HEX_R, 0.152 * HEX_R)); }
function getGPDLappet():  THREE.BoxGeometry { return (gPDLappet  ||= new THREE.BoxGeometry(0.034 * HEX_R, 0.092 * HEX_R, 0.024 * HEX_R)); }
function getGPDBackFlap():THREE.BoxGeometry { return (gPDBackFlap||= new THREE.BoxGeometry(0.062 * HEX_R, 0.100 * HEX_R, 0.020 * HEX_R)); }
function getGPDBeard():   THREE.BoxGeometry { return (gPDBeard   ||= new THREE.BoxGeometry(0.060 * HEX_R, 0.048 * HEX_R, 0.022 * HEX_R)); }
function getGPDBeardLg(): THREE.BoxGeometry { return (gPDBeardLg ||= new THREE.BoxGeometry(0.064 * HEX_R, 0.085 * HEX_R, 0.024 * HEX_R)); }
function getGPDCollar():  THREE.BoxGeometry { return (gPDCollar  ||= new THREE.BoxGeometry(0.190 * HEX_R, 0.030 * HEX_R, 0.108 * HEX_R)); }
function getGPDFleece():  THREE.BoxGeometry { return (gPDFleece  ||= new THREE.BoxGeometry(0.202 * HEX_R, 0.034 * HEX_R, 0.126 * HEX_R)); }
function getGPDFringe():  THREE.BoxGeometry { return (gPDFringe  ||= new THREE.BoxGeometry(0.206 * HEX_R, 0.022 * HEX_R, 0.128 * HEX_R)); }
function getGPDRobe():    THREE.BoxGeometry { return (gPDRobe    ||= new THREE.BoxGeometry(0.198 * HEX_R, 0.150 * HEX_R, 0.122 * HEX_R)); }
function getGPDScaleRow():THREE.BoxGeometry { return (gPDScaleRow||= new THREE.BoxGeometry(0.186 * HEX_R, 0.015 * HEX_R, 0.106 * HEX_R)); }
function getGPDBootCuff():THREE.BoxGeometry { return (gPDBootCuff||= new THREE.BoxGeometry(0.050 * HEX_R, 0.036 * HEX_R, 0.054 * HEX_R)); }
function getGPDArmBand(): THREE.BoxGeometry { return (gPDArmBand ||= new THREE.BoxGeometry(0.058 * HEX_R, 0.022 * HEX_R, 0.058 * HEX_R)); }
function getGPDTuft():    THREE.BoxGeometry { return (gPDTuft    ||= new THREE.BoxGeometry(0.052 * HEX_R, 0.030 * HEX_R, 0.020 * HEX_R)); }
function getGPDLoin():    THREE.BoxGeometry { return (gPDLoin    ||= new THREE.BoxGeometry(0.165 * HEX_R, 0.080 * HEX_R, 0.115 * HEX_R)); }
function getGPDPatch():   THREE.BoxGeometry { return (gPDPatch   ||= new THREE.BoxGeometry(0.052 * HEX_R, 0.070 * HEX_R, 0.010 * HEX_R)); }
function getGPDBoss():    THREE.BoxGeometry { return (gPDBoss    ||= new THREE.BoxGeometry(0.040 * HEX_R, 0.040 * HEX_R, 0.020 * HEX_R)); }
function getGPDMgobo():   THREE.BoxGeometry { return (gPDMgobo   ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.440 * HEX_R, 0.016 * HEX_R)); }
function getGPDJavShaft():THREE.BoxGeometry { return (gPDJavShaft||= new THREE.BoxGeometry(0.014 * HEX_R, 0.440 * HEX_R, 0.014 * HEX_R)); }
function getGPDJavTip():  THREE.ConeGeometry{ return (gPDJavTip  ||= new THREE.ConeGeometry(0.017 * HEX_R, 0.055 * HEX_R, 4)); }

// tarcza nguni: fasetowany owal (jak scutum hastati, ale plaski luk c maly)
function pdOvalRing(a: number, b: number, c: number, N: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(ang) * a, y = Math.sin(ang) * b;
    pts.push([x, y, -c * (x / a) * (x / a)]);
  }
  return pts;
}
function pdOvalShellGeo(a: number, b: number, c: number, t: number, N: number): THREE.BufferGeometry {
  const ring = pdOvalRing(a, b, c, N);
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
function pdOvalFaceGeo(a: number, b: number, c: number, N: number): THREE.BufferGeometry {
  const ring = pdOvalRing(a, b, c, N);
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
function getGPDNguniShell(): THREE.BufferGeometry { return (gPDNguniShell ||= pdOvalShellGeo(0.105 * HEX_R, 0.182 * HEX_R, 0.030 * HEX_R, 0.014 * HEX_R, 10)); }
function getGPDNguniFace():  THREE.BufferGeometry { return (gPDNguniFace  ||= pdOvalFaceGeo(0.089 * HEX_R, 0.155 * HEX_R, 0.022 * HEX_R, 10)); }

// ---------------------------------------------------------------------------
// Segmenty konczyn.
// pdDirDown/pdSeg — konwencja sagitalna jak w hastati-falangita (nogi).
// pdSegDir — segment o STALEJ geometrii wzdluz DOWOLNEGO kierunku (quaternion).
// pdStretch — jednostkowy box skalowany miedzy dwoma punktami (cieciwa/strzala).
// ---------------------------------------------------------------------------
const PD_Y_UP = new THREE.Vector3(0, 1, 0);

function pdDirDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}

function pdSeg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = pdDirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

/** Segment stalej dlugosci od A wzdluz kierunku D (jednostkowego). */
function pdSegDir(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  A: THREE.Vector3, D: THREE.Vector3, len: number,
): THREE.Vector3 {
  const mesh = new THREE.Mesh(geo, mtl);
  if (D.y < -0.9999) mesh.rotation.x = Math.PI;
  else mesh.quaternion.setFromUnitVectors(PD_Y_UP, D);
  mesh.position.copy(A.clone().addScaledVector(D, len * 0.5));
  group.add(mesh);
  return A.clone().addScaledVector(D, len);
}

/** Cienki box rozciagniety miedzy A i B (cieciwa, strzala, pasek). */
function pdStretch(
  group: THREE.Group, mtl: THREE.MeshStandardMaterial,
  A: THREE.Vector3, B: THREE.Vector3, w: number, d?: number,
): THREE.Mesh {
  const v = B.clone().sub(A);
  const len = v.length();
  const D = v.clone().normalize();
  const mesh = new THREE.Mesh(getGPDUnit(), mtl);
  mesh.scale.set(w, len, d ?? w);
  if (D.y < -0.9999) mesh.rotation.x = Math.PI;
  else mesh.quaternion.setFromUnitVectors(PD_Y_UP, D);
  mesh.position.copy(A.clone().addScaledVector(D, len * 0.5));
  group.add(mesh);
  return mesh;
}

/** Noga jak w hastati-falangita: udo + golen + stopa PLASKO na y=0. */
function pdBuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  mFoot: THREE.MeshStandardMaterial, hipY: number = PD_HIP_Y,
): void {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = pdSeg(group, getGPDThigh(), mThigh, P, thU, PD_THIGH_L);
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = pdSeg(group, getGPDShin(), mShin, P, thL, PD_SHIN_L);
  const foot = new THREE.Mesh(getGPDFoot(), mFoot);
  foot.position.set(sx, 0.013 * HEX_R, P.z + 0.016 * HEX_R);
  group.add(foot);
}

/**
 * RAMIE PRZEZ IK: bark S -> cel dloni T, dlugosci PD_UPARM_L/PD_FOREARM_L,
 * lokiec wybierany biegunem `pole` (kierunek odchylenia lokcia od ciecia
 * bark-cel). Zwraca faktyczna pozycje dloni i os przedramienia. Piesc
 * opcjonalna. Cel poza zasiegiem => reka wyprostowana w strone celu.
 */
function pdArmIK(
  group: THREE.Group, S: THREE.Vector3, T: THREE.Vector3, pole: THREE.Vector3,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { hand: THREE.Vector3; axis: THREE.Vector3 } {
  const L1 = PD_UPARM_L, L2 = PD_FOREARM_L;
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
  pdSegDir(group, getGPDUpArm(), mUp, S, dU, L1);
  const dF = S.clone().addScaledVector(dU, L1);   // = E
  const axis = T.clone().sub(dF).normalize();
  const hand = pdSegDir(group, getGPDForearm(), mFore, dF, axis, L2);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getGPDFist(), mFist);
    if (axis.y < -0.9999) fist.rotation.x = Math.PI;
    else fist.quaternion.setFromUnitVectors(PD_Y_UP, axis);
    fist.position.copy(hand.clone().addScaledVector(axis, 0.012 * HEX_R));
    group.add(fist);
  }
  return { hand, axis };
}

/** Wspolny korpus: tors + szyja + glowa (skora parametryzowana — Zulu). */
function pdBuildCore(
  group: THREE.Group, mat: MatFactory, mTorso: THREE.MeshStandardMaterial,
  skinColor: number = PD_SKIN,
): THREE.MeshStandardMaterial {
  const torso = new THREE.Mesh(getGPDTorso(), mTorso);
  torso.position.set(0, PD_TORSO_CTR, 0);
  group.add(torso);
  const mSkin = mat(skinColor, 0.05, 0.80);
  const neck = new THREE.Mesh(getGPDNeck(), mSkin);
  neck.position.set(0, PD_TORSO_TOP + PD_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(getGPDHead(), mSkin);
  head.position.set(0, PD_HEAD_CTR, 0);
  group.add(head);
  return mSkin;
}

// ---------------------------------------------------------------------------
// LUK W PELNYM NACIAGU — wspolna mechanika wszystkich lucznikow.
// Strzal PRZEKATNY w lewo-przod (czytelny z kazdego 3/4): os naciagu
// NOCK->GRIP ma odchylenie ~0.6 rad od +Z ku +X (LEWA strona), luczisko w
// podgrupie obroconej o yaw strzaly => zawsze PROSTOPADLE do strzaly.
//   GRIP = (0.088, 0.442, 0.185)*R — lewa dlon NA rekojesci (IK domyka),
//   NOCK = (-0.052, 0.458,-0.020)*R — prawa dlon z nasada przy PRAWYM
//   policzku (kotwica), lokiec wysoko w tyl; strzala przechodzi POD broda
//   i NAD torsem (rachunek kolizji w naglowku pliku).
//   Cieciwa = dwa odcinki od koncowek lucziska do NOCK (naciagniete V).
// kind: 'self' (Egipt, prosty), 'simple' (Sumer, krotszy), 'composite'
// (Akad/Asyria, mocny refleks siyah).
// ---------------------------------------------------------------------------
const PD_GRIP = new THREE.Vector3(0.088 * HEX_R, 0.442 * HEX_R, 0.185 * HEX_R);
const PD_NOCK = new THREE.Vector3(-0.052 * HEX_R, 0.458 * HEX_R, -0.020 * HEX_R);

interface PDBowSpec { midH: number; limbDy: number; limbDz: number; limbRot: number;
                      tipDy: number; tipDz: number; siyahRot: number; }
const PD_BOWS: Record<'self' | 'simple' | 'composite', PDBowSpec> = {
  self:      { midH: 0.170, limbDy: 0.140, limbDz: -0.008, limbRot: 0.36,
               tipDy: 0.252, tipDz: -0.052, siyahRot: 0.78 },
  simple:    { midH: 0.150, limbDy: 0.124, limbDz: -0.010, limbRot: 0.44,
               tipDy: 0.222, tipDz: -0.058, siyahRot: 0.90 },
  composite: { midH: 0.150, limbDy: 0.128, limbDz: -0.016, limbRot: 0.52,
               tipDy: 0.236, tipDz: -0.084, siyahRot: 1.12 },
};

function pdAddDrawnBow(
  group: THREE.Group, kind: 'self' | 'simple' | 'composite',
  mBow: THREE.MeshStandardMaterial, mString: THREE.MeshStandardMaterial,
  mShaft: THREE.MeshStandardMaterial, mTip: THREE.MeshStandardMaterial,
  mFletch: THREE.MeshStandardMaterial,
): void {
  const s = PD_BOWS[kind];
  const G = PD_GRIP, N = PD_NOCK;
  const dirA = G.clone().sub(N).normalize();          // os strzaly (naciagu)
  const yaw = Math.atan2(dirA.x, dirA.z);             // odchylenie od +Z
  // LUCZISKO w podgrupie obroconej o yaw strzaly (plaszczyzna luku prostopadla
  // do strzaly; lokalne +Z = kierunek strzalu, lokalny pion = ramiona luku)
  const bow = new THREE.Group();
  bow.position.copy(G);
  bow.rotation.y = yaw;
  const mid = new THREE.Mesh(getGPDBowMid(), mBow);
  mid.scale.y = s.midH / 0.150;
  bow.add(mid);
  for (const sg of [1, -1]) {
    const limb = new THREE.Mesh(getGPDBowLimb(), mBow);
    limb.rotation.x = -sg * s.limbRot;
    limb.position.set(0, sg * s.limbDy * HEX_R, s.limbDz * HEX_R);
    bow.add(limb);
    const siyah = new THREE.Mesh(getGPDBowSiyah(), mBow);
    siyah.rotation.x = -sg * s.siyahRot;
    siyah.position.set(0, sg * s.tipDy * HEX_R, s.tipDz * HEX_R);
    bow.add(siyah);
  }
  group.add(bow);
  // koncowki lucziska (lokalnie) -> do swiata -> cieciwa V do NOCK
  const rotY = new THREE.Matrix4().makeRotationY(yaw);
  const tipTop = new THREE.Vector3(0, (s.tipDy + 0.034) * HEX_R, (s.tipDz - 0.016) * HEX_R).applyMatrix4(rotY).add(G);
  const tipBot = new THREE.Vector3(0, -(s.tipDy + 0.034) * HEX_R, (s.tipDz - 0.016) * HEX_R).applyMatrix4(rotY).add(G);
  pdStretch(group, mString, tipTop, N, 0.008 * HEX_R);
  pdStretch(group, mString, tipBot, N, 0.008 * HEX_R);
  // strzala NA OSI naciagu: nasada w NOCK, grot przed lucziskiem
  const tipP = G.clone().addScaledVector(dirA, 0.065 * HEX_R);
  pdStretch(group, mShaft, N, tipP, 0.012 * HEX_R);
  const tip = new THREE.Mesh(getGPDArrowTip(), mTip);
  tip.quaternion.setFromUnitVectors(PD_Y_UP, dirA);
  tip.position.copy(tipP.clone().addScaledVector(dirA, 0.018 * HEX_R));
  group.add(tip);
  const fl = new THREE.Mesh(getGPDFletch(), mFletch);
  fl.quaternion.setFromUnitVectors(PD_Y_UP, dirA);
  fl.position.copy(N.clone().addScaledVector(dirA, 0.030 * HEX_R));
  group.add(fl);
}

/** Ramiona lucznika w naciagu (IK do GRIP i NOCK) + nogi w rozkroku strzeleckim. */
function pdArcherBody(
  group: THREE.Group,
  mUpL: THREE.MeshStandardMaterial, mForeL: THREE.MeshStandardMaterial,
  mUpR: THREE.MeshStandardMaterial, mForeR: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  mFoot: THREE.MeshStandardMaterial,
): void {
  const HIP = PD_HIP_Y - 0.006 * HEX_R;
  pdBuildLeg(group,  PD_HIP_X,  0.30,  0.16, mThigh, mShin, mFoot, HIP);
  pdBuildLeg(group, -PD_HIP_X, -0.34, -0.14, mThigh, mShin, mFoot, HIP);
  // LEWE (+X) ramie wyprostowane do rekojesci luku (lokiec lekko w dol-zewn.)
  pdArmIK(group, new THREE.Vector3(PD_SHLD_X, PD_SHLD_Y, 0), PD_GRIP,
          new THREE.Vector3(0.55, -0.70, 0.20), mUpL, mForeL, mFist);
  // PRAWE (-X) ramie: lokiec WYSOKO w tyl-zewnatrz, dlon z nasada przy policzku
  pdArmIK(group, new THREE.Vector3(-PD_SHLD_X, PD_SHLD_Y, 0), PD_NOCK,
          new THREE.Vector3(-0.55, 0.85, -0.25), mUpR, mForeR, mFist);
}

/** Kolczan na plecach (diagonalnie) + wystajace drzewca z lotkami koloru gracza. */
function pdAddQuiver(
  group: THREE.Group, mQuiver: THREE.MeshStandardMaterial,
  mShaft: THREE.MeshStandardMaterial, mFletchOwner: THREE.MeshStandardMaterial,
  nArrows: number = 2,
): void {
  const q = new THREE.Mesh(getGPDQuiver(), mQuiver);
  q.rotation.x = -0.24;
  q.rotation.z = 0.22;
  q.position.set(-0.052 * HEX_R, PD_TORSO_CTR + 0.052 * HEX_R, -(PD_TORSO_D * 0.5 + 0.030 * HEX_R));
  group.add(q);
  for (const [dx, dy] of ([[-0.020, 0.0], [0.004, 0.010]] as [number, number][]).slice(0, nArrows)) {
    const sh = new THREE.Mesh(getGPDQArrow(), mShaft);
    sh.rotation.x = -0.24; sh.rotation.z = 0.22;
    sh.position.set((-0.052 + dx) * HEX_R, PD_TORSO_CTR + (0.128 + dy) * HEX_R, -(PD_TORSO_D * 0.5 + 0.048 * HEX_R));
    group.add(sh);
    const f = new THREE.Mesh(getGPDFletch(), mFletchOwner);
    f.rotation.x = -0.24; f.rotation.z = 0.22;
    f.scale.set(1.0, 0.62, 0.62);
    f.position.set((-0.052 + dx - 0.010) * HEX_R, PD_TORSO_CTR + (0.162 + dy) * HEX_R, -(PD_TORSO_D * 0.5 + 0.058 * HEX_R));
    group.add(f);
  }
}

// ===========================================================================
// OSZCZEPNIK ZULU „IZIJULA" (Zulu, Kamien) — ZAMACH
// Naga sylwetka (skora 0xb06030), przepaska umutsha, opaska futrzana isicoco
// z bialymi piorami, amashoba (kitki) na ramionach i pod kolanami. LEWA (+X):
// owalna tarcza NGUNI (bydleca, LACIATA: biale platy na brazie, umbo = kolor
// gracza, pionowe drzewce mgobo z kitka). PRAWA (-X): zamach oszczepem nad
// barkiem, grot w przod lekko w dol, drzewce NA OSI dloni. Gleboki wykrok.
// ===========================================================================
export function buildZuluJavelineer(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin  = mat(PD_SKIN_ZULU, 0.05, 0.80);
  const mHide  = mat(PD_HIDE_RED,  0.04, 0.90);
  const mWhite = mat(PD_PAINT_WHT, 0.03, 0.92);
  const mOwner = mat(ownerColor_,  0.10, 0.68);
  const mWood  = mat(PD_WOOD,      0.05, 0.85);
  const mSteel = mat(PD_STEEL,     0.45, 0.45);
  const mLoin  = mat(PD_LOIN_DK,   0.05, 0.88);
  const mFur   = mat(PD_FUR_DK,    0.04, 0.92);
  const mHair  = mat(PD_HAIR_DK,   0.04, 0.90);

  const HIP = PD_HIP_Y - 0.014 * HEX_R;   // gleboki wypad

  // korpus nagi (tors = skora)
  pdBuildCore(group, mat, mSkin, PD_SKIN_ZULU);
  // wlosy (krotka czapa)
  const hair = new THREE.Mesh(getGPDBand(), mHair);
  hair.scale.set(0.96, 0.72, 0.96);
  hair.position.set(0, PD_HEAD_TOP - 0.002 * HEX_R, 0);
  group.add(hair);
  // ISICOCO: futrzana opaska + 3 biale piora (srodkowe wyzsze)
  const band = new THREE.Mesh(getGPDBand(), mFur);
  band.position.set(0, PD_HEAD_CTR + 0.040 * HEX_R, 0);
  group.add(band);
  for (const sx of [-1, 0, 1]) {
    const f = new THREE.Mesh(getGPDFeather(), mWhite);
    f.rotation.z = -sx * 0.14;
    f.rotation.x = -0.10;
    f.position.set(sx * 0.036 * HEX_R, PD_HEAD_TOP + (sx === 0 ? 0.066 : 0.050) * HEX_R, -0.012 * HEX_R);
    group.add(f);
  }
  // przepaska umutsha + fartuszek z bialego futra
  const loin = new THREE.Mesh(getGPDLoin(), mLoin);
  loin.position.set(0, PD_TORSO_BOT - 0.012 * HEX_R, 0);
  group.add(loin);
  const apron = new THREE.Mesh(getGPDTuft(), mWhite);
  apron.scale.set(1.15, 1.35, 1.0);
  apron.position.set(0, PD_TORSO_BOT - 0.045 * HEX_R, 0.058 * HEX_R);
  group.add(apron);

  // nogi bose: LEWA (+X) wykroczna
  pdBuildLeg(group,  PD_HIP_X,  0.62,  0.36, mSkin, mSkin, mSkin, HIP);
  pdBuildLeg(group, -PD_HIP_X, -0.55, -0.22, mSkin, mSkin, mSkin, HIP);
  // amashoba pod kolanami
  for (const sx of [PD_HIP_X, -PD_HIP_X]) {
    const t = new THREE.Mesh(getGPDTuft(), mWhite);
    t.scale.set(0.80, 1.0, 1.35);
    t.position.set(sx, 0.105 * HEX_R, sx > 0 ? 0.085 * HEX_R : -0.075 * HEX_R);
    group.add(t);
  }

  // PRAWE (-X) RAMIE — ZAMACH: dlon nad barkiem/glowa, oszczep NA OSI dloni
  const armR = pdArmIK(group,
    new THREE.Vector3(-PD_SHLD_X, PD_SHLD_Y, 0),
    new THREE.Vector3(-0.150 * HEX_R, 0.545 * HEX_R, -0.055 * HEX_R),
    new THREE.Vector3(-0.85, 0.10, -0.52), mSkin, mSkin, mSkin);
  const JAV_D = new THREE.Vector3(0.05, -0.06, 0.997).normalize();
  const grip = armR.hand.clone();
  const shaft = new THREE.Mesh(getGPDJavShaft(), mWood);
  shaft.quaternion.setFromUnitVectors(PD_Y_UP, JAV_D);
  shaft.position.copy(grip.clone().addScaledVector(JAV_D, 0.070 * HEX_R));
  group.add(shaft);
  const jt = new THREE.Mesh(getGPDJavTip(), mSteel);
  jt.quaternion.setFromUnitVectors(PD_Y_UP, JAV_D);
  jt.position.copy(grip.clone().addScaledVector(JAV_D, (0.070 + 0.220 + 0.026) * HEX_R));
  group.add(jt);
  // amashoba na prawym ramieniu + OPASKA KOLORU GRACZA
  const tuftR = new THREE.Mesh(getGPDTuft(), mWhite);
  tuftR.position.set(-PD_SHLD_X - 0.020 * HEX_R, PD_SHLD_Y + 0.030 * HEX_R, 0);
  group.add(tuftR);
  const bandR = new THREE.Mesh(getGPDArmBand(), mOwner);
  bandR.rotation.z = -0.9;
  bandR.position.set(-PD_SHLD_X - 0.030 * HEX_R, PD_SHLD_Y - 0.020 * HEX_R, -0.014 * HEX_R);
  group.add(bandR);

  // LEWE (+X) RAMIE + TARCZA NGUNI przed korpusem
  const armL = pdArmIK(group,
    new THREE.Vector3(PD_SHLD_X, PD_SHLD_Y, 0),
    new THREE.Vector3(0.152 * HEX_R, 0.295 * HEX_R, 0.098 * HEX_R),
    new THREE.Vector3(0.85, -0.20, 0.15), mSkin, mSkin, null);
  const sh = new THREE.Group();
  sh.position.copy(armL.hand.clone().add(new THREE.Vector3(0.010 * HEX_R, 0.040 * HEX_R, 0.030 * HEX_R)));
  sh.rotation.y = -0.16;
  const shell = new THREE.Mesh(getGPDNguniShell(), mFur);        // rant/plecy skora
  sh.add(shell);
  const face = new THREE.Mesh(getGPDNguniFace(), mHide);         // pole bydlece
  face.position.set(0, 0, 0.010 * HEX_R);
  sh.add(face);
  // LACIATY WZOR: biale platy (asymetryczne)
  const patches: [number, number, number, number][] = [
    [-0.034, 0.070, 0.30, 0.9], [0.040, 0.020, -0.25, 1.1],
    [-0.026, -0.062, 0.55, 0.8], [0.022, -0.108, -0.35, 0.7],
  ];
  for (const [px, py, rz, sc] of patches) {
    const p = new THREE.Mesh(getGPDPatch(), mWhite);
    p.rotation.z = rz;
    p.scale.set(sc, sc, 1.0);
    p.position.set(px * HEX_R, py * HEX_R, 0.016 * HEX_R);
    sh.add(p);
  }
  const boss = new THREE.Mesh(getGPDBoss(), mOwner);             // umbo = KOLOR GRACZA
  boss.position.set(0, 0, 0.020 * HEX_R);
  sh.add(boss);
  const mgobo = new THREE.Mesh(getGPDMgobo(), mWood);            // drzewce pionowe
  mgobo.position.set(0, 0.020 * HEX_R, -0.014 * HEX_R);
  sh.add(mgobo);
  const mtuft = new THREE.Mesh(getGPDTuft(), mFur);              // kitka na szczycie
  mtuft.scale.set(0.55, 1.1, 0.9);
  mtuft.position.set(0, 0.245 * HEX_R, -0.014 * HEX_R);
  sh.add(mtuft);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ===========================================================================
// LUCZNIK EGIPSKI (Egipt, Kamien) — PELNY NACIAG
// Naga piers, biala spodniczka SHENTI z pasem koloru gracza, zloty kolnierz
// usech, plocienna chusta typu nemes (pasy blekitu, klapki na barki, ogon na
// kark). LUK PROSTY (self bow) w LEWEJ, strzala/cieciwa w PRAWEJ. Kolczan na
// plecach z lotkami koloru gracza.
// ===========================================================================
export function buildEgyptianArcher(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin   = mat(PD_SKIN,    0.05, 0.80);
  const mLinen  = mat(PD_LINEN,   0.05, 0.86);
  const mBlue   = mat(PD_WOAD,    0.05, 0.75);
  const mGold   = mat(PD_GOLD,    0.55, 0.38);
  const mOwner  = mat(ownerColor_,0.10, 0.70);
  const mWood   = mat(PD_WOOD_BOW, 0.05, 0.82);
  const mBronze = mat(PD_BRONZE,  0.42, 0.45);
  const mString = mat(PD_STRING,  0.02, 0.95);
  const mLeath  = mat(PD_LEATHER, 0.06, 0.82);

  // korpus: naga piers (tors = skora)
  pdBuildCore(group, mat, mSkin);
  // zloty kolnierz usech
  const collar = new THREE.Mesh(getGPDCollar(), mGold);
  collar.position.set(0, PD_TORSO_TOP - 0.010 * HEX_R, 0);
  group.add(collar);
  // SHENTI: biala spodniczka + pas koloru gracza
  const kilt = new THREE.Mesh(getGPDSkirt(), mLinen);
  kilt.position.set(0, PD_TORSO_BOT - 0.016 * HEX_R, 0);
  group.add(kilt);
  const waist = new THREE.Mesh(getGPDBelt(), mOwner);
  waist.position.set(0, PD_TORSO_BOT + 0.014 * HEX_R, 0);
  group.add(waist);

  // CHUSTA NEMES-PODOBNA: korona OKRYWA czubek glowy (siega nad HEAD_TOP)
  // + pas blekitu + klapki na barki + ogon na kark
  const crown = new THREE.Mesh(getGPDNemes(), mLinen);
  crown.scale.set(1.0, 1.65, 1.0);                    // 0.076 wys. — zakrywa czubek
  crown.position.set(0, PD_HEAD_CTR + 0.052 * HEX_R, 0);
  group.add(crown);
  const st = new THREE.Mesh(getGPDNemes(), mBlue);
  st.scale.set(1.04, 0.20, 1.04);
  st.position.set(0, PD_HEAD_CTR + 0.052 * HEX_R, 0);
  group.add(st);
  for (const sx of [-1, 1]) {
    const lap = new THREE.Mesh(getGPDLappet(), mLinen);
    lap.position.set(sx * 0.070 * HEX_R, PD_HEAD_CTR - 0.020 * HEX_R, PD_HEAD_S * 0.5 - 0.006 * HEX_R);
    group.add(lap);
  }
  const flap = new THREE.Mesh(getGPDBackFlap(), mLinen);
  flap.rotation.x = 0.18;
  flap.position.set(0, PD_HEAD_CTR - 0.030 * HEX_R, -(PD_HEAD_S * 0.5 + 0.010 * HEX_R));
  group.add(flap);

  // cialo lucznika (rece nagie = skora) + LUK PROSTY + kolczan
  pdArcherBody(group, mSkin, mSkin, mSkin, mSkin, mSkin, mLinen, mSkin, mLeath);
  pdAddDrawnBow(group, 'self', mWood, mString, mWood, mBronze, mOwner);
  pdAddQuiver(group, mLeath, mWood, mOwner);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ===========================================================================
// LUCZNIK SUMERYJSKI (Sumer, Kamien) — PELNY NACIAG
// Turkusowa tunika + fredzlowy KAUNAKES (3 poziomy runa na biodrach i poziom
// na piersi), stozkowy helm filcowo-miedziany, czarna broda. Luk PROSTY
// krotszy. Pas nad kaunakesem = kolor gracza. Kolczan na plecach.
// ===========================================================================
export function buildSumerianArcher(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin   = mat(PD_SKIN,    0.05, 0.80);
  const mTeal   = mat(PD_TEAL,    0.06, 0.80);
  const mFleece = mat(PD_FLEECE,  0.04, 0.96);
  const mBronze = mat(PD_BRONZE,  0.42, 0.45);
  const mOwner  = mat(ownerColor_,0.10, 0.70);
  const mWood   = mat(PD_WOOD_BOW, 0.05, 0.82);
  const mString = mat(PD_STRING,  0.02, 0.95);
  const mLeath  = mat(PD_LEATHER, 0.06, 0.82);
  const mHair   = mat(PD_HAIR_DK, 0.04, 0.90);

  // korpus: turkusowa tunika
  pdBuildCore(group, mat, mTeal);
  // KAUNAKES: poziom runa na piersi + 3 poziomy na biodrach (coraz wezsze)
  const chest = new THREE.Mesh(getGPDFleece(), mFleece);
  chest.scale.set(0.94, 1.0, 0.92);
  chest.position.set(0, PD_TORSO_CTR - 0.020 * HEX_R, 0);
  group.add(chest);
  for (let i = 0; i < 3; i++) {
    const fl = new THREE.Mesh(getGPDFleece(), mFleece);
    fl.scale.set(1.0 - i * 0.05, 1.0, 1.0 - i * 0.04);
    fl.position.set(0, PD_TORSO_BOT - (0.008 + i * 0.036) * HEX_R, 0);
    group.add(fl);
  }
  // pas KOLORU GRACZA nad kaunakesem
  const belt = new THREE.Mesh(getGPDBelt(), mOwner);
  belt.scale.set(0.97, 0.9, 0.97);
  belt.position.set(0, PD_TORSO_BOT + 0.032 * HEX_R, 0);
  group.add(belt);

  // HELM STOZKOWY filcowo-miedziany (wysoki, siega czubka) + broda
  const helm = new THREE.Mesh(getGPDConeHelm(), mBronze);
  helm.scale.set(1.12, 1.38, 1.12);
  helm.position.set(0, PD_HEAD_CTR + 0.066 * HEX_R, 0);
  group.add(helm);
  const beard = new THREE.Mesh(getGPDBeard(), mHair);
  beard.position.set(0, PD_HEAD_CTR - 0.052 * HEX_R, PD_HEAD_S * 0.5 - 0.004 * HEX_R);
  group.add(beard);

  // cialo lucznika (rekawy tuniki na ramionach, przedramiona nagie)
  pdArcherBody(group, mTeal, mSkin, mTeal, mSkin, mSkin, mTeal, mSkin, mLeath);
  pdAddDrawnBow(group, 'simple', mWood, mString, mWood, mBronze, mOwner);
  pdAddQuiver(group, mLeath, mWood, mOwner);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ===========================================================================
// LUCZNIK AKADYJSKI (Akad, Braz) — PELNY NACIAG
// Dluga mezopotamska szata do goleni z FREDZLA-LAMOWKA koloru gracza,
// brazowy helm z NOSALEM, dluzsza broda. LUK KOMPOZYTOWY (mocny refleks),
// KOLCZAN NA PLECACH (znak rozpoznawczy).
// ===========================================================================
export function buildAkkadianArcher(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin   = mat(PD_SKIN,    0.05, 0.80);
  const mRobe   = mat(PD_LINEN,   0.05, 0.86);
  const mBronze = mat(PD_BRONZE,  0.42, 0.45);
  const mBronzL = mat(PD_BRONZE_LT, 0.50, 0.38);
  const mOwner  = mat(ownerColor_,0.10, 0.70);
  const mWood   = mat(PD_WOOD_BOW, 0.05, 0.82);
  const mString = mat(PD_STRING,  0.02, 0.95);
  const mLeath  = mat(PD_LEATHER, 0.06, 0.82);
  const mHair   = mat(PD_HAIR_DK, 0.04, 0.90);

  // korpus: lniana szata
  pdBuildCore(group, mat, mRobe);
  // dluga szata do goleni + FREDZLA-LAMOWKA koloru gracza (dol szaty)
  const robe = new THREE.Mesh(getGPDRobe(), mRobe);
  robe.position.set(0, PD_TORSO_BOT - 0.062 * HEX_R, 0);
  group.add(robe);
  const fringe = new THREE.Mesh(getGPDFringe(), mOwner);
  fringe.position.set(0, PD_TORSO_BOT - 0.140 * HEX_R, 0);
  group.add(fringe);
  const belt = new THREE.Mesh(getGPDBelt(), mLeath);
  belt.scale.set(0.96, 0.85, 0.96);
  belt.position.set(0, PD_TORSO_BOT + 0.026 * HEX_R, 0);
  group.add(belt);

  // HELM BRAZOWY Z NOSALEM + broda akadyjska (dluzsza)
  const helm = new THREE.Mesh(getGPDConeHelm(), mBronze);
  helm.scale.set(1.10, 1.24, 1.10);
  helm.position.set(0, PD_HEAD_CTR + 0.060 * HEX_R, 0);
  group.add(helm);
  const nasal = new THREE.Mesh(getGPDNasal(), mBronzL);
  nasal.scale.set(1.3, 1.0, 1.0);
  nasal.position.set(0, PD_HEAD_CTR + 0.004 * HEX_R, PD_HEAD_S * 0.5 + 0.006 * HEX_R);
  group.add(nasal);
  const beard = new THREE.Mesh(getGPDBeard(), mHair);
  beard.scale.set(1.0, 1.35, 1.0);
  beard.position.set(0, PD_HEAD_CTR - 0.060 * HEX_R, PD_HEAD_S * 0.5 - 0.004 * HEX_R);
  group.add(beard);

  // cialo lucznika (rekawy szaty, przedramiona nagie) + LUK KOMPOZYTOWY
  pdArcherBody(group, mRobe, mSkin, mRobe, mSkin, mSkin, mRobe, mSkin, mLeath);
  pdAddDrawnBow(group, 'composite', mWood, mString, mWood, mBronzL, mOwner);
  pdAddQuiver(group, mLeath, mWood, mOwner);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ===========================================================================
// LUCZNIK ASYRYJSKI (Asyria, Braz) — PELNY NACIAG — PIERWSZY WLASNY MODEL
// (stary token = generyk buildCategoryModel('lucznik')). ZBROJA LUSKOWA
// (rzedy lamelek na torsie i biodrach), WYSOKI STOZKOWY HELM z grzebieniem
// luskowym, WYSOKIE BUTY, dluga broda. Luk kompozytowy, kolczan na plecach.
// KOLOR GRACZA (nowy, spojny wzor): REKAWY tuniki + szarfa pasa + lotki.
// ===========================================================================
export function buildAssyrianArcher(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin   = mat(PD_SKIN,    0.05, 0.80);
  const mScale  = mat(PD_SCALE,   0.30, 0.55);
  const mScaleD = mat(PD_SCALE_DK,0.28, 0.60);
  const mBronze = mat(PD_BRONZE,  0.42, 0.45);
  const mBronzL = mat(PD_BRONZE_LT, 0.50, 0.38);
  const mOwner  = mat(ownerColor_,0.10, 0.70);
  const mWood   = mat(PD_WOOD_BOW, 0.05, 0.82);
  const mString = mat(PD_STRING,  0.02, 0.95);
  const mLeath  = mat(PD_LEATHER, 0.06, 0.82);
  const mBoot   = mat(PD_BOOT_DK, 0.05, 0.88);
  const mHair   = mat(PD_HAIR_DK, 0.04, 0.90);

  // korpus: pancerz luskowy (tors) + RZEDY LAMELEK (ciemniejsze przekladki)
  pdBuildCore(group, mat, mScale);
  for (let i = 0; i < 2; i++) {
    const row = new THREE.Mesh(getGPDScaleRow(), mScaleD);
    row.position.set(0, PD_TORSO_TOP - (0.052 + i * 0.072) * HEX_R, 0);
    group.add(row);
  }
  // spodnica luskowa + SZARFA KOLORU GRACZA
  const skirt = new THREE.Mesh(getGPDSkirt(), mScale);
  skirt.scale.set(0.98, 0.72, 0.98);
  skirt.position.set(0, PD_TORSO_BOT - 0.010 * HEX_R, 0);
  group.add(skirt);
  const sash = new THREE.Mesh(getGPDBelt(), mOwner);
  sash.position.set(0, PD_TORSO_BOT + 0.020 * HEX_R, 0);
  group.add(sash);

  // WYSOKI HELM STOZKOWY z GRZEBIENIEM LUSKOWYM + dluga broda
  const helm = new THREE.Mesh(getGPDTallCone(), mBronze);
  helm.scale.set(1.08, 1.18, 1.08);
  helm.position.set(0, PD_HEAD_CTR + 0.064 * HEX_R, 0);
  group.add(helm);
  const crest = new THREE.Mesh(getGPDCrest(), mBronzL);
  crest.rotation.x = -0.10;
  crest.position.set(0, PD_HEAD_TOP + 0.066 * HEX_R, -0.006 * HEX_R);
  group.add(crest);
  const beard = new THREE.Mesh(getGPDBeardLg(), mHair);
  beard.position.set(0, PD_HEAD_CTR - 0.072 * HEX_R, PD_HEAD_S * 0.5 - 0.006 * HEX_R);
  group.add(beard);

  // cialo lucznika: REKAWY = KOLOR GRACZA (tunika pod luska), przedramiona
  // nagie; golenie = WYSOKIE BUTY (cholewki nad kostke)
  pdArcherBody(group, mOwner, mSkin, mOwner, mSkin, mSkin, mOwner, mBoot, mBoot);
  for (const [sx, thL] of [[PD_HIP_X, 0.16], [-PD_HIP_X, -0.14]] as [number, number][]) {
    const cuff = new THREE.Mesh(getGPDBootCuff(), mBoot);
    cuff.rotation.x = Math.PI - thL;
    cuff.position.set(sx, 0.118 * HEX_R, sx > 0 ? 0.052 * HEX_R : -0.050 * HEX_R);
    group.add(cuff);
  }
  pdAddDrawnBow(group, 'composite', mWood, mString, mWood, mBronzL, mOwner);
  pdAddQuiver(group, mLeath, mWood, mOwner, 1);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}
