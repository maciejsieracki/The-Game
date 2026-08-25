/**
 * jednostki-z3-plemiona.ts — SERIA Z3: PLEMIONA (5 jednostek, ZELAZO)
 * (seria render-jednostki; wzorzec anatomii: hastati-falangita.ts KOREKTA v2,
 *  bratni wzorzec Impi: jednostki-p57-wlocznie-machiny.ts,
 *  konwencja SUPERA: jednostki-p6-super.ts — choragiew-znacznik NA PLECACH)
 * ---------------------------------------------------------------------------
 * Zamienniki dla tokenow z gra/src/render/units.ts:
 *   buildDruzynnik(ownerColor)        -> case w buildNamedUnit: 'druzynnik' ORAZ
 *                                        'druzhinnik' (alias EN dodany w T10 —
 *                                        przed nim nazwa angielska z units.json
 *                                        wracala do GENERYKA 'miecznik')
 *   buildIButho(ownerColor)           -> case w buildNamedUnit ('ibutho' / 'butho');
 *                                        nazwa EN „iButho with iklwa" trafia
 *                                        w ten sam rdzen, wiec aliasu nie ma
 *   buildMiecznikGalijski(ownerColor) -> NOWY case w buildNamedUnit ('miecznik galijski'
 *                                        / 'gallic swordsman'); dzis: GENERYK miecznika
 *   buildBerserker(ownerColor)        -> T8: przejmuje linie dispatchu
 *                                        'berserker germansk'/'berserk' oraz
 *                                        'germanic berserker' w units.ts (import
 *                                        pod aliasem `buildBerserkerZ3`). Do T8
 *                                        Berserkera budowal lokalny
 *                                        `buildBerserker()` w units.ts, oparty na
 *                                        generycznym `buildBaseAvatar()`; ta stara
 *                                        funkcja zostaje w units.ts jako MARTWA,
 *                                        dokladnie jak `buildGermanWarrior()`.
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
 *     helm STOZKOWY (dzwon stalowy + okucie ze ZLOCONEJ MIEDZI + nosal;
 *     T10 poprawil tu zdanie „typ czarnomogilski Z NOSALEM" — nosal NIE jest
 *     cecha tego typu, patrz K3 przy builderze), lniana rubacha + skorzany
 *     kaftan + PAS Z OKUCIAMI, WASY (bez brody), okragla tarcza z UMBEM
 *     i deskami PROMIENISTYMI (pole = kolor gracza), miecz w pchnieciu.
 *   iBUTHO Z IKLWA (Zulusi): ZELAZNY KREWNY Impi (P57) — ta sama anatomia
 *     bazowa, ale INNA sylwetka (T10: przed audytem obie figurki roznily sie
 *     na ekranie w 0.370 przy progu rodziny 0.558): tarcza PELNEJ DLUGOSCI
 *     (isihlangu) niesiona wysoko i CIEMNA (brazowo-czarna laciata) — barwa
 *     czyta sie jako pulk MLODY, nie starszy, patrz K10 przy builderze —
 *     WYZSZY pioropusz (3 piora), wieksze isicoco, KROTSZA iklwa
 *     o proporcjach broni klujacej, NASZYJNIK KLOW na rzemieniu,
 *     amashoba tylko na ramionach, gleboki wypad.
 *   WOJOWNIK GERMANSKI (SUPER, Germanie): potezny wodz — GOLY TORS z pasem
 *     skory na krzyz, FUTRO na ramionach (rodzina Berserkera: ta sama paleta
 *     skor), helm ZELAZNY prosty z FUTRZANYM OTOKIEM (bez rogow!), RUDA
 *     PLECIONA BRODA, FRAMEA (krotka wlocznia, waski i krotki grot) uniesiona
 *     do rzutu, tarcza okragla ze SPIRALA, choragiew supera na plecach.
 *   BERSERKER GERMANSKI (Germanie): brat Wojownika germanskiego w tej samej
 *     palecie skor — GOLY TORS z BARWNIKIEM w kolorze gracza, LEB WILKA na
 *     ciemieniu, JASNE rozwiane wlosy (ruda barwa zarezerwowana dla brata),
 *     skora na plecach, BOSE nogi, szeroki TOPOR odwiedziony za bark.
 *     ZERO zbroi, ZERO helmu, ZERO tarczy — `Pancerz = 0` w units.json.
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
const TR_EYE        = 0x1a1008;   // oko (paleta COLOR_DARK_EYE z units.ts)
const TR_HAIR_BLOND = 0xd8b25a;   // jasne wlosy Berserkera (paleta units.ts)

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
// Berserker germanski (T8) + framea Wojownika germanskiego (T8)
let gTREye:      THREE.BoxGeometry | null = null;      // oko (odkryta twarz)
let gTRWolfHood: THREE.BoxGeometry | null = null;      // leb wilka NA CIEMIENIU
let gTRWolfSnout:THREE.BoxGeometry | null = null;      // kufa wilka (do przodu)
let gTRWolfEar:  THREE.BoxGeometry | null = null;      // ucho wilka (x2)
let gTRPeltCape: THREE.BoxGeometry | null = null;      // skora na plecach
let gTRLoin:     THREE.BoxGeometry | null = null;      // przepaska biodrowa
let gTRHairLoose:THREE.BoxGeometry | null = null;      // rozwiane wlosy z tylu
let gTRAxeHaft:  THREE.BoxGeometry | null = null;      // toporzysko
let gTRAxeHead:  THREE.BoxGeometry | null = null;      // zeleziec topora (plaski)
let gTRAxePoll:  THREE.BoxGeometry | null = null;      // obuch po drugiej stronie
let gTRWarPaint: THREE.BoxGeometry | null = null;      // pas barwnika na piersi
let gTRFrameaShaft: THREE.BoxGeometry | null = null;   // drzewce framei
let gTRFrameaSock:  THREE.BoxGeometry | null = null;   // tulejka grotu
let gTRFrameaHead:  THREE.BoxGeometry | null = null;   // grot: WASKI i KROTKI
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
function getGTREye():      THREE.BoxGeometry { return (gTREye      ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.014 * HEX_R, 0.008 * HEX_R)); }
// Kaptur PLYTKI w osi Z (0.115), zeby kufa miala z czego wystawac — przy
// glebokosci 0.150 kufa tonela w kapturze i leb wilka byl na ekranie zwyklym
// brazowym pudelkiem (zlapane zrzutem, nie liczba: sam pomiar pikseli calego
// zespolu `bs-wolf-*` byl wysoki, bo liczyl kaptur).
function getGTRWolfHood(): THREE.BoxGeometry { return (gTRWolfHood ||= new THREE.BoxGeometry(0.150 * HEX_R, 0.075 * HEX_R, 0.115 * HEX_R)); }
function getGTRWolfSnout():THREE.BoxGeometry { return (gTRWolfSnout||= new THREE.BoxGeometry(0.052 * HEX_R, 0.044 * HEX_R, 0.075 * HEX_R)); }
function getGTRWolfEar():  THREE.BoxGeometry { return (gTRWolfEar  ||= new THREE.BoxGeometry(0.034 * HEX_R, 0.058 * HEX_R, 0.026 * HEX_R)); }
function getGTRPeltCape(): THREE.BoxGeometry { return (gTRPeltCape ||= new THREE.BoxGeometry(0.176 * HEX_R, 0.250 * HEX_R, 0.014 * HEX_R)); }
function getGTRLoin():     THREE.BoxGeometry { return (gTRLoin     ||= new THREE.BoxGeometry(0.152 * HEX_R, 0.078 * HEX_R, 0.112 * HEX_R)); }
function getGTRHairLoose():THREE.BoxGeometry { return (gTRHairLoose||= new THREE.BoxGeometry(0.126 * HEX_R, 0.108 * HEX_R, 0.032 * HEX_R)); }
function getGTRAxeHaft():  THREE.BoxGeometry { return (gTRAxeHaft  ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.280 * HEX_R, 0.018 * HEX_R)); }
// Zeleziec WYZSZY NIZ SZERSZY (0.070 w bok, 0.120 wzdluz toporzyska). Przy
// proporcjach 0.095 x 0.080 (prawie kwadrat, osadzony symetrycznie) bryla
// czytala sie z kamery gry jako MLOT, nie topor — zlapane zrzutem ekranu,
// nie pomiarem: kazda asercja liczbowa przechodzila.
function getGTRAxeHead():  THREE.BoxGeometry { return (gTRAxeHead  ||= new THREE.BoxGeometry(0.070 * HEX_R, 0.120 * HEX_R, 0.018 * HEX_R)); }
function getGTRAxePoll():  THREE.BoxGeometry { return (gTRAxePoll  ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.048 * HEX_R, 0.024 * HEX_R)); }
function getGTRWarPaint(): THREE.BoxGeometry { return (gTRWarPaint ||= new THREE.BoxGeometry(0.100 * HEX_R, 0.022 * HEX_R, 0.010 * HEX_R)); }
function getGTRFrameaShaft(): THREE.BoxGeometry { return (gTRFrameaShaft ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.340 * HEX_R, 0.016 * HEX_R)); }
function getGTRFrameaSock():  THREE.BoxGeometry { return (gTRFrameaSock  ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.028 * HEX_R, 0.024 * HEX_R)); }
function getGTRFrameaHead():  THREE.BoxGeometry { return (gTRFrameaHead  ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.072 * HEX_R, 0.011 * HEX_R)); }
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
// NAZWY MESH — parametr `pf`/`nm` z DOMYSLNA WARTOSCIA PUSTA (wzorzec T6/T7:
// `z2Seg`/`z2BuildArm` w jednostki-z2-srodziemne.ts). Wywolania bez tego
// parametru — Druzynnik, iButho, Miecznik galijski — buduja DOKLADNIE to samo
// co przed T8: zaden mesh nie dostaje nazwy, geometria i pozycje sa nietkniete.
// Sprawdza to asercja regresji (R1-R3) w tescie tematu.
function trSeg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number, nm: string = '',
): THREE.Vector3 {
  const dir = trDirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  if (nm !== '') mesh.name = nm;
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}
function trBuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  mFoot: THREE.MeshStandardMaterial, hipY: number = TR_HIP_Y,
  pf: string = '', side: string = '',
): { knee: THREE.Vector3; thighCtr: THREE.Vector3 } {
  const nm = (part: string): string => (pf === '' ? '' : pf + '-leg-' + side + '-' + part);
  let P = new THREE.Vector3(sx, hipY, 0);
  const thighCtr = P.clone().addScaledVector(trDirDown(thU), TR_THIGH_L * 0.5);
  P = trSeg(group, getGTRThigh(), mThigh, P, thU, TR_THIGH_L, nm('thigh'));
  const knee = P.clone();
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = trSeg(group, getGTRShin(), mShin, P, thL, TR_SHIN_L, nm('shin'));
  const foot = new THREE.Mesh(getGTRFoot(), mFoot);
  foot.position.set(sx, 0.013 * HEX_R, P.z + 0.016 * HEX_R);
  if (pf !== '') foot.name = nm('foot');
  group.add(foot);
  return { knee, thighCtr };
}
function trBuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
  pf: string = '', side: string = '',
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  const nm = (part: string): string => (pf === '' ? '' : pf + '-arm-' + side + '-' + part);
  let P = new THREE.Vector3(sx, TR_SHLD_Y, 0);
  P = trSeg(group, getGTRUpArm(), mUp, P, thU, TR_UPARM_L, nm('upper'));
  P.y += 0.010 * HEX_R;
  const wrist = trSeg(group, getGTRForearm(), mFore, P, thF, TR_FOREARM_L, nm('fore'));
  if (mFist !== null) {
    const fist = new THREE.Mesh(getGTRFist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(trDirDown(thF), 0.014 * HEX_R));
    if (pf !== '') fist.name = nm('fist');
    group.add(fist);
  }
  return { wrist, axis: trDirDown(thF) };
}
/** Korpus: tors + szyja + glowa (+ opcjonalne OCZY przy odkrytej twarzy). */
function trCore(
  group: THREE.Group, mat: MatFactory, mTorso: THREE.MeshStandardMaterial,
  skinColor: number = TR_SKIN, eyes: boolean = false, pf: string = '',
): THREE.MeshStandardMaterial {
  const nm = (part: string): string => (pf === '' ? '' : pf + '-' + part);
  const torso = new THREE.Mesh(getGTRTorso(), mTorso);
  torso.position.set(0, TR_TORSO_CTR, 0);
  if (pf !== '') torso.name = nm('torso');
  group.add(torso);
  const mSkin = mat(skinColor, 0.05, 0.80);
  const neck = new THREE.Mesh(getGTRNeck(), mSkin);
  neck.position.set(0, TR_TORSO_TOP + TR_NECK_H * 0.5, 0);
  if (pf !== '') neck.name = nm('neck');
  group.add(neck);
  const head = new THREE.Mesh(getGTRHead(), mSkin);
  head.position.set(0, TR_HEAD_CTR, 0);
  if (pf !== '') head.name = nm('head');
  group.add(head);
  if (eyes) {
    const mEye = mat(TR_EYE, 0.02, 0.95);
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(getGTREye(), mEye);
      eye.position.set(sx * 0.028 * HEX_R, TR_HEAD_CTR + 0.008 * HEX_R, TR_HEAD_S * 0.5 + 0.004 * HEX_R);
      if (pf !== '') eye.name = nm('eye-' + (sx < 0 ? 'right' : 'left'));
      group.add(eye);
    }
  }
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
/**
 * Choragiew supera NA PLECACH (konwencja P6/P2-Inka): drzewce -0.14, zloty finial.
 * `side` = +1 stawia drzewce po stronie TARCZOWEJ (+X), -1 po stronie BRONNEJ.
 * Parametr pochodzi z T7: `s6Banner` w jednostki-p6-super.ts dostal go, bo
 * choragiew stojaca po stronie bronnej kolidowala z dory Hieros Lochos. Kopia
 * w tym pliku parametru NIE dostala (klasa bledu „poprawka nie dotarla do
 * kopii", T3->T7). Domyslna wartosc -1 zachowuje historyczne zachowanie dla
 * ewentualnych przyszlych wywolan; jedyny dzisiejszy wolajacy (Wojownik
 * germanski) podaje +1 jawnie.
 */
