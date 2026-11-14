// R-RUSTPORT-P6-ZLOZE-WIRE-WAR-BREAK-A-Q1: generator wektorow z TEKSTU pinu 07d2fbd72f758705f8e1d59cc4968027ffbafe75.
// Wykonuje (transpilacja TypeScript przez `typescript` z Node + eval) dokladne fragmenty plikow pina:
//   gra/src/game/diplomacy-pn-engine.ts:
//     - suspendZlozeGrantsForWar       (linie 331-344)
//     - deactivateZlozeGrantsForDeal   (linie 346-352)
//   gra/src/game/diplomacy-treaties.ts:
//     - pairKey, normalizeTreatyKind, dealsForPair, BREAK_ON_WAR, treatiesBrokenByWar, removeTreatiesById
//   gra/src/game/diplomacy-penalty-preview.ts:
//     - TRADE_TREATY_BREAK_PENALTY_FREE_AGE_TURNS (152), treatyAgeTurns (155), tradeTreatyBreakPenaltyFree (167),
//       voluntaryTreatyBreakPlan (192), isHandelTreatyKind (65)
//   gra/src/types/diplomacy.ts:
//     - enum RodzajTraktatu (16-29)
// Sekwencje z pinu, ktore sa odtwarzane w harnessie (1:1 z tekstem):
//   breakTreatiesOnWar (main.ts:23686): suspend -> treatiesBrokenByWar -> (brak zerwan = return) -> removeTreatiesById -> deactivate per id
//   breakTreatyVoluntarily (main.ts:22741): find deal (brak = return) -> voluntaryTreatyBreakPlan -> removeTreatiesById([id]) -> deactivate
// Uzycie: node p6_zloze_break_war_a_gen.mjs <pinDir-z-gra/src> <katalog-wyjsciowy> [sciezka-do-typescript.js]
//   (albo zmienna TYPESCRIPT_JS zamiast trzeciego argumentu)
// STRAZNIK: SHA-256 kazdego pliku pina musi zgadzac sie z oczekiwanym, inaczej generator konczy sie bledem.
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , pinDir, outDir, tsArg] = process.argv;
const tsPath = tsArg ?? process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
if (!pinDir || !outDir) {
  console.error('uzycie: node p6_zloze_break_war_a_gen.mjs <pinDir> <outDir> [typescript.js]');
  process.exit(2);
}
const require = createRequire(import.meta.url);
const ts = require(tsPath);

// Oczekiwane SHA-256 plikow pina 07d2fbd72.
const SOURCES = {
  'gra/src/game/diplomacy-pn-engine.ts': 'ee1b1aabffd4fdf906ce260084f80ad5da055c64912b6eda86306ba261d89257',
  'gra/src/game/diplomacy-treaties.ts': '9b8e3bd81b65de1bb009a86058d1afa59a48c096b6ed6e91be71606af6cde6cb',
  'gra/src/game/diplomacy-penalty-preview.ts': 'ae78466a462983e638b1d9c1fc49eaf99af2231eecfb732820339195c94ab6c5',
  'gra/src/types/diplomacy.ts': '1a963e56488b547261da9ffca0712c71875a54dd2024388ce6580e6c63290b6b',
};

const got = {};
const linesOf = {};
for (const [rel, want] of Object.entries(SOURCES)) {
  const buf = readFileSync(join(pinDir, rel));
  const sha = createHash('sha256').update(buf).digest('hex');
  if (sha !== want) {
    console.error(`STRAZNIK SHA-256: ${rel}: ${sha} != ${want}`);
    process.exit(3);
  }
  got[rel] = sha;
  linesOf[rel] = buf.toString('utf8').split('\n');
}

