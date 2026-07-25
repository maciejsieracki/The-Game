/**
 * braz-lucznik-nubijski-opus5.ts — ŁUCZNIK NUBIJSKI (Nubian Archer), jednostka
 * specjalna Egiptu EPOKI BRĄZU (units.json: „Łucznik nubijski", Epoka=Brąz,
 * Kultura=Egipt, W zamian za=Łucznik). Zastępuje placeholder, który reużywał
 * buildEgyptianArcherOpus5 (kamien-lucznicy-opus5.ts) — model TYMCZASOWY,
 * teraz zastąpiony dedykowanym budowniczym poniżej.
 * ---------------------------------------------------------------------------
 * Drop-in:
 *   buildNubianArcherOpus5(ownerColor) : THREE.Group
 *   (wpięcie: units.ts — dispatch 'lucznik nubijski' / 'nubian archer')
 *
 * Konwencje serii (jak kamien-lucznicy-opus5.ts / jednostki-p3-dystans.ts):
 *   - figurka PRZODEM do +Z, stopy na y = 0 grupy,
 *   - układ prawoskrętny: przód = +Z, góra = +Y => LEWA ręka = +X, PRAWA = -X,
 *   - group.userData['mats'] / ['perTokenGeos'] jak w całej serii,
 *   - geometrie wspólne = singletony modułu (perTokenGeos puste),
 *   - wyłącznie MeshStandardMaterial,
 *   - POZA PEŁNEGO NACIĄGU i punkty kotwiczne GRIP/NOCK IDENTYCZNE z
 *     kamien-lucznicy-opus5.ts / jednostki-p3-dystans.ts => cała rodzina
 *     łuczników w grze stoi w tej samej pozie (spójność czytania jednostek),
 *   - BROŃ NA OSI DŁONI (nic nie lewituje), kończyny domykane przez IK,
 *   - anatomia (proporcje torsu/kończyn) identyczna z rodziną KL_.../PD_... —
 *     figurki wymienne 1:1 na mapie.
 *
 * KOLOR GRACZA (slot tintu — jak w Łuczniku egipskim/sumeryjskim): pas na
 * biodrach (nad przepaską) + lotki strzał (na cięciwie i w kołczanie).
 *
 * ===========================================================================
 * ZGODNOŚĆ HISTORYCZNA — DECYZJE I UZASADNIENIA
 * ===========================================================================
 * Ramy: Nubia/Kusz (egipska nazwa krainy „Ta-Seti" = „Kraina Łuku") była
 * w starożytności synonimem łucznictwa — nubijscy łucznicy służyli jako
 * najemnicy i pomocnicy w armii egipskiej od Starego Państwa po Nowe
 * Państwo. Klasyczne źródło ikonograficzne: drewniany model „40 łuczników
 * nubijskich" z grobowca Mesehtiego w Asjut (Średnie Państwo, Muzeum
 * Egipskie w Kairze) — figurki o ciemnej karnacji, w przepaskach biodrowych,
 * z łukami WYRAŹNIE WYŻSZYMI OD SYLWETKI łucznika.
 *
 * N1. ŁUK DŁUGI, PROSTY (self bow, jednolity kawałek twardego drewna) —
 *     WYRAŹNIE DŁUŻSZY niż egipski łuk dwuwypukły/kompozytowy. To CECHA
 *     ROZPOZNAWCZA tej jednostki: model z Asjut pokazuje łuki nubijskie
 *     sięgające od stóp po ponad głowę łucznika. Profil ramion PROSTY,
 *     płynnie zwężający się ku końcówkom — BEZ bulwiastego "podwójnie
 *     wypukłego" wygięcia egipskiego łuku rogowego (to byłby anachronizm
 *     wobec charakteru self-bow). Połowa rozpiętości ramienia = 0.42*HEX_R
 *     (Łucznik egipski: 0.292*HEX_R, Sumeryjski: 0.238*HEX_R) — górna
 *     końcówka sięga 0.86*HEX_R (wyraźnie ponad czubek głowy przy 0.60*HEX_R),
 *     dolna niemal do ziemi (0.02*HEX_R) — czytelne z dystansu kamery 52°.
 * N2. GROT BRĄZOWY — jedyny metal w modelu (świadomie, jak w instrukcji
 *     właściciela). Epoka Brązu pozwala na brązowe okucie strzał (drzewce
 *     i reszta uzbrojenia — bez zmian, drewno/skóra/ścięgno). Prosty
 *     listkowy grot brązowy, mniejszy i smuklejszy niż egipskie okucia
 *     ceremonialne — pomocniczy żołnierz, nie gwardzista.
 * N3. KARNACJA WYRAŹNIE CIEMNIEJSZA niż wszystkie istniejące modele w grze
 *     (sprawdzone: Łucznik egipski 0xb9743c, Zulu/Impi — najciemniejsza
 *     dotąd karnacja w grze — 0xb06030). Nubijczyk: 0x5c3620 (cień 0x3d2314)
 *     — zauważalnie ciemniejszy odcień, zgodny z konwencją egipskich
 *     malowideł przedstawiających Nubijczyków (czarno-brązowa karnacja,
 *     kontrastowana z czerwonobrązową Egipcjan i żółtawą Azjatów/Libijczyków
 *     na tzw. „tablicach czterech ras").
 * N4. PRZEPASKA BIODROWA ZE SKÓRY — prosty zawój skórzany z frędzlami przy
 *     dolnej krawędzi (rzemienne paski), spięty węzłem z boku. BEZ metalu,
 *     BEZ zbroi, BEZ fałdowania lnianego (to odróżnia od egipskiego shendytu
 *     — tu surowa wyprawiona skóra, nie tkany len). Kolor jasnego brązu
 *     (0x8a6a42) — wyraźny kontrast z bardzo ciemną karnacją, czytelny jako
 *     osobny element stroju z dystansu.
 * N5. PIÓRO STRUSIA W SKÓRZANEJ OPASCE NA GŁOWIE — pojedyncze pióro
 *     wyprostowane ku górze (nie przechylone jak egipskie dwa pióra opadłe
 *     do tyłu) — inny kąt = inny „podpis" sylwetki głowy. Opaska SKÓRZANA
 *     (nie lniana jak u Egipcjanina), krótkie, gęsto skręcone włosy pod
 *     opaską (bez brody — młody żołnierz pomocniczy, bez oznak rangi).
 * N6. KOŁCZAN SKÓRZANY NA PLECACH — rzemień na pierś (jak u Egipcjanina/
 *     Sumeryjczyka), ale skóra WYPRAWIONA CIEMNIEJ (0x6b4a28) niż jasny len
 *     egipski — zestaw materiałów całej sylwetki jest jednolicie skórzany/
 *     drewniany, bez tkaniny.
 * N7. OCHRANIACZ NA PRZEDRAMIENIU (bracer) na LEWYM (łukowym) ramieniu —
 *     wymóg funkcjonalny (cięciwa przy zwolnieniu uderza w przedramię bez
 *     bracera) i wymóg właściciela. Skórzany, ciemny.
 * N8. MAŁA TARCZA ZE SKÓRY WOŁOWEJ — spięta rzemieniem na plecach, NIE
 *     trzymana (obie dłonie zajęte łukiem) — drugorzędny detal historyczny
 *     (egipscy najemnicy nubijscy bywali wyposażani w lekkie tarcze), mały
 *     rozmiar (0.075*HEX_R promień), umieszczona nisko z tyłu żeby NIE
 *     zaburzać sylwetki łuku — zgodnie z priorytetem właściciela.
 * N9. BOSE STOPY, brak sandałów — pomocniczy żołnierz w marszu (jak reszta
 *     rodziny łuczników epoki Kamienia/Brązu w tej serii).
 * N10. CZEGO ŚWIADOMIE NIE MA: żadnego metalu poza grotem strzały, żadnego
 *     nemes/ureusza (atrybuty władzy egipskiej), żadnych oznaczeń rangi,
 *     żadnej zbroi. To szeregowy łucznik pomocniczy Ta-Seti.
 *
 * -- ROZRÓŻNIALNOŚĆ wobec Łucznika egipskiego (obaj Egipt, ale różne epoki
 *    i różne jednostki w grze — mają czytać się jako oddzielne sylwetki):
 *    ŁUCZNIK EGIPSKI (Kamień): jaśniejsza czerwonobrązowa karnacja, WYSOKI
 *    ale krótszy łuk dwuwypukły (bulwiasty profil), biała lniana przepaska
 *    shendyt w fałdy, DWA pióra przechylone do tyłu, kolorowy naszyjnik
 *    z paciorków, grot krzemienny POPRZECZNY (płaska płytka).
 *    ŁUCZNIK NUBIJSKI (Brąz): dużo CIEMNIEJSZA karnacja, łuk PROSTY i
 *    WYRAŹNIE DŁUŻSZY (sięga od ziemi po ponad głowę), skórzana (nie
 *    lniana) przepaska z frędzlami, JEDNO pióro wyprostowane w skórzanej
 *    opasce, kołczan + mała tarcza na plecach, grot BRĄZOWY listkowy.
 *
 * Budżet (policzony traversem grupy w skrypcie pomocniczym): patrz raport
 * końcowy zadania (liczba mesh / trójkątów / materiałów).
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
// Karnacja: WYRAŹNIE ciemniejsza niż Łucznik egipski (0xb9743c) i niż
// najciemniejsza dotychczasowa karnacja w grze (Zulu/Impi 0xb06030).
const NB_SKIN        = 0x5c3620;
const NB_SKIN_DK      = 0x3d2314;   // cień żuchwy / dłonie / stopy

const NB_HIDE         = 0x8a6a42;   // skóra przepaski biodrowej (jasny brąz)
const NB_HIDE_DK      = 0x6a4f2e;   // fałd/cień przepaski
const NB_FRINGE       = 0x5a3f24;   // frędzle rzemienne u dołu przepaski

const NB_LEATHER      = 0x6b4a28;   // kołczan / bracer / rzemienie
const NB_LEATHER_DK   = 0x4a331b;
const NB_HEADBAND     = 0x4a331b;   // skórzana opaska na czole

const NB_WOOD_BOW     = 0x6f4e2c;   // twarde drewno self-bow (ciemniejsze niż egipskie)
const NB_WOOD_SHAFT   = 0x9c7748;   // drzewce strzał (jaśniejsze — czytelne)
const NB_STRING        = 0xe8e0cc;
const NB_SINEW         = 0xd8cba8;  // oplot ścięgnem

const NB_BRONZE        = 0xcf9234;  // JEDYNY metal — grot strzały (epoka Brązu)
const NB_BRONZE_LT      = 0xdaa84e;

const NB_HAIR          = 0x150d07;  // krótkie, gęsto skręcone włosy
const NB_FEATHER        = 0xeae3d2; // pióro strusia
const NB_FEATHER_DK     = 0x8c7c64;

const NB_SHIELD         = 0x8a3a26; // skóra wołowa tarczy (czerwonawa wyprawa)
const NB_SHIELD_DK       = 0x5a2416;

const NB_EYE            = 0x14100c;

// ── wymiary sylwetki: TE SAME co rodzina KL_*/PD_* (spójność z resztą serii) ─
const NB_HIP_Y     = 0.208 * HEX_R;
const NB_TORSO_W   = 0.180 * HEX_R;
const NB_TORSO_H   = 0.205 * HEX_R;
const NB_TORSO_D   = 0.100 * HEX_R;
const NB_TORSO_BOT = 0.240 * HEX_R;
const NB_TORSO_CTR = NB_TORSO_BOT + NB_TORSO_H * 0.5;
const NB_TORSO_TOP = NB_TORSO_BOT + NB_TORSO_H;
const NB_NECK_H    = 0.028 * HEX_R;
const NB_HEAD_S    = 0.128 * HEX_R;
const NB_HEAD_CTR  = NB_TORSO_TOP + NB_NECK_H + NB_HEAD_S * 0.5;
const NB_HEAD_TOP  = NB_TORSO_TOP + NB_NECK_H + NB_HEAD_S;
const NB_SHLD_X    = NB_TORSO_W * 0.5 + 0.030 * HEX_R;
const NB_SHLD_Y    = NB_TORSO_TOP - 0.024 * HEX_R;
const NB_HIP_X     = 0.052 * HEX_R;

