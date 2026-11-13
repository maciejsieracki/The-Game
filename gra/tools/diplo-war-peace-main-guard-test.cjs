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
check('D7: gracz jako silniejsza strona nie deklaruje (guard mayDeclare w processDiploCrisisQueue)',
  once(MAIN, 'if (!outcome.mayDeclare) continue;') && count(MAIN, 'diploMilitaryBrakeOutcome(') === 3);
check('D7: brak ostrzeżenia o automatycznej wojnie gdy gracz silniejszy (warOutcome.mayDeclare)',
  MAIN.includes('counter < nPair && warOutcome.mayDeclare'));
// mutacje D7 (zachowaniowy test: diplo-war-peace-d7-test.cjs)
check('mutacja D7 (usunięty guard) jest wykrywalna',
  count(MAIN.replace('if (!outcome.mayDeclare) continue;', ''), 'if (!outcome.mayDeclare) continue;') === 0);

// ---- R7 (R-WEB-DIPLO-WAR-DECLARE-ZERO-TRUST-Q1): hamulec liczy ZAUFANIE = 0, N per para ----
check('R7/ZT: diploBrakeCrisisStep czyta Zaufanie pary (nie łączną Relację)',
  MAIN.includes('const zaufanie = getDiploRelation(a, b).zaufanie;') && !MAIN.includes('const zaufanie = relationScore('));
check('R7/ZT: krok kryzysu z progiem zerowego Zaufania (p6) i N per para',
  MAIN.includes('crisisStepForPair(diplomacyCrisisCounters.get(key) ?? 0, zaufanie, atWar, { ...diploTickP6, kryzysTurDoWojny: w.n })'));
check('R7: wywołania bez wartości Zaufania (AI↔AI, gracz↔AI)',
  once(MAIN, 'diploBrakeCrisisStep(a, b);') && once(MAIN, 'diploBrakeCrisisStep(ME(), oid);'));
check('R7: próg i N z wyższej strony pary (diploBrakeWarParams)',
  MAIN.includes('const higher = pa.progWojnyRelacji >= pb.progWojnyRelacji ? pa : pb;') || MAIN.includes('return { prog: brakeRelationThreshold(higher.progWojnyRelacji), n: higher.hamulecN };'));
check('R7: kolejka używa N per para (nPair)', MAIN.includes('if (counter >= nPair) ready.push'));
// mutacja R7/ZT: powrót do łącznej Relacji w liczniku kryzysu. Mutant MUSI przestać spełniać warunek
// (wcześniejsza wersja porównywała tekst z własnym podstawieniem = zawsze true, obrona r1 zarzut 6).
const r7ZtOk = (src) => src.includes('const zaufanie = getDiploRelation(a, b).zaufanie;') && !src.includes('const zaufanie = relationScore(');
const MUT_R7 = MAIN.replace('const zaufanie = getDiploRelation(a, b).zaufanie;', 'const zaufanie = relationScore(getDiploRelation(a, b));');
check('R7/ZT: warunek źródłowy spełniony dla kodu bazowego', r7ZtOk(MAIN));
check('mutacja R7/ZT (feed Relacji) jest wykrywalna (mutant nie spełnia warunku)',
  MUT_R7 !== MAIN && !r7ZtOk(MUT_R7));
// mutacja ostrzeżenia zerowego Zaufania: usunięcie flagi per epizod albo blokady rozejmu z warunku wyświetlenia
const warnOk = (src) => src.includes('!diploZeroTrustWarned.has(key)') && src.includes('!isPeaceLockedBetween(sa, sb)');
check('ZT ostrzeżenie: flaga per epizod i blokada rozejmu w warunku (kod bazowy)', warnOk(MAIN));
check('mutacja ostrzeżenia ZT (bez flagi per epizod) jest wykrywalna',
  MAIN.replace(' && !diploZeroTrustWarned.has(key)', '') !== MAIN && !warnOk(MAIN.replace(' && !diploZeroTrustWarned.has(key)', '')));

// ---- R2: licznik utraconych miast per wojna, oba lejki przejęcia ----
check('R2: recordWarCityLossForPair w obu lejkach przejęcia miasta',
  count(MAIN, 'recordWarCityLossForPair(oldOwner, newOwner);') === 1 && count(MAIN, 'recordWarCityLossForPair(oldOwner, atkOwner);') === 1);
check('R2: rekord wojny ważny tylko dla tego samego startu wojny (od)',
  read('src/game/diplomacy-war-peace-profile.ts').includes('rec.od === od') && MAIN.includes('warStateFromRecord(meta?.wojnaMiasta, od, String(a), turn)'));
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
check('TEN: jedyny setDiploRelation stempluje dokładne przejście do wojny i czyści stempel na pokoju',
  MAIN.includes("if (rel.status === 'wojna' && prevStatus !== 'wojna')")
  && MAIN.includes("else if (prevStatus === 'wojna' && rel.status !== 'wojna')"));
