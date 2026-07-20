/**
 * jednostki-z2-srodziemne.ts — ZELAZO P2: SRODZIEMNOMORZE (render-jednostki)
 * ---------------------------------------------------------------------------
 * Piec bespoke modeli epoki ZELAZA (Fenicja x2, Egipt, Grecja, Rzym-SUPER):
 *   buildTyrskiMiecznik(ownerColor)  -> "Tyrski miecznik"  (dzis: GENERYK newBuildMiecznik)
 *   buildGwardiaTyrenska(ownerColor) -> "Gwardia Tyrenska" (dzis: GENERYK newBuildMiecznik)
 *   buildZelaznyKhopesh(ownerColor)  -> "Wojownik z zelaznym khopesh" (dzis: GENERYK miecznika)
 *   buildThorakites(ownerColor)      -> "Thorakites"       (dzis: GENERYK newBuildMiecznik)
 *   buildTriari(ownerColor)          -> "Triari" SUPER     (dzis: BLEDNIE Evocati/buildSuperRome)
 *
 * WPIECIE (units.ts):
 *   - buildNamedUnit: dopisac PRZED sekcja kategorii:
 *       if (n.includes('tyrski miecznik'))   return buildTyrskiMiecznik(ownerColor_);
 *       if (n.includes('gwardia tyrensk'))   return buildGwardiaTyrenska(ownerColor_);
 *       if (n.includes('zelaznym khopesh') || n.includes('iron khopesh'))
 *                                            return buildZelaznyKhopesh(ownerColor_);
 *       if (n.includes('thorakites'))        return buildThorakites(ownerColor_);
 *   - TRIARI: buildSuperUnit(culture, ownerColor_, _name) IGNORUJE dzis _name —
 *     stad pozyczony Evocati. Poprawka w case 'rzym':
 *       case 'rzym': return normName(_name).includes('triari')
 *                      ? buildTriari(ownerColor_) : buildSuperRome(ownerColor_);
 *
 * KONWENCJE SERII (hastati-falangita.ts):
 *   przod = +Z, gora = +Y, LEWA reka = +X (TARCZA), PRAWA = -X (BRON);
 *   stopy na y=0, wysokosc ~0.55*HEX_R; POZA ATAKU; helm na KAZDEJ glowie;
 *   pole tarczy = KOLOR GRACZA; group.userData['mats'] + ['perTokenGeos'];
 *   geometrie wspolne = singletony modulu (perTokenGeos puste).
 *
 * CHARAKTERY:
 *   TYRSKI MIECZNIK — purpurowa tunika (purpura tyryjska), kremowa lamowka,
 *     ZELAZNY miecz prosty (zimna stal), okragla tarcza z ROZETA fenicka
 *     (platki kremowe na polu gracza), helm POLKULISTY (misa+kopulka).
 *   GWARDIA TYRENSKA — elitarniejsza: ZLOTE lamowki purpury, tarcza WIEKSZA
 *     z GWIAZDA fenicka (8 promieni), GRZEBIEN na helmie, ozdobny szeroki pas
 *     ze zlotymi krazkami, nagolennica; ciecie z zamachu.
 *   ZELAZNY KHOPESH — ewolucja brazowego (jednostki-p4-melee.ts): khepresh
 *     CIEMNIEJSZY, khopesh ZELAZNY (stal), tarcza PROSTOKATNA zaokraglona
 *     u gory, lekka zbroja LUSKOWA (3 pasy) na lnianej tunice.
 *   THORAKITES — grecki WLOCZNIK w KOLCZUDZE (thorax = stad nazwa), owalna
 *     tarcza THUREOS z pionowym KREGOSLUPEM (wplyw celtycki) + umbo-beczulka,
 *     WLOCZNIA DORY (0.70*HEX_R — krotsza niz sarissa falangity, dluzsza niz
 *     iklwa) w pchnieciu NADRECZNYM, helm ATTYCKI otwarty (widoczna twarz).
 *   TRIARI — WETERAN-WLOCZNIK SUPER Rzymu: KLECZACA poza trzeciej linii za
 *     scutum opartym o ziemie, DLUGA hasta wystawiona w przod-gore, brazowy
 *     montefortino z POTROJNYM bialym pioropuszem weterana, SIWY zarost,
 *     FALERY na piersi, choragiew supera na plecach (konwencja P2/P6).
 *
 * Budzet serii: <=~460 tri (Triari SUPER <=~490) — patrz countTri w renderach.
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
const Z2_SKIN      = 0xe0ac69;
const Z2_STEEL     = 0xc2cad2;   // zelazo/stal — zimna
const Z2_STEEL_DK  = 0x8e99a6;   // kolczuga / stal matowa
const Z2_BRONZE    = 0xcf9234;
const Z2_BRONZE_LT = 0xd0a050;
const Z2_BRONZE_DK = 0x9a6b20;   // ciemny braz — czytelny helm przy skorze
const Z2_CRIMSON   = 0xa01f2e;   // grzebien attycki
const Z2_GOLD      = 0xd8b040;
const Z2_WOOD      = 0x7a5c3a;
const Z2_WOOD_DK   = 0x5c452c;
const Z2_LEATHER   = 0x6b4a28;
const Z2_LINEN     = 0xe8e0c8;
const Z2_CREAM     = 0xe6d9b8;   // lamowka fenicka (p8a BW_CREAM)
const Z2_PURPLE    = 0x6e2170;   // purpura tyryjska
const Z2_ROMAN_RED = 0xa42a22;
const Z2_KHEP_DK   = 0x233a5e;   // khepresh CIEMNIEJSZY (braz mial woad)
const Z2_WHITE     = 0xe8e4da;   // pioropusz weterana
const Z2_GREY      = 0xb9b5ac;   // siwy zarost
const Z2_DARK      = 0x20180f;
const Z2_EYE       = 0x1a1a1a;

// ── wymiary sylwetki (rodzina NI_* z hastati-falangita.ts) ─────────────────
const Z2_HIP_Y     = 0.208 * HEX_R;
const Z2_TORSO_W   = 0.180 * HEX_R;
const Z2_TORSO_H   = 0.205 * HEX_R;
const Z2_TORSO_D   = 0.100 * HEX_R;
const Z2_TORSO_BOT = 0.240 * HEX_R;
const Z2_TORSO_CTR = Z2_TORSO_BOT + Z2_TORSO_H * 0.5;
const Z2_TORSO_TOP = Z2_TORSO_BOT + Z2_TORSO_H;
const Z2_NECK_H    = 0.028 * HEX_R;
const Z2_HEAD_S    = 0.128 * HEX_R;
const Z2_HEAD_CTR  = Z2_TORSO_TOP + Z2_NECK_H + Z2_HEAD_S * 0.5;
const Z2_HEAD_TOP  = Z2_TORSO_TOP + Z2_NECK_H + Z2_HEAD_S;
const Z2_SHLD_X    = Z2_TORSO_W * 0.5 + 0.030 * HEX_R;
const Z2_SHLD_Y    = Z2_TORSO_TOP - 0.024 * HEX_R;
const Z2_HIP_X     = 0.052 * HEX_R;
const Z2_THIGH_L   = 0.104 * HEX_R;
const Z2_SHIN_L    = 0.096 * HEX_R;
const Z2_UPARM_L   = 0.100 * HEX_R;
const Z2_FOREARM_L = 0.092 * HEX_R;

// ── geometrie-singletony ────────────────────────────────────────────────────
let gZ2Torso:   THREE.BoxGeometry | null = null;
let gZ2Neck:    THREE.BoxGeometry | null = null;
let gZ2Head:    THREE.BoxGeometry | null = null;
let gZ2Eye:     THREE.BoxGeometry | null = null;
let gZ2Thigh:   THREE.BoxGeometry | null = null;
let gZ2Shin:    THREE.BoxGeometry | null = null;
let gZ2Foot:    THREE.BoxGeometry | null = null;
let gZ2UpArm:   THREE.BoxGeometry | null = null;
let gZ2Forearm: THREE.BoxGeometry | null = null;
let gZ2Fist:    THREE.BoxGeometry | null = null;
let gZ2Skirt:   THREE.BoxGeometry | null = null;
let gZ2Belt:    THREE.BoxGeometry | null = null;
let gZ2Hem:     THREE.BoxGeometry | null = null;
let gZ2Greave:  THREE.BoxGeometry | null = null;
let gZ2Sash:    THREE.BoxGeometry | null = null;
// helmy
let gZ2Bowl:    THREE.CylinderGeometry | null = null;  // polkulisty: misa (otwarta)
let gZ2BowlTop: THREE.CylinderGeometry | null = null;  // polkulisty: kopulka
let gZ2CrestBase: THREE.BoxGeometry | null = null;
let gZ2CrestHair: THREE.BoxGeometry | null = null;
let gZ2AttBowl: THREE.CylinderGeometry | null = null;  // attycki: dzwon
let gZ2AttBrow: THREE.CylinderGeometry | null = null;  // attycki: diadem czolowy
let gZ2Cheek:   THREE.BoxGeometry | null = null;
let gZ2Khep:    THREE.CylinderGeometry | null = null;  // khepresh
let gZ2KhBand:  THREE.CylinderGeometry | null = null;
let gZ2Uraeus:  THREE.BoxGeometry | null = null;
let gZ2MontBowl: THREE.CylinderGeometry | null = null; // montefortino
let gZ2Feather: THREE.BoxGeometry | null = null;
let gZ2Beard:   THREE.BoxGeometry | null = null;
// tarcze
let gZ2ShFace:  THREE.CylinderGeometry | null = null;  // okragla: pole
let gZ2ShRim:   THREE.CylinderGeometry | null = null;
let gZ2ShFaceB: THREE.CylinderGeometry | null = null;  // okragla WIEKSZA (Gwardia)
let gZ2ShRimB:  THREE.CylinderGeometry | null = null;
let gZ2ShBoss:  THREE.BoxGeometry | null = null;
let gZ2Petal:   THREE.BoxGeometry | null = null;       // rozeta / gwiazda
let gZ2RectPl:  THREE.BoxGeometry | null = null;       // prostokatna: plyta
let gZ2RectTop: THREE.BoxGeometry | null = null;       // zaokraglenie: stopien 1
let gZ2RectCap: THREE.BoxGeometry | null = null;       // zaokraglenie: stopien 2
let gZ2ThurShell: THREE.BufferGeometry | null = null;  // thureos: skorupa
let gZ2ThurFace:  THREE.BufferGeometry | null = null;  // thureos: pole gracza
let gZ2Spine:   THREE.BoxGeometry | null = null;       // kregoslup thureos
let gZ2SpineUmb: THREE.BoxGeometry | null = null;      // umbo-beczulka
let gZ2ScutShell: THREE.BufferGeometry | null = null;  // scutum Triari (jak Hastati)
let gZ2ScutFace:  THREE.BufferGeometry | null = null;
let gZ2Spina:   THREE.BoxGeometry | null = null;
let gZ2Umbo:    THREE.BoxGeometry | null = null;
// bronie
let gZ2Blade:   THREE.BoxGeometry | null = null;
let gZ2BladeTip: THREE.ConeGeometry | null = null;
let gZ2Guard:   THREE.BoxGeometry | null = null;
let gZ2Dory:    THREE.BoxGeometry | null = null;       // DORY Thorakitesa (srednia)
let gZ2KhStr:   THREE.BoxGeometry | null = null;       // khopesh: czesc prosta
let gZ2KhSeg:   THREE.BoxGeometry | null = null;       // khopesh: segment haka
let gZ2Hasta:   THREE.BoxGeometry | null = null;       // DLUGA wlocznia Triari
let gZ2HastaTip: THREE.ConeGeometry | null = null;
// dodatki
let gZ2ScaleBand: THREE.BoxGeometry | null = null;     // pas luski
let gZ2BeltWide: THREE.BoxGeometry | null = null;
let gZ2Harness: THREE.BoxGeometry | null = null;
let gZ2Phalera: THREE.BoxGeometry | null = null;
let gZ2Pole:    THREE.BoxGeometry | null = null;
let gZ2Flag:    THREE.BoxGeometry | null = null;
let gZ2Finial:  THREE.BoxGeometry | null = null;

function getGZ2Torso():   THREE.BoxGeometry { return (gZ2Torso   ||= new THREE.BoxGeometry(Z2_TORSO_W, Z2_TORSO_H, Z2_TORSO_D)); }
function getGZ2Neck():    THREE.BoxGeometry { return (gZ2Neck    ||= new THREE.BoxGeometry(0.042 * HEX_R, Z2_NECK_H * 1.6, 0.042 * HEX_R)); }
function getGZ2Head():    THREE.BoxGeometry { return (gZ2Head    ||= new THREE.BoxGeometry(Z2_HEAD_S, Z2_HEAD_S, Z2_HEAD_S)); }
function getGZ2Eye():     THREE.BoxGeometry { return (gZ2Eye     ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.015 * HEX_R, 0.008 * HEX_R)); }
function getGZ2Thigh():   THREE.BoxGeometry { return (gZ2Thigh   ||= new THREE.BoxGeometry(0.056 * HEX_R, Z2_THIGH_L, 0.060 * HEX_R)); }
function getGZ2Shin():    THREE.BoxGeometry { return (gZ2Shin    ||= new THREE.BoxGeometry(0.038 * HEX_R, Z2_SHIN_L, 0.042 * HEX_R)); }
function getGZ2Foot():    THREE.BoxGeometry { return (gZ2Foot    ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)); }
function getGZ2UpArm():   THREE.BoxGeometry { return (gZ2UpArm   ||= new THREE.BoxGeometry(0.054 * HEX_R, Z2_UPARM_L, 0.054 * HEX_R)); }
function getGZ2Forearm(): THREE.BoxGeometry { return (gZ2Forearm ||= new THREE.BoxGeometry(0.040 * HEX_R, Z2_FOREARM_L, 0.040 * HEX_R)); }
function getGZ2Fist():    THREE.BoxGeometry { return (gZ2Fist    ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)); }
function getGZ2Skirt():   THREE.BoxGeometry { return (gZ2Skirt   ||= new THREE.BoxGeometry(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)); }
function getGZ2Belt():    THREE.BoxGeometry { return (gZ2Belt    ||= new THREE.BoxGeometry(0.190 * HEX_R, 0.034 * HEX_R, 0.112 * HEX_R)); }
function getGZ2Hem():     THREE.BoxGeometry { return (gZ2Hem     ||= new THREE.BoxGeometry(0.198 * HEX_R, 0.026 * HEX_R, 0.120 * HEX_R)); }
function getGZ2Greave():  THREE.BoxGeometry { return (gZ2Greave  ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.098 * HEX_R, 0.050 * HEX_R)); }
function getGZ2Sash():    THREE.BoxGeometry { return (gZ2Sash    ||= new THREE.BoxGeometry(0.052 * HEX_R, 0.230 * HEX_R, 0.010 * HEX_R)); }
function getGZ2Bowl():    THREE.CylinderGeometry { return (gZ2Bowl    ||= new THREE.CylinderGeometry(0.062 * HEX_R, 0.090 * HEX_R, 0.066 * HEX_R, 8, 1, true)); }
function getGZ2BowlTop(): THREE.CylinderGeometry { return (gZ2BowlTop ||= new THREE.CylinderGeometry(0.024 * HEX_R, 0.060 * HEX_R, 0.034 * HEX_R, 8, 1)); }
function getGZ2CrestBase(): THREE.BoxGeometry { return (gZ2CrestBase ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.026 * HEX_R, 0.104 * HEX_R)); }
function getGZ2CrestHair(): THREE.BoxGeometry { return (gZ2CrestHair ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.058 * HEX_R, 0.138 * HEX_R)); }
function getGZ2AttBowl(): THREE.CylinderGeometry { return (gZ2AttBowl ||= new THREE.CylinderGeometry(0.056 * HEX_R, 0.086 * HEX_R, 0.092 * HEX_R, 8, 1)); }
function getGZ2AttBrow(): THREE.CylinderGeometry { return (gZ2AttBrow ||= new THREE.CylinderGeometry(0.097 * HEX_R, 0.097 * HEX_R, 0.028 * HEX_R, 8, 1, true)); }
function getGZ2Cheek():   THREE.BoxGeometry { return (gZ2Cheek   ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.052 * HEX_R, 0.044 * HEX_R)); }
function getGZ2Khep():    THREE.CylinderGeometry { return (gZ2Khep   ||= new THREE.CylinderGeometry(0.050 * HEX_R, 0.090 * HEX_R, 0.110 * HEX_R, 8, 1)); }
function getGZ2KhBand():  THREE.CylinderGeometry { return (gZ2KhBand ||= new THREE.CylinderGeometry(0.094 * HEX_R, 0.094 * HEX_R, 0.022 * HEX_R, 8, 1, true)); }
function getGZ2Uraeus():  THREE.BoxGeometry { return (gZ2Uraeus  ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.034 * HEX_R, 0.013 * HEX_R)); }
function getGZ2MontBowl(): THREE.CylinderGeometry { return (gZ2MontBowl ||= new THREE.CylinderGeometry(0.050 * HEX_R, 0.093 * HEX_R, 0.092 * HEX_R, 8, 1)); }
function getGZ2Feather(): THREE.BoxGeometry { return (gZ2Feather ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.108 * HEX_R, 0.012 * HEX_R)); }
function getGZ2Beard():   THREE.BoxGeometry { return (gZ2Beard   ||= new THREE.BoxGeometry(0.086 * HEX_R, 0.040 * HEX_R, 0.022 * HEX_R)); }
function getGZ2ShFace():  THREE.CylinderGeometry { return (gZ2ShFace  ||= new THREE.CylinderGeometry(0.112 * HEX_R, 0.088 * HEX_R, 0.030 * HEX_R, 10, 1)); }
function getGZ2ShRim():   THREE.CylinderGeometry { return (gZ2ShRim   ||= new THREE.CylinderGeometry(0.122 * HEX_R, 0.122 * HEX_R, 0.016 * HEX_R, 10, 1, true)); }
function getGZ2ShFaceB(): THREE.CylinderGeometry { return (gZ2ShFaceB ||= new THREE.CylinderGeometry(0.126 * HEX_R, 0.098 * HEX_R, 0.032 * HEX_R, 10, 1)); }
function getGZ2ShRimB():  THREE.CylinderGeometry { return (gZ2ShRimB  ||= new THREE.CylinderGeometry(0.137 * HEX_R, 0.137 * HEX_R, 0.018 * HEX_R, 10, 1, true)); }
function getGZ2ShBoss():  THREE.BoxGeometry { return (gZ2ShBoss  ||= new THREE.BoxGeometry(0.036 * HEX_R, 0.036 * HEX_R, 0.026 * HEX_R)); }
function getGZ2Petal():   THREE.BoxGeometry { return (gZ2Petal   ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.150 * HEX_R, 0.012 * HEX_R)); }
function getGZ2RectPl():  THREE.BoxGeometry { return (gZ2RectPl  ||= new THREE.BoxGeometry(0.148 * HEX_R, 0.190 * HEX_R, 0.016 * HEX_R)); }
function getGZ2RectTop(): THREE.BoxGeometry { return (gZ2RectTop ||= new THREE.BoxGeometry(0.118 * HEX_R, 0.036 * HEX_R, 0.016 * HEX_R)); }
function getGZ2RectCap(): THREE.BoxGeometry { return (gZ2RectCap ||= new THREE.BoxGeometry(0.072 * HEX_R, 0.024 * HEX_R, 0.016 * HEX_R)); }
function getGZ2Spine():   THREE.BoxGeometry { return (gZ2Spine   ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.330 * HEX_R, 0.012 * HEX_R)); }
function getGZ2SpineUmb():THREE.BoxGeometry { return (gZ2SpineUmb||= new THREE.BoxGeometry(0.042 * HEX_R, 0.078 * HEX_R, 0.026 * HEX_R)); }
function getGZ2Spina():   THREE.BoxGeometry { return (gZ2Spina   ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.300 * HEX_R, 0.014 * HEX_R)); }
function getGZ2Umbo():    THREE.BoxGeometry { return (gZ2Umbo    ||= new THREE.BoxGeometry(0.052 * HEX_R, 0.052 * HEX_R, 0.026 * HEX_R)); }
function getGZ2Blade():   THREE.BoxGeometry { return (gZ2Blade   ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.135 * HEX_R, 0.014 * HEX_R)); }
function getGZ2BladeTip(): THREE.ConeGeometry { return (gZ2BladeTip ||= new THREE.ConeGeometry(0.016 * HEX_R, 0.040 * HEX_R, 4)); }
function getGZ2Guard():   THREE.BoxGeometry { return (gZ2Guard   ||= new THREE.BoxGeometry(0.056 * HEX_R, 0.018 * HEX_R, 0.024 * HEX_R)); }
function getGZ2Dory():    THREE.BoxGeometry { return (gZ2Dory    ||= new THREE.BoxGeometry(0.021 * HEX_R, 0.700 * HEX_R, 0.021 * HEX_R)); }
function getGZ2KhStr():   THREE.BoxGeometry { return (gZ2KhStr   ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.096 * HEX_R, 0.013 * HEX_R)); }
function getGZ2KhSeg():   THREE.BoxGeometry { return (gZ2KhSeg   ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.064 * HEX_R, 0.013 * HEX_R)); }
function getGZ2Hasta():   THREE.BoxGeometry { return (gZ2Hasta   ||= new THREE.BoxGeometry(0.021 * HEX_R, 0.920 * HEX_R, 0.021 * HEX_R)); }
function getGZ2HastaTip(): THREE.ConeGeometry { return (gZ2HastaTip ||= new THREE.ConeGeometry(0.020 * HEX_R, 0.062 * HEX_R, 4)); }
function getGZ2ScaleBand(): THREE.BoxGeometry { return (gZ2ScaleBand ||= new THREE.BoxGeometry(0.186 * HEX_R, 0.026 * HEX_R, 0.106 * HEX_R)); }
function getGZ2BeltWide(): THREE.BoxGeometry { return (gZ2BeltWide ||= new THREE.BoxGeometry(0.192 * HEX_R, 0.056 * HEX_R, 0.114 * HEX_R)); }
function getGZ2Harness(): THREE.BoxGeometry { return (gZ2Harness ||= new THREE.BoxGeometry(0.152 * HEX_R, 0.026 * HEX_R, 0.012 * HEX_R)); }
function getGZ2Phalera(): THREE.BoxGeometry { return (gZ2Phalera ||= new THREE.BoxGeometry(0.038 * HEX_R, 0.038 * HEX_R, 0.012 * HEX_R)); }
function getGZ2Pole():    THREE.BoxGeometry { return (gZ2Pole    ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.500 * HEX_R, 0.016 * HEX_R)); }
function getGZ2Flag():    THREE.BoxGeometry { return (gZ2Flag    ||= new THREE.BoxGeometry(0.085 * HEX_R, 0.062 * HEX_R, 0.008 * HEX_R)); }
function getGZ2Finial():  THREE.BoxGeometry { return (gZ2Finial  ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.024 * HEX_R, 0.024 * HEX_R)); }

// ── owalna skorupa (fasetowany obrys elipsy — jak hastati-falangita) ───────
function z2OvalRing(a: number, b: number, c: number, N: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(ang) * a, y = Math.sin(ang) * b;
    pts.push([x, y, -c * (x / a) * (x / a)]);
  }
  return pts;
}
function z2OvalShellGeo(a: number, b: number, c: number, t: number, N: number): THREE.BufferGeometry {
  const ring = z2OvalRing(a, b, c, N);
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
function z2OvalFaceGeo(a: number, b: number, c: number, N: number): THREE.BufferGeometry {
  const ring = z2OvalRing(a, b, c, N);
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
function getGZ2ThurShell(): THREE.BufferGeometry { return (gZ2ThurShell ||= z2OvalShellGeo(0.092 * HEX_R, 0.180 * HEX_R, 0.030 * HEX_R, 0.018 * HEX_R, 10)); }
function getGZ2ThurFace():  THREE.BufferGeometry { return (gZ2ThurFace  ||= z2OvalFaceGeo(0.077 * HEX_R, 0.151 * HEX_R, 0.021 * HEX_R, 10)); }
function getGZ2ScutShell(): THREE.BufferGeometry { return (gZ2ScutShell ||= z2OvalShellGeo(0.104 * HEX_R, 0.190 * HEX_R, 0.052 * HEX_R, 0.020 * HEX_R, 10)); }
function getGZ2ScutFace():  THREE.BufferGeometry { return (gZ2ScutFace  ||= z2OvalFaceGeo(0.0874 * HEX_R, 0.1596 * HEX_R, 0.0367 * HEX_R, 10)); }

// ---------------------------------------------------------------------------
// Lancuch konczyn — konwencja niSeg/niBuildLeg/niBuildArm (hastati-falangita)
// ---------------------------------------------------------------------------
function z2DirDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}
function z2Seg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = z2DirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}
function z2BuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  mFoot: THREE.MeshStandardMaterial, hipY: number = Z2_HIP_Y,
): void {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = z2Seg(group, getGZ2Thigh(), mThigh, P, thU, Z2_THIGH_L);
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = z2Seg(group, getGZ2Shin(), mShin, P, thL, Z2_SHIN_L);
  const foot = new THREE.Mesh(getGZ2Foot(), mFoot);
  foot.position.set(sx, 0.013 * HEX_R, P.z + 0.016 * HEX_R);
  group.add(foot);
}
function z2BuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
  shldY: number = Z2_SHLD_Y,
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  let P = new THREE.Vector3(sx, shldY, 0);
  P = z2Seg(group, getGZ2UpArm(), mUp, P, thU, Z2_UPARM_L);
  P.y += 0.010 * HEX_R;
  const wrist = z2Seg(group, getGZ2Forearm(), mFore, P, thF, Z2_FOREARM_L);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getGZ2Fist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(z2DirDown(thF), 0.014 * HEX_R));
    group.add(fist);
  }
  return { wrist, axis: z2DirDown(thF) };
}
/** Korpus: tors + szyja + glowa (+ opcjonalne oczy przy odkrytej twarzy). */
function z2Core(
  group: THREE.Group, mat: MatFactory, mTorso: THREE.MeshStandardMaterial,
  eyes: boolean = false,
): THREE.MeshStandardMaterial {
  const torso = new THREE.Mesh(getGZ2Torso(), mTorso);
  torso.position.set(0, Z2_TORSO_CTR, 0);
  group.add(torso);
  const mSkin = mat(Z2_SKIN, 0.05, 0.80);
  const neck = new THREE.Mesh(getGZ2Neck(), mSkin);
  neck.position.set(0, Z2_TORSO_TOP + Z2_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(getGZ2Head(), mSkin);
  head.position.set(0, Z2_HEAD_CTR, 0);
  group.add(head);
  if (eyes) {
    const mEye = mat(Z2_EYE, 0.02, 0.95);
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(getGZ2Eye(), mEye);
      eye.position.set(sx * 0.028 * HEX_R, Z2_HEAD_CTR + 0.008 * HEX_R, Z2_HEAD_S * 0.5 + 0.004 * HEX_R);
      group.add(eye);
    }
  }
  return mSkin;
}
/** ZELAZNY miecz prosty NA OSI przedramienia (klinga + grot + jelec). */
function z2IronSword(
  group: THREE.Group, wrist: THREE.Vector3, axis: THREE.Vector3, thF: number,
  mBlade: THREE.MeshStandardMaterial, mGuard: THREE.MeshStandardMaterial,
  bladeGeo: THREE.BoxGeometry = getGZ2Blade(),
): void {
  const blade = new THREE.Mesh(bladeGeo, mBlade);
  blade.rotation.x = Math.PI - thF;
  blade.position.copy(wrist.clone().addScaledVector(axis, 0.098 * HEX_R));
  group.add(blade);
  const tip = new THREE.Mesh(getGZ2BladeTip(), mBlade);
  tip.rotation.x = Math.PI - thF;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(wrist.clone().addScaledVector(axis, 0.1875 * HEX_R));
  group.add(tip);
  const guard = new THREE.Mesh(getGZ2Guard(), mGuard);
  guard.rotation.x = Math.PI - thF;
  guard.position.copy(wrist.clone().addScaledVector(axis, 0.030 * HEX_R));
  group.add(guard);
}
/** Okragla tarcza: pole (kolor gracza) + rant; zwraca grupe do ozdob. */
function z2RoundShield(
  mFace: THREE.MeshStandardMaterial, mRim: THREE.MeshStandardMaterial, big: boolean,
): THREE.Group {
  const sh = new THREE.Group();
  const face = new THREE.Mesh(big ? getGZ2ShFaceB() : getGZ2ShFace(), mFace);
  face.rotation.x = Math.PI / 2;
  sh.add(face);
  const rim = new THREE.Mesh(big ? getGZ2ShRimB() : getGZ2ShRim(), mRim);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0, -0.004 * HEX_R);
  sh.add(rim);
  return sh;
}
/** Tarcza na LEWYM (+X) przedramieniu przed korpusem (uchwyt za polem). */
function z2MountShield(group: THREE.Group, sh: THREE.Group, wrist: THREE.Vector3): void {
  sh.position.set(
    wrist.x - 0.030 * HEX_R,
    wrist.y + 0.045 * HEX_R,
    wrist.z + 0.050 * HEX_R,
  );
  sh.rotation.y = -0.20;
  group.add(sh);
}
/** Choragiew SUPER na plecach (konwencja P2/P6): drzewce -0.14, flaga gracza, zloty finial. */
function z2Banner(
  group: THREE.Group, mPole: THREE.MeshStandardMaterial,
  mFlag: THREE.MeshStandardMaterial, mGold: THREE.MeshStandardMaterial,
  dy: number = 0,
): void {
  const pole = new THREE.Mesh(getGZ2Pole(), mPole);
  pole.rotation.x = -0.14;
  pole.position.set(-0.052 * HEX_R, 0.340 * HEX_R + dy, -0.086 * HEX_R);
  group.add(pole);
  const flag = new THREE.Mesh(getGZ2Flag(), mFlag);
  flag.rotation.x = -0.14;
  flag.position.set(-0.100 * HEX_R, 0.548 * HEX_R + dy, -0.115 * HEX_R);
  group.add(flag);
  const fin = new THREE.Mesh(getGZ2Finial(), mGold);
  fin.position.set(-0.052 * HEX_R, 0.600 * HEX_R + dy, -0.122 * HEX_R);
  group.add(fin);
}

