// R-RUSTPORT-P6-POWER-REST-Q1: generator wektorow WYKONUJE kod z pinu (nie transkrypcja reki).
//
// Zrodla (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75, tylko odczyt, poza repo):
//   * gra/src/game/culture-religion.ts -> clamp, totalAdherents, leadingReligion, dominantReligion,
//                                         countCitiesWithDominantStateReligion (wyciete po nazwie, wykonane).
//   * gra/src/main.ts -> countBuildingsForOwner, countTechForOwner (domkniete: wolne zmienne cityBuilt,
//                        cities, isHuman, ownerResearchedTechs, aiResearchDone podawane jako DANE wejsciowe).
//   * gra/src/game/capital-capture.ts -> barbarianCapturedPowerGain; gra/src/game/power-objective.ts ->
//                        battlePowerPointsFromDefeatedEnemy (czyste, wykonane bez zmiennych zewnetrznych).
// Zadnych atrap logiki: wszystkie zmienne potrzebne wycietym funkcjom sa parametrami (params jawnie podane,
// FALLBACK_RELIGION_PARAMS nie jest uzywane - brak wartosci domyslnej w wywolaniu). Wyjatek swiadomy:
// wolne zmienne domkniec main.ts sa danymi wektora, a ich wynik liczy wycieta funkcja weba.
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

// --- infra / tech (main.ts, funkcje domkniete) ---
// Wycinek z main.ts wykonywany z WOLNYMI ZMIENNYMI przekazanymi jako parametry (dane wejsciowe, nie reimplementacja):
// countBuildingsForOwner: cityBuilt (Map), cities; countTechForOwner: isHuman, ownerResearchedTechs, aiResearchDone.
const mainLines = readFileSync(path.join(SRC, 'main.ts'), 'utf8').split('\n');
function execClosure(lines, name, freeNames, freeValues) {
  const fn = extractFn(lines, name);
  const body = stripTypeScriptTypes(`function __w() {\n${fn}\nreturn ${name};\n}`, { mode: 'strip' });
  return new Function(...freeNames, `${body}\nreturn __w();`)(...freeValues);
}

const infraCases = [];
for (let i = 0; i < 60; i++) {
  const cities = Array.from({ length: Math.floor(rnd() * 6) }, () => [1 + Math.floor(rnd() * 6), pick(OWNERS)]);
  const cityBuilt = new Map();
  for (let k = Math.floor(rnd() * 7); k > 0; k--) {
    cityBuilt.set(1 + Math.floor(rnd() * 6), Array.from({ length: Math.floor(rnd() * 5) }, (_, j) => 'b' + j));
  }
  const owner = pick(OWNERS);
  const fn = execClosure(mainLines, 'countBuildingsForOwner', ['cityBuilt', 'cities'],
    [cityBuilt, cities.map(([id, ownerId]) => ({ id, ownerId }))]);
  infraCases.push({
    cityBuilt: [...cityBuilt.entries()].map(([cid, blt]) => [cid, blt.length]),
    cities, owner,
    expect: fn(owner),
  });
}

const techCases = [];
for (let i = 0; i < 60; i++) {
  const owner = pick(OWNERS);
  const isHuman = owner === 0; // stub isHuman: dane wejsciowe, zapisywane w wektorze
  const humanTechs = Array.from({ length: Math.floor(rnd() * 6) }, () => pick(['t1', 't2', 't3', 't4']));
  const aiTechs = rnd() < 0.3 ? null : Array.from({ length: Math.floor(rnd() * 6) }, () => pick(['t1', 't2', 't3', 't4']));
  const aiResearchDone = new Map();
  if (aiTechs !== null) aiResearchDone.set(owner, new Set(aiTechs));
  const fn = execClosure(mainLines, 'countTechForOwner', ['isHuman', 'ownerResearchedTechs', 'aiResearchDone'],
    [oid => oid === 0, () => new Set(humanTechs), aiResearchDone]);
  techCases.push({ owner, isHuman, humanTechs, aiTechs, expect: fn(owner) });
}

// --- zdobycze / bitwy: czyste kroki (capital-capture.ts, power-objective.ts) ---
const captureLines = readFileSync(path.join(SRC, 'game', 'capital-capture.ts'), 'utf8').split('\n');
const powerLines = readFileSync(path.join(SRC, 'game', 'power-objective.ts'), 'utf8').split('\n');
const captureFn = execClosure(captureLines, 'barbarianCapturedPowerGain', [], []);
const battleFn = execClosure(powerLines, 'battlePowerPointsFromDefeatedEnemy', [], []);
const LOSTS = [0, 1, 2.5, 12, 100.75, -3, NaN, Infinity, -Infinity];
const ENEMY_M = [0, 0.4, 1, 3.7, 12, 99.99, -3, NaN, Infinity, -Infinity, 1e6];
const zdobyczeCases = [];
for (let i = 0; i < 40; i++) {
  const lost = pick(LOSTS);
  const barb = rnd() < 0.5;
  zdobyczeCases.push({ lost, barb, expect: captureFn(lost, barb) });
}
const bitwyCases = ENEMY_M.map(m => ({ m, expect: battleFn(m) }));

const out = {
  _pin: PIN,
  _zrodla: 'gra/src/game/culture-religion.ts (clamp, totalAdherents, leadingReligion, dominantReligion, countCitiesWithDominantStateReligion); gra/src/main.ts (countBuildingsForOwner, countTechForOwner); gra/src/game/capital-capture.ts (barbarianCapturedPowerGain); gra/src/game/power-objective.ts (battlePowerPointsFromDefeatedEnemy)',
  dominant: dominantCases,
  religia: countCases,
  infra: infraCases,
  tech: techCases,
  zdobycze: zdobyczeCases,
  bitwy: bitwyCases,
};
// Niefinityczne liczby (NaN, +-Infinity) nie maja zapisu JSON: kodowane jako napisy, ktore testy Rust parsuja.
const nonFinite = (_k, v) => {
  if (typeof v !== 'number' || Number.isFinite(v)) return v;
  return Number.isNaN(v) ? 'NaN' : v > 0 ? 'Infinity' : '-Infinity';
};
process.stdout.write(JSON.stringify(out, nonFinite, 1) + '\n');
