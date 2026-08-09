'use strict';
/**
 * hud-miasto-stan-cywilizacji-test.cjs -- guards R-HUD-MIASTO-STAN-CYWILIZACJI
 * (2026-08-08, playtest Macieja): city-panel HUD chips (Praca/Żywność/Skarbiec/
 * Nauka/Kultura/Religia) now show the civ-wide total as the big number and the
 * current city's own value as a small "+N"/"-N" secondary number.
 *
 * Tests the pure aggregator `civWideSixStatsFromEmpireSnap()`
 * (src/game/empire-hud-totals.ts) that `ui/cityPanel.ts::buildCityOnlyW3FlankChips`
 * calls to decide the chip's big number. It does NOT recompute anything itself --
 * it only picks between the engine-backed empire snapshot (`resolveEmpireSnap()` /
 * `cfg.getEmpireHud` -> `buildHudState()` in main.ts) and the city's own value as
 * a fallback -- so this test fixes that contract:
 *
 *   1. Empire snapshot present (multi-city fixture) -> big number == the engine's
 *      number verbatim (NOT re-summed / NOT double-counted with the city's own
 *      contribution).
 *   2. Empire snapshot absent/undefined per-field (1-city owner with no engine
 *      wiring, e.g. AI without cfg.getEmpireHud and no map/data) -> big number
 *      falls back to the city's own value, so civ total == city-only value with
 *      no misleading double count and no misleading "0".
 *   3. Religia rounds (Math.round) exactly like the CityOnly `przyrostWiernych`
 *      reading it mirrors.
 *
 * Run from gra/:  node tools/hud-miasto-stan-cywilizacji-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[hud-miasto-stan-cywilizacji-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.hud-miasto-stan-cywilizacji-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.hud-miasto-stan-cywilizacji-bundle.cjs');

const ENTRY_TS = `
import { civWideSixStatsFromEmpireSnap } from '../src/game/empire-hud-totals';
export { civWideSixStatsFromEmpireSnap };
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf-8');

console.log('[hud-miasto-stan-cywilizacji-test] Bundling src/game/empire-hud-totals.ts with esbuild...');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle:      true,
    platform:    'node',
    format:      'cjs',
    outfile:     BUNDLE_FILE,
    loader:      { '.json': 'json', '.ts': 'ts' },
    target:      ['node16'],
    logLevel:    'warning',
  });
} catch (e) {
  console.error('[hud-miasto-stan-cywilizacji-test] esbuild failed:', e.message || e);
  process.exit(1);
} finally {
  fs.unlinkSync(ENTRY_FILE);
}

const { civWideSixStatsFromEmpireSnap } = require(BUNDLE_FILE);

// ---------------------------------------------------------------------------
// Assertion harness (same minimal style as the other tools/*-test.cjs files)
// ---------------------------------------------------------------------------
let passed = 0, failed = 0;
function assert(name, cond, detail) {
  if (cond) { passed++; console.log(`PASS: ${name}`); }
  else { failed++; console.log(`FAIL: ${name}${detail ? ' -- ' + detail : ''}`); }
}

// ---------------------------------------------------------------------------
// Fixture 1: multi-city owner (e.g. 3 cities: this city + 2 others), engine
// already produced the aggregate (resolveEmpireSnap / getEmpireHud path) --
// mirrors an owner whose `pracaRate` etc. are the SAME field cityPracaSplit.total
// reads, just summed by the engine across all cities: this city (12) + city B
// (200) + city C (128) = 340.
// ---------------------------------------------------------------------------
{
  const cityOwn = { praca: 12, zywnosc: 3, zloto: 8, nauka: 5, kultura: 4, religia: 2 };
  const empire = {
    pracaRate: 340,   // 12 (this city) + 200 + 128 (peers) -- engine total
    zywnoscRate: 30,
    zlotoRate: 64,
    naukaRate: 41,
    kulturaRate: 22,
    religionRate: 17,
  };
  const civ = civWideSixStatsFromEmpireSnap(empire, cityOwn);

  assert('Praca: big number == engine total (340), not re-summed with city own value',
    civ.praca === 340, `got ${civ.praca}`);
  assert('Praca: big number != city-only value alone (would be misleading no-op chip)',
    civ.praca !== cityOwn.praca, `got ${civ.praca}`);
  assert('Zywnosc: big number == engine total', civ.zywnosc === 30, `got ${civ.zywnosc}`);
  assert('Zloto: big number == engine total', civ.zloto === 64, `got ${civ.zloto}`);
  assert('Nauka: big number == engine total', civ.nauka === 41, `got ${civ.nauka}`);
  assert('Kultura: big number == engine total', civ.kultura === 22, `got ${civ.kultura}`);
  assert('Religia: big number == engine total', civ.religia === 17, `got ${civ.religia}`);

  // The "small" secondary number is `cityOwn.*` itself (rendered separately by
  // w3CityChip's cityDelta param) -- assert it's untouched by the aggregator,
  // i.e. the caller still has the original per-city figures to show as "+N".
  assert('cityOwn object passed through untouched (still has this city\'s own 12 Praca for the small "+N")',
    cityOwn.praca === 12, `got ${cityOwn.praca}`);
}

// ---------------------------------------------------------------------------
// Fixture 2: 1-city owner, no engine/aggregate data available for a field
// (undefined empire.*Rate, e.g. AI city with cfg.getEmpireHud returning null
// and no map/data to fall back on) -- civ total MUST equal the city-only
// value, not 0 and not double-counted (own value counted only once).
// ---------------------------------------------------------------------------
{
  const cityOwn = { praca: 12, zywnosc: -3, zloto: 8, nauka: 5, kultura: 0, religia: -2 };
  const civ = civWideSixStatsFromEmpireSnap({}, cityOwn);

  assert('1-city owner, no engine data: Praca civ total == city-only value (no double count)',
    civ.praca === cityOwn.praca, `got ${civ.praca}, expected ${cityOwn.praca}`);
  assert('1-city owner, no engine data: Zywnosc civ total == city-only value',
    civ.zywnosc === cityOwn.zywnosc, `got ${civ.zywnosc}`);
  assert('1-city owner, no engine data: Zloto civ total == city-only value',
    civ.zloto === cityOwn.zloto, `got ${civ.zloto}`);
  assert('1-city owner, no engine data: Nauka civ total == city-only value',
    civ.nauka === cityOwn.nauka, `got ${civ.nauka}`);
  assert('1-city owner, no engine data: Kultura civ total == city-only value (0, not misleadingly blank)',
    civ.kultura === cityOwn.kultura, `got ${civ.kultura}`);
  assert('1-city owner, no engine data: Religia civ total == city-only value',
    civ.religia === cityOwn.religia, `got ${civ.religia}`);
  assert('1-city owner, no engine data: none of the totals silently became 0 when city-own wasn\'t 0',
    civ.praca !== 0 && civ.zywnosc !== 0 && civ.zloto !== 0 && civ.nauka !== 0 && civ.religia !== 0,
    `civ=${JSON.stringify(civ)}`);
}

// ---------------------------------------------------------------------------
// Fixture 3: partial data -- some fields from the engine, others missing
// (e.g. religionRate absent because the fallback branch of resolveEmpireSnap
// didn't run for some reason) -- each field degrades independently.
// ---------------------------------------------------------------------------
{
  const cityOwn = { praca: 7, zywnosc: 1, zloto: 2, nauka: 3, kultura: 4, religia: 9 };
  const civ = civWideSixStatsFromEmpireSnap({ pracaRate: 99, kulturaRate: 50 }, cityOwn);

  assert('Partial snapshot: Praca uses engine value (99)', civ.praca === 99, `got ${civ.praca}`);
  assert('Partial snapshot: Kultura uses engine value (50)', civ.kultura === 50, `got ${civ.kultura}`);
  assert('Partial snapshot: Zywnosc (missing from snapshot) falls back to city-only (1)',
    civ.zywnosc === 1, `got ${civ.zywnosc}`);
  assert('Partial snapshot: Religia (missing from snapshot) falls back to city-only (9)',
    civ.religia === 9, `got ${civ.religia}`);
}

// ---------------------------------------------------------------------------
// Fixture 4: religionRate rounding -- przyrostWiernych/spreadRateTotal can be
// fractional upstream; the chip must show a rounded integer like CityOnly's
// own `Math.round(przyrostWiernych)` reading does.
// ---------------------------------------------------------------------------
{
  const civ = civWideSixStatsFromEmpireSnap(
    { religionRate: 4.6 },
    { praca: 0, zywnosc: 0, zloto: 0, nauka: 0, kultura: 0, religia: 0 },
  );
  assert('Religia: engine value rounded (4.6 -> 5)', civ.religia === 5, `got ${civ.religia}`);
}

fs.unlinkSync(BUNDLE_FILE);

// ---------------------------------------------------------------------------
console.log('');
console.log(`hud-miasto-stan-cywilizacji-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
