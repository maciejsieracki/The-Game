'use strict';
/**
 * civ-configurator-opponent-test.cjs — R-KONFIGURATOR-WYBOR-CYWILIZACJI-PRZECIWNIKA.
 *
 * RUNDA 2 (2026-08-13): Evaluator znalazł, że runda 1 wpięła `preferredCivIds`
 * w `assignAiCivTypes`/`civ-roster.ts` — moduł NIEUŻYWANY przy realnym starcie
 * nowej gry. `doStartGame` woła bezwarunkowo `applyClusterStartPlan()`, który
 * NADPISUJE tamten wynik z zupełnie osobnej ścieżki (`cluster-start.ts` →
 * `map/cluster-spawn.ts` → `map/clusters.ts`, `computeClusters`). Ten plik
 * PRZEPISANO tak, żeby asercjonował na WYNIKU AKTYWNEJ ścieżki —
 * `computeClusters()`/`buildClusterStartPlan().aiOwnerCivMap` — zamiast na
 * martwym `civ-roster.ts` (ten nadal ma WŁASNY, niezmieniony test —
 * civ-roster-test.cjs — bo pozostaje jedynym miejscem gdzie preferredCivIds
 * coś robi: repairAiRosterFromMap()/legacy-load, patrz main.ts).
 *
 * Pięć scenariuszy ze zlecenia, w nowej, poprawnej formie:
 *  (a) domyślne zachowanie bez zaznaczeń pozostaje IDENTYCZNE — preferredCivIds
 *      undefined/[] nie zmienia rosterBezGracza wchodzące do
 *      assignTypesToClusterCenters (reorderRosterByPreference no-op).
 *  (b) zaznaczone konkretne typy trafiają do gry DOKŁADNIE — sprawdzone i na
 *      computeClusters() (synth Pangea, pełna kontrola), i na
 *      buildClusterStartPlan().aiOwnerCivMap (prawdziwa wygenerowana mapa —
 *      dokładnie ta ścieżka, którą woła doStartGame).
 *  (c) nadmiar preferencji ponad limit slotów: silnik obcina deterministycznie
 *      do PIERWSZYCH (nTypy-1) w kolejności zaznaczenia, reszta odrzucona bez
 *      błędu.
 *  (d) UI: sanitizeAiCivSelection/aiCivSelectionCap (niezmienione w rundzie 2,
 *      nadal chronią przed nadmiarem PRZED wysłaniem do silnika) + silnik:
 *      mniejszy aktywneTypy = mniejszy efektywny cap, ta sama zasada "pierwsze
 *      N" jak w (c).
 *  (e) ograniczenie pulą epoki — preferowany typ spoza `rosterKluczeForStartEpoch`
 *      nigdy nie trafia na mapę (reorderRosterByPreference filtruje względem
 *      `roster`, który jest już epoch-filtered przez computeClusters).
 *
 * Usage (z gra/): node tools/civ-configurator-opponent-test.cjs
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.civ-configurator-opponent-entry.ts');
const bundle = path.join(__dirname, '.civ-configurator-opponent-bundle.cjs');

fs.writeFileSync(entry, `
export {
  computeClusters,
  reorderRosterByPreference,
  rosterKluczeForStartEpoch,
} from '../src/map/clusters';
export { buildClusterStartPlan } from '../src/game/cluster-start';
export { generateMap } from '../src/map/generator';
export { civIdsAvailableAtGameEpoch } from '../src/game/civ-entry-epoch';
export {
  aiCivSelectionCap,
  aiCivCandidateIds,
  sanitizeAiCivSelection,
  isAiCivCardDisabled,
} from '../src/ui/aiCivPicker';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);
const civs = require('../data/civs.json');

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}
function assertEq(got, want, msg) {
  assert(got === want, `${msg} (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`);
}

console.log('civ-configurator-opponent-test (R-KONFIGURATOR-WYBOR-CYWILIZACJI-PRZECIWNIKA, runda 2)\n');

/** Pangea syntetyczna — ląd obfity, więc placement zawsze osiąga pełne nTypy (bez fallbacku typN). */
function makePangeaMap(size) {
  const hexes = {};
  for (let q = 0; q < size; q++) {
    for (let r = 0; r < size; r++) {
      hexes[q + ',' + r] = { coords: { q, r }, terenBazowy: 'laka' };
    }
  }
  return { hexes };
}
const pangea = makePangeaMap(60);

