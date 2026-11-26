'use strict';
/**
 * R-WEB-MAP-RIVER-TIERS-RECON-Q1 (runda 3) — pomiar liczby rzek / źródeł / czasu generowania.
 * ZERO zmian w repo gry: skrypt kopiuje gra/src + gra/data do katalogu SCRATCH, tam nakłada
 * jednoliniowy override (env RIVER_CELL w resolveRiverMapParams) i bundluje esbuildem.
 *
 * Użycie (z korzenia repo; esbuild wymagany w SCRATCH/node_modules lub gra/node_modules):
 *   node dyspozycje/analizy/river-count-measure-2x.cjs prepare <SCRATCH>
 *   node <SCRATCH>/measure-one.cjs <w> <h> <seed> <cell|base> <phase main+medium|all> [kind=kontynenty|ziemia|pangea|wyspy]
 * Równolegle (4 rdzenie), np.:
 *   printf '%s\n' "84 60 1" "84 60 7" | xargs -P4 -L1 sh -c 'node <SCRATCH>/measure-one.cjs $0 $1 $2 3.5 main+medium'
 * Wynik: jedna linia JSON na mapę (kind-y, hexy, źródła main, widoczne domyślnie, ms).
 * Podwojenie źródeł = zmniejszenie boku komórki siatki z 5 do 3.5 (5/√2); cell=base = stan obecny.
 * Opcjonalnie: prepare <SCRATCH> --rivmouth <ścieżka do gen-helpers.ts z bde050bcf> podmienia gen-helpers
 * (UWAGA: do cherry-picku używać łatki diff, nie całego pliku — patrz dokument, sekcja 4).
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const MEASURE_ONE = `'use strict';
const path = require('path');
const [, , W, H, SEED, CELL, PHASE, KIND] = process.argv;
if (CELL && CELL !== 'base') process.env.RIVER_CELL = CELL;
const M = require(path.join(__dirname, 'bundle.cjs'));
M.setRiverGenPhaseOverride(PHASE || 'main+medium');
const w = +W, h = +H, seed = +SEED, kind = KIND || 'kontynenty';
const t0 = Date.now();
const map = M.generateMap(w, h, seed, kind, {
  mapSizeMenuLabel: 'Standardowy',
  worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
});
const ms = Date.now() - t0;
const out = { w, h, seed, kind, cell: CELL || 'base', phase: PHASE || 'main+medium', ms,
  kinds: {}, hex: {}, total: map.riverPaths.length };
map.riverPaths.forEach((p, i) => {
  const k = map.riverPathKinds ? map.riverPathKinds[i] : '?';
  out.kinds[k] = (out.kinds[k] || 0) + 1;
  out.hex[k] = (out.hex[k] || 0) + p.length;
});
out.visibleDefault = (out.kinds.main || 0) + (out.kinds.medium || 0);
out.sources = out.kinds.main || 0;
let adj = 0;
for (const p of map.riverPaths) if (!M.assertRiverPathAdjacent(p)) adj++;
out.nonAdjacentPaths = adj;
console.log(JSON.stringify(out));
`;

function prepare(scratch) {
  const root = path.resolve(__dirname, '..', '..');
  fs.mkdirSync(scratch, { recursive: true });
  fs.cpSync(path.join(root, 'gra', 'src'), path.join(scratch, 'src'), { recursive: true });
  fs.cpSync(path.join(root, 'gra', 'data'), path.join(scratch, 'data'), { recursive: true });
  fs.copyFileSync(path.join(root, 'gra', 'tsconfig.json'), path.join(scratch, 'tsconfig.json'));
  const p = path.join(scratch, 'src', 'map', 'newGameMapDefaults.ts');
  let s = fs.readFileSync(p, 'utf8');
  const from = '  const mainCell = riverGridCellSizeForTier(tier);\n';
  if (!s.includes(from)) throw new Error('override: nie znaleziono linii mainCell');
  s = s.replace(from,
    "  const mainCell = (typeof process !== 'undefined' && process.env && process.env.RIVER_CELL) ? Number(process.env.RIVER_CELL) : riverGridCellSizeForTier(tier);\n");
  fs.writeFileSync(p, s);
  // Override odstępu głównych nurtów (env RIVER_PATHSEP; domyślnie 3 = stan repo).
  const gh = path.join(scratch, 'src', 'map', 'gen-helpers.ts');
  let g = fs.readFileSync(gh, 'utf8');
  const gFrom = 'export const MAIN_RIVER_MIN_PATH_SEP = 3;';
  if (!g.includes(gFrom)) throw new Error('override: nie znaleziono MAIN_RIVER_MIN_PATH_SEP');
  g = g.replace(gFrom,
    "export const MAIN_RIVER_MIN_PATH_SEP = (typeof process !== 'undefined' && process.env && process.env.RIVER_PATHSEP) ? Number(process.env.RIVER_PATHSEP) : 3;");
  fs.writeFileSync(gh, g);
  const ri = process.argv.indexOf('--rivmouth');
  if (ri > 0) fs.copyFileSync(process.argv[ri + 1], path.join(scratch, 'src', 'map', 'gen-helpers.ts'));
  fs.writeFileSync(path.join(scratch, 'entry.ts'),
    "export { generateMap } from './src/map/generator';\nexport { assertRiverPathAdjacent } from './src/map/gen-helpers';\nexport { setRiverGenPhaseOverride } from './src/map/riverGenSwitch';\n");
  fs.writeFileSync(path.join(scratch, 'measure-one.cjs'), MEASURE_ONE);
  const esbuild = require(path.join(scratch, 'node_modules', 'esbuild'));
  esbuild.buildSync({
    entryPoints: [path.join(scratch, 'entry.ts')], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: path.join(scratch, 'bundle.cjs'), logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
  console.log('prepared', scratch);
}

if (process.argv[2] === 'prepare') prepare(path.resolve(process.argv[3]));
else console.error('Użycie: prepare <SCRATCH> [--rivmouth <gen-helpers.ts>]');
