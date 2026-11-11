// R-WEB-BATTLE-ROUTED-UNITS-PURSUED-AND-DESTROYED-Q1: prawdziwa bitwa 3D (AUTO przewijana / auto-rozstrzygniecie)
// w Chromium; zbiera los kazdej jednostki (zabita / uciekla / ocalala) i liczbe atakow na routed.
// Query: ?atk=Hastati:10,Lucznik:5 &def=Hastati:10 &seed=N &mode=skip|instant &atkhp=1 &defhp=1
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
  label: 'rout-pursuit', teren: q.get('teren') ?? 'Rownina',
  attacker: parse(q.get('atk') ?? 'Hastati:10'), defender: parse(q.get('def') ?? 'Hastati:10'),
};
const mode = q.get('mode') ?? 'skip';
const armies = buildTestArmies(units, 'maly');
for (const [side, mul] of [[armies.attacker, Number(q.get('atkhp') ?? '1')], [armies.defender, Number(q.get('defhp') ?? '1')]] as const) {
  for (const bu of side as any[]) { bu.hp = Math.max(1, Math.round(bu.maxHp * mul)); }
}
const scene: any = new BattleScene({
  attacker: armies.attacker, defender: armies.defender, teren: armies.teren,
  data: { units, counters, terrainCombat, cywilizacje: [] },
  attackerCivLabel: 'Rzym', defenderCivLabel: 'Grecja',
} as any);
scene.renderer.setPixelRatio(Number(q.get('pr') ?? '0.1'));

const api: any = { ready: true, done: false, result: null as any, attacksOnRouted: 0 };
(window as any).__e2e = api;
(window as any).__scene = scene;

for (const fn of ['_doMeleeAttack', '_doRangedAttack']) {
  const orig = scene[fn].bind(scene);
  scene[fn] = (attacker: any, defender: any, done: any) => {
    if (defender.routed) api.attacksOnRouted++;
    return orig(attacker, defender, done);
  };
}

api.killedWhileRouted = 0; api.collapseRound = -1; api.fledAtEdge = 0; api.fledNotAtEdge = 0;
{
  const origFade = scene._startFade.bind(scene);
  scene._startFade = (ru: any) => { if (ru.routed && !ru.removed) api.killedWhileRouted++; return origFade(ru); };
  const origRout = scene._startRout.bind(scene);
  scene._startRout = (ru: any) => {
    const r = origRout(ru);
    const roster = ru.side === 'atk' ? scene.atk : scene.def;
    if (api.collapseRound < 0 && roster.every((u: any) => u.dead || u.removed || u.routed)) api.collapseRound = scene.roundNo;
    return r;
  };
  const origRemove = scene._removeUnitFromScene.bind(scene);
  scene._removeUnitFromScene = (ru: any) => {
    // klony planowania AUTO-batch nie maja wlasnych materialow (mats=[]) -- pomijamy je
    if (!ru.removed && ru.routed && ru.bu.hp > 0 && ru.mats.length > 0) {
      const edge = scene._fleeHomeCol(ru);
      if (ru.q === edge) api.fledAtEdge++; else { api.fledNotAtEdge++; (api.notEdge ||= []).push([ru.side, ru.q, ru.r, ru.fleeStuck]); }
    }
    return origRemove(ru);
  };
}

function fate(ru: any): string {
  if (ru.bu.hp <= 0) return 'killed';
  if (ru.routed && ru.removed) return 'fled';
  if (ru.routed) return 'routedLeft';
  return 'survived';
}
function tally(roster: any[]) {
  const t: any = { total: roster.length, killed: 0, fled: 0, routedLeft: 0, survived: 0 };
  for (const ru of roster) t[fate(ru)]++;
  return t;
}
function finish(): void {
  api.result = {
    winner: scene._endWinner, round: scene.roundNo,
    atk: tally(scene.atk), def: tally(scene.def),
    exported: (scene._endSurvivors ?? []).length,
    exportedAtk: (scene._endSurvivors ?? []).filter((s: any) => String(s.id).startsWith('atk')).length,
    exportedDef: (scene._endSurvivors ?? []).filter((s: any) => String(s.id).startsWith('def')).length,
    attacksOnRouted: api.attacksOnRouted, killedWhileRouted: api.killedWhileRouted, collapseRound: api.collapseRound,
    fledAtEdge: api.fledAtEdge, fledNotAtEdge: api.fledNotAtEdge, notEdge: (api.notEdge ?? []).slice(0, 8),
    log: (scene.log as string[]).filter(l => /Koniec|zalamane|PAT/.test(l)).slice(-4),
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
else if (mode === 'watch') { if (scene.deployPhase) scene._endDeployPhase(); scene._ffEnterAuto(); }
else scene.skip();
requestAnimationFrame(loop);
