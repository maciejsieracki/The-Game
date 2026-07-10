/**
 * jednostki-p8b-rozni.ts — PACZKA 8b/8: 4 JEDNOSTKI BEZ WLASNEGO MODELU
 * (seria render-jednostki; wzorzec anatomii: hastati-falangita.ts KOREKTA v2,
 *  styl andyjski: jednostki-p2-inka.ts)
 * ---------------------------------------------------------------------------
 * Dzis wszystkie 4 renderuja sie GENERYKIEM buildCategoryModel('domyslny')
 * (chlop z dzida). Nowe bespoke buildery:
 *   buildStraznikHarappy(ownerColor)  - "Straznik bram Harappy" (Harappa, Braz)
 *   buildPiechotaInduska(ownerColor)  - "Piechota induska"      (Harappa, Braz)
 *   buildLegionRzymski(ownerColor)    - "Legion Rzymski"        (Rzym,    Braz)
 *   buildGwardzistaChampi(ownerColor) - "Gwardzista z champi"   (Inkowie, Braz)
 *
 * WPIECIE (INTEGRATOR, gra-robocza/srcKopiaMaster/render/units.ts):
 *   buildNamedUnit() — NOWE case'y przed koncowym `return null` (~linia 1195):
 *     if (n.includes('straznik bram') || n.includes('gatekeeper') ||
 *         (n.includes('harap') && n.includes('straznik'))) return buildStraznikHarappy(ownerColor_);
 *     if (n.includes('piechota induska') || n.includes('indus infantry') ||
 *         n.includes('indusk')) return buildPiechotaInduska(ownerColor_);
 *     if (n.includes('legion rzymski') || n.includes('roman legion')) return buildLegionRzymski(ownerColor_);
 *     if (n.includes('gwardzista z champi') || n.includes('champi guard') ||
 *         (n.includes('champi') && n.includes('gwardz'))) return buildGwardzistaChampi(ownerColor_);
 *   UWAGA BUG LEGIONU (dzis renderuje sie jako chlop):
 *     - units.ts:1179  `if (n.includes('legion') && !n.includes('hastati')) return null;`
 *       swiadomy fallthrough do KATEGORII, ale...
 *     - units/setup.ts:116 categoryOf() laczy tylko 'legionist'/'hastati' —
 *       nazwa "Legion Rzymski" NIE zawiera 'legionist', spada przez wszystkie
 *       slowa kluczowe do 'domyslny' => generyk-chlop. Naprawa: case
 *       buildLegionRzymski PRZED linia 1179 (i opcjonalnie 'legion' w setup.ts:116).
 *
 * Interfejs i konwencje BEZ ZMIAN (seria):
 *   - figurka PRZODEM do +Z, stopy na y = 0, uklad prawoskretny => LEWA = +X, PRAWA = -X,
 *   - TARCZA zawsze na LEWYM (+X) przedramieniu, BRON w PRAWEJ (-X) dloni NA OSI przedramienia,
 *   - POZY ATAKU (wykrok, biodra obnizone), NAKRYCIE GLOWY na kazdej glowie,
 *   - group.userData['mats'] i ['perTokenGeos'] jak w units.ts, geometrie = singletony modulu.
 *
 * ROZROZNIALNOSC / KOLOR GRACZA (spojnie z seria — glownie pole/element tarczy):
 *   STRAZNIK BRAM HARAPPY: turban-zawoj z karneolowym klejnotem, WIELKA prostokatna
 *     tarcza z plecionki trzcinowej (widoczny splot klockowy, poziomy pas = KOLOR
 *     GRACZA), wlocznia nisko (podchwyt straznika), biala tunika bawelniana,
 *     pas = KOLOR GRACZA, naszyjnik z paciorkow (karneol/turkus — Harappa!).
 *   PIECHOTA INDUSKA: lzejsza — goly tors + szarfa, dhoti (pas = KOLOR GRACZA),
 *     zawoj skromny z wezlem, MALA okragla tarcza pleciona (boss = KOLOR GRACZA),
 *     dzida nadrecznie, 2 paciorki.
 *   LEGION RZYMSKI (wczesny, Braz): EWIDENTNY PRZODEK Hastatiego — te same pozy
 *     i owalny scutum (pole = KOLOR GRACZA), ale montefortino BRAZOWY BEZ pior
 *     (sam guzek), pectorale MNIEJSZE brazowe, gladius BRAZOWY, tunika
 *     CIEMNOczerwona, BEZ nagolennicy — mniej ozdob, rodzina na pierwszy rzut.
 *   GWARDZISTA Z CHAMPI (Inka): champi (maczugo-topor: gwiazda + OSTRZE, braz)
 *     w zamachu, mala pullcanca (pole = KOLOR GRACZA, zlota listwa, fredzle),
 *     zlote llautu + 3 piora, unku ochra + tokapu, zlote orejones — elitarny,
 *     ale skromniejszy niz Krolewska Gwardia z P2 (bez korony i choragwi).
 *
 * Budzet: Straznik 436 tri, Piechota 384, Legion 414 (Hastati 462 minus kita/
 * piora/nagolennica plus guzek), Gwardzista 456 — wszystkie <= ~460.
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

// ── paleta (zgodna z seria: units.ts + hastati-falangita + p2-inka) ─────────
const P8_SKIN       = 0xe0ac69;   // skora jasna (Rzym)
const P8_SKIN_INDUS = 0xb8824e;   // skora doliny Indusu (ciemniejsza, ciepla)
const P8_SKIN_DARK  = 0xc89058;   // skora ogorzala (Inka — jak P2)
const P8_COTTON     = 0xefe9d6;   // biala bawelna Harappy (jasniejsza od lnu)
const P8_ECRU       = 0xe6ddc4;   // ecru zawoju piechoty
const P8_REED       = 0xd8c07c;   // trzcina jasna (plecionka)
const P8_REED_MID   = 0xb89a58;   // trzcina srednia (listwy splotu)
const P8_REED_DARK  = 0xa07f42;   // trzcina ciemna (listwy pionowe)
const P8_CARNELIAN  = 0xc05528;   // karneol (paciorki Harappy, klejnot)
const P8_TEAL       = 0x2a9d8f;   // turkus (paciorki; akcent andyjski jak P2)
const P8_DARKRED    = 0x7e211c;   // CIEMNA czerwien tuniki wczesnego legionu
const P8_ROMAN_RED  = 0xa42a22;   // czerwien rzymska (odniesienie serii)
const P8_OCHRE      = 0xc8932e;   // ochra unku (P2)
const P8_RED        = 0xc0392b;   // czerwien tekstylna (P2)
const P8_GOLD       = 0xe0b53a;   // zloto Inkow (P2)
const P8_BRONZE     = 0xcf9234;   // braz
const P8_BRONZE_LT  = 0xd0a050;   // jasny braz (klinga gladiusa z brazu)
const P8_WOOD       = 0x7a5c3a;   // drewno
const P8_WOOD_DK    = 0x5f4020;   // ciemne drewno (champi)
const P8_LEATHER    = 0x6b4a28;   // skora/rzemienie
const P8_STEEL      = 0xc2cad2;   // stal (grot wloczni straznika — jak seria)
const P8_FEATHER    = 0xf4f0e6;   // biale pioro
const P8_EYE        = 0x1a1008;   // oczy

// ── wymiary sylwetki (rodzina NI_* z hastati-falangita.ts — spojna seria) ───
const P8_HIP_Y     = 0.208 * HEX_R;
const P8_TORSO_W   = 0.180 * HEX_R;
const P8_TORSO_H   = 0.205 * HEX_R;
const P8_TORSO_D   = 0.100 * HEX_R;
const P8_TORSO_BOT = 0.240 * HEX_R;
const P8_TORSO_CTR = P8_TORSO_BOT + P8_TORSO_H * 0.5;
const P8_TORSO_TOP = P8_TORSO_BOT + P8_TORSO_H;
const P8_NECK_H    = 0.028 * HEX_R;
const P8_HEAD_S    = 0.128 * HEX_R;
const P8_HEAD_CTR  = P8_TORSO_TOP + P8_NECK_H + P8_HEAD_S * 0.5;
const P8_HEAD_TOP  = P8_TORSO_TOP + P8_NECK_H + P8_HEAD_S;
const P8_SHLD_X    = P8_TORSO_W * 0.5 + 0.030 * HEX_R;
const P8_SHLD_Y    = P8_TORSO_TOP - 0.024 * HEX_R;
const P8_HIP_X     = 0.052 * HEX_R;
const P8_THIGH_L   = 0.104 * HEX_R;
const P8_SHIN_L    = 0.096 * HEX_R;
const P8_UPARM_L   = 0.100 * HEX_R;
const P8_FOREARM_L = 0.092 * HEX_R;

// ── geometrie-singletony (wspolne dla wszystkich tokenow paczki) ────────────
let gP8Torso:   THREE.BoxGeometry | null = null;
let gP8Neck:    THREE.BoxGeometry | null = null;
let gP8Head:    THREE.BoxGeometry | null = null;
let gP8Eye:     THREE.BoxGeometry | null = null;
let gP8Thigh:   THREE.BoxGeometry | null = null;
let gP8Shin:    THREE.BoxGeometry | null = null;
let gP8Foot:    THREE.BoxGeometry | null = null;
let gP8UpArm:   THREE.BoxGeometry | null = null;
let gP8Forearm: THREE.BoxGeometry | null = null;
let gP8Fist:    THREE.BoxGeometry | null = null;
let gP8Skirt:   THREE.BoxGeometry | null = null;
let gP8HemBand: THREE.BoxGeometry | null = null;
let gP8Belt:    THREE.BoxGeometry | null = null;
let gP8Strap:   THREE.BoxGeometry | null = null;   // pas krzyzowy / szarfa
let gP8Bead:    THREE.BoxGeometry | null = null;   // paciorek Harappy
// Harappa
let gP8Turban:  THREE.CylinderGeometry | null = null;  // turban-zawoj (8-kat)
let gP8TurbWrap:THREE.BoxGeometry | null = null;       // dolny zwoj turbanu
let gP8Jewel:   THREE.BoxGeometry | null = null;       // klejnot czolowy
let gP8WrapS:   THREE.CylinderGeometry | null = null;  // zawoj skromny (8-kat)
let gP8Knot:    THREE.BoxGeometry | null = null;       // wezel zawoju
let gP8GateBase:THREE.BoxGeometry | null = null;       // WIELKA tarcza: pole
let gP8GateH:   THREE.BoxGeometry | null = null;       // listwa pozioma splotu
let gP8GateV:   THREE.BoxGeometry | null = null;       // listwa pionowa splotu
let gP8GateBand:THREE.BoxGeometry | null = null;       // pas KOLORU GRACZA
let gP8RoundSh: THREE.CylinderGeometry | null = null;  // mala tarcza pleciona
let gP8RoundLat:THREE.BoxGeometry | null = null;       // listwa krzyzowa
let gP8RoundBoss:THREE.BoxGeometry | null = null;      // boss (KOLOR GRACZA)
let gP8Spear:   THREE.BoxGeometry | null = null;       // drzewce wloczni/dzidy
let gP8SpearTip:THREE.ConeGeometry | null = null;
// Rzym (rodzina Hastatiego)
let gP8MontBowl:THREE.CylinderGeometry | null = null;  // miska montefortino (8-kat)
let gP8MontKnob:THREE.BoxGeometry | null = null;       // guzek (zamiast kity)
let gP8MontNeck:THREE.BoxGeometry | null = null;
let gP8Cheek:   THREE.BoxGeometry | null = null;
let gP8PectS:   THREE.BoxGeometry | null = null;       // MNIEJSZE pectorale
let gP8Blade:   THREE.BoxGeometry | null = null;
let gP8BladeTip:THREE.ConeGeometry | null = null;
let gP8Guard:   THREE.BoxGeometry | null = null;
let gP8ScutShell:THREE.BufferGeometry | null = null;   // owalna skorupa (jak Hastati)
let gP8ScutFace: THREE.BufferGeometry | null = null;   // pole (KOLOR GRACZA)
let gP8Spina:   THREE.BoxGeometry | null = null;
let gP8Umbo:    THREE.BoxGeometry | null = null;
// Inka
let gP8Band:    THREE.BoxGeometry | null = null;       // opaska llautu
let gP8FeatherG:THREE.BoxGeometry | null = null;       // pioro
let gP8CheckSq: THREE.BoxGeometry | null = null;       // kratka tokapu
let gP8EarSpool:THREE.BoxGeometry | null = null;       // zloty kolczyk-krazek
let gP8MaceHaft:THREE.BoxGeometry | null = null;
let gP8MaceRay: THREE.BoxGeometry | null = null;       // ramie gwiazdy champi
let gP8AxeBlade:THREE.BoxGeometry | null = null;       // OSTRZE champi
let gP8AxeEdge: THREE.BoxGeometry | null = null;
let gP8RectSh:  THREE.BoxGeometry | null = null;       // pullcanca mala
let gP8ShTrim:  THREE.BoxGeometry | null = null;       // zlota listwa
let gP8Fringe:  THREE.BoxGeometry | null = null;       // fredzel

function getGP8Torso():   THREE.BoxGeometry { return (gP8Torso   ||= new THREE.BoxGeometry(P8_TORSO_W, P8_TORSO_H, P8_TORSO_D)); }
function getGP8Neck():    THREE.BoxGeometry { return (gP8Neck    ||= new THREE.BoxGeometry(0.042 * HEX_R, P8_NECK_H * 1.6, 0.042 * HEX_R)); }
function getGP8Head():    THREE.BoxGeometry { return (gP8Head    ||= new THREE.BoxGeometry(P8_HEAD_S, P8_HEAD_S, P8_HEAD_S)); }
function getGP8Eye():     THREE.BoxGeometry { return (gP8Eye     ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.020 * HEX_R, 0.008 * HEX_R)); }
function getGP8Thigh():   THREE.BoxGeometry { return (gP8Thigh   ||= new THREE.BoxGeometry(0.056 * HEX_R, P8_THIGH_L, 0.060 * HEX_R)); }
function getGP8Shin():    THREE.BoxGeometry { return (gP8Shin    ||= new THREE.BoxGeometry(0.038 * HEX_R, P8_SHIN_L, 0.042 * HEX_R)); }
function getGP8Foot():    THREE.BoxGeometry { return (gP8Foot    ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)); }
function getGP8UpArm():   THREE.BoxGeometry { return (gP8UpArm   ||= new THREE.BoxGeometry(0.054 * HEX_R, P8_UPARM_L, 0.054 * HEX_R)); }
function getGP8Forearm(): THREE.BoxGeometry { return (gP8Forearm ||= new THREE.BoxGeometry(0.040 * HEX_R, P8_FOREARM_L, 0.040 * HEX_R)); }
function getGP8Fist():    THREE.BoxGeometry { return (gP8Fist    ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)); }
function getGP8Skirt():   THREE.BoxGeometry { return (gP8Skirt   ||= new THREE.BoxGeometry(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)); }
function getGP8HemBand(): THREE.BoxGeometry { return (gP8HemBand ||= new THREE.BoxGeometry(0.200 * HEX_R, 0.022 * HEX_R, 0.122 * HEX_R)); }
function getGP8Belt():    THREE.BoxGeometry { return (gP8Belt    ||= new THREE.BoxGeometry(0.190 * HEX_R, 0.034 * HEX_R, 0.112 * HEX_R)); }
function getGP8Strap():   THREE.BoxGeometry { return (gP8Strap   ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.120 * HEX_R, 0.008 * HEX_R)); }
function getGP8Bead():    THREE.BoxGeometry { return (gP8Bead    ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.024 * HEX_R, 0.014 * HEX_R)); }
function getGP8Turban():  THREE.CylinderGeometry { return (gP8Turban ||= new THREE.CylinderGeometry(0.072 * HEX_R, 0.086 * HEX_R, 0.056 * HEX_R, 8, 1)); }
function getGP8TurbWrap():THREE.BoxGeometry { return (gP8TurbWrap||= new THREE.BoxGeometry(0.150 * HEX_R, 0.026 * HEX_R, 0.150 * HEX_R)); }
function getGP8Jewel():   THREE.BoxGeometry { return (gP8Jewel   ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.034 * HEX_R, 0.012 * HEX_R)); }
function getGP8WrapS():   THREE.CylinderGeometry { return (gP8WrapS ||= new THREE.CylinderGeometry(0.066 * HEX_R, 0.078 * HEX_R, 0.044 * HEX_R, 8, 1)); }
function getGP8Knot():    THREE.BoxGeometry { return (gP8Knot    ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.036 * HEX_R, 0.030 * HEX_R)); }
function getGP8GateBase():THREE.BoxGeometry { return (gP8GateBase||= new THREE.BoxGeometry(0.210 * HEX_R, 0.340 * HEX_R, 0.014 * HEX_R)); }
function getGP8GateH():   THREE.BoxGeometry { return (gP8GateH   ||= new THREE.BoxGeometry(0.222 * HEX_R, 0.034 * HEX_R, 0.020 * HEX_R)); }
function getGP8GateV():   THREE.BoxGeometry { return (gP8GateV   ||= new THREE.BoxGeometry(0.034 * HEX_R, 0.352 * HEX_R, 0.026 * HEX_R)); }
function getGP8GateBand():THREE.BoxGeometry { return (gP8GateBand||= new THREE.BoxGeometry(0.222 * HEX_R, 0.044 * HEX_R, 0.024 * HEX_R)); }
function getGP8RoundSh(): THREE.CylinderGeometry { return (gP8RoundSh ||= new THREE.CylinderGeometry(0.078 * HEX_R, 0.070 * HEX_R, 0.030 * HEX_R, 8, 1)); }
function getGP8RoundLat():THREE.BoxGeometry { return (gP8RoundLat||= new THREE.BoxGeometry(0.030 * HEX_R, 0.150 * HEX_R, 0.012 * HEX_R)); }
function getGP8RoundBoss():THREE.BoxGeometry { return (gP8RoundBoss||= new THREE.BoxGeometry(0.040 * HEX_R, 0.040 * HEX_R, 0.016 * HEX_R)); }
function getGP8Spear():   THREE.BoxGeometry { return (gP8Spear   ||= new THREE.BoxGeometry(0.021 * HEX_R, 0.560 * HEX_R, 0.021 * HEX_R)); }
function getGP8SpearTip():THREE.ConeGeometry{ return (gP8SpearTip||= new THREE.ConeGeometry(0.020 * HEX_R, 0.058 * HEX_R, 4)); }
function getGP8MontBowl():THREE.CylinderGeometry { return (gP8MontBowl ||= new THREE.CylinderGeometry(0.050 * HEX_R, 0.093 * HEX_R, 0.092 * HEX_R, 8, 1)); }
function getGP8MontKnob():THREE.BoxGeometry { return (gP8MontKnob||= new THREE.BoxGeometry(0.028 * HEX_R, 0.032 * HEX_R, 0.028 * HEX_R)); }
function getGP8MontNeck():THREE.BoxGeometry { return (gP8MontNeck||= new THREE.BoxGeometry(0.150 * HEX_R, 0.020 * HEX_R, 0.052 * HEX_R)); }
function getGP8Cheek():   THREE.BoxGeometry { return (gP8Cheek   ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.052 * HEX_R, 0.044 * HEX_R)); }
function getGP8PectS():   THREE.BoxGeometry { return (gP8PectS   ||= new THREE.BoxGeometry(0.080 * HEX_R, 0.080 * HEX_R, 0.016 * HEX_R)); }
function getGP8Blade():   THREE.BoxGeometry { return (gP8Blade   ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.135 * HEX_R, 0.014 * HEX_R)); }
function getGP8BladeTip():THREE.ConeGeometry{ return (gP8BladeTip||= new THREE.ConeGeometry(0.016 * HEX_R, 0.040 * HEX_R, 4)); }
function getGP8Guard():   THREE.BoxGeometry { return (gP8Guard   ||= new THREE.BoxGeometry(0.056 * HEX_R, 0.018 * HEX_R, 0.024 * HEX_R)); }
function getGP8Spina():   THREE.BoxGeometry { return (gP8Spina   ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.300 * HEX_R, 0.014 * HEX_R)); }
function getGP8Umbo():    THREE.BoxGeometry { return (gP8Umbo    ||= new THREE.BoxGeometry(0.052 * HEX_R, 0.052 * HEX_R, 0.026 * HEX_R)); }
function getGP8Band():    THREE.BoxGeometry { return (gP8Band    ||= new THREE.BoxGeometry(0.142 * HEX_R, 0.026 * HEX_R, 0.142 * HEX_R)); }
function getGP8FeatherG():THREE.BoxGeometry { return (gP8FeatherG||= new THREE.BoxGeometry(0.026 * HEX_R, 0.108 * HEX_R, 0.012 * HEX_R)); }
function getGP8CheckSq(): THREE.BoxGeometry { return (gP8CheckSq ||= new THREE.BoxGeometry(0.036 * HEX_R, 0.036 * HEX_R, 0.010 * HEX_R)); }
function getGP8EarSpool():THREE.BoxGeometry { return (gP8EarSpool||= new THREE.BoxGeometry(0.016 * HEX_R, 0.034 * HEX_R, 0.034 * HEX_R)); }
function getGP8MaceHaft():THREE.BoxGeometry { return (gP8MaceHaft||= new THREE.BoxGeometry(0.022 * HEX_R, 0.300 * HEX_R, 0.022 * HEX_R)); }
function getGP8MaceRay(): THREE.BoxGeometry { return (gP8MaceRay ||= new THREE.BoxGeometry(0.096 * HEX_R, 0.024 * HEX_R, 0.024 * HEX_R)); }
function getGP8AxeBlade():THREE.BoxGeometry { return (gP8AxeBlade||= new THREE.BoxGeometry(0.070 * HEX_R, 0.048 * HEX_R, 0.014 * HEX_R)); }
function getGP8AxeEdge(): THREE.BoxGeometry { return (gP8AxeEdge ||= new THREE.BoxGeometry(0.014 * HEX_R, 0.056 * HEX_R, 0.010 * HEX_R)); }
function getGP8RectSh():  THREE.BoxGeometry { return (gP8RectSh  ||= new THREE.BoxGeometry(0.120 * HEX_R, 0.160 * HEX_R, 0.014 * HEX_R)); }
function getGP8ShTrim():  THREE.BoxGeometry { return (gP8ShTrim  ||= new THREE.BoxGeometry(0.128 * HEX_R, 0.022 * HEX_R, 0.018 * HEX_R)); }
function getGP8Fringe():  THREE.BoxGeometry { return (gP8Fringe  ||= new THREE.BoxGeometry(0.032 * HEX_R, 0.052 * HEX_R, 0.009 * HEX_R)); }

// ── OWALNY SCUTUM (identyczna konstrukcja jak hastati-falangita.ts) ─────────
function p8OvalRing(a: number, b: number, c: number, N: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(ang) * a, y = Math.sin(ang) * b;
    pts.push([x, y, -c * (x / a) * (x / a)]);
  }
  return pts;
}

function p8MakeOvalShellGeo(a: number, b: number, c: number, t: number, N: number): THREE.BufferGeometry {
  const ring = p8OvalRing(a, b, c, N);
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

function p8MakeOvalFaceGeo(a: number, b: number, c: number, N: number): THREE.BufferGeometry {
  const ring = p8OvalRing(a, b, c, N);
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

function getGP8ScutShell(): THREE.BufferGeometry { return (gP8ScutShell ||= p8MakeOvalShellGeo(0.104 * HEX_R, 0.190 * HEX_R, 0.052 * HEX_R, 0.020 * HEX_R, 10)); }
function getGP8ScutFace(): THREE.BufferGeometry { return (gP8ScutFace  ||= p8MakeOvalFaceGeo(0.0874 * HEX_R, 0.1596 * HEX_R, 0.0367 * HEX_R, 10)); }

// ── kinematyka lancuchowa (identyczna z hastati-falangita.ts) ───────────────
function p8DirDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}

function p8Seg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = p8DirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

/** Noga w wykroku: udo + golen + stopa PLASKO na y=0. */
function p8BuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  mFoot: THREE.MeshStandardMaterial, hipY: number = P8_HIP_Y,
): void {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = p8Seg(group, getGP8Thigh(), mThigh, P, thU, P8_THIGH_L);
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = p8Seg(group, getGP8Shin(), mShin, P, thL, P8_SHIN_L);
  const foot = new THREE.Mesh(getGP8Foot(), mFoot);
  foot.position.set(sx, 0.013 * HEX_R, P.z + 0.016 * HEX_R);
  group.add(foot);
}

