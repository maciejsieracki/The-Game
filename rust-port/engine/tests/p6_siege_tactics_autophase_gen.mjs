// P6 SIEGE-TAKTYKA K5g0: generator wektorow przez WYKONANIE tekstu pinu (gra/src/battle/autoBatchPhase.ts, pin 07d2fbd72).
// Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_autophase_gen.mjs (Node >= 22.13, module.stripTypeScriptTypes).
//
// Nie ma tu recznej kopii logiki: caly plik pinu jest czytany przez `git show`, strazowany SHA-256,
// pozbawiony typow TS i wykonany przez `new Function`. Jedyna zmiana: prefiks `export` jest usuwany
// (wykonanie w funkcji, nie w module ES). Plik nie ma importow.
//
// Wejscia losowane seedem mulberry32 (217). Wartosci nieskonczone zapisywane jako napisy "NaN"/"Infinity"/"-Infinity".
// `undefined` (pola opcjonalne) pomijane w JSON, tak jak w webie.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_PATH = 'gra/src/battle/autoBatchPhase.ts';
const SOURCE_SHA256 = 'eb6f7d555c498755bad6f6d523f0fe49907df83cce78f22cef6451ea5e80b0e8';
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const source = execFileSync('git', ['show', `${PIN}:${PIN_PATH}`], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 16 * 1024 * 1024,
});
const sourceDigest = createHash('sha256').update(source).digest('hex');
if (sourceDigest !== SOURCE_SHA256) {
  throw new Error(`zrodlo pinu nie zgadza sie z hashem: ${sourceDigest}`);
}
console.error('source sha256', sourceDigest);

const withoutExport = source.replace(/^export /gm, '');
const jsSrc = stripTypeScriptTypes(withoutExport, { mode: 'strip' }) + '\nreturn resolveAutoBatchPhase;';
const resolveAutoBatchPhase = new Function(jsSrc)();

// --- PRNG (mulberry32, ziarno 217) ---
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(217);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const ID_POOL = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const HP_POOL = [0, -0.5, 0.5, 1, 5, 12.5, 40, 100, -3, NaN, Infinity, -Infinity];
const COORD_POOL = [0, 1, 2, 3, 4, -1, 1.5, NaN, Infinity, -0];

const coord = () => (rnd() < 0.85 ? Math.floor(rnd() * 5) : pick(COORD_POOL));

function randomUnit() {
  const unit = {
    id: rnd() < 0.08 ? pick(['', 'a']) : pick(ID_POOL),
    side: rnd() < 0.5 ? 'atk' : 'def',
    q: coord(),
    r: coord(),
    dead: rnd() < 0.12,
    fadingOut: rnd() < 0.08,
    routed: rnd() < 0.1,
    removed: rnd() < 0.08,
    acted: rnd() < 0.15,
  };
  if (rnd() < 0.6) unit.hp = rnd() < 0.7 ? Math.floor(rnd() * 4) * 10 : pick(HP_POOL);
  if (rnd() < 0.3) unit.occupies = rnd() < 0.6;
  return unit;
}

function randomStep(from) {
  const roll = rnd();
  if (roll < 0.75) {
    // Ortogonalny sasiad (glowna sciezka).
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const [dc, dr] = pick(dirs);
    return { col: from.col + dc, row: from.row + dr };
  }
  if (roll < 0.85) {
    // Diagonala / teleport (zle dane zewnetrzne).
    return { col: Math.floor(rnd() * 6) - 1, row: Math.floor(rnd() * 6) - 1 };
  }
  if (roll < 0.9) return { col: pick(COORD_POOL), row: pick(COORD_POOL) };
  return { col: from.col, row: from.row }; // krok na miejsce (dlugosc 0)
}

function randomIntent(units) {
  const unitId = rnd() < 0.85 && units.length > 0 ? pick(units).id : pick(ID_POOL);
  const kindRoll = rnd();
  const kind = kindRoll < 0.35 ? 'move' : kindRoll < 0.6 ? 'attack' : kindRoll < 0.9 ? 'hold' : 'move';
  const intent = {
    unitId,
    side: rnd() < 0.85 ? 'atk' : 'def',
    kind,
    steps: [],
  };
  const origin = units.find((u) => u.id === unitId) ?? { q: coord(), r: coord() };
  let cur = { col: origin.q, row: origin.r };
  const nSteps = Math.floor(rnd() * 5);
  for (let i = 0; i < nSteps; i++) {
    const s = randomStep(cur);
    intent.steps.push(s);
    if (rnd() < 0.8) cur = s;
  }
  const tRoll = rnd();
  if (tRoll < 0.6) intent.targetId = pick(ID_POOL);
  else if (tRoll < 0.7) intent.targetId = '';
  else if (tRoll < 0.8) intent.targetId = 'zz';
  // w pozostalych 20% pole nieobecne (undefined)
  return intent;
}

