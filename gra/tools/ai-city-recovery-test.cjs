'use strict';
/**
 * ai-city-recovery-test.cjs
 * P-AI-EKSPANSJA-ODBUDOWA-MIAST-PO-WOJNIE-Q1 (Operator, runda 1).
 *
 * DOWÓD PRZED/PO: symulacja tury-po-turze cywilizacji AI (ekspansywnosc=0, więc
 * aiMayBypassClusterConsolidation dawał false ZAWSZE przed tym tematem — próg
 * EKSPANSJA_KLASTR_BYPASS=4), utknięta w clusterConsolidationPhase
 * (opts.clusterStateTargets niepuste), z pełnymi środkami (Praca, źródło
 * z populacją >= AI_FOUNDING_SOURCE_MIN_POP, wolny kwalifikujący się heks w
 * terytorium). Historia: 15 tur budowy do 6 miast (peak), potem symulowana
 * wojna zabiera 3 miasta (spadek do 3), po czym mierzymy po ilu turach
 * planCityFounding PIERWSZY RAZ zwraca 'foundCityAt'.
 *
 * SEKCJA A: scenariusz "PRZED" — uruchomiony na `git show <PRE_COMMIT_SHA>:...`
 * (kopia ai.ts SPRZED tego tematu, wyciągnięta z gita pod STAŁYM SHA rodzica
 * commitu tego tematu, NIE pod ruchomym `HEAD` — inaczej bramka staje się
 * self-invalidating po zlądowaniu commitu fixu na tej samej gałęzi; patrz
 * PRE_COMMIT_SHA niżej i precedens P-BRAMKA-HINT-TOAST-ZINDEX-SELFINVALIDATING-Q1),
 * demonstrujący że blokada trwa NIESKOŃCZENIE (zmierzone: 40 tur po stracie, wciąż null).
 * SEKCJA B: ten sam scenariusz na BIEŻĄCYM ai.ts (z mechanizmem odbudowy) —
 * founding pojawia się w ciągu kilku tur od straty.
 *
 * Run from gra/:  node tools/ai-city-recovery-test.cjs
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('  OK:', msg); }
  else { failed++; console.error('  FAIL:', msg); }
}

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-city-recovery-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');

function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      hexes[`${q},${r}`] = {
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

function makeGameData() {
  return {
    units: [
      { Jednostka: 'Wojownik', Health: 30, Ruch: 2 },
      { Jednostka: 'Zwiadowca', Health: 20, Ruch: 3 },
    ],
    buildings: [],
    terrainYields: {
      terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }],
    },
    aiParams: {
      ekspansja_min_dystans_miast: { wartosc: 4, sekcja: 'test', opis: '' },
      ekspansja_min_score_hex: { wartosc: 1, sekcja: 'test', opis: '' },
    },
  };
}

function makeCity(id, ownerId, q, r, pop) {
  return { id, ownerId, q, r, population: pop, name: id };
}

/**
 * Buduje bundle CJS z danego katalogu źródeł (worktree ai.ts sprzed/po fixie)
 * przez esbuild, eksportując wyłącznie to, czego potrzebuje symulacja.
 */
function buildBundle(aiTsAbsPath, tag) {
  const entryFile = path.resolve(__dirname, `.ai-city-recovery-entry-${tag}.ts`);
  const bundleFile = path.resolve(__dirname, `.ai-city-recovery-bundle-${tag}.cjs`);
  const entryTs = `
export { planCityFounding, isLocalExpansionPhase } from ${JSON.stringify(aiTsAbsPath)};
export { MIN_CITY_DISTANCE } from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/cities'))};
export { AI_FOUNDING_SOURCE_MIN_POP } from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/city-founding'))};
`;
  fs.writeFileSync(entryFile, entryTs, 'utf8');
  try {
    esbuild.buildSync({
      entryPoints: [entryFile],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      loader: { '.ts': 'ts', '.json': 'json' },
      outfile: bundleFile,
      absWorkingDir: GRA_ROOT,
      logLevel: 'silent',
    });
  } catch (e) {
    console.error(`[ai-city-recovery-test] esbuild bundling failed (${tag}):\n`, e.message || e);
    process.exit(1);
  }
  const mod = require(bundleFile);
  try { fs.unlinkSync(entryFile); } catch (e) { /* noop */ }
  try { fs.unlinkSync(bundleFile); } catch (e) { /* noop */ }
  return mod;
}

