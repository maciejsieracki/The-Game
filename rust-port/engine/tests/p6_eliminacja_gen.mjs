// R-RUSTPORT-P6-ELIMINACJA-Q1: generator wektorow eliminacji wlasciciela.
// Generator WYKONUJE tekst z pinu 07d2fbd72 (nie transkrypcje reki):
//   * gra/src/main.ts -> funkcja `eliminateOwner` (wycieta po nazwie i wykonana w node);
//   * gra/src/main.ts -> funkcja `diploPairKeyHasOwner` (wykonana w node);
//   * gra/src/game/capital-capture.ts -> funkcja `disbandOwnerUnits` (wykonana w node).
// Zmienne wolne (mapy, zbiory, tablice stanu) dostaja swieze instancje per przypadek; ich typ (Map/Set/tablica)
// jest odczytywany z deklaracji w main.ts. Funkcje UI (syncUnitsRender, refreshFog) to stuby zapisujace wywolanie.
// hexDistance i endMapSiege RZUCAJA: wektory nie generuja oblezen (brak oblegaCityId), wiec nie powinny byc wolane.
// Straznik SHA-256: generator odmawia pracy, gdy pliki pinu roznia sie od zapisanych skrotow.
// Zakres porownania (snapshot): jednostki (id po kolejnosci), eliminatedOwners, battlePowerPtsByOwner,
// zdobyczePowerByOwner, diplomacyRelations (klucze par). Reszta pol eliminateOwner jest NIE_ZMIERZONO w Rust.
//
// Uzycie (WEB_ROOT = `git archive 07d2fbd72 gra/src | tar -x -C <katalog>`, poza repo; Node 22+):
//   node rust-port/engine/tests/p6_eliminacja_gen.mjs <WEB_ROOT> > rust-port/engine/tests/p6_eliminacja_vectors/vectors.json

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const [WEB_ROOT] = process.argv.slice(2);
if (!WEB_ROOT) throw new Error('uzycie: gen.mjs <WEB_ROOT>');
const SRC = path.join(WEB_ROOT, 'gra', 'src');
const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';

const EXPECTED_SHA256 = {
  'main.ts': 'e80f9cb41d513b92846972a19f2760e08eb4247d6a9b344526d8bc71bd7d5f19',
  'game/capital-capture.ts': '2716765911b2e083cb984d7f4e265e7fb55f0ad865cdc50dc5e27add8e373f81',
};

function readGuarded(rel) {
  const text = readFileSync(path.join(SRC, rel), 'utf8');
  const sha = createHash('sha256').update(text).digest('hex');
  if (sha !== EXPECTED_SHA256[rel]) throw new Error(`strazik SHA-256 ${rel}: ${sha} != ${EXPECTED_SHA256[rel]} (pin ${PIN})`);
  return text.split('\n');
}

// Wycinek funkcji po nazwie: od deklaracji do domykajacego nawiasu o tym samym wcieciu.
function extractFn(lines, name) {
  const re = new RegExp(`^\\s*(export )?function ${name}\\b`);
  const hits = lines.map((l, idx) => (re.test(l) ? idx : -1)).filter(idx => idx >= 0);
  if (hits.length !== 1) throw new Error(`funkcja ${name}: oczekiwano 1 deklaracji, jest ${hits.length}`);
  const start = hits[0];
  const indent = lines[start].match(/^\s*/)[0];
  let end = start;
  if (!lines[start].trimEnd().endsWith('}')) {
    end = start + 1;
    while (lines[end] !== indent + '}') end++;
  }
  return lines.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1');
}

const mainLines = readGuarded('main.ts');
const capLines = readGuarded('game/capital-capture.ts');

const elimSrc = extractFn(mainLines, 'eliminateOwner');
const diploSrc = extractFn(mainLines, 'diploPairKeyHasOwner');
const disbandSrc = extractFn(capLines, 'disbandOwnerUnits');
const stripped = stripTypeScriptTypes(`${elimSrc}\n${diploSrc}\n${disbandSrc}`, { mode: 'strip' });

