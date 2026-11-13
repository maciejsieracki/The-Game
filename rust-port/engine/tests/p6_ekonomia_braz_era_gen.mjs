// P6 EKONOMIA-BRAZ-ERA (R-RUSTPORT-P6-EKONOMIA-BRAZ-ERA-Q1, runda 2): generator wektorow przepustowosci brazu
// WYKONUJACY tekst pinu (pin 07d2fbd72). Uruchomienie (Node 22):
//   node rust-port/engine/tests/p6_ekonomia_braz_era_gen.mjs
// Wynik -> rust-port/engine/tests/p6_ekonomia_braz_era_vectors/braz.json
//
// Zasada: nic nie jest przepisywane recznie. Z pinu wycinane sa (po nazwie, z walidacja ksztaltu):
//   * gra/src/game/converters.ts: DEFAULT_CONVERTER_RECIPES, zbiory/stale CONVERTER_*, loadThroughput,
//     converterThroughputEraParamKey, converterOutputMultiplierForEra, converterThroughputForEra,
//     converterThroughputsForEra;
//   * gra/src/game/citizen-consumption-era.ts: CITIZEN_CONSUMPTION_ERA_STEP, citizenConsumptionEraMultiplier;
//   * gra/src/game/turn-economy.ts: DWIE sciezki weba budujace `converterThroughputsForEra` z lambdy
//     `(recipe, ownerEra) => {...}`:
//       - sciezka 1 = podglad (`throughputsForOwner`, ok. linia 1503): loadThroughput z fallbackiem receptury;
//       - sciezka 2 = tick glowny (`converterThroughputsForOwner`, ok. linia 2484): fallbackiem
//         `converterThroughputs[recipe.id]` (BAZA z `loadThroughput(raw, throughputParamKey, ...)`).
//     Lambda jest wykonywana przez `new Function`, po zdjeciu typow TypeScript (module.stripTypeScriptTypes).
// Straznik: SHA-256 zlaczonych wycietych fragmentow pinu (wartosc w tescie Rust). Zmiana pinu -> blad zamiast
// cichych wektorow.
//
// Wejscia wektorow: pin `gra/data/econ-params.json` (sekcja `budynki`) oraz przypadki syntetyczne:
//   * "econ"       -- pelne budynki z pinu (produkcja);
//   * "empty"      -- {} (brak wpisow -> fallbacki);
//   * "huta_only"  -- tylko nadpisanie budynek_huta_przepustowosc=30, bez wierszy brazu epoka2/3 -- ROZBIEZNOSC
//                     sciezek 1 i 2 (fallback receptury 50 vs baza huty 30); raportowana jawnie.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const FILES = {
  converters: 'gra/src/game/converters.ts',
  citizen: 'gra/src/game/citizen-consumption-era.ts',
  turnEconomy: 'gra/src/game/turn-economy.ts',
  econParams: 'gra/data/econ-params.json',
};

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const gitShow = (path) => execFileSync('git', ['show', `${PIN}:${path}`], {
  cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
});

const conv = gitShow(FILES.converters).split('\n');
const cit = gitShow(FILES.citizen).split('\n');
const te = gitShow(FILES.turnEconomy).split('\n');
const econ = JSON.parse(gitShow(FILES.econParams));

// Wycina top-level deklaracje: od linii pasujacej do `startRe` do pierwszej linii konczacej blok
// (kolumna 0: `}`, `};`, `];`, `]);`), albo do tej samej linii gdy deklaracja jest jednolinijkowa.
function extract(lines, startRe, label) {
  const idx = lines.findIndex((l) => startRe.test(l));
  if (idx < 0) throw new Error(`pin: brak deklaracji ${label}`);
  const first = lines[idx];
  const count = (s, ch) => [...s].filter((c) => c === ch).length;
  const balanced = (s) => count(s, '(') === count(s, ')') && count(s, '[') === count(s, ']') && count(s, '{') === count(s, '}');
  if (/;\s*$/.test(first) && balanced(first)) return first;
  for (let j = idx + 1; j < lines.length; j++) {
    if (/^(\}|\};|\];|\]\);)\s*$/.test(lines[j])) return lines.slice(idx, j + 1).join('\n');
  }
  throw new Error(`pin: nie znaleziono konca ${label}`);
}

