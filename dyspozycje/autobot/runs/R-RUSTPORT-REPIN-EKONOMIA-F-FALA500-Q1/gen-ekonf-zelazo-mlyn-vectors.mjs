// REPIN-EKONOMIA-F runda 5, poz. 4: wektory z URUCHOMIONEGO weba origin/main (kod weba bundlowany esbuildem, bez zmian):
//  - zelazo-access.ts: hasZelazoAccess, ownerHasNativeZelazoAccess (R-WEB-IRON-NATIVE-ACCESS-FIX-Q1)
//  - diplomacy-goods.ts: sumCitySurowce (citySurowceSumForOwner, main.ts:3485)
//  - production.ts: availableProduction + bramka Mlyna `RIVER_ONLY_BUILDING_IDS` / `ctx.cityHasRiver` (R-WEB-MILL-RIVER-ONLY-GATE-Q1)
// Uzycie: node gen-ekonf-zelazo-mlyn-vectors.mjs <WEB_ROOT (git archive origin/main gra/src gra/data)> <ESBUILD_MAIN_JS> <PIN> <OUT.json>
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const [webRoot, esbuildMain, pin, outFile] = process.argv.slice(2);
if (!webRoot || !esbuildMain || !pin || !outFile) throw new Error('uzycie: <WEB_ROOT> <ESBUILD_MAIN_JS> <PIN> <OUT.json>');
const esbuild = await import(pathToFileURL(esbuildMain).href);
const game = join(webRoot, 'gra/src/game');
const bundleFile = join(webRoot, 'zelazo-mlyn-bundle.mjs');
await esbuild.build({
  stdin: {
    contents: `export { hasZelazoAccess, ownerHasNativeZelazoAccess } from './zelazo-access';
export { sumCitySurowce } from './diplomacy-goods';
export { availableProduction } from './production';`,
    resolveDir: game, loader: 'ts',
  },
  bundle: true, platform: 'node', format: 'esm', outfile: bundleFile, logLevel: 'error', loader: { '.json': 'json' },
});
const W = await import(pathToFileURL(bundleFile).href);

const num = (x) => {
  if (x === undefined) return null;
  if (Object.is(x, -0)) return '-0';
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  return x;
};
// stan zapasu: undefined -> null, rekord liczb -> {klucz: liczba|napis}
const encStock = (s) => (s === undefined ? null : Object.fromEntries(Object.entries(s).map(([k, v]) => [k, num(v)])));

const STOCKS = [
  undefined, {}, { zelazo: 0 }, { zelazo: -1 }, { zelazo: 0.0001 }, { zelazo: 1 }, { zelazo: 2 }, { zelazo: NaN },
  { zelazo: Infinity }, { zelazo: -0 }, { braz: 5 }, { zelazo: 1, braz: 0 },
];
const BUILTS = [[], ['odlewnia_zelaza'], ['wielka_odlewnia'], ['kuznia'], ['kopalnia', 'odlewnia_zelaza'], ['odlewnia_miedzi']];

const zelazoAccess = [];
for (const stock of STOCKS) for (const built of [undefined, ...BUILTS]) {
  zelazoAccess.push({ stock: encStock(stock), built: built ?? null, out: W.hasZelazoAccess(stock, built) });
}
const zelazoNative = [];
const CITY_SETS = [[], [[]], [['kuznia']], [['odlewnia_zelaza']], [['kuznia'], ['wielka_odlewnia']], [['odlewnia_zelaza'], ['kuznia']], [[], []]];
for (const kop of [false, true]) for (const stock of STOCKS) for (const cities of CITY_SETS) {
  zelazoNative.push({ hasKopalnia: kop, stock: encStock(stock), cities, out: W.ownerHasNativeZelazoAccess(kop, stock, cities) });
}
const sumCases = [];
const SUMS = [
  [], [undefined], [null], [{}], [{ zelazo: 1 }], [{ zelazo: 1 }, { zelazo: 2, braz: 3 }], [{ zelazo: NaN }, { zelazo: 1 }],
  [{ zelazo: Infinity }, { zelazo: 1 }], [{ zelazo: -Infinity, braz: 1 }], [{ zelazo: 0.1 }, { zelazo: 0.2 }, { zelazo: 0.3 }],
  [{ zelazo: -1 }, { zelazo: 1 }], [{ a: 1e308 }, { a: 1e308 }],
];
for (const recs of SUMS) {
  const out = W.sumCitySurowce(recs);
  sumCases.push({ records: recs.map((r) => (r === undefined ? { absent: true } : r === null ? null : encStock(r))), out: encStock(out) });
}

// Bramka Mlyna: availableProduction na budynkach (mlyn, port, magazyn, mlyn_wielki) - zmienia sie wylacznie
// ctx.cityHasRiver / cityHasCoastOrRiver / zbudowany mlyn.
const bld = (id, extra = {}) => ({ id, nazwa: id, kosztBudowy: 100, przyrostKosztu: 0, epokaWejscia: 1, ...extra });
const data = { buildings: [bld('mlyn'), bld('port'), bld('magazyn'), bld('mlyn_wielki')], units: [] };
const mlyn = [];
for (const river of [undefined, false, true, 'true', 1, null]) for (const coast of [undefined, false, true]) for (const mlynBuilt of [false, true]) {
  const ctx = { showResourceGatedBuildings: true, builtBuildingIds: mlynBuilt ? ['mlyn'] : [] };
  if (river !== undefined) ctx.cityHasRiver = river;
  if (coast !== undefined) ctx.cityHasCoastOrRiver = coast;
  const out = W.availableProduction({}, data, [], ctx).map((i) => i.id);
  mlyn.push({ cityHasRiver: river === undefined ? { absent: true } : river, cityHasCoastOrRiver: coast === undefined ? { absent: true } : coast, mlynBuilt, out });
}
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ pin, zelazoAccess, zelazoNative, sumCases, mlyn }) + '\n');
console.log('zelazoAccess', zelazoAccess.length, 'native', zelazoNative.length, 'sum', sumCases.length, 'mlyn', mlyn.length);
