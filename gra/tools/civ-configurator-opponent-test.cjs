'use strict';
/**
 * civ-configurator-opponent-test.cjs — R-KONFIGURATOR-WYBOR-CYWILIZACJI-PRZECIWNIKA.
 *
 * Test dedykowany temu tematowi (obok już istniejącego, niezmienionego
 * civ-roster-test.cjs, który pilnuje E1-D-Q1=A i nadal jest 100% zielony jako dowód
 * regresji (a)). Pokrywa PIĘĆ scenariuszy ze zlecenia:
 *
 *  (a) domyślne zachowanie bez zaznaczeń pozostaje losowe jak dziś (regresja) —
 *      `preferredCivIds` undefined/[] daje IDENTYCZNY wynik jak przed tą zmianą.
 *  (b) zaznaczone konkretne typy trafiają do gry DOKŁADNIE (do limitu civTypesCount).
 *  (c) blokada/reguła przy przekroczeniu limitu — zarówno na poziomie UI
 *      (`isAiCivCardDisabled`/`sanitizeAiCivSelection`, aiCivPicker.ts) jak i jako
 *      siatka bezpieczeństwa w silniku (`pickActiveCivPool` obcina nadmiar
 *      deterministycznie, bez rzucania błędu).
 *  (d) zmiana `civ_types_count` PO ręcznym zaznaczeniu — `sanitizeAiCivSelection`
 *      zachowuje PIERWSZE N w kolejności zaznaczenia, odrzuca resztę po cichu.
 *  (e) ograniczenie pulą epoki — nie da się "wybrać" (silnik ignoruje) cywilizacji
 *      spoza `allCivIds` przekazanych dla danej epoki startu.
 *
 * Bundluje DWA czyste moduły (bez DOM/assets) esbuildem — civ-roster.ts (silnik) i
 * aiCivPicker.ts (UI cap/sanitize) — dokładnie te same jednostki co main.ts i
 * newGameFlow.ts importują, żeby nie duplikować formuł w teście (wzorzec
 * extract-to-pure-function, patrz komentarz na górze aiCivPicker.ts).
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
  assignAiCivTypes,
  pickActiveCivPool,
  civIdsFromRoster,
  civIdsAvailableAtGameEpoch,
} from '../src/game/civ-roster';
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
  loader: { '.ts': 'ts' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);
const civs = require('../data/civs.json');
const ALL = M.civIdsFromRoster(civs.cywilizacje);

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}
function assertEq(got, want, msg) {
  assert(got === want, `${msg} (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`);
}

console.log('civ-configurator-opponent-test (R-KONFIGURATOR-WYBOR-CYWILIZACJI-PRZECIWNIKA)\n');

// ---------------------------------------------------------------------------
// (a) domyślne zachowanie bez zaznaczeń pozostaje losowe jak dziś (regresja)
// ---------------------------------------------------------------------------
{
  const argsNoPreferred = ['rzymianie', 7, 6, 99];
  const poolUndefined = M.pickActiveCivPool(ALL, ...argsNoPreferred);
  const poolEmptyArr = M.pickActiveCivPool(ALL, ...argsNoPreferred, []);
  assert(
    JSON.stringify(poolUndefined) === JSON.stringify(poolEmptyArr),
    '(a) preferredCivIds undefined === [] (sama sygnatura, sam wynik)',
  );

  const mapNoPreferred = M.assignAiCivTypes({
    allCivIds: ALL, playerCivId: 'rzymianie', aiOwnerIds: [1, 2, 3, 4, 5, 6],
    aktywneTypy: 7, seed: 12345,
  });
  const mapEmptyPreferred = M.assignAiCivTypes({
    allCivIds: ALL, playerCivId: 'rzymianie', aiOwnerIds: [1, 2, 3, 4, 5, 6],
    aktywneTypy: 7, seed: 12345, preferredCivIds: [],
  });
  assert(
    JSON.stringify([...mapNoPreferred]) === JSON.stringify([...mapEmptyPreferred]),
    '(a) assignAiCivTypes: brak preferredCivIds === pusta tablica (identyczny wynik)',
  );

  // Ta sama asercja co w civ-roster-test.cjs (przed zmianą) — dowód że stary wywolanie
  // 4-argumentowe (bez 6. parametru) nadal dziala identycznie.
  const poolStd = M.pickActiveCivPool(ALL, 'grecy', 7, 6, 99);
  assertEq(poolStd.length, 7, '(a) standard: 7 typow przy 6 AI (bez zmian)');
}

// ---------------------------------------------------------------------------
// (b) zaznaczone konkretne typy trafiają do gry DOKŁADNIE (do limitu civTypesCount)
// ---------------------------------------------------------------------------
{
  const preferred = ['egipt', 'grecy', 'celtowie'];
  const pool = M.pickActiveCivPool(ALL, 'rzymianie', 4, 6, 1, preferred);
  assertEq(pool.length, 4, '(b) 4 typy na mapie (gracz + 3 preferowane)');
  assert(pool.includes('rzymianie'), '(b) gracz w puli');
  for (const id of preferred) {
    assert(pool.includes(id), `(b) preferowany typ ${id} trafił do puli`);
  }

  const map = M.assignAiCivTypes({
    allCivIds: ALL, playerCivId: 'rzymianie', aiOwnerIds: [1, 2, 3, 4, 5, 6],
    aktywneTypy: 4, seed: 1, preferredCivIds: preferred,
  });
  const assignedTypes = new Set(map.values());
  for (const id of preferred) {
    assert(assignedTypes.has(id), `(b) assignAiCivTypes: ${id} faktycznie przypisany do jakiegoś ownera`);
  }
  assert(!assignedTypes.has('rzymianie'), '(b) AI nie dostaje typu gracza mimo preferencji');

  // deterministyczność z preferowanymi (ten sam seed -> ten sam wynik)
  const map2 = M.assignAiCivTypes({
    allCivIds: ALL, playerCivId: 'rzymianie', aiOwnerIds: [1, 2, 3, 4, 5, 6],
    aktywneTypy: 4, seed: 1, preferredCivIds: preferred,
  });
  assert(
    JSON.stringify([...map]) === JSON.stringify([...map2]),
    '(b) deterministyczny wynik z preferredCivIds przy tym samym seedzie',
  );

  // preferowanych mniej niż potrzeba -> reszta dobrana z puli (deterministyczny fill-in)
  const partial = M.pickActiveCivPool(ALL, 'rzymianie', 5, 6, 2, ['egipt']);
  assertEq(partial.length, 5, '(b) fill-in: 5 typów mimo tylko 1 preferowanego');
  assert(partial.includes('egipt'), '(b) fill-in: preferowany typ nadal obecny');
  assert(partial.includes('rzymianie'), '(b) fill-in: gracz nadal obecny');
  const partial2 = M.pickActiveCivPool(ALL, 'rzymianie', 5, 6, 2, ['egipt']);
  assert(
    JSON.stringify(partial) === JSON.stringify(partial2),
    '(b) fill-in: deterministyczny (ten sam seed -> te same dobrane typy)',
  );
}

// ---------------------------------------------------------------------------
// (c) blokada/reguła przy przekroczeniu limitu
// ---------------------------------------------------------------------------
{
  // UI: karta niezaznaczona ma być zablokowana, gdy limit osiągnięty.
  assertEq(M.isAiCivCardDisabled(false, 3, 3), true, '(c) UI: karta zablokowana przy limit=selectedCount');
  assertEq(M.isAiCivCardDisabled(false, 2, 3), false, '(c) UI: karta odblokowana poniżej limitu');
  assertEq(M.isAiCivCardDisabled(true, 3, 3), false, '(c) UI: już zaznaczona karta NIGDY nie jest "zablokowana" (można odznaczyć)');
  assertEq(M.isAiCivCardDisabled(false, 0, 0), true, '(c) UI: limit=0 (civTypesCount=1) -> wszystko zablokowane');

  // UI: sanitizeAiCivSelection obcina nadmiar zaznaczeń do limitu, zachowując kolejność.
  const overSelected = ['a', 'b', 'c', 'd', 'e'];
  const candidates = ['a', 'b', 'c', 'd', 'e', 'f'];
  const clamped = M.sanitizeAiCivSelection(overSelected, candidates, 3);
  assert(
    JSON.stringify(clamped) === JSON.stringify(['a', 'b', 'c']),
    '(c) UI: nadmiar zaznaczeń obcięty do limitu, zachowana kolejność (got ' + JSON.stringify(clamped) + ')',
  );

  // Silnik jako siatka bezpieczeństwa: preferredCivIds > typesNeeded-1 nie rzuca
  // błędu i nie przekracza limitu (obcina deterministycznie, pierwsze N).
  const tooMany = ['egipt', 'grecy', 'celtowie', 'hetyci', 'babilonia'];
  const poolCapped = M.pickActiveCivPool(ALL, 'rzymianie', 3, 6, 5, tooMany);
  assertEq(poolCapped.length, 3, '(c) silnik: pula obcięta do civTypesCount=3 mimo 5 preferowanych');
  assert(poolCapped.includes('egipt') && poolCapped.includes('grecy'), '(c) silnik: pierwsze preferowane zachowane (kolejność)');
  assert(!poolCapped.includes('babilonia'), '(c) silnik: nadmiarowe preferowane odrzucone');
}

// ---------------------------------------------------------------------------
// (d) zmiana civ_types_count PO zaznaczeniu — pierwsze N w kolejności zaznaczenia
// ---------------------------------------------------------------------------
{
  // Gracz zaznaczył 5 (w tej kolejności), potem zmniejszył civTypesCount tak, że
  // limit AI spadł do 2 (civTypesCount=3 -> cap=2).
  const pickedInOrder = ['egipt', 'grecy', 'celtowie', 'hetyci', 'babilonia'];
  const candidateIds = ALL.filter((id) => id !== 'rzymianie');
  const capBefore = M.aiCivSelectionCap(6); // civTypesCount=6 -> cap=5
  assertEq(capBefore, 5, '(d) cap przed zmniejszeniem = civTypesCount(6)-1 = 5');
  const beforeShrink = M.sanitizeAiCivSelection(pickedInOrder, candidateIds, capBefore);
  assert(
    JSON.stringify(beforeShrink) === JSON.stringify(pickedInOrder),
    '(d) przed zmniejszeniem: wszystkie 5 zaznaczeń zachowane',
  );

  const capAfter = M.aiCivSelectionCap(3); // civTypesCount=3 -> cap=2
  assertEq(capAfter, 2, '(d) cap po zmniejszeniu = civTypesCount(3)-1 = 2');
  const afterShrink = M.sanitizeAiCivSelection(pickedInOrder, candidateIds, capAfter);
  assert(
    JSON.stringify(afterShrink) === JSON.stringify(['egipt', 'grecy']),
    '(d) po zmniejszeniu: zachowane PIERWSZE 2 w kolejności zaznaczenia (got ' + JSON.stringify(afterShrink) + ')',
  );

  // Zwiększenie z powrotem NIE przywraca odrzuconych (sanitize jest bezstanowe —
  // "grecy/celtowie/hetyci/babilonia" trzeba by zaznaczyć ponownie). To świadoma
  // konsekwencja projektowa: sanitizeAiCivSelection operuje na tym, co jest DZIŚ w
  // selAiCivIds (już obciętym), nie na jakiejś ukrytej "historii pełnego wyboru".
  const capGrownBack = M.aiCivSelectionCap(6);
  const afterGrowBack = M.sanitizeAiCivSelection(afterShrink, candidateIds, capGrownBack);
  assert(
    JSON.stringify(afterGrowBack) === JSON.stringify(['egipt', 'grecy']),
    '(d) ponowne zwiększenie limitu NIE przywraca wcześniej odrzuconych zaznaczeń',
  );
}

// ---------------------------------------------------------------------------
// (e) ograniczenie pulą epoki
// ---------------------------------------------------------------------------
{
  const kamienPool = M.civIdsAvailableAtGameEpoch(civs.cywilizacje, 'kamien');
  assertEq(kamienPool.length, 8, '(e) epoka Kamienia: 8 typów dostępnych');
  const brazPool = M.civIdsAvailableAtGameEpoch(civs.cywilizacje, 'braz');
  assertEq(brazPool.length, 14, '(e) epoka Brązu: 14 typów dostępnych');
  const zelazoPool = M.civIdsAvailableAtGameEpoch(civs.cywilizacje, 'zelazo');
  assertEq(zelazoPool.length, 15, '(e) epoka Żelaza: 15 typów dostępnych');

  // Cywilizacja spoza puli epoki Kamienia (np. Słowianie, wejście dopiero Żelazo).
  const zelazoOnly = zelazoPool.find((id) => !kamienPool.includes(id));
  assert(!!zelazoOnly, '(e) test setup: istnieje typ dostępny w Żelazie a nie w Kamieniu');

  // UI: kandydaci na AI w epoce Kamienia NIE zawierają typu spoza puli Kamienia.
  const uiCandidates = M.aiCivCandidateIds(kamienPool, 'egipt');
  assert(!uiCandidates.includes(zelazoOnly), '(e) UI: kandydat spoza puli epoki nie widoczny do zaznaczenia');

  // Silnik: nawet gdyby preferredCivIds (np. stare prefs z gry w epoce Żelaza po
  // cofnięciu do epoki Kamienia) zawierały typ spoza dzisiejszej puli epoki —
  // allCivIds przekazane do pickActiveCivPool jest JUŻ epoch-filtered, więc taki
  // typ jest po prostu odfiltrowany, gra się nie wywala.
  const poolKamienWithStalePreferred = M.pickActiveCivPool(
    kamienPool, 'egipt', 5, 3, 42, ['egipt', zelazoOnly, 'grecy'],
  );
  assert(
    !poolKamienWithStalePreferred.includes(zelazoOnly),
    '(e) silnik: przestarzała preferencja spoza puli epoki odfiltrowana, brak wywalenia',
  );
  assert(poolKamienWithStalePreferred.includes('grecy'), '(e) silnik: pozostałe poprawne preferencje nadal działają');

  const mapKamien = M.assignAiCivTypes({
    allCivIds: kamienPool, playerCivId: 'egipt', aiOwnerIds: [1, 2, 3],
    aktywneTypy: 4, seed: 555, preferredCivIds: ['grecy', zelazoOnly],
  });
  for (const id of mapKamien.values()) {
    assert(kamienPool.includes(id), '(e) assignAiCivTypes: przypisany typ ' + id + ' zawsze w puli epoki Kamienia');
  }
}

console.log('\nciv-configurator-opponent-test:', passed, 'passed,', failed, 'failed');
if (failed) process.exit(1);
