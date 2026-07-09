/**
 * teren-gory-wzgorza.ts — TEREN: 5 wariantów WZGÓRZ + 5 wariantów GÓR
 * w stylu Roblox (fasetowane bryły hex, żywe płaskie kolory, MeshLambert
 * flatShading, zero tekstur, czytelne z lotu ptaka). Zamówienie: różnorodność,
 * żeby mapa nie wyglądała jak stempel — 5 SYLWETEK zamiast 1 kształtu w 5 kolorach.
 *
 * DZIŚ W GRZE (kanon gra/src, stan 2026-07-08):
 *  - góra:    render/mapRenderStyle.ts:752 buildStyleMountainPeak — 5 tierów
 *             CylinderGeometry(6) wall+top + śnieżny blok + stożek = 276 tri,
 *             12 meshy / 12 draw calli NA KAŻDY heks górski;
 *  - wzgórze: render/mapRenderStyle.ts:860 addSteppedTerraceHill (via
 *             buildStyleHillBump :977) — 5 tierów + 4 boxy ścianek = 288 tri,
 *             14 meshy / 14 draw calli na heks;
 *  - wariant = TYLKO paleta (decorVariant5, salt 400/500), kształt identyczny;
 *             rotacja = snap 60° (hash2D salt 4/6).
 *
 * NOWE MODELE (tri: frustum6=18 [12 ścian + 6 kapa, bez dna], cone6=6, rock5=10):
 *  WZGÓRZA (szczyt-plateau ZAWSZE y=0.392 = styleHillBumpSurfaceY(0) — parytet!):
 *   - buildWzgorze(0)  96 tri — kopulasty kopiec (4 strome stopnie) + PROSTY
 *                      STOK-rampa na +x (rezerwa pod przyszłe tarasy uprawne);
 *   - buildWzgorze(1) 108 tri — podwójny garb (główny nad środkiem + niższy 0.25);
 *   - buildWzgorze(2) 112 tri — kopiec ze skałkami na stoku (4 szare bryłki);
 *   - buildWzgorze(3) 108 tri — zaokrąglony stożek (5 ciasnych stopni) z PÓŁKĄ
 *                      na +x, y=0.215 (rezerwa pod tarasy — gotowy pierwszy stopień);
 *   - buildWzgorze(4)  82 tri — niski wydłużony grzbiet (oś x) + skałka na końcu.
 *  GÓRY (wierzchołki 1.10–1.25 vs stare ~1.10–1.24; podstawa <=0.87R):
 *   - buildGora(0)     98 tri — pojedynczy OSTRY szczyt, tiery uciekają w bok,
 *                      śnieżna czapa (granit);
 *   - buildGora(1)    120 tri — masyw DWUSZCZYTOWY, śnieg na obu (łupek);
 *   - buildGora(2)    126 tri — TRÓJZĄB: 3 iglice ze wspólnego cokołu, bez
 *                      śniegu (ciemny bazalt);
 *   - buildGora(3)    144 tri — szczyt z RAMIENIEM-GRANIĄ schodzącą w +x
 *                      (iglice na grani), bez śniegu (ciepły piaskowiec);
 *   - buildGora(4)     88 tri — PRZYSADZISTY masyw z szeroką śnieżną czapą
 *                      z okapem (jasny tuf, odsaturowany).
 *
 * WYDAJNOŚĆ / INSTANCING (gór+wzgórz są tysiące):
 *  - 10 wariantów = 10 współdzielonych, zmergowanych BufferGeometry (cache w
 *    module) + JEDEN wspólny materiał TEREN_MATERIAL (vertexColors) —
 *    kolory wypieczone w atrybucie 'color', więc cała mapa gór+wzgórz to
 *    maks. 10 InstancedMesh = 10 draw calli (dziś: ~13 draw calli × liczba heksów).
 *  - zero dna i ukrytych kap — 60–132 tri/heks vs 276–288 dziś (spadek ~55–70%).
 *
 * DETERMINIZM / ZERO ZMIAN HASHA MAPY:
 *  - wybór wariantu i rotacji WYŁĄCZNIE po stronie renderu:
 *    wariantDlaHeksa(q, r, 5, seed) i rotacjaDlaHeksa(q, r, seed) — ta sama
 *    arytmetyka co hash2D z mapRenderStyle.ts (imul/xorshift), bez Math.random,
 *    bez dotykania map/gen*. Ten sam heks = zawsze ten sam wariant i obrót.
 *
 * WYSOKOŚCI LOGICZNE (NIE ZMIENIONE):
 *  - wzgórze: plateau szczytu każdego wariantu = WZGORZE_SZCZYT_Y = 0.392 nad
 *    wierzchem heksa — dokładnie tyle, ile zwraca styleHillBumpSurfaceY(0,false);
 *    środek plateau pokrywa (0,0) heksa (jednostki/ulepszenia jak dziś,
 *    unitTerrainRelief 0.22 bez zmian);
 *  - góra: blokuje ruch (bez zmian); wierzchołki GORA_APEX_Y w widełkach starych.
 *
 * JAK WPIĄĆ (drzewo kanoniczne gra/src):
 *  1. Plik skopiować do gra/src/render/teren-gory-wzgorza.ts.
 *  2. Wariant minimalny (bez zmiany architektury overlayów):
 *     w render/mapRenderStyle.ts podmienić ciała:
 *       buildStyleMountainPeak → mesh z goraGeometria(wariantDlaHeksa(q,r,5,seed))
 *         + mesh.rotation.y = rotacjaDlaHeksa(q,r,seed); materiał: TEREN_MATERIAL
 *         (albo klon, jeśli fogDim tintuje materiał per heks);
 *       buildStyleHillBump → analogicznie wzgorzeGeometria(...).
 *     Geometria współdzielona = główny zysk pamięci/CPU zostaje.
 *  3. Wariant docelowy (10 draw calli): w render/scene.ts (gałęzie Gory ~:1573
 *     i Wzgorza ~:1607) zamiast styledOverlays użyć 10 InstancedMesh w wzorcu
 *     istniejącym już dla hillBumpMesh/peakMesh (hexKey + origMatrix +
 *     hideInstancedOnHex/applyOverlayFog; fog przez instanceColor).
 *  4. styleHillBumpSurfaceY / unitTerrainRelief / TERRAIN_SURFACE_Y — bez zmian.
 *
 * KONWENCJE (zgodne z ulepszenia-modele-p2.ts / pastwisko-modele.ts):
 *  - spód modelu na y=0 (wierzch heksa), współrzędne w HEX_R=1 (hexutil.ts),
 *  - orientacja bazowa jak pryzm heksa (wierzchołek w +z, theta=0), obrót
 *    całości = rotation.y (snap 60° z rotacjaDlaHeksa).
 */
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Stałe wymiarów (zmierzone z gry — patrz nagłówek)
// ---------------------------------------------------------------------------

