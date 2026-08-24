/**
 * zelazo-konnica-asyryjska-opus5.ts — KONNICA ASYRYJSKA, epoka ŻELAZA
 * units.json: „Konnica lancowa asyryjska" (Nazwa EN „Assyrian Lancer") i
 * „Konnica łucznicza asyryjska" (Nazwa EN „Assyrian Horse Archer"), oba
 * Epoka=Żelazo, Kultura=Asyria, Tech=Hutnictwo żelaza, Surowiec=Żelazo,
 * Typ=Mount, „W zamian za": Konnica. DZIŚ (przed tym plikiem): obie jednostki
 * dostawały identyczny model przez generyczny fallback `case 'konnica'`
 * w units.ts (~linia 3202) — sam wygląd nie odróżniał ich ani od siebie
 * nawzajem, ani od uniwersalnej „Konnicy" (Brąz). To jest realny błąd
 * wizualny (łucznik nie dzierżył łuku), nie tylko brak unikalności.
 * ---------------------------------------------------------------------------
 * Drop-in zgodny z rodziną builderów Opus 5:
 *   buildZelazoKonnicaLancowaAsyryjska(ownerColor)   : THREE.Group
 *   buildZelazoKonnicaLuczniczaAsyryjska(ownerColor) : THREE.Group
 *   disposeZelazoKonnicaAsyryjskaOpus5Geometries()   : void
 *
 * Konwencje serii (jak braz-konnica-opus5.ts):
 *   - token PRZODEM do +Z (kamera gry stoi po stronie +Z, patrzy pod 52°),
 *     kopyta na y = 0 grupy,
 *   - układ prawoskrętny: przód = +Z, góra = +Y ⇒ LEWA ręka jeźdźca = +X
 *     (wodze), PRAWA = -X (broń główna),
 *   - WYŁĄCZNIE MeshStandardMaterial,
 *   - geometrie wspólne = SINGLETONY MODUŁU (lazy), `perTokenGeos` puste,
 *   - `group.userData['mats']` / `['perTokenGeos']` jak w całej serii,
 *   - HEX_R = 1.0 z hexutil.ts. Obie jednostki DZIELĄ jeden koń-builder
 *     (`acBuildMount`) i jeden korpus-jeźdźca-builder (`acBuildRiderCore` —
 *     tors w zbroi łuskowej, głowa, hełm, broda, nogi bez strzemion) —
 *     różni je WYŁĄCZNIE uzbrojenie ramion, dokładnie tak jak w
 *     rzeczywistości różniły się te dwie role tej samej formacji kawalerii.
 *
 * USTAWIENIE 3/4: cała bryła na wewnętrznym pivocie obróconym o AC_YAW wokół
 * Y (jak w braz-konnica-opus5.ts) — koń bokiem-skosem do kamery czyta się
 * jako koń, nie jako plama.
 *
 * KOLOR GRACZA (sloty tintu, dwa wspólne + jeden dodatkowy u łucznika):
 *   (1) CZAPRAK (derka pod jeźdźcem + obie płachty na boki konia) — główny
 *       nośnik, jak w całej serii konnej;
 *   (2) SZARFA/PAS jeźdźca na zbroi łuskowej — wzorem `buildAssyrianArcher`
 *       („REKAWY tuniki pod luska + szarfa pasa"), tu bez rękawów (zbroja
 *       bez rękawów pod pancerzem płytek), więc szarfa niesie ten sam slot;
 *   (3) TYLKO łucznik: lotki strzał w kołczanie — dokładnie jak w
 *       `buildAssyrianArcher` (piechota tej samej kultury).
 *
 * ===========================================================================
 * ZGODNOŚĆ HISTORYCZNA — DECYZJE I UZASADNIENIA
 * ===========================================================================
 * Rama czasowa: Neo-Asyryjskie Imperium, ok. 900–600 p.n.e. — okres, w którym
 * kawaleria konna staje się TRWAŁYM, PROFESJONALNYM rodzajem broni armii
 * asyryjskiej (nie tylko dodatkiem do rydwanu jak w epoce Brązu). Reformy
 * wojskowe przypisywane Tiglat-Pileserowi III (pan. 745–727 p.n.e.) tworzą
 * stałe oddziały jazdy; płaskorzeźby pałacowe z Nimrud i Niniwy (od
 * Aszurnasirpala II po Aszurbanipala, VII w. p.n.e.) dokumentują ewolucję od
 * PAR jeźdźców (jeden trzyma obie wodze, drugi strzela/dźga) do POJEDYNCZYCH
 * jeźdźców panujących samodzielnie nad koniem i bronią — stan przyjęty tu,
 * bo to jednostka w pełni samodzielna w grze.
 *
 * Z1. BRAK STRZEMION — bezwzględnie, tak samo jak w `braz-konnica-opus5.ts`
 *     (K1 tamtego pliku). Strzemię to wynalazek o kilkanaście–dwadzieścia
 *     wieków późniejszy (poświadczone solidnie dopiero w Chinach/Azji
 *     Wschodniej ok. IV–V w. n.e., na Bliski Wschód dociera dopiero we
 *     wczesnym średniowieczu). W epoce Żelaza na Bliskim Wschodzie NIE
 *     ISTNIEJE w żadnej udokumentowanej formie. Model: nogi jeźdźca ZWISAJĄ
 *     SWOBODNIE, brak jakiegokolwiek punktu oparcia stopy.
 * Z2. BRAK SIODŁA ZE SZTYWNYM DRZEWEM. Płaskorzeźby asyryjskie (zwłaszcza
 *     z czasów Aszurbanipala) pokazują ozdobną DERKĘ/PODKŁADKĘ pod jeźdźcem
 *     — bogatszą i bardziej zdobną niż wczesniejsze prowizoryczne derki, z
 *     WIDOCZNYM FREDZLOWANIEM/CHWOSTAMI zwisającymi z napierśnika — ale
 *     nadal BEZ sztywnego drzewa, łęku przedniego ani tylnego, bez terlicy.
 *     Utrzymuje ją ten sam zestaw co w epoce Brązu: POPRĄG pod brzuchem,
 *     NAPIERŚNIK z przodu, POŚLIŚNIK do nasady ogona. Różnica wobec K2 z
 *     Brązu jest w BOGACTWIE derki (fredzle, dłuższe płachty), nie w jej
 *     konstrukcji — konstrukcyjnie to nadal ten sam, "miękki" system.
 * Z3. UZDA Z BRĄZOWYM WĘDZIDŁEM — świadomie NIE żelaznym. Żelazo w tej
 *     epoce jest kosztowne i priorytetowo idzie w BROŃ i PANCERZ (stąd
 *     `Tech: Hutnictwo żelaza`, `Surowiec: Żelazo` w units.json dotyczą
 *     uzbrojenia jednostki, nie oporządzenia konia) — okucia końskie
 *     (wędzidło, sprzączki) pozostają brązowe najdłużej, bo brąz jest
 *     tańszy w produkcji drobnych, odlewanych elementów i nie koroduje jak
 *     żelazo. To NIE jest niedopatrzenie: to świadomy kontrast materiałowy
 *     między bronią (żelazo, nowe) a oporządzeniem (brąz, kontynuacja) —
 *     ten sam podział widoczny w realnych znaleziskach asyryjskich.
 * Z4. UZBROJENIE — KLUCZOWA RÓŻNICA FUNKCJONALNA MIĘDZY DWIEMA JEDNOSTKAMI:
 *     (a) Konnica LANCOWA: `Atak dystansowy: 0`, `Uwagi: „Elitarna konnica
 *     szturmowa z długą lancą i okrągłą tarczą"` — DŁUGA lanca (dłuższa niż
 *     jednoręczna dzida Konnicy z Brązu — K4 tamtego pliku świadomie
 *     odrzucał łuk, bo Brąz to `Atak dystansowy: 0` BEZ tarczy; ta jednostka
 *     ma tarczę wprost w danych) trzymana w PRAWEJ dłoni „na gotowość"
 *     (drzewce nachylone, nie poziomo skierowane — dłuższe drzewce podnosi
 *     wysokość sylwetki, nie jej szerokość, więc mieści się w budżecie
 *     promienia poziomego heksu), OKRĄGŁA TARCZA przypięta do LEWEGO
 *     przedramienia (ta sama ręka co wodze — udokumentowana technika:
 *     tarcza na pasie naramiennym, wodze trzymane tą samą dłonią/nadgarstkiem
 *     poniżej tarczy). Grot lancy ŻELAZNY (liściasty, ten sam profil co grot
 *     Włócznika brązowego, ale materiał = żelazo/stal — postęp technologiczny
 *     epoki, zgodnie z `Tech: Hutnictwo żelaza`).
 *     (b) Konnica ŁUCZNICZA: `Atak dystansowy: 6`, `Zasięg ataku (hex): 2`,
 *     `Uwagi: „Konnica z łukiem kompozytowym; silny ostrzał przed zwarciem"`
 *     — MUSI dzierżyć ŁUK, nie broń drzewcową. Łuk kompozytowy w pełnym
 *     naciągu (lewa dłoń wyprostowana z uchwytem łuku, prawa dłoń cofnięta
 *     do policzka z nasadą strzały — ta sama konwencja co
 *     `buildAssyrianArcher` w `jednostki-p3-dystans.ts`, przeniesiona na
 *     jeźdźca), kołczan na plecach z widocznymi grotami strzał. Wodze na
 *     czas strzału są LUŹNO ZAPĘTLONE na przedramieniu dłoni trzymającej
 *     łuk — udokumentowana technika samodzielnego jeźdźca-łucznika
 *     (płaskorzeźby Aszurbanipala pokazują pojedynczych jeźdźców strzelających
 *     bez drugiego woźnicy trzymającego wodze), NIE osobna dłoń na wodzach
 *     (obie dłonie fizycznie zajęte łukiem podczas strzału).
 *     Rozważona i ODRZUCONA alternatywa dla łucznika: lanca zamiast łuku —
 *     odrzucona wprost, bo to byłby dokładnie ten sam błąd, który ten
 *     dispatch ma naprawić (jednostka DYSTANSOWA bez broni dystansowej).
 * Z5. DOSIAD: jeździec siedzi NA GRZBIECIE tuż za kłębem (jak K5 w
 *     Brązu) — w epoce Żelaza, przy w pełni ukształtowanej kawalerii
 *     bojowej, dosiad "oślny" (na zadzie) jest już historycznie
 *     nieaktualny; źródła z tego okresu pokazują jeźdźca osadzonego wysoko,
 *     blisko kłębu, co pozwala ściskać konia łydkami przy walce.
 * Z6. KOŃ WIĘKSZY I SMUKLEJSZY NIŻ KOŃ EPOKI BRĄZU (współczynnik skali
 *     AC_S = 1.06, tj. ok. +6% wysokości w kłębie względem
 *     `braz-konnica-opus5.ts`). Uzasadnienie: korespondencja pałacowa i
 *     listy poborowe z Nimrud dokumentują SYSTEMATYCZNY import/pobór koni
 *     bojowych z Medii i Urartu na rzecz asyryjskiej kawalerii — regiony te
 *     były w starożytności cenione właśnie za jakość i posturę koni
 *     (korzenie późniejszej sławy koni "nisejskich" z tego samego regionu
 *     geograficznego, poświadczonej klasycznie dla kolejnych stuleci).
 *     Skala jest ŚWIADOMIE UMIARKOWANA (+6%, nie np. +30%): źródła nie
 *     dają podstaw do twierdzenia o dramatycznym skoku wielkości konia w tym
 *     konkretnym okresie, więc modelowana różnica jest realistycznie mała,
 *     nie efektowna. SIERŚĆ: jednolita gniada/kasztanowata BEZ pręgi
 *     grzbietowej i innych znamion "pierwotnych" (K7 Brązu) — selektywna
 *     hodowla kawalerii dworskiej w tym okresie eliminowała maści
 *     "pierwotne" typowe dla wczesnych koni udomowionych; to JEDNOCZEŚNIE
 *     najlepiej czytelny na zrzucie sygnał odróżniający od konia Brązu.
 * Z7. ZBROJA ŁUSKOWA (PANCERZ PŁYTKOWY-LAMELKOWY) na jeźdźcu, wysoki
 *     stożkowy hełm z grzebieniem łuskowym, długa broda, wysokie buty —
 *     DOKŁADNIE kanon wizualny Asyrii ustalony w `buildAssyrianArcher`
 *     (`jednostki-p3-dystans.ts`, ta sama kultura, ta sama epoka
 *     przejściowa Brąz→Żelazo tej jednej jednostki referencyjnej) —
 *     zachowana spójność międzyepokowa tej cywilizacji. RÓŻNICA MATERIAŁOWA
 *     ŚWIADOMA: łuska tu jest SZARO-STALOWA (żelazna), nie brązowo-płowa
 *     (`PD_SCALE = 0x9a8a5a`) jak u archera Brązu — units.json przypisuje
 *     tym dwóm jednostkom `Tech: Hutnictwo żelaza`/`Surowiec: Żelazo`
 *     wprost, więc pancerz z tego samego metalu co przypisana technologia
 *     jest bezpośrednim, sprawdzalnym odwzorowaniem danych jednostki, a przy
 *     okazji kolejnym czytelnym sygnałem odróżniającym od Brązu.
 * Z8. CZEGO ŚWIADOMIE NIE MA (jak K9 Brązu, plus pozycje specyficzne dla tej
 *     epoki): strzemion, puślisk, siodła z łękami/terlicą, ostróg, podków
 *     (średniowiecze), zbroi konia/kropierza (asyryjskie relify pokazują
 *     opancerzone konie WYŁĄCZNIE sporadycznie, dla eskorty królewskiej w
 *     późniejszych, najbardziej reprezentacyjnych scenach VII w. — świadomie
 *     ODRZUCONE dla jednostki liniowej rosteru, nie postaci ceremonialnej),
 *     hełmu na koniu, oznaczeń rangi, chorągwi na lancy (ta jest osobną,
 *     bezpośrednio bojową bronią, nie sztandarem).
 * Z9. ROZRÓŻNIALNOŚĆ — trzy wymagane kontrasty:
 *     (a) wobec SIEBIE NAWZAJEM: lanca+okrągła tarcza (prawa dłoń uniesiona,
 *         lewe przedramię z tarczą) kontra łuk w pełnym naciągu+kołczan na
 *         plecach (obie dłonie zajęte łukiem, brak tarczy) — sylwetki
 *         nie do pomylenia nawet w miniaturze;
 *     (b) wobec generycznej „Konnicy" (Brąz, `braz-konnica-opus5.ts`):
 *         inny (większy, jednolity) koń, zbroja łuskowa żelazna zamiast
 *         wełnianej tuniki, wysoki stożkowy hełm zamiast miękkiej czapki,
 *         długa broda, tarcza u lancera (Brąz jej nie ma — K4 Brązu
 *         wprost), łuk u łucznika (Brąz to czysta jednostka zwarcia);
 *     (c) wobec generycznego fallbacku `case 'konnica'` w `units.ts`
 *         (~linia 3202): tamten model to inny, uproszczony koń bez
 *         uzdy/wodzy/czapraka i bez nóg jeźdźca (dwa klocki-ramiona) — nasz
 *         ma pełne oporządzenie, nogi bez strzemion i bogaty pancerz.
 *
 * BUDŻET: obie jednostki dzielą jeden moduł geometrii koń+korpus jeźdźca
 * (zero duplikacji), różni je wyłącznie kilkanaście meshy uzbrojenia ramion.
 *
 * Uruchamiać z katalogu gra/, NIGDY `npm run build`/`npm run dev` (C-001).
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
const AC_COAT       = 0x7a4527;   // gniady/kasztanowaty JEDNOLITY (Z6 — brak znamion pierwotnych)
const AC_COAT_DK    = 0x4d2a18;   // cienie sierści, pęciny
const AC_MANE        = 0x140c07;  // grzywa/ogon — ciemniejsze niż Brąz (koń hodowany, nie stepowy)
const AC_HOOF        = 0x241a10;

const AC_SKIN        = 0xdba876;
const AC_SKIN_DK     = 0xb9855a;

const AC_SCALE        = 0x8f97a0;  // łuska ŻELAZNA szaro-stalowa (Z7 — kontrast wobec brązu Bronzu)
const AC_SCALE_DK     = 0x656d75;
const AC_IRON         = 0x6c7480;  // grot lancy / groty strzał — ŻELAZO
const AC_IRON_LT      = 0x99a2ab;

const AC_BRONZE       = 0xcf9234;  // okucia uzdy — ŚWIADOMIE nadal brąz (Z3)
const AC_BRONZE_LT    = 0xdaa84e;

const AC_LEATHER      = 0x6b4a28;
const AC_LEATHER_DK   = 0x44301a;
const AC_WOOD         = 0x7a5c3a;
const AC_WOOD_BOW     = 0x8a6238;
const AC_STRING       = 0xe8e0cc;
const AC_BOOT         = 0x3f2c1f;
const AC_HAIR         = 0x1a0c06;   // broda
const AC_EYE          = 0x14100c;
const AC_SHIELD_FACE  = 0x5a3a20;   // tarcza: drewno/skóra
const AC_SHIELD_RIM   = 0x8f97a0;   // obręcz — żelazo, spójne z pancerzem

// ── skala konia (Z6): +6% wobec braz-konnica-opus5.ts, jeden mnożnik ───────
const AC_S = 1.06;

// ── wysokości / osie sylwetki KONIA (×HEX_R×AC_S) ───────────────────────────
const AC_BODY_CTR   = 0.332;
const AC_BACK_Y      = 0.440;    // grzbiet = dosiad jeźdźca
const AC_BELLY_Y     = 0.224;
const AC_LEG_TOP_F   = 0.2595;
const AC_LEG_TOP_R   = 0.2607;
const AC_SEAT_Z      = 0.010;

// ── wymiary JEŹDŹCA (×HEX_R, BEZ AC_S — człowiek nie urósł w tej epoce) ────
const AC_TORSO_W    = 0.140;
const AC_TORSO_H    = 0.150;
const AC_TORSO_D    = 0.090;   // nieco głębszy niż Brąz (0.084) — bryła zbroi płytkowej
const AC_TORSO_TOP  = AC_BACK_Y * AC_S + AC_TORSO_H;
const AC_NECK_H     = 0.021;
const AC_HEAD_S     = 0.100;
const AC_HEAD_CTR   = AC_TORSO_TOP + AC_NECK_H + AC_HEAD_S * 0.5;
const AC_HEAD_TOP   = AC_TORSO_TOP + AC_NECK_H + AC_HEAD_S;
const AC_SHLD_X     = AC_TORSO_W * 0.5 + 0.014;
const AC_SHLD_Y     = AC_TORSO_TOP - 0.019;
const AC_HIP_X       = 0.104;

const AC_UPARM_L    = 0.078;
const AC_FOREARM_L  = 0.072;
const AC_THIGH_L    = 0.130;
const AC_SHIN_L     = 0.130;

/** Obrót 3/4 całej bryły — patrz nagłówek. */
const AC_YAW = 1.02;

