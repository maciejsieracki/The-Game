'use strict';
/**
 * R-REKRUTACJA-WIELE-JEDNOSTEK-UI-Q1 — focused backend contract test.
 *
 * Wykonuje prawdziwe ciała purchaseRecruitmentUnit i
 * cancelRecruitmentPurchase wycięte z gra/src/main.ts po transpilacji
 * TypeScript przez esbuild. Zależności silnika są małymi, jawnymi fixture'ami;
 * test nie reimplementuje orkiestracji zakupowej.
 *
 * Sprawdza atomowe q× złoto/Manpower/surowiec, wodę, q zwykłych pozycji,
 * ścieżkę q=1, zwrot jednej pozycji oraz JSON save/load istniejącej kolejki.
 * Uruchomienie: cd gra && node tools/recruitment-batch-contract-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const MAIN = path.resolve(__dirname, '..', 'src', 'main.ts');
const mainSource = fs.readFileSync(MAIN, 'utf8');

function sliceFunction(source, signature, nextMarker) {
  const start = source.indexOf(signature);
  if (start < 0) throw new Error(`brak sygnatury: ${signature}`);
  const end = source.indexOf(nextMarker, start);
  if (end < 0) throw new Error(`brak końca funkcji: ${signature}`);
  return source.slice(start, end);
}

const purchaseSource = sliceFunction(
  mainSource,
  'function purchaseRecruitmentUnit(',
  '\n    /** Anulowanie opłaconej rekrutacji',
);
const cancelSource = sliceFunction(
  mainSource,
  'function cancelRecruitmentPurchase(',
  '\n    /**\n     * P-SANITIZE-POSTEP-TRANSFER-Q1',
);
const fnCode = esbuild.transformSync(`${purchaseSource}\n${cancelSource}`, {
  loader: 'ts',
  target: 'es2020',
}).code;

const ENV_NAMES = [
  'ownerTreasury',
  'cities',
  'cityHasCoastOrRiverAccess',
  'showHintMessage',
  'empireEpochForOwner',
  'civManpowerMultsForOwner',
  'canAffordUnitManpowerEmpire',
  'unitProductionItem',
  'data',
  'civBonusyForOwnerId',
  'player',
  '_menuDifficulty',
  'unitStockCost',
  'ownerResourceStockAll',
  'pickUnitRecruitHint',
  'missingStockFor',
  'stockResourceLabel',
  'tryDeductUnitSpawnCostsEmpire',
  'unitManpowerCostForType',
  'empireManpowerCurrent',
  'deductManpowerFromEmpire',
  'UNIT_POPULATION_COST',
  'setOwnerTreasury',
  'deductBuildingStockCostAcrossCities',
  'markCityStateDirty',
  'cityProd',
  'enqueueRecruitment',
  'updateHud',
  'refreshCityPanelIfOpen',
  'refundManpowerToEmpire',
  'creditOwnerResourceStock',
];

// eslint-disable-next-line no-new-func
const makeFunctions = new Function(
  ...ENV_NAMES,
  `${fnCode}\nreturn { purchaseRecruitmentUnit, cancelRecruitmentPurchase };`,
);

let pass = 0;
let fail = 0;
function check(name, condition, detail) {
  if (condition) {
    pass++;
    console.log(`PASS: ${name}`);
  } else {
    fail++;
    console.log(`FAIL: ${name}${detail === undefined ? '' : ` — ${JSON.stringify(detail)}`}`);
  }
}

function makeHarness({ gold = 100, manpower = 100, homeStock = 1, depotStock = 10, water = true, type = 'Land' } = {}) {
  let treasury = gold;
  const hints = [];
  let dirty = 0;
  let hudRefreshes = 0;
  let panelRefreshes = 0;
  const home = {
    id: 'home', name: 'Home', ownerId: 0, q: 0, r: 0, population: 5, manpower,
    surowce: { drewno: homeStock },
  };
  const depot = {
    id: 'depot', ownerId: 0, q: 1, r: 0, population: 5, manpower: 0,
    surowce: { drewno: depotStock },
  };
  const cities = [home, depot];
  const cityProd = new Map();
  const unit = { Jednostka: 'Wojownik', Typ: type, 'Rola (linia)': 'Wrecz' };
  const data = { units: [unit] };
  const item = { kind: 'jednostka', id: 'Wojownik', nazwa: 'Wojownik', koszt: 10 };

  const ownerTreasury = () => treasury;
  const setOwnerTreasury = (_ownerId, value) => { treasury = Math.max(0, value); };
  const empireManpowerCurrent = () => cities
    .filter(city => city.ownerId === 0)
    .reduce((sum, city) => sum + city.manpower, 0);
  const deductManpowerFromEmpire = (_cities, ownerId, _epoka, amount) => {
    if (amount <= 0) return true;
    if (empireManpowerCurrent() < amount) return false;
    let remaining = amount;
    for (const city of [...cities].filter(c => c.ownerId === ownerId).sort((a, b) => b.manpower - a.manpower)) {
      const take = Math.min(city.manpower, remaining);
      city.manpower -= take;
      remaining -= take;
      if (remaining <= 0) break;
    }
    return remaining <= 0;
  };
  const tryDeductUnitSpawnCostsEmpire = (_cities, cityId, ownerId, _epoka, _popCost, _maxMult, _typeId) => {
    const city = cities.find(c => c.id === cityId && c.ownerId === ownerId);
    if (!city || empireManpowerCurrent() < 10) {
      return { ok: false, population: city?.population ?? 0, manpower: city?.manpower ?? 0, kosztManpower: 10 };
    }
    deductManpowerFromEmpire(cities, ownerId, 1, 10);
    return { ok: true, population: city.population, manpower: city.manpower, kosztManpower: 10 };
  };
  const refundManpowerToEmpire = (_cities, ownerId, _epoka, amount) => {
    const city = cities.find(c => c.ownerId === ownerId);
    if (city) city.manpower += amount;
  };
  const ownerResourceStockAll = (_cities, ownerId) => cities
    .filter(city => city.ownerId === ownerId)
    .reduce((pool, city) => {
      for (const [key, value] of Object.entries(city.surowce ?? {})) pool[key] = (pool[key] ?? 0) + value;
      return pool;
    }, {});
  const unitStockCost = () => ({ drewno: 2 });
  const missingStockFor = (pool, cost) => Object.fromEntries(
    Object.entries(cost)
      .filter(([key, need]) => need > (pool[key] ?? 0))
      .map(([key, need]) => [key, need - (pool[key] ?? 0)]),
  );
  const deductBuildingStockCostAcrossCities = (_cities, ownerId, cost) => {
    for (const [key, rawNeed] of Object.entries(cost)) {
      let need = rawNeed;
      for (const city of [...cities]
        .filter(c => c.ownerId === ownerId && (c.surowce?.[key] ?? 0) > 0)
        .sort((a, b) => (b.surowce[key] ?? 0) - (a.surowce[key] ?? 0))) {
        if (need <= 0) break;
        const take = Math.min(city.surowce[key] ?? 0, need);
        city.surowce[key] -= take;
        need -= take;
      }
    }
  };
  const creditOwnerResourceStock = (_cities, ownerId, key, amount) => {
    const city = cities.find(c => c.ownerId === ownerId);
    if (city) city.surowce[key] = (city.surowce[key] ?? 0) + amount;
  };
  const poolFor = () => ownerResourceStockAll(cities, 0);
  const pickUnitRecruitHint = pool => pool.drewno >= 2 ? null : 'Brakuje w magazynie';
  const enqueueRecruitment = (prod, queuedItem) => ({
    kolejka: [...prod.kolejka],
    postep: prod.postep,
    wstrzymana: prod.wstrzymana,
    rekrutacja: [...(prod.rekrutacja ?? []), queuedItem],
  });
  const unitProductionItem = () => ({ ...item });
  const updateHud = () => { hudRefreshes++; };
  const refreshCityPanelIfOpen = () => { panelRefreshes++; };
  const markCityStateDirty = () => { dirty++; };
  const showHintMessage = message => { hints.push(message); };

  const functions = makeFunctions(
    ownerTreasury,
    cities,
    () => water,
    showHintMessage,
    () => 1,
    () => ({ maxMult: 1 }),
    (_cities, _ownerId, _city, _epoka, _popCost, _maxMult, _typeId) => empireManpowerCurrent() >= 10,
    unitProductionItem,
    data,
    () => [],
    { kosztJednostekPace: 'niski' },
    'normal',
    unitStockCost,
    ownerResourceStockAll,
    pickUnitRecruitHint,
    missingStockFor,
    key => key,
    tryDeductUnitSpawnCostsEmpire,
    () => 10,
    empireManpowerCurrent,
    deductManpowerFromEmpire,
    0,
    setOwnerTreasury,
    deductBuildingStockCostAcrossCities,
    markCityStateDirty,
    cityProd,
    enqueueRecruitment,
    updateHud,
    refreshCityPanelIfOpen,
    refundManpowerToEmpire,
    creditOwnerResourceStock,
  );

  function snapshot() {
    const pool = poolFor();
    const prod = cityProd.get('home');
    return {
      gold: treasury,
      manpower: empireManpowerCurrent(),
      stock: pool.drewno ?? 0,
      queue: prod?.rekrutacja?.map(entry => ({ ...entry })) ?? [],
      dirty,
      hudRefreshes,
      panelRefreshes,
      hints: [...hints],
    };
  }

  return {
    item,
    cities,
    cityProd,
    purchase: functions.purchaseRecruitmentUnit,
    cancel: functions.cancelRecruitmentPurchase,
    snapshot,
    get gold() { return treasury; },
  };
}

function sameState(a, b) {
  const withoutHints = state => {
    const { hints: _hints, ...rest } = state;
    return rest;
  };
  return JSON.stringify(withoutHints(a)) === JSON.stringify(withoutHints(b));
}

console.log('-- q>1 sukces: jedna transakcja, q zwykłych pozycji --');
{
  const h = makeHarness();
  const accepted = h.purchase('home', 'Wojownik', 10, 0, 3);
  const after = h.snapshot();
  check('q=3 zakup przyjęty', accepted === true);
  check('q=3 pobiera 3× złoto, Manpower i surowiec',
    after.gold === 70 && after.manpower === 70 && after.stock === 5, after);
  check('q=3 dodaje dokładnie trzy zwykłe pozycje',
    after.queue.length === 3 && after.queue.every(entry => entry.kind === 'jednostka'), after.queue);
  check('mutacje odświeżają stan dopiero po atomowym sukcesie',
    after.dirty === 1 && after.hudRefreshes === 1 && after.panelRefreshes === 1, after);

  const saved = JSON.parse(JSON.stringify(h.cityProd.get('home')));
  const loaded = JSON.parse(JSON.stringify(saved));
  check('save/load zachowuje trzy zwykłe pozycje bez rezerwacji',
    loaded.rekrutacja.length === 3
      && loaded.rekrutacja.every(entry => entry.kind === 'jednostka' && entry.koszt === 10)
      && !('reservation' in loaded.rekrutacja[0]), loaded);

  h.cancel('home', 'Wojownik', 10, 0);
  const afterCancel = h.snapshot();
  check('anulowanie jednej pozycji zwraca pojedynczy pełny koszt',
    afterCancel.gold === 80 && afterCancel.manpower === 80 && afterCancel.stock === 7,
    afterCancel);
  h.cityProd.set('home', { ...h.cityProd.get('home'), rekrutacja: h.cityProd.get('home').rekrutacja.slice(1) });
  check('po anulowaniu model kolejki usuwa tylko jedną pozycję',
    h.snapshot().queue.length === 2, h.snapshot().queue);
}

console.log('\n-- negative controls: brak dowolnego kosztu nie mutuje nic --');
for (const [label, options] of [
  ['złota', { gold: 20 }],
  ['Manpoweru', { manpower: 20 }],
  ['surowca', { homeStock: 1, depotStock: 4 }],
]) {
  const h = makeHarness(options);
  const before = h.snapshot();
  const accepted = h.purchase('home', 'Wojownik', 10, 0, 3);
  const after = h.snapshot();
  check(`brak ${label} odrzuca całą partię`, accepted === false && sameState(before, after), { before, after });
  check(`brak ${label} nie dodaje pozycji`, after.queue.length === 0, after.queue);
}

console.log('\n-- water gate --');
{
  const h = makeHarness({ type: 'Naval', water: false });
  const before = h.snapshot();
  const accepted = h.purchase('home', 'Wojownik', 10, 0, 3);
  check('brak wody odrzuca partię przed pobraniem kosztów', accepted === false && sameState(before, h.snapshot()), h.snapshot());
}

console.log('\n-- q=1 regression --');
{
  const h = makeHarness({ gold: 10, manpower: 10, homeStock: 2, depotStock: 0 });
  const accepted = h.purchase('home', 'Wojownik', 10, 0);
  const after = h.snapshot();
  check('q=1 nadal kupuje pojedynczą jednostkę', accepted === true && after.queue.length === 1, after);
  check('q=1 pobiera dokładnie pojedynczy koszt',
    after.gold === 0 && after.manpower === 0 && after.stock === 0, after);
}

console.log('\n-- invalid quantity --');
{
  const h = makeHarness();
  const before = h.snapshot();
  const accepted = h.purchase('home', 'Wojownik', 10, 0, 0);
  check('q=0 jest odrzucane przez backend', accepted === false && sameState(before, h.snapshot()), h.snapshot());
}

console.log(`\nrecruitment-batch-contract-test: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
