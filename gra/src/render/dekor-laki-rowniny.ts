/**
 * dekor-laki-rowniny.ts — MIKRODEKORACJE pustych heksów ŁĄKA i RÓWNINA
 * w stylu Roblox (klockowate bryły, żywe płaskie kolory, MeshLambert
 * flatShading, zero tekstur). Zamówienie Macieja: "są takie płaskie i gołe;
 * może jakaś trawka na łąkach, jakieś inne rzeczy na równinach" — ożywić
 * najpowszechniejsze heksy mapy BEZ zabijania FPS.
 *
 * DZIŚ W GRZE (kanon gra/src, stan 2026-07-09):
 *  - pusta Łąka/Równina = goły pryzm heksa, zero dekoracji (mapRenderStyle.ts
 *    ma buildStyle* tylko dla lasu/gór/wzgórz/wybrzeża/wydm/oaz/tarasów);
 *  - kolory wierzchu (styl roblox, TERRAIN_ROBLOX ~:447):
 *    Łąka 0x94bf78, Równina 0xb0ca7e — dekor dobrany kontrastowo do tych teł.
 *
 * WARIANTY (tri policzalne przez trojkatyDekoru; wszystkie <= 40 tri/heks):
 *  ŁĄKA (soczysta zieleń, ciemniejsza i jaśniejsza od podłoża 0x94bf78):
 *   - L0  18 tri — dwie kępki trawy + samotne źdźbło;
 *   - L1  31 tri — para kwiatków (biały + żółty łepek na łodyżce) + kępka;
 *   - L2  28 tri — mini-krzaczek (2 bryłki) + czerwony kwiatek + kępka;
 *   - L3  20 tri — kępki trawy + pojedynczy JASNY kamyk (rzadki akcent:
 *                  tylko 1 z 4 wariantów => ~14% zdobionych łąk).
 *  RÓWNINA (suche złoto/oliwka na tle 0xb0ca7e):
 *   - R0  18 tri — dwie kępy suchej złotej trawy + źdźbło;
 *   - R1  23 tri — niskie ciernisko (bryłka + 3 kolce) + kępa;
 *   - R2  21 tri — trzy ciepłe kamyki + kępka;
 *   - R3  32 tri — kępka dzikiego zboża (3 źdźbła z kłosami) + kamyk.
 *
 * WYDAJNOŚĆ (łąk/równin są setki tysięcy — NAJTAŃSZA geometria w grze):
 *  - 8 wariantów = 8 współdzielonych, zmergowanych BufferGeometry (cache
 *    w module) + JEDEN materiał DEKOR_MATERIAL (vertexColors) => cały
 *    mikrodekor mapy to maks. 8 InstancedMesh = 8 draw calli;
 *  - budżet: max 32 tri/heks (średnio ~24 na ZDOBIONY heks); przy 45%
 *    heksów CAŁKIEM PUSTYCH średnio ~13 tri na heks łąki/równiny;
 *    1000 heksów łąk+równin ~= +13 tys. tri przy pełnej widoczności;
 *  - castShadow = false (mikrodetal, cień nic nie wnosi a kosztuje pass) —
 *    ŚWIADOME odstępstwo od wzgórz/gór, które rzucają cień;
 *  - LOD: dekor widoczny TYLKO przy bliskim/średnim zoomie — patrz niżej.
 *
 * RZADKOŚĆ / DETERMINIZM / ZERO ZMIAN HASHA MAPY:
 *  - dekorDlaHeksa(q, r) zwraca null dla DEKOR_UDZIAL_PUSTYCH = 45% heksów
 *    (naturalna rzadkość — mapa NIE jest "krzaczasta"), inaczej wariant 0..3;
 *  - wybór wariantu, obecności i rotacji WYŁĄCZNIE po stronie renderu:
 *    ta sama arytmetyka co hash2D z mapRenderStyle.ts (imul/xorshift),
 *    sole 1201/1207/1213 (wolne — nie kolidują z 911/613/300/400/500/889),
 *    bez Math.random, bez dotykania map/gen*. Ten sam heks = zawsze to samo.
 *
 * LOD (progi z render/zoomLod.ts — poziomy 0..4):
 *  - rekomendacja: podpiąć widoczność pod ISTNIEJĄCĄ flagę terrainDetailInst
 *    (true na poziomach 0-1, false od 2) — zero nowych ścieżek w zoomLod;
 *  - DEKOR_LOD_MAX_POZIOM = 1 (bliski/średni zoom; jak rzeki OFF na dalekim);
 *  - 8 InstancedMesh trzymać w jednej THREE.Group => LOD = 1x group.visible.
 *
 * WYSOKOŚĆ / KOLIZJE WIZUALNE:
 *  - DEKOR_MAX_WYSOKOSC = 0.06 nad wierzchem heksa (najwyższy kłos 0.058) —
 *    nic nie zasłania jednostek (krowa z pastwiska ~0.13 wys.);
 *  - elementy na pierścieniu r 0.28-0.55 x HEX_R (footprint <= 0.75) — środek
 *    heksa zostaje czysty; dekor jest CZYSTO WIZUALNY: na heksie miasta /
 *    ulepszenia NIE stawiać instancji (wzorzec hideInstancedOnHex jak las).
 *
 * JAK WPIĄĆ (drzewo kanoniczne gra/src, wzorzec InstancedMesh jak góry):
 *  1. Plik skopiować do gra/src/render/dekor-laki-rowniny.ts.
 *  2. render/scene.ts — przy budowie mapy, w pętli po heksach (tam gdzie
 *     zbierane są instancje hillBumpMesh/peakMesh):
 *       teren Laka/Rownina bez miasta/ulepszenia =>
 *         const w = dekorDlaHeksa(q, r, seed); if (w !== null) dodaj instancję
 *         do InstancedMesh wariantu (geometria dekorLakaGeometria(w) albo
 *         dekorRowninaGeometria(w), materiał DEKOR_MATERIAL), macierz =
 *         translacja na środek heksa (y = wierzch pryzmu) x rotacjaDekoru(q,r).
 *  3. Wszystkie 8 InstancedMesh do jednej Group; w setZoomLod:
 *     grupa.visible = flags.terrainDetailInst (poziomy 0-1). Fog jak dla
 *     pozostałych instancji (instanceColor / hideInstancedOnHex).
 *  4. Generator mapy, hash, save — NIETKNIĘTE.
 *
 * KONWENCJE (zgodne z teren-gory-wzgorza.ts / pastwisko-modele.ts):
 *  - spód modelu na y=0 (wierzch heksa), współrzędne w HEX_R=1 (hexutil.ts),
 *  - orientacja bazowa jak pryzm heksa (wierzchołek w +z), obrót całości =
 *    rotation.y (snap 60 stopni z rotacjaDekoru).
 */
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Stałe eksportowane (gęstość / LOD / gabaryty)
// ---------------------------------------------------------------------------