// Analiza zmiennych wolnych: tokeny poza stalymi tekstowymi, komentarzami i wlasciwosciami (po kropce).
function noise(s) {
  let t = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  t = t.replace(/`([^`]*)`/g, (_, body) => ` ${[...body.matchAll(/\$\{([^}]*)\}/g)].map(m => m[1]).join(' ')} `);
  return t.replace(/'[^'\n]*'|"[^"\n]*"/g, ' ');
}
const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'of', 'in', 'new', 'delete', 'typeof', 'void',
  'null', 'undefined', 'true', 'false', 'while', 'break', 'continue', 'of',
]);
const BUILTINS = new Set([
  'console', 'Map', 'Set', 'Array', 'Number', 'String', 'Object', 'Infinity', 'NaN', 'Math', 'JSON',
]);
// Zmienne wolne liczone tylko dla eliminateOwner; dwie pomocnicze funkcje sa definiowane wewnatrz fabryki.
const clean = noise(stripTypeScriptTypes(elimSrc, { mode: 'strip' }));
const declared = new Set(['diploPairKeyHasOwner', 'disbandOwnerUnits']);
for (const m of clean.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
for (const m of clean.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
for (const m of clean.matchAll(/\b(?:const|let|var)\s+\[([^\]]+)\]/g)) m[1].split(',').forEach(n => declared.add(n.trim()));
for (const m of clean.matchAll(/\(([^()]*)\)\s*=>/g)) m[1].split(',').map(s => s.trim().replace(/:.*$/, '')).filter(Boolean).forEach(n => declared.add(n));
for (const m of clean.matchAll(/([A-Za-z_$][\w$]*)\s*=>/g)) declared.add(m[1]);
for (const m of clean.matchAll(/function\s+[\w$]+\s*\(([^)]*)\)/g)) m[1].split(',').map(s => s.trim()).filter(Boolean).forEach(n => declared.add(n));
const tokens = new Set([...clean.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)/g)].map(m => m[1]));
const free = [...tokens].filter(t => !declared.has(t) && !KEYWORDS.has(t) && !BUILTINS.has(t)).sort();

// Typ zmiennej wolnej z deklaracji w main.ts (pierwsza deklaracja).
function declKind(name) {
  const re = new RegExp(`^\\s*(?:export\\s+)?(?:const|let|var)\\s+${name}\\b\\s*(?::[^=]*)?=\\s*(new Map|new Set|\\[\\])`);
  for (const l of mainLines) {
    const m = l.match(re);
    if (m) return m[1];
  }
  return null;
}
const NOOP_STUBS = new Set(['syncUnitsRender', 'refreshFog']);
const THROW_STUBS = new Set(['hexDistance', 'endMapSiege']);
const kinds = {};
for (const name of free) {
  if (NOOP_STUBS.has(name)) kinds[name] = 'noop';
  else if (THROW_STUBS.has(name)) kinds[name] = 'throw';
  else {
    const k = declKind(name);
    if (!k) throw new Error(`nieobsluzona zmienna wolna w eliminateOwner: ${name}`);
    kinds[name] = k;
  }
}
const SNAP = ['units', 'eliminatedOwners', 'battlePowerPtsByOwner', 'zdobyczePowerByOwner', 'diplomacyRelations'];
for (const n of SNAP) {
  if (!free.includes(n)) throw new Error(`zmienna snapshotu ${n} nie wystepuje w kodzie funkcji`);
}

const factorySrc = `${stripped}\nreturn { run: eliminateOwner, snap: () => ({ units, eliminatedOwners, battlePowerPtsByOwner, zdobyczePowerByOwner, diplomacyRelations }) };`;
// console.log z kodu weba (logi eliminacji) wycisz: stdout jest zarezerwowany dla JSON.
console.log = () => {};
const factory = new Function(...free, factorySrc);

function freshEnv() {
  const env = {};
  for (const n of free) {
    const k = kinds[n];
    if (k === 'new Map') env[n] = new Map();
    else if (k === 'new Set') env[n] = new Set();
    else if (k === '[]') env[n] = [];
    else if (k === 'noop') env[n] = () => {};
    else if (k === 'throw') env[n] = () => { throw new Error(`NIE_ZMIERZONO: ${n} wywolane w wektorach`); };
    else throw new Error(`typ ${k} dla ${n}`);
  }
  return env;
}

// Deterministyczny generator (LCG).
let seed = 0x7e11a2c5;
const rnd = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const OWNERS = [1, 2, 3, 4];
const CALLS = [0, 1, 2, 3, 4, 5];

function sortedEntries(map) {
  return [...map.entries()].map(([k, v]) => [k, v]).sort((a, b) => a[0] - b[0]);
}
function snapOf(env, inst) {
  const s = inst.snap();
  return {
    units: s.units.map(u => u.id),
    eliminated: [...s.eliminatedOwners].sort((a, b) => a - b),
    battle: sortedEntries(s.battlePowerPtsByOwner),
    zdobycze: sortedEntries(s.zdobyczePowerByOwner),
    relations: [...s.diplomacyRelations.keys()].map(k => k.split('_').map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1]),
  };
}

function randomInit() {
  const env = freshEnv();
  const unitCount = Math.floor(rnd() * 8);
  for (let i = 0; i < unitCount; i++) env.units.push({ id: i + 1, ownerId: pick(OWNERS) });
  for (const o of OWNERS) if (rnd() < 0.2) env.eliminatedOwners.add(o);
  for (const o of OWNERS) if (rnd() < 0.6) env.battlePowerPtsByOwner.set(o, Math.round(rnd() * 400) / 4);
  for (const o of OWNERS) if (rnd() < 0.6) env.zdobyczePowerByOwner.set(o, Math.round(rnd() * 400) / 4);
  for (let a = 1; a <= 5; a++) for (let b = a + 1; b <= 5; b++) {
    if (rnd() < 0.35) env.diplomacyRelations.set(`${a}_${b}`, { trust: 1 });
  }
  return env;
}

function initSnapshot(env) {
  // Stan poczatkowy w formacie wektora (przed pierwszym wywolaniem). Wlasciciele jednostek sa osobnym polem.
  const inst = factory(...free.map(n => env[n]));
  return { ...snapOf(env, inst), unit_owners: env.units.map(u => u.ownerId) };
}

const cases = [];
for (let i = 0; i < 180; i++) {
  const env = randomInit();
  const init = initSnapshot(env);
  const inst = factory(...free.map(n => env[n]));
  const steps = [];
  const nSteps = 1 + Math.floor(rnd() * 4);
  for (let s = 0; s < nSteps; s++) {
    const owner = rnd() < 0.8 ? pick(OWNERS) : pick(CALLS);
    const before = snapOf(env, inst);
    const wasEliminated = owner === 0 || before.eliminated.includes(owner);
    inst.run(owner);
    const after = snapOf(env, inst);
    steps.push({
      owner,
      expect_pominieta: wasEliminated,
      expect_usuniete_jednostki: before.units.length - after.units.length,
      expect_usuniete_relacje: before.relations.length - after.relations.length,
      expect_units: after.units,
      expect_eliminated: after.eliminated,
      expect_battle: after.battle,
      expect_zdobycze: after.zdobycze,
      expect_relations: after.relations,
    });
  }
  cases.push({ init, steps });
}

const out = {
  pin: PIN,
  sources: EXPECTED_SHA256,
  free_names: free,
  note: 'expect_* = wynik wykonania tekstu eliminateOwner z pinu (node); snapshot: id jednostek po kolejnosci, zbiory/Mapy jako posortowane pary, relacje jako pary wlascicieli',
  cases,
};
process.stdout.write(JSON.stringify(out, null, 1) + '\n');
