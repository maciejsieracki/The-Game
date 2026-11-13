'use strict';
/**
 * ai-move-range-terrain-bench.cjs -- R-WEB-AI-MOVE-RANGE-Q1 r3 (Z3): pomiar PRZED/PO na mapie Z TERENEM.
 *
 * Uruchom z gra/:
 *   MR_PRE_SRC=<katalog z gra/src bazy PRZED zmiana> node tools/ai-move-range-terrain-bench.cjs
 * Baza PRZED: `git archive fcd86933 gra/src gra/data` (wypakowane do katalogu tymczasowego).
 * Bez MR_PRE_SRC: tylko PO (HEAD) -- bez porownania.
 *
 * Mierzy (bez main.ts): decideAITurn (ogolne AI oraz planer wojny, gdy modul istnieje),
 * decideBarbarianMoves oraz egzekutor komendy move (executeAiCityMove, jak wiring w main.ts,
 * truncatePath tylko gdy istnieje w danym drzewie). Mapa 40x20: laka, wzgorza (koszt 2),
 * lasy (nakladka). Metryki: srednio heksow na jednostke na ture (0 dla jednostki bez ruchu),
 * srednio wykorzystany budzet (suma kosztu terenu trasy / budzet), udzial jednostek bez ruchu,
 * czas na ture (ms) i hash stanu po 2 przebiegach (determinizm).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const H = require('./war-allin-capital-harness.cjs');

const GRA = path.resolve(__dirname, '..');
const W = 40;
const HG = 20;
const TURNS = 8;
const BUDGETS = [2, 5, 8];

/** Buduje bundle z dowolnego drzewa gra/src (PRZED albo PO). */
function bundle(srcDir, tag) {
  const J = (p) => JSON.stringify(path.join(srcDir, p));
  const has = (p) => fs.existsSync(path.join(srcDir, p));
  const entry = path.resolve(__dirname, `.ai-mr-bench-${tag}-entry.ts`);
  const out = path.resolve(__dirname, `.ai-mr-bench-${tag}-bundle.cjs`);
  const lines = [
    `export { decideAITurn } from ${J('game/ai')};`,
    `export { decideBarbarianMoves, FALLBACK_BARB_PARAMS, BARBARIAN_OWNER_ID } from ${J('game/barbarians')};`,
    `export { computePath, terrainMoveCost, keyOf, hexDistance } from ${J('units/setup')};`,
    `export { executeAiCityMove } from ${J('game/ai-city-capture-executor')};`,
  ];
  if (has('game/ai-move-range.ts')) lines.push(`export { truncatePathWithinBudget } from ${J('game/ai-move-range')};`);
  if (has('game/warAllInCapital.ts')) lines.push(`export { setWarAllInCapitalOverride } from ${J('game/warAllInCapital')};`);
  fs.writeFileSync(entry, lines.join('\n') + '\n', 'utf8');
  try {
    esbuild.buildSync({
      entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      outfile: out, absWorkingDir: GRA, logLevel: 'silent',
    });
    const m = require(out);
    m.hasWar = has('game/warAllInCapital.ts');
    m.hasRange = has('game/ai-move-range.ts');
    return m;
  } finally {
    for (const f of [entry, out]) { try { fs.unlinkSync(f); } catch (_) { /* brak */ } }
  }
}

/** Mapa 40x20 z terenem: wzgorza (koszt 2) i lasy (nakladka) -- deterministyczny wzor. */
function buildMap() {
  const map = H.makeMap(W, HG);
  for (let q = 0; q < W; q++) {
    for (let r = 0; r < HG; r++) {
      const hex = map.hexes[`${q},${r}`];
      const h = (q * 7 + r * 13) % 17;
      if (h === 0 || h === 5) hex.terenBazowy = 'wzgorza';
      if ((q * 3 + r * 5) % 7 === 0) hex.nakladka = 'las';
    }
  }
  return map;
}

function hashOf(obj) {
  return crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex').slice(0, 16);
}

/**
 * Jeden przebieg: TURNS tur. Kazda tura: ruchLeft = budzet, decyzja (AI lub barbarzynca),
 * potem egzekutor komend move w kolejnosci (jak main.ts: blockedKeys = pozycje innych jednostek).
 */
