#!/usr/bin/env node
/**
 * run-k04-units.mjs — harness porownania wartosci/tekstu: jednostki K04 batch 1 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04-Q1,
 * runda 2, Operator-pomiary) — v2 (`src/ui/cityPanel/k04-stock.ts`) vs pin web `edb8fb56` (`gra/src/ui/cityPanel.ts`
 * oraz `gra/src/game/building-stock-cost.ts`).
 *
 * Jednostki pinu wyciagane PO NAZWIE (extractFn). Zaleznosci silnika (gameData, buildingStockCost, unitStockCost,
 * stockResourceLabel-mapa, getProd/setProd/dequeue, refund, cfg.getCities) sa stubowane po stronie pinu tak, aby
 * zwracac wartosci z tego samego fixture, ktore po stronie v2 dostarcza DTO. Realna zgodnosc wartosci DTO z silnikiem
 * Rust (K04-Z1, K04-Z2) NIE jest tutaj mierzona — patrz P5-8-K04.md.
 *
 * Zakres porownania:
 *   - buildingStockCostForItem, unitStockCostForItem, stockCostForQueueItem (pin: kind 'budynek'/'jednostka'; v2: DTO kind).
 *   - ownerSurowcePoolFor (pin: ownerResourceStockAll z pinu po cities; v2: pole DTO stockPool obliczone tym samym
 *     pinowym ownerResourceStockAll — dowod, ze DTO-pula = pinowa suma; NIE dowod zgodnosci z Rust).
 *   - formatResourceUpkeepSummary, buildingStockCostChipsHtml (pin: def+city; v2: cost+labels+pool).
 *   - cancelQueueItem: porownanie GUARDA zakresu (pin: brak efektow; v2: null). Zwrot kosztu i postepu (pin: refund +
 *     dequeue + rerender) NIE jest porownywany — v2 wysyla komende `dequeue_build` (ZAŁOŻENIE K04-Z2). Ten kontrakt
 *     jest raportowany jako ROZNICA_ZALOZONA (nie liczy sie do EXIT).
 *
 * Uzycie (z katalogu `src-tauri/frontend-v2/`):
 *   git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>   (PIN_DIR = katalog poza repo)
 *   node tools/dom-harness/run-k04-units.mjs --pin-dir <PIN_DIR>
 * EXIT 0 <=> 0 roznic; 1 <=> >=1 roznica (poza ROZNICA_ZALOZONA); 2 <=> blad harnessu.
 */
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { bundle } from './build.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Uzycie: node tools/dom-harness/run-k04-units.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const CITY = join(V2_ROOT, 'src/ui/cityPanel');
const PIN_FILE = join(PIN_DIR, 'gra/src/ui/cityPanel.ts');
const STOCK_FILE = join(PIN_DIR, 'gra/src/game/building-stock-cost.ts');

const pinLines = readFileSync(PIN_FILE, 'utf8').split('\n');
const stockLines = readFileSync(STOCK_FILE, 'utf8').split('\n');

/** Funkcja top-level z pliku: od `function NAME` do pierwszej linii `}` w kolumnie 0. */
function extractFnFrom(lines, name) {
  const re = new RegExp(`^(export )?function ${name}[\\s(<]`);
  const i = lines.findIndex((l) => re.test(l));
  if (i < 0) throw new Error(`pin: brak funkcji ${name}`);
  let j = i;
  while (lines[j] !== '}') j++;
  return lines.slice(i, j + 1).join('\n').replace(/^(export )?function /m, 'export function ');
}
const extractFn = (name) => extractFnFrom(pinLines, name);
function extractBlock(lines, re) {
  const i = lines.findIndex((l) => re.test(l));
  if (i < 0) throw new Error(`pin: brak bloku ${re}`);
  let j = i;
  while (lines[j] !== '};') j++;
  return 'export ' + lines.slice(i, j + 1).join('\n').replace(/^export /, '');
}

const PIN_FNS = [
  'buildingStockCostForItem', 'unitStockCostForItem', 'stockCostForQueueItem', 'cancelQueueItem',
  'ownerSurowcePoolFor', 'formatResourceUpkeepSummary', 'buildingStockCostChipsHtml',
  'buildingRequirementChipsHtml', 'buildingReqChipSpan',
];

