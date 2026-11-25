// R-WEB-BATTLE-FLEE-MANUAL-MODE-HARAPPA-MEASURE-Q1: prawdziwa bitwa 3D w Chromium w RECZNYM trybie
// (bez skip/auto). Wymusza rozbicie jednej jednostki gracza (?route=Nazwa, pierwsza zywa z ta nazwa)
// po starcie bitwy i rejestruje kroki ruchu uciekiniera (hook na _doMove) per tura oraz jego normalny
// zasieg (_movementPointsFor) i zapas _fleeMovePointsFor. Query: ?atk=..&def=..&seed=N&route=Nazwa&rounds=N
import { BattleScene } from '../src/battle/battleScene.ts';
import { buildTestArmies, PRESETS } from '../src/battle/testBattle.ts';
import units from '../data/units.json';
import counters from '../data/counters.json';
import terrainCombat from '../data/terrain-combat.json';

const q = new URLSearchParams(location.search);
{
  let a = (Number(q.get('seed') ?? '1') >>> 0) || 1;
  Math.random = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const parse = (s: string) => s.split(',').filter(Boolean).map(p => { const [u, c] = p.split(':'); return { unitTypeId: u, count: Number(c) }; });
(PRESETS as any).maly = {
  label: 'flee-manual', teren: q.get('teren') ?? 'Rownina',
  attacker: parse(q.get('atk') ?? 'Wojownik:6'), defender: parse(q.get('def') ?? 'Wojownik:6'),
};
const armies = buildTestArmies(units, 'maly');
const scene: any = new BattleScene({
  attacker: armies.attacker, defender: armies.defender, teren: armies.teren,
  data: { units, counters, terrainCombat, cywilizacje: [] },
  attackerCivLabel: q.get('civA') ?? 'Rzym', defenderCivLabel: q.get('civD') ?? 'Grecja',
} as any);
scene.renderer.setPixelRatio(Number(q.get('pr') ?? '0.1'));

const api: any = { ready: true, done: false, result: null as any, routedId: null as string | null,
  routeRound: 0, steps: {} as Record<string, Record<string, number>>, info: {} as Record<string, any>, log: [] as any[] };
(window as any).__e2e = api;
(window as any).__scene = scene;
const MAX_ROUNDS = Number(q.get('rounds') ?? '6');

{
  const tid = new WeakMap<object, number>();
  let nextTid = 1;
  const origMove = scene._doMove.bind(scene);
  scene._doMove = (ru: any, col: number, row: number, done: () => void) => {
    if (ru.routed && !ru.removed && ru.mats?.length > 0 && api.routedId) {
      if (!tid.has(ru)) tid.set(ru, nextTid++);
      const id = `${ru.side}#${tid.get(ru)}`;
      const per = (api.steps[id] ??= {});
      const rk = String(scene.roundNo);
      per[rk] = (per[rk] ?? 0) + 1;
      api.info[id] = { nazwa: ru.bu.nazwa, side: ru.side, normal: scene._movementPointsFor(ru.bu), flee: scene._fleeMovePointsFor(ru.bu), manualMode: scene._manualMode };
      // R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1 (r2): `from` = pole ZAJMOWANE przed krokiem (pozycja startowa dla pierwszego kroku).
      api.log.push({ round: scene.roundNo, id, from: { col: ru.q, row: ru.r }, col, row, moveLeft: +ru.moveLeft.toFixed(2) });
    }
    return origMove(ru, col, row, done);
  };
}

function forceRout(): void {
  if (api.routedId || !scene.started || scene.deployPhase) return;
  const name = q.get('route') ?? 'Wojownik';
  const ru = scene._playerRoster().find((u: any) => !u.dead && !u.removed && u.bu.nazwa === name);
  if (!ru) return;
  ru.routed = true;
  api.routedId = `${ru.side}:${ru.bu.nazwa}`;
  api.routeRound = scene.roundNo;
  // Reczny tryb czeka na SPACJE (start tury 1): wywolujemy ten sam kod co klawisz.
  if (scene._battleAwaitingOrders) scene._kickoffBattleTurn();
}

function finish(): void {
  const rows = Object.keys(api.steps).map(id => {
    const per = Object.values(api.steps[id]) as number[];
    return { id, ...api.info[id], maxPerRound: Math.max(...per), totalSteps: per.reduce((a, b) => a + b, 0), perRound: api.steps[id], rounds: per.length };
  });
  api.result = { round: scene.roundNo, winner: scene._endWinner, routed: rows, routedId: api.routedId, routeRound: api.routeRound, log: api.log.slice(0, 2000) };
  api.done = true;
}
function loop(): void {
  forceRout();
  if (scene.finished || (api.routedId && scene.roundNo > api.routeRound + MAX_ROUNDS) ) { finish(); return; }
  requestAnimationFrame(loop);
}
scene.play(() => {});
scene._setSpeedIdx(9, { clamp: true });
if (scene.deployPhase) scene._endDeployPhase();
requestAnimationFrame(loop);
