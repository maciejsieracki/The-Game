/**
 * braz-wlocznik-opus5.ts — WŁÓCZNIK (Brąz), bazowa piechota epoki Brązu
 * DOSTĘPNA DLA WSZYSTKICH CYWILIZACJI (units.json: „Włócznik", Epoka=Brąz,
 * Kultura=null, Tech=Brązownictwo). Zastępuje dzisiejszy model
 * `buildWlocznik` (jednostki-p1-rdzen.ts, case 'wlocznik' w units.ts).
 * ---------------------------------------------------------------------------
 * Drop-in:
 *   buildWlocznikBrazOpus5(ownerColor) : THREE.Group
 *   disposeBrazWlocznikOpus5Geometries() : void
 *   (wpięcie pozostawione koordynatorowi — NIE modyfikuję units.ts)
 *
 * Konwencje serii (jak braz-lucznik-nubijski-opus5.ts / hastati-opus5.ts):
 *   - figurka PRZODEM do +Z, stopy na y = 0 grupy,
 *   - układ prawoskrętny: przód = +Z, góra = +Y => LEWA ręka = +X (tarcza),
 *     PRAWA = -X (broń),
 *   - group.userData['mats'] / ['perTokenGeos'] jak w całej serii,
 *   - geometrie wspólne = singletony modułu (perTokenGeos puste),
 *   - wyłącznie MeshStandardMaterial,
 *   - BROŃ NA OSI DŁONI (nic nie lewituje) — włócznia i tarcza budowane
 *     wzdłuż osi przedramienia zwróconej przez segment budujący ramię,
 *   - anatomia (proporcje torsu/kończyn) identyczna z rodziną
 *     NB_.../HO_.../P1_... — figurki wymienne 1:1 na mapie.
 *
 * KOLOR GRACZA (slot tintu — jak w reszcie serii): pas/szarfa na biodrach
 * + malowany okrągły emblemat na polu tarczy (nie cała tarcza jak w starym
 * modelu — tu tarcza jest skórzana, emblemat to farbowany krąg na skórze).
 *
 * ===========================================================================
 * ZGODNOŚĆ HISTORYCZNA — DECYZJE I UZASADNIENIA
 * ===========================================================================
 * Rama: epoka Brązu ok. 3300–1200 p.n.e. Włócznik to MASOWA piechota tej
 * epoki — najtańsza, najliczniejsza jednostka zbrojna (koszt Pieniądz=16,
 * najniższy spośród jednostek wręcz tej epoki w units.json), NIE elita i NIE
 * gwardzista. Wymóg właściciela: żadnej zbroi płytowej, żadnych oznaczeń
 * rangi, żadnego pióropusza — to ma czytać się jako szeregowiec.
 *
 * W1. BROŃ GŁÓWNA: włócznia ok. 2–2,3 m (relacja do wzrostu figurki
 *     ~0,60×HEX_R: całość włóczni od tylca po grot = 0,865×HEX_R, tj.
 *     ~1,44× wzrostu — proporcja realnej włóczni piechura wobec człowieka).
 *     Grot BRĄZOWY, LISCIASTY (ten sam profil geometryczny co grot
 *     oszczepu z kamien-bazowe-opus5.ts, przeskalowany), osadzony na
 *     drzewcu TULEJKĄ (bronze socket/kołnierz) — NIE trzpieniem wbitym na
 *     styk jak w dzisiejszym modelu — plus DWA OWINIĘCIA RZEMIENIEM w
 *     miejscu osadzenia (zabezpieczenie przed rozłupaniem drzewca, szeroko
 *     poświadczone na brązowych grotach włóczni z całej Eurazji tej epoki).
 *     Drzewce znacznie DŁUŻSZE niż w dzisiejszym modelu (0,66×HEX_R vs
 *     0,56×HEX_R) i niż oszczep Oszczepnika z epoki Kamienia (0,52×HEX_R,
 *     jednoręczny miotany, więc krótszy i grubszy w chwycie). Mały brązowy
 *     tylec (ferrule) do wbicia w ziemię — praktyczny element piechura
 *     stojącego w szyku, NIE ozdoba.
 * W2. TARCZA: OKRĄGŁA, kryta SKÓRĄ WOŁOWĄ na drewnianej ramie (rant z
 *     drewna, NIE polerowany metalowy rant jak w dzisiejszym modelu) —
 *     świadomie NIE typ „ósemkowy" mykeński: to jednostka DOSTĘPNA DLA
 *     WSZYSTKICH CYWILIZACJI (Kultura=null w units.json), a kształt ósemkowy
 *     jest wąsko egejski/mykeński — okrągła skórzana tarcza jest wzorem
 *     poświadczonym szerzej (Lewant, Europa, Bliski Wschód) i nie sugeruje
 *     jednej konkretnej kultury. MAŁE brązowe umbo (dopuszczone przez
 *     właściciela: „brąz tam gdzie miał sens") — wyraźnie skromniejsze niż
 *     bogato zdobiony umbo dzisiejszego modelu. Malowany krąg w KOLORZE
 *     GRACZA na skórze (nie cała tarcza jednolicie barwiona jak dziś) —
 *     rzemienne zszycia (lacing) widoczne na obwodzie ranty jako drobne
 *     nabijki, sprzedające materiał „skóra na ramie", nie gładki metal.
 *     Trzymana CENTRALNYM chwytem (pojedynczy drążek + poduszka na
 *     przedramię) — NIE grecki podwójny system porpax/antilabe (to
 *     hoplicki wynalazek epoki Żelaza, ok. VIII w. p.n.e. — anachronizm dla
 *     Brązu).
 * W3. HEŁM: prosty BRĄZOWY HEŁM W FORMIE CZAPY — niska kopuła (wysokość
 *     wyraźnie mniejsza niż średnica, w przeciwieństwie do wysokiego
 *     ostrego stożka dzisiejszego modelu) + wąski rant u podstawy. BEZ
 *     nosala, BEZ grzebienia, BEZ nauszników, BEZ pióra — to wprost
 *     wykonanie wymogu właściciela („żadnych oznaczeń rangi, pióropuszy
 *     oficerskich ani insygniów — to szeregowy żołnierz"). Mały nit/guzek
 *     na szczycie to artefakt konstrukcyjny (łączenie blach), nie ozdoba.
 * W4. STRÓJ: PROSTA TUNIKA LNIANA (kolor NATURALNY, niefarbowany —
 *     świadomie NIE teal jak dzisiejszy model, żeby czytelnie odróżnić
 *     sylwetkę), bez rękawów, na dwóch prostych szelkach przez ramiona
 *     (konstrukcja pospolita w ikonografii Bliskiego Wschodu/Lewantu tej
 *     epoki), pas skórzany. BEZ PANCERZA — świadomie usunięty brązowy
 *     pektorał obecny w dzisiejszym modelu (to atrybut cięższej piechoty/
 *     gwardii, nie masowego poborowego). BEZ NAGOLENNIKÓW — świadomie
 *     usunięte brązowe nagolenniki dzisiejszego modelu z tego samego
 *     powodu; golenie odsłonięte.
 * W5. OBUWIE: SANDAŁY (podeszwa + krzyżujące się rzemienie), NIE buty ani
 *     bosе stopy — kompromis między Oszczepnikiem (bosy, Kamień) a ciężką
 *     piechotą epok późniejszych (buty/kaligi) — pasuje do statusu
 *     „regularny, ale lekki" poborowy piechur epoki Brązu.
 * W6. DROBNE DETALE ŻOŁNIERSKIE (nie oznaczenia rangi): skromny naszyjnik
 *     sznur+2 paciorki kościane (powszechny ozdobnik, nie insygnium) oraz
 *     mały brązowy nóż w pochwie u biodra (praktyczne narzędzie/broń
 *     pomocnicza poborowego, nie broń ceremonialna).
 * W7. CZEGO ŚWIADOMIE NIE MA: żadnego żelaza/stali, żadnych elementów
 *     rzymskich, żadnych oznaczeń rangi/pióropuszy oficerskich, żadnych
 *     strzemion ani innych elementów późniejszych epok, żadnej zbroi
 *     płytowej.
 *
 * -- ROZRÓŻNIALNOŚĆ wobec dzisiejszego modelu (buildWlocznik,
 *    jednostki-p1-rdzen.ts) i wobec Oszczepnika epoki Kamienia
 *    (buildOszczepnikOpus5, kamien-bazowe-opus5.ts):
 *    DZISIEJSZY WŁÓCZNIK: tunika TEAL, WYSOKI ostry stożkowy hełm z NOSALEM,
 *      brązowy PEKTORAŁ na piersi, brązowe NAGOLENNIKI, tarcza OKRĄGŁA z
 *      POLEROWANYM metalowym rantem i jednolitym polem w kolorze gracza,
 *      krótsza włócznia (0,56×HEX_R) BEZ tulejki/owinięcia.
 *    OSZCZEPNIK (Kamień): TORS NAGI malowany ochrą, BEZ hełmu (opaska+2
 *      pióra), BEZ tarczy, KRÓTKI oszczep miotany atlatlem (broń dystansowa,
 *      nie wręcz), krzemienny (nie brązowy) grot, bosy.
 *    NOWY WŁÓCZNIK (Brąz): tunika lniana NATURALNA (bez barwienia), NISKI
 *      kopulasty hełm BEZ nosala/grzebienia, BRAK pancerza i nagolenników
 *      (gołe golenie), okrągła tarcza SKÓRZANA z drewnianą (nie metalową)
 *      obręczą i małym umbem + malowanym emblematem gracza, DŁUŻSZA
 *      włócznia z tulejką i owinięciem rzemiennym, sandały (nie buty/bosy).
 *
 * Budżet: patrz raport końcowy zadania (liczba mesh / trójkątów /
 * materiałów, zmierzone traversem grupy w skrypcie pomocniczym).
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

// ── paleta ─────────────────────────────────────────────────────────────────
const WB_SKIN        = 0xdba876;
const WB_SKIN_DK      = 0xb9855a;

const WB_LINEN        = 0xd7c9a0;   // tunika lniana NIEFARBOWANA (naturalny len)
const WB_LINEN_DK      = 0xac9a6e;  // fałdy / cień tuniki
const WB_LINEN_TRIM     = 0x8f7a52; // rąbek / szelki

const WB_LEATHER       = 0x6b4a28;  // pas, sandały, pochwa noża
const WB_LEATHER_DK    = 0x4a331b;

const WB_HIDE          = 0x8a6a42;  // skóra wołowa krycia tarczy (jasny brąz)
const WB_HIDE_DK        = 0x6a4f2e;

const WB_WOOD          = 0x7a5c3a;  // drzewce włóczni, drewniana obręcz tarczy
const WB_WOOD_DK        = 0x5c452c;

const WB_BRONZE        = 0xcf9234;  // hełm, grot, tulejka, umbo, tylec, nóż
const WB_BRONZE_LT      = 0xdaa84e;

const WB_HAIR           = 0x2a1c10;
const WB_EYE            = 0x14100c;
const WB_BEAD           = 0xdccfa6;  // paciorki kościane naszyjnika

// ── wymiary sylwetki: TE SAME co rodzina NB_*/HO_*/P1_* (spójność serii) ────
const WB_HIP_Y     = 0.208 * HEX_R;
const WB_TORSO_W   = 0.180 * HEX_R;
const WB_TORSO_H   = 0.205 * HEX_R;
const WB_TORSO_D   = 0.100 * HEX_R;
const WB_TORSO_BOT = 0.240 * HEX_R;
const WB_TORSO_CTR = WB_TORSO_BOT + WB_TORSO_H * 0.5;
const WB_TORSO_TOP = WB_TORSO_BOT + WB_TORSO_H;
const WB_NECK_H    = 0.028 * HEX_R;
const WB_HEAD_S    = 0.128 * HEX_R;
const WB_HEAD_CTR  = WB_TORSO_TOP + WB_NECK_H + WB_HEAD_S * 0.5;
const WB_HEAD_TOP  = WB_TORSO_TOP + WB_NECK_H + WB_HEAD_S;
const WB_SHLD_X    = WB_TORSO_W * 0.5 + 0.030 * HEX_R;
const WB_SHLD_Y    = WB_TORSO_TOP - 0.024 * HEX_R;
const WB_HIP_X     = 0.052 * HEX_R;

