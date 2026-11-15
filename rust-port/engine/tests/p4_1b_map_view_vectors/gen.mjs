// P4-1B-Q3 (R-RUSTPORT-P4-1B-Q3-MAP-VIEW): generator wektorow producenta `MapViewDto` i
// `HexDynDto` z mapy zapisu (snapshot).
//
// Generator WYKONUJE kod pinu `07d2fbd72` (pliki z `git show`, nie z drzewa roboczego):
// - `gra/src/map/mapSnapshot.ts` w calosci (tylko importy typow): `serializeMapForSave` ->
//   snapshot (wejscie testu Rust) i `buildGameMapFromSnapshot` -> mapa, na ktorej liczy sie
//   wynik (Rust robi to samo: `build_game_map_from_snapshot`);
// - `gra/src/map/road-network.ts` w calosci (modul czysty): `computeRoadMask`;
// - wyciete fragmenty (straznik SHA-256 kazdego fragmentu, lista EXCERPTS nizej):
//   `render/scene.ts` (lancuch tras do renderu :1306, :1312-1318; rodzaje :2873-2874),
//   `map/gen-helpers.ts` (land/medium/trim/sanitize/repair i pomocnicze),
//   `game/terrain-improvements.ts` (`normalizeImprovementKey`, `improvementKeysForHex`,
//   `hexHasCoveringTerrainImprovement`), `map/road-movement.ts` (`hexHasRoad`),
//   `main.ts` (`hexHasRoadAt` :3144-3147, regula wioski :3365-3368), `input/picker.ts` (`keyOf`),
//   `types/hex.ts` (enum `TerenBazowy`, zamieniany na obiekt — Node nie usuwa enumow TS),
//   dane `gra/data/terrain-improvements.json` (straznik SHA-256 calego pliku).
//
// WYMAGANY Node >= 22.18.0 (linia 22) albo >= 23.6.0 (import `.ts` i `stripTypeScriptTypes`).
//
// Uzycie (z dowolnego katalogu w repo):
//   node rust-port/engine/tests/p4_1b_map_view_vectors/gen.mjs          -> zapisuje vectors.json
//   node rust-port/engine/tests/p4_1b_map_view_vectors/gen.mjs --check  -> EXIT 1 przy roznicy

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

{
  const [maj, min] = process.versions.node.split('.').map(Number);
  const ok = maj > 23 || (maj === 23 && min >= 6) || (maj === 22 && min >= 18);
  if (!ok) {
    console.error(`Node ${process.versions.node} za stary: wymagany >= 22.18.0 (22.x) albo >= 23.6.0`);
    process.exit(2);
  }
}

const PIN = '07d2fbd72';
const PIN_FULL = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'vectors.json');
const CHECK = process.argv.includes('--check');

const show = (path) => execFileSync('git', ['show', `${PIN}:${path}`], { cwd: HERE, encoding: 'utf8', maxBuffer: 64 << 20 });
const sha256 = (text) => createHash('sha256').update(text).digest('hex');

