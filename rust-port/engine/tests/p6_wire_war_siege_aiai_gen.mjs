// R-RUSTPORT-P6-WIRE-WAR-SIEGE-AIAI-TURN-Q1 (W7): generator wektorow z URUCHOMIONEGO weba na PINIE
// 07d2fbd72f758705f8e1d59cc4968027ffbafe75.
//
// Zrodla webowe wykonywane przez esbuild (bundle poza repo, jak p6_w6s_*_gen.mjs):
//   * gra/src/game/siege-starvation.ts        -> siegeStarvationState (decyzja glodu, sekcja 1);
//   * gra/src/game/diplomacy-ai-forced-peace.ts -> runAiAiPeaceTick (z peaceAllowed, sekcja 2).
// Sekcja 1 (`siege`): skladanie decyzji tury oblezenia to transkrypcja bloku N3 z `gra/src/main.ts`
// (ok. :38825-38875 w pinie) wokol PRAWDZIWEGO `siegeStarvationState` z bundla. Atrycja jest podawana
// jako gotowy garnizon PO atrycji (wynik `applyArmyStarvationHpLoss` nie jest tu powtarzany).
// Sekcja 2 (`peace`): `runAiAiPeaceTick` jest wykonywany bez zmian; `peaceAllowed` z main.ts (turnsAtWar >= 10).
// Sekcja 3 (`pairs`): zbieranie par wojny z `tickAiAiWarWeariness` (main.ts) - transkrypcja petli.
//
// Uzycie (esbuild 0.25.0 w katalogu <esbuildDir>, pin rozpakowany poza repo):
//   node tests/p6_wire_war_siege_aiai_gen.mjs <katalog gra/src z pinu> <katalog z node_modules/esbuild> \
//     > tests/p6_wire_war_siege_aiai_vectors/vectors.json
// Katalog gra/src: `git archive 07d2fbd72f758705f8e1d59cc4968027ffbafe75 gra/src gra/data` rozpakowany poza repo.

import { createRequire } from 'node:module';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [webSrc, esbuildDir] = process.argv.slice(2);
if (!webSrc || !esbuildDir) throw new Error('podaj katalog gra/src z pinu i katalog z esbuild');

const require = createRequire(path.join(esbuildDir, 'package.json'));
const { buildSync } = require('esbuild');
const outDir = mkdtempSync(path.join(tmpdir(), 'p6-w7-'));

function bundle(entry, name) {
  const outFile = path.join(outDir, name);
  buildSync({
    entryPoints: [path.join(webSrc, entry)],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    write: true,
    outfile: outFile,
    logLevel: 'silent',
  });
  return import(pathToFileURL(outFile).href);
}

const starv = await bundle('game/siege-starvation.ts', 'siege-starvation.mjs');
const peace = await bundle('game/diplomacy-ai-forced-peace.ts', 'diplomacy-ai-forced-peace.mjs');
const { siegeStarvationState } = starv;
const { runAiAiPeaceTick, AI_AI_PEACE_MIN_BALANCE } = peace;
if (typeof siegeStarvationState !== 'function') throw new Error('brak siegeStarvationState');
if (typeof runAiAiPeaceTick !== 'function') throw new Error('brak runAiAiPeaceTick');