/**
 * Uruchamia symulację: 15 tur budowy do 6 miast (peak), potem strata 3 miast
 * (spadek do 3) w jednej turze, potem do MAX_TURNS_AFTER_LOSS tur próby
 * founding w clusterConsolidationPhase (ekspansywnosc=0, bez bypass).
 * Zwraca liczbę tur od straty do pierwszego 'foundCityAt' (lub null jeśli
 * w ogóle nie wystąpiło w oknie testu).
 */
function runScenario(mod, maxTurnsAfterLoss) {
  const { planCityFounding, MIN_CITY_DISTANCE, AI_FOUNDING_SOURCE_MIN_POP } = mod;
  const map = makeMap(60, 60);
  const data = makeGameData();
  const playerId = 1;
  const srcPop = AI_FOUNDING_SOURCE_MIN_POP + 3; // wyraźnie ponad próg źródła
  const opts = {
    currentTurn: 0,
    pracaAvailable: 200,
    civAiProfile: { ekspansywnosc: 0, sklonnoscDoPodboju: 0 },
    clusterStateTargets: [{ q: 5, r: 5 }], // clusterConsolidationPhase = true (niepuste)
    // brak clusterConquestDeadlineActive -> false
  };

  // 6 miast rozsiane po mapie w zasięgu wspólnego terytorium (peak=6), budowane
  // przez 15 tur (żeby wejść do okna historii AI_CITY_RECOVERY_WINDOW_TURNS=15).
  let cities = [
    makeCity('c1', playerId, 30, 30, srcPop),
    makeCity('c2', playerId, 26, 30, srcPop),
    makeCity('c3', playerId, 34, 30, srcPop),
    makeCity('c4', playerId, 30, 26, srcPop),
    makeCity('c5', playerId, 30, 34, srcPop),
    makeCity('c6', playerId, 26, 34, srcPop),
  ];

  for (let t = 1; t <= 15; t++) {
    opts.currentTurn = t;
    planCityFounding(playerId, cities, map, data, opts, MIN_CITY_DISTANCE, []);
  }

  // Wojna: strata 3 z 6 miast (spadek do 3), tura 16.
  cities = cities.filter(c => !['c4', 'c5', 'c6'].includes(c.id));
  assert(cities.length === 3, 'sanity: po stracie zostaja 3 miasta');

  const lossTurn = 16;
  let turnsToFirstFounding = null;
  const usedHexes = [];
  for (let i = 0; i < maxTurnsAfterLoss; i++) {
    const turn = lossTurn + i;
    opts.currentTurn = turn;
    const cmd = planCityFounding(playerId, cities, map, data, opts, MIN_CITY_DISTANCE, [], [], usedHexes);
    if (cmd) {
      turnsToFirstFounding = i; // 0 = ta sama tura co strata
      break;
    }
  }
  return { turnsToFirstFounding, myCityCountAfterLoss: cities.length };
}

