/**
 * lasy-modele.ts — TEREN: 5 wariantów KĘP LASU (nakładka Nakladka.Las)
 * w stylu Roblox (fasetowane bryły, żywe płaskie kolory, MeshLambert
 * flatShading, zero tekstur, czytelne z lotu ptaka). Las to obok gór główna
 * masa wizualna mapy (tysiące heksów) — musi być TANI i różnorodny.
 *
 * DZIŚ W GRZE (kanon gra/src, stan 2026-07-10):
 *  - las: render/mapRenderStyle.ts:717 buildStyleForestCluster — Group per heks,
 *    3–5 drzew (dżungla tropikalna 5–7), każde drzewo addRobloxTree (:544):
 *      sosna    = pień Box (12 tri) + 4×ConeGeometry(6) (48 tri) = 60 tri / 5 meshy,
 *      liściaste = pień Box (12 tri) + 3×Icosahedron(0) (60 tri) = 72 tri / 4 meshe;
 *    kępa = ~200–360 tri i 12–25 MESHY na heks, każdy mesh z WŁASNYM
 *    MeshLambertMaterial (mat() :292 tworzy nowy materiał per wywołanie) —
 *    12–25 draw calli na KAŻDY heks lasu;
 *  - siada na baseY = wierzch pryzmu heksa (scene.ts:1757–1763, styledOverlays);
 *  - wysokość: sosna do ~0.83, liściaste do ~1.00 HEX_R (góry: apex 1.10–1.25);
 *  - wariant = TYLKO kolor (TREE_VARIANTS :314, decorVariant5 salt 300),
 *    kształt drzewa identyczny na całej mapie;
 *  - WYRĄB (P3A): main.ts:4371 spawnClearingMesh stawia buildWyrab NA lesie
 *    przez 3 tury wycinki, potem finalizeHexClearing zdejmuje nakładkę Las —
 *    las dziś NIE rzednie w trakcie (stąd wariant 4 PRZETRZEBIONY poniżej).
 *
 * NOWE MODELE (tri: pień4=8, pień3=6, blob=12, cone6=6, pieniek=18, kłoda=20,
 * kępka=6; drzewo liśc. małe=20/18, duże=32; świerk 2-tier=20, 3-tier=26):
 *  - buildLas(0) 144 tri — LIŚCIASTY klasyczny: 6 drzew (2 duże o 2 „chmurach"
 *      korony + 4 małe), 3 odcienie zieleni + brzoza (jasny pień) jako akcent;
 *  - buildLas(1) 176 tri — LIŚCIASTY gęsty: 8 drzew ciaśniej (ciemniejsza
 *      zieleń, tylne pnie 3-boczne) + 2 kępki poszycia;
 *  - buildLas(2) 164 tri — IGLASTY: 7 świerków stożkowych 2–3-tierowych,
 *      czysta ciemna zieleń + brąz pni (bez szronu);
 *  - buildLas(3) 150 tri — MIESZANY: 3 liściaste + 3 świerki + kępka;
 *  - buildLas(4) 158 tri — PRZETRZEBIONY: 3 drzewa + 3 pieńki z jasnym
 *      przekrojem + powalona kłoda + kępka trawy — kolory kory/przekroju
 *      1:1 z buildWyrab (ulepszenia-modele-p3a.ts), wariant pod heks
 *      las+wyrąb w trakcie wycinki / las rzadki.
 *  ŚRODEK heksa (r<0.40) celowo RZADSZY (maks. 2 niskie obiekty) — czytelność
 *  pod jednostki/ikony; miasto na lesie i tak kasuje dekor (macierz F-CITY-HEX).
 *
 * WYDAJNOŚĆ / INSTANCING (lasów są tysiące):
 *  - 5 wariantów = 5 współdzielonych, zmergowanych BufferGeometry (cache
 *    w module, non-indexed, bez den i ukrytych ścian) + JEDEN wspólny
 *    LAS_MATERIAL (vertexColors) — cała warstwa lasu mapy to maks.
 *    5 InstancedMesh = 5 draw calli (dziś: 12–25 draw calli × liczba heksów);
 *  - 144–176 tri/heks vs ~200–360 dziś (spadek ~35–50% tri, draw calle ~×100).
 *
 * DETERMINIZM / ZERO ZMIAN HASHA MAPY:
 *  - wybór wariantu i rotacji WYŁĄCZNIE po stronie renderu:
 *    wariantLasuDlaHeksa(q,r,5,seed) i rotacjaLasuDlaHeksa(q,r,seed) — ta sama
 *    arytmetyka co hash2D z mapRenderStyle.ts (imul/xorshift), NOWE sole
 *    1301/1307 (wolne: nie kolidują z 4/6 gór, 911/613 terenu,
 *    300/400/500/889 palet, 1201/1207/1213 dekoru łąk, 1..166 starego lasu).
 *    Ten sam heks = zawsze ten sam wariant i obrót; map/gen* nietknięte.
 *
 * WYSOKOŚCI / GABARYT:
 *  - LAS_MAX_Y = 0.90 nad wierzchem heksa — poniżej starego lasu (~1.00)
 *    i wyraźnie poniżej gór (1.10–1.25); nie zasłania jednostek bardziej
 *    niż dziś; footprint kęp ≤ LAS_FOOTPRINT_R = 0.84 (korony nie wystają
 *    poza heks nawet w kierunku ściany, inradius 0.866).
 *
 * JAK WPIĄĆ (drzewo kanoniczne gra/src):
 *  1. Plik skopiować do gra/src/render/lasy-modele.ts.
 *  2. Wariant minimalny: w mapRenderStyle.ts buildStyleForestCluster (:717)
 *     dla stylu 'roblox' POZA strefą tropikalną zwrócić
 *     mesh z lasGeometria(wariantLasuDlaHeksa(q,r,5,seed)) + rotation.y =
 *     rotacjaLasuDlaHeksa(q,r,seed), materiał LAS_MATERIAL (albo klon, jeśli
 *     fogDim tintuje per heks); dżungla tropikalna (palmy) bez zmian —
 *     osobne zamówienie.
 *  3. Wariant docelowy (5 draw calli): w scene.ts gałąź Nakladka.Las (:1757)
 *     zamiast styledOverlays użyć 5 InstancedMesh w istniejącym wzorcu
 *     hillBumpMesh/peakMesh (hexKey + origMatrix + hideInstancedOnHex +
 *     applyOverlayFog; fog przez instanceColor).
 *  4. Heks las+wyrąb (hexClearingStates, main.ts:4371): na czas wycinki
 *     podmienić instancję na wariant 4 (PRZETRZEBIONY) — spójny z modelem
 *     buildWyrab; po finalizeHexClearing dekor znika jak dziś.
 *
 * KONWENCJE (zgodne z teren-gory-wzgorza.ts / ulepszenia-modele-p2.ts):
 *  - spód modelu na y=0 (wierzch heksa), współrzędne w HEX_R=1 (hexutil.ts),
 *  - orientacja bazowa jak pryzm heksa (wierzchołek w +z, theta=0), obrót
 *    całości = rotation.y (snap 60° z rotacjaLasuDlaHeksa).
 */
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Stałe wymiarów
// ---------------------------------------------------------------------------

