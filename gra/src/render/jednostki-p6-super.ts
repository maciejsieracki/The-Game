/**
 * jednostki-p6-super.ts — PACZKA 6/8: SUPER-JEDNOSTKI (braz)
 * (seria render-jednostki; wzorzec anatomii: hastati-falangita.ts KOREKTA v2,
 *  konwencja SUPERA: jednostki-p2-inka.ts — choragiew-znacznik NA PLECACH)
 * ---------------------------------------------------------------------------
 * ZAWARTOSC PLIKU (stan 2026-08-06) — DWA buildery, oba UZYWANE:
 *   buildSuperGreece(ownerColor)  Hieros Lochos  — units.ts, buildSuperUnit, case 'grecja'
 *   buildSuperRome(ownerColor)    Evocati        — units.ts, buildSuperUnit, case 'rzym'
 *                                                  (Triari maja wlasny model)
 * Wywolania sa po NAZWIE FUNKCJI (import w units.ts) — celowo bez numerow
 * linii: poprzedni naglowek podawal „units.ts:6162" itp., co rozjechalo sie
 * z kodem i wprowadzalo w blad.
 *
 * USUNIETE 2026-08-06 (R-BRAZ-SUPER-DISPATCH-Q1=A, sprzatanie po recenzji):
 * buildSuperChina / buildSuperZulu / buildSuperEgypt / buildSuperSumer wraz
 * z ich geometriami-singletonami. Po przekierowaniu dispatchu na modele
 * NAZWANE (buildHuBenWei / buildUThulwana / buildMedjay /
 * buildSumerianRoyalGuard w units.ts) nie mialy juz ANI JEDNEGO wywolania —
 * zostawaly wylacznie jako martwy kod. Odpowiednik inkaski (buildSuperInca)
 * zniknal analogicznie z jednostki-p2-inka.ts.
 *
 * Interfejs i konwencje BEZ ZMIAN:
 *   - figurka PRZODEM do +Z, stopy na y = 0, uklad prawoskretny => LEWA = +X, PRAWA = -X,
 *   - TARCZA na LEWYM (+X) przedramieniu, BRON w PRAWEJ (-X) dloni NA OSI przedramienia,
 *   - POZY ATAKU (wykrok, biodra obnizone), NAKRYCIE GLOWY na kazdej glowie,
 *   - kolor gracza JAK STARE NIOSA (Grecja pole tarczy; Rzym blazon na scutum)
 *     + CHORAGIEW NA PLECACH (pole+flaga kolor gracza+zloty finial) = znacznik
 *     SUPER kazdej elity,
 *   - group.userData['mats'] i ['perTokenGeos'] jak w units.ts, geometrie = singletony.
 *
 * CHARAKTERY (rozroznialnosc elit) — stan po audycie T7:
 *   GRECJA Hieros Lochos: koryncki helm ZSUNIETY NA CIEMIE (twarz odslonieta)
 *     z WYSOKIM PURPUROWYM grzebieniem, muskularny kirys z brazu ze ZLOCONYMI
 *     plytami, purpurowy krotki plaszcz, aspis ze ZLOCONYM SZEROKIM PIERSCIENIEM
 *     i UKOSNA MACZUGA HERAKLESA (godlo Teb), dory nadrecznie, choragiew SUPER
 *     po stronie TARCZOWEJ (+X).
 *   RZYM Evocati: weteran w KOLCZUDZE (lorica hamata) na czerwonej tunice —
 *     POSREBRZANY montefortino z PODWOJNYM pioropuszem, FALERY (3 krazki
 *     odznaczen), owalne scutum ze zlotymi SKRZYDLAMI i WIENCEM, gladius
 *     w pchnieciu, choragiew SUPER po stronie bronnej (-X).
 * Budzet: <= ~480 tri (+20 elita); zob. liczby przy builderach.
 *
 * ===========================================================================
 * AUDYT R-ZELAZO-AUDYT-POZOSTALE-Q1-T7 (Opus 5) — CO ZMIERZONO I CO NAPRAWIONO
 * ===========================================================================
 * Zakres: buildSuperGreece (Hieros Lochos) i buildSuperRome (Evocati). Metoda
 * jak T1-T6: pomiar w zywym Three.js/Chromium PRZED ocena, nie odczyt zrodla.
 *
 * WARUNEK MOZLIWOSCI AUDYTU. Przed T7 ten plik NIE NAZYWAL ANI JEDNEGO mesh
 * (zmierzone: 0/36 dla Hieros Lochos, 0/36 dla Evocatiego) i nie mial
 * `userData.anchors` — dokladnie ta sama przyczyna, dla ktorej z1-mezopotamia
 * (T5) i z2-srodziemnomorze (T6) nie byly sprawdzone przez cala wczesniejsza
 * serie. Kazdy mesh dostal teraz `name` z prefiksem jednostki (`hl-`, `ev-`),
 * a kazda grupa `userData['anchors']`.
 *
 * ZNALEZIONE POMIAREM I NAPRAWIONE:
 *   A1. HIEROS LOCHOS — DRZEWCE DORY W RAMIENIU. Ten builder jest kopia
 *       buildFalangita z hastati-falangita.ts (te same katy -2.55/1.32, ta sama
 *       os wloczni, ten sam chwyt 0.130). T3 tej serii NAPRAWIL tam kat
 *       przedramienia 1.32 -> 1.85, bo przy 1.32 drzewce idzie wzdluz
 *       przedramienia prosto w lokiec i dalej w ramie. Poprawka NIGDY nie
 *       dotarla do kopii. Zmierzone (SAT dwoch prostopadloscianow — wynik
 *       dokladny, nie przyblizenie): drzewce zanurzone w RAMIENIU na 0.0253,
 *       przy 0.0000 dla Falangity po T3 i 0.0000 dla Thorakitesa po T6.
 *       PO naprawie 0.0000, a chwyt trafil DOKLADNIE w wartosci rodziny:
 *       piesc/drzewce 0.0335, przedramie/drzewce 0.0218 (Falangita: 0.0335
 *       i 0.0218 — te same liczby co w naglowku jednostki-z2-srodziemne.ts).
 *   A2. HIEROS LOCHOS — DRZEWCE PRZEBIJALO PLACHTE WLASNEJ CHORAGWI. Choragiew
 *       SUPER stala po stronie -X, czyli po tej samej co reka z wloznia niesiona
 *       NAD BARKIEM w tyl. Zmierzone: drzewce x plachta = 0.0141. Choragiew
 *       przeniesiona na strone tarczowa (+X); po zmianie 0.0000. Rzymskie supery
 *       tego pliku zostaja przy -X, bo trzymaja gladius przy biodrze, nie
 *       drzewce nad barkiem — asymetria jest ZAMIERZONA i wynika z pozy.
 *   A3. EVOCATI — TWARZ NIEWIDOCZNA Z KAMERY GRY. Dzwon montefortino siedzial
 *       na HEAD_CTR + 0.030, wiec jego dolny rant (promien 0.093, czyli 1,45x
 *       polszerokosc glowy) wisial PONIZEJ linii oczu i z jedynej kamery gry
 *       (`camera.ts`: azymut 0, elewacja 52 stopnie) zaslanial cala twarz.
 *       Model w ogole nie mial oczu (s6Core wolane z eyes=false), wiec pod
 *       otwartym helmem byl gladki blok skory. Naprawione dwoma zmianami:
 *       oczy WLACZONE i dzwon podniesiony na HEAD_CTR + 0.068 — dokladnie
 *       relacja przyjeta w naprawie T6 dla Thorakitesa (rant na HEAD_CTR +
 *       0.022). Zmierzone pikselami z kamery gry (test glebi GPU, czesc
 *       pokolorowana na wyroznik): PRZED 0 pikseli twarzy, PO 26; punkt
 *       odniesienia — Thorakites po naprawie T6 ma 14.
 *   A4. HIEROS LOCHOS vs FALANGA — DWIE JEDNOSTKI, JEDNA FIGURKA. Miara
 *       odroznialnosci z kamery gry (metoda T5/T6: udzial pikseli roznych
 *       pokryciem albo barwa o >=40/255 w sumie obrysow pary). PRZED audytem
 *       para grecka dawala 0.390 — najnizsza z calego zestawu, przy 0.558
 *       osiagnietym w analogicznej naprawie T6 (Gwardia Tyrenska vs Tyrski
 *       miecznik) i 0.590-0.850 dla kazdej innej pary. Elita i jednostka
 *       liniowa tej samej kultury byly z kamery gry ta sama figurka.
 *       UWAGA METODOLOGICZNA: naprawa A1 sama w sobie POGORSZYLA te miare do
 *       0.371, bo zrownala poze obu figurek — to jest zmierzone, nie
 *       domniemane, i dlatego A4 nie dalo sie zalatwic „przy okazji".
 *       Naprawione trzema zmianami, kazda uzasadniona rzeczowo (patrz K3-K5):
 *       helm ZSUNIETY NA CIEMIE z odslonieta twarza (ikonografia grecka),
 *       grzebien PURPUROWY zamiast karmazynowego jak u liniowego hoplity,
 *       SZEROKI ZLOCONY PIERSCIEN na polu aspidy plus UKOSNA maczuga Heraklesa
 *       zamiast waskiego lnianego pierscienia Falangity. Po naprawie 0.589.
 *   ODRZUCONE PO POMIARZE (zapisane, zeby nikt nie probowal drugi raz):
 *       tarcza BEOCKA (kolo z dwoma bocznymi wcieciami — godlo Beocji z monet)
 *       jako godlo Teb. Zaimplementowana i zmierzona: miara odroznialnosci
 *       rosla do 0.607, ale RENDER byl gorszy niz aspis. Powod jest w kamerze:
 *       aspis to walec (dysk o grubosci 0.034 z rantem), ktory przy elewacji
 *       52 stopni nadal czyta sie jako tarcza; plaski wachlarz trojkatow
 *       skraca sie w pionie do 62% i czyta sie jako kaluza. Wciecia boczne
 *       gina w tym skroceniu. Metryka rosla, obraz siadal — wiec zmiana
 *       zostala wycofana, a nie zachowana dla wyniku liczbowego.
 *
 * ZMIERZONE I POTWIERDZONE JAKO POPRAWNE (bez zmian geometrii):
 *   B1. ZERO przenikania broni przez cialo w obu modelach (pelny SAT na
 *       wszystkich parach nazwanych mesh, przed i po naprawach). Jedyne
 *       zachodzenia bryl to warstwy zamierzone i CHWYT.
 *   B2. Zaden z modeli NIE ma bledu z T2 (tarcza tylem do kamery). Iloczyn
 *       skalarny normalnej pola gracza z kierunkiem patrzenia: Evocati -0.601,
 *       Hieros Lochos -0.603 — obie zwrocone DO kamery.
 *   B3. Widocznosc broni z kamery gry (rzut na plaszczyzne obrazu / dlugosc
 *       wlasna): gladius Evocatiego 0.830, dory Hieros Lochos 0.895 przy
 *       0.895 dory Falangity (T3) i 0.903 dory Thorakitesa (T6).
 *   B4. Proporcje po naprawach: Evocati h=0.7471 maxR=0.4060 minY=0.0000
 *       mesh=39; Hieros Lochos h=0.8097 maxR=0.6122 minY=0.0000 mesh=40.
 *       Twardy limit heksu to maxR <= 0.866*HEX_R — oba z zapasem. Wzrost
 *       wysokosci Hieros Lochos (0.7597 -> 0.8097) to skutek podniesienia
 *       grzebienia razem ze zsunietym helmem, zmierzony, nie przypadkowy.
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
const S6_SKIN      = 0xe0ac69;   // skora jasna (Grecja / Rzym)
const S6_STEEL     = 0xc2cad2;   // stal polerowana
const S6_SILVER    = 0xd7dce2;   // posrebrzany helm Evocati
const S6_BRONZE    = 0xcf9234;   // braz
const S6_BRONZE_LT = 0xd0a050;   // jasny braz
const S6_GOLD      = 0xe0b53a;   // zloto elit (akcent SUPER)
const S6_WOOD      = 0x7a5c3a;   // drewno
const S6_WOOD_DK   = 0x5f4020;   // ciemne drewno (drzewce choragwi)
const S6_LEATHER   = 0x6b4a28;   // skora rzemienie
const S6_ROMAN_RED = 0xa42a22;   // tunika rzymska
const S6_MAIL      = 0x8e99a6;   // lorica hamata Evocatiego (kolczuga, matowa stal)
const S6_CRIMSON   = 0xa01f2e;   // karmazyn (grzebien liniowego hoplity — patrz K4)
const S6_PURPLE    = 0x7a2c96;   // purpura (plaszcz i grzebien Hieros Lochos, piora Evocati)
const S6_EYE       = 0x1a1008;   // oczy
const S6_DARK      = 0x20180f;   // szczelina helmu

// Podniesienie helmu montefortino ponad linie oczu — patrz sekcja AUDYT T7, A3.
// Wartosc odziedziczona z naprawy T6 (Thorakites, HELM_Y = HEAD_CTR + 0.068):
// dolny rant dzwonu ma siedziec na HEAD_CTR + 0.022, nie ponizej linii oczu.
const S6_MONT_Y_OFF = 0.068 * HEX_R;

// Odchylenie korynckiego helmu zsunietego na ciemie (Hieros Lochos) — patrz K4.
const S6_COR_TIP = 0.34;

// Ukos maczugi Heraklesa na polu aspidy (rad od pionu) — patrz K3.
const S6_CLUB_TILT = 1.05;

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
let gS6AspisBand:THREE.RingGeometry | null = null;
// MACZUGA HERAKLESA (episema Teb) — trzy czlony o rosnacej szerokosci; patrz K3.
let gS6ClubLo:   THREE.BoxGeometry | null = null;
let gS6ClubMid:  THREE.BoxGeometry | null = null;
let gS6ClubHi:   THREE.BoxGeometry | null = null;
let gS6DoryShaft:THREE.BoxGeometry | null = null;
let gS6DoryTip:  THREE.ConeGeometry | null = null;
let gS6Sauroter: THREE.BoxGeometry | null = null;
// Rzym
let gS6MontBowl: THREE.CylinderGeometry | null = null;
let gS6Cheek:    THREE.BoxGeometry | null = null;
let gS6PlumeRom: THREE.BoxGeometry | null = null;
let gS6Phalera:  THREE.BoxGeometry | null = null;
let gS6ScutShell:THREE.BufferGeometry | null = null;
let gS6ScutFace: THREE.BufferGeometry | null = null;
let gS6Umbo:     THREE.BoxGeometry | null = null;
let gS6WingRom:  THREE.BoxGeometry | null = null;
let gS6Wreath:   THREE.CylinderGeometry | null = null;
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
/** SZEROKI ZLOCONY PIERSCIEN na polu aspidy — patrz K5 (elita z kasy miasta). */
function getGS6AspisBand():THREE.RingGeometry { return (gS6AspisBand ||= new THREE.RingGeometry(0.094 * HEX_R, 0.126 * HEX_R, 14, 1)); }
function getGS6ClubLo():   THREE.BoxGeometry { return (gS6ClubLo   ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.074 * HEX_R, 0.014 * HEX_R)); }
function getGS6ClubMid():  THREE.BoxGeometry { return (gS6ClubMid  ||= new THREE.BoxGeometry(0.070 * HEX_R, 0.072 * HEX_R, 0.014 * HEX_R)); }
function getGS6ClubHi():   THREE.BoxGeometry { return (gS6ClubHi   ||= new THREE.BoxGeometry(0.102 * HEX_R, 0.066 * HEX_R, 0.014 * HEX_R)); }
function getGS6DoryShaft():THREE.BoxGeometry { return (gS6DoryShaft||= new THREE.BoxGeometry(0.021 * HEX_R, 0.740 * HEX_R, 0.021 * HEX_R)); }
function getGS6DoryTip():  THREE.ConeGeometry{ return (gS6DoryTip  ||= new THREE.ConeGeometry(0.020 * HEX_R, 0.062 * HEX_R, 4)); }
function getGS6Sauroter(): THREE.BoxGeometry { return (gS6Sauroter ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.055 * HEX_R, 0.022 * HEX_R)); }
function getGS6MontBowl(): THREE.CylinderGeometry { return (gS6MontBowl ||= new THREE.CylinderGeometry(0.050 * HEX_R, 0.093 * HEX_R, 0.092 * HEX_R, 8, 1)); }
function getGS6Cheek():    THREE.BoxGeometry { return (gS6Cheek    ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.052 * HEX_R, 0.044 * HEX_R)); }
function getGS6PlumeRom(): THREE.BoxGeometry { return (gS6PlumeRom ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.118 * HEX_R, 0.013 * HEX_R)); }
function getGS6Phalera():  THREE.BoxGeometry { return (gS6Phalera  ||= new THREE.BoxGeometry(0.038 * HEX_R, 0.038 * HEX_R, 0.012 * HEX_R)); }
function getGS6Umbo():     THREE.BoxGeometry { return (gS6Umbo     ||= new THREE.BoxGeometry(0.050 * HEX_R, 0.050 * HEX_R, 0.024 * HEX_R)); }
function getGS6WingRom():  THREE.BoxGeometry { return (gS6WingRom  ||= new THREE.BoxGeometry(0.058 * HEX_R, 0.020 * HEX_R, 0.008 * HEX_R)); }
function getGS6Wreath():   THREE.CylinderGeometry { return (gS6Wreath ||= new THREE.CylinderGeometry(0.056 * HEX_R, 0.056 * HEX_R, 0.012 * HEX_R, 8, 1, true)); }
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
  P: THREE.Vector3, theta: number, len: number, nm: string = '',
): THREE.Vector3 {
  const dir = s6DirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  if (nm !== '') mesh.name = nm;
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}
function s6BuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  mFoot: THREE.MeshStandardMaterial, hipY: number = S6_HIP_Y,
  pf: string = '', side: string = '',
): void {
  const nm = (part: string): string => (pf === '' ? '' : pf + '-leg-' + side + '-' + part);
  let P = new THREE.Vector3(sx, hipY, 0);
  P = s6Seg(group, getGS6Thigh(), mThigh, P, thU, S6_THIGH_L, nm('thigh'));
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = s6Seg(group, getGS6Shin(), mShin, P, thL, S6_SHIN_L, nm('shin'));
  const foot = new THREE.Mesh(getGS6Foot(), mFoot);
  foot.position.set(sx, 0.013 * HEX_R, P.z + 0.016 * HEX_R);
  if (pf !== '') foot.name = nm('foot');
  group.add(foot);
}
function s6BuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
  pf: string = '', side: string = '',
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  const nm = (part: string): string => (pf === '' ? '' : pf + '-arm-' + side + '-' + part);
  let P = new THREE.Vector3(sx, S6_SHLD_Y, 0);
  P = s6Seg(group, getGS6UpArm(), mUp, P, thU, S6_UPARM_L, nm('upper'));
  P.y += 0.010 * HEX_R;
  const wrist = s6Seg(group, getGS6Forearm(), mFore, P, thF, S6_FOREARM_L, nm('fore'));
  if (mFist !== null) {
    const fist = new THREE.Mesh(getGS6Fist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(s6DirDown(thF), 0.014 * HEX_R));
    if (pf !== '') fist.name = nm('fist');
    group.add(fist);
  }
  return { wrist, axis: s6DirDown(thF) };
}
/** Korpus: tors + szyja + glowa (+ opcjonalnie oczy przy odkrytej twarzy). */
function s6Core(
  group: THREE.Group, mat: MatFactory, mTorso: THREE.MeshStandardMaterial,
  skinColor: number, eyes: boolean, pf: string = '',
): THREE.MeshStandardMaterial {
  const nm = (part: string): string => (pf === '' ? '' : pf + '-' + part);
  const torso = new THREE.Mesh(getGS6Torso(), mTorso);
  torso.position.set(0, S6_TORSO_CTR, 0);
  if (pf !== '') torso.name = nm('torso');
  group.add(torso);
  const mSkin = mat(skinColor, 0.05, 0.80);
  const neck = new THREE.Mesh(getGS6Neck(), mSkin);
  neck.position.set(0, S6_TORSO_TOP + S6_NECK_H * 0.5, 0);
  if (pf !== '') neck.name = nm('neck');
  group.add(neck);
  const head = new THREE.Mesh(getGS6Head(), mSkin);
  head.position.set(0, S6_HEAD_CTR, 0);
  if (pf !== '') head.name = nm('head');
  group.add(head);
  if (eyes) {
    const mEye = mat(S6_EYE, 0.02, 0.95);
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(getGS6Eye(), mEye);
      eye.position.set(sx * 0.028 * HEX_R, S6_HEAD_CTR + 0.008 * HEX_R, S6_HEAD_S * 0.5 + 0.004 * HEX_R);
      if (pf !== '') eye.name = nm('eye-' + (sx < 0 ? 'right' : 'left'));
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
  pf: string = '', sx: number = -1,
): void {
  const nm = (part: string): string => (pf === '' ? '' : pf + '-banner-' + part);
  const pole = new THREE.Mesh(getGS6Pole(), mPole);
  pole.rotation.x = -0.14;
  pole.position.set(sx * 0.052 * HEX_R, 0.340 * HEX_R, -0.086 * HEX_R);
  if (pf !== '') pole.name = nm('pole');
  group.add(pole);
  const flag = new THREE.Mesh(getGS6Flag(), mFlag);
  flag.rotation.x = -0.14;
  flag.position.set(sx * 0.100 * HEX_R, 0.548 * HEX_R, -0.115 * HEX_R);
  if (pf !== '') flag.name = nm('flag');
  group.add(flag);
  const fin = new THREE.Mesh(getGS6Finial(), mGold);
  fin.position.set(sx * 0.052 * HEX_R, 0.600 * HEX_R, -0.122 * HEX_R);
  if (pf !== '') fin.name = nm('finial');
  group.add(fin);
}

// ===========================================================================
// ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA (Hieros Lochos / Swiety Zastep)
// ===========================================================================
// units.json: Epoka=Zelazo, Kultura/Nacja=Grecja, Typ=Swordsman, Klasa=Super,
// Atak 8 / Uderzenie 8 / Obrona 10 / Pancerz 6, Health 170, Bonus vs Spearman
// +15%, Bonus vs Mount +50%, Uwagi: „hoplici elitarni — wlocznia (dory) +
// aspis (decyzja Macieja 2026-07-23)". Bron w modelu MUSI byc dory — i jest.
//
// K1. KIM BYLI. Hieros Lochos (gr. „Swiety Zastep") to 300-osobowy oddzial
//     zawodowej piechoty Teb, zlozony ze 150 par zwiazanych ze soba mezczyzn.
//     Zalozony okolo 378 p.n.e. przez Gorgidasa, utrzymywany i cwiczony NA
//     KOSZT MIASTA na Kadmei — tebanskim akropolu (Plutarch, „Pelopidas" 18).
//     Pelopidas przeksztalcil go z rozproszonej po szeregach elity w zwarta
//     piesc uderzeniowa. Rozstrzygnal bitwe pod LEUKTRAMI 371 p.n.e., gdzie
//     Teby po raz pierwszy pokonaly Sparte w otwartym polu (Plutarch,
//     „Pelopidas" 23; Ksenofont, „Hellenika" VI.4). Wybity CO DO JEDNEGO pod
//     CHAIRONEJA 338 p.n.e. przez Filipa II i mlodego Aleksandra (Plutarch,
//     „Pelopidas" 18; „Aleksander" 9). Zrodla dodatkowe: Ateneusz XIII.561f,
//     Polyainos „Strategemata" II.5.1. Nad grobem stoi Lew z Chaironei; przy
//     wykopaliskach w 1880 r. znaleziono pod nim 254 szkielety.
// K2. DLACZEGO EPOKA ZELAZA W TEJ GRZE. Historycznie to IV wiek p.n.e., czyli
//     Grecja klasyczna, a nie „epoka zelaza" w sensie archeologicznym. To jest
//     ABSTRAKCJA GRY (units.json: „Dostepna w epokach: Braz;Zelazo"), nie blad
//     modelu — nazwana tu wprost, zeby nikt jej pozniej nie „poprawial".
// K3. GODLO NA TARCZY — MACZUGA HERAKLESA, NIE THETA. Do audytu T7 aspis
//     nosila motyw THETA (pierscien + pozioma belka). Godlem panstwowym Teb
//     na tarczach byla MACZUGA HERAKLESA — Herakles urodzil sie w Tebach i byl
//     bohaterem opiekunczym miasta; godlo to jest poswiadczone od okolo
//     394 p.n.e., obok sfinksa. Litera theta NIE jest poswiadczona jako
//     tebanski episema (theta na glosach sadowych to skrot od „thanatos",
//     zupelnie inny kontekst). Maczuga lezy UKOSNIE, nie pionowo: kamera gry
//     patrzy z elewacji 52 stopni, wiec pionowa listwa skraca sie na ekranie
//     do 62% wlasnej dlugosci i trzy czlony zlewaja sie w jedna plame —
//     zmierzone, nie domniemane.
// K4. HELM — POSWIADCZONY KOMPROMIS, NAZWANY WPROST. Helm koryncki (pelna
//     maska na twarz) do czasow Leuktr byl juz ARCHAICZNY: od polowy V wieku
//     p.n.e. ustepowal typom otwartym — chalkidyjskiemu, trackiemu i pilosowi,
//     bo zamykal pole widzenia i sluch, a IV-wieczna wojna wymagala orientacji
//     w polu. Model ZOSTAJE przy korynckim, bo to jedyny nosnik greckiego
//     charakteru czytelny z kamery gry, ale nosi go tak, jak pokazuje go
//     ikonografia grecka poza zwarciem: ZSUNIETY NA CIEMIE, twarz odslonieta
//     (S6_COR_TIP). To rozwiazuje trzy rzeczy naraz — sylwetka glowy przestaje
//     byc kopia liniowego Falangity (A4), twarz staje sie widoczna (60 pikseli
//     z kamery gry przy 14 u Thorakitesa po naprawie T6), a anachronizm jest
//     zlagodzony poza sam wybor typu helmu.
// K5. PURPURA I ZLOCENIA — SWIADOMA STYLIZACJA GRY, NIE ZRODLO. Plutarch nie
//     opisuje uzbrojenia Zastepu ani jednym zdaniem; historycznie ci ludzie
//     wygladali jak inni hoplici, a rozniolo ich wyszkolenie, nie sprzet. Gra
//     wymaga jednak, zeby gracz odroznil elite od jednostki liniowej z jednego
//     spojrzenia — miara odroznialnosci przed audytem wynosila 0.390 przy
//     0.590-0.850 dla kazdej innej pary. Podstawa stylizacji jest fakt
//     ZRODLOWY: Zastep byl utrzymywany z kasy miasta (Plutarch, „Pelopidas"
//     18), czyli wyposazany panstwowo, a nie z wlasnej kieszeni jak zwykly
//     hoplita. Stad purpurowy grzebien (purpura tyryjska = najdrozszy barwnik
//     swiata antycznego) zamiast karmazynowego, zlocone plyty kirysu,
//     nagolenniki, pas i SZEROKI ZLOCONY PIERSCIEN na polu aspidy. Liniowy
//     Falangita ma w tym samym miejscu WASKI pierscien w kolorze lnu.
// K6. TARCZA BEOCKA — ROZWAZONA I ODRZUCONA. Tak zwana tarcza beocka (kolo
//     z dwoma bocznymi wcieciami) jest najmocniejszym znakiem Beocji, ale:
//     nazwa jest nowozytnym konstruktem, wziela sie z czestego wystepowania
//     tego ksztaltu na monetach beockich, i NIE ZACHOWAL SIE ani jeden
//     egzemplarz — byc moze byla wylacznie konwencja artystyczna/heraldyczna.
//     Zaimplementowana i zmierzona w T7: podnosila odroznialnosc do 0.607,
//     ale przy elewacji 52 stopni plaskie pole traci wciecia i czyta sie gorzej
//     niz walcowa aspis. Wycofana — patrz „ODRZUCONE PO POMIARZE" w naglowku.
// ===========================================================================
// ---------------------------------------------------------------------------
// HIEROS LOCHOS / SWIETY ZASTEP (Grecja, SUPER braz) — ~488 tri, POZA ATAKU
// Elitarny hoplita: koryncki helm ZSUNIETY NA CIEMIE (twarz odslonieta) z WYSOKIM
// PURPUROWYM grzebieniem i przednim lokiem, muskularny kirys z brazu ze ZLOCONYMI
// plytami (piers + miesnie brzucha), krotki PURPUROWY plaszcz, aspis (pole =
// KOLOR GRACZA) ze SZEROKIM ZLOCONYM PIERSCIENIEM i UKOSNA MACZUGA HERAKLESA,
// dory nadrecznie (grot w przod), zlocone nagolenniki, choragiew na plecach
// po stronie TARCZOWEJ (+X). Uzasadnienia: sekcja ZGODNOSC HISTORYCZNA wyzej.
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

  // korpus: tors = kirys z brazu; TWARZ ODSLONIETA — helm zsuniety na ciemie (K4)
  const mSkin = s6Core(group, mat, mBronze, S6_SKIN, true, 'hl');
  // muskularny kirys: plyta piersiowa + linia miesni brzucha (ZLOCONE — patrz K5)
  const pec = new THREE.Mesh(getGS6PecPlate(), mGold);
  pec.position.set(0, S6_TORSO_CTR + 0.048 * HEX_R, S6_TORSO_D * 0.5 + 0.008 * HEX_R);
  pec.name = 'hl-cuirass-pec';
  group.add(pec);
  const abs = new THREE.Mesh(getGS6AbsPlate(), mGold);
  abs.position.set(0, S6_TORSO_CTR - 0.024 * HEX_R, S6_TORSO_D * 0.5 + 0.008 * HEX_R);
  abs.name = 'hl-cuirass-abs';
  group.add(abs);
  // krotki purpurowy plaszcz elity za plecami
  const cloak = new THREE.Mesh(getGS6Cloak(), mPurple);
  cloak.rotation.x = 0.16;
  cloak.position.set(0, S6_TORSO_CTR + 0.012 * HEX_R, -S6_TORSO_D * 0.5 - 0.016 * HEX_R);
  cloak.name = 'hl-cloak';
  group.add(cloak);
  // pterugesy skorzane + pas
  const skirt = new THREE.Mesh(getGS6Skirt(), mLeath);
  skirt.position.set(0, S6_TORSO_BOT - 0.018 * HEX_R, 0);
  skirt.name = 'hl-pteruges';
  group.add(skirt);
  const belt = new THREE.Mesh(getGS6Belt(), mGold);
  belt.position.set(0, 0.252 * HEX_R, 0);
  belt.name = 'hl-belt';
  group.add(belt);

  // nogi w wypadzie + ZLOCONE nagolenniki na obu goleniach (K5)
  s6BuildLeg(group,  S6_HIP_X,  0.55,  0.30, mBronze, mSkin, mLeath, HIP_Y, 'hl', 'left');
  s6BuildLeg(group, -S6_HIP_X, -0.50, -0.16, mBronze, mSkin, mLeath, HIP_Y, 'hl', 'right');
  const grF = new THREE.Mesh(getGS6Greave(), mGold);
  grF.rotation.x = Math.PI - 0.30;
  grF.position.set(S6_HIP_X, 0.072 * HEX_R, 0.070 * HEX_R);
  grF.name = 'hl-greave-left';
  group.add(grF);
  const grB = new THREE.Mesh(getGS6Greave(), mGold);
  grB.rotation.x = Math.PI + 0.16;
  grB.position.set(-S6_HIP_X, 0.068 * HEX_R, -0.052 * HEX_R);
  grB.name = 'hl-greave-right';
  group.add(grB);

  // HELM KORYNCKI ZSUNIETY NA CIEMIE + WYSOKI grzebien (baza + wlosie + lok).
  // NAPRAWA T7 (A7): dzwon siedzial DOKLADNIE tam, gdzie u liniowego Falangity
  // (HEAD_CTR + 0.014, ta sama geometria, ten sam braz, ta sama szczelina), bo
  // ten builder jest kopia tamtego. Z kamery gry obie jednostki czytaly sie
  // jako jedna figurka — zmierzone 0.371 udzialu roznych pikseli przy 0.558
  // uzyskanym w analogicznej naprawie T6 i 0.590-0.850 dla kazdej innej pary.
  // Helm PODNIESIONY NA CIEMIE i odchylony do tylu (S6_COR_TIP) — poza z ikonografii
  // greckiej: hoplita poza zwarciem nosi koryncki helm zsuniety na czubek glowy,
  // twarz odslonieta (K4). Zmienia sylwetke glowy, odslania twarz i NIE wymaga
  // podmiany typu helmu na taki, ktorego Teby by nie uzywaly.
  const dome = new THREE.Mesh(getGS6CorDome(), mBronze);
  dome.rotation.x = -S6_COR_TIP;
  dome.position.set(0, S6_HEAD_CTR + 0.072 * HEX_R, -0.016 * HEX_R);
  dome.name = 'hl-helmet-dome';
  group.add(dome);
  const slit = new THREE.Mesh(getGS6Slit(), mDark);   // szczelina — teraz nad czolem
  slit.rotation.x = -S6_COR_TIP;
  slit.position.set(0, S6_HEAD_CTR + 0.062 * HEX_R, 0.052 * HEX_R);
  slit.name = 'hl-helmet-slit';
  group.add(slit);
  const crB = new THREE.Mesh(getGS6CrestBase(), mGold);
  crB.position.set(0, S6_HEAD_TOP + 0.078 * HEX_R, -0.024 * HEX_R);
  crB.name = 'hl-crest-base';
  group.add(crB);
  const crT = new THREE.Mesh(getGS6CrestTall(), mPurple);
  crT.rotation.x = 0.10;
  crT.position.set(0, S6_HEAD_TOP + 0.146 * HEX_R, -0.030 * HEX_R);
  crT.name = 'hl-crest-hair';
  group.add(crT);
  const crC = new THREE.Mesh(getGS6CrestCurl(), mPurple);
  crC.rotation.x = 0.42;
  crC.position.set(0, S6_HEAD_TOP + 0.178 * HEX_R, 0.068 * HEX_R);
  crC.name = 'hl-crest-curl';
  group.add(crC);

  // PRAWE (-X) RAMIE + DORY NADRECZNIE (lokiec nad barkiem, grot w przod-dol)
  //
  // NAPRAWA T7 (A1). Kat przedramienia byl 1.32 — DOKLADNIE ta sama wartosc,
  // ktora T3 wycofal w blizniaczym buildFalangita (hastati-falangita.ts) po
  // pomiarze, bo drzewce dory idzie wtedy wzdluz przedramienia PROSTO W RAMIE.
  // Ten plik jest kopia tamtego (te same katy -2.55/1.32, ta sama os wloczni,
  // ten sam chwyt 0.130), wiec odziedziczyl blad, a poprawka T3 nigdy tu nie
  // dotarla. Zmierzone PRZED (SAT dwoch prostopadloscianow, wynik dokladny):
  // drzewce zanurzone w RAMIENIU na 0.0253 przy wartosci 0.0000 dla Falangity
  // po naprawie T3 i 0.0000 dla Thorakitesa (T6). PO: 0.0000. Chwyt (piesc
  // 0.0335, przedramie 0.0298) zostaje — to jest chwyt, nie kolizja.
  const armR = s6BuildArm(group, -S6_SHLD_X, -2.55, 1.85, mBronze, mSkin, mLeath, 'hl', 'right');
  const spearTh = Math.PI * 0.5 + 0.20;
  const spearAxis = new THREE.Vector3(0, -Math.sin(0.20), Math.cos(0.20));
  const grip = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  const shaft = new THREE.Mesh(getGS6DoryShaft(), mWood);
  shaft.rotation.x = spearTh;
  shaft.position.copy(grip.clone().addScaledVector(spearAxis, 0.130 * HEX_R));
  shaft.name = 'hl-dory-shaft';
  group.add(shaft);
  const dtip = new THREE.Mesh(getGS6DoryTip(), mSteel);
  dtip.rotation.x = spearTh;
  dtip.rotation.y = Math.PI / 4;
  dtip.position.copy(grip.clone().addScaledVector(spearAxis, (0.130 + 0.370 + 0.028) * HEX_R));
  dtip.name = 'hl-dory-tip';
  group.add(dtip);
  const sauro = new THREE.Mesh(getGS6Sauroter(), mBronzL);
  sauro.rotation.x = spearTh;
  sauro.position.copy(grip.clone().addScaledVector(spearAxis, (0.130 - 0.370 - 0.024) * HEX_R));
  sauro.name = 'hl-sauroter';
  group.add(sauro);

  // LEWE (+X) RAMIE + ASPIS z MACZUGA HERAKLESA przed korpusem (K3)
  const armL = s6BuildArm(group, S6_SHLD_X, 0.52, 1.05, mBronze, mSkin, null, 'hl', 'left');
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.055 * HEX_R,
    armL.wrist.y + 0.065 * HEX_R,
    armL.wrist.z + 0.052 * HEX_R,
  );
  sh.rotation.y = -0.20;
  const face = new THREE.Mesh(getGS6AspisFace(), mOwner);   // pole = KOLOR GRACZA
  face.rotation.x = Math.PI / 2;
  face.name = 'hl-shield-face';
  sh.add(face);
  const rim = new THREE.Mesh(getGS6AspisRim(), mGold);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0, -0.004 * HEX_R);
  rim.name = 'hl-shield-rim';
  sh.add(rim);
  // SZEROKI ZLOCONY PIERSCIEN na polu — liniowy hoplita (Falangita) ma w tym
  // miejscu WASKI pierscien w kolorze lnu; to jest druga po helmie rzecz, ktora
  // rozdziela te dwie figurki z kamery gry (K5).
  const band = new THREE.Mesh(getGS6AspisBand(), mGold);
  band.position.set(0, 0, 0.021 * HEX_R);
  band.name = 'hl-shield-band';
  sh.add(band);
  // EPISEMA: MACZUGA HERAKLESA — godlo Teb (K3). Trzon zwezany ku dolowi,
  // glowica u gory, dwa sekowate guzy z boku. Pion tarczy = os Y grupy `sh`.
  // Maczuga lezy UKOSNIE (S6_CLUB_TILT), nie pionowo: kamera gry patrzy na
  // tarcze z elewacji 52 stopni, wiec pionowa listwa skraca sie na ekranie
  // do 62% i trzy czlony zlewaja sie w jedna plame. Ukos zachowuje czytelny
  // ksztalt (zwezanie ku raczce) przy tej samej dlugosci wlasnej.
  const clubGeos = [getGS6ClubLo(), getGS6ClubMid(), getGS6ClubHi()];
  const clubD = [-0.068, -0.004, 0.056];
  for (let i = 0; i < 3; i++) {
    const seg = new THREE.Mesh(clubGeos[i]!, mGold);
    seg.rotation.z = S6_CLUB_TILT;
    seg.position.set(
      -clubD[i]! * Math.sin(S6_CLUB_TILT) * HEX_R,
      clubD[i]! * Math.cos(S6_CLUB_TILT) * HEX_R,
      0.026 * HEX_R,
    );
    seg.name = 'hl-episema-club-' + i;
    sh.add(seg);
  }
  group.add(sh);

  // CHORAGIEW SUPER — po stronie TARCZOWEJ (+X). Naprawa T7 (A2): przy stronie
  // -X drzewce dory (ktore biegnie w tyl-w gore nad prawym barkiem) przebijalo
  // plachte choragwi — zmierzone 0.0141 przed zmiana, 0.0000 po. Rzymskie
  // supery tego pliku maja gladius, nie drzewce nad barkiem, wiec zostaja
  // przy -X; asymetria jest ZAMIERZONA i wynika z pozy, nie z niedopatrzenia.
  s6Banner(group, mWoodD, mOwner, mGold, 'hl', +1);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  group.userData['anchors'] = {
    hexR: HEX_R,
    headTopY: S6_HEAD_TOP, headCtrY: S6_HEAD_CTR,
    torsoTopY: S6_TORSO_TOP, torsoBotY: S6_TORSO_BOT,
    torsoHalfW: S6_TORSO_W * 0.5, torsoHalfD: S6_TORSO_D * 0.5,
    hipY: HIP_Y, shoulderY: S6_SHLD_Y, shoulderX: S6_SHLD_X,
    grip: grip.toArray(),
    weaponAxis: spearAxis.toArray(),
    weaponKind: 'spear-dory',
    shieldKind: 'round-aspis',
    helmetKind: 'corinthian-closed',
    faceOpen: false,
    bannerSide: +1,
  };
  return group;
}
// ===========================================================================
// ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA (Evocati)
// ===========================================================================
// units.json: Epoka=Zelazo, Kultura=Rzymianie, Typ=Swordsman, Klasa=Super,
// Atak 9 / Uderzenie 8 / Obrona 9 / Pancerz 6, Uwagi: „Super Brazu; weterani
// evocati; elitarna piechota Rzymu".
//
// K1. KIM BYLI. Evocatus to zolnierz, ktory odsluzyl swoje, dostal honorowe
//     zwolnienie i DOBROWOLNIE zaciagnal sie ponownie na zaproszenie wodza.
//     Instytucja pozno-republikanska: od Sulli, systemowo u Cezara. Pompejusz
//     mial pod Farsalos 2000 evocati, Oktawian powolal 3000 przeciw Antoniuszowi
//     (Appian, „Wojny domowe" III.40; Kasjusz Dion XLV.12). Byli lepiej platni
//     i zwolnieni z prac obozowych — sypania walow i budowy drog (Dion XLV.12).
//     Za pryncypatu doszla osobna kategoria evocati Augusti, wywodzaca sie
//     z pretorianow i noszaca laske jak centurionowie.
// K2. DATOWANIE ZESTAWU. Caly komplet jest spojny z okolo 100-40 p.n.e.:
//     helm typu MONTEFORTINO (od IV wieku p.n.e. do I wieku n.e., najczestszy
//     helm republiki), OWALNE SCUTUM (jedyny zachowany egzemplarz to tarcza
//     z Fajum, I wiek p.n.e.; taka tarcza jest tez na pomniku Emiliusza Paulusa
//     w Delfach, polowa II wieku p.n.e.) i GLADIUS HISPANIENSIS. Prostokatne
//     scutum i helm imperial-gallic to I wiek n.e. — dla evocatiego bylyby
//     anachronizmem, wiec ich tu NIE MA.
// K3. KOLCZUGA ZAMIAST PANCERZA PIERSIOWEGO — I DLACZEGO WLASNIE ONA. Polibiusz
//     VI.23: szeregowy piechur nosi brazowa plyte „na piedz kwadratowa" przed
//     sercem (pectorale), ale ZAMIAST NIEJ kolczuge (lorica hamata) nosi ten,
//     czyj majatek oceniono POWYZEJ 10 000 drachm. Evocatus — wysluzony
//     weteran z zoldem, donatywami i lupem kilku kampanii — jest dokladnie tym
//     przypadkiem. To jest podstawa zmiany T7: przed audytem Evocati mial
//     czerwony tors tuniki, czyli DOKLADNIE ten sam blok koloru co Hastati,
//     i obie figurki dawaly z kamery gry 0.491 odroznialnosci (po zmianie
//     0.603). Roznica pectorale/kolczuga jest wiec jednoczesnie zrodlowa
//     i rozwiazuje zmierzony problem czytelnosci.
// K4. FALERY — ANACHRONIZM POGRANICZNY, NAZWANY WPROST. Falery to najczestsze
//     zachowane rzymskie odznaczenie wojskowe (dona militaria), ale KLASYCZNY
//     rzad krazkow na uprzezy piersiowej jest praktyka PRYNCYPATU (wzorzec:
//     stela centuriona Marka Celiusza, 9 n.e.), a nie schylku republiki. Dla
//     evocatiego to wyprzedzenie o pokolenie-dwa. Zostawione swiadomie: jest
//     to jedyny czytelny z kamery gry znak „ten czlowiek ma za soba wojny",
//     a jednostka jest w grze SUPEREM, nie szeregowym.
// K5. DWA PIORA ZAMIAST TRZECH — SWIADOMA ROZNICA WOBEC HASTATIEGO. Polibiusz
//     VI.23.12 daje szeregowemu piechurowi wieniec TRZECH pionowych pior,
//     purpurowych albo czarnych, wysokosci mniej wiecej lokcia. Hastati
//     (hastati-opus5.ts) i Triari (jednostki-z2-srodziemne.ts) maja w tej grze
//     po trzy. Evocati ma DWA — to jest odstepstwo od Polibiusza wprowadzone
//     po to, zeby trzy rzymskie figurki nie mialy identycznej korony glowy.
//     Nazwane, nie przemilczane.
// K6. ROZJAZD W DANYCH (nie w modelu). units.json daje Evocatiemu Epoka=Zelazo,
//     ale „Dostepna w epokach: Braz" i Uwagi „Super Brazu". To jest niespojnosc
//     danych, a nie modelu; `units.json` lezy poza allowlista tematu T7, wiec
//     zostala tylko odnotowana.
// ===========================================================================
// ---------------------------------------------------------------------------
// EVOCATI (Rzym, SUPER braz) — ~490 tri, POZA ATAKU
// Weteran po wzorcu Hastatiego, ale w KOLCZUDZE (lorica hamata) na czerwonej
// tunice — patrz K3. POSREBRZANY montefortino z PODWOJNYM purpurowym
// pioropuszem i zlotymi policzkami, TWARZ ODSLONIETA (oczy), FALERY (3 krazki
// odznaczen na piersi), OWALNY wypukly SCUTUM (pole = KOLOR GRACZA jak
// Hastati) ze zlotymi SKRZYDLAMI, WIENCEM i umbo, gladius w pchnieciu,
// choragiew na plecach. Uzasadnienia: sekcja ZGODNOSC HISTORYCZNA wyzej.
// ---------------------------------------------------------------------------
export function buildSuperRome(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mGold   = mat(S6_GOLD,      0.58, 0.32);
  const mSilver = mat(S6_SILVER,    0.62, 0.28);
  const mSteel  = mat(S6_STEEL,     0.55, 0.35);
  const mMail   = mat(S6_MAIL,      0.55, 0.52);
  const mRed    = mat(S6_ROMAN_RED, 0.05, 0.80);
  const mPurple = mat(S6_PURPLE,    0.08, 0.72);
  const mOwner  = mat(ownerColor_,  0.15, 0.65);
  const mLeath  = mat(S6_LEATHER,   0.05, 0.82);
  const mWoodD  = mat(S6_WOOD_DK,   0.05, 0.85);

  const HIP_Y = S6_HIP_Y - 0.012 * HEX_R;   // gleboki wypad jak Hastati

  // korpus: LORICA HAMATA (kolczuga) na czerwonej tunice — patrz K7. Rekawy
  // i rabek tuniki zostaja czerwone, wiec sylwetka nadal czyta sie „rzymsko",
  // ale tors NIE jest juz tym samym czerwonym blokiem co u Hastatiego.
  const mSkin = s6Core(group, mat, mMail, S6_SKIN, true, 'ev');
  const skirt = new THREE.Mesh(getGS6Skirt(), mRed);
  skirt.position.set(0, S6_TORSO_BOT - 0.018 * HEX_R, 0);
  skirt.name = 'ev-tunic-hem';
  group.add(skirt);
  const mailHem = new THREE.Mesh(getGS6Belt(), mMail);     // dolny rant kolczugi
  mailHem.position.set(0, S6_TORSO_BOT + 0.008 * HEX_R, 0);
  mailHem.name = 'ev-mail-hem';
  group.add(mailHem);
  const belt = new THREE.Mesh(getGS6Belt(), mLeath);
  belt.position.set(0, 0.252 * HEX_R, 0);
  belt.name = 'ev-belt';
  group.add(belt);
  // FALERY: trzy krazki odznaczen (zloto/srebro/zloto) na piersi — patrz K8
  let fi = 0;
  for (const dx of [-0.052, 0.0, 0.052]) {
    const ph = new THREE.Mesh(getGS6Phalera(), (fi % 2 === 0) ? mGold : mSilver);
    ph.rotation.z = Math.PI / 4;
    ph.position.set(dx * HEX_R, S6_TORSO_CTR + 0.034 * HEX_R, S6_TORSO_D * 0.5 + 0.010 * HEX_R);
    ph.name = 'ev-phalera-' + fi;
    fi++;
    group.add(ph);
  }

  // nogi: gleboki wypad
  s6BuildLeg(group,  S6_HIP_X,  0.58,  0.34, mRed, mSkin, mLeath, HIP_Y, 'ev', 'left');
  s6BuildLeg(group, -S6_HIP_X, -0.52, -0.20, mRed, mSkin, mLeath, HIP_Y, 'ev', 'right');

  // POSREBRZANY MONTEFORTINO: miska + zlote policzki + PODWOJNY pioropusz.
  // NAPRAWA T7 (A3): dzwon siedzial na HEAD_CTR + 0.030, czyli jego dolny rant
  // (promien 0.093) wisial NIZEJ niz linia oczu i z kamery gry (elewacja 52°)
  // zaslanial cala twarz. Przeniesiony na HEAD_CTR + 0.068 — dokladnie relacja
  // przyjeta w naprawie T6 dla Thorakitesa (rant na HEAD_CTR + 0.022).
  const bowl = new THREE.Mesh(getGS6MontBowl(), mSilver);
  bowl.position.set(0, S6_HEAD_CTR + S6_MONT_Y_OFF, 0);
  bowl.name = 'ev-helmet-bowl';
  group.add(bowl);
  for (const sx of [-1, 1]) {
    const ck = new THREE.Mesh(getGS6Cheek(), mGold);
    ck.position.set(sx * (S6_HEAD_S * 0.5 + 0.004 * HEX_R), S6_HEAD_CTR + 0.000 * HEX_R, 0.018 * HEX_R);
    ck.name = 'ev-helmet-cheek-' + (sx < 0 ? 'right' : 'left');
    group.add(ck);
  }
  for (const sx of [-1, 1]) {
    const pl = new THREE.Mesh(getGS6PlumeRom(), mPurple);
    pl.rotation.z = -sx * 0.12;
    pl.position.set(sx * 0.026 * HEX_R, S6_HEAD_TOP + 0.086 * HEX_R, 0);
    pl.name = 'ev-plume-' + (sx < 0 ? 'right' : 'left');
    group.add(pl);
  }

  // PRAWE (-X) RAMIE + GLADIUS w pchnieciu na osi przedramienia
  const armR = s6BuildArm(group, -S6_SHLD_X, 0.95, 1.50, mRed, mSkin, mLeath, 'ev', 'right');
  const blade = new THREE.Mesh(getGS6Blade(), mSteel);
  blade.rotation.x = Math.PI - 1.50;
  blade.position.copy(armR.wrist.clone().addScaledVector(armR.axis, 0.098 * HEX_R));
  blade.name = 'ev-sword-blade';
  group.add(blade);
  const btip = new THREE.Mesh(getGS6BladeTip(), mSteel);
  btip.rotation.x = Math.PI - 1.50;
  btip.rotation.y = Math.PI / 4;
  btip.position.copy(armR.wrist.clone().addScaledVector(armR.axis, 0.1875 * HEX_R));
  btip.name = 'ev-sword-tip';
  group.add(btip);
  const guard = new THREE.Mesh(getGS6Guard(), mGold);
  guard.rotation.x = Math.PI - 1.50;
  guard.position.copy(armR.wrist.clone().addScaledVector(armR.axis, 0.030 * HEX_R));
  guard.name = 'ev-sword-guard';
  group.add(guard);

  // LEWE (+X) RAMIE + OWALNY SCUTUM: pole = KOLOR GRACZA, zloty WIENIEC,
  // SKRZYDLA po bokach wienca i umbo (odznaka weteranow)
  const armL = s6BuildArm(group, S6_SHLD_X, 0.50, 1.10, mRed, mSkin, null, 'ev', 'left');
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.025 * HEX_R,
    armL.wrist.y + 0.034 * HEX_R,
    armL.wrist.z + 0.045 * HEX_R,
  );
  sh.rotation.y = -0.22;
  const shell = new THREE.Mesh(getGS6ScutShell(), mLeath);
  shell.name = 'ev-shield-shell';
  sh.add(shell);
  const face = new THREE.Mesh(getGS6ScutFace(), mOwner);   // pole = KOLOR GRACZA
  face.position.set(0, 0, 0.016 * HEX_R);
  face.name = 'ev-shield-face';
  sh.add(face);
  const wreath = new THREE.Mesh(getGS6Wreath(), mGold);    // wieniec laurowy
  wreath.rotation.x = Math.PI / 2;
  wreath.position.set(0, 0, 0.024 * HEX_R);
  wreath.name = 'ev-shield-wreath';
  sh.add(wreath);
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(getGS6WingRom(), mGold);      // zlote skrzydla
    w.rotation.z = s * 0.45;
    w.position.set(s * 0.062 * HEX_R, 0.052 * HEX_R, 0.020 * HEX_R);
    w.name = 'ev-shield-wing-' + (s < 0 ? 'right' : 'left');
    sh.add(w);
  }
  const umbo = new THREE.Mesh(getGS6Umbo(), mGold);
  umbo.position.set(0, 0, 0.032 * HEX_R);
  umbo.name = 'ev-shield-umbo';
  sh.add(umbo);
  group.add(sh);

  s6Banner(group, mWoodD, mOwner, mGold, 'ev', -1);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  group.userData['anchors'] = {
    hexR: HEX_R,
    headTopY: S6_HEAD_TOP, headCtrY: S6_HEAD_CTR,
    torsoTopY: S6_TORSO_TOP, torsoBotY: S6_TORSO_BOT,
    torsoHalfW: S6_TORSO_W * 0.5, torsoHalfD: S6_TORSO_D * 0.5,
    hipY: HIP_Y, shoulderY: S6_SHLD_Y, shoulderX: S6_SHLD_X,
    grip: armR.wrist.toArray(),
    weaponAxis: armR.axis.toArray(),
    weaponKind: 'sword-gladius',
    shieldKind: 'oval-scutum',
    helmetKind: 'montefortino-open',
    faceOpen: true,
    bannerSide: -1,
  };
  return group;
}
