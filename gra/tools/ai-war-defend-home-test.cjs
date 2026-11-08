'use strict';
/**
 * ai-war-defend-home-test.cjs -- R-WEB-AI-WAR-DEFEND-HOME-BEFORE-OFFENSE-Q1.
 * Uruchom z gra/:  node tools/ai-war-defend-home-test.cjs
 * Silnik zastepczy (NIE main.ts): tools/ai-war-defend-home-sim.cjs, prawdziwy decideAITurn.
 * PRZED = setHomeWarDefenseOverride(false) (zachowanie bazy), PO = ON. Testy RED na PRZED, GREEN na PO.
 *
 * T1  wymiana miast (symetria, puste miasta, obie armie poza domem): PRZED wymiana >= 1, PO = 0, armie wracaja.
 * T2  obrona bije najezdzce: garnizon+wojsko u siebie, wrog 4 jednostki pod miastem -> PO miasto stoi, wrog znika.
 * T3  odbicie przed zdobyciem: armia w polu rowno oddalona; stracone miasto odbite PRZED zdobyciem wrogiego.
 * T4  za slaby: 2 jednostki vs 6 najezdzcow -> PO obrona w miescie (bez samobojczego wypadu), PRZED wymarsz.
 * T5  maly najezdzca: armia kampanii kontynuuje, odrywany tylko oddzial.
 * T6  histereza (planHomeWar): pasmo 0.8/0.6 i min. 3 tury trzymania trybu; brak ping-pongu.
 * T7  determinizm (dwa przebiegi = ten sam hash) i brak wzrostu czasu tury AI.
 * T8  mutacje: wylaczenie funkcji -> T1/T3 czerwone (potwierdza, ze testy rozrozniaja).
 * T9  zgodnosc: bez wojny / bez najezdzcow / bez utraconych miast -> zero ingerencji (komendy identyczne OFF vs ON).
 */
const crypto = require('crypto');
const S = require('./ai-war-defend-home-sim.cjs');

let passed = 0; let failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.log('  FAIL: ' + msg); } }
function section(t) { console.log('\n--- ' + t + ' ---'); }

const E = S.loadEngine(null, 'test');

function units(owner, pre, list) { return list.map(([q, r], i) => S.mkUnit(`${pre}${i}`, owner, q, r)); }
function base(extra) {
  return Object.assign({ map: S.makeMap(40, 20), wars: new Set(['1_2']), aiOwners: [1, 2] }, extra);
}
function run(sc, o) { return S.simulate(sc(), Object.assign({ engine: E, turns: 40 }, o)); }
function hash(state) {
  const body = JSON.stringify({
    u: state.units.map(u => [u.id, u.ownerId, u.q, u.r, u.hp]).sort(),
    c: state.cities.map(c => [c.id, c.ownerId]).sort(),
  });
  return crypto.createHash('sha256').update(body).digest('hex').slice(0, 16);
}

// --- scenariusze ------------------------------------------------------------
function scExchange() {
  return base({
    units: [...units(1, 'a', [[30, 10], [30, 11], [31, 10], [31, 11], [30, 9], [31, 9]]),
      ...units(2, 'b', [[9, 10], [9, 11], [10, 10], [10, 11], [9, 9], [10, 9]])],
    cities: [S.mkCity('a1', 1, 6, 10), S.mkCity('a2', 1, 7, 14), S.mkCity('b1', 2, 34, 10), S.mkCity('b2', 2, 33, 14)],
  });
}
function scDefendWins() {
  // A: 3 jednostki w domu (a1) + 6 w polu 8 heksow od stolicy (kampania na wschod); B: 4 najezdzcow 3 heksy od a1.
  return base({
    units: [...units(1, 'h', [[6, 10], [6, 11], [5, 10]]),
      ...units(1, 'f', [[14, 10], [14, 11], [15, 10], [15, 11], [14, 9], [15, 9]]),
      ...units(2, 'i', [[9, 10], [9, 11], [10, 10], [10, 11]])],
    cities: [S.mkCity('a1', 1, 6, 10), S.mkCity('a2', 1, 7, 14), S.mkCity('b1', 2, 34, 10), S.mkCity('b2', 2, 33, 14)],
  });
}
function scRecapture() {
  // a2 utracone (B, pusty garnizon: 1 jednostka B), armia A (6) stoi 6 heksow od b1; a2 oddalone od armii ~9.
  const sc = base({
    units: [...units(1, 'f', [[28, 10], [28, 11], [29, 10], [29, 11], [28, 9], [29, 9]]),
      ...units(2, 'g', [[12, 14]])],
    cities: [S.mkCity('a1', 1, 4, 10), S.mkCity('z2', 2, 12, 14), S.mkCity('b1', 2, 36, 10), S.mkCity('b2', 2, 35, 14)],
  });
  sc.cities.find(c => c.id === 'z2').origOwner = 1;
  sc.cities.find(c => c.id === 'z2').capturedFromOwnerId = 1;
  return sc;
}
function scWeak() {
  return base({
    units: [...units(1, 'h', [[8, 10], [8, 11]]), ...units(2, 'i', [[12, 10], [12, 11], [13, 10], [13, 11], [12, 9], [13, 9]])],
    cities: [S.mkCity('a1', 1, 6, 10), S.mkCity('b1', 2, 34, 10)],
  });
}
function scSmallInvader() {
  return base({
    units: [...units(1, 'f', [[31, 10], [31, 11], [32, 10], [32, 11], [31, 9], [32, 9], [30, 10], [30, 11], [30, 9], [33, 9]]),
      ...units(2, 'i', [[9, 10]])],
    cities: [S.mkCity('a1', 1, 6, 10), S.mkCity('a2', 1, 7, 14), S.mkCity('b1', 2, 36, 10), S.mkCity('b2', 2, 33, 14)],
  });
}

