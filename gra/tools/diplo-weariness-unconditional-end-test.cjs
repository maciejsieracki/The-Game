'use strict';
/**
 * diplo-weariness-unconditional-end-test.cjs -- R-WEB-DIPLO-WEARINESS-UNCONDITIONAL-END-Q1 (decyzja wlasciciela 2026-11-13).
 *
 *   (a)  cena pokoju 0 (wymagane PN = 0) -> pokoj BEZ oddawania miasta (takze przy jednym miescie i chronionym);
 *   (b)  zmeczenie < progKoncaZmeczenia (0,8): regula "jedno miasto nie kupi pokoju" dziala (cena > 0);
 *   (c)  zmeczenie >= progKoncaZmeczenia: pokoj BEZWARUNKOWY (bez miasta, bez zaplaty), takze silniejsza strona
 *        (remis sil, wygrywajacy ma wiecej sily) i takze przy jednym miescie;
 *   (d)  gracz nie jest wciagany automatycznie: po stronie AI jest jedna galaz zaproponuj_pokoj bez ceny
 *        (ai.ts, wiazanie wearinessUnconditionalEndDue), a tick AI<->AI nie wola pay przy pokoju bezwarunkowym;
 *   (e)  karencja po pokoju bezwarunkowym: 40 tur zwykly / 100 tur chroniony (z war-weariness-params.json);
 *   (f)  progKoncaZmeczenia istnieje w JSON i wynosi 0,8 (domyslna wartosc do potwierdzenia przez wlasciciela).
 * Kazda galez ma mutacje zrodla war-weariness.ts, ktora czerwieni co najmniej jeden test behawioralny.
 *
 *   node tools/diplo-weariness-unconditional-end-test.cjs   # exit 0 = wszystko zielone i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = path.resolve(GRA_ROOT, 'src');
const WW = path.join(SRC, 'game', 'war-weariness.ts');
const PARAMS = path.join(GRA_ROOT, 'data', 'war-weariness-params.json');
const AI_TS = path.join(SRC, 'game', 'ai.ts');
const J = (p) => JSON.stringify(path.join(SRC, p));
const TAG = `${process.pid}`;
const ENTRY = path.resolve(__dirname, `.uend-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.uend-${TAG}-bundle.cjs`);
fs.writeFileSync(ENTRY, `export * as W from ${J('game/war-weariness')};\n`);

const ORIG = fs.readFileSync(WW, 'utf8');
const PJ = JSON.parse(fs.readFileSync(PARAMS, 'utf8'));
const AI_SRC = fs.readFileSync(AI_TS, 'utf8');

/** Buduje modul war-weariness z podana trescia zrodla (mutanty); plik tymczasowy obok oryginalu. */
function loadW(src) {
  const MUT = path.join(path.dirname(WW), `.uend-mut-${TAG}.ts`);
  fs.writeFileSync(MUT, src);
  try {
    fs.writeFileSync(ENTRY, `export * as W from ${JSON.stringify(MUT)};\n`);
    esbuild.buildSync({
      entryPoints: [ENTRY], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE,
      logLevel: 'silent', loader: { '.json': 'json' },
    });
  } finally {
    try { fs.unlinkSync(MUT); } catch (_) { /* ignore */ }
  }
  delete require.cache[BUNDLE];
  return require(BUNDLE).W;
}

const A = (kind, id, amount, pn, forbidden) => ({ kind, id, amount, pn, forbidden });
const CITY_ASSETS = [A('zloto', 'zloto', 300, 300), A('miasto', 'c1', 1, 400), A('miasto', 'c2', 1, 500), A('miasto', 'cap', 1, 9999, true)];

