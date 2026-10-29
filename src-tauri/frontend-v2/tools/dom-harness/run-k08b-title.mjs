#!/usr/bin/env node
/**
 * run-k08b-title.mjs — harness DOM partii `title` K08B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1, runda 2).
 *
 * Port (`src/ui/cityPanel/k08b-title.ts`: `resolveDetailSideHint`, `appendSectionTitleWithDetails`) jest bundlowany
 * esbuildem i wywoływany w jsdom. Prawdziwe `el` z `k01b-dom` (bez stubów). Moduł UI `ui/hoverDetailDock`
 * jest zastąpiony rejestratorem wywołań `attachInteractiveDetail` (kontrakt wywołania, nie zachowanie docku —
 * NIE_ZMIERZONO: realne okno szczegółów/dokowanie w przeglądarce).
 * Oczekiwane wartości = semantyka pinu `edb8fb56` (linia w opisie wektora), NIE wynik portu.
 * PIN-ANCHOR: każdy literał oczekiwania musi występować w cytowanej linii pinu (jak w run-k08b-rail.mjs).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k08b-title.mjs --pin-dir <PIN_DIR> [--v2 <plik>] [--tmp-dir <katalog poza repo>]
 * EXIT 0 <=> wszystkie wektory zgodne; 1 <=> >=1 niezgodność; 2 <=> błąd harnessu.
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
const V2_FILE = resolve(argOf('--v2') ?? join(V2_ROOT, 'src/ui/cityPanel/k08b-title.ts'));
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run-k08b-title.mjs --pin-dir <PIN_DIR> [--v2 <plik>] [--tmp-dir <katalog>]');
  process.exit(2);
}
const PIN_LINES = readFileSync(join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/);
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'k08b-title-'));

const results = [];
const check = (id, pin, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  results.push({ id, pin, ok, got, want });
};

/** PIN-ANCHOR: [linia pinu (1-indeksowana), literał]. */
const PIN_ANCHORS = [
  [11513, ".closest('.civ-ux-left')"], [11514, ".closest('.civ-ux-right')"],
  [11523, "el('div', 'ptitle')"], [11524, "el('span', '')"],
  [11527, "'okolica-info-link civ-w4-panel-detail gold'"], [11528, "infoLink.type = 'button'"],
  [11529, "'i szczegóły'"], [11530, "'Pokaż szczegóły sekcji'"],
  [11531, 'head.appendChild(infoLink)'], [11532, 'mount.appendChild(head)'],
  [11534, 'delayMs: 220'], [11535, 'sideHint: resolveDetailSideHint(mount)'],
];
PIN_ANCHORS.forEach(([line, lit], i) => check(`pin.anchor.${i + 1}`, `cityPanel.ts:${line} "${lit}"`, PIN_LINES[line - 1]?.includes(lit) ?? false, true));

