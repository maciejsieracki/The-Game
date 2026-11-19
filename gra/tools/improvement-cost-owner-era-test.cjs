'use strict';
/**
 * R-WEB-ECONOMY-IMPROVEMENT-COST-OWNER-ERA-AND-ORE-MINES-X2-Q1 — koszt budowy ulepszenia wg EPOKI WLASCICIELA.
 *
 * Bramka bundluje prawdziwe moduly czyste (esbuild). Sprawdza:
 *  - tabela kosztow dla wlasciciela w Kamieniu / Brazie / Zelazie (farma 20/40/80),
 *  - kopalnie rudy x2 w danych (miedz/cyna 44 -> 88 w Brazie, zelazo 176 w Zelazie; zloto bez zmian),
 *  - koszt zalezy od epoki WLASCICIELA, nie od epoki odblokowania ulepszenia,
 *  - flaga OFF = wzor sprzed zmiany (epoka ulepszenia), bit-w-bit,
 *  - jedna funkcja: getImprovementMeta(key, ownerEra) == scaleTerrainImprovementWorkCostForOwner(...).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.improvement-cost-owner-era-entry.ts');
const BUNDLE = path.resolve(__dirname, '.improvement-cost-owner-era-bundle.cjs');
const SRC = path.resolve(__dirname, '..', 'src');
const DATA = require(path.resolve(__dirname, '..', 'data', 'terrain-improvements.json'));

fs.writeFileSync(ENTRY, `
export {
  scaleTerrainImprovementWorkCost,
  scaleTerrainImprovementWorkCostForOwner,
  setImprovementCostOwnerEraForTest,
  isImprovementCostOwnerEraEnabled,
} from ${JSON.stringify(path.join(SRC, 'game/terrain-improvements.ts'))};
export { getImprovementMeta } from ${JSON.stringify(path.join(SRC, 'game/improvement-tech.ts'))};
`, 'utf8');

let M;
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
  M = require(BUNDLE);
} finally {
  try { fs.unlinkSync(ENTRY); } catch (_) {}
}

let pass = 0;
let fail = 0;
function same(actual, expected, label) {
  if (Object.is(actual, expected)) { pass++; console.log('PASS: ' + label); return; }
  fail++;
  console.log('FAIL: ' + label + ': expected ' + expected + ', got ' + actual);
}
function ok(cond, label) { same(!!cond, true, label); }

// 0. dane: kopalnie rudy x2, zloto bez zmiany
same(DATA.kopalnia_miedzi.koszt_praca, 44, 'kopalnia_miedzi koszt_praca w danych = 44 (bylo 22)');
same(DATA.kopalnia_cyny.koszt_praca, 44, 'kopalnia_cyny koszt_praca w danych = 44 (bylo 22)');
same(DATA.kopalnia_zelaza.koszt_praca, 44, 'kopalnia_zelaza koszt_praca w danych = 44 (bylo 22)');
same(DATA.kopalnia_zlota.koszt_praca, 22, 'kopalnia_zlota BEZ zmiany (22)');

// 1. flaga domyslna ON (dane)
ok(M.isImprovementCostOwnerEraEnabled() === true, 'flaga kosztUlepszenWgEpokiWlasciciela domyslnie ON');

// 2. farma (baza 20) wg epoki WLASCICIELA: Kamien 20, Braz 40, Zelazo 80
same(M.scaleTerrainImprovementWorkCostForOwner(20, 1, 1), 20, 'farma: wlasciciel Kamien = 20');
same(M.scaleTerrainImprovementWorkCostForOwner(20, 1, 2), 40, 'farma: wlasciciel Braz = 40');
same(M.scaleTerrainImprovementWorkCostForOwner(20, 1, 3), 80, 'farma: wlasciciel Zelazo = 80');
same(M.scaleTerrainImprovementWorkCostForOwner(20, 1, 4), 160, 'farma: wlasciciel era 4 = 160 (x2 od Zelaza)');

// 3. kopalnie rudy (dane 44 -> baza FALA2 88): Braz 88, Zelazo 176; Kamien 44 (przed odblokowaniem nieistotne)
same(M.getImprovementMeta('kopalnia_miedzi', 2)?.kosztPraca, 88, 'kopalnia miedzi: wlasciciel Braz = 88');
same(M.getImprovementMeta('kopalnia_cyny', 2)?.kosztPraca, 88, 'kopalnia cyny: wlasciciel Braz = 88');
same(M.getImprovementMeta('kopalnia_zelaza', 3)?.kosztPraca, 176, 'kopalnia zelaza: wlasciciel Zelazo = 176');
same(M.getImprovementMeta('kopalnia_zelaza', 2)?.kosztPraca, 88, 'kopalnia zelaza: wlasciciel Braz = 88');
same(M.getImprovementMeta('kopalnia_zlota', 2)?.kosztPraca, 44, 'kopalnia zlota (bez zmiany danych 22): wlasciciel Braz = 44');

// 4. koszt zalezy od epoki WLASCICIELA, nie od epoki ulepszenia (farma epoka 1, wlasciciel Zelazo -> 80)
same(M.getImprovementMeta('farma', 3)?.kosztPraca, 80, 'farma (epoka ulepszenia 1) u wlasciciela Zelaza = 80');
same(M.getImprovementMeta('fort', 1)?.kosztPraca, 25, 'fort (baza 25 -> FALA2 50) u wlasciciela Kamien = 25 (0,5x)');
same(M.getImprovementMeta('fort', 3)?.kosztPraca, 100, 'fort u wlasciciela Zelaza = 100 (2x)');

// 5. brak epoki wlasciciela -> 1 (Kamien), tak jak reszta kodu (?? 1)
same(M.getImprovementMeta('farma')?.kosztPraca, 20, 'brak ownerEra -> Kamien (20)');
same(M.scaleTerrainImprovementWorkCostForOwner(20, 3, undefined), 20, 'brak ownerEra w funkcji -> Kamien (20)');

// 6. flaga OFF = wzor sprzed zmiany (epoka ulepszenia), bit-w-bit wzgledem scaleTerrainImprovementWorkCost
M.setImprovementCostOwnerEraForTest(false);
ok(M.isImprovementCostOwnerEraEnabled() === false, 'flaga OFF (test override) dziala');
for (const [base, era] of [[20, 1], [20, 2], [20, 3], [44, 2], [44, 3], [25, 3], [0, 3]]) {
  for (const owner of [1, 2, 3]) {
    same(
      M.scaleTerrainImprovementWorkCostForOwner(base, era, owner),
      M.scaleTerrainImprovementWorkCost(base, era),
      `flaga OFF: base ${base} epoka ${era} owner ${owner} = stary wzor`,
    );
  }
}
same(M.getImprovementMeta('farma', 3)?.kosztPraca, 20, 'flaga OFF: farma u wlasciciela Zelaza nadal 20 (epoka ulepszenia)');
same(M.getImprovementMeta('kopalnia_zelaza', 2)?.kosztPraca, 88, 'flaga OFF: kopalnia zelaza = 88 jak przed zmiana (epoka ulepszenia 3 x dane przed x2 22 x2)');
M.setImprovementCostOwnerEraForTest(null);
ok(M.isImprovementCostOwnerEraEnabled() === true, 'override null -> wartosc z danych (ON)');

// 7. zero / NaN bazy -> 0 (bez zmian wzgledem dawnego zachowania)
same(M.scaleTerrainImprovementWorkCostForOwner(0, 1, 3), 0, 'baza 0 -> 0');
same(M.scaleTerrainImprovementWorkCostForOwner(Number.NaN, 1, 3), 0, 'baza NaN -> 0');

// 8. gracz i AI jednakowo: ta sama funkcja, ten sam wynik dla tej samej epoki wlasciciela
for (const owner of [1, 2, 3]) {
  same(
    M.getImprovementMeta('farma', owner)?.kosztPraca,
    M.scaleTerrainImprovementWorkCostForOwner(DATA.farma.koszt_praca, DATA.farma.epoka, owner),
    `gracz/AI parytet: farma owner ${owner} z jednej funkcji`,
  );
}

console.log(`\nimprovement-cost-owner-era-test: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
