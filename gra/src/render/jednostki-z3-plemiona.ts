/**
 * jednostki-z3-plemiona.ts — SERIA Z3: PLEMIONA (4 jednostki, ZELAZO)
 * (seria render-jednostki; wzorzec anatomii: hastati-falangita.ts KOREKTA v2,
 *  bratni wzorzec Impi: jednostki-p57-wlocznie-machiny.ts,
 *  konwencja SUPERA: jednostki-p6-super.ts — choragiew-znacznik NA PLECACH)
 * ---------------------------------------------------------------------------
 * Zamienniki dla tokenow z gra/src/render/units.ts:
 *   buildDruzynnik(ownerColor)        -> NOWY case w buildNamedUnit ('druzynnik');
 *                                        dzis: kategoria 'miecznik' (GENERYK kamienny)
 *   buildIButho(ownerColor)           -> NOWY case w buildNamedUnit ('ibutho' / 'butho');
 *                                        dzis: kategoria 'wlocznik' (GENERYK kamienny)
 *   buildMiecznikGalijski(ownerColor) -> NOWY case w buildNamedUnit ('miecznik galijski'
 *                                        / 'gallic swordsman'); dzis: GENERYK miecznika
 *   buildGermanSuper(ownerColor)      -> NOWY case w buildSuperUnit: kultura 'germanie'
 *                                        (do dodania w cultureFromName: 'germansk'/
 *                                        'germanie'/'germanic'); dzis: cultureFromName
 *                                        zwraca 'neutral' -> default -> generyczny
 *                                        royal guard (buildCategoryModel('super')),
 *                                        wiec buildNamedUnit NIGDY nie jest pytany
 *                                        i buildGermanWarrior (stary framea-model)
 *                                        jest omijany routingiem.
 * Interfejs i konwencje BEZ ZMIAN (seria):
 *   - figurka PRZODEM do +Z, stopy na y = 0, uklad prawoskretny => LEWA = +X,
 *     PRAWA = -X; TARCZA na LEWYM (+X) przedramieniu, BRON w PRAWEJ (-X) dloni
 *     NA OSI przedramienia; POZY ATAKU (wykrok, biodra obnizone);
 *   - NAKRYCIE GLOWY na kazdej glowie; KOLOR GRACZA na polu tarczy (Druzynnik,
 *     Galij, German-super) / klapie spodnicy + rombie tarczy (iButho) +
 *     choragiew na plecach u SUPERA;
 *   - group.userData['mats'] i ['perTokenGeos'] jak w units.ts; geometrie
 *     wspolne = singletony modulu (perTokenGeos puste).
 *
 * CHARAKTERY (rodziny plemienne — spojnosc z bespoke krewnymi z units.ts):
 *   DRUZYNNIK (Slowianie): wczesnoslowianski wojownik druzyny ksiazecej —
 *     helm STOZKOWY z NOSALEM (typ czarnomogilski, stal + brazowe okucie),
 *     lniana rubacha + skorzany kaftan, WASY (bez brody), okragla tarcza
 *     z UMBEM i deskami PROMIENISTYMI (pole = kolor gracza), miecz w pchnieciu.
 *   iBUTHO Z IKLWA (Zulusi): ZELAZNY BRAT Impi (P57) — ta sama anatomia
 *     i rynsztunek, ale wieksza dyscyplina: tarcza nguni CIEMNA
 *     (brazowo-czarna laciata), WYZSZY pioropusz (3 piora + czub),
 *     NASZYJNIK KLOW na rzemieniu, amashoba tylko na ramionach.
 *   WOJOWNIK GERMANSKI (SUPER, Germanie): potezny wodz — GOLY TORS z pasem
 *     skory na krzyz, FUTRO na ramionach (rodzina Berserkera: ta sama paleta
 *     skor), helm ZELAZNY prosty z FUTRZANYM OTOKIEM (bez rogow!), RUDA
 *     PLECIONA BRODA, dlugi ZELAZNY miecz w ciosie znad glowy, tarcza okragla
 *     ze SPIRALA, choragiew supera na plecach.
 *   MIECZNIK GALIJSKI (Celtowie): rodzina buildCeltWarrior/Gaesatae — rude
 *     dlugie wlosy + WASY, TORQUES na szyi, helm montefortino-celtycki z kita,
 *     tarcza OWALNA z motywem TRISKELION, dlugi miecz celtycki, BRACCAE
 *     W KRATE (klockowa krata: rdzawe nogawice + pasy ochra/urzet).
 * Budzet: <= ~460 tri (super <= ~490); zob. liczby przy builderach.
 */

import * as THREE from 'three';
import { HEX_R } from './hexutil.ts';

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

// ── kolory serii (paleta units.ts + rodziny plemienne) ──────────────────────
const TR_SKIN       = 0xe0ac69;
const TR_SKIN_ZULU  = 0xb06030;   // jak Impi (P57)
const TR_STEEL      = 0xc2cad2;
const TR_IRON_DK    = 0x5a5e66;   // zelazo ciemne (spirala, okucia)
const TR_BRONZE     = 0xcf9234;
const TR_BRONZE_LT  = 0xd0a050;
const TR_GOLD       = 0xd8b040;
const TR_WOOD       = 0x7a5c3a;
const TR_LEATHER    = 0x6b4a28;
const TR_LINEN      = 0xe8e0c8;   // rubacha Druzynnika
const TR_WOOL_DK    = 0x4a3a2e;   // nogawice Druzynnika
const TR_HAIR_SLAV  = 0xa07840;   // ciemnoblond wasy Druzynnika
const TR_HAIR_CELT  = 0xb8702a;   // rude wlosy (jak buildCeltWarrior)
const TR_HAIR_GER   = 0xb0562a;   // RUDA broda pleciona (German-super)
const TR_FUR        = 0x5a3c20;   // futro (rodzina Impi/Berserker)
const TR_FUR_LT     = 0x7a5230;
const TR_PELT       = 0x5a4630;   // ciemne futro Berserkera (rodzina Germanow)
const TR_BURGUNDY   = 0x7a3040;   // tunika galijska (rodzina CeltWarrior)
const TR_BRACCAE    = 0x8a4a2e;   // rdzawe braccae
const TR_OCHRE      = 0xc89040;   // pas kraty
const TR_WOAD       = 0x2f5aa0;   // pas kraty (urzet)
const TR_HIDE_DK    = 0x3a2a1e;   // ciemna siersc nguni iButho
const TR_BLACK      = 0x171310;
const TR_IVORY      = 0xe8ddc4;   // kly naszyjnika
const TR_CRANE_WHT  = 0xf0ece0;