function trSuperBanner(
  group: THREE.Group, mPole: THREE.MeshStandardMaterial,
  mFlag: THREE.MeshStandardMaterial, mGold: THREE.MeshStandardMaterial,
  pf: string = '', side: number = -1,
): void {
  const nm = (part: string): string => (pf === '' ? '' : pf + '-banner-' + part);
  const s = side < 0 ? -1 : 1;
  const pole = new THREE.Mesh(getGTRPole(), mPole);
  pole.rotation.x = -0.14;
  pole.position.set(s * 0.052 * HEX_R, 0.340 * HEX_R, -0.086 * HEX_R);
  if (pf !== '') pole.name = nm('pole');
  group.add(pole);
  const flag = new THREE.Mesh(getGTRFlag(), mFlag);
  flag.rotation.x = -0.14;
  flag.position.set(s * 0.100 * HEX_R, 0.548 * HEX_R, -0.115 * HEX_R);
  if (pf !== '') flag.name = nm('flag');
  group.add(flag);
  const fin = new THREE.Mesh(getGTRFinial(), mGold);
  fin.position.set(s * 0.052 * HEX_R, 0.600 * HEX_R, -0.122 * HEX_R);
  if (pf !== '') fin.name = nm('finial');
  group.add(fin);
}

// ---------------------------------------------------------------------------
// DRUZYNNIK (Slowianie, ZELAZO) — POZA: pchniecie mieczem w wykroku
// Helm stozkowy (dzwon + okucie ze ZLOCONEJ MIEDZI + nosal), lniana rubacha
// + skorzany KAFTAN + PAS z okuciami, WASY ciemnoblond, welniane nogawice,
// okragla tarcza: pole = KOLOR GRACZA, 3 deski PROMIENISTE, stalowe UMBO,
// skorzany rant — na LEWYM (+X) przedramieniu; miecz w PRAWEJ (-X) na osi
// przedramienia. Stopy na y = 0. Prefiks mesh: `dr-`.
//
// T10 — CO ZMIENIONO I DLACZEGO (pomiar w zywym Chromium, kamera gry:
// azymut 0, elewacja 52 stopnie; „px" = piksele wlasne czesci przy renderze
// z testem glebi, metoda z T8):
//   D1. PAS NIE ISTNIAL NA EKRANIE. Bryla 0.190 x 0.034 x 0.112 lezala na
//       y 0.2350-0.2690, czyli w calosci wewnatrz suma zakresow KAFTANA
//       (0.2515-0.4015, 0.192 x 0.114) i DOLU RUBACHY (0.1870-0.2570,
//       0.196 x 0.118), a przy tym byla od obu WEZSZA i PLYTSZA. Nie byla
//       wiec zaslonieta „pod pewnym katem" — byla ZAMKNIETA w sasiadach
//       i dawala 0 px z kazdego kierunku (zmierzone: 0 px przy 2449 px
//       kaftana). Naprawa: 1.10 x 1.16 w poziomie (0.209 x 0.130 — szerzej
//       i glebiej od OBU sasiadow) i przesuniecie na ich styk (y 0.2540).
//       Po naprawie 280 px. Klasa bledu T8/B2 („element istnieje w 3D
//       i ma ZERO pikseli"), tyle ze na ubiorze, nie na twarzy.
//   D1b. Material pasa: TR_BRONZE zamiast TR_WOOD. Sam TR_LEATHER nie
//       rozwiazuje D1, bo kaftan NAD pasem ma dokladnie te sama wartosc
//       0x6b4a28 — pas bylby widoczny geometrycznie i niewidoczny dla oka.
//       Metal na pasie jest w tej ramie uzasadniony tym samym, czym poszycie
//       helmu (K2): to oporzadzenie czlowieka z druzyny, nie z pospolitego
//       ruszenia. TR_WOOD (0x7a5c3a) zostaje przy deskach tarczy, gdzie
//       nazwa stalej odpowiada rzeczy.
//   D2. GLOWICA MIECZA MIALA 0 px. 0.030 x 0.024 x 0.024 przy piesci
//       0.046 x 0.046 x 0.048 — mniejsza od dloni w KAZDYM wymiarze
//       poprzecznym, wiec dlon zakrywala ja w calosci. Naprawa: 2.10 x 2.40
//       poprzecznie (0.063 x 0.058) i cofniecie z -0.016 na -0.020 po osi
//       broni. Po naprawie 334 px. Uzasadnienie ksztaltu w K4.
//   D3. NAZWY I KOTWICE. Przed T10 model mial 0/32 nazwanych mesh i brak
//       `userData.anchors` — czyli byl NIESPRAWDZALNY: zadna asercja nie
//       mogla zaadresowac czesci. Teraz 32/32 z prefiksem `dr-` plus
//       `anchors`, dokladnie jak Berserker i Wojownik germanski po T8.
//   CZEGO T10 NIE ZMIENIL, CHOC SPRAWDZIL: polozenia okucia helmu (K3)
//       i ukladu desek tarczy (K6). Oba maja w tej sekcji jawne wyjasnienie
//       — jedno oparte na pomiarze wariantu alternatywnego, drugie na
//       zakresie tematu.
//
// ===========================================================================
// ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA (Druzynnik)
// ===========================================================================
// RAMA CZASOWA jest ta sama, dwuwarstwowa rama, ktora opisuje juz w tym repo
// `zelazo-jezdziec-oszczepami-opus5.ts` (K1-K3 tamze) — a wiec: (a) opis
// bizantyjski z zewnatrz dla VI-VII w. i (b) material archeologiczny z ziem
// slowianskich dla IX-X w. Druzynnik siedzi w warstwie (b): `units.json`
// nazywa go wprost „elitarny wojownik druzyny ksiecia".
//
// K1. DANE ROZSTRZYGAJA O UZBROJENIU. `units.json` dla „Druzynnik":
//     `Atak 8`, `Obrona 6`, `Pancerz 3`, `Atak dystansowy 0`,
//     `Zasieg ataku (hex) „—"`, `Ilosc pociskow „—"`, `Typ „Swordsman"`,
//     `Kultura „Slowianie"`, `Nazwa EN „Druzhinnik"`, `Uwagi`: „Jednostka
//     specjalna Slowian; elitarny wojownik druzyny ksiecia; piechota lesna".
//     Stad: MIECZ (a nie wlocznia ani oszczep), ZERO broni miotanej w modelu,
//     pancerz LEKKI (kaftan skorzany, bez kolczugi) przy `Pancerz 3`.
// K2. HELM — TYP OD KURHANU CZARNA MOGILA. Kurhan Czarna Mogila w Czernihowie
//     przekopal w latach 1872-73 D. Samokwasow; pochowek datuje sie na
//     schylek X w. Od tego znaleziska bierze nazwe typ helmu w typologii
//     A. Kirpicznikowa, w polskiej literaturze nazywany szyszakiem
//     WIELKOPOLSKIM albo piastowskim; polskie egzemplarze to Giecz, okolice
//     Gniezna, Gorzuchy i Olszowka, X-XI w. Opis konstrukcji: dzwon
//     kulisto-stozkowy z CZTERECH nitowanych blach zelaznych, poszytych
//     blacha ze ZLOCONEJ MIEDZI, u dolu wzmocniony OPASKA („diadem"/„korona"),
//     do ktorej z bokow i z tylu mocowano oslone karku; na szczycie TULEJA na
//     pioropusz; z przodu ornament z trzech lancetowatych lisci, na bocznych
//     segmentach czteroplatkowe rozetki. Wysoki poziom zdobienia wskazuje na
//     wojownikow druzyny ksiazecej. Model niesie z tego: stalowy dzwon
//     stozkowy + okucie w barwie ZLOCONEJ MIEDZI (`TR_BRONZE`), nie „braz"
//     jako stop.
// K3. NOSAL — SWIADOME ODSTEPSTWO, NAZWANE WPROST. Opisy tego typu wymieniaja
//     cztery blachy, poszycie ze zloconej miedzi, dolna opaske i tuleje na
//     pioropusz; NOSALA wsrod cech typu NIE MA (naglowek sprzed T10 twierdzil
//     „helm stozkowy z NOSALEM (czarnomogilski)" — to zdanie bylo nieprawdziwe
//     i zostalo tu poprawione, a nie po cichu przepisane). Bryla nosala
//     zostaje w modelu, bo z kamery gry jest JEDYNYM pionowym punktem
//     odniesienia twarzy: Druzynnik nie ma oczu, poniewaz `trCore(..., eyes)`
//     stawia je na y 0.5450 i z = 0.0680, a okucie helmu zajmuje pas
//     y 0.5340-0.5520 o polszerokosci 0.0750 i dzwon ma w tej wysokosci
//     promien 0.0761 — oczy wypadlyby DOKLADNIE na wysokosci okucia i wewnatrz
//     obu bryl, czyli powtorzylyby blad B2 Berserkera z T8 (oczy z 0 px). Rozwazona i odrzucona
//     alternatywa: zsunac okucie pod podstawe dzwonu (y 0.5240), tam gdzie
//     zrodlo umieszcza opaske — zmierzone: dol okucia minus dol glowy daje
//     pasek twarzy 0.0420, NIE 0.0114 jak twierdzila poprzednia wersja tego
//     zdania (liczba nie odtwarzala sie — poprawiona tu przez Final Control,
//     przeliczona niezaleznie z tych samych stalych geometrii). Wobec
//     dzisiejszych 0.0610 alternatywa daje pasek WEZSZY, nie szerszy — a wiec
//     nie poprawia sytuacji, tylko ja pogarsza, i status quo zostaje z tym
//     poprawionym uzasadnieniem.
// K4. MIECZ I GLOWICA. `Typ „Swordsman"` plus `Atak dystansowy 0` znaczy bron
//     wylacznie do zwarcia. Poza to PCHNIECIE na osi przedramienia, a nie
//     zamach — i przy tym ukladzie cala bron jest z kamery gry widoczna na
//     0.830 swojej dlugosci (zmierzone na lamanej piesc-jelec-klinga-czubek;
//     prog rodziny to 0.60 widocznosci dory Falangity, czyli 0.537). Szeroka glowica (D2) jest
//     cecha rozpoznawcza mieczy tej ramy — glowica rownowazy klinge i jest
//     wyraznie szersza od rekojesci — i po poszerzeniu jest tez jedynym
//     brazowym punktem przy dloni, ktory z kamery gry w ogole widac.
// K5. PAS Z OKUCIAMI (D1b). Metalowe okucia pasa sa w tej ramie elementem
//     oporzadzenia wojownika wyzszej rangi; w modelu decyduje o tym jednak
//     takze POMIAR, nie sama przeslanka historyczna — przy barwie skory pas
//     mial te sama wartosc co kaftan i po naprawie geometrii nadal bylby dla
//     oka niewidoczny. Ta przeslanka jest zapisana WPROST, bo wspoldecydowala.
// K6. DESKI TARCZY — ZNANY MANKAMENT, SWIADOMIE POZA ZAKRESEM T10. Tarcza ma
//     3 deski ulozone PROMIENISCIE (0, +-60 stopni), co z kamery gry czyta sie
//     jako szesciopromienna gwiazda. Wczesnosredniowieczne tarcze okragle
//     skladano — wedle powszechnego opisu — z desek ROWNOLEGLYCH, nie
//     promienistych; to twierdzenie jest tu rzedem 4 (§13a) i NIE zostalo
//     w tej sesji potwierdzone w zrodle wyzszego rzedu, wiec idzie do rejestru
//     jako zgloszenie do sprawdzenia, a nie od razu do kodu. Poprawka NIE wchodzi
//     w T10, bo `zelazo-jezdziec-oszczepami-opus5.ts` powtarza dokladnie ten
//     sam uklad (`for (const a of [0, Math.PI / 3, -Math.PI / 3])`, tamze
//     ok. linii 1190) i powoluje sie na Druzynnika jako na kanon kulturowy
//     (K8/K12 tamze). Zmiana tylko tutaj ROZJECHALABY oba modele, a plik T4
//     jest w allowliscie T10 wylacznie na wypadek synchronizacji stalych
//     koloru. To jest zgloszenie do osobnego tematu, nie przeoczenie.
// K7. CZEGO SWIADOMIE NIE MA: kolczugi i naramiennikow (`Pancerz 3`), brody
//     (kanon repo dla Slowianina to WASY bez brody), tulei z pioropuszem na
//     szczycie helmu (jest w opisie typu, ale na tokenie tej wielkosci
//     dodalaby pionowa bryle myloco podobna do pioropusza iButho i Impi),
//     broni miotanej (`Atak dystansowy 0`).
//
// ZRODLA. Rzad 1-2 wg `R-PROC-AUTOBOT.md` §13a: `gra/data/units.json`
// (dane jednostki) oraz `gra/src/render/zelazo-jezdziec-oszczepami-opus5.ts`
// (kanon kulturowy Slowian w tym repo). Rzad 3-4, i tak sa tu OZNACZONE:
// opracowania muzealne i encyklopedyczne o szyszakach wielkopolskich
// (Giecz, Gniezno, Gorzuchy, Olszowka) oraz o kurhanie Czarna Mogila —
// zgodne co do konstrukcji (cztery blachy, zlocona miedz, dolna opaska,
// tuleja na pioropusz) i milczace co do nosala. Zadnej z tych pozycji nie
// udalo sie odczytac w oryginale z tej sesji, wiec numery stron i sygnatury
// NIE sa tu podawane — swiadomie, zeby nie powtorzyc bledu blednej lokalizacji
// cytatu z T8.
// ---------------------------------------------------------------------------
export function buildDruzynnik(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();
  const PF = 'dr';

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
  trCore(group, mat, mLinen, TR_SKIN, false, PF);
  const kaftan = new THREE.Mesh(getGTRKaftan(), mLeath);
  kaftan.position.set(0, TR_TORSO_CTR - 0.016 * HEX_R, 0);
  kaftan.name = PF + '-kaftan';
  group.add(kaftan);
  const skirt = new THREE.Mesh(getGTRSkirt(), mLinen);   // dol rubachy
  skirt.position.set(0, TR_TORSO_BOT - 0.018 * HEX_R, 0);
  skirt.name = PF + '-skirt';
  group.add(skirt);
  // PAS. Do T10 lezal na y = 0.252 w NIEZMIENIONEJ skali (0.190 x 0.034 x 0.112),
  // czyli byl WEZSZY i PLYTSZY od kaftana (0.192 x 0.114) nad nim i od dolu
  // rubachy (0.196 x 0.118) pod nim, a jego zakres Y (0.2350-0.2690) miescil
  // sie w calosci w sumie ich zakresow (0.1870-0.4015). Bryla byla wiec
  // ZAMKNIETA w sasiadach z KAZDEGO kierunku i dawala 0 PIKSELI z kamery gry
  // (pomiar T10: `pas` 0 px przy 2449 px kaftana i 423 px dolu rubachy).
  // Teraz pas jest SZERSZY i GLEBSZY od obu sasiadow i siedzi na ich styku.
  // Material BRAZOWY, nie skorzany: pas druzynnika to rzemien gesto obity
  // metalowymi okuciami (K5), a przy TR_LEATHER pas mialby DOKLADNIE ten sam
  // kolor co kaftan nad nim — bylby wtedy widoczny geometrycznie i niewidoczny
  // dla oka, czyli defekt tylko przesuniety, nie naprawiony.
  const belt = new THREE.Mesh(getGTRBelt(), mBronz);
  belt.scale.set(1.10, 1.0, 1.16);                       // 0.209 x 0.034 x 0.130
  belt.position.set(0, 0.2540 * HEX_R, 0);
  belt.name = PF + '-belt';
  group.add(belt);

  // nogi: welniane nogawice, skorzane buty; LEWA (+X) wykroczna
  trBuildLeg(group,  TR_HIP_X,  0.58,  0.34, mWool, mWool, mLeath, HIP_Y, PF, 'left');
  trBuildLeg(group, -TR_HIP_X, -0.52, -0.20, mWool, mWool, mLeath, HIP_Y, PF, 'right');

  // WASY (obowiazkowe!) — ciemnoblond, opadajace.
  // `trWasy` jest WSPOLNE z Miecznikiem galijskim (osobny temat serii), wiec
  // T10 NIE dokleja mu parametru nazwy — nazwy nadajemy po fakcie tym mesh,
  // ktore helper wlasnie dolozyl. Geometria i pozycje bez zmiany.
  const nBefore = group.children.length;
  trWasy(group, mHair);
  for (let i = nBefore; i < group.children.length; i++) {
    group.children[i]!.name = PF + '-moustache-' + (i - nBefore);
  }

  // HELM: stalowy dzwon stozkowy + okucie ze ZLOCONEJ MIEDZI + nosal.
  // Geometria i polozenie BEZ ZMIAN wobec stanu sprzed T10 — sprawdzone
  // i swiadomie zostawione, patrz K3: proba zsuniecia okucia pod podstawe
  // dzwonu (y 0.5240), tam gdzie zrodlo umieszcza opaske wzmacniajaca dol,
  // zostawia miedzy okuciem a broda pasek twarzy 0.0420, WEZSZY niz
  // dzisiejsze 0.0610, nie 0.0114 (poprawione przez Final Control — liczba
  // sprzed poprawki nie odtwarzala sie) — audyt nie wymienia jednego defektu
  // na drugi.
  const helm = new THREE.Mesh(getGTRConeHelm(), mSteel);
  helm.position.set(0, TR_HEAD_CTR + 0.052 * HEX_R, 0);
  helm.name = PF + '-helmet-cone';
  group.add(helm);
  const rim = new THREE.Mesh(getGTRHelmRim(), mBronz);
  rim.position.set(0, TR_HEAD_CTR + 0.006 * HEX_R, 0);
  rim.name = PF + '-helmet-band';
  group.add(rim);
  const nosal = new THREE.Mesh(getGTRNosal(), mSteel);
  nosal.position.set(0, TR_HEAD_CTR - 0.006 * HEX_R, TR_HEAD_S * 0.5 + 0.008 * HEX_R);
  nosal.name = PF + '-helmet-nasal';
  group.add(nosal);

  // PRAWE (-X) RAMIE + MIECZ: pchniecie w przod na osi przedramienia
  const armR = trBuildArm(group, -TR_SHLD_X, 0.95, 1.50, mLinen, mSkin, mLeath, PF, 'right');
  const ax = armR.axis;
  const guard = new THREE.Mesh(getGTRGuard(), mBronz);
  guard.rotation.x = Math.PI - 1.50;
  guard.position.copy(armR.wrist.clone().addScaledVector(ax, 0.030 * HEX_R));
  guard.name = PF + '-sword-guard';
  group.add(guard);
  const blade = new THREE.Mesh(getGTRBlade(), mSteel);
  blade.rotation.x = Math.PI - 1.50;
  blade.position.copy(armR.wrist.clone().addScaledVector(ax, 0.108 * HEX_R));
  blade.name = PF + '-sword-blade';
  group.add(blade);
  const tip = new THREE.Mesh(getGTRBladeTip(), mSteel);
  tip.rotation.x = Math.PI - 1.50;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(armR.wrist.clone().addScaledVector(ax, 0.204 * HEX_R));
  tip.name = PF + '-sword-tip';
  group.add(tip);
  // GLOWICA. Do T10 miala 0.030 x 0.024 x 0.024 przy piesci 0.046 x 0.046 x 0.048,
  // czyli byla MNIEJSZA od dloni w KAZDYM wymiarze poprzecznym i dawala
  // 0 PIKSELI z kamery gry. Szeroka glowica typu X/S jest w tej rodzinie mieczy
  // cecha rozpoznawcza (K4), wiec zamiast usuwac bryle — poszerzamy ja tak, by
  // wystawala poza obrys piesci.
  const pommel = new THREE.Mesh(getGTRPommel(), mBronz);
  pommel.rotation.x = Math.PI - 1.50;
  pommel.scale.set(2.10, 1.0, 2.40);                     // 0.063 x 0.024 x 0.058
  pommel.position.copy(armR.wrist.clone().addScaledVector(ax, -0.020 * HEX_R));
  pommel.name = PF + '-sword-pommel';
  group.add(pommel);

  // LEWE (+X) RAMIE + OKRAGLA TARCZA przed korpusem
  const armL = trBuildArm(group, TR_SHLD_X, 0.50, 1.10, mLinen, mSkin, null, PF, 'left');
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.025 * HEX_R,
    armL.wrist.y + 0.034 * HEX_R,
    armL.wrist.z + 0.045 * HEX_R,
  );
  sh.rotation.y = -0.22;
  const face = new THREE.Mesh(getGTRRndFace(), mOwner);   // POLE = KOLOR GRACZA
  face.rotation.x = Math.PI / 2;
  face.name = PF + '-shield-face';
  sh.add(face);
  const rimS = new THREE.Mesh(getGTRRndRim(), mLeath);    // skorzany rant
  rimS.rotation.x = Math.PI / 2;
  rimS.position.set(0, 0, -0.006 * HEX_R);
  rimS.name = PF + '-shield-rim';
  sh.add(rimS);
  let pi = 0;
  for (const a of [0, Math.PI / 3, -Math.PI / 3]) {       // 3 deski PROMIENISTE
    const pl = new THREE.Mesh(getGTRPlank(), mWood);
    pl.rotation.z = a;
    pl.position.set(0, 0, 0.016 * HEX_R);
    pl.name = PF + '-shield-plank-' + pi++;
    sh.add(pl);
  }
  const umbo = new THREE.Mesh(getGTRUmbo(), mSteel);      // stalowe UMBO
  umbo.rotation.x = Math.PI / 2;
  umbo.position.set(0, 0, 0.028 * HEX_R);
  umbo.name = PF + '-shield-umbo';
  sh.add(umbo);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  group.userData['anchors'] = {
    hexR: HEX_R,
    headTopY: TR_HEAD_TOP, headCtrY: TR_HEAD_CTR,
    torsoTopY: TR_TORSO_TOP, torsoBotY: TR_TORSO_BOT,
    torsoHalfW: TR_TORSO_W * 0.5, torsoHalfD: TR_TORSO_D * 0.5,
    hipY: HIP_Y, shoulderY: TR_SHLD_Y, shoulderX: TR_SHLD_X,
    grip: armR.wrist.toArray(),
    weaponAxis: ax.toArray(),
    weaponKind: 'sword-thrust',
    missileKind: 'none',
    shieldKind: 'round-slavic',
    helmetKind: 'conical-banded',
    armorKind: 'leather-kaftan',
    faceOpen: false,
    ownerColorOn: 'shield-face',
  };
  return group;
}

