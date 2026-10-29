#!/usr/bin/env node
/**
 * mutate-k04-units-b2.mjs — mutacje behawioralne i pol DTO dla jednostek K04 batch 2
 * (`src/ui/cityPanel/k04-buildings.ts`). Kazda mutacja podmienia jedna linie v2 w kopii pliku, uruchamia
 * `run-k04-units-b2.mjs --v2 <kopia>` i oczekuje wykrycia (EXIT != 0). Przezyta mutacja = luka w harnessie.
 *
 * Uzycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-k04-units-b2.mjs --pin-dir <PIN_DIR>
 * EXIT 0 <=> wszystkie mutacje wykryte; 1 <=> >=1 przezyta; 2 <=> blad.
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Uzycie: node tools/dom-harness/mutate-k04-units-b2.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const SRC = join(V2_ROOT, 'src/ui/cityPanel/k04-buildings.ts');
const HARNESS = join(V2_ROOT, 'tools/dom-harness/run-k04-units-b2.mjs');
const original = readFileSync(SRC, 'utf8');

/** [etykieta, dokladny fragment do zamiany (musi wystapic raz), zamiennik]. */
const MUTANTS = [
  ['owned-level-default-0', 'return levels[defId] ?? 1;', 'return levels[defId] ?? 0;'],
  ['ui-level-no-city-0', 'if (levels === undefined) return 1;', 'if (levels === undefined) return 0;'],
  ['ui-level-ignores-city', 'return buildingOwnedLevelFromDto(defId, levels);', 'return 1;'],
  ['upkeep-undefined-returns-0', 'if (u === undefined) continue;', 'if (u === undefined) return 0;'],
  ['upkeep-counts-items', 'sum += u;', 'sum += 1;'],
  ['upkeep-skips-first', 'for (const id of built) {', 'for (const id of built.slice(1)) {'],
  ['spichlerz-wrong-building', "c.builtIds.includes('spichlerz')", "c.builtIds.includes('koszary')"],
  ['spichlerz-no-owner-filter', 'if (c.ownerId !== ownerId) continue;', ''],
  ['spichlerz-owner-inverted', 'if (c.ownerId !== ownerId) continue;', 'if (c.ownerId === ownerId) continue;'],
  ['spichlerz-default-true', '  return false;\n}', '  return true;\n}'],
];

const tmp = mkdtempSync(join(tmpdir(), 'k04b2-mut-'));
let detected = 0;
let survived = 0;
const survivors = [];
try {
  for (const [label, from, to] of MUTANTS) {
    const count = original.split(from).length - 1;
    if (count !== 1) {
      console.error(`BLAD: fragment mutanta ${label} wystepuje ${count} razy (oczekiwano 1)`);
      process.exit(2);
    }
    const mutated = original.replace(from, to);
    const mutFile = join(tmp, `${label}.ts`);
    writeFileSync(mutFile, mutated);
    let exit = 0;
    try {
      execFileSync(process.execPath, [HARNESS, '--pin-dir', PIN_DIR, '--v2', mutFile], { stdio: 'pipe' });
    } catch (e) {
      exit = e.status ?? 2;
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
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
console.log(`MUTACJI=${MUTANTS.length} WYKRYTYCH=${detected} PRZEZYTYCH=${survived}${survivors.length ? ' ' + survivors.join(',') : ''}`);
process.exit(survived === 0 ? 0 : 1);
