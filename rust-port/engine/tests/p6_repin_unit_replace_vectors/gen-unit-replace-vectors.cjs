// R-RUSTPORT-REPIN-UNIT-REPLACE-Q1: generator wektorow z URUCHOMIONEGO weba (origin/main).
//
// Uzycie (Node 22):
//   node gen-unit-replace-vectors.cjs <ur-bundle.cjs> <web gra/data> <wyjscie.json>
// gdzie:
//   ur-bundle.cjs = esbuild --bundle --format=cjs --platform=node ur-entry.ts
//     (wejscie: gra/src/game/{unit-replace-cost,unit-replace-execute,unit-replace-context}.ts
//      + ur-plan-shim.ts / ur-army-shim.ts / ai-purchase-web.ts z tego katalogu; kroki: P6-REPIN-UNIT-REPLACE.md §4);
//   web gra/data = `git archive origin/main gra/data | tar -x -C <katalog POZA repo>`.
// Kod testowany: unit-replace-cost.ts, unit-replace-execute.ts, unit-replace-context.ts (1:1),
// ai-unit-replace-plan.ts (1:1, tylko importy przepiete na shimy: armyClassOfUnit i shouldAIPurchaseUnit).
const fs = require('fs');
const path = require('path');

const [bundlePath, dataDir, outPath] = process.argv.slice(2);
if (!bundlePath || !dataDir || !outPath) {
  console.error('uzycie: node gen-unit-replace-vectors.cjs <ur-bundle.cjs> <web gra/data> <wyjscie.json>');
  process.exit(2);
}
const web = require(path.resolve(bundlePath));
const units = JSON.parse(fs.readFileSync(path.join(dataDir, 'units.json'), 'utf8'));
const aiParams = JSON.parse(fs.readFileSync(path.join(dataDir, 'ai-params.json'), 'utf8'));
const data = { aiParams };

const out = {
  meta: { source: 'origin/main gra/src/game/unit-replace-*.ts + ai-unit-replace-plan.ts', generator: 'gen-unit-replace-vectors.cjs' },
  cost: [],
  afford: [],
  merge: [],
  execute: [],
  plan: [],
  cap: [],
  armyKeep: [],
  reserve: [],
  maxFraction: [],
};

const num = (x) => (x === undefined ? null : x);

// --- 1. Koszt pelny: wszystkie jednostki z units.json (pieniadz = Pieniadz (koszt)) ---
for (const u of units) {
  const def = {
    Jednostka: u.Jednostka,
    Typ: u.Typ,
    Epoka: u.Epoka,
    Surowiec: u['Surowiec'],
    'Surowiec (ilość)': u['Surowiec (ilość)'],
  };
  const money = u['Pieniądz (koszt)'];
  const cost = web.unitReplaceFullCost(def, money);
  out.cost.push({
    id: `unit-${u.Jednostka}`,
    def,
    money: num(money),
    expected: { money: cost.money, stock: cost.stock },
  });
}
// wejscia brzegowe kosztu pieniezego
for (const [id, money] of [['money-null', null], ['money-nan', NaN], ['money-neg', -5], ['money-frac', 12.5], ['money-half', 2.5]]) {
  const cost = web.unitReplaceFullCost(null, money);
  out.cost.push({ id, def: null, money: money === null ? null : (Number.isNaN(money) ? 'NaN' : money), expected: { money: cost.money, stock: cost.stock } });
}

// --- 2. Brak srodkow / pula panstwa ---
const costs = [
  { money: 40, stock: { braz: 25 } },
  { money: 30, stock: { zelazo: 30, kon: 50 } },
  { money: 0, stock: {} },
  { money: 10, stock: { kon: 25 } },
];
const pools = [undefined, {}, { braz: 25 }, { braz: 24 }, { braz: 100, zelazo: 30 }, { zelazo: 29, kon: 50 }, { kon: 25 }];
let affordIdx = 0;
for (const c of costs) {
  for (const pool of pools) {
    for (const treasury of [39, 40, 100]) {
      const id = `afford-${affordIdx++}`;
      const ok = web.canAffordUnitReplace(c, treasury, pool);
      const missing = web.unitReplaceStockMissing(c, pool);
      out.afford.push({ id, cost: c, treasury, pool: pool === undefined ? null : pool, expected: { canAfford: ok, missing } });
    }
  }
}

// --- 3. merge sladu zuzycia ---
const mergeCases = [
  [undefined, { braz: 25 }],
  [{ braz: 10 }, { braz: 25, kon: 5 }],
  [{ kon: 3 }, {}],
  [{ braz: 1 }, { braz: 0, kon: -4, zelazo: 0 }],
];
mergeCases.forEach(([prev, added], i) => {
  out.merge.push({ id: `merge-${i}`, previous: prev === undefined ? null : prev, added, expected: web.mergeStockPaid(prev, added) });
});

