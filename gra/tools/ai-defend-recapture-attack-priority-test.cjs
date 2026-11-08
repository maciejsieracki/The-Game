'use strict';
/**
 * ai-defend-recapture-attack-priority-test.cjs -- R-WEB-AI-DEFEND-RECAPTURE-ATTACK-PRIORITY-Q1.
 * Uruchom z gra/:  node tools/ai-defend-recapture-attack-priority-test.cjs
 *   [opcjonalnie] BASE_SRC=<katalog src bazy> -- silnik PRZED (dowod, ze testy padaja na kodzie sprzed zmian).
 *
 * Specyfikacja wlasciciela (2026-11-08): WLASNE TERYTORIUM = miasta ZALOZONE przez cywilizacje (takze utracone).
 * Kolejnosc: 1. obrona, 2. odzyskanie utraconych miast, 3. dopiero atak. Atakowana cywilizacja odwoluje WSZYSTKIE armie.
 *
 * T1 (i)   armia w marszu na cywilizacje X, Y zajmuje miasto AI -> armia zawraca (kierunek do miasta), odbija PRZED zdobyciem celu X.
 * T2 (ii)  miasto zalozone przeze mnie, po lancuchu przejec (A -> Y -> X): nadal "utracone" -> odbicie przed atakiem na trzecia civ.
 * T3 (iii) zdobyte cudze miasto NIE staje sie "moje zalozone" (twórca zachowany przy zdobyciu, takze po utracie).
 * T4 (iv)  kolejnosc obrona > odzyskanie > atak (jedna armia, trzy cele) -- planHomeWar.
 * T5 (v)   zgodnosc zapisu bez pola tworcy (fallback capturedFromOwnerId; foundedByOwner/aktualny wlasciciel).
 * T6       wyjatek: oblezenie/wejscie do miasta konczacego zagrozenie zostaje; oblezenie cudzego z boku jest odwolane.
 * T7       za slabi na odbicie -> zbiorka w domu (zero ofensywy w tle).
 */
const assert = require('assert');
const path = require('path');
const S = require('./ai-war-defend-home-sim.cjs');

let passed = 0; let failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.log('  FAIL: ' + msg); } }
function section(t) { console.log('\n--- ' + t + ' ---'); }

const BASE_SRC = process.env.BASE_SRC || null;
const E = S.loadEngine(BASE_SRC, BASE_SRC ? 'drbase' : 'drnew');
const NEW = typeof E.isCityLostOf === 'function';
if (BASE_SRC) console.log(`[silnik PRZED: ${BASE_SRC}; pole tworcy w silniku: ${NEW}]`);

function units(owner, pre, list) { return list.map(([q, r], i) => S.mkUnit(`${pre}${i}`, owner, q, r)); }
function sc(extra) {
  return Object.assign({ map: S.makeMap(46, 22), wars: new Set(['1_2', '1_3', '2_3']), aiOwners: [1] }, extra);
}
function run(scenario, o) { return S.simulate(scenario, Object.assign({ engine: E, homeDefense: true, turns: 40 }, o)); }
const avgDist = (st, owner, q, r) => {
  const a = st.units.filter(u => u.ownerId === owner);
  return a.reduce((x, u) => x + E.hexDistance(u.q, u.r, q, r), 0) / Math.max(1, a.length);
};

// --- T1 (i): armia w marszu na X, Y zajmuje miasto AI ------------------------------------
// A=1: a1 (6,10), a2 (7,15) utracone (Y=2 trzyma, tworca 1); armia A (6 j.) stoi 14 hexow od a1, 24 od a2? -> w polu 28,10.
// Cel ofensywy: X=3 stolica x1 (40,10) (12 hexow od armii). Y=2 garnizon 1 j. w a2.
function scMarchThenLoss() {
  const s = sc({
    units: [...units(1, 'f', [[28, 10], [28, 11], [29, 10], [29, 11], [28, 9], [29, 9]]),
      ...units(2, 'g', [[7, 15]])],
    cities: [S.mkCity('a1', 1, 6, 10), S.mkCity('a2', 1, 7, 15), S.mkCity('x1', 3, 40, 10)],
  });
  const a2 = s.cities.find(c => c.id === 'a2');
  a2.ownerId = 2; a2.capturedFromOwnerId = 1; a2.foundedBy = 1; a2.origOwner = 1;
  return s;
}
section('T1 (i): armia w marszu na X zawraca, gdy Y zajal jej miasto');
{
  const st = scMarchThenLoss();
  let d3 = null; let dX3 = null;
  const r = S.simulate(st, { engine: E, homeDefense: true, turns: 30, onTurn: (t, s) => {
    if (t === 3) { d3 = avgDist(s, 1, 7, 15); dX3 = avgDist(s, 1, 40, 10); }
  } });
  ok(d3 !== null && d3 < 21, `armia A zmierza do utraconego a2 (srednia odleglosc po 3 turach = ${d3}, start ~21)`);
  ok(dX3 !== null && dX3 > 8, `armia A NIE idzie na cel ofensywy X (odleglosc od x1 po 3 turach = ${dX3}, start ~12)`);
  const rec = r.captureLog.find(c => c.cityId === 'a2' && c.by === 1);
  const atk = r.captureLog.find(c => c.cityId === 'x1' && c.by === 1);
  ok(rec !== undefined, `A odbija a2 (t=${rec && rec.turn})`);
  ok(rec !== undefined && (atk === undefined || rec.turn < atk.turn), `odbicie a2 (t=${rec && rec.turn}) PRZED zdobyciem x1 (t=${atk && atk.turn})`);
}

