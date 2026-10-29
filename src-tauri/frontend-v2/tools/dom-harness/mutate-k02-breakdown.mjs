#!/usr/bin/env node
/**
 * mutate-k02-breakdown.mjs — kontrola czułości harnessu `run-k02-breakdown.mjs` (P5.8 K02, runda 2): wstrzykuje po
 * jednej mutacji do `src/ui/cityPanel/k02-breakdown.ts`, uruchamia harness i oczekuje EXIT=1; plik przywracany bajtowo.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k02-breakdown.mjs --pin-dir <PIN_DIR>
 * EXIT 0 ⇔ każda mutacja wykryta (i przywrócenie bajtowe OK).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const pinIdx = args.indexOf('--pin-dir');
const pinDir = pinIdx >= 0 ? args[pinIdx + 1] : undefined;
if (!pinDir) {
  console.error('Użycie: node tools/dom-harness/mutate-k02-breakdown.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const path = resolve(ROOT, 'src/ui/cityPanel/k02-breakdown.ts');
const original = readFileSync(path, 'utf8');

/** [nazwa, przed, po] — „przed” musi wystąpić w pliku dokładnie raz. */
const MUTS = [
  ['M1 signed: letter-spacing nagłówka „Na plus” 0.04→0.05em', "plusHd.style.cssText = 'font-size:0.68em;margin:0.08em 0 0.1em;text-transform:uppercase;letter-spacing:0.04em;';", "plusHd.style.cssText = 'font-size:0.68em;margin:0.08em 0 0.1em;text-transform:uppercase;letter-spacing:0.05em;';"],
  ['M2 isNeg bez pola neg (tylko znak)', 'const isNeg = l.neg === true || l.value < 0;', 'const isNeg = l.value < 0;'],
  ['M3 brak zerowania -0 w wierszu negatywnym', 'const showAsZero = isNeg && Math.abs(l.value) === 0;', 'const showAsZero = false;'],
  ['M4 klamra szerokości paska 100→101', 'Math.min(100, pct)', 'Math.min(101, pct)'],
  ['M5 W4: letter-spacing nagłówka „Na minus” 0.1→0.04em', "minusHd.style.cssText = 'font-size:0.68em;margin:0.22em 0 0.1em;text-transform:uppercase;letter-spacing:0.1em;';", "minusHd.style.cssText = 'font-size:0.68em;margin:0.22em 0 0.1em;text-transform:uppercase;letter-spacing:0.04em;';"],
  ['M6 brak wiersza Stan dla pct<0', 'if (pct != null) {', 'if (pct != null && pct > 0) {'],
  ['M7 W4: klasa nagłówka civ-w4-subhd→subhd', "const sub = el('div', 'civ-w4-subhd');", "const sub = el('div', 'subhd');"],
  ['M8 W4: klasa pustej rozpiski muted→mut', 'empty.innerHTML = `<span class="muted">${emptyHint}</span>`;', 'empty.innerHTML = `<span class="mut">${emptyHint}</span>`;'],
  ['M9 znak plus dla zera (>= → >)', "${l.value >= 0 ? '+' : ''}", "${l.value > 0 ? '+' : ''}"],
];

let failed = 0;
try {
  for (const [name, before, after] of MUTS) {
    const n = original.split(before).length - 1;
    if (n !== 1) {
      console.log(`${name}: POMINIĘTA — wzorzec wystąpił ${n}× (oczekiwano 1)`);
      failed++;
      continue;
    }
    writeFileSync(path, original.replace(before, after));
    const r = spawnSync(process.execPath, [resolve(ROOT, 'tools/dom-harness/run-k02-breakdown.mjs'), '--pin-dir', pinDir], { cwd: ROOT, encoding: 'utf8' });
    const detected = r.status === 1;
    console.log(`${name}: ${detected ? 'WYKRYTA' : 'NIEWYKRYTA'} (EXIT harnessu=${r.status}) ${(r.stdout || '').split('\n')[0]}`);
    if (!detected) failed++;
  }
} finally {
  writeFileSync(path, original);
}
const restored = readFileSync(path, 'utf8') === original;
console.log(`przywrócenie bajtowe: ${restored ? 'OK' : 'BŁĄD'}`);
console.log(`mutacje: ${MUTS.length}, nie wykryte lub pominięte: ${failed}`);
process.exit(failed === 0 && restored ? 0 : 1);
