'use strict';

// Phase A helper-level fixtures for the three remaining F04 Society consumers.
// Run from gra/: node tools/pr141-f04-society-remaining-activation-test.cjs
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const ts = require(path.resolve(__dirname, '..', 'node_modules', 'typescript'));

const ROOT = path.resolve(__dirname, '..');
const TEMP = fs.mkdtempSync(path.join(require('os').tmpdir(), 'pr141-f04-society-remaining-'));
const ENTRY = path.join(TEMP, 'entry.ts');
const SHIM = path.join(TEMP, 'civ-matrix.ts');
const BUNDLE = path.join(TEMP, 'bundle.cjs');
const MATRIX_PATH = path.join(ROOT, 'data/civ-matrix.json');
const WORKBOOK_PATH = path.join(ROOT, '../panele-sterowania/Cyw-macierz-REVIEW.xlsx');
const IDS = ['porzadek_pieniadz_proc', 'wealth_mnoznik_proc', 'religia_spread_proc'];

let passed = 0;
let failed = 0;
function check(condition, label, details) {
  if (condition) passed++;
  else {
    failed++;
    console.error(`FAIL: ${label}${details === undefined ? '' : ` (${JSON.stringify(details)})`}`);
  }
}
function equal(actual, expected, label) {
  check(Object.is(actual, expected), label, { actual, expected });
}
function near(actual, expected, label, tolerance = 1e-9) {
  check(Math.abs(actual - expected) <= tolerance, label, { actual, expected });
}

const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
const workbookHash = crypto.createHash('sha256').update(fs.readFileSync(WORKBOOK_PATH)).digest('hex');
if (workbookHash !== 'c285c410012d0fca67acf40200f03ace4cf98bd538fde40c3ea3799c79a62f32') {
  throw new Error(`approved workbook hash changed: ${workbookHash}`);
}
check(matrix.cywilizacje.length === 15, 'source matrix has 15 approved civilization rows');
for (const id of IDS) {
  check(matrix.cywilizacje.every(row => row.params[id] === 0), `${id}: all 15 approved source values remain zero`);
}

fs.writeFileSync(ENTRY, `
export { orderEffectsWithCivMatrix, orderEffectsToYieldMults } from ${JSON.stringify(path.join(ROOT, 'src/game/order'))};
export { wealthParamsWithMultiplierModifier, FALLBACK_WEALTH_PARAMS, wealthMnoznik, advanceWealth, loadWealthParams } from ${JSON.stringify(path.join(ROOT, 'src/game/wealth'))};
export { religionParamsWithSpreadModifier, FALLBACK_RELIGION_PARAMS, spreadReligion, convertViaTemple } from ${JSON.stringify(path.join(ROOT, 'src/game/culture-religion'))};
export { civMatrixParam } from ${JSON.stringify(path.join(ROOT, 'src/game/civ-matrix'))};
export { applyOrderYieldMults, wealthParamsForOwner } from ${JSON.stringify(path.join(ROOT, 'src/game/turn-economy'))};
export { applyPostCaptureLawOverride } from ${JSON.stringify(path.join(ROOT, 'src/game/post-capture-law'))};
`);
fs.writeFileSync(SHIM, `
import actual from ${JSON.stringify(MATRIX_PATH)};
export function civMatrixParam(civ: string, id: string): number {
  const fixture = (globalThis as any).__pr141F04SocietyRemaining ?? {};
  if (fixture[civ] && Object.prototype.hasOwnProperty.call(fixture[civ], id)) return fixture[civ][id];
  const row = actual.cywilizacje.find((candidate: any) => candidate.ikonaId === civ);
  return row?.params?.[id] ?? actual.defaults?.[id] ?? 0;
}
export function civMatrixParamDef(id: string): any { return actual.paramDefs?.[id]; }
export function civMatrixParamAtDifficulty(civ: string, id: string) { return civMatrixParam(civ, id); }
export function civMatrixParamsAtDifficulty(civ: string) {
  return Object.fromEntries(Object.keys(actual.paramDefs ?? {}).map((id: string) => [id, civMatrixParam(civ, id)]));
}
export function applyCivMatrixParam(base: number, civ: string, id: string): number {
  const value = civMatrixParam(civ, id);
  switch (civMatrixParamDef(id)?.formula ?? 'mul_proc') {
    case 'add': return base + value;
    case 'mul_abs': return base * value;
    case 'flag': case 'skala': case 'stat_abs': return value;
    default: return base * (1 + value);
  }
}
export function loadCivMatrix() { return actual; }
`);

