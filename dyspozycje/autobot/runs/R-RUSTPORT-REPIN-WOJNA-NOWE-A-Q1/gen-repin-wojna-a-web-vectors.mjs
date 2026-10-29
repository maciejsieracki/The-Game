// Generator wektorow REPIN-WOJNA-NOWE-A (r1) z URUCHOMIONEGO kodu weba (pin 91dc998a):
//   gra/src/battle/formationRules.ts, gra/src/game/army-leadership.ts,
//   gra/src/game/ai-era-unit-promotion.ts.
// Kod TS jest importowany BEZ ZMIAN (node --experimental-strip-types; te trzy pliki nie
// maja importow zewnetrznych). Zadnych stubow funkcji testowanych.
//
// Uruchomienie (WEB_ROOT = katalog z gra/src po `git archive 91dc998a gra/src gra/data`):
//   node --experimental-strip-types ./gen-repin-wojna-a-web-vectors.mjs <WEB_ROOT> <OUT_DIR>
//
// Wszystkie liczby sa zapisywane jako TEKST (String(x); "-0"; "NaN"; "Infinity"), zeby
// uniknac utraty ostatniego bitu w serde_json (zob. P6.1 r2).
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [webRoot, outDir] = process.argv.slice(2);
if (!webRoot || !outDir) throw new Error('uzycie: <WEB_ROOT> <OUT_DIR>');

const PIN = '91dc998a5f1b51ad29e0f4785edfd45655445c53';
const SOURCES = [
  'gra/src/battle/formationRules.ts',
  'gra/src/game/army-leadership.ts',
  'gra/src/game/ai-era-unit-promotion.ts',
];
const sha = (f) => createHash('sha256').update(readFileSync(join(webRoot, f))).digest('hex');
const meta = {
  pin: PIN,
  generator: 'gen-repin-wojna-a-web-vectors.mjs (r1)',
  node: process.version,
  sourceSha256: Object.fromEntries(SOURCES.map((f) => [f, sha(f)])),
};

// Liczby jako tekst (JS String); liczby calkowite tez, dla jednolitosci parsera w Rust.
const n = (x) => (x === null || x === undefined ? null : Object.is(x, -0) ? '-0' : String(x));

// Deterministyczny PRNG generatora (xorshift32) - NIE jest czescia testowanego kodu.
let rs = 0x2545f491;
const rnd = () => {
  rs ^= rs << 13; rs >>>= 0;
  rs ^= rs >>> 17;
  rs ^= rs << 5; rs >>>= 0;
  return rs / 4294967296;
};
const rndInt = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1)); // inclusive
const pick = (a) => a[Math.floor(rnd() * a.length)];

const formationMod = await import(pathToFileURL(join(webRoot, 'gra/src/battle/formationRules.ts')).href);
const armyMod = await import(pathToFileURL(join(webRoot, 'gra/src/game/army-leadership.ts')).href);
const promoMod = await import(pathToFileURL(join(webRoot, 'gra/src/game/ai-era-unit-promotion.ts')).href);
const { classifyInitialBattleRole, initialBattleFormation, initialBattleSlots, compactLineAllowsAdvance } = formationMod;
const { hasMilitaryAcademy, armyLeaderTitle, armyLeaderMoraleBonusFrac, moraleWithArmyLeaderBonus,
  armyMoraleRatioWithoutCommander, commandersToWithdrawAfterArmyBreak } = armyMod;
const { promoteAiUnitForEra } = promoMod;

// ---------- 1. formationRules.ts ----------
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
// Przypadki graniczne: kazda galaz i kazde dopasowanie regex/kategorii.
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

