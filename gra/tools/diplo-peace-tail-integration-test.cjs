'use strict';
/**
 * diplo-peace-tail-integration-test.cjs -- R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1 (runda 3).
 * Ogon ceny pokoju (złoto → brąz → żelazo → rudy) na WSZYSTKICH ścieżkach, każdy punkt wykonuje prawdziwy kod
 * (bundle esbuild z src/, bez wzorców po źródle):
 *   A  ścieżka AI→gracz (decideAIDiplomacy + aiPlanOddaniaZOgonem + aiCommandToPendingProposal)
 *   B  AI↔AI: runAiAiPeaceTick z tailPlan = peacePlanWithTail (zapasy płatnika maleją, odbiorcy rosną, nigdy < 0)
 *   C  AI↔AI: runWarWearinessTick (eskalowana oferta) z tailPlan
 *   D  gracz: evaluateProposal — kompozytor ogona (słabszy gracz / silniejsza AI), płatnik != proponent
 *   E  tooltip „Dopłata: X złota, Y rudy żelaza" (peaceTailRowHtml)
 *   F  okablowanie zapasów: peaceTailHoldings + realny transferSurowiecIlosc (Spichlerz państwa = suma c.surowce)
 *   W  peaceTailPricingForPayer (funkcja składająca zapasy/epokę płatnika z getterów gry; main.ts tylko przekazuje getter)
 *   M  mutacje na KOPII źródeł (kolejność, stolica, brak ogona w tiku) → muszą czerwienić
 *
 *   node tools/diplo-peace-tail-integration-test.cjs     # exit 0 = wszystko zielone i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const SRC = path.resolve(GRA, 'src');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail).slice(0, 500) : '')); }
}

const ENTRY = [
  "export { decideAIDiplomacy, aiPlanOddaniaZOgonem } from './game/ai';",
  "export { aiCommandToPendingProposal, evaluateProposal, createNegotiation, negotiationAsProposal } from './game/diplomacy-proposals';",
  "export { runAiAiPeaceTick, registerAiPeaceRequest } from './game/diplomacy-ai-forced-peace';",
  "export { runWarWearinessTick } from './game/war-weariness';",
  "export * from './game/peace-tail-payment';",
  "export { peaceTailRowHtml } from './ui/diplomacyAcceptanceBalance';",
  "export { transferSurowiecIlosc } from './game/diplomacy-basket-transfer';",
  "export { ownerResourceStock } from './game/building-stock-cost';",
  '',
].join('\n');

/** Buduje moduł z wejścia w pamięci; `overrides` = { 'src/game/x.ts': nowaTreść } (mutanty — plugin onLoad, bez zapisu plików). */
function load(overrides) {
  const plugin = {
    name: 'override',
    setup(b) {
      b.onLoad({ filter: /\.ts$/ }, args => {
        const rel = path.relative(GRA, args.path).split(path.sep).join('/');
        if (overrides && overrides[rel] != null) return { contents: overrides[rel], loader: 'ts', resolveDir: path.dirname(args.path) };
        return undefined;
      });
    },
  };
  return esbuild.build({
    stdin: { contents: ENTRY, resolveDir: SRC, sourcefile: 'tail-int-entry.ts', loader: 'ts' },
    bundle: true, format: 'cjs', platform: 'node', write: false, logLevel: 'silent',
    loader: { '.json': 'json' }, plugins: [plugin],
  }).then(r => {
    const m = { exports: {} };
    new Function('module', 'exports', 'require', r.outputFiles[0].text)(m, m.exports, require);
    return m.exports;
  });
}

const PRICES = { zloto: 1, braz: 5, zelazo: 4, ruda: 2, ruda_cyny: 2, ruda_zelaza: 2 };
const pnPerUnit = k => PRICES[k];
const A = (kind, id, amount, pn, forbidden) => ({ kind, id, amount, pn, forbidden });