// ---------------------------------------------------------------------------
// Fragmenty pinu (linie 1-indeksowane, wlacznie) + straznik SHA-256.
// ---------------------------------------------------------------------------
const FILES = {
  scene: 'gra/src/render/scene.ts',
  gh: 'gra/src/map/gen-helpers.ts',
  ti: 'gra/src/game/terrain-improvements.ts',
  rm: 'gra/src/map/road-movement.ts',
  main: 'gra/src/main.ts',
  picker: 'gra/src/input/picker.ts',
  hex: 'gra/src/types/hex.ts',
};
const EXCERPTS = [
  // render/scene.ts — wejscie rodzajow i lancuch tras do renderu.
  { file: 'scene', name: 'pathsAll', from: 2873, to: 2874, sig: 'const pathsAll = map.riverPaths ?? [];' },
  { file: 'scene', name: 'mainPathsForJunction', from: 1306, to: 1306, sig: 'const mainPathsForJunction' },
  { file: 'scene', name: 'renderChain', from: 1312, to: 1318, sig: "const kind = kinds[pi] ?? 'main';" },
  // map/gen-helpers.ts
  { file: 'gh', name: 'HEX_DIRECTIONS', from: 125, to: 128, sig: 'export const HEX_DIRECTIONS' },
  { file: 'gh', name: 'isWaterTerrainLocal', from: 152, to: 154, sig: 'function isWaterTerrainLocal(' },
  { file: 'gh', name: 'hexKey', from: 157, to: 159, sig: 'export function hexKey(' },
  { file: 'gh', name: 'hexAxialDistance', from: 5344, to: 5348, sig: 'function hexAxialDistance(' },
  { file: 'gh', name: 'landRiverRenderPath', from: 5411, to: 5426, sig: 'export function landRiverRenderPath(' },
  { file: 'gh', name: 'mediumRiverRenderPath', from: 5445, to: 5459, sig: 'export function mediumRiverRenderPath(' },
  { file: 'gh', name: 'assertRiverPathAdjacent', from: 5550, to: 5562, sig: 'export function assertRiverPathAdjacent(' },
  { file: 'gh', name: 'sanitizeRiverPath', from: 5590, to: 5604, sig: 'export function sanitizeRiverPath(' },
  { file: 'gh', name: 'repairRiverPathAdjacency', from: 5618, to: 5659, sig: 'export function repairRiverPathAdjacency(' },
  { file: 'gh', name: 'isReliefTerrain', from: 5997, to: 5999, sig: 'function isReliefTerrain(' },
  { file: 'gh', name: 'canRiverFlowThrough', from: 6012, to: 6027, sig: 'function canRiverFlowThrough(' },
  { file: 'gh', name: 'isRiverLandTerrain', from: 7005, to: 7014, sig: 'function isRiverLandTerrain(' },
  { file: 'gh', name: 'trimMediumTailAlongMain', from: 7623, to: 7634, sig: 'function trimMediumTailAlongMain(' },
  { file: 'gh', name: 'trimMediumRenderPathAtMain', from: 8194, to: 8203, sig: 'export function trimMediumRenderPathAtMain(' },
  // game/terrain-improvements.ts
  { file: 'ti', name: 'IMPROVEMENTS', from: 29, to: 29, sig: 'const IMPROVEMENTS = improvementsJson' },
  { file: 'ti', name: 'LEGACY_KEY_ALIASES', from: 32, to: 34, sig: 'const LEGACY_KEY_ALIASES' },
  { file: 'ti', name: 'normalizeImprovementKey', from: 117, to: 123, sig: 'export function normalizeImprovementKey(' },
  { file: 'ti', name: 'improvementKeysForHex', from: 358, to: 379, sig: 'export function improvementKeysForHex(' },
  { file: 'ti', name: 'ROAD_IMPROVEMENT_KEYS', from: 382, to: 382, sig: 'export const ROAD_IMPROVEMENT_KEYS' },
  { file: 'ti', name: 'hexHasCoveringTerrainImprovement', from: 388, to: 392, sig: 'export function hexHasCoveringTerrainImprovement(' },
  // map/road-movement.ts
  { file: 'rm', name: 'isRoadImprovementKey', from: 59, to: 61, sig: 'export function isRoadImprovementKey(' },
  { file: 'rm', name: 'hexHasRoad', from: 64, to: 67, sig: 'export function hexHasRoad(' },
  // main.ts (integrator) i input/picker.ts
  { file: 'main', name: 'hexHasRoadAt', from: 3144, to: 3147, sig: 'function hexHasRoadAt(q: number, r: number): boolean {' },
  { file: 'main', name: 'villageRule', from: 3365, to: 3368, sig: 'const hex = map.hexes[hexKey];' },
  { file: 'main', name: 'roadMaskCall', from: 17083, to: 17083, sig: 'computeRoadMask(q, r, hexHasRoadAt),' },
  { file: 'picker', name: 'keyOf', from: 260, to: 262, sig: 'export function keyOf(' },
  // types/hex.ts
  { file: 'hex', name: 'TerenBazowy', from: 12, to: 24, sig: 'export enum TerenBazowy {' },
];
const EXPECTED_SHA = {
  pathsAll: '93e20d9c2407f383aa1e83a8be7cdaa5543a89f8a7d0d875541f3bbbeb91f559',
  mainPathsForJunction: '8ab60dc766caf0996f2c14d55ea8a47f6f5494476c8253b9eed3cfd9178e60b1',
  renderChain: 'e1f24ba0c0c1ad69ff7ccde96edb237af6aa4e9944d9406a006bf2d3208e857e',
  HEX_DIRECTIONS: '8361c602c13f7b2bf775db49644a7e4440aefcdcc7ace398fe16253a3eb76edf',
  isWaterTerrainLocal: 'ba6589fcc3fea5303b63f456414dd37b498077420e008fc50e20096ca51e2af8',
  hexKey: 'c7a6f2e0162370390f298d8b6a29389014b468866f77d4c437a7c3284554d044',
  hexAxialDistance: '03c257e1df2d2fe719da83d245f6385ca5de200fbb3b9f4fddc00b43f0421a83',
  landRiverRenderPath: '6670065806a143a5e007834b2db6bc0a02fd3c2d9aaa13e2604f903816e78d3e',
  mediumRiverRenderPath: '36b11903776a7b8c77b62c7aa023007c11c05ead3bcd82554cf2c3bf26aba25a',
  assertRiverPathAdjacent: 'dcddecf7cab7c19578c2bffea70ea3a901dd71cda2ae54e6ae2fc8fea6287062',
  sanitizeRiverPath: 'febb035f8296ebbc247863d4b7765bdf2b4311c02d48dd3cc2f5839ca9d0ff82',
  repairRiverPathAdjacency: '519ac4333215120a726cf820c1da52d995c23d5dcb13fa1f16e10aaa46051e58',
  isReliefTerrain: '5e388b7d841b343b70ac0a0d2b35e9663b11465d5eb19e6017bf63e0773e9c68',
  canRiverFlowThrough: 'f74d83c99e4970f6cebb889499f8be6203b0697b8ac2a31d7a8c048b098b5a7e',
  isRiverLandTerrain: '28b027c0515d42f187ab8ad702ced54c8bbb975e35cf09a95b20c9e3bd274e2b',
  trimMediumTailAlongMain: '1b0f74ef8feb92441e0dce51d1c45c9e3676e2001a65f440c42801655b62e1be',
  trimMediumRenderPathAtMain: '68aded7958c9991899874cda4b5eca6bd273b56af7d4f9024e07081f1db04fe7',
  IMPROVEMENTS: '691a482bd7518f4bd2377ad72a9b4a44ea8be7205c67bf4c995133a392a16750',
  LEGACY_KEY_ALIASES: '2d5e26b53096d94d09c3b1c40fa608a81369b7d05567f16747e65e8d43f16d78',
  normalizeImprovementKey: 'a286098cf2d3564637a68c4a5b5affa51225a70502c4e7cb53cc3aab7b623860',
  improvementKeysForHex: 'f0ea4fae082dec55829160b27836754fe41a552170b149e72286c9da9532a893',
  ROAD_IMPROVEMENT_KEYS: '6905791d4164ad8acee6704b4e26920914a9ca4e59c18399cadeb886571aaabb',
  hexHasCoveringTerrainImprovement: '8aa05212fdfe7cc0326237cdb357d6767d335a44cc491f666e3f10e5120980bd',
  isRoadImprovementKey: '6caafe9dd5cc994063de93664cd2cb4a00444579d1af018529277d506eb35c9d',
  hexHasRoad: '426e51c29bf4a476739aeae768de8877e70140672e13aac62c4d9f12be5579e3',
  hexHasRoadAt: '519aaf2046732baa88cc80def8a824326205adc1ee6d5b7e5418166e3d4e104e',
  villageRule: '3357b99c679b89379af859a91f67f40aa06964a5ab478c4ab3b85d85015a474c',
  roadMaskCall: 'de1e611ecfcb0a7440f65a4bbccfe6cf57ac43b29d9ca66bd15737eddf9220ef',
  keyOf: '8af2ad467d7c3b063fbb7fd16e4263f44a0db904b637ed498cd3df8e166160c2',
  TerenBazowy: 'd1ab7851d8a7c453ad854cb333db5e5032617ce2123a402ea59d39ff1ea45300',
};
const DATA_PATH = 'gra/data/terrain-improvements.json';
const MODULES = { snapshot: 'gra/src/map/mapSnapshot.ts', roadNetwork: 'gra/src/map/road-network.ts' };
const EXPECTED_FILE_SHA = {
  [DATA_PATH]: '4146751698371020b38039df974ef665200d1c71c69f27626901b9c31c523b4f',
  [MODULES.snapshot]: 'dac213ea12f63ea4598c1e1fb27f5c633537589406e0c82bdc26582bcce7e92a',
  [MODULES.roadNetwork]: 'd3283ded62ef5dfaeb699b6b78de0ff8ce8c9102674dece9c80e40ad89a7f997',
};

