'use strict';
/**
 * fort-placement-same-rules-as-city-test.cjs
 * R-WEB-TERRITORY-FORT-PLACEMENT-SAME-RULES-AS-CITY-Q1 (decyzja wlasciciela 2026-11-19:
 * "Budowanie zasiegu fortem powinno miec takie same reguly jak dla miasta").
 *
 * Tabela przypadkow na PRAWDZIWYCH funkcjach:
 *   - werdykt wlasnosci terytorium fortu/posterunku: isFortBuildBlockedByForeignTerritory(territoryOwnerAt(...))
 *   - werdykt wlasnosci terytorium miasta: withinTerritory (wlasne wezly) && !isHexInForeignFortTerritory
 * Asercje:
 *   (a) heks nalezacy do CUDZEJ cywilizacji (miasto lub fort w zasiegu) -> fort BLOKOWANY, miasto BLOKOWANE;
 *   (b) heks wlasny (miasto/fort wlasny) -> fort NIE blokowany przez wlasnosc, miasto dozwolone;
 *   (c) heks wolny -> fort dozwolony (zachowana dzisiejsza regula "gdziekolwiek"; miasto wymaga wlasnego
 *       terytorium — swiadoma roznica, nie zmieniana tym tematem);
 *   (d) przy zgodnym werdykcie wlasnosci: fortBlocked === cityBlockedByForeignOwnership na kazdym heksie.
 * Zmienna PLACEMENT_SRC (opcjonalna) -- inny katalog src (mutacja czerwona).
 * Run from gra/:  node tools/fort-placement-same-rules-as-city-test.cjs
 */
const fs = require('fs');
const path = require('path');
let passed = 0, failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }

const GRA = path.resolve(__dirname, '..');
const SRC = process.env.PLACEMENT_SRC ? path.resolve(process.env.PLACEMENT_SRC) : path.resolve(GRA, 'src');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const os = require('os');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fort-same-rules-'));
const ENTRY = path.join(tmp, 'entry.ts');
const BUNDLE = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(ENTRY, `
export * as FT from ${JSON.stringify(SRC + '/game/fort-territory')};
export { territoryOwnerAt, cityTerritoryRadius, axialDistance } from ${JSON.stringify(SRC + '/map/territory')};
`);
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent' });
} catch (e) { console.error('bundle failed', e.message || e); process.exit(1); }
const M = require(BUNDLE);
const { FT, territoryOwnerAt, cityTerritoryRadius, axialDistance } = M;

const ME = 1;
const FOREIGN = 2;

// Wezly miast (pop 3 -> promien miasta wg cityTerritoryRadius) i fortow (FT.fortTerritoryNodes).
const cities = [
  { q: 0, r: 0, ownerId: FOREIGN, pop: 3, level: 1 },   // cudze miasto
  { q: 20, r: 0, ownerId: ME, pop: 3, level: 1 },       // wlasne miasto
];
const forts = [
  { q: 40, r: 0, ownerId: FOREIGN, type: 'fort', builtAtTurn: 5, seq: 0 },   // cudzy fort, poza miastami
  { q: 60, r: 0, ownerId: ME, type: 'fort', builtAtTurn: 1, seq: 1 },        // wlasny fort (wczesniejszy)
  { q: 62, r: 0, ownerId: FOREIGN, type: 'fort', builtAtTurn: 2, seq: 2 },   // cudzy fort, nachodzacy na wlasny
];
const allNodes = [
  ...cities.map(c => ({ ...c })),
  ...FT.fortTerritoryNodes(forts),
];
const cityNodesOf = owner => cities.filter(c => c.ownerId === owner).map(c => ({ ...c }));
const ownFortNodes = owner => FT.fortTerritoryNodes(forts.filter(f => f.ownerId === owner));

// Werdykt miasta (wlasnosc terytorium): wlasne wezly musza objac heks ORAZ heks nie moze byc w cudzym forcie.
function cityOwnershipBlocked(q, r, owner) {
  const ownNodes = [...cityNodesOf(owner), ...ownFortNodes(owner)];
  const within = ownNodes.some(n => axialDistance(q, r, n.q, n.r) <= cityTerritoryRadius(n));
  const inForeignFort = FT.isHexInForeignFortTerritory(q, r, owner, forts, allNodes);
  return !(within && !inForeignFort);
}
// Werdykt fortu (wlasnosc terytorium): wspolny predykat.
function fortOwnershipBlocked(q, r, owner) {
  return FT.isFortBuildBlockedByForeignTerritory(territoryOwnerAt(q, r, allNodes), owner);
}

