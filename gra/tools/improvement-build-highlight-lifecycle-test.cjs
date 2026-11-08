'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
let highlightSource = fs.readFileSync(path.join(ROOT, 'src/render/buildHighlight.ts'), 'utf8');
if (process.env.HIGHLIGHT_MUTATION === 'keep-pending') {
  const before = highlightSource;
  highlightSource = highlightSource.replace(
    'return hexes.filter(({ q, r }) => !pendingUndoKeys.has(`${q},${r}:${improvementKey}`));',
    'return [...hexes];',
  );
  if (highlightSource === before) throw new Error('mutation anchor missing');
}
const bundle = esbuild.buildSync({
  stdin: {
    contents: `
      ${highlightSource}
      import { IMPROVEMENTS } from './src/render/improvements';
      export const highlight = {
        MAP_HEX_HIGHLIGHT_BASE_OPACITY,
        MINE_ELIGIBLE_BASE_OPACITY,
        IMPROVEMENT_BUILD_HIGHLIGHT_BRIGHTNESS,
        IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY,
        MINE_BUILD_HIGHLIGHT_OPACITY,
        filterBuildHighlightHexes,
      };
      export { IMPROVEMENTS };
    `,
    resolveDir: ROOT,
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  absWorkingDir: ROOT,
  loader: { '.ts': 'ts', '.json': 'json' },
}).outputFiles[0].text;
const loaded = { exports: {} };
new Function('module', 'exports', 'require', bundle)(loaded, loaded.exports, require);
const { IMPROVEMENTS, highlight } = loaded.exports;
const { filterBuildHighlightHexes } = highlight;

let passed = 0;
function check(name, condition, detail) {
  assert.ok(condition, name + (detail === undefined ? '' : `: ${JSON.stringify(detail)}`));
  passed++;
}

check('jasność podbija alfę o dokładnie 20% względnie', highlight.IMPROVEMENT_BUILD_HIGHLIGHT_BRIGHTNESS === 1.2);
check('zwykły highlight bazowy pozostaje 0.35', highlight.MAP_HEX_HIGHLIGHT_BASE_OPACITY === 0.35);
check('zwykłe ulepszenia dostają opacity 0.42', highlight.IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY === 0.42);
check('kopalnie zachowują bazę 0.30', highlight.MINE_ELIGIBLE_BASE_OPACITY === 0.3);
check('kopalnie dostają opacity 0.36', highlight.MINE_BUILD_HIGHLIGHT_OPACITY === 0.36);

const hexes = [{ q: 4, r: 8 }, { q: 5, r: 8 }, { q: -2, r: 3 }];
const inputCopy = structuredClone(hexes);
const pending = new Set(['4,8:farma', '5,8:kopalnia_miedzi']);
check('wybudowane pole farma wykluczone z podświetlenia',
  filterBuildHighlightHexes('farma', hexes, pending).map(h => `${h.q},${h.r}`).join('|') === '5,8|-2,3');
check('wpis undo dla innego ulepszenia nie ukrywa kandydata',
  filterBuildHighlightHexes('farma', hexes, new Set(['4,8:kopalnia_miedzi'])).length === 3);
check('inne niezbudowane pole pozostaje podświetlone',
  filterBuildHighlightHexes('farma', hexes, pending).some(h => h.q === 5 && h.r === 8));
check('filtrowanie nie mutuje listy kwalifikujących pól', JSON.stringify(hexes) === JSON.stringify(inputCopy));
check('brak pending zachowuje wszystkie kwalifikujące heksy',
  filterBuildHighlightHexes('farma', hexes, new Set()).length === hexes.length);

for (const { key } of IMPROVEMENTS) {
  const pendingKey = `4,8:${key}`;
  const visible = filterBuildHighlightHexes(key, hexes, new Set([pendingKey]));
  check(`pending build ukrywany dla ulepszenia ${key}`,
    !visible.some(h => h.q === 4 && h.r === 8) && visible.length === 2);
}

const main = fs.readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
const unitRenderer = fs.readFileSync(path.join(ROOT, 'src/render/units.ts'), 'utf8');
const range = fs.readFileSync(path.join(ROOT, 'src/render/rangeOverlay.ts'), 'utf8');
const highlightBodyStart = main.indexOf('function refreshBuildHighlight(): void {');
const highlightBodyEnd = main.indexOf('\n    }', highlightBodyStart);
const refreshBody = main.slice(highlightBodyStart, highlightBodyEnd);
check('refreshBuildHighlight filtruje pending przed renderowaniem',
  /filterBuildHighlightHexes\(/.test(refreshBody) && /getUndoKeySet\(\)/.test(refreshBody));
check('zwykły highlight budowania przekazuje jaśniejszą alfę',
  /unitRenderer\.setHighlight\([\s\S]*?IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY/.test(refreshBody));
check('kopalnia zastępuje styl overlay opacity 0.36',
  /tintOpacity:\s*MINE_BUILD_HIGHLIGHT_OPACITY/.test(main));
check('setHighlight zachowuje domyślną alfę, a dopuszcza jasność budowy',
  /setHighlight\(hexes: Set<string>, opacity = HIGHLIGHT_OPACITY\)/.test(unitRenderer)
    && /opacity,/.test(unitRenderer));
check('styl kopalni czyta wspólny build opacity',
  /MINE_ELIGIBLE_TINT_OPACITY\s*=\s*MINE_BUILD_HIGHLIGHT_OPACITY/.test(range));

const commitStart = main.indexOf('function commitBuildRequest(');
const commitEnd = main.indexOf('\n    }', commitStart);
const commitBody = main.slice(commitStart, commitEnd);
const pendingAt = commitBody.indexOf('pendingImprovementsTurn.add(');
const refreshAt = commitBody.indexOf('refreshBuildHighlight();');
check('udana budowa rejestruje pending przed natychmiastowym refresh overlay',
  pendingAt >= 0 && refreshAt > pendingAt);

if (!process.env.HIGHLIGHT_MUTATION) {
  const mutation = spawnSync(process.execPath, [__filename], {
    cwd: process.cwd(),
    env: { ...process.env, HIGHLIGHT_MUTATION: 'keep-pending' },
    encoding: 'utf8',
  });
  const mutationOutput = `${mutation.stdout || ''}\n${mutation.stderr || ''}`;
  check('mutacja usunięcia filtra pending czerwieni bramkę',
    mutation.status !== 0 && /wybudowane pole farma wykluczone z podświetlenia/.test(mutationOutput));
}

console.log(`\n${passed} passed, 0 failed`);
