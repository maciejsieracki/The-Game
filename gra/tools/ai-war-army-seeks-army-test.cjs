'use strict';
/**
 * ai-war-army-seeks-army-test.cjs -- R-WEB-AI-WAR-ARMY-SEEKS-ENEMY-MAIN-ARMY-FIRST-Q1.
 * Uruchom z gra/:  node tools/ai-war-army-seeks-army-test.cjs
 * Silnik zastepczy: tools/ai-war-defend-home-sim.cjs (prawdziwy decideAITurn); PRZED = setArmySeeksArmyOverride(false).
 *
 * T1 sasiedztwo: dwie wrogie armie obok siebie -> PO: atak armii (bitwa w 1. turze, brak zajecia miasta).
 * T2 3 heksy od siebie: PO armie zbliza sie i wchodza w bitwe, zanim ktokolwiek zajmie miasto.
 * T3 mijanie (zgloszenie wlasciciela): armie na rownoleglych pasach, marsz na cudze miasta: PRZED mijaja sie
 *    (miasta zajete, bitwy 0 do zajecia), PO bitwa przed zdobyciem miasta.
 * T4 za slaba armia (2 vs 6): komendy PO == PRZED (dotychczasowa regula, bez samobojstwa).
 * T5 poza zasiegiem (12 heksow): komendy PO == PRZED.
 * T6 miasto pod oblezeniem (wrog 2 heksy od wlasnego miasta): komendy PO == PRZED (obrona domu rzadzi).
 * T7 mgla: wroga armia niewidoczna (visibleHexes bez jej heksow): komendy PO == PRZED.
 * T8 determinizm (dwa przebiegi = ten sam hash); T9 czysty planer: wybor najwiekszej armii wroga.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const S = require('./ai-war-defend-home-sim.cjs');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

const entry = path.resolve(__dirname, '.sa-entry.ts');
const bundle = path.resolve(__dirname, '.sa-bundle.cjs');
const J = (p) => JSON.stringify(path.join(GRA_ROOT, 'src', p));
fs.writeFileSync(entry, `
export { decideAITurn, aiUnitCombatStrength } from ${J('game/ai')};
export { decideBarbarianMoves, FALLBACK_BARB_PARAMS, BARBARIAN_OWNER_ID } from ${J('game/barbarians')};
export { hexDistance, isCivilianUnit, computePath } from ${J('units/setup')};
export { truncatePathWithinBudget } from ${J('game/ai-move-range')};
export { setArmyConsolidationOverride } from ${J('game/army-consolidation')};
export { setWarAllInCapitalOverride } from ${J('game/warAllInCapital')};
export { setHomeWarDefenseOverride, resetHomeWarMemory, planHomeWar } from ${J('game/ai-war-home-defense')};
export { isCityLostOf, stampCityFounderOnCapture, cityFounderId, ownTerritoryClassOf } from ${J('game/cities')};
export { setArmySeeksArmyOverride, planArmySeeksArmy } from ${J('game/ai-war-army-seeks-army')};
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, absWorkingDir: GRA_ROOT, logLevel: 'silent' });
const E = require(bundle);
E._files = [entry, bundle];

let passed = 0; let failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.log('  FAIL: ' + msg); } }
function section(t) { console.log('\n--- ' + t + ' ---'); }

function units(owner, pre, list) { return list.map(([q, r], i) => S.mkUnit(`${pre}${i}`, owner, q, r)); }
function base(extra) {
  return Object.assign({ map: S.makeMap(40, 20), wars: new Set(['1_2']), aiOwners: [1, 2] }, extra);
}
const CITIES = () => [S.mkCity('a1', 1, 4, 10), S.mkCity('a2', 1, 5, 15), S.mkCity('b1', 2, 36, 10), S.mkCity('b2', 2, 35, 15)];
const six = (q, r) => [[q, r], [q, r + 1], [q + 1, r], [q + 1, r + 1], [q, r - 1], [q + 1, r - 1]];
function run(sc, on, turns, extra) {
  E.setArmySeeksArmyOverride(on);
  const st = S.simulate(sc(), Object.assign({ engine: E, turns, homeDefense: true }, extra));
  E.setArmySeeksArmyOverride(null);
  return st;
}
/** Komendy 1. tury AI wlasciciela `owner` (bez symulacji ruchu). */
function cmds(sc, on, owner, visibleHexes) {
  E.setArmySeeksArmyOverride(on);
  E.setArmyConsolidationOverride(true); E.setWarAllInCapitalOverride(true); E.setHomeWarDefenseOverride(true);
  E.resetHomeWarMemory();
  const s = sc();
  for (const u of s.units) u.ruchLeft = u.ruch;
  const other = owner === 1 ? 2 : 1;
  const own = s.cities.filter(c => c.ownerId === owner)[0];
  const opts = {
    canEngageOwner: (t) => t === other, hasContactWith: () => true, currentTurn: 1,
    warAllIn: { targets: s.cities.filter(c => c.ownerId === other).slice(0, 1).map(c => ({ ownerId: other, cityId: c.id, q: c.q, r: c.r })) },
    capitalCityId: own.id, atWarWithCiv: true,
  };
  if (visibleHexes) opts.visibleHexes = visibleHexes;
  const out = E.decideAITurn(owner, s.units, s.cities, s.map, S.DATA, opts);
  E.setArmySeeksArmyOverride(null);
  return JSON.stringify(out.filter(c => c.type === 'move' || c.type === 'attack'));
}
function hashState(state) {
  const body = JSON.stringify({ u: state.units.map(u => [u.id, u.ownerId, u.q, u.r, u.hp]).sort(), c: state.cities.map(c => [c.id, c.ownerId]).sort() });
  return crypto.createHash('sha256').update(body).digest('hex').slice(0, 16);
}