/** Liczba wariantów sylwetek (wzgórza i góry po 5). */
export const LICZBA_WARIANTOW_TERENU = 5;

/** Y plateau szczytu wzgórza nad wierzchem heksa = styleHillBumpSurfaceY(0,false). */
export const WZGORZE_SZCZYT_Y = 0.392;

/** Y wierzchołka (apex) każdego wariantu góry nad wierzchem heksa. */
export const GORA_APEX_Y: readonly number[] = [1.25, 1.15, 1.20, 1.18, 1.10];

/** Maks. promień podstawy w jednostkach HEX_R (stare: wzgórze 0.93, góra 0.89). */
export const WZGORZE_FOOTPRINT_R = 0.92;
export const GORA_FOOTPRINT_R = 0.87;

// ---------------------------------------------------------------------------
// Deterministyczny hash per heks — TA SAMA arytmetyka co mapRenderStyle.hash2D
// (czysto renderowy; generator mapy nietknięty)
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

/** Deterministyczny wariant 0..liczbaWariantow-1 dla heksa (q,r). */
export function wariantDlaHeksa(
  q: number,
  r: number,
  liczbaWariantow: number = LICZBA_WARIANTOW_TERENU,
  seed = 0,
  salt = 911,
): number {
  return Math.floor(hashHeksa(q, r, seed, salt) * liczbaWariantow);
}

/** Deterministyczna rotacja — wielokrotność 60°, wyrównana do siatki hex. */
export function rotacjaDlaHeksa(q: number, r: number, seed = 0): number {
  return Math.floor(hashHeksa(q, r, seed, 613) * 6) * (Math.PI / 3);
}

// ---------------------------------------------------------------------------
// Palety (wypieczone w vertex colors) — te same rodziny co zatwierdzone
// HILL_VARIANTS_ROBLOX / MOUNTAIN_VARIANTS z mapRenderStyle.ts
// ---------------------------------------------------------------------------

