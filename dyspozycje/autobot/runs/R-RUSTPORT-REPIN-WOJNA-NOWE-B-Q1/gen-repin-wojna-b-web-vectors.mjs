// Generator wektorow REPIN-WOJNA-NOWE-B (r1) z URUCHOMIONEGO kodu weba (pin 91dc998a):
//   gra/src/game/army-consolidation.ts, gra/src/game/ai-general-war-campaign.ts
//   (+ zaleznosci: gra/src/units/setup.ts (hexDistance, keyOf, hexNeighborCoords, terrainMoveCost),
//    gra/src/types/hex.ts (TerenBazowy), gra/data/army-consolidation-params.json).
//
// Kod TS NIE jest zmieniany. Uruchamiany jest przez loader `hooks.mjs` (rozwiazywanie importow
// bez rozszerzenia, transpilacja .ts przez `typescript`, atrybut JSON importu). Loader lezy poza
// repo (katalog scratch): /tmp/claude-0/repin-wb/{hooks,register}.mjs.
//
// Uruchomienie (WEB_ROOT = katalog z gra/ po `git archive 91dc998a gra/src gra/data`, poza repo):
//   node --import <SCRATCH>/register.mjs ./gen-repin-wojna-b-web-vectors.mjs <WEB_ROOT> <OUT_DIR>
//
// Koszty ruchu (terrainMoveCost) zapisywane jako TEKST (String(x); "Infinity"), jak w R-WEB-A.
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [webRoot, outDir] = process.argv.slice(2);
if (!webRoot || !outDir) throw new Error('uzycie: <WEB_ROOT> <OUT_DIR>');
mkdirSync(outDir, { recursive: true });

const PIN = '91dc998a5f1b51ad29e0f4785edfd45655445c53';
const SOURCES = [
  'gra/src/game/army-consolidation.ts',
  'gra/src/game/ai-general-war-campaign.ts',
  'gra/src/units/setup.ts',
  'gra/src/types/hex.ts',
  'gra/data/army-consolidation-params.json',
];
const sha = (f) => createHash('sha256').update(readFileSync(join(webRoot, f))).digest('hex');
const meta = {
  pin: PIN,
  generator: 'gen-repin-wojna-b-web-vectors.mjs (r1)',
  node: process.version,
  sourceSha256: Object.fromEntries(SOURCES.map((f) => [f, sha(f)])),
};

// Wartosci specjalne (Infinity, NaN, -0) jako tekst; reszta liczb zostaje JSON-liczbami.
const t = (x) => (x === null || x === undefined ? null : Object.is(x, -0) ? '-0' : String(x));

// Deterministyczny PRNG generatora (xorshift32) - NIE jest czescia testowanego kodu.
let rs = 0x9e3779b9;
const rnd = () => {
  rs ^= rs << 13; rs >>>= 0;
  rs ^= rs >>> 17;
  rs ^= rs << 5; rs >>>= 0;
  return rs / 4294967296;
};
const rndInt = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1)); // inclusive
const pick = (a) => a[Math.floor(rnd() * a.length)];
const shuffle = (a) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

const url = (f) => pathToFileURL(join(webRoot, f)).href;
const consol = await import(url('gra/src/game/army-consolidation.ts'));
const camp = await import(url('gra/src/game/ai-general-war-campaign.ts'));
const setup = await import(url('gra/src/units/setup.ts'));
const hexMod = await import(url('gra/src/types/hex.ts'));
const { TerenBazowy } = hexMod;
const { hexDistance, keyOf, terrainMoveCost } = setup;

const TERRAINS = Object.values(TerenBazowy); // wszystkie wartosci enumu (w tym wodne = Infinity)

// ---------- 1. army-consolidation.ts ----------
const flagCases = [];
for (const ov of [null, true, false]) {
  consol.setArmyConsolidationOverride(ov);
  flagCases.push({ override: ov, enabled: consol.isArmyConsolidationEnabled() });
}
consol.setArmyConsolidationOverride(null);
const constants = {
  enabledDefault: consol.ARMY_CONSOLIDATION_ENABLED,
  maxPerHex: t(consol.ARMY_CONSOLIDATION_MAX_PER_HEX),
  homeGroupSize: t(consol.ARMY_CONSOLIDATION_HOME_GROUP_SIZE),
  rallySearchHex: t(consol.ARMY_CONSOLIDATION_RALLY_SEARCH_HEX),
};

