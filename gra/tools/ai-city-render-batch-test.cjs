'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const helperPath = path.join(root, 'src/game/dirtyRenderSync.ts');
const helperSource = fs.readFileSync(helperPath, 'utf8');
const compiled = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const helperModule = { exports: {} };
new Function('exports', 'module', compiled)(helperModule.exports, helperModule);
const { createDirtyRenderSync } = helperModule.exports;

let calls = 0;
const batch = createDirtyRenderSync(() => { calls++; });
assert.equal(batch.isDirty(), false, 'batch starts clean');
assert.equal(batch.flush(), false, 'clean batch does not call renderer');
batch.markDirty();
batch.markDirty();
assert.equal(batch.flush(), true, 'two city mutations flush once');
assert.equal(calls, 1, 'one renderer sync covers both city mutations before a paint');
assert.equal(batch.isDirty(), false, 'successful sync clears dirty flag');
assert.equal(batch.flush(), false, 'already synchronized batch stays idle');

let failOnce = true;
const retryBatch = createDirtyRenderSync(() => {
  if (failOnce) {
    failOnce = false;
    throw new Error('synthetic renderer failure');
  }
});
retryBatch.markDirty();
assert.throws(() => retryBatch.flush(), /synthetic renderer failure/);
assert.equal(retryBatch.isDirty(), true, 'failed renderer sync remains pending for next boundary');
assert.equal(retryBatch.flush(), true, 'later boundary retries the failed sync');
assert.equal(retryBatch.isDirty(), false, 'successful retry clears pending state');

const mainSource = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');
const aiStart = mainSource.indexOf('// AI TURN LOOP: execute commands for every AI rival');
const barbStart = mainSource.indexOf("setTurnTransition(94, 'Barbarzyńcy…'", aiStart);
assert.ok(aiStart >= 0 && barbStart > aiStart, 'AI phase and following UI boundary exist');
const aiBody = mainSource.slice(aiStart, barbStart);

const foundCityStart = aiBody.indexOf("if (cmd.type === 'foundCityAt') {");
const foundCityEnd = aiBody.indexOf("if (cmd.type === 'attack') {", foundCityStart);
assert.ok(foundCityStart >= 0 && foundCityEnd > foundCityStart, 'AI found-city command exists');
const foundCityBody = aiBody.slice(foundCityStart, foundCityEnd);
assert.ok(foundCityBody.indexOf('finalizeCityFounding(c, cmd.q, cmd.r)')
  < foundCityBody.indexOf('aiCityRenderBatch.markDirty()'), 'new city model is marked dirty after domain initialization');
assert.ok(!foundCityBody.includes('cityRenderer.sync('), 'founding no longer performs a full renderer sync per city');

const yieldStart = aiBody.indexOf('if (shouldYieldAiOwnerProgressFrame(oi, ownerLoopList.length, startOi)) {');
const yieldEnd = aiBody.indexOf('const isCommandResume =', yieldStart);
const yieldBody = aiBody.slice(yieldStart, yieldEnd);
assert.ok(yieldStart >= 0 && yieldEnd > yieldStart
  && yieldBody.indexOf('flushAiCityRenderBatch();') < yieldBody.indexOf('await yieldTurnTransitionUi();'),
'dirty city models flush before each actual owner progress paint');

const battleStart = aiBody.indexOf('launchIncomingMapFieldBattle(');
const battleFlush = aiBody.lastIndexOf('flushAiCityRenderBatch();', battleStart);
assert.ok(battleStart >= 0 && battleFlush >= 0 && battleFlush < battleStart,
  'dirty city models flush before handing control to a battle');

const catchStart = mainSource.indexOf("} catch (eAILoop) {", barbStart - 700);
const turnBarbBoundary = mainSource.indexOf("setTurnTransition(94, 'Barbarzyńcy…'", catchStart);
assert.ok(catchStart >= 0 && turnBarbBoundary > catchStart
  && mainSource.slice(catchStart, turnBarbBoundary).includes('flushAiCityRenderBatch();'),
  'dirty city models flush after AI completion/errors before barbarian UI paint');

console.log('ai-city-render-batch: 17 assertions passed');
