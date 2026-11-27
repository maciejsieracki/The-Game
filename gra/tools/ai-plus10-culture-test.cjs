'use strict';
/**
 * ai-plus10-culture-test.cjs — R-WEB-CULT-REL-AI-PLUS10-Q1 (2026-11-27).
 *
 * Decyzja właściciela („Plus dziesięć zawsze stałe miało być tylko dla AI. Dla gracza nic nie
 * zmieniamy.”): w ustawieniu „Kultura i religia” linie Kultury i Religii (Szczęście i Prawo)
 * dla CYWILIZACJI AI mają plus G_ai = +10 na KAŻDYM poziomie (w epoce 1; rośnie z epoką:
 * ×1,0 / ×1,6 / ×2,3 → +10/+16/+23). Minusy D bez zmian. Gracz (także hotseat) bez zmian:
 * G = +10 / +5 / 0 wg poziomu.
 *
 * Testy idą na poziomie MAKSYMALNYM (trudny), a dla porównania też na łatwym i normalnym
 * (wymagane przez specyfikację AI). Mutacje czerwone (sprawdzone ręcznie, patrz raport):
 *   • G_ai ustawione na wartość gracza (0 na trudnym) → test AI 100% czerwony;
 *   • typ właściciela zignorowany (zawsze gracz) → testy AI czerwone;
 *   • brak skali epok dla AI → testy epok 2/3 czerwone.
 *
 * Run: cd gra && node tools/ai-plus10-culture-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.ai-plus10-culture-entry.ts');
const BUNDLE = path.resolve(__dirname, '.ai-plus10-culture-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  computeHappinessBreakdown,
  computeLawBreakdown,
  evaluateOrderFromBreakdown,
} from '../src/game/society-breakdown';
export {
  aiCityGarrisonNeedFromOrder,
} from '../src/game/ai-city-order-need';
export {
  cultureReligionLineValue,
  culturaReligiaBoundsForOwner,
  CULTURA_RELIGIA_BOUNDS_DEFAULT,
  CULTURA_RELIGIA_AI_G_DEFAULT,
  setCulturaReligiaLevel,
  getCulturaReligiaLevel,
} from '../src/game/culture-religion-level';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[ai-plus10-culture-test] bundle failed:', e.message || e);
  process.exit(2);
}

const M = require(BUNDLE);
const SOCIETY = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'data', 'society-params.json'), 'utf8'));

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; return; }
  fail++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail));
}
function eq(name, got, want) {
  check(name, got === want, { got, want });
}

const skala = SOCIETY.szczescie.szczescie_skala_kultura_religia.hard;
const X1 = skala[0];
const X2 = skala[1];
const X3 = skala[2];
check('dane: skala epok = 10/16/23', X1 === 10 && X2 === 16 && X3 === 23, skala);

// ---------------------------------------------------------------------------
// 1. Dane i granice: G_ai = +10 na każdym poziomie, D i G gracza bez zmian.
// ---------------------------------------------------------------------------
const B = M.CULTURA_RELIGIA_BOUNDS_DEFAULT;
eq('AI G stałe: latwy', B.latwy.GAi, 10);
eq('AI G stałe: normalny', B.normalny.GAi, 10);
eq('AI G stałe: trudny', B.trudny.GAi, 10);
eq('stała domyślna AI = 10', M.CULTURA_RELIGIA_AI_G_DEFAULT, 10);
eq('gracz G latwy = 10 (bez zmian)', B.latwy.G, 10);
eq('gracz G normalny = 5 (bez zmian)', B.normalny.G, 5);
eq('gracz G trudny = 0 (bez zmian)', B.trudny.G, 0);
eq('D latwy = -10 (bez zmian)', B.latwy.D, -10);
eq('D normalny = -15 (bez zmian)', B.normalny.D, -15);
eq('D trudny = -20 (bez zmian)', B.trudny.D, -20);
for (const lvl of ['latwy', 'normalny', 'trudny']) {
  eq(`dane JSON G_ai ${lvl} = 10`, SOCIETY.kultura_religia_poziomy[lvl].G_ai, 10);
}

// ---------------------------------------------------------------------------
// 2. Czysta funkcja: AI = G_ai, gracz = G, D wspólne; skala epok mnoży plus AI.
// ---------------------------------------------------------------------------
eq('AI trudny 100% ×1 = +10', M.cultureReligionLineValue('trudny', 1, 1, B, false), 10);
eq('AI normalny 100% ×1 = +10', M.cultureReligionLineValue('normalny', 1, 1, B, false), 10);
eq('AI latwy 100% ×1 = +10', M.cultureReligionLineValue('latwy', 1, 1, B, false), 10);
eq('AI trudny 0% ×1 = −20 (D bez zmian)', M.cultureReligionLineValue('trudny', 1, 0, B, false), -20);
eq('AI normalny 0% ×1 = −15', M.cultureReligionLineValue('normalny', 1, 0, B, false), -15);
eq('AI latwy 0% ×1 = −10', M.cultureReligionLineValue('latwy', 1, 0, B, false), -10);
eq('AI trudny 100% epoka 2 (×1,6) = +16', M.cultureReligionLineValue('trudny', X2 / X1, 1, B, false), 16);
eq('AI trudny 100% epoka 3 (×2,3) = +23', M.cultureReligionLineValue('trudny', X3 / X1, 1, B, false), 23);
eq('AI normalny 100% epoka 2 (×1,6) = +16', M.cultureReligionLineValue('normalny', X2 / X1, 1, B, false), 16);
eq('AI latwy 100% epoka 3 (×2,3) = +23', M.cultureReligionLineValue('latwy', X3 / X1, 1, B, false), 23);
// 50% własnej na trudnym AI: (−20 + 30) = +10 → (D + (G_ai − D)·0,5) = −20 + 15 = −5
eq('AI trudny 50% ×1 = −5', M.cultureReligionLineValue('trudny', 1, 0.5, B, false), -5);
// gracz bez zmian
eq('gracz trudny 100% ×1 = 0', M.cultureReligionLineValue('trudny', 1, 1, B, true), 0);
eq('gracz normalny 100% ×1 = +5', M.cultureReligionLineValue('normalny', 1, 1, B, true), 5);
eq('gracz latwy 100% ×1 = +10', M.cultureReligionLineValue('latwy', 1, 1, B, true), 10);
eq('gracz trudny 0% ×1 = −20', M.cultureReligionLineValue('trudny', 1, 0, B, true), -20);
eq('gracz domyślnie = gracz (trudny 100% = 0)', M.cultureReligionLineValue('trudny', 1, 1), 0);
eq('gracz trudny 100% epoka 2 = +6 (addytywnie, runda 2)', M.cultureReligionLineValue('trudny', X2 / X1, 1, B, true), 6);
eq('gracz trudny 100% epoka 3 = +13 (addytywnie)', M.cultureReligionLineValue('trudny', X3 / X1, 1, B, true), 13);
eq('gracz trudny 0% epoka 2 = −26 (addytywnie)', M.cultureReligionLineValue('trudny', X2 / X1, 0, B, true), -26);
eq('gracz normalny 100% epoka 2 = +11 (addytywnie)', M.cultureReligionLineValue('normalny', X2 / X1, 1, B, true), 11);

// culturaReligiaBoundsForOwner: AI → G_ai, gracz → G.
eq('bounds AI trudny G', M.culturaReligiaBoundsForOwner(B.trudny, false).G, 10);
eq('bounds gracz trudny G', M.culturaReligiaBoundsForOwner(B.trudny, true).G, 0);
eq('bounds AI D bez zmian', M.culturaReligiaBoundsForOwner(B.trudny, false).D, -20);

// ---------------------------------------------------------------------------
// 3. Szczęście (silnik): linie kultura/religia dla AI vs gracza, poziom TRUDNY.
// ---------------------------------------------------------------------------
// Linia o wartości 0 nie jest dopisywana do rozpiski (silnik pomija falsy) — brak = 0.
function lineOf(bd, id) {
  const l = bd.lines.find((x) => x.id === id);
  return l ? l.value : 0;
}
function happy(over) {
  return Object.assign({
    difficulty: 'hard',
    era: 1,
    population: 3,
    buildingZadowolenie: 0,
    haRel: 0,
    ownCultureShare: 1,
    ownReligionShare: 1,
  }, over);
}

M.setCulturaReligiaLevel('trudny');
eq('stan: trudny', M.getCulturaReligiaLevel(), 'trudny');

let bd = M.computeHappinessBreakdown(happy({ ownerIsHuman: false }), SOCIETY);
eq('trudny AI Szczescie: kultura 100% = +10', lineOf(bd, 'kultura'), 10);
eq('trudny AI Szczescie: religia 100% = +10', lineOf(bd, 'religia'), 10);
bd = M.computeHappinessBreakdown(happy({ ownerIsHuman: true }), SOCIETY);
eq('trudny gracz Szczescie: kultura 100% = 0', lineOf(bd, 'kultura'), 0);
eq('trudny gracz Szczescie: religia 100% = 0', lineOf(bd, 'religia'), 0);
bd = M.computeHappinessBreakdown(happy({}), SOCIETY); // brak pola = gracz
eq('trudny domyślnie (brak pola) = gracz: kultura 0', lineOf(bd, 'kultura'), 0);

bd = M.computeHappinessBreakdown(happy({ ownerIsHuman: false, era: 2 }), SOCIETY);
eq('trudny AI epoka 2 Szczescie: kultura = +16', lineOf(bd, 'kultura'), 16);
eq('trudny AI epoka 2 Szczescie: religia = +16', lineOf(bd, 'religia'), 16);
bd = M.computeHappinessBreakdown(happy({ ownerIsHuman: false, era: 3 }), SOCIETY);
eq('trudny AI epoka 3 Szczescie: kultura = +23', lineOf(bd, 'kultura'), 23);
bd = M.computeHappinessBreakdown(happy({ ownerIsHuman: false, ownCultureShare: 0, ownReligionShare: 0.5 }), SOCIETY);
eq('trudny AI 0% kultury epoka 1 = −20 (D)', lineOf(bd, 'kultura'), -20);
eq('trudny AI 50% religii = −5', lineOf(bd, 'religia'), -5);

// ---------------------------------------------------------------------------
// 4. Poziomy łatwy i normalny (specyfikacja AI: +10 na każdym poziomie).
// ---------------------------------------------------------------------------
M.setCulturaReligiaLevel('normalny');
bd = M.computeHappinessBreakdown(happy({ ownerIsHuman: false }), SOCIETY);
eq('normalny AI Szczescie: kultura 100% = +10', lineOf(bd, 'kultura'), 10);
eq('normalny AI Szczescie: religia 100% = +10', lineOf(bd, 'religia'), 10);
bd = M.computeHappinessBreakdown(happy({ ownerIsHuman: true }), SOCIETY);
eq('normalny gracz Szczescie: kultura 100% = +5', lineOf(bd, 'kultura'), 5);
bd = M.computeHappinessBreakdown(happy({ ownerIsHuman: false, ownCultureShare: 0 }), SOCIETY);
eq('normalny AI 0% = −15 (D bez zmian)', lineOf(bd, 'kultura'), -15);
bd = M.computeHappinessBreakdown(happy({ ownerIsHuman: false, era: 2 }), SOCIETY);
eq('normalny AI epoka 2 = +16', lineOf(bd, 'kultura'), 16);

M.setCulturaReligiaLevel('latwy');
bd = M.computeHappinessBreakdown(happy({ ownerIsHuman: false }), SOCIETY);
eq('latwy AI Szczescie: kultura 100% = +10', lineOf(bd, 'kultura'), 10);
bd = M.computeHappinessBreakdown(happy({ ownerIsHuman: false, ownCultureShare: 0 }), SOCIETY);
eq('latwy AI 0% = −10', lineOf(bd, 'kultura'), -10);
bd = M.computeHappinessBreakdown(happy({ ownerIsHuman: false, era: 3 }), SOCIETY);
eq('latwy AI epoka 3 = +23', lineOf(bd, 'kultura'), 23);
// latwy: AI i gracz dają te same wartości (G_ai = G gracza = +10, D = −10)
const bdLatwyP = M.computeHappinessBreakdown(happy({ ownerIsHuman: true, ownCultureShare: 0.3 }), SOCIETY);
const bdLatwyA = M.computeHappinessBreakdown(happy({ ownerIsHuman: false, ownCultureShare: 0.3 }), SOCIETY);
eq('latwy: AI = gracz (bit-w-bit, udział 30%)', lineOf(bdLatwyA, 'kultura'), lineOf(bdLatwyP, 'kultura'));

// ---------------------------------------------------------------------------
// 5. Tryb zgodności (poziom null): brak pola = dzisiejsze wartości, AI też.
// ---------------------------------------------------------------------------
M.setCulturaReligiaLevel(null);
eq('stan: zgodność (null)', M.getCulturaReligiaLevel(), null);
const bdNullP = M.computeHappinessBreakdown(happy({ ownerIsHuman: true, ownCultureShare: 0.3, ownReligionShare: 0.7 }), SOCIETY);
const bdNullA = M.computeHappinessBreakdown(happy({ ownerIsHuman: false, ownCultureShare: 0.3, ownReligionShare: 0.7 }), SOCIETY);
eq('null: kultura AI = gracz', lineOf(bdNullA, 'kultura'), lineOf(bdNullP, 'kultura'));
eq('null: religia AI = gracz', lineOf(bdNullA, 'religia'), lineOf(bdNullP, 'religia'));
check('null: brak linii Prawa (kultura_prawo) w Prawie', (() => {
  const law = M.computeLawBreakdown({ difficulty: 'hard', era: 1, population: 3, garnizonCount: 0, ownerIsHuman: false, ownCultureShare: 1, ownReligionShare: 1 }, SOCIETY);
  return !law.lines.some((l) => l.id === 'kultura_prawo' || l.id === 'religia_prawo');
})());

// ---------------------------------------------------------------------------
// 6. Prawo (silnik): linie Kultury i Religii w Prawie też z plusem AI.
// ---------------------------------------------------------------------------
M.setCulturaReligiaLevel('trudny');
function lawLine(law, id) {
  const l = law.lines.find((x) => x.id === id);
  return l ? l.value : 0;
}
const lawAI = M.computeLawBreakdown({ difficulty: 'hard', era: 1, population: 3, garnizonCount: 0, ownerIsHuman: false, ownCultureShare: 1, ownReligionShare: 1 }, SOCIETY);
eq('trudny AI Prawo: kultura_prawo = +10', lawLine(lawAI, 'kultura_prawo'), 10);
eq('trudny AI Prawo: religia_prawo = +10', lawLine(lawAI, 'religia_prawo'), 10);
const lawP = M.computeLawBreakdown({ difficulty: 'hard', era: 1, population: 3, garnizonCount: 0, ownerIsHuman: true, ownCultureShare: 1, ownReligionShare: 1 }, SOCIETY);
eq('trudny gracz Prawo: kultura_prawo = 0', lawLine(lawP, 'kultura_prawo'), 0);
const lawAI2 = M.computeLawBreakdown({ difficulty: 'hard', era: 2, population: 3, garnizonCount: 0, ownerIsHuman: false, ownCultureShare: 1, ownReligionShare: 1 }, SOCIETY);
eq('trudny AI epoka 2 Prawo: kultura_prawo = +16', lawLine(lawAI2, 'kultura_prawo'), 16);

// evaluateOrderFromBreakdown: typ właściciela z wejścia Szczęścia idzie też do Prawa.
const orderAI = M.evaluateOrderFromBreakdown(
  happy({ ownerIsHuman: false }),
  { difficulty: 'hard', era: 1, population: 3, garnizonCount: 0 },
  SOCIETY,
  'hard',
);
eq('Porządek AI: Szczęście kultura = +10', lineOf(orderAI.sz, 'kultura'), 10);
eq('Porządek AI: Prawo kultura_prawo = +10', lawLine(orderAI.prawo, 'kultura_prawo'), 10);
const orderP = M.evaluateOrderFromBreakdown(
  happy({ ownerIsHuman: true }),
  { difficulty: 'hard', era: 1, population: 3, garnizonCount: 0 },
  SOCIETY,
  'hard',
);
eq('Porządek gracz: Prawo kultura_prawo = 0', lawLine(orderP.prawo, 'kultura_prawo'), 0);
check('Porządek AI > gracz (PorPct)', orderAI.porPct > orderP.porPct, { ai: orderAI.porPct, p: orderP.porPct });

// ---------------------------------------------------------------------------
// 7. Hotseat: każdy człowiek = gracz (ownerIsHuman true) = brak pola.
// ---------------------------------------------------------------------------
const hotA = M.computeHappinessBreakdown(happy({ ownerIsHuman: true }), SOCIETY);
const hotB = M.computeHappinessBreakdown(happy({}), SOCIETY);
eq('hotseat: człowiek true = brak pola (kultura)', lineOf(hotA, 'kultura'), lineOf(hotB, 'kultura'));
eq('hotseat: człowiek true = brak pola (netto)', hotA.netto, hotB.netto);

// ---------------------------------------------------------------------------
// 8. Wiring potrzeby garnizonu AI: AI potrzebuje nie więcej garnizonu niż gracz.
// ---------------------------------------------------------------------------
const needAI = M.aiCityGarrisonNeedFromOrder(orderAI, SOCIETY, 'hard');
const needP = M.aiCityGarrisonNeedFromOrder(orderP, SOCIETY, 'hard');
check('garnizon AI <= gracz', needAI <= needP, { needAI, needP });

// ---------------------------------------------------------------------------
M.setCulturaReligiaLevel(null);
console.log(`ai-plus10-culture-test: ${pass} pass / ${fail} fail`);
try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