const cityId = (i) => `c${i}`;
const pickCases = [];
for (let i = 0; i < 600; i++) {
  const n = rndInt(0, 5);
  const cities = [];
  const used = new Set();
  for (let k = 0; k < n; k++) {
    let id;
    do { id = cityId(rndInt(1, 9)); } while (used.has(id));
    used.add(id);
    cities.push({ id, q: rndInt(-6, 6), r: rndInt(-6, 6) });
  }
  const r = rnd();
  const capital = r < 0.15 ? null : r < 0.3 ? 'missing' : pick(cities.length ? cities : [{ id: 'none' }]).id;
  const res = consol.pickRallyCity(cities, capital === 'missing' ? 'zz' : capital);
  pickCases.push({
    cities,
    capital: capital === 'missing' ? 'zz' : capital,
    out: res === undefined ? null : res.id,
  });
}

const candCases = [];
for (let i = 0; i < 600; i++) {
  const n = rndInt(0, 6);
  const cities = [];
  const used = new Set();
  for (let k = 0; k < n; k++) {
    let id;
    do { id = cityId(rndInt(1, 12)); } while (used.has(id));
    used.add(id);
    cities.push({ id, q: rndInt(-8, 8), r: rndInt(-8, 8) });
  }
  const rally = cities.length && rnd() < 0.8
    ? pick(cities)
    : { id: 'cx', q: rndInt(-8, 8), r: rndInt(-8, 8) };
  const radius = rnd() < 0.3 ? undefined : rndInt(0, 14);
  const out = radius === undefined
    ? consol.buildRallyCandidates(cities, rally)
    : consol.buildRallyCandidates(cities, rally, radius);
  candCases.push({ cities, rally, radius: radius === undefined ? null : radius, out });
}

const assignCases = [];
for (let i = 0; i < 700; i++) {
  const nu = rndInt(0, 12);
  const idNums = shuffle(Array.from({ length: nu + 4 }, (_, k) => k + 1)).slice(0, nu);
  const units = idNums.map((k) => ({ id: `u${k}`, q: rndInt(-3, 3), r: rndInt(-3, 3), ruchLeft: rndInt(0, 3) }));
  const nc = rndInt(0, 6);
  const candidates = [];
  for (let k = 0; k < nc; k++) candidates.push({ q: rndInt(-3, 3), r: rndInt(-3, 3) });
  const maxPerHex = rndInt(1, 4);
  const occMap = new Map();
  const occN = rndInt(0, 6);
  for (let k = 0; k < occN; k++) {
    const pool = candidates.length && rnd() < 0.6 ? pick(candidates) : { q: rndInt(-3, 3), r: rndInt(-3, 3) };
    occMap.set(keyOf(pool.q, pool.r), rndInt(0, 5));
  }
  const occupancy = [...occMap.entries()].map(([k, n]) => {
    const [q, r] = k.split(',').map(Number);
    return { q, r, n };
  });
  const out = consol.assignRallyTargets(units, candidates, maxPerHex, occMap);
  assignCases.push({ units, candidates, maxPerHex, occupancy, out });
}

const warCases = [];
for (let i = 0; i < 300; i++) {
  const n = rndInt(0, 7);
  const ids = Array.from({ length: n }, () => rndInt(1, 4));
  warCases.push({ enemyOwnerIds: ids, out: consol.warArmyCount(ids) });
}

const splitCases = [];
for (let i = 0; i < 700; i++) {
  const n = rndInt(0, 9);
  const idNums = shuffle(Array.from({ length: n + 3 }, (_, k) => k + 1)).slice(0, n);
  const units = idNums.map((k) => ({ id: `s${k}`, strength: pick([0, 1, 2, 3, 5, 8, 13, 2.5, 7.5]) }));
  const armyCount = pick([-2, 0, 1, 1, 2, 2, 3, 4, 5, 7]);
  const out = consol.splitIntoWarArmies(units, armyCount, (u) => u.strength);
  splitCases.push({ units, armyCount, out: out.map((g) => g.map((u) => u.id)) });
}

