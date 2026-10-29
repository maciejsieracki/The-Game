#!/usr/bin/env node
/**
 * run-k08c-owned-purchase-pin.mjs — harness WYKONUJĄCY funkcje pinu partii `owned` i `purchase` K08B po wiringu K08C
 * (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08C-Q1, runda 1, zadanie 2 dispatchu: "harness pin-exec dla owned i purchase").
 *
 * PIN-EXEC (verbatim, bez zmiany tekstu; wycięcie linii zakresu, kotwice start/koniec sprawdzane przed wykonaniem):
 *   9184-9255  `renderBuildingsOwned`            (partia owned)
 *   9341-9357  `renderBuildingsOwnedRightPanel`  (partia owned)
 *   8891-8977  `renderPurchasableUnits`          (partia purchase)
 * PORT: `src/ui/cityPanel/k08b-owned.ts`, `src/ui/cityPanel/k08b-purchase.ts`.
 * Zależności obu wersji identyczne: importy portu (ta sama lista co w nagłówkach partii), delegaty `k08b-deps.ts` przez
 * `dep()` z `k06b-deps.ts`, wiring `installK08cWiring` (`controller/k08cWiring.ts`). Hosty TEST: silnik = atrapy
 * neutralne (K08C-Z5); scenariusze są TYLKO ścieżkami bez delegatów regułowych (puste listy), bo ścieżka z budynkami
 * wymaga K06B (`appendOwnedBuildingRow`, `sumOwnedBuildingsUpkeep` z silnika) — NIE_ZMIERZONO w tej rundzie.
 *
 * Porównanie: outerHTML montażu pin-exec vs port, każdy scenariusz; kotwice treści pinu; wiring `stubbed` = 5 atrap.
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k08c-owned-purchase-pin.mjs --pin-dir <PIN_DIR> [--tmp-dir <katalog poza repo>]
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
  console.error('Użycie: node tools/dom-harness/run-k08c-owned-purchase-pin.mjs --pin-dir <PIN_DIR> [--tmp-dir <katalog>]');
  process.exit(2);
}
const PIN_LINES = readFileSync(join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/);
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'k08c-op-pin-'));
const P = (rel) => JSON.stringify(join(V2_ROOT, 'src/ui/cityPanel', rel));

const results = [];
const check = (id, pin, ok) => results.push({ id, pin, ok: ok === true });

/** Zakresy pinu wykonywane verbatim: [nazwa, a, b, kotwica startu]; koniec zawsze linia `}`. */
const PIN_RANGES = [
  ['renderBuildingsOwned', 9184, 9255, 'function renderBuildingsOwned('],
  ['renderBuildingsOwnedRightPanel', 9341, 9357, 'function renderBuildingsOwnedRightPanel('],
  ['renderPurchasableUnits', 8891, 8977, 'function renderPurchasableUnits('],
];
/** PIN-ANCHOR: literały w liniach pinu (sprawdzane przed wykonaniem). */
const PIN_ANCHORS = [
  [9198, "const built = cfg.getBuiltBuildingIds?.(city.id);"],
  [8898, "const w4 = opts?.w4 === true;"],
  [8966, "'list-scroll',"],
  [8961, "'(brak jednostek do kupienia — zbadaj technologie / Koszary)'"],
];

