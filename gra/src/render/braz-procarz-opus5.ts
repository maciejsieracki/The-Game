/**
 * braz-procarz-opus5.ts — PROCARZ (Slinger), jednostka BAZOWA dystansowa
 * EPOKI BRĄZU (units.json: „Procarz", Epoka=Brąz, Kultura=null — dostępna
 * dla WSZYSTKICH cywilizacji, „W zamian za: -"). Zastępuje dotychczasowy
 * placeholder buildProcarz (jednostki-p1-rdzen.ts), który wbrew epoce nosił
 * BRĄZOWĄ czapkę stożkową (p1BronzeCone) — anachronizm sprzeczny z zasadą
 * właściciela „procarz był bronią biedaka, zero brązu w całym modelu".
 * Wpięcie do dispatch (case 'procarz' w units.ts) robi KOORDYNATOR — ten plik
 * tylko dostarcza budowniczego, zgodnie z poleceniem zadania.
 * ---------------------------------------------------------------------------
 * Drop-in:
 *   buildProcarzBrazOpus5(ownerColor)          : THREE.Group
 *   disposeBrazProcarzOpus5Geometries()        : void
 *
 * Konwencje serii (jak braz-lucznik-nubijski-opus5.ts / kamien-inka-opus5.ts):
 *   - figurka PRZODEM do +Z, stopy na y = 0 grupy,
 *   - układ prawoskrętny: przód = +Z, góra = +Y => LEWA ręka = +X, PRAWA = -X,
 *   - group.userData['mats'] / ['perTokenGeos'] jak w całej serii,
 *   - geometrie wspólne = singletony modułu (perTokenGeos puste),
 *   - wyłącznie MeshStandardMaterial,
 *   - BROŃ (proca) NA OSI DŁONI — oba rzemienie procy wychodzą z pięści,
 *     nic nie lewituje,
 *   - anatomia (HIP_Y, TORSO_, HEAD_, SHLD_, kończyny) IDENTYCZNA z rodziną
 *     P1_, NB_, KI_ — figurki wymienne 1:1 na mapie z resztą rodziny.
 *
 * KOLOR GRACZA (slot tintu — jak sash/belt w reszcie rodziny): sznur
 * przewiązujący przepaskę biodrową + klapka sakwy na pociski (dokładnie ta
 * sama konwencja co „zwiadowca" w jednostki-p1-rdzen.ts: klapka torby =
 * kolor gracza).
 *
 * ===========================================================================
 * ZGODNOŚĆ HISTORYCZNA — DECYZJE I UZASADNIENIA
 * ===========================================================================
 * Ramy: proca to najstarsza i najtańsza broń dystansowa (poświadczona już
 * w neolicie), używana masowo w epoce Brązu przez lekkozbrojnych harcowników
 * rekrutowanych spośród pasterzy — bez wyszkolenia wojskowego, bez zbroi,
 * bez metalu. To NIE jest zawodowy żołnierz, tylko uzbrojony cywil.
 *
 * P1. ZERO METALU W CAŁYM MODELU (świadomie, zgodnie z poleceniem
 *     właściciela) — nawet ta odrobina brązu, jaką w tej samej rodzinie
 *     dostał Łucznik nubijski (grot strzały) czy Wojownik/Włócznik Brązu
 *     (hełm, pektorał), tutaj jest wykluczona. Procarz to biedak: proca,
 *     torba na pociski, przepaska — nic więcej.
 * P2. STRÓJ NAJSKROMNIEJSZY W GRZE — goła, naga klatka piersiowa (bez
 *     tuniki: nawet najtańsza barwiona tunika to wydatek), tylko prosta
 *     PRZEPASKA BIODROWA z niebarwionej, surowej tkaniny/skóry (barwa
 *     ziemista, NIE żywy odcień ochry jak u Wojownika/Włócznika/starego
 *     placeholdera Procarza — brak barwnika = brak pieniędzy). Dolny brzeg
 *     przepaski celowo POSTRZĘPIONY (frędzle nierównej długości) — znoszona
 *     szmata, nie mundur. Bose stopy (brak nawet najtańszych sandałów).
 *     Gołowłosy — ZERO nakrycia głowy (jedyna taka jednostka w całej
 *     rodzinie Brązu: Wojownik/Włócznik mają hełm brązowy, stary placeholder
 *     Procarza miał brązową czapkę stożkową, Procarz Huaracoc — czerwone
 *     llautu z piórem). Krótkie, potargane włosy pasterza, nic więcej.
 * P3. POCISKI: GLINIANE, W KSZTAŁCIE MIGDAŁA (biconvex sling bullets/glandes)
 *     — WYBRANE zamiast kamieni rzecznych, bo kształt migdałowy jest
 *     rozpoznawalną, w pełni autentyczną formą epoki brązu/żelaza (poświad-
 *     czone od Bliskiego Wschodu po Grecję i Cypr), a jednocześnie WIZUALNIE
 *     odróżnia moje pociski od szarych kostek kamiennych używanych przez
 *     Procarza Huaracoc (kamien-inka-opus5.ts / jednostki-p2-inka.ts) —
 *     moje są ceglasto-terakotowe, gładkie, symetryczne. ŚWIADOMIE bez ołowiu
 *     (lead glandes to dopiero Grecja klasyczna/Rzym — zakazane wprost przez
 *     właściciela). Kilka sztuk widoczne w otwartej sakwie u biodra + 3 w
 *     wolnej dłoni (zapas gotowy do przeładowania).
 * P4. SAKWA SKÓRZANA PRZEZ RAMIĘ (nie na pasie jak u Huaracoc) — pasek
 *     poprzez pierś (baldric), torba nisko na biodrze, klapka = KOLOR
 *     GRACZA (ta sama konwencja co „zwiadowca" w jednostki-p1-rdzen.ts).
 *     Zamknięcie sznurkiem + prosty toczony kołek z KOŚCI/drewna (NIE
 *     metalowa klamra/sprzączka — te pojawiają się dopiero w żelazie).
 * P5. BUKŁAK Z WYSUSZONEJ TYKWY (gourd) na przeciwnym biodrze, na sznurku —
 *     drobny, ale mocno „pasterski" rekwizyt: to pasterz, nie żołnierz,
 *     więc nosi przy sobie wodę na trzodę i dla siebie, nie prowiant bojowy.
 * P6. PROSTA DREWNIANA/KOŚCIANA PISZCZAŁKA PASTERSKA na sznurku na szyi —
 *     przedmiot osobisty pasterza (przywoływanie trzody), NIE instrument
 *     rangi ani insygnium — jedyny „ozdobnik" modelu, uzasadniony fabularnie
 *     rolą postaci, nie dekoracją dla dekoracji.
 * P7. PROCA — WYBÓR UJĘCIA: „PROCA UNIESIONA NAD GŁOWĄ W ZAMACHU", w PIONOWEJ
 *     pętli WPROST NAD podniesioną pięścią (nie w bok, nie ukośnie za
 *     plecami). Uzasadnienie wyboru (zamiast „zwinięta w dłoni"):
 *       - kamera gry jest pod kątem ~52° — liczy się góra sylwetki; pionowa
 *         pętla ponad głową daje czytelny, wysoki akcent na szczycie modelu,
 *         podczas gdy zwinięta proca w spoczynku byłaby niemal niewidoczna
 *         z tego kąta (płaski kłębek przy pięści, brak „czytelnej cechy
 *         sylwetki" wymaganej przez właściciela),
 *       - explicit ROZRÓŻNIENIE od Procarza Huaracoc (kamien-inka-opus5.ts /
 *         jednostki-p2-inka.ts, buildInkaSlinger): Huaracoc kręci procą
 *         W POZIOMIE — sznury i sakiewka lecą W BOK od pięści (kierunek
 *         wektora W = (0.92,0,-0.39), czyli głównie wzdłuż osi X/Z, mała
 *         składowa Y) — sylwetka „rozlewa się" na boki. Mój Procarz ma
 *         pociski i sakiewkę procy WPROST NAD pięścią (składowa +Y
 *         dominująca, prawie zero w bok) — sylwetka „wystrzeliwuje w górę".
 *         Z dystansu kamery 4X te dwie jednostki NIE dadzą się pomylić:
 *         jedna jest „szeroka i pozioma", druga „wysoka i pionowa".
 *       - dodatkowo ODRÓŻNIA się też od dotychczasowego placeholdera
 *         (jednostki-p1-rdzen.ts buildProcarz), który wprawdzie też unosi
 *         procę nad głowę, ale w łuku PRZECHYLONYM DO TYŁU (sakiewka ląduje
 *         z tyłu-boku głowy, P1p.z ujemne, P2p.x dodatnie w bok) — u mnie
 *         pętla jest niemal w osi pionowej, lekko DO PRZODU (w stronę celu,
 *         moment tuż przed wypuszczeniem), nie w bok czy do tyłu.
 *     Proca = DWA rzemienie (loop od nadgarstka po obu stronach pięści) +
 *     wspólna kieszonka na pocisk na szczycie pętli — nic nie lewituje,
 *     oba rzemienie wychodzą wprost z pięści. Dodatkowo mała PĘTLA
 *     ZACISKOWA (retention loop) owinięta wokół nadgarstka — funkcjonalny
 *     detal: bez niej proca wyleciałaby z ręki przy zamachu.
 * P8. CZEGO ŚWIADOMIE NIE MA: żadnego metalu (nawet brązu), żadnej zbroi,
 *     żadnego hełmu, żadnej tarczy, żadnych oznaczeń rangi/insygniów,
 *     żadnego ołowiu, żadnej kuszy/łuku/innej broni dystansowej.
 *
 * Budżet: patrz raport końcowy zadania (liczba mesh / trójkątów / materiałów,
 * zmierzone traversem grupy w skrypcie pomocniczym w scratchpadzie).
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

// ── paleta: ZERO metalu (żadnego brązu/złota/srebra) ────────────────────────
const PZ_SKIN       = 0xe0ac69;   // karnacja generyczna (jak reszta rodziny P1_/NB_/KI_)
const PZ_SKIN_DK    = 0xc89058;   // cień żuchwy / dłonie / stopy / sole
const PZ_SKIN_SHADE = 0xb07c46;   // cień głębszy (podeszwy stóp)

const PZ_HIDE       = 0xa89468;   // przepaska biodrowa — NIEBARWIONA surowa tkanina/skóra
                                  //  (świadomie stonowana wobec żywej ochry Wojownika/
                                  //   Włócznika/starego placeholdera — brak barwnika = biedak)
const PZ_HIDE_DK     = 0x7c6a46;   // fałd/cień przepaski
const PZ_FRINGE       = 0x6b5a3c;   // postrzępione frędzle dolnej krawędzi (znoszona szmata)

const PZ_LEATHER     = 0x6b4a28;   // sakwa / pasek / sznury procy (spójne z rodziną NB_/KI_/P1_)
const PZ_LEATHER_DK  = 0x4a331b;

const PZ_HAIR        = 0x40311e;   // krótkie, potargane włosy pasterza (bez nakrycia głowy) —
                                  //  UMIARKOWANIE ciemny brąz (nie niemal-czerń): przy gołej
                                  //  głowie (brak nakrycia, w odróżnieniu od reszty rodziny)
                                  //  zbyt ciemny odcień czytał się jak ubytek geometrii/dziura
                                  //  z ujęcia z góry — poprawka 2026-07-25 wg uwagi koordynatora

const PZ_CLAY        = 0xb5643c;   // JEDYNY „obcy" materiał: wypalana glina — pociski migdałowe
const PZ_CLAY_LT      = 0xc47a4e;   // jaśniejszy odblask gliny (nie metal — matowa ceramika)

const PZ_BONE        = 0xd8cdb4;   // kościany/drewniany kołek zapinający sakwę
const PZ_WOOD        = 0x6a4e30;   // piszczałka pasterska (drewno/trzcina)

const PZ_GOURD       = 0x8a7a42;   // wysuszona tykwa (bukłak)
const PZ_GOURD_DK    = 0x655a30;

const PZ_EYE         = 0x14100c;
const PZ_CORD        = 0x8c7a52;   // sznur/rzemyk (bukłak, piszczałka, pętla zaciskowa)

// ── wymiary sylwetki: IDENTYCZNE z rodziną P1_, NB_, KI_ (spójność 1:1) ────
const PZ_HIP_Y     = 0.208 * HEX_R;
const PZ_TORSO_W   = 0.180 * HEX_R;
const PZ_TORSO_H   = 0.205 * HEX_R;
const PZ_TORSO_D   = 0.100 * HEX_R;
const PZ_TORSO_BOT = 0.240 * HEX_R;
const PZ_TORSO_CTR = PZ_TORSO_BOT + PZ_TORSO_H * 0.5;
const PZ_TORSO_TOP = PZ_TORSO_BOT + PZ_TORSO_H;
const PZ_NECK_H    = 0.028 * HEX_R;
const PZ_HEAD_S    = 0.128 * HEX_R;
const PZ_HEAD_CTR  = PZ_TORSO_TOP + PZ_NECK_H + PZ_HEAD_S * 0.5;
const PZ_HEAD_TOP  = PZ_TORSO_TOP + PZ_NECK_H + PZ_HEAD_S;
const PZ_SHLD_X    = PZ_TORSO_W * 0.5 + 0.030 * HEX_R;
const PZ_SHLD_Y    = PZ_TORSO_TOP - 0.024 * HEX_R;
const PZ_HIP_X     = 0.052 * HEX_R;

const PZ_THIGH_L   = 0.104 * HEX_R;
const PZ_SHIN_L    = 0.096 * HEX_R;
const PZ_UPARM_L   = 0.100 * HEX_R;
const PZ_FOREARM_L = 0.092 * HEX_R;

// ── geometrie-singletony (lazy) ────────────────────────────────────────────
let gPZTorso:    THREE.BoxGeometry | null = null;
let gPZChest:    THREE.BoxGeometry | null = null;
let gPZCollar:   THREE.BoxGeometry | null = null;
let gPZNeck:     THREE.BoxGeometry | null = null;
let gPZHead:     THREE.BoxGeometry | null = null;
let gPZJaw:      THREE.BoxGeometry | null = null;
let gPZNose:     THREE.BoxGeometry | null = null;
let gPZEar:      THREE.BoxGeometry | null = null;
let gPZEye:      THREE.BoxGeometry | null = null;
let gPZBrow:     THREE.BoxGeometry | null = null;
let gPZTuft: THREE.OctahedronGeometry | null = null;
let gPZThigh:    THREE.BoxGeometry | null = null;
let gPZShin:     THREE.BoxGeometry | null = null;
let gPZSole:     THREE.BoxGeometry | null = null;
let gPZToes:     THREE.BoxGeometry | null = null;
let gPZUpArm:    THREE.BoxGeometry | null = null;
let gPZForearm:  THREE.BoxGeometry | null = null;
let gPZFist:     THREE.BoxGeometry | null = null;
let gPZUnit:     THREE.BoxGeometry | null = null;
// przepaska biodrowa
let gPZWrap:     THREE.BoxGeometry | null = null;
let gPZHem:      THREE.BoxGeometry | null = null;
let gPZFringe:   THREE.BoxGeometry | null = null;
let gPZBelt:     THREE.BoxGeometry | null = null;
let gPZKnot:     THREE.BoxGeometry | null = null;
// sakwa na pociski
let gPZBag:      THREE.BoxGeometry | null = null;
let gPZBagFlap:  THREE.BoxGeometry | null = null;
let gPZToggle:   THREE.CylinderGeometry | null = null;
let gPZPellet:   THREE.OctahedronGeometry | null = null;
// bukłak z tykwy
let gPZGourd:    THREE.BoxGeometry | null = null;
let gPZGourdNk:  THREE.BoxGeometry | null = null;
// piszczałka pasterska
let gPZWhistle:  THREE.CylinderGeometry | null = null;
// proca
let gPZLoop:     THREE.BoxGeometry | null = null;
let gPZPouch:    THREE.BoxGeometry | null = null;
// detale anatomiczne drugorzedne
let gPZScapula:  THREE.BoxGeometry | null = null;
let gPZAnkleWrap:THREE.BoxGeometry | null = null;
let gPZHeel:     THREE.BoxGeometry | null = null;

function getPZTorso():    THREE.BoxGeometry { return (gPZTorso    ||= new THREE.BoxGeometry(PZ_TORSO_W, PZ_TORSO_H, PZ_TORSO_D)); }
function getPZChest():    THREE.BoxGeometry { return (gPZChest    ||= new THREE.BoxGeometry(PZ_TORSO_W * 1.02, 0.066 * HEX_R, PZ_TORSO_D * 1.04)); }
function getPZCollar():   THREE.BoxGeometry { return (gPZCollar   ||= new THREE.BoxGeometry(0.070 * HEX_R, 0.020 * HEX_R, PZ_TORSO_D * 0.9)); }
function getPZNeck():     THREE.BoxGeometry { return (gPZNeck     ||= new THREE.BoxGeometry(0.042 * HEX_R, PZ_NECK_H * 1.6, 0.042 * HEX_R)); }
function getPZHead():     THREE.BoxGeometry { return (gPZHead     ||= new THREE.BoxGeometry(PZ_HEAD_S, PZ_HEAD_S, PZ_HEAD_S)); }
function getPZJaw():      THREE.BoxGeometry { return (gPZJaw      ||= new THREE.BoxGeometry(0.086 * HEX_R, 0.034 * HEX_R, 0.038 * HEX_R)); }
function getPZNose():     THREE.BoxGeometry { return (gPZNose     ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.026 * HEX_R, 0.016 * HEX_R)); }
function getPZEar():      THREE.BoxGeometry { return (gPZEar      ||= new THREE.BoxGeometry(0.010 * HEX_R, 0.032 * HEX_R, 0.022 * HEX_R)); }
function getPZEye():      THREE.BoxGeometry { return (gPZEye      ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.011 * HEX_R, 0.008 * HEX_R)); }
function getPZBrow():     THREE.BoxGeometry { return (gPZBrow     ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.008 * HEX_R, 0.008 * HEX_R)); }
function getPZTuft(): THREE.OctahedronGeometry { return (gPZTuft ||= new THREE.OctahedronGeometry(0.030 * HEX_R, 0)); }
function getPZThigh():    THREE.BoxGeometry { return (gPZThigh    ||= new THREE.BoxGeometry(0.056 * HEX_R, PZ_THIGH_L, 0.060 * HEX_R)); }
function getPZShin():     THREE.BoxGeometry { return (gPZShin     ||= new THREE.BoxGeometry(0.038 * HEX_R, PZ_SHIN_L, 0.042 * HEX_R)); }
function getPZSole():     THREE.BoxGeometry { return (gPZSole     ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.018 * HEX_R, 0.062 * HEX_R)); }
function getPZToes():     THREE.BoxGeometry { return (gPZToes     ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.014 * HEX_R, 0.022 * HEX_R)); }
function getPZUpArm():    THREE.BoxGeometry { return (gPZUpArm    ||= new THREE.BoxGeometry(0.054 * HEX_R, PZ_UPARM_L, 0.054 * HEX_R)); }
function getPZForearm():  THREE.BoxGeometry { return (gPZForearm  ||= new THREE.BoxGeometry(0.040 * HEX_R, PZ_FOREARM_L, 0.040 * HEX_R)); }
function getPZFist():     THREE.BoxGeometry { return (gPZFist     ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)); }
function getPZUnit():     THREE.BoxGeometry { return (gPZUnit     ||= new THREE.BoxGeometry(1, 1, 1)); }
function getPZWrap():     THREE.BoxGeometry { return (gPZWrap     ||= new THREE.BoxGeometry(0.198 * HEX_R, 0.082 * HEX_R, 0.122 * HEX_R)); }
function getPZHem():      THREE.BoxGeometry { return (gPZHem      ||= new THREE.BoxGeometry(0.206 * HEX_R, 0.020 * HEX_R, 0.128 * HEX_R)); }
function getPZFringe():   THREE.BoxGeometry { return (gPZFringe   ||= new THREE.BoxGeometry(0.015 * HEX_R, 0.052 * HEX_R, 0.009 * HEX_R)); }
function getPZBelt():     THREE.BoxGeometry { return (gPZBelt     ||= new THREE.BoxGeometry(0.192 * HEX_R, 0.018 * HEX_R, 0.116 * HEX_R)); }
function getPZKnot():     THREE.BoxGeometry { return (gPZKnot     ||= new THREE.BoxGeometry(0.032 * HEX_R, 0.028 * HEX_R, 0.017 * HEX_R)); }
function getPZBag():      THREE.BoxGeometry { return (gPZBag      ||= new THREE.BoxGeometry(0.068 * HEX_R, 0.078 * HEX_R, 0.040 * HEX_R)); }
function getPZBagFlap():  THREE.BoxGeometry { return (gPZBagFlap  ||= new THREE.BoxGeometry(0.072 * HEX_R, 0.030 * HEX_R, 0.010 * HEX_R)); }
function getPZToggle():   THREE.CylinderGeometry { return (gPZToggle ||= new THREE.CylinderGeometry(0.007 * HEX_R, 0.007 * HEX_R, 0.024 * HEX_R, 6, 1)); }
function getPZPellet():   THREE.OctahedronGeometry { return (gPZPellet ||= new THREE.OctahedronGeometry(0.017 * HEX_R, 0)); }
function getPZGourd():    THREE.BoxGeometry { return (gPZGourd    ||= new THREE.BoxGeometry(0.056 * HEX_R, 0.072 * HEX_R, 0.048 * HEX_R)); }
function getPZGourdNk():  THREE.BoxGeometry { return (gPZGourdNk  ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.024 * HEX_R, 0.026 * HEX_R)); }
function getPZWhistle():  THREE.CylinderGeometry { return (gPZWhistle ||= new THREE.CylinderGeometry(0.009 * HEX_R, 0.009 * HEX_R, 0.052 * HEX_R, 6, 1)); }
function getPZLoop():     THREE.BoxGeometry { return (gPZLoop     ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.026 * HEX_R, 0.020 * HEX_R)); }
function getPZPouch():    THREE.BoxGeometry { return (gPZPouch    ||= new THREE.BoxGeometry(0.040 * HEX_R, 0.024 * HEX_R, 0.052 * HEX_R)); }
function getPZScapula():  THREE.BoxGeometry { return (gPZScapula  ||= new THREE.BoxGeometry(0.060 * HEX_R, 0.070 * HEX_R, 0.020 * HEX_R)); }
function getPZAnkleWrap():THREE.BoxGeometry { return (gPZAnkleWrap||= new THREE.BoxGeometry(0.042 * HEX_R, 0.020 * HEX_R, 0.046 * HEX_R)); }
function getPZHeel():     THREE.BoxGeometry { return (gPZHeel     ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.016 * HEX_R, 0.024 * HEX_R)); }

// ---------------------------------------------------------------------------
// Kinematyka — konwencja identyczna z całą rodziną (p1Seg/nbSeg/kiSeg):
// theta liczone od pionu w dół, +theta = ku przodowi (+Z).
// ---------------------------------------------------------------------------
const PZ_Y_UP = new THREE.Vector3(0, 1, 0);

function pzDir(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}

function pzSeg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = pzDir(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

/** Jednostkowy box rozciągnięty między A i B (rzemienie procy, sznury, pasy). */
function pzStretch(
  parent: THREE.Object3D, mtl: THREE.MeshStandardMaterial,
  A: THREE.Vector3, B: THREE.Vector3, w: number, d?: number,
): THREE.Mesh {
  const v = B.clone().sub(A);
  const len = v.length();
  const D = v.clone().normalize();
  const mesh = new THREE.Mesh(getPZUnit(), mtl);
  mesh.scale.set(w, len, d ?? w);
  if (D.y < -0.9999) mesh.rotation.x = Math.PI;
  else mesh.quaternion.setFromUnitVectors(PZ_Y_UP, D);
  mesh.position.copy(A.clone().addScaledVector(D, len * 0.5));
  parent.add(mesh);
  return mesh;
}

