#!/usr/bin/env node
/**
 * mutate-k04b-units.mjs — mutacje behawioralne i DOM dla jednostek K04 batch 3 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04B-Q1)
 * w modulach `src/ui/cityPanel/k04b-{podzial,stock,queue,surowce}.ts`. Kazda mutacja podmienia jeden fragment w kopii
 * pliku (kopia obok oryginału, zeby relatywne importy dzialaly), uruchamia `run-k04b-units.mjs` z `--v2-<klucz> <kopia>`
 * i oczekuje wykrycia (EXIT != 0). Przezyta mutacja = luka w harnessie.
 *
 * Uzycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-k04b-units.mjs --pin-dir <PIN_DIR>
 * EXIT 0 <=> wszystkie mutacje wykryte; 1 <=> >=1 przezyta; 2 <=> blad.
 */
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Uzycie: node tools/dom-harness/mutate-k04b-units.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const CITY = join(V2_ROOT, 'src/ui/cityPanel');
const HARNESS = join(V2_ROOT, 'tools/dom-harness/run-k04b-units.mjs');
const FILES = {
  podzial: join(CITY, 'k04b-podzial.ts'),
  stock: join(CITY, 'k04b-stock.ts'),
  queue: join(CITY, 'k04b-queue.ts'),
  surowce: join(CITY, 'k04b-surowce.ts'),
};

/** [klucz pliku, etykieta, dokladny fragment (musi wystapic raz), zamiennik]. */
const MUTANTS = [
  // --- podzial pracy ---
  ['podzial', 'clamp-round-to-ceil', 'Math.round(n)))', 'Math.ceil(n)))'],
  ['podzial', 'clamp-default-to-min', 'return DEFAULT_PODZIAL_PRACY.procentBudynki;', 'return bounds.min;'],
  ['podzial', 'read-drops-hook', 'if (src.hook) return { procentBudynki: clampPodzialPracyBudynkiPercentK04b(src.hook.procentBudynki, bounds) };', ''],
  ['podzial', 'read-stored-before-hook', "  if (src.hook) return { procentBudynki: clampPodzialPracyBudynkiPercentK04b(src.hook.procentBudynki, bounds) };\n  if (src.stored) return { procentBudynki: clampPodzialPracyBudynkiPercentK04b(src.stored.procentBudynki, bounds) };", "  if (src.stored) return { procentBudynki: clampPodzialPracyBudynkiPercentK04b(src.stored.procentBudynki, bounds) };\n  if (src.hook) return { procentBudynki: clampPodzialPracyBudynkiPercentK04b(src.hook.procentBudynki, bounds) };"],
  ['podzial', 'puli-not-complement', 'return 100 - clampPodzialPracyBudynkiPercentK04b(procentBudynki, bounds);', 'return clampPodzialPracyBudynkiPercentK04b(procentBudynki, bounds);'],
  ['podzial', 'split-doPuli-off-by-one', 'doPuli: split.doPuli,', 'doPuli: split.doPuli + 1,'],
  ['podzial', 'split-puli-uses-pct-plus-1', 'pctPuli: procentPuliImperiumZBudynkowK04b(pctB, bounds),', 'pctPuli: procentPuliImperiumZBudynkowK04b(pctB + 1, bounds),'],
  // --- paski surowcow ---
  ['stock', 'strip-label-raw-key', 'const label = stockLabels[e.k] ?? e.k;', 'const label = e.k;'],
  ['stock', 'strip-no-core', '.filter(e => e.v > 0 || CS_RES_STRIP_CORE.has(e.k));', '.filter(e => e.v > 0);'],
  ['stock', 'strip-round-not-floor', 'Math.floor(pool[k] ?? 0) })', 'Math.round(pool[k] ?? 0) })'],
  ['stock', 'recruit-no-cost-keys', 'const cost = item.stockCost;', 'const cost = {};'],
  ['stock', 'recruit-no-upkeep-keys', 'const upkeep = input.upkeepById[item.id] ?? {};', 'const upkeep = {};'],
  ['stock', 'recruit-era-off-by-one', 'eraName}`', 'eraName}!`'],
  ['stock', 'recruit-order-reversed', '...CS_RES_STRIP_ORDER.filter(k => seen.has(k)),', '...CS_RES_STRIP_ORDER.filter(k => seen.has(k)).reverse(),'],
  ['stock', 'recruit-accepts-buildings', "if (item.kind !== 'unit') continue;", "if (item.kind !== 'unit' && item.kind !== 'building') continue;"],
  ['stock', 'recruit-qty-not-floor', 'const qty = Math.floor(input.pool[key] ?? 0);', 'const qty = input.pool[key] ?? 0;'],
  ['stock', 'recruit-label-raw-key', 'const label = input.stockLabels[key] ?? key;', 'const label = key;'],
  // --- kolejka / przyciski / przeciaganie ---
  ['queue', 'addItem-no-queued-guard', "if (ctx.queue.some(q => q.kind === 'building' && q.id === item.id)) return null;", ''],
  ['queue', 'addItem-upgrade-ignored', "if (!opts?.upgrade && (ctx.builtIds ?? []).includes(item.id)) return null;", "if ((ctx.builtIds ?? []).includes(item.id)) return null;"],
  ['queue', 'addItem-no-stock-guard', 'if (Object.keys(item.stockMissing).length > 0) return null;', ''],
  ['queue', 'addItem-unit-allowed', "  } else if (item.kind === 'unit') {\n    return null;\n  }", '  }'],
  ['queue', 'addItem-upgrade-flag-off', 'upgrade: opts?.upgrade === true,', 'upgrade: false,'],
  ['queue', 'btn-stock-from-cost-not-dto', "const missing: StockCostMap = item.kind === 'building' ? item.stockMissing : {};", 'const missing: StockCostMap = {};'],
  ['queue', 'btn-skarb-undef-false', 'const stac = ctx.skarb === undefined ? true : ctx.skarb >= goldKoszt;', 'const stac = ctx.skarb === undefined ? false : ctx.skarb >= goldKoszt;'],
  ['queue', 'btn-purchase-title-gold', 'else buyTitle = `Kup natychmiast za ${goldKoszt} złota', 'else buyTitle = `Kup natychmiast za ${goldKoszt + 1} złota'],
  ['queue', 'btn-missing-raw-label', '.map(([k, v]) => `${v} ${ctx.stockLabels[k] ?? k}`)', '.map(([k, v]) => `${v} ${k}`)'],
  ['queue', 'btn-build-ignores-upgrade', 'ctx.onBuild(ctx.upgrade ? { upgrade: true } : undefined);', 'ctx.onBuild(undefined);'],
  ['queue', 'btn-purchase-ignores-wired', 'const canBuy = !!(purchaseHook && stac && canBuild);', 'const canBuy = !!(stac && canBuild);'],
  ['queue', 'drag-same-index-allowed', 'if (!Number.isFinite(toIndex) || toIndex === dragFromIndex) {', 'if (!Number.isFinite(toIndex)) {'],
  ['queue', 'drag-swapped-args', 'onReorder(fromIndex, toIndex);', 'onReorder(toIndex, fromIndex);'],
  ['queue', 'drag-button-guard-off', "if ((e.target as HTMLElement).closest('button')) {", 'if (false) {'],
  // --- surowce miasta ---
  ['surowce', 'legacy-as-object', 'if (dto.legacy) return [...dto.active];', 'if (dto.legacy) return { potential: [], active: [...dto.active] };'],
  ['surowce', 'preview-shorter', 'const preview = [...SUROWCE_PREVIEW_K04b];', "const preview = ['Koń'];"],
  ['surowce', 'hasAny-active-only', 'const hasAny = hasSplit ? (active.length + potential.length > 0)', 'const hasAny = hasSplit ? (active.length > 0)'],
  ['surowce', 'attach-delay', 'deps.attachDetail(surowceDetail, surowceBuild, { delayMs: 220, sideHint: \'right\' });', 'deps.attachDetail(surowceDetail, surowceBuild, { delayMs: 200, sideHint: \'right\' });'],
  ['surowce', 'potential-uses-active', "appendSurowceGrid(wrap, potential, 'potential', deps.brandIconHtml);", "appendSurowceGrid(wrap, active, 'potential', deps.brandIconHtml);"],
];

