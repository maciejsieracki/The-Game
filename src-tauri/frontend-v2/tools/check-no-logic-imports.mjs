#!/usr/bin/env node
/**
 * check-no-logic-imports.mjs — mierzalna brama P5.1 (P5-0 §9 pkt 1, poprawiony regex).
 *
 * Reguła P5.13: frontend nie importuje logiki gry. Naruszenie = każdy specyfikator modułu
 * (statyczny `from '…'`, efekt uboczny `import '…'`, dynamiczny/inline-typ `import('…')`,
 * `export … from '…'`, `require('…')`, `import.meta.glob(…)`, `new URL('…', import.meta.url)`,
 * a w plikach `.html` także atrybuty `src=`/`href=`), który:
 *   [CORE]  — jest względny (`./`, `../`), aliasem `@/` albo ścieżką od korzenia (`/src/…`) i ma
 *             segment katalogu game|map|units|battle|render|data (łapie `../data/loader`,
 *             `../../data/*.json`), albo sam KOŃCZY SIĘ na takim katalogu (`'../game'` → `game/index`),
 *             albo jest pakietem `three`;
 *   [EXT]   — rozszerzenie P5.1: segment katalogu types|audio|perf|input|oblezenie|wonderpreview|util
 *             (katalogi `gra/src/**` ze stanem/silnikiem/narzędziami gry; ZAŁOŻENIA P5.1-Z6, Z10)
 *             oraz moduł `buildInfo` (`gra/src/buildInfo.ts`, P5-0 §3 — zbiór bezpośredni).
 *
 * R2 (zarzut 2 Evaluatora): skan CAŁEGO tekstu pliku zamiast linii — wieloliniowe `import(\n '…')`
 * i `from\n '…'` są łapane; numer linii = linia, w której stoi specyfikator.
 *
 * Użycie:
 *   node tools/check-no-logic-imports.mjs [ścieżka…=src] [--core-only]   → EXIT 0 gdy 0 trafień, 1 gdy >0
 *     (ścieżka = katalog skanowany rekurencyjnie albo pojedynczy plik, np. index.html)
 *   node tools/check-no-logic-imports.mjs --self-test                     → test reguł na próbkach
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, extname, resolve } from 'node:path';

const CORE_DIRS = new Set(['game', 'map', 'units', 'battle', 'render', 'data']);
const EXT_DIRS = new Set(['types', 'audio', 'perf', 'input', 'oblezenie', 'wonderpreview', 'util']);
const EXT_FILES = new Set(['buildInfo']);
const SCAN_EXT = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs', '.html', '.vue']);

// Specyfikatory: from '…' | import('…') | import '…' | require('…') | new URL('…'
// `\s*` obejmuje znaki nowej linii → formy wieloliniowe (skan całego tekstu).
const SPEC_RX =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*|\bnew\s+URL\s*\(\s*)(['"`])([^'"`\n]+)\1/g;
// import.meta.glob / globEager — argument może być tablicą wzorców.
const GLOB_RX = /\bimport\.meta\.glob(?:Eager)?\s*\(/g;
// HTML: <script src="…">, <link href="…">.
const HTML_ATTR_RX = /\b(?:src|href)\s*=\s*(['"])([^'"\n]+)\1/g;
const QUOTED_RX = /(['"`])([^'"`\n]+)\1/g;

function pathParts(clean) {
  let rest;
  if (clean.startsWith('./') || clean.startsWith('../')) rest = clean;
  else if (clean.startsWith('@/')) rest = clean.slice(2);
  else if (clean.startsWith('/')) rest = clean.slice(1).replace(/^src\//, '');
  else return null; // pakiety npm, URL-e — poza zakresem bramy
  return rest.split('/').filter((s) => s !== '' && s !== '.' && s !== '..');
}

const RESOLVE_EXT = ['', '.ts', '.tsx', '.mts', '.cts', '.d.ts', '.js', '.mjs', '.cjs', '.json'];

/** Czy względny specyfikator z pliku `fromFile` wskazuje istniejący PLIK (a nie katalog z `index`). */
function resolvesToFile(fromFile, clean) {
  if (!fromFile || !(clean.startsWith('./') || clean.startsWith('../'))) return false;
  const base = resolve(dirname(fromFile), clean);
  return RESOLVE_EXT.some((e) => existsSync(base + e) && statSync(base + e).isFile());
}

/** Zwraca etykietę naruszenia albo null. `fromFile` (opcjonalny) = plik importujący, do rozstrzygnięcia
 *  czy ostatni segment to plik (`entityCards/types.ts` ← `'./types'`) czy katalog (`'../types'` → `types/index`). */