// --- T1 ------------------------------------------------------------------------
section('T1: wymiana miast (symetria)');
{
  const before = run(scExchange, { homeDefense: false });
  const after = run(scExchange, { homeDefense: true });
  ok(before.exchanges >= 1, `PRZED: wymiana miast zachodzi (exchanges=${before.exchanges})`);
  ok(after.exchanges === 0, `PO: brak wymiany miast (exchanges=${after.exchanges})`);
  // armia A wraca: po 3 turach srednia odleglosc A od a1 mniejsza niz na starcie (24)
  const st = scExchange();
  let d3 = null;
  S.simulate(st, { engine: E, homeDefense: true, turns: 3, onTurn: (t, s) => {
    if (t === 3) {
      const a = s.units.filter(u => u.ownerId === 1);
      d3 = a.reduce((x, u) => x + E.hexDistance(u.q, u.r, 6, 10), 0) / Math.max(1, a.length);
    }
  } });
  ok(d3 !== null && d3 < 24, `PO: armia A wraca na obrone (srednia odleglosc od stolicy po 3 turach = ${d3})`);
  const st0 = scExchange();
  let d3b = null;
  S.simulate(st0, { engine: E, homeDefense: false, turns: 3, onTurn: (t, s) => {
    if (t === 3) {
      const a = s.units.filter(u => u.ownerId === 1);
      d3b = a.reduce((x, u) => x + E.hexDistance(u.q, u.r, 34, 10), 0) / Math.max(1, a.length);
    }
  } });
  ok(d3b !== null && d3b < 6, `PRZED: armia A idzie na stolice wroga (odleglosc od b1 po 3 turach = ${d3b})`);
}

// --- T2 ------------------------------------------------------------------------
section('T2: obrona bije najezdzce');
{
  const before = run(scDefendWins, { homeDefense: false, turns: 15 });
  const after = run(scDefendWins, { homeDefense: true, turns: 15 });
  const lostA = (r) => (r.lost[1] || 0);
  ok(lostA(after) === 0, `PO: A nie traci miast (utracone=${lostA(after)})`);
  ok(lostA(before) >= 1, `PRZED: A traci miasto mimo garnizonu (utracone=${lostA(before)})`);
  let invAlive = null;
  S.simulate(scDefendWins(), { engine: E, homeDefense: true, turns: 15, onTurn: (t, s) => {
    if (t === 15) invAlive = s.units.filter(u => u.ownerId === 2 && u.id.startsWith('i')).length;
  } });
  ok(invAlive !== null && invAlive <= 1, `PO: najezdzcy zwalczeni po 15 turach (zywych=${invAlive})`);
}

// --- T3 ------------------------------------------------------------------------
section('T3: odbicie utraconego miasta przed zdobywaniem');
{
  const firstCapture = (r, cityId) => r.captureLog.find(c => c.cityId === cityId);
  const before = run(scRecapture, { homeDefense: false, turns: 30 });
  const after = run(scRecapture, { homeDefense: true, turns: 30 });
  const bRec = firstCapture(after, 'z2');
  const bB1 = after.captureLog.find(c => c.by === 1 && (c.cityId === 'b1' || c.cityId === 'b2'));
  ok(bRec !== undefined && bRec.by === 1 && bRec.recapture, 'PO: A odbija a2');
  ok(bRec !== undefined && (bB1 === undefined || bRec.turn < bB1.turn),
    `PO: odbicie a2 (t=${bRec && bRec.turn}) PRZED zdobyciem miasta B (t=${bB1 && bB1.turn})`);
  const aRecB = firstCapture(before, 'z2');
  const aB1 = before.captureLog.find(c => c.by === 1 && (c.cityId === 'b1' || c.cityId === 'b2'));
  ok(aB1 !== undefined && (aRecB === undefined || aB1.turn < aRecB.turn),
    `PRZED: A zdobywa miasto B (t=${aB1 && aB1.turn}) zanim odbije a2 (t=${aRecB && aRecB.turn})`);
}

