/**
 * tarasy-model.ts — ULEPSZENIE „TARASY" na NOWYCH wzgórzach W0/W3
 * (styl Roblox: fasetowane bryły, vertex colors, MeshLambert flatShading).
 *
 * OSTATNI stary model z audytu: render/mapRenderStyle.ts:924 buildStyleTarasyTerrace
 * = addSteppedTerraceHill 'cultivated' — CAŁY kopiec od nowa w piaskowej palecie,
 * 312 tri, 14+ meshy; w kanonie roblox dziś w ogóle nieużywany (improvements.ts
 * tarasy() → mini-dysk 3 stopnie w sektorze farmy, a scene.ts przy tarasach CHOWA
 * wzgórze i spada do legacy kuli). Ten plik zastępuje TO WSZYSTKO nakładką.
 *
 * NOWY MODEL — buildTarasy(0|3): schodkowe półki-poletka OPASUJĄCE stok wzgórza
 * W0/W3 z teren-gory-wzgorza.ts (oba projektowane pod tarasy):
 *  - W0 (kopiec 4 stopnie + PROSTY STOK-rampa na +x): 3 poziomy półek w dwóch
 *    łukach flankujących rampę (przerwa na fasetę rampy a∈[60°,120°]) + 4 kamienne
 *    schodki-noski na samej rampie (rampa = ścieżka gospodarska). 164 tri.
 *  - W3 (stożek 5 stopni + PÓŁKA na +x, wierzch y=0.215): pole uprawne NA półce
 *    (gleba + 3 rządki + murek-attyka na 3 zewn. fasetach) + 3 poziomy półek
 *    w łukach + 2 kamienne przełazy między tarasami A i B. 190 tri.
 *  Rządki upraw w 3 kolorach dojrzałości (spójne z polami p2/p3b):
 *  0xe9c34e zboże (dół) → 0xa9c93f średnie → 0x5ec74a młode (góra).
 *  Murki oporowe = jasny kamień serii (0x9aa5b1/0xa9b3bf/0x717d89).
 *
 * DOPASOWANIE GEOMETRYCZNE (zero przenikania, zero lewitacji) — policzone
 * z tierów wzgórz (frustum hex yaw=0, promień NAROŻNY r; ściana tieru k:
 * r_k(y) = rb_k − s_k·(y−y0_k), s_k=(rb_k−rt_k)/h_k). Półka poziomu na półce
 * tieru k (grzbiet y_L=rt tieru k) spełnia:
 *  1. pole y_pole = y_L + 0.014 (ponad capem tieru — zero z-fightu);
 *  2. TYŁ zakopany: r_in ≤ r_{k+1}(y_pole) − 0.02  (ściana wyższego tieru
 *     wystaje PRZED wewnętrzną krawędź pola — krawędź niewidoczna w bryle);
 *  3. PRZÓD zakopany: ściana zewn. na r_out schodzi do y_bot < y*, gdzie
 *     r_k(y*) = r_out (ściana tieru niżej wychodzi PONAD stopę murku) —
 *     y_bot = y* − ~0.02. Porównania w r narożnym są ścisłe dla KAŻDEGO
 *     azymutu, bo półki są łukami tej samej siatki hex yaw=0 co wzgórze
 *     (fasety równoległe, odstęp = 0.866·Δr).
 *  W0: A y_pole 0.144 r 0.630–0.780, y_bot 0.065 (ściana T1 mija 0.78 @ y=0.087)
 *      B y_pole 0.244 r 0.435–0.600, y_bot 0.162 (T2 mija 0.60 @ y=0.180)
 *      C y_pole 0.334 r 0.285–0.440, y_bot 0.242 (T3 mija 0.44 @ y=0.260)
 *  W3: A y_pole 0.114 r 0.545–0.700, y_bot 0.055 (T1 mija 0.70 @ y=0.070)
 *      B y_pole 0.206 r 0.395–0.550, y_bot 0.118 (T2 mija 0.55 @ y=0.135)
 *      C y_pole 0.288 r 0.272–0.410, y_bot 0.200 (T3 mija 0.41 @ y=0.217)
 *      pole półki: wierzch półki 0.215 + 0.006; murek A (top 0.144+0.030) <
 *      spód półki (0.160); łuki B kończą się na narożach a=60/120 obok półki;
 *      przełazy A→B na a=30/150: czoło r 0.545 przed ścianą T2 (0.501 @ y=0.17),
 *      poniżej rządka A (r od 0.567).
 *  Rampa W0 (wstęga [0.80,0.004]→[0.24,0.392], półszer. 0.26→0.12): łuki
 *  kończą się na narożach a=60/120 — końce (x,z) leżą POZA obrysem rampy
 *  (np. A: naroże (0.675,±0.39) vs rampa z=±0.238 przy x=0.675).
 *
 * JAK WPIĄĆ (zalecenie — TARASY NA BUMPIE, NIE PRZEZ SEKTOR):
 *  1. Plik → gra/src/render/tarasy-model.ts.
 *  2. scene.ts (gałąź Wzgorza ~:1852): USUNĄĆ warunek !hillLayers.includes('tarasy')
 *     — wzgórze rysuje się ZAWSZE; na heksie z tarasami wariant wymusić na
 *     tarasyWariantDlaHeksa(q,r,seed) (∈{0,3}), rotacja bez zmian rotacjaDlaHeksa.
 *  3. main.ts spawnImprovementMesh (~:4408): 'tarasy' WYJĄĆ z layers idących do
 *     buildImprovementSectored (dziś OVERLAY_KEYS wrzuca je do sektora farmy,
 *     skala 0.30 przy ściance — dlatego wygląda staro) i dodać osobno:
 *       const t = buildTarasy(tarasyWariantDlaHeksa(q,r,map.seed));
 *       t.rotation.y = rotacjaDlaHeksa(q,r,map.seed); g.add(t);
 *     Grupa g stoi już na improvementMeshPlacement → dla tarasy = topY (wierzch
 *     heksa, main.ts:4335) — model ma spód w y=0 jak wzgórze, więc pasuje 1:1.
 *  4. buildStyleTarasyTerrace + gałąź minecraft w improvements.tarasy() można
 *     skasować przy sprzątaniu (klasa ZNIKA bez zmian: syncImprovementDecorForHex
 *     nadal chowa dekor; środek plateau zostaje wolny — nic nie budujemy w r<0.26).
 *
 * KONWENCJE: spód y=0 = wierzch heksa, HEX_R=1, oś rampy/półki = +x (jak w
 * teren-gory-wzgorza.ts); obrót całości = rotation.y (snap 60°). Geometria
 * współdzielona w cache (pod InstancedMesh gdyby tarasów były setki).
 */
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Paleta (spójna z p2/p3b i serią terenu)
// ---------------------------------------------------------------------------

