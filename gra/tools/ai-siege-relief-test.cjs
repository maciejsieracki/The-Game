'use strict';
/**
 * ai-siege-relief-test.cjs -- R-WEB-AI-SIEGE-RELIEF-ATTACK-BESIEGERS-Q1.
 * Uruchom z gra/:  node tools/ai-siege-relief-test.cjs
 * Silnik: prawdziwe decideAITurn (esbuild bundle). PRZED = prog przewagi podniesiony do 1000 (odsiecz wylaczona,
 * zachowanie identyczne z kodem sprzed poprawki); PO = wartosc z progu testu (domyslnie 0,2 = ai-params.json).
 *
 * (a) ratio >= 1,2 -> odsiecz: rozkazy na oblegajacych, zadna jednostka nie wchodzi na wlasne miasto,
 *     kazda zaangazowana jednostka zbliza sie do oblegajacych (priorytet przed ofensywa na miasto wroga b1).
 * (a-prog) granica 1,2: 5v5 (1,0) nie; 5v7 (1,4) tak; 6v7 (1,17, tuz pod progiem) nie; 6v8 (1,33) tak.
 * (a-param) prog z parametru: 5v7 przy 0,5 nie, przy 0,2 tak; 6v7 przy 0,2 nie, przy 0,1 tak.
 * (b) 2 vs 2 (ratio 1,0) -> brak odsieczy: komendy identyczne z miastem bez oblezenia.
 * (c) rozejm (brak wojny z oblegajacym) -> brak odsieczy.
 * (d) dwa oblegane miasta -> jedna grupa oblegajacych na ture.
 * (e) parametr z JSON: wartosc w ai-params.json = 0,2; prog 1000 wylacza odsiecz.
 * (f) bez oblezenia: determinizm (flaga nie zmienia komend).
 * (g) 4 tury symulacji: oblezenie zdjete wczesniej PO niz PRZED.
 * (h) barbarzyncy jako oblegajacy: odsiecz tak samo jak wobec cywilizacji.
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

/** Stan: miasto a1 (4,10) ownera 1; oblegajacy = wrog 2 na (5,10),(5,9); armia AI q=aq (10 jednostek). */
function scene(o) {
  const cities = [S.mkCity('a1', 1, 4, 10), S.mkCity('a2', 1, 5, 15), S.mkCity('b1', 2, 36, 10), S.mkCity('b2', 2, 35, 15)];
  const eo = o.enemyOwner === undefined ? 2 : o.enemyOwner;
  if (o.siege) { cities[0].oblegane = true; cities[0].oblegajacyOwnerId = eo; }
  const ai = (o.armyPts || [...six(o.aq || 2, 10), [o.aq || 2, 12], [(o.aq || 2) + 1, 12], [(o.aq || 2) - 1, 12], [o.aq || 2, 8]])
    .map((p, i) => S.mkUnit('a' + i, 1, p[0], p[1]));
  const en = (o.enemyPts || [[5, 10], [5, 9]]).map((p, i) => S.mkUnit('b' + i, eo, p[0], p[1]));
  if (o.siege2) {
    cities[1].oblegane = true; cities[1].oblegajacyOwnerId = 2;
    for (const [i, p] of [[0, [6, 15]], [1, [6, 14]]]) en.push(S.mkUnit('c' + i, 2, p[0], p[1]));
  }
  return { units: [...ai, ...en], cities, map: S.makeMap(40, 20) };
}

/** Komendy ruchu/ataku AI ownera 1. canEngage: czy owner 2 jest w wojnie (false = rozejm).
 *  extraOwners: dodatkowi wrogowie w wojnie (np. [-1] = barbarzyncy). */
