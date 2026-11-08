// P6-REPIN-AI-PRIORYTETY-CEL-Q1 (FALA 551 AIDRA): generator wektorow `planHomeWar` z URUCHOMIONEGO weba.
//
// Uzycie (Node 22.13+):
//   node p6_repin_ai_home_gen.mjs <katalog-zrodel-web> <wyjscie.json>
// gdzie <katalog-zrodel-web> zawiera `ai-war-home-defense.ts` i `cities.ts` z `origin/main`
// (np. `git archive origin/main gra/src | tar -x -C <katalog-POZA-repo>`, potem katalog `gra/src/game`).
//
// Jedyny patch: import `cityFounderId`/`isCityLostOf` z './cities' zastapiony dokladna kopia
// tych dwoch funkcji (cities.ts:1120-1140), bo caly modul cities.ts nie laduje sie w Node.
// Scenariusze: deterministyczny PRNG (mulberry32, seed 551), wiele tur z ta sama pamiecia histerezy.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stripTypeScriptTypes } from 'node:module';
import { pathToFileURL } from 'node:url';

const [srcDir, outPath] = process.argv.slice(2);
if (!srcDir || !outPath) {
  console.error('uzycie: node p6_repin_ai_home_gen.mjs <katalog-game> <wyjscie.json>');
  process.exit(2);
}

const CITIES_HELPERS = `
export function cityFounderId(city) {
  if (city.foundedBy !== undefined) return city.foundedBy;
  return city.foundedByOwner === false ? undefined : city.ownerId;
}
export function isCityLostOf(city, ownerId) {
  if (city.ownerId === ownerId) return false;
  if (city.foundedBy !== undefined) return city.foundedBy === ownerId;
  return city.capturedFromOwnerId === ownerId;
}
`;

const tsSrc = readFileSync(join(srcDir, 'ai-war-home-defense.ts'), 'utf8');
const importLine = "import { cityFounderId, isCityLostOf } from './cities';";
if (!tsSrc.includes(importLine)) {
  console.error('brak oczekiwanego importu z ./cities w ai-war-home-defense.ts');
  process.exit(3);
}
const patched = tsSrc.replace(importLine, '');
const jsSrc = stripTypeScriptTypes(patched) + '\n' + CITIES_HELPERS;
const tmp = mkdtempSync(join(tmpdir(), 'p6home-'));
const modPath = join(tmp, 'ai-war-home-defense.mjs');
writeFileSync(modPath, jsSrc);
const web = await import(pathToFileURL(modPath).href);

// --- PRNG (mulberry32) ---
let seed = 551;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[ri(0, arr.length - 1)];
const chance = (p) => rnd() < p;

const dist = (aq, ar, bq, br) => {
  const dq = Math.abs(aq - bq);
  const dr = Math.abs(ar - br);
  const ds = Math.abs((-aq - ar) - (-bq - br));
  return Math.max(dq, dr, ds);
};

const OWNERS_ENEMY = [1, 2, 3];
const ME = 0;
const R = 4;

function randHex() { return [ri(-R, R), ri(-R, R)]; }

function makeUnit(id, ownerId) {
  const [q, r] = randHex();
  const u = {
    id, ownerId, q, r,
    isField: chance(0.8),
    embarked: chance(0.08),
    ruchLeft: chance(0.2) ? 0 : ri(1, 3),
    strength: chance(0.05) ? 0 : ri(1, 12),
  };
  if (chance(0.15)) u.oblegaCityId = pick(['c-me-0', 'c-me-1', 'c-en-0', 'c-en-1', 'c-en-2']);
  return u;
}

function makeCity(id, ownerId) {
  const [q, r] = randHex();
  const c = { id, q, r, ownerId };
  const k = ri(0, 5);
  if (k === 0) c.foundedBy = pick([ME, ...OWNERS_ENEMY]);
  else if (k === 1) c.capturedFromOwnerId = pick([ME, ...OWNERS_ENEMY]);
  else if (k === 2) c.foundedByOwner = false;
  else if (k === 3) { c.foundedBy = ME; c.capturedFromOwnerId = pick(OWNERS_ENEMY); }
  return c;
}