interface PaletaWzgorza { wall: number; wallDk: number; grassA: number; grassB: number; }
interface PaletaGory { s: readonly number[]; d: readonly number[]; snowBlock: number; snowPeak: number; }

const PAL_WZGORZ: readonly PaletaWzgorza[] = [
  { wall: 0x3a9e42, wallDk: 0x2f7a34, grassA: 0x55d858, grassB: 0x6ee872 }, // W0 jasna łąka
  { wall: 0x4a9e32, wallDk: 0x3a8028, grassA: 0x7ab848, grassB: 0x8ec862 }, // W1 pastwisko
  { wall: 0x5a7a38, wallDk: 0x4a6830, grassA: 0x6a8a48, grassB: 0x7a9a58 }, // W2 step (sucha trawa + skała)
  { wall: 0x2a6e32, wallDk: 0x1f5828, grassA: 0x3a8e42, grassB: 0x4a9e52 }, // W3 las ciemny
  { wall: 0x2a5a30, wallDk: 0x1f4828, grassA: 0x3a7040, grassB: 0x4a8050 }, // W4 bagienny grzbiet
];

const PAL_GOR: readonly PaletaGory[] = [
  { s: [0x6a7380, 0x7a8494, 0x8899aa, 0x959eb0, 0x99aabb], d: [0x555d68, 0x5a6270, 0x626878], snowBlock: 0xf0f4fa, snowPeak: 0xffffff }, // G0 granit
  { s: [0x5a6878, 0x6a7888, 0x7a8898, 0x8a98a8, 0x9aa8b8], d: [0x4a5868, 0x526070, 0x5a6878], snowBlock: 0xe8f0f8, snowPeak: 0xf4f8ff }, // G1 łupek
  { s: [0x4a5058, 0x5a6268, 0x6a7278, 0x7a8288, 0x8a9298], d: [0x3a4048, 0x424850, 0x4a5058], snowBlock: 0xe8ecf0, snowPeak: 0xf8fafc }, // G2 bazalt
  { s: [0x9a8870, 0xa89880, 0xb8a890, 0xc4b4a0, 0xd0c0ac], d: [0x7a6850, 0x857060, 0x907868], snowBlock: 0xf4eee4, snowPeak: 0xfff8f0 }, // G3 piaskowiec
  { s: [0x8f7a74, 0x9d8a84, 0xab9a94, 0xb9aaa4, 0xc7bab4], d: [0x6f5a54, 0x7a655e, 0x857068], snowBlock: 0xf0e8e4, snowPeak: 0xfff4f0 }, // G4 tuf (odsaturowany)
];

/** Skałki na wzgórzach — neutralna szarość spójna z granitem G0. */
const SKALKA_JASNA = 0x8a94a2;
const SKALKA_CIEMNA = 0x6c7684;

// ---------------------------------------------------------------------------
// Emitery geometrii (non-indexed, kolor per wierzchołek, bez den i ukrytych kap)
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

function ring6(cx: number, cz: number, r: number, yaw: number, sx: number, sz: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const a = yaw + i * Math.PI / 3;
    pts.push([cx + sx * r * Math.sin(a), cz + sz * r * Math.cos(a)]);
  }
  return pts;
}

interface FrustumOpts {
  cx: number; cz: number; y0: number; h: number; rb: number; rt: number;
  wall: number; cap?: number | null;
  yaw?: number; sx?: number; sz?: number; topOx?: number; topOz?: number;
}

/** Ścięty hex-stożek: 12 tri ścian + 6 tri kapy (bez dna) = 18 tri. */
function frustum(P: Parts, o: FrustumOpts): void {
  const yaw = o.yaw ?? 0, sx = o.sx ?? 1, sz = o.sz ?? 1;
  const tox = o.topOx ?? 0, toz = o.topOz ?? 0;
  const bot = ring6(o.cx, o.cz, o.rb, yaw, sx, sz);
  const top = ring6(o.cx + tox, o.cz + toz, o.rt, yaw, sx, sz);
  const y1 = o.y0 + o.h;
  const wall = rgb(o.wall);
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const b0: V3 = [bot[i]![0], o.y0, bot[i]![1]], b1: V3 = [bot[j]![0], o.y0, bot[j]![1]];
    const t0: V3 = [top[i]![0], y1, top[i]![1]], t1: V3 = [top[j]![0], y1, top[j]![1]];
    const mx = (b0[0] + b1[0]) / 2 - o.cx, mz = (b0[2] + b1[2]) / 2 - o.cz;
    const ref: V3 = [mx, 0, mz];
    pushTri(P, b0, b1, t1, wall, ref);
    pushTri(P, b0, t1, t0, wall, ref);
  }
  if (o.cap !== null && o.cap !== undefined) {
    const cap = rgb(o.cap);
    const C: V3 = [o.cx + tox, y1, o.cz + toz];
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      pushTri(P, C, [top[i]![0], y1, top[i]![1]], [top[j]![0], y1, top[j]![1]], cap, [0, 1, 0]);
    }
  }
}

