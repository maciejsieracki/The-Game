'use strict';
/**
 * diplo-treaty-payment-carrier-test.cjs -- R-WEB-DIPLO-TREATY-PAYMENT-CARRIER-Q1 (ABC 2026-11-18).
 * Nośnik dopłaty D w traktatach (gra/src/game/treaty-payment.ts): composeTreatyPayment.
 *   kolejność: technologie (tylko których druga strona NIE ma; najdroższe, bez nadpłaty) → złoto → brąz → żelazo
 *   → rudy (ogon z peace-tail-payment) → praca → pieniądze; zapasy nigdy poniżej zera; brak → niedobór.
 *
 *  (T1) kolejność: tech przed złotem (najdroższa tech mieści się, reszta złotem);
 *  (T2) technologie, które druga strona już ma, NIE wchodzą do płatności;
 *  (T3) tech droższa niż reszta nie jest brana (brak nadpłaty), płaci złoto;
 *  (T4) niedobór: zapasy < D → shortfallPn > 0, zapas nigdy poniżej zera, full = false;
 *  (T5) r = 1 ⇒ D = 0 ⇒ pusta płatność, full = true;
 *  (T6) brak złota → pomijamy, idziemy do brązu/żelaza (kolejność z danych);
 *  (T7) stopnie praca → pieniądze po ogonie; zapas pracy ograniczony (nie ponad zapas);
 *  (T8) technologia bez wyceny (null/0/NaN) pomijana; duplikaty nazw nie liczą się dwa razy;
 *  (T9) brak technologii u płatnika = identyczny ogon jak composePeaceTail (pokój nietknięty);
 *  (T10) etykiety polskie (treatyPaymentLabel), bez surowych ID;
 *  (T11) treatyTechCandidates sortuje od najdroższej;
 *  (M1-M5) mutacje ŹRÓDŁA treaty-payment.ts (sortowanie tanie-pierwsze; brak filtra technologii drugiej strony;
 *          brak limitu „bez nadpłaty”; pominięty ogon; praca bez limitu zapasu) — każda musi czerwienić test.
 *
 *   node tools/diplo-treaty-payment-carrier-test.cjs   # exit 0 = wszystko zielone i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const GAME_DIR = path.resolve(GRA_ROOT, 'src', 'game');
const SRC_FILE = path.resolve(GAME_DIR, 'treaty-payment.ts');
const ORIG = fs.readFileSync(SRC_FILE, 'utf8');

/** Buduje moduł z podanej TREŚCI (stdin w pamięci; bez zapisu plików). */
function loadEntry(contents) {
  const res = esbuild.buildSync({
    stdin: { contents, resolveDir: GAME_DIR, sourcefile: 'treaty-payment-entry.ts', loader: 'ts' },
    bundle: true, format: 'cjs', platform: 'node', write: false, logLevel: 'silent',
  });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', res.outputFiles[0].text)(m, m.exports, require);
  return m.exports;
}

/** Reeksport composePeaceTail (porównanie T9 z ogonem pokoju). */
const REEXPORT = "\nexport { composePeaceTail } from './peace-tail-payment';\n";

const PRICES = { zloto: 10, braz: 5, zelazo: 4, ruda: 2, ruda_cyny: 2, ruda_zelaza: 2 };
const TECH_PN = { 'Rolnictwo': 50, 'Pismo': 30, 'Koło': 8, 'Brąz': 'x' };
const techPn = (n) => (n in TECH_PN ? (typeof TECH_PN[n] === 'number' ? TECH_PN[n] : null) : null);

