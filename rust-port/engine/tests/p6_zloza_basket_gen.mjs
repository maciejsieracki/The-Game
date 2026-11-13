// R-RUSTPORT-P6-ZLOZA-B: generator wektorow z TEKSTU pinu 07d2fbd72f758705f8e1d59cc4968027ffbafe75.
// Wykonuje (transpilacja TypeScript przez `typescript` z Node + new Function) dokladny fragment
// `function transferBasketItems(` z gra/src/main.ts (linie 12566-12624 na pinie). Gałęzie inne niz
// `zloze` i `jednostka` trafiaja do stubow rzucajacych wyjatek, wiec wektory dowodza, ze gałąź
// `zloze` jest jedyna, ktora zmienia `zlozeGrants` dla uzytych wejsc.
// Uzycie: node p6_zloza_basket_gen.mjs <sciezka-do-gra/src/main.ts> <katalog-wyjsciowy> [sciezka-do-typescript.js]
//   (albo zmienna TYPESCRIPT_JS zamiast trzeciego argumentu)
// STRAZNIK: SHA-256 pliku main.ts musi zgadzac sie z pinem, inaczej generator konczy sie bledem.
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , mainPath, outDir, tsArg] = process.argv;
const tsPath = tsArg ?? process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
if (!mainPath || !outDir) {
  console.error('uzycie: node p6_zloza_basket_gen.mjs <gra/src/main.ts> <outDir> [typescript.js]');
  process.exit(2);
}
const require = createRequire(import.meta.url);
const ts = require(tsPath);

const PIN_COMMIT = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
// Oczekiwany SHA-256 pliku gra/src/main.ts na pinie (ten sam co w p6_r7k7b_zloze_sync_gen.mjs).
const MAIN_SHA_WANT = 'e80f9cb41d513b92846972a19f2760e08eb4247d6a9b344526d8bc71bd7d5f19';

const buf = readFileSync(mainPath);
const mainSha = createHash('sha256').update(buf).digest('hex');
if (mainSha !== MAIN_SHA_WANT) {
  console.error(`STRAZNIK SHA-256: gra/src/main.ts: ${mainSha} != ${MAIN_SHA_WANT}`);
  process.exit(3);
}
const lines = buf.toString('utf8').split('\n');

// Fragment: od `    function transferBasketItems(` do pierwszej linii `    }` (koniec funkcji, wciecie 4).
const start = lines.findIndex(l => l.startsWith('    function transferBasketItems('));
if (start < 0) throw new Error('brak transferBasketItems w pinie');
const endRel = lines.slice(start + 1).findIndex(l => l === '    }');
if (endRel < 0) throw new Error('brak konca transferBasketItems');
const fragmentLines = lines.slice(start, start + endRel + 2);
const fragment = fragmentLines.join('\n');
const fragmentSha = createHash('sha256').update(fragment).digest('hex');

// Wejscia spoza fragmentu: stuby. Wywolanie stuba = blad (gałąź nie-zloze nie moze sie wykonac).
const stubFns = [
  'applyOneShotGoldTransfer',
  'diplomacyPnZloto', 'diplomacyPnPraca', 'setOwnerPracaPool', 'ownerPracaPool',
  'freshEmpireFoodState', 'empireFoodDefaultPct', 'grantTechToOwnerWithSideEffects',
  'grantSurowiecBooleanAccess', 'transferSurowiecIlosc', 'diplomacyNormalizeSurowiecIlosc',
  'capitalCityIdForOwner', 'transferCityByTreaty', 'showHintMessage',
];
// Wywolywane bezwarunkowo na poczatku funkcji (nie sa galeziami): no-op / pusty skarbiec.
const noopValues = {
  syncBasketResearchFromEngine: () => () => {},
  buildDiploTreasury: () => () => ({}),
};
const stubValues = {
  empireFoodStates: () => new Map(),
  _maxSafeRationCache: () => ({ clear() {} }),
  basketTransferCtx: () => ({ researchedByOwner: new Map() }),
  cities: () => [],
};
const paramNames = ['zlozeGrants', ...stubFns, ...Object.keys(noopValues), ...Object.keys(stubValues)];

const js = ts.transpileModule(fragment, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

// Wykonanie fragmentu z wlasnym `zlozeGrants` dla kazdego przypadku.
function runCase(items, fromOwnerId, toOwnerId, dealId) {
  const grants = [];
  const stubArgs = stubFns.map(name => () => { throw new Error(`STUB wywolany: ${name}`); });
  const noopArgs = Object.values(noopValues).map(make => make());
  const valueArgs = Object.values(stubValues).map(make => make());
  const factory = new Function(...paramNames, `${js}\nreturn transferBasketItems;`);
  const fn = factory(grants, ...stubArgs, ...noopArgs, ...valueArgs);
  fn(fromOwnerId, toOwnerId, items, dealId);
  return grants;
}

// PRNG (mulberry32), staly seed: wektory sa deterministyczne.
let seed = 0x5b1e7f3;
function rnd() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

const cases = [];
function addCase(name, items, from, to, dealId) {
  const expected = runCase(items, from, to, dealId);
  cases.push({
    name,
    fromOwnerId: from,
    toOwnerId: to,
    ...(dealId === undefined ? {} : { dealId }),
    items,
    expectedGrants: JSON.parse(JSON.stringify(expected)),
  });
}

// Przypadki ręczne.
addCase('pusta lista pozycji', [], 1, 2, undefined);
addCase('zloze z hexKey, bez dealId', [{ typ: 'zloze', id: 'z1', hexKey: 'h1' }], 1, 2, undefined);
addCase('zloze bez hexKey -> klucz = id', [{ typ: 'zloze', id: 'z2' }], 3, 1, 'd9');
addCase('zloze z pustym hexKey zostaje pusty', [{ typ: 'zloze', id: 'z3', hexKey: '' }], 2, 4, 'd1');
addCase('kolejnosc pozycji zachowana', [
  { typ: 'zloze', id: 'a', hexKey: 'ha' },
  { typ: 'jednostka', id: 'u1' },
  { typ: 'zloze', id: 'b' },
], 1, 2, 'dX');
addCase('tylko jednostka -> brak grantow', [{ typ: 'jednostka', id: 'u2' }], 1, 2, 'dX');

// Przypadki losowe (200).
const N_RANDOM = 200;
for (let c = 0; c < N_RANDOM; c++) {
  const n = int(0, 5);
  const items = [];
  for (let i = 0; i < n; i++) {
    if (rnd() < 0.75) {
      const item = { typ: 'zloze', id: 'z' + c + '_' + i };
      if (rnd() < 0.5) item.hexKey = 'h' + int(0, 9);
      items.push(item);
    } else {
      items.push({ typ: 'jednostka', id: 'u' + c + '_' + i });
    }
  }
  const from = int(0, 4);
  const to = int(0, 4);
  const dealId = pick([undefined, 'd1', 'd2', '']);
  addCase('losowy ' + c, items, from, to, dealId);
}

const vectors = {
  pin: {
    commit: PIN_COMMIT,
    file: 'gra/src/main.ts',
    file_sha256: mainSha,
    function: 'transferBasketItems',
    fragment_lines: [start + 1, start + fragmentLines.length],
    fragment_sha256: fragmentSha,
  },
  cases,
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(vectors, null, 1) + '\n');
console.log(`OK: ${cases.length} przypadkow, fragment_sha256=${fragmentSha}`);