function runScenario(E, scenario, budget, turns = TURNS) {
  const map = buildMap();
  const aiUnits = [];
  for (let i = 0; i < 10; i++) aiUnits.push(H.mkUnit(`a${i}`, 1, 4, 2 * i));
  const enemyUnits = [H.mkUnit('e0', 2, 30, 8), H.mkUnit('e1', 2, 30, 12)];
  const cities = [
    { id: 'c1', ownerId: 1, q: 3, r: 10, name: 'c1', population: 5 },
    { id: 'c2', ownerId: 2, q: 34, r: 10, name: 'c2', population: 5 },
  ];
  const barbs = [];
  for (let i = 0; i < 10; i++) {
    barbs.push({ id: `b${i}`, ownerId: E.BARBARIAN_OWNER_ID, typeId: 'Wojownik', category: 'miecznik', q: 16, r: 2 * i, ruch: budget, ruchLeft: budget });
  }
  const barbEnemy = [
    { id: 'g0', ownerId: 0, typeId: 'Hastati', category: 'miecznik', q: 30, r: 8, ruch: 2, ruchLeft: 2 },
  ];
  const barbCities = [{ id: 'cb', q: 34, r: 10, ownerId: 0, name: 'cb' }];
  const visible = new Set();
  for (let q = 0; q < W; q++) for (let r = 0; r < HG; r++) visible.add(`${q},${r}`);
  const all = scenario === 'barb' ? barbs.concat(barbEnemy) : aiUnits.concat(enemyUnits);
  const log = [];
  let hexesDecide = 0, hexesExec = 0, budgetUsed = 0, moves = 0, unitsN = 0, idle = 0, decideMs = 0, execMs = 0;
  if (scenario === 'war') E.setWarAllInCapitalOverride(true);
  for (let t = 1; t <= turns; t++) {
    const mine = scenario === 'barb' ? barbs : aiUnits;
    for (const u of mine) u.ruchLeft = budget;
    const t0 = process.hrtime.bigint();
    let cmds;
    if (scenario === 'barb') {
      const P = Object.assign({}, E.FALLBACK_BARB_PARAMS, { aggroRadius: 20 });
      cmds = E.decideBarbarianMoves(barbs, barbEnemy, barbCities, [], map, P, undefined, 'normal', t)
        .filter((c) => c.type === 'move' || c.type === 'raid')
        .map((c) => ({ type: 'move', unitId: c.unitId, toQ: c.toQ, toR: c.toR }));
    } else {
      const warAllIn = scenario === 'war'
        ? { targets: [{ ownerId: 2, cityId: 'c2', q: 34, r: 10 }] } : undefined;
      cmds = E.decideAITurn(1, aiUnits, cities, map, H.DATA, {
        canEngageOwner: (x) => x === 2, currentTurn: t, visibleHexes: visible, warAllIn,
      });
    }
    const t1 = process.hrtime.bigint();
    decideMs += Number(t1 - t0) / 1e6;
    const moveCmds = cmds.filter((c) => c.type === 'move' && mine.some((u) => u.id === c.unitId));
    // Dystans decyzji (komenda bez wykonania), koszt trasy liczony na tej samej mapie.
    for (const u of mine) {
      unitsN++;
      const c = moveCmds.find((x) => x.unitId === u.id);
      if (!c) { idle++; continue; }
      const d = E.hexDistance(u.q, u.r, c.toQ, c.toR);
      hexesDecide += d;
    }
    // Egzekutor: sekwencyjnie, jak main.ts.
    const e0 = process.hrtime.bigint();
    for (const c of moveCmds) {
      const u = mine.find((x) => x.id === c.unitId);
      const others = new Set(all.filter((x) => x.id !== u.id && x.hp !== 0).map((x) => E.keyOf(x.q, x.r)));
      const before = { q: u.q, r: u.r };
      const pathCost = E.computePath(u, map, c.toQ, c.toR, others)
        .reduce((s, h) => s + E.terrainMoveCost(map.hexes[E.keyOf(h.q, h.r)]), 0);
      const x0 = process.hrtime.bigint();
      const exOpts = {
        command: c, unit: u, cities: [], cityBuiltIds: [], hasCityDefenders: false, unitIsCivilian: false,
        targetVisible: true, canOccupyCityHex: true, blockedKeys: others, destinationKey: E.keyOf(c.toQ, c.toR),
        computePath: (uu, tq, tr, occ) => E.computePath(uu, map, tq, tr, occ),
      };
      if (E.truncatePathWithinBudget) {
        exOpts.truncatePath = (full) => (u.ruchLeft > 0 ? E.truncatePathWithinBudget(full, u.ruchLeft, map) : full);
      }
      const budgetBefore = u.ruchLeft;
      const res = E.executeAiCityMove(exOpts);
      execMs += Number(process.hrtime.bigint() - x0) / 1e6;
      if (res.moved) {
        moves++;
        const dd = E.hexDistance(before.q, before.r, u.q, u.r);
        hexesExec += dd;
        budgetUsed += budgetBefore > 0 ? pathCost / budgetBefore : 0;
        log.push([u.id, before.q, before.r, u.q, u.r]);
      }
      u.ruchLeft = 0;
    }
    void e0;
    log.push(['cmds', moveCmds.map((c) => [c.unitId, c.toQ, c.toR])]);
  }
  if (scenario === 'war') E.setWarAllInCapitalOverride(null);
  return {
    decidePerUnit: hexesDecide / unitsN,
    execPerUnit: hexesExec / unitsN,
    execPerMove: moves > 0 ? hexesExec / moves : 0,
    budgetPerMove: moves > 0 ? budgetUsed / moves : 0,
    movedPct: (100 * moves) / unitsN,
    idlePct: (100 * idle) / unitsN,
    msPerTurn: (decideMs + execMs) / turns,
    decideMsPerTurn: decideMs / turns,
    execMsPerTurn: execMs / turns,
    hash: hashOf(log),
  };
}

