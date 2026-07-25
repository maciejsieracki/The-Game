/**
 * kamien-zulu-taran-opus5.ts — WARIANTY PORÓWNAWCZE (OPUS 5) dwóch jednostek
 * EPOKI KAMIENIA. Pliku NIE podpina się do gry — wpięcie robi koordynator.
 * ---------------------------------------------------------------------------
 * Drop-in zgodne z obecnymi builderami:
 *   buildZuluJavelineerOpus5(ownerColor)  <-> jednostki-p3-dystans.ts:511
 *                                             buildZuluJavelineer(ownerColor)
 *   buildBatteringRamOpus5(ownerColor)    <-> jednostki-p57-wlocznie-machiny.ts:584
 *                                             buildBatteringRam(ownerColor)
 *
 * Konwencje serii (bez zmian):
 *   - token PRZODEM do +Z, podstawa/stopy na y = 0 grupy,
 *   - układ prawoskrętny: LEWA ręka = +X (tarcza), PRAWA = -X (broń),
 *   - MeshStandardMaterial, group.userData['mats'] + ['perTokenGeos'],
 *   - geometrie wspólne = singletony modułu (perTokenGeos puste),
 *   - broń NA OSI dłoni (nic nie lewituje), anatomia rodziny NI_ / PD_ / WM_,
 *   - jeden slot koloru gracza (tint) — patrz sekcje „KOLOR GRACZA" niżej.
 *
 * ===========================================================================
 * ZGODNOŚĆ HISTORYCZNA — decyzje i uzasadnienia
 * ===========================================================================
 *
 * ── A. OSZCZEPNIK ZULU „IZIJULA" ───────────────────────────────────────────
 *
 * A0. RAMA CZASOWA (anachronizm świadomy, wynikający z konwencji gry).
 *     Królestwo Zulu to XIX w.; gra stawia Zulusów w epoce kamienia. Nie da
 *     się tego „naprawić" modelem — więc odwzorowuję kulturę materialną Nguni
 *     na POZIOMIE BEZ METALU: wszystko, co u historycznych Zulusów było
 *     żelazne (groty), zastąpione technologią kamienno-kostną. Reszta stroju
 *     i tarczy jest u Nguni od stuleci niezmienna i nie wymaga „cofania".
 *
 * A1. GROTY — KOŚĆ, NIE ŻELAZO/STAL. Obecny model gry używa materiału
 *     PD_STEEL (0xc2cad2) na grot oszczepu — w epoce kamienia to ANACHRONIZM.
 *     Zamieniam na grot KOŚCIANY (liściasty, dwuczęściowy) przywiązany do
 *     drzewca WIĄZANIEM ZE ŚCIĘGIEN. Kościane ostrza są dla południowej
 *     Afryki dobrze poświadczone (Blombos, Sibudu), a jasna kość czyta się
 *     z 52° lepiej niż ciemny krzemień na ciemnym drzewcu.
 *
 * A2. BROŃ = OSZCZEPY MIOTANE (isijula / assegai do rzutu), NIE iklwa.
 *     Krótka włócznia do pchnięcia (iklwa) to wynalazek Czaki (XIX w.) i
 *     należy do Impi, nie do tej jednostki. Nazwa jednostki mówi o rzucie.
 *     -> jeden oszczep w zamachu w PRAWEJ + WIĄZKA 3 zapasowych przy tarczy.
 *     Wiązka jest też zgodna ze statystykami z units.json: „Ilość pocisków:
 *     10", „Zasięg 2", „MOCNY DYSTANS — fundament siły Zulusów". Obecny
 *     model niesie JEDEN oszczep — sylwetka kłóci się z rolą jednostki.
 *
 * A3. TARCZA ISIHLANGU/IHAWU — najmocniejszy znak rozpoznawczy.
 *     Owalna (soczewkowata, zaostrzona u góry i dołu), z surowej skóry
 *     bydlęcej rasy Nguni: BIAŁO-CZARNO-BRĄZOWE ŁATY. Wzmocniona pionowym
 *     kijem UMGOBO wsuniętym z tyłu (wystaje nad i pod tarczę, na szczycie
 *     kitka futra) oraz podwójną kolumną PLECIONKI ze skórzanych rzemieni
 *     (izintsinga) przewleczonych przez dwa rzędy nacięć w osi tarczy.
 *     Obecny model ma łaty i umgobo, ale NIE MA plecionki — a to ona (razem
 *     z łatami) jest cechą, po której tarczę Nguni rozpoznaje się natychmiast.
 *     Powiększam też tarczę: obecna zasłania sam tors, isihlangu/ihawu kryje
 *     korpus od barku po kolano.
 *
 * A4. UMBO = BŁĄD, USUNIĘTE. Obecny model ma na tarczy „umbo" (wypukły
 *     przetłok w kolorze gracza). Tarcze Nguni NIE MAJĄ umba — to element
 *     śródziemnomorski (grecki/rzymski). Usuwam; kolor gracza przenoszę
 *     w miejsca autentyczne (A6).
 *
 * A5. STRÓJ: przepaska UMUTSHA — z przodu ISINENE (pasma skręconej skóry,
 *     modelowane jako 4 osobne pasma, nie jedna płyta), z tyłu IBHESHU
 *     (klapa z cielęcej skóry). Na ramionach i pod kolanami AMASHOBA (kity
 *     z krowich ogonów). Na głowie UMQHELE (opaska z futra wydry) + ISICOCO
 *     (pierścień wpleciony we włosy) + ISAKALA (dwie klapki nauszne) +
 *     3 pióra żurawia. BOSY — pełne stopy (podeszwa + palce), bez obuwia.
 *
 * A6. KOLOR GRACZA (slot tintu, zachowany): kolumna plecionki izintsinga na
 *     licu tarczy (pionowy pas na pełnej wysokości — najlepiej czytelny z
 *     góry), opaska na prawym ramieniu, listwa na umqhele, oplot wiązki
 *     zapasowych oszczepów. Zamiast (nieautentycznego) umba.
 *
 * ── B. TARAN (epoka kamienia) ──────────────────────────────────────────────
 *
 * B1. KOŁA — USUNIĘTE, ZASTĄPIONE PŁOZAMI. Obecny model stoi na 4 pełnych
 *     drewnianych krążkach z piastami i osiami. Koło pojawia się ~3500 p.n.e.
 *     (Mezopotamia/Europa), a wóz z osią jeszcze później — dla epoki kamienia
 *     to anachronizm, i to gruby, bo koło jest technologią „ikoniczną".
 *     Rozstrzygnięcie: para ciężkich PŁÓZ (sanie) z zadartymi dziobami,
 *     liny wleczenia z przodu i dwa drągi do pchania z tyłu. To rozwiązanie
 *     (a) jest bezspornie przedkołowe, (b) pasuje do statystyk — Ruch 1,
 *     „budowana podczas oblężenia (1 tura)" = machina doraźna, ciągnięta
 *     przez załogę na krótkim dystansie, (c) ODRÓŻNIA taran od Wieży
 *     Oblężniczej (epoka Brązu), która koła zachowuje — czyli koło staje się
 *     w grze czytelnym znakiem postępu epoki, a nie przypadkowym detalem.
 *
 * B2. GŁOWICA — DREWNO OPALONE + KLIN KAMIENNY NA RZEMIENIACH, nie metal
 *     i nie barani łeb. Obecny model ma tu kamienny ostrosłup (WM_STONE) —
 *     to akurat NIE jest anachronizm i zostaje, ale przerabiam go z gładkiej
 *     „nasadki maszynowej" na surowy klin przywiązany krzyżującymi się
 *     rzemieniami, poprzedzony OPALONYM (zwęglonym, ciemnym) stożkiem czoła
 *     kłody. Metalowy taran z głowicą baraniej głowy (aries) to Asyria/Rzym,
 *     ok. 2000 lat później — świadomie pominięty.
 *
 * B3. BRAK GWOŹDZI. Wszystkie połączenia (płozy-poprzeczki, nogi kozła,
 *     kalenica, żerdzie daszku) mają WIDOCZNE WIĄZANIA z rzemieni/sznura
 *     roślinnego. Obecny model łączy belki „na styk", bez żadnego wiązania —
 *     wizualnie sugeruje ciesiołkę czopową albo gwoździe.
 *
 * B4. KŁODA = PIEŃ, nie toczony wałek. Zbieżysta (grubsza od czoła, gdzie
 *     jest masa uderzenia), z KIKUTAMI ODCIĘTYCH KONARÓW i pierścieniem
 *     kory. Zawieszona na dwóch skórzanych kołyskach i czterech pęczkach lin
 *     ze ścięgien pod kalenicą — w wychyle ku +Z (rozpęd), jak w obecnym.
 *
 * B5. DASZEK ZE SKÓR na żerdziach — zostaje (obecny model ma go i słusznie:
 *     to najprostsza możliwa osłona załogi). Wzbogacony o łaty zszywane
 *     rzemieniem, gałęziowe łaty poprzeczne i zwis z boków oraz z tyłu.
 *
 * B6. KOLOR GRACZA (slot tintu, zachowany): proporzec ze skóry na maszcie
 *     rufowym + malowana płachta skóry na burcie + dwa oploty na kłodzie.
 *     (Obecny: proporczyk + tarczka na burcie — tarczkę zamieniam na płachtę,
 *     bo okrągła „tarczka" na machinie epoki kamienia to element zbędny.)
 *
 * ===========================================================================
 * BUDŻET (policzony traversem, STARY -> OPUS 5):
 *   Zulu   36 mesh /  454 tri / 10 mat  ->  84 mesh / 1302 tri / 16 mat
 *   Taran  40 mesh /  596 tri /  9 mat  ->  85 mesh / 1244 tri / 14 mat
 *   Wzorzec: hastati-opus5.ts — 92 mesh / 1378 tri.
 *
 * GABARYTY (bbox X x Y x Z, w HEX_R; token nieskalowany w dispatchu):
 *   Zulu   0.483 x 0.715 x 0.495  ->  0.499 x 0.738 x 0.426
 *          (wyższy o 3% przez pióropusz i wyżej wzniesiony oszczep;
 *           płytszy, bo wiązka zapasowych idzie w GÓRĘ-w tył, nie w bok)
 *   Taran  0.358 x 0.558 x 0.454  ->  0.349 x 0.610 x 0.564
 *          (Z +24%: płozy z zadartymi dziobami + drągi do pchania zajmują
 *           miejsce, którego koła nie zajmowały; X i tak zmalał)
 * ===========================================================================
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

const KZ_Y_UP = new THREE.Vector3(0, 1, 0);

// ═══════════════════════════════════════════════════════════════════════════
// CZĘŚĆ A — OSZCZEPNIK ZULU (IZIJULA)
// ═══════════════════════════════════════════════════════════════════════════

// ── paleta (bazowo zgodna z jednostki-p3-dystans.ts, +barwy kości/skór) ────
const KZ_SKIN       = 0xb06030;   // skóra Zulu (jak stary token)
const KZ_SKIN_DK    = 0x8f4c25;   // cień żuchwy / dłonie / stopy
const KZ_BONE       = 0xe4dcc0;   // GROT KOŚCIANY (zamiast PD_STEEL — pkt A1)
const KZ_BONE_DK    = 0xc9bf9c;   // cień grotu / osadzenie
const KZ_SINEW      = 0xd8c8a4;   // wiązanie ze ścięgien
const KZ_WOOD       = 0x7a5c3a;   // drzewce oszczepu
const KZ_WOOD_LT    = 0x8f6c42;   // umgobo (kij tarczy) — jaśniejszy, czytelny
const KZ_HIDE_BRN   = 0x8a3a26;   // skóra bydlęca tarczy (jak stara)
const KZ_HIDE_BRN_D = 0x6a2b1c;   // rant/plecy tarczy
const KZ_HIDE_WHT   = 0xeae3d2;   // białe łaty Nguni / pióra
const KZ_HIDE_BLK   = 0x241a12;   // czarne łaty Nguni
const KZ_FUR_DK     = 0x3a2214;   // umqhele (futro wydry)
const KZ_FUR_LT     = 0x6b4a28;   // isinene / rzemienie
const KZ_HAIR_DK    = 0x1a0c06;   // włosy / isicoco
const KZ_LOIN_DK    = 0x3a2810;   // ibheshu

// ── wymiary sylwetki: rodzina PD_* / NI_* / HO_* (porównywalność 1:1) ──────
const KZ_HIP_Y     = 0.208 * HEX_R;
const KZ_TORSO_W   = 0.180 * HEX_R;
const KZ_TORSO_H   = 0.205 * HEX_R;
const KZ_TORSO_D   = 0.100 * HEX_R;
const KZ_TORSO_BOT = 0.240 * HEX_R;
const KZ_TORSO_CTR = KZ_TORSO_BOT + KZ_TORSO_H * 0.5;
const KZ_TORSO_TOP = KZ_TORSO_BOT + KZ_TORSO_H;
const KZ_NECK_H    = 0.028 * HEX_R;
const KZ_HEAD_S    = 0.128 * HEX_R;
const KZ_HEAD_CTR  = KZ_TORSO_TOP + KZ_NECK_H + KZ_HEAD_S * 0.5;
const KZ_HEAD_TOP  = KZ_TORSO_TOP + KZ_NECK_H + KZ_HEAD_S;
const KZ_SHLD_X    = KZ_TORSO_W * 0.5 + 0.030 * HEX_R;
const KZ_SHLD_Y    = KZ_TORSO_TOP - 0.024 * HEX_R;
const KZ_HIP_X     = 0.052 * HEX_R;

const KZ_THIGH_L   = 0.104 * HEX_R;
const KZ_SHIN_L    = 0.096 * HEX_R;
const KZ_UPARM_L   = 0.100 * HEX_R;
const KZ_FOREARM_L = 0.092 * HEX_R;

// ── TARCZA NGUNI: soczewkowaty owal, zaostrzony u góry i dołu ──────────────
// x = a*sign(cos)*|cos|^p  (p>1 => końce SPICZASTE, nie eliptyczne),
// y = b*sin,  z = -c*(x/a)^2  (lekka wypukłość ku niosącemu).
const KZ_SH_N = 16;
const KZ_SH_A = 0.108 * HEX_R;   // półoś pozioma
const KZ_SH_B = 0.212 * HEX_R;   // półoś pionowa (duża tarcza — pkt A3)
const KZ_SH_C = 0.044 * HEX_R;   // głębokość łuku
const KZ_SH_T = 0.018 * HEX_R;   // grubość skorupy
const KZ_SH_P = 1.32;            // wykładnik „spiczastości" końców

function kzNguniRing(a: number, b: number, c: number, N: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2 + Math.PI / 2;   // wierzchołek na górze
    const cx = Math.cos(ang);
    const x = a * Math.sign(cx) * Math.pow(Math.abs(cx), KZ_SH_P);
    const y = b * Math.sin(ang);
    pts.push([x, y, -c * (x / a) * (x / a)]);
  }
  return pts;
}

function kzShellGeo(a: number, b: number, c: number, t: number, N: number): THREE.BufferGeometry {
  const ring = kzNguniRing(a, b, c, N);
  const pos: number[] = [];
  const P = (x: number, y: number, z: number): void => { pos.push(x, y, z); };
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

function kzFaceGeo(a: number, b: number, c: number, N: number): THREE.BufferGeometry {
  const ring = kzNguniRing(a, b, c, N);
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

// ── geometrie-singletony (Zulu) ────────────────────────────────────────────
let gKZTorso:   THREE.BoxGeometry | null = null;
let gKZChest:   THREE.BoxGeometry | null = null;
let gKZWaist:   THREE.BoxGeometry | null = null;
let gKZNeck:    THREE.BoxGeometry | null = null;
let gKZHead:    THREE.BoxGeometry | null = null;
let gKZJaw:     THREE.BoxGeometry | null = null;
let gKZNose:    THREE.BoxGeometry | null = null;
let gKZEye:     THREE.BoxGeometry | null = null;
let gKZThigh:   THREE.BoxGeometry | null = null;
let gKZShin:    THREE.BoxGeometry | null = null;
let gKZUpArm:   THREE.BoxGeometry | null = null;
let gKZForearm: THREE.BoxGeometry | null = null;
let gKZFist:    THREE.BoxGeometry | null = null;
let gKZSole:    THREE.BoxGeometry | null = null;
let gKZToes:    THREE.BoxGeometry | null = null;
// nakrycie głowy
let gKZHair:    THREE.CylinderGeometry | null = null;
let gKZRing:    THREE.CylinderGeometry | null = null;   // isicoco
let gKZBand:    THREE.CylinderGeometry | null = null;   // umqhele
let gKZBandTag: THREE.BoxGeometry | null = null;        // listwa koloru gracza
let gKZEarFlap: THREE.BoxGeometry | null = null;        // isakala
let gKZFeather: THREE.BoxGeometry | null = null;
let gKZFeatTip: THREE.BoxGeometry | null = null;
// strój
let gKZBelt:    THREE.BoxGeometry | null = null;
let gKZIsinene: THREE.BoxGeometry | null = null;
let gKZBheshu:  THREE.BoxGeometry | null = null;
let gKZTuft:    THREE.CylinderGeometry | null = null;   // amashoba (rdzeń)
let gKZTuftEnd: THREE.CylinderGeometry | null = null;   // amashoba (kiść)
let gKZArmBand: THREE.CylinderGeometry | null = null;
// oszczep
let gKZJavShaft: THREE.CylinderGeometry | null = null;
let gKZJavButt:  THREE.CylinderGeometry | null = null;
let gKZJavLash:  THREE.CylinderGeometry | null = null;
let gKZJavBlade: THREE.BoxGeometry | null = null;
let gKZJavTip:   THREE.ConeGeometry | null = null;
let gKZSpShaft:  THREE.CylinderGeometry | null = null;  // zapasowe (wiązka)
let gKZSpTip:    THREE.ConeGeometry | null = null;
let gKZSpWrap:   THREE.CylinderGeometry | null = null;
// tarcza
let gKZShell:   THREE.BufferGeometry | null = null;
let gKZFace:    THREE.BufferGeometry | null = null;
let gKZPatch:   THREE.CircleGeometry | null = null;
let gKZUmgobo:  THREE.CylinderGeometry | null = null;
let gKZUmgTuft: THREE.CylinderGeometry | null = null;
let gKZLace:    THREE.BoxGeometry | null = null;
let gKZLaceCol: THREE.BoxGeometry | null = null;
let gKZGripBar: THREE.BoxGeometry | null = null;
let gKZPorpax:  THREE.BoxGeometry | null = null;

function getKZTorso():   THREE.BoxGeometry { return (gKZTorso   ||= new THREE.BoxGeometry(KZ_TORSO_W, KZ_TORSO_H, KZ_TORSO_D)); }
function getKZChest():   THREE.BoxGeometry { return (gKZChest   ||= new THREE.BoxGeometry(KZ_TORSO_W * 1.05, 0.068 * HEX_R, KZ_TORSO_D * 1.08)); }
function getKZWaist():   THREE.BoxGeometry { return (gKZWaist   ||= new THREE.BoxGeometry(KZ_TORSO_W * 0.86, 0.052 * HEX_R, KZ_TORSO_D * 0.90)); }
function getKZNeck():    THREE.BoxGeometry { return (gKZNeck    ||= new THREE.BoxGeometry(0.042 * HEX_R, KZ_NECK_H * 1.6, 0.042 * HEX_R)); }
function getKZHead():    THREE.BoxGeometry { return (gKZHead    ||= new THREE.BoxGeometry(KZ_HEAD_S, KZ_HEAD_S, KZ_HEAD_S)); }
function getKZJaw():     THREE.BoxGeometry { return (gKZJaw     ||= new THREE.BoxGeometry(0.086 * HEX_R, 0.034 * HEX_R, 0.038 * HEX_R)); }
function getKZNose():    THREE.BoxGeometry { return (gKZNose    ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.024 * HEX_R, 0.016 * HEX_R)); }
function getKZEye():     THREE.BoxGeometry { return (gKZEye     ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.011 * HEX_R, 0.008 * HEX_R)); }
function getKZThigh():   THREE.BoxGeometry { return (gKZThigh   ||= new THREE.BoxGeometry(0.056 * HEX_R, KZ_THIGH_L, 0.060 * HEX_R)); }
function getKZShin():    THREE.BoxGeometry { return (gKZShin    ||= new THREE.BoxGeometry(0.038 * HEX_R, KZ_SHIN_L, 0.042 * HEX_R)); }
function getKZUpArm():   THREE.BoxGeometry { return (gKZUpArm   ||= new THREE.BoxGeometry(0.054 * HEX_R, KZ_UPARM_L, 0.054 * HEX_R)); }
function getKZForearm(): THREE.BoxGeometry { return (gKZForearm ||= new THREE.BoxGeometry(0.040 * HEX_R, KZ_FOREARM_L, 0.040 * HEX_R)); }
function getKZFist():    THREE.BoxGeometry { return (gKZFist    ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)); }
function getKZSole():    THREE.BoxGeometry { return (gKZSole    ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.018 * HEX_R, 0.078 * HEX_R)); }
function getKZToes():    THREE.BoxGeometry { return (gKZToes    ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.014 * HEX_R, 0.024 * HEX_R)); }
function getKZHair():    THREE.CylinderGeometry { return (gKZHair    ||= new THREE.CylinderGeometry(0.056 * HEX_R, 0.070 * HEX_R, 0.052 * HEX_R, 8, 1)); }
function getKZRing():    THREE.CylinderGeometry { return (gKZRing    ||= new THREE.CylinderGeometry(0.062 * HEX_R, 0.062 * HEX_R, 0.014 * HEX_R, 8, 1)); }
function getKZBand():    THREE.CylinderGeometry { return (gKZBand    ||= new THREE.CylinderGeometry(0.072 * HEX_R, 0.076 * HEX_R, 0.030 * HEX_R, 8, 1)); }
function getKZBandTag(): THREE.BoxGeometry { return (gKZBandTag ||= new THREE.BoxGeometry(0.052 * HEX_R, 0.020 * HEX_R, 0.014 * HEX_R)); }
function getKZEarFlap(): THREE.BoxGeometry { return (gKZEarFlap ||= new THREE.BoxGeometry(0.014 * HEX_R, 0.044 * HEX_R, 0.036 * HEX_R)); }
function getKZFeather(): THREE.BoxGeometry { return (gKZFeather ||= new THREE.BoxGeometry(0.017 * HEX_R, 0.082 * HEX_R, 0.009 * HEX_R)); }
function getKZFeatTip(): THREE.BoxGeometry { return (gKZFeatTip ||= new THREE.BoxGeometry(0.011 * HEX_R, 0.030 * HEX_R, 0.007 * HEX_R)); }
function getKZBelt():    THREE.BoxGeometry { return (gKZBelt    ||= new THREE.BoxGeometry(0.176 * HEX_R, 0.024 * HEX_R, 0.110 * HEX_R)); }
function getKZIsinene(): THREE.BoxGeometry { return (gKZIsinene ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.086 * HEX_R, 0.018 * HEX_R)); }
function getKZBheshu():  THREE.BoxGeometry { return (gKZBheshu  ||= new THREE.BoxGeometry(0.118 * HEX_R, 0.104 * HEX_R, 0.020 * HEX_R)); }
function getKZTuft():    THREE.CylinderGeometry { return (gKZTuft    ||= new THREE.CylinderGeometry(0.016 * HEX_R, 0.028 * HEX_R, 0.044 * HEX_R, 6, 1)); }
function getKZTuftEnd(): THREE.CylinderGeometry { return (gKZTuftEnd ||= new THREE.CylinderGeometry(0.026 * HEX_R, 0.010 * HEX_R, 0.032 * HEX_R, 6, 1)); }
function getKZArmBand(): THREE.CylinderGeometry { return (gKZArmBand ||= new THREE.CylinderGeometry(0.034 * HEX_R, 0.034 * HEX_R, 0.020 * HEX_R, 8, 1)); }
function getKZJavShaft(): THREE.CylinderGeometry { return (gKZJavShaft ||= new THREE.CylinderGeometry(0.0085 * HEX_R, 0.0110 * HEX_R, 0.300 * HEX_R, 6, 1)); }
function getKZJavButt():  THREE.CylinderGeometry { return (gKZJavButt  ||= new THREE.CylinderGeometry(0.0130 * HEX_R, 0.0090 * HEX_R, 0.022 * HEX_R, 6, 1)); }
function getKZJavLash():  THREE.CylinderGeometry { return (gKZJavLash  ||= new THREE.CylinderGeometry(0.0135 * HEX_R, 0.0135 * HEX_R, 0.016 * HEX_R, 6, 1)); }
function getKZJavBlade(): THREE.BoxGeometry { return (gKZJavBlade ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.052 * HEX_R, 0.010 * HEX_R)); }
function getKZJavTip():   THREE.ConeGeometry { return (gKZJavTip   ||= new THREE.ConeGeometry(0.016 * HEX_R, 0.040 * HEX_R, 4)); }
function getKZSpShaft():  THREE.CylinderGeometry { return (gKZSpShaft  ||= new THREE.CylinderGeometry(0.0075 * HEX_R, 0.0095 * HEX_R, 0.270 * HEX_R, 5, 1)); }
function getKZSpTip():    THREE.ConeGeometry { return (gKZSpTip    ||= new THREE.ConeGeometry(0.014 * HEX_R, 0.048 * HEX_R, 4)); }
function getKZSpWrap():   THREE.CylinderGeometry { return (gKZSpWrap   ||= new THREE.CylinderGeometry(0.026 * HEX_R, 0.026 * HEX_R, 0.018 * HEX_R, 6, 1)); }
function getKZShell():   THREE.BufferGeometry { return (gKZShell   ||= kzShellGeo(KZ_SH_A, KZ_SH_B, KZ_SH_C, KZ_SH_T, KZ_SH_N)); }
function getKZFace():    THREE.BufferGeometry { return (gKZFace    ||= kzFaceGeo(KZ_SH_A * 0.94, KZ_SH_B * 0.94, KZ_SH_C * 0.82, KZ_SH_N)); }
function getKZPatch():   THREE.CircleGeometry { return (gKZPatch   ||= new THREE.CircleGeometry(0.040 * HEX_R, 7)); }
function getKZUmgobo():  THREE.CylinderGeometry { return (gKZUmgobo  ||= new THREE.CylinderGeometry(0.0105 * HEX_R, 0.0125 * HEX_R, 0.520 * HEX_R, 6, 1)); }
function getKZUmgTuft(): THREE.CylinderGeometry { return (gKZUmgTuft ||= new THREE.CylinderGeometry(0.024 * HEX_R, 0.008 * HEX_R, 0.046 * HEX_R, 6, 1)); }
function getKZLace():    THREE.BoxGeometry { return (gKZLace    ||= new THREE.BoxGeometry(0.052 * HEX_R, 0.011 * HEX_R, 0.009 * HEX_R)); }
function getKZLaceCol(): THREE.BoxGeometry { return (gKZLaceCol ||= new THREE.BoxGeometry(0.034 * HEX_R, 0.300 * HEX_R, 0.008 * HEX_R)); }
function getKZGripBar(): THREE.BoxGeometry { return (gKZGripBar ||= new THREE.BoxGeometry(0.014 * HEX_R, 0.070 * HEX_R, 0.016 * HEX_R)); }
function getKZPorpax():  THREE.BoxGeometry { return (gKZPorpax  ||= new THREE.BoxGeometry(0.062 * HEX_R, 0.018 * HEX_R, 0.010 * HEX_R)); }

// ── kinematyka (konwencja rodziny: theta od pionu w dół, + = ku +Z) ────────
function kzDirDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}

function kzSeg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = kzDirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

/** Segment po dowolnym kierunku (do IK ramion). */
function kzSegDir(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, dir: THREE.Vector3, len: number,
): THREE.Vector3 {
  const mesh = new THREE.Mesh(geo, mtl);
  if (dir.y < -0.9999) mesh.rotation.x = Math.PI;
  else mesh.quaternion.setFromUnitVectors(KZ_Y_UP, dir);
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

/** Ramię 2-segmentowe IK (bark -> łokieć -> dłoń), biegun łokcia zadawany. */
function kzArmIK(
  group: THREE.Group, S: THREE.Vector3, T: THREE.Vector3, pole: THREE.Vector3,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { hand: THREE.Vector3; axis: THREE.Vector3 } {
  const L1 = KZ_UPARM_L, L2 = KZ_FOREARM_L;
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
  kzSegDir(group, getKZUpArm(), mUp, S, dU, L1);
  const elbow = S.clone().addScaledVector(dU, L1);
  const axis = T.clone().sub(elbow).normalize();
  const hand = kzSegDir(group, getKZForearm(), mFore, elbow, axis, L2);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getKZFist(), mFist);
    if (axis.y < -0.9999) fist.rotation.x = Math.PI;
    else fist.quaternion.setFromUnitVectors(KZ_Y_UP, axis);
    fist.position.copy(hand.clone().addScaledVector(axis, 0.012 * HEX_R));
    group.add(fist);
  }
  return { hand, axis };
}

