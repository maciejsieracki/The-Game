'use strict';
/**
 * conquest-stability-test.cjs — testy modułu podboju (kultura/religia/garnizon).
 * Run: node tools/conquest-stability-test.cjs  (from gra/)
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.cs-entry.ts');
const BUNDLE = path.resolve(__dirname, '.cs-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  onCityCapturedCulture,
  isConquestUnstable,
  tickCityCultureReligion,
  conquestUnstableHappinessPenalty,
  conquestNoGarrisonLawPenalty,
  conquestRevoltRiskMultiplier,
  cultureBuildingsFromIds,
  religionBuildingsFromIds,
} from '../src/game/conquest-stability';
export { FALLBACK_CULTURE_PARAMS, FALLBACK_RELIGION_PARAMS } from '../src/game/culture-religion';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const CS = require(BUNDLE);
const CP = CS.FALLBACK_CULTURE_PARAMS;
const RP = CS.FALLBACK_RELIGION_PARAMS;

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) passed++;
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) {
  assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}
function near(a, b, msg, eps = 1e-9) {
  assert(Math.abs(a - b) < eps, `${msg} (got ${a}, want ~${b})`);
}

// 1. onCityCapturedCulture (KULT-PRESJA-05: preserve mix)
const city = { ownCultureShare: 0.3 };
CS.onCityCapturedCulture(city, 1, 0);
eq(city.ownCultureShare, 0.7, 'capture preserves pressure mix (1-prev)');

// 2. isConquestUnstable
eq(CS.isConquestUnstable(0, true), true, 'unstable: 0% culture + foreign religion');
eq(CS.isConquestUnstable(0.6, true), false, 'stable culture share blocks unstable');
eq(CS.isConquestUnstable(0, false), false, 'own religion blocks unstable');

// 3. tickCityCultureReligion — B-KULT-REL split: swiatynia NIE boostuje kultury
const relForeign = { counts: { 'Obca wiara': 10 } };
const relForeign100 = { counts: { 'Obca wiara': 100 } };
const tickSwiatyniaBib = CS.tickCityCultureReligion(
  0, relForeign, ['swiatynia', 'biblioteka'], 'Nasza wiara', true, CP, RP,
);
near(tickSwiatyniaBib.ownCultureShare, 0.03, 'culture: baza+biblioteka only (swiatynia ignored)');
assert(tickSwiatyniaBib.religionConverted > 0, 'religion converts with swiatynia when foreign dominant');

const tickKregiOnly = CS.tickCityCultureReligion(
  0, relForeign, ['kamienne_kregi'], 'Nasza wiara', true, CP, RP,
);
near(tickKregiOnly.ownCultureShare, 0.01, 'culture: kregi alone = baza only');
assert(tickKregiOnly.religionConverted > 0, 'religion converts with kregi (slower than swiatynia)');

const tickKregi100 = CS.tickCityCultureReligion(
  0, relForeign100, ['kamienne_kregi'], 'Nasza wiara', true, CP, RP,
);
eq(tickKregi100.religionConverted, 4, 'religion: kregi 4%/t → 4 from 100 foreign');

const tickSwiatyniaOnly = CS.tickCityCultureReligion(
  0, relForeign, ['swiatynia'], 'Nasza wiara', true, CP, RP,
);
near(tickSwiatyniaOnly.ownCultureShare, 0.01, 'culture: swiatynia alone = baza only (no culture conv)');

const tickSwiatynia100 = CS.tickCityCultureReligion(
  0, relForeign100, ['swiatynia'], 'Nasza wiara', true, CP, RP,
);
eq(tickSwiatynia100.religionConverted, 6, 'religion: swiatynia 6%/t → 6 from 100 foreign');

// 4. cultureBuildingsFromIds — swiatynia/kregi/garncarnia nie wchodzą
const b = CS.cultureBuildingsFromIds(['teatr', 'biblioteka', 'swiatynia', 'kamienne_kregi', 'garncarnia']);
eq(b.hasAmfiteatr, true, 'teatr counts as amfiteatr for conversion');
eq(b.hasBiblioteka, true, 'biblioteka counts for culture conversion');
assert(!('hasSwiatynia' in b), 'cultureBuildings has no hasSwiatynia field');

const bFull = CS.cultureBuildingsFromIds(['palac', 'stela', 'sad', 'laznia_publiczna']);
eq(bFull.hasPalac, true, 'palac counts for culture conversion');
eq(bFull.hasStela, true, 'stela counts for culture conversion');
eq(bFull.hasSad, true, 'sad counts for culture conversion');
eq(bFull.hasLaznia, true, 'laznia counts for culture conversion');

// 4b. KULT-BUD-01 per-building rates (cap 5%)
const tickPalacSad = CS.tickCityCultureReligion(
  0, relForeign, ['palac', 'sad'], 'Nasza wiara', true, CP, RP,
);
near(tickPalacSad.ownCultureShare, 0.05, 'culture: palac+sad capped at 5% (1+2+2)');

// 5. religionBuildingsFromIds
const r = CS.religionBuildingsFromIds(['swiatynia', 'biblioteka']);
eq(r.hasSwiatynia, true, 'swiatynia is religious building');
eq(r.hasKamienneKregi, false, 'no kregi');
const rk = CS.religionBuildingsFromIds(['kamienne_kregi']);
eq(rk.hasKamienneKregi, true, 'kregi is religious building');

// 6. penalties
eq(CS.conquestUnstableHappinessPenalty(0, true, null, 'normal'), -2, 'unstable happiness penalty');
eq(CS.conquestNoGarrisonLawPenalty(0, true, 0, null, 'normal'), -3, 'no garrison law penalty');
eq(CS.conquestNoGarrisonLawPenalty(0, true, 2, null, 'normal'), 0, 'garrison clears law penalty');
eq(CS.conquestRevoltRiskMultiplier(0, true, 0), 1.5, 'revolt mult without garrison');
eq(CS.conquestRevoltRiskMultiplier(0, true, 1), 1, 'revolt mult with garrison');

console.log(`\nconquest-stability-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
