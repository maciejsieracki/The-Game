#!/usr/bin/env node
/**
 * run-k02-breakdown.mjs — harness porównania DOM: bloki rozpiski breakdown (`src/ui/cityPanel/k02-breakdown.ts`,
 * P5.8 K02, runda 2 `R-RUSTPORT-P5-8-CITYPANEL-K02-Q1`) vs pin web `edb8fb56`:
 *   appendBreakdownLines (pin 4378), appendPctBreakdownBlock (4411), appendSignedBreakdownSections (4439),
 *   appendW4SignedBreakdownSections (4478), typ BreakdownLine (4376), el (863).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>
 *   node tools/dom-harness/run-k02-breakdown.mjs --pin-dir <PIN_DIR> [--json <plik>]
 * EXIT 0 ⇔ 0 różnic; 1 ⇔ ≥1 różnica; 2 ⇔ błąd harnessu.
 *
 * Strona pinu: wycinek linii 4376–4516 (funkcje eksportowane) + wycinek `el` (863–870) z stubem `cpInlineIcons`
 * i `CP_EMOJI_DETECT`; ścieżka `html` w `el` nie jest wywoływana przez bloki breakdown (ZAŁOŻENIE P5.8-K02-Z4).
 */
import { mkdtempSync, writeFileSync, readFileSync, rmSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { bundle } from './build.mjs';

function findJs(dir, name) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) {
      const r = findJs(p, name);
      if (r) return r;
    } else if (n === name) return p;
  }
  return null;
}
function entryJs(outdir) {
  const f = readdirSync(outdir).find((n) => n.endsWith('.js') && !n.startsWith('chunk-'));
  return f ? join(outdir, f) : null;
}

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
const JSON_OUT = argOf('--json');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run-k02-breakdown.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const PIN_SRC = resolve(PIN_DIR, 'gra/src');
const PIN_FILE = join(PIN_SRC, 'ui/cityPanel.ts');
const V2_FILE = join(V2_ROOT, 'src/ui/cityPanel/k02-breakdown.ts');
const PROBE_NAME = '__k02_breakdown_pin_probe.ts';

const pinLines = readFileSync(PIN_FILE, 'utf8').split('\n');
if (!/^function el</.test(pinLines[862]) || pinLines[869] !== '}') {
  console.error('Harness: pin:863–870 nie jest funkcją el — pin inny niż edb8fb56?');
  process.exit(2);
}
if (!/^type BreakdownLine = /.test(pinLines[4375]) || !/^}$/.test(pinLines[4515])) {
  console.error('Harness: pin:4376–4516 nie zawiera BreakdownLine/bloków breakdown — pin inny niż edb8fb56?');
  process.exit(2);
}
const elSrc = pinLines.slice(862, 870).join('\n');
const bodySrc = pinLines
  .slice(4375, 4516)
  .join('\n')
  .replace(/^function /gm, 'export function ');
const probeSrc = [
  `const CP_EMOJI_DETECT = /(?!)/u;`,
  `function cpInlineIcons(h: string): string { return h; }`,
  elSrc,
  bodySrc,
  '',
].join('\n');

