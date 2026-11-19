// R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1 (T6, Operator r1): generator wektorow adaptera stanu gry -> wejscia bitwy oblezniczej
// (rust-port/engine/src/domain/siege_battle_adapter*.rs).
//
// ORAKUL = WYKONANIE TEKSTU PINU 07d2fbd72 (git show, bez kopii):
// * moduly czyste ladowane w calosci (transpileModule + wlasny require po drzewie pinu): units/battleRoster.ts,
//   game/siegeDefenders.ts (+siege.ts), game/combat.ts, game/civ-bonuses.ts, game/veteran.ts, game/army-leadership.ts,
//   game/city-defense.ts, game/diplomacy-siege-war-gate.ts, game/siegeMachines.ts, game/unit-card-stats.ts,
//   game/unit-building-bonuses.ts, game/production.ts, battle/battle-unit-context.ts (z ich importami);
// * wycinki main.ts (domkniecia w `bootGame`): normFieldVal, lookupUnitDef, unitDefFor, unitHealth,
//   effectiveRuntimeUnitMaxHp, syncRuntimeUnitHpState, runtimeToBattleUnit, siegeRosterOwnerIds, collectSiegeAtkRoster,
//   completedBuildingIdsForCity, cityDefenderOptions, cityHasDefenders, collectSiegeDefRoster,
//   appendReadyMachinesToRoster, rosterToBattleUnits (wewnatrz launchSiegeStormFromMap);
// * wycinki battleScene.ts: funkcje statystyk (norm..fleeMoraleFor, normName, normCounters, toCombatUnit) oraz metody
//   _movementPointsFor, _attackRangeFor, _isCatapult, _isWallCrownShooter, _applyTerrainRange,
//   _applyStartingMoralePowerPenalty (w klasie Harness).
// Strazniki: numery linii (expect*), SHA-256 calosci wycinkow i modulow (PIN_SHA ponizej).
//
// ATRAPY (bez logiki gry albo wejscie scenariusza): `units`, `turn`, `cityBuilt`, relacje wojny/sojuszu, epoka
// wlasciciela, `civKeyForOwnerId` (klucz z scenariusza; `civBonusyForOwnerId` = tekst pinu), `isArmyHungry`,
// `isGoldDeficit`, `difficultyCombatMultForOwner`, `empireBuiltIdsForOwner`, `unitGetsFortifyBonus` (flaga scenariusza),
// `peekReadyMachines`. Uklad pol RuntimeBattleUnit przy spawnie (`:5458-5483`, `:4527-4566`, `:4694-4730`) jest
// przepisany wyrazeniami pinu (te same wywolania funkcji pinu), bo bloki sa wewnatrz metod THREE.js.
//
// Uruchomienie: node rust-port/engine/tests/p6_k5loop_adapter_gen.mjs (Node >= 22, TypeScript z /opt/node22 albo
// TYPESCRIPT_JS). Wynik: tests/p6_k5loop_adapter_vectors/vectors.json.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const TS_JS = process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
const ts = createRequire(import.meta.url)(TS_JS);

