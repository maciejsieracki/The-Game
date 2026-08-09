'use strict';
/**
 * city-growth-percent-rounding-parity-test.cjs -- P-ETYKIETA-WZROST-ZAOKRAGLENIE-ROZJAZD
 * Run: cd gra && node tools/city-growth-percent-rounding-parity-test.cjs
 *
 * Kontekst (nota Evaluatora przy P-ETYKIETA-WZROST-SEPARATOR-ROZJAZD, 2026-08-09): panel miasta
 * zaokrągla WZROST% przez `Number(x.toFixed(1))` (`formatLiczbaPl` w `src/ui/formatPl.ts`),
 * plakietka mapy przez `Math.round(x*10)/10` (`formatCityGrowthPercentLabel` w
 * `src/render/cityMapStatChip.ts`). Te dwa wzory dają RÓŻNE wyniki dla ok. 200 wartości w
 * zakresie [-20, 20] przy kroku próbkowania 0,01 (np. `0.15` -> panel „0,1%", plakietka „0,2%" --
 * klasyczny problem zaokrąglenia `toFixed` przy liczbach w połowie z powodu reprezentacji
 * zmiennoprzecinkowej).
 *
 * DECYZJA OPERATORA (2026-08-09): NIE ujednolicać wzoru w kodzie produkcyjnym. `formatLiczbaPl`
 * jest funkcją ogólnego przeznaczenia dzieloną przez 16+ konsumentów niezwiązanych z WZROST%
 * (`diplomacyAcceptanceBalance.ts` x12, `unitCardStatus.ts` x4) -- zmiana jej wzoru zaokrąglenia
 * niosłaby ryzyko regresji poza zakresem tego zgłoszenia, podczas gdy dziś rozjazd jest
 * MATEMATYCZNIE NIEOSIĄGALNY: realny krok formuły wzrostu (`WYZYWIENIE_STEP` w
 * `src/game/population-growth-v85.ts`) to 0,5, a wszystkie sześć składników sumy w
 * `computeGrowthPercentV85()` są dziś wielokrotnościami tego kroku -- przy kroku 0,5 oba wzory
 * dają identyczny wynik (dowód: 165 165 kombinacji sześciu składników, 0 rozjazdów -- zobacz
 * sekcję [2] niżej dla wersji uruchamialnej).
 *
 * Zamiast zmiany kodu: przypięty niezmiennik `WYZYWIENIE_STEP === 0.5` (sekcja [1]) + parytet
 * zaokrąglenia zweryfikowany na PEŁNYM realnym zakresie wielokrotności kroku produkcyjnego
 * (sekcja [2], czytanym z eksportu, nie zaszytym na sztywno) + kanarek dowodzący, że test
 * faktycznie WYKRYWA rozjazd, gdyby krok kiedyś spadł poniżej 0,5 (sekcja [3] -- nie dotyka kodu
 * produkcyjnego, to lokalna symulacja obu wzorów na hipotetycznym mniejszym kroku, żeby
 * udowodnić że sekcja [2] nie przechodzi tautologicznie).
 *
 * Ten test MUSI się wysypać, jeśli ktoś kiedyś zmieni `WYZYWIENIE_STEP` na coś mniejszego niż
 * 0,5 bez świadomości efektu ubocznego na parytet panel<->plakietka.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.city-growth-percent-rounding-parity-entry.ts');
const BUNDLE = path.join(__dirname, '.city-growth-percent-rounding-parity-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { formatLiczbaPl } from '../src/ui/formatPl';
export { formatCityGrowthPercentLabel } from '../src/render/cityMapStatChip';
export { WYZYWIENIE_STEP, WYZYWIENIE_GROWTH_PCT } from '../src/game/population-growth-v85';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[city-growth-percent-rounding-parity-test] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}
function eq(got, want, msg) {
  assert(got === want, `${msg} (got=${JSON.stringify(got)} want=${JSON.stringify(want)})`);
}
// Cyfry + separator, bez glifu minusa -- różnica „-" (panel) vs „−" U+2212 (plakietka) jest
// świadoma i pilnowana osobno przez city-panel-growth-percent-separator-test.cjs (sekcja [3]).
function digitsOnly(txt) {
  return txt.replace(/^[-−]/, '');
}

console.log('city-growth-percent-rounding-parity-test (P-ETYKIETA-WZROST-ZAOKRAGLENIE-ROZJAZD)\n');

// --- 1. NIEZMIENNIK KROKU ----------------------------------------------------------------------
console.log('[1] WYZYWIENIE_STEP pozostaje niezmiennikiem wymaganym dla parytetu zaokrąglenia');
eq(
  M.WYZYWIENIE_STEP,
  0.5,
  'WYZYWIENIE_STEP === 0,5 -- zmiana na mniejszy krok bez naprawy wzorów zaokrąglenia zepsuje parytet panel<->plakietka',
);
for (const [poziom, pct] of Object.entries(M.WYZYWIENIE_GROWTH_PCT)) {
  assert(
    Number.isInteger(pct * 2),
    `WYZYWIENIE_GROWTH_PCT[${poziom}]=${pct} jest wielokrotnością kroku 0,5 (podstawa parytetu)`,
  );
}

// --- 2. PARYTET NA PEŁNYM REALNYM ZAKRESIE (krok PRODUKCYJNY, nie zaszyty na sztywno) -----------
console.log('\n[2] parytet cyfr panel<->plakietka na wielokrotnościach kroku produkcyjnego');
let sprawdzone = 0;
let parytetFail = 0;
for (let k = -400; k <= 400; k++) {
  const x = k * M.WYZYWIENIE_STEP; // -200 .. 200, krok czytany z eksportu produkcyjnego
  const panelTxt = digitsOnly(`${M.formatLiczbaPl(x)}%`);
  const plakietkaTxt = digitsOnly(M.formatCityGrowthPercentLabel(x));
  if (panelTxt !== plakietkaTxt) parytetFail++;
  sprawdzone++;
}
assert(
  parytetFail === 0,
  `${sprawdzone} wartości (wielokrotności WYZYWIENIE_STEP=${M.WYZYWIENIE_STEP} w zakresie -200..200) -- 0 rozjazdów panel<->plakietka`,
);

// --- 3. KANAREK -- dowód, że test [2] faktycznie wykrywa rozjazd, nie jest tautologią ----------
console.log('\n[3] kanarek: te same wzory NA HIPOTETYCZNYM mniejszym kroku faktycznie się rozjeżdżają');
// Lokalna symulacja obu wzorów (NIE import z produkcji) -- wyłącznie żeby udowodnić, że pętla [2]
// nie przechodzi z definicji dla dowolnego kroku, tylko realnie zależy od WYZYWIENIE_STEP >= 0,5.
function panelFormulaLocal(x) { return Number(x.toFixed(1)); }
function chipFormulaLocal(x) { return Math.round(x * 10) / 10; }
let kanarekRozjazdy = 0;
for (let k = -2000; k <= 2000; k++) {
  const x = k * 0.01; // krok hipotetyczny < WYZYWIENIE_STEP
  if (panelFormulaLocal(x) !== chipFormulaLocal(x)) kanarekRozjazdy++;
}
assert(
  kanarekRozjazdy > 0,
  `przy hipotetycznym kroku 0,01 (< WYZYWIENIE_STEP) wzory realnie się rozjeżdżają w ${kanarekRozjazdy} przypadkach -- dowód, że sekcja [2] ma siłę wykrywczą`,
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
