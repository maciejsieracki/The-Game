// Generator wektorów P4-1I1B (R-RUSTPORT-P4-1I1B-BATTLE-INSTANT): WYKONUJE tekst pinu 07d2fbd72.
//
// Uruchomienie (z katalogu głównego repo):
//   D=$(mktemp -d)
//   git show 07d2fbd72:gra/src/battle/battleScene.ts        > $D/bs.ts
//   git show 07d2fbd72:gra/src/battle/battle-terrain.ts     > $D/bt.ts
//   git show 07d2fbd72:gra/src/game/combat.ts               > $D/combat.ts
//   git show 07d2fbd72:gra/src/game/city-defense.ts         > $D/cd.ts
//   git show 07d2fbd72:gra/src/battle/battle-unit-context.ts > $D/buc.ts
//   git show 07d2fbd72:gra/data/combat-params.json          > $D/cp.json
//   git show 07d2fbd72:gra/data/terrain-combat.json         > $D/tc.json
//   node dyspozycje/autobot/runs/R-RUSTPORT-P4-1I1B-BATTLE-INSTANT/dowody/gen-p4-1i1b-vectors.mjs $D
//
// Wycinki pinu WYKONANE bez zmian tekstu (usunięte tylko słowa `export`), uruchomione przez
// `node --experimental-transform-types` (const enum):
//   battleScene.ts:20389-20593  computeInstantResult            (CAŁA funkcja — obiekt testu)
//   battleScene.ts:3715-3748    _skipInstantFallback            (reguła wyłomu :3720-3722, filtr !dead :3724-3725)
//   battleScene.ts:1552-1559    isSiegeUnit, :1648-1650 normName
//   battleScene.ts:315-320      const enum Dir, :326-331 DIR_DELTA, :347-353 facingToward, :370-372 oppositeDir,
//                               :385-400 relativeHit, :1897-1899 isFordTile, :1907-1914 isShoreAdjacentToFord
//   battle-terrain.ts:37-46     const enum BTerrain, :150-159 COMBAT_NAME
//   combat.ts:620-624           normTerrain, :632-671 parseDefenseBonusPct + terrainDefenseMultiplier
//   city-defense.ts:113-130     defenderInsideFortification + fortificationDefenseBonusForUnit
//   city-defense.ts:180-190     cityGatedTerrainMultiplier, :237-245 fieldFortifyDefenseBonus
//   battle-unit-context.ts:1-14 battleUnitCivBonusy, battleUnitDifficultyCombatMult
// Stałe: BROD_KARA_OBRONA / BROD_BONUS_BRZEG / FORTIFY_OBRONA_PROC_FIELD z combat-params.json pinu
// (battleScene.ts:984-993: `BROD.karaObrona`, `BROD.bonusObronaBrzegu`, `oblężenie.fortify_obrona_proc`).
//
// PODSTAWIONE (jawnie, poza zakresem tematu):
//   - resolveCombat (combat.ts:842-1251): deterministyczny resolver-rejestrator STUB_RESOLVER (formuła niżej, ta sama
//     w teście Rust). Rejestruje KAŻDY argument pary (cu_a, cu_d po korektach, opcje), więc test porównuje wejście
//     resolvera 1:1 z pinem. Pełny resolveCombat nie jest portowany w silniku (#135/#167).
//   - toCombatUnit (battleScene.ts:1355-1378): minimum pól (typNazwa, meleeAttack, meleeDefence, health) dla wierszy
//     bez weterana/głodu/deficytu; w Rust działa PRAWDZIWY `to_combat_unit` (porównanie pól wejścia resolvera).
//   - terrainMap: obiekt z `at` (kody BTerrain) i `combatTerrainName` = ciało lambdy battle-terrain.ts:802-806
//     (COMBAT_NAME z pinu; poza siatką Plains jak `at` :781-784).
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const D = process.argv[2];
const rd = (f) => readFileSync(join(D, f), 'utf8').split('\n');
const bs = rd('bs.ts'), bt = rd('bt.ts'), cb = rd('combat.ts'), cd = rd('cd.ts'), buc = rd('buc.ts');
const cp = readFileSync(join(D, 'cp.json'), 'utf8');
const tc = readFileSync(join(D, 'tc.json'), 'utf8');
const L = (lines, a, b) => lines.slice(a - 1, b).join('\n').replace(/^export /gm, '');