// ---------------------------------------------------------------------------
// iBUTHO Z IKLWA (Zulusi, ZELAZO) — POZA: gleboki wypad, pchniecie iklwa
// ZELAZNY KREWNY Impi (P57): ta sama anatomia bazowa, ale INNA SYLWETKA —
// tarcza pelnej dlugosci (isihlangu) niesiona wysoko i CIEMNA (brazowo-czarna
// laciata), WYZSZY i szerszy pioropusz (3 piora), wieksze isicoco, KROTSZA
// iklwa o proporcjach broni klujacej, NASZYJNIK KLOW przesuniety na strone
// bronna, amashoba tylko na ramionach, klapa spodnicy = KOLOR GRACZA + romb
// gracza na tarczy. Stopy na y = 0. Prefiks mesh: `ib-`.
//
// T10 — CO ZMIENIONO I DLACZEGO (pomiar w zywym Chromium, kamera gry:
// azymut 0, elewacja 52 stopnie):
//   I1. DWIE JEDNOSTKI, JEDNA FIGURKA. Odroznialnosc pikselowa iButho/Impi
//       (metoda T5-T8: udzial pikseli rozniacych sie pokryciem albo barwa
//       o >= 40/255 w sumie obrysow pary) wynosila 0.370 przy progu rodziny
//       0.558 — progu, ktory jest WYNIKIEM naprawy pary elita/liniowa w T6
//       i ktorego trzymaly sie T7 i T8. Sama SYLWETKA (bez koloru) roznila
//       sie w 3.5%: 96.5% obrysu obu jednostek bylo wspolne. Przyczyna jest
//       policzalna: cztery katy nog i cztery katy rak byly co do cyfry te
//       same co u Impi, tarcza miala te sama bryle i to samo polozenie,
//       a bron — te sama geometrie (patrz I2). Po T10: 0.589 przy progu
//       0.558, sylwetka 18.8%. Nosniki roznicy sa nazwane w K9-K11.
//   I2. „IKLWA" BYLA KOPIA 1:1 WLOCZNI IMPI. Te same trzy bryly, te same trzy
//       odsuniecia po osi przedramienia (0.055 / 0.225 / 0.295); roznil je
//       WYLACZNIE material grotu (zelazo zamiast brazu). Dlugosc calkowita
//       0.3820 przy wysokosci figury do ciemienia 0.6010, czyli 0.64 wzrostu.
//       Zrodlowe proporcje iklwy (K7) daja ok. 0.52 wzrostu. Po skroceniu
//       drzewca (0.240 -> 0.2088) i przesunieciu zeleza: 0.3324, czyli 0.55.
//       Chwyt zostal przy pietce: 0.0784 drzewca ZA dlonia wobec 0.2540 calej
//       broni PRZED nia — czyli tam, gdzie trzyma sie bron do PCHNIECIA,
//       a nie w punkcie rownowagi, jak bron do rzutu
//       (`Atak dystansowy 0`, `Ilosc pociskow „—"` w `units.json`).
//   I3. TWARZ BEZ OCZU przy braku czegokolwiek, co by ja zaslanialo. Plik ma
//       na to jawna konwencje — `trCore(..., eyes = true)` — wprowadzona w T8
//       wlasnie dlatego, ze oczy Berserkera mialy 0 px. iButho jej nie
//       uzywal, choc isicoco to obrecz NAD glowa, nie helm. Teraz 48 px
//       na oko.
//   I4. NAZWY I KOTWICE: przed T10 0/37 nazwanych mesh i brak
//       `userData.anchors`, czyli model byl niesprawdzalny — zadna asercja
//       nie mogla zaadresowac czesci. Teraz 39/39 z prefiksem `ib-` plus
//       `anchors` (39, bo doszly dwa OCZY z I3).
//   I5. SKUTEK UBOCZNY NAPRAWY, ZLAPANY POMIAREM: tarcza pelnej dlugosci
//       niesiona wysoko zakryla naszyjnik klow (2 z 3 klow spadly na 0 i 13
//       px) oraz amashoba lewego ramienia (8 px). Kly przesunieto na strone
//       bronna (-X), amashoba wyzej i na zewnatrz. Po poprawce 63 / 64 / 8 px
//       na kly i 362 px na amashoba. Zero pikseli maja u iButho wylacznie te
//       czesci, ktore maja zero takze u Impi (szyja, oba uda, lewe
//       przedramie) — audyt nie zostawil po sobie NOWEJ martwej bryly.
//
// ===========================================================================
// ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA (iButho z iklwa)
// ===========================================================================
// K1. DANE. `units.json` dla „iButho z iklwa": `Atak 5`, `Obrona 7`,
//     `Pancerz 4`, `Atak dystansowy 0`, `Zasieg ataku (hex) „—"`,
//     `Ilosc pociskow „—"`, `Typ „Spearman"`, `Ruch 4`,
//     `Bonus vs Mount 50%`, `W zamian za „Impi"`, `Kultura „Zulusi"`,
//     `Nazwa EN „iButho with iklwa"`, `Uwagi`: „Zelazna ewolucja Impi;
//     iklwa + tarcza; szybsza piechota liniowa". Rozstrzyga to trzy rzeczy:
//     bron jest WYLACZNIE do zwarcia, tarcza jest obowiazkowa, a jednostka
//     ma byc od Impi ODROZNIALNA, bo jest jego zamiennikiem w tym samym
//     drzewie. `Obrona 7` wobec `Obrona 6` Impi to GLOWNA roznica w
//     nazwanych statystykach obronnych (`Pancerz 4` maja OBIE jednostki
//     identycznie) — w modelu odpowiada jej wieksza tarcza (K9). Nie jest to
//     jedyna roznica danych w ogole: warstwa runtime `units.json` niesie
//     dodatkowo Impi `health: 36`/`armor: 3` wobec iButho `health: 29` i
//     brakiem klucza `armor` w ogole — rozjazd zastany, spoza zakresu T10,
//     zgloszony do rejestru (patrz raport Final Control tego audytu).
// K2. NAJTRUDNIEJSZY PUNKT: CHRONOLOGIA. Iklwa i system pulkow (amabutho)
//     w formie, ktora znamy, to reforma Szaki — panowal ok. 1816-1828, wiec
//     POCZATEK XIX w., a nie „epoka zelaza" w europejskim sensie. To jest
//     rozjazd i nie wolno go zamiatac pod dywan. Rozstrzygniecie (Operator,
//     §10 kanonu — watpliwosc historyczna, nie decyzja wlasciciela) jest
//     trojczlonowe: (i) „Zelazo" jest w tej grze POZIOMEM TECHNOLOGICZNYM
//     (`Tech „Hutnictwo zelaza"`), nie data — ta sama epoka trzyma razem
//     Rzym, Celtow, Germanow i Slowian, ktorych dzieli po kilkaset lat;
//     (ii) samo ZELAZO u ludow Nguni nie jest tu anachronizmem: rolnicy
//     wczesnej epoki zelaza sa w samym KwaZulu-Natal poswiadczeni
//     radiowegielowo juz w III-IV w. n.e. (Mzonjani ok. 280 n.e., Enkwazini
//     ok. 300 i 410 n.e.), a szerzej w regionie (Limpopo, Mozambik) ceramika
//     tradycji Silver Leaves/Matola ok. 250-430 n.e. daje to samo tlo
//     chronologiczne, wiec zelazny grot na wojowniku Nguni jest z ta rama
//     zgodny; (iii) anachroniczna
//     jest WYLACZNIE konkretna FORMA — iklwa i regiment — i to jest swiadome
//     uogolnienie warstwy DANYCH gry, nie blad modelu. Model odwzorowuje
//     panoplie poswiadczona etnograficznie, bo tylko ona jest opisana;
//     alternatywa („zmyslic wczesniejsza, bezpieczna wlocznie") zostala
//     rozwazona i ODRZUCONA jako gorsza: wymyslona bron nie jest bardziej
//     prawdziwa niz udokumentowana bron o zlej dacie.
// K7. IKLWA — PROPORCJE Z OPISU, NIE Z OKA. Opracowania zgodnie opisuja
//     krotka bron do pchniecia rozpowszechniona za Szaki: drzewce rzedu
//     610 mm (24 cale) i SZEROKI grot rzedu 300 mm (12 cali). Warianty opisu
//     roznia sie w szczegolach — inne podaja grot ok. 8 cali o szerokosci
//     ponad 1,5 cala na drzewcu 30 cali, albo drzewce 2 stop i grot 1 stopy —
//     i ta rozbieznosc jest tu zapisana zamiast wybrania jednej liczby jako
//     „tej prawdziwej". Wspolne dla wszystkich wariantow, i to niesie model,
//     jest jedno: KROTKIE drzewce oraz grot SZEROKI i DLUGI wobec drzewca,
//     czyli przeciwienstwo dlugiego oszczepu do rzutu. Nazwa jest
//     onomatopeja — od dzwieku wyciagania zeleza z rany. W modelu: drzewce
//     0.2088, zelazo (grot + czubek) od 0.138 do 0.268 po osi broni, czyli
//     0.130 dlugosci — 0.62 dlugosci drzewca przy zrodlowych ok. 0.49.
// K8. DLACZEGO NIE ZWEZONO GROTU. Stosunek szerokosci grotu do drzewca
//     wynosi w modelu 0.036/0.018 = 2.0, a w opisie zrodlowym ok. 1,5.
//     Model jest SZERSZY swiadomie: „szeroki grot" jest cecha DEFINIUJACA te
//     bron, a przy tokenie tej wielkosci proporcja 1,5 sprowadza grot do
//     paru pikseli i przestaje go odrozniac od drzewca. Przesada w te strone
//     jest mniejszym bledem niz utrata cechy — i jest tu nazwana, nie ukryta.
// K9. TARCZA — ISIHLANGU, NIE MNIEJSZA. Tarcze wojenne Zulusow wystepuja
//     w dwoch rozmiarach: duza `isihlangu` (ok. 5 stop, ok. 1,5 m), opisana
//     jako tarcza z wyboru Szaki i uzywana takze zaczepnie, do zahaczania
//     tarczy przeciwnika, oraz mniejsza i solidniejsza `umbumbuluzo`
//     (ok. 3,5 stopy, ok. 1,1 m), poswiadczona w uzyciu w 1856 r. w kampanii
//     Cetshwayo przeciw Mbulaziemu. Skala w modelu jest PRZELICZONA, nie
//     dobrana na oko: figura ma do ciemienia 0.6010 przy wojowniku ok. 1,75 m,
//     wiec 1,5 m to ok. 0.515 — a tarcza odziedziczona po Impi miala 0.410.
//     Stad `ISI = 1.25` (0.512). Tarcza jest tez niesiona WYZEJ, bo tarcza
//     pelnej dlugosci kryje od podbrodka po golen, a nie sam bok korpusu.
// K10. BARWA TARCZY — ODSTEPSTWO NAZWANE WPROST. U Zulusow barwa tarczy
//     niosla informacje o starszenstwie pulku: pulki starsze (zonate) mialy
//     tarcze biale, mlodsze — czarne, przy czym w latach 70. XIX w. zasada
//     byla przestrzegana juz luzniej. Naglowek sprzed T10 twierdzil, ze
//     CIEMNA tarcza oznacza „starszy regiment" i „wieksza dyscypline" — to
//     jest ODWROCENIE tej zasady i zdanie zostalo usuniete jako nieprawdziwe.
//     Ciemna tarcza ZOSTAJE, ale z poprawnym odczytem: iButho czyta sie
//     wtedy jako pulk MLODY, a `units.json` nigdzie nie twierdzi, ze jest
//     starszy — „Zelazna ewolucja Impi" mowi o miejscu w drzewie technologii,
//     nie o wieku wojownikow. Drugi powod, tez jawny, jest techniczny: jasna
//     tarcza jest juz zajeta przez Impi (P57), a dwie jasne tarcze cofnelyby
//     odroznialnosc pary ponizej progu (I1).
// K11. POZOSTALE NOSNIKI ODROZNIALNOSCI, wszystkie z tego samego, opisanego
//     stroju: WYZSZY i szerszy pioropusz (piora 0.221 wobec 0.130 u Impi),
//     WIEKSZE isicoco — obrecz na glowie noszona przez mezczyzn zonatych,
//     a wiec nosnik rangi, nie ozdoba — oraz GLEBSZY wypad. Zaden nie jest
//     cecha wymyslona „dla roznicy": kazdy jest elementem tej samej panoplii,
//     dobranym tak, zeby para tokenow rozjezdzala sie na ekranie.
// K12. CZEGO SWIADOMIE NIE MA: amashoba na lydkach (ma je Impi — zostawienie
//     ich obu jednostkom kosztowaloby odroznialnosc), zadnej broni miotanej
//     (`Atak dystansowy 0` — mimo ze historycznie ten sam wojownik nosil tez
//     lekkie oszczepy do rzutu; przy konflikcie zrodla z danymi jednostki
//     wiazace sa DANE), zadnego helmu ani pancerza (`Pancerz 4` pochodzi
//     w tej jednostce z TARCZY, nie ze zbroi — Zulusi zbroi nie nosili).
//
// ZRODLA. Rzad 1-2 wg `R-PROC-AUTOBOT.md` §13a: `gra/data/units.json` (dane
// obu jednostek) i `gra/src/render/jednostki-p57-wlocznie-machiny.ts` (bratni
// model Impi — punkt odniesienia kazdego pomiaru w I1-I5). Rzad 3-4, i tak sa
// tu OZNACZONE: opracowania o uzbrojeniu i organizacji wojska Zulusow (m.in.
// prace Iana Knighta o armii zuluskiej 1879 r.) oraz hasla encyklopedyczne
// o assegai/iklwie i o tarczy nguni — stad wymiary iklwy, nazwy i wymiary
// obu tarcz, data kampanii 1856 r. i zasada barwy tarcz wedle starszenstwa;
// osobno datowania radiowegielowe wczesnej epoki zelaza w KwaZulu-Natal
// (Mzonjani, Enkwazini) oraz ceramike tradycji Silver Leaves/Matola z
// szerszego regionu (Limpopo, Mozambik) dla K2. Zadnego z tych
// opracowan nie udalo sie odczytac w oryginale z tej sesji, wiec numery stron
// i sygnatury NIE sa podawane — swiadomie, zeby nie powtorzyc bledu blednej
// lokalizacji cytatu z T8.
// ---------------------------------------------------------------------------
export function buildIButho(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();
  const PF = 'ib';
  // ISIHLANGU — skala tarczy wobec bryly odziedziczonej po Impi (K9).
  const ISI = 1.25;

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

  // korpus: NAGI tors (ciemna skora jak Impi) + OCZY.
  // Twarz iButho jest ODKRYTA — isicoco to obrecz NAD glowa, nie helm — a plik
  // ma na taki przypadek jawna konwencje (`trCore(..., eyes = true)`, wprowadzona
  // przy Berserkerze, gdzie brak oczu dawal 0 pikseli twarzy z kamery gry).
  // iButho jej nie uzywal, choc nie ma nic, co by twarz zaslanialo.
  trCore(group, mat, mSkin, TR_SKIN_ZULU, true, PF);

  // spodnica futrzana + przednia klapa KOLORU GRACZA (konwencja Impi)
  const skirt = new THREE.Mesh(getGTRSkirt(), mFur);
  skirt.position.set(0, TR_TORSO_BOT - 0.018 * HEX_R, 0);
  skirt.name = PF + '-skirt';
  group.add(skirt);
  const flap = new THREE.Mesh(getGTRFringe(), mOwner);
  flap.scale.set(1.30, 1.35, 1.0);
  flap.position.set(0, TR_TORSO_BOT - 0.046 * HEX_R, 0.062 * HEX_R);
  flap.name = PF + '-skirt-flap';
  group.add(flap);

  // NASZYJNIK KLOW: rzemien + 3 kly (ostrzem w dol) na piersi
  const band = new THREE.Mesh(getGTRNeckBand(), mLeath);
  band.position.set(0, TR_TORSO_TOP - 0.006 * HEX_R, 0.014 * HEX_R);
  band.name = PF + '-necklace-band';
  group.add(band);
  for (const s of [-1, 0, 1]) {
    const t = new THREE.Mesh(getGTRTooth(), mIvory);
    t.rotation.x = Math.PI;                       // ostrzem w dol
    t.rotation.y = Math.PI / 4;
    // Kly przesuniete na strone BRONNA (-X). Tarcza pelnej dlugosci (K9) kryje
    // z kamery gry lewa polowe piersi: przy ukladzie symetrycznym (-0.036, 0,
    // +0.036) dwa z trzech klow renderowaly sie na 0 i 13 pikseli.
    t.position.set((s * 0.032 - 0.034) * HEX_R, TR_TORSO_TOP - 0.036 * HEX_R, TR_TORSO_D * 0.5 + 0.012 * HEX_R);
    t.name = PF + '-necklace-tooth-' + (s + 1);
    group.add(t);
  }

  // nogi (nagie, BEZ amashoba lydek — dyscyplina zelaznego regimentu).
  // POZA. Do T10 CZTERY katy nog i CZTERY katy rak byly co do cyfry te same co
  // u Impi z serii P57 — dwie jednostki tej samej kultury stały w identycznym
  // rozkroku, z rekami w identycznym ustawieniu. Wypad iButho jest GLEBSZY
  // i DLUZSZY: to jednostka o `Obrona 7` (Impi 6), ktora wchodzi w zwarcie
  // tarcza naprzod, a iklwa dziala z bliska (K7), nie z wyciagnietego ramienia.
  trBuildLeg(group,  TR_HIP_X,  0.88,  0.54, mSkin, mSkin, mSkin, HIP_Y, PF, 'left');
  trBuildLeg(group, -TR_HIP_X, -0.58, -0.24, mSkin, mSkin, mSkin, HIP_Y, PF, 'right');

  // isicoco + WYZSZY pioropusz: 3 piora (czarne skrzydla + biel zurawia) + czub
  const coco = new THREE.Mesh(getGTRIsicoco(), mBlack);
  coco.scale.set(1.22, 1.35, 1.22);
  coco.position.set(0, TR_HEAD_TOP + 0.012 * HEX_R, 0);
  coco.name = PF + '-isicoco';
  group.add(coco);
  for (const s of [-1, 0, 1]) {
    const f = new THREE.Mesh(getGTRFeather(), s === 0 ? mCrane : mBlack);
    f.rotation.z = s * 0.26;
    f.rotation.x = -0.10;
    f.scale.set(1.0, 1.30, 1.0);
    f.position.set(s * 0.040 * HEX_R, TR_HEAD_TOP + (s === 0 ? 0.118 : 0.104) * HEX_R, -0.024 * HEX_R);
    f.name = PF + '-plume-' + (s + 1);
    group.add(f);
  }

  // PRAWE (-X) RAMIE + IKLWA (grot ZELAZNY) + amashoba ramienia.
  //
  // IKLWA, NIE OSZCZEP DO RZUTU (K7). Do T10 ta bron byla kopia 1:1 geometrii
  // wlocni Impi z serii P57 — te same trzy bryly, te same trzy odsuniecia po osi
  // przedramienia (0.055 / 0.225 / 0.295), roznil je WYLACZNIE material grotu.
  // Zmierzona dlugosc calkowita (od pietki drzewca do czubka) wynosila 0.3820
  // przy wysokosci figury do ciemienia 0.6010, czyli 0.64 wzrostu; iklwa ma
  // proporcje 610 mm drzewca + ok. 300 mm zeleza na wojownika ok. 1,75 m,
  // czyli ok. 0,52 wzrostu (K7). Drzewce jest wiec KROTSZE, a chwyt zostaje
  // przy pietce — tak trzyma sie bron do PCHNIECIA, nie do rzutu.
  const armR = trBuildArm(group, -TR_SHLD_X, 1.22, 1.62, mSkin, mSkin, mSkin, PF, 'right');
  const shR = new THREE.Mesh(getGTRShoba(), mFurLt);
  shR.rotation.x = Math.PI - 1.22;
  shR.position.set(-TR_SHLD_X, TR_SHLD_Y - 0.030 * HEX_R, 0.030 * HEX_R);
  shR.name = PF + '-amashoba-right';
  group.add(shR);
  const ax = armR.axis;
  const shaft = new THREE.Mesh(getGTRIklwaShaft(), mWood);
  shaft.rotation.x = Math.PI - 1.62;
  shaft.scale.set(1.0, 0.87, 1.0);                        // 0.2088 zamiast 0.240
  shaft.position.copy(armR.wrist.clone().addScaledVector(ax, 0.040 * HEX_R));
  shaft.name = PF + '-iklwa-shaft';
  group.add(shaft);
  const blade = new THREE.Mesh(getGTRIklwaBlade(), mIron);
  blade.rotation.x = Math.PI - 1.62;
  blade.position.copy(armR.wrist.clone().addScaledVector(ax, 0.183 * HEX_R));
  blade.name = PF + '-iklwa-blade';
  group.add(blade);
  const tipI = new THREE.Mesh(getGTRIklwaTip(), mIron);
  tipI.rotation.x = Math.PI - 1.62;
  tipI.rotation.y = Math.PI / 4;
  tipI.position.copy(armR.wrist.clone().addScaledVector(ax, 0.246 * HEX_R));
  tipI.name = PF + '-iklwa-tip';
  group.add(tipI);

  // LEWE (+X) RAMIE + CIEMNA TARCZA NGUNI + amashoba ramienia
  const armL = trBuildArm(group, TR_SHLD_X, 0.72, 1.28, mSkin, mSkin, null, PF, 'left');
  const shL = new THREE.Mesh(getGTRShoba(), mFurLt);
  shL.rotation.x = Math.PI - 0.72;
  shL.position.set(TR_SHLD_X + 0.020 * HEX_R, TR_SHLD_Y - 0.014 * HEX_R, 0.010 * HEX_R);
  shL.name = PF + '-amashoba-left';
  group.add(shL);
  // Tarcza PELNEJ DLUGOSCI niesiona wyzej i blizej osi figury: isihlangu kryje
  // wojownika od podbrodka po golen (K9), a nie tylko bok korpusu, jak mniejsza
  // tarcza Impi. To takze glowny nosnik ODROZNIALNOSCI obu jednostek z kamery
  // gry (K10) — przed T10 obie tarcze mialy te sama bryle i te sama pozycje.
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.040 * HEX_R,
    armL.wrist.y + 0.100 * HEX_R,
    armL.wrist.z + 0.042 * HEX_R,
  );
  sh.rotation.y = -0.18;
  const shell = new THREE.Mesh(getGTRNguniShell(), mLeath);
  shell.scale.set(ISI, ISI, 1.0);
  shell.name = PF + '-shield-shell';
  sh.add(shell);
  const face = new THREE.Mesh(getGTRNguniFace(), mHide);   // CIEMNY braz
  face.scale.set(ISI, ISI, 1.0);
  face.position.set(0, 0, 0.010 * HEX_R);
  face.name = PF + '-shield-face';
  sh.add(face);
  const p1 = new THREE.Mesh(getGTRPatchBig(), mBlack);     // CZARNE laty
  p1.rotation.z = 0.30;
  p1.scale.set(ISI, ISI, 1.0);
  p1.position.set(-0.030 * ISI * HEX_R, 0.088 * ISI * HEX_R, 0.016 * HEX_R);
  p1.name = PF + '-shield-patch-0';
  sh.add(p1);
  const p2 = new THREE.Mesh(getGTRPatchBig(), mBlack);
  p2.rotation.z = -0.42;
  p2.scale.set(ISI, ISI, 1.0);
  p2.position.set(0.026 * ISI * HEX_R, -0.086 * ISI * HEX_R, 0.016 * HEX_R);
  p2.name = PF + '-shield-patch-1';
  sh.add(p2);
  const p3 = new THREE.Mesh(getGTRPatchSm(), mBlack);
  p3.rotation.z = 0.55;
  p3.scale.set(ISI, ISI, 1.0);
  p3.position.set(0.040 * ISI * HEX_R, 0.020 * ISI * HEX_R, 0.016 * HEX_R);
  p3.name = PF + '-shield-patch-2';
  sh.add(p3);
  const dia = new THREE.Mesh(getGTRDiamond(), mOwner);     // romb gracza
  dia.rotation.z = Math.PI / 4;
  dia.scale.set(1.25, 1.25, 1.0);
  dia.position.set(0, 0, 0.022 * HEX_R);
  dia.name = PF + '-shield-diamond';
  sh.add(dia);
  const mgobo = new THREE.Mesh(getGTRMgobo(), mWood);
  mgobo.scale.set(1.0, ISI, 1.0);
  mgobo.position.set(0, 0.010 * ISI * HEX_R, -0.014 * HEX_R);
  mgobo.name = PF + '-shield-mgobo';
  sh.add(mgobo);
  const tuft = new THREE.Mesh(getGTRMgoboTuft(), mFurLt);
  tuft.scale.set(1.45, 1.45, 1.45);
  tuft.position.set(0, 0.278 * ISI * HEX_R, -0.014 * HEX_R);
  tuft.name = PF + '-shield-mgobo-tuft';
  sh.add(tuft);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  group.userData['anchors'] = {
    hexR: HEX_R,
    headTopY: TR_HEAD_TOP, headCtrY: TR_HEAD_CTR,
    torsoTopY: TR_TORSO_TOP, torsoBotY: TR_TORSO_BOT,
    torsoHalfW: TR_TORSO_W * 0.5, torsoHalfD: TR_TORSO_D * 0.5,
    hipY: HIP_Y, shoulderY: TR_SHLD_Y, shoulderX: TR_SHLD_X,
    grip: armR.wrist.toArray(),
    weaponAxis: ax.toArray(),
    weaponKind: 'iklwa-thrust',
    missileKind: 'none',
    shieldKind: 'nguni-isihlangu',
    helmetKind: 'none',
    armorKind: 'none',
    faceOpen: true,
    ownerColorOn: 'shield-diamond+skirt-flap',
  };
  return group;
}