function cmds(s, canEngage = true, extraOwners = [], bare = false) {
  // bare = true: wylaczona obrona domu i "army seeks army" -- jedyna sciezka ataku na oblegajacych to odsiecz.
  E.setArmyConsolidationOverride(true); E.setWarAllInCapitalOverride(true); E.setHomeWarDefenseOverride(!bare);
  E.setArmySeeksArmyOverride(bare ? false : null);
  E.resetHomeWarMemory();
  for (const u of s.units) u.ruchLeft = u.ruch;
  const opts = {
    canEngageOwner: t => canEngage && (t === 2 || extraOwners.includes(t)), hasContactWith: () => canEngage, currentTurn: 1,
    warAllIn: { targets: [{ ownerId: 2, cityId: 'b1', q: 36, r: 10 }] }, capitalCityId: 'a1', atWarWithCiv: canEngage,
  };
  return E.decideAITurn(1, s.units, s.cities, s.map, S.DATA, opts).filter(c => c.type === 'move' || c.type === 'attack');
}
const json = (x) => JSON.stringify(x);
function setParam(v) { S.DATA.aiParams[PARAM_KEY] = { wartosc: v }; }
function restoreParam() { if (ORIG_PARAM === undefined) delete S.DATA.aiParams[PARAM_KEY]; else S.DATA.aiParams[PARAM_KEY] = ORIG_PARAM; }
const BESIEGER_HEXES = [[5, 10], [5, 9]];
const hexDist = (q1, r1, q2, r2) => E.hexDistance(q1, r1, q2, r2);
const isBesiegerTarget = (id) => /^b\d+$/.test(id);

/** Trafienie w oblegajacych: atak na b* albo ruch do heksu przylegajacego do oblegajacego. */
function besiegerHit(c, bes) {
  return (c.type === 'attack' && isBesiegerTarget(c.targetUnitId))
    || (c.type === 'move' && bes.some(([bq, br]) => hexDist(c.toQ, c.toR, bq, br) <= 1));
}

/** Scena granicy: k oblegajacych (sasiedzi miasta a1 (4,10)), m wlasnych jednostek w zasiegu 3 od (5,10). */
function boundaryScene(k, m, enemyOwner = 2) {
  const cities = [S.mkCity('a1', 1, 4, 10), S.mkCity('a2', 1, 5, 15), S.mkCity('b1', 2, 36, 10), S.mkCity('b2', 2, 35, 15)];
  cities[0].oblegane = true; cities[0].oblegajacyOwnerId = enemyOwner;
  const nb = [];
  for (let dq = -1; dq <= 1; dq++) for (let dr = -1; dr <= 1; dr++) {
    const q = 4 + dq; const r = 10 + dr;
    if (hexDist(q, r, 4, 10) === 1) nb.push([q, r]);
  }
  const besiegers = nb.slice(0, k);
  const taken = (q, r) => (q === 4 && r === 10) || besiegers.some(([bq, br]) => bq === q && br === r);
  // Jednostki nie stoja przy oblegajacych (dystans >= 2), zeby "bazowy" atak nie maskowal odsieczy.
  const within = [];
  for (let q = 0; q <= 10; q++) for (let r = 5; r <= 15; r++) {
    const nearest = Math.min(...besiegers.map(([bq, br]) => hexDist(q, r, bq, br)));
    if (!taken(q, r) && nearest >= 2 && hexDist(q, r, 5, 10) <= 3) within.push([q, r]);
  }
  const participants = within.slice(0, m);
  const units = [
    ...participants.map((p, i) => S.mkUnit('a' + i, 1, p[0], p[1])),
    ...besiegers.map((p, i) => S.mkUnit('b' + i, enemyOwner, p[0], p[1])),
  ];
  return { units, cities, map: S.makeMap(40, 20), participants, besiegers };
}

