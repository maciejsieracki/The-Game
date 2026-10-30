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
  ['flaga domyslnie ON (wydanie ROBOCZA)', (m, mod) => /DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT = true/.test(mod)],
  ['P3: pary AI-AI tickowane za flaga', (m) => has(m, 'if (brakeOn) {\n        // P3: pary AI↔AI') && has(m, 'tickDiploAiAiPairsWithBrake();')],
  ['P3: AI-AI dostaje TickCtx z buildDiplomacyTickCtxForPair', (m) => has(m, 'tickDiplomacy(cur as any, buildDiplomacyTickCtxForPair(a, b))')],
  ['P3: Wiarygodnosc AI-AI = srednia (Z2)', (m) => has(m, '(getWiarygodnosc(a) + getWiarygodnosc(b)) / 2')],
  ['P4: dobraWolaAktywna w TickCtx pary gracz-AI', (m) => has(m, 'dobraWolaAktywna: isDiploTickWarBrakeEnabled() && diplomacyDobraWolaActiveTura.has(diploPairKey(ME(), ownerId)),')],
  ['P4: wspolnyWrog w TickCtx pary gracz-AI', (m) => has(m, 'wspolnyWrog: diploBrakeBonusFlags(ME(), ownerId).wspolnyWrog')],
  ['P4: UI (buildDiplomacyTickCtxForPair) = silnik', (m) => has(m, 'const brakeFlags = diploBrakeBonusFlags(a, b);') && has(m, 'dobraWolaAktywna: brakeFlags.dobraWolaAktywna')],
  ['P4: dobra wola nie liczona podwojnie (odliczanie w end-turn)', (m) => has(m, 'P4 (r3): +1 dobrej woli liczy tickDiplomacy')],
  ['P4 r3: snapshot aktywnosci z odliczenia na poczatku tury', (m) => has(m, 'const dw = dobraWolaTurnStep(meta.dobraWolaRemainingTur);') && has(m, 'if (dw.activeThisTurn) diplomacyDobraWolaActiveTura.add(diploPairKey(ME(), oid));')],
  ['P4 r3: AI-loop czyta snapshot, nie licznik', (m) => has(m, 'dobraWolaAktywna: isDiploTickWarBrakeEnabled() && diplomacyDobraWolaActiveTura.has(diploPairKey(ME(), ownerId)),')],
  ['P3 r3: duchy wykluczone (eligible)', (m) => has(m, 'return isAiAiEligibleOwner({') && has(m, 'const owners = allPowerOwnerIds().filter(o => !isMe(o) && diploOwnerEligibleForBrake(o));') && has(m, 'for (const [a, b] of aiAiPairs(owners)) {')],
  ['P6 r3: wojna z progu = pelne skutki (sojusze, negocjacje, UI)', (m) => has(m, 'breakTreatiesOnWar(declarer, victim, isMe(declarer), { bezKary: true });') && has(m, 'applyAllianceObligationsOnWar(declarer, victim);') && has(m, 'pruneTributeNegotiationsBetween(declarer, victim)') && has(m, 'pruneInvalidNegotiations();')],
  ['P6 r3: casus belli bez zdarzenia kary', (m) => has(m, 'if (opts?.bezKary) return;')],
  ['P6 r3: licznik kryzysu po ticku, ta sama kadencja (start tury)', (m) => has(m, 'diploBrakeCrisisStep(ME(), oid);') && !has(m, 'if (isDiploTickWarBrakeEnabled()) diploBrakeCrisisStep(ME(), ownerId, relTicked.zaufanie ?? 0);')],
  ['P6 r3: para w wojnie nie liczy kryzysu', (m, mod) => has(m, "const atWar = getDiploRelation(a, b).status === 'wojna';") && has(mod, 'if (atWar) return { counter: 0')],
  ['P4: wspolny wrog = wojna z tym samym przeciwnikiem lub WspolnaWalka', (m) => has(m, 'diploSharedEnemyOrBarbarianCoop') && has(m, "getDiploRelation(a, c).status === 'wojna' && getDiploRelation(b, c).status === 'wojna'")],
  ['P6: licznik kryzysu gracz-AI po tickDiplomacy', (m) => has(m, 'diploBrakeCrisisStep(ME(), oid);')],
  ['P6: histereza = crisisStepForPair/advanceCrisisCounter', (m, mod) => has(m, 'crisisStepForPair(diplomacyCrisisCounters.get(key) ?? 0, relacja, atWar, { ...diploTickP6, kryzysProgZaufania: w.prog, kryzysTurDoWojny: w.n });') && has(mod, 'return advanceCrisisCounter(prevCounter, zaufanie, p);') && has(mod, 'const counter = prev + 1;') && /counter: 0, warningActive: false/.test(mod)],
  ['P6: kolejka wojen po N turach (end-turn)', (m) => has(m, 'processDiploCrisisQueue();') && has(m, 'if (counter >= nPair) ready.push')],
  ['P6: R1/R2 bramka wypowiedzenia', (m) => has(m, 'if (diploCrisisWarGateBlocked(declarer, victim)) continue;') && has(m, 'return evaluateInterCivWarGate({')],
  ['P6: strona silniejsza wypowiada (brakeWarOutcome -> pickWarDeclarer, D7)', (m) => has(m, 'brakeWarOutcome(') && has(m, 'if (!outcome.mayDeclare) continue;')],
  ['P6: pokoj blokuje wypowiedzenie', (m) => has(m, 'if (isPeaceLockedBetween(e.ownerA, e.ownerB)) continue;')],
  ['P6: ostrzezenie gracza (licznik >= N-2)', (m) => has(m, 'counter >= warnAtPair && counter < nPair') && has(m, 'tur do wypowiedzenia')],
  ['P6: zapis licznika w save (flaga ON)', (m) => has(m, 'diplomacyCrisisCounters: Object.fromEntries(diplomacyCrisisCounters.entries())')],
  ['P6: odczyt licznika w load (stary zapis = 0)', (m) => has(m, 'parseCrisisCounters(saved.meta?.diplomacyCrisisCounters)')],
  ['P7: bonus z realnych dostaw (applyCyclicDeliveryOutcome ok)', (m) => has(m, 'if (brakeOn && ok) {') && has(m, 'applyDiploP7Bonuses(p7Delivered)')],
  ['P7: barter tylko przy bothOk', (m) => has(m, 'if (brakeOn && bothOk) {')],
  ['P7: sufit/limit/krok w tradeTrustBonusPerTura', (m, mod) => has(mod, 'Math.min(surowy, p.wymianaMaxPerTura, headroom)') && has(mod, 'if (!(headroom > 0)) return 0;')],
  ['P7: DECYZJA 1 (zaliczka tylko za 1 ture)', (m) => has(m, 'diploAcceptanceTrustPn(givePn, receivePn, dealTurnsMult, isGift)') && has(m, 'diploAcceptanceTrustPn(givePn, receivePn, oneShotTurnsMult, isGift)')],
  ['P7 r3: dar wylaczony z zasady DECYZJA 1', (m) => has(m, 'if (!isDiploTickWarBrakeEnabled() || isGift || !(turnsMult > 1)) return { givePn, receivePn };')],
  ['P4 r3: dobraWolaTurnStep (aktywnosc przed odliczeniem)', (m, mod) => has(mod, 'return { activeThisTurn: r > 0, next: Math.max(0, r - 1) };')],
  ['P3 r3: pary i<j (kazda raz)', (m, mod) => has(mod, 'for (let j = i + 1; j < owners.length; j++) out.push')],
  ['P3 r3: filtr duchow w modulu', (m, mod) => has(mod, 'return !o.isPlayer && !o.isBarbarian && !o.isCityCopy && !o.eliminated && o.cityCount > 0;')],
  ['P7: seria kasowana bez dostawy', (m) => has(m, 'if (!delivered.has(key)) diplomacyTradeStreak.delete(key);')],
];

