'use strict';
/**
 * ai-war-weariness-peace-test.cjs -- R-WEB-AI-WAR-WEARINESS-PEACE-Q1.
 * Prawdziwe funkcje silnika (esbuild bundle z gra/src): war-weariness.ts (zmeczenie, eskalacja, tick AI-AI)
 * + decideAIDiplomacy (AI przegrywajace z graczem) + straznik okablowania main.ts.
 *
 *   node tools/ai-war-weariness-peace-test.cjs                       # GREEN po zmianie: exit 0
 *   AI_SRC_DIR=<drzewo src bazy> node tools/ai-war-weariness-peace-test.cjs   # RED na bazie (brak modulu)
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = process.env.AI_SRC_DIR ? path.resolve(process.env.AI_SRC_DIR) : path.resolve(GRA_ROOT, 'src');
const J = (p) => JSON.stringify(path.join(SRC, p));
const ENTRY = path.resolve(__dirname, `.aiweary-${process.pid}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.aiweary-${process.pid}-bundle.cjs`);

if (!fs.existsSync(path.join(SRC, 'game/war-weariness.ts'))) {
  console.error('FAIL (RED): brak modulu game/war-weariness.ts w ' + SRC);
  process.exit(1);
}
fs.writeFileSync(ENTRY, [
  `export * as W from ${J('game/war-weariness')};`,
  `export * as L from ${J('game/diplomacy-peace-lock')};`,
  `export { decideAIDiplomacy } from ${J('game/ai')};`,
  `export { peaceOfferAiRequestPn, peaceOfferAiOwnBilans, aiOfferPwSurplusTolerance } from ${J('game/diplomacy-ai-offer-balance')};`,
  `export { treatyBasePnFromConfig, treatyEvalRelationTotal } from ${J('game/diplomacy-proposals')};`,
  `export { requesterShare } from ${J('game/diplomacy-ai-forced-peace')};`,
].join('\n'), 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE,
    absWorkingDir: GRA_ROOT, logLevel: 'silent', resolveExtensions: ['.ts', '.js', '.json'],
  });
} finally { try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ } }
const M = require(BUNDLE);
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
const W = M.W;

let pass = 0; let fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('FAIL:', m); } }
function eq(a, b, m) { ok(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ---- 1. zmeczenie: monotoniczne, ~200 tur => pelne, parametry z JSON ----
let prev = -1; let mono = true;
for (let t = 0; t <= 260; t++) {
  const l = W.warWearinessLevel({ turnsAtWar: t, lostCitiesTotal: 0, turnsSinceCityChange: t });
  if (l < prev) mono = false; prev = l;
}
ok(mono, 'zmeczenie rosnie monotonicznie z dlugoscia wojny');
eq(W.warWearinessLevel({ turnsAtWar: 200, lostCitiesTotal: 0 }), 1, 'po 200 turach zmeczenie pelne');
ok(W.isWarWeary(W.warWearinessLevel({ turnsAtWar: 200, lostCitiesTotal: 0 })), '200 tur => chec pokoju');
ok(!W.isWarWeary(W.warWearinessLevel({ turnsAtWar: 20, lostCitiesTotal: 0, turnsSinceCityChange: 0 })), '20 tur => brak checi (nie rozbija balansu krotkich wojen)');
ok(W.warWearinessLevel({ turnsAtWar: 80, lostCitiesTotal: 4 }) > W.warWearinessLevel({ turnsAtWar: 80, lostCitiesTotal: 0 }), 'straty miast przyspieszaja zmeczenie');
ok(W.warWearinessLevel({ turnsAtWar: 80, lostCitiesTotal: 0, turnsSinceCityChange: 120 }) > W.warWearinessLevel({ turnsAtWar: 80, lostCitiesTotal: 0, turnsSinceCityChange: 10 }), 'brak postepow przyspiesza zmeczenie');
eq(W.WAR_WEARINESS_PARAMS.zmeczenie.pelneTur, 200, 'parametr pelneTur z JSON');
eq(W.WAR_WEARINESS_PARAMS.przegrywajacy.progiStopni.length, 3, 'progi stopni z JSON');

// ---- 2. stan pary: szczyt monotoniczny, reset przy nowej wojnie, round-trip save ----
const store = new Map();
W.stepPairState(store, 'k', 10, 0.7);
W.stepPairState(store, 'k', 10, 0.4);
eq(store.get('k').peak, 0.7, 'szczyt zmeczenia nie spada w tej samej wojnie (stagnacja->zmiana miasta)');
W.stepPairState(store, 'k', 99, 0.1);
eq(store.get('k').peak, 0.1, 'nowa wojna (inny warStart) resetuje stan');
const restored = new Map(JSON.parse(JSON.stringify(Array.from(store.entries()))));
eq(JSON.stringify(Array.from(restored.entries())), JSON.stringify(Array.from(store.entries())), 'save/load: round-trip stanu pary');

// ---- 3. desperacja / stopnie / plan ----
eq(W.loserDespair({ level: 1, share: 0.5, lostCities: 5 }), 0, 'nie przegrywa wyraznie => desperacja 0');
const dA = W.loserDespair({ level: 0.5, share: 0.3, lostCities: 0 });
const dB = W.loserDespair({ level: 1, share: 0.1, lostCities: 3 });
ok(dB > dA, 'desperacja rosnie z zmeczeniem/slaboscia/stratami');
eq(W.despairStage(0), 0, 'stopien 0'); eq(W.despairStage(0.99), 3, 'stopien 3');
eq(W.stageCityLimit(1), 0, 'stopien 1: bez miast'); eq(W.stageCityLimit(2), 1, 'stopien 2: 1 miasto'); eq(W.stageCityLimit(3), 2, 'stopien 3: max 2 miasta');
ok(W.offerMultiplier(3, 0) > W.offerMultiplier(1, 0), 'oferta rosnie ze stopniem');
ok(W.offerMultiplier(1, 3) > W.offerMultiplier(1, 0), 'oferta rosnie z odrzuceniami');
const A = (kind, id, amount, pn, forbidden) => ({ kind, id, amount, pn, forbidden });
const assets = [A('zloto', 'zloto', 100, 100), A('miasto', 'c1', 1, 400), A('miasto', 'c2', 1, 700), A('miasto', 'cap', 1, 9999, true)];
const p1 = W.planEscalatedPeacePayment(900, assets, 0);
eq(p1.histogram.miasto, 0, 'maxCities=0 => bez miast (najpierw zloto/surowce)');
const p2 = W.planEscalatedPeacePayment(900, assets, 2);
ok(p2.histogram.miasto >= 1 && p2.histogram.miasto <= 2 && p2.full, 'miasta dopiero gdy zloto nie wystarcza; limit 2; pokrywa cene');
ok(!p2.items.some(i => i.id === 'cap'), 'stolica/zakazane nigdy nie oddawane');

// ---- 4. tick AI-AI ----
function mkDeps(o) {
  const log = [];
  const deps = {
    store: o.store || new Map(), turn: o.turn, pairs: [{ a: 1, b: 2 }],
    pairKey: (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`,
    warInfo: () => ({ warStart: o.warStart ?? (o.turn - o.turnsAtWar), turnsAtWar: o.turnsAtWar, lostA: o.lostA || 0, lostB: 0, turnsSinceCityChange: o.since ?? o.turnsAtWar }),
    shareOf: (x) => (x === 1 ? o.share1 : 1 - o.share1),
    cityCountOf: () => o.cities ?? 4,
    price: () => ({ requiredPn: 500, balanceFor: (c) => c - (o.winnerNeed ?? 500), tolerancePn: 20 }),
    assets: () => o.assets ?? [],
    cityCessionOk: () => true,
    battlePending: false,
    pay: (l, w, plan) => log.push({ ev: 'pay', l, w, plan }),
    finalize: (l, w, lock) => log.push({ ev: 'peace', l, w, lock }),
  };
  return { deps, log };
}
// 4a. rowna wojna bez konca -> po N turach pokoj
{
  // R-WEB-DIPLO-PEACE-AI-AI-NONNEGATIVE-BALANCE-Q1 (2026-11-09): pokoj z wyczerpania wymaga bilansu >= 0 (winnerNeed: 0).
  const { deps, log } = mkDeps({ turn: 300, turnsAtWar: 200, share1: 0.5, winnerNeed: 0 });
  const r = W.runWarWearinessTick(deps);
  eq(r[0].action, 'mutual_peace', 'rowna wojna 200 tur => pokoj z wyczerpania'); eq(log.filter(x => x.ev === 'peace').length, 1, 'pokoj sfinalizowany');
  eq(deps.store.size, 0, 'stan pary skasowany po pokoju (reset)');
}
{
  // Regula wlasciciela 2026-11-09: ujemny bilans zwyciezcy blokuje takze pokoj z wyczerpania.
  const { deps, log } = mkDeps({ turn: 300, turnsAtWar: 200, share1: 0.5 });
  eq(W.runWarWearinessTick(deps)[0].action, 'none', '4a-NN: rowna wojna 200 tur, bilans zwyciezcy < 0 => brak pokoju');
  eq(log.length, 0, '4a-NN: brak efektow');
}
{
  const { deps, log } = mkDeps({ turn: 300, turnsAtWar: 40, share1: 0.5 });
  eq(W.runWarWearinessTick(deps)[0].action, 'none', 'krotka rowna wojna => bez zmian (zero zmian balansu)'); eq(log.length, 0, 'brak efektow');
}
// 4b. przegrywajacy znacznie: eskalacja gold -> miasto, wygrywajacy akceptuje
{
  const store2 = new Map();
  const base = { share1: 0.15, lostA: 3, turnsAtWar: 150, cities: 4, store: store2, winnerNeed: 900,
    assets: [A('zloto', 'zloto', 100, 100), A('miasto', 'c1', 1, 400), A('miasto', 'c2', 1, 800), A('miasto', 'cap', 1, 9999, true)] };
  const { deps, log } = mkDeps({ ...base, turn: 400 });
  const r = W.runWarWearinessTick(deps);
  ok(['offer_accepted', 'offer_rejected'].includes(r[0].action), 'przegrywajacy skladal oferte');
  ok(r[0].stage >= 2, 'stopien >= 2 przy duzej desperacji');
  if (r[0].action === 'offer_accepted') {
    ok(r[0].plan.histogram.miasto >= 1, 'przegrywajacy oferuje miasto');
    ok(r[0].plan.histogram.miasto <= W.WAR_WEARINESS_PARAMS.przegrywajacy.maxMiastNaPokoj, 'limit miast');
    ok(!r[0].plan.items.some(i => i.id === 'cap'), 'stolica nie oddana');
    eq(log.find(x => x.ev === 'peace').l, 1, 'przegrywa AI1');
  } else ok(false, 'wygrywajacy powinien zaakceptowac oferte z miastem');
}
// 4c. odrzucenie + cooldown + histereza (zwyciezca chce wiecej niz majatek). LIVE-AUDIT-Q1: lostA=2 (<3), bo przy >=3 utratach
// przegrywajacy jest CHRONIONY i zwyciezca musi przyjac (patrz sekcja 5).
{
  const store3 = new Map();
  const o = { warStart: 250, share1: 0.15, lostA: 2, turnsAtWar: 150, store: store3, winnerNeed: 999999, assets: [A('zloto', 'zloto', 50, 50)] };
  let { deps } = mkDeps({ ...o, turn: 400 });
  const r1 = W.runWarWearinessTick(deps);
  eq(r1[0].action, 'offer_rejected', 'oferta za mala => odrzucona');
  const st1 = store3.get('1-2');
  ({ deps } = mkDeps({ ...o, turn: 401 }));
  const r2 = W.runWarWearinessTick(deps);
  eq(r2[0].action, 'none', 'cooldown: brak spamu ofert');
  ({ deps } = mkDeps({ ...o, turn: 404 }));
  const r3 = W.runWarWearinessTick(deps);
  eq(r3[0].action, 'offer_rejected', 'po cooldownie kolejna oferta');
  eq(store3.get('1-2').rejectedOffers, 2, 'licznik odrzuconych rosnie (eskalacja mnoznika)');
  ok(store3.get('1-2').stage >= st1.stage, 'stopien nie spada (histereza)');
}
// 4d. ostatnie miasto nigdy
{
  const { deps } = mkDeps({ turn: 400, turnsAtWar: 190, share1: 0.05, lostA: 5, cities: 1, winnerNeed: 700,
    assets: [A('zloto', 'zloto', 100, 100), A('miasto', 'c1', 1, 800)] });
  const r = W.runWarWearinessTick(deps);
  ok(!(r[0].plan && r[0].plan.histogram.miasto > 0), '1 miasto => nigdy nie oddaje miasta');
}
// 4e. determinizm
{
  const run = () => { const { deps } = mkDeps({ turn: 400, turnsAtWar: 150, share1: 0.15, lostA: 3, winnerNeed: 900,
    assets: [A('zloto', 'zloto', 100, 100), A('miasto', 'c1', 1, 400), A('miasto', 'c2', 1, 800)] });
    return JSON.stringify(W.runWarWearinessTick(deps)); };
  eq(run(), run(), 'determinizm ticku');
}

// 4f. wyjscie awaryjne (zarzut 2): przegrywajacy za biedny, wygrywajacy wyczerpany => po serii odrzucen pokoj mimo niedoboru
{
  const store4 = new Map();
  const o = { warStart: 250, share1: 0.15, lostA: 2, turnsAtWar: 150, store: store4, winnerNeed: 999999, assets: [A('zloto', 'zloto', 50, 50)] };
  const acts = [];
  let peaceLog = [];
  for (const t of [400, 404, 408, 412]) {
    const { deps, log } = mkDeps({ ...o, turn: t });
    acts.push(W.runWarWearinessTick(deps)[0].action);
    peaceLog = peaceLog.concat(log);
  }
  eq(acts.slice(0, 3).join(','), 'offer_rejected,offer_rejected,offer_rejected', '4f: pierwsze 3 oferty odrzucone (za malo)');
  // R-WEB-DIPLO-PEACE-AI-AI-NONNEGATIVE-BALANCE-Q1 (2026-11-09): wyjscie awaryjne NIE omija ujemnego bilansu zwyciezcy.
  eq(acts[3], 'offer_rejected', '4f: po odrzuceniach i pelnym zmeczeniu pokoj NIE wchodzi przy ujemnym bilansie zwyciezcy');
  ok(!peaceLog.some(x => x.ev === 'peace'), '4f: pokoj niesfinalizowany');
  eq(store4.size, 1, '4f: stan pary zachowany (wojna trwa)');
}
// 4g. wyjscie awaryjne NIE dziala przy niskim zmeczeniu (zero zmian balansu krotkich wojen)
{
  const store5 = new Map();
  const o = { warStart: 380, share1: 0.15, lostA: 1, turnsAtWar: 90, store: store5, winnerNeed: 999999, assets: [A('zloto', 'zloto', 50, 50)] };
  const acts = [];
  for (const t of [470, 474, 478, 482, 486]) { const { deps } = mkDeps({ ...o, turn: t, warStart: 380, turnsAtWar: 90 }); acts.push(W.runWarWearinessTick(deps)[0].action); }
  ok(!acts.includes('offer_accepted'), '4g: zmeczenie < progWzajemnyPokoj => brak kapitulacji bez pokrycia ceny');
}
// 4g-TEN: auto-pokój jest zablokowany przez elapsed 0..9, a szczyt zmęczenia nadal rośnie;
// ten sam typ auto-rozstrzygnięcia może wejść dokładnie od elapsed 10.
{
  const store10 = new Map();
  const o = { warStart: 100, share1: 0.5, lostA: 1000, store: store10, winnerNeed: 0 };
  const { deps: d9 } = mkDeps({ ...o, turn: 109, turnsAtWar: 9 });
  eq(W.runWarWearinessTick(d9)[0].action, 'none', '4g-TEN: elapsed 9 blokuje automatyczny pokój');
  eq(store10.get('1-2').peak, 1, '4g-TEN: zmęczenie nadal nalicza się w elapsed 9');
  const { deps: d10 } = mkDeps({ ...o, turn: 110, turnsAtWar: 10 });
  eq(W.runWarWearinessTick(d10)[0].action, 'mutual_peace', '4g-TEN: elapsed 10 zwalnia automatyczny pokój');
}
// 4h. realna wycena (peaceOfferAiRequestPn / OwnBilans / tolerancja / baza z konfiguracji) zamiast atrap
{
  const basePn = M.treatyBasePnFromConfig('pokoj');
  ok(basePn > 0, '4h: baza PW pokoju z konfiguracji > 0');
  const relTotal = M.treatyEvalRelationTotal({ zaufanie: 0, respekt: 0, status: 'wojna' });
  const req = M.peaceOfferAiRequestPn(0, 0, relTotal, basePn, 'normal');
  const tol = M.aiOfferPwSurplusTolerance('normal');
  const real = (o) => {
    const { deps, log } = mkDeps({ ...o });
    deps.price = () => ({ requiredPn: req, balanceFor: (c) => M.peaceOfferAiOwnBilans(0, c, relTotal, basePn), tolerancePn: tol });
    return { r: W.runWarWearinessTick(deps), log };
  };
  const rich = [A('zloto', 'zloto', 100000, 100000), A('miasto', 'c1', 1, 400), A('miasto', 'c2', 1, 800)];
  const x = real({ turn: 400, turnsAtWar: 150, share1: 0.15, lostA: 3, assets: rich });
  eq(x.r[0].action, 'offer_accepted', '4h: realna wycena - bogaty przegrywajacy kupuje pokoj');
  const y = real({ turn: 400, turnsAtWar: 150, share1: 0.15, lostA: 3, assets: [A('zloto', 'zloto', 1, 1)] });
  ok(['offer_rejected', 'offer_accepted'].includes(y.r[0].action), '4h: realna wycena - biedny przegrywajacy sklada oferte (bez wyjatku)');
}
// 4i. skala udzialu: rw (ai.ts) i requesterShare (main.ts) to ten sam ulamek own/(own+other) -> ta sama desperacja
{
  const rwScale = 300 / (300 + 700);
  eq(M.requesterShare(300, 700), rwScale, '4i: requesterShare = potAI/(potAI+potPlr) (ta sama skala co respektWzgledny)');
  eq(W.loserDespair({ level: 0.7, share: M.requesterShare(300, 700), lostCities: 2 }), W.loserDespair({ level: 0.7, share: rwScale, lostCities: 2 }), '4i: desperacja identyczna dla obu zrodel udzialu');
}
// 4j. cena pokoju zadana od gracza maleje z zmeczeniem (zarzut 3)
{
  eq(W.wearinessPeacePriceFactor(0), 1, '4j: brak zmeczenia => pelna cena');
  eq(W.wearinessPeacePriceFactor(0.5), 1, '4j: na progu chetnosci => pelna cena');
  ok(W.wearinessPeacePriceFactor(0.8) < 1 && W.wearinessPeacePriceFactor(0.8) > W.wearinessPeacePriceFactor(1), '4j: rabat rosnie monotonicznie');
  ok(Math.abs(W.wearinessPeacePriceFactor(1) - (1 - W.WAR_WEARINESS_PARAMS.czlowiek.rabatCenyPokojuMax)) < 1e-9, '4j: przy pelnym zmeczeniu rabat = rabatCenyPokojuMax');
}

// ---- 5. AI przegrywajace z graczem: eskalacja oferty miasta ----
function runAI({ rw, turnsAtWar, lost = 0, miastaAI }) {
  const rel = {
    partnerId: '0', relation: { zaufanie: 5, respekt: 5, status: 'wojna' }, respektWzgledny: rw, stanWojny: true,
    peaceLocked: false, hasNapTreaty: false, partnerTypCywilizacji: 'rzymianie', turnsAtWar, lostCitiesInWar: lost,
    zdobyteMiastaPartnera: lost, turnsSinceCityChange: turnsAtWar, miastaPartnera: [],
  };
  return M.decideAIDiplomacy({ myPlayerId: '1', relacje: [rel], agresja: 0.5, agresywnoscRaw: 5, ekspansywnosc: 3,
    miastaAI, myTypCywilizacji: 'grecy', currentTurn: 60, skarbiecGold: 0, sklonnoscDoPodboju: 2 });
}
const CITIES = [{ cityId: 'a', cityPn: 400, zakazane: false }, { cityId: 'b', cityPn: 900, zakazane: false }];
const cession = (cmds) => cmds.find(c => c.type === 'oferuj_miasto_za_pokoj');
ok(cession(runAI({ rw: 0.30, turnsAtWar: 10, miastaAI: CITIES })) === undefined, 'krotka wojna rw 0.30: bez oddania miasta (balans nietkniety)');
ok(cession(runAI({ rw: 0.12, turnsAtWar: 10, miastaAI: CITIES })) === undefined, 'bazowo <3 miasta => brak oddania w krotkiej wojnie');
ok(cession(runAI({ rw: 0.12, turnsAtWar: 200, lost: 3, miastaAI: CITIES })) !== undefined, '200 tur + straty: AI oddaje miasto (eskalacja, 2 miasta wystarcza)');
ok(cession(runAI({ rw: 0.12, turnsAtWar: 200, lost: 3, miastaAI: CITIES.slice(0, 1) })) === undefined, 'jedno miasto => nigdy nie oddaje');

// ---- 6. straznik okablowania main.ts ----
const propTs = fs.readFileSync(path.join(SRC, 'game/diplomacy-proposals.ts'), 'utf8');
ok(/wearinessPeacePriceFactor\(warWearinessLevel\(/.test(propTs), 'diplomacy-proposals: rabat ceny pokoju z zmeczenia podpiety do bramki R5');

const mainTs = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
ok(/runWarWearinessTick\(/.test(mainTs) && /tickAiAiWarWeariness\(aiTurnAwaitingBattle\)/.test(mainTs), 'main.ts: tick zmeczenia wywolany po fazie AI');
ok(/warWearinessByPairKey: Array\.from\(warWearinessByPairKey\.entries\(\)\)/.test(mainTs), 'main.ts: stan w save');
ok(/saved\.meta\?\.warWearinessByPairKey/.test(mainTs), 'main.ts: stan z save');
ok(/warWearinessByPairKey\.delete\(diploPairKey\(proposerId, responderId\)\)/.test(mainTs), 'main.ts: reset przy pokoju');

// 6b. wojny wymuszone epoki (zarzut 6): pokoj z zmeczenia idzie przez finalizePeaceTreatyBetween, ktory ustawia blokade do nastepnej epoki
{
  const m = mainTs.match(/function finalizePeaceTreatyBetween\([\s\S]*?\n    \}\n/);
  ok(m && /forcedEraPeaceUntilNextEraByPairKey\.set\(pairKey/.test(m[0]) && m[0].indexOf('forcedEraPeaceUntilNextEraByPairKey.set') < m[0].indexOf('applyDiploEventTracked'), '6b: finalizePeaceTreatyBetween ustawia blokade epoki PRZED zmiana relacji');
  const t = mainTs.match(/function tickAiAiWarWeariness[\s\S]*?\n    \}\n/);
  ok(t && /finalizePeaceTreatyBetween\(loser, winner, lockTurns\)/.test(t[0]), '6b: tick zmeczenia konczy wojne wylacznie przez finalizePeaceTreatyBetween (istniejace reguly wojen wymuszonych)');
}

// ---- 7. LIVE-AUDIT-Q1: wczesna oferta przegrywajacego, ochrona przed snowballem, symetria (realny runWarWearinessTick) ----
{
  const gold = (n) => [A('zloto', 'zloto', n, n)];
  const cityAssets = [A('zloto', 'zloto', 300, 300), A('miasto', 'c1', 1, 400), A('miasto', 'c2', 1, 500), A('miasto', 'cap', 1, 9999, true)];
  // 7a. wyraznie przegrywajacy po utracie miasta oferuje pokoj BEZ czekania na zmeczenie pary (30 tur wojny: zmeczenie < progChetnosci)
  {
    const { deps } = mkDeps({ turn: 130, turnsAtWar: 30, since: 10, share1: 0.2, lostA: 1, cities: 6, winnerNeed: 300, assets: gold(600) });
    const r = W.runWarWearinessTick(deps)[0];
    ok(!W.isWarWeary(r.level), '7a: zmeczenie pary < progChetnosci');
    ok(r.action === 'offer_accepted' || r.action === 'offer_rejected', '7a: przegrywajacy sklada oferte mimo niskiego zmeczenia (bylo: none)');
  }
  // 7b. bardzo krotka wojna / brak strat przed ofertaBezStratOdTur => bez oferty (zero zmian balansu krotkich wojen)
  {
    const { deps } = mkDeps({ turn: 105, turnsAtWar: 5, share1: 0.1, lostA: 1, cities: 6, winnerNeed: 300, assets: gold(600) });
    eq(W.runWarWearinessTick(deps)[0].action, 'none', '7b: < ofertaOdTurWojny => none');
    const { deps: d2 } = mkDeps({ turn: 120, turnsAtWar: 15, share1: 0.1, lostA: 0, cities: 6, winnerNeed: 300, assets: gold(600) });
    eq(W.runWarWearinessTick(d2)[0].action, 'none', '7b: brak strat i < ofertaBezStratOdTur => none');
  }
  // 7c. ochrona: przegrywajacy z <= ochronaMaxMiast miastami po utracie miasta -> zwyciezca MUSI przyjac (nawet gdy zada ogromna cene), bez oddawania miast
  {
    // winnerNeed: 0 = bilans zwyciezcy nieujemny (regula 2026-11-09); ochrona dziala tylko przy bilansie >= 0.
    const { deps, log } = mkDeps({ turn: 140, turnsAtWar: 40, since: 5, share1: 0.2, lostA: 1, cities: 3, winnerNeed: 0, assets: cityAssets });
    const r = W.runWarWearinessTick(deps)[0];
    eq(W.runWarWearinessTick(mkDeps({ turn: 140, turnsAtWar: 40, since: 5, share1: 0.2, lostA: 1, cities: 3, winnerNeed: 999999, assets: cityAssets }).deps)[0].action,
      'offer_rejected', '7c-NN: ochrona NIE wymusza pokoju przy ujemnym bilansie zwyciezcy');
    eq(r.action, 'offer_accepted', '7c: chroniony przegrywajacy => pokoj (bilans zwyciezcy >= 0)');
    eq(r.plan.histogram.miasto, 0, '7c: z 3 miast (= minMiastPoOddaniu) nie oddaje zadnego');
    ok(log.some(x => x.ev === 'peace'), '7c: pokoj sfinalizowany');
  }
  // 7d. ochrona po >= ochronaUtratyWojny utratach, nawet z duza liczba miast; oddaje co najwyzej tyle, by zostalo >= minMiastPoOddaniu
  {
    const { deps } = mkDeps({ turn: 140, turnsAtWar: 60, since: 3, share1: 0.1, lostA: 3, cities: 5, winnerNeed: 0, assets: cityAssets });
    const r = W.runWarWearinessTick(deps)[0];
    eq(r.action, 'offer_accepted', '7d: 3 utraty => zwyciezca musi przyjac');
    ok(r.plan.histogram.miasto <= 5 - W.WAR_WEARINESS_PARAMS.przegrywajacy.minMiastPoOddaniu, '7d: po oddaniu zostaje >= minMiastPoOddaniu miast');
  }
  // 7e. NIE chroniony (6 miast, 1 utrata) i cena nie do pokrycia => zwykla wycena (odrzucenie), brak przymusu
  {
    const { deps } = mkDeps({ turn: 130, turnsAtWar: 30, since: 10, share1: 0.2, lostA: 1, cities: 6, winnerNeed: 999999, assets: gold(100) });
    eq(W.runWarWearinessTick(deps)[0].action, 'offer_rejected', '7e: bez ochrony zwyciezca moze odrzucic');
  }
  // 7f. przebieg wojny w czasie (realne ticki): przegrywajacy traci miasto co 6 tur od tury 10 (z 9 miast); wojna konczy sie POKOJEM,
  //     zanim zostanie zlikwidowany, a przegrywajacy zachowuje >= 5 miast (bez ochrony stare progi nie ruszaly przed ~100. tura wojny).
  {
    const store = new Map(); let cities = 9; let peaceAt = null; let lost = 0;
    for (let tw = 1; tw <= 120 && peaceAt === null; tw++) {
      if (tw >= 10 && (tw - 10) % 6 === 0 && cities > 0) { cities--; lost++; }
      const { deps, log } = mkDeps({ turn: 100 + tw, warStart: 100, turnsAtWar: tw, since: (tw - 10) % 6, share1: 0.12, lostA: lost, cities, winnerNeed: 0, assets: cityAssets, store });
      W.runWarWearinessTick(deps);
      if (log.some(x => x.ev === 'peace')) peaceAt = tw;
    }
    ok(peaceAt !== null && peaceAt <= 40, `7f: wojna konczy sie pokojem w <= 40 turach (byla: ${peaceAt})`);
    ok(cities >= 5, `7f: przegrywajacy zachowuje >= 5 miast (ma ${cities}) - brak eliminacji`);
  }
  // 7g. symetria: to samo niedoboru ceny zwyciezca akceptuje przy duzym zmeczeniu, a odrzuca przy malym
  {
    const o = { share1: 0.3, lostA: 1, cities: 6, winnerNeed: 500, assets: gold(300) };
    const lo = W.runWarWearinessTick(mkDeps({ ...o, turn: 130, turnsAtWar: 30, since: 5 }).deps)[0];
    const hi = W.runWarWearinessTick(mkDeps({ ...o, turn: 330, turnsAtWar: 160, since: 5 }).deps)[0];
    eq(lo.action, 'offer_rejected', '7g: male zmeczenie => niedobor ceny odrzucony');
    // R-WEB-DIPLO-PEACE-AI-AI-NONNEGATIVE-BALANCE-Q1 (2026-11-09): tolerancja zmeczenia nie obniza progu ponizej bilansu 0.
    eq(hi.action, 'offer_rejected', '7g: duze zmeczenie NIE akceptuje niedoboru (bilans zwyciezcy < 0 zawsze blokuje pokoj AI<->AI)');
  }
  // 7h. parametry z JSON (zaden prog nie jest zahardkodowany)
  const PP = W.WAR_WEARINESS_PARAMS.przegrywajacy;
  ok(PP.ochronaMaxMiast > 0 && PP.ochronaUtratyWojny > 0 && PP.ofertaOdTurWojny > 0 && PP.tolerancjaZmeczenia > 0, '7h: nowe progi w war-weariness-params.json');
  // 7i. parametr karencji z JSON + tick przekazuje go do finalize (zarzut 1 r2: bylo domyslne 10 tur => re-wojna po ~10 turach)
  ok(PP.karencjaPoPokojuTur > M.L.PEACE_TREATY_LOCK_TURNS, `7i: karencjaPoPokojuTur (${PP.karencjaPoPokojuTur}) > domyslne ${M.L.PEACE_TREATY_LOCK_TURNS}`);
  {
    const { deps, log } = mkDeps({ turn: 130, turnsAtWar: 30, since: 10, share1: 0.2, lostA: 1, cities: 6, winnerNeed: 300, assets: gold(600) });
    W.runWarWearinessTick(deps);
    eq(log.find(x => x.ev === 'peace').lock, PP.karencjaPoPokojuTur, '7i: oferta niechronionego -> finalize z karencja z JSON');
    const { deps: dp, log: lp } = mkDeps({ turn: 140, turnsAtWar: 40, since: 5, share1: 0.2, lostA: 1, cities: 3, winnerNeed: 0, assets: cityAssets });
    W.runWarWearinessTick(dp);
    eq(lp.find(x => x.ev === 'peace').lock, PP.karencjaChronionegoTur, '7i: pokoj chronionego -> dluzsza karencja (karencjaChronionegoTur)');
    ok(PP.karencjaChronionegoTur > PP.karencjaPoPokojuTur, '7i: karencja chronionego > zwykla');
    const { deps: d2, log: l2 } = mkDeps({ turn: 300, turnsAtWar: 200, share1: 0.5, winnerNeed: 0 });
    W.runWarWearinessTick(d2);
    eq(l2.find(x => x.ev === 'peace').lock, PP.karencjaPoPokojuTur, '7i: pokoj z wyczerpania -> finalize z karencja z JSON');
  }
  // 7j. wielowojenny cykl tej samej pary (zarzut 1/5 r2): agresor wypowiada wojne, gdy tylko wolno (realne startPeaceTreatyLock/isPeaceTreatyLocked);
  //     przegrywajacy traci miasto co 6 tur wojny. Odstep pokoj->re-wojna >= karencja; przy starej karencji 10 tur przegrywajacy traci wiecej miast.
  {
    const run = (lockOverride) => {
      const store = new Map(); let cities = 12; let meta = {}; let atWar = false; let warStart = 0;
      let lostTotal = 0; let lostInWar = 0; const gaps = []; let lastPeace = null; let wars = 0;
      for (let t = 1; t <= 300; t++) {
        if (!atWar && !M.L.isPeaceTreatyLocked(meta, t) && cities > 0) {
          atWar = true; warStart = t; lostInWar = 0; wars++;
          if (lastPeace !== null) gaps.push(t - lastPeace);
        }
        if (!atWar) continue;
        const tw = t - warStart;
        if (tw >= 10 && (tw - 10) % 6 === 0 && cities > 0) { cities--; lostTotal++; lostInWar++; }
        const { deps } = mkDeps({ turn: t, warStart, turnsAtWar: tw, since: (tw - 10) % 6, share1: 0.12, lostA: lostInWar, cities, winnerNeed: 0, assets: cityAssets, store });
        deps.finalize = (l, w, lock) => {  meta = M.L.startPeaceTreatyLock(meta, t, lockOverride ?? lock); atWar = false; lastPeace = t; };
        W.runWarWearinessTick(deps);
      }
      return { gaps, lostTotal, cities, wars };
    };
    const real = run(undefined); const old = run(M.L.PEACE_TREATY_LOCK_TURNS);
    ok(real.gaps.length >= 1 && real.gaps.every(g => g >= PP.karencjaPoPokojuTur), `7j: odstep pokoj->re-wojna >= ${PP.karencjaPoPokojuTur} (chronieni: ${PP.karencjaChronionegoTur}) (gaps ${JSON.stringify(real.gaps)})`);
    ok(old.gaps.some(g => g < PP.karencjaPoPokojuTur), '7j: kontrola - przy karencji 10 re-wojna wraca szybciej');
    ok(real.lostTotal < old.lostTotal, `7j: dluzsza karencja => mniej utraconych miast w 300 turach (${real.lostTotal} vs ${old.lostTotal})`);
    ok(real.cities >= 3, `7j: przegrywajacy zachowuje >= 3 miasta po 300 turach (serial re-wojen nie eliminuje) (${real.cities} miast, wojen ${real.wars})`);
    console.log(`7j: karencja ${PP.karencjaPoPokojuTur}: wojen ${real.wars}, utracone ${real.lostTotal}, zostalo ${real.cities}; karencja 10: wojen ${old.wars}, utracone ${old.lostTotal}, zostalo ${old.cities}`);
  }
}

console.log(`ai-war-weariness-peace-test: PASS=${pass} FAIL=${fail}`);
process.exit(fail ? 1 : 0);
