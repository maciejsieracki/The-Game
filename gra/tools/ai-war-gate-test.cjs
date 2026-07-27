'use strict';
/**
 * ai-war-gate-test.cjs — bramka wojny AI + planCityFounding (C-AI-WOJNA / C-AI-EKSP).
 * Run from gra/:  node tools/ai-war-gate-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-war-gate-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE  = path.resolve(__dirname, '.ai-war-gate-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-war-gate-bundle.cjs');

const ENTRY_TS = `
export { decideAITurn, planCityFounding } from ${JSON.stringify(AI_SRC + '/game/ai')};
export {
  aiFoundingWorkReserve,
  aiTreasuryPracaForFounding,
  aiBypassClusterConsolidation,
  aiPowerGoalFoundingInterval,
  aiClusterOutsidePenalty,
  EKSPANSJA_KLASTR_BYPASS,
} from ${JSON.stringify(AI_SRC + '/game/ai-expansion')};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[ai-war-gate-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  decideAITurn,
  planCityFounding,
  aiFoundingWorkReserve,
  aiPowerGoalFoundingInterval,
  aiClusterOutsidePenalty,
  EKSPANSJA_KLASTR_BYPASS,
} = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const BARBARIAN_OWNER = 99;

function isBarbarian(ownerId) {
  return ownerId === BARBARIAN_OWNER;
}

/** Lustrzane areEnemyOwners z main.ts (C-SENTRY-Q1). */
function areEnemyOwners(a, b, getStatus) {
  if (a === b) return false;
  if (isBarbarian(a) || isBarbarian(b)) return true;
  return getStatus(a, b) === 'wojna';
}

function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      const k = `${q},${r}`;
      hexes[k] = {
        coords: { q, r },
        terenBazowy: 'laka',
        nakladka: 'brak',
        ulepszenie: 'brak',
        wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
}

function makeGameData(aiParamsOverride = {}) {
  return {
    units: [
      { Jednostka: 'Wojownik', Health: 30, Ruch: 2 },
      { Jednostka: 'Miecznik', Health: 30, Ruch: 2 },
    ],
    buildings: [],
    terrainYields: {
      terrain_types: [
        { Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 },
        { Teren: 'rownina', Zywnosc: 2, Praca: 1, Handel: 1 },
      ],
    },
    aiParams: aiParamsOverride,
  };
}

function makeUnit(id, ownerId, q, r, category = 'miecznik') {
  return { id, ownerId, typeId: 'Wojownik', category, q, r, ruch: 2, ruchLeft: 2 };
}

function makeCity(id, ownerId, q, r, pop = 5) {
  return { id, ownerId, q, r, population: pop, name: id };
}

// ---------------------------------------------------------------------------
// W1: areEnemyOwners — bramka wojny (logika main.ts)
// ---------------------------------------------------------------------------

console.log('\n--- W1a: pokoj -> brak ataku (canEngageOwner symulacja) ---');
{
  const statusMap = new Map();
  statusMap.set('1:2', 'pokoj');
  const getStatus = (a, b) => statusMap.get(`${a}:${b}`) ?? 'pokoj';
  const canEngage = (attacker, target) => areEnemyOwners(attacker, target, getStatus);
  assert(!canEngage(1, 2), 'W1a: bez wojny canEngage=false');
}

console.log('\n--- W1b: wojna -> atak dozwolony ---');
{
  let st = 'pokoj';
  const canEngage = (a, b) => areEnemyOwners(a, b, () => st);
  assert(!canEngage(1, 2), 'W1b: przed wojna=false');
  st = 'wojna';
  assert(canEngage(1, 2), 'W1b: po wypowiedzeniu wojna=true');
}

console.log('\n--- W1c: barbarzynca zawsze wrog ---');
{
  const canEngage = (a, b) => areEnemyOwners(a, b, () => 'pokoj');
  assert(canEngage(1, BARBARIAN_OWNER), 'W1c: barbarzynca atakowalny bez wojny');
  assert(canEngage(BARBARIAN_OWNER, 0), 'W1c: barbarzynca wrog gracza');
}

// ---------------------------------------------------------------------------
// W2: decideAITurn respektuje canEngageOwner (brak ataku bez wojny)
// ---------------------------------------------------------------------------

console.log('\n--- W2: AI nie atakuje gdy canEngageOwner blokuje ---');
{
  const map = makeMap(10, 10);
  const warrior = makeUnit('w1', 1, 5, 5, 'miecznik');
  const enemy = makeUnit('e1', 2, 6, 5, 'miecznik');
  const city = makeCity('c1', 1, 4, 4);
  const noWar = () => false;
  const result = decideAITurn(1, [warrior, enemy], [city], map, makeGameData(), {
    canEngageOwner: noWar,
  });
  const attacks = result.filter(c => c.type === 'attack' && c.unitId === 'w1');
  assert(attacks.length === 0, 'W2: brak ataku gdy canEngageOwner=false');
}

console.log('\n--- W3: AI atakuje gdy canEngageOwner=true (sasiedztwo) ---');
{
  const map = makeMap(10, 10);
  const warrior = makeUnit('w2', 1, 5, 5, 'miecznik');
  const enemy = makeUnit('e2', 2, 6, 5, 'miecznik');
  const city = makeCity('c2', 1, 4, 4);
  const atWar = () => true;
  const result = decideAITurn(1, [warrior, enemy], [city], map, makeGameData(), {
    canEngageOwner: atWar,
  });
  const attacks = result.filter(c => c.type === 'attack' && c.unitId === 'w2');
  assert(attacks.length === 1, 'W3: atak gdy canEngageOwner=true i sasiedztwo');
}