// --- 4. Wykonanie (execute): wspolne bramki gracza i AI ---
function execCase(id, unit, newTypeId, deps) {
  const u = { ...unit };
  if (u.hp === null) delete u.hp;
  const paid = [];
  let treasury = deps.treasury;
  const d = {
    gateReason: () => deps.gate ?? null,
    moneyCost: () => deps.money,
    stockCost: () => deps.stock,
    canPayStock: () => deps.canPay,
    payStock: (cost) => { paid.push(cost); },
    currentTreasury: () => treasury,
    setTreasury: (v) => { treasury = v; },
    oldMaxHp: () => deps.oldMaxHp,
    newMaxHp: () => deps.newMaxHp,
    category: () => deps.category,
    syncHpMax: deps.syncHpMax,
  };
  const res = web.executeUnitReplace(u, newTypeId, d);
  out.execute.push({
    id,
    unit: { ...unit },
    newTypeId,
    deps: {
      gate: deps.gate ?? null,
      money: Number.isNaN(deps.money) ? 'NaN' : deps.money,
      stock: deps.stock,
      canPay: deps.canPay,
      treasury: deps.treasury,
      oldMaxHp: deps.oldMaxHp,
      newMaxHp: deps.newMaxHp,
      category: deps.category,
      syncHpMax: !!deps.syncHpMax,
    },
    expected: {
      ok: res.ok,
      reason: res.ok ? null : res.reason,
      detail: res.ok ? null : (res.detail ?? null),
      money: res.money,
      stock: res.stock,
      oldTypeId: res.ok ? res.oldTypeId : null,
      treasuryAfter: treasury,
      paid,
      unit: {
        typeId: u.typeId,
        category: u.category ?? null,
        hp: num(u.hp),
        hpMax: num(u.hpMax),
        ruchLeft: num(u.ruchLeft),
        replaceUsedThisTurn: num(u.replaceUsedThisTurn),
      },
    },
  });
}

const base = { typeId: 'Wojownik', category: 'Standardowa', hp: 8, hpMax: 10, ruchLeft: 2, replaceUsedThisTurn: false };
const okDeps = { gate: null, money: 40, stock: { braz: 25 }, canPay: true, treasury: 100, oldMaxHp: 10, newMaxHp: 14, category: 'Standardowa', syncHpMax: false };
execCase('ok-podstawowy', base, 'Włócznik', okDeps);
execCase('ok-sync-hpmax-ai', base, 'Włócznik', { ...okDeps, syncHpMax: true });
execCase('ok-bez-stock', base, 'Włócznik', { ...okDeps, stock: {}, canPay: false });
execCase('ok-zero-money', base, 'Włócznik', { ...okDeps, money: 0 });
execCase('ok-money-rounding', base, 'Włócznik', { ...okDeps, money: 40.5, treasury: 100 });
execCase('ok-money-rounding-down', base, 'Włócznik', { ...okDeps, money: 40.4, treasury: 100 });
execCase('ok-hp-null-uses-maxhp', { ...base, hp: null }, 'Włócznik', okDeps);
execCase('ok-hp-min1', { ...base, hp: 1 }, 'Włócznik', { ...okDeps, oldMaxHp: 100, newMaxHp: 3 });
execCase('ok-oldmaxhp-zero', { ...base, hp: 5, hpMax: 0 }, 'Włócznik', { ...okDeps, oldMaxHp: 0, newMaxHp: 14 });
execCase('ok-treasury-exact', base, 'Włócznik', { ...okDeps, money: 40, treasury: 40 });
execCase('used-this-turn', { ...base, replaceUsedThisTurn: true }, 'Włócznik', okDeps);
execCase('gate-super', base, 'Włócznik', { ...okDeps, gate: 'Limit Super-jednostki' });
execCase('gate-stock-required', base, 'Włócznik', { ...okDeps, gate: 'Brak zapasu' });
execCase('stock-short', base, 'Włócznik', { ...okDeps, canPay: false, money: 40, treasury: 100 });
execCase('stock-short-empty-cost-ok', base, 'Włócznik', { ...okDeps, stock: {}, canPay: false });
execCase('money-short', base, 'Włócznik', { ...okDeps, money: 200, treasury: 100 });
execCase('money-short-stock-first', base, 'Włócznik', { ...okDeps, money: 200, treasury: 100, canPay: false });
execCase('money-nan', base, 'Włócznik', { ...okDeps, money: NaN, treasury: 0 });
execCase('money-negative', base, 'Włócznik', { ...okDeps, money: -3, treasury: 0 });
execCase('stock-zero-amount', base, 'Włócznik', { ...okDeps, stock: { braz: 0 }, canPay: false });
execCase('keeps-ruch-and-used-reset', { ...base, ruchLeft: 3, category: 'Specjalna' }, 'Włócznik', { ...okDeps, category: 'Super' });

