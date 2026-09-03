'use strict';
/** B0.1+B0.2 AC: czas generacji + 0 głównych rzek bez ujścia (5 seedów × 4 typy). */

const fs = require('fs');
const path = require('path');

/** R-MAPGEN-KOLEJNOSC-Q3=A (2026-07-27): jakość reliefu > czas; wieloetapowy floor zostaje. */
const STANDARD_GEN_MS_LIMIT = 7000;
const DUZY_GEN_MS_LIMIT = 15000;

function assessMapgenRun({ standardMs, duzyMs, hardFailures }) {
  const timeChecks = [
    {
      label: 'standard',
      elapsedMs: standardMs,
      limitMs: STANDARD_GEN_MS_LIMIT,
    },
    {
      label: 'duża',
      elapsedMs: duzyMs,
      limitMs: DUZY_GEN_MS_LIMIT,
    },
  ].map((check) => ({
    ...check,
    withinLimit: check.elapsedMs < check.limitMs,
    status: check.elapsedMs < check.limitMs ? 'PASS' : 'WARN',
  }));
  return {
    timeChecks,
    warningCount: timeChecks.filter((check) => !check.withinLimit).length,
    hardFailures,
    exitCode: hardFailures === 0 ? 0 : 1,
  };
}

function runThresholdContractTest() {
  const timingOnly = assessMapgenRun({
    standardMs: STANDARD_GEN_MS_LIMIT + 1,
    duzyMs: DUZY_GEN_MS_LIMIT + 1,
    hardFailures: 0,
  });
  if (timingOnly.exitCode !== 0 || timingOnly.warningCount !== 2
    || timingOnly.timeChecks.some((check) => check.status !== 'WARN')) {
    throw new Error('FAIL: przekroczenie czasu nie może zmieniać exit code na 1');
  }
  console.log('PASS: mutacja czasu ponad próg → WARN, exit 0');

  const correctnessMutation = assessMapgenRun({
    standardMs: 0,
    duzyMs: 0,
    hardFailures: 1,
  });
  if (correctnessMutation.exitCode !== 1) {
    throw new Error('FAIL: mutacja poprawności musi kończyć się exit 1');
  }
  console.log('PASS: mutacja poprawności → FAIL, exit 1');
}

if (process.argv.includes('--contract-test')) {
  runThresholdContractTest();
  process.exit(0);
}

