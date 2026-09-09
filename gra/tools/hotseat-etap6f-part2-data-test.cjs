'use strict';
/**
 * hotseat-etap6f-part2-data-test.cjs — bramka R-HOTSEAT-ETAP6F-PART2-DATA-Q1.
 *
 * Headless (bez DOM), REALNE wykonanie generatora (esbuild bundluje TS 1:1 z
 * `src/`, nie reimplementacja) — REGUŁA PRZECIW SAMOOSZUKIWANIU tego
 * dispatchu: wstrzykuje drugą cywilizację NA ETAPIE GENERACJI klastra
 * (`buildClusterStartPlan`), nie tylko przejęcia istniejącego miasta.
 *
 * Dowodzi:
 * 1. No-op: bez `secondHumanCivId` plan jest identyczny (JSON) planowi bez
 *    żadnej wiedzy o drugim człowieku — `secondPlayerStartHex`/
 *    `secondPlayerOwnerId` zawsze `null`.
 * 2. Realna generacja: z `secondHumanCivId` drugi heks powstaje, różni się od
 *    heksu gracza 1, jest lądem, respektuje próg dystansu
 *    `MIN_CITY_DISTANCE_START_CITY_STATE`, a `secondPlayerOwnerId` nie
 *    koliduje z żadnym ownerId AI z tego samego planu.
 * 3. ABC-Q3 (wykluczenie duplikatu): `secondHumanCivId === playerCivId` rzuca.
 * 4. ABC-Q4 (trzy tryby dystansu): 'blisko'/'daleko'/'losowo' dają MIERZALNIE
 *    różne rozkłady odległości (nie tylko różne wewnętrzne flagi) — zmierzone
 *    na wielu seedach.
 * 5. Determinizm: ten sam seed + tryb → ten sam heks.
 * 6. Kolizja pozycji (runda 2, Zarzut 1 Evaluatora): drugi heks nigdy nie
 *    trafia w pozycję ani nie ląduje bliżej niż próg od miasta AI już
 *    postawionego LUB zarezerwowanego (`aiStartHexes`/`pendingSameTypeRival-
 *    Hexes`) w tym samym planie — zmierzone na 40 seedach × 3 trybach.
 *
 * Run: node tools/hotseat-etap6f-part2-data-test.cjs (z katalogu gra/)
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.hotseat-etap6f-part2-data-entry.ts');
const bundle = path.join(__dirname, '.hotseat-etap6f-part2-data-bundle.cjs');

fs.writeFileSync(entry, `
export { buildClusterStartPlan } from '../src/game/cluster-start';
export { generateMap } from '../src/map/generator';
export { hexDistanceAxial } from '../src/map/gen-helpers';
export { MIN_CITY_DISTANCE_START_CITY_STATE } from '../src/game/cities';
export { isWaterTerrain } from '../src/units/setup';
export { setRiverGenEnabledOverride } from '../src/map/riverGenSwitch';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);
const civs = require('../data/civs.json');

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

function isLandHex(map, q, r) {
  const h = map.hexes[q + ',' + r];
  return !!h && !M.isWaterTerrain(h.terenBazowy) && h.terenBazowy !== 'gory' && h.terenBazowy !== 'polarny';
}

console.log('hotseat-etap6f-part2-data-test (R-HOTSEAT-ETAP6F-PART2-DATA-Q1)\n');

// Rzeki wyłączone dla SZYBKOŚCI bramki (skanujemy wiele seedów) — kill-switch
// istniejący od dawna w silniku (`riverGenSwitch.ts`), nie własny hack; drugi
// heks NIE zależy od rzek (reguła terenu to ląd/woda/góry/polarny, nie rzeki).
M.setRiverGenEnabledOverride(false);

const SEED = 4242;
const map = M.generateMap(50, 50, SEED, 'kontynenty');

// --- 1. NO-OP: bez secondHumanCivId, dokładnie jak dziś ---
const basePlan = M.buildClusterStartPlan({
  map, civs, seed: SEED, playerCivId: 'grecy', rywaleNaKlaster: 4, aktywneTypy: 5, startEpochId: 'kamien',
});
assert(basePlan.secondPlayerStartHex === null, 'no-op: secondPlayerStartHex null bez secondHumanCivId');
assert(basePlan.secondPlayerOwnerId === null, 'no-op: secondPlayerOwnerId null bez secondHumanCivId');

const basePlanAgain = M.buildClusterStartPlan({
  map, civs, seed: SEED, playerCivId: 'grecy', rywaleNaKlaster: 4, aktywneTypy: 5, startEpochId: 'kamien',
});
assert(
  JSON.stringify({ ...basePlan, aiOwnerCivMap: [...basePlan.aiOwnerCivMap], ownerDisplayName: [...basePlan.ownerDisplayName], simplifiedDiplomacyOwners: [...basePlan.simplifiedDiplomacyOwners], foreignTypeOwners: [...basePlan.foreignTypeOwners], typCityCopyOwners: [...basePlan.typCityCopyOwners], startRelations: [...basePlan.startRelations], placement: null })
  === JSON.stringify({ ...basePlanAgain, aiOwnerCivMap: [...basePlanAgain.aiOwnerCivMap], ownerDisplayName: [...basePlanAgain.ownerDisplayName], simplifiedDiplomacyOwners: [...basePlanAgain.simplifiedDiplomacyOwners], foreignTypeOwners: [...basePlanAgain.foreignTypeOwners], typCityCopyOwners: [...basePlanAgain.typCityCopyOwners], startRelations: [...basePlanAgain.startRelations], placement: null }),
  'no-op: dwa wywołania bez secondHumanCivId identyczne (bit-w-bit, poza placement — obiekt cykliczny)',
);

// --- 2. Realna generacja drugiego heksu ---
const plan2 = M.buildClusterStartPlan({
  map, civs, seed: SEED, playerCivId: 'grecy', rywaleNaKlaster: 4, aktywneTypy: 5, startEpochId: 'kamien',
  secondHumanCivId: 'egipcjanie', humanDistanceMode: 'losowo',
});
assert(plan2.secondPlayerStartHex !== null, 'z secondHumanCivId: secondPlayerStartHex powstaje');
assert(plan2.secondPlayerOwnerId !== null, 'z secondHumanCivId: secondPlayerOwnerId powstaje');
assert(
  !(plan2.secondPlayerStartHex.q === plan2.playerStartHex.q && plan2.secondPlayerStartHex.r === plan2.playerStartHex.r),
  'drugi heks różni się od heksu gracza 1',
);
assert(isLandHex(map, plan2.secondPlayerStartHex.q, plan2.secondPlayerStartHex.r), 'drugi heks jest lądem (ta sama reguła terenu co pierwszy)');
const d2 = M.hexDistanceAxial(
  plan2.secondPlayerStartHex.q, plan2.secondPlayerStartHex.r,
  plan2.playerStartHex.q, plan2.playerStartHex.r,
);
assert(d2 >= M.MIN_CITY_DISTANCE_START_CITY_STATE, `drugi heks respektuje próg dystansu (d=${d2} >= ${M.MIN_CITY_DISTANCE_START_CITY_STATE})`);

const aiOwnerIds = new Set(plan2.aiStartHexes.map(a => a.ownerId));
assert(!aiOwnerIds.has(plan2.secondPlayerOwnerId), 'secondPlayerOwnerId nie koliduje z żadnym AI ownerId tego planu');
assert(plan2.secondPlayerOwnerId !== 0, 'secondPlayerOwnerId != 0 (owner gracza 1)');
assert(!plan2.pendingSameTypeRivalOwnerIds.includes(plan2.secondPlayerOwnerId), 'secondPlayerOwnerId nie koliduje z pendingSameTypeRivalOwnerIds');

// --- 3. ABC-Q3: wykluczenie duplikatu cywilizacji fotela 2 ---
let threwOnDuplicate = false;
try {
  M.buildClusterStartPlan({
    map, civs, seed: SEED, playerCivId: 'grecy', rywaleNaKlaster: 4, aktywneTypy: 5,
    secondHumanCivId: 'grecy',
  });
} catch (e) {
  threwOnDuplicate = true;
}
assert(threwOnDuplicate, 'ABC-Q3: secondHumanCivId identyczne z playerCivId rzuca (wykluczenie duplikatu)');

// --- 4. ABC-Q4: trzy tryby dystansu — rozkłady MIERZALNIE różne na wielu seedach ---
function distanceForMode(seed, mode) {
  const m = M.generateMap(50, 50, seed, 'kontynenty');
  const p = M.buildClusterStartPlan({
    map: m, civs, seed, playerCivId: 'grecy', rywaleNaKlaster: 4, aktywneTypy: 5, startEpochId: 'kamien',
    secondHumanCivId: 'egipcjanie', humanDistanceMode: mode,
  });
  if (!p.secondPlayerStartHex) return null;
  return M.hexDistanceAxial(
    p.secondPlayerStartHex.q, p.secondPlayerStartHex.r,
    p.playerStartHex.q, p.playerStartHex.r,
  );
}

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
const blisko = SEEDS.map(s => distanceForMode(s, 'blisko')).filter(x => x !== null);
const daleko = SEEDS.map(s => distanceForMode(s, 'daleko')).filter(x => x !== null);
const losowo = SEEDS.map(s => distanceForMode(s, 'losowo')).filter(x => x !== null);

function avg(xs) { return xs.reduce((a, b) => a + b, 0) / xs.length; }
const avgBlisko = avg(blisko);
const avgDaleko = avg(daleko);
const avgLosowo = avg(losowo);

console.log(`  distances: blisko avg=${avgBlisko.toFixed(1)} (n=${blisko.length}), losowo avg=${avgLosowo.toFixed(1)} (n=${losowo.length}), daleko avg=${avgDaleko.toFixed(1)} (n=${daleko.length})`);

assert(blisko.length >= SEEDS.length - 1, 'blisko: heks znaleziony na prawie wszystkich seedach');
assert(daleko.length >= SEEDS.length - 1, 'daleko: heks znaleziony na prawie wszystkich seedach');
assert(losowo.length >= SEEDS.length - 1, 'losowo: heks znaleziony na prawie wszystkich seedach');
assert(avgBlisko < avgDaleko, `ABC-Q4: blisko < daleko (mierzalna różnica; ${avgBlisko.toFixed(1)} < ${avgDaleko.toFixed(1)})`);
assert(avgBlisko < avgLosowo, `ABC-Q4: blisko < losowo (${avgBlisko.toFixed(1)} < ${avgLosowo.toFixed(1)})`);
assert(avgLosowo < avgDaleko, `ABC-Q4: losowo < daleko (${avgLosowo.toFixed(1)} < ${avgDaleko.toFixed(1)})`);
// żaden tryb nie jest przez to samo, wewnętrznie martwym parametrem
assert(
  JSON.stringify(blisko) !== JSON.stringify(daleko),
  'blisko i daleko dają różne SEKWENCJE dystansów (nie tylko średnią)',
);

// --- 5. Determinizm: ten sam seed+tryb → ten sam heks ---
const detA = M.buildClusterStartPlan({
  map, civs, seed: SEED, playerCivId: 'grecy', rywaleNaKlaster: 4, aktywneTypy: 5, startEpochId: 'kamien',
  secondHumanCivId: 'egipcjanie', humanDistanceMode: 'blisko',
});
const detB = M.buildClusterStartPlan({
  map, civs, seed: SEED, playerCivId: 'grecy', rywaleNaKlaster: 4, aktywneTypy: 5, startEpochId: 'kamien',
  secondHumanCivId: 'egipcjanie', humanDistanceMode: 'blisko',
});
assert(
  JSON.stringify(detA.secondPlayerStartHex) === JSON.stringify(detB.secondPlayerStartHex),
  'determinizm: ten sam seed+tryb → ten sam drugi heks',
);

// --- 6. secondHumanOwnerId jawny (wołający steruje numeracją) ---
const explicitOwner = M.buildClusterStartPlan({
  map, civs, seed: SEED, playerCivId: 'grecy', rywaleNaKlaster: 4, aktywneTypy: 5, startEpochId: 'kamien',
  secondHumanCivId: 'egipcjanie', secondHumanOwnerId: 777,
});
assert(explicitOwner.secondPlayerOwnerId === 777, 'jawny secondHumanOwnerId respektowany');

// --- 7. Zarzut 1 Evaluatora (runda 2): drugi heks NIGDY nie koliduje
// pozycyjnie z miastem AI istniejącym LUB zarezerwowanym w tym samym planie
// (nie tylko dystans/teren/ownerId — realna kolizja POZYCJI, dokładnie ten
// przypadek, który niezależny skrypt Evaluatora wykrył 8/180 razy).
const COLLISION_SEEDS = Array.from({ length: 40 }, (_, i) => i + 100);
const MODES = ['blisko', 'daleko', 'losowo'];
let collisionChecks = 0;
let exactCollisions = 0;
let tooClose = 0;
for (const seed of COLLISION_SEEDS) {
  const m = M.generateMap(50, 50, seed, 'kontynenty');
  for (const mode of MODES) {
    const p = M.buildClusterStartPlan({
      map: m, civs, seed, playerCivId: 'grecy', rywaleNaKlaster: 4, aktywneTypy: 5, startEpochId: 'kamien',
      secondHumanCivId: 'egipcjanie', humanDistanceMode: mode,
    });
    if (!p.secondPlayerStartHex) continue;
    collisionChecks++;
    const occupied = [...p.aiStartHexes, ...p.pendingSameTypeRivalHexes];
    for (const o of occupied) {
      if (o.q === p.secondPlayerStartHex.q && o.r === p.secondPlayerStartHex.r) exactCollisions++;
      const d = M.hexDistanceAxial(o.q, o.r, p.secondPlayerStartHex.q, p.secondPlayerStartHex.r);
      if (d < M.MIN_CITY_DISTANCE_START_CITY_STATE) tooClose++;
    }
  }
}
console.log(`  kolizje pozycji: ${collisionChecks} planów sprawdzonych (${COLLISION_SEEDS.length} seedów × ${MODES.length} trybów), ${exactCollisions} dokładnych kolizji, ${tooClose} przypadków < próg dystansu`);
assert(collisionChecks >= COLLISION_SEEDS.length * MODES.length - 5, 'kolizje pozycji: drugi heks znaleziony na prawie wszystkich kombinacjach seed×tryb');
assert(exactCollisions === 0, 'ZERO dokładnych kolizji pozycji drugiego heksu z miastem AI/zarezerwowanym slotem (Zarzut 1 Evaluatora)');
assert(tooClose === 0, `ZERO przypadków drugiego heksu bliżej niż ${'MIN_CITY_DISTANCE_START_CITY_STATE'} od miasta AI/zarezerwowanego slotu (Zarzut 1 Evaluatora)`);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