/** Liczba wariantów kęp lasu. */
export const LICZBA_WARIANTOW_LASU = 5;

/** Maks. wysokość korony nad wierzchem heksa (stary las: ~0.83–1.00). */
export const LAS_MAX_Y = 0.90;

/** Maks. zasięg kępy od środka heksa (pozycja+promień korony; inradius 0.866). */
export const LAS_FOOTPRINT_R = 0.84;

/** Sole hasha (NOWE — patrz nagłówek: brak kolizji z 4/6/911/613/1201–1213). */
export const SOL_WARIANT_LASU = 1301;
export const SOL_ROTACJA_LASU = 1307;

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

/** Deterministyczny wariant kępy lasu 0..liczbaWariantow-1 dla heksa (q,r). */
export function wariantLasuDlaHeksa(
  q: number,
  r: number,
  liczbaWariantow: number = LICZBA_WARIANTOW_LASU,
  seed = 0,
): number {
  return Math.floor(hashHeksa(q, r, seed, SOL_WARIANT_LASU) * liczbaWariantow);
}

/** Deterministyczna rotacja kępy — wielokrotność 60°, wyrównana do siatki hex. */
export function rotacjaLasuDlaHeksa(q: number, r: number, seed = 0): number {
  return Math.floor(hashHeksa(q, r, seed, SOL_ROTACJA_LASU) * 6) * (Math.PI / 3);
}

