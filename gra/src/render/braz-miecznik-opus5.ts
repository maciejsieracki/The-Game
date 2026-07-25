/**
 * braz-miecznik-opus5.ts — MIECZNIK BRĄZOWY (Bronze Swordsman), bazowa piechota
 * uderzeniowa EPOKI BRĄZU (ok. 3300–1200 p.n.e.), DOSTĘPNA DLA WSZYSTKICH
 * CYWILIZACJI (nie jednostka specjalna kultury).
 * ---------------------------------------------------------------------------
 * Drop-in:
 *   buildMiecznikBrazOpus5(ownerColor) : THREE.Group
 *   disposeBrazMiecznikOpus5Geometries() : void
 *
 * Konwencje serii (jak braz-lucznik-nubijski-opus5.ts / kamien-bazowe-opus5.ts /
 * jednostki-p4-melee.ts):
 *   - figurka PRZODEM do +Z, stopy na y = 0 grupy,
 *   - układ prawoskrętny: przód = +Z, góra = +Y => LEWA ręka = +X (tarcza),
 *     PRAWA ręka = -X (miecz),
 *   - group.userData['mats'] / ['perTokenGeos'] jak w całej serii,
 *   - geometrie wspólne = singletony MODUŁU (perTokenGeos zawsze puste),
 *   - wyłącznie MeshStandardMaterial,
 *   - BROŃ NA OSI DŁONI (nic nie lewituje): miecz styka się z dłonią, tarcza
 *     z przedramieniem, pochwa (pusta — miecz jest dobyty) z pasem,
 *   - anatomia (proporcje torsu/kończyn) identyczna z rodziną KB_.../MS_.../
 *     NB_... (0.180/0.205/0.100 tors, 0.104/0.096 noga, 0.100/0.092 ręka) —
 *     figurki wymienne 1:1 na mapie.
 *
 * KOLOR GRACZA (slot tintu — jak w Wojowniku epoki Kamienia / Sherden):
 * pole tarczy (skóra barwiona) + pas na biodrach.
 *
 * ===========================================================================
 * ZGODNOŚĆ HISTORYCZNA — DECYZJE I UZASADNIENIA
 * ===========================================================================
 * Rama: jednostka bazowa, dostępna CAŁEJ epoce Brązu (ok. 3300–1200 p.n.e.) i
 * WSZYSTKIM cywilizacjom — musi więc czytać się jako "typowy, doświadczony
 * wojownik z mieczem", nie jako umundurowana gwardia jednej kultury (to rolę
 * pełnią już jednostki specjalne: Sherden, Mykeńczyk, Chopesz — patrz
 * jednostki-p4-melee.ts). Miecz w Epoce Brązu był bronią KOSZTOWNĄ i
 * PRESTIŻOWĄ (odlew brązu wymaga cyny — surowca rzadkiego i importowanego) —
 * to NIE jest uzbrojenie pospolitego rekruta z maczugą, ale NIE jest to też
 * dowódca ani gwardzista: zero oznak rangi, zero pióropuszy, zero klejnotów.
 *
 * M1. MIECZ — TYP KŁUJĄCY ("rapier"), NIE liściasty do cięcia. Uzasadnienie
 *     wyboru: jednostka bazowa obejmuje CAŁĄ rozpiętość epoki (3300–1200
 *     p.n.e.), a miecze liściaste do cięcia (typu Naue II) pojawiają się
 *     dopiero pod sam koniec epoki brązu (ok. 1300–1200 p.n.e.) i są już
 *     przypisane w tej grze jednostce specjalnej (Wojownik mykeński,
 *     jednostki-p4-melee.ts, "miecz naue II"). Wczesne i środkowe miecze
 *     brązowe (typu egejskiego A/B, ok. 1700–1500 p.n.e., oraz ich odpowiedniki
 *     bliskowschodnie) są wąskie, kłujące, o przekroju zbliżonym do rombu —
 *     to WŁAŚCIWY wybór dla jednostki reprezentującej "przeciętnego" miecznika
 *     przez większość epoki, i jednocześnie ODRÓŻNIA go sylwetką od Mykeńczyka
 *     (który ma szerszą, równoległą klingę tnącą). Długość klingi 0.135*HEX_R
 *     + grot 0.036*HEX_R przy figurce ok. 0.60*HEX_R (od stóp do czubka głowy)
 *     odpowiada mieczowi krótkiemu 50–70 cm (bez rękojeści) — WYRAŹNIE krótszy
 *     niż długi miecz sieczny oburącz epoki żelaza (to byłby anachronizm).
 *     Klinga zwęża się STOPNIOWO od nasady do sztychu (profil rombowy, bez
 *     liściastego wybrzuszenia w 1/2 długości) — czytelna różnica przy
 *     kamerze 52° wobec istniejących mieczy w grze.
 * M2. RĘKOJEŚĆ z DREWNA (trzon) + GAŁKA z KOŚCI (nie klejnot) — jak w
 *     instrukcji właściciela. JELEC BRĄZOWY, mały, prosty prostokątny flansz
 *     (NIE rozbudowana krzyżowa garda — takie pojawiają się dopiero w epoce
 *     żelaza); brąz na jelcu to JEDYNE miejsce oprócz klingi, gdzie metal
 *     dotyka dłoni — reszta rękojeści to tania kość/drewno.
 * M3. POCHWA PUSTA na pasie, na lewym biodrze (przy tarczy) — miecz jest
 *     dobyty w dłoni, więc pochwa wisi bez klingi; skórzana, z drewnianym
 *     rdzeniem (typowa konstrukcja: drewno + skóra, okucia proste, bez
 *     brązu — sam brąz jest już "zużyty" na klingę i jelec, więc pochwa
 *     musi być tania). Umieszczona po stronie przeciwnej do miecza w dłoni
 *     (typowy chwyt na krzyż: miecz w prawej, pochwa na lewym biodrze).
 * M4. TARCZA OKRĄGŁA — skóra wołowa napięta na drewnianej ramie, z MAŁYM
 *     brązowym umbem centralnym (jeden z niewielu elementów brązu w całym
 *     modelu — "brąz drogi, ma go być mało i ma wyglądać na cenny"). Kształt
 *     OKRĄGŁY (nie ósemkowy) — celowo, bo tarcza ósemkowa jest już
 *     zarezerwowana dla Wojownika mykeńskiego (jednostki-p4-melee.ts) i jest
 *     regionalnie egejska, a ten Miecznik to jednostka UNIWERSALNA dla
 *     wszystkich cywilizacji.
 * M5. STRÓJ: tunika lniana/wełniana (niebarwiona, jasny len — neutralna,
 *     "ogólna" barwa, żeby nie sugerować jednej konkretnej kultury) + pas
 *     (kolor gracza) + PROSTY NAPIERŚNIK ZE SKÓRY naszyty na tunikę (dopuszczony
 *     wprost w instrukcji) zamiast brązowego kirysu — skórzana zbroja jest
 *     tańsza i bardziej pasuje do "doświadczonego wojownika", nie gwardzisty
 *     w pełnym brązowym pancerzu. Sandały skórzane (nie bose stopy) — status
 *     pośredni: stać go na obuwie i miecz, ale to wciąż szeregowy żołnierz.
 * M6. BRAK HEŁMU BRĄZOWEGO — świadomie ZASTĄPIONY prostą skórzaną czapką bez
 *     okuć. Instrukcja dopuszcza hełm brązowy jako opcję, ale w tej grze
 *     brąz na głowie (misa hełmu) noszą już wszystkie jednostki specjalne
 *     Ludów Morza i Mykeńczyk (jednostki-p4-melee.ts) — zostawienie głowy
 *     BEZ brązu i skupienie jedynego metalu na klindze/jelcu/umbie tarczy
 *     dosłownie realizuje zasadę właściciela "brąz ma go być mało": u tego
 *     żołnierza brąz jest tam, gdzie się bije (broń), nie tam, gdzie się
 *     pokazuje (hełm).
 * M7. BRODA KRÓTKA — doświadczony, dorosły wojownik (nie młody rekrut jak
 *     bezbrody Oszczepnik epoki Kamienia). ZERO oznak rangi: brak pióropusza,
 *     brak grzebienia na czapce, brak klejnotów na rękojeści ani naszyjnika.
 *
 * POZA: GOTOWOŚĆ/GARDA — miecz w prawej (-X) wysunięty do przodu na
 * wysokości pasa (nie uniesiony do cięcia jak Wojownik epoki Kamienia z
 * toporem, nie w pełnym pchnięciu jak Mykeńczyk) — krótka klinga kłująca
 * "czeka" na starcie w garda, tarcza w lewej (+X) wysunięta przed tors,
 * noga od strony tarczy (+X) wysunięta do przodu (tarcza prowadzi, miecz
 * gotowy z tyłu do pchnięcia zza tarczy — typowa taktyka miecza krótkiego).
 *
 * -- ROZRÓŻNIALNOŚĆ (patrz też raport końcowy zadania):
 *   wobec WOJOWNIKA EPOKI KAMIENIA (kamien-bazowe-opus5.ts, buildWojownikOpus5):
 *     tamten ma TOPÓR w mufie z poroża wzniesiony DO CIĘCIA znad barku (broń
 *     obuchowo-sieczna, ruch pionowy z góry), futrzany kaftan, czapę z
 *     niedźwiedziej skóry, tarczę WIELOBOCZNĄ z wikliny. Miecznik brązowy ma
 *     WĄSKI KŁUJĄCY miecz trzymany POZIOMO/NISKO w gardzie (ruch dziabiący
 *     do przodu, nie cios z góry), tunikę lnianą + skórzany napierśnik,
 *     prostą skórzaną czapkę, tarczę OKRĄGŁĄ ze skóry wołowej z brązowym
 *     umbem — sylwetka broni (pionowa masa topora nad barkiem vs. pozioma
 *     wąska kreska miecza na wysokości pasa) jest głównym punktem odróżnienia
 *     z kamery 52°.
 *   wobec WŁÓCZNIKA EPOKI BRĄZU (jednostka dystansowo-zwarta z długim
 *     drzewcem wystającym daleko przed i za dłonią, chwyt oburącz lub
 *     jednoręczny z bronią 2–3× dłuższą niż ramię): Miecznik ma broń KRÓTKĄ,
 *     która ledwie wystaje przed pięść (klinga+grot = 0.171*HEX_R, mniej niż
 *     długość jednego przedramienia) — sylwetka bez charakterystycznego
 *     "wydłużenia" drzewca poza obrys ciała, przez co czyta się jako
 *     zwarta, krępa figura, kontrastująca z wyraźnie wydłużoną bronią
 *     drzewcową Włócznika.
 *
 * Budżet: patrz raport końcowy (liczba mesh / trójkątów / materiałów).
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
const BM_SKIN       = 0xc08a54;   // karnacja (odrębna od KB/MS/NB rodziny)
const BM_SKIN_DK    = 0x9c6c3e;   // cień żuchwy / dłonie / stopy

const BM_TUNIC       = 0xcdb684;   // len/wełna niebarwiona — neutralna, uniwersalna
const BM_TUNIC_DK    = 0xa8925f;   // fałd/cień tuniki

const BM_LEATHER     = 0x6b4a28;   // napierśnik / pas / sandały / pochwa
const BM_LEATHER_DK  = 0x4a331b;
const BM_LEATHER_LT  = 0x8a6a42;   // szelki / okucia skórzane jaśniejsze

const BM_WOOD        = 0x7a5c3a;   // rdzeń pochwy / rama tarczy / trzon rękojeści
const BM_WOOD_DK     = 0x5c452c;

const BM_BONE        = 0xe6ddc2;   // gałka rękojeści (nie klejnot)
const BM_SINEW        = 0xd8cfb4;  // oplot sznurkiem rękojeści

const BM_BRONZE       = 0xcf9234;  // JEDYNY metal: klinga, jelec, umbo tarczy
const BM_BRONZE_LT     = 0xdaa84e;

const BM_HAIR         = 0x3c2a17;  // krótkie włosy / broda
const BM_EYE          = 0x14100c;

const BM_SHIELD_HIDE  = 0x8a6a3e;  // rant/spód tarczy — skóra wołowa niebarwiona

// ── wymiary sylwetki: rodzina KB_*/MS_*/NB_* (spójność figurek na mapie) ────
const BM_HIP_Y      = 0.208 * HEX_R;
const BM_TORSO_W    = 0.180 * HEX_R;
const BM_TORSO_H    = 0.205 * HEX_R;
const BM_TORSO_D    = 0.100 * HEX_R;
const BM_TORSO_BOT  = 0.240 * HEX_R;
const BM_TORSO_CTR  = BM_TORSO_BOT + BM_TORSO_H * 0.5;
const BM_TORSO_TOP  = BM_TORSO_BOT + BM_TORSO_H;
const BM_NECK_H     = 0.028 * HEX_R;
const BM_HEAD_S     = 0.128 * HEX_R;
const BM_HEAD_CTR   = BM_TORSO_TOP + BM_NECK_H + BM_HEAD_S * 0.5;
const BM_HEAD_TOP   = BM_TORSO_TOP + BM_NECK_H + BM_HEAD_S;
const BM_SHLD_X     = BM_TORSO_W * 0.5 + 0.030 * HEX_R;
const BM_SHLD_Y     = BM_TORSO_TOP - 0.024 * HEX_R;
const BM_HIP_X      = 0.052 * HEX_R;

