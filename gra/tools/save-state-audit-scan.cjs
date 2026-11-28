'use strict';
/**
 * save-state-audit-scan.cjs — R-WEB-SAVE-STATE-AUDIT-Q1 (tag SAVEAUDIT), krok 2.
 *
 * Tylko ODCZYT kodu: nie uruchamia gry, nie modyfikuje repo.
 *
 * Wypisuje WSZYSTKIE deklaracje `let`/`const` na wcięciu 4 spacje w gra/src/main.ts
 * (domknięcie gry, zmienne modułowe), niezależnie od inicjalizatora (`null`,
 * `undefined`, literał tekstowy/liczbowy/obiektowy/tablicowy, `new Map|Set|...`,
 * brak inicjalizatora). Dla każdej wskazuje, czy jej nazwa występuje w ciele
 * buildSaveGameSnapshot (kolumna „w zapisie”) i restoreGameFromSave (kolumna „w restore”).
 *
 * Od wersji z poprawkami audytu (Q1 r2):
 *  - ciała funkcji i wystąpienia nazw liczone są na tekście BEZ komentarzy `//` i `/* *\/`
 *    (komentarz zawierający nazwę nie czyni zmiennej „zapisywaną”); literały tekstowy
 *    ('...', "...", `...`) są zachowywane, więc `'https://...'` nie jest traktowane jako komentarz;
 *  - każda deklaracja jest brana pod uwagę, nie tylko Map/Set/Array/obiekt/licznik.
 *
 * Wstępna klasa (heurystyka po nazwie, NIE rozstrzyga S/D/R):
 *   D? — nazwa wskazuje stan decyzyjny AI/dyplomacji/ekonomii/zegara (do ręcznej weryfikacji),
 *   S? — nazwa wskazuje cache/diagnostykę/UI/powiadomienia,
 *   ?  — brak sygnału w nazwie (weryfikacja ręczna).
 *
 * Użycie (z katalogu głównego repo): node gra/tools/save-state-audit-scan.cjs [ścieżka/do/main.ts] [--md]
 * Domyślnie: gra/src/main.ts względem katalogu tego pliku; --md = tabela Markdown.
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const asMd = args.includes('--md');
const fileArg = args.find(a => !a.startsWith('--'));
const mainPath = fileArg
  ? path.resolve(fileArg)
  : path.resolve(__dirname, '..', 'src', 'main.ts');
const rawLines = fs.readFileSync(mainPath, 'utf8').split('\n');

/**
 * Usuwa komentarze (// i /* *\/) z kodu, zachowując literały tekstowy i długość linii
 * (komentarz zastępowany spacjami). Stan blokowego komentarza przechodzi między liniami.
 */
function stripComments(src) {
  const out = [];
  let inBlock = false;
  for (const line of src) {
    let res = '';
    let quote = null; // ' " `
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      const n = line[i + 1];
      if (inBlock) {
        if (c === '*' && n === '/') { inBlock = false; res += '  '; i++; } else res += ' ';
        continue;
      }
      if (quote) {
        res += c;
        if (c === '\\') { res += n ?? ''; i++; continue; }
        if (c === quote) quote = null;
        continue;
      }
      if (c === '/' && n === '/') { res += ' '.repeat(line.length - i); break; }
      if (c === '/' && n === '*') { inBlock = true; res += '  '; i++; continue; }
      if (c === '\'' || c === '"' || c === '`') { quote = c; res += c; continue; }
      res += c;
    }
    out.push(res);
  }
  return out;
}

const lines = stripComments(rawLines); // kod bez komentarzy (do dopasowań w ciałach i deklaracjach)

/** Zakres funkcji: od linii deklaracji do pierwszej linii o wcięciu funkcji (`}`). */
function functionRange(name) {
  const startRe = new RegExp(`^\\s*(async\\s+)?function\\s+${name}\\s*\\(`);
  const start = lines.findIndex(l => startRe.test(l));
  if (start < 0) throw new Error(`Brak funkcji ${name} w ${mainPath}`);
  const indent = lines[start].match(/^\s*/)[0];
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i] === `${indent}}`) return { start: start + 1, end: i + 1, indent };
  }
  throw new Error(`Nie znaleziono końca funkcji ${name}`);
}

const saveR = functionRange('buildSaveGameSnapshot');
const restoreR = functionRange('restoreGameFromSave');

