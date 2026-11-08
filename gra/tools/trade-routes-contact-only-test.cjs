'use strict';
/**
 * trade-routes-contact-only-test.cjs -- R-WEB-TRADE-ROUTE-CONTACT-ONLY-Q1 (2026-11-04).
 * Decyzja wlasciciela: szlak handlowy miedzy cywilizacjami wymaga TYLKO znajomosci (kontaktu),
 * nie fizycznego polaczenia (sciezka BFS / Port / wspolna granica).
 *
 * Uruchomienie z gra/:  node tools/trade-routes-contact-only-test.cjs
 * RED na starym kodzie:  TR_MODULE=old (wymaga tymczasowej kopii HEAD~ trade-routes.ts jako
 *                         src/game/trade-routes.old.ts) -- patrz raport Operatora.
 * Testuje PRAWDZIWY src/game/trade-routes.ts (esbuild bundle). Sekcja MUTACJE: trzy mutanty
 * zrodla musza byc wykryte przez asercje.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const MODULE = process.env.TR_MODULE === 'old' ? '../src/game/trade-routes.old' : '../src/game/trade-routes';
const SRC_FILE = path.resolve(__dirname, '..', 'src', 'game', 'trade-routes.ts');

function bundle(modulePath, tag) {
  const entry = path.resolve(__dirname, `.tr-contact-${tag}-entry.ts`);
  const out = path.resolve(__dirname, `.tr-contact-${tag}-bundle.cjs`);
  fs.writeFileSync(entry, `export * from '${modulePath}';`, 'utf8');
  try {
    esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: out, logLevel: 'silent' });
    return require(out);
  } finally {
    for (const f of [entry, out]) { try { fs.unlinkSync(f); } catch (e) { /* ok */ } }
  }
}
const TR = bundle(MODULE, 'main');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// Mapa: r=0: q=0..9 lad (kontynent W), q=10..20 morze (ocean), q=21..30 lad (kontynent E).
function buildMap() {
  const hexes = {};
  for (let q = 0; q <= 30; q++) hexes[`${q},0`] = { terenBazowy: (q >= 10 && q <= 20) ? 'morze' : 'rownina' };
  return { szerokoscQ: 31, wysokoscR: 1, hexes, seed: 1, riverPaths: [] };
}
const map = buildMap();
const city = (id, ownerId, q) => ({ id, ownerId, q, r: 0 });
const NO_WAR = () => false, WAR = () => true, TREATY = () => true, NO_TREATY = () => false;
const TECH = () => true, CONTACT = () => true, NO_CONTACT = () => false;
const none = new Map();

let CUR = TR;
function refresh(cities, existing, o = {}) {
  return CUR.refreshTradeRoutes(
    cities, existing, map, o.built || none, o.war || NO_WAR, o.treaty || TREATY,
    undefined, undefined, undefined, TECH, o.contact || CONTACT,
  );
}