const ROLES = ['commander', 'mounted', 'melee', 'javelin', 'archer', 'slinger', 'ranged', 'siege'];
const GROUP_KEYS = ['infantry', 'javelins', 'archers', 'slingers', 'ranged', 'mounted', 'siege', 'commanders'];
const slotCases = [];
const pushSlotCase = (units, bounds) => {
  const formation = initialBattleFormation(units, (u) => u.role);
  const slots = initialBattleSlots(formation, bounds);
  const groups = Object.fromEntries(GROUP_KEYS.map((k) => [k, formation[k].map((u) => u.id)]));
  slotCases.push({
    units: units.map((u) => ({ id: u.id, role: u.role })),
    bounds: Object.fromEntries(Object.entries(bounds).map(([k, v]) => [k, n(v)])),
    groups,
    slots: slots.map((s) => [s.unit.id, n(s.row), n(s.rank)]),
  });
};
// Przypadki graniczne układu (zero jednostek, pojedyncze, szerokosc 0/0.5 -> min 1).
const mkUnits = (count, roleFn) => Array.from({ length: count }, (_, i) => ({ id: i, role: roleFn(i) }));
pushSlotCase([], { rankWidth: 5, midRow: 10, playRow0: 0, playRow1: 20 });
pushSlotCase(mkUnits(1, () => 'melee'), { rankWidth: 5, midRow: 10, playRow0: 0, playRow1: 20 });
pushSlotCase(mkUnits(12, () => 'melee'), { rankWidth: 0.5, midRow: 10, playRow0: 0, playRow1: 20 });
pushSlotCase(mkUnits(9, (i) => ROLES[i % 8]), { rankWidth: 0, midRow: 10, playRow0: 0, playRow1: 20 });
pushSlotCase(mkUnits(30, (i) => ROLES[i % 8]), { rankWidth: 4.9, midRow: 12, playRow0: 1, playRow1: 22 });
pushSlotCase(mkUnits(7, (i) => (i % 2 ? 'mounted' : 'melee')), { rankWidth: 2, midRow: 3, playRow0: 0, playRow1: 6 });
for (let i = 0; i < 400; i++) {
  const count = rndInt(0, 40);
  const width = pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 0.7, 2.99]);
  const midRow = rndInt(2, 30);
  const playRow0 = rndInt(0, midRow);
  const playRow1 = rndInt(midRow, midRow + 25);
  pushSlotCase(mkUnits(count, () => pick(ROLES)), { rankWidth: width, midRow, playRow0, playRow1 });
}

const compactCases = [];
for (const side of ['atk', 'def']) for (let c = -6; c <= 6; c++) for (let lm = -4; lm <= 4; lm++) {
  for (const prev of [null, -3, -2, -1, 0, 1, 2, 3]) {
    compactCases.push({
      side, candidateCol: n(c), lineMinimumProgress: n(lm), previousLineMinimumProgress: n(prev),
      out: compactLineAllowsAdvance({ side, candidateCol: c, lineMinimumProgress: lm, previousLineMinimumProgress: prev }),
    });
  }
}
const formationVectors = { ...meta, classifyCases: roleCases, slotCases, compactCases };

// ---------- 2. army-leadership.ts ----------
const BUILD_IDS = ['akademia_wojskowa', 'koszary', 'swiatynia', 'akademia', 'Akademia_wojskowa', ''];
const idLists = [[], ['koszary'], ['akademia'], ['akademia_wojskowa'], ['koszary', 'akademia_wojskowa'],
  ['akademia_wojskowa', 'akademia_wojskowa'], ['Akademia_wojskowa', 'swiatynia']];
for (let i = 0; i < 200; i++) idLists.push(Array.from({ length: rndInt(0, 4) }, () => pick(BUILD_IDS)));
const academyCases = idLists.map((ids) => ({
  ids, academy: hasMilitaryAcademy(ids), title: armyLeaderTitle(ids),
  bonus: n(armyLeaderMoraleBonusFrac(true, ids)),
  bonusAbsent: n(armyLeaderMoraleBonusFrac(false, ids)),
}));

const BASES = [-1, 0, 1, 2, 3, 7, 10, 10.5, 33, 100, 0.1, 149.97, 1e6, NaN, Infinity, -Infinity];
const BONUSES = [0, 0.1, 0.2, 0.05, 1.25, -0.5, NaN, Infinity, -Infinity, 0.333];
const moraleCases = [];
for (const b of BASES) for (const f of BONUSES) {
  moraleCases.push({ base: n(b), bonus: n(f), out: n(moraleWithArmyLeaderBonus(b, f)) });
}
for (let i = 0; i < 300; i++) {
  const b = rndInt(0, 400) + (rnd() < 0.3 ? rnd() : 0);
  const f = pick([0, 0.1, 0.2]);
  moraleCases.push({ base: n(b), bonus: n(f), out: n(moraleWithArmyLeaderBonus(b, f)) });
}

