// R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1: generator wektorow zapisu i odczytu planow marszu
// (plannedMarches, marchAttackTargets, marchStopNotified, marchStopDetail) z URUCHOMIONEGO kodu pinu.
//
// Generator WYKONUJE kod pinu 07d2fbd72 (nie transkrypcje reki):
//   * gra/src/game/planned-march.ts -> validateAutoMarchFromSave, plannedMarchesFromSave,
//     plannedMarchesToSave (wyciete po nazwie, typy zdjete przez node:module stripTypeScriptTypes);
//   * gra/src/main.ts -> syncMarchAttackTarget (main.ts:31124-31130), linia zapisu
//     `const marchSave = plannedMarchesToSave(plannedMarches);` (main.ts:37184), pola obiektu zapisu
//     `autoMarch: marchSave.autoMarch,` / `plannedMarches: marchSave.plannedMarches,` (main.ts:37243-37244)
//     oraz blok odczytu od `plannedMarches.clear();` do konca petli `for (const [uid, dest] of loadedMarches)`
//     (main.ts:46272-46287), wyciety wzgledem kotwicy `const loadedMarches = ...` i wykonany doslownie.
// Straznik SHA-256: generator odmawia pracy, gdy pliki pinu roznia sie od zapisanych skrotow.
//
// Dwa rodzaje przypadkow:
//   * state: stan (mapy weba) -> zapis (JSON.stringify jak localStorage) -> JSON.parse -> odczyt;
//   * raw:   surowy tekst pol zapisu (`autoMarch`, `plannedMarches`; takze powtorzone klucze, null,
//            zle typy, ulamki, legacy autoMarch) -> JSON.parse -> odczyt.
// Przypadki sa recznie wybrane + generowane deterministycznie (LCG). Wlasciciel `0` = gracz (web).
//
// Uzycie (WEB_ROOT = `git archive 07d2fbd72 gra/src/main.ts gra/src/game/planned-march.ts | tar -x -C <katalog>`,
// poza repo; Node 22.13+):
//   node gen-p4-1j-planned-march-vectors.mjs <WEB_ROOT>                 -> JSON wektorow na stdout
//   node gen-p4-1j-planned-march-vectors.mjs <WEB_ROOT> --check <PLIK>  -> porownanie z blokiem
//        `// BEGIN PIN VECTORS` ... `// END PIN VECTORS` w pliku testu Rust (exit 1 przy roznicy)

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const [WEB_ROOT, flag, checkFile] = process.argv.slice(2);
if (!WEB_ROOT) throw new Error('uzycie: gen.mjs <WEB_ROOT> [--check <plik.rs>]');
const SRC = path.join(WEB_ROOT, 'gra', 'src');
const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';

const EXPECTED_SHA256 = {
  'game/planned-march.ts': '12fa88cdf73947d1203e4d3fda414d1398080d436534231f8df78d0329b9ce0e',
  'main.ts': 'e80f9cb41d513b92846972a19f2760e08eb4247d6a9b344526d8bc71bd7d5f19',
};

function readGuarded(rel) {
  const text = readFileSync(path.join(SRC, rel), 'utf8');
  const sha = createHash('sha256').update(text).digest('hex');
  if (sha !== EXPECTED_SHA256[rel]) throw new Error(`straznik SHA-256 ${rel}: ${sha} != ${EXPECTED_SHA256[rel]} (pin ${PIN})`);
  return text.split('\n');
}