// ── wymiary sylwetki (rodzina NI_*/WM_* z hastati-falangita.ts) ─────────────
const TR_HIP_Y     = 0.208 * HEX_R;
const TR_TORSO_W   = 0.180 * HEX_R;
const TR_TORSO_H   = 0.205 * HEX_R;
const TR_TORSO_D   = 0.100 * HEX_R;
const TR_TORSO_BOT = 0.240 * HEX_R;
const TR_TORSO_CTR = TR_TORSO_BOT + TR_TORSO_H * 0.5;
const TR_TORSO_TOP = TR_TORSO_BOT + TR_TORSO_H;
const TR_NECK_H    = 0.028 * HEX_R;
const TR_HEAD_S    = 0.128 * HEX_R;
const TR_HEAD_CTR  = TR_TORSO_TOP + TR_NECK_H + TR_HEAD_S * 0.5;
const TR_HEAD_TOP  = TR_TORSO_TOP + TR_NECK_H + TR_HEAD_S;
const TR_SHLD_X    = TR_TORSO_W * 0.5 + 0.030 * HEX_R;
const TR_SHLD_Y    = TR_TORSO_TOP - 0.024 * HEX_R;
const TR_HIP_X     = 0.052 * HEX_R;

const TR_THIGH_L   = 0.104 * HEX_R;
const TR_SHIN_L    = 0.096 * HEX_R;
const TR_UPARM_L   = 0.100 * HEX_R;
const TR_FOREARM_L = 0.092 * HEX_R;

// ── geometrie-singletony ────────────────────────────────────────────────────
let gTRTorso:   THREE.BoxGeometry | null = null;
let gTRNeck:    THREE.BoxGeometry | null = null;
let gTRHead:    THREE.BoxGeometry | null = null;
let gTRThigh:   THREE.BoxGeometry | null = null;
let gTRShin:    THREE.BoxGeometry | null = null;
let gTRFoot:    THREE.BoxGeometry | null = null;
let gTRUpArm:   THREE.BoxGeometry | null = null;
let gTRForearm: THREE.BoxGeometry | null = null;
let gTRFist:    THREE.BoxGeometry | null = null;
let gTRSkirt:   THREE.BoxGeometry | null = null;
let gTRBelt:    THREE.BoxGeometry | null = null;
let gTRWasy:    THREE.BoxGeometry | null = null;   // klocek wasa (x2, pochylone)
let gTRHairBk:  THREE.BoxGeometry | null = null;   // wlosy z tylu glowy
// Druzynnik
let gTRKaftan:  THREE.BoxGeometry | null = null;   // skorzany kaftan (naklad na tors)
let gTRConeHelm:THREE.CylinderGeometry | null = null;  // stozek czarnomogilski (8-kat)
let gTRNosal:   THREE.BoxGeometry | null = null;
let gTRHelmRim: THREE.BoxGeometry | null = null;   // brazowe okucie dolu helmu
let gTRRndFace: THREE.CylinderGeometry | null = null;  // pole okraglej tarczy (10-kat)
let gTRRndRim:  THREE.CylinderGeometry | null = null;  // rant (otwarty)
let gTRPlank:   THREE.BoxGeometry | null = null;   // deska promienista
let gTRUmbo:    THREE.ConeGeometry | null = null;      // umbo (6-kat, kopulka)
let gTRBlade:   THREE.BoxGeometry | null = null;   // krotszy miecz Druzynnika
let gTRBladeTip:THREE.ConeGeometry | null = null;
let gTRGuard:   THREE.BoxGeometry | null = null;
let gTRPommel:  THREE.BoxGeometry | null = null;
// iButho (rodzina Impi z P57 — te same proporcje geometrii)
let gTRShoba:   THREE.BoxGeometry | null = null;
let gTRIsicoco: THREE.CylinderGeometry | null = null;
let gTRFeather: THREE.BoxGeometry | null = null;   // WYZSZE pioro (0.150)
let gTRFringe:  THREE.BoxGeometry | null = null;
let gTRNeckBand:THREE.BoxGeometry | null = null;   // rzemien naszyjnika
let gTRTooth:   THREE.ConeGeometry | null = null;  // kiel (x3, ostrzem w dol)
let gTRPatchBig:THREE.BoxGeometry | null = null;
let gTRPatchSm: THREE.BoxGeometry | null = null;
let gTRMgobo:   THREE.BoxGeometry | null = null;
let gTRMgoboTuft:THREE.BoxGeometry | null = null;
let gTRDiamond: THREE.BoxGeometry | null = null;
let gTRIklwaShaft: THREE.BoxGeometry | null = null;
let gTRIklwaBlade: THREE.BoxGeometry | null = null;
let gTRIklwaTip:   THREE.ConeGeometry | null = null;
let gTRNguniShell: THREE.BufferGeometry | null = null;
let gTRNguniFace:  THREE.BufferGeometry | null = null;
// German super
let gTRDomeHelm: THREE.CylinderGeometry | null = null; // prosty zelazny dzwon (8-kat)
let gTRFurBand:  THREE.CylinderGeometry | null = null; // futrzany otok (otwarty)
let gTRFurPad:   THREE.BoxGeometry | null = null;      // futro na ramieniu
let gTRStrap:    THREE.BoxGeometry | null = null;      // pas skory przez piers
let gTRBeard:    THREE.BoxGeometry | null = null;      // broda glowna
let gTRBraid:    THREE.BoxGeometry | null = null;      // pleciony warkocz brody
let gTRLongBlade:THREE.BoxGeometry | null = null;      // DLUGI miecz (German/Galij)
let gTRSpiralArm:THREE.BoxGeometry | null = null;      // ramie spirali (x3)
let gTRPole:     THREE.BoxGeometry | null = null;      // choragiew supera (P6)
let gTRFlag:     THREE.BoxGeometry | null = null;
let gTRFinial:   THREE.BoxGeometry | null = null;
// Miecznik galijski
let gTRMontBowl: THREE.CylinderGeometry | null = null; // montefortino (8-kat)
let gTRKita:     THREE.BoxGeometry | null = null;
let gTRTorc:     THREE.CylinderGeometry | null = null; // torques (otwarty 6-kat)
let gTRHairSd:   THREE.BoxGeometry | null = null;      // wlosy na boki
let gTRBand:     THREE.BoxGeometry | null = null;      // pas kraty poziomy (uda)
let gTRPion:     THREE.BoxGeometry | null = null;      // pas kraty pionowy
let gTRTriArm:   THREE.BoxGeometry | null = null;      // ramie triskelionu (x3)
let gTROvalShell:THREE.BufferGeometry | null = null;   // owalna tarcza galijska
let gTROvalFace: THREE.BufferGeometry | null = null;