const consolidationVectors = {
  ...meta,
  constants,
  flagCases,
  pickCases,
  candCases,
  assignCases,
  warCases,
  splitCases,
};

// ---------- 2. ai-general-war-campaign.ts ----------
const reachCases = [];
for (let i = 0; i < 400; i++) {
  const hexes = {};
  for (let q = -4; q <= 4; q++) for (let r = -4; r <= 4; r++) {
    if (rnd() < 0.15) continue; // brak heksu w mapie
    hexes[keyOf(q, r)] = { terenBazowy: pick(TERRAINS) };
  }
  const blocked = [];
  for (let k = 0; k < rndInt(0, 8); k++) blocked.push(keyOf(rndInt(-4, 4), rndInt(-4, 4)));
  const probe = { id: 'p', q: rndInt(-5, 5), r: rndInt(-5, 5), isGeneral: true };
  const map = { hexes };
  const blockedSet = new Set(blocked);
  const res = camp.findAiWarLandReachability(probe, map, blockedSet);
  const costs = Object.entries(hexes).map(([k, h]) => [k, t(terrainMoveCost(h))]);
  reachCases.push({
    probe: { q: probe.q, r: probe.r },
    costs,
    blocked,
    hexKeys: [...res.hexKeys].sort(),
    visitedHexCount: res.visitedHexCount,
    searchCount: res.searchCount,
    neighbor: null,
  });
}
// Sasiedztwo celu: dla kazdego przypadku losowe cele.
for (const c of reachCases) {
  const probes = [];
  for (let k = 0; k < 4; k++) {
    const target = { q: rndInt(-5, 5), r: rndInt(-5, 5) };
    const res = {
      hexKeys: new Set(c.hexKeys),
      visitedHexCount: c.visitedHexCount,
      searchCount: 1,
    };
    probes.push({ target, out: camp.aiWarTargetHasReachableLandNeighbor(res, target) });
  }
  c.neighbor = probes;
}

const chooseCases = [];
for (let i = 0; i < 700; i++) {
  const nc = rndInt(0, 6);
  const owners = shuffle([0, 1, 2, 3, 4, 5, 6, 7]).slice(0, nc);
  const candidates = owners.map((o) => {
    const c = { ownerId: o, distance: rndInt(0, 9) };
    const rr = rnd();
    if (rr < 0.2) c.reachable = false;
    else if (rr < 0.45) c.reachable = true;
    return c;
  });
  let current;
  if (rnd() < 0.6) {
    current = { targetOwnerId: rndInt(0, 7), stage: pick(['recruiting', 'gathering', 'attacking']), gatherTurnsCompleted: rndInt(0, 4) };
  }
  const out = camp.chooseAiGeneralWarTarget(current, candidates);
  chooseCases.push({ current: current ?? null, candidates, out: out === undefined ? null : out });
}

// Pomocnicza: losowa kampania (pola opcjonalne pomijane, jak w webie: brak klucza = undefined).
const randCampaign = (targetOwnerId) => {
  const stage = pick(['recruiting', 'gathering', 'attacking']);
  const c = { targetOwnerId, stage, gatherTurnsCompleted: rndInt(0, 6) };
  if (rnd() < 0.6) c.generalUnitId = pick(['g1', 'g2', 'g3', '']);
  if (rnd() < 0.3) c.blockedGeneralIds = pick([[], ['g1'], ['g2', 'g3'], ['g1', 'g2']]);
  if (rnd() < 0.5) c.lastGatherTurn = rndInt(0, 30);
  return c;
};
const randGeneral = () => {
  if (rnd() < 0.25) return undefined;
  return { id: pick(['g1', 'g2', 'g3', 'g4']), isGeneral: rnd() < 0.8 };
};

const reconcileCases = [];
for (let i = 0; i < 1500; i++) {
  const target = rnd() < 0.1 ? null : rndInt(0, 4);
  const current = rnd() < 0.3 ? undefined : randCampaign(rndInt(0, 4));
  const general = randGeneral();
  const queued = rnd() < 0.4;
  const hasAlive = rnd() < 0.5;
  const alive = hasAlive ? shuffle(['g1', 'g2', 'g3', 'g4']).slice(0, rndInt(0, 4)) : undefined;
  const out = camp.reconcileAiGeneralWarCampaign(current, target, general, queued, alive);
  reconcileCases.push({
    current: current ?? null,
    target,
    general: general ?? null,
    queued,
    alive: alive ?? null,
    out: out === undefined ? null : out,
  });
}

