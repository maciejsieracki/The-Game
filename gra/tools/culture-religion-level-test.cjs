'use strict';
/**
 * culture-religion-level-test.cjs — R-WEB-CULT-REL-IMPL-Q1 (CULTIMPL).
 *
 * Ustawienie „Kultura i religia” (Mały wpływ łatwy / Neutralny normalny / Duży wpływ trudny):
 *   • linia Kultury i linia Religii liczą się do Szczęścia ORAZ do Prawa miasta;
 *   • wartość linii = (D + (G − D) · udział własnej) · skala epoki;
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
eq('trudny 0% epoka 2 (×1,6)', M.cultureReligionLineValue('trudny', X2 / X1, 0), -32);
eq('trudny 0% epoka 3 (×2,3)', M.cultureReligionLineValue('trudny', X3 / X1, 0), -46);
eq('normalny 100% epoka 2 (×1,6)', M.cultureReligionLineValue('normalny', X2 / X1, 1), 8);
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

// Kultura: udział 0% (100% obcej) → −20 w epoce 1, −32 w epoce 2, −46 w epoce 3.
let bd = M.computeHappinessBreakdown(baseHappy({ ownCultureShare: 0, ownReligionShare: 0.5 }), SOCIETY);
eq('trudny Szczescie: kultura 0% epoka1 = −20', lineOf(bd, 'kultura'), -20);
bd = M.computeHappinessBreakdown(baseHappy({ era: 2, ownCultureShare: 0, ownReligionShare: 0.5 }), SOCIETY);
eq('trudny Szczescie: kultura 0% epoka2 = −32', lineOf(bd, 'kultura'), -32);
bd = M.computeHappinessBreakdown(baseHappy({ era: 3, ownCultureShare: 0, ownReligionShare: 0.5 }), SOCIETY);
eq('trudny Szczescie: kultura 0% epoka3 = −46', lineOf(bd, 'kultura'), -46);
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
// 6. Mutacje czerwone: każda z nich ma być WYKRYTA przez powyższe asercje.
// ---------------------------------------------------------------------------
const swapped = { latwy: { D: 10, G: -10 }, normalny: { D: 5, G: -15 }, trudny: { D: 0, G: -20 } };
check('mutacja D/G: zamiana daje inny wynik (wykrywalne)',
  M.cultureReligionLineValue('trudny', 1, 0, swapped) !== -20);
check('mutacja skala: bez skali epok epoka 3 ≠ −46',
  M.cultureReligionLineValue('trudny', 1, 0) !== -46);

M.setCulturaReligiaLevel(undefined);

console.log(`culture-religion-level-test: ${pass} pass / ${fail} fail`);
try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