// Wyciaga blok od pierwszej linii zaczynajacej sie od `start` do pierwszej nastepnej linii == `endLine` (wlacznie).
function extract(rel, start, endLine) {
  const lines = linesOf[rel];
  const i = lines.findIndex(l => l.startsWith(start));
  if (i < 0) throw new Error(`brak fragmentu: ${rel}: ${start}`);
  const j = lines.findIndex((l, k) => k > i && l === endLine);
  if (j < 0) throw new Error(`brak konca fragmentu: ${rel}: ${start}`);
  return lines.slice(i, j + 1).join('\n');
}
// Pojedyncza linia (np. `export const X = 10;`).
function extractLine(rel, start) {
  const line = linesOf[rel].find(l => l.startsWith(start));
  if (line === undefined) throw new Error(`brak linii: ${rel}: ${start}`);
  return line;
}

const PN = 'gra/src/game/diplomacy-pn-engine.ts';
const TR = 'gra/src/game/diplomacy-treaties.ts';
const PP = 'gra/src/game/diplomacy-penalty-preview.ts';
const TY = 'gra/src/types/diplomacy.ts';

const srcs = [
  extract(TY, 'export enum RodzajTraktatu {', '}'),
  extract(PN, 'export function suspendZlozeGrantsForWar(', '}'),
  extract(PN, 'export function deactivateZlozeGrantsForDeal(', '}'),
  extract(TR, 'function pairKey(', '}'),
  extract(TR, 'export function normalizeTreatyKind(', '}'),
  extract(TR, 'export function dealsForPair(', '}'),
  extract(TR, 'const BREAK_ON_WAR', ']);'),
  extract(TR, 'export function treatiesBrokenByWar(', '}'),
  extract(TR, 'export function removeTreatiesById(', '}'),
  extractLine(PP, 'export const TRADE_TREATY_BREAK_PENALTY_FREE_AGE_TURNS'),
  extract(PP, 'function isHandelTreatyKind(', '}'),
  extract(PP, 'export function treatyAgeTurns(', '}'),
  extract(PP, 'export function tradeTreatyBreakPenaltyFree(', '}'),
  extract(PP, 'export function voluntaryTreatyBreakPlan(', '}'),
];

const harness = `
${srcs.join('\n')}
export function runBreakOnWar(deals: any[], grants: any[], a: number, b: number): any {
  let g = suspendZlozeGrantsForWar(grants, a, b);
  const brokenIds = treatiesBrokenByWar(deals, a, b);
  let d = deals;
  if (brokenIds.length) {
    d = removeTreatiesById(d, brokenIds);
    for (const id of brokenIds) {
      g = deactivateZlozeGrantsForDeal(g, id);
    }
  }
  return { brokenIds, deals: d, grants: g };
}
export function runVoluntary(deals: any[], grants: any[], dealId: string, turn: number): any {
  const deal = deals.find(d => d.id === dealId);
  if (!deal) return { found: false, deals, grants, plan: null };
  const plan = voluntaryTreatyBreakPlan(deal, turn);
  const d = removeTreatiesById(deals, [dealId]);
  const g = deactivateZlozeGrantsForDeal(grants, dealId);
  return { found: true, deals: d, grants: g, plan };
}
`;

