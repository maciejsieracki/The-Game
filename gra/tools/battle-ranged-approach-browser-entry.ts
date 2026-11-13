import { BattleScene } from '../src/battle/battleScene';
import units from '../data/units.json';
import counters from '../data/counters.json';
import terrainCombat from '../data/terrain-combat.json';

const find = (name: string) => units.find((row: any) => row['Jednostka'] === name);
const types = {
  atk: [
    ['Wojownik', 'miecznik', 12], ['Oszczepnik', 'oszczepnik', 8],
    ['Łucznik', 'lucznik', 8], ['Procarz', 'procarz', 4],
    ['Konnica', 'konnica', 6], ['Rydwan konny', 'rydwan', 4],
  ] as const,
  def: [
    ['Falanga', 'falanga', 12], ['Oszczepnik', 'oszczepnik', 8],
    ['Łucznik', 'lucznik', 8], ['Procarz', 'procarz', 4],
    ['Konnica', 'konnica', 6], ['Rydwan konny', 'rydwan', 4],
  ] as const,
};

function roster(side: 'atk' | 'def') {
  let n = 0;
  return types[side].flatMap(([unitName, category, count]) => {
    const row = find(unitName);
    if (!row) throw new Error(`Missing production unit row ${unitName}`);
    const hp = Math.max(1, Math.round(Number(row.health ?? row.Health ?? 10)));
    return Array.from({ length: count }, () => ({
      id: `${side}-mixed-${n++}`,
      nazwa: String(row['Nazwa EN'] ?? row['Jednostka']),
      kategoria: category,
      ownerColor: side === 'atk' ? 0xffd54a : 0x4060c8,
      stats: row,
      hp,
      maxHp: hp,
    }));
  });
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runScenario(doctrine: 'steady' | 'defensive' | 'aggressive', archerLines: 1 | 2, terrain: string,
  focusedRanged: false | 'in-range' | 'approach' = false) {
  const scene = new BattleScene({
    attacker: roster('atk'), defender: roster('def'), teren: terrain, deploy: true,
    data: { units, counters, terrainCombat, cywilizacje: [] },
    attackerCivLabel: 'Rzym', defenderCivLabel: 'Grecja',
  });
  scene.renderer.setPixelRatio(0.12);
  scene._setSpeedIdx(7, { clamp: true });
  // Rebuild through the production deploy reset so the requested 1/2 archer
  // depth setting goes through BattleScene's own formation planner.
  scene._deployArcherLines = archerLines;
  scene._resetDeploySide('atk');
  scene._resetDeploySide('def');

  // Keep the full production-deployed formations and translate each side
  // intact into the controlled central engagement lane. This fixture setup
  // changes only initial positions; occupancy, movement, targeting, attacks,
  // projectiles, morale and damage stay on the unmodified production paths.
  const minAtkQ = Math.min(...scene.atk.map((u: any) => u.q));
  const maxDefQ = Math.max(...scene.def.map((u: any) => u.q));
  scene.occByKey.clear();
  for (const u of scene.atk) scene._moveDeployUnit(u, u.q + (18 - minAtkQ), u.r);
  for (const u of scene.def) scene._moveDeployUnit(u, u.q - (maxDefQ - 31), u.r);

  // Enter the real battle startup path in planning mode, then run the selected
  // doctrine's production activation method directly to bound the browser
  // experiment to the same representative cohort in all variants.
  scene.play(() => {});
  scene._endDeployPhase();
  // Keep the production 42v42 roster, but give the focused shooter a clear lane
  // behind its own line and enough range gap to require multiple activations.
  // Shift the defender line intact; clear only same-row friendly blockers by one
  // row so the test measures approach behavior, not a deliberately sealed lane.
  if (focusedRanged === 'approach') {
    for (const enemy of [...scene.def].sort((a: any, b: any) => b.q - a.q)) {
      scene._moveDeployUnit(enemy, enemy.q + 3, enemy.r);
    }
    for (const ally of scene.atk) {
      if (ally.r !== 75 || ally.q <= 21 || ally.q >= 34) continue;
      for (const dr of [-1, 1, -2, 2]) {
        const nr = ally.r + dr;
        if (nr < 23 || nr > 132 || scene.occByKey.has(`${ally.q},${nr}`)
          || !scene._passableForUnit(ally, ally.q, nr)) continue;
        scene._moveDeployUnit(ally, ally.q, nr);
        break;
      }
    }
  }
  scene._manualMode = false;
  scene._battleAwaitingOrders = false;
  scene.roundNo = 1;
  scene.finished = false;
  for (const u of [...scene.atk, ...scene.def]) {
    u.unitDoctrine = doctrine;
    u.playerOrder = { type: 'none' };
    u.bu.hp = Math.max(u.bu.hp, 1000);
    u.bu.maxHp = Math.max(u.bu.maxHp, 1000);
    u.morale = 1000; u.moraleMax = 1000;
    u.dead = false; u.fadingOut = false; u.removed = false; u.routed = false;
    u.acted = false;
  }
  const baseline = [...scene.atk, ...scene.def].map((u: any) => ({
    id: u.bu.id, side: u.side, name: u.bu.stats?.['Jednostka'], category: u.bu.kategoria,
    q: u.q, r: u.r, ammo: u.ammoLeft, range: u.range, ranged: u.rangedBase, mounted: u.mounted,
  }));
  const occupancyValid = new Set([...scene.atk, ...scene.def].map((u: any) => `${u.q},${u.r}`)).size === 84;
  const roles = [
    ['infantry', (u: any) => !u.rangedBase && !u.mounted],
    ['javelin', (u: any) => String(u.bu.kategoria) === 'oszczepnik'],
    ['archer', (u: any) => String(u.bu.kategoria) === 'lucznik'],
    ['slinger', (u: any) => String(u.bu.kategoria) === 'procarz'],
    ['cavalry', (u: any) => String(u.bu.kategoria) === 'konnica'],
    ['chariot', (u: any) => String(u.bu.kategoria) === 'rydwan'],
  ] as const;
  const probes = (['atk', 'def'] as const).flatMap(side => roles.map(([role, pred]) => {
    const u = scene[side].find(pred);
    if (!u) throw new Error(`Missing production probe ${side}/${role}`);
    return { side, role, unit: u };
  })).filter(probe => focusedRanged === false || (probe.side === 'atk' && probe.role === 'archer'));
  if (focusedRanged === 'approach') {
    const rangedProbes = scene.atk.filter((unit: any) => String(unit.bu.kategoria) === 'lucznik');
    const requestedLane = rangedProbes.find((unit: any) => unit.q === 21 && unit.r === 75);
    if (requestedLane) probes[0].unit = requestedLane;
  }
  const shooter = focusedRanged ? probes[0]?.unit : null;
  let forcedShotSetup: any = null;
  if (shooter && focusedRanged === 'in-range') {
    const candidates: Array<{ q: number; r: number; dist: number }> = [];
    for (let q = 2; q < 74; q++) for (let r = 2; r < 86; r++) {
      if (scene.occByKey.has(`${q},${r}`) || !scene.terrainMap.passable(q, r)) continue;
      if (!scene._canAttackFrom(shooter, q, r)) continue;
      candidates.push({ q, r, dist: Math.abs(q - shooter.q) + Math.abs(r - shooter.r) });
    }
    candidates.sort((a, b) => a.dist - b.dist);
    const spot = candidates[0];
    if (!spot) throw new Error('No production passable tile exists inside real ranged attack reach');
    const from = [shooter.q, shooter.r];
    scene._moveDeployUnit(shooter, spot.q, spot.r);
    forcedShotSetup = { from, to: [spot.q, spot.r], nearestEnemy: scene._nearestEnemy(shooter)?.bu.id,
      legalAttack: scene._canAttackFrom(shooter, spot.q, spot.r),
      fixtureNote: 'Only the shooter starting tile is positioned in-range; the production attack, projectile, ammo, damage, and callbacks are unmodified.' };
  }
  const events: any[] = [];
  const move0 = scene._doMove.bind(scene);
  scene._doMove = (u: any, q: number, r: number, done: () => void) => {
    const before = [u.q, u.r];
    move0(u, q, r, () => { events.push({ type: 'move', doctrine, id: u.bu.id, role: u.bu.kategoria, from: before, to: [u.q, u.r], mounted: u.mounted }); done(); });
  };
  const attack0 = scene._doAttack.bind(scene);
  scene._doAttack = (a: any, d: any, done: () => void) => {
    const event = { type: 'attack', doctrine, id: a.bu.id, role: a.bu.kategoria,
      targetId: d.bu.id, distance: Math.abs(a.q - d.q) + Math.abs(a.r - d.r),
      range: a.range,
      ranged: a.rangedBase && a.ammoLeft > 0, ammoBefore: a.ammoLeft, hpBefore: d.bu.hp };
    attack0(a, d, () => { events.push({ ...event, ammoAfter: a.ammoLeft, hpAfter: d.bu.hp }); done(); });
  };
  const path0 = scene._firstStepAlongPathToAttack.bind(scene);
  scene._firstStepAlongPathToAttack = (u: any, canStep: (q: number, r: number) => boolean) => {
    const result = path0(u, canStep);
    if (focusedRanged === 'approach' && u === shooter) {
      const target = scene._nearestEnemy(u);
      events.push({ type: 'attack-path', from: [u.q, u.r], result,
        target: target?.bu.id ?? null,
        distance: target ? Math.abs(u.q - target.q) + Math.abs(u.r - target.r) : null,
        range: u.range, moveLeft: u.moveLeft,
        candidatePassable: result ? scene.terrainMap.passable(...result.split(',').map(Number) as [number, number]) : null });
    }
    return result;
  };
  const activationTrace: any[] = [];
  for (const { side, role, unit } of probes) {
    if (unit.dead || unit.removed || unit.fadingOut || unit.routed) continue;
    const ammoAtStart = unit.ammoLeft;
    const maxActivations = focusedRanged === 'approach' ? 6 : 1;
    for (let activation = 1; activation <= maxActivations; activation++) {
      // Advance a real front-rank warrior before each focused archer turn. In
      // normal play every army unit activates; leaving the entire melee line
      // frozen would turn this into a sealed-corridor test rather than a ranged
      // approach test. Keep the shooter itself under the same real production
      // activation path as the surrounding large-army probe.
      if (focusedRanged === 'approach') {
        const blocker = scene.atk.find((candidate: any) => candidate.bu.id === 'atk-mixed-1');
        if (blocker && !blocker.dead && !blocker.routed) {
          blocker.moveLeft = scene._movementPointsFor(blocker.bu);
          blocker.acted = false;
          await new Promise<void>((resolve, reject) => {
            const timer = window.setTimeout(() => reject(new Error(`front-line activation timeout ${activation}`)), 12000);
            scene._activateUnit(blocker, () => { window.clearTimeout(timer); resolve(); });
          });
        }
      }
      unit.moveLeft = scene._movementPointsFor(unit.bu);
      unit.acted = false;
      unit.playerOrder = { type: 'none' };
      scene.roundNo = activation;
      const target = scene._nearestEnemy(unit);
      activationTrace.push({ start: true, activation, side, role, id: unit.bu.id,
        at: [unit.q, unit.r], target: target?.bu.id ?? null,
        distance: target ? Math.abs(unit.q - target.q) + Math.abs(unit.r - target.r) : null,
        range: unit.range, ammo: unit.ammoLeft, canAttack: scene._canAttackFrom(unit, unit.q, unit.r),
      });
      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error(`activation timeout ${side}/${role}/${doctrine}/${activation}`)), 12000);
        scene._activateUnit(unit, () => { window.clearTimeout(timer); resolve(); });
      });
      const nextTarget = scene._nearestEnemy(unit);
      activationTrace.push({ end: true, activation, side, role, id: unit.bu.id,
        at: [unit.q, unit.r], distance: nextTarget ? Math.abs(unit.q - nextTarget.q) + Math.abs(unit.r - nextTarget.r) : null,
        range: unit.range, ammo: unit.ammoLeft });
      await wait(15);
      if (unit.ammoLeft < ammoAtStart) break;
    }
  }
  const battleMidRow = 77; // BF_ROWS=156; playable rows 23..132; production PLAY_MID_ROW=77.
  const mountedDistances = baseline.filter(u => u.mounted).map(u => {
    const core = baseline.filter(other => other.side === u.side && !other.mounted);
    const nearestCore = Math.min(...core.map(other => Math.abs(other.q - u.q) + Math.abs(other.r - u.r)));
    return { side: u.side, wing: u.r < battleMidRow ? 'upper' : 'lower', name: u.name,
      row: u.r, distanceFromMidRow: Math.abs(u.r - battleMidRow), nearestCoreDistance: nearestCore };
  });
  const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const mountedWingSummary = Object.fromEntries(['atk', 'def'].flatMap(side => ['upper', 'lower'].map(wing => {
    const rows = mountedDistances.filter(x => x.side === side && x.wing === wing);
    return [`${side}-${wing}`, { units: rows.length,
      meanDistanceFromMidRow: mean(rows.map(x => x.distanceFromMidRow)),
      maxDistanceFromMidRow: Math.max(0, ...rows.map(x => x.distanceFromMidRow)),
      meanNearestCoreDistance: mean(rows.map(x => x.nearestCoreDistance)),
      maxNearestCoreDistance: Math.max(0, ...rows.map(x => x.nearestCoreDistance)) }];
  })));
  const result = {
    doctrine, archerLines, terrain, roster: { atk: scene.atk.length, def: scene.def.length,
      roleCounts: types, occupancyValid },
    focusedRanged: focusedRanged || null, forcedShotSetup,
    formation: { battlefield: { playableRows: [23, 132], midRow: battleMidRow },
      mountedWingSummary, mountedDistances,
      archerPositions: baseline.filter(u => u.category === 'lucznik').map(u => ({ side: u.side, id: u.id, q: u.q, r: u.r })),
      archerDepthColumns: [...new Set(baseline.filter(u => u.category === 'lucznik').map(u => u.q))].sort((a, b) => a - b),
      mountedPositions: baseline.filter(u => u.mounted).map(u => [u.side, u.q, u.r]) },
    actions: {
      movement: events.filter(e => e.type === 'move').length,
      meleeAttacks: events.filter(e => e.type === 'attack' && !e.ranged).length,
      rangedAttacks: events.filter(e => e.type === 'attack' && e.ranged).length,
      rangedAmmoSpent: events.filter(e => e.type === 'attack' && e.ranged && Number.isFinite(e.ammoBefore) && e.ammoAfter < e.ammoBefore).length,
      hpLossEvents: events.filter(e => e.type === 'attack' && e.hpAfter < e.hpBefore).length,
      mountedActions: events.filter(e => (e.type === 'move' || e.type === 'attack') && ['konnica', 'rydwan'].includes(e.role)).length,
      rangedByRole: Object.fromEntries(['oszczepnik', 'lucznik', 'procarz'].map(role => [role, events.filter(e => e.type === 'attack' && e.role === role && e.ranged).length])),
    },
    activationTrace, events,
    errors: [],
  };
  scene.dispose();
  return result;
}

window.__runLargeMixedScenario = runScenario;
window.__largeMixedReady = true;
