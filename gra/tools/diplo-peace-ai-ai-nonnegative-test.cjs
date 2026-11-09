'use strict';
/**
 * diplo-peace-ai-ai-nonnegative-test.cjs -- R-WEB-DIPLO-PEACE-AI-AI-NONNEGATIVE-BALANCE-Q1 (runda 1).
 * Decyzja wlasciciela (ABC D1, 2026-11-09): pokoj proponowany GRACZOWI przez AI zostaje akceptowalny przy ujemnym
 * bilansie gracza; pokoj/rozejm AI<->AI nie moze byc zawarty, gdy bilans PW ktorejkolwiek z dwoch AI jest ujemny.
 * Uruchamia PRAWDZIWA logike (runAiAiPeaceTick, runWarWearinessTick) na wartosciach bilansu; wyjatek gracza
 * chroni dodatkowo diplo-peace-balance-accept-test.cjs (B) uruchamiany osobno.
 * Run: node tools/diplo-peace-ai-ai-nonnegative-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(GRA, 'src', `.dip-ai-ai-nn-entry-${process.pid}.ts`);
const BUNDLE = path.resolve(__dirname, `.dip-ai-ai-nn-${process.pid}.cjs`);
let pass = 0; let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
fs.writeFileSync(ENTRY, [
  "export { runAiAiPeaceTick, registerAiPeaceRequest, isAiAiPeaceBalanceAllowed, aiAiPeaceRequiredPn, AI_AI_PEACE_MIN_BALANCE } from './game/diplomacy-ai-forced-peace';",
  "export { runWarWearinessTick } from './game/war-weariness';",
  "export { WAR_PEACE_PARAMS } from './game/diplomacy-war-peace-profile';",
  '',
].join('\n'), 'utf8');
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE,
    absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent' });
} finally { try { fs.unlinkSync(ENTRY); } catch (_) { /* ok */ } }
const M = require(BUNDLE);
try { fs.unlinkSync(BUNDLE); } catch (_) { /* ok */ }

// ---- 0. prog w pliku danych ----
check('N0: prog min bilansu AI<->AI z JSON (pokojAiAi.minBilansPW = 0)',
  M.WAR_PEACE_PARAMS.pokojAiAi.minBilansPW === 0 && M.AI_AI_PEACE_MIN_BALANCE === 0, M.WAR_PEACE_PARAMS.pokojAiAi);
{
  const src = fs.readFileSync(path.join(GRA, 'src/game/diplomacy-ai-forced-peace.ts'), 'utf8');
  check('N0b: kod czyta prog z JSON (pokojAiAi), bez sztywnej liczby', /pokojAiAi/.test(src));
}

// ---- 1. predykat ----
check('N1: bilans 0/0 dozwolony', M.isAiAiPeaceBalanceAllowed(0, 0));
check('N2: bilans zwyciezcy -1 zabroniony', !M.isAiAiPeaceBalanceAllowed(-1, 10));
check('N3: bilans przegranego -1 zabroniony', !M.isAiAiPeaceBalanceAllowed(10, -1));
check('N4: brak bilansu przegranego -> sprawdza tylko zwyciezce', M.isAiAiPeaceBalanceAllowed(5, undefined));
check('N5: cena podniesiona do bilansu >= 0',
  M.aiAiPeaceRequiredPn(10, -50) === 50 && M.aiAiPeaceRequiredPn(80, -50) === 80 && M.aiAiPeaceRequiredPn(0, 30) === 0);

