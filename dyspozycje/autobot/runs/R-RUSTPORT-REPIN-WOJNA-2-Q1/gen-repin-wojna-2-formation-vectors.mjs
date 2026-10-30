// Generator wektorow REPIN-WOJNA-2 (U1, formationRules.ts) z URUCHOMIONEGO kodu weba (pin dc8a3adc).
// Zrodlo: gra/src/battle/formationRules.ts (importowane BEZ ZMIAN, node --experimental-strip-types).
// Zmiana wzgledem gen-repin-wojna-a-web-vectors.mjs (r1, pin 91dc998a): sekcja formationRules
// tylko; dodane przypadki meleeLines/archerLines (1|2|3|brak) i nowe klucze compact
// (lineReferenceProgress / previousLineReferenceProgress). Sekcje army-leadership i
// ai-era-unit-promotion NIE zmienily sie miedzy pinami (git diff 91dc998a dc8a3adc: pusty) - nie regenerowane.
//
// Uruchomienie: node --experimental-strip-types ./gen-repin-wojna-2-formation-vectors.mjs <WEB_ROOT> <OUT_FILE>
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [webRoot, outFile] = process.argv.slice(2);
if (!webRoot || !outFile) throw new Error('uzycie: <WEB_ROOT> <OUT_FILE>');

const PIN = 'dc8a3adc989bc82aab2cde6bb747c883f949fc1a';
const SRC = 'gra/src/battle/formationRules.ts';
const meta = {
  pin: PIN,
  generator: 'gen-repin-wojna-2-formation-vectors.mjs (U1 r1)',
  node: process.version,
  sourceSha256: { [SRC]: createHash('sha256').update(readFileSync(join(webRoot, SRC))).digest('hex') },
};

const n = (x) => (x === null || x === undefined ? null : Object.is(x, -0) ? '-0' : String(x));

let rs = 0x2545f491;
const rnd = () => {
  rs ^= rs << 13; rs >>>= 0;
  rs ^= rs >>> 17;
  rs ^= rs << 5; rs >>>= 0;
  return rs / 4294967296;
};
const rndInt = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (a) => a[Math.floor(rnd() * a.length)];

const { classifyInitialBattleRole, initialBattleFormation, initialBattleSlots, compactLineAllowsAdvance } =
  await import(pathToFileURL(join(webRoot, SRC)).href);

// ---------- 1. classify (bez zmian wzgledem r1) ----------
const CATEGORIES = ['', 'konnica', 'rydwan', 'oszczepnik', 'lucznik', 'procarz', 'piechota', 'Łucznik',
  'Oszczepnik', 'Konnica', 'Rydwan', 'Jeździec', 'Włócznik', 'Kusznik', 'Procarz', 'Taran', 'Żołnierz', 'Wódz'];
const NAMES = ['', 'Konnica lekka', 'Rydwan bojowy', 'Jazdy ciężkiej', 'Jezdziec', 'Kawalerzysta', 'Taran',
  'Katapulta', 'Wieża oblężnicza', 'Oszczepnik', 'Atlatl', 'Estolic', 'Łucznik', 'Kusznik', 'Procarz',
  'Miecznik', 'Włócznik', 'Chariot', 'Cavalry', 'Battering ram', 'Siege tower', 'Archer', 'Slinger',
  'Javelin thrower', 'Phalanx', 'Ćwiczenia', 'Horse archer', 'Konnica ciężka', 'Trebusz'];
const TYPES = ['', 'siege', 'Siege', 'infantry', 'ranged'];
const roleCases = [];
const pushRole = (inp) => roleCases.push({
  in: { commander: inp.commander ?? false, category: inp.category ?? null, name: inp.name ?? null,
    type: inp.type ?? null, primaryRanged: inp.primaryRanged ?? false },
  out: classifyInitialBattleRole(inp),
});
for (const c of CATEGORIES) for (const nm of NAMES) pushRole({ category: c, name: nm });
for (const t of TYPES) pushRole({ type: t, name: 'Taran' });
for (const pr of [false, true]) for (const cm of [false, true]) pushRole({ commander: cm, primaryRanged: pr, name: 'Wódz' });
for (let i = 0; i < 1500; i++) {
  pushRole({
    commander: rnd() < 0.1,
    category: rnd() < 0.5 ? pick(CATEGORIES) : undefined,
    name: rnd() < 0.7 ? pick(NAMES) : undefined,
    type: rnd() < 0.3 ? pick(TYPES) : undefined,
    primaryRanged: rnd() < 0.3,
  });
}

