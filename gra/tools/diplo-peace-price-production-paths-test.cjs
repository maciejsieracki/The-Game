'use strict';
/**
 * diplo-peace-price-production-paths-test.cjs -- R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1 (runda 4, zarzut FC D).
 *
 * Testy BEHAWIORALNE wywolan produkcyjnych (nie regexy po zrodle): realne funkcje ai.ts / diplomacy-proposals.ts /
 * diplomacy-ai-forced-peace.ts / war-weariness.ts sa zbudowane esbuildem i uruchomione; kazdy mutant (zmiana zrodla produkcyjnego
 * przez plugin onLoad) musi zaczerwienic co najmniej jedna asercje:
 *   (A) panel / R5 (gracz -> AI): evaluateProposal pokazuje i wymaga ceny round(6000 x (1 - L)); silniejsza AI wymaga miasta >= tej ceny;
 *   (B) AI -> gracz (decideAIDiplomacy): oferta miast = MINIMUM rownowazace cene (waga oddajacego), stolica nigdy, cena 0 / brak pokrycia -> brak oferty;
 *   (C) AI <-> AI prosby (runAiAiPeaceTick): cena > 0 bez pelnego pokrycia = wojna trwa takze po limicie tur; cena 0 = pokoj bez miast;
 *   (D) tick zmeczenia (runWarWearinessTick): oferta dobrowolna i pokoj wymuszony — jedna cena, minimum miast, bez progu 3 miast, brak pokoju przy braku pokrycia.
 *
 *   node tools/diplo-peace-price-production-paths-test.cjs   # exit 0 = wszystko zielone i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = path.join(GRA_ROOT, 'src');
const F = (p) => path.join(SRC, p);

const ENTRY_SRC = `
export { decideAIDiplomacy } from ${JSON.stringify(F('game/ai.ts'))};
export { evaluateProposal, createNegotiation, negotiationAsProposal } from ${JSON.stringify(F('game/diplomacy-proposals.ts'))};
export { runAiAiPeaceTick } from ${JSON.stringify(F('game/diplomacy-ai-forced-peace.ts'))};
export { runWarWearinessTick, wearinessPeaceCashPn, warWearinessLevel, WAR_WEARINESS_PARAMS } from ${JSON.stringify(F('game/war-weariness.ts'))};
`;

let seq = 0;
/** Buduje bundle z podmiana tresci wskazanych plikow (mutanty). muts = [{ file, from, to }] — `from` musi wystapic DOKLADNIE raz. */
async function load(muts) {
  const id = `${process.pid}-${seq++}`;
  const entry = path.join(__dirname, `.ppp-${id}-entry.ts`);
  const out = path.join(__dirname, `.ppp-${id}-bundle.cjs`);
  fs.writeFileSync(entry, ENTRY_SRC);
  const byFile = new Map();
  for (const m of muts || []) {
    const abs = F(m.file);
    const src = byFile.get(abs) ?? fs.readFileSync(abs, 'utf8');
    const hits = src.split(m.from).length - 1;
    if (hits !== 1) throw new Error(`mutant: fragment w ${m.file} wystepuje ${hits}x (wymagane 1): ${m.from.slice(0, 70)}`);
    byFile.set(abs, src.replace(m.from, m.to));
  }
  try {
    await esbuild.build({
      entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: out, absWorkingDir: GRA_ROOT,
      logLevel: 'silent', resolveExtensions: ['.ts', '.js', '.json'],
      plugins: [{
        name: 'mut',
        setup(b) {
          b.onLoad({ filter: /\.ts$/ }, (args) => {
            if (!byFile.has(args.path)) return undefined;
            return { contents: byFile.get(args.path), loader: 'ts', resolveDir: path.dirname(args.path) };
          });
        },
      }],
    });
    delete require.cache[out];
    return require(out);
  } finally {
    for (const f of [entry, out]) { try { fs.unlinkSync(f); } catch (_) { /* ignore */ } }
  }
}