/** Noga BOSA: udo + goleń + stopa (podeszwa + palce) płasko na y = 0. */
function kzBuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mLimb: THREE.MeshStandardMaterial, mFoot: THREE.MeshStandardMaterial, hipY: number,
): THREE.Vector3 {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = kzSeg(group, getKZThigh(), mLimb, P, thU, KZ_THIGH_L);
  P.z -= 0.004 * HEX_R; P.y += 0.008 * HEX_R;
  P = kzSeg(group, getKZShin(), mLimb, P, thL, KZ_SHIN_L);
  const footZ = P.z + 0.014 * HEX_R;
  const sole = new THREE.Mesh(getKZSole(), mFoot);
  sole.position.set(sx, 0.009 * HEX_R, footZ);
  group.add(sole);
  const toes = new THREE.Mesh(getKZToes(), mFoot);
  toes.position.set(sx, 0.007 * HEX_R, footZ + 0.046 * HEX_R);
  group.add(toes);
  return P;
}

/** AMASHOBA — kita z krowiego ogona (2 mesh: nasada + kiść). */
function kzAmashoba(
  group: THREE.Group, x: number, y: number, z: number, rz: number,
  mA: THREE.MeshStandardMaterial, mB: THREE.MeshStandardMaterial, sc: number,
): void {
  const base = new THREE.Mesh(getKZTuft(), mA);
  base.rotation.z = rz;
  base.scale.setScalar(sc);
  base.position.set(x, y, z);
  group.add(base);
  const end = new THREE.Mesh(getKZTuftEnd(), mB);
  end.rotation.z = rz;
  end.scale.setScalar(sc);
  end.position.set(x + Math.sin(rz) * 0.030 * HEX_R * sc, y - 0.034 * HEX_R * sc, z);
  group.add(end);
}

