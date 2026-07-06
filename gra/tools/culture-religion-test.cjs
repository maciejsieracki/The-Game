'use strict';
/**
 * culture-religion-test.cjs -- standalone Node test for src/game/culture-religion.ts.
 * Run from gra/:  node tools/culture-religion-test.cjs
 *
 * Self-contained: bundles ONLY culture-religion.ts with esbuild (no runtime
 * imports from src/) and runs assertions on:
 *   A. spreadReligion  -- dominance check, slot calculation, pressure, range filter
 *   B. cityTradeMultiplier (tradeMult) -- gate open/closed, civ match, fallback
 *   (existing helpers: dominantReligion, religionHappiness, convertViaTemple
 *    are exercised indirectly; direct tests stay minimal.)
 */

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// esbuild
// ---------------------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[culture-religion-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.cr-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.cr-bundle.cjs');

const ENTRY_TS = `
export {
  FALLBACK_RELIGION_PARAMS,
  FALLBACK_CULTURE_PARAMS,
  FALLBACK_TRADE_MULT,
  loadReligionParams,
  loadCultureParams,
  civReligion,
  civReligionForKey,
  resolveCityReligionState,
  defaultCityReligionState,
  isEmptyReligionState,
  dominantReligion,
  spreadReligion,
  makeRng,
  cityTradeMultiplier,
  accumulateCulture,
  cityBorderRadius,
  cultureHappiness,
  convertViaTemple,
} from '../src/game/culture-religion';
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
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[culture-religion-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const CR = require(BUNDLE_FILE);

// ---------------------------------------------------------------------------
// tiny assertion framework
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) {
  assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}
function near(a, b, msg, eps) {
  eps = (eps !== undefined) ? eps : 1e-9;
  assert(Math.abs(a - b) < eps, `${msg} (got ${JSON.stringify(a)}, want ~${JSON.stringify(b)})`);
}

const P = CR.FALLBACK_RELIGION_PARAMS;

// ===========================================================================
// A. spreadReligion
// ===========================================================================

// A1. Source city with no dominant religion -> no spread.
const emptySource = { counts: {} };
const r1 = CR.spreadReligion(emptySource, [
  { id: 'b', distance: 1, state: { counts: {} } }
], P, { hasSwiatynia: false, pressure: 1, seed: 0 });
eq(r1.reached, 0, 'A1: empty source -> reached = 0');
eq(r1.events.length, 0, 'A1: empty source -> events empty');

// A2. Source city with 60% "OlympA" (> 50% threshold) -> dominates.
const sourceOlymp = { counts: { 'OlympA': 6, 'OtherB': 4 } };
const dom = CR.dominantReligion(sourceOlymp, P);
eq(dom.status, 'dominant', 'A2 pre-check: OlympA dominant');
eq(dom.religion, 'OlympA', 'A2 pre-check: religion name');

// A3. No-swiatynia: base slot = 1 (normal fallback), spread to 1 neighbour.
const neighbors3 = [
  { id: 'city1', distance: 1, state: { counts: {} } },
  { id: 'city2', distance: 2, state: { counts: {} } },
];
const r3 = CR.spreadReligion(sourceOlymp, neighbors3, P, { hasSwiatynia: false, pressure: 1, seed: 42 });
eq(r3.reached, 1, 'A3: base slot=1 -> reaches 1 neighbour');
eq(r3.events[0].religion, 'OlympA', 'A3: correct religion spreads');
eq(r3.events[0].added, 1, 'A3: pressure=1 added');
// Nearest-first: city1 (dist 1) must be first picked.
eq(r3.events[0].id, 'city1', 'A3: nearest neighbour picked first');

// A4. With Swiatynia: slot = base(1) + bonus(1) = 2 -> both neighbours reached.
const r4 = CR.spreadReligion(sourceOlymp, neighbors3, P, { hasSwiatynia: true, pressure: 1, seed: 42 });
eq(r4.reached, 2, 'A4: swiatynia bonus -> 2 slots');

// A5. Distance filter: neighbour beyond max range not reached.
// szerzenieMaxDystans = 3 (normal fallback)
const neighborsBeyond = [
  { id: 'near', distance: 1, state: { counts: {} } },
  { id: 'far',  distance: 4, state: { counts: {} } }, // beyond max dist 3
];
const r5 = CR.spreadReligion(sourceOlymp, neighborsBeyond, P, { hasSwiatynia: false, pressure: 1, seed: 0 });
eq(r5.reached, 1, 'A5: out-of-range neighbour excluded');
eq(r5.events[0].id, 'near', 'A5: only in-range neighbour reached');

// A6. Population cap: neighbour with population 5, already 4 adherents of other
// -> room = 1, spread adds at most 1 even if pressure=5.
const neighborCapped = [
  { id: 'capped', distance: 1, state: { counts: { 'OtherB': 4 } }, population: 5 }
];
const r6 = CR.spreadReligion(sourceOlymp, neighborCapped, P, { hasSwiatynia: false, pressure: 5, seed: 0 });
eq(r6.reached, 1, 'A6: capped neighbour still reached');
eq(r6.events[0].added, 1, 'A6: added capped at room (5-4=1)');

// A7. Immutability: source and neighbour states unchanged after spread.
const srcBefore = JSON.stringify(sourceOlymp);
const nbBefore  = JSON.stringify(neighbors3[0]);
CR.spreadReligion(sourceOlymp, neighbors3, P, { hasSwiatynia: true, pressure: 3, seed: 1 });
eq(JSON.stringify(sourceOlymp), srcBefore, 'A7: source not mutated');
eq(JSON.stringify(neighbors3[0]), nbBefore, 'A7: neighbour state not mutated');

// A8. Determinism: same seed -> same result.
const r8a = CR.spreadReligion(sourceOlymp, neighbors3, P, { hasSwiatynia: false, pressure: 1, seed: 99 });
const r8b = CR.spreadReligion(sourceOlymp, neighbors3, P, { hasSwiatynia: false, pressure: 1, seed: 99 });
eq(JSON.stringify(r8a), JSON.stringify(r8b), 'A8: deterministic with same seed');

// A9. Mixed source (no dominant) -> no spread even with swiatynia.
const mixed = { counts: { 'RelA': 5, 'RelB': 5 } };
const domMixed = CR.dominantReligion(mixed, P);
eq(domMixed.status, 'mixed', 'A9 pre-check: mixed state');
const r9 = CR.spreadReligion(mixed, neighbors3, P, { hasSwiatynia: true, pressure: 2, seed: 0 });
eq(r9.reached, 0, 'A9: mixed source -> no spread');

// A10. Event carries updated state with new religion count.
const srcA10 = { counts: { 'Sol': 8, 'Other': 2 } };
const nbA10 = [{ id: 'city10', distance: 2, state: { counts: { 'OtherX': 3 } } }];
const r10 = CR.spreadReligion(srcA10, nbA10, P, { hasSwiatynia: false, pressure: 2, seed: 0 });
eq(r10.events[0].state.counts['Sol'], 2, 'A10: event state contains newly spread religion count');
eq(r10.events[0].state.counts['OtherX'], 3, 'A10: event state preserves existing counts');

// ===========================================================================
// B. cityTradeMultiplier (tradeMult)
// ===========================================================================

// Mock civs.json data mirroring the real structure.
const mockCivs = {
  cywilizacje: [
    { Cywilizacja: 'Grecy',    Religia: 'Politeizm olimpijski',      mnoznikHandelPieniadz: 2.3 },
    { Cywilizacja: 'Rzymianie',Religia: 'Religia rzymska / kult państwa', mnoznikHandelPieniadz: 2.0 },
    { Cywilizacja: 'Chinczycy',Religia: 'Konfucjanizm / Taoizm',     mnoznikHandelPieniadz: 2.4 },
  ]
};

// City with Greek religion dominant (7/10 = 70% > 50%).
const cityGreek = { counts: { 'Politeizm olimpijski': 7, 'Inne': 3 } };
// City with Roman religion dominant.
const cityRoman = { counts: { 'Religia rzymska / kult państwa': 9, 'Inne': 1 } };
// City with mixed / no dominant.
const cityMixed = { counts: { 'RelA': 5, 'RelB': 5 } };
// City with no adherents.
const cityEmpty = { counts: {} };

// B1. Gate CLOSED (gated=false) -> multiplier = 1 always.
const b1 = CR.cityTradeMultiplier(cityGreek, 'Grecy', mockCivs, P, false);
near(b1.multiplier, 1.0, 'B1: gate closed -> multiplier = 1');
eq(b1.applied, false, 'B1: gate closed -> applied = false');
near(b1.civBaseMultiplier, 2.3, 'B1: civBaseMultiplier still read = 2.3', 1e-9);

// B2. Gate OPEN + religion matches -> apply civ multiplier.
const b2 = CR.cityTradeMultiplier(cityGreek, 'Grecy', mockCivs, P, true);
near(b2.multiplier, 2.3, 'B2: gate open, match -> multiplier = 2.3', 1e-9);
eq(b2.applied, true, 'B2: gate open, match -> applied = true');
eq(b2.dominantReligion, 'Politeizm olimpijski', 'B2: dominant religion reported');

// B3. Gate OPEN + owner civ is Roman but city has Greek religion -> no bonus.
const b3 = CR.cityTradeMultiplier(cityGreek, 'Rzymianie', mockCivs, P, true);
near(b3.multiplier, 1.0, 'B3: religion mismatch -> multiplier = 1');
eq(b3.applied, false, 'B3: religion mismatch -> applied = false');

// B4. Gate OPEN + city has no dominant religion -> no bonus.
const b4 = CR.cityTradeMultiplier(cityMixed, 'Grecy', mockCivs, P, true);
near(b4.multiplier, 1.0, 'B4: mixed city -> multiplier = 1');
eq(b4.dominantReligion, null, 'B4: dominantReligion = null');

// B5. Gate OPEN + empty city -> no bonus.
const b5 = CR.cityTradeMultiplier(cityEmpty, 'Grecy', mockCivs, P, true);
near(b5.multiplier, 1.0, 'B5: empty city -> multiplier = 1');

// B6. Unknown civ name -> civBaseMultiplier = null, multiplier = 1.
const b6 = CR.cityTradeMultiplier(cityGreek, 'UnknownCiv', mockCivs, P, true);
eq(b6.civBaseMultiplier, null, 'B6: unknown civ -> civBaseMultiplier = null');
near(b6.multiplier, 1.0, 'B6: unknown civ -> multiplier = 1');

// B7. null owner civ -> multiplier = 1, no crash.
const b7 = CR.cityTradeMultiplier(cityGreek, null, mockCivs, P, true);
near(b7.multiplier, 1.0, 'B7: null owner -> multiplier = 1');
eq(b7.applied, false, 'B7: null owner -> applied = false');

// B8. null civs data -> multiplier = 1, no crash.
const b8 = CR.cityTradeMultiplier(cityGreek, 'Grecy', null, P, true);
near(b8.multiplier, 1.0, 'B8: null civs -> multiplier = 1');

// B9. Civ row missing mnoznikHandelPieniadz -> multiplier = 1.
const civsMissing = { cywilizacje: [{ Cywilizacja: 'Grecy', Religia: 'Politeizm olimpijski' }] };
const b9 = CR.cityTradeMultiplier(cityGreek, 'Grecy', civsMissing, P, true);
near(b9.multiplier, 1.0, 'B9: missing mnoznikHandelPieniadz -> multiplier = 1 (fallback)');
eq(b9.civBaseMultiplier, null, 'B9: civBaseMultiplier = null when field absent');

// B10. Roman city with gated=true and correct owner -> apply 2.0.
const b10 = CR.cityTradeMultiplier(cityRoman, 'Rzymianie', mockCivs, P, true);
near(b10.multiplier, 2.0, 'B10: Roman match, gated -> multiplier = 2.0', 1e-9);
eq(b10.applied, true, 'B10: applied = true');

// ===========================================================================
// C. Regression: existing spreadReligion uses makeRng deterministically
// ===========================================================================

// C1. makeRng with the same seed always yields same sequence.
const rng1 = CR.makeRng(12345);
const rng2 = CR.makeRng(12345);
const v1 = [rng1(), rng1(), rng1()];
const v2 = [rng2(), rng2(), rng2()];
eq(JSON.stringify(v1), JSON.stringify(v2), 'C1: makeRng same seed -> same sequence');

// C2. makeRng with seed 0 doesn't crash (was edge case: seed 0 || 1 guard).
const rng0 = CR.makeRng(0);
assert(typeof rng0() === 'number', 'C2: makeRng(0) returns number');

// ===========================================================================
// D. Sanity: spreadReligion event state is a NEW object (not a reference)
// ===========================================================================

const srcD = { counts: { 'TestRel': 9, 'B': 1 } };
const nbD  = [{ id: 'nb1', distance: 1, state: { counts: {} } }];
const rD   = CR.spreadReligion(srcD, nbD, P, { hasSwiatynia: false, pressure: 1, seed: 0 });
// Mutate the event state after the fact.
rD.events[0].state.counts['TestRel'] = 999;
// Original neighbour should be unaffected.
eq(nbD[0].state.counts['TestRel'], undefined, 'D1: event state is independent of original neighbour');

// ===========================================================================
// E. T0 religion — resolveCityReligionState (luka UX przed turą 1)
// ===========================================================================

const mockSociety = {
  religie_cywilizacji: [
    { Cywilizacja: 'Rzymianie', 'Religia / wyznanie': 'Kult cesarski' },
    { Cywilizacja: 'Grecy', 'Religia / wyznanie': 'Politeizm olimpijski' },
  ],
};
const mockCivsRel = {
  cywilizacje: [
    { Cywilizacja: 'Rzymianie', ikonaId: 'rzymianie' },
    { Cywilizacja: 'Grecy', ikonaId: 'grecy' },
  ],
};

eq(
  CR.civReligionForKey('rzymianie', mockSociety, mockCivsRel),
  'Kult cesarski',
  'E1: civReligionForKey resolves ikonaId -> religion',
);
eq(
  CR.civReligionForKey('Rzymianie', mockSociety, mockCivsRel),
  'Kult cesarski',
  'E2: civReligionForKey accepts display name',
);

const empty = CR.resolveCityReligionState(undefined, 1, 'Kult cesarski');
eq(empty.counts['Kult cesarski'], 1, 'E3: empty stored -> 100% own religion at pop 1');
const domE = CR.dominantReligion(empty, CR.FALLBACK_RELIGION_PARAMS);
eq(domE.status, 'dominant', 'E3b: T0 state is dominant');
eq(domE.religion, 'Kult cesarski', 'E3c: dominant religion name');

const mixedStored = { counts: { 'Obca wiara': 1, 'Kult cesarski': 1 } };
eq(
  CR.resolveCityReligionState(mixedStored, 2, 'Kult cesarski').counts['Obca wiara'],
  1,
  'E4: existing mixed state is preserved',
);
assert(CR.isEmptyReligionState({ counts: {} }), 'E5: empty counts -> isEmpty');
assert(!CR.isEmptyReligionState(empty), 'E6: seeded state -> not empty');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\nculture-religion-test: ' + passed + ' passed, ' + failed + ' failed');
try { fs.unlinkSync(ENTRY_FILE);  } catch (_) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (_) {}
process.exit(failed ? 1 : 0);