const js = ts.transpileModule(harness, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', js)(mod, mod.exports, require);
const { runBreakOnWar, runVoluntary } = mod.exports;

// PRNG (mulberry32), staly seed: wektory sa deterministyczne.
let seed = 0x7a1b2c;
function rnd() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

// Rodzaje pinu (wartosci RodzajTraktatu + nazwy kanoniczne). Pomijamy `rozejm` (Rust go nie modeluje).
const KINDS = [
  'pakt_nieagresji',
  'sojusz_wojskowy',
  'sojusz_defensywny',
  'sojusz_pelny',
  'otwarte_granice',
  'prawo_wojskowe_przemarszu',
  'wspolna_walka_barbarzyncy',
  'umowa_handlowa',
  'umowa_szlakow',
  'umowa_wymiany',
  'wasalizacja',
];

function randomDeals(c, maxN) {
  const n = int(0, maxN);
  const deals = [];
  for (let i = 0; i < n; i++) {
    let x = int(1, 4);
    let y = int(1, 4);
    while (y === x) y = int(1, 4);
    const [lo, hi] = x < y ? [x, y] : [y, x];
    deals.push({
      id: 'd' + c + '_' + i,
      rodzaj: pick(KINDS),
      strony: [lo, hi],
      // null = bezterminowa (pin `wygasaTura: null`).
      wygasaTura: rnd() < 0.4 ? null : int(1, 60),
      zawartaTura: int(0, 40),
    });
  }
  return deals;
}

// Granty: null w wektorze = brak pola dealId (`undefined` na pinie).
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
      dealId: pick([null, 'd' + c + '_0', 'd' + c + '_1', 'd' + c + '_2']),
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

// ---- breakTreatiesOnWar: 260 przypadkow ----
const N_WAR = 260;
const war = [];
for (let c = 0; c < N_WAR; c++) {
  const deals = randomDeals(c, 5);
  const grants = randomGrants(c, 6);
  const a = int(1, 4);
  let b = int(1, 4);
  while (b === a) b = int(1, 4);
  const out = runBreakOnWar(structuredClone(deals), toPin(grants), a, b);
  war.push({
    name: 'war-' + c,
    deals,
    grants,
    ownerA: a,
    ownerB: b,
    expected: {
      brokenIds: out.brokenIds,
      deals: out.deals,
      grants: fromPin(out.grants),
    },
  });
}

// ---- breakTreatyVoluntarily: 300 przypadkow (zawsze istniejaca umowa + czesc z nieistniejacym id) ----
const N_VOL = 300;
const voluntary = [];
for (let c = 0; c < N_VOL; c++) {
  const deals = randomDeals(c + 1000, 4);
  // dodaj gwarantowana umowe, zeby przypadek zawsze mial cel (poza ~10% z brakiem id)
  if (deals.length === 0 || rnd() < 0.9) {
    const kind = pick(KINDS);
    deals.push({
      id: 'v' + c,
      rodzaj: kind,
      strony: [1, 2],
      wygasaTura: rnd() < 0.5 ? null : int(1, 60),
      zawartaTura: int(0, 40),
    });
  }
  const grants = randomGrants(c + 1000, 5);
  const dealId = rnd() < 0.1 ? 'brak' + c : pick(deals).id;
  const turn = int(0, 50);
  const out = runVoluntary(structuredClone(deals), toPin(grants), dealId, turn);
  voluntary.push({
    name: 'vol-' + c,
    deals,
    grants,
    dealId,
    turn,
    expected: {
      found: out.found,
      plan: out.plan,
      deals: out.deals,
      grants: fromPin(out.grants),
    },
  });
}

const vectors = {
  meta: {
    pin: '07d2fbd72f758705f8e1d59cc4968027ffbafe75',
    generator: 'rust-port/engine/tests/p6_zloze_break_war_a_gen.mjs',
    sources: got,
    fragments: {
      breakTreatiesOnWar: 'gra/src/main.ts:23686 (suspend/treatiesBrokenByWar/removeTreatiesById/deactivate; bez kary)',
      breakTreatyVoluntarily: 'gra/src/main.ts:22741 (plan/removeTreatiesById/deactivate; bez N3/N5/zdarzen)',
      suspendZlozeGrantsForWar: 'gra/src/game/diplomacy-pn-engine.ts:331',
      deactivateZlozeGrantsForDeal: 'gra/src/game/diplomacy-pn-engine.ts:346',
      treatiesBrokenByWar: 'gra/src/game/diplomacy-treaties.ts:417',
      removeTreatiesById: 'gra/src/game/diplomacy-treaties.ts:426',
      voluntaryTreatyBreakPlan: 'gra/src/game/diplomacy-penalty-preview.ts:192',
      tradeTreatyBreakPenaltyFree: 'gra/src/game/diplomacy-penalty-preview.ts:167',
    },
    seed: '0x7a1b2c',
  },
  war,
  voluntary,
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(vectors, null, 1) + '\n');
console.log(`OK war=${war.length} voluntary=${voluntary.length}`);
