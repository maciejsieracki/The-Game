#!/usr/bin/env node
/**
 * run-k02-units.mjs — harness porownania DOM: jednostki K02 (`src/ui/cityPanel/k02-units.ts`, P5.8 K02,
 * runda 3 partia 1 `R-RUSTPORT-P5-8-CITYPANEL-K02-Q1`) vs pin web `edb8fb56`.
 *
 * Jednostki wyciagane z pinu PO NAZWIE (nie po numerach linii): fillIconElement, makeMiniThumb,
 * createScrollList, appendTabIndicators, appendSurowceGrid, appendIndywidualneToggle, oraz zaleznosci
 * prywatne: el (863), statChip (4222), LIST_ROW_HEIGHT_EM (1773), typ TabIndicatorChip (4234).
 * Zaleznosci w gore stubowane w probie pinu (ta sama tresc stubu co po stronie v2 przekazywana argumentem):
 *   resourceBrandIconHtml (pin:3788) -> `<i class="rb">nazwa</i>`; rerender (module-level) -> log.
 *
 * Uzycie (z katalogu `src-tauri/frontend-v2/`):
 *   git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>   (PIN_DIR = mktemp -d poza repo)
 *   node tools/dom-harness/run-k02-units.mjs --pin-dir <PIN_DIR> [--json <plik>]
 * EXIT 0 <=> 0 roznic; 1 <=> >=1 roznica; 2 <=> blad harnessu.
 */
