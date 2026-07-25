/**
 * braz-taran-opus5.ts — TARAN OKUTY (Bronze-Shod Ram), machina oblężnicza
 * EPOKI BRĄZU. Odpowiednik danych: units.json → „Taran okuty" (Epoka=Brąz,
 * Tech=Brązownictwo, Surowiec=Brąz 3, Rola=Oblężnicza).
 * ---------------------------------------------------------------------------
 * Drop-in zgodne z rodziną builderów:
 *   buildTaranOkutyOpus5(ownerColor) : THREE.Group
 *
 * Konwencje serii (jak kamien-zulu-taran-opus5.ts / hastati-opus5.ts):
 *   - token PRZODEM do +Z, podstawa (spód kół) na y = 0 grupy,
 *   - MeshStandardMaterial, group.userData['mats'] + ['perTokenGeos'],
 *   - geometrie wspólne = singletony modułu (perTokenGeos puste),
 *   - HEX_R = 1.0 z hexutil.ts; token nieskalowany w dispatchu units.ts,
 *   - jeden slot koloru gracza (proporzec + płachta na burcie + 2 oploty
 *     na kłodzie) — CELOWO ten sam zestaw miejsc co w taranie kamiennym,
 *     żeby gracz czytał obie machiny jako tę samą „linię" jednostki.
 *
 * ===========================================================================
 * ZGODNOŚĆ HISTORYCZNA — decyzje i uzasadnienia
 * ===========================================================================
 *
 * POWÓD ISTNIENIA TEJ JEDNOSTKI. Taran epoki Kamienia
 * (kamien-zulu-taran-opus5.ts, pkt B1) stoi na PŁOZACH, bo koło pojawia się
 * dopiero ~3500 p.n.e. Dane pozwalały mu jednak jeździć przez Brąz i Żelazo —
 * płozowa machina w epoce brązu jest anachronizmem „w drugą stronę". Stąd
 * rozdział: Kamień = sanie, Brąz = wóz. Koło staje się w grze CZYTELNYM
 * ZNAKIEM POSTĘPU EPOKI, a nie przypadkowym detalem.
 *
 * C1. KOŁA — PEŁNE (TARCZOWE), TRÓJDZIELNE, NIE SZPRYCHOWE. To jest
 *     rozstrzygnięcie świadome, nie domyślne:
 *     (a) Koło szprychowe wchodzi do użytku ok. 2000 p.n.e. i jest technologią
 *         LEKKĄ — powstało dla rydwanu, żeby zbić masę wirującą. Machina
 *         oblężnicza jest przeciwieństwem rydwanu: powolna, ciężka, obciążona
 *         zawieszoną kłodą. Szprychy pod takim ładunkiem to konstrukcyjny
 *         nonsens (i tak w ikonografii nie występują).
 *     (b) Koło pełne w Brązie NIE jest jednym krążkiem — to koło TRÓJDZIELNE:
 *         trzy deski spojone kołkami i listwami (Mezopotamia, Ur; Europa —
 *         Ljubljansko barje, Kola koło Bronocic). Dlatego na licu każdego koła
 *         są dwie WIDOCZNE SPOINY desek.
 *     (c) Obręcz: nabijana OPONA ZE SKÓRY SUROWEJ (rawhide) — standardowe
 *         zabezpieczenie wieńca koła przed rozbiciem, tańsze niż okucie.
 *     (d) Piasta wystaje na zewnątrz, u nasady spięta PIERŚCIENIEM BRĄZOWYM.
 *     Oś jest STAŁA (koła na osi, oś związana z ramą) — konstrukcja wozowa,
 *     nie „nowoczesne" łożysko.
 *
 * C2. GŁOWICA OKUTA BRĄZEM — cecha, po której poznaje się tę jednostkę.
 *     Czoło kłody kryje BRĄZOWA NASADKA (tulejka nasunięta na nos kłody,
 *     zwężająca się ku przodowi — czoło uderzenia jest tępe, nie ostre:
 *     taran ma WYBIJAĆ wrota, nie ciąć). Za nasadką pierścień zaciskowy,
 *     a od niego biegną wstecz po kłodzie CZTERY BRĄZOWE LANGIETY (płaskowniki
 *     rozkładające uderzenie na drewno). Głowica w kształcie baraniego łba
 *     (aries) to Asyria/Rzym — ŚWIADOMIE POMINIĘTA (patrz C4).
 *
 * C3. DASZEK/OSŁONA ZAŁOGI — przenośne schronienie ze skór. Najstarsze
 *     przedstawienia taranu (Beni Hasan, Państwo Środka, ~2000–1900 p.n.e.)
 *     to dokładnie to: belka obsługiwana przez ludzi pod przenośną budą.
 *     Model: 4 słupki, dwuspadowe połacie ze skór w dwóch odcieniach (łaty
 *     zszywane), kalenica, łaty gałęziowe, zwis z tyłu i z przodu oraz
 *     płachta boczna. Skóra wybrana zamiast plecionki, bo lepiej czyta się
 *     z 52° i jest zgodna z egipską ikonografią.
 *
 * C4. CZEGO TU NIE MA — WIEŻY. Taran wbudowany w opancerzoną wieżę na kołach
 *     to ASYRIA (IX–VII w. p.n.e.), czyli epoka ŻELAZA. Zostawiony na
 *     przyszłość; w Brązie machina zostaje niska i otwarta.
 *
 * C5. KŁODA ZAWIESZONA NA RZEMIENIACH, NIE „na wózku". Kłoda wisi w dwóch
 *     skórzanych kołyskach i na sześciu pękach lin podwieszonych do kalenicy
 *     kozła — załoga rozbujuje ją wzdłuż osi. Kozioł z dwóch par nóg A,
 *     wszystkie węzły WIĄZANE (brak gwoździ), a cztery narożniki ramy
 *     dodatkowo spięte BRĄZOWYMI OKUCIAMI — to jedyne miejsce, w którym
 *     nowy metal wchodzi w konstrukcję nośną (drogi surowiec idzie tam,
 *     gdzie najbardziej pracuje).
 *
 * C6. KŁODA OCIOSANA, nie surowy pień. W wersji kamiennej kłoda ma korę
 *     i kikuty odciętych konarów (siekiera kamienna = obróbka zgrubna).
 *     Tu drewno jest gładko ociosane — różnica narzędzia (siekiera brązowa)
 *     jest widoczna gołym okiem i wzmacnia czytelność progresji epok.
 *
 * C7. WLECZENIE: z przodu DYSZEL z poprzeczką (załoga ciągnie), z tyłu dwa
 *     drągi do pchania. Kołowa machina nadal porusza się siłą ludzi —
 *     zgodne ze statystyką „Ruch 1" i „budowana podczas oblężenia (1 tura)".
 *
 * ===========================================================================
 * BUDŻET (mierzone traversem — patrz dyspozycje/PODGLAD-BRAZ-TARAN.html):
 *   Taran KAMIEŃ (płozy)  85 mesh / 1244 tri / 14 mat · bbox 0.349 x 0.610 x 0.564
 *   Taran BRĄZ  (koła)   102 mesh / 1600 tri / 12 mat · bbox 0.349 x 0.641 x 0.574
 *   Różnica to niemal w całości ZESPÓŁ JEZDNY (4 koła x 6 mesh + 2 osie = 26
 *   mesh / ~500 tri). Y +5% bo koła podnoszą całą machinę o promień koła;
 *   X identyczny, Z +2% (dyszel z poprzeczką zamiast luźnych lin wleczenia).
 *   Wzorzec szczegółowości: hastati-opus5.ts — 92 mesh / 1378 tri.
 * ===========================================================================
 */