// Mutacje: (nazwa, transformacja {main, mod} -> {main, mod}, check, który MUSI polec)
const MUT_MAIN = (re, to) => ({ main, mod }) => ({ main: main.replace(re, to), mod });
const MUT_MOD = (re, to) => ({ main, mod }) => ({ main, mod: mod.replace(re, to) });
const MUTATIONS = [
  ['usuniete P3 (tick AI-AI)', MUT_MAIN('tickDiploAiAiPairsWithBrake();', ''), 'P3: pary AI-AI tickowane za flaga'],
  ['usuniete P4 (dobraWola w TickCtx)', MUT_MAIN('dobraWolaAktywna: isDiploTickWarBrakeEnabled() && diplomacyDobraWolaActiveTura.has(diploPairKey(ME(), ownerId)),', 'dobraWolaAktywna: false,'), 'P4: dobraWolaAktywna w TickCtx pary gracz-AI'],
  ['usuniete snapshot dobrej woli (odliczenie)', MUT_MAIN('if (dw.activeThisTurn) diplomacyDobraWolaActiveTura.add(diploPairKey(ME(), oid));', ''), 'P4 r3: snapshot aktywnosci z odliczenia na poczatku tury'],
  ['dobra wola aktywna wg licznika PO odliczeniu (bug z r2)', MUT_MOD('activeThisTurn: r > 0, next', 'activeThisTurn: r > 1, next'), 'P4 r3: dobraWolaTurnStep (aktywnosc przed odliczeniem)'],
  ['usuniete P3 duchy-filtr (wszyscy owners)', MUT_MAIN('const owners = allPowerOwnerIds().filter(o => !isMe(o) && diploOwnerEligibleForBrake(o));', 'const owners = allPowerOwnerIds().filter(o => !isMe(o));'), 'P3 r3: duchy wykluczone (eligible)'],
  ['P3 para pominieta (j = i+2)', MUT_MOD('for (let j = i + 1; j < owners.length; j++) out.push', 'for (let j = i + 2; j < owners.length; j++) out.push'), 'P3 r3: pary i<j (kazda raz)'],
  ['usuniete efekty wojny z progu (sojusze)', MUT_MAIN('applyAllianceObligationsOnWar(declarer, victim);', ''), 'P6 r3: wojna z progu = pelne skutki (sojusze, negocjacje, UI)'],
  ['kara casus belli wraca (bezKary off)', MUT_MAIN('if (opts?.bezKary) return;', ''), 'P6 r3: casus belli bez zdarzenia kary'],
  ['usuniete krok kryzysu w starcie tury', MUT_MAIN('diploBrakeCrisisStep(ME(), oid);', ''), 'P6 r3: licznik kryzysu po ticku, ta sama kadencja (start tury)'],
  ['para w wojnie liczy kryzys', MUT_MOD('if (atWar) return { counter: 0', 'if (false) return { counter: 0'), 'P6 r3: para w wojnie nie liczy kryzysu'],
  ['dar objety zasada DECYZJI 1', MUT_MAIN('|| isGift || !(turnsMult > 1)', '|| !(turnsMult > 1)'), 'P7 r3: dar wylaczony z zasady DECYZJA 1'],
  ['usuniete P4 (wspolnyWrog w TickCtx)', MUT_MAIN('wspolnyWrog: diploBrakeBonusFlags(ME(), ownerId).wspolnyWrog', 'wspolnyWrog: false'), 'P4: wspolnyWrog w TickCtx pary gracz-AI'],
  ['usuniete P6 histereza (licznik zawsze 0)', MUT_MOD('const counter = prev + 1;', 'const counter = 0;'), 'P6: histereza = crisisStepForPair/advanceCrisisCounter'],
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
  if (!entry) { fail++; console.log(`FAIL brak checka "${checkName}" dla mutacji "${name}"`); continue; }
  const red = !entry[1](mutated.main, mutated.mod);
  check(`mutacja "${name}" czerwieni "${checkName}"`, red);
}

console.log(`diplo-tick-war-brake-test: ${pass} pass / ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