/** Jasny kamień murków oporowych (rodzina kamienia p2/p3b). */
const MUR_SCIANA = 0x9aa5b1;
const MUR_KORONA = 0xa9b3bf;
const MUR_CIEN = 0x717d89;
/** Gleba poletek (p2/p3b „ziemia"). */
const GLEBA = 0x8a6a45;
/** Rządki upraw — 3 kolory dojrzałości [jasny, ciemny] (p3b). */
const UPRAWA_ZBOZE: readonly [number, number] = [0xe9c34e, 0xc99f35];
const UPRAWA_SREDNIA: readonly [number, number] = [0xa9c93f, 0x8fb32f];
const UPRAWA_MLODA: readonly [number, number] = [0x5ec74a, 0x4bb03a];

// ---------------------------------------------------------------------------
// Hash per heks — TA SAMA arytmetyka co mapRenderStyle.hash2D (determinizm)
// ---------------------------------------------------------------------------

function hashHeksa(q: number, r: number, seed: number, salt: number): number {
  let h = (Math.imul(q | 0, 0x27d4eb2d)
    ^ Math.imul(r | 0, 0x165667b1)
    ^ Math.imul(seed | 0, 0x9e3779b1)
    ^ Math.imul(salt | 0, 0x85ebca6b)) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

/**
 * Wariant wzgórza pod tarasy dla heksa (q,r) — TYLKO W0 lub W3 (te mają
 * przygotowane stoki). Na heksie z tarasami scene.ts wymusza ten wariant
 * zamiast wariantDlaHeksa (deterministycznie, bez dotykania hasha mapy).
 */
export function tarasyWariantDlaHeksa(q: number, r: number, seed = 0): 0 | 3 {
  return hashHeksa(q, r, seed, 737) < 0.5 ? 0 : 3;
}

// ---------------------------------------------------------------------------
// Emitery (non-indexed, kolor per wierzchołek) — jak teren-gory-wzgorza.ts
// ---------------------------------------------------------------------------

interface Parts { pos: number[]; col: number[]; }

type V3 = [number, number, number];

function rgb(hex: number): V3 {
  return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
}

function pushTri(P: Parts, a: V3, b: V3, c: V3, col: V3, ref: V3): void {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * ref[0] + ny * ref[1] + nz * ref[2] < 0) { const t = b; b = c; c = t; }
  P.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  for (let k = 0; k < 3; k++) P.col.push(col[0], col[1], col[2]);
}