import * as THREE from 'three';
import { HEX_R } from './hexutil';

// ── paleta ─────────────────────────────────────────────────────────────────
const BT_WOOD      = 0x7a5c3a;   // belki obrobione (rama, kozioł, słupki)
const BT_WOOD_DK   = 0x4a3018;   // kalenica / szprosy / spoiny desek koła
const BT_LOG       = 0x6d5232;   // kłoda ociosana
const BT_LOG_DK    = 0x513d24;   // strona cienista kłody
const BT_BRONZE    = 0xbe8b3e;   // BRĄZ — nasadka głowicy, langiety, okucia
const BT_BRONZE_DK = 0x8a5f28;   // brąz w cieniu / patyna
const BT_HIDE_A    = 0x9a6a42;   // skóra daszku (jasna)
const BT_HIDE_B    = 0x7a5232;   // skóra daszku (ciemna)
const BT_LEATHER   = 0x6b4a28;   // rzemienie / kołyski / opona koła
const BT_ROPE      = 0x9a8060;   // liny zawiesia
const BT_LASH      = 0xb09a72;   // wiązania (jaśniejsze — mają być widoczne)

// ── wymiary wiodące ────────────────────────────────────────────────────────
const BT_WHEEL_R  = 0.058 * HEX_R;             // promień tarczy koła
const BT_TYRE_R   = BT_WHEEL_R + 0.005 * HEX_R; // + opona ze skóry surowej
// Oś na wysokości APOTEMY opony (koło jest 10-bocznym walcem, nie okręgiem) —
// dzięki temu płaszczyzna toczna leży dokładnie na y = 0 grupy, zgodnie
// z konwencją rodziny („stopy/podstawa na y = 0").
const BT_AXLE_Y   = BT_TYRE_R * Math.cos(Math.PI / 10);
const BT_WHEEL_X  = 0.130 * HEX_R;
const BT_AXLE_ZF  =  0.152 * HEX_R;  // oś przednia
const BT_AXLE_ZR  = -0.164 * HEX_R;  // oś tylna
const BT_LOG_Y    = 0.268 * HEX_R;   // oś kłody

