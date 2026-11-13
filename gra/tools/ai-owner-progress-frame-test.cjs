'use strict';

// Exercise the production cadence helper after compiling its TypeScript source.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const helperPath = path.join(root, 'src/ui/aiOwnerProgressFrame.ts');
const helperSource = fs.readFileSync(helperPath, 'utf8');
const compiled = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const helperModule = { exports: {} };
new Function('exports', 'module', compiled)(helperModule.exports, helperModule);
const { shouldYieldAiOwnerProgressFrame } = helperModule.exports;

function selected(count, start = 0) {
  return Array.from({ length: count }, (_, index) => index)
    .filter(index => shouldYieldAiOwnerProgressFrame(index, count, start));
}

assert.deepEqual(selected(13), [0, 3, 6, 9, 12], '13 owners paint first, every third, and last (at most five)');
assert.equal(selected(13).length, 5, '13 owners have no more than five forced paint yields');
assert.deepEqual(selected(12), [0, 3, 6, 9, 11], 'last owner paints even when cadence does not land on it');
assert.deepEqual(selected(1), [0], 'single owner is painted once');
assert.deepEqual(selected(0), [], 'empty owner list does not paint');
assert.deepEqual(selected(13, 5), [5, 8, 11, 12], 'resume starts a fresh cadence and still paints last owner');
assert.deepEqual(selected(13, 12), [12], 'resume at final owner paints it');
assert.deepEqual(selected(13, 13), [], 'resume beyond list does not paint');
assert.equal(shouldYieldAiOwnerProgressFrame(-1, 13, 0), false, 'negative index is rejected');

// Guard the integration contract: all owners still update the progress UI before
// the conditional yield, and the existing awaited AI phase/battle-resume loop stays.
const mainSource = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');
const loopStart = mainSource.indexOf('ownerLoop: for (let oi = startOi; oi < ownerLoopList.length; oi++) {');
assert.notEqual(loopStart, -1, 'AI owner loop exists');
const progressStart = mainSource.indexOf("setTurnTransition(aiPct, 'Ruchy i decyzje…', ownerDiploLabel(ownerId), nextTurnNum);", loopStart);
const yieldGate = mainSource.indexOf('if (shouldYieldAiOwnerProgressFrame(oi, ownerLoopList.length, startOi)) {', loopStart);
const yieldCall = mainSource.indexOf('await yieldTurnTransitionUi();', yieldGate);
const ownerWork = mainSource.indexOf('const isCommandResume = oi === startOi', yieldGate);
assert.ok(progressStart > loopStart && yieldGate > progressStart && yieldCall > yieldGate && ownerWork > yieldCall,
  'progress label updates every owner before optional frame yield, without skipping owner work');
assert.ok(mainSource.includes('await runAiPhase();'), 'end-turn still awaits the AI phase');
assert.ok(mainSource.includes('break ownerLoop;'), 'battle/resume interruption still exits through existing owner-loop guard');

console.log('ai-owner-progress-frame: 13 assertions passed');
