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
 *   THORAKITES — grecki WLOCZNIK w KOLCZUDZE (gr. thorakites = „ten w pancerzu",
 *     od thorax = PANCERZ; samo slowo NIE znaczy „kolczuga" — patrz K1 sekcji
 *     Thorakitesa), owalna tarcza THUREOS z pionowym KREGOSLUPEM (wplyw
 *     celtycki) + umbo-beczulka, WLOCZNIA DORY (0.70*HEX_R — krotsza niz
 *     sarissa falangity, dluzsza niz iklwa) w pchnieciu NADRECZNYM, helm
 *     ATTYCKI otwarty (widoczna twarz).
 *   TRIARI — WETERAN-WLOCZNIK SUPER Rzymu: KLECZACA poza trzeciej linii za
 *     scutum opartym o ziemie, DLUGA hasta wystawiona w przod-gore, brazowy
 *     montefortino z POTROJNYM bialym pioropuszem weterana, SIWY zarost,
 *     FALERY na piersi, choragiew supera na plecach (konwencja P2/P6).
 *
 * Budzet serii: <=~460 tri (Triari SUPER <=~490) — patrz countTri w renderach.
 *
 * ===========================================================================
 * AUDYT R-ZELAZO-AUDYT-POZOSTALE-Q1-T6 (Opus 5) — CO ZMIERZONO I CO NAPRAWIONO
 * ===========================================================================
 * Zakres: buildGwardiaTyrenska, buildTyrskiMiecznik, buildZelaznyKhopesh,
 * buildThorakites. buildTriari i buildFalangita (hastati-falangita.ts) POZA
 * zakresem — sprawdzono pomiarem, ze ich wyjscie jest po tej zmianie
 * BYTE-IDENTYCZNE (37 i 27 mesh, te same pozycje, kwaterniony, kolory).
 *
 * SPROSTOWANIE ZALOZENIA DISPATCHU. Dispatch T6 zakladal, ze Falanga z T3 lezy
 * „w tym samym pliku" i ze plik dostal juz przy tamtej naprawie nazwy mesh i
 * `userData.anchors`. To NIEPRAWDA i zostalo sprawdzone, nie przyjete:
 * buildFalangita mieszka w `hastati-falangita.ts`, a `git log` tego pliku ma
 * dokladnie jeden commit sprzed serii. Przed T6 ten plik NIE NAZYWAL ANI
 * JEDNEGO mesh (zmierzone: 0/33, 0/30, 0/31, 0/32 nazwanych) i nie mial
 * `anchors` — dokladnie ta sama przyczyna, dla ktorej z1-mezopotamia przez
 * cztery tematy serii nie byl sprawdzony (T5, C1).
 *
 * ZNALEZIONE POMIAREM I NAPRAWIONE:
 *   A1. GWARDIA TYRENSKA — MIECZ NIEWIDOCZNY Z KAMERY GRY. Kamera gry
 *       (`camera.ts`) stoi na stalym azymucie 0 i elewacji 52 stopni, wiec
 *       patrzy wzdluz (0; -0,788; -0,616). Miecz byl uniesiony W GORE-W PRZOD,
 *       czyli prawie dokladnie wzdluz tego kierunku: przy wlasnej dlugosci
 *       0,157 rzutowal sie na 0,0222 — 14% dlugosci. Dla porownania, w tej
 *       samej rodzinie: dory Falangity (T3, model zaakceptowany) 0,894,
 *       dory Thorakitesa 0,904, miecz Tyrskiego miecznika 0,831. Po naprawie
 *       (zamach W GORE-W TYL, katy THU/THF) 0,999 przy zachowanym zgieciu
 *       lokcia 0,700 rad. To NIE jest ta sama klasa bledu co T1/T3/T5 (bron
 *       w ciele) — tu bron nie tkwila w niczym, byla po prostu niewidoczna.
 *   A2. WOJOWNIK Z ZELAZNYM KHOPESH — SIERP NIEWIDOCZNY Z KAMERY GRY.
 *       Odpowiedz na pytanie dispatchu „czy khopesh jest faktycznie
 *       zakrzywiony": w 3D TAK (czesc prosta + 3-segmentowy hak, lacznie
 *       ~89 stopni luku), ale luk lezal w plaszczyznie STRZALKOWEJ figurki,
 *       w ktora kamera gry patrzy prawie dokladnie wzdluz. Zmierzone: caly
 *       khopesz mial na ekranie X = const (-0,120), czyli byl PIONOWA KRESKA
 *       o dlugosci 0,073 przy wlasnej 0,306, a strzalka luku wynosila 0,0000.
 *       Krzywizna — jedyna cecha odrozniajaca khopesz od zwyklego miecza —
 *       byla fizycznie nie do zobaczenia. Naprawa: obrot plaszczyzny sierpa
 *       (KH_ROLL) plus kat przedramienia; po niej dlugosc ekranowa 0,211,
 *       rozrzut poziomy 0,096 i strzalka 0,0461 (22% ciegiwy).
 *   A3. THORAKITES — HELM POCHLANIAL OCZY. Dzwon helmu attyckiego siedzial na
 *       HEAD_CTR+0,042, a jego promien u podstawy (0,086) jest wiekszy niz
 *       wysuniecie oczu (0,068): zmierzone przenikanie oko/dzwon 0,0195 na
 *       kazdym oku, twarz zakryta w calosci. Model renderowal wiec helm
 *       ZAMKNIETY, mimo ze komentarz i typ helmu mowily „attycki, otwarty" —
 *       a otwarta twarz jest jedyna cecha, ktora odroznia go od korynckiego
 *       helmu Falangi. Po naprawie (HELM_Y = HEAD_CTR+0,068) przenikanie
 *       0,0000 na obu oczach i twarz widoczna z kamery gry.
 *   A4. GWARDIA TYRENSKA vs TYRSKI MIECZNIK — DWIE JEDNOSTKI, JEDNA FIGURKA.
 *       Miara odroznialnosci z kamery gry (metoda T5: udzial pikseli
 *       roznych pokryciem albo barwa o >=40/255 w sumie obrysow pary).
 *       PRZED audytem para fenicka dawala 0,373 przy 0,721-0,811 dla kazdej
 *       innej pary czworki i 0,576 dla pary z gory odroznialnej (Thorakites
 *       vs Falanga). Elita byla wiec z kamery gry ta sama figurka co
 *       jednostka liniowa. Naprawione trzema zmianami, kazda uzasadniona
 *       rzeczowo (poza A1): helm ZLOCONY zamiast zelaznego (K1 sekcji
 *       Gwardii) i promienie gwiazdy ZLOTE zamiast kremowych. Po naprawie
 *       0,558 — nadal najnizsza para czworki, ale w pasmie pozostalych.
 *   A5. DISPATCH EN — dwie z czterech nazw angielskich z units.json nie
 *       trafialy we wlasny model (28-meshowy generyk). Poprawione w
 *       `units.ts`; „Iron Khopesh Warrior" NIE — patrz komentarz tam,
 *       poprawka lezy poza allowlista tego tematu.
 *
 * ZMIERZONE I POTWIERDZONE JAKO POPRAWNE (bez zmian geometrii):
 *   B1. ZERO przenikania broni przez cialo i ZERO przenikania konczyn przez
 *       tarcze we wszystkich czterech modelach, pelny SAT na wszystkich parach
 *       nazwanych mesh, przed i po naprawach. Jedyne zachodzenia bryl to
 *       warstwy zamierzone (pas na spodnicy, luski na torsie, helm na czaszce)
 *       i CHWYT (piesc/rekojesc, przedramie/drzewce) — prog chwytu wziety z
 *       RODZINY: Falangita T3 ma przedramie/drzewce 0,0218 i piesc/drzewce
 *       0,0335 przy RAMIENIU 0,0000; Thorakites ma 0,0093 / 0,0335 / 0,0000.
 *   B2. Zaden z czterech modeli NIE ma bledu z T2 (tarcza obrocona tylem do
 *       kamery). Iloczyn skalarny normalnej pola gracza z kierunkiem patrzenia:
 *       Gwardia -0,603, Tyrski miecznik -0,603, Khopesz -0,788, Thorakites
 *       -0,788 — kazda zwrocona DO kamery.
 *   B3. Thorakites JEST odrozniany od Falangi (pytanie dispatchu): 0,576 przed
 *       naprawami i 0,578 po nich, przy innym ksztalcie tarczy (thureos owalny
 *       vs aspis okragly), innym helmie (attycki otwarty vs koryncki zamkniety)
 *       i innym pancerzu (kolczuga vs linothorax).
 *
 * ZMIERZONE PROPORCJE PO NAPRAWIE (harness real-render, nie z pamieci):
 *   Gwardia Tyrenska   h=0,7267  maxR=0,3080  minY=0,0000  mesh=33
 *   Tyrski miecznik    h=0,6650  maxR=0,4060  minY=0,0000  mesh=30
 *   Zelazny khopesz    h=0,7753  maxR=0,3431  minY=0,0000  mesh=31
 *   Thorakites         h=0,7407  maxR=0,4757  minY=0,0000  mesh=32
 * Twardy limit heksu to maxR <= 0,866*HEX_R — wszystkie z zapasem.
 *
 * ZMIANA WSPOLNA (warunek mozliwosci audytu): kazdy mesh dostal `name` z
 * prefiksem jednostki (`gt-`, `tm-`, `kh-`, `th-`), a kazda grupa
 * `userData['anchors']` — konwencja hastati-falangita.ts i z1-mezopotamia.ts.
 * Wspolne funkcje pomocnicze (z2Seg/z2BuildArm/z2Core/...) dostaly parametry
 * nazwy z DOMYSLNA wartoscia pusta, wiec buildTriari — ktory z nich korzysta,
 * a jest poza zakresem — nie zmienil sie ani o jeden bajt wyjscia.
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
  P: THREE.Vector3, theta: number, len: number, nm: string = '',
): THREE.Vector3 {
  const dir = z2DirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  if (nm !== '') mesh.name = nm;
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}
function z2BuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  mFoot: THREE.MeshStandardMaterial, hipY: number = Z2_HIP_Y,
  pf: string = '', side: string = '',
): void {
  const nm = (part: string): string => (pf === '' ? '' : pf + '-leg-' + side + '-' + part);
  let P = new THREE.Vector3(sx, hipY, 0);
  P = z2Seg(group, getGZ2Thigh(), mThigh, P, thU, Z2_THIGH_L, nm('thigh'));
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = z2Seg(group, getGZ2Shin(), mShin, P, thL, Z2_SHIN_L, nm('shin'));
  const foot = new THREE.Mesh(getGZ2Foot(), mFoot);
  foot.position.set(sx, 0.013 * HEX_R, P.z + 0.016 * HEX_R);
  if (pf !== '') foot.name = nm('foot');
  group.add(foot);
}
function z2BuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
  shldY: number = Z2_SHLD_Y,
  pf: string = '', side: string = '',
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  const nm = (part: string): string => (pf === '' ? '' : pf + '-arm-' + side + '-' + part);
  let P = new THREE.Vector3(sx, shldY, 0);
  P = z2Seg(group, getGZ2UpArm(), mUp, P, thU, Z2_UPARM_L, nm('upper'));
  P.y += 0.010 * HEX_R;
  const wrist = z2Seg(group, getGZ2Forearm(), mFore, P, thF, Z2_FOREARM_L, nm('fore'));
  if (mFist !== null) {
    const fist = new THREE.Mesh(getGZ2Fist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(z2DirDown(thF), 0.014 * HEX_R));
    if (pf !== '') fist.name = nm('fist');
    group.add(fist);
  }
  return { wrist, axis: z2DirDown(thF) };
}
/** Korpus: tors + szyja + glowa (+ opcjonalne oczy przy odkrytej twarzy). */
function z2Core(
  group: THREE.Group, mat: MatFactory, mTorso: THREE.MeshStandardMaterial,
  eyes: boolean = false, pf: string = '',
): THREE.MeshStandardMaterial {
  const nm = (part: string): string => (pf === '' ? '' : pf + '-' + part);
  const torso = new THREE.Mesh(getGZ2Torso(), mTorso);
  torso.position.set(0, Z2_TORSO_CTR, 0);
  if (pf !== '') torso.name = nm('torso');
  group.add(torso);
  const mSkin = mat(Z2_SKIN, 0.05, 0.80);
  const neck = new THREE.Mesh(getGZ2Neck(), mSkin);
  neck.position.set(0, Z2_TORSO_TOP + Z2_NECK_H * 0.5, 0);
  if (pf !== '') neck.name = nm('neck');
  group.add(neck);
  const head = new THREE.Mesh(getGZ2Head(), mSkin);
  head.position.set(0, Z2_HEAD_CTR, 0);
  if (pf !== '') head.name = nm('head');
  group.add(head);
  if (eyes) {
    const mEye = mat(Z2_EYE, 0.02, 0.95);
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(getGZ2Eye(), mEye);
      eye.position.set(sx * 0.028 * HEX_R, Z2_HEAD_CTR + 0.008 * HEX_R, Z2_HEAD_S * 0.5 + 0.004 * HEX_R);
      if (pf !== '') eye.name = nm('eye-' + (sx < 0 ? 'right' : 'left'));
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
  pf: string = '',
): void {
  const blade = new THREE.Mesh(bladeGeo, mBlade);
  blade.rotation.x = Math.PI - thF;
  blade.position.copy(wrist.clone().addScaledVector(axis, 0.098 * HEX_R));
  if (pf !== '') blade.name = pf + '-sword-blade';
  group.add(blade);
  const tip = new THREE.Mesh(getGZ2BladeTip(), mBlade);
  tip.rotation.x = Math.PI - thF;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(wrist.clone().addScaledVector(axis, 0.1875 * HEX_R));
  if (pf !== '') tip.name = pf + '-sword-tip';
  group.add(tip);
  const guard = new THREE.Mesh(getGZ2Guard(), mGuard);
  guard.rotation.x = Math.PI - thF;
  guard.position.copy(wrist.clone().addScaledVector(axis, 0.030 * HEX_R));
  if (pf !== '') guard.name = pf + '-sword-guard';
  group.add(guard);
}
/** Okragla tarcza: pole (kolor gracza) + rant; zwraca grupe do ozdob. */
function z2RoundShield(
  mFace: THREE.MeshStandardMaterial, mRim: THREE.MeshStandardMaterial, big: boolean,
  pf: string = '',
): THREE.Group {
  const sh = new THREE.Group();
  const face = new THREE.Mesh(big ? getGZ2ShFaceB() : getGZ2ShFace(), mFace);
  face.rotation.x = Math.PI / 2;
  if (pf !== '') face.name = pf + '-shield-face';
  sh.add(face);
  const rim = new THREE.Mesh(big ? getGZ2ShRimB() : getGZ2ShRim(), mRim);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0, -0.004 * HEX_R);
  if (pf !== '') rim.name = pf + '-shield-rim';
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

// ===========================================================================
// ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA (Tyrski miecznik)
// ===========================================================================
// units.json: Epoka=Zelazo, Kultura/Nacja=Fenicjanie, Tech=Hutnictwo zelaza,
// Typ=Swordsman, Atak 8 / Obrona 6 / Pancerz 4, Health 24, Nazwa EN „Tyrian
// Swordsman", Uwagi: „Jednostka specjalna Fenicjan; piechota kolonialna/miejska
// Tyr". Rama czasowa przyjeta dla calej trojki srodziemnomorskiej: ok. 1200-600
// p.n.e. (epoka zelaza wg gry).
//
// K1. NAJPIERW UCZCIWIE: FENICJANIE SA KULTURA, KTORA ZOSTAWILA NAJMNIEJ
//     WLASNYCH PRZEDSTAWIEN WOJSKA z calej czworki tego audytu. Nie ma
//     fenickiej narracyjnej sztuki wojennej porownywalnej z asyryjska czy
//     egipska; miasta-panstwa Tyru i Sydonu byly potegami MORSKIMI i placily
//     Asyrii trybut zamiast wystawiac armie ladowe. Wszystko, co ponizej,
//     opiera sie wiec na trzech typach zrodel POSREDNICH, nazwanych wprost:
//     (a) asyryjskie reliefy pokazujace Fenicjan (Brazowe Wrota z Balawat
//         Salmanasara III, 859-824 p.n.e. — trybut okretow z Tyru, Sydonu
//         i Byblos; reliefy Sennacheryba, 705-681 p.n.e. — okrety fenickie
//         i sceny pod Tyrem; oba zespoly w British Museum);
//     (b) tekst hebrajski: Ezechiel 27,10-11 o Tyrze — „Persowie, Ludyjczycy
//         i Putyjczycy byli w twoim wojsku, twoi wojownicy; tarcze i helm
//         zawieszali u ciebie, oni dodawali ci ozdoby (...) mezowie z Arwadu
//         na twoich murach dokola (...) tarcze swe zawieszali na twoich
//         murach dokola". To jest jedyny wczesny opis, ktory mowi o
//         uzbrojeniu Tyru wprost — i mowi, ze byli to NAJEMNICY, a tarcza
//         i helm sluzyly takze za DEKORACJE murow;
//     (c) Herodot VII.89 o kontyngencie fenickim: „na glowach mieli helmy
//         zblizone do greckich, nosili lniane pancerze, a tarcze mieli BEZ
//         OBRECZY i oszczepy". Zrodlo pozniejsze (480 p.n.e.) i dotyczy
//         MARYNARZY, nie piechoty miejskiej — dlatego uzyte jako poszlaka,
//         nie jako wzorzec. Jawnie nazwana ROZBIEZNOSC: ta figurka MA obrecz
//         (brazowy rant), czyli w tym jednym punkcie odchodzi od Herodota.
//         Rant zostawiono, bo rozdziela pole w kolorze gracza od tla planszy
//         i bez niego zeton przestaje byc czytelny; to jest decyzja
//         czytelnosci gry, nie ustalenie historyczne, i tak jest tu opisana.
// K2. PURPURA TYRYJSKA — jedyny znacznik tozsamosci, ktory jest dla Tyru
//     bezsporny. Barwnik z slimakow z rodzaju Hexaplex/Bolinus (murex), opisany
//     przez Pliniusza Starszego („Historia naturalna" IX.60-65) razem z cena
//     i technologia; sama nazwa „Fenicjanie" (gr. Phoinikes) jest z nia
//     etymologicznie zwiazana. Tunika purpurowa z kremowa lamowka jest wiec
//     dla tej figurki znacznikiem MIASTA, nie znacznikiem rangi.
// K3. MIECZ ZELAZNY PROSTY, W PCHNIECIU. W Lewancie epoki zelaza dominuje
//     obosieczny miecz prosty; bron sierpowata (khopesh/sappara) jest forma
//     II tysiaclecia i wychodzi z uzycia razem z epoka brazu (patrz K1 sekcji
//     Wojownika z zelaznym khopesh). Pchniecie zamiast ciecia jest tu takze
//     rozroznieniem wewnatrzgrowym wobec Gwardii Tyrenskiej, ktora tnie z
//     zamachu.
// K4. HELM POLKULISTY BEZ GRZEBIENIA. Ezechiel (K1b) mowi o helmie, ale nie
//     opisuje formy; asyryjskie reliefy Lewantu pokazuja helmy proste, gladkie,
//     bez pioropusza u szeregowych. Gladka misa + kopulka + krotka ciemna kitka
//     jest wiec wyborem minimalnym — i to on niesie roznice wobec ZLOCONEGO,
//     grzebieniastego helmu Gwardii.
// K5. ROZETA na tarczy zamiast wizerunku bostwa. Rozeta jest w sztuce
//     fenickiej i szerzej lewantynskiej motywem powszechnym (kosc sloniowa z
//     Nimrud i Arslan Tash — warsztaty fenickie, IX-VIII w. p.n.e.). Wybrano
//     ja swiadomie zamiast godla Melkarta albo Tanit: godlo bostwa na tarczy
//     szeregowego zolnierza byloby domyslem, rozeta jest motywem faktycznie
//     poswiadczonym i neutralnym religijnie (ten sam wybor co „neutralna
//     episema" Falangity z T3).
// K6. ANACHRONIZM NAZWANY, NIE ZAMIECIONY: units.json daje Tyrskiemu miecznikowi
//     Pancerz 4 — czyli JAKAS zbroje — a model pokazuje sama tunike bez
//     pancerza. Nie jest to blad modelu wobec zrodel (Herodot mowi o LNIANYM
//     pancerzu, a lniany pancerz w tej rodzinie renderuje sie jako tunika, nie
//     jako plyty), ale jest to napiecie miedzy liczba w arkuszu a sylwetka i
//     zapisuje sie je tutaj, zamiast udawac, ze go nie ma. units.json jest poza
//     allowlista tego tematu i nie zostal tkniety.
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
  const THF = 1.50;                                 // kat przedramienia = os miecza

  // korpus: purpurowa tunika + spodnica + kremowa lamowka + pas
  const mSkin = z2Core(group, mat, mPurple, false, 'tm');
  const skirt = new THREE.Mesh(getGZ2Skirt(), mPurple);
  skirt.position.set(0, Z2_TORSO_BOT - 0.018 * HEX_R, 0);
  skirt.name = 'tm-skirt';
  group.add(skirt);
  const hem = new THREE.Mesh(getGZ2Hem(), mCream);
  hem.position.set(0, Z2_TORSO_BOT - 0.052 * HEX_R, 0);
  hem.name = 'tm-hem';
  group.add(hem);
  const belt = new THREE.Mesh(getGZ2Belt(), mLeath);
  belt.position.set(0, 0.256 * HEX_R, 0);
  belt.name = 'tm-belt';
  group.add(belt);
  const sash = new THREE.Mesh(getGZ2Sash(), mOwner);   // szarfa kolor gracza
  sash.rotation.z = 0.45;
  sash.position.set(0.012 * HEX_R, Z2_TORSO_CTR + 0.010 * HEX_R, Z2_TORSO_D * 0.5 + 0.008 * HEX_R);
  sash.name = 'tm-sash';
  group.add(sash);

  // nogi: wypad
  z2BuildLeg(group,  Z2_HIP_X,  0.56,  0.32, mPurple, mSkin, mLeath, HIP_Y, 'tm', 'left');
  z2BuildLeg(group, -Z2_HIP_X, -0.50, -0.18, mPurple, mSkin, mLeath, HIP_Y, 'tm', 'right');

  // HELM POLKULISTY: misa + kopulka ZELAZNE (zimna stal) + krotka ciemna kitka
  const bowl = new THREE.Mesh(getGZ2Bowl(), mSteel);
  bowl.position.set(0, Z2_HEAD_CTR + 0.038 * HEX_R, 0);
  bowl.name = 'tm-helmet-bowl';
  group.add(bowl);
  const top = new THREE.Mesh(getGZ2BowlTop(), mSteel);
  top.position.set(0, Z2_HEAD_CTR + 0.088 * HEX_R, 0);
  top.name = 'tm-helmet-dome';
  group.add(top);
  const tuftG = new THREE.Mesh(getGZ2Finial(), mDark);
  tuftG.position.set(0, Z2_HEAD_TOP + 0.052 * HEX_R, -0.008 * HEX_R);
  tuftG.name = 'tm-helmet-tuft';
  group.add(tuftG);

  // PRAWE (-X) RAMIE + ZELAZNY MIECZ w pchnieciu
  const armR = z2BuildArm(group, -Z2_SHLD_X, 0.95, THF, mPurple, mSkin, mLeath, Z2_SHLD_Y, 'tm', 'right');
  z2IronSword(group, armR.wrist, armR.axis, THF, mSteel, mBronze, getGZ2Blade(), 'tm');

  // LEWE (+X) RAMIE + TARCZA Z ROZETA (3 platki-boxy przez srodek = 6 platkow)
  const armL = z2BuildArm(group, Z2_SHLD_X, 0.52, 1.05, mPurple, mSkin, null, Z2_SHLD_Y, 'tm', 'left');
  const sh = z2RoundShield(mOwner, mBronze, false, 'tm');
  for (let i = 0; i < 3; i++) {
    const petal = new THREE.Mesh(getGZ2Petal(), mCream);
    petal.rotation.z = i * Math.PI / 3;
    petal.position.z = 0.018 * HEX_R;
    petal.name = 'tm-shield-petal-' + i;
    sh.add(petal);
  }
  const hub = new THREE.Mesh(getGZ2ShBoss(), mBronze);
  hub.position.z = 0.025 * HEX_R;
  hub.name = 'tm-shield-boss';
  sh.add(hub);
  z2MountShield(group, sh, armL.wrist);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  // Kotwice do asercji geometrycznych — punkty odniesienia BIORA SIE Z MODELU,
  // nie sa wpisane liczbowo w tescie (lekcja T1/T2/T5 serii).
  group.userData['anchors'] = {
    hexR: HEX_R,
    headTopY: Z2_HEAD_TOP, headCtrY: Z2_HEAD_CTR,
    torsoTopY: Z2_TORSO_TOP, torsoBotY: Z2_TORSO_BOT,
    torsoHalfW: Z2_TORSO_W * 0.5, torsoHalfD: Z2_TORSO_D * 0.5,
    hipY: HIP_Y, shoulderY: Z2_SHLD_Y, shoulderX: Z2_SHLD_X,
    grip: armR.wrist.toArray(),
    weaponAxis: armR.axis.toArray(),
    weaponKind: 'sword-straight',
    shieldKind: 'round-small',
    shieldFaceR: 0.112 * HEX_R,
    shieldDevice: 'rosette-6',
  };
  return group;
}

