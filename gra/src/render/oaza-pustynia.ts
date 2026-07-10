/**
 * oaza-pustynia.ts — OAZA (feature pustyni) + MIKRODEKORACJE PUSTYNI
 * w stylu Roblox (klockowate bryly, zywe plaskie kolory, MeshLambert
 * flatShading, zero tekstur). Pustynia = najgolszy teren gry: jedyny dekor
 * to dzis 1 ikosahedr-wydma (buildStyleDune), a oaza = placeholder
 * (gladki walec 16-seg + stozkowe "palmy" w buildStyleOasis).
 *
 * DZIS W GRZE (kanon gra/src, stan 2026-07-10):
 *  - OAZA ISTNIEJE wizualnie: scene.ts:1999 losuje LCG rnd()<1/6 na heksie
 *    pustyni i wola buildStyleOasis (mapRenderStyle.ts:1616). W DANYCH GRY
 *    (data/, game/, types/) oazy NIE MA — czysto wizualny dekor renderu.
 *  - Wydma: buildStyleDune (mapRenderStyle.ts:1587), hash2D sol 9 (<0.34)
 *    + sole 11-14; pojedynczy IcosahedronGeometry — do zastapienia dekorem B.
 *  - Kolor wierzchu pustyni (TERRAIN_ROBLOX ~:456): 0xe0c88e — palety
 *    ponizej dobrane kontrastowo do tego tla.
 *
 * CZESC A — OAZA, buildOaza() 348 tri (styl serii ulepszen P2/P3):
 *  - klockowy staw: nieregularny 8-katny fan x3 warstwy (mokry piasek +
 *    glebia + plycizna, 2 odcienie turkusu), woda PRZESUNIETA od srodka
 *    heksa (-0.14,+0.10) — naturalnosc; total footprint r<=0.80;
 *  - 3 palmy: pochylone pnie segmentowe (schodkowe boxy, pasiak 2 brazow)
 *    + korony z 4-5 klockowych lisci-platow (2 zielenie), pochylone NAD wode;
 *  - pierscien zieleni: 5 krzaczkow-boxow (soczysta zielen na tle piasku);
 *  - 2 glazy (obrocone boxy).
 *  OSADZENIE (2 warianty — oaza nie jest bytem w danych gry):
 *   1) DZIS (dekor): w scene.ts:2004 zamiast buildStyleOasis wolac
 *      buildOaza() (grupa; pozycja x/baseY/z, rotacja = rotacjaOazy(q,r,seed)
 *      lub rnd — LCG zostaje nietkniete);
 *   2) DOCELOWO (gdyby oaza awansowala na zasob/feature w danych): stabilne
 *      hash-osadzenie per heks (sol 1319) zamiast LCG; kompozycja miesci sie
 *      w r<=0.80, srodek heksa NIE jest pusty (woda tuz przy nim) — gdyby
 *      srodek musial byc wolny (budynek), przesunac grupe o ~0.15 w -x.
 *
 * CZESC B — MIKRODEKOR PUSTYNI, DOKLADNIE wzorzec dekor-laki-rowniny.ts
 * (zmergowane BufferGeometry non-indexed + vertex colors + JEDEN material):
 *  - P0  23 tri — fale wydm: 3 rownolegle luki-nasypy (wiatr z 1 kierunku,
 *                 strona doswietlona jasniejsza) + kamyk;
 *  - P1  35 tri — kaktus z ramieniem i kolcami-akcentami + maly kaktusik
 *                 + kamyk (ciemna zielen mocno odcina od piasku);
 *  - P2  33 tri — skalki piaskowca: 2+1 plaskie bloki nawarstwione
 *                 (rude pasy sedymentacyjne) + sucha trawka;
 *  - P3  28 tri — bielona czaszka z rogami + 3 zebra lukiem + kamyk.
 *  Wszystkie <=40 tri/heks; DEKOR_PUSTYNIA_UDZIAL_PUSTYCH = 45% heksow
 *  calkiem pustych => srednio ~17 tri/heks pustyni. castShadow=false,
 *  wysokosc <=0.06, elementy na pierscieniu r 0.28-0.55 (footprint <=0.75),
 *  LOD 0-1 (flaga terrainDetailInst, jak dekor lak).
 *
 * RZADKOSC / DETERMINIZM / ZERO ZMIAN HASHA MAPY:
 *  - ta sama arytmetyka co mapRenderStyle.hash2D (imul/xorshift);
 *  - NOWE sole: 1301 (obecnosc), 1307 (wariant), 1313 (rotacja),
 *    1319 (rotacja oazy) — wolne: nie koliduja z 1201/1207/1213 (dekor lak),
 *    4/6/911/613/400/500 (gory/wzgorza) ani 1/5/8/9/11-14/889 (mapRenderStyle);
 *  - zadnego Math.random; generator mapy / save NIETKNIETE.
 *
 * JAK WPIAC (drzewo kanoniczne gra/src):
 *  1. Plik skopiowac do gra/src/render/oaza-pustynia.ts.
 *  2. OAZA — render/scene.ts ~:2004 (galaz useStyledDecor):
 *       const oasis = buildOaza();
 *       oasis.position.set(x, baseY, z);
 *       oasis.rotation.y = rotacjaOazy(q, r, map.seed);
 *       styledOverlays.push({ group: oasis, hexKey }); scene.add(oasis);
 *     (rnd() dalej konsumowane jak dzis — stan LCG bez zmian; palmCount
 *      mozna zignorowac, model ma stala kompozycje 3 palm).
 *  3. DEKOR — render/scene.ts, blok dekorGroup (~:1491): dodac 4 InstancedMesh
 *     z dekorPustyniaGeometria(w) + DEKOR_PUSTYNIA_MATERIAL do TEJ SAMEJ
 *     dekorGroup; w petli heksow (~:1688) dodac galaz:
 *       t === TerenBazowy.Pustynia => const w = dekorPustyniDlaHeksa(q,r,seed);
 *       if (w !== null) instancja z rotacjaDekoruPustyni(q,r,seed);
 *     UWAGA: DEKOR_ENABLED (scene.ts:1478) jest dzis false — wlaczyc.
 *     Stara wydme buildStyleDune na heksach z dekorem najlepiej wylaczyc
 *     (albo calkiem wycofac — P0 przejmuje role wydm).
 *  4. LOD/fog: jak dekor lak — grupa pod terrainDetailInst (poziomy 0-1),
 *     hideInstancedOnHex na heksie miasta/ulepszenia.
 *
 * KONWENCJE (zgodne z ulepszenia-modele-p2.ts / dekor-laki-rowniny.ts):
 *  - spod modelu na y=0 (wierzch pryzmu heksa), wspolrzedne w HEX_R=1,
 *  - obrot calosci = rotation.y (snap 60 stopni z rotacja*()).
 */