function quad(P: Parts, a: V3, b: V3, c: V3, d: V3, col: V3, ref: V3): void {
  pushTri(P, a, b, c, col, ref);
  pushTri(P, a, c, d, col, ref);
}

/**
 * Punkt łuku siatki hex yaw=0 (konwencja ring6 z teren-gory-wzgorza.ts):
 * naroża w a = k·60° na pozycji (r·sin a, r·cos a); azymuty ułamkowe =
 * interpolacja LINIOWA po fasecie (punkt zostaje na prostym boku hexu).
 */
function punktLuku(r: number, aDeg: number): [number, number] {
  const k = Math.floor(aDeg / 60);
  const f = (aDeg - k * 60) / 60;
  const a0 = k * (Math.PI / 3), a1 = (k + 1) * (Math.PI / 3);
  const x0 = r * Math.sin(a0), z0 = r * Math.cos(a0);
  const x1 = r * Math.sin(a1), z1 = r * Math.cos(a1);
  return [x0 + (x1 - x0) * f, z0 + (z1 - z0) * f];
}

/** Stacje łuku: oba końce + każde naroże (wielokrotność 60°) w środku. */
function stacjeLuku(aOd: number, aDo: number): number[] {
  const st: number[] = [aOd];
  for (let k = Math.ceil(aOd / 60) * 60; k < aDo; k += 60) {
    if (k > aOd + 0.001) st.push(k);
  }
  st.push(aDo);
  return st;
}

interface PolkaOpts {
  /** Łuk azymutalny [od, do] w stopniach (a=0 → +z; faseta +x to a∈[60,120]). */
  aOd: number; aDo: number;
  /** Poziom pola (y grzbietu tieru + 0.014) i stopa murku (zakopana w tier niżej). */
  yPole: number; yBot: number;
  /** Promienie narożne: tył pola (zakopany) i lico murku zewnętrznego. */
  rIn: number; rOut: number;
  /** Grubość i wysokość korony murku nad polem. */
  tMur: number; hMur: number;
  /** Wysokość rządka uprawy i para kolorów [jasny, ciemny]. */
  hRzad: number; uprawa: readonly [number, number];
  /** Parzystość startowa przeplotu kolorów rządka (urozmaicenie). */
  fazaKoloru?: number;
}

/**
 * Półka tarasowa — łuk siatki hex: pole-gleba + rządek uprawy + murek oporowy
 * (lico, korona, cień od pola) + kamienne ścianki czołowe na końcach łuku.
 * 12 tri / segment fasety + 3 tri / koniec łuku.
 */