// ---- 2. tick prosby AI<->AI (prawdziwy runAiAiPeaceTick) ----
function runTick({ winnerGap, loserGap, turnsSince = 0, gate = 'ok', gold = 1000, kind = 'pokoj' }) {
  const store = new Map();
  M.registerAiPeaceRequest(store, '1-2', 2, 1, 10, kind); // loser=2, winner=1
  let finalized = null; let paid = null;
  const out = M.runAiAiPeaceTick({
    store, turn: 10 + turnsSince,
    pairEligible: () => true,
    requesterShareOf: () => 0.3,
    gateVerdict: () => gate,
    price: () => ({
      requiredPn: M.aiAiPeaceRequiredPn(0, winnerGap),
      balanceFor: c => winnerGap + c,
      loserBalanceFor: c => loserGap - c,
      tolerancePn: 20,
    }),
    assets: () => (gold > 0 ? [{ kind: 'zloto', id: 'zloto', amount: gold, pn: gold }] : []),
    cityCessionOk: () => true,
    battlePending: false,
    pay: (l, w, plan) => { paid = plan; },
    finalize: (l, w, k) => { finalized = { l, w, k }; },
  });
  return { out, finalized, paid };
}
{
  const r = runTick({ winnerGap: 0, loserGap: 100 });
  check('T1: AI<->AI, bilanse nieujemne -> pokoj zawarty', r.finalized !== null && r.out[0].action === 'accept_paid', r.out[0]);
}
{
  const r = runTick({ winnerGap: -80, loserGap: 200, gold: 1000 });
  check('T2: bilans zwyciezcy ujemny przed zaplata, zaplata go wyrownuje -> zgoda', r.finalized !== null && r.paid.coveredPn >= 80, r.out[0]);
}
{
  const r = runTick({ winnerGap: -80, loserGap: 200, gold: 30 });
  check('T3: przegrany nie ma czym zaplacic, bilans zwyciezcy < 0 -> ODMOWA', r.finalized === null && r.out[0].action === 'wait', r.out[0]);
}
{
  const r = runTick({ winnerGap: 0, loserGap: 10, gold: 1000 });
  check('T4: bilans przegranego nieujemny -> zgoda', r.finalized !== null, r.out[0]);
}
{
  const r = runTick({ winnerGap: -80, loserGap: 50, gold: 1000 });
  check('T5: zaplata zrobilaby bilans PRZEGRANEGO ujemnym -> ODMOWA', r.finalized === null, r.out[0]);
}
{
  const r = runTick({ winnerGap: -80, loserGap: 200, gold: 30, turnsSince: 5 });
  check('T6: po limicie tur wymuszenie NIE omija ujemnego bilansu (regula wlasciciela)', r.finalized === null && r.out[0].action === 'wait', r.out[0]);
}
{
  const r = runTick({ winnerGap: 0, loserGap: 100, turnsSince: 5, gate: 'stronger' });
  check('T7: brak regresji -- po limicie przy bilansach >= 0 wymuszenie dziala', r.finalized !== null && r.out[0].action === 'force', r.out[0]);
}
{
  const r = runTick({ winnerGap: 0, loserGap: 100, kind: 'rozejm' });
  check('T8: rozejm AI<->AI nieujemny -> zgoda', r.finalized !== null && r.finalized.k === 'rozejm');
  const r2 = runTick({ winnerGap: -10, loserGap: 100, kind: 'rozejm', gold: 0 });
  check('T9: rozejm AI<->AI z ujemnym bilansem i bez majatku -> odmowa', r2.finalized === null);
}

// ---- 3. zmeczenie wojna (runWarWearinessTick) ----
function weariness({ winnerGap, loserGap, gold = 1000 }) {
  const store = new Map();
  let finalized = null;
  const out = M.runWarWearinessTick({
    store, turn: 300,
    pairs: [{ a: 1, b: 2 }],
    pairKey: (a, b) => `${a}-${b}`,
    warInfo: () => ({ warStart: 0, turnsAtWar: 300, lostA: 0, lostB: 4, turnsSinceCityChange: 50 }),
    shareOf: (x) => (x === 1 ? 0.8 : 0.2),
    cityCountOf: () => 1,
    price: () => ({
      requiredPn: M.aiAiPeaceRequiredPn(0, winnerGap),
      balanceFor: c => winnerGap + c,
      loserBalanceFor: c => loserGap - c,
      tolerancePn: 20,
    }),
    assets: () => (gold > 0 ? [{ kind: 'zloto', id: 'zloto', amount: gold, pn: gold }] : []),
    cityCessionOk: () => true,
    battlePending: false,
    pay: () => {},
    finalize: (l, w) => { finalized = { l, w }; },
  });
  return { out, finalized };
}
{
  const ok = weariness({ winnerGap: 0, loserGap: 100 });
  check('W1: ochrona przegrywajacego, bilanse >= 0 -> pokoj', ok.finalized !== null, ok.out);
  const bad = weariness({ winnerGap: -500, loserGap: 100, gold: 10 });
  check('W2: ochrona przegrywajacego NIE wymusza pokoju przy ujemnym bilansie zwyciezcy', bad.finalized === null, bad.out);
  const bad2 = weariness({ winnerGap: -50, loserGap: 10, gold: 1000 });
  check('W3: pokoj za cene nie moze zrobic bilansu przegranego ujemnym', bad2.finalized === null, bad2.out);
}

// ---- 4. wyjatek gracza nietkniety ----
{
  const props = fs.readFileSync(path.join(GRA, 'src/game/diplomacy-proposals.ts'), 'utf8');
  const ui = fs.readFileSync(path.join(GRA, 'src/ui/diplomacyAcceptanceBalance.ts'), 'utf8');
  check('P1: sciezki gracza-odbiorcy (diplomacy-proposals, UI) nie znaja reguly AI<->AI', !/AiAiPeace|pokojAiAi/.test(props) && !/AiAiPeace|pokojAiAi/.test(ui));
}

console.log(`\n${pass} PASS, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