const NB_THIGH_L   = 0.104 * HEX_R;
const NB_SHIN_L    = 0.096 * HEX_R;
const NB_UPARM_L   = 0.100 * HEX_R;
const NB_FOREARM_L = 0.092 * HEX_R;

// ── geometrie-singletony (lazy) ────────────────────────────────────────────
let gNBTorso:    THREE.BoxGeometry | null = null;
let gNBChest:    THREE.BoxGeometry | null = null;
let gNBNeck:     THREE.BoxGeometry | null = null;
let gNBHead:     THREE.BoxGeometry | null = null;
let gNBJaw:      THREE.BoxGeometry | null = null;
let gNBNose:     THREE.BoxGeometry | null = null;
let gNBEar:      THREE.BoxGeometry | null = null;
let gNBEye:      THREE.BoxGeometry | null = null;
let gNBThigh:    THREE.BoxGeometry | null = null;
let gNBShin:     THREE.BoxGeometry | null = null;
let gNBSole:     THREE.BoxGeometry | null = null;
let gNBToes:     THREE.BoxGeometry | null = null;
let gNBUpArm:    THREE.BoxGeometry | null = null;
let gNBForearm:  THREE.BoxGeometry | null = null;
let gNBFist:     THREE.BoxGeometry | null = null;
let gNBUnit:     THREE.BoxGeometry | null = null;
// stroj
let gNBHideWrap: THREE.BoxGeometry | null = null;
let gNBHidePan:  THREE.BoxGeometry | null = null;
let gNBFringe:   THREE.BoxGeometry | null = null;
let gNBBelt:     THREE.BoxGeometry | null = null;
let gNBKnot:     THREE.BoxGeometry | null = null;
let gNBBracer:   THREE.BoxGeometry | null = null;
let gNBHairCap:  THREE.BoxGeometry | null = null;
let gNBHeadBand: THREE.BoxGeometry | null = null;
let gNBFeather:  THREE.BoxGeometry | null = null;
let gNBFeatTip:  THREE.BoxGeometry | null = null;
let gNBFeatTuft: THREE.BoxGeometry | null = null;
let gNBShinWrap: THREE.BoxGeometry | null = null;
// łuk / strzały / kołczan
let gNBGrip:     THREE.BoxGeometry | null = null;
let gNBGripWrap: THREE.BoxGeometry | null = null;
let gNBNock:     THREE.BoxGeometry | null = null;
let gNBArrowTip: THREE.ConeGeometry | null = null;
let gNBBinding:  THREE.BoxGeometry | null = null;
let gNBFletch:   THREE.BoxGeometry | null = null;
let gNBQuiver:   THREE.BoxGeometry | null = null;
let gNBQRim:     THREE.BoxGeometry | null = null;
let gNBQStrap:   THREE.BoxGeometry | null = null;
let gNBQArrow:   THREE.BoxGeometry | null = null;
// tarcza (opcjonalna, na plecach)
let gNBShield:      THREE.CylinderGeometry | null = null;
let gNBShieldRim:   THREE.CylinderGeometry | null = null;
let gNBShieldStrap: THREE.BoxGeometry | null = null;

