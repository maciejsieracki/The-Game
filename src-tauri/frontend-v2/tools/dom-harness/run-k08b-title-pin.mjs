#!/usr/bin/env node
/**
 * run-k08b-title-pin.mjs — harness WYKONUJĄCY funkcje pinu dla partii `title` K08B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1,
 * runda 3, zarzut Evaluatora 1: dispatch r2(a)).
 *
 * Różnica względem `run-k08b-title.mjs`: tam oczekiwania są spisane z pinu; tutaj pin jest WYKONYWANY.
 *  - PIN-EXEC: trzy funkcje pinu `edb8fb56` (`gra/src/ui/cityPanel.ts`) przepisane BEZ ZMIAN TEKSTU z linii pinu:
 *      863-870   `el`                          (lokalny helper pinu, używany przez blok 7)
 *      11512-11516 `resolveDetailSideHint`
 *      11518-11537 `appendSectionTitleWithDetails`
 *    (jedyna operacja: wycięcie linii zakresu z pinu; zakresy są sprawdzane kotwicami startu/końca).
 *  - PORT: `src/ui/cityPanel/k08b-title.ts` (`resolveDetailSideHint`, `appendSectionTitleWithDetails`); `el` = port K01B.
 *  - Zależności (wiring): `attachInteractiveDetail` z `ui/hoverDetailDock` = REJESTRATOR (ta sama granica UI co w
 *    `run-k08b-title.mjs`; NIE_ZMIERZONO: realne dokowanie w przeglądarce). `CP_EMOJI_DETECT`/`cpInlineIcons` (używane przez
 *    pinowe `el` tylko gdy podano `html`) = port K01A (`k01a-fundament.ts`), nie stub.
 *  - Porównanie: ten sam scenariusz uruchamiany na obu wersjach; snapshot (outerHTML montażu, wywołania
 *    `attachInteractiveDetail`: cel, identyczność `buildDetail`, opcje) musi być identyczny pole po polu.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k08b-title-pin.mjs --pin-dir <PIN_DIR> [--v2 <plik>] [--tmp-dir <katalog poza repo>]
 * EXIT 0 <=> brak różnic i wszystkie kotwice zgodne; 1 <=> >=1 różnica; 2 <=> błąd harnessu.
 */
import { createHash } from 'node:crypto';
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
  console.error('Użycie: node tools/dom-harness/run-k08b-title-pin.mjs --pin-dir <PIN_DIR> [--v2 <plik>] [--tmp-dir <katalog>]');
  process.exit(2);
}
const PIN_LINES = readFileSync(join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/);
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'k08b-title-pin-'));

const results = [];
const check = (id, pin, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  results.push({ id, pin, ok, got, want });
};

/** Zakresy pinu wykonywane verbatim: [nazwa, a, b, kotwica startu, kotwica końca (linia b)]. */
const PIN_RANGES = [
  ['el', 863, 870, 'function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, html?: string)', '}'],
  ['resolveDetailSideHint', 11512, 11516, 'function resolveDetailSideHint(mount: HTMLElement)', '}'],
  ['appendSectionTitleWithDetails', 11518, 11537, 'function appendSectionTitleWithDetails(', '}'],
];
/** PIN-ANCHOR: literały, które muszą występować w wykonywanym kodzie pinu (linie zakresów). */
const PIN_ANCHORS = [
  [11513, ".closest('.civ-ux-left')"], [11514, ".closest('.civ-ux-right')"],
  [11523, "el('div', 'ptitle')"], [11527, "'okolica-info-link civ-w4-panel-detail gold'"],
  [11529, "'i szczegóły'"], [11530, "'Pokaż szczegóły sekcji'"],
  [11532, 'mount.appendChild(head)'], [11534, 'delayMs: 220'], [11535, 'sideHint: resolveDetailSideHint(mount)'],
  [864, 'document.createElement(tag)'], [866, 'if (html !== undefined) {'],
];