import * as THREE from 'three';

// ===========================================================================
// CZESC A — OAZA (klockowa, styl serii ulepszen: Group + MeshLambert)
// ===========================================================================

function mat(c: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color: c, flatShading: true });
}

/** Klocek jak w ulepszenia-modele-p2.ts: srodek (cx,cy,cz) + opcjonalny obrot. */
function B(
  g: THREE.Object3D, w: number, h: number, d: number,
  cx: number, cy: number, cz: number, m: THREE.Material,
  rx = 0, ry = 0, rz = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(cx, cy, cz);
  if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  g.add(mesh);
  return mesh;
}

/** Paleta oazy (tlo piasku 0xe0c88e). */
const OAZA = {
  wodaGlebia: 0x1f97b0,   // ciemny turkus (dolna, wieksza tafla)
  wodaPlycizna: 0x45d4e0, // jasny turkus (gorna, mniejsza tafla)
  mokryPiasek: 0xc4a875,  // rant wilgotnego piasku wokol wody
  pienA: 0x9a6a3f,        // pasiak pnia — jasniejszy segment
  pienB: 0x855832,        // pasiak pnia — ciemniejszy segment
  liscJ: 0x55b84a,        // lisc jasny (gorne platy)
  liscC: 0x3d9440,        // lisc ciemny (dolne platy)
  krzakJ: 0x5cae45,
  krzakC: 0x448c3a,
  glaz: 0xaaa596,
} as const;

/** Nieregularne promienie tafli (8 katow) — "klockowy" wielokat stawu. */
const STAW_R: readonly number[] = [0.36, 0.29, 0.40, 0.33, 0.26, 0.38, 0.30, 0.34];