const BM_THIGH_L    = 0.104 * HEX_R;
const BM_SHIN_L     = 0.096 * HEX_R;
const BM_UPARM_L    = 0.100 * HEX_R;
const BM_FOREARM_L  = 0.092 * HEX_R;

// ── geometrie-singletony (lazy) ──────────────────────────────────────────────
let gBMTorso:     THREE.BoxGeometry | null = null;
let gBMCuirass:   THREE.BoxGeometry | null = null;
let gBMStrap:     THREE.BoxGeometry | null = null;
let gBMNeck:      THREE.BoxGeometry | null = null;
let gBMHead:      THREE.BoxGeometry | null = null;
let gBMJaw:       THREE.BoxGeometry | null = null;
let gBMNose:      THREE.BoxGeometry | null = null;
let gBMEar:       THREE.BoxGeometry | null = null;
let gBMEye:       THREE.BoxGeometry | null = null;
let gBMBrow:      THREE.BoxGeometry | null = null;
let gBMBeard:     THREE.BoxGeometry | null = null;
let gBMHairTop:   THREE.BoxGeometry | null = null;
let gBMHairBack:  THREE.BoxGeometry | null = null;
let gBMCap:       THREE.CylinderGeometry | null = null;
let gBMThigh:     THREE.BoxGeometry | null = null;
let gBMShin:      THREE.BoxGeometry | null = null;
let gBMSole:      THREE.BoxGeometry | null = null;
let gBMToes:      THREE.BoxGeometry | null = null;
let gBMAnkStrap:  THREE.BoxGeometry | null = null;
let gBMFootStrap: THREE.BoxGeometry | null = null;
let gBMHeelStrap: THREE.BoxGeometry | null = null;
let gBMShinBind:  THREE.BoxGeometry | null = null;
let gBMUpArm:     THREE.BoxGeometry | null = null;
let gBMForearm:   THREE.BoxGeometry | null = null;
let gBMFist:      THREE.BoxGeometry | null = null;
let gBMDelt:      THREE.BoxGeometry | null = null;
let gBMSkirt:     THREE.BoxGeometry | null = null;
let gBMBelt:      THREE.BoxGeometry | null = null;
let gBMBuckle:    THREE.BoxGeometry | null = null;
let gBMPouch:     THREE.BoxGeometry | null = null;
let gBMApron:     THREE.BoxGeometry | null = null;
let gBMTasset:    THREE.BoxGeometry | null = null;
let gBMSideburn:  THREE.BoxGeometry | null = null;
let gBMLace:      THREE.BoxGeometry | null = null;
let gBMRivet:     THREE.BoxGeometry | null = null;
let gBMBracer:    THREE.BoxGeometry | null = null;
// pochwa
let gBMSheath:    THREE.BoxGeometry | null = null;
let gBMSheathTop: THREE.BoxGeometry | null = null;
let gBMSheathTip: THREE.BoxGeometry | null = null;
let gBMFrog:      THREE.BoxGeometry | null = null;
// miecz
let gBMGrip:      THREE.CylinderGeometry | null = null;
let gBMGripWrap:  THREE.CylinderGeometry | null = null;
let gBMPommel:    THREE.SphereGeometry | null = null;
let gBMGuard:     THREE.BoxGeometry | null = null;
let gBMBlade:     THREE.BufferGeometry | null = null;
let gBMBladeEdge: THREE.BoxGeometry | null = null;
// tarcza
let gBMShField:   THREE.CylinderGeometry | null = null;
let gBMShRim:     THREE.CylinderGeometry | null = null;
let gBMShBoss:    THREE.ConeGeometry | null = null;
let gBMShStitch:  THREE.BoxGeometry | null = null;
let gBMShGrip:    THREE.BoxGeometry | null = null;
let gBMShLoop:    THREE.BoxGeometry | null = null;