// ── geometrie-singletony ───────────────────────────────────────────────────
let gBTWheel:    THREE.CylinderGeometry | null = null;
let gBTTyre:     THREE.CylinderGeometry | null = null;
let gBTNave:     THREE.CylinderGeometry | null = null;
let gBTNaveRing: THREE.CylinderGeometry | null = null;
let gBTSeam:     THREE.BoxGeometry | null = null;
let gBTAxle:     THREE.CylinderGeometry | null = null;
let gBTRail:     THREE.BoxGeometry | null = null;
let gBTCross:    THREE.BoxGeometry | null = null;
let gBTBracket:  THREE.BoxGeometry | null = null;
let gBTLash:     THREE.CylinderGeometry | null = null;
let gBTLashSm:   THREE.CylinderGeometry | null = null;
let gBTCollar:   THREE.CylinderGeometry | null = null;
let gBTLeg:      THREE.BoxGeometry | null = null;
let gBTRidge:    THREE.BoxGeometry | null = null;
let gBTBrace:    THREE.BoxGeometry | null = null;
let gBTLogA:     THREE.CylinderGeometry | null = null;
let gBTLogB:     THREE.CylinderGeometry | null = null;
let gBTBand:     THREE.CylinderGeometry | null = null;
let gBTHead:     THREE.CylinderGeometry | null = null;
let gBTHeadRing: THREE.CylinderGeometry | null = null;
let gBTLangetH:  THREE.BoxGeometry | null = null;
let gBTLangetV:  THREE.BoxGeometry | null = null;
let gBTCradle:   THREE.CylinderGeometry | null = null;
let gBTRope:     THREE.BoxGeometry | null = null;
let gBTPost:     THREE.BoxGeometry | null = null;
let gBTRoof:     THREE.BoxGeometry | null = null;
let gBTRoofRdg:  THREE.BoxGeometry | null = null;
let gBTBatten:   THREE.CylinderGeometry | null = null;
let gBTDrape:    THREE.BoxGeometry | null = null;
let gBTSideFlap: THREE.BoxGeometry | null = null;
let gBTPole:     THREE.BoxGeometry | null = null;
let gBTPoleBar:  THREE.BoxGeometry | null = null;
let gBTHandle:   THREE.CylinderGeometry | null = null;
let gBTMast:     THREE.BoxGeometry | null = null;
let gBTBanner:   THREE.BoxGeometry | null = null;
let gBTBannerBar:THREE.BoxGeometry | null = null;
let gBTPanel:    THREE.BoxGeometry | null = null;