// ===========================================================================
// GEOMETRIE — SINGLETONY MODUŁU (lazy). Zero alokacji per token.
// ===========================================================================
let gACBarrel: THREE.CylinderGeometry | null = null;
let gACChest: THREE.IcosahedronGeometry | null = null;
let gACRump: THREE.IcosahedronGeometry | null = null;
let gACWithers: THREE.BoxGeometry | null = null;
let gACNeck1: THREE.CylinderGeometry | null = null;
let gACNeck2: THREE.CylinderGeometry | null = null;
let gACNeck3: THREE.CylinderGeometry | null = null;
let gACSkull: THREE.BoxGeometry | null = null;
let gACMuzzle: THREE.CylinderGeometry | null = null;
let gACNostril: THREE.BoxGeometry | null = null;
let gACEar: THREE.ConeGeometry | null = null;
let gACEyeH: THREE.BoxGeometry | null = null;
let gACManeTuft: THREE.BoxGeometry | null = null;
let gACForelock: THREE.BoxGeometry | null = null;
let gACUpFrnt: THREE.BoxGeometry | null = null;
let gACUpRear: THREE.BoxGeometry | null = null;
let gACLower: THREE.BoxGeometry | null = null;
let gACPastern: THREE.BoxGeometry | null = null;
let gACHoof: THREE.BoxGeometry | null = null;
let gACTail1: THREE.CylinderGeometry | null = null;
let gACTail2: THREE.CylinderGeometry | null = null;
let gACPadTop: THREE.BoxGeometry | null = null;
let gACPadFlap: THREE.BoxGeometry | null = null;
let gACPadHem: THREE.BoxGeometry | null = null;
let gACPadRidge: THREE.BoxGeometry | null = null;
let gACFringe: THREE.ConeGeometry | null = null;
let gACGirth: THREE.CylinderGeometry | null = null;
let gACBreast: THREE.BoxGeometry | null = null;
let gACNoseBand: THREE.BoxGeometry | null = null;
let gACBrowBand: THREE.BoxGeometry | null = null;
let gACBit: THREE.BoxGeometry | null = null;
let gACBitRing: THREE.TorusGeometry | null = null;