function getBMTorso():     THREE.BoxGeometry { return (gBMTorso     ||= new THREE.BoxGeometry(BM_TORSO_W, BM_TORSO_H, BM_TORSO_D)); }
function getBMCuirass():   THREE.BoxGeometry { return (gBMCuirass   ||= new THREE.BoxGeometry(0.150 * HEX_R, 0.132 * HEX_R, 0.022 * HEX_R)); }
function getBMStrap():     THREE.BoxGeometry { return (gBMStrap     ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.118 * HEX_R, 0.014 * HEX_R)); }
function getBMNeck():      THREE.BoxGeometry { return (gBMNeck      ||= new THREE.BoxGeometry(0.042 * HEX_R, BM_NECK_H * 1.6, 0.042 * HEX_R)); }
function getBMHead():      THREE.BoxGeometry { return (gBMHead      ||= new THREE.BoxGeometry(BM_HEAD_S, BM_HEAD_S, BM_HEAD_S)); }
function getBMJaw():       THREE.BoxGeometry { return (gBMJaw       ||= new THREE.BoxGeometry(0.086 * HEX_R, 0.034 * HEX_R, 0.038 * HEX_R)); }
function getBMNose():      THREE.BoxGeometry { return (gBMNose      ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.026 * HEX_R, 0.017 * HEX_R)); }
function getBMEar():       THREE.BoxGeometry { return (gBMEar       ||= new THREE.BoxGeometry(0.010 * HEX_R, 0.032 * HEX_R, 0.022 * HEX_R)); }
function getBMEye():       THREE.BoxGeometry { return (gBMEye       ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.011 * HEX_R, 0.008 * HEX_R)); }
function getBMBrow():      THREE.BoxGeometry { return (gBMBrow      ||= new THREE.BoxGeometry(0.104 * HEX_R, 0.014 * HEX_R, 0.016 * HEX_R)); }
function getBMBeard():     THREE.BoxGeometry { return (gBMBeard     ||= new THREE.BoxGeometry(0.080 * HEX_R, 0.044 * HEX_R, 0.032 * HEX_R)); }
function getBMHairTop():   THREE.BoxGeometry { return (gBMHairTop   ||= new THREE.BoxGeometry(0.126 * HEX_R, 0.028 * HEX_R, 0.126 * HEX_R)); }
function getBMHairBack():  THREE.BoxGeometry { return (gBMHairBack  ||= new THREE.BoxGeometry(0.124 * HEX_R, 0.096 * HEX_R, 0.024 * HEX_R)); }
function getBMCap():       THREE.CylinderGeometry { return (gBMCap  ||= new THREE.CylinderGeometry(0.058 * HEX_R, 0.088 * HEX_R, 0.072 * HEX_R, 10, 1)); }
function getBMThigh():     THREE.BoxGeometry { return (gBMThigh     ||= new THREE.BoxGeometry(0.056 * HEX_R, BM_THIGH_L, 0.060 * HEX_R)); }
function getBMShin():      THREE.BoxGeometry { return (gBMShin      ||= new THREE.BoxGeometry(0.038 * HEX_R, BM_SHIN_L, 0.042 * HEX_R)); }
function getBMSole():      THREE.BoxGeometry { return (gBMSole      ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.016 * HEX_R, 0.084 * HEX_R)); }
function getBMToes():      THREE.BoxGeometry { return (gBMToes      ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.014 * HEX_R, 0.020 * HEX_R)); }
function getBMAnkStrap():  THREE.BoxGeometry { return (gBMAnkStrap  ||= new THREE.BoxGeometry(0.050 * HEX_R, 0.020 * HEX_R, 0.014 * HEX_R)); }
function getBMFootStrap(): THREE.BoxGeometry { return (gBMFootStrap ||= new THREE.BoxGeometry(0.048 * HEX_R, 0.014 * HEX_R, 0.010 * HEX_R)); }
function getBMHeelStrap(): THREE.BoxGeometry { return (gBMHeelStrap ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.024 * HEX_R, 0.012 * HEX_R)); }
function getBMShinBind():  THREE.BoxGeometry { return (gBMShinBind  ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.016 * HEX_R, 0.046 * HEX_R)); }
function getBMUpArm():     THREE.BoxGeometry { return (gBMUpArm     ||= new THREE.BoxGeometry(0.054 * HEX_R, BM_UPARM_L, 0.054 * HEX_R)); }
function getBMForearm():   THREE.BoxGeometry { return (gBMForearm   ||= new THREE.BoxGeometry(0.040 * HEX_R, BM_FOREARM_L, 0.040 * HEX_R)); }
function getBMFist():      THREE.BoxGeometry { return (gBMFist      ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)); }
function getBMDelt():      THREE.BoxGeometry { return (gBMDelt      ||= new THREE.BoxGeometry(0.050 * HEX_R, 0.050 * HEX_R, 0.070 * HEX_R)); }
function getBMSkirt():     THREE.BoxGeometry { return (gBMSkirt     ||= new THREE.BoxGeometry(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)); }
function getBMBelt():      THREE.BoxGeometry { return (gBMBelt      ||= new THREE.BoxGeometry(0.192 * HEX_R, 0.028 * HEX_R, 0.114 * HEX_R)); }
function getBMBuckle():    THREE.BoxGeometry { return (gBMBuckle    ||= new THREE.BoxGeometry(0.028 * HEX_R, 0.024 * HEX_R, 0.014 * HEX_R)); }
function getBMPouch():     THREE.BoxGeometry { return (gBMPouch     ||= new THREE.BoxGeometry(0.040 * HEX_R, 0.046 * HEX_R, 0.026 * HEX_R)); }
function getBMApron():     THREE.BoxGeometry { return (gBMApron     ||= new THREE.BoxGeometry(0.086 * HEX_R, 0.072 * HEX_R, 0.013 * HEX_R)); }
function getBMTasset():    THREE.BoxGeometry { return (gBMTasset    ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.060 * HEX_R, 0.011 * HEX_R)); }
function getBMSideburn():  THREE.BoxGeometry { return (gBMSideburn  ||= new THREE.BoxGeometry(0.013 * HEX_R, 0.040 * HEX_R, 0.018 * HEX_R)); }
function getBMLace():      THREE.BoxGeometry { return (gBMLace      ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.090 * HEX_R, 0.011 * HEX_R)); }
function getBMRivet():     THREE.BoxGeometry { return (gBMRivet     ||= new THREE.BoxGeometry(0.012 * HEX_R, 0.012 * HEX_R, 0.010 * HEX_R)); }
function getBMBracer():    THREE.BoxGeometry { return (gBMBracer    ||= new THREE.BoxGeometry(0.048 * HEX_R, 0.044 * HEX_R, 0.048 * HEX_R)); }
function getBMSheath():    THREE.BoxGeometry { return (gBMSheath    ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.190 * HEX_R, 0.015 * HEX_R)); }
function getBMSheathTop(): THREE.BoxGeometry { return (gBMSheathTop ||= new THREE.BoxGeometry(0.032 * HEX_R, 0.020 * HEX_R, 0.019 * HEX_R)); }
function getBMSheathTip(): THREE.BoxGeometry { return (gBMSheathTip ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.020 * HEX_R, 0.012 * HEX_R)); }
function getBMFrog():      THREE.BoxGeometry { return (gBMFrog      ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.036 * HEX_R, 0.012 * HEX_R)); }
function getBMGrip():      THREE.CylinderGeometry { return (gBMGrip     ||= new THREE.CylinderGeometry(0.013 * HEX_R, 0.015 * HEX_R, 0.062 * HEX_R, 6, 1)); }
function getBMGripWrap():  THREE.CylinderGeometry { return (gBMGripWrap ||= new THREE.CylinderGeometry(0.016 * HEX_R, 0.016 * HEX_R, 0.010 * HEX_R, 6, 1)); }
function getBMPommel():    THREE.SphereGeometry   { return (gBMPommel   ||= new THREE.SphereGeometry(0.017 * HEX_R, 7, 5)); }
function getBMGuard():     THREE.BoxGeometry      { return (gBMGuard    ||= new THREE.BoxGeometry(0.056 * HEX_R, 0.014 * HEX_R, 0.020 * HEX_R)); }
function getBMBladeEdge(): THREE.BoxGeometry      { return (gBMBladeEdge||= new THREE.BoxGeometry(0.006 * HEX_R, 0.140 * HEX_R, 0.030 * HEX_R)); }
function getBMShField():   THREE.CylinderGeometry { return (gBMShField ||= new THREE.CylinderGeometry(0.106 * HEX_R, 0.106 * HEX_R, 0.018 * HEX_R, 12, 1)); }
function getBMShRim():     THREE.CylinderGeometry { return (gBMShRim   ||= new THREE.CylinderGeometry(0.112 * HEX_R, 0.112 * HEX_R, 0.014 * HEX_R, 12, 1, true)); }
function getBMShBoss():    THREE.ConeGeometry     { return (gBMShBoss  ||= new THREE.ConeGeometry(0.026 * HEX_R, 0.030 * HEX_R, 8)); }
function getBMShStitch():  THREE.BoxGeometry      { return (gBMShStitch||= new THREE.BoxGeometry(0.024 * HEX_R, 0.015 * HEX_R, 0.032 * HEX_R)); }
function getBMShGrip():    THREE.BoxGeometry      { return (gBMShGrip  ||= new THREE.BoxGeometry(0.058 * HEX_R, 0.016 * HEX_R, 0.016 * HEX_R)); }
function getBMShLoop():    THREE.BoxGeometry      { return (gBMShLoop  ||= new THREE.BoxGeometry(0.074 * HEX_R, 0.020 * HEX_R, 0.012 * HEX_R)); }

