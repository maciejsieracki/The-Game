'use strict';
/**
 * granice-styk-nakladanie-test.cjs — R-GRANICE-STYK-CZYTELNOSC-Q1 = B (Maciej, 2026-08-14).
 *
 * ZGŁOSZENIE (nota N4 Evaluatora do `bf839f81`): pas tożsamościowy granicy był rysowany NA
 * ZEWNĄTRZ własnego terytorium. Sąsiadujące terytoria dzielą tę SAMĄ polilinię obwodu (heksy
 * stykają się krawędzią, między nimi nie ma żadnej szczeliny), więc pas jednej cywilizacji
 * lądował dokładnie na ziemi drugiej i konkurował tam z jej pasami. Materiały mają
 * `depthWrite: false`, więc to NIE był z-fighting, tylko deterministyczne przesłanianie
 * zależne od kolejności sortowania przezroczystości — czyli od położenia kamery. Skutek
 * zmierzony przez Evaluatora na pikselach: fiolet Hetytów na styku niewidoczny w ogóle.
 *
 * DECYZJA B: przesunąć geometrię tak, żeby pasy sąsiadów się nie przykrywały. Wykonanie:
 * CAŁY pas granicy (tożsamość + relacja) leży po WŁASNEJ stronie linii granicy —
 * tożsamość [0 … 0,45] w głąb terytorium, relacja [0,45 … 0,675]. Szerokości i proporcja
 * 2:1 bez zmian; zmieniła się wyłącznie strona.
 *
 * RUNDA 2 (`R-GRANICE-STYK-CZYTELNOSC-Q1` = B, po werdykcie FAIL Evaluatora do `4de64fa8`):
 * runda 1 wyznaczała stronę „na zewnątrz" przez porównanie ze ŚRODKIEM pętli, co jest poprawne
 * tylko dla kształtów WYPUKŁYCH — a wszystkie fixture'y sekcji 1–3 akurat takie są (bloki 2×3
 * → 0/18 odwróconych normalnych, kolumny 2-heksowe → 0/10), więc ten plik nie mógł tej klasy
 * błędu złapać. Stąd sekcje 4–6: kształty NIEWYPUKŁE, terytorium z ENKLAWĄ i pomiar
 * POWIERZCHNI pasa przy linii granicy (a nie obecności wierzchołka).
 *
 * PUNKTY ODNIESIENIA — wszystkie zmierzone `tools/granice-pas-pomiar.cjs` (to samo narzędzie,
 * ta sama rasteryzacja krokiem 0,01 j) na trzech wersjach kodu: PRZED tematem (`4de64fa8^`),
 * RUNDA 1 (`4de64fa8`), RUNDA 2 (dziś). Pas tożsamości poza własnym terytorium [j²]:
 *   kształt        PRZED     RUNDA 1   RUNDA 2
 *   blok 2×3       6,7495    0,0000    0,0000
 *   rząd 1×3       4,2119    0,9844    0,0000
 *   rząd 1×4       4,4916    1,9683    0,0000
 *   L-kształt      6,3882    0,4272    0,0000
 *   podkowa        7,4317    1,7703    0,0000
 *   pierścień      6,7377    1,5013    0,0000   ← farba w ENKLAWIE (nota N3)
 * Szczelina między linią granicy a POWIERZCHNIĄ pasa [j]: RUNDA 1 0,1360–0,3995 → RUNDA 2 0.
 * Nakładanie pasów RÓŻNYCH właścicieli na styku dwóch bloków 2×3: 2,2024 → 0,0000 j².
 * Liczby z rasteryzacji mają rozdzielczość ±0,002 j², dlatego progi niżej są zapisane
 * z zapasem, a nie jako równości.
 *
 * SPRAWDZONE MUTACYJNIE (runda 2, mutacje wykonane na dysku i cofnięte):
 *   - przywrócenie heurystyki centroidu → 41 pass / 16 fail; wszystkie 16 porażek w sekcjach
 *     4 i 5, sekcje 1–3 nadal zielone (dowód, że stary zestaw fixture'ów był ślepy);
 *   - zewnętrzna krawędź pasa cofnięta o 0,25·szerokości (odpowiednik starego ścięcia naroża)
 *     → 52 pass / 5 fail, w tym 3 porażki sekcji 6 przy szczelinie 0,1390 j.
 *
 * Uruchamianie z katalogu gra/: node tools/granice-styk-nakladanie-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.granice-styk-entry.ts');
const BUNDLE = path.join(__dirname, '.granice-styk-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  buildTerritoryBorderGroup,
  TERRITORY_BORDER_BAND_WIDTH,
  TERRITORY_RELATION_BAND_WIDTH,
  TERRITORY_BORDER_OPACITY,
} from '../src/render/rangeOverlay';
export { computeTerritoryBorderLoops } from '../src/map/territory-border';
export { HEX_R, axialToWorld } from '../src/render/hexutil';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  loader: { '.ts': 'ts', '.json': 'json' },
  external: ['three'], // jak granice-relacja-dyplomatyczna-test.cjs
  logLevel: 'silent',
});

const M = require(BUNDLE);
const { HEX_R, axialToWorld } = M;
const BAND = M.TERRITORY_BORDER_BAND_WIDTH;
const RELATION = M.TERRITORY_RELATION_BAND_WIDTH;
const INRADIUS = HEX_R * Math.sqrt(3) / 2;

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  OK', msg); }
  else { fail++; console.error('FAIL:', msg); }
}

console.log('granice-styk-nakladanie-test (R-GRANICE-STYK-CZYTELNOSC-Q1 = B)\n');

// ─────────────────────────────────────────────────────────────────────────────
// Narzędzia: rasteryzacja prawdziwej geometrii meshy (test punkt-w-trójkącie)
// ─────────────────────────────────────────────────────────────────────────────
const STEP = 0.01;
const CELL = STEP * STEP;

function meshTriangles(mesh) {
  const pos = mesh.geometry.getAttribute('position').array;
  const idx = mesh.geometry.getIndex().array;
  const out = [];
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3;
    const b = idx[i + 1] * 3;
    const c = idx[i + 2] * 3;
    out.push([pos[a], pos[a + 2], pos[b], pos[b + 2], pos[c], pos[c + 2]]);
  }
  return out;
}
function pointInTriangle(px, pz, t) {
  const [ax, az, bx, bz, cx, cz] = t;
  const d1 = (px - bx) * (az - bz) - (ax - bx) * (pz - bz);
  const d2 = (px - cx) * (bz - cz) - (bx - cx) * (pz - cz);
  const d3 = (px - ax) * (cz - az) - (cx - ax) * (pz - az);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

/** Rasteryzuje wszystkie meshe grupy na wspólnej siatce; zwraca maski pokrycia per mesh. */
function rasterize(group) {
  const tris = new Map();
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const child of group.children) {
    const t = meshTriangles(child);
    tris.set(child.name, t);
    for (const tt of t) {
      for (let k = 0; k < 6; k += 2) {
        if (tt[k] < minX) minX = tt[k];
        if (tt[k] > maxX) maxX = tt[k];
        if (tt[k + 1] < minZ) minZ = tt[k + 1];
        if (tt[k + 1] > maxZ) maxZ = tt[k + 1];
      }
    }
  }
  minX -= STEP; maxX += STEP; minZ -= STEP; maxZ += STEP;
  const nx = Math.ceil((maxX - minX) / STEP);
  const nz = Math.ceil((maxZ - minZ) / STEP);
  const masks = new Map();
  for (const [name, t] of tris) {
    const buf = new Uint8Array(nx * nz);
    for (const tt of t) {
      const ix0 = Math.max(0, Math.floor((Math.min(tt[0], tt[2], tt[4]) - minX) / STEP));
      const ix1 = Math.min(nx - 1, Math.ceil((Math.max(tt[0], tt[2], tt[4]) - minX) / STEP));
      const iz0 = Math.max(0, Math.floor((Math.min(tt[1], tt[3], tt[5]) - minZ) / STEP));
      const iz1 = Math.min(nz - 1, Math.ceil((Math.max(tt[1], tt[3], tt[5]) - minZ) / STEP));
      for (let ix = ix0; ix <= ix1; ix++) {
        const px = minX + (ix + 0.5) * STEP;
        for (let iz = iz0; iz <= iz1; iz++) {
          if (pointInTriangle(px, minZ + (iz + 0.5) * STEP, tt)) buf[iz * nx + ix] = 1;
        }
      }
    }
    masks.set(name, buf);
  }
  return { masks, nx, nz, minX, minZ };
}
function maskArea(mask) {
  let s = 0;
  for (let i = 0; i < mask.length; i++) s += mask[i];
  return s * CELL;
}
function maskOverlap(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) if (a[i] && b[i]) s++;
  return s * CELL;
}

