/**
 * jednostki-p6-super.ts — PACZKA 6/8: SUPER-JEDNOSTKI (6 elit, braz)
 * (seria render-jednostki; wzorzec anatomii: hastati-falangita.ts KOREKTA v2,
 *  konwencja SUPERA: jednostki-p2-inka.ts — choragiew-znacznik NA PLECACH)
 * ---------------------------------------------------------------------------
 * Zamienniki 1:1 dla starych tokenow z gra/src/render/units.ts (kanon
 * buildSuper*; bogatsze buildHuBenWei/buildUThulwana itp. = martwy kod):
 *   buildSuperGreece(ownerColor) -> units.ts:6076 (dispatch :5846 'grecja')  Hieros Lochos
 *   buildSuperChina(ownerColor)  -> units.ts:6162 (dispatch :5847 'chiny')   Hu Ben Wei
 *   buildSuperZulu(ownerColor)   -> units.ts:5976 (dispatch :5848 'zulu')    uThulwana
 *   buildSuperEgypt(ownerColor)  -> units.ts:6364 (dispatch :5850 'egipt')   Medzaj
 *   buildSuperSumer(ownerColor)  -> units.ts:6466 (dispatch :5851 'sumer')   Gwardia Krolewska
 *   buildSuperRome(ownerColor)   -> units.ts:5860 (dispatch :5845 'rzym')    Evocati
 * Interfejs i konwencje BEZ ZMIAN:
 *   - figurka PRZODEM do +Z, stopy na y = 0, uklad prawoskretny => LEWA = +X, PRAWA = -X,
 *   - TARCZA na LEWYM (+X) przedramieniu, BRON w PRAWEJ (-X) dloni NA OSI przedramienia,
 *   - POZY ATAKU (wykrok, biodra obnizone), NAKRYCIE GLOWY na kazdej glowie,
 *   - kolor gracza JAK STARE NIOSA (Grecja/Chiny/Sumer pole tarczy; Rzym blazon
 *     na scutum; Zulu bandolier+opaska; Egipt tylko flaga) + CHORAGIEW NA
 *     PLECACH (pole+flaga kolor gracza+zloty finial) = znacznik SUPER kazdej elity,
 *   - group.userData['mats'] i ['perTokenGeos'] jak w units.ts, geometrie = singletony.
 *
 * CHARAKTERY (rozroznialnosc elit):
 *   GRECJA Hieros Lochos: koryncki helm z WYSOKIM grzebieniem z przednim lokiem,
 *     muskularny kirys z brazu, purpurowy krotki plaszcz, aspis z motywem THETA,
 *     dory nadrecznie (pchniecie).
 *   CHINY Hu Ben Wei: lakier czerwono-czarny, pasowa zbroja lamelkowa, helm
 *     z szerokim rondem i szpicem, halabarda GE z proporcem, TYGRYSIE PASKI
 *     na tarczy i proporcu.
 *   ZULU uThulwana: WIELKA BIALA tarcza nguni (Biale Tarcze!), iklwa, bogatszy
 *     pioropusz (biale i czarne strusie piora) + futrzane amashoba na ramionach.
 *   EGIPT Medzaj: ZLOTY NEMES w niebieskie pasy + ureusz, szeroki kolnierz
 *     usech, khopesh w ciosie, biala tarcza o zlotym szczycie ze skrzydlatym sloncem.
 *   SUMER Gwardia Krolewska: ZLOTY HELM typu Meskalamdug (kok + uszy!), czarna
 *     broda, krolewski kaunakes (3 rzedy runa) + toga, WIELKA prostokatna tarcza
 *     z 3 zlotymi rozetami, wlocznia podrecznie.
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
const S6_SKIN      = 0xe0ac69;   // skora jasna (Grecja/Chiny/Egipt/Sumer/Rzym)
const S6_SKIN_ZULU = 0xb06030;   // skora Zulu (jak P3)
const S6_STEEL     = 0xc2cad2;   // stal polerowana
const S6_SILVER    = 0xd7dce2;   // posrebrzany helm Evocati
const S6_BRONZE    = 0xcf9234;   // braz
const S6_BRONZE_LT = 0xd0a050;   // jasny braz
const S6_COPPER    = 0xb06a3a;   // miedz (Sumer)
const S6_GOLD      = 0xe0b53a;   // zloto elit (akcent SUPER)
const S6_BRASS     = 0xc9a23a;   // mosiadz (helm Chin)
const S6_WOOD      = 0x7a5c3a;   // drewno
const S6_WOOD_DK   = 0x5f4020;   // ciemne drewno (drzewce choragwi)
const S6_LEATHER   = 0x6b4a28;   // skora rzemienie
const S6_LINEN     = 0xe8e0c8;   // len bialy (Egipt)
const S6_WHITE     = 0xeae3d2;   // biel (tarcza nguni, piora)
const S6_BLACK     = 0x1c1712;   // czern (lakier, piora, paski tygrysa)
const S6_ROMAN_RED = 0xa42a22;   // tunika rzymska
const S6_CRIMSON   = 0xa01f2e;   // karmazyn (grzebien Grecji)
const S6_PURPLE    = 0x7a2c96;   // purpura (plaszcz Hieros Lochos, piora Evocati)
const S6_LACQUER   = 0xa8252a;   // lakier chinski czerwony
const S6_TIGER     = 0xc8932e;   // zloto tygrysie (Chiny) / ochra
const S6_HIDE      = 0x8a3a26;   // skora bydleca ruda (kilt Zulu)
const S6_WOAD      = 0x2f5aa0;   // blekit (pasy nemes)
const S6_TEAL      = 0x1f7a78;   // morski (toga Sumeru — jak stary token)
const S6_WOOL      = 0xd8c9a8;   // runo kaunakes (krem)
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
let gS6Band:    THREE.BoxGeometry | null = null;   // opaska na glowe / diadem
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
// Chiny
let gS6LamBand:  THREE.BoxGeometry | null = null;   // pas lamelkowy
let gS6ShldPad:  THREE.BoxGeometry | null = null;
let gS6Roundel:  THREE.BoxGeometry | null = null;   // tygrysi medalion
let gS6Brim:     THREE.CylinderGeometry | null = null;
let gS6HelmCone: THREE.CylinderGeometry | null = null;
let gS6Spike:    THREE.BoxGeometry | null = null;
let gS6GeShaft:  THREE.BoxGeometry | null = null;
let gS6GeBlade:  THREE.BoxGeometry | null = null;
let gS6GeSpike:  THREE.BoxGeometry | null = null;
let gS6Pennon:   THREE.BoxGeometry | null = null;
let gS6PenStripe:THREE.BoxGeometry | null = null;
let gS6RectSh:   THREE.BoxGeometry | null = null;
let gS6TigStripe:THREE.BoxGeometry | null = null;
let gS6ShBoss:   THREE.BoxGeometry | null = null;
// Zulu
let gS6Bando:    THREE.BoxGeometry | null = null;
let gS6FurHem:   THREE.BoxGeometry | null = null;
let gS6Tuft:     THREE.BoxGeometry | null = null;
let gS6Plume:    THREE.BoxGeometry | null = null;
let gS6PlumeTall:THREE.BoxGeometry | null = null;
let gS6Isicoco:  THREE.BoxGeometry | null = null;
let gS6IklShaft: THREE.BoxGeometry | null = null;
let gS6IklBlade: THREE.BoxGeometry | null = null;
let gS6NguniFace:THREE.CylinderGeometry | null = null;
let gS6NguniSpine:THREE.BoxGeometry | null = null;
let gS6NguniPatch:THREE.BoxGeometry | null = null;
// Egipt
let gS6Usech:    THREE.CylinderGeometry | null = null;
let gS6NemesHood:THREE.BoxGeometry | null = null;
let gS6NemesLap: THREE.BoxGeometry | null = null;
let gS6NemesStr: THREE.BoxGeometry | null = null;
let gS6Uraeus:   THREE.BoxGeometry | null = null;
let gS6KiltStr:  THREE.BoxGeometry | null = null;
let gS6KhoGrip:  THREE.BoxGeometry | null = null;
let gS6KhoShank: THREE.BoxGeometry | null = null;
let gS6KhoHook:  THREE.BoxGeometry | null = null;
let gS6KhoTip:   THREE.BoxGeometry | null = null;
let gS6EgShield: THREE.BoxGeometry | null = null;
let gS6EgShTop:  THREE.BoxGeometry | null = null;
let gS6SunDisc:  THREE.BoxGeometry | null = null;
let gS6Wing:     THREE.BoxGeometry | null = null;
// Sumer
let gS6MeskDome: THREE.CylinderGeometry | null = null;
let gS6MeskBun:  THREE.BoxGeometry | null = null;
let gS6MeskEar:  THREE.BoxGeometry | null = null;
let gS6Beard:    THREE.BoxGeometry | null = null;
let gS6Toga:     THREE.BoxGeometry | null = null;
let gS6WoolTier: THREE.BoxGeometry | null = null;
let gS6SumSh:    THREE.BoxGeometry | null = null;
let gS6Rosette:  THREE.BoxGeometry | null = null;
let gS6SumFrame: THREE.BoxGeometry | null = null;
let gS6SpearShaft:THREE.BoxGeometry | null = null;
let gS6SpearTip: THREE.ConeGeometry | null = null;
let gS6SpearButt:THREE.BoxGeometry | null = null;
// Rzym
let gS6MontBowl: THREE.CylinderGeometry | null = null;
let gS6Cheek:    THREE.BoxGeometry | null = null;
let gS6PlumeRom: THREE.BoxGeometry | null = null;
let gS6Harness:  THREE.BoxGeometry | null = null;
let gS6Phalera:  THREE.BoxGeometry | null = null;
let gS6ScutShell:THREE.BufferGeometry | null = null;
let gS6ScutFace: THREE.BufferGeometry | null = null;
let gS6Umbo:     THREE.BoxGeometry | null = null;
let gS6WingRom:  THREE.BoxGeometry | null = null;
let gS6Wreath:   THREE.CylinderGeometry | null = null;
let gS6Blazon:   THREE.BoxGeometry | null = null;
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
function getGS6Band():    THREE.BoxGeometry { return (gS6Band    ||= new THREE.BoxGeometry(0.150 * HEX_R, 0.028 * HEX_R, 0.148 * HEX_R)); }
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
function getGS6LamBand():  THREE.BoxGeometry { return (gS6LamBand  ||= new THREE.BoxGeometry(0.190 * HEX_R, 0.026 * HEX_R, 0.110 * HEX_R)); }
function getGS6ShldPad():  THREE.BoxGeometry { return (gS6ShldPad  ||= new THREE.BoxGeometry(0.068 * HEX_R, 0.040 * HEX_R, 0.068 * HEX_R)); }
function getGS6Roundel():  THREE.BoxGeometry { return (gS6Roundel  ||= new THREE.BoxGeometry(0.062 * HEX_R, 0.062 * HEX_R, 0.012 * HEX_R)); }
function getGS6Brim():     THREE.CylinderGeometry { return (gS6Brim ||= new THREE.CylinderGeometry(0.104 * HEX_R, 0.112 * HEX_R, 0.022 * HEX_R, 8, 1)); }
function getGS6HelmCone(): THREE.CylinderGeometry { return (gS6HelmCone ||= new THREE.CylinderGeometry(0.036 * HEX_R, 0.078 * HEX_R, 0.070 * HEX_R, 6, 1)); }
function getGS6Spike():    THREE.BoxGeometry { return (gS6Spike    ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.062 * HEX_R, 0.018 * HEX_R)); }
function getGS6GeShaft():  THREE.BoxGeometry { return (gS6GeShaft  ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.660 * HEX_R, 0.018 * HEX_R)); }
function getGS6GeBlade():  THREE.BoxGeometry { return (gS6GeBlade  ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.030 * HEX_R, 0.130 * HEX_R)); }
function getGS6GeSpike():  THREE.BoxGeometry { return (gS6GeSpike  ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.070 * HEX_R, 0.016 * HEX_R)); }
function getGS6Pennon():   THREE.BoxGeometry { return (gS6Pennon   ||= new THREE.BoxGeometry(0.012 * HEX_R, 0.062 * HEX_R, 0.084 * HEX_R)); }
function getGS6PenStripe():THREE.BoxGeometry { return (gS6PenStripe||= new THREE.BoxGeometry(0.012 * HEX_R, 0.012 * HEX_R, 0.070 * HEX_R)); }
function getGS6RectSh():   THREE.BoxGeometry { return (gS6RectSh   ||= new THREE.BoxGeometry(0.132 * HEX_R, 0.204 * HEX_R, 0.016 * HEX_R)); }
function getGS6TigStripe():THREE.BoxGeometry { return (gS6TigStripe||= new THREE.BoxGeometry(0.118 * HEX_R, 0.017 * HEX_R, 0.010 * HEX_R)); }
function getGS6ShBoss():   THREE.BoxGeometry { return (gS6ShBoss   ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.042 * HEX_R, 0.014 * HEX_R)); }
function getGS6Bando():    THREE.BoxGeometry { return (gS6Bando    ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.250 * HEX_R, 0.012 * HEX_R)); }
function getGS6FurHem():   THREE.BoxGeometry { return (gS6FurHem   ||= new THREE.BoxGeometry(0.204 * HEX_R, 0.032 * HEX_R, 0.126 * HEX_R)); }
function getGS6Tuft():     THREE.BoxGeometry { return (gS6Tuft     ||= new THREE.BoxGeometry(0.062 * HEX_R, 0.036 * HEX_R, 0.062 * HEX_R)); }
function getGS6Plume():    THREE.BoxGeometry { return (gS6Plume    ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.130 * HEX_R, 0.012 * HEX_R)); }
function getGS6PlumeTall():THREE.BoxGeometry { return (gS6PlumeTall||= new THREE.BoxGeometry(0.024 * HEX_R, 0.170 * HEX_R, 0.013 * HEX_R)); }
function getGS6Isicoco():  THREE.BoxGeometry { return (gS6Isicoco  ||= new THREE.BoxGeometry(0.140 * HEX_R, 0.026 * HEX_R, 0.138 * HEX_R)); }
function getGS6IklShaft(): THREE.BoxGeometry { return (gS6IklShaft ||= new THREE.BoxGeometry(0.017 * HEX_R, 0.300 * HEX_R, 0.017 * HEX_R)); }
function getGS6IklBlade(): THREE.BoxGeometry { return (gS6IklBlade ||= new THREE.BoxGeometry(0.038 * HEX_R, 0.105 * HEX_R, 0.011 * HEX_R)); }
function getGS6NguniFace():THREE.CylinderGeometry { return (gS6NguniFace ||= new THREE.CylinderGeometry(0.100 * HEX_R, 0.108 * HEX_R, 0.016 * HEX_R, 10, 1)); }
function getGS6NguniSpine():THREE.BoxGeometry { return (gS6NguniSpine ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.430 * HEX_R, 0.014 * HEX_R)); }
function getGS6NguniPatch():THREE.BoxGeometry { return (gS6NguniPatch ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.062 * HEX_R, 0.010 * HEX_R)); }
function getGS6Usech():    THREE.CylinderGeometry { return (gS6Usech ||= new THREE.CylinderGeometry(0.104 * HEX_R, 0.118 * HEX_R, 0.036 * HEX_R, 8, 1)); }
function getGS6NemesHood():THREE.BoxGeometry { return (gS6NemesHood||= new THREE.BoxGeometry(0.164 * HEX_R, 0.126 * HEX_R, 0.158 * HEX_R)); }
function getGS6NemesLap(): THREE.BoxGeometry { return (gS6NemesLap ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.108 * HEX_R, 0.022 * HEX_R)); }
function getGS6NemesStr(): THREE.BoxGeometry { return (gS6NemesStr ||= new THREE.BoxGeometry(0.166 * HEX_R, 0.018 * HEX_R, 0.160 * HEX_R)); }
function getGS6Uraeus():   THREE.BoxGeometry { return (gS6Uraeus   ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.034 * HEX_R, 0.016 * HEX_R)); }
function getGS6KiltStr():  THREE.BoxGeometry { return (gS6KiltStr  ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.070 * HEX_R, 0.012 * HEX_R)); }
function getGS6KhoGrip():  THREE.BoxGeometry { return (gS6KhoGrip  ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.058 * HEX_R, 0.020 * HEX_R)); }
function getGS6KhoShank(): THREE.BoxGeometry { return (gS6KhoShank ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.104 * HEX_R, 0.012 * HEX_R)); }
function getGS6KhoHook():  THREE.BoxGeometry { return (gS6KhoHook  ||= new THREE.BoxGeometry(0.078 * HEX_R, 0.022 * HEX_R, 0.012 * HEX_R)); }
function getGS6KhoTip():   THREE.BoxGeometry { return (gS6KhoTip   ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.040 * HEX_R, 0.012 * HEX_R)); }
function getGS6EgShield(): THREE.BoxGeometry { return (gS6EgShield ||= new THREE.BoxGeometry(0.128 * HEX_R, 0.210 * HEX_R, 0.016 * HEX_R)); }
function getGS6EgShTop():  THREE.BoxGeometry { return (gS6EgShTop  ||= new THREE.BoxGeometry(0.100 * HEX_R, 0.034 * HEX_R, 0.018 * HEX_R)); }
function getGS6SunDisc():  THREE.BoxGeometry { return (gS6SunDisc  ||= new THREE.BoxGeometry(0.048 * HEX_R, 0.048 * HEX_R, 0.012 * HEX_R)); }
function getGS6Wing():     THREE.BoxGeometry { return (gS6Wing     ||= new THREE.BoxGeometry(0.055 * HEX_R, 0.018 * HEX_R, 0.010 * HEX_R)); }
function getGS6MeskDome(): THREE.CylinderGeometry { return (gS6MeskDome ||= new THREE.CylinderGeometry(0.052 * HEX_R, 0.086 * HEX_R, 0.102 * HEX_R, 8, 1)); }
function getGS6MeskBun():  THREE.BoxGeometry { return (gS6MeskBun  ||= new THREE.BoxGeometry(0.052 * HEX_R, 0.040 * HEX_R, 0.036 * HEX_R)); }
function getGS6MeskEar():  THREE.BoxGeometry { return (gS6MeskEar  ||= new THREE.BoxGeometry(0.014 * HEX_R, 0.034 * HEX_R, 0.030 * HEX_R)); }
function getGS6Beard():    THREE.BoxGeometry { return (gS6Beard    ||= new THREE.BoxGeometry(0.092 * HEX_R, 0.056 * HEX_R, 0.028 * HEX_R)); }
function getGS6Toga():     THREE.BoxGeometry { return (gS6Toga     ||= new THREE.BoxGeometry(0.064 * HEX_R, 0.250 * HEX_R, 0.116 * HEX_R)); }
function getGS6WoolTier(): THREE.BoxGeometry { return (gS6WoolTier ||= new THREE.BoxGeometry(0.204 * HEX_R, 0.026 * HEX_R, 0.126 * HEX_R)); }
function getGS6SumSh():    THREE.BoxGeometry { return (gS6SumSh    ||= new THREE.BoxGeometry(0.150 * HEX_R, 0.240 * HEX_R, 0.016 * HEX_R)); }
function getGS6Rosette():  THREE.BoxGeometry { return (gS6Rosette  ||= new THREE.BoxGeometry(0.036 * HEX_R, 0.036 * HEX_R, 0.010 * HEX_R)); }
function getGS6SumFrame(): THREE.BoxGeometry { return (gS6SumFrame ||= new THREE.BoxGeometry(0.150 * HEX_R, 0.020 * HEX_R, 0.018 * HEX_R)); }
function getGS6SpearShaft():THREE.BoxGeometry { return (gS6SpearShaft ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.600 * HEX_R, 0.019 * HEX_R)); }
function getGS6SpearTip(): THREE.ConeGeometry{ return (gS6SpearTip ||= new THREE.ConeGeometry(0.021 * HEX_R, 0.064 * HEX_R, 4)); }
function getGS6SpearButt():THREE.BoxGeometry { return (gS6SpearButt||= new THREE.BoxGeometry(0.024 * HEX_R, 0.040 * HEX_R, 0.024 * HEX_R)); }
function getGS6MontBowl(): THREE.CylinderGeometry { return (gS6MontBowl ||= new THREE.CylinderGeometry(0.050 * HEX_R, 0.093 * HEX_R, 0.092 * HEX_R, 8, 1)); }
function getGS6Cheek():    THREE.BoxGeometry { return (gS6Cheek    ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.052 * HEX_R, 0.044 * HEX_R)); }
function getGS6PlumeRom(): THREE.BoxGeometry { return (gS6PlumeRom ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.118 * HEX_R, 0.013 * HEX_R)); }
function getGS6Harness():  THREE.BoxGeometry { return (gS6Harness  ||= new THREE.BoxGeometry(0.152 * HEX_R, 0.026 * HEX_R, 0.012 * HEX_R)); }
function getGS6Phalera():  THREE.BoxGeometry { return (gS6Phalera  ||= new THREE.BoxGeometry(0.038 * HEX_R, 0.038 * HEX_R, 0.012 * HEX_R)); }
function getGS6Umbo():     THREE.BoxGeometry { return (gS6Umbo     ||= new THREE.BoxGeometry(0.050 * HEX_R, 0.050 * HEX_R, 0.024 * HEX_R)); }
function getGS6WingRom():  THREE.BoxGeometry { return (gS6WingRom  ||= new THREE.BoxGeometry(0.058 * HEX_R, 0.020 * HEX_R, 0.008 * HEX_R)); }
function getGS6Wreath():   THREE.CylinderGeometry { return (gS6Wreath ||= new THREE.CylinderGeometry(0.056 * HEX_R, 0.056 * HEX_R, 0.012 * HEX_R, 8, 1, true)); }
function getGS6Blazon():   THREE.BoxGeometry { return (gS6Blazon   ||= new THREE.BoxGeometry(0.040 * HEX_R, 0.040 * HEX_R, 0.010 * HEX_R)); }
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
// HU BEN WEI / GWARDIA TYGRYSA (Chiny, SUPER braz) — ~488 tri, POZA ATAKU
// Pasowa zbroja lamelkowa (lakier czerwony + czarne pasy), mosiezny helm
// z SZEROKIM RONDEM i szpicem, halabarda GE (klinga poprzeczna + proporzec
// w TYGRYSIE PASKI), tarcza (pole = KOLOR GRACZA) z czarnymi pasami tygrysa,
// zloty tygrysi medalion na piersi, choragiew na plecach.
// ---------------------------------------------------------------------------
export function buildSuperChina(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mLac    = mat(S6_LACQUER, 0.20, 0.48);
  const mBlack  = mat(S6_BLACK,   0.18, 0.55);
  const mBrass  = mat(S6_BRASS,   0.55, 0.35);
  const mGold   = mat(S6_GOLD,    0.58, 0.32);
  const mTiger  = mat(S6_TIGER,   0.30, 0.45);
  const mSteel  = mat(S6_STEEL,   0.55, 0.35);
  const mOwner  = mat(ownerColor_, 0.16, 0.62);
  const mWood   = mat(S6_WOOD,    0.05, 0.85);
  const mWoodD  = mat(S6_WOOD_DK, 0.05, 0.85);

  const HIP_Y = S6_HIP_Y - 0.010 * HEX_R;

  // korpus: tors = lakierowana lamelka + 2 czarne pasy wiazan + naramienniki
  const mSkin = s6Core(group, mat, mLac, S6_SKIN, true);
  for (const dy of [0.058, -0.052]) {
    const b = new THREE.Mesh(getGS6LamBand(), mBlack);
    b.position.set(0, S6_TORSO_CTR + dy * HEX_R, 0.002 * HEX_R);
    group.add(b);
  }
  for (const sx of [-1, 1]) {
    const p = new THREE.Mesh(getGS6ShldPad(), mBlack);
    p.position.set(sx * S6_SHLD_X, S6_TORSO_TOP - 0.004 * HEX_R, 0);
    group.add(p);
  }
  // zloty tygrysi medalion (romb) na piersi
  const rou = new THREE.Mesh(getGS6Roundel(), mTiger);
  rou.rotation.z = Math.PI / 4;
  rou.position.set(0, S6_TORSO_CTR + 0.006 * HEX_R, S6_TORSO_D * 0.5 + 0.010 * HEX_R);
  group.add(rou);
  // czarna spodnica lamelkowa + mosiezny pas
  const skirt = new THREE.Mesh(getGS6Skirt(), mBlack);
  skirt.position.set(0, S6_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const belt = new THREE.Mesh(getGS6Belt(), mBrass);
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);

  // nogi w wykroku (czarne nogawice, lakierowane golenie)
  s6BuildLeg(group,  S6_HIP_X,  0.55,  0.30, mBlack, mLac, mBlack, HIP_Y);
  s6BuildLeg(group, -S6_HIP_X, -0.50, -0.16, mBlack, mLac, mBlack, HIP_Y);

  // HELM: szerokie mosiezne rondo + stozek + lakierowany szpic
  const brim = new THREE.Mesh(getGS6Brim(), mBrass);
  brim.position.set(0, S6_HEAD_CTR + 0.030 * HEX_R, 0);
  group.add(brim);
  const cone = new THREE.Mesh(getGS6HelmCone(), mBrass);
  cone.position.set(0, S6_HEAD_TOP + 0.014 * HEX_R, 0);
  group.add(cone);
  const spk = new THREE.Mesh(getGS6Spike(), mLac);
  spk.position.set(0, S6_HEAD_TOP + 0.076 * HEX_R, 0);
  group.add(spk);

  // PRAWE (-X) RAMIE + HALABARDA GE w pchnieciu (drzewce ku wrogowi,
  // klinga poprzeczna dagger-axe + gorny szpic + tygrysi proporzec)
  const armR = s6BuildArm(group, -S6_SHLD_X, 0.80, 1.38, mLac, mSkin, mSkin);
  const grip = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  const geTh = 0.58;                                  // pochylenie drzewca ku +Z
  const geDir = new THREE.Vector3(0, Math.cos(geTh), Math.sin(geTh));
  const shaft = new THREE.Mesh(getGS6GeShaft(), mWood);
  shaft.rotation.x = -geTh;
  shaft.position.copy(grip.clone().addScaledVector(geDir, 0.066 * HEX_R));
  group.add(shaft);
  const blade = new THREE.Mesh(getGS6GeBlade(), mSteel);   // klinga poprzeczna
  blade.rotation.x = -geTh;
  blade.position.copy(grip.clone().addScaledVector(geDir, 0.360 * HEX_R)
    .add(new THREE.Vector3(0, -Math.sin(geTh) * 0.052, Math.cos(geTh) * 0.052).multiplyScalar(HEX_R)));
  group.add(blade);
  const gspk = new THREE.Mesh(getGS6GeSpike(), mSteel);    // gorny szpic
  gspk.rotation.x = -geTh;
  gspk.position.copy(grip.clone().addScaledVector(geDir, 0.430 * HEX_R));
  group.add(gspk);
  const pen = new THREE.Mesh(getGS6Pennon(), mTiger);      // proporzec tygrysi
  pen.rotation.x = -geTh;
  pen.position.copy(grip.clone().addScaledVector(geDir, 0.300 * HEX_R)
    .add(new THREE.Vector3(0, -Math.sin(geTh) * 0.036, Math.cos(geTh) * 0.036).multiplyScalar(HEX_R)));
  group.add(pen);
  const pst = new THREE.Mesh(getGS6PenStripe(), mBlack);   // czarny pasek tygrysa
  pst.rotation.x = -geTh;
  pst.position.copy(pen.position);
  group.add(pst);

  // LEWE (+X) RAMIE + prostokatna tarcza lakierowa w TYGRYSIE PASKI
  const armL = s6BuildArm(group, S6_SHLD_X, 0.50, 1.10, mLac, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(armL.wrist.x - 0.020 * HEX_R, armL.wrist.y + 0.030 * HEX_R, armL.wrist.z + 0.040 * HEX_R);
  sh.rotation.y = -0.20;
  const face = new THREE.Mesh(getGS6RectSh(), mOwner);     // pole = KOLOR GRACZA
  sh.add(face);
  for (const dy of [0.058, 0.0, -0.058]) {
    const st = new THREE.Mesh(getGS6TigStripe(), mBlack);  // skosne pasy tygrysa
    st.rotation.z = 0.30;
    st.position.set(0, dy * HEX_R, 0.010 * HEX_R);
    sh.add(st);
  }
  group.add(sh);

  s6Banner(group, mWoodD, mOwner, mGold);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// UTHULWANA / BIALE TARCZE (Zulus, SUPER braz) — ~480 tri, POZA ATAKU
// WIELKA BIALA owalna tarcza nguni (isihlangu, znak pulku!) z drewnianym
// grzbietem i 2 czarnymi lgnieciami, iklwa w pchnieciu podrecznym, bogaty
// pioropusz strusi (biale+czarne piora) na czarnym isicoco, futrzane amashoba
// na ramionach, bandolier = KOLOR GRACZA, choragiew na plecach.
// ---------------------------------------------------------------------------
export function buildSuperZulu(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mWhite  = mat(S6_WHITE,   0.03, 0.92);
  const mBlack  = mat(S6_BLACK,   0.05, 0.85);
  const mHide   = mat(S6_HIDE,    0.06, 0.82);
  const mGold   = mat(S6_GOLD,    0.58, 0.32);
  const mSteel  = mat(S6_STEEL,   0.45, 0.42);
  const mOwner  = mat(ownerColor_, 0.12, 0.66);
  const mWood   = mat(0x6b4a26,   0.05, 0.85);
  const mWoodD  = mat(S6_WOOD_DK, 0.05, 0.85);

  const HIP_Y = S6_HIP_Y - 0.012 * HEX_R;   // gleboki wypad harcownika

  // korpus: goly tors (skora Zulu) + bandolier w kolorze gracza
  const mSkin = s6Core(group, mat, mat(S6_SKIN_ZULU, 0.05, 0.80), S6_SKIN_ZULU, true);
  const bando = new THREE.Mesh(getGS6Bando(), mOwner);
  bando.rotation.z = 0.72;
  bando.position.set(0, S6_TORSO_CTR + 0.005 * HEX_R, S6_TORSO_D * 0.5 + 0.006 * HEX_R);
  group.add(bando);
  // kilt ze skory bydlecej + biale futro amashoba na brzegu
  const skirt = new THREE.Mesh(getGS6Skirt(), mHide);
  skirt.position.set(0, S6_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const fur = new THREE.Mesh(getGS6FurHem(), mWhite);
  fur.position.set(0, S6_TORSO_BOT - 0.050 * HEX_R, 0);
  group.add(fur);

  // nogi bose w wypadzie
  s6BuildLeg(group,  S6_HIP_X,  0.58,  0.34, mSkin, mSkin, mSkin, HIP_Y);
  s6BuildLeg(group, -S6_HIP_X, -0.52, -0.20, mSkin, mSkin, mSkin, HIP_Y);

  // ISICOCO (czarny pierscien) + BOGATY pioropusz: 4 rozlozyste + 1 wysokie
  const isi = new THREE.Mesh(getGS6Isicoco(), mBlack);
  isi.position.set(0, S6_HEAD_TOP + 0.008 * HEX_R, 0);
  group.add(isi);
  let pi = 0;
  for (const az of [-0.46, -0.22, 0.22, 0.46]) {
    const tip = (pi === 0 || pi === 3);
    pi++;
    const p = new THREE.Mesh(getGS6Plume(), tip ? mBlack : mWhite);
    p.rotation.z = az;
    p.position.set(Math.sin(az) * 0.055 * HEX_R, S6_HEAD_TOP + 0.078 * HEX_R, -0.012 * HEX_R);
    group.add(p);
  }
  const pc = new THREE.Mesh(getGS6PlumeTall(), mWhite);
  pc.position.set(0, S6_HEAD_TOP + 0.100 * HEX_R, -0.014 * HEX_R);
  group.add(pc);
  const pcTip = new THREE.Mesh(getGS6Finial(), mBlack);     // czarny koniuszek
  pcTip.position.set(0, S6_HEAD_TOP + 0.192 * HEX_R, -0.014 * HEX_R);
  group.add(pcTip);

  // PRAWE (-X) RAMIE + IKLWA w pchnieciu podrecznym (klinga NA OSI przedramienia)
  const armR = s6BuildArm(group, -S6_SHLD_X, 1.12, 1.55, mSkin, mSkin, mSkin);
  const grip = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  const shaft = new THREE.Mesh(getGS6IklShaft(), mWood);
  shaft.rotation.x = Math.PI - 1.55;
  shaft.position.copy(grip.clone().addScaledVector(armR.axis, 0.060 * HEX_R));
  group.add(shaft);
  const blade = new THREE.Mesh(getGS6IklBlade(), mSteel);
  blade.rotation.x = Math.PI - 1.55;
  blade.position.copy(grip.clone().addScaledVector(armR.axis, 0.262 * HEX_R));
  group.add(blade);
  // futrzane amashoba na obu ramionach (nad lokciem)
  for (const [sx, thU] of [[-S6_SHLD_X, 1.12], [S6_SHLD_X, 0.46]] as const) {
    const t = new THREE.Mesh(getGS6Tuft(), mWhite);
    t.rotation.x = Math.PI - thU;
    t.position.set(sx, S6_SHLD_Y, 0).add(s6DirDown(thU).multiplyScalar(S6_UPARM_L * 0.60));
    group.add(t);
  }

  // LEWE (+X) RAMIE + WIELKA BIALA TARCZA NGUNI przed korpusem
  const armL = s6BuildArm(group, S6_SHLD_X, 0.46, 1.08, mSkin, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(armL.wrist.x - 0.030 * HEX_R, armL.wrist.y + 0.058 * HEX_R, armL.wrist.z + 0.050 * HEX_R);
  sh.rotation.y = -0.18;
  const face = new THREE.Mesh(getGS6NguniFace(), mWhite);   // BIALA (nazwa pulku!)
  face.rotation.x = Math.PI / 2;
  face.scale.set(1.0, 1.0, 2.05);                           // owal wysoki isihlangu
  sh.add(face);
  const spine = new THREE.Mesh(getGS6NguniSpine(), mWood);  // drewniany grzbiet
  spine.position.set(0, 0, 0.012 * HEX_R);
  sh.add(spine);
  for (const dy of [0.085, -0.085]) {
    const pt = new THREE.Mesh(getGS6NguniPatch(), mBlack);  // czarne lgniecia
    pt.position.set(0.030 * HEX_R, dy * HEX_R, 0.010 * HEX_R);
    sh.add(pt);
  }
  group.add(sh);

  s6Banner(group, mWoodD, mOwner, mGold);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// MEDZAJ / GWARDIA FARAONA (Egipt, SUPER braz) — ~476 tri, POZA ATAKU
// ZLOTY NEMES w niebieskie pasy z ureuszem, szeroki zloty kolnierz USECH,
// biala tunika i kilt ze zlotym pasem (biel+zloto gwardii), KHOPESH w ciosie
// sponad glowy, biala tarcza o zlotym szczycie ze SKRZYDLATYM SLONCEM,
// choragiew na plecach (kolor gracza = flaga, jak stary token).
// ---------------------------------------------------------------------------
export function buildSuperEgypt(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mLinen  = mat(S6_LINEN,   0.05, 0.82);
  const mGold   = mat(S6_GOLD,    0.58, 0.32);
  const mBlue   = mat(S6_WOAD,    0.10, 0.66);
  const mBronze = mat(S6_BRONZE,  0.42, 0.42);
  const mOwner  = mat(ownerColor_, 0.16, 0.62);
  const mWood   = mat(S6_WOOD,    0.05, 0.85);
  const mWoodD  = mat(S6_WOOD_DK, 0.05, 0.85);

  const HIP_Y = S6_HIP_Y - 0.010 * HEX_R;

  // korpus: biala tunika + zloty kolnierz usech na barkach
  const mSkin = s6Core(group, mat, mLinen, S6_SKIN, true);
  const usech = new THREE.Mesh(getGS6Usech(), mGold);
  usech.position.set(0, S6_TORSO_TOP - 0.006 * HEX_R, 0);
  group.add(usech);
  // kilt: spodnica lniana + zloty pas + zloty pionowy pas przodu
  const skirt = new THREE.Mesh(getGS6Skirt(), mLinen);
  skirt.position.set(0, S6_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const belt = new THREE.Mesh(getGS6Belt(), mGold);
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);
  const kstr = new THREE.Mesh(getGS6KiltStr(), mGold);
  kstr.position.set(0, S6_TORSO_BOT - 0.028 * HEX_R, 0.062 * HEX_R);
  group.add(kstr);

  // nogi bose w wykroku
  s6BuildLeg(group,  S6_HIP_X,  0.55,  0.30, mLinen, mSkin, mSkin, HIP_Y);
  s6BuildLeg(group, -S6_HIP_X, -0.50, -0.16, mLinen, mSkin, mSkin, HIP_Y);

  // ZLOTY NEMES: kaptur + 2 niebieskie pasy + naramienne klapy + ureusz
  const hood = new THREE.Mesh(getGS6NemesHood(), mGold);
  hood.position.set(0, S6_HEAD_CTR + 0.020 * HEX_R, -0.006 * HEX_R);
  group.add(hood);
  for (const dy of [0.052, 0.016]) {
    const st = new THREE.Mesh(getGS6NemesStr(), mBlue);
    st.position.set(0, S6_HEAD_CTR + dy * HEX_R, -0.006 * HEX_R);
    group.add(st);
  }
  for (const sx of [-1, 1]) {
    const lap = new THREE.Mesh(getGS6NemesLap(), mGold);
    lap.position.set(sx * (S6_HEAD_S * 0.5 + 0.016 * HEX_R), S6_HEAD_CTR - 0.046 * HEX_R, 0.028 * HEX_R);
    group.add(lap);
  }
  const ura = new THREE.Mesh(getGS6Uraeus(), mGold);
  ura.position.set(0, S6_HEAD_CTR + 0.052 * HEX_R, 0.082 * HEX_R);
  group.add(ura);

  // PRAWE (-X) RAMIE + KHOPESH w ciosie sponad glowy (sierp w przod-gore)
  const armR = s6BuildArm(group, -S6_SHLD_X, -2.12, 2.02, mLinen, mSkin, mSkin);
  const kg = new THREE.Group();                       // khopesh na osi przedramienia
  kg.position.copy(armR.wrist.clone().addScaledVector(armR.axis, 0.020 * HEX_R));
  kg.rotation.x = Math.PI - 2.02;
  const grip = new THREE.Mesh(getGS6KhoGrip(), mWood);
  grip.position.set(0, 0.020 * HEX_R, 0);
  kg.add(grip);
  const shank = new THREE.Mesh(getGS6KhoShank(), mBronze);
  shank.position.set(0, 0.098 * HEX_R, 0);
  kg.add(shank);
  const hook = new THREE.Mesh(getGS6KhoHook(), mBronze);   // sierpowy luk
  hook.rotation.z = -0.62;
  hook.position.set(0.030 * HEX_R, 0.166 * HEX_R, 0);
  kg.add(hook);
  const ktip = new THREE.Mesh(getGS6KhoTip(), mBronze);
  ktip.rotation.z = -1.10;
  ktip.position.set(0.066 * HEX_R, 0.190 * HEX_R, 0);
  kg.add(ktip);
  group.add(kg);

  // LEWE (+X) RAMIE + tarcza gwardii: biel + zloty szczyt + SKRZYDLATE SLONCE
  const armL = s6BuildArm(group, S6_SHLD_X, 0.52, 1.10, mLinen, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(armL.wrist.x - 0.020 * HEX_R, armL.wrist.y + 0.032 * HEX_R, armL.wrist.z + 0.040 * HEX_R);
  sh.rotation.y = -0.20;
  const face = new THREE.Mesh(getGS6EgShield(), mLinen);
  sh.add(face);
  const top = new THREE.Mesh(getGS6EgShTop(), mGold);      // zloty luk szczytu
  top.position.set(0, 0.100 * HEX_R, 0);
  sh.add(top);
  const sun = new THREE.Mesh(getGS6SunDisc(), mGold);      // slonce (romb zloty)
  sun.rotation.z = Math.PI / 4;
  sun.position.set(0, 0.012 * HEX_R, 0.010 * HEX_R);
  sh.add(sun);
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(getGS6Wing(), mGold);         // skrzydla slonca
    w.rotation.z = s * 0.42;
    w.position.set(s * 0.048 * HEX_R, 0.026 * HEX_R, 0.010 * HEX_R);
    sh.add(w);
  }
  group.add(sh);

  s6Banner(group, mWoodD, mOwner, mGold);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// GWARDIA KROLEWSKA SUMERU (Sumer, SUPER braz) — ~484 tri, POZA ATAKU
// ZLOTY HELM typu MESKALAMDUG (kuty kok z tylu + uszy!), czarna broda,
// krolewski KAUNAKES (3 rzedy runa na spodnicy) + morska toga przez ramie,
// WIELKA prostokatna tarcza (pole = KOLOR GRACZA) z 3 ZLOTYMI ROZETAMI
// i miedziana rama, wlocznia w pchnieciu podrecznym, choragiew na plecach.
// ---------------------------------------------------------------------------
export function buildSuperSumer(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mWool   = mat(S6_WOOL,     0.05, 0.85);
  const mTeal   = mat(S6_TEAL,     0.06, 0.80);
  const mGold   = mat(S6_GOLD,     0.58, 0.32);
  const mCopper = mat(S6_COPPER,   0.45, 0.40);
  const mCopL   = mat(0xc8843e,    0.55, 0.32);
  const mBlack  = mat(S6_BLACK,    0.05, 0.85);
  const mOwner  = mat(ownerColor_, 0.16, 0.62);
  const mWood   = mat(S6_WOOD,     0.05, 0.85);
  const mWoodD  = mat(S6_WOOD_DK,  0.05, 0.85);

  const HIP_Y = S6_HIP_Y - 0.010 * HEX_R;

  // korpus: welniana tunika + morska toga kaunakes skosem przez tors
  const mSkin = s6Core(group, mat, mWool, S6_SKIN, true);
  const toga = new THREE.Mesh(getGS6Toga(), mTeal);
  toga.rotation.z = 0.62;
  toga.position.set(0.012 * HEX_R, S6_TORSO_CTR + 0.012 * HEX_R, 0.002 * HEX_R);
  group.add(toga);
  // KAUNAKES: spodnica + 3 zwisajace rzedy runa + miedziany pas
  const skirt = new THREE.Mesh(getGS6Skirt(), mWool);
  skirt.position.set(0, S6_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  let wi = 0;
  for (const dy of [-0.006, -0.036, -0.066]) {
    const t = new THREE.Mesh(getGS6WoolTier(), (wi++ % 2 === 0) ? mWool : mat(0xc9b894, 0.05, 0.85));
    t.position.set(0, S6_TORSO_BOT + dy * HEX_R, 0);
    group.add(t);
  }
  const belt = new THREE.Mesh(getGS6Belt(), mCopper);
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);

  // nogi w wykroku
  s6BuildLeg(group,  S6_HIP_X,  0.52,  0.28, mWool, mSkin, mSkin, HIP_Y);
  s6BuildLeg(group, -S6_HIP_X, -0.48, -0.15, mWool, mSkin, mSkin, HIP_Y);

  // ZLOTY HELM MESKALAMDUG: dzwon + kok z tylu + kute uszy + czarna broda
  const dome = new THREE.Mesh(getGS6MeskDome(), mGold);
  dome.position.set(0, S6_HEAD_CTR + 0.026 * HEX_R, 0);
  group.add(dome);
  const bun = new THREE.Mesh(getGS6MeskBun(), mGold);
  bun.position.set(0, S6_HEAD_CTR + 0.052 * HEX_R, -(S6_HEAD_S * 0.5 + 0.014 * HEX_R));
  group.add(bun);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(getGS6MeskEar(), mGold);
    ear.position.set(sx * (S6_HEAD_S * 0.5 + 0.006 * HEX_R), S6_HEAD_CTR + 0.002 * HEX_R, 0.010 * HEX_R);
    group.add(ear);
  }
  const beard = new THREE.Mesh(getGS6Beard(), mBlack);
  beard.position.set(0, S6_HEAD_CTR - 0.068 * HEX_R, 0.052 * HEX_R);
  group.add(beard);

  // PRAWE (-X) RAMIE + WLOCZNIA podrecznie (grot w przod, tylec za plecami)
  const armR = s6BuildArm(group, -S6_SHLD_X, 0.85, 1.45, mWool, mSkin, mSkin);
  const grip = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  const spAxis = armR.axis.clone();
  const shaft = new THREE.Mesh(getGS6SpearShaft(), mWood);
  shaft.rotation.x = Math.PI - 1.45;
  shaft.position.copy(grip.clone().addScaledVector(spAxis, 0.100 * HEX_R));
  group.add(shaft);
  const tip = new THREE.Mesh(getGS6SpearTip(), mCopL);
  tip.rotation.x = Math.PI - 1.45;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(grip.clone().addScaledVector(spAxis, 0.430 * HEX_R));
  group.add(tip);
  const butt = new THREE.Mesh(getGS6SpearButt(), mCopper);
  butt.rotation.x = Math.PI - 1.45;
  butt.position.copy(grip.clone().addScaledVector(spAxis, -0.220 * HEX_R));
  group.add(butt);

  // LEWE (+X) RAMIE + WIELKA TARCZA z rozetami przed korpusem
  const armL = s6BuildArm(group, S6_SHLD_X, 0.48, 1.02, mWool, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(armL.wrist.x - 0.022 * HEX_R, armL.wrist.y + 0.045 * HEX_R, armL.wrist.z + 0.042 * HEX_R);
  sh.rotation.y = -0.18;
  const face = new THREE.Mesh(getGS6SumSh(), mOwner);      // pole = KOLOR GRACZA
  sh.add(face);
  for (const dy of [0.078, 0.0, -0.078]) {
    const ro = new THREE.Mesh(getGS6Rosette(), mGold);     // 3 zlote rozety
    ro.rotation.z = Math.PI / 4;
    ro.position.set(0, dy * HEX_R, 0.010 * HEX_R);
    sh.add(ro);
  }
  for (const dy of [0.110, -0.110]) {
    const fr = new THREE.Mesh(getGS6SumFrame(), mCopL);    // miedziana rama
    fr.position.set(0, dy * HEX_R, 0.008 * HEX_R);
    sh.add(fr);
  }
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
