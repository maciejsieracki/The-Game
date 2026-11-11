// Generator: wektory webowego planOversizedStackSplits (origin/main gra/src/game/army-stack-limit.ts).
// Uruchomienie: node gen-stack-vectors.mjs <sciezka do army-stack-limit.mts> <wyjscie.json>
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
const [, , src, out] = process.argv;
const web = await import(pathToFileURL(src).href);
let seed = 987654;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1)); // [a,b]
const cases = [];
// Przypadki reczne: nieumieszczone nadwyzki (wszystkie heksy w promieniu zablokowane).
const ring1 = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
cases.push({ limit: 1, maxRadius: 1, units: [0,1,2].map(k => ({ id: 'f' + k, ownerId: 0, q: 0, r: 0 })), blocked: ring1 });
cases.push({ limit: 2, maxRadius: 2, units: [0,1,2,3,4].map(k => ({ id: 'g' + k, ownerId: 1, q: 2, r: 2 })), blocked: ring1.map(([a,b]) => [a+2,b+2]) });
cases.push({ limit: 1, maxRadius: 6, units: [{ id: 'h0', ownerId: 0, q: 0, r: 0 }, { id: 'h1', ownerId: 0, q: 0, r: 0 }, { id: 'h2', ownerId: 2, q: 1, r: 0 }], blocked: [] });
for (let i = 0; i < 300; i++) {
  const limit = ri(1, 4);
  const units = [];
  const nHex = ri(1, 6);
  for (let h = 0; h < nHex; h++) {
    const owner = ri(0, 2);
    const q = ri(-3, 3);
    const r = ri(-3, 3);
    const cnt = ri(1, limit + 3);
    for (let k = 0; k < cnt; k++) units.push({ id: `s${i}_${units.length}`, ownerId: owner, q, r });
  }
  const blocked = [];
  const nBlk = rnd() < 0.3 ? ri(20, 45) : ri(0, 8);
  for (let b = 0; b < nBlk; b++) blocked.push([ri(-4, 4), ri(-4, 4)]);
  const maxRadius = rnd() < 0.2 ? ri(1, 2) : 6;
  cases.push({ limit, units, blocked, maxRadius });
}
const outCases = cases.map((c) => {
  const blockedSet = new Set(c.blocked.map(([q, r]) => q + ',' + r));
  const plan = web.planOversizedStackSplits(c.units, c.limit, {
    canPlaceAt: (_owner, q, r) => !blockedSet.has(q + ',' + r),
    maxRadius: c.maxRadius,
  });
  return { limit: c.limit, maxRadius: c.maxRadius, units: c.units, blocked: c.blocked, expectedMoves: plan.moves, expectedUnplaced: plan.unplaced };
});
writeFileSync(out, JSON.stringify({ generator: 'origin/main gra/src/game/army-stack-limit.ts planOversizedStackSplits', node: process.version, cases: outCases }, null, 1));
console.log('cases', outCases.length, 'with moves', outCases.filter((c) => c.expectedMoves.length > 0).length, 'with unplaced', outCases.filter((c) => c.expectedUnplaced.length > 0).length);
