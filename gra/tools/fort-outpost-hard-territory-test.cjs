'use strict';
/**
 * fort-outpost-hard-territory-test.cjs
 * R-WEB-OUTPOST-FORT-TERRITORY-Q1 (decyzja wlasciciela 2026-10-31): posterunek (r=3)
 * i fort (r=5) tworza TWARDE terytorium jak miasto. Zastepuje Q2=B (2026-08-09,
 * "miekka rezerwacja, granice sie nie przesuwaja").
 *   A — promienie i territoryOwnerAt (3 -> 37 heksow, 5 -> 91 heksow)
 *   B — obcy nie buduje ulepszen (buildImprovementQualifier), wlasciciel buduje
 *   C — obcy nie zaklada miasta (isHexInForeignFortTerritory); wlasciciel tak; limit miast
 *       (cityLimitBase) NIE wplywa na terytorium fortu
 *   D — spor: najblizszy wezel wygrywa, contestedUseless nie tworzy terytorium
 *   E — straznik tekstowy main.ts (buildAllTerritoryNodes, foundingTerritoryOpts,
 *       backfill starych zapisow, odswiezenie granic)
 * Run from gra/:  node tools/fort-outpost-hard-territory-test.cjs
 */
const fs = require('fs');
const path = require('path');
let passed = 0, failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }
function eq(a, b, m) { assert(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.fort-hard-entry.ts');
const BUNDLE = path.resolve(__dirname, '.fort-hard-bundle.cjs');
fs.writeFileSync(ENTRY, `
export * as FT from ${JSON.stringify(SRC + '/game/fort-territory')};
export { territoryOwnerAt, cityTerritoryRadius, axialDistance, isInTerritory } from ${JSON.stringify(SRC + '/map/territory')};
export { buildImprovementQualifier } from ${JSON.stringify(SRC + '/map/improvement-build')};
export { canFoundCity } from ${JSON.stringify(SRC + '/game/cities')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`);
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent' });
} catch (e) { console.error('bundle failed', e.message || e); process.exit(1); }
const M = require(BUNDLE);
const { FT, territoryOwnerAt, cityTerritoryRadius, buildImprovementQualifier, canFoundCity, TerenBazowy, Nakladka } = M;
// Funkcje nowej reguly: gdy ich brak (stan sprzed zmiany), testy B-D padaja (czerwony PRZED).
const fortTerritoryNodes = FT.fortTerritoryNodes || (() => []);
const isHexInForeignFortTerritory = FT.isHexInForeignFortTerritory || (() => false);
const foundingNodesForOwner = FT.foundingNodesForOwner;

function mkHex(q, r) {
  return { coords: { q, r }, terenBazowy: TerenBazowy.Rownina, nakladka: Nakladka.Brak,
    rzeka: { obecna: false, krawedzie: [] }, ulepszenie: 'brak', wioska: { istnieje: false, ludnosc: 0 }, wlasciciel: null };
}
function mkMap(rad) {
  const hexes = {};
  for (let q = -rad; q <= rad; q++) for (let r = -rad; r <= rad; r++) hexes[`${q},${r}`] = mkHex(q, r);
  return { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };
}
function countOwned(map, nodes, owner) {
  let n = 0;
  for (const k of Object.keys(map.hexes)) { const [q, r] = k.split(',').map(Number); if (territoryOwnerAt(q, r, nodes) === owner) n++; }
  return n;
}

console.log('\n--- A: promienie i territoryOwnerAt ---');
const map = mkMap(15);
{
  const post = [{ q: 0, r: 0, ownerId: 3, type: 'posterunek' }];
  const fort = [{ q: 0, r: 0, ownerId: 3, type: 'fort' }];
  eq(cityTerritoryRadius({ q: 0, r: 0, pop: 0, level: 1, isOutpost: true }), 3, 'A1: promien posterunku 3');
  eq(cityTerritoryRadius({ q: 0, r: 0, pop: 0, level: 1, isFort: true }), 5, 'A2: promien fortu 5');
  eq(countOwned(map, fortTerritoryNodes(post), 3), 37, 'A3: posterunek -> 37 heksow (r=3) nalezy do wlasciciela');
  eq(countOwned(map, fortTerritoryNodes(fort), 3), 91, 'A4: fort -> 91 heksow (r=5) nalezy do wlasciciela');
  eq(territoryOwnerAt(3, 0, fortTerritoryNodes(post)), 3, 'A5: heks na krawedzi (dist 3) nalezy');
  eq(territoryOwnerAt(4, 0, fortTerritoryNodes(post)), null, 'A6: dist 4 poza posterunkiem');
  eq(territoryOwnerAt(5, 0, fortTerritoryNodes(fort)), 3, 'A7: fort dist 5 nalezy');
  eq(territoryOwnerAt(6, 0, fortTerritoryNodes(fort)), null, 'A8: fort dist 6 poza');
}

console.log('\n--- B: obcy nie buduje ulepszen, wlasciciel buduje ---');
{
  const nodes = fortTerritoryNodes([{ q: 0, r: 0, ownerId: 3, type: 'fort' }]);
  const mk = (me) => buildImprovementQualifier({
    map, cityNodes: [], territoryNodes: nodes, playerOwnerIdNum: me,
    researchedTechs: new Set(), ownUnitHexKeys: new Set(),
  });
  const owner = mk(3), foreign = mk(0);
  assert(owner('farma', 2, 1), 'B1: wlasciciel fortu buduje farme w zasiegu fortu (brak miasta)');
  assert(!foreign('farma', 2, 1), 'B2: OBCY nie buduje farmy w zasiegu cudzego fortu');
  const foreignUnit = buildImprovementQualifier({ map, cityNodes: [], territoryNodes: nodes, playerOwnerIdNum: 0,
    researchedTechs: new Set(), ownUnitHexKeys: new Set(['2,1']) });
  assert(!foreignUnit('fort', 2, 1), 'B3: OBCY z jednostka nie stawia fortu w terenie cudzego fortu');
  assert(!foreignUnit('posterunek', 2, 1), 'B4: ... ani posterunku');
  assert(!owner('farma', 6, 0), 'B5: poza zasiegiem fortu (dist 6) wlasciciel nie ma terytorium');
}

console.log('\n--- C: zakladanie miast, limit miast ---');
{
  const forts = [{ q: 0, r: 0, ownerId: 3, type: 'fort', contestedUseless: false }];
  const nodes = fortTerritoryNodes(forts);
  assert(isHexInForeignFortTerritory(3, 0, 0, forts, nodes), 'C1: obcy nie zaklada miasta w terytorium fortu');
  assert(!isHexInForeignFortTerritory(3, 0, 3, forts, nodes), 'C2: wlasciciel moze');
  assert(!isHexInForeignFortTerritory(6, 0, 0, forts, nodes), 'C3: poza zasiegiem fortu obcy moze');
  const mkCities = (n) => Array.from({ length: n }, (_, i) => ({ id: 'c' + i, ownerId: 3, q: 40 + i * 6, r: 40, population: 5 }));
  const bigMap = mkMap(60);
  const opts = { ownerId: 3, ownerEra: 1, gameConfig: { cityLimitBase: 10 },
    withinTerritory: (q, r) => M.isInTerritory(q, r, foundingNodesForOwner(3, [], forts)) };
  eq(canFoundCity(3, 0, mkCities(10), bigMap, opts).ok, false, 'C4: limit miast (10/10) blokuje zalozenie miasta');
  eq(countOwned(map, nodes, 3), 91, 'C5: ... ale 91 heksow terytorium fortu pozostaje wlasnoscia gracza (limit nie dotyka terytorium)');
  eq(canFoundCity(3, 0, mkCities(5), bigMap, opts).ok, true, 'C6: pod limitem wlasciciel zaklada miasto w terytorium fortu (rezerwacja)');
}

console.log('\n--- D: spor o ten sam heks ---');
{
  const forts = [
    { q: 0, r: 0, ownerId: 1, type: 'fort' },
    { q: 8, r: 0, ownerId: 2, type: 'fort' },
  ];
  const nodes = fortTerritoryNodes(forts);
  eq(territoryOwnerAt(4, 0, nodes), 1, 'D1: dist 4 vs 4 -> remis, pierwszy wezel');
  eq(territoryOwnerAt(5, 0, nodes), 2, 'D2: najblizszy wezel wygrywa (dist 5 vs 3)');
  const useless = fortTerritoryNodes([{ q: 0, r: 0, ownerId: 1, type: 'fort', contestedUseless: true }]);
  eq(useless.length, 0, 'D3: contestedUseless nie tworzy terytorium');
  const cityAndFort = [{ q: 0, r: 0, pop: 5, level: 1, ownerId: 1 }, ...fortTerritoryNodes([{ q: 7, r: 0, ownerId: 2, type: 'fort' }])];
  eq(territoryOwnerAt(5, 0, cityAndFort), 2, 'D4: fort (dist 2) wygrywa z miastem (dist 5) o heks na styku');
}

console.log('\n--- E: straznik main.ts ---');
{
  const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  const i = main.indexOf('function buildAllTerritoryNodes');
  const body = main.slice(i, i + 1200);
  assert(/fortTerritoryNodes\(\s*fortNodes\s*\)/.test(body), 'E1: buildAllTerritoryNodes dolacza fortTerritoryNodes(fortNodes)');
  const j = main.indexOf('function foundingTerritoryOpts');
  const fb = main.slice(j, j + 2600);
  assert(/isHexInForeignFortTerritory\(/.test(fb), 'E2: foundingTerritoryOpts blokuje teren obcego fortu');
  assert(/stare zapisy ze starymi fortami/.test(main), 'E3: backfill starych zapisow (fort bez wpisu w meta.fortNodes)');
  const k = main.indexOf('function registerFortNodeIfNeeded');
  assert(/refreshTerritoryBorderOverlay\(\)/.test(main.slice(k, k + 900)), 'E4: rejestracja fortu odswieza granice');
  const decl = main.indexOf('const fortNodes: FortNode[] = [];');
  assert(decl !== -1 && decl < i, 'E5: fortNodes zadeklarowane PRZED buildAllTerritoryNodes (TDZ)');
}

try { fs.unlinkSync(ENTRY); } catch (e) { /* noop */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* noop */ }
console.log(`\n=== fort-outpost-hard-territory-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