/** Noga: udo + goleń + BOSA stopa (podeszwa + palce) płasko na y = 0. */
function pzBuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mSkin: THREE.MeshStandardMaterial, mSkinDk: THREE.MeshStandardMaterial,
  hipY: number,
): THREE.Vector3 {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = pzSeg(group, getPZThigh(), mSkin, P, thU, PZ_THIGH_L);
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  const ankle = pzSeg(group, getPZShin(), mSkin, P, thL, PZ_SHIN_L);
  const wrap = new THREE.Mesh(getPZAnkleWrap(), mSkinDk);     // owiniecie skorzane kostki
  wrap.position.set(sx, ankle.y + 0.006 * HEX_R, ankle.z - 0.002 * HEX_R);
  group.add(wrap);
  P = ankle;
  const footZ = P.z + 0.012 * HEX_R;
  const sole = new THREE.Mesh(getPZSole(), mSkinDk);
  sole.position.set(sx, 0.009 * HEX_R, footZ);
  group.add(sole);
  const heel = new THREE.Mesh(getPZHeel(), mSkinDk);          // pieta (kontur bosej stopy)
  heel.position.set(sx, 0.009 * HEX_R, footZ - 0.024 * HEX_R);
  group.add(heel);
  const toes = new THREE.Mesh(getPZToes(), mSkinDk);
  toes.position.set(sx, 0.007 * HEX_R, footZ + 0.038 * HEX_R);
  group.add(toes);
  const bigToe = new THREE.Mesh(getPZToes(), mSkinDk);        // paluch oddzielony od reszty palcow
  bigToe.scale.set(0.42, 1.05, 1.1);
  bigToe.position.set(sx - Math.sign(sx || 1) * 0.017 * HEX_R, 0.008 * HEX_R, footZ + 0.040 * HEX_R);
  group.add(bigToe);
  return P;
}

