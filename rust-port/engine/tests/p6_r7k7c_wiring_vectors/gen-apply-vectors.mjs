// P6-WIRE-WAR-R7K7-C (R-RUSTPORT-P6-R7K7C-WIRING-Q1): generator wektorow `apply_dipl_deltas_to_state`.
//
// Wykonuje TEKST funkcji z pinu (gra/src/main.ts @ PIN), nie jej reimplementacje:
//   - ownerTreasury(id)           (main.ts: function ownerTreasury)
//   - add(ownerId, delta)         (main.ts: buildDiploTreasury -> add, closure)
//   - ownerPracaPool(id)          (main.ts: function ownerPracaPool)
//   - setOwnerPracaPool(id, v)    (main.ts: function setOwnerPracaPool, galaz AI)
// Skladanie delty jak w pinie: skarbiec = add(id, delta) na saldzie ownerTreasury(id);
// pula Pracy = setOwnerPracaPool(id, ownerPracaPool(id) + delta).
// Strazniki: SHA-256 pliku pina i kazdego wycinka (sprawdzane przy generacji; niezgodnosc = blad).
//
// Uruchomienie (z korzenia repo):  node rust-port/engine/tests/p6_r7k7c_wiring_vectors/gen-apply-vectors.mjs
// Wyjscie: apply-vectors.json obok tego skryptu. Floaty zapisane jako hex bitow IEEE-754 (bez utraty precyzji).

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_PATH = 'gra/src/main.ts';
const PIN_MAIN_SHA256 = process.env.PIN_MAIN_SHA256 ?? '';
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..', '..', '..');

const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
const src = execFileSync('git', ['show', `${PIN}:${PIN_PATH}`], { cwd: repoRoot, maxBuffer: 1 << 28 }).toString('utf8');

function sliceFn(startMarker, endMarker) {
  const a = src.indexOf(startMarker);
  if (a < 0 || src.indexOf(startMarker, a + 1) >= 0) throw new Error(`marker niejednoznaczny: ${startMarker}`);
  const b = src.indexOf(endMarker, a);
  if (b < 0) throw new Error(`brak konca: ${startMarker}`);
  return src.slice(a, b + endMarker.length);
}
// Typy TS -> JS (tylko adnotacje ': number' / ': void' / ': boolean' w sygnaturach wycinka).
const toJs = (t) => t.replace(/!\./g, '.').replace(/\(([^()]*)\)\s*:\s*(number|void|boolean)\s*\{/g, (m, args) => `(${args.replace(/:\s*(number|string)/g, '')}) {`)
  .replace(/:\s*number(?=[,)])/g, '');

// Wycinki pinu (granice: poczatek markera .. pierwsze domkniecie na tym samym wcieciu).
const ownerTreasurySrc = sliceFn('function ownerTreasury(ownerId: number): number {', '\n    }\n');
const addSrc = sliceFn('add: (ownerId: number, delta: number) => {', '\n        },\n');
const ownerPracaSrc = sliceFn('function ownerPracaPool(ownerId: number): number {', '\n    }\n');
const setPracaSrc = sliceFn('function setOwnerPracaPool(ownerId: number, value: number): void {', '\n    }\n');

const snippets = { ownerTreasurySrc, addSrc, ownerPracaSrc, setPracaSrc };
const snippetHashes = Object.fromEntries(Object.entries(snippets).map(([k, v]) => [k, sha256(v)]));
const pinHash = sha256(src);
if (PIN_MAIN_SHA256 && pinHash !== PIN_MAIN_SHA256) throw new Error(`SHA pliku pina: ${pinHash}`);

// Wykonanie wycinkow w srodowisku stubow (stan gracza ludzkiego i AI jak w pinie).
function makeEnv(humanId, state) {
  const isHuman = (id) => id === humanId;
  const playerStateByHuman = new Map([[humanId, { skarbiec: state.humanTreasury }]]);
  const pracaPoolByHuman = new Map([[humanId, { praca: state.humanPraca }]]);
  const aiSkarbiecByOwner = new Map(state.aiTreasury);
  const aiPracaPoolByOwner = new Map(state.aiPraca);
  const setOwnerLastPraca = () => {};
  const names = ['isHuman', 'playerStateByHuman', 'pracaPoolByHuman', 'aiSkarbiecByOwner', 'aiPracaPoolByOwner', 'setOwnerLastPraca'];
  const vals = [isHuman, playerStateByHuman, pracaPoolByHuman, aiSkarbiecByOwner, aiPracaPoolByOwner, setOwnerLastPraca];
  const compile = (body) => new Function(...names, body)(...vals);
  const ownerTreasury = compile(`${toJs(ownerTreasurySrc)} return ownerTreasury;`);
  const ownerPracaPool = compile(`${toJs(ownerPracaSrc)} return ownerPracaPool;`);
  const setOwnerPracaPool = compile(`${toJs(setPracaSrc)} return setOwnerPracaPool;`);
  const diploAdd = compile(`const o = { ${toJs(addSrc)} }; return o.add;`);
  return { ownerTreasury, ownerPracaPool, setOwnerPracaPool, diploAdd, playerStateByHuman, pracaPoolByHuman, aiSkarbiecByOwner, aiPracaPoolByOwner };
}