let gACTorso: THREE.BoxGeometry | null = null;
let gACChestR: THREE.BoxGeometry | null = null;
let gACScaleRow: THREE.BoxGeometry | null = null;
let gACSash: THREE.BoxGeometry | null = null;
let gACNeckR: THREE.BoxGeometry | null = null;
let gACHead: THREE.BoxGeometry | null = null;
let gACJaw: THREE.BoxGeometry | null = null;
let gACBeard: THREE.BoxGeometry | null = null;
let gACHelm: THREE.CylinderGeometry | null = null;
let gACCrest: THREE.BoxGeometry | null = null;
let gACEarR: THREE.BoxGeometry | null = null;
let gACUpArm: THREE.BoxGeometry | null = null;
let gACForearm: THREE.BoxGeometry | null = null;
let gACFist: THREE.BoxGeometry | null = null;
let gACThigh: THREE.BoxGeometry | null = null;
let gACShin: THREE.BoxGeometry | null = null;
let gACSole: THREE.BoxGeometry | null = null;
let gACBootCuff: THREE.BoxGeometry | null = null;

let gACShaft: THREE.CylinderGeometry | null = null;
let gACSocket: THREE.CylinderGeometry | null = null;
let gACBind: THREE.BoxGeometry | null = null;
let gACGrip: THREE.BoxGeometry | null = null;
let gACLanceHd: THREE.BufferGeometry | null = null;
let gACButt: THREE.ConeGeometry | null = null;
let gACShield: THREE.CylinderGeometry | null = null;
let gACBoss: THREE.SphereGeometry | null = null;
let gACRim: THREE.TorusGeometry | null = null;

let gACBowMid: THREE.BoxGeometry | null = null;
let gACBowLimb: THREE.BoxGeometry | null = null;
let gACBowSiyah: THREE.BoxGeometry | null = null;
let gACArrowTip: THREE.ConeGeometry | null = null;
let gACFletch: THREE.BoxGeometry | null = null;
let gACQuiver: THREE.BoxGeometry | null = null;
let gACQArrow: THREE.BoxGeometry | null = null;

let gACUnit: THREE.BoxGeometry | null = null;

function getACBarrel(): THREE.CylinderGeometry { return (gACBarrel ||= new THREE.CylinderGeometry(0.108 * AC_S * HEX_R, 0.100 * AC_S * HEX_R, 0.256 * AC_S * HEX_R, 7, 1)); }
function getACChest(): THREE.IcosahedronGeometry { return (gACChest ||= new THREE.IcosahedronGeometry(0.094 * AC_S * HEX_R, 0)); }
function getACRump(): THREE.IcosahedronGeometry { return (gACRump ||= new THREE.IcosahedronGeometry(0.096 * AC_S * HEX_R, 0)); }
function getACWithers(): THREE.BoxGeometry { return (gACWithers ||= new THREE.BoxGeometry(0.066 * AC_S * HEX_R, 0.056 * AC_S * HEX_R, 0.110 * AC_S * HEX_R)); }
function getACNeck1(): THREE.CylinderGeometry { return (gACNeck1 ||= new THREE.CylinderGeometry(0.052 * AC_S * HEX_R, 0.064 * AC_S * HEX_R, 0.082 * AC_S * HEX_R, 6, 1, true)); }
function getACNeck2(): THREE.CylinderGeometry { return (gACNeck2 ||= new THREE.CylinderGeometry(0.043 * AC_S * HEX_R, 0.052 * AC_S * HEX_R, 0.072 * AC_S * HEX_R, 6, 1, true)); }
function getACNeck3(): THREE.CylinderGeometry { return (gACNeck3 ||= new THREE.CylinderGeometry(0.036 * AC_S * HEX_R, 0.043 * AC_S * HEX_R, 0.058 * AC_S * HEX_R, 6, 1, true)); }
function getACSkull(): THREE.BoxGeometry { return (gACSkull ||= new THREE.BoxGeometry(0.066 * AC_S * HEX_R, 0.080 * AC_S * HEX_R, 0.096 * AC_S * HEX_R)); }
function getACMuzzle(): THREE.CylinderGeometry { return (gACMuzzle ||= new THREE.CylinderGeometry(0.023 * AC_S * HEX_R, 0.032 * AC_S * HEX_R, 0.082 * AC_S * HEX_R, 5, 1)); }
function getACNostril(): THREE.BoxGeometry { return (gACNostril ||= new THREE.BoxGeometry(0.010 * AC_S * HEX_R, 0.011 * AC_S * HEX_R, 0.008 * AC_S * HEX_R)); }
function getACEar(): THREE.ConeGeometry { return (gACEar ||= new THREE.ConeGeometry(0.015 * AC_S * HEX_R, 0.042 * AC_S * HEX_R, 4)); }
function getACEyeH(): THREE.BoxGeometry { return (gACEyeH ||= new THREE.BoxGeometry(0.008 * AC_S * HEX_R, 0.014 * AC_S * HEX_R, 0.014 * AC_S * HEX_R)); }
function getACManeTuft(): THREE.BoxGeometry { return (gACManeTuft ||= new THREE.BoxGeometry(0.018 * AC_S * HEX_R, 0.034 * AC_S * HEX_R, 0.026 * AC_S * HEX_R)); }
function getACForelock(): THREE.BoxGeometry { return (gACForelock ||= new THREE.BoxGeometry(0.020 * AC_S * HEX_R, 0.042 * AC_S * HEX_R, 0.022 * AC_S * HEX_R)); }
function getACUpFrnt(): THREE.BoxGeometry { return (gACUpFrnt ||= new THREE.BoxGeometry(0.044 * AC_S * HEX_R, 0.118 * AC_S * HEX_R, 0.056 * AC_S * HEX_R)); }
function getACUpRear(): THREE.BoxGeometry { return (gACUpRear ||= new THREE.BoxGeometry(0.050 * AC_S * HEX_R, 0.124 * AC_S * HEX_R, 0.064 * AC_S * HEX_R)); }
function getACLower(): THREE.BoxGeometry { return (gACLower ||= new THREE.BoxGeometry(0.028 * AC_S * HEX_R, 0.118 * AC_S * HEX_R, 0.032 * AC_S * HEX_R)); }
function getACPastern(): THREE.BoxGeometry { return (gACPastern ||= new THREE.BoxGeometry(0.028 * AC_S * HEX_R, 0.038 * AC_S * HEX_R, 0.032 * AC_S * HEX_R)); }
function getACHoof(): THREE.BoxGeometry { return (gACHoof ||= new THREE.BoxGeometry(0.034 * AC_S * HEX_R, 0.032 * AC_S * HEX_R, 0.040 * AC_S * HEX_R)); }
function getACTail1(): THREE.CylinderGeometry { return (gACTail1 ||= new THREE.CylinderGeometry(0.016 * AC_S * HEX_R, 0.020 * AC_S * HEX_R, 0.052 * AC_S * HEX_R, 4, 1)); }
function getACTail2(): THREE.CylinderGeometry { return (gACTail2 ||= new THREE.CylinderGeometry(0.008 * AC_S * HEX_R, 0.017 * AC_S * HEX_R, 0.128 * AC_S * HEX_R, 4, 1)); }
function getACPadTop(): THREE.BoxGeometry { return (gACPadTop ||= new THREE.BoxGeometry(0.150 * AC_S * HEX_R, 0.020 * AC_S * HEX_R, 0.238 * AC_S * HEX_R)); }
function getACPadFlap(): THREE.BoxGeometry { return (gACPadFlap ||= new THREE.BoxGeometry(0.015 * AC_S * HEX_R, 0.096 * AC_S * HEX_R, 0.212 * AC_S * HEX_R)); }
function getACPadHem(): THREE.BoxGeometry { return (gACPadHem ||= new THREE.BoxGeometry(0.018 * AC_S * HEX_R, 0.014 * AC_S * HEX_R, 0.216 * AC_S * HEX_R)); }
// grzbiet PRZEDNI/TYLNI derki lekko uwypuklony (Z2 — bogatszy "pad" epoki Żelaza,
// nadal miękki, BEZ drzewa siodła).
function getACPadRidge(): THREE.BoxGeometry { return (gACPadRidge ||= new THREE.BoxGeometry(0.140 * AC_S * HEX_R, 0.030 * AC_S * HEX_R, 0.020 * AC_S * HEX_R)); }
function getACFringe(): THREE.ConeGeometry { return (gACFringe ||= new THREE.ConeGeometry(0.008 * AC_S * HEX_R, 0.040 * AC_S * HEX_R, 4)); }
function getACGirth(): THREE.CylinderGeometry { return (gACGirth ||= new THREE.CylinderGeometry(0.114 * AC_S * HEX_R, 0.114 * AC_S * HEX_R, 0.022 * AC_S * HEX_R, 7, 1, true)); }
function getACBreast(): THREE.BoxGeometry { return (gACBreast ||= new THREE.BoxGeometry(0.136 * AC_S * HEX_R, 0.018 * AC_S * HEX_R, 0.020 * AC_S * HEX_R)); }
function getACNoseBand(): THREE.BoxGeometry { return (gACNoseBand ||= new THREE.BoxGeometry(0.044 * AC_S * HEX_R, 0.012 * AC_S * HEX_R, 0.036 * AC_S * HEX_R)); }
function getACBrowBand(): THREE.BoxGeometry { return (gACBrowBand ||= new THREE.BoxGeometry(0.066 * AC_S * HEX_R, 0.011 * AC_S * HEX_R, 0.018 * AC_S * HEX_R)); }
function getACBit(): THREE.BoxGeometry { return (gACBit ||= new THREE.BoxGeometry(0.052 * AC_S * HEX_R, 0.009 * AC_S * HEX_R, 0.009 * AC_S * HEX_R)); }
function getACBitRing(): THREE.TorusGeometry { return (gACBitRing ||= new THREE.TorusGeometry(0.014 * AC_S * HEX_R, 0.004 * AC_S * HEX_R, 4, 8)); }

