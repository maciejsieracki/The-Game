'use strict';
/**
 * diplo-peace-price-decay-test.cjs -- R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1 (decyzja wlasciciela 2026-11-17).
 * Testy JEDNOSTKOWE na realnej funkcji wearinessPeaceCashPn (war-weariness.ts):
 *
 *   (P1) cena(0) = 6000 PN (start wojny, cenaStartPn z war-weariness-params.json);
 *   (P2) cena(1) = 0 (100% zmeczenia: pokoj wymuszony bez oddania miasta);
 *   (P3) punkty posrednie: cena(0,25)=4500, cena(0,5)=3000, cena(0,75)=1500;
 *   (P4) monotonicznie nierosnaca na siatce 0..1 (krok 0,01);
 *   (P5) zaokraglenie do PN (liczba calkowita) i zacisk L do 0..1 (cena(-1)=6000, cena(2)=0);
 *   (P6) progWymuszonyPokoj = 1,0 => cena w punkcie wymuszenia = 0 (przy progu < 1 ta asercja ma
 *        czerwienic: zmiana progu wymaga osobnej decyzji ABC, NIE jest zmiana kodu);
 *   (P7) statyczna straznica: sciezka wymuszenia nie odejmuje minMiastPoOddaniu (stary prog 3 miast);
 *   (P8) mutacja: stala cena (return 6000) czerwieni P2/P4;
 *   (P9) mutacja: powrot do progu 3 miast w sciezce wymuszenia czerwieni P7.
 *
 *   node tools/diplo-peace-price-decay-test.cjs   # exit 0 = wszystko zielone i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = path.resolve(GRA_ROOT, 'src');
const WW = path.join(SRC, 'game', 'war-weariness.ts');
const PARAMS = path.join(GRA_ROOT, 'data', 'war-weariness-params.json');
const TAG = `${process.pid}`;
const ENTRY = path.resolve(__dirname, `.pprice-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.pprice-${TAG}-bundle.cjs`);
const J = (p) => JSON.stringify(p);

const ORIG = fs.readFileSync(WW, 'utf8');
const PJ = JSON.parse(fs.readFileSync(PARAMS, 'utf8'));

const CASH_LINE = 'return Math.round(start * (1 - clamp(level, 0, 1)));';
const FORCED_CAP_LINE = 'const cityCap = d.battlePending ? 0 : Math.max(0, ownCities);';

function loadW(src) {
  const MUT = path.join(path.dirname(WW), `.pprice-mut-${TAG}.ts`);
  fs.writeFileSync(MUT, src);
  try {
    fs.writeFileSync(ENTRY, `export * as W from ${J(MUT)};\n`);
    esbuild.buildSync({
      entryPoints: [ENTRY], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE,
      logLevel: 'silent', loader: { '.json': 'json' },
    });
  } finally {
    try { fs.unlinkSync(MUT); } catch (_) { /* ignore */ }
    try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
  }
  delete require.cache[BUNDLE];
  return require(BUNDLE).W;
}

function runChecks(W, src) {
  const res = [];
  const chk = (name, ok, extra) => res.push({ name, ok: !!ok, extra });
  const cash = (l) => W.wearinessPeaceCashPn(l);
  const thr = PJ.zmeczenie.progWymuszonyPokoj;

  chk('P1: cena(0) = 6000 PN', cash(0) === 6000, cash(0));
  chk('P2: cena(1) = 0 PN (100%)', cash(1) === 0, cash(1));
  chk('P3a: cena(0,25) = 4500', cash(0.25) === 4500, cash(0.25));
  chk('P3b: cena(0,5) = 3000', cash(0.5) === 3000, cash(0.5));
  chk('P3c: cena(0,75) = 1500', cash(0.75) === 1500, cash(0.75));
  {
    let prev = Infinity, mono = true, at = null;
    for (let i = 0; i <= 100; i++) {
      const v = cash(i / 100);
      if (v > prev) { mono = false; at = i / 100; break; }
      prev = v;
    }
    chk('P4: monotonicznie nierosnaca na 0..1 (krok 0,01)', mono, at);
  }
  chk('P5a: zaokraglenie do PN (cena(0,333) calkowita)', Number.isInteger(cash(0.333)), cash(0.333));
  chk('P5b: zacisk L: cena(-1) = 6000, cena(2) = 0', cash(-1) === 6000 && cash(2) === 0, [cash(-1), cash(2)]);
  chk('P6: progWymuszonyPokoj = 1,0 i cena w tym punkcie = 0 (zmiana progu = decyzja ABC)',
    thr === 1 && cash(thr) === 0, { thr, cena: cash(thr) });
  chk('P7: sciezka wymuszenia NIE odejmuje minMiastPoOddaniu (brak progu 3 miast)',
    src.includes(FORCED_CAP_LINE) && !/cityCap\s*=\s*d\.battlePending[^;]*minMiastPoOddaniu/.test(src));

  // P8 — mutacja: stala cena zamiast funkcji liniowej.
  {
    const mut = src.replace(CASH_LINE, 'return 6000;');
    if (mut === src) chk('P8: mutacja: wzorzec ceny nie znaleziony w source', false, 'brak wzorca');
    else {
      const WM = loadW(mut);
      const red = WM.wearinessPeaceCashPn(1) !== 0 || WM.wearinessPeaceCashPn(0.5) !== 3000;
      chk('P8: mutant (stala cena 6000) czerwieni P2/P3b', red, { c1: WM.wearinessPeaceCashPn(1), c05: WM.wearinessPeaceCashPn(0.5) });
    }
  }
  // P9 — mutacja: powrot do progu 3 miast w sciezce wymuszenia.
  {
    const mut = src.replace(FORCED_CAP_LINE, 'const cityCap = d.battlePending ? 0 : Math.max(0, ownCities - P.przegrywajacy.minMiastPoOddaniu);');
    if (mut === src) chk('P9: mutacja: wzorzec cityCap nie znaleziony w source', false, 'brak wzorca');
    else chk('P9: mutant (prog 3 miast w wymuszeniu) czerwieni P7', !(mut.includes(FORCED_CAP_LINE)), 'mutant wykryty');
  }
  return res;
}

try {
  fs.writeFileSync(ENTRY, `export * as W from ${J(WW)};\n`);
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE,
    logLevel: 'silent', loader: { '.json': 'json' },
  });
  const W = require(BUNDLE).W;
  const res = runChecks(W, ORIG);
  let pass = 0, fail = 0;
  for (const r of res) {
    if (r.ok) pass++; else fail++;
    console.log(`${r.ok ? 'PASS' : 'FAIL'}: ${r.name}${r.extra !== undefined && !r.ok ? ` -- ${JSON.stringify(r.extra)}` : ''}`);
  }
  console.log(`diplo-peace-price-decay-test: PASS=${pass} FAIL=${fail}`);
  process.exitCode = fail === 0 ? 0 : 1;
} finally {
  for (const f of [ENTRY, BUNDLE]) { try { fs.unlinkSync(f); } catch (_) { /* ignore */ } }
}