/**
 * Właściciel heksa pod punktem; -1 = ziemia niczyja.
 *
 * DOKŁADNY test punkt-w-sześciokącie (6 półpłaszczyzn na inradiusie), nie „bliżej niż HEX_R
 * od środka" — nota N8 Evaluatora do `4de64fa8`: heks sięga tylko do inradiusu 0,866 j, więc
 * próg HEX_R = 1,0 przepuszczał do 0,134 j wycieku POZA linię granicy jako „na własnych
 * heksach", mimo że asercja mówi co innego. Woronoj po środkach też nie wystarcza: dla
 * terytoriów z dziurą punkt w enklawie ma najbliższy środek NALEŻĄCY do terytorium, więc
 * wychodziłby jako „własny", a to jest dokładnie przypadek z noty N3.
 * / EN: exact point-in-hexagon test (six half-planes at the inradius). A "within HEX_R of the
 * centre" test let up to 0.134 j of spill past the border line count as "inside", and a plain
 * Voronoi test would call a point inside an enclave "ours" because its nearest centre is ours.
 */
const HEX_EDGE_NORMALS = (() => {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const a1 = (Math.PI / 3) * i;
    const a2 = (Math.PI / 3) * ((i + 1) % 6);
    const mx = (Math.sin(a1) + Math.sin(a2)) / 2;
    const mz = (Math.cos(a1) + Math.cos(a2)) / 2;
    const l = Math.hypot(mx, mz);
    out.push({ nx: mx / l, nz: mz / l });
  }
  return out;
})();
function makeOwnerAt(ownerByKey) {
  const centers = [];
  for (const [key, owner] of ownerByKey) {
    const [q, r] = key.split(',').map(Number);
    const c = axialToWorld(q, r, HEX_R);
    centers.push({ x: c.x, z: c.z, owner });
  }
  return (px, pz) => {
    for (const c of centers) {
      const dx = px - c.x;
      const dz = pz - c.z;
      if (Math.hypot(dx, dz) > HEX_R + 1e-9) continue;
      let inHex = true;
      for (const n of HEX_EDGE_NORMALS) {
        if (dx * n.nx + dz * n.nz > INRADIUS + 1e-9) { inHex = false; break; }
      }
      if (inHex) return c.owner;
    }
    return -1;
  };
}
function areaOnOwner(mask, grid, ownerAt, who) {
  let s = 0;
  for (let iz = 0; iz < grid.nz; iz++) {
    for (let ix = 0; ix < grid.nx; ix++) {
      if (!mask[iz * grid.nx + ix]) continue;
      if (ownerAt(grid.minX + (ix + 0.5) * STEP, grid.minZ + (iz + 0.5) * STEP) === who) s++;
    }
  }
  return s * CELL;
}

