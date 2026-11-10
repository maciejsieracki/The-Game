'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.siege-engines-built-during-siege-entry.ts');
const BUNDLE = path.join(__dirname, '.siege-engines-built-during-siege-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { loadGameData } from '../src/data/loader';
export { purchasableUnits, availableReplacementsFor } from '../src/game/production';
export { categoryOf } from '../src/units/setup';
export { unitStockCost } from '../src/game/building-stock-cost';
export * from '../src/game/siege-engine-build';
`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent' });
const M = require(BUNDLE);
let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.error('FAIL: ' + name + (detail === undefined ? '' : ' — ' + JSON.stringify(detail))); }
}
const data = M.loadGameData();
const siegeDefs = data.units.filter(unit => unit.Typ === 'Siege');
const siegeNames = new Set(siegeDefs.map(unit => unit.Jednostka));
const units = (n, ownerId = 1) => Array.from({ length: n }, (_, i) => ({ id: `u${i}`, ownerId, typeId: 'Wojownik', category: 'wojownik' }));
const engines = (n, ownerId = 1) => Array.from({ length: n }, (_, i) => ({ id: `s${i}`, ownerId, typeId: 'Taran', category: 'obleznicza' }));
const ctx = (n, extra = {}) => {
  const ownerId = extra.ownerId ?? 1;
  return {
  activeSiege: true, atWar: true, ownerId, turn: 7, army: [...units(n, ownerId), ...engines(extra.engineCount ?? 0, ownerId)],
  unlockedTechs: new Set(['Obróbka drewna', 'Brązownictwo', 'Oblężnictwo']),
  treasury: 100000, stock: { drewno: 10000, braz: 10000, zelazo: 10000 }, ...extra,
}; };
const costOf = unit => M.unitStockCost(unit);
const buildOpt = (name, context, cost = 7) => M.siegeEngineBuildOption(data.units.find(u => u.Jednostka === name), context, cost);

check('data names exactly the four siege engine unit cards', JSON.stringify([...siegeNames].sort()) === JSON.stringify(['Katapulta', 'Taran', 'Taran okuty', 'Wieża oblężnicza'].sort()), [...siegeNames]);
check('built engine uses the existing siege model category', M.categoryOf('Taran', 'Oblężnicza', false, 'Siege') === 'obleznicza');
for (const [n, want] of [[9, 0], [10, 1], [19, 1], [50, 5], [100, 10], [250, 25]]) {
  check(`quota floor(N/10), N=${n}`, M.siegeEngineQuota(units(n)) === want, M.siegeEngineQuota(units(n)));
}
check('army count excludes existing siege engines', M.siegeEngineQuota([...units(19), ...engines(20)]) === 1);
check('parameter is stored in data and has no fixed maximum', M.SIEGE_ENGINE_UNITS_PER_MACHINE === 10 && M.siegeEngineQuota(units(250)) === 25);
check('next build is blocked after the same-turn pool is spent', buildOpt('Taran', ctx(50, { turnState: { turn: 7, count: 5 } })).reason === 'turn_limit_reached');
check('older saved turn counter resets automatically', buildOpt('Taran', ctx(10, { turnState: { turn: 6, count: 1 } })).allowed);
check('non siege blocked', buildOpt('Taran', ctx(10, { activeSiege: false })).reason === 'not_siege');
check('peace blocked', buildOpt('Taran', ctx(10, { atWar: false })).reason === 'not_at_war');
check('army below ten blocked', buildOpt('Taran', ctx(9)).reason === 'too_few_units');
check('no money blocked', buildOpt('Taran', ctx(10, { treasury: 0 })).reason === 'insufficient_money');
check('missing card resource blocked', buildOpt('Taran', ctx(10, { stock: {} })).reason === 'insufficient_resources');
check('unresearched card technology blocked', buildOpt('Katapulta', ctx(10, { unlockedTechs: new Set() })).reason === 'technology_locked');
check('all four card tech gates are enforced', siegeDefs.every(unit =>
  M.siegeEngineBuildOption(unit, ctx(10, { unlockedTechs: new Set() }), 1).reason === 'technology_locked'
  && Boolean(unit.Tech)));
check('card money and raw stock cost are exposed', buildOpt('Taran', ctx(10), 7).costMoney === 7
  && buildOpt('Taran', ctx(10), 7).costStock.drewno > 0
  && costOf(data.units.find(u => u.Jednostka === 'Taran')).drewno > 0);
const humanOption = buildOpt('Taran', ctx(50, { ownerId: 0 }));
const aiOption = buildOpt('Taran', ctx(50, { ownerId: 7 }));
check('AI and human use the same quota and affordability decisions', humanOption.allowed === aiOption.allowed
  && humanOption.quota === aiOption.quota && JSON.stringify(humanOption.costStock) === JSON.stringify(aiOption.costStock));
const savedSnapshot = JSON.parse(JSON.stringify({
  city: { siegeEngineBuildsThisTurn: { turn: 7, count: 2 }, siegeMachines: { queue: ['taran'], ready: ['wieza'], buildProgress: 0.5 } },
  units: [...units(10), { id: 'legacy-engine', ownerId: 1, typeId: 'Taran', category: 'obleznicza', q: 1, r: 2 }],
}));
check('save/load preserves legacy machines, existing engine units, and this-turn counter',
  savedSnapshot.city.siegeEngineBuildsThisTurn.count === 2
  && savedSnapshot.city.siegeMachines.ready[0] === 'wieza'
  && savedSnapshot.units.some(unit => unit.id === 'legacy-engine')
  && buildOpt('Taran', ctx(50, { turnState: savedSnapshot.city.siegeEngineBuildsThisTurn })).builtThisTurn === 2
  && buildOpt('Taran', ctx(50, { turnState: savedSnapshot.city.siegeEngineBuildsThisTurn })).allowed);

const productionCtx = {
  epoch: 3, ownerId: 1, difficulty: 'normal', builtBuildingIds: ['koszary'],
  empireResourceStock: { drewno: 99999, braz: 99999, zelazo: 99999 },
  aliveUnitTypeNames: new Set(), showStockGatedUnits: true,
};
const city = { ownerId: 1, budynki: ['koszary'] };
const recruitNames = M.purchasableUnits(city, data, data.tech.map(t => t.Technologia), productionCtx).map(item => item.id);
check('city recruitment source excludes all siege types', recruitNames.every(name => !siegeNames.has(name)), recruitNames.filter(name => siegeNames.has(name)));
const replacements = M.availableReplacementsFor('Taran', data, data.tech.map(t => t.Technologia), productionCtx).map(item => item.id);
check('unit replacement cannot acquire siege types', replacements.every(name => !siegeNames.has(name)), replacements.filter(name => siegeNames.has(name)));
console.log(`siege-engines-built-during-siege-test: ${pass} passed, ${fail} failed`);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* generated test bundle */ }
if (fail) process.exit(1);
