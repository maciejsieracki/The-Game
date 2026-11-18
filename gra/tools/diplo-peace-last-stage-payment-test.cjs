'use strict';
/**
 * diplo-peace-last-stage-payment-test.cjs -- R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1 (ABC 2026-11-18).
 * Płatność ostatniego stopnia ceny pokoju (gra/src/game/peace-tail-payment.ts):
 *   miasta (nigdy stolica / ostatnie) → złoto → brąz → żelazo → rudy; zapasy nigdy poniżej zera; brak → niedobór.
 *
 *  (T1) kolejność złoto → brąz (dane: war-weariness-params.json ogonPokoju.kolejnosc);
 *  (T2) brak złota → pierwszy jest brąz;
 *  (T3) zapasy nie wystarczają → qty ≤ zapasy, niedobór > 0, zapas nigdy poniżej zera;
 *  (T4) miasta najpierw: gdy miasta pokrywają cenę, ogon pusty (metale nie idą przed miastami);
 *  (T5) stolica / ostatnie miasto (forbidden) nigdy nie wchodzi do płatności; reszta idzie w złoto;
 *  (T6) słabsza AI z częścią miast: miasta, potem ogon tylko na resztę;
 *  (T7) cena 0 (r = 1 ⇒ D = 0) → pusta płatność, pokryta w całości;
 *  (T8) surowiec bez wyceny (null) jest pomijany;
 *  (T9) brak klucza w zapasach = 0;
 *  (T10) domyślna kolejność = dane (złoto, brąz, żelazo, ruda, ruda_cyny, ruda_zelaza), bez stali;
 *  (M1-M3) mutacje ŹRÓDŁA peace-tail-payment.ts (odwrócona kolejność; ignorowanie forbidden; brak
 *          ograniczenia zapasami) — każda musi czerwienić co najmniej jeden test.
 *
 *   node tools/diplo-peace-last-stage-payment-test.cjs   # exit 0 = wszystko zielone i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC_FILE = path.resolve(GRA_ROOT, 'src', 'game', 'peace-tail-payment.ts');
const TAG = `${process.pid}`;
const ENTRY = path.resolve(__dirname, `.ptail-${TAG}-entry.ts`);
const MUT_FILE = path.resolve(GRA_ROOT, 'src', 'game', `.ptail-mut-${TAG}.ts`);
const BUNDLE = path.resolve(__dirname, `.ptail-${TAG}-bundle.cjs`);
const ORIG = fs.readFileSync(SRC_FILE, 'utf8');

function cleanup() {
  for (const f of [ENTRY, MUT_FILE, BUNDLE]) { try { fs.unlinkSync(f); } catch (_) { /* ignore */ } }
}

/** Buduje moduł z podanej treści źródła (mutanty) i zwraca eksporty. */
function load(source, srcFile) {
  fs.writeFileSync(srcFile, source);
  fs.writeFileSync(ENTRY, `export * as T from ${JSON.stringify(srcFile)};\n`);
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE, logLevel: 'silent',
  });
  delete require.cache[BUNDLE];
  return require(BUNDLE).T;
}

const PRICES = { zloto: 10, braz: 5, zelazo: 4, ruda: 2, ruda_cyny: 2, ruda_zelaza: 2 };
const pnPerUnit = (k) => PRICES[k];
const city = (id, pn, forbidden = false) => ({ kind: 'miasto', id, amount: 1, pn, forbidden });

