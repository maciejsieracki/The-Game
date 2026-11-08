/**
 * kopalnia-cyny-opus5.ts — ULEPSZENIE TERENU „Kopalnia cyny" (własny model 3D).
 * ---------------------------------------------------------------------------
 * Drop-in dla obu rejestrów ulepszeń:
 *   buildKopalniaCyny() : THREE.Group
 *     - render/improvements.ts        → case 'kopalnia_cyny'
 *     - render/robloxImprovements.ts  → BUILDERS.kopalnia_cyny
 * Do 2026-08-17 Kopalnia cyny reużywała generyczny model kopalni (ten sam, co
 * Kopalnia żelaza i Kopalnia miedzi — buildKopalnia z ulepszenia-modele-p2.ts).
 * Ten plik to kończy; wpięcia opisane w komentarzach w obu rejestrach.
 *
 * KONWENCJE (identyczne jak render/kopalnia-zlota-opus5.ts):
 *   - HEX_R = 1.0; CAŁY model mieści się w obrysie heksa (wpisany promień heksa
 *     0,866×HEX_R) — nic nie wychodzi na sąsiada,
 *   - spód modelu na y = 0 (powierzchnia heksa); jedyne, co „lewituje", to dym
 *     nad kominem pieca (konwencja z ogniska w ulepszenia-modele-p3a.ts),
 *   - PRZÓD = +Z, bo kamera gry stoi w azymucie 0 i patrzy pod 52°
 *     (render/camera.ts) — czelusć pieca, płuczka i sztabki są z przodu,
 *     masa skalna z chodnikiem z tyłu,
 *   - WYŁĄCZNIE MeshStandardMaterial,
 *   - geometrie i materiały to SINGLETONY modułu (cache po wymiarach) —
 *     żadnej nowej geometrii per instancja; dlatego userData['mats'] i
 *     userData['perTokenGeos'] są PUSTE (nie wolno ich zwalniać per żeton,
 *     bo są współdzielone). Zwolnienie całości: disposeKopalniaCynyGeometrie().
 *
 * ===========================================================================
 * ZGODNOŚĆ HISTORYCZNA (ulepszenie epoki Brązu — cyna jest wsadem do brązu)
 * ===========================================================================
 * Z1. RUDĄ CYNY JEST KASYTERYT (SnO₂) — CIĘŻKI, CZARNOBRUNATNY, NIE „BŁYSZCZĄCY
 *     METAL W SKALE". Dlatego urobek w modelu jest niemal czarny, a nie żółty
 *     (złoto) ani rdzawy/turkusowy (żelazo/miedź). Metaliczna, srebrzysta cyna
 *     pojawia się dopiero jako SZTABKI po wytopie (Z4), nie w skale.
 * Z2. WĄSKI CHODNIK W WYCHODNI ŻYŁY, NIE SZEROKA SZTOLNIA. Kestel w Taurusie
 *     (ok. 3000–2000 p.n.e.), najlepiej rozpoznana kopalnia cyny epoki brązu,
 *     to system korytarzy tak ciasnych, że pracowano w nich na klęczkach.
 *     W modelu: pionowa, wąska czarna szczelina w skale, ocembrowana dwoma
 *     stemplami i oczepem — świadomie INNA niż szeroki, poziomy portal
 *     z wagonikiem w Kopalni miedzi/żelaza.
 * Z3. KAMIENNE MŁOTY Z ROWKIEM NA TRZON — narzędzie-znak rozpoznawczy górnictwa
 *     epoki brązu (Kestel, Kargaly, Great Orme): otoczak z wykutym rowkiem,
 *     w który wiązano rozwidlony trzon. Dwa leżą u podnóża wychodni.
 * Z4. PŁUCZKA KORYTKOWA PRZY ZIEMI („tin streaming"). Kasyteryt jest ~2× cięższy
 *     od skały płonnej, więc oddziela się PŁUKANIEM: płytkie, płaskie koryto,
 *     woda spływa górą, czarny koncentrat osiada na dnie. Koryto jest CELOWO
 *     niskie i prostokątne, leżące wprost na ziemi — Kopalnia złota ma pochyłą
 *     rynnę na kozłach i sadzawkę, i te dwie sylwetki nie mogą się mylić.
 * Z5. PIEC MISOWY Z GLINIANĄ KOPUŁĄ, MIECH I SZTABKI. Kasyteryt redukuje się
 *     węglem drzewnym w stosunkowo niskiej temperaturze, a wytop na miejscu
 *     złoża jest poświadczony (Göltepe/Kestel — tygle, żużel cynowy). Produkt
 *     to płasko-wypukłe sztabki („bun ingots"), znane m.in. z wraku z Salcombe
 *     i z Uluburun. To one — a nie ruda — niosą komunikat „CYNA".
 * Z6. CZEGO TU NIE MA — brak torów, wagonika, kołowrotu korbowego, metalowej
 *     wieży: to wyróżniki Kopalni miedzi/żelaza. Jedyny metal w modelu to same
 *     sztabki cyny; konstrukcje są drewniane i gliniane.
 *
 * ===========================================================================
 * RÓŻNICA SYLWETKI WOBEC POZOSTAŁYCH KOPALŃ (nie tylko kolor)
 * ===========================================================================
 *   Kopalnia miedzi/żelaza (buildKopalnia) = pagórek skalny + POZIOMA sztolnia
 *     + tory + wagonik → z 52° „prostopadłościan z dziurą i ogonem torów".
 *   Kopalnia złota (buildKopalniaZlota) = pionowy TRÓJNÓG + POCHYŁA rynna na
 *     kozłach + okrągła sadzawka → „trójkąt + ukośna belka + oczko wody".
 *   Kopalnia cyny (ten plik) = jedyna OBŁA KOPUŁA wśród ulepszeń (piec) z
 *     pióropuszem dymu + PŁASKA, prostokątna taca płuczki tuż przy ziemi
 *     + jasny stosik sztabek → „kopuła z dymem + płaska taca".
 *   Kolor jest dodatkiem: czerń kasyterytu vs żółć złota vs rdza/turkus rudy.
 *
 * ===========================================================================
 * DLACZEGO SZTABKI SĄ CYNOWE, A NIE BIAŁE (lekcja KOR-1 z Kopalni złota)
 * ===========================================================================
 *   Cyna metaliczna jest srebrzystobiała, a złoże cyny leży na Wzgórzach LUB
 *   Górach (gen-helpers.ts, DEPOSIT_RULES id='cyna') — czysta biel czytałaby
 *   się w skali mapy jak śnieg na szczycie albo jak kryształy soli (dokładnie
 *   ten błąd popełniła pierwsza wersja Kopalni złota z białym kwarcem).
 *   Dlatego sztabki mają barwę chłodnej cyny (0xc6ccd4) z ciemniejszym spodem,
 *   metalness 0,72 i BEZ emisji, a największą masą modelu jest ciemna glina
 *   pieca i czarny kasyteryt — jasny akcent jest mały i punktowy.
 */
