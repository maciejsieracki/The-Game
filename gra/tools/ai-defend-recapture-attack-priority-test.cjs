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

// --- T8 (dodatek 2/3): klasyfikacja S1/S2/S3 per cywilizacja, kluczem tworca -------------
section('T8 (dodatek 2/3): S1/S2/S3 per cywilizacja (tworca = historia, wlasciciel = teraz)');
if (NEW) {
  const m = { id: 'M', ownerId: 1, q: 3, r: 3, foundedBy: 1, foundedByOwner: true };
  ok(E.ownTerritoryClassOf(m, 1) === 'S1', 'zalozone i trzymane przeze mnie = S1');
  ok(E.ownTerritoryClassOf(m, 2) === null, 'obca civ bez zwiazku z miastem -> null');
  // A (1) zalozyl, B (2) zdobyl: dla A S2, dla B S3, dla C (3) null.
  const ab = { id: 'M', ownerId: 1, q: 3, r: 3, foundedBy: 1, foundedByOwner: true };
  E.stampCityFounderOnCapture(ab, 1); ab.capturedFromOwnerId = 1; ab.foundedByOwner = false; ab.ownerId = 2;
  ok(E.ownTerritoryClassOf(ab, 1) === 'S2', 'A (zalozyciel, utracone) = S2');
  ok(E.ownTerritoryClassOf(ab, 2) === 'S3', 'B (zdobywca, trzyma) = S3');
  ok(E.ownTerritoryClassOf(ab, 3) === null, 'C (trzecia civ) = poza "wlasnym"');
  // Lancuch: B zdobyl od A, potem C zdobyl od B. Dla B miasto nie jest wlasne (nie zalozyl), dla A nadal S2.
  E.stampCityFounderOnCapture(ab, 2); ab.capturedFromOwnerId = 2; ab.ownerId = 3;
  ok(E.ownTerritoryClassOf(ab, 2) === null, 'PRZYPADEK BRZEGOWY: B po utracie M na rzecz C -> nie wlasne (null)');
  ok(E.ownTerritoryClassOf(ab, 1) === 'S2', 'PRZYPADEK BRZEGOWY: A nadal S2 (zalozone, utracone)');
  ok(E.ownTerritoryClassOf(ab, 3) === 'S3', 'PRZYPADEK BRZEGOWY: C (zdobywca) = S3');
  // Stary zapis (bez pola tworcy) zdobyty: zdobywca nie zgaduje tworcy (S3), poprzedni wlasciciel = S2 (fallback).
  const legacy = { id: 'L', ownerId: 2, foundedByOwner: false, capturedFromOwnerId: 1 };
  ok(E.ownTerritoryClassOf(legacy, 2) === 'S3', 'stary zapis zdobyty: zdobywca = S3');
  ok(E.ownTerritoryClassOf(legacy, 1) === 'S2', 'stary zapis zdobyty: poprzedni wlasciciel (capturedFromOwnerId) = S2');
}