/** Typy AI faktycznie rozmieszczone (bez gracza = klastry[0], bez fallbacku 'typN'). */
function foreignTypesOf(placement) {
  return placement.klastry.slice(1).map(k => k.typ).filter(t => !t.startsWith('typ'));
}

// ---------------------------------------------------------------------------
// (a) domyślne zachowanie bez zaznaczeń pozostaje IDENTYCZNE (regresja)
// ---------------------------------------------------------------------------
{
  const noPref = M.computeClusters(pangea, { seed: 42, aktywneTypy: 6, rywaleNaKlaster: 3, playerTyp: 'rzymianie' });
  const emptyPref = M.computeClusters(pangea, {
    seed: 42, aktywneTypy: 6, rywaleNaKlaster: 3, playerTyp: 'rzymianie', preferredCivIds: [],
  });
  assert(
    JSON.stringify(noPref.klastry.map(k => k.typ)) === JSON.stringify(emptyPref.klastry.map(k => k.typ)),
    '(a) computeClusters: preferredCivIds undefined === [] (identyczny wynik)',
  );

  // reorderRosterByPreference samo w sobie — no-op na undefined/[]/brak trafień.
  const roster = ['grecy', 'rzymianie', 'chinczycy', 'inkowie'];
  assert(
    JSON.stringify(M.reorderRosterByPreference(roster, undefined)) === JSON.stringify(roster),
    '(a) reorderRosterByPreference: undefined -> kopia bez zmian',
  );
  assert(
    JSON.stringify(M.reorderRosterByPreference(roster, [])) === JSON.stringify(roster),
    '(a) reorderRosterByPreference: [] -> kopia bez zmian',
  );
  assert(
    JSON.stringify(M.reorderRosterByPreference(roster, ['nieznany_typ'])) === JSON.stringify(roster),
    '(a) reorderRosterByPreference: preferencja spoza roster -> kopia bez zmian',
  );
}

// ---------------------------------------------------------------------------
// (b) zaznaczone konkretne typy trafiają do gry DOKŁADNIE
// ---------------------------------------------------------------------------
{
  // reorderRosterByPreference: preferowane na start, w kolejności zaznaczenia, reszta zachowana.
  const roster = ['grecy', 'rzymianie', 'chinczycy', 'inkowie', 'zulusi'];
  const reordered = M.reorderRosterByPreference(roster, ['inkowie', 'chinczycy']);
  assert(
    JSON.stringify(reordered) === JSON.stringify(['inkowie', 'chinczycy', 'grecy', 'rzymianie', 'zulusi']),
    '(b) reorderRosterByPreference: preferowane na start w kolejności zaznaczenia, reszta bez zmian (got ' +
      JSON.stringify(reordered) + ')',
  );

  // computeClusters (Pangea, pełna kontrola): 5 slotów AI, 3 preferowane -> wszystkie trafiają na mapę.
  const preferred = ['egipt', 'celtowie', 'sumer'];
  const placement = M.computeClusters(pangea, {
    seed: 7, aktywneTypy: 6, rywaleNaKlaster: 3, playerTyp: 'rzymianie', preferredCivIds: preferred,
  });
  const assignedTypes = foreignTypesOf(placement);
  assertEq(assignedTypes.length, 5, '(b) computeClusters: 5 typów AI rozmieszczonych (aktywneTypy=6-1 gracz)');
  for (const id of preferred) {
    assert(assignedTypes.includes(id), `(b) computeClusters: preferowany typ ${id} faktycznie na mapie`);
  }
  assert(!assignedTypes.includes('rzymianie'), '(b) computeClusters: AI nie dostaje typu gracza mimo preferencji');

  // Deterministyczność: ten sam seed + te same preferencje -> ten sam wynik.
  const placement2 = M.computeClusters(pangea, {
    seed: 7, aktywneTypy: 6, rywaleNaKlaster: 3, playerTyp: 'rzymianie', preferredCivIds: preferred,
  });
  assert(
    JSON.stringify(placement.klastry.map(k => k.typ)) === JSON.stringify(placement2.klastry.map(k => k.typ)),
    '(b) computeClusters: deterministyczny wynik z preferredCivIds przy tym samym seedzie',
  );

  // buildClusterStartPlan().aiOwnerCivMap — DOKŁADNIE ta ścieżka, którą woła
  // doStartGame()/applyClusterStartPlan() w main.ts przy realnym starcie nowej
  // gry (Evaluator: to jest test, którego zabrakło w rundzie 1).
  const realMap = M.generateMap(50, 50, 4242, 'kontynenty');
  const plan = M.buildClusterStartPlan({
    map: realMap,
    civs,
    seed: 4242,
    playerCivId: 'grecy',
    rywaleNaKlaster: 4,
    aktywneTypy: 5,
    preferredCivIds: ['inkowie', 'egipt'],
  });
  const planTypes = new Set(plan.aiOwnerCivMap.values());
  assert(planTypes.has('inkowie'), '(b) buildClusterStartPlan().aiOwnerCivMap: inkowie faktycznie przypisani');
  assert(planTypes.has('egipt'), '(b) buildClusterStartPlan().aiOwnerCivMap: egipt faktycznie przypisany');
  assert(!planTypes.has('grecy'), '(b) buildClusterStartPlan().aiOwnerCivMap: AI nie dostaje typu gracza');
}