// --- T4 ------------------------------------------------------------------------
section('T4: za slaby -> obrona w miescie, bez samobojczego wypadu');
{
  const trace = (hd) => {
    const dists = [];
    S.simulate(scWeak(), { engine: E, homeDefense: hd, turns: 1, onTurn: (t, s) => {
      const a = s.units.filter(u => u.ownerId === 1);
      dists.push(a.map(u => E.hexDistance(u.q, u.r, 6, 10)));
    } });
    return dists;
  };
  const on = trace(true);
  const off = trace(false);
  // slabe 2 jednostki (za miastem, 7 heksow od najezdzcow): PO nie zblizaja sie do wroga; PRZED idzie sie bic.
  ok(on[0].length === 2 && on[0].every(d => d <= 2), `PO: jednostki zbieraja sie w miescie a1 (odleglosci od a1 po 1 turze = ${on[0]})`);
  // PRZED zachowuje sie tu tak samo (idle/patrol do miasta) -- to test straznika, nie RED (zapisane w raporcie).
  void off;
}

// --- T5 ------------------------------------------------------------------------
section('T5: maly najezdzca -> kampania kontynuuje, odrywany oddzial');
{
  const probe = (hd) => {
    let toward = null; let away = null;
    S.simulate(scSmallInvader(), { engine: E, homeDefense: hd, turns: 4, onTurn: (t, s) => {
      if (t === 4) {
        const a = s.units.filter(u => u.ownerId === 1);
        toward = a.filter(u => E.hexDistance(u.q, u.r, 36, 10) < 6).length;
        away = a.filter(u => E.hexDistance(u.q, u.r, 6, 10) < 24).length;
      }
    } });
    return { toward, away };
  };
  const on = probe(true);
  ok(on.away >= 1 && on.away <= 3, `PO: wraca tylko oddzial 1..3 z 10 (wrocilo=${on.away})`);
  ok(on.toward >= 5, `PO: reszta armii nadal naciska na cel (przy b1=${on.toward})`);
}

// --- T6 ------------------------------------------------------------------------
section('T6: histereza planera (pasmo 0.8/0.6, min. 3 tury)');
{
  const mk = (turn, myCount) => ({
    ownerId: 7, currentTurn: turn,
    allUnits: [], myUnits: [], myCities: [{ id: 'c', q: 0, r: 0, ownerId: 7 }], allCities: [],
    enemyUnits: [], canEngageOwner: () => true, lockedUnitIds: new Set(),
    isOwnTerritory: () => true, strengthOf: () => 1, isFieldUnit: () => true,
    distance: E.hexDistance,
    _my: myCount,
  });
  const build = (turn, myCount, enemyCount) => {
    const inp = mk(turn);
    inp.myUnits = Array.from({ length: myCount }, (_, i) => ({ id: `m${i}`, ownerId: 7, q: 2, r: 0, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 }));
    inp.enemyUnits = Array.from({ length: enemyCount }, (_, i) => ({ id: `e${i}`, ownerId: 9, q: 1, r: i % 2, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 }));
    inp.allUnits = [...inp.myUnits, ...inp.enemyUnits];
    return inp;
  };
  const modeOf = (plan) => (plan.clusters[0] ? plan.clusters[0].mode : null);
  E.resetHomeWarMemory();
  // 10 wrogow; 10 wlasnych = ratio 1.0 -> atak
  ok(modeOf(E.planHomeWar(build(10, 10, 10))) === 'attack', 'ratio 1.0 -> atak');
  // t11..t12: ratio 0.7 (7/10) -- w pasmie, trzyma atak (i min. 3 tury)
  ok(modeOf(E.planHomeWar(build(11, 7, 10))) === 'attack', 'ratio 0.7 po ataku -> nadal atak (pasmo)');
  // ratio 0.5 w turze 12: < 3 tury od zmiany -> trzyma atak
  ok(modeOf(E.planHomeWar(build(12, 5, 10))) === 'attack', 'ratio 0.5 w 2. turze -> trzyma tryb (min. 3 tury)');
  // t13: >= 3 tury od wyboru, ratio 0.5 < 0.6 -> obrona
  ok(modeOf(E.planHomeWar(build(13, 5, 10))) === 'hold', 'ratio 0.5 po 3 turach -> obrona');
  // t14..: ratio 0.7 (pasmo) -- z obrony nie wraca do ataku
  ok(modeOf(E.planHomeWar(build(16, 7, 10))) === 'hold', 'ratio 0.7 z obrony -> nadal obrona (pasmo)');
  ok(modeOf(E.planHomeWar(build(17, 8, 10))) === 'attack', 'ratio 0.8 z obrony -> atak');
  // zwolnienie po 12 turach obrony
  E.resetHomeWarMemory();
  E.planHomeWar(build(20, 2, 10));
  const rel = E.planHomeWar(build(33, 2, 10));
  ok(modeOf(rel) === 'released' && rel.orders.length === 0, 'obrona > 12 tur -> zwolnienie (brak zawieszenia AI)');
}

