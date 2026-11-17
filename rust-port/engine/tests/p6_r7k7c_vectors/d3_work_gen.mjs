// P6-WIRE-R7K7C (#299, runda 2, zarzut 5): generator wektorow D3 dla platnosci Praca w cyklicznym handlu.
// WYKONYWANY TEKST PINU 07d2fbd72 (gra/src/main.ts, odczyt przez `git show`):
//   - `ownerPracaPool` / `setOwnerPracaPool` (main.ts:34876-34894; podloga `Math.max(0, value)` w main.ts:34880);
//   - sekwencja platnosci z `applyCyclicDeliveryOutcome` (main.ts:24015-24016): dla kazdej platnosci
//     setOwnerPracaPool(platnik, ownerPracaPool(platnik) - z), potem setOwnerPracaPool(odbiorca, ownerPracaPool(odbiorca) + z).
// Stubowane (bez wplywu na wartosc): isHuman (wlasciciel 0 = gracz), mapy pul, setOwnerLastPraca (cache HUD).
// Uruchomienie: node rust-port/engine/tests/p6_r7k7c_vectors/d3_work_gen.mjs  (Node >= 22.13)
// Wynik -> p6_r7k7c_vectors/d3_work.json. Konsument: tests/p6_r7k7c_d3.rs.
// Ziarno PRNG 2999. Zawiera przypadki brzegowe: platnik = odbiorca, brak wpisu (= 0), platnosc wieksza niz pula.
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
const HUMAN = 0;
const SEED = 2999;

const FRAGMENTS = [
  { label: 'ownerPracaPool', start: 'function ownerPracaPool(ownerId: number): number {', end: /^    }$/ },
  { label: 'setOwnerPracaPool', start: 'function setOwnerPracaPool(ownerId: number, value: number): void {', end: /^    }$/ },
];
const pinLines = execFileSync('git', ['show', `${PIN}:${MAIN}`], { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n');

function extract(frag) {
  const s = pinLines.findIndex(l => l.includes(frag.start));
  if (s < 0) throw new Error(`brak markera: ${frag.start}`);
  let e = s + 1;
  while (e < pinLines.length && !frag.end.test(pinLines[e])) e++;
  if (e >= pinLines.length) throw new Error(`brak konca dla ${frag.label}`);
  const body = pinLines.slice(s, e + 1);
  return { body, lines: `${s + 1}-${e + 1}`, sha256: createHash('sha256').update(body.join('\n')).digest('hex') };
}
const parts = Object.fromEntries(FRAGMENTS.map(f => [f.label, extract(f)]));
// Strazniki: oczekiwane zakresy linii pinu (zrodlo: main.ts:34876-34894 w 07d2fbd72).
if (parts.ownerPracaPool.lines !== '34876-34878' || parts.setOwnerPracaPool.lines !== '34879-34894') {
  throw new Error(`STRAZNIK linii pinu: ${parts.ownerPracaPool.lines} / ${parts.setOwnerPracaPool.lines}`);
}

const code = [
  'function __pin(env) {',
  'const { isHuman, playerStateByHuman, pracaPoolByHuman, aiPracaPoolByOwner, setOwnerLastPraca } = env;',
  ...parts.ownerPracaPool.body,
  ...parts.setOwnerPracaPool.body,
  'return { ownerPracaPool, setOwnerPracaPool };',
  '}',
].join('\n');
const build = new Function(`${stripTypeScriptTypes(code, { mode: 'strip' })}\nreturn __pin;`)();

function runPin(c) {
  const pracaPoolByHuman = new Map([[HUMAN, { praca: c.pools[HUMAN] ?? 0 }]]);
  const aiPracaPoolByOwner = new Map(
    Object.entries(c.pools).filter(([k]) => Number(k) !== HUMAN).map(([k, v]) => [Number(k), v]),
  );
  const pin = build({
    isHuman: id => id === HUMAN,
    playerStateByHuman: new Map(),
    pracaPoolByHuman,
    aiPracaPoolByOwner,
    setOwnerLastPraca: () => {},
  });
  for (const [buyer, seller, z] of c.payments) {
    pin.setOwnerPracaPool(buyer, pin.ownerPracaPool(buyer) - z);
    pin.setOwnerPracaPool(seller, pin.ownerPracaPool(seller) + z);
  }
  const out = {};
  for (const owner of [0, 1, 2, 3, 4]) out[owner] = pin.ownerPracaPool(owner);
  return out;
}

let st = SEED >>> 0;
function rnd() {
  st = (st + 0x6d2b79f5) >>> 0;
  let t = st;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const POOLS = [0, 0.1, 0.2, 1, 2.5, 5, 10, 37, 999.75, 12345.678];
const PAY = [0.1, 0.2, 1, 2.5, 3, 10, 37, 0.75, 999.75];

const cases = [
  // Brzegi: platnik = odbiorca, brak wpisu (= 0), platnosc wieksza niz pula, zapis platnika przed odczytem odbiorcy.
  { ref: 'main.ts:24015-24016', pools: { 1: 5 }, payments: [[1, 1, 10]] },
  { ref: 'main.ts:24015-24016', pools: { 1: 5 }, payments: [[1, 1, 3]] },
  { ref: 'main.ts:24015-24016', pools: {}, payments: [[2, 3, 7]] },
  { ref: 'main.ts:24015-24016', pools: { 2: 4 }, payments: [[2, 3, 10]] },
  { ref: 'main.ts:34879-34882', pools: { 2: 4, 3: 1 }, payments: [[2, 3, 10], [3, 2, 1]] },
  { ref: 'main.ts:34879-34882', pools: { 2: 4, 3: 1 }, payments: [[3, 2, 2], [2, 3, 5], [2, 2, 1]] },
  { ref: 'main.ts:34879-34882', pools: { 0: 12 }, payments: [[0, 3, 12]] },
  { ref: 'main.ts:34879-34882', pools: { 0: 1 }, payments: [[0, 1, 2], [1, 0, 2]] },
];
while (cases.length < 220) {
  const pools = {};
  for (const id of [0, 1, 2, 3, 4]) if (rnd() < 0.6) pools[id] = pick(POOLS);
  const payments = [];
  const n = 1 + Math.floor(rnd() * 4);
  for (let i = 0; i < n; i++) {
    const buyer = Math.floor(rnd() * 5);
    const seller = rnd() < 0.1 ? buyer : Math.floor(rnd() * 5);
    payments.push([buyer, seller, pick(PAY)]);
  }
  cases.push({ ref: rnd() < 0.5 ? 'main.ts:24015-24016' : 'main.ts:34879-34882', pools, payments });
}

const vectors = cases.map((c, i) => {
  const expect = runPin(c);
  for (const v of Object.values(expect)) if (!Number.isFinite(v)) throw new Error(`wektor ${i + 1}: wynik nieskonczony`);
  return { id: i + 1, ref: c.ref, pools: c.pools, payments: c.payments, expect };
});

mkdirSync(HERE, { recursive: true });
const fragments = Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, { lines: v.lines, sha256: v.sha256 }]));
writeFileSync(
  join(HERE, 'd3_work.json'),
  JSON.stringify({ pin: PIN, human_owner: HUMAN, fragments, count: vectors.length, vectors }, null, 1) + '\n',
);
console.error(`wektorow D3 praca: ${vectors.length}`);
