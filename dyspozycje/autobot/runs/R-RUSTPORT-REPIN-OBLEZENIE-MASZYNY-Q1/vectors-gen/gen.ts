import { siegeEngineBuildOption, siegeEngineQuota, SIEGE_ENGINE_UNITS_PER_MACHINE } from '../web/gra/src/game/siege-engine-build';
import { unitStockCost } from '../web/gra/src/game/building-stock-cost';

const siegeUnit: any = { Jednostka: 'Taran', Typ: 'Siege', Tech: '-', Epoka: 1, Surowiec: 'Drewno', 'Surowiec (ilość)': 20 };
const lockedSiege: any = { Jednostka: 'Katapulta', Typ: 'Siege', Tech: 'Inzynieria', Epoka: 2, Surowiec: 'Żelazo', 'Surowiec (ilość)': 15 };
const infantry: any = { Jednostka: 'Miecznik', Typ: 'Infantry', Tech: '-', Epoka: 1, Surowiec: '-', 'Surowiec (ilość)': 0 };
const mounted: any = { Jednostka: 'Rydwan', Typ: 'Mount', Tech: '-', Epoka: 1, Surowiec: '-', 'Surowiec (ilość)': 0 };

const mk = (n: number, owner = 1, cat = 'zwykla') =>
  Array.from({ length: n }, () => ({ ownerId: owner, category: cat } as any));

const cases: any[] = [];
const add = (name: string, unit: any, ctx: any, costMoney: number) => {
  const stock = unitStockCost(unit);
  const o = siegeEngineBuildOption(unit, ctx, costMoney);
  cases.push({
    name,
    unit,
    ctx: {
      activeSiege: ctx.activeSiege, atWar: ctx.atWar, ownerId: ctx.ownerId, turn: ctx.turn,
      army: ctx.army.map((u: any) => ({ ownerId: u.ownerId, category: u.category })),
      turnState: ctx.turnState ?? null,
      unlockedTechs: [...ctx.unlockedTechs].sort(),
      treasury: ctx.treasury, stock: ctx.stock,
    },
    costMoney,
    expect: {
      allowed: o.allowed, reason: o.reason ?? null, quota: o.quota,
      builtThisTurn: o.builtThisTurn, qualifyingArmyCount: o.qualifyingArmyCount,
      costStock: o.costStock, costMoney: o.costMoney,
    },
  });
};
const base = (over: any = {}) => ({
  activeSiege: true, atWar: true, ownerId: 1, turn: 10, army: mk(10), turnState: undefined,
  unlockedTechs: new Set<string>(), treasury: 1000, stock: { drewno: 100, zelazo: 100 }, ...over,
});

add('non_siege_def_reason_technology_locked', infantry, base(), 50);
add('mount_def_reason_technology_locked', mounted, base(), 50);
add('not_siege', siegeUnit, base({ activeSiege: false }), 50);
add('not_at_war', siegeUnit, base({ atWar: false }), 50);
add('no_army_of_owner', siegeUnit, base({ army: mk(10, 2) }), 50);
add('empty_army', siegeUnit, base({ army: [] }), 50);
add('only_siege_category_units', siegeUnit, base({ army: mk(12, 1, 'obleznicza') }), 50);
for (const n of [1, 9, 10, 11, 19, 20, 21]) {
  add(`units_${n}`, siegeUnit, base({ army: [...mk(n), ...mk(3, 1, 'obleznicza')] }), 50);
}
add('turn_limit_reached_quota1', siegeUnit, base({ turnState: { turn: 10, count: 1 } }), 50);
add('turn_limit_quota2_built1', siegeUnit, base({ army: mk(20), turnState: { turn: 10, count: 1 } }), 50);
add('turn_limit_quota2_built2', siegeUnit, base({ army: mk(20), turnState: { turn: 10, count: 2 } }), 50);
add('turn_state_other_turn_ignored', siegeUnit, base({ army: mk(10), turnState: { turn: 9, count: 5 } }), 50);
add('turn_state_fractional_count', siegeUnit, base({ army: mk(20), turnState: { turn: 10, count: 1.9 } }), 50);
add('tech_locked', lockedSiege, base(), 50);
add('tech_unlocked', lockedSiege, base({ unlockedTechs: new Set(['Inzynieria']) }), 50);
add('tech_spaces_trimmed', { ...lockedSiege, Tech: ' Inzynieria ' }, base({ unlockedTechs: new Set(['Inzynieria']) }), 50);
add('tech_em_dash_no_lock', { ...siegeUnit, Tech: '—' }, base(), 50);
add('money_exact', siegeUnit, base({ treasury: 50 }), 50);
add('money_short', siegeUnit, base({ treasury: 49.99 }), 50);
add('stock_exact', siegeUnit, base({ stock: { drewno: 20 } }), 50);
add('stock_short', siegeUnit, base({ stock: { drewno: 19 } }), 50);
add('stock_missing_key', siegeUnit, base({ stock: {} }), 50);
add('stock_multi_resource_short', lockedSiege, base({ unlockedTechs: new Set(['Inzynieria']), stock: { zelazo: 14 } }), 50);
add('money_before_resources', siegeUnit, base({ treasury: 0, stock: {} }), 50);
add('turn_limit_before_tech', lockedSiege, base({ turnState: { turn: 10, count: 1 } }), 50);
add('allowed_plain', siegeUnit, base(), 50);
add('allowed_quota2', siegeUnit, base({ army: mk(25) }), 50);
add('allowed_zero_cost', siegeUnit, base(), 0);

const out = {
  unitsPerSiegeEngine: SIEGE_ENGINE_UNITS_PER_MACHINE,
  quotaExamples: [0, 9, 10, 19, 20, 21].map(n => ({ n, quota: siegeEngineQuota(mk(n)) })),
  cases,
};
process.stdout.write(JSON.stringify(out, null, 2) + '\n');