/** Plaska nieregularna tafla — fan 8 tri (bez dna), normalna w gore. */
function tafla(skala: number, y: number, kolor: number, jitterFaza: number): THREE.Mesh {
  const pos: number[] = [];
  const n = STAW_R.length;
  const pt = (i: number): [number, number] => {
    const a = jitterFaza + (i % n) * (Math.PI * 2 / n);
    const r = STAW_R[i % n]! * skala;
    return [Math.sin(a) * r, Math.cos(a) * r];
  };
  for (let i = 0; i < n; i++) {
    const [ax, az] = pt(i);
    const [bx, bz] = pt(i + 1);
    // kolejnosc CCW patrzac z gory (+y): srodek -> b -> a
    pos.push(0, 0, 0, bx, 0, bz, ax, 0, az);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat(kolor));
  mesh.position.y = y;
  mesh.receiveShadow = true;
  return mesh;
}

/** Deterministyczny jitter lisci palm (bez Math.random). */
const PALMA_JIT: readonly number[] = [0.0, 0.22, -0.15, 0.3, -0.26, 0.12, -0.08, 0.18];

interface PalmaOpts {
  segmenty?: number;      // 2-3 klocki pnia
  liscie?: number;        // 4-5 platow korony
  hSeg?: number;          // wysokosc jednego segmentu pnia
  lean?: [number, number]; // kierunek pochylenia (znormalizowany w srodku)
  leanAmp?: number;       // calkowite wychylenie czubka (jedn. swiata)
  yaw?: number;           // azymut startowy wachlarza lisci
  skala?: number;
}

/** Palma: pochylony pien segmentowy (pasiak) + korona klockowych lisci-platow. */
function palma(g: THREE.Object3D, px: number, pz: number, o: PalmaOpts): void {
  const seg = o.segmenty ?? 3, nLisci = o.liscie ?? 5, s = o.skala ?? 1;
  const hSeg = (o.hSeg ?? 0.145) * s, amp = (o.leanAmp ?? 0.16) * s;
  const [ldx0, ldz0] = o.lean ?? [1, 0];
  const ll = Math.max(1e-6, Math.hypot(ldx0, ldz0));
  const ux = ldx0 / ll, uz = ldz0 / ll;
  const yaw = o.yaw ?? 0;
  let topX = px, topY = 0, topZ = pz;
  for (let i = 0; i < seg; i++) {
    const t = seg === 1 ? 1 : i / (seg - 1);
    const off = amp * Math.pow(t, 1.4);
    const grubosc = (0.075 - 0.013 * i) * s;
    const cy = (i + 0.5) * hSeg * 0.94;
    const ang = 0.30 * amp / 0.16 * ((i + 1) / seg); // narastajace pochylenie klocka
    B(g, grubosc, hSeg, grubosc,
      px + ux * off, cy, pz + uz * off,
      mat(i % 2 === 0 ? OAZA.pienA : OAZA.pienB),
      uz * ang, 0, -ux * ang);
    topX = px + ux * off; topY = cy + hSeg * 0.5; topZ = pz + uz * off;
  }
  // korona: platy wachlarzowo, opadajace na zewnatrz
  const liscM = [mat(OAZA.liscJ), mat(OAZA.liscC)];
  for (let i = 0; i < nLisci; i++) {
    const fi = yaw + i * (Math.PI * 2 / nLisci) + PALMA_JIT[i % PALMA_JIT.length]!;
    const opad = 0.55 + PALMA_JIT[(i + 3) % PALMA_JIT.length]! * 0.5;
    const dl = 0.30 * s, szer = 0.10 * s;
    const cx = topX + Math.cos(fi) * dl * 0.48 * Math.cos(opad);
    const cz = topZ - Math.sin(fi) * dl * 0.48 * Math.cos(opad);
    const cy = topY + 0.022 - dl * 0.48 * Math.sin(opad) * 0.50;
    B(g, dl, 0.016 * s, szer, cx, cy, cz, liscM[i % 2]!, 0, fi, -opad * 0.8);
  }
}