import { mkdtempSync, writeFileSync, readFileSync, rmSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { bundle } from './build.mjs';

function entryJs(outdir) {
  const f = readdirSync(outdir).find((n) => n.endsWith('.js') && !n.startsWith('chunk-'));
  return f ? join(outdir, f) : null;
}

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
const JSON_OUT = argOf('--json');
if (!PIN_DIR) {
  console.error('Uzycie: node tools/dom-harness/run-k02-units.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const PIN_SRC = resolve(PIN_DIR, 'gra/src');
const PIN_FILE = join(PIN_SRC, 'ui/cityPanel.ts');
const V2_FILE = join(V2_ROOT, 'src/ui/cityPanel/k02-units.ts');
const PROBE_NAME = '__k02_units_pin_probe.ts';

const pinLines = readFileSync(PIN_FILE, 'utf8').split('\n');

/** Wycinek funkcji z pinu: od linii `function NAME` do pierwszej linii `}` w kolumnie 0. */
function extractFn(name) {
  const re = new RegExp(`^function ${name}[\\s(<]`);
  const i = pinLines.findIndex((l) => re.test(l));
  if (i < 0) throw new Error(`pin: brak funkcji ${name}`);
  let j = i;
  while (pinLines[j] !== '}') j++;
  return pinLines.slice(i, j + 1).join('\n').replace(/^function /m, 'export function ');
}
function extractLine(re) {
  const l = pinLines.find((x) => re.test(x));
  if (!l) throw new Error(`pin: brak linii ${re}`);
  return l;
}

const FNS = ['fillIconElement', 'makeMiniThumb', 'createScrollList', 'appendTabIndicators', 'appendSurowceGrid', 'appendIndywidualneToggle'];
const probeSrc = [
  'const CP_EMOJI_DETECT = /(?!)/u;',
  'function cpInlineIcons(h: string): string { return h; }',
  'function resourceBrandIconHtml(n: string): string { return \'<i class="rb">\' + n + \'</i>\'; }',
  'let __rrLog: string[] = [];',
  'function rerender(): void { __rrLog.push(\'rerender\'); }',
  'export function __setRerenderLog(a: string[]): void { __rrLog = a; }',
  extractLine(/^type TabIndicatorChip = /),
  extractLine(/^const LIST_ROW_HEIGHT_EM = /),
  extractFn('el'),
  extractFn('statChip'),
  ...FNS.map(extractFn),
  '',
].join('\n');

const tmp = mkdtempSync(join(tmpdir(), 'p58k02u-harness-'));
let exitCode = 0;
try {
  const probePath = join(PIN_SRC, 'ui', PROBE_NAME);
  writeFileSync(probePath, probeSrc);
  const pinOut = join(tmp, 'pin');
  const v2Out = join(tmp, 'v2');
  await bundle([probePath], pinOut);
  await bundle([V2_FILE], v2Out);
  const pinJs = entryJs(pinOut);
  const v2Js = entryJs(v2Out);
  if (!pinJs || !v2Js) throw new Error('brak wygenerowanego bundla: ' + pinJs + ' ' + v2Js);
  const pinMod = await import(pathToFileURL(pinJs).href);
  const v2Mod = await import(pathToFileURL(v2Js).href);

  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', (e) => errors.push(String(e?.message ?? e).split('\n')[0]));

  const brand = (n) => `<i class="rb">${n}</i>`;
  const SVG = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>';

  /**
   * Przypadek: args(doc, mount, log) -> tablica argumentow; out: 'mount' (innerHTML montazu) lub 'ret' (outerHTML
   * zwracanego wezla / String); click: klik w pierwszy <button> montazu (log zbiera wywolania callbackow).
   */
  const cases = [
    ['fillIconElement: svg -> innerHTML', 'fillIconElement', (d, m) => { const t = d.createElement('span'); m.appendChild(t); return [t, SVG]; }, 'mount'],
    ['fillIconElement: tekst -> textContent', 'fillIconElement', (d, m) => { const t = d.createElement('span'); m.appendChild(t); return [t, '🏛 <b>x</b>']; }, 'mount'],
    ['fillIconElement: pusty -> bez zmian', 'fillIconElement', (d, m) => { const t = d.createElement('span'); t.textContent = 'stare'; m.appendChild(t); return [t, '']; }, 'mount'],
    ['makeMiniThumb: svg', 'makeMiniThumb', () => [SVG], 'ret'],
    ['makeMiniThumb: tekst', 'makeMiniThumb', () => ['★'], 'ret'],
    ['createScrollList: domyslne', 'createScrollList', () => [], 'ret'],
    ['createScrollList: visible 3 (domyslna wysokosc wiersza)', 'createScrollList', () => ['list-scroll-x', { visible: 3 }], 'ret'],
    ['createScrollList: visible 4 rowEm 2.5', 'createScrollList', () => ['rs', { visible: 4, rowEm: 2.5 }], 'ret'],
    ['createScrollList: fill ma pierwszenstwo nad visible', 'createScrollList', () => ['fl', { fill: true, visible: 3 }], 'ret'],
    ['appendTabIndicators: pusta lista', 'appendTabIndicators', (d, m) => [m, []], 'mount'],
    ['appendTabIndicators: cls, title z cudzyslowem, ikona tekstowa', 'appendTabIndicators', (d, m) => [m, [
      { icon: 'Ⓕ', label: 'Sila', value: '3', cls: 'pos' },
      { icon: '', label: 'Bez ikony', value: '0', title: 'a"b' },
    ]], 'mount'],
    ['appendTabIndicators: ikona SVG, bez cls', 'appendTabIndicators', (d, m) => [m, [
      { icon: SVG, label: 'L', value: '1' },
    ]], 'mount'],
    ['appendSurowceGrid: active', 'appendSurowceGrid', (d, m) => [m, ['Żelazo', 'Węgiel'], 'active', brand], 'mount'],
    ['appendSurowceGrid: potential', 'appendSurowceGrid', (d, m) => [m, ['Złoto'], 'potential', brand], 'mount'],
    ['appendSurowceGrid: pusta lista', 'appendSurowceGrid', (d, m) => [m, [], 'active', brand], 'mount'],
    ['appendIndywidualneToggle: WL, klik', 'appendIndywidualneToggle', (d, m, log) => [m, true, () => log.push('toggle'), 'row-x', () => log.push('rerender')], 'mount', true],
    ['appendIndywidualneToggle: WYL, klik', 'appendIndywidualneToggle', (d, m, log) => [m, false, () => log.push('toggle'), 'row-y', () => log.push('rerender')], 'mount', true],
  ];

  const run = (mod, fnName, buildArgs, out, click, isPin) => {
    const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
      url: 'http://localhost/',
      pretendToBeVisual: true,
      virtualConsole: vc,
    });
    const doc = dom.window.document;
    const mount = doc.createElement('div');
    doc.body.appendChild(mount);
    const log = [];
    if (isPin && typeof mod.__setRerenderLog === 'function') mod.__setRerenderLog(log);
    const prevDoc = globalThis.document;
    globalThis.document = doc;
    try {
      const ret = mod[fnName](...buildArgs(doc, mount, log));
      if (click) {
        const btn = mount.querySelector('button');
        if (btn) btn.click();
        else log.push('NO_BUTTON');
      }
      const body = out === 'ret'
        ? (ret && typeof ret === 'object' && 'outerHTML' in ret ? ret.outerHTML : String(ret))
        : mount.innerHTML;
      return `${body}|log=${log.join(',')}`;
    } catch (e) {
      return `THROW: ${String(e?.message ?? e)}`;
    } finally {
      globalThis.document = prevDoc;
    }
  };

  const results = cases.map(([name, fn, buildArgs, out, click]) => {
    const a = run(pinMod, fn, buildArgs, out, !!click, true);
    const b = run(v2Mod, fn, buildArgs, out, !!click, false);
    return { name, ok: a === b, pin: a, v2: b };
  });
  const diffs = results.filter((r) => !r.ok).length;
  console.log(`run-k02-units: asercji=${results.length} roznic=${diffs} jsdomErrors=${errors.length}`);
  for (const r of results.filter((x) => !x.ok)) {
    console.log(`  ROZNICA: ${r.name}\n    pin: ${r.pin}\n    v2 : ${r.v2}`);
  }
  if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ pin: PIN_DIR, diffs, jsdomErrors: errors.length, cases: results.map(({ name, ok }) => ({ name, ok })) }, null, 2));
  exitCode = diffs > 0 ? 1 : 0;
} catch (e) {
  console.error('run-k02-units: blad harnessu:', e?.stack ?? e);
  exitCode = 2;
} finally {
  try {
    rmSync(join(PIN_SRC, 'ui', PROBE_NAME), { force: true });
  } catch {}
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(exitCode);