// ============================================================================
// SEKCJA A — PRZED (kopia ai.ts z HEAD, sprzed tego tematu)
// ============================================================================
// SHA rodzica commitu tego tematu (0815e958^) — STAŁY punkt odniesienia "PRZED",
// celowo NIE `HEAD`: `HEAD` na tej gałęzi po commicie tematu WSKAZUJE JUŻ na
// wersję PO fixie, więc bramka porównywałaby PO z PO (self-invalidating —
// ZARZUT 1 Evaluatora, runda 1, PRZYJĘTY). Weryfikacja przy każdym uruchomieniu
// bramki (poniżej) potwierdza, że pod tym SHA plik NIE zawiera jeszcze mechanizmu
// odbudowy (brak `aiCityCountHistory`) — inaczej test kończy się twardym błędem
// zamiast cicho fałszywie zielonym wynikiem.
const PRE_COMMIT_SHA = 'c4e59969';
console.log(`\n--- SEKCJA A: PRZED (ai.ts z ${PRE_COMMIT_SHA}, rodzic commitu P-AI-EKSPANSJA-ODBUDOWA-MIAST-PO-WOJNIE-Q1) ---`);
// Musi leżeć W src/game/ (nie w tools/) -- ai.ts ma importy relatywne (./city-founding,
// ../units/setup, ../map/territory itd.), które muszą się rozwiązać z tego katalogu.
const PRE_AI_TS = path.resolve(GRA_ROOT, 'src/game/.ai-city-recovery-pre.ts');
{
  const preAiTsSrc = execFileSync('git', ['show', `${PRE_COMMIT_SHA}:gra/src/game/ai.ts`], {
    cwd: path.resolve(GRA_ROOT, '..'),
    maxBuffer: 1024 * 1024 * 20,
  }).toString('utf8');
  if (preAiTsSrc.includes('aiCityCountHistory')) {
    console.error(
      `[ai-city-recovery-test] BLAD KONFIGURACJI: ${PRE_COMMIT_SHA}:gra/src/game/ai.ts juz zawiera ` +
      `mechanizm odbudowy (aiCityCountHistory) -- PRE_COMMIT_SHA nie jest juz "PRZED" tym tematem. ` +
      `Bramka przerwana, zeby nie dac falszywie zielonego wyniku (self-invalidating, patrz komentarz na gorze pliku).`,
    );
    process.exit(1);
  }
  fs.writeFileSync(PRE_AI_TS, preAiTsSrc, 'utf8');
}
const preMod = buildBundle(PRE_AI_TS, 'pre');
const MAX_TURNS_AFTER_LOSS = 40;
const beforeResult = runScenario(preMod, MAX_TURNS_AFTER_LOSS);
console.log(`  PRZED: tury do pierwszego foundCityAt po stracie = ${beforeResult.turnsToFirstFounding} (okno testu: ${MAX_TURNS_AFTER_LOSS} tur)`);
assert(
  beforeResult.turnsToFirstFounding === null,
  `PRZED: brak founding w oknie ${MAX_TURNS_AFTER_LOSS} tur po stracie (clusterConsolidationPhase blokuje bez uwzgledniania straty, ekspansywnosc=0 < EKSPANSJA_KLASTR_BYPASS)`,
);
try { fs.unlinkSync(PRE_AI_TS); } catch (e) { /* noop */ }

// ============================================================================
// SEKCJA B — PO (bieżący ai.ts z mechanizmem odbudowy)
// ============================================================================
console.log('\n--- SEKCJA B: PO (biezacy ai.ts, z mechanizmem odbudowy) ---');
const postMod = buildBundle(path.join(GRA_ROOT, 'src/game/ai'), 'post');
const afterResult = runScenario(postMod, MAX_TURNS_AFTER_LOSS);
console.log(`  PO: tury do pierwszego foundCityAt po stracie = ${afterResult.turnsToFirstFounding}`);
assert(
  afterResult.turnsToFirstFounding !== null,
  'PO: AI zaklada nowe miasto w oknie testu po stracie (mechanizm odbudowy dziala)',
);
if (afterResult.turnsToFirstFounding !== null) {
  assert(
    afterResult.turnsToFirstFounding <= 5,
    `PO: pierwsza proba odbudowy w ciagu <=5 tur od straty (zmierzono: ${afterResult.turnsToFirstFounding})`,
  );
}

// ============================================================================
// SEKCJA C — brak regresji: cywilizacja NA szczycie (bez straty) nadal
// respektuje clusterConsolidationPhase (ekspansywnosc=0, bez bypass) — recovering
// musi byc false, gdy liczba miast NIE spadla ponizej niedawnego szczytu.
// ============================================================================
console.log('\n--- SEKCJA C: brak regresji -- cywilizacja BEZ straty miast wciaz blokowana przez klaster ---');
{
  const { planCityFounding, MIN_CITY_DISTANCE, AI_FOUNDING_SOURCE_MIN_POP } = postMod;
  const map = makeMap(60, 60);
  const data = makeGameData();
  const playerId = 2;
  const srcPop = AI_FOUNDING_SOURCE_MIN_POP + 3;
  const opts = {
    currentTurn: 0,
    pracaAvailable: 200,
    civAiProfile: { ekspansywnosc: 0, sklonnoscDoPodboju: 0 },
    clusterStateTargets: [{ q: 5, r: 5 }],
  };
  const cities = [
    makeCity('d1', playerId, 30, 30, srcPop),
    makeCity('d2', playerId, 26, 30, srcPop),
    makeCity('d3', playerId, 34, 30, srcPop),
  ];
  let blockedAllTurns = true;
  for (let t = 1; t <= 30; t++) {
    opts.currentTurn = t;
    const cmd = planCityFounding(playerId, cities, map, data, opts, MIN_CITY_DISTANCE);
    if (cmd) { blockedAllTurns = false; break; }
  }
  assert(blockedAllTurns, 'brak regresji: cywilizacja STABILNA (bez straty) nadal blokowana przez clusterConsolidationPhase (ekspansywnosc=0)');
}