const unitState = (r) => ({
  isArmyCommander: r < 0.15,
  morale: rndInt(-2, 60) + (rnd() < 0.2 ? rnd() : 0),
  moraleMax: rndInt(0, 60) + (rnd() < 0.2 ? rnd() : 0),
  dead: rnd() < 0.1,
  fadingOut: rnd() < 0.1,
  routed: rnd() < 0.15,
});
const ratioCases = [];
const withdrawCases = [];
const pushArmy = (units, threshold) => {
  const plain = units.map((u) => ({
    isArmyCommander: !!u.isArmyCommander, morale: n(u.morale), moraleMax: n(u.moraleMax),
    dead: !!u.dead, fadingOut: !!u.fadingOut, routed: !!u.routed,
  }));
  ratioCases.push({ units: plain, out: n(armyMoraleRatioWithoutCommander(units)) });
  const idx = units.map((u, i) => i);
  const withdrawn = commandersToWithdrawAfterArmyBreak(units.map((u, i) => ({ ...u, _i: i })), threshold).map((u) => u._i);
  withdrawCases.push({ units: plain, threshold: n(threshold), outIndices: withdrawn, _n: idx.length });
};
pushArmy([], 0.5);
pushArmy([{ isArmyCommander: true, morale: 5, moraleMax: 0 }], 0.5);
pushArmy([{ morale: 0, moraleMax: 0 }], 0.5);
pushArmy([{ morale: 3, moraleMax: 10 }, { isArmyCommander: true, morale: 1, moraleMax: 9 }], 0.3);
for (let i = 0; i < 1200; i++) {
  const k = rndInt(0, 6);
  const units = Array.from({ length: k }, () => unitState(rnd()));
  pushArmy(units, pick([0, 0.25, 0.5, 0.75, 1, 0.3333333333333333]));
}
const armyVectors = {
  ...meta,
  academyCases,
  moraleCases,
  ratioCases,
  withdrawCases: withdrawCases.map(({ _n, ...rest }) => rest),
};

// ---------- 3. ai-era-unit-promotion.ts ----------
// Katalog definicji jednostek (deterministyczny, zrodlo w generatorze - dane testowe).
const catalog = [
  { Jednostka: 'piechota_kamien', Epoka: 1, Typ: 'piechota', 'Rola (linia)': 'piechota', cost: 10, maxHp: 10, category: 'piechota' },
  { Jednostka: 'piechota_braz', Epoka: 2, Typ: 'piechota', 'Rola (linia)': 'piechota', cost: 14, maxHp: 14, category: 'piechota' },
  { Jednostka: 'piechota_zelazo', Epoka: 3, Typ: 'piechota', 'Rola (linia)': 'piechota', cost: 25, maxHp: 18, category: 'piechota' },
  { Jednostka: 'lucznik_kamien', Epoka: 1, Typ: 'lucznik', 'Rola (linia)': 'lucznik', cost: 12, maxHp: 8, category: 'lucznik' },
  { Jednostka: 'lucznik_braz', Epoka: 2, Typ: 'lucznik', 'Rola (linia)': 'lucznik', cost: 12, maxHp: 9, category: 'lucznik' },
  { Jednostka: 'konnica_braz', Epoka: 2, Typ: 'konnica', 'Rola (linia)': 'konnica', cost: 30, maxHp: 20, category: 'konnica' },
  { Jednostka: 'konnica_zelazo', Epoka: 3, Typ: 'konnica', 'Rola (linia)': 'konnica', cost: 40, maxHp: 24, category: 'konnica' },
  { Jednostka: 'bez_typu', Epoka: 1, Typ: '   ', 'Rola (linia)': 'piechota', cost: 5, maxHp: 5, category: 'x' },
  { Jednostka: 'stara_zelazo', Epoka: 3, Typ: 'piechota', 'Rola (linia)': 'stara', cost: 9, maxHp: 9, category: 'piechota' },
  { Jednostka: 'rownorzedna_zelazo', Epoka: 3, Typ: 'piechota', 'Rola (linia)': 'piechota', cost: 20, maxHp: 20, category: 'piechota' },
];
const byId = (id) => catalog.find((c) => c.Jednostka === id) ?? null;
const cloneCatalogEntry = (c) => (c ? { ...c } : null);

// Deps budowane z katalogu - ta sama logika w tescie Rust (adapter testowy).
function makeDeps(state) {
  return {
    oldDefinition: (unit) => cloneCatalogEntry(byId(unit.typeId)),
    candidates: (unit) => {
      const old = byId(unit.typeId);
      if (!old) return [];
      return catalog.filter((c) => c['Rola (linia)'] === old['Rola (linia)']).map(cloneCatalogEntry);
    },
    newestSameRole: (unit, cands) => {
      let best = null;
      for (const c of cands) if (!best || c.Epoka > best.Epoka) best = c;
      return best;
    },
    epochNumber: (e) => (e === null || e === undefined ? NaN : Number(e)),
    unitCost: (id) => byId(id)?.cost ?? 0,
    currentTreasury: () => state.treasury,
    setTreasury: (v) => { state.treasury = v; },
    oldMaxHp: (unit, def) => def.maxHp,
    newMaxHp: (target) => target.maxHp,
    category: (target) => target.category,
  };
}