// Wycinek funkcji po nazwie: od deklaracji do domykajacego nawiasu o tym samym wcieciu.
function extractFn(lines, name) {
  const re = new RegExp(`^\\s*(export )?function ${name}\\(`);
  const hits = lines.map((l, idx) => (re.test(l) ? idx : -1)).filter(idx => idx >= 0);
  if (hits.length !== 1) throw new Error(`funkcja ${name}: oczekiwano 1 deklaracji, jest ${hits.length}`);
  const start = hits[0];
  const indent = lines[start].match(/^\s*/)[0];
  let end = start + 1;
  while (lines[end] !== indent + '}') end++;
  return { from: start + 1, to: end + 1, text: lines.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1') };
}

// Dokladnie jedna linia o podanej tresci (bez wiodacych spacji).
function extractLine(lines, text) {
  const hits = lines.map((l, idx) => (l.trim() === text ? idx : -1)).filter(idx => idx >= 0);
  if (hits.length !== 1) throw new Error(`linia "${text}": oczekiwano 1 wystapienia, jest ${hits.length}`);
  return { line: hits[0] + 1, text: lines[hits[0]].trim() };
}

const strip = src => stripTypeScriptTypes(src, { mode: 'strip' });

const pmLines = readGuarded('game/planned-march.ts');
const mainLines = readGuarded('main.ts');

const fnValidate = extractFn(pmLines, 'validateAutoMarchFromSave');
const fnFromSave = extractFn(pmLines, 'plannedMarchesFromSave');
const fnToSave = extractFn(pmLines, 'plannedMarchesToSave');
const fnSync = extractFn(mainLines, 'syncMarchAttackTarget');
const saveLine = extractLine(mainLines, 'const marchSave = plannedMarchesToSave(plannedMarches);');
const saveAuto = extractLine(mainLines, 'autoMarch: marchSave.autoMarch,');
const savePlanned = extractLine(mainLines, 'plannedMarches: marchSave.plannedMarches,');

// Blok odczytu: kotwica `const loadedMarches = ...`; poczatek = najblizsze wczesniejsze
// `plannedMarches.clear();`, koniec = `}` zamykajace petle `for (const [uid, dest] of loadedMarches)`.
const anchor = extractLine(mainLines, 'const loadedMarches = plannedMarchesFromSave(saved.autoMarch, saved.plannedMarches, units, 0);');
let loadStart = anchor.line - 1;
while (mainLines[loadStart].trim() !== 'plannedMarches.clear();') loadStart--;
if (anchor.line - 1 - loadStart > 16) throw new Error('blok odczytu: plannedMarches.clear() za daleko od kotwicy');
const loopLine = anchor.line; // indeks 0-based linii po kotwicy
if (mainLines[loopLine].trim() !== 'for (const [uid, dest] of loadedMarches) {') throw new Error('blok odczytu: brak petli po kotwicy');
const loopIndent = mainLines[loopLine].match(/^\s*/)[0];
let loadEnd = loopLine + 1;
while (mainLines[loadEnd] !== loopIndent + '}') loadEnd++;
const loadBlock = mainLines.slice(loadStart, loadEnd + 1).join('\n');
const loadRange = `main.ts:${loadStart + 1}-${loadEnd + 1}`;

const factory = new Function(`
${strip(fnValidate.text)}
${strip(fnFromSave.text)}
${strip(fnToSave.text)}
function makeWorld(init) {
  const plannedMarches = new Map(init.plannedMarches);
  const marchStopNotified = new Map(init.marchStopNotified);
  const marchStopDetail = new Map(init.marchStopDetail);
  const marchAttackTargets = new Map(init.marchAttackTargets);
  const movedByPlayerThisTurn = new Set();
  let marchExecQueue = [];
  let pendingMarchHint = null;
  ${strip(fnSync.text)}
  function save() {
    ${saveLine.text}
    return JSON.stringify({ ${saveAuto.text} ${savePlanned.text} });
  }
  function load(saved, units) {
    ${loadBlock}
  }
  function dump() {
    return {
      plannedMarches: [...plannedMarches.entries()],
      marchAttackTargets: [...marchAttackTargets.entries()],
      marchStopNotified: [...marchStopNotified.entries()],
      marchStopDetail: [...marchStopDetail.entries()],
    };
  }
  return { save, load, dump };
}
return makeWorld;
`);
const makeWorld = factory();

// --- deterministyczny LCG ---
let seed = 0x1f2e3d4c;
function rnd() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0x100000000;
}
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

const ID_POOL = ['1', '2', '3', '5', '7', '10', '12', '100', '4294967294', '4294967295', '18446744073709551615'];
const REASONS = ['obstacle', 'no_path', 'no_movement', 'blocked_city', 'fog'];

