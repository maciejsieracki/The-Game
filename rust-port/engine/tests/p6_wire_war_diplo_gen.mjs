// P6-WIRE-WAR-DIPLO-TURN (W6): generator wektorow z WEBA (pin 07d2fbd72).
// Uzycie: node p6_wire_war_diplo_gen.mjs <esbuild-bin> <dir-z-brake.ts> <katalog-roboczy-POZA-REPO> <katalog-wyjsciowy>
// - primitives.json: wyniki funkcji z gra/src/game/diplomacy-tick-war-brake.ts (bundlowanych esbuildem 0.24.2).
// - phase.json: wyniki transkrypcji tury z gra/src/main.ts runDiplomacyTurnTick (galaz brake, l.24229)
//   + tickDiploAiAiPairsWithBrake (l.11734) + diploBrakeCrisisStep (l.11578) + processDiploCrisisQueue (l.11650),
//   zbudowanej WYLACZNIE na funkcjach z brake.ts. Relacja po ticku jest wejsciem scenariusza (tick pary = poza zakresem).
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , esbuild, srcDir, workDir, outDir] = process.argv;
if (!esbuild || !srcDir || !workDir || !outDir) {
  console.error('uzycie: node gen.mjs <esbuild> <srcDir> <workDir> <outDir>');
  process.exit(2);
}
const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
mkdirSync(workDir, { recursive: true });
mkdirSync(outDir, { recursive: true });
const brakeTs = join(workDir, 'brake.ts');
copyFileSync(join(srcDir, 'brake.ts'), brakeTs);
const bundled = join(workDir, 'brake.mjs');
execFileSync(esbuild, [brakeTs, '--bundle', '--format=esm', `--outfile=${bundled}`], { stdio: 'inherit' });
const B = await import(pathToFileURL(bundled).href);

const pk = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);
const cmpKey = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const sortObj = (m) => Object.fromEntries([...m.entries()].sort(([a], [b]) => cmpKey(a, b)));
const jsonSafe = (k, v) => (typeof v === 'number' && !Number.isFinite(v) ? String(v) : v);

// ---------- primitives ----------
const p6 = { kryzysProgZaufania: 0, kryzysTurDoWojny: 5, kryzysOstrzezenieTurPrzed: 2 };
const prim = {
  pin: PIN,
  advanceCrisisCounter: [], crisisStepForPair: [], pickWarDeclarer: [], brakeWarOutcome: [],
  sortCrisisQueue: [], dobraWolaTurnStep: [], isAiAiEligibleOwner: [], aiAiPairs: [],
  crisisPairKey: [], parseCrisisCounters: [],
};
for (const prev of [0, 1, 4, 5, -1, NaN, 2.7]) {
  for (const z of [-3, 0, 0.5, 1, 7, NaN]) {
    prim.advanceCrisisCounter.push({ prev, zaufanie: z, out: B.advanceCrisisCounter(prev, z, p6) });
  }
}
for (const atWar of [false, true]) {
  for (const prev of [0, 3]) {
    for (const z of [-1, 2]) {
      prim.crisisStepForPair.push({ prev, zaufanie: z, atWar, out: B.crisisStepForPair(prev, z, atWar, p6) });
    }
  }
}
for (const [a, b] of [[1, 2], [2, 1], [0, 0], [7, 3]]) prim.crisisPairKey.push({ a, b, out: B.crisisPairKey(a, b) });
const wp = [
  [{ ownerId: 1, power: 10 }, { ownerId: 2, power: 5 }],
  [{ ownerId: 3, power: 4 }, { ownerId: 2, power: 4 }],
  [{ ownerId: 5, power: 1 }, { ownerId: 4, power: 9 }],
];
for (const [a, b] of wp) prim.pickWarDeclarer.push({ a, b, out: B.pickWarDeclarer(a, b) });
for (const [a, b] of wp) {
  for (const players of [[], [a.ownerId], [b.ownerId]]) {
    prim.brakeWarOutcome.push({ a, b, players, out: B.brakeWarOutcome(a, b, (o) => players.includes(o)) });
  }
}
const entries = [
  { ownerA: 3, ownerB: 1, counter: 2 }, { ownerA: 2, ownerB: 4, counter: 5 }, { ownerA: 1, ownerB: 2, counter: 5 },
  { ownerA: 0, ownerB: 9, counter: 1 }, { ownerA: 5, ownerB: 6, counter: 2 },
];
prim.sortCrisisQueue.push({ entries, out: B.sortCrisisQueue(entries) });
for (const r of [0, 0.4, 1, 1.9, 3, -2, NaN, Infinity]) prim.dobraWolaTurnStep.push({ remaining: r, out: B.dobraWolaTurnStep(r) });
const ownersInfo = [
  { isPlayer: true, isBarbarian: false, isCityCopy: false, eliminated: false, cityCount: 3 },
  { isPlayer: false, isBarbarian: true, isCityCopy: false, eliminated: false, cityCount: 2 },
  { isPlayer: false, isBarbarian: false, isCityCopy: true, eliminated: false, cityCount: 1 },
  { isPlayer: false, isBarbarian: false, isCityCopy: false, eliminated: true, cityCount: 1 },
  { isPlayer: false, isBarbarian: false, isCityCopy: false, eliminated: false, cityCount: 0 },
  { isPlayer: false, isBarbarian: false, isCityCopy: false, eliminated: false, cityCount: 4 },
];
for (const o of ownersInfo) prim.isAiAiEligibleOwner.push({ o, out: B.isAiAiEligibleOwner(o) });
for (const list of [[], [4], [1, 2, 3], [9, 2, 7, 5]]) prim.aiAiPairs.push({ owners: list, out: B.aiAiPairs(list) });
const rawCounters = { '1_2': 3, '0_4': 0, '2_5': -1, '6_7': 2.9, '8_9': 'x' };
prim.parseCrisisCounters.push({ raw: rawCounters, out: Object.entries(B.parseCrisisCounters(rawCounters)) });
writeFileSync(join(outDir, 'primitives.json'), JSON.stringify(prim, jsonSafe, 2) + '\n');