// ---------------------------------------------------------------------------
// Paleta (wypieczona w vertex colors) — rodziny zieleni/brązów 1:1
// z TREE_VARIANTS (mapRenderStyle.ts:314) + kolory wyrębu z P3A
// ---------------------------------------------------------------------------

/** Zielenie koron (od najciemniejszej): rodzina TREE_VARIANTS. */
const Z0 = 0x2d4a32; // las głęboki (cień)
const Z1 = 0x3d6b45; // sosna ciemna
const Z2 = 0x4a7a52; // sosna jasna
const Z3 = 0x5a8f5a; // dąb
const Z4 = 0x6b9f62; // dąb jasny
const Z5 = 0x8fbf7a; // świeża zieleń
const Z_BRZOZA = 0xa8d4a0; // brzoza — najjaśniejszy liść

/** Pnie: rodzina TREE_VARIANTS. */
const PIEN_DAB = 0x7a5a32;
const PIEN_SOSNA = 0x8b5a2b;
const PIEN_CIEMNY = 0x5a4028;
const PIEN_CHLODNY = 0x6a5040;
const PIEN_BRZOZA = 0xc4b498;

/** Wyrąb (1:1 z ulepszenia-modele-p3a.ts buildWyrab): kora + jasny przekrój. */
const KORA_WYREBU = 0x8a5a2e;
const PRZEKROJ_PNIA = 0xe8b46b;

/** Poszycie / kępki traw. */
const POSZYCIE_CIEMNE = 0x3d6b45;
const KEPKA_TRAWY = 0x6b9f62;

// ---------------------------------------------------------------------------
// Emitery geometrii (non-indexed, kolor per wierzchołek, bez den/ukrytych kap)
// — pushTri/ring6/frustum/cone w konwencji teren-gory-wzgorza.ts
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

function ringN(n: number, cx: number, cz: number, r: number, yaw: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const a = yaw + i * (Math.PI * 2 / n);
    pts.push([cx + r * Math.sin(a), cz + r * Math.cos(a)]);
  }
  return pts;
}

/**
 * PIEŃ — zwężany słupek n-boczny BEZ kapy i dna (korona zakrywa górę):
 * n=4 → 8 tri (drzewa pierwszoplanowe), n=3 → 6 tri (tło gęstej kępy).
 */
function pien(P: Parts, cx: number, cz: number, y0: number, h: number,
  rb: number, rt: number, colHex: number, yaw = 0, n = 4): void {
  const col = rgb(colHex);
  const bot = ringN(n, cx, cz, rb, yaw);
  const top = ringN(n, cx, cz, rt, yaw);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const b0: V3 = [bot[i]![0], y0, bot[i]![1]], b1: V3 = [bot[j]![0], y0, bot[j]![1]];
    const t0: V3 = [top[i]![0], y0 + h, top[i]![1]], t1: V3 = [top[j]![0], y0 + h, top[j]![1]];
    const ref: V3 = [(b0[0] + b1[0]) / 2 - cx, 0, (b0[2] + b1[2]) / 2 - cz];
    pushTri(P, b0, b1, t1, col, ref);
    pushTri(P, b0, t1, t0, col, ref);
  }
}

