'use strict';
/**
 * diplo-weariness-city-only-test.cjs -- R-WEB-DIPLO-WEARINESS-CITY-ONLY-Q1 (decyzja wlasciciela 2026-11-13).
 *
 * Zachowanie zmeczenia wojna (war-weariness.ts, runWarWearinessTick) po zmianach 1-4:
 *   (a)  przegrywajacy = strona SLABSZA wg SILY MILITARNEJ (weakerOf), nie wg Power;
 *   (a2) ta sama regula, gdy Power i sila militarna sie nie zgadzaja;
 *   (b)  oferta zmeczenia nie zawiera zlota ani surowcow (tylko miasta);
 *   (c)  brak pokoju bez zaplaty: bez miasta w ofercie nie ma pokoju (takze przy remisie sil, zmeczenie >= 0.8);
 *   (d)  przegrywajacy z JEDNYM miastem nie kupuje pokoju (oferta sie nie skladala);
 *   (e)  ochrona przegrywajacego: pokoj tylko z miastem; bez miasta do oddania ochrona nie daje pokoju;
 *   (f)  karencja po pokoju: 40 tur zwykly / 100 tur chroniony (z war-weariness-params.json);
 *   (g)  remis sil: slabsza strona (regula compareMilitaryStrength) placi miastem przy zmeczeniu.
 * Kazda bramka ma mutacje zrodla war-weariness.ts, ktora czerwieni co najmniej jeden test behawioralny.
 *
 *   node tools/diplo-weariness-city-only-test.cjs        # exit 0 = wszystko zielone i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = path.resolve(GRA_ROOT, 'src');
const WW = path.join(SRC, 'game', 'war-weariness.ts');
const PARAMS = path.join(GRA_ROOT, 'data', 'war-weariness-params.json');
const J = (p) => JSON.stringify(path.join(SRC, p));
const TAG = `${process.pid}`;
const ENTRY = path.resolve(__dirname, `.wcity-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.wcity-${TAG}-bundle.cjs`);
fs.writeFileSync(ENTRY, `export * as W from ${J('game/war-weariness')};\n`);

const ORIG = fs.readFileSync(WW, 'utf8');
const PJ = JSON.parse(fs.readFileSync(PARAMS, 'utf8'));

/**
 * Buduje modul war-weariness z podana trescia zrodla (mutanty). Zwraca eksporty W.
 * Tresc zapisywana jest jako plik obok oryginalu (wzgledne importy dzialaja), usuwany po buildzie.
 */
