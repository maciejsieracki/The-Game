'use strict';
/**
 * ai-siege-relief-test.cjs -- R-WEB-AI-SIEGE-RELIEF-ATTACK-BESIEGERS-Q1.
 * Uruchom z gra/:  node tools/ai-siege-relief-test.cjs
 * Silnik: prawdziwe decideAITurn (esbuild bundle). PRZED = prog przewagi podniesiony do 6 (overlay nie dziala,
 * zachowanie identyczne z kodem sprzed poprawki); PO = wartosc z ai-params.json (0,2).
 *
 * (a) ratio >= 1,2 -> odsiecz: jednostki AI ida na oblegajacych (atak / krok przy oblegajacych), a nie na miasto wroga.
 * (b) ratio < 1,2 (2 vs 2) -> brak odsieczy: komendy identyczne z miastem bez oblezenia.
 * (c) rozejm (brak wojny z oblegajacym) -> brak odsieczy: komendy identyczne PRZED/PO.
 * (d) dwa obleganie miasta -> jedna grupa oblegajacych na ture (nie obie naraz).
 * (e) parametr z JSON: prog 6 wylacza odsiecz, prog 0,2 ja wlacza; wartosc w ai-params.json = 0,2.
 * (f) czystosc: wynik zalezy od oblegane=true tylko przez odsiecz (bez zmiany komend gdy brak przewagi).
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const S = require('./ai-war-defend-home-sim.cjs');

const entry = path.resolve(__dirname, '.sr-test-entry.ts');
const bundle = path.resolve(__dirname, '.sr-test-bundle.cjs');
const J = (p) => JSON.stringify(path.join(GRA_ROOT, 'src', p));
fs.writeFileSync(entry, `
export { decideAITurn } from ${J('game/ai')};
export { setArmyConsolidationOverride } from ${J('game/army-consolidation')};
export { setWarAllInCapitalOverride } from ${J('game/warAllInCapital')};
export { setHomeWarDefenseOverride, resetHomeWarMemory } from ${J('game/ai-war-home-defense')};
export { hexDistance, isCivilianUnit, computePath } from ${J('units/setup')};
export { decideBarbarianMoves, FALLBACK_BARB_PARAMS, BARBARIAN_OWNER_ID } from ${J('game/barbarians')};
export { truncatePathWithinBudget } from ${J('game/ai-move-range')};
export { isCityLostOf, stampCityFounderOnCapture, cityFounderId, ownTerritoryClassOf } from ${J('game/cities')};
export { setArmySeeksArmyOverride } from ${J('game/ai-war-army-seeks-army')};
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, absWorkingDir: GRA_ROOT, logLevel: 'silent' });
const E = require(bundle);
E._files = [entry, bundle];

let passed = 0; let failed = 0;
function ok(cond, msg) { if (cond) { passed++; console.log('  OK: ' + msg); } else { failed++; console.log('  FAIL: ' + msg); } }
function section(t) { console.log('\n--- ' + t + ' ---'); }

const six = (q, r) => [[q, r], [q, r + 1], [q + 1, r], [q + 1, r + 1], [q, r - 1], [q + 1, r - 1]];
const PARAM_KEY = 'siege_relief_min_advantage';
const ORIG_PARAM = S.DATA.aiParams[PARAM_KEY];

/** Stan: miasto a1 (4,10) ownera 1; oblegajacy = wrog 2 na (5,10),(5,11); armia AI q=aq (10 jednostek). */
function scene(o) {
  const cities = [S.mkCity('a1', 1, 4, 10), S.mkCity('a2', 1, 5, 15), S.mkCity('b1', 2, 36, 10), S.mkCity('b2', 2, 35, 15)];
  if (o.siege) { cities[0].oblegane = true; cities[0].oblegajacyOwnerId = 2; }
  const ai = (o.armyPts || [...six(o.aq || 2, 10), [o.aq || 2, 12], [(o.aq || 2) + 1, 12], [(o.aq || 2) - 1, 12], [o.aq || 2, 8]])
    .map((p, i) => S.mkUnit('a' + i, 1, p[0], p[1]));
  const en = (o.enemyPts || [[5, 10], [5, 9]]).map((p, i) => S.mkUnit('b' + i, 2, p[0], p[1]));
  if (o.siege2) {
    cities[1].oblegane = true; cities[1].oblegajacyOwnerId = 2;
    for (const [i, p] of [[0, [6, 15]], [1, [6, 14]]]) en.push(S.mkUnit('c' + i, 2, p[0], p[1]));
  }
  return { units: [...ai, ...en], cities, map: S.makeMap(40, 20) };
}

