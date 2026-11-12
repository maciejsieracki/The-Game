// R-RUSTPORT-P6-WIRE-WAR-R7K7B: generator wektorow z TEKSTU pinu 07d2fbd72f758705f8e1d59cc4968027ffbafe75.
// Wykonuje (transpilacja TypeScript przez `typescript` z Node + eval) dokladne fragmenty zrodel pinu:
//   - deactivateZlozeGrantsForDeal      (gra/src/game/diplomacy-pn-engine.ts)
//   - syncRelationFromDeals             (gra/src/main.ts, zakres wewnatrz closure)
//   - isAllianceDealKind                (gra/src/main.ts, zakres wewnatrz closure)
//   - dealInvolvesOwners                (gra/src/game/diplomacy-penalty-preview.ts)
//   - hasTreaty, pairKey, normalizeTreatyKind (gra/src/game/diplomacy-treaties.ts)
//   - enum RodzajTraktatu               (gra/src/types/diplomacy.ts)
// Zmienne closure (activeDeals, getDiploRelation, setDiploRelation) sa jedynymi atrapami w harnessie.
// Uzycie: node p6_r7k7b_zloze_sync_gen.mjs <pinDir-z-gra/src> <katalog-wyjsciowy> [sciezka-do-typescript.js]
//   (albo zmienna TYPESCRIPT_JS zamiast trzeciego argumentu)
// STRAZNIK: SHA-256 kazdego zrodla musi zgadzac sie z pinem, inaczej generator konczy sie bledem.
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Sciezka do typescript.js: argument 3, potem zmienna TYPESCRIPT_JS, na koncu domyslna sciezka srodowiska.
const [, , pinDir, outDir, tsArg] = process.argv;
const tsPath = tsArg ?? process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
if (!pinDir || !outDir) {
  console.error('uzycie: node p6_r7k7b_zloze_sync_gen.mjs <pinDir> <outDir> [typescript.js]');
  process.exit(2);
}
const require = createRequire(import.meta.url);
const ts = require(tsPath);

const SHA = {
  'gra/src/game/diplomacy-pn-engine.ts': null,
  'gra/src/main.ts': null,
  'gra/src/game/diplomacy-penalty-preview.ts': null,
  'gra/src/game/diplomacy-treaties.ts': null,
  'gra/src/types/diplomacy.ts': null,
};
// Oczekiwane SHA-256 (zmierzone na blobach pinu 07d2fbd72).
const WANT = {
  'gra/src/game/diplomacy-pn-engine.ts': 'ee1b1aabffd4fdf906ce260084f80ad5da055c64912b6eda86306ba261d89257',
  'gra/src/main.ts': 'e80f9cb41d513b92846972a19f2760e08eb4247d6a9b344526d8bc71bd7d5f19',
  'gra/src/game/diplomacy-penalty-preview.ts': 'ae78466a462983e638b1d9c1fc49eaf99af2231eecfb732820339195c94ab6c5',
  'gra/src/game/diplomacy-treaties.ts': '9b8e3bd81b65de1bb009a86058d1afa59a48c096b6ed6e91be71606af6cde6cb',
  'gra/src/types/diplomacy.ts': '1a963e56488b547261da9ffca0712c71875a54dd2024388ce6580e6c63290b6b',
};
const sources = {};
for (const rel of Object.keys(SHA)) {
  const buf = readFileSync(join(pinDir, rel));
  const got = createHash('sha256').update(buf).digest('hex');
  sources[rel] = { sha256: got, lines: buf.toString('utf8').split('\n') };
  if (got !== WANT[rel]) {
    console.error(`STRAZNIK SHA-256: ${rel}: ${got} != ${WANT[rel]}`);
    process.exit(3);
  }
}

// Wyciaga blok od linii zaczynajacej sie od `start` do pierwszej pasujacej linii `endLine` (wlacznie).
function extract(rel, start, endLine) {
  const lines = sources[rel].lines;
  const i = lines.findIndex(l => l.startsWith(start));
  if (i < 0) throw new Error(`brak fragmentu: ${rel}: ${start}`);
  const j = lines.findIndex((l, k) => k > i && l === endLine);
  if (j < 0) throw new Error(`brak konca fragmentu: ${rel}: ${start}`);
  return lines.slice(i, j + 1).join('\n');
}

const parts = {
  enumRodzaj: extract('gra/src/types/diplomacy.ts', 'export enum RodzajTraktatu {', '}'),
  pairKey: extract('gra/src/game/diplomacy-treaties.ts', 'function pairKey(', '}'),
  normalize: extract('gra/src/game/diplomacy-treaties.ts', 'export function normalizeTreatyKind(', '}'),
  hasTreaty: extract('gra/src/game/diplomacy-treaties.ts', 'export function hasTreaty(', '}'),
  dealInvolves: extract('gra/src/game/diplomacy-penalty-preview.ts', 'function dealInvolvesOwners(', '}'),
  isAlliance: extract('gra/src/main.ts', '    function isAllianceDealKind(', '    }'),
  sync: extract('gra/src/main.ts', '    function syncRelationFromDeals(', '    }'),
  deactivate: extract('gra/src/game/diplomacy-pn-engine.ts', 'export function deactivateZlozeGrantsForDeal(', '}'),
};