/** Ramię: ramię (thU) + przedramię (thF) + opcjonalna pięść. Zwraca nadgarstek + oś. */
function pzBuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  let P = new THREE.Vector3(sx, PZ_SHLD_Y, 0);
  P = pzSeg(group, getPZUpArm(), mUp, P, thU, PZ_UPARM_L);
  P.y += 0.010 * HEX_R;
  const wrist = pzSeg(group, getPZForearm(), mFore, P, thF, PZ_FOREARM_L);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getPZFist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(pzDir(thF), 0.014 * HEX_R));
    group.add(fist);
  }
  return { wrist, axis: pzDir(thF) };
}

/** Tors (goła klatka) + szyja + głowa + żuchwa + nos + oczy + brwi + uszy. */
function pzBuildCore(
  group: THREE.Group,
  mSkin: THREE.MeshStandardMaterial, mSkinDk: THREE.MeshStandardMaterial,
  mEye: THREE.MeshStandardMaterial, mHair: THREE.MeshStandardMaterial,
): void {
  const torso = new THREE.Mesh(getPZTorso(), mSkin);          // goła klatka — bez tuniki
  torso.position.set(0, PZ_TORSO_CTR, 0);
  group.add(torso);
  const chest = new THREE.Mesh(getPZChest(), mSkin);
  chest.position.set(0, PZ_TORSO_TOP - 0.036 * HEX_R, 0);
  group.add(chest);
  const collar = new THREE.Mesh(getPZCollar(), mSkinDk);      // obojczyk (subtelny kontur)
  collar.position.set(0, PZ_TORSO_TOP - 0.006 * HEX_R, 0);
  group.add(collar);
  for (const sx of [-1, 1]) {                                 // lopatki (kontur plecow)
    const sc = new THREE.Mesh(getPZScapula(), mSkinDk);
    sc.position.set(sx * 0.042 * HEX_R, PZ_TORSO_TOP - 0.052 * HEX_R, -(PZ_TORSO_D * 0.5 + 0.006 * HEX_R));
    group.add(sc);
  }
  const neck = new THREE.Mesh(getPZNeck(), mSkin);
  neck.position.set(0, PZ_TORSO_TOP + PZ_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(getPZHead(), mSkin);
  head.position.set(0, PZ_HEAD_CTR, 0);
  group.add(head);
  const jaw = new THREE.Mesh(getPZJaw(), mSkinDk);
  jaw.position.set(0, PZ_HEAD_CTR - PZ_HEAD_S * 0.38, 0.010 * HEX_R);
  group.add(jaw);
  const nose = new THREE.Mesh(getPZNose(), mSkin);
  nose.position.set(0, PZ_HEAD_CTR - 0.004 * HEX_R, PZ_HEAD_S * 0.5 + 0.006 * HEX_R);
  group.add(nose);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(getPZEar(), mSkinDk);
    ear.position.set(sx * (PZ_HEAD_S * 0.5 + 0.004 * HEX_R), PZ_HEAD_CTR - 0.006 * HEX_R, 0);
    group.add(ear);
    const eye = new THREE.Mesh(getPZEye(), mEye);
    eye.position.set(sx * 0.026 * HEX_R, PZ_HEAD_CTR + 0.014 * HEX_R, PZ_HEAD_S * 0.5 + 0.002 * HEX_R);
    group.add(eye);
    const brow = new THREE.Mesh(getPZBrow(), mHair);
    brow.position.set(sx * 0.026 * HEX_R, PZ_HEAD_CTR + 0.026 * HEX_R, PZ_HEAD_S * 0.5 + 0.002 * HEX_R);
    group.add(brow);
  }
}

