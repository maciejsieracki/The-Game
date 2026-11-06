'use strict';
/**
 * R-WEB-PERF-ENDTURN-RENDER-HUD-Q1 (obrona r1, zarzut 5): test statyczny okablowania odroczenia
 * żetonów jednostek w fazie AI (deferRefreshFogUnitSync / aiUnitRenderBatch).
 * Sprawdza, że: hak jest zadeklarowany raz; ustawiany wyłącznie w bloku fazy AI; refreshFog odracza
 * tylko przy fogOn; flush żetonów jest przed zerowaniem haka po catch fazy AI; zerowanie jest raz.
 * Usage: node tools/perf-endturn-render-deferral-regression-test.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'src/main.ts'), 'utf8');
const count = (re) => (source.match(re) || []).length;

assert.equal(count(/let deferRefreshFogUnitSync: \(\(\) => void\) \| null = null;/g), 1,
  'deferRefreshFogUnitSync must be declared exactly once');

const fogStart = source.indexOf('    function refreshFog(');
const fogEnd = source.indexOf('\n    /**', fogStart);
assert(fogStart >= 0 && fogEnd > fogStart, 'refreshFog markers must exist');
const fogBody = source.slice(fogStart, fogEnd);

assert.equal((fogBody.match(/if \(fogOn && deferRefreshFogUnitSync\) deferRefreshFogUnitSync\(\);/g) || []).length, 1,
  'refreshFog must defer unit sync only under fogOn');
assert.equal((fogBody.match(/syncUnitsRender\(/g) || []).length, 2,
  'refreshFog keeps two immediate syncUnitsRender calls: fogOn-without-hook fallback and the no-fog branch');

const setAt = source.indexOf('deferRefreshFogUnitSync = () => aiUnitRenderBatch.markDirty();');
assert(setAt > 0, 'AI phase must install the deferral hook');
assert.equal(count(/deferRefreshFogUnitSync = \(\) =>/g), 1, 'hook may be installed in exactly one place');
assert(setAt > source.indexOf('const aiUnitRenderBatch = createDirtyRenderSync('), 'batch must exist before the hook is installed');

const clearAt = source.indexOf('deferRefreshFogUnitSync = null;');
assert(clearAt > 0, 'hook must be cleared after the AI phase');
assert.equal(count(/deferRefreshFogUnitSync = null;/g), 1, 'hook must be cleared in exactly one place');
const catchAt = source.indexOf('} catch (eAILoop) {');
assert(catchAt > setAt && clearAt > catchAt, 'clear must come after the AI-phase catch');
const flushBetween = source.slice(catchAt, clearAt);
assert(/flushAiCityRenderBatch\(\);/.test(flushBetween), 'AI-phase end must flush the unit batch before clearing the hook');
assert(/aiUnitRenderBatch\.flush\(\)/.test(source), 'unit batch flush must be implemented');

console.log('deferral regression: OK (7 assertions groups)');