// ---------------------------------------------------------------------------
// BERSERKER GERMANSKI (Germanie, ZELAZO) — POZA: topor odwiedziony za bark
// `units.json`: Atak 10 / Obrona 2 / PANCERZ 0 / Atak dystansowy 0, Uwagi:
// „obnażona pierś, skóra wilka/niedźwiedzia (łeb zwierzęcia na głowie), topór
// lub miecz, BEZ TARCZY; szał bojowy". Model niesie DOKLADNIE to: goly tors,
// BARWNIK w kolorze gracza na piersi (jedyny nosnik koloru gracza — jednostka
// nie ma tarczy, na ktorej normalnie siedzi to pole), skora zwierzeca na
// plecach, LEB WILKA na ciemieniu (kaptur + kufa + uszy), rozwiane wlosy,
// przepaska biodrowa, BOSE nogi w skorzanych butach, szeroki TOPOR w PRAWEJ
// (-X) dloni, LEWA (+X) reka PUSTA. ZERO zbroi, ZERO helmu, ZERO tarczy.
// Prefiks mesh: `bs-`.
//
// T8 — SKAD SIE WZIAL TEN BUILDER. Do T8 „Berserker germanski" byl budowany
// przez `buildBerserker()` w `units.ts` na wspolnym, generycznym szkielecie
// `buildBaseAvatar()`. Zmierzone na zywym modelu PRZED zmiana (Chromium,
// kamera gry: azymut 0, elewacja 52 stopnie):
//   B1. TOPOR NIE BYL TRZYMANY. Srodek piesci lezal 0.0487 od osi toporzyska
//       (prog rodziny po T7: < 0.030), szczelina w X miedzy piescia
//       a toporzyskiem 0.0055, SAT piesc x toporzysko = 0.0000 — czyli brak
//       JAKIEGOKOLWIEK styku. Bron wisiala obok reki. Klasa bledu T1.
//   B2. KAPTUR POLYKAL OBIE ZRENICE. Oczy istnialy (2 mesh), ale mialy
//       0 PIKSELI z kamery gry; SAT kaptur x oko = 0.0095, dol kaptura
//       y = 0.4900 lezal PONIZEJ gornej krawedzi oka y = 0.5325. Odniesienie
//       zmierzone w tym samym renderze: Thorakites 14 pikseli, Falangita
//       6 pikseli. Klasa bledu T7 (montefortino Evocatiego).
//   B3. STOPY POD TERENEM. minY = -0.0005 przy 0.0000 dla kazdego modelu
//       rodziny zmierzonego w tym samym renderze (Falangita, Thorakites,
//       Hastati, Triari, Miecznik galijski, Druzynnik).
//   B4. BRAK POZY. Obie osie ramion = (0, 1, 0) — rece zwisaly pionowo jak
//       u generyka, wiec nawet poprawnie umieszczony topor nie mialby
//       nosiciela. Klasa bledu T1 („reka prosta jak kij").
//   B5. 0/23 nazwanych mesh i brak `userData.anchors`.
// Naprawa B1-B5 przez podmiane szkieletu na rodzine tego pliku (trCore /
// trBuildArm / trBuildLeg — te same, ktorych uzywa brat Wojownik germanski),
// a nie przez latanie generyka `buildBaseAvatar()`, ktory obsluguje kilkadziesiat
// innych jednostek `units.ts` i jest poza zakresem tego tematu.
// ---------------------------------------------------------------------------
export function buildBerserker(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();
  const PF = 'bs';

  const mSkin  = mat(TR_SKIN,       0.05, 0.80);
  const mPelt  = mat(TR_PELT,       0.04, 0.94);   // ciemne futro (rodzina Germanow)
  const mPeltL = mat(TR_FUR_LT,     0.04, 0.92);
  const mLeath = mat(TR_LEATHER,    0.06, 0.82);
  const mHair  = mat(TR_HAIR_BLOND, 0.04, 0.86);
  const mWood  = mat(TR_WOOD,       0.05, 0.85);
  const mIron  = mat(TR_STEEL,      0.55, 0.38);
  const mOwner = mat(ownerColor_,   0.12, 0.66);

  const HIP_Y = TR_HIP_Y - 0.016 * HEX_R;   // gleboki wypad w szale

  // KORPUS: goly tors (skora) + OCZY (twarz odkryta — brak helmu, PANCERZ 0)
  trCore(group, mat, mSkin, TR_SKIN, true, PF);

  // BARWNIK W KOLORZE GRACZA na golej piersi — dwa pasy w daszek. To jedyne
  // miejsce koloru gracza na tej figurce: reszta rodziny nosi go na polu
  // tarczy, a Berserker tarczy NIE MA (Pancerz = 0), wiec bez tego jednostka
  // nie mialaby na sobie ani jednego piksela barwy wlasciciela.
  for (const s of [-1, 1]) {
    const paint = new THREE.Mesh(getGTRWarPaint(), mOwner);
    paint.rotation.z = s * 0.42;
    paint.position.set(s * 0.024 * HEX_R, TR_TORSO_CTR + 0.018 * HEX_R, TR_TORSO_D * 0.5 + 0.005 * HEX_R);
    paint.name = PF + '-warpaint-' + (s < 0 ? 'right' : 'left');
    group.add(paint);
  }

  // SKORA ZWIERZECA na plecach + przepaska biodrowa + rzemien
  const cape = new THREE.Mesh(getGTRPeltCape(), mPelt);
  cape.rotation.x = 0.14;
  cape.position.set(0, TR_TORSO_CTR - 0.010 * HEX_R, -(TR_TORSO_D * 0.5 + 0.010 * HEX_R));
  cape.name = PF + '-pelt-cape';
  group.add(cape);
  const loin = new THREE.Mesh(getGTRLoin(), mLeath);
  loin.position.set(0, TR_TORSO_BOT - 0.020 * HEX_R, 0);
  loin.name = PF + '-loincloth';
  group.add(loin);
  const belt = new THREE.Mesh(getGTRBelt(), mLeath);
  belt.position.set(0, 0.248 * HEX_R, 0);
  belt.name = PF + '-belt';
  group.add(belt);

  // NOGI BOSE (skora tylko na stopach) — wypad do przodu na LEWEJ (+X)
  trBuildLeg(group,  TR_HIP_X,  0.80,  0.44, mSkin, mSkin, mLeath, HIP_Y, PF, 'left');
  trBuildLeg(group, -TR_HIP_X, -0.72, -0.30, mSkin, mSkin, mLeath, HIP_Y, PF, 'right');

  // ROZWIANE WLOSY z tylu glowy
  const hair = new THREE.Mesh(getGTRHairLoose(), mHair);
  hair.position.set(0, TR_HEAD_CTR - 0.017 * HEX_R, -(TR_HEAD_S * 0.5 + 0.016 * HEX_R));
  hair.name = PF + '-hair';
  group.add(hair);

  // LEB WILKA NA CIEMIENIU (nie na twarzy!). Dolna krawedz kaptura leży
  // POWYZEJ gornej krawedzi oka, a kufa jest cofnieta tak, by nie wchodzic
  // w linie widzenia oczu z kamery gry — dokladnie ta relacja, ktorej brak
  // dawal 0 pikseli twarzy przed T8 (B2 w naglowku wyzej).
  const hood = new THREE.Mesh(getGTRWolfHood(), mPelt);
  hood.position.set(0, TR_HEAD_TOP, 0);
  hood.name = PF + '-wolf-hood';
  group.add(hood);
  // Kufa MUSI wystawac przed lico kaptura, inaczej caly leb czyta sie jako
  // pudelko: kaptur siega z = +0.0575, kufa z = +0.0995, czyli 0.042 dalej.
  const snout = new THREE.Mesh(getGTRWolfSnout(), mPeltL);
  snout.position.set(0, TR_HEAD_TOP + 0.017 * HEX_R, 0.062 * HEX_R);
  snout.name = PF + '-wolf-snout';
  group.add(snout);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(getGTRWolfEar(), mPeltL);
    ear.position.set(s * 0.052 * HEX_R, TR_HEAD_TOP + 0.066 * HEX_R, -0.012 * HEX_R);
    ear.name = PF + '-wolf-ear-' + (s < 0 ? 'right' : 'left');
    group.add(ear);
  }

  // PRAWE (-X) RAMIE + TOPOR odwiedziony za bark, na osi przedramienia.
  // Toporzysko zaczyna sie 0.045 ZA dlonia (chwyt przy koncu drzewca — tak
  // trzyma sie topor), zeleziec siedzi pod czubkiem. Kat TH_R dobrany tak, by
  // bron byla prostopadla do osi patrzenia kamery gry — patrz akapit
  // o widocznosci w sekcji ZGODNOSC HISTORYCZNA.
  const TH_R = -2.58;
  const armR = trBuildArm(group, -TR_SHLD_X, -2.05, TH_R, mSkin, mSkin, mSkin, PF, 'right');
  const ax = armR.axis;
  const haft = new THREE.Mesh(getGTRAxeHaft(), mWood);
  haft.rotation.x = Math.PI - TH_R;
  haft.position.copy(armR.wrist.clone().addScaledVector(ax, 0.095 * HEX_R));
  haft.name = PF + '-axe-haft';
  group.add(haft);
  // Zeleziec: plaski klin ODSADZONY W BOK od drzewca (ostrze rownolegle do
  // toporzyska, plaszczyzna klina zwrocona ku kamerze), plus OBUCH po drugiej
  // stronie — bez obucha bryla siada na drzewcu symetrycznie i czyta sie
  // jako mlot.
  const bit = new THREE.Mesh(getGTRAxeHead(), mIron);
  bit.rotation.x = Math.PI - TH_R;
  bit.position.copy(armR.wrist.clone().addScaledVector(ax, 0.170 * HEX_R));
  bit.position.x -= 0.030 * HEX_R;
  bit.name = PF + '-axe-head';
  group.add(bit);
  const poll = new THREE.Mesh(getGTRAxePoll(), mIron);
  poll.rotation.x = Math.PI - TH_R;
  poll.position.copy(armR.wrist.clone().addScaledVector(ax, 0.170 * HEX_R));
  poll.position.x += 0.018 * HEX_R;
  poll.name = PF + '-axe-poll';
  group.add(poll);

  // LEWE (+X) RAMIE — PUSTE. Bez tarczy: `units.json` Pancerz = 0.
  trBuildArm(group, TR_SHLD_X, 1.05, 0.55, mSkin, mSkin, mSkin, PF, 'left');

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  group.userData['anchors'] = {
    hexR: HEX_R,
    headTopY: TR_HEAD_TOP, headCtrY: TR_HEAD_CTR,
    torsoTopY: TR_TORSO_TOP, torsoBotY: TR_TORSO_BOT,
    torsoHalfW: TR_TORSO_W * 0.5, torsoHalfD: TR_TORSO_D * 0.5,
    hipY: HIP_Y, shoulderY: TR_SHLD_Y, shoulderX: TR_SHLD_X,
    grip: armR.wrist.toArray(),
    weaponAxis: ax.toArray(),
    weaponKind: 'axe-broad',
    missileKind: 'none',
    shieldKind: 'none',
    helmetKind: 'none',
    armorKind: 'none',
    faceOpen: true,
    ownerColorOn: 'warpaint',
  };
  return group;
}

