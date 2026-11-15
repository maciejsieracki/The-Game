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
  // Definicje (sygnatury) odfiltrowane; wywołania: Surowce + Żywność (grossNetNumbersSub), Nauka + Handel (singleNumberSub).
  const calls = [
    ...callsOf(src, 'grossNetNumbersSub').filter((c) => !c.startsWith('grossNetNumbersSub(brutto')),
    ...callsOf(src, 'singleNumberSub').filter((c) => !c.startsWith('singleNumberSub(value')),
  ];
  ok(calls.length >= 4, 'U2 wywołań liczbowych: Nauka + Żywność + Handel + Surowce (>=4)', calls.length);
  const naukaOk = calls.some((c) => /singleNumberSub\(rate,/.test(c));
  const zywOk = calls.some((c) => /grossNetNumbersSub\(economy\.zywnoscWplywMiast/.test(c) && /economy\.zywnoscRate/.test(c));
  const handelOk = calls.some((c) => /singleNumberSub\(t\.totalIncome,/.test(c));
  ok(naukaOk, 'U2 Nauka wywołuje singleNumberSub(rate, …) (brutto = netto → jedna liczba)');
  ok(zywOk, 'U2 Żywność wywołuje grossNetNumbersSub(zywnoscWplywMiast…, zywnoscRate, …)');
  ok(handelOk, 'U2 Handel wywołuje singleNumberSub(t.totalIncome, …) (brutto = netto → jedna liczba)');
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
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const signedPl = (v) => (v > 0 ? '+' : '') + String(v);
  const toFn = (text, name) => {
    const fnSrc = text
      .replace(/export function/, 'function')
      .replace(/: number \| undefined/g, '')
      .replace(/: number/g, '')
      .replace(/: string/g, '');
    // eslint-disable-next-line no-new-func
    return new Function('esc', 'signedPl', fnSrc + '\nreturn ' + name + ';')(esc, signedPl);
  };
  if (m) {
    const fn = toFn(m[0], 'grossNetNumbersSub');
    const html = fn(1222, 1075, 'Brutto = produkcja przed zużyciem. Netto = po zużyciu. Jednostka: 🍞 żywność na turę.');
    ok(!WORDS.test(clean(html)), 'U4 grossNetNumbersSub widoczny tekst: brak „Brutto”, „netto”, „/ turę”, „szt.”', clean(html));
    ok(clean(html) === '+1222 → +1075', 'U4 grossNetNumbersSub widoczne liczby „+1222 → +1075”', clean(html));
    ok(/title="[^"]*Jednostka: 🍞 żywność na turę\./.test(html), 'U4 grossNetNumbersSub opis i jednostka w title', html);
    const neg = fn(-3, -5, 'x');
    ok(/class="neg"/.test(neg), 'U4 grossNetNumbersSub netto ujemne: klasa neg', neg);
  }
  const ms = src.match(/export function singleNumberSub\([\s\S]*?\n\}\n/);
  ok(!!ms, 'U4 funkcja singleNumberSub znaleziona w źródle');
  if (ms) {
    const sfn = toFn(ms[0], 'singleNumberSub');
    const shtml = sfn(1222, 'Nauka nie ma dziś kosztów. Jednostka: PN na turę.');
    ok(!WORDS.test(clean(shtml)), 'U4 singleNumberSub widoczny tekst: brak „Brutto”, „netto”, „/ turę”, „szt.”', clean(shtml));
    ok(clean(shtml) === '+1222', 'U4 singleNumberSub: jedna liczba bez strzałki „+1222”', clean(shtml));
    ok(!/→/.test(clean(shtml)), 'U4 singleNumberSub: brak „→”', clean(shtml));
    ok(/title="[^"]*Jednostka: PN na turę\./.test(shtml), 'U4 singleNumberSub opis i jednostka w title', shtml);
    ok(/class="neg"/.test(sfn(-4, 'x')), 'U4 singleNumberSub wartość ujemna: klasa neg', sfn(-4, 'x'));
  }

  if (!NO_MUTANTS) {
    // Mutanty na kopii tekstu pliku (in-memory): każdy MUSI dać >=1 FAIL w checks() (U1..U3).
    // Liczymy FAIL-e z całego zestawu checks() dla mutanta i przywracamy licznik, by nie zaniżać wyniku.
    const mutants = [
      ['M1 przywrócenie grossNetSub w Nauce',
        src.replace(/singleNumberSub\(rate, /, "grossNetSub(rate, rate, 'PN', ' (Nauka) ');\n  void singleNumberSub(rate, ")],
      ['M2 usunięcie jednostki „złota na turę” z tooltipu Handlu',
        src.replace(/Jednostka: złota na turę\.'\)/, "')")],
    ];
    for (const [label, mutated] of mutants) {
      console.log('== mutant ' + label);
      if (mutated === src) { ok(false, 'M mutant nie zmienił źródła: ' + label); continue; }
      const before = fails;
      const savedLog = console.log;
      console.log = () => {};
      try { checks(mutated, label); } finally { console.log = savedLog; }
      const mutFails = fails - before;
      fails = before;
      ok(mutFails > 0, 'mutant wykryty przez checks() (FAIL-e: ' + mutFails + ')', label);
    }
  }

  console.log(`\nRESULT: ${passes} ok, ${fails} FAIL (calls=${calls.length})`);
  process.exitCode = fails ? 1 : 0;
}

main();
