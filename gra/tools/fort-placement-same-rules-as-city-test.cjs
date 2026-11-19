'use strict';
/**
 * fort-placement-same-rules-as-city-test.cjs
 * R-WEB-TERRITORY-FORT-PLACEMENT-SAME-RULES-AS-CITY-Q1 (decyzja wlasciciela 2026-11-19:
 * "Budowanie zasiegu fortem powinno miec takie same reguly jak dla miasta").
 *
 * PRODUKCYJNA SCIEZKA (nie kopia werdyktu):
 *   - fort:   buildImprovementQualifier (map/improvement-build.ts, galaz 'fort') z jednostka
 *             wlasciciela na hexie (bramka jednostki spelniona, zostaje wlasnosc terytorium);
 *   - miasto: canFoundCity (game/cities.ts) z withinTerritory zbudowanym jak w main.ts
 *             (foundingTerritoryOpts: isInTerritory && !isHexInForeignFortTerritory), cities=[]
 *             (bez dystansu miast, zeby zostala tylko regula wlasnosci).
 * Asercje:
 *   (a) heks CUDZY (miasto lub fort w zasiegu) -> fort BLOKOWANY i miasto BLOKOWANE;
 *   (b) heks WLASNY -> fort i miasto dozwolone;
 *   (c) heks WOLNY -> fort dozwolony (zachowana dzisiejsza regula "gdziekolwiek"), miasto blokowane
 *       (wymaga wlasnego terytorium: swiadoma roznica, nieruszana tym tematem);
 *   (d) siatka heksow: fort blokowany <=> heks nalezy do cudzego terytorium.
 * Zmienna PLACEMENT_SRC (opcjonalna) -- inny katalog src (mutacja czerwona).
 * Run from gra/:  node tools/fort-placement-same-rules-as-city-test.cjs
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
let passed = 0, failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }

const GRA = path.resolve(__dirname, '..');
const SRC = process.env.PLACEMENT_SRC ? path.resolve(process.env.PLACEMENT_SRC) : path.resolve(GRA, 'src');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fort-same-rules-'));
const ENTRY = path.join(tmp, 'entry.ts');
const BUNDLE = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(ENTRY, `
export * as FT from ${JSON.stringify(SRC + '/game/fort-territory')};
export { territoryOwnerAt, cityTerritoryRadius, axialDistance, isInTerritory } from ${JSON.stringify(SRC + '/map/territory')};
export { buildImprovementQualifier } from ${JSON.stringify(SRC + '/map/improvement-build')};
export { canFoundCity } from ${JSON.stringify(SRC + '/game/cities')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`);
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent' });
} catch (e) { console.error('bundle failed', e.message || e); process.exit(1); }
const M = require(BUNDLE);
const { FT, territoryOwnerAt, isInTerritory, buildImprovementQualifier, canFoundCity, TerenBazowy, Nakladka } = M;

const ME = 1;
const FOREIGN = 2;

// Stan swiata: cudze miasto, cudzy fort, wlasny fort, wlasne miasto.
const cities = [
  { id: 'fx', q: 0, r: 0, ownerId: FOREIGN, population: 3, pop: 3, level: 1 },   // cudze miasto
  { id: 'my', q: 80, r: 0, ownerId: ME, population: 3, pop: 3, level: 1 },        // wlasne miasto
];
const forts = [
  { q: 30, r: 0, ownerId: FOREIGN, type: 'fort', builtAtTurn: 5, seq: 0 },         // cudzy fort
  { q: 60, r: 0, ownerId: ME, type: 'fort', builtAtTurn: 1, seq: 1 },              // wlasny fort
];
const cityNodes = cities.map(c => ({ ...c }));
const allNodes = [...cityNodes, ...FT.fortTerritoryNodes(forts)];

function mkHex(q, r) {
  return { coords: { q, r }, terenBazowy: TerenBazowy.Rownina, nakladka: Nakladka.Brak,
    rzeka: { obecna: false, krawedzie: [] }, ulepszenie: 'brak', wioska: { istnieje: false, ludnosc: 0 }, wlasciciel: null };
}
const map = { hexes: {}, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };
for (let q = -20; q <= 100; q++) for (let r = -15; r <= 15; r++) map.hexes[`${q},${r}`] = mkHex(q, r);

// Werdykt FORTU: produkcyjny qualifier z jednostka wlasciciela na hexie. true = BLOKOWANY.
function fortBlocked(q, r) {
  const qual = buildImprovementQualifier({
    map, cityNodes: [], territoryNodes: allNodes, playerOwnerIdNum: ME,
    researchedTechs: new Set(), ownUnitHexKeys: new Set([`${q},${r}`]),
  });
  return !qual('fort', q, r);
}
// Werdykt MIASTA: produkcyjne canFoundCity z withinTerritory jak main.ts (foundingTerritoryOpts).
function cityBlocked(q, r) {
  const ownFoundingNodes = FT.foundingNodesForOwner(ME, cityNodes.filter(c => c.ownerId === ME), forts);
  const opts = {
    ownerId: ME, ownerEra: 1, gameConfig: { cityLimitBase: 99 },
    withinTerritory: (fq, fr) => isInTerritory(fq, fr, ownFoundingNodes)
      && !FT.isHexInForeignFortTerritory(fq, fr, ME, forts, allNodes),
  };
  return !canFoundCity(q, r, [], map, opts).ok;
}

const cases = [
  // kind: 'foreign' (oba blokowane) | 'own' (oba dozwolone) | 'free' (fort dozwolony, miasto blokowane)
  { name: 'w zasiegu cudzego miasta', q: 1, r: 0, kind: 'foreign' },
  { name: 'na granicy cudzego miasta (wolny teren)', q: 6, r: 0, kind: 'free' },
  { name: 'w zasiegu cudzego fortu (dist 1)', q: 31, r: 0, kind: 'foreign' },
  { name: 'na krawedzi cudzego fortu (dist 5)', q: 35, r: 0, kind: 'foreign' },
  { name: 'tuz za cudzym fortem (dist 6)', q: 36, r: 0, kind: 'free' },
  { name: 'w zasiegu wlasnego fortu', q: 61, r: 0, kind: 'own' },
  { name: 'w zasiegu wlasnego miasta', q: 81, r: 0, kind: 'own' },
  { name: 'wolny teren daleko od wszystkiego', q: 50, r: 10, kind: 'free' },
];

console.log('== tabela przypadkow (produkcyjna sciezka): fort vs miasto ==');
for (const c of cases) {
  const owner = territoryOwnerAt(c.q, c.r, allNodes);
  const fb = fortBlocked(c.q, c.r);
  const cb = cityBlocked(c.q, c.r);
  console.log(`  ${c.name} (${c.q},${c.r}) owner=${owner} fort=${fb ? 'BLOK' : 'ok'} miasto=${cb ? 'BLOK' : 'ok'}`);
  if (c.kind === 'foreign') {
    assert(owner === FOREIGN, `${c.name}: wlasciciel terenu = cudzy (${owner})`);
    assert(fb === true, `${c.name}: fort MUSI byc blokowany w cudzym terytorium`);
    assert(cb === true, `${c.name}: miasto blokowane w cudzym terytorium`);
  } else if (c.kind === 'own') {
    assert(owner === ME, `${c.name}: wlasciciel terenu = wlasny (${owner})`);
    assert(fb === false, `${c.name}: fort NIE blokowany przez wlasnosc we wlasnym terytorium`);
    assert(cb === false, `${c.name}: miasto dozwolone we wlasnym terytorium`);
  } else {
    assert(owner === null, `${c.name}: heks wolny (owner=${owner})`);
    // Swiadoma roznica zachowana: fort na wolnym terenie (dzisiejsza regula), miasto wymaga wlasnego terytorium.
    assert(fb === false, `${c.name}: fort dozwolony na wolnym terenie (regula zachowana)`);
    assert(cb === true, `${c.name}: miasto nie zalozy poza wlasnym terytorium`);
  }
}

// Siatka heksow: fort blokowany <=> heks nalezy do cudzego terytorium (produkcyjny qualifier).
let grid = 0, mismatch = 0;
for (let q = -10; q <= 70; q++) {
  for (let r = -6; r <= 6; r++) {
    grid++;
    const owner = territoryOwnerAt(q, r, allNodes);
    const foreign = owner !== null && owner !== ME;
    if (fortBlocked(q, r) !== foreign) mismatch++;
  }
}
console.log(`  siatka ${grid} heksow: niezgodnosci fort<->wlasnosc = ${mismatch}`);
assert(mismatch === 0, 'fort blokowany dokladnie wtedy, gdy heks nalezy do cudzego terytorium (cala siatka)');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
