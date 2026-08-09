'use strict';
/**
 * empire-skarbiec-bilans-test.cjs — BUG-SKARBIEC-BILANS-DASH
 *
 * Panel ZASOBY IMPERIUM → Skarbiec pokazywał same „—" w bilansie, bo:
 * 1) openEmpireDetailFromHud renderował panel PRZED refreshLiveEmpireRates()
 *    (stale _lastPieniadzRate / _lastPlayerCityEcon = 0);
 * 2) signedTxt zamieniało 0 na „—" (OK dla surowców, złe dla bilansu ¤).
 *
 * Ten test weryfikuje:
 * - treasuryBalanceSignedTxt: niezerowe i zerowe wartości
 * - symulacja ścieżki danych HUD (preview + upkeep) daje niezerowy bilans
 *   gdy fixture ma dochód i utrzymanie (jak hud-skarbiec-test.cjs).
 *
 * Run from gra/: node tools/empire-skarbiec-bilans-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[empire-skarbiec-bilans-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE = path.resolve(__dirname, '.empire-skarbiec-bilans-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.empire-skarbiec-bilans-bundle.cjs');

const ENTRY_TS = `
import { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../src/map/generator';
import { computeStartPlacements } from '../src/units/setup';
import { foundCity, cityName } from '../src/game/cities';
import { loadGameData } from '../src/data/loader';
import {
  previewCityEconomy, previewOwnerUpkeep, sumEconomyForPlayerCities,
} from '../src/game/turn-economy';
import { treasuryBalanceSignedTxt } from '../src/ui/treasuryBalanceFormat';

export {
  generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT,
  computeStartPlacements,
  foundCity, cityName,
  loadGameData,
  previewCityEconomy, previewOwnerUpkeep, sumEconomyForPlayerCities,
  treasuryBalanceSignedTxt,
};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf-8');

console.log('[empire-skarbiec-bilans-test] Bundling...');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE_FILE,
    loader: { '.json': 'json', '.ts': 'ts' },
    target: ['node16'],
    logLevel: 'warning',
  });
} catch (e) {
  console.error('[empire-skarbiec-bilans-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const {
  generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT,
  computeStartPlacements,
  foundCity, cityName,
  loadGameData,
  previewCityEconomy, previewOwnerUpkeep, sumEconomyForPlayerCities,
  treasuryBalanceSignedTxt,
} = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(name, cond, detail) {
  if (cond) { passed++; console.log(`PASS: ${name}`); }
  else { failed++; console.log(`FAIL: ${name}${detail ? ' -- ' + detail : ''}`); }
}

// --- format treasuryBalanceSignedTxt ---
assert('treasuryBalanceSignedTxt(0) = "0" (nie myślnik)', treasuryBalanceSignedTxt(0) === '0');
assert('treasuryBalanceSignedTxt(+5) pokazuje +5', treasuryBalanceSignedTxt(5) === '+5');
assert('treasuryBalanceSignedTxt(-3) pokazuje −3 (U+2212, nie ASCII)', treasuryBalanceSignedTxt(-3) === '−3');

// --- ścieżka danych bilansu (to samo co refreshLiveEmpireRates → buildHudState) ---
const data = loadGameData();
const map = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 5151);
const start = computeStartPlacements(map, data);
const settler = {
  id: 'bilans_test_settler',
  ownerId: 0,
  typeId: 'Osadnik',
  category: 'osadnik',
  q: start.playerStart.q,
  r: start.playerStart.r,
  ruch: 2,
  ruchLeft: 2,
};
const city = foundCity(settler, [], map, cityName(0));
assert('fixture: miasto gracza', city !== null);

if (city) {
  const cities = [city];
  const builtByCity = new Map([[city.id, ['palac', 'spichlerz']]]);
  const econUnits = [
    { ownerId: 0, typeId: 'bilans_test_miecznik', category: 'miecznik', camping: false, onOwnTerritory: true },
  ];
  const preview = previewCityEconomy(cities, map, data, 'normal', builtByCity);
  const playerEcon = sumEconomyForPlayerCities(preview, cities);
  const upkeep = previewOwnerUpkeep(0, cities, data, 'normal', builtByCity, econUnits);

  const wplywyBrutto = playerEcon.pieniadz;
  const handel = playerEcon.pieniadzZTras ?? 0;
  const utrzB = upkeep.utrzymanieBudynki;
  const utrzJ = upkeep.utrzymanieJednostki;
  const netto = wplywyBrutto - upkeep.utrzymanieRazem;

  assert('fixture: wplywy brutto > 0 (palac daje pieniadz)', wplywyBrutto > 0, `got ${wplywyBrutto}`);
  assert('fixture: utrzymanie budynkow > 0', utrzB > 0, `got ${utrzB}`);

  assert(
    'bilans: wplywy brutto NIE renderuja sie jako myślnik',
    treasuryBalanceSignedTxt(wplywyBrutto - handel) !== '—',
    `danina+bud=${wplywyBrutto - handel}`,
  );
  assert(
    'bilans: netto NIE renderuje sie jako myślnik gdy rozny od zera',
    netto !== 0 ? treasuryBalanceSignedTxt(netto) !== '—' : treasuryBalanceSignedTxt(netto) === '0',
    `netto=${netto} txt=${treasuryBalanceSignedTxt(netto)}`,
  );
  assert(
    'bilans: utrzymanie budynkow jako ujemna kwota (nie myślnik przy >0, U+2212 nie ASCII)',
    treasuryBalanceSignedTxt(-utrzB) !== '—' && treasuryBalanceSignedTxt(-utrzB).startsWith('−'),
    `txt=${treasuryBalanceSignedTxt(-utrzB)}`,
  );

  const cityTick = preview.perCity.find(t => t.cityId === city.id);
  assert('fixture: perCity ma wpis dla miasta', !!cityTick);
  if (cityTick) {
    assert(
      'per-miasto: do skarbca nie jest myślnikiem gdy pieniadz > 0',
      cityTick.pieniadz > 0 ? treasuryBalanceSignedTxt(cityTick.pieniadz) !== '—' : true,
      `pieniadz=${cityTick.pieniadz}`,
    );
  }
}

console.log('');
console.log(`empire-skarbiec-bilans-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
