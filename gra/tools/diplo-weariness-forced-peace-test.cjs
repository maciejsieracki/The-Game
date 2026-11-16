'use strict';
/**
 * diplo-weariness-forced-peace-test.cjs -- DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1 (ABC 2026-11-16).
 * Zastepuje obsoletny diplo-weariness-unconditional-end-test.cjs (pokoj bezwarunkowy przy 80% zostal usuniety;
 * 80% = tylko oferta z miastami, 100% = pokoj WYMUSZONY).
 *
 *   (F1) poziom 100% (40 tur), wyrazie przegrywajacy z cena > 0 -> forced_peace, miasta oddane > 0, pokoj sfinalizowany;
 *   (F2) poziom 80% (32 tury) -> NIE jest wymuszony (wearinessForcedPeaceDue(0,8) = false; progWymuszonyPokoj = 1,0);
 *   (F3) chroniony przegrywajacy (<= 3 miast, 1 utrata) przy 100% -> karencja chronionego (100 tur);
 *   (F4) cena 0 przy 100% -> pokoj bez oddania miasta (brak pay);
 *   (F5) remis sil (udzial 0,5 > 0,45, brak wyraznie przegrywajacego) przy 100% -> pokoj bez miast, bez pay;
 *   (F6) battlePending przy 100% -> odroczenie: brak pokoju w tej turze, stan pary zostaje;
 *   (F7) gracz jako strona pary (id 0) przy 100% -> ta sama galaz wymuszenia (pokoj gracz<->AI);
 *   (F8) nigdy stolica: plan nie zawiera zakazanego miasta;
 *   (F9) mutacja: wylaczenie galezi wymuszenia w source war-weariness.ts czerwieni F1.
 *
 *   node tools/diplo-weariness-forced-peace-test.cjs   # exit 0 = wszystko zielone i mutant wykryty
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = path.resolve(GRA_ROOT, 'src');
const WW = path.join(SRC, 'game', 'war-weariness.ts');
const PARAMS = path.join(GRA_ROOT, 'data', 'war-weariness-params.json');
const TAG = `${process.pid}`;
const ENTRY = path.resolve(__dirname, `.fpeace-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.fpeace-${TAG}-bundle.cjs`);
const J = (p) => JSON.stringify(p);

const ORIG = fs.readFileSync(WW, 'utf8');
const PJ = JSON.parse(fs.readFileSync(PARAMS, 'utf8'));

/** Buduje modul war-weariness z podana trescia zrodla (dla mutanta: plik tymczasowy obok oryginalu). */
function loadW(src) {
  const MUT = path.join(path.dirname(WW), `.fpeace-mut-${TAG}.ts`);
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

const A = (kind, id, amount, pn, forbidden) => ({ kind, id, amount, pn, forbidden });
const CITY_ASSETS = [
  A('miasto', 'c1', 1, 400), A('miasto', 'c2', 1, 500), A('miasto', 'c3', 1, 300), A('miasto', 'cap', 1, 9999, true),
];

/** Scenariusz pary: pairs [{a,b}]; o.weakerId = id przegrywajacego; share1 = udzial sily strony a. */
function mk(W, o) {
  const log = [];
  const a = o.a ?? 1;
  const b = o.b ?? 2;
  const deps = {
    store: new Map(), turn: 400, pairs: [{ a, b }],
    pairKey: (x, y) => `${Math.min(x, y)}-${Math.max(x, y)}`,
    warInfo: () => ({
      warStart: 400 - o.turnsAtWar, turnsAtWar: o.turnsAtWar,
      lostA: o.lostA || 0, lostB: o.lostB || 0, turnsSinceCityChange: o.turnsAtWar,
    }),
    shareOf: (x) => (x === a ? o.share1 : 1 - o.share1),
    weakerOf: () => o.weakerId,
    cityCountOf: (own) => (own === o.weakerId && o.loserCities !== undefined ? o.loserCities : 6),
    price: () => ({ requiredPn: o.requiredPn, balanceFor: (c) => c, tolerancePn: 20 }),
    assets: () => o.assets ?? CITY_ASSETS,
    cityCessionOk: () => true,
    battlePending: !!o.battlePending,
    pay: (l, w, plan) => log.push({ ev: 'pay', l, w, plan }),
    finalize: (l, w, lock) => log.push({ ev: 'peace', l, w, lock }),
  };
  return { deps, log };
}

function run(W, src) {
  const res = [];
  const chk = (name, ok, extra) => res.push({ name, ok: !!ok, extra });
  const P = W.WAR_WEARINESS_PARAMS;

  chk('parametr: progWymuszonyPokoj = 1,0 w JSON i w module',
    PJ.zmeczenie.progWymuszonyPokoj === 1 && P.zmeczenie.progWymuszonyPokoj === 1);
  chk('parametr: pelneTur = 40', PJ.zmeczenie.pelneTur === 40);

  // F1 — 100%, wyrazny przegrywajacy (udzial 0,15 < 0,45), cena 500, 6 miast.
  {
    const { deps, log } = mk(W, { turnsAtWar: 40, share1: 0.15, weakerId: 1, requiredPn: 500 });
    const r = W.runWarWearinessTick(deps)[0];
    const pay = log.find((x) => x.ev === 'pay');
    const pe = log.find((x) => x.ev === 'peace');
    chk('F1: 100% (40 tur) wyrazny przegrywajacy -> forced_peace', r.action === 'forced_peace', r.action);
    chk('F1: oddaje miasta (plan z miastem, pay wywolany)', !!pay && pay.plan.histogram.miasto >= 1, JSON.stringify(pay && pay.plan.histogram));
    chk('F1: pokoj sfinalizowany z karencja zwykla 40', !!pe && pe.lock === P.przegrywajacy.karencjaPoPokojuTur, pe && pe.lock);
  }
  // F2 — 80% (32 tury) nie jest pokojem wymuszonym.
  {
    const { deps, log } = mk(W, { turnsAtWar: 32, share1: 0.15, weakerId: 1, requiredPn: 500 });
    const r = W.runWarWearinessTick(deps)[0];
    chk('F2: 80% (32 tury) NIE wymusza pokoju', r.action !== 'forced_peace' && !log.some((x) => x.ev === 'peace' && x.l === 1 && x.w === 2 && x.lock === 40 && r.action === 'forced_peace'),
      r.action);
    chk('F2: wearinessForcedPeaceDue(0,8) = false, (1,0) = true', W.wearinessForcedPeaceDue(0.8) === false && W.wearinessForcedPeaceDue(1) === true);
  }
  // F3 — chroniony przegrywajacy: 3 miasta, 1 utrata => karencja chronionego.
  {
    const { deps, log } = mk(W, { turnsAtWar: 40, share1: 0.15, weakerId: 1, requiredPn: 300, lostA: 1, loserCities: 3 });
    const r = W.runWarWearinessTick(deps)[0];
    const pe = log.find((x) => x.ev === 'peace');
    chk('F3: chroniony przegrywajacy przy 100% -> forced_peace z karencja chronionego (100)',
      r.action === 'forced_peace' && !!pe && pe.lock === P.przegrywajacy.karencjaChronionegoTur, pe && pe.lock);
  }
  // F4 — cena 0 -> pokoj bez zaplaty miastem.
  {
    const { deps, log } = mk(W, { turnsAtWar: 40, share1: 0.15, weakerId: 1, requiredPn: 0 });
    const r = W.runWarWearinessTick(deps)[0];
    chk('F4: cena 0 przy 100% -> pokoj bez pay', r.action === 'forced_peace' && !log.some((x) => x.ev === 'pay') && log.some((x) => x.ev === 'peace'));
  }
  // F5 — remis sil: brak wyraznie przegrywajacego (udzial 0,5 > 0,45) -> pokoj bez miast.
  {
    const { deps, log } = mk(W, { turnsAtWar: 40, share1: 0.5, weakerId: 1, requiredPn: 500 });
    const r = W.runWarWearinessTick(deps)[0];
    chk('F5: remis sil przy 100% -> pokoj bez miast (brak pay), sfinalizowany', r.action === 'forced_peace'
      && !log.some((x) => x.ev === 'pay') && log.some((x) => x.ev === 'peace'));
  }
  // F6 — battlePending: odroczenie na nastepna ture (bez pokoju w tej turze).
  {
    const { deps, log } = mk(W, { turnsAtWar: 40, share1: 0.15, weakerId: 1, requiredPn: 500, battlePending: true });
    const r = W.runWarWearinessTick(deps)[0];
    chk('F6: battlePending przy 100% -> odroczenie (action none, brak peace/pay)',
      r.action === 'none' && log.length === 0 && deps.store.size === 1, r.action);
  }
  // F7 — gracz (id 0) jako strona pary: ta sama galaz wymuszenia.
  {
    const { deps, log } = mk(W, { a: 0, b: 2, turnsAtWar: 40, share1: 0.15, weakerId: 0, requiredPn: 500 });
    const r = W.runWarWearinessTick(deps)[0];
    const pe = log.find((x) => x.ev === 'peace');
    chk('F7: gracz (0) przegrywajacy przy 100% -> forced_peace, miasta oddaje gracz', r.action === 'forced_peace'
      && !!pe && pe.l === 0 && pe.w === 2 && log.some((x) => x.ev === 'pay' && x.l === 0));
  }
  // F8 — stolica nigdy w planie.
  {
    const { deps, log } = mk(W, { turnsAtWar: 40, share1: 0.15, weakerId: 1, requiredPn: 99999 });
    W.runWarWearinessTick(deps);
    const pay = log.find((x) => x.ev === 'pay');
    chk('F8: stolica (forbidden) nigdy w planie wymuszonego pokoju',
      !pay || !pay.plan.items.some((i) => i.id === 'cap'));
  }
  // F9 — mutacja zrodla: wylaczenie galezi wymuszenia musi czerwienic F1.
  {
    const mut = src.replace('if (wearinessForcedPeaceDue(lvl, P)) {', 'if (false) {');
    if (mut === src) chk('F9: mutacja: znaleziono galaz wymuszenia w source', false, 'brak wzorca');
    else {
      const WM = loadW(mut);
      const { deps } = mk(WM, { turnsAtWar: 40, share1: 0.15, weakerId: 1, requiredPn: 500 });
      const r = WM.runWarWearinessTick(deps)[0];
      chk('F9: mutant (galaz wymuszenia wylaczona) -> F1 czerwony (action != forced_peace)', r.action !== 'forced_peace', r.action);
    }
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
  const res = run(W, ORIG);
  let pass = 0, fail = 0;
  for (const r of res) {
    if (r.ok) pass++; else fail++;
    console.log(`${r.ok ? 'PASS' : 'FAIL'}: ${r.name}${r.extra !== undefined && !r.ok ? ` -- ${JSON.stringify(r.extra)}` : ''}`);
  }
  console.log(`diplo-weariness-forced-peace-test: PASS=${pass} FAIL=${fail}`);
  process.exitCode = fail === 0 ? 0 : 1;
} finally {
  for (const f of [ENTRY, BUNDLE]) { try { fs.unlinkSync(f); } catch (_) { /* ignore */ } }
}