function getNBTorso():    THREE.BoxGeometry { return (gNBTorso    ||= new THREE.BoxGeometry(NB_TORSO_W, NB_TORSO_H, NB_TORSO_D)); }
function getNBChest():    THREE.BoxGeometry { return (gNBChest    ||= new THREE.BoxGeometry(NB_TORSO_W * 1.05, 0.072 * HEX_R, NB_TORSO_D * 1.06)); }
function getNBNeck():     THREE.BoxGeometry { return (gNBNeck     ||= new THREE.BoxGeometry(0.042 * HEX_R, NB_NECK_H * 1.6, 0.042 * HEX_R)); }
function getNBHead():     THREE.BoxGeometry { return (gNBHead     ||= new THREE.BoxGeometry(NB_HEAD_S, NB_HEAD_S, NB_HEAD_S)); }
function getNBJaw():      THREE.BoxGeometry { return (gNBJaw      ||= new THREE.BoxGeometry(0.086 * HEX_R, 0.034 * HEX_R, 0.038 * HEX_R)); }
function getNBNose():     THREE.BoxGeometry { return (gNBNose     ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.026 * HEX_R, 0.016 * HEX_R)); }
function getNBEar():      THREE.BoxGeometry { return (gNBEar      ||= new THREE.BoxGeometry(0.010 * HEX_R, 0.032 * HEX_R, 0.022 * HEX_R)); }
function getNBEye():      THREE.BoxGeometry { return (gNBEye      ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.011 * HEX_R, 0.008 * HEX_R)); }
function getNBThigh():    THREE.BoxGeometry { return (gNBThigh    ||= new THREE.BoxGeometry(0.056 * HEX_R, NB_THIGH_L, 0.060 * HEX_R)); }
function getNBShin():     THREE.BoxGeometry { return (gNBShin     ||= new THREE.BoxGeometry(0.038 * HEX_R, NB_SHIN_L, 0.042 * HEX_R)); }
function getNBSole():     THREE.BoxGeometry { return (gNBSole     ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.018 * HEX_R, 0.062 * HEX_R)); }
function getNBToes():     THREE.BoxGeometry { return (gNBToes     ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.014 * HEX_R, 0.022 * HEX_R)); }
function getNBUpArm():    THREE.BoxGeometry { return (gNBUpArm    ||= new THREE.BoxGeometry(0.054 * HEX_R, NB_UPARM_L, 0.054 * HEX_R)); }
function getNBForearm():  THREE.BoxGeometry { return (gNBForearm  ||= new THREE.BoxGeometry(0.040 * HEX_R, NB_FOREARM_L, 0.040 * HEX_R)); }
function getNBFist():     THREE.BoxGeometry { return (gNBFist     ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)); }
function getNBUnit():     THREE.BoxGeometry { return (gNBUnit     ||= new THREE.BoxGeometry(1, 1, 1)); }
function getNBHideWrap(): THREE.BoxGeometry { return (gNBHideWrap ||= new THREE.BoxGeometry(0.206 * HEX_R, 0.088 * HEX_R, 0.126 * HEX_R)); }
function getNBHidePan():  THREE.BoxGeometry { return (gNBHidePan  ||= new THREE.BoxGeometry(0.084 * HEX_R, 0.070 * HEX_R, 0.014 * HEX_R)); }
function getNBFringe():   THREE.BoxGeometry { return (gNBFringe   ||= new THREE.BoxGeometry(0.017 * HEX_R, 0.058 * HEX_R, 0.010 * HEX_R)); }
function getNBBelt():     THREE.BoxGeometry { return (gNBBelt     ||= new THREE.BoxGeometry(0.198 * HEX_R, 0.024 * HEX_R, 0.122 * HEX_R)); }
function getNBKnot():     THREE.BoxGeometry { return (gNBKnot     ||= new THREE.BoxGeometry(0.036 * HEX_R, 0.032 * HEX_R, 0.019 * HEX_R)); }
function getNBBracer():   THREE.BoxGeometry { return (gNBBracer   ||= new THREE.BoxGeometry(0.050 * HEX_R, 0.046 * HEX_R, 0.050 * HEX_R)); }
function getNBHairCap():  THREE.BoxGeometry { return (gNBHairCap  ||= new THREE.BoxGeometry(0.130 * HEX_R, 0.040 * HEX_R, 0.130 * HEX_R)); }
function getNBHeadBand(): THREE.BoxGeometry { return (gNBHeadBand ||= new THREE.BoxGeometry(0.136 * HEX_R, 0.024 * HEX_R, 0.136 * HEX_R)); }
function getNBFeather():  THREE.BoxGeometry { return (gNBFeather  ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.100 * HEX_R, 0.010 * HEX_R)); }
function getNBFeatTip():  THREE.BoxGeometry { return (gNBFeatTip  ||= new THREE.BoxGeometry(0.013 * HEX_R, 0.036 * HEX_R, 0.008 * HEX_R)); }
function getNBFeatTuft(): THREE.BoxGeometry { return (gNBFeatTuft ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.020 * HEX_R, 0.026 * HEX_R)); }
function getNBShinWrap(): THREE.BoxGeometry { return (gNBShinWrap ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.020 * HEX_R, 0.046 * HEX_R)); }
function getNBGrip():     THREE.BoxGeometry { return (gNBGrip     ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.076 * HEX_R, 0.026 * HEX_R)); }
function getNBGripWrap(): THREE.BoxGeometry { return (gNBGripWrap ||= new THREE.BoxGeometry(0.029 * HEX_R, 0.040 * HEX_R, 0.031 * HEX_R)); }
function getNBNock():     THREE.BoxGeometry { return (gNBNock     ||= new THREE.BoxGeometry(0.015 * HEX_R, 0.019 * HEX_R, 0.017 * HEX_R)); }
function getNBArrowTip(): THREE.ConeGeometry{ return (gNBArrowTip ||= new THREE.ConeGeometry(0.012 * HEX_R, 0.044 * HEX_R, 4)); }
function getNBBinding():  THREE.BoxGeometry { return (gNBBinding  ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.016 * HEX_R, 0.016 * HEX_R)); }
function getNBFletch():   THREE.BoxGeometry { return (gNBFletch   ||= new THREE.BoxGeometry(0.006 * HEX_R, 0.048 * HEX_R, 0.024 * HEX_R)); }
function getNBQuiver():   THREE.BoxGeometry { return (gNBQuiver   ||= new THREE.BoxGeometry(0.048 * HEX_R, 0.156 * HEX_R, 0.048 * HEX_R)); }
function getNBQRim():     THREE.BoxGeometry { return (gNBQRim     ||= new THREE.BoxGeometry(0.056 * HEX_R, 0.018 * HEX_R, 0.056 * HEX_R)); }
function getNBQStrap():   THREE.BoxGeometry { return (gNBQStrap   ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.230 * HEX_R, 0.010 * HEX_R)); }
function getNBQArrow():   THREE.BoxGeometry { return (gNBQArrow   ||= new THREE.BoxGeometry(0.009 * HEX_R, 0.090 * HEX_R, 0.009 * HEX_R)); }
function getNBShield():     THREE.CylinderGeometry { return (gNBShield     ||= new THREE.CylinderGeometry(0.076 * HEX_R, 0.076 * HEX_R, 0.014 * HEX_R, 10, 1)); }
function getNBShieldRim():  THREE.CylinderGeometry { return (gNBShieldRim  ||= new THREE.CylinderGeometry(0.020 * HEX_R, 0.020 * HEX_R, 0.020 * HEX_R, 8, 1)); }
function getNBShieldStrap():THREE.BoxGeometry      { return (gNBShieldStrap||= new THREE.BoxGeometry(0.020 * HEX_R, 0.170 * HEX_R, 0.009 * HEX_R)); }