// ---------------------------------------------------------------------------
// OSZCZEPNIK ZULU (IZIJULA) — wariant OPUS 5.
// Poza jak w rodzinie: głęboki wykrok, ZAMACH oszczepem nad barkiem (PRAWA,
// -X), duża tarcza Nguni przed korpusem na LEWEJ (+X) + wiązka zapasowych
// oszczepów. Groty KOŚCIANE (pkt A1), tarcza z plecionką (pkt A3), bez umba
// (pkt A4). Kolor gracza: kolumna plecionki + opaska na ramieniu + listwa
// umqhele + oplot wiązki (pkt A6).
// ---------------------------------------------------------------------------
export function buildZuluJavelineerOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin   = mat(KZ_SKIN,      0.05, 0.80);
  const mSkinDk = mat(KZ_SKIN_DK,   0.05, 0.82);
  const mBone   = mat(KZ_BONE,      0.06, 0.62);
  const mBoneDk = mat(KZ_BONE_DK,   0.05, 0.70);
  const mSinew  = mat(KZ_SINEW,     0.03, 0.88);
  const mWood   = mat(KZ_WOOD,      0.05, 0.85);
  const mWoodLt = mat(KZ_WOOD_LT,   0.05, 0.82);
  const mHide   = mat(KZ_HIDE_BRN,  0.04, 0.90);
  const mHideDk = mat(KZ_HIDE_BRN_D, 0.04, 0.92);
  const mWhite  = mat(KZ_HIDE_WHT,  0.03, 0.92);
  const mBlack  = mat(KZ_HIDE_BLK,  0.04, 0.90);
  const mFur    = mat(KZ_FUR_DK,    0.04, 0.92);
  const mFurLt  = mat(KZ_FUR_LT,    0.05, 0.88);
  const mHair   = mat(KZ_HAIR_DK,   0.04, 0.90);
  const mLoin   = mat(KZ_LOIN_DK,   0.05, 0.88);
  const mOwner  = mat(ownerColor_,  0.10, 0.68);

  const HIP = KZ_HIP_Y - 0.014 * HEX_R;   // głęboki wypad

  // ═══ KORPUS (nagi tors — skóra) ══════════════════════════════════════════
  const torso = new THREE.Mesh(getKZTorso(), mSkin);
  torso.position.set(0, KZ_TORSO_CTR, 0);
  group.add(torso);
  const chest = new THREE.Mesh(getKZChest(), mSkin);
  chest.position.set(0, KZ_TORSO_TOP - 0.036 * HEX_R, 0);
  group.add(chest);
  const waist = new THREE.Mesh(getKZWaist(), mSkin);
  waist.position.set(0, KZ_TORSO_BOT + 0.024 * HEX_R, 0);
  group.add(waist);
  const neck = new THREE.Mesh(getKZNeck(), mSkin);
  neck.position.set(0, KZ_TORSO_TOP + KZ_NECK_H * 0.5, 0);
  group.add(neck);

  // ═══ GŁOWA + TWARZ ═══════════════════════════════════════════════════════
  const head = new THREE.Mesh(getKZHead(), mSkin);
  head.position.set(0, KZ_HEAD_CTR, 0);
  group.add(head);
  const jaw = new THREE.Mesh(getKZJaw(), mSkinDk);
  jaw.position.set(0, KZ_HEAD_CTR - KZ_HEAD_S * 0.38, 0.010 * HEX_R);
  group.add(jaw);
  const nose = new THREE.Mesh(getKZNose(), mSkin);
  nose.position.set(0, KZ_HEAD_CTR - 0.004 * HEX_R, KZ_HEAD_S * 0.5 + 0.006 * HEX_R);
  group.add(nose);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(getKZEye(), mHair);
    eye.position.set(sx * 0.026 * HEX_R, KZ_HEAD_CTR + 0.016 * HEX_R, KZ_HEAD_S * 0.5 + 0.002 * HEX_R);
    group.add(eye);
  }

  // ═══ NAKRYCIE GŁOWY: włosy + ISICOCO + UMQHELE + ISAKALA + pióra ═════════
  const hair = new THREE.Mesh(getKZHair(), mHair);
  hair.position.set(0, KZ_HEAD_TOP - 0.008 * HEX_R, 0);
  group.add(hair);
  const isicoco = new THREE.Mesh(getKZRing(), mHair);        // pierścień we włosach
  isicoco.position.set(0, KZ_HEAD_TOP + 0.016 * HEX_R, 0);
  group.add(isicoco);
  const umqhele = new THREE.Mesh(getKZBand(), mFur);         // opaska z futra wydry
  umqhele.position.set(0, KZ_HEAD_CTR + 0.042 * HEX_R, 0);
  group.add(umqhele);
  const bandTag = new THREE.Mesh(getKZBandTag(), mOwner);    // KOLOR GRACZA (czoło)
  bandTag.position.set(0, KZ_HEAD_CTR + 0.042 * HEX_R, 0.070 * HEX_R);
  group.add(bandTag);
  for (const sx of [-1, 1]) {                               // isakala (klapki uszne)
    const flap = new THREE.Mesh(getKZEarFlap(), mFur);
    flap.rotation.z = sx * 0.20;
    flap.position.set(sx * 0.074 * HEX_R, KZ_HEAD_CTR + 0.014 * HEX_R, 0.004 * HEX_R);
    group.add(flap);
  }
  for (const sx of [-1, 0, 1]) {                            // 3 pióra żurawia
    const y0 = KZ_HEAD_TOP + (sx === 0 ? 0.068 : 0.054) * HEX_R;
    const f = new THREE.Mesh(getKZFeather(), mWhite);
    f.rotation.z = -sx * 0.20;
    f.rotation.x = -0.10;
    f.position.set(sx * 0.030 * HEX_R, y0, -0.010 * HEX_R);
    group.add(f);
    const ft = new THREE.Mesh(getKZFeatTip(), mWhite);
    ft.rotation.z = -sx * 0.20;
    ft.rotation.x = -0.10;
    ft.position.set(sx * 0.041 * HEX_R, y0 + 0.054 * HEX_R, -0.016 * HEX_R);
    group.add(ft);
  }

  // ═══ UMUTSHA: pas + ISINENE (4 pasma z przodu) + IBHESHU (klapa z tyłu) ══
  const belt = new THREE.Mesh(getKZBelt(), mFurLt);
  belt.position.set(0, KZ_TORSO_BOT - 0.006 * HEX_R, 0);
  group.add(belt);
  for (const sx of [-1.5, -0.5, 0.5, 1.5]) {
    const strip = new THREE.Mesh(getKZIsinene(), sx < 0 ? mFur : mFurLt);
    strip.rotation.z = sx * 0.05;
    strip.position.set(sx * 0.028 * HEX_R, KZ_TORSO_BOT - 0.060 * HEX_R,
                       KZ_TORSO_D * 0.5 + 0.004 * HEX_R);
    group.add(strip);
  }
  const bheshu = new THREE.Mesh(getKZBheshu(), mLoin);
  bheshu.rotation.x = -0.14;
  bheshu.position.set(0, KZ_TORSO_BOT - 0.056 * HEX_R, -(KZ_TORSO_D * 0.5 + 0.012 * HEX_R));
  group.add(bheshu);

  // ═══ NOGI BOSE: LEWA (+X) wykroczna, PRAWA (-X) zakroczna ════════════════
  kzBuildLeg(group,  KZ_HIP_X,  0.62,  0.36, mSkin, mSkinDk, HIP);
  kzBuildLeg(group, -KZ_HIP_X, -0.55, -0.22, mSkin, mSkinDk, HIP);
  // AMASHOBA pod kolanami
  kzAmashoba(group,  KZ_HIP_X, 0.118 * HEX_R,  0.086 * HEX_R,  0.10, mWhite, mWhite, 0.90);
  kzAmashoba(group, -KZ_HIP_X, 0.118 * HEX_R, -0.072 * HEX_R, -0.10, mWhite, mWhite, 0.90);

  // ═══ PRAWE (-X) RAMIĘ — ZAMACH, oszczep NA OSI dłoni ═════════════════════
  const armR = kzArmIK(group,
    new THREE.Vector3(-KZ_SHLD_X, KZ_SHLD_Y, 0),
    new THREE.Vector3(-0.150 * HEX_R, 0.560 * HEX_R, -0.058 * HEX_R),
    new THREE.Vector3(-0.85, 0.10, -0.52), mSkin, mSkin, mSkinDk);
  const JAV_D = new THREE.Vector3(0.05, -0.07, 0.996).normalize();
  const grip = armR.hand.clone();
  const atJ = (d: number): THREE.Vector3 => grip.clone().addScaledVector(JAV_D, d * HEX_R);
  const qJav = new THREE.Quaternion().setFromUnitVectors(KZ_Y_UP, JAV_D);

  const jShaft = new THREE.Mesh(getKZJavShaft(), mWood);     // drzewce (zbieżne)
  jShaft.quaternion.copy(qJav);
  jShaft.position.copy(atJ(0.088));
  group.add(jShaft);
  const jButt = new THREE.Mesh(getKZJavButt(), mWood);       // zgrubienie piętki
  jButt.quaternion.copy(qJav);
  jButt.position.copy(atJ(-0.072));
  group.add(jButt);
  for (const d of [0.216, 0.244]) {                          // WIĄZANIE ZE ŚCIĘGIEN
    const lash = new THREE.Mesh(getKZJavLash(), mSinew);
    lash.quaternion.copy(qJav);
    lash.position.copy(atJ(d));
    group.add(lash);
  }
  const jBlade = new THREE.Mesh(getKZJavBlade(), mBone);     // GROT KOŚCIANY (liść)
  jBlade.quaternion.copy(qJav);
  jBlade.position.copy(atJ(0.278));
  group.add(jBlade);
  const jBladeDk = new THREE.Mesh(getKZJavBlade(), mBoneDk); // żeberko grotu
  jBladeDk.quaternion.copy(qJav);
  jBladeDk.scale.set(0.34, 0.94, 1.30);
  jBladeDk.position.copy(atJ(0.278));
  group.add(jBladeDk);
  const jTip = new THREE.Mesh(getKZJavTip(), mBone);
  jTip.quaternion.copy(qJav);
  jTip.rotation.y += Math.PI / 4;
  jTip.position.copy(atJ(0.322));
  group.add(jTip);
  // amashoba + OPASKA KOLORU GRACZA na prawym ramieniu
  kzAmashoba(group, -KZ_SHLD_X - 0.014 * HEX_R, KZ_SHLD_Y + 0.020 * HEX_R, 0, -0.30,
             mWhite, mWhite, 1.0);
  const bandR = new THREE.Mesh(getKZArmBand(), mOwner);
  bandR.rotation.z = -0.95;
  bandR.position.set(-KZ_SHLD_X - 0.026 * HEX_R, KZ_SHLD_Y - 0.024 * HEX_R, -0.012 * HEX_R);
  group.add(bandR);

  // ═══ LEWE (+X) RAMIĘ + TARCZA ISIHLANGU/IHAWU ════════════════════════════
  const armL = kzArmIK(group,
    new THREE.Vector3(KZ_SHLD_X, KZ_SHLD_Y, 0),
    new THREE.Vector3(0.150 * HEX_R, 0.300 * HEX_R, 0.100 * HEX_R),
    new THREE.Vector3(0.85, -0.20, 0.15), mSkin, mSkin, null);
  kzAmashoba(group, KZ_SHLD_X + 0.014 * HEX_R, KZ_SHLD_Y + 0.018 * HEX_R, 0, 0.30,
             mWhite, mWhite, 1.0);

  const sh = new THREE.Group();
  sh.position.set(
    armL.hand.x + 0.012 * HEX_R,
    armL.hand.y + 0.052 * HEX_R,
    armL.hand.z + 0.034 * HEX_R,
  );
  sh.rotation.y = -0.18;
  sh.rotation.z = 0.05;

  const shell = new THREE.Mesh(getKZShell(), mHideDk);        // rant + plecy
  sh.add(shell);
  const face = new THREE.Mesh(getKZFace(), mHide);            // lico: skóra bydlęca
  face.position.set(0, 0, 0.010 * HEX_R);
  sh.add(face);

  // ŁATY NGUNI — biel + czerń, asymetrycznie (pkt A3: znak rozpoznawczy)
  const patches: [number, number, number, number, number, boolean][] = [
    // x,      y,      rot,   sx,   sy,   czarna?
    [-0.040,  0.104, 0.34, 0.72, 1.05, false],
    [ 0.044,  0.030, -0.28, 0.98, 0.74, false],
    [-0.030, -0.058, 0.52, 0.86, 1.02, false],
    [ 0.028, -0.132, -0.40, 0.66, 0.80, false],
    [ 0.012,  0.152, 0.18, 0.52, 0.58, true ],
    [-0.052, -0.016, -0.60, 0.44, 0.66, true ],
  ];
  for (const [px, py, rz, sx, sy, blk] of patches) {
    const p = new THREE.Mesh(getKZPatch(), blk ? mBlack : mWhite);
    p.rotation.z = rz;
    p.scale.set(sx, sy, 1.0);
    p.position.set(px * HEX_R, py * HEX_R, 0.018 * HEX_R);
    sh.add(p);
  }

  // PLECIONKA IZINTSINGA — podwójna kolumna rzemieni w osi tarczy.
  // Pas nośny = KOLOR GRACZA (slot tintu w miejsce nieautentycznego umba).
  const laceCol = new THREE.Mesh(getKZLaceCol(), mOwner);
  laceCol.position.set(0, 0.006 * HEX_R, 0.022 * HEX_R);
  sh.add(laceCol);
  for (let i = 0; i < 8; i++) {
    const ly = (-0.128 + i * 0.037) * HEX_R;
    const l = new THREE.Mesh(getKZLace(), i % 2 === 0 ? mFurLt : mHideDk);
    l.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.24;
    l.position.set(0, ly, 0.028 * HEX_R);
    sh.add(l);
  }

  // UMGOBO — pionowy kij z tyłu, wystaje nad i pod tarczę, kitka na szczycie
  const umgobo = new THREE.Mesh(getKZUmgobo(), mWoodLt);
  umgobo.position.set(0, 0.014 * HEX_R, -0.020 * HEX_R);
  sh.add(umgobo);
  const umgTuft = new THREE.Mesh(getKZUmgTuft(), mFur);
  umgTuft.position.set(0, 0.290 * HEX_R, -0.020 * HEX_R);
  sh.add(umgTuft);

  // chwyt: porpax skórzany + poprzeczka za licem (ręka ma czego trzymać)
  const porpax = new THREE.Mesh(getKZPorpax(), mFurLt);
  porpax.position.set(0, 0.014 * HEX_R, -0.036 * HEX_R);
  sh.add(porpax);
  const gripBar = new THREE.Mesh(getKZGripBar(), mWoodLt);
  gripBar.position.set(0, -0.036 * HEX_R, -0.038 * HEX_R);
  sh.add(gripBar);
  group.add(sh);

  // ═══ WIĄZKA 3 ZAPASOWYCH OSZCZEPÓW (pkt A2 — „Ilość pocisków: 10") ═══════
  // Trzymana razem z tarczą w lewej dłoni, drzewca skośnie w tył-górę.
  const SP_D = new THREE.Vector3(-0.10, 0.62, -0.78).normalize();
  const qSp = new THREE.Quaternion().setFromUnitVectors(KZ_Y_UP, SP_D);
  const spBase = new THREE.Vector3(
    armL.hand.x + 0.030 * HEX_R,
    armL.hand.y - 0.010 * HEX_R,
    armL.hand.z - 0.014 * HEX_R,
  );
  for (const [dx, dy] of [[-0.012, 0.0], [0.012, 0.008], [0.0, -0.012]] as [number, number][]) {
    const o = spBase.clone().add(new THREE.Vector3(dx * HEX_R, dy * HEX_R, dx * 0.5 * HEX_R));
    const s = new THREE.Mesh(getKZSpShaft(), mWood);
    s.quaternion.copy(qSp);
    s.position.copy(o.clone().addScaledVector(SP_D, 0.058 * HEX_R));
    group.add(s);
    const t = new THREE.Mesh(getKZSpTip(), mBoneDk);
    t.quaternion.copy(qSp);
    t.rotation.y += Math.PI / 4;
    t.position.copy(o.clone().addScaledVector(SP_D, 0.215 * HEX_R));
    group.add(t);
  }
  const spWrap = new THREE.Mesh(getKZSpWrap(), mOwner);     // oplot = KOLOR GRACZA
  spWrap.quaternion.copy(qSp);
  spWrap.position.copy(spBase.clone().addScaledVector(SP_D, 0.100 * HEX_R));
  group.add(spWrap);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ═══════════════════════════════════════════════════════════════════════════