// ---------------------------------------------------------------------------
// WOJOWNIK GERMANSKI (Germanie, SUPER, ZELAZO) — POZA: rzut/pchniecie FRAMEA
// Potezny wodz: GOLY TORS + skorzany pas na krzyz, FUTRO na obu ramionach
// (paleta skor Berserkera), helm ZELAZNY prosty z FUTRZANYM OTOKIEM (bez
// rogow), RUDA PLECIONA BRODA (2 warkocze), FRAMEA (krotka wlocznia o waskim
// i krotkim grocie) uniesiona w PRAWEJ (-X) dloni na osi przedramienia,
// tarcza okragla ze SPIRALA na LEWYM (+X) przedramieniu, welniane spodnie,
// CHORAGIEW SUPERA na plecach (P6). Prefiks mesh: `gw-`.
//
// T8 — CO ZMIENIONO I DLACZEGO (pomiar, nie opinia):
//   G1. BRAK BRONI DYSTANSOWEJ. `units.json` dla „Wojownik germanski":
//       `Atak dystansowy = 4`, `Zasieg ataku (hex) = 2`, `Ilosc pociskow = 4`,
//       a pole `Uwagi` mowi wprost „germanski wojownik z frameą (krótka
//       włócznia do pchnięcia i rzutu)". Model do T8 miał DLUGI ZELAZNY MIECZ
//       i ZADNEJ broni miotanej — sylwetka nie niosla najwazniejszej cechy
//       jednostki. Miecz zastapiony framea (drzewce + tulejka + waski grot),
//       chwyt w punkcie rownowagi, drzewce wystaje TAKZE za dlon (chwyt do
//       rzutu, nie do ciecia).
//   G2. NIEPRAWDZIWY WLASNY KOMENTARZ. Poprzedni naglowek glosil „POZA:
//       ciecie znad glowy" i „miecz znad glowy". Zmierzone na zywym modelu
//       PRZED zmiana: koniec klingi WZDLUZ JEJ WLASNEJ OSI y = 0.4800 (OBB
//       calej bryly siega nieco wyzej, do 0.4862 — rozjazd z rotacji klingi,
//       nie blad pomiaru); srodek glowy y = 0.5370, czubek helmu y = 0.6290 —
//       obiema miarami klinga NIGDY nie byla nad glowa, lezala w calosci
//       ponizej srodka glowy. Opis poprawiony na zgodny z geometria (poza
//       rzutu, przedramie nad barkiem).
//   G3. ZERO NAZWANYCH MESH i brak `userData.anchors` (0/37) — bez tego zadna
//       asercja nie moze zaadresowac czesci, a punkty odniesienia trzeba by
//       wpisac liczbowo w test, czyli test mierzylby sam siebie.
// ---------------------------------------------------------------------------
export function buildGermanSuper(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();
  const PF = 'gw';

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
  trCore(group, mat, mSkin, TR_SKIN, false, PF);
  const strap = new THREE.Mesh(getGTRStrap(), mLeath);
  strap.rotation.set(-0.35, 0, 0.66);
  strap.position.set(-0.012 * HEX_R, TR_TORSO_CTR + 0.020 * HEX_R, TR_TORSO_D * 0.5 - 0.014 * HEX_R);
  strap.name = PF + '-strap';
  group.add(strap);
  const skirt = new THREE.Mesh(getGTRSkirt(), mWool);   // pas/dol spodni
  skirt.position.set(0, TR_TORSO_BOT - 0.018 * HEX_R, 0);
  skirt.name = PF + '-skirt';
  group.add(skirt);
  const belt = new THREE.Mesh(getGTRBelt(), mLeath);
  belt.position.set(0, 0.252 * HEX_R, 0);
  belt.name = PF + '-belt';
  group.add(belt);

  // FUTRO na obu ramionach (mantle nad stawem barkowym)
  for (const s of [-1, 1]) {
    const pad = new THREE.Mesh(getGTRFurPad(), mFur);
    pad.position.set(s * (TR_SHLD_X - 0.004 * HEX_R), TR_TORSO_TOP + 0.008 * HEX_R, 0);
    pad.name = PF + '-fur-pad-' + (s < 0 ? 'right' : 'left');
    group.add(pad);
  }
  // FUTRZANY PLASZCZ NA PLECACH — ROZWAZONY I ODRZUCONY, ZMIERZONY.
  // `units.json` -> Uwagi mowi „futrzany płaszcz, mało/brak pancerza", wiec
  // plaszcz byl kandydatem na brakujaca ceche. Dodany na probe (plyta futra
  // za torsem, jak `bs-pelt-cape` u Berserkera) dal **0 pikseli** z jedynej
  // kamery gry: tors ma 0.180 szerokosci, ramiona siegaja +-0.147, a kamera
  // patrzy z przodu i z gory (elewacja 52 stopnie), wiec plyta za plecami
  // niczego nie zaslania i sama nie jest widziana. Byloby to dodanie czesci,
  // ktorej NIE MA na ekranie — dokladnie klasa bledu, ktora T6 znalazl przy
  // broni. „Futrzany plaszcz" niesie w tym modelu FUTRO NA OBU BARKACH wyzej.

  // nogi: welniane spodnie, skorzane buty; wykrok
  trBuildLeg(group,  TR_HIP_X,  0.62,  0.36, mWool, mWool, mLeath, HIP_Y, PF, 'left');
  trBuildLeg(group, -TR_HIP_X, -0.56, -0.22, mWool, mWool, mLeath, HIP_Y, PF, 'right');

  // RUDA PLECIONA BRODA: blok brody + 2 warkocze
  const beard = new THREE.Mesh(getGTRBeard(), mBeard);
  beard.position.set(0, TR_HEAD_CTR - 0.052 * HEX_R, TR_HEAD_S * 0.5 - 0.004 * HEX_R);
  beard.name = PF + '-beard';
  group.add(beard);
  for (const s of [-1, 1]) {
    const braid = new THREE.Mesh(getGTRBraid(), mBeard);
    braid.rotation.z = s * 0.10;
    braid.position.set(s * 0.026 * HEX_R, TR_HEAD_CTR - 0.112 * HEX_R, TR_HEAD_S * 0.5 + 0.002 * HEX_R);
    braid.name = PF + '-beard-braid-' + (s < 0 ? 'right' : 'left');
    group.add(braid);
  }

  // HELM ZELAZNY PROSTY z FUTRZANYM OTOKIEM (zadnych rogow!)
  const dome = new THREE.Mesh(getGTRDomeHelm(), mIron);
  dome.position.set(0, TR_HEAD_CTR + 0.044 * HEX_R, 0);
  dome.name = PF + '-helmet-dome';
  group.add(dome);
  const otok = new THREE.Mesh(getGTRFurBand(), mFurLt);
  otok.position.set(0, TR_HEAD_CTR + 0.012 * HEX_R, 0);
  otok.name = PF + '-helmet-furband';
  group.add(otok);

  // PRAWE (-X) RAMIE + FRAMEA. Lokiec nad barkiem, przedramie do przodu:
  // reka uniesiona do RZUTU.
  const TH_ARM = 1.42;
  const armR = trBuildArm(group, -TR_SHLD_X, -2.55, TH_ARM, mSkin, mSkin, mLeath, PF, 'right');

  // FRAMEA MA WLASNA OS, POD KATEM DO PRZEDRAMIENIA — i to jest cala rzecz.
  // Drzewce trzymane w punkcie rownowagi wystaje TAKZE ZA dlon (tak trzyma sie
  // wlocznie do rzutu, inaczej niz miecz). Gdy pietka biegnie DOKLADNIE po osi
  // przedramienia, wchodzi w RAMIE — zmierzone przy probie TH = TH_ARM: SAT
  // drzewce x ramie-gorne = 0.0164, przy 0.0000 dla Falangity (T3) i Thorakitesa
  // (T6). To ten sam blad, ktory T7 znalazl u Hieros Lochos (dory po osi
  // przedramienia wchodzilo w lokiec i ramie). Wlasna os framei — nachylona
  // wzgledem przedramienia, przechodzaca przez PIESC — zdejmuje kolizje do
  // 0.0000 i przy okazji podnosi widocznosc z kamery gry.
  // KIERUNEK FRAMEI — DLACZEGO W GORE I W TYL, A NIE W PRZOD I W DOL.
  // Cala rodzina buduje konczyny w plaszczyznie YZ, a kamera gry patrzy
  // z azymutu 0. Rzut na ekran to (x ; y*cos52 - z*sin52), wiec KAZDY kierunek
  // lezacy w YZ daje na ekranie linie PIONOWA — o zwrocie zaleznym od znaku
  // (y*cos52 - z*sin52). Skierowanie framei „do przodu" (+Z) daje wiec na
  // ekranie wlocznie CELUJACA W ZIEMIE i drugi, rownolegly slup obok drzewca
  // choragwi — zlapane zrzutem ekranu, nie liczba: widocznosc wynosila wtedy
  // 0.9575 (najwyzsza z prob), bo miara nagradza dlugosc rzutu, a nie zwrot.
  // Kierunek W GORE I W TYL daje ten sam poziom widocznosci (0.86) i czyta sie
  // jako bron gotowa do rzutu — zgodnie z konwencja rodziny, w ktorej wlocznie
  // Falangity, Thorakitesa i Triariego stoja pionowo GROTEM DO GORY.
  const TH_W = -2.763;
  const wx = trDirDown(TH_W);
  const grip = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);   // srodek piesci
  const shaft = new THREE.Mesh(getGTRFrameaShaft(), mWood);
  shaft.rotation.x = Math.PI - TH_W;
  shaft.position.copy(grip.clone().addScaledVector(wx, 0.055 * HEX_R));
  shaft.name = PF + '-framea-shaft';
  group.add(shaft);
  const sock = new THREE.Mesh(getGTRFrameaSock(), mIronD);
  sock.rotation.x = Math.PI - TH_W;
  sock.position.copy(grip.clone().addScaledVector(wx, 0.239 * HEX_R));
  sock.name = PF + '-framea-socket';
  group.add(sock);
  // Grot: „angusto et brevi ferro" (Tacyt, Germania 6) — WASKI i KROTKI,
  // 0.024 x 0.072 x 0.011; dla porownania klinga dlugiego miecza uzywana
  // w tym samym pliku przez Miecznika galijskiego (getGTRLongBlade) ma
  // 0.026 x 0.210 x 0.013 — grot framei jest od niej blisko 3x krotszy.
  const head = new THREE.Mesh(getGTRFrameaHead(), mIron);
  head.rotation.x = Math.PI - TH_W;
  head.position.copy(grip.clone().addScaledVector(wx, 0.289 * HEX_R));
  head.name = PF + '-framea-head';
  group.add(head);

  // LEWE (+X) RAMIE + TARCZA OKRAGLA ZE SPIRALA przed korpusem
  const armL = trBuildArm(group, TR_SHLD_X, 0.52, 1.08, mSkin, mSkin, null, PF, 'left');
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.028 * HEX_R,
    armL.wrist.y + 0.036 * HEX_R,
    armL.wrist.z + 0.046 * HEX_R,
  );
  sh.rotation.y = -0.20;
  const face = new THREE.Mesh(getGTRRndFace(), mOwner);   // pole = KOLOR GRACZA
  face.rotation.x = Math.PI / 2;
  face.name = PF + '-shield-face';
  sh.add(face);
  const rimS = new THREE.Mesh(getGTRRndRim(), mWood);     // drewniany rant
  rimS.rotation.x = Math.PI / 2;
  rimS.position.set(0, 0, -0.006 * HEX_R);
  rimS.name = PF + '-shield-rim';
  sh.add(rimS);
  // SPIRALA: 4 klocki styczne do krzywej — zawijaja sie wokol umba
  for (let k = 0; k < 4; k++) {
    const a = 0.55 + k * 1.05;                 // kat na spirali
    const r = 0.052 + k * 0.017;               // rosnacy promien
    const armS = new THREE.Mesh(getGTRSpiralArm(), mIronD);
    armS.rotation.z = a + Math.PI / 2;         // stycznie do okregu
    armS.position.set(Math.cos(a) * r * HEX_R, Math.sin(a) * r * HEX_R, 0.018 * HEX_R);
    armS.name = PF + '-shield-spiral-' + k;
    sh.add(armS);
  }
  const umbo = new THREE.Mesh(getGTRUmbo(), mIron);
  umbo.rotation.x = Math.PI / 2;
  umbo.position.set(0, 0, 0.028 * HEX_R);
  umbo.name = PF + '-shield-boss';
  sh.add(umbo);
  group.add(sh);

  // CHORAGIEW SUPERA na plecach, po stronie TARCZOWEJ (+X).
  // T7 przeniosl analogiczna choragiew Hieros Lochos ze strony bronnej na
  // tarczowa, bo drzewce dory ja przebijalo; kopia w tym pliku parametru
  // `side` nie miala. Tutaj KOLIZJI 3D nie ma i nie bylo (SAT bron x kazda
  // z trzech czesci choragwi = 0.0000 rowniez przy `side = -1`), ale jest
  // przyczyna EKRANOWA: framea i drzewce choragwi leza w tej samej
  // plaszczyznie YZ, wiec obie rzutuja sie na pionowe linie — stojac po tej
  // samej stronie (-X) daja dwa rownolegle slupy nakladajace sie na siebie,
  // przy czym drzewce framei przechodzi PRZED plachta choragwi. Rozdzielenie
  // stron zdejmuje to nalozenie: framea zostaje na -X, choragiew idzie na +X.
  trSuperBanner(group, mPole, mOwner, mGold, PF, +1);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  // Kotwice do asercji geometrycznych — punkty odniesienia BIORA SIE Z MODELU,
  // nie sa wpisane liczbowo w tescie (lekcja T1/T2/T5 serii).
  group.userData['anchors'] = {
    hexR: HEX_R,
    headTopY: TR_HEAD_TOP, headCtrY: TR_HEAD_CTR,
    torsoTopY: TR_TORSO_TOP, torsoBotY: TR_TORSO_BOT,
    torsoHalfW: TR_TORSO_W * 0.5, torsoHalfD: TR_TORSO_D * 0.5,
    hipY: HIP_Y, shoulderY: TR_SHLD_Y, shoulderX: TR_SHLD_X,
    grip: grip.toArray(),
    forearmAxis: armR.axis.toArray(),
    weaponAxis: wx.toArray(),
    weaponKind: 'spear-framea',
    missileKind: 'framea',
    shieldKind: 'round-germanic',
    shieldFaceR: 0.148 * HEX_R,
    shieldDevice: 'spiral-4',
    helmetKind: 'iron-dome-furband',
    faceOpen: false,
    bannerSide: 1,
  };
  return group;
}

