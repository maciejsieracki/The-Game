// P4-1I3 BATTLE-ACTIONS (R-RUSTPORT-P4-1I3-BATTLE-ACTIONS, runda 1): generator wektorow AKCJI SCENY bitwy taktycznej
// (`Vec<BattleActionDto>`) dla sciezek juz portowanych: cios, kontratak, strzal wiezy, rout, smierc, koniec.
// Uruchomienie: node rust-port/engine/tests/p4_1i3_actions_gen.mjs (Node >= 22.13). Ziarno 2311.
// Wynik -> p4_1i3_actions_vectors/vectors.json. Konsument: p4_1i3_actions.rs.
//
// Baza harnessu: p6_siege_tactics_loop_body_gen.mjs (K5-LOOP-BODY r5; te same strazniki SHA fragmentow, te same
// helpery ciosu i toCombatUnit z units.json PINU). Roznice wzgledem tamtego generatora (P4-1I3):
//   WYKONYWANY TEKST PINU 07d2fbd72 (bez wstawek w logice): `_doMeleeAttack` (battleScene.ts:9096-9175) zamiast lustra,
//   `_singleBlow` (8809-9011, log `:8962`/`:8997`), `_resolveBlowOutcome` (9019-9068), `_pushClash` (9550-9566) + `sideTag`
//   (1091-1093), `_startRout`/`_startFade`/`_removeUnitFromScene`, `_fireOneTower` (4223-4270) + `pickTowerTarget`
//   (game/city-towers.ts:141), `_checkEnd` (10153-10239), `_finishDraw` (9467-9478), `_ffRoundCapResult` (9485-9497),
//   `_roundCapVerdict` (9449-9464), `commandersToWithdrawAfterArmyBreak` (army-leadership.ts:57), stale RANGED_FLY_MS,
//   BLOW_LUNGE_MS/BLOW_HIT_T/BLOW_SETTLE_MS, HPBAR_Y, CLASH_LOG_MAX, FF_MAX_ROUNDS, ARMY_MORALE_LOSS_THRESHOLD, lerp/easeIn/
//   easeOut (20716-20718). Straznik: SHA-256 tych fragmentow (ACTIONS_SHA256).
//   PRZECHWYCENIE WYWOLAN SCENY (instrumentacja, nie logika), kazde z czasem `this._now()`:
//     `ru.group.rotation.y = ...` -> facing (setter; wartosc = `ru.facing` w chwili przypisania);
//     pierwszy `_raf` w `_doMeleeAttack` (start lunge) -> melee {hitAt = t0 + BLOW_HIT_T};
//     `this.log.push(text)` -> log; `_spawnDamageLabel(ru, dmg)` -> damage; `_renderClashLog` po `_pushClash` -> clash
//     (tekst = `clashLogEntries[0]`); `_startRout` po strazniku (= `_sfxRout`) -> rout; `_startFade` po strazniku
//     (= `_sfxDeath`) -> kill; `projectiles.push` w `_fireOneTower` -> towerShot {landAt = t0 + dur};
//     `_showEndScreen(winner)` -> end.
//   ZEGAR: `_now()` = czas wirtualny harnessu; `_raf` = kolejka klatek odpalana w chwilach t0, t0+BLOW_HIT_T,
//     t0+BLOW_LUNGE_MS; `_schedule(ms, fn)` = kolejka (trafienie wiezy po RANGED_FLY_MS).
//   ZASTUBOWANE jak w K5-LOOP-BODY (jawnie NIEPORTOWANE w Rust, NIE_ZMIERZONO): `_shakeAlliesOnLoss` (ripple), efekty
//     dowodcy (isArmyCommander = false), `occByKey`/`routedUnits`, ruch/doktryna/strzelec, render 3D (THREE, siatki,
//     `cellToWorld`/`tileTopY` jako proste stuby; nie wplywaja na akcje), dzwieki.
//   WIEZA: cel `neverRout = true` (skutki `_resolveBlowOutcome` trafienia wiezy poza zabiciem sa w Rust nieportowane,
//     `ProdBody::tower_blow` wpis `wieza-resolveBlowOutcome-efekty`); luk ciosu wiezy = `relativeHit` pinu w chwili
//     generacji (szablon wiezy w Rust niesie staly luk).
// Zakres sekwencji ciosu: AUTO, bez oblezenia (siegeWallCol = -1), cios w zwarciu, bez strzelca, bez doktryny.

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
const ARMY = 'gra/src/game/army-leadership.ts';
const PARAMS = 'gra/data/combat-params.json';
const UNITS = 'gra/data/units.json';
const ACTIVATE_SHA256 = '3be85ac2fba725bf618b61c817c891c1d994d2b7df3615d01552c6c2774ddb00';
const BLOW_SHA256 = 'b2f9e19f1e35644e0e2ea636a9d50a02dd10d729355de5eb3eb35668910e5526';
const UNIT_FRAGMENT_SHA256 = 'd1b401a2275ab01569dd16ec1a6a3618ae56b592dd13c4f900b82b252755016c';
const UNITS_SHA256 = '7b509817d1c613a526ea0e8066a62f340f46a29fedd6f79f0c647195727bc6d7';
const DOATTACK_SHA256 = '592a6cbc279655a09b13fe9cd5ccbad24b325fa093610d685d5d9461729b41c1';
const FACING_SHA256 = '6d4858eded6e566c91a2874b30a5eabff0080b477bbf29c02a1a67f69493eae3';
const COUNTER_SHA256 = '3913ba4050eaa30429418fade9b1a2b2adc374f1abe1a65f9291c96568e83ce7';
const OUTCOME_SHA256 = '6cc2b1e08bcee451d42d8d022c446c6ef42f8e4d045087dff5a653d7a09f737c';
const N_SEQ = 320;
const SEED = 2301;

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const gitShow = (path) => execFileSync('git', ['show', `${PIN}:${path}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const lines = Object.fromEntries([SCENE, COMBAT, CITY, UNIT_POWER, CIV, ARMY].map((p) => [p, gitShow(p).split('\n')]));
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
// ---- DIR (r5): const enum Dir jest WYKONYWANY z pinu (battleScene.ts:315-320), a nie z reczne wpisanego preludium.
// Wycinek pinu -> strip-transform TS->JS dla samego enum (node:module, tryb transform) -> wykonanie; strażnik SHA-256
// wycinka i wartosci N/E/S/W. Skrot wektorow (facingSha256) liczony z tekstu preludium WYPROWADZONEGO z wykonanego Dir
// (DIR_FROM_EXEC), ktory musi byc rowny DIR_LEGACY_PRELUDE (historyczny zapis, zeby vectors.json pozostal bajt-w-bajt
// identyczny). Zmiana wartosci w pinie zatrzymuje generator, nie tylko zmienia skrot.
const DIR_FIRST = 315;
const DIR_LAST = 320;
const DIR_SLICE_SHA256 = '782aa85e7b85a520cdbcbc0dbcd5740e85fffd5ba7f3fc1fe9f9f0f3d07103d7';
const DIR_LEGACY_PRELUDE = 'const Dir = { N: 0, E: 1, S: 2, W: 3 };';
expectLine(SCENE, DIR_FIRST, 'export const enum Dir {');
expectLine(SCENE, DIR_LAST, '}');
const dirJsOf = (sliceText) => stripTypeScriptTypes(sliceText.replace(/^export /gm, ''), { mode: 'transform' });
const assertDirValues = (js) => {
  const values = new Function(`${js}\nreturn Dir;`)();
  for (const [k, v] of Object.entries({ N: 0, E: 1, S: 2, W: 3 })) {
    if (values[k] !== v) throw new Error(`Dir.${k} = ${values[k]} != ${v}`);
  }
  if (Object.keys(values).filter((k) => !/^\d+$/.test(k)).length !== 4) throw new Error('Dir ma inne klucze niz N/E/S/W');
  return values;
};
const dirSliceOf = (sliceText) => {
  const digest = createHash('sha256').update(sliceText).digest('hex');
  if (digest !== DIR_SLICE_SHA256) throw new Error(`SHA wycinka const enum Dir zmieniony: ${digest}`);
  const js = dirJsOf(sliceText);
  const values = assertDirValues(js);
  // Tekst preludium wyprowadzony WYKONANYM Dir (nie z tekstu): musi byc bajt-w-bajt rowny historycznemu zapisowi.
  const fromExec = `const Dir = { ${['N', 'E', 'S', 'W'].map((k) => `${k}: ${values[k]}`).join(', ')} };`;
  if (fromExec !== DIR_LEGACY_PRELUDE) throw new Error(`wykonany Dir != preludium: "${fromExec}"`);
  return { js, fromExec };
};
// Samotesty mutacji (zamiana kierunkow E<->S w wycinku; wyjscie 0 = FAIL wykryty, 1 = mutant przeszedl):
//   P6_DIR_MUTANT_SELFTEST=1 -> pelna sciezka dirSliceOf (lapie strazbnik SHA wycinka);
//   P6_DIR_MUTANT_SELFTEST=2 -> sama asercja wartosci N/E/S/W (SHA pominiete tylko w tym samotescie).
if (process.env.P6_DIR_MUTANT_SELFTEST === '1' || process.env.P6_DIR_MUTANT_SELFTEST === '2') {
  const mutant = L(SCENE, DIR_FIRST, DIR_LAST).replace('E = 1', 'E = 2').replace('S = 2', 'S = 1');
  const mode = process.env.P6_DIR_MUTANT_SELFTEST;
  try {
    if (mode === '1') dirSliceOf(mutant);
    else assertDirValues(dirJsOf(mutant));
  } catch (e) {
    console.error(`selftest Dir (tryb ${mode}): mutant odrzucony (FAIL): ${e.message}`);
    process.exit(0);
  }
  console.error(`selftest Dir (tryb ${mode}): mutant PRZESZEDL (brak FAIL)`);
  process.exit(1);
}
const { js: DIR_JS, fromExec: DIR_FROM_EXEC } = dirSliceOf(L(SCENE, DIR_FIRST, DIR_LAST));
const facingParts = [
  DIR_FROM_EXEC,
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

// ---- KONTRATAK (K5LOOP-KONTRATAK): pin 07d2fbd72, gra/src/battle/battleScene.ts.
// (a) TEKST `_defenderCounters` (9079-9092) jest WYKONYWANY (z `_counterBudget.canCounter` i `canShoot`).
// (b) Blok COUNTER-ATTACK z `_doMeleeAttack` (9134-9143) jest LUSTRZANY w stubie `_doMeleeAttack` (zawiera wywolania
//     renderu: `dirYaw`, `group.rotation`, `_spawnDamageLabel`), ale jego tekst jest pod strazem SHA.
// (c) Klasa `DefenderCounterBudget` + stala `COUNTERS_PER_DEFENDER_PER_TURN` z combat.ts (WYKONYWANA, prawdziwa klasa).
expectLine(SCENE, 9079, 'private _defenderCounters(defender: RuntimeBattleUnit, _attacker: RuntimeBattleUnit): boolean {');
expectLine(SCENE, 9134, 'if (this._defenderCounters(defender, attacker)) {');
if (lines[SCENE][9142] !== '        }') throw new Error('pin battleScene.ts:9143 != konczace "        }" bloku kontrataku');
const counterDefText = L(SCENE, 9079, sceneEnd(9079));
const counterBlockText = L(SCENE, 9134, 9143);
const budgetStart = lines[COMBAT].findIndex((l) => l.startsWith('export class DefenderCounterBudget {')) + 1;
const countersLine = lines[COMBAT].findIndex((l) => l.startsWith('export const COUNTERS_PER_DEFENDER_PER_TURN = 1;')) + 1;
if (budgetStart < 1 || countersLine < 1) throw new Error('pin combat.ts: brak DefenderCounterBudget/COUNTERS');
const budgetText = `${L(COMBAT, countersLine, countersLine)}\n${L(COMBAT, budgetStart, fnRange(COMBAT, budgetStart)[1])}`;
const counterDigest = createHash('sha256').update([counterDefText, counterBlockText, budgetText].join('\n---\n')).digest('hex');
if (counterDigest !== COUNTER_SHA256) throw new Error(`SHA fragmentow kontrataku zmieniony: ${counterDigest}`);

// ---- EFEKTY PO CIOSIE (K5LOOP-OUTCOME): tekst pinu 07d2fbd72 wykonywany w Harness (bez zadnych wstawek w logice).
expectLine(SCENE, 1129, 'const MORALE_DEATH_RADIUS');
expectLine(SCENE, 1141, 'const MORALE_ENEMY_BREAK_GAIN');
expectLine(SCENE, 1144, 'const MORALE_ARMY_COLLAPSE_RATIO');
expectLine(SCENE, 1145, 'const MORALE_ARMY_COLLAPSE_MULT');
expectLine(SCENE, 9019, 'private _resolveBlowOutcome(attacker: RuntimeBattleUnit');
expectLine(SCENE, 9695, 'private _gainMorale(ru: RuntimeBattleUnit');
expectLine(SCENE, 9707, 'private _boostEnemiesOnBreak(fallen: RuntimeBattleUnit)');
expectLine(SCENE, 9722, 'private _applyMoraleDamage(victim: RuntimeBattleUnit');
expectLine(SCENE, 9761, 'private _checkMeleeScreenLost(side:');
expectLine(SCENE, 9799, 'private _startRout(ru: RuntimeBattleUnit)');
expectLine(SCENE, 9910, 'private _removeUnitFromScene(ru: RuntimeBattleUnit)');
expectLine(SCENE, 9927, 'private _startFade(ru: RuntimeBattleUnit)');
expectLine(SCENE, 9988, "private _armyMoraleRatio(side: 'atk' | 'def')");
const armyStart = lines[ARMY].findIndex((l) => l.startsWith('export function armyMoraleRatioWithoutCommander(')) + 1;
if (armyStart < 1) throw new Error('pin army-leadership.ts: brak armyMoraleRatioWithoutCommander');
const outcomeParts = {
  consts: [L(SCENE, 1129, 1129), L(SCENE, 1141, 1141), L(SCENE, 1144, 1145)].join('\n'),
  resolve: L(SCENE, 9019, sceneEnd(9019)),
  gain: L(SCENE, 9695, sceneEnd(9695)),
  boost: L(SCENE, 9707, sceneEnd(9707)),
  applyMorale: L(SCENE, 9722, sceneEnd(9722)),
  screenLost: L(SCENE, 9761, sceneEnd(9761)),
  startRout: L(SCENE, 9799, sceneEnd(9799)),
  removeFromScene: L(SCENE, 9910, sceneEnd(9910)),
  startFade: L(SCENE, 9927, sceneEnd(9927)),
  armyRatio: L(SCENE, 9988, sceneEnd(9988)),
  armyFn: L(ARMY, armyStart, fnRange(ARMY, armyStart)[1]),
};
const outcomeDigest = createHash('sha256').update(Object.keys(outcomeParts).map((n) => `${n}\n${outcomeParts[n]}`).join('\n---\n')).digest('hex');
if (outcomeDigest !== OUTCOME_SHA256) throw new Error(`SHA fragmentow efektow po ciosie zmieniony: ${outcomeDigest}`);

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


// ==================================================================================================================
// P4-1I3: dodatkowe fragmenty pinu (WYKONYWANE) i straznik SHA.
// ==================================================================================================================
const TOWERS = 'gra/src/game/city-towers.ts';
const towerLines = gitShow(TOWERS).split('\n');
const towerFnStart = towerLines.findIndex((l) => l.startsWith('export function pickTowerTarget(')) + 1;
if (towerFnStart !== 141) throw new Error(`pin city-towers.ts: pickTowerTarget nie na 141 (${towerFnStart})`);
let towerFnEnd = towerFnStart;
while (towerLines[towerFnEnd - 1] !== '}') towerFnEnd += 1;
const commStart = lines[ARMY].findIndex((l) => l.startsWith('export function commandersToWithdrawAfterArmyBreak<')) + 1;
if (commStart !== 57) throw new Error(`pin army-leadership.ts: commandersToWithdrawAfterArmyBreak nie na 57 (${commStart})`);
expectLine(SCENE, 1012, 'const RANGED_FLY_MS   = 380;');
expectLine(SCENE, 1020, 'const BLOW_LUNGE_MS   = 260;');
expectLine(SCENE, 1021, 'const BLOW_HIT_T      = 150;');
expectLine(SCENE, 1022, 'const BLOW_SETTLE_MS  = 220;');
expectLine(SCENE, 1043, 'const HPBAR_Y = 0.72;');
expectLine(SCENE, 1089, 'const CLASH_LOG_MAX = 10;');
expectLine(SCENE, 1091, "function sideTag(side: 'atk' | 'def'): string {");
expectLine(SCENE, 1125, 'const FF_MAX_ROUNDS = 400;');
expectLine(SCENE, 1157, 'const ARMY_MORALE_LOSS_THRESHOLD = 0.25;');
expectLine(SCENE, 4223, 'private _fireOneTower(');
expectLine(SCENE, 9096, 'private _doMeleeAttack(attacker: RuntimeBattleUnit, defender: RuntimeBattleUnit, done: () => void): void {');
expectLine(SCENE, 9449, 'private _roundCapVerdict()');
expectLine(SCENE, 9467, 'private _finishDraw(reason: string, cap: number): void {');
expectLine(SCENE, 9485, 'private _ffRoundCapResult(): void {');
expectLine(SCENE, 9550, 'private _pushClash(');
expectLine(SCENE, 10153, 'private _checkEnd(): boolean {');
// P4-1I3 r1 obrona (zarzut 1): `_spawnDamageLabel` (`:9940`) konczy sie od razu w trybie FF (`:9943`). Straznik
// sygnatury i linii pierwszej instrukcji; TEKST linii `:9943` jest wykonywany w stubie `_spawnDamageLabel` przed zapisem
// akcji damage (reszta metody to DOM etykiety, poza zakresem akcji).
expectLine(SCENE, 9940, 'private _spawnDamageLabel(ru: RuntimeBattleUnit, dmg: number): void {');
expectLine(SCENE, 9943, 'if (this._ffActive) return;');
if (lines[SCENE][9942].trim() !== 'if (this._ffActive) return;') throw new Error('pin battleScene.ts:9943 != straznik FF');
const DAMAGE_FF_GUARD = lines[SCENE][9942].trim();
expectLine(SCENE, 20716, 'function lerp(');
expectLine(SCENE, 20718, 'function easeIn(');
const actParts = {
  consts: [L(SCENE, 1012, 1012), L(SCENE, 1020, 1022), L(SCENE, 1043, 1043), L(SCENE, 1089, 1089), L(SCENE, 1125, 1125), L(SCENE, 1157, 1157)].join('\n'),
  sideTag: L(SCENE, 1091, 1093),
  ease: L(SCENE, 20716, 20718),
  pickTowerTarget: towerLines.slice(towerFnStart - 1, towerFnEnd).join('\n'),
  commanders: L(ARMY, commStart, fnRange(ARMY, commStart)[1]),
  fireOneTower: L(SCENE, 4223, sceneEnd(4223)),
  doMelee: L(SCENE, 9096, sceneEnd(9096)),
  roundCap: L(SCENE, 9449, sceneEnd(9449)),
  finishDraw: L(SCENE, 9467, sceneEnd(9467)),
  ffCap: L(SCENE, 9485, sceneEnd(9485)),
  pushClash: L(SCENE, 9550, sceneEnd(9550)),
  checkEnd: L(SCENE, 10153, sceneEnd(10153)),
};
const ACTIONS_SHA256 = '07ee4ff453a537c9b89ff15aaa0062ec1772ca37afe1a85bb16afb1c242c2cf5';
const actionsDigest = createHash('sha256').update(Object.keys(actParts).map((n) => `${n}\n${actParts[n]}`).join('\n---\n')).digest('hex');
if (process.env.P4_1I3_PRINT_SHA === '1') { console.error(`actions sha256 = ${actionsDigest}`); }
else if (actionsDigest !== ACTIONS_SHA256) throw new Error(`SHA fragmentow akcji zmieniony: ${actionsDigest}`);
const constOf = (line) => Number(/=\s*([0-9.]+)/.exec(L(SCENE, line, line))[1]);
const BLOW_HIT_T = constOf(1021);
const BLOW_LUNGE_MS = constOf(1020);

// ==================================================================================================================
// Stuby (dane sceny jak w K5-LOOP-BODY + render 3D bez wplywu na akcje).
// ==================================================================================================================
OUT = { u: null, hitRet: null, bracesCalled: false };
const MathStub = Object.assign(Object.create(Math), {
  random: () => {
    if (S.rollIdx >= S.rolls.length) throw new Error('kolejka rzutow wyczerpana');
    const u = S.rolls[S.rollIdx++];
    OUT.u = u;
    return u;
  },
});
class Vec3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  subVectors(a, b) { this.x = a.x - b.x; this.y = a.y - b.y; this.z = a.z - b.z; return this; }
  lengthSq() { return this.x * this.x + this.y * this.y + this.z * this.z; }
  normalize() { return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
}
class Quat { setFromUnitVectors() { return this; } copy() { return this; } }
const stubs = {
  toCombatUnit: (bu, hungerMult, skipHunger, goldMult) => {
    const cu = realToCombatUnit(bu, hungerMult, skipHunger, goldMult);
    cuOwner.set(cu, bu.id);
    return cu;
  },
  dirYaw: () => 0,
  battleUnitCivBonusy: (bu, list) => list,
  civCombatStatMultipliers: (bonusy, cu) => S.byId[cuOwner.get(cu)].mods,
  mergeBuildingBonusIntoStatMultipliers: (mods) => mods,
  fieldFortifyDefenseBonus: realFortify,
  applyMultiplier: realApply,
  // Strzelec wiezy (bu z `_fireOneTower`, bez pola `diff`): mnoznik trudnosci z danych sceny (1).
  battleUnitDifficultyCombatMult: (bu) => (bu.diff === undefined ? S.byId[bu.id].diff : bu.diff),
  civWallDefenseMultiplier: () => S.wallCiv,
  rangedShotAccuracy: realRangedShot,
  counterMultiplier: (a, b) => ctrOf(a, b),
  hitChanceTw: (...args) => helperFns.hitChanceTw(...args),
  rangeDamage: helperFns.rangeDamage,
  baseDamage: helperFns.baseDamage,
  rangedDamageMultFor: realRdm,
  bracesAgainstCharge: (bu) => bu.braces,
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
  cellKey: (q, r) => `${q},${r}`,
  canShoot: () => false,
  isSiegeUnit: () => false,
  isSiegeTower: () => false,
  // Render 3D (`_doMeleeAttack`, `_fireOneTower`): pozycje bez wplywu na akcje; `to` pocisku = kafel celu.
  cellToWorld: (col, row) => ({ x: col, z: row }),
  tileTopY: () => 0,
  TILE_S: 1,
  THREE: { Vector3: Vec3, Quaternion: Quat },
  makeProjectileMesh: () => ({ group: { position: new Vec3(), quaternion: new Quat() }, geos: [], mats: [] }),
  projectileKind: () => 'arrow',
};
const stubNames = Object.keys(stubs);

const classSrc = [
  L(SCENE, 1142, 1143), L(SCENE, 1161, 1161), L(SCENE, 1917, 1919),
  outcomeParts.consts,
  outcomeParts.armyFn.replace(/^export /gm, ''),
  actParts.consts,
  actParts.sideTag,
  actParts.ease,
  actParts.pickTowerTarget.replace(/^export /gm, ''),
  actParts.commanders.replace(/^export /gm, ''),
  DIR_JS,
  L(SCENE, 347, fnRange(SCENE, 347)[1]).replace(/^export /gm, ''),
  L(SCENE, 359, fnRange(SCENE, 359)[1]).replace(/^export /gm, ''),
  L(SCENE, 370, fnRange(SCENE, 370)[1]).replace(/^export /gm, ''),
  L(SCENE, 385, fnRange(SCENE, 385)[1]).replace(/^export /gm, ''),
  L(COMBAT, countersLine, countersLine).replace(/^export /gm, ''),
  L(COMBAT, budgetStart, fnRange(COMBAT, budgetStart)[1]).replace(/^export /gm, ''),
  'class Harness {',
  '  constructor() { this.atk = []; this.def = []; this.finished = false; this._manualMode = false; this.siegeWallCol = -1; this.gateOpen = false; this._counterBudget = new DefenderCounterBudget();',
  '    this.wallTileHp = new Map(); this._autoBatchPlanning = null; this.engaged = new Set();',
  '    this.terrainMap = { combatTerrainName: (q, r) => tileName(q, r) }; this.terrainData = {};',
  '    this.armyHungerStatMult = getS().hunger; this.goldDeficitStatMult = getS().gold; this.isCityDefenseBattle = getS().isCity;',
  '    this.wallDefenseTotalProc = getS().wallTotal; this.attackerCivBonusy = []; this.defenderCivBonusy = []; this.attackerOwnTerritory = false;',
  '    this.defenderOwnTerritory = false; this.shallowSea = false; this.attackerDifficultyCombatMult = 1; this.defenderDifficultyCombatMult = 1;',
  '    this.counters = []; this.terrain = "Plaskie (rownina/laka)"; this.occByKey = new Map(); this.routedUnits = []; this.scene = { remove() {}, add() {} };',
  // P4-1I3: zapis akcji sceny, zegar, kolejki klatek i `_schedule`, bufor panelu starc, log jako przechwycenie.
  '    this.__acts = []; this.__now = 0; this.__raf = []; this.__sched = []; this.__melee = null; this.busy = false; this._autoBattleSuspended = false;',
  '    this._ffActive = false; this._ffQueue = []; this.clashLogEntries = []; this.wallEverBreached = false; this.roundNo = 1; this._stalled = false;',
  '    this.log = { push: (text) => this.__act({ k: "log", text }) };',
  '    this.projectiles = { push: (p) => { const u = this.atk.find((e) => e.q === p.to.x && e.r === p.to.z); this.__act({ k: "towerShot", row: this.__towerRow, target: u.__key, landAt: p.t0 + p.dur }); } }; }',
  '  __act(o) { this.__acts.push({ t: this.__now, ...o }); }',
  '  _now() { return this.__now; }',
  '  _raf(cb) { if (this.__melee) { const [a, d] = this.__melee; this.__melee = null; this.__act({ k: "melee", attacker: a.__key, target: d.__key, hitAt: this.__now + BLOW_HIT_T }); } this.__raf.push(cb); }',
  '  _schedule(ms, fn) { this.__sched.push({ at: this.__now + ms, fn }); }',
  '  _fleeStep(ru, done) {}',
  '  _applyTerrainRange(ru) {}',
  '  _performPlayerOrder(ru, done) { return false; }',
  '  _isPlayerSide(side) { return false; }',
  '  _isUnitDoctrineAuto(ru) { return false; }',
  '  _effectiveMetaForUnit(ru) { return { doctrine: "steady" }; }',
  '  _executeGroupDoctrineStep(ru, meta, done) { return false; }',
  '  _updateMoraleBar(ru) {}',
  '  _updateHpBar(u) {}',
  '  _updateArmyMoraleBars() {}',
  // `_startRout`: po strazniku pierwsze wywolanie sceny to `_sfxRout()` (`:9801`) -> akcja rout; dalej TEKST pinu.
  '  _startRout(ru) { if (!(ru.routed || ru.dead || ru.fadingOut)) this.__act({ k: "rout", id: ru.__key }); return this._startRoutPin(ru); }',
  // `_startFade`: po strazniku (bez dowodcy) `_sfxDeath()` + `_removeUnitFromScene` (`:9933-9937`) -> akcja kill.
  '  _startFade(ru) { if (!(ru.fadingOut || ru.dead || ru.removed)) this.__act({ k: "kill", id: ru.__key }); return this._startFadePin(ru); }',
  '  _sfxRout() {}',
  '  _sfxDeath() {}',
  '  _sfxMelee() {}',
  '  _sfxShot() {}',
  `  _spawnDamageLabel(ru, dmg) { ${DAMAGE_FF_GUARD} this.__act({ k: "damage", target: ru.__key, dmg }); }`,
  '  _pushClash(a, d, dmg, tag) { this.__clash = [a, d, dmg, tag]; return this._pushClashPin(a, d, dmg, tag); }',
  '  _renderClashLog() { const [a, d, dmg, tag] = this.__clash; this.__act({ k: "clash", attacker: a.__key ?? a.bu.id, target: d.__key, dmg, tag, text: this.clashLogEntries[0] }); }',
  '  _shakeAlliesOnLoss(fallen) {}',
  '  _removeCommanderMoraleBonus(side) { throw new Error("efekty dowodcy poza zakresem (isArmyCommander = false)"); }',
  '  _disableManualIfCommanderLost(side) { throw new Error("efekty dowodcy poza zakresem (isArmyCommander = false)"); }',
  '  _gainMorale(ru, amount) { return this._gainMoralePin(ru, amount); }',
  '  _boostEnemiesOnBreak(f) { return this._boostEnemiesOnBreakPin(f); }',
  '  _armyMoraleRatio(side) { return this._armyMoraleRatioPin(side); }',
  '  _trySiegeTowerClimb(ru, done) { return false; }',
  '  _siegeInfantryToTowerStep(ru, done) { return false; }',
  '  _siegeRamTowerStep(ru, done) { return false; }',
  '  _isCatapult(bu) { return false; }',
  '  _isRam(bu) { return false; }',
  '  _siegeMachineRange(ru) { return 0; }',
  '  _attackWallTile(ru, row, done) {}',
  '  _advanceToward(ru, col, row, done) {}',
  '  _rangedAction(ru, done) {}',
  '  _fallBackStep(ru, done) {}',
  '  _cavalryAction(ru, done) {}',
  '  _phalanxAction(ru, done) {}',
  '  _advanceStep(ru, done) {}',
  '  _rangedTargetInRange(ru) { return null; }',
  '  _advanceCoord(ru) { return 0; }',
  '  _targetInRange(ru) { const t = ru.__target; if (t === null) return null; const e = (ru.side === "atk" ? this.def : this.atk)[t]; return this._enemiesOf(ru).includes(e) ? e : null; }',
  '  _doRangedAttack(a, d, done) { throw new Error("strzal poza zakresem"); }',
  '  _wallBonusProcFor(d) { return d.bu.wallBonus; }',
  '  _battleUnitsForMapExport(list) { return []; }',
  '  _showEndScreen(winner) { this.__act({ k: "end", winner }); }',
  // `_doMeleeAttack`: znacznik startu lunge (pierwszy `_raf`) + TEKST pinu.
  '  _doMeleeAttack(a, d, done) { this.__melee = [a, d]; return this._doMeleeAttackPin(a, d, done); }',
  '  _fireOneTower(t, shooterRow, nazwa, hp) { this.__towerRow = t.row; return this._fireOneTowerPin(t, shooterRow, nazwa, hp); }',
  `  ${L(SCENE, 9079, sceneEnd(9079)).replace('private _defenderCounters', '_defenderCounters')}`,
  `  ${actParts.doMelee.replace('private _doMeleeAttack', '_doMeleeAttackPin')}`,
  `  ${actParts.fireOneTower.replace('private _fireOneTower', '_fireOneTowerPin')}`,
  `  ${actParts.pushClash.replace('private _pushClash', '_pushClashPin')}`,
  `  ${actParts.roundCap.replace('private _roundCapVerdict', '_roundCapVerdict')}`,
  `  ${actParts.finishDraw.replace('private _finishDraw', '_finishDraw')}`,
  `  ${actParts.ffCap.replace('private _ffRoundCapResult', '_ffRoundCapResult')}`,
  `  ${actParts.checkEnd.replace('private _checkEnd', '_checkEnd')}`,
  `  ${outcomeParts.resolve.replace('private _resolveBlowOutcome', '_resolveBlowOutcome')}`,
  `  ${outcomeParts.gain.replace('private _gainMorale', '_gainMoralePin')}`,
  `  ${outcomeParts.boost.replace('private _boostEnemiesOnBreak', '_boostEnemiesOnBreakPin')}`,
  `  ${outcomeParts.applyMorale.replace('private _applyMoraleDamage', '_applyMoraleDamage')}`,
  `  ${outcomeParts.screenLost.replace('private _checkMeleeScreenLost', '_checkMeleeScreenLost')}`,
  `  ${outcomeParts.startRout.replace('private _startRout', '_startRoutPin')}`,
  `  ${outcomeParts.removeFromScene.replace('private _removeUnitFromScene', '_removeUnitFromScene')}`,
  `  ${outcomeParts.startFade.replace('private _startFade', '_startFadePin')}`,
  `  ${outcomeParts.armyRatio.replace('private _armyMoraleRatio', '_armyMoraleRatioPin')}`,
  `  ${L(SCENE, 6048, 6299).replace('private _activateUnit', '_activateUnit')}`,
  `  ${L(SCENE, 9783, sceneEnd(9783)).replace('private _checkRout', '_checkRout')}`,
  `  ${L(SCENE, 8291, 8294).replace('private _enemiesOf', '_enemiesOf')}`,
  `  ${L(SCENE, 8296, sceneEnd(8296)).replace('private _nearestEnemy', '_nearestEnemy')}`,
  `  ${L(SCENE, 8334, sceneEnd(8334)).replace('private _updateFacing', '_updateFacing')}`,
  `  ${doAttackText.replace('private _doAttack', '_doAttack')}`,
  `  _singleBlow(attacker, defender, ranged) {\n${tf.body}\n  }`,
  '}',
  'export const __r = 1;',
].join('\n');
const { Harness, relativeHit } = new Function(...stubNames, 'tileName', 'getS', `${stripTypeScriptTypes(classSrc, { mode: 'strip' }).replace(/export const __r = 1;/, '')}\nreturn { Harness, relativeHit };`)(...stubNames.map((n) => stubs[n]), tileName, () => S);

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
const SEED_ACT = 2311;
const rnd = mulberry32(SEED_ACT);
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
const uni = (lo, hi) => lo + rnd() * (hi - lo);
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const chance = (p) => rnd() < p;
const n2s = (v) => String(v);

const KATEGORIE = ['Piechota', 'Lucznik', 'Kawaleria', 'Oblezenie'];
const ZERO_MODS = { atk: 0, rangedAtk: 0, uderzenie: 0, obrona: 0, pancerz: 0 };

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
    moraleMaxExtra: pick([0, 0, 5, 20, 60, 120]),
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

// Szablon ciosu attacker -> target (CombatUnit z PRAWDZIWEGO toCombatUnit pinu); `buA` = bu atakujacego (wieza: bu
// syntetycznego strzelca z `_fireOneTower`).
function blowTemplate(a, d, buA = buOf(a)) {
  const cuA = realToCombatUnit(buA, S.hunger, false, S.gold);
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

function newScene() {
  S = {
    tseed: int(0, 1000), ctrSeed: int(1, 99999), isCity: chance(0.3), wallTotal: chance(0.5) ? uni(0, 500) : 0,
    gated: pick([1, 1.25, 1.5, 2, 3]), riverRow: chance(0.5), wallCiv: pick([1, 1.2, 1.5]),
    hunger: pick([0.75, 0.5, 1]), gold: pick([0.75, 0.5, 1]),
    tdm: { Rzeka: 1, 'Plaskie (rownina/laka)': 1, Wzgorza: pick([1.5, 1.25]), Las: pick([1.75, 1.5, 1]) },
    rolls: [], rollIdx: 0, byId: {},
  };
}

// Runtime jednostki dla harnessu; `group.rotation.y = …` = akcja facing (wartosc `ru.facing` w chwili przypisania).
function runtimeOf(h, u) {
  const ru = {
    side: u.side, q: u.q, r: u.r, facing: u.facing, dead: u.dead, fadingOut: u.fadingOut, removed: false, routed: u.routed,
    moraleMax: u.morale + u.moraleMaxExtra, isArmyCommander: false, acted: false, screenLostApplied: false,
    mats: [], perTokenGeos: [],
    neverRout: u.neverRout, surroundApplied: u.surroundApplied, morale: u.morale, fleeMorale: u.fleeMorale,
    range: 1, onWallWalkway: u.onWall, primaryRanged: false, mounted: u.mounted, phalanx: u.phalanx, shootingEnabled: true,
    dryCol: -1, heldAfterFallback: false, playerOrder: { type: 'none' }, moveLeft: u.moveLeft,
    bu: { ...u.bu }, __target: u.target, __i: u.idx, __key: unitName(u),
  };
  ru.group = {
    rotation: { set y(_v) { h.__act({ k: 'facing', id: ru.__key, dir: ru.facing }); } },
    position: { set() {} },
    visible: true,
  };
  ru.hpBarGroup = { position: { set() {} }, visible: true };
  return ru;
}

// Kanoniczny zapis akcji (ten sam w p4_1i3_actions.rs): liczby jak `String(x)` w JS.
function enc(a) {
  const t = n2s(a.t);
  switch (a.k) {
    case 'facing': return `${t} facing ${a.id} ${n2s(a.dir)}`;
    case 'melee': return `${t} melee ${a.attacker} ${a.target} ${n2s(a.hitAt)}`;
    case 'log': return `${t} log ${a.text}`;
    case 'damage': return `${t} damage ${a.target} ${n2s(a.dmg)}`;
    case 'clash': return `${t} clash ${a.attacker} ${a.target} ${n2s(a.dmg)} ${a.tag === '' ? 'plain' : a.tag} ${a.text}`;
    case 'rout': return `${t} rout ${a.id}`;
    case 'kill': return `${t} kill ${a.id}`;
    case 'towerShot': return `${t} towerShot ${n2s(a.row)} ${a.target} ${n2s(a.landAt)}`;
    case 'end': return `${t} end ${a.winner}`;
    default: throw new Error(`nieznana akcja ${a.k}`);
  }
}

// ==================================================================================================================
// (1) Sekwencje ciosu/kontrataku (AUTO, bez oblezenia): `_activateUnit` -> `_doMeleeAttack` -> `_singleBlow` ...
// ==================================================================================================================
function genSeq(id) {
  newScene();
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
  for (const u of atk) u.target = chance(0.85) ? int(0, nD - 1) : null;
  for (const u of def) u.target = chance(0.85) ? int(0, nA - 1) : null;
  const all = [...atk, ...def];
  for (const u of all) {
    u.bu = buOf(u);
    S.byId[unitName(u)] = u;
  }
  for (const u of atk) u.blow = u.target === null ? null : blowTemplate(u, def[u.target]);
  for (const u of def) u.blow = u.target === null ? null : blowTemplate(u, atk[u.target]);
  for (const u of all) u.counterBlows = (u.side === 'atk' ? def : atk).map((e) => blowTemplate(u, e));
  const nAct = int(3, 8);
  const acts = [];
  for (let k = 0; k < nAct; k++) {
    const u = surroundMode && k === 0 ? atk[0] : pick(all);
    acts.push({ side: u.side, idx: u.idx, finished: surroundMode && k === 0 ? false : chance(0.03) });
    S.rolls.push(pick([0, 0.9999999999, 0.05, 0.95, 0.5, rnd(), rnd(), rnd(), rnd()]));
    S.rolls.push(pick([0, 0.9999999999, 0.05, 0.95, 0.5, rnd(), rnd(), rnd(), rnd()]));
  }
  return { id, atk, def, acts };
}

function runSeq(seq, ff = false) {
  S.rollIdx = 0;
  const h = new Harness();
  // `_ffActive` (`:2573`): tryb przewijania (`skip()` `:3696`); w FF `_spawnDamageLabel` nie tworzy etykiety (`:9943`).
  h._ffActive = ff;
  h.atk = seq.atk.map((u) => runtimeOf(h, u));
  h.def = seq.def.map((u) => runtimeOf(h, u));
  const expect = [];
  seq.acts.forEach((a, k) => {
    const ru = (a.side === 'atk' ? h.atk : h.def)[a.idx];
    const T = 1000 * (k + 1);
    h.finished = a.finished;
    h.__acts = [];
    h.__raf = [];
    h.__sched = [];
    h.__now = T;
    h._activateUnit(ru, () => {});
    // Klatki lunge: t0, t0 + BLOW_HIT_T (cios + kontratak), t0 + BLOW_LUNGE_MS (powrot); potem settle (`done`).
    const ms = [0, BLOW_HIT_T, BLOW_LUNGE_MS];
    let i = 0;
    while (h.__raf.length) {
      const cb = h.__raf.shift();
      h.__now = T + ms[Math.min(i, ms.length - 1)];
      i += 1;
      cb();
    }
    expect.push({ t: T, actions: h.__acts.map(enc) });
  });
  return expect;
}

const encUnit = (u) => ({
  side: u.side, idx: u.idx, q: u.q, r: u.r, hp: n2s(u.hp), maxHp: n2s(u.maxHp), morale: n2s(u.morale), moraleMax: n2s(u.morale + u.moraleMaxExtra),
  fleeMorale: n2s(u.fleeMorale),
  neverRout: u.neverRout, dead: u.dead, fadingOut: u.fadingOut, routed: u.routed, surroundApplied: u.surroundApplied,
  moveLeft: n2s(u.moveLeft), facing: n2s(u.facing), onWall: u.onWall, mounted: u.mounted, phalanx: u.phalanx,
  tdmOwn: n2s(tdmOf(tileName(u.q, u.r))), target: u.target, blow: u.blow, counters: u.counterBlows,
});

const N_MELEE = 320;
const N_MELEE_FF = 96;
const melee = [];
for (let i = 0; i < N_MELEE; i++) {
  const seq = genSeq(i);
  const expect = runSeq(seq);
  const entry = { id: i, units: [...seq.atk, ...seq.def].map(encUnit), nAtk: seq.atk.length, acts: seq.acts, rolls: S.rolls.map(n2s), expect };
  // P4-1I3 r1 obrona (zarzut 1): te same sekwencje w trybie FF (`_ffActive = true`) dla pierwszych N_MELEE_FF.
  // Kontrola czystosci: ponowne uruchomienie bez FF daje identyczna sekwencje (runSeq nie zmienia danych wejscia).
  if (i < N_MELEE_FF) {
    entry.expectFf = runSeq(seq, true);
    if (JSON.stringify(runSeq(seq, false)) !== JSON.stringify(expect)) throw new Error(`runSeq niedeterministyczny #${i}`);
  }
  melee.push(entry);
}

