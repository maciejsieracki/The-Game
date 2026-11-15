'use strict';
/**
 * gross-net-numbers-only-unify-test.cjs — R-WEB-UI-GROSS-NET-NUMBERS-ONLY-UNIFY-AND-WIKI-Q1 (Maciej 2026-11-15, decyzja A).
 *
 * Sprawdza na KODZIE ŹRÓDŁOWYM panelu imperium (gra/src/ui/empireDetailPanel.ts), że Nauka, Żywność i Handel
 * używają tej samej konwencji co Surowce: `grossNetNumbersSub` (same liczby „+X → +Y”), a opis i jednostka
 * idą do `title` (tooltip):
 *  U1  `grossNetSub` (stara linia „Brutto … → netto … / turę”) jest usunięta z pliku i nie ma wywołań.
 *  U2  Nauka, Żywność i Handel wołają `grossNetNumbersSub`.
 *  U3  każde z tych wywołań niesie tooltip z opisem i jednostką (PN / 🍞 / złota).
 *  U4  wygenerowany fragment HTML `grossNetNumbersSub` (odtworzony z kodu) nie zawiera w widocznym tekście
 *      słów „Brutto”, „netto”, „/ turę”, „szt.”; liczby są widoczne; opis jest w `title`.
 *  M1  mutant (na KOPII pliku): przywrócenie `grossNetSub` w Nauce MUSI czerwienić U1/U2.
 *
 * Uwaga: test NIE renderuje całego panelu w przeglądarce (to osobny dowód na żywo, patrz raport).
 * Run from gra/:  node tools/gross-net-numbers-only-unify-test.cjs   (opcjonalnie --no-mutants)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const PANEL = path.join(GRA, 'src', 'ui', 'empireDetailPanel.ts');
const NO_MUTANTS = process.argv.includes('--no-mutants');

let fails = 0;
let passes = 0;
function ok(c, m, extra) {
  if (c) { passes++; console.log('  ok   ' + m); }
  else { fails++; console.log('  FAIL ' + m + (extra !== undefined ? ' -- ' + JSON.stringify(extra) : '')); }
}
const clean = (s) => String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const WORDS = /Brutto|netto|turę|szt\./i;

/** Wyciąga pełne wywołanie `grossNetNumbersSub(...)` (do domknięcia nawiasu) z tekstu źródła. */
function callsOf(src, name) {
  const out = [];
  let i = 0;
  while ((i = src.indexOf(name + '(', i)) !== -1) {
    let depth = 0;
    let j = i + name.length;
    for (; j < src.length; j++) {
      if (src[j] === '(') depth++;
      else if (src[j] === ')') { depth--; if (depth === 0) break; }
    }
    out.push(src.slice(i, j + 1));
    i = j + 1;
  }
  return out;
}

function checks(src, label) {
  console.log('== ' + label);
  ok(!/function\s+grossNetSub\s*\(/.test(src) && !/\bgrossNetSub\(/.test(src), 'U1 grossNetSub usunięta (brak definicji i wywołań)');
  const calls = callsOf(src, 'grossNetNumbersSub').filter((c) => !c.startsWith('grossNetNumbersSub(brutto'));
  ok(calls.length >= 4, 'U2 grossNetNumbersSub: Nauka + Żywność + Handel + Surowce (>=4 wywołań)', calls.length);
  const naukaOk = calls.some((c) => /grossNetNumbersSub\(rate, rate,/.test(c));
  const zywOk = calls.some((c) => /economy\.zywnoscRate/.test(c) && /zywnoscWplywMiast/.test(c));
  const handelOk = calls.some((c) => /t\.totalIncome, t\.totalIncome,/.test(c));
  ok(naukaOk, 'U2 Nauka wywołuje grossNetNumbersSub(rate, rate, …)');
  ok(zywOk, 'U2 Żywność wywołuje grossNetNumbersSub(zywnoscWplywMiast…, zywnoscRate, …)');
  ok(handelOk, 'U2 Handel wywołuje grossNetNumbersSub(t.totalIncome, t.totalIncome, …)');
  ok(calls.some((c) => /Jednostka: PN/.test(c)), 'U3 tooltip Nauki niesie jednostkę PN');
  ok(calls.some((c) => /🍞/.test(c) && /nadwyżka miast/.test(c)), 'U3 tooltip Żywności niesie 🍞 i opis brutto/netto');
  ok(calls.some((c) => /złota na turę/.test(c) && /nie mają kosztów/.test(c)), 'U3 tooltip Handlu niesie jednostkę złota i opis');
  return calls;
}

function main() {
  const src = fs.readFileSync(PANEL, 'utf8');
  const calls = checks(src, 'panel źródłowy');

  // U4: odtwórz funkcję `grossNetNumbersSub` z kodu źródłowego i sprawdź jej widoczny tekst.
  const m = src.match(/export function grossNetNumbersSub\([\s\S]*?\n\}\n/);
  ok(!!m, 'U4 funkcja grossNetNumbersSub znaleziona w źródle');
  if (m) {
    const fnSrc = m[0]
      .replace(/export function/, 'function')
      .replace(/: number \| undefined/g, '')
      .replace(/: string/g, '');
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const signedPl = (v) => (v > 0 ? '+' : '') + String(v);
    // eslint-disable-next-line no-new-func
    const fn = new Function('esc', 'signedPl', fnSrc + '\nreturn grossNetNumbersSub;')(esc, signedPl);
    const html = fn(1222, 1075, 'Brutto = produkcja przed zużyciem. Netto = po zużyciu. Jednostka: PN na turę.');
    ok(!WORDS.test(clean(html)), 'U4 widoczny tekst: brak „Brutto”, „netto”, „/ turę”, „szt.”', clean(html));
    ok(clean(html) === '+1222 → +1075', 'U4 widoczne liczby „+1222 → +1075”', clean(html));
    ok(/title="[^"]*Jednostka: PN na turę\./.test(html), 'U4 opis i jednostka w title (tooltip)', html);
    const neg = fn(-3, -5, 'x');
    ok(/class="neg"/.test(neg), 'U4 netto ujemne: klasa neg', neg);
  }

  if (!NO_MUTANTS) {
    console.log('== mutant M1 (kopia pliku)');
    const mutated = src.replace(
      /grossNetNumbersSub\(rate, rate, /,
      "grossNetSub(rate, rate, 'PN', ' (Nauka) ');\n  void grossNetNumbersSub(rate, rate, ",
    );
    const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gn-unify-')), 'mut.ts');
    fs.writeFileSync(tmp, mutated);
    const mutCalls = callsOf(mutated, 'grossNetSub').filter((c) => !c.startsWith('grossNetSub(brutto'));
    const detected = /\bgrossNetSub\(/.test(mutated) && mutCalls.length > 0;
    ok(detected, 'M1 mutant z przywróconym grossNetSub jest wykrywany przez U1', mutCalls.length);
  }

  console.log(`\nRESULT: ${passes} ok, ${fails} FAIL (calls=${calls.length})`);
  process.exitCode = fails ? 1 : 0;
}

main();
