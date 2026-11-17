// R-RUSTPORT-P4-1-R3-RIVER-RIBBONS — bundles gen.ts with esbuild (see README.md).
//
// The pin module `render/scene.ts` is bundled UNCHANGED except for one appended
// line that re-exports private functions under `__` names (no body is touched):
// renderCoastalRiverExtension (scene.ts:801), flushRiverBucket (:1386),
// buildRiverPointsFromHexPath (:1124), simplifyRiverRenderPath (:1085),
// pathReachesOpenSeaRender (:604), filterRiverPathsForStage (:1534),
// buildRibbonGeometry (:385). `renderLandRiversFromPaths` (:1267) is already
// exported by the pin itself (for `tools/river-fog-visibility-test.cjs`).
//
// usage (from the scratch refscript dir): node build.mjs <esbuild module path>
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const esbuild = require(process.argv[2]);

const APPEND = '\nexport { renderCoastalRiverExtension as __renderCoastalRiverExtension, '
  + 'flushRiverBucket as __flushRiverBucket, buildRiverPointsFromHexPath as __buildRiverPointsFromHexPath, '
  + 'simplifyRiverRenderPath as __simplifyRiverRenderPath, pathReachesOpenSeaRender as __pathReachesOpenSeaRender, '
  + 'filterRiverPathsForStage as __filterRiverPathsForStage, buildRibbonGeometry as __buildRibbonGeometry };\n';

const appendExports = {
  name: 'append-scene-exports',
  setup(build) {
    build.onLoad({ filter: /[\\/]gra[\\/]src[\\/]render[\\/]scene\.ts$/ }, async (args) => {
      const src = await fs.promises.readFile(args.path, 'utf8');
      return { contents: src + APPEND, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

await esbuild.build({
  entryPoints: ['rivers_gen.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'rivers_gen.mjs',
  logLevel: 'warning',
  plugins: [appendExports],
});