// ==================================================================================================================
// (2) Strzal wiezy: `_fireOneTower` (wystrzal, log, pocisk) i trafienie po RANGED_FLY_MS (`_singleBlow` ranged).
// ==================================================================================================================
const N_TOWER = 160;
const WALL_COL = 6;
const towers = [];
for (let i = 0; i < N_TOWER; i++) {
  newScene();
  const nA = int(1, 3);
  const used = new Set();
  const atk = [];
  for (let k = 0; k < nA; k++) {
    let q; let r;
    do { q = int(0, WALL_COL - 1); r = int(0, 4); } while (used.has(`${q},${r}`));
    used.add(`${q},${r}`);
    const u = genUnit('atk', k, q, r);
    // Cel wiezy nie pęka (neverRout): skutki `_resolveBlowOutcome` trafienia wiezy poza zabiciem sa w Rust nieportowane.
    Object.assign(u, { neverRout: true, dead: false, fadingOut: false, routed: k === 0 ? false : u.routed });
    if (u.hp <= 0) u.hp = 1;
    if (chance(0.35)) u.hp = int(1, 6);
    atk.push(u);
  }
  for (const u of atk) { u.bu = buOf(u); S.byId[unitName(u)] = u; }
  const row = int(0, 4);
  const range = int(2, 7);
  const shooterRow = { ...UNIT_ROWS[int(0, UNIT_ROWS.length - 1)] };
  const nazwa = String(shooterRow['Jednostka'] ?? 'Strzelec');
  const hp = Number(shooterRow['Health'] ?? shooterRow['health'] ?? 1) || 1;
  const shooterId = `wieza:${row}`;
  // Strzelec syntetyczny (pin :4238-4245): mnozniki civ i trudnosci neutralne (dane sceny).
  S.byId[shooterId] = { mods: ZERO_MODS, diff: 1 };
  const shooterBu = { id: shooterId, nazwa: `Wieza (${nazwa})`, kategoria: String(shooterRow['Typ'] ?? 'Distance'), ownerColor: 0xc84040, stats: shooterRow, hp, maxHp: hp };
  const shooterU = { q: WALL_COL, r: row, mods: ZERO_MODS, diff: 1, mounted: false };
  S.rolls.push(pick([0, 0.9999999999, 0.05, 0.95, 0.5, rnd(), rnd()]));
  const T0 = 500;
  // P4-1I3 r1 obrona (zarzut 1): ten sam wystrzal bez FF (`actions`) i w FF (`actionsFf`, `_ffActive = true`, `:9943`).
  const runTower = (ff) => {
    S.rollIdx = 0;
    const h = new Harness();
    h._ffActive = ff;
    h.atk = atk.map((u) => runtimeOf(h, u));
    h.siegeWallCol = WALL_COL;
    h.towerRange = range;
    h.__now = T0;
    h._fireOneTower({ row, mesh: null, destroyed: false }, shooterRow, nazwa, hp);
    for (const s of h.__sched) { h.__now = s.at; s.fn(); }
    return h.__acts;
  };
  const acts = runTower(false);
  const actsFf = runTower(true);
  if (JSON.stringify(runTower(false)) !== JSON.stringify(acts)) throw new Error(`wieza niedeterministyczna #${i}`);
  const h = { __acts: acts };
  const shot = h.__acts.find((a) => a.k === 'towerShot');
  const targetIdx = shot ? atk.findIndex((u) => unitName(u) === shot.target) : -1;
  let tmpl = null;
  if (targetIdx >= 0) {
    const tu = atk[targetIdx];
    tmpl = blowTemplate(shooterU, tu, shooterBu);
    tmpl.arc = relativeHit(tu.facing, WALL_COL, row, tu.q, tu.r);
  }
  towers.push({
    id: i, units: atk.map(encUnit), row, range: n2s(range), nazwa, rolls: S.rolls.map(n2s), t0: n2s(T0),
    target: targetIdx < 0 ? null : targetIdx, tmpl, actions: h.__acts.map(enc), actionsFf: actsFf.map(enc),
  });
}