// ---------------------------------------------------------------------------
// TYRSKI MIECZNIK (Fenicja, Zelazo) — POZA ATAKU (pchniecie)
// Purpurowa tunika tyryjska + kremowa lamowka, helm POLKULISTY (misa+kopulka),
// ZELAZNY miecz prosty w PRAWEJ (-X) w pchnieciu NA OSI przedramienia,
// okragla tarcza z ROZETA fenicka (kremowe platki na polu gracza) na LEWYM (+X).
// ---------------------------------------------------------------------------
export function buildTyrskiMiecznik(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mPurple = mat(Z2_PURPLE,    0.06, 0.78);
  const mCream  = mat(Z2_CREAM,     0.06, 0.82);
  const mBronze = mat(Z2_BRONZE,    0.35, 0.50);
  const mSteel  = mat(Z2_STEEL,     0.60, 0.30);   // zimna stal
  const mOwner  = mat(ownerColor_,  0.14, 0.64);
  const mLeath  = mat(Z2_LEATHER,   0.06, 0.82);
  const mDark   = mat(Z2_DARK,      0.05, 0.88);

  const HIP_Y = Z2_HIP_Y - 0.012 * HEX_R;          // wypad

  // korpus: purpurowa tunika + spodnica + kremowa lamowka + pas
  const mSkin = z2Core(group, mat, mPurple);
  const skirt = new THREE.Mesh(getGZ2Skirt(), mPurple);
  skirt.position.set(0, Z2_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const hem = new THREE.Mesh(getGZ2Hem(), mCream);
  hem.position.set(0, Z2_TORSO_BOT - 0.052 * HEX_R, 0);
  group.add(hem);
  const belt = new THREE.Mesh(getGZ2Belt(), mLeath);
  belt.position.set(0, 0.256 * HEX_R, 0);
  group.add(belt);
  const sash = new THREE.Mesh(getGZ2Sash(), mOwner);   // szarfa kolor gracza
  sash.rotation.z = 0.45;
  sash.position.set(0.012 * HEX_R, Z2_TORSO_CTR + 0.010 * HEX_R, Z2_TORSO_D * 0.5 + 0.008 * HEX_R);
  group.add(sash);

  // nogi: wypad
  z2BuildLeg(group,  Z2_HIP_X,  0.56,  0.32, mPurple, mSkin, mLeath, HIP_Y);
  z2BuildLeg(group, -Z2_HIP_X, -0.50, -0.18, mPurple, mSkin, mLeath, HIP_Y);

  // HELM POLKULISTY: misa + kopulka ZELAZNE (zimna stal) + krotka ciemna kitka
  const bowl = new THREE.Mesh(getGZ2Bowl(), mSteel);
  bowl.position.set(0, Z2_HEAD_CTR + 0.038 * HEX_R, 0);
  group.add(bowl);
  const top = new THREE.Mesh(getGZ2BowlTop(), mSteel);
  top.position.set(0, Z2_HEAD_CTR + 0.088 * HEX_R, 0);
  group.add(top);
  const tuftG = new THREE.Mesh(getGZ2Finial(), mDark);
  tuftG.position.set(0, Z2_HEAD_TOP + 0.052 * HEX_R, -0.008 * HEX_R);
  group.add(tuftG);

  // PRAWE (-X) RAMIE + ZELAZNY MIECZ w pchnieciu
  const armR = z2BuildArm(group, -Z2_SHLD_X, 0.95, 1.50, mPurple, mSkin, mLeath);
  z2IronSword(group, armR.wrist, armR.axis, 1.50, mSteel, mBronze);

  // LEWE (+X) RAMIE + TARCZA Z ROZETA (3 platki-boxy przez srodek = 6 platkow)
  const armL = z2BuildArm(group, Z2_SHLD_X, 0.52, 1.05, mPurple, mSkin, null);
  const sh = z2RoundShield(mOwner, mBronze, false);
  for (let i = 0; i < 3; i++) {
    const petal = new THREE.Mesh(getGZ2Petal(), mCream);
    petal.rotation.z = i * Math.PI / 3;
    petal.position.z = 0.018 * HEX_R;
    sh.add(petal);
  }
  const hub = new THREE.Mesh(getGZ2ShBoss(), mBronze);
  hub.position.z = 0.025 * HEX_R;
  sh.add(hub);
  z2MountShield(group, sh, armL.wrist);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// GWARDIA TYRENSKA (Fenicja, Zelazo, ELITA) — POZA ATAKU (ciecie z zamachu)
// Bogatsza od Tyrskiego miecznika: ZLOTE lamowki purpury, tarcza WIEKSZA
// z GWIAZDA fenicka (8 promieni), GRZEBIEN na helmie polkulistym, ozdobny
// szeroki pas ze zlotymi krazkami, zlota nagolennica, zelazny miecz z zamachu.
// ---------------------------------------------------------------------------
export function buildGwardiaTyrenska(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mPurple = mat(Z2_PURPLE,    0.06, 0.78);
  const mGold   = mat(Z2_GOLD,      0.55, 0.35);
  const mSteel  = mat(Z2_STEEL,     0.60, 0.30);
  const mOwner  = mat(ownerColor_,  0.14, 0.64);
  const mLeath  = mat(Z2_LEATHER,   0.06, 0.82);
  const mCrest  = mat(Z2_DARK,      0.05, 0.85);

  const HIP_Y = Z2_HIP_Y - 0.012 * HEX_R;

  // korpus: purpura + ZLOTA lamowka + ozdobny szeroki pas + 2 zlote krazki
  const mSkin = z2Core(group, mat, mPurple);
  const skirt = new THREE.Mesh(getGZ2Skirt(), mPurple);
  skirt.position.set(0, Z2_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const hem = new THREE.Mesh(getGZ2Hem(), mGold);
  hem.position.set(0, Z2_TORSO_BOT - 0.052 * HEX_R, 0);
  group.add(hem);
  const belt = new THREE.Mesh(getGZ2BeltWide(), mLeath);
  belt.position.set(0, 0.258 * HEX_R, 0);
  group.add(belt);
  const sash = new THREE.Mesh(getGZ2Sash(), mGold);    // zlota szarfa elity
  sash.rotation.z = 0.45;
  sash.position.set(0.012 * HEX_R, Z2_TORSO_CTR + 0.010 * HEX_R, Z2_TORSO_D * 0.5 + 0.008 * HEX_R);
  group.add(sash);

  // nogi + zlota nagolennica na wykrocznej
  z2BuildLeg(group,  Z2_HIP_X,  0.56,  0.32, mPurple, mSkin, mLeath, HIP_Y);
  z2BuildLeg(group, -Z2_HIP_X, -0.50, -0.18, mPurple, mSkin, mLeath, HIP_Y);
  const greave = new THREE.Mesh(getGZ2Greave(), mGold);
  greave.rotation.x = Math.PI - 0.32;
  greave.position.set(Z2_HIP_X, 0.072 * HEX_R, 0.066 * HEX_R);
  group.add(greave);

  // HELM POLKULISTY ZELAZNY Z GRZEBIENIEM (misa + kopulka + grzebien przod-tyl)
  const bowl = new THREE.Mesh(getGZ2Bowl(), mSteel);
  bowl.position.set(0, Z2_HEAD_CTR + 0.038 * HEX_R, 0);
  group.add(bowl);
  const top = new THREE.Mesh(getGZ2BowlTop(), mSteel);
  top.position.set(0, Z2_HEAD_CTR + 0.088 * HEX_R, 0);
  group.add(top);
  const crB = new THREE.Mesh(getGZ2CrestBase(), mGold);
  crB.position.set(0, Z2_HEAD_TOP + 0.048 * HEX_R, -0.004 * HEX_R);
  group.add(crB);
  const crH = new THREE.Mesh(getGZ2CrestHair(), mCrest);
  crH.rotation.x = 0.10;
  crH.position.set(0, Z2_HEAD_TOP + 0.090 * HEX_R, -0.008 * HEX_R);
  group.add(crH);

  // PRAWE (-X) RAMIE + ZELAZNY MIECZ Z ZAMACHU (lokiec nad barkiem)
  const armR = z2BuildArm(group, -Z2_SHLD_X, -2.45, 2.62, mPurple, mSkin, mLeath);
  z2IronSword(group, armR.wrist, armR.axis, 2.62, mSteel, mGold);

  // LEWE (+X) RAMIE + WIEKSZA TARCZA Z GWIAZDA FENICKA (4 boxy = 8 promieni)
  const armL = z2BuildArm(group, Z2_SHLD_X, 0.50, 1.02, mPurple, mSkin, null);
  const sh = z2RoundShield(mOwner, mGold, true);
  const mCream = mat(Z2_CREAM, 0.06, 0.82);
  for (let i = 0; i < 4; i++) {
    const ray = new THREE.Mesh(getGZ2Petal(), mCream);
    ray.rotation.z = i * Math.PI / 4;
    ray.position.z = 0.019 * HEX_R;
    sh.add(ray);
  }
  const hub = new THREE.Mesh(getGZ2ShBoss(), mGold);
  hub.position.z = 0.026 * HEX_R;
  sh.add(hub);
  z2MountShield(group, sh, armL.wrist);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// WOJOWNIK Z ZELAZNYM KHOPESH (Egipt, Zelazo) — CIECIE SIERPOWCEM Z ZAMACHU
// Ewolucja brazowego (jednostki-p4-melee.ts buildKhopeshWarrior): khepresh
// CIEMNIEJSZY granat, khopesh ZELAZNY (zimna stal: prosta czesc na osi
// przedramienia + 3-segmentowy hak), lekka zbroja LUSKOWA (3 brazowe pasy)
// na lnianej tunice, tarcza PROSTOKATNA zaokraglona u gory (pole gracza).
// ---------------------------------------------------------------------------
export function buildZelaznyKhopesh(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mBronze = mat(Z2_BRONZE,    0.42, 0.45);
  const mBronzL = mat(Z2_BRONZE_LT, 0.52, 0.38);
  const mSteel  = mat(Z2_STEEL,     0.62, 0.28);   // ZELAZO — zimna stal
  const mOwner  = mat(ownerColor_,  0.14, 0.64);
  const mLinen  = mat(Z2_LINEN,     0.05, 0.86);
  const mBlueD  = mat(Z2_KHEP_DK,   0.06, 0.72);   // khepresh ciemniejszy
  const mGold   = mat(Z2_GOLD,      0.55, 0.38);
  const mLeath  = mat(Z2_LEATHER,   0.06, 0.82);

  const HIP_Y = Z2_HIP_Y - 0.012 * HEX_R;

  // korpus: lniana tunika + kilt + pas gracza + ZBROJA LUSKOWA (3 pasy)
  const mSkin = z2Core(group, mat, mLinen);
  const skirt = new THREE.Mesh(getGZ2Skirt(), mLinen);
  skirt.position.set(0, Z2_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const waist = new THREE.Mesh(getGZ2Belt(), mOwner);
  waist.position.set(0, 0.252 * HEX_R, 0);
  group.add(waist);
  for (let i = 0; i < 3; i++) {                     // luska: pasy schodkowe
    const band = new THREE.Mesh(getGZ2ScaleBand(), (i % 2 === 0) ? mBronzL : mBronze);
    band.position.set(0, Z2_TORSO_CTR + (0.052 - i * 0.040) * HEX_R, 0.004 * HEX_R);
    group.add(band);
  }

  // nogi: bose uda, sandaly
  z2BuildLeg(group,  Z2_HIP_X,  0.56,  0.32, mSkin, mSkin, mLeath, HIP_Y);
  z2BuildLeg(group, -Z2_HIP_X, -0.50, -0.18, mSkin, mSkin, mLeath, HIP_Y);

  // KHEPRESH CIEMNIEJSZY: bania ku tylowi + zlota opaska + ureusz
  const khep = new THREE.Mesh(getGZ2Khep(), mBlueD);
  khep.rotation.x = -0.10;
  khep.position.set(0, Z2_HEAD_CTR + 0.034 * HEX_R, -0.006 * HEX_R);
  group.add(khep);
  const band = new THREE.Mesh(getGZ2KhBand(), mGold);
  band.position.set(0, Z2_HEAD_CTR + 0.016 * HEX_R, 0);
  group.add(band);
  const uraeus = new THREE.Mesh(getGZ2Uraeus(), mGold);
  uraeus.position.set(0, Z2_HEAD_CTR + 0.075 * HEX_R, 0.060 * HEX_R);
  group.add(uraeus);

  // PRAWE (-X) RAMIE + ZELAZNY KHOPESH z zamachu (konwencja p4-melee)
  const armR = z2BuildArm(group, -Z2_SHLD_X, -2.35, 2.75, mSkin, mSkin, mLeath);
  const kh = new THREE.Group();
  kh.position.copy(armR.wrist);
  kh.rotation.x = Math.PI - 2.75;                   // lokalny +Y = os przedramienia
  const straight = new THREE.Mesh(getGZ2KhStr(), mSteel);
  straight.position.set(0, 0.072 * HEX_R, 0);
  kh.add(straight);
  let Py = 0.120 * HEX_R, Pz = 0;
  for (const a of [0.40, 0.95, 1.55]) {             // sierpowy hak — 3 segmenty
    const seg = new THREE.Mesh(getGZ2KhSeg(), mSteel);
    seg.rotation.x = a;
    const dy = Math.cos(a) * 0.062 * HEX_R, dz = Math.sin(a) * 0.062 * HEX_R;
    seg.position.set(0, Py + dy * 0.5, Pz + dz * 0.5);
    kh.add(seg);
    Py += dy; Pz += dz;
  }
  const guard = new THREE.Mesh(getGZ2Guard(), mGold);
  guard.position.set(0, 0.026 * HEX_R, 0);
  kh.add(guard);
  group.add(kh);

  // LEWE (+X) RAMIE + TARCZA PROSTOKATNA zaokraglona u gory (2 stopnie)
  const armL = z2BuildArm(group, Z2_SHLD_X, 0.48, 1.06, mSkin, mSkin, null);
  const sh = new THREE.Group();
  const plate = new THREE.Mesh(getGZ2RectPl(), mOwner);
  sh.add(plate);
  const ptop = new THREE.Mesh(getGZ2RectTop(), mOwner);
  ptop.position.set(0, 0.112 * HEX_R, 0);
  sh.add(ptop);
  const pcap = new THREE.Mesh(getGZ2RectCap(), mOwner);
  pcap.position.set(0, 0.140 * HEX_R, 0);
  sh.add(pcap);
  const boss = new THREE.Mesh(getGZ2ShBoss(), mBronzL);
  boss.position.set(0, 0.012 * HEX_R, 0.014 * HEX_R);
  sh.add(boss);
  z2MountShield(group, sh, armL.wrist);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// THORAKITES (Grecja, Zelazo) — WLOCZNIK, POZA ATAKU (pchniecie NADRECZNE)
// Zolnierz w KOLCZUDZE (thorax): tors + rekawy + fartuch kolczy (stal matowa),
// owalna tarcza THUREOS z pionowym KREGOSLUPEM i umbo-beczulka (wplyw
// celtycki) na LEWYM (+X), WLOCZNIA DORY (0.70*HEX_R) w PRAWEJ (-X) uniesiona
// nad barkiem grotem w przod-dol ponad krawedzia thureos, helm ATTYCKI
// otwarty (diadem czolowy + policzki, twarz WIDOCZNA — oczy).
// ---------------------------------------------------------------------------
export function buildThorakites(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mMail   = mat(Z2_STEEL_DK,  0.42, 0.86);   // kolczuga — stal matowa
  const mGoldT  = mat(Z2_GOLD,      0.55, 0.35);
  const mCrimson = mat(Z2_CRIMSON,  0.08, 0.74);
  const mSteel  = mat(Z2_STEEL,     0.60, 0.30);
  const mBronze = mat(Z2_BRONZE,    0.35, 0.50);
  const mBronzL = mat(Z2_BRONZE_LT, 0.55, 0.35);
  const mOwner  = mat(ownerColor_,  0.16, 0.62);
  const mWood   = mat(Z2_WOOD,      0.05, 0.85);
  const mLinen  = mat(Z2_LINEN,     0.06, 0.82);
  const mLeath  = mat(Z2_LEATHER,   0.06, 0.82);

  const HIP_Y = Z2_HIP_Y - 0.010 * HEX_R;

  // korpus: KOLCZUGA (tors) + lniany chiton pod spodem (spodnica) + fartuch kolczy
  const mSkin = z2Core(group, mat, mMail, true);
  const skirt = new THREE.Mesh(getGZ2Skirt(), mLinen);
  skirt.position.set(0, Z2_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const mailHem = new THREE.Mesh(getGZ2Hem(), mMail);   // dol kolczugi
  mailHem.position.set(0, Z2_TORSO_BOT - 0.008 * HEX_R, 0);
  group.add(mailHem);
  const belt = new THREE.Mesh(getGZ2Belt(), mLeath);
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);

  // nogi: gole (chiton) + sandaly
  z2BuildLeg(group,  Z2_HIP_X,  0.55,  0.30, mLinen, mSkin, mLeath, HIP_Y);
  z2BuildLeg(group, -Z2_HIP_X, -0.50, -0.16, mLinen, mSkin, mLeath, HIP_Y);

  // HELM ATTYCKI OTWARTY: dzwon + diadem czolowy + policzki (twarz widoczna)
  const bowl = new THREE.Mesh(getGZ2AttBowl(), mBronze);
  bowl.position.set(0, Z2_HEAD_CTR + 0.042 * HEX_R, 0);
  group.add(bowl);
  const brow = new THREE.Mesh(getGZ2AttBrow(), mGoldT);
  brow.position.set(0, Z2_HEAD_CTR + 0.026 * HEX_R, 0);
  group.add(brow);
  for (const sx of [-1, 1]) {
    const ck = new THREE.Mesh(getGZ2Cheek(), mBronze);
    ck.position.set(sx * (Z2_HEAD_S * 0.5 + 0.004 * HEX_R), Z2_HEAD_CTR - 0.014 * HEX_R, 0.014 * HEX_R);
    group.add(ck);
  }
  const crB = new THREE.Mesh(getGZ2CrestBase(), mBronzL);   // grzebien attycki
  crB.position.set(0, Z2_HEAD_TOP + 0.036 * HEX_R, -0.002 * HEX_R);
  group.add(crB);
  const crH = new THREE.Mesh(getGZ2CrestHair(), mCrimson);
  crH.rotation.x = 0.10;
  crH.position.set(0, Z2_HEAD_TOP + 0.078 * HEX_R, -0.006 * HEX_R);
  group.add(crH);

  // PRAWE (-X) RAMIE (rekaw kolczy) + DORY w pchnieciu NADRECZNYM:
  // lokiec uniesiony za barkiem, piesc na wysokosci ucha, drzewce NA OSI
  // przod-lekko-DOL (grot celuje ponad krawedzia thureos), sauroter za glowa
  const armR = z2BuildArm(group, -Z2_SHLD_X, -2.02, 2.36, mMail, mSkin, mLeath);
  const DEC = 0.22;                                  // deklinacja grotu (w dol)
  const doryAxis = new THREE.Vector3(0, -Math.sin(DEC), Math.cos(DEC));
  const grip = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  const shaft = new THREE.Mesh(getGZ2Dory(), mWood);
  shaft.rotation.x = Math.PI / 2 + DEC;
  shaft.position.copy(grip.clone().addScaledVector(doryAxis, 0.070 * HEX_R));
  group.add(shaft);
  const dtip = new THREE.Mesh(getGZ2HastaTip(), mSteel);
  dtip.rotation.x = Math.PI / 2 + DEC;
  dtip.rotation.y = Math.PI / 4;
  dtip.position.copy(grip.clone().addScaledVector(doryAxis, (0.070 + 0.350 + 0.028) * HEX_R));
  group.add(dtip);
  const saur = new THREE.Mesh(getGZ2Finial(), mBronzL);   // sauroter — okucie tylca
  saur.position.copy(grip.clone().addScaledVector(doryAxis, -(0.280 + 0.010) * HEX_R));
  group.add(saur);

  // LEWE (+X) RAMIE + THUREOS: skorupa + pole gracza + KREGOSLUP + umbo-beczulka
  const armL = z2BuildArm(group, Z2_SHLD_X, 0.52, 1.08, mMail, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.028 * HEX_R,
    armL.wrist.y + 0.040 * HEX_R,
    armL.wrist.z + 0.048 * HEX_R,
  );
  sh.rotation.y = -0.20;
  const shell = new THREE.Mesh(getGZ2ThurShell(), mLeath);
  sh.add(shell);
  const face = new THREE.Mesh(getGZ2ThurFace(), mOwner);
  face.position.set(0, 0, 0.014 * HEX_R);
  sh.add(face);
  const spine = new THREE.Mesh(getGZ2Spine(), mWood);   // pionowy kregoslup
  spine.position.set(0, 0, 0.021 * HEX_R);
  sh.add(spine);
  const umbo = new THREE.Mesh(getGZ2SpineUmb(), mSteel); // umbo-beczulka na kregoslupie
  umbo.position.set(0, 0, 0.030 * HEX_R);
  sh.add(umbo);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// TRIARI (Rzym, SUPER Zelazo) — WETERAN-WLOCZNIK, POZA KLECZACA trzeciej linii
// "Ad triarios redisse": prawe kolano na ziemi, golen plasko w tyl, lewa noga
// wykroczna zgieta; cala sylwetka OBNIZONA o 0.060; scutum owalne (jak
// Hastati) oparte nisko przed korpusem; DLUGA hasta (0.92*HEX_R) w prawej
// dloni wystawiona w przod-GORE ponad tarcza; brazowy montefortino ze zlotymi
// policzkami i POTROJNYM BIALYM pioropuszem weterana; SIWY zarost; FALERY
// (3 krazki na pasie piersiowym); choragiew SUPER na plecach.
// ---------------------------------------------------------------------------
export function buildTriari(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mGold   = mat(Z2_GOLD,      0.58, 0.32);
  const mSilver = mat(Z2_STEEL,     0.62, 0.28);
  const mBronzL = mat(Z2_BRONZE_LT, 0.52, 0.38);
  const mBronzD = mat(Z2_BRONZE_DK, 0.45, 0.42);
  const mRed    = mat(Z2_ROMAN_RED, 0.05, 0.80);
  const mWhite  = mat(Z2_WHITE,     0.06, 0.80);   // pioropusz weterana
  const mGrey   = mat(Z2_GREY,      0.05, 0.85);   // siwy zarost
  const mOwner  = mat(ownerColor_,  0.15, 0.65);
  const mLeath  = mat(Z2_LEATHER,   0.05, 0.82);
  const mWood   = mat(Z2_WOOD,      0.05, 0.85);
  const mWoodD  = mat(Z2_WOOD_DK,   0.05, 0.85);

  const DY = 0.060 * HEX_R;                        // obnizenie sylwetki (klek)
  const HIP_Y   = Z2_HIP_Y - DY;
  const SHLD_Y  = Z2_SHLD_Y - DY;
  const HEAD_CTR = Z2_HEAD_CTR - DY;
  const HEAD_TOP = Z2_HEAD_TOP - DY;

  // korpus OBNIZONY, lekko pochylony: tors + spodnica + pas (recznie, bo -DY)
  const mSkin = mat(Z2_SKIN, 0.05, 0.80);
  const torso = new THREE.Mesh(getGZ2Torso(), mRed);
  torso.rotation.x = 0.08;                         // lekkie pochylenie w przod
  torso.position.set(0, Z2_TORSO_CTR - DY, 0.004 * HEX_R);
  group.add(torso);
  const neck = new THREE.Mesh(getGZ2Neck(), mSkin);
  neck.position.set(0, Z2_TORSO_TOP + Z2_NECK_H * 0.5 - DY, 0.010 * HEX_R);
  group.add(neck);
  const head = new THREE.Mesh(getGZ2Head(), mSkin);
  head.position.set(0, HEAD_CTR, 0.012 * HEX_R);
  group.add(head);
  const skirt = new THREE.Mesh(getGZ2Skirt(), mRed);
  skirt.position.set(0, Z2_TORSO_BOT - 0.018 * HEX_R - DY, 0);
  group.add(skirt);
  const belt = new THREE.Mesh(getGZ2Belt(), mLeath);
  belt.position.set(0, 0.252 * HEX_R - DY, 0);
  group.add(belt);

  // SIWY ZAROST weterana (pod krawedzia helmu)
  const beard = new THREE.Mesh(getGZ2Beard(), mGrey);
  beard.position.set(0, HEAD_CTR - 0.052 * HEX_R, 0.056 * HEX_R);
  group.add(beard);

  // FALERY: pas piersiowy + 3 krazki odznaczen (zloto/srebro/zloto)
  const harness = new THREE.Mesh(getGZ2Harness(), mLeath);
  harness.position.set(0, Z2_TORSO_CTR + 0.034 * HEX_R - DY, Z2_TORSO_D * 0.5 + 0.008 * HEX_R);
  group.add(harness);
  let fi = 0;
  for (const dx of [-0.052, 0.0, 0.052]) {
    const ph = new THREE.Mesh(getGZ2Phalera(), (fi++ % 2 === 0) ? mGold : mSilver);
    ph.rotation.z = Math.PI / 4;
    ph.position.set(dx * HEX_R, Z2_TORSO_CTR + 0.034 * HEX_R - DY, Z2_TORSO_D * 0.5 + 0.014 * HEX_R);
    group.add(ph);
  }

  // NOGA LEWA (+X) — wykroczna, mocno zgieta (stopa na ziemi z przodu)
  let P = new THREE.Vector3(Z2_HIP_X, HIP_Y, 0);
  P = z2Seg(group, getGZ2Thigh(), mRed, P, 1.05, Z2_THIGH_L);
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = z2Seg(group, getGZ2Shin(), mSkin, P, 0.10, Z2_SHIN_L);
  const footL = new THREE.Mesh(getGZ2Foot(), mLeath);
  footL.position.set(Z2_HIP_X, 0.013 * HEX_R, P.z + 0.016 * HEX_R);
  group.add(footL);
  const greave = new THREE.Mesh(getGZ2Greave(), mGold);  // nagolennica wykrocznej
  greave.rotation.x = Math.PI - 0.10;
  greave.position.set(Z2_HIP_X, 0.058 * HEX_R, P.z - 0.006 * HEX_R);
  group.add(greave);

  // NOGA PRAWA (-X) — KLECZACA: udo w dol-tyl, golen PLASKO na ziemi w tyl,
  // stopa pionowo palcami w dol (podbicie na ziemi)
  const knee = new THREE.Vector3(
    -Z2_HIP_X,
    HIP_Y - Z2_THIGH_L * Math.cos(0.30),
    -Z2_THIGH_L * Math.sin(0.30),
  );
  const thighR = new THREE.Mesh(getGZ2Thigh(), mRed);
  thighR.rotation.x = Math.PI + 0.30;
  thighR.position.set(-Z2_HIP_X, (HIP_Y + knee.y) * 0.5, knee.z * 0.5);
  group.add(thighR);
  const shinR = new THREE.Mesh(getGZ2Shin(), mSkin);
  shinR.rotation.x = -Math.PI / 2;                 // golen lezy poziomo (w tyl)
  shinR.position.set(-Z2_HIP_X, 0.030 * HEX_R, knee.z - 0.048 * HEX_R);
  group.add(shinR);
  const footR = new THREE.Mesh(getGZ2Foot(), mLeath);
  footR.rotation.x = -Math.PI / 2;                 // palce w dol za golenia
  footR.position.set(-Z2_HIP_X, 0.036 * HEX_R, knee.z - 0.118 * HEX_R);
  group.add(footR);

  // MONTEFORTINO BRAZOWY: miska + zlote policzki + POTROJNY BIALY pioropusz
  const bowl = new THREE.Mesh(getGZ2MontBowl(), mBronzD);
  bowl.position.set(0, HEAD_CTR + 0.030 * HEX_R, 0.012 * HEX_R);
  group.add(bowl);
  for (const sx of [-1, 1]) {
    const ck = new THREE.Mesh(getGZ2Cheek(), mGold);
    ck.position.set(sx * (Z2_HEAD_S * 0.5 + 0.004 * HEX_R), HEAD_CTR - 0.014 * HEX_R, 0.030 * HEX_R);
    group.add(ck);
  }
  for (const sx of [-1, 0, 1]) {                    // potrojny pioropusz weterana
    const f = new THREE.Mesh(getGZ2Feather(), mWhite);
    f.rotation.z = -sx * 0.16;
    f.position.set(sx * 0.034 * HEX_R, HEAD_TOP + (sx === 0 ? 0.096 : 0.086) * HEX_R, 0.012 * HEX_R);
    group.add(f);
  }

  // PRAWE (-X) RAMIE + DLUGA HASTA wystawiona w przod-GORE ponad tarcza:
  // dlon nisko-przod, wlocznia NA OSI chwytu, grot ~0.38 wysoko przed figura
  const armR = z2BuildArm(group, -Z2_SHLD_X, 0.60, 1.20, mRed, mSkin, mLeath, SHLD_Y);
  const EL = 0.30;                                 // elewacja hasty (w gore)
  const hastaAxis = new THREE.Vector3(0, Math.sin(EL), Math.cos(EL));
  const grip = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  const shaft = new THREE.Mesh(getGZ2Hasta(), mWood);
  shaft.rotation.x = Math.PI / 2 - EL;
  shaft.position.copy(grip.clone().addScaledVector(hastaAxis, 0.140 * HEX_R));
  group.add(shaft);
  const htip = new THREE.Mesh(getGZ2HastaTip(), mSilver);
  htip.rotation.x = Math.PI / 2 - EL;
  htip.rotation.y = Math.PI / 4;
  htip.position.copy(grip.clone().addScaledVector(hastaAxis, (0.140 + 0.460 + 0.028) * HEX_R));
  group.add(htip);

  // LEWE (+X) RAMIE + SCUTUM OPARTE NISKO (dolna krawedz tuz nad ziemia)
  const armL = z2BuildArm(group, Z2_SHLD_X, 0.55, 1.05, mRed, mSkin, null, SHLD_Y);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.025 * HEX_R,
    armL.wrist.y - 0.030 * HEX_R,
    armL.wrist.z + 0.050 * HEX_R,
  );
  sh.rotation.y = -0.18;
  const shell = new THREE.Mesh(getGZ2ScutShell(), mLeath);
  sh.add(shell);
  const face = new THREE.Mesh(getGZ2ScutFace(), mOwner);   // pole = KOLOR GRACZA
  face.position.set(0, 0, 0.016 * HEX_R);
  sh.add(face);
  const spina = new THREE.Mesh(getGZ2Spina(), mBronzL);
  spina.position.set(0, 0, 0.024 * HEX_R);
  sh.add(spina);
  const umbo = new THREE.Mesh(getGZ2Umbo(), mGold);
  umbo.position.set(0, 0, 0.034 * HEX_R);
  sh.add(umbo);
  group.add(sh);

  // CHORAGIEW SUPER na plecach (obnizona razem z sylwetka)
  z2Banner(group, mWoodD, mOwner, mGold, -DY);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}