function getACTorso(): THREE.BoxGeometry { return (gACTorso ||= new THREE.BoxGeometry(AC_TORSO_W * HEX_R, AC_TORSO_H * HEX_R, AC_TORSO_D * HEX_R)); }
function getACChestR(): THREE.BoxGeometry { return (gACChestR ||= new THREE.BoxGeometry(AC_TORSO_W * 1.05 * HEX_R, 0.064 * HEX_R, AC_TORSO_D * 1.06 * HEX_R)); }
function getACScaleRow(): THREE.BoxGeometry { return (gACScaleRow ||= new THREE.BoxGeometry(AC_TORSO_W * 1.02 * HEX_R, 0.018 * HEX_R, AC_TORSO_D * 1.04 * HEX_R)); }
function getACSash(): THREE.BoxGeometry { return (gACSash ||= new THREE.BoxGeometry(AC_TORSO_W * 1.04 * HEX_R, 0.030 * HEX_R, AC_TORSO_D * 1.06 * HEX_R)); }
function getACNeckR(): THREE.BoxGeometry { return (gACNeckR ||= new THREE.BoxGeometry(0.040 * HEX_R, AC_NECK_H * 1.6 * HEX_R, 0.040 * HEX_R)); }
function getACHead(): THREE.BoxGeometry { return (gACHead ||= new THREE.BoxGeometry(AC_HEAD_S * HEX_R, AC_HEAD_S * HEX_R, AC_HEAD_S * HEX_R)); }
function getACJaw(): THREE.BoxGeometry { return (gACJaw ||= new THREE.BoxGeometry(0.068 * HEX_R, 0.027 * HEX_R, 0.031 * HEX_R)); }
function getACBeard(): THREE.BoxGeometry { return (gACBeard ||= new THREE.BoxGeometry(0.064 * HEX_R, 0.085 * HEX_R, 0.024 * HEX_R)); }
function getACHelm(): THREE.CylinderGeometry { return (gACHelm ||= new THREE.CylinderGeometry(0.013 * HEX_R, 0.082 * HEX_R, 0.135 * HEX_R, 8, 1)); }
function getACCrest(): THREE.BoxGeometry { return (gACCrest ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.052 * HEX_R, 0.098 * HEX_R)); }
function getACEarR(): THREE.BoxGeometry { return (gACEarR ||= new THREE.BoxGeometry(0.009 * HEX_R, 0.026 * HEX_R, 0.017 * HEX_R)); }
function getACUpArm(): THREE.BoxGeometry { return (gACUpArm ||= new THREE.BoxGeometry(0.042 * HEX_R, AC_UPARM_L * HEX_R, 0.042 * HEX_R)); }
function getACForearm(): THREE.BoxGeometry { return (gACForearm ||= new THREE.BoxGeometry(0.032 * HEX_R, AC_FOREARM_L * HEX_R, 0.032 * HEX_R)); }
function getACFist(): THREE.BoxGeometry { return (gACFist ||= new THREE.BoxGeometry(0.037 * HEX_R, 0.037 * HEX_R, 0.039 * HEX_R)); }
function getACThigh(): THREE.BoxGeometry { return (gACThigh ||= new THREE.BoxGeometry(0.044 * HEX_R, AC_THIGH_L * HEX_R, 0.050 * HEX_R)); }
function getACShin(): THREE.BoxGeometry { return (gACShin ||= new THREE.BoxGeometry(0.031 * HEX_R, AC_SHIN_L * HEX_R, 0.035 * HEX_R)); }
function getACSole(): THREE.BoxGeometry { return (gACSole ||= new THREE.BoxGeometry(0.036 * HEX_R, 0.012 * HEX_R, 0.066 * HEX_R)); }
function getACBootCuff(): THREE.BoxGeometry { return (gACBootCuff ||= new THREE.BoxGeometry(0.048 * HEX_R, 0.040 * HEX_R, 0.052 * HEX_R)); }

function getACShaft(): THREE.CylinderGeometry { return (gACShaft ||= new THREE.CylinderGeometry(0.011 * HEX_R, 0.013 * HEX_R, 0.620 * HEX_R, 7, 1)); }
function getACSocket(): THREE.CylinderGeometry { return (gACSocket ||= new THREE.CylinderGeometry(0.015 * HEX_R, 0.018 * HEX_R, 0.036 * HEX_R, 7, 1)); }
function getACBind(): THREE.BoxGeometry { return (gACBind ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.015 * HEX_R, 0.018 * HEX_R)); }
function getACGrip(): THREE.BoxGeometry { return (gACGrip ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.048 * HEX_R, 0.016 * HEX_R)); }
function getACButt(): THREE.ConeGeometry { return (gACButt ||= new THREE.ConeGeometry(0.013 * HEX_R, 0.040 * HEX_R, 5)); }
function getACShield(): THREE.CylinderGeometry { return (gACShield ||= new THREE.CylinderGeometry(0.100 * HEX_R, 0.100 * HEX_R, 0.014 * HEX_R, 12, 1)); }
function getACBoss(): THREE.SphereGeometry { return (gACBoss ||= new THREE.SphereGeometry(0.020 * HEX_R, 8, 6)); }
function getACRim(): THREE.TorusGeometry { return (gACRim ||= new THREE.TorusGeometry(0.100 * HEX_R, 0.007 * HEX_R, 4, 14)); }

function getACBowMid(): THREE.BoxGeometry { return (gACBowMid ||= new THREE.BoxGeometry(0.021 * HEX_R, 0.150 * HEX_R, 0.024 * HEX_R)); }
function getACBowLimb(): THREE.BoxGeometry { return (gACBowLimb ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.125 * HEX_R, 0.021 * HEX_R)); }
function getACBowSiyah(): THREE.BoxGeometry { return (gACBowSiyah ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.072 * HEX_R, 0.018 * HEX_R)); }
function getACArrowTip(): THREE.ConeGeometry { return (gACArrowTip ||= new THREE.ConeGeometry(0.013 * HEX_R, 0.042 * HEX_R, 4)); }
function getACFletch(): THREE.BoxGeometry { return (gACFletch ||= new THREE.BoxGeometry(0.007 * HEX_R, 0.052 * HEX_R, 0.024 * HEX_R)); }
function getACQuiver(): THREE.BoxGeometry { return (gACQuiver ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.150 * HEX_R, 0.046 * HEX_R)); }
function getACQArrow(): THREE.BoxGeometry { return (gACQArrow ||= new THREE.BoxGeometry(0.009 * HEX_R, 0.085 * HEX_R, 0.009 * HEX_R)); }

function getACUnit(): THREE.BoxGeometry { return (gACUnit ||= new THREE.BoxGeometry(1, 1, 1)); }

