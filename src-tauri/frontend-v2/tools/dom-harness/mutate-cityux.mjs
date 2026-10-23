#!/usr/bin/env node
/**
 * mutate-cityux.mjs — kontrola czułości harnessu P5.7 r3 (`run-cityux.mjs`): wstrzykuje po jednej mutacji do modułu v2
 * (`cityUxFrame.ts` albo most `cityPanelUxBridge.ts`), uruchamia harness (`--stop-on-diff`) i oczekuje EXIT=1;
 * przywraca plik bajtowo (asercja).
 *
 * Użycie: node tools/dom-harness/mutate-cityux.mjs --pin-dir <PIN_DIR> [--only C1,C2]   → EXIT 0 ⇔ każda mutacja wykryta.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const pinDir = args[args.indexOf('--pin-dir') + 1];
if (!pinDir || args.indexOf('--pin-dir') < 0) {
  console.error('Użycie: node tools/dom-harness/mutate-cityux.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const onlyIds = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));

const F = 'src/ui/cityUxFrame.ts';
const B = 'src/ui/cityPanelUxBridge.ts';
/** [nazwa, plik, przed, po] — „przed” musi wystąpić w pliku dokładnie raz. */
const MUTS = [
  // Stałe układu i metryki.
  ['C1 ramka: wysokość paska górnego', F, `const TOP_H = 96;`, `const TOP_H = 95;`],
  ['C2 ramka: dolny margines docków (CSS)', F, `const DOCK_BOTTOM_CLEAR = 96;`, `const DOCK_BOTTOM_CLEAR = 90;`],
  ['C3 ramka: szerokość lewego panelu (metryka 24vw)', F, `const leftW = Math.min(window.innerWidth * 0.24, LEFT_W);`, `const leftW = Math.min(window.innerWidth * 0.25, LEFT_W);`],
  ['C4 ramka: szerokość prawego panelu (metryka 26vw)', F, `rightW: Math.min(window.innerWidth * 0.26, RIGHT_W),`, `rightW: Math.min(window.innerWidth * 0.25, RIGHT_W),`],
  ['C5 ramka: wyrażenie CSS prawego panelu', F, 'const RIGHT_PANEL_W_EXPR = `min(26vw,${RIGHT_W}px)`;', 'const RIGHT_PANEL_W_EXPR = `min(27vw,${RIGHT_W}px)`;'],
  // `isPointOverCityPanelUi` — granice.
  ['C6 trafienie: prawy panel (>= → >)', F, `if (x >= rightPanelLeft) return true;`, `if (x > rightPanelLeft) return true;`],
  ['C7 trafienie: dół paska górnego (< → <=)', F, `if (y < tr.bottom) return true;`, `if (y <= tr.bottom) return true;`],
  ['C8 trafienie: wartość zastępcza TOP_H (< → <=)', F, `} else if (y < topH) {`, `} else if (y <= topH) {`],
  ['C9 trafienie: lewy panel bez docka', F, `const leftPanelEnd = leftMargin + leftW + detailDock.left;`, `const leftPanelEnd = leftMargin + leftW;`],
  ['C10 trafienie: szyna lewa od górnej krawędzi (>= → >)', F, `if (x >= leftRailLeft && x <= leftRailRight && y >= railTop) return true;`, `if (x >= leftRailLeft && x <= leftRailRight && y > railTop) return true;`],
  ['C11 trafienie: brak testu stosu dolnego', F, `if (x >= br.left && x <= br.right && y >= br.top && y <= br.bottom) return true;`, `if (x >= br.left && x <= br.right && y >= br.top && y < br.top) return true;`],
  // Klawisze.
  ['C12 klawisze: ← w złą stronę', F, `navigateCityPanel(-1);`, `navigateCityPanel(1);`],
  ['C13 klawisze: `select` nie blokuje skrótów', F, `'input, textarea, select, [contenteditable="true"]'`, `'input, textarea, [contenteditable="true"]'`],
  ['C14 klawisze: → bez stopImmediatePropagation', F, `e.stopImmediatePropagation();\n      navigateCityPanel(1);`, `navigateCityPanel(1);`],
  ['C15 klawisze: kod Period', F, `e.code === 'Period'`, `e.code === 'Slash'`],
  // Cykl życia.
  ['C16 Escape: ramka nie na stosie nakładek', F, `pushOverlay('city-panel', () => { frameOnClose?.(); });`, ``],
  ['C17 CSS: z-index ramki', F, `.civ-ux-frame{position:fixed;inset:0;z-index:400;`, `.civ-ux-frame{position:fixed;inset:0;z-index:401;`],
  ['C18 legacy: stary arkusz nie usuwany', F, `document.getElementById('civ-okolica-ux-frame-css')?.remove();`, ``],
  ['C19 markup: kolejność kontenerów', F, `frameRoot.appendChild(right);\n  frameRoot.appendChild(detailDock);`, `frameRoot.appendChild(detailDock);\n  frameRoot.appendChild(right);`],
  ['C20 refresh: bez onClose', F, `paintCityPanelSections(mounts, city, paint, frameOnClose ?? undefined);`, `paintCityPanelSections(mounts, city, paint, undefined);`],
  ['C21 hide: maski legacy zostają', F, `  document.getElementById('civ-ux-map-mask')?.remove();\n  document.getElementById('civ-ux-top-mask')?.remove();\n}`, `}`],
  ['C22 show: przyciemnienie nie tworzone', F, `    document.body.appendChild(dim);`, ``],
  // Most.
  ['B1 most: nawigacja odwrócona', B, `impl?.navigateCityPanel(dir);`, `impl?.navigateCityPanel(dir === 1 ? -1 : 1);`],
  ['B2 most: sprzątanie panelu pominięte', B, `impl?.clearCityPanelUxMode();`, ``],
  ['B3 most: malowanie bez onClose', B, `impl?.paintCityPanelSections(mounts, city, refresh, onClose);`, `impl?.paintCityPanelSections(mounts, city, refresh);`],
];

let missed = 0;
let run = 0;
for (const [name, rel, a, b] of MUTS) {
  if (onlyIds && !onlyIds.includes(name.split(' ')[0])) continue;
  run++;
  const p = resolve(ROOT, rel);
  const orig = readFileSync(p, 'utf8');
  const count = orig.split(a).length - 1;
  if (count !== 1) {
    console.log(`${name}: BŁĄD wzorzec występuje ${count}× EXIT=n/d NIEWYKRYTA`);
    missed++;
    continue;
  }
  try {
    writeFileSync(p, orig.replace(a, b));
    const r = spawnSync('node', ['tools/dom-harness/run-cityux.mjs', '--pin-dir', pinDir, '--stop-on-diff'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    // EXIT=2 = błąd harnessu (nie wykrycie) — liczony jako NIEWYKRYTA.
    const summary = r.stdout.split('\n').find((l) => l.startsWith('dom-harness-cityux:'))
      ?? (r.stderr.split('\n').find((l) => /BŁĄD|Error/.test(l)) ?? r.stderr.slice(-300));
    const detected = r.status === 1;
    if (!detected) missed++;
    console.log(`${name}: EXIT=${r.status} ${detected ? 'WYKRYTA' : 'NIEWYKRYTA'} ${summary}`);
  } finally {
    writeFileSync(p, orig);
  }
  if (readFileSync(p, 'utf8') !== orig) throw new Error(`nie przywrócono ${rel}`);
}
console.log(`mutate-cityux: mutacji=${run} niewykrytych=${missed} (pliki przywrócone bajtowo)`);
process.exit(missed === 0 ? 0 : 1);
