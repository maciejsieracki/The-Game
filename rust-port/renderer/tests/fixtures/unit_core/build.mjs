// Bundles gen.ts with esbuild 0.24.0 (R-RUSTPORT-P4-13-MOD04-UNIT-CORE-Q1).
//
// The single adaptation of web code: three web files get ONE `export { ... }`
// line appended at bundle time (files on disk are untouched), so the
// generator can call internal symbols directly. Nothing else is rewritten:
//   - render/units.ts          : routing/category internals + every `function getGeo*`
//   - render/kon-nowy-model.ts : every `function getGeoNH*`
//   - render/jednostki-p1-rdzen.ts : the `p1Geos` singleton registry
//
// Usage (from the scratch refscript dir, `node_modules` linked next to it):
//   node build.mjs
import * as esbuild from 'esbuild';
import * as fs from 'node:fs';

const UNITS_INTERNALS = [
  'buildCategoryModel', 'buildNamedUnit', 'buildSuperUnit', 'cultureFromName', 'normName',
  'decorateChariot', 'applyCultureOverrides', 'attachEmbarkBoat', 'buildBaseAvatar',
  'SUPER_Z_MODELEM_NAZWANYM',
  // named models without a units.json record (P4-7 §4.1, gallery only)
  'buildHierosLochos', 'buildCrossbowman', 'buildCeltWarrior', 'buildGermanWarrior', 'buildBerserker',
];

function getGeoNames(src) {
  const names = [];
  for (const m of src.matchAll(/^function (getGeo\w+)\s*\(/gm)) names.push(m[1]);
  return names;
}

const appendExports = {
  name: 'append-exports',
  setup(build) {
    build.onLoad({ filter: /[\\/]render[\\/](units|kon-nowy-model|jednostki-p1-rdzen)\.ts$/ }, async (args) => {
      const src = await fs.promises.readFile(args.path, 'utf8');
      let names;
      if (/units\.ts$/.test(args.path)) names = [...UNITS_INTERNALS, ...getGeoNames(src)];
      else if (/kon-nowy-model\.ts$/.test(args.path)) names = getGeoNames(src);
      else names = ['p1Geos'];
      return { contents: `${src}\nexport { ${names.join(', ')} };\n`, loader: 'ts' };
    });
  },
};

await esbuild.build({
  entryPoints: ['gen.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'gen.mjs',
  logLevel: 'warning',
  // web files live in ../websrc (no node_modules there): resolve `three`
  // from the scratch install linked next to this script.
  nodePaths: [new URL('./node_modules', import.meta.url).pathname],
  plugins: [appendExports],
});