// --- T7 ------------------------------------------------------------------------
section('T7: determinizm i czas tury');
{
  let h1 = null; let h2 = null;
  const a = scExchange(); S.simulate(a, { engine: E, homeDefense: true, turns: 30 }); h1 = hash(a);
  const b = scExchange(); S.simulate(b, { engine: E, homeDefense: true, turns: 30 }); h2 = hash(b);
  ok(h1 === h2, `dwa przebiegi daja ten sam stan (${h1} == ${h2})`);
  // Stabilizacja (R-WEB-TEST-TIMING-STABILIZE-Q1): min z 5 przebiegow, PRZED/PO przeplatane, a pomiar to
  // CZAS PROCESORA (process.cpuUsage) calego przebiegu symulacji zamiast czasu scianowego: rownolegle procesy
  // (obciazenie maszyny) nie zawyzaja wyniku. Prog (x1,5 + 50 ms) bez zmian; realny wzrost kosztu decyzji
  // podnosi takze minimum (rozklad w tym samym przebiegu, bez zmiany sim).
  const cpuMs = (c0) => { const d = process.cpuUsage(c0); return (d.user + d.system) / 1000; };
  const timed = (hd) => { const c0 = process.cpuUsage(); S.simulate(scDefendWins(), { engine: E, homeDefense: hd, turns: 20 }); return cpuMs(c0); };
  let minOn = Infinity; let minOff = Infinity;
  for (let i = 0; i < 5; i++) {
    minOff = Math.min(minOff, timed(false));
    minOn = Math.min(minOn, timed(true));
  }
  console.log(`POMIAR T7 (CPU, min z 5, przeplatane): PRZED=${minOff.toFixed(1)} ms, PO=${minOn.toFixed(1)} ms, prog=${(minOff * 1.5 + 50).toFixed(1)} ms`);
  ok(minOn <= minOff * 1.5 + 50, `czas decyzji AI bez wzrostu (min z 5: PO ${minOn.toFixed(1)} ms vs PRZED ${minOff.toFixed(1)} ms)`);
}

// --- T9 ------------------------------------------------------------------------
section('T9: zgodnosc -- zero ingerencji bez najezdzcow i utraconych miast');
{
  const sc = () => base({
    units: units(1, 'a', [[10, 8], [11, 9], [10, 12], [9, 11], [14, 4]]).concat(units(2, 'b', [[30, 8], [29, 9], [30, 12]])),
    cities: [S.mkCity('a1', 1, 5, 10), S.mkCity('b1', 2, 34, 10)],
  });
  const h = (hd) => { const s = sc(); S.simulate(s, { engine: E, homeDefense: hd, turns: 8 }); return hash(s); };
  ok(h(false) === h(true), 'stan po 8 turach identyczny OFF vs ON gdy nie ma najezdzcy ani utraconego miasta');
  const peace = () => Object.assign(scExchange(), { wars: new Set() });
  const hp = (hd) => { const s = peace(); S.simulate(s, { engine: E, homeDefense: hd, turns: 8 }); return hash(s); };
  ok(hp(false) === hp(true), 'pokoj: identyczny stan OFF vs ON');
}