const probeSrc = [
  '// Stan scenariusza (ustawiany przez __setS) i log efektow.',
  'let __S: any = {};',
  'let __log: any[] = [];',
  'export function __setS(s: any): void { __S = s; __log = []; }',
  'export function __getLog(): any[] { return __log; }',
  'const cfg: any = new Proxy({}, { get: (_t, k) => (__S.cfg || {})[k as string] });',
  // Stuby silnika (wartosci z fixture; po stronie v2 odpowiednik to DTO).
  'function gameData(): any { return { buildings: __S.buildings ?? [], units: __S.units ?? [] }; }',
  'function buildingStockCost(def: any): Record<string, number> { return def ? def.cost : {}; }',
  'function unitStockCost(def: any): Record<string, number> { const n = def ? def["Surowiec (ilość)"] : 0; const r = def ? String(def.Surowiec ?? "").trim() : ""; return r && r !== "-" && n > 0 ? { [r]: n } : {}; }',
  'function getProd(_cityId: string): any { return __S.prod; }',
  'function setProd(cityId: string, prod: any): void { __log.push({ setProd: cityId, kolejka: prod.kolejka.length }); }',
  'function dequeue(prod: any, index: number, _city?: any): any { __log.push({ dequeue: index }); return { ...prod, kolejka: prod.kolejka.filter((_: any, i: number) => i !== index) }; }',
  'function refundBuildingStockCostAcrossCities(_cities: any[], _owner: number, cost: any): void { __log.push({ refund: cost }); }',
  'function rerender(): void { __log.push("rerender"); }',
  extractBlock(stockLines, /^export const STOCK_RESOURCE_LABEL/),
  'function stockResourceLabel(key: string): string { return (STOCK_RESOURCE_LABEL as any)[key] ?? key; }',
  extractFnFrom(stockLines, 'ownerResourceStockAll'),
  ...PIN_FNS.map(extractFn),
  '',
].join('\n');

const tmp = mkdtempSync(join(tmpdir(), 'p58k04u-harness-'));
let exitCode = 0;
const results = [];
const record = (name, status, detail = '') => results.push({ name, status, detail });