function getBTWheel():    THREE.CylinderGeometry { return (gBTWheel    ||= new THREE.CylinderGeometry(BT_WHEEL_R, BT_WHEEL_R, 0.026 * HEX_R, 10, 1)); }
function getBTTyre():     THREE.CylinderGeometry { return (gBTTyre     ||= new THREE.CylinderGeometry(BT_TYRE_R, BT_TYRE_R, 0.030 * HEX_R, 10, 1, true)); }
function getBTNave():     THREE.CylinderGeometry { return (gBTNave     ||= new THREE.CylinderGeometry(0.016 * HEX_R, 0.021 * HEX_R, 0.030 * HEX_R, 6, 1)); }
function getBTNaveRing(): THREE.CylinderGeometry { return (gBTNaveRing ||= new THREE.CylinderGeometry(0.023 * HEX_R, 0.023 * HEX_R, 0.010 * HEX_R, 6, 1, true)); }
function getBTSeam():     THREE.BoxGeometry { return (gBTSeam     ||= new THREE.BoxGeometry(0.007 * HEX_R, 0.100 * HEX_R, 0.009 * HEX_R)); }
function getBTAxle():     THREE.CylinderGeometry { return (gBTAxle     ||= new THREE.CylinderGeometry(0.011 * HEX_R, 0.011 * HEX_R, 0.276 * HEX_R, 6, 1)); }
function getBTRail():     THREE.BoxGeometry { return (gBTRail     ||= new THREE.BoxGeometry(0.036 * HEX_R, 0.032 * HEX_R, 0.396 * HEX_R)); }
function getBTCross():    THREE.BoxGeometry { return (gBTCross    ||= new THREE.BoxGeometry(0.296 * HEX_R, 0.024 * HEX_R, 0.030 * HEX_R)); }
function getBTBracket():  THREE.BoxGeometry { return (gBTBracket  ||= new THREE.BoxGeometry(0.048 * HEX_R, 0.040 * HEX_R, 0.014 * HEX_R)); }
function getBTLash():     THREE.CylinderGeometry { return (gBTLash     ||= new THREE.CylinderGeometry(0.026 * HEX_R, 0.026 * HEX_R, 0.020 * HEX_R, 6, 1, true)); }
function getBTLashSm():   THREE.CylinderGeometry { return (gBTLashSm   ||= new THREE.CylinderGeometry(0.020 * HEX_R, 0.020 * HEX_R, 0.016 * HEX_R, 6, 1, true)); }
function getBTCollar():   THREE.CylinderGeometry { return (gBTCollar   ||= new THREE.CylinderGeometry(0.030 * HEX_R, 0.030 * HEX_R, 0.014 * HEX_R, 6, 1, true)); }
function getBTLeg():      THREE.BoxGeometry { return (gBTLeg      ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.290 * HEX_R, 0.030 * HEX_R)); }
function getBTRidge():    THREE.BoxGeometry { return (gBTRidge    ||= new THREE.BoxGeometry(0.036 * HEX_R, 0.034 * HEX_R, 0.340 * HEX_R)); }
function getBTBrace():    THREE.BoxGeometry { return (gBTBrace    ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.020 * HEX_R, 0.290 * HEX_R)); }
function getBTLogA():     THREE.CylinderGeometry { return (gBTLogA     ||= new THREE.CylinderGeometry(0.036 * HEX_R, 0.030 * HEX_R, 0.198 * HEX_R, 8, 1)); }
function getBTLogB():     THREE.CylinderGeometry { return (gBTLogB     ||= new THREE.CylinderGeometry(0.047 * HEX_R, 0.036 * HEX_R, 0.190 * HEX_R, 8, 1)); }
function getBTBand():     THREE.CylinderGeometry { return (gBTBand     ||= new THREE.CylinderGeometry(0.042 * HEX_R, 0.042 * HEX_R, 0.014 * HEX_R, 8, 1, true)); }
function getBTHead():     THREE.CylinderGeometry { return (gBTHead     ||= new THREE.CylinderGeometry(0.052 * HEX_R, 0.038 * HEX_R, 0.060 * HEX_R, 10, 1)); }
function getBTHeadRing(): THREE.CylinderGeometry { return (gBTHeadRing ||= new THREE.CylinderGeometry(0.049 * HEX_R, 0.049 * HEX_R, 0.016 * HEX_R, 10, 1, true)); }
function getBTLangetH():  THREE.BoxGeometry { return (gBTLangetH  ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.009 * HEX_R, 0.086 * HEX_R)); }
function getBTLangetV():  THREE.BoxGeometry { return (gBTLangetV  ||= new THREE.BoxGeometry(0.009 * HEX_R, 0.022 * HEX_R, 0.086 * HEX_R)); }
function getBTCradle():   THREE.CylinderGeometry { return (gBTCradle   ||= new THREE.CylinderGeometry(0.044 * HEX_R, 0.044 * HEX_R, 0.022 * HEX_R, 8, 1, true)); }
function getBTRope():     THREE.BoxGeometry { return (gBTRope     ||= new THREE.BoxGeometry(0.010 * HEX_R, 0.104 * HEX_R, 0.010 * HEX_R)); }
function getBTPost():     THREE.BoxGeometry { return (gBTPost     ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.286 * HEX_R, 0.024 * HEX_R)); }
function getBTRoof():     THREE.BoxGeometry { return (gBTRoof     ||= new THREE.BoxGeometry(0.196 * HEX_R, 0.014 * HEX_R, 0.176 * HEX_R)); }
function getBTRoofRdg():  THREE.BoxGeometry { return (gBTRoofRdg  ||= new THREE.BoxGeometry(0.034 * HEX_R, 0.028 * HEX_R, 0.356 * HEX_R)); }
function getBTBatten():   THREE.CylinderGeometry { return (gBTBatten   ||= new THREE.CylinderGeometry(0.008 * HEX_R, 0.008 * HEX_R, 0.190 * HEX_R, 5, 1)); }
function getBTDrape():    THREE.BoxGeometry { return (gBTDrape    ||= new THREE.BoxGeometry(0.220 * HEX_R, 0.086 * HEX_R, 0.012 * HEX_R)); }
function getBTSideFlap(): THREE.BoxGeometry { return (gBTSideFlap ||= new THREE.BoxGeometry(0.012 * HEX_R, 0.062 * HEX_R, 0.160 * HEX_R)); }
function getBTPole():     THREE.BoxGeometry { return (gBTPole     ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.020 * HEX_R, 0.170 * HEX_R)); }
function getBTPoleBar():  THREE.BoxGeometry { return (gBTPoleBar  ||= new THREE.BoxGeometry(0.130 * HEX_R, 0.014 * HEX_R, 0.014 * HEX_R)); }
function getBTHandle():   THREE.CylinderGeometry { return (gBTHandle   ||= new THREE.CylinderGeometry(0.012 * HEX_R, 0.014 * HEX_R, 0.120 * HEX_R, 6, 1)); }
function getBTMast():     THREE.BoxGeometry { return (gBTMast     ||= new THREE.BoxGeometry(0.013 * HEX_R, 0.104 * HEX_R, 0.013 * HEX_R)); }
function getBTBanner():   THREE.BoxGeometry { return (gBTBanner   ||= new THREE.BoxGeometry(0.088 * HEX_R, 0.062 * HEX_R, 0.008 * HEX_R)); }
function getBTBannerBar():THREE.BoxGeometry { return (gBTBannerBar||= new THREE.BoxGeometry(0.098 * HEX_R, 0.010 * HEX_R, 0.010 * HEX_R)); }
function getBTPanel():    THREE.BoxGeometry { return (gBTPanel    ||= new THREE.BoxGeometry(0.010 * HEX_R, 0.086 * HEX_R, 0.150 * HEX_R)); }