// --- T2 (ii): lancuch przejec A -> Y -> X; trzecia civ blizej ------------------------------
function scChain() {
  const s = sc({
    wars: new Set(['1_2', '1_3', '2_3']),
    units: [...units(1, 'f', [[26, 10], [26, 11], [27, 10], [27, 11], [26, 9], [27, 9]]),
      ...units(3, 'g', [[8, 15]])],
    cities: [S.mkCity('a1', 1, 6, 10), S.mkCity('c9', 3, 8, 15), S.mkCity('y1', 2, 34, 10)],
  });
  const c9 = s.cities.find(c => c.id === 'c9');
  // zalozone przez A (1), zajete przez Y (2), potem przez X (3): capturedFromOwnerId = 2 (NIE 1).
  c9.foundedBy = 1; c9.capturedFromOwnerId = 2; c9.origOwner = 1;
  return s;
}
section('T2 (ii): miasto zalozone przeze mnie po lancuchu przejec -> odbicie przed atakiem na trzecia civ');
{
  const r = run(scChain(), { turns: 40 });
  const rec = r.captureLog.find(c => c.cityId === 'c9' && c.by === 1);
  const atk = r.captureLog.find(c => c.cityId === 'y1' && c.by === 1);
  ok(rec !== undefined, `A odbija c9 mimo capturedFromOwnerId != A (t=${rec && rec.turn})`);
  ok(rec !== undefined && (atk === undefined || rec.turn < atk.turn), `odbicie c9 (t=${rec && rec.turn}) PRZED zdobyciem y1 (t=${atk && atk.turn})`);
}

// --- T3 (iii): zdobyte cudze miasto nie staje sie "moje zalozone" ---------------------------
section('T3 (iii): zdobyte cudze miasto NIE jest "moje zalozone"');
if (NEW) {
  // Realne funkcje z cities.ts: A (1) zdobywa miasto zalozone przez X (3), potem traci je na rzecz Y (2).
  const city = { id: 'k', ownerId: 3, q: 1, r: 1 };
  E.stampCityFounderOnCapture(city, 3); city.capturedFromOwnerId = 3; city.foundedByOwner = false; city.ownerId = 1; // A zdobywa
  E.stampCityFounderOnCapture(city, 1); city.capturedFromOwnerId = 1; city.ownerId = 2; // Y zdobywa od A
  ok(city.foundedBy === 3, `tworca zachowany przy kolejnych zdobyciach (foundedBy=${city.foundedBy})`);
  ok(E.isCityLostOf(city, 1) === false, 'miasto zdobyte przez A i utracone NIE jest "utracone" A');
  ok(E.isCityLostOf(city, 3) === true, 'tworca X (3) uznaje je za utracone');
  // Planer: A nie wysyla armii do odbicia cudzego miasta.
  const input = {
    ownerId: 1, currentTurn: undefined,
    allUnits: [], myUnits: [{ id: 'm0', ownerId: 1, q: 2, r: 2, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 }],
    myCities: [{ id: 'h', q: 0, r: 0, ownerId: 1 }], allCities: [{ id: 'k', q: 5, r: 5, ownerId: 2, foundedBy: 3, foundedByOwner: false, capturedFromOwnerId: 1 }],
    enemyUnits: [], canEngageOwner: () => true, lockedUnitIds: new Set(), isOwnTerritory: () => false,
    strengthOf: () => 1, isFieldUnit: () => true, distance: E.hexDistance,
  };
  input.allUnits = input.myUnits;
  E.resetHomeWarMemory();
  const plan = E.planHomeWar(input);
  ok(plan.recapture === null && plan.orders.length === 0, 'planer nie planuje odbicia zdobytego cudzego miasta');
} else {
  ok(false, 'silnik bez pola tworcy (PRZED): zdobyte cudze miasto z capturedFromOwnerId=1 jest uznane za "utracone" (zachowanie bledne)');
}
{
  // Sprawdzenie na planerze niezaleznie od wersji silnika: miasto k (tworca 3) trzymane przez Y, capturedFromOwnerId = 1.
  const input = {
    ownerId: 1, currentTurn: undefined,
    allUnits: [], myUnits: [{ id: 'm0', ownerId: 1, q: 2, r: 2, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 }],
    myCities: [{ id: 'h', q: 0, r: 0, ownerId: 1 }], allCities: [{ id: 'k', q: 5, r: 5, ownerId: 2, foundedBy: 3, foundedByOwner: false, capturedFromOwnerId: 1 }],
    enemyUnits: [], canEngageOwner: () => true, lockedUnitIds: new Set(), isOwnTerritory: () => false,
    strengthOf: () => 1, isFieldUnit: () => true, distance: E.hexDistance,
  };
  input.allUnits = input.myUnits;
  E.resetHomeWarMemory();
  const plan = E.planHomeWar(input);
  ok(plan.recapture === null, `planHomeWar: cudze zdobyte miasto nie jest celem odbicia (recapture=${JSON.stringify(plan.recapture)})`);
}