function fakeMap(keys) {
  const hexes = {};
  for (const k of keys) hexes[k] = {};
  return { hexes };
}

const COLOR_A = 0x8b1a1a;   // Rzymianie (gracz)
const COLOR_B = 0x7b4b8a;   // Hetyci (AI) — kolor z pomiaru Evaluatora
const COLOR_WAR = 0xff5252;

// ─────────────────────────────────────────────────────────────────────────────
// 1. STYK DWÓCH TERYTORIÓW — pasy sąsiadów nie mogą się nakładać
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. Styk dwóch sąsiadujących terytoriów (rasteryzacja prawdziwej geometrii)');

// Dwa bloki 2x3 heksów stykające się bokiem — 6 wspólnych krawędzi granicy.
const keysA = new Set();
const keysB = new Set();
for (let r = 0; r < 3; r++) {
  const shift = Math.floor(r / 2);
  for (let q = 0; q <= 1; q++) keysA.add(`${q - shift},${r}`);
  for (let q = 2; q <= 3; q++) keysB.add(`${q - shift},${r}`);
}
const ownerByKey = new Map();
for (const k of keysA) ownerByKey.set(k, 0);
for (const k of keysB) ownerByKey.set(k, 3);

const group = M.buildTerritoryBorderGroup(
  fakeMap([...keysA, ...keysB]),
  new Map([[0, keysA], [3, keysB]]),
  (o) => (o === 0 ? COLOR_A : COLOR_B),
  BAND,
  M.TERRITORY_BORDER_OPACITY,
  (o) => (o === 0 ? COLOR_A : COLOR_WAR),
);
ok(group.children.length === 4, 'dwa terytoria → 4 pasy (tożsamość + relacja na właściciela)');