// ---------- 2. initialBattleSlots (pin dc8a3adc: meleeLines/archerLines) ----------
const ROLES = ['commander', 'mounted', 'melee', 'javelin', 'archer', 'slinger', 'ranged', 'siege'];
const GROUP_KEYS = ['infantry', 'javelins', 'archers', 'slingers', 'ranged', 'mounted', 'siege', 'commanders'];
const LINES = [undefined, 1, 2, 3];
const slotCases = [];
const pushSlotCase = (units, bounds) => {
  const formation = initialBattleFormation(units, (u) => u.role);
  const slots = initialBattleSlots(formation, bounds);
  const groups = Object.fromEntries(GROUP_KEYS.map((k) => [k, formation[k].map((u) => u.id)]));
  slotCases.push({
    units: units.map((u) => ({ id: u.id, role: u.role })),
    bounds: {
      rankWidth: n(bounds.rankWidth), midRow: n(bounds.midRow), playRow0: n(bounds.playRow0), playRow1: n(bounds.playRow1),
      meleeLines: n(bounds.meleeLines ?? null), archerLines: n(bounds.archerLines ?? null),
    },
    groups,
    slots: slots.map((s) => [s.unit.id, n(s.row), n(s.rank)]),
  });
};
const mkUnits = (count, roleFn) => Array.from({ length: count }, (_, i) => ({ id: i, role: roleFn(i) }));
const B = (rankWidth, midRow, playRow0, playRow1, meleeLines, archerLines) =>
  ({ rankWidth, midRow, playRow0, playRow1, meleeLines, archerLines });
pushSlotCase([], B(5, 10, 0, 20));
pushSlotCase(mkUnits(1, () => 'melee'), B(5, 10, 0, 20));
pushSlotCase(mkUnits(12, () => 'melee'), B(0.5, 10, 0, 20));
pushSlotCase(mkUnits(9, (i) => ROLES[i % 8]), B(0, 10, 0, 20));
pushSlotCase(mkUnits(30, (i) => ROLES[i % 8]), B(4.9, 12, 1, 22));
pushSlotCase(mkUnits(7, (i) => (i % 2 ? 'mounted' : 'melee')), B(2, 3, 0, 6));
pushSlotCase(mkUnits(1, () => 'mounted'), B(5, 10, 0, 20));
pushSlotCase(mkUnits(5, () => 'mounted'), B(5, 10, 0, 20));
pushSlotCase(mkUnits(14, (i) => (i < 6 ? 'melee' : 'mounted')), B(4, 10, 0, 20, 1, undefined));
pushSlotCase(mkUnits(14, (i) => (i < 6 ? 'melee' : 'mounted')), B(4, 10, 0, 20, 3, undefined));
pushSlotCase(mkUnits(20, (i) => (i < 9 ? 'javelin' : i < 15 ? 'archer' : 'mounted')), B(4, 10, 0, 20, 2, 3));
for (let i = 0; i < 700; i++) {
  const count = rndInt(0, 40);
  const width = pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 0.7, 2.99]);
  const midRow = rndInt(2, 30);
  const playRow0 = rndInt(0, midRow);
  const playRow1 = rndInt(midRow, midRow + 25);
  const meleeLines = pick(LINES);
  const archerLines = pick(LINES);
  const roles = (j) => (rnd() < 0.5 ? pick(ROLES) : ROLES[j % 8]);
  pushSlotCase(mkUnits(count, roles), B(width, midRow, playRow0, playRow1, meleeLines, archerLines));
}

// ---------- 3. compactLineAllowsAdvance (pin dc8a3adc: lineReferenceProgress) ----------
const compactCases = [];
for (const side of ['atk', 'def']) for (let c = -6; c <= 6; c++) for (let lm = -4; lm <= 4; lm++) {
  for (const prev of [null, -3, -2, -1, 0, 1, 2, 3]) {
    compactCases.push({
      side, candidateCol: n(c), lineReferenceProgress: n(lm), previousLineReferenceProgress: n(prev),
      out: compactLineAllowsAdvance({ side, candidateCol: c, lineReferenceProgress: lm, previousLineReferenceProgress: prev }),
    });
  }
}

writeFileSync(outFile, JSON.stringify({ ...meta, classifyCases: roleCases, slotCases, compactCases }, null, 1) + '\n');
console.log(JSON.stringify({ classify: roleCases.length, slots: slotCases.length, compact: compactCases.length }));