const bits = (x) => {
  const dv = new DataView(new ArrayBuffer(8));
  dv.setFloat64(0, x);
  return dv.getBigUint64(0).toString(16).padStart(16, '0');
};

// Deterministyczny generator (LCG) -- te same wektory przy kazdym uruchomieniu.
let seed = 0x5eed1234;
const rnd = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const POOL = [0, 0.1, 0.2, 0.3, 1 / 3, 2.5e-7, -0.1, 30, -5.5, 123456.789, 1e15, -1e9, 9007199254740993, 1e-300, 0.7, -2.25, 40, 100, 7.000001, -33.3333];
const pick = () => (rnd() < 0.5 ? POOL[Math.floor(rnd() * POOL.length)] : Math.round((rnd() * 2 - 1) * 1e4) / 100);

const HUMAN_ID = 1;
const AI_ID = 2;
const vectors = [];
function addCase(kind, who, hasEntry, start, delta) {
  const humanCase = who === 'human';
  const id = humanCase ? HUMAN_ID : AI_ID;
  const state = {
    humanTreasury: humanCase ? start : 0,
    humanPraca: humanCase ? start : 0,
    aiTreasury: !humanCase && hasEntry ? [[id, start]] : [],
    aiPraca: !humanCase && hasEntry ? [[id, start]] : [],
  };
  const env = makeEnv(HUMAN_ID, state);
  let expect;
  try {
    if (kind === 'treasury') {
      const cur = env.ownerTreasury(id); // pin: ownerTreasury(id) (human: !-dostep)
      env.diploAdd(id, delta);
      void cur;
      expect = humanCase ? env.playerStateByHuman.get(id).skarbiec : env.aiSkarbiecByOwner.get(id);
    } else {
      const cur = env.ownerPracaPool(id);
      env.setOwnerPracaPool(id, cur + delta);
      expect = env.aiPracaPoolByOwner.get(id);
    }
    if (typeof expect !== 'number') throw new Error('brak wyniku');
  } catch {
    expect = undefined;
  }
  if (humanCase && !hasEntry) expect = undefined; // pin: playerStateByHuman.get(id)! => TypeError
  vectors.push({
    kind,
    owner: who,
    has_entry: hasEntry,
    start_bits: bits(start),
    delta_bits: bits(delta),
    expect: expect === undefined ? 'error' : bits(expect),
  });
}

// Skarbce: czlowiek (z wpisem i bez), AI z wpisem, AI bez wpisu (pin ?? 0), duze/ulamkowe/ujemne.
for (let i = 0; i < 60; i++) addCase('treasury', 'ai', true, pick(), pick());
for (let i = 0; i < 35; i++) addCase('treasury', 'ai', false, 0, pick());
for (let i = 0; i < 40; i++) addCase('treasury', 'human', true, pick(), pick());
// Gracz ludzki bez wpisu: pomijany -- w Rust skarbiec gracza to pole `economy.treasury` (zawsze obecne), wiec
// przypadek 'brak wpisu czlowieka' nie ma odpowiednika w typach (pin: `!` = TypeError, Rust: brak mozliwosci).
// Pule Pracy AI: podloga max(0) (pin setOwnerPracaPool), brak wpisu = 0.
for (let i = 0; i < 40; i++) addCase('praca', 'ai', true, pick(), pick());
for (let i = 0; i < 25; i++) addCase('praca', 'ai', false, 0, pick());

const out = {
  pin: PIN,
  pin_file: PIN_PATH,
  pin_file_sha256: pinHash,
  snippet_sha256: snippetHashes,
  generator: 'tests/p6_r7k7c_wiring_vectors/gen-apply-vectors.mjs',
  note: 'Wektory apply: kind treasury (ownerTreasury+add) i praca (ownerPracaPool+setOwnerPracaPool). expect="error" = pin rzuca (czlowiek bez wpisu).',
  count: vectors.length,
  vectors,
};
writeFileSync(join(here, 'apply-vectors.json'), JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(`wektory: ${vectors.length}; pin sha256=${pinHash}`);
console.log(JSON.stringify(snippetHashes));