function runSuite(T, label) {
  CUR = T;
  const A = city('A', 0, 5), B = city('B', 1, 25);

  // 1. Przeciwne brzegi oceanu, bez Portu i bez sciezki, znajomosc + Umowa -> trasa jest.
  const r1 = refresh([A, B], []);
  eq(r1.length, 1, `${label}1: ocean, bez Portu, znajomosc+Umowa -> trasa istnieje`);
  eq(r1[0] && r1[0].medium, 'morze', `${label}1: medium=morze (krzywa dochodu)`);
  eq(r1[0] && r1[0].dystans, 20, `${label}1: dystans = odleglosc heksowa miast`);

  // 2. Bez znajomosci -> brak.
  eq(refresh([A, B], [], { contact: NO_CONTACT }).length, 0, `${label}2: brak znajomosci -> brak trasy`);

  // 3. Wojna -> brak.
  eq(refresh([A, B], [], { war: WAR }).length, 0, `${label}3: wojna -> brak trasy`);

  // 4. Bez Umowy Szlakow -> brak.
  eq(refresh([A, B], [], { treaty: NO_TREATY }).length, 0, `${label}4: brak Umowy Szlakow -> brak trasy`);

  // 5. Limit slotow: A ma 1 slot (0 budynkow), B1/B2 po 1 -> tylko 1 trasa A<->B*.
  const B2 = city('B2', 1, 27);
  const r5 = refresh([A, B, B2], []).filter(r => r.ownerId !== r.toOwnerId);
  eq(r5.length, 1, `${label}5: limit slotow (A ma 1 slot) -> dokladnie 1 trasa zewnetrzna`);
  // z targowiskiem w A (2 sloty) -> 2 trasy
  const r5b = refresh([A, B, B2], [], { built: new Map([['A', ['targowisko']]]) }).filter(r => r.ownerId !== r.toOwnerId);
  eq(r5b.length, 2, `${label}5b: A z Targowiskiem (2 sloty) -> 2 trasy zewnetrzne`);

  // 6. Dochod zgodny z krzywa dystansu (morze, dystans 20, zagraniczna x2, half-ceil) = 16.
  eq(T.tradeRouteIncomeForRoute(r1[0]), Math.ceil(T.tradeRouteIncomeByDistance(20, 'morze') * 2 / 2), `${label}6: dochod = krzywa morska[20]`);
  eq(TR.tradeRouteIncomeForRoute(r1[0]), 16, `${label}6: dochod = 16 (wartosc referencyjna krzywej)`);

  // 6b. Ten sam kontynent -> medium lad, krzywa ladowa.
  const L1 = city('L1', 0, 2), L2 = city('L2', 1, 8);
  const r6 = refresh([L1, L2], []);
  eq(r6.length, 1, `${label}6b: ten sam kontynent -> trasa`);
  eq(r6[0] && r6[0].medium, 'lad', `${label}6b: medium=lad`);
  eq(TR.tradeRouteIncomeForRoute(r6[0]), Math.ceil(TR.tradeRouteIncomeByDistance(6, 'lad') * 2 / 2), `${label}6b: dochod = krzywa ladowa[6]`);

  // 7. Trasa WEWNETRZNA bez zmian: ponad oceanem bez Portu -> brak; z Portami -> jest.
  const I1 = city('I1', 0, 9), I2 = city('I2', 0, 21);
  eq(refresh([I1, I2], []).length, 0, `${label}7: wewnetrzna ponad oceanem bez Portu -> brak (bez zmian)`);
  const r7 = refresh([I1, I2], [], { built: new Map([['I1', ['port']], ['I2', ['port']]]) });
  eq(r7.length, 1, `${label}7: wewnetrzna z Portami -> jest`);
  eq(refresh([L1, city('L3', 0, 8)], []).length, 1, `${label}7b: wewnetrzna na jednym ladzie -> jest`);

  // 8. Zapis/odczyt: istniejaca trasa zachowana przy kontakcie; kontakt zerwany -> usunieta; wojna -> usunieta.
  const kept = refresh([A, B], r1);
  eq(kept.length, 1, `${label}8: istniejaca trasa zachowana`);
  eq(kept[0] && kept[0].id, r1[0].id, `${label}8: id trasy stabilne`);
  eq(refresh([A, B], r1, { contact: NO_CONTACT }).length, 0, `${label}8: utrata kontaktu usuwa istniejaca trasa`);
  eq(refresh([A, B], r1, { war: WAR }).length, 0, `${label}8: wojna usuwa istniejaca trasa`);
  const json = JSON.parse(JSON.stringify(r1));
  eq(refresh([A, B], json).length, 1, `${label}8: trasa po serializacji (zapis/odczyt) zachowana`);
  // stary zapis: trasa na jednym ladzie zapisana z medium 'morze' nie wyrzuca wyjatku i nie dubluje pary
  const legacy = [{ ...r6[0], medium: 'morze', id: 'L1->L2:morze' }];
  let legacyOut = null, threw = false;
  try { legacyOut = refresh([L1, L2], legacy); } catch (e) { threw = true; }
  assert(!threw, `${label}8: brak wyjatku dla starej trasy`);
  eq(legacyOut && legacyOut.length, 1, `${label}8: stara trasa -> dokladnie 1 trasa na pare (bez duplikatu)`);

  // 9. Nowe trasy powstaja przy kolejnym refresh po nawiazaniu kontaktu.
  const before = refresh([A, B], [], { contact: NO_CONTACT });
  const after = refresh([A, B], before);
  eq(before.length, 0, `${label}9: przed kontaktem 0`);
  eq(after.length, 1, `${label}9: po nawiazaniu kontaktu trasa powstaje przy kolejnym refresh`);

  // 10. Predykaty pomocnicze.
  if (T.externalTradeContactOk) {
    assert(T.externalTradeContactOk([A], [B], true), `${label}10: externalTradeContactOk true`);
    assert(!T.externalTradeContactOk([A], [B], false), `${label}10: externalTradeContactOk false bez kontaktu`);
    assert(!T.externalTradeContactOk([], [B], true), `${label}10: externalTradeContactOk false bez miast`);
    eq(T.diagnoseMissingTradeRouteForPartner(0, 1, [A, B], NO_WAR, false, 'Egipt'), 'brak kontaktu z Egipt', `${label}10: diagnoza brak kontaktu`);
    eq(T.diagnoseMissingTradeRouteForPartner(0, 1, [A, B], NO_WAR, true), null, `${label}10: diagnoza null przy kontakcie (bez warunku polaczenia)`);
  } else {
    assert(false, `${label}10: brak externalTradeContactOk w module`);
  }
}

runSuite(TR, 'T');

// ---------------------------------------------------------------------------
// MUTACJE (tylko dla nowego kodu): kazdy mutant zrodla MUSI zostac wykryty.
// ---------------------------------------------------------------------------
if (process.env.TR_MODULE !== 'old') {
  const srcText = fs.readFileSync(SRC_FILE, 'utf8');
  const mutants = [
    { name: 'M1 kontynuacja ignoruje kontakt', from: 'if (!hasContact(from.ownerId, to.ownerId)) continue;', to: '' },
    { name: 'M2 generacja ignoruje kontakt', from: 'externalTradeContactOk(citiesA, citiesB, hasContact(ownerA, ownerB))', to: 'true' },
    { name: 'M3 medium zawsze lad', from: "landComponentsMayConnect(map, a, b, distance) ? 'lad' : 'morze'", to: "'lad'" },
  ];
  for (const m of mutants) {
    assert(srcText.includes(m.from), `${m.name}: kotwica mutacji istnieje w zrodle`);
    const mutFile = path.resolve(__dirname, '..', 'src', 'game', '.trade-routes-mut.ts');
    fs.writeFileSync(mutFile, srcText.replace(m.from, m.to), 'utf8');
    let caught = false;
    try {
      const MT = bundle('../src/game/.trade-routes-mut', 'mut');
      const p0 = passed, f0 = failed;
      const origErr = console.error; console.error = () => {};
      try { runSuite(MT, 'mut'); } finally { console.error = origErr; }
      caught = failed > f0;
      // odrzuc wynik mutanta z licznikow glownych
      passed = p0; failed = f0;
    } finally { try { fs.unlinkSync(mutFile); } catch (e) { /* ok */ } }
    assert(caught, `${m.name}: mutant WYKRYTY przez testy`);
  }
}

console.log(`trade-routes-contact-only-test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
