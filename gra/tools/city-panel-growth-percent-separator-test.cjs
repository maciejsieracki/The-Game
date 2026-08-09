'use strict';
/**
 * city-panel-growth-percent-separator-test.cjs -- P-ETYKIETA-WZROST-SEPARATOR-ROZJAZD
 * Run: cd gra && node tools/city-panel-growth-percent-separator-test.cjs
 *
 * Kontekst: plakietkę miasta na mapie naprawiono rano 2026-08-09 (formatCityGrowthPercentLabel
 * w src/render/cityMapStatChip.ts) -- pokazuje „5,5%" z przecinkiem (zapis polski). Evaluator
 * znalazl, ze chip „WZROST%" w PANELU miasta (src/ui/cityPanel.ts, sekcja „Wyzywienie i wzrost")
 * renderowal ta sama liczbe zrodlowo (view.wzrostProcent) surowo -- `${view.wzrostProcent}%` --
 * czyli „5.5%" z KROPKA (domyslna notacja JS). Ta sama liczba, dwa rozne separatory w dwoch
 * miejscach UI. Naprawa: chip uzywa teraz `formatLiczbaPl(view.wzrostProcent)` (formatPl.ts),
 * czyli tej samej konwencji co reszta panelu (funkcja `signed()` w cityPanel.ts jest juz
 * cienkim wrapperem na `signedPl` z tego samego modulu -- formatLiczbaPl dogania te konwencje,
 * nie wprowadza nowej).
 *
 * Ten test NIE odpala calego pipeline'u renderCityPanel (paintCityPanelSections) -- wymagaloby
 * to pelnego DOM-u + GameData + GameMap + dziesiatek opcjonalnych callbackow `cfg.*`, co jest
 * nieproporcjonalne do jednoliniowej poprawki separatora (plik ma >10 000 linii). Zamiast tego:
 *   1. PRZYPIETA LOKALIZACJA -- zrodlo cityPanel.ts w konkretnym miejscu (chip „WZROST%" w
 *      sekcji „Wyzywienie i wzrost") faktycznie wola formatLiczbaPl, nie surowa interpolacje.
 *      Chroni przed cichym cofnieciem naprawy przy przyszlej edycji tego wiersza.
 *   2. KONTRAKT FORMATERA -- formatLiczbaPl (formatPl.ts) rzeczywiscie zwraca zapis polski
 *      (przecinek), zaokraglony do 1 miejsca, z tymi samymi regulami brzegowymi co plakietka
 *      (zero, -0, liczby ujemne) -- wywolany bezposrednio z zbudowanego modulu, nie
 *      przepisany recznie w tescie.
 *   3. PARYTET Z PLAKIETKA -- dla tej samej wartosci wzrostProcent oba formatery
 *      (formatLiczbaPl w panelu, formatCityGrowthPercentLabel w cityMapStatChip.ts) daja
 *      IDENTYCZNY zapis cyfr+przecinek dla typowych (dodatnich/zerowych) wartosci wzrostu --
 *      jedyna swiadoma roznica to znak minus (panel: zwykly „-", plakietka: „−" U+2212),
 *      udokumentowana explicite, zeby nie zostala pomylona z regresja.
 *   4. INNE MIEJSCA -- chip nie jest jedynym wystapieniem `${view.wzrostProcent}%` w pliku;
 *      test dokumentuje (bez asercji -- to swiadomie POZA zakresem tego zgloszenia) ile innych
 *      miejsc ma ten sam wzorzec, zeby przyszla naprawa miala punkt startu.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const CITY_PANEL_SRC = path.join(GRA, 'src', 'ui', 'cityPanel.ts');
const ENTRY = path.join(__dirname, '.city-panel-growth-percent-separator-entry.ts');
const BUNDLE = path.join(__dirname, '.city-panel-growth-percent-separator-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { formatLiczbaPl, signedPl } from '../src/ui/formatPl';
export { formatCityGrowthPercentLabel } from '../src/render/cityMapStatChip';
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
  console.error('[city-panel-growth-percent-separator-test] bundle failed:', e.message || e);
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

console.log('city-panel-growth-percent-separator-test (P-ETYKIETA-WZROST-SEPARATOR-ROZJAZD)\n');

// --- 1. PRZYPIETA LOKALIZACJA -- zrodlo cityPanel.ts faktycznie wola formatLiczbaPl ----------
console.log('\n[1] chip WZROST% w cityPanel.ts wola formatLiczbaPl (nie surowa interpolacje)');
const src = fs.readFileSync(CITY_PANEL_SRC, 'utf8');

assert(
  /import\s*\{[^}]*\bformatLiczbaPl\b[^}]*\}\s*from\s*['"]\.\/formatPl['"]/.test(src),
  'cityPanel.ts importuje formatLiczbaPl z ./formatPl',
);

const chipBlockMatch = src.match(
  /label:\s*'WZROST%',[\s\S]{0,600}?title:\s*fed\s*\n\s*\?\s*'Łączny procent wzrostu ludności w tej turze'/,
);
assert(chipBlockMatch !== null, 'znaleziono blok chipa „WZROST%” (sekcja Wyżywienie i wzrost)');
if (chipBlockMatch) {
  const block = chipBlockMatch[0];
  assert(
    /value:\s*fed\s*\?\s*`\$\{formatLiczbaPl\(view\.wzrostProcent\)\}%`\s*:\s*'—'/.test(block),
    'wiersz „value” chipa woła `${formatLiczbaPl(view.wzrostProcent)}%` (naprawiony separator)',
  );
  assert(
    !/value:\s*fed\s*\?\s*`\$\{view\.wzrostProcent\}%`/.test(block),
    'stary surowy wzorzec `${view.wzrostProcent}%` (kropka) ZNIKNĄŁ z chipa',
  );
}

// --- 2. KONTRAKT FORMATERA ---------------------------------------------------------------------
console.log('\n[2] kontrakt formatLiczbaPl na wartościach WZROST%-podobnych');
eq(M.formatLiczbaPl(0), '0', 'wzrost zerowy → „0” (bez „,0”)');
eq(M.formatLiczbaPl(5), '5', 'wzrost całkowity → „5” bez zbędnego przecinka');
eq(M.formatLiczbaPl(5.5), '5,5', 'wzrost ułamkowy → „5,5” z przecinkiem (zapis polski)');
eq(M.formatLiczbaPl(12.5), '12,5', 'dwucyfrowy ułamkowy → „12,5”');
eq(M.formatLiczbaPl(-2.1), '-2,1', 'wzrost ujemny → przecinek zachowany, zwykły myślnik (nie U+2212)');
eq(M.formatLiczbaPl(-0.02), '0', 'zaokrąglone do zera → „0”, nigdy „-0”');
eq(M.formatLiczbaPl(5.54), '5,5', 'zaokrąglenie do 1 miejsca po przecinku (tak jak plakietka)');

// --- 3. PARYTET Z PLAKIETKĄ (formatCityGrowthPercentLabel) ------------------------------------
console.log('\n[3] parytet panel↔plakietka dla tej samej liczby źródłowej (view.wzrostProcent)');
const wartosciDodatnie = [0, 5, 5.5, 12.5, 5.54, 100];
for (const v of wartosciDodatnie) {
  const panelTxt = `${M.formatLiczbaPl(v)}%`;
  const plakietkaTxt = M.formatCityGrowthPercentLabel(v);
  eq(panelTxt, plakietkaTxt, `wzrost=${v} → panel „${panelTxt}” = plakietka „${plakietkaTxt}”`);
}
// Wartości ujemne: cyfry + przecinek identyczne, jedyna świadoma różnica to glif minusa
// (panel: formatLiczbaPl NIE podmienia myślnika -- zadanie mówiło „zmień tylko separator”,
// nie dotykaj notacji znaku; plakietka: formatCityGrowthPercentLabel świadomie używa U+2212).
const wartosciUjemne = [-2.1, -10];
for (const v of wartosciUjemne) {
  const panelDigits = `${M.formatLiczbaPl(v).replace(/^-/, '')}%`;
  const plakietkaDigits = M.formatCityGrowthPercentLabel(v).replace(/^−/, '');
  eq(panelDigits, plakietkaDigits, `wzrost=${v} → cyfry+przecinek identyczne panel/plakietka (bez znaku)`);
  assert(
    M.formatLiczbaPl(v).startsWith('-') && M.formatCityGrowthPercentLabel(v).startsWith('−'),
    `wzrost=${v} → świadoma różnica glifu minusa udokumentowana (panel „-”, plakietka „−”), nie regresja`,
  );
}

// --- 4. INNE MIEJSCA W cityPanel.ts (dokumentacja, bez asercji blokującej) --------------------
console.log('\n[4] inne wystąpienia surowego `${view.wzrostProcent}%` w cityPanel.ts (poza zakresem)');
const surowyWzorzec = /\$\{view\.wzrostProcent\}%|\$\{fed \? view\.wzrostProcent : 0\}%|\$\{fed \? view\.wzrostProcent : '—'\}%/g;
const pozostale = src.match(surowyWzorzec) || [];
console.log(`   znaleziono ${pozostale.length} innych surowych wystąpień (detail-cardy / civ overview / tooltip) --`);
console.log('   świadomie poza zakresem P-ETYKIETA-WZROST-SEPARATOR-ROZJAZD, patrz raport operatora.');
// Nie asercja -- to jest inwentarz dla przyszłej naprawy, nie regresja tej naprawy. Liczba
// >0 jest OCZEKIWANA na dziś (detail-cardy nie były w zakresie tego zgłoszenia).
assert(true, `inwentarz zapisany (${pozostale.length} pozycji) -- patrz raport operatora dla listy linii`);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