/** Jitter promienia korony (deterministyczny, „klockowa chmura"). */
const BLOB_JIT: readonly number[] = [1.0, 0.86, 1.10, 0.92, 1.06, 0.88];

/**
 * BLOB — fasetowana „chmura" korony: dwupiramida 6-boczna z jitterem
 * promienia i lekko zepchniętymi apexami = 12 tri (vs Icosahedron(0) 20 tri).
 */
function blob(P: Parts, cx: number, cy: number, cz: number, rx: number, rz: number,
  hUp: number, hDn: number, colHex: number, yaw = 0, apexOx = 0, apexOz = 0): void {
  const col = rgb(colHex);
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const a = yaw + i * Math.PI / 3;
    const jit = BLOB_JIT[i]!;
    pts.push([cx + rx * jit * Math.sin(a), cz + rz * jit * Math.cos(a)]);
  }
  const T: V3 = [cx + apexOx, cy + hUp, cz + apexOz];
  const B: V3 = [cx - apexOx * 0.5, cy - hDn, cz - apexOz * 0.5];
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const v0: V3 = [pts[i]![0], cy, pts[i]![1]], v1: V3 = [pts[j]![0], cy, pts[j]![1]];
    const ref: V3 = [(v0[0] + v1[0]) / 2 - cx, 0, (v0[2] + v1[2]) / 2 - cz];
    pushTri(P, v0, v1, T, col, ref);
    pushTri(P, v1, v0, B, col, ref);
  }
}

/** Hex-stożek bez dna = 6 tri (tier świerka, kępka poszycia). */
function cone(P: Parts, cx: number, cz: number, y0: number, h: number, r: number,
  colHex: number, yaw = 0, apexOx = 0, apexOz = 0): void {
  const col = rgb(colHex);
  const bot = ringN(6, cx, cz, r, yaw);
  const A: V3 = [cx + apexOx, y0 + h, cz + apexOz];
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const b0: V3 = [bot[i]![0], y0, bot[i]![1]], b1: V3 = [bot[j]![0], y0, bot[j]![1]];
    const ref: V3 = [(b0[0] + b1[0]) / 2 - cx, 0, (b0[2] + b1[2]) / 2 - cz];
    pushTri(P, b0, b1, A, col, ref);
  }
}

/**
 * PIENIEK po wycince — 6-boczny walec z korą + jasny przekrój na kapie
 * (kolory 1:1 z buildWyrab) = 12+6 = 18 tri.
 */
function pieniek(P: Parts, cx: number, cz: number, r: number, h: number, yaw: number): void {
  const kora = rgb(KORA_WYREBU), przekroj = rgb(PRZEKROJ_PNIA);
  const bot = ringN(6, cx, cz, r * 1.12, yaw);
  const top = ringN(6, cx, cz, r, yaw);
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const b0: V3 = [bot[i]![0], 0, bot[i]![1]], b1: V3 = [bot[j]![0], 0, bot[j]![1]];
    const t0: V3 = [top[i]![0], h, top[i]![1]], t1: V3 = [top[j]![0], h, top[j]![1]];
    const ref: V3 = [(b0[0] + b1[0]) / 2 - cx, 0, (b0[2] + b1[2]) / 2 - cz];
    pushTri(P, b0, b1, t1, kora, ref);
    pushTri(P, b0, t1, t0, kora, ref);
  }
  const C: V3 = [cx, h, cz];
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    pushTri(P, C, [top[i]![0], h, top[i]![1]], [top[j]![0], h, top[j]![1]], przekroj, [0, 1, 0]);
  }
}

