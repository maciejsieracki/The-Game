'use strict';
/**
 * ai-move-range-test.cjs -- R-WEB-AI-MOVE-RANGE-Q1 (runda 2).
 * Uruchom z gra/:  node tools/ai-move-range-test.cjs
 *
 * Dowodzi, ze krok AI (PRAWDZIWE firstStep z ai.ts), barbarzyncow (PRAWDZIWE firstStep z
 * barbarians.ts), planer wojny all-in (warAllInCapital.ts) i egzekutor komendy move
 * (ai-city-capture-executor.ts) przesuwaja jednostke o PELNY budzet ruchu na plaskim
 * terenie, a nie o 1 heks.
 *
 * Mutacje (sekcja D) sa REALNE: esbuild podmienia tekst PRAWDZIWEGO zrodla w pamieci
 * (plugin onLoad), np. `farthestStepWithinBudget(...) ?? path[0]` -> `path[0]`, i
 * sprawdzamy, ze asercja zasiegu dla tej mutacji CZERWIENI. Eksport probe `firstStep`
 * jest dopisywany w pamieci przez plugin; plikow src nie zmieniamy.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const H = require('./war-allin-capital-harness.cjs');

const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src');
const abs = (rel) => path.join(SRC, rel);

const MUT_AI = {
  name: 'AI firstStep -> path[0]', rel: 'game/ai.ts',
  from: 'return farthestStepWithinBudget(path, unit.ruchLeft, map) ?? path[0] ?? null;',
  to: 'return path[0] ?? null;',
};
const MUT_BARB = {
  name: 'barbarzynca firstStep -> path[0]', rel: 'game/barbarians.ts',
  from: 'return farthestStepWithinBudget(path, unit.ruchLeft, map, costFn) ?? path[0] ?? null;',
  to: 'return path[0] ?? null;',
};
const MUT_WAR = {
  name: 'planer wojny: budzet kroku = 1', rel: 'game/warAllInCapital.ts',
  from: 'emit(u, g, extendWalk(nav, g, st, res, u.ruchLeft ?? 1));',
  to: 'emit(u, g, extendWalk(nav, g, st, res, 1));',
};
const MUT_EXEC = {
  name: 'egzekutor: wylaczony truncatePath', rel: 'game/ai-city-capture-executor.ts',
  from: 'if (opts.truncatePath !== undefined) {',
  to: 'if (false) {',
};

/** Buduje bundle z PRAWDZIWYCH zrodel; `mutations` podmieniane w pamieci (dokladnie 1 trafienie). */
async function makeBundle(tag, mutations) {
  const entry = path.resolve(__dirname, `.ai-move-range-${tag}-entry.ts`);
  const bundle = path.resolve(__dirname, `.ai-move-range-${tag}-bundle.cjs`);
  const probe = new Set([abs('game/ai.ts'), abs('game/barbarians.ts')]);
  const muts = mutations.map((m) => ({ ...m, abs: abs(m.rel) }));
  fs.writeFileSync(entry, [
    `export { __firstStep as aiFirstStep } from ${JSON.stringify(abs('game/ai.ts'))};`,
    `export { __firstStep as barbFirstStep } from ${JSON.stringify(abs('game/barbarians.ts'))};`,
    `export { truncatePathWithinBudget, farthestStepWithinBudget } from ${JSON.stringify(abs('game/ai-move-range.ts'))};`,
    `export { planWarAllInCapital } from ${JSON.stringify(abs('game/warAllInCapital.ts'))};`,
    `export { executeAiCityMove } from ${JSON.stringify(abs('game/ai-city-capture-executor.ts'))};`,
    `export { computePath, hexDistance, terrainMoveCost, keyOf } from ${JSON.stringify(abs('units/setup.ts'))};`,
    '',
  ].join('\n'), 'utf8');
  const plugin = {
    name: 'ai-move-range-probe',
    setup(build) {
      build.onLoad({ filter: /\.ts$/ }, (args) => {
        if (!args.path.startsWith(SRC + path.sep)) return undefined;
        let text = fs.readFileSync(args.path, 'utf8');
        for (const m of muts) {
          if (args.path !== m.abs) continue;
          const n = text.split(m.from).length - 1;
          if (n !== 1) throw new Error(`mutacja "${m.name}": wzorzec znaleziony ${n} razy w ${m.rel}`);
          text = text.split(m.from).join(m.to);
        }
        if (probe.has(args.path)) text += '\nexport { firstStep as __firstStep };\n';
        return { contents: text, loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    },
  };
  try {
    await esbuild.build({
      entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      outfile: bundle, absWorkingDir: GRA, logLevel: 'silent', plugins: [plugin],
    });
    return require(bundle);
  } finally {
    for (const f of [entry, bundle]) { try { fs.unlinkSync(f); } catch (_) { /* brak */ } }
  }
}

async function main() {
const M = await makeBundle('main', []);
const M_AI = await makeBundle('mut-ai', [MUT_AI]);
const M_BARB = await makeBundle('mut-barb', [MUT_BARB]);
const M_WAR = await makeBundle('mut-war', [MUT_WAR]);
const M_EXEC = await makeBundle('mut-exec', [MUT_EXEC]);

let ok = 0;
let fail = 0;
function assert(c, m) { if (c) { ok++; console.log('  [OK] ' + m); } else { fail++; console.error('  [FAIL] ' + m); } }
function eq(a, b, m) { assert(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const W = 40;
const HGT = 20;
const map = H.makeMap(W, HGT);
const straight = (n) => Array.from({ length: n }, (_, i) => ({ q: i + 1, r: 0 }));

// --- sprawdzenia zasiegu: zwracaja dystans (heksy) przejscia w jednej turze ------------
function aiStepDist(mod, budget) {
  const u = H.mkUnit('a1', 1, 0, 0); u.ruchLeft = budget;
  const s = mod.aiFirstStep(u, map, 30, 0, [u]);
  return s ? mod.hexDistance(0, 0, s.q, s.r) : -1;
}
function barbStepDist(mod, budget) {
  const u = H.mkUnit('b1', 9, 0, 0); u.ruchLeft = budget;
  const s = mod.barbFirstStep(u, map, 30, 0, new Set());
  return s ? mod.hexDistance(0, 0, s.q, s.r) : -1;
}
function warStepDist(mod, budget) {
  const units = [{ id: 'u1', q: 0, r: 0, ruchLeft: budget }];
  const targets = [{ ownerId: 2, cityId: 'capB', q: 25, r: 0 }];
  const plan = mod.planWarAllInCapital(units, targets, { map, blocked: new Set(), occupied: new Set() });
  const o = plan.orders[0];
  return o ? mod.hexDistance(0, 0, o.step.q, o.step.r) : -1;
}
function execDist(mod, budget) {
  const unit = { id: 'c1', ownerId: 1, q: 0, r: 0, ruchLeft: budget };
  mod.executeAiCityMove({
    command: { unitId: 'c1', toQ: 20, toR: 5 }, unit, cities: [], cityBuiltIds: [], hasCityDefenders: false,
    unitIsCivilian: false, targetVisible: true, canOccupyCityHex: true,
    blockedKeys: new Set(), destinationKey: mod.keyOf(20, 5),
    computePath: (u, toQ, toR, occ) => mod.computePath(u, map, toQ, toR, occ),
    truncatePath: (full) => (unit.ruchLeft > 0 ? mod.truncatePathWithinBudget(full, unit.ruchLeft, map) : full),
  });
  return mod.hexDistance(0, 0, unit.q, unit.r);
}

// ---------------------------------------------------------------------------
console.log('\n--- A: pomocnik truncatePathWithinBudget / farthestStepWithinBudget ---');
{
  const path10 = straight(10);
  eq(M.truncatePathWithinBudget(path10, 4, map).length, 4, 'A1 budzet 4 na plaskim terenie -> 4 heksy');
  eq(M.truncatePathWithinBudget(path10, 0, map).length, 0, 'A2 budzet 0 -> brak ruchu');
  eq(M.truncatePathWithinBudget(path10, 20, map).length, 10, 'A3 budzet > dlugosc trasy -> cala trasa');
  const costy = (hex) => (hex.coords.q === 2 ? 3 : 1);
  eq(M.truncatePathWithinBudget(path10, 3, map, costy).length, 1, 'A4 heks kosztowny 3 przy budzecie 3 -> zatrzymanie przed nim');
  eq(M.truncatePathWithinBudget(path10, 4, map, costy).length, 2, 'A5 koszt terenu liczony (1+3=4 <= 4)');
  const far = M.farthestStepWithinBudget(path10, 5, map);
  eq(far && far.q, 5, 'A6 farthest: budzet 5 -> heks (5,0)');
  const far1 = M.farthestStepWithinBudget(path10, 1, map);
  eq(far1 && far1.q, 1, 'A7 farthest: budzet 1 -> heks (1,0)');
  eq(M.farthestStepWithinBudget(path10, 20, map).q, 9, 'A8 farthest: cel (10,0) nigdy nie jest krokiem; najdalej (9,0)');
  eq(M.farthestStepWithinBudget(straight(1), 5, map), null, 'A9 trasa 1-heksowa (cel sasiedni) -> null (wolajacy bierze path[0])');
}

// ---------------------------------------------------------------------------
console.log('\n--- B: planer wojny all-in (AI / miasta-panstwa / barbarzyncy) na plaskim terenie ---');
for (const N of [2, 3, 5, 8]) {
  eq(warStepDist(M, N), N, `B${N} planer: jednostka z budzetem ${N} przechodzi ${N} heksow w jednej turze`);
}
{
  const args = () => [[{ id: 'u1', q: 0, r: 0, ruchLeft: 5 }],
    [{ ownerId: 2, cityId: 'capB', q: 25, r: 0 }], { map, blocked: new Set(), occupied: new Set() }];
  eq(JSON.stringify(M.planWarAllInCapital(...args())) === JSON.stringify(M.planWarAllInCapital(...args())), true,
    'B9 determinizm: dwa przebiegi planera, ten sam wynik');
}
eq(warStepDist(M, undefined), 1, 'B10 brak ruchLeft -> 1 heks (zgodnosc wsteczna)');

// ---------------------------------------------------------------------------
console.log('\n--- C: egzekutor komendy move (executeAiCityMove + truncatePath) ---');
for (const N of [2, 3, 4, 6]) {
  eq(execDist(M, N), N, `C${N} komenda do odleglego heksu: egzekutor przesuwa o budzet ${N}`);
}
{
  const unit = { id: 'c2', ownerId: 1, q: 0, r: 0, ruchLeft: 4 };
  M.executeAiCityMove({
    command: { unitId: 'c2', toQ: 20, toR: 5 }, unit, cities: [], cityBuiltIds: [], hasCityDefenders: false,
    unitIsCivilian: false, targetVisible: true, canOccupyCityHex: true,
    blockedKeys: new Set(), destinationKey: M.keyOf(20, 5),
    computePath: (u, toQ, toR, occ) => M.computePath(u, map, toQ, toR, occ),
    truncatePath: (full) => M.truncatePathWithinBudget(full, unit.ruchLeft, map),
  });
  eq(unit.ruchLeft, 0, 'C7 egzekutor zeruje ruchLeft po ruchu (jak dotad); budzet czytany wczesniej przez truncatePath');
}
eq(execDist(M, 1), 1, 'C9 budzet 1 -> 1 heks');

// ---------------------------------------------------------------------------
console.log('\n--- D: mutacje REALNEGO zrodla musza czerwienic asercje zasiegu ---');
{
  // Asercja zasiegu: budzet 5 -> dystans 5. Zmutowany bundle musi dac wynik != 5.
  const d1 = aiStepDist(M_AI, 5);
  assert(d1 !== 5, `D1 ${MUT_AI.name}: dystans=${d1} (!= 5) -> asercja zasiegu AI czerwona`);
  const d2 = barbStepDist(M_BARB, 5);
  assert(d2 !== 5, `D2 ${MUT_BARB.name}: dystans=${d2} (!= 5) -> asercja zasiegu barbarzyncy czerwona`);
  const d3 = warStepDist(M_WAR, 5);
  assert(d3 !== 5, `D3 ${MUT_WAR.name}: dystans=${d3} (!= 5) -> asercja planera czerwona`);
  const d4 = execDist(M_EXEC, 4);
  assert(d4 !== 4, `D4 ${MUT_EXEC.name}: dystans=${d4} (!= 4) -> asercja egzekutora czerwona`);
  eq(aiStepDist(M, 5), 5, 'D5 kontrola: bez mutacji AI firstStep = 5');
}

// ---------------------------------------------------------------------------
console.log('\n--- F: PRAWDZIWE firstStep z ai.ts i barbarians.ts ---');
for (const N of [1, 2, 3, 5, 8]) {
  eq(aiStepDist(M, N), N, `F-AI${N} ai.ts firstStep: budzet ${N} -> ${N} heksow`);
  eq(barbStepDist(M, N), N, `F-BARB${N} barbarians.ts firstStep: budzet ${N} -> ${N} heksow`);
}
{
  const u = H.mkUnit('a2', 1, 0, 0); u.ruchLeft = 5;
  const s = M.aiFirstStep(u, map, 1, 0, [u]);
  eq(s && s.q, 1, 'F-ADJ cel sasiedni -> krok na cel (zachowanie bez zmian)');
}
// Srednia liczba heksow na jednostke i kolizje celu (ten sam stan, 10 jednostek, flat 40x20,
// cel daleko). PRZED = mutant path[0]; PO = prawdziwy kod. Kolizja = dwie jednostki na tym
// samym heksie kroku w tej samej turze (wszystkie jednostki liczone z tym samym stanem wejscia).
{
  const stats = (mod, budget) => {
    const units = Array.from({ length: 10 }, (_, i) => { const u = H.mkUnit('m' + i, 1, 0, 2 * i); u.ruchLeft = budget; return u; });
    const hexes = [];
    for (const u of units) {
      const s = mod.aiFirstStep(u, map, 30, 10, units);
      hexes.push(s ? mod.hexDistance(u.q, u.r, s.q, s.r) : 0);
    }
    const keys = units.map((u) => { const s = mod.aiFirstStep(u, map, 30, 10, units); return s ? `${s.q},${s.r}` : 'none'; });
    const dup = keys.length - new Set(keys).size;
    return { mean: hexes.reduce((a, b) => a + b, 0) / hexes.length, dup };
  };
  for (const B of [1, 2, 5, 8]) {
    const pre = stats(M_AI, B);
    const po = stats(M, B);
    console.log(`  [INFO] budzet ${B}: PRZED sr. ${pre.mean.toFixed(2)} heks/jedn., kolizje=${pre.dup}; PO sr. ${po.mean.toFixed(2)} heks/jedn., kolizje=${po.dup}`);
    assert(Math.abs(po.mean - B) < 1e-9, `F-AVG${B} PO: srednio ${B} heksow na jednostke (budzet ${B})`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n--- E: koszt obliczen: PRZED (mutant = path[0]) vs PO, ten sam stan ---');
{
  const mk = (budget) => Array.from({ length: 16 }, (_, i) => ({ id: `p${i}`, q: 0, r: i % HGT, ruchLeft: budget }));
  const targets = [{ ownerId: 2, cityId: 'capE', q: 30, r: 10 }];
  const timeIt = (mod, budget, reps) => {
    const t0 = process.hrtime.bigint();
    for (let k = 0; k < reps; k++) mod.planWarAllInCapital(mk(budget), targets, { map, blocked: new Set(), occupied: new Set() });
    return Number(process.hrtime.bigint() - t0) / 1e6;
  };
  const median = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  timeIt(M_WAR, 5, 5); timeIt(M, 5, 5);
  const pre = [];
  const po = [];
  for (let i = 0; i < 9; i++) { pre.push(timeIt(M_WAR, 5, 20)); po.push(timeIt(M, 5, 20)); }
  const ratio = median(po) / median(pre);
  console.log(`  [INFO] planer, budzet 5, mediana 9x20 wywolan: PRZED=${median(pre).toFixed(1)} ms, PO=${median(po).toFixed(1)} ms, stosunek=${ratio.toFixed(2)}`);
  assert(ratio <= 1.3, `E1 planer: PO nie wolniejszy niz PRZED x1,3 (stosunek ${ratio.toFixed(2)}, bez tolerancji addytywnej)`);

  const stepTime = (mod) => {
    const units = Array.from({ length: 300 }, (_, i) => { const u = H.mkUnit('s' + i, 1, 0, i % HGT); u.ruchLeft = 5; return u; });
    const t0 = process.hrtime.bigint();
    for (const u of units) mod.aiFirstStep(u, map, 30, 10, units);
    return Number(process.hrtime.bigint() - t0) / 1e6;
  };
  stepTime(M_AI); stepTime(M);
  const sPre = [];
  const sPo = [];
  for (let i = 0; i < 9; i++) { sPre.push(stepTime(M_AI)); sPo.push(stepTime(M)); }
  const sRatio = median(sPo) / median(sPre);
  console.log(`  [INFO] ai firstStep, 300 wywolan, mediana 9x: PRZED=${median(sPre).toFixed(1)} ms, PO=${median(sPo).toFixed(1)} ms, stosunek=${sRatio.toFixed(2)}`);
  assert(sRatio <= 1.3, `E2 ai firstStep: PO nie wolniejszy niz PRZED x1,3 (stosunek ${sRatio.toFixed(2)})`);
}

// ---------------------------------------------------------------------------
console.log('\n--- G: okablowanie w main.ts (statyczne) ---');
{
  const mainTs = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  assert(/truncatePath:\s*\(fullPath\)\s*=>\s*u\.ruchLeft > 0/.test(mainTs),
    'G1 main.ts: executeAiCityMove dostaje truncatePath (przycinanie do ruchLeft przed zerowaniem)');
}

console.log(`\nai-move-range: ${ok} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
