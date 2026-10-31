// P6.8I partia relief: generuje wektory z PINA 91dc998a (transpilacja TS->JS w pamieci, bez buildu gra/).
// Uzycie (wymaga typescript w NODE_PATH):
//   NODE_PATH=/opt/node22/lib/node_modules node dyspozycje/autobot/runs/R-RUSTPORT-P6-8I-AUTO-ULEPSZENIA-Q1/gen-p6-8i-relief-vectors.mjs
// Wyjscie: rust-port/engine/tests/p6_8i_vectors/relief.json (sciezka wzgledem katalogu repo).
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PIN = '91dc998a';
const SRC = 'gra/src/game/relief-preserving-improvements.ts';
const here = dirname(fileURLToPath(import.meta.url));
const repo = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: here, encoding: 'utf8' }).trim();
const ts = createRequire(import.meta.url)('typescript');
const tsSource = execFileSync('git', ['show', `${PIN}:${SRC}`], { cwd: repo, encoding: 'utf8' });
const js = ts.transpileModule(tsSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exportsObj = {};
new Function('exports', js)(exportsObj);
const { preservesHillReliefKey, preservesHillRelief } = exportsObj;

const KEYS = [
  'bydlo', 'owce', 'lama', 'kamieniolom', 'tartak', 'farma', 'wyrab', 'droga', 'glinianka', 'fort',
  'kopalnia', 'kopalnia_', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_cyny', 'kopalnia_zlota',
  'kopalnia_wegla', 'niekopalnia', 'kopalniany', 'Kopalnia_miedzi', 'KOPALNIA', 'kopalnia-miedzi',
  'kopalnia miedzi', ' bydlo', 'bydlo ', 'Bydlo', 'owca', '', 'kamieniolo', 'tartaki', 'stadnina',
  'oboz_lowiecki', 'kopalnia_żółta', 'kopalnia_miedzi',
];
const LAYERS = [
  [], ['bydlo'], ['owce'], ['lama', 'kamieniolom'], ['tartak'], ['farma'], ['farma', 'bydlo'],
  ['kopalnia_miedzi', 'kopalnia_cyny'], ['kopalnia', 'tartak'], ['kopalnia_zlota', 'farma'],
  ['bydlo', 'bydlo'], ['kopalnia'], ['kopalnia_', 'lama'], ['niekopalnia'], [''], ['wyrab', 'droga'],
];

const out = {
  pin: PIN,
  source: SRC,
  keyCases: KEYS.map(k => ({ key: k, expected: preservesHillReliefKey(k) })),
  layerCases: LAYERS.map(l => ({ layers: l, expected: preservesHillRelief(l) })),
};
const dest = join(repo, 'rust-port/engine/tests/p6_8i_vectors');
mkdirSync(dest, { recursive: true });
writeFileSync(join(dest, 'relief.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`keys=${out.keyCases.length} layers=${out.layerCases.length}`);