/** Krótkie, potargane włosy pasterza — ZERO nakrycia głowy (jedyny goły
 *  łeb w całej rodzinie Brązu — Wojownik/Włócznik mają hełm, Huaracoc
 *  llautu). */
function pzHair(group: THREE.Group, mHair: THREE.MeshStandardMaterial,
                mCord: THREE.MeshStandardMaterial): void {
  // potargane kepki wlosow — NIE jedna plaska plyta (z bliska/z gory/z tylu
  // plaski box wygladal jak czarna dziura w modelu); kilka malych,
  // nieregularnie ustawionych kepek czyta sie jako rozczochrane wlosy
  // pasterza, zarowno z gory jak i z tylu glowy.
  for (const [dx, dz, sy, rz] of ([
    [-0.030, -0.010, 1.00, -0.22], [0.000, -0.024, 1.15, 0.05],
    [0.030, -0.008, 0.95, 0.24], [-0.014, 0.020, 0.85, -0.10],
    [0.016, 0.018, 0.90, 0.12],
  ] as [number, number, number, number][])) {
    const tuft = new THREE.Mesh(getPZTuft(), mHair);
    tuft.rotation.z = rz;
    tuft.scale.set(0.9, sy, 0.9);
    tuft.position.set(dx * HEX_R, PZ_HEAD_TOP - 0.010 * HEX_R, dz * HEX_R);
    group.add(tuft);
  }
  for (const [dx, dy, rz] of ([
    [-0.028, 0.006, 0.16], [0.024, 0.002, -0.20], [-0.002, -0.014, 0.05],
  ] as [number, number, number][])) {
    const tuft = new THREE.Mesh(getPZTuft(), mHair);      // kepki na karku (nie plaska plyta)
    tuft.rotation.set(0.1, rz, rz * 0.5);
    tuft.scale.set(0.85, 0.75, 0.7);
    tuft.position.set(dx * HEX_R, PZ_HEAD_CTR + dy * HEX_R, -(PZ_HEAD_S * 0.5 + 0.006 * HEX_R));
    group.add(tuft);
  }
  // prosty rzemyk przewiazujacy wlosy z tylu — praktyczny (nie spada na oczy
  // przy zamachu), NIE opaska rangi
  const tieL = new THREE.Vector3(-0.030 * HEX_R, PZ_HEAD_CTR + 0.014 * HEX_R, -(PZ_HEAD_S * 0.5 + 0.006 * HEX_R));
  const tieR = new THREE.Vector3(0.030 * HEX_R, PZ_HEAD_CTR + 0.014 * HEX_R, -(PZ_HEAD_S * 0.5 + 0.006 * HEX_R));
  const tieBack = new THREE.Vector3(0, PZ_HEAD_CTR + 0.006 * HEX_R, -(PZ_HEAD_S * 0.5 + 0.020 * HEX_R));
  pzStretch(group, mCord, tieL, tieBack, 0.007 * HEX_R);
  pzStretch(group, mCord, tieR, tieBack, 0.007 * HEX_R);
}