// ==================================================================================================================
// (3) Koniec: `_checkEnd` (z `_finishDraw` i `_roundCapVerdict`) oraz `_ffRoundCapResult`.
// ==================================================================================================================
const N_END = 240;
const RATIOS = [0.05, 0.1, 0.2, 0.249, 0.25, 0.251, 0.3, 0.333, 0.5, 0.6666, 0.8, 1, 0.12345];
const ends = [];
for (let i = 0; i < N_END; i++) {
  newScene();
  const side = (n) => Array.from({ length: n }, () => {
    const st = pick(['ok', 'ok', 'dead', 'routed', 'fading']);
    return { dead: st === 'dead', routed: st === 'routed', fadingOut: st === 'fading', hp: st === 'dead' ? 0 : int(0, 80), morale: 50, moraleMax: 100 };
  });
  const atk = side(int(1, 3));
  const def = side(int(1, 3));
  const sc = {
    ratioA: pick(RATIOS), ratioD: pick(RATIOS), stalled: chance(0.3), siege: chance(0.6), breached: chance(0.5),
    roundNo: pick([1, 5, 9, 10, 11, 149, 150, 151, 399, 400, 401]), noBreachCap: pick([10, 150, 500]), ff: chance(0.35),
  };
  const h = new Harness();
  const mk = (s, u) => ({ side: s, dead: u.dead, routed: u.routed, fadingOut: u.fadingOut, isArmyCommander: false, morale: u.morale, moraleMax: u.moraleMax, bu: { hp: u.hp } });
  h.atk = atk.map((u) => mk('atk', u));
  h.def = def.map((u) => mk('def', u));
  h._armyMoraleRatio = (s) => (s === 'atk' ? sc.ratioA : sc.ratioD);
  h._stalled = sc.stalled;
  h.siegeWallCol = sc.siege ? 6 : -1;
  h.wallEverBreached = sc.breached;
  h.roundNo = sc.roundNo;
  h.siegeNoBreachMaxRounds = sc.noBreachCap;
  h.__now = 700;
  let ret = null;
  if (sc.ff) h._ffRoundCapResult();
  else ret = h._checkEnd();
  ends.push({
    id: i, atk: atk.map((u) => ({ ...u, hp: n2s(u.hp) })), def: def.map((u) => ({ ...u, hp: n2s(u.hp) })),
    ratioA: n2s(sc.ratioA), ratioD: n2s(sc.ratioD), stalled: sc.stalled, siege: sc.siege, breached: sc.breached,
    roundNo: sc.roundNo, noBreachCap: sc.noBreachCap, ff: sc.ff, ended: ret, actions: h.__acts.map(enc),
  });
}