const sources = Object.fromEntries(Object.entries(FILES).map(([k, p]) => [k, show(p).split('\n')]));
const frag = {};
let shaFail = false;
const fill = [];
for (const ex of EXCERPTS) {
  const lines = sources[ex.file];
  if (!lines[ex.from - 1].includes(ex.sig)) {
    console.error(`${FILES[ex.file]}:${ex.from} nie zawiera ${ex.sig}: ${lines[ex.from - 1]}`);
    process.exit(2);
  }
  const text = lines.slice(ex.from - 1, ex.to).join('\n');
  // Funkcja wycieta w calosci: ostatnia linia to `}` na wcieciu linii sygnatury.
  if (/\bfunction\b|\benum\b/.test(ex.sig)) {
    const indent = lines[ex.from - 1].match(/^\s*/)[0];
    if (lines[ex.to - 1] !== `${indent}}`) {
      console.error(`${FILES[ex.file]}:${ex.to} nie zamyka ${ex.name}: ${lines[ex.to - 1]}`);
      process.exit(2);
    }
  }
  ex.sha256 = sha256(text);
  frag[ex.name] = text;
  if (EXPECTED_SHA[ex.name] === 'FILL') fill.push(`  ${ex.name}: '${ex.sha256}',`);
  else if (EXPECTED_SHA[ex.name] !== ex.sha256) {
    console.error(`STRAZNIK SHA: ${ex.name} = ${ex.sha256}, oczekiwano ${EXPECTED_SHA[ex.name]}`);
    shaFail = true;
  }
}
const fileText = {};
for (const p of [DATA_PATH, MODULES.snapshot, MODULES.roadNetwork]) {
  fileText[p] = show(p);
  const s = sha256(fileText[p]);
  if (EXPECTED_FILE_SHA[p] === 'FILL') fill.push(`  '${p}': '${s}',`);
  else if (EXPECTED_FILE_SHA[p] !== s) {
    console.error(`STRAZNIK SHA pliku: ${p} = ${s}, oczekiwano ${EXPECTED_FILE_SHA[p]}`);
    shaFail = true;
  }
}
if (fill.length) {
  console.error(`Brak skrotow (FILL):\n${fill.join('\n')}`);
  process.exit(2);
}
if (shaFail) process.exit(2);

