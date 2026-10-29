#!/usr/bin/env node
/**
 * mutate-k04-units.mjs — kontrola czulosci harnessu `run-k04-units.mjs` (P5-8 K04, runda 2): wstrzykuje pojedyncze
 * mutacje do `k04-stock.ts` (w tym odczyt pola DTO `stockCost` / `stockMissing` / `stockPool`), uruchamia harness
 * i oczekuje EXIT 1 (wykryta roznica). Zrodlo jest przywracane po kazdej mutacji (finally).
 *
 * Uzycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k04-units.mjs --pin-dir <PIN_DIR>
 * EXIT 0 <=> wszystkie mutacje wykryte; 1 <=> >=1 mutacja niewykryta; 2 <=> blad (np. tekst mutacji nie jest unikalny).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const pinIdx = args.indexOf('--pin-dir');
const pinDir = pinIdx >= 0 ? args[pinIdx + 1] : undefined;
if (!pinDir) {
  console.error('Uzycie: node tools/dom-harness/mutate-k04-units.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const STOCK = join(ROOT, 'src/ui/cityPanel/k04-stock.ts');

/** [plik, tekst oryginalny (musi wystapic dokladnie raz), tekst zmutowany, opis] */
const MUTATIONS = [
  [STOCK, "  if (item.kind !== 'building') return {};", "  if (item.kind !== 'unit') return {};", 'koszt budynku: zla gałąź rodzaju'],
  [STOCK, "  if (item.kind !== 'unit') return {};\n  return item.stockCost;", "  if (item.kind !== 'wonder') return {};\n  return item.stockCost;", 'koszt jednostki: warunek rodzaju'],
  [STOCK, "  if (item.kind !== 'unit') return {};\n  return item.stockCost;", "  if (item.kind !== 'unit') return {};\n  return item.stockMissing;", 'DTO stockCost -> stockMissing (jednostka)'],
  [STOCK, "  if (item.kind !== 'building') return {};\n  return item.stockCost;", "  if (item.kind !== 'building') return {};\n  return {};", 'DTO stockCost ignorowane (budynek)'],
  [STOCK, "  if (item.kind === 'unit') return unitStockCostForItem(item);", "  if (item.kind === 'unit') return buildingStockCostForItem(item);", 'zwrot kosztu: jednostka -> gałąź budynku'],
  [STOCK, '  if (index < 0 || index >= queueLength) return null;', '  if (index < 0 || index > queueLength) return null;', 'anuluj: granica zakresu (>)'],
  [STOCK, '  if (index < 0 || index >= queueLength) return null;', '  if (index <= 0 || index >= queueLength) return null;', 'anuluj: indeks 0 pominiety'],
  [STOCK, "  return { kind: 'dequeue_build', owner, city, index };", "  return { kind: 'dequeue_build', owner, city, index: index + 1 };", 'anuluj: indeks w komendzie'],
  [STOCK, '  return stockPool ?? {};', '  return {};', 'pula państwa: ignorowana (DTO)'],
  [STOCK, "  return keys.map(k => `−${resources[k]} ${stockLabels[k] ?? k}`).join(' · ');", "  return keys.map(k => `−${resources[k]} ${stockLabels[k] ?? k}`).join(' • ');", 'podsumowanie: separator'],
  [STOCK, "  return keys.map(k => `−${resources[k]} ${stockLabels[k] ?? k}`).join(' · ');", "  return keys.map(k => `−${resources[k]} ${stockLabels[k] ?? k.toUpperCase()}`).join(' · ');", 'podsumowanie: fallback etykiety'],
  [STOCK, "    const met = pool !== undefined && have >= need;", "    const met = pool !== undefined && have > need;", 'chipy: warunek spełnienia (>)'],
  [STOCK, '      label: pool !== undefined ? `${need} ${label} (masz ${have})` : `${need} ${label}`,', '      label: pool !== undefined ? `${need} ${label} (ma ${have})` : `${need} ${label}`,', 'chipy: etykieta „masz”'],
  [STOCK, "    const have = pool?.[k] ?? 0;", "    const have = pool?.[k] ?? 1;", 'chipy: brak klucza w puli = 1'],
  [STOCK, "    const label = stockLabels[k] ?? k;", "    const label = k;", 'chipy: etykieta z DTO ignorowana'],
];

const results = [];
let setupError = false;
for (const [file, from, to, opis] of MUTATIONS) {
  const original = readFileSync(file, 'utf8');
  const n = original.split(from).length - 1;
  if (n !== 1) {
    console.error(`mutate-k04-units: tekst nieunikalny (${n}) dla: ${opis}`);
    setupError = true;
    continue;
  }
  try {
    writeFileSync(file, original.replace(from, to));
    const r = spawnSync(process.execPath, [join(ROOT, 'tools/dom-harness/run-k04-units.mjs'), '--pin-dir', pinDir], { cwd: ROOT, encoding: 'utf8' });
    const detected = r.status === 1;
    results.push({ opis, detected, status: r.status });
    console.log(`${detected ? 'WYKRYTA ' : 'NIEWYKR. '} exit=${r.status} ${opis}`);
  } finally {
    writeFileSync(file, original);
  }
}

const missed = results.filter((r) => !r.detected);
console.log(`mutate-k04-units: mutacji=${results.length} wykrytych=${results.length - missed.length} niewykrytych=${missed.length}`);
if (setupError) process.exit(2);
process.exit(missed.length === 0 ? 0 : 1);