/** Komendy ruchu/ataku AI ownera 1. canEngage: czy owner 2 jest w wojnie (false = rozejm). */
function cmds(s, canEngage = true) {
  E.setArmyConsolidationOverride(true); E.setWarAllInCapitalOverride(true); E.setHomeWarDefenseOverride(true);
  E.resetHomeWarMemory();
  for (const u of s.units) u.ruchLeft = u.ruch;
  const opts = {
    canEngageOwner: t => canEngage && t === 2, hasContactWith: () => canEngage, currentTurn: 1,
    warAllIn: { targets: [{ ownerId: 2, cityId: 'b1', q: 36, r: 10 }] }, capitalCityId: 'a1', atWarWithCiv: canEngage,
  };
  return E.decideAITurn(1, s.units, s.cities, s.map, S.DATA, opts).filter(c => c.type === 'move' || c.type === 'attack');
}
const json = (x) => JSON.stringify(x);
function setParam(v) { S.DATA.aiParams[PARAM_KEY] = { wartosc: v }; }
function restoreParam() { if (ORIG_PARAM === undefined) delete S.DATA.aiParams[PARAM_KEY]; else S.DATA.aiParams[PARAM_KEY] = ORIG_PARAM; }
const BESIEGER_HEXES = [[5, 10], [5, 9]];
const hexDist = (q1, r1, q2, r2) => E.hexDistance(q1, r1, q2, r2);

// --- (e) JSON -----------------------------------------------------------------
section('(e) ai-params.json: klucz i wartosc');
{
  const raw = JSON.parse(fs.readFileSync(path.resolve(GRA_ROOT, 'data', 'ai-params.json'), 'utf8'));
  ok(raw[PARAM_KEY] && raw[PARAM_KEY].wartosc === 0.2, 'ai-params.json: siege_relief_min_advantage = 0,2');
}

// --- (a) ratio >= 1,2 ---------------------------------------------------------
section('(a) ratio >= 1,2: odsiecz, priorytet przed ofensywa');
{
  setParam(1000); const pre = cmds(scene({ siege: true, aq: 2 }));
  setParam(0.2); const post = cmds(scene({ siege: true, aq: 2 }));
  restoreParam();
  console.log('  PRZED: ' + json(pre));
  console.log('  PO:    ' + json(post));
  const touchesBesiegers = post.some(c => (c.type === 'attack' && (c.targetUnitId === 'b0' || c.targetUnitId === 'b1'))
    || (c.type === 'move' && BESIEGER_HEXES.some(([bq, br]) => hexDist(c.toQ, c.toR, bq, br) <= 1)));
  ok(touchesBesiegers, 'PO: co najmniej jeden rozkaz idzie na oblegajacych (atak lub krok przy nich)');
  const preBesiegerCmds = pre.filter(c => c.type === 'attack' && (c.targetUnitId === 'b0' || c.targetUnitId === 'b1')).length;
  const postBesiegerCmds = post.filter(c => c.type === 'attack' && (c.targetUnitId === 'b0' || c.targetUnitId === 'b1')).length;
  ok(postBesiegerCmds >= preBesiegerCmds, 'PO: liczba atakow na oblegajacych nie maleje (' + preBesiegerCmds + ' -> ' + postBesiegerCmds + ')');
  ok(json(pre) !== json(post), 'PO: komendy rozne od PRZED (odsiecz zmienila rozkazy tury)');
}

// --- (b) ratio < 1,2 ----------------------------------------------------------
section('(b) ratio < 1,2 (2 vs 2): brak odsieczy');
{
  const small = [[2, 10], [2, 11]];
  setParam(0.2); const withSiege = cmds(scene({ siege: true, armyPts: small }));
  const noSiege = cmds(scene({ siege: false, armyPts: small }));
  restoreParam();
  ok(json(withSiege) === json(noSiege), 'komendy 2 vs 2 identyczne z miastem bez oblezenia');
}