export function classifySpecifier(spec, { coreOnly = false, fromFile = null } = {}) {
  const clean = spec.split('?')[0].split('#')[0];
  if (clean === 'three' || clean.startsWith('three/')) return 'CORE:three';
  const parts = pathParts(clean);
  if (parts === null || parts.length === 0) return null;
  const dirs = parts.slice(0, -1);
  const last = parts[parts.length - 1].replace(/\.[A-Za-z0-9]+$/, '');
  for (const s of dirs) {
    if (CORE_DIRS.has(s)) return `CORE:${s}`;
    if (!coreOnly && EXT_DIRS.has(s)) return `EXT:${s}`;
  }
  // Ostatni segment = katalog logiki rozwiązywany do `index` (`'../game'`, `'@/data'`, `'./units'`).
  // Tylko gdy stoi bezpośrednio po `./`/`../`/`@/`/`/src/` — `'../viewmodel/types'` to plik, nie katalog —
  // i gdy na dysku NIE rozwiązuje się do pliku obok importującego (`entityCards/types.ts` ← `'./types'`).
  // Brak pliku na dysku (np. próbka self-testu, katalog spoza projektu) = traktowane jako katalog → trafienie.
  if (dirs.length === 0 && !resolvesToFile(fromFile, clean)) {
    if (CORE_DIRS.has(last)) return `CORE:${last}`;
    if (!coreOnly && EXT_DIRS.has(last)) return `EXT:${last}`;
  }
  if (!coreOnly && EXT_FILES.has(last)) return `EXT:${last}`;
  return null;
}

function lineOf(text, index) {
  let n = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}

export function scanText(text, opts = {}) {
  const hits = [];
  const lines = text.split(/\r?\n/);
  const push = (spec, at) => {
    const label = classifySpecifier(spec, opts);
    if (!label) return;
    const line = lineOf(text, at);
    hits.push({ line, spec, label, text: (lines[line - 1] ?? '').trim() });
  };
  let m;
  SPEC_RX.lastIndex = 0;
  while ((m = SPEC_RX.exec(text)) !== null) push(m[2], m.index + m[0].length - m[2].length - 1);
  GLOB_RX.lastIndex = 0;
  while ((m = GLOB_RX.exec(text)) !== null) {
    const start = m.index + m[0].length;
    const end = text.indexOf(')', start);
    const arg = text.slice(start, end < 0 ? text.length : end);
    let q;
    QUOTED_RX.lastIndex = 0;
    while ((q = QUOTED_RX.exec(arg)) !== null) push(q[2], start + q.index);
  }
  if (opts.html) {
    HTML_ATTR_RX.lastIndex = 0;
    while ((m = HTML_ATTR_RX.exec(text)) !== null) push(m[2], m.index);
  }
  hits.sort((a, b) => a.line - b.line);
  return hits;
}

function walk(p, out = []) {
  const st = statSync(p);
  if (!st.isDirectory()) {
    if (SCAN_EXT.has(extname(p))) out.push(p);
    return out;
  }
  for (const name of readdirSync(p)) {
    if (name === 'node_modules' || name === 'dist') continue;
    walk(join(p, name), out);
  }
  return out;
}