/** Ramie: bark->lokiec->nadgarstek (+ opcjonalna piesc). BRON NA OSI dloni. */
function p8BuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  let P = new THREE.Vector3(sx, P8_SHLD_Y, 0);
  P = p8Seg(group, getGP8UpArm(), mUp, P, thU, P8_UPARM_L);
  P.y += 0.010 * HEX_R;
  const wrist = p8Seg(group, getGP8Forearm(), mFore, P, thF, P8_FOREARM_L);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getGP8Fist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(p8DirDown(thF), 0.014 * HEX_R));
    group.add(fist);
  }
  return { wrist, axis: p8DirDown(thF) };
}

/** Korpus: tors + szyja + glowa (+ opcjonalne oczy, gdy twarz ODKRYTA). */
function p8Core(
  group: THREE.Group, mat: MatFactory, mTorso: THREE.MeshStandardMaterial,
  skinColor: number, eyes: boolean,
): THREE.MeshStandardMaterial {
  const torso = new THREE.Mesh(getGP8Torso(), mTorso);
  torso.position.set(0, P8_TORSO_CTR, 0);
  group.add(torso);
  const mSkin = mat(skinColor, 0.05, 0.80);
  const neck = new THREE.Mesh(getGP8Neck(), mSkin);
  neck.position.set(0, P8_TORSO_TOP + P8_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(getGP8Head(), mSkin);
  head.position.set(0, P8_HEAD_CTR, 0);
  group.add(head);
  if (eyes) {
    const mEye = mat(P8_EYE, 0.02, 0.95);
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(getGP8Eye(), mEye);
      eye.position.set(sx * 0.028 * HEX_R, P8_HEAD_CTR + 0.008 * HEX_R, P8_HEAD_S * 0.5 + 0.004 * HEX_R);
      group.add(eye);
    }
  }
  return mSkin;
}

