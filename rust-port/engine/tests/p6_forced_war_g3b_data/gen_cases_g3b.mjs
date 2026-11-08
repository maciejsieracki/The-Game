// P6-FORCED-WAR-MODULES-Q1 (runda 4, partia G3b): generator wektorow cases.json z URUCHOMIONEGO weba.
// Zakres: (1) decyzje "czy szukac" wojny wymuszonej per wlasciciel dla Brazu/Kamienia/Zelaza
// (replika bloku `ownerLoop` z gra/src/main.ts, sekcja "Krok A", ~linie 38870-38990, pin origin/main),
// (2) `sweepStaleForcedWarEntries` (main.ts ~11245), (3) porzadek identyfikatorow `localeCompare`
// (uzywany w forced-war-waves.ts: sortowanie jednostek/miast/fal).
//
// Uzycie (Node 22; pliki webowe: `git archive origin/main gra/src gra/data` rozpakowane POZA repo):
//   node --experimental-strip-types gen_cases_g3b.mjs <DIR>/gra/src <sciezka>/cases.json            # weryfikacja
//   node --experimental-strip-types gen_cases_g3b.mjs <DIR>/gra/src <sciezka>/cases.json --write    # zapis
//
// Prawdziwe funkcje weba: isEligibleFor*ForcedWar, isRestingFrom*ForcedWar (forced-war-bronze/stone/iron.ts).
// Replika ownerLoop/sweep = RECZNIE WYDZIELONA KOPIA (closure'y main.ts zamienione na argumenty; logika 1:1).
// `out` liczony przez web (replika + prawdziwe predykaty). Patche importow jak w G2 (tylko w katalogu tymczasowym).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , srcDir, casesPath, mode] = process.argv;
if (!srcDir || !casesPath) {
  console.error('uzycie: node gen_cases_g3b.mjs <gra/src> <cases.json> [--write]');
  process.exit(2);
}
const write = mode === '--write';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p6fw-g3b-'));
const gameTmp = path.join(tmp, 'game');
fs.mkdirSync(gameTmp, { recursive: true });
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}\n');
const patchRelImports = s => s.replace(/from '\.\/([\w-]+)';/g, "from './$1.ts';");
for (const f of ['forced-war-common.ts', 'forced-war-bronze.ts', 'forced-war-stone.ts', 'forced-war-iron.ts', 'war-rules-multiwar.ts']) {
  let src = fs.readFileSync(path.join(srcDir, 'game', f), 'utf8');
  if (f === 'war-rules-multiwar.ts') {
    const jsonPath = path.join(srcDir, '..', 'data', 'war-rules-params.json');
    const imp = "import warRulesParamsRaw from '../../data/war-rules-params.json';";
    if (!src.includes(imp)) throw new Error('import JSON w war-rules-multiwar.ts nie znaleziony (zmieniony zrodlo weba?)');
    src = src.replace(imp, `const warRulesParamsRaw = ${fs.readFileSync(jsonPath, 'utf8')};`);
  }
  fs.writeFileSync(path.join(gameTmp, f), patchRelImports(src));
}
const bronze = await import(pathToFileURL(path.join(gameTmp, 'forced-war-bronze.ts')).href);
const stone = await import(pathToFileURL(path.join(gameTmp, 'forced-war-stone.ts')).href);
const iron = await import(pathToFileURL(path.join(gameTmp, 'forced-war-iron.ts')).href);

// Stale z webu (literal ze zrodla) -- kontrola zgodnosci z Rust.
const stoneSrc = fs.readFileSync(path.join(srcDir, 'game', 'forced-war-stone.ts'), 'utf8');
const stoneStartM = stoneSrc.match(/WOJNA_KAMIEN_WYMUSZONA_START_TURY\s*=\s*(\d+)/);
if (!stoneStartM) throw new Error('nie znaleziono WOJNA_KAMIEN_WYMUSZONA_START_TURY');
const STONE_START = Number(stoneStartM[1]);
const RESTING = 20; // WOJNA_*_ODPOCZYNEK_TUR (bronze/stone/iron, web)
const isResting = (t, rest) => (rest === null ? false : bronze.isRestingFromBronzeForcedWar(t, rest ?? undefined));