function getGTRTorso():   THREE.BoxGeometry { return (gTRTorso   ||= new THREE.BoxGeometry(TR_TORSO_W, TR_TORSO_H, TR_TORSO_D)); }
function getGTRNeck():    THREE.BoxGeometry { return (gTRNeck    ||= new THREE.BoxGeometry(0.042 * HEX_R, TR_NECK_H * 1.6, 0.042 * HEX_R)); }
function getGTRHead():    THREE.BoxGeometry { return (gTRHead    ||= new THREE.BoxGeometry(TR_HEAD_S, TR_HEAD_S, TR_HEAD_S)); }
function getGTRThigh():   THREE.BoxGeometry { return (gTRThigh   ||= new THREE.BoxGeometry(0.056 * HEX_R, TR_THIGH_L, 0.060 * HEX_R)); }
function getGTRShin():    THREE.BoxGeometry { return (gTRShin    ||= new THREE.BoxGeometry(0.038 * HEX_R, TR_SHIN_L, 0.042 * HEX_R)); }
function getGTRFoot():    THREE.BoxGeometry { return (gTRFoot    ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)); }
function getGTRUpArm():   THREE.BoxGeometry { return (gTRUpArm   ||= new THREE.BoxGeometry(0.054 * HEX_R, TR_UPARM_L, 0.054 * HEX_R)); }
function getGTRForearm(): THREE.BoxGeometry { return (gTRForearm ||= new THREE.BoxGeometry(0.040 * HEX_R, TR_FOREARM_L, 0.040 * HEX_R)); }
function getGTRFist():    THREE.BoxGeometry { return (gTRFist    ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)); }
function getGTRSkirt():   THREE.BoxGeometry { return (gTRSkirt   ||= new THREE.BoxGeometry(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)); }
function getGTRBelt():    THREE.BoxGeometry { return (gTRBelt    ||= new THREE.BoxGeometry(0.190 * HEX_R, 0.034 * HEX_R, 0.112 * HEX_R)); }
function getGTRWasy():    THREE.BoxGeometry { return (gTRWasy    ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.052 * HEX_R, 0.016 * HEX_R)); }
function getGTRHairBk():  THREE.BoxGeometry { return (gTRHairBk  ||= new THREE.BoxGeometry(0.120 * HEX_R, 0.110 * HEX_R, 0.030 * HEX_R)); }
function getGTRKaftan():  THREE.BoxGeometry { return (gTRKaftan  ||= new THREE.BoxGeometry(0.192 * HEX_R, 0.150 * HEX_R, 0.114 * HEX_R)); }
function getGTRConeHelm():THREE.CylinderGeometry { return (gTRConeHelm ||= new THREE.CylinderGeometry(0.014 * HEX_R, 0.088 * HEX_R, 0.130 * HEX_R, 8, 1)); }
function getGTRNosal():   THREE.BoxGeometry { return (gTRNosal   ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.060 * HEX_R, 0.016 * HEX_R)); }
function getGTRHelmRim(): THREE.BoxGeometry { return (gTRHelmRim ||= new THREE.BoxGeometry(0.150 * HEX_R, 0.018 * HEX_R, 0.150 * HEX_R)); }
function getGTRRndFace(): THREE.CylinderGeometry { return (gTRRndFace ||= new THREE.CylinderGeometry(0.148 * HEX_R, 0.120 * HEX_R, 0.026 * HEX_R, 8, 1)); }
function getGTRRndRim():  THREE.CylinderGeometry { return (gTRRndRim  ||= new THREE.CylinderGeometry(0.158 * HEX_R, 0.158 * HEX_R, 0.018 * HEX_R, 8, 1, true)); }
function getGTRPlank():   THREE.BoxGeometry { return (gTRPlank   ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.270 * HEX_R, 0.010 * HEX_R)); }
function getGTRUmbo():    THREE.ConeGeometry { return (gTRUmbo ||= new THREE.ConeGeometry(0.040 * HEX_R, 0.034 * HEX_R, 6)); }
function getGTRBlade():   THREE.BoxGeometry { return (gTRBlade   ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.150 * HEX_R, 0.014 * HEX_R)); }
function getGTRBladeTip():THREE.ConeGeometry{ return (gTRBladeTip||= new THREE.ConeGeometry(0.016 * HEX_R, 0.042 * HEX_R, 4)); }
function getGTRGuard():   THREE.BoxGeometry { return (gTRGuard   ||= new THREE.BoxGeometry(0.056 * HEX_R, 0.018 * HEX_R, 0.024 * HEX_R)); }
function getGTRPommel():  THREE.BoxGeometry { return (gTRPommel  ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.024 * HEX_R, 0.024 * HEX_R)); }
function getGTRShoba():   THREE.BoxGeometry { return (gTRShoba   ||= new THREE.BoxGeometry(0.062 * HEX_R, 0.046 * HEX_R, 0.062 * HEX_R)); }
function getGTRIsicoco(): THREE.CylinderGeometry { return (gTRIsicoco ||= new THREE.CylinderGeometry(0.052 * HEX_R, 0.058 * HEX_R, 0.026 * HEX_R, 8, 1, true)); }
function getGTRFeather(): THREE.BoxGeometry { return (gTRFeather ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.170 * HEX_R, 0.010 * HEX_R)); }
function getGTRFringe():  THREE.BoxGeometry { return (gTRFringe  ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.052 * HEX_R, 0.014 * HEX_R)); }
function getGTRNeckBand():THREE.BoxGeometry { return (gTRNeckBand||= new THREE.BoxGeometry(0.150 * HEX_R, 0.020 * HEX_R, 0.085 * HEX_R)); }
function getGTRTooth():   THREE.ConeGeometry{ return (gTRTooth   ||= new THREE.ConeGeometry(0.012 * HEX_R, 0.036 * HEX_R, 4)); }
function getGTRPatchBig():THREE.BoxGeometry { return (gTRPatchBig||= new THREE.BoxGeometry(0.052 * HEX_R, 0.088 * HEX_R, 0.010 * HEX_R)); }
function getGTRPatchSm(): THREE.BoxGeometry { return (gTRPatchSm ||= new THREE.BoxGeometry(0.040 * HEX_R, 0.052 * HEX_R, 0.010 * HEX_R)); }
function getGTRMgobo():   THREE.BoxGeometry { return (gTRMgobo   ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.500 * HEX_R, 0.016 * HEX_R)); }
function getGTRMgoboTuft():THREE.BoxGeometry{ return (gTRMgoboTuft||= new THREE.BoxGeometry(0.026 * HEX_R, 0.052 * HEX_R, 0.026 * HEX_R)); }
function getGTRDiamond(): THREE.BoxGeometry { return (gTRDiamond ||= new THREE.BoxGeometry(0.040 * HEX_R, 0.040 * HEX_R, 0.010 * HEX_R)); }
function getGTRIklwaShaft(): THREE.BoxGeometry { return (gTRIklwaShaft ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.240 * HEX_R, 0.018 * HEX_R)); }
function getGTRIklwaBlade(): THREE.BoxGeometry { return (gTRIklwaBlade ||= new THREE.BoxGeometry(0.036 * HEX_R, 0.090 * HEX_R, 0.012 * HEX_R)); }
function getGTRIklwaTip(): THREE.ConeGeometry { return (gTRIklwaTip ||= new THREE.ConeGeometry(0.016 * HEX_R, 0.044 * HEX_R, 4)); }
function getGTRDomeHelm(): THREE.CylinderGeometry { return (gTRDomeHelm ||= new THREE.CylinderGeometry(0.052 * HEX_R, 0.090 * HEX_R, 0.096 * HEX_R, 8, 1)); }
function getGTRFurBand():  THREE.CylinderGeometry { return (gTRFurBand  ||= new THREE.CylinderGeometry(0.096 * HEX_R, 0.100 * HEX_R, 0.040 * HEX_R, 8, 1, true)); }
function getGTRFurPad():   THREE.BoxGeometry { return (gTRFurPad  ||= new THREE.BoxGeometry(0.084 * HEX_R, 0.048 * HEX_R, 0.108 * HEX_R)); }
function getGTRStrap():    THREE.BoxGeometry { return (gTRStrap   ||= new THREE.BoxGeometry(0.034 * HEX_R, 0.220 * HEX_R, 0.012 * HEX_R)); }
function getGTRBeard():    THREE.BoxGeometry { return (gTRBeard   ||= new THREE.BoxGeometry(0.096 * HEX_R, 0.070 * HEX_R, 0.030 * HEX_R)); }
function getGTRBraid():    THREE.BoxGeometry { return (gTRBraid   ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.070 * HEX_R, 0.020 * HEX_R)); }
function getGTRLongBlade():THREE.BoxGeometry { return (gTRLongBlade||= new THREE.BoxGeometry(0.026 * HEX_R, 0.210 * HEX_R, 0.013 * HEX_R)); }
function getGTRSpiralArm():THREE.BoxGeometry { return (gTRSpiralArm||= new THREE.BoxGeometry(0.062 * HEX_R, 0.020 * HEX_R, 0.010 * HEX_R)); }
function getGTRPole():     THREE.BoxGeometry { return (gTRPole    ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.500 * HEX_R, 0.016 * HEX_R)); }
function getGTRFlag():     THREE.BoxGeometry { return (gTRFlag    ||= new THREE.BoxGeometry(0.085 * HEX_R, 0.062 * HEX_R, 0.008 * HEX_R)); }
function getGTRFinial():   THREE.BoxGeometry { return (gTRFinial  ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.024 * HEX_R, 0.024 * HEX_R)); }
function getGTRMontBowl(): THREE.CylinderGeometry { return (gTRMontBowl ||= new THREE.CylinderGeometry(0.050 * HEX_R, 0.093 * HEX_R, 0.092 * HEX_R, 8, 1)); }
function getGTRKita():     THREE.BoxGeometry { return (gTRKita    ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.092 * HEX_R, 0.026 * HEX_R)); }
function getGTRTorc():     THREE.CylinderGeometry { return (gTRTorc ||= new THREE.CylinderGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.018 * HEX_R, 6, 1, true)); }
function getGTRHairSd():   THREE.BoxGeometry { return (gTRHairSd  ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.090 * HEX_R, 0.070 * HEX_R)); }
function getGTRBand():     THREE.BoxGeometry { return (gTRBand    ||= new THREE.BoxGeometry(0.062 * HEX_R, 0.020 * HEX_R, 0.066 * HEX_R)); }
function getGTRPion():     THREE.BoxGeometry { return (gTRPion    ||= new THREE.BoxGeometry(0.014 * HEX_R, 0.096 * HEX_R, 0.012 * HEX_R)); }
function getGTRTriArm():   THREE.BoxGeometry { return (gTRTriArm  ||= new THREE.BoxGeometry(0.056 * HEX_R, 0.018 * HEX_R, 0.010 * HEX_R)); }

