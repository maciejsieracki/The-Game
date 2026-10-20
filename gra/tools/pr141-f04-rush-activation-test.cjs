'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('../node_modules/esbuild');
const ts = require('../node_modules/typescript');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

(async () => {
  const result = await esbuild.build({
    stdin: { contents: "export * from './src/game/production';", resolveDir: root, loader: 'ts' },
    bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent',
  });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, mod, mod.exports);
  const { rushCost } = mod.exports;
  const queue = (cost, progress) => ({ kolejka: [{ kind: 'budynek', id: 'Rzym', nazwa: 'Rzym', koszt: cost }], postep: progress });
  let checks = 0;
  const eq = (actual, expected, message) => { assert.equal(actual, expected, message); checks++; };

  // Base is rounded before applying the approved price increase/decrease.
  eq(rushCost(queue(101, 40.2), 0), 61, 'neutral quote keeps ceil(remaining work)');
  eq(rushCost(queue(101, 40.2), .2), 74, 'positive 20% increases rounded base 61 to 74');
  eq(rushCost(queue(101, 40.2), -.2), 49, 'negative 20% discounts rounded base 61 to 49');
  eq(rushCost(queue(60, 0), .2), 72, 'approved owner example positive 20% on base 60 is 72');
  eq(rushCost(queue(60, 0), -.2), 48, 'approved owner example negative 20% on base 60 is 48');
  eq(rushCost(queue(60, 0), -1.2), 0, 'modifier below -1 clamps quote to zero');
  eq(rushCost({ kolejka: [], postep: 0 }, .2), 0, 'empty queue has no rush quote');
  eq(rushCost(queue(3, 4), .2), 0, 'completed progress cannot yield a negative quote');
  eq(rushCost(queue(60, 0), Number.NaN), 60, 'non-finite modifier is neutral');

  const matrix = require('../data/civ-matrix.json');
  for (const row of matrix.cywilizacje) {
    eq(row.params.prod_rush_koszt_proc, 0, `${row.ikonaId} current approved rush source row is neutral`);
    eq(rushCost(queue(60, 0), row.params.prod_rush_koszt_proc), 60, `${row.ikonaId} source raw reaches canonical rush helper`);
  }

  const panelPath = path.join(root, 'src/ui/cityPanel.ts');
  const panelText = fs.readFileSync(panelPath, 'utf8');
  const panelAst = ts.createSourceFile(panelPath, panelText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const printer = ts.createPrinter();
  const failures = [];
  const check = (condition, message) => { if (!condition) failures.push(message); else checks++; };
  function findFunction(sourceFile, name) {
    let found;
    function visit(node) {
      if (ts.isFunctionDeclaration(node) && node.name?.text === name) found = node;
      if (!found) ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    if (!found) throw new Error(`Missing source function ${name}`);
    return found;
  }
  function propertyInitializers(sourceFile, name) {
    const found = [];
    function visit(node) {
      if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && node.name.text === name) found.push(node.initializer);
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    return found;
  }
  function transpile(source) {
    return ts.transpileModule(source.replace(/^export\s+/, ''), {
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None, moduleDetection: ts.ModuleDetectionKind.Legacy },
    }).outputText;
  }
  function executeArrow(node, sourceFile, context, key) {
    const arrow = printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
    vm.runInNewContext(transpile(`this[${JSON.stringify(key)}] = ${arrow};`), context, { timeout: 1000 });
  }

  const civKeys = new Map([[0, 'civ0'], [7, 'civ7'], [42, 'civ42'], [99, 'ai99']]);
  const rawByKey = new Map([['civ0', .2], ['civ7', -.2], ['civ42', 0], ['ai99', .5]]);
  const uiContext = {
    cfg: { getCivKey: ownerId => civKeys.get(ownerId) },
    civMatrixParam: (civKey, parameterId) => parameterId === 'prod_rush_koszt_proc' ? (rawByKey.get(civKey) ?? 0) : 0,
    rushCost,
  };
  const helperDecl = findFunction(panelAst, 'rushCostModifierForCity');
  const helperText = printer.printNode(ts.EmitHint.Unspecified, helperDecl, panelAst);
  vm.runInNewContext(transpile(`${helperText}\nthis.rushCostModifierForCity = rushCostModifierForCity;`), uiContext, { timeout: 1000 });
  let quoteInitializer;
  function findQuote(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'koszt'
      && node.initializer && node.initializer.getText(panelAst) === 'rushCost(prod, rushCostModifierForCity(city))') quoteInitializer = node.initializer;
    if (!quoteInitializer) ts.forEachChild(node, findQuote);
  }
  findQuote(findFunction(panelAst, 'renderProd'));
  if (!quoteInitializer) throw new Error('Missing exact CityPanel rush quote initializer');
  const quoteText = printer.printNode(ts.EmitHint.Unspecified, quoteInitializer, panelAst);
  vm.runInNewContext(transpile(`this.calculateRushQuote = (city, prod) => ${quoteText};`), uiContext, { timeout: 1000 });

  const paymentSourcePath = path.join(root, 'src/main.ts');
  const paymentText = fs.readFileSync(paymentSourcePath, 'utf8');
  const paymentAst = ts.createSourceFile(paymentSourcePath, paymentText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const paymentCallbacks = propertyInitializers(paymentAst, 'onRushBuy');
  check(paymentCallbacks.length === 2, `found two actual main onRushBuy callbacks (found ${paymentCallbacks.length})`);
  const cities = [];
  const cityProd = new Map();
  const treasury = new Map();
  const effects = [];
  const rawByOwner = new Map([[0, .2], [7, -.2], [42, 0], [99, .5]]);
  const paymentContext = {
    cities, cityProd, rushCost,
    civMatrixParamForOwner: (ownerId, parameterId) => parameterId === 'prod_rush_koszt_proc' ? (rawByOwner.get(ownerId) ?? 0) : 0,
    console: { log() {}, warn(message) { effects.push({ kind: 'warning', message }); } },
    ownerTreasury: ownerId => treasury.get(ownerId) ?? 0,
    setOwnerTreasury: (ownerId, amount) => { treasury.set(ownerId, amount); effects.push({ kind: 'treasury', ownerId, amount }); },
    rushProduction: prod => ({ prod: { kolejka: [], postep: 0 }, completed: prod.kolejka[0] ?? null }),
    applyProductionCompleted: (city, cityId, item, prod) => ({ prod, requeueManpower: false }),
    updateHud() {}, applyLiveSafeRationForCity() {},
  };
  const cases = [[0, .2, 74], [7, -.2, 49], [42, 0, 61], [99, .5, 92], [101, 0, 61]];
  for (const [ownerId, modifier, expected] of cases) {
    const cityId = `rush-city-${ownerId}`;
    const city = { id: cityId, ownerId };
    cities.push(city);
    cityProd.set(cityId, queue(101, 40.2));
    treasury.set(ownerId, 1000);
    const uiQuote = uiContext.calculateRushQuote(city, cityProd.get(cityId));
    eq(uiQuote, expected, `actual UI quote for owner ${ownerId} uses its injected matrix value ${modifier}`);
  }
  for (let callbackIndex = 0; callbackIndex < paymentCallbacks.length; callbackIndex++) {
    executeArrow(paymentCallbacks[callbackIndex], paymentAst, paymentContext, `onRushBuy${callbackIndex}`);
    for (const [ownerId, _modifier, expected] of cases) {
      const cityId = `rush-city-${ownerId}`;
      cityProd.set(cityId, queue(101, 40.2));
      treasury.set(ownerId, 1000);
      const quote = uiContext.calculateRushQuote(cities.find(city => city.id === cityId), cityProd.get(cityId));
      const beforeEffectCount = effects.length;
      paymentContext[`onRushBuy${callbackIndex}`](cityId, null, quote);
      eq(treasury.get(ownerId), 1000 - expected, `actual payment callback ${callbackIndex} debits owner ${ownerId} by the same quote`);
      eq(effects.slice(beforeEffectCount).filter(effect => effect.kind === 'treasury').length, 1,
        `actual payment callback ${callbackIndex} writes only owner ${ownerId} treasury once`);
    }
    const staleCityId = 'rush-city-0';
    const staleProd = queue(101, 40.2);
    cityProd.set(staleCityId, staleProd);
    treasury.set(0, 1000);
    const staleQuote = uiContext.calculateRushQuote(cities.find(city => city.id === staleCityId), staleProd) + 1;
    const beforeStaleEffects = effects.length;
    paymentContext[`onRushBuy${callbackIndex}`](staleCityId, null, staleQuote);
    eq(treasury.get(0), 1000, `actual payment callback ${callbackIndex} rejects stale quote without debit`);
    eq(cityProd.get(staleCityId), staleProd, `actual payment callback ${callbackIndex} leaves queue unchanged on stale quote`);
    check(effects.slice(beforeStaleEffects).some(effect => effect.kind === 'warning'),
      `actual payment callback ${callbackIndex} reports stale quote rejection`);
  }

  check(/function rushCostModifierForCity\(city: City\): number \{[\s\S]{0,220}cfg\.getCivKey\?\.\(city\.ownerId\)[\s\S]{0,150}civMatrixParam\(civKey, 'prod_rush_koszt_proc'\)/.test(panelText),
    'CityPanel source retains owner-key matrix resolver');
  if (failures.length) throw new Error(failures.join('\n'));
  console.log(`pr141-f04-rush-activation-test: ${checks} passed, 0 failed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