// ===========================================================================
// ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA (Gwardia Tyrenska)
// ===========================================================================
// units.json: Epoka=Zelazo, Kultura/Nacja=Fenicjanie, Tech=Hutnictwo zelaza,
// Typ=Swordsman, Atak 8 / Obrona 7 / Pancerz 4, Health 24, Nazwa EN „Tyre
// Guard", Uwagi: „Elitarna gwardia miasta Tyr". Wobec Tyrskiego miecznika
// rozni sie WYLACZNIE Obrona (7 vs 6) i etykieta elity — Pancerz, Atak,
// Health i koszt sa identyczne. To jest wazne, bo wyznacza granice tego,
// co model ma prawo pokazac: NIE ciezsza zbroje (Pancerz ten sam), tylko
// wyzsza range i lepsza oslone.
//
// K1. HELM ZLOCONY, NIE ZELAZNY — I DLACZEGO TO NIE JEST OZDOBNIK. Wejscie
//     epoki zelaza nie oznacza, ze zelazo wypiera braz wszedzie naraz: zelazo
//     idzie NAJPIERW na czesci tnace (klingi, groty), a uzbrojenie ochronne
//     i paradne pozostaje BRAZOWE jeszcze przez stulecia, bo braz sie odlewa
//     w zlozone ksztalty i poleruje na zloty polysk, a wczesne zelazo nie.
//     Najlepiej datowany zestaw grecki tej epoki — panoplia z Argos z tomby
//     odkrytej przez P. Courbina w 1953 r., ostatnia cwierc VIII w. p.n.e. —
//     to BRAZOWY pancerz dzwonowy i BRAZOWY helm stozkowy (Kegelhelm),
//     w epoce, ktora juz nazywamy zelazna. Zlocony helm gwardzisty przy
//     ZELAZNYM mieczu jest wiec ukladem poprawnym, a nie kompromisem.
//     Dodatkowo: Tyr placi Asyrii trybut ZLOTEM i srebrem (Brazowe Wrota
//     z Balawat, panele trybutu Tyru i Sydonu), wiec zloto jest dla tego
//     miasta znacznikiem statusu dostepnym i oczywistym.
//     UWAGA METODOLOGICZNA: ta zmiana zostala wprowadzona takze dlatego, ze
//     bez niej Gwardia byla z kamery gry nieodroznialna od Tyrskiego miecznika
//     (pomiar: naglowek pliku, A4). Kolejnosc jest tu podana szczerze —
//     najpierw pomiar pokazal problem, potem szukano rozwiazania, ktore ma
//     uzasadnienie rzeczowe. Uzasadnienie nie zostalo dorobione po fakcie do
//     dowolnej zmiany: odrzucono m.in. dodanie luskowego pancerza (Pancerz
//     w units.json jest ten sam co u miecznika — patrz wyzej) i grzebien
//     karmazynowy (to znacznik grecki, uzywany juz przez Thorakitesa i Falange).
// K2. GRZEBIEN PRZOD-TYL jako znacznik rangi. Grzebien biegnacy wzdluz osi
//     helmu jest w calym basenie wschodniosrodziemnomorskim epoki zelaza
//     znacznikiem oficera/gwardii (asyryjskie reliefy, panoplia z Argos z K1,
//     pozniej helm koryncki). Ciemny wlos konski zamiast barwionego: barwiony
//     pioropusz to znacznik grecki, a ta jednostka ma czytac sie jako fenicka.
// K3. GWIAZDA OSMIOPROMIENNA na tarczy. Osmiopromienna gwiazda/rozeta jest na
//     Bliskim Wschodzie epoki zelaza godlem bostwa astralnego (Isztar/Asztarte),
//     a Asztarte jest bostwem Tyru obok Melkarta; motyw wystepuje masowo na
//     pieczeciach i kosciach sloniowych warsztatow fenickich (Nimrud, Arslan
//     Tash). Dla gwardii MIEJSKIEJ godlo bostwa opiekunczego miasta jest
//     uzasadnione lepiej niz dla szeregowego (patrz K5 sekcji miecznika,
//     gdzie z tego powodu wybrano neutralna rozete).
// K4. TARCZA WIEKSZA NIZ U MIECZNIKA (promien 0,126 vs 0,112) — to jedyna
//     roznica statystyczna miedzy tymi jednostkami (Obrona 7 vs 6) przelozona
//     na geometrie. Nie na Pancerz, bo Pancerz jest identyczny.
// K5. NAGOLENNICA TYLKO NA NODZE WYKROCZNEJ. Pojedyncza nagolennica na
//     wysunietej nodze jest rozwiazaniem poswiadczonym w Egei epoki zelaza
//     (znaleziska pojedynczych knemid) i sensownym praktycznie: chroni te
//     golen, ktora przy wypadzie wychodzi zza tarczy. Zloty kolor jak w K1.
// K6. CZEGO TU CELOWO NIE MA. Nie ma pancerza luskowego (Pancerz 4 = tyle samo
//     co u miecznika), nie ma wloczni (Typ=Swordsman), nie ma godla Melkarta
//     (brak poswiadczenia dla godla bostwa MESKIEGO na tarczy fenickiej),
//     nie ma tarczy bez obreczy z Herodota (patrz K1c sekcji miecznika —
//     ta sama, jawnie nazwana rozbieznosc dotyczy obu jednostek fenickich).
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
  // ZAMACH: lokiec nad barkiem, przedramie i miecz uniesione W GORE-W TYL.
  // AUDYT T6 — patrz sekcja (A1) w naglowku pliku: poprzednie katy (-2.45/2.62)
  // ustawialy miecz w GORE-W PRZOD, czyli DOKLADNIE wzdluz kierunku patrzenia
  // kamery gry; caly miecz rzutowal sie z niej na 0,0222 (przy dlugosci wlasnej
  // 0,157), wiec byl praktycznie niewidoczny. Kat przedramienia (THF) jest
  // JEDYNYM parametrem, ktory o tym decyduje — stad stala, nie liczba w miejscu.
  const THU = 3.40;                                 // ramie: lokiec pionowo w gore
  const THF = 4.10;                                 // przedramie/miecz: w gore-w tyl

  // korpus: purpura + ZLOTA lamowka + ozdobny szeroki pas + 2 zlote krazki
  const mSkin = z2Core(group, mat, mPurple, false, 'gt');
  const skirt = new THREE.Mesh(getGZ2Skirt(), mPurple);
  skirt.position.set(0, Z2_TORSO_BOT - 0.018 * HEX_R, 0);
  skirt.name = 'gt-skirt';
  group.add(skirt);
  const hem = new THREE.Mesh(getGZ2Hem(), mGold);
  hem.position.set(0, Z2_TORSO_BOT - 0.052 * HEX_R, 0);
  hem.name = 'gt-hem';
  group.add(hem);
  const belt = new THREE.Mesh(getGZ2BeltWide(), mLeath);
  belt.position.set(0, 0.258 * HEX_R, 0);
  belt.name = 'gt-belt';
  group.add(belt);
  const sash = new THREE.Mesh(getGZ2Sash(), mGold);    // zlota szarfa elity
  sash.rotation.z = 0.45;
  sash.position.set(0.012 * HEX_R, Z2_TORSO_CTR + 0.010 * HEX_R, Z2_TORSO_D * 0.5 + 0.008 * HEX_R);
  sash.name = 'gt-sash';
  group.add(sash);

  // nogi + zlota nagolennica na wykrocznej
  z2BuildLeg(group,  Z2_HIP_X,  0.56,  0.32, mPurple, mSkin, mLeath, HIP_Y, 'gt', 'left');
  z2BuildLeg(group, -Z2_HIP_X, -0.50, -0.18, mPurple, mSkin, mLeath, HIP_Y, 'gt', 'right');
  const greave = new THREE.Mesh(getGZ2Greave(), mGold);
  greave.rotation.x = Math.PI - 0.32;
  greave.position.set(Z2_HIP_X, 0.072 * HEX_R, 0.066 * HEX_R);
  greave.name = 'gt-greave';
  group.add(greave);

  // HELM POLKULISTY ZLOCONY Z GRZEBIENIEM (misa + kopulka + grzebien przod-tyl)
  // ZLOCONY, nie zelazny: to jedyna czesc sylwetki, ktora z kamery gry zajmuje
  // duza, zwarta plame i moze odroznic elite od liniowego Tyrskiego miecznika
  // (ta sama purpura, ta sama poza wypadu, ta sama tarcza-kolo). Uzasadnienie
  // rzeczowe: w epoce zelaza helm paradny/elitarny pozostaje BRAZOWY i zlocony,
  // a zelazo idzie na klinge — patrz (K1) w naglowku pliku. Miecz zostaje
  // ZELAZNY (mSteel) w obu jednostkach: to jest ich wspolna technologia.
  const bowl = new THREE.Mesh(getGZ2Bowl(), mGold);
  bowl.position.set(0, Z2_HEAD_CTR + 0.038 * HEX_R, 0);
  bowl.name = 'gt-helmet-bowl';
  group.add(bowl);
  const top = new THREE.Mesh(getGZ2BowlTop(), mGold);
  top.position.set(0, Z2_HEAD_CTR + 0.088 * HEX_R, 0);
  top.name = 'gt-helmet-dome';
  group.add(top);
  const crB = new THREE.Mesh(getGZ2CrestBase(), mGold);
  crB.position.set(0, Z2_HEAD_TOP + 0.048 * HEX_R, -0.004 * HEX_R);
  crB.name = 'gt-crest-base';
  group.add(crB);
  const crH = new THREE.Mesh(getGZ2CrestHair(), mCrest);
  crH.rotation.x = 0.10;
  crH.position.set(0, Z2_HEAD_TOP + 0.090 * HEX_R, -0.008 * HEX_R);
  crH.name = 'gt-crest-hair';
  group.add(crH);

  // PRAWE (-X) RAMIE + ZELAZNY MIECZ Z ZAMACHU (lokiec nad barkiem)
  const armR = z2BuildArm(group, -Z2_SHLD_X, THU, THF, mPurple, mSkin, mLeath, Z2_SHLD_Y, 'gt', 'right');
  z2IronSword(group, armR.wrist, armR.axis, THF, mSteel, mGold, getGZ2Blade(), 'gt');

  // LEWE (+X) RAMIE + WIEKSZA TARCZA Z GWIAZDA FENICKA (4 boxy = 8 promieni)
  // Promienie ZLOTE, nie kremowe: kremowa rozeta jest znakiem Tyrskiego
  // miecznika (ta sama paleta, ta sama tarcza kolo) — zloto jest jedynym
  // atrybutem elity, ktory z kamery gry faktycznie odroznia te dwie fenickie
  // jednostki na polu tarczy. Pomiar rozroznialnosci: naglowek pliku, (A4).
  const armL = z2BuildArm(group, Z2_SHLD_X, 0.50, 1.02, mPurple, mSkin, null, Z2_SHLD_Y, 'gt', 'left');
  const sh = z2RoundShield(mOwner, mGold, true, 'gt');
  for (let i = 0; i < 4; i++) {
    const ray = new THREE.Mesh(getGZ2Petal(), mGold);
    ray.rotation.z = i * Math.PI / 4;
    ray.position.z = 0.019 * HEX_R;
    ray.name = 'gt-shield-ray-' + i;
    sh.add(ray);
  }
  const hub = new THREE.Mesh(getGZ2ShBoss(), mGold);
  hub.position.z = 0.026 * HEX_R;
  hub.name = 'gt-shield-boss';
  sh.add(hub);
  z2MountShield(group, sh, armL.wrist);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  group.userData['anchors'] = {
    hexR: HEX_R,
    headTopY: Z2_HEAD_TOP, headCtrY: Z2_HEAD_CTR,
    torsoTopY: Z2_TORSO_TOP, torsoBotY: Z2_TORSO_BOT,
    torsoHalfW: Z2_TORSO_W * 0.5, torsoHalfD: Z2_TORSO_D * 0.5,
    hipY: HIP_Y, shoulderY: Z2_SHLD_Y, shoulderX: Z2_SHLD_X,
    grip: armR.wrist.toArray(),
    weaponAxis: armR.axis.toArray(),
    weaponKind: 'sword-straight',
    shieldKind: 'round-big',
    shieldFaceR: 0.126 * HEX_R,
    shieldDevice: 'star-8',
  };
  return group;
}