// ── owalna skorupa (fasetowany obrys elipsy; jak NI_/WM_ w wzorcach) ────────
function trOvalRing(a: number, b: number, c: number, N: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(ang) * a, y = Math.sin(ang) * b;
    pts.push([x, y, -c * (x / a) * (x / a)]);
  }
  return pts;
}
function trOvalShell(a: number, b: number, c: number, t: number, N: number): THREE.BufferGeometry {
  const ring = trOvalRing(a, b, c, N);
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
function trOvalFace(a: number, b: number, c: number, N: number): THREE.BufferGeometry {
  const ring = trOvalRing(a, b, c, N);
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
function getGTRNguniShell(): THREE.BufferGeometry { return (gTRNguniShell ||= trOvalShell(0.088 * HEX_R, 0.205 * HEX_R, 0.030 * HEX_R, 0.014 * HEX_R, 10)); }
function getGTRNguniFace():  THREE.BufferGeometry { return (gTRNguniFace  ||= trOvalFace(0.076 * HEX_R, 0.180 * HEX_R, 0.022 * HEX_R, 10)); }
function getGTROvalShell():  THREE.BufferGeometry { return (gTROvalShell  ||= trOvalShell(0.098 * HEX_R, 0.185 * HEX_R, 0.040 * HEX_R, 0.018 * HEX_R, 10)); }
function getGTROvalFace():   THREE.BufferGeometry { return (gTROvalFace   ||= trOvalFace(0.082 * HEX_R, 0.156 * HEX_R, 0.028 * HEX_R, 10)); }

// ── lancuch konczyn (konwencja niSeg/niBuildLeg/niBuildArm z wzorca) ────────
function trDirDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}
function trSeg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = trDirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}
function trBuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  mFoot: THREE.MeshStandardMaterial, hipY: number = TR_HIP_Y,
): { knee: THREE.Vector3; thighCtr: THREE.Vector3 } {
  let P = new THREE.Vector3(sx, hipY, 0);
  const thighCtr = P.clone().addScaledVector(trDirDown(thU), TR_THIGH_L * 0.5);
  P = trSeg(group, getGTRThigh(), mThigh, P, thU, TR_THIGH_L);
  const knee = P.clone();
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = trSeg(group, getGTRShin(), mShin, P, thL, TR_SHIN_L);
  const foot = new THREE.Mesh(getGTRFoot(), mFoot);
  foot.position.set(sx, 0.013 * HEX_R, P.z + 0.016 * HEX_R);
  group.add(foot);
  return { knee, thighCtr };
}
function trBuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  let P = new THREE.Vector3(sx, TR_SHLD_Y, 0);
  P = trSeg(group, getGTRUpArm(), mUp, P, thU, TR_UPARM_L);
  P.y += 0.010 * HEX_R;
  const wrist = trSeg(group, getGTRForearm(), mFore, P, thF, TR_FOREARM_L);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getGTRFist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(trDirDown(thF), 0.014 * HEX_R));
    group.add(fist);
  }
  return { wrist, axis: trDirDown(thF) };
}
function trCore(
  group: THREE.Group, mat: MatFactory, mTorso: THREE.MeshStandardMaterial,
  skinColor: number = TR_SKIN,
): THREE.MeshStandardMaterial {
  const torso = new THREE.Mesh(getGTRTorso(), mTorso);
  torso.position.set(0, TR_TORSO_CTR, 0);
  group.add(torso);
  const mSkin = mat(skinColor, 0.05, 0.80);
  const neck = new THREE.Mesh(getGTRNeck(), mSkin);
  neck.position.set(0, TR_TORSO_TOP + TR_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(getGTRHead(), mSkin);
  head.position.set(0, TR_HEAD_CTR, 0);
  group.add(head);
  return mSkin;
}
/** Wasy: 2 klocki pod nosem, opadajace na boki (Slowianin / Gal). */
function trWasy(group: THREE.Group, mHair: THREE.MeshStandardMaterial): void {
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(getGTRWasy(), mHair);
    w.rotation.z = s * 0.35;
    w.position.set(s * 0.028 * HEX_R, TR_HEAD_CTR - 0.038 * HEX_R, TR_HEAD_S * 0.5 + 0.006 * HEX_R);
    group.add(w);
  }
}
/** Choragiew supera NA PLECACH (konwencja P6/P2-Inka): drzewce -0.14, zloty finial. */
function trSuperBanner(
  group: THREE.Group, mPole: THREE.MeshStandardMaterial,
  mFlag: THREE.MeshStandardMaterial, mGold: THREE.MeshStandardMaterial,
): void {
  const pole = new THREE.Mesh(getGTRPole(), mPole);
  pole.rotation.x = -0.14;
  pole.position.set(-0.052 * HEX_R, 0.340 * HEX_R, -0.086 * HEX_R);
  group.add(pole);
  const flag = new THREE.Mesh(getGTRFlag(), mFlag);
  flag.rotation.x = -0.14;
  flag.position.set(-0.100 * HEX_R, 0.548 * HEX_R, -0.115 * HEX_R);
  group.add(flag);
  const fin = new THREE.Mesh(getGTRFinial(), mGold);
  fin.position.set(-0.052 * HEX_R, 0.600 * HEX_R, -0.122 * HEX_R);
  group.add(fin);
}

