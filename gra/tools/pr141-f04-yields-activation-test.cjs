'use strict';

// Bounded execution of F04 city-yield, typed route provenance, and final-happiness consumers.
// Run from gra/: node tools/pr141-f04-yields-activation-test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pr141-f04-yields-'));
const entry = path.join(tmp, 'entry.ts');
const shim = path.join(tmp, 'civ-matrix.ts');
const bundle = path.join(tmp, 'bundle.cjs');
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const matrixPath = path.join(root, 'data/civ-matrix.json');
const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
const FIELDS = [
  'eko_pieniadz_proc', 'eko_pieniadz_port_proc', 'eko_zywnosc_proc', 'eko_nauka_proc',
  'eko_kultura_proc', 'eko_luksus_proc', 'eko_zadowolenie_proc', 'eko_handel_brutto_proc',
  'eko_korupcja_proc',
];
fs.writeFileSync(shim, `
import actual from ${JSON.stringify(matrixPath)};
function rowFor(civ: string): any { return actual.cywilizacje.find((r: any) => r.ikonaId === civ || r.typCywilizacji === civ || r.Cywilizacja === civ); }
export function civMatrixParam(civ: string, id: string): number {
  const fixture = (globalThis as any).__pr141F04Yields?.[civ];
  if (fixture && Object.prototype.hasOwnProperty.call(fixture, id)) return fixture[id];
  return rowFor(civ)?.params?.[id] ?? actual.defaults?.[id] ?? 0;
}
export function civMatrixParamDef(id: string): any { return actual.paramDefs?.[id]; }
export function applyCivMatrixParam(base: number, civ: string, id: string): number {
  const value = civMatrixParam(civ, id);
  switch (civMatrixParamDef(id)?.formula ?? 'mul_proc') {
    case 'add': return base + value;
    case 'mul_abs': return base * value;
    case 'flag': case 'skala': case 'stat_abs': return value;
    default: return base * (1 + value);
  }
}
export function civMatrixParamAtDifficulty(civ: string, id: string) { return civMatrixParam(civ, id); }
export function civMatrixParamsAtDifficulty(civ: string) {
  return Object.fromEntries(Object.keys(actual.paramDefs).map((id: string) => [id, civMatrixParam(civ, id)]));
}
export function loadCivMatrix() { return actual; }
`, 'utf8');
fs.writeFileSync(entry, [
  `export { cityYieldPerTurn, loadEconParams } from ${JSON.stringify(path.join(src, 'game/economy'))};`,
  `export { computeTradeRouteIncomeByCity, computeTradeRouteIncomeByCityBreakdown, tradeRouteIncomeForRoute } from ${JSON.stringify(path.join(src, 'game/trade-routes'))};`,
  `export { evaluateOrderFromBreakdown, applyCivMatrixHappinessModifier, computePorPct, pctFromNetto } from ${JSON.stringify(path.join(src, 'game/society-breakdown'))};`,
  `export { loadOrderParams } from ${JSON.stringify(path.join(src, 'game/order'))};`,
  `export { applyPostCaptureLawOverride } from ${JSON.stringify(path.join(src, 'game/post-capture-law'))};`,
  `export { loadCivMatrix } from ${JSON.stringify(path.join(src, 'game/civ-matrix'))};`,
].join('\n'), 'utf8');

