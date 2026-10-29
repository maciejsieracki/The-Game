#!/usr/bin/env node
/**
 * run-k04b-units.mjs — harness porownania DOM/wartosci: jednostki K04 batch 3 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04B-Q1,
 * runda 1) — v2 (`src/ui/cityPanel/k04b-{podzial,stock,queue,surowce}.ts`) vs pin web `edb8fb56`
 * (`gra/src/ui/cityPanel.ts`, `gra/src/game/{cities,production,building-stock-cost}.ts`).
 *
 * Jednostki pinu wyciagane PO NAZWIE (extractFnFrom). Zaleznosci silnika (cfg, getProd/setProd, enqueue, deduct,
 * unitStockCost, unitResourceUpkeep, buildEconParams, mapResourceIconSvg, resourceBrandIconHtml, attachInteractiveDetail,
 * buildSurowceDetailCard) sa stubowane po stronie pinu wartosciami z tego samego fixture, z ktorego v2 dostaje pola DTO.
 * Zgodnosc wartosci DTO z silnikiem Rust (K04B-Z1..Z5) NIE jest tutaj mierzona — patrz P5-8-K04B.md (NIE_ZMIERZONO).
 *
 * Porownania: wartosci zwracane, innerHTML utworzonych elementow, zdarzenia (klikniecia, przeciaganie) i ich efekty.
 * Efekty pinu (setProd/deduct/rerender) sa mapowane na komendy/callbacki v2 zgodnie z K04B-Z5/Z6 (P5-8-K04B.md).
 *
 * Uzycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k04b-units.mjs --pin-dir <PIN_DIR> [--v2-podzial F] [--v2-stock F] [--v2-queue F] [--v2-surowce F]
 * EXIT 0 <=> 0 roznic; 1 <=> >=1 roznica; 2 <=> blad harnessu.
 */