// ---------------------------------------------------------------------------
// Skladanie wykonywalnego kodu pinu.
// ---------------------------------------------------------------------------
const tmp = mkdtempSync(join(tmpdir(), 'p4-1b-mapview-'));
let snapMod;
let roadMod;
try {
  const sp = join(tmp, 'mapSnapshot.ts');
  writeFileSync(sp, fileText[MODULES.snapshot]);
  snapMod = await import(pathToFileURL(sp).href);
  const rp = join(tmp, 'road-network.ts');
  writeFileSync(rp, fileText[MODULES.roadNetwork]);
  roadMod = await import(pathToFileURL(rp).href);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
const { serializeMapForSave, buildGameMapFromSnapshot } = snapMod;
const { computeRoadMask } = roadMod;

// `export enum TerenBazowy { A = 'a', ... }` -> `const TerenBazowy = { A: 'a', ... };`
const enumJs = frag.TerenBazowy
  .replace(/^export enum TerenBazowy \{/, 'const TerenBazowy = {')
  .replace(/^(\s*)(\w+)(\s*)=(\s*)('[a-z_]+'),/gm, '$1$2$3:$4$5,')
  .replace(/^\}$/m, '};');
const deExport = (t) => t.replace(/^export /gm, '');
const libTs = [
  enumJs,
  'const improvementsJson = __IMPROVEMENTS_JSON__;',
  frag.IMPROVEMENTS,
  frag.LEGACY_KEY_ALIASES,
  deExport(frag.normalizeImprovementKey),
  deExport(frag.improvementKeysForHex),
  deExport(frag.ROAD_IMPROVEMENT_KEYS),
  deExport(frag.hexHasCoveringTerrainImprovement),
  deExport(frag.isRoadImprovementKey),
  deExport(frag.hexHasRoad),
  deExport(frag.keyOf),
  deExport(frag.HEX_DIRECTIONS),
  frag.isWaterTerrainLocal,
  deExport(frag.hexKey),
  frag.hexAxialDistance,
  deExport(frag.landRiverRenderPath),
  deExport(frag.mediumRiverRenderPath),
  deExport(frag.assertRiverPathAdjacent),
  deExport(frag.sanitizeRiverPath),
  deExport(frag.repairRiverPathAdjacency),
  frag.isReliefTerrain,
  frag.canRiverFlowThrough,
  frag.isRiverLandTerrain,
  frag.trimMediumTailAlongMain,
  deExport(frag.trimMediumRenderPathAtMain),
  // Integrator (main.ts) dla jednej mapy: `map` i `cities` jak w zamknieciu `main.ts`.
  `function integrator(map, cities) {
${frag.hexHasRoadAt}
  function roadMaskAt(q, r) {
    return (
${frag.roadMaskCall.replace(/,\s*$/, '')}
    );
  }
  // Cialo petli \`syncVillageMeshes\` (:3365-3368): \`continue\` = heks bez wioski do narysowania.
  function villagePresent(hexKey) {
    for (const _once of [0]) {
${frag.villageRule}
      return true;
    }
    return false;
  }
  return { hexHasRoadAt, roadMaskAt, villagePresent };
}`,
  // render/scene.ts: wejscie rodzajow (:2873-2874) + lancuch (:1306, :1312-1318) dla KAZDEJ trasy.
  `function renderPaths(map) {
${frag.pathsAll}
  const paths = pathsAll;
  const kinds = pathKindsAll;
${frag.mainPathsForJunction}
  const out = [];
  for (let pi = 0; pi < paths.length; pi++) {
    const path = paths[pi]!;
${frag.renderChain}
    out.push(landPath);
  }
  return out;
}`,
].join('\n');
const libJs = stripTypeScriptTypes(libTs, { mode: 'strip' });
const L = new Function(
  'computeRoadMask',
  '__IMPROVEMENTS_JSON__',
  `${libJs}\nreturn { TerenBazowy, improvementKeysForHex, hexHasCoveringTerrainImprovement, integrator, renderPaths, trimMediumRenderPathAtMain };`,
)(computeRoadMask, JSON.parse(fileText[DATA_PATH]));
const T = L.TerenBazowy;

// ---------------------------------------------------------------------------
// Mapy testowe (deterministyczne, mulberry32).
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const ULEPSZENIE = ['brak', 'farma', 'irygacja', 'kopalnia', 'droga', 'droga_brukowana', 'pastwisko', 'tartak'];
const NAKLADKA = ['brak', 'las', 'zloze_gliny', 'zloze_rudy', 'zloze_konia', 'zloze_owiec', 'zloze_bydla', 'zloze_lamy'];
// Warstwy `ulepszenia`: klucze katalogu, alias `pastwisko`, klucze spoza katalogu, `''`, `'brak'`,
// klucze z `Object.prototype` (`IMPROVEMENTS[k]` prawdziwe w JS), wielkosc liter.
const LAYERS = [
  'droga', 'droga_brukowana', 'droga', 'droga_brukowana', 'farma', 'tarasy', 'tarasy', 'bydlo', 'owce',
  'pastwisko', 'tartak', 'kopalnia', 'kopalnia_miedzi', 'fort', 'irygacja', 'posterunek', 'lodzie_rybackie',
  'brak', '', 'Droga', 'nieistnieje', 'constructor', 'toString',
];
const VIS = ['widoczny', 'odkryty', 'nieodkryty'];

function makeMap(spec) {
  const rnd = mulberry32(spec.seedRng);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const { w, h } = spec;
  const terrainAt = new Map();
  // Morze na obrzezach i w "jeziorach", relief w paskach — sa i wody w srodku tras, i Gory/Wzgorza.
  for (let r = 0; r < h; r++) {
    for (let q = 0; q < w; q++) {
      const edge = Math.min(q, r, w - 1 - q, h - 1 - r);
      const x = rnd();
      let t;
      if (edge === 0 && x < 0.55) t = x < 0.3 ? T.Morze : T.PlytkieMorze;
      else if (x < 0.08) t = T.PlytkieMorze;
      else if (x < 0.12) t = T.Morze;
      else if (x < 0.22) t = T.Wzgorza;
      else if (x < 0.29) t = T.Gory;
      else if (x < 0.36) t = T.Pustynia;
      else if (x < 0.40) t = T.Polarny;
      else if (x < 0.70) t = T.Laka;
      else t = T.Rownina;
      terrainAt.set(`${q},${r}`, t);
    }
  }
  const coords = [];
  for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) coords.push([q, r]);
  // Kolejnosc wstawienia kluczy: r-major albo przetasowana (Object.keys != r-major).
  if (spec.shuffle) {
    for (let i = coords.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [coords[i], coords[j]] = [coords[j], coords[i]];
    }
  }
  const hexes = {};
  for (const [q, r] of coords) {
    const hex = {
      coords: { q, r },
      terenBazowy: terrainAt.get(`${q},${r}`),
      nakladka: pick(NAKLADKA),
      ulepszenie: rnd() < 0.3 ? pick(['droga', 'droga_brukowana']) : pick(ULEPSZENIE),
      wlasciciel: rnd() < 0.3 ? String(Math.floor(rnd() * 3)) : null,
      wioska: rnd() < 0.18 ? { istnieje: true, ludnosc: 1 + Math.floor(rnd() * 4) } : { istnieje: false, ludnosc: 0 },
      widocznosc: { 0: pick(VIS), 1: pick(VIS) },
      rzeka: { obecna: false, krawedzie: [] },
    };
    const y = rnd();
    if (y < 0.35) {
      const n = Math.floor(rnd() * 4);
      hex.ulepszenia = Array.from({ length: n }, () => pick(LAYERS));
      if (hex.ulepszenia.length) hex.improvementKey = hex.ulepszenia[hex.ulepszenia.length - 1];
    }
    if (rnd() < 0.15) hex.zloze = pick(['zelazo', 'miedz', 'konie', 'sol', 'zloto']);
    if (rnd() < 0.08) hex.zlozeMinEra = 1 + Math.floor(rnd() * 3);
    hexes[`${q},${r}`] = hex;
  }

  // Trasy rzek: bladzenie losowe (krok sasiedni), czasem skok o 2 (naprawa sasiedztwa), czasem
  // powrot na odwiedzony heks (sanityzacja), czasem wyjscie poza mape (brak heksa -> urwanie).
  const walk = (len, start) => {
    let [q, r] = start ?? [Math.floor(rnd() * w), Math.floor(rnd() * h)];
    const out = [{ q, r }];
    for (let i = 1; i < len; i++) {
      const x = rnd();
      const [dq, dr] = pick(DIRS);
      if (x < 0.1) { q += 2 * dq; r += 2 * dr; } // skok
      else if (x < 0.15 && out.length > 2) { const p = out[out.length - 2]; q = p.q; r = p.r; } // powrot
      else { q += dq; r += dr; }
      out.push({ q, r });
    }
    return out;
  };
  const paths = [];
  const kinds = [];
  const mains = [];
  for (let i = 0; i < spec.mains; i++) {
    const p = walk(4 + Math.floor(rnd() * 14));
    paths.push(p); kinds.push('main'); mains.push(p);
  }
  for (let i = 0; i < spec.mediums; i++) {
    // Srednia, ktora dochodzi do main i biegnie wzdluz niej (ogon 0..4 heksow) — przyciecie trimu.
    const m = pick(mains);
    const j = Math.floor(rnd() * m.length);
    const head = walk(2 + Math.floor(rnd() * 6), [m[j].q + 2, m[j].r - 1]);
    const tail = m.slice(j, j + Math.floor(rnd() * 5));
    const p = rnd() < 0.85 ? [...head, ...tail] : head;
    paths.push(p); kinds.push('medium');
  }
  for (let i = 0; i < spec.others; i++) {
    const p = walk(Math.floor(rnd() * 10));
    paths.push(p); kinds.push(rnd() < 0.5 ? 'short' : 'tributary');
  }
  // Tasowanie kolejnosci tras (rodzaje razem z trasami).
  const order = paths.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  // `riverPathKinds` krotsze niz `riverPaths`: wszystkie trasy main na koncu, poza tablica
  // rodzajow (`kinds[i] ?? 'main'`) — przyciecie srednich zalezy wtedy WYLACZNIE od tras bez
  // rodzaju, ktore web traktuje jak main.
  if (spec.kinds === 'short') order.sort((a, b) => (kinds[a] === 'main') - (kinds[b] === 'main'));
  const riverPaths = order.map((i) => paths[i]);
  let riverPathKinds = order.map((i) => kinds[i]);
  if (spec.kinds === 'none') riverPathKinds = undefined;
  else if (spec.kinds === 'short') riverPathKinds = riverPathKinds.filter((k) => k !== 'main');
  // Rzeka na heksach tras (krawedzie 0..5).
  for (const p of riverPaths) {
    for (const c of p) {
      const hx = hexes[`${c.q},${c.r}`];
      if (!hx) continue;
      hx.rzeka.obecna = true;
      const e = Math.floor(rnd() * 6);
      if (!hx.rzeka.krawedzie.includes(e)) hx.rzeka.krawedzie.push(e);
    }
  }
  const map = { szerokoscQ: w, wysokoscR: h, seed: spec.seed, hexes, riverPaths };
  if (riverPathKinds !== undefined) map.riverPathKinds = riverPathKinds;

  // Miasta: czesc na heksach z wioska (miasto zastepuje wioske), czesc gdzie indziej i poza mapa.
  const villageKeys = Object.keys(hexes).filter((k) => hexes[k].wioska.istnieje);
  const cities = [];
  for (const k of villageKeys) if (rnd() < 0.4) cities.push({ q: hexes[k].coords.q, r: hexes[k].coords.r });
  for (let i = 0; i < 4; i++) cities.push({ q: Math.floor(rnd() * w), r: Math.floor(rnd() * h) });
  cities.push({ q: -3, r: 2 });
  return { map, cities };
}

