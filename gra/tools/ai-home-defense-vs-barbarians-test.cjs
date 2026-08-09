'use strict';
/**
 * ai-home-defense-vs-barbarians-test.cjs -- standalone Node test for the home-defense
 * priority in src/game/ai.ts (P-AI-NIE-BRONI-WLASNYCH-MIAST-PRZED-BARBARZYNCAMI, ECHO A,
 * Maciej 2026-08-09; runda 3, 2026-08-09).
 * Run from gra/:  node tools/ai-home-defense-vs-barbarians-test.cjs
 *
 * Decyzja Macieja (ECHO A): najwyższy priorytet — zlikwidować wrogie siły (w tym
 * barbarzyńców) na własnym terytorium lub w jego bezpośredniej okolicy, niezależnie od
 * stanu pokoju/wojny z kimkolwiek innym.
 *
 * Testy importują RZECZYWISTĄ implementację z ai.ts (przez esbuild bundle) -- nie
 * reimplementują logiki w pliku testu (patrz N6 rundy 2: „test kopiuje logikę zamiast
 * importować z ai.ts").
 *
 * T1: scenariusz bazowy -- zagrożenie w promieniu wykrywania, AI broni domu zamiast
 *     maszerować na odległe wrogie miasto (odtworzenie pierwotnego zgłoszenia Macieja).
 * T2: granica ujemna (miasto pop=5, promień wykrywania=9) -- zagrożenie TUŻ POZA
 *     zasięgiem NIE wyzwala obrony domu (AI maszeruje na wrogie miasto jak dawniej).
 * T3: RUNDA 3 pkt 2 -- miasto o WYŻSZEJ populacji (pop=15, promień wykrywania=19),
 *     zagrożenie w pierścieniu 10-19 hex (poza starym stałym prefiltrem=9 z rundy 2,
 *     wewnątrz realnego zasięgu wykrywania) -- AI MUSI się bronić.
 * T4: granica ujemna dla wysokiej populacji (pop=15) -- zagrożenie TUŻ POZA zasięgiem 19
 *     NIE wyzwala obrony domu.
 * T5: RUNDA 3 pkt 3 -- scenariusz DYSKRYMINUJĄCY podwójne zaangażowanie: przydzielony
 *     obrońca stoi NA HEKSIE MIASTA (nie sąsiaduje z zagrożeniem); INNA jednostka
 *     (kategoria 'super', przetwarzana pierwsza) already zaatakowała to samo zagrożenie
 *     w kroku 4b -- obrońca NIE MA dostać rozkazu ruchu (zagrożenie już obsłużone).
 * T6: formuła isHomeDefenseThreatForCity -- jednostkowa weryfikacja dokładnej granicy
 *     (promień terytorium + 2*AI_HOME_DEFENSE_VICINITY_HEX) dla kilku populacji.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-home-defense-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE  = path.resolve(__dirname, '.ai-home-defense-test-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-home-defense-test-bundle.cjs');

const ENTRY_TS = `
export { decideAITurn, isHomeDefenseThreatForCity, assignHomeDefenders, AI_HOME_DEFENSE_VICINITY_HEX } from ${JSON.stringify(AI_SRC + '/game/ai')};
export { hexDistance } from ${JSON.stringify(AI_SRC + '/units/setup')};
export { cityTerritoryRadius } from ${JSON.stringify(AI_SRC + '/map/territory')};
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
  console.error('[ai-home-defense-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const AI = require(BUNDLE_FILE);
const {
  decideAITurn, isHomeDefenseThreatForCity, assignHomeDefenders,
  AI_HOME_DEFENSE_VICINITY_HEX, hexDistance, cityTerritoryRadius,
} = AI;

// --- tiny assertion framework ----------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ---------------------------------------------------------------------------
// Helpers (wzorem tools/ai-test.cjs)
// ---------------------------------------------------------------------------

/** Mapa w x h heksów łąki (przechodnia), bez wiosek, bez rzek. */
function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      const k = `${q},${r}`;
      hexes[k] = {
        coords: { q, r },
        terenBazowy: 'laka',
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

function makeUnit(id, ownerId, q, r, category = 'miecznik') {
  return { id, ownerId, typeId: 'Wojownik', category, q, r, ruch: 2, ruchLeft: 2 };
}

function makeCity(id, ownerId, q, r, population) {
  return { id, ownerId, q, r, name: 'TestCity', population };
}

function makeGameData() {
  return {
    units: [
      { Jednostka: 'Wojownik', Health: 30, Ruch: 2 },
    ],
    buildings: [
      { id: 'koszary', nazwa: 'Koszary' },
    ],
    terrainYields: {
      terrain_types: [
        { Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 },
      ],
    },
    aiParams: {},
  };
}

const data = makeGameData();

// ---------------------------------------------------------------------------
// T1: scenariusz bazowy -- zagrożenie WEWNĄTRZ zasięgu wykrywania (miasto pop=5,
// promień terytorium=5, zasięg wykrywania=5+2*2=9), odległe wrogie miasto istnieje
// (odtworzenie pierwotnego zgłoszenia: AI ma iść na odsiecz, nie maszerować dalej).
// ---------------------------------------------------------------------------
console.log('\n--- T1: zagrożenie w zasięgu -- AI broni domu zamiast maszerować na odległe miasto ---');
{
  const map = makeMap(60, 60);
  const myCity = makeCity('c1', 1, 25, 25, 5);
  const enemyCity = makeCity('ec1', 2, 2, 25, 5); // dystans 23 wzdłuż tego samego wiersza
  const threat = makeUnit('barb1', 99, 25, 32);   // dystans 7 od miasta (promień 5 + 2*2=9)
  const unit = makeUnit('u1', 1, 25, 25);

  eq(hexDistance(threat.q, threat.r, myCity.q, myCity.r), 7, 'T1 setup: zagrożenie 7 hex od miasta');
  const result = decideAITurn(1, [unit, threat], [myCity, enemyCity], map, data, {});

  const cmd = result.find(c => c.unitId === unit.id);
  assert(cmd !== undefined, 'T1: jednostka dostaje jakąś komendę');
  if (cmd !== undefined) {
    eq(cmd.type, 'move', 'T1: komenda to ruch');
    assert(cmd.toR > 25, `T1: ruch W STRONĘ zagrożenia (toR>25, na południe), nie w stronę odległego miasta (got toQ=${cmd.toQ}, toR=${cmd.toR})`);
  }
}

// ---------------------------------------------------------------------------
// T2: granica ujemna -- zagrożenie TUŻ POZA zasięgiem wykrywania (promień 5 + 2*2=9,
// dystans=10) NIE wyzwala obrony domu; AI maszeruje na wrogie miasto jak bez zmiany.
// ---------------------------------------------------------------------------
console.log('\n--- T2: zagrożenie TUŻ POZA zasięgiem (dystans 10 > 9) -- obrona domu NIE wyzwolona ---');
{
  const map = makeMap(60, 60);
  const myCity = makeCity('c1', 1, 25, 25, 5);
  const enemyCity = makeCity('ec1', 2, 2, 25, 5);
  const threat = makeUnit('barb1', 99, 25, 35); // dystans 10 (poza zasięgiem 9)
  const unit = makeUnit('u1', 1, 25, 25);

  eq(hexDistance(threat.q, threat.r, myCity.q, myCity.r), 10, 'T2 setup: zagrożenie 10 hex od miasta');
  const result = decideAITurn(1, [unit, threat], [myCity, enemyCity], map, data, {});

  const cmd = result.find(c => c.unitId === unit.id);
  assert(cmd !== undefined, 'T2: jednostka dostaje jakąś komendę');
  if (cmd !== undefined) {
    eq(cmd.type, 'move', 'T2: komenda to ruch');
    assert(cmd.toQ < 25, `T2: ruch W STRONĘ wrogiego miasta (toQ<25), obrona domu nie wyzwolona (got toQ=${cmd.toQ}, toR=${cmd.toR})`);
  }
}

// ---------------------------------------------------------------------------
// T3 (RUNDA 3, pkt 2): miasto o wyższej populacji (pop=15 -> promień terytorium
// 15, cap), zagrożenie w dystansie 14 -- POZA starym stałym prefiltrem rundy 2
// (=9), WEWNĄTRZ realnego zasięgu wykrywania dla tej populacji (15+2*2=19).
// To dokładnie klasa regresu, którą runda 2 wprowadziła: flat prefilter=9 gubił
// zagrożenia w pierścieniu 10-19 hex dla miast pop>5.
// ---------------------------------------------------------------------------
console.log('\n--- T3 (runda 3 pkt 2): miasto pop=15, zagrożenie 14 hex (poza prefiltrem=9, w zasięgu 19) ---');
{
  const map = makeMap(60, 60);
  const myCity = makeCity('c1', 1, 25, 25, 15);
  const enemyCity = makeCity('ec1', 2, 2, 25, 5);
  const threat = makeUnit('barb1', 99, 25, 39); // dystans 14
  const unit = makeUnit('u1', 1, 25, 25);

  eq(cityTerritoryRadius({ q: 25, r: 25, pop: 15, level: 1 }), 15, 'T3 setup: promień terytorium pop=15 = 15 (cap)');
  eq(hexDistance(threat.q, threat.r, myCity.q, myCity.r), 14, 'T3 setup: zagrożenie 14 hex od miasta');
  assert(14 > 9, 'T3 setup: 14 > stary stały prefilter rundy 2 (=9)');
  assert(14 <= 15 + 2 * AI_HOME_DEFENSE_VICINITY_HEX, 'T3 setup: 14 <= realny zasięg wykrywania (15+2*vicinity=19)');

  const result = decideAITurn(1, [unit, threat], [myCity, enemyCity], map, data, {});
  const cmd = result.find(c => c.unitId === unit.id);
  assert(cmd !== undefined, 'T3: jednostka dostaje jakąś komendę');
  if (cmd !== undefined) {
    eq(cmd.type, 'move', 'T3: komenda to ruch');
    assert(cmd.toR > 25, `T3: AI MUSI się bronić -- ruch W STRONĘ zagrożenia (toR>25), nie w stronę odległego miasta (got toQ=${cmd.toQ}, toR=${cmd.toR})`);
  }
}

// ---------------------------------------------------------------------------
// T4: granica ujemna dla wysokiej populacji -- zagrożenie tuż POZA realnym
// zasięgiem 19 (dystans 20) NIE wyzwala obrony domu.
// ---------------------------------------------------------------------------
console.log('\n--- T4: miasto pop=15, zagrożenie 20 hex (poza realnym zasięgiem 19) -- obrona NIE wyzwolona ---');
{
  const map = makeMap(60, 60);
  const myCity = makeCity('c1', 1, 25, 25, 15);
  const enemyCity = makeCity('ec1', 2, 2, 25, 5);
  const threat = makeUnit('barb1', 99, 25, 45); // dystans 20
  const unit = makeUnit('u1', 1, 25, 25);

  eq(hexDistance(threat.q, threat.r, myCity.q, myCity.r), 20, 'T4 setup: zagrożenie 20 hex od miasta');
  const result = decideAITurn(1, [unit, threat], [myCity, enemyCity], map, data, {});
  const cmd = result.find(c => c.unitId === unit.id);
  assert(cmd !== undefined, 'T4: jednostka dostaje jakąś komendę');
  if (cmd !== undefined) {
    eq(cmd.type, 'move', 'T4: komenda to ruch');
    assert(cmd.toQ < 25, `T4: ruch W STRONĘ wrogiego miasta (toQ<25), obrona domu nie wyzwolona dla zagrożenia poza zasięgiem (got toQ=${cmd.toQ}, toR=${cmd.toR})`);
  }
}

// ---------------------------------------------------------------------------
// T5 (RUNDA 3, pkt 3): scenariusz DYSKRYMINUJĄCY podwójne zaangażowanie.
// Dwa miasta (City1 = dom obrońcy B, City2 = w pobliżu zagrożeń X i X2).
// Jednostka A (kategoria 'super', przetwarzana PIERWSZA w sortedUnits) stoi
// SĄSIADUJĄCO z zagrożeniem X i zaatakuje je w kroku 4b niezależnie od
// przydziału obrońców. assignHomeDefenders (najbliższy-dostępny) przydziela:
//   - X2 (bliżej City2, przetwarzane pierwsze wg pilności) -> A (najbliższy)
//   - X (przetwarzane drugie) -> B (jedyny pozostały), mimo że B stoi NA
//     HEKSIE City1, daleko od X.
// Oczekiwanie: skoro A już "obsłuży" X w kroku 4b (handledThreatIds), B NIE
// dostaje żadnej komendy ruchu w stronę X (zostaje w mieście) -- w przeciwieństwie
// do zmutowanej wersji bez handledThreatIds, gdzie B dostałby komendę ruchu.
// ---------------------------------------------------------------------------
console.log('\n--- T5 (runda 3 pkt 3): podwójne zaangażowanie -- obrońca na heksie miasta, zagrożenie już obsłużone ---');
{
  const map = makeMap(60, 60);
  const city1 = makeCity('c1', 1, 10, 10, 5);
  const city2 = makeCity('c2', 1, 30, 10, 5);
  const x2 = makeUnit('x2', 99, 29, 10); // dystans do city2 = 1 (najpilniejsze)
  const x  = makeUnit('x',  99, 33, 10); // dystans do city2 = 3
  const unitA = makeUnit('A', 1, 32, 10, 'super'); // sąsiaduje z X (dystans 1); dystans do X2 = 3
  const unitB = makeUnit('B', 1, 10, 10, 'miecznik'); // NA HEKSIE City1; dystans do X2=19, do X=23

  eq(hexDistance(x2.q, x2.r, city2.q, city2.r), 1, 'T5 setup: X2 dystans 1 od City2');
  eq(hexDistance(x.q, x.r, city2.q, city2.r), 3, 'T5 setup: X dystans 3 od City2');
  assert(hexDistance(unitA.q, unitA.r, x.q, x.r) === 1, 'T5 setup: A sąsiaduje z X');
  assert(hexDistance(unitA.q, unitA.r, x2.q, x2.r) < hexDistance(unitB.q, unitB.r, x2.q, x2.r),
    'T5 setup: A bliżej X2 niż B (A wygrywa przydział do X2, zostawiając B jedynym kandydatem do X)');

  // Weryfikacja bezpośrednia assignHomeDefenders (bez przechodzenia przez całe decideAITurn) --
  // potwierdza, że przydział jest dokładnie taki, jak zakłada scenariusz.
  const assignments = assignHomeDefenders([x, x2], [unitA, unitB], [city1, city2]);
  eq(assignments.get('A') && assignments.get('A').id, 'x2', 'T5 setup: A przydzielone do X2 (najbliższy-dostępny)');
  eq(assignments.get('B') && assignments.get('B').id, 'x', 'T5 setup: B przydzielone do X (jedyny pozostały)');

  const result = decideAITurn(1, [unitA, unitB, x, x2], [city1, city2], map, data, {});

  const attackA = result.find(c => c.unitId === 'A' && c.type === 'attack');
  assert(attackA !== undefined, 'T5: A atakuje sąsiednie zagrożenie w kroku 4b');
  if (attackA !== undefined) {
    eq(attackA.targetUnitId, 'x', 'T5: A atakuje konkretnie X (sąsiada)');
  }

  const cmdsB = result.filter(c => c.unitId === 'B');
  eq(cmdsB.length, 0, `T5: B NIE dostaje ŻADNEJ komendy -- zagrożenie X już obsłużone przez A w 4b (got ${JSON.stringify(cmdsB)})`);
}

// ---------------------------------------------------------------------------
// T6: jednostkowa weryfikacja formuły isHomeDefenseThreatForCity dla kilku
// populacji (dokładna granica, nie tylko zachowanie end-to-end).
// ---------------------------------------------------------------------------
console.log('\n--- T6: formuła isHomeDefenseThreatForCity -- dokładna granica per populacja ---');
{
  const cases = [
    { pop: 2,  expectedRadius: 5 },  // cap min 5
    { pop: 5,  expectedRadius: 5 },
    { pop: 12, expectedRadius: 12 },
    { pop: 15, expectedRadius: 15 },
    { pop: 20, expectedRadius: 15 }, // cap 15
  ];
  for (const { pop, expectedRadius } of cases) {
    const city = { id: 'c', ownerId: 1, q: 0, r: 0, name: 'c', population: pop };
    const detectRadius = expectedRadius + 2 * AI_HOME_DEFENSE_VICINITY_HEX;
    assert(
      isHomeDefenseThreatForCity(detectRadius, 0, city) === true,
      `T6 pop=${pop}: dystans=${detectRadius} (dokładna granica) -> zagrożenie WYKRYTE`,
    );
    assert(
      isHomeDefenseThreatForCity(detectRadius + 1, 0, city) === false,
      `T6 pop=${pop}: dystans=${detectRadius + 1} (1 hex za granicą) -> zagrożenie NIEWYKRYTE`,
    );
  }
}

// ---------------------------------------------------------------------------
console.log(`\nai-home-defense-vs-barbarians-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