const FRAGMENTS = [
  ['converters', extract(conv, /^export const DEFAULT_CONVERTER_RECIPES\b/, 'DEFAULT_CONVERTER_RECIPES')],
  ['converters', extract(conv, /^export const CONVERTER_ERA_SCALING_RECIPE_IDS\b/, 'CONVERTER_ERA_SCALING_RECIPE_IDS')],
  ['converters', extract(conv, /^export const CONVERTER_ERA_SCALING_PCT\b/, 'CONVERTER_ERA_SCALING_PCT')],
  ['converters', extract(conv, /^export const CONVERTER_FOUNDRY_ERA_RECIPE_IDS\b/, 'CONVERTER_FOUNDRY_ERA_RECIPE_IDS')],
  ['converters', extract(conv, /^export const CONVERTER_OUTPUT_ERA_PCT_BY_RECIPE\b/, 'CONVERTER_OUTPUT_ERA_PCT_BY_RECIPE')],
  ['converters', extract(conv, /^export const CONVERTER_OUTPUT_MULT_KEY_SUFFIX\b/, 'CONVERTER_OUTPUT_MULT_KEY_SUFFIX')],
  ['converters', extract(conv, /^export function loadThroughput\b/, 'loadThroughput')],
  ['converters', extract(conv, /^export function converterThroughputEraParamKey\b/, 'converterThroughputEraParamKey')],
  ['converters', extract(conv, /^export function converterOutputMultiplierForEra\b/, 'converterOutputMultiplierForEra')],
  ['converters', extract(conv, /^export function converterThroughputForEra\b/, 'converterThroughputForEra')],
  ['converters', extract(conv, /^export function converterThroughputsForEra\b/, 'converterThroughputsForEra')],
  ['citizen', extract(cit, /^export const CITIZEN_CONSUMPTION_ERA_STEP\b/, 'CITIZEN_CONSUMPTION_ERA_STEP')],
  ['citizen', extract(cit, /^export function citizenConsumptionEraMultiplier\b/, 'citizenConsumptionEraMultiplier')],
];

// Lambdy dwoch sciezek weba (turn-economy.ts) -- dokladnie dwa wystapienia `(recipe, ownerEra) => {`.
const lambdaLines = te.reduce((acc, l, i) => (l.trim() === '(recipe, ownerEra) => {' ? [...acc, i] : acc), []);
if (lambdaLines.length !== 2) throw new Error(`pin: oczekiwano 2 lambd (recipe, ownerEra), jest ${lambdaLines.length}`);
const lambdaText = (startIdx) => {
  for (let j = startIdx + 1; j < te.length; j++) {
    if (te[j].trim() === '},') return te.slice(startIdx, j + 1).join('\n');
  }
  throw new Error('pin: koniec lambdy');
};
const LAMBDA_PATH1 = lambdaText(lambdaLines[0]); // podglad, turn-economy.ts ~1503
const LAMBDA_PATH2 = lambdaText(lambdaLines[1]); // tick glowny, turn-economy.ts ~2484
if (!LAMBDA_PATH1.includes('loadThroughput(raw, eraParamKey ?? recipe.throughputParamKey')) throw new Error('pin: lambda sciezki 1 zmieniona');
if (!LAMBDA_PATH2.includes('converterThroughputs[recipe.id] ?? recipe.throughputFallback')) throw new Error('pin: lambda sciezki 2 zmieniona');

const FRAGMENT_TEXT = [...FRAGMENTS.map(([, t]) => t), LAMBDA_PATH1, LAMBDA_PATH2].join('\n');
const FRAGMENT_SHA256 = createHash('sha256').update(FRAGMENT_TEXT).digest('hex');

