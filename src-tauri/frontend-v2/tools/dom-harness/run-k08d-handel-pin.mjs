#!/usr/bin/env node
/**
 * run-k08d-handel-pin.mjs — harness WYKONUJĄCY funkcje pinu dla partii `handel` i `slider` K08D (P5-8,
 * R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 1).
 *
 * PIN-EXEC: cztery funkcje pinu `edb8fb56` (`gra/src/ui/cityPanel.ts`) przepisane BEZ ZMIAN TEKSTU z linii pinu:
 *   1322-1330   `ownerHasMennica`
 *   11045-11054 `activeTradeRouteCountForCity`
 *   10845-11005 `buildHandelDetailCard`
 *   11007-11033 `renderHandelSlidersPanel`
 * PORT: `src/ui/cityPanel/k08d-handel.ts` + `k08d-slider.ts` (te same treści po bramce `verify-k08d-copies.mjs`).
 *
 * Zależności obu wersji są IDENTYCZNE (ten sam moduł): helpery DOM z portu K01/K03/K02/K05B, `cfg` z `k05b-host`,
 * delegaty reguł z `k08d-deps` (składane przez `controller/k08dWiring.ts` z hosta TEST — atrapy z JAWNYMI wzorami,
 * nie reguły gry; P5.13). Harness porównuje treść i strukturę DOM, nie reguły silnika.
 *
 * Porównanie: każdy scenariusz na obu wersjach; innerHTML musi być identyczny znak po znaku.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k08d-handel-pin.mjs --pin-dir <PIN_DIR> [--tmp-dir <katalog poza repo>]
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
  console.error('Użycie: node tools/dom-harness/run-k08d-handel-pin.mjs --pin-dir <PIN_DIR> [--tmp-dir <katalog>]');
  process.exit(2);
}
const PIN_LINES = readFileSync(join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/);
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'k08d-handel-pin-'));

const results = [];
const check = (id, pin, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  results.push({ id, pin, ok });
};

/** Zakresy pinu wykonywane verbatim: [nazwa, a, b, kotwica startu, koniec]. */
const PIN_RANGES = [
  ['ownerHasMennica', 1322, 1330, 'function ownerHasMennica(', '}'],
  ['activeTradeRouteCountForCity', 11045, 11054, 'function activeTradeRouteCountForCity(', '}'],
  ['buildHandelDetailCard', 10845, 11005, 'function buildHandelDetailCard(', '}'],
  ['renderHandelSlidersPanel', 11007, 11033, 'function renderHandelSlidersPanel(', '}'],
];
/** PIN-ANCHOR: literały, które muszą występować w cytowanych liniach pinu. */
const PIN_ANCHORS = [
  [1327, "if (ids.includes('mennica')) return true;"],
  [11049, "if (route.status !== 'polaczony') continue;"],
  [10861, 'const maMennicaBudynek = ownerHasMennica(city.ownerId);'],
  [10897, 'const aktywneTrasyCount = activeTradeRouteCountForCity(city);'],
  [10914, 'dziś to stały procent'],
  [11010, "appendSectionTitleWithDetails(mount, `<span>Podział ${daninaLabelGenitive(daninaLbl)}</span>`, () => buildHandelDetailCard(city, view, data));"],
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

  const pinExec = join(TMP, 'pin-exec.ts');
  const P = (f) => JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel', f));
  writeFileSync(
    pinExec,
    [
      `import { HANDEL_KORUPCJA_PCT_PLACEHOLDER, HANDEL_ZAMOZNOSC_LABEL, cityPanelChipIcon, signed } from ${P('k01a-fundament.ts')};`,
      `import { el, appendDetailSection, appendDetailAlgo, gridDetailRow, setNoteHtml } from ${P('k01b-dom.ts')};`,
      `import { appendDetailFormula, appendDetailGrid } from ${P('k03-detail.ts')};`,
      `import { estimateHandelChips } from ${P('k01b-f.ts')};`,
      `import { appendTabIndicators } from ${P('k02-units.ts')};`,
      `import { appendPodzialHandlu } from ${P('k05b-podzial.ts')};`,
      `import { appendSectionTitleWithDetails } from ${P('k08b-title.ts')};`,
      `import { cfg, daninaLabelForCity, daninaLabelGenitive, readPodzialHandlu } from ${P('k05b-host.ts')};`,
      `import { buildEconParams, cityHasBibliotekaLine, computeTradeRouteBuildingBonusByCity, daninaLabelAccusative, mnoznikHandelPieniadzForCivByDifficulty } from ${P('k08d-deps.ts')};`,
      `import { resourceTextClass } from ${JSON.stringify(join(V2_ROOT, 'src/ui/resourceColors.ts'))};`,
      '// --- verbatim pin edb8fb56 gra/src/ui/cityPanel.ts (zakresy: 1322-1330, 11045-11054, 10845-11005, 11007-11033) ---',
      ...pinExecText,
      '// --- koniec verbatim ---',
      'export { ownerHasMennica, activeTradeRouteCountForCity, buildHandelDetailCard, renderHandelSlidersPanel };',
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
      `import * as portHandel from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k08d-handel.ts'))};`,
      `import * as portSlider from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k08d-slider.ts'))};`,
      `import * as k08dDepsMod from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k08d-deps.ts'))};`,
      '// Hosty TEST: wartości reguł = JAWNE wzory testowe (nie reguły gry; P5.13). Cfg K05B podłącza wiring K08C.',
      'export const cfgObj: Record<string, any> = { getBuiltBuildingIds: () => [], getCities: () => [], getOwnerHasZlotoAccess: (o: number) => o === 0 };',
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
      '  rules: {} as any,',
      '} as any);',
      'export const k08d = installK08dWiring({',
      '  // K08D-Z11 (atrapa TESTOWA, wzór = koniunkcje pinu buildHandelDetailCard 10861-10874; nie reguła produkcyjna, P5.13).',
      '  mennicaGate: (ownerId: number) => {',
      '    const cities: any[] = cfgObj.getCities?.() ?? [];',
      "    const maB = cities.some((c: any) => c.ownerId === ownerId && (cfgObj.getBuiltBuildingIds?.(c.id) ?? []).includes('mennica'));",
      '    const dostep: boolean = cfgObj.getOwnerHasZlotoAccess(ownerId);',
      '    const techs: string[] = cfgObj.getUnlockedTechs?.(ownerId) ?? [];',
      "    const waluta = techs.includes('Waluta') || techs.includes('waluta');",
      '    return { maMennicaBudynek: maB, mennicaAktywna: maB && dostep && waluta, mennicaSpiZBrakuZlota: maB && waluta && !dostep };',
      '  },',
      '  buildEconParams: (_d: unknown, diff: string) => ({ korupcjaWspolczynnikDystansu: 0.1, korupcjaWspolczynnikMiast: 0.05, korupcjaCap: diff === "normal" ? 0.3 : 0.5, mennicaMnoznikPoWalucie: 2 }),',
      "  cityHasBibliotekaLine: (b: readonly string[]) => b.includes('biblioteka'),",
      '  mnoznikHandelPieniadzForCivByDifficulty: (k: unknown, c: unknown, d: string, fb: number) => (k === "rz" && c && d === "normal" ? fb + 1 : fb),',
      '  computeTradeRouteBuildingBonusByCity: (routes: readonly unknown[]) => (routes.length > 0 ? new Map<number, number>([[7, 12]]) : new Map<number, number>()),',
      '});',
      'export const pin = pinMod;',
      'export const port = { ownerHasMennica: portHandel.ownerHasMennica, activeTradeRouteCountForCity: portHandel.activeTradeRouteCountForCity, buildHandelDetailCard: portHandel.buildHandelDetailCard, renderHandelSlidersPanel: portSlider.renderHandelSlidersPanel };',
      'export const cfgAccess = cfgObj;',
      'export const depsMod = k08dDepsMod;',
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

  check('wiring.k08c.stubbed', 'installK08cWiring: atrapy K08C-Z5 (bez zmian)', [...mod.k08c.stubbed].sort(), [
    'appendRecruitMilitaryResourceStrip', 'groupBuiltBuildingIds', 'purchasableUnits', 'sortByUnitPowerDescending', 'sumOwnedBuildingsUpkeep',
  ]);

  const city = { id: 7, ownerId: 0, name: 'A' };
  const capital = { id: 9, ownerId: 0, name: 'K', __split: undefined };
  const view = { praca: 40, pieniadz: 5, nauka: 3, kultura: 2, handelBrutto: 30 };
  const data = { buildings: [], units: [], econParams: {} };
  const route = { status: 'polaczony', budynekOdblokowany: true, fromCityId: 7, toCityId: 8 };

  /** Scenariusze: [id, wywołanie(f), ustawienie cfg]. */
  const SCENARIOS = [
    ['handel.noView', (f) => f.card(city, null, null), () => {
      mod.cfgObj.getBuiltBuildingIds = () => [];
      mod.cfgObj.getCities = () => [];
      mod.cfgObj.getTradeRoutes = () => [];
    }],
    ['handel.view.plain', (f) => f.card(city, view, data), () => {
      mod.cfgObj.getBuiltBuildingIds = () => [];
      mod.cfgObj.getCities = () => [city];
      mod.cfgObj.getTradeRoutes = () => [];
      mod.cfgObj.getUnlockedTechs = () => [];
    }],
    ['handel.mennicaAktywna', (f) => f.card(city, view, data), () => {
      mod.cfgObj.getBuiltBuildingIds = (id) => (id === 7 ? ['targowisko', 'biblioteka'] : ['mennica']);
      mod.cfgObj.getCities = () => [city, capital];
      mod.cfgObj.getOwnerHasZlotoAccess = (o) => o === 0;
      mod.cfgObj.getUnlockedTechs = (o) => (o === 0 ? ['Waluta'] : []);
      mod.cfgObj.getTradeRoutes = () => [route];
      mod.cfgObj.getCivKey = (o) => (o === 0 ? 'rz' : undefined);
      mod.cfgObj.difficulty = 'normal';
      mod.cfgObj.data = { civs: {} };
    }],
    ['handel.mennicaSpi', (f) => f.card(city, view, data), () => {
      mod.cfgObj.getBuiltBuildingIds = (id) => (id === 9 ? ['mennica'] : []);
      mod.cfgObj.getCities = () => [city, capital];
      mod.cfgObj.getOwnerHasZlotoAccess = () => false;
      mod.cfgObj.getUnlockedTechs = (o) => (o === 0 ? ['Waluta'] : []);
      mod.cfgObj.getTradeRoutes = () => [];
    }],
    // K08D-Z11: Mennica zbudowana (gdziekolwiek w imperium), ale BEZ Waluty -> gałąź tekstu „bez Waluty" (maMennicaBudynek).
    ['handel.mennicaBezWaluty', (f) => f.card(city, view, data), () => {
      mod.cfgObj.getBuiltBuildingIds = (id) => (id === 9 ? ['mennica'] : []);
      mod.cfgObj.getCities = () => [city, capital];
      mod.cfgObj.getOwnerHasZlotoAccess = () => true;
      mod.cfgObj.getUnlockedTechs = () => [];
      mod.cfgObj.getTradeRoutes = () => [];
    }],
    ['handel.trasy.toCity', (f) => f.card(city, view, data), () => {
      // Trasa z budynkiem, w której miasto jest TYLKO celem (toCityId): licznik i premia muszą ją zliczyć.
      mod.cfgObj.getBuiltBuildingIds = () => [];
      mod.cfgObj.getCities = () => [city];
      mod.cfgObj.getTradeRoutes = () => [{ status: 'polaczony', budynekOdblokowany: true, fromCityId: 8, toCityId: 7 }];
      mod.cfgObj.getUnlockedTechs = () => [];
    }],
    ['slider.view', (f) => f.slider(city, view, data), () => {
      mod.cfgObj.getBuiltBuildingIds = () => ['targowisko'];
      mod.cfgObj.getCities = () => [city];
      mod.cfgObj.getTradeRoutes = () => [];
      mod.cfgObj.getUnlockedTechs = () => [];
    }],
    ['slider.noView', (f) => f.slider(city, null, null), () => {
      mod.cfgObj.getBuiltBuildingIds = () => [];
      mod.cfgObj.getCities = () => [];
      mod.cfgObj.getTradeRoutes = () => [];
    }],
  ];
  const doc = dom.window.document;
  const runCard = (fn) => fn().outerHTML;
  const runSlider = (fn) => {
    const mount = doc.createElement('div');
    fn(mount);
    return mount.innerHTML;
  };
  for (const [id, call, setup] of SCENARIOS) {
    setup();
    const isSlider = id.startsWith('slider.');
    const pinOut = isSlider
      ? runSlider((m) => call({ slider: (c, v, d) => mod.pin.renderHandelSlidersPanel(m, c, v, d) }))
      : runCard(() => call({ card: (c, v, d) => mod.pin.buildHandelDetailCard(c, v, d) }));
    setup();
    const portOut = isSlider
      ? runSlider((m) => call({ slider: (c, v, d) => mod.port.renderHandelSlidersPanel(m, c, v, d) }))
      : runCard(() => call({ card: (c, v, d) => mod.port.buildHandelDetailCard(c, v, d) }));
    check(`exec.${id}`, `pin-exec vs port: HTML (${pinOut.length} znaków)`, portOut, pinOut);
    check(`exec.${id}.nonEmpty`, 'wynik niepusty', pinOut.length > 0, true);
  }

  // Delegat-stała `daninaLabelAccusative` (K08D-deps) = tekst pinu game/danina-nazwa.ts:21 (pin-exec dzieli ten moduł z portem,
  // więc zgodność musi być sprawdzona względem PLIKU PINU, nie względem drugiej kopii).
  const pinDanina = readFileSync(join(resolve(PIN_DIR), 'gra/src/game/danina-nazwa.ts'), 'utf8');
  check('deps.accusative.pinText', 'game/danina-nazwa.ts zawiera return \'podatek\' w daninaLabelAccusative',
    /export function daninaLabelAccusative[\s\S]{0,80}return 'podatek';/.test(pinDanina), true);
  check('deps.accusative.value', 'daninaLabelAccusative() === pin \'podatek\'', mod.depsMod.daninaLabelAccusative(), 'podatek');

  // Helper: liczba tras z budynkiem (pin 11045-11054) — niezależnie od ścieżki DOM.
  mod.cfgObj.getTradeRoutes = () => [route, { ...route, budynekOdblokowany: false }, { ...route, status: 'zerwany' }];
  check('exec.helper.routes.pin', 'activeTradeRouteCountForCity: 1 trasa z budynkiem', mod.pin.activeTradeRouteCountForCity(city), 1);
  check('exec.helper.routes.port', 'port = pin', mod.port.activeTradeRouteCountForCity(city), 1);
  mod.cfgObj.getBuiltBuildingIds = () => ['mennica'];
  mod.cfgObj.getCities = () => [city];
  check('exec.helper.mennica.pin', 'ownerHasMennica: stolica ma mennicę', mod.pin.ownerHasMennica(0), true);
  check('exec.helper.mennica.port', 'port = pin', mod.port.ownerHasMennica(0), true);

  // Kotwice treści (wykonane, pin i port): karta mennicy aktywnej i premii tras.
  mod.cfgObj.getBuiltBuildingIds = (id) => (id === 7 ? ['targowisko', 'biblioteka'] : ['mennica']);
  mod.cfgObj.getCities = () => [city, capital];
  mod.cfgObj.getOwnerHasZlotoAccess = () => true;
  mod.cfgObj.getUnlockedTechs = () => ['Waluta'];
  mod.cfgObj.getTradeRoutes = () => [route];
  const act = mod.pin.buildHandelDetailCard(city, view, data).outerHTML;
  check('exec.anchor.mennicaMnoznik', 'mnożnik Waluty+Mennicy ×3 (fallback 2 z atrapy buildEconParams + 1 z atrapy mnożnika)', act.includes('×3'), true);
  check('exec.anchor.premia', 'premia tras +12 (1 z budynkiem)', act.includes('+12 Handlu (1 z budynkiem)'), true);
  mod.cfgObj.getOwnerHasZlotoAccess = () => false;
  const spi = mod.pin.buildHandelDetailCard(city, view, data).outerHTML;
  check('exec.anchor.mennicaSpi', 'ostrzeżenie „Mennica nieaktywna" bez złota', spi.includes('Mennica nieaktywna'), true);

  const fails = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.id} | ${r.pin}`);
  console.log(`\nk08d-handel-pin: ${results.length - fails.length}/${results.length} zgodnych`);
  exitCode = fails.length === 0 ? 0 : 1;
} catch (e) {
  console.error('BLAD-HARNESU:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  rmSync(TMP, { recursive: true, force: true });
}
process.exit(exitCode);