/** Liczba wariantów mikrodekoru na każdy teren (łąka i równina po 4). */
export const DEKOR_LICZBA_WARIANTOW = 4;

/** Udział heksów CAŁKIEM PUSTYCH (bez dekoru) — naturalna rzadkość. */
export const DEKOR_UDZIAL_PUSTYCH = 0.45;

/** Maksymalna wysokość elementu nad wierzchem heksa (jednostki nietykane). */
export const DEKOR_MAX_WYSOKOSC = 0.06;

/** Maksymalny zasięg dekoru od środka heksa (środki elementów <=0.55 + gabaryt). */
export const DEKOR_FOOTPRINT_R = 0.75;

/**
 * Najwyższy poziom ZoomLodLevel (render/zoomLod.ts), przy którym dekor jest
 * jeszcze widoczny. 0-1 = bliski/średni zoom — dokładnie zasięg flagi
 * terrainDetailInst, pod którą rekomendujemy podpiąć group.visible.
 */
export const DEKOR_LOD_MAX_POZIOM = 1;

// ---------------------------------------------------------------------------
// Deterministyczny hash per heks — TA SAMA arytmetyka co mapRenderStyle.hash2D
// (czysto renderowy; generator mapy nietknięty). Sole 1201/1207/1213.
// ---------------------------------------------------------------------------