const WB_THIGH_L   = 0.104 * HEX_R;
const WB_SHIN_L    = 0.096 * HEX_R;
const WB_UPARM_L   = 0.100 * HEX_R;
const WB_FOREARM_L = 0.092 * HEX_R;

// ── geometrie-singletony (lazy) ────────────────────────────────────────────
let gWBTorso:    THREE.BoxGeometry | null = null;
let gWBChest:    THREE.BoxGeometry | null = null;
let gWBNeck:     THREE.BoxGeometry | null = null;
let gWBHead:     THREE.BoxGeometry | null = null;
let gWBJaw:      THREE.BoxGeometry | null = null;
let gWBNose:     THREE.BoxGeometry | null = null;
let gWBBrow:     THREE.BoxGeometry | null = null;
let gWBEar:      THREE.BoxGeometry | null = null;
let gWBEye:      THREE.BoxGeometry | null = null;
let gWBThigh:    THREE.BoxGeometry | null = null;
let gWBShin:     THREE.BoxGeometry | null = null;
let gWBUpArm:    THREE.BoxGeometry | null = null;
let gWBForearm:  THREE.BoxGeometry | null = null;
let gWBFist:     THREE.BoxGeometry | null = null;
let gWBUnit:     THREE.BoxGeometry | null = null;
// sandały
let gWBSole:     THREE.BoxGeometry | null = null;
let gWBToes:     THREE.BoxGeometry | null = null;
let gWBAnkStrap: THREE.BoxGeometry | null = null;
let gWBToeStrap: THREE.BoxGeometry | null = null;
// tunika / pas
let gWBSkirt:    THREE.BoxGeometry | null = null;
let gWBFold:     THREE.BoxGeometry | null = null;
let gWBFringe:   THREE.BoxGeometry | null = null;
let gWBBelt:     THREE.BoxGeometry | null = null;
let gWBBuckle:   THREE.BoxGeometry | null = null;
let gWBStrap:    THREE.BoxGeometry | null = null;
let gWBSash:     THREE.BoxGeometry | null = null;
let gWBLegWrap:  THREE.BoxGeometry | null = null;
// hełm
let gWBDome:     THREE.CylinderGeometry | null = null;
let gWBBrim:     THREE.CylinderGeometry | null = null;
let gWBFinial:   THREE.CylinderGeometry | null = null;
let gWBNape:     THREE.BoxGeometry | null = null;
let gWBHairTuft: THREE.BoxGeometry | null = null;
// naszyjnik
let gWBCord:     THREE.BoxGeometry | null = null;
let gWBBead:     THREE.BoxGeometry | null = null;
// nóż u biodra
let gWBSheath:   THREE.BoxGeometry | null = null;
let gWBKnifeHlt: THREE.BoxGeometry | null = null;
// włócznia
let gWBShaft:    THREE.CylinderGeometry | null = null;
let gWBSocket:   THREE.CylinderGeometry | null = null;
let gWBBind:     THREE.BoxGeometry | null = null;
let gWBGripWrap: THREE.BoxGeometry | null = null;
let gWBHead2:    THREE.BufferGeometry | null = null;   // grot liściasty (taper)
let gWBButt:     THREE.ConeGeometry | null = null;
// tarcza
let gWBShFace:   THREE.CylinderGeometry | null = null;
let gWBShRim:    THREE.CylinderGeometry | null = null;
let gWBShBoss:   THREE.CylinderGeometry | null = null;
let gWBShRound:  THREE.CylinderGeometry | null = null;
let gWBShGrip:   THREE.BoxGeometry | null = null;
let gWBShPad:    THREE.BoxGeometry | null = null;
let gWBShLace:   THREE.BoxGeometry | null = null;
let gWBShRivet:  THREE.BoxGeometry | null = null;