/** Wiązanie rzemienne w węźle konstrukcji (oś X / Y / Z). */
function btLashing(
  group: THREE.Group, m: THREE.MeshStandardMaterial,
  x: number, y: number, z: number, axis: 'x' | 'y' | 'z', small = false,
): void {
  const l = new THREE.Mesh(small ? getBTLashSm() : getBTLash(), m);
  if (axis === 'x') l.rotation.z = Math.PI / 2;
  else if (axis === 'z') l.rotation.x = Math.PI / 2;
  l.position.set(x * HEX_R, y * HEX_R, z * HEX_R);
  group.add(l);
}

/**
 * KOŁO TRÓJDZIELNE (pkt C1) — 6 mesh: tarcza z desek, opona ze skóry surowej
 * na wieńcu, dwie spoiny desek na licu, wystająca piasta, brązowy pierścień
 * u nasady piasty. Oś koła wzdłuż X; `sx` = strona (-1 lewa, +1 prawa).
 */
function btWheel(
  group: THREE.Group, sx: number, z: number,
  mWood: THREE.MeshStandardMaterial, mSeam: THREE.MeshStandardMaterial,
  mTyre: THREE.MeshStandardMaterial, mBronze: THREE.MeshStandardMaterial,
): void {
  const x = sx * BT_WHEEL_X;
  const disc = new THREE.Mesh(getBTWheel(), mWood);
  disc.rotation.z = Math.PI / 2;
  disc.position.set(x, BT_AXLE_Y, z);
  group.add(disc);

  const tyre = new THREE.Mesh(getBTTyre(), mTyre);       // opona ze skóry surowej
  tyre.rotation.z = Math.PI / 2;
  tyre.position.set(x, BT_AXLE_Y, z);
  group.add(tyre);

  for (const dz of [-0.026, 0.026]) {                    // SPOINY trzech desek
    const seam = new THREE.Mesh(getBTSeam(), mSeam);
    seam.position.set(x + sx * 0.016 * HEX_R, BT_AXLE_Y, z + dz * HEX_R);
    group.add(seam);
  }

  const nave = new THREE.Mesh(getBTNave(), mWood);       // piasta na zewnątrz
  nave.rotation.z = -sx * Math.PI / 2;
  nave.position.set(x + sx * 0.026 * HEX_R, BT_AXLE_Y, z);
  group.add(nave);

  const ring = new THREE.Mesh(getBTNaveRing(), mBronze); // BRĄZ na nasadzie piasty
  ring.rotation.z = Math.PI / 2;
  ring.position.set(x + sx * 0.017 * HEX_R, BT_AXLE_Y, z);
  group.add(ring);
}

