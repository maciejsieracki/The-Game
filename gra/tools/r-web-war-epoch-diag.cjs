'use strict';
/**
 * r-web-war-epoch-diag.cjs -- R-WEB-WAR-EPOCH-NOSHOW-DIAG-Q1 (pomiar per tura).
 *
 * Uruchamia prawdziwą grę (headless Chromium, hak ?testhook=1) i zapisuje per turę:
 * pary w stanie „wojna”, relacje gracza (id 0), liczbę umów/ofert, zaufanie.
 *
 * Użycie (z katalogu gra/):
 *   node tools/r-web-war-epoch-diag.cjs --seed 101 --turns 70 --ai 5 [--cs 2]
 *       [--flag warRulesMultiwar=false] [--out <plik.json>]
 *
 * Kod wyjścia: 0 gdy przebieg dokończony, 1 w przeciwnym razie.
 */

const fs = require('fs');
const { withSimBundle, launchBrowser, openSimPage, waitForHook, startSimGame } = require('./lib/game-sim-harness.cjs');

function parseArgs(argv) {
  const a = { seed: 101, turns: 70, ai: 5, cs: 2, flags: {}, out: null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = () => argv[++i];
    if (k === '--seed') a.seed = Number(v());
    else if (k === '--turns') a.turns = Number(v());
    else if (k === '--ai') a.ai = Number(v());
    else if (k === '--cs') a.cs = Number(v());
    else if (k === '--out') a.out = v();
    else if (k === '--flag') {
      const [name, raw] = String(v()).split('=');
      a.flags[name] = raw === 'null' ? null : raw === 'true' ? true : raw === 'false' ? false : raw;
    } else throw new Error('r-web-war-epoch-diag: nieznana opcja ' + k);
  }
  return a;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rows = [];
  let failed = false;
  await withSimBundle(async ({ bundleDir }) => {
    const browser = await launchBrowser();
    try {
      const { page, context, pageErrors } = await openSimPage(browser, { bundleDir, testhook: true });
      const diag = globalThis.__diagLines = [];
      page.on('console', msg => {
        const t = msg.text();
        if (t.startsWith('[DIAG-WAR] ')) diag.push(t.slice('[DIAG-WAR] '.length));
      });
      try {
        await waitForHook(page);
        for (const [name, value] of Object.entries(args.flags)) {
          await page.evaluate(([n, v]) => window.__test.setFlag(n, v), [name, value]);
        }
        const startMs = await startSimGame(page, {
          seed: args.seed, aiCount: args.ai, cityStates: args.cs, difficulty: 'normal', era: 'kamien', playerPassive: true,
        });
        const s0 = await page.evaluate(() => window.__test.snapshot());
        rows.push({ turn: s0.turn, startMs, wars: s0.wars, warCount: s0.warCount, deals: s0.deals, offers: s0.offers.length, trustPlayer: pickPlayer(s0.trust), offerIds: [] });
        for (let t = 0; t < args.turns; t++) {
          const m = await page.evaluate(() => window.__test.runTurns(1, { autoResolveBattles: true, playerPolicy: 'pass' }));
          const s = await page.evaluate(() => window.__test.snapshot());
          const last = m[m.length - 1];
          rows.push({
            turn: s.turn, ms: last ? last.ms : null, wars: s.wars, warCount: s.warCount, deals: s.deals,
            offers: s.offers.map(o => ({ id: o.id, ownerId: o.ownerId, cmdType: o.cmdType, reason: o.reason, goldOnce: o.goldOnce })),
            trustPlayer: pickPlayer(s.trust), hash: s.hash,
          });
          if (!last || String(last.hash).startsWith('TIMEOUT')) { failed = true; break; }
        }
      } finally {
        if (pageErrors.length) { failed = true; rows.push({ pageErrors: pageErrors.slice(0, 5) }); }
        await context.close();
      }
    } finally {
      await browser.close();
    }
  });
  const out = { seed: args.seed, ai: args.ai, cs: args.cs, flags: args.flags, rows, diag: globalThis.__diagLines || [] };
  const text = JSON.stringify(out, null, 1);
  if (args.out) fs.writeFileSync(args.out, text);
  else console.log(text);
  console.log('DONE seed=' + args.seed + ' flags=' + JSON.stringify(args.flags) + ' turns=' + (rows.length - 1) + ' failed=' + failed);
  process.exitCode = failed ? 1 : 0;
}

function pickPlayer(trust) {
  const out = {};
  for (const [k, v] of Object.entries(trust)) {
    const [a, b] = k.split('-').map(Number);
    if (a === 0 || b === 0) out[k] = v;
  }
  return out;
}

main().catch(e => { console.error('ERR', e && e.stack || e); process.exitCode = 1; });
