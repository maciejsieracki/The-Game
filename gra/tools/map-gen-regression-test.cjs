'use strict';
/** B0.1+B0.2 AC: czas generacji + 0 głównych rzek bez ujścia (5 seedów × 4 typy). */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

/** R-MAPGEN-KOLEJNOSC-Q3=A (2026-07-27): jakość reliefu > czas; wieloetapowy floor zostaje. */
const STANDARD_GEN_MS_LIMIT = 7000;
const DUZY_GEN_MS_LIMIT = 15000;

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.map-gen-regression-entry.ts');
const BUNDLE = path.join(__dirname, '.map-gen-regression-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generujSwiat } from '../src/map/generator';
export { pathEndsAtSea, pathReachesRealSea, pathHasValidRiverOutlet, verifyRiverNetworkConnectivity, checkTributaryJunctions } from '../src/map/gen-helpers';
export { expectedStartCityCount, targetVillageHutCount } from '../src/map/villages';
export { defaultCivTypesFromMapLabel, defaultMiastaPanstwaFromMapLabel } from '../src/map/newGameMapDefaults';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  loader: { '.ts': 'ts', '.json': 'json' },
  logLevel: 'silent',
});

const M = require(BUNDLE);

const SEEDS = [42, 123, 777, 7, 2026];
const TYPES = ['kontynenty', 'pangea', 'wyspy', 'ziemia'];
const DENSITY = {
  rivers: 'medium',
  forest: 'medium',
  desert: 'medium',
  relief: 'medium',
};
// ZADANIE 2 (2026-07-20): rivers:'high' — bug (rzeki urywające się ~3 hex przed morzem) był
// niewidoczny bo test sprawdzał tylko 'medium'. Dodajemy 'high' jako druga konfiguracja.
const DENSITY_RIVERS_HIGH = { ...DENSITY, rivers: 'high' };