// --- Przypadki losowe ---
const cases = [];
for (let k = 0; k < 2000; k++) {
  const phase = rnd() < 0.5 ? 'atk' : 'def';
  const nUnits = Math.floor(rnd() * 9);
  const units = Array.from({ length: nUnits }, randomUnit);
  const nIntents = Math.floor(rnd() * 9);
  const intents = Array.from({ length: nIntents }, () => randomIntent(units));
  // Czesc przypadkow: zamiar dla kazdej jednostki, by testowac sciezki ataku i ruchu.
  if (rnd() < 0.4) {
    for (const u of units) {
      if (rnd() < 0.7) intents.push(randomIntent([u]));
    }
  }
  const input = { phase, units, intents };
  const expected = resolveAutoBatchPhase(phase, units, intents);
  cases.push({ ...input, expect: expected });
}

// --- Przypadki ukierunkowane na sciezki ataku/ruchu (zywe cele, ortogonalne kroki) ---
for (let k = 0; k < 900; k++) {
  const phase = rnd() < 0.5 ? 'atk' : 'def';
  const nUnits = 2 + Math.floor(rnd() * 6);
  const units = Array.from({ length: nUnits }, (_, i) => ({
    id: ID_POOL[i],
    side: rnd() < 0.5 ? 'atk' : 'def',
    q: Math.floor(rnd() * 6),
    r: Math.floor(rnd() * 6),
    dead: false,
    fadingOut: false,
    routed: rnd() < 0.05,
    removed: false,
    acted: rnd() < 0.1,
  }));
  if (rnd() < 0.3) units[0].occupies = false;
  const intents = [];
  for (const unit of units) {
    if (rnd() < 0.2) continue;
    const enemies = units.filter((o) => o.side !== unit.side && o.id !== unit.id);
    const isAttack = rnd() < 0.5 && enemies.length > 0;
    const nSteps = Math.floor(rnd() * 4);
    const steps = [];
    let cur = { col: unit.q, row: unit.r };
    for (let i = 0; i < nSteps; i++) {
      const [dc, dr] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
      const s = { col: cur.col + dc, row: cur.row + dr };
      steps.push(s);
      cur = s;
    }
    const intent = { unitId: unit.id, side: unit.side, kind: isAttack ? 'attack' : (nSteps > 0 ? 'move' : 'hold'), steps };
    if (isAttack) intent.targetId = pick(enemies).id;
    intents.push(intent);
  }
  cases.push({ phase, units, intents, expect: resolveAutoBatchPhase(phase, units, intents) });
}

