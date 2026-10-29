#!/usr/bin/env node
/**
 * run-k05a-units.mjs — harness porównania wartości/tekstu: jednostki K05A batch 1 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05A-Q1,
 * runda 1) — port (`src/ui/cityPanel/k05a-fundament.ts`) vs pin web `edb8fb56` (`gra/src/ui/cityPanel.ts`).
 *
 * Jednostki pinu wyciągane PO NAZWIE (od `function NAME`/`const NAME` w kolumnie 0 do końca bloku). Każda jednostka
 * z pinu i z portu jest wywoływana na tym samym zestawie wejść; wynik (wartość lub tekst HTML) musi być identyczny.
 * Nie mierzy DOM (jednostki K05A nie dotykają DOM z definicji wyboru skryptem).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k05a-units.mjs --pin-dir <PIN_DIR> [--v2 <plik-portu>]
 *   <PIN_DIR> = katalog poza repo z `git archive edb8fb56 gra/src gra/data`.
 *   --v2 podmienia plik portu (używane przez mutate-k05a-units.mjs).
 * EXIT 0 <=> 0 różnic; 1 <=> >=1 różnica; 2 <=> błąd harnessu.
 */
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run-k05a-units.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56> [--v2 <plik>]');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const V2_FILE = resolve(argOf('--v2') ?? join(V2_ROOT, 'src/ui/cityPanel/k05a-fundament.ts'));
const PIN_FILE = join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts');
const pinLines = readFileSync(PIN_FILE, 'utf8').split('\n');

/** Blok najwyższego poziomu z pinu: od linii zaczynającej się od `function NAME`/`const NAME` do pierwszej linii
 * w kolumnie 0 zaczynającej się od `}` lub do końca deklaracji jednolinijkowej (dla const kończy się na `;`). */
function extractTop(name) {
  const re = new RegExp(`^(export )?(function|const) ${name}\\b`);
  const i = pinLines.findIndex((l) => re.test(l));
  if (i < 0) throw new Error(`pin: brak deklaracji ${name}`);
  let j = i;
  if (/^(export )?const /.test(pinLines[i]) && pinLines[i].trimEnd().endsWith(';')) {
    j = i;
  } else if (/^(export )?const /.test(pinLines[i])) {
    while (!/^\S.*;\s*$/.test(pinLines[j]) || j === i) j++;
  } else {
    while (pinLines[j] !== '}') j++;
  }
  return pinLines.slice(i, j + 1).join('\n').replace(/^(export )?(function|const) /m, (_m, _e, kw) => `export ${kw} `);
}

const PIN_NAMES = ['ENTITY_CARD_BUILDING_STYLE_ID', 'hexDist', 'rangeName', 'ringsTiles', 'okStat'];
const probeSrc = [...PIN_NAMES.map(extractTop), ''].join('\n');

const tmp = mkdtempSync(join(tmpdir(), 'p58k05a-harness-'));
const results = [];
let exitCode = 0;
try {
  const pinProbe = join(tmp, 'pin-probe.ts');
  writeFileSync(pinProbe, probeSrc);
  await esbuild.build({ entryPoints: [pinProbe], outfile: join(tmp, 'pin.mjs'), bundle: true, format: 'esm', platform: 'node', target: 'es2022', logLevel: 'error' });
  await esbuild.build({ entryPoints: [V2_FILE], outfile: join(tmp, 'v2.mjs'), bundle: true, format: 'esm', platform: 'node', target: 'es2022', logLevel: 'error' });
  const P = await import(pathToFileURL(join(tmp, 'pin.mjs')).href);
  const V = await import(pathToFileURL(join(tmp, 'v2.mjs')).href);

  const cmp = (name, fa, fb) => {
    const ra = JSON.stringify(fa());
    const rb = JSON.stringify(fb());
    results.push({ name, status: ra === rb ? 'OK' : 'ROZNICA', detail: ra === rb ? ra.slice(0, 80) : `pin=${ra} v2=${rb}` });
  };

  // Wejścia: pełny zakres promieni (małe/średnie/duże progi), pierścienie 0..6, pary współrzędnych.
  cmp('ENTITY_CARD_BUILDING_STYLE_ID', () => P.ENTITY_CARD_BUILDING_STYLE_ID, () => V.ENTITY_CARD_BUILDING_STYLE_ID);
  for (let q = -4; q <= 4; q++)
    for (let r = -4; r <= 4; r++)
      cmp(`hexDist(0,0,${q},${r})`, () => P.hexDist(0, 0, q, r), () => V.hexDist(0, 0, q, r));
  for (const [a, b, c, d] of [[1, 2, 5, -3], [7, -2, -4, 9], [0, 0, 0, 0], [-6, 3, 2, 3]])
    cmp(`hexDist(${a},${b},${c},${d})`, () => P.hexDist(a, b, c, d), () => V.hexDist(a, b, c, d));
  for (let R = -1; R <= 14; R++) cmp(`rangeName(${R})`, () => P.rangeName(R), () => V.rangeName(R));
  for (let R = 0; R <= 12; R++)
    for (let rings = 0; rings <= 6; rings++)
      cmp(`ringsTiles(${R},${rings})`, () => P.ringsTiles(R, rings), () => V.ringsTiles(R, rings));
  for (const [k, v, s] of [
    ['Miasto', '12', 'pop'],
    ['', '', ''],
    ['<x>', '&amp;', 'a"b'],
    ['Żywność', '3.5', 'na turę'],
  ])
    cmp(`okStat(${k},${v},${s})`, () => P.okStat(k, v, s), () => V.okStat(k, v, s));
} catch (e) {
  console.error(`harness: ${e.message}`);
  exitCode = 2;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (exitCode === 0) {
  const diffs = results.filter((x) => x.status !== 'OK');
  for (const x of results) if (x.status !== 'OK') console.log(`${x.status} ${x.name}: ${x.detail}`);
  console.log(`run-k05a-units: porownan=${results.length} roznic=${diffs.length} v2=${V2_FILE.split('/').slice(-3).join('/')}`);
  exitCode = diffs.length === 0 ? 0 : 1;
}
process.exit(exitCode);
