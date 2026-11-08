// REPIN-EKONOMIA-F runda 5 (zarzut FC r4 Z5): przywrocenie asercji `cityPopulationCap` w tests/economy_city_vectors.rs.
// Te same 400 wejsc co w pinowanej fixturze `economy_city_vectors_91dc998a.json` (fn == cityPopulationCap), wyjscia
// z URUCHOMIONEGO weba origin/main (`economy.ts` bundlowany esbuildem, kod weba bez zmian; `maSpichlerzII` domyslnie false,
// `spichlerzIIProgLudnosci` nieobecne - jak w oryginalnym generatorze pinu).
// Uzycie: node gen-ekonf-popcap-pinned-inputs.mjs <WEB_ROOT> <ESBUILD_MAIN_JS> <PIN> <FIXTURE_91dc998a.json> <OUT.json>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const [webRoot, esbuildMain, pin, fixture, outFile] = process.argv.slice(2);
if (!webRoot || !esbuildMain || !pin || !fixture || !outFile) throw new Error('uzycie: <WEB_ROOT> <ESBUILD_MAIN_JS> <PIN> <FIXTURE> <OUT.json>');
const esbuild = await import(pathToFileURL(esbuildMain).href);
const game = join(webRoot, 'gra/src/game');
const bundleFile = join(webRoot, 'popcap-pinned-bundle.mjs');
await esbuild.build({
  stdin: { contents: `export { cityPopulationCap } from './economy';`, resolveDir: game, loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', outfile: bundleFile, logLevel: 'error', loader: { '.json': 'json' },
});
const E = await import(pathToFileURL(bundleFile).href);

const dec = (s) => {
  if (s === 'NaN') return NaN;
  if (s === 'Infinity') return Infinity;
  if (s === '-Infinity') return -Infinity;
  if (s === '-0') return -0;
  return Number(s);
};
const enc = (x) => (Object.is(x, -0) ? '-0' : String(x));

const fx = JSON.parse(readFileSync(fixture, 'utf8'));
const vectors = [];
let changed = 0;
for (const v of fx.vectors) {
  if (v.fn !== 'cityPopulationCap') continue;
  const i = v.in;
  const params = { akweduktProgLudnosci: dec(i.akwProg), spichlerzProgLudnosci: dec(i.spProg), akweduktMaxLudnosci: dec(i.akwMax) };
  const out = enc(E.cityPopulationCap(i.akw, i.sp, params, dec(i.delta)));
  if (out !== v.out) changed++;
  vectors.push({ in: i, out });
}
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ pin, source: 'wejscia: tests/fixtures/economy_city_vectors_91dc998a.json (cityPopulationCap); wyjscia: web origin/main economy.ts', vectors }) + '\n');
console.log('vectors', vectors.length, 'zmienione wzgledem pinu 91dc998a:', changed);