import * as THREE from 'three';
import { HEX_R } from './hexutil';

// ═══ KOR-1 (korekta po oględzinach zrzutu w skali mapy, 2026-08-17) ════════
// Pierwsza wersja miała JASNOSZARĄ wychodnię (0x8e9298 / 0xa5a9ae) i to ona —
// nie piec ani sztabki — była największą i najjaśniejszą masą modelu. Skutek na
// zrzucie w skali sektora (0,30): bryła czytała się jak „szara skała z rzeczami
// obok", czyli dokładnie jak generyczna Kopalnia miedzi/żelaza, którą ten model
// miał zastąpić; czarny kasyteryt i srebrne sztabki ginęły. Poprawka NIE rusza
// układu: (a) skała zbita do CIEPŁEGO ciemnego szarobrązu — ciepłego, nie
// fioletowego jak skała macierzysta złota, żeby oba modele dalej się różniły,
// (b) piec powiększony i to on przejmuje rolę dominanty, (c) sztabki cyny
// rozjaśnione i o jeden rząd wyższe, (d) dym przesunięty nad przód komina, bo
// za kopułą był niewidoczny.
// / EN: KOR-1 — the pale outcrop was out-shouting the furnace and the tin, making
// the model read like the generic mine it replaces. Rock darkened (warm, not the
// purple of the gold host rock), furnace enlarged, ingots brightened, smoke moved.