// --- 5. Kolejnosc planu AI ---
const planCases = [
  { id: 'plan-epoka-first', units: [{ epoch: 2, power: 1, blocked: false }, { epoch: 1, power: 9, blocked: false }] },
  { id: 'plan-power-tie-index', units: [{ epoch: 1, power: 5, blocked: false }, { epoch: 1, power: 3, blocked: false }, { epoch: 1, power: 3, blocked: false }] },
  { id: 'plan-blocked-removed', units: [{ epoch: 1, power: 1, blocked: true }, { epoch: 3, power: 2, blocked: false }, { epoch: 2, power: 2, blocked: false }] },
  { id: 'plan-empty', units: [] },
  { id: 'plan-all-blocked', units: [{ epoch: 1, power: 1, blocked: true }] },
];
for (const c of planCases) {
  const idxs = c.units.map((_, i) => i);
  const order = web.planAiUnitReplaceOrder(idxs, (i) => c.units[i]);
  out.plan.push({ id: c.id, units: c.units, expectedOrder: order });
}

// --- 6. Limit zamian: aiUnitReplaceCap ---
for (const [count, fraction] of [[0, 0.1], [-1, 0.1], [1, 0.1], [9, 0.1], [10, 0.1], [11, 0.1], [25, 0.1], [7, 0.5], [20, 0.25], [5, 0]]) {
  out.cap.push({ id: `cap-${count}-${fraction}`, count, fraction, expected: web.aiUnitReplaceCap(count, fraction) });
}

// --- 7. Klasa armii zachowana ---
const typs = ['Swordsman', 'Spearman', 'Falangite', 'Offensive', 'Distance', 'Slinger', 'Mount', 'Siege', 'Civilian', null, undefined, ' Mount '];
for (const a of typs) {
  for (const b of typs) {
    out.armyKeep.push({
      id: `keep-${a}-${b}`,
      oldTyp: a === undefined ? null : a,
      newTyp: b === undefined ? null : b,
      expected: web.aiReplaceKeepsArmyClass(a === undefined ? undefined : { Typ: a }, b === undefined ? undefined : { Typ: b }),
    });
  }
}

// --- 8. Rezerwa utrzymania AI (ta sama regula co zakup AI) ---
const levels = [1, 2, 3];
// wartosci rezerwy z ai-params.json: sprawdzamy 3 poziomy trudnosci
let rIdx = 0;
for (const level of levels) {
  const r = web.loadAiPurchaseReserveParams(data, level);
  const R = r.rezerwaTur;
  const M = r.minDochodNetto;
  const UP = 5, UNIT = 2;
  const prog = R * (UP + UNIT);
  const cost = 40;
  const cases = [
    { treasury: cost + prog - 1, net: 1000 },
    { treasury: cost + prog, net: 1000 },
    { treasury: cost + prog + 1, net: 1000 },
    { treasury: 100000, net: M + UNIT - 1 },
    { treasury: 100000, net: M + UNIT },
    { treasury: 100000, net: M + UNIT + 1 },
    { treasury: cost - 1, net: 1000 },
  ];
  for (const c of cases) {
    const input = {
      treasury: c.treasury,
      moneyCost: cost,
      reserve: { rezerwaTur: R, minDochodNetto: M },
      netIncomePerTurn: c.net,
      upkeepPerTurn: UP,
      unitUpkeepPerTurn: UNIT,
    };
    out.reserve.push({
      id: `reserve-L${level}-${rIdx++}`,
      level,
      input,
      expected: web.aiReplaceReserveOk(input),
    });
  }
  // brak danych rezerwy = zachowanie dawne (wystarczy skarbiec na cene)
  out.reserve.push({ id: `reserve-L${level}-legacy`, level, input: { treasury: cost, moneyCost: cost }, expected: web.aiReplaceReserveOk({ treasury: cost, moneyCost: cost }) });
  out.reserve.push({ id: `reserve-L${level}-skarbiec-ponizej`, level, input: { treasury: cost - 1, moneyCost: cost }, expected: web.aiReplaceReserveOk({ treasury: cost - 1, moneyCost: cost }) });
}
out.reserveParams = levels.map((n) => ({ level: n, ...web.loadAiPurchaseReserveParams(data, n) }));

// --- 9. Udzial limitu (loader) ---
for (const v of [undefined, null, 0, 0.1, 0.25, -0.5, 'x', NaN]) {
  const entry = v === undefined ? {} : { wartosc: v };
  const cfg = { aiParams: { ai_zamiana_jednostek_limit_udzial: entry } };
  out.maxFraction.push({
    id: `frac-${String(v)}`,
    value: v === undefined ? null : (Number.isNaN(v) ? 'NaN' : v),
    expected: web.loadAiUnitReplaceMaxFraction(cfg),
  });
}
out.maxFraction.push({ id: 'frac-brak-wpisu', value: 'brak', expected: web.loadAiUnitReplaceMaxFraction({ aiParams: {} }) });

fs.writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n');
console.log(`ok: cost=${out.cost.length} afford=${out.afford.length} execute=${out.execute.length} plan=${out.plan.length} reserve=${out.reserve.length}`);
