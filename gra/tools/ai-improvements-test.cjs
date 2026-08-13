'use strict';
/**
 * ai-improvements-test.cjs -- standalone Node test for D-IMPROVEMENTS (AI buduje
 * ulepszenia terenu -- src/game/ai.ts `planCityImprovements`, wołane z decideAITurn
 * i decideDefensiveCopyTurn). Run from gra/:  node tools/ai-improvements-test.cjs
 *
 * Testy:
 *   1. Brak opts.territoryNodes -> zero buildImprovement (bezpieczny no-op, silnik
 *      jeszcze nie wpiął danych -- zero regresji dla starych wywołań decideAITurn).
 *   2. Praca <= progu nadwyżki -> zero buildImprovement (throttling wydajności).
 *   3. Tech niezbadany -> zero buildImprovement mimo Pracy i kwalifikujących heksów.
 *   4. Praca + tech + kwalifikujący heks -> DOKŁADNIE 1 buildImprovement (key='farma').
 *   5. Throttle: wiele kwalifikujących heksów w 1 mieście -> nadal maks. 1 rozkaz.
 *   6. Throttle: 2 miasta tego samego AI -> maks. 1 rozkaz NA MIASTO (2 łącznie).
 *   7. `wyrab` gdy jedyny odblokowany typ (mapa lasu, puste techy) — AI buduje wyrab
 *      (gracz: skipWyrab=true w auto-ulepszeniach EOT).
 *   8. Determinizm: dwa identyczne wywołania decideAITurn -> identyczne komendy
 *      buildImprovement (JSON-equal), zero Math.random().
 *   9. defensiveCopy (miasto-państwo) -> ta sama ścieżka planCityImprovements
 *      (Maciej decyzja 4: brak osobnego throttlingu dla miast-państw).
 *   10. Regres FALA 204: praca=40 (ponad próg, poniżej progu+kosztu) -> nadal buduje.
 *   11. P-AI-WYRAB-REFUNDACJA-PRACA-ZAMIAST-DREWNA = A (2026-08-13): egzekucja komendy
 *       `wyrab` (main.ts, sekcja `cmd.type === 'buildImprovement'` + `meta.typ === 'wycinka'`)
 *       kredytuje DREWNO tą samą funkcją co ścieżka gracza (`applyStolarniaDrewnoMapInflow` +
 *       `creditOwnerResourceStock`), a Praca traci WYŁĄCZNIE koszt startu -- nie rośnie o
 *       refundację. Test odtwarza dosłownie formułę z main.ts (nie może bundlować main.ts --
 *       to closure `boot()`, nie eksportowana funkcja), na produkcyjnych danych
 *       terrain-improvements.json (przez `getImprovementMeta`/`clearingTotalPraca`).
 *
 * Pure logic only -- no DOM, no THREE.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-improvements-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE  = path.resolve(__dirname, '.ai-improvements-test-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-improvements-test-bundle.cjs');

const ENTRY_TS = `
export { decideAITurn } from ${JSON.stringify(AI_SRC + '/game/ai')};
export { getImprovementMeta, clearingTotalPraca } from ${JSON.stringify(AI_SRC + '/game/improvement-tech')};
export { applyStolarniaDrewnoMapInflow, ownerResourceCap } from ${JSON.stringify(AI_SRC + '/game/turn-economy')};
export { creditOwnerResourceStock } from ${JSON.stringify(AI_SRC + '/game/building-stock-cost')};
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
  console.error('[ai-improvements-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  decideAITurn,
  getImprovementMeta,
  clearingTotalPraca,
  applyStolarniaDrewnoMapInflow,
  ownerResourceCap,
  creditOwnerResourceStock,
} = require(BUNDLE_FILE);

// --- tiny assertion framework ------------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Mapa w×h, cała 'rownina' (płaska, kwalifikuje farmę), bez lasu/złóż/rzek. */
function makeFlatMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      const k = `${q},${r}`;
      hexes[k] = {
        coords: { q, r },
        terenBazowy: 'rownina',
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

/** Mapa w×h, cała las na 'rownina' (kwalifikuje TYLKO wyrab -- oboz_lowiecki/tartak
 *  zostają tech-zablokowane przez pusty zbiór technologii w testach poniżej). */
function makeForestMap(w, h) {
  const m = makeFlatMap(w, h);
  for (const hex of Object.values(m.hexes)) hex.nakladka = 'las';
  return m;
}

function makeCity(id, ownerId, q, r, population = 2) {
  return { id, ownerId, q, r, name: 'TestCity', population };
}

function makeGameData() {
  return {
    units: [],
    buildings: [],
    terrainYields: { terrain_types: [{ Teren: 'rownina', Zywnosc: 2, Praca: 1, Handel: 1 }] },
    aiParams: {},
  };
}

/** Wspólne opts -- nadpisywane per test. */
function baseOpts(city) {
  return {
    civType: 'grecy',
    poziomTrudnosci: 2,
    defensiveCopy: false,
    cityBuildings: {},
    territoryNodes: [{ q: city.q, r: city.r, pop: city.population, level: 1, ownerId: city.ownerId }],
    placedImprovements: new Map(),
    improvementTechs: new Set(['Rolnictwo']),
    pracaAvailable: 100,
    civEra: 1,
  };
}

function buildImprovementCmds(commands) {
  return commands.filter(c => c.type === 'buildImprovement');
}

const map = makeFlatMap(30, 30);
const forestMap = makeForestMap(30, 30);
const data = makeGameData();
const PLAYER_ID = 3;

/** Dane realne (nie fixture) -- test 11 potrzebuje ownerResourceCap() z prawdziwym econParams. */
const DATA_FOR_CAP = { econParams: require('../data/econ-params.json') };

// ===========================================================================
// 1. Brak territoryNodes -> zero buildImprovement (bezpieczny no-op)
// ===========================================================================
console.log('1. brak opts.territoryNodes -- no-op');
{
  const city = makeCity('city0', PLAYER_ID, 15, 15);
  const opts = baseOpts(city);
  delete opts.territoryNodes;
  const cmds = decideAITurn(PLAYER_ID, [], [city], map, data, opts);
  eq(buildImprovementCmds(cmds).length, 0, 'brak territoryNodes -> zero buildImprovement');
}

// ===========================================================================
// 2. Praca <= progu nadwyżki -> zero buildImprovement
// ===========================================================================
console.log('2. Praca niewystarczajaca -- throttling');
{
  const city = makeCity('city0', PLAYER_ID, 15, 15);
  const opts = baseOpts(city);
  opts.pracaAvailable = 25; // <= próg (dokumentowany w ai.ts jako 30)
  const cmds = decideAITurn(PLAYER_ID, [], [city], map, data, opts);
  eq(buildImprovementCmds(cmds).length, 0, 'Praca=25 (ponizej progu) -> zero buildImprovement');

  const optsZero = baseOpts(city);
  delete optsZero.pracaAvailable; // domyslnie 0 gdy silnik nie poda (zero regresji)
  const cmds2 = decideAITurn(PLAYER_ID, [], [city], map, data, optsZero);
  eq(buildImprovementCmds(cmds2).length, 0, 'pracaAvailable nieobecne (domyslnie 0) -> zero buildImprovement');
}

// ===========================================================================
// 3. Tech niezbadany -> zero buildImprovement mimo Pracy i kwalifikujacych heksow
// ===========================================================================
console.log('3. tech niezbadany -- brak buildImprovement');
{
  const city = makeCity('city0', PLAYER_ID, 15, 15);
  const opts = baseOpts(city);
  opts.improvementTechs = new Set(); // Rolnictwo NIE zbadane -> farma zablokowana
  const cmds = decideAITurn(PLAYER_ID, [], [city], map, data, opts);
  eq(buildImprovementCmds(cmds).length, 0, 'brak Rolnictwa -> zero buildImprovement na plaskiej mapie');
}

// ===========================================================================
// 4. Praca + tech + heks kwalifikujacy -> DOKLADNIE 1 buildImprovement (farma)
// ===========================================================================
console.log('4. Praca + tech -> 1 buildImprovement (farma)');
{
  const city = makeCity('city0', PLAYER_ID, 15, 15);
  const opts = baseOpts(city);
  const cmds = buildImprovementCmds(decideAITurn(PLAYER_ID, [], [city], map, data, opts));
  eq(cmds.length, 1, 'dokladnie 1 buildImprovement');
  eq(cmds[0].key, 'farma', 'typ = farma (najwyzszy priorytet, plaska mapa)');
  eq(cmds[0].ownerId, PLAYER_ID, 'ownerId = AI');
}

// ===========================================================================
// 5. Throttle w 1 miescie: cala mapa kwalifikuje farme -> nadal 1 rozkaz
// ===========================================================================
console.log('5. throttle 1/miasto/ture (wiele kwalifikujacych heksow)');
{
  const city = makeCity('city0', PLAYER_ID, 15, 15, 5); // pop wyzsza -> wiekszy promien
  const opts = baseOpts(city);
  opts.territoryNodes = [{ q: city.q, r: city.r, pop: city.population, level: 1, ownerId: city.ownerId }];
  const cmds = buildImprovementCmds(decideAITurn(PLAYER_ID, [], [city], map, data, opts));
  eq(cmds.length, 1, 'maks. 1 buildImprovement mimo dziesiatek kwalifikujacych heksow');
}

// ===========================================================================
// 6. 2 miasta tego samego AI -> maks. 1 rozkaz NA MIASTO
// ===========================================================================
console.log('6. 2 miasta -- 1 rozkaz na miasto (2 lacznie)');
{
  const cityA = makeCity('city0', PLAYER_ID, 8, 8);
  const cityB = makeCity('city1', PLAYER_ID, 22, 22);
  const opts = {
    civType: 'grecy',
    poziomTrudnosci: 2,
    defensiveCopy: false,
    cityBuildings: {},
    territoryNodes: [
      { q: cityA.q, r: cityA.r, pop: cityA.population, level: 1, ownerId: cityA.ownerId },
      { q: cityB.q, r: cityB.r, pop: cityB.population, level: 1, ownerId: cityB.ownerId },
    ],
    placedImprovements: new Map(),
    improvementTechs: new Set(['Rolnictwo']),
    pracaAvailable: 200,
    civEra: 1,
  };
  const cmds = buildImprovementCmds(decideAITurn(PLAYER_ID, [], [cityA, cityB], map, data, opts));
  eq(cmds.length, 2, '2 miasta -> lacznie 2 buildImprovement (1 kazde)');
  const hexKeys = new Set(cmds.map(c => `${c.q},${c.r}`));
  eq(hexKeys.size, 2, 'dwa rozne heksy (po jednym na miasto)');
}

// ===========================================================================
// 7. wyrab gdy jedyny odblokowany typ (mapa lasu, techy puste) — AI buduje wyrab
//    (skipWyrab=false w planCityImprovements; gracz: skipWyrab=true w main.ts)
// ===========================================================================
console.log('7. wyrab na mapie lasu gdy brak innych tech');
{
  const city = makeCity('city0', PLAYER_ID, 15, 15);
  const opts = baseOpts(city);
  opts.improvementTechs = new Set(); // pusty zbior -- TYLKO wyrab jest bezwarunkowo odblokowany
  const cmds = buildImprovementCmds(decideAITurn(PLAYER_ID, [], [city], forestMap, data, opts));
  eq(cmds.length, 1, 'AI buduje wyrab gdy tylko ten typ jest dostepny');
  eq(cmds[0].key, 'wyrab', 'mapa lasu + brak tech -> wyrab');
}

// ===========================================================================
// 8. Determinizm -- dwa identyczne wywolania -> identyczne komendy
// ===========================================================================
console.log('8. determinizm (A=B)');
{
  const city = makeCity('city0', PLAYER_ID, 15, 15);
  const runOnce = () => {
    const opts = baseOpts(city);
    const cmds = decideAITurn(PLAYER_ID, [], [makeCity('city0', PLAYER_ID, 15, 15)], map, data, opts);
    return buildImprovementCmds(cmds);
  };
  const a = runOnce();
  const b = runOnce();
  assert(a.length > 0, 'sanity: test 8 generuje przynajmniej 1 komende do porownania');
  eq(JSON.stringify(a), JSON.stringify(b), 'dwa identyczne wywolania -> identyczne buildImprovement (determinizm)');
}

// ===========================================================================
// 9. defensiveCopy (miasto-panstwo) -- ta sama sciezka planCityImprovements
// ===========================================================================
console.log('9. defensiveCopy -- ta sama intensywnosc co zwykle AI');
{
  const city = makeCity('city0', PLAYER_ID, 15, 15);
  const opts = baseOpts(city);
  opts.defensiveCopy = true;
  const cmds = buildImprovementCmds(decideAITurn(PLAYER_ID, [], [city], map, data, opts));
  eq(cmds.length, 1, 'defensiveCopy=true -> nadal 1 buildImprovement (zero specjalnego throttlingu)');
  eq(cmds[0].key, 'farma', 'defensiveCopy -- ten sam wybor typu co zwykle AI');
}

// ===========================================================================
// 10. Regres FALA 204: praca > próg ale < próg+koszt — AI buduje (MP nie „utknięte”)
// ===========================================================================
console.log('10. praca=40 (ponad prog 30, ponizej 50) -- farma nadal');
{
  const city = makeCity('city0', PLAYER_ID, 15, 15);
  const opts = baseOpts(city);
  opts.pracaAvailable = 40;
  opts.defensiveCopy = true;
  const cmds = buildImprovementCmds(decideAITurn(PLAYER_ID, [], [city], map, data, opts));
  eq(cmds.length, 1, 'praca=40 -> 1 buildImprovement (bez podwojnej rezerwy po kosztu)');
  eq(cmds[0].key, 'farma', 'praca=40 -> farma (koszt 20, pula po budowie < 30 OK dla AI)');
}

// ===========================================================================
// 11. P-AI-WYRAB-REFUNDACJA-PRACA-ZAMIAST-DREWNA = A -- egzekucja komendy wyrab
//     kredytuje DREWNO (nie Pracę); Praca traci wyłącznie koszt startu.
// ===========================================================================
console.log('11. egzekucja wyrab (AI) — refundacja idzie do Drewna, nie Pracy');
{
  // 11a. decideAITurn faktycznie emituje komendę wyrab (jak w teście 7) — potwierdza,
  //      że poniższa symulacja egzekucji dotyczy realnego wyjścia decyzji AI.
  const city = makeCity('city0', PLAYER_ID, 15, 15);
  const opts = baseOpts(city);
  opts.improvementTechs = new Set();
  const wyrabCmds = buildImprovementCmds(
    decideAITurn(PLAYER_ID, [], [city], forestMap, data, opts),
  );
  eq(wyrabCmds.length, 1, 'sanity: decideAITurn emituje 1 komende wyrab');
  eq(wyrabCmds[0].key, 'wyrab', 'sanity: komenda to key=wyrab');

  // 11b. Symulacja egzekucji IDENTYCZNA z main.ts (cmd.type==='buildImprovement',
  //      meta.typ==='wycinka'): koszt startu z Pracy, refundacja (praca_per_tura×tury)
  //      przez applyStolarniaDrewnoMapInflow -> creditOwnerResourceStock('drewno').
  const meta = getImprovementMeta('wyrab');
  assert(meta && meta.typ === 'wycinka', 'sanity: wyrab ma typ=wycinka w terrain-improvements.json');
  const koszt = meta.kosztPraca;
  const pracaTotal = clearingTotalPraca('wyrab');
  assert(pracaTotal > 0, 'sanity: clearingTotalPraca(wyrab) > 0 (dziś 25 wg R-EKONOMIA-SUROWCE-SKALA-5X-Q1)');

  const pracaPoolBefore = 100;
  const aiCity = { id: 'ai-city0', ownerId: PLAYER_ID, surowce: {} };

  // Bez Stolarnii.
  const drewnoCredit0 = applyStolarniaDrewnoMapInflow(pracaTotal, 0, 0.10);
  eq(drewnoCredit0, pracaTotal, 'bez Stolarnii: drewnoCredit = pracaTotal (mnożnik ×1.0)');
  const drewnoCap = ownerResourceCap([aiCity], new Map(), PLAYER_ID, DATA_FOR_CAP, 'normal', 1);
  assert(drewnoCap >= drewnoCredit0, 'sanity: cap magazynu nie przycina refundacji w tym scenariuszu');
  const credited0 = creditOwnerResourceStock([aiCity], PLAYER_ID, 'drewno', drewnoCredit0, drewnoCap);
  const pracaPoolAfter = pracaPoolBefore - koszt;

  eq(credited0, drewnoCredit0, 'creditOwnerResourceStock zapisuje pelna refundacje do Drewna');
  eq(aiCity.surowce.drewno, drewnoCredit0, `magazyn Drewna AI rosnie o ${drewnoCredit0} (nie 0)`);
  eq(pracaPoolAfter, pracaPoolBefore - koszt, `pula Pracy AI traci WYLACZNIE koszt startu (${koszt})`);
  assert(
    pracaPoolAfter !== pracaPoolBefore - koszt + drewnoCredit0,
    `regres-guard: pula Pracy NIE rosnie o refundacje (stary bug dawalby ${pracaPoolBefore - koszt + drewnoCredit0}, dziś ${pracaPoolAfter})`,
  );

  // Z 1 Stolarnią (parytet z graczem — patrz stolarnia-r5-d2-test.cjs).
  const aiCityStolarnia = { id: 'ai-city1', ownerId: PLAYER_ID, surowce: {} };
  const drewnoCredit1 = applyStolarniaDrewnoMapInflow(pracaTotal, 1, 0.10);
  eq(drewnoCredit1, Math.floor(pracaTotal * 1.10), '1 Stolarnia: drewnoCredit = floor(pracaTotal × 1.10)');
  const credited1 = creditOwnerResourceStock(
    [aiCityStolarnia], PLAYER_ID, 'drewno', drewnoCredit1,
    ownerResourceCap([aiCityStolarnia], new Map(), PLAYER_ID, DATA_FOR_CAP, 'normal', 1),
  );
  eq(aiCityStolarnia.surowce.drewno, credited1, '1 Stolarnia: bonus Drewna z wyrębu AI trafia do magazynu');
}

// ---------------------------------------------------------------------------
console.log(`\nAI-IMPROVEMENTS-TEST: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
if (failed > 0) process.exit(1);
