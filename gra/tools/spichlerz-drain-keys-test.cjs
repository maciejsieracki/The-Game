'use strict';
/**
 * spichlerz-drain-keys-test.cjs — R-WEB-SPICHLERZ-DRAIN-KEYS-Q1.
 * Zużycie Spichlerza (Ceramika I, Ceramika II, Sól II) czytane z econ-params.json wg trudności.
 *  1) golden: przy 25/25/25 wynik paySpichlerzDrainForCity identyczny jak przed zmianą (N-1/N/N+1).
 *  2) klucze są CZYTANE: podmiana wartości w danych zmienia zużycie (każdy klucz osobno, per trudność).
 *  3) brak klucza / NaN / ujemny / brak raw → fallback 25.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.spichlerz-drain-keys-entry.ts');
const BUNDLE = path.resolve(__dirname, '.spichlerz-drain-keys-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  paySpichlerzDrainForCity,
  loadSpichlerzDrainParams,
  spichlerzCeramikaDrainAmount,
  SPICHLERZ_DRAIN_FALLBACK_PER_TURN,
  SPICHLERZ_DRAIN_JSON_KEY_CERAMIKA_I,
  SPICHLERZ_DRAIN_JSON_KEY_CERAMIKA_II,
  SPICHLERZ_DRAIN_JSON_KEY_SOL_II,
} from '../src/game/building-resource-gate';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
const ECON = JSON.parse(fs.readFileSync(path.resolve(GRA, 'data', 'econ-params.json'), 'utf8'));

const K_I = M.SPICHLERZ_DRAIN_JSON_KEY_CERAMIKA_I;
const K_II = M.SPICHLERZ_DRAIN_JSON_KEY_CERAMIKA_II;
const K_SOL = M.SPICHLERZ_DRAIN_JSON_KEY_SOL_II;
const DIFFS = ['easy', 'normal', 'hard'];
const P25 = { ceramikaI: 25, ceramikaII: 25, solII: 25 };

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  PASS:', m); } else { fail++; console.error('  FAIL:', m); } }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function withKey(raw, key, diff, val) { raw.budynki[key][diff] = val; return raw; }

// Jedno miasto ownera 0; zwraca wynik drain i stany po wypłacie (dryRun=false).
function runOne(builtIds, cer, sol, params) {
  const cities = [{ ownerId: 0, surowce: { ceramika: cer, sol } }];
  const drain = M.paySpichlerzDrainForCity(cities, 0, builtIds, false, params);
  return { drain, cer: cities[0].surowce.ceramika, sol: cities[0].surowce.sol };
}

// ---------------------------------------------------------------------------
console.log('[1] golden 25/25/25 — stany po turze identyczne jak przed zmianą');
{
  const loaded = M.loadSpichlerzDrainParams(ECON, 'normal');
  const FB = M.SPICHLERZ_DRAIN_FALLBACK_PER_TURN;
  const fromFallback = { ceramikaI: FB, ceramikaII: FB, solII: FB };
  for (const params of [fromFallback, P25, loaded]) {
    const tag = params === fromFallback ? 'fallback-const' : (params === loaded ? 'JSON' : 'literal');
    let allOk = true;
    for (const cer of [24, 25, 26]) {
      for (const sol of [24, 25, 26]) {
        const none = runOne([], cer, sol, params);
        allOk = allOk && !none.drain.ceramikaPaid && !none.drain.solPaid && none.cer === cer && none.sol === sol;
        const I = runOne(['spichlerz'], cer, sol, params);
        const cPaidI = cer >= 25;
        allOk = allOk && I.drain.ceramikaPaid === cPaidI && I.drain.solPaid === false
          && I.cer === (cPaidI ? cer - 25 : cer) && I.sol === sol;
        for (const builtIds of [['spichlerz_ii'], ['spichlerz', 'spichlerz_ii']]) {
          const II = runOne(builtIds, cer, sol, params);
          const sPaid = sol >= 25;
          allOk = allOk && II.drain.ceramikaPaid === cPaidI && II.drain.solPaid === sPaid
            && II.cer === (cPaidI ? cer - 25 : cer) && II.sol === (sPaid ? sol - 25 : sol);
        }
      }
    }
    ok(allOk, `golden N-1/N/N+1 jednomiastowy (${tag})`);
  }
  // Dwa miasta z Spichlerzem I, wspólna pula ceramiki (kolejność miast jak w runtime).
  const twoCities = (total, params) => {
    const cities = [
      { ownerId: 0, surowce: { ceramika: Math.floor(total / 2) } },
      { ownerId: 0, surowce: { ceramika: total - Math.floor(total / 2) } },
    ];
    const d1 = M.paySpichlerzDrainForCity(cities, 0, ['spichlerz'], false, params);
    const d2 = M.paySpichlerzDrainForCity(cities, 0, ['spichlerz'], false, params);
    return { paid: [d1.ceramikaPaid, d2.ceramikaPaid], stocks: cities.map(c => c.surowce.ceramika) };
  };
  const g49 = twoCities(49, P25);
  ok(g49.paid[0] === true && g49.paid[1] === false && g49.stocks[0] === 24 && g49.stocks[1] === 0,
    'golden dwa miasta I, pula 49 → 1 wypłata (24 zostaje)');
  const g50 = twoCities(50, P25);
  ok(g50.paid[0] === true && g50.paid[1] === true && g50.stocks[0] === 0 && g50.stocks[1] === 0,
    'golden dwa miasta I, pula 50 → 2 wypłaty (0/0)');
  const g51 = twoCities(51, P25);
  ok(g51.paid[0] === true && g51.paid[1] === true && g51.stocks[0] === 0 && g51.stocks[1] === 1,
    'golden dwa miasta I, pula 51 → 2 wypłaty (0/1)');
  // Miasto z I+II płaci JEDNĄ wypłatę ceramiki (tak jak dotąd) — 25, nie 50.
  const both = runOne(['spichlerz', 'spichlerz_ii'], 50, 0, P25);
  ok(both.drain.ceramikaPaid && both.cer === 25, 'miasto z I+II: jedna wypłata ceramiki (50→25), jak dotąd');
  // Podgląd (dryRun) nie mutuje stanu.
  const dry = runOne(['spichlerz_ii'], 26, 26, P25);
  const cities = [{ ownerId: 0, surowce: { ceramika: 26, sol: 26 } }];
  const dryRes = M.paySpichlerzDrainForCity(cities, 0, ['spichlerz_ii'], true, P25);
  ok(dryRes.ceramikaPaid && dryRes.solPaid && cities[0].surowce.ceramika === 26 && cities[0].surowce.sol === 26,
    'dryRun: wynik jak runtime, bez mutacji magazynu');
  ok(dry.cer === 1 && dry.sol === 1, 'II przy 26/26: ceramika 26→1, sól 26→1 (runtime)');
}

// ---------------------------------------------------------------------------
console.log('[2] klucze JSON są czytane (każdy osobno, per trudność)');
{
  for (const d of DIFFS) {
    const p = M.loadSpichlerzDrainParams(ECON, d);
    ok(p.ceramikaI === 25 && p.ceramikaII === 25 && p.solII === 25,
      `JSON ${d}: wartości realne 25/25/25 (bez zmiany danych)`);
  }
  const expected = { easy: 10, normal: 40, hard: 60 };
  for (const d of DIFFS) {
    const raw = withKey(withKey(withKey(clone(ECON), K_I, 'easy', 10), K_I, 'normal', 40), K_I, 'hard', 60);
    const p = M.loadSpichlerzDrainParams(raw, d);
    ok(p.ceramikaI === expected[d] && p.ceramikaII === 25 && p.solII === 25,
      `klucz Spichlerz I (ceramika) ${d}=${expected[d]} czytany, II/sól bez zmian`);
    const r = runOne(['spichlerz'], 100, 0, p);
    ok(r.cer === 100 - expected[d], `Spichlerz I zużywa ${expected[d]} ceramiki (${d}): 100→${100 - expected[d]}`);
  }
  for (const d of DIFFS) {
    const raw = withKey(withKey(withKey(clone(ECON), K_II, 'easy', 10), K_II, 'normal', 40), K_II, 'hard', 60);
    const p = M.loadSpichlerzDrainParams(raw, d);
    ok(p.ceramikaII === expected[d] && p.ceramikaI === 25,
      `klucz Spichlerz II (ceramika) ${d}=${expected[d]} czytany, I bez zmian`);
    const r = runOne(['spichlerz_ii'], 100, 100, p);
    ok(r.cer === 100 - expected[d] && r.sol === 100 - 25,
      `Spichlerz II zużywa ${expected[d]} ceramiki (${d}), sól nadal 25`);
    const rI = runOne(['spichlerz'], 100, 0, p);
    ok(rI.cer === 75, `Spichlerz I nadal 25 przy zmienionym kluczu II (${d}) — brak mieszania kluczy`);
  }
  for (const d of DIFFS) {
    const raw = withKey(withKey(withKey(clone(ECON), K_SOL, 'easy', 10), K_SOL, 'normal', 40), K_SOL, 'hard', 60);
    const p = M.loadSpichlerzDrainParams(raw, d);
    ok(p.solII === expected[d] && p.ceramikaI === 25 && p.ceramikaII === 25,
      `klucz Sól II ${d}=${expected[d]} czytany, ceramika bez zmian`);
    const r = runOne(['spichlerz_ii'], 100, 100, p);
    ok(r.sol === 100 - expected[d] && r.cer === 75,
      `Spichlerz II zużywa ${expected[d]} soli (${d}), ceramika 25`);
  }
  // Mutacja zamiany I↔II: zmiana klucza I nie może zmienić zużycia Spichlerza II (i odwrotnie).
  const rawSwap = withKey(clone(ECON), K_I, 'normal', 40);
  const pSwap = M.loadSpichlerzDrainParams(rawSwap, 'normal');
  ok(runOne(['spichlerz_ii'], 100, 0, pSwap).cer === 75, 'zamiana I↔II: II nie czyta klucza I');
}

// ---------------------------------------------------------------------------
console.log('[3] fallback 25 (brak klucza / NaN / ujemny / brak danych)');
{
  const missing = clone(ECON); delete missing.budynki[K_I];
  ok(M.loadSpichlerzDrainParams(missing, 'normal').ceramikaI === 25, 'brak klucza → 25');
  const nan = withKey(clone(ECON), K_II, 'normal', 'abc');
  ok(M.loadSpichlerzDrainParams(nan, 'normal').ceramikaII === 25, 'wartość nie-liczbowa → 25');
  const neg = withKey(clone(ECON), K_SOL, 'hard', -5);
  ok(M.loadSpichlerzDrainParams(neg, 'hard').solII === 25, 'ujemna → 25');
  const nul = withKey(clone(ECON), K_I, 'easy', null);
  ok(M.loadSpichlerzDrainParams(nul, 'easy').ceramikaI === 25, 'null → 25');
  const zero = withKey(clone(ECON), K_SOL, 'normal', 0);
  ok(M.loadSpichlerzDrainParams(zero, 'normal').solII === 0, '0 jest poprawną wartością (nie fallback)');
  ok(M.loadSpichlerzDrainParams(null, 'normal').ceramikaI === 25 && M.loadSpichlerzDrainParams(undefined, 'hard').solII === 25,
    'brak raw (null/undefined) → 25/25/25');
  const perDiff = withKey(clone(ECON), K_I, 'hard', 60);
  delete perDiff.budynki[K_I].hard;
  ok(M.loadSpichlerzDrainParams(perDiff, 'hard').ceramikaI === 25, 'brak wartości tylko dla hard → 25 dla hard');
  ok(M.loadSpichlerzDrainParams(perDiff, 'easy').ceramikaI === 25, 'brak wartości hard nie wpływa na easy');
  ok(M.SPICHLERZ_DRAIN_DEFAULT_PARAMS === undefined, 'R-WEB-SPICHLERZ-HUD-PARAMS-Q1: brak drugiego źródła prawdy (SPICHLERZ_DRAIN_DEFAULT_PARAMS usunięty)');
  ok(M.SPICHLERZ_DRAIN_FALLBACK_PER_TURN === 25, 'SPICHLERZ_DRAIN_FALLBACK_PER_TURN = 25');
}

console.log(`spichlerz-drain-keys-test: ${pass} pass, ${fail} fail`);
process.exitCode = fail ? 1 : 0;