/** Scenariusz pary (1 vs 2). o.weaker = id slabszej strony wg sily militarnej. */
function mk(o) {
  const log = [];
  const deps = {
    store: new Map(), turn: o.turn, pairs: [{ a: 1, b: 2 }],
    pairKey: (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`,
    warInfo: () => ({
      warStart: o.turn - o.turnsAtWar, turnsAtWar: o.turnsAtWar,
      lostA: o.lostA || 0, lostB: o.lostB || 0, turnsSinceCityChange: o.turnsAtWar,
    }),
    shareOf: (x) => (x === 1 ? o.share1 : 1 - o.share1),
    weakerOf: () => o.weaker,
    cityCountOf: (own) => (o.cityCount ? o.cityCount(own) : 6),
    price: () => ({ requiredPn: o.requiredPn, balanceFor: (c) => c, tolerancePn: 20 }),
    assets: () => o.assets ?? [],
    cityCessionOk: () => true,
    battlePending: false,
    pay: (l, w, plan) => log.push({ ev: 'pay', l, w, plan }),
    finalize: (l, w, lock) => log.push({ ev: 'peace', l, w, lock }),
  };
  return { deps, log };
}

/** Scenariusze zachowania (pure, bez zrodla AI). */
function behaviour(W) {
  const res = [];
  const chk = (name, ok) => res.push({ name, ok: !!ok });
  const P = W.WAR_WEARINESS_PARAMS;

  // (f) parametr
  chk('f: progKoncaZmeczenia = 0,8 w JSON i w module', P.zmeczenie.progKoncaZmeczenia === 0.8
    && PJ.zmeczenie.progKoncaZmeczenia === 0.8 && W.wearinessUnconditionalEndDue(0.8) === true && W.wearinessUnconditionalEndDue(0.79) === false);

  // (a) cena 0 -> pokoj bez miasta (zmeczenie 0,66 < 0,8; jedno miasto; chroniony z 2 miastami)
  {
    const { deps, log } = mk({ turn: 400, turnsAtWar: 90, share1: 0.15, weaker: 1, lostA: 1, requiredPn: 0, assets: [] });
    const r = W.runWarWearinessTick(deps)[0];
    chk('a1: cena 0, zmeczenie < 0,8 -> pokoj bez miasta (offer_accepted, brak miasta w planie)',
      r.action === 'offer_accepted' && r.plan.histogram.miasto === 0 && log.some((x) => x.ev === 'peace'));
  }
  {
    const { deps, log } = mk({ turn: 400, turnsAtWar: 90, share1: 0.15, weaker: 1, lostA: 1, requiredPn: 0, assets: [], cityCount: (o) => (o === 1 ? 1 : 6) });
    const r = W.runWarWearinessTick(deps)[0];
    chk('a2: cena 0 i jedno miasto -> pokoj bez miasta (nie blokuje guard jednego miasta)',
      r.action === 'offer_accepted' && log.some((x) => x.ev === 'peace' && x.l === 1));
  }
  {
    const { deps, log } = mk({ turn: 400, turnsAtWar: 90, share1: 0.15, weaker: 1, lostA: 3, requiredPn: 0, assets: [], cityCount: (o) => (o === 1 ? 2 : 6) });
    const r = W.runWarWearinessTick(deps)[0];
    const pe = log.find((x) => x.ev === 'peace');
    chk('a3: cena 0, chroniony przegrywajacy z 2 miastami -> pokoj bez miasta, karencja chronionego 100',
      r.action === 'offer_accepted' && !!pe && pe.lock === P.przegrywajacy.karencjaChronionegoTur && r.plan.histogram.miasto === 0);
  }

  // (b) zmeczenie < 0,8: jedno miasto i cena > 0 -> brak oferty i brak pokoju
  {
    const { deps, log } = mk({ turn: 400, turnsAtWar: 90, share1: 0.15, weaker: 1, lostA: 1, requiredPn: 500, assets: CITY_ASSETS, cityCount: (o) => (o === 1 ? 1 : 6) });
    const r = W.runWarWearinessTick(deps)[0];
    chk('b1: zmeczenie < 0,8, jedno miasto, cena > 0 -> action none, brak pokoju',
      r.action === 'none' && !log.some((x) => x.ev === 'peace' || x.ev === 'pay'));
  }

  // (c) zmeczenie >= 0,8 -> pokoj bezwarunkowy
  {
    const { deps, log } = mk({ turn: 400, turnsAtWar: 200, share1: 0.15, weaker: 1, lostA: 3, requiredPn: 500, assets: [] });
    const r = W.runWarWearinessTick(deps)[0];
    const pe = log.find((x) => x.ev === 'peace');
    chk('c1: zmeczenie >= 0,8, slabsza bez miast do oddania -> pokoj bez zaplaty (mutual_peace, brak pay)',
      r.action === 'mutual_peace' && !!pe && !log.some((x) => x.ev === 'pay'));
  }
  {
    const { deps, log } = mk({ turn: 400, turnsAtWar: 200, share1: 0.15, weaker: 1, lostA: 3, requiredPn: 500, assets: CITY_ASSETS, cityCount: (o) => (o === 1 ? 1 : 6) });
    const r = W.runWarWearinessTick(deps)[0];
    chk('c2: zmeczenie >= 0,8, jedno miasto -> pokoj bezwarunkowy (zastepuje regule jednego miasta)',
      r.action === 'mutual_peace' && log.some((x) => x.ev === 'peace') && !log.some((x) => x.ev === 'pay'));
  }
  {
    // silniejsza strona (remis sil, slabsza = 2): obie strony proponuja, pokoj bez miasta
    const { deps, log } = mk({ turn: 400, turnsAtWar: 200, share1: 0.5, weaker: 2, lostB: 0, lostA: 0, requiredPn: 500, assets: CITY_ASSETS });
    const r = W.runWarWearinessTick(deps)[0];
    chk('c3: zmeczenie >= 0,8, remis sil -> pokoj bezwarunkowy bez miasta',
      r.action === 'mutual_peace' && log.some((x) => x.ev === 'peace' && x.l === 2) && !log.some((x) => x.ev === 'pay'));
  }
  {
    // zmeczenie tuz ponizej progu: nadal reguly miasta (brak pokoju bez miasta przy cenie > 0)
    const { deps, log } = mk({ turn: 400, turnsAtWar: 90, share1: 0.5, weaker: 2, lostA: 0, requiredPn: 500, assets: [] });
    const r = W.runWarWearinessTick(deps)[0];
    const lvl = r.level;
    chk(`c4: zmeczenie ${lvl.toFixed(2)} < 0,8 -> brak pokoju bez miasta (reguly przed koncem)`,
      lvl < 0.8 && r.action !== 'mutual_peace' && !log.some((x) => x.ev === 'peace'));
  }

  {
    // przed progiem: remis sil, slabsza (2) placi miastem; mutant z udzialem zamiast slabszej strony wskaze stronę 1
    const { deps, log } = mk({ turn: 400, turnsAtWar: 90, share1: 0.5, weaker: 2, lostA: 0, requiredPn: 500, assets: CITY_ASSETS });
    W.runWarWearinessTick(deps);
    chk('c5: przed progiem, remis sil: przegrywa slabsza strona (2) i placi miastem', log.some((x) => x.ev === 'pay' && x.l === 2));
  }
  // (d) tick nie wola zaplaty przy pokoju bezwarunkowym (gracz nie jest wciagany) -- zachowanie AI<->AI
  {
    const { deps, log } = mk({ turn: 400, turnsAtWar: 200, share1: 0.9, weaker: 2, requiredPn: 500, assets: CITY_ASSETS });
    W.runWarWearinessTick(deps);
    chk('d1: koniec zmeczenia bez zaplaty w ticku (brak ev pay)', !log.some((x) => x.ev === 'pay'));
  }

  // (e) karencja po pokoju bezwarunkowym
  {
    const { deps, log } = mk({ turn: 400, turnsAtWar: 200, share1: 0.15, weaker: 1, lostA: 0, requiredPn: 500, assets: [] });
    W.runWarWearinessTick(deps);
    const pe = log.find((x) => x.ev === 'peace');
    chk('e1: pokoj bezwarunkowy zwykly -> karencja 40 (z JSON)', !!pe && pe.lock === P.przegrywajacy.karencjaPoPokojuTur && pe.lock === 40);
  }
  {
    const { deps, log } = mk({ turn: 400, turnsAtWar: 200, share1: 0.15, weaker: 1, lostA: 3, cityCount: (o) => (o === 1 ? 3 : 6), requiredPn: 500, assets: [] });
    W.runWarWearinessTick(deps);
    const pe = log.find((x) => x.ev === 'peace');
    chk('e2: pokoj bezwarunkowy chronionego -> karencja 100 (z JSON)', !!pe && pe.lock === P.przegrywajacy.karencjaChronionegoTur && pe.lock === 100);
  }
  return res;
}

/** Wiazanie ai.ts: jedna galaz pokoju bezwarunkowego (zaproponuj_pokoj bez ceny) z wearinessUnconditionalEndDue. */
function aiWiringOk(aiSrc) {
  const cnt = (s, t) => s.split(t).length - 1;
  return cnt(aiSrc, 'wearinessUnconditionalEndDue(wearyLevel)') === 1
    && cnt(aiSrc, "koniec zmeczenia wojna (zmeczenie") === 1;
}

/** Mutacje zrodla war-weariness.ts: kazda musi czerwienic co najmniej jeden test behawioralny. */
const MUTANTS = [
  { id: 'U1-brak-galezi-konca', from: 'if (wearinessUnconditionalEndDue(lvl, P)) {', to: 'if (false) {',
    gate: 'pokoj bezwarunkowy na koncu zmeczenia (c1-c3, e1, e2)' },
  { id: 'U2-prog-stały', from: 'return level >= P.zmeczenie.progKoncaZmeczenia;', to: 'return level >= 2;',
    gate: 'prog konca zmeczenia z JSON (f, c)' },
  { id: 'U3-cena-0-bez-zmiany', from: 'const priceZero = price.requiredPn <= 0;', to: 'const priceZero = false;',
    gate: 'cena 0 -> pokoj bez miasta (a1-a3)' },
  { id: 'U4-karencja-koniec-bez-ochrony', from: 'const lockEnd = protectedLoser ? L.karencjaChronionegoTur : L.karencjaPoPokojuTur;',
    to: 'const lockEnd = L.karencjaPoPokojuTur;', gate: 'karencja 100 po pokoju bezwarunkowym chronionego (e2)' },
  { id: 'U5-koniec-z-platnoscia', from: 'd.finalize(loser, winner, lockEnd);', to: 'd.pay(loser, winner, { items: [], coveredPn: 0, shortfallPn: 0, full: true, histogram: { zloto: 0, surowiec_ilosc: 0, miasto: 0 } }); d.finalize(loser, winner, lockEnd);',
    gate: 'pokoj bezwarunkowy bez zaplaty (c1, d1)' },
];

function run() {
  let pass = 0;
  let fail = 0;
  const report = (ok, msg) => { if (ok) pass++; else { fail++; console.error('FAIL:', msg); } };

  const base = behaviour(loadW(ORIG));
  for (const c of base) report(c.ok, `behawior bazowy: ${c.name}`);
  console.log(`baza: ${base.filter((c) => c.ok).length}/${base.length} sprawdzen behawioralnych zielonych`);

  report(aiWiringOk(AI_SRC), 'ai.ts: brak jednej galezi pokoju bezwarunkowego (wearinessUnconditionalEndDue(wearyLevel))');
  const aiMut = AI_SRC.replace('wearinessUnconditionalEndDue(wearyLevel)', 'false');
  report(!aiWiringOk(aiMut), 'mutant AI-U6 (wiazanie ai.ts) PRZESZEDL - test statyczny go nie wykrywa');

  for (const m of MUTANTS) {
    const hits = ORIG.split(m.from).length - 1;
    if (hits !== 1) { report(false, `mutant ${m.id}: fragment nie wystapil dokladnie raz (${hits})`); continue; }
    const mutated = ORIG.replace(m.from, m.to);
    let red = [];
    try {
      red = behaviour(loadW(mutated)).filter((c) => !c.ok).map((c) => c.name);
    } catch (e) {
      red = [`blad kompilacji: ${e.message.split('\n')[0]}`];
    }
    report(red.length > 0, `mutant ${m.id} (${m.gate}) PRZESZEDL - zadne sprawdzenie nie czerwieni`);
    console.log(`mutant ${m.id} [${m.gate}]: czerwone = ${red.length ? red.join(' | ') : 'BRAK'}`);
  }

  for (const f of [ENTRY, BUNDLE]) { try { fs.unlinkSync(f); } catch (_) { /* ignore */ } }
  console.log(`diplo-weariness-unconditional-end-test: PASS=${pass} FAIL=${fail}`);
  return fail === 0 ? 0 : 1;
}

process.exit(run());