// --- T4 (iv): kolejnosc obrona > odzyskanie > atak (jedna armia, trzy cele) ---------------
section('T4 (iv): jedna jednostka, trzy cele: obrona > odzyskanie > atak');
{
  const mkInput = (withInvader, withLost) => {
    const my = [{ id: 'm0', ownerId: 1, q: 10, r: 10, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 }];
    const inv = withInvader ? [{ id: 'e0', ownerId: 2, q: 3, r: 0, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 }] : [];
    const cities = [{ id: 'h', q: 0, r: 0, ownerId: 1 }, { id: 'x1', q: 30, r: 10, ownerId: 3 }];
    if (withLost) cities.push({ id: 'lost', q: 20, r: 20, ownerId: 2, foundedBy: 1, capturedFromOwnerId: 1 });
    return {
      ownerId: 1, currentTurn: undefined, allUnits: [...my, ...inv], myUnits: my,
      myCities: [cities[0]], allCities: cities, enemyUnits: inv,
      canEngageOwner: () => true, lockedUnitIds: new Set(),
      isOwnTerritory: (q, r) => E.hexDistance(q, r, 0, 0) <= 4,
      strengthOf: () => 1, isFieldUnit: () => true, distance: E.hexDistance,
    };
  };
  E.resetHomeWarMemory();
  const all = E.planHomeWar(mkInput(true, true));
  ok(all.orders.length === 1 && all.orders[0].task === 'p2', `obrona pierwsza: rozkaz p2 (${JSON.stringify(all.orders.map(o => o.task))})`);
  ok(all.recapture === null || all.recapture.assigned === 0, 'odzyskanie nie dostaje jednostki, gdy obrona ja zajela');
  E.resetHomeWarMemory();
  const noInv = E.planHomeWar(mkInput(false, true));
  ok(noInv.orders.length === 1 && noInv.orders[0].task === 'p1' && noInv.orders[0].toQ === 20, `odzyskanie przed atakiem: rozkaz p1 do utraconego (${JSON.stringify(noInv.orders)})`);
  E.resetHomeWarMemory();
  const none = E.planHomeWar(mkInput(false, false));
  ok(none.orders.length === 0, 'bez zagrozenia i bez utraconych: atak (P3) nietkniety (brak rozkazow nakladki)');
}

