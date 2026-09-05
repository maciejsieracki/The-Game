'use strict';
/**
 * szczescie-zamoznosc-test.cjs — Szczęście od udziału Zamożności w podziale Daniny netto.
 *
 * R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 G7 (właściciel 2026-09-05): dawna SIATKA co 10 p.p.
 * (`szczescie_siatka_zamoznosc`, rozpiętość 9 pkt, osobna trójka easy/normal/hard) została
 * zastąpiona SKALĄ LINIOWĄ: udział 0% → −10, 90% → +10, liniowo pomiędzy, 90–100% → +10
 * (zero dokładnie przy 45%). Trudność wyrażana jest odtąd WYŁĄCZNIE przez
 * `szczescie_max_epoka`, więc ta linia ma te same wartości na easy / normal / hard (G13).
 *
 * Sprawdza wszystkie 10 dziesiątek × 3 poziomy trudności (30 przypadków), brak schodków,
 * granice i wartości spoza zakresu.
 * Run: cd gra && node tools/szczescie-zamoznosc-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.szczescie-zamoznosc-entry.ts');
const BUNDLE = path.resolve(__dirname, '.szczescie-zamoznosc-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { luksusHappinessBonus, computeHappinessBreakdown } from '../src/game/society-breakdown';
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
  console.error('[szczescie-zamoznosc-test] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE);
const society = require('../data/society-params.json');

let passed = 0;
let failed = 0;

function eq(a, b, msg) {
  if (a === b) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + ' got ' + JSON.stringify(a) + ' expected ' + JSON.stringify(b)); }
}
function near(a, b, msg, eps) {
  const e = eps === undefined ? 1e-9 : eps;
  if (Math.abs(a - b) < e) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + ' got ' + JSON.stringify(a) + ' expected ~' + JSON.stringify(b)); }
}
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg); }
}

console.log('\n[szczescie-zamoznosc-test]\n');

// ---------------------------------------------------------------------------
// Skala referencyjna (G7, decyzja właściciela 2026-09-05) — LINIOWO od −10 przy udziale 0%
// do +10 przy udziale 90%. Liczby niżej wypisane są WPROST z tej reguły, nie odczytane
// z implementacji: wartość dla dziesiątki `idx` to (−90 + 20·idx)/9.
// PRZED G7 była tu siatka schodkowa, osobna per trudność:
//   easy [1..10], normal [-1..8], hard [-2..7].
// ---------------------------------------------------------------------------
const SKALA = [-90 / 9, -70 / 9, -50 / 9, -30 / 9, -10 / 9, 10 / 9, 30 / 9, 50 / 9, 70 / 9, 90 / 9];

console.log('1. Wszystkie 10 dziesiątek x 3 poziomy trudności (30 przypadków) + parytet trudności\n');
for (const diff of ['easy', 'normal', 'hard']) {
  for (let idx = 0; idx <= 9; idx++) {
    const pct = idx * 10;
    const expected = SKALA[idx];
    near(
      M.luksusHappinessBonus(pct, society, diff),
      expected,
      `${diff} @ ${pct}% -> ${expected >= 0 ? '+' : ''}${expected.toFixed(3)} (liniowo -10..+10)`,
    );
  }
}
// G13: trudność wyrażana WYŁĄCZNIE przez szczescie_max_epoka — ta linia ma być identyczna
// na wszystkich trzech poziomach. PRZED G7 każdy poziom miał własną siatkę i ta asercja
// nie miała prawa przejść; dziś jej złamanie znaczy, że ktoś wrócił do trójki per parametr.
for (let pct = 0; pct <= 100; pct += 5) {
  const [e, n, h] = ['easy', 'normal', 'hard'].map((d) => M.luksusHappinessBonus(pct, society, d));
  ok(e === n && n === h, `parytet trudności @ ${pct}%: easy = normal = hard (${n.toFixed(3)})`);
}

console.log('\n2. Trzy punkty kotwiczne wprost z decyzji właściciela (G7)\n');

// Trzy liczby, które właściciel podał wprost: 0% -> -10, 90% -> +10, 45% -> dokładnie 0.
eq(M.luksusHappinessBonus(0, society, 'normal'), -10, 'udział 0% -> -10 pkt Sz (dno skali)');
eq(M.luksusHappinessBonus(90, society, 'normal'), 10, 'udział 90% -> +10 pkt Sz (szczyt skali)');
eq(M.luksusHappinessBonus(45, society, 'normal'), 0, 'udział 45% -> DOKŁADNIE 0 (punkt obojętny)');

// Nasycenie powyżej progu: 90-100% to nadal +10, nie więcej.
eq(M.luksusHappinessBonus(100, society, 'easy'), 10, 'udział 100% -> +10 pkt Sz (obcięte progiem 90%)');

// Domyślne ustawienie nowego miasta (20% Zamożność) — PRZED G7 dawało +1 na normalnym
// (siatka, bracket 20-29). Po G7 to nadal jest poniżej punktu obojętnego 45%, więc KARA.
near(M.luksusHappinessBonus(20, society, 'normal'), -50 / 9,
  'udział 20% (domyślne miasto) -> -5,56 pkt Sz — poniżej punktu obojętnego 45%');

console.log('\n3. Brak schodków — punkty, które PRZED G7 leżały w jednym przedziale, dziś się różnią\n');

// PRZED G7 sprawdzało się tu off-by-one SIATKI: 9 vs 10, 19 vs 20, 89 vs 90 przeskakiwały
// o cały punkt, a 10 vs 19 (ten sam bracket) dawało IDENTYCZNIE. To była właściwość
// schodków. Po G7 schodków nie ma, więc sprawdzana jest właściwość odwrotna i mocniejsza:
// skala jest ŚCIŚLE ROSNĄCA aż do progu 90% — dwa różne udziały poniżej progu nie mogą
// dać tej samej liczby. Gdyby ktoś przywrócił siatkę, te asercje zaczerwienieją natychmiast.
for (const diff of ['easy', 'normal', 'hard']) {
  const w = (p) => M.luksusHappinessBonus(p, society, diff);
  ok(w(10) < w(19), `${diff}: 10% < 19% (PRZED G7 oba dawały tyle samo — jeden bracket)`);
  ok(w(20) < w(29), `${diff}: 20% < 29% (PRZED G7 oba dawały tyle samo — jeden bracket)`);
  ok(w(80) < w(89), `${diff}: 80% < 89% (PRZED G7 oba dawały tyle samo — jeden bracket)`);
  ok(w(9) < w(10), `${diff}: 9% < 10% (granica dawnego bracketu nadal rośnie, bez skoku)`);
  ok(w(19) < w(20), `${diff}: 19% < 20%`);
  ok(w(89) < w(90), `${diff}: 89% < 90%`);
}
// Krok jest STAŁY (liniowość), a nie skokowy: przyrost na 1 p.p. taki sam w całym zakresie.
{
  const w = (p) => M.luksusHappinessBonus(p, society, 'normal');
  const krok = 20 / 90;
  near(w(10) - w(9), krok, 'krok na 1 p.p. przy 9->10 = 20/90 (liniowość)');
  near(w(60) - w(59), krok, 'krok na 1 p.p. przy 59->60 = 20/90 — ten sam co niżej');
  near(w(90) - w(89), krok, 'krok na 1 p.p. przy 89->90 = 20/90 — ten sam aż do progu');
}
// Nasycenie ZA progiem: powyżej 90% skala stoi.
near(M.luksusHappinessBonus(95, society, 'normal'), 10, '95% -> +10 (nasycenie za progiem 90%)');
near(M.luksusHappinessBonus(100, society, 'normal'), 10, '100% -> +10 (nasycenie za progiem 90%)');

console.log('\n4. Wartości skrajne i spoza zakresu (clamp do [0,9] indeksu)\n');
eq(M.luksusHappinessBonus(-5, society, 'normal'), -10, 'udział ujemny (spoza zakresu) -> traktowany jak 0% -> -10');
eq(M.luksusHappinessBonus(150, society, 'easy'), 10, 'udział > 100% (spoza zakresu) -> traktowany jak >=90% -> +10');
eq(M.luksusHappinessBonus(NaN, society, 'normal'), -10, 'udział NaN -> traktowany jak 0% -> -10');

console.log('\n5. Integracja z computeHappinessBreakdown — kara pojawia się w rozpisce jako "wysokie_podatki"\n');
{
  const brk = M.computeHappinessBreakdown({
    population: 6,
    era: 2,
    buildingZadowolenie: 0,
    podzialHandlu: { procentNauka: 40, procentPieniadz: 55, procentLuksus: 5 },
    difficulty: 'normal',
  }, society);
  const line = brk.lines.find((l) => l.id === 'wysokie_podatki');
  eq(!!line, true, 'udział Zamożności 5% normal -> linia "wysokie_podatki" w rozpisce');
  near(line ? line.value : null, -80 / 9, 'udział Zamożności 5% normal -> wartość linii -8,89');
}
{
  // Druga strona punktu obojętnego: 60% Zamożności -> linia DODATNIA "niskie_podatki".
  // (PRZED G7 rolę tej próbki grało domyślne miasto z 20% Zamożności, bo stara siatka dawała
  // tam +1; po G7 20% leży poniżej punktu obojętnego 45%, więc próbka musiała się przesunąć
  // ponad ten punkt. Sprawdzana właściwość bez zmian: rozpiska pokazuje osobny, DODATNI
  // wiersz „niskie podatki", gdy udział Zamożności jest wysoki.)
  const brk = M.computeHappinessBreakdown({
    population: 6,
    era: 2,
    buildingZadowolenie: 0,
    podzialHandlu: { procentNauka: 20, procentPieniadz: 20, procentLuksus: 60 },
    difficulty: 'normal',
  }, society);
  const line = brk.lines.find((l) => l.id === 'niskie_podatki');
  eq(!!line, true, 'udział Zamożności 60% normal -> linia "niskie_podatki" w rozpisce');
  near(line ? line.value : null, 30 / 9, 'udział Zamożności 60% normal -> wartość linii +3,33');
}
{
  // Domyślne miasto (20% Nauka / 60% Skarbiec / 20% Zamożność, decyzja 74) — po G7 to KARA.
  // Zapisane wprost, żeby zmiana tej wartości nie przeszła niezauważona.
  const brk = M.computeHappinessBreakdown({
    population: 6,
    era: 2,
    buildingZadowolenie: 0,
    podzialHandlu: { procentNauka: 20, procentPieniadz: 60, procentLuksus: 20 },
    difficulty: 'normal',
  }, society);
  eq(!!brk.lines.find((l) => l.id === 'niskie_podatki'), false,
    'domyślne miasto (20% Zamożność) po G7 NIE ma już linii "niskie_podatki"');
  near(brk.lines.find((l) => l.id === 'wysokie_podatki')?.value, -50 / 9,
    'domyślne miasto (20% Zamożność) normal -> "wysokie_podatki" -5,56');
}

console.log('\n[szczescie-zamoznosc-test] ' + passed + ' OK, ' + failed + ' FAIL\n');
process.exit(failed > 0 ? 1 : 0);
