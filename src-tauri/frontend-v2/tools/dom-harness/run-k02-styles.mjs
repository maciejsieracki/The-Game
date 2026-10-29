#!/usr/bin/env node
/**
 * run-k02-styles.mjs — harness porównania DOM: `ensureCityPanelStyles` (`src/ui/cityPanel/k02-styles.ts`, P5.8 K02,
 * runda 1 `R-RUSTPORT-P5-8-CITYPANEL-K02-Q1`) w frontend-v2 vs funkcja `ensureStyles` z pinu web `edb8fb56`
 * (`gra/src/ui/cityPanel.ts` linie 1948–3009, stałe 1755–1773).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>
 *   node tools/dom-harness/run-k02-styles.mjs --pin-dir <PIN_DIR> [--json <plik>]
 * EXIT 0 ⇔ 0 różnic; 1 ⇔ ≥1 różnica; 2 ⇔ błąd harnessu.
 *
 * Strona pinu: z pliku pinu wycinane są linie 1755–1773 (stałe) i 1948–3009 (funkcja), funkcja eksportowana pod nazwą
 * `ensureCityPanelStyles`, a `el('style')` zastąpione `document.createElement('style')` (pin:863 bez cls/html jest
 * tym samym — ZAŁOŻENIE P5.8-K02-Z2). Pozostałe importy pochodzą z drzewa pinu (te same nazwy modułów).
 * Dla obu stron: kanoniczna serializacja `document.head` po 1. i 2. wywołaniu, przy wstępnie wstawionych starych
 * elementach `civ-city-screen-css-v2`/`civ-city-screen-css` (usuwane) i istniejącym `STYLE_ID` (nadpisywany).
 */
import { mkdtempSync, writeFileSync, readFileSync, rmSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { bundle } from './build.mjs';

/** Znajduje wygenerowany plik .js po nazwie (układ katalogów zależy od outbase esbuild). */
function findJs(dir, name) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) {
      const r = findJs(p, name);
      if (r) return r;
    } else if (n === name) return p;
  }
  return null;
}

