// P6-WIRE-R7K7C (#106/#298/#299, runda 1): generator wektorow `apply_dipl_deltas_to_state`.
// Uruchomienie: node rust-port/engine/tests/p6_r7k7c_vectors/apply_gen.mjs (Node >= 22.13).
// Wynik -> p6_r7k7c_vectors/apply.json. Konsument: p6_r7k7c_apply.rs.
//
// WYKONYWANY TEKST PINU 07d2fbd72 (gra/src/main.ts, odczyt przez `git show`), bez wstawek w logice:
//   - `add` z `buildDiploTreasury` (main.ts:22628-22644): zapis skarbca gracza i AI, BEZ podlogi. Jedyna sciezka
//     zapisu skarbca dyplomacji w turze (`tickCyclicResourceTradeDeals`, `tickDiplomacyPayments`);
//   - `ownerTreasury` / `setOwnerTreasury` (main.ts:34864-34871, `?? 0`, `Math.max(0, value)`);
//   - `ownerPracaPool` / `setOwnerPracaPool` (main.ts:34876-34894, `?? 0`, `Math.max(0, value)`).
// Stubowane (jawnie, bez wplywu na wartosc): `isHuman` (fotel 0 = `HUMAN_OWNER_PRIMARY`, main.ts:13747),
// mapy `playerStateByHuman`/`pracaPoolByHuman`/`aiSkarbiecByOwner`/`aiPracaPoolByOwner`, `setOwnerLastPraca`
// (cache HUD).
// Semantyka wektora: pin wykonuje JEDNA operacje na kazdym wlascicielu wpisanym w delcie (raport D3/D6 niesie
// jeden zagregowany przyrost na wlasciciela), w kolejnosci rosnacych id. Wynik = stan po tych operacjach.
// Strazniki: SHA-256 wycinkow pinu (zapisane w pliku wyjsciowym). Ziarno PRNG 2311.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const MAIN = 'gra/src/main.ts';
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..', '..');
const OUT_DIR = HERE;
const HUMAN = 0;
const N_RANDOM = 220;
const SEED = 2311;

// Wycinki pinu: marker startu, wzorzec konca bloku.
const FRAGMENTS = [
  { label: 'add', start: 'add: (ownerId: number, delta: number) => {', end: /^        },$/ },
  { label: 'ownerTreasury', start: 'function ownerTreasury(ownerId: number): number {', end: /^    }$/ },
  { label: 'setOwnerTreasury', start: 'function setOwnerTreasury(ownerId: number, value: number): void {', end: /^    }$/ },
  { label: 'ownerPracaPool', start: 'function ownerPracaPool(ownerId: number): number {', end: /^    }$/ },
  { label: 'setOwnerPracaPool', start: 'function setOwnerPracaPool(ownerId: number, value: number): void {', end: /^    }$/ },
];