// ---------------------------------------------------------------------------
// DRUZYNNIK (Slowianie, ZELAZO) — POZA: pchniecie mieczem w wykroku
// Helm stozkowy z NOSALEM (czarnomogilski: stalowy stozek + brazowe okucie),
// lniana rubacha + skorzany KAFTAN + pas, WASY ciemnoblond, welniane nogawice,
// okragla tarcza: pole = KOLOR GRACZA, 3 deski PROMIENISTE, stalowe UMBO,
// skorzany rant — na LEWYM (+X) przedramieniu; miecz w PRAWEJ (-X) na osi
// przedramienia. Stopy na y = 0.
// ---------------------------------------------------------------------------
export function buildDruzynnik(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mLinen = mat(TR_LINEN,    0.05, 0.84);
  const mLeath = mat(TR_LEATHER,  0.06, 0.82);
  const mWool  = mat(TR_WOOL_DK,  0.05, 0.88);
  const mSteel = mat(TR_STEEL,    0.55, 0.35);
  const mBronz = mat(TR_BRONZE,   0.45, 0.42);
  const mOwner = mat(ownerColor_, 0.12, 0.66);
  const mWood  = mat(TR_WOOD,     0.05, 0.85);
  const mHair  = mat(TR_HAIR_SLAV,0.04, 0.86);
  const mSkin  = mat(TR_SKIN,     0.05, 0.80);

  const HIP_Y = TR_HIP_Y - 0.012 * HEX_R;   // wykrok — biodra obnizone

  // korpus: rubacha lniana; na niej skorzany kaftan + pas
  trCore(group, mat, mLinen);
  const kaftan = new THREE.Mesh(getGTRKaftan(), mLeath);
  kaftan.position.set(0, TR_TORSO_CTR - 0.016 * HEX_R, 0);
  group.add(kaftan);
  const skirt = new THREE.Mesh(getGTRSkirt(), mLinen);   // dol rubachy
  skirt.position.set(0, TR_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const belt = new THREE.Mesh(getGTRBelt(), mWood);
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);

  // nogi: welniane nogawice, skorzane buty; LEWA (+X) wykroczna
  trBuildLeg(group,  TR_HIP_X,  0.58,  0.34, mWool, mWool, mLeath, HIP_Y);
  trBuildLeg(group, -TR_HIP_X, -0.52, -0.20, mWool, mWool, mLeath, HIP_Y);

  // WASY (obowiazkowe!) — ciemnoblond, opadajace
  trWasy(group, mHair);

  // HELM CZARNOMOGILSKI: stalowy stozek + brazowe okucie dolu + NOSAL
  const helm = new THREE.Mesh(getGTRConeHelm(), mSteel);
  helm.position.set(0, TR_HEAD_CTR + 0.052 * HEX_R, 0);
  group.add(helm);
  const rim = new THREE.Mesh(getGTRHelmRim(), mBronz);
  rim.position.set(0, TR_HEAD_CTR + 0.006 * HEX_R, 0);
  group.add(rim);
  const nosal = new THREE.Mesh(getGTRNosal(), mSteel);
  nosal.position.set(0, TR_HEAD_CTR - 0.006 * HEX_R, TR_HEAD_S * 0.5 + 0.008 * HEX_R);
  group.add(nosal);

  // PRAWE (-X) RAMIE + MIECZ: pchniecie w przod na osi przedramienia
  const armR = trBuildArm(group, -TR_SHLD_X, 0.95, 1.50, mLinen, mSkin, mLeath);
  const ax = armR.axis;
  const guard = new THREE.Mesh(getGTRGuard(), mBronz);
  guard.rotation.x = Math.PI - 1.50;
  guard.position.copy(armR.wrist.clone().addScaledVector(ax, 0.030 * HEX_R));
  group.add(guard);
  const blade = new THREE.Mesh(getGTRBlade(), mSteel);
  blade.rotation.x = Math.PI - 1.50;
  blade.position.copy(armR.wrist.clone().addScaledVector(ax, 0.108 * HEX_R));
  group.add(blade);
  const tip = new THREE.Mesh(getGTRBladeTip(), mSteel);
  tip.rotation.x = Math.PI - 1.50;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(armR.wrist.clone().addScaledVector(ax, 0.204 * HEX_R));
  group.add(tip);
  const pommel = new THREE.Mesh(getGTRPommel(), mBronz);
  pommel.rotation.x = Math.PI - 1.50;
  pommel.position.copy(armR.wrist.clone().addScaledVector(ax, -0.016 * HEX_R));
  group.add(pommel);

  // LEWE (+X) RAMIE + OKRAGLA TARCZA przed korpusem
  const armL = trBuildArm(group, TR_SHLD_X, 0.50, 1.10, mLinen, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.025 * HEX_R,
    armL.wrist.y + 0.034 * HEX_R,
    armL.wrist.z + 0.045 * HEX_R,
  );
  sh.rotation.y = -0.22;
  const face = new THREE.Mesh(getGTRRndFace(), mOwner);   // POLE = KOLOR GRACZA
  face.rotation.x = Math.PI / 2;
  sh.add(face);
  const rimS = new THREE.Mesh(getGTRRndRim(), mLeath);    // skorzany rant
  rimS.rotation.x = Math.PI / 2;
  rimS.position.set(0, 0, -0.006 * HEX_R);
  sh.add(rimS);
  for (const a of [0, Math.PI / 3, -Math.PI / 3]) {       // 3 deski PROMIENISTE
    const pl = new THREE.Mesh(getGTRPlank(), mWood);
    pl.rotation.z = a;
    pl.position.set(0, 0, 0.016 * HEX_R);
    sh.add(pl);
  }
  const umbo = new THREE.Mesh(getGTRUmbo(), mSteel);      // stalowe UMBO
  umbo.rotation.x = Math.PI / 2;
  umbo.position.set(0, 0, 0.028 * HEX_R);
  sh.add(umbo);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// iBUTHO Z IKLWA (Zulusi, ZELAZO) — POZA: zdyscyplinowane pchniecie iklwa
// ZELAZNY BRAT Impi (P57): ta sama anatomia; roznice starszego regimentu —
// tarcza nguni CIEMNA (brazowo-czarna laciata), WYZSZY pioropusz (3 piora
// + czub), NASZYJNIK KLOW, amashoba tylko na ramionach (dyscyplina), klapa
// spodnicy = KOLOR GRACZA + romb gracza na tarczy. Stopy na y = 0.
// ---------------------------------------------------------------------------
export function buildIButho(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin  = mat(TR_SKIN_ZULU, 0.05, 0.80);
  const mFur   = mat(TR_FUR,       0.04, 0.92);
  const mFurLt = mat(TR_FUR_LT,    0.04, 0.90);
  const mHide  = mat(TR_HIDE_DK,   0.04, 0.88);   // ciemna siersc nguni
  const mBlack = mat(TR_BLACK,     0.04, 0.90);
  const mLeath = mat(TR_LEATHER,   0.05, 0.84);
  const mOwner = mat(ownerColor_,  0.10, 0.68);
  const mWood  = mat(0x7a5c3a,     0.05, 0.85);
  const mIron  = mat(TR_STEEL,     0.52, 0.38);   // ZELAZNY grot (brat z zelaza!)
  const mIvory = mat(TR_IVORY,     0.06, 0.78);
  const mCrane = mat(TR_CRANE_WHT, 0.03, 0.88);

  const HIP_Y = TR_HIP_Y - 0.014 * HEX_R;   // gleboki, kontrolowany wypad

  // korpus: NAGI tors (ciemna skora jak Impi)
  trCore(group, mat, mSkin, TR_SKIN_ZULU);

  // spodnica futrzana + przednia klapa KOLORU GRACZA (konwencja Impi)
  const skirt = new THREE.Mesh(getGTRSkirt(), mFur);
  skirt.position.set(0, TR_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const flap = new THREE.Mesh(getGTRFringe(), mOwner);
  flap.scale.set(1.30, 1.35, 1.0);
  flap.position.set(0, TR_TORSO_BOT - 0.046 * HEX_R, 0.062 * HEX_R);
  group.add(flap);

  // NASZYJNIK KLOW: rzemien + 3 kly (ostrzem w dol) na piersi
  const band = new THREE.Mesh(getGTRNeckBand(), mLeath);
  band.position.set(0, TR_TORSO_TOP - 0.006 * HEX_R, 0.014 * HEX_R);
  group.add(band);
  for (const s of [-1, 0, 1]) {
    const t = new THREE.Mesh(getGTRTooth(), mIvory);
    t.rotation.x = Math.PI;                       // ostrzem w dol
    t.rotation.y = Math.PI / 4;
    t.position.set(s * 0.036 * HEX_R, TR_TORSO_TOP - 0.036 * HEX_R, TR_TORSO_D * 0.5 + 0.012 * HEX_R);
    group.add(t);
  }

  // nogi (nagie, BEZ amashoba lydek — dyscyplina zelaznego regimentu)
  trBuildLeg(group,  TR_HIP_X,  0.66,  0.40, mSkin, mSkin, mSkin, HIP_Y);
  trBuildLeg(group, -TR_HIP_X, -0.58, -0.24, mSkin, mSkin, mSkin, HIP_Y);

  // isicoco + WYZSZY pioropusz: 3 piora (czarne skrzydla + biel zurawia) + czub
  const coco = new THREE.Mesh(getGTRIsicoco(), mBlack);
  coco.position.set(0, TR_HEAD_TOP + 0.008 * HEX_R, 0);
  group.add(coco);
  for (const s of [-1, 0, 1]) {
    const f = new THREE.Mesh(getGTRFeather(), s === 0 ? mCrane : mBlack);
    f.rotation.z = s * 0.16;
    f.rotation.x = -0.10;
    f.position.set(s * 0.026 * HEX_R, TR_HEAD_TOP + (s === 0 ? 0.100 : 0.090) * HEX_R, -0.024 * HEX_R);
    group.add(f);
  }

  // PRAWE (-X) RAMIE + IKLWA (grot ZELAZNY) + amashoba ramienia
  const armR = trBuildArm(group, -TR_SHLD_X, 1.00, 1.52, mSkin, mSkin, mSkin);
  const shR = new THREE.Mesh(getGTRShoba(), mFurLt);
  shR.rotation.x = Math.PI - 1.00;
  shR.position.set(-TR_SHLD_X, TR_SHLD_Y - 0.030 * HEX_R, 0.030 * HEX_R);
  group.add(shR);
  const ax = armR.axis;
  const shaft = new THREE.Mesh(getGTRIklwaShaft(), mWood);
  shaft.rotation.x = Math.PI - 1.52;
  shaft.position.copy(armR.wrist.clone().addScaledVector(ax, 0.055 * HEX_R));
  group.add(shaft);
  const blade = new THREE.Mesh(getGTRIklwaBlade(), mIron);
  blade.rotation.x = Math.PI - 1.52;
  blade.position.copy(armR.wrist.clone().addScaledVector(ax, 0.225 * HEX_R));
  group.add(blade);
  const tipI = new THREE.Mesh(getGTRIklwaTip(), mIron);
  tipI.rotation.x = Math.PI - 1.52;
  tipI.rotation.y = Math.PI / 4;
  tipI.position.copy(armR.wrist.clone().addScaledVector(ax, 0.295 * HEX_R));
  group.add(tipI);

  // LEWE (+X) RAMIE + CIEMNA TARCZA NGUNI + amashoba ramienia
  const armL = trBuildArm(group, TR_SHLD_X, 0.50, 1.05, mSkin, mSkin, null);
  const shL = new THREE.Mesh(getGTRShoba(), mFurLt);
  shL.rotation.x = Math.PI - 0.50;
  shL.position.set(TR_SHLD_X, TR_SHLD_Y - 0.036 * HEX_R, 0.018 * HEX_R);
  group.add(shL);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.022 * HEX_R,
    armL.wrist.y + 0.030 * HEX_R,
    armL.wrist.z + 0.042 * HEX_R,
  );
  sh.rotation.y = -0.18;
  const shell = new THREE.Mesh(getGTRNguniShell(), mLeath);
  sh.add(shell);
  const face = new THREE.Mesh(getGTRNguniFace(), mHide);   // CIEMNY braz
  face.position.set(0, 0, 0.010 * HEX_R);
  sh.add(face);
  const p1 = new THREE.Mesh(getGTRPatchBig(), mBlack);     // CZARNE laty
  p1.rotation.z = 0.30;
  p1.position.set(-0.030 * HEX_R, 0.088 * HEX_R, 0.016 * HEX_R);
  sh.add(p1);
  const p2 = new THREE.Mesh(getGTRPatchBig(), mBlack);
  p2.rotation.z = -0.42;
  p2.position.set(0.026 * HEX_R, -0.086 * HEX_R, 0.016 * HEX_R);
  sh.add(p2);
  const p3 = new THREE.Mesh(getGTRPatchSm(), mBlack);
  p3.rotation.z = 0.55;
  p3.position.set(0.040 * HEX_R, 0.020 * HEX_R, 0.016 * HEX_R);
  sh.add(p3);
  const dia = new THREE.Mesh(getGTRDiamond(), mOwner);     // romb gracza
  dia.rotation.z = Math.PI / 4;
  dia.position.set(0, 0, 0.020 * HEX_R);
  sh.add(dia);
  const mgobo = new THREE.Mesh(getGTRMgobo(), mWood);
  mgobo.position.set(0, 0.010 * HEX_R, -0.014 * HEX_R);
  sh.add(mgobo);
  const tuft = new THREE.Mesh(getGTRMgoboTuft(), mFurLt);
  tuft.position.set(0, 0.278 * HEX_R, -0.014 * HEX_R);
  sh.add(tuft);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// WOJOWNIK GERMANSKI (Germanie, SUPER, ZELAZO) — POZA: ciecie znad glowy
// Potezny wodz: GOLY TORS + skorzany pas na krzyz, FUTRO na obu ramionach
// (paleta skor Berserkera), helm ZELAZNY prosty z FUTRZANYM OTOKIEM (bez
// rogow), RUDA PLECIONA BRODA (2 warkocze), dlugi ZELAZNY miecz w PRAWEJ
// (-X) znad glowy na osi przedramienia, tarcza okragla ze SPIRALA na LEWYM
// (+X) przedramieniu, welniane spodnie, CHORAGIEW SUPERA na plecach (P6).
// ---------------------------------------------------------------------------
export function buildGermanSuper(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin  = mat(TR_SKIN,     0.05, 0.80);
  const mFur   = mat(TR_PELT,     0.04, 0.94);   // ciemne futro (rodzina Berserkera)
  const mFurLt = mat(TR_FUR_LT,   0.04, 0.90);
  const mLeath = mat(TR_LEATHER,  0.06, 0.82);
  const mWool  = mat(0x5a5040,    0.05, 0.88);   // spodnie
  const mIron  = mat(TR_STEEL,    0.55, 0.35);
  const mIronD = mat(TR_IRON_DK,  0.45, 0.50);   // spirala
  const mWood  = mat(TR_WOOD,     0.05, 0.85);
  const mOwner = mat(ownerColor_, 0.14, 0.64);
  const mBeard = mat(TR_HAIR_GER, 0.04, 0.86);   // RUDA broda
  const mGold  = mat(TR_GOLD,     0.55, 0.35);
  const mPole  = mat(0x5f4020,    0.05, 0.85);

  const HIP_Y = TR_HIP_Y - 0.014 * HEX_R;   // potezny wykrok

  // korpus: GOLY TORS (skora) + skorzany pas przez piers (na krzyz z pasem)
  trCore(group, mat, mSkin);
  const strap = new THREE.Mesh(getGTRStrap(), mLeath);
  strap.rotation.set(-0.35, 0, 0.66);
  strap.position.set(-0.012 * HEX_R, TR_TORSO_CTR + 0.020 * HEX_R, TR_TORSO_D * 0.5 - 0.014 * HEX_R);
  group.add(strap);
  const skirt = new THREE.Mesh(getGTRSkirt(), mWool);   // pas/dol spodni
  skirt.position.set(0, TR_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const belt = new THREE.Mesh(getGTRBelt(), mLeath);
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);

  // FUTRO na obu ramionach (mantle nad stawem barkowym)
  for (const s of [-1, 1]) {
    const pad = new THREE.Mesh(getGTRFurPad(), mFur);
    pad.position.set(s * (TR_SHLD_X - 0.004 * HEX_R), TR_TORSO_TOP + 0.008 * HEX_R, 0);
    group.add(pad);
  }

  // nogi: welniane spodnie, skorzane buty; wykrok
  trBuildLeg(group,  TR_HIP_X,  0.62,  0.36, mWool, mWool, mLeath, HIP_Y);
  trBuildLeg(group, -TR_HIP_X, -0.56, -0.22, mWool, mWool, mLeath, HIP_Y);

  // RUDA PLECIONA BRODA: blok brody + 2 warkocze + wasy w kolorze brody
  const beard = new THREE.Mesh(getGTRBeard(), mBeard);
  beard.position.set(0, TR_HEAD_CTR - 0.052 * HEX_R, TR_HEAD_S * 0.5 - 0.004 * HEX_R);
  group.add(beard);
  for (const s of [-1, 1]) {
    const braid = new THREE.Mesh(getGTRBraid(), mBeard);
    braid.rotation.z = s * 0.10;
    braid.position.set(s * 0.026 * HEX_R, TR_HEAD_CTR - 0.112 * HEX_R, TR_HEAD_S * 0.5 + 0.002 * HEX_R);
    group.add(braid);
  }

  // HELM ZELAZNY PROSTY z FUTRZANYM OTOKIEM (zadnych rogow!)
  const dome = new THREE.Mesh(getGTRDomeHelm(), mIron);
  dome.position.set(0, TR_HEAD_CTR + 0.044 * HEX_R, 0);
  group.add(dome);
  const otok = new THREE.Mesh(getGTRFurBand(), mFurLt);
  otok.position.set(0, TR_HEAD_CTR + 0.012 * HEX_R, 0);
  group.add(otok);

  // PRAWE (-X) RAMIE + DLUGI MIECZ znad glowy (lokiec nad barkiem, klinga
  // na osi przedramienia — cios opada ku wrogowi)
  const armR = trBuildArm(group, -TR_SHLD_X, -2.55, 1.30, mSkin, mSkin, mLeath);
  const ax = armR.axis;
  const guard = new THREE.Mesh(getGTRGuard(), mIronD);
  guard.rotation.x = Math.PI - 1.30;
  guard.position.copy(armR.wrist.clone().addScaledVector(ax, 0.030 * HEX_R));
  group.add(guard);
  const blade = new THREE.Mesh(getGTRLongBlade(), mIron);
  blade.rotation.x = Math.PI - 1.30;
  blade.position.copy(armR.wrist.clone().addScaledVector(ax, 0.140 * HEX_R));
  group.add(blade);
  const tip = new THREE.Mesh(getGTRBladeTip(), mIron);
  tip.rotation.x = Math.PI - 1.30;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(armR.wrist.clone().addScaledVector(ax, 0.266 * HEX_R));
  group.add(tip);

  // LEWE (+X) RAMIE + TARCZA OKRAGLA ZE SPIRALA przed korpusem
  const armL = trBuildArm(group, TR_SHLD_X, 0.52, 1.08, mSkin, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.028 * HEX_R,
    armL.wrist.y + 0.036 * HEX_R,
    armL.wrist.z + 0.046 * HEX_R,
  );
  sh.rotation.y = -0.20;
  const face = new THREE.Mesh(getGTRRndFace(), mOwner);   // pole = KOLOR GRACZA
  face.rotation.x = Math.PI / 2;
  sh.add(face);
  const rimS = new THREE.Mesh(getGTRRndRim(), mWood);     // drewniany rant
  rimS.rotation.x = Math.PI / 2;
  rimS.position.set(0, 0, -0.006 * HEX_R);
  sh.add(rimS);
  // SPIRALA: 4 klocki styczne do krzywej — zawijaja sie wokol umba
  for (let k = 0; k < 4; k++) {
    const a = 0.55 + k * 1.05;                 // kat na spirali
    const r = 0.052 + k * 0.017;               // rosnacy promien
    const armS = new THREE.Mesh(getGTRSpiralArm(), mIronD);
    armS.rotation.z = a + Math.PI / 2;         // stycznie do okregu
    armS.position.set(Math.cos(a) * r * HEX_R, Math.sin(a) * r * HEX_R, 0.018 * HEX_R);
    sh.add(armS);
  }
  const umbo = new THREE.Mesh(getGTRUmbo(), mIron);
  umbo.rotation.x = Math.PI / 2;
  umbo.position.set(0, 0, 0.028 * HEX_R);
  sh.add(umbo);
  group.add(sh);

  // CHORAGIEW SUPERA na plecach (kolor gracza + zloty finial)
  trSuperBanner(group, mPole, mOwner, mGold);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// MIECZNIK GALIJSKI (Celtowie, ZELAZO) — POZA: pchniecie dlugim mieczem
// Rodzina CeltWarrior/Gaesatae: rude dlugie wlosy + WASY, TORQUES (zloty,
// otwarty) na szyi, helm MONTEFORTINO-celtycki (zelazny, guz + kita), tunika
// burgundowa, BRACCAE W KRATE (rdzawe nogawice + poziome pasy ochry i pionowe
// urzetu — klockowa krata), tarcza OWALNA celtycka (pole = KOLOR GRACZA,
// stalowa spina + umbo, TRISKELION z brazu) na LEWYM (+X) przedramieniu,
// DLUGI miecz celtycki w PRAWEJ (-X) na osi przedramienia. Stopy na y = 0.
// ---------------------------------------------------------------------------
export function buildMiecznikGalijski(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mTunic = mat(TR_BURGUNDY, 0.05, 0.84);
  const mBrac  = mat(TR_BRACCAE,  0.05, 0.86);
  const mOchre = mat(TR_OCHRE,    0.05, 0.84);
  const mWoad  = mat(TR_WOAD,     0.05, 0.84);
  const mLeath = mat(TR_LEATHER,  0.06, 0.82);
  const mIron  = mat(TR_STEEL,    0.55, 0.35);
  const mBronz = mat(TR_BRONZE,   0.45, 0.42);
  const mGold  = mat(TR_GOLD,     0.55, 0.35);
  const mOwner = mat(ownerColor_, 0.12, 0.66);
  const mHair  = mat(TR_HAIR_CELT,0.04, 0.86);
  const mSkin  = mat(TR_SKIN,     0.05, 0.80);
  const mBlack = mat(TR_BLACK,    0.05, 0.85);

  const HIP_Y = TR_HIP_Y - 0.012 * HEX_R;

  // korpus: tunika burgundowa + dol tuniki + pas
  trCore(group, mat, mTunic);
  const skirt = new THREE.Mesh(getGTRSkirt(), mTunic);
  skirt.position.set(0, TR_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const belt = new THREE.Mesh(getGTRBelt(), mLeath);
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);

  // TORQUES: zloty otwarty piercien na szyi
  const torc = new THREE.Mesh(getGTRTorc(), mGold);
  torc.position.set(0, TR_TORSO_TOP + TR_NECK_H * 0.5, 0.004 * HEX_R);
  group.add(torc);

  // nogi: BRACCAE W KRATE — rdzawe nogawice; na kazdym udzie poziomy pas
  // ochry + pionowy pas urzetu (klockowa krata)
  const legL = trBuildLeg(group,  TR_HIP_X,  0.58,  0.34, mBrac, mBrac, mLeath, HIP_Y);
  const legR = trBuildLeg(group, -TR_HIP_X, -0.52, -0.20, mBrac, mBrac, mLeath, HIP_Y);
  for (const [leg, thU, sx] of [[legL, 0.58, TR_HIP_X], [legR, -0.52, -TR_HIP_X]] as
       [ { thighCtr: THREE.Vector3 }, number, number ][]) {
    const band = new THREE.Mesh(getGTRBand(), mOchre);    // poziomy pas kraty
    band.rotation.x = Math.PI - thU;
    band.position.copy(leg.thighCtr);
    group.add(band);
    const pion = new THREE.Mesh(getGTRPion(), mWoad);     // pionowy pas kraty
    pion.rotation.x = Math.PI - thU;
    pion.position.copy(leg.thighCtr.clone().add(new THREE.Vector3(0, 0, 0.033 * HEX_R)));
    group.add(pion);
  }

  // rude DLUGIE wlosy + WASY
  const hair = new THREE.Mesh(getGTRHairBk(), mHair);
  hair.position.set(0, TR_HEAD_CTR - 0.010 * HEX_R, -(TR_HEAD_S * 0.5 + 0.010 * HEX_R));
  group.add(hair);
  trWasy(group, mHair);

  // HELM MONTEFORTINO-CELTYCKI: zelazna miska + guz + czarna kita
  const bowl = new THREE.Mesh(getGTRMontBowl(), mIron);
  bowl.position.set(0, TR_HEAD_CTR + 0.030 * HEX_R, 0);
  group.add(bowl);
  const kita = new THREE.Mesh(getGTRKita(), mBlack);
  kita.position.set(0, TR_HEAD_TOP + 0.076 * HEX_R, 0);
  group.add(kita);

  // PRAWE (-X) RAMIE + DLUGI MIECZ CELTYCKI: pchniecie na osi przedramienia
  const armR = trBuildArm(group, -TR_SHLD_X, 0.92, 1.46, mTunic, mSkin, mLeath);
  const ax = armR.axis;
  const guard = new THREE.Mesh(getGTRGuard(), mBronz);
  guard.rotation.x = Math.PI - 1.46;
  guard.position.copy(armR.wrist.clone().addScaledVector(ax, 0.030 * HEX_R));
  group.add(guard);
  const blade = new THREE.Mesh(getGTRLongBlade(), mIron);
  blade.rotation.x = Math.PI - 1.46;
  blade.position.copy(armR.wrist.clone().addScaledVector(ax, 0.140 * HEX_R));
  group.add(blade);
  const tip = new THREE.Mesh(getGTRBladeTip(), mIron);
  tip.rotation.x = Math.PI - 1.46;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(armR.wrist.clone().addScaledVector(ax, 0.266 * HEX_R));
  group.add(tip);

  // LEWE (+X) RAMIE + TARCZA OWALNA Z TRISKELIONEM przed korpusem
  const armL = trBuildArm(group, TR_SHLD_X, 0.50, 1.10, mTunic, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.025 * HEX_R,
    armL.wrist.y + 0.034 * HEX_R,
    armL.wrist.z + 0.045 * HEX_R,
  );
  sh.rotation.y = -0.22;
  const shell = new THREE.Mesh(getGTROvalShell(), mLeath);  // rant + plecy
  sh.add(shell);
  const face = new THREE.Mesh(getGTROvalFace(), mOwner);    // POLE = KOLOR GRACZA
  face.position.set(0, 0, 0.014 * HEX_R);
  sh.add(face);
  // TRISKELION: 3 brazowe ramiona co 120 stopni, kazde skrecone (wir)
  for (let k = 0; k < 3; k++) {
    const a = k * (Math.PI * 2 / 3) + Math.PI / 2;
    const armT = new THREE.Mesh(getGTRTriArm(), mGold);
    armT.rotation.z = a + 0.85;
    armT.position.set(Math.cos(a) * 0.040 * HEX_R, Math.sin(a) * 0.040 * HEX_R, 0.026 * HEX_R);
    sh.add(armT);
  }
  const umbo = new THREE.Mesh(getGTRUmbo(), mIron);
  umbo.rotation.x = Math.PI / 2;
  umbo.scale.set(0.7, 0.8, 0.7);
  umbo.position.set(0, 0, 0.030 * HEX_R);
  sh.add(umbo);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}