// --- (c) rozejm ---------------------------------------------------------------
section('(c) rozejm/NAP z oblegajacym: brak odsieczy');
{
  setParam(0.2); const truce = cmds(scene({ siege: true, aq: 2 }), false);
  setParam(1000); const truceOff = cmds(scene({ siege: true, aq: 2 }), false);
  restoreParam();
  ok(json(truce) === json(truceOff), 'rozejm: komendy identyczne PRZED/PO');
  ok(!truce.some(c => c.type === 'attack' && (c.targetUnitId === 'b0' || c.targetUnitId === 'b1')), 'rozejm: brak ataku na oblegajacych');
}

// --- (d) dwa obleganie miasta -------------------------------------------------
section('(d) dwa oblegane miasta: jedna grupa na ture');
{
  setParam(0.2); const out = cmds(scene({ siege: true, siege2: true, aq: 2 }));
  restoreParam();
  const groupA = out.some(c => (c.type === 'attack' && ['b0', 'b1'].includes(c.targetUnitId))
    || (c.type === 'move' && BESIEGER_HEXES.some(([bq, br]) => hexDist(c.toQ, c.toR, bq, br) <= 1)));
  const groupB = out.some(c => (c.type === 'attack' && ['c0', 'c1'].includes(c.targetUnitId))
    || (c.type === 'move' && [[6, 15], [6, 14]].some(([bq, br]) => hexDist(c.toQ, c.toR, bq, br) <= 1)));
  ok(!(groupA && groupB), 'nie wiecej niz jedna grupa oblegajacych w turze (A=' + groupA + ', B=' + groupB + ')');
}

// --- (e) prog z parametru -----------------------------------------------------
section('(e) prog z parametru: 6 wylacza, 0,2 wlacza');
{
  setParam(1000); const high = cmds(scene({ siege: true, aq: 2 }));
  const base = cmds(scene({ siege: false, aq: 2 }));
  setParam(0.2); const low = cmds(scene({ siege: true, aq: 2 }));
  restoreParam();
  ok(json(high) === json(base), 'prog 6: odsiecz wylaczona (komendy = bez oblezenia)');
  ok(json(low) !== json(base), 'prog 0,2: odsiecz zmienia komendy');
}

// --- (f) czystosc -------------------------------------------------------------
section('(f) bez oblezenia: komendy niezmienione przez flage');
{
  const a = cmds(scene({ siege: false, aq: 2 }));
  const b = cmds(scene({ siege: false, aq: 2 }));
  ok(json(a) === json(b), 'determinizm: dwa przebiegi bez oblezenia identyczne');
}

// --- (g) wieloturowo: symptom "stoi obok i nic nie robi" --------------------
section('(g) 4 tury, armia 2 pola od oblegajacych: tura zdjecia oblezenia PRZED vs PO');
{
  // Miara: pierwsza tura, po ktorej zaden wrog nie zyje (oblezenie zdjete). Brak = 99.
  const liftTurn = (param) => {
    setParam(param);
    const sc = scene({ siege: true, aq: 2 });
    sc.wars = new Set(['1_2']); sc.aiOwners = [1, 2];
    let lift = 99;
    S.simulate(sc, { engine: E, turns: 4, homeDefense: true,
      onTurn: (t, s2) => {
        if (lift === 99 && s2.units.filter(u => u.ownerId === 2 && u.hp > 0).length === 0) lift = t;
      } });
    return lift;
  };
  const pre = liftTurn(1000);
  const post = liftTurn(0.2);
  restoreParam();
  console.log('  PRZED: tura zdjecia=' + pre + ' | PO: tura zdjecia=' + post);
  ok(post < pre, 'PO: oblezenie zdjete wczesniej niz PRZED (' + pre + ' -> ' + post + ')');
}

restoreParam();
S.cleanup(E);
console.log('\nWYNIK: ' + passed + ' OK, ' + failed + ' FAIL');
process.exitCode = failed === 0 ? 0 : 1;