// ---------------------------------------------------------------------------
// Kinematyka — konwencja identyczna z kamien-lucznicy-opus5.ts / hastati:
// theta liczone od pionu w dół, +theta = ku przodowi (+Z).
// ---------------------------------------------------------------------------
const NB_Y_UP = new THREE.Vector3(0, 1, 0);

function nbDirDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}

function nbSeg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = nbDirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

/** Segment stałej geometrii od A wzdłuż kierunku jednostkowego D. */
function nbSegDir(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  A: THREE.Vector3, D: THREE.Vector3, len: number,
): THREE.Vector3 {
  const mesh = new THREE.Mesh(geo, mtl);
  if (D.y < -0.9999) mesh.rotation.x = Math.PI;
  else mesh.quaternion.setFromUnitVectors(NB_Y_UP, D);
  mesh.position.copy(A.clone().addScaledVector(D, len * 0.5));
  group.add(mesh);
  return A.clone().addScaledVector(D, len);
}

/** Jednostkowy box rozciągnięty między A i B (cięciwa, strzała, ramię łuku). */
function nbStretch(
  parent: THREE.Object3D, mtl: THREE.MeshStandardMaterial,
  A: THREE.Vector3, B: THREE.Vector3, w: number, d?: number,
): THREE.Mesh {
  const v = B.clone().sub(A);
  const len = v.length();
  const D = v.clone().normalize();
  const mesh = new THREE.Mesh(getNBUnit(), mtl);
  mesh.scale.set(w, len, d ?? w);
  if (D.y < -0.9999) mesh.rotation.x = Math.PI;
  else mesh.quaternion.setFromUnitVectors(NB_Y_UP, D);
  mesh.position.copy(A.clone().addScaledVector(D, len * 0.5));
  parent.add(mesh);
  return mesh;
}

