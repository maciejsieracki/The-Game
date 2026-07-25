'use strict';
/**
 * szczescie-zamoznosc-test.cjs — nowa siatka Szczęścia od udziału Zamożności w podziale
 * Daniny netto (Maciej 2026-07-25): co 10 p.p. udziału = 1 pkt Szczęścia miasta/turę,
 * z karą (wartość ujemna) poniżej 10% udziału na normal/hard.
 * Sprawdza wszystkie 10 przedziałów × 3 poziomy trudności (30 przypadków) + granice.
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

console.log('\n[szczescie-zamoznosc-test]\n');

// ---------------------------------------------------------------------------
// Siatka referencyjna (SPEC-DANINA-EKONOMIA.md, "NOWA SIATKA SZCZĘŚCIA od udziału
// Zamożności") — dziesięć przedziałów co 10 p.p., indeks = dziesiątka udziału.
// ---------------------------------------------------------------------------
const SIATKA = {
  easy:   [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  normal: [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8],
  hard:   [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7],
};

console.log('1. Wszystkie 10 przedziałów x 3 poziomy trudności (30 przypadków, próg dolny przedziału)\n');
for (const diff of ['easy', 'normal', 'hard']) {
  for (let idx = 0; idx <= 9; idx++) {
    const pct = idx * 10; // dolna granica przedziału (90 dla idx=9, przedział 90-100)
    const expected = SIATKA[diff][idx];
    eq(
      M.luksusHappinessBonus(pct, society, diff),
      expected,
      `${diff} @ ${pct}% (przedział ${idx * 10}-${idx === 9 ? 100 : idx * 10 + 9}%) -> ${expected >= 0 ? '+' : ''}${expected}`,
    );
  }
}

console.log('\n2. Przypadki jawnie wymagane w specyfikacji zadania\n');

// udział 0% i 9% na normalnym -> -1 pkt Szczęścia
eq(M.luksusHappinessBonus(0, society, 'normal'), -1, 'udział 0% normal -> -1 pkt Sz');
eq(M.luksusHappinessBonus(9, society, 'normal'), -1, 'udział 9% normal -> -1 pkt Sz');

// udział 5% na trudnym -> -2 pkt
eq(M.luksusHappinessBonus(5, society, 'hard'), -2, 'udział 5% hard -> -2 pkt Sz');

// udział 20% na normalnym -> +1 pkt (domyślne ustawienie nowego miasta: 20% Zamożność)
eq(M.luksusHappinessBonus(20, society, 'normal'), 1, 'udział 20% normal -> +1 pkt Sz (domyślne miasto)');

// udział 100% na łatwym -> +10 pkt
eq(M.luksusHappinessBonus(100, society, 'easy'), 10, 'udział 100% easy -> +10 pkt Sz');

console.log('\n3. Granice przedziałów (off-by-one) — 9 vs 10, 19 vs 20, 89 vs 90\n');

// 9% vs 10% (przejście z przedziału 0-9 do 10-19)
eq(M.luksusHappinessBonus(9, society, 'easy'), 1, '9% easy -> +1 (przedział 0-9)');
eq(M.luksusHappinessBonus(10, society, 'easy'), 2, '10% easy -> +2 (przedział 10-19)');
eq(M.luksusHappinessBonus(9, society, 'normal'), -1, '9% normal -> -1 (przedział 0-9)');
eq(M.luksusHappinessBonus(10, society, 'normal'), 0, '10% normal -> 0 (przedział 10-19)');
eq(M.luksusHappinessBonus(9, society, 'hard'), -2, '9% hard -> -2 (przedział 0-9)');
eq(M.luksusHappinessBonus(10, society, 'hard'), -1, '10% hard -> -1 (przedział 10-19)');

// 19% vs 20% (przejście z przedziału 10-19 do 20-29)
eq(M.luksusHappinessBonus(19, society, 'easy'), 2, '19% easy -> +2 (przedział 10-19)');
eq(M.luksusHappinessBonus(20, society, 'easy'), 3, '20% easy -> +3 (przedział 20-29)');
eq(M.luksusHappinessBonus(19, society, 'normal'), 0, '19% normal -> 0 (przedział 10-19)');
eq(M.luksusHappinessBonus(20, society, 'normal'), 1, '20% normal -> +1 (przedział 20-29)');
eq(M.luksusHappinessBonus(19, society, 'hard'), -1, '19% hard -> -1 (przedział 10-19)');
eq(M.luksusHappinessBonus(20, society, 'hard'), 0, '20% hard -> 0 (przedział 20-29)');

// 89% vs 90% (przejście z przedziału 80-89 do 90-100)
eq(M.luksusHappinessBonus(89, society, 'easy'), 9, '89% easy -> +9 (przedział 80-89)');
eq(M.luksusHappinessBonus(90, society, 'easy'), 10, '90% easy -> +10 (przedział 90-100)');
eq(M.luksusHappinessBonus(89, society, 'normal'), 7, '89% normal -> +7 (przedział 80-89)');
eq(M.luksusHappinessBonus(90, society, 'normal'), 8, '90% normal -> +8 (przedział 90-100)');
eq(M.luksusHappinessBonus(89, society, 'hard'), 6, '89% hard -> +6 (przedział 80-89)');
eq(M.luksusHappinessBonus(90, society, 'hard'), 7, '90% hard -> +7 (przedział 90-100)');

console.log('\n4. Wartości skrajne i spoza zakresu (clamp do [0,9] indeksu)\n');
eq(M.luksusHappinessBonus(-5, society, 'normal'), -1, 'udział ujemny (spoza zakresu) -> traktowany jak 0% -> -1');
eq(M.luksusHappinessBonus(150, society, 'easy'), 10, 'udział > 100% (spoza zakresu) -> traktowany jak 90-100% -> +10');
eq(M.luksusHappinessBonus(NaN, society, 'normal'), -1, 'udział NaN -> traktowany jak 0% -> -1');

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
  eq(line ? line.value : null, -1, 'udział Zamożności 5% normal -> wartość linii -1');
}
{
  // domyślne miasto: 20% Nauka / 60% Skarbiec / 20% Zamożność (decyzja 74) -> +1 Sz normal
  const brk = M.computeHappinessBreakdown({
    population: 6,
    era: 2,
    buildingZadowolenie: 0,
    podzialHandlu: { procentNauka: 20, procentPieniadz: 60, procentLuksus: 20 },
    difficulty: 'normal',
  }, society);
  const line = brk.lines.find((l) => l.id === 'niskie_podatki');
  eq(!!line, true, 'domyślne miasto (20% Zamożność) normal -> linia "niskie_podatki" w rozpisce');
  eq(line ? line.value : null, 1, 'domyślne miasto (20% Zamożność) normal -> wartość linii +1');
}

console.log('\n[szczescie-zamoznosc-test] ' + passed + ' OK, ' + failed + ' FAIL\n');
process.exit(failed > 0 ? 1 : 0);
