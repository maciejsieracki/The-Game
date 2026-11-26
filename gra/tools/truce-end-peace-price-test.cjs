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
  'export { truceEndPriceRule } from \'./game/diplomacy-truce-end-price\';',
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
    settleOk: true, seq: 0,
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
    && /const price = aiAiPeacePriceFor\(payeeId, payerId, 'pokoj'\);/.test(main));
  check('wiring: płatność po rozejmie AI↔AI sprawdza nieujemny bilans PW (pokojAiAi.minBilansPW), gracz wyłączony',
    /!isHuman\(payerId\) && !isHuman\(payeeId\)\s*&& !isAiAiPeaceBalanceAllowed\(price\.balanceFor\(plan\.coveredPn\), price\.loserBalanceFor\?\.\(plan\.coveredPn\)\)/.test(main));
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

  console.log(`\nWynik: ${pass} PASS, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
