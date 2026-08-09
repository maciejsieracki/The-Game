'use strict';
/**
 * MAPA: obrys terytorium przy GĘSTYM OSADNICTWIE (BUG-CYWILIZACJA-BEZ-GRANIC, 2026-08-09).
 *
 * Regresja dla realnego zgłoszenia: cywilizacja z wieloma miastami blisko siebie (min.
 * dystans miasto_params.min_dystans_miast = 4 heksy) traciła widoczny obrys terytorium.
 *
 * Przyczyna (potwierdzona na żywej symulacji przez subagenta diagnostycznego, skrypt roboczy
 * nie wszedł do repo — dowód opisany w dyspozycje/PYTANIA-OTWARTE.md, BUG-CYWILIZACJA-BEZ-GRANIC):
 * `borderVertexKey()` w src/map/territory-border.ts formatowała współrzędne wierzchołka przez
 * `toFixed(5)` bez normalizacji znaku przy zerze. Dwa sąsiednie heksy liczą WSPÓLNY wierzchołek
 * z DWÓCH różnych centrów (hexCornerWorld dla różnych (q,r)) — matematycznie ten sam punkt, ale
 * szum zmiennoprzecinkowy (~1e-16) może dać z jednej strony dokładnie `0`, a z drugiej np.
 * `-4.44e-16`. `(0).toFixed(5)` = "0.00000", `(-4.44e-16).toFixed(5)` = "-0.00000" — DWA różne
 * klucze dla TEGO SAMEGO wierzchołka. Efekt: traceTerritoryBoundaryLoops widzi tam wierzchołek
 * stopnia 1 zamiast 2, przerywa pętlę w tym miejscu i porzuca resztę obwodu (brakujące krawędzie,
 * pętle się nie domykają) — im gęstszy/bardziej symetryczny klaster miast, tym więcej
 * wierzchołków ląduje dokładnie na osi zero i tym bardziej prawdopodobny brak obrysu.
 *
 * Ten test odtwarza scenariusz z bugu: 10 miast tej samej cywilizacji, każde >= 4 heksy od
 * pozostałych (canFoundCity), gęsto upakowane wokół wspólnego centrum — i sprawdza, że obrys
 * terytorium jest kompletny (brak zgubionych krawędzi, brak wierzchołków o stopniu != 0/2).
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.territory-border-dense-settlement-entry.ts');
const BUNDLE = path.join(__dirname, '.territory-border-dense-settlement-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  axialDistance,
  cityTerritoryRadius,
} from '../src/map/territory';
export {
  collectTerritoryBoundaryEdges,
  traceTerritoryBoundaryLoops,
  makeAxialHexCenterFn,
} from '../src/map/territory-border';
export {
  collectTerritoryHexKeysByOwner,
} from '../src/map/range-hexes';
`,
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
  logLevel: 'silent',
});

const M = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) {
    pass++;
    console.log('  OK', msg);
  } else {
    fail++;
    console.error('FAIL', msg);
  }
}

// -------------------------------------------------------------------
// Klaster 10 miast tej samej cywilizacji, min. dystans 4 heksy (canFoundCity), zagęszczony
// przez zachłanną spiralę (pierwszy wolny heks >= 4 od wszystkich już wybranych).
// -------------------------------------------------------------------
const HEX_DIRS = [
  { dq: 1, dr: 0 }, { dq: 1, dr: -1 }, { dq: 0, dr: -1 },
  { dq: -1, dr: 0 }, { dq: -1, dr: 1 }, { dq: 0, dr: 1 },
];

function hexSpiralCandidates(maxRadius) {
  const out = [{ q: 0, r: 0 }];
  for (let rad = 1; rad <= maxRadius; rad++) {
    let q = -rad, r = rad;
    for (let side = 0; side < 6; side++) {
      const dir = HEX_DIRS[side];
      for (let step = 0; step < rad; step++) {
        out.push({ q, r });
        q += dir.dq;
        r += dir.dr;
      }
    }
  }
  return out;
}

function buildDenseCityCluster(nCities, minDist, pops, ownerId) {
  const candidates = hexSpiralCandidates(20);
  const cities = [];
  for (const c of candidates) {
    if (cities.length >= nCities) break;
    const okDist = cities.every(o => M.axialDistance(c.q, c.r, o.q, o.r) >= minDist);
    if (okDist) cities.push({ q: c.q, r: c.r });
  }
  if (cities.length < nCities) {
    throw new Error(`nie udalo sie umiescic ${nCities} miast (tylko ${cities.length})`);
  }
  return cities.map((c, i) => ({ q: c.q, r: c.r, pop: pops[i % pops.length], level: 1, ownerId }));
}

function buildSyntheticMap(half) {
  const hexes = {};
  for (let q = -half; q <= half; q++) {
    for (let r = -half; r <= half; r++) {
      if (Math.abs(q + r) > half) continue;
      hexes[`${q},${r}`] = {};
    }
  }
  return { szerokoscQ: half * 2, wysokoscR: half * 2, hexes, seed: 1, riverPaths: [] };
}

/** Sprawdza że pętle obwodu pokrywają CAŁY zbiór krawędzi i tworzą tylko wierzchołki stopnia 0/2. */
function assertCompleteBoundary(hexKeys, label) {
  const center = M.makeAxialHexCenterFn();
  const edges = M.collectTerritoryBoundaryEdges(hexKeys, center);
  const loops = M.traceTerritoryBoundaryLoops(edges);

  ok(edges.length > 0, `${label}: sa krawedzie brzegowe (${edges.length})`);
  ok(loops.length > 0, `${label}: traceTerritoryBoundaryLoops zwraca niepuste petle (liczba petli=${loops.length})`);

  const totalSeg = loops.reduce((s, l) => s + l.length, 0);
  ok(totalSeg === edges.length, `${label}: petle pokrywaja WSZYSTKIE krawedzie (segmenty=${totalSeg}, krawedzie=${edges.length})`);

  // Stopień każdego wierzchołka w grafie krawędzi musi być parzysty (0 nieistotne, tu zawsze 2
  // dla wierzchołków obecnych) — nieparzysty stopień (typowo 1) = ślad po rozbiciu klucza
  // wierzchołka (dokładnie ten bug).
  const degCount = new Map();
  for (const e of edges) {
    degCount.set(e.v0Key, (degCount.get(e.v0Key) ?? 0) + 1);
    degCount.set(e.v1Key, (degCount.get(e.v1Key) ?? 0) + 1);
  }
  const oddVertices = [...degCount.entries()].filter(([, d]) => d % 2 !== 0);
  ok(oddVertices.length === 0, `${label}: brak wierzcholkow o nieparzystym stopniu (0 znalezionych, degeneracja klucza -0/0)`);

  return { edges, loops };
}

