/**
 * kopalnia-zlota-opus5.ts — ULEPSZENIE TERENU „Kopalnia złota" (własny model 3D).
 * ---------------------------------------------------------------------------
 * Drop-in dla obu rejestrów ulepszeń:
 *   buildKopalniaZlota() : THREE.Group
 *     - render/improvements.ts        → case 'kopalnia_zlota'
 *     - render/robloxImprovements.ts  → BUILDERS.kopalnia_zlota
 * Do 2026-07-25 Kopalnia złota reużywała model Kopalni miedzi — ten plik to
 * kończy (patrz komentarze przy wpięciach).
 *
 * KONWENCJE (jak modele jednostek *-opus5.ts i ulepszenia-modele-p2.ts):
 *   - HEX_R = 1.0; CAŁY model mieści się w obrysie heksa (najdalszy wierzchołek
 *     0,683 przy wpisanym promieniu heksa 0,866) — nic nie wychodzi na sąsiada,
 *   - spód modelu na y = 0 (powierzchnia heksa); nic nie lewituje poza koszem,
 *     który WISI na linie (i tak ma wisieć),
 *   - PRZÓD = +Z, bo kamera gry stoi w azymucie 0 i patrzy pod 52°
 *     (render/camera.ts) — najlepiej czytelne elementy (rynna płuczkowa,
 *     misa ze złotem, sadzawka) są z przodu, masa skalna z tyłu,
 *   - WYŁĄCZNIE MeshStandardMaterial,
 *   - geometrie i materiały to SINGLETONY modułu (cache po wymiarach) —
 *     żadnej nowej geometrii per instancja; dlatego userData['mats'] i
 *     userData['perTokenGeos'] są PUSTE (nie wolno ich zwalniać per żeton,
 *     bo są współdzielone). Zwolnienie całości: disposeKopalniaZlotaGeometrie().
 *
 * ===========================================================================
 * ZGODNOŚĆ HISTORYCZNA (Kamień → Brąz → Żelazo; ulepszenie wchodzi w Brązie)
 * ===========================================================================
 * Z1. TO JEST ODKRYWKA Z PŁYTKIM SZYBEM, NIE KOPALNIA PRZEMYSŁOWA.
 *     Najstarsze wydobycie złota (Wadi Hammamat i Nubia w Egipcie, Sakdrisi
 *     w Kolchidzie ~3400 p.n.e., Bulgaria/Warna) to wcinka w wychodnię żyły
 *     kwarcowej plus szybik na kilka–kilkanaście metrów. Stąd w modelu: niska
 *     TARASOWA PÓŁKA WYROBISKA, czarny otwór szybu obudowany drewnianą
 *     cembrowiną i biała WYCHODNIA KWARCU z żyłką złota — złoto epoki brązu
 *     wychodzi z kwarcu albo z piasku rzecznego, nie z „rudy" w wagoniku.
 * Z2. TRÓJNÓG Z WAŁKIEM I KOSZEM — urobek z szybiku wyciągano LINĄ. Trójnóg
 *     (kozioł nożycowy) z wałkiem oplecionym liną i wiklinowym koszem to
 *     najprostsza konstrukcja spełniająca to zadanie i jedyna, jaką da się
 *     obronić dla epoki brązu. ŚWIADOMIE BEZ KORBY (kołowrót korbowy to
 *     rozwiązanie znacznie późniejsze) — lina schodzi wprost z wałka.
 * Z3. RYNNA PŁUCZKOWA Z RUNEM — najbardziej „podręcznikowy" element złota
 *     starożytnego. Strabon opisuje, że w Kolchidzie łapano drobiny złota
 *     rozpinając SKÓRY OWCZE w korycie potoku; runo pełne złotych okruchów to
 *     pierwotny sens mitu o Złotym Runie. W modelu: pochylone drewniane
 *     koryto na dwóch kozłach, w nim jasne runo, na runie kilka drobin złota,
 *     u góry strużka wody, u dołu sadzawka.
 * Z4. MISA (BATEA) Z ZŁOTYM PYŁEM — płukanie ręczne w płytkiej drewnianej
 *     misie; ustawiona z przodu i płasko, bo to jedyny element czytający
 *     „ZŁOTO" jednoznacznie z 52°.
 * Z5. KAMIEŃ DO KRUSZENIA KWARCU — płyta z rozcieraczem. Kwarc trzeba było
 *     rozbić i roztrzeć zanim poszedł do płukania (żarna do rudy są
 *     poświadczone w egipskich kopalniach złota).
 * Z6. CZEGO TU NIE MA — ŻADNEGO PRZEMYSŁU: brak szyn, wagoników, metalowej
 *     wieży wyciągowej, kół zębatych, stempli maszynowych. Jedyny metal to
 *     samo złoto. Elementy nośne są drewniane i WIĄZANE liną, nie gwożdżone.
 *
 * ===========================================================================
 * RÓŻNICA SYLWETKI WOBEC KOPALNI MIEDZI (a nie tylko kolor)
 * ===========================================================================
 *   Kopalnia miedzi/żelaza (ulepszenia-modele-p2.ts buildKopalnia) = ZWARTA
 *   BRYŁA: skalna góra ze sztolnią wbitą POZIOMO, portal ze stempli, tory
 *   i wózek — poziomy, ciężki, pełny prostopadłościan.
 *   Kopalnia złota = SZKIELET I POCHYŁA: płaskie, tarasowe wyrobisko przy
 *   ziemi + SMUKŁY TRÓJNÓG w pionie (najwyższy punkt modelu, 0,50 HEX_R)
 *   + długa POCHYŁA RYNNA na kozłach schodząca ku kamerze + okrągła sadzawka.
 *   Z 52° czyta się to jako „trójkąt + ukośna belka + oczko wody",
 *   a miedź jako „pagórek z dziurą". Kolor jest dodatkiem, nie nośnikiem.
 */