// --- scenariusze ---------------------------------------------------------------
const scAdjacent = () => base({ units: [...units(1, 'a', six(19, 10)), ...units(2, 'b', six(21, 10))], cities: CITIES() });
const scThree = () => base({ units: [...units(1, 'a', six(17, 10)), ...units(2, 'b', six(22, 10))], cities: CITIES() });
const scWeak = () => base({ units: [...units(1, 'a', [[19, 10], [19, 11]]), ...units(2, 'b', six(21, 10))], cities: CITIES() });
const scFar = () => base({ units: [...units(1, 'a', six(8, 10)), ...units(2, 'b', six(32, 10))], cities: CITIES() });
const scSiege = () => base({ units: [...units(1, 'a', [...six(19, 10), [4, 10]]), ...units(2, 'b', [[6, 10], [6, 11], [6, 12], [30, 10], [30, 11], [31, 10]])], cities: CITIES() });

section('T1 sasiedztwo: armia atakuje armie');
{
  const c = cmds(scAdjacent, true, 1);
  const attacks = JSON.parse(c).filter(x => x.type === 'attack');
  ok(attacks.length >= 1, 'PO: co najmniej jeden atak armii na armie, jest ' + attacks.length);
  const st = run(scAdjacent, true, 1);
  ok(st.battles >= 1, 'PO: bitwa w 1. turze (battles=' + st.battles + ')');
  ok(st.captures === 0, 'PO: brak zajecia miasta (captures=' + st.captures + ')');
}

section('T2 3 heksy od siebie: zblizanie i bitwa');
{
  const on = run(scThree, true, 4);
  ok(on.battles >= 1, 'PO: bitwa w <= 4 turach (battles=' + on.battles + ')');
  ok(on.captures === 0, 'PO: brak zajec miast do pierwszej bitwy w oknie 4 tur');
  let firstBattle = null;
  run(scThree, true, 6, { onTurn: (t, st, stats) => { if (firstBattle === null && stats.battles > 0) firstBattle = t; } });
  ok(firstBattle !== null && firstBattle <= 3, 'PO: pierwsza bitwa najpozniej w turze 3 (jest ' + firstBattle + ')');
}

section('T3 mijanie sie armii (zgloszenie wlasciciela)');
{
  // armie na rownoleglych pasach (r=6 i r=14), cel: miasta przeciwnika; do zasiegu armii brakuje 8 wierszy -> poza zasiegiem N ruchow.
  const scPass = () => base({ units: [...units(1, 'a', six(14, 8)), ...units(2, 'b', six(24, 12))], cities: CITIES() });
  const off = run(scPass, false, 25, { reinforceEvery: 0 });
  const on = run(scPass, true, 25, { reinforceEvery: 0 });
  console.log('  PRZED: battles=' + off.battles + ' captures=' + off.captures + ' | PO: battles=' + on.battles + ' captures=' + on.captures);
  ok(on.battles >= 1, 'PO: armie sie spotykaja w bitwie');
  ok(off.captures > on.captures, 'RED na PRZED: bez reguly miasta sa zajmowane (' + off.captures + ') czesciej niz z regula (' + on.captures + ')');
  const firstCap = (st) => (st.captureLog.length ? st.captureLog[0].turn : 999);
  let firstBat = null;
  run(scPass, true, 25, { onTurn: (t, st, stats) => { if (firstBat === null && stats.battles > 0) firstBat = t; } });
  ok(firstBat !== null && firstBat < firstCap(on), 'PO: pierwsza bitwa (t' + firstBat + ') przed pierwszym zajeciem miasta (t' + firstCap(on) + ')');
}

section('T4 za slaba armia -> dotychczasowa regula');
ok(cmds(scWeak, true, 1) === cmds(scWeak, false, 1), 'komendy slabej armii A (2 vs 6) identyczne PRZED/PO');

section('T5 poza zasiegiem');
ok(cmds(scFar, true, 1) === cmds(scFar, false, 1), 'komendy poza zasiegiem identyczne PRZED/PO');

