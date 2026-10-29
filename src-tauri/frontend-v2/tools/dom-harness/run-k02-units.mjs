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
// P5.8 SCAL: k02-units importuje K01 (k01a-fundament -> uiParams -> katalog statyczny): katalog trzeba
// zainstalowac przed ewaluacja v2 (ZAŁOŻENIE P5.2-Z1, jak run-k01a.mjs); parametry UI z pina.
const SC_SRC = join(V2_ROOT, 'src/controller/staticCatalog.ts');
/** Plik wyjsciowy bundla po nazwie bazowej (przy wielu wejsciach esbuild zachowuje podkatalogi). */
function findFile(dir, base) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      const r = findFile(p, base);
      if (r) return r;
    } else if (name === base) return p;
  }
  return null;
}
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

const FNS = [
  'fillIconElement', 'makeMiniThumb', 'createScrollList', 'appendTabIndicators', 'appendSurowceGrid', 'appendIndywidualneToggle',
  'appendBreakdownLines', 'appendW4PctMetricBlock', 'appendCitizenUpkeepBlock', 'makeBuildingThumb',
  'appendBuildingInlineIcon', 'appendProductionPicon', 'productionQueueIconSpan',
  'renderBilans', 'applyBuildButtonVisualState', 'appendDisabledBuildActionButtons', 'appendBuildingRequirementChipSections',
  'techIconHintSpan', 'bindTechHintLinkDelegation',
];
/** Blok stalej `const NAZWA = {...};` z pina (do linii `};` w kolumnie 0). */
function extractBlock(re) {
  const i = pinLines.findIndex((l) => re.test(l));
  if (i < 0) throw new Error(`pin: brak bloku ${re}`);
  let j = i;
  while (pinLines[j] !== '};') j++;
  return pinLines.slice(i, j + 1).join('\n');
}
// Stuby zaleznosci w gore pinu (partie 2–3): ikony, zaopatrzenie, bilans, wymagania budynku, powiadomienie o technologii.
// Strona v2 dostaje to samo jako argumenty (Z4–Z10) — harness odtwarza wywolujacego po stronie pinu i v2.
const probeSrc = [
  "import { techIconSvg } from './techIcons';",
  'const CP_EMOJI_DETECT = /(?!)/u;',
  'function plonyChipRowHtml(v: any): string { return \'<i>\' + v.k + \'</i>\'; }',
  'function buildingRequirementChipsHtml(chips: any[]): string { return chips.map((c: any) => \'<s>\' + c.label + \'</s>\').join(\'\'); }',
  'let __nlog: string[] = [];',
  'export function __setNoticeLog(a: string[]): void { __nlog = a; }',
  'function showTechDiscoveryNotice(o: any): void { __nlog.push(\'open:\' + o.techName + \':\' + o.kind + \':\' + o.eraIndex); }',
  extractBlock(/^const BUILDING_REQ_SECTION_LABELS/),
  extractLine(/^let techHintLinkDelegationBound = /),
  'function cpInlineIcons(h: string): string { return h; }',
  'function resourceBrandIconHtml(n: string): string { return \'<i class="rb">\' + n + \'</i>\'; }',
  'function buildingIconHtml(def: any): string { return def == null ? \'\' : String(def); }',
  'function productionItemIconHtml(_data: any, item: any): string { return item == null ? \'\' : String(item); }',
  'function citizenUpkeepDisplayLines(u: any, _pop: number): any[] { return u.lines; }',
  'function stockResourceLabel(k: string): string { return \'L:\' + k; }',
  'function pctSubheadHtml(brandId: string, text: string): string { return \'<b>\' + brandId + \'</b><span>\' + text + \'</span>\'; }',
  'let __rrLog: string[] = [];',
  'function rerender(): void { __rrLog.push(\'rerender\'); }',
  'export function __setRerenderLog(a: string[]): void { __rrLog = a; }',
  extractLine(/^type TabIndicatorChip = /),
  extractLine(/^type BreakdownLine = /),
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
  await bundle([V2_FILE, SC_SRC], v2Out);
  const pinJs = entryJs(pinOut);
  const v2Js = findFile(v2Out, 'k02-units.js');
  if (!pinJs || !v2Js) throw new Error('brak wygenerowanego bundla: ' + pinJs + ' ' + v2Js);
  const SC = await import(pathToFileURL(findFile(v2Out, 'staticCatalog.js')).href);
  SC.installStaticCatalog({ uiParams: JSON.parse(readFileSync(join(PIN_DIR, 'gra/data/ui-params.json'), 'utf8')) });
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
    ['appendW4PctMetricBlock: pct 42.6, linie mieszane', 'appendW4PctMetricBlock', (d, m) => [m, '<b>T</b>', 42.6, 'linear-gradient(red,blue)', [{ label: 'a', value: 1 }, { label: 'b', value: -2, neg: true }], 'pusto'], 'mount'],
    ['appendW4PctMetricBlock: bez pct, tytul tekstowy, pusta podpowiedz', 'appendW4PctMetricBlock', (d, m) => [m, 'Tytul', undefined, 'g', undefined, 'brak'], 'mount'],
    ['appendW4PctMetricBlock: pct 150, punkty, afterBar, bez linii i podpowiedzi', 'appendW4PctMetricBlock', (d, m) => [m, 'T', 150, 'g', [], '', (b) => { const s = b.ownerDocument.createElement('i'); s.textContent = 'AB'; b.appendChild(s); }, '(30/30 pkt)'], 'mount'],
    ['appendW4PctMetricBlock: pct -5, tytul HTML, pusta lista z podpowiedzia', 'appendW4PctMetricBlock', (d, m) => [m, '<i>X</i>', -5, 'g', [], 'h'], 'mount'],
    ['appendCitizenUpkeepBlock: wymagane, dwa wiersze (ok + brak)', 'appendCitizenUpkeepBlock', (d, m, log, pin) => {
      const upkeep = { required: [1], lines: [{ key: 'zywnosc', value: 2, available: true }, { key: 'drewno', value: -1, available: false }] };
      const sub = '<b>chip-crate</b><span>Zaopatrzenie obywateli</span>';
      return pin ? [m, upkeep, 7] : [m, true, upkeep.lines.map(l => ({ label: 'L:' + l.key, value: l.value, neg: !l.available })), sub];
    }, 'mount'],
    ['appendCitizenUpkeepBlock: wymagane, pusta lista -> podpowiedz (emptyHint)', 'appendCitizenUpkeepBlock', (d, m, log, pin) => {
      const upkeep = { required: [1], lines: [] };
      const sub = '<b>chip-crate</b><span>Zaopatrzenie obywateli</span>';
      return pin ? [m, upkeep, 7] : [m, true, [], sub];
    }, 'mount'],
    ['appendCitizenUpkeepBlock: brak wymagan -> nic', 'appendCitizenUpkeepBlock', (d, m, log, pin) => {
      const sub = '<b>chip-crate</b><span>Zaopatrzenie obywateli</span>';
      return pin ? [m, { required: [], lines: [] }, 7] : [m, false, [], sub];
    }, 'mount'],
    ['appendCitizenUpkeepBlock: upkeep undefined -> nic', 'appendCitizenUpkeepBlock', (d, m, log, pin) => {
      const sub = '<b>chip-crate</b><span>Zaopatrzenie obywateli</span>';
      return pin ? [m, undefined, 7] : [m, false, [], sub];
    }, 'mount'],
    ['makeBuildingThumb: svg', 'makeBuildingThumb', (d, m, log, pin) => [SVG], 'ret'],
    ['makeBuildingThumb: tekst', 'makeBuildingThumb', (d, m, log, pin) => ['🏠'], 'ret'],
    ['appendBuildingInlineIcon: tekst', 'appendBuildingInlineIcon', (d, m) => [m, '🏠'], 'mount'],
    ['appendBuildingInlineIcon: svg', 'appendBuildingInlineIcon', (d, m) => [m, SVG], 'mount'],
    ['appendProductionPicon: svg', 'appendProductionPicon', (d, m, log, pin) => (pin ? [m, null, SVG] : [m, SVG]), 'mount'],
    ['appendProductionPicon: pusta ikona', 'appendProductionPicon', (d, m, log, pin) => (pin ? [m, null, ''] : [m, '']), 'mount'],
    ['productionQueueIconSpan: svg', 'productionQueueIconSpan', (d, m, log, pin) => (pin ? [null, SVG] : [SVG]), 'ret'],
    ['productionQueueIconSpan: tekst', 'productionQueueIconSpan', (d, m, log, pin) => (pin ? [null, '⚙'] : ['⚙']), 'ret'],
    ['renderBilans: brak widoku', 'renderBilans', (d, m) => [m, null], 'mount'],
    ['renderBilans: widok z wierszami', 'renderBilans', (d, m, log, pin) => [m, pin ? { k: 'X' } : '<i>X</i>'], 'mount'],
    ['appendDisabledBuildActionButtons: Kup + Buduj', 'appendDisabledBuildActionButtons', (d, m) => [m, 'Buduj', 'Brak zasobów'], 'mount'],
    ['appendDisabledBuildActionButtons: bez Kup, Ulepsz', 'appendDisabledBuildActionButtons', (d, m) => [m, 'Ulepsz', 'Za mało Pracy', { showPurchase: false }], 'mount'],
    ['appendBuildingRequirementChipSections: wszystkie rodzaje', 'appendBuildingRequirementChipSections', (d, m) => [m, [
      { label: 'Żelazo', met: true, kind: 'stock' },
      { label: 'Kopalnie', met: false, kind: 'tech' },
      { label: 'Mur', met: true, kind: 'other' },
    ], (g) => g.map(c => `<s>${c.label}</s>`).join('')], 'mount'],
    ['appendBuildingRequirementChipSections: tylko surowce', 'appendBuildingRequirementChipSections', (d, m) => [m, [
      { label: 'Złoto', met: false, kind: 'stock' },
    ], (g) => g.map(c => `<s>${c.label}</s>`).join('')], 'mount'],
    ['appendBuildingRequirementChipSections: pusta lista -> false', 'appendBuildingRequirementChipSections', (d, m) => [m, [], (g) => ''], 'ret'],
    ['techIconHintSpan: znana technologia', 'techIconHintSpan', () => ['Rolnictwo'], 'ret'],
    ['techIconHintSpan: inheritColor, 20px', 'techIconHintSpan', () => ['Rolnictwo', 20, { inheritColor: true }], 'ret'],
    ['techIconHintSpan: pusta nazwa', 'techIconHintSpan', () => [null], 'ret'],
    ['techIconHintSpan: nieznana technologia', 'techIconHintSpan', () => ['Nie ma takiej technologii XYZ'], 'ret'],
  ];

  // Delegacja zdarzen (bindTechHintLinkDelegation, pin:7268): swiezy modul na przypadek (flaga per instancja),
  // swiezy dokument; pin wola showTechDiscoveryNotice (stub zapisuje do logu), v2 dostaje openPreview.
  const bindCases = [
    ['bind: klik w ikone-link', [['click', '.cp-tech-hint-link']]],
    ['bind: klik poza linkiem', [['click', '.other']]],
    ['bind: Enter na linku', [['key', '.cp-tech-hint-link', 'Enter']]],
    ['bind: spacja na linku', [['key', '.cp-tech-hint-link', ' ']]],
    ['bind: inny klawisz', [['key', '.cp-tech-hint-link', 'a']]],
    ['bind: dwukrotne bindowanie + klik', [['click', '.cp-tech-hint-link']], true],
  ];
  const bindRun = async (modPath, isPin, idx, events, twice) => {
    const mod = await import(pathToFileURL(modPath).href + `?case=${idx}`);
    const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"><span class="cp-tech-hint-link" data-tech-hint-name="Rolnictwo">R</span><span class="other">o</span></div></body></html>', {
      url: 'http://localhost/',
      pretendToBeVisual: true,
      virtualConsole: vc,
    });
    const doc = dom.window.document;
    const log = [];
    if (isPin) mod.__setNoticeLog(log);
    const prevDoc = globalThis.document;
    globalThis.document = doc;
    try {
      const open = (n) => log.push(`open:${n}:preview:1`);
      if (isPin) mod.bindTechHintLinkDelegation();
      else mod.bindTechHintLinkDelegation(open);
      if (twice) {
        if (isPin) mod.bindTechHintLinkDelegation();
        else mod.bindTechHintLinkDelegation(open);
      }
      for (const ev of events) {
        const target = doc.querySelector(ev[1]);
        if (ev[0] === 'click') target.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
        else {
          const ke = new dom.window.KeyboardEvent('keydown', { key: ev[2], bubbles: true, cancelable: true });
          target.dispatchEvent(ke);
          log.push(`prevented:${ke.defaultPrevented}`);
        }
      }
      return log.join(',') || '(brak)';
    } catch (e) {
      return `THROW: ${String(e?.message ?? e)}`;
    } finally {
      globalThis.document = prevDoc;
    }
  };

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
      const ret = mod[fnName](...buildArgs(doc, mount, log, !!isPin));
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
  for (let k = 0; k < bindCases.length; k++) {
    const [name, events, twice] = bindCases[k];
    const a = await bindRun(pinJs, true, k, events, !!twice);
    const b = await bindRun(v2Js, false, k, events, !!twice);
    results.push({ name, ok: a === b, pin: a, v2: b });
  }
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