const SPECS = [
  { name: 'mala_r_major', w: 10, h: 8, seedRng: 0x51a1, seed: 1234567, shuffle: false, mains: 3, mediums: 4, others: 4, kinds: 'full' },
  { name: 'srednia_tasowana', w: 18, h: 12, seedRng: 0x51a2, seed: 20261115, shuffle: true, mains: 5, mediums: 8, others: 7, kinds: 'full' },
  { name: 'duza_tasowana', w: 31, h: 17, seedRng: 0x51a3, seed: 98765.4321, shuffle: true, mains: 8, mediums: 14, others: 12, kinds: 'full' },
  { name: 'bez_riverPathKinds', w: 14, h: 9, seedRng: 0x51a4, seed: 777, shuffle: true, mains: 4, mediums: 5, others: 5, kinds: 'none' },
  { name: 'kinds_krotsze', w: 12, h: 11, seedRng: 0x51a5, seed: 4242, shuffle: true, mains: 4, mediums: 16, others: 6, kinds: 'short' },
  { name: 'jednoheksowa', w: 1, h: 1, seedRng: 0x51a6, seed: 0, shuffle: false, mains: 1, mediums: 1, others: 1, kinds: 'full' },
];

const maps = [];
for (const spec of SPECS) {
  const { map: gameMap, cities } = makeMap(spec);
  const snapshot = serializeMapForSave(gameMap);
  const snapJson = JSON.parse(JSON.stringify(snapshot));
  const map = buildGameMapFromSnapshot(snapJson);

  // Kontrakt §1.4: heksy r-major (jawne sortowanie, jak producent).
  const sorted = Object.values(map.hexes).slice().sort((a, b) => a.coords.r - b.coords.r || a.coords.q - b.coords.q);
  const renderPaths = L.renderPaths(map);
  const mapView = {
    width: map.szerokoscQ,
    height: map.wysokoscR,
    seed: map.seed,
    hexes: sorted.map((h) => ({ coord: { q: h.coords.q, r: h.coords.r }, terenBazowy: h.terenBazowy, rzekaKrawedzie: h.rzeka.krawedzie.slice() })),
    rivers: (map.riverPaths ?? []).map((p, i) => ({ hexes: p.map((c) => ({ q: c.q, r: c.r })), kind: map.riverPathKinds?.[i] ?? null })),
    riverRenderPaths: renderPaths.map((p) => p.map((c) => ({ q: c.q, r: c.r }))),
  };
  const integ = L.integrator(map, cities);
  const hexState = sorted.map((h) => {
    const key = `${h.coords.q},${h.coords.r}`;
    return {
      nakladka: h.nakladka,
      ulepszenie: h.ulepszenie,
      ulepszenia: h.ulepszenia ?? null,
      improvementKey: h.improvementKey ?? null,
      zloze: h.zloze ?? null,
      villagePresent: integ.villagePresent(key),
      terraces: L.improvementKeysForHex(h).includes('tarasy'),
      coveringImprovement: L.hexHasCoveringTerrainImprovement(h),
      roadMask: integ.roadMaskAt(h.coords.q, h.coords.r),
    };
  });
  maps.push({ name: spec.name, snapshot: snapJson, cities, mapView, hexState });
}

const out = {
  pin: PIN_FULL,
  generator: 'rust-port/engine/tests/p4_1b_map_view_vectors/gen.mjs',
  excerpts: EXCERPTS.map((e) => ({ file: FILES[e.file], name: e.name, from: e.from, to: e.to, sha256: e.sha256 })),
  files: Object.entries(EXPECTED_FILE_SHA).map(([path, s]) => ({ path, sha256: s })),
  maps,
};
const text = `${JSON.stringify(out)}\n`;
if (CHECK) {
  const cur = readFileSync(OUT, 'utf8');
  if (cur !== text) {
    console.error('vectors.json rozni sie od wyniku generatora');
    process.exit(1);
  }
  console.error(`OK: vectors.json zgodny (${maps.length} map)`);
} else {
  writeFileSync(OUT, text);
  console.error(`zapisano ${OUT} (${maps.length} map)`);
}
