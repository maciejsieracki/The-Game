#!/usr/bin/env node
/**
 * run-k05a-units.mjs — harness porównania wartości/tekstu: jednostki K05A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05A-Q1,
 * runda 2) — port (`src/ui/cityPanel/k05a-fundament.ts`) vs pin web `edb8fb56` (`gra/src/ui/cityPanel.ts`).
 *
 * Jednostki pinu wyciągane PO NAZWIE (od `function NAME`/`const NAME` w kolumnie 0 do końca bloku). Każda jednostka
 * z pinu i z portu jest wywoływana na tym samym zestawie wejść; wynik (wartość lub tekst HTML) musi być identyczny.
 * Parametry UI: pin czyta `gra/data/ui-params.json`; port importuje `../uiParams`, który w harnessie jest podmieniany
 * (plugin esbuild) na stub z tym samym JSON-em — wiring `staticCatalog` nie jest tu testowany (NIE_ZMIERZONO, K01A-ADAPT).
 * Typy (`City`, `OkolicaTryb`, `TerenBazowy`) są usuwane przy kompilacji; enum `TerenBazowy` z pinu jest wstrzykiwany do
 * sondy pinu i porównany z kopią portu wartość po wartość.
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
const PIN_HEX = join(resolve(PIN_DIR), 'gra/src/types/hex.ts');
const PIN_UI_PARAMS = JSON.parse(readFileSync(join(resolve(PIN_DIR), 'gra/data/ui-params.json'), 'utf8'));
const pinLines = readFileSync(PIN_FILE, 'utf8').split('\n');
const pinHexLines = readFileSync(PIN_HEX, 'utf8').split('\n');

/** Blok najwyższego poziomu z pinu: od linii `function NAME`/`const NAME` do `}` (function) lub do `;` (const). */
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

const PIN_NAMES = ['ENTITY_CARD_BUILDING_STYLE_ID', 'TEREN_COL', 'TEREN_LETTER', 'hexDist', 'okolicaPreviewRadius', 'rangeName', 'ringsTiles', 'okStat'];
const pinEnum = pinHexLines.slice(11, 24).join('\n'); // types/hex.ts:12-24 (TerenBazowy)
const probeSrc = [
  `export const UI_PARAMS = ${JSON.stringify(PIN_UI_PARAMS)};`,
  pinEnum,
  ...PIN_NAMES.map(extractTop),
  '',
].join('\n');

const tmp = mkdtempSync(join(tmpdir(), 'p58k05a-harness-'));
const results = [];
let exitCode = 0;

/** Plugin: `../uiParams` w porcie → stub z JSON-em pinu (ten sam wejściowy zestaw parametrów po obu stronach). */
const uiParamsStub = {
  name: 'uiparams-stub',
  setup(build) {
    build.onResolve({ filter: /(^|\/)uiParams$/ }, (a) => ({ path: a.path, namespace: 'uistub' }));
    build.onLoad({ filter: /.*/, namespace: 'uistub' }, () => ({
      contents: `export const UI_PARAMS = ${JSON.stringify(PIN_UI_PARAMS)};`,
      loader: 'js',
    }));
  },
};

try {
  const pinProbe = join(tmp, 'pin-probe.ts');
  writeFileSync(pinProbe, probeSrc);
  await esbuild.build({ entryPoints: [pinProbe], outfile: join(tmp, 'pin.mjs'), bundle: true, format: 'esm', platform: 'node', target: 'es2022', logLevel: 'error' });
  await esbuild.build({ entryPoints: [V2_FILE], outfile: join(tmp, 'v2.mjs'), bundle: true, format: 'esm', platform: 'node', target: 'es2022', logLevel: 'error', plugins: [uiParamsStub] });
  const P = await import(pathToFileURL(join(tmp, 'pin.mjs')).href);
  const V = await import(pathToFileURL(join(tmp, 'v2.mjs')).href);

  const cmp = (name, fa, fb) => {
    let ra;
    let rb;
    try { ra = JSON.stringify(fa()); } catch (e) { ra = `THROW:${e.message}`; }
    try { rb = JSON.stringify(fb()); } catch (e) { rb = `THROW:${e.message}`; }
    results.push({ name, status: ra === rb ? 'OK' : 'ROZNICA', detail: ra === rb ? ra.slice(0, 80) : `pin=${ra} v2=${rb}` });
  };

  // Stałe i enum (wartości, nie tylko kształt).
  cmp('TerenBazowy (enum)', () => P.TerenBazowy, () => V.TerenBazowy);
  cmp('ENTITY_CARD_BUILDING_STYLE_ID', () => P.ENTITY_CARD_BUILDING_STYLE_ID, () => V.ENTITY_CARD_BUILDING_STYLE_ID);
  cmp('TEREN_COL', () => P.TEREN_COL, () => V.TEREN_COL);
  cmp('TEREN_LETTER', () => P.TEREN_LETTER, () => V.TEREN_LETTER);

  // Geometria i etykiety.
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

  // okolicaPreviewRadius: DTO pozycji miasta (q, r), Rwork, worked, reczne, tryb (K05A-Z2).
  const cities = [{ q: 0, r: 0 }, { q: 2, r: -1 }, { q: -3, r: 4 }];
  const rworks = [undefined, 0, 1, 2, 3, 5, 8];
  const workeds = [undefined, [], [{ q: 1, r: 0 }], [{ q: 4, r: -2 }, { q: -6, r: 1 }]];
  const recznes = [undefined, {}, { '1,0': 2 }, { '3,-3': 0, 'x,1': 4, '2,2': -1 }, { '5,5': 1 }, { '7,x': 3, '1,1': 1 }];
  const trybs = ['auto', 'reczny', 'x'];
  for (const c of cities)
    for (const Rw of rworks)
      for (const w of workeds)
        for (const rc of recznes)
          for (const t of trybs)
            cmp(
              `okolicaPreviewRadius(${c.q},${c.r};${Rw};${w ? w.length : 'u'};${rc ? Object.keys(rc).length : 'u'};${t})`,
              () => P.okolicaPreviewRadius(c, Rw, w, rc, t),
              () => V.okolicaPreviewRadius(c, Rw, w, rc, t),
            );
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