function median(xs) { const a = xs.slice().sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; }

function main() {
  const PO = bundle(path.resolve(GRA, 'src'), 'po');
  const preDir = process.env.MR_PRE_SRC;
  const PRE = preDir ? bundle(path.resolve(preDir), 'pre') : null;
  console.log(`engines: PO hasWar=${PO.hasWar} hasRange=${PO.hasRange}; PRE=${PRE ? `hasWar=${PRE.hasWar} hasRange=${PRE.hasRange}` : 'brak (MR_PRE_SRC nie podano)'}`);
  const scenarios = ['ai', 'barb', 'war'];
  const REPS = 5;
  const f = (x) => x.toFixed(2);
  for (const sc of scenarios) {
    if (sc === 'war' && !PO.hasWar) continue;
    for (const B of BUDGETS) {
      const po1 = runScenario(PO, sc, B);
      const po2 = runScenario(PO, sc, B);
      let pre = null;
      const poMs = [po1.msPerTurn];
      const preMs = [];
      if (PRE) {
        pre = runScenario(PRE, sc, B);
        preMs.push(pre.msPerTurn);
        for (let k = 0; k < REPS; k++) {
          poMs.push(runScenario(PO, sc, B).msPerTurn);
          preMs.push(runScenario(PRE, sc, B).msPerTurn);
        }
      }
      const mine = po1;
      const t1po = [], t1pre = [];
      for (let k = 0; k < REPS + 1; k++) {
        t1po.push(runScenario(PO, sc, B, 1).msPerTurn);
        if (PRE) t1pre.push(runScenario(PRE, sc, B, 1).msPerTurn);
      }
      const det = po1.hash === po2.hash ? 'OK' : 'MISMATCH';
      let line = `[${sc} B=${B}] PO: hex/jedn decyzja=${f(mine.decidePerUnit)} wykonanie=${f(mine.execPerUnit)} `
        + `hex/ruch=${f(mine.execPerMove)} budzet/ruch=${f(mine.budgetPerMove)} ruszylo=${mine.movedPct.toFixed(0)}% bez_ruchu=${mine.idlePct.toFixed(0)}% `
        + `hash=${mine.hash} det=${det}`;
      if (pre) {
        line += ` | PRE: decyzja=${f(pre.decidePerUnit)} wykonanie=${f(pre.execPerUnit)} hex/ruch=${f(pre.execPerMove)} `
          + `budzet/ruch=${f(pre.budgetPerMove)} ruszylo=${pre.movedPct.toFixed(0)}% bez_ruchu=${pre.idlePct.toFixed(0)}% hash=${pre.hash}`
          + ` | ms/ture mediana ${REPS + 1}x: PO=${f(median(poMs))} PRE=${f(median(preMs))} stosunek=${f(median(poMs) / median(preMs))}`
          + ` [decyzja PO=${f(po1.decideMsPerTurn)} PRE=${f(pre.decideMsPerTurn)}; wykonanie PO=${f(po1.execMsPerTurn)} PRE=${f(pre.execMsPerTurn)}]`
          + ` | tura 1 (ten sam stan) mediana: PO=${f(median(t1po))} PRE=${f(median(t1pre))} stosunek=${f(median(t1po) / median(t1pre))}`;
      } else {
        line += ` | ms/ture PO=${f(po1.msPerTurn)}`;
      }
      console.log(line);
    }
  }
  for (const fn of fs.readdirSync(__dirname)) {
    if (fn.startsWith('.ai-mr-bench-')) { try { fs.unlinkSync(path.join(__dirname, fn)); } catch (_) { /* brak */ } }
  }
}

main();