// ---------- phase (transkrypcja runDiplomacyTurnTick, galaz brake) ----------
function runPhase(sc) {
  const counters = new Map(Object.entries(sc.initCounters));
  const atWar = new Set(sc.war);
  const dobra = new Map(Object.entries(sc.initDobra));
  const turns = [];
  for (const t of sc.turns) {
    // runDiplomacyTurnTick: odliczenie dobrej woli kontaktow gracza (P4), potem galaz brake
    const dobraActive = [];
    for (const oid of sc.contacts) {
      const k = pk(sc.meId, oid);
      const rem = dobra.get(k) ?? 0;
      if (rem > 0) {
        const dw = B.dobraWolaTurnStep(rem);
        if (dw.activeThisTurn) dobraActive.push(k);
        dobra.set(k, dw.next);
      }
    }
    const rel = t.rel;
    const paramsOf = (k) => ({ ...p6, kryzysProgZaufania: sc.params[k].prog, kryzysTurDoWojny: sc.params[k].n });
    // diploBrakeCrisisStep
    const crisisStep = (a, b) => {
      const key = pk(a, b);
      const step = B.crisisStepForPair(counters.get(key) ?? 0, rel[key], atWar.has(key), paramsOf(key));
      if (step.counter > 0) counters.set(key, step.counter);
      else counters.delete(key);
    };
    // diploOwnerEligibleForBrake (bez gracza, barbarzyncow, kopii, eliminowanych; miasta > 0)
    const eligible = sc.owners.filter((o) => o !== sc.meId && B.isAiAiEligibleOwner({
      isPlayer: false, isBarbarian: false, isCityCopy: false, eliminated: false, cityCount: sc.cityCount[o] ?? 0,
    }));
    // tickDiploAiAiPairsWithBrake: tick pary (poza zakresem; wynik = rel) + krok kryzysu po kazdej parze
    for (const [a, b] of B.aiAiPairs(eligible)) crisisStep(a, b);
    // diploAiOwnersEligible: krok kryzysu gracz<->AI
    for (const o of eligible) crisisStep(sc.meId, o);
    // processDiploCrisisQueue
    const ready = [];
    for (const [key, counter] of Array.from(counters.entries())) {
      const [sa, sb] = key.split('_').map(Number);
      if (atWar.has(key)) { counters.delete(key); continue; }
      if (counter >= sc.params[key].n) ready.push({ ownerA: sa, ownerB: sb, counter });
    }
    const declarations = [];
    if (ready.length > 0) {
      for (const e of B.sortCrisisQueue(ready)) {
        const key = pk(e.ownerA, e.ownerB);
        if (atWar.has(key)) { counters.delete(key); continue; }
        if ((t.peaceLocked ?? []).includes(key)) continue;
        const out = B.brakeWarOutcome(
          { ownerId: e.ownerA, power: sc.power[e.ownerA] },
          { ownerId: e.ownerB, power: sc.power[e.ownerB] },
          (o) => o === sc.meId,
        );
        if (!out.mayDeclare) continue;
        if ((t.gateBlocked ?? []).includes(`${out.declarer}>${out.victim}`)) continue;
        atWar.add(key);
        counters.delete(key);
        declarations.push({ declarer: out.declarer, victim: out.victim });
      }
    }
    turns.push({
      input: { rel, peaceLocked: t.peaceLocked ?? [], gateBlocked: t.gateBlocked ?? [] },
      expect: {
        dobraActive: dobraActive.sort(cmpKey),
        declarations,
        counters: sortObj(counters),
        atWar: [...atWar].sort(cmpKey),
        dobra: sortObj(dobra),
      },
    });
  }
  return turns;
}