// Deterministyczny PRNG (mulberry32) - ziarna niezalezne per sekcja.
const makeRnd = (initialSeed) => {
  let seed = initialSeed;
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const pick = (rnd, xs) => xs[Math.floor(rnd() * xs.length)];
const int = (rnd, lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

// ---- Sekcja 1: siege (decyzja tury oblezenia, transkrypcja N3 z main.ts) ----
// Web: zob. main.ts blok "N3: TURA OBLEZENIA" - kolejnosc: st0 -> (recordStart | attrition) -> legacy | surrender.
function webSiegeTurn(city, garrisonBefore, food, getMaxHp, garrisonAfterFn) {
  const params = { food, getMaxHp };
  const st0 = siegeStarvationState(city, garrisonBefore, params);
  let surrenderNow = st0.surrender;
  let attrition = false;
  let startMaxHp = null;
  if (st0.recordStart) {
    startMaxHp = st0.startMaxHp ?? null;
  } else if (st0.applyAttrition && !st0.surrender) {
    attrition = true;
    surrenderNow = siegeStarvationState(city, garrisonAfterFn(), params).surrender;
  }
  const legacy = !!st0.setLegacyPending;
  const surrender = !legacy && !!surrenderNow;
  return {
    recordStart: !!st0.recordStart,
    startMaxHp,
    attrition,
    legacy,
    surrender,
  };
}

const TYPES = { 'Lucznik': 6, 'Miecznik': 10, 'Katapulta': 4, 'Osadnik': 3 };
const rndS = makeRnd(0x5eed7001);
const siegeCases = [];
for (let c = 0; c < 400; c++) {
  const typeIds = Object.keys(TYPES);
  const n = int(rndS, 0, 5);
  const units = [];
  for (let i = 0; i < n; i++) {
    const u = {};
    const typeId = pick(rndS, typeIds);
    if (rndS() < 0.7) u.typeId = typeId;
    if (rndS() < 0.6) u.hpMax = pick(rndS, [0, 4, 6, 10, 12]);
    if (rndS() < 0.85) u.hp = pick(rndS, [0, 1, 2, 3, 5, 6, 8, 10, 12, 0.5]);
    units.push(u);
  }
  const startVariants = [undefined, undefined, 10, 20, 0, 40];
  const city = {
    oblegane: rndS() < 0.9 ? true : pick(rndS, [false, undefined]),
    siegeCapitulationPending: rndS() < 0.08 ? true : undefined,
    siegeStarveStartMaxHp: pick(rndS, startVariants),
  };
  const food = pick(rndS, [0, 0, 0, 3, -1, NaN, 12]);
  const glodOblezenia = rndS() < 0.2;
  const magazynVariants = [undefined, null, 0, 5];
  const magazyn = pick(rndS, magazynVariants);
  // Zapas zastepowany przez `starvationFood` jak w main.ts; tu podajemy wartosc koncowa dla decyzji.
  const foodForState = glodOblezenia ? 0 : (magazyn ?? food);
  // Garnizon po atrycji: podzbior z pomniejszonym hp (wolajacy usuwa zabite jednostki).
  const after = units
    .filter(() => rndS() < 0.85)
    .map(u => ({ ...u, hp: u.hp === undefined ? undefined : Math.max(0, u.hp - pick(rndS, [0, 1, 2])) }));
  const getMaxHpTable = { Lucznik: 6, Miecznik: 10, Katapulta: 4, Osadnik: 3 };
  const getMaxHp = (t) => getMaxHpTable[t] ?? 0;
  const dec = webSiegeTurn(city, units, foodForState, getMaxHp, () => after);
  siegeCases.push({
    city: {
      oblegane: city.oblegane ?? null,
      siegeCapitulationPending: city.siegeCapitulationPending ?? null,
      siegeStarveStartMaxHp: city.siegeStarveStartMaxHp ?? null,
    },
    garrisonBefore: units.map(u => ({
      hp: u.hp ?? null,
      hpMax: u.hpMax ?? null,
      typeId: u.typeId ?? null,
    })),
    garrisonAfter: after.map(u => ({
      hp: u.hp ?? null,
      hpMax: u.hpMax ?? null,
      typeId: u.typeId ?? null,
    })),
    food: Number.isNaN(foodForState) ? 'NaN' : foodForState,
    getMaxHp: getMaxHpTable,
    expected: dec,
  });
}

// ---- Sekcja 2: peace (runAiAiPeaceTick z peaceAllowed) ----
const OWNERS = [0, 1, 2, 3, 4];
const key = (a, b) => `${a},${b}`;
const rndP = makeRnd(0x5eed7002);
const peaceCases = [];
for (let c = 0; c < 300; c++) {
  const pairEligible = {};
  const share = {};
  const turnsAtWar = {};
  const gate = {};
  const price = {};
  const assets = {};
  const cityOk = {};
  for (const a of OWNERS) for (const b of OWNERS) {
    if (a === b) continue;
    pairEligible[key(a, b)] = rndP() < 0.8;
    share[key(a, b)] = pick(rndP, [0.2, 0.35, 0.5, 0.55, 0.6, 0.7, 0.9, rndP()]);
    turnsAtWar[key(a, b)] = pick(rndP, [0, 3, 9, 10, 11, 20, 2.5 * rndP() * 10]);
    gate[key(a, b)] = pick(rndP, ['ok', 'ok', 'too_early', 'stronger']);
    price[key(a, b)] = {
      requiredPn: pick(rndP, [0, 40, 120, 300, 500, Math.floor(rndP() * 900)]),
      tolerancePn: pick(rndP, [0, 5, 25]),
      balance0: Math.round((rndP() * 600 - 300) * 100) / 100,
      slope: Math.round((rndP() * 4 - 2) * 100) / 100,
      lbalance0: Math.round((rndP() * 600 - 300) * 100) / 100,
      lslope: Math.round((rndP() * 4 - 2) * 100) / 100,
    };
    const list = [];
    if (rndP() < 0.8) list.push({ kind: 'zloto', id: 'zloto', amount: int(rndP, 0, 400), pn: int(rndP, 0, 400) });
    const res = ['zelazo', 'wino', 'drewno'];
    for (const r of res) if (rndP() < 0.4) list.push({ kind: 'surowiec_ilosc', id: r, amount: int(rndP, 1, 9), pn: int(rndP, 5, 120) });
    const nCity = int(rndP, 0, 2);
    for (let i = 0; i < nCity; i++) {
      const cid = `c${a}${b}${i}`;
      list.push({ kind: 'miasto', id: cid, amount: 1, pn: int(rndP, 30, 300), forbidden: rndP() < 0.2 ? true : undefined });
      cityOk[`${cid}|${a}|${b}`] = rndP() < 0.7;
    }
    assets[key(a, b)] = list;
  }
  // Kolejnosc wpisow magazynu jak w Map (wstawianie).
  const entries = [];
  const nEntries = int(rndP, 1, 5);
  const used = new Set();
  for (let i = 0; i < nEntries; i++) {
    const r = pick(rndP, OWNERS);
    const o = pick(rndP, OWNERS.filter(x => x !== r));
    const k = `${Math.min(r, o)}-${Math.max(r, o)}:${r}`;
    if (used.has(k)) continue;
    used.add(k);
    entries.push({
      pairKey: k,
      requesterId: r,
      otherId: o,
      sinceTurn: int(rndP, 0, 30),
      kind: rndP() < 0.8 ? 'pokoj' : 'rozejm',
    });
  }
  const turn = int(rndP, 10, 60);
  const battlePending = rndP() < 0.15;
  const peaceAllowedFor = (loser, winner) => turnsAtWar[key(loser, winner)] >= 10;
  const store = new Map(entries.map(e => [e.pairKey, { requesterId: e.requesterId, otherId: e.otherId, sinceTurn: e.sinceTurn, kind: e.kind }]));
  const payLog = [];
  const finLog = [];
  const outcomes = runAiAiPeaceTick({
    store,
    turn,
    pairEligible: (a, b) => pairEligible[key(a, b)],
    requesterShareOf: (rq, ot) => share[key(rq, ot)],
    gateVerdict: (w, l) => gate[key(w, l)],
    peaceAllowed: (loser, winner) => peaceAllowedFor(loser, winner),
    price: (w, l) => {
      const p = price[key(w, l)];
      return {
        requiredPn: p.requiredPn,
        balanceFor: (covered) => p.balance0 + p.slope * covered,
        loserBalanceFor: (covered) => p.lbalance0 + p.lslope * covered,
        tolerancePn: p.tolerancePn,
      };
    },
    assets: (loser, winner, skip) =>
      assets[key(loser, winner)]
        .filter(a => !(a.kind === 'miasto' && skip.has(a.id)))
        .map(a => ({ ...a, forbidden: a.forbidden ?? undefined })),
    cityCessionOk: (cid, loser, winner) => cityOk[`${cid}|${loser}|${winner}`] === true,
    battlePending,
    pay: (loser, winner, plan) => payLog.push({ loser, winner, coveredPn: plan.coveredPn, ids: plan.items.map(i => i.id) }),
    finalize: (loser, winner, kind) => finLog.push({ loser, winner, kind }),
    log: () => {},
  });
  peaceCases.push({
    pairEligible, share, turnsAtWar, gate, price, assets, cityOk,
    turn, battlePending,
    minBalancePn: AI_AI_PEACE_MIN_BALANCE,
    entries: entries.map(e => ({
      pairKey: e.pairKey,
      requesterId: e.requesterId,
      otherId: e.otherId,
      sinceTurn: e.sinceTurn,
      kind: e.kind,
    })),
    expected: {
      outcomes: outcomes.map(o => ({
        pairKey: o.pairKey,
        action: o.action,
        kind: o.kind ?? 'pokoj',
        coveredPn: o.plan ? o.plan.coveredPn : null,
        ids: o.plan ? o.plan.items.map(i => i.id) : null,
      })),
      remainingKeys: Array.from(store.keys()),
      pay: payLog,
      finalize: finLog,
    },
  });
}

// ---- Sekcja 3: pairs (transkrypcja petli tickAiAiWarWeariness) ----
const rndW = makeRnd(0x5eed7003);
const pairCases = [];
for (let c = 0; c < 200; c++) {
  const pool = [0, 1, 2, 3, 4, 5, 6, 7];
  const majors = pool.filter(() => rndW() < 0.6);
  // Kolejnosc wejscia celowo losowa (web sortuje).
  for (let i = majors.length - 1; i > 0; i--) {
    const j = Math.floor(rndW() * (i + 1));
    [majors[i], majors[j]] = [majors[j], majors[i]];
  }
  const warTable = {};
  for (const a of pool) for (const b of pool) if (a !== b) warTable[key(a, b)] = rndW() < 0.4;
  // Transkrypcja main.ts: sort + pary i<j, status 'wojna' (kierunek a,b).
  const sorted = majors.slice().sort((x, y) => x - y);
  const pairs = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      if (warTable[key(a, b)]) pairs.push([a, b]);
    }
  }
  pairCases.push({ majors, warTable, expected: pairs });
}

const vectors = {
  generator: 'p6_wire_war_siege_aiai_gen.mjs',
  pin: '07d2fbd72f758705f8e1d59cc4968027ffbafe75',
  siege: siegeCases,
  peace: peaceCases,
  pairs: pairCases,
};
process.stdout.write(JSON.stringify(vectors) + '\n');