interface ConeOpts {
  cx: number; cz: number; y0: number; h: number; r: number; col: number;
  yaw?: number; sx?: number; sz?: number; apexOx?: number; apexOz?: number;
}

/** Hex-stożek bez dna = 6 tri. */
function cone(P: Parts, o: ConeOpts): void {
  const yaw = o.yaw ?? 0, sx = o.sx ?? 1, sz = o.sz ?? 1;
  const bot = ring6(o.cx, o.cz, o.r, yaw, sx, sz);
  const A: V3 = [o.cx + (o.apexOx ?? 0), o.y0 + o.h, o.cz + (o.apexOz ?? 0)];
  const col = rgb(o.col);
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const b0: V3 = [bot[i]![0], o.y0, bot[i]![1]], b1: V3 = [bot[j]![0], o.y0, bot[j]![1]];
    const ref: V3 = [(b0[0] + b1[0]) / 2 - o.cx, 0, (b0[2] + b1[2]) / 2 - o.cz];
    pushTri(P, b0, b1, A, col, ref);
  }
}

const ROCK_JIT: readonly number[] = [1.0, 0.78, 1.14, 0.86, 1.06];

/** Fasetowana skałka (5-boczna dwupiramida, spód wtopiony w stok) = 10 tri. */
function rock(P: Parts, cx: number, cz: number, y0: number, r: number, h: number, yaw: number, colHex: number): void {
  const col = rgb(colHex);
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 5; i++) {
    const a = yaw + i * (Math.PI * 2 / 5);
    const rr = r * ROCK_JIT[i]!;
    pts.push([cx + rr * Math.sin(a), cz + rr * Math.cos(a)]);
  }
  const ym = y0 + h * 0.45;
  const top: V3 = [cx + r * 0.12, y0 + h, cz - r * 0.08];
  const botA: V3 = [cx, y0 - 0.05, cz];
  for (let i = 0; i < 5; i++) {
    const j = (i + 1) % 5;
    const v0: V3 = [pts[i]![0], ym, pts[i]![1]], v1: V3 = [pts[j]![0], ym, pts[j]![1]];
    const ref: V3 = [(v0[0] + v1[0]) / 2 - cx, 0, (v0[2] + v1[2]) / 2 - cz];
    pushTri(P, v0, v1, top, col, ref);
    pushTri(P, v1, v0, botA, col, ref);
  }
}

/**
 * Prosty stok-rampa na boku +x (rezerwa pod przyszłe tarasy uprawne):
 * segmentowa wstęga po narożach stopni [x, y, półszerokość-z] + skirty boczne.
 */
function rampaSegm(P: Parts, pts: ReadonlyArray<readonly [number, number, number]>, colHex: number, colSkirt: number): void {
  const col = rgb(colHex), colS = rgb(colSkirt);
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0, w0] = pts[i]!;
    const [x1, y1, w1] = pts[i + 1]!;
    const A0: V3 = [x0, y0 + 0.008, -w0], A1: V3 = [x0, y0 + 0.008, w0];
    const B0: V3 = [x1, y1 + 0.008, -w1], B1: V3 = [x1, y1 + 0.008, w1];
    const refUp: V3 = [0.55, 1, 0];
    pushTri(P, A0, A1, B1, col, refUp);
    pushTri(P, A0, B1, B0, col, refUp);
    // skirty boczne w dół (chowają prześwit między rampą a stopniami)
    const drop = 0.10;
    const A0d: V3 = [x0, y0 - drop, -w0], B0d: V3 = [x1, y1 - drop, -w1];
    const A1d: V3 = [x0, y0 - drop, w0], B1d: V3 = [x1, y1 - drop, w1];
    pushTri(P, A0, B0, B0d, colS, [0, 0, -1]);
    pushTri(P, A0, B0d, A0d, colS, [0, 0, -1]);
    pushTri(P, A1, B1d, B1, colS, [0, 0, 1]);
    pushTri(P, A1, A1d, B1d, colS, [0, 0, 1]);
  }
}

