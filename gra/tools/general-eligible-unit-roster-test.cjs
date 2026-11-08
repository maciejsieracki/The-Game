#!/usr/bin/env node
'use strict';

// R-GENERAL-ELIGIBLE-UNIT-ROSTER-Q1: execute the production selector with real
// unit definitions and availability-shaped candidate lists for every civ/era.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
const mainSource = fs.readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
const units = require(path.join(ROOT, 'data/units.json'));
const start = mainSource.indexOf('function bestGeneralUnitForOwner(');
assert.notEqual(start, -1, 'production selector exists');
const open = mainSource.indexOf('{', start);
let depth = 0;
let close = -1;
for (let i = open; i < mainSource.length; i++) {
  if (mainSource[i] === '{') depth++;
  else if (mainSource[i] === '}' && --depth === 0) { close = i + 1; break; }
}
assert.ok(close > open, 'production selector body extracted');
const selectorTs = `(${mainSource.slice(start, close)})`;
const selectorJs = ts.transpile(selectorTs, {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.None,
  strict: false,
});
const selector = new vm.Script(`globalThis.selectGeneral = ${selectorJs};`, {
  filename: 'extracted-production-general-selector.js',
});

let checks = 0;
function check(name, condition, detail) {
  checks++;
  if (!condition) throw new Error(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  console.log(`PASS ${name}`);
}
function def(id) {
  return units.find(unit => unit.Jednostka === id);
}
function item(id) {
  return { kind: 'jednostka', id, nazwa: id, koszt: 17 };
}
const civNation = {
  grecy: 'Grecja', rzymianie: 'Rzym', chinczycy: 'Chiny', inkowie: 'Inkowie', zulusi: 'Zulu',
  egipt: 'Egipt', sumer: 'Sumer', celtowie: 'Celtowie', germanie: 'Germanie', harappa: 'Harappa',
  hetyci: 'Hetyci', slowianie: 'Słowianie', babilonia: 'Babilonia', asyria: 'Asyria', fenicjanie: 'Fenicjanie',
};
function legalCandidateIds(civKey, ids) {
  const nation = civNation[civKey];
  const replaces = new Set(units
    .filter(unit => unit.Nacja === nation && unit['W zamian za'] && unit['W zamian za'] !== '—' && unit['W zamian za'] !== '-')
    .map(unit => unit['W zamian za']));
  return ids.filter(id => {
    const unit = def(id);
    if (!unit || (unit.Nacja && unit.Nacja !== nation)) return false;
    if (replaces.has(id)) return false;
    return true;
  });
}
const power = unit => {
  const n = Number(unit?.fieldPower);
  return Number.isFinite(n) ? n : 0;
};
function callSelector({ civKey, epoch, wheel = false, candidateIds, techs: extraTechs = [], builtBuildingIds = [] }) {
  const ownerId = 17;
  const capital = { id: 'cap-17', ownerId };
  const state = { civKey, epoch, wheel, candidates: legalCandidateIds(civKey, candidateIds).map(item) };
  const sandbox = {
    data: { units, buildings: require(path.join(ROOT, 'data/buildings.json')) },
    cities: [capital],
    capitalCityIdForOwner: id => id === ownerId ? capital.id : null,
    unlockedTechsForOwner: () => [...(state.wheel ? ['Koło'] : []), ...extraTechs],
    productionAvailabilityCtxForCity: () => ({ civKey: state.civKey, builtBuildingIds,
      civBonusy: [], kosztJednostekPace: 'niski', difficulty: 'normal' }),
    purchasableUnits: (_city, _data, _techs, ctx) => {
      check(`availability context passed for ${civKey}/${epoch}`, ctx.civKey === civKey);
      return state.candidates;
    },
    empireEpochForOwner: () => state.epoch,
    civKeyForOwnerId: () => state.civKey,
    stoneGeneralUnitId: hasWheel => hasWheel ? 'Rydwan (woły)' : 'Wojownik',
    unitProductionItem: id => item(id),
    unitNacjaForCivKey: key => civNation[key],
    epochNumber: name => ({ Kamień: 1, Brąz: 2, Żelazo: 3 })[name] ?? 0,
    sortByUnitPowerDescending: (items, getUnit) => [...items].sort((a, b) => power(getUnit(b)) - power(getUnit(a))),
  };
  vm.createContext(sandbox);
  selector.runInContext(sandbox);
  return sandbox.selectGeneral(ownerId);
}

const bronzChariotByCiv = {
  grecy: 'Rydwan mykeński',
  rzymianie: 'Rydwan konny',
  chinczycy: 'Rydwan Shang',
  inkowie: 'Rydwan konny',
  zulusi: 'Rydwan konny',
  egipt: 'Rydwan egipski',
  sumer: 'Rydwan sumeryjski',
  celtowie: 'Rydwan konny',
  germanie: 'Rydwan konny',
  harappa: 'Rydwan konny',
  hetyci: 'Rydwan Kapadokijski',
  slowianie: 'Rydwan konny',
  babilonia: 'Rydwan konny',
  asyria: 'Rydwan konny',
  fenicjanie: 'Rydwan konny',
};
const ironCavalryByCiv = {
  chinczycy: 'Jeździec chiński',
  asyria: 'Konnica lancowa asyryjska',
  slowianie: 'Jeździec z oszczepami',
};
const civs = Object.keys(bronzChariotByCiv);

for (const civKey of civs) {
  const stone = callSelector({ civKey, epoch: 1, wheel: false, candidateIds: ['Wojownik', 'Taran', 'Łucznik'] });
  check(`${civKey} Stone before Wheel -> Warrior`, stone?.id === 'Wojownik');
  const stoneWheel = callSelector({ civKey, epoch: 1, wheel: true, candidateIds: ['Wojownik', 'Rydwan (woły)', 'Taran'] });
  check(`${civKey} Stone after Wheel -> Ox Chariot`, stoneWheel?.id === 'Rydwan (woły)');

  const bronzeTarget = bronzChariotByCiv[civKey];
  const bronzeIds = legalCandidateIds(civKey,
    ['Taran', 'Łucznik', 'Wojownik', 'Rydwan (woły)', 'Rydwan konny', bronzeTarget]);
  const bronzeDef = def(bronzeTarget);
  const targetIsOwnerEligible = Boolean(bronzeDef && (!bronzeDef.Nacja || bronzeDef.Nacja === civNation[civKey]));
  const bronzeFallbackExpected = [...bronzeIds]
    .filter(id => {
      const unit = def(id);
      return ['Mount', 'Offensive', 'Swordsman', 'Spearman', 'Falangite'].includes(unit?.Typ)
        && !/rydwan|chariot/i.test(id)
        && unit?.['Rola (linia)'] !== 'Dystans' && unit?.['Rola (linia)'] !== 'Oblężnicza';
    })
    .sort((a, b) => power(def(b)) - power(def(a)))[0] ?? null;
  const bronzeExpected = civKey === 'celtowie' || (targetIsOwnerEligible && bronzeIds.includes(bronzeTarget))
    ? bronzeTarget : bronzeFallbackExpected;
  const bronze = callSelector({
    civKey,
    epoch: 2,
    ...(civKey === 'celtowie' ? { techs: ['Jeździectwo'], builtBuildingIds: ['koszary'] } : {}),
    candidateIds: ['Taran', 'Łucznik', 'Wojownik', 'Rydwan (woły)', 'Rydwan konny', bronzeTarget],
  });
  check(`${civKey} Bronze -> chariot when currently legal, otherwise best legal fallback (${bronzeTarget})`, bronze?.id === bronzeExpected,
    `selected=${bronze?.id ?? 'null'} expected=${bronzeExpected ?? 'null'}`);

  const ironTarget = ironCavalryByCiv[civKey] ?? 'Konnica';
  const iron = callSelector({
    civKey,
    epoch: 3,
    candidateIds: ['Taran', 'Łucznik', 'Konnica', 'Rydwan celtycki', ironTarget,
      'Konnica łucznicza asyryjska', 'Jeździec z oszczepami'],
  });
  check(`${civKey} Iron -> best cavalry ${ironTarget}`, iron?.id === ironTarget, `selected=${iron?.id ?? 'null'}`);
}

const bronzeFallback = callSelector({
  civKey: 'germanie',
  epoch: 2,
  candidateIds: ['Taran', 'Łucznik', 'Wojownik', 'Włócznik', 'Rydwan (woły)'],
});
check('Bronze before Jeździectwo falls back to best currently available infantry, excluding the still-legal Ox Chariot',
  bronzeFallback?.id === 'Włócznik', `selected=${bronzeFallback?.id ?? 'null'}`);
const bronzeAfterUnlock = callSelector({
  civKey: 'grecy',
  epoch: 2,
  candidateIds: ['Taran', 'Łucznik', 'Wojownik', 'Włócznik', 'Rydwan mykeński'],
});
check('Bronze switches from fallback to the approved chariot after unlock', bronzeAfterUnlock?.id === 'Rydwan mykeński');
check('Celtic generic Bronze Chariot is suppressed by the future Iron replacement in the current production roster',
  legalCandidateIds('celtowie', ['Rydwan konny']).length === 0);
const celticBronzeWithGates = callSelector({
  civKey: 'celtowie', epoch: 2, techs: ['Jeździectwo'], builtBuildingIds: ['koszary'],
  candidateIds: ['Wojownik', 'Włócznik'],
});
check('Celtic Bronze Wódz uses approved generic horse chariot when its normal tech and Barracks gates are met',
  celticBronzeWithGates?.id === 'Rydwan konny', `selected=${celticBronzeWithGates?.id ?? 'null'}`);
const celticBronzeWithoutBarracks = callSelector({
  civKey: 'celtowie', epoch: 2, techs: ['Jeździectwo'], candidateIds: ['Wojownik', 'Włócznik'],
});
check('Celtic Bronze leader-only chariot does not bypass the Barracks gate',
  celticBronzeWithoutBarracks?.id !== 'Rydwan konny');
const celticBronzeWithoutTech = callSelector({
  civKey: 'celtowie', epoch: 2, builtBuildingIds: ['koszary'], candidateIds: ['Wojownik', 'Włócznik'],
});
check('Celtic Bronze leader-only chariot does not bypass the Jeździectwo gate',
  celticBronzeWithoutTech?.id !== 'Rydwan konny');
const ironNoCavalry = callSelector({ civKey: 'grecy', epoch: 3, candidateIds: ['Taran', 'Łucznik', 'Wojownik'] });
check('Iron offers no leader model if no cavalry is currently recruitable', ironNoCavalry === null);

const sourceChecks = [
  ['production availability remains the source of current gates', /purchasableUnits\(/.test(mainSource.slice(start, close))],
  ['civ-specific chariots are resolved from canonical owner civ key', /civKeyForOwnerId\(ownerId\)/.test(mainSource.slice(start, close))],
  ['Dystans and Oblężnicza roles are excluded', /role !== 'Dystans' && role !== 'Oblężnicza'/.test(mainSource.slice(start, close))],
  ['mounted units with missile attack stay eligible by type/role', /\['Mount', 'Offensive', 'Swordsman', 'Spearman', 'Falangite'\]/.test(mainSource.slice(start, close))],
];
for (const [name, ok] of sourceChecks) check(name, ok);
console.log(`PASS ${checks} total checks`);