const SALT_OBECNOSC = 1201;
const SALT_WARIANT = 1207;
const SALT_ROTACJA = 1213;

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
 * Mikrodekor dla heksa (q,r): null = heks zostaje CAŁKIEM PUSTY (~45%),
 * inaczej deterministyczny wariant 0..DEKOR_LICZBA_WARIANTOW-1.
 * Którego buildera użyć (łąka/równina) decyduje teren heksa u wołającego.
 */
export function dekorDlaHeksa(q: number, r: number, seed = 0): number | null {
  if (hashHeksa(q, r, seed, SALT_OBECNOSC) < DEKOR_UDZIAL_PUSTYCH) return null;
  return Math.floor(hashHeksa(q, r, seed, SALT_WARIANT) * DEKOR_LICZBA_WARIANTOW);
}

/** Deterministyczna rotacja dekoru — wielokrotność 60 stopni (rotation.y). */
export function rotacjaDekoru(q: number, r: number, seed = 0): number {
  return Math.floor(hashHeksa(q, r, seed, SALT_ROTACJA) * 6) * (Math.PI / 3);
}

// ---------------------------------------------------------------------------
// Palety (wypieczone w vertex colors) — kontrast do wierzchu pryzmu:
// Łąka 0x94bf78 (dekor ciemniejszy LUB wyraźnie jaśniejszy/soczystszy),
// Równina 0xb0ca7e (dekor złoty/oliwkowy, suchszy od podłoża).
// ---------------------------------------------------------------------------

// ŁĄKA — soczysta zieleń
const LAKA_TRAWA_C = 0x55a041; // ciemniejsza, nasycona
const LAKA_TRAWA_J = 0x7fdb55; // jaśniejsza, soczysta
const LAKA_TRAWA_S = 0x68bd4a; // pośrednia
const LAKA_LODYGA = 0x4c913e;  // łodyżka kwiatka (ciemna zieleń)
const LAKA_KRZAK_C = 0x3f8536; // krzaczek — bryła ciemna
const LAKA_KRZAK_J = 0x5cab47; // krzaczek — grudka jaśniejsza
const KWIAT_BIALY = 0xf8f8ee;
const KWIAT_ZOLTY = 0xf5c94b;
const KWIAT_CZERWONY = 0xdb5244;
const KAMYK_JASNY = 0xb4bcc3;  // jasny kamyk na łące

// RÓWNINA — suche złoto / oliwka
const ROW_TRAWA_C = 0xb59d49;  // ciemne złoto
const ROW_TRAWA_J = 0xe0cd72;  // jasne złoto (siano)
const ROW_TRAWA_S = 0xcbb45c;  // pośrednia
const CIERN_KORPUS = 0x8a8749; // oliwkowe ciernisko
const CIERN_KOLEC = 0x6b663a;  // ciemne kolce
const ZBOZE_ZDZBLO = 0xc0a94f;
const ZBOZE_KLOS = 0xecd97e;   // jasny kłos
const KAMYK_CIEPLY_A = 0xa89e8a;
const KAMYK_CIEPLY_B = 0x968c78;

// ---------------------------------------------------------------------------
// Emiter geometrii (non-indexed, kolor per wierzchołek, bez den)
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

/** Obrót w płaszczyźnie XZ (zgodny z rotation.y). */
function rot2(x: number, z: number, yaw: number): [number, number] {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [x * c + z * s, z * c - x * s];
}

// ---------------------------------------------------------------------------
// Prymitywy mikrodekoru (tri: ostrze 3, kamyk 5, kwiatek 11, krzaczek 11,
// ciernisko 17, kłos 9) — wszystkie ze spodem wtopionym w heks (bez dna)
// ---------------------------------------------------------------------------

interface OstrzeOpts {
  h: number; r: number; yaw?: number; splasz?: number;
  tiltX?: number; tiltZ?: number; col: number;
}