/** Przepaska biodrowa NIEBARWIONA + postrzępione frędzle + sznur (KOLOR GRACZA). */
function pzSkirtSet(
  group: THREE.Group, mHide: THREE.MeshStandardMaterial, mHideDk: THREE.MeshStandardMaterial,
  mFringe: THREE.MeshStandardMaterial, mOwner: THREE.MeshStandardMaterial,
): void {
  const wrap = new THREE.Mesh(getPZWrap(), mHide);
  wrap.position.set(0, PZ_TORSO_BOT - 0.026 * HEX_R, 0);
  group.add(wrap);
  const hem = new THREE.Mesh(getPZHem(), mHideDk);
  hem.position.set(0, PZ_TORSO_BOT - 0.062 * HEX_R, 0);
  group.add(hem);
  // dwa rzędy postrzępionych frędzli — znoszona szmata, nie mundur
  for (const dx of [-0.084, -0.052, -0.020, 0.012, 0.044, 0.076]) {
    const fr = new THREE.Mesh(getPZFringe(), mFringe);
    fr.scale.setScalar(0.82 + ((dx * 37) % 1 + 1) % 1 * 0.32);   // dlugosci nierowne (szmata)
    fr.position.set(dx * HEX_R, PZ_TORSO_BOT - 0.086 * HEX_R, PZ_TORSO_D * 0.5 + 0.008 * HEX_R);
    group.add(fr);
  }
  for (const dx of [-0.068, -0.036, -0.004, 0.028, 0.060]) {
    const fr = new THREE.Mesh(getPZFringe(), mFringe);
    fr.scale.setScalar(0.70 + ((dx * 53) % 1 + 1) % 1 * 0.28);
    fr.position.set(dx * HEX_R, PZ_TORSO_BOT - 0.084 * HEX_R, -(PZ_TORSO_D * 0.5 + 0.006 * HEX_R));
    group.add(fr);
  }
  for (const dx of [-0.098, 0.096]) {                          // frędzle boczne (szwy biodrowe)
    const fr = new THREE.Mesh(getPZFringe(), mFringe);
    fr.scale.setScalar(0.76 + ((dx * 61) % 1 + 1) % 1 * 0.30);
    fr.rotation.y = Math.PI / 2;
    fr.position.set(dx * HEX_R, PZ_TORSO_BOT - 0.080 * HEX_R, 0);
    group.add(fr);
  }
  const belt = new THREE.Mesh(getPZBelt(), mOwner);           // sznur = KOLOR GRACZA
  belt.position.set(0, PZ_TORSO_BOT + 0.010 * HEX_R, 0);
  group.add(belt);
  const knot = new THREE.Mesh(getPZKnot(), mOwner);
  knot.position.set(0.028 * HEX_R, PZ_TORSO_BOT + 0.006 * HEX_R, PZ_TORSO_D * 0.5 + 0.010 * HEX_R);
  group.add(knot);
  const tail = new THREE.Mesh(getPZFringe(), mOwner);         // luzny koniec sznura zwisajacy
  tail.rotation.x = 0.18;
  tail.scale.set(0.7, 1.3, 0.7);
  tail.position.set(0.028 * HEX_R, PZ_TORSO_BOT - 0.030 * HEX_R, PZ_TORSO_D * 0.5 + 0.016 * HEX_R);
  group.add(tail);
}

