// Bundles gen_picking.ts with esbuild 0.24.0 (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q5), a copy of build_dynamics.mjs with a longer APPENDED_EXPORTS list.
//
// Web files are bundled UNCHANGED except for ONE documented bundle-time step:
// `battle/battleScene.ts` gets an `export { ... }` statement APPENDED (its text is
// otherwise byte-identical) so the generator can reach module-private constants
// and helpers (`BF_COLS`, `makeGableRoofGeometry`, `cellToWorld`, ...). No other
// file is touched; nothing is written to `gra/**`.
//
// Usage (from the scratch refscript dir, `node_modules` linked next to it):
//   node build_picking.mjs
import * as esbuild from 'esbuild';
import * as fs from 'node:fs';

const here = new URL('.', import.meta.url).pathname;

export const APPENDED_EXPORTS = [
  'BF_COLS', 'BF_ROWS', 'PLAYABLE_COLS', 'PLAYABLE_ROWS', 'PLAY_COL0', 'PLAY_ROW0', 'PLAY_COL1', 'PLAY_ROW1',
  'PLAY_MID_COL', 'PLAY_MID_ROW', 'TILE_S', 'TILE_H', 'MAX_PER_SIDE', 'RANK_WIDTH', 'MAX_RANKS', 'DEPLOY_MARGIN',
  'FRONT_GAP', 'ATK_FRONT_COL', 'DEF_FRONT_COL', 'ATK_COL_STEP', 'DEF_COL_STEP', 'DEPLOY_MID_COL',
  'DEPLOY_DEF_MIN_COL', 'BT_FLOOR_COLOR', 'BT_FLOOR_COLOR_DESERT', 'FOREST_CONE_COLOR', 'FOREST_CONE_COLOR2',
  'FOREST_TRUNK_COLOR', 'HILL_GRASS_COLOR', 'SHRUB_COLOR', 'ROCK_COLOR', 'RIVER_WATER_COLOR',
  'HILL_GRASS_COLOR_DESERT', 'SHRUB_COLOR_DESERT', 'ROCK_COLOR_DESERT', 'GRASS_TUFT_COLOR_A', 'GRASS_TUFT_COLOR_B',
  'PEBBLE_COLOR', 'TINY_BUSH_COLOR', 'GRASS_TUFT_COLOR_A_DESERT', 'GRASS_TUFT_COLOR_B_DESERT', 'HILL_LIFT',
  'HILL_BUMP_RADIUS', 'HILL_SUMMIT_Y', 'RIVER_DROP', 'SIEGE_BLDG_BODY_COLORS', 'SIEGE_BLDG_ROOF_COLORS',
  'makeGableRoofGeometry', 'cellToWorld', 'cellBoundsXZ', 'tileTopY', 'lighten', 'blend', 'deployClearRanksFor',
  'battleSafeCols', 'inPlayable', 'makeUnitBars', 'makeFallbackAvatar', 'dirYaw', 'sideColor', 'HPBAR_W', 'HPBAR_H', 'HPBAR_Y', 'BAR_GAP_Y', 'MORALEBAR_Y', 'AMMOBAR_Y', 'AMMOBAR_COLOR', 'BAR_OUTLINE_PAD', 'BAR_OUTLINE_Z', 'ORDER_LINE_Y', 'ORDER_COLOR_MOVE', 'ORDER_COLOR_ATTACK', 'ORDER_MOVE_OPACITY', 'ORDER_ATTACK_OPACITY', 'DIR_DELTA', 'ammoCount', 'moraleBaseFor', 'makeProjectileMesh', 'projectileKind', 'lerp', 'easeOut', 'easeIn', 'MOVE_STEP_MS', 'STEP_GAP_MS', 'RANGED_FLY_MS', 'RANGED_GAP_MS', 'DEATH_FADE_MS', 'BLOW_LUNGE_MS', 'BLOW_HIT_T', 'BLOW_SETTLE_MS', 'MORALE_GATE_BREACH', 'MORALE_WALL_BREACH',
  'clampBattleTile', 'battlePickMeshUpNormal', 'pickBattleGroundTilePlane', 'pickBattleGroundTileFromMeshes', 'worldToScreen',
  'DEPLOY_MIN_COL', 'DEPLOY_MAX_COL', 'DEPLOY_MIN_ROW', 'DEPLOY_MAX_ROW',
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

const entry = process.argv[2] ?? 'gen_picking';
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
