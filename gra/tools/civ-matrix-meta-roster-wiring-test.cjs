'use strict';
/**
 * Focused gate for the five meta fields in civ-matrix.json.
 * Run from gra/: node tools/civ-matrix-meta-roster-wiring-test.cjs
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.civ-matrix-meta-roster-entry.ts');
const bundle = path.join(__dirname, '.civ-matrix-meta-roster-bundle.cjs');

fs.writeFileSync(entry, `
export {
  cityYieldPerTurn,
  loadEconParams,
  mnoznikHandelPieniadzForCivByDifficulty,
} from '../src/game/economy';
export { civMatrixParam, loadCivMatrix } from '../src/game/civ-matrix';
`, 'utf8');

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) { passed++; console.log('PASS:', message); }
  else { failed++; console.error('FAIL:', message); }
}
function eq(actual, expected, message) {
  assert(actual === expected, `${message} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}

try {
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.json': 'json', '.ts': 'ts' },
    outfile: bundle,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
  const M = require(bundle);
  const civs = require('../data/civs.json');
  const matrix = require('../data/civ-matrix.json');
  const rows = matrix.cywilizacje;
  const ids = [
    'meta_epoka_kamien',
    'meta_epoka_braz',
    'meta_epoka_zelazo',
    'meta_mnoznik_waluta',
    'meta_tier_roster',
  ];

  eq(rows.length, 15, 'macierz ma 15 profili');
  for (const id of ids) {
    assert(rows.every((row) => typeof row.params[id] === 'number'), `15/15 wartości obecne dla ${id}`);
  }

  // The only proven gameplay consumer in this scope: currency multiplier.
  for (const row of rows) {
    const expected = row.params.meta_mnoznik_waluta;
    eq(M.civMatrixParam(row.ikonaId, 'meta_mnoznik_waluta'), expected,
      `matrix accessor: ${row.ikonaId} meta_mnoznik_waluta`);
    eq(M.mnoznikHandelPieniadzForCivByDifficulty(row.ikonaId, civs, 'normal', 1.5), expected,
      `currency consumer Normal: ${row.ikonaId}`);
    eq(M.mnoznikHandelPieniadzForCivByDifficulty(row.ikonaId, civs, 'easy', 1.5), expected + 0.5,
      `currency consumer Easy: ${row.ikonaId}`);
    eq(M.mnoznikHandelPieniadzForCivByDifficulty(row.ikonaId, civs, 'hard', 1.5), expected - 0.5,
      `currency consumer Hard: ${row.ikonaId}`);
  }

  // Real city-yield behavior: the resolved matrix multiplier changes the
  // Waluta+Mennica trade result, not only a loader/accessor value.
  const params = M.loadEconParams({ ekonomia_miasta: {}, budynki: {} }, 'normal');
  const city = {
    id: 'c1', ludnosc: 1, zdrowie: 0, czyStolica: true,
    maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 0,
    specjalisci: [], kolejkaProdukcji: [],
    podziałHandlu: { procentNauka: 100, procentPieniadz: 0, procentLuksus: 0 },
    podziałPracy: { procentBudynki: 100 },
  };
  const tile = { terenBazowy: 'rownina', nakladka: 'brak', maRzeke: false };
  const baseCtx = {
    wojskoZuzycieZywnosci: 0, strataFraction: 0,
    maMlyn: false, maCegielnia: false, maTargowisko: false,
    maMennica: true, walutaOdkryta: true,
  };
  const greekCtx = {
    ...baseCtx,
    walutaMnoznikOverride: M.mnoznikHandelPieniadzForCivByDifficulty('grecy', civs, 'normal', 1.5),
  };
  const zulusiCtx = {
    ...baseCtx,
    walutaMnoznikOverride: M.mnoznikHandelPieniadzForCivByDifficulty('zulusi', civs, 'normal', 1.5),
  };
  const greekYield = M.cityYieldPerTurn(city, Array(10).fill(tile), [], params, greekCtx);
  const zulusiYield = M.cityYieldPerTurn(city, Array(10).fill(tile), [], params, zulusiCtx);
  assert(greekYield.nauka > zulusiYield.nauka,
    `real economy result differs by matrix currency multiplier (${greekYield.nauka} > ${zulusiYield.nauka})`);

  // Epoch flags are not silently wired: they conflict with the accepted
  // epokaWejscia cascade for Hetyci/Babilonia/Asyria, so the gate remains
  // explicit DECISION_REQUIRED rather than inventing a second epoch contract.
  const civById = new Map(civs.cywilizacje.map((row) => [row.ikonaId, row]));
  for (const id of ['hetyci', 'babilonia', 'asyria']) {
    const source = civById.get(id);
    assert(source && source.epokaWejscia === 'braz', `canonical epoch source remains braz for ${id}`);
    assert(rows.find((row) => row.ikonaId === id).params.meta_epoka_zelazo === 0,
      `matrix epoch conflict recorded for ${id}`);
  }

  // The roster tier has no accepted actor/condition/formula for legal roster
  // selection, so this focused gate verifies coverage only; no zero adapter.
  assert(rows.filter((row) => row.params.meta_tier_roster === 2).length === 3,
    'tier coverage: exactly 3 reserve profiles carry tier 2');

  console.log(`\nciv-matrix-meta-roster-wiring-test: ${passed} passed, ${failed} failed`);
  if (failed) process.exitCode = 1;
} finally {
  for (const file of [entry, bundle]) {
    try { fs.unlinkSync(file); } catch {}
  }
}