/** Sakwa skórzana przez ramię (baldric) — klapka KOLOR GRACZA, kołek zamiast
 *  metalowej sprzączki, kilka glinianych pocisków migdałowych widocznych. */
function pzBag(
  group: THREE.Group, mLeath: THREE.MeshStandardMaterial, mLeathDk: THREE.MeshStandardMaterial,
  mOwner: THREE.MeshStandardMaterial, mBone: THREE.MeshStandardMaterial,
  mClay: THREE.MeshStandardMaterial, mClayLt: THREE.MeshStandardMaterial,
): void {
  const BX = PZ_TORSO_W * 0.5 + 0.024 * HEX_R;
  const BY = PZ_TORSO_BOT + 0.030 * HEX_R;
  const BZ = 0.022 * HEX_R;
  const bag = new THREE.Mesh(getPZBag(), mLeath);
  bag.rotation.z = -0.10;
  bag.position.set(BX, BY, BZ);
  group.add(bag);
  const flap = new THREE.Mesh(getPZBagFlap(), mOwner);        // klapka = KOLOR GRACZA
  flap.rotation.z = -0.10;
  flap.position.set(BX, BY + 0.042 * HEX_R, BZ + 0.006 * HEX_R);
  group.add(flap);
  const toggle = new THREE.Mesh(getPZToggle(), mBone);        // kołek zapinajacy (kosc/drewno)
  toggle.rotation.z = Math.PI / 2 + 0.2;
  toggle.position.set(BX + 0.010 * HEX_R, BY + 0.020 * HEX_R, BZ + 0.022 * HEX_R);
  group.add(toggle);
  // pasek przez pierś (od PRAWEGO barku, na ukos, do sakwy na LEWYM biodrze —
  // prawdziwy baldric, koniec paska DOTYKA sakwy, nic nie lewituje)
  const strapTop = new THREE.Vector3(-PZ_SHLD_X * 0.62, PZ_TORSO_TOP - 0.008 * HEX_R, PZ_TORSO_D * 0.5 + 0.002 * HEX_R);
  const strapBot = new THREE.Vector3(BX - 0.012 * HEX_R, BY + 0.052 * HEX_R, BZ + 0.006 * HEX_R);
  pzStretch(group, mLeathDk, strapTop, strapBot, 0.020 * HEX_R, 0.010 * HEX_R);
  const draw = new THREE.Mesh(getPZFringe(), mLeath);         // sznurek sciagajacy wieko
  draw.rotation.x = 0.3;
  draw.scale.set(1.0, 0.6, 1.0);
  draw.position.set(BX - 0.006 * HEX_R, BY + 0.046 * HEX_R, BZ + 0.012 * HEX_R);
  group.add(draw);
  // pociski gliniane widoczne w otwartej sakwie
  for (const [dx, dy] of ([
    [-0.010, 0.010], [0.008, 0.016], [0.000, 0.000], [-0.020, -0.004], [0.018, -0.006],
  ] as [number, number][])) {
    const p = new THREE.Mesh(getPZPellet(), (dy === 0.000) ? mClayLt : mClay);
    p.scale.set(1.0, 0.62, 1.0);
    p.rotation.set(0.3, 0.6, 0.2);
    p.position.set(BX + dx * HEX_R, BY + (0.026 + dy) * HEX_R, BZ + 0.020 * HEX_R);
    group.add(p);
  }
  const spare = new THREE.Mesh(getPZPellet(), mClay);         // szosty, na krawedzi wieka
  spare.scale.set(1.0, 0.62, 1.0);
  spare.rotation.set(0.5, 0.2, 0.4);
  spare.position.set(BX - 0.018 * HEX_R, BY + 0.040 * HEX_R, BZ + 0.014 * HEX_R);
  group.add(spare);
}