/** KŁODA — powalony pień: leżący graniastosłup 6-boczny + 2 jasne czoła = 20 tri. */
function kloda(P: Parts, cx: number, cz: number, dl: number, r: number, yaw: number): void {
  const kora = rgb(KORA_WYREBU), przekroj = rgb(PRZEKROJ_PNIA);
  const ux = Math.sin(yaw), uz = Math.cos(yaw); // oś kłody
  const ends: Array<[number, number]> = [[cx - ux * dl / 2, cz - uz * dl / 2], [cx + ux * dl / 2, cz + uz * dl / 2]];
  const prof: V3[] = [];
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + 0.26;
    // profil w płaszczyźnie prostopadłej do osi (składowe: poprzeczna pozioma + pionowa)
    prof.push([Math.cos(a) * r, Math.sin(a) * r + r * 0.92, 0]);
  }
  const ring = (e: number): V3[] => prof.map((p): V3 => [
    ends[e]![0] + p[0] * uz, p[1], ends[e]![1] - p[0] * ux,
  ]);
  const r0 = ring(0), r1 = ring(1);
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const mid: V3 = [(r0[i]![0] + r0[j]![0]) / 2 - cx, r0[i]![1] + r0[j]![1] - r * 1.84, (r0[i]![2] + r0[j]![2]) / 2 - cz];
    pushTri(P, r0[i]!, r0[j]!, r1[j]!, kora, mid);
    pushTri(P, r0[i]!, r1[j]!, r1[i]!, kora, mid);
  }
  for (let i = 1; i + 1 < 6; i++) { // czoła: fan 4 tri każde
    pushTri(P, r0[0]!, r0[i]!, r0[i + 1]!, przekroj, [-ux, 0, -uz]);
    pushTri(P, r1[0]!, r1[i]!, r1[i + 1]!, przekroj, [ux, 0, uz]);
  }
}

// ---------------------------------------------------------------------------
// Drzewa składane (pień + korona)
// ---------------------------------------------------------------------------

/**
 * Drzewo liściaste: pień + 1 „chmura" korony (małe, 20 tri; pien3 → 18 tri)
 * lub 2 „chmury" (duże, 32 tri). H = wysokość całkowita.
 */
function drzewoLisciaste(P: Parts, x: number, z: number, H: number, yaw: number,
  pienHex: number, lisc1: number, lisc2 = 0, pienBoki = 4): void {
  pien(P, x, z, 0, 0.46 * H, 0.024 + 0.042 * H, 0.018 + 0.030 * H, pienHex, yaw, pienBoki);
  if (lisc2) {
    blob(P, x, 0.64 * H, z, 0.30 * H, 0.30 * H, 0.36 * H, 0.30 * H, lisc1, yaw, 0.05 * H, -0.03 * H);
    const bx = x + Math.sin(yaw + 1.25) * 0.16 * H;
    const bz = z + Math.cos(yaw + 1.25) * 0.16 * H;
    blob(P, bx, 0.48 * H, bz, 0.18 * H, 0.18 * H, 0.22 * H, 0.20 * H, lisc2, yaw + 0.5, -0.03 * H, 0.02 * H);
  } else {
    blob(P, x, 0.62 * H, z, 0.28 * H, 0.28 * H, 0.38 * H, 0.28 * H, lisc1, yaw, 0.04 * H, 0.03 * H);
  }
}

/** Świerk stożkowy: pień + 2 lub 3 tiery (20 / 26 tri). H = wysokość całkowita. */
function swierk(P: Parts, x: number, z: number, H: number, yaw: number,
  pienHex: number, tiery3 = true): void {
  pien(P, x, z, 0, 0.20 * H, 0.020 + 0.030 * H, 0.016 + 0.020 * H, pienHex, yaw, 4);
  if (tiery3) {
    cone(P, x, z, 0.10 * H, 0.38 * H, 0.30 * H, Z0, yaw, 0.02 * H, 0.01 * H);
    cone(P, x, z, 0.34 * H, 0.36 * H, 0.22 * H, Z1, yaw + 0.35, 0.015 * H, -0.01 * H);
    cone(P, x, z, 0.58 * H, 0.42 * H, 0.15 * H, Z2, yaw + 0.7, 0.01 * H, 0.01 * H);
  } else {
    cone(P, x, z, 0.08 * H, 0.46 * H, 0.27 * H, Z0, yaw, 0.02 * H, -0.01 * H);
    cone(P, x, z, 0.42 * H, 0.58 * H, 0.18 * H, Z1, yaw + 0.4, 0.015 * H, 0.01 * H);
  }
}

