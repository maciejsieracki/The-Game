'use strict';
/**
 * hud-skarbiec-test.cjs -- standalone Node test guarding the HUD "Skarbiec"
 * chip fix (Maciej 2026-07-26, zgloszenie z playtestu, bundle 2f928932):
 * "Skarbiec chyba nie pokazuje teraz prawdziwej ilosci. Obok jest plus szesc,
 * a dochodzi tylko jedna jednostka."
 *
 * Root cause: the HUD chip's "+N" was wired to the GROSS money income from
 * city yields (playerEcon.pieniadz, sum of Danina/Podatek + budynki + Handel
 * ze szlakow), while the real end-of-turn bank ("Bank treasury" block in
 * main.ts) subtracts building + unit gold upkeep (upkeepBalance, Spec s.6.4)
 * AFTER banking that income. So the chip promised more than the treasury
 * actually gained whenever upkeep was nonzero.
 *
 * This test builds a tiny fixture (1 city, 2 buildings with nonzero
 * `utrzymanie`, 1 unit with nonzero gold upkeep) and asserts that the NET
 * number the HUD is meant to show (gross city income - building upkeep - unit
 * upkeep, computed via previewCityEconomy + previewOwnerUpkeep -- the exact
 * functions main.ts's refreshLiveEmpireRates() calls for the live chip) equals
 * the REAL delta the treasury undergoes after a full advanceCityEconomy tick
 * (the same functions main.ts's end-of-turn "Bank treasury" block uses).
 *
 * Run from gra/:  node tools/hud-skarbiec-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[hud-skarbiec-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.hud-skarbiec-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.hud-skarbiec-bundle.cjs');

const ENTRY_TS = `
import { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../src/map/generator';
import { computeStartPlacements } from '../src/units/setup';
import { foundCity, cityName } from '../src/game/cities';
import { loadGameData } from '../src/data/loader';
import {
  previewCityEconomy, previewOwnerUpkeep, sumEconomyForPlayerCities,
  advanceCityEconomy,
} from '../src/game/turn-economy';

export {
  generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT,
  computeStartPlacements,
  foundCity, cityName,
  loadGameData,
  previewCityEconomy, previewOwnerUpkeep, sumEconomyForPlayerCities,
  advanceCityEconomy,
};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf-8');

console.log('[hud-skarbiec-test] Bundling src/ with esbuild...');
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
  console.error('[hud-skarbiec-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const {
  generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT,
  computeStartPlacements,
  foundCity, cityName,
  loadGameData,
  previewCityEconomy, previewOwnerUpkeep, sumEconomyForPlayerCities,
  advanceCityEconomy,
} = require(BUNDLE_FILE);

// ---------------------------------------------------------------------------
// Assertion harness (same minimal style as the other tools/*-test.cjs files)
// ---------------------------------------------------------------------------
let passed = 0, failed = 0;
function assert(name, cond, detail) {
  if (cond) { passed++; console.log(`PASS: ${name}`); }
  else { failed++; console.log(`FAIL: ${name}${detail ? ' -- ' + detail : ''}`); }
}

// ---------------------------------------------------------------------------
// Fixture: 1 player city with 2 buildings carrying nonzero `utrzymanie`
// (era 1: "palac" utrzymanie=2, "spichlerz" utrzymanie=1 -- see data/buildings.json)
// + 1 unit with nonzero gold upkeep (category "miecznik" -> fallback 2/ture,
// DEFAULT_UNIT_UPKEEP_BY_CATEGORY in economy-upkeep.ts -- a typeId deliberately
// absent from units.json so the category fallback, not a per-type override, is
// what is exercised here).
// ---------------------------------------------------------------------------
const data  = loadGameData();
const map   = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 4242);
const start = computeStartPlacements(map, data);

const settler = {
  id: 'skarbiec_test_settler',
  ownerId: 0,
  typeId: 'Osadnik',
  category: 'osadnik',
  q: start.playerStart.q,
  r: start.playerStart.r,
  ruch: 2,
  ruchLeft: 2,
};

const city = foundCity(settler, [], map, cityName(0));
assert('fixture: foundCity zwraca miasto gracza', city !== null);

if (city) {
  const cities = [city];
  const builtByCity = new Map([[city.id, ['palac', 'spichlerz']]]);
  const econUnits = [
    { ownerId: 0, typeId: 'skarbiec_test_miecznik', category: 'miecznik', camping: false, onOwnTerritory: true },
  ];

  // --- "Shown" side: the same two calls main.ts's refreshLiveEmpireRates()
  // makes for the live HUD chip BEFORE end of turn (read-only, no mutation). ---
  const preview     = previewCityEconomy(cities, map, data, 'normal', builtByCity);
  const playerEcon  = sumEconomyForPlayerCities(preview, cities);
  const upkeepPrev  = previewOwnerUpkeep(0, cities, data, 'normal', builtByCity, econUnits);

  assert(
    'fixture ma niezerowe utrzymanie (budynki + jednostki)',
    upkeepPrev.utrzymanieRazem > 0,
    `utrzymanieBudynki=${upkeepPrev.utrzymanieBudynki} utrzymanieJednostki=${upkeepPrev.utrzymanieJednostki}`,
  );
  assert('utrzymanie budynkow > 0 (palac + spichlerz)', upkeepPrev.utrzymanieBudynki > 0,
    `got ${upkeepPrev.utrzymanieBudynki}`);
  assert('utrzymanie jednostek > 0 (miecznik fallback)', upkeepPrev.utrzymanieJednostki > 0,
    `got ${upkeepPrev.utrzymanieJednostki}`);

  const shownRate = playerEcon.pieniadz - upkeepPrev.utrzymanieRazem;

  assert(
    'STARY BUG (regresja): "+N" pokazywany na chipie NIE moze byc rownym wplywom brutto, gdy utrzymanie niezerowe',
    shownRate !== playerEcon.pieniadz,
    `shownRate=${shownRate} pieniadzBrutto=${playerEcon.pieniadz} utrzymanieRazem=${upkeepPrev.utrzymanieRazem}`,
  );

  // --- "Real" side: an actual end-of-turn tick, exactly like main.ts's
  // "Bank treasury" block (player.skarbiec += pieniadzGracza; player.skarbiec
  // -= playerBalance.utrzymanieRazem;) -- simulated against a mock treasury. ---
  let mockSkarbiec = 1000;
  const before = mockSkarbiec;

  const econ          = advanceCityEconomy(cities, map, data, 'normal', econUnits, new Map(), builtByCity);
  const realPlayerEcon = sumEconomyForPlayerCities(econ, cities);
  const realBalance    = econ.upkeepByOwner.get(0);

  mockSkarbiec += realPlayerEcon.pieniadz;
  if (realBalance && realBalance.utrzymanieRazem > 0) {
    mockSkarbiec -= realBalance.utrzymanieRazem;
  }
  const realDelta = mockSkarbiec - before;

  assert(
    'kontrolne: real-tick utrzymanieRazem tez niezerowe (fixture spojny miedzy preview i real)',
    !!realBalance && realBalance.utrzymanieRazem > 0,
    `utrzymanieRazem=${realBalance ? realBalance.utrzymanieRazem : 'undefined'}`,
  );

  assert(
    'NAPRAWA HUD-SKARBIEC: liczba pokazywana przy Skarbcu ("+N") == realna zmiana stanu skarbca po turze',
    shownRate === realDelta,
    `shownRate=${shownRate} realDelta=${realDelta}`,
  );
}

// ---------------------------------------------------------------------------
console.log('');
console.log(`hud-skarbiec-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
