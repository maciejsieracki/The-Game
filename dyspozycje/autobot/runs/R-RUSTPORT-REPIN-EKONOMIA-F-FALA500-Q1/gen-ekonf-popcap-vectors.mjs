// REPIN-EKONOMIA-F runda 3, partia 3: wektory `cityPopulationCap` (4 stopnie: Akwedukt 20 / Spichlerz II 12 /
// Spichlerz I 8 / brak 5; clamp = akweduktMax + 2) oraz `loadEconParams` (pola popcap) z URUCHOMIONEGO weba
// origin/main (gra/src/game/economy.ts bundlowany esbuildem, kod weba bez zmian).
// Uzycie: node gen-ekonf-popcap-vectors.mjs <WEB_ROOT (git archive origin/main gra/src gra/data)> <ESBUILD_MAIN_JS> <OUT.json>
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const [webRoot, esbuildMain, outFile] = process.argv.slice(2);
if (!webRoot || !esbuildMain || !outFile) throw new Error('uzycie: <WEB_ROOT> <ESBUILD_MAIN_JS> <OUT.json>');
const esbuild = await import(pathToFileURL(esbuildMain).href);
const game = join(webRoot, 'gra/src/game');
const bundleFile = join(webRoot, 'popcap-bundle.mjs');
await esbuild.build({
  stdin: {
    contents: `export { cityPopulationCap, loadEconParams } from './economy';`,
    resolveDir: game, loader: 'ts',
  },
  bundle: true, platform: 'node', format: 'esm', outfile: bundleFile, logLevel: 'error', loader: { '.json': 'json' },
});
const E = await import(pathToFileURL(bundleFile).href);

const num = (x) => {
  if (x === undefined) return null;
  if (Object.is(x, -0)) return '-0';
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  return String(x);
};

let seed = 0x5eed0b31;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];

const POOL = [0, -0, 1, -1, 2, 4, 5, 8, 10, 12, 14, 15, 20, 22, 24, 0.5, 4.999, 5.0000001, 11.999, 12.0001, 19.999, 20.0001, NaN, Infinity, -Infinity, -3.9];
const DELTAS = [-1, 0, 1, 2, 0.5, NaN, 3, -2, -0, 1.5, Infinity];
const cases = [];
// siatka kanoniczna: normal (5/8/12/20), wszystkie kombinacje budynkow i delt
for (const akw of [false, true]) for (const sp of [false, true]) for (const sp2 of [false, true]) for (const d of DELTAS) {
  const p = { akweduktProgLudnosci: 5, spichlerzProgLudnosci: 8, spichlerzIIProgLudnosci: 12, akweduktMaxLudnosci: 20 };
  cases.push({ akw, sp, sp2, delta: num(d), p: { akwProg: '5', spProg: '8', sp2Prog: '12', akwMax: '20' }, out: num(E.cityPopulationCap(akw, sp, p, d, sp2)) });
}
// losowe, takze brak spichlerzIIProgLudnosci (undefined -> spadek do spichlerzProgLudnosci) i niefinitowy akwMax
for (let i = 0; i < 800; i++) {
  const akwProg = pick(POOL), spProg = pick(POOL), akwMax = pick(POOL);
  const sp2Prog = rnd() < 0.3 ? undefined : pick(POOL);
  const akw = pick([true, false]), sp = pick([true, false]), sp2 = pick([true, false]);
  const d = pick(DELTAS);
  const p = { akweduktProgLudnosci: akwProg, spichlerzProgLudnosci: spProg, akweduktMaxLudnosci: akwMax };
  if (sp2Prog !== undefined) p.spichlerzIIProgLudnosci = sp2Prog;
  cases.push({ akw, sp, sp2, delta: num(d), p: { akwProg: num(akwProg), spProg: num(spProg), sp2Prog: num(sp2Prog), akwMax: num(akwMax) }, out: num(E.cityPopulationCap(akw, sp, p, d, sp2)) });
}
// loadEconParams: pola popcap, fallbacki (12 / 20) przy braku wiersza i przy realnym econ-params.json
const realEcon = (await import(pathToFileURL(join(game, '../../data/econ-params.json')).href, { with: { type: 'json' } })).default;
const loadCases = [];
for (const [name, raw] of [['real', realEcon], ['empty', {}], ['null-em', { ekonomia_miasta: null }], ['partial', { ekonomia_miasta: { akwedukt_max_ludnosci: { easy: 'x', normal: 17, hard: NaN } } }]]) {
  for (const diff of ['easy', 'normal', 'hard']) {
    const e = E.loadEconParams(raw, diff);
    loadCases.push({ name, raw: JSON.stringify(raw), diff, spProg: num(e.spichlerzProgLudnosci), sp2Prog: num(e.spichlerzIIProgLudnosci), akwMax: num(e.akweduktMaxLudnosci), akwProg: num(e.akweduktProgLudnosci) });
  }
}
// loadEconParams: te same wejscia (raw, difficulty) co wektory pinu z economy_city_vectors_r3_91dc998a.json,
// wyjscia z weba origin/main (pole spichlerzIIProgLudnosci, fallback akweduktMaxLudnosci 20).
import { readFileSync } from 'node:fs';
const r3Path = process.argv[5];
if (r3Path) {
  const r3 = JSON.parse(readFileSync(r3Path, 'utf8'));
  const outs = [];
  for (const v of r3.vectors) {
    if (v.fn !== 'loadEconParams') continue;
    const e = E.loadEconParams(v.in.raw, v.in.difficulty);
    const out = {};
    for (const k of Object.keys(e)) out[k] = num(e[k]);
    outs.push({ fn: 'loadEconParams', in: v.in, out });
  }
  writeFileSync(join(dirname(outFile), 'load_econ_params.json'), JSON.stringify({ pin: 'origin/main 16c0509f633a0c437ddf4fbdf1f41a38e109befc', source: 'wejscia z economy_city_vectors_r3_91dc998a.json', vectors: outs }));
  console.log('loadEconParams r3 inputs', outs.length);
}
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ pin: 'origin/main 16c0509f633a0c437ddf4fbdf1f41a38e109befc', cases, loadCases }));
console.log('cases', cases.length, 'load', loadCases.length);