// ---------------------------------------------------------------------------
// (c) nadmiar preferencji ponad limit slotów — obcięte deterministycznie,
//     PIERWSZE (nTypy-1) w kolejności zaznaczenia, bez błędu.
// ---------------------------------------------------------------------------
{
  // aktywneTypy=4 -> 1 gracz + 3 sloty AI. 5 preferowanych, tylko pierwsze 3 się mieszczą.
  const tooMany = ['egipt', 'celtowie', 'sumer', 'hetyci', 'babilonia'];
  const placement = M.computeClusters(pangea, {
    seed: 3, aktywneTypy: 4, rywaleNaKlaster: 2, playerTyp: 'rzymianie', preferredCivIds: tooMany,
  });
  const assignedTypes = foreignTypesOf(placement);
  assertEq(assignedTypes.length, 3, '(c) computeClusters: pula obcięta do 3 slotów AI mimo 5 preferowanych');
  const assignedSet = new Set(assignedTypes);
  assert(
    assignedSet.has('egipt') && assignedSet.has('celtowie') && assignedSet.has('sumer'),
    '(c) computeClusters: pierwsze 3 preferowane w kolejności zaznaczenia zachowane (got ' +
      JSON.stringify(assignedTypes) + ')',
  );
  assert(
    !assignedSet.has('hetyci') && !assignedSet.has('babilonia'),
    '(c) computeClusters: nadmiarowe preferowane (4., 5.) odrzucone, brak błędu',
  );

  // Sam reorderRosterByPreference potwierdza mechanizm cięcia u źródła: nawet
  // po reorder, .slice(0, nTypy-1) w computeClusters obcina do limitu — wszystkie
  // 5 preferowanych obecne w rosterze, więc slice(0,3) = pierwsze 3 z tooMany.
  const roster = ['grecy', 'rzymianie', 'chinczycy', 'inkowie', 'zulusi', ...tooMany];
  const reordered = M.reorderRosterByPreference(roster, tooMany);
  assertEq(
    JSON.stringify(reordered.slice(0, 3)),
    JSON.stringify(tooMany.slice(0, 3)),
    '(c) reorderRosterByPreference + slice(0,3): tylko pierwsze zmieszczone preferowane',
  );
}