const promoCases = [];
const pushPromo = (unitIn, treasury, twice = false) => {
  const state = { treasury };
  const unit = { ...unitIn };
  const deps = makeDeps(state);
  const ret1 = promoteAiUnitForEra(unit, deps);
  let ret2 = null;
  if (twice) ret2 = promoteAiUnitForEra(unit, deps);
  promoCases.push({
    unitIn: encodeUnit(unitIn),
    treasury: n(treasury),
    twice,
    ret: ret1,
    ret2,
    unitOut: encodeUnit(unit),
    treasuryOut: n(state.treasury),
  });
};
function encodeUnit(u) {
  return {
    typeId: u.typeId,
    category: u.category ?? null,
    hp: u.hp === undefined ? 'undef' : n(u.hp),
    hpMax: u.hpMax === undefined ? 'undef' : n(u.hpMax),
    ruchLeft: u.ruchLeft === undefined ? 'undef' : n(u.ruchLeft),
    replaceUsedThisTurn: u.replaceUsedThisTurn ?? false,
  };
}
const TYPE_IDS = [...catalog.map((c) => c.Jednostka), 'nieznana'];
pushPromo({ typeId: 'piechota_kamien', category: 'piechota', hp: 10, hpMax: 10, ruchLeft: 2 }, 100);
pushPromo({ typeId: 'piechota_kamien', category: 'piechota', hp: 5, hpMax: 10, ruchLeft: 2 }, 100, true);
pushPromo({ typeId: 'piechota_kamien', category: 'piechota', hp: 10, hpMax: 10 }, 0);
pushPromo({ typeId: 'piechota_kamien', category: 'piechota', hp: 10, hpMax: 10 }, 15); // surcharge 15 > 0 treasury? (15 exact)
pushPromo({ typeId: 'piechota_kamien', category: 'piechota', hp: 10, hpMax: 10 }, 14.5);
pushPromo({ typeId: 'lucznik_kamien', category: 'lucznik', hp: null, hpMax: 8 }, 50);
pushPromo({ typeId: 'lucznik_kamien', category: 'lucznik', hpMax: 8 }, 50);
pushPromo({ typeId: 'lucznik_braz', replaceUsedThisTurn: true, hp: 9, hpMax: 9 }, 999);
pushPromo({ typeId: 'bez_typu', hp: 5, hpMax: 5 }, 999);
pushPromo({ typeId: 'stara_zelazo', hp: 9, hpMax: 9 }, 999);
pushPromo({ typeId: 'nieznana', hp: 3, hpMax: 3 }, 999);
pushPromo({ typeId: 'konnica_braz', hp: 1, hpMax: 20 }, 1000);
pushPromo({ typeId: 'konnica_braz', hp: 20, hpMax: 20, ruchLeft: 3 }, 25);
for (let i = 0; i < 600; i++) {
  const id = pick(TYPE_IDS);
  const def = byId(id);
  const maxHp = def ? def.maxHp : rndInt(1, 30);
  const u = { typeId: id, category: rnd() < 0.5 ? (def ? def.category : 'x') : undefined,
    hp: rnd() < 0.2 ? null : (rnd() < 0.1 ? undefined : rndInt(0, maxHp + 3)),
    hpMax: rnd() < 0.8 ? maxHp : rndInt(0, 30),
    ruchLeft: rnd() < 0.5 ? rndInt(0, 4) : undefined,
    replaceUsedThisTurn: rnd() < 0.1 };
  pushPromo(u, rndInt(0, 60), rnd() < 0.3);
}
const promotionVectors = { ...meta, catalog: catalog.map((c) => ({ ...c, Epoka: n(c.Epoka), cost: n(c.cost), maxHp: n(c.maxHp) })), cases: promoCases };

// ---------- zapis ----------
mkdirSync(outDir, { recursive: true });
const write = (name, obj) => writeFileSync(join(outDir, name), JSON.stringify(obj, null, 1) + '\n');
write('formation-rules.json', formationVectors);
write('army-leadership.json', armyVectors);
write('ai-era-unit-promotion.json', promotionVectors);
console.log(JSON.stringify({
  classify: roleCases.length, slots: slotCases.length, compact: compactCases.length,
  academy: academyCases.length, morale: moraleCases.length, ratio: ratioCases.length,
  withdraw: withdrawCases.length, promo: promoCases.length,
}));
