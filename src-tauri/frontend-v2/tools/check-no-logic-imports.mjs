#!/usr/bin/env node
/**
 * check-no-logic-imports.mjs — mierzalna brama P5.1 (P5-0 §9 pkt 1, poprawiony regex).
 *
 * Reguła P5.13: frontend nie importuje logiki gry. Naruszenie = każdy specyfikator modułu
 * (statyczny `from '…'`, efekt uboczny `import '…'`, dynamiczny/inline-typ `import('…')`,
 * `export … from '…'`, `require('…')`), który:
 *   [CORE]  — jest względny i ma segment katalogu game|map|units|battle|render|data
 *             (łapie `../data/loader` i `../../data/*.json`, P5-0 §9 zarzut 1), albo jest pakietem `three`;
 *   [EXT]   — rozszerzenie P5.1: segment katalogu types|audio|perf|input|oblezenie|wonderpreview
 *             (katalogi `gra/src/**` ze stanem/silnikiem gry; ZAŁOŻENIE P5.1-Z6) lub alias `@/` do nich.
 * Wynik liczony per wystąpienie w linii (jak `git grep -n`), więc wieloliniowy import liczy się raz
 * (linia ze słowem `from`).
 *
 * Użycie:
 *   node tools/check-no-logic-imports.mjs [katalog=src] [--core-only]   → EXIT 0 gdy 0 trafień, 1 gdy >0
 *   node tools/check-no-logic-imports.mjs --self-test                    → test reguł na próbkach
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const CORE_DIRS = new Set(['game', 'map', 'units', 'battle', 'render', 'data']);
const EXT_DIRS = new Set(['types', 'audio', 'perf', 'input', 'oblezenie', 'wonderpreview']);
const SCAN_EXT = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs', '.html', '.vue']);

// Specyfikatory w jednej linii: from '…' | import '…' | import('…') | require('…')
const SPEC_RX = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"`])([^'"`\n]+)\1/g;

/** Zwraca etykietę naruszenia albo null. */
export function classifySpecifier(spec, { coreOnly = false } = {}) {
  const clean = spec.split('?')[0];
  if (clean === 'three' || clean.startsWith('three/')) return 'CORE:three';
  let segs;
  if (clean.startsWith('./') || clean.startsWith('../')) {
    segs = clean.split('/').slice(0, -1).filter((s) => s !== '.' && s !== '..');
  } else if (clean.startsWith('@/')) {
    segs = clean.slice(2).split('/').slice(0, -1);
  } else {
    return null; // inne pakiety npm — poza zakresem bramy
  }
  for (const s of segs) {
    if (CORE_DIRS.has(s)) return `CORE:${s}`;
    if (!coreOnly && EXT_DIRS.has(s)) return `EXT:${s}`;
  }
  return null;
}

export function scanText(text, opts = {}) {
  const hits = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    SPEC_RX.lastIndex = 0;
    let m;
    while ((m = SPEC_RX.exec(line)) !== null) {
      const label = classifySpecifier(m[2], opts);
      if (label) hits.push({ line: i + 1, spec: m[2], label, text: line.trim() });
    }
  });
  return hits;
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (SCAN_EXT.has(extname(name))) out.push(p);
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
  ];
  const mustNot = [
    "import { signedPl } from './formatPl';",
    "import css from './icons/brand/tokens.css?raw';",
    "import type { CityGrowthDto } from '../viewmodel/types';",
    "import { createController } from './controller';",
    "import { defineConfig } from 'vite';",
    "import { x } from './ui/gameplayHints';",
    "import data from './datatable';",
  ];
  let fail = 0;
  for (const [src, want] of must) {
    const h = scanText(src);
    if (h.length !== 1 || h[0].label !== want) {
      fail++;
      console.error(`SELF-TEST FAIL (powinno złapać ${want}): ${src} → ${JSON.stringify(h)}`);
    }
  }
  for (const src of mustNot) {
    const h = scanText(src);
    if (h.length !== 0) {
      fail++;
      console.error(`SELF-TEST FAIL (fałszywe trafienie): ${src} → ${JSON.stringify(h)}`);
    }
  }
  const core = scanText("import type { City } from '../types/city';", { coreOnly: true });
  if (core.length !== 0) {
    fail++;
    console.error('SELF-TEST FAIL: --core-only nie powinien łapać EXT');
  }
  console.log(`self-test: ${must.length} pozytywnych, ${mustNot.length + 1} negatywnych, błędów: ${fail}`);
  return fail === 0 ? 0 : 1;
}

function main(argv) {
  if (argv.includes('--self-test')) return selfTest();
  const coreOnly = argv.includes('--core-only');
  const dir = argv.find((a) => !a.startsWith('--')) ?? 'src';
  const files = walk(dir).sort();
  let total = 0;
  const byLabel = {};
  const hitFiles = new Set();
  for (const f of files) {
    const rel = relative(process.cwd(), f);
    const shown = rel.startsWith('..') ? f : rel;
    for (const h of scanText(readFileSync(f, 'utf8'), { coreOnly })) {
      total++;
      hitFiles.add(f);
      byLabel[h.label] = (byLabel[h.label] ?? 0) + 1;
      console.log(`${shown}:${h.line}: [${h.label}] ${h.text}`);
    }
  }
  console.log(
    `check-no-logic-imports: katalog=${dir} plików=${files.length} plików_z_trafieniami=${hitFiles.size} trafień=${total}` +
      (coreOnly ? ' (tylko CORE)' : '') +
      (total ? ` ${JSON.stringify(byLabel)}` : ''),
  );
  return total === 0 ? 0 : 1;
}

process.exitCode = main(process.argv.slice(2));