// --- T9: kolejnosc S1 -> S2 -> S3 -> atak, z jedna armia -------------------------------------
section('T9 (dodatek 2): kolejnosc S1 obrona > S2 odzyskanie > S3 utrzymanie > atak');
{
  const base = (inv, lost, s3Home) => {
    const my = [{ id: 'm0', ownerId: 1, q: 10, r: 10, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 }];
    const enemies = inv.map(([id, q, r]) => ({ id, ownerId: 2, q, r, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 }));
    // Miasto domowe S1 (0,0) zalozone przeze mnie; opcjonalnie S3 (zdobyte, zalozone przez 3) na (6,0).
    const cities = [{ id: 'h', q: 0, r: 0, ownerId: 1, foundedBy: 1 }];
    if (s3Home) cities.push({ id: 's3', q: 6, r: 0, ownerId: 1, foundedBy: 3, foundedByOwner: false, capturedFromOwnerId: 3 });
    if (lost) cities.push({ id: 'lost', q: 20, r: 20, ownerId: 2, foundedBy: 1, capturedFromOwnerId: 1 });
    return {
      ownerId: 1, currentTurn: undefined, allUnits: [...my, ...enemies], myUnits: my,
      myCities: cities.filter(c => c.ownerId === 1), allCities: cities, enemyUnits: enemies,
      canEngageOwner: () => true, lockedUnitIds: new Set(),
      isOwnTerritory: (q, r) => E.hexDistance(q, r, 0, 0) <= 4 || E.hexDistance(q, r, 6, 0) <= 3,
      strengthOf: () => 1, isFieldUnit: () => true, distance: E.hexDistance,
    };
  };
  // S3 zagrozenie (przy S3 domu, blizej armii) + S2 do odbicia -> odbicie (p1) dostaje jednostke, S3 nie.
  E.resetHomeWarMemory();
  const s2vsS3 = E.planHomeWar(base([['e3', 7, 0]], true, true));
  ok(s2vsS3.orders.length === 1 && s2vsS3.orders[0].task === 'p1', `S2 odzyskanie przed S3 utrzymaniem (${JSON.stringify(s2vsS3.orders.map(o => o.task))})`);
  // S1 zagrozenie + S2 -> obrona S1 (p2), S2 nie dostaje jednostki.
  E.resetHomeWarMemory();
  const s1vsS2 = E.planHomeWar(base([['e1', 2, 0]], true, false));
  ok(s1vsS2.orders.length === 1 && s1vsS2.orders[0].task === 'p2', `S1 obrona przed S2 odzyskaniem (${JSON.stringify(s1vsS2.orders.map(o => o.task))})`);
  // Tylko S3 zagrozenie, bez S2 -> utrzymanie (p2), zadnej ofensywy (rdzen nie tkniety).
  E.resetHomeWarMemory();
  const s3only = E.planHomeWar(base([['e3', 7, 0]], false, true));
  ok(s3only.orders.length === 1 && s3only.orders[0].task === 'p2',
    `S3 zagrozenie bez S2: utrzymanie (p2) (${JSON.stringify(s3only.orders)})`);
  // Brak zagrozen i S2 -> odbicie, S3 nie generuje rozkazow.
  E.resetHomeWarMemory();
  const none = E.planHomeWar(base([], true, true));
  ok(none.orders.length === 1 && none.orders[0].task === 'p1', 'bez zagrozen: S2 odbicie, brak rozkazu dla S3');
}

// --- T10 (KONTAKT, dodatek 1): bez kontaktu z wlascicielem utraconego miasta -> brak celu -----
section('T10 (KONTAKT): AI bez kontaktu z X nie dostaje celu odzyskania X');
{
  const mk = (hasContact) => ({
    ownerId: 1, currentTurn: undefined,
    allUnits: [{ id: 'm0', ownerId: 1, q: 25, r: 10, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 }],
    myUnits: [{ id: 'm0', ownerId: 1, q: 25, r: 10, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 }],
    myCities: [{ id: 'h', q: 0, r: 0, ownerId: 1, foundedBy: 1 }],
    allCities: [{ id: 'h', q: 0, r: 0, ownerId: 1, foundedBy: 1 }, { id: 'lost', q: 20, r: 20, ownerId: 2, foundedBy: 1, capturedFromOwnerId: 1 }],
    enemyUnits: [], canEngageOwner: () => true, hasContactWith: hasContact ? () => true : () => false,
    lockedUnitIds: new Set(), isOwnTerritory: () => false,
    strengthOf: () => 1, isFieldUnit: () => true, distance: E.hexDistance,
  });
  E.resetHomeWarMemory();
  const withC = E.planHomeWar(mk(true));
  ok(withC.recapture !== null && withC.orders.length === 1, 'z kontaktem: odbicie utraconego miasta planowane (kontrola)');
  E.resetHomeWarMemory();
  const noC = E.planHomeWar(mk(false));
  ok(noC.recapture === null && noC.orders.length === 0, `bez kontaktu z X: brak celu odbicia i brak rozkazow (${JSON.stringify(noC)})`);
}

// --- T11 (KONTAKT, zrodlo): bramka widocznosci i kontakt w main.ts / ai.ts -----------------
section('T11 (KONTAKT, zrodlo): kolejnosc bramek wojna -> kontakt -> wyjatek mgly');
{
  const fs = require('fs');
  const mainSrc = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
  const aiSrc = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'game', 'ai.ts'), 'utf8');
  const warIdx = mainSrc.indexOf('if (!areEnemyOwners(ownerId, defender.ownerId)) {');
  const nearIdx = mainSrc.indexOf('const targetNearLostCity');
  ok(warIdx > 0 && nearIdx > warIdx, 'wyjatek mgly (targetNearLostCity) stoi PO bramce wojny areEnemyOwners');
  const nearBlock = mainSrc.slice(nearIdx, nearIdx + 600);
  ok(nearBlock.includes('lc.ownerId === defender.ownerId'), 'wyjatek mgly: tylko garnizon wlasciciela utraconego miasta');
  ok(nearBlock.includes('tradeContactBetween(ownerId, defender.ownerId)'), 'wyjatek mgly: wymagany kontakt (tradeContactBetween)');
  ok(mainSrc.includes('hasContactWith: (targetOwnerId: number) => isBarbarian(targetOwnerId)'), 'main.ts: opts.hasContactWith podpiete do AI');
  ok(aiSrc.includes('function aiHasContactWith(opts: AITurnOpts'), 'ai.ts: bramka kontaktu aiHasContactWith');
  ok((aiSrc.match(/aiHasContactWith\(opts,/g) || []).length >= 4, 'ai.ts: kontakt sprawdzany w zagrozeniu, zakonczeniu zagrozenia i planerze');
}

