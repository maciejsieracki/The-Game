// R-RUSTPORT-P6-WIRE-WAR-MARCH-PLAN-Q1 (W5, runda 3): generator wektorow z URUCHOMIONEGO weba.
//
// Przepis:
//   git archive origin/main gra/src gra/data | tar -x -C $D        # $D poza repo
//   node gen-w5-march-vectors.mjs $D/gra/src <katalog-esbuild> rust-port/engine/tests/p6_wire_war_march_vectors.json
// <katalog-esbuild> = pakiet esbuild (np. gra/node_modules/esbuild albo ~/.npm/_npx/*/node_modules/esbuild).
//
// Wola PRAWDZIWE `planHomeWar` (ai-war-home-defense.ts) i `planForcedWarWave` (forced-war-waves.ts) z
// origin/main (cffe39cb9), bundlowane esbuildem (bez patchy logiki). Kolejnosc i wykluczenia dokladnie jak
// w rdzeniu W5 (zalozenia Z3, Z5): pamiec histerezy swieza (resetHomeWarMemory + currentTurn = tura),
// fala dostaje jednostki wlasciciela bez `locked` i bez jednostek z rozkazow obrony domu.
// Determinizm: PRNG mulberry32, seed 5005.
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const [srcDir, esbuildDir, outPath] = process.argv.slice(2);
if (!srcDir || !esbuildDir || !outPath) {
  console.error('uzycie: node gen-w5-march-vectors.mjs <gra/src> <esbuild-dir> <out.json>');
  process.exit(2);
}
const esbuild = createRequire(import.meta.url)(esbuildDir);
const tmp = mkdtempSync(join(tmpdir(), 'w5march-'));
const entry = join(tmp, 'entry.ts');
const bundle = join(tmp, 'bundle.mjs');
writeFileSync(entry, `
export { planHomeWar, resetHomeWarMemory } from '${join(srcDir, 'game', 'ai-war-home-defense.ts')}';
export { planForcedWarWave, hexDistanceForForcedWar, approachSectorForHex } from '${join(srcDir, 'game', 'forced-war-waves.ts')}';
export { hexDistance, isCivilianUnit } from '${join(srcDir, 'units', 'setup.ts')}';
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', target: 'node22', outfile: bundle, logLevel: 'silent',
  loader: { '.json': 'json' },
});
const web = await import(pathToFileURL(bundle).href);

let seed = 5005;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[ri(0, arr.length - 1)];
const chance = (p) => rnd() < p;
const ME = 0;
const ENEMIES = [1, 2, 3];
const R = 6;
const hex = () => [ri(-R, R), ri(-R, R)];

const CATS = [['miecznik', 'Wojownik'], ['lucznik', 'Lucznik'], ['galera', 'Galera'], ['zwiadowca', 'Zwiadowca'], ['osadnik', 'Osadnik']];
function makeUnit(id, ownerId, nearQ, nearR) {
  let [q, r] = hex();
  if (nearQ !== undefined && chance(0.7)) { q = nearQ + ri(-2, 2); r = nearR + ri(-2, 2); }
  const [category, typeId] = chance(0.85) ? CATS[chance(0.8) ? 0 : 1] : pick(CATS);
  const civilian = web.isCivilianUnit({ category, typeId });
  const u = {
    id, ownerId, q, r, category, typeId,
    isField: !civilian,
    isCivilian: civilian,
    embarked: chance(0.05),
    inGarnizon: chance(0.07),
    seaRaider: chance(0.04),
    ruchLeft: chance(0.12) ? 0 : ri(1, 3),
    strength: chance(0.05) ? 0 : ri(1, 12),
  };
  if (chance(0.1)) u.oblegaCityId = pick(['c-me-0', 'c-en-0', 'c-en-1']);
  return u;
}
function makeCity(id, ownerId) {
  const [q, r] = hex();
  const c = { id, q, r, ownerId };
  const k = ri(0, 5);
  if (k === 0) c.foundedBy = pick([ME, ...ENEMIES]);
  else if (k === 1) c.capturedFromOwnerId = pick([ME, ...ENEMIES]);
  return c;
}
const hx = (q, r) => ({ q, r });

function makeScenario(sIdx) {
  const units = [];
  const nMine = ri(0, 9);
  const [cq, cr] = hex();
  for (let i = 0; i < nMine; i++) units.push(makeUnit(`m${String(i).padStart(2, '0')}`, ME, cq, cr));
  const nEn = ri(0, 8);
  for (let i = 0; i < nEn; i++) units.push(makeUnit(`e${String(i).padStart(2, '0')}`, pick(ENEMIES)));
  const cities = [];
  const nMyC = ri(0, 2);
  for (let i = 0; i < nMyC; i++) cities.push(makeCity(`c-me-${i}`, ME));
  const nEnC = ri(1, 4);
  for (let i = 0; i < nEnC; i++) cities.push(makeCity(`c-en-${i}`, pick(ENEMIES)));
  const engage = ENEMIES.filter(() => chance(0.75));
  const turn = ri(5, 120);
  const ownTerritory = [];
  for (let q = -R; q <= R; q++) for (let r = -R; r <= R; r++) if (chance(0.3)) ownTerritory.push([q, r]);
  const locked = units.filter((u) => u.ownerId === ME && chance(0.08)).map((u) => u.id);
  const activeWaves = [];
  const history = [];
  if (chance(0.4)) {
    const tgt = pick(cities);
    const o = hex();
    activeWaves.push({
      id: 'wave-1', targetCityId: tgt.id, unitIds: ['x1', 'x2', 'x3'],
      originHex: hx(...o), rallyPoint: hx(...o), approachSector: web.approachSectorForHex(tgt, hx(...o)), createdTurn: ri(1, 4),
    });
  }
  if (chance(0.4)) {
    const tgt = pick(cities);
    const o = hex();
    history.push({
      targetCityId: tgt.id, originHex: hx(...o), rallyPoint: hx(...o),
      approachSector: web.approachSectorForHex(tgt, hx(...o)), createdTurn: ri(1, 4),
    });
  }
  return { sIdx, input: { ownerId: ME, turn, units, cities, engage, ownTerritory, locked, activeWaves, history } };
}

function run(input) {
  const { units, cities, engage, ownTerritory, locked, turn } = input;
  const ownSet = new Set(ownTerritory.map(([q, r]) => `${q},${r}`));
  const eng = new Set(engage);
  const lockedSet = new Set(locked);
  const my = units.filter((u) => u.ownerId === ME);
  const enemy = units.filter((u) => eng.has(u.ownerId));
  web.resetHomeWarMemory(); // Z3: swieza histereza
  const home = web.planHomeWar({
    ownerId: ME, currentTurn: turn, allUnits: units, myUnits: my,
    myCities: cities.filter((c) => c.ownerId === ME), allCities: cities, enemyUnits: enemy,
    canEngageOwner: (o) => eng.has(o), hasContactWith: undefined, lockedUnitIds: lockedSet,
    isOwnTerritory: (q, r) => ownSet.has(`${q},${r}`), isRelevantSiege: undefined,
    strengthOf: (u) => u.strength, isFieldUnit: (u) => u.isField,
    distance: (aq, ar, bq, br) => web.hexDistance(aq, ar, bq, br),
  });
  const excluded = new Set(lockedSet);
  for (const o of home.orders) excluded.add(o.unitId);
  const waveUnits = my.filter((u) => !excluded.has(u.id));
  const targets = cities.filter((c) => eng.has(c.ownerId));
  const wave = web.planForcedWarWave(
    waveUnits, targets, input.activeWaves, excluded, web.hexDistanceForForcedWar, turn, input.history,
  );
  return { homeOrders: home.orders, wave };
}

const N = Number(process.env.W5_SCENARIOS ?? 220);
const scenarios = [];
const cov = { homeOrders: 0, attack: 0, approach: 0, hold: 0, waves: 0, waveWithActive: 0, waveWithHistory: 0, homeAndWave: 0 };
for (let i = 0; i < N; i++) {
  const sc = makeScenario(i);
  sc.expected = run(sc.input);
  const e = sc.expected;
  cov.homeOrders += e.homeOrders.length;
  for (const o of e.homeOrders) cov[o.kind]++;
  if (e.wave) {
    cov.waves++;
    if (sc.input.activeWaves.length) cov.waveWithActive++;
    if (sc.input.history.length) cov.waveWithHistory++;
    if (e.homeOrders.length) cov.homeAndWave++;
  }
  scenarios.push(sc);
}
writeFileSync(outPath, JSON.stringify({ source: 'origin/main (cffe39cb9) ai-war-home-defense.ts + forced-war-waves.ts, node ' + process.version, scenarios, coverage: cov }));
console.log(JSON.stringify({ scenarios: scenarios.length, coverage: cov }));