try {
  const probePath = join(tmp, 'pin-probe.ts');
  writeFileSync(probePath, probeSrc);
  const pinOut = join(tmp, 'pin');
  const v2Out = join(tmp, 'v2');
  await esbuild.build({ entryPoints: [probePath], outdir: pinOut, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', logLevel: 'error', write: true });
  // Dwa wejscia: esbuild nazywa wyjscie wzgledem wspolnego katalogu (jedno wejscie daje nazwe pusta).
  await bundle([join(CITY, 'k04-stock.ts'), join(CITY, 'k01a-fundament.ts'), join(V2_ROOT, 'src/controller/mockCatalog.ts'), join(V2_ROOT, 'src/controller/staticCatalog.ts')], v2Out, {});
  const entryJs = (outdir, name) => {
    const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
    const hit = walk(outdir).find((p) => p.endsWith('/' + name));
    if (!hit) throw new Error('brak bundla: ' + name);
    return hit;
  };
  const P = await import(pathToFileURL(entryJs(pinOut, 'pin-probe.js')).href);
  const SC = await import(pathToFileURL(entryJs(v2Out, 'staticCatalog.js')).href);
  const MC = await import(pathToFileURL(entryJs(v2Out, 'mockCatalog.js')).href);
  SC.installStaticCatalog(MC.MOCK_STATIC_CATALOG);
  const V = await import(pathToFileURL(entryJs(v2Out, 'k04-stock.js')).href);

  const ser = (x) => JSON.stringify(x) ?? String(x);
  const runPin = (fn) => {
    try { return ser(fn(P)); } catch (e) { return `THROW: ${String(e?.message ?? e)}`; }
  };
  const runV2 = (fn) => {
    try { return ser(fn(V)); } catch (e) { return `THROW: ${String(e?.message ?? e)}`; }
  };

  const LABELS = { drewno: 'Drewno', zloto: 'Złoto', kamien: 'Kamień' };
  const DEF_B1 = { id: 'B1', cost: { drewno: 10, kamien: 5 } };
  const DEF_U1 = { Jednostka: 'U1', Surowiec: 'zloto', 'Surowiec (ilość)': 3 };
  const FIX = { buildings: [DEF_B1], units: [DEF_U1] };
  // Etykiety po stronie v2 = mapa pinu STOCK_RESOURCE_LABEL (ta sama wartosc, ktora DTO stockResourceLabels musi nieść).
  const LABELS_PIN = P.STOCK_RESOURCE_LABEL;
  const cities = [
    { id: 'c1', ownerId: 0, surowce: { drewno: 4, zloto: 1 } },
    { id: 'c2', ownerId: 0, surowce: { drewno: 6, kamien: 2.5 } },
    { id: 'c3', ownerId: 1, surowce: { drewno: 99 } },
  ];

  /** [nazwa, pin(P) -> wynik, v2(V) -> wynik, oczekiwana_roznica_zalozona?] */
  const cases = [];
  const add = (name, pin, v2, expectedDiff = false) => cases.push({ name, pin, v2, expectedDiff });

  // --- koszt pozycji (pin: kind 'budynek'/'jednostka'; v2: DTO kind 'building'/'unit') ---
  add('buildingStockCostForItem: budynek z kosztem',
    (P) => { P.__setS({ ...FIX }); return P.buildingStockCostForItem({ kind: 'budynek', id: 'B1' }); },
    (V) => V.buildingStockCostForItem({ kind: 'building', id: 'B1', stockCost: { drewno: 10, kamien: 5 } }));
  add('buildingStockCostForItem: jednostka -> pusty',
    (P) => { P.__setS({ ...FIX }); return P.buildingStockCostForItem({ kind: 'jednostka', id: 'U1' }); },
    (V) => V.buildingStockCostForItem({ kind: 'unit', id: 'U1', stockCost: { zloto: 3 } }));
  add('unitStockCostForItem: jednostka z kosztem',
    (P) => { P.__setS({ ...FIX }); return P.unitStockCostForItem({ kind: 'jednostka', id: 'U1' }); },
    (V) => V.unitStockCostForItem({ kind: 'unit', id: 'U1', stockCost: { zloto: 3 } }));
  add('unitStockCostForItem: budynek -> pusty',
    (P) => { P.__setS({ ...FIX }); return P.unitStockCostForItem({ kind: 'budynek', id: 'B1' }); },
    (V) => V.unitStockCostForItem({ kind: 'building', id: 'B1', stockCost: { drewno: 10, kamien: 5 } }));
  add('stockCostForQueueItem: cud (wonder) -> pusty',
    (P) => { P.__setS({ ...FIX }); return P.stockCostForQueueItem({ kind: 'cud', id: 'W1' }); },
    (V) => V.stockCostForQueueItem({ kind: 'wonder', id: 'W1', stockCost: { zloto: 9 } }));
  add('stockCostForQueueItem: budynek i jednostka',
    (P) => { P.__setS({ ...FIX }); return [P.stockCostForQueueItem({ kind: 'budynek', id: 'B1' }), P.stockCostForQueueItem({ kind: 'jednostka', id: 'U1' })]; },
    (V) => [V.stockCostForQueueItem({ kind: 'building', id: 'B1', stockCost: { drewno: 10, kamien: 5 } }), V.stockCostForQueueItem({ kind: 'unit', id: 'U1', stockCost: { zloto: 3 } })]);

  // --- pula panstwa: DTO stockPool = pinowe ownerResourceStockAll (dowod sumy po miastach ownera) ---
  add('ownerSurowcePoolFor: suma po miastach ownera 0',
    (P) => { P.__setS({ cfg: { getCities: () => cities } }); return P.ownerSurowcePoolFor(cities[0]); },
    (V, pinPool) => V.ownerSurowcePoolFor(pinPool));
  add('ownerSurowcePoolFor: brak pola DTO -> pusta pula',
    (P) => { P.__setS({ cfg: { getCities: () => cities } }); return {}; },
    (V) => V.ownerSurowcePoolFor(undefined));

  // --- formatowanie kosztu zwrotu / podsumowania ---
  add('formatResourceUpkeepSummary: pusty -> myslnik',
    (P) => { P.__setS({ labels: LABELS }); return P.formatResourceUpkeepSummary({}); },
    (V) => V.formatResourceUpkeepSummary({}, LABELS_PIN));
  add('formatResourceUpkeepSummary: dwa surowce, etykiety',
    (P) => { P.__setS({ labels: LABELS }); return P.formatResourceUpkeepSummary({ drewno: 3, zloto: 2 }); },
    (V) => V.formatResourceUpkeepSummary({ drewno: 3, zloto: 2 }, LABELS_PIN));
  add('formatResourceUpkeepSummary: brak etykiety -> klucz',
    (P) => { P.__setS({ labels: LABELS }); return P.formatResourceUpkeepSummary({ xyz_brak: 1 }); },
    (V) => V.formatResourceUpkeepSummary({ xyz_brak: 1 }, LABELS_PIN));

  // --- chipy kosztu budynku: pin (def, city) vs v2 (cost, labels, pool) ---
  const poolEnough = { drewno: 20, kamien: 5 };
  add('buildingStockCostChipsHtml: brak miasta (bez „masz”)',
    (P) => { P.__setS({ ...FIX, labels: LABELS, cfg: { getCities: () => cities } }); return P.buildingStockCostChipsHtml(DEF_B1, undefined); },
    (V) => V.buildingStockCostChipsHtml({ drewno: 10, kamien: 5 }, LABELS_PIN, undefined));
  add('buildingStockCostChipsHtml: pula wystarcza',
    (P) => { P.__setS({ ...FIX, labels: LABELS, cfg: { getCities: () => [{ id: 'x', ownerId: 0, surowce: poolEnough }] } }); return P.buildingStockCostChipsHtml(DEF_B1, { id: 'x', ownerId: 0 }); },
    (V) => V.buildingStockCostChipsHtml({ drewno: 10, kamien: 5 }, LABELS_PIN, poolEnough));
  add('buildingStockCostChipsHtml: pula za mala (drewno) i brak klucza (kamien)',
    (P) => { P.__setS({ ...FIX, labels: LABELS, cfg: { getCities: () => [{ id: 'x', ownerId: 0, surowce: { drewno: 4 } }] } }); return P.buildingStockCostChipsHtml(DEF_B1, { id: 'x', ownerId: 0 }); },
    (V) => V.buildingStockCostChipsHtml({ drewno: 10, kamien: 5 }, LABELS_PIN, { drewno: 4 }));
  add('buildingStockCostChipsHtml: brak kosztu -> pusty',
    (P) => { P.__setS({ labels: LABELS, cfg: {} }); return P.buildingStockCostChipsHtml({ id: 'B0', cost: {} }, undefined); },
    (V) => V.buildingStockCostChipsHtml({}, LABELS_PIN, undefined));

  // --- anulowanie: porownanie guarda zakresu; zwrot/postep = ZAŁOŻENIE K04-Z2 (ROZNICA_ZALOZONA) ---
  const PROD = { kolejka: [{ kind: 'budynek', id: 'B1' }, { kind: 'jednostka', id: 'U1' }] };
  for (const idx of [-1, 0, 1, 2]) {
    add(`cancelQueueItem guard: indeks ${idx} (dlugosc 2)`,
      (P) => { P.__setS({ ...FIX, prod: PROD, cfg: { getCities: () => cities } }); P.cancelQueueItem({ id: 'c1', ownerId: 0 }, idx); return P.__getLog().some((e) => e && e.dequeue !== undefined) ? 'ACT' : 'NOOP'; },
      (V) => (V.cancelQueueItemCommand(0, 'c1', 2, idx) === null ? 'NOOP' : 'ACT'));
  }
  add('cancelQueueItem: komenda dequeue_build (pin: refund+dequeue; v2: komenda)',
    (P) => { P.__setS({ ...FIX, prod: PROD, cfg: { getCities: () => cities } }); P.cancelQueueItem({ id: 'c1', ownerId: 0 }, 0); return P.__getLog(); },
    (V) => V.cancelQueueItemCommand(0, 'c1', 2, 0), true);

  for (const idx of [0, 1]) {
    add(`cancelQueueItem: indeks dequeue (pin) = indeks komendy v2, idx ${idx}`,
      (P) => { P.__setS({ ...FIX, prod: PROD, cfg: { getCities: () => cities } }); P.cancelQueueItem({ id: 'c1', ownerId: 0 }, idx); const e = P.__getLog().find((x) => x && x.dequeue !== undefined); return e ? e.dequeue : null; },
      (V) => { const cmd = V.cancelQueueItemCommand(0, 'c1', 2, idx); return cmd ? cmd.index : null; });
  }

  for (const c of cases) {
    let pinOut;
    let v2Out;
    if (c.name.startsWith('ownerSurowcePoolFor: suma')) {
      // Najpierw pin liczy pule; ta sama wartosc trafia jako DTO stockPool do v2.
      const pinPool = P.ownerResourceStockAll(cities, 0);
      pinOut = runPin(c.pin);
      v2Out = runV2((V2) => c.v2(V2, pinPool));
    } else {
      pinOut = runPin(c.pin);
      v2Out = runV2(c.v2);
    }
    if (pinOut === v2Out) record(c.name, 'OK');
    else if (c.expectedDiff) record(c.name, 'ROZNICA_ZALOZONA', `pin=${pinOut} v2=${v2Out}`);
    else { record(c.name, 'ROZNICA', `pin=${pinOut} v2=${v2Out}`); exitCode = 1; }
  }
} catch (e) {
  console.error('run-k04-units: blad harnessu:', e?.stack ?? e);
  exitCode = 2;
}

for (const r of results) console.log(`${r.status.padEnd(18)} ${r.name}${r.detail ? ' | ' + r.detail : ''}`);
const count = (s) => results.filter((r) => r.status === s).length;
console.log(`run-k04-units: przypadkow=${results.length} OK=${count('OK')} ROZNICA=${count('ROZNICA')} ROZNICA_ZALOZONA=${count('ROZNICA_ZALOZONA')} exit=${exitCode}`);
rmSync(tmp, { recursive: true, force: true });
process.exit(exitCode);