// --- PRNG (deterministyczny) ---
let seed = 20261110;
const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const rndInt = n => Math.floor(rnd() * n);
const pick = arr => arr[rndInt(arr.length)];
const chance = p => rnd() < p;
const maybe = (p, f) => (chance(p) ? f() : null);

// --- 1. Replika decyzji "szukaj" z ownerLoop (main.ts Krok A) ---
function webSearch(era, i) {
  const turn = i.turn;
  const rest = i.rest;
  if (era === 'bronze') {
    const searchingAfterRest = !i.pending && i.cycle && !i.hasActive && !i.alreadyAt && !isResting(turn, rest);
    const should = i.diff !== 1 && (i.pending
      ? bronze.isEligibleForBronzeForcedWar({ isMainAiCiv: true, isAlreadyAtWarAnyRole: i.alreadyAt, currentTurn: turn, eraEnterTurn: i.enter ?? undefined })
      : searchingAfterRest);
    return should && i.flag;
  }
  if (era === 'stone') {
    const armed = turn >= STONE_START && i.epoch === 1 && !i.pending && !i.cycle;
    const wasPending = i.pending || armed;
    const searchingAfterRest = !wasPending && i.cycle && i.epoch === 1 && !i.hasActive && !i.alreadyAt && !isResting(turn, rest);
    return i.diff !== 1 && (wasPending
      ? stone.isEligibleForStoneForcedWar({ isMainAiCiv: true, isStoneEra: i.epoch === 1, currentTurn: turn, isAlreadyAtWarAnyRole: i.alreadyAt })
      : searchingAfterRest);
  }
  // iron (brak progu poziomu trudnosci, jak w main.ts)
  const searchingAfterRest = !i.pending && i.cycle && !i.hasActive && !i.alreadyAt && !isResting(turn, rest);
  const should = i.pending
    ? iron.isEligibleForIronForcedWar({ isMainAiCiv: true, isAlreadyAtWarAnyRole: i.alreadyAt, currentTurn: turn, eraEnterTurn: i.enter ?? undefined })
    : searchingAfterRest;
  return should && i.flag;
}