/** Krzaczek pierscienia zieleni — splaszczony box (12 tri). */
function krzak(g: THREE.Object3D, cx: number, cz: number, sk: number, ciemny: boolean, ry: number): void {
  B(g, 0.16 * sk, 0.055 * sk, 0.13 * sk, cx, 0.024 * sk, cz,
    mat(ciemny ? OAZA.krzakC : OAZA.krzakJ), 0, ry, 0);
}

/**
 * OAZA — klockowy staw (woda przesunieta od srodka) + 3 pochylone palmy
 * + pierscien zieleni + 2 glazy. 348 tri. Spod y=0, HEX_R=1, footprint r<=0.80.
 */
export function buildOaza(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'oaza';

  // — staw przesuniety od srodka heksa (naturalnosc)
  const W = new THREE.Group();
  W.position.set(-0.14, 0, 0.10);
  W.add(tafla(1.30, 0.006, OAZA.mokryPiasek, 0.20)); // rant mokrego piasku
  W.add(tafla(1.00, 0.016, OAZA.wodaGlebia, 0.0));   // glebia
  W.add(tafla(0.60, 0.026, OAZA.wodaPlycizna, 0.55)); // plycizna (jasny turkus)
  g.add(W);

  // — 3 palmy pochylone NAD wode
  palma(g, 0.34, -0.22, { segmenty: 3, liscie: 5, lean: [-0.8, 0.55], leanAmp: 0.17, yaw: 0.3 });
  palma(g, -0.52, -0.18, { segmenty: 3, liscie: 4, lean: [0.7, 0.75], leanAmp: 0.15, yaw: 1.4, skala: 0.92 });
  palma(g, 0.06, 0.58, { segmenty: 2, liscie: 4, lean: [-0.25, -1.0], leanAmp: 0.05, yaw: 2.2, skala: 0.88 });

  // — pierscien soczystej zieleni wokol wody (kontrast z piaskiem)
  krzak(g, 0.28, 0.24, 1.0, false, 0.4);
  krzak(g, 0.20, -0.34, 0.85, true, 1.2);
  krzak(g, -0.50, 0.30, 0.9, false, 2.1);
  krzak(g, -0.16, -0.40, 0.8, true, 2.9);

  // — 2 glazy
  B(g, 0.11, 0.085, 0.13, 0.55, 0.026, 0.30, mat(OAZA.glaz), 0.55, 0.6, 0.35);
  B(g, 0.075, 0.06, 0.08, -0.30, 0.016, 0.62, mat(OAZA.glaz), 0.45, 1.9, 0.4);

  return g;
}

// ===========================================================================
// CZESC B — MIKRODEKOR PUSTYNI (wzorzec dekor-laki-rowniny.ts: zmergowane
// BufferGeometry non-indexed + vertex colors + JEDEN material + hash z solami)
// ===========================================================================

// ---------------------------------------------------------------------------
// Stale eksportowane (gestosc / LOD / gabaryty) — jak w dekorze lak/rownin
// ---------------------------------------------------------------------------

/** Liczba wariantow mikrodekoru pustyni. */
export const DEKOR_PUSTYNIA_LICZBA_WARIANTOW = 4;

/** Udzial heksow pustyni CALKIEM PUSTYCH (bez dekoru). */
export const DEKOR_PUSTYNIA_UDZIAL_PUSTYCH = 0.45;

/** Maksymalna wysokosc elementu nad wierzchem heksa. */
export const DEKOR_PUSTYNIA_MAX_WYSOKOSC = 0.06;

/** Maksymalny zasieg dekoru od srodka heksa. */
export const DEKOR_PUSTYNIA_FOOTPRINT_R = 0.75;

/** Najwyzszy poziom ZoomLodLevel z widocznym dekorem (0-1 = terrainDetailInst). */
export const DEKOR_PUSTYNIA_LOD_MAX_POZIOM = 1;

// ---------------------------------------------------------------------------
// Deterministyczny hash per heks — TA SAMA arytmetyka co mapRenderStyle.hash2D
// (czysto renderowy; generator mapy nietkniety). NOWE sole 1301/1307/1313/1319
// (wolne: dekor lak ma 1201/1207/1213; gory 4/6/911/613/400/500;
//  mapRenderStyle 1/5/8/9/11-14/889).
// ---------------------------------------------------------------------------

