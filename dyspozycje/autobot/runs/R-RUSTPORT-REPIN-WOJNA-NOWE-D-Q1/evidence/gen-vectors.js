// Generator wektorow z uruchomionego weba (pin dc8a3adc). Uruchamiany na skompilowanym
// (tsc, CommonJS) drzewie gra/src w katalogu tymczasowym. Wynik: JSON z wejsciami i
// oczekiwanymi wyjsciami `planWarAllInCapital` (wywolanie zywego kodu weba, nie kopia).
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2];
const SEEDS = Number(process.argv[3] || 300);
const OUT_DIR = path.resolve(__dirname, 'out');
const web = require(path.join(OUT_DIR, 'src/game/warAllInCapital.js'));
const setup = require(path.join(OUT_DIR, 'src/units/setup.js'));
// Jak main.ts (loadGameData -> configureTerrainMovement): koszty terenu z gra/data/terrain-movement.json.
// Bez tego web uzywa DEFAULT_TERRAIN_COSTS (np. Pustynia = 1 zamiast 2 z JSON).
const tm = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'gra/data/terrain-movement.json'), 'utf8'));
setup.configureTerrainMovement(tm.costs, tm.forestExtra);

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LAND = ['laka', 'rownina', 'wzgorza', 'gory', 'pustynia'];
const TERRAINS = ['laka', 'laka', 'laka', 'rownina', 'rownina', 'wzgorza', 'gory', 'pustynia',
  'plytkie_morze', 'morze', 'morze', 'polarny'];

function scenario(seed) {
  const rnd = mulberry32(seed * 7919 + 17);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const W = 6 + Math.floor(rnd() * 15);
  const H = 3 + Math.floor(rnd() * 7);
  const hexes = {};
  const hexList = [];
  for (let q = 0; q < W; q++) {
    for (let r = 0; r < H; r++) {
      const teren = pick(TERRAINS);
      const las = LAND.includes(teren) && rnd() < 0.2 ? 'las' : 'brak';
      const rzeka = rnd() < 0.05;
      const ulep = rnd() < 0.15 ? pick(['droga', 'droga_brukowana']) : 'brak';
      const key = `${q},${r}`;
      hexes[key] = {
        coords: { q, r },
        terenBazowy: teren,
        nakladka: las,
        ulepszenie: ulep,
        rzeka: { obecna: rzeka },
        wlasciciel: null,
      };
      hexList.push({ q, r, teren, las, rzeka, ulepszenie: ulep });
    }
  }
  const randKey = () => `${Math.floor(rnd() * W)},${Math.floor(rnd() * H)}`;
  const keyToQr = (k) => k.split(',').map(Number);

  const nUnits = 1 + Math.floor(rnd() * 6);
  const unitKeys = new Set();
  while (unitKeys.size < nUnits) unitKeys.add(randKey());
  const units = [];
  let idx = 0;
  for (const k of unitKeys) {
    const [q, r] = keyToQr(k);
    const roll = rnd();
    const u = { id: `${pick(['ka', 'bo', 'zy', 'ae', 'mi'])}${idx}`, q, r };
    if (roll >= 0.5) u.ruchLeft = pick([0.5, 1, 1.5, 2, 3]);
    units.push(u);
    idx++;
  }

  const nTargets = 1 + Math.floor(rnd() * 3);
  const targets = [];
  const targetKeys = new Set();
  while (targets.length < nTargets) {
    const k = randKey();
    if (targetKeys.has(k)) continue;
    targetKeys.add(k);
    const [q, r] = keyToQr(k);
    targets.push({ ownerId: 2 + targets.length, cityId: `c${pick(['A', 'B', 'C'])}${targets.length}`, q, r });
  }

  const blocked = [];
  const blockedRate = rnd() * 0.12;
  for (const k of Object.keys(hexes)) {
    if (rnd() < blockedRate && !targetKeys.has(k) && !unitKeys.has(k)) blocked.push(k);
  }
  const occupied = rnd() < 0.5 ? Object.keys(hexes).filter(() => rnd() < 0.08) : null;
  const allowSea = rnd() < 0.5;
  const march = rnd() < 0.3;

  const nav = {
    map: { szerokoscQ: W, wysokoscR: H, hexes },
    allowSea,
    blocked: new Set(blocked),
    occupied: occupied ? new Set(occupied) : undefined,
  };
  const plan = web.planWarAllInCapital(units, targets, nav, { marchMainGroupWhileRendezvous: march });

  return {
    seed,
    map: { w: W, h: H, hexes: hexList },
    units,
    targets: targets.map((t) => ({ ownerId: t.ownerId, cityId: t.cityId, q: t.q, r: t.r })),
    blocked: blocked.map(keyToQr),
    occupied: occupied ? occupied.map(keyToQr) : null,
    allowSea,
    marchMainGroupWhileRendezvous: march,
    expected: {
      orders: plan.orders.map((o) => ({
        unitId: o.unitId,
        step: [o.step.q, o.step.r],
        targetCityId: o.targetCityId,
        targetOwnerId: o.targetOwnerId,
        mode: o.mode,
      })),
      noPath: plan.noPath,
      held: plan.held,
      groupsByTarget: plan.groupsByTarget,
    },
  };
}

const scenarios = [];
for (let s = 1; s <= SEEDS; s++) scenarios.push(scenario(s));
const stats = {
  scenarios: scenarios.length,
  withOrders: scenarios.filter((s) => s.expected.orders.length > 0).length,
  rendezvousOrders: scenarios.reduce((a, s) => a + s.expected.orders.filter((o) => o.mode === 'rendezvous').length, 0),
  engageOrders: scenarios.reduce((a, s) => a + s.expected.orders.filter((o) => o.mode === 'engage').length, 0),
  multiStepOrders: scenarios.reduce((a, s) => a + s.expected.orders.filter((o) => o.step).length, 0),
};
const doc = {
  meta: {
    zrodlo: 'gra/src/game/warAllInCapital.ts @ dc8a3adc (planWarAllInCapital, zywe wywolanie CommonJS z tsc)',
    generator: 'scratchpad gen-vectors.js (R-RUSTPORT-REPIN-WOJNA-NOWE-D-Q1 runda 3)',
    seeds: SEEDS,
    stats,
  },
  scenarios,
};
fs.writeFileSync(OUT, JSON.stringify(doc));
console.log(JSON.stringify(stats));