import * as THREE from 'three';
import { HEX_R } from './hexutil';

// ═══ PALETA ════════════════════════════════════════════════════════════════
const KZ = {
  skala:    0xa39d8f,   // szara skała wyrobiska
  skalaDk:  0x78735f,   // cień / półka górna / obrzeże sadzawki
  kwarc:    0xcac2ae,   // kwarc — skała złotonośna i hałda urobku (KOR-1: przygaszony,
                        // wcześniej 0xe2ddd0 czytał się na Górach jak śnieg)
  drewno:   0xc98a4b,
  drewnoDk: 0x8a5a2e,
  lina:     0xb9a37c,   // lina / oploty
  wiklina:  0xb2823f,   // kosz
  runo:     0xe4d7ba,   // runo owcze w rynnie — ściemnione, żeby złoto na nim wyszło
  woda:     0x6b95a4,   // WODA STONOWANA (patrz KOR-1)
  wodaDk:   0x577c8b,   // woda w cieniu sadzawki
  zloto:    0xffd12a,
  zlotoDk:  0xe0a114,
  czern:    0x14100b,   // gardziel szybu
} as const;

// ═══ KOR-1 (korekta po oględzinach zrzutu w skali mapy, 2026-07-25) ═════════
// Pierwsza wersja czytała się z odległości jako „biało-błękitna plamka": jaskrawy
// cyjan rynny i sadzawki był NAJJAŚNIEJSZYM elementem modelu, biały kwarc dominował
// masą (na Górach grozi to pomyleniem ze śniegiem), a złote akcenty były tak małe,
// że w skali sektora (0,30) znikały. Poprawka NIE rusza bryły — zmienia wyłącznie
// wagę barw: (a) woda zbita do przygaszonego szaro-modrego, (b) kwarc i runo
// ściemnione o stopień, (c) WSZYSTKIE istniejące akcenty złota powiększone
// i rozjaśnione (żyła, drobiny na runie, kosz, misa, hałda, urobek przy żarnach) —
// bez dokładania złota w miejsca, w których go historycznie nie było.