function polka(P: Parts, o: PolkaOpts): void {
  const st = stacjeLuku(o.aOd, o.aDo);
  const rMurIn = o.rOut - o.tMur;
  const yMur = o.yPole + o.hMur;
  const rRzA = o.rIn + 0.022, rRzB = rMurIn - 0.018, rRzM = (rRzA + rRzB) / 2;
  const yRz = o.yPole + o.hRzad;
  const cMur = rgb(MUR_SCIANA), cKor = rgb(MUR_KORONA), cCien = rgb(MUR_CIEN);
  const cGleba = rgb(GLEBA);
  const faza = o.fazaKoloru ?? 0;

  for (let i = 0; i + 1 < st.length; i++) {
    const [xo0, zo0] = punktLuku(o.rOut, st[i]!), [xo1, zo1] = punktLuku(o.rOut, st[i + 1]!);
    const [xm0, zm0] = punktLuku(rMurIn, st[i]!), [xm1, zm1] = punktLuku(rMurIn, st[i + 1]!);
    const [xi0, zi0] = punktLuku(o.rIn, st[i]!), [xi1, zi1] = punktLuku(o.rIn, st[i + 1]!);
    const [xa0, za0] = punktLuku(rRzA, st[i]!), [xa1, za1] = punktLuku(rRzA, st[i + 1]!);
    const [xb0, zb0] = punktLuku(rRzB, st[i]!), [xb1, zb1] = punktLuku(rRzB, st[i + 1]!);
    const [xc0, zc0] = punktLuku(rRzM, st[i]!), [xc1, zc1] = punktLuku(rRzM, st[i + 1]!);
    const refOut: V3 = [(xo0 + xo1) / 2, 0, (zo0 + zo1) / 2];
    const refIn: V3 = [-refOut[0], 0, -refOut[2]];
    const up: V3 = [0, 1, 0];
    // lico murku (stopa zakopana w tierze niżej)
    quad(P, [xo0, o.yBot, zo0], [xo1, o.yBot, zo1], [xo1, yMur, zo1], [xo0, yMur, zo0], cMur, refOut);
    // korona murku
    quad(P, [xo0, yMur, zo0], [xo1, yMur, zo1], [xm1, yMur, zm1], [xm0, yMur, zm0], cKor, up);
    // wewnętrzne lico murku (cień nad polem)
    quad(P, [xm0, yMur, zm0], [xm1, yMur, zm1], [xm1, o.yPole, zm1], [xm0, o.yPole, zm0], cCien, refIn);
    // pole-gleba (tył r_in zakopany w ścianie wyższego tieru)
    quad(P, [xi0, o.yPole, zi0], [xi1, o.yPole, zi1], [xm1, o.yPole, zm1], [xm0, o.yPole, zm0], cGleba, up);
    // rządek uprawy — dwuspadowa pryzma wzdłuż łuku, przeplot jasny/ciemny
    const cRz = rgb(o.uprawa[(i + faza) % 2]!);
    quad(P, [xa0, o.yPole, za0], [xa1, o.yPole, za1], [xc1, yRz, zc1], [xc0, yRz, zc0], cRz, up);
    quad(P, [xc0, yRz, zc0], [xc1, yRz, zc1], [xb1, o.yPole, zb1], [xb0, o.yPole, zb0], cRz, up);
  }

  // ścianki czołowe (kamienne zawrócenia murku) + zaślepka rządka
  for (const koniec of [0, 1]) {
    const a = koniec === 0 ? o.aOd : o.aDo;
    const aRef = koniec === 0 ? o.aOd - 8 : o.aDo + 8;
    const [xr, zr] = punktLuku(1, aRef), [xs, zs] = punktLuku(1, a);
    const ref: V3 = [xr - xs, 0, zr - zs];
    const [xo, zo] = punktLuku(o.rOut, a), [xi, zi] = punktLuku(o.rIn, a);
    quad(P, [xi, o.yBot, zi], [xo, o.yBot, zo], [xo, yMur, zo], [xi, yMur, zi], rgb(MUR_SCIANA), ref);
    const [xa, za] = punktLuku(rRzA, a), [xb, zb] = punktLuku(rRzB, a), [xc, zc] = punktLuku(rRzM, a);
    pushTri(P, [xa, o.yPole, za], [xb, o.yPole, zb], [xc, yRz, zc], rgb(o.uprawa[1]!), ref);
  }
}

