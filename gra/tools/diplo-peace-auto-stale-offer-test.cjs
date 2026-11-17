'use strict';
/**
 * diplo-peace-auto-stale-offer-test.cjs -- DIPLO-PEACE-AUTO-NO-CITIES-STALE-OFFER-DIAG-Q1.
 * Zgloszenie wlasciciela 2026-11-17: pokoj z graczem zapadal sam po kilku turach wojny (zmeczenie ~28%),
 * bez okna i bez wpisu „Wazne”. Przyczyna (kod): runWarWearinessTick, galaz `offer_accepted` (cena pokoju
 * spelniona, rowniez przy cenie 0) finalizowala pokoj takze dla pary z graczem poza wymuszeniem 100%.
 *
 * Testy BEHAWIORALNE na realnej funkcji runWarWearinessTick (war-weariness.ts), bez regex na zrodle:
 *   (T1) zmeczenie ~27,5% (11 tur wojny), para gracz<->AI: brak pokoju bez klikniecia gracza (finalize nie wolane, akcja none);
 *   (T1c) kontrola: para AI<->AI w tych samych warunkach DOSTAJE pokoj (test ma realnie dojsc do galezi zapisu);
 *   (T2) zmeczenie 100% (40 tur), para gracz<->AI: pokoj WYMUSZONY (action forced_peace, finalize wolane) — regula zachowana;
 *   (T3) MUTACJA: kopia zrodla bez bramki isPlayerPair (stare zachowanie) -> T1 czerwieni (pokoj po cichu zapada);
 *   (T4) statyczna straznica wiringu: main.ts przekazuje isPlayerPair (tickAiAiWarWeariness) i finalizePeaceTreatyBetween
 *        czysci oferty `pokoj` tej pary (2a); sprawdzone takze przez tsc w bramkach (nie tutaj).
 *
 *   node tools/diplo-peace-auto-stale-offer-test.cjs   # exit 0 = wszystko zielone i mutant wykryty
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = path.resolve(GRA_ROOT, 'src');
const WW = path.join(SRC, 'game', 'war-weariness.ts');
const MAIN = path.join(SRC, 'main.ts');
const TAG = `${process.pid}`;
const ENTRY = path.resolve(__dirname, `.stale-offer-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.stale-offer-${TAG}-bundle.cjs`);
const J = (p) => JSON.stringify(p);

const PLAYER_GATE_LINE = 'if (d.isPlayerPair && d.isPlayerPair(pr.a, pr.b)) { none(); continue; }';

function loadW(src) {
  const MUT = path.join(path.dirname(WW), `.stale-offer-mut-${TAG}.ts`);
  fs.writeFileSync(MUT, src);
  try {
    fs.writeFileSync(ENTRY, `export * as W from ${J(MUT)};\n`);
    esbuild.buildSync({
      entryPoints: [ENTRY], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE,
      logLevel: 'silent', loader: { '.json': 'json' },
    });
  } finally {
    try { fs.unlinkSync(MUT); } catch (_) { /* ignore */ }
    try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
  }
  delete require.cache[BUNDLE];
  return require(BUNDLE).W;
}

