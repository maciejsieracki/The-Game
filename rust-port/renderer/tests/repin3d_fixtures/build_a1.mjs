// Bundles gen_a1.ts with esbuild 0.24.0 (R-RUSTPORT-REPIN-3D-A-Q1, batch A1): a copy of
// tests/fixtures/battle3d/build_dynamics.mjs with its own APPENDED_EXPORTS list and entry.
//
// Web files (`git archive <origin/main> gra/src gra/data`) are bundled UNCHANGED except for ONE
// documented bundle-time step: `battle/battleScene.ts` gets an `export { ... }` statement APPENDED
// (its text is otherwise byte-identical) so the generator can reach module-private helpers.
// No other file is touched; nothing is written to `gra/**`.
//
// Usage (from the scratch refscript dir, `node_modules` linked next to it, dom_stub.ts and
// three_shim.ts copied from tests/fixtures/battle3d/):
//   node build_a1.mjs
import * as esbuild from 'esbuild';
import * as fs from 'node:fs';

const here = new URL('.', import.meta.url).pathname;

export const APPENDED_EXPORTS = [
  'BF_COLS', 'BF_ROWS', 'cellToWorld', 'tileTopY', 'makeUnitBars', 'makeFallbackAvatar', 'sideColor', 'HPBAR_Y',
  'DEATH_FADE_MS', 'moraleBaseFor',
];

const appendExports = {
  name: 'append-battle-scene-exports',
  setup(build) {
    build.onLoad({ filter: /[\\/]battle[\\/]battleScene\.ts$/ }, async (args) => {
      const src = await fs.promises.readFile(args.path, 'utf8');
      return { contents: `${src}\nexport { ${APPENDED_EXPORTS.join(', ')} };\n`, loader: 'ts' };
    });
  },
};

// `three` imported BY battleScene.ts resolves to three_shim.ts (real three + inert WebGLRenderer);
// every other importer (siegeWall.ts, render/units.ts, the generator) gets the real package.
const threeShim = {
  name: 'battle-scene-three-shim',
  setup(build) {
    build.onResolve({ filter: /^three$/ }, (args) => {
      if (/[\\/]battle[\\/]battleScene\.ts$/.test(args.importer)) return { path: `${here}three_shim.ts` };
      return undefined;
    });
  },
};

const entry = process.argv[2] ?? 'gen_a1';
await esbuild.build({
  entryPoints: [`${here}${entry}.ts`],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: `${here}${entry}.mjs`,
  logLevel: 'warning',
  absWorkingDir: here.replace(/\/$/, ''),
  nodePaths: [new URL('./node_modules', import.meta.url).pathname],
  plugins: [appendExports, threeShim],
  // Vite-only `import.meta` features used by UI modules imported transitively (icons, env flags);
  // none of them is reached by the scene builders this generator runs.
  define: { 'import.meta.glob': '__viteGlobStub', 'import.meta.env': '__viteEnvStub' },
  banner: { js: 'const __viteGlobStub = () => ({}); const __viteEnvStub = { DEV: false };' },
  loader: { '.png': 'empty', '.svg': 'empty', '.jpg': 'empty', '.webp': 'empty', '.mp3': 'empty', '.ogg': 'empty', '.css': 'empty' },
});