check('TEN: stempel wojny przechodzi przez zapis i odczyt diplomacyPairMeta',
  MAIN.includes('diplomacyPairMeta: Array.from(diplomacyPairMeta.entries())')
  && MAIN.includes('const savedPairMeta = saved.meta?.diplomacyPairMeta')
  && MAIN.includes('diplomacyPairMeta.set(key, meta)'));
check('TEN: propozycje AI, gracza i automatyczne ścieżki używają wspólnego progu',
  MAIN.includes('peaceProposalIsTooEarly(ownerId, ME(), converted.actionId)')
  && MAIN.includes('peaceProposalIsTooEarly(ME(), ownerId, proposal.actionId)')
  && MAIN.includes('PEACE_PROPOSAL_MIN_WAR_TURNS'));
// mutacja R1: powrót do stałej w ai.ts
check('mutacja R1 (stała 5 w ai.ts) jest wykrywalna',
  count(AI.replace('const turnsAtWarRel = rel.stanWojny ? Math.max(0, rel.turnsAtWar ?? 0) : 0;', 'const turnsAtWarRel = rel.stanWojny ? 5 : 0;'), 'Math.max(0, rel.turnsAtWar ?? 0)') === 0);

// ---- R4: zmęczenie w stance używa T(civ) ----
// R-WEB-DIPLO-WEARINESS-20-TURNS-Q1: jedno źródło zmęczenia = warWearinessLevel (drugi zegar T/zmeczenieT usunięty z chęci pokoju).
check('R4: stance liczy zmęczenie przez warWearinessLevel (jeden licznik 20 tur)',
  DIPLO.includes('warWearinessLevel(') && !DIPLO.includes('warWearinessShare(') && !DIPLO.includes('.zmeczenieT'));
check('R4: stała /20 usunięta z diplomacy.ts', !DIPLO.includes('context.turnsAtWar / 20'));

// ---- R3 / R6: sygnały pokoju i próg wojny per cywilizacja w ai.ts ----
check('R3: priorytet 2 używa sygnałów (aiPeaceSignals)', AI.includes('aiPeaceSignals(') && AI.includes('peaceSignals.wantsPeace'));
check('R6/ZT: priorytet 4 używa progu Zaufania (PROG_WOJNA_ZAUFANIE) i przewagi siły militarnej',
  AI.includes('(rel.relation.zaufanie) < PROG_WOJNA_ZAUFANIE') || AI.includes('rel.relation.zaufanie < PROG_WOJNA_ZAUFANIE'));
check('R6/ZT: priorytet 4 liczy przewagę przez compareMilitaryStrength (≥20%)',
  AI.includes("compareMilitaryStrength(milAiSide, milPartnerSide).przewaga === 'A'"));
// mutacja R3: usunięcie sygnałów z priorytetu 2
{
  // R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1: warunek priorytetu 2 ma postać z pozycją militarną.
  const R3_COND = '!aiFeelsStronger && aiPeaceTimeOk && !peaceWeakerNoCityVsPlayer && (peacePosMil === \'slabsza\' || peaceSignals.wantsPeace)';
  const mutR3 = AI.replace(R3_COND, '!aiFeelsStronger && aiPeaceTimeOk && !peaceWeakerNoCityVsPlayer && (peacePosMil === \'slabsza\')');
  check('mutacja R3 (sygnały wyłączone) jest wykrywalna: warunek zmieniony i brak sygnałów w priorytecie 2',
    AI.includes(R3_COND) && mutR3 !== AI && !mutR3.includes('|| peaceSignals.wantsPeace)'));
}
// R3(c)/R3 spójność: zdrowie armii podpięte, AI nie proponuje gdy czuje się silniejsze
check('R3(c): zdrowie armii liczone w main (diploArmyHealthShare) i podane do ai.ts',
  count(MAIN, 'diploArmyHealthShare(a)') === 1 && AI.includes('armyHealthShare: rel.armyHealthShare'));
// R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1: „czuje się silniejsze" = pozycja militarna 'silniejsza' (nie rw).
check('R3 spojnosc: AI nie proponuje pokoju gdy jest militarnie silniejsza (peacePosMil)',
  AI.includes("const aiFeelsStronger = rel.stanWojny && peacePosMil === 'silniejsza';") && AI.includes('!aiFeelsStronger && aiPeaceTimeOk && !peaceWeakerNoCityVsPlayer') && AI.includes('const aiPeaceTimeOk = turnsAtWarRel >= warProfile.minTurWojny;'));
{
  const mutSpojn = AI.replace("const aiFeelsStronger = rel.stanWojny && peacePosMil === 'silniejsza';", 'const aiFeelsStronger = false;');
  check('mutacja spojnosci R3 (AI proponuje mimo siły militarnej) jest wykrywalna', mutSpojn !== AI);
}

// ---- R5: bramka pokoju podpięta w buildProposalEvalContext ----
check('R5: buildProposalEvalContext podaje warState (bramka pokoju)',
  MAIN.includes('warState: diploProposalWarState('));
check('R5: bramka w evaluateProposal (case pokoj)', read('src/game/diplomacy-proposals.ts').includes('const r5Gate = evaluatePeaceAiGate('));

console.log(`diplo-war-peace-main-guard-test: ${pass} pass / ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