// ---------------------------------------------------------------------------------------------------------------------------
// Scenariusze (wejscia produkcyjne) — zwracaja liste czerwonych asercji
// ---------------------------------------------------------------------------------------------------------------------------
const cena = (t, lost = 0) => Math.round(6000 * (1 - Math.min(1, (t / 40) + 0.1 * lost)));
const WAGA = 1.5; // aiMiastoWagaOddawanego(eks=3)

function scenarioA(M) {
  const red = [];
  const WOJNA = { zaufanie: 5, respekt: 5, status: 'wojna' };
  const evalPeace = (t, pozycja, giveItems) => {
    const entry = M.createNegotiation({ actionId: 'pokoj', proposerOwnerId: 0, responderOwnerId: 1, payload: { giveItems } }, 80, 'own', 0);
    return M.evaluateProposal(M.negotiationAsProposal(entry), {
      relation: WOJNA, stanWojny: true, turn: 80, proposerRespekt: 60, responderRespekt: 60, militaryRatio: 1, respektWzgledny: 0.5,
      karaWspolnaGranica: false, difficulty: 'normal',
      responderPlayer: { ownerId: 1, typCywilizacji: 'rzymianie' }, proposerPlayer: { ownerId: 0, typCywilizacji: 'grecy' },
      authorOwnerId: 0,
      warState: { turnsAtWar: t, lostCitiesResponder: 0, turnsSinceCityChange: t, responderRw: 0.5, responderPozycjaMilitarna: pozycja },
    });
  };
  for (const t of [10, 20, 30]) {
    const c = cena(t);
    const r = evalPeace(t, 'silniejsza', [{ typ: 'miasto', id: 'm', ilosc: 1, cityPn: 100 }]);
    if (!(r.accepted === false && String(r.reason || '').includes(`wymagane ${c} PN`))) red.push(`A1 t=${t}: silniejsza AI wymaga miasta >= ${c} PN (got ${r.reason})`);
    const ok = evalPeace(t, 'silniejsza', [{ typ: 'miasto', id: 'm', ilosc: 1, cityPn: c }]);
    if (ok.accepted !== true) red.push(`A2 t=${t}: miasto o wartosci ${c} PN wystarcza (got accepted=${ok.accepted})`);
    const w = evalPeace(t, 'slabsza', []);
    if (!(w.wearinessInfo && w.wearinessInfo.cenaPokojuPn === c)) red.push(`A3 t=${t}: panel pokazuje cene ${c} (got ${w.wearinessInfo && w.wearinessInfo.cenaPokojuPn})`);
  }
  const zero = evalPeace(40, 'silniejsza', []);
  if (zero.accepted !== true) red.push('A4 t=40: cena 0 => pokoj bez miast (silniejsza AI nie zada miasta)');
  return red;
}

