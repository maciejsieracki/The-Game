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
  `export { decideAIDiplomacy } from ${J('game/ai')};`,
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
    finalize: (l, w) => log.push({ ev: 'peace', l, w }),
  };
  return { deps, log };
}
// 4a. rowna wojna bez konca -> po N turach pokoj
{
  const { deps, log } = mkDeps({ turn: 300, turnsAtWar: 200, share1: 0.5 });
  const r = W.runWarWearinessTick(deps);
  eq(r[0].action, 'mutual_peace', 'rowna wojna 200 tur => pokoj z wyczerpania'); eq(log.filter(x => x.ev === 'peace').length, 1, 'pokoj sfinalizowany');
  eq(deps.store.size, 0, 'stan pary skasowany po pokoju (reset)');
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
// 4c. odrzucenie + cooldown + histereza (zwyciezca chce wiecej niz majatek)
{
  const store3 = new Map();
  const o = { warStart: 250, share1: 0.15, lostA: 3, turnsAtWar: 150, store: store3, winnerNeed: 999999, assets: [A('zloto', 'zloto', 50, 50)] };
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
const mainTs = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
ok(/runWarWearinessTick\(/.test(mainTs) && /tickAiAiWarWeariness\(aiTurnAwaitingBattle\)/.test(mainTs), 'main.ts: tick zmeczenia wywolany po fazie AI');
ok(/warWearinessByPairKey: Array\.from\(warWearinessByPairKey\.entries\(\)\)/.test(mainTs), 'main.ts: stan w save');
ok(/saved\.meta\?\.warWearinessByPairKey/.test(mainTs), 'main.ts: stan z save');
ok(/warWearinessByPairKey\.delete\(diploPairKey\(proposerId, responderId\)\)/.test(mainTs), 'main.ts: reset przy pokoju');

console.log(`ai-war-weariness-peace-test: PASS=${pass} FAIL=${fail}`);
process.exit(fail ? 1 : 0);
