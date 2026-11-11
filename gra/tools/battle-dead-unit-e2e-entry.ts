// R-BITWA-DEAD-UNIT-DISAPPEARS-Q2 (runda 2): end-to-end AUTO / Skip battle with a per-frame
// scene-graph "ghost" invariant. Query: ?mode=auto|skip|manualskip|midskip &siege=1
import { BattleScene } from '../src/battle/battleScene.ts';
import { buildTestArmies } from '../src/battle/testBattle.ts';
import units from '../data/units.json';
import counters from '../data/counters.json';
import terrainCombat from '../data/terrain-combat.json';

const q = new URLSearchParams(location.search);
const siege = q.has('siege');
const mode = q.get('mode') ?? 'auto';
const armies = buildTestArmies(units, siege ? 'oblezenie_duze' : 'bitwa_duza_pole');
if (q.has('weak')) {
  // Fragile armies: most blows are lethal, so AUTO/Skip produce MANY kills (bounded run time).
  for (const side of [armies.attacker, armies.defender]) {
    for (const bu of side as any[]) { bu.hp = Math.max(1, Math.round(bu.maxHp * 0.12)); }
  }
}
const scene: any = new BattleScene({
  attacker: armies.attacker, defender: armies.defender, teren: armies.teren,
  data: { units, counters, terrainCombat, cywilizacje: [] },
  attackerCivLabel: 'Rzym', defenderCivLabel: 'Grecja',
  ...(siege ? { siege: { defCiv: 'grecy' as const, builtBuildingIds: ['mury'] } } : {}),
} as any);
scene.renderer.setPixelRatio(0.1);

const violations: string[] = [];
const stats = { frames: 0, maxDeadSeen: 0, orphanMax: 0, checks: 0, hp0Alive: 0, deadVisible: 0, deadAttached: 0 };
const seenKill = new Set<string>();

function check(tag: string): void {
  stats.checks++;
  const all = [...scene.atk, ...scene.def];
  const live = new Set<unknown>();
  let dead = 0;
  for (const u of all) {
    const gone = u.dead || u.removed || u.bu.hp <= 0;
    if (!gone || (u.routed && !u.removed && u.bu.hp > 0)) { live.add(u.group); continue; }
    dead++;
    if (u.bu.hp <= 0 && !u.removed) { stats.hp0Alive++; violations.push(`${tag}: hp<=0 not removed ${u.bu.id} dead=${u.dead} fading=${u.fadingOut} routed=${u.routed}`); }
    if (u.group.parent !== null || u.hpBarGroup.parent !== null) { stats.deadAttached++; violations.push(`${tag}: dead still attached ${u.bu.id} removed=${u.removed}`); }
    if (u.group.visible || u.hpBarGroup.visible) { stats.deadVisible++; violations.push(`${tag}: dead still visible ${u.bu.id}`); }
    if (scene.occByKey.get(`${u.q},${u.r}`) === u) violations.push(`${tag}: dead holds tile ${u.bu.id}`);
    seenKill.add(u.bu.id);
  }
  stats.maxDeadSeen = Math.max(stats.maxDeadSeen, dead);
  // Orphan scan: any unit-model group in the scene graph that belongs to no live unit.
  let orphans = 0;
  for (const c of scene.scene.children as any[]) {
    const isModel = c.userData && c.userData['mats'] !== undefined;
    if (isModel && !live.has(c)) { orphans++; violations.push(`${tag}: orphan model group in scene (${c.name || c.uuid})`); }
  }
  stats.orphanMax = Math.max(stats.orphanMax, orphans);
}

const api: any = { scene, logTail: () => scene.log.slice(-6), endWinner: () => scene._endWinner, violations, stats, mode, siege, done: false, ready: true, check, seenKill };
(window as any).__e2e = api;

function loop(): void {
  stats.frames++;
  if (violations.length < 50) check('frame' + stats.frames);
  if (scene.finished) { if (violations.length < 50) check('final'); api.done = true; return; }
  requestAnimationFrame(loop);
}

if (q.has('mutate')) {
  // Mutation proof: scene removal becomes a no-op, the invariant MUST turn red.
  scene._removeUnitFromScene = function (ru: any) { ru.removed = true; ru.dead = true; };
}
scene.play(() => {});
scene._setSpeedIdx(9, { clamp: true });
if (mode === 'auto') {
  if (scene._manualMode) scene._toggleManualMode();
} else if (mode === 'skip') {
  scene.skip();
} else if (mode === 'manualskip') {
  setTimeout(() => scene.skip(), 1500);
} else if (mode === 'midskip') {
  if (scene._manualMode) scene._toggleManualMode();
  setTimeout(() => scene.skip(), 4000);
}
requestAnimationFrame(loop);