/** Sekcje testu dla danego zestawu eksportów (żywych albo mutanta). Zwraca listę {name, ok, detail}. */
function suite(M) {
  const out = [];
  const t = (name, fn) => {
    try { const r = fn(); out.push({ name, ok: r === true, detail: r === true ? '' : r }); }
    catch (e) { out.push({ name, ok: false, detail: String(e && e.stack || e) }); }
  };

  // ---------------- A: AI -> gracz ----------------
  const ai = (turns, miasta, ogon, extra) => M.decideAIDiplomacy({
    myPlayerId: '1', agresja: 0.5, currentTurn: 80, skarbiecGold: 0, miastaAI: miasta, ogonPokoju: ogon,
    relacje: [Object.assign({
      partnerId: '0', relation: { zaufanie: 0, respekt: 29, status: 'wojna' }, respektWzgledny: 0.06,
      stanWojny: true, turnsAtWar: turns, lostCitiesInWar: 0, turnsSinceCityChange: turns, armyHealthShare: 0.9, peaceLocked: false,
      silaMilitarnaAI: { sila: 100, armiaPkt: 0 }, silaMilitarnaPartner: { sila: 200, armiaPkt: 0 },
      mocAI: 100, mocPartner: 300,
    }, extra || {})],
  }).filter(c => c.targetId === '0');
  const miasta = (n, pn) => Array.from({ length: n }, (_, i) => ({ cityId: 'c' + i, cityPn: pn, zakazane: false }));
  const stockOgon = (holdings, stepOf) => ({ holdings, pnPerUnit, stepOf, order: undefined });

  t('A1 AI słabsze: 6 miast po 800 (×1,5 = 1200 → 7200 < D = 8000) bez zapasów → brak oferty (jak dziś)', () => {
    const c = ai(20, miasta(6, 800), undefined);
    return !c.some(x => x.type === 'oferuj_miasto_za_pokoj') ? true : c;
  });
  t('A2 te same miasta + zapasy złota → oferta POKOJU: miasta najpierw, reszta (800) ogonem złotem', () => {
    const c = ai(20, miasta(6, 800), stockOgon({ zloto: 100000 }));
    const o = c.find(x => x.type === 'oferuj_miasto_za_pokoj');
    if (!o || o.rodzaj !== 'pokoj') return c;
    const cityPn = (1 + (o.dodatkoweMiasta || []).length) * 1200;
    const tailPn = (o.ogon || []).reduce((s, i) => s + i.pn, 0);
    return cityPn === 7200 && o.ogon.length === 1 && o.ogon[0].key === 'zloto' && tailPn === 800 && cityPn + tailPn >= 8000 ? true : { cityPn, tailPn, ogon: o.ogon };
  });
  t('A3 AI nie płaci metalami przed miastami: miasta pokrywają cenę → ogon pusty mimo zapasów', () => {
    const c = ai(20, miasta(6, 5000), stockOgon({ zloto: 100000, braz: 1000 }));
    const o = c.find(x => x.type === 'oferuj_miasto_za_pokoj');
    return o && !(o.ogon && o.ogon.length) ? true : c;
  });
  t('A4 AI bez miast do oddania (tylko stolica zakazana) + zapasy → oferta samym ogonem (cityId pusty), cena pokryta', () => {
    const c = ai(20, [{ cityId: 'cap', cityPn: 90000, zakazane: true }], stockOgon({ zloto: 50000 }));
    const o = c.find(x => x.type === 'oferuj_miasto_za_pokoj');
    if (!o || o.cityId !== '') return c;
    const tailPn = o.ogon.reduce((s, i) => s + i.pn, 0);
    return tailPn >= 8000 && o.ogon[0].key === 'zloto' ? true : o;
  });
  t('A5 stolica + zapasy niewystarczające (złoto 100) → brak oferty (pokój nie zapada przez ogon)', () => {
    const c = ai(20, [{ cityId: 'cap', cityPn: 90000, zakazane: true }], stockOgon({ zloto: 100 }));
    return !c.some(x => x.type === 'oferuj_miasto_za_pokoj') ? true : c;
  });
  t('A6 kolejność z danych: złoto wyczerpane (500) → dalej brąz → żelazo (nie rudy, gdy żelazo wystarcza)', () => {
    const r = M.aiPlanOddaniaZOgonem([{ cityId: 'cap', cityPn: 1, zakazane: true }], 3, 8000,
      { holdings: { zloto: 500, braz: 200, zelazo: 5000, ruda: 5000 }, pnPerUnit });
    return r.full && r.ogon.map(i => i.key).join() === 'zloto,braz,zelazo' ? true : r;
  });
  t('A7 rozejm (14 tur): ogon NIE jest używany (rozejm bez złota/surowców) — same małe miasta nie wystarczają → brak oferty', () => {
    const c = ai(14, miasta(2, 800), stockOgon({ zloto: 100000 }));
    return !c.some(x => x.type === 'oferuj_miasto_za_pokoj') ? true : c;
  });
  t('A8 oferta AI → propozycja stołu: giveItems = miasta + złoto/surowce (bez pozycji miasta przy cityId pustym)', () => {
    const c = ai(20, [{ cityId: 'cap', cityPn: 90000, zakazane: true }], stockOgon({ zloto: 50000 }));
    const o = c.find(x => x.type === 'oferuj_miasto_za_pokoj');
    const p = M.aiCommandToPendingProposal(o, 1, 0, 80);
    const g = p && p.payload && p.payload.giveItems;
    return p && p.actionId === 'pokoj' && Array.isArray(g) && g.length === 1 && g[0].typ === 'zloto' && g[0].ilosc >= 8000
      && !g.some(i => i.typ === 'miasto') ? true : p;
  });
  t('A9 oferta AI miasta + ogon → giveItems: miasta, potem zloto', () => {
    const c = ai(20, miasta(6, 800), stockOgon({ zloto: 100000 }));
    const o = c.find(x => x.type === 'oferuj_miasto_za_pokoj');
    const g = M.aiCommandToPendingProposal(o, 1, 0, 80).payload.giveItems;
    const types = g.map(i => i.typ);
    return types.filter(x => x === 'miasto').length === 6 && types[types.length - 1] === 'zloto' ? true : types;
  });

  // ---------------- B: AI <-> AI (runAiAiPeaceTick) ----------------
  const tick = (o) => {
    const stock = { 1: Object.assign({}, o.loserStock), 2: Object.assign({}, o.winnerStock || {}) };
    const log = [];
    const store = new Map();
    M.registerAiPeaceRequest(store, '1-2', 1, 2, 10, o.kind || 'pokoj');
    const calls = { tailPlan: 0 };
    const deps = {
      store, turn: 12, pairEligible: () => true, requesterShareOf: () => 0.3, gateVerdict: () => 'ok',
      price: () => ({ requiredPn: o.required, balanceFor: () => 0, tolerancePn: 0 }),
      assets: () => o.assets,
      cityCessionOk: () => true, battlePending: false,
      pay: (loser, winner, plan) => {
        log.push({ ev: 'pay', plan });
        for (const it of plan.items) {
          if (it.kind === 'miasto') continue;
          stock[loser][it.id] = (stock[loser][it.id] || 0) - it.amount;
          stock[winner][it.id] = (stock[winner][it.id] || 0) + it.amount;
        }
      },
      finalize: (l, w, kind) => log.push({ ev: 'peace', kind }),
    };
    if (o.useTail !== false) {
      deps.tailPlan = (req, cityAssets, maxC, loser) => {
        calls.tailPlan++;
        return M.peacePlanWithTail({
          holdings: stock[loser], pnPerUnit, stepOf: k => (k === 'braz' ? 5 : 1), duePn: req, cities: cityAssets, maxCities: maxC,
        });
      };
    }
    const r = M.runAiAiPeaceTick(deps);
    return { r, log, stock, calls };
  };
  const capital = A('miasto', 'cap', 1, 9999, true);
  t('B1 przegrany ma tylko stolicę + zapasy → pokój za ogon; zapasy płatnika maleją, odbiorcy rosną, nigdy < 0', () => {
    const x = tick({ required: 3000, assets: [capital], loserStock: { zloto: 5000 } });
    const ok = (x.r[0].action === 'accept_paid' || x.r[0].action === 'force') && x.log.some(l => l.ev === 'peace')
      && x.stock[1].zloto === 2000 && x.stock[2].zloto === 3000;
    return ok ? true : { r: x.r[0].action, stock: x.stock, log: x.log.map(l => l.ev) };
  });
  t('B2 miasta najpierw, ogon tylko na resztę (miasto 1000 + złoto 2000)', () => {
    const x = tick({ required: 3000, assets: [capital, A('miasto', 'c1', 1, 1000)], loserStock: { zloto: 5000 } });
    const pay = x.log.find(l => l.ev === 'pay');
    const hist = pay && pay.plan.histogram;
    return (x.r[0].action === 'accept_paid' || x.r[0].action === 'force') && hist.miasto === 1 && hist.zloto === 1 && x.stock[1].zloto === 3000 ? true : { hist, stock: x.stock };
  });
  t('B3 zapasów brak → wait: bez pay, bez finalize, zapasy nietknięte (pokój nie zapada przez ogon)', () => {
    const x = tick({ required: 3000, assets: [capital], loserStock: { zloto: 100 } });
    return x.r[0].action === 'wait' && !x.log.length && x.stock[1].zloto === 100 ? true : { a: x.r[0].action, log: x.log };
  });
  t('B4 kolejność złoto → brąz (krok 5): złoto 1000, brąz 100 szt. (5 PN/szt.) → 1000 + 400 szt. ... nigdy ponad zapas', () => {
    const x = tick({ required: 1500, assets: [capital], loserStock: { zloto: 1000, braz: 100 } });
    const neg = Object.values(x.stock[1]).some(v => v < 0);
    return (x.r[0].action === 'accept_paid' || x.r[0].action === 'force') && x.stock[1].zloto === 0 && x.stock[1].braz === 100 - 100 && !neg
      && x.stock[2].braz === 100 ? true : { stock: x.stock };
  });
  t('B5 bez tailPlan (stara ścieżka) przy samej stolicy → wait (kontrola: to tailPlan włącza płatność ogonem)', () => {
    const x = tick({ required: 3000, assets: [capital], loserStock: { zloto: 5000 }, useTail: false });
    return x.r[0].action === 'wait' ? true : x.r[0];
  });
  t('B6 rozejm nie używa tailPlan', () => {
    const x = tick({ required: 3000, assets: [capital, A('zloto', 'zloto', 5000, 5000)], loserStock: { zloto: 5000 }, kind: 'rozejm' });
    return x.calls.tailPlan === 0 ? true : x.calls;
  });

  // ---------------- C: AI <-> AI (runWarWearinessTick, eskalowana oferta) ----------------
  const weary = (o) => {
    const stock = { 1: Object.assign({}, o.loserStock), 2: {} };
    const log = [];
    const deps = {
      store: new Map(), turn: 400, pairs: [{ a: 1, b: 2 }],
      pairKey: (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`,
      warInfo: () => ({ warStart: 380, turnsAtWar: 20, lostA: 1, lostB: 0, turnsSinceCityChange: 20 }),
      shareOf: x => (x === 1 ? 0.15 : 0.85), weakerOf: () => 1,
      cityCountOf: own => (own === 1 ? (o.ownCities ?? 6) : 6),
      price: () => ({ requiredPn: o.required, balanceFor: c => c, tolerancePn: 20 }),
      assets: () => o.assets, cityCessionOk: () => true, battlePending: false,
      pay: (l, w, plan) => {
        log.push({ ev: 'pay', plan });
        for (const it of plan.items) if (it.kind !== 'miasto') { stock[l][it.id] = (stock[l][it.id] || 0) - it.amount; stock[w][it.id] = (stock[w][it.id] || 0) + it.amount; }
      },
      finalize: (l, w, lock) => log.push({ ev: 'peace', lock }),
    };
    if (o.useTail !== false) {
      deps.tailPlan = (req, cityAssets, maxC, loser) => M.peacePlanWithTail({
        holdings: stock[loser], pnPerUnit, duePn: req, cities: cityAssets, maxCities: maxC,
      });
    }
    return { r: M.runWarWearinessTick(deps), log, stock };
  };
  t('C1 eskalowana oferta: przegrywający ma tylko stolicę + złoto → pokój za ogon (offer_accepted), zapasy zdjęte', () => {
    const x = weary({ required: 2000, assets: [capital, A('miasto', 'c1', 1, 400)], loserStock: { zloto: 5000 } });
    const hist = x.log.find(l => l.ev === 'pay') && x.log.find(l => l.ev === 'pay').plan.histogram;
    return x.r[0].action === 'offer_accepted' && hist.miasto === 1 && hist.zloto === 1 && x.stock[1].zloto === 5000 - 1600 && x.stock[2].zloto === 1600 ? true : { a: x.r[0].action, hist, stock: x.stock };
  });
  t('C2 ta sama oferta bez tailPlan → odrzucona (cena > 0 bez pełnego pokrycia miastami) — jak dotąd', () => {
    const x = weary({ required: 2000, assets: [capital, A('miasto', 'c1', 1, 400)], loserStock: { zloto: 5000 }, useTail: false });
    return x.r[0].action === 'offer_rejected' ? true : x.r[0].action;
  });
  t('C3 jedno miasto (stolica) + ogon: oferta składa się (z tailPlan), bez tailPlan action none', () => {
    const w = weary({ required: 2000, assets: [capital], loserStock: { zloto: 5000 }, ownCities: 1 });
    const n = weary({ required: 2000, assets: [capital], loserStock: { zloto: 5000 }, ownCities: 1, useTail: false });
    return w.r[0].action === 'offer_accepted' && n.r[0].action === 'none' ? true : { w: w.r[0].action, n: n.r[0].action };
  });

  // ---------------- D: gracz (evaluateProposal) ----------------
  const WOJNA = { zaufanie: 5, respekt: 5, status: 'wojna' };
  const ctx = (o) => ({
    relation: WOJNA, stanWojny: true, turn: 80, proposerRespekt: 60, responderRespekt: 60,
    militaryRatio: 1, respektWzgledny: 0.5, karaWspolnaGranica: false, difficulty: 'normal',
    responderPlayer: { ownerId: 1, typCywilizacji: 'rzymianie' }, proposerPlayer: { ownerId: 0, typCywilizacji: 'rzymianie' },
    authorOwnerId: 0, payerStock: o.payerStock, playerStock: o.playerStock,
    warState: { turnsAtWar: 12, lostCitiesResponder: 0, responderRw: 0.5, responderPozycjaMilitarna: o.pozycja,
      powerPlayer: o.powerPlayer, powerOther: o.powerOther },
  });
  const evalP = (payload, o) => {
    const entry = M.createNegotiation({ actionId: 'pokoj', proposerOwnerId: 0, responderOwnerId: 1, payload }, 80, 'player', 12);
    return M.evaluateProposal(M.negotiationAsProposal(entry), ctx(o));
  };
  const BIG = 1e9;
  const city10 = { giveItems: [{ typ: 'miasto', id: 'x', ilosc: 1, cityPn: 10, cityWeight: 1 }] };
  t('D1 słabszy gracz (Power 100 vs 300), stół z małym miastem, zapasy gracza → kompozytor domyka resztę D ogonem (accepted + applied)', () => {
    const r = evalP(city10, { pozycja: 'slabsza', powerPlayer: 100, powerOther: 300, playerStock: { zloto: BIG } });
    return r.accepted === true && r.peaceTail && r.peaceTail.applied && r.peaceTail.items[0].key === 'zloto' ? true : r;
  });
  t('D2 ten sam stół bez zapasów gracza → „Brakuje N PW” (blokada jak dziś), tooltip bez ogona', () => {
    const r = evalP(city10, { pozycja: 'slabsza', powerPlayer: 100, powerOther: 300, playerStock: { zloto: 0 } });
    return r.accepted === false && /Brakuje/.test(r.reason) && !(r.peaceTail && r.peaceTail.applied) ? true : r;
  });
  t('D3 płatnik = gracz, nie proponent: payerStock (proponenta) pusty, playerStock pełny → ogon składa się z zapasów GRACZA', () => {
    const r = evalP(city10, { pozycja: 'slabsza', powerPlayer: 100, powerOther: 300, payerStock: { zloto: 0 }, playerStock: { zloto: BIG } });
    return r.accepted === true && r.peaceTail && r.peaceTail.applied ? true : r;
  });
  t('D4 częściowy zapas: złoto 500 + żelazo, brąz brak → kolejność złoto → (brąz pomijany: brak zapasu) → żelazo; nigdy ponad zapas', () => {
    const r = evalP(city10, { pozycja: 'slabsza', powerPlayer: 100, powerOther: 300, playerStock: { zloto: 500, braz: 0, zelazo: 1e7 } });
    const keys = r.peaceTail && r.peaceTail.items.map(i => i.key).join();
    const gold = r.peaceTail && r.peaceTail.items.find(i => i.key === 'zloto');
    return keys === 'zloto,zelazo' && gold.qty === 500 ? true : r.peaceTail;
  });
  t('D5 silniejszy gracz (Power 300 vs 100) nie dostaje ogona ani blokady', () => {
    const r = evalP(city10, { pozycja: 'slabsza', powerPlayer: 300, powerOther: 100, playerStock: { zloto: BIG } });
    return r.accepted === true && !(r.peaceTail && r.peaceTail.applied) ? true : r;
  });
  t('D6 rozejm nie dostaje ogona (kompozytor tylko dla pokoju)', () => {
    const entry = M.createNegotiation({ actionId: 'rozejm', proposerOwnerId: 0, responderOwnerId: 1, payload: { turns: 10, giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 5 }] } }, 80, 'player', 12);
    const r = M.evaluateProposal(M.negotiationAsProposal(entry), ctx({ pozycja: 'silniejsza', playerStock: { zloto: BIG }, payerStock: { zloto: BIG } }));
    return r.accepted === false && !r.peaceTail ? true : r;
  });

  t('D7 silniejsza AI (bramka r5Gate): płatnik = gracz (playerStock), proponent bez zapasu → ogon zastępuje brakujące miasto', () => {
    const r = evalP(city10, { pozycja: 'silniejsza', payerStock: { zloto: 0 }, playerStock: { zloto: BIG } });
    const r0 = evalP(city10, { pozycja: 'silniejsza', payerStock: { zloto: 0 }, playerStock: { zloto: 0 } });
    return r.accepted === true && r.peaceTail && r.peaceTail.applied && r0.accepted === false ? true : { r, r0 };
  });

  // ---------------- E: tooltip ----------------
  t('E1 tooltip „Dopłata: X złota, Y rudy żelaza” z wyliczeniem (kolejność, reszta, pokrycie) w atrybucie title', () => {
    const tail = [{ key: 'zloto', qty: 500, pn: 500 }, { key: 'ruda_zelaza', qty: 40, pn: 80 }];
    const html = M.peaceTailRowHtml({ peaceTail: { items: tail, restPn: 580, coveredPn: 580, shortfallPn: 0, applied: true, label: M.peaceTailLabel(tail) } });
    return /title="[^"]*Dopłata: 500 złota, 40 rudy żelaza/.test(html) && /kolejność: złoto, brąz, żelazo, rudy/.test(html) && M.peaceTailRowHtml({}) === '' ? true : html;
  });
  t('E2 evaluateProposal → UI: wearinessInfo.peaceTail z wyniku renderuje się w tooltipie', () => {
    const r = evalP(city10, { pozycja: 'slabsza', powerPlayer: 100, powerOther: 300, playerStock: { zloto: BIG } });
    const html = M.peaceTailRowHtml(r.wearinessInfo);
    return /Dopłata: \d+ złota/.test(html) ? true : html;
  });

  // ---------------- F: zapasy (Spichlerz państwa = suma c.surowce) ----------------
  t('F1 peaceTailHoldings: złoto ze Skarbca, reszta ze Spichlerza; floor, nigdy < 0', () => {
    const h = M.peaceTailHoldings(250.9, k => ({ braz: 7.4, zelazo: -3, ruda: NaN }[k] ?? 0));
    return h.zloto === 250 && h.braz === 7 && h.zelazo === 0 && h.ruda === 0 && Object.keys(h).join() === M.PEACE_TAIL_ORDER.join() ? true : h;
  });
  t('F2 Spichlerz państwa = suma c.surowce miast właściciela: stan z ownerResourceStock == stan, z którego transferSurowiecIlosc zdejmuje towar', () => {
    const cities = [
      { id: 'a', ownerId: 1, surowce: { braz: 30 } }, { id: 'b', ownerId: 1, surowce: { braz: 20, zelazo: 5 } },
      { id: 'cap2', ownerId: 2, surowce: {} },
    ];
    const before = M.ownerResourceStock(cities, 1, 'braz');
    const res = M.transferSurowiecIlosc('braz', 35, 1, 2, 'cap2', cities.map(c => ({ ...c, surowce: { ...c.surowce } })));
    const after1 = M.ownerResourceStock(res.cities, 1, 'braz');
    const after2 = M.ownerResourceStock(res.cities, 2, 'braz');
    return before === 50 && res.moved === 35 && after1 === 15 && after2 === 35 ? true : { before, moved: res.moved, after1, after2 };
  });
  t('F3 płatnik = strona płacąca: peacePayerOwner (autor daje → autor; autor żąda → druga strona)', () => {
    return M.peacePayerOwner(0, 1, true) === 0 && M.peacePayerOwner(0, 1, false) === 1 ? true : 'x';
  });
  t('F4 krok bloku: ilości metali zaokrąglane do kroku (peaceTailStep), zapas ucinany do pełnych bloków', () => {
    const st = M.peaceTailStep('braz', 3);
    const r = M.composePeaceTail(100, { holdings: { braz: 47 }, pnPerUnit, stepOf: () => 5, order: ['braz'] });
    return st >= 1 && r.tail[0].qty % 5 === 0 && r.tail[0].qty <= 47 ? true : { st, r };
  });
  // ---------------- W: okablowanie zapasów płatnika (r4, zarzut Evaluatora 1: funkcja składa zapasy z getterów gry) ----------------
  const wiring = (log) => ({
    treasuryOf: id => { log.push(['treasury', id]); return id === 7 ? 321.9 : 1e9; },
    stockOf: (id, k) => { log.push(['stock', id, k]); return id === 7 ? ({ braz: 12.5, zelazo: 4, ruda: 9 }[k] ?? 0) : 1e9; },
    eraOf: (a, b) => { log.push(['era', a, b]); return 2; },
  });
  t('W1 peaceTailPricingForPayer: zapasy i epoka czytane WYŁĄCZNIE dla płatnika (id 7), nigdy dla partnera', () => {
    const log = [];
    const p = M.peaceTailPricingForPayer(7, 9, wiring(log));
    const onlyPayer = log.every(e => e[0] === 'era' ? e[1] === 7 && e[2] === 9 : e[1] === 7);
    return onlyPayer && p.holdings.zloto === 321 && p.holdings.braz === 12 && p.holdings.zelazo === 4 && p.holdings.ruda === 9
      ? true : { log, holdings: p.holdings };
  });
  t('W2 peaceTailPricingForPayer: pnPerUnit/stepOf używają epoki z eraOf(płatnik, partner)', () => {
    const log = [];
    const p = M.peaceTailPricingForPayer(7, 9, wiring(log));
    const ok = p.pnPerUnit('braz') === M.peaceTailPnPerUnit('braz', 2) && p.stepOf('braz') === M.peaceTailStep('braz', 2)
      && log.some(e => e[0] === 'era' && e[1] === 7 && e[2] === 9);
    return ok ? true : { pn: p.pnPerUnit('braz') };
  });
  t('W3 peaceTailPricingForPayer: pusty stan płatnika → zapasy 0, nigdy < 0 (getter ujemny/NaN)', () => {
    const deps = { treasuryOf: () => -50, stockOf: () => NaN, eraOf: () => 1 };
    const p = M.peaceTailPricingForPayer(1, 2, deps);
    return Object.values(p.holdings).every(v => v === 0) ? true : p.holdings;
  });
  return out;
}

(async () => {
  let exitCode = 0;
  const live = await load(null);
  const res = suite(live);
  for (const r of res) check(r.name, r.ok, r.detail);
  if (res.some(r => !r.ok)) exitCode = 1;

  // ---- Mutacje na kopii źródeł (bez zapisu plików) ----
  const rd = rel => fs.readFileSync(path.join(GRA, rel), 'utf8');
  const sub = (src, from, to) => { if (!src.includes(from)) return null; return src.replace(from, to); };
  const PT = 'src/game/peace-tail-payment.ts';
  const FP = 'src/game/diplomacy-ai-forced-peace.ts';
  const AIF = 'src/game/ai.ts';
  const WW = 'src/game/war-weariness.ts';
  const DP = 'src/game/diplomacy-proposals.ts';
  const mutants = [
    ['M1 odwrócona kolejność ogona', { [PT]: sub(rd(PT), 'const order = pricing.order ?? PEACE_TAIL_ORDER;', 'const order = [...(pricing.order ?? PEACE_TAIL_ORDER)].reverse();') }],
    ['M2 stolica płaci (forbidden ignorowane w settlePeaceDue)', { [PT]: sub(rd(PT), 'planCityPeacePayment(need, input.cities, input.maxCities ?? Number.POSITIVE_INFINITY)', 'planCityPeacePayment(need, input.cities.map(c => ({ ...c, forbidden: false })), input.maxCities ?? Number.POSITIVE_INFINITY)') }],
    ['M3 AI↔AI: runAiAiPeaceTick ignoruje tailPlan', { [FP]: sub(rd(FP), "if (kind === 'pokoj' && d.tailPlan) return", "if (false as boolean) return") }],
    ['M4 AI→gracz: aiPlanOddaniaZOgonem ignoruje ogon', { [AIF]: sub(rd(AIF), 'if (!ogon) return { ...aiPlanMiastaDoOddania', 'if (true as boolean) return { ...aiPlanMiastaDoOddania') }],
    ['M5 wearyTick ignoruje tailPlan', { [WW]: sub(rd(WW), 'const planFor = (): PeacePaymentPlan => d.tailPlan', 'const planFor = (): PeacePaymentPlan => (false as boolean) && d.tailPlan') }],
    ['M6 kompozytor gracza: ignoruje playerStock (płatnik = proponent)', { [DP]: sub(rd(DP), 'ctx.playerStock ?? ctx.payerStock, nonCityItems', 'ctx.payerStock, nonCityItems') }],
    ['M7 kompozytor gracza (słabszy): ignoruje zapasy ponad stan (brak ucięcia do zapasu)', { [PT]: sub(rd(PT), 'const qty = Math.min(have, unitsNeeded);', 'const qty = unitsNeeded;') }],
    ['M8 okablowanie: zapasy płatnika czytane z partnera (zamiana stron)', { [PT]: sub(rd(PT), 'holdings: peaceTailHoldings(deps.treasuryOf(payerId), k => deps.stockOf(payerId, k), order),', 'holdings: peaceTailHoldings(deps.treasuryOf(partnerId), k => deps.stockOf(partnerId, k), order),') }],
  ];
  for (const [name, ov] of mutants) {
    if (Object.values(ov).some(v => v == null)) { console.log(`MUTANT ${name}: NIE ZASTOSOWANO (wzorzec nieobecny) -> FAIL`); exitCode = 1; continue; }
    let M;
    try { M = await load(ov); } catch (e) { console.log(`MUTANT ${name}: błąd budowy: ${String(e).slice(0, 200)} -> FAIL`); exitCode = 1; continue; }
    const bad = suite(M).filter(r => !r.ok);
    if (bad.length) { pass++; console.log(`PASS: ${name} wykryty (${bad.length} czerwonych, np. ${bad[0].name.slice(0, 60)})`); }
    else { fail++; console.log(`FAIL: ${name} NIE WYKRYTY`); exitCode = 1; }
  }
  console.log(`\ndiplo-peace-tail-integration-test: ${pass} pass / ${fail} fail`);
  process.exit(fail > 0 ? 1 : exitCode);
})().catch(e => { console.error(e); process.exit(1); });
