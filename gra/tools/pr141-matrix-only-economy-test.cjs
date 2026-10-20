'use strict';

// Bounded source-execution regression for matrix-only economy, religion-gated
// currency, and manpower. Run from gra/: node tools/pr141-matrix-only-economy-test.cjs
// No game boot, world generation, browser, save mutation, or end-turn is used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pr141-matrix-only-econ-'));
const matrixPath = path.join(root, 'data/civ-matrix.json');
const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
const shim = path.join(tmp, 'civ-matrix.ts');
const entry = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'bundle.cjs');

fs.writeFileSync(shim, `
import actual from ${JSON.stringify(matrixPath)};
function rowFor(civ: string): any { return actual.cywilizacje.find((r: any) => [r.ikonaId, r.typCywilizacji, r.Cywilizacja].some((v: string) => v.toLowerCase() === civ.toLowerCase())); }
export function loadCivMatrix() { return actual; }
export function civMatrixParam(civ: string, id: string): number {
  const values = (globalThis as any).__pr141MatrixOnlyEconomy?.[civ];
  if (values && Object.prototype.hasOwnProperty.call(values, id)) return values[id];
  return rowFor(civ)?.params?.[id] ?? actual.defaults?.[id] ?? 0;
}
export function applyCivMatrixParam(base: number, civ: string, id: string): number {
  const value = civMatrixParam(civ, id);
  switch (actual.paramDefs?.[id]?.formula ?? 'mul_proc') {
    case 'add': return base + value;
    case 'mul_abs': return base * value;
    case 'flag': case 'skala': case 'stat_abs': return value;
    default: return base * (1 + value);
  }
}
export function civMatrixParamAtDifficulty(civ: string, id: string): number { return civMatrixParam(civ, id); }
export function civMatrixParamsAtDifficulty(civ: string): Record<string, number> {
  return Object.fromEntries(Object.keys(actual.paramDefs).map(id => [id, civMatrixParam(civ, id)]));
}
`, 'utf8');
fs.writeFileSync(entry, [
  `export { cityYieldPerTurn, loadEconParams, civEconomyYieldMultipliers, mnoznikHandelPieniadzForCiv, mnoznikHandelPieniadzForCivByDifficulty } from ${JSON.stringify(path.join(root, 'src/game/economy'))};`,
  `export { cityTradeMultiplier } from ${JSON.stringify(path.join(root, 'src/game/culture-religion'))};`,
  `export { civManpowerRegenMult, civManpowerMaxMult, civManpowerMults, civManpowerMatrixMults } from ${JSON.stringify(path.join(root, 'src/game/manpower'))};`,
  `export { applyCivMatrixParam, civMatrixParam, loadCivMatrix } from ${JSON.stringify(path.join(root, 'src/game/civ-matrix'))};`,
].join('\n'), 'utf8');