let exitCode = 0;
try {
  const pinText = [];
  for (const [name, a, b, start] of PIN_RANGES) {
    const okStart = PIN_LINES[a - 1]?.includes(start) ?? false;
    const okEnd = PIN_LINES[b - 1] === '}';
    check(`pin.range.${name}`, `cityPanel.ts:${a}-${b}`, okStart && okEnd);
    if (!okStart || !okEnd) throw new Error(`zakres ${name} ${a}-${b} nie pasuje do pinu`);
    pinText.push(...PIN_LINES.slice(a - 1, b));
  }
  PIN_ANCHORS.forEach(([line, lit], i) => check(`pin.anchor.${i + 1}`, `cityPanel.ts:${line} ${lit}`, PIN_LINES[line - 1]?.includes(lit) ?? false));

  // ─── bundle ──────────────────────────────────────────────────────────────────────────────────────────────────────
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
  const pinExec = join(TMP, 'pin-exec.ts');
  writeFileSync(
    pinExec,
    [
      `import { BUILDING_UPKEEP_ZERO_LABEL, PH, cityPanelChipIcon, cityPanelChipIconWrap, LIST_ROW_HEIGHT_COMPACT, LIST_SCROLL_VISIBLE_CATALOG, signed } from ${P('k01a-fundament.ts')};`,
      `import { formatBuildingUpkeepTotalHtml } from ${P('k01b-f.ts')};`,
      `import { formatResourceUpkeepText, sumOwnedBuildingsResourceUpkeep } from ${P('k01b-r.ts')};`,
      `import { el } from ${P('k01b-dom.ts')};`,
      `import { appendTabIndicators, createScrollList } from ${P('k02-units.ts')};`,
      `import { buildRecruitTabDetailCard, buildUpgradeBonusDetailCard } from ${P('k05b-jednostki.ts')};`,
      `import { cfg, getProd, isMeCity, productionCtxForCity, type City, type GameData } from ${P('k05b-host.ts')};`,
      `import { appendOwnedBuildingRow, } from ${P('k06b-kolejki.ts')};`,
      `import { appendUnitRecruitCompactRow } from ${P('k06b-jednostki.ts')};`,
      `import { appendRecruitMilitaryResourceStrip, getUnitDef, groupBuiltBuildingIds, purchasableUnits, sortByUnitPowerDescending, sumOwnedBuildingsUpkeep, type UnitPowerInput } from ${P('k08b-deps.ts')};`,
      `import { withW4TabCard } from ${P('k08b-rail.ts')};`,
      `import { appendSectionTitleWithDetails } from ${P('k08b-title.ts')};`,
      '// --- verbatim pin edb8fb56 gra/src/ui/cityPanel.ts (zakresy: 9184-9255, 9341-9357, 8891-8977) ---',
      ...pinText,
      '// --- koniec verbatim ---',
      'export { renderBuildingsOwned, renderBuildingsOwnedRightPanel, renderPurchasableUnits };',
      '',
    ].join('\n'),
  );
  const entry = join(TMP, 'entry.ts');
  writeFileSync(
    entry,
    [
      `import ${JSON.stringify(setup)};`,
      `import { installK08cWiring } from ${JSON.stringify(join(V2_ROOT, 'src/controller/k08cWiring.ts'))};`,
      `import { dep } from ${P('k06b-deps.ts')};`,
      `import * as pinMod from ${JSON.stringify(pinExec)};`,
      `import * as ownedMod from ${P('k08b-owned.ts')};`,
      `import * as purchaseMod from ${P('k08b-purchase.ts')};`,
      '// Reguły TEST: neutralne (K08C-Z5) — brak liczenia; produkcja/kontekst = puste obiekty.',
      'export const NEUTRAL_RULES = new Proxy({} as Record<string, unknown>, { get: (_t, k) => (k === "getProd" ? () => ({ rekrutacja: [], kolejka: [] }) : k === "productionCtxForCity" || k === "ownerSurowcePoolFor" ? () => ({}) : () => undefined) });',
      'export const cfgObj: Record<string, any> = { getBuiltBuildingIds: () => [], getCities: () => [], getProd: () => ({ rekrutacja: [], kolejka: [] }) };',
      'export const wiring = installK08cWiring({',
      '  rerender: () => undefined,',
      '  cfg: cfgObj as any,',
      '  engineSuwaakPracaBudynki: () => 60,',
      '  splitPraca: (praca: number) => ({ total: praca, doBudynkow: 0, doPuli: praca }),',
      '  computeView: () => null,',
      '  readPodzialHandlu: () => ({ procentNauka: 0, procentLuksus: 0 } as any),',
      '  isMeCity: (o: number) => o === 0,',
      '  adjustHandelSplit: (s: any) => s,',
      '  freshWealthState: () => ({ poziom: 0 }),',
      '  stockResourceLabel: (k: string) => k,',
      '  rules: NEUTRAL_RULES as any,',
      '} as any);',
      `export const depNames = ${JSON.stringify(['sumOwnedBuildingsUpkeep', 'groupBuiltBuildingIds', 'appendRecruitMilitaryResourceStrip', 'purchasableUnits', 'sortByUnitPowerDescending', 'getUnitDef'])};`,
      'export const depsCallable = depNames.map((n) => { try { return typeof dep(n) === "function"; } catch { return false; } });',
      'export const pin = pinMod;',
      'export const port = { renderBuildingsOwned: ownedMod.renderBuildingsOwned, renderBuildingsOwnedRightPanel: ownedMod.renderBuildingsOwnedRightPanel, renderPurchasableUnits: purchaseMod.renderPurchasableUnits };',
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
        name: 'raw-and-glob',
        setup(b) {
          b.onResolve({ filter: /\?raw$/ }, (a) => ({
            path: resolve(dirname(a.importer), a.path.replace(/\?raw$/, '')),
            namespace: 'raw',
          }));
          b.onLoad({ filter: /.*/, namespace: 'raw' }, (a) => ({
            contents: `export default ${JSON.stringify(readFileSync(a.path, 'utf8'))};`,
            loader: 'js',
          }));
          // `import.meta.glob` (Vite) → atrapa pustego słownika; ta sama dla pinu i portu (granica: ikony z katalogu).
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

  check('wiring.stubbed', 'installK08cWiring: atrapy regułowe (K08C-Z5)',
    JSON.stringify([...mod.wiring.stubbed].sort()) === JSON.stringify([
      'appendRecruitMilitaryResourceStrip', 'groupBuiltBuildingIds', 'purchasableUnits', 'sortByUnitPowerDescending', 'sumOwnedBuildingsUpkeep',
    ]));
  check('wiring.depsCallable', 'sześć delegatów K06B (k08b-deps) wywoływalnych po wiringu', mod.depsCallable.every(Boolean));

  const city = { id: 7, ownerId: 0, name: 'A', owner: 0 };
  const data = { buildings: [], units: [] };
  const mk = () => document.createElement('div');
  const scenarios = [
    ['owned.empty', (f, m) => f.renderBuildingsOwned(m, city, data), () => { mod.cfgObj.getBuiltBuildingIds = () => []; }],
    ['owned.compact', (f, m) => f.renderBuildingsOwned(m, city, data, { compact: true }), () => { mod.cfgObj.getBuiltBuildingIds = () => []; }],
    ['ownedRight.empty', (f, m) => f.renderBuildingsOwnedRightPanel(m, city, data), () => { mod.cfgObj.getBuiltBuildingIds = () => []; }],
    ['purchase.empty', (f, m) => f.renderPurchasableUnits(m, city, data), () => { mod.cfgObj.getBuiltBuildingIds = () => []; }],
    ['purchase.w4', (f, m) => f.renderPurchasableUnits(m, city, data, { w4: true }), () => { mod.cfgObj.getBuiltBuildingIds = () => []; }],
  ];
  for (const [id, call, setup2] of scenarios) {
    const fn = id.startsWith('purchase') ? 'renderPurchasableUnits' : id.startsWith('ownedRight') ? 'renderBuildingsOwnedRightPanel' : 'renderBuildingsOwned';
    setup2();
    const pinMount = mk();
    let pinErr = null;
    try { call(mod.pin, pinMount); } catch (e) { pinErr = String(e); }
    setup2();
    const portMount = mk();
    let portErr = null;
    try { call(mod.port, portMount); } catch (e) { portErr = String(e); }
    check(`exec.${id}`, `pin-exec vs port (${fn}): outerHTML ${pinMount.innerHTML.length} znaków, wyjątek pin=${pinErr} port=${portErr}`,
      pinErr === null && portErr === null && portMount.innerHTML === pinMount.innerHTML);
    check(`exec.${id}.nonEmpty`, `${id}: montaż niepusty`, pinMount.innerHTML.length > 0);
  }
  // Kotwice treści (wykonane z pinu): pusty stan listy budynków i listy jednostek.
  mod.cfgObj.getBuiltBuildingIds = () => [];
  const emptyOwned = mk();
  mod.pin.renderBuildingsOwned(emptyOwned, city, data);
  check('exec.anchor.ownedEmpty', 'pusta lista budynków: tekst pinu obecny w montażu', emptyOwned.innerHTML.length > 0);
  const emptyBuy = mk();
  mod.pin.renderPurchasableUnits(emptyBuy, city, data);
  check('exec.anchor.purchaseEmpty', 'pusty stan rekrutacji (pin: "brak jednostek do kupienia")', emptyBuy.textContent.includes('brak jednostek do kupienia'));

  const fails = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.id} | ${r.pin}`);
  console.log(`\nk08c-owned-purchase-pin: ${results.length - fails.length}/${results.length} zgodnych`);
  exitCode = fails.length === 0 ? 0 : 1;
} catch (e) {
  console.error('BLAD-HARNESU:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  rmSync(TMP, { recursive: true, force: true });
}
process.exit(exitCode);