// -------------------------------------------------------------------
// Scenariusz A: 10 miast, populacje realistyczne (mieszane, jak w zgłoszeniu).
// -------------------------------------------------------------------
{
  const OWNER = 3;
  const nodes = buildDenseCityCluster(10, 4, [12, 8, 7, 9, 6, 5, 8, 6, 7, 5], OWNER);
  const map = buildSyntheticMap(45);
  const byOwner = M.collectTerritoryHexKeysByOwner(map, nodes);
  ok(byOwner.get(OWNER)?.size > 0, 'scenariusz A (populacje mieszane): wlasciciel dostaje heksy terytorium');
  assertCompleteBoundary(byOwner.get(OWNER) ?? new Set(), 'scenariusz A (populacje mieszane)');
}

// -------------------------------------------------------------------
// Scenariusz B: 10 miast, populacja maksymalna (promień 15 każde) — najgęstszy możliwy overlap
// przy min_dystans_miast=4.
// -------------------------------------------------------------------
{
  const OWNER = 7;
  const nodes = buildDenseCityCluster(10, 4, [15], OWNER);
  const map = buildSyntheticMap(45);
  const byOwner = M.collectTerritoryHexKeysByOwner(map, nodes);
  ok(byOwner.get(OWNER)?.size > 0, 'scenariusz B (populacja max=15): wlasciciel dostaje heksy terytorium');
  assertCompleteBoundary(byOwner.get(OWNER) ?? new Set(), 'scenariusz B (populacja max=15)');
}

// -------------------------------------------------------------------
// Scenariusz C: kontrola regresji ujemnego zera wprost — wierzchołek geometrycznie w x=0
// (klaster wyśrodkowany na (0,0), gdzie axialToWorld(0,0) = world (0,0)) musi mieć parzysty
// stopień, nie może rozpadać się na dwa klucze "0.00000,...": i "-0.00000,...".
// -------------------------------------------------------------------
{
  const OWNER = 11;
  // Klaster celowo wyśrodkowany na osi zero (podobnie jak w oryginalnym bugu) — tu najbardziej
  // prawdopodobne wystąpienie wierzchołków dokładnie na x=0 lub z=0.
  const nodes = buildDenseCityCluster(6, 4, [10, 9, 8, 9, 10, 8], OWNER);
  const map = buildSyntheticMap(40);
  const byOwner = M.collectTerritoryHexKeysByOwner(map, nodes);
  const hexKeys = byOwner.get(OWNER) ?? new Set();
  const center = M.makeAxialHexCenterFn();
  const edges = M.collectTerritoryBoundaryEdges(hexKeys, center);
  // Zbierz sasiedztwo v0Key<->v1Key: dla kazdego klucza "-0.00000,<z>" musi istniec sparowany
  // klucz "0.00000,<z>" ktory dzieli TEN SAM zestaw krawedzi (bo po fixNegativeZeroString to
  // powinien byc JEDEN klucz, nie dwa) -- czyli klucz "-0.00000,..." nie powinien w ogole
  // wystapic po naprawie.
  const negZeroKeys = new Set();
  for (const e of edges) {
    if (e.v0Key.startsWith('-0.00000')) negZeroKeys.add(e.v0Key);
    if (e.v1Key.startsWith('-0.00000')) negZeroKeys.add(e.v1Key);
  }
  ok(negZeroKeys.size === 0, `scenariusz C: brak kluczy wierzcholkow "-0.00000,..." po naprawie borderVertexKey (znaleziono ${negZeroKeys.size})`);
  assertCompleteBoundary(hexKeys, 'scenariusz C (klaster na osi zero)');
}

console.log(`\nterritory-border-dense-settlement-test: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
