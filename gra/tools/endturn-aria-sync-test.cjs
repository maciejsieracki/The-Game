'use strict';
/**
 * endturn-aria-sync-test.cjs — R-WEB-ENDTURN-BUTTON-ARIA-Q1 (tag ENDARIA).
 *
 * Błąd (pomiar live, endturn-aria-probe.cjs, dane runs/R-WEB-ENDTURN-BUTTON-ARIA-Q1/):
 * przycisk „Zakończ turę” zostawał z aria-disabled="true" / klasą is-disabled, gdy canEndTurn()
 * już zwracał true. Atrybut był zapisywany tylko w render(), a render() odpalał się tylko z
 * updateHud(). Test bundluje NAPRAWDĘ src/ui/bottomBarHud.ts (esbuild + jsdom) i sprawdza, że
 * stan przycisku nadąża za zmianą canEndTurn() BEZ dodatkowego update() od strony gry.
 *
 * Czerwone na pierwotnym kodzie (bez cyklu synchronizacji), zielone po poprawce.
 *
 * Usage (z gra/): node tools/endturn-aria-sync-test.cjs
 */
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { JSDOM } = require(path.resolve(__dirname, '..', 'node_modules', 'jsdom'));

const GRA = path.resolve(__dirname, '..');
const SRC_FILE = path.join(GRA, 'src/ui/bottomBarHud.ts');
const SYNC_WAIT_MS = 1200; // > interwał cyklu synchronizacji (500 ms) z zapasem

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  PASS: ' + label); }
  else { fail++; console.error('  FAIL: ' + label); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const stubPlugin = {
  name: 'endturn-aria-sync-stubs',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: 'brand-assets', namespace: 'stub' }));
    build.onResolve({ filter: /brandTokenVars$/ }, () => ({ path: 'brand-tokens', namespace: 'stub' }));
    build.onLoad({ filter: /.*/, namespace: 'stub' }, ({ path: id }) => ({
      loader: 'ts',
      contents: id === 'brand-assets'
        ? 'export function brandIconSvg(id: string) { return id === "chip-warning" ? `<svg width="18" height="18"></svg>` : `<svg width="24" height="24"></svg>`; }'
        : 'export function ensureBrandRootTokens() {} export const CIV_BRAND_SCOPE_VARS = "";',
    }));
  },
};

async function main() {
  const built = await esbuild.build({
    entryPoints: [SRC_FILE],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    loader: { '.ts': 'ts' },
    plugins: [stubPlugin],
    logLevel: 'silent',
  });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', built.outputFiles[0].text)(mod, mod.exports, require);
  const { createBottomBarHud } = mod.exports;

  const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  global.Element = dom.window.Element;

  console.log('==============================================================');
  console.log('ENDARIA -- aria-disabled „Zakończ turę” nadąża za canEndTurn()');
  console.log('==============================================================');

  let canEnd = false;
  const api = createBottomBarHud({
    getTurn: () => 2,
    canEndTurn: () => canEnd,
    onEndTurn: () => {},
    getBlockingCount: () => 0,
  });
  const endBtn = () => document.querySelector('[data-end]');

  ok(endBtn() !== null && endBtn().getAttribute('aria-disabled') === 'true',
    '[1] canEndTurn=false -> aria-disabled=true przy pierwszym renderze');

  canEnd = true;
  await sleep(SYNC_WAIT_MS);
  ok(endBtn() !== null && endBtn().getAttribute('aria-disabled') === 'false',
    '[2] canEndTurn zmienione na true BEZ update() -> aria-disabled=false po cyklu synchronizacji');
  ok(endBtn() !== null && !endBtn().classList.contains('is-disabled'),
    '[3] canEndTurn=true -> klasa is-disabled usunięta (wygląd zgodny z klikalnością)');

  canEnd = false;
  await sleep(SYNC_WAIT_MS);
  ok(endBtn() !== null && endBtn().getAttribute('aria-disabled') === 'true',
    '[4] powrót canEndTurn=false -> aria-disabled=true (synchronizacja w obie strony)');

  api.destroy();
  ok(document.querySelector('[data-end]') === null, '[5] destroy() usuwa pasek (cykl nie zostaje osierocony)');

  console.log(`\nWynik: ${pass} PASS / ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