const tmp = resolve(CITY);
let detected = 0;
let survived = 0;
const survivors = [];
let idx = 0;
for (const [key, label, from, to] of MUTANTS) {
  idx++;
  const src = FILES[key];
  const original = readFileSync(src, 'utf8');
  const count = original.split(from).length - 1;
  if (count !== 1) {
    console.error(`BLAD: fragment mutanta ${label} wystepuje ${count} razy (oczekiwano 1)`);
    process.exit(2);
  }
  const mutated = original.replace(from, to);
  // Kopia obok oryginalu (relatywne importy); usuwana po kazdej mutacji.
  const mutFile = join(dirname(src), `${basename(src, '.ts')}.mut-${idx}.ts`);
  writeFileSync(mutFile, mutated);
  let exit = 0;
  try {
    execFileSync(process.execPath, [HARNESS, '--pin-dir', PIN_DIR, `--v2-${key}`, mutFile], { stdio: 'pipe' });
  } catch (e) {
    exit = e.status ?? 2;
  } finally {
    rmSync(mutFile, { force: true });
  }
  if (exit !== 0) {
    detected++;
    console.log(`WYKRYTA  ${label} (harness EXIT ${exit})`);
  } else {
    survived++;
    survivors.push(label);
    console.log(`PRZEZYTA ${label}`);
  }
}
void tmp;
console.log(`MUTACJI=${MUTANTS.length} WYKRYTYCH=${detected} PRZEZYTYCH=${survived}${survivors.length ? ' ' + survivors.join(',') : ''}`);
process.exit(survived === 0 ? 0 : 1);
