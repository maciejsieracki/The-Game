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
  // R2 (zarzut 1, ZALOZENIE): heks w promieniu miasta rozstrzyga miasto, nawet gdy cudzy fort jest blizej.
  eq(territoryOwnerAt(5, 0, cityAndFort), 1, 'D4: miasto (dist 5) ma pierwszenstwo przed cudzym fortem (dist 2) w swoim promieniu');
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
console.log('\n--- F: fort NIE odbiera heksow sasiedniemu miastu (R2, zarzut 1) ---');
{
  // miasto A (0,0) pop5, miasto B (9,0) pop5, fort A w (4,0) (w terytorium A)
  const cA = { q: 0, r: 0, pop: 5, level: 1, ownerId: 1 };
  const cB = { q: 9, r: 0, pop: 5, level: 1, ownerId: 2 };
  const fA = fortTerritoryNodes([{ q: 4, r: 0, ownerId: 1, type: 'fort' }]);
  const base = [cA, cB];
  const withFort = base.concat(fA);
  let lostB = 0, changedInCityRadius = 0;
  for (const k of Object.keys(map.hexes)) {
    const [q, r] = k.split(',').map(Number);
    const before = territoryOwnerAt(q, r, base);
    const after = territoryOwnerAt(q, r, withFort);
    if (before === 2 && after !== 2) lostB++;
    const inAnyCity = base.some(n => M.axialDistance(q, r, n.q, n.r) <= cityTerritoryRadius(n));
    if (inAnyCity && before !== after) changedInCityRadius++;
  }
  eq(lostB, 0, 'F1: fort A nie odbiera zadnego heksu miastu B');
  eq(changedInCityRadius, 0, 'F2: fort nie zmienia wlasciciela zadnego heksu w promieniu jakiegokolwiek miasta');
  // wolny teren (poza miastami) fort nadal zajmuje
  const free = [{ q: 0, r: 0, pop: 5, level: 1, ownerId: 1 }];
  eq(territoryOwnerAt(9, 0, free.concat(fortTerritoryNodes([{ q: 9, r: 0, ownerId: 1, type: 'fort' }]))), 1, 'F3: fort zajmuje wolny teren poza miastami');
  // dwa forty roznych cywilizacji bez miast: najblizszy wygrywa
  eq(territoryOwnerAt(3, 0, fortTerritoryNodes([{ q: 0, r: 0, ownerId: 1, type: 'fort' }, { q: 5, r: 0, ownerId: 2, type: 'fort' }])), 2, 'F4: spor fort-fort: najblizszy');
  // strazniki tekstowe
  const terr = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'map', 'territory.ts'), 'utf8');
  assert(/statsTerritoryNodesForOwner\(oid\)/.test(fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8')), 'F7: statystyki mocy licza terytorium fortow');
  assert(/bestCityOwner/.test(terr) && /bestFortOwner/.test(terr), 'F5: territoryOwnerAt ma pierwszenstwo miast przed fortami');
  // F6 (zarzut 3, wzorzec AI): fort/posterunek na GRANICY zasiegu miasta (FAZA 0 obrony AI),
  // dwa sasiednie miasta -> przyrost wylacznie z wolnego terenu, zero strat sasiada.
  for (const [ftype, rad] of [['fort', 5], ['posterunek', 3]]) {
    for (const gap of [9, 11, 12]) {
      const a = { q: 0, r: 0, pop: 5, level: 1, ownerId: 1 };
      const b = { q: gap, r: 0, pop: 5, level: 1, ownerId: 2 };
      const nodesBase = [a, b];
      const nodesF = nodesBase.concat(fortTerritoryNodes([{ q: 5, r: 0, ownerId: 1, type: ftype }]));
      let lost = 0, gained = 0;
      for (const k of Object.keys(map.hexes)) {
        const [q, r] = k.split(',').map(Number);
        const o0 = territoryOwnerAt(q, r, nodesBase), o1 = territoryOwnerAt(q, r, nodesF);
        if (o0 === 2 && o1 !== 2) lost++;
        if (o0 !== 1 && o1 === 1) gained++;
      }
      eq(lost, 0, `F6: ${ftype} AI na granicy miasta, sasiad w odl. ${gap}: strata sasiada`);
      assert(gained >= 0, 'F6: przyrost nieujemny');
    }
  }
}

console.log('\n--- G: R3 Q-B=B — sporny heks nalezy do WCZESNIEJSZEGO fortu ---');
{
  const mk = (a, b) => fortTerritoryNodes([
    { q: 0, r: 0, ownerId: 1, type: 'fort', builtAtTurn: a[0], seq: a[1] },
    { q: 8, r: 0, ownerId: 2, type: 'fort', builtAtTurn: b[0], seq: b[1] },
  ]);
  eq(territoryOwnerAt(5, 0, mk([3, 0], [7, 1])), 1, 'G1: wczesniejszy fort (tura 3) wygrywa sporny heks mimo wiekszej odleglosci (5 vs 3)');
  eq(territoryOwnerAt(5, 0, mk([9, 1], [2, 0])), 2, 'G2: wczesniejszy jest drugi fort -> jego');
  eq(territoryOwnerAt(4, 0, mk([9, 1], [2, 0])), 2, 'G3: remis odleglosci 4:4 -> wczesniejszy (drugi), nie "pierwszy w tablicy"');
  eq(territoryOwnerAt(3, 0, mk([9, 1], [2, 0])), 2, 'G4: heks blizej pozniejszego fortu (3 vs 5) -> wczesniejszy (drugi)');
  eq(territoryOwnerAt(2, 0, mk([9, 1], [2, 0])), 1, 'G5: heks w zasiegu tylko jednego fortu -> ten fort');
  eq(territoryOwnerAt(5, 0, mk([4, 0], [4, 1])), 1, 'G6: ta sama tura -> mniejszy seq');
  eq(territoryOwnerAt(5, 0, mk([4, 1], [4, 0])), 2, 'G7: ta sama tura, seq odwrotnie');
  const cityF = [{ q: 0, r: 0, pop: 5, level: 1, ownerId: 1 }].concat(fortTerritoryNodes([{ q: 7, r: 0, ownerId: 2, type: 'fort', builtAtTurn: 1, seq: 0 }]));
  eq(territoryOwnerAt(5, 0, cityF), 1, 'G8: miasto nadal wygrywa w swoim promieniu (fort wczesniejszy)');
  const old = [{ q: 0, r: 0, ownerId: 1, type: 'fort' }, { q: 8, r: 0, ownerId: 2, type: 'fort' }];
  const backfill = FT.backfillFortOrder || (() => -1);
  eq(backfill(old), 2, 'G9: backfill uzupelnia 2 wpisy');
  assert(old[0].seq === 0 && old[1].seq === 1 && old[0].builtAtTurn === 0, 'G10: backfill wg kolejnosci w tablicy');
  eq(territoryOwnerAt(5, 0, fortTerritoryNodes(old)), 1, 'G11: po backfillu starszy (indeks 0) wygrywa sporny heks (5 vs 3)');
  eq((FT.nextFortSeq || (() => -1))(old), 2, 'G12: nextFortSeq = max+1');
  eq(backfill(old), 0, 'G13: backfill idempotentny');
  const mixed = [{ q: 0, r: 0, ownerId: 1, type: 'fort', builtAtTurn: 5, seq: 7 }, { q: 8, r: 0, ownerId: 2, type: 'fort' }];
  backfill(mixed);
  eq(mixed[1].seq, 8, 'G14: backfill nie koliduje z istniejacym seq');
}

console.log('\n--- H: R3 Q-A=A — zdobycie fortu przez wejscie wojska ---');
{
  const war = (a, b) => (a === 1 && b === 2) || (a === 2 && b === 1);
  const mkF = () => [{ q: 0, r: 0, ownerId: 1, type: 'fort', builtAtTurn: 1, seq: 0 }];
  const U = (ownerId, q, r, military = true) => ({ ownerId, q, r, military });
  const cap = FT.applyFortCaptureByOccupation || (() => []);
  let f = mkF();
  let ev = cap(f, [U(2, 0, 0)], war);
  eq(ev.length, 1, 'H1: wrog (wojna) wchodzi na pusty fort -> zdobyty');
  eq(f[0].ownerId, 2, 'H2: ownerId fortu = zdobywca');
  eq(countOwned(map, fortTerritoryNodes(f), 2), 91, 'H3: zdobywca dostaje CALE terytorium fortu (91 heksow)');
  eq(countOwned(map, fortTerritoryNodes(f), 1), 0, 'H4: dotychczasowy wlasciciel traci terytorium');
  eq(f[0].seq, 0, 'H5: znacznik kolejnosci zostaje po zdobyciu');
  f = [{ q: 0, r: 0, ownerId: 1, type: 'posterunek' }];
  cap(f, [U(2, 0, 0)], war);
  eq(countOwned(map, fortTerritoryNodes(f), 2), 37, 'H6: posterunek zdobyty -> 37 heksow');
  f = mkF(); eq(cap(f, [], war).length, 0, 'H7: pusty fort bez wojsk wroga nie jest zdobywany');
  f = mkF(); eq(cap(f, [U(3, 0, 0)], war).length, 0, 'H8: pokoj/sojusz (brak wojny) -> brak zdobycia');
  f = mkF(); eq(cap(f, [U(2, 0, 0), U(1, 0, 0)], war).length, 0, 'H9: wlasciciel ma jednostke na heksie -> brak zdobycia');
  f = mkF(); eq(cap(f, [U(2, 0, 0, false)], war).length, 0, 'H10: cywil wroga nie zdobywa');
  f = mkF(); eq(cap(f, [U(2, 1, 0)], war).length, 0, 'H11: wrog na sasiednim heksie nie zdobywa (wejscie NA heks)');
  f = mkF(); eq(cap(f, [U(2, 0, 0)], () => true, (o) => o === 2).length, 0, 'H12: barbarzynca nie zdobywa fortu (zalozenie)');
  f = mkF(); eq(cap(f, [U(2, 0, 0), U(3, 0, 0)], () => true).length, 0, 'H13: heks z jednostkami roznych stron -> brak zdobycia (Q-E, stary mechanizm)');
  f = mkF(); cap(f, [U(2, 0, 0)], war); eq(cap(f, [U(2, 0, 0)], war).length, 0, 'H14: zdobycie idempotentne (ten sam wlasciciel)');
  f = mkF(); cap(f, [U(2, 0, 0)], war);
  eq(cap(f, [U(1, 0, 0)], war).length, 1, 'H15: poprzedni wlasciciel moze odbic fort tym samym torem');
}

console.log('\n--- I: straznik main.ts R3 ---');
{
  const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  assert(/builtAtTurn: turn, seq: nextFortSeq\(fortNodes\)/.test(main), 'I1: rejestracja fortu stempluje builtAtTurn+seq');
  assert(/backfillFortOrder\(fortNodes\)/.test(main), 'I2: wczytanie zapisu robi backfill kolejnosci');
  const calls = (main.match(/sweepFortCaptures\(\)/g) || []).length;
  assert(calls >= 6, `I3: sweepFortCaptures wolany w ruchu/bitwie/koncu tury (${calls} wywolan)`);
  assert(/function sweepFortCaptures/.test(main) && /applyFortCaptureByOccupation\(/.test(main), 'I4: sweep uzywa applyFortCaptureByOccupation');
}

console.log(`\n=== fort-outpost-hard-territory-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