export const SALT_PUSTYNIA_OBECNOSC = 1301;
export const SALT_PUSTYNIA_WARIANT = 1307;
export const SALT_PUSTYNIA_ROTACJA = 1313;
export const SALT_OAZA_ROTACJA = 1319;

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
 * Mikrodekor dla heksa pustyni (q,r): null = heks CALKIEM PUSTY (~45%),
 * inaczej deterministyczny wariant 0..3.
 */
export function dekorPustyniDlaHeksa(q: number, r: number, seed = 0): number | null {
  if (hashHeksa(q, r, seed, SALT_PUSTYNIA_OBECNOSC) < DEKOR_PUSTYNIA_UDZIAL_PUSTYCH) return null;
  return Math.floor(hashHeksa(q, r, seed, SALT_PUSTYNIA_WARIANT) * DEKOR_PUSTYNIA_LICZBA_WARIANTOW);
}

/** Deterministyczna rotacja dekoru pustyni — wielokrotnosc 60 stopni. */
export function rotacjaDekoruPustyni(q: number, r: number, seed = 0): number {
  return Math.floor(hashHeksa(q, r, seed, SALT_PUSTYNIA_ROTACJA) * 6) * (Math.PI / 3);
}

/** Deterministyczna rotacja OAZY (wariant osadzenia hash-based, sol 1319). */
export function rotacjaOazy(q: number, r: number, seed = 0): number {
  return Math.floor(hashHeksa(q, r, seed, SALT_OAZA_ROTACJA) * 6) * (Math.PI / 3);
}

// ---------------------------------------------------------------------------
// Paleta dekoru (wypieczona w vertex colors) — kontrast do wierzchu pryzmu
// pustyni 0xe0c88e: wydmy jasniejsze/cieplejsze od tla, kaktus ciemnozielony,
// piaskowiec rudy, kosci bielone.
// ---------------------------------------------------------------------------

const WYDMA_JASNA = 0xdcbf7c;   // strona doswietlona fali
const WYDMA_CIEN = 0xa98851;    // strona zawietrzna
const KAKTUS_KORPUS = 0x3f8a3e; // ciemna zielen (mocny kontrast z piaskiem)
const KAKTUS_TOP = 0x54a74c;    // jasniejszy szczyt/ramie
const KAKTUS_KOLEC = 0xf5eecb;  // kolce-akcenty (jasne)
const PIASKOWIEC_C = 0xb87c46;  // dolna warstwa (ciemny rudy)
const PIASKOWIEC_S = 0xcf9257;  // srednia
const PIASKOWIEC_J = 0xd49a5c;  // gorna (jasna)
const KOSC_BIAL = 0xf2ecdc;     // bielone kosci
const KOSC_CIEN = 0xd8cfba;
const KAMYK_PUST_A = 0xb5a687;  // cieple kamyki pustyni
const KAMYK_PUST_B = 0x9c8d72;
const TRAWA_SUCHA_C = 0xb89c52; // sucha kepka trawy
const TRAWA_SUCHA_J = 0xf0e0a0;

// ---------------------------------------------------------------------------
// Emiter geometrii (non-indexed, kolor per wierzcholek, bez den) — jak wzorzec
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

/** Obrot w plaszczyznie XZ (zgodny z rotation.y). */
function rot2(x: number, z: number, yaw: number): [number, number] {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [x * c + z * s, z * c - x * s];
}

// ---------------------------------------------------------------------------
// Prymitywy: ostrze 3, kamyk 5, okta 8 (jak wzorzec) + wydmka 6, slupek4 10,
// slupek3 7, czaszka 14 — wszystkie ze spodem wtopionym w heks (bez dna)
// ---------------------------------------------------------------------------

interface OstrzeOpts {
  h: number; r: number; yaw?: number; splasz?: number;
  tiltX?: number; tiltZ?: number; col: number;
}

/** Ostrze trawy / kolec / zebro — splaszczony 3-boczny klinek = 3 tri. */
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

