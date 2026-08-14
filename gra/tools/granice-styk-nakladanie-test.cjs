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
 * PUNKT ODNIESIENIA — zmierzony tą samą metodą na kodzie SPRZED naprawy (commit `c438af75`,
 * ten sam układ dwóch terytoriów co niżej, rasteryzacja krokiem 0,01):
 *   - nakładanie pasów RÓŻNYCH właścicieli:            2,2024 j²
 *   - pas tożsamości gracza leżący na heksach sąsiada: ~1,89 j²
 *   - udział pasa tożsamości przykrytego przez sąsiada: 18,7 %
 *   - pas tożsamości leżący na WŁASNYCH heksach:       1,18 z 6,75 j², czyli 17 %
 * Po naprawie wszystkie cztery wynoszą odpowiednio 0 / 0 / 0 % / 100 %. Liczby z rasteryzacji
 * mają rozdzielczość ±0,002 j² (wynik zależy od tego, gdzie wypadną środki komórek siatki),
 * dlatego progi niżej są zapisane z zapasem, a nie jako równości.
 * SPRAWDZONE MUTACYJNIE: na kodzie sprzed naprawy ten plik daje 12 pass / 18 fail — nie jest
 * to test, który przechodzi w obie strony.
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

/** Właściciel heksa pod punktem (komórka Woronoja środków = sam heks); -1 = ziemia niczyja. */
function makeOwnerAt(ownerByKey) {
  const centers = [];
  for (const [key, owner] of ownerByKey) {
    const [q, r] = key.split(',').map(Number);
    const c = axialToWorld(q, r, HEX_R);
    centers.push({ x: c.x, z: c.z, owner });
  }
  return (px, pz) => {
    let best = -1;
    let bestD = Infinity;
    for (const c of centers) {
      const d = (px - c.x) ** 2 + (pz - c.z) ** 2;
      if (d < bestD) { bestD = d; best = c.owner; }
    }
    // poza heksem: dalej niż promień opisany na heksie od KAŻDEGO środka
    return bestD <= HEX_R * HEX_R ? best : -1;
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
try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
