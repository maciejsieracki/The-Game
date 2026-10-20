'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('../node_modules/esbuild');
const root = path.resolve(__dirname, '..');
const matrix = JSON.parse(fs.readFileSync(path.join(root, 'data/civ-matrix.json'), 'utf8'));
const units = JSON.parse(fs.readFileSync(path.join(root, 'data/units.json'), 'utf8'));
async function compile(value) {
  const fixture = structuredClone(matrix);
  fixture.cywilizacje.find(c => c.ikonaId === 'zulusi').params.walka_koszt_rekrutacji_proc = value;
  const result = await esbuild.build({
    stdin: { contents: `export * from './src/game/production'; export { civMatrixBonusyForCivKey } from './src/game/civ-bonuses';`, resolveDir: root, loader: 'ts' },
    bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent',
    plugins: [{ name: 'g11-fixture', setup(build) {
      build.onLoad({ filter: /\/data\/civ-matrix\.json$/ }, () => ({ contents: JSON.stringify(fixture), loader: 'json' }));
    } }],
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, module, module.exports);
  return module.exports;
}
(async () => {
  let checks = 0;
  const eq = (actual, expected, label) => { assert.equal(actual, expected, label); checks++; };
  const data = { buildings: [], units };
  const impi = units.find(u => u.Jednostka === 'Impi');
  const warrior = units.find(u => u.Jednostka === 'Wojownik');
  const nonImpiZulu = units.find(u => u.Jednostka === 'Oszczepnik Zulu (Izijula)');
  assert(impi && warrior && nonImpiZulu);
  const extra = { typ: 'koszt_redukcja', cel: 'jednostki', wartosc: .17, opis: 'Koszt rekrutacji -17%', realizuje: 'ekonomia' };
  const legacy = { typ: 'bonus_walka', cel: 'piechota', wartosc: .1, opis: 'Koszt rekrutacji Impi -10%', realizuje: 'ekonomia' };
  for (const discount of [0, .1, .23, .87, 1.2]) {
    const M = await compile(discount);
    const bonuses = M.civMatrixBonusyForCivKey('zulusi');
    const f04 = M.civProductionCostBonusyForCivKey('zulusi');
    const activated = [...bonuses, ...f04];
    eq(M.unitMoneyCost(17, activated, 'niski', 0, 'normal', 'Wojownik'), 15, 'approved F04 gives ordinary Zulu unit 10%');
    eq(M.unitMoneyCost(17, activated, 'niski', 0, 'normal', 'Impi'), Math.max(1, Math.floor(17 * (1 - .1 - discount))), 'approved F04 and G11 stack only for Impi');
    eq(M.unitMoneyCost(17, bonuses), 17, 'missing identity never gets scoped discount');
    for (const unit of [impi, warrior, nonImpiZulu]) {
      const base = M.itemCost('jednostka', unit.Jednostka, data);
      const relevant = unit === impi ? discount : 0;
      for (const [pace, paceMult] of [['niski', 1], ['normalny', 2], ['wysoki', 4]]) {
        for (const owner of [0, 1]) for (const difficulty of ['easy', 'normal', 'hard']) {
          const difficultyMult = difficulty === 'easy' && owner === 1 || difficulty === 'hard' && owner === 0 ? 2 : 1;
          const expected = (relevant > 0 ? Math.max(1, Math.floor(base * (1 - relevant))) : base) * paceMult * difficultyMult;
          eq(M.unitPurchaseCost(unit, bonuses, pace, owner, difficulty), expected, `${unit.Jednostka} purchase ${discount}/${pace}/${owner}/${difficulty}`);
          eq(M.unitProductionItem(unit.Jednostka, data, bonuses, pace, owner, difficulty).koszt, expected, `${unit.Jednostka} catalogue parity`);
        }
      }
    }
    const special = { typ: 'jednostka_specjalna', cel: 'piechota', wartosc: ['Impi', 'Oszczepnik Zulu (Izijula)'] };
    for (const ownerId of [0, 1]) {
      const context = { epoch: 2, builtBuildingIds: ['koszary'], civUnitNacja: 'Zulu',
        civBonusy: [...bonuses, special], empireResourceStock: { braz: 1000, drewno: 1000 },
        kosztJednostekPace: 'normalny', difficulty: 'hard', ownerId };
      const catalog = M.availableProduction({}, data, ['Brązownictwo'], context);
      const replacements = M.availableReplacementsFor('Włócznik', data, ['Brązownictwo'], context);
      const base = M.itemCost('jednostka', 'Impi', data);
      const expected = (discount > 0 ? Math.max(1, Math.floor(base * (1 - discount))) : base) * 2 * (ownerId === 0 ? 2 : 1);
      eq(catalog.find(x => x.id === 'Impi')?.koszt, expected, 'real recruitment catalogue Impi price');
      eq(replacements.find(x => x.id === 'Impi')?.koszt, expected, 'real replacement Impi price');
      eq(catalog.find(x => x.id === 'Oszczepnik Zulu (Izijula)')?.koszt,
        M.itemCost('jednostka', 'Oszczepnik Zulu (Izijula)', data) * 2 * (ownerId === 0 ? 2 : 1), 'real catalogue excludes other Zulu units');
    }
    const combined = [...bonuses, extra];
    eq(M.unitMoneyCost(17, combined, 'normalny', 0, 'hard', 'Impi'), (discount > 0 ? Math.max(1, Math.floor(17 * (1 - discount))) : 17) * 4, 'legacy numeric discount is inert; matrix G11 floor precedes pace/difficulty');
    eq(M.unitMoneyCost(17, combined, 'niski', 0, 'normal', 'Wojownik'), 17, 'legacy general numeric discount is inert');
    const ordinaryZuluBase = M.itemCost('jednostka', nonImpiZulu.Jednostka, data);
    const zuluContext = { epoch: 2, builtBuildingIds: ['koszary'], civUnitNacja: 'Zulu',
      civBonusy: [...activated, { ...extra, wartosc: 0 }, { typ: 'jednostka_specjalna', cel: 'piechota', wartosc: ['Impi', 'Oszczepnik Zulu (Izijula)'] }], empireResourceStock: { braz: 1000, drewno: 1000 },
      kosztJednostekPace: 'niski', difficulty: 'normal', ownerId: 1 };
    const realCatalog = M.availableProduction({}, data, ['Brązownictwo'], zuluContext);
    const realReplacement = M.availableReplacementsFor('Włócznik', data, ['Brązownictwo'], zuluContext);
    eq(M.unitPurchaseCost(nonImpiZulu, activated), Math.max(1, Math.floor(ordinaryZuluBase * .9)), 'approved F04 purchase quote applies to ordinary Zulu unit');
    eq(M.unitMoneyCost(ordinaryZuluBase, activated, 'niski', 1, 'normal', nonImpiZulu.Jednostka), Math.max(1, Math.floor(ordinaryZuluBase * .9)), 'paid quote uses the same ordinary Zulu cost');
    eq(realCatalog.find(x => x.id === nonImpiZulu.Jednostka)?.koszt, Math.max(1, Math.floor(ordinaryZuluBase * .9)), 'owner-resolved catalog uses F04');
    eq(realReplacement.find(x => x.id === 'Impi')?.koszt,
      Math.max(1, Math.floor(M.itemCost('jednostka', 'Impi', data) * (1 - .1 - discount))),
      'owner-resolved replacement combines distinct Impi effects');
    eq(M.unitMoneyCost(17, [legacy], 'niski', 0, 'normal', 'Wojownik'), 17, 'historical Impi scope excludes other units');
    eq(M.unitMoneyCost(17, [legacy], 'niski', 0, 'normal', 'Impi'), 17, 'legacy-only historical Impi discount is inert');
    eq(M.unitMoneyCost(17, [legacy]), 17, 'legacy missing identity fails closed');
    eq(M.unitMoneyCost(17, [{ ...extra, wartosc: NaN }, { ...extra, wartosc: Infinity }]), 17, 'non-finite discounts rejected');
    for (const civ of matrix.cywilizacje.filter(c => c.ikonaId !== 'zulusi')) {
      const bonuses = M.civMatrixBonusyForCivKey(civ.ikonaId);
      eq(M.unitPurchaseCost(warrior, bonuses), M.itemCost('jednostka', 'Wojownik', data), `${civ.ikonaId} unchanged real warrior cost`);
    }
  }
  console.log(`impi-recruitment-discount-test: ${checks} passed, 0 failed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