function getWBTorso():    THREE.BoxGeometry { return (gWBTorso    ||= new THREE.BoxGeometry(WB_TORSO_W, WB_TORSO_H, WB_TORSO_D)); }
function getWBChest():    THREE.BoxGeometry { return (gWBChest    ||= new THREE.BoxGeometry(WB_TORSO_W * 1.05, 0.072 * HEX_R, WB_TORSO_D * 1.06)); }
function getWBNeck():     THREE.BoxGeometry { return (gWBNeck     ||= new THREE.BoxGeometry(0.042 * HEX_R, WB_NECK_H * 1.6, 0.042 * HEX_R)); }
function getWBHead():     THREE.BoxGeometry { return (gWBHead     ||= new THREE.BoxGeometry(WB_HEAD_S, WB_HEAD_S, WB_HEAD_S)); }
function getWBJaw():      THREE.BoxGeometry { return (gWBJaw      ||= new THREE.BoxGeometry(0.086 * HEX_R, 0.034 * HEX_R, 0.038 * HEX_R)); }
function getWBNose():     THREE.BoxGeometry { return (gWBNose     ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.026 * HEX_R, 0.016 * HEX_R)); }
function getWBBrow():     THREE.BoxGeometry { return (gWBBrow     ||= new THREE.BoxGeometry(0.100 * HEX_R, 0.013 * HEX_R, 0.015 * HEX_R)); }
function getWBEar():      THREE.BoxGeometry { return (gWBEar      ||= new THREE.BoxGeometry(0.010 * HEX_R, 0.032 * HEX_R, 0.022 * HEX_R)); }
function getWBEye():      THREE.BoxGeometry { return (gWBEye      ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.011 * HEX_R, 0.008 * HEX_R)); }
function getWBThigh():    THREE.BoxGeometry { return (gWBThigh    ||= new THREE.BoxGeometry(0.056 * HEX_R, WB_THIGH_L, 0.060 * HEX_R)); }
function getWBShin():     THREE.BoxGeometry { return (gWBShin     ||= new THREE.BoxGeometry(0.038 * HEX_R, WB_SHIN_L, 0.042 * HEX_R)); }
function getWBUpArm():    THREE.BoxGeometry { return (gWBUpArm    ||= new THREE.BoxGeometry(0.054 * HEX_R, WB_UPARM_L, 0.054 * HEX_R)); }
function getWBForearm():  THREE.BoxGeometry { return (gWBForearm  ||= new THREE.BoxGeometry(0.040 * HEX_R, WB_FOREARM_L, 0.040 * HEX_R)); }
function getWBFist():     THREE.BoxGeometry { return (gWBFist     ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)); }
function getWBUnit():     THREE.BoxGeometry { return (gWBUnit     ||= new THREE.BoxGeometry(1, 1, 1)); }
function getWBSole():     THREE.BoxGeometry { return (gWBSole     ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.014 * HEX_R, 0.086 * HEX_R)); }
function getWBToes():     THREE.BoxGeometry { return (gWBToes     ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.014 * HEX_R, 0.022 * HEX_R)); }
function getWBAnkStrap(): THREE.BoxGeometry { return (gWBAnkStrap ||= new THREE.BoxGeometry(0.050 * HEX_R, 0.010 * HEX_R, 0.014 * HEX_R)); }
function getWBToeStrap(): THREE.BoxGeometry { return (gWBToeStrap ||= new THREE.BoxGeometry(0.014 * HEX_R, 0.009 * HEX_R, 0.040 * HEX_R)); }
function getWBSkirt():    THREE.BoxGeometry { return (gWBSkirt    ||= new THREE.BoxGeometry(0.196 * HEX_R, 0.066 * HEX_R, 0.118 * HEX_R)); }
function getWBFold():     THREE.BoxGeometry { return (gWBFold     ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.058 * HEX_R, 0.012 * HEX_R)); }
function getWBFringe():   THREE.BoxGeometry { return (gWBFringe   ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.038 * HEX_R, 0.010 * HEX_R)); }
function getWBBelt():     THREE.BoxGeometry { return (gWBBelt     ||= new THREE.BoxGeometry(0.192 * HEX_R, 0.026 * HEX_R, 0.114 * HEX_R)); }
function getWBBuckle():   THREE.BoxGeometry { return (gWBBuckle   ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.024 * HEX_R, 0.014 * HEX_R)); }
function getWBStrap():    THREE.BoxGeometry { return (gWBStrap    ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.120 * HEX_R, 0.010 * HEX_R)); }
function getWBSash():     THREE.BoxGeometry { return (gWBSash     ||= new THREE.BoxGeometry(0.196 * HEX_R, 0.030 * HEX_R, 0.108 * HEX_R)); }
function getWBLegWrap():  THREE.BoxGeometry { return (gWBLegWrap  ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.020 * HEX_R, 0.046 * HEX_R)); }
function getWBDome():     THREE.CylinderGeometry { return (gWBDome     ||= new THREE.CylinderGeometry(0.032 * HEX_R, 0.086 * HEX_R, 0.062 * HEX_R, 10, 1)); }
function getWBBrim():     THREE.CylinderGeometry { return (gWBBrim     ||= new THREE.CylinderGeometry(0.090 * HEX_R, 0.092 * HEX_R, 0.018 * HEX_R, 10, 1)); }
function getWBFinial():   THREE.CylinderGeometry { return (gWBFinial   ||= new THREE.CylinderGeometry(0.012 * HEX_R, 0.018 * HEX_R, 0.016 * HEX_R, 6, 1)); }
function getWBNape():     THREE.BoxGeometry { return (gWBNape     ||= new THREE.BoxGeometry(0.096 * HEX_R, 0.044 * HEX_R, 0.020 * HEX_R)); }
function getWBHairTuft(): THREE.BoxGeometry { return (gWBHairTuft ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.052 * HEX_R, 0.024 * HEX_R)); }
function getWBCord():     THREE.BoxGeometry { return (gWBCord     ||= new THREE.BoxGeometry(0.150 * HEX_R, 0.010 * HEX_R, 0.092 * HEX_R)); }
function getWBBead():     THREE.BoxGeometry { return (gWBBead     ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.016 * HEX_R, 0.012 * HEX_R)); }
function getWBSheath():   THREE.BoxGeometry { return (gWBSheath   ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.078 * HEX_R, 0.014 * HEX_R)); }
function getWBKnifeHlt(): THREE.BoxGeometry { return (gWBKnifeHlt ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.024 * HEX_R, 0.014 * HEX_R)); }
function getWBShaft():    THREE.CylinderGeometry { return (gWBShaft    ||= new THREE.CylinderGeometry(0.012 * HEX_R, 0.014 * HEX_R, 0.660 * HEX_R, 8, 1)); }
function getWBSocket():   THREE.CylinderGeometry { return (gWBSocket   ||= new THREE.CylinderGeometry(0.016 * HEX_R, 0.019 * HEX_R, 0.044 * HEX_R, 8, 1)); }
function getWBBind():     THREE.BoxGeometry { return (gWBBind     ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.017 * HEX_R, 0.019 * HEX_R)); }
function getWBGripWrap(): THREE.BoxGeometry { return (gWBGripWrap ||= new THREE.BoxGeometry(0.017 * HEX_R, 0.040 * HEX_R, 0.017 * HEX_R)); }
function getWBButt():     THREE.ConeGeometry { return (gWBButt     ||= new THREE.ConeGeometry(0.014 * HEX_R, 0.050 * HEX_R, 6)); }
function getWBShFace():   THREE.CylinderGeometry { return (gWBShFace   ||= new THREE.CylinderGeometry(0.100 * HEX_R, 0.100 * HEX_R, 0.020 * HEX_R, 12, 1)); }
function getWBShRim():    THREE.CylinderGeometry { return (gWBShRim    ||= new THREE.CylinderGeometry(0.108 * HEX_R, 0.108 * HEX_R, 0.014 * HEX_R, 12, 1, true)); }
function getWBShBoss():   THREE.CylinderGeometry { return (gWBShBoss   ||= new THREE.CylinderGeometry(0.018 * HEX_R, 0.024 * HEX_R, 0.020 * HEX_R, 8, 1)); }
function getWBShRound():  THREE.CylinderGeometry { return (gWBShRound  ||= new THREE.CylinderGeometry(0.052 * HEX_R, 0.052 * HEX_R, 0.006 * HEX_R, 12, 1)); }
function getWBShGrip():   THREE.BoxGeometry { return (gWBShGrip   ||= new THREE.BoxGeometry(0.052 * HEX_R, 0.014 * HEX_R, 0.014 * HEX_R)); }
function getWBShPad():    THREE.BoxGeometry { return (gWBShPad    ||= new THREE.BoxGeometry(0.070 * HEX_R, 0.020 * HEX_R, 0.010 * HEX_R)); }
function getWBShLace():   THREE.BoxGeometry { return (gWBShLace   ||= new THREE.BoxGeometry(0.010 * HEX_R, 0.020 * HEX_R, 0.008 * HEX_R)); }
function getWBShRivet():  THREE.BoxGeometry { return (gWBShRivet  ||= new THREE.BoxGeometry(0.011 * HEX_R, 0.011 * HEX_R, 0.007 * HEX_R)); }