let exitCode = 0;
try {
  // ─── bundle: port + rejestrator hoverDetailDock ─────────────────────────────────────────────────────────────────
  const stub = join(TMP, 'hoverDetailDock.stub.ts');
  writeFileSync(
    stub,
    'export const __calls: unknown[][] = [];\n' +
      'export function attachInteractiveDetail(...a: unknown[]): void { __calls.push(a); }\n',
  );
  const setup = join(TMP, 'setup.ts');
  writeFileSync(
    setup,
    [
      `import { installStaticCatalog } from ${JSON.stringify(join(V2_ROOT, 'src/controller/staticCatalog.ts'))};`,
      `import { MOCK_STATIC_CATALOG } from ${JSON.stringify(join(V2_ROOT, 'src/controller/mockCatalog.ts'))};`,
      'installStaticCatalog(MOCK_STATIC_CATALOG);',
      '',
    ].join('\n'),
  );
  const entry = join(TMP, 'entry.ts');
  writeFileSync(
    entry,
    // setup PIERWSZY w entry: katalog statyczny przed ewaluacją paneli (jak w run-k08b-rail.mjs, ZAŁOŻENIE P5.2-Z1)
    `import ${JSON.stringify(setup)};\n` +
      `export { appendSectionTitleWithDetails, resolveDetailSideHint } from ${JSON.stringify(V2_FILE)};\n` +
      `export { __calls } from ${JSON.stringify(stub)};\n`,
  );
  const out = join(TMP, 'bundle.mjs');
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    outfile: out,
    logLevel: 'silent',
    plugins: [
      {
        name: 'hover-dock-recorder',
        setup(b) {
          b.onResolve({ filter: /(^|\/)hoverDetailDock$/ }, () => ({ path: stub }));
          // emulacja `?raw` (jak w run-k08a-units.mjs): zasób SVG jako tekst domyślny
          b.onResolve({ filter: /\?raw$/ }, (a) => ({
            path: resolve(dirname(a.importer), a.path.replace(/\?raw$/, '')),
            namespace: 'raw',
          }));
          b.onLoad({ filter: /.*/, namespace: 'raw' }, (a) => ({
            contents: `export default ${JSON.stringify(readFileSync(a.path, 'utf8'))};`,
            loader: 'js',
          }));
          b.onLoad({ filter: /\.svg$/ }, (a) => ({
            contents: `export default ${JSON.stringify(readFileSync(a.path, 'utf8'))};`,
            loader: 'js',
          }));
          // `import.meta.glob` (Vite) -> pusty słownik: ikony marki nie są używane przez partię `title`
          b.onLoad({ filter: /icons\/brandAssets\.ts$/ }, (a) => ({
            contents:
              'const __glob = (..._a: unknown[]): Record<string, string> => ({});\n' +
              readFileSync(a.path, 'utf8').replace(/import\.meta\.glob\(/g, '__glob('),
            loader: 'ts',
          }));
        },
      },
    ],
  });

  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  const mod = await import(pathToFileURL(out).href);
  const { appendSectionTitleWithDetails, resolveDetailSideHint, __calls } = mod;
  const doc = dom.window.document;
  /** Montaż: opcjonalnie owinięty w element z klasą (.civ-ux-left / .civ-ux-right). */
  const mkMount = (wrapCls) => {
    const root = doc.createElement('div');
    doc.body.appendChild(root);
    let parent = root;
    if (wrapCls) {
      const w = doc.createElement('div');
      w.className = wrapCls;
      root.appendChild(w);
      parent = w;
    }
    const m = doc.createElement('div');
    parent.appendChild(m);
    return { root, mount: m };
  };

  // V1: resolveDetailSideHint (pin 11512-11516)
  check('side.left', 'cityPanel.ts:11513 .civ-ux-left -> left', resolveDetailSideHint(mkMount('civ-ux-left').mount), 'left');
  check('side.right', 'cityPanel.ts:11514 .civ-ux-right -> right', resolveDetailSideHint(mkMount('civ-ux-right').mount), 'right');
  check('side.auto', 'cityPanel.ts:11515 brak klasy -> auto', resolveDetailSideHint(mkMount(null).mount), 'auto');

  // V2: struktura DOM appendSectionTitleWithDetails (pin 11523-11532)
  const buildDetail = () => doc.createElement('section');
  const { mount: m1 } = mkMount('civ-ux-right');
  __calls.length = 0;
  appendSectionTitleWithDetails(m1, '<b>Tytuł</b> <i>x</i>', buildDetail);
  const head = m1.lastElementChild;
  check('dom.head.count', 'cityPanel.ts:11532 mount.appendChild(head) (1 dziecko)', m1.children.length, 1);
  check('dom.head.tag', 'cityPanel.ts:11523 el("div","ptitle")', head?.tagName, 'DIV');
  check('dom.head.class', 'cityPanel.ts:11523 klasa "ptitle"', head?.className, 'ptitle');
  check('dom.title.html', 'cityPanel.ts:11525 left.innerHTML = titleHtml', head?.children[0]?.innerHTML, '<b>Tytuł</b> <i>x</i>');
  check('dom.title.tag', 'cityPanel.ts:11524 el("span","")', head?.children[0]?.tagName, 'SPAN');
  check('dom.head.children', 'cityPanel.ts:11531 head: span, button', head?.children.length, 2);
  const btn = head?.children[1];
  check('dom.btn.tag', 'cityPanel.ts:11527 el("button", ...)', btn?.tagName, 'BUTTON');
  check('dom.btn.class', 'cityPanel.ts:11527 klasy okolica-info-link civ-w4-panel-detail gold', btn?.className, 'okolica-info-link civ-w4-panel-detail gold');
  check('dom.btn.type', 'cityPanel.ts:11528 infoLink.type = "button"', btn?.getAttribute('type'), 'button');
  check('dom.btn.text', 'cityPanel.ts:11529 textContent "i szczegóły"', btn?.textContent, 'i szczegóły');
  check('dom.btn.aria', 'cityPanel.ts:11530 aria-label', btn?.getAttribute('aria-label'), 'Pokaż szczegóły sekcji');

  // V3: kontrakt attachInteractiveDetail (pin 11533-11536)
  check('attach.calls', 'cityPanel.ts:11533 jedno wywołanie attachInteractiveDetail', __calls.length, 1);
  const [aEl, aBuild, aOpts] = __calls[0] ?? [];
  check('attach.target', 'cityPanel.ts:11533 pierwszy argument = infoLink', aEl === btn, true);
  check('attach.build', 'cityPanel.ts:11533 drugi argument = buildDetail', aBuild === buildDetail, true);
  check('attach.delay', 'cityPanel.ts:11534 delayMs 220', aOpts?.delayMs, 220);
  check('attach.side.right', 'cityPanel.ts:11535 sideHint z mount (.civ-ux-right) = right', aOpts?.sideHint, 'right');

  // V4: sideHint left/auto w wywołaniu
  const { mount: m2 } = mkMount('civ-ux-left');
  __calls.length = 0;
  appendSectionTitleWithDetails(m2, 'L', buildDetail);
  check('attach.side.left', 'cityPanel.ts:11535 sideHint = left', __calls[0]?.[2]?.sideHint, 'left');
  const { mount: m3 } = mkMount(null);
  __calls.length = 0;
  appendSectionTitleWithDetails(m3, 'A', buildDetail);
  check('attach.side.auto', 'cityPanel.ts:11535 sideHint = auto', __calls[0]?.[2]?.sideHint, 'auto');

  // V5: tytuł dopisywany na końcu mountu (nie zastępuje istniejących dzieci)
  const { mount: m4 } = mkMount(null);
  m4.appendChild(doc.createElement('p'));
  appendSectionTitleWithDetails(m4, 'T', buildDetail);
  // `?.` : brak dziecka (np. mutant bez appendChild) = FAIL asercji (EXIT 1), nie TypeError harnessu (EXIT 2)
  check('dom.append.order', 'cityPanel.ts:11532 appendChild na końcu', [m4.children[0]?.tagName, m4.children[1]?.className], ['P', 'ptitle']);
} catch (e) {
  console.error('run-k08b-title: błąd harnessu:', e);
  exitCode = 2;
} finally {
  rmSync(TMP, { recursive: true, force: true });
}

const fails = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.id} [${r.pin}] got=${JSON.stringify(r.got)} want=${JSON.stringify(r.want)}`);
console.log(`run-k08b-title: ${results.length - fails.length}/${results.length} porównań zgodnych`);
if (exitCode === 0 && fails.length > 0) exitCode = 1;
process.exit(exitCode);
