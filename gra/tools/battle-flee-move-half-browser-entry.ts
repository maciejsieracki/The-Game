// R-WEB-BATTLE-FLEE-MOVE-HALF-Q1: prawdziwa bitwa 3D w Chromium (Vite HTTP). Zbiera, ile heksow przebywa
// KAZDA zrootowana (uciekajaca) jednostka w kazdej turze bitwy (hook na _doMove) oraz jej normalny zasieg
// ruchu (_movementPointsFor). Query: ?atk=Konnica:8 &def=Wojownik:14 &seed=N &mode=skip|instant|watch
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
  label: 'flee-move-half', teren: q.get('teren') ?? 'Rownina',
  attacker: parse(q.get('atk') ?? 'Konnica:8'), defender: parse(q.get('def') ?? 'Wojownik:14'),
};
const mode = q.get('mode') ?? 'skip';
const armies = buildTestArmies(units, 'maly');
const scene: any = new BattleScene({
  attacker: armies.attacker, defender: armies.defender, teren: armies.teren,
  data: { units, counters, terrainCombat, cywilizacje: [] },
  attackerCivLabel: 'Rzym', defenderCivLabel: 'Grecja',
} as any);
scene.renderer.setPixelRatio(Number(q.get('pr') ?? '0.1'));

// api.steps[id][round] = liczba krokow uciekiniera w tej turze; api.info[id] = nazwa + normalny zasieg ruchu
const api: any = { ready: true, done: false, result: null as any, injected: null as string | null, steps: {} as Record<string, Record<string, number>>, info: {} as Record<string, any> };
(window as any).__e2e = api;
(window as any).__scene = scene;

{
  // ru.id bywa nieustawione -- nadajemy trwaly numer per obiekt jednostki
  const tid = new WeakMap<object, number>();
  let nextTid = 1;
  const origMove = scene._doMove.bind(scene);
  scene._doMove = (ru: any, col: number, row: number, done: () => void) => {
    // klony planowania AUTO-batch nie maja wlasnych materialow (mats=[]) -- pomijamy je
    if (ru.routed && !ru.removed && ru.mats.length > 0) {
      if (!tid.has(ru)) tid.set(ru, nextTid++);
      const id = `${ru.side}#${tid.get(ru)}`;
      const per = (api.steps[id] ??= {});
      const rk = String(scene.roundNo);
      per[rk] = (per[rk] ?? 0) + 1;
      api.info[id] = { nazwa: ru.bu.nazwa, side: ru.side, normal: scene._movementPointsFor(ru.bu) };
    }
    return origMove(ru, col, row, done);
  };
}

// R-WEB-BATTLE-FLEE-SPEED-HARAPPA-FASTER-Q1 (zarzut Evaluatora 1): ?inject=midwave -- pierwsza jednostka
// wykonujaca zaplanowany ruch/atak (galaz normalPlan w _resolveAutoBatchMovement) zostaje oznaczona jako
// zlamana W TRAKCIE zamrozonej fali. Wtedy idzie galezia normalPlan (cap = _fleeMovePointsFor), a nie
// _fleeStep z juz ustawionym zapasem. Test musi byc czerwony po usunieciu capa z tej galezi.
if (q.get('inject') === 'midwave') {
  const origRAB = scene._resolveAutoBatchMovement.bind(scene);
  scene._resolveAutoBatchMovement = (ru: any, resolution: any, stepIdx: number, done: () => void, normalPlan = false) => {
    if (normalPlan && !api.injected && stepIdx === 0 && (resolution.kind === 'move' || resolution.kind === 'attack')
      && !ru.dead && !ru.fadingOut && !ru.removed && !ru.routed && ru.mats.length > 0) {
      ru.routed = true;
      api.injected = ru.bu.nazwa;
    }
    return origRAB(ru, resolution, stepIdx, done, normalPlan);
  };
}

function finish(): void {
  const rows = Object.keys(api.steps).map(id => {
    const per = Object.values(api.steps[id]) as number[];
    return { id, ...api.info[id], maxPerRound: Math.max(...per), totalSteps: per.reduce((a, b) => a + b, 0), rounds: per.length };
  });
  api.result = { round: scene.roundNo, winner: scene._endWinner, routed: rows, injected: api.injected ?? null };
  api.done = true;
}
function loop(): void {
  if (scene.finished) { finish(); return; }
  requestAnimationFrame(loop);
}
scene.play(() => {});
scene._setSpeedIdx(9, { clamp: true });
if (mode === 'instant') scene._skipInstantFallback();
else if (mode === 'watch') { if (scene.deployPhase) scene._endDeployPhase(); scene._ffEnterAuto(); }
else scene.skip();
requestAnimationFrame(loop);
