#!/usr/bin/env node
/**
 * gen-k09b-k06b-delegates.mjs — generator `src/controller/cityPanelK06bDelegates.ts` (P5-8 K09B, zadanie (1)).
 *
 * Źródło: `K06B_FN_NAMES` (`ui/cityPanel/k06b-deps.ts`) minus delegaty już podpięte przez `installK08cWiring`
 * i `clearPinnedDetail` (wiring w `cityPanelWiring.ts`). Dla każdej pozostałej nazwy:
 *   - jedna definicja `export function|const <nazwa>` w `src/` → import z tego modułu (kopia pinu, K06B-Z2);
 *   - wiele definicji → wybór z tabeli `PREFER` (udokumentowany w P5-8-K09B.md §4, NIE_ZMIERZONO względem pinu);
 *     bez wpisu w tabeli: pierwsza w porządku alfabetycznym ścieżek;
 *   - zero definicji → delegat GŁOŚNY (`niePodpiete`, rzuca przy wywołaniu z nazwą długu K09B-D4), nie atrapa `undefined`.
 *
 * Użycie (z `src-tauri/frontend-v2/`): node tools/dom-harness/gen-k09b-k06b-delegates.mjs
 * Wynik: nadpisuje `src/controller/cityPanelK06bDelegates.ts` (wygenerowany, nie edytować ręcznie).
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const V2 = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const SRC = join(V2, 'src');
const OUT = join(SRC, 'controller/cityPanelK06bDelegates.ts');

/** Nazwy już podpięte przez wiring (nie generujemy ich ponownie). */
const ALREADY = new Set([
  'clearPinnedDetail', 'readPodzialPracy', 'cityPracaSplit', 'procentPuliImperiumZBudynkow', 'computeView',
  'sumOwnedBuildingsUpkeep', 'groupBuiltBuildingIds', 'appendRecruitMilitaryResourceStrip', 'purchasableUnits',
  'sortByUnitPowerDescending', 'getUnitDef', 'resolveEmpireSnap', 'cfg', 'PODZIAL_PRACY_PULA_TIP',
  'PODZIAL_PRACY_PULA_LBL_PELNA', 'etaTurns', 'getProd', 'frontItem', 'psiRowLabel', 'statChipBrand',
  'resourceTextClass', 'signed', 'tury', 'cityPanelChipIconWrap', 'el',
  // K09B-Z3: stan `showEraBuildingPreview` (k01a `export let`) — ręczny delegat w `cityPanelWiring.ts`.
  'getShowEraBuildingPreview',
]);

/** Wybór definicji przy wielu kandydatach (decyzja K09B-Z2; wpisy muszą mieć jedną ścieżkę z listy kandydatów). */
const PREFER = {
  rerender: 'ui/cityPanel/k09a-rerender.ts',
  gameData: 'ui/cityPanel/k05a-fundament.ts',
  daninaLabelForCity: 'ui/cityPanel/k01b-t.ts',
  findBuildingDef: 'ui/cityPanel/k01b-t.ts',
  findUnitDef: 'ui/cityPanel/k01b-t.ts',
  ownerSurowcePoolFor: 'ui/cityPanel/k05a-fundament.ts',
  productionCtxForCity: 'ui/cityPanel/k05a-fundament.ts',
  stockResourceLabel: 'ui/cityPanel/k05a-fundament.ts',
  isMeCity: 'ui/cityPanel/k05b-host.ts',
  formatManpower: 'ui/cityPanel/k05b-host.ts',
  appendBuildActionButtons: 'ui/cityPanel/k05b-host.ts',
  upgradeChainSteps: 'ui/cityPanel/k05b-host.ts',
  attachHoverDetail: 'ui/hoverDetailDock.ts',
  attachInteractiveDetail: 'ui/hoverDetailDock.ts',
  showHoverDetailNow: 'ui/hoverDetailDock.ts',
  showPinnedDetail: 'ui/hoverDetailDock.ts',
};

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out.sort();
}

