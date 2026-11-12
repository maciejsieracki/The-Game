// P6 SIEGE-TAKTYKA K5i-2a4 (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2A4-Q1): generator wektorow toCombatUnit i zaleznosci
// WYKONUJACY tekst pinu (pin 07d2fbd72). Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_inputs_unit_gen.mjs (Node 22)
// Wynik -> p6_siege_tactics_inputs_unit_vectors/vectors.json. Ziarno PRNG 5309 (mulberry32).
//
// Wykonywane zakresy pinu (linie 1-based, wlacznie), kazdy przez `new Function` po zdjeciu typow TS:
//   * battleScene.ts 1355-1378 toCombatUnit;
//   * combat.ts 148-152 combatNormField, 158-176 unitRowStat, 178-184 combatStatField, 194-234 combatUnitFromDef;
//   * veteran.ts 333-335 round4, 362-385 applyVeteranFracToCombatUnit;
//   * army-starvation.ts 26-28 round4, 35-52 applyArmyHungerStatMultToCombatUnit;
//   * gold-deficit.ts 172-174 round4, 182-199 applyGoldDeficitStatMultToCombatUnit;
//   * gra/data/units.json PINU (75 jednostek): SHA-256 calego pliku jest straznikiem; do wektorow trafiaja pola skalarne
//     (bez `Historia`, `Opis`, `Top3` - dlugie teksty/tablice, ktorych zadna z funkcji nie czyta).
// Nic nie jest przepisywane recznie. Straznik: SHA-256 zlaczonych fragmentow + straznik struktury (pierwsza/ostatnia linia).
//
// Kodowanie wartosci JS: ["n","<String(x)>"] liczba | ["s","..."] napis | ["z"] null | ["u"] undefined | ["b",true|false].
// Wejscia cywilizacji i trudnosci NIE sa argumentami toCombatUnit (pin: civ/trudnosc wchodza dopiero w skladaniu wejsc ciosu,
// patrz siege_tactics_inputs_pos/_wall); wariantami toCombatUnit sa: awans/weteran (veteranBonusFrac), glod armii, deficyt zlota,
// flagi skip*, mnozniki, hp, brak stats, brak `Jednostka`.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const FILES = {
  scene: 'gra/src/battle/battleScene.ts',
  combat: 'gra/src/game/combat.ts',
  veteran: 'gra/src/game/veteran.ts',
  hunger: 'gra/src/game/army-starvation.ts',
  gold: 'gra/src/game/gold-deficit.ts',
};
// [plik, od, do, pierwsza linia zawiera, ostatnia linia (trim)]
const R = {
  toCombatUnit: ['scene', 1355, 1378, 'function toCombatUnit(', '}'],
  normField: ['combat', 148, 152, 'export function combatNormField(', '}'],
  unitRowStat: ['combat', 158, 176, 'export function unitRowStat(', '}'],
  statField: ['combat', 178, 184, 'function combatStatField(', '}'],
  fromDef: ['combat', 194, 234, 'export function combatUnitFromDef(', '}'],
  vetRound4: ['veteran', 333, 335, 'function round4(', '}'],
  vetApply: ['veteran', 362, 385, 'export function applyVeteranFracToCombatUnit<', '}'],
  hunRound4: ['hunger', 26, 28, 'function round4(', '}'],
  hunApply: ['hunger', 35, 52, 'export function applyArmyHungerStatMultToCombatUnit(', '}'],
  golRound4: ['gold', 172, 174, 'function round4(', '}'],
  golApply: ['gold', 182, 199, 'export function applyGoldDeficitStatMultToCombatUnit(', '}'],
};
const FRAGMENT_SHA256 = 'd1b401a2275ab01569dd16ec1a6a3618ae56b592dd13c4f900b82b252755016c';
const UNITS_SHA256 = '7b509817d1c613a526ea0e8066a62f340f46a29fedd6f79f0c647195727bc6d7';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const gitShow = (path) => execFileSync('git', ['show', `${PIN}:${path}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const lines = Object.fromEntries(Object.entries(FILES).map(([k, p]) => [k, gitShow(p).split('\n')]));
const frag = {};
for (const [name, [file, a, b, first, last]] of Object.entries(R)) {
  const ls = lines[file].slice(a - 1, b);
  if (!ls[0].includes(first)) throw new Error(`pin: ${name} poczatek nie na ${a}: ${ls[0]}`);
  if (ls[ls.length - 1].trim() !== last) throw new Error(`pin: ${name} koniec nie na ${b}: ${ls[ls.length - 1]}`);
  frag[name] = ls.join('\n');
}
const digest = createHash('sha256')
  .update(Object.keys(frag).map((n) => `${n}\n${frag[n]}`).join('\n---\n'))
  .digest('hex');
if (FRAGMENT_SHA256 !== 'PLACEHOLDER' && digest !== FRAGMENT_SHA256) throw new Error(`SHA-256 fragmentow pinu zmieniony: ${digest}`);
console.error(`fragment sha256 = ${digest}`);
const unitsText = gitShow('gra/data/units.json');
const unitsDigest = createHash('sha256').update(unitsText).digest('hex');
if (UNITS_SHA256 !== 'PLACEHOLDER' && unitsDigest !== UNITS_SHA256) throw new Error(`SHA-256 units.json pinu zmieniony: ${unitsDigest}`);
console.error(`units.json sha256 = ${unitsDigest}`);
const units = JSON.parse(unitsText);
if (units.length < 75) throw new Error(`units.json: ${units.length} < 75 jednostek`);

// --- funkcje z tekstu pinu ---
const strip = (s) => stripTypeScriptTypes(s.replace(/^export /gm, ''));
const baseSrc = [frag.normField, frag.unitRowStat, frag.statField, frag.fromDef].map(strip).join('\n');
const fns = new Function(`${baseSrc}\nreturn { combatNormField, unitRowStat, combatStatField, combatUnitFromDef };`)();
const applyVeteran = new Function(`${strip(frag.vetRound4)}\n${strip(frag.vetApply)}\nreturn applyVeteranFracToCombatUnit;`)();
const applyHunger = new Function(`${strip(frag.hunRound4)}\n${strip(frag.hunApply)}\nreturn applyArmyHungerStatMultToCombatUnit;`)();
const applyGold = new Function(`${strip(frag.golRound4)}\n${strip(frag.golApply)}\nreturn applyGoldDeficitStatMultToCombatUnit;`)();
const toCombatUnit = new Function(
  'combatUnitFromDef', 'applyVeteranFracToCombatUnit', 'applyArmyHungerStatMultToCombatUnit', 'applyGoldDeficitStatMultToCombatUnit',
  `${strip(frag.toCombatUnit)}\nreturn toCombatUnit;`,
)(fns.combatUnitFromDef, applyVeteran, applyHunger, applyGold);

// --- PRNG ---
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
const rnd = mulberry32(5309);
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const chance = (p) => rnd() < p;

// --- kodowanie ---
const encNum = (x) => (Number.isNaN(x) ? 'NaN' : x === Infinity ? 'Infinity' : x === -Infinity ? '-Infinity' : Object.is(x, -0) ? '-0' : String(x));
const enc = (x) => {
  if (x === undefined) return ['u'];
  if (x === null) return ['z'];
  if (typeof x === 'number') return ['n', encNum(x)];
  if (typeof x === 'string') return ['s', x];
  if (typeof x === 'boolean') return ['b', x];
  throw new Error(`nieobslugiwany typ ${typeof x}`);
};
const encRecord = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, enc(v)]));

// Wiersze jednostek: tylko pola skalarne, bez dlugich tekstow.
const SKIP_KEYS = new Set(['Historia', 'Opis', 'Top3']);
const rows = units.map((u) => {
  const r = {};
  for (const [k, v] of Object.entries(u)) {
    if (SKIP_KEYS.has(k)) continue;
    if (v !== null && typeof v === 'object') continue;
    r[k] = v;
  }
  return r;
});

const NUMS = [0, -0, 1, 5, -3, 0.5, 0.25, 12.75, NaN, Infinity, -Infinity, 1e21, 1e-7, 123456.789, 2e9];
const STRS = ['---', '—', '', '  ', '12', '12px', 'abc', '0x10', '1e2', ' 7 ', 'Infinity', '-5.5', '.5', '3.', '1,5', '\t9\n', '-0'];
const anyScalar = () => (chance(0.5) ? pick(NUMS) : chance(0.7) ? pick(STRS) : pick([null, undefined]));
const textVal = () => pick(['Miecznik', 'Lucznik', '', 'Wręcz', 'Dystans', 12, 0, true, false, null, undefined, '---']);
const NUM_FIELDS = [
  'meleeAttack', 'meleeDefence', 'weaponDamage', 'armor', 'Pancerz', 'piercing', 'Przebicie', 'chargeBonus', 'Uderzenie', 'health', 'Health',
  'missileAttack', 'Próg dezercji (% health)', 'Prog dezercji (% health)', 'Kara obrony z flanki (%)', 'Kara obrony z tyłu (%)',
  'Kara obrony z tylu (%)', '__canonicalEffectiveMaxHp', '__canonicalCurrentHp',
];
const RAW_FIELDS = ['Zasięg ataku (hex)', 'Zasieg ataku (hex)', 'Ilość pocisków', 'Ilosc pociskow', 'Ruch w bitwie (heksy)'];
const TEXT_FIELDS = ['Jednostka', 'Typ', 'Rola (linia)', 'Super-jednostka'];

/** Mutuje kopie wiersza; zwraca {set, del} (undefined = usun klucz) do zapisu w wektorze. */
function mutate(row, intensity) {
  const set = {};
  const del = [];
  const n = int(0, intensity);
  for (let i = 0; i < n; i++) {
    const kind = rnd();
    if (kind < 0.55) {
      const k = pick(NUM_FIELDS);
      const v = anyScalar();
      if (v === undefined) del.push(k);
      else set[k] = v;
    } else if (kind < 0.75) {
      const k = pick(RAW_FIELDS);
      const v = chance(0.5) ? anyScalar() : pick(['---', 4, '5', null, true]);
      if (v === undefined) del.push(k);
      else set[k] = v;
    } else {
      const k = pick(TEXT_FIELDS);
      const v = textVal();
      if (v === undefined) del.push(k);
      else set[k] = v;
    }
  }
  const out = { ...row };
  for (const k of del) delete out[k];
  Object.assign(out, set);
  return { stats: out, set: encRecord(set), del };
}
const cases = [];
const push = (fn, input, expect) => cases.push({ id: `${fn}-${String(cases.length).padStart(4, '0')}`, fn, input, expect });

// Pelna lista pol CombatUnit (w tym te ustawiane na undefined) - test Rust porownuje kazde.
const CU_KEYS = [
  'typNazwa', 'counterTyp', 'rola', 'meleeAttack', 'meleeDefence', 'weaponDamage', 'armor', 'piercing', 'chargeBonus', 'health',
  'canonicalEffectiveMaxHp', 'canonicalCurrentHp', 'veteranHealthBonusFrac', 'Prog dezercji (% health)', 'missileAttack',
  'Zasieg ataku (hex)', 'Ilosc pociskow', 'Ruch w bitwie (heksy)', 'Kara obrony z flanki (%)', 'Kara obrony z tylu (%)', 'Super-jednostka',
];
const encCuFull = (cu) => Object.fromEntries(CU_KEYS.map((k) => [k, enc(cu[k])]));

// 1. combatNormField
for (let i = 0; i < 160; i++) {
  const v = chance(0.5) ? pick(NUMS) : chance(0.85) ? pick(STRS) : pick([null, undefined]);
  const fb = pick([0, 30, 0.25, 50, NaN, -1]);
  push('combatNormField', { v: enc(v), fallback: enc(fb) }, { v: enc(fns.combatNormField(v, fb)) });
}
// 2. unitRowStat
for (let i = 0; i < 160; i++) {
  const defNull = chance(0.08);
  const def = {};
  if (chance(0.7)) def.armor = anyScalar();
  if (chance(0.6)) def.Pancerz = anyScalar();
  for (const k of Object.keys(def)) if (def[k] === undefined) delete def[k];
  const legacy = chance(0.85) ? 'Pancerz' : undefined;
  const fb = pick([0, 3, NaN]);
  const d = defNull ? (chance(0.5) ? null : undefined) : def;
  push('unitRowStat', { def: defNull ? (d === null ? ['z'] : ['u']) : { o: encRecord(def) }, primary: 'armor', legacy: enc(legacy), fallback: enc(fb) },
    { v: enc(fns.unitRowStat(d, 'armor', legacy, fb)) });
}
// 3. combatStatField (dwa klucze)
for (let i = 0; i < 120; i++) {
  const s = {};
  if (chance(0.6)) s.a = anyScalar();
  if (chance(0.6)) s.b = anyScalar();
  for (const k of Object.keys(s)) if (s[k] === undefined) delete s[k];
  const got = fns.combatStatField(s, 'a', 'b');
  push('combatStatField', { s: encRecord(s) }, { v: enc(got) });
}

// 4. combatUnitFromDef: kazda jednostka pinu x 3 warianty opts + syntetyczne mutacje
const optVariants = [
  () => ({}),
  () => ({ typNazwa: pick(['Test', 'Wojownik', '', null, 7, true]), rola: pick(['Dystans', undefined, 'Flanka']), hp: pick([5, 0, undefined, NaN, 123.5, Infinity]) }),
  () => ({ typNazwa: undefined, rola: undefined, hp: pick([undefined, 17, 0.1]) }),
];
function fromDefCase(rowIdx, m, opts) {
  const stats = m ? m.stats : rows[rowIdx];
  const got = fns.combatUnitFromDef(stats, opts);
  push('combatUnitFromDef', {
    unit: rowIdx, set: m ? m.set : {}, del: m ? m.del : [],
    opts: { typNazwa: enc(opts.typNazwa), rola: enc(opts.rola), hp: enc(opts.hp) },
  }, { cu: encCuFull(got) });
}
for (let i = 0; i < rows.length; i++) {
  for (let v = 0; v < 3; v++) fromDefCase(i, null, optVariants[v]());
}
for (let i = 0; i < 240; i++) {
  const idx = int(0, rows.length - 1);
  fromDefCase(idx, mutate(rows[idx], 5), pick(optVariants)());
}
// celowane: `Health` (wielka litera) zamiast `health`, klucze ASCII zamiast z diakrytykami, brak/null/'---' w parach kluczy
for (let i = 0; i < 60; i++) {
  const idx = int(0, rows.length - 1);
  const set = {};
  const del = [];
  if (chance(0.7)) { del.push('health'); if (chance(0.8)) set.Health = pick([40, '55', 'abc', null, NaN, 0]); }
  if (chance(0.7)) { del.push('Zasi\u0119g ataku (hex)'); set['Zasieg ataku (hex)'] = pick([6, '8', 3, '---', null]); }
  if (chance(0.5)) { del.push('Ilo\u015b\u0107 pocisk\u00f3w'); set['Ilosc pociskow'] = pick([2, '4', '---', null]); }
  if (chance(0.5)) { del.push('Pr\u00f3g dezercji (% health)'); set['Prog dezercji (% health)'] = pick([0.3, '0.5', 'abc', null, 0]); }
  if (chance(0.5)) { del.push('Kara obrony z ty\u0142u (%)'); set['Kara obrony z tylu (%)'] = pick([60, '70', '---', null]); }
  const stats = { ...rows[idx] };
  for (const k of del) delete stats[k];
  for (const k of Object.keys(set)) if (set[k] === undefined) delete set[k];
  Object.assign(stats, set);
  fromDefCase(idx, { stats, set: encRecord(set), del }, pick(optVariants)());
}
// stats z niczego (pusty wiersz) i tylko pola z diakrytykami
fromDefCase(-1, { stats: {}, set: {}, del: [] }, {});
fromDefCase(-1, { stats: { 'Próg dezercji (% health)': 0.3, 'Kara obrony z tyłu (%)': '65', 'Zasięg ataku (hex)': 6 }, set: encRecord({ 'Próg dezercji (% health)': 0.3, 'Kara obrony z tyłu (%)': '65', 'Zasięg ataku (hex)': 6 }), del: [] }, {});

// pomocnik: CU z wiersza (do testow apply*)
const cuFromRow = (idx, m) => fns.combatUnitFromDef(m ? m.stats : rows[idx], {});
const FRACS = [0, -0, NaN, 0.1, 0.2, 0.3, 0.5, -0.1, -0.5, 1, 2, Infinity, -Infinity, 0.05, 1e-9];
const MULTS = [0.75, 0.5, 0.9, 0.1, 1, 0, -1, 1.5, 0.9999, NaN, Infinity, -Infinity, 1e-9, 0.3333333];

// 5. applyVeteranFracToCombatUnit
for (let i = 0; i < 260; i++) {
  const idx = int(0, rows.length - 1);
  const m = chance(0.5) ? mutate(rows[idx], 4) : null;
  const cu = cuFromRow(idx, m);
  // czesc przypadkow z juz ustawionym veteranHealthBonusFrac w wejsciu
  if (chance(0.15)) cu.veteranHealthBonusFrac = pick([0.1, 0.2, NaN]);
  const frac = chance(0.15) ? pick(FRACS) : pick([0, 0.1, 0.2, 0.3, 0.05, NaN, -0, 0.5]);
  push('applyVeteranFrac', { unit: idx, set: m ? m.set : {}, del: m ? m.del : [], vhbf: enc(cu.veteranHealthBonusFrac), frac: enc(frac) },
    { cu: encCuFull(applyVeteran(cu, frac)) });
}
// 6./7. glod armii i deficyt zlota
for (const [name, fn] of [['applyArmyHunger', applyHunger], ['applyGoldDeficit', applyGold]]) {
  for (let i = 0; i < 200; i++) {
    const idx = int(0, rows.length - 1);
    const m = chance(0.5) ? mutate(rows[idx], 4) : null;
    const cu = cuFromRow(idx, m);
    const mult = chance(0.3) ? pick(MULTS) : pick([0.75, 0.5, 0.9, 0.8]);
    push(name, { unit: idx, set: m ? m.set : {}, del: m ? m.del : [], mult: enc(mult) }, { cu: encCuFull(fn(cu, mult)) });
  }
}

// 8. toCombatUnit: kazda jednostka x 8 wariantow + syntetyczne
const hpPool = [undefined, undefined, null, 1, 0, 33.5, NaN, Infinity];
const fracPool = [undefined, null, 0, 0.1, 0.2, 0.3, NaN, -0.1, 0.5];
function tcuCase(rowIdx, m, bu, args) {
  const stats = bu.statsNull === 'null' ? null : bu.statsNull === 'undef' ? undefined : (m ? m.stats : rows[rowIdx]);
  const buObj = { stats, kategoria: bu.kategoria, hp: bu.hp, veteranBonusFrac: bu.veteranBonusFrac, armyHungry: bu.armyHungry, goldDeficit: bu.goldDeficit };
  const got = toCombatUnit(buObj, ...args);
  push('toCombatUnit', {
    unit: rowIdx, set: m ? m.set : {}, del: m ? m.del : [], statsNull: bu.statsNull ?? null,
    bu: { kategoria: bu.kategoria, hp: enc(bu.hp), veteranBonusFrac: enc(bu.veteranBonusFrac), armyHungry: bu.armyHungry, goldDeficit: bu.goldDeficit },
    args: args.map(enc),
  }, { cu: encCuFull(got) });
}
const argVariants = [
  [], [undefined, undefined, undefined, undefined], [0.5, true, 0.6, false], [0.9, false, 0.8, true], [0.75, true, 0.75, true], [1, false, 0, false], [NaN, false, NaN, false], [0.1],
];
for (let i = 0; i < rows.length; i++) {
  for (let v = 0; v < 8; v++) {
    const bu = {
      kategoria: pick(['Wrecz', 'Dystans', 'Konnica', 'Oblezenie']),
      hp: pick(hpPool), veteranBonusFrac: pick(fracPool),
      armyHungry: v >= 2 && chance(0.6), goldDeficit: v >= 3 && chance(0.6),
    };
    // wymus kazda kombinacje flag wariant po wariancie
    if (v === 2) { bu.armyHungry = true; bu.goldDeficit = false; }
    if (v === 3) { bu.armyHungry = false; bu.goldDeficit = true; }
    if (v === 4) { bu.armyHungry = true; bu.goldDeficit = true; }
    tcuCase(i, null, bu, argVariants[v]);
  }
}
for (let i = 0; i < 220; i++) {
  const idx = int(0, rows.length - 1);
  const m = mutate(rows[idx], 6);
  const bu = {
    kategoria: pick(['Wrecz', 'Dystans', '', 'Konnica']),
    hp: pick(hpPool), veteranBonusFrac: pick(fracPool),
    armyHungry: chance(0.5), goldDeficit: chance(0.5),
    statsNull: chance(0.05) ? pick(['null', 'undef']) : null,
  };
  tcuCase(idx, m, bu, pick(argVariants));
}

const out = {
  pin: PIN,
  fragmentSha256: digest,
  unitsSha256: unitsDigest,
  ranges: Object.fromEntries(Object.entries(R).map(([k, v]) => [k, v.slice(0, 3)])),
  note: 'Wektory generowane wykonaniem tekstu pinu; wartosci JS kodowane tagami [n|s|z|u|b, wartosc].',
  count: cases.length,
  unitCount: rows.length,
  units: rows,
  cases,
};
const dir = join(here, 'p6_siege_tactics_inputs_unit_vectors');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'vectors.json'), JSON.stringify(out) + '\n');
const byFn = {};
for (const c of cases) byFn[c.fn] = (byFn[c.fn] ?? 0) + 1;
console.error(`wrote ${cases.length} cases`, JSON.stringify(byFn));