// ============================================================================
// SEKCJA D — brak regresji (ZARZUT 2 Evaluatora, runda 1): historia "niedawnego
// szczytu" NIE MOŻE przetrwać jako zanieczyszczenie z POPRZEDNIEJ gry w tej samej
// sesji modułu (nowa gra bez pełnego przeładowania strony, ten sam playerId).
// Bez auto-czyszczenia przy cofnięciu tury: cutoff = nowaTura - okno wypada
// UJEMNY na starcie nowej gry, więc STARY peak (6 z poprzedniej gry) "przecieka"
// i cywilizacja STABILNA (bez żadnej straty w NOWEJ grze) błędnie dostałaby
// recovering=true -- fałszywy bypass konsolidacji klastra.
// ============================================================================
console.log('\n--- SEKCJA D: brak regresji -- stara historia (poprzednia gra, ten sam playerId) nie zaraza nowej gry ---');
{
  const { planCityFounding, MIN_CITY_DISTANCE, AI_FOUNDING_SOURCE_MIN_POP } = postMod;
  const map = makeMap(60, 60);
  const data = makeGameData();
  const playerId = 3; // świeży playerId w tym samym module postMod (stan modułu dzielony w procesie)
  const srcPop = AI_FOUNDING_SOURCE_MIN_POP + 3;

  // "Gra 1" (ten sam proces/moduł, symulacja poprzedniej rozgrywki w tej samej
  // karcie przeglądarki): buduje historię ze szczytem 6 na wysokich numerach tur.
  {
    const opts1 = {
      currentTurn: 0,
      pracaAvailable: 200,
      civAiProfile: { ekspansywnosc: 0, sklonnoscDoPodboju: 0 },
      clusterStateTargets: [{ q: 5, r: 5 }],
    };
    let cities1 = [
      makeCity('e1', playerId, 30, 30, srcPop),
      makeCity('e2', playerId, 26, 30, srcPop),
      makeCity('e3', playerId, 34, 30, srcPop),
      makeCity('e4', playerId, 30, 26, srcPop),
      makeCity('e5', playerId, 30, 34, srcPop),
      makeCity('e6', playerId, 26, 34, srcPop),
    ];
    for (let t = 1; t <= 40; t++) {
      opts1.currentTurn = t;
      planCityFounding(playerId, cities1, map, data, opts1, MIN_CITY_DISTANCE, []);
    }
    // "Gra 1" się kończy na wysokiej turze (40) ze szczytem historycznym = 6.
  }

  // "Gra 2" (NOWA gra, ten sam playerId, ten sam proces -- bez przeładowania
  // strony): tura wraca do niskich wartości, cywilizacja ma STABILNE 3 miasta
  // od startu (BEZ ŻADNEJ straty w tej nowej grze) -- recovering musi być
  // false, wiec clusterConsolidationPhase musi nadal blokować (ekspansywnosc=0).
  const opts2 = {
    currentTurn: 0,
    pracaAvailable: 200,
    civAiProfile: { ekspansywnosc: 0, sklonnoscDoPodboju: 0 },
    clusterStateTargets: [{ q: 5, r: 5 }],
  };
  const cities2 = [
    makeCity('f1', playerId, 30, 30, srcPop),
    makeCity('f2', playerId, 26, 30, srcPop),
    makeCity('f3', playerId, 34, 30, srcPop),
  ];
  let blockedAllTurns2 = true;
  for (let t = 1; t <= 20; t++) {
    opts2.currentTurn = t;
    const cmd = planCityFounding(playerId, cities2, map, data, opts2, MIN_CITY_DISTANCE);
    if (cmd) { blockedAllTurns2 = false; break; }
  }
  assert(
    blockedAllTurns2,
    'brak regresji: stary peak (6) z poprzedniej gry (tury 1-40) NIE przecieka do nowej gry ' +
    '(tury 1-20, ten sam playerId) -- cywilizacja stabilna na 3 miastach nadal blokowana',
  );
}

console.log(`\n=== ai-city-recovery-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