// --- Przypadki kierowane (krawedzie kontraktu) ---
const u = (id, side, q, r, extra = {}) => ({ id, side, q, r, dead: false, fadingOut: false, routed: false, removed: false, acted: false, ...extra });
const directed = [
  // duplikat zamiaru: ostatni wygrywa
  { phase: 'atk', units: [u('a', 'atk', 0, 0)], intents: [{ unitId: 'a', side: 'atk', kind: 'move', steps: [{ col: 1, row: 0 }] }, { unitId: 'a', side: 'atk', kind: 'hold', steps: [] }] },
  // bariera: zajety kafelek przez jednostke, ktora tez sie rusza
  { phase: 'atk', units: [u('a', 'atk', 0, 0), u('b', 'atk', 1, 0)], intents: [{ unitId: 'a', side: 'atk', kind: 'move', steps: [{ col: 1, row: 0 }] }, { unitId: 'b', side: 'atk', kind: 'move', steps: [{ col: 2, row: 0 }] }] },
  // kolizja dwoch sciezek na wolnym kafelku: pierwszy w rosterze wygrywa
  { phase: 'atk', units: [u('a', 'atk', 0, 0), u('b', 'atk', 2, 0)], intents: [{ unitId: 'a', side: 'atk', kind: 'move', steps: [{ col: 1, row: 0 }] }, { unitId: 'b', side: 'atk', kind: 'move', steps: [{ col: 1, row: 0 }] }] },
  // occupies:false zwalnia kafelek
  { phase: 'atk', units: [u('a', 'atk', 0, 0), u('x', 'def', 1, 0, { occupies: false })], intents: [{ unitId: 'a', side: 'atk', kind: 'move', steps: [{ col: 1, row: 0 }] }] },
  // atak na cel z innej strony, sciezka przechodzi
  { phase: 'atk', units: [u('a', 'atk', 0, 0), u('t', 'def', 2, 0)], intents: [{ unitId: 'a', side: 'atk', kind: 'attack', steps: [{ col: 1, row: 0 }], targetId: 't' }] },
  // atak: cel zniknal -> hold, blocked
  { phase: 'atk', units: [u('a', 'atk', 0, 0)], intents: [{ unitId: 'a', side: 'atk', kind: 'attack', steps: [{ col: 1, row: 0 }], targetId: 'nope' }] },
  // atak: cel tej samej strony
  { phase: 'atk', units: [u('a', 'atk', 0, 0), u('b', 'atk', 1, 0)], intents: [{ unitId: 'a', side: 'atk', kind: 'attack', steps: [], targetId: 'b' }] },
  // atak: sciezka zablokowana po czesci -> move z prefiksem
  { phase: 'def', units: [u('a', 'def', 0, 0), u('t', 'atk', 3, 3), u('w', 'def', 2, 0)], intents: [{ unitId: 'a', side: 'def', kind: 'attack', steps: [{ col: 1, row: 0 }, { col: 2, row: 0 }], targetId: 't' }] },
  // atak: sciezka zablokowana od pierwszego kroku -> hold
  { phase: 'def', units: [u('a', 'def', 0, 0), u('t', 'atk', 3, 3), u('w', 'def', 1, 0)], intents: [{ unitId: 'a', side: 'def', kind: 'attack', steps: [{ col: 1, row: 0 }], targetId: 't' }] },
  // ruch po przekatnej -> blokada bez krokow
  { phase: 'atk', units: [u('a', 'atk', 0, 0)], intents: [{ unitId: 'a', side: 'atk', kind: 'move', steps: [{ col: 1, row: 1 }] }] },
  // hold z krokami: kopiowane bez walidacji
  { phase: 'atk', units: [u('a', 'atk', 0, 0)], intents: [{ unitId: 'a', side: 'atk', kind: 'hold', steps: [{ col: 5, row: 5 }] }] },
  // hp: NaN / 0 / Infinity -> poza rosterem
  { phase: 'atk', units: [u('a', 'atk', 0, 0, { hp: NaN }), u('b', 'atk', 1, 0, { hp: 0 }), u('c', 'atk', 2, 0, { hp: Infinity }), u('d', 'atk', 3, 0, { hp: 3 })], intents: [] },
  // cel z pustym identyfikatorem
  { phase: 'atk', units: [u('a', 'atk', 0, 0), u('', 'def', 1, 0)], intents: [{ unitId: 'a', side: 'atk', kind: 'attack', steps: [], targetId: '' }] },
  // NaN wspolrzedne startu
  { phase: 'atk', units: [u('a', 'atk', NaN, 0)], intents: [{ unitId: 'a', side: 'atk', kind: 'move', steps: [{ col: 0, row: 0 }] }] },
];
for (const d of directed) {
  cases.push({ ...d, expect: resolveAutoBatchPhase(d.phase, d.units, d.intents) });
}

// JSON bez NaN/Infinity: wartosci nieskonczone jako napisy.
const jsonReplacer = (_k, v) => (typeof v === 'number' && !Number.isFinite(v) ? String(v) : v);

const outDir = join(dirname(fileURLToPath(import.meta.url)), 'p6_siege_tactics_autophase_vectors');
mkdirSync(outDir, { recursive: true });
const payload = {
  source: `gra/src/battle/autoBatchPhase.ts @ ${PIN} (resolveAutoBatchPhase, 64-190; wykonanie pliku pinu, bez zmian poza prefiksem export)`,
  generator: 'rust-port/engine/tests/p6_siege_tactics_autophase_gen.mjs (node ' + process.version + ', seed 217)',
  sourceSha256: sourceDigest,
  cases,
};
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(payload, jsonReplacer, 1) + '\n');
console.log('cases', cases.length);