function scenarioB(M) {
  const red = [];
  const mk = (n, pn) => Array.from({ length: n }, (_, i) => ({ cityId: 'c' + i, cityPn: pn, zakazane: i === 0 }));
  const decide = (t, miasta) => M.decideAIDiplomacy({
    myPlayerId: '1', agresja: 0.5, currentTurn: 60, myTypCywilizacji: 'grecy', skarbiecGold: 0, miastaAI: miasta, ekspansywnosc: 3, agresywnoscRaw: 5, sklonnoscDoPodboju: 2,
    relacje: [{
      partnerId: '0', relation: { zaufanie: 0, respekt: 29, status: 'wojna' }, respektWzgledny: 0.1, stanWojny: true,
      silaMilitarnaAI: { sila: 100, armiaPkt: 0 }, silaMilitarnaPartner: { sila: 200, armiaPkt: 0 },
      turnsAtWar: t, lostCitiesInWar: 0, turnsSinceCityChange: t, armyHealthShare: 0.9, peaceLocked: false, partnerTypCywilizacji: 'rzymianie',
    }],
  }).filter((c) => c.targetId === '0');
  for (const t of [10, 15, 20, 25, 30, 35]) {
    // R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1 (r3): przed 20. turą wojny AI oferuje ROZEJM, którego cena bazowa to
    // X = 2000 × (1 − L) (parytet traktatów; bez pól mocy AI płaci pełne X) = round(2000 × cena_pokoju / 6000); od 20. tury — pokój (P).
    const c = t < 20 ? Math.round(2000 * cena(t) / 6000) : cena(t);
    const cmds = decide(t, mk(9, 1840)); // stolica (c0) + 8 miast po 1840 PN
    const off = cmds.find((x) => x.type === 'oferuj_miasto_za_pokoj');
    if (!off) { red.push(`B1 t=${t}: brak oferty miast przy cenie ${c}`); continue; }
    const wartosci = [off.cityPn, ...(off.dodatkoweMiasta || []).map((m) => m.cityPn)].map((v) => v * WAGA);
    const suma = wartosci.reduce((a, b) => a + b, 0);
    if (suma + 1e-6 < c) red.push(`B2 t=${t}: suma ${suma} < cena ${c} (oferta nie pokrywa ceny)`);
    const bezOstatniego = wartosci.slice(0, -1).reduce((a, b) => a + b, 0);
    if (wartosci.length > 1 && bezOstatniego + 1e-6 >= c) red.push(`B3 t=${t}: oferta NIE jest minimalna (bez ostatniego miasta suma ${bezOstatniego} >= ${c})`);
    if ([off.cityId, ...(off.dodatkoweMiasta || []).map((m) => m.cityId)].includes('c0')) red.push(`B4 t=${t}: oddano stolice`);
  }
  // B5: tylko stolica + cena > 0 => brak oferty (wojna trwa)
  if (decide(20, [{ cityId: 'cap', cityPn: 99999, zakazane: true }]).some((x) => x.type === 'oferuj_miasto_za_pokoj')) red.push('B5: tylko stolica => brak oferty miasta');
  // B6: za male miasta (nie pokrywaja ceny 3000 nawet razem) => brak oferty
  if (decide(20, mk(3, 600)).some((x) => x.type === 'oferuj_miasto_za_pokoj')) red.push('B6: brak pelnego pokrycia => brak oferty (wojna trwa)');
  // B7: cena 0 (t=40) => brak oferty miasta
  if (decide(40, mk(9, 1840)).some((x) => x.type === 'oferuj_miasto_za_pokoj')) red.push('B7: cena 0 => brak oferty miasta (pokoj zapada w tiku wymuszonym)');
  return red;
}

