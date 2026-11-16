// P6 SIEGE K5DOC-T2 CELE (dispatch R-RUSTPORT-P6-K5DOC-T2-CELE-Q1): generator wektorow wyboru celu.
// Uruchomienie: node rust-port/engine/tests/p6_k5doc_target_gen.mjs
//
// Zrodlo: `gra/src/battle/battleScene.ts` oraz `gra/src/game/city-fortification.ts` przy pinie 07d2fbd72
// (git show, bez checkoutu). Fragmenty pina sa hashowane (SHA-256 straznik, tekst).
// DWIE warstwy kontroli (odpowiedz na zarzut r1 Evaluatora):
//  1. Reimplementacja JS (ponizej) wycieta z fragmentow — generuje wektory.
//  2. WYKONANIE pina: wybrane metody pina (_pickTargetByPriority, _pickAdjacentTargetByPriority,
//     _pickRangedTargetByPriority, _priorityScore, _prefsForUnit, _unitBattleClass, _enemiesOf,
//     manhattan, desiredHitForDirection) oraz meleeBlockedByWall (city-fortification.ts) sa transpilowane
//     przez TypeScript (ts.transpileModule) i WYKONYWANE. Kazdy przypadek pick_* i kazde sprawdzenie
//     meleeBlockedByWall musi dac wynik zgodny z JS; inaczej generator konczy sie bledem.
//     Poza wykonaniem pozostaja (JS, NIE_ZMIERZONO): relativeHit/facingToward/oppositeDir oraz
//     targetInRange/rangedTargetInRange/takesRangedAction (tylko JS, bez wykonania pina).
//     Wymaga TypeScript: zmienna TYPESCRIPT_JS (domyslnie jak p6_city_towers_gen.mjs).
//
//
// Wynik -> tests/p6_k5doc_target_vectors/vectors.json. Przypadki nazwane (minimum dispatchu) + losowe (seed 2026).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_PATH = 'gra/src/battle/battleScene.ts';
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const pinLines = execFileSync('git', ['show', `${PIN}:${PIN_PATH}`], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\n');
const pinRange = (a, b) => pinLines.slice(a - 1, b).join('\n');

// Fragmenty pina (numery linii inkluzywnie) i ich oczekiwany skrot.
const FRAGMENTS = {
  manhattan: [1917, 1919],
  desiredHitForDirection: [1956, 1960],
  defaultTargetPriorities: [2323, 2327],
  shootingGate: [6241, 6241],
  rangedTargetInRange: [7041, 7053],
  enemiesOf: [8291, 8294],
  meleeBlockedByWallCall: [8361, 8371],
  targetInRange: [8373, 8410],
  unitClassPriorityPickers: [17486, 17584],
};
const FRAGMENT_SHA256 = '991a05cd3b9a687bbb96246854232002165b10e384a3b8b138644551decd14fc';
const digests = {};
for (const [name, [a, b]] of Object.entries(FRAGMENTS)) {
  digests[name] = createHash('sha256').update(pinRange(a, b)).digest('hex');
}
const allDigest = createHash('sha256')
  .update(Object.keys(FRAGMENTS).map((n) => digests[n]).join('\n'))
  .digest('hex');
if (process.env.K5DOC_PRINT_DIGESTS === '1') {
  console.log(JSON.stringify({ digests, allDigest }, null, 2));
  process.exit(0);
}
if (allDigest !== FRAGMENT_SHA256) {
  throw new Error(`fragmenty pina nie zgadzaja sie z hashem: ${allDigest}`);
}

// --- Wycieta logika (wg fragmentow pina) ---
const DEFAULT_TARGET_PRIORITIES = {
  mounted: ['mounted', 'ranged', 'melee'],
  ranged: ['ranged', 'mounted', 'melee'],
  melee: ['melee', 'ranged', 'mounted'],
};
const manhattan = (ac, ar, bc, br) => Math.abs(ac - bc) + Math.abs(ar - br);
const canShoot = (u) => u.rangedBase && u.ammoLeft > 0;
const unitClass = (u) => {
  if (u.mounted) return 'mounted';
  if (u.primaryRanged || u.rangedBase) return 'ranged';
  return 'melee';
};
// Kierunek w relativeHit: Dir N=0,E=1,S=2,W=3 (battleScene.ts:315-320), facingToward (:347-353).
const facingToward = (dCol, dRow, fallback) => {
  if (dCol === 0 && dRow === 0) return fallback;
  if (Math.abs(dCol) >= Math.abs(dRow)) return dCol >= 0 ? 1 : 3;
  return dRow >= 0 ? 2 : 0;
};
const oppositeDir = (d) => (d + 2) % 4;
const relativeHit = (defFacing, aCol, aRow, dCol, dRow) => {
  const incoming = facingToward(aCol - dCol, aRow - dRow, defFacing);
  if (incoming === defFacing) return 'front';
  if (incoming === oppositeDir(defFacing)) return 'rear';
  return 'flank';
};
const desiredHitForDirection = (dir) => {
  if (dir === 'bok') return 'flank';
  if (dir === 'tyl') return 'rear';
  return null;
};
// enemiesOf: indeksy zachowane (zwraca pary [i, u]).
const enemiesOf = (side) => side.map((u, i) => [i, u]).filter(([, u]) => !u.dead && !u.fadingOut && !u.routed);

const prefsForUnit = (u, army, group) => {
  const ac = unitClass(u);
  if (u.useUnitPriorities) {
    const up = u.unitTargetPriorities?.[ac];
    if (up && up.length === 3) return up;
  }
  if (group) {
    if (group.useGroupPriorities) {
      const gp = group.groupTargetPriorities?.[ac];
      if (gp && gp.length === 3) return gp;
    }
  }
  return army[ac];
};
const priorityScore = (u, e, prefs) => {
  const ac = unitClass(u);
  const ec = unitClass(e);
  const idx = prefs.indexOf(ec);
  let score = idx >= 0 ? idx : prefs.length;
  if (ac === 'mounted' && e.antiCavSpear) score += 0.45;
  return score;
};
const pickTargetByPriority = (u, side, army, group) => {
  const prefs = prefsForUnit(u, army, group);
  let best = null;
  let bestP = Infinity;
  let bestD = Infinity;
  for (const [i, e] of enemiesOf(side)) {
    const p = priorityScore(u, e, prefs);
    const d = manhattan(u.q, u.r, e.q, e.r);
    if (p < bestP || (p === bestP && d < bestD)) {
      bestP = p; bestD = d; best = i;
    }
  }
  return best;
};
const pickAdjacentTargetByPriority = (u, side, army, group) => {
  const prefs = prefsForUnit(u, army, group);
  const adj = enemiesOf(side).filter(([, e]) => manhattan(u.q, u.r, e.q, e.r) === 1);
  if (adj.length === 0) return null;
  const bestByPriority = (list) => {
    let best = null;
    let bestP = Infinity;
    for (const [i, e] of list) {
      const p = priorityScore(u, e, prefs);
      if (p < bestP || (p === bestP && best && e.hp < best[1].hp)) {
        bestP = p; best = [i, e];
      }
    }
    return best ? best[0] : null;
  };
  const desired = desiredHitForDirection(u.attackDirection);
  if (desired) {
    const matching = adj.filter(([, e]) => relativeHit(e.facing, u.q, u.r, e.q, e.r) === desired);
    const m = bestByPriority(matching);
    if (m !== null) return m;
  }
  return bestByPriority(adj);
};
const pickRangedTargetByPriority = (u, side, army, group) => {
  const prefs = prefsForUnit(u, army, group);
  let best = null;
  let bestP = Infinity;
  let bestD = Infinity;
  for (const [i, e] of enemiesOf(side)) {
    const d = manhattan(u.q, u.r, e.q, e.r);
    if (d > u.range || d < 1) continue;
    const p = priorityScore(u, e, prefs);
    if (p < bestP || (p === bestP && d < bestD)) {
      bestP = p; bestD = d; best = i;
    }
  }
  return best;
};
const rangedTargetInRange = (u, side) => {
  let best = null;
  let bestD = Infinity;
  for (const [i, e] of enemiesOf(side)) {
    const dd = manhattan(u.q, u.r, e.q, e.r);
    if (dd < 1 || dd > u.range) continue;
    if (dd < bestD || (dd === bestD && best !== null && e.hp < side[best].hp)) {
      bestD = dd; best = i;
    }
  }
  return best;
};
// meleeBlockedByWall (city-fortification.ts:76-79, wg Rust): wallBreached -> false; inaczej melee && !onWall && defenderOnWall.
const meleeBlockedByWall = (ctx) => {
  if (ctx.wallBreached) return false;
  return ctx.attackerIsMelee && !ctx.attackerOnWall && ctx.defenderOnWall;
};
const meleeBlockedByWallFor = (u, e, scene) => {
  if (scene.siegeWallCol < 0) return false;
  return meleeBlockedByWall({
    wallBreached: scene.wallEverBreached,
    attackerIsMelee: !canShoot(u) && !u.isSiegeUnit,
    attackerOnWall: u.onWallWalkway === true,
    defenderOnWall: e.onWallWalkway === true,
  });
};
const targetInRange = (u, side, scene) => {
  const enemies = enemiesOf(side);
  const inReach = [];
  if (canShoot(u)) {
    for (const [i, e] of enemies) {
      const dd = manhattan(u.q, u.r, e.q, e.r);
      if (dd >= 1 && dd <= u.range) inReach.push([i, e]);
    }
  } else {
    for (const [i, e] of enemies) {
      if (meleeBlockedByWallFor(u, e, scene)) continue;
      const dd = manhattan(u.q, u.r, e.q, e.r);
      if (dd === 1 || dd === 0) inReach.push([i, e]);
    }
  }
  if (inReach.length === 0) return null;
  const lowestHp = (list) => {
    let best = list[0];
    for (const x of list) if (x[1].hp < best[1].hp) best = x;
    return best[0];
  };
  const desired = desiredHitForDirection(u.attackDirection);
  if (desired) {
    const matching = inReach.filter(([, e]) => relativeHit(e.facing, u.q, u.r, e.q, e.r) === desired);
    if (matching.length > 0) return lowestHp(matching);
  }
  return lowestHp(inReach);
};
const takesRangedAction = (u) => canShoot(u) && u.shootingEnabled !== false;

// --- Wykonanie fragmentow pina (warstwa 2: oracle niezalezny od recznej transkrypcji) ---
const TS_JS = process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
const tsLib = createRequire(import.meta.url)(TS_JS);
const cityFortSrc = execFileSync('git', ['show', `${PIN}:gra/src/game/city-fortification.ts`], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\n');
const mbwStart = cityFortSrc.findIndex((l) => l.startsWith('export function meleeBlockedByWall('));
if (mbwStart < 0) throw new Error('brak meleeBlockedByWall w city-fortification.ts pina');
let mbwEnd = mbwStart;
while (cityFortSrc[mbwEnd] !== '}') mbwEnd++;
const mbwText = cityFortSrc.slice(mbwStart, mbwEnd + 1).join('\n').replace('export function', 'function');
// Klasa-obudowa: metody pina wklejone 1:1 (zakres linii jak w FRAGMENTS); typy usuwa transpilacja.
const execSrc = [
  pinRange(1917, 1919),
  pinRange(1956, 1960),
  'class P {',
  pinRange(8291, 8294),
  pinRange(17486, 17584),
  '}',
  'module.exports.P = P;',
  'module.exports.meleeBlockedByWall = meleeBlockedByWall;',
].join('\n');
const execJs = tsLib.transpileModule(`${mbwText}\n${execSrc}`, {
  compilerOptions: { module: tsLib.ModuleKind.CommonJS, target: tsLib.ScriptTarget.ES2020 },
}).outputText;
const pinMod = { exports: {} };
// relativeHit (battleScene.ts, poza wycietymi fragmentami) bierzemy z JS; pozostale zaleznosci sa w pinie.
new Function('module', 'exports', 'require', 'relativeHit', execJs)(pinMod, pinMod.exports, createRequire(import.meta.url), relativeHit);
const PIN_PICK = {
  pick_target: '_pickTargetByPriority',
  pick_adjacent: '_pickAdjacentTargetByPriority',
  pick_ranged: '_pickRangedTargetByPriority',
};
// Wykonuje metode pina na obiektach testowych; zwraca indeks w side (jak warstwa JS) albo null.
const execPick = (kind, input) => {
  const wrap = (u, side) => ({ ...u, side, bu: { hp: u.hp }, groupId: input.group ? 'g' : undefined });
  const defs = input.side.map((u) => wrap(u, 'def'));
  const atk = wrap(input.attacker, 'atk');
  const inst = new pinMod.exports.P();
  inst.atk = [];
  inst.def = defs;
  inst._targetPriorities = input.army ?? DEFAULT_TARGET_PRIORITIES;
  inst._groupMeta = new Map(input.group ? [['g', input.group]] : []);
  const r = inst[PIN_PICK[kind]](atk);
  return r === null || r === undefined ? null : defs.indexOf(r);
};
let execChecked = 0;

// --- Przypadki ---
const UNIT_DEFAULTS = {
  q: 0, r: 0, hp: 10, range: 1, mounted: false, primaryRanged: false, rangedBase: false, ammoLeft: 0,
  shootingEnabled: true, antiCavSpear: false, facing: 0, onWallWalkway: false, isSiegeUnit: false,
  attackDirection: 'front', dead: false, fadingOut: false, routed: false,
  useUnitPriorities: false, unitTargetPriorities: null,
};
const U = (over) => ({ ...UNIT_DEFAULTS, ...over });
const INF = { siegeWallCol: -1, wallEverBreached: false };
const WALL = (breached = false) => ({ siegeWallCol: 1, wallEverBreached: breached });
const cases = [];
const add = (kind, name, input, expect) => {
  if (PIN_PICK[kind]) {
    const got = execPick(kind, input);
    if (got !== expect) throw new Error(`rozjazd wykonanie pina vs JS: ${kind}/${name}: pin=${got} js=${expect}`);
    execChecked++;
  }
  if (kind === 'target_in_range') {
    const ctxOf = (u, e) => ({
      wallBreached: input.scene.wallEverBreached,
      attackerIsMelee: !canShoot(u) && !u.isSiegeUnit,
      attackerOnWall: u.onWallWalkway === true,
      defenderOnWall: e.onWallWalkway === true,
    });
    for (const e of input.side) {
      const js = meleeBlockedByWall(ctxOf(input.attacker, e));
      const ex = pinMod.exports.meleeBlockedByWall(ctxOf(input.attacker, e));
      if (js !== ex) throw new Error(`rozjazd meleeBlockedByWall pin vs JS: ${name}: pin=${ex} js=${js}`);
      execChecked++;
    }
  }
  cases.push({ kind, name, ...input, expect });
};

// Nazwane przypadki (minimum dispatchu + mutacje).
{
  const inf = U({ q: 0, r: 0 });
  const cav = U({ q: 1, r: 0, mounted: true, hp: 10 });
  const spear = U({ q: 2, r: 0, hp: 10, antiCavSpear: true });
  add('pick_target', 'piechota_vs_jazda_vs_wloznia_default', { attacker: inf, side: [cav, spear], army: null, group: null },
    pickTargetByPriority(inf, [cav, spear], DEFAULT_TARGET_PRIORITIES, null));
  // Jazda vs wloznia (bonus +0.45) -- rozstrzyga bonus: wloznia d=1 (score 0.45) vs zwykla piechota d=5 (score 0).
  const jazda = U({ q: 0, r: 0, mounted: true });
  const sp = U({ q: 1, r: 0, hp: 10, antiCavSpear: true });
  const plain = U({ q: 5, r: 0, hp: 10 });
  const army = { mounted: ['melee', 'ranged', 'mounted'], ranged: ['ranged', 'mounted', 'melee'], melee: ['melee', 'ranged', 'mounted'] };
  add('pick_target', 'jazda_bonus_antyjazda_przesuwa_wybor', { attacker: jazda, side: [sp, plain], army, group: null },
    pickTargetByPriority(jazda, [sp, plain], army, null));
  // Jazda domyslnie: lucznik (score 1) bije wloznie (score 2.45 z bonusem).
  const rng = U({ q: 3, r: 0, ranged: true, rangedBase: true, ammoLeft: 2 });
  add('pick_target', 'jazda_domyslnie_lucznik_przed_wloznia', { attacker: jazda, side: [sp, rng], army: null, group: null },
    pickTargetByPriority(jazda, [sp, rng], DEFAULT_TARGET_PRIORITIES, null));
  // Remis po dystansie (tie-break = dystans, nie HP).
  const near = U({ q: 1, r: 0, hp: 10 });
  const farLow = U({ q: 4, r: 0, hp: 1 });
  add('pick_target', 'remis_po_dystansie_nie_lowest_hp', { attacker: inf, side: [farLow, near], army: null, group: null },
    pickTargetByPriority(inf, [farLow, near], DEFAULT_TARGET_PRIORITIES, null));
  add('pick_target', 'remis_calkowity_pierwszy_w_kolejnosci', { attacker: inf, side: [U({ q: 2, r: 0 }), U({ q: 0, r: 2 })], army: null, group: null },
    pickTargetByPriority(inf, [U({ q: 2, r: 0 }), U({ q: 0, r: 2 })], DEFAULT_TARGET_PRIORITIES, null));
  // Martwi / rozbici nie sa celami.
  const dead = U({ q: 1, r: 0, dead: true });
  const alive = U({ q: 3, r: 0 });
  add('pick_target', 'enemies_of_pomija_martwych', { attacker: inf, side: [dead, alive], army: null, group: null },
    pickTargetByPriority(inf, [dead, alive], DEFAULT_TARGET_PRIORITIES, null));
  // Priorytety: nadpisanie jednostki (dlugosc 3) wygrywa z armia; dlugosc != 3 -> grupa.
  const ovr = U({ q: 0, r: 0, mounted: false, useUnitPriorities: true, unitTargetPriorities: { melee: ['ranged', 'melee', 'mounted'] } });
  add('prefs', 'prefs_nadpisanie_jednostki_dlugosc3', { attacker: ovr, army: null, group: null }, prefsForUnit(ovr, DEFAULT_TARGET_PRIORITIES, null));
  const ovrShort = U({ q: 0, r: 0, useUnitPriorities: true, unitTargetPriorities: { melee: ['ranged'] } });
  const grp = { useGroupPriorities: true, groupTargetPriorities: { melee: ['mounted', 'melee', 'ranged'] } };
  add('prefs', 'prefs_nadpisanie_krotkie_spada_na_grupe', { attacker: ovrShort, army: null, group: grp }, prefsForUnit(ovrShort, DEFAULT_TARGET_PRIORITIES, grp));
  add('prefs', 'prefs_grupa_bez_flagi_spada_na_armie', { attacker: inf, army: null, group: { useGroupPriorities: false, groupTargetPriorities: { melee: ['mounted', 'melee', 'ranged'] } } },
    prefsForUnit(inf, DEFAULT_TARGET_PRIORITIES, { useGroupPriorities: false, groupTargetPriorities: { melee: ['mounted', 'melee', 'ranged'] } }));
  // Przylegajacy: kierunek 'bok' wymusza flank. Obrońca (1,0)... atakujacy (0,0), obrońca e1 (1,0) facing N -> flank.
  const att = U({ q: 0, r: 0, attackDirection: 'bok' });
  const e1 = U({ q: 1, r: 0, hp: 5, facing: 0 });
  const e2 = U({ q: 0, r: 1, hp: 1, facing: 0 });
  add('pick_adjacent', 'przylegajacy_bok_wymusza_flank', { attacker: att, side: [e1, e2], army: null, group: null },
    pickAdjacentTargetByPriority(att, [e1, e2], DEFAULT_TARGET_PRIORITIES, null));
  add('pick_adjacent', 'przylegajacy_front_bez_wymuszenia_hp', { attacker: U({ q: 0, r: 0 }), side: [e1, e2], army: null, group: null },
    pickAdjacentTargetByPriority(U({ q: 0, r: 0 }), [e1, e2], DEFAULT_TARGET_PRIORITIES, null));
  // Zasieg strzalu: najblizszy w [1..range], dd=0 pominiety.
  const shooter = U({ q: 0, r: 0, ranged: true, rangedBase: true, ammoLeft: 2, range: 3 });
  const s0 = U({ q: 0, r: 0, hp: 1 });
  const s1 = U({ q: 1, r: 0, hp: 9 });
  const s3 = U({ q: 3, r: 0, hp: 1 });
  add('ranged_in_range', 'najblizszy_w_zasiegu_dd0_pominiety', { attacker: shooter, side: [s0, s1, s3] }, rangedTargetInRange(shooter, [s0, s1, s3]));
  add('ranged_in_range', 'remis_odleglosci_nizsze_hp', { attacker: shooter, side: [U({ q: 2, r: 0, hp: 9 }), U({ q: 0, r: 2, hp: 4 })] },
    rangedTargetInRange(shooter, [U({ q: 2, r: 0, hp: 9 }), U({ q: 0, r: 2, hp: 4 })]));
  add('pick_ranged', 'zasieg_przez_priorytet_i_dystans', { attacker: shooter, side: [s3, s1], army: null, group: null },
    pickRangedTargetByPriority(shooter, [s3, s1], DEFAULT_TARGET_PRIORITIES, null));
  // Filtr muru: melee nie bije obroncy na murze, dopoki mur stoi.
  const melee = U({ q: 0, r: 0, hp: 10 });
  const onWall = U({ q: 1, r: 0, hp: 1, onWallWalkway: true });
  const open = U({ q: 0, r: 1, hp: 10 });
  add('target_in_range', 'melee_blokowany_przez_mur', { attacker: melee, side: [onWall, open], scene: WALL(false) },
    targetInRange(melee, [onWall, open], WALL(false)));
  add('target_in_range', 'melee_po_wylomie_bije_obroncy_na_murze', { attacker: melee, side: [onWall, open], scene: WALL(true) },
    targetInRange(melee, [onWall, open], WALL(true)));
  add('target_in_range', 'brak_muru_nie_blokuje', { attacker: melee, side: [onWall, open], scene: INF },
    targetInRange(melee, [onWall, open], INF));
  // dd === 0 (ten sam heks) liczy sie wrecz; wybor po lowestHp.
  const sameTile = U({ q: 0, r: 0, hp: 2 });
  const adjHp5 = U({ q: 1, r: 0, hp: 5 });
  add('target_in_range', 'dd0_ten_sam_heks_w_zasiegu', { attacker: melee, side: [sameTile, adjHp5], scene: INF },
    targetInRange(melee, [sameTile, adjHp5], INF));
  const lowA = U({ q: 1, r: 0, hp: 9 });
  const lowB = U({ q: 0, r: 1, hp: 4 });
  add('target_in_range', 'wybor_po_lowest_hp', { attacker: melee, side: [lowA, lowB], scene: INF },
    targetInRange(melee, [lowA, lowB], INF));
  // Strzelec w target_in_range: zasieg [1..range], bez filtra muru.
  const shot2 = U({ q: 0, r: 0, ranged: true, rangedBase: true, ammoLeft: 1, range: 2, shootingEnabled: false });
  add('target_in_range', 'strzelec_zasieg_bez_filtra_muru', { attacker: shot2, side: [onWall, U({ q: 2, r: 0, hp: 3 })], scene: WALL(false) },
    targetInRange(shot2, [onWall, U({ q: 2, r: 0, hp: 3 })], WALL(false)));
  // Warunek strzalu: shootingEnabled == false wylacza strzal.
  add('takes_ranged_action', 'shooting_disabled_wylacza_strzal', { attacker: shot2 }, takesRangedAction(shot2));
  add('takes_ranged_action', 'shooting_enabled_bez_amunicji_brak_strzalu', { attacker: U({ rangedBase: true, ammoLeft: 0 }) },
    takesRangedAction(U({ rangedBase: true, ammoLeft: 0 })));
  add('takes_ranged_action', 'shooting_enabled_z_amunicja_strzela', { attacker: U({ rangedBase: true, ammoLeft: 1 }) },
    takesRangedAction(U({ rangedBase: true, ammoLeft: 1 })));
}

// Losowe przypadki (seed 2026, mulberry32) -- pokrycie kombinacji priorytetow, muru, kierunku i martwych.
let seed = 2026;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
const perm = (xs) => {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const CLS = ['mounted', 'ranged', 'melee'];
const randUnit = () => {
  const cls = pick(['mounted', 'ranged', 'melee', 'shooter']);
  const u = U({
    q: Math.floor(rnd() * 5), r: Math.floor(rnd() * 5), hp: pick([1, 2, 4, 5, 9, 10]),
    range: 1 + Math.floor(rnd() * 3), mounted: cls === 'mounted',
    rangedBase: cls === 'shooter', primaryRanged: cls === 'shooter' && rnd() < 0.5,
    ammoLeft: pick([0, 0, 1, 2]), shootingEnabled: rnd() < 0.8, antiCavSpear: rnd() < 0.3,
    facing: Math.floor(rnd() * 4), onWallWalkway: rnd() < 0.3, isSiegeUnit: rnd() < 0.1,
    attackDirection: pick(['front', 'front', 'bok', 'tyl']), dead: rnd() < 0.1,
    fadingOut: rnd() < 0.05, routed: rnd() < 0.05,
  });
  if (cls === 'ranged') u.primaryRanged = true;
  return u;
};
const randPartial = () => {
  if (rnd() < 0.4) return null;
  const p = {};
  for (const c of CLS) if (rnd() < 0.6) p[c] = rnd() < 0.85 ? perm(CLS) : perm(CLS).slice(0, 2);
  return p;
};
const randArmy = () => (rnd() < 0.5 ? null : { mounted: perm(CLS), ranged: perm(CLS), melee: perm(CLS) });
const randGroup = () => (rnd() < 0.5 ? null : { useGroupPriorities: rnd() < 0.6, groupTargetPriorities: randPartial() });
const randScene = () => (rnd() < 0.5 ? INF : { siegeWallCol: pick([-1, 1, 2]), wallEverBreached: rnd() < 0.3 });
for (let n = 0; n < 400; n++) {
  const attacker = randUnit();
  attacker.useUnitPriorities = rnd() < 0.4;
  attacker.unitTargetPriorities = randPartial();
  const side = Array.from({ length: Math.floor(rnd() * 6) }, randUnit);
  const army = randArmy();
  const group = randGroup();
  const ap = army ?? DEFAULT_TARGET_PRIORITIES;
  const scene = randScene();
  add('pick_target', `rnd_target_${n}`, { attacker, side, army, group }, pickTargetByPriority(attacker, side, ap, group));
  add('pick_adjacent', `rnd_adjacent_${n}`, { attacker, side, army, group }, pickAdjacentTargetByPriority(attacker, side, ap, group));
  add('pick_ranged', `rnd_ranged_${n}`, { attacker, side, army, group }, pickRangedTargetByPriority(attacker, side, ap, group));
  add('ranged_in_range', `rnd_ranged_in_range_${n}`, { attacker, side }, rangedTargetInRange(attacker, side));
  add('target_in_range', `rnd_target_in_range_${n}`, { attacker, side, scene }, targetInRange(attacker, side, scene));
  add('prefs', `rnd_prefs_${n}`, { attacker, army, group }, prefsForUnit(attacker, ap, group));
  add('takes_ranged_action', `rnd_takes_${n}`, { attacker }, takesRangedAction(attacker));
}

const out = {
  pin: PIN,
  pinPath: PIN_PATH,
  fragments: FRAGMENTS,
  fragmentSha256: allDigest,
  cases,
};
const dir = join(dirname(fileURLToPath(import.meta.url)), 'p6_k5doc_target_vectors');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'vectors.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`pin-exec: ${execChecked} sprawdzen zgodnych z wykonaniem pina`);
console.log(`zapisano ${cases.length} przypadkow -> ${join(dir, 'vectors.json')}`);
