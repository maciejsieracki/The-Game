// R-WEB-BATTLE-LINE-ADVANCE-UNIFORM-Q1: zywa scena bitwy 3D (AUTO) -- rozrzut frontu piechoty w kolejnych rundach.
// Query: ?scene=before|after &teren=Las &atk=Wojownik:16,Lucznik:6 &def=Wojownik:16 &seed=N &rounds=10
import units from '../data/units.json';
import counters from '../data/counters.json';
import terrainCombat from '../data/terrain-combat.json';
import { buildTestArmies, PRESETS } from '../src/battle/testBattle.ts';

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
  label: 'line-advance', teren: q.get('teren') ?? 'Las',
  attacker: parse(q.get('atk') ?? 'Wojownik:16,Lucznik:6'), defender: parse(q.get('def') ?? 'Wojownik:16'),
};
// 'before' = kopia poprzedniej sceny (src/battle/battleScene.orig-before.ts, nie commitowana) -- sciezka dynamiczna,
// zeby brak pliku nie psul wariantu 'after'.
const sceneFile = q.get('scene') === 'before' ? 'battleScene.orig-before.ts' : 'battleScene.ts';
const mod: any = await import(/* @vite-ignore */ `../src/battle/${sceneFile}`);
const armies = buildTestArmies(units, 'maly');
const scene: any = new mod.BattleScene({
  attacker: armies.attacker, defender: armies.defender, teren: armies.teren,
  data: { units, counters, terrainCombat, cywilizacje: [] },
  attackerCivLabel: 'Rzym', defenderCivLabel: 'Grecja',
} as any);
scene.renderer.setPixelRatio(Number(q.get('pr') ?? '0.5'));

const maxRounds = Number(q.get('rounds') ?? '10');
const api: any = { ready: true, done: false, rows: [] as any[], shotRound: -1 };
(window as any).__e2e = api;
(window as any).__scene = scene;

function frontSpread(): any {
  // przod = piechota wrecz (bez strzelcow/konnicy/machin), strona atakujaca; rozrzut = max(q) - min(q)
  const f = scene.atk.filter((u: any) => !u.dead && !u.removed && !u.routed && !u.mounted && !u.rangedBase);
  const qs = f.map((u: any) => u.q);
  return { n: f.length, spread: Math.max(...qs) - Math.min(...qs), min: Math.min(...qs), max: Math.max(...qs), qs };
}
let lastRound = -1;
function loop(): void {
  if (scene.roundNo !== lastRound) {
    lastRound = scene.roundNo;
    api.rows.push({ round: scene.roundNo, ...frontSpread() });
  }
  if (scene.roundNo >= maxRounds || scene.finished) { api.done = true; return; }
  requestAnimationFrame(loop);
}
scene.play(() => {});
scene._setSpeedIdx(9, { clamp: true });
if (scene.deployPhase) scene._endDeployPhase();
scene._ffEnterAuto();
requestAnimationFrame(loop);
