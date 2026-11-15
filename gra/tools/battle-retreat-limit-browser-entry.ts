// R-WEB-BATTLE-RETREAT-LIMIT-3-PER-TURN-THEN-DESTROYED-Q1 (Chromium, czesciowa weryfikacja):
// kopia entry R-WEB-BATTLE-DEFEAT-SURVIVOR-RETREAT-TWO-HEX-Q1 z ustawionym licznikiem odwrotow
// ?retreat=N (obie armie). Prawdziwa bitwa 3D + prawdziwy applyPostBattleMap + helper limitu.
// R-WEB-BATTLE-DEFEAT-SURVIVOR-RETREAT-TWO-HEX-Q1: prawdziwa bitwa 3D (pole / oblezenie, Skip)
// w Chromium; wynik (_endWinner/_endSurvivors) trafia do prawdziwego applyPostBattleMap.
// Query: ?siege=1 &mode=skip|auto|instant|cap
// instant = _skipInstantFallback (computeInstantResult), cap = _ffRoundCapResult (sufit przewijania, wymuszony werdykt).
import { BattleScene } from '../src/battle/battleScene.ts';
import { buildTestArmies } from '../src/battle/testBattle.ts';
import { applyPostBattleMap } from '../src/game/post-battle-map';
import { retreatBudgetExhausted, ARMIA_UNICESTWIONA_KOMUNIKAT } from '../src/game/battle-retreat-limit';
import units from '../data/units.json';
import counters from '../data/counters.json';
import terrainCombat from '../data/terrain-combat.json';

const q = new URLSearchParams(location.search);
// Determinizm: stale ziarno PRNG (Math.random) -- ten sam przebieg przy kazdym uruchomieniu (?seed=N).
{
  let a = (Number(q.get('seed') ?? '12345') >>> 0) || 1;
  Math.random = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const siege = q.has('siege');
const mode = q.get('mode') ?? 'skip';
const retreatN = Number(q.get('retreat') ?? '0');
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
  // Licznik odwrotow armii (parytet: obie strony) -- wspolny licznik rosteru, jak w grze.
  for (const u of world) u.odwrotyWTurze = retreatN;
  const atkRoster = world.filter(u => u.ownerId === 0);
  const defRoster = world.filter(u => u.ownerId === 1);
  const defBudgetExhausted = retreatBudgetExhausted(defRoster);
  const atkBudgetExhausted = retreatBudgetExhausted(atkRoster);
  const survivorIds = new Set(survivors.map(s => String(s.id)));
  const postRes: any = applyPostBattleMap({
    units: world, map: { hexes: {} } as any,
    // Oblezenie = bitwa W MIESCIE (miasto obroncy na heksie bitwy): przegrani gina (decyzja wlasciciela).
    cities: siege ? [{ id: 'cD', ownerId: 1, q: 11, r: 22, name: 'D' }] as any : [],
    cityOnBattleHex: siege ? ({ id: 'cD', ownerId: 1, q: 11, r: 22, name: 'D' } as any) : null,
    battleQ: 11, battleR: 22,
    atkAnchor: atkRoster[0], atkRoster, defRoster,
    atkStart: new Map(atkRoster.map(u => [u.id, { q: 11, r: 23 }])),
    winner, manualSurvivors: survivors.map(s => ({ id: String(s.id), hp: s.hp })),
    defRetreatBudgetExhausted: defBudgetExhausted,
    atkRetreatBudgetExhausted: atkBudgetExhausted,
    getDef: () => ({ health: 100 }) as any, maxHpOf: () => 100,
    isPassableHex: () => true,
    isUnitAt: (qq: number, rr: number, ex?: any) => world.some(u => u.id !== ex && u.q === qq && u.r === rr),
  } as any);
  const isDraw = winner === 'remis'; // remis nie jest przegrana: brak przegranych, nic nie wymaga odwrotu
  const loserOwner = isDraw ? -1 : winner === 'atakujacy' ? 1 : 0;
  const hd = (a: any, b: any) => (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;
  const loserIds = isDraw ? [] : (loserOwner === 1 ? defIds : atkIds);
  const loserSurvivorIds = loserIds.filter(id => survivorIds.has(id));
  const loserOnMap = world.filter(u => u.ownerId === loserOwner);
  const loserDeadIds = loserIds.filter(id => !survivorIds.has(id));
  api.result = {
    siege, winner, isDraw, atkOnMap: world.filter(u => u.ownerId === 0).length, defOnMap: world.filter(u => u.ownerId === 1).length,
    exportedIds: survivors.map(s => String(s.id)), worldIds: world.map(u => u.id),
    rosterSizes: [atkIds.length, defIds.length],
    exportedSurvivors: survivors.length,
    loserSurvivorsExported: loserSurvivorIds.length,
    loserDead: loserDeadIds.length,
    loserOnMap: loserOnMap.length,
    loserRetreatDistances: loserOnMap.map(u => hd(u, { q: 11, r: 22 })),
    loserDeadStillOnMap: loserOnMap.filter(u => loserDeadIds.includes(u.id)).length,
    retreatN, defBudgetExhausted, atkBudgetExhausted,
    defAnnihilated: postRes.defenderAnnihilatedByRetreatLimit === true,
    atkAnnihilated: postRes.attackerAnnihilatedByRetreatLimit === true,
    unicestwionyKomunikat: ARMIA_UNICESTWIONA_KOMUNIKAT,
  };
  api.done = true;
}

function loop(): void {
  if (scene.finished) { finish(); return; }
  requestAnimationFrame(loop);
}
scene.play(() => {});
scene._setSpeedIdx(9, { clamp: true });
if (mode === 'instant') scene._skipInstantFallback();
else if (mode === 'cap') {
  scene._roundCapVerdict = () => ({ winner: 'atakujacy', reason: 'test', cap: 1 });
  scene._ffRoundCapResult();
}
else if (mode === 'skip') scene.skip();
else if (scene._manualMode) scene._toggleManualMode();
requestAnimationFrame(loop);