function runState(name, c) {
  const world = makeWorld(c);
  const saveText = world.save();
  const before = world.dump();
  world.load(JSON.parse(saveText), c.units);
  return { name, ...c, saveText, before, loaded: world.dump() };
}

function runRaw(name, units, rawSave) {
  const world = makeWorld({
    plannedMarches: [['1', { destQ: 9, destR: 9 }]],
    marchStopNotified: [['1', 'obstacle']],
    marchStopDetail: [['1', 'zablokowany heks na trasie']],
    marchAttackTargets: [['1', '2']],
  });
  world.load(JSON.parse(rawSave), units);
  return { name, units, rawSave, loaded: world.dump() };
}

const U = (id, ownerId, q, r) => ({ id, ownerId, q, r });
const empty = { plannedMarches: [], marchStopNotified: [], marchStopDetail: [], marchAttackTargets: [] };

// ---------------- przypadki stanu (state -> zapis -> odczyt) ----------------
const stateCases = [];
stateCases.push(runState('pusty stan: zapis {} i pusty odczyt', { units: [U('1', 0, 1, 1)], ...empty }));
stateCases.push(runState('jeden marsz bez ataku', {
  units: [U('5', 0, 2, 2)], ...empty, plannedMarches: [['5', { destQ: 4, destR: 1 }]],
}));
stateCases.push(runState('kolejnosc Map 12,3,7 -> klucze obiektu 3,7,12; autoMarch = pierwszy wpis Map (12)', {
  units: [U('12', 0, 0, 0), U('3', 0, 1, 0), U('7', 0, 2, 0), U('20', 1, 5, 5)],
  ...empty,
  plannedMarches: [['12', { destQ: 3, destR: 3 }], ['3', { destQ: 5, destR: 4, attackUnitId: '20' }], ['7', { destQ: -1, destR: 2 }]],
  marchAttackTargets: [['3', '20']],
}));
stateCases.push(runState('jednostka juz na celu i jednostka AI: odfiltrowane przy odczycie', {
  units: [U('1', 0, 3, 3), U('2', 1, 0, 0), U('3', 0, 0, 1)],
  ...empty,
  plannedMarches: [['1', { destQ: 3, destR: 3 }], ['2', { destQ: 4, destR: 4 }], ['3', { destQ: 2, destR: 2 }]],
}));
stateCases.push(runState('mapy zatrzymania i smieci marchAttackTargets czyszczone przy odczycie', {
  units: [U('2', 0, 0, 0), U('5', 0, 1, 1)],
  plannedMarches: [['2', { destQ: 4, destR: 0, attackUnitId: '9' }]],
  marchStopNotified: [['2', 'obstacle'], ['5', 'no_path']],
  marchStopDetail: [['2', 'zablokowany heks na trasie'], ['5', 'brak trasy do celu']],
  marchAttackTargets: [['2', '9'], ['5', '1']],
}));
stateCases.push(runState('duze id: 4294967295 nie jest indeksem tablicy (po kluczach-indeksach)', {
  units: [U('4294967295', 0, 0, 0), U('5', 0, 1, 0), U('4294967294', 0, 2, 0)],
  ...empty,
  plannedMarches: [['4294967295', { destQ: 1, destR: 1 }], ['5', { destQ: 2, destR: 2 }], ['4294967294', { destQ: 3, destR: 3 }]],
}));
stateCases.push(runState('plan dla jednostki spoza listy jednostek: zapisany, nie wczytany', {
  units: [U('1', 0, 0, 0)],
  ...empty,
  plannedMarches: [['7', { destQ: 1, destR: 1 }], ['1', { destQ: 2, destR: 0 }]],
}));
for (let i = 0; i < 60; i++) {
  const units = [];
  for (const id of ID_POOL) {
    if (rnd() < 0.7) units.push(U(id, pick([0, 0, 0, 1, 2]), int(0, 6), int(0, 6)));
  }
  const planned = [];
  const ids = ID_POOL.slice().sort(() => rnd() - 0.5);
  for (const id of ids) {
    if (rnd() < 0.5) continue;
    const unit = units.find(u => u.id === id);
    const atDest = unit && rnd() < 0.2;
    const dest = atDest ? { destQ: unit.q, destR: unit.r } : { destQ: int(-2, 7), destR: int(-2, 7) };
    if (rnd() < 0.35) dest.attackUnitId = pick(ID_POOL);
    planned.push([id, dest]);
  }
  const stop = [];
  const detail = [];
  const targets = [];
  for (const id of ID_POOL) {
    if (rnd() < 0.2) stop.push([id, pick(REASONS)]);
    if (rnd() < 0.2) detail.push([id, pick(['zablokowany heks na trasie', 'obce miasto na trasie', 'brak trasy do celu'])]);
    if (rnd() < 0.15) targets.push([id, pick(ID_POOL)]);
  }
  stateCases.push(runState(`losowy stan #${i}`, {
    units, plannedMarches: planned, marchStopNotified: stop, marchStopDetail: detail, marchAttackTargets: targets,
  }));
}

