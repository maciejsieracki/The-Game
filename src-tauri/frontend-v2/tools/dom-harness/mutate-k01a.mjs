#!/usr/bin/env node
/**
 * mutate-k01a.mjs — mutacje harnessu `run-k01a.mjs` (P5-8 K01A, R-RUSTPORT-P5-8-CITYPANEL-K01A-Q1 runda 2).
 *
 * Każda mutacja działa na KOPII `src/` frontend-v2 w katalogu tymczasowym (repo nietknięte). Harness musi dać
 * EXIT ≠ 0 i zgłosić oczekiwane bramki; linia (bez mutacji) musi dać EXIT 0.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k01a.mjs --pin-dir <PIN_DIR>
 * EXIT 0 ⇔ wszystkie mutacje wykryte z oczekiwanymi bramkami i linia zielona.
 */
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/mutate-k01a.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const V2_SRC = resolve(fileURLToPath(new URL('../../src/', import.meta.url)));
const HARNESS = fileURLToPath(new URL('./run-k01a.mjs', import.meta.url));
const REL = 'ui/cityPanel/k01a-fundament.ts';

// [nazwa, plik względem src/, szukany tekst (dokładnie raz), zamiennik, oczekiwane bramki (wszystkie muszą być CZERWONE)]
const MUTANTS = [
  ['M1 stała liczbowa w bloku', REL, 'export const LIST_SCROLL_VISIBLE = 3;', 'export const LIST_SCROLL_VISIBLE = 4;', ['A', 'F']],
  ['M2 zmiana wartości zwracanej', REL, 'export function signed(n: number): string { return signedPl(n); }', "export function signed(n: number): string { return '+' + signedPl(n); }", ['A', 'F']],
  ['M3 token DOM w bloku', REL, "export const STYLE_ID = 'civ-city-screen-css-w3-hudfix';", 'export const STYLE_ID = document.title;', ['A', 'C']],
  ['M4 usunięty export', REL, 'export const STYLE_ID =', 'const STYLE_ID =', ['B']],
  ['M5 import z warstwy logiki', REL, '', "import { UNIT_DEFS } from '../../data/loader';\n", ['C']],
  ['M6 zły zakres linii pinu', REL, 'cityPanel.ts:285-291', 'cityPanel.ts:285-290', ['A']],
  ['M7 dryf wartości zależności ui/uiParams (bez zmiany tekstu bloków)', 'ui/uiParams.ts', 'const raw = staticCatalog().uiParams;', 'const raw = JSON.parse(JSON.stringify(staticCatalog().uiParams)); (raw as any).panel_miasta.font_scale_domyslna_px = 999;', ['F']],
];

function runHarness(v2File) {
  const r = spawnSync(process.execPath, [HARNESS, '--pin-dir', PIN_DIR, '--v2', v2File], { encoding: 'utf8', timeout: 300000 });
  const out = (r.stdout ?? '') + (r.stderr ?? '');
  const wy = /WYNIK: (.*)/.exec(out);
  const failed = wy && wy[1].startsWith('CZERWONE') ? wy[1].replace('CZERWONE: ', '').split(',') : [];
  return { code: r.status, failed, out, wynik: wy ? wy[1] : '(brak linii WYNIK)' };
}

let bad = 0;
const rows = [];
const tmp = mkdtempSync(join(tmpdir(), 'k01a-mut-'));
try {
  // Linia bez mutacji (kopia = repo).
  const base = join(tmp, 'base');
  cpSync(V2_SRC, join(base, 'src'), { recursive: true });
  const b = runHarness(join(base, 'src', REL));
  rows.push(['linia (bez mutacji)', b.code === 0 ? 'OK' : 'FAIL', `EXIT=${b.code} ${b.wynik}`]);
  if (b.code !== 0) bad++;

  MUTANTS.forEach(([name, file, from, to, expect], idx) => {
    const dir = join(tmp, `m${idx + 1}`);
    cpSync(V2_SRC, join(dir, 'src'), { recursive: true });
    const target = join(dir, 'src', file);
    const src = readFileSync(target, 'utf8');
    if (from === '') {
      writeFileSync(target, to + src);
    } else {
      const n = src.split(from).length - 1;
      if (n !== 1) throw new Error(`${name}: szukany tekst występuje ${n} razy (wymagany 1)`);
      writeFileSync(target, src.replace(from, to));
    }
    const r = runHarness(join(dir, 'src', REL));
    const caught = r.code !== 0 && expect.every((g) => r.failed.includes(g));
    if (!caught) bad++;
    rows.push([name, caught ? 'WYKRYTA' : 'NIEWYKRYTA', `oczekiwano ${expect.join(',')}; ${r.wynik}`]);
  });
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

for (const [n, s, d] of rows) console.log(`${s.padEnd(11)} ${n} :: ${d}`);
const detected = rows.slice(1).filter((r) => r[1] === 'WYKRYTA').length;
console.log(`mutacje wykryte: ${detected}/${MUTANTS.length}; linia zielona: ${rows[0][1] === 'OK'}`);
process.exitCode = bad === 0 ? 0 : 1;