// ═══ SINGLETONY: materiały ═════════════════════════════════════════════════
const MATS = new Map<number, THREE.MeshStandardMaterial>();
function mat(color: number): THREE.MeshStandardMaterial {
  let m = MATS.get(color);
  if (!m) {
    // Złoto jako jedyne dostaje metalness + delikatną emisję — w skali mapy
    // (model zmniejszony do 0,30) sam kolor jest za słaby, żeby wygrać z bielą.
    const zloty = color === KZ.zloto || color === KZ.zlotoDk;
    m = new THREE.MeshStandardMaterial({
      color,
      flatShading: true,
      metalness: zloty ? 0.62 : 0.04,
      roughness: zloty ? 0.28 : 0.88,
      emissive: zloty ? new THREE.Color(color).multiplyScalar(0.22) : new THREE.Color(0x000000),
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

/** Belka/lina od punktu A do B (walec jednostkowy + scale — bez nowej geometrii). */
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

// ═══ RYNNA PŁUCZKOWA — układ lokalny ═══════════════════════════════════════
// Koryto biegnie UKOŚNIE przez heks: góra z tyłu-lewej, spływ ku przodowi-prawej.
// Ukos jest celowy — rynna ustawiona wzdłuż osi Z byłaby skrócona perspektywą
// przy 52° i spłaszczyłaby się do „deski leżącej na ziemi".
const SL_X = 0.250;       // środek koryta w X
const SL_Y = 0.250;       // wysokość środka koryta
const SL_Z = 0.095;       // środek koryta w Z
const SL_TILT = 0.40;     // pochylenie (rad) — koniec +Z schodzi w dół
const SL_YAW = 0.55;      // obrót w poziomie (rad) — spływ ku prawej-przodowi
const SL_LEN = 0.50;      // długość koryta

const SL_Q = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(SL_TILT, SL_YAW, 0, 'YXZ'),
);
const _sl = new THREE.Vector3();

/** Punkt układu rynny (lokalne x,y,z wzdłuż koryta) → świat. */
function sluice(lx: number, ly: number, lz: number): [number, number, number] {
  _sl.set(lx, ly, lz).applyQuaternion(SL_Q);
  return [SL_X + _sl.x, SL_Y + _sl.y, SL_Z + _sl.z];
}

/** Klocek leżący w układzie rynny (pozycja i obrót lokalne dla koryta). */
function BSL(
  g: THREE.Object3D, w: number, h: number, d: number,
  lx: number, ly: number, lz: number, color: number,
): THREE.Mesh {
  const [x, y, z] = sluice(lx, ly, lz);
  const m = new THREE.Mesh(boxGeo(w, h, d), mat(color));
  m.position.set(x * R, y * R, z * R);
  m.quaternion.copy(SL_Q);
  m.castShadow = true;
  g.add(m);
  return m;
}

// ═══════════════════════════════════════════════════════════════════════════
/**
 * Kopalnia złota — odkrywka z płytkim szybem (trójnóg + kosz), rynna
 * płuczkowa z runem, sadzawka, misa ze złotym pyłem, hałda kwarcu.
 * Przód (+Z) = strona kamery. Podstawa na y = 0.
 */
export function buildKopalniaZlota(): THREE.Group {
  const g = new THREE.Group();

  // ── 1. WYROBISKO: dwie skalne półki (dolna robocza, górna z szybem) ──────
  B(g, 0.88, 0.05, 0.72, 0.00, 0.025, -0.02, KZ.skala, 0, 0.12, 0);
  B(g, 0.50, 0.06, 0.40, -0.20, 0.080, -0.20, KZ.skalaDk, 0, -0.22, 0);

  // ── 2. WYCHODNIA KWARCU ZE ŻYŁĄ ZŁOTA (Z1) — ściana z tyłu, żyła na
  //      licu zwróconym do kamery (+Z), inaczej z 52° w ogóle jej nie widać ─
  B(g, 0.44, 0.22, 0.16, -0.20, 0.110, -0.415, KZ.kwarc, 0, -0.14, 0);
  B(g, 0.20, 0.13, 0.13, 0.05, 0.065, -0.430, KZ.kwarc, 0, 0.30, 0);
  // KOR-1: żyła pogrubiona i rozgałęziona — w skali mapy cienka kreska ginęła
  B(g, 0.34, 0.055, 0.040, -0.20, 0.150, -0.333, KZ.zloto, 0, -0.14, 0.16);
  B(g, 0.13, 0.040, 0.036, -0.30, 0.085, -0.331, KZ.zlotoDk, 0, -0.14, -0.40);
  B(g, 0.10, 0.036, 0.034, 0.04, 0.108, -0.362, KZ.zloto, 0, 0.30, 0.30);

  // ── 3. SZYB: czarna gardziel + drewniana cembrowina (Z1) ────────────────
  B(g, 0.24, 0.10, 0.20, -0.20, 0.070, -0.16, KZ.czern);
  B(g, 0.30, 0.040, 0.045, -0.20, 0.128, -0.055, KZ.drewnoDk);
  B(g, 0.30, 0.040, 0.045, -0.20, 0.128, -0.265, KZ.drewnoDk);
  B(g, 0.045, 0.040, 0.215, -0.325, 0.128, -0.160, KZ.drewnoDk);
  B(g, 0.045, 0.040, 0.215, -0.075, 0.128, -0.160, KZ.drewnoDk);

  // ── 4. TRÓJNÓG Z WAŁKIEM I KOSZEM (Z2) — pionowa dominanta sylwetki.
  //      DWIE nogi rozstawione w bok (czytelne „Λ" z 52°), TRZECIA do tyłu.
  //      Noga skierowana wprost na kamerę skróciłaby się do pionowej kreski
  //      i cała konstrukcja czytałaby się jak zwykły słup. ──────────────────
  const AX = -0.20, AY = 0.520, AZ = -0.16;   // wierzchołek
  strut(g, KZ.drewno, 0.022, AX - 0.235, 0.035, AZ + 0.135, AX, AY, AZ);
  strut(g, KZ.drewno, 0.022, AX + 0.235, 0.035, AZ + 0.135, AX, AY, AZ);
  strut(g, KZ.drewno, 0.022, AX + 0.010, 0.035, AZ - 0.255, AX, AY, AZ);
  C(g, 0.044, 0.044, 0.05, AX, AY - 0.018, AZ, KZ.lina, 6);                  // oplot wierzchołka
  C(g, 0.030, 0.030, 0.15, AX, 0.408, AZ, KZ.drewno, 6, 0, 0, Math.PI / 2);  // wałek
  for (const dx of [-0.040, 0.040]) {                                        // oploty liny na wałku
    C(g, 0.036, 0.036, 0.020, AX + dx, 0.408, AZ, KZ.lina, 6, 0, 0, Math.PI / 2);
  }
  strut(g, KZ.lina, 0.008, AX, 0.395, AZ + 0.03, AX, 0.250, AZ + 0.03);      // lina
  C(g, 0.082, 0.062, 0.10, AX, 0.195, AZ + 0.03, KZ.wiklina, 8);            // kosz
  C(g, 0.090, 0.090, 0.020, AX, 0.250, AZ + 0.03, KZ.drewnoDk, 8);          // obręcz kosza
  // urobek w koszu — KOR-1: kruszec złotonośny wysunięty na wierzch, kwarc schodzi
  // do roli tła (wcześniej z odległości kosz czytał się jako biały)
  B(g, 0.050, 0.042, 0.046, AX - 0.034, 0.252, AZ + 0.040, KZ.kwarc, 0, 0.4, 0);
  B(g, 0.062, 0.052, 0.058, AX + 0.014, 0.264, AZ + 0.014, KZ.zloto, 0, 0.6, 0);
  B(g, 0.046, 0.040, 0.044, AX - 0.022, 0.268, AZ - 0.026, KZ.zlotoDk, 0, -0.4, 0);

  // ── 5. RYNNA PŁUCZKOWA Z RUNEM (Z3) — ukośna dominanta sylwetki ─────────
  BSL(g, 0.150, 0.035, SL_LEN, 0, 0, 0, KZ.drewno);                          // dno
  for (const dx of [-0.0875, 0.0875]) {                                      // burty
    BSL(g, 0.025, 0.080, SL_LEN, dx, 0.022, 0, KZ.drewnoDk);
  }
  BSL(g, 0.150, 0.085, 0.028, 0, 0.035, -SL_LEN / 2, KZ.drewnoDk);           // zastawka u góry
  BSL(g, 0.122, 0.014, 0.42, 0, 0.016, 0.03, KZ.runo);                       // runo owcze
  BSL(g, 0.120, 0.018, 0.15, 0, 0.030, -0.168, KZ.woda);                     // strużka wody (KOR-1: krótsza)
  // KOR-1: drobiny na runie powiększone i doliczone (3 → 6) — to one mają
  // nieść komunikat „złoto" na całej długości rynny, także w skali mapy
  for (const [lx, lz] of [
    [-0.034, 0.010], [0.030, 0.062], [-0.024, 0.108],
    [0.032, 0.152], [-0.030, 0.196], [0.014, 0.226],
  ] as const) {
    BSL(g, 0.044, 0.020, 0.046, lx, 0.030, lz, KZ.zloto);
  }
  // kozły podpierające rynnę — nogi rozstawione POPRZECZNIE, żeby pochylenie
  // koryta było widoczne (bez nich rynna czyta się jak deska na ziemi)
  for (const lz of [-0.155, 0.165]) {
    const [ux, uy, uz] = sluice(0, -0.020, lz);
    const [lxw, , lzw] = sluice(-0.115, 0, lz);
    const [rxw, , rzw] = sluice(0.115, 0, lz);
    strut(g, KZ.drewnoDk, 0.017, lxw, 0.040, lzw, ux, uy, uz);
    strut(g, KZ.drewnoDk, 0.017, rxw, 0.040, rzw, ux, uy, uz);
  }

  // ── 6. SADZAWKA POD SPŁYWEM RYNNY (Z3) — KOR-1: mniejsza i przygaszona,
  //      bo jaskrawy cyjanowy ośmiokąt przejmował całą uwagę w skali mapy ──
  C(g, 0.140, 0.155, 0.06, 0.350, 0.030, 0.395, KZ.skalaDk, 8);
  C(g, 0.114, 0.114, 0.025, 0.350, 0.062, 0.395, KZ.wodaDk, 8);

  // ── 7. MISA (BATEA) ZE ZŁOTYM PYŁEM (Z4) — nośnik komunikatu „ZŁOTO".
  //      KOR-1: misa POCHYLONA ku kamerze (wcześniej płaski krążek czytał się
  //      jak terakotowy talerz) + usypany kopczyk złotego pyłu w środku ─────
  {
    const misa = new THREE.Group();
    C(misa, 0.128, 0.098, 0.055, 0, 0.028, 0, KZ.drewnoDk, 8);   // czerep naczynia
    C(misa, 0.118, 0.118, 0.016, 0, 0.062, 0, KZ.drewno, 8);     // rant
    C(misa, 0.104, 0.104, 0.026, 0, 0.076, 0, KZ.zloto, 8);      // złoty pył
    C(misa, 0.030, 0.070, 0.036, 0, 0.100, 0, KZ.zloto, 6);      // kopczyk urobku
    misa.rotation.x = 0.42;
    misa.position.set(-0.315 * R, 0.052 * R, 0.315 * R);
    g.add(misa);
  }

  // ── 8. KAMIEŃ DO KRUSZENIA KWARCU (Z5) ──────────────────────────────────
  B(g, 0.230, 0.070, 0.190, 0.335, 0.085, -0.290, KZ.skalaDk, 0, 0.22, 0);
  C(g, 0.058, 0.070, 0.060, 0.335, 0.150, -0.290, KZ.skala, 6);
  B(g, 0.055, 0.038, 0.052, 0.215, 0.069, -0.200, KZ.kwarc, 0, 0.5, 0);
  B(g, 0.048, 0.034, 0.046, 0.440, 0.067, -0.235, KZ.kwarc, 0, -0.4, 0);
  // roztarty kruszec na płycie — KOR-1: urobek spod rozcieracza jest złoty,
  // to on jest powodem, dla którego kwarc w ogóle się tłucze
  B(g, 0.090, 0.024, 0.070, 0.335, 0.128, -0.290, KZ.zloto, 0, 0.22, 0);

  // ── 9. HAŁDA UROBKU (płonny kwarc) + bryłki złotonośne ──────────────────
  B(g, 0.200, 0.110, 0.190, -0.430, 0.095, 0.115, KZ.kwarc, 0, 0.28, 0);
  B(g, 0.140, 0.085, 0.130, -0.395, 0.185, 0.150, KZ.kwarc, 0, -0.35, 0);
  B(g, 0.100, 0.060, 0.090, -0.465, 0.170, 0.040, KZ.skala, 0, 0.50, 0);
  B(g, 0.072, 0.058, 0.066, -0.393, 0.252, 0.150, KZ.zloto, 0, 0.35, 0);
  B(g, 0.050, 0.040, 0.048, -0.462, 0.218, 0.038, KZ.zlotoDk, 0, -0.30, 0);

  // Materiały i geometrie są WSPÓŁDZIELONE — nie wolno ich zwalniać per żeton.
  g.userData['mats'] = [];
  g.userData['perTokenGeos'] = [];
  return g;
}

/** Zwolnienie singletonów modułu (analogicznie do dispose* w modelach jednostek). */
export function disposeKopalniaZlotaGeometrie(): void {
  for (const geo of GEOS.values()) geo.dispose();
  GEOS.clear();
  for (const m of MATS.values()) m.dispose();
  MATS.clear();
}