const harness = `
const combatParamsData: any = ${cp};
const TERRAIN_DATA: any[] = ${tc};
${L(bt, 37, 46)}
${L(bt, 150, 159)}
${L(bs, 315, 320)}
${L(bs, 326, 331)}
${L(bs, 347, 353)}
${L(bs, 370, 372)}
${L(bs, 385, 400)}
${L(bs, 1897, 1899)}
${L(bs, 1907, 1914)}
${L(bs, 1552, 1559)}
${L(bs, 1648, 1650)}
${L(cb, 620, 624)}
${L(cb, 632, 671)}
${L(cd, 113, 130)}
${L(cd, 180, 190)}
${L(cd, 237, 245)}
${L(buc, 1, 14)}
const BROD = combatParamsData.brod;
const BROD_KARA_OBRONA = BROD.karaObrona;
const BROD_BONUS_BRZEG = BROD.bonusObronaBrzegu;
const FORTIFY_OBRONA_PROC_FIELD: number = combatParamsData['oblężenie'].fortify_obrona_proc;

let CALLS: any[] = [];
let TCU: any[] = [];
function toCombatUnit(bu: any, hunger: any, skipHunger: any, gold: any, skipGold: any): any {
  TCU.push({ hunger, skipHunger, gold, skipGold });
  const s = bu.stats ?? {};
  return { typNazwa: String(s['Jednostka'] ?? bu.kategoria), meleeAttack: s.meleeAttack ?? 0,
           meleeDefence: s.meleeDefence ?? 0, health: bu.hp };
}
const S = (x: number) => (Object.is(x, -0) ? '-0' : String(x));
// STUB_RESOLVER (ta sama formuła w tests/p4_1i1b_battle_instant.rs, StubResolver)
function resolveCombat(cu_a: any, cu_d: any, opts: any): any {
  const kd = opts.attackerPosition === 'rear' ? 2 : (opts.attackerPosition === 'flank' ? 1.5 : 1);
  const ovr = opts.defenderTerrainDefMultOverride ?? 1;
  const defPow = cu_d.meleeDefence * (1 + opts.structureDefBonusPct / 100) * ovr;
  const dmgToDef = Math.round(cu_a.meleeAttack * kd * 10 / Math.max(1, defPow));
  const dmgToAtk = Math.round(cu_d.meleeAttack * 10 / Math.max(1, cu_a.meleeDefence));
  const attackerHpLeft = Math.max(0, cu_a.health - dmgToAtk);
  const defenderHpLeft = Math.max(0, cu_d.health - dmgToDef);
  CALLS.push({
    a: cu_a.typNazwa, d: cu_d.typNazwa,
    aAtk: S(cu_a.meleeAttack), aDef: S(cu_a.meleeDefence), aHp: S(cu_a.health),
    dAtk: S(cu_d.meleeAttack), dDef: S(cu_d.meleeDefence), dHp: S(cu_d.health),
    maxRounds: opts.maxRounds, defenderTerrain: opts.defenderTerrain, attackerPosition: opts.attackerPosition,
    structureDefBonusPct: S(opts.structureDefBonusPct), defenderOnWallWalkway: opts.defenderOnWallWalkway,
    override: opts.defenderTerrainDefMultOverride === undefined ? null : S(opts.defenderTerrainDefMultOverride),
    atkCiv: opts.attackerCivBonusy.map((b: any) => b.cel), defCiv: opts.defenderCivBonusy.map((b: any) => b.cel),
    atkBld: [S(opts.attackerBuildingBonus.pancerz), S(opts.attackerBuildingBonus.other)],
    defBld: [S(opts.defenderBuildingBonus.pancerz), S(opts.defenderBuildingBonus.other)],
    atkHungry: opts.attackerArmyHungry, defHungry: opts.defenderArmyHungry, hungerMult: S(opts.armyHungerStatMult),
    atkGold: opts.attackerGoldDeficit, defGold: opts.defenderGoldDeficit, goldMult: S(opts.goldDeficitStatMult),
    atkDiff: S(opts.attackerDifficultyCombatMult), defDiff: S(opts.defenderDifficultyCombatMult),
    atkOwn: opts.attackerOwnTerritory, defOwn: opts.defenderOwnTerritory, shallowSea: opts.shallowSea,
    terrainDataSame: opts.terrainData === TERRAIN_DATA, countersSame: opts.counters === COUNTERS,
  });
  return { winner: 'draw', attackerHpLeft, defenderHpLeft, rounds: 1, routed: [],
    log: ['P ' + cu_a.typNazwa + '>' + cu_d.typNazwa + ' ' + opts.defenderTerrain + ' ' + opts.attackerPosition + ' '
      + S(opts.structureDefBonusPct) + ' A' + S(attackerHpLeft) + ' D' + S(defenderHpLeft)] };
}
const COUNTERS: any[] = [{ marker: 'counters' }];

${L(bs, 20389, 20593)}

function mkMap(m: any): any {
  if (!m) return undefined;
  const preset = { isMountain: m.isMountain };
  const at = (c: number, r: number): BTerrain => {
    if (c < 0 || c >= m.cols || r < 0 || r >= m.rows) return BTerrain.Plains;
    return m.tiles[r * m.cols + c] as BTerrain;
  };
  return {
    cols: m.cols, rows: m.rows, tiles: m.tiles, at,
    combatTerrainName: (c: number, r: number) => {
      const t = at(c, r);
      if (t === BTerrain.Hills && preset.isMountain) return 'Gory';
      return COMBAT_NAME[t] ?? 'Plaskie (rownina/laka)';
    },
  };
}

class Scene {
  atk: any[] = []; def: any[] = []; log: string[] = [];
  finished = false; siegeWallCol = -1; wallEverBreached = false;
  terrain: any; terrainData: any = TERRAIN_DATA; counters: any = COUNTERS; terrainMap: any;
  attackerCivBonusy: any; defenderCivBonusy: any; wallDefenseTotalProc: any; isCityDefenseBattle: any;
  armyHungerStatMult: any; attackerDifficultyCombatMult: any; defenderDifficultyCombatMult: any;
  goldDeficitStatMult: any; attackerOwnTerritory: any; defenderOwnTerritory: any; shallowSea: any;
  lastInstantDefBonus: any; _endWinner: any = null; _endSurvivors: any[] = []; shown: any = null;
  _showEndScreen(w: any) { this.shown = w; }
${L(bs, 3715, 3748)}
}

export function run(v: any): any {
  CALLS = []; TCU = [];
  const s = new Scene();
  const sc = v.scene;
  s.terrain = sc.terrain; s.terrainMap = mkMap(sc.map);
  s.attackerCivBonusy = sc.atkCiv.map((c: string) => ({ typ: 't', cel: c, wartosc: 1 }));
  s.defenderCivBonusy = sc.defCiv.map((c: string) => ({ typ: 't', cel: c, wartosc: 1 }));
  s.wallDefenseTotalProc = sc.wallProc; s.isCityDefenseBattle = sc.cityDefense;
  s.armyHungerStatMult = sc.hungerMult; s.attackerDifficultyCombatMult = sc.atkDiff;
  s.defenderDifficultyCombatMult = sc.defDiff; s.goldDeficitStatMult = sc.goldMult;
  s.attackerOwnTerritory = sc.atkOwn; s.defenderOwnTerritory = sc.defOwn; s.shallowSea = sc.shallowSea;
  s.siegeWallCol = sc.siegeWallCol; s.wallEverBreached = sc.wallEverBreached;
  const mk = (u: any, side: string) => {
    const bu: any = { id: u.id, kategoria: u.kategoria, hp: u.hp, stats: u.stats };
    if (u.nazwa !== undefined) bu.nazwa = u.nazwa;
    if (u.fortified) bu.fortifiedInField = true;
    if (u.pancerz !== undefined) bu.pancerzBonusFrac = u.pancerz;
    if (u.parametry !== undefined) bu.parametryBonusFrac = u.parametry;
    if (u.civ !== undefined) bu.civBonusy = u.civ.map((c: string) => ({ typ: 't', cel: c, wartosc: 1 }));
    if (u.diff !== undefined) bu.difficultyCombatMult = u.diff;
    if (u.hungry) bu.armyHungry = true;
    if (u.gold) bu.goldDeficit = true;
    return { bu, side, dead: u.dead === true, q: u.q, r: u.r, facing: u.facing, onWallWalkway: u.onWall === true };
  };
  s.atk = v.atk.map((u: any) => mk(u, 'atk'));
  s.def = v.def.map((u: any) => mk(u, 'def'));
  s._skipInstantFallback();
  return {
    winner: s._endWinner, shown: s.shown,
    survivors: s._endSurvivors.map((u: any) => [u.id, S(u.hp)]),
    log: s.log, wallEverBreached: s.wallEverBreached,
    defBonus: s.lastInstantDefBonus.map((b: any) => [b.q, b.r, b.onWall, S(b.pct)]),
    calls: CALLS, tcu: TCU,
  };
}
`;

const dir = mkdtempSync(join(tmpdir(), 'p41i1b-'));
const h = join(dir, 'h.ts');
writeFileSync(h, harness);
const vec = JSON.parse(readFileSync(new URL('./p4-1i1b-inputs.json', import.meta.url), 'utf8'));
const runner = join(dir, 'r.ts');
writeFileSync(runner, `import { run } from './h.ts';
const vs = ${JSON.stringify(vec)};
const out = vs.map((v: any) => ({ name: v.name, input: v, expect: run(v) }));
process.stdout.write(JSON.stringify(out, null, 1));
`);
const out = execFileSync(process.execPath, ['--experimental-transform-types', '--no-warnings', runner], {
  encoding: 'utf8',
});
writeFileSync(new URL('./p4-1i1b-vectors.json', import.meta.url), out + '\n');
process.stdout.write(`OK ${JSON.parse(out).length} wektorów\n`);
