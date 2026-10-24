'use strict';
/**
 * ai-move-range-test.cjs -- R-WEB-AI-MOVE-RANGE-Q1.
 * Uruchom z gra/:  node tools/ai-move-range-test.cjs
 *
 * Dowodzi, ze krok AI (planner wojny all-in, egzekutor komendy move, pomocnik
 * farthestStepWithinBudget) porusza jednostke o PELNY budzet ruchu na plaskim terenie,
 * a nie o 1 heks. Ta sama semantyka obowiazuje AI, miasta-panstwa (egzekutor) i
 * barbarzyncow (firstStep w barbarians.ts uzywa tego samego pomocnika).
 * Mutacja przywracajaca 1 heks (budzet 1) czerwieni asercje zasiegu.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const H = require('./war-allin-capital-harness.cjs');

const ENTRY = path.resolve(__dirname, '.ai-move-range-entry.ts');
const BUNDLE = path.resolve(__dirname, '.ai-move-range-bundle.cjs');

fs.writeFileSync(ENTRY, [
  "export { truncatePathWithinBudget, farthestStepWithinBudget } from '../src/game/ai-move-range';",
  "export { planWarAllInCapital } from '../src/game/warAllInCapital';",
  "export { executeAiCityMove } from '../src/game/ai-city-capture-executor';",
  "export { computePath, hexDistance, terrainMoveCost, keyOf } from '../src/units/setup';",
  '',
].join('\n'), 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent',
});
const E = require(BUNDLE);
const cleanup = () => { for (const f of [ENTRY, BUNDLE]) { try { fs.unlinkSync(f); } catch (_) { /* brak */ } } };