const pinText = execFileSync('git', ['show', `${PIN}:${MAIN}`], {
  cwd: REPO,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const pinLines = pinText.split('\n');

function extract(frag) {
  const s = pinLines.findIndex(l => l.includes(frag.start));
  if (s < 0) throw new Error(`brak markera: ${frag.start}`);
  let e = s + 1;
  while (e < pinLines.length && !frag.end.test(pinLines[e])) e++;
  if (e >= pinLines.length) throw new Error(`brak konca dla ${frag.label}`);
  const body = pinLines.slice(s, e + 1);
  const sha = createHash('sha256').update(body.join('\n')).digest('hex');
  return { body, sha, lines: `${s + 1}-${e + 1}` };
}

const parts = {};
for (const frag of FRAGMENTS) {
  parts[frag.label] = extract(frag);
  console.error(`[pin] ${frag.label}: main.ts:${parts[frag.label].lines} sha256=${parts[frag.label].sha}`);
}

// `add` jest wlasciwoscia obiektu (arrow): zamieniamy pierwsza linie na deklaracje, ostatnia na `};`.
const addBody = parts.add.body.slice();
addBody[0] = addBody[0].replace(/^\s*add:\s*/, 'const addFn = ');
addBody[addBody.length - 1] = '};';

const code = [
  'function __pin(env) {',
  'const { isHuman, playerStateByHuman, pracaPoolByHuman, aiSkarbiecByOwner, aiPracaPoolByOwner, setOwnerLastPraca } = env;',
  ...parts.ownerTreasury.body,
  ...parts.setOwnerTreasury.body,
  ...parts.ownerPracaPool.body,
  ...parts.setOwnerPracaPool.body,
  ...addBody,
  'return { ownerTreasury, setOwnerTreasury, ownerPracaPool, setOwnerPracaPool, addFn };',
  '}',
].join('\n');

const js = stripTypeScriptTypes(code, { mode: 'strip' });
const build = new Function(`${js}\nreturn __pin;`)();

// Stan przypadku -> srodowisko pinu -> wykonanie pinu -> stan po operacjach.
function runPin(c) {
  const playerStateByHuman = new Map([[HUMAN, { skarbiec: c.human_treasury }]]);
  const pracaPoolByHuman = new Map([[HUMAN, { praca: c.human_praca }]]);
  const aiSkarbiecByOwner = new Map(Object.entries(c.ai_treasury).map(([k, v]) => [Number(k), v]));
  const aiPracaPoolByOwner = new Map(Object.entries(c.ai_praca).map(([k, v]) => [Number(k), v]));
  const pin = build({
    isHuman: id => id === HUMAN,
    playerStateByHuman,
    pracaPoolByHuman,
    aiSkarbiecByOwner,
    aiPracaPoolByOwner,
    setOwnerLastPraca: () => {},
  });
  for (const owner of Object.keys(c.treasury_deltas).map(Number).sort((a, b) => a - b)) {
    pin.addFn(owner, c.treasury_deltas[owner]);
  }
  for (const owner of Object.keys(c.praca_deltas).map(Number).sort((a, b) => a - b)) {
    pin.setOwnerPracaPool(owner, pin.ownerPracaPool(owner) + c.praca_deltas[owner]);
  }
  return {
    human_treasury: playerStateByHuman.get(HUMAN).skarbiec,
    human_praca: pracaPoolByHuman.get(HUMAN).praca,
    ai_treasury: Object.fromEntries([...aiSkarbiecByOwner.entries()].map(([k, v]) => [String(k), v])),
    ai_praca: Object.fromEntries([...aiPracaPoolByOwner.entries()].map(([k, v]) => [String(k), v])),
  };
}

// PRNG mulberry32, ziarno SEED.
let st = SEED >>> 0;
function rnd() {
  st = (st + 0x6d2b79f5) >>> 0;
  let t = st;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const randVal = () => pick([0, 1, 2.5, 10, 37, 0.1, 0.2, 999.75, 12345.678, 1e9]) * pick([1, -1, 1, 1]);

const EDGE = [
  { ref: 'main.ts:22628-22644', human_treasury: 0, human_praca: 0, ai_treasury: {}, ai_praca: {}, treasury_deltas: {}, praca_deltas: {} },
  { ref: 'main.ts:22628-22644', human_treasury: 50, human_praca: 0, ai_treasury: {}, ai_praca: {}, treasury_deltas: { 2: 3 }, praca_deltas: {} },
  { ref: 'main.ts:22628-22644', human_treasury: 50, human_praca: 0, ai_treasury: {}, ai_praca: {}, treasury_deltas: { 2: -40 }, praca_deltas: {} },
  { ref: 'main.ts:22628-22644', human_treasury: 40, human_praca: 0, ai_treasury: { 2: 7 }, ai_praca: {}, treasury_deltas: { 0: -3, 2: 3 }, praca_deltas: {} },
  { ref: 'main.ts:34879-34894', human_treasury: 0, human_praca: 0, ai_treasury: {}, ai_praca: { 2: 5 }, treasury_deltas: {}, praca_deltas: { 2: -10 } },
  { ref: 'main.ts:34879-34894', human_treasury: 0, human_praca: 0, ai_treasury: {}, ai_praca: { 2: 5 }, treasury_deltas: {}, praca_deltas: { 2: -5 } },
  { ref: 'main.ts:34879-34894', human_treasury: 0, human_praca: 12, ai_treasury: {}, ai_praca: {}, treasury_deltas: {}, praca_deltas: { 0: -12, 3: 12 } },
  { ref: 'main.ts:34879-34894', human_treasury: 0, human_praca: 0, ai_treasury: {}, ai_praca: {}, treasury_deltas: {}, praca_deltas: { 1: 0 } },
  { ref: 'main.ts:22628-22644', human_treasury: 0, human_praca: 0, ai_treasury: {}, ai_praca: {}, treasury_deltas: { 4: 0.1 }, praca_deltas: {} },
  { ref: 'main.ts:22628-22644', human_treasury: 0.2, human_praca: 0, ai_treasury: { 4: 0.1 }, ai_praca: {}, treasury_deltas: { 0: 0.1 }, praca_deltas: {} },
  { ref: 'main.ts:22628-22644', human_treasury: -30, human_praca: 0, ai_treasury: { 3: -30 }, ai_praca: {}, treasury_deltas: { 0: 10, 3: 10 }, praca_deltas: {} },
  { ref: 'main.ts:22628-22644', human_treasury: 1e15, human_praca: 0, ai_treasury: { 3: 1e15 }, ai_praca: {}, treasury_deltas: { 3: 1e15 }, praca_deltas: {} },
];

const cases = EDGE.map(e => ({ ...e, kind: 'edge' }));
while (cases.length < N_RANDOM + EDGE.length) {
  const nAi = 1 + Math.floor(rnd() * 4);
  const aiIds = [1, 2, 3, 4, 5].sort(() => rnd() - 0.5).slice(0, nAi);
  const ai_treasury = {};
  const ai_praca = {};
  for (const id of aiIds) {
    if (rnd() < 0.6) ai_treasury[id] = randVal();
    if (rnd() < 0.6) ai_praca[id] = Math.abs(randVal());
  }
  const treasury_deltas = {};
  const praca_deltas = {};
  for (const id of [HUMAN, ...aiIds]) {
    if (rnd() < 0.5) treasury_deltas[id] = randVal();
    if (rnd() < 0.4) praca_deltas[id] = randVal();
  }
  cases.push({
    ref: rnd() < 0.5 ? 'main.ts:22628-22644' : 'main.ts:34879-34894',
    human_treasury: randVal(),
    human_praca: Math.abs(randVal()),
    ai_treasury,
    ai_praca,
    treasury_deltas,
    praca_deltas,
    kind: 'random',
  });
}

const vectors = cases.map((c, i) => {
  const expect = runPin(c);
  for (const x of [expect.human_treasury, expect.human_praca, ...Object.values(expect.ai_treasury), ...Object.values(expect.ai_praca)]) {
    if (!Number.isFinite(x)) throw new Error(`wektor ${i + 1}: wynik nieskonczony`);
  }
  return {
    id: i + 1,
    ref: c.ref,
    kind: c.kind,
    human_treasury: c.human_treasury,
    human_praca: c.human_praca,
    ai_treasury: c.ai_treasury,
    ai_praca: c.ai_praca,
    treasury_deltas: c.treasury_deltas,
    praca_deltas: c.praca_deltas,
    expect,
  };
});

mkdirSync(OUT_DIR, { recursive: true });
const fragments = Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, { lines: v.lines, sha256: v.sha }]));
writeFileSync(
  join(OUT_DIR, 'apply.json'),
  JSON.stringify({ pin: PIN, human_owner: HUMAN, fragments, count: vectors.length, vectors }, null, 1) + '\n',
);
console.error(`wektorow: ${vectors.length}`);