// ---------------- przypadki surowego zapisu (tekst -> JSON.parse -> odczyt) ----------------
const rawCases = [];
const baseUnits = [U('1', 0, 0, 0), U('2', 0, 1, 1), U('3', 0, 2, 2), U('5', 1, 3, 3), U('7', 0, 4, 4), U('12', 0, 0, 5)];
const raw = (name, text, units = baseUnits) => rawCases.push(runRaw(name, units, text));
raw('brak pol zapisu', '{}');
raw('klucze 12,3,7 w tekscie -> kolejnosc 3,7,12 (Object.entries)', '{"plannedMarches":{"12":{"destQ":1,"destR":0},"3":{"destQ":5,"destR":5},"7":{"destQ":6,"destR":6}}}');
raw('powtorzony klucz: ostatnia wartosc, pierwsza pozycja', '{"plannedMarches":{"3":{"destQ":1,"destR":1},"7":{"destQ":2,"destR":2},"3":{"destQ":4,"destR":0,"attackUnitId":"5"}}}');
raw('null, brak destR, destQ napisem, jednostka nieznana, jednostka AI, na celu', '{"plannedMarches":{"1":null,"2":{"destQ":3},"3":{"destQ":"4","destR":4},"99":{"destQ":1,"destR":1},"5":{"destQ":0,"destR":0},"7":{"destQ":4,"destR":4}}}');
raw('attackUnitId: pusty, liczba, poprawny', '{"plannedMarches":{"1":{"destQ":3,"destR":3,"attackUnitId":""},"2":{"destQ":3,"destR":3,"attackUnitId":5},"3":{"destQ":0,"destR":0,"attackUnitId":"5"}}}');
raw('generalTargetId: na celu zachowany, pusty napis odrzucony', '{"plannedMarches":{"7":{"destQ":4,"destR":4,"generalTargetId":"g1"},"1":{"destQ":0,"destR":0,"generalTargetId":""},"2":{"destQ":5,"destR":5,"generalTargetId":"12"}}}');
raw('legacy autoMarch bez plannedMarches', '{"autoMarch":{"leaderId":"2","destQ":5,"destR":0}}');
raw('legacy autoMarch dla jednostki juz w plannedMarches: pominiety', '{"autoMarch":{"leaderId":"3","destQ":1,"destR":1},"plannedMarches":{"3":{"destQ":6,"destR":6}}}');
raw('legacy autoMarch na celu','{"autoMarch":{"leaderId":"1","destQ":0,"destR":0}}');
raw('legacy autoMarch dla AI', '{"autoMarch":{"leaderId":"5","destQ":0,"destR":0}}');
raw('legacy autoMarch bez leaderId', '{"autoMarch":{"destQ":1,"destR":1}}');
raw('autoMarch napisem', '{"autoMarch":"2"}');
raw('plannedMarches napisem','{"plannedMarches":"x"}');
raw('plannedMarches liczba', '{"plannedMarches":5}');
raw('plannedMarches null', '{"plannedMarches":null}');
raw('ujemne zero i ujemne cele', '{"plannedMarches":{"1":{"destQ":-0,"destR":0},"2":{"destQ":-3,"destR":-1}}}');
raw('ulamek i attackUnitId spoza UnitId (web trzyma; Rust raportuje)', '{"plannedMarches":{"2":{"destQ":2.5,"destR":1},"3":{"destQ":0,"destR":1,"attackUnitId":"e9"},"7":{"destQ":1,"destR":1,"attackUnitId":"07"},"12":{"destQ":1,"destR":1}}}');
raw('duze id', '{"plannedMarches":{"4294967295":{"destQ":1,"destR":1},"5":{"destQ":2,"destR":2},"4294967294":{"destQ":3,"destR":3}}}',
  [U('4294967295', 0, 0, 0), U('5', 0, 1, 0), U('4294967294', 0, 2, 0)]);