const k06bDeps = readFileSync(join(SRC, 'ui/cityPanel/k06b-deps.ts'), 'utf8');
const allNames = JSON.parse(k06bDeps.match(/K06B_FN_NAMES = (\[.*?\]) as const/)[1]);
const files = walk(SRC);
const sources = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));

const todo = allNames.filter((n) => !ALREADY.has(n));
const byModule = new Map();
const loud = [];
const ambiguous = [];
for (const name of todo) {
  const rx = new RegExp(`^export (function|const) ${name}\\b`, 'm');
  const cands = files.filter((f) => rx.test(sources.get(f))).map((f) => relative(SRC, f));
  if (cands.length === 0) {
    loud.push(name);
    continue;
  }
  let pick = cands[0];
  if (cands.length > 1) {
    ambiguous.push({ name, cands, pick: PREFER[name] ?? cands[0] });
    pick = PREFER[name] ?? cands[0];
    if (!cands.includes(pick)) throw new Error(`PREFER[${name}] = ${pick} nie jest kandydatem: ${cands.join(', ')}`);
  }
  const key = relative(join(SRC, 'controller'), join(SRC, pick)).replace(/\.ts$/, '');
  if (!byModule.has(key)) byModule.set(key, []);
  byModule.get(key).push(name);
}

const lines = [];
lines.push('/**');
lines.push(' * controller/cityPanelK06bDelegates.ts — WYGENEROWANY (tools/dom-harness/gen-k09b-k06b-delegates.mjs, P5-8 K09B).');
lines.push(' * Nie edytować ręcznie. Delegaty K06B z kopii portu (K06B-Z2) i głośne atrapy dla nazw bez definicji (K09B-D4).');
lines.push(' */');
lines.push("import type { K06bDeps } from '../ui/cityPanel/k06b-deps';");
lines.push('');
const modKeys = [...byModule.keys()].sort();
const aliasOf = new Map();
let n = 0;
for (const mod of modKeys) {
  const names = byModule.get(mod).slice().sort();
  const specs = names.map((name) => {
    const alias = `d${n++}`;
    aliasOf.set(name, alias);
    return `${name} as ${alias}`;
  });
  lines.push(`import { ${specs.join(', ')} } from '${mod}';`);
}
lines.push('');
lines.push("/** Atrapa głośna: delegat bez definicji w v2 (dług K09B-D4) — rzuca przy wywołaniu z nazwą. */");
lines.push('const niePodpiete = (name: string) => (..._args: unknown[]): never => {');
lines.push('  throw new Error(`K06B delegat ${name} nie ma definicji w v2 (dług K09B-D4, P5-8-K09B.md §5)`);');
lines.push('};');
lines.push('');
lines.push('/** Delegaty K06B z wiringu (ta sama nazwa co w `K06B_FN_NAMES`). */');
lines.push('export const K06B_PORT_DELEGATES: K06bDeps = {');
for (const name of todo.slice().sort()) {
  if (loud.includes(name)) lines.push(`  ${name}: niePodpiete('${name}'),`);
  else lines.push(`  ${name}: ${aliasOf.get(name)},`);
}
lines.push('};');
lines.push('');
lines.push(`/** Nazwy bez definicji w v2 (głośne atrapy, dług K09B-D4). */`);
lines.push(`export const K06B_LOUD_MISSING: readonly string[] = ${JSON.stringify(loud.slice().sort())};`);
lines.push('');

writeFileSync(OUT, lines.join('\n'));
console.log(`wygenerowano ${relative(V2, OUT)}: ${todo.length - loud.length} z portu, ${loud.length} głośnych, niejednoznacznych ${ambiguous.length}`);
for (const a of ambiguous) console.log(`  ambig ${a.name}: wybrano ${a.pick} z [${a.cands.join(', ')}]`);