/** Bukłak z wysuszonej tykwy na sznurku, na przeciwnym biodrze — atrybut
 *  pasterza (woda dla siebie i trzody), nie żołnierza. */
function pzGourd(group: THREE.Group, mGourd: THREE.MeshStandardMaterial,
                 mGourdDk: THREE.MeshStandardMaterial, mCord: THREE.MeshStandardMaterial): void {
  const GX = -(PZ_TORSO_W * 0.5 + 0.022 * HEX_R);
  const GY = PZ_TORSO_BOT + 0.014 * HEX_R;
  const GZ = 0.012 * HEX_R;
  const body = new THREE.Mesh(getPZGourd(), mGourd);
  body.rotation.z = 0.14;
  body.position.set(GX, GY, GZ);
  group.add(body);
  const nk = new THREE.Mesh(getPZGourdNk(), mGourdDk);
  nk.rotation.z = 0.14;
  nk.position.set(GX - 0.006 * HEX_R, GY + 0.046 * HEX_R, GZ);
  group.add(nk);
  const cordTop = new THREE.Vector3(PZ_SHLD_X * -0.5, PZ_TORSO_TOP - 0.006 * HEX_R, -(PZ_TORSO_D * 0.5 + 0.004 * HEX_R));
  const cordBot = new THREE.Vector3(GX + 0.004 * HEX_R, GY + 0.044 * HEX_R, GZ - 0.004 * HEX_R);
  pzStretch(group, mCord, cordTop, cordBot, 0.010 * HEX_R);
  const tie = new THREE.Mesh(getPZLoop(), mGourdDk);          // wezel sznura u szyjki tykwy
  tie.scale.set(0.7, 0.5, 0.7);
  tie.position.set(GX - 0.002 * HEX_R, GY + 0.058 * HEX_R, GZ - 0.002 * HEX_R);
  group.add(tie);
}

/** Prosta piszczałka pasterska na sznurku na szyi — przedmiot osobisty,
 *  NIE insygnium rangi. */
function pzWhistle(group: THREE.Group, mWood: THREE.MeshStandardMaterial,
                    mCord: THREE.MeshStandardMaterial): void {
  const wY = PZ_TORSO_TOP + 0.010 * HEX_R;
  const cordL = new THREE.Vector3(-0.030 * HEX_R, PZ_TORSO_TOP + 0.018 * HEX_R, PZ_TORSO_D * 0.5 + 0.006 * HEX_R);
  const cordR = new THREE.Vector3(0.030 * HEX_R, PZ_TORSO_TOP + 0.018 * HEX_R, PZ_TORSO_D * 0.5 + 0.006 * HEX_R);
  const tip = new THREE.Vector3(0, wY - 0.030 * HEX_R, PZ_TORSO_D * 0.5 + 0.026 * HEX_R);
  pzStretch(group, mCord, cordL, tip, 0.007 * HEX_R);
  pzStretch(group, mCord, cordR, tip, 0.007 * HEX_R);
  const whistle = new THREE.Mesh(getPZWhistle(), mWood);
  whistle.rotation.z = Math.PI / 2;
  whistle.position.copy(tip);
  group.add(whistle);
}

/**
 * PROCA W ZAMACHU NAD GŁOWĄ — pętla PIONOWA wprost nad podniesioną pięścią
 * (patrz uzasadnienie P7 w nagłówku pliku: rozróżnienie od Huaracoc, który
 * kręci procą W POZIOMIE, w bok od ciała). Dwa rzemienie wychodzą z pięści,
 * zbiegają się w kieszonce na szczycie pętli, lekko DO PRZODU (moment tuż
 * przed wypuszczeniem pocisku w stronę celu) + pętla zaciskowa na nadgarstku.
 */
function pzSling(
  group: THREE.Group, wrist: THREE.Vector3, axis: THREE.Vector3,
  mCord: THREE.MeshStandardMaterial, mLeathDk: THREE.MeshStandardMaterial,
  mClay: THREE.MeshStandardMaterial,
): void {
  const fist = wrist.clone().addScaledVector(axis, 0.014 * HEX_R);
  // pętla zaciskowa wokół nadgarstka (funkcjonalna — bez niej proca wyleciałaby z reki)
  const loop = new THREE.Mesh(getPZLoop(), mLeathDk);
  loop.quaternion.setFromUnitVectors(PZ_Y_UP, axis);
  loop.position.copy(wrist.clone().addScaledVector(axis, -0.006 * HEX_R));
  group.add(loop);
  const loop2 = new THREE.Mesh(getPZLoop(), mLeathDk);        // drugi zwoj rzemienia na nadgarstku
  loop2.quaternion.setFromUnitVectors(PZ_Y_UP, axis);
  loop2.scale.set(0.9, 0.6, 0.9);
  loop2.position.copy(wrist.clone().addScaledVector(axis, 0.006 * HEX_R));
  group.add(loop2);

  const grA = fist.clone().add(new THREE.Vector3(-0.011 * HEX_R, 0.004 * HEX_R, 0));
  const grB = fist.clone().add(new THREE.Vector3(0.011 * HEX_R, 0.004 * HEX_R, 0));
  const pouchP = fist.clone().add(new THREE.Vector3(0, 0.098 * HEX_R, 0.034 * HEX_R));
  pzStretch(group, mCord, grA, pouchP, 0.009 * HEX_R);
  pzStretch(group, mCord, grB, pouchP, 0.009 * HEX_R);

  const pouch = new THREE.Mesh(getPZPouch(), mLeathDk);
  const yaw = Math.atan2(axis.x, axis.z);
  pouch.rotation.set(-0.45, yaw, 0);
  pouch.position.copy(pouchP);
  group.add(pouch);
  const pellet = new THREE.Mesh(getPZPellet(), mClay);        // pocisk gliniany migdałowy
  pellet.scale.set(1.0, 0.62, 1.0);
  pellet.rotation.set(-0.45, yaw, 0.3);
  pellet.position.copy(pouchP.clone().add(new THREE.Vector3(0, 0.004 * HEX_R, -0.006 * HEX_R)));
  group.add(pellet);
}

