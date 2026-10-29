#!/usr/bin/env node
/**
 * mutate-k02-units.mjs — kontrola czulosci harnessu `run-k02-units.mjs` (P5.8 K02, runda 3 partia 1): wstrzykuje
 * po jednej mutacji do `src/ui/cityPanel/k02-units.ts`, uruchamia harness i oczekuje EXIT=1; plik przywracany bajtowo.
 *
 * Uzycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k02-units.mjs --pin-dir <PIN_DIR>
 * EXIT 0 <=> kazda mutacja wykryta (i przywrocenie bajtowe OK).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const pinIdx = args.indexOf('--pin-dir');
const pinDir = pinIdx >= 0 ? args[pinIdx + 1] : undefined;
if (!pinDir) {
  console.error('Uzycie: node tools/dom-harness/mutate-k02-units.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const path = resolve(ROOT, 'src/ui/cityPanel/k02-units.ts');
const original = readFileSync(path, 'utf8');

/** [nazwa, przed, po] — „przed” musi wystapic w pliku dokladnie raz. */
const MUTS = [
  ['M1 fillIconElement: svg jako tekst', 'if (iconHtml.startsWith(\'<svg\')) el.innerHTML = iconHtml;', 'if (iconHtml.startsWith(\'<svg\')) el.textContent = iconHtml;'],
  ['M2 makeMiniThumb: klasa miniatury', "const t = el('div', 'mini-thumb');", "const t = el('div', 'mini-thumb2');"],
  ['M3 createScrollList: klasa fill', "sc.classList.add('list-scroll-fill');", "sc.classList.add('list-scroll-fil');"],
  ['M4 createScrollList: domyslna wysokosc wiersza 2.75→2.7', 'const rowH = opts.rowEm ?? LIST_ROW_HEIGHT_EM;', 'const rowH = opts.rowEm ?? 2.7;'],
  ['M5 appendTabIndicators: brak escapowania cudzyslowu w title', "c.title.replace(/\"/g, '&quot;')", 'c.title'],
  ['M6 statChip: brak klasy wartosci', 'cv ${cls}', 'cv'],
  ['M7 appendSurowceGrid: tytul aktywnego bez polskiego znaku', 'dostęp aktywny (ulepszenie', 'dostep aktywny (ulepszenie'],
  ['M8 appendIndywidualneToggle: zamiana stanu data-stan', "btn.dataset.stan = overrideOn ? 'wl' : 'wyl';", "btn.dataset.stan = overrideOn ? 'wyl' : 'wl';"],
  ['M9 appendIndywidualneToggle: brak rerender po kliknieciu', '    rerender();', '    void 0;'],
  ['M10 appendW4PctMetricBlock: klamra szerokosci paska 100→99', 'fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;', 'fill.style.width = `${Math.max(0, Math.min(99, pct))}%`;'],
  ['M11 appendW4PctMetricBlock: klasa paska', "const barWrap = el('div', 'civ-w4-pct-bar');", "const barWrap = el('div', 'civ-w4-pct-bar2');"],
  ['M12 appendW4PctMetricBlock: klasa punktow', 'class="civ-w4-subhd-pts"', 'class="civ-w4-subhd-pt"'],
  ['M13 appendCitizenUpkeepBlock: ignoruje brak wymagan', 'if (!hasRequired) return;', 'if (false) return;'],
  ['M14 makeBuildingThumb: zla ikona (pusta)', 'return makeMiniThumb(iconHtml);', "return makeMiniThumb('');"],
  ['M15 appendProductionPicon: klasa picon', "const iconEl = el('div', 'picon');", "const iconEl = el('div', 'picon2');"],
  ['M16 productionQueueIconSpan: dodatkowa klasa span', "const s = el('span');", "const s = el('span', 'x');"],
  ['M17 appendBuildingInlineIcon: klasa bi', "const bi = el('span', 'bi');", "const bi = el('span', 'bi2');"],
  ['M18 renderBilans: tekst pustego bilansu', "none.innerHTML = 'Brak danych gry';", "none.innerHTML = 'Brak danych';"],
  ['M19 renderBilans: klasa tytulu', "const title = el('div', 'ptitle');", "const title = el('div', 'ptitle2');"],
  ['M20 appendDisabledBuildActionButtons: Kup tylko przy showPurchase===true', 'if (opts?.showPurchase !== false) {', 'if (opts?.showPurchase === true) {'],
  ['M21 applyBuildButtonVisualState: zla klasa stanu', "btn.classList.add(canAct ? 'can-build' : 'cannot-build');", "btn.classList.add(canAct ? 'can-build' : 'cannot-build2');"],
  ['M22 appendBuildingRequirementChipSections: brak pominiecia pustych grup', 'if (group.length === 0) continue;', 'if (false) continue;'],
  ['M23 appendBuildingRequirementChipSections: etykieta surowcow', "stock: 'Wymagane surowce',", "stock: 'Wymagane surowce!',"],
  ['M24 techIconHintSpan: brak klasy bld-req-tech-ic', "' bld-req-tech-ic' : '')", "'' : '')"],
  ['M25 techIconHintSpan: kolor inheritColor', "opts?.inheritColor ? 'currentColor' : 'var(--gold)'", "opts?.inheritColor ? 'red' : 'var(--gold)'"],
  ['M26 bindTechHintLinkDelegation: brak flagi (podwojne bindowanie)', 'if (techHintLinkDelegationBound) return;', 'if (false) return;'],
  ['M27 bindTechHintLinkDelegation: spacja nie aktywuje', "if (e.key !== 'Enter' && e.key !== ' ') return;", "if (e.key !== 'Enter') return;"],
  ['M28 bindTechHintLinkDelegation: klik przekazuje inna nazwe', "e.stopPropagation();\n    openPreview(name);\n  });\n  document.addEventListener('keydown'", "e.stopPropagation();\n    openPreview(name + '!');\n  });\n  document.addEventListener('keydown'"],
];

let failed = 0;
try {
  for (const [name, before, after] of MUTS) {
    const n = original.split(before).length - 1;
    if (n !== 1) {
      console.log(`${name}: POMINIETA — wzorzec wystapil ${n}x (oczekiwano 1)`);
      failed++;
      continue;
    }
    writeFileSync(path, original.replace(before, after));
    const r = spawnSync(process.execPath, [resolve(ROOT, 'tools/dom-harness/run-k02-units.mjs'), '--pin-dir', pinDir], { cwd: ROOT, encoding: 'utf8' });
    const detected = r.status === 1;
    console.log(`${name}: ${detected ? 'WYKRYTA' : 'NIEWYKRYTA'} (EXIT harnessu=${r.status}) ${(r.stdout || '').split('\n')[0]}`);
    if (!detected) failed++;
  }
} finally {
  writeFileSync(path, original);
}
const restored = readFileSync(path, 'utf8') === original;
console.log(`przywrocenie bajtowe: ${restored ? 'OK' : 'BLAD'}`);
console.log(`mutacje: ${MUTS.length}, niewykryte lub pominiete: ${failed}`);
process.exit(failed === 0 && restored ? 0 : 1);