// --- T10 -----------------------------------------------------------------------
section('T10: P3 nietkniete -- silny agresor bez zagrozenia u siebie nadal zdobywa miasta');
{
  const sc = () => base({
    units: [...units(1, 'a', [[24, 10], [24, 11], [25, 10], [25, 11], [24, 9], [25, 9], [26, 10], [26, 11]]),
      ...units(2, 'b', [[36, 10]])],
    cities: [S.mkCity('a1', 1, 6, 10), S.mkCity('b1', 2, 34, 10), S.mkCity('b2', 2, 33, 14)],
  });
  const off = S.simulate(sc(), { engine: E, homeDefense: false, turns: 25 });
  const on = S.simulate(sc(), { engine: E, homeDefense: true, turns: 25 });
  ok(on.captures >= 1, `PO: agresor zdobywa miasta (zdobyte=${on.captures}, PRZED=${off.captures})`);
  ok(on.captures === off.captures, 'PO: tyle samo zdobyczy co PRZED, gdy nikt nie zagraza domowi');
}

async function mutationTests() {
  section('T8: mutacje -- kazda psuje co najmniej jeden test (testy rozrozniaja)');
  const muts = [
    ['M1 brak P2 (bez zwalczania najezdzcy)', [['const allClusters = invaders.length > 0 && input.myCities.length > 0 ? buildClusters(invaders, input) : [];', 'const allClusters: any[] = [];']], 'T2'],
    ['M2 brak P1 (bez odbicia)', [['if (lost.length > 0 && pool.size > 0) {', 'if (false) {']], 'T3'],
    ['M3 zawsze obrona (nigdy atak)', [["\n  return ratio >= enter ? 'attack' : 'hold';\n}", "\n  return 'hold';\n}"], ["return ratio >= leave ? 'attack' : 'hold';", "return 'hold';"], ["return ratio >= enter ? 'attack' : 'hold';\n  }", "return 'hold';\n  }"]], 'T3'],
    ['M4 brak histerezy (leave=enter, 0 tur)', [['export const HOME_WAR_ATTACK_RATIO_LEAVE = 0.6;', 'export const HOME_WAR_ATTACK_RATIO_LEAVE = 0.8;'], ['export const HOME_WAR_MIN_COMMIT_TURNS = 3;', 'export const HOME_WAR_MIN_COMMIT_TURNS = 0;']], 'T6'],
  ];
  for (const [name, mutations, expectTest] of muts) {
    const M = await S.loadEngineMutated('mut', mutations);
    let detected = false;
    try {
      const run2 = (sc, hd, turns) => S.simulate(sc(), { engine: M, homeDefense: hd, turns });
      if (expectTest === 'T2') {
        const r = run2(scDefendWins, true, 15);
        let inv = null;
        S.simulate(scDefendWins(), { engine: M, homeDefense: true, turns: 15, onTurn: (t, s) => { if (t === 15) inv = s.units.filter(u => u.ownerId === 2 && u.id.startsWith('i')).length; } });
        detected = (r.lost[1] || 0) >= 1 || (inv !== null && inv > 1);
      } else if (expectTest === 'T3') {
        const r = run2(scRecapture, true, 30);
        const rec = r.captureLog.find(c => c.cityId === 'z2');
        const b1 = r.captureLog.find(c => c.by === 1 && (c.cityId === 'b1' || c.cityId === 'b2'));
        detected = !(rec && rec.by === 1 && (b1 === undefined || rec.turn < b1.turn));
      } else if (expectTest === 'T6') {
        M.resetHomeWarMemory();
        const mkp = (turn, mine, en) => ({
          ownerId: 7, currentTurn: turn, allUnits: [], myCities: [{ id: 'c', q: 0, r: 0, ownerId: 7 }], allCities: [],
          myUnits: Array.from({ length: mine }, (_, i) => ({ id: `m${i}`, ownerId: 7, q: 2, r: 0, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 })),
          enemyUnits: Array.from({ length: en }, (_, i) => ({ id: `e${i}`, ownerId: 9, q: 1, r: i % 2, ruchLeft: 2, typeId: 'W', category: 'x', ruch: 2 })),
          canEngageOwner: () => true, lockedUnitIds: new Set(), isOwnTerritory: () => true, strengthOf: () => 1,
          isFieldUnit: () => true, distance: M.hexDistance,
        });
        const md = (p) => (p.clusters[0] ? p.clusters[0].mode : null);
        M.planHomeWar(mkp(10, 10, 10));
        detected = md(M.planHomeWar(mkp(11, 7, 10))) !== 'attack' || md(M.planHomeWar(mkp(12, 5, 10))) !== 'attack';
      }
    } finally { S.cleanup(M); }
    ok(detected, `${name}: mutacja wykryta (${expectTest})`);
  }
}

mutationTests().then(() => {
S.cleanup(E);
console.log(`\nai-war-defend-home-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error(e); process.exit(2); });