/** Noga: udo + goleń + BOSA stopa (podeszwa + palce) płasko na y = 0. */
function nbBuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mSkin: THREE.MeshStandardMaterial, mSkinDk: THREE.MeshStandardMaterial,
  hipY: number,
): { ankle: THREE.Vector3; footZ: number } {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = nbSeg(group, getNBThigh(), mSkin, P, thU, NB_THIGH_L);
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = nbSeg(group, getNBShin(), mSkin, P, thL, NB_SHIN_L);
  const footZ = P.z + 0.012 * HEX_R;
  const sole = new THREE.Mesh(getNBSole(), mSkin);
  sole.position.set(sx, 0.009 * HEX_R, footZ);
  group.add(sole);
  const toes = new THREE.Mesh(getNBToes(), mSkinDk);
  toes.position.set(sx, 0.007 * HEX_R, footZ + 0.038 * HEX_R);
  group.add(toes);
  return { ankle: P, footZ };
}

/**
 * RAMIĘ PRZEZ IK: bark S -> cel dłoni T, biegun łokcia `pole`.
 * Zwraca pozycję dłoni i oś przedramienia — broń/naramiennik idą NA TEJ OSI.
 */
function nbArmIK(
  group: THREE.Group, S: THREE.Vector3, T: THREE.Vector3, pole: THREE.Vector3,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { hand: THREE.Vector3; axis: THREE.Vector3; elbow: THREE.Vector3 } {
  const L1 = NB_UPARM_L, L2 = NB_FOREARM_L;
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
  nbSegDir(group, getNBUpArm(), mUp, S, dU, L1);
  const elbow = S.clone().addScaledVector(dU, L1);
  const axis = T.clone().sub(elbow).normalize();
  const hand = nbSegDir(group, getNBForearm(), mFore, elbow, axis, L2);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getNBFist(), mFist);
    if (axis.y < -0.9999) fist.rotation.x = Math.PI;
    else fist.quaternion.setFromUnitVectors(NB_Y_UP, axis);
    fist.position.copy(hand.clone().addScaledVector(axis, 0.012 * HEX_R));
    group.add(fist);
  }
  return { hand, axis, elbow };
}

/** Tors + klatka + szyja + głowa + żuchwa + nos + uszy. */
function nbBuildCore(
  group: THREE.Group,
  mTorso: THREE.MeshStandardMaterial, mSkin: THREE.MeshStandardMaterial,
  mSkinDk: THREE.MeshStandardMaterial,
): void {
  const torso = new THREE.Mesh(getNBTorso(), mTorso);
  torso.position.set(0, NB_TORSO_CTR, 0);
  group.add(torso);
  const chest = new THREE.Mesh(getNBChest(), mTorso);
  chest.position.set(0, NB_TORSO_TOP - 0.038 * HEX_R, 0);
  group.add(chest);
  const neck = new THREE.Mesh(getNBNeck(), mSkin);
  neck.position.set(0, NB_TORSO_TOP + NB_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(getNBHead(), mSkin);
  head.position.set(0, NB_HEAD_CTR, 0);
  group.add(head);
  const jaw = new THREE.Mesh(getNBJaw(), mSkinDk);
  jaw.position.set(0, NB_HEAD_CTR - NB_HEAD_S * 0.38, 0.010 * HEX_R);
  group.add(jaw);
  const nose = new THREE.Mesh(getNBNose(), mSkin);
  nose.position.set(0, NB_HEAD_CTR - 0.004 * HEX_R, NB_HEAD_S * 0.5 + 0.006 * HEX_R);
  group.add(nose);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(getNBEar(), mSkinDk);
    ear.position.set(sx * (NB_HEAD_S * 0.5 + 0.004 * HEX_R), NB_HEAD_CTR - 0.006 * HEX_R, 0);
    group.add(ear);
  }
}

// ---------------------------------------------------------------------------
// POZA PEŁNEGO NACIĄGU — kotwice IDENTYCZNE z kamien-lucznicy-opus5.ts /
// jednostki-p3-dystans.ts, żeby CAŁA rodzina łuczników w grze stała tak samo:
//   GRIP — lewa (+X) dłoń na rękojeści łuku,
//   NOCK — prawa (-X) dłoń z nasadą strzały cofnięta za prawy policzek.
// ---------------------------------------------------------------------------
const NB_GRIP = new THREE.Vector3(0.088 * HEX_R, 0.442 * HEX_R, 0.185 * HEX_R);
const NB_NOCK = new THREE.Vector3(-0.052 * HEX_R, 0.458 * HEX_R, -0.020 * HEX_R);

/**
 * ŁUK DŁUGI PROSTY (self bow) z profilu (połowa, lokalnie y = wzdłuż ramion,
 * z = ku celowi). Profil PŁYNNIE ZWĘŻAJĄCY SIĘ, bez bulwiastego wygięcia
 * egipskiego łuku rogowego — cecha "self bow". Połowa rozpiętości = 0.42*HEX_R
 * (Łucznik egipski: 0.292*HEX_R) => górna końcówka ponad głową, dolna niemal
 * przy ziemi — WYRAŹNIE DŁUŻSZY łuk, czytelny z dystansu kamery.
 */