// ---------------------------------------------------------------------------
// grot liściasty (taper): trzpień/tulejka -> najszersze w ~40% -> ostrze.
// Identyczny PROFIL geometryczny co makeLeafPointGeo z kamien-bazowe-opus5.ts
// (świadomie ten sam wzorzec — to fizycznie ten sam typ grota, tylko z BRĄZU
// zamiast krzemienia i w skali włóczni, nie oszczepu), zaimplementowany
// lokalnie żeby plik był samodzielny.
// ---------------------------------------------------------------------------
function wbMakeLeafHeadGeo(len: number, wMax: number, tMax: number): THREE.BufferGeometry {
  const sections: [number, number, number][] = ([
    [0.00, 0.34, 0.60], [0.14, 0.82, 1.00], [0.40, 1.00, 0.90],
    [0.74, 0.62, 0.56], [1.00, 0.04, 0.12],
  ] as [number, number, number][]).map(([y, w, t]) => [y * len, w * wMax * 0.5, t * tMax * 0.5]);
  const pos: number[] = [];
  const P = (x: number, y: number, z: number) => { pos.push(x, y, z); };
  const quad = (
    a: [number, number, number], b: [number, number, number],
    c: [number, number, number], d: [number, number, number],
  ) => { P(...a); P(...b); P(...c); P(...a); P(...c); P(...d); };
  for (let i = 0; i < sections.length - 1; i++) {
    const s0 = sections[i]!, s1 = sections[i + 1]!;
    const [y0, w0, t0] = s0, [y1, w1, t1] = s1;
    quad([-w0, y0, t0], [w0, y0, t0], [w1, y1, t1], [-w1, y1, t1]);
    quad([w0, y0, -t0], [-w0, y0, -t0], [-w1, y1, -t1], [w1, y1, -t1]);
    quad([w0, y0, t0], [w0, y0, -t0], [w1, y1, -t1], [w1, y1, t1]);
    quad([-w0, y0, -t0], [-w0, y0, t0], [-w1, y1, t1], [-w1, y1, -t1]);
  }
  const b = sections[0]!;
  quad([-b[1], b[0], -b[2]], [b[1], b[0], -b[2]], [b[1], b[0], b[2]], [-b[1], b[0], b[2]]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function getWBHead2(): THREE.BufferGeometry {
  return (gWBHead2 ||= wbMakeLeafHeadGeo(0.115 * HEX_R, 0.040 * HEX_R, 0.016 * HEX_R));
}

// ---------------------------------------------------------------------------
// Kinematyka łańcuchowa — konwencja identyczna z hastati-opus5.ts /
// braz-lucznik-nubijski-opus5.ts: theta liczone od pionu w dół,
// +theta = ku przodowi (+Z); mesh o osi Y kładzie się z rotation.x = PI-theta.
// ---------------------------------------------------------------------------
const WB_Y_UP = new THREE.Vector3(0, 1, 0);

function wbDirDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}

function wbSeg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = wbDirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

/** Mesh o stałej geometrii umieszczony w pozycji P, zorientowany osią +Y wzdłuż D. */
function wbAlong(
  group: THREE.Group | THREE.Object3D, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, D: THREE.Vector3,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mtl);
  if (D.y < -0.9999) mesh.rotation.x = Math.PI;
  else mesh.quaternion.setFromUnitVectors(WB_Y_UP, D);
  mesh.position.copy(P);
  group.add(mesh);
  return mesh;
}