/** Kamienny schodek-nosek na rampie W0 (top+czoło+boki, tył zakopany). 8 tri. */
function schodekRampy(P: Parts, x: number, ySurf: number, w: number): void {
  const half = 0.026, yT = ySurf + 0.024, yB = ySurf - 0.026;
  const cT = rgb(MUR_KORONA), cF = rgb(MUR_SCIANA), cS = rgb(MUR_CIEN);
  const x0 = x - half, x1 = x + half;
  quad(P, [x0, yT, -w], [x1, yT, -w], [x1, yT, w], [x0, yT, w], cT, [0, 1, 0]);
  quad(P, [x1, yT, -w], [x1, yB, -w], [x1, yB, w], [x1, yT, w], cF, [1, 0, 0]);
  quad(P, [x0, yT, -w], [x1, yT, -w], [x1, yB, -w], [x0, yB, -w], cS, [0, 0, -1]);
  quad(P, [x0, yT, w], [x1, yT, w], [x1, yB, w], [x0, yB, w], cS, [0, 0, 1]);
}

/**
 * Kamienny przełaz w ścianie tieru (stopień między sąsiednimi tarasami):
 * top + czoło + boki, tył zatopiony w ścianie wzgórza. 8 tri.
 */
function przelaz(P: Parts, aDeg: number, rZew: number, rWew: number, yTop: number, yBot: number, halfT: number): void {
  const [nx0, nz0] = punktLuku(1, aDeg);
  const L = Math.hypot(nx0, nz0);
  const nx = nx0 / L, nz = nz0 / L;      // normalna fasety (na zewnątrz)
  const tx = -nz, tz = nx;               // styczna fasety
  const pt = (r: number, t: number): [number, number] => {
    const [cx, cz] = punktLuku(r, aDeg);
    return [cx + tx * t, cz + tz * t];
  };
  const [ao0, ao1] = [pt(rZew, -halfT), pt(rZew, halfT)];
  const [ai0, ai1] = [pt(rWew, -halfT), pt(rWew, halfT)];
  const cT = rgb(MUR_KORONA), cF = rgb(MUR_SCIANA), cS = rgb(MUR_CIEN);
  quad(P, [ai0[0], yTop, ai0[1]], [ao0[0], yTop, ao0[1]], [ao1[0], yTop, ao1[1]], [ai1[0], yTop, ai1[1]], cT, [0, 1, 0]);
  quad(P, [ao0[0], yTop, ao0[1]], [ao0[0], yBot, ao0[1]], [ao1[0], yBot, ao1[1]], [ao1[0], yTop, ao1[1]], cF, [nx, 0, nz]);
  quad(P, [ai0[0], yTop, ai0[1]], [ao0[0], yTop, ao0[1]], [ao0[0], yBot, ao0[1]], [ai0[0], yBot, ai0[1]], cS, [tx * -1, 0, tz * -1]);
  quad(P, [ai1[0], yTop, ai1[1]], [ao1[0], yTop, ao1[1]], [ao1[0], yBot, ao1[1]], [ai1[0], yBot, ai1[1]], cS, [tx, 0, tz]);
}

