// P6 SIEGE-TAKTYKA K5i-2b (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2B-Q1): generator wektorow end-to-end `_singleBlow`.
// Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_blow_full_gen.mjs (Node 22)
// Wynik -> p6_siege_tactics_blow_full_vectors/vectors.json. Ziarno PRNG 2201 (mulberry32).
//
// ZASADA: CALE cialo `_singleBlow` (battleScene.ts:8812-9010, wlacznie z `return this._resolveBlowOutcome(...)`)
// jest WYKONYWANE z tekstu pinu (pin 07d2fbd72) przez `new Function`, po zdjeciu typow TypeScript
// (module.stripTypeScriptTypes). Wykonywane tez (tekst pinu, bez zmian): helpery combat.ts 440-517
// (hitChanceTw, damageTw, rangeDamageTw, rangeDamage, baseDamage), rangedShotAccuracy (combat.ts:476-478),
// flankRearDefensePenalty (combat.ts:589-606), rangedDamageMultFor (unit-power.ts:26-32),
// applyMultiplier (civ-bonuses.ts:229-231), fieldFortifyDefenseBonus (city-defense.ts:237-245).
//
// STUBY (wyjscia liczone poza zakresem K5I-2b, podawane z wektora; kazdy stub zapisuje wywolanie do `OUT`):
//   toCombatUnit (K5I2a4), relativeHit (inputs_pos), battleUnitCivBonusy / civCombatStatMultipliers /
//   mergeBuildingBonusIntoStatMultipliers (civ), civWallDefenseMultiplier (civ), battleUnitDifficultyCombatMult,
//   counterMultiplier (combat.ts; tabela counters poza zakresem), bracesAgainstCharge (battleScene.ts:1571),
//   isFordTile / isShoreAdjacentToFord (mapa), terrainMap.combatTerrainName, terrainRiverAttackMultiplier
//   (wejscie logiczne: nazwa kafla 'Rzeka' + wiersz rzeki w danych), terrainDefenseMultiplier,
//   cityGatedTerrainMultiplier, this._wallBonusProcFor.
// Scena: `this` = stub (log, engaged = prawdziwy Set, _sfxMelee/_updateHpBar/_resolveBlowOutcome = spy).
// Rzut: `Math` w tekscie pinu = obiekt z `random()` zwracajacym wartosc wektora u (roll = u*100 jak w pinie).
//
// Straznik: SHA-256 zlaczonych fragmentow pinu (po zdjeciu typow). Zmiana pinu -> blad zamiast cichych wektorow.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const SCENE = 'gra/src/battle/battleScene.ts';
const COMBAT = 'gra/src/game/combat.ts';
const CITY = 'gra/src/game/city-defense.ts';
const UNIT_POWER = 'gra/src/game/unit-power.ts';
const CIV = 'gra/src/game/civ-bonuses.ts';
const PARAMS = 'gra/data/combat-params.json';
const BODY_FROM = 8812;
const BODY_TO = 9010;
const FRAGMENT_SHA256 = 'b2f9e19f1e35644e0e2ea636a9d50a02dd10d729355de5eb3eb35668910e5526';
const N_CASES = 1200;
const SEED = 2201;

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const gitShow = (path) => execFileSync('git', ['show', `${PIN}:${path}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const lines = Object.fromEntries([SCENE, COMBAT, CITY, UNIT_POWER, CIV].map((p) => [p, gitShow(p).split('\n')]));
const params = JSON.parse(gitShow(PARAMS));
const pinRange = (file, a, b) => lines[file].slice(a - 1, b).join('\n');

// Strazniki zakresow (blad zamiast cichego przesuniecia linii w pinie).
const expectLine = (file, n, needle) => {
  if (!lines[file][n - 1].includes(needle)) throw new Error(`pin ${file}:${n} nie zawiera "${needle}"`);
};
expectLine(SCENE, BODY_FROM, 'if (!ranged) this._sfxMelee();');
expectLine(SCENE, BODY_TO, 'return this._resolveBlowOutcome(attacker, defender, dmg, extraMorale);');
if (lines[SCENE][BODY_TO] !== '  }') throw new Error('pin: koniec _singleBlow nie na 9011');
expectLine(COMBAT, 440, 'export function hitChanceTw(');
expectLine(COMBAT, 476, 'export function rangedShotAccuracy(');
expectLine(COMBAT, 589, 'export function flankRearDefensePenalty(');
expectLine(UNIT_POWER, 26, 'export function rangedDamageMultFor(');
expectLine(CIV, 229, 'export function applyMultiplier(');
expectLine(CITY, 237, 'export function fieldFortifyDefenseBonus(');

// Zakres funkcji = od linii startowej do pierwszej linii '}' (bez wciecia) - sprawdzane.
const fnRange = (file, start) => {
  let end = start;
  while (lines[file][end - 1] !== '}') end += 1;
  return [start, end];
};
const [flankA, flankB] = fnRange(COMBAT, 589);
const [rdmA, rdmB] = fnRange(UNIT_POWER, 26);
const [applyA, applyB] = fnRange(CIV, 229);
const [fortA, fortB] = fnRange(CITY, 237);
const [rsaA, rsaB] = fnRange(COMBAT, 476);

const RANGES = {
  body: [BODY_FROM, BODY_TO],
  helpers: [440, 517],
  rangedShot: [rsaA, rsaB],
  flank: [flankA, flankB],
  rdm: [rdmA, rdmB],
  apply: [applyA, applyB],
  fortify: [fortA, fortB],
};
const consts = { // stale z pinu: battleScene.ts:1115, 1137-1140, 982-986 (BROD, FORTIFY)
  MORALE_HIT_LOSS_SCALE: 100, MORALE_FLANK_HIT: 8, MORALE_REAR_HIT: 15, MORALE_CHARGE_HIT: 15, MORALE_KILL_GAIN: 6,
};
expectLine(SCENE, 1115, 'MORALE_HIT_LOSS_SCALE');
expectLine(SCENE, 1137, 'MORALE_FLANK_HIT');
expectLine(SCENE, 1138, 'MORALE_REAR_HIT');
expectLine(SCENE, 1139, 'MORALE_CHARGE_HIT');
expectLine(SCENE, 1140, 'MORALE_KILL_GAIN');
const BROD = params.brod;
const FORTIFY = params['oblężenie'].fortify_obrona_proc;
const RANGED_MULT = params.ranged_damage_mult;
const RIVER_MULT = params.river_attack_mult;
const TW = params.tw_v3;

const textFragments = {
  body: pinRange(SCENE, ...RANGES.body),
  helpers: pinRange(COMBAT, ...RANGES.helpers),
  rangedShot: pinRange(COMBAT, ...RANGES.rangedShot),
  flank: pinRange(COMBAT, ...RANGES.flank),
  rdm: pinRange(UNIT_POWER, ...RANGES.rdm),
  apply: pinRange(CIV, ...RANGES.apply),
  fortify: pinRange(CITY, ...RANGES.fortify),
};
const digest = createHash('sha256')
  .update(Object.keys(textFragments).map((n) => `${n}\n${textFragments[n]}`).join('\n---\n'))
  .update(`\nconsts\n${JSON.stringify(consts)}\nbrod\n${JSON.stringify(BROD)}\nfortify\n${FORTIFY}\nranged\n${JSON.stringify(RANGED_MULT)}\nriver\n${RIVER_MULT}\ntw\n${JSON.stringify(TW)}`)
  .digest('hex');
if (FRAGMENT_SHA256 !== 'PLACEHOLDER' && digest !== FRAGMENT_SHA256) {
  throw new Error(`SHA-256 fragmentow pinu zmieniony: ${digest}`);
}
console.error(`fragment sha256 = ${digest}`);

// --- Helpery z pinu (wykonane tekstem pinu) ---
const helperCode = stripTypeScriptTypes(textFragments.helpers.replace(/^export /gm, ''));
const helperFns = new Function('TW', `${helperCode}\nreturn { hitChanceTw, damageTw, rangeDamageTw, rangeDamage, baseDamage };`)({
  hit_base: TW.hit_base, hit_min: TW.hit_min, hit_max: TW.hit_max,
});
const realRangedShot = new Function(`${stripTypeScriptTypes(textFragments.rangedShot.replace(/^export /gm, ''))}\nreturn rangedShotAccuracy;`)();
const realFlank = new Function(`${stripTypeScriptTypes(textFragments.flank.replace(/^export /gm, ''))}\nreturn flankRearDefensePenalty;`)();
const realRdm = new Function('RANGED_DAMAGE_MULT', `${stripTypeScriptTypes(textFragments.rdm.replace(/^export /gm, ''))}\nreturn rangedDamageMultFor;`)(RANGED_MULT);
const realApply = new Function(`${stripTypeScriptTypes(textFragments.apply.replace(/^export /gm, ''))}\nreturn applyMultiplier;`)();
const realFortify = new Function(`${stripTypeScriptTypes(textFragments.fortify.replace(/^export /gm, ''))}\nreturn fieldFortifyDefenseBonus;`)();

// --- Stan pojedynczego przypadku (ustawiany przed kazdym wywolaniem) ---
let C = null; // dane przypadku
let OUT = null; // obserwacje wywolan

const bodyParams = [
  'toCombatUnit', 'relativeHit', 'battleUnitCivBonusy', 'civCombatStatMultipliers',
  'mergeBuildingBonusIntoStatMultipliers', 'fieldFortifyDefenseBonus', 'applyMultiplier',
  'battleUnitDifficultyCombatMult', 'civWallDefenseMultiplier', 'rangedShotAccuracy', 'counterMultiplier',
  'hitChanceTw', 'rangeDamage', 'baseDamage', 'rangedDamageMultFor', 'bracesAgainstCharge', 'isFordTile',
  'isShoreAdjacentToFord', 'terrainRiverAttackMultiplier', 'terrainDefenseMultiplier',
  'cityGatedTerrainMultiplier', 'flankRearDefensePenalty', 'FORTIFY_OBRONA_PROC_FIELD', 'BROD_KARA_OBRONA',
  'BROD_BONUS_BRZEG', 'MORALE_HIT_LOSS_SCALE', 'MORALE_FLANK_HIT', 'MORALE_REAR_HIT', 'MORALE_CHARGE_HIT',
  'MORALE_KILL_GAIN', 'Math',
];
const bodySrc = stripTypeScriptTypes(
  `function __singleBlow(attacker, defender, ranged) {\n${textFragments.body}\n}`,
);
const singleBlowFactory = new Function(...bodyParams, `${bodySrc}\nreturn __singleBlow;`);

const MathStub = { random: () => C.u, max: Math.max, min: Math.min, round: Math.round, floor: Math.floor };
const stubs = {
  toCombatUnit: (bu) => (bu.id === 'A' ? C.cuA : C.cuD),
  relativeHit: () => { OUT.relativeHit = C.hitArc; return C.hitArc; },
  battleUnitCivBonusy: (bu, list) => list,
  civCombatStatMultipliers: (bonusy, cu, opts) => (opts.side === 'attacker' ? C.atkMods : C.defMods),
  mergeBuildingBonusIntoStatMultipliers: (mods) => mods,
  fieldFortifyDefenseBonus: realFortify,
  applyMultiplier: realApply,
  battleUnitDifficultyCombatMult: (bu) => (bu.id === 'A' ? C.diffA : C.diffD),
  civWallDefenseMultiplier: () => C.wallCiv,
  rangedShotAccuracy: realRangedShot,
  counterMultiplier: () => C.ctr,
  hitChanceTw: (...args) => {
    OUT.hitArgs = args.map(encodeNum);
    const r = helperFns.hitChanceTw(...args);
    OUT.hitRet = r;
    return r;
  },
  rangeDamage: (...args) => {
    OUT.rangeArgs = args.map(encodeNum);
    return helperFns.rangeDamage(...args);
  },
  baseDamage: (...args) => {
    OUT.baseArgs = args;
    return helperFns.baseDamage(...args);
  },
  rangedDamageMultFor: (o) => {
    const r = realRdm(o);
    OUT.rdm = r;
    OUT.rdmTyp = o.Typ;
    OUT.rdmJedn = o.Jednostka;
    return r;
  },
  bracesAgainstCharge: () => { OUT.bracesCalled = true; return C.braces; },
  isFordTile: (tm, q, r) => (q === C.attacker.q && r === C.attacker.r ? C.atkFord : C.defFord),
  isShoreAdjacentToFord: () => C.shore,
  // Wejscie logiczne: kafel jest rzeka i wiersz rzeki istnieje w danych terenu (terrain-combat.json).
  terrainRiverAttackMultiplier: (name) => (name === 'Rzeka' && C.riverRow ? RIVER_MULT : 1),
  terrainDefenseMultiplier: () => C.tdm,
  cityGatedTerrainMultiplier: () => C.gated,
  flankRearDefensePenalty: realFlank,
  FORTIFY_OBRONA_PROC_FIELD: FORTIFY,
  BROD_KARA_OBRONA: BROD.karaObrona,
  BROD_BONUS_BRZEG: BROD.bonusObronaBrzegu,
  MORALE_HIT_LOSS_SCALE: consts.MORALE_HIT_LOSS_SCALE,
  MORALE_FLANK_HIT: consts.MORALE_FLANK_HIT,
  MORALE_REAR_HIT: consts.MORALE_REAR_HIT,
  MORALE_CHARGE_HIT: consts.MORALE_CHARGE_HIT,
  MORALE_KILL_GAIN: consts.MORALE_KILL_GAIN,
  Math: MathStub,
};
const blowFn = singleBlowFactory(...bodyParams.map((n) => stubs[n]));

// Obiekt `this` sceny (stub). Pola zgodne z uzyciem w tekscie pinu.
function makeScene() {
  return {
    armyHungerStatMult: 1,
    goldDeficitStatMult: 1,
    terrainMap: {
      combatTerrainName: (q, r) => (q === C.attacker.q && r === C.attacker.r ? C.atkName : C.defName),
    },
    terrainData: {},
    isCityDefenseBattle: C.isCity,
    wallDefenseTotalProc: C.wallTotal,
    _wallBonusProcFor: () => C.wallBonus,
    attackerCivBonusy: [],
    defenderCivBonusy: [],
    attackerOwnTerritory: false,
    defenderOwnTerritory: false,
    shallowSea: false,
    attackerDifficultyCombatMult: C.diffA,
    defenderDifficultyCombatMult: C.diffD,
    counters: [],
    engaged: new Set(C.engagedPre ? ['A>D'] : []),
    log: [],
    _sfxMelee: () => { OUT.sfx += 1; },
    _updateHpBar: (u) => { OUT.hpUpdates += 1; },
    _resolveBlowOutcome: (a, d, dmg, extra) => {
      OUT.outcome = { dmg, extra };
      return dmg;
    },
  };
}

// --- Generator przypadkow (mulberry32) ---
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
const rnd = mulberry32(SEED);
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
const uni = (lo, hi) => lo + rnd() * (hi - lo);
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const chance = (p) => rnd() < p;
// Rzadko NaN/Infinity: sprawdza semantyke Math.max/min/round w JS.
const special = (v) => {
  if (chance(0.01)) return NaN;
  if (chance(0.005)) return Infinity;
  if (chance(0.005)) return -Infinity;
  return v;
};

// Kodowanie liczb do JSON: NaN/Infinity jako tekst; null zostaje null.
// Liczby skonczone jako String(x) (najkrotsza forma round-trip JS): Rust parsuje je dokladnie przez `str::parse::<f64>`.
// Liczby w JSON nie sa uzywane, bo serde_json bez `float_roundtrip` moze zmienic ostatni bit.
function encodeNum(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return 'NaN';
    if (v === Infinity) return 'Infinity';
    if (v === -Infinity) return '-Infinity';
    return String(v);
  }
  return v;
}

const TYPES = ['Piechota', 'Lucznik', 'Procarz', 'Kawaleria', 'Oszczepnik', 'Oblezenie', 'Slinger', 'Distance', 'Mount'];
const NAMES = ['Łucznik', 'Lucznik (bialy)', 'Procarz', 'Oszczepnik', 'Jezdziec', 'Wojownik', 'łucznik konny'];
const ROLES = ['Piechota', 'Obleznicza', 'Kawaleria'];
const TERRAINS = ['Rzeka', 'Plaskie (rownina/laka)', 'Wzgorza', 'Las'];

function makeCase(i) {
  const ranged = chance(0.35);
  const aq = int(0, 9);
  const ar = int(0, 9);
  let dq = int(0, 9);
  let dr = int(0, 9);
  if (dq === aq && dr === ar) dq = (dq + 1) % 10;
  const onWall = chance(0.2);
  const isCity = chance(0.3);
  const wallTotal = chance(0.5) ? uni(0, 500) : 0;
  const cu = {
    weaponDamage: special(int(0, 30)),
    piercing: int(0, 8),
    meleeAttack: special(int(0, 40)),
    missileAttack: chance(0.05) ? null : special(int(0, 40)),
    chargeBonus: int(0, 15),
    counterTyp: pick(TYPES),
    typNazwa: pick(NAMES),
    rola: pick(ROLES),
  };
  const cuD = {
    meleeDefence: special(int(0, 40)),
    armor: special(int(0, 30)),
    counterTyp: pick(TYPES),
    rola: pick(ROLES),
    'Kara obrony z flanki (%)': pick([null, NaN, 0, 25, 50, 100]),
    'Kara obrony z tylu (%)': pick([null, NaN, 0, 30, 75, 100]),
  };
  const mods = () => ({
    atk: pick([0, 0.1, -0.25, 0.5, 1]),
    rangedAtk: pick([0, 0.2, -0.1, 0.5]),
    uderzenie: pick([0, 0.3, 1]),
    obrona: pick([0, 0.15, -0.5, 1]),
    pancerz: pick([0, 0.2, -0.3]),
  });
  const atkMods = mods();
  const defMods = mods();
  const attacker = {
    side: 'atk', q: aq, r: ar, facing: int(0, 5), onWallWalkway: false, mounted: chance(0.3),
    bu: { id: 'A', nazwa: 'Atakujacy', hp: int(1, 150), maxHp: int(1, 200), pancerzBonusFrac: pick([0, 0.1]), parametryBonusFrac: pick([0, 0.2]) },
  };
  const defender = {
    side: 'def', q: dq, r: dr, facing: int(0, 5), onWallWalkway: onWall, mounted: false,
    bu: { id: 'D', nazwa: 'Obronca', hp: int(1, 150), maxHp: int(1, 200), fortifiedInField: chance(0.3), pancerzBonusFrac: pick([0, 0.15]), parametryBonusFrac: 0 },
  };
  return {
    i,
    ranged,
    u: pick([0, 0.9999999999, rnd(), rnd(), rnd()]),
    hitArc: pick(['front', 'flank', 'rear']),
    isCity,
    wallTotal,
    wallBonus: chance(0.5) ? uni(0, 400) : 0,
    gated: pick([1, 1.25, 1.5, 2, 3, special(1.1)]),
    tdm: pick([1, 1.5, 1.75, 0.5, special(1.2)]),
    atkName: pick(TERRAINS),
    defName: pick(TERRAINS),
    riverRow: chance(0.5),
    atkFord: chance(0.15),
    defFord: chance(0.15),
    shore: chance(0.2),
    braces: chance(0.3),
    engagedPre: chance(0.4),
    diffA: pick([1, 1.2, 0.8, 1.5, special(1)]),
    diffD: pick([1, 1.2, 0.8, 1.5]),
    wallCiv: pick([1, 1.2, 1.5]),
    ctr: pick([0.5, 0.75, 1, 1.25, 1.5, 2, special(1)]),
    cuA: cu,
    cuD,
    atkMods,
    defMods,
    attacker,
    defender,
  };
}

function runCase(c) {
  C = c;
  OUT = {
    sfx: 0, hpUpdates: 0, outcome: null, hitArgs: null, hitRet: null, rangeArgs: null, baseArgs: null,
    rdm: null, rdmTyp: null, rdmJedn: null, bracesCalled: false, relativeHit: null,
  };
  const scene = makeScene();
  const key = 'A>D';
  const enginedBefore = scene.engaged.has(key);
  const aHp0 = c.attacker.bu.hp;
  const dHp0 = c.defender.bu.hp;
  const ret = blowFn.call(scene, c.attacker, c.defender, c.ranged);
  const hit = OUT.outcome !== null;
  // isCharge = firstBlow && !bracesAgainstCharge(...) (pin: short-circuit). bracesAgainstCharge wolane tylko gdy firstBlow
  // i tylko w gałęzi wręcz; wiec isCharge = (braces wolane) && !braces.
  const isChargeTrue = OUT.bracesCalled && !c.braces;
  return {
    id: c.i,
    in: {
      ranged: c.ranged,
      u: encodeNum(c.u),
      hitArc: c.hitArc,
      isCity: c.isCity,
      wallTotal: encodeNum(c.wallTotal),
      wallBonus: encodeNum(c.wallBonus),
      gated: encodeNum(c.gated),
      tdm: encodeNum(c.tdm),
      atkName: c.atkName,
      defName: c.defName,
      riverRow: c.riverRow,
      riverMult: RIVER_MULT,
      atkFord: c.atkFord,
      defFord: c.defFord,
      shore: c.shore,
      braces: c.braces,
      engagedPre: c.engagedPre,
      diffA: encodeNum(c.diffA),
      diffD: encodeNum(c.diffD),
      wallCiv: encodeNum(c.wallCiv),
      ctr: encodeNum(c.ctr),
      cuA: Object.fromEntries(Object.entries(c.cuA).map(([k, v]) => [k, encodeNum(v)])),
      cuD: Object.fromEntries(Object.entries(c.cuD).map(([k, v]) => [k, encodeNum(v)])),
      atkMods: Object.fromEntries(Object.entries(c.atkMods).map(([k, v]) => [k, encodeNum(v)])),
      defMods: Object.fromEntries(Object.entries(c.defMods).map(([k, v]) => [k, encodeNum(v)])),
      attacker: {
        q: c.attacker.q, r: c.attacker.r, mounted: c.attacker.mounted,
        hp: encodeNum(aHp0), maxHp: encodeNum(c.attacker.bu.maxHp),
      },
      defender: {
        q: c.defender.q, r: c.defender.r, onWall: c.defender.onWallWalkway,
        fortified: c.defender.bu.fortifiedInField,
        hp: encodeNum(dHp0), maxHp: encodeNum(c.defender.bu.maxHp),
      },
    },
    out: {
      ret: encodeNum(ret),
      hit,
      missed: !hit,
      hitPct: encodeNum(OUT.hitRet),
      roll: encodeNum(c.u * 100),
      dmg: hit ? encodeNum(OUT.outcome.dmg) : 0,
      defHpAfter: encodeNum(c.defender.bu.hp),
      extraMorale: hit ? encodeNum(OUT.outcome.extra) : null,
      isCharge: isChargeTrue && !c.ranged,
      engagedAfter: scene.engaged.has(key),
      engagedBefore: enginedBefore,
      hitArgs: OUT.hitArgs,
      baseArgs: OUT.baseArgs ? OUT.baseArgs.map(encodeNum) : null,
      rangeArgs: OUT.rangeArgs,
      rdm: encodeNum(OUT.rdm),
      rdmTyp: OUT.rdmTyp,
      rdmJedn: OUT.rdmJedn,
    },
  };
}

const cases = [];
for (let i = 0; i < N_CASES; i += 1) {
  cases.push(runCase(makeCase(i)));
}

// Pokrycie galezi liczone po wykonaniu (sprawdzane tez w tescie Rust).
const cov = {
  total: cases.length,
  miss: cases.filter((c) => c.out.missed).length,
  hitMelee: cases.filter((c) => c.out.hit && !c.in.ranged).length,
  hitRanged: cases.filter((c) => c.out.hit && c.in.ranged).length,
  charge: cases.filter((c) => c.out.isCharge).length,
  bracesBlocksCharge: cases.filter((c) => !c.in.ranged && c.in.engagedPre === false && c.in.braces).length,
  notFirstBlow: cases.filter((c) => !c.in.ranged && c.in.engagedPre).length,
  flankHit: cases.filter((c) => c.out.hit && c.in.hitArc === 'flank').length,
  rearHit: cases.filter((c) => c.out.hit && c.in.hitArc === 'rear').length,
  frontHit: cases.filter((c) => c.out.hit && c.in.hitArc === 'front').length,
  mountedChargeMorale: cases.filter((c) => c.out.hit && !c.in.ranged && c.out.isCharge && c.in.attacker.mounted).length,
  onWall: cases.filter((c) => c.in.defender.onWall).length,
  cityBattle: cases.filter((c) => c.in.isCity).length,
  fieldBattle: cases.filter((c) => !c.in.isCity).length,
  fortifiedDefender: cases.filter((c) => c.in.defender.fortified).length,
  fordDefender: cases.filter((c) => c.in.defFord && !c.in.defender.onWall).length,
  shoreBonus: cases.filter((c) => c.in.shore && c.in.atkFord && !c.in.defFord && !c.in.defender.onWall).length,
  riverAttack: cases.filter((c) => c.in.atkName === 'Rzeka' && c.in.riverRow).length,
  slingerRanged: cases.filter((c) => c.out.rdmTyp === 'Slinger').length,
  lucznikRanged: cases.filter((c) => c.out.rdmTyp === 'Distance' && /^łucznik/i.test(String(c.out.rdmJedn).trim().toLowerCase())).length,
  defHpZeroAfter: cases.filter((c) => c.out.hit && Number(c.out.defHpAfter) === 0).length,
  nanCase: cases.filter((c) => JSON.stringify(c).includes('"NaN"')).length,
  infCase: cases.filter((c) => JSON.stringify(c).includes('Infinity')).length,
};

const outDir = join(here, 'p6_siege_tactics_blow_full_vectors');
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, 'vectors.json'),
  `${JSON.stringify({
    pin: PIN,
    fragmentSha256: digest,
    seed: SEED,
    brod: Object.fromEntries(Object.entries(BROD).map(([k, v]) => [k, encodeNum(v)])),
    fortify: encodeNum(FORTIFY),
    riverMult: encodeNum(RIVER_MULT),
    coverage: cov,
    cases,
  }, null, 1)}\n`,
);
console.error(JSON.stringify(cov));