const recordCases = [];
for (let i = 0; i < 400; i++) {
  const c = randCampaign(rndInt(0, 4));
  if (rnd() < 0.5) c.stage = 'gathering';
  const turn = rndInt(0, 30);
  const out = camp.recordAiGeneralGatherTurn(c, turn);
  recordCases.push({ campaign: c, turn, out });
}

// save / restore
const saveCases = [];
for (let i = 0; i < 300; i++) {
  const n = rndInt(0, 5);
  const owners = shuffle([1, 2, 3, 4, 5, 6]).slice(0, n);
  const entries = owners.map((o) => [o, randCampaign(rndInt(0, 4))]);
  const map = new Map(entries);
  const out = camp.aiGeneralCampaignToSave(map);
  saveCases.push({ entries, out });
}

const garbageValue = () => {
  const pool = [
    1, 2, 3, 0, -1, 1.5, 2.0, 7, 9007199254740991, 9007199254740992, '7', null, true,
    'recruiting', 'gathering', 'attacking', 'bogus', 'g1', 'g2', '', [], ['g1'], [1, 'g1'], {},
  ];
  return pick(pool);
};
const restoreCases = [];
for (let i = 0; i < 500; i++) {
  const entries = [];
  const ne = rndInt(0, 5);
  for (let k = 0; k < ne; k++) {
    const shape = rnd();
    if (shape < 0.1) { entries.push(garbageValue()); continue; }
    if (shape < 0.15) { entries.push([garbageValue()]); continue; }
    const ownerId = rnd() < 0.8 ? rndInt(1, 4) : garbageValue();
    const raw = {};
    if (rnd() < 0.9) raw.targetOwnerId = rnd() < 0.85 ? rndInt(0, 4) : garbageValue();
    if (rnd() < 0.9) raw.stage = rnd() < 0.85 ? pick(['recruiting', 'gathering', 'attacking']) : garbageValue();
    if (rnd() < 0.9) raw.gatherTurnsCompleted = rnd() < 0.85 ? rndInt(0, 6) : garbageValue();
    if (rnd() < 0.5) raw.generalUnitId = rnd() < 0.8 ? pick(['g1', 'g2', '']) : garbageValue();
    if (rnd() < 0.3) raw.blockedGeneralIds = rnd() < 0.8 ? pick([[], ['g1'], ['g1', 'g2']]) : garbageValue();
    if (rnd() < 0.5) raw.lastGatherTurn = rnd() < 0.8 ? rndInt(0, 30) : garbageValue();
    entries.push([ownerId, raw]);
  }
  const value = rnd() < 0.05 ? garbageValue() : entries;
  const out = [...camp.restoreAiGeneralCampaigns(value).entries()];
  restoreCases.push({ value, out });
}

// Przypadki brzegowe odrzucania wejscia (niepoprawny typ calego wejscia).
const edgeRestore = [
  { value: 'nie-tablica', out: [...camp.restoreAiGeneralCampaigns('nie-tablica').entries()] },
  { value: [[0, { targetOwnerId: 1, stage: 'recruiting', gatherTurnsCompleted: 0 }]],
    out: [...camp.restoreAiGeneralCampaigns([[0, { targetOwnerId: 1, stage: 'recruiting', gatherTurnsCompleted: 0 }]]).entries()] },
];

const campaignVectors = {
  ...meta,
  gatherTurns: t(camp.AI_GENERAL_WAR_GATHER_TURNS),
  reachCases,
  chooseCases,
  reconcileCases,
  recordCases,
  saveCases,
  restoreCases,
  edgeRestore,
};

// Liczby w wektorach: zwykle JSON (dokladny round-trip), a wartosci specjalne (Infinity, -0) jako tekst.
const dump = (name, obj) => {
  const text = JSON.stringify(obj, null, 1);
  writeFileSync(join(outDir, name), text + '\n');
  console.log(name, text.length, 'bytes');
};
dump('army-consolidation.json', consolidationVectors);
dump('ai-general-war-campaign.json', campaignVectors);