/** Ostrze trawy — spłaszczony 3-boczny klinek (bez dna) = 3 tri. */
function ostrze(P: Parts, cx: number, cz: number, o: OstrzeOpts): void {
  const yaw = o.yaw ?? 0, sp = o.splasz ?? 0.55;
  const base: V3[] = [];
  for (let i = 0; i < 3; i++) {
    const a = i * (Math.PI * 2 / 3);
    const [wx, wz] = rot2(Math.sin(a) * o.r, Math.cos(a) * o.r * sp, yaw);
    base.push([cx + wx, -0.004, cz + wz]);
  }
  const A: V3 = [cx + (o.tiltX ?? 0), o.h, cz + (o.tiltZ ?? 0)];
  const col = rgb(o.col);
  for (let i = 0; i < 3; i++) {
    const j = (i + 1) % 3;
    const b0 = base[i]!, b1 = base[j]!;
    const ref: V3 = [(b0[0] + b1[0]) / 2 - cx, 0.2, (b0[2] + b1[2]) / 2 - cz];
    pushTri(P, b0, b1, A, col, ref);
  }
}

interface KepkaOpts { yaw?: number; s?: number; colA: number; colB: number; n: 2 | 3; }

/** Kępka trawy — 2-3 ostrza (środkowe wyższe, boczne pochylone) = 6/9 tri. */
function kepka(P: Parts, cx: number, cz: number, o: KepkaOpts): void {
  const yaw = o.yaw ?? 0, s = o.s ?? 1;
  // [dx, dz, h, r, tilt na zewnątrz]
  const defs: ReadonlyArray<readonly [number, number, number, number, number]> = o.n === 3
    ? [[0, 0, 0.054, 0.068, 0.30], [-0.080, 0.044, 0.040, 0.054, 0.85], [0.070, -0.060, 0.034, 0.048, 0.85]]
    : [[0, 0, 0.048, 0.058, 0.35], [0.078, 0.040, 0.034, 0.048, 0.85]];
  const cols = [o.colA, o.colB, o.colA];
  for (let i = 0; i < defs.length; i++) {
    const [dx, dz, h, r, tl] = defs[i]!;
    const [wx, wz] = rot2(dx * s, dz * s, yaw);
    const len = Math.max(1e-6, Math.hypot(wx, wz));
    // pochylenie wierzchołka na zewnątrz kępki (środkowe ostrze — lekki skos)
    const tx = len < 0.01 ? 0.030 : (wx / len) * r * tl * 1.2;
    const tz = len < 0.01 ? 0.016 : (wz / len) * r * tl * 1.2;
    ostrze(P, cx + wx, cz + wz, {
      h: h * s, r: r * s, yaw: yaw + i * 1.9, tiltX: tx, tiltZ: tz, col: cols[i]!,
    });
  }
}

const KAMYK_JIT: readonly number[] = [1.0, 0.8, 1.12, 0.88, 1.06];

/** Kamyk — fasetowana 5-boczna piramidka, podstawa wtopiona = 5 tri. */
function kamyk(P: Parts, cx: number, cz: number, o: { r: number; h: number; yaw?: number; col: number }): void {
  const yaw = o.yaw ?? 0;
  const col = rgb(o.col);
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 5; i++) {
    const a = yaw + i * (Math.PI * 2 / 5);
    const rr = o.r * KAMYK_JIT[i]!;
    pts.push([cx + rr * Math.sin(a), cz + rr * Math.cos(a)]);
  }
  const A: V3 = [cx + o.r * 0.16, o.h, cz - o.r * 0.10];
  for (let i = 0; i < 5; i++) {
    const j = (i + 1) % 5;
    const b0: V3 = [pts[i]![0], -0.008, pts[i]![1]];
    const b1: V3 = [pts[j]![0], -0.008, pts[j]![1]];
    const ref: V3 = [(b0[0] + b1[0]) / 2 - cx, 0.25, (b0[2] + b1[2]) / 2 - cz];
    pushTri(P, b0, b1, A, col, ref);
  }
}

/** Spłaszczony oktaedr (4-boczna bipiramida) — łepek/krzaczek = 8 tri. */
function okta(P: Parts, cx: number, cy: number, cz: number,
  o: { r: number; hGora: number; hDol: number; yaw?: number; col: number }): void {
  const yaw = o.yaw ?? 0;
  const col = rgb(o.col);
  const eq: V3[] = [];
  for (let i = 0; i < 4; i++) {
    const a = yaw + i * (Math.PI / 2);
    eq.push([cx + o.r * Math.sin(a), cy, cz + o.r * Math.cos(a)]);
  }
  const T: V3 = [cx, cy + o.hGora, cz];
  const B: V3 = [cx, cy - o.hDol, cz];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    const e0 = eq[i]!, e1 = eq[j]!;
    const ref: V3 = [(e0[0] + e1[0]) / 2 - cx, 0.30, (e0[2] + e1[2]) / 2 - cz];
    const refD: V3 = [ref[0], -0.30, ref[2]];
    pushTri(P, e0, e1, T, col, ref);
    pushTri(P, e0, e1, B, col, refD);
  }
}