// ---------------------------------------------------------------------------
// WZGÓRZA — 5 sylwetek (plateau y=0.392 pokrywa środek heksa)
// ---------------------------------------------------------------------------

function czesciWzgorza(w: number): Parts {
  const P: Parts = { pos: [], col: [] };
  const pal = PAL_WZGORZ[w % 5]!;
  const { wall, wallDk, grassA, grassB } = pal;

  if (w === 0) {
    // W0 — kopulasty kopiec (4 strome stopnie) + PROSTY STOK na +x pod tarasy
    frustum(P, { cx: 0, cz: 0, y0: 0.000, h: 0.130, rb: 0.90, rt: 0.72, wall: wallDk, cap: grassA });
    frustum(P, { cx: 0, cz: 0, y0: 0.130, h: 0.100, rb: 0.68, rt: 0.52, wall, cap: grassA });
    frustum(P, { cx: 0, cz: 0, y0: 0.230, h: 0.090, rb: 0.48, rt: 0.36, wall: wallDk, cap: grassB });
    frustum(P, { cx: 0, cz: 0, y0: 0.320, h: 0.072, rb: 0.32, rt: 0.26, wall, cap: grassB });
    rampaSegm(P, [
      [0.80, 0.004, 0.26],
      [0.64, 0.140, 0.22],
      [0.46, 0.240, 0.18],
      [0.33, 0.330, 0.15],
      [0.24, 0.392, 0.12],
    ], wall, wallDk);
  } else if (w === 1) {
    // W1 — podwójny garb: stroma kopuła nad środkiem + niższy towarzysz
    frustum(P, { cx: -0.10, cz: 0.02, y0: 0.000, h: 0.130, rb: 0.74, rt: 0.60, wall: wallDk, cap: grassA });
    frustum(P, { cx: -0.10, cz: 0.02, y0: 0.130, h: 0.100, rb: 0.56, rt: 0.44, wall, cap: grassB });
    frustum(P, { cx: -0.10, cz: 0.02, y0: 0.230, h: 0.090, rb: 0.40, rt: 0.31, wall: wallDk, cap: grassB });
    frustum(P, { cx: -0.10, cz: 0.02, y0: 0.320, h: 0.072, rb: 0.28, rt: 0.235, wall, cap: grassB });
    frustum(P, { cx: 0.54, cz: 0.18, y0: 0.000, h: 0.150, rb: 0.40, rt: 0.28, wall, cap: grassA });
    frustum(P, { cx: 0.54, cz: 0.18, y0: 0.150, h: 0.100, rb: 0.25, rt: 0.17, wall: wallDk, cap: grassB });
  } else if (w === 2) {
    // W2 — stroma kopuła ze skałkami wychodzącymi na przód (+z) i bok (-x)
    frustum(P, { cx: 0, cz: 0, y0: 0.000, h: 0.130, rb: 0.86, rt: 0.68, wall: wallDk, cap: grassA });
    frustum(P, { cx: 0, cz: 0, y0: 0.130, h: 0.100, rb: 0.64, rt: 0.50, wall, cap: grassB });
    frustum(P, { cx: 0, cz: 0, y0: 0.230, h: 0.090, rb: 0.46, rt: 0.34, wall: wallDk, cap: grassB });
    frustum(P, { cx: 0, cz: 0, y0: 0.320, h: 0.072, rb: 0.30, rt: 0.24, wall, cap: grassB });
    rock(P, -0.46, 0.38, 0.05, 0.17, 0.24, 0.4, SKALKA_JASNA);
    rock(P, -0.62, 0.06, 0.08, 0.13, 0.18, 2.1, SKALKA_CIEMNA);
    rock(P, 0.14, 0.58, 0.01, 0.14, 0.19, 4.2, SKALKA_JASNA);
    rock(P, -0.28, 0.20, 0.25, 0.10, 0.14, 1.2, SKALKA_CIEMNA);
  } else if (w === 3) {
    // W3 — zaokrąglony stożek (5 ciasnych stopni) + PÓŁKA na +x pod tarasy
    frustum(P, { cx: 0, cz: 0, y0: 0.000, h: 0.100, rb: 0.84, rt: 0.64, wall: wallDk, cap: grassA });
    frustum(P, { cx: 0, cz: 0, y0: 0.100, h: 0.092, rb: 0.60, rt: 0.47, wall, cap: grassB });
    frustum(P, { cx: 0, cz: 0, y0: 0.192, h: 0.082, rb: 0.44, rt: 0.34, wall: wallDk, cap: grassA });
    frustum(P, { cx: 0, cz: 0, y0: 0.274, h: 0.072, rb: 0.31, rt: 0.24, wall, cap: grassB });
    frustum(P, { cx: 0, cz: 0, y0: 0.346, h: 0.046, rb: 0.225, rt: 0.20, wall: wallDk, cap: grassB });
    frustum(P, { cx: 0.52, cz: 0, y0: 0.160, h: 0.055, rb: 0.36, rt: 0.34, sz: 0.72, wall: wallDk, cap: grassB });
  } else {
    // W4 — niski wydłużony grzbiet wzdłuż osi x + skałka na końcu
    frustum(P, { cx: 0, cz: 0, y0: 0.000, h: 0.160, rb: 0.62, rt: 0.47, sx: 1.46, sz: 0.80, wall: wallDk, cap: grassA });
    frustum(P, { cx: 0, cz: 0, y0: 0.160, h: 0.130, rb: 0.43, rt: 0.32, sx: 1.40, sz: 0.70, wall, cap: grassB });
    frustum(P, { cx: 0, cz: 0, y0: 0.290, h: 0.102, rb: 0.28, rt: 0.20, sx: 1.30, sz: 0.64, wall: wallDk, cap: grassA });
    frustum(P, { cx: 0.62, cz: -0.06, y0: 0.000, h: 0.100, rb: 0.25, rt: 0.16, wall, cap: grassB });
    rock(P, -0.74, 0.10, 0.10, 0.14, 0.17, 3.3, SKALKA_JASNA);
  }
  return P;
}