// ===========================================================================
// ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA (Berserker germanski)
// ===========================================================================
// units.json: Epoka=Zelazo, Kultura/Nacja=Germanie, Tech=Obrobka zelaza,
// Typ=Swordsman, Klasa=Specjalna, Super-jednostka=NIE, Atak 10 / Uderzenie 8 /
// Obrona 2 / PANCERZ 0 / Przebicie 4, Morale bazowe 120 (najwyzsze w rodzinie),
// Morale ucieczki 5, Prog dezercji 10%, Atak dystansowy 0. Uwagi: „obnażona
// pierś, skóra wilka/niedźwiedzia (łeb zwierzęcia na głowie), topór lub miecz,
// bez tarczy; szał bojowy (+Atak, −Obrona)".
//
// K1. NAZWA JEST ANACHRONIZMEM I TO TRZEBA POWIEDZIEC WPROST. „Berserkr" to
//     slowo STARONORDYCKIE, nie germanskie z epoki zelaza. Najwczesniejsze
//     poswiadczenie to „Haraldskvaedi" (Hrafnsmal) Thorbjorna hornklofiego,
//     ok. 900 n.e.; klasyczny opis daje dopiero Snorri Sturluson w „Ynglinga
//     saga" rozdz. 6 (XIII w.): ludzie Odyna szli BEZ KOLCZUG, wsciekli jak
//     psy albo wilki, gryzli krawedzie tarcz, byli silni jak niedzwiedzie.
//     Miedzy kultura jastorfska (ok. 600 p.n.e. - poczatek n.e.) a saga Snorriego
//     lezy tysiac do tysiaca kilkuset lat. Jednostka nazywa sie tak, bo tak
//     nazywa ja `units.json` — model NIE udaje, ze to postac udokumentowana
//     dla epoki zelaza.
// K2. CO JEST UDOKUMENTOWANE DLA EPOKI — I TO MODEL ODWZOROWUJE. Tacyt,
//     „Germania" 43, o Hariach: „nigra scuta, TINCTA CORPORA; atras ad proelia
//     noctes legunt ipsaque formidine atque umbra FERALIS EXERCITUS terrorem
//     inferunt" — czarne tarcze, CIALA POMALOWANE/UBARWIONE, wybieraja na
//     bitwe najciemniejsze noce i sama groza upiornego wojska sieja przerazenie.
//     To jest zrodlowa podstawa BARWNIKA NA GOLEJ PIERSI (`bs-warpaint-*`),
//     ktory w tym modelu niesie zarazem kolor gracza. Tacyt „Germania" 17:
//     „gerunt et ferarum pelles" — nosza tez skory dzikich zwierzat; stad
//     `bs-pelt-cape` i leb zwierzecia. Tacyt „Germania" 31 o Chattach: slub
//     nieobcinania wlosow ani brody, dopoki nie zabije sie wroga — stad
//     rozwiane, niestrzyzone wlosy zamiast uczesania.
// K3. GOLY TORS I BRAK TARCZY SA ZRODLOWE, NIE TYLKO MECHANICZNE. Tacyt,
//     „Germania" 6: wojownicy ida do walki „aut NUDI aut sagulo leves" —
//     nadzy albo lekko odziani w krotki plaszcz — a „paucissimis loricae,
//     vix uni alterive cassis aut galea" (bardzo nieliczni maja pancerz,
//     ledwie jeden czy drugi helm). Model ma ZERO zbroi, ZERO helmu i ZERO
//     tarczy, co odpowiada `Pancerz = 0` i `Obrona 2`. Uwaga na kierunek
//     wnioskowania: u Tacyta brak tarczy nie jest brawura, tylko bieda — a
//     „scutum reliquisse praecipuum flagitium" (Germania 6, nie 13 — Final
//     Control zweryfikowal lokalizacje cytatu wprost w tekscie), porzucenie
//     tarczy to najwieksza hanba. Berserker bez tarczy jest wiec figura
//     LITERACKA (K1), nie typowym Germaninem — i tak ma zostac, bo tego
//     wymaga karta jednostki.
// K4. LEB WILKA — IKONOGRAFIA JEST, ALE POZNIEJSZA NIZ EPOKA. Wojownik
//     w skorze wilka wystepuje na matrycach z TORSLUNDA (Oland, Szwecja,
//     okres vendelski, VI-VII w. n.e.) — wilczy wojownik z wlocznia obok
//     jednookiego tancerza. Rzymskie signiferi w skorach wilka/niedzwiedzia
//     widac na Kolumnie Trajana (pocz. II w. n.e.), ale to praktyka RZYMSKA
//     i nie jest dowodem na uzycie germanskie. Model swiadomie siega po ten
//     kanon wizualny, bo `units.json` zada „łeb zwierzęcia na głowie";
//     datowanie jest tu pozniejsze niz epoka jednostki i to jest nazwane,
//     a nie przemilczane.
// K5. TOPOR — ZGODNY Z KARTA, RZADKI W ZNALEZISKACH, NIE FRANCISCA. Karta
//     mowi „topór lub miecz", wiec topor jest wyborem dozwolonym. Ale skala:
//     w depozycie z HJORTSPRING (Als, Dania, ok. 350 p.n.e., przedrzymska
//     epoka zelaza) na okolo 130-140 grotow wloczni przypada okolo 11 mieczy;
//     w NYDAM (Szlezwik, ok. 200-400 n.e.) na okolo 500 grotow drzewcowych
//     okolo 100 mieczy. Bron drzewcowa dominuje, topor jest w tych zespolach
//     marginalny. Zeleziec w modelu jest SZEROKIM toporem bojowym na dlugim
//     toporzysku — NIE jest to francisca, frankijski topor do rzutu z V-VIII
//     w. n.e., ktory bylby anachronizmem jeszcze wiekszym niz sama nazwa
//     jednostki. Berserker ma `Atak dystansowy = 0`, wiec bron do rzutu
//     bylaby tez sprzeczna z danymi.
// K6. WLOSY: JASNE, NIE RUDE — I DLACZEGO TO NIE JEST DROBIAZG. Tacyt
//     „Germania" 4 daje Germanom „rutilae comae" (rude/rudawe wlosy) i to
//     jest zrodlo literackie. Ale czesty argument „przeciez ciala bagienne
//     maja rude wlosy" jest BLEDNY: rudy odcien wlosow mumii bagiennych
//     (m.in. czlowiek z Osterby, Szlezwik, ok. 70-220 n.e.) to efekt kwasow
//     torfowiska, a nie kolor za zycia. Berserker dostal wlosy JASNE
//     (`TR_HAIR_BLOND`), a ruda barwa (`TR_HAIR_GER`) zostala zarezerwowana
//     dla brata — Wojownika germanskiego — zeby dwie jednostki tej samej
//     kultury dalo sie odroznic z kamery gry; zmierzona odroznialnosc pary
//     Berserker/Wojownik germanski wynosi 0.817 przy progu rodziny 0.558.
// K7. CZEGO MODEL NIE ODWZOROWUJE. Sagi opisuja berserkow GRYZACYCH KRAWEDZIE
//     TARCZ (Ynglinga saga 6) — model tarczy nie ma wcale, wiec ten motyw
//     odpada z definicji. Nie ma tez zelaznego pierscienia Chattow (Germania
//     31: „ferreum insuper anulum... veluti vinculum"), bo przy elewacji
//     kamery 52 stopnie obreczka na przedramieniu ma na ekranie pojedyncze
//     piksele i nie niesie informacji.
// ===========================================================================