function hexHash(hexes) {
  const keys = Object.keys(hexes).sort();
  let h = 0;
  for (const k of keys) {
    const hex = hexes[k];
    const s = `${k}:${hex.terenBazowy}:${hex.nakladka ?? ''}`;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}

function countBadRiverPaths(map) {
  const W = map.szerokoscQ;
  const H = map.wysokoscR;
  let badOutlet = 0;
  let badReal = 0;
  let totalMain = 0;
  for (let i = 0; i < map.riverPaths.length; i++) {
    const path = map.riverPaths[i];
    const subPaths = map.riverPaths.slice(0, i);
    const subKinds = map.riverPathKinds?.slice(0, i) ?? [];
    if (!path?.length) {
      badOutlet++;
      continue;
    }
    if (!M.pathHasValidRiverOutlet(map.hexes, path, subPaths, subKinds, W, H)) badOutlet++;
    if (map.riverPathKinds?.[i] === 'main') {
      totalMain++;
      if (!M.pathReachesRealSea(map.hexes, path, W, H)) badReal++;
    }
  }
  return { badOutlet, badReal, totalMain, totalPaths: map.riverPaths.length };
}

function bench(rozmiar, label) {
  const t0 = Date.now();
  M.generujSwiat(42, rozmiar, 'kontynenty', { worldDensity: DENSITY });
  const ms = Date.now() - t0;
  console.log(`  ${label}: ${(ms / 1000).toFixed(2)}s`);
  return ms;
}

console.log('=== Czasy generacji (seed 42, kontynenty) ===');
const tMaly = bench('maly', 'mała (108×74)');
const tStd = bench('standardowy', 'standardowa (168×120)');
const tDuzy = bench('duzy', 'duża (240×168)');

console.log('\n=== Rzeki bez ujścia (5 seedów × 4 typy × [rivers medium, rivers high], mała mapa) ===');
let totalBad = 0;
let totalBadReal = 0;
let totalMain = 0;
let totalPaths = 0;
let fail = 0;

for (const density of [DENSITY, DENSITY_RIVERS_HIGH]) {
  for (const seed of SEEDS) {
    for (const typ of TYPES) {
      const map = M.generujSwiat(seed, 'maly', typ, { worldDensity: density });
      const { badOutlet, badReal, totalMain: tm, totalPaths: tp } = countBadRiverPaths(map);
      totalBad += badOutlet;
      totalBadReal += badReal;
      totalMain += tm;
      totalPaths += tp;
      if (badOutlet > 0 || badReal > 0) {
        fail++;
        console.error(
          `FAIL seed=${seed} typ=${typ} rivers=${density.rivers}: ${badOutlet}/${tp} bez ujścia, `
          + `${badReal}/${tm} main bez REALNEGO morza`,
        );
      }
    }
  }
}

console.log(`Trasy OK (ujście morze lub rzeka): ${totalPaths - totalBad}/${totalPaths}`);
console.log(`Główne rzeki OK (REALNE morze): ${totalMain - totalBadReal}/${totalMain} (${fail} przypadków fail)`);

console.log('\n=== Sieć rzek + dopływy (5 seedów × 4 typy, standardowy) ===');
let netOrphans = 0;
let tribJunctionFails = 0;
for (const density of [DENSITY, DENSITY_RIVERS_HIGH]) {
  for (const seed of SEEDS) {
    for (const typ of TYPES) {
      const map = M.generujSwiat(seed, 'standardowy', typ, { worldDensity: density });
      const W = map.szerokoscQ;
      const H = map.wysokoscR;
      const paths = map.riverPaths ?? [];
      const kinds = map.riverPathKinds ?? [];
      const net = M.verifyRiverNetworkConnectivity(map.hexes, paths, kinds, W, H);
      const j = M.checkTributaryJunctions(paths, kinds, map.hexes, W, H);
      netOrphans += net.orphanCount;
      tribJunctionFails += j.violations;
      if (net.orphanCount > 0 || !j.ok) {
        fail++;
        console.error(
          `FAIL seed=${seed} typ=${typ} rivers=${density.rivers}: orphans=${net.orphanCount} `
          + `tribJunction=${j.violations} (${j.firstFail ?? 'ok'})`,
        );
      }
    }
  }
}
console.log(`  0 sierot w sieci: ${netOrphans === 0 ? 'PASS' : 'FAIL'} (${netOrphans} hex)`);
console.log(`  dopływy domknięte (junction): ${tribJunctionFails === 0 ? 'PASS' : 'FAIL'} (${tribJunctionFails} naruszeń)`);

console.log('\n=== Determinizm (seed 42, standardowy, kontynenty ×2) ===');
const a = M.generujSwiat(42, 'standardowy', 'kontynenty', { worldDensity: DENSITY });
const b = M.generujSwiat(42, 'standardowy', 'kontynenty', { worldDensity: DENSITY });
const ha = hexHash(a.hexes);
const hb = hexHash(b.hexes);
const detOk = ha === hb;
console.log(`  hash A=${ha} B=${hb} → ${detOk ? 'IDENTYCZNY' : 'RÓŻNY'}`);
if (!detOk) fail++;

const stdOk = tStd < STANDARD_GEN_MS_LIMIT;
const duzyOk = tDuzy < DUZY_GEN_MS_LIMIT;
console.log(`\n=== AC ===`);
console.log(`  standard <${STANDARD_GEN_MS_LIMIT / 1000}s: ${stdOk ? 'PASS' : 'FAIL'} (${(tStd / 1000).toFixed(2)}s)`);
console.log(`  duża <${DUZY_GEN_MS_LIMIT / 1000}s: ${duzyOk ? 'PASS' : 'FAIL'} (${(tDuzy / 1000).toFixed(2)}s)`);
console.log(`  0 tras bez ujścia: ${totalBad === 0 ? 'PASS' : 'FAIL'} (${totalBad} złych)`);
console.log(`  0 main bez REALNEGO morza: ${totalBadReal === 0 ? 'PASS' : 'FAIL'} (${totalBadReal} złych)`);
console.log(`  0 sierot sieci rzecznej: ${netOrphans === 0 ? 'PASS' : 'FAIL'} (${netOrphans})`);
console.log(`  dopływy z junction: ${tribJunctionFails === 0 ? 'PASS' : 'FAIL'} (${tribJunctionFails})`);
console.log(`  determinizm: ${detOk ? 'PASS' : 'FAIL'}`);

console.log('\n=== Chat ze skarbami (miasta x trudnosc) ===');
function countVillages(map) {
  let n = 0;
  for (const hex of Object.values(map.hexes)) {
    if (hex.wioska?.istnieje) n++;
  }
  return n;
}
const stdLabel = 'Standardowy';
const stdTypes = M.defaultCivTypesFromMapLabel(stdLabel);
const stdStates = M.defaultMiastaPanstwaFromMapLabel(stdLabel);
const stdCities = M.expectedStartCityCount(stdTypes, stdStates);
const stdTargetNormal = M.targetVillageHutCount(stdCities, 'normal');
const mapVillages = M.generujSwiat(42, 'standardowy', 'kontynenty', {
  worldDensity: DENSITY,
  mapSizeMenuLabel: stdLabel,
  difficulty: 'normal',
  civTypesCount: stdTypes,
  cityStatesCount: stdStates,
});
const placed = countVillages(mapVillages);
console.log(`  miasta=${stdCities} typow=${stdTypes} panstw=${stdStates} -> target=${stdTargetNormal}, placed=${placed}`);
const example10 = M.expectedStartCityCount(1, 10);
const example10Target = M.targetVillageHutCount(example10, 'normal');
console.log(`  przyklad 1 typ + 10 panstw Normal -> ${example10Target} chat (${example10} miast): ${example10Target === 22 ? 'PASS' : 'FAIL'}`);
if (example10Target !== 22) fail++;
const example8 = M.targetVillageHutCount(8, 'normal');
console.log(`  przyklad 8 miast Normal -> ${example8} chat: ${example8 === 16 ? 'PASS' : 'FAIL'}`);
if (example8 !== 16) fail++;
const minPlaced = Math.floor(stdTargetNormal * 0.9);
const villageOk = placed >= minPlaced && placed <= stdTargetNormal;
console.log(`  spawn chat (${minPlaced}..${stdTargetNormal}): ${villageOk ? 'PASS' : 'FAIL'}`);
if (!villageOk) fail++;

const allOk = stdOk && duzyOk && totalBad === 0 && totalBadReal === 0 && netOrphans === 0
  && tribJunctionFails === 0 && detOk && fail === 0 && villageOk;
process.exit(allOk ? 0 : 1);