(async () => {
  try {
    await esbuild.build({
      entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      outfile: BUNDLE, logLevel: 'silent',
      plugins: [{ name: 'synthetic-matrix-values', setup(build) {
        build.onResolve({ filter: /(?:^|\/)civ-matrix$/ }, () => ({ path: SHIM }));
      } }],
    });
    const M = require(BUNDLE);

    const ownerCivByOwnerId = new Map(matrix.cywilizacje.map((row, index) => [index + 1, row.ikonaId]));
    const syntheticByCiv = Object.fromEntries(matrix.cywilizacje.map((row, index) => {
      const cohort = index % 3;
      return [row.ikonaId, {
        porzadek_pieniadz_proc: cohort === 0 ? 0.20 : cohort === 1 ? -0.25 : 0,
        wealth_mnoznik_proc: cohort === 0 ? 0.20 : cohort === 1 ? -0.50 : 0,
        religia_spread_proc: cohort === 0 ? 1 : cohort === 1 ? -0.50 : 0,
      }];
    }));
    globalThis.__pr141F04SocietyRemaining = syntheticByCiv;
    const ownerValue = (ownerId, paramId) => {
      const civKey = ownerCivByOwnerId.get(ownerId);
      return civKey ? M.civMatrixParam(civKey, paramId) : 0;
    };

    // Owner-value fixtures are synthetic and isolated; source JSON remains unchanged and neutral.
    const orderBase = {
      productionMult: 1,
      pieniadzMult: 0.85,
      naukaMult: 1,
      kulturaMult: 1,
      growthMult: 1,
      tradeMult: 1.10,
      revoltRisk: 0,
    };
    const neutralOrder = M.orderEffectsWithCivMatrix(orderBase, { porzadek_pieniadz_proc: 0 });
    equal(neutralOrder.pieniadzMult, orderBase.pieniadzMult, 'Order zero modifier is identity for ordinary money');
    equal(neutralOrder.tradeMult, orderBase.tradeMult, 'Order zero modifier is identity for trade money');
    const neutralUnrest = M.orderEffectsToYieldMults('unrest', neutralOrder);
    const neutralOrderTier = M.orderEffectsToYieldMults('order', neutralOrder);
    const neutralNeutralTier = M.orderEffectsToYieldMults('neutral', neutralOrder);
    equal(neutralUnrest.pieniadzMult, orderBase.pieniadzMult, 'Order zero modifier preserves the selected unrest-tier money scalar');
    equal(neutralOrderTier.pieniadzMult, orderBase.tradeMult, 'Order zero modifier preserves the selected order-tier trade scalar');
    equal(neutralNeutralTier.pieniadzMult, orderBase.pieniadzMult, 'Order zero modifier preserves the selected neutral-tier money scalar');
    const adjustedOrder = M.orderEffectsWithCivMatrix(orderBase, { porzadek_pieniadz_proc: 0.20 });
    near(adjustedOrder.pieniadzMult, 1.02, 'Order +20% scales pieniadzMult');
    near(adjustedOrder.tradeMult, 1.32, 'Order +20% scales tradeMult');
    const unrest = M.orderEffectsToYieldMults('unrest', adjustedOrder);
    const neutralTier = M.orderEffectsToYieldMults('neutral', adjustedOrder);
    const orderTier = M.orderEffectsToYieldMults('order', adjustedOrder);
    near(unrest.pieniadzMult, 1.02, 'unrest routes only the scaled ordinary money multiplier');
    near(neutralTier.pieniadzMult, 1.02, 'neutral tier routes the scaled ordinary money multiplier');
    check(neutralTier.pieniadzMult !== adjustedOrder.tradeMult, 'neutral tier does not route the Order trade multiplier');
    near(orderTier.pieniadzMult, 1.32, 'order tier routes only the scaled trade multiplier');
    equal(Object.keys(unrest).filter(k => k === 'pieniadzMult').length, 1, 'ordinary route exposes one money multiplier');
    equal(Object.keys(orderTier).filter(k => k === 'pieniadzMult').length, 1, 'order route exposes one money multiplier');

    for (const [ownerId, civKey] of ownerCivByOwnerId) {
      const modifier = ownerValue(ownerId, 'porzadek_pieniadz_proc');
      for (const tierName of ['unrest', 'neutral', 'order']) {
        const ownerEffects = M.orderEffectsWithCivMatrix(orderBase, { porzadek_pieniadz_proc: modifier });
        const selected = M.orderEffectsToYieldMults(tierName, ownerEffects);
        const yld = { praca: 0, pieniadz: 100, nauka: 0, kultura: 0 };
        M.applyOrderYieldMults(yld, selected);
        const baseSelected = tierName === 'order' ? orderBase.tradeMult : orderBase.pieniadzMult;
        near(yld.pieniadz, 100 * baseSelected * Math.max(0, 1 + modifier),
          `${civKey}/${tierName}: owner value reaches the selected money consumer exactly once`);
      }
    }
    const rawOrderBreakdown = {
      sz: { szPct: 0, lines: [] },
      prawo: { prawPct: 0, netto: 0, lines: [] },
      porPct: 0,
      tier: 'unrest',
      effects: orderBase,
      band: 'fixture',
      bandLabel: 'fixture',
    };
    const postCaptureOrder = M.applyPostCaptureLawOverride(
      rawOrderBreakdown,
      { postCaptureLawTurnsRemaining: 2 },
      {},
      'normal',
    );
    equal(postCaptureOrder.prawo.prawPct, 100, 'post-capture law override selects Order effects before the matrix adapter');
    const postCaptureCivKey = ownerCivByOwnerId.get(1);
    const postCaptureRaw = M.civMatrixParam(postCaptureCivKey, 'porzadek_pieniadz_proc');
    const postCaptureAdjusted = M.orderEffectsWithCivMatrix(postCaptureOrder.effects,
      { porzadek_pieniadz_proc: postCaptureRaw });
    const postCaptureSelected = M.orderEffectsToYieldMults(postCaptureOrder.tier, postCaptureAdjusted);
    const postCaptureYield = { praca: 0, pieniadz: 100, nauka: 0, kultura: 0 };
    M.applyOrderYieldMults(postCaptureYield, postCaptureSelected);
    const postCaptureBaseMoney = postCaptureOrder.tier === 'order'
      ? postCaptureOrder.effects.tradeMult
      : postCaptureOrder.effects.pieniadzMult;
    near(postCaptureYield.pieniadz, 100 * postCaptureBaseMoney * Math.max(0, 1 + postCaptureRaw),
      'post-capture override is selected before the source-owner money modifier and one yield application');
    const otherOwnerOrder = M.orderEffectsWithCivMatrix(orderBase, {});
    equal(otherOwnerOrder.pieniadzMult, orderBase.pieniadzMult, 'missing owner mapping is neutral');
    equal(otherOwnerOrder.tradeMult, orderBase.tradeMult, 'unrelated owner cannot alter Order money effects');

    const wealthBase = { ...M.FALLBACK_WEALTH_PARAMS };
    const wealth20 = M.wealthParamsWithMultiplierModifier(wealthBase, 0.20);
    near(wealth20.mnoznikNaPoziom, 0.18, 'Wealth +20% scales per-level slope');
    near(M.wealthMnoznik(1, wealth20), 1.00, 'Wealth level 1 remains x1');
    near(M.wealthMnoznik(5, wealth20), 1.72, 'Wealth level 5 becomes x1.72');
    near(M.wealthMnoznik(5, wealthBase), 1.60, 'neutral Wealth baseline remains x1.60 at level 5');
    const wealthNegative = M.wealthParamsWithMultiplierModifier(wealthBase, -2);
    near(M.wealthMnoznik(5, wealthNegative), 1.00, 'existing Wealth output floor remains x1 under negative slope');
    equal(M.wealthParamsWithMultiplierModifier(wealthBase, Number.NaN), wealthBase, 'missing/invalid Wealth value falls back to base parameters');
    for (const [ownerId, civKey] of ownerCivByOwnerId) {
      const tickParams = M.wealthParamsForOwner(wealthBase, civKey);
      const previewParams = M.wealthParamsForOwner(wealthBase, civKey);
      const modifier = ownerValue(ownerId, 'wealth_mnoznik_proc');
      near(tickParams.mnoznikNaPoziom, wealthBase.mnoznikNaPoziom * (1 + modifier),
        `${civKey}: owner value reaches Wealth slope with canonical mul_proc`);
      near(tickParams.capNaEpoke, wealthBase.capNaEpoke * Math.max(0, 1 + M.civMatrixParam(civKey, 'wealth_cap_proc')),
        `${civKey}: existing Wealth cap modifier remains composed`);
      equal(JSON.stringify(previewParams), JSON.stringify(tickParams), `${civKey}: preview and tick resolve identical owner Wealth params`);
      const tickResult = M.advanceWealth({ poziom: 5, pula: 100 }, 0, 100, 1, tickParams);
      const previewResult = M.advanceWealth({ poziom: 5, pula: 100 }, 0, 100, 1, previewParams);
      equal(JSON.stringify(previewResult), JSON.stringify(tickResult), `${civKey}: Wealth preview/tick formula parity`);
    }
    equal(M.wealthParamsForOwner(wealthBase, undefined), wealthBase, 'missing Wealth owner falls back to base params');

    const religionBase = { ...M.FALLBACK_RELIGION_PARAMS, szybkoscSzerzeniaBazowa: 1, swiatyniaBonusSzerzenia: 1 };
    const religion20 = M.religionParamsWithSpreadModifier(religionBase, 1);
    equal(religion20.szybkoscSzerzeniaBazowa, 2, 'Religion +100% scales base slots only');
    equal(religion20.swiatyniaBonusSzerzenia, 1, 'Religion temple slot addition remains unchanged');
    const source = { counts: { FaithA: 6, FaithB: 4 } };
    const threeNeighbors = [1, 2, 3].map(i => ({ id: `city${i}`, distance: 1, state: { counts: {} } }));
    const spread = M.spreadReligion(source, threeNeighbors, religion20, { hasSwiatynia: true, pressure: 2, seed: 1 });
    equal(spread.reached, 3, 'existing floor of scaled base plus independent temple slot reaches three cities');
    check(spread.events.every(event => event.added === 2), 'per-target pressure remains unchanged at two');
    const fractionalBase = M.religionParamsWithSpreadModifier(religionBase, -0.25);
    near(fractionalBase.szybkoscSzerzeniaBazowa, 0.75, 'Religion preserves fractional scaled base until existing slot rounding');
    const fractionalSpread = M.spreadReligion(source, threeNeighbors, fractionalBase, { hasSwiatynia: false, pressure: 1, seed: 2 });
    equal(fractionalSpread.reached, 0, 'existing floor rounding handles the fractional base slot');
    equal(M.religionParamsWithSpreadModifier(religionBase, Number.NaN), religionBase, 'missing/invalid Religion value falls back to base parameters');
    const conversionBase = M.convertViaTemple({ counts: { FaithA: 4, FaithB: 6 } }, 'FaithA', { hasSwiatynia: true, hasKamienneKregi: true }, religionBase);
    const conversionWithSpreadModifier = M.convertViaTemple({ counts: { FaithA: 4, FaithB: 6 } }, 'FaithA', { hasSwiatynia: true, hasKamienneKregi: true }, religion20);
    equal(JSON.stringify(conversionWithSpreadModifier), JSON.stringify(conversionBase), 'spread modifier leaves in-city temple/stone-circle conversion unchanged');
    for (const [ownerId, civKey] of ownerCivByOwnerId) {
      const modifier = ownerValue(ownerId, 'religia_spread_proc');
      const ownerParams = M.religionParamsWithSpreadModifier(religionBase, modifier);
      near(ownerParams.szybkoscSzerzeniaBazowa, religionBase.szybkoscSzerzeniaBazowa * (1 + modifier),
        `${civKey}: owner value scales only source-city base slots`);
      equal(ownerParams.swiatyniaBonusSzerzenia, religionBase.swiatyniaBonusSzerzenia,
        `${civKey}: source-owner modifier does not scale temple slots`);
    }
    const humanOwner = 1;
    const aiOwner = 2;
    const humanParams = M.religionParamsWithSpreadModifier(
      religionBase,
      ownerValue(humanOwner, 'religia_spread_proc'),
    );
    const aiParams = M.religionParamsWithSpreadModifier(
      religionBase,
      ownerValue(aiOwner, 'religia_spread_proc'),
    );
    check(humanParams.szybkoscSzerzeniaBazowa !== aiParams.szybkoscSzerzeniaBazowa,
      'human and AI source-city owners receive isolated Religion values');
    const ownerSpreadNeighbors = [1, 2, 3].map(i => ({
      id: `owner-city-${i}`, distance: 1, state: { counts: {} },
    }));
    const humanSpread = M.spreadReligion(source, ownerSpreadNeighbors, humanParams, { pressure: 2, seed: 11 });
    const aiSpread = M.spreadReligion(source, ownerSpreadNeighbors, aiParams, { pressure: 2, seed: 11 });
    equal(humanSpread.reached, 2, 'human source owner reaches two neighbors under synthetic +100% base slots');
    check(humanSpread.events.every(event => event.added === 2), 'human route preserves pressure per reached target');
    equal(aiSpread.reached, 0, 'AI source owner independently reaches zero neighbors under synthetic -50% base slots');
    equal(M.religionParamsWithSpreadModifier(religionBase, ownerValue(999, 'religia_spread_proc')),
      religionBase, 'missing Religion source owner preserves base params');

    // Execute the exact owner/Wealth statements extracted from each real function's
    // AST. This reaches ownerCivByOwnerId.get(city.ownerId), the production helper
    // call and advanceWealth in both callers without constructing/running a game map.
    const turnSourcePath = path.join(ROOT, 'src/game/turn-economy.ts');
    const turnSource = fs.readFileSync(turnSourcePath, 'utf8');
    const turnAst = ts.createSourceFile(turnSourcePath, turnSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    function wealthCallerStage(functionName) {
      const fn = turnAst.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === functionName);
      if (!fn?.body) throw new Error(`missing real function ${functionName}`);
      const declares = (stmt, name) => ts.isVariableStatement(stmt) && stmt.declarationList.declarations.some(d => ts.isIdentifier(d.name) && d.name.text === name);
      const required = ['wealthCivKey', 'cityWealthParams', 'prevWealth', 'wealthImmunity', 'wt'];
      const blocks = [];
      const visit = node => {
        if (ts.isBlock(node)) {
          const names = new Set(node.statements.flatMap(stmt => required.filter(name => declares(stmt, name))));
          if (required.every(name => names.has(name))) blocks.push(node);
        }
        ts.forEachChild(node, visit);
      };
      visit(fn.body);
      const loopBlocks = blocks.filter(block => {
        let child = block;
        for (let parent = block.parent; parent && parent !== fn; child = parent, parent = parent.parent) {
          const loopVar = ts.isForOfStatement(parent) && ts.isVariableDeclarationList(parent.initializer)
            ? parent.initializer.declarations[0]?.name
            : null;
          if (ts.isForOfStatement(parent) && parent.statement === child &&
              loopVar && ts.isIdentifier(loopVar) && loopVar.text === 'city' &&
              ts.isIdentifier(parent.expression) && parent.expression.text === 'cities') return true;
        }
        return false;
      });
      if (loopBlocks.length !== 1) {
        throw new Error(`${functionName}: expected one city-loop block with ${required.join(', ')}, found ${loopBlocks.length}`);
      }
      const statements = loopBlocks[0].statements;
      const start = statements.findIndex(stmt => declares(stmt, 'wealthCivKey'));
      const end = statements.findIndex((stmt, index) => index >= start && declares(stmt, 'wt'));
      if (start < 0 || end < start || required.some(name => !statements.slice(start, end + 1).some(stmt => declares(stmt, name)))) {
        throw new Error(`${functionName}: Wealth statements missing or out of order within the city-loop block`);
      }
      const text = turnSource.slice(statements[start].getStart(turnAst), statements[end].end);
      const javascript = ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
      return new Function('city', 'yld', 'ownerCivByOwnerId', 'wealthParams', 'wealthParamsForOwner', 'freshWealthState', 'advanceWealth', 'ownerEra',
        `${javascript}\nreturn wt;`);
    }
    const actualWealthStages = [
      ['previewCityEconomy', wealthCallerStage('previewCityEconomy')],
      ['advanceCityEconomy', wealthCallerStage('advanceCityEconomy')],
    ];
    const actualOwnerMap = new Map([
      [0, matrix.cywilizacje[0].ikonaId], [7, matrix.cywilizacje[1].ikonaId],
      [42, matrix.cywilizacje[2].ikonaId], [99, matrix.cywilizacje[3].ikonaId],
    ]);
    const actualOwnerModifiers = new Map([[0, 0.20], [7, -0.50], [42, 0], [99, 0.20], [123, 0]]);
    for (const [ownerId, civKey] of actualOwnerMap) {
      globalThis.__pr141F04SocietyRemaining[civKey].wealth_mnoznik_proc = 0;
    }
    const baseParams = M.FALLBACK_WEALTH_PARAMS;
    const runActualWealthStage = (stage, ownerId, params = baseParams) => stage[1](
      { ownerId, wealthState: { poziom: 5, pula: 1e9 }, wealthImmunityRemaining: 0 },
      { luksus: 0, pieniadz: 100 }, actualOwnerMap, params, M.wealthParamsForOwner, () => ({ poziom: 1, pula: 0 }),
      M.advanceWealth, 1,
    );
    const neutralMultiplier = runActualWealthStage(actualWealthStages[0], 42).mnoznik;
    check(Number.isFinite(neutralMultiplier), 'real preview AST stage returns neutral mapped-owner Wealth baseline');
    for (const [ownerId, modifier] of actualOwnerModifiers) {
      const civKey = actualOwnerMap.get(ownerId);
      if (civKey) globalThis.__pr141F04SocietyRemaining[civKey].wealth_mnoznik_proc = modifier;
      const expectedMultiplier = Math.max(1, 1 + (neutralMultiplier - 1) * (1 + modifier));
      const results = actualWealthStages.map(stage => runActualWealthStage(stage, ownerId));
      near(results[0].mnoznik, expectedMultiplier, `${actualWealthStages[0][0]} actual owner route ${ownerId}`);
      near(results[1].mnoznik, expectedMultiplier, `${actualWealthStages[1][0]} actual owner route ${ownerId}`);
      near(results[0].mnoznik, results[1].mnoznik, `actual preview/tick Wealth parity for owner ${ownerId}`);
    }

    console.log(`pr141-f04-society-remaining-activation-test: ${passed} passed, ${failed} failed`);
    if (failed) process.exitCode = 1;
  } finally {
    fs.rmSync(TEMP, { recursive: true, force: true });
  }
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