// --- 2. Replika sweepStaleForcedWarEntries (main.ts) ---
// Wejscie: aktywne pary per epoka (kolejnosc Map: insertion), war = status 'wojna'.
function webSweep(turn, act, rest) {
  const removed = [];
  const wavesDeleted = [];
  const restMaps = { stone: new Map(rest.stone), iron: new Map(rest.iron), bronze: new Map(rest.bronze) };
  const pk = (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`;
  const registries = {};
  for (const era of ['stone', 'iron', 'bronze']) {
    registries[era] = new Map(act[era].map(p => [pk(p.a, p.b), p]));
  }
  const cleanup = era => {
    for (const [key, st] of [...registries[era].entries()]) {
      if (st.war) continue;
      registries[era].delete(key);
      wavesDeleted.push(key);
      restMaps[era].set(st.a, turn + RESTING);
      removed.push({ era, attacker: st.a, target: st.b });
    }
  };
  // Kolejnosc jak w main.ts: stone, iron, bronze.
  cleanup('stone');
  cleanup('iron');
  cleanup('bronze');
  const sortRest = m => [...m.entries()].sort((x, y) => x[0] - y[0]);
  return {
    removed,
    wavesDeleted,
    restStone: sortRest(restMaps.stone),
    restIron: sortRest(restMaps.iron),
    restBronze: sortRest(restMaps.bronze),
    remaining: { stone: registries.stone.size, iron: registries.iron.size, bronze: registries.bronze.size },
  };
}

// --- 3. Generatory ---
const OWNERS = [0, 1, 2, 3, 4, 5];
function randPairs(n) {
  const out = [];
  const used = new Set();
  let guard = 0;
  while (out.length < n && guard++ < 200) {
    const a = pick(OWNERS);
    const b = pick(OWNERS);
    if (a === b) continue;
    const k = `${Math.min(a, b)}-${Math.max(a, b)}`;
    if (used.has(k)) continue;
    used.add(k);
    out.push({ a, b, war: chance(0.6) });
  }
  return out;
}

const cases = [];
for (let n = 0; n < 240; n++) {
  const era = pick(['bronze', 'stone', 'iron']);
  const turn = rndInt(300);
  const i = {
    turn,
    diff: pick([0, 1, 2, 3]),
    pending: chance(0.3),
    cycle: chance(0.35),
    hasActive: chance(0.2),
    alreadyAt: chance(0.3),
    rest: maybe(0.4, () => turn - 15 + rndInt(40)),
    enter: maybe(0.7, () => turn - rndInt(60)),
    epoch: pick([1, 2, 3]),
    flag: chance(0.8),
  };
  cases.push({ kind: 'search', era, input: i, out: webSearch(era, i) });
}
for (let n = 0; n < 120; n++) {
  const turn = rndInt(300);
  const act = { stone: randPairs(rndInt(4)), iron: randPairs(rndInt(4)), bronze: randPairs(rndInt(4)) };
  const rest = { stone: [], iron: [], bronze: [] };
  for (const e of ['stone', 'iron', 'bronze']) {
    for (const o of OWNERS.slice(0, rndInt(4))) if (chance(0.5)) rest[e].push([o, turn + rndInt(30)]);
  }
  cases.push({ kind: 'sweep', input: { turn, active: act, rest }, out: webSweep(turn, act, rest) });
}

// --- 4. Porzadek identyfikatorow (localeCompare; lokal domyslny Node = ICU root/en) ---
const ID_ALPHA = 'aAbBzZ09_-';
const fixedIds = ['u1', 'u2', 'u10', 'u15', 'c1', 'c4', 'city0', 'city10', 'city2', 'bronze-1', 'bronze-10', 'bronze-2',
  'dip_5_1', 'dip_51_1', 'dip_5_10', 'dip_5_2', 'dip_510_1', 'Ab', 'aB', 'ab', 'a_b', 'a-b', 'a1', 'A1', 'a', 'A', 'B', 'b', '_x', '-x', '1x', 'x_', 'x-', 'x'];
const idPool = [...fixedIds];
for (let n = 0; n < 160; n++) {
  let s = '';
  const len = 1 + rndInt(7);
  for (let k = 0; k < len; k++) s += ID_ALPHA[rndInt(ID_ALPHA.length)];
  idPool.push(s);
}
const idcmp = [];
for (const a of idPool) for (const b of idPool.slice(0, 60)) {
  idcmp.push({ a, b, sign: Math.sign(a.localeCompare(b)) });
}
// Pomiar dodatkowy (nie wektor): rozbieznosc root/en vs pl dla tego alfabetu.
const plColl = new Intl.Collator('pl');
let plDiff = 0;
for (const a of idPool) for (const b of idPool) if (Math.sign(plColl.compare(a, b)) !== Math.sign(a.localeCompare(b))) plDiff++;
console.log(`idcmp: ${idcmp.length} par; roznic root/en vs pl (pomiar, nie wektor): ${plDiff}`);

const payload = { source: 'web: gra/src/game/forced-war-{bronze,stone,iron}.ts (prawdziwe) + replika main.ts ownerLoop/sweep + localeCompare', cases, idcmp };
const json = JSON.stringify(payload);
const counts = {};
for (const c of cases) { const k = c.kind + ':' + (c.era ?? ''); counts[k] = (counts[k] ?? 0) + 1; }
console.log('przypadki:', counts, 'search-true:', cases.filter(c => c.kind === 'search' && c.out).length);
if (write) {
  fs.writeFileSync(casesPath, json + '\n');
  console.log('zapisano', casesPath);
} else {
  const existing = fs.existsSync(casesPath) ? fs.readFileSync(casesPath, 'utf8').trim() : '';
  if (existing !== json.trim()) { console.error('ROZNICA wzgledem pliku wektorow'); process.exit(1); }
  console.log('weryfikacja OK (plik zgodny z webem)');
}