/** Rządek-pryzma wzdłuż osi x na płaskim polu (2 spady + 2 zaślepki). 6 tri. */
function rzadekX(P: Parts, x0: number, x1: number, z: number, halfW: number, y0: number, h: number, colHex: number): void {
  const c = rgb(colHex);
  const zA = z - halfW, zB = z + halfW, yT = y0 + h;
  quad(P, [x0, y0, zA], [x1, y0, zA], [x1, yT, z], [x0, yT, z], c, [0, 1, 0]);
  quad(P, [x0, yT, z], [x1, yT, z], [x1, y0, zB], [x0, y0, zB], c, [0, 1, 0]);
  pushTri(P, [x0, y0, zA], [x0, y0, zB], [x0, yT, z], c, [-1, 0, 0]);
  pushTri(P, [x1, y0, zA], [x1, y0, zB], [x1, yT, z], c, [1, 0, 0]);
}

// ---------------------------------------------------------------------------
// W0 — kopiec z rampą: 3 poziomy półek flankujących rampę + schodki. 164 tri.
// ---------------------------------------------------------------------------

function czesciTarasyW0(): Parts {
  const P: Parts = { pos: [], col: [] };
  // Poziom A na grzbiecie T1 (y=0.130): łuki 90°+78°, pola najszersze (zboże).
  polka(P, { aOd: -30, aDo: 60, yPole: 0.144, yBot: 0.065, rIn: 0.63, rOut: 0.78, tMur: 0.034, hMur: 0.030, hRzad: 0.050, uprawa: UPRAWA_ZBOZE, fazaKoloru: 0 });
  polka(P, { aOd: 120, aDo: 198, yPole: 0.144, yBot: 0.065, rIn: 0.63, rOut: 0.78, tMur: 0.034, hMur: 0.030, hRzad: 0.050, uprawa: UPRAWA_ZBOZE, fazaKoloru: 1 });
  // Poziom B na grzbiecie T2 (y=0.230): pełne fasety flankowe (uprawa średnia).
  polka(P, { aOd: 2, aDo: 60, yPole: 0.244, yBot: 0.162, rIn: 0.435, rOut: 0.60, tMur: 0.034, hMur: 0.030, hRzad: 0.046, uprawa: UPRAWA_SREDNIA, fazaKoloru: 1 });
  polka(P, { aOd: 120, aDo: 178, yPole: 0.244, yBot: 0.162, rIn: 0.435, rOut: 0.60, tMur: 0.034, hMur: 0.030, hRzad: 0.046, uprawa: UPRAWA_SREDNIA, fazaKoloru: 0 });
  // Poziom C na grzbiecie T3 (y=0.320): krótsze łuki (młode krzewy).
  polka(P, { aOd: 6, aDo: 58, yPole: 0.334, yBot: 0.242, rIn: 0.285, rOut: 0.44, tMur: 0.030, hMur: 0.026, hRzad: 0.042, uprawa: UPRAWA_MLODA, fazaKoloru: 0 });
  polka(P, { aOd: 123, aDo: 176, yPole: 0.334, yBot: 0.242, rIn: 0.285, rOut: 0.44, tMur: 0.030, hMur: 0.026, hRzad: 0.042, uprawa: UPRAWA_MLODA, fazaKoloru: 1 });
  // Schodki-noski na rampie (wstęga [0.80,0.004,w0.26]→[0.24,0.392,w0.12]).
  schodekRampy(P, 0.720, 0.072, 0.130);
  schodekRampy(P, 0.550, 0.190, 0.108);
  schodekRampy(P, 0.395, 0.285, 0.088);
  schodekRampy(P, 0.285, 0.361, 0.072);
  return P;
}

// ---------------------------------------------------------------------------
// W3 — stożek z półką: pole NA półce + 3 poziomy łuków + przełazy. 190 tri.
// ---------------------------------------------------------------------------

