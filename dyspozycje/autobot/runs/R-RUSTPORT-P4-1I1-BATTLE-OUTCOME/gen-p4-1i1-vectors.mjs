// Generator wektorów P4-1I1 (R-RUSTPORT-P4-1I1-BATTLE-OUTCOME): WYKONUJE tekst pinu 07d2fbd72.
//
// Uruchomienie (z katalogu głównego repo):
//   git show 07d2fbd72:gra/src/battle/battleScene.ts > /tmp/p41i1-bs.ts
//   git show 07d2fbd72:gra/src/units/battleRoster.ts > /tmp/p41i1-roster.ts
//   node dyspozycje/autobot/runs/R-RUSTPORT-P4-1I1-BATTLE-OUTCOME/gen-p4-1i1-vectors.mjs /tmp/p41i1-bs.ts /tmp/p41i1-roster.ts
//
// Wycinki pinu (bez zmian tekstu, tylko złożone w klasę-uprząż i uruchomione przez node --experimental-strip-types):
//   battleScene.ts:9467-9479   _finishDraw            (E2)
//   battleScene.ts:9485-9497   _ffRoundCapResult      (E3 / E2 przez cap.winner === 'remis')
//   battleScene.ts:10208-10240 ogon _checkEnd od `if (aliveA && aliveD) return false;` (E1)
//   battleScene.ts:10246-10250 _battleUnitsForMapExport
//   battleScene.ts:10257-10269 _sideEndStats
//   battleScene.ts:3715-3748   _skipInstantFallback   (E4; computeInstantResult podstawione wynikiem z wektora)
//   battleScene.ts:10719-10730 domknięcie onFinish (obiekt BattleResult)
//   battleRoster.ts:26-39      uniqueUnitIds + buildBattleEventLog
// _showEndScreen jest zastąpione minimum z pinu (:10666-10678 — `_endScreenShown`, `_sideEndStats`) + domknięcie onFinish.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [bsPath, rosterPath] = process.argv.slice(2);
const bs = readFileSync(bsPath, 'utf8').split('\n');
const roster = readFileSync(rosterPath, 'utf8').split('\n');
const L = (lines, a, b) => lines.slice(a - 1, b).join('\n');

