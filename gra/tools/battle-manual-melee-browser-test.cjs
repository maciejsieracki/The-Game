'use strict';
/** Chromium run of production BattleScene, paired Atak/Szturm with fixed 28v28 roster and positions. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');

const root = path.resolve(__dirname, '..');
const evidenceDir = path.resolve(root, '..', 'dyspozycje/autobot/runs/R-BITWA-MANUAL-MELEE-ATTACK-STUCK-Q1/evidence-chromium');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  fs.mkdirSync(evidenceDir, { recursive: true });
  const server = await createServer({
    root,
    configFile: path.join(root, 'vite.config.ts'),
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, strictPort: false },
  });
  let browser;
  const errors = [];
  try {
    await server.listen();
    const address = server.httpServer.address();
    browser = await chromium.launch({
      headless: true, executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('requestfailed', r => errors.push(`requestfailed:${r.url()}:${r.failure()?.errorText}`));
    await page.goto(`http://127.0.0.1:${address.port}/tools/battle-manual-melee-browser-entry.html`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__meleeBrowserBattle?.ready === true, undefined, { timeout: 60000 });
    const before = await page.evaluate(() => {
      const { scene: s } = window.__meleeBrowserBattle;
      return { attacker: s.atk.length, defender: s.def.length,
        melee: [...s.atk, ...s.def].filter(u => !u.rangedBase && !u.mounted).length,
        ranged: [...s.atk, ...s.def].filter(u => u.rangedBase).length,
        mounted: [...s.atk, ...s.def].filter(u => u.mounted).length,
        canvas: { connected: s.canvas.isConnected, width: s.canvas.width, height: s.canvas.height } };
    });
    if (before.attacker !== 28 || before.defender !== 28 || before.melee < 10 || before.ranged < 1 || before.mounted < 1) {
      throw new Error(`Production browser roster mismatch: ${JSON.stringify(before)}`);
    }
    const paired = await page.evaluate(async () => {
      const s = window.__meleeBrowserBattle.scene;
      const all = [...s.atk, ...s.def];
      const start = new Map(all.map(u => [u.bu.id, { hp: u.bu.hp, ammo: u.ammoLeft, dead: u.dead,
        fading: u.fadingOut, removed: u.removed, routed: u.routed }]));
      const events = [];
      s._manualMode = false;
      s._manualCommanderGate = false;
      s.started = true;
      s.finished = false;
      // Keep this browser regression bounded while still exercising the real
      // BattleScene timer/animation callbacks at the game's maximum speed.
      s._setSpeedIdx(7, { clamp: true });
      s._groupMeta.clear(); s._groups.clear();
      for (const [side, us] of [['atk', s.atk], ['def', s.def]]) {
        const gid = `chromium-${side}`;
        s._groups.set(gid, new Set(us.map(u => u.bu.id)));
        s._groupMeta.set(gid, { doctrine: 'steady', autoPlay: true, formation: 'F1', attackDirection: 'front' });
        for (const u of us) { u.groupId = gid; u.playerOrder = { type: 'none' }; }
      }
      const attack0 = s._doAttack;
      s._doAttack = function (a, d, done) {
        const event = { type: 'attack-start', doctrine: this._effectiveMetaForUnit(a).doctrine,
          attackerId: a.bu.id, attackerName: a.bu.nazwa, targetId: d.bu.id,
          distance: Math.abs(a.q - d.q) + Math.abs(a.r - d.r),
          ranged: a.rangedBase && a.ammoLeft > 0, hpBefore: d.bu.hp, pos: [a.q, a.r] };
        events.push(event);
        return attack0.call(this, a, d, () => {
          events.push({ ...event, type: 'attack-complete', hpAfter: d.bu.hp });
          done();
        });
      };
      const move0 = s._doMove;
      s._doMove = function (u, q, r, done) {
        const event = { type: 'move-start', doctrine: this._effectiveMetaForUnit(u).doctrine,
          unitId: u.bu.id, name: u.bu.nazwa, from: [u.q, u.r], to: [q, r], mounted: u.mounted };
        events.push(event);
        return move0.call(this, u, q, r, () => { events.push({ ...event, type: 'move-complete', after: [u.q, u.r] }); done(); });
      };
      const path0 = s._firstStepAlongPathToAttack;
      s._firstStepAlongPathToAttack = function (u, canStep) {
        const result = path0.call(this, u, canStep);
        if (u.bu.id === meleeProbeBySide.atk.bu.id) events.push({ type: 'attack-path-result', unitId: u.bu.id,
          result, moveLeft: u.moveLeft, pos: [u.q, u.r] });
        return result;
      };
      const advance0 = s._advanceStep;
      s._advanceStep = function (u, done) {
        if (u.bu.id === meleeProbeBySide.atk.bu.id) events.push({ type: 'advance-entry', unitId: u.bu.id,
          moveLeft: u.moveLeft, pos: [u.q, u.r], nearest: this._nearestEnemy(u)?.bu.id });
        return advance0.call(this, u, done);
      };
      // Keep the 28v28 production roster and occupancy intact, but activate a
      // representative probe from each role only. Driving all 56 actors through
      // scene animations made headless Chromium spend minutes in one case.
      const probes = [];
      const meleeProbeBySide = {};
      for (const side of ['atk', 'def']) {
        const units = s[side];
        for (const role of ['melee', 'ranged', 'mounted']) {
          const unit = role === 'melee' ? units.find(u => !u.rangedBase && !u.mounted && !u.phalanx)
            : units.find(u => role === 'ranged' ? u.rangedBase : u.mounted);
          if (unit) { probes.push(unit); if (role === 'melee') meleeProbeBySide[side] = unit; }
        }
      }
      if (!meleeProbeBySide.atk || !meleeProbeBySide.def) throw new Error('Required representative infantry slots missing');
      // The browser entry replaces only the ten preset front-line slots per
      // side with the actual units.json Wojownik row, so runtime role flags
      // below are derived normally by BattleScene (no class override here).
      const firstInfantryId = meleeProbeBySide.atk.bu.id;
      const laneR = Array.from({ length: 72 }, (_, i) => i + 3)
        .find(r => [10, 11, 12, 13].every(q => s.terrainMap.passable(q, r)));
      if (laneR === undefined) throw new Error('No four-tile passable production lane for melee probe');
      const lineGate0 = s._compactAttackAllowsStep;
      s._compactAttackAllowsStep = function (u, col) {
        const allowed = lineGate0.call(this, u, col);
        if (u.bu.id === firstInfantryId) events.push({ type: 'line-candidate', unitId: u.bu.id,
          from: [u.q, u.r], candidateCol: col, allowed, rank: u.formationRank });
        return allowed;
      };
      const run = async doctrine => {
        s._manualMode = false; s.finished = false; s.roundNo = 0; s.engaged = new Set();
        s._groupMeta.get('chromium-atk').doctrine = doctrine;
        s._groupMeta.get('chromium-def').doctrine = doctrine;
        s.occByKey.clear();
        for (const [side, us] of [['atk', s.atk], ['def', s.def]]) us.forEach((u, i) => {
          const initial = start.get(u.bu.id);
          u.bu.hp = initial.hp; u.ammoLeft = initial.ammo;
          u.dead = initial.dead; u.fadingOut = initial.fading; u.removed = initial.removed; u.routed = initial.routed;
          u.q = side === 'atk' ? 10 : 13;
          u.r = u === meleeProbeBySide[side] ? laneR : 20 + i;
          u.acted = false;
          u.moveLeft = s._movementPointsFor(u.bu);
          u.group.position.set(u.q, 0, u.r); u.hpBarGroup.position.set(u.q, 2.5, u.r);
          s.occByKey.set(`${u.q},${u.r}`, u);
        });
        for (let turn = 1; turn <= 2; turn++) {
          s.roundNo = turn;
          for (const u of probes) {
            u.moveLeft = s._movementPointsFor(u.bu);
            const target = s._nearestEnemy(u);
            events.push({ type: 'activation-start', doctrine, turn, unitId: u.bu.id,
              name: u.bu.nazwa, position: [u.q, u.r], targetId: target?.bu.id ?? null,
              distance: target ? Math.abs(u.q - target.q) + Math.abs(u.r - target.r) : null,
              legalAttackAtStart: s._canAttackFrom(u, u.q, u.r) });
            await new Promise(resolve => s._activateUnit(u, resolve));
            events.push({ type: 'activation-end', doctrine, turn, unitId: u.bu.id, position: [u.q, u.r] });
          }
        }
        return { doctrine, units: all.map(u => ({ id: u.bu.id, name: u.bu.nazwa, side: u.side,
          melee: !u.rangedBase && !u.mounted, ranged: u.rangedBase, mounted: u.mounted,
          q: u.q, r: u.r, hp: u.bu.hp })) };
      };
      const nativeRandom = Math.random;
      try {
        Math.random = () => { // reset to the same combat seed for each doctrine
          run.rng = ((run.rng ?? 20261029) * 1664525 + 1013904223) >>> 0;
          return run.rng / 0x100000000;
        };
        const attack = await run('steady'); run.rng = 20261029;
        const charge = await run('aggressive');
        return { attack, charge, events, laneR };
      } finally { Math.random = nativeRandom; }
    });
    const attackHits = paired.events.filter(e => e.type === 'attack-complete' && e.doctrine === 'steady');
    const chargeHits = paired.events.filter(e => e.type === 'attack-complete' && e.doctrine === 'aggressive');
    const isMelee = e => !e.ranged && (paired.attack.units.find(u => u.id === e.attackerId)?.melee === true);
    const attackInfantry = attackHits.filter(isMelee);
    const chargeInfantry = chargeHits.filter(isMelee);
    const attackHp = attackInfantry.filter(e => e.hpAfter < e.hpBefore);
    const chargeHp = chargeInfantry.filter(e => e.hpAfter < e.hpBefore);
    const firstId = paired.attack.units.find(u => u.side === 'atk' && u.melee)?.id;
    const trace = paired.events.filter(e => e.unitId === firstId || e.attackerId === firstId);
    const report = { before, probeFixture: { warriorDataRow: 'Wojownik (Kamień)', sceneRoleFlagsOverridden: false,
        movementLane: paired.laneR }, roster: { attacker: 28, defender: 28, sameUnitIds: true, samePositionsAtReset: true },
      metrics: { attackInfantryStrikes: attackInfantry.length, attackInfantryHpLossEvents: attackHp.length,
        chargeInfantryStrikes: chargeInfantry.length, chargeInfantryHpLossEvents: chargeHp.length,
        attackArcherShots: attackHits.filter(e => e.ranged && /archer|uczn|spear/i.test(e.attackerName)).length,
        chargeArcherShots: chargeHits.filter(e => e.ranged && /archer|uczn|spear/i.test(e.attackerName)).length,
        attackInfantryMoves: paired.events.filter(e => e.doctrine === 'steady' && e.type === 'move-complete'
          && e.unitId === firstId).length,
        attackMountedActions: paired.events.filter(e => e.doctrine === 'steady' && e.type.startsWith('move-') && e.mounted).length,
        firstInfantryId: firstId, trace, browserErrors: errors }, attack: paired.attack, charge: paired.charge,
      events: paired.events };
    fs.writeFileSync(path.join(evidenceDir, 'paired-attack-charge-trace.json'), JSON.stringify(report, null, 2) + '\n');
    const screenshotNote = await page.screenshot({ path: path.join(evidenceDir, 'battle-scene-after.png'), timeout: 15000 })
      .then(() => null, e => `screenshot skipped: ${e.message}`);
    report.metrics.screenshotNote = screenshotNote;
    report.metrics.browserErrors = errors;
    fs.writeFileSync(path.join(evidenceDir, 'paired-attack-charge-trace.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ before, metrics: report.metrics, errors }, null, 2));
    if (errors.length) throw new Error(`Chromium errors: ${JSON.stringify(errors)}`);
    if (!attackHp.length || !chargeHp.length) throw new Error(`Expected real production infantry HP loss in both doctrines: ${JSON.stringify(report.metrics)}`);
    if (!report.metrics.attackInfantryMoves || paired.laneR === undefined) {
      throw new Error(`Expected real production Atak infantry to move along the clear lane before engagement: ${JSON.stringify(report.metrics)}`);
    }
    if (!report.metrics.attackArcherShots || !report.metrics.chargeArcherShots) {
      throw new Error(`Expected archer safety-check shots in both doctrines: ${JSON.stringify(report.metrics)}`);
    }
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