// Deklaracja: `let|const nazwa [: typ] [= init]` na wcięciu 4 spacje.
const declRe = /^(\s{4})(?:const|let)\s+([A-Za-z_]\w*)\s*(?::[^=]+)?(?:=\s*(.*))?$/;

const typeOf = init => {
  if (init === undefined) return 'Brak';
  const t = init.trim();
  if (t === '') return 'Wieloliniowy';
  if (/^new\s+Map\b/.test(t)) return 'Map';
  if (/^new\s+Set\b/.test(t)) return 'Set';
  if (/^new\s+\w+/.test(t)) return 'Instancja';
  if (/^\[/.test(t)) return 'Array';
  if (/^\{/.test(t)) return 'Obiekt';
  if (/^-?\d+(\.\d+)?\b/.test(t)) return 'Licznik';
  if (/^(true|false)\b/.test(t)) return 'Flaga';
  if (/^null\b/.test(t)) return 'Null';
  if (/^undefined\b/.test(t)) return 'Undefined';
  if (/^(['"`])/.test(t)) return 'Tekst';
  return 'Wyrazenie';
};

const dRe = /(Owner|Ai|AI|Diplo|Diplomacy|Dobra|Nns|Nap|Wonder|Since|Last|Turn|Cooldown|Counter|Budget|Gold|Income|Stuck|Upkeep|Pool|Praca|Tick|Relation|Pending|Trust|Treaty|Alliance|Truce|War|Peace|Garrison|Battle|Resume)/;
const sRe = /(Snapshot|Cache|Cached|Debug|Diag|Log|Ui|UI|Hud|HUD|Toast|Popup|Notice|Notif|Mesh|Sprite|Overlay|Audit|Measure|Changes|Hint|Queue|Shown|Seen|Tracking|Ready|Pointers|Timer)/;

const rows = [];
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(declRe);
  if (!m) continue;
  const name = m[2];
  const type = typeOf(m[3]);
  const word = new RegExp(`\\b${name}\\b`);
  const inRange = (r) => {
    for (let j = r.start; j < r.end; j++) if (word.test(lines[j])) return true;
    return false;
  };
  const inSave = inRange(saveR);
  const inRestore = inRange(restoreR);
  let refs = 0; // odwołania w pliku, z komentarzami (surowy tekst)
  for (const l of rawLines) if (word.test(l)) refs++;
  let guess = '?';
  if (!inSave) {
    if (sRe.test(name)) guess = 'S?';
    else if (dRe.test(name)) guess = 'D?';
  }
  rows.push({
    name, line: i + 1, type, refs,
    zapis: inSave ? 'tak' : 'nie',
    odtwarzane: inRestore ? 'tak (ciało restore)' : 'nie',
    guess: inSave ? '-' : guess,
  });
}

const notSaved = rows.filter(r => r.zapis === 'nie');
const typeCounts = {};
for (const r of rows) typeCounts[r.type] = (typeCounts[r.type] ?? 0) + 1;
const out = [];
out.push(`# save-state-audit-scan: ${path.relative(process.cwd(), mainPath)}`);
out.push(`buildSaveGameSnapshot: linie ${saveR.start}-${saveR.end}; restoreGameFromSave: linie ${restoreR.start}-${restoreR.end}`);
out.push(`Deklaracje let/const na wcięciu 4 (wszystkie typy inicjalizatora): ${rows.length}`);
out.push('Rozkład typów: ' + Object.entries(typeCounts).map(([k, v]) => `${k}=${v}`).join(', '));
out.push(`Nie występują w buildSaveGameSnapshot (bez komentarzy): ${notSaved.length}`);
out.push('');
const head = asMd
  ? '| nazwa | linia | typ | w zapisie | w restore | wstępna klasa | odwołań w pliku (z komentarzami) |\n|---|---|---|---|---|---|---|'
  : 'nazwa\tlinia\ttyp\tw_zapisie\tw_restore\twstepna_klasa\todwolan_z_komentarzami';
out.push(head);
for (const r of notSaved) {
  const cells = [r.name, r.line, r.type, r.zapis, r.odtwarzane, r.guess, r.refs];
  out.push(asMd ? `| ${cells.join(' | ')} |` : cells.join('\t'));
}
out.push('');
out.push('Pozycje zapisywane (kontrola): ' + rows.filter(r => r.zapis === 'tak').map(r => r.name).join(', '));
process.stdout.write(out.join('\n') + '\n');