const HUMAN = 0;
const AI_A = 2;
const AI_B = 3;
const pairKey = (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`;

/** Jedno wywolanie ticka dla dwoch par (gracz<->AI i AI<->AI) w zadanych turach wojny. */
function tick(W, turnsAtWar, withPlayerGate) {
  const finalized = [];
  const store = new Map();
  const pairs = [{ a: HUMAN, b: AI_A }, { a: AI_A, b: AI_B }];
  const outcomes = W.runWarWearinessTick({
    store,
    turn: 100,
    pairs,
    pairKey,
    ...(withPlayerGate ? { isPlayerPair: (a, b) => a === HUMAN || b === HUMAN } : {}),
    warInfo: () => ({ warStart: 100 - turnsAtWar, turnsAtWar, lostA: 1, lostB: 0, turnsSinceCityChange: 0 }),
    // Przegrywajacy = pr.b (weakerOf), jego udzial 0,3 (<= udzialWyraznie 0,45) -> despair > 0 z samego zmeczenia.
    shareOf: () => 0.7,
    weakerOf: (x, y) => y,
    cityCountOf: () => 6,
    // Cena pokoju spelniona (cena 0 / pelne pokrycie): sciezka `offer_accepted` zapisuje pokoj.
    price: () => ({ requiredPn: 0, balanceFor: () => 0, tolerancePn: 0, loserBalanceFor: () => 0 }),
    assets: () => [],
    cityCessionOk: () => true,
    battlePending: false,
    pay: () => {},
    finalize: (loser, winner) => { finalized.push(pairKey(loser, winner)); },
  });
  return { finalized, outcomes };
}

function runChecks(W) {
  const res = [];
  const chk = (name, ok, extra) => res.push({ name, ok: !!ok, extra });

  // T1: 11 tur wojny (zmeczenie ~0,275 < 1,0) — gracz nie dostaje pokoju bez klikniecia.
  const t1 = tick(W, 11, true);
  const humanT1 = t1.finalized.filter(k => k === pairKey(HUMAN, AI_A));
  chk('T1: zmeczenie ~28% — para gracz<->AI NIE zawiera pokoju bez zgody gracza', humanT1.length === 0,
    { finalized: t1.finalized, outcomes: t1.outcomes.map(o => [o.pairKey, o.action, +o.level.toFixed(3)]) });

  // T1c: kontrola — para AI<->AI w tych samych warunkach zawiera pokoj (test dochodzi do galezi zapisu).
  const aiT1 = t1.finalized.filter(k => k === pairKey(AI_A, AI_B));
  chk('T1c: kontrola — para AI<->AI zawiera pokoj w tych warunkach (galaz offer_accepted osiagalna)',
    aiT1.length === 1, { finalized: t1.finalized });

  // T2: 100% zmeczenia (40 tur) — pokoj wymuszony z graczem nadal zapada (regula wlasciciela 3a).
  const t2 = tick(W, 40, true);
  const humanT2 = t2.finalized.filter(k => k === pairKey(HUMAN, AI_A));
  const forcedHuman = t2.outcomes.find(o => o.pairKey === pairKey(HUMAN, AI_A));
  chk('T2: zmeczenie 100% — pokoj wymuszony z graczem zapada (finalize + action forced_peace)',
    humanT2.length === 1 && forcedHuman && forcedHuman.action === 'forced_peace',
    { finalized: t2.finalized, action: forcedHuman && forcedHuman.action });

  // T3: MUTACJA — kopia zrodla bez bramki isPlayerPair (stare zachowanie): T1 musi czerwienic.
  const orig = fs.readFileSync(WW, 'utf8');
  if (!orig.includes(PLAYER_GATE_LINE)) {
    chk('T3: mutacja — linia bramki isPlayerPair znaleziona w war-weariness.ts', false, 'brak linii');
  } else {
    const mutSrc = orig.replace(PLAYER_GATE_LINE, '/* MUTANT: bramka isPlayerPair usunieta */');
    const WM = loadW(mutSrc);
    // Mutant bez bramki i bez przekazania isPlayerPair = stare zachowanie.
    const tm = tick(WM, 11, false);
    const humanM = tm.finalized.filter(k => k === pairKey(HUMAN, AI_A));
    chk('T3: MUTANT (stare zachowanie) — pokoj z graczem przy 28% zapada po cichu, T1 wykrywa blad',
      humanM.length === 1, { finalized: tm.finalized });
  }

  // T4: statyczna straznica wiringu w main.ts (przekazanie bramki + czyszczenie ofert pokoj przy zawarciu).
  const mainSrc = fs.readFileSync(MAIN, 'utf8');
  chk('T4a: main.ts tickAiAiWarWeariness przekazuje isPlayerPair (gracz)',
    mainSrc.includes('isPlayerPair: (a, b) => a === humanOwner || b === humanOwner'));
  // T4b (statyczny wiring; ZACHOWANIE czyszczenia jest testowane BEHAWIORALNIE w diplo-peace-auto-stale-offer-live-test.cjs S3-S5):
  chk('T4b: finalizePeaceTreatyBetween wola purgeWarDependentNegotiations (pokoj+rozejm tej pary)',
    mainSrc.includes('purgeWarDependentNegotiations(pairKey);')
    && /WAR_DEPENDENT_ACTIONS\.has\(e\.actionId\) && diploPairKey\(e\.proposerOwnerId, e\.responderOwnerId\) === pairKey/.test(mainSrc));
  return res;
}

let W;
try {
  W = loadW(fs.readFileSync(WW, 'utf8'));
} catch (err) {
  console.error('BUILD ERROR:', err && err.message);
  process.exit(2);
}
const results = runChecks(W);
try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
let fail = 0;
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  ' + JSON.stringify(r.extra)}`);
  if (!r.ok) fail++;
}
console.log(`\nPASS=${results.length - fail} FAIL=${fail}`);
process.exit(fail === 0 ? 0 : 1);
