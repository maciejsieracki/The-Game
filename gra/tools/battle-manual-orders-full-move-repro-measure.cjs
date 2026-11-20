'use strict';
// R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-REPRO-Q1: pomiar reprodukcyjny (tylko odczyt; kod gry nietkniety).
// Uruchom z gra/: node tools/battle-manual-orders-full-move-repro-measure.cjs
// Env: RM_MODES="auto,move,attack"  RM_SEEDS="1,2,3"  RM_SCEN="0,1"  RM_CAP=12  RM_MAX_MS=200000  RM_OUT=plik.json
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
const exe = [process.env.CHROMIUM_PATH, (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium')].find(p => p && fs.existsSync(p));
const MODES = (process.env.RM_MODES || 'auto,move,attack').split(',');
const SEEDS = (process.env.RM_SEEDS || '1,2,3').split(',').map(Number);
const CAP = Number(process.env.RM_CAP || 8);
const SPEED = Number(process.env.RM_SPEED || 32);
const MAX_MS = Number(process.env.RM_MAX_MS || 200000);
const SCEN = [
  { name: 'Hastati 6 vs Hastati 6', atk: 'Hastati:6', def: 'Hastati:6' },
  { name: 'mieszana: Hastati 8 + Lucznik 6 + Konnica 4 vs Hastati 14', atk: 'Hastati:8,Lucznik:6,Konnica:4', def: 'Hastati:14' },
];
const only = process.env.RM_SCEN ? process.env.RM_SCEN.split(',').map(Number) : null;

function summarize(rows, ends) {
  const atk = rows.filter(r => r.side === 'atk');
  const mean = xs => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
  const r2 = v => (v === null ? null : Math.round(v * 100) / 100);
  const moving = atk.filter(r => r.steps > 0);
  const endsMoving = ends.filter(e => e.side === 'atk' && moving.some(r => r.round === e.round && r.id === e.id));
  const hexesTotal = {};
  for (const r of atk) hexesTotal[r.id] = (hexesTotal[r.id] ?? 0) + Math.abs(r.q1 - r.q0);
  return {
    unitRounds: atk.length,
    hexPerRoundAll: r2(mean(atk.map(r => r.steps))),
    hexPerRoundWhenMoving: r2(mean(moving.map(r => r.steps))),
    strikesPerRoundAll: r2(mean(atk.map(r => r.attacks))),
    movingUnitRoundsWithStrike: moving.filter(r => r.attacks > 0).length,
    leftoverMpAfterMoving: r2(mean(endsMoving.map(e => e.moveLeft))),
    mpPerRound: r2(mean(atk.map(r => r.mp))),
    meanQDisplacementPerUnit: r2(mean(Object.values(hexesTotal))),
  };
}

(async () => {
  const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: exe, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const out = [];
  try {
    for (const [si, sc] of SCEN.entries()) {
      if (only && !only.includes(si)) continue;
      for (const seed of SEEDS) {
        for (const mode of MODES) {
          const page = await browser.newPage({ viewport: { width: 480, height: 360 } });
          const errors = [];
          page.on('pageerror', e => errors.push(e.message));
          const url = `http://127.0.0.1:${server.httpServer.address().port}/tools/battle-manual-orders-full-move-repro-browser-entry.html?mode=${mode}&seed=${seed}&atk=${sc.atk}&def=${sc.def}&cap=${CAP}&speed=${SPEED}`;
          await page.goto(url, { waitUntil: 'load', timeout: 60000 });
          await page.waitForFunction(() => window.__e2e?.ready === true, undefined, { timeout: 60000 });
          let timedOut = false;
          try { await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: MAX_MS, polling: 500 }); } catch { timedOut = true; }
          const d = await page.evaluate(() => ({ result: window.__e2e.result, rows: window.__e2e.rows, ends: window.__e2e.ends, orders: window.__e2e.orders, attackLog: window.__e2e.attackLog, rounds: window.__e2e.rounds }));
          await page.close();
          const run = { scen: sc.name, seed, mode, timedOut, errors, result: d.result, summary: summarize(d.rows, d.ends), orders: d.orders.length, strikesLogged: d.attackLog.length, rounds: d.rounds.length };
          out.push({ ...run, rows: d.rows, ends: d.ends, attackLog: d.attackLog });
          console.log(JSON.stringify({ scen: sc.name, seed, mode, timedOut, errors, result: d.result, summary: run.summary }));
        }
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
  if (process.env.RM_OUT) fs.writeFileSync(process.env.RM_OUT, JSON.stringify(out, null, 1));
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
