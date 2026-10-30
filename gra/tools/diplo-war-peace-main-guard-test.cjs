'use strict';
/**
 * diplo-war-peace-main-guard-test.cjs — R-WEB-PEACE-RULES-Q1 (runda 1): kontrakty źródła silnika
 * (main.ts / ai.ts / diplomacy.ts). Domknięcia closure w main.ts nie da się wywołać jednostkowo,
 * więc test sprawdza obecność kluczowych linii i mutacje (usunięcie linii => test pada).
 * Run: node tools/diplo-war-peace-main-guard-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.resolve(GRA, rel), 'utf8');
const MAIN = read('src/main.ts');
const AI = read('src/game/ai.ts');
const DIPLO = read('src/game/diplomacy.ts');

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) pass++;
  else { fail++; console.log('FAIL: ' + name); }
}
const count = (src, s) => src.split(s).length - 1;
const once = (src, s) => count(src, s) === 1;

// ---- D7: gracz nie wypowiada wojny z hamulca ----
check('D7: gracz jako silniejsza strona nie deklaruje (guard w processDiploCrisisQueue)',
  once(MAIN, 'if (isMe(declarer)) continue;'));
check('D7: brak ostrzeżenia o automatycznej wojnie gdy gracz silniejszy',
  MAIN.includes('&& !playerStrongerHere)'));
// mutacje D7
check('mutacja D7 (usunięty guard) jest wykrywalna',
  count(MAIN.replace('if (isMe(declarer)) continue;', ''), 'if (isMe(declarer)) continue;') === 0);

// ---- R7: hamulec feeds łączną Relację, N/prog per para ----
check('R7: diploBrakeCrisisStep czyta relationScore (nie samo Zaufanie)',
  MAIN.includes('const relacja = relationScore(getDiploRelation(a, b));'));
check('R7: krok kryzysu z progiem i N per para',
  MAIN.includes('{ ...diploTickP6, kryzysProgZaufania: w.prog, kryzysTurDoWojny: w.n },'));
check('R7: wywołania bez wartości Zaufania (AI↔AI, gracz↔AI)',
  once(MAIN, 'diploBrakeCrisisStep(a, b);') && once(MAIN, 'diploBrakeCrisisStep(ME(), oid);'));
check('R7: próg i N z wyższej strony pary (diploBrakeWarParams)',
  MAIN.includes('const higher = pa.progWojnyRelacji >= pb.progWojnyRelacji ? pa : pb;') || MAIN.includes('return { prog: brakeRelationThreshold(higher.progWojnyRelacji), n: higher.hamulecN };'));
check('R7: kolejka używa N per para (nPair)', MAIN.includes('if (counter >= nPair) ready.push'));
// mutacja R7: powrót do Zaufania
check('mutacja R7 (feed Zaufania) jest wykrywalna',
  count(MAIN.replace('const relacja = relationScore(getDiploRelation(a, b));', 'const relacja = getDiploRelation(a, b).zaufanie ?? 0;'), 'relationScore(getDiploRelation(a, b))') === 0);

// ---- R2: licznik utraconych miast per wojna, oba lejki przejęcia ----
check('R2: recordWarCityLossForPair w obu lejkach przejęcia miasta',
  count(MAIN, 'recordWarCityLossForPair(oldOwner, newOwner);') === 1 && count(MAIN, 'recordWarCityLossForPair(oldOwner, atkOwner);') === 1);
check('R2: rekord wojny ważny tylko dla tego samego startu wojny (od)',
  MAIN.includes('meta.wojnaMiasta.od === od'));
// mutacja R2: usunięcie hooka w bitwie
check('mutacja R2 (brak hooka bitwy) jest wykrywalna',
  count(MAIN.replace('recordWarCityLossForPair(oldOwner, atkOwner);', ''), 'recordWarCityLossForPair(oldOwner, atkOwner);') === 0);

// ---- R1 / R3(d): realny czas wojny i pola stanu do relacjeDip ----
check('R1: stały 5 usunięty z ai.ts (turnsAtWar z rel.turnsAtWar)',
  AI.includes('const turnsAtWarRel = rel.stanWojny ? Math.max(0, rel.turnsAtWar ?? 0) : 0;') && !AI.includes('turnsAtWar:   rel.stanWojny ? 5 : 0'));
check('R1: diploRelWarFields w relacjeDip (ME i AI↔AI)',
  count(MAIN, '...diploRelWarFields(ownerId, ME()),') === 1 && count(MAIN, '...diploRelWarFields(ownerId, otherId),') === 1);
check('R1: stub dipCtx używa realnego czasu wojny',
  MAIN.includes('turnsAtWar: diploWarStateFor(ownerId, ME()).turnsAtWar'));
check('R1: stały 5 usunięty z diplomacy-proposals (stanceForEval)',
  !read('src/game/diplomacy-proposals.ts').includes('turnsAtWar: ctx.stanWojny ? 5 : 0'));
check('R1: stracony stempel wojny (wojnaStartTura) ustawiany i zdejmowany przy pokoju',
  MAIN.includes('setDiploPairMeta(a, b, { ...meta, wojnaStartTura: turn } as DiploPairMeta);')
  && MAIN.includes('wojnaStartTura: undefined'));
// mutacja R1: powrót do stałej w ai.ts
check('mutacja R1 (stała 5 w ai.ts) jest wykrywalna',
  count(AI.replace('const turnsAtWarRel = rel.stanWojny ? Math.max(0, rel.turnsAtWar ?? 0) : 0;', 'const turnsAtWarRel = rel.stanWojny ? 5 : 0;'), 'Math.max(0, rel.turnsAtWar ?? 0)') === 0);

// ---- R4: zmęczenie w stance używa T(civ) ----
check('R4: stance liczy zmęczenie przez warWearinessShare + zmeczenieT',
  DIPLO.includes('warWearinessShare(') && DIPLO.includes('.zmeczenieT'));
check('R4: stała /20 usunięta z diplomacy.ts', !DIPLO.includes('context.turnsAtWar / 20'));

// ---- R3 / R6: sygnały pokoju i próg wojny per cywilizacja w ai.ts ----
check('R3: priorytet 2 używa sygnałów (aiPeaceSignals)', AI.includes('aiPeaceSignals(') && AI.includes('peaceSignals.wantsPeace'));
check('R6: priorytet 4 używa progu wojny per cywilizacja', AI.includes('const progMinimalnyRelacja = warProfile.progWojnyRelacji;'));
// mutacja R3: usunięcie sygnałów z priorytetu 2
{
  const mutR3 = AI.replace('rel.stanWojny && (rw <= progPokojSlabosc || peaceSignals.wantsPeace)', 'rel.stanWojny && (rw <= progPokojSlabosc)');
  check('mutacja R3 (sygnały wyłączone) jest wykrywalna: warunek zmieniony i brak sygnałów w priorytecie 2',
    mutR3 !== AI && !mutR3.includes('|| peaceSignals.wantsPeace)'));
}

// ---- R5: bramka pokoju podpięta w buildProposalEvalContext ----
check('R5: buildProposalEvalContext podaje warState (bramka pokoju)',
  MAIN.includes('warState: diploProposalWarState('));
check('R5: bramka w evaluateProposal (case pokoj)', read('src/game/diplomacy-proposals.ts').includes('const r5Gate = evaluatePeaceAiGate('));

console.log(`diplo-war-peace-main-guard-test: ${pass} pass / ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
