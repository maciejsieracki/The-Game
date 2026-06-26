'use strict';
/**
 * converters-test.cjs -- standalone Node test for src/game/converters.ts.
 * Run from gra/:  node tools/converters-test.cjs
 *
 * Self-contained: bundles converters.ts with esbuild (no runtime imports) and
 * runs assertions anchored to Spec-ekonomia.md s.1.5.
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[converters-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.conv-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.conv-bundle.cjs');
fs.writeFileSync(ENTRY_FILE, `
export {
  loadThroughput, DEFAULT_CONVERTER_RECIPES, runConverter, runConverters,
} from '../src/game/converters';
`, 'utf8');

try {
  esbuild.buildSync({ entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE_FILE, logLevel: 'silent' });
} catch (e) { console.error('[converters-test] esbuild failed:\n', e.message || e); process.exit(1); }

const C = require(BUNDLE_FILE);

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// recipes present
eq(C.DEFAULT_CONVERTER_RECIPES.length, 5, 's1.5: 5 default converters');
eq(C.DEFAULT_CONVERTER_RECIPES[0].output, 'deski', 's1.5: tartak -> deski');

const tartak = C.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'tartak');
const huta   = C.DEFAULT_CONVERTER_RECIPES.find(r => r.id === 'huta');

// throughput-limited: 5 drewno, tput 2, cap 50 -> 2 deski
let r = C.runConverter(tartak, { drewno: 5 }, 2, 50);
eq(r.produced, 2, 's1.5: throughput caps to 2'); eq(r.cykle, 2, 's1.5: 2 cycles');
eq(r.stores.drewno, 3, 's1.5: drewno 5-2=3'); eq(r.stores.deski, 2, 's1.5: deski +2'); eq(r.reason, 'ok', 's1.5: ok');
eq(r.consumed.drewno, 2, 's1.5: consumed drewno 2');

// input-limited: 1 drewno, tput 2 -> 1
r = C.runConverter(tartak, { drewno: 1 }, 2, 50);
eq(r.produced, 1, 's1.5: input limits to 1'); eq(r.reason, 'ok', 's1.5: produced>0 -> ok');

// no input -> brak-wejscia
r = C.runConverter(tartak, { drewno: 0 }, 2, 50);
eq(r.produced, 0, 's1.5: no input -> 0'); eq(r.reason, 'brak-wejscia', 's1.5: brak-wejscia');

// full output store -> pelny-magazyn (s1.5 "wstrzymuje sie przy pelnym magazynie")
r = C.runConverter(tartak, { drewno: 5, deski: 50 }, 2, 50);
eq(r.produced, 0, 's1.5: full store -> 0'); eq(r.reason, 'pelny-magazyn', 's1.5: pelny-magazyn');

// partial output room: cap 50, have 49 -> room 1
r = C.runConverter(tartak, { drewno: 5, deski: 49 }, 2, 50);
eq(r.produced, 1, 's1.5: only 1 slot free -> produce 1'); eq(r.stores.deski, 50, 's1.5: deski filled to cap');

// multi-input (Huta: ruda + paliwo): paliwo is the bottleneck
r = C.runConverter(huta, { ruda: 3, paliwo: 1 }, 5, 50);
eq(r.produced, 1, 's1.5: huta limited by paliwo=1'); eq(r.stores.ruda, 2, 's1.5: ruda 3-1'); eq(r.stores.paliwo, 0, 's1.5: paliwo 1-1'); eq(r.stores.braz, 1, 's1.5: braz +1');

// zero throughput (e.g. hard huta=0)
r = C.runConverter(huta, { ruda: 5, paliwo: 5 }, 0, 50);
eq(r.produced, 0, 's1.5: zero throughput -> 0'); eq(r.reason, 'zero-przepustowosci', 's1.5: zero-przepustowosci');

// chain: Mielerz (drewno->paliwo) feeds Huta (ruda+paliwo->braz) in one turn
const mielerz = C.DEFAULT_CONVERTER_RECIPES.find(rr => rr.id === 'mielerz');
const chain = C.runConverters([mielerz, huta], { drewno: 4, ruda: 5 }, { mielerz: 3, huta: 3 }, () => 50);
eq(chain.perBuilding.mielerz.produced, 3, 'chain: mielerz makes 3 paliwo');
eq(chain.perBuilding.huta.produced, 3, 'chain: huta consumes fresh paliwo -> 3 braz');
eq(chain.stores.braz, 3, 'chain: final braz 3'); eq(chain.stores.paliwo, 0, 'chain: paliwo all consumed'); eq(chain.stores.drewno, 1, 'chain: drewno 4-3=1'); eq(chain.stores.ruda, 2, 'chain: ruda 5-3=2');

// loadThroughput: reads budynki group + fallback
eq(C.loadThroughput({ budynki: { budynek_tartak_przepustowosc: { easy: 3, normal: 2 } } }, 'budynek_tartak_przepustowosc', 'easy', 2), 3, 'load: tartak easy=3');
eq(C.loadThroughput({}, 'budynek_huta_przepustowosc', 'normal', 1), 1, 'load: missing -> fallback 1');

console.log(`\nconverters-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