const e1Tail = L(bs, 10208, 10240);
const harness = `
${L(roster, 26, 39).replace('export function', 'function')}
function isSiegeUnit(bu: any): boolean { return bu.siege === true; }
let INSTANT: any = null;
function computeInstantResult(..._a: any[]): any { return INSTANT; }
class S {
  atk: any[] = []; def: any[] = []; log: string[] = [];
  siegeWallCol = -1; wallEverBreached = false; finished = false;
  _ffActive = false; _ffQueue: any[] = [];
  _endWinner: any = null; _endSurvivors: any[] = []; _endScreenShown = false;
  capVerdict: any = null; stats: any = null; onFinish: any = null; result: any = null;
  terrain: any; terrainData: any; counters: any; terrainMap: any; attackerCivBonusy: any; defenderCivBonusy: any;
  wallDefenseTotalProc: any; isCityDefenseBattle: any; armyHungerStatMult: any; attackerDifficultyCombatMult: any;
  defenderDifficultyCombatMult: any; goldDeficitStatMult: any; attackerOwnTerritory: any; defenderOwnTerritory: any;
  shallowSea: any; lastInstantDefBonus: any;
  onFinishCb = (r: any) => { this.result = r; };
  _roundCapVerdict() { return this.capVerdict; }
  _showEndScreen(winner: 'atakujacy' | 'obronca' | 'remis'): void {
    this._ffActive = false;
    this._ffQueue = [];
    if (this._endScreenShown) return;
    this._endScreenShown = true;
    const sA = this._sideEndStats('atk');
    const sD = this._sideEndStats('def');
    this.stats = { atk: sA, def: sD };
    this.onFinish = () => {
${L(bs, 10719, 10730)}
    };
  }
${L(bs, 9467, 9479)}
${L(bs, 9485, 9497)}
  _e1(aliveA: boolean, aliveD: boolean): boolean {
${e1Tail}
${L(bs, 10246, 10250)}
${L(bs, 10257, 10269)}
${L(bs, 3715, 3748)}
}

function mk(spec: any[]) {
  return spec.map(([id, hp, maxHp, dead, routed, siege]) => ({ bu: { id, hp, maxHp, siege: !!siege }, dead: !!dead, routed: !!routed }));
}
function run(name: string, atk: any[], def: any[], siegeWallCol: number, breached: boolean, act: (s: S) => void) {
  const s = new S();
  s.atk = mk(atk); s.def = mk(def); s.siegeWallCol = siegeWallCol; s.wallEverBreached = breached;
  act(s);
  s.onFinish();
  const r = s.result;
  return {
    name,
    winner: r.winner,
    survivors: r.survivors.map((u: any) => ({ id: u.id, hp: u.hp })),
    attackerUnitIds: r.eventLog.attackerUnitIds,
    defenderUnitIds: r.eventLog.defenderUnitIds,
    hasWallBreached: 'wallBreached' in r,
    wallBreached: r.wallBreached ?? null,
    endStats: s.stats,
  };
}
// [id, hp, maxHp, dead, routed, siege]
const ATK = [[100, 30, 50, 0, 0, 0], [7, 0, 40, 1, 0, 0], [42, 12.5, 40, 1, 1, 0], [9, 4, 40, 0, 1, 0], [8, 0, 40, 0, 1, 0], [100, 30, 50, 0, 0, 0]];
const DEF = [[3, 0, 60, 1, 0, 0], [11, 5, 60, 1, 0, 0], [3, 0, 60, 1, 0, 0], [12, 7.25, 60, 0, 1, 0], [5, 20, 60, 0, 0, 0]];
const ATK_SIEGE = [[21, 15, 30, 0, 0, 1], [22, 0, 30, 1, 0, 0]];
const out = [
  run('e1_attacker', ATK, DEF, -1, false, s => { s._e1(true, false); }),
  run('e1_defender', ATK, DEF, -1, false, s => { s._e1(false, true); }),
  run('e2_draw_siege_no_breach', ATK, DEF, 4, false, s => { s._finishDraw('szturm odparty', 30); }),
  run('e3_ff_cap_defender_siege_breached', ATK, DEF, 4, true, s => { s.capVerdict = { winner: 'obronca', reason: 'r', cap: 30 }; s._ffRoundCapResult(); }),
  run('e3_ff_cap_attacker', ATK, DEF, -1, false, s => { s.capVerdict = { winner: 'atakujacy', reason: 'r', cap: 30 }; s._ffRoundCapResult(); }),
  run('e3_ff_cap_remis_is_e2', ATK, DEF, 4, false, s => { s.capVerdict = { winner: 'remis', reason: 'r', cap: 30 }; s._ffRoundCapResult(); }),
  run('e1_then_draw', ATK, DEF, -1, false, s => { s._e1(true, false); s._finishDraw('x', 30); }),
  run('end_winner_null_after_reset', ATK, DEF, -1, false, s => { s._e1(false, true); s._endWinner = null; s._endSurvivors = []; }),
  run('e4_siege_machine', ATK_SIEGE, DEF, 4, false, s => { INSTANT = { winner: 'atakujacy', survivors: [{ id: 21, hp: 9.5 }], log: [], defBonus: 0 }; s._skipInstantFallback(); }),
  run('e4_siege_no_machine_alive', [[21, 0, 30, 1, 0, 1], [22, 8, 30, 0, 0, 0]], DEF, 4, false, s => { INSTANT = { winner: 'obronca', survivors: [{ id: 5, hp: 3 }], log: [], defBonus: 0 }; s._skipInstantFallback(); }),
  run('e4_no_siege', ATK_SIEGE, DEF, -1, false, s => { INSTANT = { winner: 'atakujacy', survivors: [{ id: 21, hp: 9.5 }], log: [], defBonus: 0 }; s._skipInstantFallback(); }),
];
console.log(JSON.stringify(out, null, 1));
`;
const dir = mkdtempSync(join(tmpdir(), 'p41i1-'));
const f = join(dir, 'harness.ts');
writeFileSync(f, harness);
process.stdout.write(execFileSync(process.execPath, ['--experimental-strip-types', '--no-warnings', f], { encoding: 'utf8' }));