// --- T5 (v): zgodnosc zapisu bez pola tworcy -----------------------------------------------
section('T5 (v): zapis bez pola tworcy');
if (NEW) {
  ok(E.cityFounderId({ ownerId: 4 }) === 4, 'stary zapis, miasto niezdobyte: tworca = biezacy wlasciciel');
  ok(E.cityFounderId({ ownerId: 4, foundedByOwner: false }) === undefined, 'stary zapis, miasto zdobyte: tworca nieznany');
  ok(E.isCityLostOf({ ownerId: 2, foundedByOwner: false, capturedFromOwnerId: 1 }, 1) === true, 'stary zapis: utracone wg capturedFromOwnerId (dotychczasowa definicja)');
  ok(E.isCityLostOf({ ownerId: 2, capturedFromOwnerId: 3 }, 1) === false, 'stary zapis: capturedFromOwnerId innej civ -> nie moje');
  ok(E.isCityLostOf({ ownerId: 1, foundedBy: 1 }, 1) === false, 'wlasne obecnie miasto nie jest "utracone"');
  const c = { ownerId: 1 }; E.stampCityFounderOnCapture(c, 1); E.stampCityFounderOnCapture(c, 2);
  ok(c.foundedBy === 1, 'stampowanie idempotentne (nie nadpisuje tworcy)');
  const legacyCaptured = { ownerId: 1, foundedByOwner: false }; E.stampCityFounderOnCapture(legacyCaptured, 1);
  ok(legacyCaptured.foundedBy === undefined, 'zdobyte miasto ze starego zapisu: brak zgadywania tworcy');
} else {
  ok(false, 'silnik PRZED nie ma cityFounderId/isCityLostOf');
}

// --- T6: wyjatek oblezenia ---------------------------------------------------------------
section('T6: oblezenie konczace zagrozenie zostaje, oblezenie cudzego z boku jest odwolane');
{
  const mk = (relevant) => {
    const my = [
      { id: 's1', ownerId: 1, q: 30, r: 10, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2, oblegaCityId: 'x1' },
      { id: 's2', ownerId: 1, q: 29, r: 10, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 },
    ];
    const inv = [{ id: 'e0', ownerId: 2, q: 3, r: 0, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 }];
    return {
      ownerId: 1, currentTurn: undefined, allUnits: [...my, ...inv], myUnits: my,
      myCities: [{ id: 'h', q: 0, r: 0, ownerId: 1 }], allCities: [{ id: 'h', q: 0, r: 0, ownerId: 1 }, { id: 'x1', q: 31, r: 10, ownerId: 3 }],
      enemyUnits: inv, canEngageOwner: () => true, lockedUnitIds: new Set(),
      isOwnTerritory: (q, r) => E.hexDistance(q, r, 0, 0) <= 4,
      isRelevantSiege: relevant === undefined ? undefined : () => relevant,
      strengthOf: () => 1, isFieldUnit: () => true, distance: E.hexDistance,
    };
  };
  E.resetHomeWarMemory();
  const side = E.planHomeWar(mk(false));
  ok(side.orders.some(o => o.unitId === 's1'), 'oblezenie cudzego miasta z boku: obleganie przerwane, jednostka wraca do obrony');
  E.resetHomeWarMemory();
  const rel = E.planHomeWar(mk(true));
  ok(!rel.orders.some(o => o.unitId === 's1'), 'oblezenie miasta konczacego zagrozenie: jednostka zostaje');
}

// --- T7: za slabi na odbicie -> zbiorka w domu ------------------------------------------
section('T7: za slabi na odbicie -> zbiorka w domu, bez ofensywy w tle');
{
  const my = [{ id: 'm0', ownerId: 1, q: 25, r: 10, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 }];
  const def = [1, 2, 3, 4].map(i => ({ id: 'd' + i, ownerId: 2, q: 20, r: 20, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 }));
  const cities = [{ id: 'h', q: 0, r: 0, ownerId: 1 }, { id: 'lost', q: 20, r: 20, ownerId: 2, foundedBy: 1, capturedFromOwnerId: 1 }];
  E.resetHomeWarMemory();
  const plan = E.planHomeWar({
    ownerId: 1, currentTurn: undefined, allUnits: [...my, ...def], myUnits: my, myCities: [cities[0]], allCities: cities,
    enemyUnits: [], canEngageOwner: () => true, lockedUnitIds: new Set(), isOwnTerritory: () => false,
    strengthOf: () => 1, isFieldUnit: () => true, distance: E.hexDistance,
  });
  ok(plan.recapture && plan.recapture.mode === 'wait', `tryb odbicia = wait (${JSON.stringify(plan.recapture)})`);
  ok(plan.orders.length === 1 && plan.orders[0].kind === 'hold' && plan.orders[0].toQ === 0, `jednostka wraca do miasta (${JSON.stringify(plan.orders)})`);
}

S.cleanup(E);
console.log(`\nai-defend-recapture-attack-priority-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