// ---- pokrycie ----
const allMelee = melee.flatMap((q) => q.expect.flatMap((e) => e.actions));
const cnt = (xs, re) => xs.filter((s) => re.test(s)).length;
const towerActs = towers.flatMap((t) => t.actions);
const endActs = ends.flatMap((e) => e.actions);
const cov = {
  meleeSequences: melee.length,
  activations: melee.reduce((s, q) => s + q.acts.length, 0),
  melee: cnt(allMelee, / melee /),
  hits: cnt(allMelee, / log .* trafia /),
  misses: cnt(allMelee, / log .* chybia w /),
  flankTags: cnt(allMelee, /\[FLANKA -/),
  rearTags: cnt(allMelee, /\[TYL -/),
  counterFacing: melee.reduce((s, q) => s + q.expect.filter((e) => e.actions.filter((a) => / facing /.test(a)).length >= 2 && e.actions.some((a) => / melee /.test(a))).length, 0),
  kills: cnt(allMelee, / kill /),
  routs: cnt(allMelee, / rout /),
  clashPlain: cnt(allMelee, / clash \S+ \S+ \S+ plain /),
  clashPadl: cnt(allMelee, / clash \S+ \S+ \S+ padl /),
  clashRout: cnt(allMelee, / clash \S+ \S+ \S+ rout /),
  damage: cnt(allMelee, / damage /),
  meleeFfSequences: melee.filter((q) => q.expectFf).length,
  meleeFfDamage: cnt(melee.flatMap((q) => (q.expectFf ?? []).flatMap((e) => e.actions)), / damage /),
  meleeFfMelee: cnt(melee.flatMap((q) => (q.expectFf ?? []).flatMap((e) => e.actions)), / melee /),
  towerDamage: cnt(towerActs, / damage /),
  towerFfDamage: cnt(towers.flatMap((t) => t.actionsFf), / damage /),
  updateFacing: melee.reduce((s, q) => s + q.expect.filter((e) => e.actions.some((a) => / facing /.test(a)) && !e.actions.some((a) => / melee /.test(a))).length, 0),
  towerSequences: towers.length,
  towerShots: cnt(towerActs, / towerShot /),
  towerHits: cnt(towerActs, / log Wieza \(.* trafia /),
  towerMisses: cnt(towerActs, / log Wieza \(.* chybia w /),
  towerKills: cnt(towerActs, / kill /),
  towerNoTarget: towers.filter((t) => t.target === null).length,
  endScenarios: ends.length,
  endEnded: ends.filter((e) => e.actions.some((a) => / end /.test(a))).length,
  endDraw: cnt(endActs, / end remis/),
  endMoraleLogs: cnt(endActs, /Morale armii/),
  endPatCap: cnt(endActs, /tur bez rozstrzygniecia/),
  endStallPat: cnt(endActs, /brak postepu/),
  endSzturm: cnt(endActs, /SZTURM ODPARTY: brak wylomu/),
  endFfPat: cnt(endActs, /PAT \(przewijanie\)/),
};
const outDir = join(here, 'p4_1i3_actions_vectors');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors.json'), `${JSON.stringify({
  pin: PIN, activateSha256: activateDigest, blowSha256: blowDigest, unitFragmentSha256: uDigest, unitsSha256: unitsDigest,
  doAttackSha256: doAttackDigest, facingSha256: facingDigest, counterSha256: counterDigest, outcomeSha256: outcomeDigest,
  actionsSha256: actionsDigest, seed: SEED_ACT, blowHitT: BLOW_HIT_T, wallCol: WALL_COL, coverage: cov, melee, towers, ends,
})}\n`);
console.error(JSON.stringify(cov));