function selfTest() {
  const must = [
    ["import { x } from '../game/production';", 'CORE:game'],
    ["import { loadGameData } from '../data/loader';", 'CORE:data'],
    ["import units from '../../data/units.json';", 'CORE:data'],
    ["type T = import('../game/research').EraGateInfo;", 'CORE:game'],
    ["export { validateTradeBasketSides } from '../game/diplomacy-trade-validation';", 'CORE:game'],
    ["import * as THREE from 'three';", 'CORE:three'],
    ["import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';", 'CORE:three'],
    ["import '../render/side-effect';", 'CORE:render'],
    ["const m = await import('../../map/mapGen');", 'CORE:map'],
    ["} from \"../units/unitCategory\";", 'CORE:units'],
    ["import { PB_SVG } from '../battle/battleHudTheme';", 'CORE:battle'],
    ["import type { City } from '../types/city';", 'EXT:types'],
    ["import { x } from './game/whatever';", 'CORE:game'],
    ["import { y } from '@/game/production';", 'CORE:game'],
    ["const z = require('../data/loader');", 'CORE:data'],
    // R2 — zarzut 2 Evaluatora:
    ["const m = import(\n  '../game/x');", 'CORE:game'],
    ["import {\n  a,\n  b,\n} from\n  '../data/loader';", 'CORE:data'],
    ["type E = import(\n  \"../game/research\"\n).EraGateInfo;", 'CORE:game'],
    ["import x from '../game';", 'CORE:game'],
    ["import y from '../../map';", 'CORE:map'],
    ["export * from './units';", 'CORE:units'],
    ["import z from '@/data';", 'CORE:data'],
    ["import { normPlLabel } from '../util/norm-pl-label';", 'EXT:util'],
    ["import { CIV_BUILD_STAMP } from '../buildInfo';", 'EXT:buildInfo'],
    ["import { CIV_BUILD_STAMP } from '../../buildInfo.ts';", 'EXT:buildInfo'],
    ["const g = import.meta.glob('../units/**/*.json', { eager: true });", 'CORE:units'],
    ["const g2 = import.meta.glob([\n  './icons/*.svg',\n  '../render/*.ts',\n]);", 'CORE:render'],
    ["const u = new URL('../data/units.json', import.meta.url);", 'CORE:data'],
  ];
  const mustHtml = [
    ['<script type="module" src="/src/game/boot.ts"></script>', 'CORE:game'],
    ['<script type="module">\n  import { a } from "./game/x";\n</script>', 'CORE:game'],
    ['<link rel="modulepreload" href="../data/loader.js">', 'CORE:data'],
  ];
  const mustNot = [
    "import { signedPl } from './formatPl';",
    "import css from './icons/brand/tokens.css?raw';",
    "import type { CityGrowthDto } from '../viewmodel/types';",
    "import { createController } from './controller';",
    "import { defineConfig } from 'vite';",
    "import { x } from './ui/gameplayHints';",
    "import data from './datatable';",
    "import { x } from './gameplayHints';",
    "import { m } from './minimap';",
    "import u from './utilities';",
    "import { y } from './ui/sideListHud.css';",
  ];
  const mustNotHtml = ['<script type="module" src="/src/main.ts"></script>', '<a href="https://example.org/game/x">'];
  let fail = 0;
  const check = (src, want, opts) => {
    const h = scanText(src, opts);
    if (want === null ? h.length !== 0 : h.length !== 1 || h[0].label !== want) {
      fail++;
      console.error(
        `SELF-TEST FAIL (${want === null ? 'fałszywe trafienie' : `powinno złapać ${want}`}): ${JSON.stringify(src)} → ${JSON.stringify(h)}`,
      );
    }
  };
  for (const [src, want] of must) check(src, want, {});
  for (const [src, want] of mustHtml) check(src, want, { html: true });
  for (const src of mustNot) check(src, null, {});
  for (const src of mustNotHtml) check(src, null, { html: true });
  const core = scanText("import type { City } from '../types/city';", { coreOnly: true });
  if (core.length !== 0) {
    fail++;
    console.error('SELF-TEST FAIL: --core-only nie powinien łapać EXT');
  }
  // Numer linii wieloliniowego importu = linia specyfikatora.
  const ml = scanText("const a = 1;\nconst m = import(\n  '../game/x');");
  if (ml.length !== 1 || ml[0].line !== 3) {
    fail++;
    console.error(`SELF-TEST FAIL: numer linii wieloliniowego importu → ${JSON.stringify(ml)}`);
  }
  // Rozstrzyganie plik vs katalog na dysku: `'./types'` → istniejący plik `ent/types.ts` (czyste),
  // `'../types'` → katalog `types/` (EXT), `'../game'` → brak pliku `game.ts` (CORE).
  const tmp = mkdtempSync(join(tmpdir(), 'p51-gate-'));
  try {
    mkdirSync(join(tmp, 'ent'));
    mkdirSync(join(tmp, 'types'));
    writeFileSync(join(tmp, 'ent', 'types.ts'), 'export type T = 1;\n');
    const from = join(tmp, 'ent', 'a.ts');
    const fsCases = [
      ["import type { T } from './types';", null],
      ["import type { City } from '../types';", 'EXT:types'],
      ["import { x } from '../game';", 'CORE:game'],
    ];
    for (const [src, want] of fsCases) {
      const h = scanText(src, { fromFile: from });
      if (want === null ? h.length !== 0 : h.length !== 1 || h[0].label !== want) {
        fail++;
        console.error(`SELF-TEST FAIL (plik/katalog na dysku, oczekiwane ${want}): ${src} → ${JSON.stringify(h)}`);
      }
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  const pos = must.length + mustHtml.length + 2;
  const neg = mustNot.length + mustNotHtml.length + 1 + 1;
  console.log(`self-test: ${pos} pozytywnych, ${neg} negatywnych, 1 test numeru linii, błędów: ${fail}`);
  return fail === 0 ? 0 : 1;
}

function main(argv) {
  if (argv.includes('--self-test')) return selfTest();
  const coreOnly = argv.includes('--core-only');
  const targets = argv.filter((a) => !a.startsWith('--'));
  if (targets.length === 0) targets.push('src');
  const files = [...new Set(targets.flatMap((t) => walk(t)))].sort();
  let total = 0;
  const byLabel = {};
  const hitFiles = new Set();
  for (const f of files) {
    const rel = relative(process.cwd(), f);
    const shown = rel.startsWith('..') ? f : rel;
    const html = extname(f) === '.html';
    for (const h of scanText(readFileSync(f, 'utf8'), { coreOnly, html, fromFile: f })) {
      total++;
      hitFiles.add(f);
      byLabel[h.label] = (byLabel[h.label] ?? 0) + 1;
      console.log(`${shown}:${h.line}: [${h.label}] ${h.text}`);
    }
  }
  console.log(
    `check-no-logic-imports: cele=${targets.join(',')} plików=${files.length} plików_z_trafieniami=${hitFiles.size} trafień=${total}` +
      (coreOnly ? ' (tylko CORE)' : '') +
      (total ? ` ${JSON.stringify(byLabel)}` : ''),
  );
  return total === 0 ? 0 : 1;
}

process.exitCode = main(process.argv.slice(2));
