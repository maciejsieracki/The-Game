#!/usr/bin/env node
/**
 * run-k08d-religia-pin.mjs — harness WYKONUJĄCY funkcje pinu dla partii `religia` K08D (P5-8,
 * R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 3, NAPRAW 3c).
 *
 * PIN-EXEC: trzy funkcje pinu `edb8fb56` (`gra/src/ui/cityPanel.ts`) przepisane BEZ ZMIAN TEKSTU z linii pinu:
 *   3814-3834  `appendCompositionBlock`
 *   5992-6039  `buildTopBarReligiaDetailCard`
 *   4112-4220  `renderReligia`
 * PORT: `src/ui/cityPanel/k08d-religia.ts` (te same treści po bramce `verify-k08d-copies.mjs --batch religia`).
 *
 * Zależności wspólne (ten sam moduł dla pin-exec i portu): helpery DOM z portu K01/K02/K03/K08B, `cfg` z `k05b-host`,
 * delegaty reguł z `k08d-deps` (`religiaSzPunkty`, `religiaXRelTop`, `resolveEmpireSnap`) składane przez
 * `controller/k08dWiring.ts` z hosta TEST (atrapy z JAWNYMI wzorami, nie reguły gry; P5.13).
 * Stubowane wyłącznie nazwy pinu, których wynik NIE wpływa na HTML (`gameData`, `activeMap`, `loadReligionParams`,
 * `FALLBACK_RELIGION_PARAMS` — ostatnie dwie: martwy odczyt `relParams`) oraz skala epoki (`kultReligScaleForEra`,
 * `loadSocietyScaleParams`, wzór testowy `era*100+7`, spójny z atrapą `religiaXRelTop`).
 *
 * Porównanie: innerHTML montażu (`renderReligia`) i outerHTML karty (`buildTopBarReligiaDetailCard`,
 * `appendCompositionBlock`) muszą być identyczne znak po znaku.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k08d-religia-pin.mjs --pin-dir <PIN_DIR> [--tmp-dir <katalog poza repo>]
 * EXIT 0 <=> brak różnic i kotwice zgodne; 1 <=> >=1 różnica; 2 <=> błąd harnessu.
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
  console.error('Użycie: node tools/dom-harness/run-k08d-religia-pin.mjs --pin-dir <PIN_DIR> [--tmp-dir <katalog>]');
  process.exit(2);
}
const PIN_LINES = readFileSync(join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/);
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'k08d-religia-pin-'));

const results = [];
const check = (id, pin, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  results.push({ id, pin, ok });
};

/** Zakresy pinu wykonywane verbatim: [nazwa, a, b, kotwica startu, koniec]. */
const PIN_RANGES = [
  ['appendCompositionBlock', 3814, 3834, 'function appendCompositionBlock(', '}'],
  ['buildTopBarReligiaDetailCard', 5992, 6039, 'function buildTopBarReligiaDetailCard(', '}'],
  ['renderReligia', 4112, 4220, 'function renderReligia(', '}'],
];
/** PIN-ANCHOR: literały, które muszą występować w cytowanych liniach pinu. */
const PIN_ANCHORS = [
  [4141, 'const relSzPkt = relState ? religiaSzPunkty(relState.wplywSzczescie, city.ownerId) : 0;'],
  [4168, "label: 'Państwo',"],
  [4208, "'Brak rozpisanych składników religii w tym mieście.',"],
  [6026, 'const xRelTop = kultReligScaleForEra('],
  [6005, 'const relParams = data'],
  [4132, "'Brak danych silnika (hak getReligionState).'"],
];