const grid = rasterize(group);
const ownerAt = makeOwnerAt(ownerByKey);
const nameA = 'territory-border-0';
const nameB = 'territory-border-3';
const relA = 'territory-relation-0';
const relB = 'territory-relation-3';
for (const n of [nameA, nameB, relA, relB]) {
  ok(grid.masks.has(n) && maskArea(grid.masks.get(n)) > 0.5, `${n}: pas ma niezerowe pole`);
}

// Punkt odniesienia sprzed naprawy: 2,2024 j². Wymagamy co najmniej 10× mniej.
const BEFORE_CROSS_OVERLAP = 2.2024;
let crossOverlap = 0;
for (const a of [nameA, relA]) {
  for (const b of [nameB, relB]) crossOverlap += maskOverlap(grid.masks.get(a), grid.masks.get(b));
}
ok(crossOverlap < BEFORE_CROSS_OVERLAP / 10,
  `nakładanie pasów RÓŻNYCH właścicieli ${crossOverlap.toFixed(4)} j² < ${(BEFORE_CROSS_OVERLAP / 10).toFixed(4)} `
  + `(przed naprawą ${BEFORE_CROSS_OVERLAP} j²)`);
ok(crossOverlap < 1e-6, `pasy sąsiadów nie nakładają się w ogóle (${crossOverlap.toFixed(6)} j²)`);

// Punkt odniesienia sprzed naprawy: ~1,89 j² pasa tożsamości gracza na heksach sąsiada.
const BEFORE_IDENTITY_ON_FOE = 1.889;
const aOnFoe = areaOnOwner(grid.masks.get(nameA), grid, ownerAt, 3);
const bOnFoe = areaOnOwner(grid.masks.get(nameB), grid, ownerAt, 0);
ok(aOnFoe < BEFORE_IDENTITY_ON_FOE / 10,
  `pas tożsamości gracza na ziemi sąsiada ${aOnFoe.toFixed(4)} j² (przed naprawą ${BEFORE_IDENTITY_ON_FOE} j²)`);
ok(bOnFoe < BEFORE_IDENTITY_ON_FOE / 10,
  `pas tożsamości sąsiada na ziemi gracza ${bOnFoe.toFixed(4)} j²`);
ok(aOnFoe < 1e-6 && bOnFoe < 1e-6, 'żaden pas tożsamości nie wchodzi na heksy drugiej cywilizacji');

// Cały pas musi leżeć na WŁASNYCH heksach — nie na ziemi niczyjej i nie u sąsiada.
for (const [name, who] of [[nameA, 0], [relA, 0], [nameB, 3], [relB, 3]]) {
  const mask = grid.masks.get(name);
  const own = areaOnOwner(mask, grid, ownerAt, who);
  ok(Math.abs(own - maskArea(mask)) < 1e-6,
    `${name}: całe pole pasa leży na heksach własnego terytorium (${own.toFixed(4)} z ${maskArea(mask).toFixed(4)} j²)`);
}

