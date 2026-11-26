'use strict';
/**
 * truce-end-peace-price-test.cjs — R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-Q1.
 * Koniec rozejmu = propozycja pokoju z CENĄ (nie pokój za darmo).
 *   Reguła (decyzja właściciela 2026-11-26): różnica siły wojskowej ≤20% w którąkolwiek stronę →
 *   strona przegrywająca (mniejsza moc; remis → inicjator rozejmu) płaci SUROWCAMI; >20% → słabsza
 *   płaci MIASTEM. Dokładnie +20% NIE jest przewagą. AI zawsze składa propozycję graczowi; odmowa = wojna.
 *
 * Część 1: czysta reguła truceEndPriceRule (diplomacy-truce-end-price.ts) — granice, remis, nieprawidłowe dane.
 * Część 2: cykl życia przez truceEndTickPair / truceEndAcceptCore / truceEndToWarCore z portami-atrapami
 *          (ta sama logika co main.ts przez truceEndPorts()).
 * Część 3: wiring w main.ts (źródło): port settlePeacePrice, zgoda gracza przez truceEndAcceptCore,
 *          cena AI↔AI wydzielona (aiAiPeacePriceFor) i używana w płatności po rozejmie.
 * Część 4: mutanty czerwone: pasmo bez progu (M-THR) i zamiana płacącego przy remisie (M-PAYER).
 * Run: node tools/truce-end-peace-price-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const PRICE = path.resolve(GRA, 'src', 'game', 'diplomacy-truce-end-price.ts');
const LOCK = path.resolve(GRA, 'src', 'game', 'diplomacy-peace-lock.ts');
const MAIN = path.resolve(GRA, 'src', 'main.ts');
const ENTRY = path.resolve(GRA, 'src', '.truce-end-peace-price-entry.ts');
const BUNDLE = path.resolve(__dirname, '.truce-end-peace-price.cjs');
const BUNDLE_MTHR = path.resolve(__dirname, '.truce-end-peace-price-mthr.cjs');
const BUNDLE_MPAYER = path.resolve(__dirname, '.truce-end-peace-price-mpayer.cjs');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const ENTRY_SRC = [
  'export { truceEndPriceRule, pickTruceEndSettlementPlan, truceEndOfferReason, executeTruceEndSettlement, truceEndDuePn, truceEndSurowceSubstituteCovers } from \'./game/diplomacy-truce-end-price\';',
  'export {',
  '  truceEndTickPair, truceEndToWarCore, truceEndAcceptCore, truceEndSettleCore, truceEndPriceFor,',
  '} from \'./game/diplomacy-peace-lock\';',
  '',
].join('\n');

function mutantPlugin(target, from, to) {
  const info = { applied: 0 };
  const filter = new RegExp(path.basename(target).replace(/[.]/g, '\\.') + '$');
  return {
    info,
    plugin: {
      name: 'mutant-truce-end-price',
      setup(build) {
        build.onLoad({ filter }, async () => {
          const src = fs.readFileSync(target, 'utf8');
          info.applied = src.split(from).length - 1;
          return { contents: src.split(from).join(to), loader: 'ts' };
        });
      },
    },
  };
}

async function buildBundle(outfile, plugins) {
  fs.writeFileSync(ENTRY, ENTRY_SRC);
  try {
    await esbuild.build({
      entryPoints: [ENTRY],
      bundle: true,
      format: 'cjs',
      platform: 'node',
      outfile,
      logLevel: 'silent',
      plugins: plugins || [],
    });
  } finally {
    fs.unlinkSync(ENTRY);
  }
  return require(outfile);
}

/** Atrapy portów: ta sama semantyka co truceEndPorts() w main.ts. */
function makeWorld() {
  const world = {
    meta: {}, status: {}, army: {}, humans: new Set([0]), warCalls: [], finalize: [], inbox: [], settle: [],
    settleOk: true, seq: 0, quoteValue: 50,
  };
  const key = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
  world.key = key;
  world.ports = {
    getMeta: (a, b) => world.meta[key(a, b)] || {},
    setMeta: (a, b, m) => { world.meta[key(a, b)] = m; },
    getStatus: (a, b) => world.status[key(a, b)] || 'wojna',
    getArmyM: id => (world.army[id] != null ? world.army[id] : 0),
    isHuman: id => world.humans.has(id),
    declareWarAfterTruce: (a, b) => { world.status[key(a, b)] = 'wojna'; world.warCalls.push(key(a, b)); },
    enqueueOffer: (ownerId, reason) => {
      world.seq++;
      const id = 'inbox-' + world.seq;
      world.inbox.push({ id, ownerId, reason });
      return id;
    },
    removeOffer: id => { world.inbox = world.inbox.filter(x => x.id !== id); },
    finalizePeace: (p, r) => { world.finalize.push([p, r]); world.status[key(p, r)] = 'pokoj'; },
    settlePeacePrice: (payer, payee, cur) => { world.settle.push([payer, payee, cur]); return world.settleOk; },
    quotePn: () => world.quoteValue,
  };
  return world;
}