function scenarioC(M) {
  const red = [];
  const city = (id, pn, forbidden) => ({ kind: 'miasto', id, amount: 1, pn, forbidden: !!forbidden });
  const run = (o) => {
    const log = [];
    const store = new Map([['1-2', { requesterId: 1, otherId: 2, requestTurn: 0, kind: 'pokoj' }]]);
    const outc = M.runAiAiPeaceTick({
      store, turn: o.turn, pairEligible: () => true, requesterShareOf: () => 0.2, gateVerdict: () => 'ok', peaceAllowed: () => true,
      price: () => ({ requiredPn: o.price, balanceFor: () => 0, tolerancePn: 0 }),
      assets: () => o.assets, cityCessionOk: () => true, battlePending: false,
      pay: (l, w, plan) => log.push({ ev: 'pay', plan }),
      finalize: (l, w, kind) => log.push({ ev: 'finalize', kind }),
    });
    return { outc, log };
  };
  // C1: cena 3000, tylko stolica, PO limicie tur => wojna trwa
  const c1 = run({ turn: 99, price: 3000, assets: [city('cap', 9999, true)] });
  if (c1.log.some((x) => x.ev === 'finalize')) red.push('C1: cena > 0 i tylko stolica — pokoj NIE moze zapasc (takze po limicie tur)');
  // C2: cena 3000, niepelne pokrycie (2 miasta po 1000) po limicie => wojna trwa
  const c2 = run({ turn: 99, price: 3000, assets: [city('a', 1000), city('b', 1000)] });
  if (c2.log.some((x) => x.ev === 'finalize')) red.push('C2: brak pelnego pokrycia — pokoj NIE zapada po limicie tur');
  // C3: cena 0 => pokoj bez miast
  const c3 = run({ turn: 99, price: 0, assets: [city('cap', 9999, true)] });
  if (!c3.log.some((x) => x.ev === 'finalize') || c3.log.some((x) => x.ev === 'pay' && x.plan.items.length > 0)) red.push('C3: cena 0 => pokoj zapada bez oddania miasta');
  // C4: cena 3000, miasta 2000 + 2000 + 500: minimum = 2 miasta
  const c4 = run({ turn: 99, price: 3000, assets: [city('a', 2000), city('b', 2000), city('c', 500), city('cap', 9999, true)] });
  const pay4 = c4.log.find((x) => x.ev === 'pay');
  if (!pay4 || pay4.plan.items.length !== 2 || pay4.plan.items.some((i) => i.id === 'cap')) red.push(`C4: minimum miast (2), bez stolicy (got ${pay4 ? pay4.plan.items.map((i) => i.id) : 'brak platnosci'})`);
  return red;
}