function runSuite(T) {
  const out = [];
  const check = (name, fn) => {
    try { const r = fn(); out.push({ name, ok: r === true, detail: r === true ? '' : String(r) }); }
    catch (e) { out.push({ name, ok: false, detail: String(e && e.message || e) }); }
  };
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const pricing = (holdings) => ({ holdings, pnPerUnit: (k) => PRICES[k] });
  const base = { payerTechs: ['Rolnictwo', 'Pismo'], otherTechs: [], techPn, extraStages: [] };

  check('T1 kolejność: tech (najdroższa mieszcząca się) przed złotem', () => {
    const r = T.composeTreatyPayment({ ...base, duePn: 60, pricing: pricing({ zloto: 100 }) });
    // Rolnictwo 50 ≤ 60 → tech; reszta 10 → 1 złoto (10 PN). Pismo 30 > reszty po Rolnictwie (wybór greedy: najdroższe pierwsze).
    return eq(r.techs.map(t => t.name), ['Rolnictwo']) && eq(r.tail.map(t => [t.key, t.qty]), [['zloto', 1]]) && r.full === true
      ? true : JSON.stringify({ techs: r.techs, tail: r.tail, short: r.shortfallPn });
  });

  check('T2 technologie, które druga strona już ma, nie wchodzą', () => {
    const r = T.composeTreatyPayment({ ...base, otherTechs: ['Rolnictwo'], duePn: 60, pricing: pricing({ zloto: 100 }) });
    return !r.techs.some(t => t.name === 'Rolnictwo') && eq(r.techs.map(t => t.name), ['Pismo']) ? true
      : JSON.stringify(r.techs);
  });

  check('T3 tech droższa niż reszta nie jest brana (bez nadpłaty), płaci złoto', () => {
    const r = T.composeTreatyPayment({ ...base, payerTechs: ['Rolnictwo'], duePn: 40, pricing: pricing({ zloto: 100 }) });
    return r.techs.length === 0 && r.coveredByTechPn === 0 && r.coveredPn === 40 && r.full === true
      ? true : JSON.stringify({ techs: r.techs, cov: r.coveredPn });
  });

  check('T4 niedobór: zapas < D → shortfall > 0, zapas nigdy poniżej zera', () => {
    const r = T.composeTreatyPayment({ ...base, payerTechs: [], duePn: 100, pricing: pricing({ zloto: 3 }) });
    const q = r.tail.find(t => t.key === 'zloto');
    return r.full === false && r.shortfallPn === 70 && q && q.qty <= 3 && r.coveredPn === 30
      ? true : JSON.stringify({ short: r.shortfallPn, tail: r.tail, cov: r.coveredPn });
  });

  check('T5 r = 1 ⇒ D = 0 ⇒ pusta płatność, full', () => {
    const r = T.composeTreatyPayment({ ...base, duePn: 0, pricing: pricing({ zloto: 100 }) });
    return r.techs.length === 0 && r.tail.length === 0 && r.extra.length === 0 && r.full === true && r.shortfallPn === 0
      ? true : JSON.stringify(r);
  });

  check('T6 brak złota → pomijamy, idziemy do brązu/żelaza (kolejność z danych)', () => {
    const r = T.composeTreatyPayment({ ...base, payerTechs: [], duePn: 20, pricing: pricing({ zloto: 0, braz: 2, zelazo: 100 }) });
    return eq(r.tail.map(t => t.key), ['braz', 'zelazo']) && r.full === true && r.shortfallPn === 0
      ? true : JSON.stringify({ tail: r.tail, short: r.shortfallPn });
  });

  check('T7 praca → pieniądze po ogonie; zapas pracy nie przekroczony', () => {
    const extraStages = [{ key: 'praca', have: 2, pnPerUnit: 4 }, { key: 'pieniadze', have: 100, pnPerUnit: 1 }];
    const r = T.composeTreatyPayment({ ...base, payerTechs: [], duePn: 30, pricing: pricing({ zloto: 1 }), extraStages });
    // złoto 1 = 10 PN; praca max 2×4 = 8 PN; reszta 12 → pieniądze 12 ¤
    const praca = r.extra.find(e => e.key === 'praca');
    const pien = r.extra.find(e => e.key === 'pieniadze');
    return praca && praca.qty === 2 && pien && pien.qty === 12 && r.full === true
      ? true : JSON.stringify(r.extra);
  });

  check('T8 tech bez wyceny (null/NaN/0) pominięta; duplikat nie liczy się dwa razy', () => {
    const c = T.treatyTechCandidates(['Koło', 'Koło', 'Brąz', 'Nieznana'], [], techPn);
    return eq(c.map(t => t.name), ['Koło']) ? true : JSON.stringify(c);
  });

  check('T9 bez technologii płatnika = ogon jak composePeaceTail (pokój nietknięty)', () => {
    const pk = pricing({ zloto: 2, braz: 40 });
    const a = T.composeTreatyPayment({ ...base, payerTechs: [], duePn: 75, pricing: pk });
    const b = T.composePeaceTail(75, pk);
    return eq(a.tail, b.tail) && a.shortfallPn === b.shortfallPn ? true : JSON.stringify([a.tail, b.tail]);
  });

  check('T10 etykieta polska, bez surowych ID', () => {
    const r = T.composeTreatyPayment({ ...base, duePn: 60, pricing: pricing({ zloto: 100 }) });
    const s = T.treatyPaymentLabel(r);
    return s.startsWith('Dopłata: ') && s.includes('technologia Rolnictwo') && s.includes('złoto') && !/ruda_|zloto|braz/.test(s)
      ? true : s;
  });

  check('T11 treatyTechCandidates sortuje od najdroższej', () => {
    const c = T.treatyTechCandidates(['Koło', 'Pismo', 'Rolnictwo'], [], techPn);
    return eq(c.map(t => t.name), ['Rolnictwo', 'Pismo', 'Koło']) ? true : JSON.stringify(c);
  });

  return out;
}

const live = loadEntry(ORIG + REEXPORT);
const liveRes = runSuite(live);
let pass = 0; let fail = 0;
for (const r of liveRes) {
  if (r.ok) pass++; else fail++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.ok ? '' : ' :: ' + r.detail}`);
}

const MUTANTS = [
  ['M1 technologie tanie-pierwsze', ORIG.replace('out.sort((a, b) => (b.pn - a.pn)', 'out.sort((a, b) => (a.pn - b.pn)')],
  ['M2 brak filtra technologii drugiej strony', ORIG.replace('if (seen.has(name) || other.has(name)) continue;', 'if (seen.has(name)) continue;')],
  ['M3 brak limitu „bez nadpłaty”', ORIG.replace('if (cand.pn > rem) continue;', '')],
  ['M4 pominięty ogon (złoto/metale)', ORIG.replace('const tailRes = composePeaceTail(rem, { ...input.pricing, order });', 'const tailRes = composePeaceTail(0, { ...input.pricing, order });')],
  ['M5 praca bez limitu zapasu', ORIG.replace('const qty = Math.min(have, Math.ceil(rem / price));', 'const qty = Math.ceil(rem / price);')],
];
let mutFail = 0;
for (const [name, src] of MUTANTS) {
  if (src === ORIG) { console.log(`FAIL ${name} :: mutacja nie zmieniła źródła`); mutFail++; continue; }
  let res;
  try { res = runSuite(loadEntry(src + REEXPORT)); } catch (e) { res = [{ ok: false, name: 'load', detail: String(e.message || e) }]; }
  const killed = res.some(r => !r.ok);
  console.log(`${killed ? 'KILLED' : 'SURVIVED'} ${name}`);
  if (!killed) mutFail++;
}

console.log(`\ndiplo-treaty-payment-carrier-test: ${pass} pass / ${fail} fail; mutanty niewykryte: ${mutFail}`);
process.exit(fail === 0 && mutFail === 0 ? 0 : 1);