// CZĘŚĆ B — TARAN (machina epoki kamienia)
// ═══════════════════════════════════════════════════════════════════════════

const KT_WOOD      = 0x7a5c3a;   // belki obrobione
const KT_WOOD_DK   = 0x4a3018;   // płozy / kalenica
const KT_LOG       = 0x6d5232;   // kłoda (pień)
const KT_LOG_DK    = 0x513d24;   // strona cienista kłody / kikuty konarów
const KT_BARK      = 0x3f2f1c;   // pierścień kory
const KT_CHAR      = 0x1c1712;   // OPALONE (zwęglone) czoło kłody — pkt B2
const KT_STONE     = 0x8a8e94;   // klin kamienny
const KT_STONE_DK  = 0x6d7178;   // odłupania klina
const KT_HIDE_A    = 0x9a6a42;   // skóra daszku (jasna)
const KT_HIDE_B    = 0x7a5232;   // skóra daszku (ciemna)
const KT_LEATHER   = 0x6b4a28;   // rzemienie / kołyski
const KT_ROPE      = 0x9a8060;   // sznur roślinny / ścięgna
const KT_LASH      = 0xb09a72;   // wiązania (jaśniejsze — mają być widoczne)

// ── geometrie-singletony (Taran) ───────────────────────────────────────────
let gKTRunner:   THREE.BoxGeometry | null = null;
let gKTNose:     THREE.BoxGeometry | null = null;
let gKTCross:    THREE.BoxGeometry | null = null;
let gKTLash:     THREE.CylinderGeometry | null = null;
let gKTLashSm:   THREE.CylinderGeometry | null = null;
let gKTLeg:      THREE.BoxGeometry | null = null;
let gKTBrace:    THREE.BoxGeometry | null = null;
let gKTRidge:    THREE.BoxGeometry | null = null;
let gKTLogA:     THREE.CylinderGeometry | null = null;
let gKTLogB:     THREE.CylinderGeometry | null = null;
let gKTBark:     THREE.CylinderGeometry | null = null;
let gKTStub:     THREE.CylinderGeometry | null = null;
let gKTChar:     THREE.CylinderGeometry | null = null;
let gKTWedge:    THREE.CylinderGeometry | null = null;
let gKTChip:     THREE.BoxGeometry | null = null;
let gKTThong:    THREE.BoxGeometry | null = null;
let gKTCradle:   THREE.CylinderGeometry | null = null;
let gKTRope:     THREE.BoxGeometry | null = null;
let gKTPost:     THREE.BoxGeometry | null = null;
let gKTRoof:     THREE.BoxGeometry | null = null;
let gKTRoofRdg:  THREE.BoxGeometry | null = null;
let gKTBatten:   THREE.CylinderGeometry | null = null;
let gKTDrape:    THREE.BoxGeometry | null = null;
let gKTSideFlap: THREE.BoxGeometry | null = null;
let gKTHandle:   THREE.CylinderGeometry | null = null;
let gKTDragRope: THREE.BoxGeometry | null = null;
let gKTMast:     THREE.BoxGeometry | null = null;
let gKTBanner:   THREE.BoxGeometry | null = null;
let gKTBannerBar:THREE.BoxGeometry | null = null;
let gKTPanel:    THREE.BoxGeometry | null = null;
let gKTLogWrap:  THREE.CylinderGeometry | null = null;

