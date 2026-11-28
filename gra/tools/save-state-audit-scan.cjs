'use strict';
/**
 * save-state-audit-scan.cjs — R-WEB-SAVE-STATE-AUDIT-Q1 (tag SAVEAUDIT), krok 2.
 *
 * Tylko ODCZYT kodu: nie uruchamia gry, nie modyfikuje repo.
 * Wypisuje tabelę zmiennych modułowych gra/src/main.ts (deklaracje `let`/`const`
 * wewnątrz domknięcia gry, wcięcie 4 spacje) typu Map/Set/Array/obiekt/licznik
 * i wskazuje, które z nich NIE występują w ciele buildSaveGameSnapshot ani w ciele
 * restoreGameFromSave. Dla pozycji nie zapisywanych nadaje wstępną klasę:
 *   D? — nazwa wskazuje stan decyzyjny AI/dyplomacji/ekonomii/zegara (do ręcznej weryfikacji),
 *   S? — nazwa wskazuje cache/diagnostykę/UI/powiadomienia,
 *   ?  — brak sygnału w nazwie (weryfikacja ręczna).
 * Klasa ostateczna (S/D/R) wymaga przeczytania kodu — tabela to punkt startowy.
 *
 * Użycie: node gra/tools/save-state-audit-scan.cjs [ścieżka/do/main.ts] [--md]
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
const lines = fs.readFileSync(mainPath, 'utf8').split('\n');

/** Zakres funkcji: od linii deklaracji do pierwszej linii `    }` (zamknięcie wcięcia 4). */
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

const declRe = /^(\s{4})(?:const|let)\s+([A-Za-z_]\w*)\s*(?::[^=]+)?=\s*(.*)$/;
const typeOf = init => {
  if (/^new\s+Map\b/.test(init)) return 'Map';
  if (/^new\s+Set\b/.test(init)) return 'Set';
  if (/^\[\s*\]/.test(init)) return 'Array';
  if (/^\{\s*\}/.test(init)) return 'Obiekt';
  if (/^-?\d+(\.\d+)?\b/.test(init)) return 'Licznik';
  if (/^(true|false)\b/.test(init)) return 'Flaga';
  return null;
};

const dRe = /(Owner|Ai|AI|Diplo|Diplomacy|Dobra|Nns|Nap|Wonder|Since|Last|Turn|Cooldown|Counter|Budget|Gold|Income|Stuck|Upkeep|Pool|Praca|Tick|Relation|Pending|Trust|Treaty|Alliance|Truce|War|Peace)/;
const sRe = /(Snapshot|Cache|Cached|Debug|Diag|Log|Ui|UI|Hud|HUD|Toast|Popup|Notice|Notif|Mesh|Sprite|Overlay|Audit|Measure|Changes|Hint|Queue|Shown|Seen|Tracking|Ready|Pointers|Timer)/;

const rows = [];
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(declRe);
  if (!m) continue;
  const name = m[2];
  const type = typeOf(m[3].trim());
  if (!type) continue;
  const word = new RegExp(`\\b${name}\\b`);
  const inRange = (r) => {
    for (let j = r.start; j < r.end; j++) if (word.test(lines[j])) return true;
    return false;
  };
  const inSave = inRange(saveR);
  const inRestore = inRange(restoreR);
  // Liczba odwołań w całym pliku (pierwsze wystąpienie = deklaracja).
  let refs = 0;
  for (const l of lines) if (word.test(l)) refs++;
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
const out = [];
out.push(`# save-state-audit-scan: ${path.relative(process.cwd(), mainPath)}`);
out.push(`buildSaveGameSnapshot: linie ${saveR.start}-${saveR.end}; restoreGameFromSave: linie ${restoreR.start}-${restoreR.end}`);
out.push(`Deklaracje (let/const, wcięcie 4, typ Map/Set/Array/Obiekt/Licznik/Flaga): ${rows.length}`);
out.push(`Nie występują w buildSaveGameSnapshot: ${notSaved.length}`);
out.push('');
const head = asMd
  ? '| nazwa | linia | typ | w zapisie | w restore | wstępna klasa | odwołań w pliku |\n|---|---|---|---|---|---|---|'
  : 'nazwa\tlinia\ttyp\tw_zapisie\tw_restore\twstepna_klasa\todwolan';
out.push(head);
for (const r of notSaved) {
  const cells = [r.name, r.line, r.type, r.zapis, r.odtwarzane, r.guess, r.refs];
  out.push(asMd ? `| ${cells.join(' | ')} |` : cells.join('\t'));
}
out.push('');
out.push('Pozycje zapisywane (kontrola): ' + rows.filter(r => r.zapis === 'tak').map(r => r.name).join(', '));
process.stdout.write(out.join('\n') + '\n');