/**
 * Klinga rombowa KŁUJĄCA (rapier): profil BEZ liściastego wybrzuszenia w
 * połowie długości — stopniowe, ciągłe zwężenie od "ramion" tuż nad jelcem
 * do ostrego sztychu. Odróżnia się od klingi Wojownika mykeńskiego
 * (jednostki-p4-melee.ts: prosty prostopadłościan + stożek, klinga sieczna
 * o stałej szerokości), która jest ZNACZNIE szersza. Sekcje: [y, halfW, halfT].
 */
function makeRapierBladeGeo(len: number, wMax: number, tMax: number): THREE.BufferGeometry {
  const sections: [number, number, number][] = ([
    [0.00, 0.62, 0.55], [0.08, 1.00, 0.66], [0.55, 0.60, 0.42],
    [0.84, 0.30, 0.24], [1.00, 0.04, 0.10],
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
    quad([-w0, y0, t0], [w0, y0, t0], [w1, y1, t1], [-w1, y1, t1]);      // przód (+Z)
    quad([w0, y0, -t0], [-w0, y0, -t0], [-w1, y1, -t1], [w1, y1, -t1]);  // tył (-Z)
    quad([w0, y0, t0], [w0, y0, -t0], [w1, y1, -t1], [w1, y1, t1]);      // krawędź +X
    quad([-w0, y0, -t0], [-w0, y0, t0], [-w1, y1, t1], [-w1, y1, -t1]);  // krawędź -X
  }
  const b = sections[0]!;
  quad([-b[1], b[0], -b[2]], [b[1], b[0], -b[2]], [b[1], b[0], b[2]], [-b[1], b[0], b[2]]); // domknięcie nasady
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function getBMBlade(): THREE.BufferGeometry {
  return (gBMBlade ||= makeRapierBladeGeo(0.135 * HEX_R, 0.034 * HEX_R, 0.020 * HEX_R));
}

// ---------------------------------------------------------------------------
// Kinematyka — konwencja identyczna z całą rodziną (theta od pionu w dół,
// +theta = ku przodowi +Z).
// ---------------------------------------------------------------------------
const BM_Y_UP = new THREE.Vector3(0, 1, 0);

function bmDirDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}

function bmSeg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = bmDirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

/** Noga: udo + goleń + sandał (podeszwa + palce odkryte + 2 rzemienie). */
function bmBuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mSkin: THREE.MeshStandardMaterial, mLeath: THREE.MeshStandardMaterial,
  mLeathDk: THREE.MeshStandardMaterial, hipY: number,
): void {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = bmSeg(group, getBMThigh(), mSkin, P, thU, BM_THIGH_L);
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = bmSeg(group, getBMShin(), mSkin, P, thL, BM_SHIN_L);
  const footZ = P.z + 0.014 * HEX_R;
  const sole = new THREE.Mesh(getBMSole(), mLeath);
  sole.position.set(sx, 0.008 * HEX_R, footZ);
  group.add(sole);
  const toes = new THREE.Mesh(getBMToes(), mSkin);
  toes.position.set(sx, 0.007 * HEX_R, footZ + 0.040 * HEX_R);
  group.add(toes);
  const ank = new THREE.Mesh(getBMAnkStrap(), mLeathDk);
  ank.rotation.x = Math.PI / 2;
  ank.position.set(sx, 0.034 * HEX_R, footZ - 0.010 * HEX_R);
  group.add(ank);
  const fstrap = new THREE.Mesh(getBMFootStrap(), mLeathDk);
  fstrap.rotation.x = Math.PI / 2;
  fstrap.position.set(sx, 0.018 * HEX_R, footZ + 0.014 * HEX_R);
  group.add(fstrap);
  const heel = new THREE.Mesh(getBMHeelStrap(), mLeathDk);       // pasek piętowy sandała
  heel.position.set(sx, 0.026 * HEX_R, footZ - 0.034 * HEX_R);
  group.add(heel);
  const shinBind = new THREE.Mesh(getBMShinBind(), mLeathDk);    // rzemienne wiązanie goleni
  shinBind.position.set(sx, 0.126 * HEX_R, 0.008 * HEX_R);
  group.add(shinBind);
}