// Kolor tożsamości sąsiada MUSI zostać na styku widoczny — czyli mieć własne, niczym nie
// przykryte pole. To jest dokładnie objaw zgłoszony przez Evaluatora („fiolet Hetytów
// niewidoczny w ogóle"), więc pilnujemy go wprost, nie tylko przez pomiar nakładania.
for (const [own, foe] of [[nameA, [nameB, relB]], [nameB, [nameA, relA]]]) {
  const mask = grid.masks.get(own);
  let covered = 0;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    for (const f of foe) if (grid.masks.get(f)[i]) { covered++; break; }
  }
  ok(covered * CELL < 1e-6,
    `${own}: 0 % pola przykryte pasem sąsiada (przed naprawą 18,7 %)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. KONTRAKT GEOMETRYCZNY — gdzie dokładnie leżą oba pasy względem linii granicy
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Głębokość obu pasów mierzona od linii granicy (pojedynczy heks)');

function hexEdgeNormals() {
  const corners = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    corners.push({ x: HEX_R * Math.sin(a), z: HEX_R * Math.cos(a) });
  }
  const out = [];
  for (let i = 0; i < 6; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % 6];
    const mx = (a.x + b.x) / 2;
    const mz = (a.z + b.z) / 2;
    const l = Math.hypot(mx, mz) || 1;
    out.push({ nx: mx / l, nz: mz / l });
  }
  return out;
}
const NORMALS = hexEdgeNormals();
/** Głębokość w głąb terytorium: 0 = na linii granicy, ujemna = wyciek poza terytorium. */
function depthRange(mesh) {
  const pos = mesh.geometry.getAttribute('position').array;
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < pos.length; i += 3) {
    let outermost = -Infinity;
    for (const n of NORMALS) {
      const d = pos[i] * n.nx + pos[i + 2] * n.nz;
      if (d > outermost) outermost = d;
    }
    const depth = INRADIUS - outermost;
    if (depth < min) min = depth;
    if (depth > max) max = depth;
  }
  return { min, max };
}

{
  const keys = new Set(['0,0']);
  const g = M.buildTerritoryBorderGroup(
    fakeMap(keys), new Map([[0, keys]]), () => COLOR_A,
    BAND, M.TERRITORY_BORDER_OPACITY, () => COLOR_WAR,
  );
  const identity = depthRange(g.children.find((c) => c.name === 'territory-border-0'));
  const relation = depthRange(g.children.find((c) => c.name === 'territory-relation-0'));

  ok(Math.abs(identity.min) < 1e-6, `pas tożsamości zaczyna się DOKŁADNIE na linii granicy (${identity.min.toFixed(5)})`);
  ok(Math.abs(identity.max - BAND) < 1e-6, `pas tożsamości sięga ${BAND} w głąb (${identity.max.toFixed(5)})`);
  ok(Math.abs(relation.min - BAND) < 1e-6, `pas relacji zaczyna się tam, gdzie kończy tożsamość (${relation.min.toFixed(5)})`);
  ok(Math.abs(relation.max - (BAND + RELATION)) < 1e-6,
    `pas relacji sięga ${BAND + RELATION} w głąb (${relation.max.toFixed(5)})`);
  ok(identity.min >= -1e-6 && relation.min >= -1e-6,
    'ŻADEN pas nie wychodzi poza własne terytorium (to jest treść decyzji B)');
  // Cały pas musi się zmieścić w heksie — inaczej mesh zawinąłby się przez środek.
  ok(relation.max < INRADIUS - 1e-6,
    `cały pas mieści się w pojedynczym heksie (${(BAND + RELATION).toFixed(3)} < inradius ${INRADIUS.toFixed(3)})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. TRZY TERYTORIA W RZĘDZIE — środkowe styka się z dwoma naraz
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Trzy terytoria w rzędzie (środkowe ma dwa styki)');
{
  const k0 = new Set(['0,0', '0,1']);
  const k1 = new Set(['1,0', '1,1']);
  const k2 = new Set(['2,0', '2,1']);
  const byOwner = new Map([[0, k0], [3, k1], [4, k2]]);
  const g = M.buildTerritoryBorderGroup(
    fakeMap([...k0, ...k1, ...k2]), byOwner,
    (o) => (o === 0 ? COLOR_A : COLOR_B),
    BAND, M.TERRITORY_BORDER_OPACITY,
    (o) => (o === 0 ? COLOR_A : COLOR_WAR),
  );
  ok(g.children.length === 6, 'trzy terytoria → 6 pasów');
  const r = rasterize(g);
  const names = g.children.map((c) => c.name);
  let cross = 0;
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      if (names[i].split('-').pop() === names[j].split('-').pop()) continue; // ten sam właściciel
      cross += maskOverlap(r.masks.get(names[i]), r.masks.get(names[j]));
    }
  }
  ok(cross < 1e-6, `żadna para pasów RÓŻNYCH właścicieli się nie nakłada (${cross.toFixed(6)} j²)`);

  const oa = makeOwnerAt(new Map([...[...k0].map((k) => [k, 0]), ...[...k1].map((k) => [k, 3]), ...[...k2].map((k) => [k, 4])]));
  for (const c of g.children) {
    const who = Number(c.name.split('-').pop());
    const mask = r.masks.get(c.name);
    ok(Math.abs(areaOnOwner(mask, r, oa, who) - maskArea(mask)) < 1e-6,
      `${c.name}: pas w całości na własnych heksach`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. KSZTAŁTY NIEWYPUKŁE — klasa, na której runda 1 (`4de64fa8`) realnie się wykładała
//
// Nota N1 Evaluatora: KAŻDY fixture w sekcjach 1–3 ma ZERO odwróconych normalnych w starej
// heurystyce centroidu (bloki 2×3 → 0/18, kolumny 2-heksowe → 0/10), więc test nie mógł
// złapać tej klasy błędu i przypiął jako kontrakt uniwersalny coś, co zachodziło tylko dla
// kształtów wypukłych. Kształty niżej mają odwrócone normalne realnie — sprawdzamy to WPROST
// (asercja „fixture należy do klasy łapiącej"), żeby ta sekcja nie zwiotczała po cichu, gdyby
// ktoś kiedyś zmienił geometrię obwodu.
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Kształty NIEWYPUKŁE (fixture z odwróconą normalną w starej heurystyce centroidu)');

/** Ile segmentów obwodu dostałoby ODWRÓCONĄ normalną przy heurystyce „normalna od centroidu". */
function invertedByCentroid(keys) {
  const loops = M.computeTerritoryBorderLoops(new Set(keys), (q, r) => axialToWorld(q, r, HEX_R));
  const ownerAt = makeOwnerAt(new Map(keys.map((k) => [k, 0])));
  const EPS = 0.06;
  let segs = 0;
  let wrong = 0;
  for (const loop of loops) {
    let cx = 0;
    let cz = 0;
    for (const p of loop) { cx += p.x; cz += p.z; }
    cx /= loop.length;
    cz /= loop.length;
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i];
      const b = loop[(i + 1) % loop.length];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len = Math.hypot(dx, dz) || 1;
      const mx = (a.x + b.x) / 2;
      const mz = (a.z + b.z) / 2;
      segs++;
      let nx = dz / len;
      let nz = -dx / len;
      if ((cx - mx) * nx + (cz - mz) * nz > 0) { nx = -nx; nz = -nz; }
      // „na zewnątrz" wg centroidu, a ląduje na WŁASNYM heksie → normalna odwrócona
      if (ownerAt(mx + nx * EPS, mz + nz * EPS) === 0) wrong++;
    }
  }
  return { segs, wrong };
}