const harness = `
${parts.enumRodzaj}
${parts.pairKey}
${parts.normalize}
${parts.hasTreaty}
${parts.dealInvolves}
${parts.isAlliance}
let activeDeals: any[] = [];
const relMap = new Map<string, { status: string }>();
function relKey(a: number, b: number): string { return a < b ? a + '_' + b : b + '_' + a; }
function getDiploRelation(a: number, b: number): { status: string } {
  return relMap.get(relKey(a, b)) ?? { status: 'neutralni' };
}
function setDiploRelation(a: number, b: number, r: { status: string }): void {
  relMap.set(relKey(a, b), r);
}
${parts.sync}
${parts.deactivate}
export function runSync(a: number, b: number, deals: any[], status: string): string {
  activeDeals = deals;
  relMap.clear();
  relMap.set(relKey(a, b), { status });
  syncRelationFromDeals(a, b);
  return getDiploRelation(a, b).status;
}
export function runDeactivate(grants: any[], dealId: string): any[] {
  return deactivateZlozeGrantsForDeal(grants, dealId);
}
`;

const js = ts.transpileModule(harness, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', js)(mod, mod.exports, require);
const { runSync, runDeactivate } = mod.exports;

// PRNG (mulberry32), staly seed: wektory sa deterministyczne.
let seed = 0x7a3c91;
function rnd() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

// ---- deactivateZlozeGrantsForDeal: 200 przypadkow ----
const N_DEACT = 200;
const deactivate = [];
for (let c = 0; c < N_DEACT; c++) {
  const n = int(0, 6);
  const grants = [];
  for (let i = 0; i < n; i++) {
    grants.push({
      granterOwnerId: int(1, 4),
      granteeOwnerId: int(1, 4),
      partnerId: int(1, 4),
      zlozeId: 'z' + c + '_' + i,
      hexKey: 'h' + int(0, 9),
      active: rnd() < 0.7,
      dealId: pick([null, 'd1', 'd2', 'd3']),
    });
  }
  const dealId = pick(['d1', 'd2', 'd3', 'd9']);
  // null w wektorze = `undefined` na pinie (brak pola dealId).
  const input = grants.map(g => (g.dealId === null ? { ...g, dealId: undefined } : g));
  const out = runDeactivate(input, dealId).map(g => ({ ...g, dealId: g.dealId ?? null }));
  deactivate.push({ name: 'deact-' + c, grants, dealId, expected: out });
}

// ---- syncRelationFromDeals: 240 przypadkow ----
const N_SYNC = 240;
const KINDS = [
  'pakt_nieagresji', 'sojusz_defensywny', 'sojusz_pelny', 'sojusz_wojskowy',
  'umowa_wymiany', 'umowa_szlakow', 'wasalizacja', 'otwarte_granice', 'wspolna_walka_barbarzyncy',
  // Rodzaje z pinu (RodzajTraktatu) brakujace wczesniej: przemarsz i legacy umowa_handlowa.
  'prawo_wojskowe_przemarszu', 'umowa_handlowa',
];
const STATUSES = ['neutralni', 'pokoj', 'sojusz', 'wojna'];
const sync = [];
for (let c = 0; c < N_SYNC; c++) {
  const a = int(1, 4);
  let b = int(1, 4);
  while (b === a) b = int(1, 4);
  const status = pick(STATUSES);
  const nDeals = int(0, 4);
  const deals = [];
  for (let i = 0; i < nDeals; i++) {
    // ~60% traktatow dotyczy pary (a,b) z przypadku, reszta: losowe pary (inne pary nie wplywaja).
    let x = int(1, 4);
    let y = int(1, 4);
    while (y === x) y = int(1, 4);
    if (rnd() < 0.6) { x = a; y = b; }
    const strony = x < y ? [x, y] : [y, x];
    deals.push({ id: 'd' + c + '_' + i, rodzaj: pick(KINDS), strony });
  }
  const expected = runSync(a, b, deals, status);
  sync.push({ name: 'sync-' + c, a, b, status, deals, expected });
}
// Przypadki a==b (wektory pinu obejmuja tez te gałąź; ~20% traktatow dotyczy pary (a,a)).
const N_SYNC_SAME = 24;
for (let c = 0; c < N_SYNC_SAME; c++) {
  const a = int(1, 4);
  const b = a;
  const status = pick(STATUSES);
  const nDeals = int(0, 3);
  const deals = [];
  for (let i = 0; i < nDeals; i++) {
    let x = int(1, 4);
    let y = int(1, 4);
    while (y === x) y = int(1, 4);
    if (rnd() < 0.2) { x = a; y = a; }
    const strony = x < y ? [x, y] : [y, x];
    deals.push({ id: 'dsame' + c + '_' + i, rodzaj: pick(KINDS), strony });
  }
  const expected = runSync(a, b, deals, status);
  sync.push({ name: 'sync-same-' + c, a, b, status, deals, expected });
}

const vectors = {
  meta: {
    pin: '07d2fbd72f758705f8e1d59cc4968027ffbafe75',
    generator: 'rust-port/engine/tests/p6_r7k7b_zloze_sync_gen.mjs',
    sources: Object.fromEntries(Object.entries(sources).map(([k, v]) => [k, v.sha256])),
    fragments: {
      deactivateZlozeGrantsForDeal: 'gra/src/game/diplomacy-pn-engine.ts:346',
      syncRelationFromDeals: 'gra/src/main.ts:22832',
      isAllianceDealKind: 'gra/src/main.ts:22653',
      dealInvolvesOwners: 'gra/src/game/diplomacy-penalty-preview.ts:72',
      hasTreaty: 'gra/src/game/diplomacy-treaties.ts:300',
    },
    seed: '0x7a3c91',
  },
  deactivate,
  sync,
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(vectors, null, 1) + '\n');
console.log(`OK deactivate=${deactivate.length} sync=${sync.length}`);