// ---------------------------------------------------------------------------
// TARAN OKUTY (Bronze-Shod Ram) — machina oblężnicza epoki Brązu.
// Front = +Z, spód kół na y = 0. Cztery koła pełne trójdzielne (C1), kłoda
// ociosana z BRĄZOWĄ nasadką głowicy + langietami (C2), przenośny daszek ze
// skór (C3), zawiesie na rzemieniach i linach (C5), dyszel + drągi (C7).
// Kolor gracza: proporzec rufowy, płachta na prawej burcie, 2 oploty kłody.
// ---------------------------------------------------------------------------
export function buildTaranOkutyOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const mats: THREE.Material[] = [];
  const mat = (color: number, metalness = 0.1, roughness = 0.7): THREE.MeshStandardMaterial => {
    const m = new THREE.MeshStandardMaterial({ color, metalness, roughness });
    mats.push(m);
    return m;
  };

  const mWood   = mat(BT_WOOD,      0.06, 0.82);
  const mDkWood = mat(BT_WOOD_DK,   0.04, 0.88);
  const mLog    = mat(BT_LOG,       0.05, 0.86);
  const mLogDk  = mat(BT_LOG_DK,    0.04, 0.90);
  const mBronze = mat(BT_BRONZE,    0.62, 0.38);
  const mBronzD = mat(BT_BRONZE_DK, 0.55, 0.46);
  const mHideA  = mat(BT_HIDE_A,    0.04, 0.92);
  const mHideB  = mat(BT_HIDE_B,    0.04, 0.92);
  const mLeath  = mat(BT_LEATHER,   0.05, 0.88);
  const mRope   = mat(BT_ROPE,      0.04, 0.90);
  const mLash   = mat(BT_LASH,      0.03, 0.92);
  const mOwner  = mat(ownerColor_,  0.12, 0.70);

  // ═══ ZESPÓŁ JEZDNY: 4 KOŁA PEŁNE + 2 OSIE STAŁE (pkt C1) ═════════════════
  for (const z of [BT_AXLE_ZF, BT_AXLE_ZR]) {
    for (const sx of [-1, 1]) btWheel(group, sx, z, mWood, mDkWood, mLeath, mBronze);
    const axle = new THREE.Mesh(getBTAxle(), mDkWood);
    axle.rotation.z = Math.PI / 2;
    axle.position.set(0, BT_AXLE_Y, z);
    group.add(axle);
  }

  // ═══ RAMA: 2 podłużnice na osiach + 3 poprzeczki + BRĄZOWE OKUCIA (C5) ═══
  for (const sx of [-1, 1]) {
    const rail = new THREE.Mesh(getBTRail(), mWood);
    rail.position.set(sx * 0.126 * HEX_R, 0.086 * HEX_R, -0.006 * HEX_R);
    group.add(rail);
  }
  for (const cz of [-0.176, -0.012, 0.146]) {
    const cross = new THREE.Mesh(getBTCross(), mWood);
    cross.position.set(0, 0.114 * HEX_R, cz * HEX_R);
    group.add(cross);
  }
  for (const sx of [-1, 1]) {
    btLashing(group, mLash, sx * 0.126, 0.108, -0.012, 'y', true);   // węzeł środkowy
    for (const cz of [-0.176, 0.146]) {                              // 4 narożne okucia
      const br = new THREE.Mesh(getBTBracket(), mBronze);
      br.position.set(sx * 0.126 * HEX_R, 0.098 * HEX_R, cz * HEX_R);
      group.add(br);
    }
  }

  // ═══ KOZIOŁ: 2 pary nóg A + brązowe obejmy w szczycie + kalenica ═════════
  for (const sz of [-0.126, 0.110]) {
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(getBTLeg(), mWood);
      leg.rotation.z = -s * 0.44;
      leg.position.set(s * 0.062 * HEX_R, 0.258 * HEX_R, sz * HEX_R);
      group.add(leg);
      btLashing(group, mLash, s * 0.124, 0.134, sz, 'y', true);      // stopa nogi
    }
    btLashing(group, mLash, 0, 0.390, sz, 'z');                      // wiązanie szczytu
    const collar = new THREE.Mesh(getBTCollar(), mBronzD);           // obejma brązowa
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0.390 * HEX_R, sz * HEX_R);
    group.add(collar);
  }
  const ridge = new THREE.Mesh(getBTRidge(), mDkWood);
  ridge.position.set(0, 0.404 * HEX_R, -0.008 * HEX_R);
  group.add(ridge);
  for (const s of [-1, 1]) {                                         // zastrzały wzdłużne
    const br = new THREE.Mesh(getBTBrace(), mWood);
    br.rotation.x = 0.52;
    br.position.set(s * 0.096 * HEX_R, 0.252 * HEX_R, -0.010 * HEX_R);
    group.add(br);
  }

  // ═══ KŁODA OCIOSANA (pkt C6) — oś Z, wychylona ku +Z (rozpęd) ════════════
  const logA = new THREE.Mesh(getBTLogA(), mLog);
  logA.rotation.x = Math.PI / 2;
  logA.position.set(0, BT_LOG_Y, -0.072 * HEX_R);
  group.add(logA);
  const logB = new THREE.Mesh(getBTLogB(), mLog);
  logB.rotation.x = Math.PI / 2;
  logB.position.set(0, BT_LOG_Y, 0.122 * HEX_R);
  group.add(logB);
  const logShade = new THREE.Mesh(getBTLogA(), mLogDk);   // pas cienia od spodu
  logShade.rotation.x = Math.PI / 2;
  logShade.scale.set(0.98, 1.0, 0.42);
  logShade.position.set(0, BT_LOG_Y - 0.020 * HEX_R, -0.072 * HEX_R);
  group.add(logShade);
  for (const [dz, sc] of [[-0.030, 0.92], [0.078, 1.06]] as [number, number][]) {
    const band = new THREE.Mesh(getBTBand(), mBronzD);    // BRĄZOWE obręcze kłody
    band.rotation.x = Math.PI / 2;
    band.scale.set(sc, 1.0, sc);
    band.position.set(0, BT_LOG_Y, dz * HEX_R);
    group.add(band);
  }

  // ═══ GŁOWICA OKUTA BRĄZEM (pkt C2) ═══════════════════════════════════════
  const head = new THREE.Mesh(getBTHead(), mBronze);      // nasadka (tulejka)
  head.rotation.x = -Math.PI / 2;                          // szeroki koniec ku kłodzie
  head.position.set(0, BT_LOG_Y, 0.232 * HEX_R);
  group.add(head);
  const hRing = new THREE.Mesh(getBTHeadRing(), mBronzD); // pierścień zaciskowy
  hRing.rotation.x = Math.PI / 2;
  hRing.position.set(0, BT_LOG_Y, 0.196 * HEX_R);
  group.add(hRing);
  for (const sy of [-1, 1]) {                             // langiety: góra + dół
    const lg = new THREE.Mesh(getBTLangetH(), mBronze);
    lg.position.set(0, BT_LOG_Y + sy * 0.042 * HEX_R, 0.152 * HEX_R);
    group.add(lg);
  }
  for (const sx of [-1, 1]) {                             // langiety: lewy + prawy
    const lg = new THREE.Mesh(getBTLangetV(), mBronze);
    lg.position.set(sx * 0.042 * HEX_R, BT_LOG_Y, 0.152 * HEX_R);
    group.add(lg);
  }

  // ═══ ZAWIESIE: 2 skórzane kołyski + 3 pary lin do kalenicy (pkt C5) ══════
  for (const cz of [-0.080, 0.094]) {
    const cradle = new THREE.Mesh(getBTCradle(), mLeath);
    cradle.rotation.x = Math.PI / 2;
    cradle.position.set(0, BT_LOG_Y, cz * HEX_R);
    group.add(cradle);
  }
  for (const [rz, tilt] of [[-0.092, 0.30], [0.006, 0.38], [0.104, 0.46]] as [number, number][]) {
    for (const s of [-1, 1]) {
      const rope = new THREE.Mesh(getBTRope(), mRope);
      rope.rotation.x = tilt;
      rope.rotation.z = s * 0.10;
      rope.position.set(s * 0.014 * HEX_R, 0.348 * HEX_R, (rz + 0.014) * HEX_R);
      group.add(rope);
    }
  }
  for (const dz of [-0.130, 0.030]) {                     // KOLOR GRACZA na kłodzie
    const wrap = new THREE.Mesh(getBTBand(), mOwner);
    wrap.rotation.x = Math.PI / 2;
    wrap.scale.set(0.94, 1.0, 0.94);
    wrap.position.set(0, BT_LOG_Y, dz * HEX_R);
    group.add(wrap);
  }

  // ═══ PRZENOŚNY DASZEK ZE SKÓR na 4 słupkach (pkt C3) ═════════════════════
  for (const sx of [-0.146, 0.146]) {
    for (const sz of [-0.144, 0.138]) {
      const post = new THREE.Mesh(getBTPost(), mWood);
      post.position.set(sx * HEX_R, 0.270 * HEX_R, sz * HEX_R);
      group.add(post);
      btLashing(group, mLash, sx, 0.418, sz, 'y', true);   // wiązanie do okapu
    }
  }
  for (const s of [-1, 1]) {
    for (const sz of [-0.084, 0.084]) {
      const hide = (s * sz > 0) ? mHideA : mHideB;         // szachownica łat
      const roof = new THREE.Mesh(getBTRoof(), hide);
      roof.rotation.z = -s * 0.520;
      roof.position.set(s * 0.086 * HEX_R, 0.470 * HEX_R, sz * HEX_R);
      group.add(roof);
    }
    const bat = new THREE.Mesh(getBTBatten(), mLogDk);     // łata gałęziowa
    bat.rotation.z = Math.PI / 2 - s * 0.520;
    bat.position.set(s * 0.086 * HEX_R, 0.478 * HEX_R, 0);
    group.add(bat);
  }
  const roofRidge = new THREE.Mesh(getBTRoofRdg(), mDkWood);
  roofRidge.position.set(0, 0.522 * HEX_R, 0);
  group.add(roofRidge);
  const drape = new THREE.Mesh(getBTDrape(), mHideB);      // zwis z tyłu
  drape.rotation.x = 0.16;
  drape.position.set(0, 0.394 * HEX_R, -0.170 * HEX_R);
  group.add(drape);
  const drapeF = new THREE.Mesh(getBTDrape(), mHideA);     // krótki zwis z przodu
  drapeF.rotation.x = -0.16;
  drapeF.scale.set(0.92, 0.52, 1.0);
  drapeF.position.set(0, 0.414 * HEX_R, 0.176 * HEX_R);
  group.add(drapeF);
  const sideFlap = new THREE.Mesh(getBTSideFlap(), mHideB); // zwis lewej burty
  sideFlap.position.set(-0.152 * HEX_R, 0.390 * HEX_R, -0.012 * HEX_R);
  group.add(sideFlap);

  // ═══ DYSZEL z poprzeczką (dziób) + DRĄGI DO PCHANIA (rufa) — pkt C7 ══════
  const pole = new THREE.Mesh(getBTPole(), mWood);
  pole.rotation.x = 0.24;
  pole.position.set(0, 0.098 * HEX_R, 0.244 * HEX_R);
  group.add(pole);
  const poleBar = new THREE.Mesh(getBTPoleBar(), mWood);
  poleBar.position.set(0, 0.078 * HEX_R, 0.318 * HEX_R);
  group.add(poleBar);
  btLashing(group, mLash, 0, 0.114, 0.166, 'y', true);
  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(getBTHandle(), mWood);
    h.rotation.x = -0.50;
    h.position.set(s * 0.100 * HEX_R, 0.180 * HEX_R, -0.204 * HEX_R);
    group.add(h);
    btLashing(group, mLash, s * 0.100, 0.132, -0.182, 'y', true);
  }

  // ═══ KOLOR GRACZA: proporzec rufowy + płachta na prawej burcie ═══════════
  const mast = new THREE.Mesh(getBTMast(), mWood);
  mast.position.set(0, 0.588 * HEX_R, -0.156 * HEX_R);
  group.add(mast);
  const bar = new THREE.Mesh(getBTBannerBar(), mWood);
  bar.position.set(0.044 * HEX_R, 0.636 * HEX_R, -0.156 * HEX_R);
  group.add(bar);
  const banner = new THREE.Mesh(getBTBanner(), mOwner);
  banner.position.set(0.046 * HEX_R, 0.600 * HEX_R, -0.156 * HEX_R);
  group.add(banner);
  const panel = new THREE.Mesh(getBTPanel(), mOwner);
  panel.position.set(0.152 * HEX_R, 0.382 * HEX_R, -0.012 * HEX_R);
  group.add(panel);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ═══════════════════════════════════════════════════════════════════════════
