#!/usr/bin/env node
/**
 * measure-k08d-drift.mjs — pomiar dryfu po pinie dla jednostek K08D (P5-8 §7, odpowiedź na zarzut Evaluatora r1, pkt 4).
 * Porównuje ciała czterech funkcji pinu (`edb8fb56`) z bieżącym `gra/src/ui/cityPanel.ts` (np. `git archive <rev> gra/src/ui`
 * rozpakowane poza repo). Dla każdej funkcji: zakres, liczba linii, identyczność ciała (po nazwie, nie po numerze linii).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/measure-k08d-drift.mjs --pin-dir <PIN_DIR> --cur-dir <katalog z gra/src/ui/cityPanel.ts>
 * EXIT 0 <=> wszystkie jednostki identyczne z pinem (dryf treści = 0; przesunięcia linii nie są dryfem treści);
 * EXIT 1 <=> >=1 jednostka zmieniona; EXIT 2 <=> błąd narzędzia.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
const CUR_DIR = argOf('--cur-dir');
if (!PIN_DIR || !CUR_DIR) {
  console.error('Użycie: node tools/dom-harness/measure-k08d-drift.mjs --pin-dir <PIN_DIR> --cur-dir <CUR_DIR>');
  process.exit(2);
}
const load = (dir) => readFileSync(join(resolve(dir), 'gra/src/ui/cityPanel.ts'), 'utf8').split('\n');
const pin = load(PIN_DIR);
const cur = load(CUR_DIR);

/** Ciało funkcji od linii `function <name>(` do pierwszej linii `}` (poziom najwyższy). */
const fnBlock = (lines, name) => {
  const s = lines.findIndex((l) => l.startsWith(`function ${name}(`));
  if (s < 0) return null;
  let e = s;
  while (e < lines.length && lines[e] !== '}') e++;
  return { from: s + 1, to: e + 1, text: lines.slice(s, e + 1).join('\n') };
};

const UNITS = ['ownerHasMennica', 'activeTradeRouteCountForCity', 'buildHandelDetailCard', 'renderHandelSlidersPanel'];
let changed = 0;
for (const name of UNITS) {
  const p = fnBlock(pin, name);
  const c = fnBlock(cur, name);
  if (!p || !c) {
    console.log(`BRAK ${name}: pin=${p ? 'tak' : 'nie'} cur=${c ? 'tak' : 'nie'}`);
    changed++;
    continue;
  }
  const same = p.text === c.text;
  if (!same) changed++;
  console.log(`${same ? 'IDENTYCZNA' : 'ZMIENIONA '} ${name} | pin ${p.from}-${p.to} (${p.text.split('\n').length} l) | cur ${c.from}-${c.to} (${c.text.split('\n').length} l)`);
}
console.log(`\ndryf treści K08D (4 jednostki): zmienionych=${changed}/${UNITS.length}`);
process.exit(changed === 0 ? 0 : 1);
