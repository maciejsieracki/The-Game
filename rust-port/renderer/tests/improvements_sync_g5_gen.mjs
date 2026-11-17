// R-RUSTPORT-P4-1-G5-NORM-OPUS: generator of the G5 vectors (key normalisation
// `LEGACY_KEY_ALIASES` / `normalizeImprovementKey`, fallback to `hex.ulepszenie`
// in `improvementKeysForHex`, and `mergedImprovementLayers`).
//
// The generator EXECUTES the pin `07d2fbd72` text (files from `git show`, not
// from the working tree), excerpts below, each guarded by its first-line
// signature; the SHA-256 of each excerpt is written to `sources` in
// vectors.json, so `--check` fails on any drift of the pin text:
// - `gra/src/game/terrain-improvements.ts`: `LEGACY_KEY_ALIASES` (:32-34),
//   `normalizeImprovementKey` (:117-123), `foodLayerFromAnimalDeposit`
//   (:349-353), `improvementKeysForHex` (:358-380);
// - `gra/src/main.ts`: `mergedImprovementLayers` (:3126-3137);
// - `gra/src/types/hex.ts`: enum `Nakladka` (:30-39);
// - data `gra/data/terrain-improvements.json` (SHA-256 of the whole file) as
//   `IMPROVEMENTS` (`terrain-improvements.ts:29`).
// TypeScript is stripped with the TypeScript compiler (`transpileModule`),
// path from TYPESCRIPT_JS (default /opt/node22/lib/node_modules/typescript/lib/typescript.js).
//
// `placedImprovements.get(hexKey)` is filled as the pin keeps it in step with
// `hex.ulepszenia` (`syncHexUlepszenieFields`, main.ts:16275-16289): a copy of
// a non-empty `ulepszenia`, nothing otherwise.
//
// Usage (from any directory in the repo):
//   node rust-port/renderer/tests/improvements_sync_g5_gen.mjs          -> writes vectors.json
//   node rust-port/renderer/tests/improvements_sync_g5_gen.mjs --check  -> EXIT 1 on difference

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PIN = '07d2fbd72';
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, 'improvements_sync_g5_vectors');
const OUT = join(OUT_DIR, 'vectors.json');
const CHECK = process.argv.includes('--check');
const TS_PATH = process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
const ts = createRequire(import.meta.url)(TS_PATH);

const show = (path) => execFileSync('git', ['show', `${PIN}:${path}`], { cwd: HERE, encoding: 'utf8', maxBuffer: 64 << 20 });
const sha256 = (text) => createHash('sha256').update(text).digest('hex');

const FILES = {
  ti: 'gra/src/game/terrain-improvements.ts',
  main: 'gra/src/main.ts',
  hex: 'gra/src/types/hex.ts',
};
const EXCERPTS = [
  { file: 'hex', name: 'Nakladka', from: 30, to: 39, sig: 'export enum Nakladka {' },
  { file: 'ti', name: 'LEGACY_KEY_ALIASES', from: 32, to: 34, sig: 'const LEGACY_KEY_ALIASES' },
  { file: 'ti', name: 'normalizeImprovementKey', from: 117, to: 123, sig: 'export function normalizeImprovementKey(' },
  { file: 'ti', name: 'foodLayerFromAnimalDeposit', from: 349, to: 353, sig: 'export function foodLayerFromAnimalDeposit(' },
  { file: 'ti', name: 'improvementKeysForHex', from: 358, to: 380, sig: 'export function improvementKeysForHex(' },
  { file: 'main', name: 'mergedImprovementLayers', from: 3126, to: 3137, sig: 'function mergedImprovementLayers(' },
];
const texts = Object.fromEntries(Object.entries(FILES).map(([k, p]) => [k, show(p)]));
const dataText = show('gra/data/terrain-improvements.json');
const sources = { 'gra/data/terrain-improvements.json': sha256(dataText) };
const excerptText = {};
for (const ex of EXCERPTS) {
  const lines = texts[ex.file].split('\n').slice(ex.from - 1, ex.to);
  if (!lines[0].trimStart().startsWith(ex.sig)) {
    console.error(`${ex.name}: signature drift at ${FILES[ex.file]}:${ex.from}: ${lines[0]}`);
    process.exit(2);
  }
  const body = lines.join('\n');
  excerptText[ex.name] = body;
  sources[`${FILES[ex.file]}:${ex.from}-${ex.to} ${ex.name}`] = sha256(body);
}

