'use strict';
/**
 * diplo-tick-war-brake-test.cjs — R-WEB-DIPLO-TICK-WAR-BRAKE-Q1 r2.
 * Test wiringu silnika (P3/P4/P6/P7) na źródle main.ts + mutacje w pamięci:
 * każda mutacja usuwa jeden hak i MUSI czerwienić odpowiedni check.
 * Pure-logic (P6/P7 funkcje) pokrywa tools/diplo-tick-war-brake-unit-test.cjs.
 * Run: node tools/diplo-tick-war-brake-test.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MAIN = fs.readFileSync(path.resolve(ROOT, 'src', 'main.ts'), 'utf8');
const MODULE = fs.readFileSync(path.resolve(ROOT, 'src', 'game', 'diplomacy-tick-war-brake.ts'), 'utf8');

let pass = 0;
let fail = 0;
function check(name, ok) {
  if (ok) pass++;
  else { fail++; console.log(`FAIL ${name}`); }
}
const has = (src, s) => src.includes(s);

// Każdy check: nazwa + predykat na źródle main.ts (i module).
const CHECKS = [
  ['flaga domyslnie OFF', (m, mod) => /DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT = false/.test(mod)],
  ['P3: pary AI-AI tickowane za flaga', (m) => has(m, 'if (brakeOn) {\n        // P3: pary AI↔AI') && has(m, 'tickDiploAiAiPairsWithBrake();')],
  ['P3: AI-AI dostaje TickCtx z buildDiplomacyTickCtxForPair', (m) => has(m, 'tickDiplomacy(cur as any, buildDiplomacyTickCtxForPair(a, b))')],
  ['P3: Wiarygodnosc AI-AI = srednia (Z2)', (m) => has(m, '(getWiarygodnosc(a) + getWiarygodnosc(b)) / 2')],
  ['P4: dobraWolaAktywna w TickCtx pary gracz-AI', (m) => has(m, 'dobraWolaAktywna: diploBrakeBonusFlags(ME(), ownerId).dobraWolaAktywna')],
  ['P4: wspolnyWrog w TickCtx pary gracz-AI', (m) => has(m, 'wspolnyWrog: diploBrakeBonusFlags(ME(), ownerId).wspolnyWrog')],
  ['P4: UI (buildDiplomacyTickCtxForPair) = silnik', (m) => has(m, 'const brakeFlags = diploBrakeBonusFlags(a, b);') && has(m, 'dobraWolaAktywna: brakeFlags.dobraWolaAktywna')],
  ['P4: dobra wola nie liczona podwojnie (odliczanie w end-turn)', (m) => has(m, 'P4: +1 dobrej woli liczy już tickDiplomacy')],
  ['P4: wspolny wrog = wojna z tym samym przeciwnikiem lub WspolnaWalka', (m) => has(m, 'diploSharedEnemyOrBarbarianCoop') && has(m, "getDiploRelation(a, c).status === 'wojna' && getDiploRelation(b, c).status === 'wojna'")],
  ['P6: licznik kryzysu gracz-AI po tickDiplomacy', (m) => has(m, 'if (isDiploTickWarBrakeEnabled()) diploBrakeCrisisStep(ME(), ownerId, relTicked.zaufanie ?? 0);')],
  ['P6: histereza = advanceCrisisCounter', (m, mod) => has(m, 'advanceCrisisCounter(diplomacyCrisisCounters.get(key) ?? 0, zaufanie, diploTickP6)') && has(mod, 'const counter = prev + 1;') && /counter: 0, warningActive: false/.test(mod)],
  ['P6: kolejka wojen po N turach (end-turn)', (m) => has(m, 'processDiploCrisisQueue();') && has(m, 'if (counter >= n) ready.push')],
  ['P6: R1/R2 bramka wypowiedzenia', (m) => has(m, 'if (diploCrisisWarGateBlocked(declarer, victim)) continue;') && has(m, 'return evaluateInterCivWarGate({')],
  ['P6: strona silniejsza wypowiada (pickWarDeclarer)', (m) => has(m, 'pickWarDeclarer(')],
  ['P6: pokoj blokuje wypowiedzenie', (m) => has(m, 'if (isPeaceLockedBetween(e.ownerA, e.ownerB)) continue;')],
  ['P6: ostrzezenie gracza (licznik >= N-2)', (m) => has(m, 'counter >= warnAt && counter < n') && has(m, 'tur do wypowiedzenia')],
  ['P6: zapis licznika w save (flaga ON)', (m) => has(m, 'diplomacyCrisisCounters: Object.fromEntries(diplomacyCrisisCounters.entries())')],
  ['P6: odczyt licznika w load (stary zapis = 0)', (m) => has(m, 'parseCrisisCounters(saved.meta?.diplomacyCrisisCounters)')],
  ['P7: bonus z realnych dostaw (applyCyclicDeliveryOutcome ok)', (m) => has(m, 'if (brakeOn && ok) {') && has(m, 'applyDiploP7Bonuses(p7Delivered)')],
  ['P7: barter tylko przy bothOk', (m) => has(m, 'if (brakeOn && bothOk) {')],
  ['P7: sufit/limit/krok w tradeTrustBonusPerTura', (m, mod) => has(mod, 'Math.min(surowy, p.wymianaMaxPerTura, headroom)') && has(mod, 'if (!(headroom > 0)) return 0;')],
  ['P7: DECYZJA 1 (zaliczka tylko za 1 ture)', (m) => has(m, 'diploAcceptanceTrustPn(givePn, receivePn, dealTurnsMult)') && has(m, 'diploAcceptanceTrustPn(givePn, receivePn, oneShotTurnsMult)')],
  ['P7: seria kasowana bez dostawy', (m) => has(m, 'if (!delivered.has(key)) diplomacyTradeStreak.delete(key);')],
];

// Mutacje: (nazwa, transformacja {main, mod} -> {main, mod}, check, który MUSI polec)
const MUT_MAIN = (re, to) => ({ main, mod }) => ({ main: main.replace(re, to), mod });
const MUT_MOD = (re, to) => ({ main, mod }) => ({ main, mod: mod.replace(re, to) });
const MUTATIONS = [
  ['usuniete P3 (tick AI-AI)', MUT_MAIN('tickDiploAiAiPairsWithBrake();', ''), 'P3: pary AI-AI tickowane za flaga'],
  ['usuniete P4 (dobraWola w TickCtx)', MUT_MAIN('dobraWolaAktywna: diploBrakeBonusFlags(ME(), ownerId).dobraWolaAktywna', 'dobraWolaAktywna: false'), 'P4: dobraWolaAktywna w TickCtx pary gracz-AI'],
  ['usuniete P4 (wspolnyWrog w TickCtx)', MUT_MAIN('wspolnyWrog: diploBrakeBonusFlags(ME(), ownerId).wspolnyWrog', 'wspolnyWrog: false'), 'P4: wspolnyWrog w TickCtx pary gracz-AI'],
  ['usuniete P6 histereza (licznik zawsze 0)', MUT_MOD('const counter = prev + 1;', 'const counter = 0;'), 'P6: histereza = advanceCrisisCounter'],
  ['usuniete P6 (kolejka wojen)', MUT_MAIN('processDiploCrisisQueue();', ''), 'P6: kolejka wojen po N turach (end-turn)'],
  ['usuniete bramka R1/R2', MUT_MAIN('if (diploCrisisWarGateBlocked(declarer, victim)) continue;', ''), 'P6: R1/R2 bramka wypowiedzenia'],
  ['usuniete P7 (bonus wymiany)', MUT_MAIN('applyDiploP7Bonuses(p7Delivered);', ''), 'P7: bonus z realnych dostaw (applyCyclicDeliveryOutcome ok)'],
  ['usuniete zapis licznika', MUT_MAIN('diplomacyCrisisCounters: Object.fromEntries(diplomacyCrisisCounters.entries()),', ''), 'P6: zapis licznika w save (flaga ON)'],
];

for (const [name, pred] of CHECKS) check(name, pred(MAIN, MODULE));

// Mutacje: czerwień musi być zgłoszona przez właściwy check.
for (const [name, mutate, checkName] of MUTATIONS) {
  const mutated = mutate({ main: MAIN, mod: MODULE });
  if (mutated.main === MAIN && mutated.mod === MODULE) { fail++; console.log(`FAIL mutacja nie zmienila zrodla: ${name}`); continue; }
  const entry = CHECKS.find(c => c[0] === checkName);
  const red = !entry[1](mutated.main, mutated.mod);
  check(`mutacja "${name}" czerwieni "${checkName}"`, red);
}

console.log(`diplo-tick-war-brake-test: ${pass} pass / ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