/** esbuild przy jednym wejściu (outbase = pełna ścieżka pliku) zapisuje plik wejściowy jako `<outdir>/.js`; chunki mają prefiks chunk-. */
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
  console.error('Użycie: node tools/dom-harness/run-k02-styles.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const PIN_SRC = resolve(PIN_DIR, 'gra/src');
const PIN_FILE = join(PIN_SRC, 'ui/cityPanel.ts');
const V2_FILE = join(V2_ROOT, 'src/ui/cityPanel/k02-styles.ts');
// P5.8 SCAL: k02-styles importuje stale z k01a-fundament (-> uiParams -> katalog statyczny): katalog
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
const PROBE_NAME = '__k02_pin_probe.ts';

// ─── wycinek pinu → moduł probe (po stronie pinu, w drzewie tymczasowym) ─────
const pinLines = readFileSync(PIN_FILE, 'utf8').split('\n');
const consts = pinLines.slice(1754, 1773).join('\n'); // pin 1755–1773
const fnSrc = pinLines.slice(1947, 3009).join('\n'); // pin 1948–3009
if (!/^function ensureStyles\(\): void \{/.test(pinLines[1947])) {
  console.error('Harness: linia pin:1948 nie jest nagłówkiem ensureStyles — pin inny niż edb8fb56?');
  process.exit(2);
}
if (!/^\}$/.test(pinLines[3008])) {
  console.error('Harness: linia pin:3009 nie zamyka ensureStyles.');
  process.exit(2);
}
const probeSrc = [
  `import { ensureBrandRootTokens, CIV_BRAND_SCOPE_VARS } from './brandTokenVars';`,
  `import { resourceColorClassCss } from './resourceColors';`,
  `import { UNIT_INFOGRAPHIC_CSS } from './unitInfographic';`,
  `import { UNIT_RECRUIT_CARD_CSS } from './unitRecruitCard';`,
  consts,
  fnSrc
    .replace('function ensureStyles(): void {', 'export function ensureCityPanelStyles(): void {')
    .replace("style = el('style');", "style = document.createElement('style');"),
  '',
].join('\n');

const tmp = mkdtempSync(join(tmpdir(), 'p58k02-harness-'));
let exitCode = 0;
try {
  // Probe musi leżeć w drzewie pinu, żeby importy `./…` rozwiązały się do plików pinu.
  const probePath = join(PIN_SRC, 'ui', PROBE_NAME);
  writeFileSync(probePath, probeSrc);
  const pinOut = join(tmp, 'pin');
  const v2Out = join(tmp, 'v2');
  await bundle([probePath], pinOut);
  await bundle([V2_FILE, SC_SRC], v2Out);
  const pinJs = entryJs(pinOut);
  const v2Js = findFile(v2Out, 'k02-styles.js');
  if (!pinJs || !v2Js) throw new Error('brak wygenerowanego bundla: ' + pinJs + ' ' + v2Js);
  const SC = await import(pathToFileURL(findFile(v2Out, 'staticCatalog.js')).href);
  SC.installStaticCatalog({ uiParams: JSON.parse(readFileSync(join(PIN_DIR, 'gra/data/ui-params.json'), 'utf8')) });
  const pinMod = await import(pathToFileURL(pinJs).href);
  const v2Mod = await import(pathToFileURL(v2Js).href);

  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', (e) => errors.push(String(e?.message ?? e).split('\n')[0]));

  // Każda strona w osobnym dokumencie jsdom; zestaw elementów przed wywołaniem identyczny.
  const scenario = (fn, withStale = true) => {
    const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
      url: 'http://localhost/',
      pretendToBeVisual: true,
      virtualConsole: vc,
    });
    const doc = dom.window.document;
    const snap = { before: [], afterFirst: null, afterSecond: null, styleCount: [] };
    const headIds = () => [...doc.head.children].map((n) => `${n.tagName}#${n.id}`);
    // Stare elementy, które kod ma usunąć, i poprzedni STYLE_ID do nadpisania.
    const legacy = doc.createElement('style');
    legacy.id = 'civ-city-screen-css-v2';
    legacy.textContent = '/*legacy-v2*/';
    doc.head.appendChild(legacy);
    const legacy2 = doc.createElement('style');
    legacy2.id = 'civ-city-screen-css';
    legacy2.textContent = '/*legacy*/';
    doc.head.appendChild(legacy2);
    if (withStale) {
      // Istniejący STYLE_ID (ścieżka „nadpisz”); bez niego — ścieżka „utwórz” (createElement) jest jedyną.
      const pre = doc.createElement('style');
      pre.id = 'civ-city-screen-css-w3-hudfix';
      pre.textContent = '/*stale-id*/';
      doc.head.appendChild(pre);
    }
    snap.before = headIds();
    // Globalne `document` dla kodu modułu.
    const prevDoc = globalThis.document;
    globalThis.document = doc;
    try {
      fn();
      snap.afterFirst = { head: headIds(), css: doc.getElementById('civ-city-screen-css-w3-hudfix')?.textContent ?? null, count: doc.querySelectorAll('style#civ-city-screen-css-w3-hudfix').length };
      fn();
      snap.afterSecond = { head: headIds(), css: doc.getElementById('civ-city-screen-css-w3-hudfix')?.textContent ?? null, count: doc.querySelectorAll('style#civ-city-screen-css-w3-hudfix').length };
    } finally {
      globalThis.document = prevDoc;
    }
    return snap;
  };

  const pinSnap = scenario(() => pinMod.ensureCityPanelStyles());
  const v2Snap = scenario(() => v2Mod.ensureCityPanelStyles());
  const pinFresh = scenario(() => pinMod.ensureCityPanelStyles(), false);
  const v2Fresh = scenario(() => v2Mod.ensureCityPanelStyles(), false);

  const cases = [];
  const check = (name, a, b) => {
    const ok = JSON.stringify(a) === JSON.stringify(b);
    cases.push({ name, ok, pin: ok ? undefined : a, v2: ok ? undefined : b });
    return ok;
  };
  check('head przed wywołaniem', pinSnap.before, v2Snap.before);
  check('head po 1. wywołaniu (bez identyfikatorów)', pinSnap.afterFirst.head, v2Snap.afterFirst.head);
  check('liczba stylów STYLE_ID po 1. wywołaniu', pinSnap.afterFirst.count, v2Snap.afterFirst.count);
  check('CSS po 1. wywołaniu (pełny tekst)', pinSnap.afterFirst.css, v2Snap.afterFirst.css);
  check('head po 2. wywołaniu', pinSnap.afterSecond.head, v2Snap.afterSecond.head);
  check('liczba stylów STYLE_ID po 2. wywołaniu', pinSnap.afterSecond.count, v2Snap.afterSecond.count);
  check('CSS po 2. wywołaniu (pełny tekst)', pinSnap.afterSecond.css, v2Snap.afterSecond.css);
  check('CSS niepusty', pinSnap.afterFirst.css !== null && pinSnap.afterFirst.css.length > 1000, true);
  check('[świeży dokument] head przed wywołaniem', pinFresh.before, v2Fresh.before);
  check('[świeży dokument] head po 1. wywołaniu', pinFresh.afterFirst.head, v2Fresh.afterFirst.head);
  check('[świeży dokument] liczba stylów STYLE_ID po 1. wywołaniu', pinFresh.afterFirst.count, v2Fresh.afterFirst.count);
  check('[świeży dokument] CSS po 1. wywołaniu', pinFresh.afterFirst.css, v2Fresh.afterFirst.css);
  check('[świeży dokument] head po 2. wywołaniu', pinFresh.afterSecond.head, v2Fresh.afterSecond.head);
  check('[świeży dokument] CSS po 2. wywołaniu', pinFresh.afterSecond.css, v2Fresh.afterSecond.css);

  const diffs = cases.filter((c) => !c.ok).length;
  const result = { pin: PIN_DIR, cssLength: { pin: pinSnap.afterFirst.css?.length, v2: v2Snap.afterFirst.css?.length }, jsdomErrors: errors.length, cases: cases.map(({ name, ok }) => ({ name, ok })), diffs };
  console.log(`run-k02-styles: asercji=${cases.length} różnic=${diffs} długośćCSS pin=${result.cssLength.pin} v2=${result.cssLength.v2} jsdomErrors=${errors.length}`);
  for (const c of cases.filter((x) => !x.ok)) console.log(`  RÓŻNICA: ${c.name}`);
  if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(result, null, 2));
  exitCode = diffs > 0 ? 1 : 0;
} catch (e) {
  console.error('run-k02-styles: błąd harnessu:', e?.stack ?? e);
  exitCode = 2;
} finally {
  try {
    rmSync(join(PIN_SRC, 'ui', PROBE_NAME), { force: true });
  } catch {}
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(exitCode);
