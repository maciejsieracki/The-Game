// Operator measurement script (scratch, not in repo). usage: node epoch-measure.cjs <seed> <turns> <flagOn:0|1> <outJson>  (env AI, CS)
const fs = require('fs');
const H = '/home/user/The-Game/.claude/worktrees/wf_c1691e47-cac-2/gra/tools/lib/game-sim-harness.cjs';
const { withSimBundle, launchBrowser, openSimPage, waitForHook, startSimGame } = require(H);
const [seedS, turnsS, flagS, outFile] = process.argv.slice(2);
const seed = Number(seedS), turns = Number(turnsS), flagOn = flagS === '1';
const ai = Number(process.env.AI || 5), cs = Number(process.env.CS || 2);
(async () => {
  const out = { seed, turns, flagOn, ai, cs, perTurn: [], errors: [] };
  await withSimBundle(async ({ bundleDir }) => {
    const browser = await launchBrowser();
    try {
      const { page, context, pageErrors } = await openSimPage(browser, { bundleDir, testhook: true });
      try {
        await waitForHook(page);
        await page.evaluate(([n, v]) => window.__test.setFlag(n, v), ['warEpochPlayerFirst', flagOn]);
        out.startMs = await startSimGame(page, { seed, aiCount: ai, cityStates: cs, difficulty: 'normal', era: 'kamien', playerPassive: true });
        for (let t = 0; t < turns; t++) {
          const m = await page.evaluate(() => window.__test.runTurns(1, { autoResolveBattles: true, playerPolicy: 'pass' }));
          const s = await page.evaluate(() => window.__test.snapshot());
          const last = m[m.length - 1] || {};
          out.perTurn.push({ turn: s.turn, wars: s.wars, warCount: s.warCount, ms: last.ms, hash: last.hash });
          if (String(last.hash || '').startsWith('TIMEOUT')) { out.errors.push('timeout@' + s.turn); break; }
        }
        out.pageErrors = pageErrors.slice(0, 5);
      } finally { await context.close(); }
    } finally { await browser.close(); }
  });
  fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
  console.log('written', outFile, 'turns', out.perTurn.length, 'errors', JSON.stringify(out.errors));
})().catch(e => { console.error('FAIL', e && e.stack || e); process.exit(1); });