// ===========================================================================
// ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA (Wojownik germanski)
// ===========================================================================
// units.json: Epoka=Zelazo, Kultura/Nacja=Germanie, Tech=Obrobka zelaza,
// Typ=Swordsman, Klasa=Super, Super-jednostka=TAK, Atak 6 / Uderzenie 7 /
// Obrona 6 / Pancerz 2 / Przebicie 2, ATAK DYSTANSOWY 4, Zasieg 2 heksy,
// Ilosc pociskow 4, Bonus vs Mount +50%, Bonus vs Spearman +15%. Uwagi:
// „germański wojownik z frameą (krótka włócznia do pchnięcia i rzutu)
// + okrągła/heksagonalna tarcza drewniano-skórzana; futrzany płaszcz,
// mało/brak pancerza; walka w lesie i zasadzki | Super Brązu (framea);
// max 1; stolica; Koszt=0".
//
// K1. FRAMEA — ZRODLO OPISUJE DOKLADNIE TE STATYSTYKE. Tacyt, „Germania" 6:
//     „rari gladiis aut maioribus lanceis utuntur: HASTAS vel ipsorum vocabulo
//     FRAMEAS gerunt, ANGUSTO ET BREVI FERRO, sed ita acri et ad usum habili,
//     ut eodem telo, prout ratio poscit, VEL COMMINUS VEL EMINUS pugnent" —
//     rzadko uzywaja mieczy albo wiekszych lanc: nosza wlocznie, w swoim jezyku
//     FRAMEAS, o WASKIM I KROTKIM ZELEZCU, tak ostrym i porecznym, ze tym samym
//     orezem walcza wedle potrzeby Z BLISKA ALBO Z DALEKA. „Vel comminus vel
//     eminus" to jest, slowo w slowo, jednostka o `Atak 6` W ZWARCIU i
//     `Atak dystansowy 4` na `Zasieg 2` — jedna bron, dwa tryby. Dlatego grot
//     w modelu ma 0.024 x 0.072 x 0.011 („waski i krotki"), a nie proporcje
//     klingi miecza (getGTRLongBlade w tym pliku: 0.026 x 0.210 x 0.013).
// K2. DLUGI MIECZ BYL PODWOJNIE BLEDNY. Model do T8 nosil DLUGI ZELAZNY MIECZ
//     i zadnej broni miotanej. To bylo sprzeczne (a) z karta jednostki
//     — `Atak dystansowy 4`, `Ilosc pociskow 4`, Uwagi wprost mowiace o framei
//     — i (b) z tym samym zdaniem Tacyta: „RARI GLADIIS... utuntur", mieczy
//     uzywaja RZADKO, bo „ne ferrum quidem superest" (nawet zelaza nie maja
//     w nadmiarze). Potwierdza to skala znalezisk: HJORTSPRING (Als, Dania,
//     ok. 350 p.n.e.) — okolo 130-140 grotow drzewcowych na okolo 11 mieczy;
//     NYDAM (Szlezwik, ok. 200-400 n.e.) — okolo 500 grotow na okolo 100
//     mieczy, przy czym znaczna czesc tych mieczy to IMPORTY rzymskie
//     (spathy ze stemplami wytworcow). ILLERUP ADAL (Jutlandia, glowny
//     depozyt ok. 200 n.e.) daje ten sam obraz: setki grotow, kilkaset tarcz,
//     miecze jako mniejszosc wyposazenia.
// K3. HELM NA SUPERZE — WYJATEK, KTORY ZRODLO PRZEWIDUJE. Tacyt, „Germania"
//     6: „paucissimis loricae, VIX UNI ALTERIVE cassis aut galea" — bardzo
//     nieliczni maja pancerz, ledwie JEDEN CZY DRUGI helm. Jednostka jest
//     SUPEREM z limitem „max 1; stolica" i ma `Pancerz = 2` (nisko, ale nie
//     zero) — czyli jest doslownie tym „jednym czy drugim". Zelazny dzwon
//     bez rogow jest wiec uzasadniony; FUTRZANY OTOK pod nim to stylizacja
//     spinajaca go z futrem na barkach, bez konkretnego znaleziska za soba,
//     i tak jest tu nazwana. ROGATYCH HELMOW NIE MA I NIE BEDZIE: to wynalazek
//     ikonografii XIX-wiecznej, nie epoki zelaza.
// K4. TARCZA. Karta mowi „okrągła/heksagonalna tarcza drewniano-skórzana" —
//     model ma OKRAGLA, deskowa, z drewnianym rantem i zelaznym umbem, co
//     zgadza sie ze znaleziskami: Hjortspring ma tarcze deskowe z osobnym
//     DREWNIANYM umbem, Illerup i Thorsberg — setki umb ZELAZNYCH. Tacyt
//     „Germania" 6: „scuta lectissimis coloribus distinguunt" (tarcze zdobia
//     najdobitniejszymi barwami), co uzasadnia pole tarczy w kolorze gracza.
//     SPIRALA na tarczy jest natomiast motywem latenskim: uczciwie mowiac,
//     to STYLIZACJA pasujaca do horyzontu przeworskiego (silnie latenizowanego),
//     a nie odwzorowanie konkretnego znaleziska.
// K5. RUDA PLECIONA BRODA — POL ZRODLA, POL STYLIZACJI. Rudawe wlosy Germanow
//     sa u Tacyta („Germania" 4: „rutilae comae"). Ale PLECIONA broda to juz
//     stylizacja: poswiadczony germanski wezel wlosow to WEZEL SWEBSKI —
//     „Germania" 38: „insigne gentis obliquare crinem nodoque substringere",
//     znakiem ludu jest zaczesywac wlosy na bok i wiazac je w wezel; zachowal
//     sie na glowie czlowieka z OSTERBY (Szlezwik, ok. 70-220 n.e.). Wezel
//     jest we WLOSACH, nie w brodzie, a tu wlosy kryje helm — wiec warkocze
//     poszly w brode. Nazwane, nie przemilczane. (Rudy kolor wlosow mumii
//     bagiennych sam w sobie NIE jest dowodem — to efekt kwasow torfowiska;
//     dowodem jest zdanie Tacyta.)
// K6. „FUTRZANY PLASZCZ" Z KARTY NIESIE FUTRO NA BARKACH. Tacyt „Germania"
//     17: „tegumen omnibus SAGUM fibula aut, si desit, spina consertum" —
//     okryciem wszystkich jest plaszcz spiety zapinka albo, gdy jej brak,
//     cierniem. Osobna plyta futra ZA PLECAMI zostala rozwazona i ODRZUCONA
//     po pomiarze: przy jedynej kamerze gry (azymut 0, elewacja 52 stopnie)
//     dawala ZERO pikseli, bo tors ma 0.180 szerokosci, a ramiona siegaja
//     +-0.147 i calkowicie ja zaslaniaja. Ceche niesie futro na obu barkach,
//     ktore z tej kamery widac.
// K7. CZEGO MODEL NIE ODWZOROWUJE I CO ZOSTAJE OTWARTE. (a) Uwagi karty mowia
//     „walka w lesie i zasadzki" — tego sylwetka pojedynczej figurki nie niesie
//     w ogole i niesc nie moze. (b) Karta ma wewnetrzny rozjazd: `Epoka` =
//     „Zelazo", ale `Dostepna w epokach` = „Braz" i Uwagi mowia „Super Brazu
//     (framea)". Model idzie za `Epoka` i za frameą; rozstrzygniecie samego
//     rozjazdu w danych jest poza zakresem tego tematu (`gra/data/**` nie
//     jest w allowliscie) i zostalo zgloszone w raporcie. (c) Choragiew-znacznik
//     SUPERA nie ma zadnej podstawy zrodlowej dla Germanow epoki zelaza —
//     to konwencja GRY (P6), wspolna wszystkim superom, czytelna z kamery.
// ===========================================================================

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