/** Kwiatek — łodyżka (klinek 3 tri) + spłaszczony oktaedr-łepek (8 tri) = 11 tri. */
function kwiatek(P: Parts, cx: number, cz: number,
  o: { h?: number; rLepek?: number; yaw?: number; colLepek: number }): void {
  const h = o.h ?? 0.030, rL = o.rLepek ?? 0.036, yaw = o.yaw ?? 0;
  ostrze(P, cx, cz, { h, r: 0.020, splasz: 0.7, yaw, tiltX: 0.006, col: LAKA_LODYGA });
  okta(P, cx, h, cz, { r: rL, hGora: rL * 0.75, hDol: rL * 0.75, yaw: yaw + 0.4, col: o.colLepek });
}

/** Mini-krzaczek — spłaszczony oktaedr + boczna grudka (klinek) = 11 tri. */
function krzaczek(P: Parts, cx: number, cz: number,
  o: { r?: number; h?: number; yaw?: number; colC: number; colJ: number }): void {
  const r = o.r ?? 0.110, h = o.h ?? 0.056, yaw = o.yaw ?? 0;
  okta(P, cx, h * 0.55, cz, { r, hGora: h * 0.45, hDol: h * 0.55 + 0.006, yaw, col: o.colC });
  const [lx, lz] = rot2(r * 0.95, r * 0.30, yaw);
  ostrze(P, cx + lx, cz + lz, { h: h * 0.55, r: r * 0.40, splasz: 0.8, yaw: yaw + 0.7, col: o.colJ });
}

/** Ciernisko — płaski oktaedr-korpus (8) + 3 kolce na zewnątrz (9) = 17 tri. */
function ciernisko(P: Parts, cx: number, cz: number, o: { yaw?: number }): void {
  const yaw = o.yaw ?? 0;
  okta(P, cx, 0.020, cz, { r: 0.100, hGora: 0.018, hDol: 0.026, yaw, col: CIERN_KORPUS });
  for (let i = 0; i < 3; i++) {
    const a = yaw + 0.5 + i * (Math.PI * 2 / 3);
    const [dx, dz] = rot2(0.088 * Math.sin(a), 0.088 * Math.cos(a), 0);
    ostrze(P, cx + dx, cz + dz, {
      h: 0.044 + (i % 2) * 0.012, r: 0.020, splasz: 0.7, yaw: a,
      tiltX: Math.sin(a) * 0.060, tiltZ: Math.cos(a) * 0.060, col: CIERN_KOLEC,
    });
  }
}

/** Kłos dzikiego zboża — źdźbło (3) + 3-boczna bipiramida-kłos (6) = 9 tri. */
function klos(P: Parts, cx: number, cz: number, o: { yaw?: number; tiltX?: number; tiltZ?: number }): void {
  const yaw = o.yaw ?? 0, tx = o.tiltX ?? 0, tz = o.tiltZ ?? 0;
  ostrze(P, cx, cz, { h: 0.036, r: 0.018, splasz: 0.7, yaw, tiltX: tx * 0.7, tiltZ: tz * 0.7, col: ZBOZE_ZDZBLO });
  const col = rgb(ZBOZE_KLOS);
  const ex = cx + tx, ez = cz + tz;
  const eq: V3[] = [];
  for (let i = 0; i < 3; i++) {
    const a = yaw + i * (Math.PI * 2 / 3);
    eq.push([ex + 0.030 * Math.sin(a), 0.042, ez + 0.030 * Math.cos(a)]);
  }
  const T: V3 = [ex + tx * 0.25, 0.058, ez + tz * 0.25];
  const B: V3 = [ex - tx * 0.2, 0.024, ez - tz * 0.2];
  for (let i = 0; i < 3; i++) {
    const j = (i + 1) % 3;
    const e0 = eq[i]!, e1 = eq[j]!;
    const ref: V3 = [(e0[0] + e1[0]) / 2 - ex, 0.25, (e0[2] + e1[2]) / 2 - ez];
    const refD: V3 = [ref[0], -0.25, ref[2]];
    pushTri(P, e0, e1, T, col, ref);
    pushTri(P, e0, e1, B, col, refD);
  }
}