function getKTRunner():   THREE.BoxGeometry { return (gKTRunner   ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.042 * HEX_R, 0.376 * HEX_R)); }
function getKTNose():     THREE.BoxGeometry { return (gKTNose     ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.038 * HEX_R, 0.096 * HEX_R)); }
function getKTCross():    THREE.BoxGeometry { return (gKTCross    ||= new THREE.BoxGeometry(0.300 * HEX_R, 0.026 * HEX_R, 0.032 * HEX_R)); }
function getKTLash():     THREE.CylinderGeometry { return (gKTLash   ||= new THREE.CylinderGeometry(0.026 * HEX_R, 0.026 * HEX_R, 0.020 * HEX_R, 6, 1, true)); }
function getKTLashSm():   THREE.CylinderGeometry { return (gKTLashSm ||= new THREE.CylinderGeometry(0.020 * HEX_R, 0.020 * HEX_R, 0.016 * HEX_R, 6, 1, true)); }
function getKTLeg():      THREE.BoxGeometry { return (gKTLeg      ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.300 * HEX_R, 0.030 * HEX_R)); }
function getKTBrace():    THREE.BoxGeometry { return (gKTBrace    ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.020 * HEX_R, 0.300 * HEX_R)); }
function getKTRidge():    THREE.BoxGeometry { return (gKTRidge    ||= new THREE.BoxGeometry(0.036 * HEX_R, 0.036 * HEX_R, 0.344 * HEX_R)); }
function getKTLogA():     THREE.CylinderGeometry { return (gKTLogA  ||= new THREE.CylinderGeometry(0.036 * HEX_R, 0.030 * HEX_R, 0.198 * HEX_R, 10, 1)); }
function getKTLogB():     THREE.CylinderGeometry { return (gKTLogB  ||= new THREE.CylinderGeometry(0.047 * HEX_R, 0.036 * HEX_R, 0.190 * HEX_R, 10, 1)); }
function getKTBark():     THREE.CylinderGeometry { return (gKTBark  ||= new THREE.CylinderGeometry(0.040 * HEX_R, 0.040 * HEX_R, 0.026 * HEX_R, 8, 1, true)); }
function getKTStub():     THREE.CylinderGeometry { return (gKTStub  ||= new THREE.CylinderGeometry(0.008 * HEX_R, 0.014 * HEX_R, 0.042 * HEX_R, 5, 1)); }
function getKTChar():     THREE.CylinderGeometry { return (gKTChar  ||= new THREE.CylinderGeometry(0.038 * HEX_R, 0.047 * HEX_R, 0.052 * HEX_R, 10, 1)); }
function getKTWedge():    THREE.CylinderGeometry { return (gKTWedge ||= new THREE.CylinderGeometry(0.024 * HEX_R, 0.050 * HEX_R, 0.062 * HEX_R, 4, 1)); }
function getKTChip():     THREE.BoxGeometry { return (gKTChip     ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.020 * HEX_R, 0.030 * HEX_R)); }
function getKTThong():    THREE.BoxGeometry { return (gKTThong    ||= new THREE.BoxGeometry(0.104 * HEX_R, 0.011 * HEX_R, 0.011 * HEX_R)); }
function getKTCradle():   THREE.CylinderGeometry { return (gKTCradle ||= new THREE.CylinderGeometry(0.044 * HEX_R, 0.044 * HEX_R, 0.022 * HEX_R, 8, 1, true)); }
function getKTRope():     THREE.BoxGeometry { return (gKTRope     ||= new THREE.BoxGeometry(0.010 * HEX_R, 0.104 * HEX_R, 0.010 * HEX_R)); }
function getKTPost():     THREE.BoxGeometry { return (gKTPost     ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.310 * HEX_R, 0.024 * HEX_R)); }
function getKTRoof():     THREE.BoxGeometry { return (gKTRoof     ||= new THREE.BoxGeometry(0.196 * HEX_R, 0.014 * HEX_R, 0.176 * HEX_R)); }
function getKTRoofRdg():  THREE.BoxGeometry { return (gKTRoofRdg  ||= new THREE.BoxGeometry(0.034 * HEX_R, 0.028 * HEX_R, 0.362 * HEX_R)); }
function getKTBatten():   THREE.CylinderGeometry { return (gKTBatten ||= new THREE.CylinderGeometry(0.008 * HEX_R, 0.008 * HEX_R, 0.190 * HEX_R, 5, 1)); }
function getKTDrape():    THREE.BoxGeometry { return (gKTDrape    ||= new THREE.BoxGeometry(0.220 * HEX_R, 0.086 * HEX_R, 0.012 * HEX_R)); }
function getKTSideFlap(): THREE.BoxGeometry { return (gKTSideFlap ||= new THREE.BoxGeometry(0.012 * HEX_R, 0.062 * HEX_R, 0.160 * HEX_R)); }
function getKTHandle():   THREE.CylinderGeometry { return (gKTHandle ||= new THREE.CylinderGeometry(0.012 * HEX_R, 0.014 * HEX_R, 0.120 * HEX_R, 6, 1)); }
function getKTDragRope(): THREE.BoxGeometry { return (gKTDragRope ||= new THREE.BoxGeometry(0.009 * HEX_R, 0.009 * HEX_R, 0.112 * HEX_R)); }
function getKTMast():     THREE.BoxGeometry { return (gKTMast     ||= new THREE.BoxGeometry(0.013 * HEX_R, 0.130 * HEX_R, 0.013 * HEX_R)); }
function getKTBanner():   THREE.BoxGeometry { return (gKTBanner   ||= new THREE.BoxGeometry(0.088 * HEX_R, 0.062 * HEX_R, 0.008 * HEX_R)); }
function getKTBannerBar():THREE.BoxGeometry { return (gKTBannerBar||= new THREE.BoxGeometry(0.098 * HEX_R, 0.010 * HEX_R, 0.010 * HEX_R)); }
function getKTPanel():    THREE.BoxGeometry { return (gKTPanel    ||= new THREE.BoxGeometry(0.010 * HEX_R, 0.086 * HEX_R, 0.150 * HEX_R)); }
function getKTLogWrap():  THREE.CylinderGeometry { return (gKTLogWrap ||= new THREE.CylinderGeometry(0.040 * HEX_R, 0.040 * HEX_R, 0.016 * HEX_R, 8, 1, true)); }