/** Zwolnienie singletonów modułu (konwencja disposeUnitGeometries z units.ts). */
export function disposeBrazTaranOpus5Geometries(): void {
  const all: (THREE.BufferGeometry | null)[] = [
    gBTWheel, gBTTyre, gBTNave, gBTNaveRing, gBTSeam, gBTAxle,
    gBTRail, gBTCross, gBTBracket, gBTLash, gBTLashSm, gBTCollar,
    gBTLeg, gBTRidge, gBTBrace, gBTLogA, gBTLogB, gBTBand,
    gBTHead, gBTHeadRing, gBTLangetH, gBTLangetV,
    gBTCradle, gBTRope, gBTPost, gBTRoof, gBTRoofRdg, gBTBatten,
    gBTDrape, gBTSideFlap, gBTPole, gBTPoleBar, gBTHandle,
    gBTMast, gBTBanner, gBTBannerBar, gBTPanel,
  ];
  for (const g of all) { g?.dispose(); }
  gBTWheel = gBTTyre = gBTNave = gBTNaveRing = gBTAxle = null;
  gBTLash = gBTLashSm = gBTCollar = gBTLogA = gBTLogB = gBTBand = null;
  gBTHead = gBTHeadRing = gBTCradle = gBTBatten = gBTHandle = null;
  gBTSeam = gBTRail = gBTCross = gBTBracket = gBTLeg = gBTRidge = null;
  gBTBrace = gBTLangetH = gBTLangetV = gBTRope = gBTPost = null;
  gBTRoof = gBTRoofRdg = gBTDrape = gBTSideFlap = gBTPole = null;
  gBTPoleBar = gBTMast = gBTBanner = gBTBannerBar = gBTPanel = null;
}