// Usuniecie `export`, zdjecie typow; wykonanie w `new Function` (bez modulow).
const plain = (src) => {
  try {
    return stripTypeScriptTypes(src.replace(/^export /gm, ''));
  } catch (e) {
    throw new Error(`strip: ${e.message}\n${src.slice(0, 400)}`);
  }
};
const core = FRAGMENTS.map(([, t]) => plain(t)).join('\n');
const factory = new Function(`${core}
return { DEFAULT_CONVERTER_RECIPES, loadThroughput, converterThroughputEraParamKey, converterThroughputsForEra,
  converterThroughputForEra, converterOutputMultiplierForEra, CONVERTER_FOUNDRY_ERA_RECIPE_IDS };`);
const W = factory();
const lam1 = new Function('loadThroughput', 'converterThroughputEraParamKey', 'raw', 'difficulty',
  `return ${plain(LAMBDA_PATH1.replace(/,\s*$/, ''))};`);
const lam2 = new Function('loadThroughput', 'converterThroughputEraParamKey', 'rawForConverters', 'difficulty', 'converterThroughputs',
  `return ${plain(LAMBDA_PATH2.replace(/,\s*$/, ''))};`);

const DIFFICULTY = 'normal';

// Sciezka 2: `converterThroughputs` budowane jak w pinie (turn-economy.ts ~2463-2468), z tego samego raw.
function pathThroughputs(path, raw) {
  if (path === 1) {
    return (era) => W.converterThroughputsForEra(
      (recipe, ownerEra) => lam1(W.loadThroughput, W.converterThroughputEraParamKey, raw, DIFFICULTY)(recipe, ownerEra),
      era,
    );
  }
  const converterThroughputs = {};
  for (const recipe of W.DEFAULT_CONVERTER_RECIPES) {
    converterThroughputs[recipe.id] = W.loadThroughput(raw, recipe.throughputParamKey, DIFFICULTY, recipe.throughputFallback);
  }
  return (era) => W.converterThroughputsForEra(
    (recipe, ownerEra) => lam2(W.loadThroughput, W.converterThroughputEraParamKey, raw, DIFFICULTY, converterThroughputs)(recipe, ownerEra),
    era,
  );
}

const ERAS = [NaN, Infinity, -Infinity, -3, 0, 0.5, 1, 1.5, 2, 2.5, 2.999, 3, 3.5, 4, 5, 10];
const encEra = (e) => (Number.isFinite(e) ? e : String(e));
const RAW_CASES = {
  econ: { budynki: econ.budynki },
  empty: {},
  huta_only: { budynki: { budynek_huta_przepustowosc: { [DIFFICULTY]: 30 } } },
};

const cases = [];
for (const [name, raw] of Object.entries(RAW_CASES)) {
  const p1 = pathThroughputs(1, raw);
  const p2 = pathThroughputs(2, raw);
  for (const era of ERAS) {
    const keys = {};
    for (const recipe of W.DEFAULT_CONVERTER_RECIPES) {
      keys[recipe.id] = W.converterThroughputEraParamKey(recipe, era) ?? null;
    }
    cases.push({ raw: name, era: encEra(era), eraParamKey: keys, path1: p1(era), path2: p2(era) });
  }
}

// Kontrola spojnosci z pinem: brazy maja wiersze per epoka, zbior foundry NIE zawiera brazu.
const brazIds = W.DEFAULT_CONVERTER_RECIPES.filter((r) => r.throughputEraParamKeys).map((r) => r.id);
if (brazIds.length !== 3) throw new Error(`pin: oczekiwano 3 receptur brazu z wierszami, jest ${brazIds.length}`);
if (W.CONVERTER_FOUNDRY_ERA_RECIPE_IDS.size !== 3) throw new Error('pin: zbior foundry != 3');
for (const id of brazIds) if (W.CONVERTER_FOUNDRY_ERA_RECIPE_IDS.has(id)) throw new Error(`pin: ${id} w zbiorze foundry`);

const here2 = join(here, 'p6_ekonomia_braz_era_vectors');
mkdirSync(here2, { recursive: true });
const out = {
  pin: PIN,
  fragmentSha256: FRAGMENT_SHA256,
  difficulty: DIFFICULTY,
  brazIds,
  rawCases: RAW_CASES,
  cases,
};
writeFileSync(join(here2, 'braz.json'), `${JSON.stringify(out, null, 1)}\n`);
console.log(`OK cases=${cases.length} sha256=${FRAGMENT_SHA256}`);