/** Zwraca listę wyników [{name, ok, detail}] dla danego zestawu eksportów. */
function runSuite(T) {
  const out = [];
  const check = (name, fn) => {
    try { const r = fn(); out.push({ name, ok: r === true, detail: r === true ? '' : String(r) }); }
    catch (e) { out.push({ name, ok: false, detail: String(e && e.message || e) }); }
  };
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const base = { pnPerUnit };

  check('T1 złoto przed brązem (1000 PN, zapas zł 30, brąz 500)', () => {
    const s = T.settlePeaceDue({ ...base, duePn: 1000, cities: [], holdings: { zloto: 30, braz: 500, zelazo: 500, ruda: 500 } });
    if (!eq(s.tail.map(i => [i.key, i.qty]), [['zloto', 30], ['braz', 140]])) return 'tail=' + JSON.stringify(s.tail);
    if (!(s.full && s.shortfallPn === 0)) return 'full/shortfall=' + s.full + '/' + s.shortfallPn;
    return true;
  });
  check('T2 brak złota → brąz pierwszy', () => {
    const s = T.settlePeaceDue({ ...base, duePn: 100, cities: [], holdings: { zloto: 0, braz: 50 } });
    return eq(s.tail.map(i => i.key), ['braz']) && s.full ? true : 'tail=' + JSON.stringify(s.tail);
  });
  check('T3 zapas za mały → niedobór, nie poniżej zera', () => {
    const s = T.settlePeaceDue({ ...base, duePn: 1000, cities: [], holdings: { zloto: 0, braz: 3 } });
    if (!(s.tail.length === 1 && s.tail[0].qty === 3)) return 'qty=' + JSON.stringify(s.tail);
    if (!(s.shortfallPn === 985 && !s.full)) return 'shortfall=' + s.shortfallPn;
    return true;
  });
  check('T4 miasta pokrywają cenę → ogon pusty (metale nie idą przed miastami)', () => {
    const s = T.settlePeaceDue({ ...base, duePn: 1000, cities: [city('c1', 600), city('c2', 500)], holdings: { zloto: 100, braz: 100 } });
    return s.full && s.tail.length === 0 && s.cities.length >= 1 ? true : 'cities=' + s.cities.length + ' tail=' + JSON.stringify(s.tail);
  });
  check('T5 stolica (forbidden) nigdy nie płaci; reszta w złoto', () => {
    const s = T.settlePeaceDue({ ...base, duePn: 500, cities: [city('stolica', 900, true)], holdings: { zloto: 100 } });
    if (s.cities.length !== 0) return 'użyto zakazanego miasta: ' + JSON.stringify(s.cities.map(c => c.id));
    if (!(s.tail.length === 1 && s.tail[0].key === 'zloto' && s.tail[0].qty === 50 && s.full)) return 'tail=' + JSON.stringify(s.tail);
    return true;
  });
  check('T6 słabsza AI z częścią miast: miasta, potem ogon na resztę', () => {
    const s = T.settlePeaceDue({ ...base, duePn: 1000, cities: [city('c1', 300)], holdings: { braz: 1000 } });
    if (!(s.cities.length === 1 && s.cities[0].id === 'c1')) return 'miasta=' + JSON.stringify(s.cities);
    if (!(s.tail.length === 1 && s.tail[0].key === 'braz' && s.tail[0].pn === 700 && s.full)) return 'tail=' + JSON.stringify(s.tail);
    return true;
  });
  check('T7 cena 0 (r = 1 ⇒ D = 0) → pusta płatność, pokryta', () => {
    const s = T.settlePeaceDue({ ...base, duePn: 0, cities: [], holdings: { zloto: 99 } });
    return s.full && s.tail.length === 0 && s.cities.length === 0 && s.shortfallPn === 0 ? true : JSON.stringify(s);
  });
  check('T8 surowiec bez wyceny (null) pominięty', () => {
    const s = T.settlePeaceDue({ duePn: 100, cities: [], holdings: { zloto: 50, braz: 50 },
      pnPerUnit: (k) => (k === 'zloto' ? null : PRICES[k]) });
    return eq(s.tail.map(i => i.key), ['braz']) ? true : 'tail=' + JSON.stringify(s.tail);
  });
  check('T9 brak klucza w zapasach = 0', () => {
    const s = T.settlePeaceDue({ ...base, duePn: 100, cities: [], holdings: {} });
    return s.tail.length === 0 && s.shortfallPn === 100 && !s.full ? true : JSON.stringify(s);
  });
  check('T10 domyślna kolejność = dane, bez stali', () => {
    return eq(T.PEACE_TAIL_ORDER, ['zloto', 'braz', 'zelazo', 'ruda', 'ruda_cyny', 'ruda_zelaza']) ? true : JSON.stringify(T.PEACE_TAIL_ORDER);
  });
  return out;
}

let exitCode = 0;
try {
  const live = load(ORIG, MUT_FILE);
  const liveRes = runSuite(live);
  const liveFail = liveRes.filter(r => !r.ok);
  console.log(`LIVE: ${liveRes.length - liveFail.length}/${liveRes.length} zielone`);
  for (const r of liveFail) console.log('  FAIL ' + r.name + ' :: ' + r.detail);
  if (liveFail.length) exitCode = 1;

  const mutants = [
    ['M1 odwrócona kolejność ogona', ORIG.replace('const order = input.order ?? PEACE_TAIL_ORDER;',
      'const order = [...(input.order ?? PEACE_TAIL_ORDER)].reverse();')],
    ['M2 ignorowanie forbidden (stolica płaci)', ORIG.replace('planCityPeacePayment(need, input.cities, Number.POSITIVE_INFINITY)',
      'planCityPeacePayment(need, input.cities.map(c => ({ ...c, forbidden: false })), Number.POSITIVE_INFINITY)')],
    ['M3 brak ograniczenia zapasami', ORIG.replace('const qty = Math.min(have, unitsNeeded);', 'const qty = unitsNeeded;')],
  ];
  for (const [name, src] of mutants) {
    if (src === ORIG) { console.log(`MUTANT ${name}: NIE ZASTOSOWANO (wzorzec nieobecny) -> FAIL`); exitCode = 1; continue; }
    const T = load(src, MUT_FILE);
    const bad = runSuite(T).filter(r => !r.ok);
    if (bad.length) console.log(`MUTANT ${name}: wykryty (${bad.length} czerwonych, np. ${bad[0].name})`);
    else { console.log(`MUTANT ${name}: NIE WYKRYTY -> FAIL`); exitCode = 1; }
  }
} catch (e) {
  console.log('BŁĄD: ' + (e && e.stack || e));
  exitCode = 1;
} finally {
  cleanup();
}
console.log(exitCode === 0 ? 'OK' : 'FAIL');
process.exit(exitCode);