function makeScenario(sIdx) {
  const nUnits = ri(5, 16);
  const units = [];
  for (let i = 0; i < nUnits; i++) units.push(makeUnit(`u${String(i).padStart(2, '0')}`, pick([ME, ME, ...OWNERS_ENEMY])));
  const nCities = ri(2, 7);
  const cities = [];
  for (let i = 0; i < nCities; i++) {
    const own = chance(0.5) ? ME : pick(OWNERS_ENEMY);
    cities.push(makeCity(`c-${own === ME ? 'me' : 'en'}-${i}`, own));
  }
  const engage = OWNERS_ENEMY.filter(() => chance(0.7));
  const contact = chance(0.5) ? OWNERS_ENEMY.filter(() => chance(0.7)) : null;
  const relevantSieges = chance(0.4) ? ['c-me-0', 'c-me-1', 'c-en-0'].filter(() => chance(0.6)) : null;
  const steps = [];
  let turn = ri(5, 20);
  const nSteps = chance(0.3) ? ri(12, 16) : ri(1, 4);
  for (let s = 0; s < nSteps; s++) {
    // przesuniecia i zmiany miedzy turami (ta sama pamiec)
    if (s > 0) {
      for (const u of units) {
        if (chance(0.4)) { const [q, r] = randHex(); u.q = q; u.r = r; }
        if (chance(0.3)) u.ruchLeft = ri(0, 3);
        if (chance(0.2)) u.strength = ri(0, 12);
      }
      turn += chance(0.1) ? -ri(1, 3) : ri(1, 4);
    }
    const locked = units.filter(() => chance(0.1)).map((u) => u.id);
    const ownTerritory = [];
    for (let q = -R; q <= R; q++) for (let r = -R; r <= R; r++) if (chance(0.45)) ownTerritory.push([q, r]);
    const ownSet = new Set(ownTerritory.map(([q, r]) => `${q},${r}`));
    const input = {
      ownerId: ME,
      currentTurn: chance(0.08) ? null : turn,
      units: units.map((u) => ({ ...u })),
      cities: cities.map((c) => ({ ...c })),
      engage,
      contact,
      relevantSieges,
      locked,
      ownTerritory,
    };
    steps.push({ input, expected: null, ownSet: [...ownSet].length });
  }
  return { sIdx, steps };
}

function runStep(input) {
  const units = input.units;
  const my = units.filter((u) => u.ownerId === ME);
  const enemy = units.filter((u) => u.ownerId !== ME);
  const cities = input.cities;
  const myCities = cities.filter((c) => c.ownerId === ME);
  const ownSet = new Set(input.ownTerritory.map(([q, r]) => `${q},${r}`));
  const engage = new Set(input.engage);
  const contact = input.contact === null ? null : new Set(input.contact);
  const relevant = input.relevantSieges === null ? null : new Set(input.relevantSieges);
  const locked = new Set(input.locked);
  const hwInput = {
    ownerId: ME,
    currentTurn: input.currentTurn === null ? undefined : input.currentTurn,
    allUnits: units,
    myUnits: my,
    myCities,
    allCities: cities,
    enemyUnits: enemy,
    canEngageOwner: (o) => engage.has(o),
    hasContactWith: contact === null ? undefined : (o) => contact.has(o),
    lockedUnitIds: locked,
    isOwnTerritory: (q, r) => ownSet.has(`${q},${r}`),
    isRelevantSiege: relevant === null ? undefined : (cid) => relevant.has(cid),
    strengthOf: (u) => u.strength,
    isFieldUnit: (u) => u.isField,
    distance: dist,
  };
  return web.planHomeWar(hwInput);
}

const N = Number(process.env.P6_HOME_SCENARIOS ?? 90);
const scenarios = [];
for (let i = 0; i < N; i++) {
  const sc = makeScenario(i);
  web.resetHomeWarMemory();
  for (const st of sc.steps) {
    st.expected = runStep(st.input);
    delete st.ownSet;
  }
  scenarios.push(sc);
}

// Statystyki pokrycia (zeby wiedziec, ze wektory cos testuja).
const cov = { attack: 0, hold: 0, released: 0, p1Go: 0, p1Wait: 0, p1Null: 0, small: 0, orders: 0 };
for (const sc of scenarios) for (const st of sc.steps) {
  const e = st.expected;
  cov.orders += e.orders.length;
  for (const c of e.clusters) { cov[c.mode] = (cov[c.mode] ?? 0) + 1; if (c.small) cov.small++; }
  if (e.recapture === null) cov.p1Null++;
  else if (e.recapture.mode === 'go') cov.p1Go++; else cov.p1Wait++;
}

const out = { source: 'origin/main ai-war-home-defense.ts (pin 14f2af1b0), node ' + process.version, scenarios, coverage: cov };
writeFileSync(outPath, JSON.stringify(out));
console.log(JSON.stringify({ scenarios: scenarios.length, steps: scenarios.reduce((a, s) => a + s.steps.length, 0), coverage: cov }));