section('T6 miasto pod oblezeniem -> obrona domu rzadzi');
ok(cmds(scSiege, true, 1) === cmds(scSiege, false, 1), 'komendy przy wrogu 2 heksy od miasta identyczne PRZED/PO');

section('T6b pierwszenstwo obrony domu: armie sasiaduja (PO atakowaloby), ale wrog stoi 2 heksy od wlasnego miasta');
{
  // Bez galezi pierwszenstwa (mutant M4) nakladka zlecilaby atak na sasiadujaca armie -> komendy PO != PRZED.
  const scHomeThreat = () => base({
    units: [...units(1, 'a', six(19, 10)), ...units(2, 'b', six(21, 10)), ...units(2, 'c', [[6, 10]])],
    cities: CITIES(),
  });
  const offC = cmds(scHomeThreat, false, 1);
  const onC = cmds(scHomeThreat, true, 1);
  ok(onC === offC, 'wrog przy wlasnym miescie + sasiadujaca armia: komendy PRZED == PO (obrona domu rzadzi)');
  // Kontrola: ta sama scena BEZ zagrozenia domu -> nakladka dziala (komendy rozne), wiec test jest czuly.
  ok(cmds(scAdjacent, true, 1) !== cmds(scAdjacent, false, 1), 'kontrola: bez zagrozenia domu nakladka zmienia komendy');
}

section('T6c pierwszenstwo odbicia utraconego miasta (galaz P1 obrony domu)');
{
  const scLost = () => {
    const sc = base({ units: [...units(1, 'a', six(19, 10)), ...units(2, 'b', six(21, 10))], cities: CITIES() });
    const lost = sc.cities.find(c => c.id === 'b2');
    lost.foundedBy = 1; lost.capturedFromOwnerId = 1;
    return sc;
  };
  const offL = cmds(scLost, false, 1);
  const onL = cmds(scLost, true, 1);
  ok(onL === offL, 'utracone miasto do odbicia + sasiadujaca armia: komendy PRZED == PO (odbicie ma pierwszenstwo)');
}

section('T7 mgla wojny');
{
  const vis = new Set();
  for (let q = 15; q <= 20; q++) for (let r = 5; r <= 15; r++) vis.add(`${q},${r}`); // wlasne wojsko widzi tylko swoj rejon
  ok(cmds(scAdjacent, true, 1, vis) === cmds(scAdjacent, false, 1, vis), 'wroga armia niewidoczna -> brak zmian');
  const vis2 = new Set(vis); for (let r = 5; r <= 15; r++) { vis2.add(`21,${r}`); vis2.add(`22,${r}`); }
  ok(cmds(scAdjacent, true, 1, vis2).includes('"attack"'), 'wroga armia widoczna -> atak');
}

section('T8 determinizm');
{
  const final = () => { const s = scThree(); E.setArmySeeksArmyOverride(true); S.simulate(s, { engine: E, turns: 10, homeDefense: true }); E.setArmySeeksArmyOverride(null); return s; };
  const h1 = hashState(final());
  const h2 = hashState(final());
  ok(h1 === h2, 'dwa przebiegi daja ten sam hash');
}

section('T9 planer: wybiera NAJWIEKSZA armie wroga');
{
  const mk = (id, q, r, ow) => ({ id, q, r, ownerId: ow, ruch: 2 });
  const plan = E.planArmySeeksArmy({
    myArmyUnits: [mk('a1', 10, 10, 1), mk('a2', 10, 11, 1), mk('a3', 11, 10, 1)],
    enemyUnits: [mk('e1', 13, 10, 2), mk('e2', 40, 10, 2), mk('e3', 40, 11, 2), mk('e4', 41, 10, 2)],
    lockedUnitIds: new Set(), strengthOf: () => 1, distance: E.hexDistance, inAttackRange: () => false,
    params: { reachMoves: 3, minRatio: 0.8, clusterLink: 3, reachSlack: 1 },
  });
  ok(plan.reason === 'out-of-reach', 'najwieksza armia wroga (3 jedn.) poza zasiegiem -> brak zlecen (reason=' + plan.reason + ')');
  const plan2 = E.planArmySeeksArmy({
    myArmyUnits: [mk('a1', 10, 10, 1), mk('a2', 10, 11, 1), mk('a3', 11, 10, 1)],
    enemyUnits: [mk('e1', 13, 10, 2), mk('e2', 13, 11, 2)],
    lockedUnitIds: new Set(['a2']), strengthOf: () => 1, distance: E.hexDistance, inAttackRange: () => false,
    params: { reachMoves: 3, minRatio: 0.8, clusterLink: 3, reachSlack: 1 },
  });
  ok(plan2.reason === 'ok' && plan2.orders.length === 2 && plan2.orders.every(o => o.kind === 'approach'), 'zblizanie, jednostka zablokowana pominieta');
}

console.log(`\nWYNIK: ${passed} PASS, ${failed} FAIL`);
S.cleanup(E);
process.exit(failed === 0 ? 0 : 1);