// ===========================================================================
// ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA (Wojownik z zelaznym khopesh)
// ===========================================================================
// units.json: Epoka=Zelazo, Kultura/Nacja=Egipt, Tech=Hutnictwo zelaza,
// Typ=Swordsman, Atak 8 / Obrona 7 / Pancerz 6 (najwyzszy z czworki razem z
// Thorakitesem), Health 23, Nazwa EN „Iron Khopesh Warrior", „W zamian za:
// Wojownik z khopesh", Uwagi: „Zelazny khopesh; silniejsza wersja egipskiego
// wojownika brazowego".
//
// K1. TWARDY ANACHRONIZM, ZOSTAWIONY SWIADOMIE — I TO JEST NAJWAZNIEJSZA
//     POZYCJA TEJ SEKCJI. „Zelazny khopesz" to obiekt, ktory historycznie
//     NIE ISTNIAL i nie mogl istniec w tej formie. Khopesz jest bronia EPOKI
//     BRAZU: pojawia sie w Egipcie najpozniej w Sredniim Panstwie, szczyt ma
//     w Nowym Panstwie i wychodzi z uzycia bojowego juz ok. 1300 p.n.e.,
//     przezywajac potem wylacznie jako REKWIZYT CEREMONIALNY i znak wladzy
//     (m.in. egzemplarze z grobowca Tutanchamona). Jego forma — ciezka,
//     odlewana glownia bijaca krawedzia ZEWNETRZNA — jest wprost pochodna
//     technologii ODLEWU brazu; kucie zelaza prowadzi w przeciwna strone,
//     do dlugiej prostej klingi. Do tego Egipt przyjmuje zelazo pozno:
//     przedmioty zelazne wchodza szerzej dopiero w XXVI dynastii saickiej
//     (ok. 664-525 p.n.e.), a osrodkiem obrobki staje sie grecka Naukratis
//     w ostatniej tercji VII w. p.n.e.
//     DECYZJA (§10 — Operator rozstrzyga i dokumentuje, nie pyta): jednostka
//     ZOSTAJE taka, jaka jest w units.json, bo units.json jest lista wymagan
//     wlasciciela i lezy poza allowlista tego tematu. Anachronizm jest tu
//     NAZWANY, a nie wygladzony — dokladnie jak kaunakes i Harappa w epoce
//     zelaza w T5. Model probuje jedynie zminimalizowac szkode: glownia jest
//     ZIMNA STALA (nie zlotawym brazem), a nie zelazna kopia brazowego
//     odlewu — czyli pokazuje przejscie technologii, nie zaprzecza mu.
// K2. KHOPESZ JEST FAKTYCZNIE ZAKRZYWIONY — pytanie postawione wprost w
//     dispatchu. Zmierzone w zywym Three.js: czesc prosta na osi przedramienia
//     plus trzysegmentowy hak o katach 0,40 / 0,95 / 1,55 rad, lacznie ok. 89
//     stopni luku; ostrze bije krawedzia ZEWNETRZNA luku, jak w oryginale.
//     PRZED audytem luk byl jednak niewidoczny z kamery gry (naglowek pliku,
//     A2) — samo „jest zakrzywiony w danych" nie wystarczylo.
// K3. KHEPRESZ — DRUGI ANACHRONIZM, TAKZE NAZWANY. Niebieska korona khepresz
//     byla nakryciem glowy zastrzezonym dla FARAONA (i nastepcy tronu):
//     wykonywana ze skory albo usztywnionej tkaniny pokrytej setkami krazkow,
//     z ureuszem z przodu. Szeregowy wojownik nie mial prawa jej nosic — to
//     mniej wiecej tak, jakby dac liniowemu piechurowi korone krolewska.
//     ZOSTAWIONA, z jawnie nazwanym powodem: ta jednostka jest w units.json
//     zdefiniowana jako „W zamian za: Wojownik z khopesh", czyli ma czytac sie
//     jako CIEZSZA SIOSTRA brazowego wojownika, ktory nosi khepresz w
//     `jednostki-p4-melee.ts`. Zdjecie korony tylko tutaj rozjechaloby pare
//     i naprawiloby historie w jednej jednostce, psujac spojnosc dwoch —
//     a brazowy model lezy poza allowlista tego tematu. Zamiast tego korona
//     jest tu CIEMNIEJSZA (Z2_KHEP_DK) niz u przodka, co niesie roznice
//     epokowa. Rzecz zapisano jako osobny temat do rejestru, nie jako uwage
//     w raporcie (§3b).
// K4. ZBROJA LUSKOWA — pozycja, ktora jest tu ZGODNA ZE ZRODLAMI i tlumaczy
//     Pancerz 6. Zbroja luskowa (rzedy malych plytek naszytych na podklad z
//     lnu albo skory) jest w Egipcie poswiadczona od Nowego Panstwa —
//     m.in. luski z palacu Amenhotepa III w Malkata i z grobowca
//     Tutanchamona — i przezywa w Lewancie caly okres zelaza. Trzy pasy
//     schodkowe na lnianej tunice sa jej uproszczonym zapisem. To jest
//     najwyzszy Pancerz czworki (6, wspolnie z Thorakitesem) i model to
//     pokazuje.
// K5. TARCZA PROSTOKATNA ZAOKRAGLONA U GORY — najlepiej poswiadczony ksztalt
//     egipski. Tarcza egipska od Srednmiego Panstwa po Nowe Panstwo jest
//     wysoka, prostokatna u dolu i lukowato zamknieta u gory (drewno kryte
//     skora); egzemplarze i modele z grobowca Tutanchamona, liczne
//     przedstawienia piechoty na reliefach Nowego Panstwa. Zostawiona bez
//     zmian — jest to jedyny ksztalt tarczy w tej czworce, ktory nie powtarza
//     sie u zadnego sasiada (kryterium odroznialnosci).
// K6. BOSE UDA I SANDALY, LNIANY KILT. Standard egipskiej piechoty przez cala
//     historie: kilt/shendyt, sandaly albo bose stopy, brak nogawic. Skora
//     nie jest tu przyciemniana wzgledem reszty serii — ujednolicona
//     karnacja Z2_SKIN jest konwencja calego pliku i nie jest twierdzeniem
//     etnograficznym.
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
  // ZAMACH: przedramie w GORE-W TYL, sierp curly W BOK (do kamery gry).
  // AUDYT T6 — patrz (A2) w naglowku pliku. Poprzednio hak khopesza lezal w
  // plaszczyznie strzalkowej (YZ) figurki, a kamera gry patrzy dokladnie wzdluz
  // niej: caly sierp — jedyna cecha odrozniajaca khopesz od zwyklego miecza —
  // rzutowal sie na PIONOWY ODCINEK o dlugosci 0,073 przy wlasnej dlugosci
  // 0,306, bez zadnego wygiecia w poziomie. Dwie stale nizej sa jedynymi
  // parametrami, ktore o tym decyduja.
  const THU = 3.30;                                 // ramie: lokiec pionowo w gore
  const THF = 4.049;                                // przedramie: w gore-w tyl
  const KH_ROLL = -1.15;                            // obrot plaszczyzny sierpa ku kamerze

  // korpus: lniana tunika + kilt + pas gracza + ZBROJA LUSKOWA (3 pasy)
  const mSkin = z2Core(group, mat, mLinen, false, 'kh');
  const skirt = new THREE.Mesh(getGZ2Skirt(), mLinen);
  skirt.position.set(0, Z2_TORSO_BOT - 0.018 * HEX_R, 0);
  skirt.name = 'kh-skirt';
  group.add(skirt);
  const waist = new THREE.Mesh(getGZ2Belt(), mOwner);
  waist.position.set(0, 0.252 * HEX_R, 0);
  waist.name = 'kh-belt';
  group.add(waist);
  for (let i = 0; i < 3; i++) {                     // luska: pasy schodkowe
    const band = new THREE.Mesh(getGZ2ScaleBand(), (i % 2 === 0) ? mBronzL : mBronze);
    band.position.set(0, Z2_TORSO_CTR + (0.052 - i * 0.040) * HEX_R, 0.004 * HEX_R);
    band.name = 'kh-scale-band-' + i;
    group.add(band);
  }

  // nogi: bose uda, sandaly
  z2BuildLeg(group,  Z2_HIP_X,  0.56,  0.32, mSkin, mSkin, mLeath, HIP_Y, 'kh', 'left');
  z2BuildLeg(group, -Z2_HIP_X, -0.50, -0.18, mSkin, mSkin, mLeath, HIP_Y, 'kh', 'right');

  // KHEPRESH CIEMNIEJSZY: bania ku tylowi + zlota opaska + ureusz
  const khep = new THREE.Mesh(getGZ2Khep(), mBlueD);
  khep.rotation.x = -0.10;
  khep.position.set(0, Z2_HEAD_CTR + 0.034 * HEX_R, -0.006 * HEX_R);
  khep.name = 'kh-khepresh-crown';
  group.add(khep);
  const band = new THREE.Mesh(getGZ2KhBand(), mGold);
  band.position.set(0, Z2_HEAD_CTR + 0.016 * HEX_R, 0);
  band.name = 'kh-khepresh-band';
  group.add(band);
  const uraeus = new THREE.Mesh(getGZ2Uraeus(), mGold);
  uraeus.position.set(0, Z2_HEAD_CTR + 0.075 * HEX_R, 0.060 * HEX_R);
  uraeus.name = 'kh-khepresh-uraeus';
  group.add(uraeus);

  // PRAWE (-X) RAMIE + ZELAZNY KHOPESH z zamachu (konwencja p4-melee)
  const armR = z2BuildArm(group, -Z2_SHLD_X, THU, THF, mSkin, mSkin, mLeath, Z2_SHLD_Y, 'kh', 'right');
  const kh = new THREE.Group();
  kh.position.copy(armR.wrist);
  kh.rotation.x = Math.PI - THF;                    // lokalny +Y = os przedramienia
  kh.rotation.y = KH_ROLL;                          // hak wychodzi z plaszczyzny YZ
  const straight = new THREE.Mesh(getGZ2KhStr(), mSteel);
  straight.position.set(0, 0.072 * HEX_R, 0);
  straight.name = 'kh-khopesh-straight';
  kh.add(straight);
  let Py = 0.120 * HEX_R, Pz = 0;
  for (let i = 0; i < 3; i++) {                     // sierpowy hak — 3 segmenty
    const a = [0.40, 0.95, 1.55][i]!;
    const seg = new THREE.Mesh(getGZ2KhSeg(), mSteel);
    seg.rotation.x = a;
    const dy = Math.cos(a) * 0.062 * HEX_R, dz = Math.sin(a) * 0.062 * HEX_R;
    seg.position.set(0, Py + dy * 0.5, Pz + dz * 0.5);
    seg.name = 'kh-khopesh-seg-' + i;
    kh.add(seg);
    Py += dy; Pz += dz;
  }
  const guard = new THREE.Mesh(getGZ2Guard(), mGold);
  guard.position.set(0, 0.026 * HEX_R, 0);
  guard.name = 'kh-khopesh-guard';
  kh.add(guard);
  group.add(kh);

  // LEWE (+X) RAMIE + TARCZA PROSTOKATNA zaokraglona u gory (2 stopnie)
  const armL = z2BuildArm(group, Z2_SHLD_X, 0.48, 1.06, mSkin, mSkin, null, Z2_SHLD_Y, 'kh', 'left');
  const sh = new THREE.Group();
  const plate = new THREE.Mesh(getGZ2RectPl(), mOwner);
  plate.name = 'kh-shield-face';
  sh.add(plate);
  const ptop = new THREE.Mesh(getGZ2RectTop(), mOwner);
  ptop.position.set(0, 0.112 * HEX_R, 0);
  ptop.name = 'kh-shield-face-top';
  sh.add(ptop);
  const pcap = new THREE.Mesh(getGZ2RectCap(), mOwner);
  pcap.position.set(0, 0.140 * HEX_R, 0);
  pcap.name = 'kh-shield-face-cap';
  sh.add(pcap);
  const boss = new THREE.Mesh(getGZ2ShBoss(), mBronzL);
  boss.position.set(0, 0.012 * HEX_R, 0.014 * HEX_R);
  boss.name = 'kh-shield-boss';
  sh.add(boss);
  z2MountShield(group, sh, armL.wrist);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  group.userData['anchors'] = {
    hexR: HEX_R,
    headTopY: Z2_HEAD_TOP, headCtrY: Z2_HEAD_CTR,
    torsoTopY: Z2_TORSO_TOP, torsoBotY: Z2_TORSO_BOT,
    torsoHalfW: Z2_TORSO_W * 0.5, torsoHalfD: Z2_TORSO_D * 0.5,
    hipY: HIP_Y, shoulderY: Z2_SHLD_Y, shoulderX: Z2_SHLD_X,
    grip: armR.wrist.toArray(),
    weaponAxis: armR.axis.toArray(),
    weaponKind: 'khopesh-sickle',
    khopeshRoll: KH_ROLL,
    shieldKind: 'rect-rounded',
    shieldFaceW: 0.148 * HEX_R, shieldFaceH: 0.190 * HEX_R,
  };
  return group;
}

