// R-RUSTPORT-P6-ZLOZE-GRANTS-STATE-Q1: generator wektorow z TEKSTU pinu 07d2fbd72f758705f8e1d59cc4968027ffbafe75.
// Wykonuje (transpilacja TypeScript przez `typescript` z Node + eval) dokladne fragmenty pliku pina:
//   - suspendZlozeGrantsForWar     (gra/src/game/diplomacy-pn-engine.ts, linie 331-344)
//   - deactivateZlozeGrantsForDeal (gra/src/game/diplomacy-pn-engine.ts, linie 346-352)
// Uzycie: node p6_zloze_grants_state_gen.mjs <pinDir-z-gra/src> <katalog-wyjsciowy> [sciezka-do-typescript.js]
//   (albo zmienna TYPESCRIPT_JS zamiast trzeciego argumentu)
// STRAZNIK: SHA-256 pliku pina musi zgadzac sie z oczekiwanym, inaczej generator konczy sie bledem.
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , pinDir, outDir, tsArg] = process.argv;
const tsPath = tsArg ?? process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
if (!pinDir || !outDir) {
  console.error('uzycie: node p6_zloze_grants_state_gen.mjs <pinDir> <outDir> [typescript.js]');
  process.exit(2);
}
const require = createRequire(import.meta.url);
const ts = require(tsPath);

const REL = 'gra/src/game/diplomacy-pn-engine.ts';
// Oczekiwane SHA-256 (zmierzone na blobie pinu 07d2fbd72; ten sam plik co w p6_r7k7b_zloze_sync_gen.mjs).
const WANT_SHA = 'ee1b1aabffd4fdf906ce260084f80ad5da055c64912b6eda86306ba261d89257';

const buf = readFileSync(join(pinDir, REL));
const gotSha = createHash('sha256').update(buf).digest('hex');
if (gotSha !== WANT_SHA) {
  console.error(`STRAZNIK SHA-256: ${REL}: ${gotSha} != ${WANT_SHA}`);
  process.exit(3);
}
const lines = buf.toString('utf8').split('\n');

// Wyciaga blok od linii zaczynajacej sie od `start` do pierwszej pasujacej linii `endLine` (wlacznie).
function extract(start, endLine) {
  const i = lines.findIndex(l => l.startsWith(start));
  if (i < 0) throw new Error(`brak fragmentu: ${start}`);
  const j = lines.findIndex((l, k) => k > i && l === endLine);
  if (j < 0) throw new Error(`brak konca fragmentu: ${start}`);
  return lines.slice(i, j + 1).join('\n');
}

const suspendSrc = extract('export function suspendZlozeGrantsForWar(', '}');
const deactivateSrc = extract('export function deactivateZlozeGrantsForDeal(', '}');

const harness = `
${suspendSrc}
${deactivateSrc}
export function runSuspend(grants: any[], a: number, b: number): any[] {
  return suspendZlozeGrantsForWar(grants, a, b);
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
const { runSuspend, runDeactivate } = mod.exports;

// PRNG (mulberry32), staly seed: wektory sa deterministyczne.
let seed = 0x5b1e77;
function rnd() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

// null w wektorze = brak pola dealId (`undefined` na pinie).
function randomGrants(c, maxN) {
  const n = int(0, maxN);
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
  return grants;
}
function toPin(grants) {
  return grants.map(g => (g.dealId === null ? { ...g, dealId: undefined } : g));
}
function fromPin(grants) {
  return grants.map(g => ({ ...g, dealId: g.dealId ?? null }));
}

// ---- suspendZlozeGrantsForWar: 240 przypadkow (pary w obu kierunkach, takze a==b) ----
const N_SUSPEND = 240;
const suspend = [];
for (let c = 0; c < N_SUSPEND; c++) {
  const grants = randomGrants(c, 7);
  const a = int(1, 4);
  const b = c % 12 === 0 ? a : int(1, 4);
  const out = fromPin(runSuspend(toPin(grants), a, b));
  suspend.push({ name: 'susp-' + c, grants, ownerA: a, ownerB: b, expected: out });
}

// ---- deactivateZlozeGrantsForDeal: 200 przypadkow ----
const N_DEACT = 200;
const deactivate = [];
for (let c = 0; c < N_DEACT; c++) {
  const grants = randomGrants(c + 1000, 6);
  const dealId = pick(['d1', 'd2', 'd3', 'd9']);
  const out = fromPin(runDeactivate(toPin(grants), dealId));
  deactivate.push({ name: 'deact-' + c, grants, dealId, expected: out });
}

const vectors = {
  meta: {
    pin: '07d2fbd72f758705f8e1d59cc4968027ffbafe75',
    generator: 'rust-port/engine/tests/p6_zloze_grants_state_gen.mjs',
    sources: { [REL]: gotSha },
    fragments: {
      suspendZlozeGrantsForWar: 'gra/src/game/diplomacy-pn-engine.ts:331',
      deactivateZlozeGrantsForDeal: 'gra/src/game/diplomacy-pn-engine.ts:346',
    },
    seed: '0x5b1e77',
  },
  suspend,
  deactivate,
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(vectors, null, 1) + '\n');
console.log(`OK suspend=${suspend.length} deactivate=${deactivate.length}`);