function nbAddBowLimbs(
  group: THREE.Group,
  mBow: THREE.MeshStandardMaterial, mWrap: THREE.MeshStandardMaterial,
): { tipTop: THREE.Vector3; tipBot: THREE.Vector3 } {
  const PROFILE: [number, number][] = [
    [0.040,  0.006],
    [0.150,  0.014],
    [0.260,  0.018],
    [0.350,  0.014],
    [0.420, -0.010],
  ];
  const W = [0.017, 0.015, 0.013, 0.011];

  const dirA = NB_GRIP.clone().sub(NB_NOCK).normalize();
  const yaw = Math.atan2(dirA.x, dirA.z);

  const bow = new THREE.Group();
  bow.position.copy(NB_GRIP);
  bow.rotation.y = yaw;

  const grip = new THREE.Mesh(getNBGrip(), mBow);
  bow.add(grip);
  const wrap = new THREE.Mesh(getNBGripWrap(), mWrap);
  bow.add(wrap);

  for (const sg of [1, -1]) {
    for (let i = 0; i < PROFILE.length - 1; i++) {
      const p = PROFILE[i]!, q = PROFILE[i + 1]!;
      const A = new THREE.Vector3(0, sg * p[0] * HEX_R, p[1] * HEX_R);
      const B = new THREE.Vector3(0, sg * q[0] * HEX_R, q[1] * HEX_R);
      nbStretch(bow, mBow, A, B, W[i]! * HEX_R, (W[i]! + 0.003) * HEX_R);
    }
    const last = PROFILE[PROFILE.length - 1]!;
    const nock = new THREE.Mesh(getNBNock(), mBow);
    nock.position.set(0, sg * last[0] * HEX_R, last[1] * HEX_R);
    bow.add(nock);
  }
  group.add(bow);

  const last = PROFILE[PROFILE.length - 1]!;
  const rotY = new THREE.Matrix4().makeRotationY(yaw);
  const tipTop = new THREE.Vector3(0,  last[0] * HEX_R, last[1] * HEX_R).applyMatrix4(rotY).add(NB_GRIP);
  const tipBot = new THREE.Vector3(0, -last[0] * HEX_R, last[1] * HEX_R).applyMatrix4(rotY).add(NB_GRIP);
  return { tipTop, tipBot };
}

/** Cięciwa naciągnięta w V (od obu końcówek łuczyska do nasady w NOCK). */
function nbAddString(
  group: THREE.Group, tipTop: THREE.Vector3, tipBot: THREE.Vector3,
  mString: THREE.MeshStandardMaterial,
): void {
  nbStretch(group, mString, tipTop, NB_NOCK, 0.007 * HEX_R);
  nbStretch(group, mString, tipBot, NB_NOCK, 0.007 * HEX_R);
}

/** Strzała na osi naciągu: nasada w NOCK, drzewce przez rękojeść, grot BRĄZOWY. */
function nbAddArrow(
  group: THREE.Group,
  mShaft: THREE.MeshStandardMaterial, mBronze: THREE.MeshStandardMaterial,
  mSinew: THREE.MeshStandardMaterial, mFletch: THREE.MeshStandardMaterial,
): void {
  const dirA = NB_GRIP.clone().sub(NB_NOCK).normalize();
  const shaftEnd = NB_GRIP.clone().addScaledVector(dirA, 0.058 * HEX_R);
  nbStretch(group, mShaft, NB_NOCK, shaftEnd, 0.011 * HEX_R);

  const bind = new THREE.Mesh(getNBBinding(), mSinew);
  bind.quaternion.setFromUnitVectors(NB_Y_UP, dirA);
  bind.position.copy(shaftEnd.clone().addScaledVector(dirA, 0.004 * HEX_R));
  group.add(bind);

  const tip = new THREE.Mesh(getNBArrowTip(), mBronze);
  tip.quaternion.setFromUnitVectors(NB_Y_UP, dirA);
  tip.position.copy(shaftEnd.clone().addScaledVector(dirA, 0.024 * HEX_R));
  group.add(tip);

  for (const rz of [0, Math.PI / 2]) {
    const fl = new THREE.Mesh(getNBFletch(), mFletch);
    fl.quaternion.setFromUnitVectors(NB_Y_UP, dirA);
    fl.rotateY(rz);
    fl.position.copy(NB_NOCK.clone().addScaledVector(dirA, 0.030 * HEX_R));
    group.add(fl);
  }
}

/** Kołczan na plecach (skóra) + rzemień przez pierś + 3 strzały z lotkami. */
function nbAddQuiver(
  group: THREE.Group, mLeath: THREE.MeshStandardMaterial,
  mLeathDk: THREE.MeshStandardMaterial, mShaft: THREE.MeshStandardMaterial,
  mFletchOwner: THREE.MeshStandardMaterial,
): void {
  const QX = -0.056 * HEX_R;
  const QZ = -(NB_TORSO_D * 0.5 + 0.032 * HEX_R);
  const q = new THREE.Mesh(getNBQuiver(), mLeath);
  q.rotation.x = -0.24;
  q.rotation.z = 0.22;
  q.position.set(QX, NB_TORSO_CTR + 0.050 * HEX_R, QZ);
  group.add(q);
  const rim = new THREE.Mesh(getNBQRim(), mLeathDk);
  rim.rotation.x = -0.24;
  rim.rotation.z = 0.22;
  rim.position.set(QX - 0.018 * HEX_R, NB_TORSO_CTR + 0.126 * HEX_R, QZ - 0.020 * HEX_R);
  group.add(rim);
  const strapB = new THREE.Mesh(getNBQStrap(), mLeathDk);
  strapB.rotation.set(0.10, 0, -0.62);
  strapB.position.set(-0.012 * HEX_R, NB_TORSO_CTR + 0.010 * HEX_R, -(NB_TORSO_D * 0.5 + 0.008 * HEX_R));
  group.add(strapB);
  const strapF = new THREE.Mesh(getNBQStrap(), mLeath);
  strapF.rotation.set(-0.10, 0, 0.60);
  strapF.position.set(-0.010 * HEX_R, NB_TORSO_CTR + 0.008 * HEX_R, NB_TORSO_D * 0.5 + 0.006 * HEX_R);
  group.add(strapF);
  for (const [dx, dy] of ([[-0.022, 0.0], [0.002, 0.012], [0.020, -0.006]] as [number, number][])) {
    const sh = new THREE.Mesh(getNBQArrow(), mShaft);
    sh.rotation.x = -0.24; sh.rotation.z = 0.22;
    sh.position.set(QX + dx * HEX_R, NB_TORSO_CTR + (0.140 + dy) * HEX_R, QZ - 0.020 * HEX_R);
    group.add(sh);
    const f = new THREE.Mesh(getNBFletch(), mFletchOwner);
    f.rotation.x = -0.24; f.rotation.z = 0.22;
    f.scale.set(1.0, 0.66, 0.66);
    f.position.set(QX + (dx - 0.012) * HEX_R, NB_TORSO_CTR + (0.180 + dy) * HEX_R, QZ - 0.030 * HEX_R);
    group.add(f);
  }
}

/** Mała tarcza ze skóry wołowej — spięta rzemieniem NISKO na plecach (nie
 * trzymana, obie dłonie zajęte łukiem), żeby nie zaburzać sylwetki łuku. */