/** Ramię: ramię + przedramię + pięść + naramiennik (deltoid). Zwraca nadgarstek i oś. */
function bmBuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  const delt = new THREE.Mesh(getBMDelt(), mUp);
  delt.position.set(sx * (BM_TORSO_W * 0.5 + 0.014 * HEX_R), BM_SHLD_Y + 0.014 * HEX_R, 0);
  group.add(delt);
  let P = new THREE.Vector3(sx, BM_SHLD_Y, 0);
  P = bmSeg(group, getBMUpArm(), mUp, P, thU, BM_UPARM_L);
  P.y += 0.010 * HEX_R;
  const wrist = bmSeg(group, getBMForearm(), mFore, P, thF, BM_FOREARM_L);
  const axis = bmDirDown(thF);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getBMFist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(axis, 0.013 * HEX_R));
    group.add(fist);
  }
  return { wrist, axis };
}

/** Tors + szyja + głowa + żuchwa + nos + brwi + oczy + uszy. */
function bmBuildCore(
  group: THREE.Group,
  mTunic: THREE.MeshStandardMaterial, mSkin: THREE.MeshStandardMaterial,
  mSkinDk: THREE.MeshStandardMaterial, mEye: THREE.MeshStandardMaterial,
): void {
  const torso = new THREE.Mesh(getBMTorso(), mTunic);
  torso.position.set(0, BM_TORSO_CTR, 0);
  group.add(torso);
  const neck = new THREE.Mesh(getBMNeck(), mSkin);
  neck.position.set(0, BM_TORSO_TOP + BM_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(getBMHead(), mSkin);
  head.position.set(0, BM_HEAD_CTR, 0);
  group.add(head);
  const jaw = new THREE.Mesh(getBMJaw(), mSkinDk);
  jaw.position.set(0, BM_HEAD_CTR - BM_HEAD_S * 0.38, 0.010 * HEX_R);
  group.add(jaw);
  const nose = new THREE.Mesh(getBMNose(), mSkin);
  nose.position.set(0, BM_HEAD_CTR - 0.002 * HEX_R, BM_HEAD_S * 0.5 + 0.007 * HEX_R);
  group.add(nose);
  const brow = new THREE.Mesh(getBMBrow(), mSkinDk);
  brow.rotation.x = 0.12;
  brow.position.set(0, BM_HEAD_CTR + 0.032 * HEX_R, BM_HEAD_S * 0.5 + 0.003 * HEX_R);
  group.add(brow);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(getBMEye(), mEye);
    eye.position.set(sx * 0.026 * HEX_R, BM_HEAD_CTR + 0.014 * HEX_R, BM_HEAD_S * 0.5 + 0.002 * HEX_R);
    group.add(eye);
    const ear = new THREE.Mesh(getBMEar(), mSkinDk);
    ear.position.set(sx * (BM_HEAD_S * 0.5 + 0.004 * HEX_R), BM_HEAD_CTR - 0.006 * HEX_R, 0);
    group.add(ear);
    const sideburn = new THREE.Mesh(getBMSideburn(), mSkinDk);
    sideburn.position.set(sx * (BM_HEAD_S * 0.5 + 0.002 * HEX_R), BM_HEAD_CTR - 0.030 * HEX_R, 0.018 * HEX_R);
    group.add(sideburn);
  }
}

