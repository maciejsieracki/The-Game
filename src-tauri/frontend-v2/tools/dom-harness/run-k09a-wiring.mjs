#!/usr/bin/env node
/**
 * run-k09a-wiring.mjs — TEST WYKONANIA wiringu K09A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K09A-Q1, runda 2; zarzut
 * Evaluatora Z3: brak testu wykonania `controller/k09aWiring.ts`).
 *
 * Wykonuje `installK09aWiring` w jsdom (realne moduły: `cityUxFrame`, `hoverDetailDock`, `hud`, `k06b-garnizon`,
 * `k08a-fundament`, jednostki K09A) i sprawdza, że każdy delegat dociera tam, dokąd ma:
 *   W0  przed instalacją `requireK09aDeps()` rzuca `K09A: brak setK09aDeps` (brak cichej wartości domyślnej);
 *   W1  `installK09aWiring(host)` wykonuje się bez wyjątku;
 *   W2  `getK09aHooks()` zwraca DOKŁADNIE obiekt `host` (identyczność referencji);
 *   W3  sześć delegatów `requireK09aDeps()` jest funkcjami;
 *   W4  `requireK08aDeps().rerender()` wywołuje jednostkę K09A `rerender` (sprawdzane przez refresh-spy);
 *   W5  `requireK08aDeps().clearGarrisonPanel()` czyści `pinnedGarrisonCityId` (stan K06A);
 *   W6  `requireK08aDeps().isCityUxFrameOpen()` = false bez ramki;
 *   W7  `requireK09aDeps().hideCityPanel()` = jednostka K09A `hideCityPanel` (ukrywa korzeń K06B);
 *   W8  `requireK09aDeps().showCityUxFrame(...)` otwiera ramkę widoczną dla `requireK08aDeps().isCityUxFrameOpen()`,
 *       a `hideCityUxFrame()` ją zamyka;
 *   W9  `getK09aHooks().onSwitchCity?.(id)` trafia do `host.onSwitchCity` z tym samym `id`.
 * Granice (NIE_ZMIERZONO, dossier §5): delegaty `setHoverDetailDocks`, `setMapHudChromeSuppressed`,
 * `refreshCityUxFrame`, `disposeHoverDetailDock` nie mają obserwowalnego efektu w jsdom bez layoutu — tu tylko typy.
 *
 * Użycie (z `src-tauri/frontend-v2/`): node tools/dom-harness/run-k09a-wiring.mjs [--src <katalog src>] [--tmp-dir <katalog>]
 * EXIT 0 <=> wszystkie checki OK; 1 <=> >=1 FAIL; 2 <=> błąd harnessu.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import * as esbuild from 'esbuild';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const SRC = resolve(argOf('--src') ?? join(V2_ROOT, 'src'));
const CITY = join(SRC, 'ui/cityPanel');
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'k09a-wiring-'));
const results = [];
const check = (id, what, ok, detail = '') => results.push({ id, what, ok: ok === true, detail });

// Katalog statyczny (ZAŁOŻENIE P5.2-Z1) instalowany PRZED ewaluacją modułów paneli.
const setupPath = join(TMP, 'setup.ts');
writeFileSync(setupPath, [`import { installStaticCatalog } from ${JSON.stringify(join(SRC, 'controller/staticCatalog.ts'))};`, `import { MOCK_STATIC_CATALOG } from ${JSON.stringify(join(SRC, 'controller/mockCatalog.ts'))};`, 'installStaticCatalog(MOCK_STATIC_CATALOG);', ''].join('\n'));
const entry = join(TMP, 'entry.ts');
const P = (rel) => JSON.stringify(join(CITY, rel));
writeFileSync(
  entry,
  [
    `import ${JSON.stringify(setupPath)};`,
    `import { installK09aWiring } from ${JSON.stringify(join(SRC, 'controller/k09aWiring.ts'))};`,
    `import { requireK09aDeps, getK09aHooks } from ${P('k09a-deps.ts')};`,
    `import { requireK08aDeps } from ${P('k08a-fundament.ts')};`,
    `import { setK06bRootEl, getK06bRootEl } from ${P('k06b-garnizon.ts')};`,
    `import { setK06aActive, getK06aState, setK06aPinnedGarrisonCityId } from ${P('k06a-fundament.ts')};`,
    `import { setK07aUxSectionRefresh, setK07aActiveCity } from ${P('k07a-fundament.ts')};`,
    `import { setK06bDeps } from ${P('k06b-deps.ts')};`,
    `import * as HOVER from ${JSON.stringify(join(SRC, 'ui/hoverDetailDock.ts'))};`,
    `import { isCityUxFrameOpen as frameOpenReal } from ${JSON.stringify(join(SRC, 'ui/cityUxFrame.ts'))};`,
    '// Wejścia testowe: stan modułów K06A/K06B/K07A (bez reguł gry); K09A rerender używa refresh-spy.',
    'export {',
    '  installK09aWiring, requireK09aDeps, getK09aHooks, requireK08aDeps, setK06bRootEl, getK06bRootEl,',
    '  setK06aActive, getK06aState, setK06aPinnedGarrisonCityId, setK07aUxSectionRefresh, setK07aActiveCity, frameOpenReal,',
    '  setK06bDeps, HOVER,',
    '};',
    '',
  ].join('\n'),
);

const out = join(TMP, 'bundle.mjs');
let W;
try {
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    outfile: out,
    logLevel: 'silent',
    plugins: [
      {
        name: 'raw-svg',
        setup(b) {
          b.onResolve({ filter: /\?raw$/ }, (a) => ({ path: resolve(dirname(a.importer), a.path.replace(/\?raw$/, '')), namespace: 'raw' }));
          b.onLoad({ filter: /.*/, namespace: 'raw' }, (a) => ({ contents: `export default ${JSON.stringify(readFileSync(a.path, 'utf8'))};`, loader: 'js' }));
          b.onLoad({ filter: /\.ts$/ }, (a) => {
            if (!a.path.startsWith(SRC + '/')) return undefined;
            const src = readFileSync(a.path, 'utf8');
            if (!src.includes('import.meta.glob(')) return undefined;
            return { contents: src.split('import.meta.glob(').join('((..._g: any[]) => ({} as Record<string, any>))('), loader: 'ts' };
          });
        },
      },
    ],
  });
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.HTMLInputElement = dom.window.HTMLInputElement;
  globalThis.HTMLButtonElement = dom.window.HTMLButtonElement;
  globalThis.Node = dom.window.Node;
  globalThis.Element = dom.window.Element;
  globalThis.Event = dom.window.Event;
  globalThis.MouseEvent = dom.window.MouseEvent;
  W = await import(pathToFileURL(out).href);
  // K06B: delegat DOM kasowania przypiętego szczegółu (hoverDetailDock); wiring K08C go nie wykonuje w tym teście.
  W.setK06bDeps({ clearPinnedDetail: W.HOVER.clearPinnedDetail });

  const errOf = (f) => {
    try {
      f();
      return null;
    } catch (e) {
      return e && e.message;
    }
  };
  // W0
  const pre = errOf(() => W.requireK09aDeps());
  check('W0', 'przed instalacją requireK09aDeps() rzuca „brak setK09aDeps”', typeof pre === 'string' && pre.includes('brak setK09aDeps'), String(pre));

  const spies = { switched: [] };
  const host = { onSwitchCity: (id) => spies.switched.push(id) };
  // W1
  const inst = errOf(() => W.installK09aWiring(host));
  check('W1', 'installK09aWiring(host) wykonuje się bez wyjątku', inst === null, String(inst));
  // W2
  check('W2', 'getK09aHooks() === host (identyczność referencji)', W.getK09aHooks() === host);
  // W3
  const d = W.requireK09aDeps();
  const fields = ['hideCityPanel', 'setHoverDetailDocks', 'setMapHudChromeSuppressed', 'showCityUxFrame', 'hideCityUxFrame', 'refreshCityUxFrame'];
  check('W3', `sześć delegatów K09A jest funkcjami (${fields.filter((f) => typeof d[f] === 'function').length}/6)`, fields.every((f) => typeof d[f] === 'function'));

  // Stan wejściowy: korzeń K06B, miasto i mapa K06A (bez renderu), zapis K07A.
  const root = document.createElement('div');
  document.body.appendChild(root);
  W.setK06bRootEl(root);
  const city = { id: 7, ownerId: 0, name: 'Alfa', population: 6 };
  W.setK07aActiveCity(city);
  W.setK06aActive(city, { tiles: [], width: 1, height: 1 }, () => undefined);

  // W4: delegat rerender K08A = jednostka K09A rerender (refresh-spy: rerender przy ustawionym refresh tylko go woła).
  let refreshCalls = 0;
  W.setK07aUxSectionRefresh(() => { refreshCalls += 1; });
  const r4 = errOf(() => W.requireK08aDeps().rerender());
  check('W4', 'requireK08aDeps().rerender() wywołuje jednostkę K09A rerender (refresh-spy)', r4 === null && refreshCalls === 1, `err=${r4} calls=${refreshCalls}`);
  W.setK07aUxSectionRefresh(null);

  // W5: clearGarrisonPanel K08A -> K06B (stan K06A)
  W.setK06aPinnedGarrisonCityId('9');
  const r5 = errOf(() => W.requireK08aDeps().clearGarrisonPanel());
  check('W5', 'requireK08aDeps().clearGarrisonPanel() zeruje pinnedGarrisonCityId', r5 === null && W.getK06aState().pinnedGarrisonCityId === null, `err=${r5}`);

  // W6: isCityUxFrameOpen bez ramki
  const open0 = W.requireK08aDeps().isCityUxFrameOpen();
  check('W6', 'requireK08aDeps().isCityUxFrameOpen() = false bez ramki', open0 === false, String(open0));

  // W7: hideCityPanel delegat = jednostka K09A (ukrywa korzeń K06B)
  root.style.display = '';
  const r7 = errOf(() => W.requireK09aDeps().hideCityPanel());
  check('W7', 'requireK09aDeps().hideCityPanel() ukrywa korzeń K06B (display none)', r7 === null && root.style.display === 'none', `err=${r7} display=${root.style.display}`);

  // W8: ramka: pokaż -> otwarta (także przez K08A), ukryj -> zamknięta
  const r8a = errOf(() => W.requireK09aDeps().showCityUxFrame(city, () => undefined, () => undefined));
  const openAfterShow = r8a === null ? W.requireK08aDeps().isCityUxFrameOpen() : false;
  const r8b = errOf(() => W.requireK09aDeps().hideCityUxFrame());
  const openAfterHide = W.requireK08aDeps().isCityUxFrameOpen();
  check('W8', 'showCityUxFrame otwiera ramkę (K08A: isCityUxFrameOpen), hideCityUxFrame ją zamyka', r8a === null && r8b === null && openAfterShow === true && openAfterHide === false, `showErr=${r8a} hideErr=${r8b} open=${openAfterShow}/${openAfterHide}`);

  // W9: hak onSwitchCity
  W.getK09aHooks().onSwitchCity?.(5);
  check('W9', 'getK09aHooks().onSwitchCity(5) trafia do host.onSwitchCity z id 5', spies.switched.length === 1 && spies.switched[0] === 5, JSON.stringify(spies.switched));
} catch (e) {
  console.error('BLAD-HARNESU:', e && e.stack ? e.stack : e);
  rmSync(TMP, { recursive: true, force: true });
  process.exit(2);
}
rmSync(TMP, { recursive: true, force: true });

const fails = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.id} | ${r.what}${r.ok || !r.detail ? '' : `\n     ${r.detail}`}`);
console.log(`\nk09a-wiring: ${results.length - fails.length}/${results.length} zgodnych`);
process.exit(fails.length === 0 ? 0 : 1);