import { readFileSync, writeFileSync, mkdtempSync, readdirSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import * as esbuild from 'esbuild';
import { bundle } from './build.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Uzycie: node tools/dom-harness/run-k04b-units.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const CITY = join(V2_ROOT, 'src/ui/cityPanel');
const V2_FILES = {
  podzial: resolve(argOf('--v2-podzial') ?? join(CITY, 'k04b-podzial.ts')),
  stock: resolve(argOf('--v2-stock') ?? join(CITY, 'k04b-stock.ts')),
  queue: resolve(argOf('--v2-queue') ?? join(CITY, 'k04b-queue.ts')),
  surowce: resolve(argOf('--v2-surowce') ?? join(CITY, 'k04b-surowce.ts')),
};

const pinLines = readFileSync(join(PIN_DIR, 'gra/src/ui/cityPanel.ts'), 'utf8').split('\n');
const citiesLines = readFileSync(join(PIN_DIR, 'gra/src/game/cities.ts'), 'utf8').split('\n');
const prodLines = readFileSync(join(PIN_DIR, 'gra/src/game/production.ts'), 'utf8').split('\n');
const stockLines = readFileSync(join(PIN_DIR, 'gra/src/game/building-stock-cost.ts'), 'utf8').split('\n');

/** Funkcja top-level: od `function NAME` do pierwszej linii `}` w kolumnie 0. */
function extractFnFrom(lines, name) {
  const re = new RegExp(`^(export )?function ${name}[\\s(<]`);
  const i = lines.findIndex((l) => re.test(l));
  if (i < 0) throw new Error(`pin: brak funkcji ${name}`);
  let j = i;
  while (lines[j] !== '}') j++;
  return lines.slice(i, j + 1).join('\n').replace(/^(export )?function /m, 'export function ');
}
/** Instrukcja top-level zakonczona linia konczaca sie `;` (np. wieloliniowa stala). */
function extractStatementFrom(lines, re) {
  const i = lines.findIndex((l) => re.test(l));
  if (i < 0) throw new Error(`pin: brak instrukcji ${re}`);
  let j = i;
  while (!lines[j].trimEnd().endsWith(';')) j++;
  return lines.slice(i, j + 1).join('\n');
}
/** Blok stalej top-level: od `export const NAME` do pierwszej linii `};`. */
function extractBlockFrom(lines, re) {
  const i = lines.findIndex((l) => re.test(l));
  if (i < 0) throw new Error(`pin: brak bloku ${re}`);
  let j = i;
  while (lines[j] !== '};') j++;
  return 'export ' + lines.slice(i, j + 1).join('\n').replace(/^export /, '');
}

// Pin: skladowe CS_RES_STRIP_* (gra/src/ui/cityPanel.ts:6155-6172) — kopia wartosci, sprawdzana grepem ponizej.
const CS_ORDER_LITERAL = "['drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'ruda_cyny', 'cegla', 'braz', 'zelazo', 'stal']";
const pinCityText = pinLines.join('\n');
if (!pinCityText.includes("'drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'ruda_cyny', 'cegla', 'braz', 'zelazo', 'stal',")) {
  throw new Error('pin: zmieniona lista CS_RES_STRIP_ORDER — zaktualizuj harness');
}

const PIN_CITY_FNS = [
  'el', 'appendCityResourceStockStrip', 'appendRecruitMilitaryResourceStrip', 'addItem', 'appendBuildActionButtons',
  'bindBuildQueueDragReorder', 'renderSurowce', 'cityPracaSplit', 'readPodzialPracy', 'appendSurowceGrid',
  'normalizeResourceAccess', 'applyBuildButtonVisualState',
];
const extractPin = (name) => {
  const src = extractFnFrom(pinLines, name);
  // addItem: pin-wersja wykonujaca efekty; w probie zastapiona stubem loggujacym (patrz nizej) — tu zmieniamy nazwe.
  return name === 'addItem' ? src.replace('export function addItem(', 'export function addItemReal(') : src;
};

const probeSrc = [
  '// Stan scenariusza (ustawiany przez __setS) i log efektow pinu.',
  'let __S: any = {};',
  'let __log: any[] = [];',
  'export function __setS(s: any): void { __S = s; __log = []; }',
  'export function __getLog(): any[] { return __log; }',
  'const cfg: any = new Proxy({}, { get: (_t, k) => (__S.cfg || {})[k as string] });',
  `const CS_RES_STRIP_ORDER: readonly string[] = ${CS_ORDER_LITERAL};`,
  "const CS_RES_STRIP_CORE: ReadonlySet<string> = new Set(['drewno', 'kamien']);",
  'const CS_RES_STRIP_ICON_PX = 32;',
  // Pin :860-861 CP_EMOJI_DETECT (uzywany przez el); cpInlineIcons = identyczność (teksty fixture bez emoji).
  extractStatementFrom(pinLines, /^const CP_EMOJI_DETECT =/),
  'function cpInlineIcons(h: string): string { return h; }',
  'function signedPl(n: number): string { return String(n); }',
  'const DEFAULT_PODZIAL_PRACY = { procentBudynki: 70 };',
  'const MIN_PODZIAL_PRACY_BUDYNKI_PERCENT = 50;',
  'const MAX_PODZIAL_PRACY_BUDYNKI_PERCENT = 100;',
  'const BUILDING_GOLD_PURCHASE_MULT = 2;',
  "const CITY_PANEL_RANGE_DEPOSIT_LABELS: ReadonlySet<string> = new Set(['Koń', 'Sól', 'Złoto']);",
  extractBlockFrom(stockLines, /^export const STOCK_RESOURCE_LABEL/),
  extractBlockFrom(prodLines, /^export const EPOCH_NUMBER_TO_NAME/),
  'function stockResourceLabel(key: string): string { return (STOCK_RESOURCE_LABEL as any)[key] ?? key; }',
  'function mapResourceIconSvg(label: string, px: number): string { return `<svg data-l="${label}" data-p="${px}"></svg>`; }',
  'function resourceBrandIconHtml(nazwa: string): string { return `<i>${nazwa}</i>`; }',
  'function buildEconParams(_d: any, _diff: any): any { return { suwaakPracaBudynki: __S.engineParam }; }',
  'function getProd(_cityId: string): any { return { kolejka: __S.queue ?? [], postep: 0 }; }',
  'function setProd(cityId: string, prod: any): void { __log.push({ setProd: cityId, n: prod.kolejka.length }); }',
  'function enqueue(prod: any, item: any, _city: any): any { return { ...prod, kolejka: [...prod.kolejka, item] }; }',
  'function rerender(): void { __log.push("rerender"); }',
  'function deductBuildingStockCostAcrossCities(_c: any, _o: any, cost: any): void { __log.push({ deduct: cost }); }',
  'function reorderQueueItem(prod: any, f: number, t: number): any { __log.push({ reorder: [f, t] }); return prod; }',
  'function buildingStockCostForItem(item: any): Record<string, number> { return item.kind === "budynek" ? ((__S.costOf || {})[item.id] ?? {}) : {}; }',
  'function ownerSurowcePoolFor(_city: any): Record<string, number> { return __S.pool ?? {}; }',
  'function findUnitDef(data: any, id: string): any { return (data.units ?? []).find((u: any) => u.id === id); }',
  'function unitStockCost(udef: any): Record<string, number> { return udef.cost ?? {}; }',
  'function unitResourceUpkeep(udef: any): Record<string, number> { return udef.upkeep ?? {}; }',
  'function attachInteractiveDetail(_t: any, _build: any, opts: any): void { __log.push({ attach: opts }); }',
  'function buildSurowceDetailCard(p: string[], a: string[], l: boolean): HTMLElement { return el("div", "detail-card", "SURO:" + p.join("|") + ":" + a.join("|") + ":" + l); }',
  // addItem: stub logujacy wywolanie (efekty addItemReal sprawdzane osobno).
  'function addItem(_city: any, _item: any, opts?: any): void { __log.push({ addItem: opts?.upgrade ? "up" : "plain" }); }',
  ...[
    ...PIN_CITY_FNS.map(extractPin),
    extractFnFrom(stockLines, 'missingStockFor'),
    extractFnFrom(stockLines, 'canAffordBuildingStock'),
    extractFnFrom(prodLines, 'buildingGoldPurchaseCost'),
    extractFnFrom(prodLines, 'buildingTypeQueued'),
    extractFnFrom(prodLines, 'cityPracaInteger'),
    extractFnFrom(prodLines, 'splitPraca'),
    extractFnFrom(citiesLines, 'clampPodzialPracyBudynkiPercent'),
    extractFnFrom(citiesLines, 'procentPuliImperiumZBudynkow'),
  ],
  // Efekt addItemReal (pin) — dla testu bramek addItem.
  'export function pinAddItemEffects(city: any, item: any, opts: any): any[] { __log = []; addItemReal(city, item, opts); return __log; }',
  'export function pinAddItem(city: any, item: any, opts: any): any { return addItemReal(city, item, opts); }',
  'export function pinButtons(w: any, city: any, item: any, skarb: any, label: any, upgrade: any, opts: any): void { appendBuildActionButtons(w, city, item, skarb, label, upgrade, opts); }',
  'export function pinCityStrip(mount: any): void { appendCityResourceStockStrip(mount, { id: "c1", ownerId: 0 }); }',
  'export function pinRecruitStrip(mount: any, data: any, units: any, epoch: any): void { appendRecruitMilitaryResourceStrip(mount, { id: "c1", ownerId: 0 }, data, units); }',
  'export function pinDrag(sc: any): void { bindBuildQueueDragReorder(sc, { id: "c1", ownerId: 0 }); }',
  'export function pinRenderSurowce(mount: any, compact: boolean): void { renderSurowce(mount, { id: "c1", ownerId: 0 }, compact); }',
  'export function pinReadPodzial(city: any, data: any): any { return readPodzialPracy(city, data); }',
  'export function pinCityPracaSplit(city: any, view: any, data: any): any { return cityPracaSplit(city, view, data); }',
  'export function pinSplitPraca(praca: number, u: number): any { return splitPraca(praca, u); }',
  'export function pinClamp(n: any): number { return clampPodzialPracyBudynkiPercent(n); }',
  'export function pinPuli(n: any): number { return procentPuliImperiumZBudynkow(n); }',
  'export function pinGoldCost(koszt: number): number { return buildingGoldPurchaseCost(koszt); }',
  'export function pinMissing(pool: any, cost: any): any { return missingStockFor(pool, cost); }',
  'export function __push(e: any): void { __log.push(e); }',
  'export const __LABELS: Record<string, string> = STOCK_RESOURCE_LABEL as any;',
  '',
].join('\n');

// Walidacja, ze probe nie zawiera pustych wyciec: kazda wyeksportowana funkcja pinu musi istniec.
const tmp = mkdtempSync(join(tmpdir(), 'k04b-harness-'));
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.Event = dom.window.Event;

function basenameJs(p) { return p.split('/').pop().replace(/\.ts$/, '.js'); }
const ser = (x) => JSON.stringify(x) ?? String(x);
let ok = 0;
let roznica = 0;
const report = [];
const check = (name, pinVal, v2Val) => {
  const same = ser(pinVal) === ser(v2Val);
  if (same) ok++;
  else roznica++;
  report.push(`${same ? 'OK     ' : 'ROZNICA'} ${name}${same ? '' : `\n         pin=${ser(pinVal)}\n         v2 =${ser(v2Val)}`}`);
};
const dropRerender = (log) => log.filter((e) => e !== 'rerender');

try {
  const probePath = join(tmp, 'pin-probe.ts');
  writeFileSync(probePath, probeSrc);
  const pinOut = join(tmp, 'pin');
  await esbuild.build({ entryPoints: [probePath], outdir: pinOut, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', logLevel: 'error', write: true });
  const v2Out = join(tmp, 'v2');
  await bundle([V2_FILES.podzial, V2_FILES.stock, V2_FILES.queue, V2_FILES.surowce, join(V2_ROOT, 'src/controller/mockCatalog.ts'), join(V2_ROOT, 'src/controller/staticCatalog.ts')], v2Out, {});
  const entryJs = (outdir, name) => {
    const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
    const hit = walk(outdir).find((p) => p.endsWith('/' + name));
    if (!hit) throw new Error('brak bundla: ' + name);
    return hit;
  };
  const P = await import(pathToFileURL(entryJs(pinOut, 'pin-probe.js')).href);
  // Katalog statyczny musi byc zainstalowany PRZED ewaluacja modulow paneli (ZAŁOŻENIE P5.2-Z1).
  const SC = await import(pathToFileURL(entryJs(v2Out, 'staticCatalog.js')).href);
  const MC = await import(pathToFileURL(entryJs(v2Out, 'mockCatalog.js')).href);
  SC.installStaticCatalog(MC.MOCK_STATIC_CATALOG);
  const PO = await import(pathToFileURL(entryJs(v2Out, basenameJs(V2_FILES.podzial))).href);
  const ST = await import(pathToFileURL(entryJs(v2Out, basenameJs(V2_FILES.stock))).href);
  const QU = await import(pathToFileURL(entryJs(v2Out, basenameJs(V2_FILES.queue))).href);
  const SU = await import(pathToFileURL(entryJs(v2Out, basenameJs(V2_FILES.surowce))).href);

  const doc = dom.window.document;
  const mk = () => doc.createElement('div');
  const setS = (s) => P.__setS(s);
  const logOf = () => P.__getLog();

  // ---------- Stale i fixture ----------
  const BOUNDS = { min: 50, max: 100 };
  const COST = { B_COST: { drewno: 10, kamien: 5 }, B_FREE: {} };
  // Etykiety po stronie v2 = mapa pinu STOCK_RESOURCE_LABEL (ta sama wartosc, ktora DTO stockResourceLabels musi nieść).
  const LABELS = P.__LABELS;
  const POOL_RICH = { drewno: 20, kamien: 5, glina: 3.6, ruda: 0 };
  const POOL_POOR = { drewno: 4 };
  const mapIcon = (label, px) => `<svg data-l="${label}" data-p="${px}"></svg>`;
  const brandIcon = (n) => `<i>${n}</i>`;

  // ---------- 1. podzial pracy ----------
  const bounds = BOUNDS;
  const podzialCases = [
    ['hook 80', { cfg: { getPodzialPracy: () => ({ procentBudynki: 80 }) } }, {}, { hook: { procentBudynki: 80 } }],
    ['hook 120 -> 100', { cfg: { getPodzialPracy: () => ({ procentBudynki: 120 }) } }, {}, { hook: { procentBudynki: 120 } }],
    ['stored 30 -> 50', { cfg: {} }, { podzialPracy: { procentBudynki: 30 } }, { stored: { procentBudynki: 30 } }],
    ['engine 65.4 -> 65', { cfg: {}, engineParam: 65.4 }, {}, { engineParam: 65.4 }],
    ['brak danych (data null) -> 70', { cfg: {} }, {}, { engineParam: undefined }],
    ['data bez suwaka -> 70', { cfg: {}, engineParam: undefined }, {}, { engineParam: undefined }],
    ['stored NaN -> 70', { cfg: {} }, { podzialPracy: { procentBudynki: NaN } }, { stored: { procentBudynki: NaN } }],
    ['hook null, engine 55', { cfg: { getPodzialPracy: () => null }, engineParam: 55 }, {}, { engineParam: 55 }],
    ['hook 80 i zapis 30 (hook wygrywa)', { cfg: { getPodzialPracy: () => ({ procentBudynki: 80 }) } }, { podzialPracy: { procentBudynki: 30 } }, { hook: { procentBudynki: 80 }, stored: { procentBudynki: 30 } }],
  ];
  for (const [name, fx, city, src] of podzialCases) {
    setS(fx);
    const data = name.startsWith('brak danych') ? null : {};
    const pinVal = P.pinReadPodzial({ id: 'c1', ...city }, data);
    const v2Val = PO.readPodzialPracyK04b(src, bounds);
    check(`readPodzialPracy: ${name}`, pinVal, v2Val);
  }
  check('clamp 49.6 -> 50', P.pinClamp(49.6), PO.clampPodzialPracyBudynkiPercentK04b(49.6, bounds));
  check('clamp undefined -> 70', P.pinClamp(undefined), PO.clampPodzialPracyBudynkiPercentK04b(undefined, bounds));
  check('puli 80 -> 20', P.pinPuli(80), PO.procentPuliImperiumZBudynkowK04b(80, bounds));
  check('puli 120 -> 0', P.pinPuli(120), PO.procentPuliImperiumZBudynkowK04b(120, bounds));
  for (const praca of [13.6, -5, 7, 9]) {
    for (const [pctName, hookPct] of [['default', undefined], ['stored100', 100], ['hook50', 50]]) {
      const fx = { cfg: hookPct === undefined ? {} : { getPodzialPracy: () => ({ procentBudynki: hookPct }) } };
      setS(fx);
      const city = { id: 'c1' };
      const pinVal = P.pinCityPracaSplit(city, { praca }, null);
      const pinPct = P.pinReadPodzial(city, null).procentBudynki;
      const dtoSplit = P.pinSplitPraca(praca, pinPct / 100);
      const src = hookPct === undefined ? {} : { hook: { procentBudynki: hookPct } };
      const v2Val = PO.cityPracaSplitK04b(dtoSplit, src, bounds);
      check(`cityPracaSplit: praca ${praca} ${pctName}`, pinVal, v2Val);
    }
  }

  // ---------- 2. paski surowcow ----------
  const stripPools = [
    ['mix', { drewno: 4.9, zloto: 1, glina: 2.7, kamien: 0 }],
    ['pusta', {}],
    ['metale', { ruda_zelaza: 3, stal: 1, ruda: 0 }],
  ];
  for (const [name, pool] of stripPools) {
    setS({ pool });
    const m1 = mk();
    P.pinCityStrip(m1);
    const m2 = mk();
    ST.appendCityResourceStockStripK04b(m2, pool, LABELS, mapIcon);
    check(`appendCityResourceStockStrip: ${name} (innerHTML)`, m1.innerHTML, m2.innerHTML);
  }

  // ---------- 3. pasek rekrutacji ----------
  const DATA = {
    units: [
      { id: 'U1', cost: { zloto: 3 }, upkeep: { drewno: 1 } },
      { id: 'U2', cost: {}, upkeep: { kamien: 2, kon: 1 } },
      { id: 'U3', cost: { glina: 4 }, upkeep: {} },
      { id: 'U_EMPTY', cost: {}, upkeep: {} },
    ],
  };
  const recruitCases = [
    ['epoka 2 mix', 2, ['U1', 'U2', 'U3'], true, POOL_RICH, undefined],
    ['epoka 9 (brak nazwy)', 9, ['U1'], true, POOL_RICH, undefined],
    ['tylko pusty koszt', 2, ['U_EMPTY'], true, POOL_RICH, undefined],
    ['same budynki', 2, ['U1', 'U2'], false, POOL_RICH, undefined],
    ['getEpoch brak -> 1', 1, ['U2', 'U3'], true, POOL_POOR, undefined],
  ];
  for (const [name, epoch, ids, asUnits, pool, _x] of recruitCases) {
    setS({ pool, cfg: { getEpoch: () => epoch } });
    const pinUnits = ids.map((id) => ({ kind: asUnits ? 'jednostka' : 'budynek', id }));
    const m1 = mk();
    P.pinRecruitStrip(m1, DATA, pinUnits, epoch);
    const dtoUnits = ids.map((id) => ({ kind: asUnits ? 'unit' : 'building', id, stockCost: DATA.units.find((u) => u.id === id).cost }));
    const upkeepById = Object.fromEntries(DATA.units.map((u) => [u.id, u.upkeep]));
    const m2 = mk();
    ST.appendRecruitMilitaryResourceStripK04b(m2, { epoch: name.includes('getEpoch') ? 1 : epoch, units: dtoUnits, upkeepById, pool, stockLabels: LABELS, mapIcon });
    check(`appendRecruitMilitaryResourceStrip: ${name} (innerHTML)`, m1.innerHTML, m2.innerHTML);
  }

  // ---------- 4. addItem (bramki i efekty) ----------
  const QUEUE_B_FREE = [{ kind: 'budynek', id: 'B_FREE' }];
  const addCases = [
    ['B_FREE wolny', { pool: POOL_RICH, queue: [], built: [] }, { kind: 'budynek', id: 'B_FREE', koszt: 10 }, undefined],
    ['B_FREE w kolejce', { pool: POOL_RICH, queue: QUEUE_B_FREE, built: [] }, { kind: 'budynek', id: 'B_FREE', koszt: 10 }, undefined],
    ['B_FREE zbudowany', { pool: POOL_RICH, queue: [], built: ['B_FREE'] }, { kind: 'budynek', id: 'B_FREE', koszt: 10 }, undefined],
    ['B_FREE zbudowany, ulepszenie', { pool: POOL_RICH, queue: [], built: ['B_FREE'] }, { kind: 'budynek', id: 'B_FREE', koszt: 10 }, { upgrade: true }],
    ['B_COST bogata pula', { pool: POOL_RICH, queue: [], built: [] }, { kind: 'budynek', id: 'B_COST', koszt: 40 }, undefined],
    ['B_COST uboga pula', { pool: POOL_POOR, queue: [], built: [] }, { kind: 'budynek', id: 'B_COST', koszt: 40 }, undefined],
    ['B_COST w kolejce', { pool: POOL_RICH, queue: [{ kind: 'budynek', id: 'B_COST' }], built: [] }, { kind: 'budynek', id: 'B_COST', koszt: 40 }, undefined],
    ['jednostka', { pool: POOL_RICH, queue: [], built: [] }, { kind: 'jednostka', id: 'U1', koszt: 5 }, undefined],
    ['cud (inny rodzaj)', { pool: POOL_POOR, queue: [], built: [] }, { kind: 'cud', id: 'W1', koszt: 5 }, undefined],
  ];
  const KIND_TO_DTO = { budynek: 'building', jednostka: 'unit', cud: 'wonder' };
  for (const [name, fx, item, opts] of addCases) {
    setS({ pool: fx.pool, queue: fx.queue, costOf: COST, cfg: { getBuiltBuildingIds: () => fx.built } });
    const effects = P.pinAddItemEffects({ id: 'c1', ownerId: 0 }, item, opts);
    const cost = COST[item.id] ?? {};
    const missing = item.kind === 'budynek' ? P.pinMissing(fx.pool, cost) : {};
    const dtoItem = { kind: KIND_TO_DTO[item.kind], id: item.id, koszt: item.koszt, stockCost: item.kind === 'budynek' ? cost : {}, stockMissing: missing };
    const dtoQueue = fx.queue.map((q) => ({ kind: KIND_TO_DTO[q.kind], id: q.id }));
    const cmd = QU.addItemCommandK04b(0, 1, dtoItem, opts, { queue: dtoQueue, builtIds: fx.built });
    // Pin: ACT = wpis do kolejki (setProd); v2: komenda enqueue_build. Pola (id, rodzaj, upgrade) porownywane 1:1.
    const pinAct = effects.some((e) => e && e.setProd !== undefined)
      ? `ACT|${item.id}|${dtoItem.kind}|${opts?.upgrade === true}`
      : 'NOOP';
    const v2Act = cmd === null ? 'NOOP' : `ACT|${cmd.itemId}|${cmd.itemKind}|${cmd.upgrade}`;
    check(`addItem: ${name}`, pinAct, v2Act);
  }

  // ---------- 5. przyciski budowy ----------
  const btnCases = [
    ['bogata, skarb undef, wired', { skarb: undefined, wired: true, pool: POOL_RICH, label: 'Buduj', upgrade: undefined, opts: undefined, item: { kind: 'budynek', id: 'B_COST', koszt: 40 } }],
    ['skarb 10 < 80', { skarb: 10, wired: true, pool: POOL_RICH, label: 'Buduj', upgrade: undefined, opts: undefined, item: { kind: 'budynek', id: 'B_COST', koszt: 40 } }],
    ['uboga pula (brak drewna/kamienia)', { skarb: 500, wired: true, pool: POOL_POOR, label: 'Buduj', upgrade: undefined, opts: undefined, item: { kind: 'budynek', id: 'B_COST', koszt: 40 } }],
    ['wymagania niespelnione', { skarb: 500, wired: true, pool: POOL_RICH, label: 'Buduj', upgrade: undefined, opts: { requirementsMet: false }, item: { kind: 'budynek', id: 'B_COST', koszt: 40 } }],
    ['brak wpiecia zakupu', { skarb: 500, wired: false, pool: POOL_RICH, label: 'Buduj', upgrade: undefined, opts: undefined, item: { kind: 'budynek', id: 'B_COST', koszt: 40 } }],
    ['bez przycisku Kup', { skarb: 500, wired: true, pool: POOL_RICH, label: 'Buduj', upgrade: undefined, opts: { showPurchase: false }, item: { kind: 'budynek', id: 'B_COST', koszt: 40 } }],
    ['ulepszenie', { skarb: 500, wired: true, pool: POOL_RICH, label: 'Ulepsz', upgrade: true, opts: undefined, item: { kind: 'budynek', id: 'B_COST', koszt: 40 } }],
    ['jednostka ignoruje magazyn', { skarb: 500, wired: true, pool: POOL_POOR, label: 'Buduj', upgrade: undefined, opts: undefined, item: { kind: 'jednostka', id: 'U1', koszt: 40 } }],
  ];
  for (const [name, c] of btnCases) {
    const cfgFor = () => ({ onPurchaseBuilding: c.wired ? (cid, it, g) => P.__push({ buy: g }) : undefined, getTreasury: c.wired ? () => 0 : undefined });
    setS({ pool: c.pool, costOf: COST, cfg: cfgFor() });
    const goldKoszt = P.pinGoldCost(c.item.koszt);
    const w1 = mk();
    P.pinButtons(w1, { id: 'c1', ownerId: 0 }, c.item, c.skarb, c.label, c.upgrade, c.opts);
    const cost = c.item.kind === 'budynek' ? COST[c.item.id] : {};
    const dtoItem = { kind: KIND_TO_DTO[c.item.kind], id: c.item.id, koszt: c.item.koszt, stockCost: cost, stockMissing: c.item.kind === 'budynek' ? P.pinMissing(c.pool, cost) : {} };
    const w2 = mk();
    const v2Log = [];
    QU.appendBuildActionButtonsK04b(w2, dtoItem, {
      goldKoszt,
      skarb: c.skarb,
      purchaseWired: c.wired,
      stockLabels: LABELS,
      buildLabel: c.label,
      upgrade: c.upgrade,
      opts: c.opts,
      onPurchase: (g) => v2Log.push({ buy: g }),
      onBuild: (o) => v2Log.push({ addItem: o?.upgrade ? 'up' : 'plain' }),
    });
    check(`appendBuildActionButtons: ${name} (innerHTML)`, w1.innerHTML, w2.innerHTML);
    // Klikniecia: pin loguje zakup/addItem; v2 — callbacki. Kazdy przycisk klikany na swiezym stanie.
    const pinClicks = [];
    const v2Clicks = [];
    const n = w1.querySelectorAll('button').length;
    for (let i = 0; i < n; i++) {
      setS({ pool: c.pool, costOf: COST, cfg: cfgFor() });
      const wp = mk();
      P.pinButtons(wp, { id: 'c1', ownerId: 0 }, c.item, c.skarb, c.label, c.upgrade, c.opts);
      wp.querySelectorAll('button')[i].dispatchEvent(new dom.window.Event('click'));
      pinClicks.push(dropRerender(logOf()));
      const wv = mk();
      QU.appendBuildActionButtonsK04b(wv, dtoItem, {
        goldKoszt, skarb: c.skarb, purchaseWired: c.wired, stockLabels: LABELS, buildLabel: c.label, upgrade: c.upgrade, opts: c.opts,
        onPurchase: (g) => v2Log.push({ buy: g }),
        onBuild: (o) => v2Log.push({ addItem: o?.upgrade ? 'up' : 'plain' }),
      });
      v2Log.length = 0;
      wv.querySelectorAll('button')[i].dispatchEvent(new dom.window.Event('click'));
      v2Clicks.push([...v2Log]);
    }
    check(`appendBuildActionButtons: ${name} (kliki)`, pinClicks, v2Clicks);
  }

  // ---------- 6. przeciaganie kolejki budowy ----------
  const rowsHtml = (n) => Array.from({ length: n }, (_, i) => `<div class="qitem" data-queue-idx="${i}"><span>${i}</span><button>x</button></div>`).join('');
  const dragScenarios = [
    ['0 -> 2', [['start', 0], ['over', 2], ['drop', 2]]],
    ['1 -> 1 (ten sam indeks)', [['start', 1], ['over', 1], ['drop', 1]]],
    ['3 -> kontener (brak wiersza)', [['start', 3], ['dropContainer']]],
    ['bez startu, drop 2', [['over', 2], ['drop', 2]]],
    ['start na przycisku', [['startButton', 0], ['over', 1], ['drop', 1]]],
    ['2 -> 0 i dragend', [['start', 2], ['over', 0], ['drop', 0], ['end']]],
    ['start 0, dragend bez drop', [['start', 0], ['end'], ['over', 1], ['drop', 1]]],
    ['0 -> 3 nad 1 (over)', [['start', 0], ['over', 1], ['over', 3], ['drop', 3]]],
  ];
  for (const [name, ops] of dragScenarios) {
    const run = (mount, binder, label) => {
      const sc = mk();
      sc.innerHTML = rowsHtml(4);
      mount.appendChild(sc);
      binder(sc);
      const rows = [...sc.querySelectorAll('.qitem')];
      const fire = (type, el, extra = {}) => {
        const ev = new dom.window.Event(type, { bubbles: true, cancelable: true });
        Object.assign(ev, extra);
        el.dispatchEvent(ev);
      };
      for (const [op, arg] of ops) {
        if (op === 'start') fire('dragstart', rows[arg]);
        else if (op === 'startButton') fire('dragstart', rows[arg].querySelector('button'));
        else if (op === 'over') fire('dragover', rows[arg]);
        else if (op === 'drop') fire('drop', rows[arg]);
        else if (op === 'dropContainer') fire('drop', sc);
        else if (op === 'end') fire('dragend', rows[0]);
      }
      return { html: sc.innerHTML, label };
    };
    const pinOut = run(mk(), (sc) => { setS({ cfg: {}, queue: [] }); P.pinDrag(sc); }, 'pin');
    const pinReorders = logOf().filter((e) => e && e.reorder !== undefined).map((e) => e.reorder);
    const v2Reorders = [];
    const v2Out = run(mk(), (sc) => QU.bindBuildQueueDragReorderK04b(sc, (f, t) => v2Reorders.push([f, t])), 'v2');
    check(`bindBuildQueueDragReorder: ${name} (efekty)`, pinReorders, v2Reorders);
    check(`bindBuildQueueDragReorder: ${name} (DOM)`, pinOut.html, v2Out.html);
  }

  // ---------- 7. zakres surowcow miasta ----------
  const surowceCases = [
    ['brak hooka', undefined, undefined],
    ['legacy tablica', ['Koń', 'Złoto', 'Ruda'], { legacy: true, active: ['Koń', 'Złoto', 'Ruda'], potential: [] }],
    ['legacy bez zlozy', ['Ruda', 'Glina'], { legacy: true, active: ['Ruda', 'Glina'], potential: [] }],
    ['obiekt aktywne+potencjal', { potential: ['Sól'], active: ['Złoto', 'Glina'] }, { potential: ['Sól'], active: ['Złoto', 'Glina'], legacy: false }],
    ['obiekt pusty', { potential: [], active: [] }, { potential: [], active: [], legacy: false }],
    ['obiekt tylko potencjal', { potential: ['Koń'], active: [] }, { potential: ['Koń'], active: [], legacy: false }],
  ];
  for (const [name, raw, dto] of surowceCases) {
    for (const compact of [false, true]) {
      setS({ cfg: { getResourceAccess: () => raw } });
      const m1 = mk();
      const pinLog0 = logOf().length;
      P.pinRenderSurowce(m1, compact);
      const pinAttach = logOf().slice(pinLog0).filter((e) => e && e.attach !== undefined).map((e) => e.attach);
      const m2 = mk();
      const v2Attach = [];
      SU.renderSurowceK04b(m2, dto, compact, {
        brandIconHtml: brandIcon,
        attachDetail: (_t, _b, opts) => v2Attach.push(opts),
        buildDetail: (p, a, l) => doc.createElement('div'),
      });
      check(`renderSurowce: ${name} compact=${compact} (innerHTML)`, m1.innerHTML, m2.innerHTML);
      check(`renderSurowce: ${name} compact=${compact} (attach)`, pinAttach, v2Attach);
    }
  }

  console.log(report.join('\n'));
  console.log(`PRZYPADKI=${ok + roznica} OK=${ok} ROZNICA=${roznica}`);
  process.exit(roznica === 0 ? 0 : 1);
} catch (e) {
  console.error('BLAD HARNESSU:', e && e.stack ? e.stack : e);
  process.exit(2);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
