'use strict';
/**
 * format-pl-plural-miasta-kolejki-q1-test.cjs -- R-WEB-PL-PLURAL-MIASTA-KOLEJKI-Q1
 * Run: cd gra && node tools/format-pl-plural-miasta-kolejki-q1-test.cjs
 *
 * Kontrakt odmiany liczebnikowej (mianownik) w src/ui/formatPl.ts:
 *   1 -> forma "one"; n%10 w 2..4 i n%100 poza 12..14 -> forma "few"; reszta (0, 5+, 11..14, ...) -> "many".
 * Testuje tabelarycznie 0..130 dla formatMiastaCount ("miasto/miasta/miast") i formatKolejkiCount
 * ("kolejka/kolejki/kolejek"), plus jawne oczekiwania dla przypadkow granicznych tematu.
 * Oczekiwania liczone niezaleznie od implementacji (referencja poniżej), nie przez pluralPl.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.format-pl-plural-miasta-kolejki-q1-entry.ts');
const BUNDLE = path.join(__dirname, '.format-pl-plural-miasta-kolejki-q1-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { formatMiastaCount, formatKolejkiCount, formatTurCount, formatBudynkiCount, formatUmowyCount, formatJednostkiCount, pluralPl } from '../src/ui/formatPl';
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
  console.error('[format-pl-plural-miasta-kolejki-q1-test] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL:', msg); }
}
function eq(got, want, msg) {
  assert(got === want, `${msg} (got=${JSON.stringify(got)} want=${JSON.stringify(want)})`);
}

// Referencja niezalezna od implementacji: 1 / 2-4 (poza 12-14) / reszta.
function refForm(n) {
  if (n === 1) return 'one';
  const d = n % 10;
  const dd = n % 100;
  if (d >= 2 && d <= 4 && !(dd >= 12 && dd <= 14)) return 'few';
  return 'many';
}
const FORMS = {
  miasto: { one: 'miasto', few: 'miasta', many: 'miast' },
  kolejka: { one: 'kolejka', few: 'kolejki', many: 'kolejek' },
};

console.log('format-pl-plural-miasta-kolejki-q1-test (R-WEB-PL-PLURAL-MIASTA-KOLEJKI-Q1)\n');

// --- 1. Tabela 0..130 dla formatMiastaCount i formatKolejkiCount ----------------------------
console.log('[1] tabela 0..130: formatMiastaCount i formatKolejkiCount');
for (let n = 0; n <= 130; n++) {
  const f = refForm(n);
  eq(M.formatMiastaCount(n), `${n} ${FORMS.miasto[f]}`, `formatMiastaCount(${n})`);
  eq(M.formatKolejkiCount(n), `${n} ${FORMS.kolejka[f]}`, `formatKolejkiCount(${n})`);
}

// --- 2. Jawne oczekiwania z dispatchu (czytelne na pierwszy rzut oka) -----------------------
console.log('\n[2] jawne przypadki graniczne (miasta)');
const EXPLICIT = [
  [0, '0 miast'], [1, '1 miasto'], [2, '2 miasta'], [4, '4 miasta'], [5, '5 miast'],
  [11, '11 miast'], [12, '12 miast'], [14, '14 miast'], [15, '15 miast'],
  [21, '21 miast'], [22, '22 miasta'], [24, '24 miasta'], [25, '25 miast'],
  [101, '101 miast'], [102, '102 miasta'], [111, '111 miast'], [112, '112 miast'], [122, '122 miasta'],
];
for (const [n, want] of EXPLICIT) eq(M.formatMiastaCount(n), want, `jawnie formatMiastaCount(${n})`);

console.log('\n[3] jawne przypadki graniczne (kolejki)');
const EXPLICIT_K = [
  [0, '0 kolejek'], [1, '1 kolejka'], [2, '2 kolejki'], [4, '4 kolejki'], [5, '5 kolejek'],
  [12, '12 kolejek'], [22, '22 kolejki'], [24, '24 kolejki'], [25, '25 kolejek'], [112, '112 kolejek'], [122, '122 kolejki'],
];
for (const [n, want] of EXPLICIT_K) eq(M.formatKolejkiCount(n), want, `jawnie formatKolejkiCount(${n})`);

// --- 4. Pozostale funkcje formatPl z ta sama regula (zachowanie bez zmian) ------------------
console.log('\n[4] pozostale helpery odmiany (parytet z ta sama regula)');
for (let n = 0; n <= 130; n++) {
  const f = refForm(n);
  eq(M.formatTurCount(n), `${n} ${({ one: 'tura', few: 'tury', many: 'tur' })[f]}`, `formatTurCount(${n})`);
  eq(M.formatBudynkiCount(n), `${n} ${({ one: 'budynek', few: 'budynki', many: 'budynków' })[f]}`, `formatBudynkiCount(${n})`);
  eq(M.formatUmowyCount(n), `${n} ${({ one: 'umowa', few: 'umowy', many: 'umów' })[f]}`, `formatUmowyCount(${n})`);
}
// formatJednostkiCount: 1 -> jednostka, reszta wg tej samej reguly (2-4 poza 12-14 -> jednostki, inaczej jednostek).
for (let n = 0; n <= 130; n++) {
  const want = n === 1 ? 'jednostka' : refForm(n) === 'few' ? 'jednostki' : 'jednostek';
  eq(M.formatJednostkiCount(n), `${n} ${want}`, `formatJednostkiCount(${n})`);
}

// --- 5. Ujemne i ulamkowe: brak regresji wzgledem Math.floor/Math.abs ----------------------
console.log('\n[5] wartosci niecalkowite i ujemne (kontrakt pluralPl: |floor(n)|)');
eq(M.pluralPl(2.7, 'a', 'b', 'c'), 'b', 'pluralPl(2.7) -> few (floor)');
eq(M.pluralPl(-2, 'a', 'b', 'c'), 'b', 'pluralPl(-2) -> few (|n|)');
eq(M.pluralPl(-1, 'a', 'b', 'c'), 'a', 'pluralPl(-1) -> one (|n|)');

console.log(`\nWynik: ${passed} pass / ${failed} fail`);
try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
if (failed > 0) process.exit(1);
