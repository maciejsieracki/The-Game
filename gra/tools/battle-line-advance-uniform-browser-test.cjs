'use strict';
// R-WEB-BATTLE-LINE-ADVANCE-UNIFORM-Q1: zywy Chromium -- rozrzut frontu przed/po + zrzuty sceny bitwy.
// Run z gra/: node tools/battle-line-advance-uniform-browser-test.cjs
// Env: LINE_SCENES="before,after" LINE_TEREN=Las LINE_ROUNDS=10 LINE_SEEDS=1 LINE_OUT=katalog
// "before" wymaga kopii poprzedniej sceny src/battle/battleScene.orig-before.ts (nie commitowanej).
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
const exe = [process.env.CHROMIUM_PATH, '/usr/bin/chromium'].find(p => p && fs.existsSync(p));
const out = process.env.LINE_OUT || path.resolve(root, '..', 'dyspozycje/autobot/runs/R-WEB-BATTLE-LINE-ADVANCE-UNIFORM-Q1/evidence');
const SCENES = (process.env.LINE_SCENES || 'before,after').split(',');
const SEEDS = (process.env.LINE_SEEDS || '1').split(',');
const TEREN = process.env.LINE_TEREN || 'Las';
const ROUNDS = Number(process.env.LINE_ROUNDS || 10);
const SHOT_ROUND = Number(process.env.LINE_SHOT_ROUND || 6);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: exe, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const all = [];
  try {
    for (const seed of SEEDS) for (const sc of SCENES) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/tools/battle-line-advance-uniform-browser-entry.html?scene=${sc}&teren=${TEREN}&seed=${seed}&rounds=${ROUNDS}`, { waitUntil: 'load', timeout: 90000 });
      await page.waitForFunction(() => window.__e2e?.ready === true, undefined, { timeout: 90000 });
      let shot = false;
      const t0 = Date.now();
      while (Date.now() - t0 < 280000) {
        const st = await page.evaluate(() => ({ done: window.__e2e.done, round: window.__scene.roundNo }));
        if (!shot && st.round >= SHOT_ROUND) {
          await page.screenshot({ path: path.join(out, `line-${sc}-${TEREN}-seed${seed}-round${st.round}.png`) });
          shot = true;
        }
        if (st.done) break;
        await page.waitForTimeout(400);
      }
      const rows = await page.evaluate(() => window.__e2e.rows);
      await page.close();
      const rec = { scene: sc, teren: TEREN, seed, errors, rows: rows.map(r => ({ round: r.round, spread: r.spread, n: r.n, min: r.min, max: r.max })) };
      all.push(rec);
      console.log(JSON.stringify(rec));
    }
  } finally { await browser.close(); await server.close(); }
  fs.writeFileSync(path.join(out, `line-browser-${TEREN}.json`), JSON.stringify(all, null, 1));
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