/** Splaszczony oktaedr (4-boczna bipiramida, opcjonalnie wydluzony sx) = 8 tri. */
function okta(P: Parts, cx: number, cy: number, cz: number,
  o: { r: number; hGora: number; hDol: number; yaw?: number; sx?: number; col: number }): void {
  const yaw = o.yaw ?? 0, sx = o.sx ?? 1;
  const col = rgb(o.col);
  const eq: V3[] = [];
  for (let i = 0; i < 4; i++) {
    const a = yaw + i * (Math.PI / 2);
    eq.push([cx + o.r * Math.sin(a) * sx, cy, cz + o.r * Math.cos(a)]);
  }
  const T: V3 = [cx, cy + o.hGora, cz];
  const Bt: V3 = [cx, cy - o.hDol, cz];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    const e0 = eq[i]!, e1 = eq[j]!;
    const ref: V3 = [(e0[0] + e1[0]) / 2 - cx, 0.30, (e0[2] + e1[2]) / 2 - cz];
    const refD: V3 = [ref[0], -0.30, ref[2]];
    pushTri(P, e0, e1, T, col, ref);
    pushTri(P, e0, e1, Bt, col, refD);
  }
}

/**
 * Wydmka — niski luk-nasyp fali piasku: podstawa-romb + asymetryczna kalenica
 * (strona +sz doswietlona jasna, -sz zawietrzna ciemna/stroma) = 6 tri.
 */
function wydmka(P: Parts, cx: number, cz: number,
  o: { dl: number; sz: number; h: number; yaw?: number }): void {
  const yaw = o.yaw ?? 0;
  const cJ = rgb(WYDMA_JASNA), cC = rgb(WYDMA_CIEN);
  const p = (dx: number, dz: number, y: number): V3 => {
    const [wx, wz] = rot2(dx, dz, yaw);
    return [cx + wx, y, cz + wz];
  };
  const R1 = p(-o.dl, o.sz, -0.004), R2 = p(o.dl, o.sz, -0.004);
  const R3 = p(o.dl, -o.sz, -0.004), R4 = p(-o.dl, -o.sz, -0.004);
  const K1 = p(-o.dl * 0.55, -o.sz * 0.40, o.h);
  const K2 = p(o.dl * 0.58, -o.sz * 0.34, o.h * 0.62);
  const refG: V3 = [0, 1, 0];
  pushTri(P, R1, R2, K2, cJ, refG); // stok doswietlony (lagodny)
  pushTri(P, R1, K2, K1, cJ, refG);
  pushTri(P, R4, K1, K2, cC, refG); // stok zawietrzny (stromy)
  pushTri(P, R4, K2, R3, cC, refG);
  pushTri(P, R1, K1, R4, cC, refG); // koniec zachodni
  pushTri(P, R2, R3, K2, cJ, refG); // koniec wschodni
}

/** Slupek 4-boczny zwezany, bez dna, z plaskim topem = 10 tri (blok/kaktus). */
function slupek4(P: Parts, cx: number, cz: number,
  o: { rDol: number; rGora: number; h: number; y0?: number; yaw?: number;
       colBok: number; colTop: number; sx?: number }): void {
  const yaw = o.yaw ?? 0, y0 = o.y0 ?? -0.006, sx = o.sx ?? 1;
  const cB = rgb(o.colBok), cT = rgb(o.colTop);
  const pt = (r: number, y: number, i: number): V3 => {
    const a = yaw + Math.PI / 4 + i * (Math.PI / 2);
    return [cx + r * Math.sin(a) * sx, y, cz + r * Math.cos(a)];
  };
  const dol: V3[] = [], gora: V3[] = [];
  for (let i = 0; i < 4; i++) { dol.push(pt(o.rDol, y0, i)); gora.push(pt(o.rGora, o.h, i)); }
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    const ref: V3 = [(dol[i]![0] + dol[j]![0]) / 2 - cx, 0.15, (dol[i]![2] + dol[j]![2]) / 2 - cz];
    pushTri(P, dol[i]!, dol[j]!, gora[j]!, cB, ref);
    pushTri(P, dol[i]!, gora[j]!, gora[i]!, cB, ref);
  }
  const refT: V3 = [0, 1, 0];
  pushTri(P, gora[0]!, gora[1]!, gora[2]!, cT, refT);
  pushTri(P, gora[0]!, gora[2]!, gora[3]!, cT, refT);
}

