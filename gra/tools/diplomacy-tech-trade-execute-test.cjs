'use strict';
/**
 * diplomacy-tech-trade-execute-test.cjs — P-HANDEL-TECH-BLOKADA-AKCJA6-ASYMETRIA-Q1
 * (runda 2, 2026-08-09). B2 (Evaluator runda 1 FAIL — „zero pokrycia mutacyjnego
 * okablowania"): runda 1 testowała WYŁĄCZNIE czystą funkcję `resolveTechTradeParties`,
 * nigdy czy jej wynik jest faktycznie poprawnie UŻYTY w wykonaniu deala — mutacja
 * Evaluatora w `executeTechTradeDeal` (grant zawsze do responderId, gotówka zawsze
 * proposer→responder — DOKŁADNIE błąd który commit miał naprawić) przeżyła CAŁY pakiet
 * 29 testów rundy 1.
 *
 * Ten plik woła `executeTechTradeDealCore` (game/diplomacy-tech-trade.ts) — DOKŁADNIE tę
 * samą orkiestrację, którą main.ts::executeTechTradeDeal woła jako cienki wrapper (patrz
 * main.ts) — z REALNYMI `grantTechToOwner` (diplomacy-basket-transfer.ts) i REALNYM
 * `applyOneShotGoldTransfer` (diplomacy-economy.ts), podpiętymi pod lekki in-memory
 * skarbiec/kontekst zamiast całego main.ts. To NIE jest test samej czystej funkcji
 * pomocniczej (resolveTechTradeParties) — to test FAKTYCZNEGO okablowania wykonania.
 *
 * ROZSZERZENIE (runda 2, decyzja właściciela — pełny zakres
 * R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1, TWARDA GRANICA C-025 zawężająca do wyłącznie
 * gotówki ZNIESIONA): sekcje 7-11 pokrywają tryb 'tech' (wymiana technologia-za-technologię).
 *
 * ROZSZERZENIE (runda 3, Evaluator FAIL — BLOKER 2 „druga połowa exploita rundy 1"):
 * `canGrantTech`/`grantTech` walidowały WYŁĄCZNIE odbiorcę technologii, dawca (`granterId`)
 * nigdy nie był sprawdzany w ŻADNYM trybie zapłaty — deal z nieznaną `techId` po stronie
 * dawcy tworzył technologię ZNIKĄD u odbiorcy. WSZYSTKIE scenariusze happy-path W TYM PLIKU
 * musiały zostać poprawione, żeby jawnie nadawać dawcy znajomość `techId` PRZED wykonaniem —
 * wcześniejsza wersja tego pliku (runda 2) niechcący wykorzystywała dokładnie tę lukę
 * (granter nigdy nie musiał znać sprzedawanej technologii, testy i tak przechodziły).
 * Sekcje 12-15 pokrywają nowy warunek wprost.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

const BUNDLE = path.resolve(__dirname, '.dip-tech-trade-exec-bundle.cjs');
const entry = path.resolve(__dirname, '.dip-tech-trade-exec-entry.ts');
fs.writeFileSync(entry, `
export { executeTechTradeDealCore, resolveTechTradeParties } from '../src/game/diplomacy-tech-trade.ts';
export { grantTechToOwner, createEmptyBasketTransferContext } from '../src/game/diplomacy-basket-transfer.ts';
export { applyOneShotGoldTransfer } from '../src/game/diplomacy-economy.ts';
`);

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const {
  executeTechTradeDealCore,
  grantTechToOwner,
  createEmptyBasketTransferContext,
  applyOneShotGoldTransfer,
} = require(BUNDLE);

// ---------------------------------------------------------------------------
// Harness: skarbiec + kontekst tech w pamięci, podpięte pod TE SAME realne funkcje
// silnika (grantTechToOwner / applyOneShotGoldTransfer) co main.ts.
// ---------------------------------------------------------------------------
function makeTreasury(initial) {
  const balances = new Map(Object.entries(initial).map(([k, v]) => [Number(k), v]));
  return {
    getPieniadze: (id) => balances.get(id) ?? 0,
    add: (id, delta) => balances.set(id, (balances.get(id) ?? 0) + delta),
    snapshot: () => Object.fromEntries(balances),
  };
}

function makeHarness(initialGold, initialKnownByOwner) {
  const treasury = makeTreasury(initialGold);
  const ctxBox = { ctx: createEmptyBasketTransferContext() };
  for (const [ownerId, techIds] of Object.entries(initialKnownByOwner ?? {})) {
    for (const techId of techIds) {
      const r = grantTechToOwner(techId, Number(ownerId), ctxBox.ctx);
      ctxBox.ctx = r.context;
    }
  }
  const cancelReasons = [];
  const deps = {
    getGold: (id) => treasury.getPieniadze(id),
    transferGold: (from, to, amount) => { applyOneShotGoldTransfer(from, to, amount, treasury); },
    ownerHasTech: (ownerId, techId) => (ctxBox.ctx.researchedByOwner.get(ownerId) ?? new Set()).has(techId),
    canGrantTech: (techId, toOwnerId) => {
      const r = grantTechToOwner(techId, toOwnerId, ctxBox.ctx);
      return { granted: r.granted, reason: r.reason }; // BEZ mutacji — ctxBox.ctx NIE nadpisany
    },
    grantTech: (techId, toOwnerId) => {
      const r = grantTechToOwner(techId, toOwnerId, ctxBox.ctx);
      ctxBox.ctx = r.context;
      return { granted: r.granted, reason: r.reason };
    },
    onCancelled: (reason) => cancelReasons.push(reason),
  };
  return {
    treasury,
    deps,
    cancelReasons,
    knows: (ownerId, techId) => (ctxBox.ctx.researchedByOwner.get(ownerId) ?? new Set()).has(techId),
  };
}

console.log('diplomacy-tech-trade-execute-test');

// =========================================================================
// 1 — Happy path SELL: proponent (0), który ZNA 'Kolo', sprzedaje ją respondentowi (1)
//     za 50 ¤. Respondent (1) płaci, proponent (0) dostaje zapłatę, respondent dostaje tech.
//     Dawca (proponent, granterId w trybie 'sell') MUSI znać 'Kolo' od startu (runda 3,
//     BLOKER 2) — inaczej ownerHasTech(granterId) odrzuca deal PRZED czymkolwiek innym.
// =========================================================================
{
  const h = makeHarness({ 0: 0, 1: 100 }, { 0: ['Kolo'] });
  const executed = executeTechTradeDealCore(0, 1, 'Kolo', 50, 'sell', 'gold', undefined, h.deps);
  ok(executed === true, 'SELL: deal wykonany (true)');
  ok(h.knows(1, 'Kolo'), 'SELL: respondent (1) dostaje technologię');
  ok(h.treasury.getPieniadze(1) === 50, 'SELL: respondent (płatnik) traci 50 ¤ (100→50)');
  ok(h.treasury.getPieniadze(0) === 50, 'SELL: proponent (odbiorca zapłaty) dostaje 50 ¤');
  ok(h.cancelReasons.length === 0, 'SELL: brak anulowania');
}

// =========================================================================
// 2 — Happy path BUY: proponent (0) KUPUJE 'Zelazo' od respondenta (1, który ZNA 'Zelazo')
//     za 60 ¤. Proponent (0) płaci, proponent (0) dostaje tech, respondent (1) dostaje
//     zapłatę. (Odwrotność scenariusza 1 — to jest DOKŁADNIE test, który łapie mutację
//     „kierunek odwrócony": grant zawsze do responder + gotówka zawsze proposer→responder
//     dałby TU przypadkiem poprawny wynik gotówkowy, ale BŁĘDNY grant — patrz sekcja 6.)
//     Dawca (respondent, granterId w trybie 'buy') MUSI znać 'Zelazo' od startu (BLOKER 2).
// =========================================================================
{
  const h = makeHarness({ 0: 100, 1: 0 }, { 1: ['Zelazo'] });
  const executed = executeTechTradeDealCore(0, 1, 'Zelazo', 60, 'buy', 'gold', undefined, h.deps);
  ok(executed === true, 'BUY: deal wykonany (true)');
  ok(h.knows(0, 'Zelazo'), 'BUY: proponent (0, kupujący) dostaje technologię');
  ok(h.treasury.getPieniadze(0) === 40, 'BUY: proponent (płatnik) traci 60 ¤ (100→40)');
  ok(h.treasury.getPieniadze(1) === 60, 'BUY: respondent (odbiorca zapłaty) dostaje 60 ¤');
  ok(h.cancelReasons.length === 0, 'BUY: brak anulowania');
}

// =========================================================================
// 3 — B1 (exploit): BUY, dawca (respondent) ZNA 'Brąz' (żeby test wyłapywał WYŁĄCZNIE oś
//     środków, nie mieszał się z BLOKER 2), ale płatnik (proponent=0) ma 0 ¤, cena 50 ¤.
//     CAŁY deal anulowany: ZERO transferu technologii, ZERO transferu gotówki (dokładnie
//     scenariusz Evaluatora „gracz ma 0 ¤, cena 50 ¤ → dostaje technologię za darmo").
// =========================================================================
{
  const h = makeHarness({ 0: 0, 1: 200 }, { 1: ['Brąz'] });
  const executed = executeTechTradeDealCore(0, 1, 'Brąz', 50, 'buy', 'gold', undefined, h.deps);
  ok(executed === false, 'B1 BUY bez środków: deal NIE wykonany (false)');
  ok(!h.knows(0, 'Brąz'), 'B1 BUY bez środków: proponent NIE dostaje technologii za darmo');
  ok(h.treasury.getPieniadze(0) === 0 && h.treasury.getPieniadze(1) === 200, 'B1 BUY bez środków: skarbce BEZ ZMIAN (zero częściowego transferu)');
  ok(h.cancelReasons.length === 1 && /środk/i.test(h.cancelReasons[0]), 'B1 BUY bez środków: komunikat o anulowaniu z powodu braku środków');
}

// =========================================================================
// 4 — B1 (exploit), strona SELL: dawca (proponent) ZNA 'Zelazo' (izolacja od BLOKER 2), ale
//     płatnik (respondent=1) ma 0 ¤. Gracz NIE oddaje technologii za darmo (drugi ze
//     scenariuszy Evaluatora: „gracz oddaje technologię i NIC nie dostaje" — tu naprawione:
//     gracz jej NIE oddaje wcale).
// =========================================================================
{
  const h = makeHarness({ 0: 500, 1: 0 }, { 0: ['Zelazo'] });
  const executed = executeTechTradeDealCore(0, 1, 'Zelazo', 50, 'sell', 'gold', undefined, h.deps);
  ok(executed === false, 'B1 SELL bez środków respondenta: deal NIE wykonany (false)');
  ok(!h.knows(1, 'Zelazo'), 'B1 SELL bez środków respondenta: respondent NIE dostaje technologii za darmo');
  ok(h.treasury.getPieniadze(0) === 500 && h.treasury.getPieniadze(1) === 0, 'B1 SELL bez środków respondenta: skarbce BEZ ZMIAN');
}

// =========================================================================
// 5 — grantTech odrzuca (odbiorca już zna technologię) MIMO że płatnik MA środki I dawca
//     (proponent) ZNA 'Kolo': zero transferu gotówki mimo wypłacalności — dowód że kolejność
//     jest zapłata-PRZED-grantem, a odrzucenie grantu też anuluje CAŁY deal.
// =========================================================================
{
  const h = makeHarness({ 0: 0, 1: 500 }, { 0: ['Kolo'], 1: ['Kolo'] });
  const executed = executeTechTradeDealCore(0, 1, 'Kolo', 50, 'sell', 'gold', undefined, h.deps);
  ok(executed === false, 'grant odrzucony (już zbadana): deal NIE wykonany mimo wypłacalności płatnika');
  ok(h.treasury.getPieniadze(1) === 500, 'grant odrzucony: gotówka respondenta NIETKNIĘTA (zero transferu mimo środków)');
  ok(h.cancelReasons.length === 1 && /zbadan/i.test(h.cancelReasons[0]), 'grant odrzucony: komunikat wspomina przyczynę silnika (już zbadana)');
}

// =========================================================================
// 6 — DOWÓD MUTACYJNY (wbudowany, C-027-style): wariant executeTechTradeDealCore
//     odtwarzający DOKŁADNIE mutację Evaluatora z rundy 1 — „grant zawsze do
//     responderId, gotówka zawsze proposer→responder", ignorując kierunek. Uruchamiamy
//     GO SAMEGO (nie naprawiony kod) na scenariuszu BUY z sekcji 2 i potwierdzamy, że
//     wynik NIE zgadza się z tym, czego oczekuje ten pakiet testów — to jest dowód że
//     asercje sekcji 2 REALNIE łapią tę mutację, a nie przechodzą przypadkiem.
// =========================================================================
{
  function buggyExecuteTechTradeDealCore_R1Mutation(proposerId, responderId, techId, gold, _direction, deps) {
    // Runda 1: main.ts::executeTechTradeDeal grantował zawsze do responderId i (przed
    // naprawą kolejności) przelewał gotówkę zawsze proposer→responder, bez patrzenia na
    // `direction` w ogóle (parametr ignorowany celowo w tej mutacji).
    if (!techId) return false;
    const grant = deps.grantTech(techId, responderId);
    if (!grant.granted) { deps.onCancelled('anulowany'); return false; }
    if (gold > 0) deps.transferGold(proposerId, responderId, gold);
    return true;
  }

  // 6a — tryb BUY (scenariusz 2): mutacja gubi kierunek GRANTU (grant zawsze do
  // responder, mimo że w 'buy' powinien trafić do proponenta-kupującego).
  const hBuy = makeHarness({ 0: 100, 1: 0 }, { 1: ['Zelazo'] });
  buggyExecuteTechTradeDealCore_R1Mutation(0, 1, 'Zelazo', 60, 'buy', hBuy.deps);
  const mutantGaveTechToWrongParty = hBuy.knows(1, 'Zelazo') && !hBuy.knows(0, 'Zelazo');
  ok(mutantGaveTechToWrongParty, 'DOWÓD MUTACYJNY: mutacja rundy 1 (kierunek odwrócony) faktycznie przyznaje tech złej stronie w trybie BUY');

  // 6b — tryb SELL (scenariusz 1): mutacja gubi kierunek GOTÓWKI (zawsze proponent→
  // respondent, mimo że w 'sell' płaci respondent, a proponent-sprzedawca INKASUJE).
  const hSell = makeHarness({ 0: 100, 1: 0 }, { 0: ['Zelazo'] });
  buggyExecuteTechTradeDealCore_R1Mutation(0, 1, 'Zelazo', 60, 'sell', hSell.deps);
  const mutantMovedGoldWrongWay = hSell.treasury.getPieniadze(0) === 40 && hSell.treasury.getPieniadze(1) === 60;
  ok(mutantMovedGoldWrongWay, 'DOWÓD MUTACYJNY: mutacja rundy 1 faktycznie przelewa gotówkę w złą stronę w trybie SELL (proponent-sprzedawca płaci zamiast inkasować)');
  // A więc: podstawione w miejsce prawdziwego executeTechTradeDealCore, ta mutacja
  // złamałaby asercje sekcji 1 (SELL: kto płaci/inkasuje) i sekcji 2 (BUY: kto dostaje
  // technologię) — formalny dowód, że ten pakiet ją łapie na OBU osiach (grant + gotówka).
}

// =========================================================================
// 7 — Happy path tech-za-tech, SELL: proponent (0, ZNA 'Kolo') oddaje 'Kolo', dostaje
//     'Zelazo' od respondenta (1, ZNA 'Zelazo') w zamian. Bez przepływu gotówki
//     (diplomacy.json „Wymiana bezpłatna"). payer===grantee (1, dostaje 'Kolo') oddaje
//     'Zelazo' -> payee===granter (0). Oba dawcy (główna tech + zapłata-tech) muszą znać
//     swoje odpowiednio oddawane technologie (BLOKER 2 + kontrola techOfferId już istniejąca).
// =========================================================================
{
  const h = makeHarness({ 0: 0, 1: 0 }, { 0: ['Kolo'], 1: ['Zelazo'] });
  const executed = executeTechTradeDealCore(0, 1, 'Kolo', 0, 'sell', 'tech', 'Zelazo', h.deps);
  ok(executed === true, 'tech-za-tech SELL: deal wykonany (true)');
  ok(h.knows(1, 'Kolo'), 'tech-za-tech SELL: respondent (1) dostaje główną technologię (Kolo)');
  ok(h.knows(0, 'Zelazo'), 'tech-za-tech SELL: proponent (0) dostaje technologię-zapłatę (Zelazo) w zamian');
  ok(h.treasury.getPieniadze(0) === 0 && h.treasury.getPieniadze(1) === 0, 'tech-za-tech SELL: BEZ przepływu gotówki (0/0 bez zmian)');
  ok(h.cancelReasons.length === 0, 'tech-za-tech SELL: brak anulowania');
}

// =========================================================================
// 8 — Happy path tech-za-tech, BUY: proponent (0) dostaje 'Brąz' od respondenta (1, ZNA
//     'Brąz'), płaci własną technologią 'Ceramika' (ZNA ją) w zamian (analogon scenariusza
//     2, tryb 'tech').
// =========================================================================
{
  const h = makeHarness({ 0: 0, 1: 0 }, { 0: ['Ceramika'], 1: ['Brąz'] });
  const executed = executeTechTradeDealCore(0, 1, 'Brąz', 0, 'buy', 'tech', 'Ceramika', h.deps);
  ok(executed === true, 'tech-za-tech BUY: deal wykonany (true)');
  ok(h.knows(0, 'Brąz'), 'tech-za-tech BUY: proponent (0, kupujący) dostaje główną technologię (Brąz)');
  ok(h.knows(1, 'Ceramika'), 'tech-za-tech BUY: respondent (1) dostaje technologię-zapłatę (Ceramika) w zamian');
  ok(h.treasury.getPieniadze(0) === 0 && h.treasury.getPieniadze(1) === 0, 'tech-za-tech BUY: BEZ przepływu gotówki');
}

// =========================================================================
// 9 — B1 rozszerzone (tech-za-tech): dawca głównej technologii (proponent) ZNA 'Kolo'
//     (izolacja od BLOKER 2 — testujemy TYLKO oś techOfferId), ale oddający zapłatę
//     (respondent) NIE POSIADA oferowanej 'Zelazo' — dokładny analogon „płatnik bez
//     środków" dla trybu tech. CAŁY deal anulowany: ZERO transferu w OBU kierunkach.
// =========================================================================
{
  const h = makeHarness({ 0: 0, 1: 0 }, { 0: ['Kolo'] }); // respondent (1) NIE zna 'Zelazo' mimo że je oferuje
  const executed = executeTechTradeDealCore(0, 1, 'Kolo', 0, 'sell', 'tech', 'Zelazo', h.deps);
  ok(executed === false, 'tech-za-tech, oddający bez technologii: deal NIE wykonany (false)');
  ok(!h.knows(1, 'Kolo'), 'tech-za-tech, oddający bez technologii: respondent NIE dostaje głównej technologii za darmo');
  ok(!h.knows(0, 'Zelazo'), 'tech-za-tech, oddający bez technologii: proponent nic nie dostaje (której respondent nie miał)');
  ok(h.cancelReasons.length === 1 && /nie posiada oferowanej/i.test(h.cancelReasons[0]), 'tech-za-tech, oddający bez technologii: komunikat wskazuje konkretnie na OFEROWANĄ technologię (odróżnia od BLOKER 2 głównej)');
}

// =========================================================================
// 10 — B1 rozszerzone (tech-za-tech): oddający MA technologię, dawca głównej (proponent)
//     ZNA 'Kolo' (izolacja od BLOKER 2), ale odbiorca zapłaty (proponent) już ZNA 'Zelazo' —
//     canGrantTech(counter) odrzuca -> CAŁY deal anulowany, w tym GŁÓWNA technologia (Kolo)
//     NIE trafia do respondenta mimo że jej grant sam w sobie by się powiódł — dowód
//     atomowości (podgląd OBU grantów PRZED zatwierdzeniem któregokolwiek).
// =========================================================================
{
  const h = makeHarness({ 0: 0, 1: 0 }, { 0: ['Kolo', 'Zelazo'], 1: ['Zelazo'] }); // proponent JUŻ zna Zelazo
  const executed = executeTechTradeDealCore(0, 1, 'Kolo', 0, 'sell', 'tech', 'Zelazo', h.deps);
  ok(executed === false, 'tech-za-tech, odbiorca zapłaty już ją zna: deal NIE wykonany (false)');
  ok(!h.knows(1, 'Kolo'), 'tech-za-tech, odbiorca zapłaty już ją zna: GŁÓWNA technologia (Kolo) TEŻ nie trafia do respondenta (atomowość)');
}

// =========================================================================
// 11 — DOWÓD MUTACYJNY (tech-za-tech): wariant pomijający `ownerHasTech` (oddający
//     technologii-zapłaty NIGDY nie jest weryfikowany, jakby scenariusz 9 miał się udać) —
//     dowód że asercja scenariusza 9 („deal NIE wykonany") REALNIE łapie brak tej kontroli.
// =========================================================================
{
  function buggyExecuteTechTradeDealCore_NoOwnershipCheck(proposerId, responderId, techId, direction, techOfferId, deps) {
    const parties = direction === 'buy'
      ? { granteeId: proposerId, payeeId: responderId }
      : { granteeId: responderId, payeeId: proposerId };
    // BRAK deps.ownerHasTech(...) — dokładnie luka, którą sekcja 9 ma łapać.
    deps.grantTech(techId, parties.granteeId);
    deps.grantTech(techOfferId, parties.payeeId);
    return true;
  }
  const h = makeHarness({ 0: 0, 1: 0 }, { 0: ['Kolo'] });
  const executed = buggyExecuteTechTradeDealCore_NoOwnershipCheck(0, 1, 'Kolo', 'sell', 'Zelazo', h.deps);
  // Pod tą mutacją deal „się udaje" mimo że respondent nigdy nie posiadał 'Zelazo' —
  // proponent dostaje technologię znikąd (darmowa, dokładnie klasa exploita z B1).
  const mutantGrantedTechFromNowhere = executed === true && h.knows(0, 'Zelazo');
  ok(mutantGrantedTechFromNowhere, 'DOWÓD MUTACYJNY: pominięcie ownerHasTech(payer) pozwala przyznać technologię-zapłatę, której oddający nigdy nie posiadał (dokładnie scenariusz 9)');
}

// =========================================================================
// 12 — BLOKER 2 (Evaluator runda 3, druga połowa exploita rundy 1) — tryb Gotówka, SELL:
//     proponent „sprzedaje" 'Kolo', KTÓREJ NIE ZNA. Respondent MA środki (100 ¤) i CHCE
//     zapłacić. CAŁY deal musi być anulowany: respondent NIE dostaje technologii znikąd,
//     ZERO transferu gotówki (dawniej: AI dostawała tech z niczego, gracz i tak inkasował).
// =========================================================================
{
  const h = makeHarness({ 0: 0, 1: 100 }, {}); // proponent (0) NIE zna 'Kolo'
  const executed = executeTechTradeDealCore(0, 1, 'Kolo', 50, 'sell', 'gold', undefined, h.deps);
  ok(executed === false, 'BLOKER 2 SELL x Gotówka, dawca bez technologii: deal NIE wykonany (false)');
  ok(!h.knows(1, 'Kolo'), 'BLOKER 2 SELL x Gotówka: respondent NIE dostaje technologii znikąd');
  ok(h.treasury.getPieniadze(0) === 0 && h.treasury.getPieniadze(1) === 100, 'BLOKER 2 SELL x Gotówka: skarbce BEZ ZMIAN — proponent NIE inkasuje mimo że deal się nie odbył');
  ok(h.cancelReasons.length === 1 && /dawca nie posiada/i.test(h.cancelReasons[0]), 'BLOKER 2 SELL x Gotówka: komunikat wskazuje na dawcę (odróżnia od komunikatu o braku środków)');
}

// =========================================================================
// 13 — BLOKER 2, tryb Gotówka, BUY: proponent „kupuje" 'Brąz' od respondenta, KTÓREJ
//     respondent NIE ZNA. Proponent MA środki. CAŁY deal anulowany.
// =========================================================================
{
  const h = makeHarness({ 0: 200, 1: 0 }, {}); // respondent (1) NIE zna 'Brąz'
  const executed = executeTechTradeDealCore(0, 1, 'Brąz', 50, 'buy', 'gold', undefined, h.deps);
  ok(executed === false, 'BLOKER 2 BUY x Gotówka, dawca bez technologii: deal NIE wykonany (false)');
  ok(!h.knows(0, 'Brąz'), 'BLOKER 2 BUY x Gotówka: proponent NIE dostaje technologii znikąd');
  ok(h.treasury.getPieniadze(0) === 200 && h.treasury.getPieniadze(1) === 0, 'BLOKER 2 BUY x Gotówka: skarbce BEZ ZMIAN');
}

// =========================================================================
// 14 — BLOKER 2, tryb Technologia, SELL: proponent „sprzedaje" 'Kolo' (nie zna), respondent
//     oferuje w zamian 'Zelazo' (którą realnie posiada — izolacja od techOfferId-check
//     sekcji 9). Deal anulowany z powodu dawcy GŁÓWNEJ technologii, ZANIM cokolwiek innego
//     się wykona — obie technologie zostają nietknięte.
// =========================================================================
{
  const h = makeHarness({ 0: 0, 1: 0 }, { 1: ['Zelazo'] }); // proponent (0) NIE zna 'Kolo'
  const executed = executeTechTradeDealCore(0, 1, 'Kolo', 0, 'sell', 'tech', 'Zelazo', h.deps);
  ok(executed === false, 'BLOKER 2 SELL x Technologia, dawca głównej bez technologii: deal NIE wykonany (false)');
  ok(!h.knows(1, 'Kolo'), 'BLOKER 2 SELL x Technologia: respondent NIE dostaje głównej technologii znikąd');
  ok(h.knows(1, 'Zelazo') && !h.knows(0, 'Zelazo'), 'BLOKER 2 SELL x Technologia: technologia-zapłata (Zelazo) zostaje NIETKNIĘTA u respondenta (zero wymiany)');
  ok(h.cancelReasons.length === 1 && /dawca nie posiada/i.test(h.cancelReasons[0]), 'BLOKER 2 SELL x Technologia: komunikat o dawcy głównej technologii (nie o techOfferId)');
}

// =========================================================================
// 15 — DOWÓD MUTACYJNY (BLOKER 2): wariant pomijający kontrolę dawcy głównej technologii
//     (`ownerHasTech(granterId, techId)`) — dokładnie luka opisana przez Evaluatora rundy 3.
//     Uruchomiony na scenariuszu 12 (SELL x Gotówka, dawca bez technologii) potwierdza że
//     BEZ tej kontroli respondent dostałby technologię znikąd I proponent by inkasował.
// =========================================================================
{
  function buggyExecuteTechTradeDealCore_NoGranterCheck(proposerId, responderId, techId, gold, direction, deps) {
    // Dokładnie ta sama logika co executeTechTradeDealCore w trybie 'gold', ALE bez
    // ownerHasTech(granterId, techId) — luka BLOKER 2 (Evaluator runda 3).
    const parties = direction === 'buy'
      ? { granteeId: proposerId, payerId: proposerId, payeeId: responderId }
      : { granteeId: responderId, payerId: responderId, payeeId: proposerId };
    if (gold > 0 && deps.getGold(parties.payerId) < gold) { deps.onCancelled('brak środków'); return false; }
    const grant = deps.grantTech(techId, parties.granteeId);
    if (!grant.granted) { deps.onCancelled('odrzucone'); return false; }
    if (gold > 0) deps.transferGold(parties.payerId, parties.payeeId, gold);
    return true;
  }
  const h = makeHarness({ 0: 0, 1: 100 }, {}); // dokładnie setup sekcji 12 — proponent NIE zna 'Kolo'
  const executedUnderMutant = buggyExecuteTechTradeDealCore_NoGranterCheck(0, 1, 'Kolo', 50, 'sell', h.deps);
  const mutantCreatedTechFromNowhereAndPaid =
    executedUnderMutant === true && h.knows(1, 'Kolo') && h.treasury.getPieniadze(0) === 50 && h.treasury.getPieniadze(1) === 50;
  ok(mutantCreatedTechFromNowhereAndPaid, 'DOWÓD MUTACYJNY (BLOKER 2): pominięcie ownerHasTech(granterId) pozwala „sprzedać" nieznaną technologię — respondent dostaje ją znikąd I proponent inkasuje (dokładnie scenariusz 12)');
}

// =========================================================================
// 16 — N-A (Evaluator runda 3, nota nieblokująca — obrona ostatniej linii): guard
//     `techOfferId === techId` w RDZENIU (`executeTechTradeDealCore`) jest dziś połknięty
//     wcześniej przez `evaluateProposal:1205` (na normalnej ścieżce gry propozycja z takim
//     payloadem nigdy nie dotrze do wykonania) — ale rdzeń MUSI to łapać SAM, bez polegania
//     na warstwie wyżej (np. legacy save z uszkodzonym payloadem, wołanie core wprost).
//     Bez tej asercji guard mógłby zniknąć po cichu przy przyszłym refaktorze.
// =========================================================================
{
  const h = makeHarness({ 0: 0, 1: 0 }, { 0: ['Kolo'], 1: ['Kolo'] }); // obie strony znają 'Kolo' - gdyby guard nie zadziałał, oba granty by przeszły
  const executed = executeTechTradeDealCore(0, 1, 'Kolo', 0, 'sell', 'tech', 'Kolo', h.deps);
  ok(executed === false, 'N-A: rdzeń SAM odrzuca techOfferId === techId (wymiana technologii na samą siebie), bez polegania na evaluateProposal');
  ok(h.cancelReasons.length === 1 && /prawidłowej technologii/i.test(h.cancelReasons[0]), 'N-A: komunikat o anulowaniu z powodu nieprawidłowej technologii-zapłaty');
}

try { fs.unlinkSync(entry); } catch (_) {}
try { fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`\ndiplomacy-tech-trade-execute-test: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