function loadW(src) {
  const MUT = path.join(path.dirname(WW), `.wcity-mut-${TAG}.ts`);
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

/** Scenariusz pary (1 vs 2). o.weaker = id slabszej strony wg sily militarnej (undefined = fallback po udziale). */
function mk(o) {
  const log = [];
  const deps = {
    store: o.store || new Map(), turn: o.turn, pairs: [{ a: 1, b: 2 }],
    pairKey: (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`,
    warInfo: () => ({
      warStart: o.warStart ?? (o.turn - o.turnsAtWar), turnsAtWar: o.turnsAtWar,
      lostA: o.lostA || 0, lostB: o.lostB || 0, turnsSinceCityChange: o.since ?? o.turnsAtWar,
    }),
    shareOf: (x) => (x === 1 ? o.share1 : 1 - o.share1),
    weakerOf: o.weaker !== undefined ? () => o.weaker : undefined,
    cityCountOf: (own) => (o.cityCount ? o.cityCount(own) : 6),
    price: () => ({ requiredPn: o.requiredPn ?? 500, balanceFor: (c) => c - (o.winnerNeed ?? 0), tolerancePn: 20 }),
    assets: () => o.assets ?? [],
    cityCessionOk: () => true,
    battlePending: false,
    pay: (l, w, plan) => log.push({ ev: 'pay', l, w, plan }),
    finalize: (l, w, lock) => log.push({ ev: 'peace', l, w, lock }),
  };
  return { deps, log };
}

/** Zestaw sprawdzen behawioralnych. Zwraca [{ name, ok }]. */
function behaviour(W) {
  const PP = W.WAR_WEARINESS_PARAMS.przegrywajacy;
  const res = [];
  const chk = (name, ok) => res.push({ name, ok: !!ok });

  // (a) przegrywajacy = slabsza wg sily militarnej
  {
    const { deps } = mk({ turn: 400, turnsAtWar: 150, share1: 0.15, weaker: 1, lostA: 3, assets: CITY_ASSETS });
    const r = W.runWarWearinessTick(deps)[0];
    chk('a: slabsza strona (sila militarna) skfrada oferte miast', r.action !== 'none');
  }
  // (a2) Power a sila militarna sie nie zgadzaja: slabsza wg sily = 1 (Power wskazuje 2); 2 ma 1 miasto -> nie oferuje
  {
    const { deps } = mk({ turn: 400, turnsAtWar: 150, share1: 0.9, weaker: 1, lostA: 3, cityCount: (o) => (o === 2 ? 1 : 6), assets: CITY_ASSETS });
    const r = W.runWarWearinessTick(deps)[0];
    chk('a2: regula wg sily militarnej, nie Power (slabsza 1 z 6 miastami oferuje)', r.action !== 'none');
  }
  // (b) brak zlota i surowcow w ofercie
  {
    const assets = [A('zloto', 'zloto', 100000, 100000), A('surowiec_ilosc', 'zelazo', 50, 50), A('miasto', 'c1', 1, 400), A('miasto', 'c2', 1, 800), A('miasto', 'cap', 1, 9999, true)];
    const { deps } = mk({ turn: 400, turnsAtWar: 150, share1: 0.15, weaker: 1, lostA: 3, assets });
    const r = W.runWarWearinessTick(deps)[0];
    chk('b: oferta bez zlota i surowcow (histogram zloto=0, surowiec=0)',
      r.action !== 'none' && r.plan && r.plan.histogram.zloto === 0 && r.plan.histogram.surowiec_ilosc === 0);
  }
  // (c) brak pokoju bez zaplaty: remis sil, zmeczenie >= 0.8, brak miast do oddania -> brak pokoju
  {
    const { deps, log } = mk({ turn: 300, turnsAtWar: 200, share1: 0.5, weaker: 2, winnerNeed: 0, assets: [] });
    const r = W.runWarWearinessTick(deps)[0];
    chk('c: remis sil + zmeczenie: bez miasta brak pokoju (oferta odrzucona, brak finalize)',
      r.action === 'offer_rejected' && !log.some((x) => x.ev === 'peace'));
  }
  // (d) przegrywajacy z JEDNYM miastem: brak oferty i brak pokoju
  {
    const { deps, log } = mk({ turn: 400, turnsAtWar: 150, share1: 0.15, weaker: 1, lostA: 3, cityCount: (o) => (o === 1 ? 1 : 6), assets: CITY_ASSETS });
    const r = W.runWarWearinessTick(deps)[0];
    chk('d: przegrywajacy z jednym miastem nie kupuje pokoju (action none, brak finalize)',
      r.action === 'none' && !log.some((x) => x.ev === 'peace' || x.ev === 'pay'));
  }
  // (e1) ochrona z miastem: chroniony (3 utraty) oddaje miasto -> pokoj, dluzsza karencja
  {
    const { deps, log } = mk({ turn: 160, turnsAtWar: 60, since: 3, share1: 0.1, weaker: 1, lostA: 3, cityCount: (o) => (o === 1 ? 5 : 6), winnerNeed: 0, assets: CITY_ASSETS });
    const r = W.runWarWearinessTick(deps)[0];
    const pe = log.find((x) => x.ev === 'peace');
    chk('e1: ochrona z miastem -> pokoj z miastem i karencja chronionego',
      r.action === 'offer_accepted' && r.plan.histogram.miasto >= 1 && pe && pe.lock === PP.karencjaChronionegoTur);
  }
  // (e2) ochrona bez miasta do oddania (3 miasta = minMiastPoOddaniu) -> brak pokoju mimo ochrony
  {
    const { deps, log } = mk({ turn: 140, turnsAtWar: 40, since: 5, share1: 0.2, weaker: 1, lostA: 1, cityCount: (o) => (o === 1 ? 3 : 6), winnerNeed: 0, assets: CITY_ASSETS });
    const r = W.runWarWearinessTick(deps)[0];
    chk('e2: chroniony bez miasta do oddania nie kupuje pokoju', r.action === 'offer_rejected' && !log.some((x) => x.ev === 'peace'));
  }
  // (f) karencja z war-weariness-params.json: zwykly 40, chroniony 100
  {
    const { deps, log } = mk({ turn: 130, turnsAtWar: 30, since: 10, share1: 0.2, weaker: 1, lostA: 1, cities: 6, winnerNeed: 300, assets: CITY_ASSETS });
    W.runWarWearinessTick(deps);
    const pe = log.find((x) => x.ev === 'peace');
    chk('f: zwykly pokoj -> karencja z JSON (40)',
      pe && pe.lock === PJ.przegrywajacy.karencjaPoPokojuTur && PJ.przegrywajacy.karencjaPoPokojuTur === 40);
    chk('f: karencja chronionego z JSON = 100', PJ.przegrywajacy.karencjaChronionegoTur === 100);
  }
  // (g) remis sil: slabsza strona (regula compareMilitaryStrength: wiekszy id) placi miastem przy zmeczeniu
  {
    const { deps } = mk({ turn: 330, turnsAtWar: 200, share1: 0.5, weaker: 2, lostB: 1, winnerNeed: 0, assets: CITY_ASSETS });
    const r = W.runWarWearinessTick(deps)[0];
    chk('g: remis sil - slabsza strona oferuje miasto (nie none)', r.action !== 'none');
  }
  // (h) okablowanie miary SILY MILITARNEJ (obrona r1): helpery czyste, sideOf = sila + armia (bez Power).
  {
    const mil = (sila, armiaPkt) => ({ sila, armiaPkt });
    chk('h1: udzial sily militarnej 300 vs 100 = 0,75; brak sily = 0,5',
      Math.abs(W.wearinessMilitaryShare(300, 100) - 0.75) < 1e-9 && W.wearinessMilitaryShare(0, 0) === 0.5);
    const sideA = (o) => (o === 1 ? mil(100, 10) : mil(300, 50));
    const sideB = (o) => (o === 1 ? mil(300, 50) : mil(100, 10));
    chk('h2: slabsza wg sily militarnej = 1 (sila 100 vs 300)', W.wearinessWeakerOf(1, 2, sideA) === 1);
    chk('h3: slabsza wg sily militarnej = 2 (odwrotne sily)', W.wearinessWeakerOf(1, 2, sideB) === 2);
    const wir = W.militaryWearinessWiring(sideA);
    chk('h4: okablowanie: shareOf(1,2)=0,25 i weakerOf(1,2)=1 z sideOf',
      Math.abs(wir.shareOf(1, 2) - 0.25) < 1e-9 && wir.weakerOf(1, 2) === 1);
    chk('h5: udzial AI w desperacji = udzial sily (300/(300+100)); bez danych = fallback rw',
      Math.abs(W.wearyMilitaryShare(mil(300, 0), mil(100, 0), 0.9) - 0.75) < 1e-9
      && W.wearyMilitaryShare(undefined, mil(100, 0), 0.4) === 0.4
      && W.wearyMilitaryShare(mil(0, 0), mil(0, 0), 0.3) === 0.3);
  }
  return res;
}

/** Mutacje okablowania main.ts / ai.ts: test statyczny (wiring nie ma czystej funkcji w tym module). */
const WIRING_MAIN = '...militaryWearinessWiring(diploMilitarySideOf),';
const WIRING_AI = 'wearyMilitaryShare(rel.silaMilitarnaAI, rel.silaMilitarnaPartner, rw)';
function wiringOk(mainSrc, aiSrc) {
  const cnt = (s, t) => s.split(t).length - 1;
  return cnt(mainSrc, WIRING_MAIN) === 1 && cnt(aiSrc, WIRING_AI) === 1;
}

/** Mutacje zrodla war-weariness.ts: kazda musi czerwienic co najmniej jeden test behawioralny. */
const MUTANTS = [
  { id: 'M1-ignoruj-silna-regule', from: 'const loser = d.weakerOf ? d.weakerOf(pr.a, pr.b) : (shareA <= 0.5 ? pr.a : pr.b);',
    to: 'const loser = (shareA <= 0.5 ? pr.a : pr.b);', gate: 'slabsza wg sily militarnej (a2)' },
  { id: 'M2-zloto-w-puli-miast', from: "const pool = assets.filter(a => a.kind === 'miasto' && !a.forbidden && a.pn > 0)",
    to: "const pool = assets.filter(a => (a.kind === 'miasto' || a.kind === 'zloto') && !a.forbidden && a.pn > 0)", gate: 'brak zlota w ofertach (b)' },
  { id: 'M3-bez-guardu-jednego-miasta', from: 'if (ownCities <= 1) { none(); continue; }', to: '/* usunieto guard */',
    gate: 'jedno miasto => brak pokoju (d)' },
  { id: 'M4-bez-wymogu-miasta', from: 'const cityGiven = plan.histogram.miasto > 0;', to: 'const cityGiven = true;',
    gate: 'pokoj tylko z miastem (c, e2)' },
  { id: 'M5-karencja-bez-ochrony', from: 'd.finalize(loser, winner, protectedLoser ? L.karencjaChronionegoTur : L.karencjaPoPokojuTur);',
    to: 'd.finalize(loser, winner, L.karencjaPoPokojuTur);', gate: 'karencja 40/100 (e1, f)' },
  { id: 'M6-remis-bez-klampu', from: 'const shareForDespair = Math.min(loserShare, L.udzialWyraznie);', to: 'const shareForDespair = loserShare;',
    gate: 'remis sil: slabsza placi miastem (g)' },
  { id: 'M7-udzial-stala', from: 'return silaX + silaY > 0 ? silaX / (silaX + silaY) : 0.5;', to: 'return 0.5;',
    gate: 'udzial sily militarnej (h1, h4)' },
  { id: 'M8-slabsza-odwrotnie', from: "return peaceStanceOf(self, partner) === 'slabsza' ? x : y;",
    to: "return peaceStanceOf(partner, self) === 'slabsza' ? x : y;", gate: 'slabsza wg sily militarnej (h2, h3)' },
  { id: 'M9-desperacja-rw', from: 'return sum > 0 && own ? own.sila / sum : fallbackRw;', to: 'return fallbackRw;',
    gate: 'desperacja AI wg sily militarnej (h5)' },
  { id: 'M10-okablowanie-stala', from: 'shareOf: (x, y) => wearinessMilitaryShare(sideOf(x, y).sila, sideOf(y, x).sila),',
    to: 'shareOf: (x, y) => 0.5,', gate: 'okablowanie shareOf (h4)' },
];

/** Mutanty okablowania (main.ts / ai.ts): czerwienia test statyczny wiringOk. */
const WIRING_MUTANTS = [
  { id: 'W1-main-power', file: 'main', from: WIRING_MAIN, to: 'shareOf: (x, y) => requesterShare(objectivePowerForOwner(x), objectivePowerForOwner(y)),' },
  { id: 'W2-ai-rw', file: 'ai', from: WIRING_AI, to: 'rw' },
];

function run() {
  let pass = 0;
  let fail = 0;
  const report = (ok, msg) => { if (ok) pass++; else { fail++; console.error('FAIL:', msg); } };

  const base = behaviour(loadW(ORIG));
  for (const c of base) report(c.ok, `behawior bazowy: ${c.name}`);
  console.log(`baza: ${base.filter((c) => c.ok).length}/${base.length} sprawdzen behawioralnych zielonych`);

  const MAIN_SRC = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  const AI_SRC = fs.readFileSync(path.join(SRC, 'game', 'ai.ts'), 'utf8');
  report(wiringOk(MAIN_SRC, AI_SRC), 'okablowanie main.ts/ai.ts: brak wywolania militaryWearinessWiring / wearyMilitaryShare');
  for (const w of WIRING_MUTANTS) {
    const src = w.file === 'main' ? MAIN_SRC : AI_SRC;
    const hits = src.split(w.from).length - 1;
    if (hits !== 1) { report(false, `mutant ${w.id}: fragment nie wystapil dokladnie raz (${hits})`); continue; }
    const mutated = src.replace(w.from, w.to);
    const ok = w.file === 'main' ? wiringOk(mutated, AI_SRC) : wiringOk(MAIN_SRC, mutated);
    report(!ok, `mutant ${w.id} (okablowanie) PRZESZEDL - test statyczny go nie wykrywa`);
    console.log(`mutant ${w.id} [okablowanie ${w.file}]: wykryty = ${!ok}`);
  }

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
    report(red.length > 0, `mutant ${m.id} (${m.gate}) PRZESZEDL - zadna sprawdzenie nie czerwieni`);
    console.log(`mutant ${m.id} [${m.gate}]: czerwone = ${red.length ? red.join(' | ') : 'BRAK'}`);
  }

  for (const f of [ENTRY, BUNDLE]) { try { fs.unlinkSync(f); } catch (_) { /* ignore */ } }
  console.log(`diplo-weariness-city-only-test: PASS=${pass} FAIL=${fail}`);
  return fail === 0 ? 0 : 1;
}

process.exit(run());
