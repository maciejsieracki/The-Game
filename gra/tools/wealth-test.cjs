'use strict';
/**
 * wealth-test.cjs -- standalone Node test for src/game/wealth.ts.
 * Run from gra/:  node tools/wealth-test.cjs
 *
 * Self-contained: bundles wealth.ts with esbuild (no runtime imports) and
 * runs assertions anchored to EKONOMIA/EKONOMIA-wealth-projekt.md (model zatwierdzony).
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[wealth-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.wealth-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.wealth-bundle.cjs');

const ENTRY_TS = `
export {
  Difficulty,
  FALLBACK_WEALTH_PARAMS,
  loadWealthParams,
  wealthCap,
  wealthMnoznik,
  wealthZadowolenie,
  wealthRownowaga,
  wealthProg,
  advanceWealth,
  freshWealthState,
} from '../src/game/wealth';
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[wealth-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const W = require(BUNDLE_FILE);

// --- tiny assertion framework ----------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) {
  assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}
function near(a, b, msg, eps) {
  eps = eps !== undefined ? eps : 1e-9;
  assert(Math.abs(a - b) < eps, `${msg} (got ${JSON.stringify(a)}, want ~${JSON.stringify(b)})`);
}

const P = W.FALLBACK_WEALTH_PARAMS;   // normal params

// ===========================================================================
// A. wealthMnoznik: max(1, 1+(W-1)*mnoznikNaPoziom)
//    normal mnoznikNaPoziom = 0.15
// ===========================================================================
near(W.wealthMnoznik(1,   P), 1.0,   'mnoznik W=1   -> 1.0');
near(W.wealthMnoznik(10,  P), 2.35,  'mnoznik W=10  -> 2.35',  1e-6);
near(W.wealthMnoznik(100, P), 15.85, 'mnoznik W=100 -> 15.85', 1e-6);
near(W.wealthMnoznik(0,   P), 1.0,   'mnoznik W=0   -> 1.0 (min)');

// ===========================================================================
// B. wealthZadowolenie(poziom, params, EPOKA):
//      W=0 -> karaZero; inaczej floor( W * zadowolenieMax / cap_epoki ), cap = epoka*10.
//
// R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 G6 (wlasciciel 2026-09-05). Stara formula
// `floor(W/10) * zadowolenieNa10pkt` dawala max +1 / +2 / +3 w epokach 1-3, bo do +10
// trzeba bylo poziomu 100 (cap epoki 10). Po zmianie MAKSIMUM JEST STALE (+10 w kazdej
// epoce), a rosnie PROG: 10 -> 20 -> 30. Sygnatura dostala trzeci argument (epoka).
// Sprawdzana wlasciwosc bez zmian: poziom Wealth przeklada sie na punkty Szczescia
// monotonicznie, z zerem na dole i twardym sufitem na gorze.
// ===========================================================================
eq(W.wealthZadowolenie(0,   P, 1),  0, 'zadowolenie W=0  ep1 -> 0 (neutral, D16-A)');
eq(W.wealthZadowolenie(2,   P, 3),  0, 'zadowolenie W=2  ep3 -> 0 (ponizej pierwszego stopnia: floor(2*10/30))');
eq(W.wealthZadowolenie(10,  P, 1), 10, 'zadowolenie W=10 ep1 -> +10 (poziom = cap epoki 1)');
eq(W.wealthZadowolenie(100, P, 10), 10, 'zadowolenie W=100 ep10 -> +10 (poziom = cap epoki 10)');
// Prog rosnie z epoka, sufit nie: ten sam poziom 10 daje coraz mniej.
eq(W.wealthZadowolenie(10,  P, 2),  5, 'zadowolenie W=10 ep2 -> +5 (polowa capu epoki 2)');
eq(W.wealthZadowolenie(10,  P, 3),  3, 'zadowolenie W=10 ep3 -> +3 (floor(10*10/30))');
eq(W.wealthZadowolenie(20,  P, 2), 10, 'zadowolenie W=20 ep2 -> +10 (cap epoki 2)');
eq(W.wealthZadowolenie(30,  P, 3), 10, 'zadowolenie W=30 ep3 -> +10 (cap epoki 3)');
// Sufit jest twardy: poziom ponad capem nie daje wiecej niz zadowolenieMax.
eq(W.wealthZadowolenie(999, P, 3), 10, 'zadowolenie W=999 ep3 -> +10 (przyciete do capu, nie ponad)');
eq(W.wealthZadowolenie(9,   P, 1),  9, 'zadowolenie W=9  ep1 -> +9 (proporcjonalnie, bez schodka co 10)');
// Epoka nieliczbowa/zerowa NIE moze wpuscic NaN do rozpiski Szczescia (netto miasta
// zrobiloby sie NaN i caly Porzadek by znikl).
eq(W.wealthZadowolenie(50,  P, 0),  0, 'zadowolenie: cap epoki 0 -> 0, nigdy NaN');
assert(Number.isFinite(W.wealthZadowolenie(50, P, undefined)),
  'zadowolenie: brak epoki -> liczba skonczona, nie NaN');

// ===========================================================================
// C. wealthCap: floor(epoka)*capNaEpoke
// ===========================================================================
eq(W.wealthCap(1,  P), 10,  'cap epoka1  -> 10');
eq(W.wealthCap(10, P), 100, 'cap epoka10 -> 100');

// ===========================================================================
// D. wealthRownowaga (epoka 1, cap=10):
//    baza + (W/cap)*(przyCap-baza)  => normal: 0.20 + (W/10)*0.20
// ===========================================================================
near(W.wealthRownowaga(0,  1, P), 0.20, 'rownowaga W=0  ep1 -> 0.20', 1e-9);
near(W.wealthRownowaga(5,  1, P), 0.30, 'rownowaga W=5  ep1 -> 0.30', 1e-9);
near(W.wealthRownowaga(10, 1, P), 0.40, 'rownowaga W=10 ep1 -> 0.40', 1e-9);

// ===========================================================================
// E. wealthProg: progNaPoziom*(L+1)*epoka
//    normal progNaPoziom=4.5
// ===========================================================================
near(W.wealthProg(0, 1, P), 4.5, 'prog L=0 ep1 -> 4.5',  1e-9);
near(W.wealthProg(1, 1, P), 9.0, 'prog L=1 ep1 -> 9.0',  1e-9);
near(W.wealthProg(0, 2, P), 9.0, 'prog L=0 ep2 -> 9.0',  1e-9);

// ===========================================================================
// F. advanceWealth WZROST
//    state{poziom:1, pula:10}, spol=12, M=20, epoka=1
//    decay = rownowaga(1,1,P)*20 = (0.20 + 0.10*0.20)*20 = 0.22*20 = 4.4
//    pula = 10 + 12 - 4.4 = 17.6
//    prog(1,1) = 4.5*2 = 9.0 -> awans: pula=17.6-9.0=8.6; poziom=2; pula=floor(4.3)=4
//    prog(2,1) = 13.5 > 4 -> stop
// ===========================================================================
const wzrost = W.advanceWealth({ poziom: 1, pula: 10 }, 12, 20, 1, P);
assert(wzrost.awans >= 1,       'advanceWealth WZROST: awans >= 1');
assert(wzrost.poziom >= 2,      'advanceWealth WZROST: poziom >= 2 (wzrost)');
assert(wzrost.spadek === 0,     'advanceWealth WZROST: brak spadku');

// ===========================================================================
// G. advanceWealth SPADEK
//    state{poziom:5, pula:0}, spol=2, M=20, epoka=1
//    decay = rownowaga(5,1,P)*20 = 0.30*20 = 6.0
//    pula = 0 + 2 - 6 = -4 -> pula=0, poziom=4, spadek=1
// ===========================================================================
const spadek = W.advanceWealth({ poziom: 5, pula: 0 }, 2, 20, 1, P);
eq(spadek.spadek,  1, 'advanceWealth SPADEK: spadek = 1');
eq(spadek.poziom, 4, 'advanceWealth SPADEK: poziom = 4');

// ===========================================================================
// G2. D16-A: immunitet minPoziom=1 (start W=1, brak luksusu -> poziom nie spada)
// ===========================================================================
const immunitet = W.advanceWealth({ poziom: 1, pula: 0 }, 0, 20, 1, P, { minPoziom: 1 });
eq(immunitet.spadek, 0, 'immunitet: brak spadku poziomu W');
eq(immunitet.poziom, 1, 'immunitet: poziom zostaje 1');

// ===========================================================================
// G3. D16-A: wealthZadowolenie W=0 -> karaZero=0 (normal)
// ===========================================================================
eq(W.wealthZadowolenie(0, P, 1), 0, 'W=0 -> zadowolenie 0 (karaZero=0, regresja D16-A)');

// ===========================================================================
// H. loadWealthParams
// ===========================================================================
// partial raw: overrides tylko mnoznikNaPoziom dla easy=0.18
const rawPartial = {
  wealth: {
    wealth_mnoznik_na_poziom: { easy: 0.18, normal: 0.15, hard: 0.12 }
  }
};
const pEasy = W.loadWealthParams(rawPartial, 'easy');
near(pEasy.mnoznikNaPoziom, 0.18, 'loadWealthParams easy: mnoznikNaPoziom = 0.18', 1e-9);

// empty raw -> fallback normal
const pFallback = W.loadWealthParams({}, 'normal');
near(pFallback.mnoznikNaPoziom, 0.15, 'loadWealthParams {} normal: mnoznikNaPoziom = 0.15 (fallback)', 1e-9);

// ===========================================================================
// I. freshWealthState
// ===========================================================================
const fresh = W.freshWealthState();
eq(fresh.poziom, 1, 'freshWealthState: poziom = 1');
eq(fresh.pula,   0, 'freshWealthState: pula = 0');

// --- summary ---------------------------------------------------------------
console.log(`\nwealth-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
