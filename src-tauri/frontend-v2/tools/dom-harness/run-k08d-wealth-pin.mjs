#!/usr/bin/env node
/**
 * run-k08d-wealth-pin.mjs — harness WYKONUJĄCY funkcje pinu dla partii `wealth` K08D (P5-8,
 * R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 4, NAPRAW 3a).
 *
 * PIN-EXEC: cztery funkcje pinu `edb8fb56` (`gra/src/ui/cityPanel.ts`) przepisane BEZ ZMIAN TEKSTU z linii pinu:
 *   4247-4304  `appendWealthCompactStrip`
 *   4307-4350  `buildWealthCompactTooltipCard`
 *   4775-4823  `renderWealth`
 *   4824-4944  `buildWealthDetailCard`
 * PORT: `src/ui/cityPanel/k08d-wealth.ts` i `k08d-wealth-pasek.ts` (te same treści po bramce `verify-k08d-copies.mjs`).
 *
 * Zależności wspólne (ten sam moduł dla pin-exec i portu): helpery DOM z portu K01/K02/K03/K08B, `cfg`/`freshWealthState`/
 * `readPodzialHandlu`/`daninaLabel*` z `k05b-host` (host TEST przez `installK08cWiring`), `estimateHandelChips` z `k01b-f`,
 * reguły zamożności z `k08d-deps` (delegaty składane przez `controller/k08dWiring.ts` z hosta TEST).
 * Atrapy reguł są JAWNYMI WZORAMI TESTOWYMI (nie reguły gry; P5.13). `gameData()` pinu = stub zwracający `TEST_DATA`
 * (ten sam obiekt przekazywany do portu jako parametr `data`, K08D-Z14).
 *
 * Porównanie: innerHTML montażu (`renderWealth`, `appendWealthCompactStrip`), outerHTML kart (`buildWealthDetailCard`,
 * `buildWealthCompactTooltipCard`) i zawartość floatu „i szczegóły" muszą być identyczne znak po znaku.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k08d-wealth-pin.mjs --pin-dir <PIN_DIR> [--tmp-dir <katalog poza repo>]
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
  console.error('Użycie: node tools/dom-harness/run-k08d-wealth-pin.mjs --pin-dir <PIN_DIR> [--tmp-dir <katalog>]');
  process.exit(2);
}
const PIN_LINES = readFileSync(join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/);
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'k08d-wealth-pin-'));

const results = [];
const check = (id, pin, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  results.push({ id, pin, ok });
};

/** Zakresy pinu wykonywane verbatim: [nazwa, a, b, kotwica startu, koniec]. */
const PIN_RANGES = [
  ['appendWealthCompactStrip', 4247, 4304, 'function appendWealthCompactStrip(', '}'],
  ['buildWealthCompactTooltipCard', 4307, 4350, 'function buildWealthCompactTooltipCard(', '}'],
  ['renderWealth', 4775, 4822, 'function renderWealth(', '}'],
  ['buildWealthDetailCard', 4824, 4944, 'function buildWealthDetailCard(', '}'],
];
/** PIN-ANCHOR: literały, które muszą występować w cytowanych liniach pinu. */
const PIN_ANCHORS = [
  [4780, '? loadWealthParams(data.econParams as unknown as RawWealthParamsJson, cfg.difficulty ?? \'normal\')'],
  [4783, "appendSectionTitleWithDetails(mount, '<span>Zamożność</span>', () => {"],
  [4786, "'Brak danych parametrów zamożności.'"],
  [4794, 'const cap = wealthCap(epoch, wealthParams);'],
  [4838, 'const podzial = readPodzialHandlu(city, gameData());'],
  [4837, 'const rown = wealthRownowaga(ws.poziom, epoch, p);'],
  [4865, "'Pasek w panelu pokazuje tylko postęp puli do następnego poziomu W — jak spichlerz dla wzrostu ludności. ' +"],
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
      `import { cityPanelChipIconWrap, HANDEL_ZAMOZNOSC_LABEL, signed, tury } from ${P('k01a-fundament.ts')};`,
      `import { el, appendDetailSection, appendDetailAlgo, gridDetailRow } from ${P('k01b-dom.ts')};`,
      `import { appendDetailGrid, appendDetailFormula } from ${P('k03-detail.ts')};`,
      `import { estimateHandelChips } from ${P('k01b-f.ts')};`,
      `import { attachHoverDetail } from ${JSON.stringify(join(V2_ROOT, 'src/ui/hoverDetailDock.ts'))};`,
      `import { cfg, daninaLabelForCity, daninaLabelGenitive, freshWealthState, readPodzialHandlu } from ${P('k05b-host.ts')};`,
      `import { appendSectionTitleWithDetails } from ${P('k08b-title.ts')};`,
      `import { loadWealthParams, wealthCap, wealthMnoznik, wealthProg, wealthRownowaga, wealthZadowolenie } from ${P('k08d-deps.ts')};`,
      '// Stub nazwy pinu `gameData()` (port dostaje dane jako parametr `data`, K08D-Z14): ten sam obiekt co w harnessie.',
      'export const TEST_DATA = { buildings: [], units: [], econParams: { tag: "econ-test" } };',
      'const gameData = (): typeof TEST_DATA => TEST_DATA;',
      '// --- verbatim pin edb8fb56 gra/src/ui/cityPanel.ts (zakresy: 4247-4304, 4307-4350, 4775-4822, 4824-4944) ---',
      ...pinExecText,
      '// --- koniec verbatim ---',
      'export { appendWealthCompactStrip, buildWealthCompactTooltipCard, renderWealth, buildWealthDetailCard };',
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
      `import * as portPasek from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k08d-wealth-pasek.ts'))};`,
      `import * as portWealth from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k08d-wealth.ts'))};`,
      `import * as k08dDepsMod from ${JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel/k08d-deps.ts'))};`,
      '// Hosty TEST: wartości = JAWNE wzory testowe (nie reguły gry; P5.13). Epoka 1 => cap W = 6 (wzór testowy).',
      'export const cfgObj: Record<string, any> = {',
      '  getBuiltBuildingIds: () => [], getCities: () => [], getEpoch: () => 1, difficulty: "normal",',
      '  getReligionState: () => undefined,',
      '};',
      'export const splitState = { v: { procentPieniadz: 50, procentNauka: 30, procentLuksus: 20 } as { procentPieniadz: number; procentNauka: number; procentLuksus: number } };',
      'export const k08c = installK08cWiring({',
      '  rerender: () => undefined,',
      '  cfg: cfgObj as any,',
      '  engineSuwaakPracaBudynki: () => 60,',
      '  splitPraca: (praca: number, frac: number) => ({ total: praca, doBudynkow: Math.round(praca * frac), doPuli: praca - Math.round(praca * frac) }),',
      '  computeView: () => null,',
      '  // Host TEST: podział zależy od danych (bez danych = wartość wzorcowa „0% luksusu"), żeby mutant `readPodzialHandlu(city, null)` był wykrywalny.',
      '  readPodzialHandlu: (_c: unknown, d: unknown) => (d ? splitState.v : { procentPieniadz: 100, procentNauka: 0, procentLuksus: 0 }) as any,',
      '  isMeCity: (o: number) => o === 0,',
      '  adjustHandelSplit: (s: any) => s,',
      '  freshWealthState: () => ({ poziom: 0, pula: 0 }),',
      '  stockResourceLabel: (k: string) => k,',
      '  getEmpireHud: (o: number) => (o === 0 ? { stateReligion: "Kult", religionStock: 5, religionRate: 2, religionSharePct: 60 } : undefined),',
      '  rules: {} as any,',
      '} as any);',
      '// Wzory testowe reguł zamożności (delegaty; pin-exec używa tych samych wywołań przez k08d-deps).',
      'export const k08d = installK08dWiring({',
      '  mennicaGate: () => ({ maMennicaBudynek: false, mennicaAktywna: false, mennicaSpiZBrakuZlota: false }),',
      '  religiaSzPunkty: (w: number, o: number) => Math.round(w * 10) + o,',
      '  religiaXRelTop: (o: number) => (cfgObj.getEpoch?.(o) ?? 1) * 100 + 7,',
      '  buildEconParams: () => ({ korupcjaWspolczynnikDystansu: 0, korupcjaWspolczynnikMiast: 0, korupcjaCap: 0, mennicaMnoznikPoWalucie: 1 }),',
      '  cityHasBibliotekaLine: () => false,',
      '  mnoznikHandelPieniadzForCivByDifficulty: (_k: unknown, _c: unknown, _d: string, fb: number) => fb,',
      '  computeTradeRouteBuildingBonusByCity: () => new Map<number, number>(),',
      '  loadWealthParams: (_econ: unknown, diff: string) => ({',
      '    zachowaniePoAwansie: 0.5, mnoznikNaPoziom: 0.1, progNaPoziom: 10, utrzymanieBaza: 0.2, utrzymaniePrzyCap: 0.4,',
      '    karaZero: diff === "normal" ? -2 : -5, zadowolenieMax: 3,',
      '  }),',
      '  wealthCap: (epoch: number) => epoch + 5,',
      '  wealthProg: (poziom: number, epoch: number, p: any) => (poziom + 1) * p.progNaPoziom * epoch,',
      '  wealthMnoznik: (poziom: number, p: any) => 1 + poziom * p.mnoznikNaPoziom,',
      '  wealthZadowolenie: (poziom: number, p: any, epoch: number) => Math.floor((poziom * p.zadowolenieMax) / (epoch + 5)),',
      '  wealthRownowaga: (poziom: number, epoch: number, p: any) => p.utrzymanieBaza + (poziom / (epoch + 5)) * (p.utrzymaniePrzyCap - p.utrzymanieBaza),',
      '});',
      'export const pin = pinMod;',
      'export const port = {',
      '  appendWealthCompactStrip: portPasek.appendWealthCompactStrip,',
      '  buildWealthCompactTooltipCard: portPasek.buildWealthCompactTooltipCard,',
      '  renderWealth: portWealth.renderWealth,',
      '  buildWealthDetailCard: portWealth.buildWealthDetailCard,',
      '};',
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
  const { TEST_DATA } = mod.pin;
  const DATA = TEST_DATA;
  const { splitState } = mod;

  const cityBase = { id: 7, ownerId: 0, name: 'A' };
  const view = { praca: 40, pieniadz: 100, nauka: 30, kultura: 2, handelBrutto: 30 };
  const SPLIT_LUX = { procentPieniadz: 50, procentNauka: 30, procentLuksus: 20 };
  const params = mod.depsMod.loadWealthParams(null, 'normal');

  /** Scenariusze renderWealth: [id, city, data, view]. */
  const SCENARIOS = [
    ['wealth.view.mid', { ...cityBase, wealthState: { poziom: 2, pula: 4 } }, DATA, view],
    ['wealth.noView.mid', { ...cityBase, wealthState: { poziom: 2, pula: 4 } }, DATA, null],
    ['wealth.noData', { ...cityBase, wealthState: { poziom: 2, pula: 4 } }, null, view],
    ['wealth.cap', { ...cityBase, wealthState: { poziom: 6, pula: 50 } }, DATA, view],
    ['wealth.fresh', { ...cityBase }, DATA, view],
    ['wealth.zeroZam', { ...cityBase, wealthState: { poziom: 1, pula: 0 } }, DATA, view],
  ];

  for (const [id, city, data, v] of SCENARIOS) {
    splitState.v = id === 'wealth.zeroZam' ? { procentPieniadz: 100, procentNauka: 0, procentLuksus: 0 } : SPLIT_LUX;
    const mPin = doc.createElement('div');
    mod.pin.renderWealth(mPin, city, data, v);
    const mPort = doc.createElement('div');
    mod.port.renderWealth(mPort, city, data, v);
    check(`exec.${id}`, `pin-exec vs port: renderWealth innerHTML (${mPin.innerHTML.length} znaków)`, mPort.innerHTML, mPin.innerHTML);
    check(`exec.${id}.nonEmpty`, 'wynik niepusty', mPin.innerHTML.length > 0, true);
    // Karta „i szczegóły" (klik w przycisk nagłówka sekcji): HTML floatu pin vs port.
    const captureDetail = (render) => {
      const m = doc.createElement('div');
      doc.body.appendChild(m);
      render(m);
      m.querySelector('button.civ-w4-panel-detail')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      const f = doc.querySelector('.civ-hover-detail-float');
      const out2 = f ? f.innerHTML : '(brak floatu)';
      m.remove();
      return out2;
    };
    const detPin = captureDetail((m) => mod.pin.renderWealth(m, city, data, v));
    const detPort = captureDetail((m) => mod.port.renderWealth(m, city, data, v));
    check(`exec.${id}.closure`, `karta „i szczegóły” (${detPin.length} znaków): pin = port`, detPort, detPin);
  }

  // buildWealthDetailCard bezpośrednio: pin (5 argumentów, gameData()) vs port (6 argumentów, data jawnie).
  for (const [id, poziom, pula, v] of [['card.mid', 2, 4, view], ['card.cap', 6, 50, view], ['card.noView', 2, 4, null]]) {
    const city = { ...cityBase, wealthState: { poziom, pula } };
    const ws = { poziom, pula };
    const pinCard = mod.pin.buildWealthDetailCard(city, ws, 1, params, v).outerHTML;
    const portCard = mod.port.buildWealthDetailCard(city, ws, 1, params, v, DATA).outerHTML;
    check(`exec.${id}`, `pin-exec vs port: buildWealthDetailCard outerHTML (${pinCard.length} znaków)`, portCard, pinCard);
    check(`exec.${id}.nonEmpty`, 'karta niepusta i zawiera „Zamożność — ściąga”', pinCard.includes('Zamożność — ściąga'), true);
  }

  // appendWealthCompactStrip bezpośrednio (opcje pełne i warianty etaW/atCap).
  const OPTS = [
    { poziom: 2, atCap: false, cap: 6, epoch: 1, mnoz: 1.2, szBonus: 0.4, pula: 4, prog: 30, pct: 13, etaW: 5, zamIn: 3, daninaLblGen: 'podatku' },
    { poziom: 6, atCap: true, cap: 6, epoch: 1, mnoz: 1.6, szBonus: 3, pula: 50, prog: 70, pct: 100, etaW: null, zamIn: 0, daninaLblGen: 'podatku' },
    { poziom: 1, atCap: false, cap: 6, epoch: 1, mnoz: 1, szBonus: -1, pula: 0, prog: 20, pct: 0, etaW: null, zamIn: 0, daninaLblGen: 'podatku' },
  ];
  OPTS.forEach((o, i) => {
    const mP = doc.createElement('div');
    mod.pin.appendWealthCompactStrip(mP, o);
    const mQ = doc.createElement('div');
    mod.port.appendWealthCompactStrip(mQ, o);
    check(`exec.strip.${i}`, `appendWealthCompactStrip wariant ${i}: innerHTML pin = port (${mP.innerHTML.length} znaków)`, mQ.innerHTML, mP.innerHTML);
    check(`exec.strip.${i}.nonEmpty`, 'pasek niepusty', mP.innerHTML.includes('wealth-compact-bar'), true);
    const tP = mod.pin.buildWealthCompactTooltipCard(o).outerHTML;
    const tQ = mod.port.buildWealthCompactTooltipCard(o).outerHTML;
    check(`exec.tooltip.${i}`, `buildWealthCompactTooltipCard wariant ${i}: outerHTML pin = port`, tQ, tP);
  });

  // Delegaty (wzory testowe, zgodność nazw i argumentów): loadWealthParams przekazuje difficulty.
  check('deps.loadWealthParams.hard', 'loadWealthParams(x, "hard") => karaZero -5 (difficulty przekazane)', mod.depsMod.loadWealthParams(null, 'hard').karaZero, -5);
  check('deps.loadWealthParams.normal', 'loadWealthParams(x, "normal") => karaZero -2 (difficulty przekazane, nie zafiksowane)', mod.depsMod.loadWealthParams(null, 'normal').karaZero, -2);
  check('deps.wealthCap', 'wealthCap(1, p) = 6 (wzór testowy)', mod.depsMod.wealthCap(1, params), 6);
  check('deps.wealthProg', 'wealthProg(2, 1, p) = 30 (wzór testowy)', mod.depsMod.wealthProg(2, 1, params), 30);
  check('deps.wealthMnoznik', 'wealthMnoznik(2, p) = 1.2 (wzór testowy)', mod.depsMod.wealthMnoznik(2, params), 1.2);
  check('deps.wealthZadowolenie', 'wealthZadowolenie(6, p, 1) = 3 (wzór testowy)', mod.depsMod.wealthZadowolenie(6, params, 1), 3);
  check('deps.wealthRownowaga', 'wealthRownowaga(6, 1, p) = 0.4 (wzór testowy)', Math.abs(mod.depsMod.wealthRownowaga(6, 1, params) - 0.4) < 1e-9, true);

  // Kotwice treści w wykonanym HTML (port).
  const pFull = doc.createElement('div');
  mod.port.renderWealth(pFull, { ...cityBase, wealthState: { poziom: 2, pula: 4 } }, DATA, view);
  check('exec.anchor.w2', 'pasek pokazuje W2 i mnożnik ×1,20 (wzór testowy)', pFull.innerHTML.includes('W2') && pFull.innerHTML.includes('×1,20'), true);
  const pNoData = doc.createElement('div');
  mod.port.renderWealth(pNoData, { ...cityBase }, null, view);
  check('exec.anchor.noData', 'brak danych parametrów => komunikat, bez paska', pNoData.innerHTML.includes('wealth-compact-bar'), false);

  const fails = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.id} | ${r.pin}`);
  console.log(`\nk08d-wealth-pin: ${results.length - fails.length}/${results.length} zgodnych`);
  exitCode = fails.length === 0 ? 0 : 1;
} catch (e) {
  console.error('BLAD-HARNESU:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  rmSync(TMP, { recursive: true, force: true });
}
process.exit(exitCode);
