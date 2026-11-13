'use strict';
/**
 * R-WEB-PERF-ENDTURN-RENDER-HUD-Q1 (r3): test ZACHOWANIA flushu po wznowieniu fazy AI po bitwie.
 * Wyciąga PRAWDZIWY kod helpera `runAiPhaseThenFlush` z src/main.ts (znaczniki RESUME-FLUSH-BEGIN/END),
 * transpiluje go i uruchamia na modelu fazy AI z prawdziwym `createDirtyRenderSync` (src/game/dirtyRenderSync.ts):
 *   pass 1: odwiedziny miasta (markDirty) -> bitwa (flush przed bitwą) -> return;
 *   pass 2 (wznowienie): odwiedziny miasta (markDirty) -> koniec / kolejna bitwa / błąd.
 * Po zakończeniu fazy "scena żetonów" (stan zsynchronizowany) MUSI równać się stanowi pełnej synchronizacji.
 * Dodatkowo asercje okablowania w main.ts: callback bitwy używa helpera, a klatka postępu flushuje żetony.
 * Mutacja: bez flushu w helperze test czerwienieje (sekcja MUTACJA wewnątrz testu).
 * Usage: node tools/perf-endturn-render-resume-flush-test.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const mainSource = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');

function loadTs(src) {
  const out = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const m = { exports: {} };
  new Function('exports', 'module', out)(m.exports, m);
  return m.exports;
}
const { createDirtyRenderSync } = loadTs(fs.readFileSync(path.join(root, 'src/game/dirtyRenderSync.ts'), 'utf8'));

const b = mainSource.indexOf('// RESUME-FLUSH-BEGIN');
const e = mainSource.indexOf('// RESUME-FLUSH-END');
assert(b > 0 && e > b, 'znaczniki helpera RESUME-FLUSH muszą istnieć w main.ts');
assert.equal(mainSource.split('// RESUME-FLUSH-BEGIN').length, 2, 'dokładnie jeden helper');
const helperSrc = mainSource.slice(b + '// RESUME-FLUSH-BEGIN'.length, e);

function makeHelper(src) {
  // helper to `const runAiPhaseThenFlush = async (...) => {...};` -- zwracamy funkcję
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  return new Function(`${js}\nreturn runAiPhaseThenFlush;`)();
}
const realHelper = makeHelper(helperSrc);
// MUTACJA: ten sam helper bez wywołania flush()
const mutantSrc = helperSrc.replace(/\n\s*flush\(\);/, '\n');
assert.notEqual(mutantSrc, helperSrc, 'mutacja musi zmienić helper');
const mutantHelper = makeHelper(mutantSrc);

/**
 * Model: stan gry (unitHp, kanoniczny natychmiast) vs scena żetonów (renderedHp, aktualizowana tylko przez sync).
 * `scenario.pass2` = 'end' | 'battle' | 'throw'.
 */
async function simulate(helper, pass2) {
  const unitHp = { a: 10, b: 10 };
  const renderedHp = { a: 10, b: 10 };
  const fullSync = () => { Object.assign(renderedHp, unitHp); };
  let syncs = 0;
  const unitBatch = createDirtyRenderSync(() => { syncs++; fullSync(); });
  const flush = () => { unitBatch.flush(); };
  const visit = (id) => { unitHp[id] += 5; unitBatch.markDirty(); }; // odwiedziny miasta: stan natychmiast, render odroczony
  const errors = [];

  // pass 1 (z epilogiem jak w main.ts): odwiedziny, flush przed bitwą, return
  visit('a');
  flush(); // flushAiCityRenderBatch() przed launchIncomingMapFieldBattle
  // epilog pierwszego przebiegu: flush + hak = null
  flush();

  // bitwa trwa, gracz wraca -> callback wznawia fazę AI
  let battleLaunches = 0;
  const runAiPhaseResumed = async () => {
    visit('b');
    await Promise.resolve();
    if (pass2 === 'battle') {
      flush(); // flush przed kolejną bitwą (jak w main.ts)
      battleLaunches++;
      visit('a'); // ruch po wyjściu z pętli nie dotyczy, ale kolejna odwiedziny po wznowieniu 3. przebiegu
      return;
    }
    if (pass2 === 'throw') throw new Error('synthetic AI failure');
  };
  await helper(runAiPhaseResumed, flush, (err) => errors.push(err.message));
  return { unitHp, renderedHp, dirty: unitBatch.isDirty(), errors, syncs, battleLaunches };
}