// ---------------------------------------------------------------------------
// GÓRY — 5 sylwetek (apex 1.06–1.18, podstawa <=0.87R)
// ---------------------------------------------------------------------------

function czesciGory(w: number): Parts {
  const P: Parts = { pos: [], col: [] };
  const pal = PAL_GOR[w % 5]!;
  const s = pal.s, d = pal.d;

  if (w === 0) {
    // G0 — pojedynczy OSTRY szczyt (stromy, tiery uciekają w bok), śnieżna czapa
    frustum(P, { cx: 0, cz: 0, y0: 0.00, h: 0.26, rb: 0.84, rt: 0.55, wall: d[0]!, cap: s[2]! });
    frustum(P, { cx: 0, cz: 0, y0: 0.26, h: 0.28, rb: 0.52, rt: 0.34, wall: s[1]!, cap: s[3]!, topOx: 0.04, topOz: 0.02 });
    frustum(P, { cx: 0.04, cz: 0.02, y0: 0.54, h: 0.30, rb: 0.31, rt: 0.19, wall: d[1]!, cap: s[3]!, topOx: 0.04, topOz: 0.02 });
    frustum(P, { cx: 0.08, cz: 0.04, y0: 0.84, h: 0.09, rb: 0.20, rt: 0.15, wall: pal.snowBlock, cap: pal.snowBlock });
    cone(P, { cx: 0.08, cz: 0.04, y0: 0.93, h: 0.32, r: 0.17, col: pal.snowPeak, apexOx: 0.03, apexOz: 0.01 });
    rock(P, 0.55, -0.44, 0.00, 0.14, 0.20, 0.7, s[0]!);
    rock(P, -0.60, 0.32, 0.00, 0.11, 0.15, 2.6, d[0]!);
  } else if (w === 1) {
    // G1 — masyw dwuszczytowy, śnieg na obu (łupek)
    frustum(P, { cx: 0, cz: 0, y0: 0.00, h: 0.20, rb: 0.72, rt: 0.55, sx: 1.15, sz: 0.92, wall: d[0]!, cap: s[1]! });
    frustum(P, { cx: -0.17, cz: -0.03, y0: 0.20, h: 0.30, rb: 0.50, rt: 0.32, wall: d[1]!, cap: s[2]! });
    frustum(P, { cx: -0.17, cz: -0.03, y0: 0.50, h: 0.28, rb: 0.29, rt: 0.18, wall: s[2]!, cap: s[3]! });
    frustum(P, { cx: -0.17, cz: -0.03, y0: 0.78, h: 0.09, rb: 0.165, rt: 0.115, wall: pal.snowBlock, cap: pal.snowBlock });
    cone(P, { cx: -0.17, cz: -0.03, y0: 0.87, h: 0.28, r: 0.13, col: pal.snowPeak, apexOx: -0.02 });
    frustum(P, { cx: 0.36, cz: 0.10, y0: 0.20, h: 0.26, rb: 0.33, rt: 0.21, wall: d[2]!, cap: s[2]! });
    frustum(P, { cx: 0.36, cz: 0.10, y0: 0.46, h: 0.20, rb: 0.19, rt: 0.12, wall: s[1]!, cap: s[2]! });
    cone(P, { cx: 0.36, cz: 0.10, y0: 0.66, h: 0.22, r: 0.135, col: pal.snowPeak, apexOx: 0.02 });
  } else if (w === 2) {
    // G2 — TRÓJZĄB: trzy iglice ze wspólnego cokołu, bez śniegu (ciemny bazalt)
    frustum(P, { cx: 0, cz: 0, y0: 0.00, h: 0.20, rb: 0.78, rt: 0.56, wall: d[0]!, cap: s[0]! });
    frustum(P, { cx: 0, cz: 0, y0: 0.20, h: 0.16, rb: 0.52, rt: 0.40, wall: s[0]!, cap: s[1]! });
    frustum(P, { cx: 0, cz: -0.04, y0: 0.36, h: 0.30, rb: 0.32, rt: 0.20, wall: d[1]!, cap: s[2]! });
    frustum(P, { cx: 0, cz: -0.04, y0: 0.66, h: 0.28, rb: 0.18, rt: 0.11, wall: s[1]!, cap: s[2]! });
    cone(P, { cx: 0, cz: -0.04, y0: 0.94, h: 0.26, r: 0.105, col: s[3]!, apexOx: 0.02 });
    frustum(P, { cx: -0.36, cz: 0.14, y0: 0.36, h: 0.30, rb: 0.21, rt: 0.13, wall: d[2]!, cap: s[1]! });
    cone(P, { cx: -0.36, cz: 0.14, y0: 0.66, h: 0.26, r: 0.115, col: s[2]!, apexOx: -0.02 });
    frustum(P, { cx: 0.34, cz: 0.10, y0: 0.36, h: 0.24, rb: 0.18, rt: 0.11, wall: s[0]!, cap: s[1]! });
    cone(P, { cx: 0.34, cz: 0.10, y0: 0.60, h: 0.24, r: 0.10, col: s[3]!, apexOz: 0.02 });
  } else if (w === 3) {
    // G3 — szczyt z RAMIENIEM-GRANIĄ schodzącą w +x (piaskowiec), iglice na grani
    frustum(P, { cx: 0, cz: 0, y0: 0.00, h: 0.20, rb: 0.62, rt: 0.48, sx: 1.20, sz: 0.85, wall: d[0]!, cap: s[1]! });
    frustum(P, { cx: -0.30, cz: -0.03, y0: 0.20, h: 0.30, rb: 0.46, rt: 0.30, wall: d[1]!, cap: s[2]! });
    frustum(P, { cx: -0.30, cz: -0.03, y0: 0.50, h: 0.28, rb: 0.27, rt: 0.17, wall: s[1]!, cap: s[3]! });
    frustum(P, { cx: -0.30, cz: -0.03, y0: 0.78, h: 0.24, rb: 0.15, rt: 0.085, wall: d[2]!, cap: s[3]! });
    cone(P, { cx: -0.30, cz: -0.03, y0: 1.02, h: 0.16, r: 0.075, col: s[4]!, apexOx: -0.01 });
    frustum(P, { cx: 0.14, cz: 0.03, y0: 0.20, h: 0.34, rb: 0.26, rt: 0.16, wall: s[0]!, cap: s[2]! });
    cone(P, { cx: 0.14, cz: 0.03, y0: 0.54, h: 0.12, r: 0.14, col: s[2]!, apexOx: 0.02 });
    frustum(P, { cx: 0.44, cz: 0.09, y0: 0.14, h: 0.26, rb: 0.21, rt: 0.13, wall: d[1]!, cap: s[1]! });
    cone(P, { cx: 0.44, cz: 0.09, y0: 0.40, h: 0.10, r: 0.11, col: s[1]!, apexOx: 0.01 });
    frustum(P, { cx: 0.65, cz: 0.14, y0: 0.07, h: 0.19, rb: 0.16, rt: 0.09, wall: s[0]!, cap: s[1]! });
  } else {
    // G4 — PRZYSADZISTY masyw z szeroką śnieżną czapą z okapem (jasny tuf)
    frustum(P, { cx: 0, cz: 0, y0: 0.00, h: 0.24, rb: 0.85, rt: 0.70, wall: s[1]!, cap: s[3]! });
    frustum(P, { cx: 0, cz: 0, y0: 0.24, h: 0.26, rb: 0.66, rt: 0.52, wall: d[2]!, cap: s[3]!, topOx: -0.03, topOz: 0.02 });
    frustum(P, { cx: -0.03, cz: 0.02, y0: 0.50, h: 0.22, rb: 0.46, rt: 0.38, wall: s[2]!, cap: s[4]! });
    frustum(P, { cx: -0.03, cz: 0.02, y0: 0.72, h: 0.14, rb: 0.44, rt: 0.30, wall: pal.snowBlock, cap: pal.snowBlock });
    cone(P, { cx: -0.03, cz: 0.02, y0: 0.86, h: 0.24, r: 0.32, col: pal.snowPeak, apexOx: 0.03 });
    rock(P, 0.56, 0.32, 0.00, 0.16, 0.20, 1.5, s[2]!);
  }
  return P;
}