const RAW_VALUES = [
  'null', '{"destQ":1,"destR":2}', '{"destQ":3,"destR":0,"attackUnitId":"7"}', '{"destQ":0,"destR":5,"attackUnitId":""}',
  '{"destQ":"1","destR":2}', '{"destR":2}', '{"destQ":2,"destR":2,"generalTargetId":"g9"}', '{"destQ":1.5,"destR":0}',
  '{"destQ":4,"destR":4,"attackUnitId":"x1"}', '{"destQ":6,"destR":1,"attackUnitId":12}', '[]', '7',
  '{"destQ":5,"destR":6,"attackUnitId":"12"}', '{"destQ":-1,"destR":3,"attackUnitId":"4294967295"}',
];
for (let i = 0; i < 60; i++) {
  const units = [];
  for (const id of ID_POOL) {
    if (rnd() < 0.7) units.push(U(id, pick([0, 0, 1]), int(0, 6), int(0, 6)));
  }
  const parts = [];
  const n = int(0, 6);
  for (let k = 0; k < n; k++) {
    const key = pick(ID_POOL);
    let value = pick(RAW_VALUES);
    const unit = units.find(u => u.id === key);
    if (unit && rnd() < 0.2) value = `{"destQ":${unit.q},"destR":${unit.r}${rnd() < 0.5 ? ',"generalTargetId":"g2"' : ''}}`;
    parts.push(`"${key}":${value}`);
  }
  const fields = [];
  if (rnd() < 0.3) {
    const leader = pick(ID_POOL);
    fields.push(`"autoMarch":{"leaderId":"${leader}","destQ":${int(0, 6)},"destR":${int(0, 6)}}`);
  }
  if (rnd() < 0.9) fields.push(`"plannedMarches":{${parts.join(',')}}`);
  raw(`losowy zapis #${i}`, `{${fields.join(',')}}`, units);
}

const out = {
  pin: PIN,
  sources: {
    'planned-march.ts': [
      `validateAutoMarchFromSave:${fnValidate.from}-${fnValidate.to}`,
      `plannedMarchesFromSave:${fnFromSave.from}-${fnFromSave.to}`,
      `plannedMarchesToSave:${fnToSave.from}-${fnToSave.to}`,
    ],
    'main.ts': [
      `syncMarchAttackTarget:${fnSync.from}-${fnSync.to}`,
      `save:${saveLine.line},${saveAuto.line},${savePlanned.line}`,
      `load:${loadRange}`,
    ],
  },
  state_cases: stateCases,
  raw_cases: rawCases,
};
const json = JSON.stringify(out);

if (flag === '--check') {
  const text = readFileSync(checkFile, 'utf8');
  const begin = text.indexOf('// BEGIN PIN VECTORS\n');
  const end = text.indexOf('// END PIN VECTORS');
  if (begin < 0 || end < 0) throw new Error('brak znacznikow BEGIN/END PIN VECTORS');
  const block = text.slice(begin, end);
  const m = block.match(/r##"([\s\S]*)"##;/);
  if (!m) throw new Error('brak literalu r##"..."## w bloku');
  if (m[1] !== json) {
    console.error('ROZNICA: wektory w pliku testu != wynik generatora');
    process.exit(1);
  }
  console.log(`OK: wektory zgodne (state=${stateCases.length}, raw=${rawCases.length}, bajtow=${json.length})`);
} else {
  process.stdout.write(json);
}
