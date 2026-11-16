'use strict';
/**
 * diplo-weariness-migration-peak-test.cjs -- DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1, zarzut 4 (runda 2).
 *
 * Migracja starego zapisu: szczyt zmęczenia zapisany na skali 20 tur (peak = 1,0 po 20 turach) NIE MOŻE wymusić
 * pokoju po wczytaniu, gdy bieżący poziom na skali 40 tur jest niski (tura 12 => 0,30).
 * Klamra w runWarWearinessTick: `if (st.peak > level) st.peak = level;` (war-weariness.ts).
 *
 *   (m1) po wczytaniu starego szczytu 1,0 przy poziomie 0,30 tick NIE zwraca forced_peace;
 *   (m2) szczyt w store zostaje przycięty do bieżącego poziomu (0,30);
 *   (m3) brak wywołania finalize/pay (pokój nie został zawarty).
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = path.resolve(GRA_ROOT, 'src');
const J = (p) => JSON.stringify(path.join(SRC, p));
const ENTRY = path.resolve(__dirname, `.migpeak-${process.pid}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.migpeak-${process.pid}-bundle.cjs`);
fs.writeFileSync(ENTRY, `export * as W from ${J('game/war-weariness')};`, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE,
    absWorkingDir: GRA_ROOT, logLevel: 'silent', resolveExtensions: ['.ts', '.js', '.json'],
  });
} finally { try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ } }
const W = require(BUNDLE).W;
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }

let pass = 0;
let fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL: ' + m); } };

const TURN = 12;
const WAR_START = 0;
const OLD_PEAK_20_TURN_SCALE = 1.0; // stary zapis: szczyt 1,0 osiągnięty na skali 20 tur
const LEVEL_NOW = W.warWearinessLevel({ turnsAtWar: TURN, lostCitiesTotal: 0 }); // 12/40 = 0,30
ok(Math.abs(LEVEL_NOW - 0.3) < 1e-9, `poziom na 12 turze = 0,30 (got ${LEVEL_NOW})`);

const store = new Map();
store.set('1-2', { warStart: WAR_START, peak: OLD_PEAK_20_TURN_SCALE, stage: 0, rejectedOffers: 0, lastOfferTurn: -1 });
const finalizeCalls = [];
const payCalls = [];
const outcomes = W.runWarWearinessTick({
  store,
  turn: TURN,
  pairs: [{ a: 1, b: 2 }],
  pairKey: (a, b) => `${a}-${b}`,
  warInfo: () => ({ warStart: WAR_START, turnsAtWar: TURN, lostA: 0, lostB: 0, turnsSinceCityChange: TURN }),
  shareOf: () => 0.5,
  weakerOf: () => 1,
  cityCountOf: () => 5,
  price: () => ({ requiredPn: 100, balanceFor: () => 0, tolerancePn: 0 }),
  assets: () => [],
  cityCessionOk: () => true,
  battlePending: false,
  pay: (l, w, plan) => payCalls.push({ l, w, plan }),
  finalize: (l, w, lock) => finalizeCalls.push({ l, w, lock }),
});

const out = outcomes.find(o => o.pairKey === '1-2');
ok(out !== undefined, 'tick zwrócił wynik dla pary 1-2');
ok(!outcomes.some(o => o.action === 'forced_peace'), `(m1) brak forced_peace po migracji (got ${out && out.action})`);
ok(finalizeCalls.length === 0 && payCalls.length === 0, `(m3) brak zawarcia pokoju (finalize=${finalizeCalls.length}, pay=${payCalls.length})`);
const st = store.get('1-2');
ok(st !== undefined && Math.abs(st.peak - LEVEL_NOW) < 1e-9, `(m2) szczyt przycięty do bieżącego poziomu 0,30 (got ${st && st.peak})`);

// Kontrola dodatnia: ten sam szczyt przy poziomie 100% (tura 40) MUSI wymusić pokój — test nie jest pusty.
const store2 = new Map();
store2.set('1-2', { warStart: WAR_START, peak: 1.0, stage: 0, rejectedOffers: 0, lastOfferTurn: -1 });
const fin2 = [];
const out2 = W.runWarWearinessTick({
  store: store2,
  turn: 40,
  pairs: [{ a: 1, b: 2 }],
  pairKey: (a, b) => `${a}-${b}`,
  warInfo: () => ({ warStart: WAR_START, turnsAtWar: 40, lostA: 0, lostB: 0, turnsSinceCityChange: 40 }),
  shareOf: () => 0.5,
  weakerOf: () => 1,
  cityCountOf: () => 5,
  price: () => ({ requiredPn: 0, balanceFor: () => 0, tolerancePn: 0 }),
  assets: () => [],
  cityCessionOk: () => true,
  battlePending: false,
  pay: () => {},
  finalize: (l, w, lock) => fin2.push({ l, w, lock }),
});
ok(out2.some(o => o.action === 'forced_peace'), '(kontrola) przy 100% zmęczenia pokój WYMUSZONY');
ok(fin2.length === 1, `(kontrola) finalize wywołane raz (got ${fin2.length})`);

console.log(`diplo-weariness-migration-peak-test: PASS=${pass} FAIL=${fail}`);
process.exit(fail ? 1 : 0);