function nbAddBackShield(
  group: THREE.Group, mShield: THREE.MeshStandardMaterial,
  mShieldDk: THREE.MeshStandardMaterial, mStrap: THREE.MeshStandardMaterial,
): void {
  const SX = 0.052 * HEX_R;
  const SZ = -(NB_TORSO_D * 0.5 + 0.020 * HEX_R);
  const SY = NB_TORSO_BOT + 0.058 * HEX_R;
  const face = new THREE.Mesh(getNBShield(), mShield);
  face.rotation.x = Math.PI / 2 - 0.30;
  face.rotation.z = 0.10;
  face.position.set(SX, SY, SZ);
  group.add(face);
  const boss = new THREE.Mesh(getNBShieldRim(), mShieldDk);
  boss.rotation.x = Math.PI / 2 - 0.30;
  boss.position.set(SX, SY, SZ - 0.012 * HEX_R);
  group.add(boss);
  const strap = new THREE.Mesh(getNBShieldStrap(), mStrap);
  strap.rotation.set(0.06, 0, 0.30);
  strap.position.set(SX * 0.4, NB_TORSO_CTR - 0.010 * HEX_R, SZ + 0.006 * HEX_R);
  group.add(strap);
}

/** Nogi w rozkroku strzeleckim (te same kąty co reszta łuczników serii). */
function nbArcherLegs(
  group: THREE.Group, mSkin: THREE.MeshStandardMaterial,
  mSkinDk: THREE.MeshStandardMaterial,
): void {
  const HIP = NB_HIP_Y - 0.006 * HEX_R;
  nbBuildLeg(group,  NB_HIP_X,  0.30,  0.16, mSkin, mSkinDk, HIP);
  nbBuildLeg(group, -NB_HIP_X, -0.34, -0.14, mSkin, mSkinDk, HIP);
  // opaski rzemienne na goleniach (detal wojownika pomocniczego)
  for (const sx of [-1, 1]) {
    const wrap = new THREE.Mesh(getNBShinWrap(), mSkinDk);
    wrap.position.set(sx * NB_HIP_X * 1.05, 0.052 * HEX_R, sx > 0 ? 0.006 * HEX_R : -0.002 * HEX_R);
    group.add(wrap);
  }
}

/** Ramiona w naciągu: lewe (+X) do rękojeści, prawe (-X) do nasady przy policzku. */
function nbArcherArms(
  group: THREE.Group, mUp: THREE.MeshStandardMaterial,
  mFore: THREE.MeshStandardMaterial, mFist: THREE.MeshStandardMaterial,
): { left: { hand: THREE.Vector3; axis: THREE.Vector3; elbow: THREE.Vector3 };
     right: { hand: THREE.Vector3; axis: THREE.Vector3; elbow: THREE.Vector3 } } {
  const left = nbArmIK(group, new THREE.Vector3(NB_SHLD_X, NB_SHLD_Y, 0), NB_GRIP,
                       new THREE.Vector3(0.55, -0.70, 0.20), mUp, mFore, mFist);
  const right = nbArmIK(group, new THREE.Vector3(-NB_SHLD_X, NB_SHLD_Y, 0), NB_NOCK,
                        new THREE.Vector3(-0.55, 0.85, -0.25), mUp, mFore, mFist);
  return { left, right };
}

