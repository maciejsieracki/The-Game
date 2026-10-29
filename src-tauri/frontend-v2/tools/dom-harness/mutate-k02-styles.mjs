#!/usr/bin/env node
/**
 * mutate-k02-styles.mjs — kontrola czułości harnessu P5.8 K02 (`run-k02-styles.mjs`): wstrzykuje po jednej mutacji do
 * `src/ui/cityPanel/k02-styles.ts`, uruchamia harness i oczekuje EXIT=1; plik przywracany bajtowo (asercja).
 *
 * Użycie: node tools/dom-harness/mutate-k02-styles.mjs --pin-dir <PIN_DIR>   → EXIT 0 ⇔ każda mutacja wykryta.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const pinIdx = args.indexOf('--pin-dir');
const pinDir = pinIdx >= 0 ? args[pinIdx + 1] : undefined;
if (!pinDir) {
  console.error('Użycie: node tools/dom-harness/mutate-k02-styles.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
// P5.8 SCAL: stale ukladu (STYLE_ID, LIST_*, CITY_PANEL_ICON_*, QUEUE_ROW_EM, ...) zyja po scaleniu w k01a-fundament;
// mutacja trafia w plik, w ktorym wzorzec wystepuje dokladnie raz (run-k02-styles bundluje oba pliki).
const FILES = ['src/ui/cityPanel/k02-styles.ts', 'src/ui/cityPanel/k01a-fundament.ts'];
const originals = Object.fromEntries(FILES.map((f) => [f, readFileSync(resolve(ROOT, f), 'utf8')]));

/** [nazwa, przed, po] — „przed” musi wystąpić w pliku dokładnie raz. */
const MUTS = [
  ['M1 stała LIST_SCROLL_VISIBLE 3→4', 'const LIST_SCROLL_VISIBLE = 3;', 'const LIST_SCROLL_VISIBLE = 4;'],
  ['M2 stała QUEUE_ROW_EM 2.75→2.7', 'const QUEUE_ROW_EM = 2.75;', 'const QUEUE_ROW_EM = 2.7;'],
  ['M3 stała CITY_PANEL_ICON_GLYPH_EM 4.5→4.6', 'const CITY_PANEL_ICON_GLYPH_EM = 4.5;', 'const CITY_PANEL_ICON_GLYPH_EM = 4.6;'],
  ['M4 STYLE_ID zmieniony', "const STYLE_ID = 'civ-city-screen-css-w3-hudfix';", "const STYLE_ID = 'civ-city-screen-css-w3';"],
  ['M5 brak usuwania starego stylu civ-city-screen-css', "  document.getElementById('civ-city-screen-css')?.remove();", ''],
  ['M6 CSS: z-index paneli 400→401', '.civ-cs{position:fixed;inset:0;z-index:400;', '.civ-cs{position:fixed;inset:0;z-index:401;'],
  ['M7 element stylu: createElement(style)→span', "style = document.createElement('style');", "style = document.createElement('span');"],
  ['M8 CSS: klasa list-scroll bez overflow-y', '.civ-cs .list-scroll{max-height:calc(${LIST_SCROLL_VISIBLE} * ${LIST_ROW_HEIGHT_EM}em);overflow-y:auto;', '.civ-cs .list-scroll{max-height:calc(${LIST_SCROLL_VISIBLE} * ${LIST_ROW_HEIGHT_EM}em);overflow-y:hidden;'],
];

let failed = 0;
try {
  for (const [name, before, after] of MUTS) {
    const hits = FILES.filter((f) => originals[f].split(before).length - 1 > 0);
    const n = FILES.reduce((acc, f) => acc + (originals[f].split(before).length - 1), 0);
    if (n !== 1) {
      console.log(`${name}: POMINIĘTA — wzorzec wystąpił ${n}× (oczekiwano 1)`);
      failed++;
      continue;
    }
    const f = hits[0];
    writeFileSync(resolve(ROOT, f), originals[f].replace(before, after));
    const r = spawnSync(process.execPath, [resolve(ROOT, 'tools/dom-harness/run-k02-styles.mjs'), '--pin-dir', pinDir], { cwd: ROOT, encoding: 'utf8' });
    const detected = r.status === 1;
    console.log(`${name} [${f.split('/').pop()}]: ${detected ? 'WYKRYTA' : 'NIEWYKRYTA'} (EXIT harnessu=${r.status}) ${(r.stdout || '').split('\n').find((l) => l.includes('różnic=')) ?? ''}`);
    writeFileSync(resolve(ROOT, f), originals[f]);
    if (!detected) failed++;
  }
} finally {
  for (const f of FILES) writeFileSync(resolve(ROOT, f), originals[f]);
}
const restored = FILES.every((f) => readFileSync(resolve(ROOT, f), 'utf8') === originals[f]);
console.log(`przywrócenie bajtowe: ${restored ? 'OK' : 'BŁĄD'}`);
console.log(`mutacje: ${MUTS.length}, nie wykryte lub pominięte: ${failed}`);
process.exit(failed === 0 && restored ? 0 : 1);