function scenarioD(M) {
  const red = [];
  const A = (id, pn, forbidden) => ({ kind: 'miasto', id, amount: 1, pn, forbidden: !!forbidden });
  const mkTick = (o) => {
    const log = [];
    const P = JSON.parse(JSON.stringify(M.WAR_WEARINESS_PARAMS));
    if (o.forcedAt !== undefined) P.zmeczenie.progWymuszonyPokoj = o.forcedAt;
    const deps = {
      store: new Map(), turn: o.turn, pairs: [{ a: 1, b: 2 }], pairKey: (a, b) => `${a}-${b}`,
      warInfo: () => ({ warStart: o.turn - o.turnsAtWar, turnsAtWar: o.turnsAtWar, lostA: o.lostA || 0, lostB: 0, turnsSinceCityChange: o.turnsAtWar }),
      shareOf: (x) => (x === 1 ? 0.15 : 0.85), weakerOf: () => 1, cityCountOf: () => o.cities,
      price: (w, l, level) => ({ requiredPn: M.wearinessPeaceCashPn(level, P), balanceFor: (c) => c, tolerancePn: 0 }),
      assets: () => o.assets, cityCessionOk: () => true, battlePending: false, params: P,
      pay: (l, w, plan) => log.push({ ev: 'pay', plan }), finalize: (l, w, lock) => log.push({ ev: 'peace', lock }), log: () => {},
    };
    const out = M.runWarWearinessTick(deps);
    return { out, log };
  };
  // D1: pokoj wymuszony przy L=0,5 (prog przestawiony TYLKO w tescie), cena 3000, 3 miasta (stolica + 2 po 1840): oddaje 2 (zostaje stolica) — brak progu 3
  const d1 = mkTick({ turn: 40, turnsAtWar: 20, cities: 3, forcedAt: 0.5, assets: [A('x', 1840), A('y', 1840), A('cap', 9999, true)] });
  const p1 = d1.log.find((x) => x.ev === 'pay');
  if (!d1.log.some((x) => x.ev === 'peace') || !p1 || p1.plan.items.length !== 2) red.push(`D1: wymuszony pokoj przy cenie 3000 oddaje 2 miasta (zostaje stolica), bez progu 3 (got ${JSON.stringify(d1.log.map((x) => x.ev))})`);
  // D2: wymuszony, cena 3000, miasta 1840 + stolica => niepelne pokrycie => wojna trwa
  const d2 = mkTick({ turn: 40, turnsAtWar: 20, cities: 2, forcedAt: 0.5, assets: [A('x', 1840), A('cap', 9999, true)] });
  if (d2.log.some((x) => x.ev === 'peace')) red.push('D2: wymuszony, cena > 0, niepelne pokrycie — pokoj NIE zapada');
  // D3: wymuszony, tylko stolica, cena > 0 => wojna trwa
  const d3 = mkTick({ turn: 40, turnsAtWar: 20, cities: 1, forcedAt: 0.5, assets: [A('cap', 9999, true)] });
  if (d3.log.some((x) => x.ev === 'peace')) red.push('D3: tylko stolica i cena > 0 — pokoj NIE zapada');
  // D4: wymuszony przy L=1 (domyslny prog), cena 0 => pokoj bez miast
  const d4 = mkTick({ turn: 60, turnsAtWar: 40, cities: 1, assets: [A('cap', 9999, true)] });
  if (!d4.log.some((x) => x.ev === 'peace') || d4.log.some((x) => x.ev === 'pay' && x.plan.items.length)) red.push('D4: cena 0 (L=1) — pokoj bez miast');
  // D5: oferta dobrowolna (L=0,7, 28 tur): JEDNA cena 1800; miasta 1840 (jedno wystarcza) => oddaje 1 miasto; bez mnoznikow
  const d5 = mkTick({ turn: 100, turnsAtWar: 28, cities: 6, lostA: 0, assets: [A('x', 1840), A('y', 1840), A('cap', 9999, true)] });
  const p5 = d5.log.find((x) => x.ev === 'pay');
  if (!p5 || p5.plan.items.length !== 1 || p5.plan.items[0].id === 'cap') red.push(`D5: oferta dobrowolna przy cenie 1800: jedno miasto, bez mnoznikow (got ${JSON.stringify(p5 && p5.plan.items.map((i) => i.id))})`);
  // D6: oferta dobrowolna, cena 1800, miasta 1000 (jedno nie wystarcza, dwa tak): minimum 2
  const d6 = mkTick({ turn: 100, turnsAtWar: 28, cities: 6, assets: [A('x', 1000), A('y', 1000), A('z', 1000), A('cap', 9999, true)] });
  const p6 = d6.log.find((x) => x.ev === 'pay');
  if (!p6 || p6.plan.items.length !== 2) red.push(`D6: oferta dobrowolna: minimum 2 miasta (got ${p6 ? p6.plan.items.length : 'brak'})`);
  // D7: oferta dobrowolna, brak pelnego pokrycia (2 x 500 przy cenie 1800) => pokoj nie zapada
  const d7 = mkTick({ turn: 100, turnsAtWar: 28, cities: 6, assets: [A('x', 500), A('y', 500), A('cap', 9999, true)] });
  if (d7.log.some((x) => x.ev === 'peace')) red.push('D7: oferta dobrowolna bez pelnego pokrycia — pokoj NIE zapada');
  return red;
}

