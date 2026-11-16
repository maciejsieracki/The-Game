'use strict';
/**
 * diplo-weariness-c615-both-cities-test.cjs -- R-WEB-DIPLO-WEARINESS-PW-FOLLOWUP-C615-BOTH-CITIES-Q1.
 *
 *   (a) cena pokoju C = 615 jako JEDNA stala (diplomacy-acceptance-points.json, pokoj.punkty) — bez mnoznika cywilizacji;
 *   (b) evaluatePeaceAiGate: priceMultiplier = 1 dla kazdej cywilizacji i kazdej tury (bez galezi po turyBezOgraniczenAi);
 *   (c) lostCitiesForWeariness: suma miast obu stron, symetryczna;
 *   (d) spojnosc tabela PW <-> tick AI<->AI: ta sama wojna (lostA, lostB) => ta sama liczba miast i ten sam poziom;
 *       mutacja "tylko jedna strona" (licznik zalezny od kolejnosci stron) jest wykrywalna;
 *   (e) Z = round(C * x^2) z funkcji dla tur 10..16 bez strat (wartosci liczone, nie wpisane z dyspozycji);
 *   (f) wiazanie w kodzie: main.ts diploProposalWarState dodaje miasta proponujacego; tick uzywa lostCitiesForWeariness;
 *       brak zahardkodowanej liczby 615 w diplomacy-proposals.ts i war-weariness.ts.
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = path.resolve(GRA_ROOT, 'src');
const J = (p) => JSON.stringify(path.join(SRC, p));
const ENTRY = path.resolve(__dirname, `.c615-${process.pid}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.c615-${process.pid}-bundle.cjs`);
fs.writeFileSync(ENTRY,
  `export * as W from ${J('game/war-weariness')};\nexport * as M from ${J('game/diplomacy-war-peace-profile')};`, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE,
    absWorkingDir: GRA_ROOT, logLevel: 'silent', resolveExtensions: ['.ts', '.js', '.json'],
  });
} finally { try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ } }
const B = require(BUNDLE);
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
const W = B.W;
const M = B.M;

let pass = 0;
let fail = 0;
function ok(cond, name) { if (cond) pass++; else { fail++; console.log(`[FAIL] ${name}`); } }
function eq(a, b, name) { ok(a === b, `${name} (got ${a}, want ${b})`); }
const read = (rel) => fs.readFileSync(path.resolve(GRA_ROOT, rel), 'utf8');

// (a) jedna stala C
const pts = JSON.parse(read('data/diplomacy-acceptance-points.json'));
const C = pts.traktaty.pokoj.punkty;
eq(C, 615, '(a) pokoj.punkty = 615');

// (b) mnoznik ceny = 1
const profiles = ['zulusi', 'chinczycy'].map((k) => M.resolveWarPeaceProfile(k));
let multOk = true;
for (const pr of profiles) {
  for (let t = 0; t <= 40; t++) {
    const g = M.evaluatePeaceAiGate({ rw: 0.8, turnsAtWar: t, lostCitiesInWar: 0 }, pr);
    if (g.priceMultiplier !== 1) multOk = false;
  }
}
ok(multOk, '(b) priceMultiplier = 1 dla tur 0..40 i obu profili');

// (c) suma symetryczna
let symOk = true;
for (let a = 0; a <= 4; a++) {
  for (let b = 0; b <= 4; b++) {
    if (W.lostCitiesForWeariness(a, b) !== a + b) symOk = false;
    if (W.lostCitiesForWeariness(a, b) !== W.lostCitiesForWeariness(b, a)) symOk = false;
  }
}
ok(symOk, '(c) lostCitiesForWeariness(a,b) = a+b, symetryczna');

// (d) spojnosc tabela <-> tick: ta sama wojna => ta sama liczba miast i ten sam poziom / Z.
// Tick AI<->AI: lostA/lostB wzgledem pary (a,b). Tabela gracz<->AI: lostCitiesResponder = suma obu stron.
// Ta sama wojna (lostA, lostB) musi dac ten sam licznik niezaleznie od tego, kto jest 'a' a kto 'b'.
const P = W.WAR_WEARINESS_PARAMS;
let consOk = true;
for (let turns = 0; turns <= 24; turns++) {
  for (let lostA = 0; lostA <= 3; lostA++) {
    for (let lostB = 0; lostB <= 3; lostB++) {
      const tickCount = W.lostCitiesForWeariness(lostA, lostB);
      const tableCount = W.lostCitiesForWeariness(lostB, lostA);
      if (tickCount !== tableCount) consOk = false;
      const tickLevel = W.warWearinessLevel({ turnsAtWar: turns, lostCitiesTotal: tickCount }, P);
      const tableLevel = W.warWearinessLevel({ turnsAtWar: turns, lostCitiesTotal: tableCount }, P);
      if (tickLevel !== tableLevel) consOk = false;
      if (W.wearinessPeaceItemPw(C, tickLevel, P) !== W.wearinessPeaceItemPw(C, tableLevel, P)) consOk = false;
    }
  }
}
ok(consOk, '(d) tabela i tick: ta sama wojna => ten sam licznik, poziom i Z');
// mutacja "tylko respondent": utrata miast tylko jednej strony zmienia Z przy zamianie stron -> wykrywalne
let mutDetected = false;
for (let t = 10; t <= 16; t++) {
  const zOnlyResp0 = W.wearinessPeaceItemPw(C, W.warWearinessLevel({ turnsAtWar: t, lostCitiesTotal: 0 }, P), P);
  const zOnlyResp2 = W.wearinessPeaceItemPw(C, W.warWearinessLevel({ turnsAtWar: t, lostCitiesTotal: 2 }, P), P);
  if (zOnlyResp0 !== zOnlyResp2) mutDetected = true;
}
ok(mutDetected, '(d-mut) licznik miast wplywa na Z (mutacja wykrywalna)');

// (d2) ZACHOWANIE, nie tylko regex: runWarWearinessTick (tick AI<->AI) dla tej samej wojny z zamienionymi stronami
// daje ten sam poziom i ten sam poziom jak warWearinessLevel(lostCitiesForWeariness(...)) -- czyli liczy OBIE strony.
// Mutacja tiku na jedna strone (np. lostCitiesTotal: w.lostA) zlamie porownanie lostA/lostB <-> lostB/lostA.
function tickLevelFor(turnsAtWar, lostA, lostB) {
  const store = new Map();
  const key = 'p';
  const outs = W.runWarWearinessTick({
    store, turn: 100, pairs: [{ a: 1, b: 2 }], pairKey: () => key,
    warInfo: () => ({ turnsAtWar, warStart: 0, lostA, lostB, turnsSinceCityChange: 99 }),
    shareOf: () => 0.5, weakerOf: () => 1, cityCountOf: () => 5,
    // ścieżki akcji (oferta pokoju) nie są przedmiotem tego testu: stuby neutralne, liczy się poziom szczytu (level).
    price: () => ({ requiredPn: 0, balanceFor: () => 0, tolerancePn: 0 }),
    assets: () => [],
    cityCessionOk: () => false,
    battlePending: false,
    pay: () => {},
    finalize: () => {},
    log: () => {},
    params: P,
  });
  return outs[0] && outs[0].level;
}
let tickSymOk = true;
let tickMatchesTable = true;
for (let t = 0; t <= 24; t++) {
  for (let lostA = 0; lostA <= 3; lostA++) {
    for (let lostB = 0; lostB <= 3; lostB++) {
      const l1 = tickLevelFor(t, lostA, lostB);
      const l2 = tickLevelFor(t, lostB, lostA);
      if (l1 !== l2) tickSymOk = false;
      const expect = W.warWearinessLevel({ turnsAtWar: t, lostCitiesTotal: W.lostCitiesForWeariness(lostA, lostB) }, P);
      if (l1 !== expect) tickMatchesTable = false;
    }
  }
}
ok(tickSymOk, '(d2) tick AI<->AI: poziom niezalezny od kolejnosci stron (lostA,lostB) vs (lostB,lostA)');
ok(tickMatchesTable, '(d2) tick AI<->AI = warWearinessLevel(lostCitiesForWeariness) dla tur 0..24 i strat 0..3');

// (e) Z z funkcji dla tur 10..16 bez strat (C=615)
const expectZ = [0, 17, 68, 154, 273, 427, 615];
const gotZ = [];
// DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1: skala 40 tur — te same poziomy 0,50..0,80 co dawniej przy turach 10..16 (20 tur),
// czyli tury 20..32 (przeskalowanie 2×; wartości Z bez zmian).
for (let t = 10; t <= 16; t++) gotZ.push(W.wearinessPeaceItemPw(C, W.warWearinessLevel({ turnsAtWar: 2 * t, lostCitiesTotal: 0 }, P), P));
ok(JSON.stringify(gotZ) === JSON.stringify(expectZ), `(e) Z(615) tury 10..16 = ${JSON.stringify(expectZ)} (got ${JSON.stringify(gotZ)})`);

// (f) wiazanie w kodzie
const main = read('src/main.ts');
const proposals = read('src/game/diplomacy-proposals.ts');
const wwSrc = read('src/game/war-weariness.ts');
ok(/lostCitiesResponder:\s*lostCitiesForWeariness\(s\.lostCities,\s*lostProposerInWar\)/.test(main),
  '(f) main.ts: licznik = miasta respondenta + proponujacego');
ok(/lostCitiesTotal:\s*lostCitiesForWeariness\(w\.lostA,\s*w\.lostB\)/.test(wwSrc), '(f) tick AI<->AI uzywa lostCitiesForWeariness');
ok(!/\b615\b/.test(proposals) && !/\b615\b/.test(wwSrc), '(f) brak zahardkodowanego 615 w diplomacy-proposals.ts / war-weariness.ts');

console.log(`diplo-weariness-c615-both-cities-test: PASS=${pass} FAIL=${fail}`);
process.exit(fail === 0 ? 0 : 1);