// ---------------------------------------------------------------------------
// ŁĄKA — 4 kompozycje (elementy na pierścieniu r 0.28-0.72, środek czysty)
// ---------------------------------------------------------------------------

function czesciDekoruLaki(w: number): Parts {
  const P: Parts = { pos: [], col: [] };
  if (w === 0) {
    // L0 — dwie kępki soczystej trawy + samotne źdźbło (18 tri)
    kepka(P, 0.42, 0.18, { n: 3, yaw: 0.4, colA: LAKA_TRAWA_C, colB: LAKA_TRAWA_J });
    kepka(P, -0.38, -0.30, { n: 2, yaw: 2.3, colA: LAKA_TRAWA_S, colB: LAKA_TRAWA_C });
    ostrze(P, -0.12, 0.52, { h: 0.040, r: 0.055, yaw: 1.1, tiltX: 0.035, col: LAKA_TRAWA_J });
  } else if (w === 1) {
    // L1 — para kwiatków (biały + żółty) + kępka trawy (31 tri)
    kwiatek(P, 0.30, -0.44, { colLepek: KWIAT_BIALY, yaw: 0.2 });
    kwiatek(P, 0.45, -0.26, { colLepek: KWIAT_ZOLTY, yaw: 2.4, h: 0.026, rLepek: 0.032 });
    kepka(P, -0.44, 0.28, { n: 3, yaw: 3.6, colA: LAKA_TRAWA_C, colB: LAKA_TRAWA_S });
  } else if (w === 2) {
    // L2 — mini-krzaczek + czerwony kwiatek + kępka (30 tri)
    krzaczek(P, -0.36, 0.40, { yaw: 0.9, colC: LAKA_KRZAK_C, colJ: LAKA_KRZAK_J });
    kwiatek(P, 0.50, -0.12, { colLepek: KWIAT_CZERWONY, yaw: 4.1, h: 0.028, rLepek: 0.034 });
    kepka(P, 0.06, -0.52, { n: 2, yaw: 5.2, colA: LAKA_TRAWA_J, colB: LAKA_TRAWA_C });
  } else {
    // L3 — kępki trawy + pojedynczy jasny kamyk (20 tri)
    kepka(P, 0.40, 0.30, { n: 3, yaw: 1.7, colA: LAKA_TRAWA_S, colB: LAKA_TRAWA_J });
    kamyk(P, -0.32, -0.44, { r: 0.080, h: 0.034, yaw: 0.7, col: KAMYK_JASNY });
    kepka(P, -0.52, 0.12, { n: 2, yaw: 4.4, colA: LAKA_TRAWA_C, colB: LAKA_TRAWA_S });
  }
  return P;
}

// ---------------------------------------------------------------------------
// RÓWNINA — 4 kompozycje
// ---------------------------------------------------------------------------