const strip = (s) => s.replace(/^(\s*)export\s+/gm, '$1');
const tsModule = [
  `const IMPROVEMENTS = ${dataText.trim()};`,
  strip(excerptText.Nakladka),
  strip(excerptText.LEGACY_KEY_ALIASES),
  strip(excerptText.normalizeImprovementKey),
  strip(excerptText.foodLayerFromAnimalDeposit),
  strip(excerptText.improvementKeysForHex),
  'const map = { hexes: {} as Record<string, any> };',
  'const placedImprovements = new Map<string, string[]>();',
  strip(excerptText.mergedImprovementLayers),
  'export { IMPROVEMENTS, LEGACY_KEY_ALIASES, normalizeImprovementKey, improvementKeysForHex, mergedImprovementLayers, map, placedImprovements };',
].join('\n');
const js = ts.transpileModule(tsModule, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const tmp = mkdtempSync(join(tmpdir(), 'g5-gen-'));
let pin;
try {
  const f = join(tmp, 'pin.mjs');
  writeFileSync(f, js);
  pin = await import(pathToFileURL(f).href);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Tables read from the executed pin.
// ---------------------------------------------------------------------------
const aliases = Object.entries(pin.LEGACY_KEY_ALIASES).map(([from, to]) => [from, to]);
const tableKeys = Object.keys(pin.IMPROVEMENTS);
const prototypeKeys = Object.getOwnPropertyNames(Object.prototype);

// ---------------------------------------------------------------------------
// normalizeImprovementKey: every alias, every table key, every prototype
// name, empty, 'brak', unknown and every `Ulepszenie` web value.
// ---------------------------------------------------------------------------
const ULEPSZENIE = ['brak', 'farma', 'irygacja', 'kopalnia', 'droga', 'droga_brukowana', 'pastwisko', 'tartak'];
const rawKeys = [
  ...new Set([
    '', 'brak', 'nieznane', 'kopalnia', 'Farma', ' farma', 'bydlo ', 'pastwisko',
    ...aliases.flatMap(([a, b]) => [a, b]),
    ...tableKeys,
    ...prototypeKeys,
    ...ULEPSZENIE,
  ]),
];
const normalize = rawKeys.map((raw) => ({ raw, out: pin.normalizeImprovementKey(raw) ?? null }));

// ---------------------------------------------------------------------------
// Hex cases: improvementKeysForHex + mergedImprovementLayers.
// `pin` names the pin lines the case exercises.
// ---------------------------------------------------------------------------
const H = (name, pinRef, ulepszenie, ulepszenia, nakladka = 'brak', improvementKey = null) =>
  ({ name, pin: pinRef, ulepszenie, ulepszenia, nakladka, improvementKey });
const TI = 'game/terrain-improvements.ts';
const cases = [
  // Fallback to hex.ulepszenie (ulepszenia absent / empty), :365-370, :377-379.
  ...ULEPSZENIE.map((u) => H(`fallback_absent_${u}`, `${TI}:365-370,377-379`, u, null)),
  ...ULEPSZENIE.map((u) => H(`fallback_empty_${u}`, `${TI}:365-370,377-379`, u, [])),
  // ulepszenia decides alone, :371-376 (no fallback even when all keys drop).
  H('ulepszenia_over_ulepszenie', `${TI}:371-376`, 'farma', ['tartak']),
  H('ulepszenia_all_unknown_no_fallback', `${TI}:371-376`, 'farma', ['kopalnia']),
  H('ulepszenia_brak_no_fallback', `${TI}:371-376`, 'tartak', ['brak']),
  H('ulepszenia_empty_key_no_fallback', `${TI}:371-376`, 'tartak', ['']),
  // Aliases (one case per alias), :32-34, :119.
  ...aliases.map(([a]) => H(`alias_list_${a}`, `${TI}:32-34,119`, 'brak', [a])),
  ...aliases.map(([a]) => H(`alias_list_dup_${a}`, `${TI}:32-34,119,375`, 'brak', [a, aliases.find((x) => x[0] === a)[1]])),
  // Duplicates keep the first position, :375.
  H('dup_first_position', `${TI}:375`, 'brak', ['droga', 'farma', 'droga']),
  // Name kept from DODATEK r2 (mutation (b') references it). "skipped" means only in
  // improvementKeysForHex (:118); merged still holds '' and 'brak' as placed layers
  // (main.ts:3132-3135, DECYZJA 2), expected [farma, droga, '', brak].
  H('brak_and_empty_skipped', `${TI}:118`, 'brak', ['', 'farma', 'brak', 'droga']),
  // Unknown key dropped by normalisation, re-added as placed layer (main.ts:3132-3135).
  H('unknown_dropped_then_placed', `${TI}:120-122; main.ts:3132-3135`, 'brak', ['nieznane', 'farma']),
  H('legacy_kopalnia', `${TI}:120-122; main.ts:3132-3135`, 'kopalnia', ['kopalnia']),
  // Prototype names are truthy in IMPROVEMENTS, :120-122.
  H('prototype_key', `${TI}:120-122`, 'brak', ['constructor', 'toString']),
  // Deposit layer between keysForHex and placed layers, main.ts:3130-3131.
  H('deposit_bydla_with_alias', 'main.ts:3129-3135', 'brak', ['pastwisko'], 'zloze_bydla'),
  H('deposit_owiec_fallback', 'main.ts:3129-3135', 'pastwisko', null, 'zloze_owiec'),
  H('deposit_bydla_fallback_pastwisko', 'main.ts:3129-3135', 'pastwisko', null, 'zloze_bydla'),
  H('deposit_only', 'main.ts:3129-3131', 'brak', null, 'zloze_owiec'),
  // improvementKey is not read on the render path (improvementKeysForHex has no such input).
  H('improvement_key_not_read', `${TI}:358-380`, 'farma', null, 'brak', 'tartak'),
  H('improvement_key_alias_not_read', `${TI}:358-380`, 'brak', ['droga'], 'brak', 'pastwisko'),
];

const hexes = cases.map((c, i) => {
  const hexKey = `${i},0`;
  const hex = { ulepszenie: c.ulepszenie, nakladka: c.nakladka };
  if (c.ulepszenia !== null) hex.ulepszenia = [...c.ulepszenia];
  if (c.improvementKey !== null) hex.improvementKey = c.improvementKey;
  pin.map.hexes[hexKey] = hex;
  if (c.ulepszenia && c.ulepszenia.length) pin.placedImprovements.set(hexKey, [...c.ulepszenia]);
  return {
    ...c,
    keysForHex: pin.improvementKeysForHex(hex),
    merged: pin.mergedImprovementLayers(hexKey),
  };
});

const out = {
  topic: 'R-RUSTPORT-P4-1-G5-NORM-OPUS',
  pin: PIN,
  generator: 'rust-port/renderer/tests/improvements_sync_g5_gen.mjs',
  sources,
  aliases: { pin: `${TI}:32-34`, entries: aliases },
  tableKeys: { pin: `${TI}:29 (gra/data/terrain-improvements.json)`, keys: tableKeys },
  prototypeKeys: { pin: `${TI}:29,117-123 (Object.prototype, Node ${process.versions.node})`, keys: prototypeKeys },
  normalize: { pin: `${TI}:117-123`, cases: normalize },
  hexes,
};
const text = `${JSON.stringify(out, null, 1)}\n`;
if (CHECK) {
  let old = '';
  try { old = readFileSync(OUT, 'utf8'); } catch { /* missing */ }
  if (old !== text) {
    console.error('vectors.json differs from the pin output');
    process.exit(1);
  }
  console.log(`OK ${OUT} (${hexes.length} hexes, ${normalize.length} keys)`);
} else {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT, text);
  console.log(`wrote ${OUT} (${hexes.length} hexes, ${normalize.length} keys)`);
}