// ---------------------------------------------------------------------------
// (d) UI cap (niezmieniony w rundzie 2) + silnik: mniejszy aktywneTypy = mniejszy
//     efektywny cap, ta sama zasada "pierwsze N w kolejności zaznaczenia".
// ---------------------------------------------------------------------------
{
  // UI: karta niezaznaczona zablokowana przy limicie.
  assertEq(M.isAiCivCardDisabled(false, 3, 3), true, '(d) UI: karta zablokowana przy limit=selectedCount');
  assertEq(M.isAiCivCardDisabled(false, 2, 3), false, '(d) UI: karta odblokowana poniżej limitu');
  assertEq(M.isAiCivCardDisabled(true, 3, 3), false, '(d) UI: już zaznaczona karta nigdy nie jest "zablokowana"');

  const pickedInOrder = ['egipt', 'grecy', 'celtowie', 'hetyci', 'babilonia'];
  const candidateIds = M.civIdsAvailableAtGameEpoch(civs.cywilizacje, 'zelazo').filter(id => id !== 'rzymianie');
  const capBefore = M.aiCivSelectionCap(6); // civTypesCount=6 -> cap=5
  assertEq(capBefore, 5, '(d) cap przed zmniejszeniem = civTypesCount(6)-1 = 5');
  const beforeShrink = M.sanitizeAiCivSelection(pickedInOrder, candidateIds, capBefore);
  assert(
    JSON.stringify(beforeShrink) === JSON.stringify(pickedInOrder),
    '(d) UI przed zmniejszeniem: wszystkie 5 zaznaczeń zachowane',
  );

  const capAfter = M.aiCivSelectionCap(3); // civTypesCount=3 -> cap=2
  assertEq(capAfter, 2, '(d) cap po zmniejszeniu = civTypesCount(3)-1 = 2');
  const afterShrink = M.sanitizeAiCivSelection(pickedInOrder, candidateIds, capAfter);
  assert(
    JSON.stringify(afterShrink) === JSON.stringify(['egipt', 'grecy']),
    '(d) UI po zmniejszeniu: zachowane PIERWSZE 2 w kolejności zaznaczenia (got ' + JSON.stringify(afterShrink) + ')',
  );

  // Silnik: gdyby UI-owy sanitize z jakiegoś powodu nie zadziałał, computeClusters
  // z małym aktywneTypy nadal obcina do tego samego "pierwsze N" — siatka bezpieczeństwa.
  const placementShrunk = M.computeClusters(pangea, {
    seed: 11, aktywneTypy: 3, rywaleNaKlaster: 2, playerTyp: 'rzymianie', preferredCivIds: pickedInOrder,
  });
  const shrunkTypes = foreignTypesOf(placementShrunk);
  assertEq(shrunkTypes.length, 2, '(d) silnik: aktywneTypy=3 -> 2 sloty AI mimo 5 preferowanych');
  assert(
    new Set(shrunkTypes).has('egipt') && new Set(shrunkTypes).has('grecy'),
    '(d) silnik: pierwsze 2 preferowane (egipt, grecy) zachowane, spójne z UI-owym sanitize',
  );
}

// ---------------------------------------------------------------------------
// (e) ograniczenie pulą epoki — preferowany typ spoza epoki nigdy nie trafia na mapę
// ---------------------------------------------------------------------------
{
  const kamienPool = M.civIdsAvailableAtGameEpoch(civs.cywilizacje, 'kamien');
  assertEq(kamienPool.length, 8, '(e) epoka Kamienia: 8 typów dostępnych');
  const zelazoPool = M.civIdsAvailableAtGameEpoch(civs.cywilizacje, 'zelazo');
  const zelazoOnly = zelazoPool.find((id) => !kamienPool.includes(id));
  assert(!!zelazoOnly, '(e) test setup: istnieje typ dostępny w Żelazie a nie w Kamieniu');

  assert(
    M.rosterKluczeForStartEpoch(civs.cywilizacje, 'kamien').length === 8,
    '(e) rosterKluczeForStartEpoch: kamień = 8 nacji (zgodne z civIdsAvailableAtGameEpoch)',
  );

  // Silnik: preferowany typ spoza puli epoki Kamienia (np. stare preferencje
  // sprzed cofnięcia epoki) jest po prostu odfiltrowany — computeClusters nie
  // wywala się, pozostałe poprawne preferencje nadal działają.
  const placement = M.computeClusters(pangea, {
    seed: 21,
    aktywneTypy: 5,
    rywaleNaKlaster: 2,
    playerTyp: 'egipt',
    startEpochId: 'kamien',
    civRoster: civs.cywilizacje,
    preferredCivIds: ['grecy', zelazoOnly, 'sumer'],
  });
  const assignedTypes = foreignTypesOf(placement);
  assert(
    !assignedTypes.includes(zelazoOnly),
    `(e) silnik: preferencja spoza epoki (${zelazoOnly}) odfiltrowana, brak na mapie`,
  );
  assert(assignedTypes.includes('grecy'), '(e) silnik: pozostała poprawna preferencja (grecy) nadal działa');
  assert(assignedTypes.includes('sumer'), '(e) silnik: pozostała poprawna preferencja (sumer) nadal działa');
  for (const t of assignedTypes) {
    assert(kamienPool.includes(t), '(e) silnik: każdy przypisany typ w puli epoki Kamienia: ' + t);
  }
}