// ===========================================================================
// ŁUCZNIK NUBIJSKI — OPUS 5 (Egipt, epoka Brązu — Ta-Seti, "Kraina Łuku")
// Bardzo ciemna karnacja, skórzana przepaska biodrowa z frędzlami, skórzana
// opaska z JEDNYM wyprostowanym piórem strusia, kołczan skórzany + mała
// tarcza ze skóry wołowej na plecach, skórzany bracer na lewym przedramieniu.
// ŁUK DŁUGI PROSTY (self bow) — WYRAŹNIE dłuższy niż egipski łuk rogowy,
// górna końcówka ponad głową, dolna niemal przy ziemi. Strzała z BRĄZOWYM
// grotem — jedyny metal w modelu. Boso.
// ===========================================================================
export function buildNubianArcherOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin     = mat(NB_SKIN,        0.05, 0.82);
  const mSkinDk   = mat(NB_SKIN_DK,     0.05, 0.85);
  const mHide     = mat(NB_HIDE,        0.05, 0.86);
  const mHideDk   = mat(NB_HIDE_DK,     0.05, 0.88);
  const mFringe   = mat(NB_FRINGE,      0.05, 0.88);
  const mOwner    = mat(ownerColor_,    0.10, 0.70);
  const mWood     = mat(NB_WOOD_BOW,    0.05, 0.84);
  const mShaft    = mat(NB_WOOD_SHAFT,  0.05, 0.84);
  const mLeath    = mat(NB_LEATHER,     0.06, 0.82);
  const mLeathDk  = mat(NB_LEATHER_DK,  0.06, 0.86);
  const mHeadBand = mat(NB_HEADBAND,    0.06, 0.84);
  const mString   = mat(NB_STRING,      0.02, 0.95);
  const mSinew    = mat(NB_SINEW,       0.03, 0.92);
  const mBronze   = mat(NB_BRONZE,      0.55, 0.40);
  const mBronzeLt = mat(NB_BRONZE_LT,   0.60, 0.34);
  const mHair     = mat(NB_HAIR,        0.04, 0.90);
  const mFeath    = mat(NB_FEATHER,     0.03, 0.92);
  const mFeathDk  = mat(NB_FEATHER_DK,  0.04, 0.90);
  const mShield   = mat(NB_SHIELD,      0.05, 0.84);
  const mShieldDk = mat(NB_SHIELD_DK,   0.05, 0.86);
  const mEye      = mat(NB_EYE,         0.05, 0.86);

  // ═══ KORPUS (naga pierś = bardzo ciemna karnacja) + NOGI ═════════════════
  nbBuildCore(group, mSkin, mSkin, mSkinDk);
  nbArcherLegs(group, mSkin, mSkinDk);

  // ═══ TWARZ: proste, czyste oczy (bez kohlu — to atrybut egipski) ═════════
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(getNBEye(), mEye);
    eye.position.set(sx * 0.026 * HEX_R, NB_HEAD_CTR + 0.014 * HEX_R, NB_HEAD_S * 0.5 + 0.002 * HEX_R);
    group.add(eye);
  }

  // ═══ WŁOSY KRÓTKIE + SKÓRZANA OPASKA + JEDNO PIÓRO WYPROSTOWANE ══════════
  const hair = new THREE.Mesh(getNBHairCap(), mHair);
  hair.position.set(0, NB_HEAD_TOP - 0.020 * HEX_R, 0);
  group.add(hair);
  const band = new THREE.Mesh(getNBHeadBand(), mHeadBand);   // SKÓRZANA (nie lniana)
  band.position.set(0, NB_HEAD_CTR + 0.040 * HEX_R, 0);
  group.add(band);
  // pióro WYPROSTOWANE ku górze (nie przechylone jak u Egipcjanina) — inny
  // "podpis" sylwetki głowy
  const featTuft = new THREE.Mesh(getNBFeatTuft(), mFeathDk);
  featTuft.position.set(-0.006 * HEX_R, NB_HEAD_TOP + 0.010 * HEX_R, -0.030 * HEX_R);
  group.add(featTuft);
  const feather = new THREE.Mesh(getNBFeather(), mFeath);
  feather.rotation.x = -0.06;
  feather.position.set(-0.006 * HEX_R, NB_HEAD_TOP + 0.062 * HEX_R, -0.032 * HEX_R);
  group.add(feather);
  const featTip = new THREE.Mesh(getNBFeatTip(), mFeathDk);
  featTip.rotation.x = -0.06;
  featTip.position.set(-0.006 * HEX_R, NB_HEAD_TOP + 0.116 * HEX_R, -0.036 * HEX_R);
  group.add(featTip);

  // ═══ PRZEPASKA BIODROWA ZE SKÓRY + FRĘDZLE + PAS KOLORU GRACZA ═══════════
  const wrap = new THREE.Mesh(getNBHideWrap(), mHide);
  wrap.position.set(0, NB_TORSO_BOT - 0.024 * HEX_R, 0);
  group.add(wrap);
  const panel = new THREE.Mesh(getNBHidePan(), mHideDk);      // zakład z przodu
  panel.rotation.x = -0.08;
  panel.position.set(0, NB_TORSO_BOT - 0.040 * HEX_R, NB_TORSO_D * 0.5 + 0.020 * HEX_R);
  group.add(panel);
  for (const sx of [-0.066, -0.022, 0.022, 0.066]) {          // frędzle rzemienne
    const fr = new THREE.Mesh(getNBFringe(), mFringe);
    fr.position.set(sx * HEX_R, NB_TORSO_BOT - 0.058 * HEX_R, NB_TORSO_D * 0.5 + 0.010 * HEX_R);
    group.add(fr);
  }
  const belt = new THREE.Mesh(getNBBelt(), mOwner);
  belt.position.set(0, NB_TORSO_BOT + 0.014 * HEX_R, 0);
  group.add(belt);
  const knot = new THREE.Mesh(getNBKnot(), mOwner);
  knot.position.set(0.030 * HEX_R, NB_TORSO_BOT + 0.008 * HEX_R, NB_TORSO_D * 0.5 + 0.012 * HEX_R);
  group.add(knot);

  // ═══ RAMIONA + SKÓRZANY BRACER na lewym (łukowym) przedramieniu ═════════
  const arms = nbArcherArms(group, mSkin, mSkin, mSkinDk);
  const bracer = new THREE.Mesh(getNBBracer(), mLeath);
  bracer.quaternion.setFromUnitVectors(NB_Y_UP, arms.left.axis);
  bracer.position.copy(arms.left.hand.clone().addScaledVector(arms.left.axis, -0.040 * HEX_R));
  group.add(bracer);

  // ═══ KOŁCZAN SKÓRZANY NA PLECACH + MAŁA TARCZA ZE SKÓRY WOŁOWEJ ═════════
  nbAddQuiver(group, mLeath, mLeathDk, mShaft, mOwner);
  nbAddBackShield(group, mShield, mShieldDk, mLeathDk);

  // ═══ ŁUK DŁUGI PROSTY + CIĘCIWA + STRZAŁA Z GROTEM BRĄZOWYM ═════════════
  const bow = nbAddBowLimbs(group, mWood, mLeath);
  nbAddString(group, bow.tipTop, bow.tipBot, mString);
  nbAddArrow(group, mShaft, mBronze, mSinew, mOwner);
  void mBronzeLt; // rezerwa palety (spójność z rodziną — nieużyta krawędź grotu)

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

/** Zwolnienie singletonów modułu (konwencja disposeUnitGeometries z units.ts). */
export function disposeBrazLucznikNubijskiOpus5Geometries(): void {
  const all: (THREE.BufferGeometry | null)[] = [
    gNBTorso, gNBChest, gNBNeck, gNBHead, gNBJaw, gNBNose, gNBEar, gNBEye,
    gNBThigh, gNBShin, gNBSole, gNBToes, gNBUpArm, gNBForearm, gNBFist, gNBUnit,
    gNBHideWrap, gNBHidePan, gNBFringe, gNBBelt, gNBKnot, gNBBracer,
    gNBHairCap, gNBHeadBand, gNBFeather, gNBFeatTip, gNBFeatTuft, gNBShinWrap,
    gNBGrip, gNBGripWrap, gNBNock, gNBArrowTip, gNBBinding, gNBFletch,
    gNBQuiver, gNBQRim, gNBQStrap, gNBQArrow,
    gNBShield, gNBShieldRim, gNBShieldStrap,
  ];
  for (const g of all) { g?.dispose(); }
  gNBTorso = gNBChest = gNBNeck = gNBHead = gNBJaw = gNBNose = gNBEar = gNBEye = null;
  gNBThigh = gNBShin = gNBSole = gNBToes = gNBUpArm = gNBForearm = gNBFist = gNBUnit = null;
  gNBHideWrap = gNBHidePan = gNBFringe = gNBBelt = gNBKnot = gNBBracer = null;
  gNBHairCap = gNBHeadBand = gNBFeather = gNBFeatTip = gNBFeatTuft = gNBShinWrap = null;
  gNBGrip = gNBGripWrap = gNBNock = gNBArrowTip = gNBBinding = gNBFletch = null;
  gNBQuiver = gNBQRim = gNBQStrap = gNBQArrow = null;
  gNBShield = gNBShieldRim = gNBShieldStrap = null;
}
