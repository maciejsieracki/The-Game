#!/usr/bin/env node
/**
 * mutate-k08b-rail.mjs — mutacje partii `rail` K08B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1, runda 1).
 *
 * Każda mutacja = jedna zamiana tekstu (dokładnie raz) w kopii `k08b-rail.ts` obok oryginału (importy względne),
 * uruchomienie `run-k08b-rail.mjs --v2 <kopia>`; ZABITA <=> harness EXIT 1 (różnica). EXIT 2 (błąd harnessu)
 * NIE liczy się jako zabicie. Kopia jest usuwana po każdej mutacji.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-k08b-rail.mjs [--tmp-dir <katalog poza repo>]
 * EXIT 0 <=> wszystkie mutacje zabite lub równoważne (oznaczone EQUIV); 1 <=> przeżyła nierównoważna mutacja.
 */
import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, '../../src/ui/cityPanel/k08b-rail.ts');
const MUT = resolve(dirname(SRC), '__mut_k08b_rail.ts');
const TMP = argOf('--tmp-dir') ?? '/tmp';
const original = readFileSync(SRC, 'utf8');

/** [id, opis, stary, nowy, równoważna?] */
const MUTANTS = [
  ['on-class-inverted', 'klasa "on" odwrócona', "? ' on' : ''", "? '' : ' on'", false],
  ['pressed-inverted', 'aria-pressed odwrócone', "? 'true' : 'false'", "? 'false' : 'true'", false],
  ['click-no-rerender', 'klik bez rerender', '        requireK08aDeps().rerender();', '', false],
  ['click-no-clear', 'klik bez clearGarrisonPanel', 'requireK08aDeps().clearGarrisonPanel();\n        setK08aActiveCityPanelTab', 'setK08aActiveCityPanelTab', false],
  ['click-set-const', 'klik ustawia stałą zakładkę', 'setK08aActiveCityPanelTab(item.id);', "setK08aActiveCityPanelTab('budowa');", false],
  ['click-guard-dropped', 'brak strażnika aktywnej zakładki', "if (getK08aActiveCityPanelTab() !== item.id) {", 'if (true) {', false],
  ['footer-hint', 'tekst podpowiedzi stopki', 'Esc — szybkie zamknięcie', 'Esc', false],
  ['footer-no-close', 'stopka bez closeCityView', "wrap.querySelector('[data-city-exit]')?.addEventListener('click', () => closeCityView(onClose));", '', false],
  ['chrome-not-hidden', 'okolica-aux bez hidden', '<div id="cs-okolica-aux" hidden aria-hidden="true">', '<div id="cs-okolica-aux" aria-hidden="true">', false],
  ['w4-scroll-swap', 'klasy karty W4 zamienione', "'civ-w4-tab-card civ-w4-tab-card--scroll' : 'civ-w4-tab-card'", "'civ-w4-tab-card' : 'civ-w4-tab-card civ-w4-tab-card--scroll'", false],
  ['w4-id-dropped', 'id karty W4 pominięte', '  if (id) card.id = id;', '', false],
  ['owned-count-default', 'liczba budynków domyślnie 1', 'built?.length ?? 0', 'built?.length ?? 1', false],
  ['owned-label', 'etykieta paska zmieniona', 'Budynki w mieście (${count}) — pokaż szczegóły', 'Budynki (${count}) — pokaż szczegóły', false],
  ['rail-vert-w3-swap', 'klasa w3 przy vertical zamieniona', "'civ-v-icon-rail civ-v-icon-rail-vert civ-v-icon-rail-w3' : 'civ-v-icon-rail civ-v-icon-rail-vert'", "'civ-v-icon-rail civ-v-icon-rail-vert' : 'civ-v-icon-rail civ-v-icon-rail-vert civ-v-icon-rail-w3'", false],
  ['scale-const', 'scalePx zastąpione zerem (gałąź iconPx martwa w pinie)', 'Math.round(getK07aScalePx() * ', 'Math.round(0 * ', true],
];

const rows = [];
let survivors = 0;
try {
  for (const [id, desc, from, to, equiv] of MUTANTS) {
    const n = original.split(from).length - 1;
    if (n !== 1) {
      rows.push({ id, desc, status: `BŁĄD-MUTACJI (wystąpień=${n})` });
      survivors++;
      continue;
    }
    writeFileSync(MUT, original.replace(from, to));
    let status;
    try {
      execFileSync(process.execPath, [join(HERE, 'run-k08b-rail.mjs'), '--v2', MUT, '--tmp-dir', TMP], { stdio: 'pipe' });
      status = 'PRZEŻYŁA';
    } catch (e) {
      status = e.status === 1 ? 'ZABITA' : `HARNESS-EXIT-${e.status}`;
    }
    if (status === 'PRZEŻYŁA' && equiv) status = 'EQUIV (przeżyła; równoważna wg pinu)';
    else if (status !== 'ZABITA' && !(equiv && status.startsWith('EQUIV'))) survivors++;
    rows.push({ id, desc, status });
  }
} finally {
  if (existsSync(MUT)) rmSync(MUT, { force: true });
}
const killed = rows.filter((r) => r.status === 'ZABITA').length;
const equiv = rows.filter((r) => r.status.startsWith('EQUIV')).length;
for (const r of rows) console.log(`${r.status.padEnd(12)} ${r.id} — ${r.desc}`);
console.log(`mutate-k08b-rail: ${MUTANTS.length} mutacji, ${killed} zabitych, ${equiv} równoważnych, ${survivors} nieoczekiwanych`);
process.exit(survivors === 0 ? 0 : 1);