// ---------------------------------------------------------------------------
// (f) RUNDA 3 (Evaluator, nota N-B, 2026-08-13): strażnik tekstowy main.ts --
// wywołanie applyClusterStartPlan() wewnątrz doStartGame (ścieżka realnej
// nowej gry) MUSI przekazywać preferredCivIds: _menuSelectedAiCivIds. Bramka
// z sekcji (b) wyżej testuje ZACHOWANIE przez wywołanie funkcji z modułu --
// nie złapałaby regresji typu "ktoś usunął to wpięcie przy refaktorze
// main.ts", bo esbuild entry importuje wprost buildClusterStartPlan, nie
// main.ts. Wzorem ai-founding-territory-test.cjs sekcja "B1: strażnik
// tekstowy main.ts" -- grep źródła main.ts jako tekstu, nie test zachowania.
// / EN: text guard on main.ts -- the applyClusterStartPlan() call inside
// doStartGame (real new-game path) MUST pass preferredCivIds:
// _menuSelectedAiCivIds. Scenario (b) above tests BEHAVIOUR by calling the
// module function directly -- it would not catch a regression where someone
// removes this wiring during a main.ts refactor, since the esbuild entry
// imports buildClusterStartPlan directly, not main.ts. Modelled on
// ai-founding-territory-test.cjs's "B1: text guard main.ts" section -- grep
// main.ts source as text, not a behaviour test.
// ---------------------------------------------------------------------------
console.log('\n--- (f) strażnik tekstowy main.ts -- applyClusterStartPlan w doStartGame ---');
{
  const mainTsPath = path.join(GRA, 'src/main.ts');
  const mainSrc = fs.readFileSync(mainTsPath, 'utf8');

  const fnMarker = 'async function doStartGame(params: NewGameParams): Promise<void> {';
  const fnStart = mainSrc.indexOf(fnMarker);
  assert(fnStart !== -1, '(f)-pre: doStartGame nie znaleziony w main.ts');

  const callMarker = 'applyClusterStartPlan(';
  const callIdx = fnStart !== -1 ? mainSrc.indexOf(callMarker, fnStart) : -1;
  assert(callIdx !== -1 && callIdx > fnStart, '(f)-pre: wywołanie applyClusterStartPlan(...) nie znalezione wewnątrz doStartGame');

  // Balansuje nawiasy klamrowe od podanego indeksu '{' i zwraca indeks TUZ ZA
  // dopasowanym '}' -- odporne na reformat/dopisanie kolejnych opcji do obiektu.
  function balancedBraceEnd(src, openBraceIdx) {
    let depth = 0;
    let i = openBraceIdx;
    for (; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') {
        depth--;
        if (depth === 0) { i++; break; }
      }
    }
    return i;
  }

  let block = '';
  if (callIdx !== -1) {
    const openBraceIdx = mainSrc.indexOf('{', callIdx);
    assert(openBraceIdx !== -1, '(f)-pre: obiekt opcji applyClusterStartPlan(...) nie znaleziony');
    const closeBraceIdx = openBraceIdx !== -1 ? balancedBraceEnd(mainSrc, openBraceIdx) : callIdx;
    block = mainSrc.slice(callIdx, closeBraceIdx);
  }

  assert(
    /preferredCivIds\s*:\s*_menuSelectedAiCivIds/.test(block),
    '(f): wywołanie applyClusterStartPlan w doStartGame musi przekazywać preferredCivIds: _menuSelectedAiCivIds '
      + '(regresja klasy błędu z rundy 1 -- wpięcie usunięte przy refaktorze main.ts, żaden test behawioralny tego nie łapie)',
  );
}

console.log('\nciv-configurator-opponent-test:', passed, 'passed,', failed, 'failed');
if (failed) process.exit(1);