/** Wiązanie rzemienne w węźle konstrukcji (oś Z pozioma lub oś Y pionowa). */
function ktLashing(
  group: THREE.Group, m: THREE.MeshStandardMaterial,
  x: number, y: number, z: number, axis: 'x' | 'y' | 'z', small = false,
): void {
  const l = new THREE.Mesh(small ? getKTLashSm() : getKTLash(), m);
  if (axis === 'x') l.rotation.z = Math.PI / 2;
  else if (axis === 'z') l.rotation.x = Math.PI / 2;
  l.position.set(x * HEX_R, y * HEX_R, z * HEX_R);
  group.add(l);
}

// ---------------------------------------------------------------------------
// TARAN — wariant OPUS 5. Bez kół (pkt B1: PŁOZY + liny wleczenia + drągi do
// pchania), kłoda-pień z kikutami konarów na skórzanych kołyskach i pękach
// lin, czoło OPALONE + klin kamienny na krzyżujących się rzemieniach (B2),
// wszystkie węzły WIĄZANE (B3, brak gwoździ), daszek ze skór na żerdziach
// (B5). Front = +Z, płozy na y = 0. Kolor gracza: proporzec + płachta na
// burcie + 2 oploty na kłodzie (B6).
// ---------------------------------------------------------------------------
export function buildBatteringRamOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mWood   = mat(KT_WOOD,     0.06, 0.82);
  const mDkWood = mat(KT_WOOD_DK,  0.04, 0.88);
  const mLog    = mat(KT_LOG,      0.05, 0.86);
  const mLogDk  = mat(KT_LOG_DK,   0.04, 0.90);
  const mBark   = mat(KT_BARK,     0.03, 0.94);
  const mChar   = mat(KT_CHAR,     0.05, 0.96);
  const mStone  = mat(KT_STONE,    0.08, 0.85);
  const mStoneD = mat(KT_STONE_DK, 0.08, 0.88);
  const mHideA  = mat(KT_HIDE_A,   0.04, 0.92);
  const mHideB  = mat(KT_HIDE_B,   0.04, 0.92);
  const mLeath  = mat(KT_LEATHER,  0.05, 0.88);
  const mRope   = mat(KT_ROPE,     0.04, 0.90);
  const mLash   = mat(KT_LASH,     0.03, 0.92);
  const mOwner  = mat(ownerColor_, 0.12, 0.70);

  // ═══ PŁOZY (zamiast kół — pkt B1) ════════════════════════════════════════
  for (const sx of [-1, 1]) {
    const run = new THREE.Mesh(getKTRunner(), mDkWood);
    run.position.set(sx * 0.128 * HEX_R, 0.021 * HEX_R, -0.012 * HEX_R);
    group.add(run);
    const nose = new THREE.Mesh(getKTNose(), mDkWood);   // zadarty dziób sań
    nose.rotation.x = -0.46;
    nose.position.set(sx * 0.128 * HEX_R, 0.0393 * HEX_R, 0.214 * HEX_R);
    group.add(nose);
  }

  // ═══ RAMA: 3 poprzeczki wiązane do płóz ══════════════════════════════════
  for (const cz of [-0.172, -0.012, 0.144]) {
    const cross = new THREE.Mesh(getKTCross(), mWood);
    cross.position.set(0, 0.056 * HEX_R, cz * HEX_R);
    group.add(cross);
    for (const sx of [-1, 1]) ktLashing(group, mLash, sx * 0.128, 0.050, cz, 'y', true);
  }

  // ═══ KOZIOŁ: 2 pary nóg A + wiązania w szczycie + kalenica + zastrzały ═══
  // stopa nogi na poprzeczce (y≈0.070), szczyt ~0.070+0.300*cos(0.44)=0.342
  for (const sz of [-0.120, 0.108]) {
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(getKTLeg(), mWood);
      leg.rotation.z = -s * 0.44;
      leg.position.set(s * 0.064 * HEX_R, 0.216 * HEX_R, sz * HEX_R);
      group.add(leg);
      ktLashing(group, mLash, s * 0.128, 0.072, sz, 'y', true);   // stopa nogi
    }
    ktLashing(group, mLash, 0, 0.344, sz, 'z');                   // szczyt A
  }
  const ridge = new THREE.Mesh(getKTRidge(), mDkWood);
  ridge.position.set(0, 0.356 * HEX_R, -0.008 * HEX_R);
  group.add(ridge);
  for (const s of [-1, 1]) {                                     // zastrzały wzdłużne
    const br = new THREE.Mesh(getKTBrace(), mWood);
    br.rotation.x = 0.52;
    br.position.set(s * 0.098 * HEX_R, 0.212 * HEX_R, -0.010 * HEX_R);
    group.add(br);
  }

  // ═══ KŁODA (pień) — wychylona ku +Z (rozpęd), oś Z, y = 0.208 ════════════
  const LOG_Y = 0.208 * HEX_R;
  const logA = new THREE.Mesh(getKTLogA(), mLog);      // segment rufowy (cieńszy)
  logA.rotation.x = Math.PI / 2;                       // +Y -> +Z (cienki koniec w tył)
  logA.position.set(0, LOG_Y, -0.072 * HEX_R);
  group.add(logA);
  const logB = new THREE.Mesh(getKTLogB(), mLog);      // segment czołowy (grubszy)
  logB.rotation.x = Math.PI / 2;
  logB.position.set(0, LOG_Y, 0.122 * HEX_R);
  group.add(logB);
  const logShade = new THREE.Mesh(getKTLogA(), mLogDk); // pas cienia od spodu
  logShade.rotation.x = Math.PI / 2;
  logShade.scale.set(0.98, 1.0, 0.42);
  logShade.position.set(0, LOG_Y - 0.020 * HEX_R, -0.072 * HEX_R);
  group.add(logShade);
  const bark = new THREE.Mesh(getKTBark(), mBark);      // pierścień kory
  bark.rotation.x = Math.PI / 2;
  bark.position.set(0, LOG_Y, 0.026 * HEX_R);
  group.add(bark);
  for (const [sx, sy, sz, rz] of [
    [ 1,  0.6, -0.136,  1.10],
    [-1,  0.4,  0.034, -1.24],
    [ 0.3, 1.0, -0.018,  0.30],
  ] as [number, number, number, number][]) {           // kikuty odciętych konarów
    const st = new THREE.Mesh(getKTStub(), mLogDk);
    st.rotation.z = rz;
    st.rotation.x = sy * 0.30;
    st.position.set(sx * 0.036 * HEX_R, LOG_Y + sy * 0.024 * HEX_R, sz * HEX_R);
    group.add(st);
  }

  // ═══ GŁOWICA: OPALONE czoło + KLIN KAMIENNY na rzemieniach (pkt B2) ══════
  const charr = new THREE.Mesh(getKTChar(), mChar);
  charr.rotation.x = -Math.PI / 2;                      // szeroki koniec ku kłodzie
  charr.position.set(0, LOG_Y, 0.230 * HEX_R);
  group.add(charr);
  const wedge = new THREE.Mesh(getKTWedge(), mStone);
  wedge.rotation.x = -Math.PI / 2;
  wedge.rotation.z = Math.PI / 4;
  wedge.position.set(0, LOG_Y, 0.282 * HEX_R);
  group.add(wedge);
  for (const [cx, cy] of [[1, 0.6], [-1, -0.5]] as [number, number][]) {
    const chip = new THREE.Mesh(getKTChip(), mStoneD);  // odłupania klina
    chip.rotation.z = cx * 0.4;
    chip.position.set(cx * 0.026 * HEX_R, LOG_Y + cy * 0.022 * HEX_R, 0.274 * HEX_R);
    group.add(chip);
  }
  for (const rz of [0.72, -0.72]) {                     // rzemienie KRZYŻUJĄCE się
    for (const dz of [0.214, 0.252]) {
      const th = new THREE.Mesh(getKTThong(), mLeath);
      th.rotation.z = rz;
      th.position.set(0, LOG_Y, dz * HEX_R);
      group.add(th);
    }
  }
  for (const dz of [0.204, 0.258]) {                    // pierścienie zaciskowe
    const ring = new THREE.Mesh(getKTLogWrap(), mLeath);
    ring.rotation.x = Math.PI / 2;
    ring.scale.setScalar(1.12);
    ring.position.set(0, LOG_Y, dz * HEX_R);
    group.add(ring);
  }

  // ═══ ZAWIESIE: 2 skórzane kołyski + 4 pęki lin do kalenicy ═══════════════
  for (const cz of [-0.080, 0.094]) {
    const cradle = new THREE.Mesh(getKTCradle(), mLeath);
    cradle.rotation.x = Math.PI / 2;
    cradle.position.set(0, LOG_Y, cz * HEX_R);
    group.add(cradle);
  }
  for (const [rz, tilt] of [[-0.092, 0.30], [-0.028, 0.36], [0.068, 0.44], [0.126, 0.50]] as [number, number][]) {
    for (const s of [-1, 1]) {
      const rope = new THREE.Mesh(getKTRope(), mRope);
      rope.rotation.x = tilt;
      rope.rotation.z = s * 0.10;
      rope.position.set(s * 0.014 * HEX_R, 0.288 * HEX_R, (rz + 0.014) * HEX_R);
      group.add(rope);
    }
  }
  // KOLOR GRACZA: 2 oploty na kłodzie (pkt B6)
  for (const dz of [-0.136, 0.054]) {
    const wrap = new THREE.Mesh(getKTLogWrap(), mOwner);
    wrap.rotation.x = Math.PI / 2;
    wrap.position.set(0, LOG_Y, dz * HEX_R);
    group.add(wrap);
  }

  // ═══ DASZEK ZE SKÓR na 4 żerdziach (pkt B5) ══════════════════════════════
  for (const sx of [-0.146, 0.146]) {
    for (const sz of [-0.142, 0.136]) {
      const post = new THREE.Mesh(getKTPost(), mWood);
      post.position.set(sx * HEX_R, 0.226 * HEX_R, sz * HEX_R);
      group.add(post);
      ktLashing(group, mLash, sx, 0.372, sz, 'y', true);   // wiązanie do okapu
    }
  }
  for (const s of [-1, 1]) {
    for (const sz of [-0.084, 0.084]) {
      const hide = (s * sz > 0) ? mHideA : mHideB;         // szachownica odcieni
      const roof = new THREE.Mesh(getKTRoof(), hide);
      roof.rotation.z = -s * 0.520;
      roof.position.set(s * 0.086 * HEX_R, 0.432 * HEX_R, sz * HEX_R);
      group.add(roof);
    }
  }
  const roofRidge = new THREE.Mesh(getKTRoofRdg(), mDkWood);
  roofRidge.position.set(0, 0.478 * HEX_R, 0);
  group.add(roofRidge);
  for (const s of [-1, 1]) {                               // łaty gałęziowe
    for (const sz of [-0.118, 0.118]) {
      const bat = new THREE.Mesh(getKTBatten(), mLogDk);
      bat.rotation.z = Math.PI / 2 - s * 0.520;
      bat.position.set(s * 0.086 * HEX_R, 0.440 * HEX_R, sz * HEX_R);
      group.add(bat);
    }
  }
  const drape = new THREE.Mesh(getKTDrape(), mHideB);      // zwis z tyłu
  drape.rotation.x = 0.16;
  drape.position.set(0, 0.352 * HEX_R, -0.166 * HEX_R);
  group.add(drape);
  const drapeF = new THREE.Mesh(getKTDrape(), mHideA);     // krótki zwis z przodu
  drapeF.rotation.x = -0.16;
  drapeF.scale.set(0.92, 0.52, 1.0);
  drapeF.position.set(0, 0.372 * HEX_R, 0.174 * HEX_R);
  group.add(drapeF);
  const sideFlap = new THREE.Mesh(getKTSideFlap(), mHideB); // zwis lewej burty
  sideFlap.position.set(-0.152 * HEX_R, 0.348 * HEX_R, -0.012 * HEX_R);
  group.add(sideFlap);

  // ═══ DRĄGI DO PCHANIA (rufa) + LINY WLECZENIA (dziób) — pkt B1 ═══════════
  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(getKTHandle(), mWood);
    h.rotation.x = -0.50;
    h.position.set(s * 0.100 * HEX_R, 0.132 * HEX_R, -0.184 * HEX_R);
    group.add(h);
    ktLashing(group, mLash, s * 0.100, 0.080, -0.162, 'y', true);
  }
  for (const s of [-1, 1]) {
    const dr = new THREE.Mesh(getKTDragRope(), mRope);
    dr.rotation.x = 0.30;
    dr.rotation.y = s * 0.16;
    dr.position.set(s * 0.118 * HEX_R, 0.046 * HEX_R, 0.244 * HEX_R);
    group.add(dr);
  }

  // ═══ KOLOR GRACZA: proporzec rufowy + płachta na prawej burcie (B6) ══════
  const mast = new THREE.Mesh(getKTMast(), mWood);
  mast.position.set(0, 0.545 * HEX_R, -0.156 * HEX_R);
  group.add(mast);
  const bar = new THREE.Mesh(getKTBannerBar(), mWood);
  bar.position.set(0.044 * HEX_R, 0.598 * HEX_R, -0.156 * HEX_R);
  group.add(bar);
  const banner = new THREE.Mesh(getKTBanner(), mOwner);
  banner.position.set(0.046 * HEX_R, 0.562 * HEX_R, -0.156 * HEX_R);
  group.add(banner);
  const panel = new THREE.Mesh(getKTPanel(), mOwner);
  panel.position.set(0.152 * HEX_R, 0.340 * HEX_R, -0.012 * HEX_R);
  group.add(panel);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ═══════════════════════════════════════════════════════════════════════════