const showCache = new Map();
const show = (p) => {
  if (showCache.has(p)) return showCache.get(p);
  let out = null;
  try {
    out = execFileSync('git', ['show', `${PIN}:${p}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch { out = null; }
  showCache.set(p, out);
  return out;
};
const hash = createHash('sha256');
const transpile = (src) => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
const modCache = new Map();
function load(p) {
  if (modCache.has(p)) return modCache.get(p).exports;
  const src = show(p);
  if (src === null) throw new Error('brak w pinie: ' + p);
  hash.update(p + '\n' + src);
  const mod = { exports: {} };
  modCache.set(p, mod);
  if (p.endsWith('.json')) { mod.exports = JSON.parse(src); return mod.exports; }
  const req = (spec) => {
    if (!spec.startsWith('.')) throw new Error('import zewnetrzny ' + spec + ' w ' + p);
    const base = posix.normalize(posix.join(posix.dirname(p), spec));
    for (const c of [base, base + '.ts', base + '/index.ts']) {
      if ((c.endsWith('.ts') || c.endsWith('.json')) && show(c) !== null) return load(c);
    }
    throw new Error('nie rozwiazano ' + spec + ' z ' + p);
  };
  new Function('module', 'exports', 'require', transpile(src))(mod, mod.exports, req);
  return mod.exports;
}

const SCENE = 'gra/src/battle/battleScene.ts';
const MAIN = 'gra/src/main.ts';
const lines = { [SCENE]: show(SCENE).split('\n'), [MAIN]: show(MAIN).split('\n') };
// Straznik linii: tekst musi stac w oknie +-40 linii od podanego numeru (calosc wycinkow pilnuje SHA-256).
const findNear = (file, n, needle) => {
  for (let d = 0; d <= 40; d++) {
    for (const k of [n + d, n - d]) if (k >= 1 && lines[file][k - 1]?.includes(needle)) return k;
  }
  throw new Error(`pin ${file}:${n} (+-40) nie zawiera "${needle}"`);
};
const expectLine = (file, n, needle) => { findNear(file, n, needle); };
const blockAt = (file, n, needle, indent) => {
  const start = findNear(file, n, needle);
  const close = indent + '}';
  for (let n = start + 1; n < start + 600; n++) if (lines[file][n - 1] === close) return lines[file].slice(start - 1, n).join('\n');
  throw new Error(`brak konca bloku ${file}:${start}`);
};

// --- wycinki battleScene.ts -------------------------------------------------------------------------------------
const SCENE_TOP = [
  [948, 949, 'const DEFAULT_BATTLE_MOVE'],
  [1112, 1112, 'const MORALE_START'],
];
const SCENE_FN = [
  [1315, 'function norm('], [1322, 'function statField('], [1336, 'function normCounters('], [1355, 'function toCombatUnit('],
  [1381, 'function movementPoints('], [1387, 'function civUnitShapeForBattleUnit('], [1410, 'function attackRange('],
  [1420, 'function isRanged('], [1434, 'function ammoCount('], [1474, 'function isPrimaryRanged('],
  [1502, 'function isMounted('], [1522, 'function isAntiCavSpear('], [1538, 'function isPhalanx('],
  [1571, 'function bracesAgainstCharge('], [1592, 'function isNeverRout('], [1611, 'function moraleBaseFor('],
  [1627, 'function fleeMoraleFor('], [1648, 'function normName('],
];
const SCENE_METHODS = [
  [5597, 'private _applyStartingMoralePowerPenalty(): void {'],
  [7408, 'private _isCatapult(bu: BattleUnit): boolean {'],
  [7467, 'private _isWallCrownShooter(ru: RuntimeBattleUnit): boolean {'],
  [7490, 'private _applyTerrainRange(ru: RuntimeBattleUnit): void {'],
  [7515, 'private _movementPointsFor(bu: BattleUnit): number {'],
  [7522, 'private _attackRangeFor(bu: BattleUnit): number {'],
];
// Kontrola ukladu pol spawnu przepisanego ponizej.
expectLine(SCENE, 5458, 'moveLeft:  movementPoints(bu),');
expectLine(SCENE, 5459, 'range:      attackRange(bu),');
expectLine(SCENE, 5471, 'morale:      moraleBaseFor(bu),');
expectLine(SCENE, 4527, 'const moraleBase = moraleBaseFor(bu) * 1.5;');
expectLine(SCENE, 4547, 'moveLeft:  this._movementPointsFor(bu),');
expectLine(SCENE, 4548, 'range:      this._attackRangeFor(bu),');
expectLine(SCENE, 4695, 'const moraleBase = moraleBaseFor(bu) * 1.5;');
expectLine(SCENE, 4706, 'range: (this._isCatapult(bu) ? Math.max(this._attackRangeFor(bu), 6) : this._attackRangeFor(bu)),');
expectLine(SCENE, 4708, 'ranged: (this._isCatapult(bu) ? true : this._attackRangeFor(bu) >= 2),');
expectLine(SCENE, 4730, 'this._applyTerrainRange(ru);');
expectLine(SCENE, 5510, 'const atkArr = attackers.slice(0, MAX_PER_SIDE);');
expectLine(SCENE, 721, 'const MAX_PER_SIDE = 500;');
let sceneSrc = SCENE_TOP.map(([a, b, needle]) => { expectLine(SCENE, a, needle); return lines[SCENE].slice(a - 1, b).join('\n'); }).join('\n');
sceneSrc += '\n' + SCENE_FN.map(([n, needle]) => blockAt(SCENE, n, needle, '')).join('\n');
sceneSrc += '\nclass Harness {\n' + SCENE_METHODS.map(([n, needle]) => blockAt(SCENE, n, needle, '  ')).join('\n') + '\n}';
hash.update(sceneSrc);

// --- wycinki main.ts -------------------------------------------------------------------------------------------
const MAIN_FN = [
  [32993, 'function normFieldVal('], [33003, 'function lookupUnitDef('], [33027, 'function unitDefFor('],
  [33093, 'function unitHealth('], [33101, 'function effectiveRuntimeUnitMaxHp('], [33110, 'function syncRuntimeUnitHpState('],
  [33158, 'function runtimeToBattleUnit('], [34748, 'function siegeRosterOwnerIds('], [34758, 'function collectSiegeAtkRoster('],
  [34763, 'function completedBuildingIdsForCity('], [34767, 'function cityDefenderOptions('], [34795, 'function cityHasDefenders('],
  [34802, 'function collectSiegeDefRoster('], [18336, 'function appendReadyMachinesToRoster('],
];
let mainSrc = MAIN_FN.map(([n, needle]) => blockAt(MAIN, n, needle, '    ')).join('\n');
mainSrc += '\n' + blockAt(MAIN, 36885, 'function rosterToBattleUnits(roster: RuntimeUnit[], color: number): BattleUnit[] {', '      ');
expectLine(MAIN, 36814, 'if (!city.maMur) {');
expectLine(MAIN, 36821, 'const atkRoster = appendReadyMachinesToRoster(');
expectLine(MAIN, 36827, "if (!cityHasDefenders(city, anchor.ownerId) || collectSiegeDefRoster(city, anchor.ownerId).length === 0) {");
expectLine(MAIN, 36983, 'deploy: atkRosterRef.some(u => u.isGeneral === true),');
hash.update(mainSrc);

const combat = load('gra/src/game/combat.ts');
const civ = load('gra/src/game/civ-bonuses.ts');
const vet = load('gra/src/game/veteran.ts');
const lead = load('gra/src/game/army-leadership.ts');
const cdef = load('gra/src/game/city-defense.ts');
const ctxMod = load('gra/src/battle/battle-unit-context.ts');
const roster = load('gra/src/units/battleRoster.ts');
const sdef = load('gra/src/game/siegeDefenders.ts');
const gate = load('gra/src/game/diplomacy-siege-war-gate.ts');
const mach = load('gra/src/game/siegeMachines.ts');
const ucs = load('gra/src/game/unit-card-stats.ts');
const ubb = load('gra/src/game/unit-building-bonuses.ts');
const prod = load('gra/src/game/production.ts');
const setup = load('gra/src/units/setup.ts');
const UNITS = load('gra/data/units.json');
const COUNTERS = load('gra/data/counters.json');
const TERRAIN = load('gra/data/terrain-combat.json');
const PARAMS = load('gra/data/combat-params.json');
const PIN_SHA = hash.digest('hex');

const sceneScope = {
  combatUnitFromDef: combat.combatUnitFromDef, applyVeteranFracToCombatUnit: vet.applyVeteranFracToCombatUnit,
  applyArmyHungerStatMultToCombatUnit: load('gra/src/game/army-starvation.ts').applyArmyHungerStatMultToCombatUnit,
  applyGoldDeficitStatMultToCombatUnit: load('gra/src/game/gold-deficit.ts').applyGoldDeficitStatMultToCombatUnit,
  civMovementMultiplier: civ.civMovementMultiplier, civAttackRangeMultiplier: civ.civAttackRangeMultiplier,
  battleUnitCivBonusy: ctxMod.battleUnitCivBonusy, terrainRangeDelta: combat.terrainRangeDelta,
  wallCrownShooterRange: cdef.wallCrownShooterRange, veteranMoraleBazoweUp: vet.veteranMoraleBazoweUp,
  veteranMoraleUcieczkiDown: vet.veteranMoraleUcieczkiDown, moraleWithArmyLeaderBonus: lead.moraleWithArmyLeaderBonus,
  hpWeightedFieldPower: combat.hpWeightedFieldPower, powerAdvantage: combat.powerAdvantage,
  startingMoralePenaltyFrac: combat.startingMoralePenaltyFrac, applyStartingMoralePenalty: combat.applyStartingMoralePenalty,
  classifyInitialBattleRole: () => { throw new Error('nieuzywane'); },
};
const sceneNames = Object.keys(sceneScope);
const S = new Function(...sceneNames, transpile(sceneSrc) + '\nreturn { norm, statField, normCounters, toCombatUnit, movementPoints, civUnitShapeForBattleUnit, attackRange, isRanged, ammoCount, isPrimaryRanged, isMounted, isAntiCavSpear, isPhalanx, bracesAgainstCharge, isNeverRout, moraleBaseFor, fleeMoraleFor, normName, Harness };')(...sceneNames.map((k) => sceneScope[k]));

function mainFor(sc) {
  const owners = sc.owners;
  const pairKey = (a, b) => (a < b ? a + ':' + b : b + ':' + a);
  const wars = new Set(sc.wars.map(([a, b]) => pairKey(a, b)));
  const alli = new Set(sc.alliances.map(([a, b]) => pairKey(a, b)));
  const scope = {
    units: sc.units, turn: sc.turn, data: { units: UNITS }, militiaDefOverrides: new Map(),
    cityBuilt: new Map(Object.entries(sc.built)),
    empireEpochForOwner: (o) => sc.era[o],
    areEnemyOwners: (a, b) => a !== b && wars.has(pairKey(a, b)),
    hasAllianceDealBetween: (a, b) => a !== b && alli.has(pairKey(a, b)),
    peekReadyMachines: (c) => [...(c.siegeMachines?.ready ?? [])],
    consumeReadyMachines: () => { throw new Error('consume poza zakresem'); },
    empireBuiltIdsForOwner: (o) => owners[o].built,
    civBonusyForOwnerId: (o) => [...civ.civMatrixBonusyForCivKey(owners[o].civKey), ...prod.civProductionCostBonusyForCivKey(owners[o].civKey)],
    difficultyCombatMultForOwner: (o) => owners[o].diff,
    isArmyHungry: (o) => owners[o].hungry, isGoldDeficit: (o) => owners[o].deficit,
    isCivilianUnit: setup.isCivilianUnit, unitPancerzBonusFrac: ubb.unitPancerzBonusFrac,
    unitParametryBonusFrac: ubb.unitParametryBonusFrac, veteranCombatBonusFrac: vet.veteranCombatBonusFrac,
    effectiveMaxHp: ucs.effectiveMaxHp, armyLeaderTitle: lead.armyLeaderTitle, armyLeaderMoraleBonusFrac: lead.armyLeaderMoraleBonusFrac,
    unitGetsFortifyBonus: (u) => u.__fort === true, collectAtkRosterNearCity: roster.collectAtkRosterNearCity,
    collectCityDefRoster: sdef.collectCityDefRoster, hasCityDefenders: sdef.hasCityDefenders,
    siegeBattleSideOwners: gate.siegeBattleSideOwners, SIEGE_MACHINE_TYPE_ID: mach.SIEGE_MACHINE_TYPE_ID,
  };
  const names = Object.keys(scope);
  const fns = new Function(...names, transpile(mainSrc) + '\nreturn { unitDefFor, runtimeToBattleUnit, collectSiegeAtkRoster, collectSiegeDefRoster, cityHasDefenders, appendReadyMachinesToRoster, rosterToBattleUnits, militiaDefOverrides };')(...names.map((k) => scope[k]));
  return { ...fns, scope };
}

const num = (x) => (typeof x === 'number' && !Number.isFinite(x) ? (Number.isNaN(x) ? 'NaN' : x > 0 ? 'Infinity' : '-Infinity') : x);
const jsonSafe = (o) => JSON.parse(JSON.stringify(o, (_k, v) => num(v)));

function runScenario(sc) {
  const m = mainFor(sc);
  const city = sc.city;
  const anchor = sc.units.find((u) => u.id === sc.anchorId);
  if (!anchor) return { error: 'AnchorNotFound' };
  if (!city.maMur) return { error: 'CityWithoutWall' };
  const atk = m.appendReadyMachinesToRoster(m.collectSiegeAtkRoster(city, anchor), city, anchor.ownerId, false);
  if (!m.cityHasDefenders(city, anchor.ownerId) || m.collectSiegeDefRoster(city, anchor.ownerId).length === 0) return { error: 'NoDefenders' };
  const def = m.collectSiegeDefRoster(city, anchor.ownerId);
  if (atk.some((u) => u.isGeneral === true)) return { error: 'AttackerHasGeneral' };
  const atkBU = m.rosterToBattleUnits(atk, 0xffd54a).slice(0, 500);
  const defBU = m.rosterToBattleUnits(def, 0xc84040).slice(0, 500);
  const H = new S.Harness();
  Object.assign(H, {
    terrain: sc.terrain, shallowSea: false, terrainData: TERRAIN, attackerCivBonusy: [], defenderCivBonusy: [],
    terrainMap: { combatTerrainName: () => sc.crownTerrain },
    armyHungerStatMult: sc.hungerMult, goldDeficitStatMult: sc.deficitMult,
    _startMoralePenaltyApplied: false, _updateMoraleBar() {},
  });
  const mk = (bu, slot) => {
    if (slot === 'atk') {
      const ammo0 = S.ammoCount(bu);
      return { bu, side: 'atk', moveLeft: S.movementPoints(bu), range: S.attackRange(bu), rangeBase: S.attackRange(bu), ranged: S.isRanged(bu), rangedBase: S.isRanged(bu), primaryRanged: S.isPrimaryRanged(bu), ammoLeft: ammo0, ammoMax: ammo0, mounted: S.isMounted(bu), antiCavSpear: S.isAntiCavSpear(bu), phalanx: S.isPhalanx(bu), morale: S.moraleBaseFor(bu), moraleMax: S.moraleBaseFor(bu), neverRout: S.isNeverRout(bu), fleeMorale: S.fleeMoraleFor(bu), onWallWalkway: false, dead: false, fadingOut: false, removed: false };
    }
    const ammo0 = S.ammoCount(bu);
    const moraleBase = S.moraleBaseFor(bu) * 1.5;
    const crown = slot === 'crown';
    const cata = H._isCatapult(bu);
    const ru = { bu, side: 'def', moveLeft: H._movementPointsFor(bu),
      range: crown ? (cata ? Math.max(H._attackRangeFor(bu), 6) : H._attackRangeFor(bu)) : H._attackRangeFor(bu),
      rangeBase: crown ? (cata ? Math.max(H._attackRangeFor(bu), 6) : H._attackRangeFor(bu)) : H._attackRangeFor(bu),
      ranged: crown ? (cata ? true : H._attackRangeFor(bu) >= 2) : H._attackRangeFor(bu) >= 2,
      rangedBase: crown ? (cata ? true : H._attackRangeFor(bu) >= 2) : H._attackRangeFor(bu) >= 2,
      primaryRanged: S.isPrimaryRanged(bu), ammoLeft: ammo0, ammoMax: ammo0, mounted: S.isMounted(bu), antiCavSpear: S.isAntiCavSpear(bu), phalanx: S.isPhalanx(bu), morale: moraleBase, moraleMax: moraleBase, neverRout: S.isNeverRout(bu), fleeMorale: S.fleeMoraleFor(bu), onWallWalkway: crown, dead: false, fadingOut: false, removed: false };
    if (crown) H._applyTerrainRange(ru);
    return ru;
  };
  const crownSet = new Set(sc.crownIds);
  H.atk = atkBU.map((bu) => mk(bu, 'atk'));
  H.def = defBU.map((bu) => mk(bu, crownSet.has(bu.id) ? 'crown' : 'inner'));
  const spawnOf = (ru) => ({ moveLeft: ru.moveLeft, range: ru.range, rangeBase: ru.rangeBase, ranged: ru.ranged, rangedBase: ru.rangedBase, primaryRanged: ru.primaryRanged, ammoLeft: ru.ammoLeft, ammoMax: ru.ammoMax, mounted: ru.mounted, antiCavSpear: ru.antiCavSpear, phalanx: ru.phalanx, morale: ru.morale, moraleMax: ru.moraleMax, neverRout: ru.neverRout, fleeMorale: ru.fleeMorale, onWallWalkway: ru.onWallWalkway, isCatapult: H._isCatapult(ru.bu) });
  const spawnBefore = { atk: H.atk.map(spawnOf), def: H.def.map(spawnOf) };
  // Wartosci pinu do porownania kary (te same wywolania co metoda).
  const toPower = (ru) => { const cu = S.toCombatUnit(ru.bu, H.armyHungerStatMult, false, H.goldDeficitStatMult); return { typeId: cu.typNazwa, def: { meleeAttack: cu.meleeAttack, meleeDefence: cu.meleeDefence, weaponDamage: cu.weaponDamage, piercing: cu.piercing, armor: cu.armor, chargeBonus: cu.chargeBonus, health: cu.health, missileAttack: cu.missileAttack, 'Rola (linia)': cu.rola }, hp: ru.bu.hp, maxHp: ru.bu.maxHp }; };
  const mAtk = combat.hpWeightedFieldPower(H.atk.map(toPower));
  const mDef = combat.hpWeightedFieldPower(H.def.map(toPower));
  const adv = combat.powerAdvantage(mAtk, mDef);
  const frac = combat.startingMoralePenaltyFrac(adv.ratio);
  H._applyStartingMoralePowerPenalty();
  const counters = S.normCounters(COUNTERS);
  const cuOf = (bu) => S.toCombatUnit(bu, sc.hungerMult, false, sc.deficitMult);
  const unitOut = (bu, ru) => {
    const cu = cuOf(bu);
    return {
      id: String(bu.id), nazwa: bu.nazwa, kategoria: bu.kategoria, hp: bu.hp, maxHp: bu.maxHp, isArmyCommander: bu.isArmyCommander,
      pancerzBonusFrac: bu.pancerzBonusFrac, parametryBonusFrac: bu.parametryBonusFrac, veteranBonusFrac: bu.veteranBonusFrac,
      fortifiedInField: bu.fortifiedInField, armyHungry: bu.armyHungry, goldDeficit: bu.goldDeficit,
      armyLeaderMoraleBonusFrac: bu.armyLeaderMoraleBonusFrac, difficultyCombatMult: bu.difficultyCombatMult,
      stats: bu.stats, setupRanged: S.isRanged(bu), braces: S.bracesAgainstCharge(bu), moraleAfterPenalty: ru.morale,
      cu: { typNazwa: cu.typNazwa, counterTyp: cu.counterTyp, rola: cu.rola, meleeAttack: cu.meleeAttack, meleeDefence: cu.meleeDefence, weaponDamage: cu.weaponDamage, armor: cu.armor, piercing: cu.piercing, chargeBonus: cu.chargeBonus, health: cu.health, missileAttack: cu.missileAttack, karaFlanka: cu['Kara obrony z flanki (%)'], karaTyl: cu['Kara obrony z tylu (%)'] },
    };
  };
  const matrix = (a, d) => a.map((x) => d.map((y) => combat.counterMultiplier(cuOf(x).counterTyp, cuOf(y).counterTyp, counters)));
  return {
    atkIds: atk.map((u) => String(u.id)), defIds: def.map((u) => String(u.id)),
    militiaDefs: [...m.militiaDefOverrides.entries()].map(([id, d]) => ({ id, def: d })),
    atk: atkBU.map((bu, i) => unitOut(bu, H.atk[i])), def: defBU.map((bu, i) => unitOut(bu, H.def[i])),
    spawn: spawnBefore,
    penalty: { mAtk, mDef, weaker: adv.weakerSide, ratio: adv.ratio, frac },
    countersAtkDef: matrix(atkBU, defBU), countersDefAtk: matrix(defBU, atkBU),
    crownRangeDelta: combat.terrainRangeDelta(sc.crownTerrain, TERRAIN),
  };
}

// --- scenariusze ---------------------------------------------------------------------------------------------------
const U = (id, ownerId, typeId, category, q, r, extra = {}) => ({ id, ownerId, typeId, category, q, r, ruch: 2, ruchLeft: 2, ...extra });
const city = (id, ownerId, q, r, extra = {}) => ({ id, ownerId, q, r, name: id, population: 4, maMur: true, siegeMachines: { ready: [] }, ...extra });
const base = (extra) => ({
  turn: 12, wars: [[0, 1]], alliances: [], era: { 0: 1, 1: 1, 2: 1, 3: 1 }, terrain: 'Rownina', crownTerrain: 'Rownina',
  hungerMult: 0.75, deficitMult: 0.75, crownIds: [],
  owners: { 0: { civKey: 'rzymianie', built: [], hungry: false, deficit: false, diff: 1 }, 1: { civKey: 'grecy', built: [], hungry: false, deficit: false, diff: 1 }, 2: { civKey: 'egipt', built: ['akademia_wojskowa'], hungry: false, deficit: false, diff: 1.1 }, 3: { civKey: 'sumer', built: [], hungry: false, deficit: false, diff: 1 } },
  ...extra,
});
const scenarios = [];
// S1: maly szturm piechoty na garnizon 2 jednostek (Rzym vs Grecja), obronca na koronie.
scenarios.push(base({ name: 's1-piechota', city: city('c1', 1, 5, 5), built: { c1: ['mury'] }, anchorId: 'a1', crownIds: ['d1', 'd2'],
  units: [U('a1', 0, 'Wojownik', 'miecznik', 4, 5), U('a2', 0, 'Włócznik', 'wlocznik', 4, 6), U('a3', 0, 'Wojownik', 'miecznik', 9, 9), U('a4', 0, 'Wojownik', 'miecznik', 3, 5), U('a5', 0, 'Drużynnik', 'miecznik', 5, 4), U('d1', 1, 'Falanga', 'falanga', 5, 5), U('d2', 1, 'Łucznik', 'lucznik', 5, 5)] }));
// S2: jazda + lucznicy + machiny gotowe; obroncy z Milicja (Garnizon, epoka braz) i wiezyczka/katapulta na koronie.
scenarios.push(base({ name: 's2-jazda-machiny-milicja', city: city('c2', 1, 10, 3, { population: 5, siegeMachines: { ready: ['taran', 'wieza'] } }), built: { c2: ['mury', 'garnizon'] }, era: { 0: 2, 1: 2, 2: 1, 3: 1 }, anchorId: 'k1', crownIds: ['d3', 'militia-c2-3', 'militia-c2-4'], crownTerrain: 'Wzgorza',
  units: [U('k1', 0, 'Konnica', 'konnica', 9, 3, { hp: 40, battlesSurvived: 2 }), U('k2', 0, 'Łucznik', 'lucznik', 10, 2, { parametryBonusProc: 15, pancerzBonusProc: 10 }), U('k3', 0, 'Rydwan konny', 'rydwan', 11, 2), U('d3', 1, 'Katapulta', 'obleznicza', 10, 3), U('d4', 1, 'Hastati', 'legionista', 10, 4, { hp: 12 })] }));
// S3: koalicja: sojusznik atakujacego (2) i sojusznik obroncy (3) w promieniu, cywil przy miescie, weteran, glod/deficyt.
scenarios.push(base({ name: 's3-koalicja', city: city('c3', 1, 0, 0, { population: 2 }), built: { c3: ['palisada', 'garnizon'] }, anchorId: 'x1', wars: [[0, 1], [2, 1], [0, 3], [2, 3]], alliances: [[0, 2], [1, 3]], crownIds: ['y1'],
  owners: { 0: { civKey: 'rzymianie', built: [], hungry: true, deficit: false, diff: 1 }, 1: { civKey: 'grecy', built: [], hungry: true, deficit: true, diff: 1.25 }, 2: { civKey: 'egipt', built: ['akademia_wojskowa'], hungry: false, deficit: false, diff: 1.1 }, 3: { civKey: 'sumer', built: [], hungry: false, deficit: false, diff: 1 } },
  units: [U('x2', 2, 'Łucznik egipski', 'lucznik', 1, 0), U('x1', 0, 'Wojownik z mieczem i tarczą', 'miecznik', -1, 0, { battlesSurvived: 3 }), U('x3', 0, 'Osadnik', 'osadnik', 0, 1), U('y1', 1, 'Łucznik', 'lucznik', 0, 0), U('y2', 3, 'Włócznik sumeryjski', 'wlocznik', 0, -1, { __fort: true }), U('y3', 1, 'Robotnik', 'robotnik', 0, 0), U('y4', 1, 'Zwiadowca', 'zwiadowca', 1, -1)] }));
// S4: przewaga liczebna atakujacego (kara morale obroncow) i katapulta atakujacego, epoka zelazo Milicji.
scenarios.push(base({ name: 's4-przewaga', city: city('c4', 1, 20, 20, { population: 3 }), built: { c4: ['mury_kamienne', 'garnizon'] }, era: { 0: 3, 1: 3, 2: 1, 3: 1 }, anchorId: 'p1', crownIds: ['militia-c4-0'],
  units: [...Array.from({ length: 12 }, (_, i) => U('p' + (i + 1), 0, i % 3 === 0 ? 'Triari' : i % 3 === 1 ? 'Hastati' : 'Katapulta', i % 3 === 2 ? 'obleznicza' : 'legionista', 19 + (i % 2), 20 + ((i >> 1) % 2))), U('q1', 1, 'Wojownik', 'miecznik', 20, 20)] }));
// S5: generał atakujacego (D-WIR-2 = blad), obronca bez muru (osobny), brak obroncow (osobny).
scenarios.push(base({ name: 's5-general', city: city('c5', 1, 3, 3), built: { c5: ['mury'] }, anchorId: 'g1', units: [U('g1', 0, 'Wojownik', 'miecznik', 2, 3), U('g2', 0, 'Konnica', 'konnica', 3, 2, { isGeneral: true }), U('h1', 1, 'Wojownik', 'miecznik', 3, 3)] }));
scenarios.push(base({ name: 's6-bez-muru', city: city('c6', 1, 3, 3, { maMur: false }), built: { c6: [] }, anchorId: 'g1', units: [U('g1', 0, 'Wojownik', 'miecznik', 2, 3), U('h1', 1, 'Wojownik', 'miecznik', 3, 3)] }));
scenarios.push(base({ name: 's7-bez-obroncow', city: city('c7', 1, 3, 3), built: { c7: ['mury'] }, anchorId: 'g1', units: [U('g1', 0, 'Wojownik', 'miecznik', 2, 3), U('h1', 1, 'Wojownik', 'miecznik', 8, 8)] }));
// S8: tylko Milicja (odnowa po czasie), slabszy atakujacy (kara morale atakujacego), Egipt vs Sumer, teren las.
scenarios.push(base({ name: 's8-milicja-slabszy-atk', city: city('c8', 3, 7, 7, { population: 7, militiaRegenAtTurn: 10 }), built: { c8: ['fort', 'garnizon'] }, wars: [[2, 3]], anchorId: 'e1', era: { 0: 1, 1: 1, 2: 2, 3: 2 }, crownIds: ['militia-c8-4', 'militia-c8-5', 'militia-c8-6'], crownTerrain: 'Las', terrain: 'Las',
  units: [U('e1', 2, 'Rydwan egipski', 'rydwan', 7, 6, { hp: 5 }), U('e2', 2, 'Łucznik', 'lucznik', 6, 7)] }));
// S9: Milicja w okresie odnowy -> brak Milicji, obroncy realni; generał obroncy (Wodz/General), postep jednostek.
scenarios.push(base({ name: 's9-odnowa-general-obroncy', city: city('c9', 1, 2, 9, { population: 6, militiaRegenAtTurn: 15 }), built: { c9: ['mury', 'garnizon'] }, anchorId: 'm1', crownIds: ['n2'],
  owners: { 0: { civKey: 'chinczycy', built: [], hungry: false, deficit: true, diff: 1 }, 1: { civKey: 'zulusi', built: ['akademia_wojskowa'], hungry: true, deficit: false, diff: 1.15 }, 2: { civKey: 'egipt', built: [], hungry: false, deficit: false, diff: 1 }, 3: { civKey: 'sumer', built: [], hungry: false, deficit: false, diff: 1 } },
  units: [U('m1', 0, 'Jeździec chiński', 'konnica', 1, 9), U('m2', 0, 'Hu Ben Wei (Gwardia Tygrysa)', 'miecznik', 2, 8, { battlesSurvived: 1, parametryBonusProc: 20 }), U('n1', 1, 'Impi', 'wlocznik', 2, 9, { isGeneral: true }), U('n2', 1, 'Oszczepnik Zulu (Izijula)', 'oszczepnik', 3, 9, { hp: 999 })] }));

const out = scenarios.map((sc) => ({ name: sc.name, input: sc, expected: runScenario(sc) }));
const cover = { scenariusze: out.length, bledy: 0, milicja: 0, machiny: 0, korona: 0, katapulta_korona: 0, jazda: 0, strzelcy: 0, sojusznik_atk: 0, sojusznik_def: 0, kara_atk: 0, kara_def: 0, weteran: 0, general_obroncy: 0 };
for (const o of out) {
  const e = o.expected;
  if (e.error) { cover.bledy++; continue; }
  cover.milicja += e.militiaDefs.length;
  cover.machiny += e.atkIds.filter((i) => i.startsWith('siege-mach-')).length;
  cover.korona += e.spawn.def.filter((s) => s.onWallWalkway).length;
  cover.katapulta_korona += e.spawn.def.filter((s) => s.onWallWalkway && s.isCatapult).length;
  cover.jazda += [...e.spawn.atk, ...e.spawn.def].filter((s) => s.mounted).length;
  cover.strzelcy += [...e.spawn.atk, ...e.spawn.def].filter((s) => s.rangedBase).length;
  cover.sojusznik_atk += e.atk.filter((u) => o.input.units.find((x) => x.id === u.id)?.ownerId !== o.input.units.find((x) => x.id === o.input.anchorId).ownerId && !u.id.startsWith('siege-mach-')).length;
  cover.sojusznik_def += e.def.filter((u) => { const x = o.input.units.find((y) => y.id === u.id); return x && x.ownerId !== o.input.city.ownerId; }).length;
  if (e.penalty.weaker === 'atk' && e.penalty.frac > 0) cover.kara_atk++;
  if (e.penalty.weaker === 'def' && e.penalty.frac > 0) cover.kara_def++;
  cover.weteran += [...e.atk, ...e.def].filter((u) => u.veteranBonusFrac > 0).length;
  cover.general_obroncy += e.def.filter((u) => u.isArmyCommander).length;
}
const civBonusy = {};
for (const k of ['rzymianie', 'grecy', 'egipt', 'sumer', 'chinczycy', 'zulusi']) civBonusy[k] = [...civ.civMatrixBonusyForCivKey(k), ...prod.civProductionCostBonusyForCivKey(k)];
// Liczby wyniku i wejsc jako tekst (String(x) = najkrotszy zapis JS, Rust `parse::<f64>` dokladny; serde_json bez
// `float_roundtrip` potrafi zgubic 1 ulp). Surowe dane pinu (`stats`, `def`, units.json, counters.json) zostaja liczbami.
const RAW_KEYS = new Set(['stats', 'def']);
const enc = (v) => {
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.map(enc);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, RAW_KEYS.has(k) ? jsonSafe(x) : enc(x)]));
  return v;
};
const civEnc = Object.fromEntries(Object.entries(civBonusy).map(([k, l]) => [k, l.map((b) => ({ ...b, wartosc: typeof b.wartosc === 'number' ? { n: String(b.wartosc) } : b.wartosc }))]));
const doc = { pin: PIN, pinSha256: PIN_SHA, counterMultiplier: String(PARAMS.counter_multiplier), coverage: cover, units: UNITS, counters: COUNTERS, civBonusy: civEnc, vectors: out.map((o) => ({ name: o.name, input: enc(o.input), expected: enc(o.expected) })) };
const dir = join(here, 'p6_k5loop_adapter_vectors');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'vectors.json'), JSON.stringify(doc) + '\n');
// Math.log10 (V8) dla `startingMoralePenaltyFrac`: siatka argumentow + przypadki brzegowe (port js_log10 w Rust).
const logs = [];
for (let i = 0; i < 4000; i++) { const x = Math.exp((i - 2000) / 37.3) * 1.000123; logs.push([String(x), String(Math.log10(x))]); }
for (const x of [3.0095465393794747, 1.0704225352112675, 6.050632911392405, 1e-310, 5e-324, 0, 1, 10, 1000, 0.5, Number.MAX_VALUE]) logs.push([String(x), String(Math.log10(x))]);
writeFileSync(join(dir, 'log10.json'), JSON.stringify(logs) + '\n');
console.log('pinSha256', PIN_SHA, 'coverage', JSON.stringify(cover));