function czesciDekoruRowniny(w: number): Parts {
  const P: Parts = { pos: [], col: [] };
  if (w === 0) {
    // R0 — dwie kępy suchej złotej trawy + źdźbło (18 tri)
    kepka(P, 0.44, -0.22, { n: 3, yaw: 5.0, colA: ROW_TRAWA_C, colB: ROW_TRAWA_J });
    kepka(P, -0.36, 0.42, { n: 2, yaw: 1.3, colA: ROW_TRAWA_S, colB: ROW_TRAWA_C });
    ostrze(P, -0.26, -0.48, { h: 0.038, r: 0.050, yaw: 2.6, tiltZ: -0.032, col: ROW_TRAWA_J });
  } else if (w === 1) {
    // R1 — niskie ciernisko + kępa suchej trawy (23 tri)
    ciernisko(P, -0.06, 0.46, { yaw: 0.3 });
    kepka(P, 0.42, -0.36, { n: 2, yaw: 3.9, colA: ROW_TRAWA_C, colB: ROW_TRAWA_S });
  } else if (w === 2) {
    // R2 — trzy ciepłe kamyki + kępka (21 tri)
    kamyk(P, 0.38, 0.28, { r: 0.085, h: 0.032, yaw: 0.2, col: KAMYK_CIEPLY_A });
    kamyk(P, -0.44, -0.20, { r: 0.065, h: 0.026, yaw: 2.2, col: KAMYK_CIEPLY_B });
    kamyk(P, 0.10, -0.50, { r: 0.055, h: 0.020, yaw: 4.0, col: KAMYK_CIEPLY_A });
    kepka(P, -0.16, 0.42, { n: 2, yaw: 5.6, colA: ROW_TRAWA_S, colB: ROW_TRAWA_J });
  } else {
    // R3 — kępka dzikiego zboża (3 kłosy) + kamyk (32 tri)
    klos(P, -0.37, -0.22, { yaw: 0.5, tiltX: -0.035, tiltZ: -0.020 });
    klos(P, -0.47, -0.05, { yaw: 2.6, tiltX: -0.030, tiltZ: 0.024 });
    klos(P, -0.27, -0.04, { yaw: 4.4, tiltX: 0.038, tiltZ: 0.016 });
    kamyk(P, 0.44, 0.30, { r: 0.070, h: 0.028, yaw: 1.5, col: KAMYK_CIEPLY_B });
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
  g.computeVertexNormals(); // non-indexed => płaskie normalne per ścianka
  g.name = nazwa;
  return g;
}

const cacheLaka: Array<THREE.BufferGeometry | null> = [null, null, null, null];
const cacheRownina: Array<THREE.BufferGeometry | null> = [null, null, null, null];

/** Współdzielona geometria dekoru łąki (1 instancja na wariant — pod InstancedMesh). */
export function dekorLakaGeometria(wariant: number): THREE.BufferGeometry {
  const w = ((wariant | 0) % 4 + 4) % 4;
  if (!cacheLaka[w]) cacheLaka[w] = zbudujGeometrie(czesciDekoruLaki(w), `dekor-laka-l${w}`);
  return cacheLaka[w]!;
}

/** Współdzielona geometria dekoru równiny. */
export function dekorRowninaGeometria(wariant: number): THREE.BufferGeometry {
  const w = ((wariant | 0) % 4 + 4) % 4;
  if (!cacheRownina[w]) cacheRownina[w] = zbudujGeometrie(czesciDekoruRowniny(w), `dekor-rownina-r${w}`);
  return cacheRownina[w]!;
}

/** JEDEN materiał całego mikrodekoru (kolory w vertex colors) => 8 draw calli. */
export const DEKOR_MATERIAL = new THREE.MeshLambertMaterial({
  vertexColors: true,
  flatShading: true,
});

/** Wygodny mesh dekoru łąki (geometria z cache). Spód y=0, BEZ cienia (perf). */
export function buildDekorLaka(wariant: number): THREE.Mesh {
  const m = new THREE.Mesh(dekorLakaGeometria(wariant), DEKOR_MATERIAL);
  m.castShadow = false;
  m.receiveShadow = true;
  m.name = `dekor-laka-l${((wariant | 0) % 4 + 4) % 4}`;
  return m;
}

/** Wygodny mesh dekoru równiny. Spód y=0, BEZ cienia (perf). */
export function buildDekorRownina(wariant: number): THREE.Mesh {
  const m = new THREE.Mesh(dekorRowninaGeometria(wariant), DEKOR_MATERIAL);
  m.castShadow = false;
  m.receiveShadow = true;
  m.name = `dekor-rownina-r${((wariant | 0) % 4 + 4) % 4}`;
  return m;
}

/** Liczba trójkątów wariantu (diagnostyka/testy). */
export function trojkatyDekoru(typ: 'laka' | 'rownina', wariant: number): number {
  const g = typ === 'laka' ? dekorLakaGeometria(wariant) : dekorRowninaGeometria(wariant);
  return g.getAttribute('position').count / 3;
}