function czesciTarasyW3(): Parts {
  const P: Parts = { pos: [], col: [] };
  // Poziom A na grzbiecie T1 (y=0.100) — przerwa na fasecie +x (tam półka).
  polka(P, { aOd: -28, aDo: 60, yPole: 0.114, yBot: 0.055, rIn: 0.545, rOut: 0.70, tMur: 0.034, hMur: 0.030, hRzad: 0.050, uprawa: UPRAWA_ZBOZE, fazaKoloru: 0 });
  polka(P, { aOd: 120, aDo: 206, yPole: 0.114, yBot: 0.055, rIn: 0.545, rOut: 0.70, tMur: 0.034, hMur: 0.030, hRzad: 0.050, uprawa: UPRAWA_ZBOZE, fazaKoloru: 1 });
  // Poziom B na grzbiecie T2 (y=0.192) — domyka pas z polem półki (~0.21).
  polka(P, { aOd: 2, aDo: 60, yPole: 0.206, yBot: 0.118, rIn: 0.395, rOut: 0.55, tMur: 0.034, hMur: 0.030, hRzad: 0.046, uprawa: UPRAWA_SREDNIA, fazaKoloru: 1 });
  polka(P, { aOd: 120, aDo: 178, yPole: 0.206, yBot: 0.118, rIn: 0.395, rOut: 0.55, tMur: 0.034, hMur: 0.030, hRzad: 0.046, uprawa: UPRAWA_SREDNIA, fazaKoloru: 0 });
  // Poziom C na grzbiecie T3 (y=0.274).
  polka(P, { aOd: 8, aDo: 56, yPole: 0.288, yBot: 0.20, rIn: 0.272, rOut: 0.41, tMur: 0.030, hMur: 0.026, hRzad: 0.042, uprawa: UPRAWA_MLODA, fazaKoloru: 0 });
  polka(P, { aOd: 124, aDo: 174, yPole: 0.288, yBot: 0.20, rIn: 0.272, rOut: 0.41, tMur: 0.030, hMur: 0.026, hRzad: 0.042, uprawa: UPRAWA_MLODA, fazaKoloru: 1 });
  // Kamienne przełazy A→B w ścianie T2 (poza rządkami: rządek A r 0.567+).
  przelaz(P, 30, 0.545, 0.48, 0.170, 0.106, 0.055);
  przelaz(P, 150, 0.545, 0.48, 0.170, 0.106, 0.055);

  // --- Pole uprawne NA PÓŁCE wzgórza (cap półki: y=0.215, środek x=0.52) ---
  // Obrys capu: hex r=0.34, sz=0.72 wokół (0.52,0) → pad gleby 0.30..0.74 × ±0.14
  // mieści się w obrysie (krawędź capu przy dx=0.22 to z=±0.153).
  const yP = 0.221, cG = rgb(GLEBA);
  quad(P, [0.30, yP, -0.14], [0.74, yP, -0.14], [0.74, yP, 0.14], [0.30, yP, 0.14], cG, [0, 1, 0]);
  rzadekX(P, 0.315, 0.725, -0.093, 0.040, yP, 0.040, UPRAWA_SREDNIA[0]);
  rzadekX(P, 0.315, 0.725, 0.0, 0.042, yP, 0.046, UPRAWA_ZBOZE[0]);
  rzadekX(P, 0.315, 0.725, 0.093, 0.040, yP, 0.038, UPRAWA_MLODA[0]);

  // --- Murek-attyka na zewnętrznych fasetach półki (naroża a=0,60,120,180) ---
  // Cap półki: naroża offsetowe (0.34·sin a, 0.245·cos a) od (0.52,0); murek
  // grubości 0.02 do wewnątrz, korona y=0.244 (pole półki odsłonięte od stoku).
  {
    const cx = 0.52, rT = 0.34, szT = 0.72;
    const rogi: Array<[number, number]> = [];
    for (let k = 0; k <= 3; k++) {
      const a = k * (Math.PI / 3);
      rogi.push([cx + rT * Math.sin(a), rT * szT * Math.cos(a)]);
    }
    const y0 = 0.215, y1 = 0.244, tW = 0.941; // skala 1-t/r dla wewn. obrysu
    const cM = rgb(MUR_SCIANA), cK = rgb(MUR_KORONA), cC = rgb(MUR_CIEN);
    for (let k = 0; k < 3; k++) {
      const [xA, zA] = rogi[k]!, [xB, zB] = rogi[k + 1]!;
      const xAi = cx + (xA - cx) * tW, zAi = zA * tW;
      const xBi = cx + (xB - cx) * tW, zBi = zB * tW;
      const ref: V3 = [(xA + xB) / 2 - cx, 0, (zA + zB) / 2];
      quad(P, [xA, y0, zA], [xB, y0, zB], [xB, y1, zB], [xA, y1, zA], cM, ref);
      quad(P, [xA, y1, zA], [xB, y1, zB], [xBi, y1, zBi], [xAi, y1, zAi], cK, [0, 1, 0]);
      quad(P, [xAi, y1, zAi], [xBi, y1, zBi], [xBi, y0, zBi], [xAi, y0, zAi], cC, [-ref[0], 0, -ref[2]]);
    }
    // zaślepki końców attyki (przy narożach a=0 i a=180)
    for (const k of [0, 3] as const) {
      const [xA, zA] = rogi[k]!;
      const xAi = cx + (xA - cx) * tW, zAi = zA * tW;
      const ref: V3 = [0, 0, k === 0 ? 1 : -1];
      quad(P, [xA, y0, zA], [xAi, y0, zAi], [xAi, y1, zAi], [xA, y1, zA], cM, ref);
    }
  }
  return P;
}

