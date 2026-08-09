'use strict';
/**
 * format-pl-signed-minus-glif-test.cjs -- P-ETYKIETA-MINUS-GLIF-ROZJAZD-FORMATPL
 * Run: cd gra && node tools/format-pl-signed-minus-glif-test.cjs
 *
 * Kontekst: `signedPl` (src/ui/formatPl.ts) mial sprzecznosc docstring vs implementacja --
 * docstring obiecywal znak U+2212 (matematyczny minus, np. „-3,5"), a implementacja zwracala
 * zwykly ASCII myslnik (0x2D) z `formatLiczbaPl().replace('.', ',')`. Panel miasta (cityPanel.ts)
 * mieszal przez to glify w TEJ SAMEJ tabeli chipow: chip „Racje" mial zahardkodowany U+2212,
 * chip „Bilans" (przez signed()->signedPl) mial ASCII.
 *
 * Naprawa: `signedPl` teraz podmienia wiodacy ASCII myslnik na U+2212 PO wywolaniu
 * `formatLiczbaPl` -- `formatLiczbaPl` sama NIE jest ruszana (ma wlasnych konsumentow,
 * ktorzy swiadomie asercjonuja ASCII: city-panel-growth-percent-separator-test.cjs,
 * P-ETYKIETA-WZROST-SEPARATOR-ROZJAZD). Podmiana glifu zyje wylacznie w signedPl.
 *
 * Ten test sprawdza:
 *   1. KONTRAKT signedPl -- ujemne wartosci uzywaja U+2212, nie ASCII „-"; dodatnie „+X";
 *      zero „0" (bez znaku); zaokraglone do zera (-0) tez „0", nie „-0"/„-0"(minus).
 *   2. formatLiczbaPl NIE jest ruszony -- nadal zwraca ASCII myslnik dla ujemnych (kontrakt
 *      dla P-ETYKIETA-WZROST-SEPARATOR-ROZJAZD musi przetrwac bez zmian).
 *   3. treasuryBalanceSignedTxt (ui/treasuryBalanceFormat.ts, cienki wrapper na signedPl)
 *      dziedziczy U+2212 automatycznie.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.format-pl-signed-minus-glif-entry.ts');
const BUNDLE = path.join(__dirname, '.format-pl-signed-minus-glif-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { signedPl, formatLiczbaPl } from '../src/ui/formatPl';
export { treasuryBalanceSignedTxt } from '../src/ui/treasuryBalanceFormat';
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
  console.error('[format-pl-signed-minus-glif-test] bundle failed:', e.message || e);
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

console.log('format-pl-signed-minus-glif-test (P-ETYKIETA-MINUS-GLIF-ROZJAZD-FORMATPL)\n');

// --- 1. Kontrakt signedPl: znak U+2212 dla ujemnych, ASCII zniknal ---------------------------
console.log('[1] signedPl -- U+2212 dla ujemnych, nie ASCII „-"');
eq(M.signedPl(-3.5), '−3,5', 'signedPl(-3,5) uzywa U+2212');
eq(M.signedPl(-3), '−3', 'signedPl(-3) uzywa U+2212 (calkowita)');
eq(M.signedPl(-0.02), '0', 'signedPl(-0,02) zaokraglone do zera -> „0" (bez znaku, nie „-0"/„−0")');
assert(!M.signedPl(-3.5).includes('-'), 'signedPl(-3,5) NIE zawiera ASCII myslnika (0x2D) wcale');
assert(M.signedPl(-3.5).charCodeAt(0) === 0x2212, 'pierwszy znak signedPl(-3,5) to U+2212 (kod 0x2212)');

// --- 2. Dodatnie i zero bez zmian --------------------------------------------------------------
console.log('\n[2] signedPl -- dodatnie i zero (bez regresji)');
eq(M.signedPl(6.6), '+6,6', 'signedPl(6,6) -> „+6,6"');
eq(M.signedPl(0), '0', 'signedPl(0) -> „0" (bez znaku)');
eq(M.signedPl(7), '+7', 'signedPl(7) -> „+7" (bez zbednego przecinka)');

// --- 3. formatLiczbaPl NIE ruszony -- kontrakt P-ETYKIETA-WZROST-SEPARATOR-ROZJAZD przetrwal --
console.log('\n[3] formatLiczbaPl -- baza signedPl, nadal zwraca ASCII „-" (swiadomie nieruszona)');
eq(M.formatLiczbaPl(-2.1), '-2,1', 'formatLiczbaPl(-2,1) nadal ASCII myslnik (0x2D)');
assert(M.formatLiczbaPl(-2.1).charCodeAt(0) === 0x2D, 'pierwszy znak formatLiczbaPl(-2,1) to ASCII 0x2D');

// --- 4. treasuryBalanceSignedTxt dziedziczy U+2212 przez signedPl -----------------------------
console.log('\n[4] treasuryBalanceSignedTxt (wrapper na signedPl) dziedziczy U+2212');
eq(M.treasuryBalanceSignedTxt(-3), '−3', 'treasuryBalanceSignedTxt(-3) -> „−3" (U+2212)');
eq(M.treasuryBalanceSignedTxt(5), '+5', 'treasuryBalanceSignedTxt(5) -> „+5"');
eq(M.treasuryBalanceSignedTxt(0), '0', 'treasuryBalanceSignedTxt(0) -> „0"');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