/** Noga: udo + goleń + SANDAŁ (podeszwa + palce + rzemień na podbiciu + na kostce). */
function wbBuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mSkin: THREE.MeshStandardMaterial, mSandal: THREE.MeshStandardMaterial,
  hipY: number,
): THREE.Vector3 {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = wbSeg(group, getWBThigh(), mSkin, P, thU, WB_THIGH_L);
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = wbSeg(group, getWBShin(), mSkin, P, thL, WB_SHIN_L);
  const footZ = P.z + 0.014 * HEX_R;
  const sole = new THREE.Mesh(getWBSole(), mSandal);
  sole.position.set(sx, 0.007 * HEX_R, footZ);
  group.add(sole);
  const toes = new THREE.Mesh(getWBToes(), mSkin);
  toes.position.set(sx, 0.010 * HEX_R, footZ + 0.040 * HEX_R);
  group.add(toes);
  const ank = new THREE.Mesh(getWBAnkStrap(), mSandal);
  ank.position.set(sx, 0.034 * HEX_R, footZ - 0.010 * HEX_R);
  group.add(ank);
  const toeStrap = new THREE.Mesh(getWBToeStrap(), mSandal);
  toeStrap.position.set(sx, 0.020 * HEX_R, footZ + 0.024 * HEX_R);
  group.add(toeStrap);
  // opaska rzemienna nad kostką — drobny detal, NIE nagolennik (bez brązu,
  // nie zasłania golenia) — golenie pozostają odsłonięte (bez pancerza)
  const wrap = new THREE.Mesh(getWBLegWrap(), mSandal);
  wrap.position.set(sx, 0.070 * HEX_R, P.z - 0.002 * HEX_R);
  group.add(wrap);
  return P;
}

