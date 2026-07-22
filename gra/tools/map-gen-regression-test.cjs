'use strict';
/** B0.1+B0.2 AC: czas generacji + 0 głównych rzek bez ujścia (5 seedów × 4 typy). */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.map-gen-regression-entry.ts');
const BUNDLE = path.join(__dirname, '.map-gen-regression-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generujSwiat } from '../src/map/generator';
export { pathEndsAtSea, pathReachesRealSea } from '../src/map/gen-helpers';
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

function countBadMainRivers(map) {
  const W = map.szerokoscQ;
  const H = map.wysokoscR;
  let bad = 0;
  let totalMain = 0;
  // ZADANIE 2 / A1: sprawdzenie ciągłości do REALNEGO Morza (pathReachesRealSea) — ostrzejsze
  // niż pathEndsAtSea (który liczy CAŁY 2-hex pas Wybrzeża jako "ocean"). Diagnoza sprzed fixu:
  // ~3.3% rzek przy gęstości 'high' urywało się ~3 hex przed morzem mimo pathEndsAtSea===true.
  let badReal = 0;
  for (let i = 0; i < map.riverPaths.length; i++) {
    if (map.riverPathKinds?.[i] !== 'main') continue;
    totalMain++;
    const path = map.riverPaths[i];
    if (!path?.length) {
      bad++;
      badReal++;
      continue;
    }
    if (!M.pathEndsAtSea(map.hexes, path, W, H)) bad++;
    if (!M.pathReachesRealSea(map.hexes, path, W, H)) badReal++;
  }
  return { bad, badReal, totalMain };
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
let fail = 0;

for (const density of [DENSITY, DENSITY_RIVERS_HIGH]) {
  for (const seed of SEEDS) {
    for (const typ of TYPES) {
      const map = M.generujSwiat(seed, 'maly', typ, { worldDensity: density });
      const { bad, badReal, totalMain: tm } = countBadMainRivers(map);
      totalBad += bad;
      totalBadReal += badReal;
      totalMain += tm;
      if (bad > 0 || badReal > 0) {
        fail++;
        console.error(
          `FAIL seed=${seed} typ=${typ} rivers=${density.rivers}: ${bad}/${tm} bez ujścia (luźne), `
          + `${badReal}/${tm} bez REALNEGO ujścia (pathReachesRealSea)`,
        );
      }
    }
  }
}

console.log(`Główne rzeki OK (luźne pathEndsAtSea): ${totalMain - totalBad}/${totalMain}`);
console.log(`Główne rzeki OK (REALNE morze, pathReachesRealSea): ${totalMain - totalBadReal}/${totalMain} (${fail} przypadków fail)`);

console.log('\n=== Determinizm (seed 42, standardowy, kontynenty ×2) ===');
const a = M.generujSwiat(42, 'standardowy', 'kontynenty', { worldDensity: DENSITY });
const b = M.generujSwiat(42, 'standardowy', 'kontynenty', { worldDensity: DENSITY });
const ha = hexHash(a.hexes);
const hb = hexHash(b.hexes);
const detOk = ha === hb;
console.log(`  hash A=${ha} B=${hb} → ${detOk ? 'IDENTYCZNY' : 'RÓŻNY'}`);
if (!detOk) fail++;

const stdOk = tStd < 5000;
const duzyOk = tDuzy < 15000;
console.log(`\n=== AC ===`);
console.log(`  standard <5s: ${stdOk ? 'PASS' : 'FAIL'} (${(tStd / 1000).toFixed(2)}s)`);
console.log(`  duża <15s: ${duzyOk ? 'PASS' : 'FAIL'} (${(tDuzy / 1000).toFixed(2)}s)`);
console.log(`  0 rzek bez ujścia (luźne): ${totalBad === 0 ? 'PASS' : 'FAIL'} (${totalBad} złych)`);
console.log(`  0 rzek bez REALNEGO ujścia (pathReachesRealSea): ${totalBadReal === 0 ? 'PASS' : 'FAIL'} (${totalBadReal} złych)`);
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

const allOk = stdOk && duzyOk && totalBad === 0 && totalBadReal === 0 && detOk && fail === 0 && villageOk;
process.exit(allOk ? 0 : 1);
