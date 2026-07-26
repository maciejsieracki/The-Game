'use strict';
/**
 * tarasy-cywilizacje-test.cjs -- C-TARASY-Q1 (Maciej 2026-07-26): "Tarasy uprawne"
 * dostępne WYŁĄCZNIE dla Chińczyków i Inków (cofnięcie T-TECH-4 z 2026-07-04, które
 * otworzyło ulepszenie dla wszystkich cywilizacji). Testuje mechanizm OGÓLNY
 * (`cywilizacje` w terrain-improvements.json + `isImprovementAllowedForCiv`,
 * game/terrain-improvements.ts) w OBU miejscach, w których jest wpięty:
 *
 *   A) gracz  -- main.ts refreshBuildApi owija buildApi z: canBuild(key,q,r) =
 *      isImprovementAllowedForCiv(key, civ) && rawApi.canBuild(key,q,r). Testujemy
 *      dokładnie to samo złożenie (isImprovementAllowedForCiv + buildImprovementQualifier
 *      surowy z map/improvement-build.ts), bo main.ts jest DOM-zależny i nie da się
 *      go tu odpalić.
 *   B) AI     -- game/ai.ts planCityImprovements (przez decideAITurn) sprawdza
 *      isImprovementAllowedForCiv(key, civArchetype) PRZED qualifies() -- ownerId
 *      -agnostyczne (parytet: identyczna reguła dla gracza i AI, zero rozgałęzień
 *      po ownerId).
 *
 * Run from gra/:  node tools/tarasy-cywilizacje-test.cjs
 * Pure logic only -- no DOM, no THREE.
 */