const allAi = (ks, v) => Object.fromEntries(ks.map((k) => [k, v]));
const triPairs = ['1_2', '1_3', '2_3'];
const scenarios = [];
// S1: trzy AI, nieufnosc przez 5 tur -> wojny AI<->AI w porzadku kolejki; silniejszy wypowiada
scenarios.push({
  name: 'ai_ai_five_turns_declare', meId: 0, contacts: [1, 2, 3], owners: [0, 1, 2, 3],
  cityCount: { 1: 2, 2: 2, 3: 2 }, power: { 0: 1, 1: 10, 2: 5, 3: 7 },
  params: Object.fromEntries(['0_1', '0_2', '0_3', ...triPairs].map((k) => [k, { prog: 0, n: 5 }])),
  war: [], initCounters: {}, initDobra: {},
  turns: Array.from({ length: 6 }, () => ({ rel: { ...allAi(triPairs, -1), '0_1': 5, '0_2': 5, '0_3': 5 } })),
});
// S2: gracz silniejszy -> brak automatycznej wojny, licznik rosnie
scenarios.push({
  name: 'player_stronger_no_auto_war', meId: 0, contacts: [1], owners: [0, 1], cityCount: { 1: 3 },
  power: { 0: 20, 1: 5 }, params: { '0_1': { prog: 0, n: 5 } }, war: [], initCounters: {}, initDobra: {},
  turns: Array.from({ length: 7 }, () => ({ rel: { '0_1': -2 } })),
});
// S3: reset licznika po odbudowie zaufania (tura 4 -> 0)
const s3rel = (v01, v12) => ({ rel: { '0_1': v01, '0_2': 3, '1_2': v12 } });
scenarios.push({
  name: 'counter_reset_on_recovery', meId: 0, contacts: [1], owners: [0, 1, 2], cityCount: { 1: 2, 2: 2 },
  power: { 0: 1, 1: 3, 2: 8 },
  params: { '0_1': { prog: 0, n: 5 }, '0_2': { prog: 0, n: 5 }, '1_2': { prog: 0, n: 5 } },
  war: [], initCounters: {}, initDobra: {},
  turns: Array.from({ length: 9 }, (_, i) => (i === 3 ? s3rel(1, 1) : s3rel(-1, -1))),
});
// S4: bramka R1/R2 blokuje deklaracje 2 tury; blokada pokoju 4 tury
scenarios.push({
  name: 'gate_and_peace_lock_delay', meId: 0, contacts: [1], owners: [0, 1, 2], cityCount: { 1: 2, 2: 2 },
  power: { 0: 1, 1: 9, 2: 4 },
  params: { '0_1': { prog: 0, n: 5 }, '0_2': { prog: 0, n: 5 }, '1_2': { prog: 0, n: 2 } },
  war: [], initCounters: {}, initDobra: {},
  turns: Array.from({ length: 6 }, (_, i) => ({
    rel: { '0_1': 9, '0_2': 9, '1_2': -1 },
    gateBlocked: i < 3 ? ['1>2'] : [],
    peaceLocked: i === 3 ? ['1_2'] : [],
  })),
});
// S5: dobra wola odlicza sie 2 tury, potem nieaktywna
scenarios.push({
  name: 'dobra_wola_countdown', meId: 0, contacts: [1, 2], owners: [0, 1, 2], cityCount: { 1: 2, 2: 2 },
  power: { 0: 1, 1: 2, 2: 3 },
  params: { '0_1': { prog: 0, n: 5 }, '0_2': { prog: 0, n: 5 }, '1_2': { prog: 0, n: 5 } },
  war: [], initCounters: {}, initDobra: { '0_1': 2, '0_2': 0 },
  turns: Array.from({ length: 4 }, () => ({ rel: { '0_1': 5, '0_2': 5, '1_2': 5 } })),
});
// S6: wznowienie z zapisu: liczniki i wojna juz zapisane
scenarios.push({
  name: 'resume_from_saved_counters', meId: 0, contacts: [1], owners: [0, 1, 2], cityCount: { 1: 2, 2: 2 },
  power: { 0: 1, 1: 4, 2: 6 },
  params: { '0_1': { prog: 0, n: 5 }, '0_2': { prog: 0, n: 5 }, '1_2': { prog: 0, n: 5 } },
  war: ['0_2'], initCounters: { '1_2': 4, '0_2': 9 }, initDobra: {},
  turns: Array.from({ length: 2 }, () => ({ rel: { '0_1': -1, '0_2': -1, '1_2': -1 } })),
});

const phase = { pin: PIN, scenarios: scenarios.map((sc) => ({ ...sc, turns: runPhase(sc) })) };
writeFileSync(join(outDir, 'phase.json'), JSON.stringify(phase, jsonSafe, 2) + '\n');
console.log('OK primitives groups', Object.keys(prim).length - 1, 'phase scenarios', phase.scenarios.length);
