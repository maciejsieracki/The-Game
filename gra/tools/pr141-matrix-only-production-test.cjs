'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('../node_modules/esbuild');
const root = path.resolve(__dirname, '..');

async function loadProduction() {
  const result = await esbuild.build({
    stdin: {
      contents: [
        "export * from './src/game/production';",
        "export { civMatrixBonusyForCivKey } from './src/game/civ-bonuses';",
        "export { civBonusyForCivKey } from './src/game/economy';",
      ].join('\n'),
      resolveDir: root,
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    logLevel: 'silent',
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, module, module.exports);
  return module.exports;
}

(async () => {
  const M = await loadProduction();
  const matrix = require('../data/civ-matrix.json');
  const civs = require('../data/civs.json');
  const unitsRaw = require('../data/units.json');
  const buildingsRaw = require('../data/buildings.json');
  const units = Array.isArray(unitsRaw) ? unitsRaw : Object.values(unitsRaw);
  const buildings = Array.isArray(buildingsRaw) ? buildingsRaw : Object.values(buildingsRaw);
  const data = { buildings, units };
  let checks = 0;
  const eq = (actual, expected, message) => { assert.equal(actual, expected, message); checks++; };
  const ok = (condition, message) => { assert.ok(condition, message); checks++; };

  const legacyFor = key => M.civBonusyForCivKey(key, civs);
  const costMarkers = key => M.civProductionCostBonusyForCivKey(key);
  const bonusesFor = key => [...legacyFor(key), ...M.civMatrixBonusyForCivKey(key), ...costMarkers(key)];
  // Captured before legacy special-unit bonus rows are removed. This keeps the
  // approved roster regression independent of civs.json bonus descriptions.
  const rosterSnapshot = {
    grecy: ['Falanga', 'Rydwan mykeński', 'Thorakites', 'Wojownik mykeński'],
    rzymianie: ['Hastati', 'Triari'],
    chinczycy: ['Halabardnik Shang', 'Jeździec chiński', 'Rydwan Shang'],
    inkowie: ['Gwardzista z champi', 'Oszczepnik (Estólica)', 'Procarz (Huaracoc)', 'Wojownik z maczugą (Chaska)', 'Wojownik z toporem'],
    zulusi: ['Impi', 'Oszczepnik Zulu (Izijula)', 'iButho z iklwa'],
    egipt: ['Rydwan egipski', 'Wojownik z khopesh', 'Wojownik z żelaznym khopesh', 'Łucznik egipski', 'Łucznik nubijski'],
    sumer: ['Mur tarcz (Sargonid)', 'Rydwan sumeryjski', 'Włócznik sumeryjski', 'Łucznik akadyjski', 'Łucznik sumeryjski'],
    celtowie: ['Miecznik galijski', 'Rydwan celtycki', 'Soldurii'],
    germanie: ['Berserker germański'],
    harappa: ['Garnizon Harappy', 'Piechota induska', 'Strażnik bram Harappy'],
    hetyci: ['Gwardia hetycka', 'Piechota hetycka', 'Rydwan Kapadokijski'],
    slowianie: ['Drużynnik', 'Jeździec z oszczepami'],
    babilonia: ['Gwardia Ishtar', 'Piechota neobabilońska', 'Wojownik babiloński'],
    asyria: ['Konnica lancowa asyryjska', 'Konnica łucznicza asyryjska', 'Łucznik asyryjski'],
    fenicjanie: ['Gwardia Tyreńska', 'Tyrski miecznik', 'Wojownik fenicki'],
  };

  // Legacy Roman reduction alone is inert; the approved matrix marker applies once.
  const romanLegacy = legacyFor('rzymianie');
  const romanMatrix = costMarkers('rzymianie');
  eq(M.buildingWorkCost(400, romanLegacy), 400, 'legacy-only Roman building discount is ignored');
  eq(M.buildingWorkCost(400, [...romanLegacy, ...romanMatrix]), 320, 'Roman building matrix discount applies once');
  const zeroBuildingMarker = { typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0, realizuje: 'miasto', matrixParamId: 'prod_koszt_budynku_proc' };
  eq(M.buildingWorkCost(400, [...romanLegacy, zeroBuildingMarker]), 400, 'zero matrix row remains neutral despite legacy discount');
  eq(M.buildingWorkCost(400, [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: .9, opis: 'discount', realizuje: 'miasto' }]), 400, 'synthetic unmarked building discount is inert');
  eq(M.buildingWorkCost(400, [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: .9, realizuje: 'miasto', matrixParamId: 'unsupported_cost' }]), 400, 'unsupported matrix ID cannot change building cost');

  const zuluGeneral = costMarkers('zulusi');
  const zuluG11 = M.civMatrixBonusyForCivKey('zulusi');
  const zuluLegacy = legacyFor('zulusi');
  const activeDiscounts = [...zuluGeneral, ...zuluG11];
  eq(M.unitMoneyCost(17, zuluLegacy, undefined, 0, 'normal', 'Impi'), 17, 'old inactive civs.json Zulu discount is inert');
  eq(M.unitMoneyCost(17, zuluGeneral, undefined, 0, 'normal', 'Wojownik'), 15, 'general Zulu matrix discount applies to ordinary unit');
  eq(M.unitMoneyCost(17, activeDiscounts, undefined, 0, 'normal', 'Wojownik'), 15, 'G11 matrix discount does not leak to ordinary unit');
  eq(M.unitMoneyCost(17, activeDiscounts, undefined, 0, 'normal', 'Impi'), 13, 'Impi receives both distinct matrix fields with one floor');
  eq(M.unitMoneyCost(17, [...activeDiscounts, ...zuluLegacy], undefined, 0, 'normal', 'Impi'), 13, 'legacy civs.json entry is not a third Impi discount');
  eq(M.unitMoneyCost(17, [{ typ: 'koszt_redukcja', cel: 'Impi', wartosc: .9, opis: 'rekrutacji Impi', realizuje: 'ekonomia' }], undefined, 0, 'normal', 'Impi'), 17, 'synthetic legacy Impi description is inert');
  eq(M.unitMoneyCost(17, [{ typ: 'koszt_redukcja', cel: 'jednostki', wartosc: .9, opis: 'rekrutacji', realizuje: 'ekonomia', matrixParamId: 'unsupported_cost' }], undefined, 0, 'normal', 'Impi'), 17, 'unsupported matrix ID cannot change unit cost');

  // Matrix rows, not numeric legacy bonus records, determine the cost result.
  for (const row of matrix.cywilizacje) {
    const real = bonusesFor(row.ikonaId);
    const warrior = M.unitMoneyCost(100, real, undefined, 0, 'normal', 'Wojownik');
    const expected = row.params.prod_koszt_jednostki_proc > 0
      ? Math.max(1, Math.floor(100 * (1 - row.params.prod_koszt_jednostki_proc)))
      : 100;
    eq(warrior, expected, `${row.ikonaId} ordinary unit price follows its matrix value only`);
    const malicious = [...real, { typ: 'koszt_redukcja', cel: 'jednostki', wartosc: .75, opis: 'rekrutacji', realizuje: 'ekonomia' }];
    eq(M.unitMoneyCost(100, malicious, undefined, 0, 'normal', 'Wojownik'), expected, `${row.ikonaId} legacy mutation cannot affect price`);
  }

  // Canonical roster for every approved civ key is its own nation-tagged replacement set.
  // Verify exact parity with a pre-cleanup snapshot while deriving runtime names
  // from civKey + the units data relation, not from legacy bonus arrays.
  for (const row of matrix.cywilizacje) {
    const nation = M.unitNacjaForCivKey(row.ikonaId);
    ok(typeof nation === 'string' && nation.length > 0, `${row.ikonaId} has canonical nation mapping`);
    const expectedRoster = units
      .filter(unit => unit.Nacja === nation && unit['W zamian za'] && unit['W zamian za'] !== '-' && unit['W zamian za'] !== '—')
      .map(unit => unit.Jednostka).sort();
    const expectedActive = units
      .filter(unit => unit.Nacja === nation
        && M.epochNumber(unit.Epoka) <= 3 && M.epochNumber(unit.Epoka) >= 2
        && unit['W zamian za'] && unit['W zamian za'] !== '-' && unit['W zamian za'] !== '—')
      .map(unit => unit.Jednostka).sort();
    eq(JSON.stringify(expectedRoster), JSON.stringify(rosterSnapshot[row.ikonaId]), `${row.ikonaId} canonical roster matches pre-cleanup snapshot`);

    const context = {
      civKey: row.ikonaId,
      civUnitNacja: 'deliberately-wrong-nation',
      civBonusy: [{ typ: 'jednostka_specjalna', cel: 'piechota', wartosc: ['Falanga', 'Impi', 'made-up unit'] }],
      epoch: 3,
      builtBuildingIds: ['koszary', 'akademia_wojskowa'],
      empireResourceStock: { braz: 999999, zelazo: 999999, drewno: 999999, ceramika: 999999, kamien: 999999 },
      cityHasCoastOrRiver: true,
    };
    const unlocked = units.map(unit => unit.Tech).filter(Boolean);
    const actual = M.availableProduction({}, data, unlocked, context)
      .filter(item => { const unit = units.find(u => u.Jednostka === item.id); return unit && unit['W zamian za'] && unit['W zamian za'] !== '-' && unit['W zamian za'] !== '—'; })
      .map(item => item.id).sort();
    eq(JSON.stringify(actual), JSON.stringify(expectedActive), `${row.ikonaId} live production catalog uses canonical civKey roster, ignoring legacy descriptions`);
  }

  // Owner-keyed contexts stay distinct across player/AI IDs. The production module
  // consumes the explicit canonical civKey; the main.ts owner resolver is covered
  // by its own integration path and is deliberately not reimplemented here.
  for (const [ownerId, civKey] of [[0, 'rzymianie'], [7, 'zulusi'], [42, 'grecy'], [99, 'celtowie']]) {
    const ctx = {
      ownerId,
      civKey,
      civUnitNacja: 'wrong-fallback',
      civBonusy: [{ typ: 'koszt_redukcja', cel: 'jednostki', wartosc: .8, opis: 'legacy noise' }],
      difficulty: 'normal',
    };
    const expected = matrix.cywilizacje.find(row => row.ikonaId === civKey).params.prod_koszt_jednostki_proc;
    const price = M.unitMoneyCost(100, [...costMarkers(civKey), ...M.civMatrixBonusyForCivKey(civKey)], undefined, ownerId, 'normal', 'Wojownik');
    eq(price, expected > 0 ? Math.max(1, Math.floor(100 * (1 - expected))) : 100,
      `owner ${ownerId} resolves ${civKey} matrix cost without legacy input`);
  }

  const replacementCtx = {
    civKey: 'zulusi', civUnitNacja: 'wrong-fallback',
    civBonusy: [{ typ: 'jednostka_specjalna', cel: 'piechota', wartosc: ['made-up unit'] }],
    epoch: 3, builtBuildingIds: ['koszary', 'akademia_wojskowa'],
    empireResourceStock: { braz: 999999, zelazo: 999999, drewno: 999999 },
    cityHasCoastOrRiver: true,
  };
  const impiReplacement = M.availableReplacementsFor('Włócznik', data, units.map(unit => unit.Tech).filter(Boolean), replacementCtx);
  ok(impiReplacement.some(item => item.id === 'Impi'), 'Zulu canonical civKey retains Impi replacement despite missing legacy marker');
  const romanReplacement = M.availableReplacementsFor('Włócznik', data, units.map(unit => unit.Tech).filter(Boolean), {
    ...replacementCtx, civKey: 'rzymianie', civUnitNacja: 'wrong-fallback',
  });
  ok(!romanReplacement.some(item => item.id === 'Impi'), 'Roman civKey cannot inherit Zulu Impi replacement from legacy text');

  const noKeyContext = { epoch: 3, builtBuildingIds: ['koszary', 'akademia_wojskowa'], empireResourceStock: { braz: 999999, zelazo: 999999, drewno: 999999 }, cityHasCoastOrRiver: true };
  const unlockedAll = units.map(unit => unit.Tech).filter(Boolean);
  const noKeyReplacements = M.availableProduction({}, data, unlockedAll, noKeyContext)
    .filter(item => { const unit = units.find(u => u.Jednostka === item.id); return unit && unit['W zamian za'] && unit['W zamian za'] !== '-' && unit['W zamian za'] !== '—'; });
  eq(noKeyReplacements.length, 0, 'missing civ key and nation provides neutral generic roster');

  const cityPanelCopy = fs.readFileSync(path.join(root, 'src/ui/cityPanel.ts'), 'utf8');
  ok(cityPanelCopy.includes('Regen = % max (parametr balansu, patrz "Odnowa" wyżej) × modyfikator regeneracji z macierzy cywilizacji.'),
    'Manpower explanation names matrix regeneration modifier without inventing a legacy multiplier');
  ok(!cityPanelCopy.includes('Rzym ×2'), 'retired Roman ×2 regeneration example is absent');

  console.log(`pr141-matrix-only-production-test: ${checks} passed, 0 failed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
