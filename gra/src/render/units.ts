/**
 * units.ts
 * Renders unit tokens and movement-range highlight discs on the hex map.
 *
 * Token visual: ROBLOX R6-style box avatar per category (~0.55*HEX_R tall).
 * Categories: osadnik | miecznik | wlocznik | lucznik | procarz | oszczepnik |
 *             maczuga | topor | konnica | rydwan | super | domyslny
 *
 * Base avatar (buildBaseAvatar):
 *   - Box HEAD     (~0.13R cube)      skin tone, two dark eye dots
 *   - Box TORSO    (0.18 x 0.22 x 0.10 R)  cloth/tunic color
 *   - Box ARMS x2  (0.06 x 0.20 x 0.06 R)  cloth color
 *   - Box LEGS x2  (0.07 x 0.20 x 0.07 R)  dark trousers
 * Total height ~0.55*HEX_R; feet at y=0 of group.
 *
 * Per-category gear layered on top (boxes, low-poly) -- see buildUnitModel.
 *
 * Highlight visual:
 *   A flat hexagonal disc (CylinderGeometry, 6 sides) with MeshBasicMaterial
 *   transparent at 0.35 opacity, color 0x66ccff.
 *
 * Route visual:
 *   TubeGeometry along CatmullRomCurve3 (gold 0xffe27a, opacity 0.9).
 *   Intermediate dots: SphereGeometry. Destination: TorusGeometry ring.
 */

import * as THREE from 'three';
import { clientRectToNdc } from '../input/picker';
import type { GameMap } from '../types/map';
import type { Hex } from '../types/hex';
import { TerenBazowy } from '../types/hex';
import { axialToWorld, HEX_R } from './hexutil';
import { buildHorse } from './kon-nowy-model';
import { GAME_MAP_RENDER_STYLE, terrainVisualForStyle } from './mapRenderStyle';
import type { RuntimeUnit } from '../units/setup';
import type { StackDisplayInfo } from '../game/armyMerge';
// Odznaki ulepszeń budynkowych na żetonie — od C-OBCE-JEDN-Q2 (Maciej 2026-07-29)
// DWIE OSOBNE ikony w rządku nad głową: Koszary (ścieżka B) po lewej od gwiazdek,
// Kuźnia (ścieżka A) po prawej. Zasoby to singletony modułu — NIE trafiają do
// userData['mats'], patrz nagłówek unitUpgradeBadges.ts.
import { applyUnitUpgradeBadgeRow, syncUnitUpgradeBadges } from './unitUpgradeBadges';
// Odznaki poziomu weterana na żetonie (dokończenie tej samej decyzji 57,
// 2026-07-26) — złote gwiazdki NAD GŁOWĄ, w miejscu zarezerwowanym wtedy jako
// VETERAN_BADGE_RESERVED_Y. Zasoby to singletony modułu, jak wyżej.
// VETERAN_BADGE_HIT_UD: znacznik siatek gwiazdek dla raycastera — tooltip
// poziomu weterana (C-OBCE-JEDN-Q3) rozpoznaje po nim trafienie w odznakę.
import { applyUnitVeteranBadgeStarCount, syncUnitVeteranBadges, VETERAN_BADGE_HIT_UD } from './unitVeteranBadges';
// Znak właściciela przy lewej krawędzi żetonu (C-OBCE-JEDN-Q2): portret władcy /
// sygnet kultury miasta-państwa / czaszka barbarzyńców. Kontekst właściciela
// wstrzykuje main.ts przez setOwnerEmblemResolver — ten renderer nie sięga do
// stanu gry. Tekstury są współdzielone per wariant znaku, patrz nagłówek modułu.
import type { UnitOwnerEmblemResolver } from './unitOwnerEmblem';
// R-ZETON-PASKI (Maciej 2026-07-29, C-ZETON-PASKI-Q1 = A): TABLICZKA JEDNOSTKI —
// jeden zwarty obiekt nad figurką: mała ikona właściciela LEWO · pasek Ruchu
// (niebieski) i pasek HP w środku · pole Mocy armii PRAWO. Rządek Koszary/
// gwiazdki/Kuźnia stoi NA tabliczce (jej wysokość podaje unitStatPlate.ts).
// Duży, samodzielny medalion właściciela ZNIKNĄŁ — wszedł do tabliczki.
// Zasoby to singletony modułu; NIC nie trafia do userData['mats'].
import { applyUnitStatPlate } from './unitStatPlate';
import { buildHastati as newBuildHastati, buildFalangita as newBuildFalangita } from './hastati-falangita';
// KAMIEŃ OPUS 5 (Maciej 2026-07-25, decyzja C-HASTATI-Q1=B): jednostki epoki Kamienia
// przebudowane na wyższy standard szczegółowości + zgodność historyczna (warunek strategiczny).
import {
  buildWojownikOpus5,
  buildOszczepnikOpus5,
  buildLucznikOpus5,
  buildZwiadowcaOpus5,
} from './kamien-bazowe-opus5';
import { buildMaceWarriorOpus5, buildInkaJavelineerOpus5 } from './kamien-inka-opus5';
import { buildBatteringRamOpus5, buildZuluJavelineerOpus5 } from './kamien-zulu-taran-opus5';
import { buildEgyptianArcherOpus5, buildSumerianArcherOpus5 } from './kamien-lucznicy-opus5';
import { buildNubianArcherOpus5 } from './braz-lucznik-nubijski-opus5';
// BRĄZ OPUS 5 (Maciej 2026-07-25): taran epoki Brązu na KOŁACH — nie może być
// tym samym modelem co płozowy taran Kamienia (koło ~3500 p.n.e.).
import { buildTaranOkutyOpus5 } from './braz-taran-opus5';
// BRĄZ OPUS 5 — komplet jednostek bazowych epoki Brązu (Maciej 2026-07-26:
// „wpinaj jednostki brązu"). Wszystkie cztery to jednostki DOSTĘPNE DLA
// WSZYSTKICH CYWILIZACJI (Kultura=null w units.json), więc dispatch po NAZWIE
// jest dokładny — warianty kulturowe (sumeryjski, inkaski, egipski…) mają
// własne, wcześniejsze wpisy w buildNamedUnit i nie są tu przechwytywane.
import { buildWlocznikBrazOpus5 } from './braz-wlocznik-opus5';
import { buildMiecznikBrazOpus5 } from './braz-miecznik-opus5';
import { buildProcarzBrazOpus5 } from './braz-procarz-opus5';
import { buildRydwanWolyBrazOpus5 } from './braz-rydwan-woly-opus5';
// BRĄZ OPUS 5 — RYDWAN KAPADOKIJSKI (jednostka UNIKALNA Hetytów, units.json:
// „Rydwan Kapadokijski"/„Cappadocian Chariot", Kultura=Nacja=Hetyci). Do
// 2026-08-06 była to JEDYNA jednostka unikalna epoki Brązu bez własnej grafiki
// — categoryOf() (units/setup.ts, dopasowanie po słowie „rydwan") wysyłał ją
// do generycznego case 'rydwan' poniżej, identycznego jak każdy inny rydwan.
// Wyróżnik modelu: TRZYOSOBOWA ZAŁOGA (woźnica + włócznik + tarczownik) —
// historycznie udokumentowana cecha rydwanu hetyckiego (reliefy z Kadesz),
// w odróżnieniu od dwuosobowych rydwanów egipskich i mykeńskich.
import { buildRydwanKapadokijskiOpus5 } from './braz-rydwan-kapadokijski-opus5';
// BRĄZ OPUS 5 — KONNICA (units.json: „Konnica"/„Horseman", Epoka=Brąz,
// Kultura=null, Tech=Jeździectwo). Do tej pory jedyna jednostka bazowa Brązu
// BEZ własnej grafiki — leciała na wspólnym modelu kategorii 'konnica' niżej
// (generyczny koń + beznogi jeździec bez uzdy i oporządzenia). Nowy model jest
// wczesnym jeźdźcem epoki Brązu: BEZ strzemion, BEZ siodła z łękami, czaprak
// na poprągu/napierśniku/pośliśniku, uzda z brązowym wędzidłem.
import { buildKonnicaBrazOpus5 } from './braz-konnica-opus5';
// ASYRIA ŻELAZO OPUS 5 — dwa dedykowane modele kawalerii (Konnica lancowa i
// Konnica łucznicza asyryjska), zastępujące dotychczasowy wspólny fallback
// `case 'konnica'` dla tej pary jednostek kulturowych (R-ZELAZO-MODELE-BRAKUJACE-Q1-T1).
import {
  buildZelazoKonnicaLancowaAsyryjska,
  buildZelazoKonnicaLuczniczaAsyryjska,
} from './zelazo-konnica-asyryjska-opus5';
// SŁOWIANIE ŻELAZO OPUS 5 — „Jeździec z oszczepami"/„Slavic Javelin Cavalry"
// (R-ZELAZO-MODELE-BRAKUJACE-Q1-T4). Do dziś BEZ własnej grafiki: `categoryOf()`
// łapie ją słowem `jezdz` i odsyła do generycznego `case 'konnica'` z KOPIĄ
// trzymaną nadręcznie — a jednostka ma w units.json `Atak dystansowy: 2`,
// `Zasięg ataku (hex): 2` i `Ilość pocisków: 5`. Nowy model: lekki oszczepnik
// konny w pozycji rzutu, 5 drzewc (1 w dłoni + 4 w pęku), strzemiona i siodło
// z terlicą (inna rama czasowa niż Brąz/Asyria), tarcza okrągła na plecach.
import { buildZelazoJezdziecOszczepami } from './zelazo-jezdziec-oszczepami-opus5';
// BRĄZ OPUS 5 — „Rydwan konny"/„War Chariot" (Kultura=null, Tech=Jeździectwo).
// Do 2026-08-06 jedyna uniwersalna jednostka Brązu BEZ własnej grafiki: leciała
// na wspólny model kategorii 'rydwan' bez żadnej dekoracji (warianty kulturowe
// — mykeński/Shang/celtycki — dostawały przynajmniej decorateChariot()).
// Dedykowany model: lekki dwukołowy rydwan Późnego Brązu, koła SZPRYCHOWE,
// oś na tyle platformy, para koni w jarzmie grzbietowym.
import { buildRydwanKonnyBrazOpus5 } from './braz-rydwan-konny-opus5';
// ŻELAZO OPUS 5 — Hastati republikański (units.json: „Hastati", Epoka=Żelazo,
// Nacja=Rzym) — zastępuje wariant z hastati-falangita.ts.
import { buildHastatiOpus5 } from './hastati-opus5';
import {
  buildProcarz as newBuildProcarz,
  buildWlocznik as newBuildWlocznik,
  buildMiecznik as newBuildMiecznik,
} from './jednostki-p1-rdzen';
import {
  buildAxeWarriorInka as newBuildAxeWarriorInka,
  buildInkaSlinger as newBuildInkaSlinger,
} from './jednostki-p2-inka';
import {
  buildAkkadianArcher as newBuildAkkadianArcher,
  buildAssyrianArcher,
} from './jednostki-p3-dystans';
import {
  buildSherden as newBuildSherden,
  buildTyrrhenian as newBuildTyrrhenian,
  buildShekelesh as newBuildShekelesh,
  buildMycenaeanWarrior as newBuildMycenaeanWarrior,
  buildShangHalberdier as newBuildShangHalberdier,
  buildKhopeshWarrior as newBuildKhopeshWarrior,
} from './jednostki-p4-melee';
import {
  buildImpi as newBuildImpi,
  buildSumerianSpearman as newBuildSumerianSpearman,
  buildSiegeTower as newBuildSiegeTower,
} from './jednostki-p57-wlocznie-machiny';
import {
  buildSuperGreece as newBuildSuperGreece,
  buildSuperRome as newBuildSuperRome,
} from './jednostki-p6-super';
import {
  buildPiechotaHetycka,
  buildGwardiaIshtar,
  buildWojownikBabilonski,
  buildWojownikFenicki,
} from './jednostki-p8a-bliskiwschod';
import {
  buildStraznikHarappy,
  buildPiechotaInduska,
  buildLegionRzymski,
  buildGwardzistaChampi,
} from './jednostki-p8b-rozni';
import {
  buildGwardiaHetycka,
  buildPiechotaNeobabilonska,
  buildMurTarcz,
  buildGarnizonHarappy,
} from './jednostki-z1-mezopotamia';
import {
  buildTyrskiMiecznik,
  buildGwardiaTyrenska,
  buildZelaznyKhopesh,
  buildThorakites,
  buildTriari,
} from './jednostki-z2-srodziemne';
import {
  buildDruzynnik,
  buildIButho,
  buildGermanSuper,
  buildMiecznikGalijski,
  // T8: bespoke Berserker przeniesiony do serii Z3 (patrz linia dispatchu nizej).
  buildBerserker as buildBerserkerZ3,
} from './jednostki-z3-plemiona';
import { buildGalera as newBuildGalera } from './galera-model';

// ---------------------------------------------------------------------------
// Terrain top-Y — spójne z scene.ts przez terrainVisualForStyle (Roblox/Civ)
// ---------------------------------------------------------------------------

interface TerrainTopY {
  height: number;
  yOffset: number;
}

/** Wysokości Civ (legacy) — fallback gdy styl ≠ roblox. */
const CIV_TERRAIN_TOP: Record<TerenBazowy, TerrainTopY> = {
  [TerenBazowy.Morze]:    { height: 0.30, yOffset: 0.00 },
  [TerenBazowy.Wybrzeze]: { height: 0.35, yOffset: 0.05 },
  [TerenBazowy.Laka]:     { height: 0.40, yOffset: 0.05 },
  [TerenBazowy.Rownina]:  { height: 0.45, yOffset: 0.08 },
  [TerenBazowy.Pustynia]: { height: 0.42, yOffset: 0.08 },
  [TerenBazowy.Wzgorza]:  { height: 0.70, yOffset: 0.15 },
  [TerenBazowy.Gory]:     { height: 1.20, yOffset: 0.40 },
  [TerenBazowy.Polarny]:  { height: 0.38, yOffset: 0.06 },
};

// Returns the Y coordinate of the TOP surface of the terrain prism.
function terrainTopY(hex: Hex): number {
  const spec = terrainVisualForStyle(hex.terenBazowy, GAME_MAP_RENDER_STYLE, CIV_TERRAIN_TOP[hex.terenBazowy]);
  return spec.height + spec.yOffset;
}

/** Relief żetonu na podniesionym terenie — żeby jednostka nie tonęła w kopcu wzgórza
 *  / szczycie góry (dekoracje są w centrum heksa PONAD pryzmem). Wartości strojone. */
function unitTerrainRelief(t: TerenBazowy): number {
  if (t === TerenBazowy.Wzgorza) return HEX_R * 0.22;
  if (t === TerenBazowy.Gory)    return HEX_R * 0.34;
  return 0;
}

// ---------------------------------------------------------------------------
// Owner color palette
// ---------------------------------------------------------------------------

const OWNER_COLORS: number[] = [
  0xffd54a, // 0 = player (gold)
  0xe53935, // 1 = red
  0x43a047, // 2 = green
  0x1e88e5, // 3 = blue
  0xfb8c00, // 4 = orange
  0x8e24aa, // 5 = purple
  0x00acc1, // 6 = teal
  0xf06292, // 7 = pink
];

function ownerColor(ownerId: number): number {
  return OWNER_COLORS[ownerId % OWNER_COLORS.length]!;
}

// ---------------------------------------------------------------------------
// Roblox R6 proportions (all in world units relative to HEX_R)
// Feet at y=0 of the group; total height ~0.55*HEX_R.
// ---------------------------------------------------------------------------

const TOKEN_LIFT = 0.01 * HEX_R;

/** Jednostka na heksie miasta — ponad zabudową, przesunięta ku krawędzi heksa. */
const CITY_UNIT_EXTRA_LIFT = 0.28 * HEX_R;
const CITY_UNIT_OFFSET     = 0.38 * HEX_R;
/** Kierunek +Z (pointy-top) — przed miastem z typowej kamery mapy. */
const CITY_UNIT_OFFSET_ANGLE = Math.PI / 2;
const CITY_UNIT_SCALE        = 1.22;

/**
 * MAP-Q1: parametry czaszki głodu (☠) rysowanej nad jednostkami głodującego
 * państwa. Wartości dobrane pod oko właściciela na starcie — proste do
 * dostrojenia w jednym miejscu:
 *  - SCALE: rozmiar sprite'a w jednostkach świata (HEX_R=1). Token jednostki
 *    ma wysokość ~0.58*HEX_R (AV_Y_HEAD_TOP) — 0.85 celowo większe/wyraźniejsze.
 *  - OPACITY: półprzezroczystość, żeby jednostka pod spodem prześwitywała.
 *  - RENDER_ORDER: wyżej niż badge stosu (10) i stary chip (11), zawsze na wierzchu.
 */
const STARVING_SKULL_SCALE         = 0.85;
const STARVING_SKULL_OPACITY       = 0.30;
const STARVING_SKULL_RENDER_ORDER  = 15;

/**
 * R-STATUS-PRZYCZYNA-CIERPIENIA-Q1=C (Maciej 2026-08-06) — IKONA PER PRZYCZYNA.
 *
 * Do tej pory nad jednostką wisiała JEDNA uniwersalna czaszka głodu, więc gracz
 * nie odróżniał, czy jednostka słabnie od braku Żywności (isArmyHungry), czy od
 * pustego Skarbca (isGoldDeficit, gold-deficit.ts). Teraz każda przyczyna ma
 * własny sprite i obie mogą wisieć JEDNOCZEŚNIE:
 *   - GŁÓD WOJSKA  → czerwona czaszka ☠ (bez zmian, właściciel ją już zna);
 *   - DEFICYT ZŁOTA → złota moneta przekreślona karmazynową belką (pusty Skarbiec).
 *
 * Rozmiary (jednostki świata, HEX_R = 1; token jednostki ma ~0.58*HEX_R wysokości):
 *  - SUFFER_ICON_SCALE_SINGLE = 0.85 — jedna przyczyna, wartość zastana (MAP-Q1);
 *  - SUFFER_ICON_SCALE_PAIR   = 0.58 — dwie przyczyny naraz; zmniejszone, bo
 *    2 × 0.85 = 1.70 przy szerokości heksu 2*HEX_R zachodziłoby na sąsiadów;
 *  - SUFFER_ICON_PAIR_DX      = 0.30*HEX_R — połowa rozstawu pary w osi X
 *    (czaszka w lewo −DX, moneta w prawo +DX). Sprite'y są billboardami, a
 *    kamera mapy ma azymut 0 na stałe (elewacja 52°), więc lokalna oś X tokena
 *    pokrywa się z poziomem ekranu i ikony NIGDY na siebie nie nachodzą.
 *  - SUFFER_ICON_Y / _Z — wysokość nad głową i wysunięcie ku kamerze; te same
 *    wartości, co miała pojedyncza czaszka przed zmianą.
 */
const SUFFER_ICON_SCALE_SINGLE     = STARVING_SKULL_SCALE;
const SUFFER_ICON_SCALE_PAIR       = 0.58;
const SUFFER_ICON_PAIR_DX          = 0.30 * HEX_R;
const SUFFER_ICON_Y                = 0.78 * HEX_R;
const SUFFER_ICON_Z                = 0.10 * HEX_R;

/**
 * Moneta deficytu Złota. Opacity WYŻSZE niż czaszki (0.30): czaszka to zwarta
 * czerwona sylwetka na ciemnym tokenie, a jasnozłoty krążek przy 0.30 ginął na
 * piasku/stepie. Ciemna obwódka (rim) domyka czytelność na każdym terenie.
 */
const GOLD_DEFICIT_COIN_OPACITY    = 0.46;
const GOLD_DEFICIT_RENDER_ORDER    = STARVING_SKULL_RENDER_ORDER;

// Avatar proportions -- stocky R6 style
const AV_LEG_W   = 0.07  * HEX_R;  // leg box width & depth
const AV_LEG_H   = 0.20  * HEX_R;  // leg height
const AV_LEG_SEP = 0.045 * HEX_R;  // half-gap between legs (edge to center)

const AV_TORSO_W = 0.18  * HEX_R;
const AV_TORSO_H = 0.22  * HEX_R;
const AV_TORSO_D = 0.10  * HEX_R;

const AV_ARM_W   = 0.06  * HEX_R;
const AV_ARM_H   = 0.20  * HEX_R;
const AV_ARM_D   = 0.06  * HEX_R;

const AV_NECK_W  = 0.04  * HEX_R;
const AV_NECK_H  = 0.03  * HEX_R;
const AV_NECK_D  = 0.04  * HEX_R;

const AV_HEAD_S  = 0.13  * HEX_R;  // head box side

// Derived Y positions (group origin = floor / feet)
const AV_Y_LEG_BOT   = 0.0;
const AV_Y_LEG_CTR   = AV_Y_LEG_BOT  + AV_LEG_H   * 0.5;
const AV_Y_LEG_TOP   = AV_Y_LEG_BOT  + AV_LEG_H;
const AV_Y_TORSO_BOT = AV_Y_LEG_TOP;
const AV_Y_TORSO_CTR = AV_Y_TORSO_BOT + AV_TORSO_H * 0.5;
const AV_Y_TORSO_TOP = AV_Y_TORSO_BOT + AV_TORSO_H;
const AV_Y_NECK_CTR  = AV_Y_TORSO_TOP + AV_NECK_H  * 0.5;
const AV_Y_NECK_TOP  = AV_Y_TORSO_TOP + AV_NECK_H;
const AV_Y_HEAD_BOT  = AV_Y_NECK_TOP;
const AV_Y_HEAD_CTR  = AV_Y_HEAD_BOT  + AV_HEAD_S  * 0.5;
const AV_Y_HEAD_TOP  = AV_Y_HEAD_BOT  + AV_HEAD_S;
// Arm center: vertically same as torso upper region
const AV_Y_ARM_CTR   = AV_Y_TORSO_BOT + AV_TORSO_H * 0.55;
// Arm X offset (outside torso edge)
const AV_ARM_OFFSET_X = AV_TORSO_W * 0.5 + AV_ARM_W * 0.5 + 0.003 * HEX_R;

// Colors
const COLOR_SKIN      = 0xe0ac69;  // skin tone
const COLOR_CLOTH     = 0xb5784a;  // neutral tunic/cloth brown
const COLOR_TROUSERS  = 0x4a3828;  // dark brown trousers
const COLOR_DARK_EYE  = 0x1a1008;  // near-black eyes
const COLOR_STEEL     = 0xc2cad2;  // light polished steel grey (brightened)
const COLOR_DARK_STEEL= 0x6a7278;  // darker steel for segment gaps
const COLOR_BRONZE    = 0xcf9234;  // polished bronze armor (brighter, more golden)
const COLOR_DARK_BRONZE=0x7a5020; // darker bronze gap
const COLOR_WOOD      = 0x7a5c3a;  // wood handle
const COLOR_LEATHER   = 0x6b4a28;  // leather straps
const COLOR_HORSE     = 0x6b4c2a;  // horse body brown
const COLOR_HAT_BROWN = 0x3e2a1a;  // wide-brim hat dark leather
const COLOR_HAT_LIGHT = 0x8b6040;  // osadnik hat accent
const COLOR_GOLD      = 0xd4a830;  // gold trim (super)
const COLOR_POLE_GREY = 0x888888;  // banner pole grey
const COLOR_CHARIOT   = 0x8b6a2a;  // chariot wood
// --- Extended historical palette (rerender realism pass) ---
const COLOR_SKIN_DARK = 0xc89058;  // weathered/tanned skin (tribal, scout)
const COLOR_BRONZE_LT = 0xd0a050;  // polished bronze highlight (greaves, muscled cuirass)
const COLOR_LINEN     = 0xe8e0c8;  // linothorax / off-white linen tunic
const COLOR_ROMAN_RED = 0xa42a22;  // legionary tunic / Spartan cloak red
const COLOR_MAIL      = 0x9098a0;  // iron mail / scale grey-steel
const COLOR_FUR       = 0x7a6a52;  // fur/hide trim (axe, club warriors)
const COLOR_FEATHER   = 0xf4f0e6;  // off-white feather/plume base
const COLOR_HIDE_RED  = 0x8a3a26;  // reddish ox-hide / Zulu cowhide shield
const COLOR_SAIL      = 0xe6ddc4;  // ship sail canvas
const COLOR_SAND      = 0xcdb37a;  // straw hat / desert linen
const COLOR_LEAF      = 0x4a6a2e;  // dark cloak/scout green

// ---------------------------------------------------------------------------
// VIVID DISTINCT PALETTE (colour-vividness pass)
// The previous pass left most bodies on brown leather / off-white linen /
// bronze, so adjacent tokens read as one "gray-brown mush".  These constants
// give every CATEGORY a clearly different, MORE SATURATED tunic/cloak/shield
// hue while staying within authentic ancient dye/pigment ranges (madder &
// kermes reds, woad & Egyptian blue, malachite/verdigris greens & teals,
// ochres, orpiment yellow, Tyrian-ish purples).  Skin, leather straps and
// helmet metals stay realistic (metals merely brighter/polished).  The eye
// should be able to tell a swordsman from a spearman from an archer at a
// glance — the differences are carried mainly on cloth, not on metal.
// ---------------------------------------------------------------------------
const COLOR_RED_VIV   = 0xc0392b;  // vivid Roman/legionary red (kermes)        — legionista tunic/crest
const COLOR_CRIMSON   = 0xa01f2e;  // deep crimson cloak (kermes/murex)         — super & cavalry cloak/tunic
const COLOR_RUST      = 0xb5482f;  // bright rust/oxide red                      — generic swordsman tunic
const COLOR_TERRACOTA = 0xc15a34;  // terracotta / burnt-ochre                   — javelin skirmisher tunic
const COLOR_BURGUNDY  = 0x7e2a30;  // dark wine/burgundy                         — axe warrior tunic
const COLOR_OCHRE     = 0xc8932e;  // golden ochre / mustard                     — slinger tunic, Inca accents
const COLOR_FOREST    = 0x3f8a3a;  // vivid forest green (malachite/verdigris)   — archer tunic
const COLOR_OLIVE     = 0x5d6b34;  // olive/sage drab                            — scout cloak (distinct from archer)
const COLOR_TEAL      = 0x1f7a78;  // dark teal / verdigris                      — generic spearman tunic (Sumer)
const COLOR_WOAD      = 0x2f5aa0;  // woad / Egyptian-blue                       — settler tunic, Greek cloak accent
const COLOR_INDIGO    = 0x3a4a86;  // muted indigo                               — generic militia tunic
const COLOR_HORSE_LT  = 0x8a6038;  // brighter chestnut horse                    — cavalry & chariot horses
const COLOR_LACQUER   = 0xa8252a;  // lacquer red (Chinese/Egyptian chariot)     — chariot driver tunic
const COLOR_GOLD_BR   = 0xe0b53a;  // brighter gilt gold trim                    — elite trim/accents
const COLOR_PAINT_WHT = 0xeae3d2;  // bright white war-paint / cowhide white     — tribal accents

// Highlight
const HIGHLIGHT_RADIUS  = HEX_R * 0.88;
const HIGHLIGHT_HEIGHT  = 0.015 * HEX_R;
const HIGHLIGHT_LIFT    = 0.005 * HEX_R;
const HIGHLIGHT_COLOR   = 0x66ccff;
const HIGHLIGHT_OPACITY = 0.35;

// Route
const ROUTE_Y_LIFT  = 0.06 * HEX_R;
const ROUTE_COLOR   = 0xffe27a;
const ROUTE_OPACITY = 0.9;
const TUBE_RADIUS   = 0.05 * HEX_R;
const TUBE_SEGMENTS = 64;
const DOT_RADIUS    = 0.07 * HEX_R;
const DEST_TORUS_R  = 0.13 * HEX_R;
const DEST_TUBE_R   = 0.035 * HEX_R;
const DEST_COLOR    = 0xff8c00;

// Zaznaczenie armii — gruba heksagonalna obwódka (pointy-top, ≈ granica kafelka)
const SELECTION_HEX_OUTER   = HEX_R * 0.94;
const SELECTION_HEX_WIDTH   = 0.11 * HEX_R;
const SELECTION_HEX_INNER   = SELECTION_HEX_OUTER - SELECTION_HEX_WIDTH;
const SELECTION_HEX_LIFT    = ROUTE_Y_LIFT;
const SELECTION_HEX_COLOR   = 0xe0b24a;
const SELECTION_HEX_OPACITY = 0.92;

// Obwódka jednostki: kolor cywilizacji właściciela; w wojnie — cienki czerwony akcent.
// Zaznaczenie dokłada mocny setSelectionHex (grubszy pierścień).
export type UnitRingStance = 'own' | 'neutral' | 'hostile';

const OWNER_RING_OUTER   = HEX_R * 0.90;
const OWNER_RING_WIDTH   = 0.045 * HEX_R;
const OWNER_RING_INNER   = OWNER_RING_OUTER - OWNER_RING_WIDTH;
const OWNER_RING_OPACITY = 0.42;
const OWNER_RING_LIFT    = 0.006 * HEX_R;
const WAR_RING_COLOR     = 0xff4444;
const WAR_RING_OPACITY   = 0.38;
const WAR_RING_SCALE     = 1.1;
if (typeof globalThis !== 'undefined') { (globalThis as any).__CIV_OWNER_RING = 'civ-owner-ring'; }

let geoSelectionHexRing: THREE.ShapeGeometry | null = null;
function appendPointyTopHex(path: THREE.Path | THREE.Shape, radius: number, reverse: boolean): void {
  const order = reverse ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5];
  for (let j = 0; j < 6; j++) {
    const i = order[j]!;
    const angle = Math.PI / 2 + (i * Math.PI) / 3;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (j === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  path.closePath();
}
function getGeoSelectionHexRing(): THREE.ShapeGeometry {
  if (geoSelectionHexRing) return geoSelectionHexRing;
  const shape = new THREE.Shape();
  appendPointyTopHex(shape, SELECTION_HEX_OUTER, false);
  const hole = new THREE.Path();
  appendPointyTopHex(hole, SELECTION_HEX_INNER, true);
  shape.holes.push(hole);
  geoSelectionHexRing = new THREE.ShapeGeometry(shape);
  return geoSelectionHexRing;
}

let geoOwnerHexRing: THREE.ShapeGeometry | null = null;
function getGeoOwnerHexRing(): THREE.ShapeGeometry {
  if (geoOwnerHexRing) return geoOwnerHexRing;
  const shapeO = new THREE.Shape();
  appendPointyTopHex(shapeO, OWNER_RING_OUTER, false);
  const holeO = new THREE.Path();
  appendPointyTopHex(holeO, OWNER_RING_INNER, true);
  shapeO.holes.push(holeO);
  geoOwnerHexRing = new THREE.ShapeGeometry(shapeO);
  return geoOwnerHexRing;
}

// ---------------------------------------------------------------------------
// Shared singleton geometries (base avatar parts)
// ---------------------------------------------------------------------------

// Base avatar body parts
let geoAvLeg:   THREE.BoxGeometry | null = null;
let geoAvTorso: THREE.BoxGeometry | null = null;
let geoAvArm:   THREE.BoxGeometry | null = null;
let geoAvNeck:  THREE.BoxGeometry | null = null;
let geoAvHead:  THREE.BoxGeometry | null = null;
let geoAvEye:   THREE.BoxGeometry | null = null;

function getGeoAvLeg():   THREE.BoxGeometry { return (geoAvLeg   ||= new THREE.BoxGeometry(AV_LEG_W, AV_LEG_H, AV_LEG_W)); }
function getGeoAvTorso(): THREE.BoxGeometry { return (geoAvTorso ||= new THREE.BoxGeometry(AV_TORSO_W, AV_TORSO_H, AV_TORSO_D)); }
function getGeoAvArm():   THREE.BoxGeometry { return (geoAvArm   ||= new THREE.BoxGeometry(AV_ARM_W, AV_ARM_H, AV_ARM_D)); }
function getGeoAvNeck():  THREE.BoxGeometry { return (geoAvNeck  ||= new THREE.BoxGeometry(AV_NECK_W, AV_NECK_H, AV_NECK_D)); }
function getGeoAvHead():  THREE.BoxGeometry { return (geoAvHead  ||= new THREE.BoxGeometry(AV_HEAD_S, AV_HEAD_S, AV_HEAD_S)); }
function getGeoAvEye():   THREE.BoxGeometry { return (geoAvEye   ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.015 * HEX_R, 0.008 * HEX_R)); }

// Highlight
let geoHighlight: THREE.CylinderGeometry | null = null;
function getGeoHighlight(): THREE.CylinderGeometry {
  return (geoHighlight ||= new THREE.CylinderGeometry(HIGHLIGHT_RADIUS, HIGHLIGHT_RADIUS, HIGHLIGHT_HEIGHT, 6, 1));
}

// ---------------------------------------------------------------------------
// Shared weapon / gear geometries (singletons)
// ---------------------------------------------------------------------------

// Hat (osadnik)
let geoHatBrim:    THREE.BoxGeometry | null = null;
let geoHatCrown:   THREE.BoxGeometry | null = null;
let geoBackpack:   THREE.BoxGeometry | null = null;
let geoSash:       THREE.BoxGeometry | null = null;

// Armor (miecznik, wlocznik, super)
let geoCuirassBox:    THREE.BoxGeometry | null = null;
let geoCuirassGap:    THREE.BoxGeometry | null = null;
let geoShoulderPad:   THREE.BoxGeometry | null = null;
let geoHelmetDome:    THREE.CylinderGeometry | null = null;
let geoHelmetCrest:   THREE.BoxGeometry | null = null;
let geoHelmetSimple:  THREE.BoxGeometry | null = null;

// Sword
let geoSwordBlade:   THREE.BoxGeometry | null = null;
let geoSwordCross:   THREE.BoxGeometry | null = null;
let geoSwordGrip:    THREE.BoxGeometry | null = null;
// Round shield (rim box + boss box)
let geoShieldRim:    THREE.CylinderGeometry | null = null;
let geoShieldBoss:   THREE.CylinderGeometry | null = null;
// Small shield
let geoSmallShield:  THREE.BoxGeometry | null = null;

// Spear / javelin
let geoSpearShaft:   THREE.BoxGeometry | null = null;
let geoSpearTip:     THREE.BoxGeometry | null = null;
let geoJavShaft:     THREE.BoxGeometry | null = null;
let geoJavTip:       THREE.BoxGeometry | null = null;

// Bow (segmented arc built from thin boxes -- shared via per-token build)
// Quiver
let geoQuiver:       THREE.BoxGeometry | null = null;

// Sling + stone
let geoSlingStone:   THREE.BoxGeometry | null = null;

// Club / mace
let geoClubHandle:   THREE.BoxGeometry | null = null;
let geoClubKnob:     THREE.BoxGeometry | null = null;

// Axe
let geoAxeHandle:    THREE.BoxGeometry | null = null;
let geoAxeBlade:     THREE.BoxGeometry | null = null;

// Horse shared (konnica / rydwan / onager — faces -Z, head toward -Z)
// koń (buildHorse) → moduł ./kon-nowy-model (współdzielony: konnica/rydwan/onager tu + złoże koni w styleResources + stadnina P3A)

// Chariot
let geoCartBody:     THREE.BoxGeometry | null = null;
let geoCartWheel:    THREE.CylinderGeometry | null = null;

// Super elite extras
let geoSuperCrestPlume: THREE.BoxGeometry | null = null;
let geoSuperCape:       THREE.BoxGeometry | null = null;
let geoBannerPole:      THREE.BoxGeometry | null = null;
let geoBannerFlag:      THREE.BoxGeometry | null = null;
let geoGildedTrim:      THREE.BoxGeometry | null = null;

// --- Extended historical part geometries (rerender realism pass) ---
let geoGreave:        THREE.BoxGeometry | null = null;
let geoConicalHelm:   THREE.CylinderGeometry | null = null;
let geoCorinthDome:   THREE.CylinderGeometry | null = null;
let geoNoseGuard:     THREE.BoxGeometry | null = null;
let geoCheekGuard:    THREE.BoxGeometry | null = null;
let geoTransverseCrest: THREE.BoxGeometry | null = null;
// Roman legionary galea (helmet): rounded bowl + domed top cap.
let geoGaleaBowl:     THREE.CylinderGeometry | null = null;
let geoGaleaCap:      THREE.SphereGeometry   | null = null;
let geoAspisRim:      THREE.CylinderGeometry | null = null;
let geoAspisFace:     THREE.CylinderGeometry | null = null;
let geoScutumBody:    THREE.BoxGeometry | null = null;
let geoScutumBoss:    THREE.BoxGeometry | null = null;
let geoLoricaBand:    THREE.BoxGeometry | null = null;
let geoPilumShaft:    THREE.BoxGeometry | null = null;
let geoPilumHead:     THREE.BoxGeometry | null = null;
let geoDoryShaft:     THREE.BoxGeometry | null = null;
let geoSauroter:      THREE.BoxGeometry | null = null;
let geoMailSkirt:     THREE.BoxGeometry | null = null;
let geoGladius:       THREE.BoxGeometry | null = null;
let geoScabbard:      THREE.BoxGeometry | null = null;
let geoStrawBrim:     THREE.CylinderGeometry | null = null;
let geoStrawCrown:    THREE.CylinderGeometry | null = null;
let geoStaff:         THREE.BoxGeometry | null = null;
let geoBedroll:       THREE.CylinderGeometry | null = null;
let geoPickHandle:    THREE.BoxGeometry | null = null;
let geoPickHead:      THREE.BoxGeometry | null = null;
let geoHood:          THREE.BoxGeometry | null = null;
let geoCloak:         THREE.BoxGeometry | null = null;
let geoLoincloth:     THREE.BoxGeometry | null = null;
let geoArrowFletch:   THREE.BoxGeometry | null = null;
let geoSlingPouch:    THREE.BoxGeometry | null = null;
let geoCowhideShield: THREE.BoxGeometry | null = null;
let geoOvalShield:    THREE.CylinderGeometry | null = null;
let geoSaddleBlanket: THREE.BoxGeometry | null = null;
let geoShipHull:      THREE.BoxGeometry | null = null;
let geoShipRam:       THREE.BoxGeometry | null = null;
let geoShipMast:      THREE.BoxGeometry | null = null;
let geoShipSail:      THREE.BoxGeometry | null = null;
let geoOar:           THREE.BoxGeometry | null = null;
// --- Realism polish pass: shared humanoid extras (boots, hands, belt) ---
let geoBoot:          THREE.BoxGeometry | null = null;   // foot/boot block under each leg
let geoHand:          THREE.BoxGeometry | null = null;   // skin hand block under each arm
let geoBeltP:         THREE.BoxGeometry | null = null;   // generic waist belt
let geoTunicHem:      THREE.BoxGeometry | null = null;   // short tunic skirt under torso
let geoPlumeRidge:    THREE.BoxGeometry | null = null;   // tall mohawk-style crest block
// Helmet-visibility pass: a generic rounded metal HELM BOWL that wraps the whole
// head and stands clearly proud above the crown (used to make spearmen / basic
// melee read as plainly helmeted from the gallery's distant 4 views).  Bigger
// than the narrow conical helm so the metal cap is unmistakable.
let geoMeleeHelm:     THREE.CylinderGeometry | null = null;  // wide rounded helm bowl
let geoSkullCap:      THREE.CylinderGeometry | null = null;  // low hide/leather skull-cap (tribal)

function getGeoHatBrim():      THREE.BoxGeometry      { return (geoHatBrim      ||= new THREE.BoxGeometry(0.22  * HEX_R, 0.025 * HEX_R, 0.22  * HEX_R)); }
function getGeoHatCrown():     THREE.BoxGeometry      { return (geoHatCrown     ||= new THREE.BoxGeometry(0.13  * HEX_R, 0.08  * HEX_R, 0.13  * HEX_R)); }
function getGeoBackpack():     THREE.BoxGeometry      { return (geoBackpack     ||= new THREE.BoxGeometry(0.08  * HEX_R, 0.10  * HEX_R, 0.04  * HEX_R)); }
function getGeoSash():         THREE.BoxGeometry      { return (geoSash         ||= new THREE.BoxGeometry(0.10  * HEX_R, 0.04  * HEX_R, 0.012 * HEX_R)); }
function getGeoCuirassBox():   THREE.BoxGeometry      { return (geoCuirassBox   ||= new THREE.BoxGeometry(0.21  * HEX_R, 0.24  * HEX_R, 0.13  * HEX_R)); }
function getGeoCuirassGap():   THREE.BoxGeometry      { return (geoCuirassGap   ||= new THREE.BoxGeometry(0.21  * HEX_R, 0.008 * HEX_R, 0.14  * HEX_R)); }
function getGeoShoulderPad():  THREE.BoxGeometry      { return (geoShoulderPad  ||= new THREE.BoxGeometry(0.07  * HEX_R, 0.05  * HEX_R, 0.07  * HEX_R)); }
function getGeoHelmetDome():   THREE.CylinderGeometry { return (geoHelmetDome   ||= new THREE.CylinderGeometry(0.075 * HEX_R, 0.080 * HEX_R, 0.07 * HEX_R, 8, 1)); }
function getGeoHelmetCrest():  THREE.BoxGeometry      { return (geoHelmetCrest  ||= new THREE.BoxGeometry(0.015 * HEX_R, 0.03  * HEX_R, 0.09  * HEX_R)); }
function getGeoHelmetSimple(): THREE.BoxGeometry      { return (geoHelmetSimple ||= new THREE.BoxGeometry(0.14  * HEX_R, 0.07  * HEX_R, 0.14  * HEX_R)); }
function getGeoSwordBlade():   THREE.BoxGeometry      { return (geoSwordBlade   ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.20  * HEX_R, 0.012 * HEX_R)); }
function getGeoSwordCross():   THREE.BoxGeometry      { return (geoSwordCross   ||= new THREE.BoxGeometry(0.07  * HEX_R, 0.018 * HEX_R, 0.018 * HEX_R)); }
function getGeoSwordGrip():    THREE.BoxGeometry      { return (geoSwordGrip    ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.06  * HEX_R, 0.022 * HEX_R)); }
function getGeoShieldRim():    THREE.CylinderGeometry { return (geoShieldRim    ||= new THREE.CylinderGeometry(0.065 * HEX_R, 0.065 * HEX_R, 0.015 * HEX_R, 10, 1)); }
function getGeoShieldBoss():   THREE.CylinderGeometry { return (geoShieldBoss   ||= new THREE.CylinderGeometry(0.022 * HEX_R, 0.022 * HEX_R, 0.022 * HEX_R, 6,  1)); }
function getGeoSmallShield():  THREE.BoxGeometry      { return (geoSmallShield  ||= new THREE.BoxGeometry(0.07  * HEX_R, 0.09  * HEX_R, 0.014 * HEX_R)); }
function getGeoSpearShaft():   THREE.BoxGeometry      { return (geoSpearShaft   ||= new THREE.BoxGeometry(0.015 * HEX_R, 0.40  * HEX_R, 0.015 * HEX_R)); }
function getGeoSpearTip():     THREE.BoxGeometry      { return (geoSpearTip     ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.055 * HEX_R, 0.022 * HEX_R)); }
function getGeoJavShaft():     THREE.BoxGeometry      { return (geoJavShaft     ||= new THREE.BoxGeometry(0.012 * HEX_R, 0.26  * HEX_R, 0.012 * HEX_R)); }
function getGeoJavTip():       THREE.BoxGeometry      { return (geoJavTip       ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.040 * HEX_R, 0.018 * HEX_R)); }
function getGeoQuiver():       THREE.BoxGeometry      { return (geoQuiver       ||= new THREE.BoxGeometry(0.025 * HEX_R, 0.09  * HEX_R, 0.025 * HEX_R)); }
function getGeoSlingStone():   THREE.BoxGeometry      { return (geoSlingStone   ||= new THREE.BoxGeometry(0.028 * HEX_R, 0.028 * HEX_R, 0.028 * HEX_R)); }
function getGeoClubHandle():   THREE.BoxGeometry      { return (geoClubHandle   ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.16  * HEX_R, 0.030 * HEX_R)); }
function getGeoClubKnob():     THREE.BoxGeometry      { return (geoClubKnob     ||= new THREE.BoxGeometry(0.055 * HEX_R, 0.055 * HEX_R, 0.055 * HEX_R)); }
function getGeoAxeHandle():    THREE.BoxGeometry      { return (geoAxeHandle    ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.18  * HEX_R, 0.016 * HEX_R)); }
function getGeoAxeBlade():     THREE.BoxGeometry      { return (geoAxeBlade     ||= new THREE.BoxGeometry(0.08  * HEX_R, 0.065 * HEX_R, 0.018 * HEX_R)); }
function getGeoCartBody():     THREE.BoxGeometry      { return (geoCartBody     ||= new THREE.BoxGeometry(0.25  * HEX_R, 0.08  * HEX_R, 0.14  * HEX_R)); }
function getGeoCartWheel():    THREE.CylinderGeometry { return (geoCartWheel    ||= new THREE.CylinderGeometry(0.065 * HEX_R, 0.065 * HEX_R, 0.020 * HEX_R, 10, 1)); }
function getGeoSuperCrestPlume(): THREE.BoxGeometry   { return (geoSuperCrestPlume ||= new THREE.BoxGeometry(0.015 * HEX_R, 0.10  * HEX_R, 0.08  * HEX_R)); }
function getGeoSuperCape():    THREE.BoxGeometry      { return (geoSuperCape    ||= new THREE.BoxGeometry(0.15  * HEX_R, 0.22  * HEX_R, 0.010 * HEX_R)); }
function getGeoBannerPole():   THREE.BoxGeometry      { return (geoBannerPole   ||= new THREE.BoxGeometry(0.014 * HEX_R, 0.30  * HEX_R, 0.014 * HEX_R)); }
function getGeoBannerFlag():   THREE.BoxGeometry      { return (geoBannerFlag   ||= new THREE.BoxGeometry(0.09  * HEX_R, 0.07  * HEX_R, 0.008 * HEX_R)); }
function getGeoGildedTrim():   THREE.BoxGeometry      { return (geoGildedTrim   ||= new THREE.BoxGeometry(0.22  * HEX_R, 0.018 * HEX_R, 0.14  * HEX_R)); }

// --- Extended historical part getters (rerender realism pass) ---
function getGeoGreave():        THREE.BoxGeometry      { return (geoGreave        ||= new THREE.BoxGeometry(0.055 * HEX_R, 0.13  * HEX_R, 0.060 * HEX_R)); }
function getGeoConicalHelm():   THREE.CylinderGeometry { return (geoConicalHelm   ||= new THREE.CylinderGeometry(0.030 * HEX_R, 0.085 * HEX_R, 0.090 * HEX_R, 8, 1)); }
function getGeoCorinthDome():   THREE.CylinderGeometry { return (geoCorinthDome   ||= new THREE.CylinderGeometry(0.078 * HEX_R, 0.086 * HEX_R, 0.115 * HEX_R, 10, 1)); }
function getGeoNoseGuard():     THREE.BoxGeometry      { return (geoNoseGuard     ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.060 * HEX_R, 0.018 * HEX_R)); }
function getGeoCheekGuard():    THREE.BoxGeometry      { return (geoCheekGuard    ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.050 * HEX_R, 0.040 * HEX_R)); }
function getGeoTransverseCrest(): THREE.BoxGeometry    { return (geoTransverseCrest ||= new THREE.BoxGeometry(0.135 * HEX_R, 0.045 * HEX_R, 0.020 * HEX_R)); }
// Galea bowl: rounded metal helmet that wraps the whole head (slightly flared at the brim) and stands proud above it.
function getGeoGaleaBowl():     THREE.CylinderGeometry { return (geoGaleaBowl     ||= new THREE.CylinderGeometry(0.082 * HEX_R, 0.090 * HEX_R, 0.105 * HEX_R, 12, 1)); }
// Galea cap: domed crown sitting on top of the bowl (hemisphere).
function getGeoGaleaCap():      THREE.SphereGeometry   { return (geoGaleaCap      ||= new THREE.SphereGeometry(0.082 * HEX_R, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5)); }
function getGeoAspisRim():      THREE.CylinderGeometry { return (geoAspisRim      ||= new THREE.CylinderGeometry(0.135 * HEX_R, 0.135 * HEX_R, 0.022 * HEX_R, 16, 1)); }
function getGeoAspisFace():     THREE.CylinderGeometry { return (geoAspisFace     ||= new THREE.CylinderGeometry(0.110 * HEX_R, 0.122 * HEX_R, 0.020 * HEX_R, 16, 1)); }
function getGeoScutumBody():    THREE.BoxGeometry      { return (geoScutumBody    ||= new THREE.BoxGeometry(0.150 * HEX_R, 0.230 * HEX_R, 0.020 * HEX_R)); }
function getGeoScutumBoss():    THREE.BoxGeometry      { return (geoScutumBoss    ||= new THREE.BoxGeometry(0.045 * HEX_R, 0.045 * HEX_R, 0.022 * HEX_R)); }
function getGeoLoricaBand():    THREE.BoxGeometry      { return (geoLoricaBand    ||= new THREE.BoxGeometry(0.215 * HEX_R, 0.030 * HEX_R, 0.135 * HEX_R)); }
function getGeoPilumShaft():    THREE.BoxGeometry      { return (geoPilumShaft    ||= new THREE.BoxGeometry(0.014 * HEX_R, 0.42  * HEX_R, 0.014 * HEX_R)); }
function getGeoPilumHead():     THREE.BoxGeometry      { return (geoPilumHead     ||= new THREE.BoxGeometry(0.010 * HEX_R, 0.10  * HEX_R, 0.010 * HEX_R)); }
function getGeoDoryShaft():     THREE.BoxGeometry      { return (geoDoryShaft     ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.62  * HEX_R, 0.016 * HEX_R)); }
function getGeoSauroter():      THREE.BoxGeometry      { return (geoSauroter      ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.045 * HEX_R, 0.020 * HEX_R)); }
function getGeoMailSkirt():     THREE.BoxGeometry      { return (geoMailSkirt     ||= new THREE.BoxGeometry(0.205 * HEX_R, 0.075 * HEX_R, 0.125 * HEX_R)); }
function getGeoGladius():       THREE.BoxGeometry      { return (geoGladius       ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.135 * HEX_R, 0.012 * HEX_R)); }
function getGeoScabbard():      THREE.BoxGeometry      { return (geoScabbard      ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.140 * HEX_R, 0.020 * HEX_R)); }
function getGeoStrawBrim():     THREE.CylinderGeometry { return (geoStrawBrim     ||= new THREE.CylinderGeometry(0.125 * HEX_R, 0.125 * HEX_R, 0.014 * HEX_R, 14, 1)); }
function getGeoStrawCrown():    THREE.CylinderGeometry { return (geoStrawCrown    ||= new THREE.CylinderGeometry(0.058 * HEX_R, 0.070 * HEX_R, 0.060 * HEX_R, 12, 1)); }
function getGeoStaff():         THREE.BoxGeometry      { return (geoStaff         ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.52  * HEX_R, 0.016 * HEX_R)); }
function getGeoBedroll():       THREE.CylinderGeometry { return (geoBedroll       ||= new THREE.CylinderGeometry(0.030 * HEX_R, 0.030 * HEX_R, 0.13 * HEX_R, 8, 1)); }
function getGeoPickHandle():    THREE.BoxGeometry      { return (geoPickHandle    ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.30  * HEX_R, 0.016 * HEX_R)); }
function getGeoPickHead():      THREE.BoxGeometry      { return (geoPickHead      ||= new THREE.BoxGeometry(0.13  * HEX_R, 0.022 * HEX_R, 0.022 * HEX_R)); }
function getGeoHood():          THREE.BoxGeometry      { return (geoHood          ||= new THREE.BoxGeometry(0.155 * HEX_R, 0.090 * HEX_R, 0.155 * HEX_R)); }
function getGeoCloak():         THREE.BoxGeometry      { return (geoCloak         ||= new THREE.BoxGeometry(0.175 * HEX_R, 0.26  * HEX_R, 0.014 * HEX_R)); }
function getGeoLoincloth():     THREE.BoxGeometry      { return (geoLoincloth     ||= new THREE.BoxGeometry(0.165 * HEX_R, 0.080 * HEX_R, 0.115 * HEX_R)); }
function getGeoArrowFletch():   THREE.BoxGeometry      { return (geoArrowFletch   ||= new THREE.BoxGeometry(0.010 * HEX_R, 0.055 * HEX_R, 0.010 * HEX_R)); }
function getGeoSlingPouch():    THREE.BoxGeometry      { return (geoSlingPouch    ||= new THREE.BoxGeometry(0.040 * HEX_R, 0.030 * HEX_R, 0.022 * HEX_R)); }
function getGeoCowhideShield(): THREE.BoxGeometry      { return (geoCowhideShield ||= new THREE.BoxGeometry(0.115 * HEX_R, 0.230 * HEX_R, 0.016 * HEX_R)); }
function getGeoOvalShield():    THREE.CylinderGeometry { return (geoOvalShield    ||= new THREE.CylinderGeometry(0.080 * HEX_R, 0.080 * HEX_R, 0.018 * HEX_R, 14, 1)); }
function getGeoSaddleBlanket(): THREE.BoxGeometry      { return (geoSaddleBlanket ||= new THREE.BoxGeometry(0.150 * HEX_R, 0.020 * HEX_R, 0.130 * HEX_R)); }
function getGeoShipHull():      THREE.BoxGeometry      { return (geoShipHull      ||= new THREE.BoxGeometry(0.20  * HEX_R, 0.11  * HEX_R, 0.62  * HEX_R)); }
function getGeoShipRam():       THREE.BoxGeometry      { return (geoShipRam       ||= new THREE.BoxGeometry(0.055 * HEX_R, 0.050 * HEX_R, 0.13  * HEX_R)); }
function getGeoShipMast():      THREE.BoxGeometry      { return (geoShipMast      ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.40  * HEX_R, 0.022 * HEX_R)); }
function getGeoShipSail():      THREE.BoxGeometry      { return (geoShipSail      ||= new THREE.BoxGeometry(0.012 * HEX_R, 0.26  * HEX_R, 0.34  * HEX_R)); }
function getGeoOar():           THREE.BoxGeometry      { return (geoOar           ||= new THREE.BoxGeometry(0.012 * HEX_R, 0.012 * HEX_R, 0.22  * HEX_R)); }
// --- Realism polish getters (boots, hands, belt, hem, plume ridge) ---
function getGeoBoot():       THREE.BoxGeometry { return (geoBoot       ||= new THREE.BoxGeometry(AV_LEG_W * 1.18, 0.045 * HEX_R, AV_LEG_W * 1.55)); }
function getGeoHand():       THREE.BoxGeometry { return (geoHand       ||= new THREE.BoxGeometry(AV_ARM_W * 1.05, 0.045 * HEX_R, AV_ARM_D * 1.05)); }
function getGeoBeltP():      THREE.BoxGeometry { return (geoBeltP      ||= new THREE.BoxGeometry(AV_TORSO_W * 1.06, 0.030 * HEX_R, AV_TORSO_D * 1.10)); }
function getGeoTunicHem():   THREE.BoxGeometry { return (geoTunicHem   ||= new THREE.BoxGeometry(AV_TORSO_W * 1.08, 0.070 * HEX_R, AV_TORSO_D * 1.10)); }
function getGeoPlumeRidge(): THREE.BoxGeometry { return (geoPlumeRidge ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.150 * HEX_R, 0.110 * HEX_R)); }
// Wide rounded helm bowl: top radius 0.090, brim radius 0.098 (> head half-width
// 0.065 so it clearly overhangs the skull), height 0.105 so it sits proud above
// the crown.  Mirrors the galea bowl proportions but is the generic melee helm.
function getGeoMeleeHelm(): THREE.CylinderGeometry { return (geoMeleeHelm ||= new THREE.CylinderGeometry(0.090 * HEX_R, 0.098 * HEX_R, 0.105 * HEX_R, 12, 1)); }
// Low hide/leather skull-cap: short rounded cap that plainly covers the crown of
// a bare-headed tribal warrior (radius > head half-width so no skin shows on top).
function getGeoSkullCap(): THREE.CylinderGeometry { return (geoSkullCap ||= new THREE.CylinderGeometry(0.082 * HEX_R, 0.092 * HEX_R, 0.070 * HEX_R, 12, 1)); }

// ---------------------------------------------------------------------------
// Material factory -- MeshStandardMaterial per token (collected for disposal)
// ---------------------------------------------------------------------------

type MatFactory = (color: number, metalness?: number, roughness?: number, transparent?: boolean, opacity?: number) => THREE.MeshStandardMaterial;

function makeMatFactory(mats: THREE.Material[]): MatFactory {
  return function mat(
    color: number,
    metalness = 0.1,
    roughness = 0.7,
    transparent = false,
    opacity = 1.0
  ): THREE.MeshStandardMaterial {
    const m = new THREE.MeshStandardMaterial({ color, metalness, roughness, transparent, opacity });
    mats.push(m);
    return m;
  };
}

/** Poziomy pas ownerColor na hełmie — czytelny z mapy (UNITS P1 pas helmów). */
function addOwnerHelmStripe(
  group: THREE.Group,
  mOwner: THREE.MeshStandardMaterial,
  perGeo: THREE.BufferGeometry[],
  yOffset = 0.018,
): void {
  const gStripe = new THREE.BoxGeometry(0.160 * HEX_R, 0.026 * HEX_R, 0.160 * HEX_R);
  perGeo.push(gStripe);
  const mStripe = new THREE.Mesh(gStripe, mOwner);
  mStripe.position.set(0, AV_Y_HEAD_CTR + yOffset * HEX_R, 0);
  group.add(mStripe);
}

// ---------------------------------------------------------------------------
// Base avatar builder (Roblox R6 box style)
// skin:  hex color for head skin
// cloth: hex color for torso + arms
// Returns group with all parts added; group origin = feet (y=0)
// Also returns references to arm meshes so caller can add gear to them.
// ---------------------------------------------------------------------------

interface BaseAvatarResult {
  group: THREE.Group;
  mats:  THREE.Material[];
  // Useful anchor Y values
  torsoTopY:  number;
  headTopY:   number;
  armLMesh:   THREE.Mesh;
  armRMesh:   THREE.Mesh;
}

function buildBaseAvatar(
  skinColor:  number,
  clothColor: number,
  ownerCol:   number
): BaseAvatarResult {
  const group = new THREE.Group();
  const mats: THREE.Material[] = [];
  const mat = makeMatFactory(mats);

  const mSkin    = mat(skinColor,  0.05, 0.80);
  const mCloth   = mat(clothColor, 0.05, 0.85);
  const mTrouse  = mat(COLOR_TROUSERS, 0.05, 0.85);
  const mEye     = mat(COLOR_DARK_EYE, 0.02, 0.95);
  // owner-color sash on the torso front (always visible)
  const mSash    = mat(ownerCol,   0.08, 0.70);

  // Left leg
  const mLegL = new THREE.Mesh(getGeoAvLeg(), mTrouse);
  mLegL.position.set(-(AV_LEG_SEP + AV_LEG_W * 0.5), AV_Y_LEG_CTR, 0);
  group.add(mLegL);

  // Right leg
  const mLegR = new THREE.Mesh(getGeoAvLeg(), mTrouse);
  mLegR.position.set( (AV_LEG_SEP + AV_LEG_W * 0.5), AV_Y_LEG_CTR, 0);
  group.add(mLegR);

  // Torso
  const mTorso = new THREE.Mesh(getGeoAvTorso(), mCloth);
  mTorso.position.set(0, AV_Y_TORSO_CTR, 0);
  group.add(mTorso);

  // Owner-color sash across the torso front
  const mS = new THREE.Mesh(getGeoSash(), mSash);
  mS.position.set(0, AV_Y_TORSO_CTR - 0.01 * HEX_R, AV_TORSO_D * 0.5 + 0.003 * HEX_R);
  group.add(mS);

  // Left arm
  const mArmL = new THREE.Mesh(getGeoAvArm(), mCloth);
  mArmL.position.set(-AV_ARM_OFFSET_X, AV_Y_ARM_CTR, 0);
  group.add(mArmL);

  // Right arm
  const mArmR = new THREE.Mesh(getGeoAvArm(), mCloth);
  mArmR.position.set( AV_ARM_OFFSET_X, AV_Y_ARM_CTR, 0);
  group.add(mArmR);

  // Neck
  const mNeck = new THREE.Mesh(getGeoAvNeck(), mCloth);
  mNeck.position.set(0, AV_Y_NECK_CTR, 0);
  group.add(mNeck);

  // Head
  const mHead = new THREE.Mesh(getGeoAvHead(), mSkin);
  mHead.position.set(0, AV_Y_HEAD_CTR, 0);
  group.add(mHead);

  // Eyes (two small dark boxes on the front face of the head)
  const eyeZ = AV_HEAD_S * 0.5 + 0.003 * HEX_R;
  const eyeY = AV_Y_HEAD_CTR + 0.010 * HEX_R;
  const eyeXOff = 0.030 * HEX_R;

  const mEyeL = new THREE.Mesh(getGeoAvEye(), mEye);
  mEyeL.position.set(-eyeXOff, eyeY, eyeZ);
  group.add(mEyeL);

  const mEyeR = new THREE.Mesh(getGeoAvEye(), mEye);
  mEyeR.position.set( eyeXOff, eyeY, eyeZ);
  group.add(mEyeR);

  return {
    group,
    mats,
    torsoTopY: AV_Y_TORSO_TOP,
    headTopY:  AV_Y_HEAD_TOP,
    armLMesh:  mArmL,
    armRMesh:  mArmR,
  };
}

// ---------------------------------------------------------------------------
// buildHorse -- shared rydwan-style horse (used by konnica AND rydwan)
//
// Builds one horse and adds all its meshes directly to `group`.
// Horse is positioned so hooves rest at local y = 0 in `group`-space.
// Horse faces -Z (head toward -Z, tail toward +Z).
//
// Parameters:
//   group       -- parent group to add meshes into
//   mat         -- material factory (mats tracked externally)
//   mHorse      -- horse-body material
//   mMane       -- mane/tail material
//   mHarn       -- harness material (pass null to skip harness)
//   cx, cz      -- center offset within group (X and Z)
//
// Returns the Y coordinate of the horse-back (where a rider should sit).
// All geometries used are shared singletons -- no per-token geo allocation.
// ---------------------------------------------------------------------------

// buildHorse — kon/konnica/rydwan (Maciej 2026-07-03: czytelna sylwetka konia)
//
// Builds one horse and adds all its meshes directly to `group`.
// Horse is positioned so hooves rest at local y = 0 in `group`-space.
// Horse faces -Z (head toward -Z, tail toward +Z).
//
// Returns the Y coordinate of the horse-back (where a rider should sit).
// All geometries used are shared singletons -- no per-token geo allocation.
// ---------------------------------------------------------------------------

// buildHorse — patrz moduł ./kon-nowy-model (import na górze pliku).

// ---------------------------------------------------------------------------
// Shared gear sub-assemblies (rerender realism pass)
// Each adds meshes to `group`; uses only shared singleton geometries.
// ---------------------------------------------------------------------------

/** Bronze greaves on both shins (covers the lower legs). */
function addGreaves(group: THREE.Group, mBronze: THREE.MeshStandardMaterial): void {
  const yc = AV_Y_LEG_BOT + 0.075 * HEX_R;
  for (const sx of [-(AV_LEG_SEP + AV_LEG_W * 0.5), (AV_LEG_SEP + AV_LEG_W * 0.5)]) {
    const g = new THREE.Mesh(getGeoGreave(), mBronze);
    g.position.set(sx, yc, 0.004 * HEX_R);
    group.add(g);
  }
}

/** Pteruges / hanging skirt strips beneath a cuirass (leather or linen). */
function addPteruges(group: THREE.Group, mStrip: THREE.MeshStandardMaterial): void {
  const m = new THREE.Mesh(getGeoMailSkirt(), mStrip);
  m.position.set(0, AV_Y_TORSO_BOT + 0.012 * HEX_R, 0);
  group.add(m);
}

/**
 * A short sword sheathed at the left hip (scabbard + pommel).
 * Used by legionary / swordsman so a sword reads even when another weapon
 * (pilum) is in hand.
 */
function addHipSword(group: THREE.Group, mScab: THREE.MeshStandardMaterial,
                     mHilt: THREE.MeshStandardMaterial, side: number): void {
  const x = side * (AV_TORSO_W * 0.5 + 0.030 * HEX_R);
  const yc = AV_Y_TORSO_BOT + 0.02 * HEX_R;
  const sc = new THREE.Mesh(getGeoScabbard(), mScab);
  sc.rotation.z = side * 0.12;
  sc.position.set(x, yc, 0.045 * HEX_R);
  group.add(sc);
  const hilt = new THREE.Mesh(getGeoSwordGrip(), mHilt);
  hilt.position.set(x + side * 0.012 * HEX_R, yc + 0.085 * HEX_R, 0.045 * HEX_R);
  group.add(hilt);
}

/**
 * Boots/feet at the base of both legs -- turns the flat leg-stumps into a
 * believable stance. The boot block is slightly wider and pushed forward so a
 * toe reads in profile. Shared singleton geometry; no per-token alloc.
 */
function addBoots(group: THREE.Group, mBoot: THREE.MeshStandardMaterial): void {
  for (const sx of [-(AV_LEG_SEP + AV_LEG_W * 0.5), (AV_LEG_SEP + AV_LEG_W * 0.5)]) {
    const b = new THREE.Mesh(getGeoBoot(), mBoot);
    b.position.set(sx, AV_Y_LEG_BOT + 0.022 * HEX_R, 0.018 * HEX_R);
    group.add(b);
  }
}

/** Skin-colour hands at the base of both arms (fists), so limbs do not end blunt. */
function addHands(group: THREE.Group, mHand: THREE.MeshStandardMaterial): void {
  const yc = AV_Y_ARM_CTR - AV_ARM_H * 0.5 + 0.022 * HEX_R;
  for (const sx of [-AV_ARM_OFFSET_X, AV_ARM_OFFSET_X]) {
    const h = new THREE.Mesh(getGeoHand(), mHand);
    h.position.set(sx, yc, 0.004 * HEX_R);
    group.add(h);
  }
}

/** A simple waist belt at the bottom of the torso (owner trim or leather). */
function addBelt(group: THREE.Group, mBelt: THREE.MeshStandardMaterial, dy = 0.025): void {
  const b = new THREE.Mesh(getGeoBeltP(), mBelt);
  b.position.set(0, AV_Y_TORSO_BOT + dy * HEX_R, 0);
  group.add(b);
}

/** A short tunic skirt/hem hanging just below the torso (cloth colour). */
function addTunicHem(group: THREE.Group, mHem: THREE.MeshStandardMaterial): void {
  const m = new THREE.Mesh(getGeoTunicHem(), mHem);
  m.position.set(0, AV_Y_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(m);
}

// ---------------------------------------------------------------------------
// Culture / variant resolution (name-driven, OPTIONAL)
//
// The renderer collapses ~36 named units into ~14 categories, so two units
// with different names (e.g. the Zulu super "uThulwana" and the Roman super
// "Evocati") used to render identically.  To differentiate WITHOUT touching
// setup.ts/main.ts, buildUnitModel() takes an OPTIONAL unitName.  When given,
// we resolve a CULTURE tag from the name (a small ASCII-substring lookup that
// mirrors the units.json "Kultura" field) and apply name/culture-specific
// material + headgear overrides.  When unitName is omitted, behaviour is
// EXACTLY as before (so main.ts's existing 2-arg call is unaffected).
// ---------------------------------------------------------------------------

type Culture =
  | 'rzym' | 'grecja' | 'chiny' | 'zulu' | 'inka' | 'egipt' | 'sumer' | 'germanie' | 'neutral';

/** ASCII-fold a Polish name for substring matching (matches setup.ts logic). */
function normName(s: string): string {
  const nfd = (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');
  return nfd.replace(/[Łł]/g, 'l').toLowerCase();
}

/**
 * Resolve a culture tag from a unit NAME.  Uses the same distinctive name
 * fragments that units.json carries in its "Kultura" rows.  Returns 'neutral'
 * when the name carries no cultural marker (generic units).
 */
function cultureFromName(name: string | undefined): Culture {
  if (!name) return 'neutral';
  const n = normName(name);
  // Super-units first (each name is unique and unambiguous).
  if (n.includes('evocati') || n.includes('triarii') || n.includes('triari') || n.includes('legionist') || n.includes('hastati')) return 'rzym';
  if (n.includes('hieros') || n.includes('zastep') || n.includes('falanga') || n.includes('hoplit')) return 'grecja';
  if (n.includes('hu ben') || n.includes('tygrys') || n.includes('chins') || n.includes('kusznik')) return 'chiny';
  if (n.includes('thulwana') || n.includes('biale tarcz') || n.includes('impi') ||
      n.includes('izijula') || n.includes('zulu')) return 'zulu';
  if (n.includes('krolewska gwardia') || n.includes('chaska') || n.includes('huaracoc') ||
      n.includes('estolic') || n.includes('inka') || n.includes('ink')) return 'inka';
  if (n.includes('medzaj') || n.includes('faraon') || n.includes('khopesh') ||
      n.includes('egip')) return 'egipt';
  if (n.includes('sumeru') || n.includes('sumer') || n.includes('qurub')) return 'sumer';
  // GRAFIKA-JEDNOSTKI 2b — FIX ROUTINGU GERMANA (dopisek 1/3): tak "Wojownik
  // germański" (Super-jednostka=TAK) trafia do buildSuperUnit('germanie', …)
  // zamiast domyślnego generyka (buildCategoryModel('super')).
  if (n.includes('germansk') || n.includes('germanic') || n.includes('germanie')) return 'germanie';
  return 'neutral';
}

/**
 * Map a CULTURE to its primary "house" colour (used for tunics/textiles when a
 * regular culture-variant unit is differentiated).  Kept within the authentic
 * ancient dye/pigment range already used by the palette above.
 */
function cultureHouseColor(c: Culture): number {
  switch (c) {
    case 'rzym':    return COLOR_RED_VIV;   // legionary red
    case 'grecja':  return COLOR_WOAD;      // woad blue chiton
    case 'chiny':   return COLOR_LACQUER;   // lacquer red
    case 'zulu':    return COLOR_HIDE_RED;  // ox-hide / ochre body
    case 'inka':    return COLOR_OCHRE;     // Andean ochre/gold
    case 'egipt':   return COLOR_LINEN;     // white linen kilt
    case 'sumer':   return COLOR_TEAL;      // copper/verdigris
    default:        return 0x000000;        // sentinel: no override
  }
}

// ---------------------------------------------------------------------------
// buildUnitModel -- Roblox-style figure per category
// ---------------------------------------------------------------------------

/**
 * Super-jednostki, dla których model NAZWANY (buildNamedUnit) ma pierwszeństwo
 * przed generycznym modelem „na kulturę" (buildSuperUnit).  Fragmenty nazw są
 * już ASCII-zwinięte (normName), po PL i po EN — dokładnie te same, których
 * używa buildNamedUnit, więc obie listy nie mogą się rozjechać niezauważenie.
 *
 * Pięć nazw = pięć jednostek z units.json (Super-jednostka = TAK):
 *   „Hu Ben Wei (Gwardia Tygrysa)"  Chińczycy  → buildHuBenWei
 *   „uThulwana (Białe Tarcze)"      Zulusi     → buildUThulwana
 *   „Królewska Gwardia"             Inkowie    → buildInkaRoyalGuard
 *   „Medżaj (Gwardia Faraona)"      Egipt      → buildMedjay
 *   „Gwardia Królewska Sumeru"      Sumerowie  → buildSumerianRoyalGuard
 *
 * Rozróżnienie „Królewska Gwardia" (Inka) vs „Gwardia Królewska Sumeru"
 * rozstrzyga samo buildNamedUnit (sprawdza sumer PRZED inkaskim royal guard) —
 * tutaj wystarczy, żeby obie nazwy w ogóle trafiły do buildNamedUnit.
 */
const SUPER_Z_MODELEM_NAZWANYM =
  /hu ben wei|tiger guard|gwardia tygrysa|uthulwana|white shields|biale tarcze|krolewska gwardia|royal guard|medzaj|medjay|gwardia faraona|gwardia krolewska sumeru|qurubuti/;

/**
 * Returns a THREE.Group representing a unit of the given category.
 * Owner color appears on a clearly visible sash/shield/crest/cape per unit.
 * All geometries are shared singletons; all materials are per-token (collected
 * in group.userData['mats'] for disposal). Per-token unique geometries go into
 * group.userData['perTokenGeos'].
 *
 * @param category   Model category key (see categoryOf in setup.ts).
 * @param ownerColor_ Owner tint applied to sashes/shields/crests.
 * @param unitName   OPTIONAL unit display name.  When provided, culture/name
 *                   specific overrides are layered on top so that same-category
 *                   units of different cultures (and the 7 super-units) look
 *                   clearly DISTINCT.  When omitted, output is identical to the
 *                   pre-existing 2-arg behaviour (no regression for main.ts).
 */
export function buildUnitModel(category: string, ownerColor_: number, unitName?: string): THREE.Group {
  // Super-units dispatch to per-culture elite guards (visually distinct).
  if (category === 'super' && unitName) {
    // MARTWY KOD — NAPRAWA (2026-08-06): pięć super-jednostek ma w
    // buildNamedUnit własną, dużo bogatszą funkcję nazwaną (buildHuBenWei,
    // buildUThulwana, buildInkaRoyalGuard, buildMedjay,
    // buildSumerianRoyalGuard), ale ta gałąź `category === 'super'` łapała je
    // WCZEŚNIEJ i odsyłała do generyka „na kulturę" — funkcje nazwane nigdy
    // się nie wykonywały. Dla tych pięciu nazw (i TYLKO dla nich) pytamy
    // najpierw buildNamedUnit.
    //
    // Dlaczego BIAŁA LISTA, a nie zwykłe „najpierw nazwa, potem kultura":
    // buildNamedUnit łapie też nazwy pozostałych super-jednostek, ale modelami
    // przeznaczonymi dla ICH ZWYKŁYCH ODPOWIEDNIKÓW —
    //   „Wojownik germański" (SUPER)  → buildGermanWarrior (zwykły wojownik),
    //   „Hieros Lochos"      (SUPER)  → buildHierosLochos,
    // więc bezwarunkowa zamiana kolejności zdegradowałaby germańskiego supera
    // i po cichu podmieniła greckiego. Evocati i Triari nie mają wpisu
    // nazwanego i tak czy siak idą do buildSuperUnit.
    if (SUPER_Z_MODELEM_NAZWANYM.test(normName(unitName))) {
      const named = buildNamedUnit(normName(unitName), ownerColor_);
      if (named) return named;   // brak wpisu → spadamy do generyka niżej
    }
    return buildSuperUnit(cultureFromName(unitName), ownerColor_, unitName);
  }
  // NAME-keyed bespoke models for the new units (Celts, Germans, Bronze
  // specials).  Dispatched by NAME (stable identity), NOT by epoch/category — so
  // a unit keeps its model even if the human later moves it between epochs in
  // the Excel.  Returns null when the name has no bespoke model (falls through
  // to the category model below, so there is never a crash).
  if (unitName) {
    const named = buildNamedUnit(normName(unitName), ownerColor_);
    if (named) return named;
  }
  // Build the base category model, then layer culture overrides if a name was given.
  const group = buildCategoryModel(category, ownerColor_);
  if (unitName) {
    applyCultureOverrides(group, category, cultureFromName(unitName), ownerColor_);
  }
  return group;
}

// ===========================================================================
// NAME-KEYED bespoke models for the NEW units.
//
// Each builder produces a historically-flavoured, visually distinct token,
// reusing the existing primitive part-builders/geometries.  All per-token
// BoxGeometry/CylinderGeometry allocations are pushed into perGeo and stored on
// group.userData['perTokenGeos'] for disposal (matching every other builder);
// materials go into group.userData['mats'].
//
// Dispatch is by NAME (ASCII-folded), so a unit keeps its model regardless of
// which epoch it is in.  Returns null for unknown names (caller falls back to
// the category model — no crash).
// ===========================================================================

// --- Shared helpers for the new tribal/bronze units ------------------------

/** Bronze/gold neck-ring (Celtic/Germanic torc): an open ring at the throat. */
function addTorc(group: THREE.Group, mTorc: THREE.MeshStandardMaterial, perGeo: THREE.BufferGeometry[]): void {
  const gTorc = new THREE.TorusGeometry(0.052 * HEX_R, 0.012 * HEX_R, 6, 14, Math.PI * 1.7);
  perGeo.push(gTorc);
  const mRing = new THREE.Mesh(gTorc, mTorc);
  mRing.rotation.x = Math.PI / 2;
  mRing.position.set(0, AV_Y_TORSO_TOP - 0.004 * HEX_R, 0.004 * HEX_R);
  group.add(mRing);
  // Two terminal knobs at the open front.
  for (const sx of [-1, 1]) {
    const gKnob = new THREE.BoxGeometry(0.020 * HEX_R, 0.020 * HEX_R, 0.020 * HEX_R);
    perGeo.push(gKnob);
    const mKnob = new THREE.Mesh(gKnob, mTorc);
    mKnob.position.set(sx * 0.040 * HEX_R, AV_Y_TORSO_TOP - 0.004 * HEX_R, 0.050 * HEX_R);
    group.add(mKnob);
  }
}

/**
 * A tall OVAL body shield (Celtic / Germanic style, gr. *thureos*) on the left
 * arm: a tall squashed-cylinder face + a vertical spine (*spina*) + central boss
 * (*umbo*).
 *
 * NAPRAWA 2026-08-25 (R-ZELAZO-MODELE-BRAKUJACE-Q1-T2) — ORIENTACJA TARCZY.
 * To jest DOKŁADNIE ten sam błąd, który naprawiono 2026-08-06 dla tarczy hide
 * (patrz komentarz „NAPRAWA 2026-08-06 — ORIENTACJA TARCZY" niżej w tym pliku);
 * poprawka nigdy nie została przeniesiona na TEN helper. `getGeoOvalShield()` to
 * walec o osi wzdłuż lokalnego Y. Poprzednie `rotation.z = π/2` kładło tę oś na
 * światowy X, więc LICO tarczy patrzyło w BOK (±X). Kamera gry ma stały azymut 0
 * (`camera.ts:131` — „elewacja ~50°, azymut 0"), więc widziała tarczę DOKŁADNIE
 * KRAWĘDZIĄ. Pomiar w żywym Three.js przed poprawką: rozmiar tarczy w świecie
 * = [0.0166, 0.156, 0.296]×HEX_R, czyli 0.0166 SZEROKOŚCI i 0.296 GŁĘBOKOŚCI —
 * z figurki wystawał tylko pionowy pasek grubości 0.0166 sterczący 0.296 w przód
 * i w tył. Drugi, niezależny objaw tej samej pomyłki: pionowa *spina* ma 0.255
 * wysokości, a tarcza miała w osi Y tylko 0.156 — spina wystawała 0.0495 nad i
 * pod tarczę, wisząc w powietrzu.
 *
 * Poprawne jest `rotation.x = π/2` (oś walca → światowe +Z, lico do kamery).
 * Dowód, że taka była PIERWOTNA intencja autora: wektor `scale (1.0, 0.92, 1.85)`
 * ma sens WYŁĄCZNIE przy tej rotacji — mapuje się wtedy na X→szerokość 0.160,
 * Y→grubość 0.0166, Z→wysokość 0.296, czyli wysoką owalną tarczę, w której
 * spina 0.255 mieści się z zapasem. Przy `rotation.z` ten sam wektor dawał
 * grubość 0.92, wysokość 1.0 i głębokość 1.85, co nie opisuje żadnej tarczy.
 *
 * Tarcza wędruje też z `z = 0.012` na `SH_Z = 0.046` — PRZED przedramię, zamiast
 * przez nie (ta sama wartość co w naprawie z 2026-08-06), a spina i umbo lądują
 * na LICU tarczy, nie okrakiem na jej płaszczyźnie.
 */
function addTallOvalShield(group: THREE.Group, mFace: THREE.MeshStandardMaterial,
                           mSpine: THREE.MeshStandardMaterial, mBoss: THREE.MeshStandardMaterial,
                           perGeo: THREE.BufferGeometry[], heightScale = 1.75,
                           namePrefix = ''): void {
  const SH_X = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.016 * HEX_R);
  const SH_Z = 0.046 * HEX_R;                      // przed przedramieniem
  const FACE_HALF_T = 0.018 * HEX_R * 0.92 * 0.5;  // pół grubości lica po skali
  const mShield = new THREE.Mesh(getGeoOvalShield(), mFace);
  mShield.rotation.x = Math.PI / 2;
  mShield.scale.set(1.0, 0.92, heightScale);     // X→szerokość, Y→grubość, Z→wysokość
  mShield.position.set(SH_X, AV_Y_TORSO_CTR, SH_Z);
  if (namePrefix) mShield.name = namePrefix + '-shield-face';
  group.add(mShield);
  // Vertical wooden spine down the centre, ON the face (not straddling it).
  const gSpine = new THREE.BoxGeometry(0.022 * HEX_R, 0.255 * HEX_R, 0.020 * HEX_R);
  perGeo.push(gSpine);
  const mSp = new THREE.Mesh(gSpine, mSpine);
  mSp.position.set(SH_X, AV_Y_TORSO_CTR, SH_Z + FACE_HALF_T + 0.008 * HEX_R);
  if (namePrefix) mSp.name = namePrefix + '-shield-spine';
  group.add(mSp);
  // Central boss (umbo) bulging FORWARD out of the face.
  const mB = new THREE.Mesh(getGeoShieldBoss(), mBoss);
  mB.rotation.x = Math.PI / 2;
  mB.position.set(SH_X, AV_Y_TORSO_CTR, SH_Z + FACE_HALF_T + 0.009 * HEX_R);
  if (namePrefix) mB.name = namePrefix + '-shield-boss';
  group.add(mB);
}

/** A long sword (blade + crossguard + grip) raised in the right hand. */
function addLongSwordRight(group: THREE.Group, mBlade: THREE.MeshStandardMaterial,
                           mHilt: THREE.MeshStandardMaterial, perGeo: THREE.BufferGeometry[],
                           bladeLen = 0.30, namePrefix = ''): void {
  const X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.018 * HEX_R;
  const gGrip = new THREE.BoxGeometry(0.022 * HEX_R, 0.060 * HEX_R, 0.022 * HEX_R);
  perGeo.push(gGrip);
  const mGrip = new THREE.Mesh(gGrip, mHilt);
  mGrip.position.set(X, AV_Y_TORSO_CTR - 0.01 * HEX_R, 0.02 * HEX_R);
  if (namePrefix) mGrip.name = namePrefix + '-sword-grip';
  group.add(mGrip);
  const mCross = new THREE.Mesh(getGeoSwordCross(), mHilt);
  mCross.position.set(X, AV_Y_TORSO_CTR + 0.030 * HEX_R, 0.02 * HEX_R);
  if (namePrefix) mCross.name = namePrefix + '-sword-cross';
  group.add(mCross);
  const gBlade = new THREE.BoxGeometry(0.026 * HEX_R, bladeLen * HEX_R, 0.012 * HEX_R);
  perGeo.push(gBlade);
  const mBl = new THREE.Mesh(gBlade, mBlade);
  mBl.position.set(X, AV_Y_TORSO_CTR + 0.030 * HEX_R + bladeLen * HEX_R * 0.5, 0.02 * HEX_R);
  if (namePrefix) mBl.name = namePrefix + '-sword-blade';
  group.add(mBl);
}

/** A long thrusting/throwing spear in the right hand (shaft + leaf tip). */
function addSpearRight(group: THREE.Group, mWood: THREE.MeshStandardMaterial,
                       mTip: THREE.MeshStandardMaterial, perGeo: THREE.BufferGeometry[],
                       shaftLen = 0.48, namePrefix = ''): void {
  const X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.014 * HEX_R;
  const BOT = AV_Y_LEG_BOT + 0.01 * HEX_R;
  const CTR = BOT + shaftLen * HEX_R * 0.5;
  const TOP = BOT + shaftLen * HEX_R;
  const gShaft = new THREE.BoxGeometry(0.015 * HEX_R, shaftLen * HEX_R, 0.015 * HEX_R);
  perGeo.push(gShaft);
  const mShaft = new THREE.Mesh(gShaft, mWood);
  mShaft.position.set(X, CTR, 0.01 * HEX_R);
  if (namePrefix) mShaft.name = namePrefix + '-spear-shaft';
  group.add(mShaft);
  const mTipM = new THREE.Mesh(getGeoSpearTip(), mTip);
  mTipM.position.set(X, TOP + 0.028 * HEX_R, 0.01 * HEX_R);
  if (namePrefix) mTipM.name = namePrefix + '-spear-tip';
  group.add(mTipM);
}

/** A drooping mustache block under the nose (bare-headed tribal warriors). */
function addMustache(group: THREE.Group, mHair: THREE.MeshStandardMaterial, perGeo: THREE.BufferGeometry[]): void {
  const gM = new THREE.BoxGeometry(0.075 * HEX_R, 0.022 * HEX_R, 0.012 * HEX_R);
  perGeo.push(gM);
  const m = new THREE.Mesh(gM, mHair);
  m.position.set(0, AV_Y_HEAD_CTR - 0.028 * HEX_R, AV_HEAD_S * 0.5 + 0.004 * HEX_R);
  group.add(m);
}

/** Long hair falling behind the head (tribal). */
function addLongHair(group: THREE.Group, mHair: THREE.MeshStandardMaterial, perGeo: THREE.BufferGeometry[]): void {
  const gH = new THREE.BoxGeometry(0.150 * HEX_R, 0.120 * HEX_R, 0.060 * HEX_R);
  perGeo.push(gH);
  const m = new THREE.Mesh(gH, mHair);
  m.position.set(0, AV_Y_HEAD_CTR + 0.010 * HEX_R, -AV_HEAD_S * 0.5 - 0.018 * HEX_R);
  group.add(m);
}

// ===========================================================================
// ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA (Rydwan celtycki)
// `units.json`: Epoka=Zelazo, Kultura=Celtowie, Tech="Hutnictwo zelaza",
// Pancerz 1, Atak 7, Uwagi: „NOWA; lekki celtycki rydwan bojowy na 2 konie;
// woznica + wojownik z oszczepami/mieczem; szybka harcownicza flanka".
//
// C1. RYDWAN CELTYCKI JEST JEDNOSTKA EPOKI ZELAZA — ZERO ANACHRONIZMU.
//     Gdy rydwan bojowy znika z Bliskiego Wschodu i z Grecji, u Celtow trwa
//     do I w. p.n.e. Cezar, „De bello Gallico" IV.33, opisuje BRYTYJSKICH
//     essedarii: najpierw objezdzaja pole i MIOTAJA POCISKI („per omnes partes
//     perequitant et tela coniciunt"), samym pedem koni i loskotem kol lamiac
//     szyki, potem ZESKAKUJA z wozow i bija sie PIESZO, a woznice odjezdzaja
//     na bok, zeby zapewnic odwrot. Tamze: wojownicy potrafia BIEC PO DYSZLU
//     i stanac na jarzmie. BG V.19.1: Kasywelaun po rozpuszczeniu wojsk
//     zatrzymuje przy sobie okolo CZTERECH TYSIECY essedarii.
// C2. DLA GALII — DIODOR, NIE CEZAR. W Galii czasow Cezara rydwan bojowy jest
//     juz przezytkiem, wiec swiadectwem dla GALOW jest Diodor Sycylijski V.29.1
//     (za Posejdoniuszem, ok. 100 p.n.e.): Galowie uzywaja w podrozy i w bitwie
//     wozow o DWOCH KONIACH, wiozacych WOZNICE I WOJOWNIKA; ci najpierw ciskaja
//     w przeciwnika oszczepy, a potem schodza z wozu i walcza mieczami. To
//     dokladnie zaloga i sposob walki z karty jednostki („woznica + wojownik
//     z oszczepami/mieczem"). UCZCIWIE: dispatch tematu wskazywal jako przyklad
//     BELLOWAKOW; nie uzyto tego jako zrodla, bo wzmianki o `esseda` w ksiedze
//     VIII BG (autorstwa Hirtiusa, kampania przeciw Bellowakom) nie
//     zweryfikowano — nie cytujemy tego, czego nie sprawdzilismy.
// C3. WYSOKIE BOCZNE KABLAKI — STYLIZACJA NAZWANA WPROST. Archeologia daje
//     z pochowkow rydwanowych kultury arraskiej (WETWANG SLACK i GARTON SLACK
//     we wschodnim Yorkshire; NEWBRIDGE pod Edynburgiem, ok. 475 p.n.e.) oraz
//     z depozytu LLYN CERRIG BACH na Anglesey przede wszystkim OKUCIA: zelazne
//     obrecze kol nabijane na drewniane dzwona, piasty, terrety, lony. SAMEJ
//     nadbudowy kosza znaleziska nie zachowuja — jest ona REKONSTRUKCJA
//     (najbardziej znana: pelnowymiarowa rekonstrukcja rydwanu z Wetwang
//     z poczatku XXI w., eksponowana w British Museum). Dwa wysokie
//     kablaki nad burtami sa wiec STYLIZACJA oparta na tej rekonstrukcji,
//     a nie odwzorowaniem zabytku, i tak sa tu nazwane. Niosa natomiast
//     poprawna tresc: kosz celtycki byl LEKKI i AZUROWY — karta daje mu
//     `Pancerz` 1 przy 2 u mykenskiego i u Shang, a Uwagi rydwanu Shang mowia
//     wprost o „ciezkim" wozie i o zalodze TRZECH ludzi (woznica + halabardnik
//     ge + lucznik) wobec DWOJGA u celtyckiego.
// C4. TARCZA OWALNA NA PRZEDNIEJ BURCIE. Dluga owalna tarcza to typ celtycki
//     (tarcza z CHERTSEY, drewniane tarcze z LA TENE) — patrz tez sekcja
//     ZGODNOSC HISTORYCZNA Miecznika galijskiego w
//     `jednostki-z3-plemiona.ts`. Do T9 „znacznik kultury" byl OKRAGLYM
//     krazkiem (getGeoOvalShield to mimo nazwy CYLINDER, nie owal), jego
//     plaszczyzna byla ustawiona normalna wzdluz osi X — czyli DOKLADNIE
//     prostopadle do kierunku patrzenia jedynej kamery gry (iloczyn skalarny
//     0.000) — a jej SRODEK lezal 0.065 x HEX_R przed najdalej wysunieta ku
//     widzowi powierzchnia skrzyni (listwa nad sciana przednia, z = 0.055);
//     z pojazdem stykala sie jedynie rogiem tej listwy (SAT 0.0090), reszta
//     wisiala w powietrzu. Zmierzono dla niej 198 pikseli z kamery gry wobec
//     1070 pikseli wszystkich czesci w barwie gracza u Gaesatow w tym samym
//     renderze.
// C5. CZEGO MODEL NIE ODWZOROWUJE — OGRANICZENIA BRYLY WSPOLNEJ. Kosz, kola,
//     dyszel, jarzmo, konie i woznica pochodza ze WSPOLNEJ bryly kategorii
//     `rydwan` (buildCategoryModel), ktorej GEOMETRII T9 nie ruszal — allowlista
//     tematu obejmuje `decorateChariot()`, a nie samo `buildCategoryModel()`.
//     Zostaje w niej nieceltycki FUTERAL NA LUK ze strzalami: u Celtow
//     lucznictwo rydwanowe nie jest poswiadczone, zrodla mowia o oszczepach
//     i mieczach (Cezar BG IV.33, Diodor V.29.1). Zostaje tez SKRZYNKOWY ksztalt
//     helmu woznicy (barwe poprawia C6, ale bryla jest ta sama co u rydwanu
//     chinsko-egipskiego) oraz caly ksztalt kosza i kol — lekki, wiklinowy kosz
//     celtycki rozni sie od ciezkiej skrzyni Shang KSZTALTEM, nie tylko paleta.
//     Domkniecie tego wymaga bespoke bryly celtyckiej w osobnym pliku (tak samo
//     jak dostaly ja Rydwan Kapadokijski i Rydwan konny) — poza allowlista T9,
//     zgloszone jako osobny temat. STAN PO T9 JEST WIEC POPRAWA CZASTKOWA,
//     nie domknieciem luki: zmierzona odroznialnosc pikselowa rydwanu
//     celtyckiego od mykenskiego wzrosla, ale progu rodziny 0.558 nie osiaga —
//     dokladne liczby sa w raporcie i w tescie tematu.
// C6. ZELAZNE OKUCIA ZAMIAST BRAZOWYCH — najlepiej poswiadczony fakt o tym
//     pojezdzie. Z pochowkow rydwanowych (Wetwang, Garton, Newbridge) i z
//     Llyn Cerrig Bach pochodza ZELAZNE obrecze nabijane na skurcz na drewniane
//     dzwona kol, zelazne obejmy piast, lony i terrety. Bryla wspolna dawala
//     wszystkim trzem rydwanom okucia w barwie BRAZU — poprawne dla mykenskiego
//     i Shang (epoka BRAZU), bledne dla celtyckiego z epoki ZELAZA. T9
//     przebarwia je (i tylko dla wariantu celtyckiego) na zelazo. Przy okazji
//     tunika woznicy schodzi z czerwieni lakowej na blekit urzetu — Diodor
//     V.30.1 mowi o galijskich tunikach „barwionych w rozmaite kolory";
//     sam barwnik (urzet, lac. vitrum) jest u Cezara BG V.14, ale jako
//     malowidlo NA CIELE Brytow, nie jako barwnik tkaniny — i tak jest tu
//     nazwane, zeby nie przypisywac zrodlu wiecej, niz mowi.
// C7. ROZJAZD W SAMYCH DANYCH (nie w modelu). Uwagi karty mowia „wojownik
//     z oszczepami", ale `Atak dystansowy` = 0 i `Ilosc pociskow` = „—".
//     Model NIE dostal wiec widocznych oszczepow: nosnik ataku dystansowego
//     bylby sprzeczny z liczbami karty. Rozstrzygniecie rozjazdu w danych jest
//     poza zakresem tematu (`gra/data/**` nie jest w allowliscie) i zostalo
//     zgloszone w raporcie.
// ===========================================================================

/**
 * Mounts a per-culture marker on a pre-built chariot group returned by
 * buildCategoryModel('rydwan', ...).
 *
 * Two paths, on purpose:
 *  - `celtic = false` (Mycenaean, Shang): the historical path, UNCHANGED since
 *    before T9 — one round disc shield + one boss, nothing else.  Keeping the
 *    default value keeps those two units byte-identical (asserted by the T9
 *    test), because auditing them is a separate topic.
 *  - `celtic = true` (Celtic chariot, T9): an oval La Tene shield lashed FLAT
 *    to the front breastwork so its face turns toward the game camera, plus the
 *    two high side hoops that give the Celtic car its own silhouette.
 *
 * NOTE (T9, corrected): the pre-T9 doc comment claimed this function "re-tints
 * its car front-panel / driver tunic so the three chariot variants read
 * distinctly".  It never did — it only ever added two meshes, and the three
 * variants measured 0.010-0.014 pixel distinctness from the game camera
 * (family threshold 0.558; the same-model control is 0.000).  That sentence was
 * a description of an intent that was never implemented, not of the code.
 */
function decorateChariot(group: THREE.Group, ownerColor_: number, accent: number,
                         shieldColor: number, celtic: boolean = false): THREE.Group {
  const mats = group.userData['mats'] as THREE.Material[];
  const perGeo = (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? [];
  const mat = makeMatFactory(mats);
  // The car sits behind the team in the chariot's local frame and the whole
  // group is spun 180deg about Y at the end of buildCategoryModel; a sub-group
  // pre-spun by the same 180deg therefore has WORLD-ALIGNED axes, so every
  // number below is a world coordinate and can be compared with a measurement.
  const sub = new THREE.Group();
  sub.rotation.y = Math.PI;
  group.add(sub);

  if (celtic) {
    // --- PRZEBARWIENIE BRYLY WSPOLNEJ (C6) ---------------------------------
    // Materialy sa tworzone PER TOKEN (makeMatFactory w buildCategoryModel),
    // wiec zmiana barwy nie wycieka na inne jednostki ani na inne rydwany.
    // Robimy to PRZED utworzeniem wlasnych materialow T9, zeby retint nie mogl
    // trafic w nie same. Liczba trafien jest zwracana i pilnowana asercja
    // testu tematu — gdy bryla wspolna sie zmieni, test czerwienieje zamiast
    // po cichu nic nie przebarwic.
    const retint = (from: number, to: number): number => {
      let n = 0;
      for (const m of mats) {
        const mm = m as THREE.MeshStandardMaterial;
        if (mm.color !== undefined && mm.color.getHex() === from) { mm.color.setHex(to); n++; }
      }
      return n;
    };
    const retinted = {
      iron:  retint(COLOR_BRONZE,  COLOR_MAIL),       // obrecze, os, jarzmo, listwa, helm woznicy
      tunic: retint(COLOR_LACQUER, COLOR_WOAD),       // tunika woznicy
      crest: retint(COLOR_RED_VIV, COLOR_TROUSERS),   // kita woznicy
    };
    group.userData['celticRetint'] = retinted;

    const mFace  = mat(shieldColor,   0.10, 0.72);
    const mRim   = mat(COLOR_LEATHER, 0.06, 0.84);
    const mWoodC = mat(COLOR_CHARIOT, 0.05, 0.82);
    const mBossC = mat(accent,        0.30, 0.50);
    // --- oval La Tene shield, FLAT on the front breastwork (C4) -------------
    // Pion tego ustawienia: przednia sciana skrzyni konczy sie na z = 0.054,
    // ale NOGI WOZNICY wystaja przez nia do z = 0.059 (cecha bryly wspolnej,
    // nie T9). Tarcza siada wiec tuz PRZED nimi (tyl pola na z = 0.0605), czyli
    // przylega do pojazdu bez przenikania czegokolwiek — obie te wlasnosci
    // (przyleganie i brak kolizji) sa zmierzone i egzekwowane w tescie tematu.
    const SH_X = 0.078 * HEX_R, SH_Y = 0.185 * HEX_R, SH_Z = 0.0695 * HEX_R;
    const rim = new THREE.Mesh(getGeoOvalShield(), mRim);
    rim.rotation.x = Math.PI / 2;                  // disc normal -> world +Z
    rim.scale.set(0.80, 0.80, 1.20);
    rim.position.set(SH_X, SH_Y, SH_Z - 0.002 * HEX_R);
    rim.name = 'rc-shield-rim';
    sub.add(rim);
    const face = new THREE.Mesh(getGeoOvalShield(), mFace);
    face.rotation.x = Math.PI / 2;
    face.scale.set(0.72, 1.0, 1.10);
    face.position.set(SH_X, SH_Y, SH_Z);
    face.name = 'rc-shield-face';
    sub.add(face);
    const gSpina = new THREE.BoxGeometry(0.016 * HEX_R, 0.170 * HEX_R, 0.010 * HEX_R);
    perGeo.push(gSpina);
    const spina = new THREE.Mesh(gSpina, mWoodC);
    spina.position.set(SH_X, SH_Y, SH_Z + 0.012 * HEX_R);
    spina.name = 'rc-shield-spina';
    sub.add(spina);
    const boss = new THREE.Mesh(getGeoShieldBoss(), mBossC);
    boss.rotation.x = Math.PI / 2;                 // boss axis -> world +Z
    boss.position.set(SH_X, SH_Y, SH_Z + 0.016 * HEX_R);
    boss.name = 'rc-shield-boss';
    sub.add(boss);
    // --- two high side hoops over the car rails (C3) ------------------------
    // Rails run world z -0.17..0.05 at x = +-0.135, top at y = 0.1905.  Radius
    // 0.090 with centre z = -0.035 lands BOTH feet on the rail and clears the
    // rear standard pole at z = -0.15.
    const gHoop = new THREE.TorusGeometry(0.090 * HEX_R, 0.008 * HEX_R, 4, 10, Math.PI);
    perGeo.push(gHoop);
    for (const s of [1, -1]) {
      const hoop = new THREE.Mesh(gHoop, mWoodC);
      hoop.rotation.y = Math.PI / 2;               // torus plane XY -> world ZY
      hoop.position.set(s * 0.135 * HEX_R, 0.1905 * HEX_R, -0.035 * HEX_R);
      hoop.name = 'rc-hoop-' + (s > 0 ? 'left' : 'right');
      sub.add(hoop);
    }
    group.userData['perTokenGeos'] = perGeo;
    return group;
  }

  // A round culture shield hung on the +X car side.
  const mShield = new THREE.Mesh(getGeoOvalShield(), mat(shieldColor, 0.10, 0.72));
  mShield.rotation.z = Math.PI / 2;
  mShield.scale.set(1.0, 0.6, 1.0);
  mShield.position.set(0.150 * HEX_R, 0.20 * HEX_R, 0.12 * HEX_R);
  sub.add(mShield);
  const mBoss = new THREE.Mesh(getGeoShieldBoss(), mat(accent, 0.30, 0.5));
  mBoss.rotation.z = Math.PI / 2;
  mBoss.position.set(0.162 * HEX_R, 0.20 * HEX_R, 0.12 * HEX_R);
  sub.add(mBoss);
  group.userData['perTokenGeos'] = perGeo;
  return group;
}

// --- Dispatcher ------------------------------------------------------------

function buildNamedUnit(n: string, ownerColor_: number): THREE.Group | null {
  // CELTS -----------------------------------------------------------------
  if (n.includes('soldurii') || n.includes('soldur')) return buildSoldurii(ownerColor_);
  if (n.includes('gaesatae')) return buildGaesatae(ownerColor_);
  if (n.includes('wojownik celtycki') || (n.includes('celtyck') && n.includes('wojownik'))) return buildCeltWarrior(ownerColor_);
  // T9: jedyne dwa wywolania z `celtic = true` (nazwa PL nizej i EN dalej).
  // Mykenski i Shang zostaja na domyslnej sciezce, wiec ich geometria jest
  // identyczna jak przed T9 — pilnuje tego asercja regresji w tescie tematu.
  if (n.includes('rydwan celtycki') || (n.includes('rydwan') && n.includes('celtyck'))) {
    return decorateChariot(buildCategoryModel('rydwan', ownerColor_), ownerColor_, COLOR_GOLD_BR, COLOR_FOREST, true);
  }
  // GERMANS ---------------------------------------------------------------
  // T8 (R-ZELAZO-AUDYT-POZOSTALE-Q1-T8): Berserker dispatchowany do bespoke
  // modelu z serii Z3. Lokalny `buildBerserker()` nizej w tym pliku zostaje
  // jako martwy — dokladnie jak `buildGermanWarrior()` — bo porzadkowanie
  // martwego kodu w units.ts jest osobnym tematem, nie luka wizualna.
  if (n.includes('berserker germansk') || n.includes('berserk')) return buildBerserkerZ3(ownerColor_);
  if (n.includes('wojownik germansk') || (n.includes('germansk') && n.includes('wojownik'))) return buildGermanWarrior(ownerColor_);
  // GRECJA ----------------------------------------------------------------
  // „Falanga" (units.json: Epoka=Żelazo, Kultura=Grecka, Typ=Falangite) miała
  // dotąd bespoke model buildFalangita(), ale docierała do niego WYŁĄCZNIE
  // przez `case 'falanga'` w buildCategoryModel() — czyli była wizualnie
  // unikalna „z przypadku" (jest dziś jedyną jednostką tej kategorii), nie
  // z projektu. Reszta rodziny Opus 5 dispatchuje PO NAZWIE, bo nazwa jest
  // stabilną tożsamością jednostki: model zostaje przy niej nawet gdy człowiek
  // przesunie ją w Excelu między epokami albo zmieni jej `Typ`/kategorię.
  // `case 'falanga'` ZOSTAJE jako fallback dla ewentualnych przyszłych
  // jednostek tej kategorii — obie ścieżki wołają tę samą funkcję.
  // Bez ryzyka regresji wyglądu: applyCultureOverrides() i tak zwraca od razu
  // dla kategorii 'falanga' (NEW_BESPOKE_CATEGORIES), więc ścieżka po nazwie
  // i ścieżka po kategorii dają IDENTYCZNĄ bryłę.
  // Rdzenie „falanga"/„hoplit"/„phalanx" są w całym units.json jednoznaczne —
  // nie ma innej jednostki, która by je zawierała (sprawdzone), w szczególności
  // NIE łapią „Hieros Lochos (Święty Zastęp)" ani „Thorakites".
  if (n.includes('falanga') || n.includes('hoplit') || n.includes('phalanx')) return newBuildFalangita(ownerColor_);
  // BRONZE SPECIALS -------------------------------------------------------
  if (n.includes('wojownik mykensk') || (n.includes('mykensk') && n.includes('wojownik'))) return buildMycenaeanWarrior(ownerColor_);
  if (n.includes('rydwan mykensk') || (n.includes('rydwan') && n.includes('mykensk'))) {
    return decorateChariot(buildCategoryModel('rydwan', ownerColor_), ownerColor_, COLOR_BRONZE, COLOR_WOAD);
  }
  // HETYCI — „Rydwan Kapadokijski" / „Cappadocian Chariot" (jednostka UNIKALNA,
  // Epoka=Brąz;Żelazo). MUSI stać PRZED fallbackiem do generycznego 'rydwan'
  // (case 'rydwan' w buildCategoryModel), do którego jednostka trafiała
  // wcześniej przez categoryOf() po samym słowie „rydwan". Dopasowanie po
  // rdzeniu „kapadok"/„cappadoc" — w całym units.json nie ma innej jednostki
  // z tym rdzeniem, więc jest jednoznaczne i odporne na odmianę nazwy.
  if (n.includes('kapadok') || n.includes('cappadoc')) return buildRydwanKapadokijskiOpus5(ownerColor_);
  if (n.includes('sherden')) return buildSherden(ownerColor_);
  if (n.includes('halabardnik shang') || (n.includes('shang') && n.includes('halabard'))) return buildShangHalberdier(ownerColor_);
  if (n.includes('rydwan shang') || (n.includes('rydwan') && n.includes('shang'))) {
    return decorateChariot(buildCategoryModel('rydwan', ownerColor_), ownerColor_, COLOR_LACQUER, COLOR_LACQUER);
  }
  if (n.includes('lucznik akadyjski') || n.includes('akadyjsk') || n.includes('akkad')) return buildAkkadianArcher(ownerColor_);
  // ENGLISH display-name aliases (battle now passes EN names in some paths) so a
  // unit resolves the same bespoke model whether the EN or PL name is given.
  if (n.includes('celtic warrior')) return buildCeltWarrior(ownerColor_);
  if (n.includes('celtic chariot')) {
    return decorateChariot(buildCategoryModel('rydwan', ownerColor_), ownerColor_, COLOR_GOLD_BR, COLOR_FOREST, true);
  }
  if (n.includes('germanic berserker')) return buildBerserkerZ3(ownerColor_);   // T8, jak wyzej
  if (n.includes('germanic warrior')) return buildGermanWarrior(ownerColor_);
  if (n.includes('mycenaean warrior')) return buildMycenaeanWarrior(ownerColor_);
  if (n.includes('mycenaean chariot')) {
    return decorateChariot(buildCategoryModel('rydwan', ownerColor_), ownerColor_, COLOR_BRONZE, COLOR_WOAD);
  }
  if (n.includes('sherden warrior')) return buildSherden(ownerColor_);
  if (n.includes('shang halberdier')) return buildShangHalberdier(ownerColor_);
  if (n.includes('shang chariot')) {
    return decorateChariot(buildCategoryModel('rydwan', ownerColor_), ownerColor_, COLOR_LACQUER, COLOR_LACQUER);
  }
  if (n.includes('akkadian archer')) return buildAkkadianArcher(ownerColor_);
  // ZULU -------------------------------------------------------------------
  if (n.includes('impi')) return buildImpi(ownerColor_);
  if (n.includes('oszczepnik zulu') || n.includes('izijula') || n.includes('zulu javelineer') || n.includes('isijula')) return buildZuluJavelineer(ownerColor_);
  // SUMER ------------------------------------------------------------------
  if (n.includes('wlocznik sumeryjski') || n.includes('sumerian spearman')) return buildSumerianSpearman(ownerColor_);
  if (n.includes('lucznik sumeryjski') || n.includes('sumerian archer')) return buildSumerianArcher(ownerColor_);
  if (n.includes('rydwan sumeryjski') || n.includes('sumerian chariot')) return buildSumerianChariot(ownerColor_);
  // EGIPT ------------------------------------------------------------------
  if (n.includes('lucznik egipski') || n.includes('egyptian archer')) return buildEgyptianArcher(ownerColor_);
  // Łucznik nubijski (Brąz, Egipt, zastępuje Łucznika): dedykowany model
  // (braz-lucznik-nubijski-opus5.ts) — Ta-Seti "Kraina Łuku", ciemna karnacja,
  // długi prosty łuk self-bow wyraźnie dłuższy niż egipski, skórzana przepaska.
  if (n.includes('lucznik nubijski') || n.includes('nubian archer')) return buildNubianArcherOpus5(ownerColor_);
  if (n.includes('wojownik z khopesh') || n.includes('khopesh warrior')) return buildKhopeshWarrior(ownerColor_);
  if (n.includes('rydwan egipski') || n.includes('egyptian chariot')) return buildEgyptianChariot(ownerColor_);
  // INKA -------------------------------------------------------------------
  if (n.includes('oszczepnik') && (n.includes('estolic') || n.includes('estolic'))) return buildInkaJavelineer(ownerColor_);
  if (n.includes('javelineer') && n.includes('estolica')) return buildInkaJavelineer(ownerColor_);
  if (n.includes('procarz') && n.includes('huarac')) return buildInkaSlinger(ownerColor_);
  if (n.includes('slinger') && n.includes('huara')) return buildInkaSlinger(ownerColor_);
  // CHINY ------------------------------------------------------------------
  if (n.includes('jezdziec chinski') || n.includes('chinese cavalry')) return buildChineseCavalry(ownerColor_);
  // KUSZNIK (CROSSBOWMAN) --------------------------------------------------
  if (n.includes('kusznik') || n.includes('crossbowman')) return buildCrossbowman(ownerColor_);
  // KAMIEŃ — JEDNOSTKA BAZOWA „Wojownik" (Kultura=null, wszystkie cywilizacje) --
  // BUG 2026-07-26 (zgłoszenie właściciela: „miasta-państwa używają starych
  // grafik dla jednostek typu kamienia"). units.json daje „Wojownik" pole
  // Typ="Swordsman", więc categoryOf() (units/setup.ts, fallback po „Typ")
  // zwracało kategorię 'miecznik' → buildCategoryModel('miecznik') → STARY
  // newBuildMiecznik z jednostki-p1-rdzen.ts. Nowy model Kamienia
  // buildWojownikOpus5 wisiał WYŁĄCZNIE na gałęzi 'domyslny'/default, do której
  // żadna realna jednostka nie trafiała. Objaw był widoczny głównie na
  // miastach-państwach, bo AI „kopia_typu_obronna" (game/ai.ts, gałąź
  // defensiveCopy) rekrutuje niemal wyłącznie 'Wojownik' — ale dotyczyło
  // TAK SAMO gracza i pełnych cywilizacji AI (dispatch nie zna ownerId).
  // Dopasowanie po PEŁNEJ nazwie (===), więc warianty („Wojownik z maczugą
  // (Chaska)", „Wojownik germański", „Wojownik mykeński"…) zachowują swoje
  // modele — mają własne wpisy wyżej/niżej. „Warrior" = Nazwa EN z units.json.
  // Pozostałe bazowe jednostki Kamienia (Oszczepnik/Łucznik/Zwiadowca/Taran)
  // trafiają w Opus 5 poprawnie przez kategorię i NIE wymagają wpisu.
  if (n === 'wojownik' || n === 'warrior') return buildWojownikOpus5(ownerColor_);
  // BRĄZ — JEDNOSTKI BAZOWE (Kultura=null, dostępne wszystkim cywilizacjom) --
  // Dopasowanie po PEŁNEJ nazwie (===), nie po fragmencie: warianty kulturowe
  // („Włócznik sumeryjski", „Procarz (Huaracoc)", „Rydwan egipski"…) mają
  // własne wpisy wyżej i muszą zachować swoje modele. units.json: „Włócznik"/
  // „Spearman", „Wojownik z mieczem i tarczą"/„Swordsman", „Procarz"/„Slinger",
  // „Rydwan (woły)"/„Ox Chariot" — wszystkie Epoka=Brąz.
  if (n === 'wlocznik' || n === 'spearman') return buildWlocznikBrazOpus5(ownerColor_);
  if (n === 'wojownik z mieczem i tarcza' || n === 'swordsman') return buildMiecznikBrazOpus5(ownerColor_);
  if (n === 'procarz' || n === 'slinger') return buildProcarzBrazOpus5(ownerColor_);
  if (n === 'rydwan (woly)' || n === 'rydwan woly' || n === 'ox chariot') return buildRydwanWolyBrazOpus5(ownerColor_);
  // ASYRIA ŻELAZO — Konnica lancowa / łucznicza (R-ZELAZO-MODELE-BRAKUJACE-Q1-T1):
  // dedykowane modele, MUSZĄ stać PRZED generycznym dopasowaniem 'konnica' niżej,
  // inaczej obie warianty kulturowe wpadałyby w ten sam, wspólny model Brązu.
  // units.json: „Konnica lancowa asyryjska"/„Assyrian Lancer" (Atak dystansowy=0,
  // długa lanca + okrągła tarcza) i „Konnica łucznicza asyryjska"/„Assyrian Horse
  // Archer" (Atak dystansowy=6 — MUSI dzierżyć łuk, nie broń drzewcową).
  if (n.includes('konnica lancowa asyryjsk') || n.includes('assyrian lancer')) return buildZelazoKonnicaLancowaAsyryjska(ownerColor_);
  if (n.includes('konnica lucznicza asyryjsk') || n.includes('assyrian horse archer')) return buildZelazoKonnicaLuczniczaAsyryjska(ownerColor_);
  // SŁOWIANIE ŻELAZO — „Jeździec z oszczepami" (R-ZELAZO-MODELE-BRAKUJACE-Q1-T4).
  // MUSI stać PRZED generycznym dopasowaniem konnicy niżej, tak samo jak para
  // asyryjska wyżej. Rdzenie „jezdziec z oszczepami"/„slavic javelin cavalry"
  // są w całym units.json jednoznaczne (sprawdzone): „Oszczepnik", „Oszczepnik
  // Zulu (Izijula)" i „Oszczepnik (Estólica)" mają rdzeń „oszczepnik", nie
  // „oszczepami", a jedyny inny „Jeździec" to „Jeździec chiński" z własnym
  // wpisem. Dispatch po NAZWIE (nie po kulturze) jest tu konieczny podwójnie:
  // typ `Culture` w tym pliku NIE ZNA wartości „Słowianie", więc ścieżka
  // kulturowa nie istnieje — dokładnie tak samo rozwiązano to dla „Drużynnika"
  // (ta sama kultura, jednostki-z3-plemiona.ts).
  if (n.includes('jezdziec z oszczepami') || n.includes('slavic javelin cavalry')) return buildZelazoJezdziecOszczepami(ownerColor_);
  // KONNICA (Brąz, Kultura=null): dopasowanie po PEŁNEJ nazwie, żeby warianty
  // kulturowe („Konnica lancowa asyryjska", „Konnica łucznicza asyryjska",
  // „Jeździec chiński"…) zachowały swoje modele — mają własne wpisy wyżej
  // albo lecą przez kategorię 'konnica'.
  if (n === 'konnica' || n === 'horseman') return buildKonnicaBrazOpus5(ownerColor_);
  // „Rydwan konny"/„War Chariot" — units.json: Epoka=Brąz, Kultura=null,
  // Tech=Jeździectwo, Atak dystansowy=0 (dlatego załoga to woźnica + WŁÓCZNIK,
  // a nie łucznik — łucznik rydwanowy to osobna jednostka „Rydwan egipski").
  // Dopasowanie po PEŁNEJ nazwie: kulturowe „W zamian za: Rydwan konny"
  // (egipski/mykeński/Shang/celtycki/kapadokijski) mają własne wpisy WYŻEJ
  // i nie mogą tu wpaść.
  if (n === 'rydwan konny' || n === 'war chariot') return buildRydwanKonnyBrazOpus5(ownerColor_);
  // MACHINY OBLĘŻNICZE -------------------------------------------------------
  // UWAGA: „taran okuty" (Brąz, na kołach) MUSI być sprawdzony PRZED ogólnym
  // 'taran', inaczej przechwyci go płozowy taran epoki Kamienia.
  if (n.includes('taran okuty') || n.includes('bronze-shod ram') || n.includes('bronze shod ram')) return buildTaranOkutyOpus5(ownerColor_);
  if (n.includes('taran') || n.includes('battering ram')) return buildBatteringRam(ownerColor_);
  // KATAPULTA (Żelazo, Kultura=null) — jedyna machina SKRĘTOWA w grze.
  // Rdzenie „katapulta"/„catapult" SPRAWDZONE w `units.json`, nie założone:
  // pasuje do nich DOKŁADNIE JEDEN wiersz („Katapulta"/„Catapult"), więc
  // dopasowanie po podciągu jest tu bezpieczne i nie może przechwycić sąsiada.
  // Kolejność względem taranów wyżej też jest sprawdzona: żadna z tych nazw
  // nie zawiera rdzenia „taran" ani „battering ram" i odwrotnie.
  // Model to ONAGER — uzasadnienie typu w sekcji K1 przy buildCatapult().
  if (n.includes('katapulta') || n.includes('catapult')) return buildCatapult(ownerColor_);
  if ((n.includes('wieza') && n.includes('oblezn')) || n.includes('siege tower')) return buildSiegeTower(ownerColor_);
  // RZYM LUDY MORZA ------------------------------------------------------------
  if (n.includes('wojownik tyrrenski') || n.includes('tyrrenski') || n.includes('tyrrhenian warrior') || n.includes('tyrrhenian')) return buildTyrrhenian(ownerColor_);
  if (n.includes('wojownik szekelesz') || n.includes('szekelesz') || n.includes('shekelesh warrior') || n.includes('shekelesh')) return buildShekelesh(ownerColor_);
  // RZYM ŻELAZO — Hastati (własny model republikański) -----------------------
  // OPUS 5 (Maciej 2026-07-26): wariant hastati-opus5.ts zastępuje starszy
  // model z hastati-falangita.ts (buildHastati poniżej zostaje jako rezerwa).
  if (n.includes('hastati')) return buildHastatiOpus5(ownerColor_);
  // GRAFIKA-JEDNOSTKI: nowe bespoke modele (p3 Asyria + p8a Bliski Wschod +
  // p8b) — CELOWO przed sekcja Legionu ponizej, zeby "Legion Rzymski"
  // zwrocil wlasny model zanim zadziala linia zabijajaca 'legion'.
  if (n.includes('lucznik asyryjski') || n.includes('assyrian archer')) return buildAssyrianArcher(ownerColor_);
  if (n.includes('piechota hetycka') || n.includes('hittite infantry')) return buildPiechotaHetycka(ownerColor_);
  if (n.includes('gwardia ishtar') || n.includes('ishtar guard')) return buildGwardiaIshtar(ownerColor_);
  if (n.includes('wojownik babilonski') || n.includes('babylonian warrior')) return buildWojownikBabilonski(ownerColor_);
  if (n.includes('wojownik fenicki') || n.includes('phoenician warrior')) return buildWojownikFenicki(ownerColor_);
  if (n.includes('straznik bram') || n.includes('gatekeeper') || (n.includes('harap') && n.includes('straznik'))) return buildStraznikHarappy(ownerColor_);
  if (n.includes('piechota induska') || n.includes('indus infantry') || n.includes('indusk')) return buildPiechotaInduska(ownerColor_);
  if (n.includes('legion rzymski') || n.includes('roman legion')) return buildLegionRzymski(ownerColor_);
  if (n.includes('gwardzista z champi') || n.includes('champi guard') || (n.includes('champi') && n.includes('gwardz'))) return buildGwardzistaChampi(ownerColor_);
  // RZYM KLASYCZNY — Legion (imperialny, rezerwa) → buildCategoryModel('legionista')
  // Bespoke alias żeby przyszła jednostka "Legion" z buildNamedUnit dostawała własny model.
  // Na razie delegujemy do kategorii legionista (lorica segmentata, rezerwa).
  if (n.includes('legion') && !n.includes('hastati')) return null;  // fallthrough → 'legionista' category
  // INKA — BESPOKE NAMED UNITS -------------------------------------------------
  if (n.includes('wojownik z maczuga') || n.includes('chaska') || n.includes('mace warrior')) return buildMaceWarrior(ownerColor_);
  if (n.includes('wojownik z toporem') && !n.includes('szekelesz') && !n.includes('mykensk') && !n.includes('germansk') && !n.includes('celtyck')) return buildAxeWarriorInka(ownerColor_);
  // GRECJA — HIEROS LOCHOS (Święty Zastęp, tebański) ---------------------------
  if (n.includes('hieros') || n.includes('swiety zastep') || n.includes('sacred band')) return buildHierosLochos(ownerColor_);
  // EGIPT — MEDŻAJ (Gwardia Faraona) -------------------------------------------
  if (n.includes('medzaj') || n.includes('medjay') || n.includes('gwardia faraona')) return buildMedjay(ownerColor_);
  // SUMER — GWARDIA KRÓLEWSKA SUMERU (Sumerian Royal Guard) ------------------
  // UWAGA: 'sumer' PRZED 'royal guard' żeby uniknąć kolizji z inkaskim Royal Guard.
  if (n.includes('gwardia krolewska sumeru') || n.includes('sumerian royal guard') || n.includes('qurubuti')) return buildSumerianRoyalGuard(ownerColor_);
  // CHINY — HU BEN WEI (Gwardia Tygrysa / Tiger Guard) ----------------------
  if (n.includes('hu ben wei') || n.includes('tiger guard') || n.includes('gwardia tygrysa')) return buildHuBenWei(ownerColor_);
  // ZULUS — uTHULWANA (Białe Tarcze / White Shields) ------------------------
  if (n.includes('uthulwana') || n.includes('white shields') || n.includes('biale tarcze')) return buildUThulwana(ownerColor_);
  // INKA — KRÓLEWSKA GWARDIA (Royal Guard) — po sumer żeby nie łapał sumeryjskiego -----
  if ((n.includes('krolewska gwardia') || n.includes('royal guard')) && !n.includes('sumer')) return buildInkaRoyalGuard(ownerColor_);
  // GRAFIKA-JEDNOSTKI 2b (ŻELAZO): Mezopotamia/Indus (jednostki-z1-mezopotamia.ts) --
  // AUDYT R-ZELAZO-AUDYT-POZOSTALE-Q1-T5: te cztery linie miały WYŁĄCZNIE rdzeń
  // polski. ZMIERZONE w żywym Three.js: „Hittite Guard", „Neo-Babylonian
  // Infantry", „Shield Wall (Sargonid)" i „Harappan Garrison" (kolumna
  // „Nazwa EN" z units.json) dawały 28-mesh generyk `miecznik` zamiast
  // własnej figurki (34–37 mesh). Dodany rdzeń EN. [Final Control T6:
  // poprawiono twierdzenie „ścieżka angielska dziś nieosiągalna" — battleScene.ts
  // (x4) ma udokumentowany fallback `stats['Jednostka'] ?? bu.nazwa`, gdzie
  // `bu.nazwa` „now holds the ENGLISH display name" (komentarz przy
  // battleScene.ts:4986-4989) — ścieżka EN JEST osiągalna przez ten fallback,
  // gdy `stats['Jednostka']` jest niezdefiniowane. Ten sam błąd co przy tej
  // czwórce, teraz naprawiony tam gdzie znaleziony przy T6.] Rdzenie sprawdzone
  // na JEDNOZNACZNOŚĆ w całym units.json — dokładnie po jednym trafieniu każdy.
  if (n.includes('gwardia hetycka') || n.includes('hittite guard')) return buildGwardiaHetycka(ownerColor_);
  if (n.includes('piechota neobabilonska') || n.includes('neo-babylonian infantry')) return buildPiechotaNeobabilonska(ownerColor_);
  if (n.includes('mur tarcz') || n.includes('shield wall')) return buildMurTarcz(ownerColor_);
  if (n.includes('garnizon harappy') || n.includes('harappan garrison')) return buildGarnizonHarappy(ownerColor_);
  // GRAFIKA-JEDNOSTKI 2b (ŻELAZO): Śródziemnomorze (jednostki-z2-srodziemne.ts) ------
  // (Triari NIE tutaj — to super-jednostka, dispatch przez buildSuperUnit poniżej.)
  //
  // AUDYT R-ZELAZO-AUDYT-POZOSTALE-Q1-T6, ZMIERZONE w żywym Three.js (nie
  // odczytane ze źródła): przed audytem nazwy angielskie z kolumny „Nazwa EN"
  // w units.json dawały dla dwóch z tych czterech jednostek 28-meshowy generyk
  // `miecznik` zamiast własnej figurki (30 i 33 mesh) — „Tyre Guard" i
  // „Tyrian Swordsman" nie miały tu rdzenia EN w ogóle. Dopisane niżej.
  // „Thorakites" ma tę samą nazwę PL i EN, więc działał i przed audytem.
  //
  // NIE NAPRAWIONE TUTAJ, bo poprawka leży POZA allowlistą tego tematu:
  // „Iron Khopesh Warrior" (EN Wojownika z żelaznym khopesh) NIE dociera do
  // linii `iron khopesh` niżej — łapie go WCZEŚNIEJSZA linia dispatchu
  // egipskiego (`n.includes('khopesh warrior')`, w tym pliku, sekcja EGIPT)
  // i zwraca model BRĄZOWEGO wojownika z khopesh. Zmierzone: sygnatura części
  // dla „Iron Khopesh Warrior" jest identyczna z modelem `Wojownik z khopesh`,
  // nie z modelem żelaznym. Przyczyna: rdzeń `khopesh warrior` NIE jest
  // jednoznaczny w units.json — pasuje do DWÓCH wierszy („Khopesh Warrior"
  // i „Iron Khopesh Warrior"). Poprawka wymaga tknięcia linii należącej do
  // innej jednostki (brązowej), więc jest osobnym tematem, nie „przy okazji".
  //
  // Zakres skutku (zmierzony, nie założony — 8 żywych wywołań buildUnitModel
  // sprawdzone po jednym): manualBattle.ts nie przekazuje nazwy w ogóle;
  // unitMiniPreview.ts i units.ts (x2, przez typeId) przekazują nazwę POLSKĄ;
  // battleScene.ts (x4) przekazuje `stats['Jednostka'] ?? bu.nazwa` — z
  // UDOKUMENTOWANYM fallbackiem na `bu.nazwa`, która "now holds the ENGLISH
  // display name" (patrz komentarz przy battleScene.ts:4986-4989). Ścieżka
  // angielska NIE jest dziś nieosiągalna — jest osiągalna przez ten fallback,
  // więc dopisanie aliasów EN jest naprawą ścieżki osiągalnej, nie
  // utwardzeniem martwego kodu. [Final Control T6: poprzednia wersja tego
  // zdania twierdziła "nieosiągalna" bez sprawdzenia fallbacku — poprawiono.]
  // Rdzenie `tyre guard` i `tyrian swordsman` sprawdzone na jednoznaczność w
  // całym units.json: dokładnie po jednym trafieniu każdy.
  if (n.includes('tyrski miecznik') || n.includes('tyrian swordsman')) return buildTyrskiMiecznik(ownerColor_);
  if (n.includes('gwardia tyrensk') || n.includes('tyre guard')) return buildGwardiaTyrenska(ownerColor_);
  if (n.includes('zelaznym khopesh') || n.includes('iron khopesh')) return buildZelaznyKhopesh(ownerColor_);
  if (n.includes('thorakites')) return buildThorakites(ownerColor_);
  // GRAFIKA-JEDNOSTKI 2b (ŻELAZO): Plemiona (jednostki-z3-plemiona.ts) --------------
  // (Wojownik germański SUPER NIE tutaj — dispatch przez buildSuperUnit/cultureFromName.)
  // T10: alias EN `druzhinnik`. Przed T10 rdzeń był tylko polski, więc nazwa
  // angielska z `units.json` („Druzhinnik") NIE trafiała w ten model i wracała
  // fallbackiem do generyka kategorii `miecznik` (zmierzone: 28 mesh generyka
  // zamiast 32 mesh Drużynnika). iButho tego problemu nie miał — jego nazwa EN
  // („iButho with iklwa") zawiera rdzeń `ibutho`. Rdzeń `druzhinnik` sprawdzony
  // na jednoznaczność w całym units.json: dokładnie jedno trafienie.
  if (n.includes('druzynnik') || n.includes('druzhinnik')) return buildDruzynnik(ownerColor_);
  if (n.includes('ibutho') || n.includes('butho')) return buildIButho(ownerColor_);
  if (n.includes('miecznik galijski') || n.includes('gallic swordsman')) return buildMiecznikGalijski(ownerColor_);
  return null;
}



// ---------------------------------------------------------------------------
// BESPOKE NAMED UNITS — batch 2: Inka (Mace Warrior, Axe Warrior),
//   Grecja (Hieros Lochos / Sacred Band), Egipt (Medżaj / Medjay)
// ---------------------------------------------------------------------------

// --- Inka: WOJOWNIK Z MACZUGĄ (Chaska / Mace Warrior) ---------------------
/**
 * Andyjski wojownik z gwiaździstą maczugą (macana).
 * RÓŻNI SIĘ od inkaskiego super (buildInkaRoyalGuard) brakiem plakietki pektoralnej
 * i pióropuszu elitarnego — to zwykły wojownik epoki kamiennej.
 * Wyposażenie: pikowana tunika (ichcahuipilli) z wzorem, MACZUGA z gwiaździstą
 * głowicą (drzewce + kamienna gwiazda 6-ramienna), mała kwadratowa tarcza,
 * opaska z kilkoma piórami na głowie, sandały. ownerColor na piórach i tarczy.
 */
function buildMaceWarrior(ownerColor_: number): THREE.Group {
  // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p2-inka.ts).
  return buildMaceWarriorOpus5(ownerColor_);
}

// --- Inka: WOJOWNIK Z TOPOREM (Axe Warrior) ----------------------------------
/**
 * Andyjski wojownik z brązowym toporem (tumi / T-kształt).
 * RÓŻNI SIĘ od Mace Warrior głównie bronią (topór zamiast maczugi)
 * i detalami stroju (mniej geometryczny wzór, inne nakrycie głowy).
 * Wyposażenie: prosta tunika, BRĄZOWY TOPÓR T-kształtny na drzewcu,
 * mała tarcza, pojedyncze pióro na głowie. ownerColor na tarczy/piórze.
 */
function buildAxeWarriorInka(ownerColor_: number): THREE.Group {
  // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p2-inka.ts).
  return newBuildAxeWarriorInka(ownerColor_);
}

// --- Grecja: HIEROS LOCHOS (Święty Zastęp / Sacred Band) -------------------
/**
 * Tebański elitarny hoplita — Święty Zastęp.
 * RÓŻNI SIĘ od buildSuperGreece (Greka) tym, że:
 *   - BRAK bannera standardowego (to para walczących, nie dowódca)
 *   - SZKARŁATNY PŁASZCZ (scarlet cape) — charakterystyczna czerwień
 *   - Pełna aspis z ownerColor na polu tarczy
 *   - Koryncki hełm z czerwonym grzebieniem fore-aft
 *   - Brązowy muscle cuirass, nagolenniki, dory (długa włócznia)
 * ownerColor widoczny na aspis.
 */
function buildHierosLochos(ownerColor_: number): THREE.Group {
  const { group, mats } = buildBaseAvatar(COLOR_SKIN, COLOR_CRIMSON, ownerColor_);
  const mat = makeMatFactory(mats);
  const perGeo: THREE.BufferGeometry[] = [];

  const mBronze  = mat(COLOR_BRONZE,    0.42, 0.42);
  const mBronzL  = mat(COLOR_BRONZE_LT, 0.56, 0.32);
  const mSteel   = mat(COLOR_STEEL,     0.52, 0.38);
  const mCrimson = mat(COLOR_CRIMSON,   0.08, 0.74);   // szkarłatny płaszcz/grzebień
  const mOwner   = mat(ownerColor_,     0.14, 0.64);   // ownerColor na aspis
  const mWood    = mat(COLOR_WOOD,      0.05, 0.85);   // dory (włócznia)
  const mLeath   = mat(COLOR_LEATHER,   0.06, 0.82);

  // --- SZKARŁATNY PŁASZCZ za plecami (charakterystyczna czerwień Tebańczyków) ---
  const mCape = new THREE.Mesh(getGeoSuperCape(), mCrimson);
  mCape.scale.set(1.08, 1.05, 1.0);
  mCape.position.set(0, AV_Y_TORSO_CTR - 0.008 * HEX_R, -AV_TORSO_D * 0.5 - 0.007 * HEX_R);
  mCape.rotation.x = 0.15;
  group.add(mCape);

  // --- BRĄZOWY MUSCLE CUIRASS (kirys mięśniowy) ---
  const mCuir = new THREE.Mesh(getGeoCuirassBox(), mBronze);
  mCuir.scale.set(1.0, 1.0, 1.0);
  mCuir.position.set(0, AV_Y_TORSO_CTR, 0);
  group.add(mCuir);
  // Linia pektoralna (dekoracyjny pas brązowy-jasny)
  const mPec = new THREE.Mesh(getGeoGildedTrim(), mBronzL);
  mPec.position.set(0, AV_Y_TORSO_CTR + 0.032 * HEX_R, 0.001 * HEX_R);
  group.add(mPec);
  // Pteruges skórzane pod kirysem
  addPteruges(group, mLeath);

  // --- KORYNCKI HEŁM + CZERWONY GRZEBIEŃ FORE-AFT ---
  const mHelm = new THREE.Mesh(getGeoCorinthDome(), mBronze);
  mHelm.position.set(0, AV_Y_HEAD_CTR + 0.012 * HEX_R, 0);
  group.add(mHelm);
  // Wąska szczelina na oczy (dark)
  const gSlit = new THREE.BoxGeometry(0.018 * HEX_R, 0.048 * HEX_R, 0.012 * HEX_R);
  perGeo.push(gSlit);
  const mSlit = new THREE.Mesh(gSlit, mat(0x1a100a, 0.05, 0.92));
  mSlit.position.set(0, AV_Y_HEAD_CTR - 0.010 * HEX_R, AV_HEAD_S * 0.5 + 0.006 * HEX_R);
  group.add(mSlit);
  // Podstawa grzebienia (brązowy grzbiet)
  const mCrBase = new THREE.Mesh(getGeoTransverseCrest(), mBronzL);
  mCrBase.rotation.y = Math.PI / 2;  // fore-aft
  mCrBase.position.set(0, AV_Y_HEAD_TOP + 0.030 * HEX_R, 0);
  group.add(mCrBase);
  // Czerwony grzebień (wyższy niż generic hoplita — elita)
  const gCrest = new THREE.BoxGeometry(0.028 * HEX_R, 0.105 * HEX_R, 0.140 * HEX_R);
  perGeo.push(gCrest);
  const mCrest = new THREE.Mesh(gCrest, mCrimson);
  mCrest.position.set(0, AV_Y_HEAD_TOP + 0.090 * HEX_R, 0);
  group.add(mCrest);

  // --- DUŻE DORY (DŁUGA WŁÓCZNIA) w prawej ręce ---
  const SP_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.012 * HEX_R;
  const mDory = new THREE.Mesh(getGeoDoryShaft(), mWood);
  mDory.position.set(SP_X, AV_Y_TORSO_CTR + 0.10 * HEX_R, 0.010 * HEX_R);
  group.add(mDory);
  const mTip = new THREE.Mesh(getGeoSpearTip(), mSteel);
  mTip.position.set(SP_X, AV_Y_TORSO_CTR + 0.10 * HEX_R + 0.31 * HEX_R + 0.028 * HEX_R, 0.010 * HEX_R);
  group.add(mTip);
  // Sauroter (brązowy ostrokokoniec dolny)
  const mSaur = new THREE.Mesh(getGeoSauroter(), mBronzL);
  mSaur.position.set(SP_X, AV_Y_TORSO_CTR + 0.10 * HEX_R - 0.31 * HEX_R - 0.022 * HEX_R, 0.010 * HEX_R);
  group.add(mSaur);

  // --- DUŻA OKRĄGŁA ASPIS (lewa ręka) z ownerColor + brązowy rim ---
  // Aspis Hierosa jest szersza / grubsza niż generic (prestiżowa)
  const SH_X = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.018 * HEX_R);
  const mRim = new THREE.Mesh(getGeoAspisRim(), mBronzL);
  mRim.rotation.z = Math.PI / 2;
  mRim.scale.set(0.55, 1.0, 1.0);
  mRim.position.set(SH_X - 0.006 * HEX_R, AV_Y_TORSO_CTR, 0.012 * HEX_R);
  group.add(mRim);
  // Pole tarczy ownerColor (emblem)
  const mFace = new THREE.Mesh(getGeoAspisFace(), mOwner);
  mFace.rotation.z = Math.PI / 2;
  mFace.scale.set(0.55, 1.0, 1.0);
  mFace.position.set(SH_X, AV_Y_TORSO_CTR, 0.012 * HEX_R);
  group.add(mFace);
  // Krzyż na polu tarczy (prosty emblemat Świętego Zastępu — ciemny na ownerColor)
  const gCrossH = new THREE.BoxGeometry(0.100 * HEX_R, 0.014 * HEX_R, 0.012 * HEX_R);
  perGeo.push(gCrossH);
  const mCrossH = new THREE.Mesh(gCrossH, mBronze);
  mCrossH.rotation.z = Math.PI / 2;
  mCrossH.position.set(SH_X, AV_Y_TORSO_CTR, 0.024 * HEX_R);
  group.add(mCrossH);
  const gCrossV = new THREE.BoxGeometry(0.014 * HEX_R, 0.100 * HEX_R, 0.012 * HEX_R);
  perGeo.push(gCrossV);
  const mCrossV = new THREE.Mesh(gCrossV, mBronze);
  mCrossV.rotation.z = Math.PI / 2;
  mCrossV.position.set(SH_X, AV_Y_TORSO_CTR, 0.024 * HEX_R);
  group.add(mCrossV);

  // --- NAGOLENNIKI BRĄZOWE ---
  addGreaves(group, mBronzL);
  addBoots(group, mLeath);
  addHands(group, mat(COLOR_SKIN, 0.05, 0.80));

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = perGeo;
  return group;
}

// --- Egipt: MEDŻAJ (Gwardia Faraona / Medjay) -------------------------------
/**
 * Egipski elitarny gwardzista Medżaj — ochrona faraona.
 * RÓŻNI SIĘ od sumeryjskiej Gwardii Królewskiej (buildSumerianRoyalGuard) sposobem złożenia:
 *   - BRAK bannera standardowego (jednostka bojowa, nie dowódca)
 *   - Skóra LAMPARTA lub pasy nemes-like (pasiaste nakrycie głowy)
 *   - KHOPESH (sierpowaty miecz) w prawej ręce
 *   - OWALNA TARCZA hide (fig-8 / owalna skóra)
 *   - Szeroki złoty kołnierz USEKH (ownerColor)
 *   - Kilt lniany z brązowymi akcentami
 * ownerColor widoczny na kołnierzu usekh i detalu nemes.
 */
function buildMedjay(ownerColor_: number): THREE.Group {
  const { group, mats } = buildBaseAvatar(COLOR_SKIN, COLOR_LINEN, ownerColor_);
  const mat = makeMatFactory(mats);
  const perGeo: THREE.BufferGeometry[] = [];

  const mLinen  = mat(COLOR_LINEN,     0.05, 0.84);
  const mGold   = mat(COLOR_GOLD_BR,   0.55, 0.34);
  const mBlue   = mat(COLOR_WOAD,      0.10, 0.68);   // nemes niebieskie pasy
  const mBronze = mat(COLOR_BRONZE,    0.42, 0.44);
  const mBronzL = mat(COLOR_BRONZE_LT, 0.52, 0.36);
  const mHide   = mat(COLOR_HIDE_RED,  0.06, 0.84);   // tarcza skórzana
  const mOwner  = mat(ownerColor_,     0.14, 0.64);   // ownerColor (kołnierz + nemes pasy)
  const mWood   = mat(COLOR_WOOD,      0.05, 0.85);
  const mLeath  = mat(COLOR_LEATHER,   0.06, 0.82);
  const mLeoprd = mat(0x3a2808,        0.05, 0.88);   // ciemna skóra lamparta (kilt)

  // --- KILT LNIANY z akcentami ---
  const gKilt = new THREE.BoxGeometry(AV_TORSO_W * 1.12, 0.120 * HEX_R, AV_TORSO_D * 1.08);
  perGeo.push(gKilt);
  const mKiltM = new THREE.Mesh(gKilt, mLinen);
  mKiltM.position.set(0, AV_Y_TORSO_BOT - 0.022 * HEX_R, 0);
  group.add(mKiltM);
  // Diagonalne cętki lamparta na kilcie (3 małe ciemne plamy)
  const leopardSpots: [number, number][] = [[-0.04, -0.01], [0.00, -0.04], [0.04, -0.02]];
  for (const [ldx, ldy] of leopardSpots) {
    const gSpot = new THREE.BoxGeometry(0.022 * HEX_R, 0.018 * HEX_R, 0.013 * HEX_R);
    perGeo.push(gSpot);
    const mSpot = new THREE.Mesh(gSpot, mLeoprd);
    mSpot.position.set(ldx * HEX_R, AV_Y_TORSO_BOT + ldy * HEX_R - 0.018 * HEX_R, AV_TORSO_D * 0.5 + 0.008 * HEX_R);
    group.add(mSpot);
  }
  // Złoty pas lędźwiowy
  addBelt(group, mGold, 0.018);

  // --- SZEROKI KOŁNIERZ USEKH (ownerColor — dominujący akcent) ---
  const gCollW = new THREE.BoxGeometry(AV_TORSO_W * 1.06, 0.048 * HEX_R, AV_TORSO_D * 1.04);
  perGeo.push(gCollW);
  const mCollW = new THREE.Mesh(gCollW, mOwner);
  mCollW.position.set(0, AV_Y_TORSO_TOP - 0.018 * HEX_R, 0.003 * HEX_R);
  group.add(mCollW);
  // Złoty obrzeże kołnierza
  const gCollEdge = new THREE.BoxGeometry(AV_TORSO_W * 1.10, 0.012 * HEX_R, AV_TORSO_D * 1.08);
  perGeo.push(gCollEdge);
  const mCollE = new THREE.Mesh(gCollEdge, mGold);
  mCollE.position.set(0, AV_Y_TORSO_TOP - 0.042 * HEX_R, 0.002 * HEX_R);
  group.add(mCollE);

  // --- NAKRYCIE GŁOWY: NEMES (chusta) — czapa na CIEMIENIU, twarz odsłonięta ---
  // NAPRAWA 2026-08-06: poprzednia wersja stawiała bryłę 0.165³ na środku głowy
  // (AV_HEAD_S = 0.13), więc chusta była SZERSZA i GŁĘBSZA niż głowa i zasłaniała
  // całą twarz razem z oczami (z = AV_HEAD_S*0.5 + 0.003 = 0.068 < 0.0825 przodu
  // chusty). Z kąta gry 52° figurka czytała się jako niebieski klocek bez głowy.
  // Teraz chusta siada na CIEMIENIU (dół 0.535 > linia oczu 0.525), a twarz
  // obramowują lapety opadające na ramiona — czyli tak, jak nemes wygląda.
  const NEM_Y = AV_Y_HEAD_CTR + 0.055 * HEX_R;
  const gNemes = new THREE.BoxGeometry(0.158 * HEX_R, 0.072 * HEX_R, 0.162 * HEX_R);
  perGeo.push(gNemes);
  const mNemesM = new THREE.Mesh(gNemes, mBlue);
  mNemesM.position.set(0, NEM_Y, -0.004 * HEX_R);
  group.add(mNemesM);
  // Pasy nemes (ownerColor + złoto) na PRZEDNIEJ ścianie chusty — nad oczami.
  for (let ni = 0; ni < 2; ni++) {
    const gStripe = new THREE.BoxGeometry(0.158 * HEX_R, 0.015 * HEX_R, 0.012 * HEX_R);
    perGeo.push(gStripe);
    const mStripe = new THREE.Mesh(gStripe, (ni === 0) ? mOwner : mGold);
    mStripe.position.set(0, NEM_Y + 0.018 * HEX_R - ni * 0.030 * HEX_R, 0.082 * HEX_R);
    group.add(mStripe);
  }
  // Złota opaska czołowa tuż nad brwiami (oddziela chustę od twarzy).
  const gBand = new THREE.BoxGeometry(0.150 * HEX_R, 0.016 * HEX_R, 0.020 * HEX_R);
  perGeo.push(gBand);
  const mBandM = new THREE.Mesh(gBand, mGold);
  mBandM.position.set(0, AV_Y_HEAD_CTR + 0.040 * HEX_R, AV_HEAD_S * 0.5 + 0.006 * HEX_R);
  group.add(mBandM);
  // Lapety nemes — opadają PRZED ramionami i obramowują twarz.
  for (const sx of [-1, 1]) {
    const gLap = new THREE.BoxGeometry(0.040 * HEX_R, 0.130 * HEX_R, 0.026 * HEX_R);
    perGeo.push(gLap);
    const mLap = new THREE.Mesh(gLap, mBlue);
    mLap.position.set(sx * (AV_HEAD_S * 0.5 + 0.019 * HEX_R), AV_Y_HEAD_CTR - 0.018 * HEX_R, 0.040 * HEX_R);
    group.add(mLap);
  }
  // Tren chusty z tyłu (warkocz nemes).
  const gQueue = new THREE.BoxGeometry(0.072 * HEX_R, 0.115 * HEX_R, 0.030 * HEX_R);
  perGeo.push(gQueue);
  const mQueue = new THREE.Mesh(gQueue, mBlue);
  mQueue.position.set(0, AV_Y_HEAD_CTR - 0.010 * HEX_R, -(AV_HEAD_S * 0.5 + 0.022 * HEX_R));
  group.add(mQueue);
  // Złoty uraeus (kobra) na czole — nad opaską, przed chustą.
  const gUra = new THREE.BoxGeometry(0.020 * HEX_R, 0.030 * HEX_R, 0.016 * HEX_R);
  perGeo.push(gUra);
  const mUra = new THREE.Mesh(gUra, mGold);
  mUra.position.set(0, AV_Y_HEAD_CTR + 0.062 * HEX_R, AV_HEAD_S * 0.5 + 0.014 * HEX_R);
  group.add(mUra);
  // PIÓRO STRUSIE (znak Medżaja / pióro Maat) — jedyny element, który wynosi
  // sylwetkę do konwencyjnych ~0.75 × HEX_R; pozostałe supery robią to
  // pióropuszem (uThulwana, Inka) albo hełmem z kitą (Hu Ben Wei).
  const gFeat = new THREE.BoxGeometry(0.024 * HEX_R, 0.150 * HEX_R, 0.013 * HEX_R);
  perGeo.push(gFeat);
  const mFeat = new THREE.Mesh(gFeat, mat(COLOR_PAINT_WHT, 0.03, 0.94));
  mFeat.rotation.z = 0.10;
  mFeat.position.set(0.012 * HEX_R, NEM_Y + 0.108 * HEX_R, -0.016 * HEX_R);
  group.add(mFeat);
  const gFeatB = new THREE.BoxGeometry(0.030 * HEX_R, 0.022 * HEX_R, 0.018 * HEX_R);
  perGeo.push(gFeatB);
  const mFeatB = new THREE.Mesh(gFeatB, mGold);   // złota tulejka pióra
  mFeatB.position.set(0.006 * HEX_R, NEM_Y + 0.040 * HEX_R, -0.016 * HEX_R);
  group.add(mFeatB);

  // --- KHOPESH (sierpowaty miecz) — prawa ręka, PODNIESIONY DO CIOSU ---
  // NAPRAWA 2026-08-06: dawniej rękojeść siedziała na x = 0.165, czyli OBOK
  // ramienia (0.093..0.153) — miecz wisiał w powietrzu obok figurki. Teraz oś
  // broni przechodzi przez dłoń, a klinga idzie w górę ponad bark (tak samo
  // rozwiązuje to nowszy model p6 „khopesz w ciosie").
  //
  // NAPRAWA 2 (2026-08-06, D1 z recenzji Evaluatora): oś X była już dobra, ale
  // WYSOKOŚĆ nie — KH_Y_BASE = AV_Y_TORSO_CTR + 0.035 stawiało rękojeść na
  // y = 0.365..0.425 × HEX_R, czyli 0.0995 × HEX_R PONAD dłonią, której środek
  // addHands() kładzie na y = 0.243 (góra 0.2655). Miecz wisiał więc w
  // powietrzu przy przedramieniu, a nie w pięści. Ramię zostaje opuszczone
  // (nie ruszamy zaakceptowanej sylwetki: odsłonięta twarz, czytelna tarcza,
  // pióro strusie) — zjeżdża sama broń, tak żeby środek rękojeści wypadł na
  // y = 0.250, czyli WEWNĄTRZ bryły dłoni (0.2205..0.2655). Klinga nadal idzie
  // w górę, kończąc ~0.46 × HEX_R, czyli ponad barkiem (0.42) — gest ciosu
  // pozostaje czytelny.
  // D4 (Evaluator, 2026-08-06): po zjechaniu w dół KH_X=AV_ARM_OFFSET_X sadzał
  // klingę NA osi samego rękawa (nieprzezroczysty box) — jelec i klinga prosta
  // znikały w 100% wewnątrz bryły ramienia. Odsunięte na zewnątrz rękawa,
  // wzorem reszty rodziny (Hu Ben Wei/uThulwana/Sumer stawiają broń przy
  // krawędzi ramienia, nie na jego osi): AV_ARM_OFFSET_X + AV_ARM_W*0.5 + δ.
  const KH_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.014 * HEX_R;
  // Środek dłoni z addHands() — jedno źródło prawdy, żeby broń nie mogła
  // „odjechać" od pięści przy zmianie proporcji awatara.
  const KH_HAND_Y = AV_Y_ARM_CTR - AV_ARM_H * 0.5 + 0.022 * HEX_R;   // 0.2430
  const KH_Y_BASE = KH_HAND_Y - 0.043 * HEX_R;   // rękojeść (base+0.050) → 0.250
  // Rękojeść
  const mGrip = new THREE.Mesh(getGeoSwordGrip(), mWood);
  mGrip.position.set(KH_X, KH_Y_BASE + 0.050 * HEX_R, 0.015 * HEX_R);
  group.add(mGrip);
  // Poprzeczka/guard
  const gGuard = new THREE.BoxGeometry(0.050 * HEX_R, 0.013 * HEX_R, 0.015 * HEX_R);
  perGeo.push(gGuard);
  const mGuard = new THREE.Mesh(gGuard, mBronzL);
  mGuard.position.set(KH_X, KH_Y_BASE + 0.100 * HEX_R, 0.015 * HEX_R);
  group.add(mGuard);
  // Prosta część klingi
  const gShank = new THREE.BoxGeometry(0.020 * HEX_R, 0.120 * HEX_R, 0.010 * HEX_R);
  perGeo.push(gShank);
  const mShank = new THREE.Mesh(gShank, mBronze);
  mShank.position.set(KH_X, KH_Y_BASE + 0.165 * HEX_R, 0.015 * HEX_R);
  group.add(mShank);
  // Sierpowaty hak (3 segmenty zakrzywione do przodu)
  const hookSegs2: [number, number, number, number][] = [
    [0.022, 0.202, -0.50, 0.062],
    [0.050, 0.234, -1.05, 0.050],
    [0.070, 0.234, -1.65, 0.038],
  ];
  for (const [dx, dy, rz, len] of hookSegs2) {
    const gHk = new THREE.BoxGeometry(0.018 * HEX_R, len * HEX_R, 0.010 * HEX_R);
    perGeo.push(gHk);
    const mHk = new THREE.Mesh(gHk, mBronze);
    mHk.rotation.z = rz;
    mHk.position.set(KH_X + dx * HEX_R, KH_Y_BASE + dy * HEX_R, 0.015 * HEX_R);
    group.add(mHk);
  }

  // --- OWALNA TARCZA HIDE (fig-8 / owalna skóra) — lewa ręka ---
  // NAPRAWA 2026-08-06 — ORIENTACJA TARCZY. getGeoOvalShield() to walec o osi
  // wzdłuż lokalnego Y. Poprzednie `rotation.z = π/2` kładło tę oś na światowy
  // X, czyli LICO tarczy patrzyło w bok (±X). Kamera gry stoi na azymucie 0 pod
  // 52°, więc patrzyła na tarczę DOKŁADNIE KRAWĘDZIĄ — z figurki wystawał tylko
  // pionowy pasek grubości 0.018 i tarczy w ogóle nie było widać. Poprawne jest
  // `rotation.x = π/2` (oś walca → światowe +Z, lico do kamery) — dokładnie tak
  // robi nowszy pakiet modeli (jednostki-p6-super.ts, `face.rotation.x = π/2`).
  // Przy tej rotacji skala mapuje się: X → szerokość, Z → wysokość, Y → grubość.
  const SH_X = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.018 * HEX_R);
  const SH_Z = 0.046 * HEX_R;                      // przed przedramieniem
  // Górna część fig-8 (węższa)
  const mShTop = new THREE.Mesh(getGeoOvalShield(), mHide);
  mShTop.rotation.x = Math.PI / 2;
  mShTop.scale.set(0.84, 1.0, 1.03);
  mShTop.position.set(SH_X, AV_Y_TORSO_CTR + 0.072 * HEX_R, SH_Z);
  group.add(mShTop);
  // Dolna część fig-8 (szersza)
  const mShBot = new THREE.Mesh(getGeoOvalShield(), mHide);
  mShBot.rotation.x = Math.PI / 2;
  mShBot.scale.set(0.97, 1.0, 1.16);
  mShBot.position.set(SH_X, AV_Y_TORSO_CTR - 0.055 * HEX_R, SH_Z);
  group.add(mShBot);
  // Brązowy boss pośrodku
  const mBoss = new THREE.Mesh(getGeoShieldBoss(), mBronzL);
  mBoss.rotation.x = Math.PI / 2;
  mBoss.position.set(SH_X, AV_Y_TORSO_CTR + 0.010 * HEX_R, SH_Z + 0.012 * HEX_R);
  group.add(mBoss);

  addBoots(group, mLeath);
  addHands(group, mat(COLOR_SKIN, 0.05, 0.80));
  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = perGeo;
  return group;
}


// ---------------------------------------------------------------------------
// RZYM — HASTATI (Republika Rzymska, Epoka Żelaza)
// ---------------------------------------------------------------------------
/**
 * Hastatus — piechota liniowa Republiki Rzymskiej (przed reformą Mariuszową).
 * WIZUALNIE RÓŻNY od imperialnego Legionu (buildCategoryModel 'legionista'):
 *   Legion:   lorica segmentata (stalowe pasy), hełm Galea (imperialny),
 *             prostokątny scutum, grzebień transversus.
 *   Hastati:  hełm Montefortino (brązowa miska + 2 pionowe pióra po bokach),
 *             kolczuga lub napiersna (mail/pectorale) + pteruges na tunice,
 *             OWALNY SCUTUM (czerwony pionowy), pilum + gladius, 1 nagolennik.
 */
function buildHastati(ownerColor_: number): THREE.Group {
  // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (hastati-falangita.ts).
  return newBuildHastati(ownerColor_);
}

// --- ZULU SPECIALS ---------------------------------------------------------

/**
 * Impi — bare ochre torso (Zulu warrior), short iklwa stabbing spear, large
 * oval cowhide shield (black-and-white), minimal kit.  Reads instantly Zulu.
 */
function buildImpi(ownerColor_: number): THREE.Group {
  // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p57-wlocznie-machiny.ts).
  return newBuildImpi(ownerColor_);
}

/**
 * Oszczepnik Zulu (Izijula) — bundle of light throwing spears + small hide
 * shield, ochre bare body identical to Impi silhouette but lighter kit.
 */
function buildZuluJavelineer(ownerColor_: number): THREE.Group {
  // KAMIEŃ OPUS 5 (Maciej 2026-07-25, „zulu jest ok"): deleguje do wariantu
  // OPUS 5 (kamien-zulu-taran-opus5.ts) — groty kościane zamiast stalowych,
  // duża tarcza Nguni z plecionką izintsinga, wiązka zapasowych oszczepów.
  return buildZuluJavelineerOpus5(ownerColor_);
}

// --- SUMER SPECIALS --------------------------------------------------------

/**
 * Włócznik sumeryjski — tall rectangular tower shield, bronze-tipped spear,
 * fleece-trimmed lower garment (kaunakes), copper conical helm.
 */
function buildSumerianSpearman(ownerColor_: number): THREE.Group {
  // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p57-wlocznie-machiny.ts).
  return newBuildSumerianSpearman(ownerColor_);
}

/**
 * Łucznik sumeryjski — Mezopotamia wczesnodynastyczna (kaunakes w 4 poziomach,
 * narzuta z runa barwionego na terakotę, luk prosty, groty liściaste).
 */
function buildSumerianArcher(ownerColor_: number): THREE.Group {
  // KAMIEŃ OPUS 5 (Maciej 2026-07-25): deleguje do wariantu OPUS 5
  // (kamien-lucznicy-opus5.ts) — zgodność historyczna z epoką Kamienia
  // (bez luku kompozytowego, bez metalu), rozróżnialny od Egiptu.
  return buildSumerianArcherOpus5(ownerColor_);
}

/**
 * Rydwan sumeryjski — heavy early chariot: SOLID disc wheels (no spokes),
 * onager-pulled look (wide body), copper/fleece accents.  Reuses the chariot
 * group but re-skins disc wheels and adds fleece kaunakes to the driver.
 */
function buildSumerianChariot(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const mats: THREE.Material[] = [];
  const mat = makeMatFactory(mats);
  const perGeo: THREE.BufferGeometry[] = [];

  const mWood   = mat(0x6a5020,      0.05, 0.85);  // dark old wood
  const mBronze = mat(COLOR_BRONZE,  0.42, 0.45);
  const mBronzL = mat(COLOR_BRONZE_LT,0.50, 0.38);
  const mOwner  = mat(ownerColor_,   0.10, 0.70);
  const mHorse  = mat(0x7a5c30,      0.10, 0.80);  // muted dun = onager colour
  const mMane   = mat(0x3a2c1a,      0.05, 0.85);
  const mSkin   = mat(COLOR_SKIN,    0.05, 0.80);
  const mCloth  = mat(COLOR_TEAL,    0.06, 0.80);  // Sumer teal driver
  const mFleece = mat(0xd8c8a0,      0.04, 0.96);
  const mDark   = mat(COLOR_TROUSERS,0.05, 0.85);

  // SOLID disc wheels (no spokes) — the Sumerian hallmark.
  const WHEEL_R = 0.090 * HEX_R;
  const WHEEL_Y = WHEEL_R;
  const AXLE_Y  = WHEEL_Y;
  const CAR_FLOOR_Y = AXLE_Y + WHEEL_R * 0.30;

  for (const [sx, sign] of [[0.190 * HEX_R, 1], [-0.190 * HEX_R, -1]] as [number,number][]) {
    // Solid disc wheel.
    const gW = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.030 * HEX_R, 14, 1);
    perGeo.push(gW);
    const mW = new THREE.Mesh(gW, mWood);
    mW.rotation.z = Math.PI / 2;
    mW.position.set(sx, WHEEL_Y, -0.005 * HEX_R);
    group.add(mW);
    // Bronze rim.
    const gRim = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.036 * HEX_R, 14, 1, true);
    perGeo.push(gRim);
    const mRim = new THREE.Mesh(gRim, mBronze);
    mRim.rotation.z = Math.PI / 2;
    mRim.position.set(sx, WHEEL_Y, -0.005 * HEX_R);
    group.add(mRim);
    // Hub cap centre disc (solid wheel detail).
    const gHub = new THREE.CylinderGeometry(0.025 * HEX_R, 0.025 * HEX_R, 0.040 * HEX_R, 8, 1);
    perGeo.push(gHub);
    const mHub = new THREE.Mesh(gHub, mBronzL);
    mHub.rotation.z = Math.PI / 2;
    mHub.position.set(sx + sign * 0.012 * HEX_R, WHEEL_Y, -0.005 * HEX_R);
    group.add(mHub);
  }

  // Axle.
  const gAxle = new THREE.BoxGeometry(0.40 * HEX_R, 0.020 * HEX_R, 0.020 * HEX_R);
  perGeo.push(gAxle);
  const mAxle = new THREE.Mesh(gAxle, mBronze);
  mAxle.position.set(0, AXLE_Y, -0.005 * HEX_R);
  group.add(mAxle);

  // Heavier car body (wider, deeper box).
  const gFloor = new THREE.BoxGeometry(0.30 * HEX_R, 0.022 * HEX_R, 0.28 * HEX_R);
  perGeo.push(gFloor);
  const mFloor = new THREE.Mesh(gFloor, mWood);
  mFloor.position.set(0, CAR_FLOOR_Y, 0.07 * HEX_R);
  group.add(mFloor);
  // Front wall (owner colour).
  const gFW = new THREE.BoxGeometry(0.30 * HEX_R, 0.12 * HEX_R, 0.022 * HEX_R);
  perGeo.push(gFW);
  const mFW = new THREE.Mesh(gFW, mOwner);
  mFW.position.set(0, CAR_FLOOR_Y + 0.06 * HEX_R, -0.055 * HEX_R);
  group.add(mFW);
  // Side walls.
  for (const sx of [0.140 * HEX_R, -0.140 * HEX_R]) {
    const gSide = new THREE.BoxGeometry(0.022 * HEX_R, 0.10 * HEX_R, 0.28 * HEX_R);
    perGeo.push(gSide);
    const mSide = new THREE.Mesh(gSide, mWood);
    mSide.position.set(sx, CAR_FLOOR_Y + 0.05 * HEX_R, 0.07 * HEX_R);
    group.add(mSide);
  }
  // Bronze top trim on front wall.
  const gTrim = new THREE.BoxGeometry(0.32 * HEX_R, 0.018 * HEX_R, 0.024 * HEX_R);
  perGeo.push(gTrim);
  const mTrim = new THREE.Mesh(gTrim, mBronze);
  mTrim.position.set(0, CAR_FLOOR_Y + 0.118 * HEX_R, -0.055 * HEX_R);
  group.add(mTrim);

  // Draw pole + yoke.
  const POLE_Z_START = -0.066 * HEX_R;
  const POLE_Z_END   = -0.32  * HEX_R;
  const POLE_LEN = Math.abs(POLE_Z_END - POLE_Z_START);
  const gPole = new THREE.BoxGeometry(0.022 * HEX_R, 0.022 * HEX_R, POLE_LEN);
  perGeo.push(gPole);
  const mPole = new THREE.Mesh(gPole, mWood);
  mPole.position.set(0, CAR_FLOOR_Y, (POLE_Z_START + POLE_Z_END) * 0.5);
  group.add(mPole);
  const gYoke = new THREE.BoxGeometry(0.28 * HEX_R, 0.022 * HEX_R, 0.022 * HEX_R);
  perGeo.push(gYoke);
  const mYoke = new THREE.Mesh(gYoke, mBronze);
  mYoke.position.set(0, CAR_FLOOR_Y, POLE_Z_END);
  group.add(mYoke);

  // TWO onagers (horses with dun colouring) — same buildHorse helper.
  const HORSE_Z = POLE_Z_END - 0.08 * HEX_R;
  for (const hx of [0.10 * HEX_R, -0.10 * HEX_R]) {
    buildHorse(group, mat, mHorse, mMane, mDark, hx, HORSE_Z);
  }

  // Driver (scaled down, teal + fleece fringe, conical helm).
  const DRV_SCALE  = 0.82;
  const DRV_LEG_H  = AV_LEG_H  * DRV_SCALE;
  const DRV_TRS_H  = AV_TORSO_H * DRV_SCALE;
  const DRV_TRS_W  = AV_TORSO_W * DRV_SCALE;
  const DRV_TRS_D  = AV_TORSO_D * DRV_SCALE;
  const DRV_ARM_W  = AV_ARM_W  * DRV_SCALE;
  const DRV_ARM_H  = AV_ARM_H  * DRV_SCALE;
  const DRV_ARM_D  = AV_ARM_D  * DRV_SCALE;
  const DRV_HEAD_S = AV_HEAD_S * DRV_SCALE;
  const DRV_ARM_OX = DRV_TRS_W * 0.5 + DRV_ARM_W * 0.5 + 0.002 * HEX_R;
  const DRV_BASE   = CAR_FLOOR_Y + 0.008 * HEX_R;
  const DRV_LEG_CTR  = DRV_BASE + DRV_LEG_H * 0.5;
  const DRV_TRS_BOT  = DRV_BASE + DRV_LEG_H;
  const DRV_TRS_CTR  = DRV_TRS_BOT + DRV_TRS_H * 0.5;
  const DRV_TRS_TOP  = DRV_TRS_BOT + DRV_TRS_H;
  const DRV_ARM_CTR  = DRV_TRS_BOT + DRV_TRS_H * 0.55;
  const DRV_HEAD_CTR = DRV_TRS_TOP + AV_NECK_H * DRV_SCALE + DRV_HEAD_S * 0.5;

  const driverGroup = new THREE.Group();
  driverGroup.rotation.y = Math.PI;
  group.add(driverGroup);

  const gDLL = new THREE.BoxGeometry(AV_LEG_W * DRV_SCALE, DRV_LEG_H, AV_LEG_W * DRV_SCALE);
  perGeo.push(gDLL);
  const mDLL = new THREE.Mesh(gDLL, mDark);
  mDLL.position.set(-(AV_LEG_SEP + AV_LEG_W * DRV_SCALE * 0.5), DRV_LEG_CTR, 0.03 * HEX_R);
  driverGroup.add(mDLL);
  const gDLR = new THREE.BoxGeometry(AV_LEG_W * DRV_SCALE, DRV_LEG_H, AV_LEG_W * DRV_SCALE);
  perGeo.push(gDLR);
  const mDLR = new THREE.Mesh(gDLR, mDark);
  mDLR.position.set( (AV_LEG_SEP + AV_LEG_W * DRV_SCALE * 0.5), DRV_LEG_CTR, 0.03 * HEX_R);
  driverGroup.add(mDLR);

  const gDTrs = new THREE.BoxGeometry(DRV_TRS_W, DRV_TRS_H, DRV_TRS_D);
  perGeo.push(gDTrs);
  const mDTrs = new THREE.Mesh(gDTrs, mCloth);
  mDTrs.position.set(0, DRV_TRS_CTR, 0.03 * HEX_R);
  driverGroup.add(mDTrs);
  // Fleece hem below torso.
  const gFleeceH = new THREE.BoxGeometry(DRV_TRS_W * 1.08, 0.026 * HEX_R, DRV_TRS_D * 1.05);
  perGeo.push(gFleeceH);
  const mFleeceH = new THREE.Mesh(gFleeceH, mFleece);
  mFleeceH.position.set(0, DRV_TRS_BOT - 0.014 * HEX_R, 0.03 * HEX_R);
  driverGroup.add(mFleeceH);
  // Owner sash.
  const gDSash = new THREE.BoxGeometry(DRV_TRS_W * 0.85, DRV_TRS_H * 0.28, 0.012 * HEX_R);
  perGeo.push(gDSash);
  const mDSash = new THREE.Mesh(gDSash, mOwner);
  mDSash.position.set(0, DRV_TRS_CTR, 0.03 * HEX_R + DRV_TRS_D * 0.5 + 0.002 * HEX_R);
  driverGroup.add(mDSash);

  for (const sx of [-1, 1]) {
    const gArm = new THREE.BoxGeometry(DRV_ARM_W, DRV_ARM_H, DRV_ARM_D);
    perGeo.push(gArm);
    const mArm = new THREE.Mesh(gArm, mCloth);
    mArm.position.set(sx * DRV_ARM_OX, DRV_ARM_CTR, 0.03 * HEX_R);
    driverGroup.add(mArm);
  }

  const gDHead = new THREE.BoxGeometry(DRV_HEAD_S, DRV_HEAD_S, DRV_HEAD_S);
  perGeo.push(gDHead);
  const mDHead = new THREE.Mesh(gDHead, mSkin);
  mDHead.position.set(0, DRV_HEAD_CTR, 0.03 * HEX_R);
  driverGroup.add(mDHead);
  // Eyes.
  const dEyeZ = DRV_HEAD_S * 0.5 + 0.002 * HEX_R;
  for (const [ex, ey] of [[-0.024, 0.008], [0.024, 0.008]] as [number,number][]) {
    const gE = new THREE.BoxGeometry(0.015 * HEX_R, 0.011 * HEX_R, 0.008 * HEX_R);
    perGeo.push(gE);
    const mE = new THREE.Mesh(gE, mat(COLOR_DARK_EYE, 0.02, 0.95));
    mE.position.set(ex * HEX_R, DRV_HEAD_CTR + ey * HEX_R, 0.03 * HEX_R + dEyeZ);
    driverGroup.add(mE);
  }
  // Conical copper helm on driver.
  const gHelm = new THREE.CylinderGeometry(0.020 * HEX_R * DRV_SCALE, 0.072 * HEX_R * DRV_SCALE, 0.085 * HEX_R * DRV_SCALE, 8, 1);
  perGeo.push(gHelm);
  const mHelm = new THREE.Mesh(gHelm, mBronze);
  mHelm.position.set(0, DRV_HEAD_CTR + DRV_HEAD_S * 0.52, 0.03 * HEX_R);
  driverGroup.add(mHelm);

  // Reins.
  const gRein = new THREE.BoxGeometry(0.12 * HEX_R, 0.008 * HEX_R, 0.008 * HEX_R);
  perGeo.push(gRein);
  const mRein = new THREE.Mesh(gRein, mDark);
  mRein.rotation.y = Math.PI * 0.5;
  mRein.position.set(0, DRV_ARM_CTR, 0.03 * HEX_R - DRV_TRS_D * 0.5 - 0.06 * HEX_R);
  driverGroup.add(mRein);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = perGeo;
  group.rotation.y = Math.PI;
  return group;
}

// --- EGIPT SPECIALS --------------------------------------------------------

/**
 * Łucznik egipski — Egipt predynastyczny (luk dwuwypukły / double-convex,
 * shendyt lniany, pióro strusia w opasce, groty poprzeczne z krzemienia).
 */
function buildEgyptianArcher(ownerColor_: number): THREE.Group {
  // KAMIEŃ OPUS 5 (Maciej 2026-07-25): deleguje do wariantu OPUS 5
  // (kamien-lucznicy-opus5.ts) — zgodność historyczna z epoką Kamienia
  // (bez luku kompozytowego, bez nemes, bez metalu).
  return buildEgyptianArcherOpus5(ownerColor_);
}

/**
 * Wojownik z khopesh — curved sickle-sword (khopesh) + small round shield,
 * Egyptian white linen kilt + nemes-style headcloth (same headgear family as
 * Egyptian Archer but armed for melee).
 */
function buildKhopeshWarrior(ownerColor_: number): THREE.Group {
  // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p4-melee.ts).
  return newBuildKhopeshWarrior(ownerColor_);
}

/**
 * Rydwan egipski — light 2-horse chariot with ARCHER on board (bow raised),
 * white linen + blue-striped nemes on driver, gold accents.
 */
function buildEgyptianChariot(ownerColor_: number): THREE.Group {
  // Start from the generic chariot but override driver appearance.
  const group = buildCategoryModel('rydwan', ownerColor_);
  const mats = group.userData['mats'] as THREE.Material[];
  const perGeo = (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? [];
  const mat = makeMatFactory(mats);

  // Add a composite bow on the front-right of the car (Egyptian archer carry).
  const mWood   = mat(0x6e4a24,    0.05, 0.82);
  const mString = mat(0xe8e0cc,    0.02, 0.95);
  const mGold   = mat(COLOR_GOLD,  0.55, 0.38);
  const mBlue   = mat(COLOR_WOAD,  0.05, 0.75);

  // Car was built near Z=0, floor at ~WHEEL_R + WHEEL_R*0.3 above ground.
  // We'll place a bow held upright on the right side of the car.
  const WHEEL_R   = 0.085 * HEX_R;
  const WHEEL_Y   = WHEEL_R;
  const CAR_FLOOR_Y = WHEEL_Y + WHEEL_R * 0.30;

  const BOW_X = 0.10 * HEX_R;
  const BOW_Y_CTR = CAR_FLOOR_Y + 0.25 * HEX_R;

  const bowSegs: [number, number, number][] = [
    [0.18, 0.0, 0.0], [0.14, 0.10, 0.30], [0.14, -0.10, 0.30],
  ];
  for (const [h, dy, rot] of bowSegs) {
    const gSeg = new THREE.BoxGeometry(0.015 * HEX_R, h * HEX_R, 0.015 * HEX_R);
    perGeo.push(gSeg);
    const mSeg = new THREE.Mesh(gSeg, mWood);
    mSeg.rotation.x = rot;
    mSeg.position.set(BOW_X, BOW_Y_CTR + dy * HEX_R, 0.06 * HEX_R);
    group.add(mSeg);
  }
  const gBStr = new THREE.BoxGeometry(0.005 * HEX_R, 0.36 * HEX_R, 0.005 * HEX_R);
  perGeo.push(gBStr);
  const mBStr = new THREE.Mesh(gBStr, mString);
  mBStr.position.set(BOW_X + 0.015 * HEX_R, BOW_Y_CTR, 0.08 * HEX_R);
  group.add(mBStr);

  // Gold trim strip on front wall (Egyptian gilt).
  const gGoldTrim = new THREE.BoxGeometry(0.30 * HEX_R, 0.014 * HEX_R, 0.024 * HEX_R);
  perGeo.push(gGoldTrim);
  const mGoldTrimM = new THREE.Mesh(gGoldTrim, mGold);
  mGoldTrimM.position.set(0, CAR_FLOOR_Y + 0.115 * HEX_R, -0.050 * HEX_R);
  group.add(mGoldTrimM);

  // Blue stripe on car front panel (over the ownerColor front wall).
  const gBlueStripe = new THREE.BoxGeometry(0.28 * HEX_R, 0.016 * HEX_R, 0.022 * HEX_R);
  perGeo.push(gBlueStripe);
  const mBlueStripe = new THREE.Mesh(gBlueStripe, mBlue);
  mBlueStripe.position.set(0, CAR_FLOOR_Y + 0.068 * HEX_R, -0.050 * HEX_R);
  group.add(mBlueStripe);

  group.userData['perTokenGeos'] = perGeo;
  return group;
}

// --- INKA SPECIALS ---------------------------------------------------------

/**
 * Oszczepnik (Estólica) — Inca atlatl (spear-thrower) + darts, Andean tunic
 * (uncu) in ochre/gold, colourful headband.
 */
function buildInkaJavelineer(ownerColor_: number): THREE.Group {
  // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p2-inka.ts).
  return buildInkaJavelineerOpus5(ownerColor_);
}

/**
 * Procarz (Huaracoc) — Andean sling + stone pouch, colourful uncu tunic,
 * ear ornaments, red headband.  Distinctly Inca vs generic ochre slinger.
 */
function buildInkaSlinger(ownerColor_: number): THREE.Group {
  // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p2-inka.ts).
  return newBuildInkaSlinger(ownerColor_);
}

// --- CHINY SPECIALS --------------------------------------------------------

/**
 * Jeździec chiński — lacquer-red lamellar armour horseman, dagger-axe (ge)
 * held raised, Chinese rounded helm with a neck flap + owner pennon.
 */
function buildChineseCavalry(ownerColor_: number): THREE.Group {
  // Start from the generic cavalry group — it provides horse + rider skeleton.
  const group = buildCategoryModel('konnica', ownerColor_);
  const mats  = group.userData['mats'] as THREE.Material[];
  const perGeo = (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? [];
  const mat = makeMatFactory(mats);

  const mLac   = mat(COLOR_LACQUER, 0.10, 0.55);
  const mBronz = mat(COLOR_BRONZE,  0.42, 0.45);
  const mBronzL= mat(COLOR_BRONZE_LT,0.50, 0.38);
  const mWood  = mat(COLOR_WOOD,    0.05, 0.85);
  const mOwner = mat(ownerColor_,   0.10, 0.68);

  // The rider in the konnica group sits at horseBackY above ground.
  // From konnica builder we know:  RIDER_BOT = horseBackY; the horse is
  // built by buildHorse() which returns horseBackY.
  // Approximate horseBackY from the horse geometry constants:
  const HORSE_BODY_H = 0.12 * HEX_R;
  const HORSE_BODY_Y = 0.14 * HEX_R + HORSE_BODY_H * 0.5; // hoofH + legH + bodyCenter
  const RIDER_BOT    = HORSE_BODY_Y + HORSE_BODY_H * 0.5;
  const R_TRS_CTR    = RIDER_BOT + AV_TORSO_H * 0.5;
  const R_TRS_TOP    = RIDER_BOT + AV_TORSO_H;
  const R_HEAD_CTR   = R_TRS_TOP + AV_NECK_H + AV_HEAD_S * 0.5;
  const R_ARM_CTR    = RIDER_BOT + AV_TORSO_H * 0.55;

  // Overlay a lacquer lamellar coat on the torso (slightly larger than torso).
  const gCoat = new THREE.BoxGeometry(AV_TORSO_W * 0.92, AV_TORSO_H * 0.78, AV_TORSO_D * 0.88);
  perGeo.push(gCoat);
  const mCoat = new THREE.Mesh(gCoat, mLac);
  mCoat.position.set(0, R_TRS_CTR, 0);
  group.add(mCoat);
  // Two horizontal bronze lamellar band lines.
  for (const dy of [0.04 * HEX_R, -0.04 * HEX_R]) {
    const gBand = new THREE.BoxGeometry(AV_TORSO_W * 0.94, 0.012 * HEX_R, AV_TORSO_D * 0.90);
    perGeo.push(gBand);
    const mBand = new THREE.Mesh(gBand, mBronzL);
    mBand.position.set(0, R_TRS_CTR + dy, 0.001 * HEX_R);
    group.add(mBand);
  }

  // Chinese helm: replace the existing helmet — just add a new bronze dome +
  // top spike + red neck flap over the rider head position.
  const gHelm = new THREE.CylinderGeometry(0.046 * HEX_R, 0.054 * HEX_R, 0.048 * HEX_R, 8, 1);
  perGeo.push(gHelm);
  const mHelm = new THREE.Mesh(gHelm, mBronz);
  mHelm.position.set(0, R_HEAD_CTR + AV_HEAD_S * 0.85 * 0.50 + 0.004 * HEX_R, 0);
  group.add(mHelm);
  const gSpike = new THREE.BoxGeometry(0.012 * HEX_R, 0.040 * HEX_R, 0.012 * HEX_R);
  perGeo.push(gSpike);
  const mSpike = new THREE.Mesh(gSpike, mBronzL);
  mSpike.position.set(0, R_HEAD_CTR + AV_HEAD_S * 0.85 * 0.50 + 0.044 * HEX_R, 0);
  group.add(mSpike);
  const gFlap = new THREE.BoxGeometry(AV_HEAD_S * 0.85 * 1.22, 0.034 * HEX_R, 0.026 * HEX_R);
  perGeo.push(gFlap);
  const mFlap = new THREE.Mesh(gFlap, mat(COLOR_LACQUER, 0.08, 0.72));
  mFlap.position.set(0, R_HEAD_CTR - AV_HEAD_S * 0.85 * 0.36, -AV_HEAD_S * 0.85 * 0.5 - 0.005 * HEX_R);
  group.add(mFlap);

  // DAGGER-AXE (ge) raised in right hand instead of lance.
  // In the konnica group the figure faces +Z (after the group.rotation.y=Math.PI).
  // We add into the group directly; the group spin will orient everything.
  const ARM_OX = AV_ARM_OFFSET_X * 0.85 + AV_ARM_W * 0.4 + 0.012 * HEX_R;
  const gPole  = new THREE.BoxGeometry(0.014 * HEX_R, 0.40 * HEX_R, 0.014 * HEX_R);
  perGeo.push(gPole);
  const mPole = new THREE.Mesh(gPole, mWood);
  mPole.position.set(ARM_OX, R_ARM_CTR + 0.15 * HEX_R, 0.02 * HEX_R);
  group.add(mPole);
  // Sideways ge blade near the top.
  const gGe = new THREE.BoxGeometry(0.016 * HEX_R, 0.028 * HEX_R, 0.10 * HEX_R);
  perGeo.push(gGe);
  const mGe = new THREE.Mesh(gGe, mBronzL);
  mGe.position.set(ARM_OX, R_ARM_CTR + 0.32 * HEX_R, 0.060 * HEX_R);
  group.add(mGe);
  // Pole tip.
  const mTip = new THREE.Mesh(getGeoSpearTip(), mBronz);
  mTip.scale.set(0.7, 0.6, 0.7);
  mTip.position.set(ARM_OX, R_ARM_CTR + 0.15 * HEX_R + 0.20 * HEX_R + 0.018 * HEX_R, 0.02 * HEX_R);
  group.add(mTip);

  group.userData['perTokenGeos'] = perGeo;
  return group;
}

// --- KUSZNIK (CROSSBOWMAN) -------------------------------------------------

/**
 * Kusznik — Chinese-flavoured crossbowman: CROSSBOW (horizontal stock + prod
 * bar across the front + a short bolt/quarrel loaded), lacquer-red lamellar
 * coat, Chinese rounded helm with spike, quiver-box on back.
 * Replaces the previous archer fallback — has a clearly horizontal weapon.
 */
function buildCrossbowman(ownerColor_: number): THREE.Group {
  const { group, mats } = buildBaseAvatar(COLOR_SKIN, COLOR_LACQUER, ownerColor_);
  const mat = makeMatFactory(mats);
  const perGeo: THREE.BufferGeometry[] = [];
  const mLac   = mat(COLOR_LACQUER,  0.10, 0.55);
  const mBronze = mat(COLOR_BRONZE,  0.42, 0.45);
  const mBronzL = mat(COLOR_BRONZE_LT,0.52, 0.38);
  const mWood  = mat(COLOR_WOOD,     0.05, 0.85);
  const mOwner = mat(ownerColor_,    0.10, 0.68);
  const mLeath = mat(COLOR_LEATHER,  0.06, 0.82);
  const mStr   = mat(0xe8e0cc,       0.02, 0.95);

  // Lamellar coat.
  const mCoat = new THREE.Mesh(getGeoCuirassBox(), mLac);
  mCoat.scale.set(1.0, 1.04, 1.0);
  mCoat.position.set(0, AV_Y_TORSO_CTR, 0);
  group.add(mCoat);
  for (const dy of [0.06, 0.0, -0.06]) {
    const gBand = new THREE.BoxGeometry(0.215 * HEX_R, 0.016 * HEX_R, 0.135 * HEX_R);
    perGeo.push(gBand);
    const mBand = new THREE.Mesh(gBand, mBronzL);
    mBand.position.set(0, AV_Y_TORSO_CTR + dy * HEX_R, 0.002 * HEX_R);
    group.add(mBand);
  }
  addTunicHem(group, mat(COLOR_LACQUER, 0.06, 0.6));

  // Chinese rounded helm + spike.
  const mHelm = new THREE.Mesh(getGeoMeleeHelm(), mBronze);
  mHelm.position.set(0, AV_Y_HEAD_CTR + 0.026 * HEX_R, 0);
  group.add(mHelm);
  const gSpike = new THREE.BoxGeometry(0.016 * HEX_R, 0.062 * HEX_R, 0.016 * HEX_R);
  perGeo.push(gSpike);
  const mSpike = new THREE.Mesh(gSpike, mBronzL);
  mSpike.position.set(0, AV_Y_HEAD_TOP + 0.060 * HEX_R, 0);
  group.add(mSpike);
  const gFlap = new THREE.BoxGeometry(0.155 * HEX_R, 0.042 * HEX_R, 0.032 * HEX_R);
  perGeo.push(gFlap);
  const mFlap = new THREE.Mesh(gFlap, mOwner);
  mFlap.position.set(0, AV_Y_HEAD_CTR - 0.030 * HEX_R, -AV_HEAD_S * 0.5 - 0.005 * HEX_R);
  group.add(mFlap);

  // CROSSBOW — held in both hands, weapon angled at chest height.
  // The prod (bow-limb) is HORIZONTAL, the stock runs fore-aft (+Z) from
  // the chest outward.  This is the defining silhouette difference from the archer.
  const CB_X = 0.0;                                                // centred
  const CB_Y = AV_Y_TORSO_CTR + 0.02 * HEX_R;                    // chest height
  const CB_Z = AV_TORSO_D * 0.5 + 0.05 * HEX_R;                  // in front of torso

  // Stock (tiller): a sturdy horizontal fore-aft bar.
  const gStock = new THREE.BoxGeometry(0.028 * HEX_R, 0.024 * HEX_R, 0.28 * HEX_R);
  perGeo.push(gStock);
  const mStock = new THREE.Mesh(gStock, mWood);
  mStock.position.set(CB_X, CB_Y, CB_Z + 0.04 * HEX_R);
  group.add(mStock);

  // Tiller grip/lock box (the nut/trigger housing sits mid-stock).
  const gLock = new THREE.BoxGeometry(0.040 * HEX_R, 0.036 * HEX_R, 0.040 * HEX_R);
  perGeo.push(gLock);
  const mLock = new THREE.Mesh(gLock, mBronze);
  mLock.position.set(CB_X, CB_Y, CB_Z + 0.02 * HEX_R);
  group.add(mLock);

  // PROD (bow-limb): HORIZONTAL bar crossing the stock at the front.
  const gProd = new THREE.BoxGeometry(0.26 * HEX_R, 0.020 * HEX_R, 0.020 * HEX_R);
  perGeo.push(gProd);
  const mProd = new THREE.Mesh(gProd, mWood);
  mProd.position.set(CB_X, CB_Y + 0.004 * HEX_R, CB_Z - 0.09 * HEX_R);
  group.add(mProd);
  // Prod string (horizontal, connecting the two tips of the prod).
  const gPString = new THREE.BoxGeometry(0.25 * HEX_R, 0.006 * HEX_R, 0.006 * HEX_R);
  perGeo.push(gPString);
  const mPString = new THREE.Mesh(gPString, mStr);
  mPString.position.set(CB_X, CB_Y + 0.014 * HEX_R, CB_Z - 0.09 * HEX_R);
  group.add(mPString);
  // Bronze tip caps on prod ends.
  for (const px of [-0.120 * HEX_R, 0.120 * HEX_R]) {
    const gCap = new THREE.BoxGeometry(0.016 * HEX_R, 0.024 * HEX_R, 0.024 * HEX_R);
    perGeo.push(gCap);
    const mCap = new THREE.Mesh(gCap, mBronzL);
    mCap.position.set(px, CB_Y + 0.004 * HEX_R, CB_Z - 0.09 * HEX_R);
    group.add(mCap);
  }

  // SHORT BOLT (quarrel) loaded in the groove on top of the stock.
  const gBolt = new THREE.BoxGeometry(0.012 * HEX_R, 0.012 * HEX_R, 0.14 * HEX_R);
  perGeo.push(gBolt);
  const mBolt = new THREE.Mesh(gBolt, mWood);
  mBolt.position.set(CB_X, CB_Y + 0.018 * HEX_R, CB_Z - 0.02 * HEX_R);
  group.add(mBolt);
  const gBoltTip = new THREE.BoxGeometry(0.014 * HEX_R, 0.014 * HEX_R, 0.030 * HEX_R);
  perGeo.push(gBoltTip);
  const mBoltTip = new THREE.Mesh(gBoltTip, mBronzL);
  mBoltTip.position.set(CB_X, CB_Y + 0.018 * HEX_R, CB_Z - 0.09 * HEX_R);
  group.add(mBoltTip);
  const gBoltFletch = new THREE.BoxGeometry(0.030 * HEX_R, 0.016 * HEX_R, 0.020 * HEX_R);
  perGeo.push(gBoltFletch);
  const mBoltFletch = new THREE.Mesh(gBoltFletch, mat(COLOR_FEATHER, 0.03, 0.92));
  mBoltFletch.position.set(CB_X, CB_Y + 0.020 * HEX_R, CB_Z + 0.10 * HEX_R);
  group.add(mBoltFletch);

  // Small bolt-quiver / magazine box on the back.
  const gQBox = new THREE.BoxGeometry(0.050 * HEX_R, 0.080 * HEX_R, 0.040 * HEX_R);
  perGeo.push(gQBox);
  const mQBox = new THREE.Mesh(gQBox, mLeath);
  mQBox.position.set(0.04 * HEX_R, AV_Y_TORSO_CTR + 0.04 * HEX_R, -AV_TORSO_D * 0.5 - 0.024 * HEX_R);
  group.add(mQBox);
  // A few bolt ends poking from the box (owner colour).
  for (const bx of [-0.014 * HEX_R, 0.014 * HEX_R]) {
    const gBE = new THREE.BoxGeometry(0.010 * HEX_R, 0.010 * HEX_R, 0.030 * HEX_R);
    perGeo.push(gBE);
    const mBE = new THREE.Mesh(gBE, mOwner);
    mBE.position.set(0.04 * HEX_R + bx, AV_Y_TORSO_CTR + 0.06 * HEX_R, -AV_TORSO_D * 0.5 - 0.040 * HEX_R);
    group.add(mBE);
  }

  addBoots(group, mLeath);
  addHands(group, mat(COLOR_SKIN, 0.05, 0.80));
  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = perGeo;
  return group;
}

// --- CELTS -----------------------------------------------------------------

/**
 * Wojownik celtycki — long iron sword, tall oval Celtic shield, tunic torso with
 * a bronze torc, bare head with drooping mustache + long hair (no helmet),
 * earthy striped tunic.
 */
function buildCeltWarrior(ownerColor_: number): THREE.Group {
  const { group, mats } = buildBaseAvatar(COLOR_SKIN, COLOR_BURGUNDY, ownerColor_);
  const mat = makeMatFactory(mats);
  const perGeo: THREE.BufferGeometry[] = [];
  const mIron  = mat(COLOR_STEEL,   0.55, 0.40);
  const mWood  = mat(COLOR_WOOD,    0.05, 0.85);
  const mBronz = mat(COLOR_BRONZE,  0.45, 0.42);
  const mOwner = mat(ownerColor_,   0.12, 0.66);
  const mHair  = mat(0xb8702a,      0.04, 0.86);   // reddish-blond Celtic hair
  const mPlank = mat(0x6e4a26,      0.05, 0.85);

  // Earthy striped tunic hem + belt.
  addTunicHem(group, mat(COLOR_OCHRE, 0.05, 0.86));
  addBelt(group, mat(COLOR_LEATHER, 0.06, 0.82));
  // Vertical owner-colour stripe on the tunic (Celtic plaid hint).
  const gStripe = new THREE.BoxGeometry(0.030 * HEX_R, AV_TORSO_H * 0.9, 0.010 * HEX_R);
  perGeo.push(gStripe);
  const mStripe = new THREE.Mesh(gStripe, mOwner);
  mStripe.position.set(0.04 * HEX_R, AV_Y_TORSO_CTR, AV_TORSO_D * 0.5 + 0.004 * HEX_R);
  group.add(mStripe);

  // Bronze torc + bare head with mustache and long hair (NO helmet).
  addTorc(group, mBronz, perGeo);
  addMustache(group, mHair, perGeo);
  addLongHair(group, mHair, perGeo);

  // Long iron slashing sword, raised right hand.
  addLongSwordRight(group, mIron, mWood, perGeo, 0.32);
  // Tall oval Celtic shield, left arm (planks + owner blazon spine + iron boss).
  addTallOvalShield(group, mOwner, mPlank, mIron, perGeo, 1.85);

  addBoots(group, mat(COLOR_LEATHER, 0.05, 0.86));
  addHands(group, mat(COLOR_SKIN, 0.05, 0.80));
  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = perGeo;
  return group;
}

/**
 * Gaesatae — NADZY celtyccy najemnicy uderzeniowi (Żelazo, Celtowie).
 *
 * ===========================================================================
 * ZGODNOŚĆ HISTORYCZNA — DECYZJE I UZASADNIENIA
 * (styl serii Opus 5, wzorem `braz-konnica-opus5.ts`; rama czasowa: III w. p.n.e.,
 *  szczyt zjawiska — bitwa pod TELAMON, 225 p.n.e.)
 * ===========================================================================
 *
 * K1. NAGOŚĆ — to jest cecha definicyjna tej jednostki, nie ozdobnik. Polibiusz
 *     (*Dzieje* II 28–30) opisuje pod Telamonem Gaesatów stojących w pierwszym
 *     szeregu NADZY, którzy zrzucili odzienie, podczas gdy stojący za nimi
 *     Insubrowie i Bojowie walczyli w spodniach i płaszczach. Dlatego korpus,
 *     ramiona i nogi mają barwę SKÓRY (`COLOR_SKIN` podany jako `clothColor` do
 *     `buildBaseAvatar`), a ciemne nogawki bazowego awatara są przykryte
 *     nakładką w kolorze ciała. Decyzja właściciela (`docs/decyzje/
 *     R-ZELAZO-MODELE-BRAKUJACE-Q1.md`) mówi wprost: „najemnicy słynący z walki
 *     nago/półnago, uzbrojeni w gaesum".
 *
 * K2. PRZEPASKA BIODROWA — jedyne odstępstwo od K1 i świadoma decyzja
 *     projektowa, nie przeoczenie. Źródła mówią o pełnej nagości; token gry
 *     dostaje minimalną przepaskę (`getGeoLoincloth`, skala 0.8/0.55/0.95).
 *     Przepaska niesie przy okazji BARWĘ WŁAŚCICIELA, czego naga sylwetka
 *     sama z siebie by nie dała.
 *
 * K3. ZŁOTY NASZYJNIK (TORC) I NARAMIENNIKI — poświadczone wprost. Polibiusz w
 *     tym samym ustępie podkreśla, że nadzy wojownicy byli ozdobieni ZŁOTYMI
 *     naszyjnikami i naramiennikami, i że łupy z nich zasiliły rzymski triumf.
 *     Stąd `COLOR_GOLD_BR` (nie brąz) na torc i na dwa naramienniki opinające
 *     ramiona — element ODRÓŻNIAJĄCY od Soldurii, którzy noszą torc BRĄZOWY.
 *     (Poprzednia wersja tej funkcji miała złoty torc opisany w komentarzu jako
 *     „bronze torc" — komentarz był nieprawdziwy, geometria była dobra.)
 *
 * K4. GAESUM — ciężka włócznia/oszczep żelazny, od którego pochodzi sama nazwa
 *     jednostki (gal. *gaisos*). Drzewce wydłużone z 0.50 na 0.62×HEX_R.
 *     POWÓD: przy 0.50 czubek grotu sięgał y=0.5655, a czubek głowy wojownika
 *     y=0.58 — broń NIE WYSTAWAŁA PONAD SYLWETKĘ i ginęła w obrysie tokena
 *     (pomiar w żywym Three.js, nie szacunek). Włócznia krótsza od własnego
 *     właściciela jest błędem proporcji: gaesum sięgał ok. 2 m. Po zmianie
 *     czubek grotu jest na y≈0.686, tuż nad czubkiem miecza Soldurii (0.66) —
 *     obie jednostki mają czytelną, ale RÓŻNĄ broń w sylwetce.
 *
 * K5. POZA: WŁÓCZNIA OPARTA O ZIEMIĘ, NIE ZAMACH DO RZUTU. To jest świadoma
 *     decyzja projektowa wymuszona przez DANE, nie przez ikonografię.
 *     `units.json` daje Gaesatae `Atak dystansowy = 0` / `missileAttack: 0` —
 *     jednostka NIE MA ataku dystansowego. Poza „zamach do rzutu" obiecywałaby
 *     graczowi zdolność, której jednostka nie posiada. Dlatego pięta drzewca
 *     stoi na ziemi (`AV_Y_LEG_BOT + 0.01`), a włócznia czyta się jako broń
 *     drzewcowa do PCHNIĘCIA — zgodnie z mechaniką („Rola (linia)": „Wręcz").
 *
 * K6. BRAK HEŁMU I BRAK BUTÓW — konsekwencja K1. Głowa naga, z opadającym
 *     wąsem (poświadczonym u Celtów przez Diodora Sycylijskiego V 28) i długimi
 *     włosami; stopy bose (`addBoots` w kolorze skóry). To drugi po nagości
 *     korpusu nośnik odróżnienia od Soldurii, którzy mają hełm i buty.
 *
 * K7. TARCZA OWALNA, ALE UBOGA. Gaesatae dostają tę samą wysoką owalną tarczę
 *     co reszta Celtów, lecz z licem z SUROWYCH DESEK (bez barwnego lica) i
 *     ŻELAZNYM umbem — najemnik nie ma tarczy paradnej. Barwę właściciela niesie
 *     pionowa spina. Polibiusz zresztą wprost krytykuje celtycką tarczę jako
 *     zbyt wąską, by osłonić nagie ciało — ubogie lico jest tu zgodne ze źródłem.
 *     (Poprzednia wersja dawała ZŁOTE umbo — anachroniczny zbytek u najemnika;
 *     złoto zostaje tam, gdzie je poświadczono: na torcu i naramiennikach, K3.)
 */
function buildGaesatae(ownerColor_: number): THREE.Group {
  // cloth == skin tone so the torso/arms read as bare flesh (K1).
  const { group, mats, headTopY, armLMesh } = buildBaseAvatar(COLOR_SKIN, COLOR_SKIN, ownerColor_);
  armLMesh.name = 'gaesatae-arm-left';
  const mat = makeMatFactory(mats);
  const perGeo: THREE.BufferGeometry[] = [];
  const mGold  = mat(COLOR_GOLD_BR, 0.50, 0.40);   // torc + naramienniki (K3)
  const mWood  = mat(COLOR_WOOD,    0.05, 0.85);
  const mIron  = mat(COLOR_STEEL,   0.50, 0.42);
  const mOwner = mat(ownerColor_,   0.12, 0.66);
  const mHair  = mat(0xc98a2c,      0.04, 0.86);
  const mPlank = mat(0x6e4a26,      0.05, 0.85);
  const mSkinLeg = mat(COLOR_SKIN,  0.05, 0.80);

  // K1: re-skin the dark trouser legs to bare flesh.  The overlay is 1.02× the
  // leg in ALL THREE axes — the previous 0.98 in Y left a dark trouser rim
  // showing at the ankle and at the hip.
  for (const sx of [-(AV_LEG_SEP + AV_LEG_W * 0.5), (AV_LEG_SEP + AV_LEG_W * 0.5)]) {
    const gLeg = new THREE.BoxGeometry(AV_LEG_W * 1.02, AV_LEG_H * 1.02, AV_LEG_W * 1.02);
    perGeo.push(gLeg);
    const mLeg = new THREE.Mesh(gLeg, mSkinLeg);
    mLeg.position.set(sx, AV_Y_LEG_CTR, 0);
    mLeg.name = 'gaesatae-bare-leg';
    group.add(mLeg);
  }
  // K2: a small loincloth only (otherwise naked), carrying the owner colour.
  const mLoin = new THREE.Mesh(getGeoLoincloth(), mOwner);
  mLoin.scale.set(0.8, 0.55, 0.95);
  mLoin.position.set(0, AV_Y_TORSO_BOT - 0.01 * HEX_R, 0);
  mLoin.name = 'gaesatae-loincloth';
  group.add(mLoin);

  // K3: gold torc + gold armlets on both upper arms.
  addTorc(group, mGold, perGeo);
  const gArmlet = new THREE.TorusGeometry(0.037 * HEX_R, 0.009 * HEX_R, 6, 12);
  perGeo.push(gArmlet);
  for (const sx of [-AV_ARM_OFFSET_X, AV_ARM_OFFSET_X]) {
    const mArmlet = new THREE.Mesh(gArmlet, mGold);
    mArmlet.rotation.x = Math.PI / 2;
    mArmlet.position.set(sx, AV_Y_TORSO_BOT + AV_TORSO_H * 0.86, 0);
    mArmlet.name = 'gaesatae-armlet';
    group.add(mArmlet);
  }
  // K6: bare head — mustache + long hair, no helmet.
  addMustache(group, mHair, perGeo);
  addLongHair(group, mHair, perGeo);

  // K4/K5: long gaesum, butt planted on the ground (melee pose, missileAttack=0).
  addSpearRight(group, mWood, mIron, perGeo, 0.62, 'gaesatae');
  // K7: plain plank face, owner-colour spine, IRON boss.
  addTallOvalShield(group, mPlank, mOwner, mIron, perGeo, 1.85, 'gaesatae');

  addBoots(group, mat(COLOR_SKIN, 0.05, 0.82));   // K6: bare feet (skin)
  addHands(group, mat(COLOR_SKIN, 0.05, 0.80));
  // Punkty odniesienia WYPROWADZONE Z MODELU (nie wpisane liczbowo) — test
  // regresji mierzy nimi relacje geometryczne, więc nie rozjadą się przy
  // zmianie proporcji awatara.
  group.userData['anchors'] = {
    headTopY,
    eyeTopY: AV_Y_HEAD_CTR + 0.010 * HEX_R + getGeoAvEye().parameters.height * 0.5,
    legTopY: AV_Y_LEG_TOP,
    legBotY: AV_Y_LEG_BOT,
  };
  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = perGeo;
  return group;
}

/**
 * Soldurii — elitarna, przysięgła gwardia celtyckiego/celtyberyjskiego wodza
 * (Żelazo, Celtowie).
 *
 * ===========================================================================
 * ZGODNOŚĆ HISTORYCZNA — DECYZJE I UZASADNIENIA
 * (rama czasowa: III–I w. p.n.e.; źródło główne: Cezar, *De Bello Gallico* III 22)
 * ===========================================================================
 *
 * S1. KIM BYLI — Cezar opisuje u Akwitanów instytucję *soldurii*: towarzyszy
 *     związanych z wodzem przysięgą (*devotio*), dzielących z nim wszystkie
 *     dobra za życia i zobowiązanych umrzeć razem z nim; Cezar zaznacza, że w
 *     ludzkiej pamięci nikt nie odmówił spełnienia tej przysięgi. To jednostka
 *     ZAMOŻNA i UPRZYWILEJOWANA — dzieliła majątek pana — więc jej wyposażenie
 *     ma czytać się jako bogate, nie jako uzbrojenie pospolitego wojownika.
 *
 * S2. DLACZEGO WŁASNA GEOMETRIA, A NIE `buildCeltWarrior()`. Dispatch tematu
 *     dopuszczał obie ścieżki. Wybrano własną funkcję, bo (a) decyzja
 *     właściciela dla całej serii wymaga modelu BESPOKE, jawnie rozpoznawanego
 *     po nazwie, a nie współdzielonego, (b) `buildCeltWarrior()` obsługuje nadal
 *     „Wojownika celtyckiego" — gdyby Soldurii go modyfikowali, zmieniliby przy
 *     okazji tamtą jednostkę, czego kryterium „zero regresji" zabrania.
 *     `buildCeltWarrior()` zostaje więc NIETKNIĘTY.
 *
 * S3. KOLCZUGA (*lorica hamata*) — najmocniejszy znacznik elity i zarazem
 *     najlepiej uzasadniony historycznie. Kolczuga jest wynalazkiem CELTYCKIM
 *     (najstarsze znaleziska z III w. p.n.e., m.in. Ciumeşti w Rumunii);
 *     Rzymianie przejęli ją od Galów. Była droga i dostępna wyłącznie warstwie
 *     zamożnej — dokładnie takiej, jaką opisuje S1. Modelowana jako stalowa
 *     nakładka na korpus, szersza od tuniki, z krótkim rękawem.
 *
 * S4. HEŁM TYPU MONTEFORTINO — brązowy dzwon z guzem na szczycie i karczkiem
 *     (osłoną karku) z tyłu. Typ czysto celtycki (III–I w. p.n.e.), również
 *     przejęty potem przez armię rzymską. Hełm jest DRUGIM nośnikiem różnicy
 *     wobec Gaesatae, którzy z definicji walczą z gołą głową (K6 wyżej).
 *
 * S5. DŁUGI ŻELAZNY MIECZ SIECZNY — la Tène, ostrze ok. 0.75–0.90 m, noszony
 *     do cięcia z góry, nie do pchnięcia. Zgodne z `units.json`
 *     („Typ": „Swordsman", „Atak dystansowy": 0). Uniesiony w prawej dłoni,
 *     czubek na y≈0.66.
 *
 * S6. BRĄZOWY TORC — oznaka statusu wolnego, zamożnego wojownika. Świadomie
 *     BRĄZOWY, nie złoty: złoto zarezerwowano dla Gaesatae (K3), gdzie jest
 *     poświadczone wprost przez Polibiusza. Dzięki temu dwie jednostki tej
 *     samej kultury różnią się także metalem ozdób.
 *
 * S7. TARCZA OWALNA Z LICEM W BARWIE WŁAŚCICIELA — przeciwieństwo ubogiej
 *     tarczy Gaesatae (K7). Gwardia wodza nosi tarczę malowaną/zdobioną, więc
 *     to ona jest głównym nośnikiem barwy gracza na tokenie.
 *
 * S8. SPODNIE I BUTY — Celtowie nosili *bracae* (spodnie) i skórzane obuwie;
 *     to rzymscy autorzy uznawali je za cechę „barbarzyńską". Kontrast z bosymi
 *     stopami i nagimi nogami Gaesatae jest zamierzony i źródłowy.
 */
function buildSoldurii(ownerColor_: number): THREE.Group {
  const { group, mats, headTopY, armLMesh } = buildBaseAvatar(COLOR_SKIN, COLOR_FOREST, ownerColor_);
  armLMesh.name = 'soldurii-arm-left';
  const mat = makeMatFactory(mats);
  const perGeo: THREE.BufferGeometry[] = [];
  const mIron  = mat(COLOR_STEEL,   0.55, 0.40);
  const mMail  = mat(0x8d97a3,      0.62, 0.55);   // kolczuga — matowa stal (S3)
  const mWood  = mat(COLOR_WOOD,    0.05, 0.85);
  const mBronz = mat(COLOR_BRONZE,  0.45, 0.42);   // torc + hełm (S4, S6)
  const mOwner = mat(ownerColor_,   0.12, 0.66);
  const mHair  = mat(0xb8702a,      0.04, 0.86);
  const mPlank = mat(0x6e4a26,      0.05, 0.85);
  const mLeath = mat(COLOR_LEATHER, 0.06, 0.82);

  // S8: tunic hem + belt over trousers.
  addTunicHem(group, mat(COLOR_FOREST, 0.05, 0.86));
  addBelt(group, mLeath);

  // S3: KOLCZUGA — a mail shirt over the torso, wider than the tunic, with
  // short sleeves capping the top of both arms.
  const gMail = new THREE.BoxGeometry(AV_TORSO_W * 1.10, AV_TORSO_H * 0.80, AV_TORSO_D * 1.14);
  perGeo.push(gMail);
  const mMailBody = new THREE.Mesh(gMail, mMail);
  mMailBody.position.set(0, AV_Y_TORSO_BOT + AV_TORSO_H * 0.56, 0);
  mMailBody.name = 'soldurii-mail';
  group.add(mMailBody);
  const gSleeve = new THREE.BoxGeometry(AV_ARM_W * 1.14, AV_ARM_H * 0.34, AV_ARM_W * 1.14);
  perGeo.push(gSleeve);
  for (const sx of [-AV_ARM_OFFSET_X, AV_ARM_OFFSET_X]) {
    const mSleeve = new THREE.Mesh(gSleeve, mMail);
    mSleeve.position.set(sx, AV_Y_ARM_CTR + AV_ARM_H * 0.30, 0);
    mSleeve.name = 'soldurii-mail-sleeve';
    group.add(mSleeve);
  }

  // S6: bronze torc at the throat.
  addTorc(group, mBronz, perGeo);

  // S4: HEŁM MONTEFORTINO — bronze dome + rear neck guard + top knob.
  const gDome = new THREE.SphereGeometry(AV_HEAD_S * 0.58, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5);
  perGeo.push(gDome);
  const mDome = new THREE.Mesh(gDome, mBronz);
  // Rim at +0.020 (NOT +0.012): przy +0.012 dolna krawędź czaszy wypadała na
  // y=0.527, a oczy sięgają y=0.5325 — hełm ścinał wtedy górę oczu.
  mDome.position.set(0, AV_Y_HEAD_CTR + 0.020 * HEX_R, 0);
  mDome.name = 'soldurii-helmet';
  group.add(mDome);
  const gNeck = new THREE.BoxGeometry(AV_HEAD_S * 0.86, 0.030 * HEX_R, 0.026 * HEX_R);
  perGeo.push(gNeck);
  const mNeckGuard = new THREE.Mesh(gNeck, mBronz);
  mNeckGuard.rotation.x = -0.45;
  mNeckGuard.position.set(0, AV_Y_HEAD_CTR + 0.004 * HEX_R, -AV_HEAD_S * 0.52);
  mNeckGuard.name = 'soldurii-helmet-neckguard';
  group.add(mNeckGuard);
  const gKnob = new THREE.BoxGeometry(0.024 * HEX_R, 0.026 * HEX_R, 0.024 * HEX_R);
  perGeo.push(gKnob);
  const mKnob = new THREE.Mesh(gKnob, mBronz);
  mKnob.position.set(0, AV_Y_HEAD_CTR + 0.020 * HEX_R + AV_HEAD_S * 0.58, 0);
  mKnob.name = 'soldurii-helmet-knob';
  group.add(mKnob);
  // Mustache stays visible under the helmet rim; NO long hair (helmet covers it).
  addMustache(group, mHair, perGeo);

  // S5: long iron slashing sword, raised right hand.
  addLongSwordRight(group, mIron, mWood, perGeo, 0.32, 'soldurii');
  // S7: tall oval shield, owner-colour face + wooden spine + iron boss.
  addTallOvalShield(group, mOwner, mPlank, mIron, perGeo, 1.85, 'soldurii');

  addBoots(group, mLeath);                        // S8
  addHands(group, mat(COLOR_SKIN, 0.05, 0.80));
  // Punkty odniesienia WYPROWADZONE Z MODELU (nie wpisane liczbowo) — test
  // regresji mierzy nimi relacje geometryczne, więc nie rozjadą się przy
  // zmianie proporcji awatara.
  group.userData['anchors'] = {
    headTopY,
    eyeTopY: AV_Y_HEAD_CTR + 0.010 * HEX_R + getGeoAvEye().parameters.height * 0.5,
    legTopY: AV_Y_LEG_TOP,
    legBotY: AV_Y_LEG_BOT,
  };
  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = perGeo;
  return group;
}

// --- GERMANS ---------------------------------------------------------------

/**
 * Wojownik germański — framea (short throwing spear) + round/hexagonal wooden
 * hide shield, fur cloak over a bare/blond torso, simple cap (no metal helm).
 */
function buildGermanWarrior(ownerColor_: number): THREE.Group {
  const { group, mats } = buildBaseAvatar(COLOR_SKIN, COLOR_FUR, ownerColor_);
  const mat = makeMatFactory(mats);
  const perGeo: THREE.BufferGeometry[] = [];
  const mFur   = mat(COLOR_FUR,     0.04, 0.92);
  const mWood  = mat(COLOR_WOOD,    0.05, 0.85);
  const mSteel = mat(COLOR_STEEL,   0.50, 0.42);
  const mHide  = mat(0x7a5a34,      0.05, 0.86);
  const mOwner = mat(ownerColor_,   0.12, 0.66);
  const mHair  = mat(0xd8b25a,      0.04, 0.86);   // blond
  const mLeath = mat(COLOR_LEATHER, 0.06, 0.82);

  // Fur cloak across the shoulders/back.
  const mCloak = new THREE.Mesh(getGeoCloak(), mFur);
  mCloak.scale.set(0.95, 0.85, 1.0);
  mCloak.position.set(0, AV_Y_TORSO_CTR - 0.01 * HEX_R, -AV_TORSO_D * 0.5 - 0.010 * HEX_R);
  mCloak.rotation.x = 0.12;
  group.add(mCloak);
  // Fur shoulder mantle (front).
  const gMantle = new THREE.BoxGeometry(0.22 * HEX_R, 0.06 * HEX_R, 0.14 * HEX_R);
  perGeo.push(gMantle);
  const mMantle = new THREE.Mesh(gMantle, mFur);
  mMantle.position.set(0, AV_Y_TORSO_TOP - 0.02 * HEX_R, 0);
  group.add(mMantle);
  addBelt(group, mLeath);

  // Bare blond head with long hair + mustache (no metal helmet).
  addLongHair(group, mHair, perGeo);
  addMustache(group, mHair, perGeo);

  // Framea: a SHORT thrusting/throwing spear in the right hand.
  addSpearRight(group, mWood, mSteel, perGeo, 0.40);

  // Round/hexagonal wooden-hide shield on the left arm + iron boss + spokes.
  const SH_X = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.016 * HEX_R);
  const mShield = new THREE.Mesh(getGeoOvalShield(), mHide);
  mShield.rotation.z = Math.PI / 2;
  mShield.scale.set(1.0, 1.35, 1.35);    // big round board
  mShield.position.set(SH_X, AV_Y_TORSO_CTR, 0.012 * HEX_R);
  group.add(mShield);
  const mShRim = new THREE.Mesh(getGeoOvalShield(), mOwner);
  mShRim.rotation.z = Math.PI / 2;
  mShRim.scale.set(0.9, 1.45, 1.45);
  mShRim.position.set(SH_X - 0.006 * HEX_R, AV_Y_TORSO_CTR, 0.012 * HEX_R);
  group.add(mShRim);
  const mBoss = new THREE.Mesh(getGeoShieldBoss(), mSteel);
  mBoss.rotation.z = Math.PI / 2;
  mBoss.position.set(SH_X + 0.014 * HEX_R, AV_Y_TORSO_CTR, 0.012 * HEX_R);
  group.add(mBoss);

  addBoots(group, mLeath);
  addHands(group, mat(COLOR_SKIN, 0.05, 0.80));
  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = perGeo;
  return group;
}

/**
 * Berserker germański — bare-chested frenzied warrior wearing an animal pelt
 * (wolf/bear head as a hood), an axe, NO shield, blond hair.
 */
function buildBerserker(ownerColor_: number): THREE.Group {
  const { group, mats } = buildBaseAvatar(COLOR_SKIN, COLOR_SKIN, ownerColor_);  // bare chest = skin torso
  const mat = makeMatFactory(mats);
  const perGeo: THREE.BufferGeometry[] = [];
  const mPelt  = mat(0x5a4630,      0.04, 0.94);   // dark brown animal pelt
  const mPeltL = mat(0x7a6446,      0.04, 0.92);
  const mWood  = mat(COLOR_WOOD,    0.05, 0.85);
  const mIron  = mat(COLOR_STEEL,   0.55, 0.40);
  const mOwner = mat(ownerColor_,   0.12, 0.66);
  const mHair  = mat(0xd8b25a,      0.04, 0.86);
  const mLeath = mat(COLOR_LEATHER, 0.06, 0.82);

  // Animal pelt cloak down the back.
  const mCloak = new THREE.Mesh(getGeoCloak(), mPelt);
  mCloak.scale.set(1.0, 1.05, 1.0);
  mCloak.position.set(0, AV_Y_TORSO_CTR - 0.02 * HEX_R, -AV_TORSO_D * 0.5 - 0.012 * HEX_R);
  mCloak.rotation.x = 0.16;
  group.add(mCloak);
  // Small loincloth (otherwise bare-chested).
  const mLoin = new THREE.Mesh(getGeoLoincloth(), mLeath);
  mLoin.scale.set(0.85, 0.6, 0.95);
  mLoin.position.set(0, AV_Y_TORSO_BOT - 0.01 * HEX_R, 0);
  group.add(mLoin);
  addLongHair(group, mHair, perGeo);

  // WOLF/BEAR head worn as a hood over the warrior's head: a pelt hood block +
  // a snout poking forward + two ears.
  const mHood = new THREE.Mesh(getGeoHood(), mPelt);
  mHood.scale.set(1.05, 1.1, 1.15);
  mHood.position.set(0, AV_Y_HEAD_CTR + 0.020 * HEX_R, -0.004 * HEX_R);
  group.add(mHood);
  const gSnout = new THREE.BoxGeometry(0.060 * HEX_R, 0.050 * HEX_R, 0.075 * HEX_R);
  perGeo.push(gSnout);
  const mSnout = new THREE.Mesh(gSnout, mPeltL);
  mSnout.position.set(0, AV_Y_HEAD_TOP + 0.020 * HEX_R, AV_HEAD_S * 0.5 + 0.010 * HEX_R);
  group.add(mSnout);
  for (const sx of [-1, 1]) {
    const gEar = new THREE.BoxGeometry(0.028 * HEX_R, 0.045 * HEX_R, 0.022 * HEX_R);
    perGeo.push(gEar);
    const mEar = new THREE.Mesh(gEar, mPeltL);
    mEar.position.set(sx * 0.055 * HEX_R, AV_Y_HEAD_TOP + 0.075 * HEX_R, -0.01 * HEX_R);
    group.add(mEar);
  }

  // Big single-bladed axe raised in the right hand (handle + iron head).
  const AX_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.016 * HEX_R;
  const gHandle = new THREE.BoxGeometry(0.018 * HEX_R, 0.30 * HEX_R, 0.018 * HEX_R);
  perGeo.push(gHandle);
  const mHandle = new THREE.Mesh(gHandle, mWood);
  mHandle.position.set(AX_X, AV_Y_TORSO_CTR + 0.10 * HEX_R, 0.02 * HEX_R);
  group.add(mHandle);
  const gHead = new THREE.BoxGeometry(0.10 * HEX_R, 0.085 * HEX_R, 0.020 * HEX_R);
  perGeo.push(gHead);
  const mHead = new THREE.Mesh(gHead, mIron);
  mHead.position.set(AX_X + 0.04 * HEX_R, AV_Y_TORSO_CTR + 0.22 * HEX_R, 0.02 * HEX_R);
  group.add(mHead);

  addBoots(group, mLeath);
  addHands(group, mat(COLOR_SKIN, 0.05, 0.80));
  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = perGeo;
  return group;
}

// --- BRONZE SPECIALS -------------------------------------------------------

/**
 * Wojownik mykeński — figure-8 / tower body shield, boar's-tusk helmet (rows of
 * pale tusk plates), a long bronze spear, bronze scale corslet.
 */
function buildMycenaeanWarrior(ownerColor_: number): THREE.Group {
  // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p4-melee.ts).
  return newBuildMycenaeanWarrior(ownerColor_);
}

/**
 * Wojownik Sherden (Sea Peoples) — HORNED helmet (disc + two horns), round
 * shield, straight bronze sword, bronze cuirass.
 */
function buildSherden(ownerColor_: number): THREE.Group {
  // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p4-melee.ts).
  return newBuildSherden(ownerColor_);
}


// --- RZYM: LUDY MORZA -------------------------------------------------------

/**
 * Wojownik tyrreński (Ludy Morza — Tursza/Teresz, przodkowie Etrusków).
 * Okrągła brązowa tarcza, oszczep w prawej ręce, miecz u biodra,
 * CZUBATY helm z grzebieniem (pióropusz przód–tył), brązowy napierśnik,
 * tunika w kolorze właściciela na grzebieniu/tarczy.
 */
function buildTyrrhenian(ownerColor_: number): THREE.Group {
  // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p4-melee.ts).
  return newBuildTyrrhenian(ownerColor_);
}

/**
 * Wojownik szekelesz (Ludy Morza — Szekelesz, pd. Italia).
 * OKRĄGŁA tarcza, długa WŁÓCZNIA, helm z OPASKĄ/frędzlami (wyraźnie inny
 * niż rogatczykarze Sherden — opaska + pionowe frędzie po bokach),
 * brązowe naramienniki, tunika lniana.
 */
function buildShekelesh(ownerColor_: number): THREE.Group {
  // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p4-melee.ts).
  return newBuildShekelesh(ownerColor_);
}

/**
 * Halabardnik Shang — dagger-axe (ge) on a long pole (a sideways blade near the
 * top), lacquer-red lamellar coat, a Chinese conical/round helm.
 */
function buildShangHalberdier(ownerColor_: number): THREE.Group {
  // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p4-melee.ts).
  return newBuildShangHalberdier(ownerColor_);
}

/**
 * Łucznik akadyjski — composite (recurve) bow, conical helmet, long robe; a
 * quiver of arrows on the back.  Distinct from the green generic archer via a
 * pale linen robe + bronze conical helm.
 */
function buildAkkadianArcher(ownerColor_: number): THREE.Group {
  // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p3-dystans.ts).
  return newBuildAkkadianArcher(ownerColor_);
}

// ===========================================================================
// MACHINY OBLĘŻNICZE — NAME-KEYED bespoke siege machine models
// Wszystkie "frontem" +Z (jak reszta jednostek).
// Brak awatara humanoidalnego – bryły Box/Cylinder/Cone tworzą pojazd oblężniczy.
// Kolory właściciela (ownerColor_) na dekoracjach tarczowych/banderach.
// ===========================================================================

/**
 * Taran (Battering Ram) — niska drewniana rama na 4 kołach z dwuspadowym
 * daszkiem osłonowym i zwieszoną belką-taranem.  Front +Z.
 */
function buildBatteringRam(ownerColor_: number): THREE.Group {
  // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p57-wlocznie-machiny.ts).
  return buildBatteringRamOpus5(ownerColor_);
}

/**
 * Katapulta (Catapult) — jednoramienna MACHINA SKRĘTOWA (onager), gotowa do
 * strzału: ramię napięte kołowrotem ku tyłowi, kamień w zwisającej procy,
 * zaczep spustu założony.  Front +Z (jak reszta jednostek).
 *
 * ===========================================================================
 * ZGODNOŚĆ HISTORYCZNA — DECYZJE I UZASADNIENIA
 * (rama czasowa: IV w. p.n.e. – IV w. n.e.; źródła główne: Witruwiusz,
 *  *De architectura* X.10–X.11; Ammianus Marcellinus, *Res gestae* XXIII.4.4–7)
 * ===========================================================================
 *
 * K1. TYP MACHINY USTALONY Z DANYCH GRY, NIE Z UPODOBANIA. `units.json` mówi
 *     o Katapulcie: „burzy mur/bramę zza linii (**lob nad murem**)", „Atak
 *     dystansowy": 8, „Zasięg ataku (hex)": 6. Animacja pocisku w silniku
 *     (`battle/battleScene.ts` — „Animacja pocisku kamiennego katapulty: sfera
 *     szara lecąca **parabolą**") potwierdza to niezależnie: pocisk to KULISTY
 *     KAMIEŃ lecący torem stromym. Dwuramienny miotacz kamieni (gr. λιθοβόλος,
 *     rzym. *ballista*) strzela torem PŁASKIM — kruszy mur wprost, nie przerzuca
 *     nad nim. Jedyna machina starożytna, która lobuje kamień nad murem, to
 *     JEDNORAMIENNA machina skrętowa — *onager*. Stąd cała geometria niżej.
 *     Model NIE jest balistą i celowo nie ma dwóch ramion ani łoża na bełt.
 *
 * K2. CHRONOLOGIA — MÓWIONA WPROST, NIE ZAMIATANA. Onager jest machiną PÓŹNĄ:
 *     pierwszy pełny opis daje dopiero Ammianus Marcellinus w 2. poł. IV w. n.e.
 *     (używa go m.in. przy oblężeniu Amidy, 359 r.), a samo słowo *onager*
 *     nazywa on nowinką językową swoich czasów (XXIII.4.7). Wcześniejszą część
 *     epoki Żelaza obsługiwał DWURAMIENNY miotacz kamieni, znany od armii
 *     Filipa II i Aleksandra (IV w. p.n.e.). Onager mieści się więc w oknie
 *     „Żelazo (~500 p.n.e. – 500 n.e.)", ale przy jego PÓŹNYM krańcu, nie
 *     w środku. Wybrano go mimo to, bo K1 nie zostawia wyboru: dane jednostki
 *     wymagają lobu nad murem. Zapisane jawnie, żeby nikt później nie czytał
 *     tego modelu jako „typowej machiny V w. p.n.e.".
 *
 * K3. NAZWA „KATAPULTA" NIE WYMUSZA MIOTACZA BEŁTÓW. U Witruwiusza (I w. p.n.e.)
 *     *catapulta* / *scorpio* to machina STRZAŁOWA (X.10), a *ballista* to
 *     KAMIENNA (X.11) — czyli odwrotnie niż w polszczyźnie potocznej. W późnym
 *     antyku nazewnictwo się rozjeżdża i mianem *ballista* obejmuje się machiny
 *     bełtowe. Polska „Katapulta" jest terminem POTOCZNYM, dziś oznaczającym
 *     właśnie machinę jednoramienną — i tak jest tu odwzorowana.
 *
 * K4. KANON PROPORCJI — JEDEN MODUŁ. Artyleria antyczna była wymiarowana
 *     z jednej miary. Witruwiusz X.10.1: proporcje machin strzałowych liczy się
 *     z długości strzały, a otwór w kapitelu, przez który przechodzą skręcone
 *     ścięgna, to JEDNA DZIEWIĄTA tej długości. Dla machin kamiennych X.11.2
 *     podaje tabelę: kamień 2-funtowy → otwór 5 palców, 10-funtowy → 8 palców,
 *     100-funtowy → stopa i 1½ palca, aż po 360-funtowy → stopa i 10 palców.
 *     Model idzie za ZASADĄ, nie za liczbami: `MOD` niżej jest jedynym modułem,
 *     a średnica skrętu, grubość ramienia, półszerokość podłużnic ramy i kamień
 *     są jego wielokrotnościami (poprawka Final Control: pozostałe belki —
 *     wysokość podłużnic, obie poprzeczki, słupy skrętu i zderzaka — liczą się
 *     z `U`, nie z `MOD`; „przekrój belek" w liczbie mnogiej było przesadzone).
 *     Same wielokrotności dobrano pod budżet tokena (HEX_R = 1.0), nie
 *     przepisano z Witruwiusza — i tak to tu jest napisane.
 *
 * K5. RAMA I SKRĘT — Ammianus XXIII.4.4: dwie belki z dębu albo ostrolistu,
 *     lekko wygięte, spięte „jak w pile ramowej", z dużymi otworami po bokach;
 *     między nimi, przez te otwory, przeciągnięte MOCNE LINY, które trzymają
 *     konstrukcję. Stąd `kt-frame-beam-left/right` (dwie podłużnice) i
 *     `kt-skein-bundle` — poziomy pęk liny skrętnej przechodzący POPRZECZNIE
 *     przez oba stojaki, nie ozdobny sznurek. `kt-skein-washer-*` i
 *     `kt-skein-lever-*` to żelazne tarcze i drążki, którymi skręt napinano.
 *
 * K6. RAMIĘ I PROCA — Ammianus XXIII.4.4–5: z tych lin wyrasta drewniany
 *     trzon „UKOŚNIE, jak dyszel wozu", umocowany sznurami tak, by dało się go
 *     podnosić i opuszczać; „na jego szczycie umocowane są ŻELAZNE HAKI,
 *     z których zwisa PROCA, ze sznura albo z żelaza". Dwa wnioski wprost
 *     przeciwne staremu modelowi: (a) ramię jest UKOŚNE, nie pionowe;
 *     (b) pocisk leży w ZWISAJĄCEJ PROCY zawieszonej na haku, a nie w sztywnym
 *     kubełku przyklejonym do ramienia. Stąd `kt-arm-hook`, `kt-sling-cord-*`
 *     i `kt-sling-pouch`.
 *
 * K7. PODUSZKA UDERZENIOWA — Ammianus XXIII.4.5: pod trzonem leży „wielki wór
 *     wypełniony strzępami", mocno przewiązany; XXIII.4.6: zwolniony trzon,
 *     „trafiwszy na miękkie włosie, miota kamień". Zderzak jest więc WYPCHANYM
 *     WOREM, nie gołą belką — `kt-stop-pad` + `kt-stop-strap-*`. Ammianus każe
 *     mu spoczywać na usypanej darni albo stosie cegieł; tu machina stoi na
 *     kołach, więc wór siedzi na belce poprzecznej (`kt-stop-beam`) wspartej
 *     na dwóch słupach. To ŚWIADOMA REKONSTRUKCJA wymuszona podwoziem, nie
 *     twierdzenie źródła — dlatego jest tu nazwana po imieniu.
 *
 * K8. POZA SPOCZYNKOWA = NAPIĘTA I ZAŁADOWANA. Ammianus XXIII.4.6: „kładzie
 *     się okrągły kamień w procę, a czterej młodzieńcy z każdej strony
 *     odkręcają drąg, którym połączone są liny, i zginają trzon niemal płasko.
 *     Wtedy dopiero celowniczy, stojąc powyżej, mocnym młotem wybija sworzeń
 *     trzymający całą konstrukcję". Model pokazuje dokładnie ten stan: ramię
 *     ściągnięte KU TYŁOWI (−Z) pod kątem `ARM_DEG` nad poziom, lina kołowrotu
 *     napięta między bębnem a UCHEM na ramieniu (poprawka Final Control: nie
 *     hakiem — hak jest na szczycie ramienia i trzyma procę, ucho leży niżej,
 *     `WINCH_T` od osi), sworzeń trzymający tarczę kołowrotu założony (nie
 *     „zapadka na zębatce" — model nie ma zapadki, patrz uzasadnienie przy
 *     `kt-windlass-ratchet` niżej), kamień w procy leżący na tylnej poprzeczce.
 *     Kąt jest KOMPROMISEM czytelności: pełne napięcie to „niemal płasko", co przy skali tokena
 *     znika z sylwetki — zapisane jako świadome odstępstwo, nie jako źródło.
 *     Wszystkie części ruchome mają sensowną geometrię spoczynkową: ramię
 *     dotyka skrętu, proca zwisa pionowo pod hakiem, lina łączy dwa istniejące
 *     punkty, a swobodny tor ramienia kończy się NA poduszce (sprawdzone
 *     liczbowo: `dist(pivot, kt-stop-pad) < ARM_LEN`).
 *
 * K9. NEUTRALNOŚĆ KULTUROWA. `units.json`: „Kultura": null, „Nacja": "" —
 *     machina jest wspólna dla wszystkich cywilizacji. Model nie niesie ANI
 *     JEDNEGO znacznika kulturowego: brak grzebienia, godła, zwierzęcych głów,
 *     ornamentu i barwy narodowej. Materiały to drewno, ciemne drewno, żelazo,
 *     lina, kamień. Jedyny akcent barwny to kolor WŁAŚCICIELA (gracza), nałożony
 *     SYMETRYCZNIE na obie burty i oba końce belki zderzakowej — nigdy po jednej
 *     stronie, żeby token nie sugerował „strony" ani stylu.
 */
function buildCatapult(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const mats: THREE.Material[] = [];
  const mat = makeMatFactory(mats);
  const perGeo: THREE.BufferGeometry[] = [];

  const mWood    = mat(COLOR_WOOD,       0.06, 0.82);
  const mDkWood  = mat(0x4a3018,         0.04, 0.88);
  const mIron    = mat(COLOR_STEEL,      0.55, 0.40);
  const mDkIron  = mat(COLOR_DARK_STEEL, 0.45, 0.55);
  const mRope    = mat(0x9a8060,         0.04, 0.90);
  const mSack    = mat(0xbdae8c,         0.03, 0.94);
  const mStone   = mat(0x707878,         0.08, 0.85);
  const mOwner   = mat(ownerColor_,      0.12, 0.70);

  /** Dodaje NAZWANY mesh. Nazwa jest warunkiem mierzalności modelu przez
   *  test regresji — przed T11 ta funkcja nazywała 0 z 11 brył. */
  const add = (name: string, geo: THREE.BufferGeometry, m: THREE.Material,
               x: number, y: number, z: number,
               rx = 0, ry = 0, rz = 0): THREE.Mesh => {
    perGeo.push(geo);
    const mesh = new THREE.Mesh(geo, m);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    group.add(mesh);
    return mesh;
  };

  /**
   * Element rozpięty MIĘDZY DWOMA PUNKTAMI: długość, środek i zwrot liczone
   * z końców, nie wpisywane z ręki. To jest strukturalna odpowiedź na defekt
   * starego modelu, w którym „liny" miały wpisaną długość i kąt i nie sięgały
   * ani osi, ani skrzyni.
   */
  const span = (name: string, m: THREE.Material, r: number,
                a: [number, number, number], b: [number, number, number]): THREE.Mesh => {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const len = Math.hypot(dx, dy, dz);
    const geo = new THREE.CylinderGeometry(r, r, len, 6, 1);
    perGeo.push(geo);
    const mesh = new THREE.Mesh(geo, m);
    mesh.name = name;
    mesh.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len));
    group.add(mesh);
    return mesh;
  };

  // === SKALA TOKENA ========================================================
  // Wszystkie wymiary niżej są wielokrotnościami U, nie HEX_R. U = 1.06 × HEX_R
  // i ten współczynnik jest WYNIKIEM POMIARU, nie gustem: sylwetka machiny
  // rzutowana z kamery gry (azymut 0, elewacja 52°) miała przy U = HEX_R
  // 17 480 pikseli (poprawka Final Control: 17 315 było przejęzyczeniem,
  // przeliczone niezależnie na żywym renderze) przy 215 px wysokości, podczas
  // gdy rodzina oblężnicza mierzona w TYM SAMYM renderze ma 20 396–21 841 px
  // i 217–257 px (Wieża oblężnicza, Taran, Taran okuty). Katapulta czytała się
  // jako mniejsza od własnej rodziny, bliżej piechoty (Hastati 15 952). Pole
  // rzutu rośnie z kwadratem skali, więc 1.06 wprowadza ją w dolny kraniec
  // pasma rodziny BEZ przekroczenia promienia heksa (maxR 0.310 → 0.328;
  // rodzina: Taran okuty 0.331, Taran — max rodziny — 0.340; poprawka Final
  // Control: „Taran okuty 0.372" było błędne, przeliczone niezależnie).
  const U = 1.06 * HEX_R;

  // === MODUŁ (K4) ===========================================================
  // Jedyna miara, z której wyprowadzone są PRZEKROJE części pracujących.
  // Odpowiednik witruwiańskiej średnicy otworu w kapitelu; tu = średnica pęku
  // liny skrętnej. Wielokrotności niżej są DOSŁOWNE, nie deklaratywne —
  // średnica skrętu, oba przekroje ramienia, promień kamienia i przekrój
  // podłużnicy liczą się z MOD, a nie z U.
  const MOD = 0.068 * U;
  const ARM_R_ROOT = MOD * 0.382;   // komel ramienia przy skręcie
  const ARM_R_TIP  = MOD * 0.235;   // szczyt ramienia, pod hakiem procy
  const STONE_R    = MOD * 0.618;   // pocisk kulisty (units.json: „sfera szara")

  // === PODWOZIE: OŚ I KOŁA ==================================================
  // Koło o promieniu WHEEL_R stojące na y=0 daje oś na wysokości WHEEL_R —
  // z tego (a nie odwrotnie) wynika spód ramy: rama siada NA osi.
  const WHEEL_R  = 0.067 * U;
  const AXLE_R   = 0.017 * U;
  const AXLE_Y   = WHEEL_R;
  const AXLE_Z   = -0.060 * U;
  const FRAME_BOT = AXLE_Y + AXLE_R;              // 0.084 U — spód podłużnic
  const FRAME_H   = 0.048 * U;
  const FRAME_TOP = FRAME_BOT + FRAME_H;          // 0.132 U — pokład ramy
  const FRAME_X   = 0.112 * U;                // oś podłużnicy
  const FRAME_HW  = MOD * 0.382;              // półszerokość podłużnicy
  const FRAME_Z0  = -0.276 * U;
  const FRAME_Z1  =  0.250 * U;
  const WHEEL_X   = FRAME_X + FRAME_HW + 0.017 * U;  // 0.155 — koło OBOK ramy

  const gAxle = new THREE.CylinderGeometry(AXLE_R, AXLE_R, 0.350 * U, 10, 1);
  add('kt-axle', gAxle, mDkIron, 0, AXLE_Y, AXLE_Z, 0, 0, Math.PI / 2);

  for (const s of [-1, 1]) {
    const side = s < 0 ? 'left' : 'right';
    // tarcza koła (pełna, klepkowa) — oś przechodzi przez piastę na wylot.
    // Promień MNIEJSZY od obręczy: powierzchnią styku z ziemią jest bandaż.
    const gRim = new THREE.CylinderGeometry(WHEEL_R - 0.004 * U, WHEEL_R - 0.004 * U, 0.030 * U, 16, 1);
    add('kt-wheel-' + side, gRim, mWood, s * WHEEL_X, AXLE_Y, AXLE_Z, 0, 0, Math.PI / 2);
    // Żelazny bandaż na obwodzie — TO ON stoi na ziemi. Liczba segmentów
    // podzielna przez 4 daje wierzchołek dokładnie w najniższym punkcie, więc
    // spód koła wypada na y=0 co do zera (poprawka Final Control: wielokąt
    // wpisany w okrąg nie może wystawać POZA okrąg, więc przy niewłaściwej
    // liczbie segmentów koło wisiałoby ok. 0.002 NAD terenem — widoczna
    // szczelina — a nie zapadało się POD teren; to odwrotny kierunek niż
    // klasa błędu „stopy pod terenem" z T7/T8, tu w wydaniu kołowym).
    const gTyre = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.032 * U, 16, 1);
    add('kt-wheel-tyre-' + side, gTyre, mDkIron, s * WHEEL_X, AXLE_Y, AXLE_Z, 0, 0, Math.PI / 2);
    // piasta — przesunięta NA ZEWNĄTRZ, żeby nie wchodziła w podłużnicę
    const gHub = new THREE.CylinderGeometry(0.024 * U, 0.024 * U, 0.030 * U, 10, 1);
    add('kt-wheel-hub-' + side, gHub, mDkWood, s * (WHEEL_X + 0.002 * U), AXLE_Y, AXLE_Z, 0, 0, Math.PI / 2);
  }

  // === RAMA (K5): dwie podłużnice + poprzeczki ==============================
  const FRAME_LEN = FRAME_Z1 - FRAME_Z0;
  const FRAME_CZ  = (FRAME_Z0 + FRAME_Z1) / 2;
  for (const s of [-1, 1]) {
    const gBeam = new THREE.BoxGeometry(FRAME_HW * 2, FRAME_H, FRAME_LEN);
    add('kt-frame-beam-' + (s < 0 ? 'left' : 'right'), gBeam, mWood,
        s * FRAME_X, FRAME_BOT + FRAME_H / 2, FRAME_CZ);
  }
  const CROSS_W = (FRAME_X + FRAME_HW) * 2;       // poprzeczka spina obie burty
  // Tylna poprzeczka = ŁOŻE, na którym leży proca z kamieniem (K8).
  const BED_Z = -0.182 * U;
  const gCrossRear = new THREE.BoxGeometry(CROSS_W, FRAME_H, 0.090 * U);
  add('kt-frame-cross-rear', gCrossRear, mWood, 0, FRAME_BOT + FRAME_H / 2, BED_Z);
  // Poprzeczka pod skrętem — przejmuje odrzut pęku liny.
  const PIVOT_Z = 0.110 * U;
  const gCrossSkein = new THREE.BoxGeometry(CROSS_W, FRAME_H, 0.060 * U);
  add('kt-frame-cross-skein', gCrossSkein, mWood, 0, FRAME_BOT + FRAME_H / 2, PIVOT_Z);
  // Przednia stopa OPARTA O ZIEMIĘ: dwa koła to linia podparcia, nie płaszczyzna —
  // bez tego machina z ramieniem i kamieniem wywracałaby się na nos.
  const SILL_Z = 0.222 * U;
  const gSill = new THREE.BoxGeometry(0.250 * U, FRAME_BOT, 0.050 * U);
  add('kt-frame-sill-front', gSill, mDkWood, 0, FRAME_BOT / 2, SILL_Z);

  // === GŁOWICA SKRĘTU (K5) ==================================================
  const POST_HW    = 0.024 * U;
  const POST_HD    = 0.034 * U;
  const POST_TOP   = 0.360 * U;
  const PIVOT_Y    = 0.312 * U;               // oś obrotu ramienia = środek skrętu
  const SKEIN_R    = MOD / 2;
  const POST_X     = 0.106 * U;
  for (const s of [-1, 1]) {
    const gPost = new THREE.BoxGeometry(POST_HW * 2, POST_TOP - FRAME_TOP, POST_HD * 2);
    add('kt-skein-post-' + (s < 0 ? 'left' : 'right'), gPost, mDkWood,
        s * POST_X, (FRAME_TOP + POST_TOP) / 2, PIVOT_Z);
  }
  // Pęk liny skrętnej — przechodzi przez OBA stojaki na wylot (K5).
  const gSkein = new THREE.CylinderGeometry(SKEIN_R, SKEIN_R, (POST_X + POST_HW) * 2, 12, 1);
  add('kt-skein-bundle', gSkein, mRope, 0, PIVOT_Y, PIVOT_Z, 0, 0, Math.PI / 2);
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'left' : 'right';
    const gWash = new THREE.CylinderGeometry(0.036 * U, 0.036 * U, 0.014 * U, 12, 1);
    add('kt-skein-washer-' + side, gWash, mIron,
        s * (POST_X + POST_HW + 0.006 * U), PIVOT_Y, PIVOT_Z, 0, 0, Math.PI / 2);
    const gLever = new THREE.BoxGeometry(0.008 * U, 0.064 * U, 0.012 * U);
    add('kt-skein-lever-' + side, gLever, mDkIron,
        s * (POST_X + POST_HW + 0.014 * U), PIVOT_Y, PIVOT_Z, 0, 0, s * 0.5);
  }

  // === RAMIĘ MIOTAJĄCE (K6, K8) =============================================
  // ARM_DEG liczony OD POZIOMU, ku TYŁOWI (−Z): to poza NAPIĘTA (K8).
  // Kierunek osi ramienia i jego POŁOŻENIE liczone są z JEDNEGO kąta ARM_RX —
  // to jest miejsce, w którym stary model miał odwrócony znak Z i przez to
  // ramię mijało własną oś obrotu o 0.199 HEX_R.
  const ARM_DEG  = 24;
  const ARM_LEN  = 0.320 * U;
  const ARM_RX   = -(Math.PI / 2 - ARM_DEG * Math.PI / 180);
  const ARM_DY   = Math.cos(ARM_RX);              // składowa Y osi ramienia
  const ARM_DZ   = Math.sin(ARM_RX);              // składowa Z osi ramienia (ujemna = ku tyłowi)
  /** Punkt na osi ramienia w odległości t od osi obrotu. */
  const onArm = (t: number): [number, number, number] =>
    [0, PIVOT_Y + ARM_DY * t, PIVOT_Z + ARM_DZ * t];

  const gArm = new THREE.CylinderGeometry(ARM_R_TIP, ARM_R_ROOT, ARM_LEN, 8, 1);
  {
    const [ax, ay, az] = onArm(ARM_LEN / 2);
    add('kt-arm', gArm, mDkWood, ax, ay, az, ARM_RX);
  }
  // Stopka ramienia zaciśnięta W pęku liny — ramię MUSI dotykać skrętu.
  const gHeel = new THREE.CylinderGeometry(0.030 * U, 0.030 * U, 0.070 * U, 8, 1);
  {
    const [hx, hy, hz] = onArm(0.014 * U);
    add('kt-arm-heel', gHeel, mDkIron, hx, hy, hz, ARM_RX);
  }
  // Żelazny hak na szczycie ramienia — z niego ZWISA proca (K6).
  const HOOK_T = ARM_LEN - 0.010 * U;
  const [hookX, hookY, hookZ] = onArm(HOOK_T);
  const gHook = new THREE.TorusGeometry(0.017 * U, 0.006 * U, 6, 10);
  add('kt-arm-hook', gHook, mIron, hookX, hookY - 0.016 * U, hookZ, 0, Math.PI / 2, 0);
  // Ucho, w które wpięta jest lina kołowrotu (K8).
  const WINCH_T = 0.240 * U;
  const [wx, wy, wz] = onArm(WINCH_T);
  const gWEye = new THREE.TorusGeometry(0.013 * U, 0.005 * U, 6, 10);
  add('kt-arm-winch-eye', gWEye, mIron, wx, wy, wz, Math.PI / 2, 0, 0);

  // === PROCA I KAMIEŃ (K6) ==================================================
  // Proca ZWISA PIONOWO pod hakiem, a kamień w niej LEŻY na tylnej poprzeczce —
  // dwa warunki, których stary „kubeł" nie spełniał (unosił się w powietrzu).
  const POUCH_H = 0.034 * U;
  const POUCH_Y = FRAME_TOP + POUCH_H / 2;
  const gPouch = new THREE.BoxGeometry(0.090 * U, POUCH_H, 0.086 * U);
  add('kt-sling-pouch', gPouch, mRope, 0, POUCH_Y, hookZ);
  const gStone = new THREE.SphereGeometry(STONE_R, 10, 8);
  add('kt-stone', gStone, mStone, 0, POUCH_Y + POUCH_H / 2 + STONE_R - 0.020 * U, hookZ);
  // Dwa sznury procy: od haka w dół do krawędzi kieszeni — oba końce to
  // PUNKTY NA ISTNIEJĄCYCH CZĘŚCIACH, więc proca faktycznie na czymś wisi.
  const CORD_TOP_Y = hookY - 0.016 * U;
  const CORD_BOT_Y = POUCH_Y + POUCH_H / 2;
  for (const s of [-1, 1]) {
    span('kt-sling-cord-' + (s < 0 ? 'left' : 'right'), mRope, 0.005 * U,
         [0, CORD_TOP_Y, hookZ], [s * 0.040 * U, CORD_BOT_Y, hookZ]);
  }

  // === ZDERZAK Z PODUSZKĄ (K7) ==============================================
  // Wysokość dobrana tak, żeby swobodny tor ramienia KOŃCZYŁ SIĘ NA poduszce:
  // dist(oś obrotu, środek poduszki) musi być MNIEJSZA niż ARM_LEN.
  const STOP_Z    = 0.222 * U;
  const STOP_TOP  = 0.506 * U;                // góra słupów = spód belki
  const BEAM_H    = 0.050 * U;
  const PAD_H     = 0.056 * U;
  const BEAM_Y    = STOP_TOP + BEAM_H / 2;
  const PAD_Y     = STOP_TOP + BEAM_H + PAD_H / 2;
  for (const s of [-1, 1]) {
    const gSPost = new THREE.BoxGeometry(0.052 * U, STOP_TOP - FRAME_TOP, 0.050 * U);
    add('kt-stop-post-' + (s < 0 ? 'left' : 'right'), gSPost, mDkWood,
        s * FRAME_X, (FRAME_TOP + STOP_TOP) / 2, STOP_Z);
  }
  const gStopBeam = new THREE.BoxGeometry(0.260 * U, BEAM_H, 0.048 * U);
  add('kt-stop-beam', gStopBeam, mWood, 0, BEAM_Y, STOP_Z);
  const gPad = new THREE.BoxGeometry(0.176 * U, PAD_H, 0.072 * U);
  add('kt-stop-pad', gPad, mSack, 0, PAD_Y, STOP_Z);
  for (const s of [-1, 1]) {
    const gStrap = new THREE.BoxGeometry(0.010 * U, PAD_H + 0.014 * U, 0.080 * U);
    add('kt-stop-strap-' + (s < 0 ? 'left' : 'right'), gStrap, mRope,
        s * 0.070 * U, PAD_Y, STOP_Z);
  }
  // ŚCIĄGU GŁOWICY CELOWO NIE MA — usunięty po pomiarze, nie z niedbalstwa.
  // Ściąg łączący stojak skrętu ze słupem zderzaka leżał w tym samym paśmie X
  // co oba słupy (0.088–0.136), a słup zderzaka stoi PRZED nim, więc z jedynej
  // kamery gry (azymut 0) miał ZERO PIKSELI — zmierzone, tak samo jak zerowa
  // lina kołowrotu wyżej. Dwie niewidoczne bryły to martwa geometria: koszt
  // draw calla bez wkładu w obraz. Zamiast tego słupy zderzaka są GRUBSZE
  // (0.052 × 0.050 zamiast 0.048 × 0.044) i stoją na pokładzie ramy dokładnie
  // nad przednią stopą, więc nie potrzebują ściągu, żeby się trzymać.

  // === KOŁOWRÓT I SPUST (K8) ================================================
  const WIN_Z   = -0.248 * U;
  const WIN_Y   =  0.180 * U;
  const WIN_R   =  0.024 * U;
  const WIN_TOP =  WIN_Y + 0.024 * U;              // szczyt BĘBNA = odejście liny
  // Kozioł sięga WYŻEJ niż bęben, bo to w nim ma tkwić sworzeń spustu.
  // Przy koźle równym bębnowi sworzeń muskał tylko jego górną krawędź
  // (zmierzone SAT 0.0011) — czyli trzymał się na styk, nie w gnieździe.
  const BLOCK_TOP = WIN_Y + 0.046 * U;
  for (const s of [-1, 1]) {
    const gBlock = new THREE.BoxGeometry(0.048 * U, BLOCK_TOP - FRAME_TOP, 0.048 * U);
    add('kt-windlass-block-' + (s < 0 ? 'left' : 'right'), gBlock, mDkWood,
        s * POST_X, (FRAME_TOP + BLOCK_TOP) / 2, WIN_Z);
  }
  // Wał przechodzi przez OBA kozły na wylot — dopiero na jego wystającym
  // końcu może usiąść korba. Bez wału korba tkwiłaby w kozle.
  const SHAFT_X = 0.160 * U;
  const gShaft = new THREE.CylinderGeometry(0.012 * U, 0.012 * U, SHAFT_X * 2, 8, 1);
  add('kt-windlass-shaft', gShaft, mDkIron, 0, WIN_Y, WIN_Z, 0, 0, Math.PI / 2);
  const gDrum = new THREE.CylinderGeometry(WIN_R, WIN_R, 0.190 * U, 12, 1);
  add('kt-windlass-drum', gDrum, mWood, 0, WIN_Y, WIN_Z, 0, 0, Math.PI / 2);
  // SPUST. Ammianus XXIII.4.6 mówi o SWORZNIU „trzymającym umocowania całej
  // konstrukcji", który celowniczy WYBIJA MŁOTEM — nie o zapadce. Modelowany
  // dosłownie: tarcza na wale + żelazny sworzeń przechodzący przez jej wieniec
  // i wchodzący w lewy kozioł. Dopóki sworzeń tkwi, wał nie może się obrócić,
  // więc lina trzyma napięte ramię (K8).
  const RATCHET_X = -0.070 * U, RATCHET_R = 0.034 * U;
  const gRatchet = new THREE.CylinderGeometry(RATCHET_R, RATCHET_R, 0.010 * U, 12, 1);
  add('kt-windlass-ratchet', gRatchet, mDkIron, RATCHET_X, WIN_Y, WIN_Z, 0, 0, Math.PI / 2);
  const gBolt = new THREE.CylinderGeometry(0.007 * U, 0.007 * U, 0.070 * U, 8, 1);
  add('kt-trigger-bolt', gBolt, mIron, -0.104 * U, WIN_Y + 0.030 * U, WIN_Z, 0, 0, Math.PI / 2);
  const gBoltHead = new THREE.CylinderGeometry(0.013 * U, 0.013 * U, 0.012 * U, 8, 1);
  add('kt-trigger-head', gBoltHead, mIron, -0.143 * U, WIN_Y + 0.030 * U, WIN_Z, 0, 0, Math.PI / 2);
  // Korba na wystającym końcu wału, PO ZEWNĘTRZNEJ stronie prawej burty.
  const gCrank = new THREE.BoxGeometry(0.012 * U, 0.062 * U, 0.012 * U);
  add('kt-windlass-crank', gCrank, mDkIron, 0.150 * U, WIN_Y + 0.031 * U, WIN_Z);
  const gGrip = new THREE.CylinderGeometry(0.008 * U, 0.008 * U, 0.034 * U, 8, 1);
  add('kt-windlass-grip', gGrip, mWood, 0.157 * U, WIN_Y + 0.062 * U, WIN_Z, 0, 0, Math.PI / 2);

  // Lina kołowrotu — NAPIĘTA między bębnem a uchem na ramieniu. Liczona
  // z DWÓCH ISTNIEJĄCYCH PUNKTÓW: to naprawa starych „lin", które nie dotykały
  // ani osi, ani skrzyni.
  //
  // ROZDZIELONA NA PARĘ (bydło/rozkrok liny) NIE dla ozdoby: pojedyncza lina
  // poprowadzona w osi x=0 miała z kamery gry ZERO PIKSELI — zasłaniało ją
  // własne ramię, które leży dokładnie nad nią i jest grubsze. Ta sama klasa
  // błędu co „element istnieje w 3D, a nie widać go na ekranie" z T6/T8.
  // Para lin schodzi na burty bębna i jest widoczna po obu stronach ramienia.
  for (const s of [-1, 1]) {
    span('kt-winch-rope-' + (s < 0 ? 'left' : 'right'), mRope, 0.008 * U,
         [s * 0.032 * U, WIN_TOP, WIN_Z], [0, wy, wz]);
  }

  // === BARWA WŁAŚCICIELA — SYMETRYCZNA, BEZ ZNACZNIKA KULTURY (K9) ==========
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'left' : 'right';
    const gPanel = new THREE.BoxGeometry(0.006 * U, 0.036 * U, 0.190 * U);
    add('kt-owner-panel-' + side, gPanel, mOwner,
        s * (FRAME_X + FRAME_HW - 0.001 * U), FRAME_BOT + FRAME_H / 2, 0.125 * U);
    const gCap = new THREE.BoxGeometry(0.012 * U, BEAM_H + 0.008 * U, 0.056 * U);
    add('kt-owner-cap-' + side, gCap, mOwner, s * 0.134 * U, BEAM_Y, STOP_Z);
  }

  // Punkty odniesienia WYPROWADZONE Z MODELU (nie wpisane liczbowo w test) —
  // test regresji mierzy nimi relacje, więc nie rozjadą się przy zmianie skali.
  group.userData['anchors'] = {
    hexR: HEX_R,
    machineType: 'onager',
    mod: MOD,
    pivot: [0, PIVOT_Y, PIVOT_Z],
    armDir: [0, ARM_DY, ARM_DZ],
    armLen: ARM_LEN,
    armDeg: ARM_DEG,
    armTip: onArm(ARM_LEN),
    hook: [hookX, hookY - 0.016 * U, hookZ],
    winchEye: [wx, wy, wz],
    stopPad: [0, PAD_Y, STOP_Z],
    frameTopY: FRAME_TOP,
    frameBotY: FRAME_BOT,
    wheelR: WHEEL_R,
    axleY: AXLE_Y,
    stoneR: STONE_R,
    skeinR: SKEIN_R,
  };
  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = perGeo;
  return group;
}

/**
 * Wieża oblężnicza (Siege Tower) — wysoka drewniana wieża 3-kondygnacyjna na
 * kołach, z opuszczanym pomostem od strony +Z u góry i osłoniętymi bokami.
 * Front +Z.
 */
function buildSiegeTower(ownerColor_: number): THREE.Group {
  // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p57-wlocznie-machiny.ts).
  return newBuildSiegeTower(ownerColor_);
}

/**
 * Core per-category builder (the original buildUnitModel body).  Always returns
 * the generic, culture-neutral model for the category.
 */
function buildCategoryModel(category: string, ownerColor_: number): THREE.Group {
  switch (category) {

    // -----------------------------------------------------------------------
    case 'falanga': {
      // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (hastati-falangita.ts).
      return newBuildFalangita(ownerColor_);
    }

    // -----------------------------------------------------------------------
    case 'legion':        // imperialny model Legionu — rezerwa dla epoki Klasycznej
    case 'legionary':     // EN alias
    case 'legionista': {
      // Roman LEGIONARY: lorica segmentata (stacked steel bands) over a red
      // tunic, a galea helmet with a brow ridge + neck guard + cheek pieces, a
      // large curved rectangular SCUTUM (owner field, yellow boss + wings), a
      // heavy PILUM in the right hand, and a gladius sheathed on the right hip.
      // Vividness pass: bright kermes-RED tunic + crest, brighter bronze galea.
      const { group, mats } = buildBaseAvatar(COLOR_SKIN, COLOR_RED_VIV, ownerColor_);
      const mat = makeMatFactory(mats);

      const mSteel  = mat(COLOR_STEEL,      0.52, 0.38);
      const mDark   = mat(COLOR_DARK_STEEL, 0.40, 0.55);
      const mOwner  = mat(ownerColor_,      0.15, 0.65);
      const mWood   = mat(COLOR_WOOD,       0.05, 0.85);
      const mGold   = mat(COLOR_GOLD_BR,    0.55, 0.35);
      const mLeath  = mat(COLOR_LEATHER,    0.06, 0.82);
      const mRed    = mat(COLOR_RED_VIV,    0.08, 0.74);

      // Lorica segmentata: 4 stacked steel torso bands
      const bandYs = [-0.07, -0.025, 0.02, 0.065];
      for (const dy of bandYs) {
        const b = new THREE.Mesh(getGeoLoricaBand(), mSteel);
        b.position.set(0, AV_Y_TORSO_CTR + dy * HEX_R, 0);
        group.add(b);
      }
      // Dark gaps suggested by thin bands behind
      for (const dy of [-0.048, -0.003, 0.043]) {
        const g = new THREE.Mesh(getGeoCuirassGap(), mDark);
        g.position.set(0, AV_Y_TORSO_CTR + dy * HEX_R, 0.001 * HEX_R);
        group.add(g);
      }
      // Shoulder bands (pauldron stacks)
      for (const sx of [-1, 1]) {
        for (const dy of [0.0, 0.03]) {
          const sp = new THREE.Mesh(getGeoShoulderPad(), mSteel);
          sp.scale.set(1.0, 0.5, 1.0);
          sp.position.set(sx * (AV_ARM_OFFSET_X - 0.004 * HEX_R), AV_Y_TORSO_TOP - 0.02 * HEX_R + dy * HEX_R, 0);
          group.add(sp);
        }
      }
      // Red tunic hem (pteruges-like) below the lorica
      addPteruges(group, mRed);

      // GALEA (Roman legionary helmet): a rounded BRONZE bowl that wraps the
      // whole head and stands proud above it, a domed crown cap, a brow ridge at
      // the front, a flared NECK GUARD at the back, CHEEK GUARDS on the sides,
      // and a red transverse horsehair CREST (crista transversa) on top.
      const mGalea = mat(COLOR_BRONZE,    0.45, 0.45);   // bronze helmet body
      const mGaleaL = mat(COLOR_BRONZE_LT, 0.50, 0.40);  // polished bronze trim / crest base
      // Bowl: covers the head, rises above the crown.
      const mHelm = new THREE.Mesh(getGeoGaleaBowl(), mGalea);
      mHelm.position.set(0, AV_Y_HEAD_CTR + 0.022 * HEX_R, 0);
      group.add(mHelm);
      // Domed crown cap on top of the bowl.
      const mCap = new THREE.Mesh(getGeoGaleaCap(), mGalea);
      mCap.position.set(0, AV_Y_HEAD_CTR + 0.022 * HEX_R + 0.0525 * HEX_R, 0);
      group.add(mCap);
      // Brow ridge across the forehead.
      const gBrow = new THREE.BoxGeometry(0.165 * HEX_R, 0.022 * HEX_R, 0.030 * HEX_R);
      const mBrow = new THREE.Mesh(gBrow, mGaleaL);
      mBrow.position.set(0, AV_Y_HEAD_CTR + 0.010 * HEX_R, AV_HEAD_S * 0.5 + 0.006 * HEX_R);
      group.add(mBrow);
      // Flared neck guard at the BACK (the galea's defining rear flare).
      const gNeck = new THREE.BoxGeometry(0.170 * HEX_R, 0.030 * HEX_R, 0.060 * HEX_R);
      const mNeck = new THREE.Mesh(gNeck, mGalea);
      mNeck.rotation.x = -0.55;
      mNeck.position.set(0, AV_Y_HEAD_CTR - 0.028 * HEX_R, -(AV_HEAD_S * 0.5 + 0.024 * HEX_R));
      group.add(mNeck);
      // Cheek guards on both sides.
      for (const sx of [-1, 1]) {
        const ck = new THREE.Mesh(getGeoCheekGuard(), mGalea);
        ck.position.set(sx * (AV_HEAD_S * 0.5 + 0.004 * HEX_R), AV_Y_HEAD_CTR - 0.010 * HEX_R, 0.028 * HEX_R);
        group.add(ck);
      }
      // Red transverse crest (crista transversa) atop the bowl, mirroring the
      // swordsman's: a bronze base + a side-to-side red horsehair block.
      const mLegCrestB = new THREE.Mesh(getGeoTransverseCrest(), mGaleaL);
      mLegCrestB.position.set(0, AV_Y_HEAD_TOP + 0.052 * HEX_R, 0);
      group.add(mLegCrestB);
      const gLegCrest = new THREE.BoxGeometry(0.140 * HEX_R, 0.080 * HEX_R, 0.026 * HEX_R);
      const mLegCrest = new THREE.Mesh(gLegCrest, mRed);
      mLegCrest.position.set(0, AV_Y_HEAD_TOP + 0.100 * HEX_R, 0);
      group.add(mLegCrest);
      const legHelmGeos: THREE.BufferGeometry[] = [gBrow, gNeck, gLegCrest];
      addOwnerHelmStripe(group, mOwner, legHelmGeos, 0.018);

      // Pilum in the right hand (long, thin iron shank + small head)
      const PIL_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.012 * HEX_R;
      const mPilShaft = new THREE.Mesh(getGeoPilumShaft(), mWood);
      mPilShaft.position.set(PIL_X, AV_Y_LEG_BOT + 0.21 * HEX_R, 0.01 * HEX_R);
      group.add(mPilShaft);
      const mPilIron = new THREE.Mesh(getGeoPilumHead(), mDark);
      mPilIron.position.set(PIL_X, AV_Y_LEG_BOT + 0.42 * HEX_R + 0.05 * HEX_R, 0.01 * HEX_R);
      group.add(mPilIron);
      const mPilTip = new THREE.Mesh(getGeoJavTip(), mSteel);
      mPilTip.position.set(PIL_X, AV_Y_LEG_BOT + 0.42 * HEX_R + 0.10 * HEX_R + 0.02 * HEX_R, 0.01 * HEX_R);
      group.add(mPilTip);

      // Gladius sheathed on the RIGHT hip (Roman style)
      addHipSword(group, mLeath, mGold, 1);

      // Large curved rectangular SCUTUM on the left arm
      const SC_X = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.014 * HEX_R);
      const mScu = new THREE.Mesh(getGeoScutumBody(), mOwner);
      mScu.position.set(SC_X, AV_Y_TORSO_CTR, 0.02 * HEX_R);
      group.add(mScu);
      // Slight curvature suggested by two angled side panels
      const legExtraGeos: THREE.BoxGeometry[] = [];
      for (const sx of [-1, 1]) {
        const gWing = new THREE.BoxGeometry(0.040 * HEX_R, 0.230 * HEX_R, 0.018 * HEX_R);
        legExtraGeos.push(gWing);
        const mWing = new THREE.Mesh(gWing, mOwner);
        mWing.rotation.y = sx * 0.5;
        mWing.position.set(SC_X + sx * 0.080 * HEX_R, AV_Y_TORSO_CTR, 0.012 * HEX_R);
        group.add(mWing);
      }
      // Metal boss + gold lightning-wing motifs
      const mScuBoss = new THREE.Mesh(getGeoScutumBoss(), mSteel);
      mScuBoss.position.set(SC_X, AV_Y_TORSO_CTR, 0.034 * HEX_R);
      group.add(mScuBoss);
      for (const dy of [0.06, -0.06]) {
        const gWingM = new THREE.BoxGeometry(0.10 * HEX_R, 0.018 * HEX_R, 0.012 * HEX_R);
        legExtraGeos.push(gWingM);
        const mWingM = new THREE.Mesh(gWingM, mGold);
        mWingM.position.set(SC_X, AV_Y_TORSO_CTR + dy * HEX_R, 0.031 * HEX_R);
        group.add(mWingM);
      }

      addBoots(group, mLeath);
      addHands(group, mat(COLOR_SKIN, 0.05, 0.80));

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = [...legHelmGeos, ...legExtraGeos];
      return group;
    }

    // -----------------------------------------------------------------------
    case 'osadnik': {
      // Pioneer/settler: round straw sun-hat, linen tunic, walking staff,
      // backpack with a rolled bedroll. No weapon. Owner colour on hat band + sash.
      const { group, mats } = buildBaseAvatar(COLOR_SKIN, 0x2f5aa0, ownerColor_);
      const mat = makeMatFactory(mats);

      const mStraw = mat(COLOR_SAND,    0.03, 0.95);
      const mPack  = mat(COLOR_LEATHER, 0.05, 0.85);
      const mVest  = mat(0x274d8c,      0.05, 0.85);   // darker blue work vest
      const mGreen = mat(0x3f6b3a,      0.05, 0.88);   // green work trousers
      const mBootO = mat(0x4a3526,      0.05, 0.88);   // brown leather boots
      const mWood  = mat(COLOR_WOOD,    0.05, 0.85);
      const mRoll  = mat(0xb8784a,      0.04, 0.90);
      const mBand2 = mat(ownerColor_,   0.08, 0.70);

      // Round straw brim (wide disc) + low conical crown
      const mBrim = new THREE.Mesh(getGeoStrawBrim(), mStraw);
      mBrim.position.set(0, AV_Y_HEAD_TOP + 0.006 * HEX_R, 0);
      group.add(mBrim);
      const mCrown = new THREE.Mesh(getGeoStrawCrown(), mStraw);
      mCrown.position.set(0, AV_Y_HEAD_TOP + 0.036 * HEX_R, 0);
      group.add(mCrown);
      // Owner-colour hat band around crown base
      const gBand = new THREE.BoxGeometry(0.118 * HEX_R, 0.016 * HEX_R, 0.118 * HEX_R);
      const mBand = new THREE.Mesh(gBand, mBand2);
      mBand.position.set(0, AV_Y_HEAD_TOP + 0.012 * HEX_R, 0);
      group.add(mBand);

      // Backpack on the back
      const mPk = new THREE.Mesh(getGeoBackpack(), mPack);
      mPk.position.set(0, AV_Y_TORSO_CTR + 0.01 * HEX_R, -(AV_TORSO_D * 0.5 + 0.022 * HEX_R));
      group.add(mPk);
      // Rolled bedroll lashed horizontally atop the pack
      const mRollM = new THREE.Mesh(getGeoBedroll(), mRoll);
      mRollM.rotation.z = Math.PI / 2;
      mRollM.position.set(0, AV_Y_TORSO_CTR + 0.075 * HEX_R, -(AV_TORSO_D * 0.5 + 0.030 * HEX_R));
      group.add(mRollM);

      // Walking staff in the right hand (tall, slightly outside the arm)
      const STAFF_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.012 * HEX_R;
      const mStaff = new THREE.Mesh(getGeoStaff(), mWood);
      mStaff.position.set(STAFF_X, AV_Y_LEG_BOT + 0.26 * HEX_R, 0.02 * HEX_R);
      group.add(mStaff);

      // Blue work-vest panel over the chest (darker than the tunic) + gold trim
      const gVest = new THREE.BoxGeometry(0.135 * HEX_R, 0.20 * HEX_R, 0.115 * HEX_R);
      const mVestM = new THREE.Mesh(gVest, mVest);
      mVestM.position.set(0, AV_Y_TORSO_CTR, 0.004 * HEX_R);
      group.add(mVestM);
      const gVTrim = new THREE.BoxGeometry(0.020 * HEX_R, 0.20 * HEX_R, 0.012 * HEX_R);
      const mVTrim = new THREE.Mesh(gVTrim, mBand2);
      mVTrim.position.set(0, AV_Y_TORSO_CTR, AV_TORSO_D * 0.5 + 0.006 * HEX_R);
      group.add(mVTrim);
      // Green trouser overlays on both legs
      const osGeos: THREE.BoxGeometry[] = [];
      for (const sx of [-(AV_LEG_SEP + AV_LEG_W * 0.5), (AV_LEG_SEP + AV_LEG_W * 0.5)]) {
        const gTr = new THREE.BoxGeometry(AV_LEG_W * 1.04, AV_LEG_H * 0.92, AV_LEG_W * 1.04);
        osGeos.push(gTr);
        const mTr = new THREE.Mesh(gTr, mGreen);
        mTr.position.set(sx, AV_Y_LEG_CTR + 0.01 * HEX_R, 0);
        group.add(mTr);
      }
      addBoots(group, mBootO);
      addHands(group, mat(COLOR_SKIN, 0.05, 0.80));

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = [gBand, gVest, gVTrim, ...osGeos];
      return group;
    }

    // -----------------------------------------------------------------------
    case 'miecznik': {
      // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p1-rdzen.ts).
      return newBuildMiecznik(ownerColor_);
    }

    // -----------------------------------------------------------------------
    case 'wlocznik': {
      // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p1-rdzen.ts).
      return newBuildWlocznik(ownerColor_);
    }

    // -----------------------------------------------------------------------
    case 'lucznik': {
      // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p1-rdzen.ts).
      return buildLucznikOpus5(ownerColor_);
    }

    // -----------------------------------------------------------------------
    case 'procarz': {
      // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p1-rdzen.ts).
      return newBuildProcarz(ownerColor_);
    }

    // -----------------------------------------------------------------------
    case 'oszczepnik': {
      // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p1-rdzen.ts).
      return buildOszczepnikOpus5(ownerColor_);
    }

    // -----------------------------------------------------------------------
    case 'maczuga': {
      // Tribal club warrior: bare tanned torso with a diagonal war-paint stripe,
      // fur loincloth, a knobbed wooden war-club raised high, and a small fan of
      // feathers in an owner-colour head band.
      const { group, mats } = buildBaseAvatar(COLOR_SKIN_DARK, COLOR_SKIN_DARK, ownerColor_);
      const mat = makeMatFactory(mats);

      // Vividness pass: bright RED war-paint + an OCHRE woven loincloth (Andean
      // Chaska feel) so the tribal warrior reads colourful, not bare-brown.
      const mWood   = mat(0x6b4a26,    0.05, 0.85);
      const mStone  = mat(0x7a756c,    0.10, 0.85);
      const mOwner  = mat(ownerColor_, 0.12, 0.68);
      const mFur    = mat(COLOR_OCHRE, 0.05, 0.88);       // ochre woven loincloth (was brown fur)
      const mPaint  = mat(COLOR_RED_VIV,   0.05, 0.78);   // vivid red war-paint
      const mFeath  = mat(COLOR_PAINT_WHT, 0.03, 0.92);   // bright white feathers

      // Fur loincloth around the hips
      const mLoin = new THREE.Mesh(getGeoLoincloth(), mFur);
      mLoin.position.set(0, AV_Y_TORSO_BOT + 0.02 * HEX_R, 0);
      group.add(mLoin);

      // Diagonal war-paint stripe across the chest
      const gPaint = new THREE.BoxGeometry(0.026 * HEX_R, 0.22 * HEX_R, 0.012 * HEX_R);
      const mPaintM = new THREE.Mesh(gPaint, mPaint);
      mPaintM.rotation.z = 0.7;
      mPaintM.position.set(0, AV_Y_TORSO_CTR, AV_TORSO_D * 0.5 + 0.005 * HEX_R);
      group.add(mPaintM);

      // HELMET (visibility fix): a hide/leather skull-cap covering the crown so
      // the tribal warrior is no longer bare-headed (was just a band + feathers
      // over exposed skin).  Leather is era-appropriate for a basic Stone-age
      // melee unit; the owner band + feathers sit on top of it.
      const mHide = mat(0x5a3a22, 0.05, 0.86);
      const mCapM = new THREE.Mesh(getGeoSkullCap(), mHide);
      mCapM.position.set(0, AV_Y_HEAD_CTR + 0.028 * HEX_R, 0);
      group.add(mCapM);
      const mCapDome = new THREE.Mesh(getGeoGaleaCap(), mHide);
      mCapDome.scale.set(0.92, 0.62, 0.92);
      mCapDome.position.set(0, AV_Y_HEAD_CTR + 0.028 * HEX_R + 0.032 * HEX_R, 0);
      group.add(mCapDome);

      // Owner-colour head band (over the cap)
      const gBand = new THREE.BoxGeometry(0.150 * HEX_R, 0.024 * HEX_R, 0.150 * HEX_R);
      const mBand = new THREE.Mesh(gBand, mOwner);
      mBand.position.set(0, AV_Y_HEAD_CTR + 0.020 * HEX_R, 0);
      group.add(mBand);
      // Fan of three feathers rising from the band at the back
      const macExtraGeos: THREE.BoxGeometry[] = [];
      for (const a of [-0.35, 0.0, 0.35]) {
        const gF = new THREE.BoxGeometry(0.016 * HEX_R, 0.085 * HEX_R, 0.009 * HEX_R);
        macExtraGeos.push(gF);
        const mF = new THREE.Mesh(gF, a === 0.0 ? mOwner : mFeath);
        mF.rotation.z = a;
        mF.position.set(Math.sin(a) * 0.03 * HEX_R, AV_Y_HEAD_TOP + 0.05 * HEX_R, -0.03 * HEX_R);
        group.add(mF);
      }

      // War-club: thick wooden handle raised in the right hand + heavy stone knob
      const CLUB_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.018 * HEX_R;
      const mHandle = new THREE.Mesh(getGeoClubHandle(), mWood);
      mHandle.position.set(CLUB_X, AV_Y_TORSO_TOP + 0.02 * HEX_R, 0.01 * HEX_R);
      group.add(mHandle);
      const mKnob = new THREE.Mesh(getGeoClubKnob(), mStone);
      mKnob.position.set(CLUB_X, AV_Y_TORSO_TOP + 0.175 * HEX_R + 0.028 * HEX_R, 0.01 * HEX_R);
      group.add(mKnob);
      // A couple of owner-colour studs on the knob
      for (const dz of [-0.022 * HEX_R, 0.022 * HEX_R]) {
        const gStud = new THREE.BoxGeometry(0.016 * HEX_R, 0.016 * HEX_R, 0.016 * HEX_R);
        macExtraGeos.push(gStud);
        const mStud = new THREE.Mesh(gStud, mOwner);
        mStud.position.set(CLUB_X + 0.028 * HEX_R, AV_Y_TORSO_TOP + 0.20 * HEX_R, dz);
        group.add(mStud);
      }

      // Bare tanned feet + hands
      addBoots(group, mat(COLOR_SKIN_DARK, 0.05, 0.85));
      addHands(group, mat(COLOR_SKIN_DARK, 0.05, 0.85));

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = [gPaint, gBand, ...macExtraGeos];
      return group;
    }

    // -----------------------------------------------------------------------
    case 'topor': {
      // Axe warrior: leather jerkin with a fur shoulder mantle, a fur-lined cap,
      // and a heavy bearded battle-axe (broad steel head with a flared cutting
      // edge) raised in the right hand.
      // Vividness pass: deep BURGUNDY tunic (arms/legs) under the brown jerkin —
      // a dark wine red that separates the axeman from the warmer terracotta
      // javelin-man and the brighter reds of the sword/legion units.
      const { group, mats } = buildBaseAvatar(COLOR_SKIN, COLOR_BURGUNDY, ownerColor_);
      const mat = makeMatFactory(mats);

      const mSteel  = mat(COLOR_STEEL,   0.50, 0.40);
      const mDark   = mat(COLOR_DARK_STEEL,0.40, 0.55);
      const mWood   = mat(0x6b4a26,      0.05, 0.85);
      const mOwner  = mat(ownerColor_,   0.15, 0.65);
      const mFur    = mat(COLOR_FUR,     0.04, 0.92);
      const mLeath  = mat(0x5a3c22,      0.06, 0.82);

      // Leather jerkin (chest) + fur mantle over the shoulders
      const gChest = new THREE.BoxGeometry(0.195 * HEX_R, 0.20 * HEX_R, 0.125 * HEX_R);
      const mChest = new THREE.Mesh(gChest, mLeath);
      mChest.position.set(0, AV_Y_TORSO_CTR, 0);
      group.add(mChest);
      const gMantle = new THREE.BoxGeometry(0.26 * HEX_R, 0.06 * HEX_R, 0.16 * HEX_R);
      const mMantle = new THREE.Mesh(gMantle, mFur);
      mMantle.position.set(0, AV_Y_TORSO_TOP - 0.01 * HEX_R, 0);
      group.add(mMantle);
      // Owner-colour belt
      const gBelt = new THREE.BoxGeometry(0.20 * HEX_R, 0.026 * HEX_R, 0.13 * HEX_R);
      const mBelt = new THREE.Mesh(gBelt, mOwner);
      mBelt.position.set(0, AV_Y_TORSO_BOT + 0.03 * HEX_R, 0);
      group.add(mBelt);

      // HELMET (visibility fix): a fur-trimmed leather war-cap seated DOWN over
      // the crown (was perched above the head, reading as a hat) with a domed top
      // and a bronze brow band for clear contrast — so the axeman plainly has
      // headgear, not bare hair, from every gallery view.
      const mBrnz  = mat(COLOR_BRONZE,  0.35, 0.50);
      const gCap = new THREE.CylinderGeometry(0.086 * HEX_R, 0.096 * HEX_R, 0.080 * HEX_R, 12, 1);
      const mCapM = new THREE.Mesh(gCap, mLeath);
      mCapM.position.set(0, AV_Y_HEAD_CTR + 0.028 * HEX_R, 0);
      group.add(mCapM);
      // Fur roll around the cap base.
      const gCapFur = new THREE.CylinderGeometry(0.100 * HEX_R, 0.100 * HEX_R, 0.030 * HEX_R, 12, 1);
      const mCapFur = new THREE.Mesh(gCapFur, mFur);
      mCapFur.position.set(0, AV_Y_HEAD_CTR - 0.006 * HEX_R, 0);
      group.add(mCapFur);
      // Domed crown on top of the cap.
      const mCapDome = new THREE.Mesh(getGeoGaleaCap(), mLeath);
      mCapDome.scale.set(0.94, 0.66, 0.94);
      mCapDome.position.set(0, AV_Y_HEAD_CTR + 0.028 * HEX_R + 0.038 * HEX_R, 0);
      group.add(mCapDome);
      // Bronze brow band across the front.
      const gToBrow = new THREE.BoxGeometry(0.180 * HEX_R, 0.024 * HEX_R, 0.032 * HEX_R);
      const mToBrow = new THREE.Mesh(gToBrow, mBrnz);
      mToBrow.position.set(0, AV_Y_HEAD_CTR + 0.006 * HEX_R, AV_HEAD_S * 0.5 + 0.004 * HEX_R);
      group.add(mToBrow);

      // Axe haft raised in the right hand
      const AXE_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.015 * HEX_R;
      const gHaft = new THREE.BoxGeometry(0.018 * HEX_R, 0.24 * HEX_R, 0.018 * HEX_R);
      const mHaft = new THREE.Mesh(gHaft, mWood);
      mHaft.position.set(AXE_X, AV_Y_TORSO_CTR + 0.06 * HEX_R, 0.01 * HEX_R);
      group.add(mHaft);
      // Broad steel axe head: main blade + flared bearded lower lobe
      const gHead = new THREE.BoxGeometry(0.10 * HEX_R, 0.085 * HEX_R, 0.020 * HEX_R);
      const mHead = new THREE.Mesh(gHead, mSteel);
      mHead.position.set(AXE_X + 0.045 * HEX_R, AV_Y_TORSO_TOP + 0.06 * HEX_R, 0.01 * HEX_R);
      group.add(mHead);
      const gBeard = new THREE.BoxGeometry(0.07 * HEX_R, 0.055 * HEX_R, 0.018 * HEX_R);
      const mBeard = new THREE.Mesh(gBeard, mSteel);
      mBeard.position.set(AXE_X + 0.060 * HEX_R, AV_Y_TORSO_TOP + 0.012 * HEX_R, 0.01 * HEX_R);
      group.add(mBeard);
      // Bright cutting edge
      const gEdge = new THREE.BoxGeometry(0.014 * HEX_R, 0.135 * HEX_R, 0.022 * HEX_R);
      const mEdge = new THREE.Mesh(gEdge, mat(COLOR_STEEL, 0.6, 0.30));
      mEdge.position.set(AXE_X + 0.092 * HEX_R, AV_Y_TORSO_TOP + 0.035 * HEX_R, 0.01 * HEX_R);
      group.add(mEdge);
      // Dark socket band where head meets haft
      const gSock = new THREE.BoxGeometry(0.024 * HEX_R, 0.05 * HEX_R, 0.024 * HEX_R);
      const mSock = new THREE.Mesh(gSock, mDark);
      mSock.position.set(AXE_X, AV_Y_TORSO_TOP + 0.06 * HEX_R, 0.01 * HEX_R);
      group.add(mSock);

      addBoots(group, mLeath);
      addHands(group, mat(COLOR_SKIN, 0.05, 0.80));

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = [gChest, gMantle, gBelt, gCap, gCapFur, gToBrow, gHaft, gHead, gBeard, gEdge, gSock];
      return group;
    }

    // -----------------------------------------------------------------------
    case 'konnica': {
      // ONE horse (rydwan-style, shared buildHorse helper) + rider on top.
      // Horse faces -Z; rider sits centered on horse back.
      const group = new THREE.Group();
      const mats: THREE.Material[] = [];
      const mat = makeMatFactory(mats);

      // Vividness pass: CRIMSON rider tunic on a brighter CHESTNUT horse, so the
      // cavalryman reads as a bold red-cloaked rider rather than brown-on-brown.
      const mHorse  = mat(COLOR_HORSE_LT, 0.10, 0.78);
      const mMane   = mat(0x1a0e06,     0.05, 0.85);
      const mSkin   = mat(COLOR_SKIN,   0.05, 0.80);
      const mCloth  = mat(COLOR_CRIMSON,0.06, 0.78);
      const mOwner  = mat(ownerColor_,  0.12, 0.68);
      const mWood   = mat(COLOR_WOOD,   0.05, 0.85);
      const mSteel  = mat(COLOR_STEEL,  0.40, 0.50);

      // Build horse (all singleton geos, no per-token alloc)
      // Horse centered at (0, 0, 0); hooves at y=0; body faces -Z.
      const horseBackY = buildHorse(group, mat, mHorse, mMane, null, 0, 0);

      // Rider seated on horse back
      const RIDER_BOT  = horseBackY;
      const R_TORSO_CTR = RIDER_BOT + AV_TORSO_H * 0.5;
      const R_TORSO_TOP = RIDER_BOT + AV_TORSO_H;
      const R_HEAD_CTR  = R_TORSO_TOP + AV_NECK_H + AV_HEAD_S * 0.5;
      const R_ARM_CTR   = RIDER_BOT + AV_TORSO_H * 0.55;

      const mRTorso = new THREE.Mesh(getGeoAvTorso(), mCloth);
      mRTorso.scale.set(0.85, 0.75, 0.85);
      mRTorso.position.set(0, R_TORSO_CTR, 0);
      group.add(mRTorso);

      // Rider sash (owner color)
      const gRSash = new THREE.BoxGeometry(0.09 * HEX_R, 0.035 * HEX_R, 0.012 * HEX_R);
      const mRSash = new THREE.Mesh(gRSash, mOwner);
      mRSash.position.set(0, R_TORSO_CTR, AV_TORSO_D * 0.43 + 0.003 * HEX_R);
      group.add(mRSash);

      // Rider arms (straddling the horse)
      const gRArmL = new THREE.BoxGeometry(AV_ARM_W * 0.8, AV_ARM_H * 0.75, AV_ARM_D * 0.8);
      const mRArmL = new THREE.Mesh(gRArmL, mCloth);
      mRArmL.position.set(-AV_ARM_OFFSET_X * 0.85, R_ARM_CTR, 0);
      group.add(mRArmL);

      const gRArmR = new THREE.BoxGeometry(AV_ARM_W * 0.8, AV_ARM_H * 0.75, AV_ARM_D * 0.8);
      const mRArmR = new THREE.Mesh(gRArmR, mCloth);
      mRArmR.position.set( AV_ARM_OFFSET_X * 0.85, R_ARM_CTR, 0);
      group.add(mRArmR);

      // Rider head
      const gRHead = new THREE.BoxGeometry(AV_HEAD_S * 0.85, AV_HEAD_S * 0.85, AV_HEAD_S * 0.85);
      const mRHead = new THREE.Mesh(gRHead, mSkin);
      mRHead.position.set(0, R_HEAD_CTR, 0);
      group.add(mRHead);

      // Eye dots on rider (facing -Z, same direction as horse)
      const rEyeZ = -(AV_HEAD_S * 0.85 * 0.5 + 0.002 * HEX_R);
      const gREyeL = new THREE.BoxGeometry(0.016 * HEX_R, 0.012 * HEX_R, 0.008 * HEX_R);
      const mREyeL = new THREE.Mesh(gREyeL, mat(COLOR_DARK_EYE, 0.02, 0.95));
      mREyeL.position.set(-0.025 * HEX_R, R_HEAD_CTR + 0.008 * HEX_R, rEyeZ);
      group.add(mREyeL);

      const gREyeR = new THREE.BoxGeometry(0.016 * HEX_R, 0.012 * HEX_R, 0.008 * HEX_R);
      const mREyeR = new THREE.Mesh(gREyeR, mat(COLOR_DARK_EYE, 0.02, 0.95));
      mREyeR.position.set( 0.025 * HEX_R, R_HEAD_CTR + 0.008 * HEX_R, rEyeZ);
      group.add(mREyeR);

      // Bronze helmet on the rider (simple domed cap) + small red front-to-back crest
      const gRHelm = new THREE.CylinderGeometry(0.052 * HEX_R, 0.060 * HEX_R, 0.055 * HEX_R, 8, 1);
      const mRHelm = new THREE.Mesh(gRHelm, mSteel);
      mRHelm.position.set(0, R_HEAD_CTR + AV_HEAD_S * 0.45, 0);
      group.add(mRHelm);
      const gRCrest = new THREE.BoxGeometry(0.020 * HEX_R, 0.055 * HEX_R, 0.085 * HEX_R);
      const mRCrest = new THREE.Mesh(gRCrest, mat(COLOR_RED_VIV, 0.08, 0.74));
      mRCrest.position.set(0, R_HEAD_CTR + AV_HEAD_S * 0.45 + 0.050 * HEX_R, 0);
      group.add(mRCrest);

      // Saddle blanket in owner colour draped over the horse back, under rider
      const mBlanket = new THREE.Mesh(getGeoSaddleBlanket(), mOwner);
      mBlanket.position.set(0, RIDER_BOT - 0.012 * HEX_R, 0.01 * HEX_R);
      group.add(mBlanket);

      // Couched cavalry lance — grot i proporczyk NA osi drzewca
      // (GRAFIKA-3D partia 1: fix — wcześniej latały w powietrzu obok konia)
      const RSPEAR_X = AV_ARM_OFFSET_X * 0.85 + AV_ARM_W * 0.4 + 0.012 * HEX_R;
      const gLance = new THREE.BoxGeometry(0.016 * HEX_R, 0.56 * HEX_R, 0.016 * HEX_R);
      const lanceTh = Math.PI * 0.5 + 0.34;                       // przód-góra nad łbem konia
      const lanceAxis = new THREE.Vector3(0, Math.cos(lanceTh), Math.sin(lanceTh));
      const lanceCtr = new THREE.Vector3(RSPEAR_X, R_ARM_CTR + 0.075 * HEX_R, -0.085 * HEX_R);
      const mLance = new THREE.Mesh(gLance, mWood);
      mLance.rotation.x = lanceTh;
      mLance.position.copy(lanceCtr);
      group.add(mLance);
      const mLanceTip = new THREE.Mesh(getGeoSpearTip(), mSteel);
      mLanceTip.rotation.x = lanceTh;
      mLanceTip.position.copy(lanceCtr.clone().addScaledVector(lanceAxis, -0.295 * HEX_R));
      group.add(mLanceTip);
      // Owner-colour pennon just behind the lance head (na osi drzewca)
      const gPennon = new THREE.BoxGeometry(0.012 * HEX_R, 0.045 * HEX_R, 0.06 * HEX_R);
      const mPennon = new THREE.Mesh(gPennon, mOwner);
      mPennon.rotation.x = lanceTh;
      mPennon.position.copy(
        lanceCtr.clone().addScaledVector(lanceAxis, -0.225 * HEX_R).add(new THREE.Vector3(0, -0.028 * HEX_R, 0)),
      );
      group.add(mPennon);

      // Round shield on the rider's left arm (owner blazon + boss)
      const RSHIELD_X = -(AV_ARM_OFFSET_X * 0.85 + AV_ARM_W * 0.4 + 0.010 * HEX_R);
      const mRShield = new THREE.Mesh(getGeoOvalShield(), mOwner);
      mRShield.rotation.z = Math.PI / 2;
      mRShield.scale.set(1.0, 0.95, 0.95);
      mRShield.position.set(RSHIELD_X, R_TORSO_CTR, 0.03 * HEX_R);
      group.add(mRShield);
      const mRBoss = new THREE.Mesh(getGeoShieldBoss(), mSteel);
      mRBoss.rotation.z = Math.PI / 2;
      mRBoss.position.set(RSHIELD_X - 0.012 * HEX_R, R_TORSO_CTR, 0.03 * HEX_R);
      group.add(mRBoss);

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = [gRSash, gRArmL, gRArmR, gRHead, gREyeL, gREyeR, gRHelm, gRCrest, gLance, gPennon];

      // FACING FIX: the map camera looks toward -Z, so +Z faces the viewer
      // (foot units have their eyes on +Z). The horse and rider were built
      // facing -Z (head/eyes/lance toward -Z), i.e. their BACKS to the camera.
      // The horse and rider face the SAME way, so a single 180 deg spin about Y
      // turns BOTH the horse head and the rider's front toward the viewer. The
      // rider stays seated (Y-rotation preserves the y=0 hooves and the seat).
      group.rotation.y = Math.PI;
      return group;
    }

    // -----------------------------------------------------------------------
    case 'rydwan': {
      // Roman-style chariot: TWO horses side-by-side at front, draw pole/yoke,
      // two-wheeled open car behind, standing driver inside the car.
      // Layout: horses face -Z (into scene), car at Z=0, horses at -Z offset.
      // Wheels on X axis flanking the car. Driver stands on car floor.
      const group = new THREE.Group();
      const mats: THREE.Material[] = [];
      const mat = makeMatFactory(mats);

      // Vividness pass: LACQUER-RED driver tunic (Chinese/Egyptian chariot feel)
      // on brighter CHESTNUT horses — a bold, clearly different vehicle rather
      // than all-brown wood + brown driver. (Sash stays owner-colour for ID.)
      const mWood   = mat(COLOR_CHARIOT,  0.05, 0.82);  // warm wood brown
      const mOwner  = mat(ownerColor_,    0.10, 0.70);  // owner-color front panel
      const mSteel  = mat(COLOR_STEEL,    0.45, 0.45);  // metal fittings / axle
      const mBronze = mat(COLOR_BRONZE,   0.32, 0.52);  // bronze wheel rim / yoke
      const mHorse  = mat(COLOR_HORSE_LT, 0.10, 0.78);  // brighter chestnut horse body
      const mMane   = mat(0x1a0e06,       0.05, 0.85);  // near-black mane / tail
      const mSkin   = mat(COLOR_SKIN,     0.05, 0.80);  // driver skin
      const mCloth  = mat(COLOR_LACQUER,  0.06, 0.78);  // lacquer-red driver tunic
      const mDark   = mat(COLOR_TROUSERS, 0.05, 0.85);  // driver legs

      // ── CHARIOT CAR ───────────────────────────────────────────────────────
      // Car sits on an axle; wheels on sides (X axis); car body slightly above
      // wheels. The car is centered near Z=0 and extends to Z=+0.12 (rear open)
      // and Z=-0.09 (front wall, toward horses).

      // Wheel radius = 0.085 * HEX_R; wheel axle height = WHEEL_Y
      const WHEEL_R  = 0.085 * HEX_R;
      const WHEEL_Y  = WHEEL_R;                          // wheel center sits on ground
      const AXLE_Y   = WHEEL_Y;
      const CAR_FLOOR_Y = AXLE_Y + WHEEL_R * 0.30;      // floor slightly above axle

      // Left wheel (at +X side, rotated so disk faces the X axis)
      const gWheelL = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.022 * HEX_R, 12, 1);
      const mWheelL = new THREE.Mesh(gWheelL, mWood);
      mWheelL.rotation.z = Math.PI / 2;
      mWheelL.position.set( 0.185 * HEX_R, WHEEL_Y, -0.005 * HEX_R);
      group.add(mWheelL);

      // Left wheel bronze rim
      const gRimL = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.028 * HEX_R, 12, 1, true);
      const mRimL = new THREE.Mesh(gRimL, mBronze);
      mRimL.rotation.z = Math.PI / 2;
      mRimL.position.set( 0.185 * HEX_R, WHEEL_Y, -0.005 * HEX_R);
      group.add(mRimL);

      // Right wheel
      const gWheelR = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.022 * HEX_R, 12, 1);
      const mWheelR = new THREE.Mesh(gWheelR, mWood);
      mWheelR.rotation.z = Math.PI / 2;
      mWheelR.position.set(-0.185 * HEX_R, WHEEL_Y, -0.005 * HEX_R);
      group.add(mWheelR);

      // Right wheel bronze rim
      const gRimR = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.028 * HEX_R, 12, 1, true);
      const mRimR = new THREE.Mesh(gRimR, mBronze);
      mRimR.rotation.z = Math.PI / 2;
      mRimR.position.set(-0.185 * HEX_R, WHEEL_Y, -0.005 * HEX_R);
      group.add(mRimR);

      // Spoke crosses (visual only - box X and box Y crossing in wheel plane)
      // Spoke geos are per-token (size depends on WHEEL_R); collected for disposal.
      const spokeGeos: THREE.BoxGeometry[] = [];
      for (const sx of [0.185, -0.185]) {
        const gSp1 = new THREE.BoxGeometry(0.018 * HEX_R, WHEEL_R * 2 * 0.92, 0.016 * HEX_R);
        spokeGeos.push(gSp1);
        const mSp1 = new THREE.Mesh(gSp1, mWood);
        mSp1.rotation.z = Math.PI / 2;
        mSp1.position.set(sx * HEX_R, WHEEL_Y, -0.005 * HEX_R);
        group.add(mSp1);
        const gSp2 = new THREE.BoxGeometry(0.018 * HEX_R, WHEEL_R * 2 * 0.92, 0.016 * HEX_R);
        spokeGeos.push(gSp2);
        const mSp2 = new THREE.Mesh(gSp2, mWood);
        mSp2.rotation.z = Math.PI / 2;
        mSp2.rotation.y = Math.PI / 2;
        mSp2.position.set(sx * HEX_R, WHEEL_Y, -0.005 * HEX_R);
        group.add(mSp2);
      }

      // Axle (horizontal rod between the two wheels)
      const gAxle = new THREE.BoxGeometry(0.38 * HEX_R, 0.016 * HEX_R, 0.016 * HEX_R);
      const mAxle = new THREE.Mesh(gAxle, mBronze);
      mAxle.position.set(0, AXLE_Y, -0.005 * HEX_R);
      group.add(mAxle);

      // Car floor (thin plank)
      const gFloor = new THREE.BoxGeometry(0.28 * HEX_R, 0.016 * HEX_R, 0.22 * HEX_R);
      const mFloor = new THREE.Mesh(gFloor, mWood);
      mFloor.position.set(0, CAR_FLOOR_Y, 0.06 * HEX_R);
      group.add(mFloor);

      // Front wall of car (owner color -- clearly visible)
      const gFrontWall = new THREE.BoxGeometry(0.28 * HEX_R, 0.10 * HEX_R, 0.018 * HEX_R);
      const mFrontWall = new THREE.Mesh(gFrontWall, mOwner);
      mFrontWall.position.set(0, CAR_FLOOR_Y + 0.05 * HEX_R, -0.045 * HEX_R);
      group.add(mFrontWall);

      // Left side wall of car (wood trim)
      const gSideL = new THREE.BoxGeometry(0.018 * HEX_R, 0.08 * HEX_R, 0.22 * HEX_R);
      const mSideL = new THREE.Mesh(gSideL, mWood);
      mSideL.position.set( 0.135 * HEX_R, CAR_FLOOR_Y + 0.04 * HEX_R, 0.06 * HEX_R);
      group.add(mSideL);

      // Right side wall
      const gSideR = new THREE.BoxGeometry(0.018 * HEX_R, 0.08 * HEX_R, 0.22 * HEX_R);
      const mSideR = new THREE.Mesh(gSideR, mWood);
      mSideR.position.set(-0.135 * HEX_R, CAR_FLOOR_Y + 0.04 * HEX_R, 0.06 * HEX_R);
      group.add(mSideR);

      // Bronze trim strip on top of front wall
      const gFwTrim = new THREE.BoxGeometry(0.30 * HEX_R, 0.014 * HEX_R, 0.020 * HEX_R);
      const mFwTrim = new THREE.Mesh(gFwTrim, mBronze);
      mFwTrim.position.set(0, CAR_FLOOR_Y + 0.098 * HEX_R, -0.045 * HEX_R);
      group.add(mFwTrim);

      // ── DRAW POLE / YOKE ─────────────────────────────────────────────────
      // Pole runs from front-center of car floor forward to the horse yoke
      // Horses are at Z = -0.36 * HEX_R (in front)
      const POLE_Z_START = -0.054 * HEX_R;     // from front wall
      const POLE_Z_END   = -0.32 * HEX_R;      // to yoke
      const POLE_LEN     = Math.abs(POLE_Z_END - POLE_Z_START);
      const POLE_Z_CTR   = (POLE_Z_START + POLE_Z_END) * 0.5;

      const gPole = new THREE.BoxGeometry(0.018 * HEX_R, 0.018 * HEX_R, POLE_LEN);
      const mPole = new THREE.Mesh(gPole, mWood);
      mPole.position.set(0, CAR_FLOOR_Y - 0.005 * HEX_R, POLE_Z_CTR);
      group.add(mPole);

      // Yoke bar (horizontal, connecting pole to both horses)
      const gYoke = new THREE.BoxGeometry(0.26 * HEX_R, 0.018 * HEX_R, 0.018 * HEX_R);
      const mYoke = new THREE.Mesh(gYoke, mBronze);
      mYoke.position.set(0, CAR_FLOOR_Y + 0.002 * HEX_R, POLE_Z_END);
      group.add(mYoke);

      // ── TWO HORSES (via shared buildHorse helper) ────────────────────────
      // Placed symmetrically at X = +-0.10 * HEX_R, horses face -Z.
      // buildHorse uses singleton geos -- no per-token alloc needed here.

      const HORSE_Z = POLE_Z_END - 0.08 * HEX_R;   // horse body center Z

      for (const hx of [0.10 * HEX_R, -0.10 * HEX_R]) {
        buildHorse(group, mat, mHorse, mMane, mDark, hx, HORSE_Z);
      }

      // ── DRIVER (standing inside car) ─────────────────────────────────────
      // Driver stands on car floor. Feet at CAR_FLOOR_Y + half-leg-height.
      // Use reduced-scale avatar proportions consistent with konnica rider.

      const DRV_SCALE  = 0.82;
      const DRV_LEG_H  = AV_LEG_H  * DRV_SCALE;
      const DRV_TRS_H  = AV_TORSO_H * DRV_SCALE;
      const DRV_TRS_W  = AV_TORSO_W * DRV_SCALE;
      const DRV_TRS_D  = AV_TORSO_D * DRV_SCALE;
      const DRV_ARM_W  = AV_ARM_W  * DRV_SCALE;
      const DRV_ARM_H  = AV_ARM_H  * DRV_SCALE;
      const DRV_ARM_D  = AV_ARM_D  * DRV_SCALE;
      const DRV_HEAD_S = AV_HEAD_S * DRV_SCALE;
      const DRV_ARM_OX = DRV_TRS_W * 0.5 + DRV_ARM_W * 0.5 + 0.002 * HEX_R;

      // Driver stands on top of car floor
      const DRV_BASE   = CAR_FLOOR_Y + 0.008 * HEX_R;  // feet rest on floor
      const DRV_LEG_CTR  = DRV_BASE + DRV_LEG_H * 0.5;
      const DRV_TRS_BOT  = DRV_BASE + DRV_LEG_H;
      const DRV_TRS_CTR  = DRV_TRS_BOT + DRV_TRS_H * 0.5;
      const DRV_TRS_TOP  = DRV_TRS_BOT + DRV_TRS_H;
      const DRV_ARM_CTR  = DRV_TRS_BOT + DRV_TRS_H * 0.55;
      const DRV_HEAD_CTR = DRV_TRS_TOP + AV_NECK_H * DRV_SCALE + DRV_HEAD_S * 0.5;

      // FACING FIX (rydwan): the whole chariot is spun 180 deg about Y at the
      // end of this case so the horse team faces the viewer (+Z) and the car
      // sits behind them. The driver was built facing +Z and must KEEP facing
      // the viewer, so all driver meshes go into this sub-group which is itself
      // pre-rotated 180 deg about Y. The two opposite spins cancel for the
      // driver (net facing +Z, unchanged seat), while the vehicle parts get the
      // single outer spin. Both spins are about Y => hooves/wheels stay at y=0.
      const driverGroup = new THREE.Group();
      driverGroup.rotation.y = Math.PI;
      group.add(driverGroup);

      // Left leg
      const gDLegL = new THREE.BoxGeometry(AV_LEG_W * DRV_SCALE, DRV_LEG_H, AV_LEG_W * DRV_SCALE);
      const mDLegL = new THREE.Mesh(gDLegL, mDark);
      mDLegL.position.set(-(AV_LEG_SEP + AV_LEG_W * DRV_SCALE * 0.5), DRV_LEG_CTR, 0.03 * HEX_R);
      driverGroup.add(mDLegL);

      // Right leg
      const gDLegR = new THREE.BoxGeometry(AV_LEG_W * DRV_SCALE, DRV_LEG_H, AV_LEG_W * DRV_SCALE);
      const mDLegR = new THREE.Mesh(gDLegR, mDark);
      mDLegR.position.set( (AV_LEG_SEP + AV_LEG_W * DRV_SCALE * 0.5), DRV_LEG_CTR, 0.03 * HEX_R);
      driverGroup.add(mDLegR);

      // Torso (cloth)
      const gDTorso = new THREE.BoxGeometry(DRV_TRS_W, DRV_TRS_H, DRV_TRS_D);
      const mDTorso = new THREE.Mesh(gDTorso, mCloth);
      mDTorso.position.set(0, DRV_TRS_CTR, 0.03 * HEX_R);
      driverGroup.add(mDTorso);

      // Owner-color sash on torso front
      const gDSash = new THREE.BoxGeometry(DRV_TRS_W * 0.85, DRV_TRS_H * 0.30, 0.012 * HEX_R);
      const mDSash = new THREE.Mesh(gDSash, mOwner);
      mDSash.position.set(0, DRV_TRS_CTR, 0.03 * HEX_R + DRV_TRS_D * 0.5 + 0.002 * HEX_R);
      driverGroup.add(mDSash);

      // Left arm (holding reins forward)
      const gDArmL = new THREE.BoxGeometry(DRV_ARM_W, DRV_ARM_H, DRV_ARM_D);
      const mDArmL = new THREE.Mesh(gDArmL, mCloth);
      mDArmL.position.set(-DRV_ARM_OX, DRV_ARM_CTR, 0.03 * HEX_R);
      driverGroup.add(mDArmL);

      // Right arm (holding reins forward)
      const gDArmR = new THREE.BoxGeometry(DRV_ARM_W, DRV_ARM_H, DRV_ARM_D);
      const mDArmR = new THREE.Mesh(gDArmR, mCloth);
      mDArmR.position.set( DRV_ARM_OX, DRV_ARM_CTR, 0.03 * HEX_R);
      driverGroup.add(mDArmR);

      // Head (skin)
      const gDHead = new THREE.BoxGeometry(DRV_HEAD_S, DRV_HEAD_S, DRV_HEAD_S);
      const mDHead = new THREE.Mesh(gDHead, mSkin);
      mDHead.position.set(0, DRV_HEAD_CTR, 0.03 * HEX_R);
      driverGroup.add(mDHead);

      // Eyes
      const dEyeZ = DRV_HEAD_S * 0.5 + 0.002 * HEX_R;
      const dEyeY = DRV_HEAD_CTR + 0.008 * HEX_R;
      const gDEyeL = new THREE.BoxGeometry(0.016 * HEX_R, 0.012 * HEX_R, 0.008 * HEX_R);
      const mDEyeL = new THREE.Mesh(gDEyeL, mat(COLOR_DARK_EYE, 0.02, 0.95));
      mDEyeL.position.set(-0.025 * HEX_R, dEyeY, 0.03 * HEX_R + dEyeZ);
      driverGroup.add(mDEyeL);

      const gDEyeR = new THREE.BoxGeometry(0.016 * HEX_R, 0.012 * HEX_R, 0.008 * HEX_R);
      const mDEyeR = new THREE.Mesh(gDEyeR, mat(COLOR_DARK_EYE, 0.02, 0.95));
      mDEyeR.position.set( 0.025 * HEX_R, dEyeY, 0.03 * HEX_R + dEyeZ);
      driverGroup.add(mDEyeR);

      // Helmet (simple bronze box) + small red crest (matches infantry/cavalry)
      const gHelm = new THREE.BoxGeometry(DRV_HEAD_S * 1.15, DRV_HEAD_S * 0.65, DRV_HEAD_S * 1.10);
      const mHelm = new THREE.Mesh(gHelm, mBronze);
      mHelm.position.set(0, DRV_HEAD_CTR + DRV_HEAD_S * 0.55, 0.03 * HEX_R);
      driverGroup.add(mHelm);
      const gDCrest = new THREE.BoxGeometry(0.020 * HEX_R, 0.050 * HEX_R, 0.080 * HEX_R);
      const mDCrest = new THREE.Mesh(gDCrest, mat(COLOR_RED_VIV, 0.08, 0.74));
      mDCrest.position.set(0, DRV_HEAD_CTR + DRV_HEAD_S * 0.55 + 0.045 * HEX_R, 0.03 * HEX_R);
      driverGroup.add(mDCrest);

      // Reins: thin strips from hands forward to horses
      const gRein = new THREE.BoxGeometry(0.12 * HEX_R, 0.008 * HEX_R, 0.008 * HEX_R);
      const mRein = new THREE.Mesh(gRein, mDark);
      mRein.rotation.y = Math.PI * 0.5;
      mRein.position.set(0, DRV_ARM_CTR, 0.03 * HEX_R - DRV_TRS_D * 0.5 - 0.06 * HEX_R);
      driverGroup.add(mRein);

      // Bronze-age chariots carried a bow-case + quiver lashed to the car side.
      const mQuiverC = mat(COLOR_LEATHER, 0.05, 0.85);
      const gBowCase = new THREE.BoxGeometry(0.030 * HEX_R, 0.16 * HEX_R, 0.030 * HEX_R);
      const mBowCase = new THREE.Mesh(gBowCase, mQuiverC);
      mBowCase.rotation.z = 0.42;
      mBowCase.position.set(0.150 * HEX_R, CAR_FLOOR_Y + 0.05 * HEX_R, 0.09 * HEX_R);
      group.add(mBowCase);
      // Arrow nocks poking from the case (owner-colour fletch)
      const rydArrGeos: THREE.BoxGeometry[] = [];
      for (const dz of [-0.010 * HEX_R, 0.010 * HEX_R]) {
        const gArr = new THREE.BoxGeometry(0.008 * HEX_R, 0.05 * HEX_R, 0.008 * HEX_R);
        rydArrGeos.push(gArr);
        const mArr = new THREE.Mesh(gArr, mOwner);
        mArr.rotation.z = 0.42;
        mArr.position.set(0.175 * HEX_R, CAR_FLOOR_Y + 0.13 * HEX_R, 0.09 * HEX_R + dz);
        group.add(mArr);
      }

      // Small owner-colour standard rising from the rear corner of the car
      const gStdPole = new THREE.BoxGeometry(0.012 * HEX_R, 0.22 * HEX_R, 0.012 * HEX_R);
      const mStdPole = new THREE.Mesh(gStdPole, mSteel);
      mStdPole.position.set(-0.135 * HEX_R, CAR_FLOOR_Y + 0.11 * HEX_R, 0.15 * HEX_R);
      group.add(mStdPole);
      const gStdFlag = new THREE.BoxGeometry(0.07 * HEX_R, 0.055 * HEX_R, 0.008 * HEX_R);
      const mStdFlag = new THREE.Mesh(gStdFlag, mOwner);
      mStdFlag.position.set(-0.135 * HEX_R - 0.035 * HEX_R, CAR_FLOOR_Y + 0.19 * HEX_R, 0.15 * HEX_R);
      group.add(mStdFlag);

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = [
        gWheelL, gRimL, gWheelR, gRimR, ...spokeGeos, gAxle, gFloor,
        gFrontWall, gSideL, gSideR, gFwTrim,
        gPole, gYoke, gRein, gBowCase, gStdPole, gStdFlag, ...rydArrGeos,
        gDLegL, gDLegR, gDTorso, gDSash, gDArmL, gDArmR, gDHead, gDEyeL, gDEyeR, gHelm, gDCrest
      ];

      // FACING FIX (rydwan): spin the whole chariot 180 deg about Y so the
      // horse team's heads point toward the viewer (+Z) and the open car sits
      // behind them. The driver (in driverGroup, pre-spun 180 deg) cancels this
      // and keeps facing the viewer. Y-rotation preserves the y=0 ground plane.
      group.rotation.y = Math.PI;
      return group;
    }


    // -----------------------------------------------------------------------
    case 'super': {
      // Elite royal guard: gilded muscled cuirass with gold trim + leather
      // pteruges, a polished helmet crowned by a tall horsehair plume in the
      // owner colour, a flowing crimson cloak, a round gold-rimmed guard shield
      // and an upright spear, greaves, plus a tall owner standard.
      // Vividness pass: deep CRIMSON tunic + flowing crimson cloak against
      // BRIGHT GILT armour — a saturated royal red-and-gold that clearly outranks
      // the line units.
      const { group, mats } = buildBaseAvatar(COLOR_SKIN, COLOR_CRIMSON, ownerColor_);
      const mat = makeMatFactory(mats);

      const mGold   = mat(COLOR_GOLD_BR,   0.58, 0.32);
      const mGoldLt = mat(COLOR_BRONZE_LT, 0.58, 0.32);
      const mSteel  = mat(COLOR_STEEL,     0.50, 0.40);
      const mCloak  = mat(COLOR_CRIMSON,   0.08, 0.74);
      const mOwner  = mat(ownerColor_,     0.20, 0.55);
      const mPoleM  = mat(COLOR_POLE_GREY, 0.35, 0.55);
      const mWood   = mat(COLOR_WOOD,      0.05, 0.85);
      const mLeath  = mat(0x5a3c22,        0.06, 0.82);

      // Flowing crimson cloak FIRST (behind everything)
      const mCape = new THREE.Mesh(getGeoSuperCape(), mCloak);
      mCape.scale.set(1.15, 1.15, 1.0);
      mCape.position.set(0, AV_Y_TORSO_CTR - 0.01 * HEX_R, -AV_TORSO_D * 0.5 - 0.008 * HEX_R);
      mCape.rotation.x = 0.20;
      group.add(mCape);

      // Gilded muscled cuirass
      const mCuir = new THREE.Mesh(getGeoCuirassBox(), mGold);
      mCuir.scale.set(1.04, 1.04, 1.04);
      mCuir.position.set(0, AV_Y_TORSO_CTR, 0);
      group.add(mCuir);
      // Sculpted pectoral lines (bright gold trim)
      const mTrim = new THREE.Mesh(getGeoGildedTrim(), mGoldLt);
      mTrim.position.set(0, AV_Y_TORSO_CTR + 0.03 * HEX_R, 0.001 * HEX_R);
      group.add(mTrim);
      const mTrim2 = new THREE.Mesh(getGeoGildedTrim(), mGoldLt);
      mTrim2.scale.set(1.0, 0.6, 1.0);
      mTrim2.position.set(0, AV_Y_TORSO_CTR - 0.04 * HEX_R, 0.001 * HEX_R);
      group.add(mTrim2);
      // Leather pteruges below
      addPteruges(group, mLeath);

      // Gold shoulder pads
      for (const sx of [-1, 1]) {
        const sp = new THREE.Mesh(getGeoShoulderPad(), mGold);
        sp.position.set(sx * (AV_ARM_OFFSET_X - 0.005 * HEX_R), AV_Y_TORSO_TOP - 0.015 * HEX_R, 0);
        group.add(sp);
      }

      // Polished helmet (conical) + gold brow band
      const mHelm = new THREE.Mesh(getGeoConicalHelm(), mSteel);
      mHelm.position.set(0, AV_Y_HEAD_CTR + 0.030 * HEX_R, 0);
      group.add(mHelm);
      const gHelmRim = new THREE.BoxGeometry(0.165 * HEX_R, 0.020 * HEX_R, 0.165 * HEX_R);
      const mHelmRim = new THREE.Mesh(gHelmRim, mGold);
      mHelmRim.position.set(0, AV_Y_HEAD_CTR + 0.005 * HEX_R, 0);
      group.add(mHelmRim);
      // Tall WHITE feather crest (mohawk ridge) with gold accent stripes, swept up
      const mWhite = mat(COLOR_FEATHER, 0.03, 0.92);
      const mPlume = new THREE.Mesh(getGeoPlumeRidge(), mWhite);
      mPlume.position.set(0, AV_Y_HEAD_TOP + 0.090 * HEX_R, -0.004 * HEX_R);
      mPlume.rotation.x = 0.10;
      group.add(mPlume);
      // Three gold vertical accent stripes within the crest
      const supPlumeGeos: THREE.BoxGeometry[] = [];
      for (const dz of [-0.034 * HEX_R, 0.0, 0.034 * HEX_R]) {
        const gStr = new THREE.BoxGeometry(0.024 * HEX_R, 0.150 * HEX_R, 0.012 * HEX_R);
        supPlumeGeos.push(gStr);
        const mStr = new THREE.Mesh(gStr, mGoldLt);
        mStr.rotation.x = 0.10;
        mStr.position.set(0, AV_Y_HEAD_TOP + 0.090 * HEX_R, -0.004 * HEX_R + dz);
        group.add(mStr);
      }

      // Upright guard spear in the right hand
      const SPEAR_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.012 * HEX_R;
      const gSpear = new THREE.BoxGeometry(0.016 * HEX_R, 0.50 * HEX_R, 0.016 * HEX_R);
      const mSpear = new THREE.Mesh(gSpear, mWood);
      mSpear.position.set(SPEAR_X, AV_Y_LEG_BOT + 0.25 * HEX_R, 0.01 * HEX_R);
      group.add(mSpear);
      const mSpearTip = new THREE.Mesh(getGeoSpearTip(), mGoldLt);
      mSpearTip.position.set(SPEAR_X, AV_Y_LEG_BOT + 0.50 * HEX_R + 0.028 * HEX_R, 0.01 * HEX_R);
      group.add(mSpearTip);

      // Round guard shield on the left arm (owner blazon, gold rim, gold boss)
      const SHIELD_X = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.016 * HEX_R);
      const mShield = new THREE.Mesh(getGeoAspisFace(), mOwner);
      mShield.rotation.z = Math.PI / 2;
      mShield.scale.set(1.0, 0.78, 0.78);
      mShield.position.set(SHIELD_X, AV_Y_TORSO_CTR, 0.012 * HEX_R);
      group.add(mShield);
      const mShRim = new THREE.Mesh(getGeoAspisRim(), mGold);
      mShRim.rotation.z = Math.PI / 2;
      mShRim.scale.set(0.9, 0.80, 0.80);
      mShRim.position.set(SHIELD_X - 0.006 * HEX_R, AV_Y_TORSO_CTR, 0.012 * HEX_R);
      group.add(mShRim);
      const mBoss = new THREE.Mesh(getGeoShieldBoss(), mGold);
      mBoss.rotation.z = Math.PI / 2;
      mBoss.position.set(SHIELD_X + 0.014 * HEX_R, AV_Y_TORSO_CTR, 0.012 * HEX_R);
      group.add(mBoss);

      addGreaves(group, mGoldLt);

      // Tall owner standard behind the left shoulder
      const POLE_X = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.030 * HEX_R);
      const POLE_CTR_Y = AV_Y_LEG_BOT + 0.33 * HEX_R * 0.5;
      const POLE_TOP_Y = AV_Y_LEG_BOT + 0.33 * HEX_R;
      const mPole = new THREE.Mesh(getGeoBannerPole(), mPoleM);
      mPole.scale.set(1.0, 1.1, 1.0);
      mPole.position.set(POLE_X, POLE_CTR_Y, -0.02 * HEX_R);
      group.add(mPole);
      const mFlag = new THREE.Mesh(getGeoBannerFlag(), mOwner);
      mFlag.position.set(POLE_X - 0.047 * HEX_R, POLE_TOP_Y - 0.036 * HEX_R, -0.02 * HEX_R);
      group.add(mFlag);
      const gFinial = new THREE.BoxGeometry(0.024 * HEX_R, 0.024 * HEX_R, 0.024 * HEX_R);
      const mFinial = new THREE.Mesh(gFinial, mGold);
      mFinial.position.set(POLE_X, POLE_TOP_Y + 0.012 * HEX_R, -0.02 * HEX_R);
      group.add(mFinial);

      addBoots(group, mLeath);
      addHands(group, mat(COLOR_SKIN, 0.05, 0.80));

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = [gHelmRim, gSpear, gFinial, ...supPlumeGeos];
      return group;
    }

    // -----------------------------------------------------------------------
    case 'zwiadowca': {
      // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p1-rdzen.ts).
      return buildZwiadowcaOpus5(ownerColor_);
    }

    // -----------------------------------------------------------------------
    case 'robotnik': {
      // Worker/labourer: plain belted work tunic with rolled sleeves, a simple
      // cloth cap, a tool belt, and a PICKAXE shouldered in the right hand.
      // No weapon, no armour -- clearly a civilian builder.
      // Vividness pass: a warmer, more saturated SIENNA/clay work-tunic (was a
      // washed-out tan) so the worker reads as humble dyed cloth, plainly civilian
      // and distinct from the blue-clad settler and every soldier.
      const { group, mats } = buildBaseAvatar(COLOR_SKIN, 0xb46a30, ownerColor_);
      const mat = makeMatFactory(mats);

      const mWood  = mat(COLOR_WOOD,    0.05, 0.85);
      const mSteel = mat(COLOR_STEEL,   0.45, 0.45);
      const mOwner = mat(ownerColor_,   0.10, 0.68);
      const mCap   = mat(0x8a6a40,      0.05, 0.88);
      const mLeath = mat(COLOR_LEATHER, 0.05, 0.85);

      // Cloth cap
      const gCap = new THREE.BoxGeometry(0.145 * HEX_R, 0.045 * HEX_R, 0.145 * HEX_R);
      const mCapM = new THREE.Mesh(gCap, mCap);
      mCapM.position.set(0, AV_Y_HEAD_TOP + 0.012 * HEX_R, 0);
      group.add(mCapM);

      // Tool belt with owner-colour buckle
      const gBelt = new THREE.BoxGeometry(0.195 * HEX_R, 0.026 * HEX_R, 0.115 * HEX_R);
      const mBelt = new THREE.Mesh(gBelt, mLeath);
      mBelt.position.set(0, AV_Y_TORSO_BOT + 0.03 * HEX_R, 0);
      group.add(mBelt);
      const gBuck = new THREE.BoxGeometry(0.03 * HEX_R, 0.03 * HEX_R, 0.014 * HEX_R);
      const mBuck = new THREE.Mesh(gBuck, mOwner);
      mBuck.position.set(0, AV_Y_TORSO_BOT + 0.03 * HEX_R, AV_TORSO_D * 0.5 + 0.006 * HEX_R);
      group.add(mBuck);

      // Pickaxe shouldered: angled handle resting on the right shoulder + head
      const PX = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.010 * HEX_R;
      const mHandle = new THREE.Mesh(getGeoPickHandle(), mWood);
      mHandle.rotation.z = -0.55;
      mHandle.position.set(PX + 0.02 * HEX_R, AV_Y_TORSO_CTR + 0.10 * HEX_R, 0.02 * HEX_R);
      group.add(mHandle);
      // Pick head (crossing bar) up near the top of the handle
      const headX = PX + 0.02 * HEX_R + Math.sin(0.55) * 0.15 * HEX_R;
      const headY = AV_Y_TORSO_CTR + 0.10 * HEX_R + Math.cos(0.55) * 0.15 * HEX_R;
      const mHead = new THREE.Mesh(getGeoPickHead(), mSteel);
      mHead.rotation.z = -0.55 + Math.PI / 2;
      mHead.position.set(headX, headY, 0.02 * HEX_R);
      group.add(mHead);

      addBoots(group, mLeath);
      addHands(group, mat(COLOR_SKIN, 0.05, 0.80));

      group.userData['mats'] = mats;
      group.userData['perTokenGeos'] = [gCap, gBelt, gBuck];
      return group;
    }

    // -----------------------------------------------------------------------
    case 'galera': {
      // GRAFIKA-JEDNOSTKI 2b: deleguje do bespoke modelu (galera-model.ts) —
      // oko apotropaiczne, trójzębny taran, żagiel z emblematem gracza, 8
      // wioseł/burta, 2 marynarzy, aplustre. Stary token (hull/mast/oars
      // ad-hoc powyżej) zastąpiony 1:1 (interfejs HULL_Y/dziób na -Z bez zmian).
      return newBuildGalera(ownerColor_);
    }

    // -----------------------------------------------------------------------
    case 'obleznicza': {
      // Kategoria fallback dla machin oblężniczych (trafia tu tylko gdy brak
      // unitName; normalnie dispatch po nazwie w buildNamedUnit obsługuje to).
      return buildBatteringRam(ownerColor_);
    }

    // -----------------------------------------------------------------------
    case 'domyslny':
    default: {
      // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p1-rdzen.ts).
      return buildWojownikOpus5(ownerColor_);
    }
  }
}

// ===========================================================================
// SUPER-UNIT BUILDERS (per-culture elite guards) — visually DISTINCT
//
// All seven share the R6 avatar skeleton, a banner standard and consistent
// proportions, but each gets a culture-specific body colour, headgear,
// shield and primary weapon so e.g. the Zulu "uThulwana" and the Roman
// "Evocati" are unmistakably different.  Only invoked when buildUnitModel is
// called WITH a unitName (the gallery + any future named call); the no-name
// path still uses the generic 'super' case for zero regression.
// ===========================================================================

/** Common helper: tall owner standard behind the left shoulder (shared geos). */
function addSuperBanner(group: THREE.Group, mPole: THREE.MeshStandardMaterial,
                        mFlag: THREE.MeshStandardMaterial, mFin: THREE.MeshStandardMaterial,
                        perGeo: THREE.BufferGeometry[]): void {
  const POLE_X = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.030 * HEX_R);
  const POLE_CTR_Y = AV_Y_LEG_BOT + 0.33 * HEX_R * 0.5;
  const POLE_TOP_Y = AV_Y_LEG_BOT + 0.33 * HEX_R;
  const mP = new THREE.Mesh(getGeoBannerPole(), mPole);
  mP.scale.set(1.0, 1.1, 1.0);
  mP.position.set(POLE_X, POLE_CTR_Y, -0.02 * HEX_R);
  group.add(mP);
  const mF = new THREE.Mesh(getGeoBannerFlag(), mFlag);
  mF.position.set(POLE_X - 0.047 * HEX_R, POLE_TOP_Y - 0.036 * HEX_R, -0.02 * HEX_R);
  group.add(mF);
  const gFin = new THREE.BoxGeometry(0.024 * HEX_R, 0.024 * HEX_R, 0.024 * HEX_R);
  perGeo.push(gFin);
  const mFn = new THREE.Mesh(gFin, mFin);
  mFn.position.set(POLE_X, POLE_TOP_Y + 0.012 * HEX_R, -0.02 * HEX_R);
  group.add(mFn);
}

/**
 * Dispatch a super-unit by culture.  Falls back to the generic super model
 * (via buildCategoryModel) for an unrecognised culture so the function is
 * always safe.
 */
function buildSuperUnit(culture: Culture, ownerColor_: number, _name: string): THREE.Group {
  switch (culture) {
    // GRAFIKA-JEDNOSTKI 2b — FIX TRIARI: 'rzym' obejmuje DWIE super-jednostki
    // (Evocati i Triari); dawniej zawsze zwracał Evocati bo _name był
    // ignorowany. Rozróżniamy po nazwie -- Triari dostaje własny bespoke model.
    case 'rzym':   return normName(_name).includes('triari') ? buildTriari(ownerColor_) : buildSuperRome(ownerColor_);
    case 'grecja': return buildSuperGreece(ownerColor_);
    // 'chiny'/'zulu'/'inka'/'egipt'/'sumer' USUNIĘTE (R-BRAZ-SUPER-DISPATCH-Q1=A,
    // Maciej 2026-08-06: "nowe wprowadzamy, stare usuwamy") — te 5 kultur ma
    // dziś dedykowane, naprawione modele (buildHuBenWei/buildUThulwana/
    // buildInkaRoyalGuard/buildMedjay/buildSumerianRoyalGuard) przechwytywane
    // WCZEŚNIEJ w buildNamedUnit() przez SUPER_Z_MODELEM_NAZWANYM, więc ta
    // gałąź nigdy by ich nie zobaczyła — usunięto zamiast zostawić martwą.
    // GRAFIKA-JEDNOSTKI 2b — FIX ROUTINGU GERMANA (dopisek 3/3): "Wojownik
    // germański" SUPER dostaje bespoke model zamiast generycznego super.
    case 'germanie': return buildGermanSuper(ownerColor_);
    default:       return buildCategoryModel('super', ownerColor_);
  }
}

// --- Evocati (Rome) -------------------------------------------------------
// Roman red tunic, ornate BRONZE galea (bowl + domed cap + red transverse
// crest), gold-trimmed rectangular SCUTUM, gladius in hand + sheathed sword.
// --- Triari (Rome) ---
function buildSuperRome(ownerColor_: number): THREE.Group {
  // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p6-super.ts).
  return newBuildSuperRome(ownerColor_);
}

// --- Hieros Lochos (Greece, Sacred Band) ----------------------------------
// Bronze hoplite panoply: Corinthian helm + TALL crimson crest, blue/crimson
// cloak, large round bronze-rimmed ASPIS, long dory spear.
function buildSuperGreece(ownerColor_: number): THREE.Group {
  // GRAFIKA-JEDNOSTKI: deleguje do bespoke modelu (jednostki-p6-super.ts).
  return newBuildSuperGreece(ownerColor_);
}

// ===========================================================================
// BESPOKE NAMED UNITS — batch 3: Sumer (Gwardia Królewska), Chiny (Hu Ben Wei),
//   Zulus (uThulwana), Inka (Królewska Gwardia)
// ===========================================================================

// --- Sumeryjska Gwardia Królewska (Sumerian Royal Guard / Gwardia Królewska Sumeru) ---
/**
 * Elitarna gwardia qurubuti — cięższa od zwykłego włócznika sumeryjskiego:
 *  • wysoki STOŻKOWY hełm brązowo-miedziany (wyższy niż u zwykłego włócznika)
 *  • DŁUGA WŁÓCZNIA z liściowatym grotem (dłuższa niż standardowa)
 *  • PROSTOKĄTNA TARCZA WIEŻOWA (duża, ownerColor + miedziany obramek)
 *  • PELERYNA kaunakes (tufts) — ownerColor zamiast tealu
 *  • SIERPOWATY MIECZ (sappara) u biodra — unikalny detal
 *  • naramienniki + nagolenniki miedziane
 */
function buildSumerianRoyalGuard(ownerColor_: number): THREE.Group {
  const { group, mats } = buildBaseAvatar(COLOR_SKIN, 0xb06a3a, ownerColor_);
  const mat = makeMatFactory(mats);
  const mCopper = mat(0xb06a3a,        0.48, 0.38);   // copper
  const mCopL   = mat(0xd09848,        0.58, 0.28);   // bright copper
  const mDark   = mat(0x5a3010,        0.25, 0.65);
  const mOwner  = mat(ownerColor_,     0.12, 0.66);
  const mWood   = mat(COLOR_WOOD,      0.05, 0.85);
  const mSteel  = mat(COLOR_STEEL,     0.50, 0.40);
  const perGeo: THREE.BufferGeometry[] = [];

  // PELERYNA kaunakes (tufted, ownerColor zamiast teal — wyróżnik gwardii)
  const gCape = new THREE.BoxGeometry(0.16 * HEX_R, 0.24 * HEX_R, 0.012 * HEX_R);
  perGeo.push(gCape);
  const mCape = new THREE.Mesh(gCape, mOwner);
  mCape.position.set(0, AV_Y_TORSO_CTR - 0.01 * HEX_R, -AV_TORSO_D * 0.5 - 0.008 * HEX_R);
  mCape.rotation.x = 0.14;
  group.add(mCape);
  // Tuft-pasy na pelerynie (ciemne poziome linie)
  for (const dy of [0.09, 0.03, -0.03, -0.09]) {
    const gT = new THREE.BoxGeometry(0.16 * HEX_R, 0.014 * HEX_R, 0.014 * HEX_R);
    perGeo.push(gT);
    const mT = new THREE.Mesh(gT, mDark);
    mT.position.set(0, AV_Y_TORSO_CTR + dy * HEX_R, -AV_TORSO_D * 0.5 - 0.009 * HEX_R);
    group.add(mT);
  }

  // Miedziany cuirass lamellarowy
  const mCuir = new THREE.Mesh(getGeoCuirassBox(), mCopper);
  mCuir.scale.set(1.04, 1.02, 1.04);
  mCuir.position.set(0, AV_Y_TORSO_CTR, 0);
  group.add(mCuir);
  for (const dy of [0.07, 0.0, -0.07]) {
    const b = new THREE.Mesh(getGeoLoricaBand(), mDark);
    b.position.set(0, AV_Y_TORSO_CTR + dy * HEX_R, 0.004 * HEX_R);
    group.add(b);
  }
  // Naramienniki
  for (const sx of [-1, 1]) {
    const sp = new THREE.Mesh(getGeoShoulderPad(), mCopL);
    sp.position.set(sx * (AV_ARM_OFFSET_X - 0.005 * HEX_R), AV_Y_TORSO_TOP - 0.015 * HEX_R, 0);
    group.add(sp);
  }

  // WYSOKI STOŻKOWY HEŁM miedziano-brązowy (wyższy niż u zwykłego włócznika)
  // NAPRAWA 2026-08-06 — HEŁM POŁYKAŁ CAŁĄ GŁOWĘ. Stożek przy skali (1.10, 1.45,
  // 1.10) ma dolny promień 0.094 (głowa: połowa boku 0.065) i spód na y = 0.510,
  // czyli PONIŻEJ linii oczu (0.525) — z kąta gry widać było brązową bryłę bez
  // twarzy. Do tego obręcz 0.175 × 0.175 na wysokości oczu dokładała z góry
  // beżową „płytę" (efekt opisany przy opasce uThulwany).
  // Teraz stożek jest węższy u podstawy i podniesiony ponad linię oczu, a obręcz
  // jest płytka i wsunięta w czaszkę.
  // Hełm w JASNEJ miedzi — kirys jest w miedzi ciemnej, więc głowa odcina się
  // od korpusu (dawniej oba na mCopper = jednolita brązowa bryła).
  const mHelm = new THREE.Mesh(getGeoConicalHelm(), mCopL);
  mHelm.scale.set(0.94, 1.50, 0.94);   // dolny promień 0.080, wysokość 0.135
  mHelm.position.set(0, AV_Y_HEAD_CTR + 0.100 * HEX_R, 0);
  group.add(mHelm);
  // Obręcz hełmu — nad brwiami, płytsza niż głowa.
  const gBrow = new THREE.BoxGeometry(0.164 * HEX_R, 0.022 * HEX_R, 0.144 * HEX_R);
  perGeo.push(gBrow);
  const mBrow = new THREE.Mesh(gBrow, mCopL);
  mBrow.position.set(0, AV_Y_HEAD_CTR + 0.042 * HEX_R, -0.004 * HEX_R);
  group.add(mBrow);
  // Czarna broda sumeryjska — charakterystyczny detal, oddziela twarz od kolczugi.
  const gBeard = new THREE.BoxGeometry(0.072 * HEX_R, 0.052 * HEX_R, 0.024 * HEX_R);
  perGeo.push(gBeard);
  const mBeard = new THREE.Mesh(gBeard, mDark);
  mBeard.position.set(0, AV_Y_HEAD_CTR - 0.040 * HEX_R, AV_HEAD_S * 0.5 + 0.004 * HEX_R);
  group.add(mBeard);

  // DŁUGA WŁÓCZNIA (dłuższa od standardowej — pełna wysokość super+)
  // NAPRAWA 2026-08-06: przy grocie na 0.62 cała sylwetka kończyła się na
  // 0.661 × HEX_R, czyli poniżej konwencyjnych ~0.75. Drzewce wydłużone
  // z 0.60 na 0.68 — grot wychodzi ponad hełm i jednostka czyta się jako
  // włócznik, a nie jako niska bryła.
  const SP_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.016 * HEX_R;
  const SP_BOT = AV_Y_LEG_BOT + 0.00 * HEX_R;
  const gShaft = new THREE.BoxGeometry(0.016 * HEX_R, 0.68 * HEX_R, 0.016 * HEX_R);
  perGeo.push(gShaft);
  const mShaft = new THREE.Mesh(gShaft, mWood);
  mShaft.position.set(SP_X, SP_BOT + 0.34 * HEX_R, 0.01 * HEX_R);
  group.add(mShaft);
  const mTip = new THREE.Mesh(getGeoSpearTip(), mCopL);
  mTip.scale.set(1.2, 1.5, 1.2);
  mTip.position.set(SP_X, SP_BOT + 0.712 * HEX_R, 0.01 * HEX_R);
  group.add(mTip);
  // Kolec stopki
  const gButt = new THREE.BoxGeometry(0.012 * HEX_R, 0.030 * HEX_R, 0.012 * HEX_R);
  perGeo.push(gButt);
  const mButt = new THREE.Mesh(gButt, mCopper);
  mButt.position.set(SP_X, SP_BOT - 0.015 * HEX_R, 0.01 * HEX_R);
  group.add(mButt);

  // SIERPOWATY MIECZ (sappara) u biodra — unikalny detal
  const SWX = AV_ARM_OFFSET_X * 0.3;
  const gBlade = new THREE.BoxGeometry(0.040 * HEX_R, 0.090 * HEX_R, 0.010 * HEX_R);
  perGeo.push(gBlade);
  const mBlade = new THREE.Mesh(gBlade, mSteel);
  mBlade.rotation.z = -0.45;
  mBlade.position.set(SWX, AV_Y_TORSO_BOT + 0.04 * HEX_R, AV_TORSO_D * 0.5 + 0.012 * HEX_R);
  group.add(mBlade);

  // PROSTOKĄTNA TARCZA WIEŻOWA (duża, ownerColor + miedziany obramek)
  // NAPRAWA 2026-08-06: tarcza stała na z = 0.014, więc chowała się w linii
  // przedramienia i korpusu; wysunięta przed rękę czyta się jako tarcza.
  const SH_X = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.022 * HEX_R);
  const SH_Y = AV_Y_TORSO_CTR + 0.02 * HEX_R;
  const SH_Z = 0.046 * HEX_R;
  const gSh = new THREE.BoxGeometry(0.148 * HEX_R, 0.270 * HEX_R, 0.018 * HEX_R);
  perGeo.push(gSh);
  const mSh = new THREE.Mesh(gSh, mOwner);
  mSh.position.set(SH_X, SH_Y, SH_Z);
  group.add(mSh);
  for (const [w, h, ox, oy] of [
    [0.148, 0.018, 0,      0.126], [0.148, 0.018, 0, -0.126],
    [0.018, 0.270, 0.065,  0   ], [0.018, 0.270, -0.065, 0  ],
  ] as const) {
    const gBar = new THREE.BoxGeometry(w * HEX_R, h * HEX_R, 0.022 * HEX_R);
    perGeo.push(gBar);
    const mBar = new THREE.Mesh(gBar, mCopL);
    mBar.position.set(SH_X + ox * HEX_R, SH_Y + oy * HEX_R, SH_Z + 0.004 * HEX_R);
    group.add(mBar);
  }

  addGreaves(group, mCopL);
  addSuperBanner(group, mat(COLOR_POLE_GREY, 0.35, 0.55), mOwner, mCopL, perGeo);
  addBoots(group, mat(0x5a3c22, 0.06, 0.82));
  addHands(group, mat(COLOR_SKIN, 0.05, 0.80));

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = perGeo;
  return group;
}

// --- Hu Ben Wei (China, Tiger Guard / Gwardia Tygrysa) -------------------
/**
 * Elitarna gwardia cesarska — bardziej ozdobna niż zwykła piechota chińska:
 *  • pancerz LAMELOWY z ciemnych płytek + CZERWONE wiązania (zamiast czarnych)
 *  • motyw TYGRYSA: duży pomarańczowo-czarny pysk na tarczy
 *  • HALABARDA ji (drzewce + szerokie ostrze + kolec) lub dao w prawej ręce
 *  • hełm z PIÓROPUSZEM (czerwono-złoty) + złota obręcz
 *  • paski tygrysie na ramionach (pomarańcz+czarny)
 *  • ownerColor na naramiennikach i pióropuszu
 */
function buildHuBenWei(ownerColor_: number): THREE.Group {
  const { group, mats } = buildBaseAvatar(COLOR_SKIN, COLOR_LACQUER, ownerColor_);
  const mat = makeMatFactory(mats);
  const mLac    = mat(COLOR_LACQUER,   0.22, 0.42);   // ciemnoczerwony lamellar
  const mRed    = mat(COLOR_RED_VIV,   0.08, 0.76);   // czerwone wiązania (zamiast czarnych w superChina)
  const mTigOr  = mat(0xe07820,        0.15, 0.72);   // tygrys-pomarańczowy
  const mBlack  = mat(0x1c1712,        0.16, 0.58);   // czarne paski
  const mBrass  = mat(0xc9a23a,        0.55, 0.34);   // mosiądz hełmu
  const mSteel  = mat(COLOR_STEEL,     0.55, 0.34);
  const mOwner  = mat(ownerColor_,     0.16, 0.62);
  const mWood   = mat(COLOR_WOOD,      0.05, 0.85);
  const perGeo: THREE.BufferGeometry[] = [];

  // PANCERZ LAMELOWY — lamel ciemnoczerwony + czerwone wiązania
  const mCuir = new THREE.Mesh(getGeoCuirassBox(), mLac);
  mCuir.scale.set(1.04, 1.04, 1.04);
  mCuir.position.set(0, AV_Y_TORSO_CTR, 0);
  group.add(mCuir);
  for (const dy of [0.07, 0.0, -0.07]) {
    const b = new THREE.Mesh(getGeoLoricaBand(), mRed);  // czerwone wiązania
    b.position.set(0, AV_Y_TORSO_CTR + dy * HEX_R, 0.005 * HEX_R);
    group.add(b);
  }
  // Paski tygrysie na ramieniu (pomarańcz + czarne pasy)
  for (const sx of [-1, 1]) {
    const sp = new THREE.Mesh(getGeoShoulderPad(), mOwner);
    sp.position.set(sx * (AV_ARM_OFFSET_X - 0.005 * HEX_R), AV_Y_TORSO_TOP - 0.015 * HEX_R, 0);
    group.add(sp);
    // dwa czarne paski na naramienniku
    for (const dt of [-0.012, 0.012]) {
      const gS = new THREE.BoxGeometry(0.07 * HEX_R, 0.012 * HEX_R, 0.072 * HEX_R);
      perGeo.push(gS);
      const mS = new THREE.Mesh(gS, mBlack);
      mS.position.set(sx * (AV_ARM_OFFSET_X - 0.005 * HEX_R), AV_Y_TORSO_TOP - 0.015 * HEX_R + dt * HEX_R, 0);
      group.add(mS);
    }
  }
  addPteruges(group, mRed);

  // HEŁM mosiężny (kopuła + szerokie rondo + szpic) + PIÓROPUSZ
  // NAPRAWA 2026-08-06 — HEŁM ZASŁANIAŁ TWARZ. Kopuła miała dolny promień 0.088
  // (głowa ma połowę boku 0.065) i spód na y = 0.497, czyli NIŻEJ niż linia oczu
  // (0.525) — twarzy nie było widać wcale, a rondo 0.168 × 0.168 leżące dokładnie
  // na wysokości oczu dokładało z góry beżową „płytę" (patrz opis efektu przy
  // opasce uThulwany). Teraz kopuła siedzi wyżej i jest węższa, a rondo jest
  // PŁYTKIE i cofnięte, więc oczy zostają odsłonięte.
  const gDome = new THREE.CylinderGeometry(0.062 * HEX_R, 0.080 * HEX_R, 0.082 * HEX_R, 10, 1);
  perGeo.push(gDome);
  const mDome = new THREE.Mesh(gDome, mBrass);
  mDome.position.set(0, AV_Y_HEAD_CTR + 0.062 * HEX_R, 0);
  group.add(mDome);
  // Rondo hełmu — cienkie, tuż nad brwiami, płytsze niż głowa (nie robi „stołu").
  const gBrow = new THREE.BoxGeometry(0.170 * HEX_R, 0.018 * HEX_R, 0.140 * HEX_R);
  perGeo.push(gBrow);
  const mBrow = new THREE.Mesh(gBrow, mBrass);
  mBrow.position.set(0, AV_Y_HEAD_CTR + 0.041 * HEX_R, -0.004 * HEX_R);
  group.add(mBrow);
  // Szpic na szczycie hełmu (typowy dla chińskich hełmów lamelkowych).
  const gSpike = new THREE.BoxGeometry(0.020 * HEX_R, 0.038 * HEX_R, 0.020 * HEX_R);
  perGeo.push(gSpike);
  const mSpike = new THREE.Mesh(gSpike, mBrass);
  mSpike.position.set(0, AV_Y_HEAD_CTR + 0.122 * HEX_R, 0);
  group.add(mSpike);
  // PIÓROPUSZ wysoki (ownerColor + pomarańcz) — osadzony na szpicu.
  for (const ax of [-0.30, 0.0, 0.30]) {
    const gP = new THREE.BoxGeometry(0.022 * HEX_R, 0.130 * HEX_R, 0.012 * HEX_R);
    perGeo.push(gP);
    const col = (ax === 0) ? mOwner : mTigOr;
    const mP = new THREE.Mesh(gP, col);
    mP.rotation.z = ax;
    mP.position.set(Math.sin(ax) * 0.04 * HEX_R, AV_Y_HEAD_CTR + 0.190 * HEX_R, -0.006 * HEX_R);
    group.add(mP);
  }

  // HALABARDA JI — drzewce + poziome ostrze + pionowy kolec
  const SP_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.016 * HEX_R;
  const gShaft = new THREE.BoxGeometry(0.016 * HEX_R, 0.56 * HEX_R, 0.016 * HEX_R);
  perGeo.push(gShaft);
  const mShaft = new THREE.Mesh(gShaft, mWood);
  mShaft.position.set(SP_X, AV_Y_LEG_BOT + 0.28 * HEX_R, 0.01 * HEX_R);
  group.add(mShaft);
  // Główne ostrze halabardowe (pionowy szpic) — NAPRAWA 2026-08-06: było
  // 0.010 × 0.085, czyli cieńsze niż drzewce (0.016) i z kąta gry ginęło.
  const gBlade = new THREE.BoxGeometry(0.016 * HEX_R, 0.110 * HEX_R, 0.014 * HEX_R);
  perGeo.push(gBlade);
  const mBlade = new THREE.Mesh(gBlade, mSteel);
  mBlade.position.set(SP_X, AV_Y_LEG_BOT + 0.60 * HEX_R, 0.01 * HEX_R);
  group.add(mBlade);
  // Boczne ostrze halabardowe (poziome, znak rozpoznawczy ji) — powiększone,
  // bo to ono odróżnia ji od zwykłej włóczni.
  const gSideBl = new THREE.BoxGeometry(0.078 * HEX_R, 0.024 * HEX_R, 0.012 * HEX_R);
  perGeo.push(gSideBl);
  const mSideBl = new THREE.Mesh(gSideBl, mSteel);
  mSideBl.position.set(SP_X + 0.031 * HEX_R, AV_Y_LEG_BOT + 0.565 * HEX_R, 0.01 * HEX_R);
  group.add(mSideBl);
  // Czerwony tassel
  const gTas = new THREE.BoxGeometry(0.028 * HEX_R, 0.046 * HEX_R, 0.028 * HEX_R);
  perGeo.push(gTas);
  const mTas = new THREE.Mesh(gTas, mRed);
  mTas.position.set(SP_X, AV_Y_LEG_BOT + 0.52 * HEX_R, 0.01 * HEX_R);
  group.add(mTas);

  // TARCZA z MOTYWEM TYGRYSA — ownerColor tło + pomarańczowy pysk tygrysa
  // NAPRAWA 2026-08-06: tarcza leżała na z = 0.012, czyli w tej samej głębokości
  // co pancerz, i przy „czerwonym" właścicielu zlewała się z lakierowanym
  // pancerzem w jedną plamę. Teraz jest WYSUNIĘTA PRZED przedramię i ma CZARNĄ
  // LAKIEROWANĄ OBWÓDKĘ, więc odcina się od korpusu przy każdym kolorze gracza;
  // pysk tygrysa (motyw dający nazwę jednostce) powiększony z 0.080 na 0.100.
  const SH_X = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.020 * HEX_R);
  const SH_Z = 0.046 * HEX_R;
  const gShRim = new THREE.BoxGeometry(0.146 * HEX_R, 0.226 * HEX_R, 0.014 * HEX_R);
  perGeo.push(gShRim);
  const mShRim = new THREE.Mesh(gShRim, mBlack);
  mShRim.position.set(SH_X, AV_Y_TORSO_CTR, SH_Z - 0.004 * HEX_R);
  group.add(mShRim);
  const gSh = new THREE.BoxGeometry(0.130 * HEX_R, 0.210 * HEX_R, 0.016 * HEX_R);
  perGeo.push(gSh);
  const mSh = new THREE.Mesh(gSh, mOwner);
  mSh.position.set(SH_X, AV_Y_TORSO_CTR, SH_Z);
  group.add(mSh);
  // Pysk tygrysa (pomarańczowy prostokąt + czarne paski)
  const gFace = new THREE.BoxGeometry(0.100 * HEX_R, 0.100 * HEX_R, 0.014 * HEX_R);
  perGeo.push(gFace);
  const mFace = new THREE.Mesh(gFace, mTigOr);
  mFace.position.set(SH_X, AV_Y_TORSO_CTR + 0.01 * HEX_R, SH_Z + 0.008 * HEX_R);
  group.add(mFace);
  for (const dy of [0.028, -0.028]) {
    const gSt = new THREE.BoxGeometry(0.100 * HEX_R, 0.014 * HEX_R, 0.014 * HEX_R);
    perGeo.push(gSt);
    const mSt = new THREE.Mesh(gSt, mBlack);
    mSt.position.set(SH_X, AV_Y_TORSO_CTR + dy * HEX_R + 0.01 * HEX_R, SH_Z + 0.012 * HEX_R);
    group.add(mSt);
  }

  addSuperBanner(group, mat(COLOR_POLE_GREY, 0.35, 0.55), mOwner, mBrass, perGeo);
  addBoots(group, mBlack);
  addHands(group, mat(COLOR_SKIN, 0.05, 0.80));

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = perGeo;
  return group;
}

// --- uThulwana (Zulu, White Shields / Białe Tarcze) -----------------------
/**
 * Elitarny pułk uThulwana — bardziej ozdobny niż zwykły wojownik Zulu:
 *  • DUŻA BIAŁA owalna tarcza isihlangu (większa niż standardowa Nguni)
 *  • IKLWA (krótka, szeroka, kłująca) + KNOBKERRIE (maczuga knotted) u pasa
 *  • opaska z futra (isigqoko) + PIÓRO ŻURAWIA (nkwe) na głowie
 *  • ozdoby z KROWICH OGONÓW na ramionach i nogach (biało-brązowe tufty)
 *  • ownerColor na bandolierze + uchwycie knobkerrie
 */
function buildUThulwana(ownerColor_: number): THREE.Group {
  // NAPRAWA 2026-08-06: drugim argumentem buildBaseAvatar jest kolor TKANINY,
  // którą kryte są tors, ramiona i szyja. Podanie COLOR_HIDE_RED ubierało
  // Zulusa w czerwoną tunikę z długimi rękawami — a uThulwana walczyli z GOŁYM
  // torsem (zbroi nie nosili wcale). Kolor skóry daje nagi tors; przepaskę
  // biodrową (ochra) dokłada getGeoLoincloth niżej.
  const { group, mats } = buildBaseAvatar(COLOR_SKIN_DARK, COLOR_SKIN_DARK, ownerColor_);
  const mat = makeMatFactory(mats);
  const mOchre  = mat(COLOR_HIDE_RED,  0.06, 0.84);
  const mWhite  = mat(COLOR_PAINT_WHT, 0.03, 0.94);
  const mBlack  = mat(0x1e1610,        0.05, 0.86);
  const mFur    = mat(COLOR_FUR,       0.08, 0.82);
  const mWood   = mat(0x7a5030,        0.05, 0.85);
  const mOwner  = mat(ownerColor_,     0.12, 0.66);
  const perGeo: THREE.BufferGeometry[] = [];

  // Lędźwiowy (ochre) + ownerColor bandolier skośny przez pierś
  const mLoin = new THREE.Mesh(getGeoLoincloth(), mOchre);
  mLoin.position.set(0, AV_Y_TORSO_BOT + 0.02 * HEX_R, 0);
  group.add(mLoin);
  const gBand = new THREE.BoxGeometry(0.030 * HEX_R, 0.260 * HEX_R, 0.012 * HEX_R);
  perGeo.push(gBand);
  const mBandM = new THREE.Mesh(gBand, mOwner);
  mBandM.rotation.z = 0.65;
  mBandM.position.set(0, AV_Y_TORSO_CTR, AV_TORSO_D * 0.5 + 0.007 * HEX_R);
  group.add(mBandM);

  // OZDOBY Z KROWICH OGONÓW — białe tufty na ramionach i kostkach
  for (const sx of [-AV_ARM_OFFSET_X, AV_ARM_OFFSET_X]) {
    // ramię — biały tuft
    const gT = new THREE.BoxGeometry(AV_ARM_W * 1.4, 0.052 * HEX_R, AV_ARM_D * 1.4);
    perGeo.push(gT);
    const mT = new THREE.Mesh(gT, mWhite);
    mT.position.set(sx, AV_Y_ARM_CTR - AV_ARM_H * 0.5 + 0.06 * HEX_R, 0);
    group.add(mT);
    // drugi tuft nad pierwszym
    const gT2 = new THREE.BoxGeometry(AV_ARM_W * 1.2, 0.040 * HEX_R, AV_ARM_D * 1.2);
    perGeo.push(gT2);
    const mT2 = new THREE.Mesh(gT2, mFur);
    mT2.position.set(sx, AV_Y_ARM_CTR - AV_ARM_H * 0.5 + 0.11 * HEX_R, 0);
    group.add(mT2);
  }
  // kostki — tufty z ogonów
  for (const lx of [-AV_LEG_SEP - AV_LEG_W * 0.5, AV_LEG_SEP + AV_LEG_W * 0.5]) {
    const gA = new THREE.BoxGeometry(AV_LEG_W * 1.3, 0.046 * HEX_R, AV_LEG_W * 1.3);
    perGeo.push(gA);
    const mA = new THREE.Mesh(gA, mWhite);
    mA.position.set(lx, AV_Y_LEG_BOT + 0.06 * HEX_R, 0);
    group.add(mA);
  }

  // OPASKA FUTRA (isicoco) + PIÓRO ŻURAWIA na głowie
  // NAPRAWA 2026-08-06 — „PŁYTA NA GŁOWIE". Opaska leżała NAD czubkiem głowy
  // (0.152 × 0.152 przy głowie 0.13 i grubości 0.032). Kamera gry stoi pod 52°,
  // więc patrzy na GÓRNĄ ścianę takiej płyty: pozioma płytka o głębokości g
  // rzutuje się na ekran jako dodatkowe g·cos(52°) ≈ 0.6·g „wysokości".
  // Płyta 0.152 dawała więc ~0.09 pozornej wysokości ponad swoje 0.032 i
  // czytała się jako KLOCEK zamiast opaski (to samo psuło hełm Sumeru, koronę
  // Inków i rondo Hu Ben Wei).
  // Lekarstwo: obręcz WSUNIĘTA w głowę — jej góra (0.560) jest niżej niż czubek
  // głowy (0.580), więc z góry widać skórę/włosy, a opaska pokazuje się tylko
  // jako obwódka na bokach czaszki. Dokładnie tak nosi się isicoco.
  // Kolor: CZARNY, nie futrzany brąz — COLOR_FUR jest prawie tym samym brązem
  // co COLOR_SKIN_DARK, więc opaska zlewała się z głową w jedną bryłę.
  // Kolor: CZARNY, nie futrzany brąz — COLOR_FUR jest prawie tym samym brązem
  // co COLOR_SKIN_DARK, więc opaska zlewała się z głową w jedną bryłę.
  // Wysokość: dolna krawędź (0.545) MUSI być powyżej linii oczu (0.525),
  // inaczej obręcz nasuwa się na twarz — a jej górna (0.573) poniżej czubka
  // głowy (0.580), żeby nie tworzyć „płyty" oglądanej z góry pod 52°.
  const gHat = new THREE.BoxGeometry(0.150 * HEX_R, 0.028 * HEX_R, 0.150 * HEX_R);
  perGeo.push(gHat);
  const mHat = new THREE.Mesh(gHat, mBlack);
  mHat.position.set(0, AV_Y_HEAD_CTR + 0.044 * HEX_R, 0);
  group.add(mHat);
  // Futrzany akcent isicoco na czubku (amashoba) — wąski, nie cała czapa.
  const gHatB = new THREE.BoxGeometry(0.104 * HEX_R, 0.016 * HEX_R, 0.104 * HEX_R);
  perGeo.push(gHatB);
  const mHatB = new THREE.Mesh(gHatB, mFur);
  mHatB.position.set(0, AV_Y_HEAD_TOP + 0.004 * HEX_R, 0);
  group.add(mHatB);
  // Pióro żurawia (nkwe) — wąskie, białe, lekko skośne ku tyłowi
  // NAPRAWA 2026-08-06 (D3 z recenzji Evaluatora): pióro 0.190 × HEX_R plus
  // czubek na AV_Y_HEAD_TOP + 0.205 wynosiły całą sylwetkę na 0.8057 × HEX_R,
  // przy rodzinie super-jednostek Brązu w paśmie 0.7504 (Inka) … 0.7832
  // (Gwardia Sumeru) — uThulwana była o ~0.05 × HEX_R wyższa od najwyższej
  // siostry i o 0.055 od Medżaja, przez co na mapie czytała się jako jednostka
  // z innej skali. Pióro skrócone o 0.060 (0.190 → 0.130), ale zakotwiczone
  // DOŁEM w tym samym miejscu (0.6047), więc pióropusz nadal wychodzi wyraźnie
  // ponad opaskę isicoco i zostaje cechą rozpoznawczą; skraca się tylko część
  // stercząca w pustkę. Wysokość spada do 0.7757 × HEX_R (≤ 0.78).
  const gPFeat = new THREE.BoxGeometry(0.016 * HEX_R, 0.130 * HEX_R, 0.010 * HEX_R);
  perGeo.push(gPFeat);
  const mPFeat = new THREE.Mesh(gPFeat, mWhite);
  mPFeat.rotation.z = 0.12;
  mPFeat.position.set(0.008 * HEX_R, AV_Y_HEAD_TOP + 0.090 * HEX_R, -0.018 * HEX_R);
  group.add(mPFeat);
  // Czarny czubek pióra
  const gPTip = new THREE.BoxGeometry(0.014 * HEX_R, 0.040 * HEX_R, 0.008 * HEX_R);
  perGeo.push(gPTip);
  const mPTip = new THREE.Mesh(gPTip, mBlack);
  mPTip.rotation.z = 0.12;
  mPTip.position.set(0.010 * HEX_R, AV_Y_HEAD_TOP + 0.175 * HEX_R, -0.018 * HEX_R);
  group.add(mPTip);

  // IKLWA — krótka kłująca włócznia (prawa ręka)
  const SP_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.014 * HEX_R;
  const gShaft = new THREE.BoxGeometry(0.018 * HEX_R, 0.30 * HEX_R, 0.018 * HEX_R);
  perGeo.push(gShaft);
  const mShaft = new THREE.Mesh(gShaft, mWood);
  mShaft.position.set(SP_X, AV_Y_TORSO_CTR + 0.02 * HEX_R, 0.01 * HEX_R);
  group.add(mShaft);
  const gBlade = new THREE.BoxGeometry(0.042 * HEX_R, 0.115 * HEX_R, 0.014 * HEX_R);
  perGeo.push(gBlade);
  const mBlade = new THREE.Mesh(gBlade, mat(COLOR_STEEL, 0.50, 0.40));
  mBlade.position.set(SP_X, AV_Y_TORSO_CTR + 0.02 * HEX_R + 0.152 * HEX_R + 0.058 * HEX_R, 0.01 * HEX_R);
  group.add(mBlade);

  // KNOBKERRIE (maczuga knotted) u pasa — lewa strona biodra
  const KX = -(AV_ARM_OFFSET_X * 0.5);
  const gKS = new THREE.BoxGeometry(0.014 * HEX_R, 0.120 * HEX_R, 0.014 * HEX_R);
  perGeo.push(gKS);
  const mKS = new THREE.Mesh(gKS, mWood);
  mKS.rotation.z = 0.30;
  mKS.position.set(KX, AV_Y_TORSO_BOT + 0.06 * HEX_R, 0.012 * HEX_R);
  group.add(mKS);
  const gKnob = new THREE.SphereGeometry(0.022 * HEX_R, 8, 6);
  perGeo.push(gKnob);
  const mKnob = new THREE.Mesh(gKnob, mOwner);
  mKnob.position.set(KX + 0.016 * HEX_R, AV_Y_TORSO_BOT + 0.12 * HEX_R, 0.014 * HEX_R);
  group.add(mKnob);

  // DUŻA BIAŁA OWALNA TARCZA isihlangu — znak pułku „Białe Tarcze"
  // NAPRAWA 2026-08-06 — DWA BŁĘDY NARAZ:
  //  (1) ORIENTACJA: `rotation.z = π/2` kładło oś walca na światowy X, więc lico
  //      tarczy patrzyło w bok i kamera gry (azymut 0, elewacja 52°) widziała ją
  //      DOKŁADNIE KRAWĘDZIĄ — z sylwetki wystawał biały pasek grubości 0.027
  //      i największy atrybut jednostki (tarcza w nazwie!) był niewidoczny.
  //      Poprawnie jest `rotation.x = π/2`, jak w jednostki-p6-super.ts.
  //  (2) SKALA W ZŁYCH OSIACH: scale (1.0, 1.50, 2.30) przy tamtej rotacji dawało
  //      tarczę o wysokości 0.16 i GŁĘBOKOŚCI 0.37 — czyli placek wystający do
  //      przodu i do tyłu. Dlatego czarne plamy (dy = ±0.095) i drewniany
  //      grzbiet (0.32 wysokości) wisiały POZA tarczą wysoką na 0.16.
  //      Po rotacji X skala mapuje się X → szerokość, Z → wysokość, Y → grubość,
  //      więc tarcza ma teraz 0.185 × 0.336 i plamy oraz grzbiet leżą NA niej.
  const SH_X = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.022 * HEX_R);
  const SH_Y = AV_Y_TORSO_CTR + 0.02 * HEX_R;
  const SH_Z = 0.048 * HEX_R;                      // przed przedramieniem
  const mShield = new THREE.Mesh(getGeoOvalShield(), mWhite);
  mShield.rotation.x = Math.PI / 2;
  mShield.scale.set(1.16, 1.20, 2.10);   // 0.185 szer. × 0.336 wys. × 0.022 grub.
  mShield.position.set(SH_X, SH_Y, SH_Z);
  group.add(mShield);
  // Czarne plamy na skórze (wzór plemienny uThulwana)
  for (const dy of [0.095, 0.0, -0.095]) {
    const gPatch = new THREE.BoxGeometry(0.030 * HEX_R, 0.070 * HEX_R, 0.016 * HEX_R);
    perGeo.push(gPatch);
    const mPatch = new THREE.Mesh(gPatch, mBlack);
    mPatch.position.set(SH_X - 0.036 * HEX_R, SH_Y + dy * HEX_R, SH_Z + 0.010 * HEX_R);
    group.add(mPatch);
  }
  // Drewniany kij (spine) tarczy — pionowo przez środek lica
  const gSpine = new THREE.BoxGeometry(0.018 * HEX_R, 0.320 * HEX_R, 0.016 * HEX_R);
  perGeo.push(gSpine);
  const mSpine = new THREE.Mesh(gSpine, mWood);
  mSpine.position.set(SH_X + 0.012 * HEX_R, SH_Y, SH_Z + 0.010 * HEX_R);
  group.add(mSpine);

  addSuperBanner(group, mat(0x6b4a26, 0.10, 0.70), mOwner, mWhite, perGeo);
  addBoots(group, mat(COLOR_SKIN_DARK, 0.05, 0.85));
  addHands(group, mat(COLOR_SKIN_DARK, 0.05, 0.85));

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = perGeo;
  return group;
}

// --- Inkaski Royal Guard (Królewska Gwardia Inkaów) -----------------------
/**
 * Królewska gwardia inkaskiego Sapa Inki — BOGATSZY niż buildMaceWarrior (Chaska):
 *  • PIÓROPUSZ-KORONA (kolorowe tropikalne pióra + złote elementy)
 *  • ZŁOTY DYSK SŁOŃCA (Punchao) na piersi
 *  • PIKOWANY PANCERZ z ZŁOTYMI PŁYTKAMI (ichcahuipilli ze złotem)
 *  • MACZUGA z gwiaździstą głowicą ZŁOTĄ (zamiast kamiennej jak w buildMaceWarrior)
 *  • TUMI (ofiarny nóż półksiężycowy) u pasa jako atrybut królewski
 *  • prostokątna tarcza z GEOMETRYCZNYM WZOREM (tokapu) — ownerColor
 *  • złoto i ownerColor dominują
 */
function buildInkaRoyalGuard(ownerColor_: number): THREE.Group {
  const { group, mats } = buildBaseAvatar(COLOR_SKIN_DARK, COLOR_OCHRE, ownerColor_);
  const mat = makeMatFactory(mats);
  const mOchre  = mat(COLOR_OCHRE,     0.06, 0.80);
  const mGold   = mat(COLOR_GOLD_BR,   0.62, 0.28);   // złoto jaśniejsze
  const mRed    = mat(COLOR_RED_VIV,   0.06, 0.78);
  const mTeal   = mat(COLOR_TEAL,      0.06, 0.78);
  const mGreen  = mat(COLOR_FOREST,    0.06, 0.78);
  const mFeath  = mat(COLOR_FEATHER,   0.03, 0.92);
  const mOwner  = mat(ownerColor_,     0.16, 0.62);
  const mWood   = mat(0x6b4a26,        0.05, 0.85);
  const mSteel  = mat(COLOR_STEEL,     0.50, 0.40);
  const perGeo: THREE.BufferGeometry[] = [];

  // PIKOWANY PANCERZ (ichcahuipilli) — ochre z poziomymi pasami
  // NAPRAWA 2026-08-06 — WSZYSTKO NA ZŁOTO. Ochrowy pancerz + 3 złote pasy +
  // złote naramienniki + złoty rąbek + złoty dysk + złota korona dawały bryłę
  // w jednym, jednolitym złocie: z kąta gry 52° jednostka czytała się jako
  // ZŁOTY KLOCEK bez żadnego detalu. Andyjskie tkaniny to mocne kontrasty
  // (czerwień + ochra + złoto), więc środkowy pas idzie na czerwień tkaniny —
  // złoto zostaje AKCENTEM, a nie tłem.
  const mTunic = new THREE.Mesh(getGeoCuirassBox(), mOchre);
  mTunic.scale.set(1.02, 1.04, 1.02);
  mTunic.position.set(0, AV_Y_TORSO_CTR, 0);
  group.add(mTunic);
  for (const [dy, mBand] of [[0.07, mGold], [0.0, mRed], [-0.07, mGold]] as const) {
    const gGP = new THREE.BoxGeometry(0.190 * HEX_R, 0.020 * HEX_R, 0.135 * HEX_R);
    perGeo.push(gGP);
    const mGP = new THREE.Mesh(gGP, mBand);
    mGP.position.set(0, AV_Y_TORSO_CTR + dy * HEX_R, 0.003 * HEX_R);
    group.add(mGP);
  }
  // Krawędź złota na ramionach
  for (const sx of [-1, 1]) {
    const sp = new THREE.Mesh(getGeoShoulderPad(), mGold);
    sp.position.set(sx * (AV_ARM_OFFSET_X - 0.005 * HEX_R), AV_Y_TORSO_TOP - 0.015 * HEX_R, 0);
    group.add(sp);
  }

  // ZŁOTY DYSK SŁOŃCA (Punchao) na piersi — na CIEMNOCZERWONYM polu, żeby
  // złoto miało się od czego odciąć (dawniej złoto na złocie = plama).
  // UWAGA NA GŁĘBOKOŚĆ: złote pasy pancerza wyżej mają BoxGeometry o głębokości
  // 0.135 (opasują kirys), więc ich przednia ściana sięga z = 0.0705 — dysk i
  // czerwone pole muszą być PRZED tą płaszczyzną, inaczej pasy je zasłaniają.
  const PUN_Z = AV_TORSO_D * 0.5 + 0.026 * HEX_R;   // 0.076
  const PUN_Y = AV_Y_TORSO_CTR + 0.060 * HEX_R;
  const gPanel = new THREE.BoxGeometry(0.150 * HEX_R, 0.120 * HEX_R, 0.010 * HEX_R);
  perGeo.push(gPanel);
  const mPanel = new THREE.Mesh(gPanel, mRed);
  mPanel.position.set(0, PUN_Y, PUN_Z);
  group.add(mPanel);
  const gDisc = new THREE.CylinderGeometry(0.044 * HEX_R, 0.044 * HEX_R, 0.014 * HEX_R, 14, 1);
  perGeo.push(gDisc);
  const mDisc = new THREE.Mesh(gDisc, mGold);
  mDisc.rotation.x = Math.PI / 2;
  mDisc.position.set(0, PUN_Y, PUN_Z + 0.008 * HEX_R);
  group.add(mDisc);
  // Promienie słońca (8 krótkich złotych prostokątów radialnie) — wysunięte POZA
  // krawędź dysku (dawniej promień 0.046 przy tarczy 0.052, więc chowały się
  // w dysku i całość zlewała się w jedną złotą plamę).
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI * 2) / 8;
    const gRay = new THREE.BoxGeometry(0.013 * HEX_R, 0.036 * HEX_R, 0.010 * HEX_R);
    perGeo.push(gRay);
    const mRay = new THREE.Mesh(gRay, mGold);
    mRay.rotation.z = ang;
    mRay.position.set(
      Math.sin(ang) * 0.056 * HEX_R,
      PUN_Y + Math.cos(ang) * 0.056 * HEX_R,
      PUN_Z + 0.006 * HEX_R
    );
    group.add(mRay);
  }
  addTunicHem(group, mGold);

  // LLAUTU (czerwona plecionka na czole) + ZŁOTE ZĘBY KORONY
  // NAPRAWA 2026-08-06: złota płyta 0.165 × 0.165 leżała PONAD czubkiem głowy
  // (głowa ma bok 0.13) i kamera pod 52° patrzyła na jej górną ścianę — z góry
  // taka płyta rzutuje się na duży czworokąt, więc głowa znikała pod złotym
  // klockiem (ten sam błąd co opaska uThulwany, hełm Sumeru, rondo Hu Ben Wei).
  // Teraz opaska jest WSUNIĘTA w czaszkę (góra 0.560 < czubek głowy 0.580),
  // a nad głowę wystają tylko złote zęby — sylwetka zostaje głową w koronie.
  const gCrown = new THREE.BoxGeometry(0.148 * HEX_R, 0.032 * HEX_R, 0.148 * HEX_R);
  perGeo.push(gCrown);
  const mCrown = new THREE.Mesh(gCrown, mRed);          // llautu = czerwień
  mCrown.position.set(0, AV_Y_HEAD_CTR + 0.029 * HEX_R, 0);
  group.add(mCrown);
  // Złote zęby korony — nad opaską, wąskie, żeby nie robiły płyty
  for (const px of [-0.048, -0.016, 0.016, 0.048]) {
    const gTooth = new THREE.BoxGeometry(0.022 * HEX_R, 0.034 * HEX_R, 0.018 * HEX_R);
    perGeo.push(gTooth);
    const mTooth = new THREE.Mesh(gTooth, mGold);
    mTooth.position.set(px * HEX_R, AV_Y_HEAD_TOP + 0.012 * HEX_R, 0);
    group.add(mTooth);
  }
  // Pióra — gęsty wachlarz kolorowych piór
  const featColors = [mRed, mTeal, mGreen, mFeath, mOwner, mRed, mTeal, mGreen];
  for (let fi = 0; fi < 8; fi++) {
    const ax = (fi - 3.5) * 0.16;
    const gF = new THREE.BoxGeometry(0.016 * HEX_R, 0.140 * HEX_R, 0.010 * HEX_R);
    perGeo.push(gF);
    const mF = new THREE.Mesh(gF, featColors[fi]);
    mF.rotation.z = ax;
    mF.position.set(Math.sin(ax) * 0.050 * HEX_R, AV_Y_HEAD_TOP + 0.100 * HEX_R, -0.006 * HEX_R);
    group.add(mF);
  }

  // MACZUGA ZŁOTA z gwiaździstą głowicą (w prawej ręce — jak buildMaceWarrior ale gold+)
  // NAPRAWA 2026-08-06 (D1 + D2 z recenzji Evaluatora — JEDNA bryła, jedna
  // poprawka, bo obie wady miały wspólną przyczynę: trzy elementy maczugi
  // ustawiane były NIEZALEŻNIE od siebie i od dłoni):
  //   D1 — trzonek to był współdzielony getGeoClubHandle() (0.16 × HEX_R
  //        wysokości) postawiony na y = 0.36..0.52, czyli 0.0945 × HEX_R PONAD
  //        dłonią (addHands: środek 0.243, góra 0.2655). Maczuga wisiała w
  //        powietrzu obok ramienia.
  //   D2 — głowica startowała na y = 0.595 (hubY 0.620 − pół sześcianu 0.025)
  //        przy trzonku kończącym się na 0.520, więc między drzewcem a gwiazdą
  //        ziała przerwa 0.075 × HEX_R (a do najniższego promienia 0.044) —
  //        widoczna gołym okiem z kamery gry.
  // Rozwiązanie: trzonek dostaje WŁASNĄ, dłuższą geometrię (0.34 × HEX_R) i
  // biegnie od y = 0.180 do 0.520 — przechodzi więc PRZEZ pięść (chwyt w
  // dolnej jednej trzeciej drzewca, dokładnie jak włócznia Gwardii Sumeru,
  // która przeszła recenzję), a głowica jest kotwiczona do GÓRY TRZONKA
  // (M_HAFT_TOP), nie do torsu — przerwa znika z definicji i nie może wrócić
  // przy kolejnej zmianie proporcji. Wysokość sylwetki bez zmian (0.7504),
  // bo o niej decyduje pióropusz-korona, nie maczuga.
  const M_X = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.018 * HEX_R;
  const M_HAND_Y  = AV_Y_ARM_CTR - AV_ARM_H * 0.5 + 0.022 * HEX_R;   // 0.2430
  const M_HAFT_LEN = 0.340 * HEX_R;
  const M_HAFT_BOT = M_HAND_Y - 0.063 * HEX_R;                       // 0.1800
  const M_HAFT_TOP = M_HAFT_BOT + M_HAFT_LEN;                        // 0.5200
  const gHaft = new THREE.BoxGeometry(0.030 * HEX_R, M_HAFT_LEN, 0.030 * HEX_R);
  perGeo.push(gHaft);
  const mHaft = new THREE.Mesh(gHaft, mWood);
  mHaft.position.set(M_X, M_HAFT_BOT + M_HAFT_LEN * 0.5, 0.01 * HEX_R);
  group.add(mHaft);
  const gHub = new THREE.BoxGeometry(0.050 * HEX_R, 0.050 * HEX_R, 0.050 * HEX_R);
  perGeo.push(gHub);
  const mHub = new THREE.Mesh(gHub, mGold);
  const hubY = M_HAFT_TOP + 0.025 * HEX_R;   // spód głowicy = góra trzonka
  mHub.position.set(M_X, hubY, 0.01 * HEX_R);
  group.add(mHub);
  for (const ang of [0, Math.PI/3, (2*Math.PI)/3, Math.PI, (4*Math.PI)/3, (5*Math.PI)/3]) {
    const gPt = new THREE.BoxGeometry(0.054 * HEX_R, 0.018 * HEX_R, 0.018 * HEX_R);
    perGeo.push(gPt);
    const mPt = new THREE.Mesh(gPt, mGold);
    mPt.rotation.z = ang;
    mPt.position.set(M_X + Math.cos(ang) * 0.032 * HEX_R, hubY + Math.sin(ang) * 0.032 * HEX_R, 0.01 * HEX_R);
    group.add(mPt);
  }

  // TUMI (nóż półksiężycowy) u pasa — unikalny atrybut królewski
  const TUX = AV_ARM_OFFSET_X * 0.25;
  const gTumi = new THREE.BoxGeometry(0.050 * HEX_R, 0.030 * HEX_R, 0.010 * HEX_R);
  perGeo.push(gTumi);
  const mTumi = new THREE.Mesh(gTumi, mGold);
  mTumi.rotation.z = 0.25;
  mTumi.position.set(-TUX, AV_Y_TORSO_BOT + 0.03 * HEX_R, AV_TORSO_D * 0.5 + 0.012 * HEX_R);
  group.add(mTumi);
  // Półksiężycowe ostrze (dolna część)
  const gTBl = new THREE.BoxGeometry(0.042 * HEX_R, 0.040 * HEX_R, 0.010 * HEX_R);
  perGeo.push(gTBl);
  const mTBl = new THREE.Mesh(gTBl, mSteel);
  mTBl.rotation.z = 0.25;
  mTBl.position.set(-TUX + 0.002 * HEX_R, AV_Y_TORSO_BOT + 0.060 * HEX_R, AV_TORSO_D * 0.5 + 0.012 * HEX_R);
  group.add(mTBl);

  // TARCZA prostokątna z geometrycznym wzorem (tokapu) — ownerColor + złote pasy
  // NAPRAWA 2026-08-06: pięć złotych belek (3 pasy + 2 obrzeża) na tarczy o
  // wysokości 0.21 zostawiało z pola gracza tylko cienkie szczeliny — tarcza
  // czytała się jako stos złotych sztabek. Zostają DWA pasy tokapu i obrzeża;
  // tarcza wysunięta przed przedramię, żeby nie ginęła w linii korpusu.
  const SH_X = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.018 * HEX_R);
  const SH_Z = 0.046 * HEX_R;
  const gSh = new THREE.BoxGeometry(0.135 * HEX_R, 0.210 * HEX_R, 0.018 * HEX_R);
  perGeo.push(gSh);
  const mSh = new THREE.Mesh(gSh, mOwner);
  mSh.position.set(SH_X, AV_Y_TORSO_CTR, SH_Z);
  group.add(mSh);
  // Złote pasy tokapu (geometryczny wzór)
  for (const dy of [0.045, -0.045]) {
    const gP = new THREE.BoxGeometry(0.135 * HEX_R, 0.014 * HEX_R, 0.020 * HEX_R);
    perGeo.push(gP);
    const mP = new THREE.Mesh(gP, mGold);
    mP.position.set(SH_X, AV_Y_TORSO_CTR + dy * HEX_R, SH_Z + 0.004 * HEX_R);
    group.add(mP);
  }
  // Złote obrzeża góra/dół
  for (const dy of [0.100, -0.100]) {
    const gRim = new THREE.BoxGeometry(0.135 * HEX_R, 0.012 * HEX_R, 0.022 * HEX_R);
    perGeo.push(gRim);
    const mRim = new THREE.Mesh(gRim, mGold);
    mRim.position.set(SH_X, AV_Y_TORSO_CTR + dy * HEX_R, SH_Z + 0.004 * HEX_R);
    group.add(mRim);
  }

  addSuperBanner(group, mat(0x6b4a26, 0.10, 0.70), mOwner, mGold, perGeo);
  addBoots(group, mat(COLOR_SKIN_DARK, 0.05, 0.85));
  addHands(group, mat(COLOR_SKIN_DARK, 0.05, 0.85));

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = perGeo;
  return group;
}

// ===========================================================================
// CULTURE OVERRIDES for REGULAR (non-super) units
//
// Lightly differentiates obvious culture variants of a shared category so two
// same-category units of different cultures are not identical.  Implemented as
// SMALL ADDITIVE meshes (a distinguishing headgear / shield emblem / colour
// patch) layered on top of the already-built generic model — never a rebuild.
// Materials are appended to the model's tracked mats list and any new geometry
// to perTokenGeos, so disposal still covers them.
// ===========================================================================

function applyCultureOverrides(group: THREE.Group, category: string, culture: Culture, ownerColor_: number): void {
  if (culture === 'neutral') return;
  // Mounted / naval models place their rider/body at non-standard anchors (and
  // konnica is rotated 180° about Y), so the foot-soldier head/torso anchors
  // used below would float.  Skip additive overrides for those categories;
  // they keep the generic culture-neutral model (still correct, just not
  // culture-tinted).  Foot units use the standard avatar anchors and are safe.
  if (category === 'konnica' || category === 'rydwan' || category === 'galera') return;
  // GRAFIKA-JEDNOSTKI: falanga/miecznik/wlocznik/lucznik/procarz/oszczepnik/
  // zwiadowca/domyslny now render BESPOKE per-culture-appropriate models
  // (jednostki-p1-rdzen.ts / hastati-falangita.ts) with their own headgear
  // and silhouette. The additive overlays below were tuned for the OLD
  // generic avatar's fixed AV_* anchors (helmet dome, torso box) and would
  // clip/duplicate on the new bespoke geometry, so skip them here.
  const NEW_BESPOKE_CATEGORIES = ['falanga', 'miecznik', 'wlocznik', 'lucznik', 'procarz', 'oszczepnik', 'zwiadowca', 'domyslny'];
  if (NEW_BESPOKE_CATEGORIES.includes(category)) return;

  const mats = (group.userData['mats'] as THREE.Material[]) ?? [];
  const perGeo = (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? [];
  const mat = makeMatFactory(mats);

  // A small culture emblem patch on the torso front (house colour) — cheap,
  // always-visible marker that the unit belongs to a specific culture.
  const house = cultureHouseColor(culture);
  if (house !== 0x000000) {
    const gEm = new THREE.BoxGeometry(0.05 * HEX_R, 0.05 * HEX_R, 0.010 * HEX_R);
    perGeo.push(gEm);
    const mEm = new THREE.Mesh(gEm, mat(house, 0.10, 0.70));
    mEm.position.set(0.045 * HEX_R, AV_Y_TORSO_CTR - 0.05 * HEX_R, AV_TORSO_D * 0.5 + 0.012 * HEX_R);
    group.add(mEm);
  }

  // Per-culture distinguishing headgear / accent.  Kept tiny and additive so
  // the silhouette stays category-correct; only the FLAVOUR changes.
  switch (culture) {
    case 'egipt': {
      // A blue-and-gold striped brow cloth (nemes hint) sitting low on the head.
      const mBlue = mat(COLOR_WOAD,   0.10, 0.66);
      const mGold = mat(COLOR_GOLD_BR, 0.55, 0.34);
      const gBrow = new THREE.BoxGeometry(0.150 * HEX_R, 0.040 * HEX_R, 0.150 * HEX_R);
      perGeo.push(gBrow);
      const mBrow = new THREE.Mesh(gBrow, mBlue);
      mBrow.position.set(0, AV_Y_HEAD_CTR + 0.052 * HEX_R, 0);
      group.add(mBrow);
      for (const dx of [-0.04, 0.0, 0.04]) {
        const gS = new THREE.BoxGeometry(0.014 * HEX_R, 0.040 * HEX_R, 0.012 * HEX_R);
        perGeo.push(gS);
        const mS = new THREE.Mesh(gS, mGold);
        mS.position.set(dx * HEX_R, AV_Y_HEAD_CTR + 0.052 * HEX_R, AV_HEAD_S * 0.5 + 0.004 * HEX_R);
        group.add(mS);
      }
      break;
    }
    case 'zulu': {
      // A small white-feather tuft + a black cowhide patch on any shield-bearer.
      const mWhite = mat(COLOR_PAINT_WHT, 0.03, 0.92);
      const gP = new THREE.BoxGeometry(0.018 * HEX_R, 0.075 * HEX_R, 0.010 * HEX_R);
      perGeo.push(gP);
      const mP = new THREE.Mesh(gP, mWhite);
      mP.position.set(0, AV_Y_HEAD_TOP + 0.050 * HEX_R, -0.01 * HEX_R);
      group.add(mP);
      break;
    }
    case 'chiny': {
      // A small lacquer-red helmet knob / topknot cap.
      const mLac = mat(COLOR_LACQUER, 0.20, 0.45);
      const gK = new THREE.BoxGeometry(0.026 * HEX_R, 0.060 * HEX_R, 0.026 * HEX_R);
      perGeo.push(gK);
      const mK = new THREE.Mesh(gK, mLac);
      mK.position.set(0, AV_Y_HEAD_TOP + 0.060 * HEX_R, 0);
      group.add(mK);
      break;
    }
    case 'inka': {
      // A pair of small colourful feathers in an ochre band.
      const mRed = mat(COLOR_RED_VIV, 0.06, 0.78);
      const mTeal = mat(COLOR_TEAL,   0.06, 0.78);
      for (const [ax, m] of [[-0.25, mRed], [0.25, mTeal]] as const) {
        const gF = new THREE.BoxGeometry(0.016 * HEX_R, 0.075 * HEX_R, 0.010 * HEX_R);
        perGeo.push(gF);
        const mF = new THREE.Mesh(gF, m);
        mF.rotation.z = ax;
        mF.position.set(Math.sin(ax) * 0.03 * HEX_R, AV_Y_HEAD_TOP + 0.050 * HEX_R, -0.01 * HEX_R);
        group.add(mF);
      }
      break;
    }
    case 'grecja': {
      // A crimson crest accent atop whatever helm the category drew.
      const mCr = mat(COLOR_CRIMSON, 0.08, 0.74);
      const gC = new THREE.BoxGeometry(0.020 * HEX_R, 0.060 * HEX_R, 0.080 * HEX_R);
      perGeo.push(gC);
      const mC = new THREE.Mesh(gC, mCr);
      mC.position.set(0, AV_Y_HEAD_TOP + 0.060 * HEX_R, 0);
      group.add(mC);
      break;
    }
    case 'rzym': {
      // A short transverse red crest accent.
      const mCr = mat(COLOR_RED_VIV, 0.08, 0.74);
      const gC = new THREE.BoxGeometry(0.110 * HEX_R, 0.055 * HEX_R, 0.022 * HEX_R);
      perGeo.push(gC);
      const mC = new THREE.Mesh(gC, mCr);
      mC.position.set(0, AV_Y_HEAD_TOP + 0.058 * HEX_R, 0);
      group.add(mC);
      break;
    }
    case 'sumer': {
      // A bright copper brow band.
      const mCop = mat(0xc8843e, 0.55, 0.32);
      const gB = new THREE.BoxGeometry(0.150 * HEX_R, 0.020 * HEX_R, 0.150 * HEX_R);
      perGeo.push(gB);
      const mB = new THREE.Mesh(gB, mCop);
      mB.position.set(0, AV_Y_HEAD_CTR + 0.048 * HEX_R, 0);
      group.add(mB);
      break;
    }
    default:
      break;
  }

  // Persist the (possibly grown) tracking arrays back onto the group.
  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = perGeo;
}

// ---------------------------------------------------------------------------
// UnitRenderer
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// TEMAT #15 — embarkacja: prosta łódka (kadłub z desek) pod modelem jednostki
// ---------------------------------------------------------------------------

/**
 * Doczepia do gotowego tokenu jednostki prostą łódkę desantową (kadłub z desek,
 * dziób/rufa, dwie burty) i zmniejsza/unosi figurkę, żeby "siedziała" w łodzi.
 * Wszystkie materiały/geo idą do group.userData['mats']/['perTokenGeos'] —
 * sprząta je standardowy _disposeToken. Wywoływana TYLKO dla unit.embarked.
 */
function attachEmbarkBoat(group: THREE.Group): void {
  // Figurka do łódki: lekko mniejsza i uniesiona nad linię burt.
  const riders = group.children.slice();
  for (const child of riders) {
    child.scale.multiplyScalar(0.78);
    child.position.y += 0.10 * HEX_R;
  }

  const mats: THREE.Material[] = (group.userData['mats'] as THREE.Material[]) ?? [];
  const geos: THREE.BufferGeometry[] = (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? [];
  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = geos;

  const mkMat = (color: number): THREE.MeshStandardMaterial => {
    const m = new THREE.MeshStandardMaterial({ color, metalness: 0.05, roughness: 0.85 });
    mats.push(m);
    return m;
  };
  const mkBox = (w: number, h: number, d: number): THREE.BoxGeometry => {
    const g = new THREE.BoxGeometry(w * HEX_R, h * HEX_R, d * HEX_R);
    geos.push(g);
    return g;
  };

  const woodLight = mkMat(0xa87f4a);
  const woodDark  = mkMat(0x7a5530);

  const boat = new THREE.Group();
  const Y = 0.06 * HEX_R; // kadłub nisko na kafelku wody (jak galera: HULL_Y)

  // Dno.
  const bottom = new THREE.Mesh(mkBox(0.34, 0.05, 0.62), woodDark);
  bottom.position.set(0, Y, 0);
  boat.add(bottom);
  // Burty (lewa/prawa).
  const sideL = new THREE.Mesh(mkBox(0.06, 0.12, 0.62), woodLight);
  sideL.position.set(-0.17 * HEX_R, Y + 0.06 * HEX_R, 0);
  boat.add(sideL);
  const sideR = new THREE.Mesh(mkBox(0.06, 0.12, 0.62), woodLight);
  sideR.position.set(0.17 * HEX_R, Y + 0.06 * HEX_R, 0);
  boat.add(sideR);
  // Dziób (−Z, jak galera) i rufa (+Z) — uniesione klocki.
  const bow = new THREE.Mesh(mkBox(0.30, 0.14, 0.10), woodLight);
  bow.position.set(0, Y + 0.05 * HEX_R, -0.33 * HEX_R);
  bow.rotation.x = -0.35;
  boat.add(bow);
  const stern = new THREE.Mesh(mkBox(0.30, 0.12, 0.10), woodLight);
  stern.position.set(0, Y + 0.04 * HEX_R, 0.33 * HEX_R);
  stern.rotation.x = 0.3;
  boat.add(stern);

  group.add(boat);
}

export class UnitRenderer {
  private scene: THREE.Scene;

  /** Fast hex lookup by "q,r" key. */
  private hexGrid: Map<string, Hex>;

  /** Active unit tokens keyed by unit.id. */
  private tokens: Map<string, THREE.Object3D> = new Map();

  /** Materials created per token (stored for disposal). */
  private tokenMaterials: Map<string, THREE.Material[]> = new Map();

  /** Per-token unique geometries (stored for disposal -- not shared singletons). */
  private tokenGeos: Map<string, THREE.BufferGeometry[]> = new Map();

  /** Current highlight group (all discs live inside). */
  private highlightGroup: THREE.Group | null = null;

  /** Materials created for highlights (stored for disposal). */
  private highlightMaterials: THREE.MeshBasicMaterial[] = [];

  /** All Three.js objects in the current path route. */
  private routeObjects: THREE.Object3D[] = [];

  /** Gold ring marking the selected army hex. */
  private selectionRing: THREE.Mesh | null = null;
  private selectionMat: THREE.MeshBasicMaterial | null = null;

  /** Jednostka w animacji ruchu — zawsze widoczna mimo stosu. */
  private forceVisibleUnitId: string | null = null;

  /** Sprite ×N na reprezentancie stosu. */
  private stackBadgeSprites: Map<string, THREE.Sprite> = new Map();
  /** MAP-Q1: ikona GŁODU WOJSKA (czaszka) na reprezentancie stosu. */
  private stackStarvingSprites: Map<string, THREE.Sprite> = new Map();
  /** R-STATUS-PRZYCZYNA-CIERPIENIA-Q1=C: ikona DEFICYTU ZŁOTA (moneta) na reprezentancie stosu. */
  private stackGoldDeficitSprites: Map<string, THREE.Sprite> = new Map();
  /** Etykieta „X tur” przy podglądzie trasy (A3 Shift). */
  private pathTurnLabelSprite: THREE.Sprite | null = null;

  /** Heksy zajęte przez miasta — jednostki stoją wyżej i z boku zabudowy. */
  private cityHexKeys: Set<string> = new Set();

  /** Kolor obwódki jednostki wg relacji z graczem (neutral=zielony, wrogi=czerwony). */
  private ringStanceForOwner: (ownerId: number) => UnitRingStance = (ownerId) =>
    ownerId === 0 ? 'own' : 'hostile';

  /** Tint modelu jednostki; domyślnie stara paleta OWNER_COLORS. */
  private ownerColorFn: (ownerId: number) => number = ownerColor;

  /**
   * C-OBCE-JEDN-Q2: ownerId → kontekst znaku właściciela (portret / sygnet
   * kultury / czaszka). Renderer NIE zna stanu gry, więc mapowanie wstrzykuje
   * main.ts. Domyślnie null → żetony po prostu nie mają emblematu (podglądy,
   * testy i galeria działają bez zmian).
   */
  private ownerEmblemResolver: UnitOwnerEmblemResolver | null = null;

  constructor(scene: THREE.Scene, map: GameMap) {
    this.scene = scene;
    this.hexGrid = new Map<string, Hex>(Object.entries(map.hexes));
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /** Podczas animacji ruchu — pokaż poruszającą się jednostkę nawet jeśli nie jest reprezentantem. */
  setForceVisibleUnitId(id: string | null): void {
    this.forceVisibleUnitId = id;
  }

  /** Aktualizuj heksy miast (przed sync). */
  setCityHexKeys(keys: Set<string>): void {
    this.cityHexKeys = keys;
  }

  /** Kolor obwódki jednostki wg relacji z graczem (neutral=zielony, wrogi=czerwony). */
  setRingStanceResolver(fn: (ownerId: number) => UnitRingStance): void {
    this.ringStanceForOwner = fn;
  }

  /** Tint modelu jednostki (kolorHex cywilizacji z silnika). */
  setOwnerColorFn(fn: (ownerId: number) => number): void {
    this.ownerColorFn = fn;
  }

  /**
   * Znak właściciela na żetonie (C-OBCE-JEDN-Q2): ownerId → cywilizacja / epoka /
   * miasto-państwo / barbarzyńcy. PARYTET AI — rezolwer jest wołany dla KAŻDEGO
   * właściciela tak samo, bez warunku „czy to gracz”.
   */
  setOwnerEmblemResolver(fn: UnitOwnerEmblemResolver | null): void {
    this.ownerEmblemResolver = fn;
  }

  private _resolveOwnerColor(ownerId: number): number {
    return this.ownerColorFn(ownerId);
  }

  private _ringColorForOwner(ownerId: number): number {
    return this._resolveOwnerColor(ownerId);
  }

  /** Pozycja tokena na heksie (uwzględnia podbicie na polu miasta). */
  getTokenPlacement(q: number, r: number): { x: number; y: number; z: number } {
    return this._tokenPlacement(q, r);
  }

  /**
   * Raycast na widoczne modele jednostek — trafienie w offset na polu miasta
   * nie mapuje się na sąsiedni heks (pickHexAt liczy tylko teren).
   */
  pickUnitIdAt(
    clientX: number,
    clientY: number,
    canvas: HTMLCanvasElement,
    camera: THREE.Camera,
  ): string | null {
    const rect = canvas.getBoundingClientRect();
    const ndc = clientRectToNdc(clientX, clientY, rect);
    if (!ndc) return null;

    camera.updateMatrixWorld(true);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), camera);

    const roots = [...this.tokens.values()].filter((o) => o.visible);
    if (roots.length === 0) return null;

    const hits = raycaster.intersectObjects(roots, true);
    for (const h of hits) {
      let obj: THREE.Object3D | null = h.object;
      while (obj) {
        const uid = obj.userData['unitId'];
        if (typeof uid === 'string' && uid.length > 0) return uid;
        obj = obj.parent;
      }
    }
    return null;
  }

  /**
   * Raycast na gwiazdki weterana — zwraca unitId gdy kursor trafia w ★ (C-OBCE-JEDN-Q3 C).
   * Wołane tylko gdy potrzebny tooltip; nie zastępuje pickUnitIdAt (heks pod jednostką).
   */
  pickVeteranBadgeUnitIdAt(
    clientX: number,
    clientY: number,
    canvas: HTMLCanvasElement,
    camera: THREE.Camera,
  ): string | null {
    const rect = canvas.getBoundingClientRect();
    const ndc = clientRectToNdc(clientX, clientY, rect);
    if (!ndc) return null;

    camera.updateMatrixWorld(true);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), camera);

    const roots = [...this.tokens.values()].filter((o) => o.visible);
    if (roots.length === 0) return null;

    const hits = raycaster.intersectObjects(roots, true);
    for (const h of hits) {
      if (!h.object.userData[VETERAN_BADGE_HIT_UD]) continue;
      let obj: THREE.Object3D | null = h.object;
      while (obj) {
        const uid = obj.userData['unitId'];
        if (typeof uid === 'string' && uid.length > 0) return uid;
        obj = obj.parent;
      }
    }
    return null;
  }

  private _tokenPlacement(q: number, r: number): { x: number; y: number; z: number } {
    const key = `${q},${r}`;
    const hex = this.hexGrid.get(key);
    const topY = hex ? terrainTopY(hex) : 0;
    const onCity = this.cityHexKeys.has(key);
    const relief = hex ? unitTerrainRelief(hex.terenBazowy) : 0;
    const y = topY + TOKEN_LIFT + (onCity ? CITY_UNIT_EXTRA_LIFT : 0) + relief;
    const { x, z } = axialToWorld(q, r, HEX_R);
    if (!onCity) return { x, y, z };
    const a = CITY_UNIT_OFFSET_ANGLE;
    return {
      x: x + Math.cos(a) * CITY_UNIT_OFFSET,
      y,
      z: z + Math.sin(a) * CITY_UNIT_OFFSET,
    };
  }

  private _applyCityTokenStyle(obj: THREE.Object3D, onCity: boolean): void {
    obj.scale.setScalar(onCity ? CITY_UNIT_SCALE : 1);
    obj.renderOrder = onCity ? 55 : 0;
  }

  /**
   * Delikatna obwódka właściciela jako DZIECKO żetonu (podąża za ruchem/stackiem).
   * Materiał → userData['mats'] (sprząta _disposeToken).
   */
  private _attachOwnerRing(group: THREE.Group, ownerId: number): void {
    const stance = this.ringStanceForOwner(ownerId);
    const civColor = this._ringColorForOwner(ownerId);
    const ownMat = new THREE.MeshBasicMaterial({
      color: civColor,
      transparent: true,
      opacity: OWNER_RING_OPACITY,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const ownRing = new THREE.Mesh(getGeoOwnerHexRing(), ownMat);
    ownRing.rotation.x = -Math.PI / 2;
    ownRing.position.y = OWNER_RING_LIFT;
    group.add(ownRing);
    if (stance === 'hostile') {
      const warMat = new THREE.MeshBasicMaterial({
        color: WAR_RING_COLOR,
        transparent: true,
        opacity: WAR_RING_OPACITY,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const warRing = new THREE.Mesh(getGeoOwnerHexRing(), warMat);
      warRing.rotation.x = -Math.PI / 2;
      warRing.position.y = OWNER_RING_LIFT;
      warRing.scale.setScalar(WAR_RING_SCALE);
      group.add(warRing);
      const mats = group.userData['mats'] as THREE.Material[] | undefined;
      if (mats) mats.push(ownMat, warMat); else group.userData['mats'] = [ownMat, warMat];
    } else {
      const mats = group.userData['mats'] as THREE.Material[] | undefined;
      if (mats) mats.push(ownMat); else group.userData['mats'] = [ownMat];
    }
    group.userData['ringStance'] = stance;
    group.userData['ringOwnerId'] = ownerId;
  }

  /**
   * Synchronise rendered tokens with the current unit list.
   * stackDisplay: 1 token/heks (najmocniejszy) + badge ×N.
   */
  sync(units: RuntimeUnit[], stackDisplay?: StackDisplayInfo): void {
    const presentIds = new Set<string>();

    for (const unit of units) {
      presentIds.add(unit.id);

      const key = `${unit.q},${unit.r}`;
      const onCity = this.cityHexKeys.has(key);
      const { x, y: yBase, z } = this._tokenPlacement(unit.q, unit.r);

      const cat = unit.category ?? 'domyslny';
      const typeId = unit.typeId ?? '';
      const ringStance = this.ringStanceForOwner(unit.ownerId);
      // TEMAT #15: jednostka zaokrętowana — token z łódką (przebudowa przy zmianie).
      const embarked = unit.embarked === true;

      if (this.tokens.has(unit.id)) {
        const obj = this.tokens.get(unit.id)!;

        if (
          obj.userData['cat'] !== cat ||
          obj.userData['typeId'] !== typeId ||
          obj.userData['ringStance'] !== ringStance ||
          obj.userData['ringOwnerId'] !== unit.ownerId ||
          (obj.userData['embarked'] === true) !== embarked
        ) {
          this.scene.remove(obj);
          this._disposeToken(unit.id, obj);
          this.tokens.delete(unit.id);
          this.tokenMaterials.delete(unit.id);
          this.tokenGeos.delete(unit.id);

          const color = this._resolveOwnerColor(unit.ownerId);
          const group = buildUnitModel(cat, color, typeId);
          if (embarked) attachEmbarkBoat(group);
          group.position.set(x, yBase, z);
          this._applyCityTokenStyle(group, onCity);
          group.userData['unitId'] = unit.id;
          group.userData['cat']    = cat;
          group.userData['typeId'] = typeId;
          group.userData['embarked'] = embarked;

          this._attachOwnerRing(group, unit.ownerId);
          this._registerToken(unit.id, group);
          this.scene.add(group);
        } else {
          obj.position.set(x, yBase, z);
          this._applyCityTokenStyle(obj, onCity);
        }
      } else {
        const color = this._resolveOwnerColor(unit.ownerId);
        const group = buildUnitModel(cat, color, typeId);
        if (embarked) attachEmbarkBoat(group);

        group.position.set(x, yBase, z);
        this._applyCityTokenStyle(group, onCity);
        group.userData['unitId'] = unit.id;
        group.userData['cat']    = cat;
        group.userData['typeId'] = typeId;
        group.userData['embarked'] = embarked;

        this._attachOwnerRing(group, unit.ownerId);
        this._registerToken(unit.id, group);
        this.scene.add(group);
      }

      // TABLICZKA JEDNOSTKI nad figurką (R-ZETON-PASKI, Maciej 2026-07-29):
      //
      //            [ puste miejsce na przyszły symbol generała ]
      //   [ikona   ]  [Koszary]  ★ ★ ★  [Kuźnia]
      //   [właśc.  ]  ▓▓▓▓░░░░  pasek RUCHU (niebieski)         [ MOC ]
      //   [        ]  ▓▓▓▓▓▓▓░  pasek ŻYCIA                     [armii]
      //
      // Wołane PO ewentualnej przebudowie żetonu, dla KAŻDEJ jednostki
      // (gracz i AI identycznie — PARYTET AI, zero warunków na ownerId).
      // Wszystkie trzy funkcje są idempotentne: przy niezmienionym stanie
      // kończą się porównaniem paru liczb, więc bezpiecznie stoją w pętli sync().
      //
      // WARTOŚCI STOSU: na heksie widoczny jest tylko REPREZENTANT stosu
      // (_applyStackDisplay ukrywa resztę), więc tabliczka ma pokazywać liczby
      // CAŁEJ armii, nie reprezentanta. Liczy je warstwa game/ —
      // armyMerge.ts::stackVitals, dostarczone tu w StackDisplayInfo.vitalsByRepId:
      //   Ruch  = minimum (stackRuchLeft — wspólny pul, armia rusza łącznie),
      //   HP    = PULA (Σ HP / Σ maks. HP, nie średnia z procentów),
      //   Moc   = sumRosterFieldM (EFEKTYWNA -- weteran + fortyfikacja + trudność
      //           AI, R-MOC-TABLICZKA-CO-POKAZYWAC-Q1 = B, Maciej 2026-08-07;
      //           dawniej nominalna pod C-MOC-Q1 = A, patrz armyMerge.ts::stackFieldPowerM),
      //   odznaki i gwiazdki = MAKSIMUM z każdej ścieżki osobno (C-ZETON-STOS-Q1 = A);
      //     gwiazdki liczone jako max liczby WYGRANYCH bitew (veteranStarCount).
      // Brak wpisu (żeton niewidoczny, galeria, podgląd bez StackDisplayInfo) =
      // wartości pojedynczej jednostki; hpMax jest wtedy nieznane i pasek HP
      // wychodzi pełny — świadomy fallback, patrz unitStatPlate.ts::barFraction.
      const tokenObj = this.tokens.get(unit.id);
      if (tokenObj) {
        const vitals = stackDisplay?.vitalsByRepId?.get(unit.id);
        if (vitals) {
          // Odznaki ulepszeń budynkowych — poziom OSOBNO dla ścieżki A
          // (Pancerz → Kuźnia, prawo) i ścieżki B (Parametry → Koszary, lewo).
          applyUnitUpgradeBadgeRow(
            tokenObj, vitals.armorBadgeLevel, vitals.softBadgeLevel, vitals.veteranStars,
          );
          // Gwiazdki = LICZBA WYGRANYCH (po fali 106), nie poziom premii —
          // ta sama funkcja co dla pojedynczego żetonu, żeby stos i jednostka
          // nie mogły pokazać innej liczby gwiazdek za to samo doświadczenie.
          applyUnitVeteranBadgeStarCount(tokenObj, vitals.veteranStars as 0 | 1 | 2 | 3);
        } else {
          syncUnitUpgradeBadges(tokenObj, unit);
          syncUnitVeteranBadges(tokenObj, unit);
        }
        applyUnitStatPlate(
          tokenObj,
          this.ownerEmblemResolver?.(unit.ownerId) ?? null,
          {
            ruchLeft: vitals ? vitals.ruchLeft : unit.ruchLeft,
            ruchMax: vitals ? vitals.ruchMax : unit.ruch,
            hp: vitals ? vitals.hp : unit.hp,
            hpMax: vitals ? vitals.hpMax : undefined,
            fieldPowerM: vitals?.fieldPowerM,
            ownerColor: this._resolveOwnerColor(unit.ownerId),
          },
        );
      }
    }

    // Remove tokens whose units are gone
    for (const [id, obj] of this.tokens) {
      if (!presentIds.has(id)) {
        this.scene.remove(obj);
        this._disposeToken(id, obj);
        this.tokens.delete(id);
        this.tokenMaterials.delete(id);
        this.tokenGeos.delete(id);
      }
    }

    this._applyStackDisplay(units, stackDisplay);
  }

  /** Jedna figurka na heks (reprezentant); reszta ukryta; badge ×N. */
  private _applyStackDisplay(units: RuntimeUnit[], stackDisplay?: StackDisplayInfo): void {
    const visible = stackDisplay?.visibleIds;
    const badges = stackDisplay?.badgeByRepId ?? new Map<string, number>();

    for (const unit of units) {
      const obj = this.tokens.get(unit.id);
      if (!obj) continue;
      let show = true;
      if (visible) {
        show = visible.has(unit.id) || unit.id === this.forceVisibleUnitId;
      }
      obj.visible = show;
    }

    for (const [id, sprite] of this.stackBadgeSprites) {
      const obj = this.tokens.get(id);
      if (obj) obj.remove(sprite);
      sprite.material.map?.dispose();
      (sprite.material as THREE.SpriteMaterial).dispose();
    }
    this.stackBadgeSprites.clear();

    for (const [repId, count] of badges) {
      if (count <= 1) continue;
      const obj = this.tokens.get(repId);
      if (!obj || !obj.visible) continue;
      const sprite = this._makeStackBadgeSprite(count);
      sprite.position.set(0.28 * HEX_R, 0.55 * HEX_R, 0.15 * HEX_R);
      obj.add(sprite);
      this.stackBadgeSprites.set(repId, sprite);
    }

    this._applySufferingIcons(stackDisplay);
  }

  /**
   * R-STATUS-PRZYCZYNA-CIERPIENIA-Q1=C — IKONA PER PRZYCZYNA nad żetonem.
   *
   * Dwa NIEZALEŻNE zbiory reprezentantów: głód wojska (`starvingRepIds`) i
   * deficyt Złota (`goldDeficitRepIds`). Gdy jednostka jest w obu naraz, wiszą
   * OBIE ikony obok siebie (czaszka po lewej, moneta po prawej) — żadna nie
   * nadpisuje drugiej; przy jednej przyczynie ikona zostaje wyśrodkowana i w
   * rozmiarze zastanym (SUFFER_ICON_SCALE_SINGLE), więc dotychczasowy obraz
   * głodu się nie zmienia.
   */
  private _applySufferingIcons(stackDisplay?: StackDisplayInfo): void {
    const starving = stackDisplay?.starvingRepIds;
    const goldDeficit = stackDisplay?.goldDeficitRepIds;

    for (const map of [this.stackStarvingSprites, this.stackGoldDeficitSprites]) {
      for (const [id, sprite] of map) {
        const obj = this.tokens.get(id);
        if (obj) obj.remove(sprite);
        sprite.material.map?.dispose();
        (sprite.material as THREE.SpriteMaterial).dispose();
      }
      map.clear();
    }

    if (!starving?.size && !goldDeficit?.size) return;

    const repIds = new Set<string>();
    if (starving) for (const id of starving) repIds.add(id);
    if (goldDeficit) for (const id of goldDeficit) repIds.add(id);

    for (const repId of repIds) {
      const obj = this.tokens.get(repId);
      if (!obj || !obj.visible) continue;
      const hasHunger = starving?.has(repId) === true;
      const hasGold = goldDeficit?.has(repId) === true;
      const both = hasHunger && hasGold;
      const scale = both ? SUFFER_ICON_SCALE_PAIR : SUFFER_ICON_SCALE_SINGLE;

      if (hasHunger) {
        const sprite = this._makeStarvingChipSprite(scale);
        // Wyśrodkowana nad jednostką (x=0) gdy sama; przy dwóch przyczynach
        // w lewo o SUFFER_ICON_PAIR_DX. Y — wysoko nad głową, Z — lekko ku
        // kamerze, żeby ikona nie ginęła w geometrii tokena.
        sprite.position.set(both ? -SUFFER_ICON_PAIR_DX : 0, SUFFER_ICON_Y, SUFFER_ICON_Z);
        obj.add(sprite);
        this.stackStarvingSprites.set(repId, sprite);
      }

      if (hasGold) {
        const sprite = this._makeGoldDeficitChipSprite(scale);
        sprite.position.set(both ? SUFFER_ICON_PAIR_DX : 0, SUFFER_ICON_Y, SUFFER_ICON_Z);
        obj.add(sprite);
        this.stackGoldDeficitSprites.set(repId, sprite);
      }
    }
  }

  /**
   * MAP-Q1: du\u017ca, p\u00f3\u0142przezroczysta CZERWONA czaszka (U+2620) nad jednostkami
   * nale\u017c\u0105cymi do g\u0142oduj\u0105cego pa\u0144stwa. Rysowana na przezroczystym tle (bez
   * tarczy/obw\u00f3dki), tak by prze\u015bwitywa\u0142 token jednostki pod spodem.
   * Skala i opacity dobrane pod oko w\u0142a\u015bciciela \u2014 \u0142atwe do dostrojenia
   * (patrz sta\u0142e STARVING_SKULL_* poni\u017cej).
   */
  private _makeStarvingChipSprite(scale: number = SUFFER_ICON_SCALE_SINGLE): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e01e1e';
    ctx.font = 'bold 104px "Segoe UI Symbol", "Segoe UI Emoji", "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u2620', 64, 70);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: STARVING_SKULL_OPACITY,
      depthTest: false,
    });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(scale, scale, 1);
    sp.renderOrder = STARVING_SKULL_RENDER_ORDER;
    return sp;
  }

  /**
   * R-STATUS-PRZYCZYNA-CIERPIENIA-Q1=C: ikona DEFICYTU Z\u0141OTA (isGoldDeficit,
   * gra/src/game/gold-deficit.ts) \u2014 z\u0142ota moneta przekre\u015blona karmazynow\u0105 belk\u0105
   * (\u201epusty Skarbiec\u201d). Celowo INNY kszta\u0142t i INNY kolor ni\u017c czerwona czaszka
   * g\u0142odu, \u017ceby przyczyn\u0119 da\u0142o si\u0119 rozpozna\u0107 z k\u0105ta kamery mapy (elewacja 52\u00b0,
   * azymut 0) bez naje\u017cd\u017cania kursorem. Ciemna obw\u00f3dka trzyma czytelno\u015b\u0107 na
   * jasnych terenach (pustynia/step), gdzie samo z\u0142oto by si\u0119 zla\u0142o.
   */
  private _makeGoldDeficitChipSprite(scale: number = SUFFER_ICON_SCALE_SINGLE): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = 64;
    const cy = 64;

    // Ciemna obw\u00f3dka monety (kontrast na jasnym terenie).
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(12,18,32,0.92)';
    ctx.fill();

    // Kr\u0105\u017cek z\u0142ota.
    ctx.beginPath();
    ctx.arc(cx, cy, 43, 0, Math.PI * 2);
    ctx.fillStyle = '#e8c84a';
    ctx.fill();

    // Wewn\u0119trzny pier\u015bcie\u0144 \u2014 czytelne \u201eto jest moneta\u201d, nie kropka.
    ctx.beginPath();
    ctx.arc(cx, cy, 31, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(120,86,16,0.85)';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Belka przekre\u015blenia \u2014 \u201ebrak / minus\u201d (Skarbiec < 0).
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#c0281e';
    ctx.fillRect(-52, -9, 104, 18);
    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: GOLD_DEFICIT_COIN_OPACITY,
      depthTest: false,
    });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(scale, scale, 1);
    sp.renderOrder = GOLD_DEFICIT_RENDER_ORDER;
    return sp;
  }

  private _makeStackBadgeSprite(count: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(12,18,32,0.92)';
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e8d88a';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#e8d88a';
    ctx.font = 'bold 26px Segoe UI, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u00d7' + String(count), 32, 34);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(0.38, 0.38, 1);
    sp.renderOrder = 10;
    return sp;
  }

  /**
   * Move a unit token to an arbitrary world position.
   * Used by the movement animator.
   */
  setTokenWorldPosition(id: string, x: number, y: number, z: number): void {
    const obj = this.tokens.get(id);
    if (obj) {
      obj.position.set(x, y, z);
    }
  }

  /**
   * Return the terrain top Y for a hex at axial coordinates (q, r).
   * Returns 0 if the hex does not exist in the grid.
   */
  topYAt(q: number, r: number): number {
    const hex = this.hexGrid.get(`${q},${r}`);
    return hex ? terrainTopY(hex) : 0;
  }

  /**
   * Draw translucent hex discs over the given set of hexes.
   * Replaces any previously drawn highlights.
   */
  setHighlight(hexes: Set<string>): void {
    this.clearHighlight();

    if (hexes.size === 0) return;

    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({
      color: HIGHLIGHT_COLOR,
      transparent: true,
      opacity: HIGHLIGHT_OPACITY,
      depthWrite: false,
    });
    this.highlightMaterials.push(mat);

    for (const key of hexes) {
      const parts = key.split(',');
      if (parts.length !== 2) continue;
      const q = parseInt(parts[0]!, 10);
      const r = parseInt(parts[1]!, 10);
      if (isNaN(q) || isNaN(r)) continue;

      const hex = this.hexGrid.get(key);
      const topY = hex ? terrainTopY(hex) : 0;

      const disc = new THREE.Mesh(getGeoHighlight(), mat);
      const { x, z } = axialToWorld(q, r, HEX_R);
      disc.position.set(x, topY + HIGHLIGHT_LIFT, z);
      group.add(disc);
    }

    this.scene.add(group);
    this.highlightGroup = group;
  }

  /** Remove all highlight discs. */
  clearHighlight(): void {
    if (this.highlightGroup) {
      this.scene.remove(this.highlightGroup);
      for (const m of this.highlightMaterials) {
        m.dispose();
      }
      this.highlightMaterials = [];
      this.highlightGroup = null;
    }
  }

  /** Gruba złota heksagonalna obwódka na zaznaczonym polu armii (Q-ARMIA-1). */
  setSelectionHex(q: number, r: number, ownerId = 0): void {
    this.clearSelectionHex();
    const hex = this.hexGrid.get(`${q},${r}`);
    const topY = hex ? terrainTopY(hex) : 0;
    const relief = hex ? unitTerrainRelief(hex.terenBazowy) : 0;
    // Zaznaczenie w kolorze cywilizacji właściciela, grubszy pierścień.
    const mat = new THREE.MeshBasicMaterial({
      color: this._ringColorForOwner(ownerId),
      transparent: true,
      opacity: SELECTION_HEX_OPACITY,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.selectionMat = mat;
    const ring = new THREE.Mesh(getGeoSelectionHexRing(), mat);
    ring.rotation.x = -Math.PI / 2;
    const { x, z } = axialToWorld(q, r, HEX_R);
    ring.position.set(x, topY + SELECTION_HEX_LIFT + relief, z);
    this.scene.add(ring);
    this.selectionRing = ring;
  }

  clearSelectionHex(): void {
    if (this.selectionRing !== null) {
      this.scene.remove(this.selectionRing);
      this.selectionRing = null;
    }
    if (this.selectionMat !== null) {
      this.selectionMat.dispose();
      this.selectionMat = null;
    }
  }

  /**
   * Draw a movement route line from hexes[0] to hexes[hexes.length-1].
   * Replaces any previously drawn route.
   */
  setPathRoute(
    hexes: { q: number; r: number }[],
    opts?: { turnLabel?: string; turnStops?: { q: number; r: number; turn: number }[] },
  ): void {
    this.clearPathRoute();

    if (hexes.length < 2) return;

    const matGold = new THREE.MeshBasicMaterial({
      color: ROUTE_COLOR,
      transparent: true,
      opacity: ROUTE_OPACITY,
      depthWrite: false,
    });
    const matDest = new THREE.MeshBasicMaterial({
      color: DEST_COLOR,
      transparent: true,
      opacity: ROUTE_OPACITY,
      depthWrite: false,
    });

    const points: THREE.Vector3[] = hexes.map(({ q, r }) => {
      const { x, z } = axialToWorld(q, r, HEX_R);
      const y = this.topYAt(q, r) + ROUTE_Y_LIFT;
      return new THREE.Vector3(x, y, z);
    });

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, TUBE_SEGMENTS, TUBE_RADIUS, 8, false);
    const tube = new THREE.Mesh(tubeGeo, matGold);
    tube.userData['routeGeoOwner'] = true;
    tube.userData['routeMat'] = matGold;
    this.scene.add(tube);
    this.routeObjects.push(tube);

    let dotGeo: THREE.SphereGeometry | null = null;
    for (let i = 1; i < points.length - 1; i++) {
      if (dotGeo === null) {
        dotGeo = new THREE.SphereGeometry(DOT_RADIUS, 8, 6);
      }
      const dot = new THREE.Mesh(dotGeo, matGold);
      dot.position.copy(points[i]!);
      if (i === 1) {
        dot.userData['routeGeoOwner'] = true;
      }
      this.scene.add(dot);
      this.routeObjects.push(dot);
    }

    const torusGeo = new THREE.TorusGeometry(DEST_TORUS_R, DEST_TUBE_R, 8, 24);
    const destMarker = new THREE.Mesh(torusGeo, matDest);
    destMarker.position.copy(points[points.length - 1]!);
    destMarker.rotation.x = Math.PI / 2;
    destMarker.userData['routeGeoOwner'] = true;
    destMarker.userData['routeMat'] = matDest;
    this.scene.add(destMarker);
    this.routeObjects.push(destMarker);

    if (opts?.turnStops?.length) {
      for (const stop of opts.turnStops) {
        const idx = hexes.findIndex(h => h.q === stop.q && h.r === stop.r);
        if (idx < 0) continue;
        const pt = points[idx]!;
        const labelSp = this._makePathTurnLabelSprite(String(stop.turn));
        labelSp.position.set(pt.x, pt.y + 0.32 * HEX_R, pt.z);
        this.scene.add(labelSp);
        this.routeObjects.push(labelSp);
      }
    } else if (opts?.turnLabel) {
      const last = points[points.length - 1]!;
      const labelSp = this._makePathTurnLabelSprite(opts.turnLabel);
      labelSp.position.set(last.x, last.y + 0.35 * HEX_R, last.z);
      this.scene.add(labelSp);
      this.pathTurnLabelSprite = labelSp;
      this.routeObjects.push(labelSp);
    }
  }

  private _makePathTurnLabelSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 48;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(8,12,22,0.88)';
    ctx.strokeStyle = '#e0b24a';
    ctx.lineWidth = 2;
    const pad = 4;
    ctx.beginPath();
    ctx.roundRect(pad, pad, canvas.width - pad * 2, canvas.height - pad * 2, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f5e6b8';
    ctx.font = 'bold 20px Segoe UI, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 1);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(0.55, 0.22, 1);
    sp.renderOrder = 12;
    sp.userData['routeMat'] = mat;
    return sp;
  }

  /**
   * Remove the current path route from the scene and dispose all GPU resources.
   */
  clearPathRoute(): void {
    if (this.routeObjects.length === 0 && this.pathTurnLabelSprite === null) return;

    const matsToDispose = new Set<THREE.Material>();

    for (const obj of this.routeObjects) {
      this.scene.remove(obj);
      if (obj instanceof THREE.Mesh) {
        if (obj.userData['routeGeoOwner'] === true) {
          obj.geometry.dispose();
        }
        const mat = obj.userData['routeMat'] as THREE.Material | undefined;
        if (mat !== undefined) {
          matsToDispose.add(mat);
        }
      } else if (obj instanceof THREE.Sprite) {
        const mat = obj.material as THREE.SpriteMaterial;
        mat.map?.dispose();
        matsToDispose.add(mat);
      }
    }

    for (const m of matsToDispose) {
      m.dispose();
    }

    this.routeObjects = [];
    this.pathTurnLabelSprite = null;
  }

  /** Remove all unit tokens and highlights; dispose all GPU resources. */
  dispose(): void {
    this.clearPathRoute();
    this.clearHighlight();

    for (const [id, obj] of this.tokens) {
      this.scene.remove(obj);
      this._disposeToken(id, obj);
    }
    this.tokens.clear();
    this.tokenMaterials.clear();
    this.tokenGeos.clear();

    // Dispose shared singleton geometries
    geoAvLeg?.dispose();    geoAvLeg    = null;
    geoAvTorso?.dispose();  geoAvTorso  = null;
    geoAvArm?.dispose();    geoAvArm    = null;
    geoAvNeck?.dispose();   geoAvNeck   = null;
    geoAvHead?.dispose();   geoAvHead   = null;
    geoAvEye?.dispose();    geoAvEye    = null;

    geoHighlight?.dispose(); geoHighlight = null;
    geoSelectionHexRing?.dispose(); geoSelectionHexRing = null;
    geoOwnerHexRing?.dispose(); geoOwnerHexRing = null;

    geoHatBrim?.dispose();      geoHatBrim      = null;
    geoHatCrown?.dispose();     geoHatCrown     = null;
    geoBackpack?.dispose();     geoBackpack     = null;
    geoSash?.dispose();         geoSash         = null;
    geoCuirassBox?.dispose();   geoCuirassBox   = null;
    geoCuirassGap?.dispose();   geoCuirassGap   = null;
    geoShoulderPad?.dispose();  geoShoulderPad  = null;
    geoHelmetDome?.dispose();   geoHelmetDome   = null;
    geoHelmetCrest?.dispose();  geoHelmetCrest  = null;
    geoHelmetSimple?.dispose(); geoHelmetSimple = null;
    geoSwordBlade?.dispose();   geoSwordBlade   = null;
    geoSwordCross?.dispose();   geoSwordCross   = null;
    geoSwordGrip?.dispose();    geoSwordGrip    = null;
    geoShieldRim?.dispose();    geoShieldRim    = null;
    geoShieldBoss?.dispose();   geoShieldBoss   = null;
    geoSmallShield?.dispose();  geoSmallShield  = null;
    geoSpearShaft?.dispose();   geoSpearShaft   = null;
    geoSpearTip?.dispose();     geoSpearTip     = null;
    geoJavShaft?.dispose();     geoJavShaft     = null;
    geoJavTip?.dispose();       geoJavTip       = null;
    geoQuiver?.dispose();       geoQuiver       = null;
    geoSlingStone?.dispose();   geoSlingStone   = null;
    geoClubHandle?.dispose();   geoClubHandle   = null;
    geoClubKnob?.dispose();     geoClubKnob     = null;
    geoAxeHandle?.dispose();    geoAxeHandle    = null;
    geoAxeBlade?.dispose();     geoAxeBlade     = null;
    // koń: singletony geometrii w module ./kon-nowy-model (współdzielone, żyją przez cały cykl aplikacji)
    geoCartBody?.dispose();     geoCartBody     = null;
    geoCartWheel?.dispose();    geoCartWheel    = null;
    geoSuperCrestPlume?.dispose(); geoSuperCrestPlume = null;
    geoSuperCape?.dispose();    geoSuperCape    = null;
    geoBannerPole?.dispose();   geoBannerPole   = null;
    geoBannerFlag?.dispose();   geoBannerFlag   = null;
    geoGildedTrim?.dispose();   geoGildedTrim   = null;

    // Extended historical part geometries (rerender realism pass)
    geoGreave?.dispose();          geoGreave          = null;
    geoConicalHelm?.dispose();     geoConicalHelm     = null;
    geoCorinthDome?.dispose();     geoCorinthDome     = null;
    geoNoseGuard?.dispose();       geoNoseGuard       = null;
    geoCheekGuard?.dispose();      geoCheekGuard      = null;
    geoTransverseCrest?.dispose(); geoTransverseCrest = null;
    geoAspisRim?.dispose();        geoAspisRim        = null;
    geoAspisFace?.dispose();       geoAspisFace       = null;
    geoScutumBody?.dispose();      geoScutumBody      = null;
    geoScutumBoss?.dispose();      geoScutumBoss      = null;
    geoLoricaBand?.dispose();      geoLoricaBand      = null;
    geoPilumShaft?.dispose();      geoPilumShaft      = null;
    geoPilumHead?.dispose();       geoPilumHead       = null;
    geoDoryShaft?.dispose();       geoDoryShaft       = null;
    geoSauroter?.dispose();        geoSauroter        = null;
    geoMailSkirt?.dispose();       geoMailSkirt       = null;
    geoGladius?.dispose();         geoGladius         = null;
    geoScabbard?.dispose();        geoScabbard        = null;
    geoStrawBrim?.dispose();       geoStrawBrim       = null;
    geoStrawCrown?.dispose();      geoStrawCrown      = null;
    geoStaff?.dispose();           geoStaff           = null;
    geoBedroll?.dispose();         geoBedroll         = null;
    geoPickHandle?.dispose();      geoPickHandle      = null;
    geoPickHead?.dispose();        geoPickHead        = null;
    geoHood?.dispose();            geoHood            = null;
    geoCloak?.dispose();           geoCloak           = null;
    geoGaleaBowl?.dispose();       geoGaleaBowl       = null;
    geoGaleaCap?.dispose();        geoGaleaCap        = null;
    geoLoincloth?.dispose();       geoLoincloth       = null;
    geoArrowFletch?.dispose();     geoArrowFletch     = null;
    geoSlingPouch?.dispose();      geoSlingPouch      = null;
    geoCowhideShield?.dispose();   geoCowhideShield   = null;
    geoOvalShield?.dispose();      geoOvalShield      = null;
    geoSaddleBlanket?.dispose();   geoSaddleBlanket   = null;
    geoShipHull?.dispose();        geoShipHull        = null;
    geoShipRam?.dispose();         geoShipRam         = null;
    geoShipMast?.dispose();        geoShipMast        = null;
    geoShipSail?.dispose();        geoShipSail        = null;
    geoOar?.dispose();             geoOar             = null;

    // Realism polish pass: shared humanoid extras
    geoBoot?.dispose();            geoBoot            = null;
    geoHand?.dispose();            geoHand            = null;
    geoBeltP?.dispose();           geoBeltP           = null;
    geoTunicHem?.dispose();        geoTunicHem        = null;
    geoPlumeRidge?.dispose();      geoPlumeRidge      = null;
    geoMeleeHelm?.dispose();       geoMeleeHelm       = null;
    geoSkullCap?.dispose();        geoSkullCap        = null;
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  /**
   * Register token in tracking maps.
   * Reads group.userData['mats'] and group.userData['perTokenGeos'] set by buildUnitModel.
   */
  private _registerToken(id: string, group: THREE.Group): void {
    this.tokens.set(id, group);
    this.tokenMaterials.set(id, (group.userData['mats'] as THREE.Material[]) ?? []);
    this.tokenGeos.set(id, (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? []);
  }

  /**
   * Dispose all per-token materials and unique geometries.
   * Does NOT call scene.remove() -- caller is responsible for that.
   */
  private _disposeToken(id: string, _obj: THREE.Object3D): void {
    const mats = this.tokenMaterials.get(id) ?? [];
    for (const m of mats) {
      m.dispose();
    }
    const geos = this.tokenGeos.get(id) ?? [];
    for (const g of geos) {
      g.dispose();
    }
  }
}