// ---------------------------------------------------------------------------
// 1. STRAZNIK BRAM HARAPPY (Harappa, Braz) — 436 tri, POZA ATAKU (obronna)
// Turban-zawoj z karneolowym klejnotem, WIELKA prostokatna tarcza z plecionki
// trzcinowej (splot klockowy: 2 listwy poziome + 2 pionowe na roznych
// glebokosciach; poziomy pas centralny = KOLOR GRACZA) przed korpusem na
// LEWYM (+X) przedramieniu, wlocznia NISKO (podchwyt straznika bram, grot ku
// wrogowi) w PRAWEJ (-X) dloni NA OSI przedramienia, biala tunika bawelniana
// (pas = KOLOR GRACZA), naszyjnik z 4 paciorkow (karneol/turkus — Harappa),
// lekki wykrok obronny (biodra -0.008). Obrona > atak — sylwetka za tarcza.
// ---------------------------------------------------------------------------
export function buildStraznikHarappy(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mCotton = mat(P8_COTTON,    0.04, 0.86);
  const mOwner  = mat(ownerColor_,  0.15, 0.65);
  const mReed   = mat(P8_REED,      0.04, 0.88);
  const mReedM  = mat(P8_REED_MID,  0.04, 0.88);
  const mReedD  = mat(P8_REED_DARK, 0.04, 0.88);
  const mCarn   = mat(P8_CARNELIAN, 0.20, 0.45);
  const mTeal   = mat(P8_TEAL,      0.18, 0.50);
  const mLeath  = mat(P8_LEATHER,   0.06, 0.82);
  const mWood   = mat(P8_WOOD,      0.05, 0.85);
  const mSteel  = mat(P8_STEEL,     0.50, 0.40);

  const HIP_Y = P8_HIP_Y - 0.008 * HEX_R;   // lekki wykrok obronny

  // korpus: tors = BIALA TUNIKA bawelniana; twarz ODKRYTA (turban) => oczy
  const mSkin = p8Core(group, mat, mCotton, P8_SKIN_INDUS, true);
  const skirt = new THREE.Mesh(getGP8Skirt(), mCotton);
  skirt.position.set(0, P8_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const hem = new THREE.Mesh(getGP8HemBand(), mReedM);       // lamowka trzcinowa
  hem.position.set(0, P8_TORSO_BOT - 0.050 * HEX_R, 0);
  group.add(hem);
  const belt = new THREE.Mesh(getGP8Belt(), mOwner);         // pas = KOLOR GRACZA
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);

  // NASZYJNIK Z PACIORKOW (karneol/turkus na przemian, lekki luk)
  let bi = 0;
  for (const bx of [-0.045, -0.015, 0.015, 0.045]) {
    const bead = new THREE.Mesh(getGP8Bead(), (bi++ % 2 === 0) ? mCarn : mTeal);
    const arc = (Math.abs(bx) < 0.03) ? -0.008 : 0.0;
    bead.position.set(bx * HEX_R, P8_TORSO_TOP - 0.014 * HEX_R + arc * HEX_R, P8_TORSO_D * 0.5 + 0.008 * HEX_R);
    group.add(bead);
  }

  // nogi: LEWA (+X) wykroczna, PRAWA (-X) zakroczna — postawa straznika
  p8BuildLeg(group,  P8_HIP_X,  0.42,  0.24, mCotton, mSkin, mLeath, HIP_Y);
  p8BuildLeg(group, -P8_HIP_X, -0.38, -0.14, mCotton, mSkin, mLeath, HIP_Y);

  // NAKRYCIE GLOWY: TURBAN-ZAWOJ (8-kat) + dolny zwoj + karneolowy KLEJNOT
  const turb = new THREE.Mesh(getGP8Turban(), mCotton);
  turb.position.set(0, P8_HEAD_CTR + 0.038 * HEX_R, 0);
  group.add(turb);
  const wrap = new THREE.Mesh(getGP8TurbWrap(), mReedM);     // zwoj (kontrast)
  wrap.rotation.y = Math.PI / 8;
  wrap.position.set(0, P8_HEAD_CTR + 0.016 * HEX_R, 0);
  group.add(wrap);
  const jewel = new THREE.Mesh(getGP8Jewel(), mCarn);        // klejnot czolowy
  jewel.position.set(0, P8_HEAD_CTR + 0.022 * HEX_R, 0.076 * HEX_R);
  group.add(jewel);

  // PRAWE (-X) RAMIE + WLOCZNIA NISKO (podchwyt): przedramie w przod poziomo,
  // drzewce NA OSI przedramienia, grot ku wrogowi na wysokosci pasa
  const armR = p8BuildArm(group, -P8_SHLD_X, 0.85, 1.52, mCotton, mSkin, mSkin);
  const grip = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  const shaft = new THREE.Mesh(getGP8Spear(), mWood);
  shaft.rotation.x = Math.PI - 1.52;
  shaft.position.copy(grip.clone().addScaledVector(armR.axis, 0.120 * HEX_R));
  group.add(shaft);
  const tip = new THREE.Mesh(getGP8SpearTip(), mSteel);
  tip.rotation.x = Math.PI - 1.52;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(grip.clone().addScaledVector(armR.axis, (0.120 + 0.280 + 0.026) * HEX_R));
  group.add(tip);

  // LEWE (+X) RAMIE + WIELKA TARCZA BRAM (plecionka trzcinowa, splot klockowy)
  const armL = p8BuildArm(group, P8_SHLD_X, 0.50, 1.10, mCotton, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.030 * HEX_R,
    armL.wrist.y + 0.052 * HEX_R,
    armL.wrist.z + 0.050 * HEX_R,
  );
  sh.rotation.y = -0.18;                                     // ku osi ciala — oslona
  const base = new THREE.Mesh(getGP8GateBase(), mReed);      // pole plecionki
  sh.add(base);
  for (const vy of [-0.105, 0.105]) {                        // listwy POZIOME splotu
    const h = new THREE.Mesh(getGP8GateH(), mReedM);
    h.position.set(0, vy * HEX_R, 0.010 * HEX_R);
    sh.add(h);
  }
  for (const vx of [-0.056, 0.056]) {                        // listwy PIONOWE (glebiej/plycej)
    const v = new THREE.Mesh(getGP8GateV(), mReedD);
    v.position.set(vx * HEX_R, 0, 0.016 * HEX_R);
    sh.add(v);
  }
  const band = new THREE.Mesh(getGP8GateBand(), mOwner);     // pas = KOLOR GRACZA
  band.position.set(0, 0, 0.020 * HEX_R);
  sh.add(band);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// 2. PIECHOTA INDUSKA (Harappa, Braz) — 384 tri, POZA ATAKU
// Lzejsza siostra straznika: GOLY tors + bawelniana szarfa przez piers,
// przepaska dhoti (pas = KOLOR GRACZA), zawoj SKROMNY z wezlem (bez klejnotu),
// MALA okragla tarcza pleciona (krzyzak splotu, boss = KOLOR GRACZA) na LEWYM
// (+X) przedramieniu, DZIDA NADRECZNIE (lokiec nad barkiem, grot w przod
// lekko w dol) w PRAWEJ (-X) dloni, 2 paciorki, wykrok (biodra -0.010).
// ---------------------------------------------------------------------------
export function buildPiechotaInduska(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkinT  = mat(P8_SKIN_INDUS, 0.05, 0.80);            // tors = skora
  const mCotton = mat(P8_COTTON,    0.04, 0.86);
  const mEcru   = mat(P8_ECRU,      0.04, 0.86);
  const mOwner  = mat(ownerColor_,  0.15, 0.65);
  const mReed   = mat(P8_REED,      0.04, 0.88);
  const mReedD  = mat(P8_REED_DARK, 0.04, 0.88);
  const mCarn   = mat(P8_CARNELIAN, 0.20, 0.45);
  const mTeal   = mat(P8_TEAL,      0.18, 0.50);
  const mLeath  = mat(P8_LEATHER,   0.06, 0.82);
  const mWood   = mat(P8_WOOD,      0.05, 0.85);
  const mSteel  = mat(P8_STEEL,     0.50, 0.40);

  const HIP_Y = P8_HIP_Y - 0.010 * HEX_R;

  // korpus: GOLY TORS (skora Indusu), twarz odkryta => oczy
  const mSkin = p8Core(group, mat, mSkinT, P8_SKIN_INDUS, true);
  // bawelniana SZARFA przez piers (prawy bark -> lewe biodro)
  const sash = new THREE.Mesh(getGP8Strap(), mCotton);
  sash.scale.set(1.25, 1.85, 1.0);
  sash.rotation.set(-0.16, 0, 0.60);
  sash.position.set(-0.008 * HEX_R, P8_TORSO_CTR + 0.012 * HEX_R, P8_TORSO_D * 0.5 + 0.005 * HEX_R);
  group.add(sash);
  // DHOTI: biala przepaska + pas = KOLOR GRACZA
  const skirt = new THREE.Mesh(getGP8Skirt(), mCotton);
  skirt.position.set(0, P8_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const belt = new THREE.Mesh(getGP8Belt(), mOwner);
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);

  // 2 paciorki (karneol + turkus — skromniej niz straznik)
  let bi = 0;
  for (const bx of [-0.018, 0.018]) {
    const bead = new THREE.Mesh(getGP8Bead(), (bi++ % 2 === 0) ? mCarn : mTeal);
    bead.position.set(bx * HEX_R, P8_TORSO_TOP - 0.016 * HEX_R, P8_TORSO_D * 0.5 + 0.008 * HEX_R);
    group.add(bead);
  }

  // nogi: gole (dhoti konczy sie nad kolanem), sandaly skorzane
  p8BuildLeg(group,  P8_HIP_X,  0.55,  0.30, mSkin, mSkin, mLeath, HIP_Y);
  p8BuildLeg(group, -P8_HIP_X, -0.50, -0.16, mSkin, mSkin, mLeath, HIP_Y);

  // NAKRYCIE GLOWY: ZAWOJ SKROMNY (nizszy 8-kat, ecru) + WEZEL z boku
  const wrapS = new THREE.Mesh(getGP8WrapS(), mEcru);
  wrapS.position.set(0, P8_HEAD_CTR + 0.040 * HEX_R, 0);
  group.add(wrapS);
  const knot = new THREE.Mesh(getGP8Knot(), mEcru);
  knot.position.set(-0.062 * HEX_R, P8_HEAD_CTR + 0.030 * HEX_R, -0.022 * HEX_R);
  group.add(knot);

  // PRAWE (-X) RAMIE + DZIDA NADRECZNIE (jak seria: lokiec nad barkiem,
  // grot w przod lekko w dol NA OSI dzialania)
  const armR = p8BuildArm(group, -P8_SHLD_X, -2.55, 1.32, mSkin, mSkin, mSkin);
  const spearTh = Math.PI * 0.5 + 0.20;
  const spearAxis = new THREE.Vector3(0, -Math.sin(0.20), Math.cos(0.20));
  const grip = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  const shaft = new THREE.Mesh(getGP8Spear(), mWood);
  shaft.rotation.x = spearTh;
  shaft.position.copy(grip.clone().addScaledVector(spearAxis, 0.096 * HEX_R));
  group.add(shaft);
  const tip = new THREE.Mesh(getGP8SpearTip(), mSteel);
  tip.rotation.x = spearTh;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(grip.clone().addScaledVector(spearAxis, (0.096 + 0.280 + 0.026) * HEX_R));
  group.add(tip);

  // LEWE (+X) RAMIE + MALA OKRAGLA TARCZA PLECIONA przed korpusem
  const armL = p8BuildArm(group, P8_SHLD_X, 0.52, 1.05, mSkin, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.020 * HEX_R,
    armL.wrist.y + 0.030 * HEX_R,
    armL.wrist.z + 0.042 * HEX_R,
  );
  sh.rotation.y = -0.20;
  const face = new THREE.Mesh(getGP8RoundSh(), mReed);       // pole trzcinowe
  face.rotation.x = Math.PI / 2;
  sh.add(face);
  for (const rz of [0, Math.PI / 2]) {                       // krzyzak splotu
    const lat = new THREE.Mesh(getGP8RoundLat(), mReedD);
    lat.rotation.z = rz;
    lat.position.set(0, 0, 0.014 * HEX_R);
    sh.add(lat);
  }
  const boss = new THREE.Mesh(getGP8RoundBoss(), mOwner);    // boss = KOLOR GRACZA
  boss.position.set(0, 0, 0.020 * HEX_R);
  sh.add(boss);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// 3. LEGION RZYMSKI (Rzym, Braz — wczesny legionariusz) — 414 tri, POZA ATAKU
// EWIDENTNY PRZODEK Hastatiego (wzor rodziny rzymskiej): TE SAME pozy (pchniecie
// gladiusem, gleboki wykrok biodra -0.012) i TEN SAM owalny scutum (pole =
// KOLOR GRACZA, skorzany rant, umbo + spina), ale WSZYSTKO PROSTSZE:
// montefortino BRAZOWY BEZ pior i kity (sam GUZEK), pectorale MNIEJSZE
// brazowe na skrzyzowanych pasach, gladius BRAZOWY (klinga z brazu — epoka!),
// tunika CIEMNOczerwona (starszy barwnik), BEZ nagolennicy. Mniej ozdob,
// rodzina widoczna na pierwszy rzut oka.
// ---------------------------------------------------------------------------
export function buildLegionRzymski(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mBronze = mat(P8_BRONZE,    0.42, 0.46);             // helm/pectorale/umbo
  const mBronzL = mat(P8_BRONZE_LT, 0.52, 0.38);             // klinga gladiusa
  const mOwner  = mat(ownerColor_,  0.15, 0.65);
  const mDkRed  = mat(P8_DARKRED,   0.05, 0.82);             // CIEMNA tunika
  const mLeath  = mat(P8_LEATHER,   0.05, 0.82);
  const mSkin   = mat(P8_SKIN,      0.05, 0.80);

  const HIP_Y = P8_HIP_Y - 0.012 * HEX_R;   // gleboki wypad (jak Hastati)

  // korpus: tors = CIEMNOCZERWONA TUNIKA (twarz pod montefortino — bez oczu,
  // spojnie z Hastatim)
  p8Core(group, mat, mDkRed, P8_SKIN, false);
  const skirt = new THREE.Mesh(getGP8Skirt(), mDkRed);
  skirt.position.set(0, P8_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const belt = new THREE.Mesh(getGP8Belt(), mLeath);
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);

  // PECTORALE MNIEJSZE (braz, nie zloto) na skrzyzowanych pasach — jak u
  // Hastatiego, ale skromniej
  const pect = new THREE.Mesh(getGP8PectS(), mBronze);
  pect.position.set(0, 0.386 * HEX_R, P8_TORSO_D * 0.5 + 0.010 * HEX_R);
  group.add(pect);
  for (const s of [-1, 1]) {
    const strap = new THREE.Mesh(getGP8Strap(), mLeath);
    strap.rotation.set(-0.55, 0, s * 0.62);
    strap.position.set(s * 0.020 * HEX_R, 0.446 * HEX_R, 0.040 * HEX_R);
    group.add(strap);
  }

  // nogi: TA SAMA rodzina wypadu co Hastati; BEZ nagolennicy (prostszy przodek)
  p8BuildLeg(group,  P8_HIP_X,  0.58,  0.34, mDkRed, mSkin, mLeath, HIP_Y);
  p8BuildLeg(group, -P8_HIP_X, -0.52, -0.20, mDkRed, mSkin, mLeath, HIP_Y);

  // HELM MONTEFORTINO BRAZOWY: miska + karczek + policzki + SAM GUZEK
  // (bez kity i bez pior — to dopiero u potomka-Hastatiego)
  const bowl = new THREE.Mesh(getGP8MontBowl(), mBronze);
  bowl.position.set(0, P8_HEAD_CTR + 0.030 * HEX_R, 0);
  group.add(bowl);
  const neckG = new THREE.Mesh(getGP8MontNeck(), mBronze);
  neckG.rotation.x = -0.35;
  neckG.position.set(0, P8_HEAD_CTR - 0.014 * HEX_R, -(P8_HEAD_S * 0.5 + 0.020 * HEX_R));
  group.add(neckG);
  for (const sx of [-1, 1]) {
    const ck = new THREE.Mesh(getGP8Cheek(), mBronze);
    ck.position.set(sx * (P8_HEAD_S * 0.5 + 0.004 * HEX_R), P8_HEAD_CTR - 0.014 * HEX_R, 0.018 * HEX_R);
    group.add(ck);
  }
  const knob = new THREE.Mesh(getGP8MontKnob(), mBronzL);    // guzek szczytowy
  knob.position.set(0, P8_HEAD_TOP + 0.026 * HEX_R, 0);
  group.add(knob);

  // PRAWE (-X) RAMIE + GLADIUS BRAZOWY: pchniecie w przod na wysokosci piersi
  // (IDENTYCZNA poza jak Hastati — rodzina!), klinga NA OSI przedramienia
  const armR = p8BuildArm(group, -P8_SHLD_X, 0.95, 1.50, mDkRed, mSkin, mLeath);
  const bladeDir = armR.axis;
  const blade = new THREE.Mesh(getGP8Blade(), mBronzL);      // KLINGA Z BRAZU
  blade.rotation.x = Math.PI - 1.50;
  blade.position.copy(armR.wrist.clone().addScaledVector(bladeDir, 0.098 * HEX_R));
  group.add(blade);
  const tip = new THREE.Mesh(getGP8BladeTip(), mBronzL);
  tip.rotation.x = Math.PI - 1.50;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(armR.wrist.clone().addScaledVector(bladeDir, 0.1875 * HEX_R));
  group.add(tip);
  const guard = new THREE.Mesh(getGP8Guard(), mLeath);       // jelec skorzano-drewniany
  guard.rotation.x = Math.PI - 1.50;
  guard.position.copy(armR.wrist.clone().addScaledVector(bladeDir, 0.030 * HEX_R));
  group.add(guard);

  // LEWE (+X) RAMIE + OWALNY SCUTUM przed korpusem — TEN SAM KSZTALT co
  // Hastati (ciaglosc rodziny); umbo i spina BRAZOWE (nie zlote)
  const armL = p8BuildArm(group, P8_SHLD_X, 0.50, 1.10, mDkRed, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.025 * HEX_R,
    armL.wrist.y + 0.034 * HEX_R,
    armL.wrist.z + 0.045 * HEX_R,
  );
  sh.rotation.y = -0.22;
  const shell = new THREE.Mesh(getGP8ScutShell(), mLeath);   // rant + plecy
  sh.add(shell);
  const face = new THREE.Mesh(getGP8ScutFace(), mOwner);     // POLE = KOLOR GRACZA
  face.position.set(0, 0, 0.016 * HEX_R);
  sh.add(face);
  const spina = new THREE.Mesh(getGP8Spina(), mBronze);
  spina.position.set(0, 0, 0.024 * HEX_R);
  sh.add(spina);
  const umbo = new THREE.Mesh(getGP8Umbo(), mBronze);
  umbo.position.set(0, 0, 0.034 * HEX_R);
  sh.add(umbo);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// 4. GWARDZISTA Z CHAMPI (Inkowie, Braz) — 456 tri, POZA ATAKU
// Elitarny, ale SKROMNIEJSZY niz Krolewska Gwardia z P2 (bez korony z wachlarzem
// i bez choragwi): CHAMPI = maczugo-topor z BRAZOWA glowica GWIAZDA + OSTRZE
// w PRAWEJ (-X) dloni w zamachu szczytowym, MALA pullcanca (pole = KOLOR
// GRACZA, zlota listwa, 2 fredzle) na LEWYM (+X) przedramieniu, ZLOTE llautu
// + 3 piora (srodek biale, boki turkusowe), unku ochra z szachownica tokapu,
// zlote orejones (nauszniki), pas chumpi turkusowy, wykrok (biodra -0.008).
// Styl andyjski spojny z paczka P2 (tokapu, llautu, turkus + zloto).
// ---------------------------------------------------------------------------
export function buildGwardzistaChampi(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mOchre = mat(P8_OCHRE,    0.06, 0.80);
  const mRed   = mat(P8_RED,      0.06, 0.78);
  const mTeal  = mat(P8_TEAL,     0.06, 0.78);
  const mGold  = mat(P8_GOLD,     0.55, 0.35);
  const mFeath = mat(P8_FEATHER,  0.03, 0.92);
  const mOwner = mat(ownerColor_, 0.16, 0.62);
  const mWoodD = mat(P8_WOOD_DK,  0.05, 0.85);
  const mBronz = mat(P8_BRONZE,   0.45, 0.42);
  const mBronL = mat(P8_BRONZE_LT,0.55, 0.35);
  const mLeath = mat(P8_LEATHER,  0.06, 0.82);

  const HIP_Y = P8_HIP_Y - 0.008 * HEX_R;

  // korpus: unku ochra, twarz ODKRYTA (llautu) => oczy; skora ogorzala jak P2
  const mSkin = p8Core(group, mat, mOchre, P8_SKIN_DARK, true);
  const skirt = new THREE.Mesh(getGP8Skirt(), mOchre);
  skirt.position.set(0, P8_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const hem = new THREE.Mesh(getGP8HemBand(), mRed);         // czerwony brzeg unku
  hem.position.set(0, P8_TORSO_BOT - 0.050 * HEX_R, 0);
  group.add(hem);
  const belt = new THREE.Mesh(getGP8Belt(), mTeal);          // pas chumpi turkus
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);

  // szachownica tokapu 3 kwadraty (czerwien/turkus) na piersi — znak elity
  let ci = 0;
  for (const dx of [-0.048, 0.0, 0.048]) {
    const sq = new THREE.Mesh(getGP8CheckSq(), (ci++ % 2 === 0) ? mRed : mTeal);
    sq.position.set(dx * HEX_R, P8_TORSO_CTR + 0.020 * HEX_R, P8_TORSO_D * 0.5 + 0.006 * HEX_R);
    group.add(sq);
  }

  // nogi: pewny wykrok gwardzisty
  p8BuildLeg(group,  P8_HIP_X,  0.50,  0.28, mOchre, mSkin, mLeath, HIP_Y);
  p8BuildLeg(group, -P8_HIP_X, -0.45, -0.15, mOchre, mSkin, mLeath, HIP_Y);

  // NAKRYCIE GLOWY: ZLOTE llautu + 3 piora (biale + 2 turkusowe) + orejones
  const band = new THREE.Mesh(getGP8Band(), mGold);
  band.position.set(0, P8_HEAD_CTR + 0.034 * HEX_R, 0);
  group.add(band);
  let fi = 0;
  for (const az of [-0.26, 0.0, 0.26]) {
    const f = new THREE.Mesh(getGP8FeatherG(), (fi++ === 1) ? mFeath : mTeal);
    f.rotation.z = az;
    f.position.set(Math.sin(az) * 0.050 * HEX_R, P8_HEAD_TOP + 0.054 * HEX_R, -0.010 * HEX_R);
    group.add(f);
  }
  for (const sx of [-1, 1]) {                                // zlote nauszniki
    const e = new THREE.Mesh(getGP8EarSpool(), mGold);
    e.position.set(sx * (P8_HEAD_S * 0.5 + 0.007 * HEX_R), P8_HEAD_CTR - 0.012 * HEX_R, 0.006 * HEX_R);
    group.add(e);
  }

  // PRAWE (-X) RAMIE + CHAMPI w zamachu szczytowym (glowica nad glowa):
  // drzewce NA OSI przedramienia; glowica = GWIAZDA (3 skrzyzowane ramiona
  // BRAZOWE prostopadle do drzewca) + plaskie OSTRZE topora z boku
  const armR = p8BuildArm(group, -P8_SHLD_X, -2.45, 2.60, mOchre, mSkin, mSkin);
  const fist = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  const wg = new THREE.Group();
  wg.position.copy(fist);
  wg.rotation.x = Math.PI - 2.60;
  const haft = new THREE.Mesh(getGP8MaceHaft(), mWoodD);
  haft.position.set(0, 0.100 * HEX_R, 0);
  wg.add(haft);
  for (const az of [0, Math.PI / 3, (2 * Math.PI) / 3]) {    // gwiazda champi
    const ray = new THREE.Mesh(getGP8MaceRay(), mBronz);
    ray.rotation.y = az;
    ray.position.set(0, 0.210 * HEX_R, 0);
    wg.add(ray);
  }
  const axeB = new THREE.Mesh(getGP8AxeBlade(), mBronz);     // OSTRZE z boku glowicy
  axeB.position.set(0.078 * HEX_R, 0.210 * HEX_R, 0);
  wg.add(axeB);
  const axeE = new THREE.Mesh(getGP8AxeEdge(), mBronL);      // krawedz tnaca
  axeE.position.set(0.116 * HEX_R, 0.210 * HEX_R, 0);
  wg.add(axeE);
  group.add(wg);

  // LEWE (+X) RAMIE + MALA PULLCANCA przed korpusem (skromniejsza niz SUPER:
  // bez zlotego slonca; zlota listwa + 2 fredzle)
  const armL = p8BuildArm(group, P8_SHLD_X, 0.50, 1.10, mOchre, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.020 * HEX_R,
    armL.wrist.y + 0.030 * HEX_R,
    armL.wrist.z + 0.040 * HEX_R,
  );
  sh.rotation.y = -0.20;
  const face = new THREE.Mesh(getGP8RectSh(), mOwner);       // pole = KOLOR GRACZA
  sh.add(face);
  const trim = new THREE.Mesh(getGP8ShTrim(), mGold);        // zlota listwa gorna
  trim.position.set(0, 0.082 * HEX_R, 0.004 * HEX_R);
  sh.add(trim);
  for (const [fx, colF] of [[-0.032, mTeal], [0.032, mRed]] as [number, THREE.MeshStandardMaterial][]) {
    const fr = new THREE.Mesh(getGP8Fringe(), colF);
    fr.position.set(fx * HEX_R, -0.108 * HEX_R, 0.002 * HEX_R);
    sh.add(fr);
  }
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}