let exitCode = 0;
try {
  const pinExecText = [];
  for (const [name, a, b, start, end] of PIN_RANGES) {
    const okStart = PIN_LINES[a - 1]?.includes(start) ?? false;
    const okEnd = PIN_LINES[b - 1] === end;
    check(`pin.range.${name}`, `cityPanel.ts:${a}-${b}`, [okStart, okEnd], [true, true]);
    if (!okStart || !okEnd) throw new Error(`zakres ${name} ${a}-${b} nie pasuje do pinu`);
    pinExecText.push(...PIN_LINES.slice(a - 1, b));
  }
  PIN_ANCHORS.forEach(([line, lit], i) => {
    const hit = PIN_LINES[line - 1]?.includes(lit.trim()) ?? false;
    check(`pin.anchor.${i + 1}`, `cityPanel.ts:${line} ${lit.slice(0, 40)}`, hit, true);
  });

  const P = (f) => JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel', f));
  const pinExec = join(TMP, 'pin-exec.ts');
  writeFileSync(
    pinExec,
    [
      `import { cityPanelChipIcon, cityPanelChipIconWrap, PH, pctSubheadHtml, shortIndLabel, signed } from ${P('k01a-fundament.ts')};`,
      `import { el, appendDetailSection, appendDetailAlgo, gridDetailRow } from ${P('k01b-dom.ts')};`,
      `import { appendDetailGrid } from ${P('k03-detail.ts')};`,
      `import { appendTabIndicators } from ${P('k02-units.ts')};`,
      `import { appendW4SignedBreakdownSections } from ${P('k02-breakdown.ts')};`,
      `import { cfg } from ${P('k05b-host.ts')};`,
      `import { appendSectionTitleWithDetails } from ${P('k08b-title.ts')};`,
      `import { religiaSzPunkty, resolveEmpireSnap } from ${P('k08d-deps.ts')};`,
      '// Stuby nazw pinu (wynik NIE wpływa na HTML): gameData/activeMap (port dostaje data jako parametr),',
      '// loadReligionParams/FALLBACK_RELIGION_PARAMS (martwy odczyt relParams), skala epoki (wzór testowy era*100+7).',
      'const gameData = (): null => null;',
      'const activeMap = null;',
      'const loadReligionParams = (..._a: unknown[]): Record<string, never> => ({});',
      'const FALLBACK_RELIGION_PARAMS = {};',
      'const kultReligScaleForEra = (era: number, scale: number): number => era * 100 + scale;',
      'const loadSocietyScaleParams = (..._a: unknown[]): number => 7;',
      '// --- verbatim pin edb8fb56 gra/src/ui/cityPanel.ts (zakresy: 3814-3834, 5992-6039, 4112-4220) ---',
      ...pinExecText,
      '// --- koniec verbatim ---',
      'export { appendCompositionBlock, buildTopBarReligiaDetailCard, renderReligia };',
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
    [
      `import ${JSON.stringify(setup)};`,
      `import { installK08cWiring } from ${JSON.stringify(join(V2_ROOT, 'src/controller/k08cWiring.ts'))};`,
      `import { installK08dWiring } from ${JSON.stringify(join(V2_ROOT, 'src/controller/k08dWiring.ts'))};`,
      `import * as pinMod from ${JSON.stringify(pinExec)};`,
      `import * as portReligia from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k08d-religia.ts'))};`,
      `import * as k08dDepsMod from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k08d-deps.ts'))};`,
      '// Hosty TEST: wartości = JAWNE wzory testowe (nie reguły gry; P5.13). Stan religii = dane wejściowe scenariuszy.',
      'export const cfgObj: Record<string, any> = {',
      '  getBuiltBuildingIds: () => [], getCities: () => [], getEpoch: (o: number) => (o === 0 ? 3 : 1), difficulty: "normal",',
      '  getReligionState: () => undefined,',
      '};',
      'export const k08c = installK08cWiring({',
      '  rerender: () => undefined,',
      '  cfg: cfgObj as any,',
      '  engineSuwaakPracaBudynki: () => 60,',
      '  splitPraca: (praca: number, frac: number) => ({ total: praca, doBudynkow: Math.round(praca * frac), doPuli: praca - Math.round(praca * frac) }),',
      '  computeView: () => null,',
      '  readPodzialHandlu: (c: any) => (c.__split ?? { procentPieniadz: 50, procentNauka: 30, procentLuksus: 20 }) as any,',
      '  isMeCity: (o: number) => o === 0,',
      '  adjustHandelSplit: (s: any) => s,',
      '  freshWealthState: () => ({ poziom: 0 }),',
      '  stockResourceLabel: (k: string) => k,',
      '  getEmpireHud: (o: number) => (o === 0 ? { stateReligion: "Kult", religionStock: 5, religionRate: 2, religionSharePct: 60 } : undefined),',
      '  rules: {} as any,',
      '} as any);',
      'export const k08d = installK08dWiring({',
      '  mennicaGate: () => ({ maMennicaBudynek: false, mennicaAktywna: false, mennicaSpiZBrakuZlota: false }),',
      '  // K08D-Z12 (atrapy TESTOWE): punkty Szczęścia = wskaźnik*10 + właściciel; skala karty = era*100+7 (zgodnie z pin-exec).',
      '  religiaSzPunkty: (w: number, o: number) => Math.round(w * 10) + o,',
      '  religiaXRelTop: (o: number) => (cfgObj.getEpoch?.(o) ?? 1) * 100 + 7,',
      '  buildEconParams: () => ({ korupcjaWspolczynnikDystansu: 0, korupcjaWspolczynnikMiast: 0, korupcjaCap: 0, mennicaMnoznikPoWalucie: 1 }),',
      '  cityHasBibliotekaLine: () => false,',
      '  mnoznikHandelPieniadzForCivByDifficulty: (_k: unknown, _c: unknown, _d: string, fb: number) => fb,',
      '  computeTradeRouteBuildingBonusByCity: () => new Map<number, number>(),',
      '});',
      'export const pin = pinMod;',
      'export const port = { appendCompositionBlock: portReligia.appendCompositionBlock, buildTopBarReligiaDetailCard: portReligia.buildTopBarReligiaDetailCard, renderReligia: portReligia.renderReligia };',
      'export const depsMod = k08dDepsMod;',
      'export const cfgAccess = cfgObj;',
      '',
    ].join('\n'),
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
        name: 'raw-svg',
        setup(b) {
          b.onResolve({ filter: /\?raw$/ }, (a) => ({
            path: resolve(dirname(a.importer), a.path.replace(/\?raw$/, '')),
            namespace: 'raw',
          }));
          b.onLoad({ filter: /.*/, namespace: 'raw' }, (a) => ({
            contents: `export default ${JSON.stringify(readFileSync(a.path, 'utf8'))};`,
            loader: 'js',
          }));
          b.onLoad({ filter: /\.ts$/ }, (a) => {
            if (!a.path.startsWith(join(V2_ROOT, 'src') + '/')) return undefined;
            const src = readFileSync(a.path, 'utf8');
            if (!src.includes('import.meta.glob(')) return undefined;
            return {
              contents: src.split('import.meta.glob(').join('((..._g: any[]) => ({} as Record<string, any>))('),
              loader: 'ts',
            };
          });
        },
      },
    ],
  });

  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  const mod = await import(pathToFileURL(out).href);
  const doc = dom.window.document;

  const city = { id: 7, ownerId: 0, name: 'A' };
  const view = { praca: 40, pieniadz: 5, nauka: 3, kultura: 2, handelBrutto: 30 };
  const stateFull = {
    dominujaca: 'Kult', udzialPct: 60, wplywSzczescie: 0.4, przyrostWiernych: 3, stateReligion: 'Kult',
    sklad: [{ name: 'Kult', pct: 60 }, { name: 'Obcy', pct: 40 }],
    zrodla: [{ nazwa: 'Świątynia', wartosc: 2 }],
  };

  /** Scenariusze: [id, ustawienie cfg/stanu, wywołanie: 'mount' | 'card'] (card = buildTopBarReligiaDetailCard). */
  const SCENARIOS = [
    ['rel.view.state', () => { mod.cfgAccess.getReligionState = () => stateFull; }, 'mount', view],
    ['rel.view.noState', () => { mod.cfgAccess.getReligionState = () => undefined; }, 'mount', view],
    ['rel.noView.state', () => { mod.cfgAccess.getReligionState = () => stateFull; }, 'mount', null],
    ['rel.noView.noState', () => { mod.cfgAccess.getReligionState = () => undefined; }, 'mount', null],
    ['rel.view.stateNoSklad', () => { mod.cfgAccess.getReligionState = () => ({ ...stateFull, stateReligion: null, sklad: [], przyrostWiernych: null }); }, 'mount', view],
    ['card.state', () => { mod.cfgAccess.getReligionState = () => stateFull; }, 'card', view],
    ['card.noState', () => { mod.cfgAccess.getReligionState = () => undefined; }, 'card', view],
  ];

  for (const [id, setup, kind, v] of SCENARIOS) {
    setup();
    const empire = mod.k08c && { stateReligion: 'Kult', religionStock: 5, religionRate: 2, religionSharePct: 60 };
    if (kind === 'mount') {
      const mPin = doc.createElement('div');
      mod.pin.renderReligia(mPin, city, v);
      const mPort = doc.createElement('div');
      mod.port.renderReligia(mPort, city, v, null);
      check(`exec.${id}`, `pin-exec vs port: renderReligia innerHTML (${mPin.innerHTML.length} znaków)`, mPort.innerHTML, mPin.innerHTML);
      check(`exec.${id}.nonEmpty`, 'wynik niepusty', mPin.innerHTML.length > 0, true);
    } else {
      const pinCard = mod.pin.buildTopBarReligiaDetailCard(city, v, empire, null).outerHTML;
      const portCard = mod.port.buildTopBarReligiaDetailCard(city, v, empire, null).outerHTML;
      check(`exec.${id}`, `pin-exec vs port: buildTopBarReligiaDetailCard outerHTML (${pinCard.length} znaków)`, portCard, pinCard);
      check(`exec.${id}.nonEmpty`, 'wynik niepusty', pinCard.length > 0, true);
    }
  }

  // appendCompositionBlock: pin vs port, z sekcją, z przypisem i bez wierszy (no-op).
  const pCompM = doc.createElement('div');
  mod.pin.appendCompositionBlock(pCompM, 'Skład wyznawców', [{ label: 'A', pct: 60 }, { label: 'B', pct: 40, note: 'obca' }], 'przypis');
  const pCompP = doc.createElement('div');
  mod.port.appendCompositionBlock(pCompP, 'Skład wyznawców', [{ label: 'A', pct: 60 }, { label: 'B', pct: 40, note: 'obca' }], 'przypis');
  check('exec.comp.full', 'appendCompositionBlock: sekcja + przypis, pin = port', pCompP.innerHTML, pCompM.innerHTML);
  check('exec.comp.full.nonEmpty', 'appendCompositionBlock: treść niepusta', pCompM.innerHTML.includes('obca'), true);
  const pEmpM = doc.createElement('div');
  mod.pin.appendCompositionBlock(pEmpM, 'X', []);
  const pEmpP = doc.createElement('div');
  mod.port.appendCompositionBlock(pEmpP, 'X', []);
  check('exec.comp.empty', 'appendCompositionBlock: pusta lista => brak wyjścia (pin = port)', [pEmpP.innerHTML, pEmpM.innerHTML], ['', '']);

  // Zamknięcie „szczegółów" (karta bez widoku: relState): kliknięcie przycisku „i szczegóły" otwiera kartę w floacie;
  // HTML floatu pin vs port musi być identyczny (pokrywa wewnętrzną kartę renderReligia).
  // Float jest singletonem modułu (`floatEl`): NIE usuwamy go z DOM (odłączony węzeł = pusty odczyt).
  const captureDetail = (render) => {
    const m = doc.createElement('div');
    doc.body.appendChild(m);
    render(m);
    m.querySelector('button.civ-w4-panel-detail')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    const f = doc.querySelector('.civ-hover-detail-float');
    const out = f ? f.innerHTML : '(brak floatu)';
    m.remove();
    return out;
  };
  mod.cfgAccess.getReligionState = () => stateFull;
  const detPin = captureDetail((m) => mod.pin.renderReligia(m, city, null));
  const detPort = captureDetail((m) => mod.port.renderReligia(m, city, null, null));
  check('exec.closure.state', `karta „i szczegóły” (bez widoku, stan religii): pin = port (${detPin.length} znaków)`, detPort, detPin);
  check('exec.closure.state.nonEmpty', 'karta „i szczegóły” niepusta i zawiera „Wpływ na Sz”', detPin.includes('Wpływ na Sz'), true);
  mod.cfgAccess.getReligionState = () => ({ ...stateFull, przyrostWiernych: 3, wplywSzczescie: -0.6 });
  const detPin2 = captureDetail((m) => mod.pin.renderReligia(m, city, null));
  const detPort2 = captureDetail((m) => mod.port.renderReligia(m, city, null, null));
  check('exec.closure.neg', 'karta „i szczegóły” z ujemnym wpływem: pin = port', detPort2, detPin2);
  mod.cfgAccess.getReligionState = () => stateFull;

  // Delegaty: wartości z atrap (porównanie z wzorem testowym, nie z pinem — pin używa tej samej funkcji).
  check('deps.religiaSzPunkty', 'religiaSzPunkty(0.4, 0) = 4', mod.depsMod.religiaSzPunkty(0.4, 0), 4);
  check('deps.religiaXRelTop', 'religiaXRelTop(0) przy epoce 3 = 307', mod.depsMod.religiaXRelTop(0, null), 307);

  // Kotwice treści: pozycja „Wpływ na Sz" i chip „Państwo" w wykonanym HTML.
  mod.cfgAccess.getReligionState = () => undefined;
  const pState = doc.createElement('div');
  mod.port.renderReligia(pState, city, view, null);
  check('exec.anchor.panstwo', 'chip „Państwo” gdy brak stanu religii, a imperium ma religię państwa', pState.innerHTML.includes('Państwo'), true);
  mod.cfgAccess.getReligionState = () => stateFull;
  const pFull = doc.createElement('div');
  mod.port.renderReligia(pFull, city, view, null);
  check('exec.anchor.sz', 'chip Sz = +4 (wskaźnik 0.4 -> 4 przez atrapę)', pFull.innerHTML.includes('+4'), true);
  check('exec.anchor.skladObca', 'skład: „obca” dla składnika innego niż religia państwa', pFull.innerHTML.includes('obca'), true);

  const fails = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.id} | ${r.pin}`);
  console.log(`\nk08d-religia-pin: ${results.length - fails.length}/${results.length} zgodnych`);
  exitCode = fails.length === 0 ? 0 : 1;
} catch (e) {
  console.error('BLAD-HARNESU:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  rmSync(TMP, { recursive: true, force: true });
}
process.exit(exitCode);