/** Czy odsiecz zadzialala: komendy przy progu `param` roznia sie od komend przy progu 1000 (= brak odsieczy). */
function fired(sc, param, extraOwners = []) {
  setParam(1000); const off = cmds(sc, true, extraOwners, true);
  setParam(param); const on = cmds(sc, true, extraOwners, true);
  restoreParam();
  return json(off) !== json(on);
}

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
  const preHits = pre.filter(c => besiegerHit(c, BESIEGER_HEXES)).length;
  const postHits = post.filter(c => besiegerHit(c, BESIEGER_HEXES)).length;
  ok(postHits > preHits, 'PO: wiecej rozkazow na oblegajacych niz PRZED (' + preHits + ' -> ' + postHits + ')');
  ok(!post.some(c => c.type === 'move' && c.toQ === 4 && c.toR === 10), 'PO: zadna jednostka nie wchodzi na wlasne oblegane miasto (4,10)');

  // Priorytet: kazda jednostka odsieczy zbliza sie do oblegajacych (lub atakuje), nie idzie ku miastu wroga b1.
  const sc = boundaryScene(5, 7);
  setParam(0.2); const out = cmds(sc, true, [], true);
  restoreParam();
  const minDist = (q, r) => Math.min(...sc.besiegers.map(([bq, br]) => hexDist(q, r, bq, br)));
  let violations = 0;
  for (const id of sc.participants.map((_, i) => 'a' + i)) {
    const u = sc.units.find(x => x.id === id);
    const c = out.find(x => x.unitId === id);
    if (!c) { violations++; continue; }
    if (c.type === 'attack') continue;
    if (!(minDist(c.toQ, c.toR) < minDist(u.q, u.r))) violations++;
  }
  ok(violations === 0, 'odsiecz 7 vs 5: kazda jednostka zbliza sie do oblegajacych lub atakuje (naruszen=' + violations + ')');
  ok(out.some(c => besiegerHit(c, sc.besiegers)), 'odsiecz 7 vs 5: rozkazy na oblegajacych wydane');
}

// --- (a-prog) granica 1,2 -------------------------------------------------------
section('(a-prog) granica 1,2: 5v5 (1,0) nie, 5v7 (1,4) tak, 6v7 (1,17) nie, 6v8 (1,33) tak');
{
  ok(!fired(boundaryScene(5, 5), 0.2), '5 vs 5 (1,0): brak odsieczy');
  ok(fired(boundaryScene(5, 7), 0.2), '5 vs 7 (1,4): odsiecz');
  ok(!fired(boundaryScene(6, 7), 0.2), '6 vs 7 (1,17, tuz pod 1,2): brak odsieczy');
  ok(fired(boundaryScene(6, 8), 0.2), '6 vs 8 (1,33): odsiecz');
}

// --- (a-param) prog z parametru -------------------------------------------------
section('(a-param) 5v7 (1,4) i 6v7 (1,17) przy progach 0,5 / 0,2 / 0,1');
{
  ok(!fired(boundaryScene(5, 7), 0.5), '5v7 prog 0,5 (wymagane 1,5): brak odsieczy');
  ok(fired(boundaryScene(5, 7), 0.2), '5v7 prog 0,2: odsiecz');
  ok(!fired(boundaryScene(6, 7), 0.2), '6v7 prog 0,2: brak odsieczy');
  ok(fired(boundaryScene(6, 7), 0.1), '6v7 prog 0,1 (wymagane 1,1): odsiecz');
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
  ok(!truce.some(c => c.type === 'attack' && isBesiegerTarget(c.targetUnitId)), 'rozejm: brak ataku na oblegajacych');
}

// --- (d) dwa oblegane miasta --------------------------------------------------
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

// --- (e) prog z parametru: 1000 wylacza ------------------------------------------
section('(e2) prog 1000 wylacza, 0,2 wlacza (ta sama scena)');
{
  setParam(1000); const high = cmds(scene({ siege: true, aq: 2 }));
  const base = cmds(scene({ siege: false, aq: 2 }));
  setParam(0.2); const low = cmds(scene({ siege: true, aq: 2 }));
  restoreParam();
  ok(json(high) === json(base), 'prog 1000: odsiecz wylaczona (komendy = bez oblezenia)');
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

// --- (h) barbarzyncy jako oblegajacy -------------------------------------------
section('(h) oblegajacy = barbarzyncy (ownerId -1): odsiecz jak wobec cywilizacji');
{
  ok(fired(boundaryScene(5, 7, -1), 0.2, [-1]), 'barbarzyncy 5v7 (1,4): odsiecz wlaczona');
  ok(!fired(boundaryScene(5, 5, -1), 0.2, [-1]), 'barbarzyncy 5v5 (1,0): brak odsieczy');
}

restoreParam();
S.cleanup(E);
console.log('\nWYNIK: ' + passed + ' OK, ' + failed + ' FAIL');
process.exitCode = failed === 0 ? 0 : 1;
