#!/usr/bin/env node
/**
 * run-k08c-podzial-pin.mjs — harness WYKONUJĄCY `renderPodzialPracy` pinu `edb8fb56` (partia `podzial` K08C, runda 2)
 * względem portu `src/ui/cityPanel/k08c-podzial.ts`, po wiringu K08C (`controller/k08cWiring.ts`).
 *
 * PIN-EXEC (verbatim): pin `gra/src/ui/cityPanel.ts:5112-5188` `renderPodzialPracy`. Zależności obu wersji identyczne
 * (te same importy portu w tej samej liście co nagłówek partii; `appendPodzialPracyInfo` = port K06B; `buildPracaDetailCard`
 * = port K08C-praca). Różnica testowana = ciało funkcji (wrapper). Scenariusze: brak wywołania zwrotnego, gracz bez/z
 * widokiem, rywal (podgląd), przełącznik „Indywidualne", podział z zapisu/hooka.
 * Porównanie: outerHTML montażu + wyjątek (pin vs port). Kotwice: literały pinu obecne w linii.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k08c-podzial-pin.mjs --pin-dir <PIN_DIR> [--port <plik.ts>] [--tmp-dir <katalog>]
 * EXIT 0 <=> brak różnic; 1 <=> >=1 różnica; 2 <=> błąd harnessu.
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
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run-k08c-podzial-pin.mjs --pin-dir <PIN_DIR> [--port <plik.ts>] [--tmp-dir <katalog>]');
  process.exit(2);
}
const PORT_FILE = resolve(argOf('--port') ?? join(V2_ROOT, 'src/ui/cityPanel/k08c-podzial.ts'));
const PIN_LINES = readFileSync(join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/);
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'k08c-podzial-pin-'));
const P = (rel) => JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel', rel));
const results = [];
const check = (id, pin, ok) => results.push({ id, pin, ok: ok === true });

let exitCode = 0;
try {
  // ─── zakres pinu i kotwice ───────────────────────────────────────────────────────────────────────────────────────
  const A = 5112;
  const B = 5188;
  const okStart = PIN_LINES[A - 1]?.includes('function renderPodzialPracy(') ?? false;
  const okEnd = PIN_LINES[B - 1] === '}';
  check('pin.range.renderPodzialPracy', `cityPanel.ts:${A}-${B}`, okStart && okEnd);
  if (!okStart || !okEnd) throw new Error(`zakres renderPodzialPracy ${A}-${B} nie pasuje do pinu`);
  const pinText = PIN_LINES.slice(A - 1, B);
  const ANCHORS = [
    [5118, 'if (!cfg.onPodzialPracyChange) return;'],
    [5163, "inp.setAttribute('aria-label', 'Podział przyrostu Pracy tego miasta: budynki versus ulepszenia (pula imperium)');"],
    [5187, 'appendPodzialPracyInfo(mount, city, view, data);'],
  ];
  ANCHORS.forEach(([line, lit], i) => check(`pin.anchor.${i + 1}`, `cityPanel.ts:${line} ${lit}`,
    PIN_LINES[line - 1]?.includes(lit) ?? false));

  // ─── bundle ──────────────────────────────────────────────────────────────────────────────────────────────────────
  const setup = join(TMP, 'setup.js');
  writeFileSync(setup, [
    `import { installStaticCatalog } from ${JSON.stringify(join(V2_ROOT, 'src/controller/staticCatalog.ts'))};`,
    `import { MOCK_STATIC_CATALOG } from ${JSON.stringify(join(V2_ROOT, 'src/controller/mockCatalog.ts'))};`,
    'installStaticCatalog(MOCK_STATIC_CATALOG);',
    '',
  ].join('\n'));
  const pinExec = join(TMP, 'pin-exec.ts');
  writeFileSync(pinExec, [
    `import { cityPanelChipIconWrap, cpInlineIcons } from ${P('k01a-fundament.ts')};`,
    `import { el } from ${P('k01b-dom.ts')};`,
    `import { cfg, isMeCity, rerender, HANDEL_PCT_STEP, appendIndywidualneToggle, type City, type GameData } from ${P('k05b-host.ts')};`,
    `import type { CityView } from ${P('k01b-t.ts')};`,
    `import { PULA_LBL, PULA_LBL_PELNA } from ${P('k01b-t.ts')};`,
    `import { appendSectionTitleWithDetails } from ${P('k08b-title.ts')};`,
    `import { appendPodzialPracyInfo } from ${P('k06b-jednostki.ts')};`,
    `import { buildPracaDetailCard } from ${P('k08c-praca.ts')};`,
    `import {`,
    `  MAX_PODZIAL_PRACY_BUDYNKI_PERCENT, MAX_PROCENT_PULI_IMPERIUM, MIN_PODZIAL_PRACY_BUDYNKI_PERCENT,`,
    `  cityPracaSplit, clampPodzialPracyBudynkiPercent, procentPuliImperiumZBudynkow, readPodzialPracy,`,
    `} from ${P('k08c-deps.ts')};`,
    '// --- verbatim pin edb8fb56 gra/src/ui/cityPanel.ts:5112-5188 ---',
    ...pinText,
    '// --- koniec verbatim ---',
    'export { renderPodzialPracy };',
    '',
  ].join('\n'));
  // Stan hosta testowego: zmieniany między scenariuszami (ta sama referencja dla wiringu i cfg).
  const cfgObj = {
    getBuiltBuildingIds: () => [],
    getCities: () => [],
    getTreasury: () => 123,
    onPodzialPracyChange: undefined,
    getPodzialPracyOverride: () => false,
    onPodzialPracyOverrideToggle: undefined,
  };
  const hostState = { hook: undefined, engine: 60 };
  const entry = join(TMP, 'entry.js');
  writeFileSync(entry, [
    `import ${JSON.stringify(setup)};`,
    `import { installK08cWiring } from ${JSON.stringify(join(V2_ROOT, 'src/controller/k08cWiring.ts'))};`,
    `import * as pinMod from ${JSON.stringify(pinExec)};`,
    `import * as portMod from ${JSON.stringify(PORT_FILE)};`,
    'export const install = (cfgRef, hostState) => installK08cWiring({',
    '  rerender: () => undefined,',
    '  cfg: cfgRef,',
    '  getPodzialPracy: () => hostState.hook,',
    '  engineSuwaakPracaBudynki: () => hostState.engine,',
    '  splitPraca: (praca, frac) => { const d = Math.round(praca * frac); return { total: praca, doBudynkow: d, doPuli: praca - d }; },',
    '  computeView: () => null,',
    '  readPodzialHandlu: () => ({ procentNauka: 0, procentLuksus: 0 }),',
    '  isMeCity: (o) => o === 0,',
    '  adjustHandelSplit: (s) => s,',
    '  freshWealthState: () => ({ poziom: 0 }),',
    '  stockResourceLabel: (k) => k,',
    // Silnik (atrapy testowe, identyczne dla pinu i portu): kolejka pusta; ETA z pinu `game/production.ts:1133`.
    '  rules: {',
    '    getProd: () => ({ rekrutacja: [], kolejka: [] }),',
    '    etaTurns: (koszt, postep, praca) => (praca > 0 ? Math.max(1, Math.ceil(Math.max(0, koszt - postep) / praca)) : null),',
    '    formatManpower: (n) => String(n),',
    '  },',
    '});',
    'export const pin = pinMod;',
    'export const port = portMod;',
    '',
  ].join('\n'));
  const out = join(TMP, 'bundle.mjs');
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    outfile: out,
    logLevel: 'silent',
    plugins: [{
      name: 'raw-and-glob',
      setup(b) {
        b.onResolve({ filter: /\?raw$/ }, (a) => ({ path: resolve(dirname(a.importer), a.path.replace(/\?raw$/, '')), namespace: 'raw' }));
        b.onLoad({ filter: /.*/, namespace: 'raw' }, (a) => ({ contents: `export default ${JSON.stringify(readFileSync(a.path, 'utf8'))};`, loader: 'js' }));
        b.onLoad({ filter: /\.ts$/ }, (a) => {
          if (!a.path.startsWith(join(V2_ROOT, 'src') + '/')) return undefined;
          const src = readFileSync(a.path, 'utf8');
          if (!src.includes('import.meta.glob(')) return undefined;
          return { contents: src.split('import.meta.glob(').join('((..._g) => ({}))('), loader: 'ts' };
        });
      },
    }],
  });

  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  const M = await import(pathToFileURL(out).href);
  // Wiring: cfg = obiekt testowy (proxy czyta go przy każdym wywołaniu).
  const cfgRef = cfgObj;
  M.install(cfgRef, hostState);

  const mkView = (praca) => ({ praca, pieniadz: 2, nauka: 0, kultura: 0, zywnoscNetto: 0 });
  const scenarios = [
    ['noCallback', { cb: false, owner: 0, view: null, hook: undefined }],
    ['player.noView', { cb: true, owner: 0, view: null, hook: undefined }],
    ['player.view', { cb: true, owner: 0, view: mkView(40), hook: undefined }],
    ['player.hook80', { cb: true, owner: 0, view: mkView(40), hook: { procentBudynki: 80 } }],
    ['player.override', { cb: true, owner: 0, view: mkView(40), hook: undefined, override: true }],
    ['rival.view', { cb: true, owner: 1, view: mkView(40), hook: undefined }],
  ];
  for (const [id, sc] of scenarios) {
    const city = { id: 7, ownerId: sc.owner, name: 'A' };
    // Zapis suwaka (wywołanie zwrotne hosta) zbierane w `cbCalls` — porównywane pin vs port po zdarzeniu `input`.
    const cbCalls = [];
    const apply = () => {
      cbCalls.length = 0;
      cfgRef.onPodzialPracyChange = sc.cb ? ((cid, split) => { cbCalls.push([cid, split.procentBudynki]); }) : undefined;
      cfgRef.onPodzialPracyOverrideToggle = sc.override ? (() => undefined) : undefined;
      cfgRef.getPodzialPracyOverride = () => sc.override === true;
      hostState.hook = sc.hook;
    };
    const drive = (mount) => {
      const inp = mount.querySelector('input[type=range]');
      if (!inp) return null;
      inp.value = '70';
      inp.dispatchEvent(new window.Event('input'));
      return JSON.stringify(cbCalls);
    };
    apply();
    const pinMount = document.createElement('div');
    let pinErr = null;
    try { M.pin.renderPodzialPracy(pinMount, city, sc.view, { units: [] }); } catch (e) { pinErr = String(e); }
    const pinCb = drive(pinMount);
    apply();
    const portMount = document.createElement('div');
    let portErr = null;
    try { M.port.renderPodzialPracy(portMount, city, sc.view, { units: [] }); } catch (e) { portErr = String(e); }
    const portCb = drive(portMount);
    check(`exec.${id}`, `renderPodzialPracy ${id}: outerHTML ${pinMount.innerHTML.length} znaków, wyjątek pin=${pinErr} port=${portErr}`,
      pinErr === portErr && portMount.innerHTML === pinMount.innerHTML);
    if (sc.cb) check(`exec.${id}.nonEmpty`, `${id}: montaż niepusty`, pinMount.innerHTML.length > 0);
    if (sc.cb && sc.owner === 0) {
      check(`exec.${id}.callback`, `${id}: zdarzenie input suwaka => zapis procentBudynki=70 (pin=port)`,
        pinCb === portCb && pinCb === JSON.stringify([[7, 70]]));
    }
  }
  // Kotwica treści: suwak tylko dla gracza (input range istnieje w montażu gracza, nie w podglądzie rywala).
  {
    cfgRef.onPodzialPracyChange = () => undefined;
    hostState.hook = undefined;
    const mPlayer = document.createElement('div');
    M.port.renderPodzialPracy(mPlayer, { id: 7, ownerId: 0, name: 'A' }, null, null);
    const mRival = document.createElement('div');
    M.port.renderPodzialPracy(mRival, { id: 7, ownerId: 1, name: 'A' }, null, null);
    check('exec.anchor.sliderOnlyPlayer', 'suwak <input type=range> tylko w montażu gracza',
      mPlayer.querySelectorAll('input[type=range]').length === 1 && mRival.querySelectorAll('input[type=range]').length === 0);
  }

  const fails = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.id} | ${r.pin}`);
  console.log(`\nk08c-podzial-pin: ${results.length - fails.length}/${results.length} zgodnych`);
  exitCode = fails.length === 0 ? 0 : 1;
} catch (e) {
  console.error('BLAD-HARNESU:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  rmSync(TMP, { recursive: true, force: true });
}
process.exit(exitCode);
