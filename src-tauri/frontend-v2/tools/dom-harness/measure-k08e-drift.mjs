#!/usr/bin/env node
/**
 * measure-k08e-drift.mjs — pomiar DRYFU jednostek K08E (P5-8 §7; R-RUSTPORT-P5-8-CITYPANEL-K08E-Q1, runda 2).
 *
 * Dwa pomiary dla każdej z 12 jednostek:
 *   (a) KOPIA: blok `// pin edb8fb56 …` … `// pin-end` w pliku portu vs tekst pinu po podstawieniach (K08E-Z1);
 *       liczba różniących się linii (oczekiwane 0).
 *   (b) PIN: ta sama funkcja (wyszukana po nazwie) w `--head-pin-dir` (gra/src/ui/cityPanel.ts na bazie integracji)
 *       vs pin `edb8fb56`: SAME albo DRIFT(n linii różnych) i nowy zakres linii. Dryf NIE jest przepinowaniem.
 * Pin `--head-pin-dir` podaje wywołujący (np. `git archive <rev> gra/src` do katalogu poza repo); skrypt nie wywołuje git.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/measure-k08e-drift.mjs --pin-dir <PIN_edb8fb56> [--head-pin-dir <PIN_head>] [--json <plik>]
 * EXIT 0 <=> wszystkie kopie zgodne (a=0); 1 <=> >=1 kopia rozjechana; 2 <=> błąd narzędzia.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applySubsK08e, BATCHES_K08E, codeEndLine } from './k08e-subs.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const HERE = dirname(fileURLToPath(import.meta.url));
const V2_ROOT = resolve(HERE, '../..');
const PIN_DIR = argOf('--pin-dir');
const HEAD_DIR = argOf('--head-pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/measure-k08e-drift.mjs --pin-dir <PIN_DIR> [--head-pin-dir <PIN_HEAD>] [--json <plik>]');
  process.exit(2);
}
const pinLines = (dir) => readFileSync(join(resolve(dir), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/);
const PIN = pinLines(PIN_DIR);
const HEAD = HEAD_DIR ? pinLines(HEAD_DIR) : null;

/** Tekst bloku pinu po podstawieniach (jak generator), z `export` na deklaracji. */
const blockText = (lines, u) => {
  const end = codeEndLine(lines, u.a, u.b);
  const out = applySubsK08e({ a: u.a, b: u.b }, lines.slice(u.a - 1, end));
  if (/^(function|const|type) /.test(out[0])) out[0] = `export ${out[0]}`;
  return { text: out, end };
};

/** Liczba różniących się linii (pozycyjnie + nadmiar długości). */
const lineDiff = (x, y) => {
  let n = Math.abs(x.length - y.length);
  for (let i = 0; i < Math.min(x.length, y.length); i += 1) if (x[i] !== y[i]) n += 1;
  return n;
};

/** Zakres (start, koniec) funkcji o nazwie `name` w pinie `lines` (pierwsze wystąpienie deklaracji). */
const findFn = (lines, name) => {
  const a = lines.findIndex((l) => l.includes(`function ${name}(`));
  if (a < 0) return null;
  return { a: a + 1 };
};

const rows = [];
let copyDrift = 0;
for (const b of BATCHES_K08E) {
  const portPath = join(V2_ROOT, 'src/ui/cityPanel', b.file);
  const portLines = readFileSync(portPath, 'utf8').split(/\r?\n/);
  for (const u of b.units) {
    const { text: pinTxt, end } = blockText(PIN, u);
    /* (a) kopia w pliku portu. */
    const start = portLines.findIndex((l) => l.startsWith(`// pin edb8fb56 gra/src/ui/cityPanel.ts:${u.a}-${end}`));
    let copyN = -1;
    if (start >= 0) {
      const stop = portLines.indexOf('// pin-end', start);
      copyN = lineDiff(portLines.slice(start + 1, stop), pinTxt);
    }
    if (copyN !== 0) copyDrift += 1;
    /* (b) pin head vs pin edb8fb56 (ta sama funkcja po nazwie; koniec = pierwsza linia '}' w kolumnie 0). */
    let pinDrift = 'NIE_ZMIERZONO (brak --head-pin-dir)';
    let headRange = '-';
    if (HEAD) {
      const r = findFn(HEAD, u.name);
      if (!r) pinDrift = 'USUNIETA_Z_PINU_HEAD';
      else {
        let hb = r.a;
        while (hb < HEAD.length && HEAD[hb - 1] !== '}') hb += 1;
        const headTxt = applySubsK08e(u, HEAD.slice(r.a - 1, hb));
        const pinBody = pinTxt.map((l, i) => (i === 0 ? l.replace(/^export /, '') : l));
        const headBody = headTxt.map((l, i) => (i === 0 ? l.replace(/^export /, '') : l));
        const d = lineDiff(headBody, pinBody);
        headRange = `${r.a}-${hb}`;
        pinDrift = d === 0 ? 'SAME' : `DRIFT(${d})`;
      }
    }
    rows.push({ unit: u.name, batch: b.file, pinRange: `${u.a}-${end}`, copyDiffLines: copyN, pinHead: pinDrift, headRange });
  }
}

for (const r of rows) {
  console.log(`${r.unit.padEnd(32)} ${r.batch.padEnd(18)} pin=${r.pinRange.padEnd(12)} kopia_diff=${r.copyDiffLines} head=${r.headRange.padEnd(12)} pin_head=${r.pinHead}`);
}
const jsonPath = argOf('--json');
if (jsonPath) writeFileSync(jsonPath, JSON.stringify({ pinDir: PIN_DIR, headPinDir: HEAD_DIR ?? null, rows }, null, 2));
console.log(`\nmeasure-k08e-drift: jednostek=${rows.length}, kopie rozjechane=${copyDrift}`);
process.exit(copyDrift === 0 ? 0 : 1);
