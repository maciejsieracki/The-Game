'use strict';
/**
 * granice-pas-pomiar.cjs — NARZĘDZIE DIAGNOSTYCZNE (nie bramka CI, nie wchodzi do listy testów).
 *
 * Powstało na notę N6 Evaluatora do `4de64fa8` (`R-GRANICE-STYK-CZYTELNOSC-Q1` = B): liczby
 * o wycieku pasa granicy na cudze heksy były podawane właścicielowi bez ŻADNEGO artefaktu
 * w repozytorium, więc nikt nie mógł ich odtworzyć. Ten plik jest tym artefaktem — mierzy
 * geometrię pasów granicy przez rasteryzację PRAWDZIWYCH trójkątów mesha (test
 * punkt-w-trójkącie, krok 0,01 j) i dokładny test punkt-w-sześciokącie dla przynależności
 * heksa, a nie przez odczyt pikseli z ekranu.
 *
 * Mierzone wielkości (wszystkie w jednostkach świata gry, 1 j = HEX_R):
 *   - wyciek [j²]        — pole pasa tożsamości leżące POZA heksami własnego terytorium;
 *   - odwr.norm.         — ile segmentów obwodu dostałoby ODWRÓCONĄ normalną przy starej
 *                          heurystyce centroidu (przyczyna noty N1);
 *   - samonakl. [j²]     — pole, na którym pas relacji tego samego właściciela przykrywa jego
 *                          pas tożsamości (nota N4);
 *   - szczelina [j]      — odległość między linią granicy a najbliższą POWIERZCHNIĄ pasa
 *                          tożsamości, próbkowana po obwodzie (nota N2; 0 = pas dotyka linii).
 *
 * Uruchamianie z katalogu gra/:
 *   node tools/granice-pas-pomiar.cjs                 — tabela liczbowa
 *   node tools/granice-pas-pomiar.cjs --svg out.svg   — dodatkowo rysunek geometrii pasów
 *
 * Porównanie z dowolną wcześniejszą wersją kodu (tak powstały liczby PRZED/RUNDA 1/RUNDA 2
 * w nagłówku `granice-styk-nakladanie-test.cjs`) — z katalogu gra/:
 *   cp src/render/rangeOverlay.ts /tmp/zachowaj.ts
 *   git show <commit>:gra/src/render/rangeOverlay.ts > src/render/rangeOverlay.ts
 *   node tools/granice-pas-pomiar.cjs --svg /tmp/tamta-wersja.svg
 *   cp /tmp/zachowaj.ts src/render/rangeOverlay.ts
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.granice-pomiar-entry.ts');
const BUNDLE = path.join(__dirname, '.granice-pomiar-bundle.cjs');

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
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA,
  loader: { '.ts': 'ts', '.json': 'json' }, external: ['three'], logLevel: 'silent',
});

const M = require(BUNDLE);
const { HEX_R, axialToWorld, computeTerritoryBorderLoops } = M;
const BAND = M.TERRITORY_BORDER_BAND_WIDTH;
const RELATION = M.TERRITORY_RELATION_BAND_WIDTH;
const INRADIUS = HEX_R * Math.sqrt(3) / 2;
const STEP = 0.01;
const CELL = STEP * STEP;

// ── rasteryzacja prawdziwej geometrii mesha ──────────────────────────────────
function meshTriangles(mesh) {
  const pos = mesh.geometry.getAttribute('position').array;
  const idx = mesh.geometry.getIndex().array;
  const out = [];
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    out.push([pos[a], pos[a + 2], pos[b], pos[b + 2], pos[c], pos[c + 2]]);
  }
  return out;
}
function pointInTriangle(px, pz, t) {
  const [ax, az, bx, bz, cx, cz] = t;
  const d1 = (px - bx) * (az - bz) - (ax - bx) * (pz - bz);
  const d2 = (px - cx) * (bz - cz) - (bx - cx) * (pz - cz);
  const d3 = (px - ax) * (cz - az) - (cx - ax) * (pz - az);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
function rasterize(group) {
  const tris = new Map();
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const child of group.children) {
    const t = meshTriangles(child);
    tris.set(child.name, t);
    for (const tt of t) for (let k = 0; k < 6; k += 2) {
      if (tt[k] < minX) minX = tt[k];
      if (tt[k] > maxX) maxX = tt[k];
      if (tt[k + 1] < minZ) minZ = tt[k + 1];
      if (tt[k + 1] > maxZ) maxZ = tt[k + 1];
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
function maskArea(m) { let s = 0; for (let i = 0; i < m.length; i++) s += m[i]; return s * CELL; }
function maskOverlap(a, b) { let s = 0; for (let i = 0; i < a.length; i++) if (a[i] && b[i]) s++; return s * CELL; }

// ── dokładny test punkt-w-sześciokącie (NIE promień HEX_R — heks sięga tylko do inradiusu) ──
const HEX_EDGE_NORMALS = (() => {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const a1 = (Math.PI / 3) * i, a2 = (Math.PI / 3) * ((i + 1) % 6);
    const mx = (Math.sin(a1) + Math.sin(a2)) / 2, mz = (Math.cos(a1) + Math.cos(a2)) / 2;
    const l = Math.hypot(mx, mz);
    out.push({ nx: mx / l, nz: mz / l });
  }
  return out;
})();
function makeInside(keys) {
  const centers = [...keys].map((k) => {
    const [q, r] = k.split(',').map(Number);
    return axialToWorld(q, r, HEX_R);
  });
  return (px, pz) => {
    for (const c of centers) {
      const dx = px - c.x, dz = pz - c.z;
      if (Math.hypot(dx, dz) > HEX_R + 1e-9) continue;
      let ok = true;
      for (const n of HEX_EDGE_NORMALS) if (dx * n.nx + dz * n.nz > INRADIUS + 1e-9) { ok = false; break; }
      if (ok) return true;
    }
    return false;
  };
}
function areaOutside(mask, grid, inside) {
  let s = 0;
  for (let iz = 0; iz < grid.nz; iz++) for (let ix = 0; ix < grid.nx; ix++) {
    if (!mask[iz * grid.nx + ix]) continue;
    if (!inside(grid.minX + (ix + 0.5) * STEP, grid.minZ + (iz + 0.5) * STEP)) s++;
  }
  return s * CELL;
}

// ── ile segmentów obwodu odwróciłaby stara heurystyka centroidu ──────────────
function invertedByCentroid(keys) {
  const loops = computeTerritoryBorderLoops(new Set(keys), (q, r) => axialToWorld(q, r, HEX_R));
  const inside = makeInside(keys);
  let segs = 0, wrong = 0;
  const EPS = 0.06;
  for (const loop of loops) {
    let cx = 0, cz = 0;
    for (const p of loop) { cx += p.x; cz += p.z; }
    cx /= loop.length; cz /= loop.length;
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i], b = loop[(i + 1) % loop.length];
      const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz) || 1;
      const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
      segs++;
      let nx = dz / len, nz = -dx / len;
      if ((cx - mx) * nx + (cz - mz) * nz > 0) { nx = -nx; nz = -nz; }
      if (inside(mx + nx * EPS, mz + nz * EPS)) wrong++;
    }
  }
  return { segs, wrong };
}

// ── szczelina między linią granicy a POWIERZCHNIĄ pasa tożsamości ────────────
function borderGap(keys, mesh) {
  const loops = computeTerritoryBorderLoops(new Set(keys), (q, r) => axialToWorld(q, r, HEX_R));
  const tris = meshTriangles(mesh);
  let maxGap = 0, sumGap = 0, samples = 0;
  const PROBE = 0.0005;
  for (const loop of loops) {
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i], b = loop[(i + 1) % loop.length];
      const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz) || 1;
      const inx = dz / len, inz = -dx / len;   // w głąb terytorium (przeciwna do outward)
      for (let s = 1; s < 40; s++) {
        const t = s / 40;
        const px = a.x + dx * t, pz = a.z + dz * t;
        let gap = null;
        for (let k = 0; k <= 800; k++) {
          const d = k * PROBE;
          const qx = px + inx * d, qz = pz + inz * d;
          let hit = false;
          for (const tt of tris) if (pointInTriangle(qx, qz, tt)) { hit = true; break; }
          if (hit) { gap = d; break; }
        }
        if (gap === null) continue;
        samples++; sumGap += gap;
        if (gap > maxGap) maxGap = gap;
      }
    }
  }
  return { maxGap, avgGap: samples ? sumGap / samples : 0, samples };
}

// ── kształty ────────────────────────────────────────────────────────────────
const SHAPES = {
  '1 heks':              ['0,0'],
  '1x2':                 ['0,0', '1,0'],
  '1x3 (niewypukly)':    ['0,0', '1,0', '2,0'],
  '1x4 (niewypukly)':    ['0,0', '1,0', '2,0', '3,0'],
  'kolumna 3':           ['0,0', '0,1', '0,2'],
  'blok 2x3':            ['0,0', '1,0', '0,1', '1,1', '-1,2', '0,2'],
  'blok 2x4':            ['0,0', '1,0', '0,1', '1,1', '-1,2', '0,2', '-1,3', '0,3'],
  'kwiat 7':             ['0,0', '1,0', '1,-1', '0,-1', '-1,0', '-1,1', '0,1'],
  'L-ksztalt':           ['0,0', '1,0', '2,0', '0,1', '0,2'],
  'podkowa':             ['0,0', '1,0', '2,0', '2,1', '2,2', '1,2', '0,2'],
  'pierscien 6 (enklawa)': ['1,0', '1,-1', '0,-1', '-1,0', '-1,1', '0,1'],
};

function fakeMap(keys) { const hexes = {}; for (const k of keys) hexes[k] = {}; return { hexes }; }

console.log('granice-pas-pomiar — geometria pasa granicy (rasteryzacja mesha, krok 0,01 j)\n');
console.log(`pas tozsamosci ${BAND} j w glab, pas relacji ${RELATION} j (razem ${BAND + RELATION} j), inradius ${INRADIUS.toFixed(4)} j\n`);
console.log('ksztalt                    segm  odwr.norm.  wyciek toz.[j2]  wyciek rel.[j2]  samonakl.[j2]  szczelina max[j]');
console.log('-'.repeat(112));

for (const [label, keys] of Object.entries(SHAPES)) {
  const set = new Set(keys);
  const g = M.buildTerritoryBorderGroup(
    fakeMap(keys), new Map([[0, set]]), () => 0x8b1a1a,
    BAND, M.TERRITORY_BORDER_OPACITY, () => 0xff5252,
  );
  const idMesh = g.children.find((c) => c.name === 'territory-border-0');
  const relMesh = g.children.find((c) => c.name === 'territory-relation-0');
  const grid = rasterize(g);
  const inside = makeInside(keys);
  const leakId = areaOutside(grid.masks.get('territory-border-0'), grid, inside);
  const leakRel = areaOutside(grid.masks.get('territory-relation-0'), grid, inside);
  const self = maskOverlap(grid.masks.get('territory-border-0'), grid.masks.get('territory-relation-0'));
  const inv = invertedByCentroid(keys);
  const gap = borderGap(keys, idMesh);
  console.log(
    label.padEnd(26) +
    String(inv.segs).padStart(4) +
    String(inv.wrong).padStart(12) +
    leakId.toFixed(4).padStart(17) +
    leakRel.toFixed(4).padStart(17) +
    self.toFixed(4).padStart(15) +
    gap.maxGap.toFixed(4).padStart(18),
  );
  void relMesh;
}

// ── styk dwoch cywilizacji: nakladanie pasow roznych wlascicieli ─────────────
console.log('\nstyk dwoch cywilizacji (dwa bloki 2x3, 6 wspolnych krawedzi):');
{
  const keysA = new Set(), keysB = new Set();
  for (let r = 0; r < 3; r++) {
    const shift = Math.floor(r / 2);
    for (let q = 0; q <= 1; q++) keysA.add(`${q - shift},${r}`);
    for (let q = 2; q <= 3; q++) keysB.add(`${q - shift},${r}`);
  }
  const g = M.buildTerritoryBorderGroup(
    fakeMap([...keysA, ...keysB]), new Map([[0, keysA], [3, keysB]]),
    (o) => (o === 0 ? 0x8b1a1a : 0x7b4b8a), BAND, M.TERRITORY_BORDER_OPACITY,
    (o) => (o === 0 ? 0x8b1a1a : 0xff5252),
  );
  const grid = rasterize(g);
  let cross = 0;
  for (const a of ['territory-border-0', 'territory-relation-0']) {
    for (const b of ['territory-border-3', 'territory-relation-3']) {
      cross += maskOverlap(grid.masks.get(a), grid.masks.get(b));
    }
  }
  console.log(`  nakladanie pasow ROZNYCH wlascicieli: ${cross.toFixed(4)} j2`);
  const insA = makeInside([...keysA]);
  console.log(`  pas tozsamosci A poza wlasnym terytorium: ${areaOutside(grid.masks.get('territory-border-0'), grid, insA).toFixed(4)} j2`);
  console.log(`  pole pasa tozsamosci A: ${maskArea(grid.masks.get('territory-border-0')).toFixed(4)} j2`);
}

// ── przekroj przez styk: co jest pomalowane wzdluz normalnej do wspolnej krawedzi ──
console.log('\nprzekroj przez wspolna krawedz styku (rozpietosc i pomalowana dlugosc):');
{
  const keysA = new Set(), keysB = new Set();
  for (let r = 0; r < 3; r++) {
    const shift = Math.floor(r / 2);
    for (let q = 0; q <= 1; q++) keysA.add(`${q - shift},${r}`);
    for (let q = 2; q <= 3; q++) keysB.add(`${q - shift},${r}`);
  }
  const g = M.buildTerritoryBorderGroup(
    fakeMap([...keysA, ...keysB]), new Map([[0, keysA], [3, keysB]]),
    (o) => (o === 0 ? 0x8b1a1a : 0x7b4b8a), BAND, M.TERRITORY_BORDER_OPACITY,
    (o) => (o === 0 ? 0x8b1a1a : 0xff5252),
  );
  const tris = [];
  for (const c of g.children) tris.push(...meshTriangles(c));
  // srodek wspolnej krawedzi miedzy heksem A (1,1) i B (2,1): przekroj wzdluz osi x
  const ca = axialToWorld(1, 1, HEX_R), cb = axialToWorld(2, 1, HEX_R);
  const mx = (ca.x + cb.x) / 2, mz = (ca.z + cb.z) / 2;
  const dirx = (cb.x - ca.x), dirz = (cb.z - ca.z);
  const dl = Math.hypot(dirx, dirz);
  const ux = dirx / dl, uz = dirz / dl;
  const SS = 0.0005;
  let first = null, last = null, painted = 0;
  for (let k = -2000; k <= 2000; k++) {
    const d = k * SS;
    const px = mx + ux * d, pz = mz + uz * d;
    let hit = false;
    for (const tt of tris) if (pointInTriangle(px, pz, tt)) { hit = true; break; }
    if (hit) { painted++; if (first === null) first = d; last = d; }
  }
  console.log(`  rozpietosc pomalowanego pasa: ${(last - first).toFixed(4)} j (od ${first.toFixed(4)} do ${last.toFixed(4)} wzgledem linii granicy)`);
  console.log(`  faktycznie pomalowana dlugosc: ${(painted * SS).toFixed(4)} j`);
  console.log(`  przerwy w srodku rozpietosci:  ${((last - first) - painted * SS).toFixed(4)} j`);
}

// ── rysunek SVG (dowód wizualny odtwarzalny jedną komendą, nota N6) ──────────
const svgArg = process.argv.indexOf('--svg');
if (svgArg > -1 && process.argv[svgArg + 1]) {
  const SCALE = 46;
  const PAD = 14;
  const COLS = 4;
  const CELL_W = 6.6;
  const CELL_H = 6.2;
  const parts = [];
  let idx = 0;
  for (const [label, keys] of Object.entries(SHAPES)) {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    idx++;
    const set = new Set(keys);
    const g = M.buildTerritoryBorderGroup(
      fakeMap(keys), new Map([[0, set]]), () => 0x8b1a1a,
      BAND, M.TERRITORY_BORDER_OPACITY, () => 0xff5252,
    );
    // wyśrodkowanie kształtu w komórce siatki
    const cs = keys.map((k) => { const [q, r] = k.split(',').map(Number); return axialToWorld(q, r, HEX_R); });
    const ox = cs.reduce((s, c) => s + c.x, 0) / cs.length;
    const oz = cs.reduce((s, c) => s + c.z, 0) / cs.length;
    const TX = (col + 0.5) * CELL_W - ox;
    const TZ = (row + 0.5) * CELL_H - oz;
    const P = (x, z) => `${((x + TX) * SCALE + PAD).toFixed(2)},${((z + TZ) * SCALE + PAD).toFixed(2)}`;

    // heksy terytorium — tło
    for (const c of cs) {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        pts.push(P(c.x + HEX_R * Math.sin(a), c.z + HEX_R * Math.cos(a)));
      }
      parts.push(`<polygon points="${pts.join(' ')}" fill="#e9e2d4" stroke="#c9bfa8" stroke-width="1"/>`);
    }
    // trójkąty pasów
    for (const child of g.children) {
      const fill = child.name.startsWith('territory-relation') ? '#ff5252' : '#8b1a1a';
      for (const t of meshTriangles(child)) {
        parts.push(`<polygon points="${P(t[0], t[1])} ${P(t[2], t[3])} ${P(t[4], t[5])}" fill="${fill}" fill-opacity="0.7" stroke="none"/>`);
      }
    }
    // linia granicy
    const loops = computeTerritoryBorderLoops(set, (q, r) => axialToWorld(q, r, HEX_R));
    for (const loop of loops) {
      parts.push(`<polygon points="${loop.map((p) => P(p.x, p.z)).join(' ')}" fill="none" stroke="#111" stroke-width="1.6"/>`);
    }
    parts.push(`<text x="${((col + 0.06) * CELL_W * SCALE + PAD).toFixed(1)}" y="${((row + 0.16) * CELL_H * SCALE + PAD).toFixed(1)}" font-family="sans-serif" font-size="15" fill="#222">${label}</text>`);
  }
  const rows = Math.ceil(idx / COLS);
  const W = (COLS * CELL_W * SCALE + PAD * 2).toFixed(0);
  const H = (rows * CELL_H * SCALE + PAD * 2).toFixed(0);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
    + `<rect width="100%" height="100%" fill="#fbf8f1"/>${parts.join('')}</svg>`;
  fs.writeFileSync(process.argv[svgArg + 1], svg, 'utf8');
  console.log(`\nrysunek zapisany: ${process.argv[svgArg + 1]}`);
}

try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
