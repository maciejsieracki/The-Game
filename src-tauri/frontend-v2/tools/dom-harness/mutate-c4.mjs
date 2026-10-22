#!/usr/bin/env node
/**
 * mutate-c4.mjs — kontrola czułości harnessu P5.4 (`run-c4.mjs`): wstrzykuje po jednej mutacji do modułu
 * v2, uruchamia harness i oczekuje EXIT=1; przywraca plik bajtowo (asercja).
 *
 * Użycie: node tools/dom-harness/mutate-c4.mjs --pin-dir <PIN_DIR>   → EXIT 0 ⇔ każda mutacja wykryta.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const pinDir = args[args.indexOf('--pin-dir') + 1];
if (!pinDir || args.indexOf('--pin-dir') < 0) {
  console.error('Użycie: node tools/dom-harness/mutate-c4.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));

const MUTS = [
  ['C1 registry: lista technologii z katalogu bez pierwszej', 'src/ui/entityCards/registry.ts',
    `const TECH_LIST = (staticCatalog().tech as unknown as { technologie: RawTech[] }).technologie;`,
    `const TECH_LIST = (staticCatalog().tech as unknown as { technologie: RawTech[] }).technologie.slice(1);`],
  ['C2 unitAdapter: kategoria „tylko nazwa” zamiast wiersza', 'src/ui/entityCards/unitAdapter.ts',
    `const category = unitCategoryFromCatalog(unit.Jednostka, true);`, `const category = unitCategoryFromCatalog(unit.Jednostka, false);`],
  ['C3 unitAdapter: kontry z katalogu ignorowane', 'src/ui/entityCards/unitAdapter.ts',
    `const COUNTERS = staticCatalog().counters as unknown as CounterDef[];`, `const COUNTERS = [] as CounterDef[];`],
  ['C4 buildingAdapter: koszt pracy z DTO +1', 'src/ui/entityCards/buildingAdapter.ts', `const workCost = rules.workCost;`, `const workCost = rules.workCost + 1;`],
  ['C5 buildingAdapter: skala poziomów przesunięta', 'src/ui/entityCards/buildingAdapter.ts', `const v = scale[l - 1] ?? 0;`, `const v = scale[l] ?? 0;`],
  ['C6 buildingAdapter: efekt na poziomie wyświetlanym ignorowany', 'src/ui/entityCards/buildingAdapter.ts',
    `rules.yieldAtDisplayLevel[y.key] ?? 0`, `0`],
  ['C7 buildingAdapter: etykiety surowców z DTO ignorowane', 'src/ui/entityCards/buildingAdapter.ts',
    `const stockResourceLabel = (k: string): string => rules.resourceLabels[k] ?? k;`, `const stockResourceLabel = (k: string): string => k;`],
  ['C8 buildingAdapter: mnożnik roli stały', 'src/ui/entityCards/buildingAdapter.ts', `const cumulative = rules.cumulativeMnoznik;`, `const cumulative = 1;`],
  ['C9 buildingAdapter: utrzymanie w złocie z DTO ignorowane', 'src/ui/entityCards/buildingAdapter.ts', `const upkeepGold = rules.upkeepGold;`, `const upkeepGold = 0;`],
  ['C10 improvementAdapter: mapa nazwa→klucz bez „farma”', 'src/ui/entityCards/improvementAdapter.ts',
    `if (key.startsWith('_')) continue;`, `if (key.startsWith('_') || key === 'farma') continue;`],
  ['C11 technologyAdapter: lista jednostek technologii bez pierwszej', 'src/ui/entityCards/technologyAdapter.ts',
    `const units = (staticCatalog().units as UnitRow[]).filter((u) => u.Tech === tech['Technologia']);`,
    `const units = (staticCatalog().units as UnitRow[]).filter((u) => u.Tech === tech['Technologia']).slice(1);`],
  ['C12 techDiscoveryNotice: wyszukiwanie technologii w katalogu', 'src/ui/techDiscoveryNotice.ts',
    `.find(t => t.Technologia === opts.techName);`, `.find(t => t.Technologia === opts.techName && t.Poziom !== 1);`],
  ['C13 sciencePicker: koszt efektywny z DTO ignorowany', 'src/ui/sciencePicker.ts',
    `return row !== undefined ? row.effectiveCost : node.koszt;`, `return node.koszt;`],
  ['C14 sciencePicker: epoka drzewka z DTO ignorowana', 'src/ui/sciencePicker.ts',
    `return cfg.getResearchView?.(ownerId)?.treeEpoch ?? null;`, `return null;`],
  ['C15 sciencePicker: lista huba z DTO bez pierwszego wpisu', 'src/ui/sciencePicker.ts',
    `const drafts = cfg.getResearchView?.(ownerId)?.hubEntries ?? [];`, `const drafts = (cfg.getResearchView?.(ownerId)?.hubEntries ?? []).slice(1);`],
  ['C16 sciencePicker: etykiety ulepszeń z katalogu ignorowane', 'src/ui/sciencePicker.ts',
    `const fromCode = staticCatalog().techTerrainUnlockLabels[techName] ?? [];`, `const fromCode: string[] = [];`],
  ['C17 scienceHubHud: liczba slotów planu z katalogu −1', 'src/ui/scienceHubHud.ts',
    `const PLAN_MAX = staticCatalog().constants.researchQueueMax;`, `const PLAN_MAX = staticCatalog().constants.researchQueueMax - 1;`],
  ['C18 kopia bajtowa: renderer — tekst przycisku Civpedii', 'src/ui/entityCards/renderer.ts',
    `btn.textContent = 'Więcej informacji (Civpedia)';`, `btn.textContent = 'Więcej informacji';`],
  ['C19 kopia bajtowa: wonderAdapter — etykieta dostępu E', 'src/ui/entityCards/wonderAdapter.ts',
    `E: 'Wyłączny (tylko wskazane cywilizacje)',`, `E: 'Wyłączny',`],
  ['C20 scienceHubHud: panel bramki epoki (tekst)', 'src/ui/scienceHubHud.ts',
    `'Wystarczy zbudować JEDEN z powyższych cudów.'`, `'Wystarczy zbudować jeden z powyższych cudów.'`],
];

let missed = 0;
for (const [name, rel, a, b] of MUTS) {
  const p = resolve(ROOT, rel);
  const orig = readFileSync(p, 'utf8');
  const count = orig.split(a).length - 1;
  if (count !== 1) {
    console.log(`${name}: BŁĄD wzorzec występuje ${count}×`);
    missed++;
    continue;
  }
  try {
    writeFileSync(p, orig.replace(a, b));
    const r = spawnSync('node', ['tools/dom-harness/run-c4.mjs', '--pin-dir', pinDir], { cwd: ROOT, encoding: 'utf8' });
    const summary = r.stdout.split('\n').find((l) => l.startsWith('dom-harness-c4:')) ?? r.stderr.slice(-300);
    const mods = r.stdout.split('\n').filter((l) => /różnice=[1-9]|asercje_v2=(\d+)\/(?!\1\b)\d+/.test(l)).map((l) => l.trim().split(/\s+/)[0]);
    const detected = r.status === 1;
    if (!detected) missed++;
    console.log(`${name}: EXIT=${r.status} ${detected ? 'WYKRYTA' : 'NIEWYKRYTA'} [${mods.join(', ')}] ${summary}`);
  } finally {
    writeFileSync(p, orig);
  }
  if (readFileSync(p, 'utf8') !== orig) throw new Error(`nie przywrócono ${rel}`);
}
console.log(`mutate-c4: mutacji=${MUTS.length} niewykrytych=${missed} (pliki przywrócone bajtowo)`);
process.exit(missed === 0 ? 0 : 1);