/** Ramię: ramię + przedramię + (opcjonalnie) pięść. Zwraca nadgarstek + OŚ. */
function wbBuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  let P = new THREE.Vector3(sx, WB_SHLD_Y, 0);
  P = wbSeg(group, getWBUpArm(), mUp, P, thU, WB_UPARM_L);
  P.y += 0.010 * HEX_R;
  const wrist = wbSeg(group, getWBForearm(), mFore, P, thF, WB_FOREARM_L);
  const axis = wbDirDown(thF);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getWBFist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(axis, 0.014 * HEX_R));
    group.add(fist);
  }
  return { wrist, axis };
}

/** Tors + klatka + szyja + głowa + żuchwa + nos + brew + oczy + uszy. */
function wbBuildCore(
  group: THREE.Group,
  mTunic: THREE.MeshStandardMaterial, mSkin: THREE.MeshStandardMaterial,
  mSkinDk: THREE.MeshStandardMaterial, mEye: THREE.MeshStandardMaterial,
): void {
  const torso = new THREE.Mesh(getWBTorso(), mTunic);
  torso.position.set(0, WB_TORSO_CTR, 0);
  group.add(torso);
  const chest = new THREE.Mesh(getWBChest(), mTunic);
  chest.position.set(0, WB_TORSO_TOP - 0.038 * HEX_R, 0);
  group.add(chest);
  const neck = new THREE.Mesh(getWBNeck(), mSkin);
  neck.position.set(0, WB_TORSO_TOP + WB_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(getWBHead(), mSkin);
  head.position.set(0, WB_HEAD_CTR, 0);
  group.add(head);
  const jaw = new THREE.Mesh(getWBJaw(), mSkinDk);
  jaw.position.set(0, WB_HEAD_CTR - WB_HEAD_S * 0.38, 0.010 * HEX_R);
  group.add(jaw);
  const nose = new THREE.Mesh(getWBNose(), mSkin);
  nose.position.set(0, WB_HEAD_CTR - 0.004 * HEX_R, WB_HEAD_S * 0.5 + 0.006 * HEX_R);
  group.add(nose);
  const brow = new THREE.Mesh(getWBBrow(), mSkinDk);
  brow.rotation.x = 0.12;
  brow.position.set(0, WB_HEAD_CTR + 0.032 * HEX_R, WB_HEAD_S * 0.5 + 0.003 * HEX_R);
  group.add(brow);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(getWBEye(), mEye);
    eye.position.set(sx * 0.026 * HEX_R, WB_HEAD_CTR + 0.014 * HEX_R, WB_HEAD_S * 0.5 + 0.002 * HEX_R);
    group.add(eye);
    const ear = new THREE.Mesh(getWBEar(), mSkinDk);
    ear.position.set(sx * (WB_HEAD_S * 0.5 + 0.004 * HEX_R), WB_HEAD_CTR - 0.006 * HEX_R, 0);
    group.add(ear);
  }
}