(async () => {
try {
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.json': 'json', '.ts': 'ts' }, outfile: bundle, absWorkingDir: root,
    plugins: [{ name: 'synthetic-matrix-values', setup(build) {
      build.onResolve({ filter: /(?:^|\/)civ-matrix$/ }, () => ({ path: shim }));
    } }], logLevel: 'silent',
  });
  const M = require(bundle);
  const approved = M.loadCivMatrix();
  assert.equal(approved.cywilizacje.length, 15, 'all 15 approved owner rows are present');
  for (const id of FIELDS) {
    assert.ok(approved.cywilizacje.every(row => Number.isFinite(row.params[id])), `${id}: source readback is complete`);
    assert.equal(approved.paramDefs[id].formula, 'mul_proc', `${id}: source formula remains mul_proc`);
  }

  const econParams = M.loadEconParams(require('../data/econ-params.json'), 'normal');
  const split = { procentNauka: 0, procentPieniadz: 100, procentLuksus: 0 };
  const splitSci = { procentNauka: 100, procentPieniadz: 0, procentLuksus: 0 };
  const splitLuxury = { procentNauka: 0, procentPieniadz: 0, procentLuksus: 100 };
  const cityFor = (civKey, podziałHandlu = split) => ({
    id: 'city', ludnosc: 0, civKey, zdrowie: 0, czyStolica: false, maSpichlerz: false,
    maAkwedukt: false, magazynZywnosci: 0, specjalisci: [], kolejkaProdukcji: [],
    podziałHandlu, podziałPracy: { procentBudynki: 0 },
  });
  const building = (id, fields) => ({ record: {
    id, nazwa: id, kategoria: 'test', epokaWejscia: 1, maksPoziom: 1,
    baza: { praca: 0, pieniadz: 0, zywnosc: 0, nauka: 0, kultura: 0, zadowolenie: 0,
      obrona: 0, mnoznik: 1, ...fields },
    przyrost: { praca: 0, pieniadz: 0, zywnosc: 0, nauka: 0, kultura: 0, zadowolenie: 0,
      obrona: 0, mnoznik: 1 },
  }, level: 1 });
  const ctx = overrides => ({ wojskoZuzycieZywnosci: 0, strataFraction: 0,
    maMlyn: false, maCegielnia: false, maTargowisko: false, maMennica: false,
    walutaOdkryta: false, ...overrides });
  const runYield = (civ, rawOverrides, fields, context = {}, tradeSplit = split) => {
    globalThis.__pr141F04Yields = { [civ]: Object.fromEntries(FIELDS.map(id => [id, rawOverrides[id] ?? 0])) };
    return M.cityYieldPerTurn(cityFor(civ, tradeSplit), [], fields, econParams, ctx(context));
  };
  const fixtureCiv = 'fixture-owner';
  const scenarios = [
    ['eko_pieniadz_proc', 100, [], { dochodTrasHandlowych: 100 }, split, r => r.pieniadz, raw => Math.floor(100 * (1 + raw))],
    ['eko_pieniadz_port_proc', 30, [building('port', { pieniadz: 10 })], { dochodTrasHandlowych: 20, dochodTrasMorskich: 8 }, split,
      r => r.handelBrutto, raw => Math.floor(12 + 18 * (1 + raw))],
    ['eko_zywnosc_proc', 0, [building('farm', { zywnosc: 10 })], {}, split, r => r.zywnoscBrutto, raw => Math.floor(10 * (1 + raw))],
    ['eko_nauka_proc', 0, [building('library', { nauka: 10 })], {}, splitSci, r => r.nauka, raw => Math.floor(10 * (1 + raw))],
    ['eko_kultura_proc', 0, [building('monument', { kultura: 10 })], {}, split, r => r.kultura, raw => Math.floor(10 * (1 + raw))],
    ['eko_luksus_proc', 100, [], { dochodTrasHandlowych: 100 }, splitLuxury, r => r.luksus, raw => Math.floor(100 * (1 + raw))],
    ['eko_handel_brutto_proc', 100, [], { dochodTrasHandlowych: 100 }, split, r => r.handelBrutto, raw => Math.floor(100 * (1 + raw))],
    ['eko_korupcja_proc', 100, [], { dochodTrasHandlowych: 100, strataFraction: 0.2 }, split, r => r.pieniadz, raw => Math.floor(100 * (1 - Math.min(0.2 * (1 + raw), econParams.korupcjaCap)))],
  ];
  let ownerAssertions = 0;
  for (const row of approved.cywilizacje) {
    for (const [id, base, buildings, context, tradeSplit, select, expected] of scenarios) {
      const raw = row.params[id];
      const actual = select(runYield(row.ikonaId, { [id]: raw }, buildings, context, tradeSplit));
      assert.equal(actual, expected(raw), `${row.ikonaId}/${id}: actual city-yield consumer applies exact source value once`);
      ownerAssertions++;
    }
  }

  // Isolated synthetic nonzero/negative values for all currently all-zero columns.
  for (const [id, context, buildings, tradeSplit, select, base] of [
    ['eko_zywnosc_proc', {}, [building('farm', { zywnosc: 10 })], split, r => r.zywnoscBrutto, 10],
    ['eko_kultura_proc', {}, [building('monument', { kultura: 10 })], split, r => r.kultura, 10],
    ['eko_luksus_proc', { dochodTrasHandlowych: 100 }, [], splitLuxury, r => r.luksus, 100],
  ]) {
    for (const raw of [0.2, -0.2, 0]) {
      assert.equal(select(runYield(fixtureCiv, { [id]: raw }, buildings, context, tradeSplit)),
        Math.floor(base * (1 + raw)), `${id}: synthetic ${raw} reaches consumer`);
    }
  }
  for (const raw of [0.2, -0.5, 0]) {
    const result = runYield(fixtureCiv, { eko_korupcja_proc: raw }, [],
      { dochodTrasHandlowych: 100, strataFraction: 0.2 });
    assert.equal(result.pieniadz, Math.floor(100 * (1 - Math.min(0.2 * (1 + raw), econParams.korupcjaCap))),
      `eko_korupcja_proc: synthetic ${raw} changes loss fraction with correct polarity`);
    assert.equal(result.handelBrutto, 100, 'corruption coefficient preserves gross-trade output');
  }

  // Port source includes Port-building cash and only the typed sea subset; land stays in the total unchanged.
  const portBase = runYield(fixtureCiv, { eko_pieniadz_port_proc: 0.25 },
    [building('port', { pieniadz: 10 })], { dochodTrasHandlowych: 20, dochodTrasMorskich: 8 });
  assert.equal(portBase.handelBrutto, 34, 'port modifier applies to 10 building + 8 sea income, leaves 12 land income unchanged');
  const wrongSea = runYield(fixtureCiv, { eko_pieniadz_port_proc: 0.25 }, [],
    { dochodTrasHandlowych: 20, dochodTrasMorskich: 0 });
  assert.equal(wrongSea.handelBrutto, 20, 'land-only route total is not port-tagged');

  const greekGross = runYield('grecy', { eko_handel_brutto_proc: approved.cywilizacje.find(row => row.ikonaId === 'grecy').params.eko_handel_brutto_proc }, [], { dochodTrasHandlowych: 100 });
  const romanGross = runYield('rzymianie', { eko_handel_brutto_proc: approved.cywilizacje.find(row => row.ikonaId === 'rzymianie').params.eko_handel_brutto_proc }, [], { dochodTrasHandlowych: 100 });
  assert.equal(greekGross.handelBrutto, Math.floor(100 * (1 + 0.15)), 'Greek owner key receives its own +15% gross-trade source at existing floor boundary');
  assert.equal(romanGross.handelBrutto, 100, 'Roman owner key does not inherit Greek gross-trade value');

  // Matrix zero masks stale same-effect legacy context values while preserving separate effects.
  const legacyMaskedGross = runYield(fixtureCiv, {}, [], { dochodTrasHandlowych: 100, civHandelMult: 1.5 });
  assert.equal(legacyMaskedGross.handelBrutto, 100, 'source-zero gross matrix masks stale legacy gross-trade multiplier');
  const legacyMaskedScience = runYield(fixtureCiv, {}, [building('library', { nauka: 10 })], { civNaukaMult: 1.5 }, splitSci);
  assert.equal(legacyMaskedScience.nauka, 10, 'source-zero science matrix masks stale legacy science multiplier');
  const stackedPortAndGross = runYield(fixtureCiv, { eko_pieniadz_port_proc: 0.25, eko_handel_brutto_proc: 0.15 },
    [building('port', { pieniadz: 10 })], { dochodTrasHandlowych: 20, dochodTrasMorskich: 8 });
  assert.equal(stackedPortAndGross.handelBrutto, Math.floor(34.5 * 1.15), 'distinct port and gross-trade fields compose once at their separate named stages');

  // Sea/land breakdown conserves the historical total, and excludes disconnected routes.
  const routes = [
    { id: 'land', fromCityId: 'A', toCityId: 'B', ownerId: 1, toOwnerId: 2, medium: 'lad', dystans: 5, status: 'polaczony' },
    { id: 'sea', fromCityId: 'A', toCityId: 'C', ownerId: 1, toOwnerId: 3, medium: 'morze', dystans: 10, status: 'polaczony' },
    { id: 'inactive-sea', fromCityId: 'A', toCityId: 'D', ownerId: 1, toOwnerId: 4, medium: 'morze', dystans: 3, status: 'brak_polaczenia' },
  ];
  const params = { dochodyLadowe: [1, 2, 3, 4, 5, 6], dochodyMorskie: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] };
  const oldTotal = M.computeTradeRouteIncomeByCity(routes, params);
  const breakdown = M.computeTradeRouteIncomeByCityBreakdown(routes, params);
  assert.deepEqual([...breakdown.totalByCity], [...oldTotal], 'new route breakdown preserves total-map entries and values');
  assert.equal(breakdown.maritimeByCity.get('A'), M.tradeRouteIncomeForRoute(routes[1], params), 'A sea income uses existing typed sea route formula');
  assert.equal(breakdown.maritimeByCity.get('B'), undefined, 'land route contributes no maritime amount');
  assert.equal(breakdown.maritimeByCity.get('D'), undefined, 'disconnected sea route contributes nothing');
  for (const [cityId, total] of breakdown.totalByCity) {
    const nonSea = total - (breakdown.maritimeByCity.get(cityId) ?? 0);
    assert.ok(nonSea >= 0, `${cityId}: sea amount is a subset of total, not extra income`);
  }

  // Fully evaluated happiness gets one transparent adjustment; law remains intact and Order is recomputed once.
  const society = require('../data/society-params.json');
  const happinessInput = { difficulty: 'normal', era: 2, population: 6, buildingZadowolenie: 4,
    haKult: 2, haRel: 1, haWealth: 3, haCuda: 2, podzialHandlu: splitLuxury, atWar: false };
  const lawInput = { difficulty: 'normal', era: 2, population: 6, garnizonCount: 1,
    hasDomStarszyzny: false, hasDworZarzadcy: false, hasPretorium: false,
    hasTrybunal: false, hasSad: false, hasGarnizonBudynek: false, palacTier: 0 };
  const rawOrder = M.evaluateOrderFromBreakdown(happinessInput, lawInput, society, 'normal');
  for (const row of approved.cywilizacje) {
    const actual = M.applyCivMatrixHappinessModifier(rawOrder, row.params.eko_zadowolenie_proc, society, 'normal');
    assert.deepEqual(actual, rawOrder, `${row.ikonaId}: approved zero happiness coefficient is neutral`);
    ownerAssertions++;
  }
  for (const raw of [0.25, -0.5, 0]) {
    const adjusted = M.applyCivMatrixHappinessModifier(rawOrder, raw, society, 'normal');
    const delta = adjusted.sz.netto - rawOrder.sz.netto;
    assert.equal(adjusted.sz.lines.reduce((sum, line) => sum + line.value, 0), adjusted.sz.netto,
      `happiness ${raw}: readable component lines sum exactly to final value`);
    assert.equal(adjusted.sz.netto, rawOrder.sz.netto * (1 + raw),
      `happiness ${raw}: final net happiness is scaled without changing the existing output range`);
    assert.equal(adjusted.prawo, rawOrder.prawo, `happiness ${raw}: law lane is unchanged`);
    if (raw === 0) assert.equal(adjusted.porPct, rawOrder.porPct, 'zero happiness raw preserves combined Order');
    else assert.notEqual(adjusted.porPct, rawOrder.porPct, `happiness ${raw}: combined Order is recomputed from happiness and unchanged Law`);
    if (delta !== 0) assert.equal(adjusted.sz.lines.at(-1).id, 'matryca_eko_zadowolenie', 'modifier delta is explicitly explained');
  }
  const overDenominator = { ...rawOrder, sz: { ...rawOrder.sz, netto: 60, szMax: 50,
    lines: [{ id: 'fixture', label: 'Fixture happiness', value: 60 }] } };
  const overDenominatorAdjusted = M.applyCivMatrixHappinessModifier(overDenominator, 0.2, society, 'normal');
  assert.equal(overDenominatorAdjusted.sz.netto, 72, 'netto 60 with denominator 50 and raw +0.20 remains 72, not clamped');
  assert.equal(overDenominatorAdjusted.sz.lines.reduce((sum, line) => sum + line.value, 0), 72,
    'over-denominator explanation line sums to adjusted net happiness');
  assert.equal(overDenominatorAdjusted.sz.szPct, M.pctFromNetto(72, 50, 120),
    'existing pctFromNetto percentage cap still applies');
  for (const [raw, expectedNetto] of [[0.2, -72], [-0.2, -48]]) {
    const belowDenominator = { ...rawOrder, sz: { ...rawOrder.sz, netto: -60, szMax: 50,
      lines: [{ id: 'fixture', label: 'Fixture negative happiness', value: -60 }] } };
    const belowAdjusted = M.applyCivMatrixHappinessModifier(belowDenominator, raw, society, 'normal');
    assert.equal(belowAdjusted.sz.netto, expectedNetto,
      `negative-net fixture -60/50 with raw ${raw} remains unclamped at ${expectedNetto}`);
    assert.equal(belowAdjusted.sz.lines.reduce((sum, line) => sum + line.value, 0), expectedNetto,
      `negative-net fixture raw ${raw}: explanation lines sum to adjusted net`);
    assert.equal(belowAdjusted.sz.szPct, M.pctFromNetto(expectedNetto, 50, 120),
      `negative-net fixture raw ${raw}: existing percentage bounds apply`);
    assert.equal(belowAdjusted.prawo, rawOrder.prawo,
      `negative-net fixture raw ${raw}: Law lane remains unchanged`);
  }
  const captured = M.applyPostCaptureLawOverride(
    M.applyCivMatrixHappinessModifier(rawOrder, 0.25, society, 'normal'),
    { postCaptureLawTurnsRemaining: 2 }, society, 'normal',
  );
  assert.equal(captured.prawo.prawPct, 100, 'post-capture Law override remains authoritative after happiness adjustment');
  assert.equal(captured.effects.revoltRisk, 0, 'post-capture revolt suppression is preserved');

  assert.equal(ownerAssertions, 15 * 9, 'actual consumer scenarios cover all nine fields for each of 15 owner rows');
  console.log(`PASS: F04 yields: ${ownerAssertions} owner/field checks, exact raw readback, route conservation/provenance, isolated synthetic +/-/0 stages, happiness recomposition, and post-capture Law preservation`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
})().catch(error => { console.error(error); process.exitCode = 1; });