// ═══ PALETA ════════════════════════════════════════════════════════════════
const KC = {
  skala:     0x77706a,   // skała wychodni — KOR-1: ciepły ciemny szarobrąz
  skalaDk:   0x5c5751,   // cień / plac roboczy / otoczaki młotów
  skalaHi:   0x8b847c,   // czapa wychodni
  kasyteryt: 0x2a201a,   // ruda cyny — czarnobrunatna (Z1)
  kasytHi:   0x4a3a2e,   // odłamek z jaśniejszym licem
  glina:     0xb0663a,   // kopuła pieca
  glinaDk:   0x8a4a24,   // podmurówka / wylot komina
  drewno:    0xc98a4b,
  drewnoDk:  0x8a5a2e,
  skora:     0x9c7a4f,   // miech
  wiklina:   0xb2823f,   // kosz na urobek
  wegiel:    0x1d1b19,   // węgiel drzewny
  zar:       0xff8a1e,   // żar w czeluści
  zarDk:     0xd44f10,
  dym:       0xb8b2a8,   // dym — przygaszony (jasny czytałby się jak śnieg), ale widoczny na kopule
  woda:      0x6b95a4,   // ta sama stonowana woda co w Kopalni złota
  cyna:      0xdae2ec,   // sztabka cyny (Z5) — KOR-1: rozjaśniona, to ona niesie komunikat
  cynaDk:    0xa9b2bd,
  czern:     0x14100b,   // gardziel chodnika / czeluść pieca
} as const;

// ═══ SINGLETONY: materiały ═════════════════════════════════════════════════
const MATS = new Map<number, THREE.MeshStandardMaterial>();
function mat(color: number): THREE.MeshStandardMaterial {
  let m = MATS.get(color);
  if (!m) {
    // Cyna jako jedyna dostaje metalness — ale BEZ emisji (patrz nagłówek):
    // rozświetlona biel myliłaby się ze śniegiem na Górach i z solą.
    // / EN: tin is the only metallic material here — and deliberately without
    // emissive, so it cannot read as snow on Mountains or as salt crystals.
    const cynowy = color === KC.cyna || color === KC.cynaDk;
    const zarowy = color === KC.zar || color === KC.zarDk;
    m = new THREE.MeshStandardMaterial({
      color,
      flatShading: true,
      metalness: cynowy ? 0.72 : 0.04,
      roughness: cynowy ? 0.30 : 0.88,
      emissive: zarowy ? new THREE.Color(color).multiplyScalar(0.35) : new THREE.Color(0x000000),
    });
    MATS.set(color, m);
  }
  return m;
}

// ═══ SINGLETONY: geometrie (cache po wymiarach — zero alokacji per instancja) ═
const GEOS = new Map<string, THREE.BufferGeometry>();
function boxGeo(w: number, h: number, d: number): THREE.BoxGeometry {
  const k = `b|${w}|${h}|${d}`;
  let g = GEOS.get(k) as THREE.BoxGeometry | undefined;
  if (!g) { g = new THREE.BoxGeometry(w, h, d); GEOS.set(k, g); }
  return g;
}
function cylGeo(rt: number, rb: number, h: number, seg = 6, open = false): THREE.CylinderGeometry {
  const k = `c|${rt}|${rb}|${h}|${seg}|${open ? 1 : 0}`;
  let g = GEOS.get(k) as THREE.CylinderGeometry | undefined;
  if (!g) { g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, open); GEOS.set(k, g); }
  return g;
}
/** Walec jednostkowy (r=1, h=1) — belki pod dowolnym kątem robimy przez scale. */
function unitCyl(): THREE.CylinderGeometry { return cylGeo(1, 1, 1, 6); }

// ═══ POMOCNIKI ═════════════════════════════════════════════════════════════
const R = HEX_R;

function B(
  g: THREE.Object3D, w: number, h: number, d: number,
  x: number, y: number, z: number, color: number,
  rx = 0, ry = 0, rz = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(boxGeo(w, h, d), mat(color));
  m.position.set(x * R, y * R, z * R);
  if (rx || ry || rz) m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
  return m;
}

function C(
  g: THREE.Object3D, rt: number, rb: number, h: number,
  x: number, y: number, z: number, color: number,
  seg = 6, rx = 0, ry = 0, rz = 0, open = false,
): THREE.Mesh {
  const m = new THREE.Mesh(cylGeo(rt, rb, h, seg, open), mat(color));
  m.position.set(x * R, y * R, z * R);
  if (rx || ry || rz) m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  g.add(m);
  return m;
}

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