// ===========================================================================
// MIECZNIK BRĄZOWY — OPUS 5 (bazowa piechota uderzeniowa, wszystkie
// cywilizacje, epoka Brązu). Miecz kłujący (rapier) w prawej (-X) w gardzie,
// tarcza okrągła ze skóry wołowej z brązowym umbem w lewej (+X), pusta
// pochwa na lewym biodrze, tunika lniana + skórzany napierśnik, sandały,
// krótka broda, prosta skórzana czapka bez okuć — zero brązu na głowie.
// ===========================================================================
export function buildMiecznikBrazOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin      = mat(BM_SKIN,       0.05, 0.80);
  const mSkinDk    = mat(BM_SKIN_DK,    0.05, 0.82);
  const mTunic     = mat(BM_TUNIC,      0.04, 0.86);
  const mTunicDk   = mat(BM_TUNIC_DK,   0.04, 0.88);
  const mLeath     = mat(BM_LEATHER,    0.06, 0.82);
  const mLeathDk   = mat(BM_LEATHER_DK, 0.06, 0.86);
  const mLeathLt   = mat(BM_LEATHER_LT, 0.06, 0.80);
  const mWood      = mat(BM_WOOD,       0.05, 0.85);
  const mWoodDk    = mat(BM_WOOD_DK,    0.05, 0.87);
  const mBone      = mat(BM_BONE,       0.05, 0.72);
  const mSinew     = mat(BM_SINEW,      0.03, 0.90);
  const mBronze    = mat(BM_BRONZE,     0.55, 0.40);
  const mBronzeLt  = mat(BM_BRONZE_LT,  0.60, 0.34);
  const mHair      = mat(BM_HAIR,       0.04, 0.90);
  const mEye       = mat(BM_EYE,        0.05, 0.86);
  const mShieldHide= mat(BM_SHIELD_HIDE,0.05, 0.84);
  const mOwner     = mat(ownerColor_,   0.10, 0.70);

  const HIP_Y = BM_HIP_Y - 0.010 * HEX_R;

  // ═══ KORPUS: tunika lniana + głowa ═══════════════════════════════════════
  bmBuildCore(group, mTunic, mSkin, mSkinDk, mEye);

  // ═══ PROSTY NAPIERŚNIK ZE SKÓRY + SZELKI KRZYŻOWE ════════════════════════
  const cuirass = new THREE.Mesh(getBMCuirass(), mLeath);
  cuirass.position.set(0, BM_TORSO_TOP - 0.076 * HEX_R, BM_TORSO_D * 0.5 + 0.011 * HEX_R);
  group.add(cuirass);
  for (const sx of [-1, 1]) {
    const strap = new THREE.Mesh(getBMStrap(), mLeathLt);
    strap.rotation.set(-0.30, 0, sx * 0.20);
    strap.position.set(sx * 0.038 * HEX_R, BM_TORSO_TOP - 0.006 * HEX_R, 0.010 * HEX_R);
    group.add(strap);
    const rivet = new THREE.Mesh(getBMRivet(), mBronze);          // nit brązowy — mały, jedyny akcent na napierśniku
    rivet.position.set(sx * 0.052 * HEX_R, BM_TORSO_TOP - 0.048 * HEX_R, BM_TORSO_D * 0.5 + 0.020 * HEX_R);
    group.add(rivet);
  }
  const lace = new THREE.Mesh(getBMLace(), mLeathDk);             // sznurowanie na środku napierśnika
  lace.position.set(0, BM_TORSO_TOP - 0.080 * HEX_R, BM_TORSO_D * 0.5 + 0.020 * HEX_R);
  group.add(lace);

  // ═══ TUNIKA: spódniczka + fałd cienia z przodu ═══════════════════════════
  const skirt = new THREE.Mesh(getBMSkirt(), mTunic);
  skirt.position.set(0, BM_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const foldShade = new THREE.Mesh(getBMFootStrap(), mTunicDk);   // wąski pas cienia fałdy (reużycie geo)
  foldShade.scale.set(1.6, 3.2, 1.0);
  foldShade.position.set(0.032 * HEX_R, BM_TORSO_BOT - 0.030 * HEX_R, BM_TORSO_D * 0.5 + 0.010 * HEX_R);
  group.add(foldShade);

  // ═══ PAS KOLORU GRACZA + SPRZĄCZKA KOŚCIANA ══════════════════════════════
  const belt = new THREE.Mesh(getBMBelt(), mOwner);
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);
  const buckle = new THREE.Mesh(getBMBuckle(), mBone);
  buckle.position.set(0, 0.252 * HEX_R, BM_TORSO_D * 0.5 + 0.014 * HEX_R);
  group.add(buckle);
  const pouch = new THREE.Mesh(getBMPouch(), mLeathDk);           // mała sakiewka utylitarna
  pouch.position.set(-0.072 * HEX_R, 0.222 * HEX_R, -0.028 * HEX_R);
  group.add(pouch);
  const apron = new THREE.Mesh(getBMApron(), mLeathLt);           // fartuszek skórzany z przodu pasa
  apron.rotation.x = -0.10;
  apron.position.set(0, BM_TORSO_BOT - 0.052 * HEX_R, BM_TORSO_D * 0.5 + 0.024 * HEX_R);
  group.add(apron);
  for (const sx of [-1, 1]) {
    const tasset = new THREE.Mesh(getBMTasset(), mLeathLt);       // wiszące pasy boczne
    tasset.rotation.x = -0.08;
    tasset.position.set(sx * 0.072 * HEX_R, BM_TORSO_BOT - 0.048 * HEX_R, BM_TORSO_D * 0.5 + 0.020 * HEX_R);
    group.add(tasset);
  }

  // ═══ NOGI: sandały skórzane ══════════════════════════════════════════════
  bmBuildLeg(group,  BM_HIP_X,  0.54,  0.30, mSkin, mLeath, mLeathDk, HIP_Y);
  bmBuildLeg(group, -BM_HIP_X, -0.48, -0.16, mSkin, mLeath, mLeathDk, HIP_Y);

  // ═══ GŁOWA: krótkie włosy + broda + prosta czapka skórzana (BEZ brązu) ═══
  const hairTop = new THREE.Mesh(getBMHairTop(), mHair);
  hairTop.position.set(0, BM_HEAD_TOP - 0.014 * HEX_R, -0.006 * HEX_R);
  group.add(hairTop);
  const hairBack = new THREE.Mesh(getBMHairBack(), mHair);
  hairBack.position.set(0, BM_HEAD_CTR - 0.006 * HEX_R, -(BM_HEAD_S * 0.5 + 0.011 * HEX_R));
  group.add(hairBack);
  const beard = new THREE.Mesh(getBMBeard(), mHair);
  beard.position.set(0, BM_HEAD_CTR - 0.066 * HEX_R, 0.020 * HEX_R);
  group.add(beard);
  const cap = new THREE.Mesh(getBMCap(), mLeath);                 // czapka skórzana prosta
  cap.position.set(0, BM_HEAD_CTR + 0.050 * HEX_R, 0);
  group.add(cap);

  // ═══ PRAWE (-X) RAMIĘ: MIECZ KŁUJĄCY W GARDZIE, wysunięty nisko-przodem ══
  const armR = bmBuildArm(group, -BM_SHLD_X, 0.32, 1.40, mTunic, mSkin, mLeathDk);
  const axR = armR.axis;
  const atR = (d: number): THREE.Vector3 => armR.wrist.clone().addScaledVector(axR, d * HEX_R);
  const rotR = Math.PI - 1.40;

  const grip = new THREE.Mesh(getBMGrip(), mWood);
  grip.rotation.x = rotR;
  grip.position.copy(atR(0.031));
  group.add(grip);
  const gripWrap = new THREE.Mesh(getBMGripWrap(), mSinew);
  gripWrap.rotation.x = rotR;
  gripWrap.position.copy(atR(0.031));
  group.add(gripWrap);
  const gripWrap2 = new THREE.Mesh(getBMGripWrap(), mSinew);      // drugi pierścień oplotu sznurkiem
  gripWrap2.rotation.x = rotR;
  gripWrap2.position.copy(atR(0.017));
  group.add(gripWrap2);
  const bracer = new THREE.Mesh(getBMBracer(), mLeathLt);         // skórzany ochraniacz na przedramieniu mieczowym
  bracer.quaternion.setFromUnitVectors(BM_Y_UP, axR);
  bracer.position.copy(atR(-0.048));
  group.add(bracer);
  const pommel = new THREE.Mesh(getBMPommel(), mBone);            // gałka KOŚCIANA (nie klejnot)
  pommel.position.copy(atR(-0.012));
  group.add(pommel);
  const guard = new THREE.Mesh(getBMGuard(), mBronze);            // JELEC BRĄZOWY, mały, prosty
  guard.rotation.x = rotR;
  guard.position.copy(atR(0.064));
  group.add(guard);
  const blade = new THREE.Mesh(getBMBlade(), mBronze);            // KLINGA KŁUJĄCA (rapier)
  blade.rotation.x = rotR;
  blade.position.copy(atR(0.072));
  group.add(blade);
  const bladeEdge = new THREE.Mesh(getBMBladeEdge(), mBronzeLt);  // połysk krawędzi
  bladeEdge.scale.set(1.0, 1.0, 0.5);
  bladeEdge.rotation.x = rotR;
  bladeEdge.position.copy(atR(0.072));
  group.add(bladeEdge);

  // ═══ POCHWA PUSTA na lewym biodrze (miecz dobyty w dłoni) ════════════════
  const shX = 0.070 * HEX_R;
  const sheath = new THREE.Mesh(getBMSheath(), mLeath);
  sheath.rotation.z = 0.16;
  sheath.position.set(shX, 0.180 * HEX_R, -0.018 * HEX_R);
  group.add(sheath);
  const sheathCore = new THREE.Mesh(getBMSheath(), mWoodDk);      // rdzeń drewniany (mniejsza skala)
  sheathCore.scale.set(0.55, 0.97, 0.55);
  sheathCore.rotation.z = 0.16;
  sheathCore.position.set(shX, 0.180 * HEX_R, -0.018 * HEX_R);
  group.add(sheathCore);
  const sheathTop = new THREE.Mesh(getBMSheathTop(), mLeathDk);
  sheathTop.rotation.z = 0.16;
  sheathTop.position.set(shX - 0.006 * HEX_R, 0.264 * HEX_R, -0.018 * HEX_R);
  group.add(sheathTop);
  const sheathTip = new THREE.Mesh(getBMSheathTip(), mLeathDk);
  sheathTip.rotation.z = 0.16;
  sheathTip.position.set(shX + 0.012 * HEX_R, 0.088 * HEX_R, -0.018 * HEX_R);
  group.add(sheathTip);
  const frog = new THREE.Mesh(getBMFrog(), mLeathLt);             // pętla mocująca do pasa
  frog.rotation.z = 0.16;
  frog.position.set(shX - 0.004 * HEX_R, 0.240 * HEX_R, -0.006 * HEX_R);
  group.add(frog);

  // ═══ LEWE (+X) RAMIĘ: TARCZA OKRĄGŁA ZE SKÓRY WOŁOWEJ + BRĄZOWE UMBO ═════
  const armL = bmBuildArm(group, BM_SHLD_X, 0.42, 1.00, mTunic, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.024 * HEX_R,
    armL.wrist.y + 0.038 * HEX_R,
    armL.wrist.z + 0.048 * HEX_R,
  );
  sh.rotation.y = -0.22;
  sh.rotation.z = 0.05;

  const field = new THREE.Mesh(getBMShField(), mOwner);           // pole = kolor gracza (skóra barwiona)
  field.rotation.x = Math.PI / 2;
  sh.add(field);
  const rim = new THREE.Mesh(getBMShRim(), mShieldHide);          // rant — skóra wołowa niebarwiona
  rim.rotation.x = Math.PI / 2;
  rim.position.z = -0.005 * HEX_R;
  sh.add(rim);
  const boss = new THREE.Mesh(getBMShBoss(), mBronze);            // MAŁE brązowe umbo centralne
  boss.rotation.x = -Math.PI / 2;
  boss.position.z = 0.016 * HEX_R;
  sh.add(boss);
  for (const ang of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {   // obszycie brzegu (4 klamry)
    const st = new THREE.Mesh(getBMShStitch(), mLeathDk);
    st.position.set(Math.sin(ang) * 0.100 * HEX_R, Math.cos(ang) * 0.100 * HEX_R, 0.006 * HEX_R);
    sh.add(st);
  }
  const grip2 = new THREE.Mesh(getBMShGrip(), mWood);             // chwyt poprzeczny z tyłu
  grip2.position.set(0, -0.018 * HEX_R, -0.028 * HEX_R);
  sh.add(grip2);
  const brace = new THREE.Mesh(getBMShGrip(), mWoodDk);           // wewnętrzna listwa usztywniająca (pionowa)
  brace.rotation.z = Math.PI / 2;
  brace.scale.set(0.68, 1.0, 1.0);
  brace.position.set(0, 0, -0.022 * HEX_R);
  sh.add(brace);
  const loop = new THREE.Mesh(getBMShLoop(), mLeathDk);           // pętla na przedramię
  loop.position.set(0, 0.026 * HEX_R, -0.024 * HEX_R);
  sh.add(loop);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

/** Zwolnienie singletonów modułu (konwencja disposeUnitGeometries z units.ts). */
export function disposeBrazMiecznikOpus5Geometries(): void {
  const all: (THREE.BufferGeometry | null)[] = [
    gBMTorso, gBMCuirass, gBMStrap, gBMNeck, gBMHead, gBMJaw, gBMNose, gBMEar,
    gBMEye, gBMBrow, gBMBeard, gBMHairTop, gBMHairBack, gBMCap,
    gBMThigh, gBMShin, gBMSole, gBMToes, gBMAnkStrap, gBMFootStrap,
    gBMHeelStrap, gBMShinBind,
    gBMUpArm, gBMForearm, gBMFist, gBMDelt,
    gBMSkirt, gBMBelt, gBMBuckle, gBMPouch,
    gBMApron, gBMTasset, gBMSideburn, gBMLace, gBMRivet, gBMBracer,
    gBMSheath, gBMSheathTop, gBMSheathTip, gBMFrog,
    gBMGrip, gBMGripWrap, gBMPommel, gBMGuard, gBMBlade, gBMBladeEdge,
    gBMShField, gBMShRim, gBMShBoss, gBMShStitch, gBMShGrip, gBMShLoop,
  ];
  for (const g of all) { g?.dispose(); }
  gBMTorso = gBMCuirass = gBMStrap = gBMNeck = gBMHead = gBMJaw = gBMNose = gBMEar = null;
  gBMEye = gBMBrow = gBMBeard = gBMHairTop = gBMHairBack = gBMCap = null;
  gBMThigh = gBMShin = gBMSole = gBMToes = gBMAnkStrap = gBMFootStrap = null;
  gBMHeelStrap = gBMShinBind = null;
  gBMUpArm = gBMForearm = gBMFist = gBMDelt = null;
  gBMSkirt = gBMBelt = gBMBuckle = gBMPouch = null;
  gBMApron = gBMTasset = gBMSideburn = gBMLace = gBMRivet = gBMBracer = null;
  gBMSheath = gBMSheathTop = gBMSheathTip = gBMFrog = null;
  gBMGrip = gBMGripWrap = gBMPommel = gBMGuard = gBMBlade = gBMBladeEdge = null;
  gBMShField = gBMShRim = gBMShBoss = gBMShStitch = gBMShGrip = gBMShLoop = null;
}