// ---------------------------------------------------------------------------
// Grot LANCY — liściasty, ten sam PROFIL co grot Włócznika/Konnicy brązowej,
// ale w tym pliku materiał = ŻELAZO (Z4a). Zakotwiczony w y=0 (podstawa),
// rośnie ku +Y.
// ---------------------------------------------------------------------------
function acMakeLeafHeadGeo(len: number, wMax: number, tMax: number): THREE.BufferGeometry {
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
function getACLanceHd(): THREE.BufferGeometry {
  return (gACLanceHd ||= acMakeLeafHeadGeo(0.100 * HEX_R, 0.038 * HEX_R, 0.015 * HEX_R));
}

// ===========================================================================
// KINEMATYKA — konwencja rodziny konnej: PRZÓD = +Z, theta liczone od pionu.
// ===========================================================================
const AC_UP = new THREE.Vector3(0, 1, 0);

function acDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}
function acUpDir(phi: number): THREE.Vector3 {
  return new THREE.Vector3(0, Math.cos(phi), Math.sin(phi));
}

function acSegDown(
  parent: THREE.Object3D, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = acDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  parent.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

function acSegUp(
  parent: THREE.Object3D, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, phi: number, len: number, spin = 0,
): THREE.Vector3 {
  const dir = acUpDir(phi);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = phi;
  if (spin !== 0) mesh.rotation.y = spin;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  parent.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

function acAlong(
  parent: THREE.Object3D, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, D: THREE.Vector3, name?: string,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mtl);
  if (D.y < -0.9999) mesh.rotation.x = Math.PI;
  else mesh.quaternion.setFromUnitVectors(AC_UP, D.clone().normalize());
  mesh.position.copy(P);
  if (name !== undefined) mesh.name = name;
  parent.add(mesh);
  return mesh;
}

function acStrap(
  parent: THREE.Object3D, mtl: THREE.MeshStandardMaterial,
  A: THREE.Vector3, B: THREE.Vector3, w: number, t: number,
): THREE.Mesh {
  const d = B.clone().sub(A);
  const len = d.length();
  const mesh = new THREE.Mesh(getACUnit(), mtl);
  mesh.scale.set(w, Math.max(len, 1e-5), t);
  if (len > 1e-6) {
    if (d.y / len < -0.9999) mesh.rotation.x = Math.PI;
    else mesh.quaternion.setFromUnitVectors(AC_UP, d.clone().normalize());
  }
  mesh.position.copy(A).addScaledVector(d, 0.5);
  parent.add(mesh);
  return mesh;
}

const AC_LEG_UP_F = 0.118;
const AC_LEG_LO_F = 0.118;
const AC_LEG_UP_R = 0.124;
const AC_LEG_LO_R = 0.118;
const AC_LEG_JOINT_OVERLAP = 0.008;
const AC_HOOF_H = 0.032;

function acHorseLeg(
  parent: THREE.Object3D, mCoat: THREE.MeshStandardMaterial,
  mDark: THREE.MeshStandardMaterial, mHoof: THREE.MeshStandardMaterial,
  sx: number, zPiv: number, yPiv: number, thU: number, thL: number, rear: boolean,
): void {
  const Lu = (rear ? AC_LEG_UP_R : AC_LEG_UP_F) * AC_S * HEX_R;
  const Ll = (rear ? AC_LEG_LO_R : AC_LEG_LO_F) * AC_S * HEX_R;
  let P = new THREE.Vector3(sx * AC_S * HEX_R, yPiv * AC_S * HEX_R, zPiv * AC_S * HEX_R);
  P = acSegDown(parent, rear ? getACUpRear() : getACUpFrnt(), mCoat, P, thU, Lu);
  P.y += AC_LEG_JOINT_OVERLAP * AC_S * HEX_R;
  P = acSegDown(parent, getACLower(), mCoat, P, thL, Ll);
  const past = new THREE.Mesh(getACPastern(), mDark);
  past.position.copy(P.clone().addScaledVector(acDown(thL), 0.004 * AC_S * HEX_R));
  parent.add(past);
  const hoof = new THREE.Mesh(getACHoof(), mHoof);
  hoof.position.set(P.x, P.y - AC_HOOF_H * 0.5 * AC_S * HEX_R, P.z + 0.004 * AC_S * HEX_R);
  parent.add(hoof);
}

interface ACMats {
  mCoat: THREE.MeshStandardMaterial; mCoatDk: THREE.MeshStandardMaterial;
  mMane: THREE.MeshStandardMaterial; mHoof: THREE.MeshStandardMaterial;
  mSkin: THREE.MeshStandardMaterial; mSkinDk: THREE.MeshStandardMaterial;
  mScale: THREE.MeshStandardMaterial; mScaleDk: THREE.MeshStandardMaterial;
  mLeather: THREE.MeshStandardMaterial; mLeathDk: THREE.MeshStandardMaterial;
  mBronze: THREE.MeshStandardMaterial; mBronzeLt: THREE.MeshStandardMaterial;
  mIron: THREE.MeshStandardMaterial; mIronLt: THREE.MeshStandardMaterial;
  mHair: THREE.MeshStandardMaterial; mEye: THREE.MeshStandardMaterial;
  mOwner: THREE.MeshStandardMaterial; mBoot: THREE.MeshStandardMaterial;
  mWood: THREE.MeshStandardMaterial; mWoodBow: THREE.MeshStandardMaterial;
  mString: THREE.MeshStandardMaterial;
}

function acMakeMaterials(mat: MatFactory, ownerColor_: number): ACMats {
  return {
    mCoat:     mat(AC_COAT,       0.04, 0.86),
    mCoatDk:   mat(AC_COAT_DK,    0.04, 0.88),
    mMane:     mat(AC_MANE,       0.04, 0.90),
    mHoof:     mat(AC_HOOF,       0.08, 0.72),
    mSkin:     mat(AC_SKIN,       0.05, 0.80),
    mSkinDk:   mat(AC_SKIN_DK,    0.05, 0.82),
    mScale:    mat(AC_SCALE,      0.32, 0.50),
    mScaleDk:  mat(AC_SCALE_DK,   0.30, 0.56),
    mLeather:  mat(AC_LEATHER,    0.05, 0.85),
    mLeathDk:  mat(AC_LEATHER_DK, 0.05, 0.88),
    mBronze:   mat(AC_BRONZE,     0.50, 0.42),
    mBronzeLt: mat(AC_BRONZE_LT,  0.55, 0.36),
    mIron:     mat(AC_IRON,       0.55, 0.40),
    mIronLt:   mat(AC_IRON_LT,    0.58, 0.34),
    mHair:     mat(AC_HAIR,       0.04, 0.90),
    mEye:      mat(AC_EYE,        0.05, 0.86),
    mOwner:    mat(ownerColor_,   0.10, 0.70),
    mBoot:     mat(AC_BOOT,       0.05, 0.88),
    mWood:     mat(AC_WOOD,       0.05, 0.84),
    mWoodBow:  mat(AC_WOOD_BOW,   0.05, 0.82),
    mString:   mat(AC_STRING,     0.02, 0.95),
  };
}

/**
 * KOŃ — wspólny dla obu jednostek (Z6: +6% wobec braz-konnica-opus5.ts),
 * jednolita maść bez znamion pierwotnych, bogatsza derka z fredzlami (Z2).
 * Zwraca punkty zaczepienia potrzebne do osadzenia jeźdźca i uzdy.
 */
function acBuildMount(root: THREE.Object3D, m: ACMats): {
  headP: THREE.Vector3; muzEnd: THREE.Vector3; bitY: number; bitZ: number;
} {
  const S = AC_S;
  const barrel = new THREE.Mesh(getACBarrel(), m.mCoat);
  barrel.rotation.x = Math.PI / 2;
  barrel.rotation.y = Math.PI / 7;
  barrel.scale.set(0.72, 1, 1.0);
  barrel.position.set(0, AC_BODY_CTR * S * HEX_R, 0.004 * S * HEX_R);
  root.add(barrel);

  const chest = new THREE.Mesh(getACChest(), m.mCoat);
  chest.scale.set(0.80, 1.00, 0.95);
  chest.position.set(0, (AC_BODY_CTR + 0.006) * S * HEX_R, 0.140 * S * HEX_R);
  root.add(chest);

  const rump = new THREE.Mesh(getACRump(), m.mCoat);
  rump.scale.set(0.88, 1.00, 1.10);
  rump.position.set(0, (AC_BODY_CTR - 0.002) * S * HEX_R, -0.144 * S * HEX_R);
  root.add(rump);

  const withers = new THREE.Mesh(getACWithers(), m.mCoat);
  withers.rotation.x = 0.20;
  withers.position.set(0, 0.408 * S * HEX_R, 0.104 * S * HEX_R);
  root.add(withers);

  // ── SZYJA: 3 segmenty ────────────────────────────────────────────────────
  const neckPhi = [0.92, 0.66, 0.42];
  const neckLen = [0.082 * S * HEX_R, 0.072 * S * HEX_R, 0.058 * S * HEX_R];
  const neckGeo = [getACNeck1(), getACNeck2(), getACNeck3()];
  let NP = new THREE.Vector3(0, 0.386 * S * HEX_R, 0.136 * S * HEX_R);
  const neckPts: THREE.Vector3[] = [NP.clone()];
  for (let i = 0; i < 3; i++) {
    NP = acSegUp(root, neckGeo[i]!, m.mCoat, NP, neckPhi[i]!, neckLen[i]!, Math.PI / 6);
    neckPts.push(NP.clone());
  }

  // ── ŁEB ──────────────────────────────────────────────────────────────────
  const headP = new THREE.Vector3(0, NP.y + 0.013 * S * HEX_R, NP.z + 0.021 * S * HEX_R);
  const skull = new THREE.Mesh(getACSkull(), m.mCoat);
  skull.rotation.x = 0.22;
  skull.position.copy(headP);
  root.add(skull);

  const muzDir = new THREE.Vector3(0, -0.31, 0.951);
  const muzBase = headP.clone().add(new THREE.Vector3(0, -0.018 * S * HEX_R, 0.030 * S * HEX_R));
  const muzzle = acAlong(root, getACMuzzle(), m.mCoat, muzBase.clone().addScaledVector(muzDir, 0.041 * S * HEX_R), muzDir);
  muzzle.rotation.y = Math.PI / 4;
  const muzEnd = muzBase.clone().addScaledVector(muzDir, 0.082 * S * HEX_R);
  for (const s of [-1, 1] as const) {
    const nos = new THREE.Mesh(getACNostril(), m.mCoatDk);
    nos.position.set(s * 0.013 * S * HEX_R, muzEnd.y + 0.009 * S * HEX_R, muzEnd.z - 0.008 * S * HEX_R);
    root.add(nos);
    const eye = new THREE.Mesh(getACEyeH(), m.mEye);
    eye.position.set(s * 0.034 * S * HEX_R, headP.y + 0.018 * S * HEX_R, headP.z + 0.014 * S * HEX_R);
    root.add(eye);
    const ear = new THREE.Mesh(getACEar(), m.mCoat);
    ear.position.set(s * 0.021 * S * HEX_R, headP.y + 0.054 * S * HEX_R, headP.z - 0.012 * S * HEX_R);
    ear.rotation.z = -s * 0.28;
    ear.rotation.x = 0.16;
    root.add(ear);
  }

  // ── GRZYWA STOJĄCA + grzywka ─────────────────────────────────────────────
  const maneRad = [0.056 * S * HEX_R, 0.047 * S * HEX_R, 0.040 * S * HEX_R];
  for (let i = 0; i < 3; i++) {
    const phi = neckPhi[i]!;
    const crest = new THREE.Vector3(0, Math.sin(phi), -Math.cos(phi));
    const mid = neckPts[i]!.clone().add(neckPts[i + 1]!).multiplyScalar(0.5);
    for (const f of [-0.28, 0.28] as const) {
      const along = acUpDir(phi).multiplyScalar(neckLen[i]! * f);
      const tuft = new THREE.Mesh(getACManeTuft(), m.mMane);
      tuft.rotation.x = phi;
      tuft.position.copy(mid.clone().add(along).addScaledVector(crest, maneRad[i]!));
      root.add(tuft);
    }
  }
  const forelock = new THREE.Mesh(getACForelock(), m.mMane);
  forelock.rotation.x = 0.62;
  forelock.position.set(0, headP.y + 0.040 * S * HEX_R, headP.z + 0.028 * S * HEX_R);
  root.add(forelock);

  // ── NOGI: 3 podporowe + 1 uniesiona w kroku ─────────────────────────────
  const LX = 0.058;
  acHorseLeg(root, m.mCoat, m.mCoatDk, m.mHoof, LX, 0.122, AC_LEG_TOP_F, 0.08, -0.05, false);
  acHorseLeg(root, m.mCoat, m.mCoatDk, m.mHoof, -LX, 0.126, AC_LEG_TOP_F, 0.42, 0.30, false);
  acHorseLeg(root, m.mCoat, m.mCoatDk, m.mHoof, -LX, -0.130, AC_LEG_TOP_R, -0.26, 0.14, true);
  acHorseLeg(root, m.mCoat, m.mCoatDk, m.mHoof, LX, -0.134, AC_LEG_TOP_R, -0.28, 0.16, true);

  // ── OGON ─────────────────────────────────────────────────────────────────
  let TP = new THREE.Vector3(0, 0.392 * S * HEX_R, -0.196 * S * HEX_R);
  TP = acSegUp(root, getACTail1(), m.mMane, TP, -1.20, 0.052 * S * HEX_R);
  acSegUp(root, getACTail2(), m.mMane, TP, -2.98, 0.124 * S * HEX_R);

  // ── DERKA (owner color) + fredzle (Z2) + poprąg/napierśnik/pośliśnik ─────
  const padTop = new THREE.Mesh(getACPadTop(), m.mOwner);
  padTop.position.set(0, 0.436 * S * HEX_R, (AC_SEAT_Z - 0.018) * S * HEX_R);
  root.add(padTop);
  const ridgeF = new THREE.Mesh(getACPadRidge(), m.mLeathDk);
  ridgeF.position.set(0, 0.450 * S * HEX_R, 0.096 * S * HEX_R);
  root.add(ridgeF);
  const ridgeR = new THREE.Mesh(getACPadRidge(), m.mLeathDk);
  ridgeR.position.set(0, 0.450 * S * HEX_R, -0.100 * S * HEX_R);
  root.add(ridgeR);
  for (const s of [-1, 1] as const) {
    const flap = new THREE.Mesh(getACPadFlap(), m.mOwner);
    flap.rotation.z = -s * 0.10;
    flap.position.set(s * 0.081 * S * HEX_R, 0.378 * S * HEX_R, (AC_SEAT_Z - 0.012) * S * HEX_R);
    root.add(flap);
    const padHem = new THREE.Mesh(getACPadHem(), m.mLeathDk);
    padHem.position.set(s * 0.086 * S * HEX_R, 0.328 * S * HEX_R, (AC_SEAT_Z - 0.012) * S * HEX_R);
    root.add(padHem);
  }
  const girth = new THREE.Mesh(getACGirth(), m.mLeather);
  girth.rotation.x = Math.PI / 2;
  girth.rotation.y = Math.PI / 7;
  girth.scale.set(0.72, 1, 1);
  girth.position.set(0, AC_BODY_CTR * S * HEX_R, (AC_SEAT_Z + 0.006) * S * HEX_R);
  root.add(girth);
  const breast = new THREE.Mesh(getACBreast(), m.mLeather);
  breast.position.set(0, 0.358 * S * HEX_R, 0.208 * S * HEX_R);
  root.add(breast);
  for (const s of [-1, -0.35, 0.35, 1] as const) {
    const fr = new THREE.Mesh(getACFringe(), m.mLeathDk);
    fr.rotation.x = Math.PI;
    fr.position.set(s * 0.062 * S * HEX_R, 0.340 * S * HEX_R, 0.210 * S * HEX_R);
    root.add(fr);
  }
  for (const s of [-1, 1] as const) {
    acStrap(
      root, m.mLeather,
      new THREE.Vector3(s * 0.050 * S * HEX_R, 0.432 * S * HEX_R, -0.092 * S * HEX_R),
      new THREE.Vector3(s * 0.020 * S * HEX_R, 0.394 * S * HEX_R, -0.190 * S * HEX_R),
      0.011 * S * HEX_R, 0.011 * S * HEX_R,
    );
  }

  // ── UZDA + BRĄZOWE WĘDZIDŁO (Z3 — bronz świadomie, nie żelazo) ──────────
  const noseBand = new THREE.Mesh(getACNoseBand(), m.mLeather);
  noseBand.rotation.x = -0.31;
  noseBand.position.set(0, muzEnd.y + 0.022 * S * HEX_R, muzEnd.z - 0.030 * S * HEX_R);
  root.add(noseBand);
  const browBand = new THREE.Mesh(getACBrowBand(), m.mLeather);
  browBand.position.set(0, headP.y + 0.032 * S * HEX_R, headP.z + 0.028 * S * HEX_R);
  root.add(browBand);
  const bitY = muzEnd.y + 0.011 * S * HEX_R;
  const bitZ = muzEnd.z - 0.030 * S * HEX_R;
  const bit = new THREE.Mesh(getACBit(), m.mBronze);
  bit.position.set(0, bitY, bitZ);
  root.add(bit);
  for (const s of [-1, 1] as const) {
    const ring = new THREE.Mesh(getACBitRing(), m.mBronzeLt);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(s * 0.026 * S * HEX_R, bitY, bitZ);
    root.add(ring);
    acStrap(
      root, m.mLeather,
      new THREE.Vector3(s * 0.026 * S * HEX_R, bitY, bitZ),
      new THREE.Vector3(s * 0.030 * S * HEX_R, headP.y + 0.034 * S * HEX_R, headP.z - 0.004 * S * HEX_R),
      0.010 * S * HEX_R, 0.010 * S * HEX_R,
    );
  }

  return { headP, muzEnd, bitY, bitZ };
}

interface ACRiderAnchors {
  wristL: THREE.Vector3; wristR: THREE.Vector3;
  shldL: THREE.Vector3; shldR: THREE.Vector3;
  torsoCtr: THREE.Vector3;
}

/**
 * KORPUS JEŹDŹCA — wspólny dla obu jednostek (Z7): zbroja łuskowa żelazna,
 * wysoki stożkowy hełm z grzebieniem, długa broda, wysokie buty, nogi BEZ
 * strzemion. NIE dodaje ramion/broni — to robi wywołujący (Z4 różni je).
 */
function acBuildRiderCore(root: THREE.Object3D, m: ACMats): ACRiderAnchors {
  const SZ = AC_SEAT_Z * AC_S;
  const backY = AC_BACK_Y * AC_S;

  const torso = new THREE.Mesh(getACTorso(), m.mScale);
  torso.rotation.x = -0.06;
  torso.position.set(0, (backY + AC_TORSO_H * 0.5) * HEX_R, SZ * HEX_R);
  root.add(torso);
  const chestR = new THREE.Mesh(getACChestR(), m.mScale);
  chestR.position.set(0, (AC_TORSO_TOP - 0.028) * HEX_R, SZ * HEX_R);
  root.add(chestR);
  // rzędy lamelek (ciemniejsze przekładki — jak buildAssyrianArcher)
  for (let i = 0; i < 3; i++) {
    const row = new THREE.Mesh(getACScaleRow(), m.mScaleDk);
    row.position.set(0, (AC_TORSO_TOP - 0.040 - i * 0.042) * HEX_R, SZ * HEX_R);
    root.add(row);
  }
  // SZARFA/PAS koloru gracza (slot 2, wzorem buildAssyrianArcher)
  const sash = new THREE.Mesh(getACSash(), m.mOwner);
  sash.position.set(0, (backY + 0.056) * HEX_R, SZ * HEX_R);
  root.add(sash);

  // ── głowa: hełm, grzebień, broda (kanon Asyrii — Z7) ────────────────────
  const neckR = new THREE.Mesh(getACNeckR(), m.mSkin);
  neckR.position.set(0, (AC_TORSO_TOP + AC_NECK_H * 0.5) * HEX_R, SZ * HEX_R);
  root.add(neckR);
  const head = new THREE.Mesh(getACHead(), m.mSkin);
  head.position.set(0, AC_HEAD_CTR * HEX_R, SZ * HEX_R);
  root.add(head);
  const jaw = new THREE.Mesh(getACJaw(), m.mSkinDk);
  jaw.position.set(0, (AC_HEAD_CTR - AC_HEAD_S * 0.38) * HEX_R, (SZ + 0.010) * HEX_R);
  root.add(jaw);
  const beard = new THREE.Mesh(getACBeard(), m.mHair);
  beard.position.set(0, (AC_HEAD_CTR - 0.072) * HEX_R, (SZ + AC_HEAD_S * 0.5 - 0.006) * HEX_R);
  root.add(beard);
  for (const s of [-1, 1] as const) {
    const ear = new THREE.Mesh(getACEarR(), m.mSkinDk);
    ear.position.set(s * (AC_HEAD_S * 0.5 + 0.004) * HEX_R, (AC_HEAD_CTR - 0.006) * HEX_R, SZ * HEX_R);
    root.add(ear);
  }
  const helm = new THREE.Mesh(getACHelm(), m.mIron);
  helm.scale.set(1.05, 1.15, 1.05);
  helm.position.set(0, (AC_HEAD_CTR + 0.050) * HEX_R, SZ * HEX_R);
  root.add(helm);
  const crest = new THREE.Mesh(getACCrest(), m.mIronLt);
  crest.rotation.x = -0.10;
  crest.position.set(0, (AC_HEAD_TOP + 0.050) * HEX_R, (SZ - 0.006) * HEX_R);
  root.add(crest);

  // ── NOGI JEŹDŹCA: zwisają swobodnie (Z1 — brak strzemion), wysokie buty ─
  for (const s of [-1, 1] as const) {
    let P = new THREE.Vector3(s * AC_HIP_X * HEX_R, backY * HEX_R, SZ * HEX_R);
    P = acSegDown(root, getACThigh(), m.mSkin, P, 0.45, AC_THIGH_L * HEX_R);
    P.x += s * 0.006 * HEX_R;
    P.y += 0.008 * HEX_R;
    P = acSegDown(root, getACShin(), m.mBoot, P, 0.05, AC_SHIN_L * HEX_R);
    const cuff = new THREE.Mesh(getACBootCuff(), m.mBoot);
    cuff.position.set(P.x, P.y + 0.018 * HEX_R, P.z + 0.008 * HEX_R);
    root.add(cuff);
    const sole = new THREE.Mesh(getACSole(), m.mBoot);
    sole.position.set(P.x, P.y - 0.006 * HEX_R, P.z + 0.014 * HEX_R);
    root.add(sole);
  }

  const shldL = new THREE.Vector3(AC_SHLD_X * HEX_R, AC_SHLD_Y * HEX_R, SZ * HEX_R);
  const shldR = new THREE.Vector3(-AC_SHLD_X * HEX_R, AC_SHLD_Y * HEX_R, SZ * HEX_R);
  return {
    wristL: shldL.clone(), wristR: shldR.clone(), shldL, shldR,
    torsoCtr: new THREE.Vector3(0, (backY + AC_TORSO_H * 0.5) * HEX_R, SZ * HEX_R),
  };
}

// ===========================================================================
// KONNICA LANCOWA ASYRYJSKA — OPUS 5 (Żelazo)
// units.json: Atak dystansowy=0, „długa lanca i okrągła tarcza" (Z4a).
// ===========================================================================
export function buildZelazoKonnicaLancowaAsyryjska(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();
  const root = new THREE.Group();
  root.rotation.y = AC_YAW;
  group.add(root);

  const m = acMakeMaterials(mat, ownerColor_);
  acBuildMount(root, m);
  const anc = acBuildRiderCore(root, m);

  // ── LEWE (+X) RAMIĘ: wodze + TARCZA OKRĄGŁA na przedramieniu (Z4a, Z9a) ─
  let LA = anc.shldL.clone();
  LA = acSegDown(root, getACUpArm(), m.mSkin, LA, 0.50, AC_UPARM_L * HEX_R);
  LA.y += 0.007 * HEX_R;
  const wristL = acSegDown(root, getACForearm(), m.mSkin, LA, 1.05, AC_FOREARM_L * HEX_R);
  const fistL = new THREE.Mesh(getACFist(), m.mSkin);
  fistL.rotation.x = Math.PI - 1.05;
  fistL.position.copy(wristL.clone().addScaledVector(acDown(1.05), 0.010 * HEX_R));
  root.add(fistL);
  // Tarcza: drewno/skóra + obręcz żelazna + umbo brązowe, na zewnętrznej
  // stronie przedramienia (widoczna sylwetka z boku kamery).
  const shield = new THREE.Mesh(getACShield(), mat(AC_SHIELD_FACE, 0.05, 0.85));
  shield.name = 'ac-lancowa-shield';
  shield.rotation.z = Math.PI / 2;
  shield.rotation.y = 0.30;
  shield.position.copy(wristL.clone().add(new THREE.Vector3(0.028 * HEX_R, 0.006 * HEX_R, -0.010 * HEX_R)));
  root.add(shield);
  const rim = new THREE.Mesh(getACRim(), mat(AC_SHIELD_RIM, 0.5, 0.4));
  rim.rotation.y = 0.30;
  rim.position.copy(shield.position);
  root.add(rim);
  const boss = new THREE.Mesh(getACBoss(), m.mBronze);
  boss.position.copy(shield.position.clone().add(new THREE.Vector3(0.008 * HEX_R, 0, 0)));
  root.add(boss);

  // ── PRAWE (-X) RAMIĘ: DŁUGA LANCA „na gotowość" (Z4a) ───────────────────
  let RA = anc.shldR.clone();
  RA = acSegDown(root, getACUpArm(), m.mSkin, RA, 0.20, AC_UPARM_L * HEX_R);
  RA.y += 0.007 * HEX_R;
  const wristR = acSegDown(root, getACForearm(), m.mSkin, RA, 0.62, AC_FOREARM_L * HEX_R);
  const fistR = new THREE.Mesh(getACFist(), m.mSkin);
  fistR.rotation.x = Math.PI - 0.62;
  fistR.position.copy(wristR.clone().addScaledVector(acDown(0.62), 0.010 * HEX_R));
  root.add(fistR);

  const LANCE_TILT = 0.20;
  const dLance = acUpDir(LANCE_TILT);
  const grip = new THREE.Vector3(
    wristR.x - 0.020 * HEX_R, wristR.y + 0.002 * HEX_R, wristR.z + 0.010 * HEX_R,
  );
  const atS = (t: number): THREE.Vector3 => grip.clone().addScaledVector(dLance, t * HEX_R);
  acAlong(root, getACShaft(), m.mWood, atS(0), dLance, 'ac-lancowa-lance-shaft');
  acAlong(root, getACGrip(), m.mLeathDk, atS(0), dLance);
  acAlong(root, getACSocket(), m.mIron, atS(0.294), dLance);
  acAlong(root, getACBind(), m.mLeathDk, atS(0.276), dLance);
  acAlong(root, getACBind(), m.mLeathDk, atS(0.312), dLance);
  acAlong(root, getACLanceHd(), m.mIronLt, atS(0.304), dLance, 'ac-lancowa-lance-head');
  const buttMesh = acAlong(root, getACButt(), m.mIron, atS(-0.298), dLance);
  buttMesh.rotateX(Math.PI);

  // wodze: od wędzidła do lewego nadgarstka (osadzone po zbudowaniu konia —
  // bitY/bitZ znane z acBuildMount, ale nie propagowane poza funkcję celowo:
  // przybliżenie do pozycji pyska konia na osi Z jest wystarczające dla
  // czytelnego paska w tej skali).
  acStrap(root, m.mLeathDk,
    new THREE.Vector3(0.026 * AC_S * HEX_R, (0.386 + 0.10) * AC_S * HEX_R, 0.30 * AC_S * HEX_R),
    new THREE.Vector3(wristL.x - 0.006 * HEX_R, wristL.y + 0.006 * HEX_R, wristL.z),
    0.007 * HEX_R, 0.007 * HEX_R);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ===========================================================================
// KONNICA ŁUCZNICZA ASYRYJSKA — OPUS 5 (Żelazo)
// units.json: Atak dystansowy=6, Zasięg ataku=2 — MUSI dzierżyć łuk (Z4b).
// ===========================================================================
export function buildZelazoKonnicaLuczniczaAsyryjska(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();
  const root = new THREE.Group();
  root.rotation.y = AC_YAW;
  group.add(root);

  const m = acMakeMaterials(mat, ownerColor_);
  acBuildMount(root, m);
  const anc = acBuildRiderCore(root, m);

  // ── ŁUK KOMPOZYTOWY W PEŁNYM NACIĄGU (Z4b) — adaptacja pdAddDrawnBow
  //    (jednostki-p3-dystans.ts) na jeźdźca: GRIP w lewej dłoni wyciągniętej
  //    do przodu-w-bok, NOCK w prawej dłoni cofniętej do policzka. Obie
  //    dłonie zajęte łukiem — wodze LUŹNO zapętlone na lewym przedramieniu
  //    (Z4b: udokumentowana technika samodzielnego jeźdźca-łucznika).
  const GRIP = anc.shldL.clone().add(new THREE.Vector3(0.058 * HEX_R, -0.010 * HEX_R, 0.150 * HEX_R));
  const NOCK = anc.shldR.clone().add(new THREE.Vector3(-0.010 * HEX_R, 0.020 * HEX_R, -0.030 * HEX_R));

  let LA = anc.shldL.clone();
  const dirLU = GRIP.clone().sub(LA).normalize();
  LA = acAlongLen(root, getACUpArm(), m.mSkin, LA, dirLU, AC_UPARM_L * HEX_R);
  const wristL = acAlongLen(root, getACForearm(), m.mSkin, LA, dirLU, AC_FOREARM_L * HEX_R);
  const fistL = new THREE.Mesh(getACFist(), m.mSkin);
  fistL.quaternion.setFromUnitVectors(AC_UP, dirLU);
  fistL.position.copy(wristL);
  root.add(fistL);

  let RA = anc.shldR.clone();
  const dirRU = NOCK.clone().sub(RA).normalize();
  RA = acAlongLen(root, getACUpArm(), m.mSkin, RA, dirRU, AC_UPARM_L * HEX_R);
  const wristR = acAlongLen(root, getACForearm(), m.mSkin, RA, dirRU, AC_FOREARM_L * HEX_R);
  const fistR = new THREE.Mesh(getACFist(), m.mSkin);
  fistR.quaternion.setFromUnitVectors(AC_UP, dirRU);
  fistR.position.copy(wristR);
  root.add(fistR);

  const G = wristL.clone(), N = wristR.clone();
  const dirA = G.clone().sub(N).normalize();
  const yaw = Math.atan2(dirA.x, dirA.z);
  const bow = new THREE.Group();
  bow.name = 'ac-lucznicza-bow';
  bow.position.copy(G);
  bow.rotation.y = yaw;
  const mid = new THREE.Mesh(getACBowMid(), m.mWoodBow);
  mid.name = 'ac-lucznicza-bow';
  bow.add(mid);
  for (const sg of [1, -1] as const) {
    const limb = new THREE.Mesh(getACBowLimb(), m.mWoodBow);
    limb.rotation.x = -sg * 0.52;
    limb.position.set(0, sg * 0.128 * HEX_R, -0.016 * HEX_R);
    bow.add(limb);
    const siyah = new THREE.Mesh(getACBowSiyah(), m.mBronzeLt);
    siyah.rotation.x = -sg * 1.12;
    siyah.position.set(0, sg * 0.236 * HEX_R, -0.084 * HEX_R);
    bow.add(siyah);
  }
  root.add(bow);
  const rotY = new THREE.Matrix4().makeRotationY(yaw);
  const tipTop = new THREE.Vector3(0, 0.270 * HEX_R, -0.100 * HEX_R).applyMatrix4(rotY).add(G);
  const tipBot = new THREE.Vector3(0, -0.270 * HEX_R, -0.100 * HEX_R).applyMatrix4(rotY).add(G);
  acStrap(root, m.mString, tipTop, N, 0.008 * HEX_R, 0.008 * HEX_R);
  acStrap(root, m.mString, tipBot, N, 0.008 * HEX_R, 0.008 * HEX_R);
  const tipP = G.clone().addScaledVector(dirA, 0.065 * HEX_R);
  acStrap(root, m.mWood, N, tipP, 0.012 * HEX_R, 0.012 * HEX_R);
  const tip = new THREE.Mesh(getACArrowTip(), m.mIronLt);
  tip.name = 'ac-lucznicza-arrow-tip';
  tip.quaternion.setFromUnitVectors(AC_UP, dirA);
  tip.position.copy(tipP.clone().addScaledVector(dirA, 0.018 * HEX_R));
  root.add(tip);
  const fl = new THREE.Mesh(getACFletch(), m.mOwner);
  fl.quaternion.setFromUnitVectors(AC_UP, dirA);
  fl.position.copy(N.clone().addScaledVector(dirA, 0.030 * HEX_R));
  root.add(fl);

  // wodze luźno zapętlone na lewym przedramieniu (Z4b)
  acStrap(root, m.mLeathDk,
    new THREE.Vector3(wristL.x + 0.012 * HEX_R, wristL.y - 0.014 * HEX_R, wristL.z),
    new THREE.Vector3(wristL.x - 0.010 * HEX_R, wristL.y + 0.010 * HEX_R, wristL.z - 0.008 * HEX_R),
    0.006 * HEX_R, 0.006 * HEX_R);

  // ── KOŁCZAN NA PLECACH — groty widoczne, lotki KOLORU GRACZA (slot 3) ───
  const q = new THREE.Mesh(getACQuiver(), m.mLeather);
  q.name = 'ac-lucznicza-quiver';
  q.rotation.x = -0.22;
  q.rotation.z = 0.20;
  q.position.set(-0.056 * HEX_R, anc.torsoCtr.y + 0.054 * HEX_R, anc.torsoCtr.z - (AC_TORSO_D * 0.5 + 0.032) * HEX_R);
  root.add(q);
  for (const [dx, dy] of [[-0.020, 0.0], [0.006, 0.012]] as [number, number][]) {
    const sh = new THREE.Mesh(getACQArrow(), m.mWood);
    sh.rotation.x = -0.22; sh.rotation.z = 0.20;
    sh.position.set(q.position.x + dx * HEX_R, q.position.y + (0.128 + dy) * HEX_R, q.position.z - 0.018 * HEX_R);
    root.add(sh);
    const f = new THREE.Mesh(getACFletch(), m.mOwner);
    f.rotation.x = -0.22; f.rotation.z = 0.20;
    f.scale.set(1.0, 0.62, 0.62);
    f.position.set(q.position.x + dx * HEX_R - 0.010 * HEX_R, q.position.y + (0.162 + dy) * HEX_R, q.position.z - 0.028 * HEX_R);
    root.add(f);
  }

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

/** Segment stałej długości od A wzdłuż jednostkowego kierunku D. */
function acAlongLen(
  parent: THREE.Object3D, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  A: THREE.Vector3, D: THREE.Vector3, len: number,
): THREE.Vector3 {
  const mesh = new THREE.Mesh(geo, mtl);
  if (D.y < -0.9999) mesh.rotation.x = Math.PI;
  else mesh.quaternion.setFromUnitVectors(AC_UP, D);
  mesh.position.copy(A.clone().addScaledVector(D, len * 0.5));
  parent.add(mesh);
  return A.clone().addScaledVector(D, len);
}

/** Zwolnienie singletonów modułu (konwencja disposeUnitGeometries z units.ts). */
export function disposeZelazoKonnicaAsyryjskaOpus5Geometries(): void {
  const all: (THREE.BufferGeometry | null)[] = [
    gACBarrel, gACChest, gACRump, gACWithers,
    gACNeck1, gACNeck2, gACNeck3, gACSkull, gACMuzzle, gACNostril, gACEar, gACEyeH,
    gACManeTuft, gACForelock,
    gACUpFrnt, gACUpRear, gACLower, gACPastern, gACHoof,
    gACTail1, gACTail2,
    gACPadTop, gACPadFlap, gACPadHem, gACPadRidge, gACFringe, gACGirth, gACBreast,
    gACNoseBand, gACBrowBand, gACBit, gACBitRing,
    gACTorso, gACChestR, gACScaleRow, gACSash, gACNeckR, gACHead, gACJaw, gACBeard,
    gACHelm, gACCrest, gACEarR,
    gACUpArm, gACForearm, gACFist, gACThigh, gACShin, gACSole, gACBootCuff,
    gACShaft, gACSocket, gACBind, gACGrip, gACLanceHd, gACButt,
    gACShield, gACBoss, gACRim,
    gACBowMid, gACBowLimb, gACBowSiyah, gACArrowTip, gACFletch, gACQuiver, gACQArrow,
    gACUnit,
  ];
  for (const g of all) { g?.dispose(); }
  gACBarrel = gACWithers = null;
  gACChest = gACRump = null;
  gACNeck1 = gACNeck2 = gACNeck3 = gACMuzzle = null;
  gACSkull = gACNostril = gACEyeH = gACManeTuft = gACForelock = null;
  gACEar = null;
  gACUpFrnt = gACUpRear = gACLower = gACPastern = gACHoof = null;
  gACTail1 = gACTail2 = null;
  gACPadTop = gACPadFlap = gACPadHem = gACPadRidge = gACFringe = gACBreast = null;
  gACGirth = null;
  gACNoseBand = gACBrowBand = gACBit = null;
  gACBitRing = null;
  gACTorso = gACChestR = gACScaleRow = gACSash = gACNeckR = gACHead = gACJaw = gACBeard = null;
  gACHelm = gACCrest = gACEarR = null;
  gACUpArm = gACForearm = gACFist = gACThigh = gACShin = gACSole = gACBootCuff = null;
  gACShaft = gACSocket = null;
  gACBind = gACGrip = null;
  gACLanceHd = null;
  gACButt = null;
  gACShield = gACBoss = gACRim = null;
  gACBowMid = gACBowLimb = gACBowSiyah = gACArrowTip = gACFletch = gACQuiver = gACQArrow = null;
  gACUnit = null;
}