// --- T12 (dodatek 3): A zalozyl M, B zdobyl M, C trzecia --------------------------------------
section('T12 (dodatek 3): A zalozyl M, B zdobyl M: A odzyskuje, B broni, C nie ma M');
{
  const M = () => ({ id: 'M', q: 20, r: 20, ownerId: 2, foundedBy: 1, foundedByOwner: false, capturedFromOwnerId: 1 });
  const base = (ownerId, myCities, units) => ({
    ownerId, currentTurn: undefined,
    allUnits: units, myUnits: units.filter(u => u.ownerId === ownerId),
    myCities, allCities: [...myCities, M()],
    enemyUnits: units.filter(u => u.ownerId !== ownerId && u.ownerId !== 0),
    canEngageOwner: () => true, hasContactWith: () => true, lockedUnitIds: new Set(),
    isOwnTerritory: (q, r) => myCities.some(c => E.hexDistance(q, r, c.q, c.r) <= 4),
    strengthOf: () => 1, isFieldUnit: () => true, distance: E.hexDistance,
  });
  const aUnit = { id: 'a0', ownerId: 1, q: 5, r: 5, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 };
  const bUnit = { id: 'b0', ownerId: 2, q: 21, r: 20, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 };
  const bHome = { id: 'bh', q: 22, r: 20, ownerId: 2, foundedBy: 2 };
  const aHome = { id: 'ah', q: 0, r: 0, ownerId: 1, foundedBy: 1 };
  // Dla A (zalozyciel): M = S2 -> planer odbija M (p1).
  E.resetHomeWarMemory();
  const pa = E.planHomeWar(base(1, [aHome], [aUnit]));
  ok(pa.recapture !== null && pa.recapture.cityId === 'M', 'A: M (S2) jest celem odzyskania');
  // Dla B (zdobywca): M = S3 -> planer B nie odbija M jako S2, a zagrozenie M traktuje jako S3 (obrona p2).
  E.resetHomeWarMemory();
  const bCities = [bHome, Object.assign({}, M(), { ownerId: 2 })];
  const eA = { id: 'e9', ownerId: 1, q: 19, r: 20, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 };
  const pb = E.planHomeWar(Object.assign(base(2, bCities, [bUnit, eA]), {
    allCities: bCities,
    enemyUnits: [eA],
    isOwnTerritory: (q, r) => E.hexDistance(q, r, 20, 20) <= 4 || E.hexDistance(q, r, 22, 20) <= 4,
  }));
  ok(pb.recapture === null, 'B: nie ma odbicia (M nie jest jego zalozeniem)');
  ok(pb.orders.length >= 1 && pb.orders.every(o => o.task === 'p2'), `B: zagrozenie M = obrona utrzymania (p2) (${JSON.stringify(pb.orders.map(o => o.task))})`);
  // Dla C (trzecia): M nie jest wlasne, nie ma odbicia ani obrony M.
  E.resetHomeWarMemory();
  const cHome = { id: 'ch', q: 40, r: 40, ownerId: 3, foundedBy: 3 };
  const cUnit = { id: 'c0', ownerId: 3, q: 39, r: 40, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 };
  const pc = E.planHomeWar(base(3, [cHome], [cUnit]));
  ok(pc.recapture === null && pc.orders.length === 0, 'C: M poza "wlasnym" (brak odbicia i brak obrony M)');
  ok(E.ownTerritoryClassOf(M(), 3) === null, 'C: klasyfikacja M = null');
  ok(E.ownTerritoryClassOf(M(), 2) === 'S3', 'B: klasyfikacja M = S3');
  ok(E.ownTerritoryClassOf(M(), 1) === 'S2', 'A: klasyfikacja M = S2');
}

S.cleanup(E);
console.log(`\nai-defend-recapture-attack-priority-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
