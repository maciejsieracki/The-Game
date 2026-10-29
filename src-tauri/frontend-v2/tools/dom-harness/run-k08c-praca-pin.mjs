#!/usr/bin/env node
/**
 * run-k08c-praca-pin.mjs — harness WYKONUJĄCY funkcje pinu dla partii `praca` K08C (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08C-Q1,
 * runda 1, zadanie 2 dispatchu — harness dla punktów wejścia zakresu).
 *
 * PIN-EXEC: dwie funkcje pinu `edb8fb56` (`gra/src/ui/cityPanel.ts`) przepisane BEZ ZMIAN TEKSTU z linii pinu:
 *   4946-5018  `buildPracaDetailCard`
 *   5770-5822  `buildTopBarPracaDetailCard`
 * (jedyna operacja: wycięcie linii zakresu; zakresy i kotwice startu/końca sprawdzane przed wykonaniem).
 * PORT: `src/ui/cityPanel/k08c-praca.ts` (ta sama treść po bramce `verify-k08c-copies.mjs`).
 *
 * Zależności obu wersji są IDENTYCZNE (ten sam moduł): helpery DOM z portu K01/K01B/K03, `cfg` z `k05b-host`, delegaty
 * `readPodzialPracy`/`cityPracaSplit`/`procentPuliImperiumZBudynkow`/`computeView` z `k08c-deps`, składane przez
 * `controller/k08cWiring.ts` (`installK08cWiring`) z hosta TEST (silnik atrapa: `splitPraca` = proste dzielenie,
 * `engineSuwaakPracaBudynki` = 60). Harness porównuje więc treść i strukturę, nie reguły silnika (P5.13).
 *
 * Porównanie: każdy scenariusz uruchamiany na obu wersjach; outerHTML karty musi być identyczny znak po znaku.
 * Dodatkowo: wiring zwraca `stubbed` = dokładnie 5 atrap regułowych (oczekiwane, K08C-Z5).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k08c-praca-pin.mjs --pin-dir <PIN_DIR> [--port <kopia portu poza repo>] [--tmp-dir <katalog poza repo>]
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
  console.error('Użycie: node tools/dom-harness/run-k08c-praca-pin.mjs --pin-dir <PIN_DIR> [--tmp-dir <katalog>]');
  process.exit(2);
}
const PIN_LINES = readFileSync(join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/);
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'k08c-praca-pin-'));
const PORT_FILE = resolve(argOf('--port') ?? join(V2_ROOT, 'src/ui/cityPanel/k08c-praca.ts'));

const results = [];
const check = (id, pin, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  results.push({ id, pin, ok });
};

/** Zakresy pinu wykonywane verbatim: [nazwa, a, b, kotwica startu, koniec (linia b)]. */
const PIN_RANGES = [
  ['buildPracaDetailCard', 4946, 5018, 'function buildPracaDetailCard(', '}'],
  ['buildTopBarPracaDetailCard', 5770, 5822, 'function buildTopBarPracaDetailCard(', '}'],
];
/** PIN-ANCHOR: literały, które muszą występować w cytowanych liniach pinu (sprawdza, że wycięto właściwe kody). */
const PIN_ANCHORS = [
  [4951, 'const pctCfg = readPodzialPracy(city, data);'],
  [4952, 'const praca = view ? cityPracaSplit(city, view, data) : null;'],
  [4958, "head.innerHTML = '<span>Lokalny przyrost Pracy — ściąga</span>';"],
  [4999, "appendDetailAlgo(card, 'Algorytm (splitPraca + productionProgress)', ["],
  [5006, "? 'Część pracy (doPuli) + Waluta + Targowisko → dodatkowy pieniądz (osobny strumień).'"],
  [5007, ": 'Bez Targowiska doPuli nie konwertuje się na pieniądz.',"],
  [5777, 'const pracaSplit = cityPracaSplit(city, view, data);'],
  [5816, "appendDetailAlgo(card, 'Gdzie zarządzać', ["],
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
    check(`pin.anchor.${i + 1}`, `cityPanel.ts:${line} ${lit}`, hit, true);
  });

  // ─── bundle: PIN-EXEC (verbatim) + PORT + wiring TEST ─────────────────────────────────────────────────────────────
  const pinExec = join(TMP, 'pin-exec.ts');
  writeFileSync(
    pinExec,
    [
      `import { cityPanelChipIconWrap, signed } from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k01a-fundament.ts'))};`,
      `import { appendDetailAlgo, appendDetailSection, el, gridDetailRow, setNoteHtml } from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k01b-dom.ts'))};`,
      `import { appendDetailFormula, appendDetailGrid } from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k03-detail.ts'))};`,
      `import { cfg } from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k05b-host.ts'))};`,
      `import { PULA_LBL_PELNA, PULA_TIP } from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k01b-t.ts'))};`,
      `import { cityPracaSplit, computeView, procentPuliImperiumZBudynkow, readPodzialPracy } from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k08c-deps.ts'))};`,
      '// --- verbatim pin edb8fb56 gra/src/ui/cityPanel.ts (zakresy: 4946-5018, 5770-5822) ---',
      ...pinExecText,
      '// --- koniec verbatim ---',
      'export { buildPracaDetailCard, buildTopBarPracaDetailCard };',
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
      `import { cfg as cfgProxy } from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k05b-host.ts'))};`,
      `import * as pinMod from ${JSON.stringify(pinExec)};`,
      `import * as portMod from ${JSON.stringify(PORT_FILE)};`,
      '// Hosty TEST: silnik = atrapa z jawnymi wzorami (nie reguły gry).',
      'export const cfgObj: Record<string, any> = { getBuiltBuildingIds: () => [], getCities: () => [] };',
      'export const wiring = installK08cWiring({',
      '  rerender: () => undefined,',
      '  cfg: cfgObj as any,',
      '  engineSuwaakPracaBudynki: () => 60,',
      '  splitPraca: (praca: number, frac: number) => {',
      '    const doBudynkow = Math.round(praca * frac);',
      '    return { total: praca, doBudynkow, doPuli: praca - doBudynkow };',
      '  },',
      '  computeView: (c: any) => (c.__view ?? null),',
      '  readPodzialHandlu: () => ({ procentNauka: 0, procentLuksus: 0 } as any),',
      '  isMeCity: (o: number) => o === 0,',
      '  adjustHandelSplit: (s: any) => s,',
      '  freshWealthState: () => ({ poziom: 0 }),',
      '  stockResourceLabel: (k: string) => k,',
      '  rules: {} as any,',
      '} as any);',
      'export const pinBuildPracaDetailCard = pinMod.buildPracaDetailCard;',
      'export const pinBuildTop = pinMod.buildTopBarPracaDetailCard;',
      'export const portBuildPracaDetailCard = portMod.buildPracaDetailCard;',
      'export const portBuildTop = portMod.buildTopBarPracaDetailCard;',
      'export const cfgAccess = cfgProxy;',
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
        // Importy `*.svg?raw` (ikony marki, pin/port `brandAssets`): tekst pliku jako `default`.
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
          // `import.meta.glob` (Vite; ikony/portrety w brandAssets, leaderPortraits, …) nie działa w esbuild/node:
          // zamiana na atrapę zwracającą pusty słownik. Ta sama atrapa dla pinu i portu (granica harnessu: brak ikon
          // rastrowych/SVG z katalogu; ścieżki kodu DOM bez zmian).
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

  check('wiring.stubbed', 'installK08cWiring: atrapy regułowe (K08C-Z5)', [...mod.wiring.stubbed].sort(), [
    'appendRecruitMilitaryResourceStrip', 'groupBuiltBuildingIds', 'purchasableUnits', 'sortByUnitPowerDescending', 'sumOwnedBuildingsUpkeep',
  ]);

  const view = { praca: 40, pieniadz: 5 };
  const city = { id: 7, ownerId: 0, name: 'A' };
  const rival = { id: 8, ownerId: 0, name: 'B', __view: { praca: 25, pieniadz: 1 } };
  const empire = { pracaPool: 120, pracaRate: 0 };
  const map = { __map: true };
  const data = { buildings: [], units: [] };

  /** Scenariusze: [id, funkcja wejścia, argumenty]; ustawienia cfg zmieniane przed każdym wykonaniem. */
  const SCENARIOS = [
    ['praca.noView', (f) => f.card(city, null, null), () => { mod.cfgObj.getBuiltBuildingIds = () => []; }],
    ['praca.view', (f) => f.card(city, view, data), () => { mod.cfgObj.getBuiltBuildingIds = () => []; }],
    ['praca.targowisko', (f) => f.card(city, view, data), () => { mod.cfgObj.getBuiltBuildingIds = () => ['targowisko']; }],
    ['top.noMap', (f) => f.top(city, view, empire, null, null), () => { mod.cfgObj.getCities = () => []; }],
    ['top.sumCities', (f) => f.top(city, view, empire, map, data), () => { mod.cfgObj.getCities = () => [city, rival]; }],
  ];
  const run = (fn, id) => {
    const card = fn();
    return card.outerHTML;
  };
  for (const [id, call, setup] of SCENARIOS) {
    setup();
    const pinHtml = run(() => call({ card: mod.pinBuildPracaDetailCard, top: mod.pinBuildTop }), id);
    setup();
    const portHtml = run(() => call({ card: mod.portBuildPracaDetailCard, top: mod.portBuildTop }), id);
    check(`exec.${id}`, `pin-exec vs port: outerHTML (${pinHtml.length} znaków)`, portHtml, pinHtml);
    check(`exec.${id}.nonEmpty`, 'karta niepusta', pinHtml.includes('detail-card'), true);
  }
  // Kotwice treści (wykonane): tekst, który musi być w karcie pinu.
  mod.cfgObj.getBuiltBuildingIds = () => ['targowisko'];
  const tg = mod.pinBuildPracaDetailCard(city, view, data).outerHTML;
  check('exec.anchor.targowisko', 'algorytm z Targowiskiem (pin: "Część pracy")', tg.includes('Część pracy (doPuli)'), true);
  mod.cfgObj.getBuiltBuildingIds = () => [];
  const nt = mod.pinBuildPracaDetailCard(city, view, data).outerHTML;
  check('exec.anchor.noTargowisko', 'algorytm bez Targowiska (pin: "Bez Targowiska")', nt.includes('Bez Targowiska doPuli'), true);
  const sc = mod.pinBuildTop(city, view, empire, map, data).outerHTML;
  check('exec.anchor.sumCities', 'suma miast z dwóch grodów (rywal praca 25 → +25)', sc.includes('+25'), true);
  check('exec.anchor.split', 'podział z atrapy silnika: doBudynkow=round(40*0.6)=24', tg.includes('+24'), true);

  const fails = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.id} | ${r.pin}`);
  console.log(`\nk08c-praca-pin: ${results.length - fails.length}/${results.length} zgodnych`);
  exitCode = fails.length === 0 ? 0 : 1;
} catch (e) {
  console.error('BLAD-HARNESU:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  rmSync(TMP, { recursive: true, force: true });
}
process.exit(exitCode);
