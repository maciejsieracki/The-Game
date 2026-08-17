'use strict';
/**
 * P-BARBARZYNCY-USUWANIE-SEMANTYKA-Q1=A
 *
 * Realne ścieżki modułu produkcyjnego:
 * - destroyCampAt() usuwa aktywny spawner, ale nie dotyka jednostek;
 * - spawnCamps() respektuje trwałą blacklistę heksów;
 * - serializeGame()/deserializeGame() zachowują blacklistę w meta;
 * - brak pola w starym save pozostaje bezpiecznym defaultem po stronie main.ts.
 *
 * Uruchomienie z gra/: node tools/barb-camp-blacklist-test.cjs
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.barb-camp-blacklist-entry.ts');
const BUNDLE = path.join(__dirname, '.barb-camp-blacklist-bundle.cjs');
const ENTRY_TS = `
export { FALLBACK_BARB_PARAMS, BARBARIAN_OWNER_ID, destroyCampAt, spawnCamps }
  from ${JSON.stringify(path.join(ROOT, 'src/game/barbarians'))};
export { serializeGame, deserializeGame }
  from ${JSON.stringify(path.join(ROOT, 'src/game/save'))};
`;

fs.writeFileSync(ENTRY, ENTRY_TS, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('barb-camp-blacklist-test: bundling failed:', e.message || e);
  process.exit(1);
}

const B = require(BUNDLE);
const { FALLBACK_BARB_PARAMS: P, BARBARIAN_OWNER_ID, destroyCampAt, spawnCamps,
  serializeGame, deserializeGame } = B;

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) passed++;
  else {
    failed++;
    console.error('  FAIL:', message);
  }
}
function eq(actual, expected, message) {
  assert(actual === expected, `${message} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}

function makeMap(width, height) {
  const hexes = {};
  for (let q = 0; q < width; q++) {
    for (let r = 0; r < height; r++) {
      hexes[`${q},${r}`] = {
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
  return { szerokoscQ: width, wysokoscR: height, hexes, seed: 1, riverPaths: [] };
}

const map = makeMap(8, 8);
const params = {
  ...P,
  maxCamps: 1,
  minDistFromCity: 0,
  campSpacing: 0,
};
const seed = 291;
const baseline = spawnCamps(map, [], [], params, seed);
assert(baseline.length === 1, 'baseline: production spawn picks one camp');
const blockedKey = `${baseline[0].q},${baseline[0].r}`;

// 1. Wejście usuwa obóz, a stara jednostka z campId pozostaje bez zmian.
{
  const camps = [{ id: 'camp-A', q: baseline[0].q, r: baseline[0].r, spawnCooldown: 0 }];
  const oldUnit = {
    id: 'barb-A', ownerId: BARBARIAN_OWNER_ID, campId: 'camp-A',
    q: baseline[0].q + 1, r: baseline[0].r, ruch: 2, ruchLeft: 0,
  };
  const beforeUnit = JSON.stringify(oldUnit);
  const result = destroyCampAt(camps, camps[0].q, camps[0].r);
  const cleared = new Set([blockedKey]);
  eq(result.camps.length, 0, '1: entering the camp removes the active spawner');
  eq(JSON.stringify(oldUnit), beforeUnit, '1: existing barbarian unit remains unchanged');
  eq(oldUnit.campId, 'camp-A', '1: campId remains attached to existing barbarian unit');

  // 2. Next turn cannot recreate the same camp; another eligible hex still works.
  const next = spawnCamps(map, result.camps, [], params, seed, cleared);
  assert(next.length === 1, '2: another eligible hex receives a camp');
  assert(`${next[0].q},${next[0].r}` !== blockedKey,
    '2: the cleared hex is excluded from the next random spawn');
  assert(next[0].q !== camps[0].q || next[0].r !== camps[0].r,
    '2: the exact destroyed camp coordinate is never recreated');

  // Edge cases: adjacent hex is allowed; duplicate blacklist entries are harmless.
  const adjacentQ = camps[0].q > 0 ? camps[0].q - 1 : camps[0].q + 1;
  const adjacentKey = `${adjacentQ},${camps[0].r}`;
  const adjacent = spawnCamps(
    map,
    [],
    [],
    { ...params, maxCamps: Object.keys(map.hexes).length },
    seed,
    new Set([blockedKey, blockedKey]),
  );
  assert(adjacent.every(c => `${c.q},${c.r}` !== blockedKey),
    '2-edge: duplicate blacklist entries still block the cleared hex');
  assert(adjacent.some(c => `${c.q},${c.r}` === adjacentKey),
    '2-edge: blacklist is exact-hex, not a neighbor-radius ban');
}

// 3. Save/load roundtrip and old-save migration contract.
{
  const save = {
    wersja: 2, tura: 4, units: [], cities: [], explored: [],
    meta: { barbCamps: [], clearedBarbCampHexes: [blockedKey] },
  };
  const roundTrip = deserializeGame(serializeGame(save));
  eq(JSON.stringify(roundTrip.meta.clearedBarbCampHexes), JSON.stringify([blockedKey]),
    '3: save/load preserves the cleared-hex blacklist');

  const oldSave = deserializeGame(JSON.stringify({
    wersja: 1, tura: 4, units: [], cities: [], explored: [], meta: { barbCamps: [] },
  }));
  assert(oldSave.meta?.clearedBarbCampHexes === undefined,
    '3: old save without blacklist field loads without inventing blocked hexes');
}

// 4. Production source wiring: destruction records the hex, spawn receives the set,
// and load applies a safe array/string default before reconciliation.
{
  const main = fs.readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
  assert(main.includes('clearedBarbCampHexes.add(keyOf(q, r))'),
    '4: production destruction path records the entered hex');
  assert(main.includes('turn * 31337,\n              clearedBarbCampHexes,'),
    '4: production spawn path receives the per-game blacklist');
  assert(main.includes('clearedBarbCampHexes: Array.from(clearedBarbCampHexes)'),
    '4: production save path serializes the blacklist');
  assert(main.includes('const savedClearedBarbCampHexes = saved.meta?.clearedBarbCampHexes'),
    '4: production load path reads the optional blacklist field');
  assert(main.includes("typeof hexKey === 'string' && /^-?\\d+,-?\\d+$/.test(hexKey)"),
    '4: production load path validates old/malformed blacklist entries');
}

// 5. Mutation guard: removing either the production exclusion or its recording
// must make this same test fail. Restores files even if the child process errors.
if (!process.argv.includes('--self-check-skip-mutation')) {
  function expectMutationFails(file, mutate, label) {
    const original = fs.readFileSync(file, 'utf8');
    let childFailed = false;
    try {
      fs.writeFileSync(file, mutate(original), 'utf8');
      execFileSync(process.execPath, [__filename, '--self-check-skip-mutation'], {
        cwd: __dirname, stdio: 'pipe', timeout: 60000,
      });
    } catch {
      childFailed = true;
    } finally {
      fs.writeFileSync(file, original, 'utf8');
    }
    assert(childFailed, `5: mutation guard catches ${label}`);
  }

  expectMutationFails(
    path.join(ROOT, 'src/game/barbarians.ts'),
    src => src.replace(
      'if (campHexIsCleared(clearedHexes, q, r)) continue;',
      'if (false) continue;',
    ),
    'removing spawn blacklist guard',
  );
  expectMutationFails(
    path.join(ROOT, 'src/main.ts'),
    src => src.replace(
      'clearedBarbCampHexes.add(keyOf(q, r));',
      '// MUTATION: do not record cleared camp hex',
    ),
    'removing destruction blacklist recording',
  );
}

console.log(`barb-camp-blacklist-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY); } catch {}
try { fs.unlinkSync(BUNDLE); } catch {}
process.exit(failed > 0 ? 1 : 0);