// ---------------------------------------------------------------------------
// Geometrie współdzielone (cache) + materiał wspólny + buildery
// ---------------------------------------------------------------------------

function zbudujGeometrie(P: Parts, nazwa: string): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P.pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(P.col, 3));
  g.computeVertexNormals(); // non-indexed → płaskie normalne per ścianka
  g.name = nazwa;
  return g;
}

const cacheWzgorz: Array<THREE.BufferGeometry | null> = [null, null, null, null, null];
const cacheGor: Array<THREE.BufferGeometry | null> = [null, null, null, null, null];

/** Współdzielona geometria wzgórza (1 instancja na wariant — pod InstancedMesh). */
export function wzgorzeGeometria(wariant: number): THREE.BufferGeometry {
  const w = ((wariant | 0) % 5 + 5) % 5;
  if (!cacheWzgorz[w]) cacheWzgorz[w] = zbudujGeometrie(czesciWzgorza(w), `wzgorze-w${w}`);
  return cacheWzgorz[w]!;
}

/** Współdzielona geometria góry. */
export function goraGeometria(wariant: number): THREE.BufferGeometry {
  const w = ((wariant | 0) % 5 + 5) % 5;
  if (!cacheGor[w]) cacheGor[w] = zbudujGeometrie(czesciGory(w), `gora-g${w}`);
  return cacheGor[w]!;
}