/** Zwolnienie singletonów modułu (konwencja disposeUnitGeometries z units.ts). */
export function disposeKamienZuluTaranOpus5Geometries(): void {
  const all: (THREE.BufferGeometry | null)[] = [
    gKZTorso, gKZChest, gKZWaist, gKZNeck, gKZHead, gKZJaw, gKZNose, gKZEye,
    gKZThigh, gKZShin, gKZUpArm, gKZForearm, gKZFist, gKZSole, gKZToes,
    gKZHair, gKZRing, gKZBand, gKZBandTag, gKZEarFlap, gKZFeather, gKZFeatTip,
    gKZBelt, gKZIsinene, gKZBheshu, gKZTuft, gKZTuftEnd, gKZArmBand,
    gKZJavShaft, gKZJavButt, gKZJavLash, gKZJavBlade, gKZJavTip,
    gKZSpShaft, gKZSpTip, gKZSpWrap,
    gKZShell, gKZFace, gKZPatch, gKZUmgobo, gKZUmgTuft, gKZLace, gKZLaceCol,
    gKZGripBar, gKZPorpax,
    gKTRunner, gKTNose, gKTCross, gKTLash, gKTLashSm, gKTLeg, gKTBrace, gKTRidge,
    gKTLogA, gKTLogB, gKTBark, gKTStub, gKTChar, gKTWedge, gKTChip, gKTThong,
    gKTCradle, gKTRope, gKTPost, gKTRoof, gKTRoofRdg, gKTBatten, gKTDrape,
    gKTSideFlap, gKTHandle, gKTDragRope, gKTMast, gKTBanner,
    gKTBannerBar, gKTPanel, gKTLogWrap,
  ];
  for (const g of all) { g?.dispose(); }
  gKZTorso = gKZChest = gKZWaist = gKZNeck = gKZHead = gKZJaw = gKZNose = null;
  gKZEye = gKZThigh = gKZShin = gKZUpArm = gKZForearm = gKZFist = null;
  gKZSole = gKZToes = gKZBandTag = gKZEarFlap = gKZFeather = gKZFeatTip = null;
  gKZBelt = gKZIsinene = gKZBheshu = gKZLace = gKZLaceCol = null;
  gKZGripBar = gKZPorpax = gKZJavBlade = null;
  gKZHair = gKZRing = gKZBand = gKZTuft = gKZTuftEnd = gKZArmBand = null;
  gKZJavShaft = gKZJavButt = gKZJavLash = gKZSpShaft = gKZSpWrap = null;
  gKZUmgobo = gKZUmgTuft = null;
  gKZJavTip = gKZSpTip = null;
  gKZShell = gKZFace = null;
  gKZPatch = null;
  gKTRunner = gKTNose = gKTCross = gKTLeg = gKTBrace = gKTRidge = null;
  gKTChip = gKTThong = gKTRope = gKTPost = gKTRoof = gKTRoofRdg = null;
  gKTDrape = gKTSideFlap = gKTDragRope = gKTMast = gKTBanner = null;
  gKTBannerBar = gKTPanel = null;
  gKTLash = gKTLashSm = gKTLogA = gKTLogB = gKTBark = gKTStub = null;
  gKTChar = gKTWedge = gKTCradle = gKTBatten = gKTHandle = null;
  gKTLogWrap = null;
}