const NONCONVEX = {
  'rząd 1×3':   ['0,0', '1,0', '2,0'],
  'rząd 1×4':   ['0,0', '1,0', '2,0', '3,0'],
  'kolumna 3':  ['0,0', '0,1', '0,2'],
  'L-kształt':  ['0,0', '1,0', '2,0', '0,1', '0,2'],
  'blok 2×4':   ['0,0', '1,0', '0,1', '1,1', '-1,2', '0,2', '-1,3', '0,3'],
  'podkowa':    ['0,0', '1,0', '2,0', '2,1', '2,2', '1,2', '0,2'],
};

for (const [label, keys] of Object.entries(NONCONVEX)) {
  const inv = invertedByCentroid(keys);
  ok(inv.wrong > 0,
    `${label}: fixture NALEŻY do klasy łapiącej — stara heurystyka odwracała ${inv.wrong} z ${inv.segs} normalnych`);

  const set = new Set(keys);
  const g = M.buildTerritoryBorderGroup(
    fakeMap(keys), new Map([[0, set]]), () => COLOR_A,
    BAND, M.TERRITORY_BORDER_OPACITY, () => COLOR_WAR,
  );
  const r = rasterize(g);
  const oa = makeOwnerAt(new Map(keys.map((k) => [k, 0])));
  for (const name of ['territory-border-0', 'territory-relation-0']) {
    const mask = r.masks.get(name);
    const own = areaOnOwner(mask, r, oa, 0);
    const total = maskArea(mask);
    ok(total > 0.3 && Math.abs(own - total) < 1e-6,
      `${label}: ${name} w CAŁOŚCI na własnych heksach (${own.toFixed(4)} z ${total.toFixed(4)} j²)`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ENKLAWA — terytorium z DZIURĄ (nota N3 Evaluatora: regresja rundy 1)
//
// Pierścień 6 heksów wokół pustego środka ma DRUGĄ pętlę obwodu — wokół dziury. Dla niej
// „na zewnątrz terytorium" znaczy „w głąb dziury", a heurystyka centroidu wskazywała tam
// odwrotnie, więc pas tożsamości wsuwał się DO enklawy: zmierzone 1,5013 j² farby na cudzym
// heksie tam, gdzie przed tematem było 0,0000 j².
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Enklawa — terytorium z dziurą (druga pętla obwodu)');
{
  const ring = ['1,0', '1,-1', '0,-1', '-1,0', '-1,1', '0,1'];
  const hole = '0,0';
  const set = new Set(ring);

  const loops = M.computeTerritoryBorderLoops(set, (q, r) => axialToWorld(q, r, HEX_R));
  ok(loops.length === 2, `pierścień ma DWIE pętle obwodu (zewnętrzną i wokół dziury) — jest ${loops.length}`);

  const inv = invertedByCentroid(ring);
  ok(inv.wrong > 0,
    `fixture NALEŻY do klasy łapiącej — stara heurystyka odwracała ${inv.wrong} z ${inv.segs} normalnych`);

  const g = M.buildTerritoryBorderGroup(
    fakeMap([...ring, hole]), new Map([[0, set]]), () => COLOR_A,
    BAND, M.TERRITORY_BORDER_OPACITY, () => COLOR_WAR,
  );
  const r = rasterize(g);
  // Właściciel 0 = pierścień, właściciel 9 = heks enklawy (nie nasz).
  const oa = makeOwnerAt(new Map([...ring.map((k) => [k, 0]), [hole, 9]]));
  for (const name of ['territory-border-0', 'territory-relation-0']) {
    const mask = r.masks.get(name);
    const inEnclave = areaOnOwner(mask, r, oa, 9);
    const own = areaOnOwner(mask, r, oa, 0);
    const total = maskArea(mask);
    ok(inEnclave < 1e-6,
      `${name}: 0 j² na heksie ENKLAWY (${inEnclave.toFixed(4)} j²; runda 1 miała 1,5013 j² dla pasa tożsamości)`);
    ok(Math.abs(own - total) < 1e-6,
      `${name}: całe pole na własnych heksach pierścienia (${own.toFixed(4)} z ${total.toFixed(4)} j²)`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. POWIERZCHNIA pasa dotyka linii granicy — nie tylko pojedyncze wierzchołki
//
// Nota N2 Evaluatora: asercja z sekcji 2 mierzy minimum po WIERZCHOŁKACH, a wierzchołki
// trójkątów domykających naroża leżały na linii jako punkty izolowane — powierzchnia pasa
// kończyła się 0,0938 j (średnio) przed linią. Tu próbkujemy w głąb od PUNKTÓW WEWNĘTRZNYCH
// odcinków obwodu, więc mierzymy pokrycie powierzchni, nie obecność wierzchołka.
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. Pas tożsamości dotyka linii granicy POWIERZCHNIĄ (nie tylko wierzchołkiem)');
{
  const shapes = { '1 heks': ['0,0'], 'blok 2×3': ['0,0', '1,0', '0,1', '1,1', '-1,2', '0,2'], 'rząd 1×3': ['0,0', '1,0', '2,0'] };
  const PROBE = 0.001;
  for (const [label, keys] of Object.entries(shapes)) {
    const set = new Set(keys);
    const g = M.buildTerritoryBorderGroup(
      fakeMap(keys), new Map([[0, set]]), () => COLOR_A,
      BAND, M.TERRITORY_BORDER_OPACITY, () => COLOR_WAR,
    );
    const tris = meshTriangles(g.children.find((c) => c.name === 'territory-border-0'));
    const loops = M.computeTerritoryBorderLoops(set, (q, r) => axialToWorld(q, r, HEX_R));
    let maxGap = 0;
    for (const loop of loops) {
      for (let i = 0; i < loop.length; i++) {
        const a = loop[i];
        const b = loop[(i + 1) % loop.length];
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const len = Math.hypot(dx, dz) || 1;
        const inx = dz / len;
        const inz = -dx / len; // w głąb terytorium
        for (let s = 1; s < 20; s++) {
          const t = s / 20;
          const px = a.x + dx * t;
          const pz = a.z + dz * t;
          let gap = null;
          for (let k = 0; k <= 400; k++) {
            const d = k * PROBE;
            let hit = false;
            for (const tt of tris) if (pointInTriangle(px + inx * d, pz + inz * d, tt)) { hit = true; break; }
            if (hit) { gap = d; break; }
          }
          if (gap !== null && gap > maxGap) maxGap = gap;
        }
      }
    }
    ok(maxGap <= PROBE + 1e-9,
      `${label}: szczelina między linią granicy a powierzchnią pasa ${maxGap.toFixed(4)} j `
      + `(runda 1: 0,1360–0,3995 j w zależności od kształtu)`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
