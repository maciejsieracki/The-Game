// R-RUSTPORT-P6-POWER-PRODUCERS-Q1: generator wektorow WYKONUJE kod z pinu (nie transkrypcja reki).
//
// Zrodla (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75, tylko odczyt, poza repo):
//   * gra/src/game/manpower.ts        -> clampLudki, cityLudnoscAbsolutna, epokaManpowerRow, scaledManpower,
//                                        cityManpowerMax, cityManpowerCurrent, unitManpowerCost, empireSumaLudkow,
//                                        rekrutUnitEquivalents, empirePoborTotals (wyciete po nazwie, wykonane);
//                                        stale ROWS / MAX_EPOKA (wyciete linie);
//   * gra/src/game/culture-religion.ts -> finiteOr, empireCultureTotal (wyciete, wykonane);
//   * gra/data/epoka-ludnosc-manpower.json -> ROWS (wczytane z pinu).
// Wejscia wektorow sa generowane deterministycznie (LCG z ustalonym ziarnem); oczekiwania = wynik wykonania weba.
//
// Uzycie (WEB_ROOT = wynik `git archive <pin> gra/src gra/data | tar -x -C <katalog>`, poza repo; Node 22):
//   node rust-port/engine/tests/p6_power_producers_gen.mjs <WEB_ROOT> <PIN_SHA> > rust-port/engine/tests/p6_power_producers_vectors/vectors.json

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const [WEB_ROOT, PIN] = process.argv.slice(2);
if (!WEB_ROOT || !PIN) throw new Error('uzycie: gen.mjs <WEB_ROOT> <PIN_SHA>');
const SRC = path.join(WEB_ROOT, 'gra', 'src');

// Wycinek funkcji po nazwie: od deklaracji do domykajacego nawiasu o tym samym wcieciu.
function extractFn(lines, name) {
  const re = new RegExp(`^\\s*(export )?function ${name}\\(`);
  const start = lines.findIndex(l => re.test(l));
  if (start < 0) throw new Error(`brak funkcji ${name}`);
  const indent = lines[start].match(/^\s*/)[0];
  let end = start + 1;
  while (lines[end] !== indent + '}') end++;
  return lines.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1');
}
function extractLine(lines, re) {
  const l = lines.find(x => re.test(x));
  if (l === undefined) throw new Error(`brak linii ${re}`);
  return l.replace(/^export /, '');
}

const manpowerLines = readFileSync(path.join(SRC, 'game', 'manpower.ts'), 'utf8').split('\n');
const cultureLines = readFileSync(path.join(SRC, 'game', 'culture-religion.ts'), 'utf8').split('\n');
const epokaJson = readFileSync(path.join(WEB_ROOT, 'gra', 'data', 'epoka-ludnosc-manpower.json'), 'utf8');

const MANPOWER_FNS = [
  'clampLudki', 'cityLudnoscAbsolutna', 'epokaManpowerRow', 'scaledManpower', 'cityManpowerMax',
  'cityManpowerCurrent', 'unitManpowerCost', 'empireSumaLudkow', 'rekrutUnitEquivalents', 'empirePoborTotals',
];
const parts = [
  `const epokaTable = ${epokaJson};`,
  extractLine(manpowerLines, /^const ROWS: /),
  extractLine(manpowerLines, /^const MAX_EPOKA = /),
  ...MANPOWER_FNS.map(n => extractFn(manpowerLines, n)),
  extractFn(cultureLines, 'finiteOr'),
  extractFn(cultureLines, 'empireCultureTotal'),
];
const names = [...MANPOWER_FNS, 'empireCultureTotal'];
const code = stripTypeScriptTypes(
  `function __mkWeb() {\n${parts.join('\n')}\nreturn { ${names.join(', ')} };\n}`,
  { mode: 'strip' },
);
// Funkcje z pinu wykonywane bez zadnych atrap: brak zmiennych spoza wycinkow -> ReferenceError.
const web = new Function(`${code}\nreturn __mkWeb();`)();

// Deterministyczny generator (LCG) - wejscia wektorow.
let seed = 0x5eed2026;
const rnd = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const POPS = [0, 1, 2, 3, 5, 7, 9, 10, 12, 3.7, -2, 15.5];
const MANPOWERS = [undefined, 0, 1, 120.5, 999, 4000, -7];
const CULTURES = [0, 12.5, -4, 1000.25, 33];
const EPOKI = [0, 1, 2, 3.7, 5, 7, 9, 10, 12];
const MAX_MULTS = [0, 0.5, 1, 1.25, 2, -1];
const COST_MULTS = [0, 0.5, 1, 2, 1.5];
const OWNERS = [0, 1, 2];

const cityList = (n, mk) => Array.from({ length: n }, () => mk());

const ludkiCases = [];
for (let i = 0; i < 40; i++) {
  const n = Math.floor(rnd() * 9);
  const cities = cityList(n, () => ({ ownerId: pick(OWNERS), population: pick(POPS) }));
  const owner = pick(OWNERS);
  ludkiCases.push({ cities, owner, expect: web.empireSumaLudkow(cities, owner) });
}

const poborCases = [];
for (let i = 0; i < 60; i++) {
  const n = Math.floor(rnd() * 8);
  const cities = cityList(n, () => {
    const c = { ownerId: pick(OWNERS), population: pick(POPS) };
    const mp = pick(MANPOWERS);
    if (mp !== undefined) c.manpower = mp;
    return c;
  });
  const owner = pick(OWNERS);
  const epoka = pick(EPOKI);
  const maxMult = pick(MAX_MULTS);
  const costMult = pick(COST_MULTS);
  const pobor = web.empirePoborTotals(cities, owner, epoka, maxMult);
  // Jak main.ts: pobor z maxMult, rekruci z costMult (jako 3. argument rekrutUnitEquivalents).
  const rekrutEkw = web.rekrutUnitEquivalents(pobor.rekruci, epoka, costMult);
  poborCases.push({
    cities, owner, epoka, maxMult, costMult,
    expect: {
      sumaLudkow: pobor.sumaLudkow,
      ludnoscAbsolutna: pobor.ludnoscAbsolutna,
      rekruci: pobor.rekruci,
      poborRaw: pobor.poborRaw,
      rekrutEkw,
    },
  });
}

const kulturaCases = [];
for (let i = 0; i < 40; i++) {
  const n = Math.floor(rnd() * 8);
  const cities = cityList(n, () => ({ ownerId: pick(OWNERS), kulturaSkumulowana: pick(CULTURES) }));
  const owner = pick(OWNERS);
  kulturaCases.push({ cities, owner, expect: web.empireCultureTotal(cities, owner) });
}

const out = {
  _pin: PIN,
  _zrodla: 'gra/src/game/manpower.ts (empireSumaLudkow, empirePoborTotals, rekrutUnitEquivalents), gra/src/game/culture-religion.ts (empireCultureTotal)',
  ludki: ludkiCases,
  pobor: poborCases,
  kultura: kulturaCases,
};
process.stdout.write(JSON.stringify(out, null, 1) + '\n');