// ===========================================================================
// ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA (Thorakites)
// ===========================================================================
// units.json: Epoka=Zelazo, Kultura/Nacja=Grecja, Tech=Hutnictwo zelaza,
// Typ=Spearman, Atak 7 / Obrona 9 (najwyzsza z czworki) / Pancerz 6,
// Health 42 (najwyzsze z czworki), Bonus vs Mount 50%, Nazwa EN „Thorakites",
// Uwagi: „Zelazna piechota defensywna; tarcza (thureos) + wlocznia (dory);
// profil obronny hoplitow poznego okresu".
//
// K1. CO ZNACZY TA NAZWA — I SPROSTOWANIE WCZESNIEJSZEGO KOMENTARZA W TYM
//     PLIKU. Gr. thorakites (l.mn. thorakitai) znaczy doslownie „ten w
//     pancerzu", od thorax = PANCERZ, KIRYS. Naglowek tego pliku twierdzil
//     wczesniej, ze „thorax = stad nazwa" w znaczeniu KOLCZUGI — to bylo
//     mylace: thorax nie znaczy kolczugi, znaczy pancerz dowolnego rodzaju
//     (brazowy dzwonowy, linothorax, kolczy). Poprawione w naglowku.
//     Kolczuga jest tu wyborem uzasadnionym osobno — patrz K3.
// K2. TWARDY ANACHRONIZM, NAZWANY WPROST: THORAKITAI TO FORMACJA
//     HELLENISTYCZNA, NIE JEDNOSTKA EPOKI ZELAZA. Thorakitai pojawiaja sie
//     w zrodlach dopiero w III-II w. p.n.e.: Polibiusz wymienia ich w armii
//     Zwiazku Achajskiego i w opisie parady w Dafne, gdzie 5000 zolnierzy
//     maszeruje uzbrojonych w ten sposob. Sa to opancerzeni thureophoroi —
//     a THUREOS, ich tarcza, zostal przejety od Celtow dopiero po najezdzie
//     galackim na Grecje i Azje Mniejsza w latach 280-275 p.n.e. (samo slowo
//     thureos = „drzwi", od ksztaltu). Kolczuga jest wynalazkiem celtyckim
//     mniej wiecej z tego samego stulecia. Cala ta jednostka jest wiec o
//     ok. 300-900 lat pozniejsza niz rama „1200-600 p.n.e.", ktora daje jej
//     gra. DECYZJA (§10): jednostka zostaje, bo units.json jest lista wymagan
//     wlasciciela i lezy poza allowlista; anachronizm jest NAZWANY, nie
//     zamieciony — jak khepresz i zelazny khopesz wyzej. Rama, w ktorej model
//     jest wewnetrznie spojny, to zatem HELLENIZM, nie archaiczna Grecja,
//     i tak nalezy go czytac.
// K3. KOLCZUGA (thorax halysidotos) — wybor spojny z K2, nie z rama gry.
//     Przedstawienia hellenistyczne pokazuja wlocznikow z thureosem i w
//     kolczudze; sam Polibiusz odroznia thorakitai zarowno od falangi
//     sarissoforow, jak i od lekkozbrojnych — czyli po PANCERZU. Matowa stal
//     (Z2_STEEL_DK) zamiast poleru odroznia ja od zelaznej klingi.
//     Alternatywa — linothorax — zostala odrzucona swiadomie: linothorax nosi
//     juz Falangita z T3 (kremowy tors), a dwa greckie modele w jednym
//     pancerzu przestalyby sie odrozniac.
// K4. THUREOS Z PIONOWYM KREGOSLUPEM I UMBEM-BECZULKA. To jest doslowny opis
//     tarczy celtyckiej przejetej przez Greków: owalna deska, pionowe
//     zebro (spina) wzmacniajace srodek i podluzne, beczulkowate umbo kryjace
//     chwyt poprzeczny. Ksztalt owalny jest jedynym takim w tej czworce i
//     jest podstawowa cecha odrozniajaca Thorakitesa od okraglej aspis
//     Falangity (T3) — patrz B3 w naglowku pliku, pomiar 0,578.
// K5. HELM ATTYCKI OTWARTY — I DLACZEGO TO BYL BLAD DO NAPRAWY. Helm attycki
//     (dzwon, diadem czolowy, policzki na zawiasach, TWARZ ODKRYTA) jest
//     w hellenizmie forma standardowa i jest przeciwienstwem zamknietego
//     helmu KORYNCKIEGO, ktory nosi Falangita. Zmierzono, ze przed audytem
//     dzwon pochlanial oczy (przenikanie 0,0195 na oko) i figurka renderowala
//     sie z twarza zakryta — czyli ta jedyna cecha odrozniajaca nie dzialala.
//     Naprawione (naglowek pliku, A3): dzwon siedzi teraz NA glowie.
// K6. GRZEBIEN KARMAZYNOWY. Barwiony na czerwono wlos konski jest w swiecie
//     greckim znacznikiem powszechnym (od panoplii z Argos, ostatnia cwierc
//     VIII w. p.n.e., po hellenizm) i jest tu wspolny z Falangita — celowo:
//     to znacznik KULTURY, ktory ma laczyc obie greckie jednostki, podczas
//     gdy tarcza, helm i pancerz maja je rozdzielac.
// K7. DORY, NIE SARISSA. Wlocznia jednoreczna 0,70*HEX_R przy sarissie
//     Falangity 0,74 i przy hascie Triariego 0,92. Thorakitai walczyli
//     w szyku luznym i poza nim (K2), wiec bron jednoreczna z tarcza w drugiej
//     rece jest poprawna; sarissa wymagalaby chwytu oburacz. Sauroter
//     (brazowe okucie tylca) jest elementem greckiej wloczni poswiadczonym
//     archeologicznie i sluzy tez jako przeciwwaga — jest tu pokazany.
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
  // AUDYT T6 — patrz (A3) w naglowku pliku. Dzwon helmu attyckiego siedzial tak
  // nisko (HEAD_CTR + 0,042), ze POCHLANIAL OCZY: zmierzone przenikanie oko/dzwon
  // 0,0195 na kazdym oku, a z kamery gry twarz byla zakryta w calosci — czyli
  // model renderowal helm ZAMKNIETY, mimo ze komentarz i dobor helmu (attycki,
  // otwarty) mowily co innego. To jest ta sama, jedyna cecha, ktora ma odrozniac
  // Thorakitesa od Falangi w helmie korynckim (T3, zamkniety, bez oczu).
  const HELM_Y = Z2_HEAD_CTR + 0.068 * HEX_R;       // dzwon SIEDZI na glowie, nie polyka jej

  // korpus: KOLCZUGA (tors) + lniany chiton pod spodem (spodnica) + fartuch kolczy
  const mSkin = z2Core(group, mat, mMail, true, 'th');
  const skirt = new THREE.Mesh(getGZ2Skirt(), mLinen);
  skirt.position.set(0, Z2_TORSO_BOT - 0.018 * HEX_R, 0);
  skirt.name = 'th-skirt';
  group.add(skirt);
  const mailHem = new THREE.Mesh(getGZ2Hem(), mMail);   // dol kolczugi
  mailHem.position.set(0, Z2_TORSO_BOT - 0.008 * HEX_R, 0);
  mailHem.name = 'th-mail-hem';
  group.add(mailHem);
  const belt = new THREE.Mesh(getGZ2Belt(), mLeath);
  belt.position.set(0, 0.252 * HEX_R, 0);
  belt.name = 'th-belt';
  group.add(belt);

  // nogi: gole (chiton) + sandaly
  z2BuildLeg(group,  Z2_HIP_X,  0.55,  0.30, mLinen, mSkin, mLeath, HIP_Y, 'th', 'left');
  z2BuildLeg(group, -Z2_HIP_X, -0.50, -0.16, mLinen, mSkin, mLeath, HIP_Y, 'th', 'right');

  // HELM ATTYCKI OTWARTY: dzwon + diadem czolowy + policzki (twarz widoczna)
  const bowl = new THREE.Mesh(getGZ2AttBowl(), mBronze);
  bowl.position.set(0, HELM_Y, 0);
  bowl.name = 'th-helmet-bowl';
  group.add(bowl);
  const brow = new THREE.Mesh(getGZ2AttBrow(), mGoldT);
  brow.position.set(0, Z2_HEAD_CTR + 0.036 * HEX_R, 0);
  brow.name = 'th-helmet-brow';
  group.add(brow);
  for (const sx of [-1, 1]) {
    const ck = new THREE.Mesh(getGZ2Cheek(), mBronze);
    ck.position.set(sx * (Z2_HEAD_S * 0.5 + 0.004 * HEX_R), Z2_HEAD_CTR - 0.014 * HEX_R, 0.014 * HEX_R);
    ck.name = 'th-helmet-cheek-' + (sx < 0 ? 'right' : 'left');
    group.add(ck);
  }
  const crB = new THREE.Mesh(getGZ2CrestBase(), mBronzL);   // grzebien attycki
  crB.position.set(0, Z2_HEAD_TOP + 0.062 * HEX_R, -0.002 * HEX_R);
  crB.name = 'th-crest-base';
  group.add(crB);
  const crH = new THREE.Mesh(getGZ2CrestHair(), mCrimson);
  crH.rotation.x = 0.10;
  crH.position.set(0, Z2_HEAD_TOP + 0.104 * HEX_R, -0.006 * HEX_R);
  crH.name = 'th-crest-hair';
  group.add(crH);

  // PRAWE (-X) RAMIE (rekaw kolczy) + DORY w pchnieciu NADRECZNYM:
  // lokiec uniesiony za barkiem, piesc na wysokosci ucha, drzewce NA OSI
  // przod-lekko-DOL (grot celuje ponad krawedzia thureos), sauroter za glowa
  const armR = z2BuildArm(group, -Z2_SHLD_X, -2.02, 2.36, mMail, mSkin, mLeath, Z2_SHLD_Y, 'th', 'right');
  const DEC = 0.22;                                  // deklinacja grotu (w dol)
  const doryAxis = new THREE.Vector3(0, -Math.sin(DEC), Math.cos(DEC));
  const grip = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  const shaft = new THREE.Mesh(getGZ2Dory(), mWood);
  shaft.rotation.x = Math.PI / 2 + DEC;
  shaft.position.copy(grip.clone().addScaledVector(doryAxis, 0.070 * HEX_R));
  shaft.name = 'th-spear-shaft';
  group.add(shaft);
  const dtip = new THREE.Mesh(getGZ2HastaTip(), mSteel);
  dtip.rotation.x = Math.PI / 2 + DEC;
  dtip.rotation.y = Math.PI / 4;
  dtip.position.copy(grip.clone().addScaledVector(doryAxis, (0.070 + 0.350 + 0.028) * HEX_R));
  dtip.name = 'th-spear-tip';
  group.add(dtip);
  const saur = new THREE.Mesh(getGZ2Finial(), mBronzL);   // sauroter — okucie tylca
  saur.position.copy(grip.clone().addScaledVector(doryAxis, -(0.280 + 0.010) * HEX_R));
  saur.name = 'th-spear-butt';
  group.add(saur);

  // LEWE (+X) RAMIE + THUREOS: skorupa + pole gracza + KREGOSLUP + umbo-beczulka
  const armL = z2BuildArm(group, Z2_SHLD_X, 0.52, 1.08, mMail, mSkin, null, Z2_SHLD_Y, 'th', 'left');
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.028 * HEX_R,
    armL.wrist.y + 0.040 * HEX_R,
    armL.wrist.z + 0.048 * HEX_R,
  );
  sh.rotation.y = -0.20;
  const shell = new THREE.Mesh(getGZ2ThurShell(), mLeath);
  shell.name = 'th-shield-shell';
  sh.add(shell);
  const face = new THREE.Mesh(getGZ2ThurFace(), mOwner);
  face.position.set(0, 0, 0.014 * HEX_R);
  face.name = 'th-shield-face';
  sh.add(face);
  const spine = new THREE.Mesh(getGZ2Spine(), mWood);   // pionowy kregoslup
  spine.position.set(0, 0, 0.021 * HEX_R);
  spine.name = 'th-shield-spine';
  sh.add(spine);
  const umbo = new THREE.Mesh(getGZ2SpineUmb(), mSteel); // umbo-beczulka na kregoslupie
  umbo.position.set(0, 0, 0.030 * HEX_R);
  umbo.name = 'th-shield-umbo';
  sh.add(umbo);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  group.userData['anchors'] = {
    hexR: HEX_R,
    headTopY: Z2_HEAD_TOP, headCtrY: Z2_HEAD_CTR,
    torsoTopY: Z2_TORSO_TOP, torsoBotY: Z2_TORSO_BOT,
    torsoHalfW: Z2_TORSO_W * 0.5, torsoHalfD: Z2_TORSO_D * 0.5,
    hipY: HIP_Y, shoulderY: Z2_SHLD_Y, shoulderX: Z2_SHLD_X,
    helmetY: HELM_Y,
    grip: grip.toArray(),
    weaponAxis: doryAxis.toArray(),
    weaponKind: 'spear-dory',
    shieldKind: 'thureos-oval',
    shieldFaceW: 2 * 0.077 * HEX_R, shieldFaceH: 2 * 0.151 * HEX_R,
  };
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