// ===========================================================================
// WŁÓCZNIK BRĄZ — OPUS 5 (masowa piechota, dostępna dla wszystkich cywilizacji)
// Prosta lniana tunika na szelkach, niski kopulasty hełm z brązu BEZ nosala/
// grzebienia/pióra, BEZ pancerza i nagolenników, sandały. Długa włócznia z
// brązowym grotem liściastym osadzonym w tulejce z owinięciem rzemiennym,
// okrągła tarcza kryta skórą wołową na drewnianej obręczy z małym umbem
// i malowanym emblematem gracza.
// ===========================================================================
export function buildWlocznikBrazOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin      = mat(WB_SKIN,        0.05, 0.80);
  const mSkinDk    = mat(WB_SKIN_DK,     0.05, 0.82);
  const mLinen     = mat(WB_LINEN,       0.03, 0.88);
  const mLinenDk   = mat(WB_LINEN_DK,    0.03, 0.90);
  const mLinenTrim = mat(WB_LINEN_TRIM,  0.04, 0.86);
  const mLeather   = mat(WB_LEATHER,     0.05, 0.85);
  const mLeatherDk = mat(WB_LEATHER_DK,  0.05, 0.88);
  const mHide      = mat(WB_HIDE,        0.05, 0.86);
  const mHideDk    = mat(WB_HIDE_DK,     0.05, 0.88);
  const mWood      = mat(WB_WOOD,        0.05, 0.84);
  const mWoodDk    = mat(WB_WOOD_DK,     0.05, 0.86);
  const mBronze    = mat(WB_BRONZE,      0.50, 0.42);
  const mBronzeLt  = mat(WB_BRONZE_LT,   0.55, 0.36);
  const mHair      = mat(WB_HAIR,        0.04, 0.90);
  const mEye       = mat(WB_EYE,         0.05, 0.86);
  const mBead      = mat(WB_BEAD,        0.05, 0.70);
  const mOwner     = mat(ownerColor_,    0.10, 0.70);

  const HIP_Y = WB_HIP_Y - 0.010 * HEX_R;   // lekki wykrok (spójny z rodziną wręcz)

  // ═══ KORPUS + GŁOWA ═══════════════════════════════════════════════════════
  wbBuildCore(group, mLinen, mSkin, mSkinDk, mEye);

  // ═══ NOGI: bose golenie (BEZ nagolenników) + SANDAŁY ═════════════════════
  wbBuildLeg(group,  WB_HIP_X,  0.56,  0.32, mSkin, mLeather, HIP_Y);
  wbBuildLeg(group, -WB_HIP_X, -0.50, -0.18, mSkin, mLeather, HIP_Y);

  // ═══ TUNIKA: rąbek + fałdy + szelki + pas + szarfa gracza ════════════════
  const skirt = new THREE.Mesh(getWBSkirt(), mLinen);
  skirt.position.set(0, WB_TORSO_BOT - 0.020 * HEX_R, 0);
  group.add(skirt);
  for (const sx of [-1, 0, 1]) {
    const fold = new THREE.Mesh(getWBFold(), mLinenDk);
    fold.position.set(sx * 0.056 * HEX_R, WB_TORSO_BOT - 0.026 * HEX_R, WB_TORSO_D * 0.5 + 0.008 * HEX_R);
    group.add(fold);
  }
  for (const sx of [-1.5, -0.5, 0.5, 1.5]) {        // rąbek: drobne fałdy przy dole tuniki
    const fr = new THREE.Mesh(getWBFringe(), mLinenDk);
    fr.position.set(sx * 0.040 * HEX_R, WB_TORSO_BOT - 0.050 * HEX_R, WB_TORSO_D * 0.5 + 0.004 * HEX_R);
    group.add(fr);
  }
  for (const s of [-1, 1]) {                      // szelki lniane przez barki
    const strap = new THREE.Mesh(getWBStrap(), mLinenTrim);
    strap.rotation.set(-0.30, 0, s * 0.10);
    strap.position.set(s * 0.052 * HEX_R, WB_SHLD_Y + 0.036 * HEX_R, 0.006 * HEX_R);
    group.add(strap);
  }
  const belt = new THREE.Mesh(getWBBelt(), mLeather);
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);
  const buckle = new THREE.Mesh(getWBBuckle(), mBronzeLt);
  buckle.position.set(0, 0.252 * HEX_R, WB_TORSO_D * 0.5 + 0.013 * HEX_R);
  group.add(buckle);
  const sash = new THREE.Mesh(getWBSash(), mOwner);   // KOLOR GRACZA — szarfa na biodrach
  sash.position.set(0, WB_TORSO_CTR - 0.016 * HEX_R, 0);
  group.add(sash);

  // ═══ NASZYJNIK skromny: sznur + 2 kościane paciorki (bez metalu) ═════════
  const cord = new THREE.Mesh(getWBCord(), mLeatherDk);
  cord.position.set(0, WB_TORSO_TOP - 0.010 * HEX_R, 0);
  group.add(cord);
  for (const sx of [-1, 1]) {
    const bd = new THREE.Mesh(getWBBead(), mBead);
    bd.position.set(sx * 0.044 * HEX_R, WB_TORSO_TOP - 0.020 * HEX_R, WB_TORSO_D * 0.5 + 0.011 * HEX_R);
    group.add(bd);
  }

  // ═══ NÓŻ BRĄZOWY W POCHWIE u prawego biodra (narzędzie, nie insygnium) ══
  const knifeX = -(WB_TORSO_W * 0.5 + 0.020 * HEX_R);
  const sheath = new THREE.Mesh(getWBSheath(), mLeather);
  sheath.rotation.z = 0.10;
  sheath.position.set(knifeX, 0.198 * HEX_R, 0.012 * HEX_R);
  group.add(sheath);
  const hilt = new THREE.Mesh(getWBKnifeHlt(), mBronzeLt);
  hilt.rotation.z = 0.10;
  hilt.position.set(knifeX - 0.006 * HEX_R, 0.244 * HEX_R, 0.012 * HEX_R);
  group.add(hilt);

  // ═══ HEŁM: niska kopuła brązowa + rant + guzek — BEZ nosala/grzebienia/pióra
  const dome = new THREE.Mesh(getWBDome(), mBronze);
  dome.position.set(0, WB_HEAD_CTR + 0.052 * HEX_R, 0);
  group.add(dome);
  const brim = new THREE.Mesh(getWBBrim(), mBronzeLt);
  brim.position.set(0, WB_HEAD_CTR + 0.026 * HEX_R, 0);
  group.add(brim);
  const finial = new THREE.Mesh(getWBFinial(), mBronzeLt);
  finial.position.set(0, WB_HEAD_CTR + 0.092 * HEX_R, 0);
  group.add(finial);
  const nape = new THREE.Mesh(getWBNape(), mHair);   // włosy widoczne spod ranty z tyłu
  nape.position.set(0, WB_HEAD_CTR + 0.006 * HEX_R, -(WB_HEAD_S * 0.5 + 0.006 * HEX_R));
  group.add(nape);
  for (const sx of [-1, 1]) {                        // kosmyki włosów przy skroniach spod ranty
    const tuft = new THREE.Mesh(getWBHairTuft(), mHair);
    tuft.position.set(sx * (WB_HEAD_S * 0.5 + 0.006 * HEX_R), WB_HEAD_CTR - 0.008 * HEX_R, -0.014 * HEX_R);
    group.add(tuft);
  }

  // ═══ PRAWE (-X) RAMIĘ + WŁÓCZNIA w pchnięciu nadrocznym ══════════════════
  const armR = wbBuildArm(group, -WB_SHLD_X, -2.55, 1.32, mSkin, mSkin, mSkin);
  const ax = armR.axis;
  const at = (d: number): THREE.Vector3 => armR.wrist.clone().addScaledVector(ax, d * HEX_R);

  wbAlong(group, getWBGripWrap(), mLeatherDk, at(0.010), ax);      // owinięcie rzemienne w dłoni
  wbAlong(group, getWBShaft(), mWood, at(0.230), ax);              // drzewce (dłuższe niż dziś): środek d=0.230, długość 0.660 => -0.100..0.560
  wbAlong(group, getWBSocket(), mBronze, at(0.582), ax);           // tulejka brązowa (osadzenie grota): 0.560..0.604
  wbAlong(group, getWBBind(), mLeatherDk, at(0.556), ax);          // owinięcie rzemienne 1 (tył tulejki)
  wbAlong(group, getWBBind(), mLeatherDk, at(0.600), ax);          // owinięcie rzemienne 2 (przód tulejki)

  // Grot (wbMakeLeafHeadGeo) jest zakotwiczony w y=0 (podstawa/trzpień), NIE
  // wyśrodkowany — position = PODSTAWA grota, rozciąga się dalej wzdłuż `ax`
  // o `len` (jak makeLeafPointGeo w kamien-bazowe-opus5.ts / oszczepnik).
  // Podstawa d=0.596 (zachodzi na przód tulejki) => czubek przy d=0.596+0.115=0.711.
  const headMesh = new THREE.Mesh(getWBHead2(), mBronzeLt);
  headMesh.position.copy(at(0.596));
  if (ax.y < -0.9999) headMesh.rotation.x = Math.PI;
  else headMesh.quaternion.setFromUnitVectors(WB_Y_UP, ax);
  group.add(headMesh);

  const butt = new THREE.Mesh(getWBButt(), mBronze);
  butt.position.copy(at(-0.150));
  if (ax.y < -0.9999) butt.rotation.x = 0; else butt.quaternion.setFromUnitVectors(WB_Y_UP, ax.clone().negate());
  group.add(butt);

  // ═══ LEWE (+X) RAMIĘ + TARCZA OKRĄGŁA KRYTA SKÓRĄ WOŁOWĄ ═════════════════
  const armL = wbBuildArm(group, WB_SHLD_X, 0.52, 1.05, mSkin, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.040 * HEX_R,
    armL.wrist.y + 0.052 * HEX_R,
    armL.wrist.z + 0.048 * HEX_R,
  );
  sh.rotation.y = -0.20;

  const SHIELD_R = 0.100 * HEX_R;
  const face = new THREE.Mesh(getWBShFace(), mHide);
  face.rotation.x = Math.PI / 2;
  sh.add(face);
  const rim = new THREE.Mesh(getWBShRim(), mWood);         // obręcz DREWNIANA (nie metal)
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0, -0.005 * HEX_R);
  sh.add(rim);
  const roundel = new THREE.Mesh(getWBShRound(), mOwner);  // malowany emblemat gracza
  roundel.rotation.x = Math.PI / 2;
  roundel.position.set(0, 0, 0.011 * HEX_R);
  sh.add(roundel);
  const boss = new THREE.Mesh(getWBShBoss(), mBronze);     // MAŁE umbo (skromne)
  boss.rotation.x = Math.PI / 2;
  boss.position.set(0, 0, 0.017 * HEX_R);
  sh.add(boss);
  const gripBar = new THREE.Mesh(getWBShGrip(), mWood);    // uchwyt centralny (bez porpax greckiego)
  gripBar.position.set(0, 0, -0.022 * HEX_R);
  sh.add(gripBar);
  const pad = new THREE.Mesh(getWBShPad(), mLeatherDk);    // poduszka na przedramię
  pad.position.set(0, 0.020 * HEX_R, -0.016 * HEX_R);
  sh.add(pad);
  for (let k = 0; k < 6; k++) {                            // nabijki szycia skóry na obwodzie
    const ang = (k / 6) * Math.PI * 2;
    const lace = new THREE.Mesh(getWBShLace(), mHideDk);
    lace.position.set(Math.cos(ang) * SHIELD_R * 1.00, Math.sin(ang) * SHIELD_R * 1.00, 0.006 * HEX_R);
    lace.rotation.z = ang;
    sh.add(lace);
  }
  for (let k = 0; k < 4; k++) {                             // nity drewnianej obręczy (co 90°)
    const ang = (k / 4) * Math.PI * 2 + Math.PI / 4;
    const rivet = new THREE.Mesh(getWBShRivet(), mBronzeLt);
    rivet.position.set(Math.cos(ang) * SHIELD_R * 0.92, Math.sin(ang) * SHIELD_R * 0.92, 0.012 * HEX_R);
    sh.add(rivet);
  }
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