// Heks w zasiegu miasta (dist = promien - 1, >=1) lub tuz poza nim.
function hexAtDistance(cq, cr, dist) { return [cq + dist, cr]; }
const cityRad = cityTerritoryRadius(cities[0]); // promien cudzego miasta
const ownCityRad = cityTerritoryRadius(cities[1]);
const [inForeignCityQ, inForeignCityR] = hexAtDistance(0, 0, Math.max(1, cityRad - 1));
const [outForeignCityQ, outForeignCityR] = hexAtDistance(0, 0, cityRad + 1);
const [inOwnCityQ, inOwnCityR] = hexAtDistance(20, 0, Math.max(1, ownCityRad - 1));
const [inForeignFortQ, inForeignFortR] = [41, 0];                     // w zasiegu cudzego fortu (40,0)
const [inOverlapQ, inOverlapR] = [61, 0];                             // nachodzace forty: wczesniejszy (wlasny) wygrywa
const [freeQ, freeR] = [30, 5];                                       // poza wszystkim

const cases = [
  // name, q, r, expected: 'foreign' (both blocked) | 'own' (fort free, city ok) | 'free' (fort free, city blocked by own-territory rule)
  { name: 'w zasiegu cudzego miasta', q: inForeignCityQ, r: inForeignCityR, kind: 'foreign' },
  { name: 'na granicy/tuz poza cudzym miastem (wolny teren)', q: outForeignCityQ, r: outForeignCityR, kind: 'free' },
  { name: 'w zasiegu cudzego fortu', q: inForeignFortQ, r: inForeignFortR, kind: 'foreign' },
  { name: 'w zasiegu wlasnego miasta', q: inOwnCityQ, r: inOwnCityR, kind: 'own' },
  { name: 'nachodzace forty (wczesniejszy wlasny wygrywa)', q: inOverlapQ, r: inOverlapR, kind: 'own' },
  { name: 'wolny teren daleko od wszystkiego', q: freeQ, r: freeR, kind: 'free' },
];

console.log('== tabela przypadkow: fort vs miasto (wlasnosc terytorium) ==');
for (const c of cases) {
  const owner = territoryOwnerAt(c.q, c.r, allNodes);
  const fortBlocked = fortOwnershipBlocked(c.q, c.r, ME);
  const cityBlocked = cityOwnershipBlocked(c.q, c.r, ME);
  console.log(`  ${c.name} (${c.q},${c.r}) owner=${owner} fort=${fortBlocked ? 'BLOK' : 'ok'} miasto=${cityBlocked ? 'BLOK' : 'ok'}`);
  if (c.kind === 'foreign') {
    assert(owner === FOREIGN, `${c.name}: wlasciciel terenu = cudzy (${owner})`);
    assert(fortBlocked === true, `${c.name}: fort MUSI byc blokowany w cudzym terytorium`);
    assert(cityBlocked === true, `${c.name}: miasto blokowane w cudzym terytorium`);
    assert(fortBlocked === cityBlocked, `${c.name}: fort i miasto daja ten sam werdykt wlasnosci`);
  } else if (c.kind === 'own') {
    assert(owner === ME, `${c.name}: wlasciciel terenu = wlasny (${owner})`);
    assert(fortBlocked === false, `${c.name}: fort NIE blokowany przez wlasnosc we wlasnym terytorium`);
    assert(cityBlocked === false, `${c.name}: miasto dozwolone we wlasnym terytorium`);
    assert(fortBlocked === cityBlocked, `${c.name}: fort i miasto daja ten sam werdykt wlasnosci`);
  } else {
    assert(owner === null, `${c.name}: heks wolny (owner=${owner})`);
    // Swiadoma roznica zachowana: fort moze stac na wolnym terenie (dzisiejsza regula), miasto wymaga wlasnego terytorium.
    assert(fortBlocked === false, `${c.name}: fort dozwolony na wolnym terenie (regula zachowana)`);
    assert(cityBlocked === true, `${c.name}: miasto nie zalozy poza wlasnym terytorium`);
  }
}

// Przeglad calej siatki heksow wokol cudzego miasta: fort blokowany <=> heks nalezy do cudzego terytorium.
let grid = 0, mismatch = 0;
for (let q = -12; q <= 72; q++) {
  for (let r = -8; r <= 8; r++) {
    grid++;
    const owner = territoryOwnerAt(q, r, allNodes);
    const foreign = owner !== null && owner !== ME;
    if (fortOwnershipBlocked(q, r, ME) !== foreign) mismatch++;
  }
}
console.log(`  siatka ${grid} heksow: niezgodnosci fort<->wlasnosc = ${mismatch}`);
assert(mismatch === 0, 'fort blokowany dokladnie wtedy, gdy heks nalezy do cudzego terytorium (cale siatka)');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
