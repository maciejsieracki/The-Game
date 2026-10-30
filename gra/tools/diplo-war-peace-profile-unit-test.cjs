'use strict';
/**
 * diplo-war-peace-profile-unit-test.cjs — R-WEB-PEACE-RULES-Q1 (runda 1), R4/R5/R6/R7 czyste reguły.
 * Run: node tools/diplo-war-peace-profile-unit-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(ROOT, 'src', '.dip-warpeace-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-warpeace-bundle.cjs');

fs.writeFileSync(ENTRY, `export * from './game/diplomacy-war-peace-profile';\n`);
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE, logLevel: 'silent' });
} finally {
  try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
}
const M = require(BUNDLE);

let pass = 0;
let fail = 0;
function near(name, got, want, eps = 1e-9) {
  const ok = Math.abs(got - want) <= eps;
  if (ok) pass++;
  else { fail++; console.log(`FAIL ${name}: got ${got} want ${want}`); }
}
function eq(name, got, want) {
  const ok = Object.is(got, want) || JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++;
  else { fail++; console.log(`FAIL ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
}

// ---- R6: resolver — przykłady z dispatchu ----
const zulusi = M.resolveWarPeaceProfile('zulusi');
eq('zulusi hasData', zulusi.hasData, true);
near('zulusi progWojnyRelacji=63', zulusi.progWojnyRelacji, 63);
near('zulusi progPokojSlabosc=0.28', zulusi.progPokojSlabosc, 0.28);
eq('zulusi minTurWojny=7 (agr 9 => +3, profil obronny => -1)', zulusi.minTurWojny, 7);
near('zulusi zmeczenieT=20', zulusi.zmeczenieT, 20);
eq('zulusi hamulecN=4 (round(8-4.5))', zulusi.hamulecN, 4);

const chin = M.resolveWarPeaceProfile('chinczycy');
near('chinczycy progWojnyRelacji=16', chin.progWojnyRelacji, 16);
near('chinczycy progPokojSlabosc=0.49', chin.progPokojSlabosc, 0.49);
near('chinczycy zmeczenieT=17', chin.zmeczenieT, 17);
eq('chinczycy hamulecN=7', chin.hamulecN, 7);

near('grecy progWojnyRelacji=30', M.resolveWarPeaceProfile('grecy').progWojnyRelacji, 30);
near('rzymianie progWojnyRelacji=58', M.resolveWarPeaceProfile('rzymianie').progWojnyRelacji, 58);

// brak danych (gracz / nieznany typ) -> wartości bazowe
const brak = M.resolveWarPeaceProfile(undefined);
eq('brak danych hasData', brak.hasData, false);
near('brak danych progWojnyRelacji=30', brak.progWojnyRelacji, 30);
near('brak danych progPokojSlabosc=0.40', brak.progPokojSlabosc, 0.40);
near('brak danych progKrytyczny=0.25', brak.progKrytyczny, 0.25);
near('brak danych progZdrowia=0.40', brak.progZdrowia, 0.40);
near('brak danych zmeczenieT=20', brak.zmeczenieT, 20);
eq('nieznany typ = brak danych', M.resolveWarPeaceProfile('nie-ma-takiej').hasData, false);

// zakresy clamp dla wszystkich 15 cywilizacji (progi w dozwolonych granicach)
const civKeys = ['grecy','rzymianie','chinczycy','inkowie','zulusi','egipt','sumer','celtowie','germanie','harappa','hetyci','slowianie','babilonia','asyria','fenicjanie'];
for (const k of civKeys) {
  const pr = M.resolveWarPeaceProfile(k);
  eq(`${k} hasData`, pr.hasData, true);
  eq(`${k} progWojnyRelacji w [10,70]`, pr.progWojnyRelacji >= 10 && pr.progWojnyRelacji <= 70, true);
  eq(`${k} progPokojSlabosc w [0.20,0.55]`, pr.progPokojSlabosc >= 0.20 && pr.progPokojSlabosc <= 0.55, true);
  eq(`${k} zmeczenieT <= 20`, pr.zmeczenieT <= 20, true);
  eq(`${k} minTurWojny w [1,8]`, pr.minTurWojny >= 1 && pr.minTurWojny <= 8, true);
  eq(`${k} hamulecN w [3,7]`, pr.hamulecN >= 3 && pr.hamulecN <= 7, true);
}

// ---- R4 / D4: zmęczenie wojną ----
near('zmęczenie 0 poza wojną', M.warWearinessShare(0, 20), 0);
near('zmęczenie 10/20 = 0.5', M.warWearinessShare(10, 20), 0.5);
near('zmęczenie 5/20 = 0.25', M.warWearinessShare(5, 20), 0.25);
near('zmęczenie po 20 turach pełne (0.5)', M.warWearinessShare(20, 20), 0.5);
near('zmęczenie po 20 turach pełne dla T=17', M.warWearinessShare(20, 17), 0.5);
near('zmęczenie nie przekracza 0.5', M.warWearinessShare(99, 17), 0.5);
near('zmęczenie rośnie z turami', M.warWearinessShare(3, 20) < M.warWearinessShare(6, 20) ? 1 : 0, 1);

// ---- R3: sygnały pokoju ----
const rzym = M.resolveWarPeaceProfile('rzymianie');
eq('sygnał a: rw <= progPokojSlabosc', M.aiPeaceSignals({ rw: 0.2, turnsAtWar: 1, lostCitiesInWar: 0 }, rzym).reasons.includes('a'), true);
eq('sygnał b: miasto utracone i rw<=0.5', M.aiPeaceSignals({ rw: 0.45, turnsAtWar: 3, lostCitiesInWar: 1 }, rzym).reasons.includes('b'), true);
eq('sygnał b NIE: bez utraty miasta', M.aiPeaceSignals({ rw: 0.45, turnsAtWar: 3, lostCitiesInWar: 0 }, rzym).reasons.includes('b'), false);
eq('sygnał d: pat 15 tur bez zmiany miast 10 tur', M.aiPeaceSignals({ rw: 0.9, turnsAtWar: 15, lostCitiesInWar: 0, turnsSinceCityChange: 10 }, rzym).reasons.includes('d'), true);
eq('sygnał d NIE: pat 14 tur', M.aiPeaceSignals({ rw: 0.9, turnsAtWar: 14, lostCitiesInWar: 0, turnsSinceCityChange: 14 }, rzym).reasons.includes('d'), false);
eq('sygnał e: zmęczenie >= 0.4 (Zulusi 8/20)', M.aiPeaceSignals({ rw: 0.9, turnsAtWar: 8, lostCitiesInWar: 0 }, zulusi).reasons.includes('e'), true);
eq('sygnał e NIE: Zulusi 7/20', M.aiPeaceSignals({ rw: 0.9, turnsAtWar: 7, lostCitiesInWar: 0 }, zulusi).wantsPeace, false);

// ---- R5: bramka pokoju od gracza ----
eq('R5a: za wcześnie (Zulusi minTur 7, tura 6)', M.evaluatePeaceAiGate({ rw: 0.3, turnsAtWar: 6, lostCitiesInWar: 0 }, zulusi).verdict, 'too_early');
eq('R5b: silniejsze (rw 0.6, bez utraty, 5 tur)', M.evaluatePeaceAiGate({ rw: 0.6, turnsAtWar: 9, lostCitiesInWar: 0 }, rzym).verdict, 'stronger');
eq('R5b: po utracie miasta NIE odrzuca', M.evaluatePeaceAiGate({ rw: 0.6, turnsAtWar: 9, lostCitiesInWar: 1 }, rzym).verdict, 'ok');
eq('R5b: po 10 turach NIE odrzuca', M.evaluatePeaceAiGate({ rw: 0.6, turnsAtWar: 10, lostCitiesInWar: 0 }, rzym).verdict, 'ok');
const g20 = M.evaluatePeaceAiGate({ rw: 0.9, turnsAtWar: 20, lostCitiesInWar: 0 }, zulusi);
eq('R5e: po 20 turach brak odrzucenia (silniejsze)', g20.verdict, 'ok');
eq('R5e: po 20 turach mnożnik <= 1', g20.priceMultiplier <= 1, true);
near('R5c: rw 0.25 -> 0.5', M.peaceStrengthPriceMultiplier(0.25), 0.5);
near('R5c: rw 0.4 -> 1', M.peaceStrengthPriceMultiplier(0.4), 1);
near('R5c: rw 0.55 -> 1.1', M.peaceStrengthPriceMultiplier(0.55), 1.1);
near('R5c: rw 0.9 -> 1.8', M.peaceStrengthPriceMultiplier(0.9), 1.8);
near('R5c: rw 1.0 -> max 2', M.peaceStrengthPriceMultiplier(1.0), 2);
near('R5d: zulusi mnożnik cywilizacji 1.32', M.peaceCivPriceMultiplier(zulusi), 1.32);
near('R5d: chinczycy 1+0.05*-3+0.04*-1=0.81', M.peaceCivPriceMultiplier(chin), 0.81);
const gz = M.evaluatePeaceAiGate({ rw: 0.8, turnsAtWar: 12, lostCitiesInWar: 0 }, zulusi);
near('R5 cena: zulusi rw0.8 = 1.6*1.32', gz.priceMultiplier, 1.6 * 1.32);

// ---- R7: próg kryzysu Relacji ----
near('R7 próg kryzysu dla Zulusów = 63-15 = 48', M.brakeRelationThreshold(zulusi.progWojnyRelacji), 48);

if (fail === 0) console.log(`diplo-war-peace-profile-unit-test: ${pass} pass / 0 fail`);
else console.log(`diplo-war-peace-profile-unit-test: ${pass} pass / ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