const fs = require('fs');
const path = require('path');
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[tarasy-cywilizacje-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.tarasy-cywilizacje-test-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.tarasy-cywilizacje-test-bundle.cjs');

const ENTRY_TS = `
export { isImprovementAllowedForCiv } from ${JSON.stringify(SRC + '/game/terrain-improvements')};
export { buildImprovementQualifier } from ${JSON.stringify(SRC + '/map/improvement-build')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[tarasy-cywilizacje-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const { isImprovementAllowedForCiv, buildImprovementQualifier, decideAITurn } = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ===========================================================================
// A) Gracz -- isImprovementAllowedForCiv + buildImprovementQualifier surowy
//    (dokladnie zlozenie uzywane przez main.ts refreshBuildApi.canBuild)
// ===========================================================================
console.log('A. gracz -- canBuild = isImprovementAllowedForCiv && qualifies (jak main.ts)');
{
  const cityNodes = [{ q: 0, r: 0, pop: 10, level: 1 }];
  const territoryNodes = [{ q: 0, r: 0, pop: 10, level: 1, ownerId: 0 }];
  const hexes = {
    '0,0': { coords: { q: 0, r: 0 }, terenBazowy: 'rownina', nakladka: 'brak', zloze: undefined,
      rzeka: { obecna: false, krawedzie: [] }, ulepszenie: 'brak', wioska: { istnieje: false, ludnosc: 0 }, wlasciciel: '0' },
    '0,1': { coords: { q: 0, r: 1 }, terenBazowy: 'wzgorza', nakladka: 'brak', zloze: undefined,
      rzeka: { obecna: false, krawedzie: [] }, ulepszenie: 'brak', wioska: { istnieje: false, ludnosc: 0 }, wlasciciel: '0' },
  };
  const map = { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };

  function canBuildForCiv(civ, key, q, r) {
    const qualifies = buildImprovementQualifier({
      map, cityNodes, territoryNodes,
      playerOwnerIdNum: 0,
      playerCivArchetype: civ,
      playerEra: 2,
    });
    return isImprovementAllowedForCiv(key, civ) && qualifies(key, q, r);
  }

  assert(canBuildForCiv('chinczycy', 'tarasy', 0, 1), 'C-TARASY-Q1: Chinczycy MOGA postawic tarasy na wzgorzu');
  assert(canBuildForCiv('inkowie', 'tarasy', 0, 1), 'C-TARASY-Q1: Inkowie MOGA postawic tarasy na wzgorzu');
  assert(!canBuildForCiv('rzymianie', 'tarasy', 0, 1), 'C-TARASY-Q1: Rzymianie NIE MOGA postawic tarasow');
  assert(!canBuildForCiv('grecy', 'tarasy', 0, 1), 'C-TARASY-Q1: Grecy NIE MOGA postawic tarasow');
  assert(!canBuildForCiv('zulusi', 'tarasy', 0, 1), 'C-TARASY-Q1: Zulusi NIE MOGA postawic tarasow');
  assert(!canBuildForCiv(undefined, 'tarasy', 0, 1), 'C-TARASY-Q1: brak cywilizacji (undefined) NIE MOZE');

  // isImprovementAllowedForCiv w izolacji (bez terenu/terytorium) -- ogolny mechanizm.
  assert(isImprovementAllowedForCiv('tarasy', 'chinczycy'), 'isImprovementAllowedForCiv: chinczycy OK');
  assert(isImprovementAllowedForCiv('tarasy', 'Inkowie'), 'isImprovementAllowedForCiv: wielkosc liter ignorowana');
  assert(!isImprovementAllowedForCiv('tarasy', 'sumer'), 'isImprovementAllowedForCiv: sumer zablokowany');
  assert(isImprovementAllowedForCiv('farma', 'sumer'), 'isImprovementAllowedForCiv: ulepszenie bez pola cywilizacje = dostepne dla wszystkich');
  assert(isImprovementAllowedForCiv('lama', 'rzymianie'), 'isImprovementAllowedForCiv: lama NIE ma pola cywilizacje (gate osobny, isIncaCiv w livestock-unlock.ts) -- ten mechanizm jej nie dotyczy');
}

// ===========================================================================
// B) AI -- decideAITurn -> planCityImprovements respektuje isImprovementAllowedForCiv
//    (parytet: sama reguła co dla gracza, zero rozgałęzień po ownerId)
// ===========================================================================
console.log('B. AI -- planCityImprovements (przez decideAITurn)');

/** Mapa w×h, cala Wzgorza (kwalifikuje TYLKO tarasy, gdy jedyna zbadana technologia
 *  to Rolnictwo -- farma/bydlo/owce/lama/etc. odpadaja na terenie lub braku techu,
 *  patrz komentarz nizej). */
function makeHillsMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      const k = `${q},${r}`;
      hexes[k] = {
        coords: { q, r },
        terenBazowy: 'wzgorza',
        nakladka: 'brak',
        ulepszenie: 'brak',
        wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
}

function makeCity(id, ownerId, q, r, population = 2) {
  return { id, ownerId, q, r, name: 'TestCity', population };
}

function makeGameData() {
  return {
    units: [],
    buildings: [],
    terrainYields: { terrain_types: [{ Teren: 'wzgorza', Zywnosc: 1, Praca: 1, Handel: 1 }] },
    aiParams: {},
  };
}

const hillsMap = makeHillsMap(30, 30);
const data = makeGameData();
const AI_ID = 3;

function baseOpts(city, civType) {
  return {
    civType,
    poziomTrudnosci: 2,
    defensiveCopy: false,
    cityBuildings: {},
    territoryNodes: [{ q: city.q, r: city.r, pop: city.population, level: 1, ownerId: city.ownerId }],
    placedImprovements: new Map(),
    // Rolnictwo = jedyna technologia zbadana -- farma odpada na tym terenie (Wzgorza
    // bez lasu), bydlo/owce/lama/stadnina/etc. wymagaja innych technologii (nie w
    // tym zbiorze) -- tarasy zostaje JEDYNYM kandydatem, ktorego kwalifikacja zalezy
    // wylacznie od bramki cywilizacji.
    improvementTechs: new Set(['Rolnictwo']),
    pracaAvailable: 100,
    civEra: 2,
  };
}

function buildImprovementCmds(commands) {
  return commands.filter(c => c.type === 'buildImprovement');
}

{
  const cityChiny = makeCity('city0', AI_ID, 15, 15);
  const cmds = buildImprovementCmds(
    decideAITurn(AI_ID, [], [cityChiny], hillsMap, data, baseOpts(cityChiny, 'chinczycy')),
  );
  eq(cmds.length, 1, 'AI Chinczycy: dokladnie 1 buildImprovement');
  eq(cmds[0].key, 'tarasy', 'AI Chinczycy: typ = tarasy (jedyny kwalifikujacy sie na tej mapie)');
}
{
  const cityInca = makeCity('city0', AI_ID, 15, 15);
  const cmds = buildImprovementCmds(
    decideAITurn(AI_ID, [], [cityInca], hillsMap, data, baseOpts(cityInca, 'inkowie')),
  );
  eq(cmds.length, 1, 'AI Inkowie: dokladnie 1 buildImprovement');
  eq(cmds[0].key, 'tarasy', 'AI Inkowie: typ = tarasy');
}
{
  const cityRzym = makeCity('city0', AI_ID, 15, 15);
  const cmds = buildImprovementCmds(
    decideAITurn(AI_ID, [], [cityRzym], hillsMap, data, baseOpts(cityRzym, 'rzymianie')),
  );
  eq(cmds.length, 0, 'AI Rzymianie: ZERO buildImprovement -- tarasy zablokowane, brak innego kandydata');
}
{
  const cityGrecy = makeCity('city0', AI_ID, 15, 15);
  const cmds = buildImprovementCmds(
    decideAITurn(AI_ID, [], [cityGrecy], hillsMap, data, baseOpts(cityGrecy, 'grecy')),
  );
  eq(cmds.length, 0, 'AI Grecy: ZERO buildImprovement -- tarasy zablokowane, parytet z Rzymianami');
}

// ---------------------------------------------------------------------------
console.log(`\nTARASY-CYWILIZACJE-TEST: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
if (failed > 0) process.exit(1);
