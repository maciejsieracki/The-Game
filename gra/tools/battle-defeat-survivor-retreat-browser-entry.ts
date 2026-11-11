// R-WEB-BATTLE-DEFEAT-SURVIVOR-RETREAT-TWO-HEX-Q1: prawdziwa bitwa 3D (pole / oblezenie, Skip)
// w Chromium; wynik (_endWinner/_endSurvivors) trafia do prawdziwego applyPostBattleMap.
// Query: ?siege=1 &mode=skip|auto
import { BattleScene } from '../src/battle/battleScene.ts';
import { buildTestArmies } from '../src/battle/testBattle.ts';
import { applyPostBattleMap } from '../src/game/post-battle-map';
import units from '../data/units.json';
import counters from '../data/counters.json';
import terrainCombat from '../data/terrain-combat.json';

const q = new URLSearchParams(location.search);
const siege = q.has('siege');
const mode = q.get('mode') ?? 'skip';
const armies = buildTestArmies(units, siege ? 'oblezenie_duze' : 'bitwa_duza_pole');
// Slabe armie: bitwa konczy sie lamaniem morale -> przegrani z HP>0 (rout) obecni w wyniku.
const atkMul = Number(q.get('atkhp') ?? '0.35');
for (const [side, mul] of [[armies.attacker, atkMul], [armies.defender, Number(q.get('defhp') ?? '0.35')]] as const) {
  for (const bu of side as any[]) { bu.hp = Math.max(1, Math.round(bu.maxHp * mul)); }
}
const scene: any = new BattleScene({
  attacker: armies.attacker, defender: armies.defender, teren: armies.teren,
  data: { units, counters, terrainCombat, cywilizacje: [] },
  attackerCivLabel: 'Rzym', defenderCivLabel: 'Grecja',
  ...(siege ? { siege: { defCiv: 'grecy' as const, builtBuildingIds: ['mury'] } } : {}),
} as any);
scene.renderer.setPixelRatio(0.1);

const api: any = { ready: true, done: false, result: null as any };
(window as any).__e2e = api;

function finish(): void {
  const winner: 'atakujacy' | 'obronca' | 'remis' = scene._endWinner;
  const survivors = scene._endSurvivors as Array<{ id: string; hp: number }>;
  const atkIds: string[] = scene.atk.map((u: any) => String(u.bu.id));
  const defIds: string[] = scene.def.map((u: any) => String(u.bu.id));
  const mk = (id: string, owner: number, qq: number, rr: number) =>
    ({ id, ownerId: owner, typeId: 'Wojownik', q: qq, r: rr, ruchLeft: 2, hp: 100 }) as any;
  const world = [...atkIds.map(id => mk(id, 0, 11, 23)), ...defIds.map(id => mk(id, 1, 11, 22))];
  const atkRoster = world.filter(u => u.ownerId === 0);
  const defRoster = world.filter(u => u.ownerId === 1);
  const survivorIds = new Set(survivors.map(s => String(s.id)));
  applyPostBattleMap({
    units: world, map: { hexes: {} } as any, cities: [],
    battleQ: 11, battleR: 22,
    atkAnchor: atkRoster[0], atkRoster, defRoster,
    atkStart: new Map(atkRoster.map(u => [u.id, { q: 11, r: 23 }])),
    winner, manualSurvivors: survivors.map(s => ({ id: String(s.id), hp: s.hp })),
    getDef: () => ({ health: 100 }) as any, maxHpOf: () => 100,
    isPassableHex: () => true,
    isUnitAt: (qq: number, rr: number, ex?: any) => world.some(u => u.id !== ex && u.q === qq && u.r === rr),
  } as any);
  const loserOwner = winner === 'atakujacy' ? 1 : 0;
  const hd = (a: any, b: any) => (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;
  const loserIds = (loserOwner === 1 ? defIds : atkIds);
  const loserSurvivorIds = loserIds.filter(id => survivorIds.has(id));
  const loserOnMap = world.filter(u => u.ownerId === loserOwner);
  const loserDeadIds = loserIds.filter(id => !survivorIds.has(id));
  api.result = {
    siege, winner, rosterSizes: [atkIds.length, defIds.length],
    exportedSurvivors: survivors.length,
    loserSurvivorsExported: loserSurvivorIds.length,
    loserDead: loserDeadIds.length,
    loserOnMap: loserOnMap.length,
    loserRetreatDistances: loserOnMap.map(u => hd(u, { q: 11, r: 22 })),
    loserDeadStillOnMap: loserOnMap.filter(u => loserDeadIds.includes(u.id)).length,
  };
  api.done = true;
}

function loop(): void {
  if (scene.finished) { finish(); return; }
  requestAnimationFrame(loop);
}
scene.play(() => {});
scene._setSpeedIdx(9, { clamp: true });
if (mode === 'skip') scene.skip();
else if (scene._manualMode) scene._toggleManualMode();
requestAnimationFrame(loop);