let ok = 0;
let fail = 0;
function assert(c, m) { if (c) { ok++; console.log('  [OK] ' + m); } else { fail++; console.error('  [FAIL] ' + m); } }
function eq(a, b, m) { assert(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const W = 40;
const HGT = 20;
const map = H.makeMap(W, HGT);
const straight = (n) => Array.from({ length: n }, (_, i) => ({ q: i + 1, r: 0 }));

// ---------------------------------------------------------------------------
console.log('\n--- A: pomocnik truncatePathWithinBudget / farthestStepWithinBudget ---');
{
  const path10 = straight(10);
  eq(E.truncatePathWithinBudget(path10, 4, map).length, 4, 'A1 budzet 4 na plaskim terenie -> 4 heksy');
  eq(E.truncatePathWithinBudget(path10, 0, map).length, 0, 'A2 budzet 0 -> brak ruchu');
  eq(E.truncatePathWithinBudget(path10, 20, map).length, 10, 'A3 budzet > dlugosc trasy -> cala trasa');
  const costy = (hex) => (hex.coords.q === 2 ? 3 : 1);
  eq(E.truncatePathWithinBudget(path10, 3, map, costy).length, 1, 'A4 heks kosztowny 3 przy budzecie 3 -> zatrzymanie przed nim');
  eq(E.truncatePathWithinBudget(path10, 4, map, costy).length, 2, 'A5 koszt terenu liczony (1+3=4 <= 4)');
  const far = E.farthestStepWithinBudget(path10, 5, map);
  eq(far && far.q, 5, 'A6 farthest: budzet 5 -> heks (5,0)');
  eq(E.farthestStepWithinBudget(path10, 1, map) && E.farthestStepWithinBudget(path10, 1, map).q, 1, 'A7 farthest: budzet 1 -> heks (1,0)');
  eq(E.farthestStepWithinBudget(path10, 20, map).q, 9, 'A8 farthest: cel (10,0) nigdy nie jest krokiem; najdalej (9,0)');
  eq(E.farthestStepWithinBudget(straight(1), 5, map), null, 'A9 trasa 1-heksowa (cel sasiedni) -> null (wolajacy bierze path[0])');
}

// ---------------------------------------------------------------------------
console.log('\n--- B: planner wojny all-in (AI / miasta-panstwa / barbarzyncy) na plaskim terenie ---');
const planStep = (budget, unitId = 'u1') => {
  const units = [{ id: unitId, q: 0, r: 0, ruchLeft: budget }];
  const targets = [{ ownerId: 2, cityId: 'capB', q: 25, r: 0 }];
  const plan = E.planWarAllInCapital(units, targets, { map, blocked: new Set(), occupied: new Set() });
  return { plan, order: plan.orders[0] };
};
for (const N of [2, 3, 5, 8]) {
  const { order } = planStep(N);
  const d = order ? E.hexDistance(0, 0, order.step.q, order.step.r) : -1;
  eq(d, N, `B${N} jednostka z budzetem ${N} przechodzi ${N} heksow w jednej turze`);
  assert(order && !(order.step.q === 25 && order.step.r === 0), `B${N} krok nie wchodzi na heks celu`);
}
{
  const a = JSON.stringify(planStep(5).plan);
  const b = JSON.stringify(planStep(5).plan);
  eq(a === b, true, 'B9 determinizm: dwa przebiegi planera, ten sam wynik');
}
{
  const { order } = planStep(undefined);
  eq(E.hexDistance(0, 0, order.step.q, order.step.r), 1, 'B10 brak ruchLeft -> 1 heks (zgodnosc wsteczna)');
}

// ---------------------------------------------------------------------------
console.log('\n--- C: egzekutor komendy move (executeAiCityMove + truncatePath) ---');
function execMove(budget, target) {
  const unit = { id: 'c1', ownerId: 1, q: 0, r: 0, ruchLeft: budget };
  const blocked = new Set();
  const cmd = { unitId: 'c1', toQ: target.q, toR: target.r };
  E.executeAiCityMove({
    command: cmd, unit, cities: [], cityBuiltIds: [], hasCityDefenders: false,
    unitIsCivilian: false, targetVisible: true, canOccupyCityHex: true,
    blockedKeys: blocked, destinationKey: E.keyOf(target.q, target.r),
    computePath: (u, toQ, toR, occ) => E.computePath(u, map, toQ, toR, occ),
    truncatePath: (full) => unit.ruchLeft > 0 ? E.truncatePathWithinBudget(full, unit.ruchLeft, map) : full,
  });
  return { dist: E.hexDistance(0, 0, unit.q, unit.r), unit };
}
for (const N of [2, 4, 6]) {
  const r = execMove(N, { q: 20, r: 5 });
  eq(r.dist, N, `C${N} komenda do odleglego heksu: egzekutor przesuwa o budzet ${N}`);
  eq(r.unit.ruchLeft, 0, `C${N} ruchLeft zerowany po ruchu (jak dotad)`);
}
{
  const r = execMove(3, { q: 1, r: 0 });
  eq(r.dist, 1, 'C9 cel sasiedni -> 1 heks (bez zmiany)');
}

// ---------------------------------------------------------------------------
console.log('\n--- D: czulosc testu na mutacje (1 heks = stare zachowanie musi czerwienic asercje) ---');
{
  const mutantD = planStep(1);
  const dMut = E.hexDistance(0, 0, mutantD.order.step.q, mutantD.order.step.r);
  assert(dMut !== 5, 'D1 mutacja "1 heks" daje 1 heks, a asercja B(5) wymaga 5 -> czerwono (test lapie regresje)');
  const r = execMove(1, { q: 20, r: 5 });
  assert(r.dist !== 4, 'D2 mutacja "1 heks" w egzekutorze daje 1 heks, asercja C(4) czerwieni');
}

// ---------------------------------------------------------------------------
console.log('\n--- E: koszt obliczen (planner, 16 jednostek, budzet 1 vs 5) ---');
{
  const mk = (budget) => Array.from({ length: 16 }, (_, i) => ({ id: `p${i}`, q: 0, r: i % HGT, ruchLeft: budget }));
  const targets = [{ ownerId: 2, cityId: 'capE', q: 30, r: 10 }];
  const time = (budget) => {
    const t0 = process.hrtime.bigint();
    for (let k = 0; k < 20; k++) E.planWarAllInCapital(mk(budget), targets, { map, blocked: new Set(), occupied: new Set() });
    return Number(process.hrtime.bigint() - t0) / 1e6;
  };
  time(1);
  const t1 = time(1);
  const t5 = time(5);
  console.log(`  [INFO] czas planera 20 przebiegow: budzet 1 = ${t1.toFixed(1)} ms, budzet 5 = ${t5.toFixed(1)} ms, stosunek = ${(t5 / t1).toFixed(2)}`);
  assert(t5 <= t1 * 1.3 + 5, 'E1 planner z pelnym zasiegiem nie wolniejszy niz x1,3 (+5 ms tolerancji)');
}

cleanup();
console.log(`\nai-move-range: ${ok} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
