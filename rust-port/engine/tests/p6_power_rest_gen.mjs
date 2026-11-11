// R-RUSTPORT-P6-POWER-REST-Q1: generator wektorow WYKONUJE kod z pinu (nie transkrypcja reki).
//
// Zrodla (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75, tylko odczyt, poza repo):
//   * gra/src/game/culture-religion.ts -> clamp, totalAdherents, leadingReligion, dominantReligion,
//                                         countCitiesWithDominantStateReligion (wyciete po nazwie, wykonane).
// Zadnych atrap: wszystkie zmienne potrzebne wycietym funkcjom sa parametrami (params jawnie podane,
// FALLBACK_RELIGION_PARAMS nie jest uzywane - brak wartosci domyslnej w wywolaniu).
// Wejscia wektorow sa generowane deterministycznie (LCG z ustalonym ziarnem); oczekiwania = wynik wykonania weba.
//
// Uzycie (WEB_ROOT = wynik `git archive <pin> gra/src gra/data | tar -x -C <katalog>`, poza repo; Node 22):
//   node rust-port/engine/tests/p6_power_rest_gen.mjs <WEB_ROOT> <PIN_SHA> > rust-port/engine/tests/p6_power_rest_vectors/vectors.json

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const [WEB_ROOT, PIN] = process.argv.slice(2);
if (!WEB_ROOT || !PIN) throw new Error('uzycie: gen.mjs <WEB_ROOT> <PIN_SHA>');
const SRC = path.join(WEB_ROOT, 'gra', 'src');

// Wycinek funkcji po nazwie: od deklaracji do domykajacego nawiasu o tym samym wcieciu.
function extractFn(lines, name) {
  const re = new RegExp(`^\\s*(export )?function ${name}\\(`);
  const hits = lines.map((l, idx) => (re.test(l) ? idx : -1)).filter(idx => idx >= 0);
  if (hits.length !== 1) throw new Error(`funkcja ${name}: oczekiwano 1 deklaracji, jest ${hits.length}`);
  const start = hits[0];
  const indent = lines[start].match(/^\s*/)[0];
  let end = start + 1;
  while (lines[end] !== indent + '}') end++;
  return lines.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1');
}

const cultureLines = readFileSync(path.join(SRC, 'game', 'culture-religion.ts'), 'utf8').split('\n');

const RELIGION_FNS = [
  'clamp', 'totalAdherents', 'leadingReligion', 'dominantReligion', 'countCitiesWithDominantStateReligion',
];
const parts = RELIGION_FNS.map(n => extractFn(cultureLines, n));
const code = stripTypeScriptTypes(
  `function __mkWeb() {\n${parts.join('\n')}\nreturn { ${RELIGION_FNS.join(', ')} };\n}`,
  { mode: 'strip' },
);
// Funkcje z pinu wykonywane bez atrap: brak zmiennych spoza wycinkow -> ReferenceError.
const web = new Function(`${code}\nreturn __mkWeb();`)();

// Deterministyczny generator (LCG) - wejscia wektorow.
let seed = 0x7e11a2026;
const rnd = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const pick = arr => arr[Math.floor(rnd() * arr.length)];
// Nazwy ASCII o mieszanym case: sortowanie JS (kod UTF-16) = sortowanie Rust BTreeMap (bajty) dla ASCII.
const RELIGIONS = ['Alpha', 'beta', 'Gamma', 'delta', 'Zeta', 'a', ''];
const COUNTS = [0, 1, 2, 3, 5, 10, 12.5, -4, NaN, Infinity, -Infinity];
const PROGS = [0, 1, 33, 50, 60, 100, 150, -10, 49.99, 50.01];
const OWNERS = [0, 1, 2];
const STATES = [null, '', 'Alpha', 'beta', 'Gamma', 'Zeta', 'zzz', 'delta', 'a', 'delta'];

function randomCounts() {
  const counts = {};
  const k = 1 + Math.floor(rnd() * 4);
  for (let i = 0; i < k; i++) counts[pick(RELIGIONS)] = pick(COUNTS);
  return { counts };
}

const cityOf = owner => {
  const c = { ownerId: owner !== undefined && rnd() < 0.7 ? owner : pick(OWNERS) };
  // Brak religionState w pinie = `c.religionState ?? { counts: {} }`.
  if (rnd() > 0.15) c.religionState = randomCounts();
  return c;
};

const dominantCases = [];
for (let i = 0; i < 60; i++) {
  const state = randomCounts();
  const params = { progDominacjiPct: pick(PROGS) };
  dominantCases.push({ state, prog: params.progDominacjiPct, expect: web.dominantReligion(state, params) });
}

const countCases = [];
for (let i = 0; i < 60; i++) {
  const n = Math.floor(rnd() * 11);
  const owner = pick(OWNERS);
  const cities = Array.from({ length: n }, () => cityOf(owner));
  const state = pick(STATES);
  const prog = pick(PROGS);
  const params = { progDominacjiPct: prog };
  countCases.push({
    cities, owner, state, prog,
    expect: web.countCitiesWithDominantStateReligion(cities, owner, state, params),
  });
}

const out = {
  _pin: PIN,
  _zrodla: 'gra/src/game/culture-religion.ts (clamp, totalAdherents, leadingReligion, dominantReligion, countCitiesWithDominantStateReligion)',
  dominant: dominantCases,
  religia: countCases,
};
// Niefinityczne liczby (NaN, +-Infinity) nie maja zapisu JSON: kodowane jako napisy, ktore testy Rust parsuja.
const nonFinite = (_k, v) => {
  if (typeof v !== 'number' || Number.isFinite(v)) return v;
  return Number.isNaN(v) ? 'NaN' : v > 0 ? 'Infinity' : '-Infinity';
};
process.stdout.write(JSON.stringify(out, nonFinite, 1) + '\n');