// ---------------------------------------------------------------------------
// Geometrie współdzielone (cache) + materiał + builder
// ---------------------------------------------------------------------------

function zbudujGeometrie(P: Parts, nazwa: string): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P.pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(P.col, 3));
  g.computeVertexNormals();
  g.name = nazwa;
  return g;
}

const cacheTarasy: { w0: THREE.BufferGeometry | null; w3: THREE.BufferGeometry | null } = { w0: null, w3: null };

/** Współdzielona geometria tarasów dla wariantu wzgórza 0|3. */
export function tarasyGeometria(wariantWzgorza: 0 | 3): THREE.BufferGeometry {
  if (wariantWzgorza === 0) {
    if (!cacheTarasy.w0) cacheTarasy.w0 = zbudujGeometrie(czesciTarasyW0(), 'tarasy-w0');
    return cacheTarasy.w0;
  }
  if (!cacheTarasy.w3) cacheTarasy.w3 = zbudujGeometrie(czesciTarasyW3(), 'tarasy-w3');
  return cacheTarasy.w3;
}

/** Jeden materiał (vertex colors) — spójny z TEREN_MATERIAL serii. */
export const TARASY_MATERIAL = new THREE.MeshLambertMaterial({
  vertexColors: true,
  flatShading: true,
});

/**
 * Ulepszenie „tarasy" — nakładka na wzgórze W0/W3 (spód y=0 = wierzch heksa).
 * Osadzać na heksie w improvementMeshPlacement=topY, z rotation.y =
 * rotacjaDlaHeksa(q,r,seed) — TĄ SAMĄ co mesh wzgórza (łuki trafiają w stok).
 */
export function buildTarasy(wariantWzgorza: 0 | 3): THREE.Group {
  const g = new THREE.Group();
  const m = new THREE.Mesh(tarasyGeometria(wariantWzgorza), TARASY_MATERIAL);
  m.castShadow = true;
  m.receiveShadow = true;
  m.name = wariantWzgorza === 0 ? 'tarasy-w0' : 'tarasy-w3';
  g.add(m);
  g.name = m.name;
  return g;
}

/** Liczba trójkątów wariantu (diagnostyka/testy). */
export function trojkatyTarasow(wariantWzgorza: 0 | 3): number {
  return tarasyGeometria(wariantWzgorza).getAttribute('position').count / 3;
}