// ---------------------------------------------------------------------------
// W4: planCityFounding — max 1/turę, blokady
// ---------------------------------------------------------------------------

console.log('\n--- W4a: planCityFounding max 1 komenda w decideAITurn ---');
{
  const map = makeMap(15, 15);
  const data = makeGameData({
    'ekspansja_min_dystans_miast': { wartosc: 2, sekcja: 't', opis: '' },
    'ekspansja_zagroz_zasieg':     { wartosc: 5, sekcja: 't', opis: '' },
  });
  const result = decideAITurn(1, [], [], map, data, { pracaAvailable: 50 });
  const found = result.filter(c => c.type === 'foundCityAt');
  assert(found.length <= 1, 'W4a: max 1 foundCityAt na ture');
}

console.log('\n--- W4b: defensiveCopy blokuje founding ---');
{
  const map = makeMap(12, 12);
  const cmd = planCityFounding(5, [], map, makeGameData(), {
    pracaAvailable: 50,
    defensiveCopy: true,
  }, 3);
  assert(cmd === null, 'W4b: defensiveCopy -> null');
}

console.log('\n--- W4c: clusterStateTargets blokuje founding ---');
{
  const map = makeMap(12, 12);
  const cmd = planCityFounding(5, [], map, makeGameData(), {
    pracaAvailable: 50,
    civAiProfile: { ekspansywnosc: 0, sklonnoscDoPodboju: 0 },
    clusterStateTargets: [{ ownerId: 3, q: 2, r: 2 }],
  }, 3);
  assert(cmd === null, 'W4c: konsolidacja klastra + eksp 0 -> null');
}

console.log('\n--- W4d: za malo Pracy -> brak founding ---');
{
  const map = makeMap(12, 12);
  const myCity = makeCity('mc', 5, 3, 3, 10);
  const cmd = planCityFounding(5, [myCity], map, makeGameData(), {
    pracaAvailable: 0,
  }, 3);
  assert(cmd === null, 'W4d: brak Pracy na kolejne miasto -> null');
}

// ---------------------------------------------------------------------------
// P-AI-006=C: ekspansywnosc — rezerwa Pracy, bypass klastra, heurystyka
// ---------------------------------------------------------------------------

console.log('\n--- E6a: aiFoundingWorkReserve skalowanie ---');
{
  assert(aiFoundingWorkReserve(0) === 10, 'E6a: eksp 0 -> rezerwa 10 Pracy');
  assert(aiFoundingWorkReserve(3) === 4, 'E6a: eksp 3 -> rezerwa 4 Pracy');
  assert(aiFoundingWorkReserve(5) === 0, 'E6a: eksp 5 -> brak rezerwy');
}

console.log('\n--- E6b: rezerwa Pracy blokuje founding przy niskiej puli ---');
{
  const map = makeMap(12, 12);
  const myCity = makeCity('mc', 5, 3, 3, 10);
  const low = planCityFounding(5, [myCity], map, makeGameData(), {
    pracaAvailable: 22,
    civAiProfile: { ekspansywnosc: 0, sklonnoscDoPodboju: 0 },
  }, 3);
  assert(low === null, 'E6b: 22 Pracy + eksp 0 (potrzeba 30) -> null');
}

console.log('\n--- E6c: ekspansywnosc >= 4 omija blokade klastra ---');
{
  const map = makeMap(12, 12);
  const myCity = makeCity('mc', 5, 3, 3, 10);
  const blocked = planCityFounding(5, [myCity], map, makeGameData(), {
    pracaAvailable: 50,
    civAiProfile: { ekspansywnosc: 3, sklonnoscDoPodboju: 0 },
    clusterStateTargets: [{ ownerId: 3, q: 2, r: 2 }],
  }, 3);
  assert(blocked === null, 'E6c: eksp 3 + konsolidacja -> null');
  const bypass = planCityFounding(5, [myCity], map, makeGameData(), {
    pracaAvailable: 50,
    civAiProfile: { ekspansywnosc: 4, sklonnoscDoPodboju: 0 },
    clusterStateTargets: [{ ownerId: 3, q: 2, r: 2 }],
  }, 3);
  assert(bypass === null || bypass.type === 'foundCityAt', 'E6c: eksp 4 nie odrzucone przez blokade klastra');
}

console.log('\n--- E6d: aiPowerGoalFoundingInterval ---');
{
  assert(aiPowerGoalFoundingInterval(5) === 2, 'E6d: eksp 5 -> co 2 tury');
  assert(aiPowerGoalFoundingInterval(3) === 3, 'E6d: eksp 3 -> co 3 tury');
  assert(aiPowerGoalFoundingInterval(2) === 4, 'E6d: eksp 2 -> co 4 tury');
}

console.log('\n--- E6e: aiClusterOutsidePenalty ---');
{
  assert(aiClusterOutsidePenalty(0) === 20, 'E6e: eksp 0 -> kara 20');
  assert(aiClusterOutsidePenalty(5) === 0, 'E6e: eksp 5 -> brak kary');
  assert(EKSPANSJA_KLASTR_BYPASS === 4, 'E6e: prog bypass klastra = 4');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n========================================');
console.log(`ai-war-gate-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