function expiringPair(w, a, b, initiator) {
  w.status[w.key(a, b)] = 'pokoj';
  w.meta[w.key(a, b)] = { truceUntilTurn: 110, truceInitiatorId: initiator };
}

(async () => {
  const lib = await buildBundle(BUNDLE);
  const rule = lib.truceEndPriceRule;

  // ---- Część 1: czysta reguła ----
  // (a) ≤20% w którąkolwiek stronę → przegrywająca (słabsza) płaci SUROWCAMI, bez miasta.
  {
    const r1 = rule({ initiatorId: 7, a: 7, b: 9, armyA: 100, armyB: 110 });
    check('(a) 100 vs 110 (w paśmie) → słabszy inicjator (7) płaci surowcami',
      r1 && r1.band === 'within' && r1.payerId === 7 && r1.payeeId === 9 && r1.currency === 'surowce', r1);
    const r2 = rule({ initiatorId: 7, a: 7, b: 9, armyA: 110, armyB: 100 });
    check('(a) 110 vs 100 (w paśmie) → słabszy AI 9 płaci surowcami (inicjator nie)',
      r2 && r2.band === 'within' && r2.payerId === 9 && r2.payeeId === 7 && r2.currency === 'surowce', r2);
    const r3 = rule({ initiatorId: 9, a: 7, b: 9, armyA: 100, armyB: 120 });
    check('(a) granica włącznie: 100 vs 120 (dokładnie +20%) NIE jest przewagą → surowce, płaci 7',
      r3 && r3.band === 'within' && r3.payerId === 7 && r3.currency === 'surowce', r3);
    check('(a) żadna z reguł nie wymaga miasta w paśmie',
      [r1, r2, r3].every(r => r.currency === 'surowce'));
  }
  // (b) >20% → słabsza płaci MIASTEM.
  {
    const r = rule({ initiatorId: 9, a: 7, b: 9, armyA: 100, armyB: 121 });
    check('(b) 100 vs 121 (>20%) → słabsza 7 płaci miastem (inicjator 9 nie)',
      r && r.band === 'outside' && r.payerId === 7 && r.payeeId === 9 && r.currency === 'miasto', r);
    const r2 = rule({ initiatorId: 7, a: 7, b: 9, armyA: 100, armyB: 0 });
    check('(b) słabsza = 0 armii (strona 9), silniejsza > 0 → przedział >20%, płaci miastem 9',
      r2 && r2.band === 'outside' && r2.payerId === 9 && r2.payeeId === 7 && r2.currency === 'miasto', r2);
  }
  // (c) remis → płaci inicjator rozejmu (surowce).
  {
    const r1 = rule({ initiatorId: 7, a: 7, b: 9, armyA: 100, armyB: 100 });
    check('(c) remis 100:100, inicjator 7 → płaci 7 surowcami', r1 && r1.payerId === 7 && r1.currency === 'surowce' && r1.band === 'within', r1);
    const r2 = rule({ initiatorId: 9, a: 7, b: 9, armyA: 100, armyB: 100 });
    check('(c) remis 100:100, inicjator 9 → płaci 9 surowcami', r2 && r2.payerId === 9 && r2.currency === 'surowce', r2);
    const r3 = rule({ initiatorId: 7, a: 7, b: 9, armyA: 0, armyB: 0 });
    check('(c) remis 0:0 → płaci inicjator surowcami', r3 && r3.payerId === 7 && r3.currency === 'surowce', r3);
  }
  // Nieprawidłowe dane → null (brak reguły = wojna w cyklu życia).
  check('reguła: inicjator spoza pary → null', rule({ initiatorId: 3, a: 7, b: 9, armyA: 1, armyB: 1 }) === null);
  check('reguła: NaN / ujemna armia → null',
    rule({ initiatorId: 7, a: 7, b: 9, armyA: NaN, armyB: 1 }) === null && rule({ initiatorId: 7, a: 7, b: 9, armyA: -1, armyB: 1 }) === null);
  check('reguła: para a=b → null', rule({ initiatorId: 7, a: 7, b: 7, armyA: 1, armyB: 1 }) === null);

  // ---- Część 2: cykl życia ----
  // (d) AI zawsze składa propozycję graczowi — niezależnie od tego, kto zaprosił do rozejmu.
  {
    const w = makeWorld();
    expiringPair(w, 0, 7, 0);
    w.army[0] = 300; w.army[7] = 100;
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    check('(d) gracz-inicjator, AI-adresat → oferta od AI (ownerId=7), bez darmowego pokoju',
      w.inbox.length === 1 && w.inbox[0].ownerId === 7 && w.finalize.length === 0 && w.warCalls.length === 0, w.inbox);
  }
  {
    const w = makeWorld();
    expiringPair(w, 0, 7, 7);
    w.army[0] = 100; w.army[7] = 100;
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    const m = w.meta[w.key(0, 7)];
    check('(d) AI-inicjator, gracz-adresat → oferta od AI (from=7, to=0) i wpis w skrzynce AI 7',
      m.truceEndOffer && m.truceEndOffer.fromOwnerId === 7 && m.truceEndOffer.toOwnerId === 0 && w.inbox[0].ownerId === 7, m);
    check('(d) oferta nie zawiera płatności ani wojny w turze wygaśnięcia', w.settle.length === 0 && w.warCalls.length === 0);
  }
  // (d0) R-WEB-DIPLO-TRUCE-END-PRICE-3-Q1 (10B): cena 0 → symboliczna opłata (1 Pn z parametrów): oferta w skrzynce, bez wojny.
  {
    const w = makeWorld();
    w.quoteValue = 0;
    expiringPair(w, 0, 7, 0);
    w.army[0] = 100; w.army[7] = 100;
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    const m = w.meta[w.key(0, 7)];
    check('(d0) cena 0 gracz↔AI: oferta w skrzynce z opłatą symboliczną (inbox 1)', w.inbox.length === 1 && w.warCalls.length === 0, w.inbox);
    check('(d0) cena 0: wpis truceEndOffer w meta pary (oferta składana)', m.truceEndOffer !== undefined && m.truceEndOffer.fromOwnerId === 7, m);
    check('(d0) cena 0: treść oferty niesie opłatę symboliczną (ok. 1)', w.inbox.length === 1 && /ok\. 1 \(/.test(w.inbox[0].reason), w.inbox);
  }
  // (d0s) brak wyceny (NaN) = brak ceny → brak oferty, wojna wraca (dotychczasowy kontrakt dla NaN).
  {
    const w = makeWorld();
    w.quoteValue = NaN;
    expiringPair(w, 0, 7, 0);
    w.army[0] = 100; w.army[7] = 100;
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    check('(d0s) brak ceny (NaN) gracz↔AI: brak oferty, wojna wraca', w.inbox.length === 0 && w.warCalls.length === 1, w.inbox);
  }
  {
    const d0 = lib.truceEndDuePn(0);
    check('(d0u) truceEndDuePn: cena 0 → symboliczna 1 Pn; NaN → 0; dodatnia bez zmian',
      d0 === 1 && lib.truceEndDuePn(NaN) === 0 && lib.truceEndDuePn(50) === 50 && lib.truceEndDuePn(-3) === 1, { d0 });
    check('(d0u) truceEndSurowceSubstituteCovers: tylko bez miasta i przy pokryciu ceny',
      lib.truceEndSurowceSubstituteCovers(300, 300, false) === true && lib.truceEndSurowceSubstituteCovers(300, 300, true) === false
      && lib.truceEndSurowceSubstituteCovers(300, 299, false) === false && lib.truceEndSurowceSubstituteCovers(0, 300, false) === false);
  }
  {
    const w = makeWorld();
    w.quoteValue = 40;
    expiringPair(w, 0, 7, 0);
    w.army[0] = 100; w.army[7] = 100;
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    check('(d0) cena > 0: oferta w skrzynce nadal składana (kontrola, brak regresji)', w.inbox.length === 1 && w.warCalls.length === 0, w.inbox);
  }
  // (d0b) cena 0 NIE dotyczy pary AI↔AI: bramka jest w gałęzi gracza; AI↔AI nadal kończy się pokojem, gdy płatność wchodzi.
  {
    const w = makeWorld();
    w.humans.delete(0);
    w.quoteValue = 0;
    expiringPair(w, 7, 9, 7);
    w.army[7] = 100; w.army[9] = 100;
    lib.truceEndTickPair(w.ports, 7, 9, 110);
    check('(d0b) cena 0 AI↔AI: nie wchodzi w gałąź gracza (brak oferty w skrzynce)', w.inbox.length === 0, w.inbox);
    check('(d0b) cena 0 AI↔AI: zachowanie sprzed zmiany (pokój przez truceEndSettleCore, bez wojny)', w.finalize.length === 1 && w.warCalls.length === 0, { f: w.finalize, w: w.warCalls });
  }
  // (d0k) R-WEB-DIPLO-TRUCE-END-PRICE-3-Q1 (10B): brak środków na opłatę symboliczną (port płatności = false) → wojna, bez pokoju.
  {
    const w = makeWorld();
    w.quoteValue = 0;
    expiringPair(w, 0, 7, 0);
    w.army[0] = 100; w.army[7] = 100;
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    w.settleOk = false;
    const ok = lib.truceEndAcceptCore(w.ports, 0, 7);
    check('(d0k) cena 0 gracz płaci opłatę symboliczną, brak środków → wojna, bez pokoju',
      ok === false && w.settle.length === 1 && w.finalize.length === 0 && w.warCalls.length === 1, { s: w.settle, f: w.finalize, w: w.warCalls });
  }
  // (d0m) R-WEB-DIPLO-TRUCE-END-PRICE-3-Q1 (10B): AI↔AI cena 0, płatność (bilans PW) nie przechodzi → wojna, bez pokoju.
  {
    const w = makeWorld();
    w.humans.delete(0);
    w.quoteValue = 0;
    expiringPair(w, 7, 9, 7);
    w.army[7] = 100; w.army[9] = 100;
    w.settleOk = false;
    lib.truceEndTickPair(w.ports, 7, 9, 110);
    check('(d0m) cena 0 AI↔AI bez bilansu/środków na opłatę → wojna, bez pokoju',
      w.finalize.length === 0 && w.warCalls.length === 1 && w.settle.length === 1, { f: w.finalize, w: w.warCalls, s: w.settle });
  }
  // (d0c) wycena NaN (brak liczby) traktowana jak brak ceny: wojna wraca, bez oferty (decyzja ZAŁOŻENIE, patrz raport).
  {
    const w = makeWorld();
    w.quoteValue = NaN;
    expiringPair(w, 0, 7, 0);
    w.army[0] = 100; w.army[7] = 100;
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    check('(d0c) wycena NaN gracz↔AI: brak oferty, wojna wraca', w.inbox.length === 0 && w.warCalls.length === 1, { i: w.inbox, w: w.warCalls });
  }
  // (e) odmowa lub brak odpowiedzi = wojna (bez płatności).
  {
    const w = makeWorld();
    expiringPair(w, 0, 7, 7);
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    lib.truceEndTickPair(w.ports, 0, 7, 111);
    check('(e) timeout oferty = wojna, bez płatności i bez pokoju',
      w.warCalls.length === 1 && w.settle.length === 0 && w.finalize.length === 0);
  }
  {
    const w = makeWorld();
    expiringPair(w, 0, 7, 7);
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    lib.truceEndToWarCore(w.ports, 0, 7);
    check('(e) odmowa gracza = wojna, oferta i wpis w skrzynce usunięte',
      w.warCalls.length === 1 && w.meta[w.key(0, 7)].truceEndOffer === undefined && w.inbox.length === 0);
  }
  // Zgoda gracza: płaci wg reguły; zapłata OK → pokój; brak zapłaty → wojna.
  {
    const w = makeWorld();
    expiringPair(w, 0, 7, 0);
    w.army[0] = 100; w.army[7] = 110; // gracz słabszy w paśmie → płaci surowcami
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    const ok = lib.truceEndAcceptCore(w.ports, 0, 7);
    check('zgoda gracza (w paśmie): płaci gracz surowcami, pokój od AI do gracza',
      ok === true && w.settle.length === 1 && w.settle[0][0] === 0 && w.settle[0][2] === 'surowce'
      && w.finalize.length === 1 && w.finalize[0][0] === 7 && w.finalize[0][1] === 0 && w.warCalls.length === 0, { s: w.settle, f: w.finalize });
  }
  {
    const w = makeWorld();
    expiringPair(w, 0, 7, 0);
    w.army[0] = 10; w.army[7] = 100; // gracz znacznie słabszy → płaci miastem
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    w.settleOk = false;
    const ok = lib.truceEndAcceptCore(w.ports, 0, 7);
    check('zgoda gracza bez pełnej zapłaty miastem → brak pokoju, wojna',
      ok === false && w.settle[0][2] === 'miasto' && w.finalize.length === 0 && w.warCalls.length === 1, { s: w.settle, w: w.warCalls });
  }
  // (f) AI↔AI: pokój tylko gdy płatność wg reguły wchodzi (bilans nieujemny); inaczej wojna.
  {
    const w = makeWorld();
    w.humans.delete(0);
    expiringPair(w, 7, 9, 7);
    w.army[7] = 100; w.army[9] = 100;
    lib.truceEndTickPair(w.ports, 7, 9, 110);
    check('(f) AI↔AI remis, płatność OK → pokój (finalize 7→9), płaci inicjator surowcami',
      w.finalize.length === 1 && w.finalize[0][0] === 7 && w.settle[0][0] === 7 && w.settle[0][2] === 'surowce' && w.warCalls.length === 0, { s: w.settle, f: w.finalize });
  }
  {
    const w = makeWorld();
    w.humans.delete(0);
    expiringPair(w, 7, 9, 7);
    w.army[7] = 100; w.army[9] = 150;
    w.settleOk = false;
    lib.truceEndTickPair(w.ports, 7, 9, 110);
    check('(f) AI↔AI bez pełnej płatności (np. bilans PW ujemny) → wojna, bez pokoju',
      w.finalize.length === 0 && w.warCalls.length === 1, { f: w.finalize, w: w.warCalls });
  }
  // Stare zapisy: bez inicjatora nadal wojna; oferta w starym kształcie też się zamyka.
  {
    const w = makeWorld();
    w.status[w.key(0, 7)] = 'pokoj';
    w.meta[w.key(0, 7)] = { truceUntilTurn: 110 };
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    check('stary zapis bez inicjatora → wojna (bez płatności)', w.warCalls.length === 1 && w.settle.length === 0);
  }
  {
    const w = makeWorld();
    w.status[w.key(0, 7)] = 'pokoj';
    w.meta[w.key(0, 7)] = { truceEndOffer: { turn: 110, fromOwnerId: 7, toOwnerId: 0 } };
    w.army[0] = 100; w.army[7] = 100;
    const ok = lib.truceEndAcceptCore(w.ports, 0, 7);
    check('stara oferta (bez inboxId) przyjęta: płatność wg reguły z inicjatora (brak pola = 0 → brak reguły → wojna)',
      ok === false && w.warCalls.length === 1, { w: w.warCalls });
  }

  // ---- Część 3: wiring w main.ts (źródło) ----
  const main = fs.readFileSync(MAIN, 'utf8');
  const lock = fs.readFileSync(LOCK, 'utf8');
  check('wiring: truceEndPorts ma port settlePeacePrice', /settlePeacePrice: \(payerId, payeeId, currency\) => settleTruceEndPrice\(payerId, payeeId, currency\)/.test(main));
  check('wiring: zgoda gracza na pokój po rozejmie idzie przez truceEndAcceptCore',
    /koniecRozejmuPokoj\s*\?\s*truceEndAcceptCore\(truceEndPorts\(\), ME\(\), p\.ownerId\)/.test(main));
  check('wiring: cena AI↔AI wydzielona (aiAiPeacePriceFor) i użyta w tickAiAiPeaceRequests i płatności po rozejmie',
    /function aiAiPeacePriceFor\(/.test(main) && /price: \(winner, loser, kind\) => aiAiPeacePriceFor\(winner, loser, kind\)/.test(main)
    && /const price0 = aiAiPeacePriceFor\(payeeId, payerId, 'pokoj'\);/.test(main) && /requiredPn: truceEndDuePn\(price0\.requiredPn\)/.test(main));
  check('wiring: płatność po rozejmie AI↔AI sprawdza nieujemny bilans PW (pokojAiAi.minBilansPW), gracz wyłączony',
    /balanceOk: plan => isHuman\(payerId\) \|\| isHuman\(payeeId\)\s*\|\|\s*isAiAiPeaceBalanceAllowed\(price\.balanceFor\(plan\.coveredPn\), price\.loserBalanceFor\?\.\(plan\.coveredPn\)\)/.test(main));
  check('wiring: settleTruceEndPrice wybiera i płaci przez executeTruceEndSettlement (cena >0, pełny plan, fallback)',
    /executeTruceEndSettlement\(\{/.test(main) && /return pick != null;/.test(main) && !/pickTruceEndSettlementPlan\(\{/.test(main));
  check('wiring: cena 0 w truceEndTickPair = symboliczna opłata (truceEndDuePn), brak ceny = wojna',
    /truceEndDuePn\(ports\.quotePn\(rule\.payerId, rule\.payeeId\)\)/.test(lock)
    && /if \(rule != null && quote != null && !\(quote > 0\)\)\s*\{\s*truceEndToWarCore\(ports, a, b\);\s*return;/.test(lock));
  // Zarzut 1/2 (obrona 11A): okno gracza dostaje cityAvailable liczone z miast CEDOWALNYCH (bez forbidden, pn > 0).
  check('wiring 11A: truceEndWindowFor podaje cityAvailable z miast niezakazanych (!forbidden, pn > 0)',
    /const cityAvailable = aiPeacePaymentAssets\(rule\.payerId, rule\.payeeId, new Set<string>\(\)\)\s*\.some\(a => a\.kind === 'miasto' && !a\.forbidden && a\.pn > 0\);/.test(main)
    && /return requiredPn > 0 \? \{ open: true, requiredPn, currency: rule\.currency, cityAvailable \} : closed;/.test(main));
  check('wiring: oferta po rozejmie niesie cenę przez truceEndOfferReason (port quotePn)',
    /truceEndOfferReason\(rule, ports\.isHuman\(rule\.payerId\), quote\)/.test(lock) && /ports\.quotePn\(rule\.payerId, rule\.payeeId\)/.test(lock)
    && /quotePn: \(payerId, payeeId\) => aiAiPeacePriceFor\(payeeId, payerId, 'pokoj'\)\.requiredPn/.test(main));
  check('wiring: płatność miastem = tylko miasta płatnika (order [] bez ogona)',
    /peaceTailPricingForPayer\(payerId, payeeId, peaceTailWiringDeps\(\), \[\]\)/.test(main));
  check('wiring: płatność surowcami = ogon bez miast', /\.\.\.peaceTailPricingFor\(payerId, payeeId\),\s*duePn: price\.requiredPn, cities: \[\], maxCities: 0/.test(main));
  check('wiring: silnik bierze regułę przez truceEndPriceFor (siła w chwili wygaśnięcia)', /function truceEndPriceFor\(ports: TruceEndPorts/.test(lock));
  check('wiring: truceEndTickPair nie używa już darmowej zgody AI (truceEndAiAccepts)', !/truceEndAiAccepts\(/.test(lock.slice(lock.indexOf('export function truceEndTickPair'))));

  // ---- Część 4: mutanty czerwone ----
  const mthr = mutantPlugin(PRICE, 'const within = hi <= (1 + prog + eps) * lo;', 'const within = hi <= lo;');
  const libMthr = await buildBundle(BUNDLE_MTHR, [mthr.plugin]);
  check('M-THR zastosowany', mthr.info.applied === 1, mthr.info);
  check('M-THR wykryty: 100 vs 110 (w paśmie) mutant daje miasto (czysta: surowce)',
    libMthr.truceEndPriceRule({ initiatorId: 7, a: 7, b: 9, armyA: 100, armyB: 110 }).currency === 'miasto');

  const mpayer = mutantPlugin(PRICE, 'return { band: \'within\', payerId: initiatorId, payeeId: other(initiatorId), currency: \'surowce\' };',
    'return { band: \'within\', payerId: other(initiatorId), payeeId: initiatorId, currency: \'surowce\' };');
  const libMpayer = await buildBundle(BUNDLE_MPAYER, [mpayer.plugin]);
  check('M-PAYER zastosowany', mpayer.info.applied === 1, mpayer.info);
  check('M-PAYER wykryty: remis 100:100 mutant każe płacić adresatowi (czysta: inicjator 7)',
    libMpayer.truceEndPriceRule({ initiatorId: 7, a: 7, b: 9, armyA: 100, armyB: 100 }).payerId === 9
    && lib.truceEndPriceRule({ initiatorId: 7, a: 7, b: 9, armyA: 100, armyB: 100 }).payerId === 7);

  // ---- Część 5: wybór planu płatności (pickTruceEndSettlementPlan) i treść oferty — czyste funkcje ----
  // Te same funkcje wywołuje settleTruceEndPrice w main.ts; plan (planCity/planTail) podają tu atrapy.
  const pickPlan = lib.pickTruceEndSettlementPlan;
  const planOf = (full, items = 1) => ({ full, coveredPn: full ? 50 : 10, items: Array.from({ length: items }, (_, i) => i) });
  const okBal = () => true;
  check('(g) cena 0 → brak pokoju (pokój za darmo zabroniony), nawet przy pełnym planie',
    pickPlan({ requiredPn: 0, currency: 'surowce', planCity: () => planOf(true), planTail: () => planOf(true), balanceOk: okBal }) === null);
  check('(g) cena ujemna / NaN → brak pokoju',
    pickPlan({ requiredPn: -5, currency: 'surowce', planCity: () => planOf(true), planTail: () => planOf(true), balanceOk: okBal }) === null
    && pickPlan({ requiredPn: NaN, currency: 'surowce', planCity: () => planOf(true), planTail: () => planOf(true), balanceOk: okBal }) === null);
  check('(h) surowce: plan niepełny → brak pokoju (wojna)',
    pickPlan({ requiredPn: 50, currency: 'surowce', planCity: () => planOf(true), planTail: () => planOf(false), balanceOk: okBal }) === null);
  check('(h) surowce: pełny plan bez pozycji → brak pokoju',
    pickPlan({ requiredPn: 50, currency: 'surowce', planCity: () => planOf(true), planTail: () => planOf(true, 0), balanceOk: okBal }) === null);
  check('(h) surowce: bilans PW nie przechodzi → brak pokoju',
    pickPlan({ requiredPn: 50, currency: 'surowce', planCity: () => planOf(true), planTail: () => planOf(true), balanceOk: () => false }) === null);
  check('(i) miasto: pełny plan miastem → płaci miastem',
    (() => { const r = pickPlan({ requiredPn: 50, currency: 'miasto', planCity: () => planOf(true), planTail: () => planOf(true), balanceOk: okBal }); return r && r.currency === 'miasto'; })());
  check('(i) miasto: brak cedowalnego miasta (plan miastem niepełny) → wariant zastępczy surowcami z tego koszyka',
    (() => { const r = pickPlan({ requiredPn: 50, currency: 'miasto', planCity: () => planOf(false), planTail: () => planOf(true), balanceOk: okBal }); return r && r.currency === 'surowce'; })());
  check('(10B) symboliczna opłata 1 Pn bez bilansu PW (AI↔AI) → brak pokoju (wojna)',
    pickPlan({ requiredPn: lib.truceEndDuePn(0), currency: 'surowce', planCity: () => planOf(true), planTail: () => planOf(true), balanceOk: () => false }) === null);
  {
    // Zarzut 4 (obrona): okno gracza (truceEndSurowceSubstituteCovers) i plan AI (pickTruceEndSettlementPlan) dają ten
    // sam wynik wariantu zastępczego przy braku cedowalnego miasta (plan miastem niepełny ⇔ brak miasta).
    let agree = true;
    const grid = [];
    for (const req of [1, 50, 300]) {
      for (const cov of [0, req - 1, req, req + 1]) {
        const pick = pickPlan({ requiredPn: req, currency: 'miasto', planCity: () => planOf(false),
          planTail: () => ({ full: cov >= req, coveredPn: cov, items: [0] }), balanceOk: okBal }) !== null;
        const win = lib.truceEndSurowceSubstituteCovers(req, cov, false);
        grid.push([req, cov, pick, win]);
        if (pick !== win) agree = false;
      }
    }
    check('(11A) wariant zastępczy: okno gracza = plan AI przy braku miasta (siatka cen × pokryć)', agree, grid);
  }
  check('(i) miasto: ani miasto, ani surowce nie pokrywają ceny → brak pokoju',
    pickPlan({ requiredPn: 50, currency: 'miasto', planCity: () => planOf(false), planTail: () => planOf(false), balanceOk: okBal }) === null);
  {
    const rule1 = { band: 'within', payerId: 0, payeeId: 7, currency: 'surowce' };
    const rule2 = { band: 'outside', payerId: 7, payeeId: 0, currency: 'miasto' };
    const t1 = lib.truceEndOfferReason(rule1, true, 50);
    const t2 = lib.truceEndOfferReason(rule2, false, 120);
    check('(j) treść oferty: gracz płaci surowcami — kierunek, waluta i wartość w tekście',
      /Ty płacisz/.test(t1) && /surowcami/.test(t1) && /ok\. 50/.test(t1), t1);
    check('(j) treść oferty: AI płaci miastem — kierunek, waluta i wartość w tekście',
      /AI płaci/.test(t2) && /miastem/.test(t2) && /ok\. 120/.test(t2), t2);
  }
  {
    const w = makeWorld();
    expiringPair(w, 0, 7, 7);
    w.army[0] = 100; w.army[7] = 100;
    w.quoteValue = 77;
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    check('(j) oferta w skrzynce gracza niesie cenę z portu quotePn (ok. 77) i kierunek (AI płaci/Ty płacisz)',
      w.inbox.length === 1 && /ok\. 77/.test(w.inbox[0].reason) && /surowcami/.test(w.inbox[0].reason), w.inbox);
  }

  // ---- Część 6: mutanty czerwone na pickTruceEndSettlementPlan ----
  const MFREE = path.resolve(__dirname, '.truce-end-peace-price-mfree.cjs');
  const MFULL = path.resolve(__dirname, '.truce-end-peace-price-mfull.cjs');
  const MFALL = path.resolve(__dirname, '.truce-end-peace-price-mfall.cjs');
  const mfree = mutantPlugin(PRICE, 'if (!Number.isFinite(input.requiredPn) || input.requiredPn <= 0) return null;', 'if (!Number.isFinite(input.requiredPn)) return null;');
  const libMfree = await buildBundle(MFREE, [mfree.plugin]);
  check('M-FREE zastosowany', mfree.info.applied === 1, mfree.info);
  check('M-FREE wykryty: cena 0 przy pełnym planie (mutant wpuszcza pokój za darmo)',
    libMfree.pickTruceEndSettlementPlan({ requiredPn: 0, currency: 'surowce', planCity: () => planOf(true), planTail: () => planOf(true), balanceOk: okBal }) !== null
    && pickPlan({ requiredPn: 0, currency: 'surowce', planCity: () => planOf(true), planTail: () => planOf(true), balanceOk: okBal }) === null);
  const mfull = mutantPlugin(PRICE, 'if (tailPlan.full && tailPlan.items.length > 0 && input.balanceOk(tailPlan)) {', 'if (input.balanceOk(tailPlan)) {');
  const libMfull = await buildBundle(MFULL, [mfull.plugin]);
  check('M-FULL zastosowany', mfull.info.applied === 1, mfull.info);
  check('M-FULL wykryty: niepełny plan surowcami (mutant przyjmuje pokój)',
    libMfull.pickTruceEndSettlementPlan({ requiredPn: 50, currency: 'surowce', planCity: () => planOf(true), planTail: () => planOf(false), balanceOk: okBal }) !== null
    && pickPlan({ requiredPn: 50, currency: 'surowce', planCity: () => planOf(true), planTail: () => planOf(false), balanceOk: okBal }) === null);
  const mfall = mutantPlugin(PRICE, '  const tailPlan = input.planTail();', "  if (input.currency === 'miasto') return null;\n  const tailPlan = input.planTail();");
  const libMfall = await buildBundle(MFALL, [mfall.plugin]);
  check('M-FALL zastosowany', mfall.info.applied === 1, mfall.info);
  check('M-FALL wykryty: brak wariantu zastępczego przy braku miasta (mutant = wojna)',
    libMfall.pickTruceEndSettlementPlan({ requiredPn: 50, currency: 'miasto', planCity: () => planOf(false), planTail: () => planOf(true), balanceOk: okBal }) === null
    && pickPlan({ requiredPn: 50, currency: 'miasto', planCity: () => planOf(false), planTail: () => planOf(true), balanceOk: okBal }) !== null);

  // ---- Część 7: mutant czerwony na symbolicznej opłacie (R-WEB-DIPLO-TRUCE-END-PRICE-3-Q1, 10B) ----
  const MSYM = path.resolve(__dirname, '.truce-end-peace-price-msym.cjs');
  const msym = mutantPlugin(PRICE, 'return Number.isFinite(symbolicPn) && symbolicPn > 0 ? symbolicPn : 0;', 'return 0;');
  const libMsym = await buildBundle(MSYM, [msym.plugin]);
  check('M-SYM zastosowany', msym.info.applied === 1, msym.info);
  check('M-SYM wykryty: zdjęta opłata symboliczna (mutant: cena 0 = wojna, czysta: 1 Pn)',
    libMsym.truceEndDuePn(0) === 0 && lib.truceEndDuePn(0) === 1);

  console.log(`\nWynik: ${pass} PASS, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