const tmp = mkdtempSync(join(tmpdir(), 'p58k02b-harness-'));
let exitCode = 0;
try {
  const probePath = join(PIN_SRC, 'ui', PROBE_NAME);
  writeFileSync(probePath, probeSrc);
  const pinOut = join(tmp, 'pin');
  const v2Out = join(tmp, 'v2');
  await bundle([probePath], pinOut);
  await bundle([V2_FILE], v2Out);
  const pinJs = entryJs(pinOut);
  const v2Js = entryJs(v2Out);
  if (!pinJs || !v2Js) throw new Error('brak wygenerowanego bundla: ' + pinJs + ' ' + v2Js);
  const pinMod = await import(pathToFileURL(pinJs).href);
  const v2Mod = await import(pathToFileURL(v2Js).href);

  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', (e) => errors.push(String(e?.message ?? e).split('\n')[0]));

  /** Każdy przypadek: świeży dokument jsdom, montaż w <div>, zwrot outerHTML montażu (lub wyjątku). */
  const run = (mod, fnName, argv) => {
    const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
      url: 'http://localhost/',
      pretendToBeVisual: true,
      virtualConsole: vc,
    });
    const doc = dom.window.document;
    const mount = doc.createElement('div');
    doc.body.appendChild(mount);
    const prevDoc = globalThis.document;
    globalThis.document = doc;
    try {
      mod[fnName](mount, ...argv);
      return mount.innerHTML;
    } catch (e) {
      return `THROW: ${String(e?.message ?? e)}`;
    } finally {
      globalThis.document = prevDoc;
    }
  };

  const lines = [
    { label: 'a', value: 3 },
    { label: 'b', value: -2 },
    { label: 'c', value: 0 },
    { label: 'd', value: -0, neg: true },
    { label: 'e', value: -0 },
    { label: 'f', value: -4, neg: true },
  ];
  const signedLines = [
    { label: 'p', value: 2 },
    { label: 'n', value: -3 },
    { label: 'z', value: 0 },
  ];
  const zeroOnly = [{ label: 'z1', value: 0 }, { label: 'z2', value: 0 }];
  const cases = [
    ['appendBreakdownLines: undefined + podpowiedź', 'appendBreakdownLines', [undefined, 'brak danych']],
    ['appendBreakdownLines: pusta lista', 'appendBreakdownLines', [[], 'pusto']],
    ['appendBreakdownLines: mieszane wiersze (+, -, 0, -0 neg, -0 bez neg, neg z wartością)', 'appendBreakdownLines', [lines, '']],
    ['appendPctBreakdownBlock: brak pct, tytuł tekstowy', 'appendPctBreakdownBlock', ['Tytul', undefined, '#f00', undefined, 'brak']],
    ['appendPctBreakdownBlock: pct 150 (klamra 100), tytuł HTML, linie', 'appendPctBreakdownBlock', ['<b>T</b>', 150, '#0f0', [{ label: 'x', value: 1 }], 'h']],
    ['appendPctBreakdownBlock: pct -5 (klamra 0), puste linie', 'appendPctBreakdownBlock', ['T', -5, '#00f', [], 'h']],
    ['appendPctBreakdownBlock: pct 42.6 (zaokrąglenie)', 'appendPctBreakdownBlock', ['T', 42.6, '#abc', lines, '']],
    ['appendSignedBreakdownSections: pusta lista', 'appendSignedBreakdownSections', ['Plus/minus', [], 'pusto']],
    ['appendSignedBreakdownSections: mieszane + - 0, tytuł HTML', 'appendSignedBreakdownSections', ['<i>S</i>', signedLines, 'x']],
    ['appendSignedBreakdownSections: same zera', 'appendSignedBreakdownSections', ['Z', zeroOnly, 'x']],
    ['appendW4SignedBreakdownSections: pusta lista', 'appendW4SignedBreakdownSections', ['<b>W4</b>', [], 'pusto']],
    ['appendW4SignedBreakdownSections: mieszane + - 0', 'appendW4SignedBreakdownSections', ['W4', signedLines, 'x']],
  ];

  const results = cases.map(([name, fn, argv]) => {
    const a = run(pinMod, fn, argv);
    const b = run(v2Mod, fn, argv);
    return { name, ok: a === b, pin: a, v2: b };
  });
  const diffs = results.filter((r) => !r.ok).length;
  console.log(`run-k02-breakdown: asercji=${results.length} różnic=${diffs} jsdomErrors=${errors.length}`);
  for (const r of results.filter((x) => !x.ok)) {
    console.log(`  RÓŻNICA: ${r.name}\n    pin: ${r.pin}\n    v2 : ${r.v2}`);
  }
  if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ pin: PIN_DIR, diffs, jsdomErrors: errors.length, cases: results.map(({ name, ok }) => ({ name, ok })) }, null, 2));
  exitCode = diffs > 0 ? 1 : 0;
} catch (e) {
  console.error('run-k02-breakdown: błąd harnessu:', e?.stack ?? e);
  exitCode = 2;
} finally {
  try {
    rmSync(join(PIN_SRC, 'ui', PROBE_NAME), { force: true });
  } catch {}
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(exitCode);
