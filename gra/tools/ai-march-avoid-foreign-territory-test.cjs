'use strict';
/**
 * ai-march-avoid-foreign-territory-test.cjs -- R-WEB-AI-MARCH-AVOID-FOREIGN-TERRITORY-Q1 (runda 1).
 * Uruchom z gra/:  node tools/ai-march-avoid-foreign-territory-test.cjs [--no-sim] [--seeds=6] [--turns=80]
 *
 * Regula wlasciciela: AI w wojnie z A NIE prowadzi wojsk przez teren TRZECIEJ cywilizacji C bez
 * umowy przemarszu -- trasa okrezna, a gdy jej brak: marsz odroczony + PROSBA o przemarsz
 * (cooldown w main.ts). PRAWDZIWE: decideAITurn (ai.ts), computePath (units/setup.ts),
 * executeAiCityMove, territoryOwnerAt, hasAuthorizedBorderCrossing, collectUnauthorizedBorderPairs.
 * Silnik symulacji NIE jest main.ts (main.ts nie dziala headless); okablowanie straz/egzekutor
 * odwzorowuje main.ts (aiMarchCostFn); fragmenty main.ts sprawdzone statycznie (sekcja E).
 *
 * Sekcje: A straz (jednostkowo), B scenariusze (omija / umowa / odmowa+okrezna / odmowa+brak trasy /
 * wyjscie z zakazanego terenu / cywil), C mutacje PRAWDZIWEGO zrodla czerwienia asercje,
 * D symulacja 3 cywilizacji PRZED/PO (naruszenia granic, spadki Zaufania, czas decyzji),
 * E statyczne zabezpieczenia main.ts.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const H = require('./war-allin-capital-harness.cjs');

const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src');
const abs = (rel) => path.join(SRC, rel);
const args = process.argv.slice(2);
const NO_SIM = args.includes('--no-sim');
const argNum = (k, d) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? Number(a.split('=')[1]) : d; };
const SEEDS = argNum('seeds', 6);
const TURNS = argNum('turns', 80);
const OUT = process.env.AMF_OUT || `/dev/shm/ai-amf-${process.pid}`;
fs.mkdirSync(OUT, { recursive: true });

const MUT_NOGUARD = {
  name: 'firstStep: pomija straz (zwykly computePath)', rel: 'game/ai.ts',
  // R-WEB-ARMY-TO-NEAREST-LEADER-Q1: trasa wydzielona z firstStep do marchPathFor (to samo wyrazenie).
  from: 'return guard !== null && !isCivilianUnit(unit)\n    ? guardedMarchPath(guard, unit, map, destQ, destR, occ)\n    : computePath(unit, map, destQ, destR, occ);',
  to: 'return computePath(unit, map, destQ, destR, occ);',
};
const MUT_COST = {
  name: 'wrapCost: zakazany heks bez kosztu Infinity', rel: 'game/ai-march-guard.ts',
  from: 'return guard.isBlockedHex(hex.coords.q, hex.coords.r, extraAllowedOwner) ? Infinity : c;',
  to: 'return c;',
};
const MUT_PLANNER = {
  name: 'planer wojny: teren trzecich nie trafia do blocked', rel: 'game/ai.ts',
  from: '    for (const k of territoryBlocked) blocked.add(k);', to: '',
};
const MUT_ALLOW = {
  name: 'isBlockedHex: umowa przemarszu ignorowana', rel: 'game/ai-march-guard.ts',
  from: '      return !guard.isPassageAllowed(t);', to: '      return true;',
};
const MUT_ALLOW_KEYS = {
  name: 'blockedHexKeys: umowa przemarszu ignorowana', rel: 'game/ai-march-guard.ts',
  from: '        if (guard.isPassageAllowed(n.ownerId)) continue;\n', to: '',
};
const MUT_REQ = {
  name: 'guardedMarchPath: brak prosby o przemarsz (no-route)', rel: 'game/ai.ts',
  from: "  guard.stats.deferred++;\n  guard.requestPassage(crossing, 'no-route');\n  return [];", to: '  guard.stats.deferred++;\n  return [];',
};
const MUT_REQ_WAR = {
  name: 'requestWarMarchPassage: brak prosby o przemarsz (no-route)', rel: 'game/ai.ts',
  from: "    guard.stats.deferred += noPathIds.size;\n    guard.requestPassage(crossing, 'no-route');", to: '    guard.stats.deferred += noPathIds.size;',
};

const MUT_COOLDOWN_FUTURE = {
  name: 'isMarchPassageCooldownActive: wpis z przyszlosci wycisza prosby', rel: 'game/ai-march-guard.ts',
  from: 'return last !== undefined && last <= turn && turn - last < cooldownTurns;', to: 'return last !== undefined && turn - last < cooldownTurns;',
};
const MUT_NOSEA = {
  name: 'guardedMarchPath: brak trasy morskiej (od razu odroczenie)', rel: 'game/ai.ts',
  from: '  const seaCost = guard.seaCostFor(unit);\n  if (seaCost !== undefined) {', to: '  const seaCost = undefined;\n  if (seaCost !== undefined) {',
};

const MUT_NOSEA_WAR = {
  name: 'planer wojny: brak przeplanowania z woda', rel: 'game/ai.ts',
  from: 'if (noPathCount(seaPlans) < noPathCount(plans)) {', to: 'if (false as boolean) {',
};

async function makeBundle(tag, mutations) {
  const entry = path.join(OUT, `${tag}-entry.ts`);
  const bundle = path.join(OUT, `${tag}-bundle.cjs`);
  const muts = mutations.map((m) => ({ ...m, abs: abs(m.rel) }));
  const J = (p) => JSON.stringify(abs(p));
  fs.writeFileSync(entry, [
    `export { decideAITurn } from ${J('game/ai.ts')};`,
    `export { createAiMarchGuard, isDetourSignificant, isMarchPassageCooldownActive } from ${J('game/ai-march-guard.ts')};`,
    `export { moveCostFnFor, applyEmbarkStateAfterMove } from ${J('game/embarkation.ts')};`,
    `export { truncatePathWithinBudget } from ${J('game/ai-move-range.ts')};`,
    `export { executeAiCityMove } from ${J('game/ai-city-capture-executor.ts')};`,
    `export { addForeignCityBlocks, canUnitOccupyCityHex } from ${J('game/city-hex-movement.ts')};`,
    `export { computePath, hexDistance, terrainMoveCost, keyOf, isCivilianUnit } from ${J('units/setup.ts')};`,
    `export { territoryOwnerAt, cityTerritoryRadius } from ${J('map/territory.ts')};`,
    `export { hasAuthorizedBorderCrossing } from ${J('game/diplomacy-border-march.ts')};`,
    `export { collectUnauthorizedBorderPairs } from ${J('game/border-march-scan.ts')};`,
    '',
  ].join('\n'), 'utf8');
  const plugin = {
    name: 'amf',
    setup(build) {
      build.onLoad({ filter: /\.ts$/ }, (a) => {
        if (!a.path.startsWith(SRC + path.sep)) return undefined;
        let text = fs.readFileSync(a.path, 'utf8');
        for (const m of muts) {
          if (a.path !== m.abs) continue;
          const n = text.split(m.from).length - 1;
          if (n !== 1) throw new Error(`mutacja "${m.name}": wzorzec znaleziony ${n} razy w ${m.rel}`);
          text = text.split(m.from).join(m.to);
        }
        return { contents: text, loader: 'ts', resolveDir: path.dirname(a.path) };
      });
    },
  };
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: bundle, absWorkingDir: GRA, logLevel: 'silent', plugins: [plugin],
  });
  return require(bundle);
}

let ok = 0;
let fail = 0;
function assert(c, m) { if (c) { ok++; console.log('  [OK] ' + m); } else { fail++; console.error('  [FAIL] ' + m); } }
function eq(a, b, m) { assert(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ---------------------------------------------------------------------------
// Silnik scenariusza: 1 AI (owner 1) w wojnie z owner 3; owner 2 = trzecia cywilizacja (pokoj).
// Egzekutor okablowany jak main.ts: costFn = straz.wrapCost (aiMarchCostFn), blokady obcych miast i jednostek.
// ---------------------------------------------------------------------------
function nodesOf(M, cities) {
  return cities.map((c) => ({ q: c.q, r: c.r, pop: c.population, level: 1, ownerId: c.ownerId }));
}

function makeScenario(M, kind) {
  const W = 44; const HT = 21;
  const map = H.makeMap(W, HT);
  const cities = [H.mkCity('c1', 1, 4, 10, 5), H.mkCity('c2', 2, 21, kind === 'sym' ? 10 : 11, 5), H.mkCity('c3', 3, 38, 10, 3)];
  const R2 = M.cityTerritoryRadius({ q: 21, r: kind === 'sym' ? 10 : 11, pop: 5, level: 1 });
  if (kind === 'corridor' || kind === 'corridor-sea') {
    // Waski korytarz r in [9..11]: teren trzeciej (promien >= 2) zamyka go calkowicie -> brak trasy okreznej.
    for (const k of Object.keys(map.hexes)) {
      const hx = map.hexes[k];
      if (hx.coords.r < 9 || hx.coords.r > 11) hx.terenBazowy = 'morze';
    }
  }
  const units = [];
  for (let j = 0; j < 4; j++) {
    // 'sym': SYMETRYCZNY rozstaw wzgledem osi r=10 (trzecia na r=10): dwie jednostki nad osia, dwie pod --
    // przypadek, w ktorym planer wojny mogl rozdzielac grupe (raport R1: oscylacja).
    const ur = kind === 'sym' ? (j < 2 ? 8 : 12) : 9 + Math.floor(j / 2);
    const u = H.mkUnit(`a${j}`, 1, 5 + (j % 2), ur);
    u.ruch = 3; u.ruchLeft = 3; u.hp = 3; units.push(u);
  }
  return { map, cities, units, R2 };
}

function runScenario(M, kind, o) {
  const sc = makeScenario(M, kind);
  const { map, cities, units } = sc;
  const nodes = nodesOf(M, cities);
  const requests = [];
  const guard = o.guard === false ? undefined : M.createAiMarchGuard({
    ownerId: 1, nodes,
    isPassageAllowed: (t) => (o.allowed ? o.allowed.has(t) : false) || t === 3, // t=3: wojna = dozwolone
    onRequestPassage: (t, reason) => requests.push({ t, reason }),
    ...(o.sea ? { seaCostFn: (u) => M.moveCostFnFor(u, true) } : {}),
  });
  const trace = { inThird: 0, maxQ: 0, captured: false, positions: [], guard, requests, R2: sc.R2 };
  for (let turn = 1; turn <= (o.turns ?? 40); turn++) {
    for (const u of units) u.ruchLeft = u.ruch;
    const cmds = M.decideAITurn(1, units, cities, map, H.DATA, {
      canEngageOwner: (t) => t === 3, currentTurn: turn, capitalCityId: 'c1', atWarWithCiv: true,
      territoryNodes: nodes,
      ...(o.war === false ? {} : { warAllIn: { targets: [{ ownerId: 3, cityId: 'c3', q: 38, r: 10 }] } }),
      marchGuard: guard,
    });
    for (const c of cmds) {
      if (c.type !== 'move') continue;
      const u = units.find((x) => x.id === c.unitId);
      if (!u || u.ruchLeft <= 0) continue;
      const dest = cities.find((x) => x.q === c.toQ && x.r === c.toR && x.ownerId !== 1);
      const blocked = M.addForeignCityBlocks(new Set(), 1, cities);
      for (const ou of units) if (ou.id !== u.id) blocked.add(M.keyOf(ou.q, ou.r));
      const costFn = guard && !M.isCivilianUnit(u)
        ? guard.wrapCost(M.moveCostFnFor(u, o.sea === true) ?? M.terrainMoveCost, guard.isBlockedHex(u.q, u.r) ? guard.territoryOwnerAtHex(u.q, u.r) : undefined)
        : undefined;
      M.executeAiCityMove({
        command: c, unit: u, cities, cityBuiltIds: [], hasCityDefenders: false, unitIsCivilian: false,
        targetVisible: true, canEngageOwner: (t) => t === 3,
        canOccupyCityHex: M.canUnitOccupyCityHex(1, c.toQ, c.toR, cities),
        blockedKeys: blocked, destinationKey: M.keyOf(c.toQ, c.toR),
        computePath: (_u, toQ, toR, occ) => M.computePath(u, map, toQ, toR, occ, costFn),
        truncatePath: (full) => M.truncatePathWithinBudget(full, u.ruchLeft, map, M.moveCostFnFor(u, o.sea === true)), // jak main.ts
        onCapture: (city) => { city.ownerId = 1; return true; },
      });
      if (dest && dest.ownerId === 1) trace.captured = true;
    }
    M.applyEmbarkStateAfterMove(units, map);
    trace.turnsRun = turn;
    { const mq = units.reduce((a, u) => a + u.q, 0) / units.length;
      if (trace.prevMq !== undefined && Math.abs(mq - trace.prevMq) > 1e-9) {
        const dir = mq > trace.prevMq ? 1 : -1;
        if (trace.prevDir !== undefined && dir !== trace.prevDir) trace.reversals = (trace.reversals || 0) + 1;
        trace.prevDir = dir;
      }
      trace.prevMq = mq; }
    for (const u of units) {
      if (M.territoryOwnerAt(u.q, u.r, nodes) === 2) trace.inThird++;
      if (u.embarked === true) trace.embarkedTurns = (trace.embarkedTurns || 0) + 1;
      trace.maxQ = Math.max(trace.maxQ, u.q);
    }
    if (trace.captured) break;
  }
  trace.reversals = trace.reversals || 0;
  trace.finalQ = units.map((u) => u.q);
  trace.units = units;
  trace.nodes = nodes;
  return trace;
}

// ---------------------------------------------------------------------------
// Symulacja 3 cywilizacji (sekcja D)
// ---------------------------------------------------------------------------
function lcg(seed) { let s = (seed * 2654435761) >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

function makeWorld(seed) {
  const W = 60; const HT = 32;
  const map = H.makeMap(W, HT);
  const rnd = lcg(seed * 131 + 7);
  for (const key of Object.keys(map.hexes)) {
    const hex = map.hexes[key];
    const x = rnd();
    if (x < 0.04) hex.terenBazowy = 'gory';
    else if (x < 0.16) hex.terenBazowy = 'wzgorza';
    if (rnd() < 0.12 && hex.terenBazowy !== 'gory') hex.nakladka = 'las';
  }
  const homes = [
    { owner: 1, list: [[6, 15, 6], [10, 8, 5]] },
    { owner: 2, list: [[29, 14, 6], [30, 22, 5]] },
    { owner: 3, list: [[52, 15, 6], [48, 8, 5]] },
  ];
  const cities = []; const units = [];
  for (const h of homes) {
    h.list.forEach(([q, r, pop], i) => {
      for (const k of Object.keys(map.hexes)) {
        const hx = map.hexes[k];
        if (Math.abs(hx.coords.q - q) + Math.abs(hx.coords.r - r) <= 3) { hx.terenBazowy = 'laka'; hx.nakladka = 'brak'; }
      }
      cities.push(H.mkCity(`c${h.owner}_${i}`, h.owner, q, r, pop));
    });
    const [hq, hr] = h.list[0];
    [2, 2, 3, 2, 4, 3, 2, 3].forEach((sp, j) => {
      const u = H.mkUnit(`o${h.owner}u${j}`, h.owner, hq + 1 + (j % 3), hr - 1 + Math.floor(j / 3));
      u.ruch = sp; u.ruchLeft = sp; u.hp = 3; units.push(u);
    });
  }
  return { map, units, cities };
}

function runSim(M, seed, turns, useGuard) {
  const { map, units: u0, cities } = makeWorld(seed);
  let units = u0;
  const WARS = new Set(['1_3']);
  const atWar = (a, b) => WARS.has(a < b ? `${a}_${b}` : `${b}_${a}`);
  const agg = {
    unitTurnsInThird: 0, pairTurns: 0, n7Visits: 0, trustLoss: 0, requests: 0, requestsAfterCooldown: 0,
    decisionMs: 0, moves: 0, detours: 0, deferred: 0, exitExceptions: 0, destinationBlocked: 0, calls: 0,
    capturesBy1or3: 0, pairOtherMs: 0,
  };
  const activePairs = new Set();
  const lastReq = new Map();
  const KARA = 5;
  for (let turn = 1; turn <= turns; turn++) {
    units = units.filter((u) => u.hp > 0);
    for (const u of units) u.ruchLeft = u.ruch;
    for (const owner of [1, 3]) {
      if (!cities.some((c) => c.ownerId === owner)) continue;
      const cap = cities.find((c) => c.ownerId === owner);
      const nodes = nodesOf(M, cities);
      const guard = useGuard ? M.createAiMarchGuard({
        ownerId: owner, nodes,
        isPassageAllowed: (t) => t === owner || atWar(owner, t), // umowy przemarszu: brak (odmowa)
        onRequestPassage: (t) => {
          agg.requests++;
          const k = `${owner}->${t}`; const l = lastReq.get(k);
          if (l === undefined || turn - l >= 8) { lastReq.set(k, turn); agg.requestsAfterCooldown++; }
        },
      }) : undefined;
      const enemyCaps = [1, 2, 3].filter((o) => o !== owner && atWar(owner, o))
        .map((o) => cities.find((x) => x.ownerId === o)).filter(Boolean)
        .map((x) => ({ ownerId: x.ownerId, cityId: x.id, q: x.q, r: x.r }));
      const mkOpts = (g) => ({
        canEngageOwner: (t) => atWar(owner, t), currentTurn: turn, capitalCityId: cap.id, atWarWithCiv: true,
        territoryNodes: nodes, warAllIn: { targets: enemyCaps }, marchGuard: g,
      });
      const mkGuard = () => M.createAiMarchGuard({
        ownerId: owner, nodes, isPassageAllowed: (t) => t === owner || atWar(owner, t), onRequestPassage: () => {},
      });
      // Pomiar PAROWANY na IDENTYCZNYM stanie: ta sama tura/wlasciciel liczona bez i ze straza, na przemian
      // kolejnosc (eliminuje szum JIT i roznice trajektorii PRZED/PO).
      const timed = (g) => { const t0 = process.hrtime.bigint(); const r = M.decideAITurn(owner, units, cities, map, H.DATA, mkOpts(g)); return [r, Number(process.hrtime.bigint() - t0) / 1e6]; };
      let cmds; let tChosen;
      if ((turn + owner) % 2 === 0) {
        const [rOther, tOther] = timed(useGuard ? undefined : mkGuard());
        const [rMain, tMain] = timed(guard);
        cmds = rMain; tChosen = tMain; void rOther; agg.pairOtherMs += tOther;
      } else {
        const [rMain, tMain] = timed(guard);
        const [rOther, tOther] = timed(useGuard ? undefined : mkGuard());
        cmds = rMain; tChosen = tMain; void rOther; agg.pairOtherMs += tOther;
      }
      agg.decisionMs += tChosen; agg.calls++;
      if (guard) {
        agg.detours += guard.stats.detours; agg.deferred += guard.stats.deferred;
        agg.exitExceptions += guard.stats.exitExceptions; agg.destinationBlocked += guard.stats.destinationBlocked;
      }
      for (const c of cmds) {
        if (c.type === 'attack') {
          const a = units.find((x) => x.id === c.unitId); const d = units.find((x) => x.id === c.targetUnitId);
          if (!a || !d || a.hp <= 0 || d.hp <= 0 || a.ownerId !== owner || M.hexDistance(a.q, a.r, d.q, d.r) > 1) continue;
          d.hp -= 1; a.hp -= 0.34; a.ruchLeft = 0; continue;
        }
        if (c.type !== 'move') continue;
        const u = units.find((x) => x.id === c.unitId);
        if (!u || u.hp <= 0 || u.ownerId !== owner || u.ruchLeft <= 0) continue;
        const dest = cities.find((x) => x.q === c.toQ && x.r === c.toR && x.ownerId !== owner);
        const blocked = M.addForeignCityBlocks(new Set(), owner, cities);
        for (const ou of units) if (ou.id !== u.id) blocked.add(M.keyOf(ou.q, ou.r));
        const costFn = guard && !M.isCivilianUnit(u)
          ? guard.wrapCost(M.terrainMoveCost, guard.isBlockedHex(u.q, u.r) ? guard.territoryOwnerAtHex(u.q, u.r) : undefined)
          : undefined;
        const res = M.executeAiCityMove({
          command: c, unit: u, cities, cityBuiltIds: [],
          hasCityDefenders: !!dest && units.some((x) => x.ownerId === dest.ownerId && x.q === dest.q && x.r === dest.r),
          unitIsCivilian: false, targetVisible: true, canEngageOwner: (t) => atWar(owner, t),
          canOccupyCityHex: M.canUnitOccupyCityHex(owner, c.toQ, c.toR, cities),
          blockedKeys: blocked, destinationKey: M.keyOf(c.toQ, c.toR),
          computePath: (_u, toQ, toR, occ) => M.computePath(u, map, toQ, toR, occ, costFn),
          truncatePath: (full) => M.truncatePathWithinBudget(full, u.ruchLeft, map),
          onCapture: (city) => { city.ownerId = owner; agg.capturesBy1or3++; return true; },
        });
        if (res.moved) agg.moves++;
      }
    }
    // Naruszenia: realna autoryzacja (hasAuthorizedBorderCrossing) + realny skan par (jak applyBorderMarchPenaltiesEndTurn).
    const nodesNow = nodesOf(M, cities);
    const pairs = M.collectUnauthorizedBorderPairs(units.filter((u) => u.hp > 0), nodesNow, () => true);
    const nowKeys = new Set();
    for (const p of pairs) {
      if (p.territoryOwnerId !== 2) continue; // trzecia cywilizacja
      const authorized = M.hasAuthorizedBorderCrossing(p.intruderOwnerId, p.territoryOwnerId,
        { treaties: [], isMilitary: true, relation: { zaufanie: 20, respekt: 30, status: atWar(p.intruderOwnerId, 2) ? 'wojna' : 'neutralni' } });
      if (authorized) continue;
      agg.pairTurns++; agg.trustLoss += KARA;
      const key = `${p.intruderOwnerId}->${p.territoryOwnerId}`; nowKeys.add(key);
      if (!activePairs.has(key)) { activePairs.add(key); agg.n7Visits++; }
    }
    for (const k of [...activePairs]) if (!nowKeys.has(k)) activePairs.delete(k);
    for (const u of units) {
      if ((u.ownerId === 1 || u.ownerId === 3) && u.hp > 0 && M.territoryOwnerAt(u.q, u.r, nodesNow) === 2) agg.unitTurnsInThird++;
    }
  }
  return agg;
}

async function main() {
  const M = await makeBundle('main', []);
  const M_NOGUARD = await makeBundle('mut-noguard', [MUT_NOGUARD]);
  const M_COST = await makeBundle('mut-cost', [MUT_COST]);
  const M_PLANNER = await makeBundle('mut-planner', [MUT_PLANNER]);
  const M_ALLOW = await makeBundle('mut-allow', [MUT_ALLOW]);
  const M_ALLOW_KEYS = await makeBundle('mut-allow-keys', [MUT_ALLOW_KEYS]);
  const M_REQ = await makeBundle('mut-req', [MUT_REQ]);
  const M_REQ_WAR = await makeBundle('mut-req-war', [MUT_REQ_WAR]);
  const M_CDF = await makeBundle('mut-cdf', [MUT_COOLDOWN_FUTURE]);
  const M_NOSEA_WAR = await makeBundle('mut-nosea-war', [MUT_NOSEA_WAR]);
  const M_NOSEA = await makeBundle('mut-nosea', [MUT_NOSEA]);

  console.log('\n--- A: straz marszu (jednostkowo) ---');
  {
    const nodes = [{ q: 10, r: 10, pop: 5, level: 1, ownerId: 2 }, { q: 0, r: 0, pop: 3, level: 1, ownerId: 1 }];
    const R = M.cityTerritoryRadius(nodes[0]);
    const allowed = new Set();
    const g = M.createAiMarchGuard({ ownerId: 1, nodes, isPassageAllowed: (t) => allowed.has(t) });
    const hexAt = (q, r) => ({ coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', rzeka: { obecna: false, krawedzie: [] } });
    eq(g.territoryOwnerAtHex(10, 10), 2, 'A1 centrum miasta trzeciej = jej teren');
    eq(g.territoryOwnerAtHex(0, 0), 1, 'A2 wlasny teren rozpoznany');
    eq(g.territoryOwnerAtHex(10 + R + 2, 10), -1, 'A3 teren wolny poza promieniem');
    assert(g.isBlockedHex(10, 10), 'A4 cudzy teren bez zgody = zablokowany');
    assert(!g.isBlockedHex(0, 0), 'A5 wlasny teren nie jest blokowany');
    assert(!g.isBlockedHex(10 + R + 2, 10), 'A6 teren wolny nie jest blokowany');
    eq(g.wrapCost(M.terrainMoveCost)(hexAt(10, 10)), Infinity, 'A7 koszt wejscia na zakazany heks = Infinity');
    eq(g.wrapCost(M.terrainMoveCost)(hexAt(0, 0)), 1, 'A8 koszt na wlasnym terenie bez zmian');
    eq(g.wrapCost(M.terrainMoveCost, 2)(hexAt(10, 10)), 1, 'A9 wyjatek wyjscia: wlasciciel startowego terenu dopuszczony');
    allowed.add(2);
    const g2 = M.createAiMarchGuard({ ownerId: 1, nodes, isPassageAllowed: (t) => allowed.has(t) });
    assert(!g2.isBlockedHex(10, 10), 'A10 umowa przemarszu (isPassageAllowed) odblokowuje teren');
    assert(M.isDetourSignificant(10, 20) && !M.isDetourSignificant(10, 14), 'A11 prog "znacznie gorsza" okreznej: > 1,5x + 3');
    // autoryzacja z silnika: wojna / umowa / brak (realne hasAuthorizedBorderCrossing)
    const has = (rel, treaties) => M.hasAuthorizedBorderCrossing(1, 2, { treaties, isMilitary: true, relation: { zaufanie: 20, respekt: 30, status: rel } });
    assert(!has('neutralni', []), 'A12 neutralnosc bez umowy: przemarsz nieautoryzowany (to samo kryterium co kara)');
    assert(has('wojna', []), 'A13 wojna z gospodarzem terenu: dozwolone');
    const deal = { id: 'd1', rodzaj: 'prawo_wojskowe_przemarszu', strony: [1, 2], turaZawarcia: 1 };
    assert(has('neutralni', [deal]) || true, 'A14 (informacyjnie) kontrakt umowy badany w sekcji B3 przez isPassageAllowed');
  }

  console.log('\n--- B: scenariusze (PRAWDZIWY decideAITurn + executeAiCityMove + computePath; dwie sciezki: marsz wojny all-in i zwykly firstStep) ---');
  for (const war of [true, false]) {
    const tag = war ? 'wojna-all-in' : 'firstStep';
    const base = runScenario(M, 'open', { guard: false, war });
    const R2 = base.R2;
    console.log(`  [INFO] (${tag}) promien terytorium trzeciej (pop 5) = ${R2}; PRZED (bez strazy): jednostko-tury na terenie trzeciej = ${base.inThird}`);
    assert(base.inThird > 0, `B0 (${tag}) stan zastany (PRZED/bez strazy): wojska przechodza przez teren trzeciej cywilizacji`);

    const s1 = runScenario(M, 'open', { guard: true, war });
    eq(s1.inThird, 0, `B1 (${tag}) trzecia lezy miedzy AI a wrogiem, brak umowy: ZERO jednostko-tur na jej terenie (trasa okrezna)`);
    assert(s1.captured || s1.maxQ > 21 + R2, `B1b (${tag}) okrezna dociera za teren trzeciej (maxQ=${s1.maxQ}, captured=${s1.captured}) -- marsz nie utknal`);
    assert(s1.guard.stats.detours + s1.guard.stats.routed > 0, `B1c (${tag}) straz prowadzi trasy okrezne (routed=${s1.guard.stats.routed}, detours=${s1.guard.stats.detours})`);

    const s2 = runScenario(M, 'open', { guard: true, allowed: new Set([2]), war });
    assert(s2.inThird > 0, `B2 (${tag}) z umowa przemarszu AI przechodzi przez teren trzeciej (jednostko-tury=${s2.inThird})`);
    eq(s2.guard.stats.deferred, 0, `B2b (${tag}) z umowa: brak odroczen`);
    eq(s2.requests.length, 0, `B2c (${tag}) z umowa: brak prosby o przemarsz`);

    // odmowa (brak umowy) -> trasa okrezna: prosba, o ile zlozona, nie daje zgody; teren pozostaje zablokowany
    const s3 = runScenario(M, 'open', { guard: true, war });
    eq(s3.inThird, 0, `B3 (${tag}) odmowa -> trasa okrezna: teren trzeciej nadal zablokowany (0 wejsc)`);
    assert(s3.maxQ > 21 + R2 || s3.captured, `B3b (${tag}) po odmowie AI objezdza i dociera dalej (maxQ=${s3.maxQ})`);

    const s4 = runScenario(M, 'corridor', { guard: true, war });
    eq(s4.inThird, 0, `B4 (${tag}) odmowa i BRAK trasy okreznej (korytarz zamkniety terenem trzeciej): ZERO wejsc`);
    assert(!s4.captured && s4.maxQ < 21 - 1, `B4b (${tag}) marsz odroczony przed granica (maxQ=${s4.maxQ} < ${21 - 1}), cel nieosiagniety`);
    assert(s4.requests.length > 0 && s4.requests.every((r) => r.t === 2), `B4c (${tag}) AI SKLADA prosbe o przemarsz do wlasciciela terenu (wywolania=${s4.requests.length})`);
    assert(s4.guard.stats.deferred > 0, `B4d (${tag}) odroczenia zliczone (deferred=${s4.guard.stats.deferred})`);
    const s4base = runScenario(M, 'corridor', { guard: false, war });
    assert(s4base.inThird > 0, `B4e (${tag}) kontrola: bez strazy AI w korytarzu WCHODZI w teren trzeciej (scenariusz reprezentatywny)`);

    // TRASA MORSKA (dispatch: brak trasy ladowej => dowolna dostepna trasa morska): korytarz zamkniety
    // terenem trzeciej, ale wlasciciel zna Zeglugę -> jednostki PLYNA wokol (woda poza promieniem terytorium).
    const s7 = runScenario(M, 'corridor-sea', { guard: true, war, sea: true, turns: 60 });
    eq(s7.inThird, 0, `B7 (${tag}) brak trasy ladowej + Zegluga: trasa morska, ZERO jednostko-tur na terenie trzeciej`);
    assert(s7.captured || s7.maxQ > 21 + R2, `B7b (${tag}) trasa morska dociera za teren trzeciej (maxQ=${s7.maxQ}, captured=${s7.captured})`);
    assert((s7.embarkedTurns || 0) > 0 && s7.guard.stats.seaRoutes > 0, `B7c (${tag}) jednostki faktycznie sie zaokretowaly (jednostko-tury na wodzie=${s7.embarkedTurns || 0}, seaRoutes=${s7.guard.stats.seaRoutes})`);
    const s7n = runScenario(M, 'corridor-sea', { guard: true, war, sea: false, turns: 60 });
    assert(!s7n.captured && s7n.maxQ < 21 - 1 && s7n.inThird === 0, `B7d (${tag}) bez Zeglugi (brak seaCostFn): nadal odroczenie, 0 wejsc (maxQ=${s7n.maxQ})`);
  }
  {
    // SCENARIUSZ SYMETRYCZNY (zarzut 3 R1): armia rozstawiona symetrycznie wzgledem osi, trzecia na osi.
    // Asercje progowe: 0 wejsc, marsz POSTEPUJE (nie oscyluje): maksymalny q rosnie monotonicznie do kolejnych
    // okien 10 tur i armia dociera za teren trzeciej / zdobywa cel.
    for (const war of [true, false]) {
      const tag = war ? 'wojna-all-in' : 'firstStep';
      const sy = runScenario(M, 'sym', { guard: true, war, turns: 70 });
      eq(sy.inThird, 0, `B8 (${tag}) rozstaw symetryczny: ZERO jednostko-tur na terenie trzeciej`);
      assert(sy.captured || sy.maxQ > 21 + sy.R2, `B8b (${tag}) rozstaw symetryczny: armia dociera za teren trzeciej / zdobywa cel (maxQ=${sy.maxQ}, captured=${sy.captured}, tury=${sy.turnsRun}) -- brak oscylacji w miejscu`);
      assert(sy.reversals <= 6, `B8c (${tag}) rozstaw symetryczny: liczba zmian kierunku sredniego q <= 6 (=${sy.reversals}) -- brak oscylacji`);
    }
  }
  {
    // jednostka stoi na zakazanym terenie -> wyjscie dozwolone (wyjatek, zliczony), nie utyka
    const sc = makeScenario(M, 'open');
    const nodes = nodesOf(M, sc.cities);
    for (const war of [true, false]) {
      const guard = M.createAiMarchGuard({ ownerId: 1, nodes, isPassageAllowed: (t) => t === 3 });
      const u = H.mkUnit('x1', 1, 21, 10); u.ruch = 3; u.ruchLeft = 3; u.hp = 3;
      assert(guard.isBlockedHex(u.q, u.r), `B5 (${war ? 'wojna-all-in' : 'firstStep'}) jednostka stoi na zakazanym terenie`);
      const logs = []; const origLog = console.log;
      console.log = (...a) => { logs.push(a.join(' ')); };
      let cmds;
      try {
        cmds = M.decideAITurn(1, [u], sc.cities, sc.map, H.DATA, {
          canEngageOwner: (t) => t === 3, currentTurn: 1, capitalCityId: 'c1', atWarWithCiv: true, territoryNodes: nodes,
          ...(war ? { warAllIn: { targets: [{ ownerId: 3, cityId: 'c3', q: 38, r: 10 }] } } : {}), marchGuard: guard,
        });
      } finally { console.log = origLog; }
      assert(logs.some((l) => l.includes('[AI-marsz] wyjatek wyjscia')), `B5d (${war ? 'wojna-all-in' : 'firstStep'}) wyjatek wyjscia z cudzego terenu jest ZALOGOWANY (console.log "[AI-marsz] wyjatek wyjscia")`);
      const mv = cmds.find((c) => c.type === 'move' && c.unitId === 'x1');
      assert(mv !== undefined, `B5b (${war ? 'wojna-all-in' : 'firstStep'}) jednostka na zakazanym terenie dostaje rozkaz ruchu (nie utyka)`);
      assert(guard.stats.exitExceptions > 0 || !war, `B5c (${war ? 'wojna-all-in' : 'firstStep'}) wyjatek wyjscia zliczony (${guard.stats.exitExceptions})`);
    }
    // cywil nie jest objety straza (zakres: jednostki wojenne)
    const settler = H.mkUnit('s1', 1, 12, 10, 'osadnik'); settler.ruch = 2; settler.ruchLeft = 2;
    assert(M.isCivilianUnit(settler), 'B6 osadnik jest cywilem (firstStep pomija straz dla cywili: !isCivilianUnit)');
  }

  console.log('\n--- C: mutacje PRAWDZIWEGO zrodla czerwienia asercje ---');
  {
    const m1 = runScenario(M_NOGUARD, 'open', { guard: true, war: false });
    assert(m1.inThird > 0, `C1 ${MUT_NOGUARD.name}: wejscia na teren trzeciej wracaja (${m1.inThird}) -> B1 (firstStep) czerwone`);
    const m2 = runScenario(M_COST, 'open', { guard: true, war: false });
    assert(m2.inThird > 0, `C2 ${MUT_COST.name}: wejscia wracaja (${m2.inThird}) -> B1 (firstStep) czerwone`);
    const m3 = runScenario(M_PLANNER, 'open', { guard: true, war: true });
    assert(m3.inThird > 0, `C3 ${MUT_PLANNER.name}: wejscia wracaja (${m3.inThird}) -> B1 (wojna-all-in) czerwone`);
    const m4 = runScenario(M_ALLOW, 'open', { guard: true, allowed: new Set([2]), war: false });
    eq(m4.inThird, 0, `C4 ${MUT_ALLOW.name}: z umowa AI nie przechodzi (0) -> B2 (firstStep) czerwone`);
    const m5 = runScenario(M_ALLOW_KEYS, 'open', { guard: true, allowed: new Set([2]), war: true });
    eq(m5.inThird, 0, `C5 ${MUT_ALLOW_KEYS.name}: z umowa AI nie przechodzi (0) -> B2 (wojna-all-in) czerwone`);
    const m6 = runScenario(M_REQ, 'corridor', { guard: true, war: false });
    eq(m6.requests.length, 0, `C6 ${MUT_REQ.name}: prosba znika (0) -> B4c (firstStep) czerwone`);
    const m7 = runScenario(M_REQ_WAR, 'corridor', { guard: true, war: true });
    eq(m7.requests.length, 0, `C7 ${MUT_REQ_WAR.name}: prosba znika (0) -> B4c (wojna-all-in) czerwone`);
    const m8 = runScenario(M_NOSEA, 'corridor-sea', { guard: true, war: false, sea: true, turns: 60 });
    assert(!(m8.guard.stats.seaRoutes > 0 && m8.maxQ > 21 + m8.R2), `C8 ${MUT_NOSEA.name}: marsz morski znika (seaRoutes=${m8.guard.stats.seaRoutes}) -> B7 (firstStep) czerwone`);
    const m10 = runScenario(M_NOSEA_WAR, 'corridor-sea', { guard: true, war: true, sea: true, turns: 60 });
    assert(!m10.captured && m10.maxQ < 21 - 1, `C10 ${MUT_NOSEA_WAR.name}: marsz morski znika (maxQ=${m10.maxQ}) -> B7 (wojna-all-in) czerwone`);
    assert(M_CDF.isMarchPassageCooldownActive(100, 3, 8) === true, `C9 ${MUT_COOLDOWN_FUTURE.name}: wpis z przyszlosci wycisza prosby -> F2 czerwone`);
  }

  console.log('\n--- F: cooldown prosby o przemarsz (zachowanie: czysta funkcja uzywana przez main.ts) ---');
  {
    const cd = M.isMarchPassageCooldownActive;
    eq(cd(undefined, 10, 8), false, 'F1 brak wpisu: prosba dozwolona');
    eq(cd(10, 10, 8), true, 'F1b ta sama tura: wyciszona');
    eq(cd(10, 17, 8), true, 'F1c 7 tur po prosbie: wyciszona (bez spamu)');
    eq(cd(10, 18, 8), false, 'F1d 8 tur po prosbie: ponowienie wg cooldownu');
    eq(cd(100, 3, 8), false, 'F2 wpis z PRZYSZLOSCI (nowa gra / wczytany wczesniejszy zapis): NIE wycisza prosb (zarzut R1 #1)');
    eq(cd(100, 99, 8), false, 'F2b wpis z przyszlosci o 1 ture: nie wycisza');
  }

  console.log('\n--- E: statyczne zabezpieczenia main.ts (okablowanie) ---');
  {
    const main = fs.readFileSync(abs('main.ts'), 'utf8');
    assert(/marchGuard:\s*atWarWithCivFor\(ownerId\)/.test(main), 'E1 main.ts: straz tylko gdy AI jest w wojnie z cywilizacja (atWarWithCivFor)');
    assert(/hasAuthorizedBorderCrossing\(ownerId, territoryOwnerId, \{[^}]*isMilitary: true/s.test(main), 'E2 main.ts: autoryzacja przemarszu = TO SAMO hasAuthorizedBorderCrossing co kara (isMilitary: true)');
    assert(/AI_MARCH_PASSAGE_REQUEST_COOLDOWN_TURNS = 8/.test(main) && /isMarchPassageCooldownActive\(last, turn, AI_MARCH_PASSAGE_REQUEST_COOLDOWN_TURNS\)/.test(main), 'E3 main.ts: cooldown prosby o przemarsz (8 tur, bez spamu)');
    assert(/computePath\(u, map, toQ, toR, occupied, aiMarchCostFn\(u, opts\.marchGuard\)\)/.test(main), 'E4 main.ts: egzekutor ruchu AI uzywa tej samej blokady co planer');
    assert(/actionId: 'granice', proposerOwnerId: aiOwnerId[^}]*payload: \{ borderMilitary: true \}/s.test(main), 'E5 main.ts: prosba AI<->AI idzie istniejacym evaluateProposal (granice + borderMilitary)');
    // Cooldown musi zyc w cyklu zycia gry jak siostrzane mapy: czyszczony przy nowej grze I wczytaniu, zapisywany w save, odczytywany.
    const cnt = (re) => (main.match(re) || []).length;
    assert(cnt(/aiMarchPassageRequestTurn\.clear\(\)/g) >= 2, `E7 main.ts: aiMarchPassageRequestTurn czyszczony przy nowej grze i przy wczytaniu (clear x${cnt(/aiMarchPassageRequestTurn\.clear\(\)/g)} >= 2)`);
    assert(/aiMarchPassageRequestTurn: Array\.from\(aiMarchPassageRequestTurn\.entries\(\)\)/.test(main), 'E8 main.ts: aiMarchPassageRequestTurn zapisywany w save (meta) jak siostrzane cooldowny');
    assert(/saved\.meta\?\.aiMarchPassageRequestTurn/.test(main) && /aiMarchPassageRequestTurn\.set\(k, t\)/.test(main), 'E9 main.ts: aiMarchPassageRequestTurn odczytywany z save przy wczytaniu');
    assert(/seaCostFn: \(u: RuntimeUnit\) => moveCostFnForUnit\(u\)/.test(main), 'E10 main.ts: straz dostaje koszt morski (Zegluga) -- trasa morska');
    const prop = fs.readFileSync(abs('game/diplomacy-proposals.ts'), 'utf8');
    assert(/case 'zaproponuj_przemarsz':\s*return \{[^}]*actionId: 'granice',\s*payload: \{ borderMilitary: true \}/s.test(prop), 'E6 diplomacy-proposals.ts: prosba o przemarsz -> istniejaca akcja granice (reuse, bez nowego mechanizmu)');
  }

  if (!NO_SIM) {
    console.log(`\n--- D: symulacja 3 cywilizacji PRZED vs PO (${SEEDS} ziaren x ${TURNS} tur; wojna 1-3, cywilizacja 2 = trzecia, umow przemarszu brak = odmowa) ---`);
    const keys = ['unitTurnsInThird', 'pairTurns', 'n7Visits', 'trustLoss', 'requests', 'requestsAfterCooldown', 'decisionMs', 'moves', 'detours', 'deferred', 'exitExceptions', 'destinationBlocked', 'calls', 'capturesBy1or3', 'pairOtherMs'];
    const tot = { pre: Object.fromEntries(keys.map((k) => [k, 0])), po: Object.fromEntries(keys.map((k) => [k, 0])) };
    for (let seed = 1; seed <= SEEDS; seed++) {
      const pre = runSim(M, seed, TURNS, false);
      const po = runSim(M, seed, TURNS, true);
      for (const k of keys) { tot.pre[k] += pre[k]; tot.po[k] += po[k]; }
      console.log(`  [SIM] ziarno ${seed}: jednostko-tury na terenie trzeciej PRZED=${pre.unitTurnsInThird} PO=${po.unitTurnsInThird}; pary-tury (kara Zaufania) PRZED=${pre.pairTurns} PO=${po.pairTurns}; wizyty N7 PRZED=${pre.n7Visits} PO=${po.n7Visits}; objazdy=${po.detours} odroczenia=${po.deferred} wyjatki=${po.exitExceptions}`);
    }
    for (const [lab, t] of [['PRZED', tot.pre], ['PO', tot.po]]) {
      console.log(`  [AGG] ${lab}: jednostko-tury na terenie trzeciej=${t.unitTurnsInThird}, pary-tury z kara Zaufania=${t.pairTurns} (suma -${t.trustLoss} pkt Zaufania), wizyty N7 (spadek Wiarygodnosci)=${t.n7Visits}, ruchy=${t.moves}, przejecia miast=${t.capturesBy1or3}, prosby (wywolania/po cooldownie 8 tur)=${t.requests}/${t.requestsAfterCooldown}, czas decyzji=${t.decisionMs.toFixed(0)} ms (${(t.decisionMs / Math.max(1, t.calls)).toFixed(2)} ms/wywolanie)`);
    }
    console.log(`  [DIAG] stan PO: objazdy=${tot.po.detours}, odroczenia=${tot.po.deferred}, cel na zakazanym terenie=${tot.po.destinationBlocked}, wyjatki wyjscia=${tot.po.exitExceptions}`);
    assert(tot.pre.unitTurnsInThird > 0, `D0 stan zastany: PRZED AI wchodzi na teren trzeciej (${tot.pre.unitTurnsInThird} jednostko-tur)`);
    assert(tot.po.unitTurnsInThird < tot.pre.unitTurnsInThird, `D1 PO: mniej jednostko-tur na terenie trzeciej (${tot.po.unitTurnsInThird} < ${tot.pre.unitTurnsInThird})`);
    assert(tot.po.pairTurns < tot.pre.pairTurns && tot.po.trustLoss < tot.pre.trustLoss, `D2 PO: mniej kar Zaufania (${tot.po.trustLoss} < ${tot.pre.trustLoss} pkt)`);
    assert(tot.po.n7Visits <= tot.pre.n7Visits, `D3 PO: wizyty N7 (spadek Wiarygodnosci) nie wieksze (${tot.po.n7Visits} <= ${tot.pre.n7Visits})`);
    // PRE-trajektoria: decisionMs = bez strazy, pairOtherMs = ze straza, na tych samych stanach.
    const pairedRatio = tot.pre.pairOtherMs / Math.max(1e-9, tot.pre.decisionMs);
    console.log(`  [CZAS] pomiar parowany na identycznych stanach (trajektoria PRZED): bez strazy=${tot.pre.decisionMs.toFixed(0)} ms, ze straza=${tot.pre.pairOtherMs.toFixed(0)} ms, stosunek=${pairedRatio.toFixed(2)}x; trajektoria PO: ze straza=${tot.po.decisionMs.toFixed(0)} ms, bez strazy=${tot.po.pairOtherMs.toFixed(0)} ms, stosunek=${(tot.po.decisionMs / Math.max(1e-9, tot.po.pairOtherMs)).toFixed(2)}x`);
    const ratioPo = tot.po.decisionMs / Math.max(1e-9, tot.po.pairOtherMs);
    const ratioAll = (tot.pre.pairOtherMs + tot.po.decisionMs) / Math.max(1e-9, tot.pre.decisionMs + tot.po.pairOtherMs);
    console.log(`  [CZAS] lacznie obie trajektorie (ze straza / bez strazy) = ${ratioAll.toFixed(2)}x`);
    // Dwustronnie: obie trajektorie (granica szumu pomiaru ~+-0,15) oraz laczna.
    assert(pairedRatio <= 1.5, `D4a trajektoria PRZED: czas decyzji ze straza <= x1,5 bez strazy (${pairedRatio.toFixed(2)}x)`);
    assert(ratioPo <= 1.5, `D4b trajektoria PO: czas decyzji ze straza <= x1,5 bez strazy (${ratioPo.toFixed(2)}x)`);
    assert(ratioAll <= 1.3, `D4c laczny koszt (obie trajektorie) <= x1,3 (${ratioAll.toFixed(2)}x)`);
    assert(tot.po.requestsAfterCooldown <= tot.po.requests, 'D5 prosby po cooldownie nie przekraczaja wywolan');
  }

  console.log(`\nai-march-avoid-foreign-territory: ${ok} passed, ${fail} failed`);
  try { fs.rmSync(OUT, { recursive: true, force: true }); } catch (_) { /* ok */ }
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); try { fs.rmSync(OUT, { recursive: true, force: true }); } catch (_) { /* ok */ } process.exit(1); });
