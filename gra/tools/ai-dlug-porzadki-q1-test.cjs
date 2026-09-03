'use strict';
/**
 * ai-dlug-porzadki-q1-test.cjs — bramka R-AI-DLUG-PORZADKI-Q1, poz. (a) i (b).
 *
 * main.ts NIE bundluje się samodzielnie przez esbuild (DOM/THREE/canvas w całym module) —
 * konwencja tego repo (patrz np. atak-adiacencja-wymagana-test.cjs): wycinamy DOKŁADNY
 * fragment źródła TEKSTOWO po stabilnych kotwicach, transpilujemy go PRAWDZIWYM esbuild
 * (transformSync, loader 'ts' — usuwa tylko adnotacje typów, nie zmienia logiki) i
 * wykonujemy przez `new Function`. Zero reimplementacji logiki w teście — jeśli ktoś
 * zepsuje/usunie linię w main.ts, ten sam, prawdziwy kod przestaje działać tutaj.
 *
 * (a) P-AI-R5-FC3-CLEANUP-OWNERID-REUSE-Q1 — eliminateOwner() musi usunąć ownerId z
 *     aiSurplusRedirectedOwners i aiSliderStateByOwner (obok istniejących analogicznych
 *     .delete(ownerId)).
 * (b) P-AI-R5-FC4-SLIDER-STATE-NIE-PERSISTOWANY-Q1 — aiSliderStateByOwner musi przeżyć
 *     save→load roundtrip z WARTOŚCIĄ RÓŻNĄ od domyślnej (nie tylko obecność pola w JSON),
 *     a stary zapis (bez pola) musi wczytać się bez wyjątku z pustym stanem.
 *
 * Usage (z gra/): node tools/ai-dlug-porzadki-q1-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const mainSrcRaw = fs.readFileSync(MAIN_TS, 'utf8');

function stripLineComments(src) {
  return src
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('//');
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join('\n');
}
const mainSrcStripped = stripLineComments(mainSrcRaw);

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('  [OK]', msg); }
  else { failed++; console.error('  [FAIL]', msg); }
}
function sliceBetween(src, startAnchor, endAnchor, afterIdx) {
  const s = src.indexOf(startAnchor, afterIdx || 0);
  if (s < 0) return { text: '', start: -1 };
  const e = src.indexOf(endAnchor, s);
  if (e < 0) return { text: '', start: s };
  return { text: src.slice(s, e), start: s };
}

// ══════════════════════════════════════════════════════════════════════════
// (a) eliminateOwner() usuwa ownerId z aiSurplusRedirectedOwners i aiSliderStateByOwner
// ══════════════════════════════════════════════════════════════════════════
console.log('\n-- (a) eliminateOwner() czyści aiSurplusRedirectedOwners + aiSliderStateByOwner --');
{
  const FN_ANCHOR = 'function eliminateOwner(ownerId: number): void {';
  const fnIdx = mainSrcStripped.indexOf(FN_ANCHOR);
  assert(fnIdx > -1, 'A0: main.ts: kotwica "function eliminateOwner(...)" znaleziona');

  // Fragment „płaskich" .delete(ownerId) — od pierwszego (aiSkarbiecByOwner) do końca
  // bloku sprzątającego rejestry wojny wymuszonej Żelaza (ostatni przed sekcją
  // diplomacyRelations, która wymaga dodatkowych struktur nieistotnych dla tego dowodu).
  const START = 'aiSkarbiecByOwner.delete(ownerId);';
  const END = 'for (const key of Array.from(diplomacyRelations.keys()))';
  const { text: cleanupSnippet, start } = sliceBetween(mainSrcStripped, START, END, fnIdx);
  assert(start > fnIdx, 'A1: fragment sprzątający leży WEWNĄTRZ eliminateOwner (po kotwicy funkcji)');
  assert(cleanupSnippet.length > 500, 'A2: fragment sprzątający ma sensowną długość (>500 znaków) -- kotwice nie zdegenerowały się');
  assert(cleanupSnippet.includes('aiSurplusRedirectedOwners.delete(ownerId);'),
    'A3: fragment zawiera aiSurplusRedirectedOwners.delete(ownerId)');
  assert(cleanupSnippet.includes('aiSliderStateByOwner.delete(ownerId);'),
    'A4: fragment zawiera aiSliderStateByOwner.delete(ownerId)');

  // Nazwy Map/Set-ów użyte w wyciętym fragmencie -- przekazywane jako parametry do
  // new Function, żeby PRAWDZIWY kod main.ts wykonał się na atrapach tych struktur.
  const ctxNames = [
    'aiSkarbiecByOwner', 'aiPracaPoolByOwner', 'aiNaukaPoolByOwner', 'aiBadanaByOwner',
    'aiResearchDone', 'aiOwnerCivMap', 'ownerDisplayName', 'simplifiedDiplomacyOwners',
    'foreignTypeOwners', 'typCityCopyOwners', 'ownerEraByOwner', 'ownerStartEraByOwner',
    'clusterCapitalOwnerIds', 'diplomaticContactEstablished', 'diplomaticallyDiscoveredOwners',
    'diplomaticDiscoveryPopupShown', 'battlePowerPtsByOwner', 'aiSurplusRedirectedOwners',
    'aiSliderStateByOwner', 'capitalCityIdByOwner', 'zdobyczePowerByOwner',
    'bronzeForceWarPendingOwners', 'bronzeForceWarCycleOwners', 'bronzeForceWarRestUntilByOwner',
    'bronzeForceWarActiveByPairKey', 'stoneForceWarPendingOwners', 'stoneForceWarCycleOwners',
    'stoneForceWarRestUntilByOwner', 'stoneForceWarActiveByPairKey', 'ironForceWarPendingOwners',
    'ironForceWarCycleOwners', 'ironForceWarRestUntilByOwner', 'ironForceWarActiveByPairKey',
    'bronzeEraEnterTurnByOwner', 'ironEraEnterTurnByOwner',
  ];

  let realExecOk = false;
  let afterSurplus, afterSlider;
  if (cleanupSnippet) {
    const js = esbuild.transformSync(cleanupSnippet, { loader: 'ts', target: 'node18' }).code;
    const fn = new Function('ownerId', ...ctxNames, js);

    // Stan PRZED: ownerId=7 obecny w OBU strukturach (z realnymi, niedomyślnymi wartościami).
    const surplus = new Set([7, 9]);
    const sliderMap = new Map([[7, { procentBudynki: 42, procentPuliImperiumZBudynkow: 58, lastChangeTurn: 13 }]]);
    const emptyMap = () => new Map();
    const emptySet = () => new Set();

    fn(
      7,
      emptyMap(), emptyMap(), emptyMap(), emptyMap(), emptyMap(), emptyMap(), emptyMap(),
      emptySet(), emptySet(), emptySet(), emptyMap(), emptyMap(), emptySet(), emptySet(),
      emptySet(), emptySet(), emptyMap(),
      surplus,
      sliderMap,
      emptyMap(), emptyMap(),
      emptySet(), emptySet(), emptyMap(), emptyMap(),
      emptySet(), emptySet(), emptyMap(), emptyMap(),
      emptySet(), emptySet(), emptyMap(), emptyMap(),
      emptyMap(), emptyMap(),
    );
    afterSurplus = surplus;
    afterSlider = sliderMap;
    realExecOk = true;
  }
  assert(realExecOk, 'A5: fragment PRAWDZIWIE wykonany (esbuild transformSync + new Function)');
  assert(realExecOk && !afterSurplus.has(7) && afterSurplus.has(9),
    'A6: po eliminacji ownerId=7 znika z aiSurplusRedirectedOwners, ownerId=9 (inny) zostaje');
  assert(realExecOk && !afterSlider.has(7),
    'A7: po eliminacji ownerId=7 znika z aiSliderStateByOwner');
}

// ══════════════════════════════════════════════════════════════════════════
// (b) aiSliderStateByOwner przeżywa save→load roundtrip (wartość RÓŻNA od domyślnej)
// ══════════════════════════════════════════════════════════════════════════
console.log('\n-- (b) aiSliderStateByOwner: save -> JSON -> load roundtrip (real esbuild+Function) --');
{
  const SAVE_LINE = 'aiSliderStateByOwner: Array.from(aiSliderStateByOwner.entries()),';
  assert(mainSrcStripped.includes(SAVE_LINE),
    'B1: buildSaveGameSnapshot zawiera "aiSliderStateByOwner: Array.from(aiSliderStateByOwner.entries())"');

  const RESTORE_START = 'aiSliderStateByOwner.clear();';
  const RESTORE_END_ANCHOR = 'aiTargetMemoryByOwner.clear();';
  const restoreIdx = mainSrcStripped.indexOf(RESTORE_START);
  const { text: restoreSnippet } = sliceBetween(mainSrcStripped, RESTORE_START, RESTORE_END_ANCHOR, 0);
  assert(restoreIdx > -1 && restoreSnippet.length > 100,
    'B2: restoreGameFromSave zawiera blok odtwarzający aiSliderStateByOwner (>100 znaków)');
  assert(restoreSnippet.includes('aiSliderStateByOwner.set(oid, st)'),
    'B3: blok odtwarzający woła aiSliderStateByOwner.set(oid, st)');

  // Wykonanie PRAWDZIWEGO kodu save-line jako wyrażenia zwracanego (odcinamy tylko klucz
  // obiektu literalnego "aiSliderStateByOwner:" z przodu -- reszta to dokładnie ten sam,
  // niezmieniony fragment wyrażenia z main.ts).
  const saveExpr = SAVE_LINE.replace(/^aiSliderStateByOwner:\s*/, '').replace(/,\s*$/, '');
  assert(saveExpr === 'Array.from(aiSliderStateByOwner.entries())',
    'B1b: wyrażenie zapisu wyodrębnione poprawnie z SAVE_LINE (bez klucza/przecinka)');
  const saveJs = esbuild.transformSync(
    `function __save(aiSliderStateByOwner) { return ${saveExpr}; }`,
    { loader: 'ts', target: 'node18' },
  ).code;
  const saveFn = new Function(`${saveJs}; return __save;`)();

  const restoreJs = esbuild.transformSync(restoreSnippet, { loader: 'ts', target: 'node18' }).code;
  const restoreFn = new Function('aiSliderStateByOwner', 'saved', restoreJs);

  // --- Roundtrip z wartością RÓŻNĄ od domyślnej (nie tylko obecność pola w JSON) ---
  const NIEDOMYSLNA = { procentBudynki: 71, procentPuliImperiumZBudynkow: 29, lastChangeTurn: 88 };
  const originalMap = new Map([[3, NIEDOMYSLNA]]);
  const serialized = saveFn(originalMap);
  const jsonRoundtrip = JSON.parse(JSON.stringify({ meta: { aiSliderStateByOwner: serialized } }));

  const loadedMap = new Map();
  restoreFn(loadedMap, jsonRoundtrip);

  assert(loadedMap.has(3), 'B4: po save->JSON->load ownerId=3 OBECNY w aiSliderStateByOwner');
  const restoredVal = loadedMap.get(3);
  assert(
    !!restoredVal
      && restoredVal.procentBudynki === 71
      && restoredVal.procentPuliImperiumZBudynkow === 29
      && restoredVal.lastChangeTurn === 88,
    'B5: wartość po roundtripie RÓWNA oryginalnej NIEDOMYŚLNEJ (procentBudynki=71, '
      + 'procentPuliImperiumZBudynkow=29, lastChangeTurn=88), got ' + JSON.stringify(restoredVal),
  );
  // Musi to NAPRAWDĘ być inny obiekt niż oryginał (przeszedł przez JSON, nie referencję) --
  // dowodzi że test nie "oszukuje" przekazaniem tej samej referencji.
  assert(restoredVal !== NIEDOMYSLNA, 'B6: odtworzona wartość to NOWY obiekt (przeszedł przez JSON.stringify/parse, nie ta sama referencja)');

  // --- Stary zapis (bez pola aiSliderStateByOwner) wczytuje się bez wyjątku, pusty stan ---
  const oldSaveNoField = { meta: {} };
  const loadedOldMap = new Map([[999, { procentBudynki: 1, procentPuliImperiumZBudynkow: 1, lastChangeTurn: 1 }]]); // symuluje "przeciek" z poprzedniej gry tej samej sesji
  let threw = false;
  try {
    restoreFn(loadedOldMap, oldSaveNoField);
  } catch (e) {
    threw = true;
  }
  assert(!threw, 'B7: stary zapis (bez pola aiSliderStateByOwner) wczytuje się BEZ wyjątku');
  assert(loadedOldMap.size === 0, 'B8: stary zapis (bez pola) daje PUSTY stan (clear() zadziałało, brak przecieku z poprzedniej gry)');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