const esbuild = require('esbuild');
const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.map-gen-regression-entry.ts');
const BUNDLE = path.join(__dirname, '.map-gen-regression-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generujSwiat } from '../src/map/generator';
export { pathEndsAtSea, pathReachesRealSea, pathHasValidRiverOutlet, verifyRiverNetworkConnectivity, checkTributaryJunctions, groupLandMassKeys } from '../src/map/gen-helpers';
export { expectedStartCityCount, targetVillageHutCount } from '../src/map/villages';
export { defaultCivTypesFromMapLabel, defaultMiastaPanstwaFromMapLabel } from '../src/map/newGameMapDefaults';
export { TerenBazowy } from '../src/types/hex';
export { isWaterTerrain } from '../src/units/setup';`,
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

const timing = assessMapgenRun({
  standardMs: tStd,
  duzyMs: tDuzy,
  hardFailures: 0,
});
const [standardTimeCheck, duzyTimeCheck] = timing.timeChecks;
console.log(`\n=== AC ===`);
console.log(`  standard <${STANDARD_GEN_MS_LIMIT / 1000}s: ${standardTimeCheck.status} (${(tStd / 1000).toFixed(2)}s)`);
console.log(`  duża <${DUZY_GEN_MS_LIMIT / 1000}s: ${duzyTimeCheck.status} (${(tDuzy / 1000).toFixed(2)}s)`);
console.log(`  0 tras bez ujścia: ${totalBad === 0 ? 'PASS' : 'FAIL'} (${totalBad} złych)`);
console.log(`  0 main bez REALNEGO morza: ${totalBadReal === 0 ? 'PASS' : 'FAIL'} (${totalBadReal} złych)`);
console.log(`  0 sierot sieci rzecznej: ${netOrphans === 0 ? 'PASS' : 'FAIL'} (${netOrphans})`);
console.log(`  dopływy z junction: ${tribJunctionFails === 0 ? 'PASS' : 'FAIL'} (${tribJunctionFails})`);
console.log(`  determinizm: ${detOk ? 'PASS' : 'FAIL'}`);

console.log('\n=== Pangea nieregularna (FALA 187, 5 seedów standardowy) ===');
const PANGEA_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
function pangeaShapeMetrics(map) {
  const hexes = map.hexes;
  const masses = M.groupLandMassKeys(hexes);
  const landKeys = masses.flat();
  const landCount = landKeys.length;
  if (landCount === 0) return { massCount: 0, dominantRatio: 0, bboxFill: 0, coastRatio: 0 };
  let qMin = Infinity, qMax = -Infinity, rMin = Infinity, rMax = -Infinity;
  let coast = 0;
  for (const k of landKeys) {
    const [q, r] = k.split(',').map(Number);
    qMin = Math.min(qMin, q); qMax = Math.max(qMax, q);
    rMin = Math.min(rMin, r); rMax = Math.max(rMax, r);
    for (const [dq, dr] of PANGEA_DIRS) {
      const nh = hexes[`${q + dq},${r + dr}`];
      if (!nh || M.isWaterTerrain(nh.terenBazowy)) { coast++; break; }
    }
  }
  const bboxArea = (qMax - qMin + 1) * (rMax - rMin + 1);
  const massSizes = masses.map((m) => m.length).sort((a, b) => b - a);
  return {
    massCount: masses.length,
    dominantRatio: massSizes[0] / landCount,
    bboxFill: landCount / bboxArea,
    coastRatio: coast / Math.sqrt(landCount),
  };
}
// R-MAPGEN-PANGEA-PROG-Q1 = A (Maciej, 2026-08-12, ECHO w PYTANIA-OTWARTE.md, commit 1d9691b0):
// próg coastRatio obniżony z 3.8 do 3.72. Zmierzone empirycznie na TYCH samych 5 SEEDS (standardowy,
// pangea, DENSITY medium): rozrzut coast/√A = 3.7778 (seed 777) .. 3.8272 (seed 7), avg 3.7944 —
// próg 3.8 odrzucał 4/5 (zgodne z wcześniejszym pomiarem w rejestrze: 70-82% na szerszych próbkach).
// 3.72 zostaje z marginesem ~0.058 pod zmierzonym minimum. Świadomy kompromis właściciela: Evaluator
// dowiódł że przy progu ~3.70 przechodzi nawet skrajna degeneracja kształtu (domknięcie zatok) —
// realną ochronę kształtu Pangei daje `bboxFill<0.87`, nie `coastRatio`, ale właściciel wybrał
// prostotę/zieloną bramkę nad ostrością tej konkretnej asercji. Sekcja jest teraz ZWYKŁĄ blokującą
// asercją (jak reszta pliku) — ABC już rozstrzygnięte, nie ma powodu trzymać wyjątku nieblokującego.
// EN: coastRatio threshold lowered from 3.8 to 3.72 per owner's ABC decision. Measured empirically
// on this file's 5 SEEDS: coast/√A spread = 3.7778..3.8272, avg 3.7944 — 3.8 rejected 4/5. 3.72
// keeps a ~0.058 margin below the measured minimum. Deliberate compromise: Evaluator proved ~3.70
// lets extreme shape degeneration through too (bboxFill<0.87 is the real shape guard), but the
// owner chose gate simplicity over this assertion's sharpness. Section is now a normal blocking
// assertion like the rest of the file — the ABC is resolved, no reason to keep the exemption.
//
// P-MAPGEN-PANGEA-OBRYS-P4-WYBRZEZE-Q1 (2026-09-03): metryka NAPRAWIONA — PlytkieMorze liczy się
// teraz jako woda (groupLandMassKeys + kontakt-z-wodą powyżej używają isWaterTerrain), zgodnie
// z Pytaniem 1=A dokumentu P-MAPGEN-PANGEA-OBRYS.md. Zmierzony coastRatio na tych samych 5 SEEDS
// skoczył z 3.7778–3.8272 do 5,29–5,89 (recon dokumentu, sekcja 3) — próg 3.72 wyżej jest teraz
// znacznie luźniejszy niż zamierzała kalibracja R-MAPGEN-PANGEA-PROG-Q1 (dobrana pod STARĄ,
// wadliwą metrykę). Asercja zostaje zielona i nadal poprawnie łapie degenerację kształtu przez
// bboxFill<0.87 (prawdziwy strażnik kształtu wg komentarza wyżej) — rekalibracja samego progu
// coastRatio pod nową metrykę to osobna decyzja właściciela (Pytanie 2 dokumentu), poza zakresem
// tego dispatchu, który dotyczy wyłącznie nazwy i przepięcia porównań.
let pangeaShapeFail = 0;
for (const seed of SEEDS) {
  const pmap = M.generujSwiat(seed, 'standardowy', 'pangea', { worldDensity: DENSITY });
  const pm = pangeaShapeMetrics(pmap);
  const ok = pm.massCount === 1 && pm.dominantRatio >= 0.97
    && pm.bboxFill < 0.87 && pm.coastRatio > 3.72;
  if (!ok) {
    pangeaShapeFail++;
    fail++;
    console.error(
      `FAIL seed=${seed}: masy=${pm.massCount} dom=${pm.dominantRatio.toFixed(3)} `
      + `bboxFill=${pm.bboxFill.toFixed(3)} coast/√A=${pm.coastRatio.toFixed(3)}`,
    );
  }
}
console.log(
  `  1 masa + nieregularny obrys: ${pangeaShapeFail === 0 ? 'PASS' : 'FAIL'} (${pangeaShapeFail} fail)`,
);

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

const verdict = assessMapgenRun({
  standardMs: tStd,
  duzyMs: tDuzy,
  hardFailures: fail,
});
console.log(`  poprawność generatora: ${verdict.exitCode === 0 ? 'PASS' : 'FAIL'} (${verdict.hardFailures} twardych naruszeń)`);
console.log(`  ostrzeżenia wydajności: ${verdict.warningCount}`);
process.exit(verdict.exitCode);