/** Zwolnienie singletonów modułu (konwencja disposeUnitGeometries z units.ts). */
export function disposeBrazWlocznikOpus5Geometries(): void {
  const all: (THREE.BufferGeometry | null)[] = [
    gWBTorso, gWBChest, gWBNeck, gWBHead, gWBJaw, gWBNose, gWBBrow, gWBEar, gWBEye,
    gWBThigh, gWBShin, gWBUpArm, gWBForearm, gWBFist, gWBUnit,
    gWBSole, gWBToes, gWBAnkStrap, gWBToeStrap,
    gWBSkirt, gWBFold, gWBFringe, gWBBelt, gWBBuckle, gWBStrap, gWBSash, gWBLegWrap,
    gWBDome, gWBBrim, gWBFinial, gWBNape, gWBHairTuft,
    gWBCord, gWBBead, gWBSheath, gWBKnifeHlt,
    gWBShaft, gWBSocket, gWBBind, gWBGripWrap, gWBHead2, gWBButt,
    gWBShFace, gWBShRim, gWBShBoss, gWBShRound, gWBShGrip, gWBShPad, gWBShLace, gWBShRivet,
  ];
  for (const g of all) { g?.dispose(); }
  gWBTorso = gWBChest = gWBNeck = gWBHead = gWBJaw = gWBNose = gWBBrow = gWBEar = gWBEye = null;
  gWBThigh = gWBShin = gWBUpArm = gWBForearm = gWBFist = gWBUnit = null;
  gWBSole = gWBToes = gWBAnkStrap = gWBToeStrap = null;
  gWBSkirt = gWBFold = gWBFringe = gWBBelt = gWBBuckle = gWBStrap = gWBSash = gWBLegWrap = null;
  gWBDome = gWBBrim = gWBFinial = gWBNape = gWBHairTuft = null;
  gWBCord = gWBBead = gWBSheath = gWBKnifeHlt = null;
  gWBShaft = gWBSocket = gWBBind = gWBGripWrap = gWBHead2 = gWBButt = null;
  gWBShFace = gWBShRim = gWBShBoss = gWBShRound = gWBShGrip = gWBShPad = gWBShLace = gWBShRivet = null;
}