/** Kępka poszycia/trawy — niski stożek 6 tri. */
function kepka(P: Parts, x: number, z: number, r: number, h: number, colHex: number, yaw = 0): void {
  cone(P, x, z, 0, h, r, colHex, yaw, 0.15 * r, 0.1 * r);
}

// ---------------------------------------------------------------------------
// KĘPY LASU — 5 sylwetek (środek r<0.40 rzadszy: maks. 2 niskie obiekty)
// ---------------------------------------------------------------------------

function czesciLasu(w: number): Parts {
  const P: Parts = { pos: [], col: [] };

  if (w === 0) {
    // L0 — LIŚCIASTY klasyczny: 6 drzew (2 duże + 4 małe), brzoza jako akcent
    drzewoLisciaste(P, 0.44, 0.25, 0.90, 0.3, PIEN_DAB, Z3, Z4);
    drzewoLisciaste(P, -0.41, 0.33, 0.84, 2.1, PIEN_DAB, Z2, Z3);
    drzewoLisciaste(P, -0.52, -0.24, 0.70, 4.0, PIEN_CIEMNY, Z3);
    drzewoLisciaste(P, 0.15, -0.55, 0.74, 1.2, PIEN_BRZOZA, Z_BRZOZA);
    drzewoLisciaste(P, 0.57, -0.25, 0.58, 5.1, PIEN_DAB, Z2);
    drzewoLisciaste(P, -0.12, 0.06, 0.52, 2.8, PIEN_CIEMNY, Z4); // środek: 1 niskie
  } else if (w === 1) {
    // L1 — LIŚCIASTY gęsty: 8 drzew ciaśniej (ciemna zieleń) + poszycie
    drzewoLisciaste(P, 0.40, 0.34, 0.88, 1.0, PIEN_CIEMNY, Z1, Z2);
    drzewoLisciaste(P, 0.62, -0.08, 0.64, 2.6, PIEN_CIEMNY, Z2);
    drzewoLisciaste(P, -0.58, 0.18, 0.60, 4.4, PIEN_CIEMNY, Z1);
    drzewoLisciaste(P, -0.24, -0.54, 0.66, 0.7, PIEN_CHLODNY, Z2);
    drzewoLisciaste(P, 0.06, 0.60, 0.58, 3.4, PIEN_CIEMNY, Z1, 0, 3); // tło: pień 3-boczny
    drzewoLisciaste(P, -0.46, 0.48, 0.54, 5.6, PIEN_CIEMNY, Z0, 0, 3);
    drzewoLisciaste(P, 0.30, -0.52, 0.56, 1.9, PIEN_CHLODNY, Z1, 0, 3);
    drzewoLisciaste(P, -0.05, -0.06, 0.50, 4.9, PIEN_CIEMNY, Z2, 0, 3); // środek: 1 niskie
    kepka(P, 0.20, 0.10, 0.09, 0.11, POSZYCIE_CIEMNE, 0.8); // środek: 2. obiekt (niski)
    kepka(P, -0.35, -0.28, 0.08, 0.10, POSZYCIE_CIEMNE, 2.2);
  } else if (w === 2) {
    // L2 — IGLASTY: 7 świerków 2–3-tierowych, ciemna zieleń + brąz pni
    swierk(P, 0.48, 0.30, 0.86, 0.4, PIEN_SOSNA, true);
    swierk(P, -0.50, 0.30, 0.80, 2.3, PIEN_CHLODNY, true);
    swierk(P, -0.30, -0.49, 0.84, 4.1, PIEN_SOSNA, true);
    swierk(P, 0.26, -0.53, 0.76, 1.5, PIEN_CHLODNY, true);
    swierk(P, 0.66, -0.14, 0.56, 3.0, PIEN_SOSNA, false);
    swierk(P, -0.68, -0.06, 0.52, 5.2, PIEN_CHLODNY, false);
    swierk(P, 0.02, 0.04, 0.55, 2.0, PIEN_SOSNA, false); // środek: 1 niski
  } else if (w === 3) {
    // L3 — MIESZANY: 3 liściaste + 3 świerki + kępka
    drzewoLisciaste(P, 0.48, 0.32, 0.86, 0.9, PIEN_DAB, Z3, Z4);
    drzewoLisciaste(P, 0.58, -0.32, 0.60, 2.7, PIEN_DAB, Z4);
    drzewoLisciaste(P, -0.10, 0.04, 0.52, 4.6, PIEN_CIEMNY, Z3); // środek: 1 niskie
    swierk(P, -0.50, 0.28, 0.82, 1.1, PIEN_CHLODNY, true);
    swierk(P, 0.04, -0.58, 0.78, 3.8, PIEN_SOSNA, true);
    swierk(P, -0.56, -0.40, 0.56, 5.5, PIEN_CHLODNY, false);
    kepka(P, -0.30, 0.55, 0.08, 0.10, POSZYCIE_CIEMNE, 1.4);
  } else {
    // L4 — PRZETRZEBIONY (las+wyrąb / las rzadki): 3 drzewa + pieńki + kłoda
    drzewoLisciaste(P, 0.48, 0.29, 0.78, 0.6, PIEN_DAB, Z3, Z4);
    swierk(P, -0.50, -0.32, 0.74, 2.9, PIEN_SOSNA, true);
    drzewoLisciaste(P, -0.42, 0.50, 0.56, 4.3, PIEN_CIEMNY, Z4);
    pieniek(P, 0.12, -0.06, 0.070, 0.100, 0.5); // środek: 1 niski pieniek
    pieniek(P, -0.12, -0.52, 0.060, 0.085, 2.4);
    pieniek(P, 0.52, -0.42, 0.065, 0.090, 4.0);
    kloda(P, 0.24, -0.30, 0.46, 0.055, 0.95);
    kepka(P, 0.02, 0.42, 0.075, 0.09, KEPKA_TRAWY, 3.1);
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

const cacheLasu: Array<THREE.BufferGeometry | null> = [null, null, null, null, null];

/** Współdzielona geometria kępy lasu (1 instancja na wariant — pod InstancedMesh). */
export function lasGeometria(wariant: number): THREE.BufferGeometry {
  const w = ((wariant | 0) % 5 + 5) % 5;
  if (!cacheLasu[w]) cacheLasu[w] = zbudujGeometrie(czesciLasu(w), `las-l${w}`);
  return cacheLasu[w]!;
}

/** JEDEN materiał dla całego lasu (kolory w vertex colors) — klucz do 5 draw calli. */
export const LAS_MATERIAL = new THREE.MeshLambertMaterial({
  vertexColors: true,
  flatShading: true,
});

/** Wygodny mesh kępy lasu (geometria współdzielona z cache). Spód y=0. */
export function buildLas(wariant: number): THREE.Mesh {
  const m = new THREE.Mesh(lasGeometria(wariant), LAS_MATERIAL);
  m.castShadow = true;
  m.receiveShadow = true;
  m.name = `las-l${((wariant | 0) % 5 + 5) % 5}`;
  return m;
}

/** Liczba trójkątów wariantu (diagnostyka/testy). */
export function trojkatyLasu(wariant: number): number {
  return lasGeometria(wariant).getAttribute('position').count / 3;
}