/** Slupek 3-boczny (ramie kaktusa / maly kaktusik) = 7 tri. */
function slupek3(P: Parts, cx: number, cz: number,
  o: { r: number; h: number; y0?: number; yaw?: number; colBok: number; colTop: number }): void {
  const yaw = o.yaw ?? 0, y0 = o.y0 ?? -0.006;
  const cB = rgb(o.colBok), cT = rgb(o.colTop);
  const pt = (y: number, i: number, r: number): V3 => {
    const a = yaw + i * (Math.PI * 2 / 3);
    return [cx + r * Math.sin(a), y, cz + r * Math.cos(a)];
  };
  const dol: V3[] = [], gora: V3[] = [];
  for (let i = 0; i < 3; i++) { dol.push(pt(y0, i, o.r)); gora.push(pt(o.h, i, o.r * 0.8)); }
  for (let i = 0; i < 3; i++) {
    const j = (i + 1) % 3;
    const ref: V3 = [(dol[i]![0] + dol[j]![0]) / 2 - cx, 0.15, (dol[i]![2] + dol[j]![2]) / 2 - cz];
    pushTri(P, dol[i]!, dol[j]!, gora[j]!, cB, ref);
    pushTri(P, dol[i]!, gora[j]!, gora[i]!, cB, ref);
  }
  pushTri(P, gora[0]!, gora[1]!, gora[2]!, cT, [0, 1, 0]);
}

/** Bielona czaszka z rogami — splaszczona okta (8) + 2 rogi-ostrza (6) = 14 tri. */
function czaszka(P: Parts, cx: number, cz: number, o: { yaw?: number }): void {
  const yaw = o.yaw ?? 0;
  okta(P, cx, 0.022, cz, { r: 0.082, hGora: 0.026, hDol: 0.026, yaw, sx: 1.3, col: KOSC_BIAL });
  for (const strona of [-1, 1]) {
    const [rx, rz] = rot2(strona * 0.092, 0.016, yaw);
    ostrze(P, cx + rx, cz + rz, {
      h: 0.042, r: 0.023, splasz: 0.7, yaw: yaw + strona * 0.5,
      tiltX: Math.cos(yaw) * strona * 0.052, tiltZ: -Math.sin(yaw) * strona * 0.052,
      col: KOSC_CIEN,
    });
  }
}

// ---------------------------------------------------------------------------
// PUSTYNIA — 4 kompozycje (elementy na pierscieniu r 0.28-0.55, srodek czysty)
// ---------------------------------------------------------------------------