/** JEDEN materiał dla całego terenu (kolory w vertex colors) — klucz do 10 draw calli. */
export const TEREN_MATERIAL = new THREE.MeshLambertMaterial({
  vertexColors: true,
  flatShading: true,
});

/** Wygodny mesh wzgórza (geometria współdzielona z cache). Spód y=0. */
export function buildWzgorze(wariant: number): THREE.Mesh {
  const m = new THREE.Mesh(wzgorzeGeometria(wariant), TEREN_MATERIAL);
  m.castShadow = true;
  m.receiveShadow = true;
  m.name = `wzgorze-w${((wariant | 0) % 5 + 5) % 5}`;
  return m;
}

/** Wygodny mesh góry. Spód y=0. */
export function buildGora(wariant: number): THREE.Mesh {
  const m = new THREE.Mesh(goraGeometria(wariant), TEREN_MATERIAL);
  m.castShadow = true;
  m.receiveShadow = true;
  m.name = `gora-g${((wariant | 0) % 5 + 5) % 5}`;
  return m;
}

/** Liczba trójkątów wariantu (diagnostyka/testy). */
export function trojkatyWariantu(typ: 'wzgorze' | 'gora', wariant: number): number {
  const g = typ === 'wzgorze' ? wzgorzeGeometria(wariant) : goraGeometria(wariant);
  return g.getAttribute('position').count / 3;
}