/** Zapasowe pociski gliniane w wolnej dłoni (gotowe do przeładowania). */
function pzHandPellets(
  group: THREE.Group, wrist: THREE.Vector3, axis: THREE.Vector3,
  mClay: THREE.MeshStandardMaterial, mClayLt: THREE.MeshStandardMaterial,
): void {
  const palm = wrist.clone().addScaledVector(axis, 0.020 * HEX_R);
  for (const [dx, dy, dz, lt] of ([
    [-0.014, 0.006, 0.004, false], [0.012, 0.004, -0.006, false], [0.000, 0.014, -0.002, true],
    [-0.006, 0.018, 0.008, false], [0.016, 0.016, 0.002, true], [0.004, 0.024, -0.004, false],
  ] as [number, number, number, boolean][])) {
    const p = new THREE.Mesh(getPZPellet(), lt ? mClayLt : mClay);
    p.scale.set(1.0, 0.62, 1.0);
    p.rotation.set(dx * 9, dy * 7, dz * 5);
    p.position.set(palm.x + dx * HEX_R, palm.y + dy * HEX_R, palm.z + dz * HEX_R);
    group.add(p);
  }
}

// ===========================================================================
// PROCARZ (Brąz) — OPUS 5, jednostka bazowa dystansowa dla wszystkich cywilizacji
// Naga klatka piersiowa, niebarwiona przepaska z frędzlami, bose stopy, goła
// głowa (potargane włosy). Sakwa na pociski gliniane (klapka koloru gracza)
// + bukłak z tykwy + piszczałka pasterska. PRAWA (-X) ręka unosi procę w
// PIONOWEJ pętli nad głową (dwa rzemienie + kieszonka z pociskiem); LEWA (+X)
// trzyma 3 zapasowe pociski. ZERO metalu, zero zbroi, zero insygniów.
// ===========================================================================
export function buildProcarzBrazOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin     = mat(PZ_SKIN,        0.04, 0.82);
  const mSkinDk   = mat(PZ_SKIN_DK,     0.04, 0.85);
  void PZ_SKIN_SHADE;
  const mHide     = mat(PZ_HIDE,        0.06, 0.90);
  const mHideDk   = mat(PZ_HIDE_DK,     0.06, 0.92);
  const mFringe   = mat(PZ_FRINGE,      0.06, 0.92);
  const mOwner    = mat(ownerColor_,    0.10, 0.70);
  const mLeath    = mat(PZ_LEATHER,     0.05, 0.86);
  const mLeathDk  = mat(PZ_LEATHER_DK,  0.05, 0.88);
  const mHair     = mat(PZ_HAIR,        0.04, 0.90);
  const mClay     = mat(PZ_CLAY,        0.05, 0.68);
  const mClayLt   = mat(PZ_CLAY_LT,     0.05, 0.64);
  const mBone     = mat(PZ_BONE,        0.04, 0.72);
  const mWood     = mat(PZ_WOOD,        0.05, 0.86);
  const mGourd    = mat(PZ_GOURD,       0.05, 0.88);
  const mGourdDk  = mat(PZ_GOURD_DK,    0.05, 0.90);
  const mEye      = mat(PZ_EYE,         0.05, 0.86);
  const mCord     = mat(PZ_CORD,        0.04, 0.88);

  const HIP_Y = PZ_HIP_Y - 0.010 * HEX_R;

  // ═══ KORPUS (naga klatka) + GŁOWA (gołowłosa) ════════════════════════════
  pzBuildCore(group, mSkin, mSkinDk, mEye, mHair);
  pzHair(group, mHair, mCord);

  // ═══ NOGI: lunge rzutowy (przod +X planted, tyl -X ugiety) + bose stopy ══
  pzBuildLeg(group,  PZ_HIP_X,  0.46,  0.22, mSkin, mSkinDk, HIP_Y);
  pzBuildLeg(group, -PZ_HIP_X, -0.42, -0.16, mSkin, mSkinDk, HIP_Y);

  // ═══ PRZEPASKA BIODROWA NIEBARWIONA + FRĘDZLE + SZNUR (KOLOR GRACZA) ═════
  pzSkirtSet(group, mHide, mHideDk, mFringe, mOwner);

  // ═══ SAKWA NA POCISKI (klapka koloru gracza) + BUKŁAK + PISZCZAŁKA ═══════
  pzBag(group, mLeath, mLeathDk, mOwner, mBone, mClay, mClayLt);
  pzGourd(group, mGourd, mGourdDk, mCord);
  pzWhistle(group, mWood, mCord);

  // ═══ PRAWE (-X) RAMIĘ: PROCA W ZAMACHU, PĘTLA PIONOWA NAD GŁOWĄ ══════════
  const armR = pzBuildArm(group, -PZ_SHLD_X, -2.72, -3.02, mSkin, mSkin, mSkin);
  pzSling(group, armR.wrist, armR.axis, mCord, mLeathDk, mClay);

  // ═══ LEWE (+X) RAMIĘ: 5 zapasowych pocisków w dłoni (przeładowanie) ══════
  const armL = pzBuildArm(group, PZ_SHLD_X, 0.62, 0.95, mSkin, mSkin, mSkin);
  pzHandPellets(group, armL.wrist, armL.axis, mClay, mClayLt);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

/** Zwolnienie singletonów modułu (konwencja disposeUnitGeometries z units.ts). */
export function disposeBrazProcarzOpus5Geometries(): void {
  const all: (THREE.BufferGeometry | null)[] = [
    gPZTorso, gPZChest, gPZCollar, gPZNeck, gPZHead, gPZJaw, gPZNose, gPZEar, gPZEye, gPZBrow,
    gPZTuft, gPZThigh, gPZShin, gPZSole, gPZToes, gPZUpArm, gPZForearm, gPZFist, gPZUnit,
    gPZWrap, gPZHem, gPZFringe, gPZBelt, gPZKnot,
    gPZBag, gPZBagFlap, gPZToggle, gPZPellet,
    gPZGourd, gPZGourdNk,
    gPZWhistle,
    gPZLoop, gPZPouch,
    gPZScapula, gPZAnkleWrap, gPZHeel,
  ];
  for (const g of all) { g?.dispose(); }
  gPZTorso = gPZChest = gPZCollar = gPZNeck = gPZHead = gPZJaw = gPZNose = gPZEar = gPZEye = gPZBrow = null;
  gPZTuft = gPZThigh = gPZShin = gPZSole = gPZToes = gPZUpArm = gPZForearm = gPZFist = gPZUnit = null;
  gPZWrap = gPZHem = gPZFringe = gPZBelt = gPZKnot = null;
  gPZBag = gPZBagFlap = null;
  gPZToggle = null;
  gPZPellet = null;
  gPZGourd = gPZGourdNk = null;
  gPZWhistle = null;
  gPZLoop = gPZPouch = null;
  gPZScapula = gPZAnkleWrap = gPZHeel = null;
}
