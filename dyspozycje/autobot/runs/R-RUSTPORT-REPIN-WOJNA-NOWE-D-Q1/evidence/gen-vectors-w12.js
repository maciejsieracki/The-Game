// Generator wektorow W1/W2 (tryb 'engage', enemyArmies/engageRadius/enemyStrength) z URUCHOMIONEGO
// weba (pin dc8a3adc). Uzycie: WEB_ROOT=<katalog gra/ po tsc> node gen-vectors-w12.js <wyjscie.json> [liczba_ziaren]
// WEB_ROOT zawiera out/ (tsc -p tsconfig, rootDir=src, outDir=out) oraz data/ (kopia gra/data z dc8a3adc).
// Generacja bazowa identyczna jak gen-vectors.js (te same draw'y RNG); wejscia W1/W2 losowane PO
// draw'ach bazowych, wiec mapa/jednostki/cele scenariusza sa identyczne z wektorami bazowymi.
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2];
const SEEDS = Number(process.argv[3] || 300);
const WEB = process.env.WEB_ROOT;
if (!WEB) throw new Error('ustaw WEB_ROOT');
const web = require(path.join(WEB, 'out/game/warAllInCapital.js'));
const setup = require(path.join(WEB, 'out/units/setup.js'));
const tm = JSON.parse(fs.readFileSync(path.join(WEB, 'data/terrain-movement.json'), 'utf8'));
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

  // --- W1/W2 (dodane po draw'ach bazowych) ---
  const useArmies = rnd() < 0.7;
  const useStrength = rnd() < 0.5;
  const engageRadius = pick([0, 1, 2, 3]);
  const enemyArmies = [];
  if (useArmies) {
    const nArmies = 1 + Math.floor(rnd() * 5);
    const ownersPool = [...targets.map((t) => t.ownerId), 2 + targets.length]; // ostatni = nie-cel
    for (let i = 0; i < nArmies; i++) {
      const [q, r] = keyToQr(randKey());
      const ownerId = pick(ownersPool);
      enemyArmies.push({ q, r, ownerId });
    }
  }
  let enemyStrength;
  if (useStrength) {
    const ownersPool = [...targets.map((t) => t.ownerId), 2 + targets.length];
    enemyStrength = ownersPool.map((ownerId) => ({ ownerId, strength: pick([0, 1, 2, 5, 10]) }));
  }

  const nav = {
    map: { szerokoscQ: W, wysokoscR: H, hexes },
    allowSea,
    blocked: new Set(blocked),
    occupied: occupied ? new Set(occupied) : undefined,
  };
  const opts = { marchMainGroupWhileRendezvous: march };
  if (useArmies) {
    opts.enemyArmies = enemyArmies;
    opts.engageRadius = engageRadius;
  }
  if (enemyStrength !== undefined) opts.enemyStrength = enemyStrength;
  const plan = web.planWarAllInCapital(units, targets, nav, opts);

  return {
    seed,
    map: { w: W, h: H, hexes: hexList },
    units,
    targets: targets.map((t) => ({ ownerId: t.ownerId, cityId: t.cityId, q: t.q, r: t.r })),
    blocked: blocked.map(keyToQr),
    occupied: occupied ? occupied.map(keyToQr) : null,
    allowSea,
    marchMainGroupWhileRendezvous: march,
    enemyArmies: useArmies ? enemyArmies : null,
    engageRadius: useArmies ? engageRadius : null,
    enemyStrength: enemyStrength !== undefined ? enemyStrength : null,
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
  w2Scenarios: scenarios.filter((s) => s.enemyStrength !== null).length,
  w1Scenarios: scenarios.filter((s) => s.enemyArmies !== null).length,
  multiStepOrders: scenarios.reduce((a, s) => a + s.expected.orders.filter((o) => o.step).length, 0),
};
const doc = {
  meta: {
    zrodlo: 'gra/src/game/warAllInCapital.ts @ dc8a3adc (planWarAllInCapital, tryb W1/W2; zywe wywolanie CommonJS z tsc)',
    generator: 'dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-NOWE-D-Q1/evidence/gen-vectors-w12.js',
    seeds: SEEDS,
    stats,
  },
  scenarios,
};
fs.writeFileSync(OUT, JSON.stringify(doc));
console.log(JSON.stringify(stats));
