// P6 SIEGE-TAKTYKA K5-LOOP-BODY (r3): generator wektorow end-to-end dla produkcyjnego ciala jednostki (`ProdBody`).
// Uruchomienie: node rust-port/engine/tests/p6_siege_tactics_loop_body_gen.mjs (Node >= 22.13). Ziarno 2301.
// Wynik -> p6_siege_tactics_loop_body_vectors/vectors.json.
//
// WYKONYWANY TEKST PINU (07d2fbd72, po stripTypeScriptTypes, ZADNYCH wstawek):
//   _activateUnit (battleScene.ts:6048-6299), _checkRout (9783-9797), _enemiesOf (8291-8294), _doAttack (8787-8797),
//   _singleBlow (8809-9011, cale cialo z `return this._resolveBlowOutcome(...)`), helpery combat.ts 440-517,
//   rangedShotAccuracy, flankRearDefensePenalty, rangedDamageMultFor, applyMultiplier, fieldFortifyDefenseBonus,
//   oraz toCombatUnit + combatUnitFromDef + przeskalowania weterana/glodu/deficytu na wierszach units.json PINU.
//   Straznik: SHA-256 fragmentow (te same sumy co p6_siege_tactics_activate_gen.mjs i p6_siege_tactics_blow_full_gen.mjs)
//   plus SHA-256 tekstu _doAttack.
//
// ZASTUBOWANE (WYLACZNIE efekty zewnetrzne / delegaty poza zakresem ProdBody):
//   RNG: `Math.random` = kolejka rzutow z wektora (jeden rzut na cios).
//   render/animacja: _doMeleeAttack (znacznik sladu `attack:<i>` + wywolanie PRAWDZIWEGO `_singleBlow`; kontratak,
//     lunge i BLOW_HIT_T poza zakresem), _sfxMelee, _updateHpBar, _updateMoraleBar, _applyTerrainRange.
//   STAN FACING (r4, WYKONANE z tekstu pinu): `_updateFacing` + `_nearestEnemy` + `facingToward`/`facingFromTo`/`oppositeDir`/
//     `relativeHit`/`manhattan` (battleScene.ts:347-400, 1917, 8296-8341) i przypisanie `attacker.facing` w `_doMeleeAttack`
//     (battleScene.ts:9104). Enum `Dir` (const enum, poza strip-only) = prelude `{N:0,E:1,S:2,W:3}` strzezony liniami 316-319.
//     Instrumentacja (nie logika): `_updateFacing` dopisuje do sladu `facing` (jak dotad), `relativeHit` zapisuje lukt w OUT.arc.
//     `dirYaw` (yaw modelu, render) = stub 0. Lukt ciosu = relativeHit z AKTUALNEGO facing obroncy (nie szablon).
//   ruch/doktryna/wieze: _fleeStep, _advanceStep, _cavalryAction, _phalanxAction, _fallBackStep, _rangedAction,
//     _trySiegeTowerClimb, _siegeInfantryToTowerStep, _executeGroupDoctrineStep, _siegeRamTowerStep (slad + false).
//   wybor celu: _targetInRange = wskazany przez wektor wrog, o ile `_enemiesOf` (zywy, nie znikajacy, nie uciekajacy) go zawiera.
//   _resolveBlowOutcome: zapisuje (dmg, extraMorale) i stosuje TYLKO zabicie (hp <= 0 -> dead); morale/rout po ciosie
//     poza zakresem ProdBody (NIE_ZMIERZONO, osobny temat).
//   dane sceny: counterMultiplier, bracesAgainstCharge, isFordTile, isShoreAdjacentToFord,
//     terrainMap.combatTerrainName, terrainDefenseMultiplier (tabela po nazwie kafla), terrainRiverAttackMultiplier,
//     cityGatedTerrainMultiplier, _wallBonusProcFor, civ* (mnozniki), battleUnitDifficultyCombatMult, canShoot/isSiege*.
// Zakres sekwencji: AUTO, bez oblezenia (siegeWallCol = -1), cios w zwarciu, bez strzelca, bez doktryny.

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
const VETERAN = 'gra/src/game/veteran.ts';
const HUNGER = 'gra/src/game/army-starvation.ts';
const GOLD = 'gra/src/game/gold-deficit.ts';
const PARAMS = 'gra/data/combat-params.json';
const UNITS = 'gra/data/units.json';
const ACTIVATE_SHA256 = '3be85ac2fba725bf618b61c817c891c1d994d2b7df3615d01552c6c2774ddb00';
const BLOW_SHA256 = 'b2f9e19f1e35644e0e2ea636a9d50a02dd10d729355de5eb3eb35668910e5526';
const UNIT_FRAGMENT_SHA256 = 'd1b401a2275ab01569dd16ec1a6a3618ae56b592dd13c4f900b82b252755016c';
const UNITS_SHA256 = '7b509817d1c613a526ea0e8066a62f340f46a29fedd6f79f0c647195727bc6d7';
const DOATTACK_SHA256 = '592a6cbc279655a09b13fe9cd5ccbad24b325fa093610d685d5d9461729b41c1';
const FACING_SHA256 = '6d4858eded6e566c91a2874b30a5eabff0080b477bbf29c02a1a67f69493eae3';
const N_SEQ = 320;
const SEED = 2301;

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const gitShow = (path) => execFileSync('git', ['show', `${PIN}:${path}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const lines = Object.fromEntries([SCENE, COMBAT, CITY, UNIT_POWER, CIV].map((p) => [p, gitShow(p).split('\n')]));
const params = JSON.parse(gitShow(PARAMS));
const L = (file, a, b) => lines[file].slice(a - 1, b).join('\n');
const expectLine = (file, n, needle) => {
  if (!lines[file][n - 1].includes(needle)) throw new Error(`pin ${file}:${n} nie zawiera "${needle}"`);
};
const sceneEnd = (start) => {
  for (let n = start + 1; n < start + 400; n++) if (lines[SCENE][n - 1] === '  }') return n;
  throw new Error(`brak konca metody od ${start}`);
};
const fnRange = (file, start) => {
  let end = start;
  while (lines[file][end - 1] !== '}') end += 1;
  return [start, end];
};

// ---- strazniki zakresow ----
expectLine(SCENE, 6048, 'private _activateUnit(ru: RuntimeBattleUnit');
expectLine(SCENE, 9783, 'private _checkRout(ru: RuntimeBattleUnit)');
expectLine(SCENE, 8291, 'private _enemiesOf(ru: RuntimeBattleUnit)');
expectLine(SCENE, 8787, 'private _doAttack(');
expectLine(SCENE, 8809, 'private _singleBlow(');
expectLine(SCENE, 8812, 'if (!ranged) this._sfxMelee();');
expectLine(SCENE, 9010, 'return this._resolveBlowOutcome(attacker, defender, dmg, extraMorale);');
if (sceneEnd(6048) !== 6299) throw new Error('koniec _activateUnit != 6299');
if (sceneEnd(8787) !== 8797) throw new Error('koniec _doAttack != 8797');

// SHA aktywacji: identyczne skladanie jak w p6_siege_tactics_activate_gen.mjs.
const activateParts = [L(SCENE, 1142, 1143), L(SCENE, 1161, 1161), L(SCENE, 1917, 1919), L(SCENE, 6048, 6299), L(SCENE, 9783, sceneEnd(9783)), L(SCENE, 8291, 8294)];
const activateDigest = createHash('sha256').update(activateParts.join('\n---\n')).digest('hex');
if (activateDigest !== ACTIVATE_SHA256) throw new Error(`SHA fragmentow aktywacji zmieniony: ${activateDigest}`);
const doAttackText = L(SCENE, 8787, 8797);
const doAttackDigest = createHash('sha256').update(doAttackText).digest('hex');
if (doAttackDigest !== DOATTACK_SHA256) throw new Error(`SHA _doAttack zmieniony: ${doAttackDigest}`);
console.error(`activate sha256 = ${activateDigest}\ndoAttack sha256 = ${doAttackDigest}`);

// ---- FACING (r4): tekst pinu facingToward/facingFromTo/oppositeDir/relativeHit/manhattan/_nearestEnemy/_updateFacing
// oraz przypisanie attacker.facing w _doMeleeAttack (battleScene.ts:9104). Enum Dir (const enum, poza strip-only) to
// prelude o tych samych wartosciach, strzezony sprawdzeniem linii 316-319.
expectLine(SCENE, 316, 'N = 0');
expectLine(SCENE, 317, 'E = 1');
expectLine(SCENE, 318, 'S = 2');
expectLine(SCENE, 319, 'W = 3');
expectLine(SCENE, 347, 'export function facingToward(');
expectLine(SCENE, 359, 'export function facingFromTo(');
expectLine(SCENE, 370, 'export function oppositeDir(');
expectLine(SCENE, 385, 'export function relativeHit(');
expectLine(SCENE, 1917, 'function manhattan(');
expectLine(SCENE, 8296, 'private _nearestEnemy(ru: RuntimeBattleUnit)');
expectLine(SCENE, 8334, 'private _updateFacing(ru: RuntimeBattleUnit)');
expectLine(SCENE, 9104, 'attacker.facing = facingFromTo(attacker.q, attacker.r, defender.q, defender.r, attacker.facing);');
const DIR_PRELUDE = 'const Dir = { N: 0, E: 1, S: 2, W: 3 };';
const facingParts = [
  DIR_PRELUDE,
  L(SCENE, 347, fnRange(SCENE, 347)[1]),
  L(SCENE, 359, fnRange(SCENE, 359)[1]),
  L(SCENE, 370, fnRange(SCENE, 370)[1]),
  L(SCENE, 385, fnRange(SCENE, 385)[1]),
  L(SCENE, 1917, fnRange(SCENE, 1917)[1]),
  L(SCENE, 8296, sceneEnd(8296)),
  L(SCENE, 8334, sceneEnd(8334)),
  '  attacker.facing = facingFromTo(attacker.q, attacker.r, defender.q, defender.r, attacker.facing);',
];
const facingDigest = createHash('sha256').update(facingParts.join('\n---\n')).digest('hex');
if (facingDigest !== FACING_SHA256) throw new Error(`SHA fragmentow facing zmieniony: ${facingDigest}`);

// ---- fragmenty ciosu: identyczne skladanie jak w p6_siege_tactics_blow_full_gen.mjs ----
const consts = { MORALE_HIT_LOSS_SCALE: 100, MORALE_FLANK_HIT: 8, MORALE_REAR_HIT: 15, MORALE_CHARGE_HIT: 15, MORALE_KILL_GAIN: 6 };
const BROD = params.brod;
const FORTIFY = params['oblężenie'].fortify_obrona_proc;
const RANGED_MULT = params.ranged_damage_mult;
const RIVER_MULT = params.river_attack_mult;
const TW = params.tw_v3;
const [flankA, flankB] = fnRange(COMBAT, 589);
const [rdmA, rdmB] = fnRange(UNIT_POWER, 26);
const [applyA, applyB] = fnRange(CIV, 229);
const [fortA, fortB] = fnRange(CITY, 237);
const [rsaA, rsaB] = fnRange(COMBAT, 476);
const tf = {
  body: L(SCENE, 8812, 9010),
  helpers: L(COMBAT, 440, 517),
  rangedShot: L(COMBAT, rsaA, rsaB),
  flank: L(COMBAT, flankA, flankB),
  rdm: L(UNIT_POWER, rdmA, rdmB),
  apply: L(CIV, applyA, applyB),
  fortify: L(CITY, fortA, fortB),
};
const blowDigest = createHash('sha256')
  .update(Object.keys(tf).map((n) => `${n}\n${tf[n]}`).join('\n---\n'))
  .update(`\nconsts\n${JSON.stringify(consts)}\nbrod\n${JSON.stringify(BROD)}\nfortify\n${FORTIFY}\nranged\n${JSON.stringify(RANGED_MULT)}\nriver\n${RIVER_MULT}\ntw\n${JSON.stringify(TW)}`)
  .digest('hex');
if (blowDigest !== BLOW_SHA256) throw new Error(`SHA fragmentow ciosu zmieniony: ${blowDigest}`);

// ---- toCombatUnit z pinu (zakresy jak w K5I2a4 / blow_full_gen) ----
const UNIT_FILES = { scene: SCENE, combat: COMBAT, veteran: VETERAN, hunger: HUNGER, gold: GOLD };
const UNIT_R = {
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
const uLines = Object.fromEntries(Object.entries(UNIT_FILES).map(([k, p]) => [k, gitShow(p).split('\n')]));
const ufrag = {};
for (const [name, [file, a, b, first, last]] of Object.entries(UNIT_R)) {
  const ls = uLines[file].slice(a - 1, b);
  if (!ls[0].includes(first)) throw new Error(`pin: ${name} poczatek nie na ${a}: ${ls[0]}`);
  if (ls[ls.length - 1].trim() !== last) throw new Error(`pin: ${name} koniec nie na ${b}`);
  ufrag[name] = ls.join('\n');
}
const uDigest = createHash('sha256').update(Object.keys(ufrag).map((n) => `${n}\n${ufrag[n]}`).join('\n---\n')).digest('hex');
if (uDigest !== UNIT_FRAGMENT_SHA256) throw new Error(`SHA toCombatUnit zmieniony: ${uDigest}`);
const unitsText = gitShow(UNITS);
const unitsDigest = createHash('sha256').update(unitsText).digest('hex');
if (unitsDigest !== UNITS_SHA256) throw new Error(`SHA units.json zmieniony: ${unitsDigest}`);
const UNIT_SKIP = new Set(['Historia', 'Opis', 'Top3']);
const UNIT_ROWS = JSON.parse(unitsText).map((u) => Object.fromEntries(
  Object.entries(u).filter(([k, v]) => !UNIT_SKIP.has(k) && !(v !== null && typeof v === 'object')),
));

const uStrip = (s) => stripTypeScriptTypes(s.replace(/^export /gm, ''));
const uFns = new Function(`${[ufrag.normField, ufrag.unitRowStat, ufrag.statField, ufrag.fromDef].map(uStrip).join('\n')}\nreturn { combatUnitFromDef };`)();
const applyVeteran = new Function(`${uStrip(ufrag.vetRound4)}\n${uStrip(ufrag.vetApply)}\nreturn applyVeteranFracToCombatUnit;`)();
const applyHunger = new Function(`${uStrip(ufrag.hunRound4)}\n${uStrip(ufrag.hunApply)}\nreturn applyArmyHungerStatMultToCombatUnit;`)();
const applyGold = new Function(`${uStrip(ufrag.golRound4)}\n${uStrip(ufrag.golApply)}\nreturn applyGoldDeficitStatMultToCombatUnit;`)();
const realToCombatUnit = new Function(
  'combatUnitFromDef', 'applyVeteranFracToCombatUnit', 'applyArmyHungerStatMultToCombatUnit', 'applyGoldDeficitStatMultToCombatUnit',
  `${uStrip(ufrag.toCombatUnit)}\nreturn toCombatUnit;`,
)(uFns.combatUnitFromDef, applyVeteran, applyHunger, applyGold);

const helperFns = new Function('TW', `${stripTypeScriptTypes(tf.helpers.replace(/^export /gm, ''))}\nreturn { hitChanceTw, damageTw, rangeDamageTw, rangeDamage, baseDamage };`)({
  hit_base: TW.hit_base, hit_min: TW.hit_min, hit_max: TW.hit_max,
});
const strip1 = (t) => stripTypeScriptTypes(t.replace(/^export /gm, ''));
const realRangedShot = new Function(`${strip1(tf.rangedShot)}\nreturn rangedShotAccuracy;`)();
const realFlank = new Function(`${strip1(tf.flank)}\nreturn flankRearDefensePenalty;`)();
const realRdm = new Function('RANGED_DAMAGE_MULT', `${strip1(tf.rdm)}\nreturn rangedDamageMultFor;`)(RANGED_MULT);
const realApply = new Function(`${strip1(tf.apply)}\nreturn applyMultiplier;`)();
const realFortify = new Function(`${strip1(tf.fortify)}\nreturn fieldFortifyDefenseBonus;`)();

// ---- stan biezacej sekwencji ----
let S = null; // stale sceny sekwencji
let OUT = null; // obserwacje ostatniego ciosu
const cuOwner = new WeakMap();
const TERRAINS = ['Rzeka', 'Plaskie (rownina/laka)', 'Wzgorza', 'Las'];
const CTR_POOL = [0.5, 0.75, 1, 1.25, 1.5, 2];
const tileHash = (q, r, k) => (Math.imul(q + 1, 73856093) ^ Math.imul(r + 1, 19349663) ^ Math.imul(k + 1, 83492791)) >>> 0;
const tileName = (q, r) => TERRAINS[tileHash(q, r, S.tseed) % 4];
const fordAt = (q, r) => tileHash(q, r, S.tseed + 11) % 100 < 25;
const shoreAt = (q, r) => tileHash(q, r, S.tseed + 23) % 100 < 35;
const ctrOf = (a, b) => {
  let h = S.ctrSeed;
  for (const ch of `${a}|${b}`) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  return CTR_POOL[h % CTR_POOL.length];
};
const tdmOf = (name) => S.tdm[name] ?? 1;

const MathStub = Object.assign(Object.create(Math), {
  random: () => {
    if (S.rollIdx >= S.rolls.length) throw new Error('kolejka rzutow wyczerpana');
    const u = S.rolls[S.rollIdx++];
    OUT.u = u;
    return u;
  },
});
const stubs = {
  toCombatUnit: (bu, hungerMult, skipHunger, goldMult) => {
    const cu = realToCombatUnit(bu, hungerMult, skipHunger, goldMult);
    cuOwner.set(cu, bu.id);
    return cu;
  },
  // Render (yaw modelu w _updateFacing): poza zakresem stanu; wartosc bez wplywu na facing.
  dirYaw: () => 0,
  battleUnitCivBonusy: (bu, list) => list,
  civCombatStatMultipliers: (bonusy, cu) => S.byId[cuOwner.get(cu)].mods,
  mergeBuildingBonusIntoStatMultipliers: (mods) => mods,
  fieldFortifyDefenseBonus: realFortify,
  applyMultiplier: realApply,
  battleUnitDifficultyCombatMult: (bu) => bu.diff,
  civWallDefenseMultiplier: () => S.wallCiv,
  rangedShotAccuracy: realRangedShot,
  counterMultiplier: (a, b) => ctrOf(a, b),
  hitChanceTw: (...args) => {
    const r = helperFns.hitChanceTw(...args);
    OUT.hitRet = r;
    return r;
  },
  rangeDamage: helperFns.rangeDamage,
  baseDamage: helperFns.baseDamage,
  rangedDamageMultFor: realRdm,
  bracesAgainstCharge: (bu) => { OUT.bracesCalled = true; return bu.braces; },
  isFordTile: (tm, q, r) => fordAt(q, r),
  isShoreAdjacentToFord: (tm, q, r) => shoreAt(q, r),
  terrainRiverAttackMultiplier: (name) => (name === 'Rzeka' && S.riverRow ? RIVER_MULT : 1),
  terrainDefenseMultiplier: (name) => tdmOf(name),
  cityGatedTerrainMultiplier: () => S.gated,
  flankRearDefensePenalty: realFlank,
  FORTIFY_OBRONA_PROC_FIELD: FORTIFY,
  BROD_KARA_OBRONA: BROD.karaObrona,
  BROD_BONUS_BRZEG: BROD.bonusObronaBrzegu,
  ...consts,
  Math: MathStub,
  canShoot: () => false,
  isSiegeUnit: () => false,
  isSiegeTower: () => false,
};
const stubNames = Object.keys(stubs);

const classSrc = [
  L(SCENE, 1142, 1143), L(SCENE, 1161, 1161), L(SCENE, 1917, 1919),
  DIR_PRELUDE,
  L(SCENE, 347, fnRange(SCENE, 347)[1]).replace(/^export /gm, ''),
  L(SCENE, 359, fnRange(SCENE, 359)[1]).replace(/^export /gm, ''),
  L(SCENE, 370, fnRange(SCENE, 370)[1]).replace(/^export /gm, ''),
  // relativeHit z pinu, z przechwyceniem łuku (instrumentacja: wynik trafia do OUT.arc).
  L(SCENE, 385, fnRange(SCENE, 385)[1]).replace(/^export /gm, '').replace('function relativeHit(', 'function relativeHitPin('),
  // Przechwycenie łuku: OUT.arc jest zerowane przed każdą aktywacją; drugie wywołanie w tej samej aktywacji = błąd
  // (inaczej ostatnie wywołanie po cichu wygrywałoby i instrumentacja nie byłaby jednoznaczna).
  'function relativeHit(df, ac, ar, dc, dr) { const r = relativeHitPin(df, ac, ar, dc, dr); if (getOut().arc !== null) throw new Error("relativeHit wywolany wielokrotnie w aktywacji"); getOut().arc = r; return r; }',
  'class Harness {',
  '  constructor() { this.atk = []; this.def = []; this.finished = false; this._manualMode = false; this.siegeWallCol = -1; this.gateOpen = false;',
  '    this.wallTileHp = new Map(); this._autoBatchPlanning = null; this.__trace = []; this.engaged = new Set(); this.log = [];',
  '    this.terrainMap = { combatTerrainName: (q, r) => tileName(q, r) }; this.terrainData = {};',
  '    this.armyHungerStatMult = getS().hunger; this.goldDeficitStatMult = getS().gold; this.isCityDefenseBattle = getS().isCity;',
  '    this.wallDefenseTotalProc = getS().wallTotal; this.attackerCivBonusy = []; this.defenderCivBonusy = []; this.attackerOwnTerritory = false;',
  '    this.defenderOwnTerritory = false; this.shallowSea = false; this.attackerDifficultyCombatMult = 1; this.defenderDifficultyCombatMult = 1;',
  '    this.counters = []; this.terrain = "Plaskie (rownina/laka)"; }',
  '  _fleeStep(ru, done) { this.__trace.push("flee"); }',
  '  _applyTerrainRange(ru) { this.__trace.push("terrainRange"); }',
  '  _performPlayerOrder(ru, done) { this.__trace.push("playerOrder"); return false; }',
  '  _isPlayerSide(side) { return false; }',
  '  _isUnitDoctrineAuto(ru) { return false; }',
  '  _effectiveMetaForUnit(ru) { return { doctrine: "steady" }; }',
  '  _executeGroupDoctrineStep(ru, meta, done) { this.__trace.push("doctrineStep"); return false; }',
  '  _updateMoraleBar(ru) { this.__trace.push("moraleBar"); }',
  '  _startRout(ru) { if (ru.routed || ru.dead || ru.fadingOut) return; ru.routed = true; this.__trace.push("startRout"); }',
  // Znacznik sladu 'facing' (jak dotad) + PRAWDZIWE cialo pinu _updateFacing (ponizej jako _updateFacingPin).
  '  _updateFacing(ru) { this.__trace.push("facing"); return this._updateFacingPin(ru); }',
  '  _trySiegeTowerClimb(ru, done) { this.__trace.push("towerClimb"); return false; }',
  '  _siegeInfantryToTowerStep(ru, done) { this.__trace.push("infToTower"); return false; }',
  '  _siegeRamTowerStep(ru, done) { this.__trace.push("ramTower"); return false; }',
  '  _isCatapult(bu) { return false; }',
  '  _isRam(bu) { return false; }',
  '  _siegeMachineRange(ru) { return 0; }',
  '  _attackWallTile(ru, row, done) { this.__trace.push("attackWall:" + row); }',
  '  _advanceToward(ru, col, row, done) { this.__trace.push("advanceToward:" + col + "," + row); }',
  '  _rangedAction(ru, done) { this.__trace.push("rangedAction"); }',
  '  _fallBackStep(ru, done) { this.__trace.push("fallBack"); }',
  '  _cavalryAction(ru, done) { this.__trace.push("cavalry"); }',
  '  _phalanxAction(ru, done) { this.__trace.push("phalanx"); }',
  '  _advanceStep(ru, done) { this.__trace.push("advanceStep"); }',
  '  _rangedTargetInRange(ru) { return null; }',
  '  _advanceCoord(ru) { return 0; }',
  '  _targetInRange(ru) { const t = ru.__target; if (t === null) return null; const e = (ru.side === "atk" ? this.def : this.atk)[t]; return this._enemiesOf(ru).includes(e) ? e : null; }',
  '  _doRangedAttack(a, d, done) { throw new Error("strzal poza zakresem"); }',
  '  _doMeleeAttack(a, d, done) { this.__trace.push("attack:" + d.__i); a.facing = facingFromTo(a.q, a.r, d.q, d.r, a.facing); this.__lastBlow = this._singleBlow(a, d, false); }',
  '  _sfxMelee() {}',
  '  _updateHpBar(u) {}',
  '  _wallBonusProcFor(d) { return d.bu.wallBonus; }',
  '  _resolveBlowOutcome(a, d, dmg, extra) { getOut().outcome = { dmg, extra }; if (!d.dead && !d.fadingOut && !d.removed && d.bu.hp <= 0) d.dead = true; return dmg; }',
  `  ${L(SCENE, 6048, 6299).replace('private _activateUnit', '_activateUnit')}`,
  `  ${L(SCENE, 9783, sceneEnd(9783)).replace('private _checkRout', '_checkRout')}`,
  `  ${L(SCENE, 8291, 8294).replace('private _enemiesOf', '_enemiesOf')}`,
  `  ${L(SCENE, 8296, sceneEnd(8296)).replace('private _nearestEnemy', '_nearestEnemy')}`,
  `  ${L(SCENE, 8334, sceneEnd(8334)).replace('private _updateFacing', '_updateFacingPin')}`,
  `  ${doAttackText.replace('private _doAttack', '_doAttack')}`,
  `  _singleBlow(attacker, defender, ranged) {\n${tf.body}\n  }`,
  '}',
  'export const __r = 1;',
].join('\n');
const Harness = new Function(...stubNames, 'tileName', 'getS', 'getOut',  `${stripTypeScriptTypes(classSrc, { mode: 'strip' }).replace(/export const __r = 1;/, '')}\nreturn Harness;`)(...stubNames.map((n) => stubs[n]), tileName, () => S, () => OUT);

// ---- PRNG ----
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
const n2s = (v) => String(v);

const KATEGORIE = ['Piechota', 'Lucznik', 'Kawaleria', 'Oblezenie'];

function genUnit(side, idx, q, r) {
  const hp0 = int(1, 150);
  const dead = chance(0.04);
  const fadingOut = !dead && chance(0.05);
  const routed = !dead && !fadingOut && chance(0.09);
  const mods = {
    atk: pick([0, 0.1, -0.25, 0.5, 1]), rangedAtk: pick([0, 0.2, -0.1, 0.5]), uderzenie: pick([0, 0.3, 1]),
    obrona: pick([0, 0.15, -0.5, 1]), pancerz: pick([0, 0.2, -0.3]),
  };
  return {
    side, idx, q, r,
    facing: int(0, 3),
    dead, fadingOut, routed,
    neverRout: chance(0.12),
    surroundApplied: chance(0.15),
    morale: int(0, 100),
    fleeMorale: int(5, 40),
    moveLeft: chance(0.7) ? int(1, 5) : 0,
    onWall: side === 'def' && chance(0.15),
    mounted: chance(0.08),
    phalanx: chance(0.08),
    hp: dead ? 0 : hp0,
    maxHp: hp0 + int(0, 60),
    target: null,
    unitRow: int(0, UNIT_ROWS.length - 1),
    kategoria: pick(KATEGORIE),
    veteran: pick([0, 0.1, 0.25, 0.5]),
    hungry: chance(0.3),
    goldDef: chance(0.3),
    pancerz: pick([0, 0.1, 0.15]),
    parametry: pick([0, 0.2]),
    fortified: chance(0.3),
    braces: chance(0.3),
    diff: pick([1, 1.2, 0.8, 1.5]),
    mods,
    wallBonus: chance(0.5) ? uni(0, 400) : 0,
  };
}

const unitName = (u) => `${u.side}${u.idx}`;
const buOf = (u) => ({
  id: unitName(u), nazwa: unitName(u), kategoria: u.kategoria, stats: { ...UNIT_ROWS[u.unitRow] },
  veteranBonusFrac: u.veteran, armyHungry: u.hungry, goldDeficit: u.goldDef,
  hp: u.hp, maxHp: u.maxHp, pancerzBonusFrac: u.pancerz, parametryBonusFrac: u.parametry,
  fortifiedInField: u.fortified, braces: u.braces, diff: u.diff, wallBonus: u.wallBonus,
});

// Szablon ciosu attacker -> target (CombatUnit z PRAWDZIWEGO toCombatUnit pinu).
function blowTemplate(a, d) {
  const cuA = realToCombatUnit(buOf(a), S.hunger, false, S.gold);
  const cuD = realToCombatUnit(buOf(d), S.hunger, false, S.gold);
  const numOrNull = (x) => (typeof x === 'number' && Number.isFinite(x) ? n2s(x) : null);
  const need = (x, what) => {
    const v = numOrNull(x);
    if (v === null) throw new Error(`pole ${what} nie jest skonczona liczba: ${x}`);
    return v;
  };
  return {
    atk: {
      weaponDamage: need(cuA.weaponDamage, 'weaponDamage'), piercing: need(cuA.piercing, 'piercing'),
      meleeAttack: need(cuA.meleeAttack, 'meleeAttack'), missileAttack: need(cuA.missileAttack ?? 0, 'missileAttack'),
      chargeBonus: need(cuA.chargeBonus, 'chargeBonus'), counterTyp: String(cuA.counterTyp), typNazwa: String(cuA.typNazwa),
    },
    def: {
      meleeDefence: need(cuD.meleeDefence, 'meleeDefence'), armor: need(cuD.armor, 'armor'),
      karaFlanka: numOrNull(cuD['Kara obrony z flanki (%)']), karaTyl: numOrNull(cuD['Kara obrony z tylu (%)']),
    },
    atkMods: { atk: n2s(a.mods.atk), rangedAtk: n2s(a.mods.rangedAtk), uderzenie: n2s(a.mods.uderzenie) },
    defMods: { obrona: n2s(d.mods.obrona), pancerz: n2s(d.mods.pancerz) },
    atkDiff: n2s(a.diff), defDiff: n2s(d.diff),
    atkMounted: a.mounted, defOnWall: d.onWall, defFortified: d.fortified, defBraces: d.braces,
    wallCiv: n2s(S.wallCiv), ctr: n2s(ctrOf(String(cuA.counterTyp), String(cuD.counterTyp))),
    isCity: S.isCity, wallBonus: n2s(d.wallBonus), gated: n2s(S.gated),
    fieldMult: n2s(tdmOf(d.onWall ? 'Plaskie (rownina/laka)' : tileName(d.q, d.r))),
    atkRiver: tileName(a.q, a.r) === 'Rzeka', riverRow: S.riverRow, riverMult: n2s(RIVER_MULT),
    atkFord: fordAt(a.q, a.r), defFord: fordAt(d.q, d.r), shore: shoreAt(d.q, d.r),
    brodKara: n2s(BROD.karaObrona), brodBrzeg: n2s(BROD.bonusObronaBrzegu), fortify: n2s(FORTIFY),
    defMaxHp: n2s(d.maxHp),
  };
}

function genSeq(id) {
  S = {
    tseed: int(0, 1000), ctrSeed: int(1, 99999), isCity: chance(0.3), wallTotal: chance(0.5) ? uni(0, 500) : 0,
    gated: pick([1, 1.25, 1.5, 2, 3]), riverRow: chance(0.5), wallCiv: pick([1, 1.2, 1.5]),
    hunger: pick([0.75, 0.5, 1]), gold: pick([0.75, 0.5, 1]),
    tdm: { Rzeka: 1, 'Plaskie (rownina/laka)': 1, Wzgorza: pick([1.5, 1.25]), Las: pick([1.75, 1.5, 1]) },
    rolls: [], rollIdx: 0, byId: {},
  };
  // Tryb "okrazenie": atk0 na (1,1) z 3-4 wrogami na sasiednich polach (K5H FACTOR 5, jednorazowy cios morale).
  const surroundMode = chance(0.3);
  const nA = int(1, 4);
  const nD = surroundMode ? int(3, 4) : int(1, 4);
  const cells = [];
  for (let q = 0; q < 4; q++) for (let r = 0; r < 3; r++) cells.push([q, r]);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = int(0, i);
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  let atkCells = cells.slice(0, nA);
  let defCells = cells.slice(nA, nA + nD);
  if (surroundMode) {
    const ring = [[0, 1], [2, 1], [1, 0], [1, 2]].slice(0, nD);
    const used = new Set([...ring, [1, 1]].map((c) => c.join(',')));
    const rest = cells.filter((c) => !used.has(c.join(',')));
    defCells = ring;
    atkCells = [[1, 1], ...rest.slice(0, nA - 1)];
  }
  const atk = Array.from({ length: nA }, (_, i) => genUnit('atk', i, ...atkCells[i]));
  const def = Array.from({ length: nD }, (_, i) => genUnit('def', i, ...defCells[i]));
  if (surroundMode) {
    Object.assign(atk[0], { dead: false, fadingOut: false, routed: false, neverRout: false, surroundApplied: false, hp: Math.max(1, atk[0].hp) });
    for (const d of def.slice(0, 3)) Object.assign(d, { dead: false, fadingOut: false, routed: false });
    atk[0].morale = pick([5, 10, 15, 20, 30, 60]);
  }
  for (const u of atk) u.target = chance(0.8) ? int(0, nD - 1) : null;
  for (const u of def) u.target = chance(0.8) ? int(0, nA - 1) : null;
  const all = [...atk, ...def];
  for (const u of all) {
    u.bu = buOf(u);
    S.byId[unitName(u)] = u;
  }
  for (const u of atk) u.blow = u.target === null ? null : blowTemplate(u, def[u.target]);
  for (const u of def) u.blow = u.target === null ? null : blowTemplate(u, atk[u.target]);
  const nAct = int(3, 8);
  const acts = [];
  for (let k = 0; k < nAct; k++) {
    const u = surroundMode && k === 0 ? atk[0] : pick(all);
    acts.push({ side: u.side, idx: u.idx, finished: surroundMode && k === 0 ? false : chance(0.04) });
    S.rolls.push(pick([0, 0.9999999999, 0.05, 0.95, rnd(), rnd(), rnd(), rnd()]));
  }
  return { id, atk, def, acts };
}

function runSeq(seq) {
  const h = new Harness();
  const mk = (u) => ({
    side: u.side, q: u.q, r: u.r, facing: u.facing, dead: u.dead, fadingOut: u.fadingOut, removed: false, routed: u.routed,
    neverRout: u.neverRout, surroundApplied: u.surroundApplied, morale: u.morale, fleeMorale: u.fleeMorale,
    range: 1, onWallWalkway: u.onWall, primaryRanged: false, mounted: u.mounted, phalanx: u.phalanx, shootingEnabled: true,
    dryCol: -1, heldAfterFallback: false, playerOrder: { type: 'none' }, moveLeft: u.moveLeft,
    bu: { ...u.bu }, __target: u.target, __i: u.idx, group: { rotation: { y: 0 } },
  });
  h.atk = seq.atk.map(mk);
  h.def = seq.def.map(mk);
  const runtimeOf = (side, idx) => (side === 'atk' ? h.atk : h.def)[idx];
  const expect = [];
  for (const a of seq.acts) {
    const ru = runtimeOf(a.side, a.idx);
    h.__trace = [];
    h.finished = a.finished;
    OUT = { u: null, hitRet: null, outcome: null, bracesCalled: false, arc: null };
    h.__lastBlow = undefined;
    const rollsBefore = S.rollIdx;
    h._activateUnit(ru, () => h.__trace.push('done'));
    let blow = null;
    if (h.__lastBlow !== undefined) {
      const tgtIdx = Number(h.__trace.filter((t) => t.startsWith('attack:')).pop().split(':')[1]);
      const tgt = runtimeOf(a.side === 'atk' ? 'def' : 'atk', tgtIdx);
      const missed = OUT.outcome === null;
      blow = {
        target: tgtIdx,
        missed,
        hitPct: n2s(OUT.hitRet),
        roll: n2s(OUT.u * 100),
        dmg: n2s(missed ? 0 : OUT.outcome.dmg),
        defHpAfter: n2s(tgt.bu.hp),
        extraMorale: missed ? null : n2s(OUT.outcome.extra),
        isCharge: OUT.bracesCalled && !tgt.bu.braces,
        arc: OUT.arc,
      };
      if (S.rollIdx !== rollsBefore + 1) throw new Error('cios zuzyl != 1 rzut');
    } else if (S.rollIdx !== rollsBefore) throw new Error('rzut bez ciosu');
    const state = (r) => ({
      hp: n2s(r.bu.hp), dead: r.dead, fadingOut: r.fadingOut, routed: r.routed, morale: n2s(r.morale),
      surroundApplied: r.surroundApplied, moveLeft: n2s(r.moveLeft), facing: n2s(r.facing),
    });
    expect.push({
      trace: h.__trace.slice(),
      blow,
      units: [...h.atk.map(state), ...h.def.map(state)],
      engaged: [...h.engaged].sort(),
    });
  }
  return expect;
}

const encUnit = (u) => ({
  side: u.side, idx: u.idx, q: u.q, r: u.r, hp: n2s(u.hp), maxHp: n2s(u.maxHp), morale: n2s(u.morale), fleeMorale: n2s(u.fleeMorale),
  neverRout: u.neverRout, dead: u.dead, fadingOut: u.fadingOut, routed: u.routed, surroundApplied: u.surroundApplied,
  moveLeft: n2s(u.moveLeft), facing: n2s(u.facing), onWall: u.onWall, mounted: u.mounted, phalanx: u.phalanx,
  tdmOwn: n2s(tdmOf(tileName(u.q, u.r))), target: u.target, blow: u.blow,
});

const sequences = [];
for (let i = 0; i < N_SEQ; i++) {
  const seq = genSeq(i);
  const expect = runSeq(seq);
  sequences.push({
    id: i,
    units: [...seq.atk, ...seq.def].map(encUnit),
    nAtk: seq.atk.length,
    acts: seq.acts,
    rolls: S.rolls.map(n2s),
    expect,
  });
}

const sumActs = (f) => sequences.reduce((s, q) => s + q.expect.filter((e, k) => f(e, q, k)).length, 0);
const cov = {
  sequences: sequences.length,
  activations: sequences.reduce((s, q) => s + q.acts.length, 0),
  blows: sumActs((e) => e.blow),
  hits: sumActs((e) => e.blow && !e.blow.missed),
  misses: sumActs((e) => e.blow && e.blow.missed),
  charges: sumActs((e) => e.blow && e.blow.isCharge),
  kills: sumActs((e) => e.blow && !e.blow.missed && Number(e.blow.defHpAfter) === 0),
  flee: sumActs((e) => e.trace.includes('flee')),
  surround: sumActs((e) => e.trace.includes('moraleBar')),
  startRout: sumActs((e) => e.trace.includes('startRout')),
  advanceStep: sumActs((e) => e.trace.includes('advanceStep')),
  cavalry: sumActs((e) => e.trace.includes('cavalry')),
  phalanx: sumActs((e) => e.trace.includes('phalanx')),
  doneOnly: sumActs((e) => e.trace.length === 1 && e.trace[0] === 'done'),
  repeatBlow: sumActs((e, q, k) => e.blow && q.expect.slice(0, k).some((p) => p.blow && q.acts[k].side === q.acts[q.expect.indexOf(p)].side
    && q.acts[k].idx === q.acts[q.expect.indexOf(p)].idx)),
  moveLeftPositive: sequences.filter((q) => q.units.some((u) => Number(u.moveLeft) > 0)).length,
  withFadingOut: sequences.filter((q) => q.units.some((u) => u.fadingOut)).length,
  withRouted: sequences.filter((q) => q.units.some((u) => u.routed)).length,
  withDead: sequences.filter((q) => q.units.some((u) => u.dead)).length,
  finishedActs: sequences.reduce((s, q) => s + q.acts.filter((a) => a.finished).length, 0),
  onWallDefender: sequences.filter((q) => q.units.some((u) => u.onWall)).length,
  // Cios A->B, potem B->A w tej samej sekwencji z INNYM lukiem (zmiana facing obrony po ciosie / aktywacji).
  reverseArcDiff: sequences.reduce((s, q) => s + q.expect.reduce((t, e, k) => {
    if (!e.blow) return t;
    const key = (side, idx) => `${side}${idx}`;
    const me = key(q.acts[k].side, q.acts[k].idx);
    const tgt = key(q.acts[k].side === 'atk' ? 'def' : 'atk', e.blow.target);
    const hit = q.expect.slice(0, k).some((p, j) => p.blow && key(q.acts[j].side, q.acts[j].idx) === tgt
      && key(q.acts[j].side === 'atk' ? 'def' : 'atk', p.blow.target) === me && p.blow.arc !== e.blow.arc);
    return t + (hit ? 1 : 0);
  }, 0), 0),
};
const outDir = join(here, 'p6_siege_tactics_loop_body_vectors');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors.json'), `${JSON.stringify({
  pin: PIN, activateSha256: activateDigest, blowSha256: blowDigest, unitFragmentSha256: uDigest, unitsSha256: unitsDigest,
  doAttackSha256: doAttackDigest, facingSha256: facingDigest, seed: SEED, coverage: cov, sequences,
})}\n`);
console.error(JSON.stringify(cov));
