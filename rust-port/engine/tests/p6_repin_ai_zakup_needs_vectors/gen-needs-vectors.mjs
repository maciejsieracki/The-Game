// Generator wektorow: uruchamia PRAWDZIWY kod weba (gra/src/game/ai-resource-needs.ts) z git archive origin/main.
// Uzycie (z katalogu engine/tests/p6_repin_ai_zakup_needs_vectors, Node 22):
//   P6_WEB_ROOT=<web> node --experimental-transform-types --no-warnings --import ./register.mjs ./gen-needs-vectors.mjs ./needs-vectors.json
// register.mjs + hooks.mjs: rozwiazywanie importow bez rozszerzenia (.ts) i JSON jako modul ESM.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const WEB = process.env.P6_WEB_ROOT;
const OUT = process.argv[2];
const mod = await import(pathToFileURL(join(WEB, 'gra/src/game/ai-resource-needs.ts')).href);

// Deterministyczny PRNG (mulberry32), zeby wektory byly powtarzalne.
let seed = 0x5eed2026;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const randInt = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

const POOL = ['ceramika', 'drewno', 'kamien', 'miedz', 'zelazo', 'wino', 'sol', 'zywnosc'];

// Katalogi kosztow (koszt_surowce surowe, jak w data/buildings + unit-stock-costs).
const BUILDING_KOSZT = {
  bud_a: { ceramika: 3, drewno: 2 },
  bud_b: { kamien: 1 },
  bud_c: { zelazo: 4, miedz: 0 },
  bud_d: { wino: 0.4, sol: 7 },
  bud_none: undefined,
};
const UNIT_KOSZT = {
  u_a: { zelazo: 5, wino: 2 },
  u_b: {},
  u_c: { miedz: 9, ceramika: 1 },
};

const lookupBuilding = (id) => BUILDING_KOSZT[id];
const lookupUnit = (id) => UNIT_KOSZT[id];

const cases = [];
const run = (id, input) => {
  // Wejscie dla weba (obiekty JS, kolejnosc kluczy upkeepDemand zachowana).
  const web = {
    goods: input.goods.map((g) => (g.ilosc === undefined ? { key: g.key, label: g.key } : { key: g.key, label: g.key, ilosc: g.ilosc })),
    pricedKeys: input.pricedKeys,
    pakietWielkosc: input.pakiet,
    queuedBuildingIds: input.queuedBuildingIds,
    lookupBuildingStockCost: lookupBuilding,
    queuedUnitTypeIds: input.queuedUnitTypeIds,
    lookupUnitStockCost: lookupUnit,
    ...(input.foodReserve !== undefined ? { foodReserve: input.foodReserve } : {}),
    ...(input.foodUrgentThreshold !== undefined ? { foodUrgentThreshold: input.foodUrgentThreshold } : {}),
    upkeepDemand: Object.fromEntries(input.upkeep),
  };
  const out = mod.detectOwnerResourceNeeds(web);
  cases.push({
    id,
    input: {
      goods: input.goods.map((g) => ({ key: g.key, ilosc: g.ilosc ?? null })),
      pricedKeys: input.pricedKeys,
      pakiet: input.pakiet,
      queuedBuildingIds: input.queuedBuildingIds,
      queuedUnitTypeIds: input.queuedUnitTypeIds,
      foodReserve: input.foodReserve ?? null,
      foodUrgentThreshold: input.foodUrgentThreshold ?? null,
      upkeep: input.upkeep,
    },
    expected: {
      deficitKeys: out.deficitKeys,
      urgentKeys: out.urgentKeys,
      needsResource: Object.keys(out.needsResource).filter((k) => out.needsResource[k] === true).sort(),
    },
  });
};

// Przypadki reczne: brzegi.
run('pusty-magazyn', { goods: [], pricedKeys: ['drewno', 'kamien'], pakiet: 10, queuedBuildingIds: [], queuedUnitTypeIds: [], upkeep: [] });
run('pakiet-ponizej-1', { goods: [{ key: 'drewno', ilosc: 0 }], pricedKeys: ['drewno'], pakiet: 0, queuedBuildingIds: [], queuedUnitTypeIds: [], upkeep: [] });
run('remis-luki-kolejnosc', { goods: [{ key: 'miedz', ilosc: 2 }], pricedKeys: ['drewno', 'miedz', 'kamien'], pakiet: 5, queuedBuildingIds: [], queuedUnitTypeIds: [], upkeep: [] });
run('kolejka-budynek-x2', { goods: [{ key: 'ceramika', ilosc: 5 }, { key: 'drewno', ilosc: 2 }], pricedKeys: [], pakiet: 10, queuedBuildingIds: ['bud_a', 'bud_none'], queuedUnitTypeIds: [], upkeep: [] });
run('duplikat-klucza-ostatni-wygrywa', { goods: [{ key: 'kamien', ilosc: 0 }, { key: 'kamien', ilosc: 9 }], pricedKeys: ['kamien'], pakiet: 4, queuedBuildingIds: ['bud_b'], queuedUnitTypeIds: [], upkeep: [] });
run('zywnosc-niska', { goods: [], pricedKeys: [], pakiet: 10, queuedBuildingIds: [], queuedUnitTypeIds: [], upkeep: [], foodReserve: 7 });
run('zywnosc-prog-custom', { goods: [], pricedKeys: [], pakiet: 10, queuedBuildingIds: [], queuedUnitTypeIds: [], upkeep: [], foodReserve: 7, foodUrgentThreshold: 5 });
run('utrzymanie-zero-pominiete', { goods: [{ key: 'wino', ilosc: 0 }], pricedKeys: [], pakiet: 10, queuedBuildingIds: [], queuedUnitTypeIds: [], upkeep: [['wino', 0], ['sol', -3], ['ceramika', 2.5]] });

// Przypadki losowe (deterministyczne).
for (let n = 0; n < 240; n++) {
  const goodsCount = randInt(0, 9);
  const goods = [];
  for (let i = 0; i < goodsCount; i++) {
    const key = pick(POOL);
    const ilosc = rnd() < 0.15 ? undefined : randInt(0, 30);
    goods.push({ key, ilosc });
  }
  const priced = POOL.filter(() => rnd() < 0.5);
  const pakiet = pick([1, 3, 5, 10, 20, 0.5]);
  const bIds = Object.keys(BUILDING_KOSZT).filter(() => rnd() < 0.35);
  const uIds = Object.keys(UNIT_KOSZT).filter(() => rnd() < 0.4);
  const upkeepKeys = POOL.filter(() => rnd() < 0.4).sort(() => rnd() - 0.5);
  const upkeep = upkeepKeys.map((k) => [k, pick([0, 1, 2, 4.5, 8, 12, -1])]);
  const foodReserve = rnd() < 0.3 ? undefined : randInt(0, 20);
  const foodUrgentThreshold = rnd() < 0.8 ? undefined : pick([5, 10, 12]);
  run(`losowy-${n}`, { goods, pricedKeys: priced, pakiet, queuedBuildingIds: bIds, queuedUnitTypeIds: uIds, upkeep, foodReserve, foodUrgentThreshold });
}

writeFileSync(OUT, JSON.stringify({ source: 'gra/src/game/ai-resource-needs.ts (origin/main)', cases }, null, 1) + '\n');
console.log(`cases=${cases.length}`);
