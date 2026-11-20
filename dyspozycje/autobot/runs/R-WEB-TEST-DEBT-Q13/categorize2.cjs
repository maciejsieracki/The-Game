#!/usr/bin/env node
'use strict';
// R-WEB-TEST-DEBT-Q13 r5: kategoryzacja SKRYPTEM po wzorcu pierwszej linii FAIL (zastepuje categorize.sh, ktory zwracal tylko P/A/E/X).
// Uzycie: node categorize2.cjs <wyniki.txt> [naprawione.txt] [overrides.json]   (cwd = katalog runs/R-WEB-TEST-DEBT-Q13; testy w ../../../../gra/tools)
//   wyniki.txt     linie `exit|plik|ostatnia linia|pierwszy FAIL` (sweep-one.sh)
//   naprawione.txt nazwy testow zmienionych w r5 (kolumna "r5")
//   overrides.json {"test.cjs": {"cat":"E","note":"..."}} -- RECZNE rozstrzygniecia po analizie (wygrywaja ze wzorcem; kazde z uzasadnieniem w "note")
// Wyjscie: tabela markdown (osobne kolumny) na stdout, liczby na stderr.
//
// KATEGORIE (wzorzec tekstu pierwszego FAIL / ostatniej linii; cat z overrides wygrywa):
//   P  PASS (exit 0)
//   E  timeout (exit 124) albo test zalezny od czasu/srodowiska (override z noty)
//   A  fixture/harness: ReferenceError, "is not defined", "is not a function", Build failed, brak ROBOCZA_HTML/--dist/--gra/katalogu wyniku, SKIP
//   B  stary pin zrodlowy/progowy: test czyta main.ts/ts jako tekst (regex, liczba wywolan, okno znakow, "main.ts:") albo prog sprzed zmian
//   D  kandydat bledu gry / sprzecznosc zachowania: asercja behawioralna (got/want, AssertionError) -- WYMAGA analizy; "NIE ZMIERZONO" gdy przyczyna nieustalona
//   (C martwy test: nie wyznaczany skryptem; r5 nie oznaczyl zadnego)
const fs = require('fs');
const path = require('path');

const TOOLS = path.resolve(__dirname, '..', '..', '..', '..', 'gra', 'tools');
const A_RE = /ReferenceError|is not defined|is not a function|Build failed|BUILD\/RUNTIME|ROBOCZA_HTML|--dist|--gra|podaj --|Brak katalogu|SKIP:|AMBUSH_BASE_GRA|PRE-tree/i;
const B_RE = /main\.ts|wywołań|wywolan|wywołanie|wywolanie|znaleziono|owinięta|call site|okno|bajt|DOKŁADNIE|DOKLADNIE|istnieje|importuje|zawiera funkcj|regex|wzorzec|static|kotwic|MUTACJA|MUT-FAIL|fixture|PRZED \(HEAD\)|serializacja|function /i;

function categorize(ec, first, last) {
  const text = `${first} ${last}`;
  if (ec === '0') return 'P';
  if (ec === '124') return 'E';
  if (A_RE.test(text)) return 'A';
  if (B_RE.test(text)) return 'B';
  return 'D';
}

// plik:linia pierwszego FAIL w pliku testu (szukamy fragmentu komunikatu po usunieciu prefiksu FAIL)
function locate(testName, first) {
  try {
    const file = path.join(TOOLS, testName);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    const msg = first.replace(/^\s*(\[FAIL\]|FAIL:?|AssertionError \[ERR_ASSERTION\]:)\s*/i, '').replace(/\s*\(got .*$/, '').trim();
    for (const len of [28, 18, 12]) {
      const needle = msg.slice(0, len);
      if (needle.length < 8) continue;
      const idx = lines.findIndex(l => l.includes(needle));
      if (idx >= 0) return `${testName}:${idx + 1}`;
    }
    return `${testName}:?`;
  } catch (e) { return `${testName}:?`; }
}

const src = fs.readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean);
const fixed = new Set(process.argv[3] && fs.existsSync(process.argv[3]) ? fs.readFileSync(process.argv[3], 'utf8').split('\n').filter(Boolean) : []);
const ov = process.argv[4] && fs.existsSync(process.argv[4]) ? JSON.parse(fs.readFileSync(process.argv[4], 'utf8')) : {};
const counts = {};
const rows = [];
for (const line of src) {
  const parts = line.split('|');
  const ec = parts[0];
  const name = parts[1];
  const last = parts[2] || '';
  const first = parts.slice(3).join('/');
  let cat = categorize(ec, first, last);
  let note = '';
  if (ov[name]) { cat = ov[name].cat; note = ov[name].note || ''; }
  counts[cat] = (counts[cat] || 0) + 1;
  rows.push({ cat, ec, name, first: first.replace(/\|/g, '/').trim().slice(0, 130), last: last.replace(/\|/g, '/').trim().slice(0, 80), fixed: fixed.has(name), note, loc: (cat === 'D' || cat === 'B') && ec !== '0' ? locate(name, first) : '' });
}
rows.sort((a, b) => (a.cat + a.name).localeCompare(b.cat + b.name));
console.log('| kat | exit | r5 | pozycja | pierwsza linia FAIL / ostatnia linia | plik:linia | nota / odtworzenie |');
console.log('|---|---|---|---|---|---|---|');
for (const r of rows) {
  const repro = (r.cat === 'D' || r.cat === 'B') && r.ec !== '0' ? `\`cd gra && node tools/${r.name}\`${r.note ? ' — ' + r.note : (r.cat === 'D' ? ' — przyczyna NIE ZMIERZONO' : '')}` : r.note;
  console.log(`| ${r.cat} | ${r.ec} | ${r.fixed ? 'naprawiony' : ''} | ${r.name} | ${(r.first || r.last).replace(/\|/g, '/')} | ${r.loc} | ${repro.replace(/\|/g, '/')} |`);
}
console.error('LICZBY:', JSON.stringify(counts), 'razem', rows.length);