const MUTANTS = [
  { id: 'M1-ai-stala-cena-615', scen: 'B', muts: [{ file: 'game/ai.ts', from: 'const cenaPokojuPn = rel.stanWojny ? wearinessPeaceCashPn(wearyLevel) : 0;', to: 'const cenaPokojuPn = rel.stanWojny ? 615 : 0;' }] },
  { id: 'M2-ai-oferta-bez-pelnego-pokrycia', scen: 'B', muts: [{ file: 'game/ai.ts', from: 'const pick = cenaPokojuPn > 0 && cityPlan.full ? cityPlan.miasta[0] : undefined;', to: 'const pick = cityPlan.miasta[0];' }] },
  { id: 'M3-ai-plan-bez-minimum-tylko-jedno', scen: 'B', muts: [{ file: 'game/ai.ts', from: 'return { miasta: plan.items.map(i => byId.get(i.id)!).filter(Boolean), full: plan.full };', to: 'return { miasta: plan.items.map(i => byId.get(i.id)!).filter(Boolean), full: true };' }] },
  { id: 'M4-prosby-AI-AI-sila-po-limicie', scen: 'C', muts: [{ file: 'game/diplomacy-ai-forced-peace.ts', from: "if ((inp.req.kind ?? 'pokoj') === 'pokoj' && !inp.plan.full) {", to: 'if (false) {' }] },
  { id: 'M5-prosby-AI-AI-jedno-miasto', scen: 'C', muts: [{ file: 'game/diplomacy-ai-forced-peace.ts', from: 'planCityPeacePayment(price.requiredPn, assets, assets.length)', to: 'planCityPeacePayment(price.requiredPn, assets, 1)' }] },
  { id: 'M6-wymuszony-prog-3-miast', scen: 'D', muts: [{ file: 'game/war-weariness.ts', from: 'const cityCap = d.battlePending ? 0 : Math.max(0, ownCities);', to: 'const cityCap = d.battlePending ? 0 : Math.max(0, ownCities - 3);' }] },
  { id: 'M7-wymuszony-pokoj-bez-pokrycia', scen: 'D', muts: [{ file: 'game/war-weariness.ts', from: 'if (cashPn > 0 && !forcedPlan?.full) { none(); continue; }', to: '/* usunieto guard pokrycia */' }] },
  { id: 'M8-dobrowolna-bez-pokrycia', scen: 'D', muts: [{ file: 'game/war-weariness.ts', from: 'const priceCovered = priceZero || plan.full;', to: 'const priceCovered = true;' }] },
  { id: 'M9-dobrowolna-limit-miast', scen: 'D', muts: [{ file: 'game/war-weariness.ts', from: 'const maxCities = d.battlePending ? 0 : Math.max(0, ownCities);\n    const skip', to: 'const maxCities = d.battlePending ? 0 : Math.max(0, Math.min(1, ownCities));\n    const skip' }] },
  { id: 'M10-panel-stala-cena', scen: 'A', muts: [{ file: 'game/diplomacy-proposals.ts', from: 'const cenaPokojuPn = basePnCfg * r5Gate.priceMultiplier > 0 ? wearinessPeaceCashPn(wearyLevel) : 0;', to: 'const cenaPokojuPn = basePnCfg * r5Gate.priceMultiplier > 0 ? 615 : 0;' }] },
  { id: 'M11-panel-silniejsza-cena-815', scen: 'A', muts: [{ file: 'game/diplomacy-proposals.ts', from: 'if (!(cityGivePn >= cenaWymaganaPn)) {', to: 'if (!(cityGivePn >= 100)) {' }] },
];

const SCEN = { A: scenarioA, B: scenarioB, C: scenarioC, D: scenarioD };

(async () => {
  let pass = 0;
  let fail = 0;
  const check = (ok, msg) => { if (ok) pass++; else { fail++; console.log('FAIL: ' + msg); } };
  const base = await load([]);
  for (const k of Object.keys(SCEN)) {
    const red = SCEN[k](base);
    check(red.length === 0, `scenariusz ${k} (produkcja bez mutacji) zielony — ${red.join(' | ')}`);
    console.log(`scenariusz ${k}: ${red.length === 0 ? 'OK' : 'CZERWONY'}`);
  }
  for (const m of MUTANTS) {
    let red;
    try {
      const mod = await load(m.muts);
      red = SCEN[m.scen](mod);
    } catch (e) {
      red = ['blad kompilacji/uruchomienia: ' + String(e.message).split('\n')[0]];
    }
    check(red.length > 0, `mutant ${m.id} PRZESZEDL (scenariusz ${m.scen} nie zaczerwienil sie)`);
    console.log(`mutant ${m.id}: wykryty = ${red.length > 0} ${red.length ? '(' + red[0].slice(0, 90) + ')' : ''}`);
  }
  console.log(`diplo-peace-price-production-paths-test: PASS=${pass} FAIL=${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
