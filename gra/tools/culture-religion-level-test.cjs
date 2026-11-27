'use strict';
/**
 * culture-religion-level-test.cjs — R-WEB-CULT-REL-IMPL-Q1 (CULTIMPL).
 *
 * Ustawienie „Kultura i religia” (Mały wpływ łatwy / Neutralny normalny / Duży wpływ trudny):
 *   • linia Kultury i linia Religii liczą się do Szczęścia ORAZ do Prawa miasta;
 *   • wartość linii = D_e + (G_e − D_e) · udział własnej, D_e = D − Δ, G_e = G + Δ, Δ = 10·(skala−1)
 *     (R-WEB-CULT-REL-AI-PLUS10-Q1 runda 2: formuła ADDYTYWNA dla gracza i AI);
 *   • łatwy = dziś (2·x·udział − x), brak pola (zgodność) = dziś, bez linii Prawa.
 *
 * Zgodnie ze stałą regułą właściciela (2026-11-26) testy silnika idą na poziomie MAKSYMALNYM
 * (trudny / Duży wpływ). Tabela trzech poziomów jest sprawdzana wyłącznie w teście czystej
 * funkcji (specyfikacja produktu).
 *
 * Mutacje czerwone (sprawdzone w tym pliku): zamiana D/G, brak skali epok, brak linii Prawa,
 * brak ścieżki zgodności — każda z nich łamie co najmniej jedną asercję.
 *
 * Run: cd gra && node tools/culture-religion-level-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.culture-religion-level-entry.ts');
const BUNDLE = path.resolve(__dirname, '.culture-religion-level-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  computeHappinessBreakdown,
  computeLawBreakdown,
  evaluateOrderFromBreakdown,
  proporcjonalneSzczescie,
} from '../src/game/society-breakdown';
export {
  cultureReligionLineValue,
  CULTURA_RELIGIA_BOUNDS_DEFAULT,
  normalizeCulturaReligiaLevel,
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
  console.error('[culture-religion-level-test] bundle failed:', e.message || e);
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
  check(name, Object.is(got, want) || got === want, { got, want });
}

// Skala epok z danych (klucz szczescie_skala_kultura_religia, poziom trudności MAX = hard).
const skalaHard = SOCIETY.szczescie.szczescie_skala_kultura_religia.hard;
const X1 = skalaHard[0];
const X2 = skalaHard[1];
const X3 = skalaHard[2];
check('dane: skala epok hard = 10/16/23', X1 === 10 && X2 === 16 && X3 === 23, skalaHard);

// ---------------------------------------------------------------------------
// 1. Czysta funkcja: specyfikacja trzech poziomów (granice D/G, udział, skala).
// ---------------------------------------------------------------------------
const B = M.CULTURA_RELIGIA_BOUNDS_DEFAULT;
eq('granice latwy D', B.latwy.D, -10);
eq('granice latwy G', B.latwy.G, 10);
eq('granice normalny D', B.normalny.D, -15);
eq('granice normalny G', B.normalny.G, 5);
eq('granice trudny D', B.trudny.D, -20);
eq('granice trudny G', B.trudny.G, 0);

eq('latwy 0% x1', M.cultureReligionLineValue('latwy', 1, 0), -10);
eq('latwy 100% x1', M.cultureReligionLineValue('latwy', 1, 1), 10);
eq('latwy 50% x1', M.cultureReligionLineValue('latwy', 1, 0.5), 0);
eq('normalny 0% x1', M.cultureReligionLineValue('normalny', 1, 0), -15);
eq('normalny 100% x1', M.cultureReligionLineValue('normalny', 1, 1), 5);
eq('trudny 0% x1', M.cultureReligionLineValue('trudny', 1, 0), -20);
eq('trudny 100% x1 (zero, brak plusów)', M.cultureReligionLineValue('trudny', 1, 1), 0);
eq('trudny 50% x1', M.cultureReligionLineValue('trudny', 1, 0.5), -10);
// skala epok ×1,6 i ×2,3
eq('trudny 0% epoka 2 (addytywnie: −26)', M.cultureReligionLineValue('trudny', X2 / X1, 0), -26);
eq('trudny 0% epoka 3 (addytywnie: −33)', M.cultureReligionLineValue('trudny', X3 / X1, 0), -33);
eq('normalny 100% epoka 2 (addytywnie: +11)', M.cultureReligionLineValue('normalny', X2 / X1, 1), 11);
// udział spoza [0,1] jest ścinany
eq('trudny udział >1 ścięty', M.cultureReligionLineValue('trudny', 1, 7), 0);
eq('trudny udział <0 ścięty', M.cultureReligionLineValue('trudny', 1, -3), -20);

// normalizacja stanu (zapis bez pola = zgodność)
eq('normalize: brak pola = null', M.normalizeCulturaReligiaLevel(undefined), null);
eq('normalize: null = null', M.normalizeCulturaReligiaLevel(null), null);
eq('normalize: zła wartość = null', M.normalizeCulturaReligiaLevel('bogus'), null);
eq('normalize: trudny', M.normalizeCulturaReligiaLevel('trudny'), 'trudny');
eq('normalize: normalny', M.normalizeCulturaReligiaLevel('normalny'), 'normalny');

// ---------------------------------------------------------------------------
// 2. Szczęście: poziom MAKSYMALNY (trudny) — wartości linii w silniku.
// ---------------------------------------------------------------------------
const baseHappy = (over) => Object.assign({
  difficulty: 'hard',
  era: 1,
  population: 3,
  buildingZadowolenie: 0,
  haRel: 0,
}, over);

function lineOf(bd, id) {
  const l = bd.lines.find((x) => x.id === id);
  return l ? l.value : undefined;
}

M.setCulturaReligiaLevel('trudny');
eq('stan: trudny ustawiony', M.getCulturaReligiaLevel(), 'trudny');

// Kultura: udział 0% (100% obcej) → −20 w epoce 1, −26 w epoce 2, −33 w epoce 3.
let bd = M.computeHappinessBreakdown(baseHappy({ ownCultureShare: 0, ownReligionShare: 0.5 }), SOCIETY);
eq('trudny Szczescie: kultura 0% epoka1 = −20', lineOf(bd, 'kultura'), -20);
bd = M.computeHappinessBreakdown(baseHappy({ era: 2, ownCultureShare: 0, ownReligionShare: 0.5 }), SOCIETY);
eq('trudny Szczescie: kultura 0% epoka2 = −26', lineOf(bd, 'kultura'), -26);
bd = M.computeHappinessBreakdown(baseHappy({ era: 3, ownCultureShare: 0, ownReligionShare: 0.5 }), SOCIETY);
eq('trudny Szczescie: kultura 0% epoka3 = −33', lineOf(bd, 'kultura'), -33);
// Kultura 100% własnej na trudnym = 0 → linia pominięta (brak plusów).
bd = M.computeHappinessBreakdown(baseHappy({ ownCultureShare: 1, ownReligionShare: 0.5 }), SOCIETY);
check('trudny Szczescie: kultura 100% nie daje plusa', lineOf(bd, 'kultura') === undefined, lineOf(bd, 'kultura'));
// Religia 0% → −20.
bd = M.computeHappinessBreakdown(baseHappy({ ownCultureShare: 1, ownReligionShare: 0 }), SOCIETY);
eq('trudny Szczescie: religia 0% = −20', lineOf(bd, 'religia'), -20);

// Mutacja „brak skali epok”: epoka 2 nie może dać −20.
check('mutacja skala: epoka 2 ≠ −20', lineOf(
  M.computeHappinessBreakdown(baseHappy({ era: 2, ownCultureShare: 0, ownReligionShare: 0.5 }), SOCIETY), 'kultura') !== -20);

// ---------------------------------------------------------------------------
// 3. Prawo: linie Kultury i Religii obecne przy poziomie, te same punkty co w Szczęściu.
// ---------------------------------------------------------------------------
const baseLaw = (over) => Object.assign({
  difficulty: 'hard',
  era: 1,
  population: 3,
  garnizonCount: 0,
}, over);

const lawHappy = { difficulty: 'hard', era: 1, population: 3, buildingZadowolenie: 0, haRel: 0, ownCultureShare: 0 };
const lawBd = M.evaluateOrderFromBreakdown(lawHappy, baseLaw({}), SOCIETY, 'hard');
const kPrawo = lawBd.prawo.lines.find((l) => l.id === 'kultura_prawo');
const rPrawo = lawBd.prawo.lines.find((l) => l.id === 'religia_prawo');
check('trudny Prawo: linia kultury obecna', !!kPrawo, lawBd.prawo.lines.map((l) => l.id));
eq('trudny Prawo: kultura 0% = −20', kPrawo && kPrawo.value, -20);
// religia: brak haRel i brak ownReligionShare → 0,5 → trudny 50% = −10 (nie 0)
eq('trudny Prawo: religia 50% = −10', rPrawo && rPrawo.value, -10);

// Mutacja „brak linii Prawa”: bez ustawienia (zgodność) linii Prawa być nie może.
M.setCulturaReligiaLevel(undefined);
const legacyLaw = M.evaluateOrderFromBreakdown(lawHappy, baseLaw({}), SOCIETY, 'hard');
check('zgodność: brak linii kultura_prawo', !legacyLaw.prawo.lines.some((l) => l.id === 'kultura_prawo'));
check('zgodność: brak linii religia_prawo', !legacyLaw.prawo.lines.some((l) => l.id === 'religia_prawo'));
M.setCulturaReligiaLevel('trudny');
check('trudny: Prawo różni się od zgodności', lawBd.prawo.netto !== legacyLaw.prawo.netto,
  { trudny: lawBd.prawo.netto, zgodnosc: legacyLaw.prawo.netto });

// ---------------------------------------------------------------------------
// 4. Zgodność (brak poziomu) = dzisiejsze Szczęście, a łatwy = ten sam wynik bit-w-bit.
// ---------------------------------------------------------------------------
const grid = [0, 0.1, 0.25, 1 / 3, 0.45, 0.5, 0.75, 0.9, 1];
const eras = [1, 2, 3];
let bitMismatch = 0;
let bitChecked = 0;
for (const era of eras) {
  for (const cs of grid) {
    for (const rs of grid) {
      const inp = baseHappy({ era, ownCultureShare: cs, ownReligionShare: rs });
      M.setCulturaReligiaLevel(undefined);
      const legacy = M.computeHappinessBreakdown(inp, SOCIETY);
      M.setCulturaReligiaLevel('latwy');
      const easy = M.computeHappinessBreakdown(inp, SOCIETY);
      bitChecked++;
      const lk = lineOf(legacy, 'kultura');
      const ek = lineOf(easy, 'kultura');
      const lr = lineOf(legacy, 'religia');
      const er = lineOf(easy, 'religia');
      if (lk !== ek || lr !== er || legacy.netto !== easy.netto || legacy.szPct !== easy.szPct) bitMismatch++;
      // Dzisiejszy wzór: 2·x·udział − x (x = 10/16/23).
      const x = era === 1 ? X1 : era === 2 ? X2 : X3;
      if (lk !== undefined && lk !== 2 * x * cs - x) bitMismatch++;
    }
  }
}
eq('zgodność/latwy: bit-w-bit wobec dzisiejszego wzoru (liczba przypadków)', bitMismatch, 0);
eq('zgodność: siatka 3 epoki × 9 × 9 = 243 przypadków', bitChecked, 243);

// Zgodność: brak poziomu = brak linii Prawa z kultury/religii w rozpisce Prawa.
M.setCulturaReligiaLevel(undefined);
const legacySz = M.computeHappinessBreakdown(baseHappy({ ownCultureShare: 0, ownReligionShare: 0 }), SOCIETY);
eq('zgodność Szczęście: kultura 0% = −10 (dziś, epoka 1)', lineOf(legacySz, 'kultura'), -10);
M.setCulturaReligiaLevel('trudny');

// ---------------------------------------------------------------------------
// 5. Granice z danych: nadpisanie D/G z JSON (dane są źródłem prawdy).
// ---------------------------------------------------------------------------
const jsonLevels = SOCIETY.kultura_religia_poziomy;
check('dane: blok kultura_religia_poziomy istnieje', !!jsonLevels);
eq('dane: trudny D', jsonLevels.trudny.D, -20);
eq('dane: trudny G', jsonLevels.trudny.G, 0);
eq('dane: normalny D', jsonLevels.normalny.D, -15);
eq('dane: normalny G', jsonLevels.normalny.G, 5);
eq('dane: latwy D', jsonLevels.latwy.D, -10);
eq('dane: latwy G', jsonLevels.latwy.G, 10);

// ---------------------------------------------------------------------------
// 6. Prawo: skala epok 2/3, poziom łatwy i normalny, źródło udziału religii (haRel).
//    (Mutacje czerwone na źródle: uruchamiane osobno w raporcie obrony; asercje poniżej
//    są ich wykrywaczami — każda zmiana D/G, skali, linii Prawa lub źródła udziału łamie je.)
// ---------------------------------------------------------------------------
const lawLine = (res, id) => {
  const l = res.prawo.lines.find((x) => x.id === id);
  return l ? l.value : undefined;
};
const lawInp = (over) => Object.assign({ difficulty: 'hard', era: 1, population: 3, garnizonCount: 0 }, over);
const happyBase = { difficulty: 'hard', era: 1, population: 3, buildingZadowolenie: 0, haRel: 0 };

M.setCulturaReligiaLevel('trudny');
let r2 = M.evaluateOrderFromBreakdown({ ...happyBase, era: 2, ownCultureShare: 0 }, lawInp({ era: 2 }), SOCIETY, 'hard');
eq('trudny Prawo: kultura 0% epoka2 = −26', lawLine(r2, 'kultura_prawo'), -26);
let r3 = M.evaluateOrderFromBreakdown({ ...happyBase, era: 3, ownCultureShare: 0 }, lawInp({ era: 3 }), SOCIETY, 'hard');
eq('trudny Prawo: kultura 0% epoka3 = −33', lawLine(r3, 'kultura_prawo'), -33);
eq('trudny Prawo: religia epoka3 (haRel 0 → 50%) = −10', lawLine(r3, 'religia_prawo'), -10);

// Źródło udziału religii w Prawie = to samo co w Szczęściu (haRel, bez ownReligionShare).
const rHa = M.evaluateOrderFromBreakdown({ ...happyBase, haRel: -1, ownCultureShare: 1 }, lawInp({}), SOCIETY, 'hard');
eq('trudny Prawo: haRel −1 → religia 0% = −20', lawLine(rHa, 'religia_prawo'), -20);
const szHa = M.computeHappinessBreakdown({ ...happyBase, haRel: -1, ownCultureShare: 1 }, SOCIETY);
eq('trudny Szczescie: haRel −1 → religia 0% = −20 (zgodnie z Prawem)', lineOf(szHa, 'religia'), -20);
const rHaComputeLaw = M.computeLawBreakdown(lawInp({ haRel: -1, ownCultureShare: 1 }), SOCIETY);
eq('computeLawBreakdown bezpośrednio: haRel −1 → religia −20', lawLine({ prawo: rHaComputeLaw }, 'religia_prawo'), -20);

// Poziom łatwy: Prawo dostaje linie (kultura 100% = +10), Szczęście = dziś.
M.setCulturaReligiaLevel('latwy');
const rEasy = M.evaluateOrderFromBreakdown({ ...happyBase, ownCultureShare: 1, ownReligionShare: 1 }, lawInp({}), SOCIETY, 'hard');
eq('łatwy Prawo: kultura 100% = +10', lawLine(rEasy, 'kultura_prawo'), 10);
eq('łatwy Prawo: religia 100% = +10', lawLine(rEasy, 'religia_prawo'), 10);

// Poziom normalny: Szczęście i Prawo (kultura 0% = −15, 100% = +5; epoka 2 addytywnie → +11).
M.setCulturaReligiaLevel('normalny');
const nSz = M.computeHappinessBreakdown({ ...happyBase, ownCultureShare: 0, ownReligionShare: 1 }, SOCIETY);
eq('normalny Szczescie: kultura 0% = −15', lineOf(nSz, 'kultura'), -15);
const nSz2 = M.computeHappinessBreakdown({ ...happyBase, era: 2, ownCultureShare: 1, ownReligionShare: 1 }, SOCIETY);
eq('normalny Szczescie: kultura 100% epoka2 = +11', lineOf(nSz2, 'kultura'), 11);
const nPr = M.evaluateOrderFromBreakdown({ ...happyBase, era: 2, ownCultureShare: 1, ownReligionShare: 1 }, lawInp({ era: 2 }), SOCIETY, 'hard');
eq('normalny Prawo: kultura 100% epoka2 = +11', lawLine(nPr, 'kultura_prawo'), 11);

// ---------------------------------------------------------------------------
// 8. R-WEB-CULT-REL-AI-PLUS10-Q1 (runda 3, zarzut Evaluatora nr 4): tabela AI i rozdział
//    poziomu gracza/AI. Każda mutacja tutaj MUSI być czerwona:
//    (a) AI liczy plus gracza (G), (b) AI czyta poziom gracza, (c) typ właściciela zignorowany.
// ---------------------------------------------------------------------------
const AI_PLUS = [10, 16, 23];          // plus AI: stały na każdym poziomie (epoka 1/2/3)
const AI_MINUS = { latwy: [-10, -16, -23], normalny: [-15, -21, -28], trudny: [-20, -26, -33] };
const PLAYER_PLUS = { latwy: [10, 16, 23], normalny: [5, 11, 18], trudny: [0, 6, 13] };
const eraScale = [1, 1.6, 2.3];
const lvls = ['latwy', 'normalny', 'trudny'];

// 8a. Czysta funkcja: AI (ownerIsHuman=false) — plus stały, minus wg poziomu; gracz — tabela gracza.
for (const lvl of lvls) {
  for (let i = 0; i < 3; i++) {
    const k = eraScale[i];
    eq(`AI ${lvl} epoka${i + 1}: udział 100% = +${AI_PLUS[i]}`,
      M.cultureReligionLineValue(lvl, k, 1, undefined, false), AI_PLUS[i]);
    eq(`AI ${lvl} epoka${i + 1}: udział 0% = ${AI_MINUS[lvl][i]}`,
      M.cultureReligionLineValue(lvl, k, 0, undefined, false), AI_MINUS[lvl][i]);
    eq(`gracz ${lvl} epoka${i + 1}: udział 100% = +${PLAYER_PLUS[lvl][i]}`,
      M.cultureReligionLineValue(lvl, k, 1, undefined, true), PLAYER_PLUS[lvl][i]);
    eq(`gracz ${lvl} epoka${i + 1}: udział 0% = ${AI_MINUS[lvl][i]}`,
      M.cultureReligionLineValue(lvl, k, 0, undefined, true), AI_MINUS[lvl][i]);
  }
}

// 8b. Silnik: AI z poziomem AI latwy, gracz trudny (rozdział poziomów, udział 0% i 100%).
M.setCulturaReligiaLevel('trudny', 'latwy');
const aiOwnerAt = (cs, era) => M.computeHappinessBreakdown(
  { ...happyBase, era, ownCultureShare: cs, ownReligionShare: cs, ownerIsHuman: false }, SOCIETY);
const plOwnerAt = (cs, era) => M.computeHappinessBreakdown(
  { ...happyBase, era, ownCultureShare: cs, ownReligionShare: cs, ownerIsHuman: true }, SOCIETY);
eq('AI latwy (gracz trudny) epoka1 kultura 100% = +10 (a nie gracza 0)', lineOf(aiOwnerAt(1, 1), 'kultura'), 10);
eq('AI latwy (gracz trudny) epoka1 kultura 0% = −10 (a nie gracza −20)', lineOf(aiOwnerAt(0, 1), 'kultura'), -10);
eq('AI latwy epoka3 kultura 0% = −23 (mutacja: AI czyta gracza → −33)', lineOf(aiOwnerAt(0, 3), 'kultura'), -23);
eq('AI latwy epoka3 kultura 100% = +23', lineOf(aiOwnerAt(1, 3), 'kultura'), 23);
// (linia o wartości 0 nie trafia do rozpiski — `if (kultV)` w society-breakdown; brak = 0)
eq('gracz trudny epoka1 kultura 100% = 0', lineOf(plOwnerAt(1, 1), 'kultura') ?? 0, 0);
eq('gracz trudny epoka2 kultura 100% = +6', lineOf(plOwnerAt(1, 2), 'kultura'), 6);
eq('gracz trudny epoka3 kultura 100% = +13', lineOf(plOwnerAt(1, 3), 'kultura'), 13);
eq('gracz trudny epoka3 kultura 0% = −33', lineOf(plOwnerAt(0, 3), 'kultura'), -33);
// Prawo dla AI: ta sama tabela (typ właściciela w computeLawBreakdown).
const aiLaw = M.computeLawBreakdown(lawInp({ era: 3, ownCultureShare: 0, ownerIsHuman: false }), SOCIETY);
eq('AI latwy Prawo epoka3 kultura 0% = −23', lawLine({ prawo: aiLaw }, 'kultura_prawo'), -23);
const plLaw = M.computeLawBreakdown(lawInp({ era: 3, ownCultureShare: 0, ownerIsHuman: true }), SOCIETY);
eq('gracz trudny Prawo epoka3 kultura 0% = −33', lawLine({ prawo: plLaw }, 'kultura_prawo'), -33);

// 8d. AI na trudnym przy 100% własnej = +10 (plus AI), NIE 0 (plus gracza trudnego). Wykrywa
//     mutację „kultReligLinePoints przekazuje typ właściciela jako gracza”.
M.setCulturaReligiaLevel('trudny', 'trudny');
eq('AI trudny epoka1 kultura 100% = +10 (plus AI, nie gracza)', lineOf(aiOwnerAt(1, 1), 'kultura'), 10);
eq('AI trudny epoka3 religia 100% = +23', lineOf({ ...aiOwnerAt(1, 3) }, 'religia'), 23);

// 8c. Zgodność (poziom null) dla AI też bez linii (tryb zgodności nietknięty).
M.setCulturaReligiaLevel(undefined, 'trudny');
const aiLegacy = M.computeHappinessBreakdown({ ...happyBase, ownCultureShare: 0, ownerIsHuman: false }, SOCIETY);
eq('zgodność AI: kultura 0% = −10 (dziś, bit-w-bit)', lineOf(aiLegacy, 'kultura'), -10);

// Mutacje czerwone uruchomione na źródle: patrz raport obrony (30-obrona-claude.md).
M.setCulturaReligiaLevel('trudny');

M.setCulturaReligiaLevel(undefined);

console.log(`culture-religion-level-test: ${pass} pass / ${fail} fail`);
try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