(async () => {
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.json': 'json', '.ts': 'ts' }, outfile: bundle, absWorkingDir: root,
    plugins: [{ name: 'matrix-fixture-overrides', setup(build) {
      build.onResolve({ filter: /(?:^|\/)civ-matrix$/ }, () => ({ path: shim }));
    } }], logLevel: 'silent',
  });
  const M = require(bundle);
  const matrixSource = M.loadCivMatrix();
  assert.equal(matrixSource.cywilizacje.length, 15, 'actual matrix owner set is loaded');

  const poisonBonusy = [
    { typ: 'bonus_zloto', cel: 'handel', wartosc: 99, realizuje: 'ekonomia' },
    { typ: 'bonus_nauka', cel: 'wszystko', wartosc: 77, realizuje: 'ekonomia' },
  ];
  assert.deepEqual(M.civEconomyYieldMultipliers(poisonBonusy), { handel: 1, nauka: 1 }, 'legacy trade/science bonus arrays are inert');
  assert.deepEqual(M.civEconomyYieldMultipliers(undefined), { handel: 1, nauka: 1 }, 'missing owner bonus list is neutral');

  const params = M.loadEconParams(require('../data/econ-params.json'), 'normal');
  const cityFor = (civKey, science = false) => ({
    id: 'city', ludnosc: 0, civKey, zdrowie: 0, czyStolica: false, maSpichlerz: false,
    maAkwedukt: false, magazynZywnosci: 0, specjalisci: [], kolejkaProdukcji: [],
    podziałHandlu: science
      ? { procentNauka: 100, procentPieniadz: 0, procentLuksus: 0 }
      : { procentNauka: 0, procentPieniadz: 100, procentLuksus: 0 },
    podziałPracy: { procentBudynki: 0 },
  });
  const ctx = overrides => ({
    wojskoZuzycieZywnosci: 0, strataFraction: 0, maMlyn: false, maCegielnia: false,
    maTargowisko: false, maMennica: false, walutaOdkryta: false,
    civHandelMult: 99, civNaukaMult: 77, ...overrides,
  });
  const runYield = (civKey, field, amount, science = false) => {
    globalThis.__pr141MatrixOnlyEconomy = { [civKey]: { [field]: amount, eko_pieniadz_proc: 0 } };
    return M.cityYieldPerTurn(cityFor(civKey, science), [], [], params,
      ctx({ dochodTrasHandlowych: 100 }));
  };
  for (const row of matrixSource.cywilizacje) {
    const result = runYield(row.ikonaId, 'eko_handel_brutto_proc', row.params.eko_handel_brutto_proc);
    const expectedGross = Math.floor(M.applyCivMatrixParam(100, row.ikonaId, 'eko_handel_brutto_proc'));
    assert.equal(result.handelBrutto, expectedGross, `${row.ikonaId}: gross trade uses only matrix, not poison civ multiplier`);

    globalThis.__pr141MatrixOnlyEconomy = { [row.ikonaId]: { eko_nauka_proc: 0, eko_pieniadz_proc: 0 } };
    const neutralScience = runYield(row.ikonaId, 'eko_nauka_proc', 0, true);
    const science = runYield(row.ikonaId, 'eko_nauka_proc', row.params.eko_nauka_proc, true);
    const expectedScience = Math.floor(M.applyCivMatrixParam(neutralScience.nauka, row.ikonaId, 'eko_nauka_proc'));
    assert.equal(science.nauka, expectedScience, `${row.ikonaId}: science uses only matrix, not poison civ multiplier`);
  }
  globalThis.__pr141MatrixOnlyEconomy = { grecy: { eko_handel_brutto_proc: 0, eko_pieniadz_proc: 0 } };
  assert.equal(M.cityYieldPerTurn(cityFor('grecy'), [], [], params, ctx({ dochodTrasHandlowych: 100 })).handelBrutto, 100,
    'matrix gross-trade zero remains neutral despite poison legacy context');
  const noOwnerBonuses = M.civEconomyYieldMultipliers(poisonBonusy);
  const missingOwnerCity = cityFor(undefined);
  assert.equal(M.cityYieldPerTurn(missingOwnerCity, [], [], params,
    ctx({ civHandelMult: noOwnerBonuses.handel, dochodTrasHandlowych: 100 })).handelBrutto, 100,
  'missing owner stays generic/neutral, not Greek or legacy');
  globalThis.__pr141MatrixOnlyEconomy = { grecy: { eko_nauka_proc: 0, eko_pieniadz_proc: 0 } };
  const zeroMatrixScience = M.cityYieldPerTurn(cityFor('grecy', true), [], [], params,
    ctx({ civNaukaMult: 1, dochodTrasHandlowych: 100 })).nauka;
  assert.equal(zeroMatrixScience, 114,
  'matrix science zero preserves this fixture’s unmodified local/trade inputs despite poison legacy science multiplier');

  const poisonedCivs = { cywilizacje: [{ Cywilizacja: 'Grecy', ikonaId: 'grecy', Religia: 'Faith', mnoznikHandelPieniadz: 99 }] };
  const faithCity = { counts: { Faith: 9, Other: 1 } };
  const greekMatrixValue = matrixSource.cywilizacje.find(row => row.ikonaId === 'grecy').params.meta_mnoznik_waluta;
  const trade = M.cityTradeMultiplier(faithCity, 'Grecy', poisonedCivs, undefined, true);
  assert.equal(trade.multiplier, greekMatrixValue, 'religion-gated currency reads owner matrix, not poisoned civ row');
  assert.equal(trade.civBaseMultiplier, greekMatrixValue, 'diagnostic base value reflects matrix source');
  assert.equal(trade.applied, true, 'matching owner religion and open gate retain activation');
  assert.equal(M.cityTradeMultiplier(faithCity, 'Grecy', poisonedCivs, undefined, false).multiplier, 1,
    'closed Waluta/Mennica gate remains neutral');
  assert.equal(M.cityTradeMultiplier(faithCity, 'Rzymianie', poisonedCivs, undefined, true).multiplier, 1,
    'non-owner religion does not receive Greek trade effect');
  globalThis.__pr141MatrixOnlyEconomy = { grecy: { meta_mnoznik_waluta: 0 } };
  const zeroTrade = M.cityTradeMultiplier(faithCity, 'Grecy', poisonedCivs, undefined, true);
  assert.equal(zeroTrade.multiplier, 0, 'matrix absolute zero is authoritative over poisoned legacy value');
  assert.equal(M.cityTradeMultiplier(faithCity, 'UnknownCiv', poisonedCivs, undefined, true).multiplier, 1,
    'unknown civilization is neutral, not another civ fallback');
  assert.equal(M.mnoznikHandelPieniadzForCivByDifficulty('grecy', poisonedCivs, 'normal', 1.5), 0,
    'meta matrix raw zero does not fall back to legacy civ field');
  assert.equal(M.mnoznikHandelPieniadzForCivByDifficulty('UnknownCiv', poisonedCivs, 'normal', 1.5), 1.5,
    'missing civilization uses generic fallback, never civ-row/Greek value');
  assert.equal(M.mnoznikHandelPieniadzForCiv('UnknownCiv', poisonedCivs), 1,
    'public compatibility helper defaults missing owners to neutral');

  assert.equal(M.civManpowerRegenMult([{ typ: 'bonus_pobor_regen', wartosc: 99 }]), 1, 'legacy manpower regen bonus is inert');
  assert.equal(M.civManpowerMaxMult([{ typ: 'mnoznik_manpower_max', wartosc: 99 }]), 1, 'legacy manpower max bonus is inert');
  assert.deepEqual(M.civManpowerMults([{ typ: 'bonus_pobor_regen', wartosc: 99 }, { typ: 'mnoznik_manpower_max', wartosc: 99 }]),
    { regenMult: 1, maxMult: 1, costMult: 1 }, 'legacy aggregate manpower multipliers are neutral');
  for (const row of matrixSource.cywilizacje) {
    const actual = M.civManpowerMatrixMults(row.ikonaId, undefined, { regenMult: 99, maxMult: 99, costMult: 99 });
    for (const [field, key] of [['regenMult', 'mp_regen_proc'], ['maxMult', 'mp_max_proc'], ['costMult', 'mp_koszt_jednostki_proc']]) {
      assert.equal(actual[field], Math.max(0, 1 + row.params[key]), `${row.ikonaId}: ${key} uses actual matrix value, not legacy fallback`);
    }
  }
  const zeroManpower = M.civManpowerMatrixMults(undefined,
    { mp_regen_proc: 0, mp_max_proc: 0, mp_koszt_jednostki_proc: 0 },
    { regenMult: 99, maxMult: 99, costMult: 99 });
  assert.deepEqual(zeroManpower, { regenMult: 1, maxMult: 1, costMult: 1 }, 'matrix zero overrides poison legacy fallback for all manpower fields');

  console.log('pr141-matrix-only-economy-test: 92 passed, 0 failed');
})().catch(error => { console.error(error); process.exitCode = 1; });