function czesciDekoruPustyni(w: number): Parts {
  const P: Parts = { pos: [], col: [] };
  if (w === 0) {
    // P0 — fale wydm: 3 rownolegle luki-nasypy (wiatr z 1 kierunku) + kamyk (23 tri)
    wydmka(P, 0.10, 0.42, { dl: 0.36, sz: 0.10, h: 0.030, yaw: 0.45 });
    wydmka(P, -0.40, -0.14, { dl: 0.29, sz: 0.088, h: 0.025, yaw: 0.60 });
    wydmka(P, 0.30, -0.38, { dl: 0.22, sz: 0.072, h: 0.020, yaw: 0.35 });
    kamyk(P, -0.12, 0.20, { r: 0.045, h: 0.018, yaw: 1.3, col: KAMYK_PUST_B });
  } else if (w === 1) {
    // P1 — kaktus z ramieniem i kolcami + maly kaktusik + kamyk (38 tri)
    slupek4(P, 0.32, -0.26, { rDol: 0.095, rGora: 0.078, h: 0.058, yaw: 0.3, sx: 1.1, colBok: KAKTUS_KORPUS, colTop: KAKTUS_TOP });
    slupek3(P, 0.45, -0.12, { r: 0.052, h: 0.044, y0: 0.006, yaw: 1.1, colBok: KAKTUS_KORPUS, colTop: KAKTUS_TOP });
    ostrze(P, 0.24, -0.34, { h: 0.034, r: 0.012, splasz: 0.8, yaw: 0.2, tiltX: -0.020, tiltZ: -0.014, col: KAKTUS_KOLEC });
    ostrze(P, 0.39, -0.32, { h: 0.032, r: 0.012, splasz: 0.8, yaw: 2.1, tiltX: 0.018, tiltZ: -0.012, col: KAKTUS_KOLEC });
    slupek3(P, -0.40, 0.30, { r: 0.058, h: 0.040, yaw: 0.8, colBok: KAKTUS_KORPUS, colTop: KAKTUS_TOP });
    kamyk(P, -0.10, -0.44, { r: 0.072, h: 0.026, yaw: 3.1, col: KAMYK_PUST_A });
  } else if (w === 2) {
    // P2 — skalki piaskowca: 2+1 plaskie bloki nawarstwione + sucha trawka (33 tri)
    slupek4(P, -0.30, -0.28, { rDol: 0.150, rGora: 0.126, h: 0.034, yaw: 0.5, sx: 1.35, colBok: PIASKOWIEC_C, colTop: PIASKOWIEC_S });
    slupek4(P, -0.28, -0.26, { rDol: 0.088, rGora: 0.062, h: 0.024, y0: 0.032, yaw: 0.75, sx: 1.3, colBok: PIASKOWIEC_S, colTop: PIASKOWIEC_J });
    slupek4(P, 0.42, 0.24, { rDol: 0.092, rGora: 0.072, h: 0.030, yaw: 1.6, sx: 1.25, colBok: PIASKOWIEC_C, colTop: PIASKOWIEC_J });
    ostrze(P, -0.14, 0.40, { h: 0.040, r: 0.038, yaw: 0.9, tiltX: 0.024, col: TRAWA_SUCHA_C });
  } else {
    // P3 — bielona czaszka z rogami + 3 zebra lukiem + kamyk (28 tri)
    czaszka(P, 0.30, 0.34, { yaw: 0.7 });
    ostrze(P, -0.32, -0.16, { h: 0.048, r: 0.028, splasz: 0.5, yaw: 0.4, tiltX: 0.046, tiltZ: 0.024, col: KOSC_BIAL });
    ostrze(P, -0.42, -0.28, { h: 0.040, r: 0.024, splasz: 0.5, yaw: 0.5, tiltX: 0.040, tiltZ: 0.020, col: KOSC_CIEN });
    ostrze(P, -0.24, -0.04, { h: 0.035, r: 0.021, splasz: 0.5, yaw: 0.3, tiltX: 0.035, tiltZ: 0.018, col: KOSC_BIAL });
    kamyk(P, 0.06, -0.44, { r: 0.066, h: 0.024, yaw: 2.4, col: KAMYK_PUST_B });
  }
  return P;
}

// ---------------------------------------------------------------------------
// Geometrie wspoldzielone (cache) + material wspolny + buildery — jak wzorzec
// ---------------------------------------------------------------------------

function zbudujGeometrie(P: Parts, nazwa: string): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P.pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(P.col, 3));
  g.computeVertexNormals(); // non-indexed => plaskie normalne per scianka
  g.name = nazwa;
  return g;
}

const cachePustynia: Array<THREE.BufferGeometry | null> = [null, null, null, null];

/** Wspoldzielona geometria dekoru pustyni (1 na wariant — pod InstancedMesh). */
export function dekorPustyniaGeometria(wariant: number): THREE.BufferGeometry {
  const w = ((wariant | 0) % 4 + 4) % 4;
  if (!cachePustynia[w]) cachePustynia[w] = zbudujGeometrie(czesciDekoruPustyni(w), `dekor-pustynia-p${w}`);
  return cachePustynia[w]!;
}

/** JEDEN material mikrodekoru pustyni (kolory w vertex colors) => 4 draw calle.
 *  (Mozna tez wspoldzielic DEKOR_MATERIAL z dekor-laki-rowniny — identyczny.) */
export const DEKOR_PUSTYNIA_MATERIAL = new THREE.MeshLambertMaterial({
  vertexColors: true,
  flatShading: true,
});

/** Wygodny mesh dekoru pustyni (geometria z cache). Spod y=0, BEZ cienia (perf). */
export function buildDekorPustynia(wariant: number): THREE.Mesh {
  const m = new THREE.Mesh(dekorPustyniaGeometria(wariant), DEKOR_PUSTYNIA_MATERIAL);
  m.castShadow = false;
  m.receiveShadow = true;
  m.name = `dekor-pustynia-p${((wariant | 0) % 4 + 4) % 4}`;
  return m;
}

/** Liczba trojkatow wariantu (diagnostyka/testy). */
export function trojkatyDekoruPustyni(wariant: number): number {
  return dekorPustyniaGeometria(wariant).getAttribute('position').count / 3;
}
