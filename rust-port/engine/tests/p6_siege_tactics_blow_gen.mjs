// P6 SIEGE-TAKTYKA K5i (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I-Q1): generator wektorow ciosu `_singleBlow`
// WYKONUJACY tekst pinu (pin 07d2fbd72). Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_blow_gen.mjs (Node 22)
// Wynik -> p6_siege_tactics_blow_vectors/vectors.json. Ziarno PRNG 217 (mulberry32).
//
// Zasada: zakresy linii pinu (1-based, wlacznie) sa wykonywane przez `new Function` z `this` = stub sceny.
// Nic nnie jest przepisywane recznie. Wykonywane zakresy:
//   * isCharge: battleScene.ts:8894-8900 (klucz `engaged`, `bracesAgainstCharge`);
//   * blow core: battleScene.ts:8958-9010 (hitPct, rzut `Math.random()*100`, pudlo, obrazenia, HP, flanka/tyl, extraMorale);
//   * _resolveBlowOutcome: battleScene.ts:9020-9068 (rout-before-death, zabicie, morale).
// Wykonywane sa tez czyste helpery z pinu combat.ts:440-519 (hitChanceTw, damageTw, rangeDamageTw, rangeDamage, baseDamage),
// po zdjeciu typow TypeScript (module.stripTypeScriptTypes). TW = gra/data/combat-params.json tw_v3 z pinu.
//
// Poza wykonaniem (WEJSCIA jawne, podawane z wektora; liczone w liniach pinu spoza zakresu):
//   * cuA.weaponDamage/piercing, defArmor, roundAtkCharge, atkMelee, atkShootAcc, defFinalObrona, atkMissile, ctrAtkVsDef
//     (linie 8880-8956: civ/teren/fortyfikacja/kara skrzydla/kontra);
//   * rangedDamageMultFor (unit-power.ts) -> wejscie `rangedClassMult`;
//   * bracesAgainstCharge -> wejscie `bracesAgainstCharge`; hitArc/defPenaltyFrac (relativeHit, flankRearDefensePenalty);
//   * wynik _applyMoraleDamage (nieportowany) -> wejscie `routedAfter` (stub ustawia defender.routed = routedAfter).
// Stuby efektow sceny zapisuja zdarzenia do listy `events` (nie zmieniaja stanu poza `routed`).
// Log (this.log) jest zbierany, ale nie porownywany (formatowanie tekstu logu jest poza portem).
//
// Straznik: SHA-256 zlaczonych fragmentow pinu. Zmiana pinu -> blad zamiast cichych wektorow.

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
  params: 'gra/data/combat-params.json',
};
const RANGES = {
  isCharge: [8894, 8900],
  bladeCore: [8958, 9010],
  outcomeBody: [9020, 9068],
  combatHelpers: [440, 517],
};
const CONSTS_LINES = { // stale MORALE_* z pinu (linie 1137-1140, 1115)
  MORALE_HIT_LOSS_SCALE: [1115, 1115],
  MORALE_FLANK_HIT: [1137, 1137],
  MORALE_REAR_HIT: [1138, 1138],
  MORALE_CHARGE_HIT: [1139, 1139],
  MORALE_KILL_GAIN: [1140, 1140],
};
const FRAGMENT_SHA256 = '39bee8dba9f6f20b785700402fd4ee73638a9a2467715a58b55f49b927e511bc';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const gitShow = (path) => execFileSync('git', ['show', `${PIN}:${path}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const sceneLines = gitShow(FILES.scene).split('\n');
const combatLines = gitShow(FILES.combat).split('\n');
const pinRange = (lines, a, b) => lines.slice(a - 1, b).join('\n');

// Strazniki struktury: zakres `outcomeBody` musi konczyc sie zamknieciem metody (`  }`) na 9069.
if (sceneLines[9069 - 1] !== '  }') throw new Error('pin: koniec _resolveBlowOutcome nie na 9069');
if (!sceneLines[9019 - 1].includes('private _resolveBlowOutcome(')) throw new Error('pin: poczatek _resolveBlowOutcome nie na 9019');
if (!sceneLines[8958 - 1].includes('const chargeHitBonus')) throw new Error('pin: poczatek bladeCore nie na 8958');
if (!sceneLines[8894 - 1].includes('let isCharge = false;')) throw new Error('pin: poczatek isCharge nie na 8894');

const fragmentTexts = {
  isCharge: pinRange(sceneLines, ...RANGES.isCharge),
  bladeCore: pinRange(sceneLines, ...RANGES.bladeCore),
  outcomeBody: pinRange(sceneLines, ...RANGES.outcomeBody),
  combatHelpers: pinRange(combatLines, ...RANGES.combatHelpers),
  consts: Object.entries(CONSTS_LINES).map(([k, [a, b]]) => pinRange(sceneLines, a, b)).join('\n'),
};
const digest = createHash('sha256')
  .update(Object.keys(fragmentTexts).map((n) => `${n}\n${fragmentTexts[n]}`).join('\n---\n'))
  .digest('hex');
if (FRAGMENT_SHA256 !== 'PLACEHOLDER' && digest !== FRAGMENT_SHA256) {
  throw new Error(`SHA-256 fragmentow pinu zmieniony: ${digest}`);
}
console.error(`fragment sha256 = ${digest}`);

// Helpery combat.ts (czyste) i stale TW z pinu.
const tw = JSON.parse(gitShow(FILES.params)).tw_v3;
const helperCode = stripTypeScriptTypes(fragmentTexts.combatHelpers.replace(/^export /gm, ''));
const helpers = new Function('TW', `${helperCode}\nreturn { hitChanceTw, damageTw, rangeDamageTw, rangeDamage, baseDamage };`)({
  hit_base: tw.hit_base, hit_min: tw.hit_min, hit_max: tw.hit_max,
});
const { hitChanceTw, rangeDamage, baseDamage } = helpers;

const MORALE = { MORALE_HIT_LOSS_SCALE: 100, MORALE_FLANK_HIT: 8, MORALE_REAR_HIT: 15, MORALE_CHARGE_HIT: 15, MORALE_KILL_GAIN: 6 };

// Funkcje z tekstu pinu. Parametry = zmienne, z ktorych korzysta tekst (bez zmian nazw).
// Kazdy zakres pinu owijany w deklaracje funkcji, zdejmowanie typow TS na calej deklaracji, potem `new Function`.
function fnFromPin(name, params, body) {
  const src = stripTypeScriptTypes(`function ${name}(${params.join(', ')}) {\n${body}\n}`);
  return new Function(`${src}\nreturn ${name};`)();
}
const isChargeFn = fnFromPin(
  'isChargeFn', ['ranged', 'attacker', 'defender', 'bracesAgainstCharge', 'engaged'],
  `let isCharge = false;\n${fragmentTexts.isCharge.replace(/^\s*let isCharge = false;\n/, '')}\nreturn isCharge;`,
);
const outcomeFn = fnFromPin(
  'outcomeFn', ['attacker', 'defender', 'dmg', 'extraMorale', ...Object.keys(MORALE)],
  fragmentTexts.outcomeBody,
);
const bladeCoreFn = fnFromPin(
  'bladeCoreFn',
  ['ranged', 'isCharge', 'roundAtkCharge', 'atkMelee', 'atkShootAcc', 'defFinalObrona', 'defArmor', 'atkMissile',
    'ctrAtkVsDef', 'cuA', 'attacker', 'defender', 'hitArc', 'defPenaltyFrac', 'rangedDamageMultFor', 'hitChanceTw',
    'rangeDamage', 'baseDamage', 'Math', ...Object.keys(MORALE)],
  fragmentTexts.bladeCore,
);

// mulberry32 (ziarno 217).
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
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
const uni = (lo, hi) => lo + rnd() * (hi - lo);
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const chance = (p) => rnd() < p;
// Rzadko podajemy NaN/Infinity, zeby sprawdzic zgodnosc semantyki JS (Math.max/min propaguja NaN).
const maybeSpecial = (v) => {
  if (chance(0.01)) return NaN;
  if (chance(0.005)) return Infinity;
  if (chance(0.005)) return -Infinity;
  return v;
};

function runCase(input) {
  const events = [];
  const log = [];
  // Obserwowane wartosci z tekstu pinu (K5I-2): hitPct z hitChanceTw, roll = Math.random()*100, extraMorale z wywolania
  // _resolveBlowOutcome (na pudle nie wolane -> 0 jak w pinie: `let extraMorale = 0` jest po return pudla).
  const seen = { hitPct: null, roll: null, extraMorale: 0 };
  const attacker = { bu: { id: 'A1', nazwa: 'A', hp: 0, maxHp: 0 }, mounted: input.mounted };
  const defender = {
    bu: { id: 'D1', nazwa: 'D', hp: input.defHp, maxHp: input.defMaxHp },
    dead: input.dead, fadingOut: input.fadingOut, removed: input.removed,
    routed: input.routed, neverRout: input.neverRout,
    morale: input.morale, fleeMorale: input.fleeMorale,
  };
  const engaged = new Set(input.engagedBefore ? ['A1>D1'] : []);
  // Stub sceny: efekty zapisywane do events (nieportowane cialo stanu poza routed).
  const scene = {
    log,
    engaged,
    counters: [],
    _updateHpBar(u) { events.push({ e: 'UpdateHpBar', who: u === defender ? 'def' : 'atk' }); },
    _applyMoraleDamage(u, dmg, extra) {
      events.push({ e: 'ApplyMoraleDamage', dmg, extra });
      u.routed = input.routedAfter;
    },
    _gainMorale(u, amount) { events.push({ e: 'GainMorale', who: u === attacker ? 'atk' : 'def', amount }); },
    _pushClash(a, d, dmg, tag) { events.push({ e: 'PushClash', tag }); },
    _startFade() { events.push({ e: 'StartFade' }); },
    _shakeAlliesOnLoss() { events.push({ e: 'ShakeAllies' }); },
    _boostEnemiesOnBreak() { events.push({ e: 'BoostEnemies' }); },
    _resolveBlowOutcome(a, d, dmg, extraMorale) {
      seen.extraMorale = extraMorale;
      return outcomeFn.call(this, a, d, dmg, extraMorale, ...Object.values(MORALE));
    },
  };
  // isCharge (linie 8894-8900) -> bracesAgainstCharge jako stub.
  const ranged = input.ranged;
  const isCharge = isChargeFn.call(scene, ranged, attacker, defender, () => input.braces, engaged);
  // Losowanie: jeden rzut na cios (Math.random), zwracany jako wejscie.
  const MathStub = Object.create(Math);
  MathStub.random = () => {
    seen.roll = input.r01 * 100; // ten sam wyraz co `Math.random() * 100` w pinie (roll = u * 100)
    return input.r01;
  };
  const hitChanceSpy = (...args) => {
    const v = hitChanceTw(...args);
    seen.hitPct = v;
    return v;
  };
  const cuA = { weaponDamage: input.weaponDamage, piercing: input.piercing, typNazwa: '', counterTyp: '' };
  const rangedDamageMultFor = () => input.rangedClassMult;
  const ret = bladeCoreFn.call(
    scene, ranged, isCharge, input.roundAtkCharge, input.atkMelee, input.atkShootAcc, input.defFinalObrona,
    input.defArmor, input.atkMissile, input.ctrAtkVsDef, cuA, attacker, defender, input.hitArc, input.defPenaltyFrac,
    rangedDamageMultFor, hitChanceSpy, rangeDamage, baseDamage, MathStub, ...Object.values(MORALE),
  );
  const missed = events.length === 0 && log.length > 0 && log[0].includes('chybia');
  return {
    isCharge,
    missed,
    returned: ret,
    defHpAfter: defender.bu.hp,
    hitPct: seen.hitPct,
    roll: seen.roll,
    extraMorale: seen.extraMorale,
    // `this.engaged.add(key)` (battleScene.ts:8899) wykonane tylko dla ciosu wrecz; klucz obecny po wywolaniu.
    engagedKeyAfter: engaged.has('A1>D1'),
    events,
  };
}

// Pola wejsciowe, ktore sa zapisane w wektorze (klucze uzywane przez Rust).
function randomInput() {
  const ranged = chance(0.25);
  return {
    ranged,
    engagedBefore: chance(0.3),
    braces: chance(0.2),
    mounted: chance(0.3),
    hitArc: pick(['front', 'front', 'front', 'flank', 'rear']),
    defPenaltyFrac: pick([0, 0.2, 0.3, 0.5]),
    r01: rnd(),
    weaponDamage: maybeSpecial(uni(0, 30)),
    piercing: maybeSpecial(uni(0, 5)),
    roundAtkCharge: maybeSpecial(uni(0, 20)),
    atkMelee: maybeSpecial(uni(0, 200)),
    atkShootAcc: maybeSpecial(uni(0, 200)),
    defFinalObrona: maybeSpecial(uni(0, 200)),
    defArmor: maybeSpecial(uni(0, 20)),
    atkMissile: maybeSpecial(uni(0, 30)),
    ctrAtkVsDef: maybeSpecial(pick([0.1, 0.5, 0.75, 1, 1.25, 1.5, 2])),
    rangedClassMult: pick([1, 1.5, 0.5]),
    defHp: int(1, 30),
    defMaxHp: int(20, 40),
    morale: uni(0, 100),
    fleeMorale: uni(0, 40),
    dead: chance(0.05),
    fadingOut: chance(0.05),
    removed: chance(0.05),
    routed: chance(0.1),
    neverRout: chance(0.05),
    routedAfter: chance(0.4),
  };
}

// Kodowanie liczb: JSON nie ma NaN/Infinity -> tekst (jak w K4).
// Liczby koduja sie jako tekst String(x) (najkrotsza forma round-trip JS): serde_json bez float_roundtrip
// nie parsuje wszystkich liczb z bitowa dokladnoscia, a Rust `str::parse::<f64>` tak. NaN/Infinity jak wczesniej.
const enc = (x) => {
  if (typeof x !== 'number') return x;
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  return String(x);
};
const encDeep = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? v.map(encDeep) : typeof v === 'object' && v !== null ? encDeep(v) : enc(v)]));

const cases = [];
for (let i = 0; i < 620; i++) {
  const input = randomInput();
  cases.push({ id: `R${String(i).padStart(4, '0')}`, input, expect: runCase(input) });
}
// Przypadki brzegowe: flanka/tyl, szarza konna, dolna granica 1, zabicie, rout przed smiercia.
const edge = [
  { ranged: false, engagedBefore: false, braces: false, mounted: true, hitArc: 'flank', defPenaltyFrac: 0.2, r01: 0, weaponDamage: 20, piercing: 2, roundAtkCharge: 10, atkMelee: 200, atkShootAcc: 0, defFinalObrona: 0, defArmor: 0, atkMissile: 0, ctrAtkVsDef: 1, rangedClassMult: 1, defHp: 30, defMaxHp: 30, morale: 100, fleeMorale: 0, dead: false, fadingOut: false, removed: false, routed: false, neverRout: false, routedAfter: false },
  { ranged: true, engagedBefore: false, braces: false, mounted: false, hitArc: 'rear', defPenaltyFrac: 0.5, r01: 0.99, weaponDamage: 0, piercing: 0, roundAtkCharge: 0, atkMelee: 0, atkShootAcc: 0, defFinalObrona: 200, defArmor: 30, atkMissile: 1, ctrAtkVsDef: 0.1, rangedClassMult: 0.5, defHp: 1, defMaxHp: 1, morale: 10, fleeMorale: 5, dead: false, fadingOut: false, removed: false, routed: false, neverRout: false, routedAfter: true },
  { ranged: false, engagedBefore: false, braces: true, mounted: true, hitArc: 'front', defPenaltyFrac: 0, r01: 0, weaponDamage: 10, piercing: 0, roundAtkCharge: 5, atkMelee: 100, atkShootAcc: 0, defFinalObrona: 0, defArmor: 0, atkMissile: 0, ctrAtkVsDef: 1, rangedClassMult: 1, defHp: 5, defMaxHp: 5, morale: 50, fleeMorale: 10, dead: false, fadingOut: false, removed: false, routed: false, neverRout: false, routedAfter: false },
  { ranged: false, engagedBefore: true, braces: false, mounted: true, hitArc: 'front', defPenaltyFrac: 0, r01: 0.1, weaponDamage: 10, piercing: 0, roundAtkCharge: 5, atkMelee: 100, atkShootAcc: 0, defFinalObrona: 0, defArmor: 0, atkMissile: 0, ctrAtkVsDef: 1, rangedClassMult: 1, defHp: 40, defMaxHp: 40, morale: 50, fleeMorale: 10, dead: false, fadingOut: false, removed: false, routed: false, neverRout: false, routedAfter: false },
  { ranged: false, engagedBefore: false, braces: false, mounted: false, hitArc: 'front', defPenaltyFrac: 0, r01: 0, weaponDamage: NaN, piercing: 0, roundAtkCharge: 0, atkMelee: 50, atkShootAcc: 0, defFinalObrona: 0, defArmor: 0, atkMissile: 0, ctrAtkVsDef: 1, rangedClassMult: 1, defHp: 10, defMaxHp: 10, morale: 50, fleeMorale: 10, dead: false, fadingOut: false, removed: false, routed: false, neverRout: false, routedAfter: false },
  { ranged: false, engagedBefore: false, braces: false, mounted: false, hitArc: 'front', defPenaltyFrac: 0, r01: 0, weaponDamage: 10, piercing: 0, roundAtkCharge: 0, atkMelee: 50, atkShootAcc: 0, defFinalObrona: 0, defArmor: 0, atkMissile: 0, ctrAtkVsDef: NaN, rangedClassMult: 1, defHp: 10, defMaxHp: 10, morale: 50, fleeMorale: 10, dead: false, fadingOut: false, removed: false, routed: false, neverRout: false, routedAfter: false },
];
for (let i = 0; i < edge.length; i++) {
  const input = edge[i];
  cases.push({ id: `E${String(i).padStart(3, '0')}`, input, expect: runCase(input) });
}

const out = {
  pin: PIN,
  fragmentSha256: digest,
  ranges: RANGES,
  note: 'Wektory generowane wykonaniem tekstu pinu; stub RNG = jeden rzut r01 na cios; routedAfter = wynik nieportowanego _applyMoraleDamage.',
  count: cases.length,
  cases: cases.map((c) => ({ id: c.id, input: encDeep(c.input), expect: encDeep(c.expect) })),
};
const dir = join(here, 'p6_siege_tactics_blow_vectors');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'vectors.json'), JSON.stringify(out, null, 1) + '\n');
console.error(`wrote ${cases.length} cases`);