/** Belka/dysza od punktu A do B (walec jednostkowy + scale — bez nowej geometrii). */
function strut(
  g: THREE.Object3D, color: number, r: number,
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
): THREE.Mesh {
  _a.set(ax * R, ay * R, az * R);
  _b.set(bx * R, by * R, bz * R);
  _dir.subVectors(_b, _a);
  const len = _dir.length();
  const m = new THREE.Mesh(unitCyl(), mat(color));
  m.scale.set(r * R, len, r * R);
  m.position.copy(_a).add(_b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(_up, _dir.normalize());
  m.castShadow = true;
  g.add(m);
  return m;
}

// ═══ PŁUCZKA — układ lokalny ═══════════════════════════════════════════════
// Koryto leży PŁASKO na ziemi (bez kozłów, bez pochylenia — patrz Z4), obrócone
// tylko w poziomie, żeby przy 52° nie zlało się w kreskę równoległą do horyzontu.
const PL_X = 0.235;      // środek koryta w X
const PL_Z = 0.300;      // środek koryta w Z
const PL_YAW = -0.42;    // obrót w poziomie (rad)

// ═══════════════════════════════════════════════════════════════════════════
/**
 * Kopalnia cyny — wąski chodnik w wychodni kasyterytu (Z2), kamienne młoty (Z3),
 * płaska płuczka korytkowa (Z4), piec misowy z kopułą, miechem i sztabkami cyny (Z5).
 * Przód (+Z) = strona kamery. Podstawa na y = 0.
 */
export function buildKopalniaCyny(): THREE.Group {
  const g = new THREE.Group();

  // ── 1. PLAC ROBOCZY: niska skalna półka pod całym zestawem ───────────────
  B(g, 0.86, 0.045, 0.70, 0.00, 0.022, 0.00, KC.skalaDk, 0, 0.10, 0);

  // ── 2. WYCHODNIA KASYTERYTU (Z1) — masa skalna z tyłu, żyła na licu
  //      zwróconym do kamery (+Z), inaczej z 52° w ogóle jej nie widać ──────
  B(g, 0.50, 0.30, 0.22, -0.06, 0.150, -0.395, KC.skala, 0, 0.10, 0);
  B(g, 0.25, 0.20, 0.19, 0.27, 0.100, -0.325, KC.skalaHi, 0, -0.30, 0);
  B(g, 0.28, 0.11, 0.15, -0.14, 0.345, -0.400, KC.skalaHi, 0, 0.24, 0.06);
  // czarna żyła kasyterytu na licu — pogrubiona i rozgałęziona, bo w skali
  // sektora (0,30) cienka kreska ginie / EN: vein deliberately thick — a thin
  // line disappears once the improvement is scaled down to the hex sector.
  B(g, 0.30, 0.050, 0.035, -0.12, 0.238, -0.288, KC.kasyteryt, 0, 0.10, 0.15);
  B(g, 0.12, 0.038, 0.032, -0.28, 0.170, -0.286, KC.kasytHi, 0, 0.10, -0.42);
  B(g, 0.11, 0.036, 0.032, 0.16, 0.155, -0.240, KC.kasyteryt, 0, -0.30, 0.32);

  // ── 3. WĄSKI CHODNIK (Z2) — pionowa szczelina z ocembrowaniem.
  //      Świadomie PIONOWA i wąska: poziomy portal to Kopalnia miedzi/żelaza ─
  B(g, 0.080, 0.235, 0.055, -0.05, 0.118, -0.283, KC.czern);
  B(g, 0.032, 0.255, 0.038, -0.108, 0.128, -0.268, KC.drewnoDk);
  B(g, 0.032, 0.255, 0.038, 0.008, 0.128, -0.268, KC.drewnoDk);
  B(g, 0.170, 0.038, 0.042, -0.05, 0.272, -0.268, KC.drewnoDk);

  // ── 4. KAMIENNE MŁOTY Z ROWKIEM (Z3) — u podnóża wychodni, leżą na ziemi.
  //      Świadomie KLOCKOWE (obrót tylko wokół Y): leżący walec wchodziłby
  //      obrysem pod teren, a podniesiony ponad promień — lewitował.
  //      / EN: deliberately blocky (yaw-only): a lying cylinder would dip below
  //      the terrain, and raising it above its radius would make it float. ─────
  for (const [mx, mz, rot] of [[0.150, -0.180, 0.55], [0.320, -0.110, -0.75]] as const) {
    B(g, 0.120, 0.072, 0.078, mx, 0.036, mz, KC.skalaDk, 0, rot, 0);
    B(g, 0.026, 0.078, 0.084, mx, 0.039, mz, KC.czern, 0, rot, 0);              // rowek na trzon
    strut(g, KC.drewnoDk, 0.013,
      mx - Math.sin(rot) * 0.075, 0.040, mz - Math.cos(rot) * 0.075,
      mx - Math.sin(rot) * 0.200, 0.030, mz - Math.cos(rot) * 0.200);
  }

  // ── 5. PIEC MISOWY Z GLINIANĄ KOPUŁĄ (Z5) — pionowa dominanta sylwetki
  //      i JEDYNA obła bryła wśród ulepszeń terenu ─────────────────────────
  // KOR-1: piec powiększony — to on, a nie skała, ma być dominantą sylwetki
  const PX = -0.290, PZ = -0.010;
  C(g, 0.238, 0.254, 0.052, PX, 0.026, PZ, KC.glinaDk, 8);          // podmurówka
  C(g, 0.198, 0.230, 0.165, PX, 0.134, PZ, KC.glina, 8);            // trzon kopuły
  C(g, 0.104, 0.194, 0.122, PX, 0.278, PZ, KC.glina, 8);            // zwężenie kopuły
  C(g, 0.062, 0.086, 0.058, PX, 0.368, PZ, KC.glinaDk, 8);          // wylot komina
  // KOR-2 (po oględzinach z elewacji 20°): sama kopuła czytała się jak stożkowy
  // NAMIOT (obóz łowiecki). Obręcz opasująca w połowie wysokości + wypływ żużla
  // u podnóża to elementy, których namiot mieć nie może — bryła staje się piecem.
  // / EN: the bare dome read as a conical tent; the binding ring and the slag
  // run-off at its foot are things a tent cannot have.
  C(g, 0.196, 0.196, 0.026, PX, 0.212, PZ, KC.glinaDk, 8);          // obręcz opasująca
  B(g, 0.150, 0.028, 0.090, PX + 0.020, 0.014, PZ + 0.268, KC.wegiel, 0, 0.18, 0); // wypływ żużla
  // czeluść z żarem — lico kopuły zwrócone do kamery
  B(g, 0.145, 0.130, 0.055, PX, 0.120, PZ + 0.208, KC.czern);
  B(g, 0.110, 0.068, 0.030, PX, 0.094, PZ + 0.232, KC.zar);
  B(g, 0.078, 0.036, 0.026, PX, 0.148, PZ + 0.230, KC.zarDk);
  // dym — klocki nad kominem (konwencja ogniska z ulepszenia-modele-p3a.ts).
  // KOR-1: przesunięty ku PRZODOWI (+Z), bo dokładnie nad kopułą znikał za nią
  // przy 52°. / EN: moved forward — straight above the dome it hid behind it at 52°.
  B(g, 0.072, 0.064, 0.072, PX + 0.014, 0.436, PZ + 0.058, KC.dym, 0.20, 0.5, 0.15);
  B(g, 0.092, 0.082, 0.092, PX + 0.040, 0.522, PZ + 0.104, KC.dym, -0.15, 0.2, 0.30);

  // ── 6. MIECH SKÓRZANY Z DYSZĄ (Z5) — bez niego kasyteryt się nie zredukuje ─
  B(g, 0.155, 0.075, 0.130, -0.435, 0.058, -0.215, KC.skora, 0, -0.55, 0);
  B(g, 0.150, 0.026, 0.125, -0.435, 0.108, -0.215, KC.drewno, 0, -0.55, 0);
  B(g, 0.020, 0.115, 0.020, -0.480, 0.150, -0.255, KC.drewnoDk, 0, 0, 0.22);
  strut(g, KC.glinaDk, 0.020, -0.372, 0.075, -0.176, PX - 0.140, 0.085, PZ - 0.060);

  // ── 7. WĘGIEL DRZEWNY — stożek przy piecu (wsad redukcyjny) ──────────────
  C(g, 0.010, 0.115, 0.125, -0.395, 0.062, 0.205, KC.wegiel, 7);
  B(g, 0.060, 0.052, 0.058, -0.268, 0.026, 0.238, KC.wegiel, 0, 0.4, 0);
  B(g, 0.048, 0.042, 0.046, -0.470, 0.021, 0.115, KC.wegiel, 0, -0.3, 0);

  // ── 8. PŁUCZKA KORYTKOWA (Z4) — płaska taca WPROST NA ZIEMI.
  //      Kopalnia złota ma pochyłą rynnę na kozłach; te dwie sylwetki
  //      nie mogą się mylić, dlatego tu zero podpór i zero pochylenia ───────
  {
    const pl = new THREE.Group();
    B(pl, 0.370, 0.042, 0.240, 0, 0.021, 0, KC.drewno);                  // dno koryta
    for (const dz of [-0.108, 0.108]) {                                  // burty wzdłużne
      B(pl, 0.370, 0.070, 0.030, 0, 0.055, dz, KC.drewnoDk);
    }
    for (const dx of [-0.185, 0.185]) {                                  // czoła
      B(pl, 0.026, 0.070, 0.212, dx, 0.055, 0, KC.drewnoDk);
    }
    B(pl, 0.320, 0.026, 0.185, 0.010, 0.055, 0, KC.kasyteryt);           // czarny koncentrat na dnie
    B(pl, 0.120, 0.020, 0.180, -0.115, 0.070, 0, KC.woda);               // woda u wlotu
    B(pl, 0.070, 0.030, 0.062, 0.120, 0.076, -0.030, KC.kasytHi, 0, 0.4, 0); // przegarnięty urobek
    pl.position.set(PL_X * R, 0, PL_Z * R);
    pl.rotation.y = PL_YAW;
    g.add(pl);
  }
  // krótka rynienka doprowadzająca wodę do wlotu płuczki (leży na ziemi)
  B(g, 0.190, 0.038, 0.075, 0.030, 0.040, 0.222, KC.drewnoDk, 0, -0.42, 0);
  B(g, 0.150, 0.016, 0.045, 0.030, 0.062, 0.222, KC.woda, 0, -0.42, 0);

  // ── 9. SZTABKI CYNY (Z5) — nośnik komunikatu „CYNA".
  //      Płasko-wypukłe „bun ingots" na desce, z przodu i w pełnym świetle ──
  B(g, 0.265, 0.032, 0.185, -0.085, 0.016, 0.318, KC.drewnoDk, 0, 0.18, 0);
  C(g, 0.078, 0.094, 0.056, -0.170, 0.060, 0.306, KC.cyna, 8);
  C(g, 0.078, 0.094, 0.056, -0.006, 0.060, 0.332, KC.cyna, 8);
  C(g, 0.070, 0.086, 0.052, -0.088, 0.114, 0.318, KC.cynaDk, 8);
  C(g, 0.058, 0.072, 0.046, -0.088, 0.163, 0.318, KC.cyna, 8);

  // ── 10. KOSZ Z UROBKIEM + luźne bryłki kasyterytu ───────────────────────
  C(g, 0.088, 0.068, 0.105, 0.430, 0.052, 0.055, KC.wiklina, 8);
  C(g, 0.096, 0.096, 0.020, 0.430, 0.112, 0.055, KC.drewnoDk, 8);
  B(g, 0.075, 0.055, 0.070, 0.430, 0.132, 0.055, KC.kasyteryt, 0, 0.45, 0);
  B(g, 0.052, 0.040, 0.048, 0.398, 0.155, 0.020, KC.kasytHi, 0, -0.35, 0);
  B(g, 0.078, 0.060, 0.072, 0.300, 0.030, 0.185, KC.kasyteryt, 0, 0.30, 0);
  B(g, 0.058, 0.046, 0.054, 0.135, 0.023, 0.075, KC.kasytHi, 0, -0.50, 0);

  // Materiały i geometrie są WSPÓŁDZIELONE — nie wolno ich zwalniać per żeton.
  g.userData['mats'] = [];
  g.userData['perTokenGeos'] = [];
  return g;
}

/** Zwolnienie singletonów modułu (analogicznie do dispose* w modelach jednostek). */
export function disposeKopalniaCynyGeometrie(): void {
  for (const geo of GEOS.values()) geo.dispose();
  GEOS.clear();
  for (const m of MATS.values()) m.dispose();
  MATS.clear();
}