let exitCode = 0;
const pinExecText = [];
try {
  PIN_RANGES.forEach(([name, a, b, start, end]) => {
    const okStart = PIN_LINES[a - 1]?.includes(start) ?? false;
    const okEnd = PIN_LINES[b - 1] === end;
    check(`pin.range.${name}`, `cityPanel.ts:${a}-${b} (start ${JSON.stringify(start.slice(0, 30))}…, koniec "}")`, [okStart, okEnd], [true, true]);
    if (!okStart || !okEnd) throw new Error(`zakres ${name} ${a}-${b} nie pasuje do pinu`);
    pinExecText.push(...PIN_LINES.slice(a - 1, b));
  });
  PIN_ANCHORS.forEach(([line, lit], i) => check(`pin.anchor.${i + 1}`, `cityPanel.ts:${line} "${lit}"`, PIN_LINES[line - 1]?.includes(lit) ?? false, true));
  const pinSha = createHash('sha256').update(pinExecText.join('\n')).digest('hex');
  console.log(`pin-exec: wycięte linie zakresów: ${pinExecText.length}, sha256=${pinSha}`);

  // ─── bundle: PIN-EXEC (verbatim) + PORT + rejestrator hoverDetailDock ──────────────────────────────────────────────
  const stub = join(TMP, 'hoverDetailDock.stub.ts');
  writeFileSync(
    stub,
    'export const __calls: unknown[][] = [];\n' +
      'export function attachInteractiveDetail(...a: unknown[]): void { __calls.push(a); }\n',
  );
  const k01a = JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k01a-fundament.ts'));
  const pinExec = join(TMP, 'pin-exec.ts');
  writeFileSync(
    pinExec,
    [
      "import { attachInteractiveDetail } from '../hoverDetailDock';",
      `import { CP_EMOJI_DETECT, cpInlineIcons } from ${k01a};`,
      '// --- verbatim pin edb8fb56 gra/src/ui/cityPanel.ts (zakresy: 863-870, 11512-11516, 11518-11537) ---',
      ...pinExecText,
      '// --- koniec verbatim ---',
      'export { appendSectionTitleWithDetails, resolveDetailSideHint };',
      '',
    ].join('\n'),
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
    `import ${JSON.stringify(setup)};\n` +
      `export { appendSectionTitleWithDetails as pinAppend, resolveDetailSideHint as pinSide } from ${JSON.stringify(pinExec)};\n` +
      `export { appendSectionTitleWithDetails as portAppend, resolveDetailSideHint as portSide } from ${JSON.stringify(V2_FILE)};\n` +
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
  const { __calls } = mod;
  const doc = dom.window.document;

  /** Dwa zestawy funkcji do wykonania na tym samym scenariuszu. */
  const SETS = {
    pin: { appendSectionTitleWithDetails: mod.pinAppend, resolveDetailSideHint: mod.pinSide },
    port: { appendSectionTitleWithDetails: mod.portAppend, resolveDetailSideHint: mod.portSide },
  };
  check('exec.pin.source.delay', 'pin-exec: appendSectionTitleWithDetails zawiera delayMs: 220', SETS.pin.appendSectionTitleWithDetails.toString().includes('delayMs: 220'), true);
  // esbuild zapisuje literały w cudzysłowach podwójnych, więc sprawdzany jest sam ciąg bez cudzysłowów
  check('exec.pin.source.ptitle', 'pin-exec: appendSectionTitleWithDetails zawiera el(…, ptitle)', SETS.pin.appendSectionTitleWithDetails.toString().includes('ptitle'), true);

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
    return m;
  };

  /** Scenariusz: wykonuje zestaw funkcji i zwraca snapshot (JSON-owalny). */
  const scenario = (fns) => {
    const snap = {};
    const sideOf = (m) => fns.resolveDetailSideHint(m);
    const outer = doc.createElement('div');
    outer.className = 'civ-ux-right';
    const inner = doc.createElement('div');
    inner.className = 'civ-ux-left';
    outer.appendChild(inner);
    const nested = doc.createElement('div');
    inner.appendChild(nested);
    doc.body.appendChild(outer);
    snap.side = {
      left: sideOf(mkMount('civ-ux-left')),
      right: sideOf(mkMount('civ-ux-right')),
      auto: sideOf(mkMount(null)),
      nestedLeftInRight: sideOf(nested),
    };
    const cases = [
      { id: 'right-html', wrap: 'civ-ux-right', html: '<b>Tytuł</b> <i>x</i>', pre: 0 },
      { id: 'left-entity', wrap: 'civ-ux-left', html: 'A &amp; B', pre: 0 },
      { id: 'auto-pre2', wrap: null, html: 'T', pre: 2 },
      { id: 'empty-title', wrap: null, html: '', pre: 0 },
    ];
    snap.cases = {};
    for (const c of cases) {
      const mount = mkMount(c.wrap);
      for (let i = 0; i < c.pre; i++) mount.appendChild(doc.createElement('p'));
      __calls.length = 0;
      const made = [];
      const build = () => {
        const d = doc.createElement('section');
        d.className = 'detail';
        made.push(d);
        return d;
      };
      fns.appendSectionTitleWithDetails(mount, c.html, build);
      snap.cases[c.id] = {
        mount: mount.outerHTML,
        children: mount.children.length,
        calls: __calls.map(([target, b, opts]) => {
          const built = typeof b === 'function' ? b() : undefined;
          return {
            targetIsButtonInMount: target?.tagName === 'BUTTON' && mount.contains(target),
            targetOuter: target?.outerHTML,
            buildReturnsDetail: built?.className === 'detail' && made.includes(built),
            opts: opts ? { delayMs: opts.delayMs, sideHint: opts.sideHint, keys: Object.keys(opts).sort() } : null,
          };
        }),
        builtCount: made.length,
      };
    }
    return snap;
  };

  const pinSnap = scenario(SETS.pin);
  const portSnap = scenario(SETS.port);
  /** Spłaszczenie do ścieżek, by różnica była wskazana pole po polu. */
  const flat = (o, p = '') =>
    o !== null && typeof o === 'object'
      ? Object.entries(o).flatMap(([k, v]) => flat(v, p ? `${p}.${k}` : k))
      : [[p, o]];
  const fp = new Map(flat(pinSnap));
  const fq = new Map(flat(portSnap));
  const paths = [...new Set([...fp.keys(), ...fq.keys()])].sort();
  check('diff.paths.count', 'liczba porównywanych pól (pin-exec vs port-exec) > 0', paths.length > 0, true);
  for (const path of paths) {
    check(`diff.${path}`, `pin-exec.${path}`, fq.get(path), fp.get(path));
  }
  check('expect.side.nestedLeftInRight', 'closest: .civ-ux-left wewnątrz .civ-ux-right => left (pin: left pierwszy)', pinSnap.side.nestedLeftInRight, 'left');
  check('diff.case.right.sideHint', 'cityPanel.ts:11535 sideHint z mount w .civ-ux-right = right', pinSnap.cases['right-html'].calls[0]?.opts?.sideHint, 'right');
  check('diff.case.right.build', 'cityPanel.ts:11533 build zwraca węzeł buildDetail', pinSnap.cases['right-html'].calls[0]?.buildReturnsDetail, true);
  check('diff.case.auto.head', 'cityPanel.ts:11532 head dopisany na końcu (pre=2 => 3 dzieci)', pinSnap.cases['auto-pre2'].children, 3);
} catch (e) {
  console.error('run-k08b-title-pin: błąd harnessu:', e);
  exitCode = 2;
} finally {
  rmSync(TMP, { recursive: true, force: true });
}

const fails = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.id} [${r.pin}] got=${JSON.stringify(r.got)} want=${JSON.stringify(r.want)}`);
console.log(`run-k08b-title-pin: ${results.length - fails.length}/${results.length} porównań zgodnych`);
if (exitCode === 0 && fails.length > 0) exitCode = 1;
process.exit(exitCode);