(async () => {
  for (const pass2 of ['end', 'battle', 'throw']) {
    const r = await simulate(realHelper, pass2);
    assert.deepEqual(r.renderedHp, r.unitHp, `[${pass2}] scena żetonów po fazie = stan po pełnej synchronizacji`);
    assert.equal(r.dirty, false, `[${pass2}] batch żetonów czysty po zakończeniu fazy`);
    if (pass2 === 'throw') assert.deepEqual(r.errors, ['synthetic AI failure'], 'błąd fazy zgłoszony przez onError, flush mimo błędu');
    else assert.deepEqual(r.errors, [], `[${pass2}] bez błędów`);

    const m = await simulate(mutantHelper, pass2);
    assert.notDeepEqual(m.renderedHp, m.unitHp, `[${pass2}] MUTACJA (bez flushu) musi dawać nieaktualne żetony -- test łapie regresję`);
    assert.equal(m.dirty, true, `[${pass2}] MUTACJA zostawia batch brudny`);
  }

  // Okablowanie main.ts
  assert(/void runAiPhaseThenFlush\(\s*runAiPhase,\s*flushAiCityRenderBatch,/.test(mainSource),
    'callback wznowienia po bitwie musi przechodzić przez runAiPhaseThenFlush(runAiPhase, flushAiCityRenderBatch, ...)');
  assert(!/\(\) => \{ void runAiPhase\(\); \}/.test(mainSource), 'goły `void runAiPhase()` w callbacku bitwy jest zabroniony');
  assert(!/flushAiCityRenderBatch\(false\)/.test(mainSource), 'klatka postępu nie zrywa flushu żetonów na stałe (false)');
  assert(/flushAiCityRenderBatch\(aiUnitVisiblePending\);\s*await yieldTurnTransitionUi\(\);/.test(mainSource),
    'klatka postępu flushuje żetony gdy czeka widoczny token (aiUnitVisiblePending)');
  assert(/aiUnitRenderBatch\.markDirty\(\);\s*if \(aiVisNow === null \|\| aiVisNow\.has\(keyOf\(last\.q, last\.r\)\)\) aiUnitVisiblePending = true;/.test(mainSource),
    'odwiedziny miasta przez widoczną jednostkę ustawiają aiUnitVisiblePending');
  assert(/aiUnitVisiblePending = false;\s*try \{\s*aiUnitRenderBatch\.flush\(\)/.test(mainSource), 'flush żetonów zeruje aiUnitVisiblePending');
  // Hak odroczenia zerowany raz i po flushu (ścieżki wyjścia: normalna, błąd w catch eAILoop)
  assert.equal((mainSource.match(/deferRefreshFogUnitSync = null;/g) || []).length, 1, 'hak zerowany w jednym miejscu');
  const catchAt = mainSource.indexOf('} catch (eAILoop) {');
  const clearAt = mainSource.indexOf('deferRefreshFogUnitSync = null;');
  assert(catchAt > 0 && clearAt > catchAt, 'zerowanie haka po catch fazy AI (obejmuje wyjątek i wyjście po bitwie)');
  assert(/flushAiCityRenderBatch\(\);/.test(mainSource.slice(catchAt, clearAt)), 'flush przed zerowaniem haka');

  console.log('resume-flush behavior test: OK (3 scenariusze x {kod, mutacja} + okablowanie)');
})().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });
