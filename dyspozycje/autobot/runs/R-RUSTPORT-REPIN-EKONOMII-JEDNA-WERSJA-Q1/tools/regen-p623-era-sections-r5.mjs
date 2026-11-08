// r5, czesc D: przelicza z URUCHOMIONEGO weba (hybrid2 = 331ef699b + terrain-improvements.ts z origin/main 247f1ef2a) WYLACZNIE
// pole `out` dwoch sekcji `tests/p6_23_vectors/improvements.json`: `resourceProductionAmountForEra` i
// `territoryResourceYieldForImprovement` (wejscia zostaja te same; kodowanie jak `enc` w gen-p623-vectors.mjs).
// Reszta pliku bez zmian (pozostale funkcje nie zmienily sie miedzy 4bbef081d a origin/main).
// Uzycie: node regen-p623-era-sections-r5.mjs <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <IMPROVEMENTS_JSON> <WEB_REF>
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [repoRoot, workDir, esbuildMain, jsonPath, webRef] = process.argv.slice(2);
if (!repoRoot || !workDir || !esbuildMain || !jsonPath || !webRef) throw new Error('uzycie: <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <IMPROVEMENTS_JSON> <WEB_REF>');
const PIN = execFileSync('git', ['-C', repoRoot, 'rev-parse', webRef], { encoding: 'utf8' }).trim();
rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });
execFileSync('git', ['-C', repoRoot, 'archive', '-o', join(workDir, 'pin.tar'), PIN, 'gra/src', 'gra/data']);
execFileSync('tar', ['-xf', join(workDir, 'pin.tar'), '-C', workDir]);
const game = join(workDir, 'gra/src/game');
const esbuild = await import(pathToFileURL(esbuildMain).href);
const built = await esbuild.build({
  stdin: { contents: "export { resourceProductionAmountForEra, territoryResourceYieldForImprovement } from './terrain-improvements';", resolveDir: game, loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', loader: { '.json': 'json', '.png': 'dataurl' },
});
const bundle = join(workDir, 'bundle.mjs');
writeFileSync(bundle, built.outputFiles[0].text);
const W = await import(pathToFileURL(bundle).href);

function enc(v) {
  if (v === undefined) return undefined;
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return { $n: 'NaN' };
    if (v === Infinity) return { $n: 'Infinity' };
    if (v === -Infinity) return { $n: '-Infinity' };
    if (Object.is(v, -0)) return { $n: '-0' };
    return v;
  }
  if (v instanceof Set) return { $set: [...v].map(enc) };
  if (v instanceof Map) return { $map: [...v.entries()].map(([k, x]) => [enc(k), enc(x)]) };
  if (Array.isArray(v)) return v.map((x) => (x === undefined ? { $u: 1 } : enc(x)));
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) {
      const e = enc(x);
      if (e !== undefined) o[k] = e;
    }
    return o;
  }
  return v;
}
function dec(v) {
  if (v && typeof v === 'object' && !Array.isArray(v) && typeof v.$n === 'string') {
    return v.$n === 'NaN' ? NaN : v.$n === 'Infinity' ? Infinity : v.$n === '-Infinity' ? -Infinity : -0;
  }
  return v;
}

const doc = JSON.parse(readFileSync(jsonPath, 'utf8'));
let changed = 0;
let total = 0;
for (const c of doc.cases.resourceProductionAmountForEra) {
  const out = enc(W.resourceProductionAmountForEra(dec(c.key), dec(c.base), 'era' in c ? dec(c.era) : undefined));
  total++;
  if (JSON.stringify(out) !== JSON.stringify(c.out)) { c.out = out; changed++; }
}
let changedT = 0;
let totalT = 0;
for (const c of doc.cases.territoryResourceYieldForImprovement) {
  const out = enc(W.territoryResourceYieldForImprovement(dec(c.key), 'zloze' in c ? dec(c.zloze) : undefined, 'era' in c ? dec(c.era) : undefined));
  totalT++;
  if (JSON.stringify(out) !== JSON.stringify(c.out)) { c.out = out; changedT++; }
}
doc.meta.regen_era_sections = { pin_web: PIN, sekcje: ['resourceProductionAmountForEra', 'territoryResourceYieldForImprovement'], generator: 'regen-p623-era-sections-r5.mjs' };
writeFileSync(jsonPath, JSON.stringify(doc));
console.log('resourceProductionAmountForEra', changed, '/', total, 'territoryResourceYieldForImprovement', changedT, '/', totalT, 'pin', PIN);
